/**
 * The editor's audio engine: the project's audio tracks as a WebAudio graph, live and offline.
 *
 *   const audio = createAudioEngine(project, { onEnded, onChange });
 *   await audio.preload(p => …)               // decode every audio media (peaks for the timeline)
 *   audio.play(12.5, { loop, rate })          // rate: J/K/L shuttle (negative = reverse)
 *   audio.now()                               // the master clock while playing (what the speakers play now)
 *   audio.setProject(next)                    // live edits: re-scheduled from ~30 ms ahead, micro-crossfaded
 *   audio.peaks(mediaId, src0, src1, 400)     // [min, max] × buckets for waveform drawing
 *   await audio.renderOffline(0, 60)          // the identical graph in an OfflineAudioContext (export)
 *
 * Graph (EDITOR.md "Audio engine"), one builder shared by the live and the offline context:
 *
 *   event voice:  BufferSource ─ event FX ─ fade (fades × event volume line) ─ volume envelope
 *                 ─ StereoPanner (pan envelope) ─ gate ─┐
 *                 A mono source stays MONO into the panner, whose constant-power law puts it at −3 dB per channel at
 *                 centre (the film mix's own upmix level) and at 0 dB on one side when panned hard: no level jump.
 *   track bus:    input ─ track FX ─ duck ─ volume envelope ─ fader (gain, mute/solo) ─ StereoPanner (pan +
 *                 pan envelope) ─ gate ─┐
 *   master:       sum ─ gain ─ limiter (limiter.ts look-ahead brickwall, an AudioWorklet) ─ out ─ destination
 *                                                                              └─ splitter ─ analysers L/R (meters, live only)
 *
 * Every time-varying gain is AudioParam automation from breakpoints (envelope.ts) mapped from timeline time to
 * context time through a PASS clock: c = c0 + (t − t0) / rate. A pass is one linear run of the timeline (play
 * start → loop end; each loop iteration is a new pass starting where the last one ends; a scrub grain; an export
 * chunk). The shuttle rate scales the whole clock, so every ramp, fade and duck speeds up with it, and each
 * source plays at event.rate × |rate| (pitch follows rate, the Vegas default). Reverse plays a reversed copy of
 * the buffer (cached). Voices are scheduled LAZILY, LOOKAHEAD seconds ahead of the context clock; bus automation
 * is written for the whole pass when it starts. The duck is gain automation (duck.ts), so live and offline agree.
 *
 * The live graph differs from the offline one only in the gates: a voice that starts or stops somewhere other
 * than its event's own edges (play from mid-event, a loop seam, a scrub grain, a live edit) ramps over a few ms
 * to avoid clicks. Offline passes have no gate ramps; chunks render with a pre-roll (the limiter's finite memory,
 * delay and reverb tails) and the limiter's look-ahead latency is trimmed, so consecutive renderOffline chunks butt
 * together into one continuous mix (the limiter's state is a function of the last 85 ms of input only, so chunk
 * seams are sample-exact even under sustained limiting).
 *
 * Decoded audio is held in an LRU cache with a byte budget (a 33-minute film decodes to over a gigabyte of
 * float PCM); peaks pyramids are kept for every file ever decoded, so the timeline can draw waveforms of
 * evicted media, and buffers are re-decoded ahead of the play head (PREFETCH).
 *
 * Track.duck attack/release are read with duckTimeSeconds (≥ 5 → milliseconds, the score convention).
 */
import type { AudioEngine, AudioFx, AudioFxKind, EditEvent, Fade, Media, Project, Track } from '../model/types.ts';
import { projectDuration } from '../model/types.ts';
import { LIMITER_PROCESSOR, createLimiterKernel, limiterWorkletUrl } from './limiter.ts';
import { dbToGain, effectiveFades, envelopePoints, fadePoints, mapPoints, shiftPoints, slicePoints, type Point } from './envelope.ts';
import { duckPoints, duckSettings, keySpans, trackAudible } from './duck.ts';

// ---------------------------------------------------------------------------
// tuning
// ---------------------------------------------------------------------------
/** seconds between play() and the first sample (time to build the first voices) */
const START_LATENCY = 0.06;
/** context seconds of voices scheduled ahead of the clock */
const LOOKAHEAD = 1.5;
/** scheduler period (ms); background tabs throttle timers to ~1 s, which LOOKAHEAD covers */
const TICK_MS = 100;
/** a voice is never scheduled to start sooner than this after currentTime (s) */
const SCHEDULE_MARGIN = 0.02;
/** timeline seconds of buffers decoded ahead of the play head (scaled by |rate|) */
const PREFETCH = 20;
/** wait at most this long (ms) for the first second's buffers before starting playback anyway */
const START_WAIT_MS = 400;
/** gate ramp (s) for voices that start/stop away from their event's edges (live) */
const EDGE_RAMP = 0.004;
/** a live edit takes effect this far ahead of currentTime (s) */
const RESCHEDULE_LEAD = 0.03;
/** micro-crossfade (s) when voices or buses are replaced live, and when params glide to a new value */
const XFADE = 0.012;
/**
 * A mono source reaches the stereo bus at −3.01 dB per channel (constant-power centre). This is the film mix's
 * own rule — mix.mjs upmixes the mono narration stem with ffmpeg's `aformat=channel_layouts=stereo`, whose
 * centre mix level is 1/√2 — and Vegas's constant-power pan law. The StereoPanner gives it for free on a MONO
 * input; this factor is applied only when an event FX turns a mono source stereo before the panner (a reverb's
 * stereo impulse), where the panner would otherwise pass it at full level.
 */
const MONO_CENTRE_GAIN = Math.SQRT1_2;
/** scrubbing: grain length, its gate ramps, and the minimum interval between grains (s) */
const SCRUB_GRAIN = 0.09;
const SCRUB_RAMP = 0.012;
const SCRUB_MIN_INTERVAL = 0.035;
/** offline: base pre-roll (s) before a chunk so the limiter has settled */
const PREROLL_BASE = 0.5;
const PREROLL_MAX = 6;
/** decoded-PCM cache budget default (MB of float32) */
const DEFAULT_CACHE_MB = 768;
/** samples per bucket of the finest peaks level */
export const PEAK_BLOCK = 256;
/** meter floor (dBFS) reported for silence */
export const METER_FLOOR = -120;
/** reverb impulses kept (each up to 10 s of stereo float: ~3.8 MB at 48 kHz) */
const IMPULSE_CACHE = 6;

// ---------------------------------------------------------------------------
// audio FX parameters (the inspector reads this table)
// ---------------------------------------------------------------------------
export interface AudioFxParamSpec {
  key: string;
  label: string;
  min: number;
  max: number;
  default: number;
  unit: 'dB' | 'Hz' | 's' | ':1' | '' | '%';
  /** logarithmic slider (frequencies) */
  log?: boolean;
}

/** parameters of every audio FX kind, with ranges and defaults (AudioFx.params keys) */
export const AUDIO_FX_PARAMS: Record<AudioFxKind, readonly AudioFxParamSpec[]> = {
  eq3: [
    { key: 'lowDb', label: 'Low', min: -24, max: 24, default: 0, unit: 'dB' },
    { key: 'midDb', label: 'Mid', min: -24, max: 24, default: 0, unit: 'dB' },
    { key: 'highDb', label: 'High', min: -24, max: 24, default: 0, unit: 'dB' },
    { key: 'lowHz', label: 'Low freq', min: 40, max: 1000, default: 250, unit: 'Hz', log: true },
    { key: 'midHz', label: 'Mid freq', min: 200, max: 8000, default: 1000, unit: 'Hz', log: true },
    { key: 'highHz', label: 'High freq', min: 1000, max: 16000, default: 4000, unit: 'Hz', log: true },
    { key: 'midQ', label: 'Mid Q', min: 0.1, max: 10, default: 0.7, unit: '' },
  ],
  compressor: [
    { key: 'threshold', label: 'Threshold', min: -60, max: 0, default: -24, unit: 'dB' },
    { key: 'ratio', label: 'Ratio', min: 1, max: 20, default: 4, unit: ':1' },
    { key: 'attack', label: 'Attack', min: 0, max: 1, default: 0.003, unit: 's' },
    { key: 'release', label: 'Release', min: 0.01, max: 1, default: 0.25, unit: 's' },
    { key: 'knee', label: 'Knee', min: 0, max: 40, default: 6, unit: 'dB' },
    // WebAudio's compressor already applies an automatic make-up gain; this is on top of it
    { key: 'makeupDb', label: 'Output', min: -24, max: 24, default: 0, unit: 'dB' },
  ],
  highpass: [
    { key: 'freq', label: 'Cutoff', min: 20, max: 2000, default: 80, unit: 'Hz', log: true },
    { key: 'q', label: 'Q', min: 0.1, max: 10, default: 0.707, unit: '' },
  ],
  lowpass: [
    { key: 'freq', label: 'Cutoff', min: 200, max: 20000, default: 12000, unit: 'Hz', log: true },
    { key: 'q', label: 'Q', min: 0.1, max: 10, default: 0.707, unit: '' },
  ],
  delay: [
    { key: 'time', label: 'Time', min: 0.01, max: 2, default: 0.25, unit: 's' },
    { key: 'feedback', label: 'Feedback', min: 0, max: 0.95, default: 0.3, unit: '' },
    { key: 'mix', label: 'Wet', min: 0, max: 1, default: 0.25, unit: '' },
    { key: 'damp', label: 'Damping', min: 500, max: 20000, default: 6000, unit: 'Hz', log: true },
  ],
  reverb: [
    { key: 'decay', label: 'Decay (RT60)', min: 0.1, max: 8, default: 1.8, unit: 's' },
    { key: 'mix', label: 'Wet', min: 0, max: 1, default: 0.25, unit: '' },
    { key: 'predelay', label: 'Pre-delay', min: 0, max: 0.2, default: 0.01, unit: 's' },
    { key: 'damp', label: 'Damping', min: 0, max: 1, default: 0.5, unit: '' },
  ],
};

/** an FX parameter value, defaulted and clamped to its spec */
export function fxParam(fx: AudioFx, key: string): number {
  const spec = AUDIO_FX_PARAMS[fx.kind]?.find((s) => s.key === key);
  const raw = fx.params?.[key];
  const v = typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
  if (!spec) return v ?? 0;
  const x = v ?? spec.default;
  return Math.min(spec.max, Math.max(spec.min, x));
}

/** seconds an FX keeps ringing after its input stops (reverb decay, delay repeats to −60 dB) */
export function fxTail(fx: AudioFx): number {
  if (!fx.enabled) return 0;
  if (fx.kind === 'reverb') return fxParam(fx, 'decay') + fxParam(fx, 'predelay');
  if (fx.kind === 'delay') {
    const fb = fxParam(fx, 'feedback');
    const repeats = fb > 0.001 ? Math.log(0.001) / Math.log(fb) : 1;
    return fxParam(fx, 'time') * Math.min(40, repeats + 1);
  }
  return 0;
}

// ---------------------------------------------------------------------------
// peaks: multi-resolution min/max pyramid (pure; node-testable)
// ---------------------------------------------------------------------------
export interface PeakLevel {
  /** samples per bucket */
  block: number;
  /** [min, max] interleaved per bucket, over all channels */
  data: Float32Array;
}
export interface PeakPyramid {
  sampleRate: number;
  /** frames */
  length: number;
  /** finest first; each level halves the previous one */
  levels: PeakLevel[];
}

/** build the min/max pyramid of decoded channels: level 0 at `block` samples per bucket, then ×2 per level */
export function buildPeakPyramid(channels: readonly Float32Array[], sampleRate: number, block = PEAK_BLOCK): PeakPyramid {
  const length = channels.length ? channels[0].length : 0;
  const n0 = Math.max(1, Math.ceil(length / block));
  const d0 = new Float32Array(n0 * 2);
  for (let j = 0; j < n0; j++) {
    const i0 = j * block;
    const i1 = Math.min(length, i0 + block);
    let lo = Infinity;
    let hi = -Infinity;
    for (const ch of channels) {
      for (let i = i0; i < i1; i++) {
        const x = ch[i];
        if (x < lo) lo = x;
        if (x > hi) hi = x;
      }
    }
    d0[j * 2] = lo === Infinity ? 0 : lo;
    d0[j * 2 + 1] = hi === -Infinity ? 0 : hi;
  }
  const levels: PeakLevel[] = [{ block, data: d0 }];
  let prev = levels[0];
  while (prev.data.length / 2 > 8) {
    const n = Math.ceil(prev.data.length / 4);
    const d = new Float32Array(n * 2);
    const pn = prev.data.length / 2;
    for (let j = 0; j < n; j++) {
      const a = 2 * j;
      const b = Math.min(pn - 1, a + 1);
      d[j * 2] = Math.min(prev.data[a * 2], prev.data[b * 2]);
      d[j * 2 + 1] = Math.max(prev.data[a * 2 + 1], prev.data[b * 2 + 1]);
    }
    prev = { block: prev.block * 2, data: d };
    levels.push(prev);
  }
  return { sampleRate, length, levels };
}

/**
 * `buckets` × [min, max] over source seconds [src0, src1]. Reads raw samples when a bucket is finer than the
 * pyramid's finest level (and `raw` is available), else the coarsest level that still has ≥ 1 block per bucket.
 * Outside the media: zeros.
 */
export function readPeaks(pyr: PeakPyramid, raw: readonly Float32Array[] | null, src0: number, src1: number, buckets: number): Float32Array {
  const nb = Math.max(0, Math.floor(buckets));
  const out = new Float32Array(nb * 2);
  if (nb === 0 || !(src1 > src0) || pyr.length === 0) return out;
  const sr = pyr.sampleRate;
  const spb = ((src1 - src0) * sr) / nb;
  const L = pyr.length;
  if (raw && raw.length && spb < pyr.levels[0].block) {
    for (let b = 0; b < nb; b++) {
      const i0 = Math.floor((src0 * sr) + b * spb);
      const i1 = Math.max(i0 + 1, Math.floor(src0 * sr + (b + 1) * spb));
      const a = Math.max(0, i0);
      const z = Math.min(L, i1);
      if (z <= a) continue;
      let lo = Infinity;
      let hi = -Infinity;
      for (const ch of raw) {
        for (let i = a; i < z; i++) {
          const x = ch[i];
          if (x < lo) lo = x;
          if (x > hi) hi = x;
        }
      }
      out[b * 2] = lo;
      out[b * 2 + 1] = hi;
    }
    return out;
  }
  let lv = pyr.levels[0];
  for (const l of pyr.levels) if (l.block <= spb) lv = l;
  const nBlocks = lv.data.length / 2;
  for (let b = 0; b < nb; b++) {
    const s0 = src0 * sr + b * spb;
    const s1 = s0 + spb;
    if (s1 <= 0 || s0 >= L) continue;
    const j0 = Math.max(0, Math.floor(s0 / lv.block));
    const j1 = Math.min(nBlocks, Math.max(j0 + 1, Math.ceil(s1 / lv.block)));
    let lo = Infinity;
    let hi = -Infinity;
    for (let j = j0; j < j1; j++) {
      if (lv.data[j * 2] < lo) lo = lv.data[j * 2];
      if (lv.data[j * 2 + 1] > hi) hi = lv.data[j * 2 + 1];
    }
    if (lo !== Infinity) {
      out[b * 2] = lo;
      out[b * 2 + 1] = hi;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// project helpers (pure)
// ---------------------------------------------------------------------------
/** the URL an event's media plays from, if it has audio (audio files; video files that carry audio) */
export function playableUrl(m: Media | undefined): string | null {
  if (!m) return null;
  if (m.kind === 'audio') return m.url;
  if (m.kind === 'video' && m.hasAudio) return m.url;
  return null;
}

/** project end (s): the end of the last event on any track */
const projectEnd = projectDuration;

/** does this FX list turn a mono input stereo (a reverb's stereo impulse)? */
const stereoFx = (list: readonly AudioFx[] | undefined): boolean => !!list?.some((f) => f.enabled && f.kind === 'reverb');

/** per audio track, everything the scheduler derives from the project once per setProject */
interface TrackPlan {
  track: Track;
  audible: boolean;
  /** effective fades (auto-crossfade on overlaps) */
  fades: Map<string, { fadeIn: Fade; fadeOut: Fade }>;
  /** duck automation as GAIN breakpoints on the timeline, or null (no duck) */
  duck: Point[] | null;
}

function buildPlans(p: Project): Map<string, TrackPlan> {
  const plans = new Map<string, TrackPlan>();
  for (const track of p.tracks) {
    if (track.kind !== 'audio') continue;
    let duck: Point[] | null = null;
    if (track.duck && track.duck.by.length > 0) {
      const db = duckPoints(keySpans(p, track.duck.by), duckSettings(track.duck));
      duck = db.length ? mapPoints(db, dbToGain) : null;
    }
    plans.set(track.id, { track, audible: trackAudible(p.tracks, track), fades: effectiveFades(track.events), duck });
  }
  return plans;
}

/** pre-roll (s) an offline chunk needs for the graph's state (limiter, FX tails) to match a continuous render */
export function prerollSeconds(p: Project): number {
  let tail = 0;
  for (const tr of p.tracks) {
    if (tr.kind !== 'audio') continue;
    for (const fx of tr.audioFx ?? []) tail = Math.max(tail, fxTail(fx));
    for (const e of tr.events) for (const fx of e.audioFx ?? []) tail = Math.max(tail, fxTail(fx));
  }
  return Math.min(PREROLL_MAX, PREROLL_BASE + tail);
}

const clampPan = (v: number): number => (v < -1 ? -1 : v > 1 ? 1 : v);

// ---------------------------------------------------------------------------
// FX nodes
// ---------------------------------------------------------------------------
interface FxChain {
  input: AudioNode;
  output: AudioNode;
  nodes: AudioNode[];
}

/** small deterministic PRNG (mulberry32): the reverb impulse is identical in every context */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const impulses = new Map<string, AudioBuffer>();

/**
 * A generated stereo room impulse: decorrelated noise per channel with an exponential decay reaching −60 dB at
 * `decay` (RT60), darkened over time by a one-pole low-pass whose coefficient falls with `damp`. Seeded, and cached
 * per (sample rate, decay, damp) in a small LRU. The parameters are rounded to 10 ms / 0.01 FIRST (inaudible steps),
 * so dragging the Decay slider reuses impulses instead of piling up hundreds of MB, and the live and offline graphs
 * always build the identical impulse. The ConvolverNode normalises it.
 */
function reverbImpulse(sampleRate: number, decayIn: number, dampIn: number): AudioBuffer {
  const decay = Math.max(0.01, Math.round(decayIn * 100) / 100);
  const damp = Math.round(dampIn * 100) / 100;
  const key = `${sampleRate}|${decay}|${damp}`;
  const hit = impulses.get(key);
  if (hit) {
    impulses.delete(key); // LRU: most recent last
    impulses.set(key, hit);
    return hit;
  }
  const length = Math.max(1, Math.ceil(sampleRate * Math.min(10, decay * 1.1)));
  const buf = new AudioBuffer({ length, numberOfChannels: 2, sampleRate });
  const k = Math.log(1000) / (decay * sampleRate); // amplitude e^(−k·i): −60 dB at RT60
  for (let c = 0; c < 2; c++) {
    const rnd = mulberry32(0x7e7b + c * 7919);
    const d = buf.getChannelData(c);
    let y = 0;
    for (let i = 0; i < length; i++) {
      const x = (rnd() * 2 - 1) * Math.exp(-k * i);
      const a = 1 - damp * 0.92 * Math.min(1, i / length);
      y += a * (x - y);
      d[i] = y;
    }
  }
  impulses.set(key, buf);
  while (impulses.size > IMPULSE_CACHE) {
    const oldest = impulses.keys().next().value;
    if (oldest === undefined) break;
    impulses.delete(oldest);
  }
  return buf;
}

/** one FX as nodes (input → … → output) */
function fxNodes(ctx: BaseAudioContext, fx: AudioFx): FxChain {
  const P = (k: string): number => fxParam(fx, k);
  switch (fx.kind) {
    case 'eq3': {
      const low = new BiquadFilterNode(ctx, { type: 'lowshelf', frequency: P('lowHz'), gain: P('lowDb') });
      const mid = new BiquadFilterNode(ctx, { type: 'peaking', frequency: P('midHz'), Q: P('midQ'), gain: P('midDb') });
      const high = new BiquadFilterNode(ctx, { type: 'highshelf', frequency: P('highHz'), gain: P('highDb') });
      low.connect(mid).connect(high);
      return { input: low, output: high, nodes: [low, mid, high] };
    }
    case 'compressor': {
      const comp = new DynamicsCompressorNode(ctx, { threshold: P('threshold'), ratio: P('ratio'), attack: P('attack'), release: P('release'), knee: P('knee') });
      const makeup = new GainNode(ctx, { gain: dbToGain(P('makeupDb')) });
      comp.connect(makeup);
      return { input: comp, output: makeup, nodes: [comp, makeup] };
    }
    case 'highpass':
    case 'lowpass': {
      const f = new BiquadFilterNode(ctx, { type: fx.kind, frequency: P('freq'), Q: P('q') });
      return { input: f, output: f, nodes: [f] };
    }
    case 'delay': {
      const input = new GainNode(ctx);
      const output = new GainNode(ctx);
      const delay = new DelayNode(ctx, { maxDelayTime: 2.5, delayTime: P('time') });
      const damp = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: P('damp'), Q: 0.5 });
      const fb = new GainNode(ctx, { gain: P('feedback') });
      const wet = new GainNode(ctx, { gain: P('mix') });
      input.connect(output); // dry stays at unity; the repeats are added
      input.connect(delay);
      delay.connect(damp).connect(fb).connect(delay);
      delay.connect(wet).connect(output);
      return { input, output, nodes: [input, output, delay, damp, fb, wet] };
    }
    case 'reverb': {
      const mix = P('mix');
      const input = new GainNode(ctx);
      const output = new GainNode(ctx);
      const dry = new GainNode(ctx, { gain: 1 - mix });
      const pre = new DelayNode(ctx, { maxDelayTime: 0.25, delayTime: P('predelay') });
      const conv = new ConvolverNode(ctx, { buffer: reverbImpulse(ctx.sampleRate, P('decay'), P('damp')) });
      const wet = new GainNode(ctx, { gain: mix });
      input.connect(dry).connect(output);
      input.connect(pre).connect(conv).connect(wet).connect(output);
      return { input, output, nodes: [input, output, dry, pre, conv, wet] };
    }
  }
}

/** an FX list as one chain (a pass-through gain when nothing is enabled) */
function buildFx(ctx: BaseAudioContext, list: readonly AudioFx[] | undefined): FxChain {
  const parts = (list ?? []).filter((f) => f.enabled && AUDIO_FX_PARAMS[f.kind]).map((f) => fxNodes(ctx, f));
  if (parts.length === 0) {
    const g = new GainNode(ctx);
    return { input: g, output: g, nodes: [g] };
  }
  for (let i = 1; i < parts.length; i++) parts[i - 1].output.connect(parts[i].input);
  return { input: parts[0].input, output: parts[parts.length - 1].output, nodes: parts.flatMap((p) => p.nodes) };
}

const disconnectAll = (nodes: readonly AudioNode[]): void => {
  for (const n of nodes) {
    try {
      n.disconnect();
    } catch {
      /* already disconnected */
    }
  }
};

// ---------------------------------------------------------------------------
// the graph (shared by live and offline)
// ---------------------------------------------------------------------------
interface Bus {
  trackId: string;
  /** identity of the bus FX chain (a change rebuilds the bus) */
  fxKey: string;
  input: GainNode;
  fx: FxChain;
  duck: GainNode;
  env: GainNode;
  fader: GainNode;
  pan: StereoPannerNode;
  gate: GainNode;
  nodes: AudioNode[];
}

interface Graph {
  ctx: BaseAudioContext;
  sum: GainNode;
  master: GainNode;
  /** the limiter worklet between master and out (null until the live context has loaded the worklet module) */
  limiter: AudioWorkletNode | null;
  /** the ceiling the limiter was last told (dB) */
  ceilingDb: number;
  out: GainNode;
  analysers: [AnalyserNode, AnalyserNode] | null;
  buses: Map<string, Bus>;
  nodes: AudioNode[];
}

const fxKeyOf = (t: Track): string => JSON.stringify(t.audioFx ?? []);

/** the limiter worklet node for a context that has loaded limiter.ts's module */
function limiterNode(ctx: BaseAudioContext, ceilingDb: number): AudioWorkletNode {
  return new AudioWorkletNode(ctx, LIMITER_PROCESSOR, {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [2],
    channelCount: 2,
    channelCountMode: 'explicit',
    channelInterpretation: 'speakers',
    processorOptions: { sampleRate: ctx.sampleRate, ceilingDb: Math.min(0, ceilingDb) },
  });
}

/** splice a limiter between master and out (replacing the direct connection or a previous limiter) */
function insertLimiter(g: Graph, node: AudioWorkletNode): void {
  g.master.disconnect();
  if (g.limiter) g.limiter.disconnect();
  g.master.connect(node).connect(g.out);
  g.limiter = node;
  g.nodes.push(node);
}

/**
 * The shared graph. `limiter` is a ready worklet node (offline renders load the module first); the live context
 * starts with master wired straight to out and splices the limiter in once its module has loaded (insertLimiter),
 * which happens long before the first play (audio preload takes far longer).
 */
function createGraph(ctx: BaseAudioContext, p: Project, meters: boolean, limiter: AudioWorkletNode | null): Graph {
  const stereo = { channelCount: 2, channelCountMode: 'explicit', channelInterpretation: 'speakers' } as const;
  const sum = new GainNode(ctx, stereo);
  const master = new GainNode(ctx, { ...stereo, gain: dbToGain(p.master.gainDb) });
  const out = new GainNode(ctx, stereo);
  if (limiter) master.connect(limiter).connect(out);
  else master.connect(out);
  sum.connect(master);
  out.connect(ctx.destination);
  const nodes: AudioNode[] = [sum, master, out, ...(limiter ? [limiter] : [])];
  let analysers: [AnalyserNode, AnalyserNode] | null = null;
  if (meters) {
    const split = new ChannelSplitterNode(ctx, { numberOfOutputs: 2 });
    const l = new AnalyserNode(ctx, { fftSize: 2048 });
    const r = new AnalyserNode(ctx, { fftSize: 2048 });
    out.connect(split);
    split.connect(l, 0);
    split.connect(r, 1);
    analysers = [l, r];
    nodes.push(split, l, r);
  }
  const g: Graph = { ctx, sum, master, limiter, ceilingDb: Math.min(0, p.master.limiterDb), out, analysers, buses: new Map(), nodes };
  for (const tr of p.tracks) if (tr.kind === 'audio') g.buses.set(tr.id, createBus(g, tr));
  return g;
}

function createBus(g: Graph, track: Track): Bus {
  const ctx = g.ctx;
  const input = new GainNode(ctx, { channelCount: 2, channelCountMode: 'explicit', channelInterpretation: 'speakers' });
  const fx = buildFx(ctx, track.audioFx);
  const duck = new GainNode(ctx);
  const env = new GainNode(ctx);
  const fader = new GainNode(ctx);
  const pan = new StereoPannerNode(ctx);
  const gate = new GainNode(ctx);
  input.connect(fx.input);
  fx.output.connect(duck).connect(env).connect(fader).connect(pan).connect(gate).connect(g.sum);
  return { trackId: track.id, fxKey: fxKeyOf(track), input, fx, duck, env, fader, pan, gate, nodes: [input, ...fx.nodes, duck, env, fader, pan, gate] };
}

// ---------------------------------------------------------------------------
// passes and automation
// ---------------------------------------------------------------------------
interface Voice {
  trackId: string;
  url: string;
  src: AudioBufferSourceNode;
  gate: GainNode;
  nodes: AudioNode[];
  /** context time the voice stops */
  cEnd: number;
}

/** one linear run of the timeline on the context clock */
interface Pass {
  /** clock: c = c0 + (t − t0) / rate */
  t0: number;
  c0: number;
  rate: number;
  /** timeline range played (lo < hi), in either direction */
  lo: number;
  hi: number;
  /** context time the pass ends */
  cEnd: number;
  /** gate ramp (s) for voices cut away from their event edges (0 = none, offline) */
  edge: number;
  /** a loop pass hands over to another iteration at its end */
  wraps: boolean;
  /** scheduled voices by `trackId/eventId` (null = nothing to play for that event in this pass) */
  voices: Map<string, Voice | null>;
}

const toCtx = (p: Pass, t: number): number => p.c0 + (t - p.t0) / p.rate;
const toTl = (p: Pass, c: number): number => p.t0 + (c - p.c0) * p.rate;

function makePass(t0: number, c0: number, rate: number, lo: number, hi: number, edge: number, wraps: boolean): Pass {
  const p: Pass = { t0, c0, rate, lo, hi, cEnd: c0, edge, wraps, voices: new Map() };
  p.cEnd = toCtx(p, rate > 0 ? hi : lo);
  return p;
}

/** freeze a param's automation at `at` (keeping the value it has there) */
function holdParam(param: AudioParam, at: number): void {
  if (typeof param.cancelAndHoldAtTime === 'function') param.cancelAndHoldAtTime(at);
  else {
    param.cancelScheduledValues(at);
    param.setValueAtTime(param.value, at);
  }
}

type AutomationMode =
  /** append after existing automation (a fresh node, or the next loop pass) */
  | { kind: 'append' }
  /** drop automation from the first point on, then set (a new play/scrub on a persistent bus) */
  | { kind: 'reset' }
  /** hold at `at`, glide to the new curve by the first point (a live edit) */
  | { kind: 'glide'; at: number };

/**
 * Write timeline breakpoints `pts` onto `param` for the pass window [cFrom, cTo] (context seconds). The window is
 * converted to timeline time, the points sliced to it and mapped to context time (reversed for reverse passes:
 * a step's two points then swap order, which is right for a clock running backwards).
 */
function automate(param: AudioParam, pts: readonly Point[], pass: Pass, cFrom: number, cTo: number, mode: AutomationMode): void {
  if (!(cTo > cFrom) || pts.length === 0) return;
  const ta = toTl(pass, cFrom);
  const tb = toTl(pass, cTo);
  const seg = slicePoints(pts, Math.min(ta, tb), Math.max(ta, tb));
  if (seg.length === 0) return;
  const cs = seg.map((p) => ({ c: toCtx(pass, p.t), v: p.v }));
  if (pass.rate < 0) cs.reverse();
  if (mode.kind === 'glide') {
    holdParam(param, mode.at);
    param.linearRampToValueAtTime(cs[0].v, cs[0].c);
  } else {
    if (mode.kind === 'reset') param.cancelScheduledValues(cs[0].c);
    param.setValueAtTime(cs[0].v, cs[0].c);
  }
  for (let i = 1; i < cs.length; i++) param.linearRampToValueAtTime(cs[i].v, cs[i].c);
}

const constant = (v: number, a: number, b: number): Point[] => [
  { t: a, v },
  { t: b, v },
];

/** write a bus's automation (duck, volume envelope, fader, pan) for the pass window [cFrom, cTo] */
function automateBus(bus: Bus, plan: TrackPlan, pass: Pass, cFrom: number, cTo: number, mode: AutomationMode): void {
  const tr = plan.track;
  const ta = Math.min(toTl(pass, cFrom), toTl(pass, cTo));
  const tb = Math.max(toTl(pass, cFrom), toTl(pass, cTo));
  automate(bus.duck.gain, plan.duck ?? constant(1, ta, tb), pass, cFrom, cTo, mode);
  automate(bus.env.gain, envelopePoints(tr.envelopes?.volume, ta, tb, dbToGain, 0), pass, cFrom, cTo, mode);
  automate(bus.fader.gain, constant(plan.audible ? dbToGain(tr.gainDb ?? 0) : 0, ta, tb), pass, cFrom, cTo, mode);
  const base = tr.pan ?? 0;
  automate(bus.pan.pan, envelopePoints(tr.envelopes?.pan, ta, tb, (v) => clampPan(base + v), 0), pass, cFrom, cTo, mode);
}

/** master params (constant): set at `at`, or glide there from the current value */
function automateMaster(g: Graph, p: Project, at: number, glide: boolean): void {
  const set = (param: AudioParam, v: number): void => {
    if (glide) {
      holdParam(param, at);
      param.linearRampToValueAtTime(v, at + XFADE);
    } else {
      param.cancelScheduledValues(at);
      param.setValueAtTime(v, at);
    }
  };
  set(g.master.gain, dbToGain(p.master.gainDb));
  const ceilingDb = Math.min(0, p.master.limiterDb);
  if (ceilingDb !== g.ceilingDb) {
    g.ceilingDb = ceilingDb;
    g.limiter?.port.postMessage({ ceilingDb });
  }
}

/**
 * Schedule one event's voice for the timeline portion [a, b] of `pass` (already clipped to what may still be
 * scheduled). Returns null when nothing of the media falls in the portion.
 */
function scheduleVoice(g: Graph, bus: Bus, plan: TrackPlan, pass: Pass, e: EditEvent, url: string, buffer: AudioBuffer, reversed: AudioBuffer | null, a: number, b: number): Voice | null {
  const r = e.rate > 0 ? e.rate : 1;
  const bufDur = buffer.duration;
  const end = e.start + e.length;
  // timeline span where the source time lies inside the file
  const vlo = e.start + (0 - e.srcIn) / r;
  const vhi = e.start + (bufDur - e.srcIn) / r;
  const natLo = Math.max(e.start, vlo);
  const natHi = Math.min(end, vhi);
  const p0 = Math.max(a, natLo);
  const p1 = Math.min(b, natHi);
  if (p1 - p0 < 1e-4) return null;
  const fwd = pass.rate > 0;
  if (!fwd && !reversed) return null;
  const ctx = g.ctx;
  const cA = toCtx(pass, fwd ? p0 : p1);
  const cB = toCtx(pass, fwd ? p1 : p0);
  const srcAt = (t: number): number => e.srcIn + (t - e.start) * r;
  const offset = fwd ? srcAt(p0) : bufDur - srcAt(p1);
  const src = new AudioBufferSourceNode(ctx, { buffer: fwd ? buffer : reversed, playbackRate: r * Math.abs(pass.rate) });
  const fx = buildFx(ctx, e.audioFx);
  // default channel handling ('max'): a mono source stays mono up to the panner (see the header)
  const fade = new GainNode(ctx);
  const env = new GainNode(ctx);
  const pan = new StereoPannerNode(ctx);
  const gate = new GainNode(ctx);
  src.connect(fx.input);
  fx.output.connect(fade).connect(env).connect(pan).connect(gate).connect(bus.input);
  const append: AutomationMode = { kind: 'append' };
  const cLo = Math.min(cA, cB);
  const cHi = Math.max(cA, cB);
  // fades × event volume line (event-relative → timeline)
  const fades = plan.fades.get(e.id) ?? { fadeIn: e.fadeIn, fadeOut: e.fadeOut };
  const level = dbToGain(e.gainDb ?? 0) * (buffer.numberOfChannels === 1 && stereoFx(e.audioFx) ? MONO_CENTRE_GAIN : 1);
  automate(fade.gain, shiftPoints(fadePoints(e.length, fades.fadeIn, fades.fadeOut, level), e.start), pass, cLo, cHi, append);
  const vol = e.envelopes?.volume;
  if (vol && vol.length) automate(env.gain, shiftPoints(envelopePoints(vol, p0 - e.start, p1 - e.start, dbToGain, 0), e.start), pass, cLo, cHi, append);
  const pe = e.envelopes?.pan;
  if (pe && pe.length) automate(pan.pan, shiftPoints(envelopePoints(pe, p0 - e.start, p1 - e.start, clampPan, 0), e.start), pass, cLo, cHi, append);
  // gate ramps where the voice is cut away from its event's own edges
  if (pass.edge > 0) {
    const cutIn = fwd ? p0 > natLo + 1e-6 : p1 < natHi - 1e-6;
    const cutOut = fwd ? p1 < natHi - 1e-6 : p0 > natLo + 1e-6;
    const ramp = Math.min(pass.edge, (cHi - cLo) / 2);
    gate.gain.setValueAtTime(cutIn ? 0 : 1, cLo);
    if (cutIn) gate.gain.linearRampToValueAtTime(1, cLo + ramp);
    if (cutOut) {
      gate.gain.setValueAtTime(1, cHi - ramp);
      gate.gain.linearRampToValueAtTime(0, cHi);
    }
  }
  const nodes: AudioNode[] = [src, ...fx.nodes, fade, env, pan, gate];
  if (fwd && r === 1 && pass.rate === 1 && buffer.sampleRate === ctx.sampleRate) {
    // Sample-exact placement: buffer sample m always plays at context sample m + align, whether the voice starts
    // inside this pass or is already sounding at its start (an export chunk's first sample). Left to fractional
    // start times and offsets, the browser resamples the two cases with different sub-sample phases, so a chunked
    // export differed from a one-shot render wherever a voice straddled a chunk boundary.
    const sr = ctx.sampleRate;
    const align = Math.round((toCtx(pass, e.start) - e.srcIn) * sr);
    let s0 = Math.ceil(toCtx(pass, p0) * sr - 1e-6);
    const s1 = Math.ceil(toCtx(pass, p1) * sr - 1e-6);
    let m0 = s0 - align;
    if (m0 < 0) {
      s0 -= m0;
      m0 = 0;
    }
    if (s1 <= s0) {
      disconnectAll(nodes);
      return null;
    }
    src.start(s0 / sr, m0 / sr, (s1 - s0) / sr);
  } else src.start(cA, Math.max(0, offset), (p1 - p0) * r);
  src.onended = () => disconnectAll(nodes);
  return { trackId: plan.track.id, url, src, gate, nodes, cEnd: cHi };
}

/** fade a voice out over `dur` from `at` and stop it (live replacement, stop, scrub hand-over) */
function releaseVoice(v: Voice, at: number, dur = XFADE): void {
  try {
    holdParam(v.gate.gain, at);
    v.gate.gain.linearRampToValueAtTime(0, at + dur);
    v.src.stop(at + dur + 0.002);
  } catch {
    /* never started or already stopped */
    disconnectAll(v.nodes);
  }
}

/** buffer access the scheduler needs (the live store, or the offline render's pinned set) */
interface BufferSource {
  get(url: string): AudioBuffer | null;
  reversed(url: string): AudioBuffer | null;
  request(url: string): void;
}

/**
 * Schedule every not-yet-scheduled event voice that sounds in the pass's timeline window [wLo, wHi]. A voice
 * plays from the later of its event start and `from` (forward; mirrored in reverse) to the pass end.
 */
function scheduleWindow(g: Graph, project: Project, plans: Map<string, TrackPlan>, buffers: BufferSource, pass: Pass, wLo: number, wHi: number, from: number): void {
  const fwd = pass.rate > 0;
  for (const plan of plans.values()) {
    const bus = g.buses.get(plan.track.id);
    if (!bus) continue;
    for (const e of plan.track.events) {
      if (e.mute || !(e.length > 0)) continue;
      const es = e.start;
      const ee = e.start + e.length;
      if (ee <= wLo || es >= wHi) continue;
      const key = `${plan.track.id}/${e.id}`;
      if (pass.voices.has(key)) continue;
      const url = playableUrl(project.media[e.mediaId]);
      if (!url) {
        pass.voices.set(key, null);
        continue;
      }
      const buf = buffers.get(url);
      if (!buf) {
        buffers.request(url);
        continue;
      }
      const rev = fwd ? null : buffers.reversed(url);
      const a = fwd ? Math.max(es, from) : pass.lo;
      const b = fwd ? pass.hi : Math.min(ee, from);
      pass.voices.set(key, scheduleVoice(g, bus, plan, pass, e, url, buf, rev, a, b));
    }
  }
}

// ---------------------------------------------------------------------------
// decoded-buffer cache (LRU with a byte budget; peaks kept forever)
// ---------------------------------------------------------------------------
interface CacheEntry {
  buffer: AudioBuffer | null;
  reversed: AudioBuffer | null;
  pending: Promise<AudioBuffer> | null;
  peaks: PeakPyramid | null;
  error: string | null;
  lastUse: number;
}

const bufferBytes = (b: AudioBuffer | null): number => (b ? b.length * b.numberOfChannels * 4 : 0);
const channelsOf = (b: AudioBuffer): Float32Array[] => Array.from({ length: b.numberOfChannels }, (_, c) => b.getChannelData(c));

function createBufferStore(opts: {
  decoder: () => BaseAudioContext;
  fetchFn: (url: string) => Promise<Response>;
  resolveUrl: (url: string) => string;
  budgetBytes: number;
  pinned: () => Set<string>;
  onReady: (url: string) => void;
}) {
  const entries = new Map<string, CacheEntry>();
  let bytes = 0;
  let clock = 0;
  const entry = (url: string): CacheEntry => {
    let e = entries.get(url);
    if (!e) {
      e = { buffer: null, reversed: null, pending: null, peaks: null, error: null, lastUse: 0 };
      entries.set(url, e);
    }
    return e;
  };
  const evict = (): void => {
    if (bytes <= opts.budgetBytes) return;
    const pins = opts.pinned();
    const lru = [...entries.entries()].filter(([u, e]) => e.buffer && !pins.has(u)).sort((a, b) => a[1].lastUse - b[1].lastUse);
    for (const [, e] of lru) {
      if (bytes <= opts.budgetBytes) break;
      bytes -= bufferBytes(e.buffer) + bufferBytes(e.reversed);
      e.buffer = null;
      e.reversed = null;
    }
  };
  const load = (url: string): Promise<AudioBuffer> => {
    const e = entry(url);
    e.lastUse = ++clock;
    if (e.buffer) return Promise.resolve(e.buffer);
    if (e.pending) return e.pending;
    e.error = null;
    e.pending = opts
      .fetchFn(opts.resolveUrl(url))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((ab) => opts.decoder().decodeAudioData(ab))
      .then((buf) => {
        e.buffer = buf;
        e.lastUse = ++clock;
        bytes += bufferBytes(buf);
        if (!e.peaks) e.peaks = buildPeakPyramid(channelsOf(buf), buf.sampleRate);
        e.pending = null;
        evict();
        opts.onReady(url);
        return buf;
      })
      .catch((err: unknown) => {
        e.pending = null;
        e.error = err instanceof Error ? err.message : String(err);
        console.warn(`[editor audio] ${url}: ${e.error}`);
        throw err;
      });
    return e.pending;
  };
  return {
    load,
    /** decoded buffer if cached (marks it used) */
    get(url: string): AudioBuffer | null {
      const e = entries.get(url);
      if (!e?.buffer) return null;
      e.lastUse = ++clock;
      return e.buffer;
    },
    /** fire-and-forget load (skips media that failed; preload retries them) */
    request(url: string): void {
      const e = entries.get(url);
      if (e && (e.buffer || e.pending || e.error)) return;
      load(url).catch(() => undefined);
    },
    /** the time-reversed copy of a cached buffer (for reverse shuttle) */
    reversed(url: string): AudioBuffer | null {
      const e = entries.get(url);
      if (!e?.buffer) return null;
      if (!e.reversed) {
        const b = e.buffer;
        const r = new AudioBuffer({ length: b.length, numberOfChannels: b.numberOfChannels, sampleRate: b.sampleRate });
        for (let c = 0; c < b.numberOfChannels; c++) {
          const s = b.getChannelData(c);
          const d = r.getChannelData(c);
          for (let i = 0, j = s.length - 1; j >= 0; i++, j--) d[i] = s[j];
        }
        e.reversed = r;
        bytes += bufferBytes(r);
        evict();
      }
      return e.reversed;
    },
    peaks(url: string): PeakPyramid | null {
      return entries.get(url)?.peaks ?? null;
    },
    error(url: string): string | null {
      return entries.get(url)?.error ?? null;
    },
    ready(url: string): boolean {
      return !!entries.get(url)?.buffer;
    },
    bytes: (): number => bytes,
    clear(): void {
      entries.clear();
      bytes = 0;
    },
  };
}

// ---------------------------------------------------------------------------
// limiter worklet modules (one addModule per context)
// ---------------------------------------------------------------------------
/** frames the limiter delays the signal at a sample rate (its look-ahead) */
const limiterLatency = (sampleRate: number): number => createLimiterKernel({ sampleRate, ceilingDb: 0 }).latency;
/** frames of history the limiter's gain depends on (an offline chunk's pre-roll must cover them) */
const limiterMemory = (sampleRate: number): number => createLimiterKernel({ sampleRate, ceilingDb: 0 }).memory;

/** load the limiter module into a context (resolves false when AudioWorklet is unavailable: no secure context) */
async function loadLimiter(ctx: BaseAudioContext): Promise<boolean> {
  if (!ctx.audioWorklet) return false;
  try {
    await ctx.audioWorklet.addModule(limiterWorkletUrl());
    return true;
  } catch (e) {
    console.warn('[editor audio] limiter worklet failed to load; the output is unlimited', e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// the engine
// ---------------------------------------------------------------------------
export interface AudioEngineOptions {
  /** use this context (else one is created at the project's sample rate) */
  ctx?: AudioContext;
  /** map a media URL before fetching (e.g. a different origin for the export harness) */
  resolveUrl?: (url: string) => string;
  /** fetch implementation (defaults to the global fetch) */
  fetch?: (url: string) => Promise<Response>;
  /** decoded-PCM cache budget in MB of float32 (default 768) */
  cacheMB?: number;
  /** playback reached the end of the project (or the start, in reverse) and stopped */
  onEnded?: (t: number) => void;
  /** a media file finished decoding (its peaks are available): redraw waveforms */
  onChange?: () => void;
}

/** the AudioEngine contract plus editor conveniences */
export interface EditorAudioEngine extends AudioEngine {
  /** the shuttle rate of the current playback (1 when stopped) */
  readonly rate: number;
  /** whether a media's audio is decoded and cached right now */
  ready(mediaId: string): boolean;
  /** decode error for a media, if its last load failed */
  error(mediaId: string): string | null;
  /** subscribe to media-ready notifications (returns the unsubscribe) */
  subscribe(fn: () => void): () => void;
}

export function createAudioEngine(initial: Project, opts: AudioEngineOptions = {}): EditorAudioEngine {
  let project = initial;
  let plans = buildPlans(project);
  const ownsCtx = !opts.ctx;
  const ctx: AudioContext =
    opts.ctx ??
    (() => {
      try {
        return new AudioContext({ sampleRate: initial.sampleRate, latencyHint: 'interactive' });
      } catch {
        return new AudioContext({ latencyHint: 'interactive' });
      }
    })();
  // decode at the PROJECT rate (independent of the device rate) so offline renders never resample
  let decodeCtx: OfflineAudioContext | null = null;
  let decodeRate = 0;
  const decoder = (): BaseAudioContext => {
    if (!decodeCtx || decodeRate !== project.sampleRate) {
      decodeRate = project.sampleRate;
      decodeCtx = new OfflineAudioContext({ numberOfChannels: 1, length: 1, sampleRate: decodeRate });
    }
    return decodeCtx;
  };

  const graph = createGraph(ctx, project, true, null);
  let passes: Pass[] = [];
  let playing = false;
  let stoppedAt = 0;
  let rate = 1;
  let loop: { start: number; end: number } | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let startToken = 0;
  let scrubPass: Pass | null = null;
  let lastScrub = -Infinity;
  let scrubTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingScrub: number | null = null;
  let latencySec = 0;
  let disposed = false;
  const renderPins = new Map<string, number>();
  const listeners = new Set<() => void>();
  const meterBuf = new Float32Array(2048);

  // the limiter joins the live graph as soon as its module has loaded; from then on now() hides its look-ahead
  void loadLimiter(ctx).then((ok) => {
    if (!ok || disposed) return;
    insertLimiter(graph, limiterNode(ctx, project.master.limiterDb));
    graph.ceilingDb = Math.min(0, project.master.limiterDb);
    latencySec = limiterLatency(ctx.sampleRate) / ctx.sampleRate;
  });

  // ---- buffers ------------------------------------------------------------
  /** urls that must stay decoded: sounding voices, the prefetch window, running renders */
  const pinned = (): Set<string> => {
    const s = new Set<string>(renderPins.keys());
    for (const p of passes) for (const v of p.voices.values()) if (v) s.add(v.url);
    if (scrubPass) for (const v of scrubPass.voices.values()) if (v) s.add(v.url);
    if (playing) for (const u of urlsIn(...prefetchWindow())) s.add(u);
    return s;
  };
  const store = createBufferStore({
    decoder,
    fetchFn: opts.fetch ?? ((u) => fetch(u)),
    resolveUrl: opts.resolveUrl ?? ((u) => u),
    budgetBytes: (opts.cacheMB ?? DEFAULT_CACHE_MB) * 1024 * 1024,
    pinned,
    onReady: () => {
      if (playing) tick();
      listeners.forEach((f) => f());
      opts.onChange?.();
    },
  });

  /** playable urls of audible events overlapping [a, b] */
  function urlsIn(a: number, b: number): Set<string> {
    const out = new Set<string>();
    for (const plan of plans.values()) {
      for (const e of plan.track.events) {
        if (e.mute || e.start >= b || e.start + e.length <= a) continue;
        const u = playableUrl(project.media[e.mediaId]);
        if (u) out.add(u);
      }
    }
    return out;
  }

  function prefetchWindow(): [number, number] {
    const t = currentTime();
    const span = PREFETCH * Math.max(1, Math.abs(rate));
    return rate > 0 ? [t, t + span] : [t - span, t];
  }

  // ---- clock --------------------------------------------------------------
  /** the context time the listener hears now (output latency and the limiter's look-ahead removed) */
  function heardCtxTime(): number {
    const ts = typeof ctx.getOutputTimestamp === 'function' ? ctx.getOutputTimestamp() : null;
    let c: number;
    if (ts && ts.contextTime !== undefined && ts.performanceTime !== undefined && ts.performanceTime > 0) {
      c = Math.min(ctx.currentTime, ts.contextTime + (performance.now() - ts.performanceTime) / 1000);
    } else c = ctx.currentTime - (ctx.outputLatency || 0) - (ctx.baseLatency || 0);
    return c - latencySec;
  }

  function currentTime(): number {
    if (!playing || passes.length === 0) return stoppedAt;
    const hc = heardCtxTime();
    let p = passes[0];
    for (const q of passes) if (q.c0 <= hc) p = q;
    const c = Math.min(Math.max(hc, p.c0), p.cEnd);
    return toTl(p, c);
  }

  // ---- scheduling ---------------------------------------------------------
  const bufferAccess: BufferSource = {
    get: (u) => store.get(u),
    reversed: (u) => store.reversed(u),
    request: (u) => store.request(u),
  };

  /** the pass that follows `prev` when looping */
  function loopPass(prev: Pass): Pass {
    const L = loop!;
    return makePass(prev.rate > 0 ? L.start : L.end, prev.cEnd, prev.rate, L.start, L.end, EDGE_RAMP, true);
  }

  function tick(): void {
    if (!playing || passes.length === 0) return;
    const c = ctx.currentTime;
    let last = passes[passes.length - 1];
    if (!last.wraps && c >= last.cEnd) {
      const t = last.rate > 0 ? last.hi : last.lo;
      halt(t);
      opts.onEnded?.(t);
      return;
    }
    // queue the next loop iteration well before the seam
    while (last.wraps && loop && last.cEnd - c < LOOKAHEAD + 0.5) {
      const next = loopPass(last);
      for (const [id, bus] of graph.buses) {
        const plan = plans.get(id);
        if (plan) automateBus(bus, plan, next, next.c0, next.cEnd, { kind: 'append' });
      }
      passes.push(next);
      last = next;
    }
    // forget passes that finished a while ago (their voices have ended)
    passes = passes.filter((p, i) => i === passes.length - 1 || p.cEnd > c - 1);
    const cNow = c + SCHEDULE_MARGIN;
    for (const pass of passes) {
      if (pass.c0 > c + LOOKAHEAD) continue;
      const cA = Math.max(cNow, pass.c0);
      const cB = Math.min(c + LOOKAHEAD, pass.cEnd);
      if (cB <= cA) continue;
      const tA = toTl(pass, cA);
      const tB = toTl(pass, cB);
      scheduleWindow(graph, project, plans, bufferAccess, pass, Math.min(tA, tB), Math.max(tA, tB), tA);
    }
    // decode ahead
    for (const u of urlsIn(...prefetchWindow())) store.request(u);
  }

  /** begin playback at t now (the buffers for the first moments are ready, or we waited long enough) */
  function begin(t: number): void {
    const end = projectEnd(project);
    const c0 = ctx.currentTime + START_LATENCY;
    let pass: Pass;
    if (rate > 0) {
      const wraps = !!loop && t < loop.end - 1e-3;
      pass = makePass(t, c0, rate, t, Math.max(t, wraps ? loop!.end : end), EDGE_RAMP, wraps);
    } else {
      const wraps = !!loop && t > loop.start + 1e-3;
      pass = makePass(t, c0, rate, Math.min(t, wraps ? loop!.start : 0), t, EDGE_RAMP, wraps);
    }
    passes = [pass];
    for (const [id, bus] of graph.buses) {
      const plan = plans.get(id);
      if (!plan) continue;
      automateBus(bus, plan, pass, pass.c0, pass.cEnd, { kind: 'reset' });
      bus.gate.gain.cancelScheduledValues(0);
      bus.gate.gain.setValueAtTime(1, c0);
    }
    automateMaster(graph, project, c0, false);
    tick();
    if (timer === null) timer = setInterval(tick, TICK_MS);
  }

  /** stop all sound now (soft), keep `at` as the stopped position */
  function halt(at: number): void {
    const c = ctx.currentTime;
    for (const p of passes) for (const v of p.voices.values()) if (v) releaseVoice(v, c);
    passes = [];
    if (timer !== null) clearInterval(timer);
    timer = null;
    for (const bus of graph.buses.values()) for (const prm of [bus.duck.gain, bus.env.gain, bus.fader.gain, bus.pan.pan]) holdParam(prm, c + XFADE);
    playing = false;
    stoppedAt = at;
    rate = 1;
  }

  /**
   * A live edit: rebuild buses whose FX chain changed, replace the voices of events that changed, and re-write the
   * bus automation from shortly ahead. Voices are compared per EVENT (identity, the effective fades the
   * auto-crossfade gives it, its medium), so dragging one event's volume in the Inspector during playback restarts
   * that event alone, not every sound on its track.
   */
  function applyLive(prev: Project, prevPlans: Map<string, TrackPlan>): void {
    const at = ctx.currentTime + RESCHEDULE_LEAD;
    const replaceTracks = new Set<string>();
    const replaceVoices = new Set<string>();
    const sameFade = (a: Fade | undefined, b: Fade | undefined): boolean => !!a && !!b && a.len === b.len && a.curve === b.curve;
    const prevTracks = new Map(prev.tracks.map((t) => [t.id, t]));
    // buses: create new tracks, rebuild changed FX chains (crossfaded through the bus gates), drop removed tracks
    for (const tr of project.tracks) {
      if (tr.kind !== 'audio') continue;
      const old = graph.buses.get(tr.id);
      const before = prevTracks.get(tr.id);
      if (!old || old.fxKey !== fxKeyOf(tr)) {
        const bus = createBus(graph, tr);
        bus.gate.gain.setValueAtTime(0, at);
        bus.gate.gain.linearRampToValueAtTime(1, at + XFADE);
        if (old) retireBus(old, at);
        graph.buses.set(tr.id, bus);
        replaceTracks.add(tr.id);
      } else if (before !== tr && before) {
        const mediaChanged = prev.media !== project.media && tr.events.some((e) => prev.media[e.mediaId] !== project.media[e.mediaId]);
        if (before.events !== tr.events || mediaChanged) {
          const was = new Map(before.events.map((e) => [e.id, e]));
          const fadesBefore = prevPlans.get(tr.id)?.fades;
          const fadesNow = plans.get(tr.id)?.fades;
          for (const e of tr.events) {
            const old = was.get(e.id);
            was.delete(e.id);
            const fb = fadesBefore?.get(e.id);
            const fn = fadesNow?.get(e.id);
            const fadesSame = fb === fn || (sameFade(fb?.fadeIn, fn?.fadeIn) && sameFade(fb?.fadeOut, fn?.fadeOut));
            if (old !== e || !fadesSame || prev.media[e.mediaId] !== project.media[e.mediaId]) replaceVoices.add(`${tr.id}/${e.id}`);
          }
          for (const id of was.keys()) replaceVoices.add(`${tr.id}/${id}`); // removed events
        }
      }
    }
    for (const [id, bus] of [...graph.buses]) {
      if (!plans.has(id)) {
        retireBus(bus, at);
        graph.buses.delete(id);
        replaceTracks.add(id);
      }
    }
    // the playing pass may now end elsewhere (the project grew or shrank)
    const last = passes[passes.length - 1];
    if (last && !last.wraps) {
      const end = projectEnd(project);
      if (last.rate > 0) last.hi = Math.max(last.t0, end);
      last.cEnd = toCtx(last, last.rate > 0 ? last.hi : last.lo);
    }
    // replaced voices fade out over the same EDGE_RAMP their replacements gate in with (rebuilt from `at` below):
    // a linear crossfade, transparent when the audio did not change
    for (const p of passes) {
      for (const [key, v] of [...p.voices]) {
        const trackId = key.slice(0, key.indexOf('/'));
        if (!replaceTracks.has(trackId) && !replaceVoices.has(key)) continue;
        if (v && v.cEnd > at) releaseVoice(v, at, EDGE_RAMP);
        p.voices.delete(key);
      }
    }
    // bus automation from `at` on, for the current pass and any queued loop passes
    for (const [id, bus] of graph.buses) {
      const plan = plans.get(id);
      if (!plan) continue;
      let first = true;
      for (const p of passes) {
        const cFrom = Math.max(at + XFADE, p.c0);
        if (p.cEnd <= cFrom) continue;
        automateBus(bus, plan, p, cFrom, p.cEnd, first ? { kind: 'glide', at } : { kind: 'append' });
        first = false;
      }
    }
    automateMaster(graph, project, at, true);
    // voices of replaced tracks restart from `at`: schedule with that as the earliest start
    for (const p of passes) {
      if (p.cEnd <= at || p.c0 > ctx.currentTime + LOOKAHEAD) continue;
      const cA = Math.max(at, p.c0);
      const cB = Math.min(ctx.currentTime + LOOKAHEAD, p.cEnd);
      if (cB <= cA) continue;
      const tA = toTl(p, cA);
      const tB = toTl(p, cB);
      scheduleWindow(graph, project, plans, bufferAccess, p, Math.min(tA, tB), Math.max(tA, tB), tA);
    }
    tick();
  }

  function retireBus(bus: Bus, at: number): void {
    holdParam(bus.gate.gain, at);
    bus.gate.gain.linearRampToValueAtTime(0, at + XFADE);
    setTimeout(() => disconnectAll(bus.nodes), (at - ctx.currentTime + XFADE) * 1000 + 100);
  }

  /** stopped edits: rebuild buses whose FX changed, add/drop tracks (no fades needed) */
  function applyStopped(): void {
    for (const tr of project.tracks) {
      if (tr.kind !== 'audio') continue;
      const old = graph.buses.get(tr.id);
      if (!old || old.fxKey !== fxKeyOf(tr)) {
        if (old) disconnectAll(old.nodes);
        graph.buses.set(tr.id, createBus(graph, tr));
      }
    }
    for (const [id, bus] of [...graph.buses]) {
      if (!plans.has(id)) {
        disconnectAll(bus.nodes);
        graph.buses.delete(id);
      }
    }
  }

  // ---- scrubbing ----------------------------------------------------------
  function grain(t: number): void {
    lastScrub = performance.now();
    void ctx.resume();
    const c = ctx.currentTime;
    if (scrubPass) for (const v of scrubPass.voices.values()) if (v) releaseVoice(v, c);
    const c0 = c + 0.01;
    const pass = makePass(t, c0, 1, t, t + SCRUB_GRAIN, SCRUB_RAMP, false);
    for (const [id, bus] of graph.buses) {
      const plan = plans.get(id);
      if (!plan) continue;
      automateBus(bus, plan, pass, pass.c0, pass.cEnd, { kind: 'reset' });
      bus.gate.gain.cancelScheduledValues(0);
      bus.gate.gain.setValueAtTime(1, c0);
    }
    automateMaster(graph, project, c0, false);
    scheduleWindow(graph, project, plans, bufferAccess, pass, pass.lo, pass.hi, t);
    scrubPass = pass;
  }

  // ---- the contract -------------------------------------------------------
  const engine: EditorAudioEngine = {
    ctx,
    get playing() {
      return playing;
    },
    get rate() {
      return playing ? rate : 1;
    },

    setProject(p: Project) {
      if (p === project) return;
      const prev = project;
      const prevPlans = plans;
      project = p;
      plans = buildPlans(p);
      if (playing && passes.length) applyLive(prev, prevPlans);
      else applyStopped();
    },

    play(t: number, o?: { loop?: { start: number; end: number }; rate?: number }) {
      if (playing) halt(currentTime());
      const r = o?.rate;
      rate = r !== undefined && Number.isFinite(r) && Math.abs(r) >= 1e-3 ? r : 1;
      loop = o?.loop && o.loop.end - o.loop.start > 0.05 ? { start: o.loop.start, end: o.loop.end } : null;
      playing = true;
      stoppedAt = t;
      void ctx.resume();
      const token = ++startToken;
      // wait (briefly) for the buffers of the first second so playback does not start with holes
      const first = rate > 0 ? urlsIn(t, t + Math.abs(rate)) : urlsIn(t - Math.abs(rate), t);
      const missing = [...first].filter((u) => !store.ready(u) && !store.error(u));
      if (missing.length === 0) {
        begin(t);
        return;
      }
      const loads = Promise.allSettled(missing.map((u) => store.load(u)));
      const wait = new Promise<void>((res) => setTimeout(res, START_WAIT_MS));
      void Promise.race([loads, wait]).then(() => {
        if (token === startToken && playing) begin(t);
      });
    },

    stop() {
      startToken++;
      if (playing) halt(currentTime());
    },

    now: currentTime,

    scrub(t: number) {
      if (playing) return;
      const since = (performance.now() - lastScrub) / 1000;
      if (since >= SCRUB_MIN_INTERVAL) {
        grain(t);
        return;
      }
      pendingScrub = t;
      if (scrubTimer === null) {
        scrubTimer = setTimeout(() => {
          scrubTimer = null;
          const pt = pendingScrub;
          pendingScrub = null;
          if (pt !== null && !playing) grain(pt);
        }, (SCRUB_MIN_INTERVAL - since) * 1000);
      }
    },

    async preload(onProgress?: (p: number) => void) {
      const urls = new Set<string>();
      for (const m of Object.values(project.media)) {
        const u = playableUrl(m);
        if (u) urls.add(u);
      }
      const list = [...urls];
      let done = 0;
      onProgress?.(list.length ? 0 : 1);
      let next = 0;
      const worker = async (): Promise<void> => {
        while (next < list.length) {
          const u = list[next++];
          await store.load(u).catch(() => undefined);
          done++;
          onProgress?.(done / list.length);
        }
      };
      await Promise.all(Array.from({ length: Math.min(4, list.length) }, worker));
    },

    peaks(mediaId: string, src0: number, src1: number, buckets: number) {
      const url = playableUrl(project.media[mediaId]);
      if (!url) return null;
      const pyr = store.peaks(url);
      if (!pyr) {
        store.request(url);
        return null;
      }
      const buf = store.get(url);
      // zoomed past the pyramid's finest level with the samples evicted: draw level 0 now, decode for next time
      if (!buf && ((src1 - src0) * pyr.sampleRate) / Math.max(1, buckets) < PEAK_BLOCK) store.request(url);
      return readPeaks(pyr, buf ? channelsOf(buf) : null, src0, src1, buckets);
    },

    meters() {
      const an = graph.analysers;
      if (!an) return { l: METER_FLOOR, r: METER_FLOOR };
      const level = (a: AnalyserNode): number => {
        const n = Math.min(a.fftSize, meterBuf.length);
        const buf = n === meterBuf.length ? meterBuf : meterBuf.subarray(0, n);
        a.getFloatTimeDomainData(buf);
        let pk = 0;
        for (let i = 0; i < n; i++) {
          const x = Math.abs(buf[i]);
          if (x > pk) pk = x;
        }
        return pk > 0 ? Math.max(METER_FLOOR, 20 * Math.log10(pk)) : METER_FLOOR;
      };
      return { l: level(an[0]), r: level(an[1]) };
    },

    async renderOffline(from: number, to: number) {
      const p = project;
      const pl = plans;
      const sr = p.sampleRate;
      const frames = Math.max(0, Math.round((to - from) * sr));
      if (frames === 0) return { sampleRate: sr, channels: [new Float32Array(0), new Float32Array(0)] as [Float32Array, Float32Array] };
      const lat = limiterLatency(sr);
      const preFrames = Math.max(Math.ceil(prerollSeconds(p) * sr), limiterMemory(sr));
      const total = preFrames + frames + lat;
      const startT = from - preFrames / sr;
      const endT = startT + total / sr;
      // decode (and pin) everything the window plays
      const urls = [...urlsIn(startT, endT)];
      for (const u of urls) renderPins.set(u, (renderPins.get(u) ?? 0) + 1);
      try {
        const bufs = new Map<string, AudioBuffer>();
        await Promise.all(
          urls.map((u) =>
            store.load(u).then(
              (b) => void bufs.set(u, b),
              () => undefined, // a missing file renders as silence (logged by the store)
            ),
          ),
        );
        const octx = new OfflineAudioContext({ numberOfChannels: 2, length: total, sampleRate: sr });
        const limited = await loadLimiter(octx);
        const g = createGraph(octx, p, false, limited ? limiterNode(octx, p.master.limiterDb) : null);
        const skipLat = limited ? lat : 0;
        const pass = makePass(startT, 0, 1, startT, endT, 0, false);
        for (const [id, bus] of g.buses) {
          const plan = pl.get(id);
          if (plan) automateBus(bus, plan, pass, 0, pass.cEnd, { kind: 'append' });
        }
        automateMaster(g, p, 0, false);
        const offlineBuffers: BufferSource = { get: (u) => bufs.get(u) ?? null, reversed: () => null, request: () => undefined };
        scheduleWindow(g, p, pl, offlineBuffers, pass, startT, endT, startT);
        const out = await octx.startRendering();
        const skip = preFrames + skipLat;
        return {
          sampleRate: sr,
          channels: [out.getChannelData(0).slice(skip, skip + frames), out.getChannelData(1).slice(skip, skip + frames)] as [Float32Array, Float32Array],
        };
      } finally {
        for (const u of urls) {
          const n = (renderPins.get(u) ?? 1) - 1;
          if (n > 0) renderPins.set(u, n);
          else renderPins.delete(u);
        }
      }
    },

    ready(mediaId: string) {
      const u = playableUrl(project.media[mediaId]);
      return !!u && store.ready(u);
    },
    error(mediaId: string) {
      const u = playableUrl(project.media[mediaId]);
      return u ? store.error(u) : null;
    },
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    dispose() {
      disposed = true;
      startToken++;
      if (playing) halt(currentTime());
      if (scrubTimer !== null) clearTimeout(scrubTimer);
      if (scrubPass) for (const v of scrubPass.voices.values()) if (v) disconnectAll(v.nodes);
      for (const bus of graph.buses.values()) disconnectAll(bus.nodes);
      disconnectAll(graph.nodes);
      listeners.clear();
      store.clear();
      if (ownsCtx) void ctx.close();
    },
  };
  return engine;
}
