// Cutting one line's clip out of a multi-line TTS take (pure; unit-tested in generator/film/split.test.mjs).
//
//   envelope(pcm, sr)                       -> { at(t) dBFS, hop, sr, db: Float32Array }  10 ms window PEAK, 2.5 ms hop
//   quietRuns(env, t0, t1, { quietDb })     -> [{ a, b }]  stretches whose window peak stays under quietDb
//   cutLine(env, dur, al, k, opts)          -> { cs, ce, pad, head: {db, clean, how}, tail: {...}, clean }
//   edgePeaks(pcm, sr, { edge })            -> { head, tail } dBFS peak of the first/last `edge` s of real material
//                                             (leading/trailing digital zeros = pre-roll pad are skipped)
//   fadeEdges(body, sr, sec)                linear fades in place
//
// Review round 1 (neural-net-history): cutting at the MIDPOINT between the aligned end of one line and the aligned
// start of the next left ghost syllables (the alignment is often 50-200 ms late or early), e.g. L0704's tail held
// L0705's onset. Lines are now cut inside the actual silence between them: the boundary is the longest stretch
// whose 10 ms peak stays under QUIET_DB in the window between the two aligned edges (± slop), and both neighbours
// cut inside that same stretch (no overlap, no ghost). Each edge's raw peak must be under EDGE_DB; a line with no
// quiet stretch at an edge is cut at the minimum-energy point and reported `clean: false` (film:narrate then
// re-generates it on its own: narration/solo.json).
export const QUIET_DB = -52;
export const EDGE_DB = -50; // the requirement: the raw peak of each clip edge stays under this
export const EDGE_FAIL_DB = -45; // QA narration.clipEdges fails above this
export const EDGE_SEC = 0.02; // the edge window measured
export const FADE_SEC = 0.02; // 15-30 ms edge fades
export const MIN_RUN = 0.03; // a quiet stretch shorter than this is not a gap
export const SLOP = 0.06; // alignment error allowed around the aligned edges

const WIN = 0.01;
const HOP = 0.0025;

export function envelope(pcm, sr) {
  const w = Math.max(1, Math.round(WIN * sr));
  const h = Math.max(1, Math.round(HOP * sr));
  const n = Math.max(1, Math.ceil(pcm.length / h));
  const db = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const i0 = k * h;
    const i1 = Math.min(pcm.length, i0 + w);
    let m = 0;
    for (let i = i0; i < i1; i++) {
      const v = pcm[i] < 0 ? -pcm[i] : pcm[i];
      if (v > m) m = v;
    }
    db[k] = 20 * Math.log10(m + 1e-9);
  }
  // window k covers [k*hop, k*hop + win): a time t is quiet when every window touching it is quiet
  const at = (t) => {
    const k1 = Math.floor(t / HOP);
    const k0 = Math.max(0, Math.ceil((t - WIN) / HOP));
    let m = -200;
    for (let k = k0; k <= Math.min(n - 1, k1); k++) if (db[k] > m) m = db[k];
    return m;
  };
  return { db, hop: HOP, win: WIN, sr, n, at, duration: pcm.length / sr };
}

export function quietRuns(env, t0, t1, { quietDb = QUIET_DB } = {}) {
  const runs = [];
  const a0 = Math.max(0, t0);
  const b0 = Math.min(env.duration, t1);
  let start = null;
  for (let t = a0; t <= b0 + 1e-9; t += env.hop) {
    const q = env.at(t) < quietDb;
    if (q && start == null) start = t;
    if (!q && start != null) {
      runs.push({ a: start, b: t });
      start = null;
    }
  }
  if (start != null) runs.push({ a: start, b: b0 });
  return runs.map((r) => ({ a: r.a, b: r.b, len: r.b - r.a }));
}

function minEnergyPoint(env, t0, t1) {
  let best = t0;
  let m = Infinity;
  for (let t = Math.max(0, t0); t <= Math.min(env.duration, t1); t += env.hop) {
    const e = env.at(t);
    if (e < m) {
      m = e;
      best = t;
    }
  }
  return best;
}

/** The boundary between two lines of one take: the FIRST real silence (≥ 50 ms) after line A's aligned end, so a
 *  breath drawn before line B goes with B (an inhale belongs to the phrase it starts; review round 1 heard L0319's
 *  tail carrying the breath before L0320 as a ghost). Else the longest quiet stretch of at least MIN_RUN; null when
 *  there is none. */
export function boundary(env, endA, startB, opts = {}) {
  const lo = Math.min(endA, startB) - SLOP;
  const hi = Math.max(endA, startB) + SLOP;
  const runs = quietRuns(env, lo, hi, opts).filter((r) => r.len >= MIN_RUN);
  if (!runs.length) return null;
  const first = runs.find((r) => r.len >= 0.05 && r.b > endA + 0.03); // a silence that reaches past A's aligned end
  if (first) return first;
  const mid = (endA + startB) / 2;
  runs.sort((x, y) => y.len - x.len || Math.abs((x.a + x.b) / 2 - mid) - Math.abs((y.a + y.b) / 2 - mid));
  return runs[0];
}

/**
 * Where to cut line k of an aligned take. al = alignChunk() rows ({matched, start, end}); dur = take length (s).
 * opts: { pre = 0.12, post = 0.25 } seconds of air kept before/after the speech when the gap allows.
 * Returns chunk seconds { cs, ce } plus pad (digital silence to prepend so the speech never starts hard at the
 * clip head), per-edge reports and clean (both edges under EDGE_DB).
 */
export function cutLine(env, dur, al, k, { pre = 0.12, post = 0.25, quietDb = QUIET_DB } = {}) {
  const q = al[k];
  const prev = k > 0 && al[k - 1].matched ? al[k - 1] : null;
  const next = k < al.length - 1 && al[k + 1].matched ? al[k + 1] : null;
  const end = Math.min(q.end, dur);
  let cs;
  let ce;
  let headHow;
  let tailHow;
  // An edge is DIRTY when it may carry a neighbour's sound: a cut with no quiet stretch (min-energy), or a take
  // boundary with unexplained sound between it and the aligned speech (the model sometimes voices a fragment of its
  // previous_text context at the head of a take). A cut inside a quiet stretch is clean by construction.
  let headDirty = false;
  let tailDirty = false;
  if (prev) {
    const r = boundary(env, prev.end, q.start, { quietDb });
    if (r) {
      // trust the silence over the alignment (which runs 50-200 ms early or late); stay a little inside the stretch
      // so the edge window never touches the sound beyond it
      const m = Math.min(0.03, r.len / 3);
      cs = Math.max(r.a + m, r.b - pre);
      headHow = 'gap';
    } else {
      cs = Math.min(minEnergyPoint(env, Math.min(prev.end, q.start) - SLOP, Math.max(prev.end, q.start) + SLOP), Math.max(0, q.start - 0.005));
      headHow = 'min-energy';
      headDirty = true;
    }
  } else {
    // take head: the last quiet stretch before the speech onset (TTS takes open on a little air)
    const runs = quietRuns(env, 0, q.start + 0.03, { quietDb }).filter((r) => r.len >= MIN_RUN || r.a <= 1e-6);
    const r = runs[runs.length - 1];
    if (r) {
      cs = Math.max(r.a, r.b - pre);
      headHow = 'take-head';
    } else {
      cs = 0;
      headHow = 'take-start';
      headDirty = q.start > 0.1; // sound glued to the line's front that the alignment does not own
    }
  }
  if (next) {
    const r = boundary(env, end, next.start, { quietDb });
    if (r) {
      const m = Math.min(0.03, r.len / 3);
      ce = Math.min(r.b - m, r.a + post);
      tailHow = 'gap';
    } else {
      ce = Math.max(minEnergyPoint(env, Math.min(end, next.start) - SLOP, Math.max(end, next.start) + SLOP), Math.min(dur, end + 0.005));
      tailHow = 'min-energy';
      tailDirty = true;
    }
  } else {
    // take tail: the first real silence after the aligned end (≥ 80 ms, or running to the end of the take)
    const runs = quietRuns(env, end - 0.03, dur, { quietDb }).filter((r) => r.len >= 0.08 || r.b >= dur - 1e-6);
    const r = runs[0];
    if (r) {
      ce = Math.min(r.b, r.a + post);
      tailHow = 'take-tail';
    } else {
      ce = dur;
      tailHow = 'take-end';
      tailDirty = dur - end > 0.15;
    }
  }
  ce = Math.min(ce, dur);
  const pad = Math.max(0, pre - (q.start - cs));
  return { cs, ce, pad, headHow, tailHow, headDirty, tailDirty };
}

/** Edges that are cuts between two lines of one take (as opposed to the start or end of the take itself). */
export const isCutEdge = (how) => how === 'gap' || how === 'min-energy';

export function edgePeaks(pcm, sr, { edge = EDGE_SEC } = {}) {
  let i0 = 0;
  while (i0 < pcm.length && pcm[i0] === 0) i0++;
  let i1 = pcm.length;
  while (i1 > i0 && pcm[i1 - 1] === 0) i1--;
  const n = Math.max(1, Math.round(edge * sr));
  const peak = (a, b) => {
    let m = 0;
    for (let i = Math.max(0, a); i < Math.min(pcm.length, b); i++) {
      const v = Math.abs(pcm[i]);
      if (v > m) m = v;
    }
    return +(20 * Math.log10(m + 1e-9)).toFixed(1);
  };
  return { head: peak(i0, i0 + n), tail: peak(i1 - n, i1) };
}

/** Linear fades in place: head over `head` s, tail over `tail` s (20 ms at a cut; 5 ms at a take's own start or
 *  end, where nothing is hidden and a longer fade would soften the first consonant). */
export function fadeEdges(body, sr, head = FADE_SEC, tail = head) {
  const fh = Math.min(Math.round(head * sr), Math.floor(body.length / 4));
  const ft = Math.min(Math.round(tail * sr), Math.floor(body.length / 4));
  for (let i = 0; i < fh; i++) body[i] *= i / fh;
  for (let i = 0; i < ft; i++) body[body.length - 1 - i] *= i / ft;
  return body;
}

/** Loud, voiced material inside a clip's margins that is cut off from the line's speech by silence: a ghost
 *  syllable of a neighbouring line. speechStart/End are clip seconds. -> { head: sec|null, tail: sec|null } */
export function ghosts(env, speechStart, speechEnd, { loudDb = -36, quietDb = QUIET_DB } = {}) {
  const scan = (t0, t1, fromEnd) => {
    // walk away from the speech; once a quiet stretch (≥ MIN_RUN) is crossed, any loud window is a ghost
    let crossed = 0;
    const step = env.hop;
    for (let i = 0, t = fromEnd ? t1 : t0; fromEnd ? t >= t0 : t <= t1; i++, t += fromEnd ? -step : step) {
      const e = env.at(t);
      if (e < quietDb) crossed += step;
      else if (crossed >= MIN_RUN && e > loudDb) return +t.toFixed(3);
      else if (e >= quietDb) crossed = crossed >= MIN_RUN ? crossed : 0;
    }
    return null;
  };
  return {
    head: speechStart > 0.05 ? scan(0, Math.max(0, speechStart - 0.03), true) : null,
    tail: speechEnd < env.duration - 0.05 ? scan(Math.min(env.duration, speechEnd + 0.03), env.duration, false) : null,
  };
}
