// The foley bus: a SPARSE set of synthesized practical sounds (review round 2: "no more than about 10 events in the
// film, each in a speech gap or under a last word"), mixed dry plus a small-room reverb at about -30 LUFS short-term,
// in the same room as the tape-hiss floor. Everything is synthesized here (deterministic PRNG), so a re-mix is
// reproducible and nothing is licensed.
//
// Source: films/<slug>/score/foley.json
//   { "events": [ { "id": "fx-stamp", "kind": "stamp", "at": { "shot": "ch15-s09", "beat": "b3" }, "lufsS": -30, "why": "..." } ] }
//   at: { shot, beat } | { shot, line, word, edge?: 'start'|'end', offset? } | { shot, t }   (shot-local, resolved
//   against narration/timeline.json, so the event follows every re-fit of its shot)
//   kinds: stamp · lamp-click · match-strike · match-flare
//   optional per event (review round 4): wetDb (room level vs the dry hit, default -8; lower = drier), maxDur
//   (seconds: the rendered event, room tail included, is cut to this with a 30 ms fade), underWord (a word-synced
//   practical may start under the NAMED word of its line when it is short and quiet: maxDur <= UNDER_WORD_MAX_DUR
//   and lufsS <= UNDER_WORD_MAX_LUFS; checked by underWordProblems)
//
//   resolveFoley(events, timeline)             -> [{ ...event, t (film s), shotLocal, problems: [] }]
//   placementProblems(ev, timeline)            -> strings (onset inside speech other than the line's last word)
//   renderFoley(ev, file, measureS)            -> { file, lufsS, gainDb, duration }   stereo 48 kHz f32 at lufsS
//   MAX_FOLEY_EVENTS = 10
import { writeWav } from './wav.mjs';

export const SR = 48000;
export const MAX_FOLEY_EVENTS = 10;
export const FOLEY_LUFS_RANGE = [-32, -28];
export const KINDS = ['stamp', 'lamp-click', 'match-strike', 'match-flare'];
// review round 4 (ch14-s07: the fence stamp lands ON 'stands', mid-line): a declared underWord event must be this
// short and this quiet so it never masks the word it sits under
export const UNDER_WORD_MAX_DUR = 0.7;
export const UNDER_WORD_MAX_LUFS = -31;

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296) * 2 - 1;
  };
}
const hash = (str) => [...String(str)].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261);

/** RBJ biquad, applied in place */
function biquad(x, type, f, q = 0.707) {
  const w = (2 * Math.PI * f) / SR;
  const c = Math.cos(w);
  const al = Math.sin(w) / (2 * q);
  let b0, b1, b2;
  if (type === 'lp') [b0, b1, b2] = [(1 - c) / 2, 1 - c, (1 - c) / 2];
  else if (type === 'hp') [b0, b1, b2] = [(1 + c) / 2, -(1 + c), (1 + c) / 2];
  else [b0, b1, b2] = [al, 0, -al]; // band-pass, 0 dB peak
  const a0 = 1 + al;
  const a1 = -2 * c;
  const a2 = 1 - al;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const y = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = y;
    x[i] = y;
  }
  return x;
}
const env = (t, attack, decay) => (t < 0 ? 0 : t < attack ? t / attack : Math.exp(-(t - attack) / decay));

/** the dry source of each kind, mono */
function source(kind, seed) {
  const r = rng(seed);
  const N = (s) => new Float32Array(Math.round(s * SR));
  if (kind === 'stamp') {
    // a rubber stamp on a card on a wooden desk: a padded thump (body ~95 Hz + low-passed knock) and a paper slap
    const x = N(0.6);
    const knock = N(0.6).map(() => r());
    biquad(knock, 'lp', 700, 0.9);
    const slap = N(0.6).map(() => r());
    biquad(slap, 'hp', 2500);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR;
      x[i] = 0.9 * knock[i] * env(t, 0.0015, 0.022) + 0.55 * Math.sin(2 * Math.PI * 95 * t) * env(t, 0.002, 0.06) + 0.25 * slap[i] * env(t, 0.0005, 0.006);
    }
    return x;
  }
  if (kind === 'lamp-click') {
    // a bakelite switch: the main snap (a 2.6 kHz resonant tick) and the softer release 48 ms later
    const x = N(0.35);
    const n = N(0.35).map(() => r());
    biquad(n, 'bp', 3400, 2.5);
    const tick = (t0, amp, f) => {
      for (let i = Math.round(t0 * SR); i < x.length; i++) {
        const t = i / SR - t0;
        x[i] += amp * (0.8 * n[i] * env(t, 0.0003, 0.0025) + 0.5 * Math.sin(2 * Math.PI * f * t) * env(t, 0.0002, 0.012));
      }
    };
    tick(0, 1, 2600);
    tick(0.048, 0.32, 2150);
    return x;
  }
  if (kind === 'match-strike') {
    // the head dragged across the striker: ~0.22 s of grainy band-limited scratch, then the ignition pop
    const x = N(0.45);
    const n = N(0.45).map(() => r());
    biquad(n, 'bp', 4200, 0.7);
    let grain = 0;
    for (let i = 0; i < x.length; i++) {
      const t = i / SR;
      if (i % 96 === 0) grain = 0.35 + 0.65 * Math.abs(r()); // 2 ms grains: the sandpaper texture
      const drag = t < 0.22 ? Math.min(1, t / 0.03) * (0.6 + 0.4 * (t / 0.22)) * grain : 0;
      const pop = env(t - 0.215, 0.001, 0.018);
      x[i] = n[i] * (0.8 * drag) + 1.1 * n[i] * pop;
    }
    return x;
  }
  if (kind === 'match-flare') {
    // the flare: a breathy whoosh whose brightness falls as the flame settles, a few crackles, then a faint steady hiss
    const x = N(1.8);
    const a = N(1.8).map(() => r());
    const b = Float32Array.from(a);
    biquad(a, 'lp', 5000);
    biquad(b, 'lp', 1200);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR;
      const bright = Math.exp(-t / 0.18);
      x[i] = (bright * a[i] + (1 - bright) * b[i]) * (env(t, 0.025, 0.45) * 0.9 + 0.08 * Math.min(1, t / 0.2) * Math.max(0, 1 - t / 1.8));
    }
    for (let k = 0; k < 7; k++) {
      const t0 = 0.05 + 0.6 * Math.abs(r()) ** 1.5;
      const amp = 0.25 + 0.3 * Math.abs(r());
      for (let i = Math.round(t0 * SR), j = 0; j < 240 && i < x.length; i++, j++) x[i] += amp * r() * Math.exp(-j / 40);
    }
    biquad(x, 'hp', 140);
    return x;
  }
  throw new Error(`unknown foley kind "${kind}" (known: ${KINDS.join(', ')})`);
}

/** a small room (Freeverb topology, small size, heavy damping), decorrelated L/R; returns the WET stereo signal */
function smallRoom(x, tailSec = 0.5) {
  const n = x.length + Math.round(tailSec * SR);
  const out = [new Float32Array(n), new Float32Array(n)];
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map((d) => Math.round((d * SR) / 44100 * 0.55));
  const allp = [556, 441, 341, 225].map((d) => Math.round((d * SR) / 44100));
  const feedback = 0.62; // small room: RT60 about 0.3 s
  const damp = 0.45;
  for (let ch = 0; ch < 2; ch++) {
    const spread = ch ? 23 : 0;
    const y = out[ch];
    for (const d0 of combs) {
      const d = d0 + spread;
      const buf = new Float32Array(d);
      let idx = 0;
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const o = buf[idx];
        lp = o * (1 - damp) + lp * damp;
        buf[idx] = (i < x.length ? x[i] : 0) * 0.015 + lp * feedback;
        idx = (idx + 1) % d;
        y[i] += o;
      }
    }
    for (const d0 of allp) {
      const d = d0 + spread;
      const buf = new Float32Array(d);
      let idx = 0;
      for (let i = 0; i < n; i++) {
        const bo = buf[idx];
        const v = y[i];
        buf[idx] = v + bo * 0.5;
        y[i] = bo - v;
        idx = (idx + 1) % d;
      }
    }
  }
  return out;
}

/** dry (centre) + small-room wet, unscaled stereo */
export function synthFoley(kind, seed = 1, { wetDb = -8, maxDur = null } = {}) {
  const dry = source(kind, seed);
  const wet = smallRoom(dry);
  const n = Number.isFinite(maxDur) && maxDur > 0 ? Math.min(wet[0].length, Math.round(maxDur * SR)) : wet[0].length;
  const pk = (c) => c.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  const g = (10 ** (wetDb / 20) * pk(dry)) / Math.max(pk(wet[0]), pk(wet[1]), 1e-9);
  const ch = [new Float32Array(n), new Float32Array(n)];
  for (let c = 0; c < 2; c++) for (let i = 0; i < n; i++) ch[c][i] = (i < dry.length ? dry[i] * 0.85 : 0) + wet[c][i] * g;
  // 4 ms fade-in guard, 30 ms fade-out at the very end
  const fo = Math.round(0.03 * SR);
  for (let c = 0; c < 2; c++) for (let i = 0; i < fo; i++) ch[c][n - 1 - i] *= i / fo;
  return ch;
}

/** shot-local seconds of an anchor, from the film clock */
export function resolveAt(at, timeline) {
  const shot = timeline.shots.find((s) => s.id === at.shot);
  if (!shot) throw new Error(`foley anchor: shot ${at.shot} is not in the timeline`);
  let local;
  if (at.beat != null) {
    local = shot.beats?.[at.beat];
    if (!Number.isFinite(local)) throw new Error(`foley anchor: ${at.shot} has no beat "${at.beat}"`);
  } else if (at.line) {
    const l = shot.lines.find((x) => x.id === at.line);
    if (!l) throw new Error(`foley anchor: ${at.shot} has no line ${at.line}`);
    if (at.word) {
      const key = (w) => String(w).toLowerCase().replace(/[^a-z0-9']/g, '');
      const w = l.words.find((x) => key(x.w) === key(at.word));
      if (!w) throw new Error(`foley anchor: ${at.line} has no word "${at.word}"`);
      local = at.edge === 'end' ? w.end : w.start;
    } else local = at.edge === 'start' ? l.start : l.end;
  } else if (Number.isFinite(at.t)) local = at.t;
  else throw new Error(`foley anchor needs beat, line or t: ${JSON.stringify(at)}`);
  local += Number(at.offset) || 0;
  return { shot, local, t: +(shot.start + local).toFixed(4) };
}

/** an event may start in a speech gap, or under the LAST word of a line (never under any other spoken word) */
export function placementProblems(t, timeline) {
  const out = [];
  for (const s of timeline.shots)
    for (const l of s.lines) {
      const a = s.start + l.start;
      const b = s.start + l.end;
      if (t <= a - 0.05 || t >= b) continue;
      const last = l.words[l.words.length - 1];
      if (last && t >= s.start + last.start - 0.05) continue;
      const w = l.words.find((x) => t >= s.start + x.start - 0.05 && t < s.start + x.end + 0.05);
      out.push(`starts under ${l.id}${w ? ` ("${w.w}")` : ''}, not under its last word or in a gap`);
    }
  return out;
}

export function resolveFoley(events, timeline) {
  return events.map((ev) => {
    const { shot, local, t } = resolveAt(ev.at, timeline);
    return { ...ev, t, shot: shot.id, shotLocal: +local.toFixed(3), problems: placementProblems(t, timeline) };
  });
}

/** synthesize, then scale so the event's max short-term (3 s) loudness is ev.lufsS (default -30) */
export function renderFoley(ev, file, measureS) {
  const ch = synthFoley(ev.kind, ev.seed ?? hash(ev.id), { wetDb: Number.isFinite(ev.wetDb) ? ev.wetDb : -8, maxDur: Number.isFinite(ev.maxDur) ? ev.maxDur : null });
  writeWav(file, ch, SR, 'f32');
  const S0 = measureS(file);
  const target = Number.isFinite(ev.lufsS) ? ev.lufsS : -30;
  const g = 10 ** ((target - S0) / 20);
  for (const c of ch) for (let i = 0; i < c.length; i++) c[i] *= g;
  writeWav(file, ch, SR, 'f32');
  return { file, lufsS: +measureS(file).toFixed(1), gainDb: +(20 * Math.log10(g)).toFixed(2), duration: +(ch[0].length / SR).toFixed(3) };
}

/** a declared underWord event (review round 4): the words it may start under, and why it may not (too long/loud) */
export function underWordProblems(ev, rendered) {
  if (!ev.underWord) return { allowed: [], problems: [] };
  const allowed = String(ev.underWord).split(/\s+/).filter(Boolean);
  const problems = [];
  if (!(rendered.duration <= UNDER_WORD_MAX_DUR + 1e-3)) problems.push(`underWord event lasts ${rendered.duration} s (max ${UNDER_WORD_MAX_DUR}; set maxDur)`);
  if (!(rendered.lufsS <= UNDER_WORD_MAX_LUFS + 0.5)) problems.push(`underWord event at ${rendered.lufsS} LUFS S (max ${UNDER_WORD_MAX_LUFS})`);
  return { allowed, problems };
}
