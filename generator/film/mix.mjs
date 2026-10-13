#!/usr/bin/env node
// Stage 7 — mix. Narration stem + score cues → mastered stereo WAV + chapter slices for the shelf.
//
//   npm run film:mix -- --slug <slug> [--lufs -16] [--tp -1.5] [--duck-threshold 0.025] [--duck-ratio 8]
//                       [--duck-attack 20] [--duck-release 500] [--fade-after-strike 1.6] [--no-chapters] [--dir <filmDir>]
//
// Reads  narration/timeline.json (duration, chapters, line windows), narration/narration.wav,
//        score/cues.json (MusicCue[]: start, end, render, gainDb, fadeIn, fadeOut, duck)
// Writes mix/master.wav       48 kHz stereo s24, one constant gain to -16 LUFS / -1.5 dBTP (limiter only for overshoot), length = film duration
//        mix/loudness.json    master I/LRA/TP, loudnorm pass-1 numbers, duck depth + calibration, per-cue placement,
//                             moments {lines: each line's max momentary LUFS, nonSpeech: loudest music-only windows}, chapter files
//        mix/chapters/<n>.m4a AAC slices per chapter (each < 25 MiB for Workers static assets)
//        film.json stages.mix
// Cue placement: render sample 0 lands at cue.start (sample exact, adelay in samples); fadeIn from 0;
// if fadeOut > 0 the cue fades over [end - fadeOut, end] and is cut at end, else its rendered tail rings out; a cue's
// fade never starts sooner than --fade-after-strike (1.6 s) after its lastStrike marker (it starts later and shortens).
// Cues with duck: true (or a duck object {ratio, attack, release, threshold, depthDb}) go through a sidechain compressor
// keyed by the narration; duck depth (dB of gain reduction on the ducked bus while the narrator speaks) is measured
// and checked against depthDb (default 6). depthDb is a CEILING: the mixer measures the configured threshold/ratio,
// then raises the threshold (or lowers the ratio) until the measured depth is within 1 dB of the target; the applied
// settings and every calibration pass are in loudness.json duck.{applied, calibration}. Check: |depth - target| <= 1.5.
// MUSIC BUS EQ (review round 1: 20-50 Hz drones spent headroom and thickened the narrator's fundamental): every cue
// goes through a 35 Hz high-pass (24 dB/oct, two 2-pole stages) and a KEYED low shelf: a 4th-order crossover at
// --shelf-hz (120) splits the bus; the low band is compressed by the narration key (ratio --shelf-ratio 2.5 at the
// duck threshold), about -2 to -3 dB below 120 Hz while the narrator speaks, flat in the gaps. Reported in
// loudness.json musicEq (the low band's measured reduction under speech).
// ROOM TONE: a continuous floor of tape hiss (pink noise, high-passed at 2.5 kHz, decorrelated L/R) at --floor-lufs
// (-58 LUFS) is added AFTER the master gain, so the master never reaches digital zero (QA mix.floor).
// SWELL TRIM (review round 2: the loudest moments of the film were music-only swells, and the master limiter took
// 2.7 dB to reach -16 LUFS): after the premix, every no-speech momentary window louder than the narrator's typical
// line peak minus --swell-margin (2 dB) is trimmed by its excess (at most --swell-max 3 dB), on the MUSIC bus only,
// with 0.6 s ramps that finish before the next line. Reported in loudness.json swells.
// FOLEY (review round 2): score/foley.json events (lib/foley.mjs: synthesized, dry + small-room reverb) are added
// after the master gain, like the room tone, each at its own max short-term loudness (-28 to -32 LUFS); at most 10
// in a film, each starting in a speech gap or under a line's last words. Reported in loudness.json foley.
// With no cues.json the master is the narration alone (same loudness targets).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, num, die, helpText } from './lib/args.mjs';
import { filmPaths, readJson, writeJson, rel, mkdirp, resolveIn } from './lib/paths.mjs';
import { stageStart, stageDone, stageFailed } from './lib/ledger.mjs';
import { ff, loudness, loudnormMeasure, mediaDuration, momentary, maxShortTerm } from './lib/ffmpeg.mjs';
import { resolveFoley, renderFoley, underWordProblems, MAX_FOLEY_EVENTS, FOLEY_LUFS_RANGE } from './lib/foley.mjs';
import { spanLoudness, spanPeaks, lineSpans } from './lib/levels.mjs';
import { readWav } from './lib/wav.mjs';
import { lastStrike as findLastStrike } from './lib/onsets.mjs';

const SR = 48000;
const MAX_SLICE = 25 * 1024 * 1024;
const a = parseArgs(process.argv.slice(2), {
  boolean: ['help', 'chapters', 'keep-temp'],
  string: ['slug', 'dir', 'lufs', 'tp', 'lra', 'fade-after-strike', 'duck-threshold', 'duck-ratio', 'duck-attack', 'duck-release', 'floor-lufs', 'shelf-hz', 'shelf-ratio', 'hpf-hz', 'swell-margin', 'swell-max'],
  default: { chapters: true },
});
if (a.help || !a.slug) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });
const TARGET = { I: num(a.lufs, -16), TP: num(a.tp, -1.5), LRA: num(a.lra, 11) };
// seconds of clear air between a cue's last strike (cues.json lastStrike) and the start of its fade-out
const FADE_AFTER_STRIKE = num(a["fade-after-strike"], 1.6);
const FLOOR_LUFS = num(a['floor-lufs'], -58);
const HPF_HZ = num(a['hpf-hz'], 35);
const SHELF_HZ = num(a['shelf-hz'], 120);
const SHELF_RATIO = num(a['shelf-ratio'], 2.5);
const SWELL_MARGIN = num(a['swell-margin'], 2);
const SWELL_MAX = num(a['swell-max'], 3);
const SWELL_RAMP = 0.6;

/** no-speech momentary windows over the ceiling, grouped into regions: [{a, b, peakAt, M, trimDb}] */
function findSwells(M, spans, ceiling) {
  const busy = (t) => spans.some((x) => t > x.a - 0.1 && t - 0.4 < x.b + 0.1);
  const hot = M.filter((q) => q.t >= 0.4 && !busy(q.t) && q.M > ceiling);
  const regions = [];
  for (const q of hot) {
    const r = regions[regions.length - 1];
    if (r && q.t - 0.4 <= r.b + 0.5) {
      r.b = q.t;
      if (q.M > r.M) Object.assign(r, { M: q.M, peakAt: q.t });
    } else regions.push({ a: q.t - 0.4, b: q.t, M: q.M, peakAt: q.t });
  }
  for (const r of regions) {
    r.trimDb = +Math.min(SWELL_MAX, r.M - ceiling).toFixed(2);
    // ramps: down before the region, back up after it, never into the next line (the duck holds the music there)
    const next = spans.filter((x) => x.a >= r.b).sort((x, y) => x.a - y.a)[0];
    const prev = spans.filter((x) => x.b <= r.a).sort((x, y) => y.b - x.b)[0];
    r.rampIn = +Math.max(0.1, Math.min(SWELL_RAMP, r.a - (prev ? prev.b : 0))).toFixed(3);
    r.rampOut = +Math.max(0.1, Math.min(SWELL_RAMP, (next ? next.a : Infinity) - r.b)).toFixed(3);
    for (const k of ['a', 'b', 'M', 'peakAt']) r[k] = +r[k].toFixed(2);
  }
  return regions.filter((r) => r.trimDb >= 0.25);
}
/** an ffmpeg volume expression of t: the product of each region's trim, with linear (in gain) ramps */
function swellExpr(regions) {
  if (!regions.length) return null;
  return regions
    .map((r) => {
      const g = 10 ** (-r.trimDb / 20);
      const A = r.a - r.rampIn;
      const B = r.b + r.rampOut;
      return `(1-${(1 - g).toFixed(5)}*clip(min((t-${A.toFixed(3)})/${r.rampIn},(${B.toFixed(3)}-t)/${r.rampOut}),0,1))`;
    })
    .join('*');
}

function loadCues() {
  if (!fs.existsSync(P.score.cues)) return [];
  const j = readJson(P.score.cues);
  return (Array.isArray(j) ? j : j.cues || []).filter((c) => c && c.id);
}

function readF32(file) {
  const b = fs.readFileSync(file);
  return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength - (b.byteLength % 4)));
}

/** dB of gain reduction on the ducked bus while the narrator speaks (energy-weighted). */
function duckDepth(dryFile, wetFile, timeline, sr) {
  const dry = readF32(dryFile);
  const wet = readF32(wetFile);
  let ed = 0;
  let ew = 0;
  let speechSec = 0;
  for (const s of timeline.shots)
    for (const l of s.lines) {
      const i0 = Math.round((s.start + l.start + 0.15) * sr);
      const i1 = Math.min(dry.length, wet.length, Math.round((s.start + l.end) * sr));
      if (i1 <= i0) continue;
      let d = 0;
      let w = 0;
      for (let i = i0; i < i1; i++) {
        d += dry[i] * dry[i];
        w += wet[i] * wet[i];
      }
      if (d / (i1 - i0) < 1e-6) continue; // music silent here (−60 dBFS)
      ed += d;
      ew += w;
      speechSec += (i1 - i0) / sr;
    }
  return speechSec ? { depthDb: +(10 * Math.log10(ed / Math.max(ew, 1e-20))).toFixed(2), speechSecondsUnderMusic: +speechSec.toFixed(1) } : { depthDb: null, speechSecondsUnderMusic: 0 };
}

/** The room-tone floor file (stereo, D seconds) at FLOOR_LUFS. Calibrated on 20 s, then rendered full length. */
function roomTone(tmp, D) {
  const src = (amp, dur, seed) => `anoisesrc=color=pink:sample_rate=${SR}:amplitude=${amp}:duration=${dur}:seed=${seed}`;
  const graph = (amp, dur) => `${src(amp, dur, 1943)}[l];${src(amp, dur, 2026)}[r];[l][r]join=inputs=2:channel_layout=stereo,highpass=f=2500:poles=2,highpass=f=2500:poles=2,lowpass=f=12000[out]`;
  const probe = path.join(tmp, 'floor-probe.wav');
  ff(['-y', '-v', 'error', '-filter_complex', graph(0.5, 20), '-map', '[out]', '-c:a', 'pcm_f32le', probe]);
  const L0 = loudness(probe).I;
  const amp = 0.5 * 10 ** ((FLOOR_LUFS - L0) / 20);
  const file = path.join(tmp, 'floor.wav');
  ff(['-y', '-v', 'error', '-filter_complex', graph(amp.toFixed(6), D.toFixed(4)), '-map', '[out]', '-c:a', 'pcm_f32le', file]);
  return { file, lufs: loudness(file).I };
}

let minMomentaryCache = null;
/** The quietest momentary (400 ms) loudness anywhere in the file. */
function minMomentary(file) {
  if (minMomentaryCache?.file === file && minMomentaryCache.mtime === fs.statSync(file).mtimeMs) return minMomentaryCache.v;
  const M = momentary(file).filter((q) => q.t >= 0.4);
  const v = +Math.min(...M.map((q) => q.M)).toFixed(1);
  minMomentaryCache = { file, mtime: fs.statSync(file).mtimeMs, v };
  return v;
}

/** where the master limiter works: 10 ms blocks of the premix whose sample peak × gain exceeds the ceiling, split by
 *  whether a line is speaking (seconds over, and the largest overshoot in dB, for each) */
function overshoots(premix, gainDb, limDb, spans) {
  const raw = premix.replace(/\.wav$/, '.peak.f32');
  ff(['-y', '-v', 'error', '-i', premix, '-f', 'f32le', '-c:a', 'pcm_f32le', '-ac', '2', '-ar', String(SR), raw]);
  const fd = fs.openSync(raw, 'r');
  const thr = 10 ** ((limDb - gainDb) / 20);
  const blk = SR / 100; // 10 ms
  const buf = Buffer.alloc(blk * 2 * 4 * 1000);
  const res = { speech: { seconds: 0, maxDb: 0 }, music: { seconds: 0, maxDb: 0 }, musicBlocks: [] };
  const sorted = [...spans].sort((x, y) => x.a - y.a);
  let si = 0;
  let pos = 0;
  for (;;) {
    const n = fs.readSync(fd, buf, 0, buf.length, null);
    if (n <= 0) break;
    const f = new Float32Array(buf.buffer, buf.byteOffset, Math.floor(n / 4));
    for (let o = 0; o < f.length; o += blk * 2) {
      let pk = 0;
      for (let i = o; i < Math.min(f.length, o + blk * 2); i++) pk = Math.max(pk, Math.abs(f[i]));
      const t = (pos + o / 2) / SR;
      if (pk > thr) {
        while (si < sorted.length && sorted[si].b < t) si++;
        const inSpeech = si < sorted.length && sorted[si].a <= t + 0.01;
        const r = inSpeech ? res.speech : res.music;
        r.seconds += 0.01;
        r.maxDb = Math.max(r.maxDb, 20 * Math.log10(pk / thr));
        if (!inSpeech) res.musicBlocks.push({ t: +t.toFixed(3), overDb: +(20 * Math.log10(pk / thr)).toFixed(2) });
      }
    }
    pos += f.length / 2;
  }
  fs.closeSync(fd);
  fs.rmSync(raw, { force: true });
  for (const r of [res.speech, res.music]) Object.assign(r, { seconds: +r.seconds.toFixed(2), maxDb: +r.maxDb.toFixed(2) });
  return res;
}

/** score/foley.json → rendered events (lib/foley.mjs), with placement checks */
function buildFoley(tmp, timeline, D) {
  const src = path.join(P.score.dir, 'foley.json');
  if (!fs.existsSync(src)) return { source: null, events: [], checks: { count: true, placement: true, level: true } };
  const doc = readJson(src);
  const resolved = resolveFoley(doc.events || [], timeline);
  const events = resolved.map((ev) => {
    if (!(ev.t >= 0 && ev.t < D)) return { ...ev, file: null, problems: [...ev.problems, `outside the film (${ev.t} s)`] };
    mkdirp(path.join(P.score.dir, 'foley'));
    const file = path.join(P.score.dir, 'foley', `${ev.id}.wav`); // kept: the shelf's stems publish it (lib/stems.mjs)
    const r = renderFoley(ev, file, (f) => maxShortTerm(f));
    // a declared 'underLastWords' event may start under the words it names (the last words of its line)
    const named = (list) => (p) => !String(list).split(/\s+/).some((w) => p.includes(`("${w}")`) || p.toLowerCase().includes(`("${w.toLowerCase()}")`));
    let problems = ev.underLastWords ? ev.problems.filter(named(ev.underLastWords)) : ev.problems;
    // review round 4: a declared underWord event (a word-synced practical, e.g. ch14-s07's stamp ON 'stands') may
    // start under that word only while it stays short and quiet (lib/foley.mjs UNDER_WORD_MAX_DUR / _LUFS)
    const uw = underWordProblems(ev, r);
    if (ev.underWord) problems = [...problems.filter(named(uw.allowed.join(' '))), ...uw.problems];
    return { id: ev.id, kind: ev.kind, t: ev.t, shot: ev.shot, shotLocal: ev.shotLocal, lufsS: r.lufsS, duration: r.duration, file, render: rel(file).replace(/^films\/[^/]+\//, ''), problems, ...(ev.underLastWords ? { underLastWords: ev.underLastWords } : {}), ...(ev.underWord ? { underWord: ev.underWord } : {}) };
  });
  for (const e of events) console.log(`  foley ${e.id}: ${e.kind} at ${e.t} s (${e.shot} +${e.shotLocal}) ${e.lufsS} LUFS S${e.problems.length ? ` — ${e.problems.join('; ')}` : ''}`);
  const [lo, hi] = FOLEY_LUFS_RANGE;
  return {
    source: rel(src),
    max: MAX_FOLEY_EVENTS,
    events,
    checks: { count: events.length <= MAX_FOLEY_EVENTS, placement: events.every((e) => !e.problems.length), level: events.every((e) => e.lufsS >= lo - 0.5 && e.lufsS <= hi + 0.5) },
  };
}

async function main() {
  const timeline = readJson(P.narration.timeline);
  if (timeline.draft) throw new Error('timeline.json is a DRAFT (synthetic timings); narrate and re-run film:timeline before mixing');
  if (!fs.existsSync(P.narration.wav)) throw new Error(`missing ${rel(P.narration.wav)} — run film:timeline`);
  const D = timeline.duration;
  const narrDur = mediaDuration(P.narration.wav);
  if (Math.abs(narrDur - D) > 0.05) throw new Error(`narration.wav is ${narrDur.toFixed(3)} s but timeline says ${D} s — re-run film:timeline`);
  stageStart(P, 'mix', { args: process.argv.slice(2) });
  const cues = loadCues();
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'film-mix-'));
  const placed = [];
  const inputs = ['-i', P.narration.wav];
  const chains = [`[0:a]aresample=${SR},aformat=sample_fmts=fltp:channel_layouts=stereo,asplit=3[voice][key0][key1]`];
  const duck = [];
  const free = [];
  for (const c of cues) {
    const file = resolveIn(P, c.render || `score/renders/${c.id}.wav`);
    if (!fs.existsSync(file)) throw new Error(`cue ${c.id}: render missing (${rel(file)}) — run film:score render --slug ${a.slug} --cue ${c.id}`);
    if (!(c.end > c.start) || c.start < 0 || c.start >= D) throw new Error(`cue ${c.id}: window ${c.start}..${c.end} is outside the film (0..${D})`);
    const len = mediaDuration(file);
    const k = inputs.length / 2;
    inputs.push('-i', file);
    const body = c.end - c.start;
    // 35 Hz high-pass, 24 dB/oct (two 2-pole Butterworth stages) on every cue: no sub-bass under the narrator
    const f = [`aresample=${SR}`, 'aformat=sample_fmts=fltp:channel_layouts=stereo', `highpass=f=${HPF_HZ}:poles=2`, `highpass=f=${HPF_HZ}:poles=2`, `volume=${num(c.gainDb, 0)}dB`];
    if (c.fadeIn > 0) f.push(`afade=t=in:st=0:d=${c.fadeIn}:curve=qsin`);
    let used = len;
    // the last strike (cue field lastStrike, absolute film seconds: the onset of the cue's final chord or note, which
    // the score stage records) must ring in clear air: the fade starts no earlier than FADE_AFTER_STRIKE s after it.
    // A configured fade that would start sooner starts later instead (and gets shorter, never below 0.3 s); if even
    // that cannot fit inside the window, the fadeAfterStrike check fails. No marker on a cue that fades: a warning.
    let fade = null;
    if (c.fadeOut > 0) {
      // no marker in cues.json: find the final onset in the render itself (lib/onsets.mjs)
      let strike = Number.isFinite(c.lastStrike) ? c.lastStrike : null;
      if (strike == null) {
        try {
          const w = readWav(file);
          const loc = findLastStrike(w.channels, w.sampleRate, body);
          if (loc != null) strike = +(c.start + loc).toFixed(3);
        } catch {}
      }
      const minGap = Number.isFinite(c.fadeAfterStrike) ? c.fadeAfterStrike : FADE_AFTER_STRIKE;
      let st = Math.max(0, body - c.fadeOut);
      let d = c.fadeOut;
      let ok = null;
      if (strike != null) {
        const earliest = strike - c.start + minGap;
        if (st < earliest) {
          st = earliest;
          d = body - st;
        }
        ok = d >= 0.3 - 1e-6;
        if (!ok) {
          d = 0.3;
          st = body - d;
        }
      } else console.warn(`  warn: ${c.id} fades out but has no lastStrike marker: cannot hold the fade ${minGap} s clear of the last chord`);
      f.push(`afade=t=out:st=${st.toFixed(4)}:d=${d.toFixed(4)}:curve=qsin`, `atrim=end=${body.toFixed(4)}`);
      used = Math.min(len, body);
      fade = { lastStrike: strike, fadeStart: +(c.start + st).toFixed(3), fadeDur: +d.toFixed(3), configured: c.fadeOut, afterStrike: strike != null ? +(c.start + st - strike).toFixed(3) : null, minAfterStrike: minGap, ok };
      if (strike != null) console.log(`  ${c.id}: last strike ${strike.toFixed(2)} s → fade ${fade.fadeStart.toFixed(2)}–${(fade.fadeStart + d).toFixed(2)} s (${fade.afterStrike.toFixed(2)} s after the strike${d < c.fadeOut - 1e-6 ? `; shortened from ${c.fadeOut} s` : ''})`);
    }
    if (len + 0.02 < body) console.warn(`  warn: ${c.id} render (${len.toFixed(2)} s) is shorter than its window (${body.toFixed(2)} s)`);
    f.push(`adelay=delays=${Math.round(c.start * SR)}S:all=1`);
    chains.push(`[${k}:a]${f.join(',')}[c${k}]`);
    (c.duck === false ? free : duck).push(`[c${k}]`);
    placed.push({ id: c.id, start: c.start, end: c.end, plays: +(used).toFixed(3), ringsTo: +(c.start + used).toFixed(3), gainDb: num(c.gainDb, 0), duck: c.duck !== false, file: rel(file), ...(fade ? { fade } : {}) });
  }
  const premix = path.join(tmp, 'premix.wav');
  const dryF = path.join(tmp, 'dry.f32');
  const wetF = path.join(tmp, 'wet.f32');
  const loDryF = path.join(tmp, 'lodry.f32');
  const loWetF = path.join(tmp, 'lowet.f32');
  const ASR = 8000;
  const mixIns = ['[voice]'];
  const outs = [];
  // duck settings: CLI flags > the first ducked cue's duck object ({ratio, attack, release, threshold, depthDb}) > defaults
  const duckCfg = (() => {
    const o = cues.find((c) => c.duck && typeof c.duck === 'object')?.duck || {};
    return {
      threshold: num(a['duck-threshold'], o.threshold ?? 0.025),
      ratio: num(a['duck-ratio'], o.ratio ?? 8),
      attack: num(a['duck-attack'], o.attack ?? 20),
      release: num(a['duck-release'], o.release ?? 500),
      targetDb: o.depthDb ?? 6,
    };
  })();
  // the duck stage: [dbus] (all ducked cues) compressed by the narration key; dry/wet copies feed duckDepth()
  const duckGraph = (thr, ratio) => [
    `[dbus]asplit=2[dbus1][dryA]`,
    `[dbus1][key0]sidechaincompress=threshold=${thr.toFixed(5)}:ratio=${ratio}:attack=${duckCfg.attack}:release=${duckCfg.release}:knee=4:makeup=1:link=maximum:detection=rms[ducked]`,
    `[ducked]asplit=2[ducked1][wetA]`,
    `[dryA]aresample=${ASR},pan=mono|c0=0.5*c0+0.5*c1[dryO]`,
    `[wetA]aresample=${ASR},pan=mono|c0=0.5*c0+0.5*c1[wetO]`,
  ];
  // the keyed low shelf: below SHELF_HZ the (already ducked) bus dips a further ~2-3 dB while the narrator speaks
  const shelfGraph = (thr, keyLabel, inLabel, outLabel) => [
    `[${inLabel}]acrossover=split=${SHELF_HZ}:order=4th[mlo][mhi]`,
    `[mlo]asplit=2[mlo1][loDry]`,
    `[mlo1][${keyLabel}]sidechaincompress=threshold=${thr.toFixed(5)}:ratio=${SHELF_RATIO}:attack=30:release=300:knee=4:makeup=1:link=maximum:detection=rms[mloK]`,
    `[mloK]asplit=2[mlo2][loWet]`,
    `[mlo2][mhi]amix=inputs=2:normalize=0[${outLabel}]`,
    `[loDry]aresample=${ASR},pan=mono|c0=0.5*c0+0.5*c1[loDryO]`,
    `[loWet]aresample=${ASR},pan=mono|c0=0.5*c0+0.5*c1[loWetO]`,
  ];
  // A cue's depthDb is a CEILING, not a hint: measure the duck the configured threshold/ratio actually produce
  // and, while it is more than 1 dB off the target, raise the threshold (bisection in dB) and, only if the
  // threshold runs out of room, lower the ratio. Too shallow a duck is pulled down the same way.
  let calibration = [];
  if (duck.length) {
    chains.push(`${duck.join('')}amix=inputs=${duck.length}:normalize=0:duration=longest,apad=whole_dur=${D},atrim=end=${D}[dbus]`);
    const head = [...chains];
    const measure = (thr, ratio) => {
      const g = [...head, ...duckGraph(thr, ratio), '[ducked1]anullsink', '[voice]anullsink', '[key1]anullsink', ...free.map((l) => `${l}anullsink`)];
      ff(['-y', '-v', 'error', ...inputs, '-filter_complex', g.join(';'), '-map', '[dryO]', '-f', 'f32le', '-c:a', 'pcm_f32le', dryF, '-map', '[wetO]', '-f', 'f32le', '-c:a', 'pcm_f32le', wetF]);
      const r = duckDepth(dryF, wetF, timeline, ASR);
      calibration.push({ threshold: +thr.toFixed(5), thresholdDb: +(20 * Math.log10(thr)).toFixed(2), ratio, depthDb: r.depthDb });
      return r.depthDb;
    };
    const T = duckCfg.targetDb;
    const TOL = 0.5; // review round 1: a 2.25 dB duck passed a 3 dB target; land within half a dB
    const inBand = (d) => d == null || Math.abs(d - T) <= TOL;
    let thrDb = 20 * Math.log10(duckCfg.threshold);
    let ratio = duckCfg.ratio;
    let d = measure(duckCfg.threshold, ratio);
    if (!inBand(d) && a['duck-threshold'] == null) {
      const MAX_DB = -6; // the narration key rarely exceeds this: a threshold here barely ducks at all
      const MIN_DB = -60;
      for (let pass = 0; pass < 3 && !inBand(d); pass++) {
        // bracket the target in threshold (depth falls as the threshold rises)
        let lo = thrDb;
        let hi = thrDb;
        let dLo = d;
        let dHi = d;
        if (d > T) {
          while (dHi > T + TOL && hi < MAX_DB) {
            lo = hi;
            dLo = dHi;
            hi = Math.min(MAX_DB, hi + 6);
            dHi = measure(10 ** (hi / 20), ratio);
          }
        } else {
          while (dLo < T - TOL && lo > MIN_DB) {
            hi = lo;
            dHi = dLo;
            lo = Math.max(MIN_DB, lo - 6);
            dLo = measure(10 ** (lo / 20), ratio);
          }
        }
        if (inBand(dHi)) [thrDb, d] = [hi, dHi];
        else if (inBand(dLo)) [thrDb, d] = [lo, dLo];
        else if (dLo >= T && dHi <= T) {
          for (let k = 0; k < 6; k++) {
            const mid = (lo + hi) / 2;
            const dm = measure(10 ** (mid / 20), ratio);
            [thrDb, d] = [mid, dm];
            if (inBand(dm)) break;
            if (dm > T) lo = mid;
            else hi = mid;
          }
        } else [thrDb, d] = d > T ? [hi, dHi] : [lo, dLo];
        if (inBand(d)) break;
        if (d > T + TOL && ratio > 1.5) {
          ratio = +Math.max(1.5, 1 + (ratio - 1) / 2).toFixed(2); // the threshold ran out of room: gentler ratio
          d = measure(10 ** (thrDb / 20), ratio);
        } else break;
      }
    }
    duckCfg.applied = { threshold: +(10 ** (thrDb / 20)).toFixed(5), thresholdDb: +thrDb.toFixed(2), ratio, depthDb: d, calibrated: calibration.length > 1 };
    if (!inBand(d)) console.warn(`  warn: duck calibration could not reach ${T} ±${TOL} dB (got ${d} dB at ${thrDb.toFixed(1)} dBFS, ratio ${ratio})`);
    else if (calibration.length > 1) console.log(`  duck: calibrated ${calibration[0].depthDb} → ${d} dB (target ${T}): threshold ${calibration[0].thresholdDb} → ${thrDb.toFixed(1)} dBFS, ratio ${duckCfg.ratio} → ${ratio}`);
    chains.push(...duckGraph(10 ** (thrDb / 20), ratio), ...shelfGraph(10 ** (thrDb / 20), 'key1', 'ducked1', 'dbusEq0'), '[dbusEq0]anull%SWELL%[dbusEq]');
    mixIns.push('[dbusEq]');
    outs.push(['-map', '[dryO]', '-f', 'f32le', '-c:a', 'pcm_f32le', dryF], ['-map', '[wetO]', '-f', 'f32le', '-c:a', 'pcm_f32le', wetF], ['-map', '[loDryO]', '-f', 'f32le', '-c:a', 'pcm_f32le', loDryF], ['-map', '[loWetO]', '-f', 'f32le', '-c:a', 'pcm_f32le', loWetF]);
  } else chains.push('[key0]anullsink', '[key1]anullsink');
  if (free.length) {
    chains.push(`${free.join('')}amix=inputs=${free.length}:normalize=0:duration=longest,lowshelf=f=${SHELF_HZ}:g=-2.5%SWELL%[fbus]`); // undducked cues: a static shelf
    mixIns.push('[fbus]');
  }
  chains.push(`${mixIns.join('')}amix=inputs=${mixIns.length}:normalize=0:duration=first,apad=whole_dur=${D},atrim=end=${D}[mix]`);
  const renderPremix = (expr, withOuts) =>
    ff(['-y', '-v', 'error', ...inputs, '-filter_complex', [...chains, ...(withOuts || !duck.length ? [] : ['[dryO]anullsink', '[wetO]anullsink', '[loDryO]anullsink', '[loWetO]anullsink'])].join(';').replaceAll('%SWELL%', expr ? `,volume=eval=frame:volume='${expr}'` : ',anull'), '-map', '[mix]', '-c:a', 'pcm_f32le', '-ar', String(SR), premix, ...(withOuts ? outs.flat() : [])]);
  renderPremix(null, true);
  // swell trim: the narrator's typical line peak in the premix sets the ceiling for music-only moments
  const allSpans = lineSpans(timeline);
  let swells = { margin: SWELL_MARGIN, max: SWELL_MAX, regions: [] };
  if (cues.length) {
    const M0 = momentary(premix);
    const linePk = Object.values(spanPeaks(premix, allSpans, M0)).filter(Number.isFinite).sort((x, y) => x - y);
    const p50 = linePk[Math.floor(linePk.length / 2)];
    const ceiling = +(p50 - SWELL_MARGIN).toFixed(2);
    const regions = findSwells(M0, allSpans, ceiling);
    swells = { margin: SWELL_MARGIN, max: SWELL_MAX, lineMomentaryP50: +p50.toFixed(2), ceiling, regions };
    if (regions.length) {
      console.log(`  swells: ${regions.length} music-only moments over ${ceiling} LUFS M (line p50 ${p50.toFixed(1)} − ${SWELL_MARGIN}) trimmed: ${regions.slice().sort((x, y) => y.M - x.M).slice(0, 6).map((r) => `${r.peakAt}s ${r.M}→−${r.trimDb} dB`).join(', ')}`);
      renderPremix(swellExpr(regions), false);
    }
    // peak trims (review round 2: "reach -16 LUFS by trimming music-only peaks instead of limiting speech"): the
    // master limiter's largest overshoot was one music-only transient. Every music-only 10 ms block that would
    // cross the master ceiling at the provisional gain is trimmed on the music bus (0.05 s ramps, never into a
    // line), so the limiter only meets speech peaks.
    // iterated (review round 2 follow-up): one pass left a transient 1.6 dB over (the block grid straddles it), so the
    // trims are re-measured on the trimmed premix and deepened, at most 3 passes; each trim spans its blocks ±10 ms
    const peaks = [];
    for (let pass = 0; pass < 3; pass++) {
      const m0 = loudnormMeasure(premix, TARGET);
      const g0 = TARGET.I - Number(m0.input_i);
      const lim0 = TARGET.TP - 0.7;
      const ov = overshoots(premix, g0, lim0 - 0.3, allSpans);
      if (!ov.musicBlocks.length) break;
      let added = 0;
      for (const b of ov.musicBlocks) {
        const hit = peaks.find((r) => b.t >= r.a - 0.03 && b.t <= r.b + 0.03);
        if (hit) {
          if (hit.trimDb >= 9) continue;
          hit.trimDb = +Math.min(9, hit.trimDb + b.overDb + 0.3).toFixed(2);
          hit.a = Math.min(hit.a, b.t - 0.01);
          hit.b = Math.max(hit.b, b.t + 0.02);
          added++;
          continue;
        }
        const r = peaks[peaks.length - 1];
        if (r && b.t - r.b <= 0.1 && b.t >= r.a) {
          r.b = b.t + 0.02;
          r.trimDb = Math.max(r.trimDb, +Math.min(9, b.overDb + 0.3).toFixed(2));
        } else peaks.push({ a: b.t - 0.01, b: b.t + 0.02, trimDb: +Math.min(9, b.overDb + 0.3).toFixed(2), peak: true });
        added++;
      }
      if (!added) break;
      for (const r of peaks) {
        const next = allSpans.filter((x) => x.a >= r.b).sort((x, y) => x.a - y.a)[0];
        const prev = allSpans.filter((x) => x.b <= r.a).sort((x, y) => y.b - x.b)[0];
        r.rampIn = +Math.max(0.005, Math.min(0.05, r.a - (prev ? prev.b : 0))).toFixed(3);
        r.rampOut = +Math.max(0.005, Math.min(0.05, (next ? next.a : Infinity) - r.b)).toFixed(3);
        r.M = null;
        r.peakAt = +r.a.toFixed(2);
        r.a = +r.a.toFixed(3);
        r.b = +r.b.toFixed(3);
        r.passes = pass + 1;
      }
      renderPremix(swellExpr([...swells.regions, ...peaks]), false);
    }
    if (peaks.length) {
      swells.peakTrims = peaks;
      console.log(`  peak trims: ${peaks.length} music-only transients over the master ceiling trimmed: ${peaks.slice().sort((x, y) => y.trimDb - x.trimDb).slice(0, 6).map((r) => `${r.peakAt}s −${r.trimDb} dB (${r.passes} pass${r.passes > 1 ? 'es' : ''})`).join(', ')}`);
    }
  }

  // Master loudness by ONE constant gain (linear normalisation; no dynamic loudnorm pumping). If that gain would
  // push true peak past the ceiling, a transparent look-ahead limiter takes the overshoot and the gain is
  // re-solved so the limited master still lands on the target. The limiter's reduction is reported (QA warns > 2 dB).
  mkdirp(P.mix.dir);
  const m = loudnormMeasure(premix, TARGET);
  const inI = Number(m.input_i);
  const inTP = Number(m.input_tp);
  let gain = TARGET.I - inI;
  let preLimit = null;
  let normalization = 'linear';
  const lim = TARGET.TP - 0.7; // sample-peak ceiling; true peak overshoots it by a few tenths at most
  // the room-tone floor, calibrated once: pink noise, 2.5 kHz high-pass, decorrelated channels, at FLOOR_LUFS
  const floor = roomTone(tmp, D);
  // the foley bus (score/foley.json): rendered at its final level, placed sample-exact, added after the master gain
  const foley = buildFoley(tmp, timeline, D);
  const fx = foley.events.filter((e) => e.file);
  const fxIns = fx.flatMap((e) => ['-i', e.file]);
  const fxGraph = fx.length ? `;${fx.map((e, i) => `[${i + 2}:a]aformat=sample_fmts=fltp:channel_layouts=stereo,adelay=delays=${Math.round(e.t * SR)}S:all=1[fx${i}]`).join(';')};${fx.map((_, i) => `[fx${i}]`).join('')}amix=inputs=${fx.length}:normalize=0:duration=longest,apad=whole_dur=${D},atrim=end=${D}[fxbus]` : '';
  const render = (g, limit) =>
    ff(['-y', '-v', 'error', '-i', premix, '-i', floor.file, ...fxIns, '-filter_complex', `[0:a]volume=${g.toFixed(3)}dB${limit ? `,alimiter=limit=${(10 ** (lim / 20)).toFixed(5)}:attack=3:release=80:level=0:latency=1` : ''},aresample=${SR}[m]${fxGraph};[m][1:a]${fx.length ? '[fxbus]' : ''}amix=inputs=${fx.length ? 3 : 2}:normalize=0:duration=first[out]`, '-map', '[out]', '-ar', String(SR), '-c:a', 'pcm_s24le', P.mix.master]);
  if (inTP + gain <= TARGET.TP - 0.2) render(gain, false);
  else {
    normalization = 'linear+limit';
    for (let k = 0; k < 4; k++) {
      render(gain, true);
      const got = loudness(P.mix.master).I;
      if (!Number.isFinite(got) || Math.abs(TARGET.I - got) <= 0.1) break;
      gain += TARGET.I - got;
    }
    preLimit = { gainDb: +gain.toFixed(2), limitDbfs: lim, reductionDb: +Math.max(0, inTP + gain - lim).toFixed(2), where: overshoots(premix, gain, lim, lineSpans(timeline)) };
    const w = preLimit.where;
    console.log(`  master limiter: ${preLimit.reductionDb} dB peak GR; over the ceiling in speech ${w.speech.seconds} s (max ${w.speech.maxDb} dB), in music-only ${w.music.seconds} s (max ${w.music.maxDb} dB)`);
    if (preLimit.reductionDb > 1.5) console.warn(`  warn: the master limiter takes ${preLimit.reductionDb} dB off the peaks (> 1.5 dB): lower the music or check the stem`);
  }
  const pass2 = { normalization_type: normalization };
  const final = loudness(P.mix.master);
  const masterDur = mediaDuration(P.mix.master);
  const duckRes = duck.length ? duckDepth(dryF, wetF, timeline, ASR) : { depthDb: null, speechSecondsUnderMusic: 0 };
  const shelfRes = duck.length ? duckDepth(loDryF, loWetF, timeline, ASR) : { depthDb: null };
  const musicEq = { highpassHz: HPF_HZ, highpassSlope: '24 dB/oct', shelfHz: SHELF_HZ, shelfRatio: SHELF_RATIO, keyed: duck.length > 0, lowBandReductionUnderSpeechDb: shelfRes.depthDb };
  if (shelfRes.depthDb != null) console.log(`  music EQ: ${HPF_HZ} Hz HPF 24 dB/oct; keyed shelf below ${SHELF_HZ} Hz takes ${shelfRes.depthDb} dB more off the low band under speech`);
  // momentary loudness map of the master: each line's loudest 400 ms window, and the loudest windows with no
  // speech in them (the music's own peaks: a score's climax should be the top one)
  const moments = (() => {
    const M = momentary(P.mix.master);
    const spans = timeline.shots.flatMap((s) => s.lines.map((l) => ({ id: l.id, a: s.start + l.start, b: s.start + l.end })));
    const lineOf = (t) => spans.find((x) => t > x.a && t - 0.4 < x.b)?.id ?? null;
    const lines = {};
    const free = [];
    for (const { t, M: m } of M) {
      const id = lineOf(t);
      if (id) {
        if (!lines[id] || m > lines[id].M) lines[id] = { M: +m.toFixed(1), at: +t.toFixed(2) };
      } else free.push({ M: +m.toFixed(1), at: +t.toFixed(2) });
    }
    free.sort((x, y) => y.M - x.M);
    const top = [];
    for (const f of free) if (top.length < 5 && top.every((q) => Math.abs(q.at - f.at) > 1)) top.push(f);
    return { lines, nonSpeech: top };
  })();

  // speech-to-music ratio per line (review round 1: music within ~5 dB of 'None came', on 'Fair credit' and under
  // the thesis line): each line's window, gated loudness of the voice alone (stem + the master gain) against the
  // master's; the music's share is the difference in power. QA mix.lineMasking warns under 10 dB, fails under 6.
  const lineMasking = (() => {
    const spans = lineSpans(timeline);
    const voice = spanLoudness(P.narration.wav, spans);
    const all = spanLoudness(P.mix.master, spans);
    const out = {};
    for (const sp of spans) {
      const v = voice[sp.id] + gain;
      const pAll = 10 ** (all[sp.id] / 10);
      const pV = 10 ** (v / 10);
      const music = pAll > pV * 1.0001 ? 10 * Math.log10(pAll - pV) : -Infinity;
      out[sp.id] = Number.isFinite(music) ? +(v - music).toFixed(1) : 99;
    }
    return out;
  })();
  const masked = Object.entries(lineMasking).filter(([, d]) => d < 10).sort((x, y) => x[1] - y[1]);
  if (masked.length) console.log(`  speech-to-music under 10 dB: ${masked.slice(0, 12).map(([k, d]) => `${k} ${d}`).join(', ')}`);

  // chapter slices
  const chapters = [];
  if (a.chapters !== false) {
    mkdirp(P.mix.chapters);
    for (const ch of timeline.chapters) {
      const dur = ch.end - ch.start;
      const kbps = Math.max(64, Math.min(192, Math.floor((MAX_SLICE * 8 * 0.9) / dur / 1000)));
      const out = path.join(P.mix.chapters, `${ch.number}.m4a`);
      ff(['-y', '-v', 'error', '-i', P.mix.master, '-ss', ch.start.toFixed(4), '-to', ch.end.toFixed(4), '-c:a', 'aac', '-b:a', `${kbps}k`, '-movflags', '+faststart', out]);
      const bytes = fs.statSync(out).size;
      chapters.push({ number: ch.number, id: ch.id, file: rel(out), start: ch.start, end: ch.end, kbps, bytes, ok: bytes < MAX_SLICE });
    }
  }
  const report = {
    at: new Date().toISOString(),
    target: TARGET,
    master: { file: rel(P.mix.master), duration: +masterDur.toFixed(4), I: final.I, LRA: final.LRA, TP: final.TP },
    checks: {
      loudness: Math.abs(final.I - TARGET.I) <= 0.5,
      truePeak: final.TP <= TARGET.TP + 0.1,
      length: Math.abs(masterDur - D) <= 0.01,
      // depthDb is a ceiling: calibration lands within 1 dB; more than 1.5 dB over (or under) the target fails
      duck: duckRes.depthDb == null || Math.abs(duckRes.depthDb - duckCfg.targetDb) <= 1.5,
      // never digital zero: the quietest 400 ms window of the master stays above -70 LUFS (the floor sits near -58)
      floor: minMomentary(P.mix.master) > -70,
      chapters: chapters.every((c) => c.ok),
      // a fading cue's last strike rings at least FADE_AFTER_STRIKE s before its fade starts (cues without a marker: null = unverified)
      fadeAfterStrike: placed.every((p) => !p.fade || p.fade.ok !== false),
      foley: Object.values(foley.checks).every(Boolean),
    },
    loudnorm: { input: { I: +m.input_i, TP: +m.input_tp, LRA: +m.input_lra, thresh: +m.input_thresh }, gainDb: +gain.toFixed(2), normalization: pass2.normalization_type ?? null, preLimit },
    duck: { ...duckRes, ...duckCfg, calibration },
    musicEq,
    floor: { lufs: FLOOR_LUFS, kind: 'pink noise, highpass 2.5 kHz, decorrelated L/R (tape hiss / room tone), added after the master gain', measuredLufs: floor.lufs, minMomentary: minMomentary(P.mix.master) },
    narration: readJson(P.narration.stem, null),
    moments,
    lineMasking,
    swells,
    foley: { ...foley, events: foley.events.map(({ file, ...e }) => e) },
    cues: placed,
    chapters,
  };
  writeJson(P.mix.loudness, report);
  if (!a['keep-temp']) fs.rmSync(tmp, { recursive: true, force: true });
  const ok = Object.values(report.checks).every(Boolean);
  console.log(
    `master ${rel(P.mix.master)}: ${masterDur.toFixed(2)} s, ${final.I} LUFS, TP ${final.TP} dBTP, LRA ${final.LRA} (${report.loudnorm.normalization ?? '?'})` +
      `; ${placed.length} cues${duckRes.depthDb != null ? `, duck ${duckRes.depthDb} dB` : ''}; ${chapters.length} chapter slices${ok ? '' : ' — CHECKS FAILED: ' + Object.entries(report.checks).filter(([, v]) => !v).map(([k]) => k).join(',')}`,
  );
  stageDone(P, 'mix', { ok, checks: report.checks, master: report.master, duckDb: duckRes.depthDb, outputs: [rel(P.mix.master), rel(P.mix.loudness), ...chapters.map((c) => c.file)] });
  if (!ok) process.exitCode = 1;
}

main().catch((e) => {
  try {
    stageFailed(P, 'mix', e);
  } catch {}
  console.error(`error: ${e.message}`);
  process.exit(1);
});
