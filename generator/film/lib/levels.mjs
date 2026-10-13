// Per-line narration levels (script line field levelDb) — measured the way QA checks them.
//
//   lineSpans(timeline)                 -> [{ id, a, b }]  absolute speech spans (film seconds)
//   spanLoudness(file, spans)           -> { [id]: L }     each span's OWN gated loudness (LUFS): the EBU R128
//                                                          momentary blocks (400 ms, 100 ms hop) that lie inside the
//                                                          span, power-averaged with the -70 LUFS absolute and -10 LU
//                                                          relative gates (BS.1770 integration over that window only)
//   spanPeaks(file, spans)              -> { [id]: M }     each span's loudest momentary window (informational)
//   levelOffsets(peaks, requested)      -> { [id]: { M, offsetDb, requestedDb, errorDb } }
//                                          offsetDb = M - median(M of every OTHER line); errorDb = offsetDb - requestedDb
//   median(xs)
// The narration stem applies levelDb as clip gain AFTER its compressor and peak stage (timeline.mjs), so the
// requested offset is what the listener hears; QA (mix.lineLevels) fails a line whose |errorDb| > 0.5 dB.
// Review round 1: matching each line's loudest 400 ms window made every line read -14.79 (identical peaks) while
// L1307b sat 4 dB under the median in average loudness. Lines are matched, and checked, on their gated loudness.
import { momentary } from './ffmpeg.mjs';

export const LEVEL_TOLERANCE_DB = 0.5;

export function median(xs) {
  const s = [...xs].sort((x, y) => x - y);
  const n = s.length;
  if (!n) return NaN;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

export function lineSpans(timeline) {
  return timeline.shots.flatMap((s) => s.lines.map((l) => ({ id: l.id, a: s.start + l.start, b: s.start + l.end })));
}

/** Max momentary loudness inside each span (windows that lie wholly inside it, ±50 ms). Spans shorter than the
 *  400 ms window fall back to any window that overlaps them. */
export function spanPeaks(file, spans, M = momentary(file)) {
  const out = {};
  for (const sp of spans) {
    let mx = -Infinity;
    for (const { t, M: m } of M) if (t - 0.4 >= sp.a - 0.05 && t <= sp.b + 0.05 && m > mx) mx = m;
    if (mx === -Infinity) for (const { t, M: m } of M) if (t > sp.a && t - 0.4 < sp.b && m > mx) mx = m;
    out[sp.id] = mx;
  }
  return out;
}

export function spanLoudness(file, spans, M = momentary(file)) {
  const out = {};
  const pw = (l) => 10 ** ((l + 0.691) / 10);
  const lu = (p) => -0.691 + 10 * Math.log10(p);
  for (const sp of spans) {
    let blocks = M.filter(({ t }) => t - 0.4 >= sp.a - 0.05 && t <= sp.b + 0.05).map((q) => q.M);
    if (!blocks.length) blocks = M.filter(({ t }) => t > sp.a && t - 0.4 < sp.b).map((q) => q.M);
    const abs = blocks.filter((m) => m > -70);
    if (!abs.length) {
      out[sp.id] = -70;
      continue;
    }
    const rel = lu(abs.reduce((q, m) => q + pw(m), 0) / abs.length) - 10;
    const g = abs.filter((m) => m > rel);
    out[sp.id] = +lu(g.reduce((q, m) => q + pw(m), 0) / g.length).toFixed(2);
  }
  return out;
}

export function levelOffsets(peaks, requested = {}) {
  const ids = Object.keys(peaks);
  const out = {};
  for (const id of ids) {
    const others = ids.filter((x) => x !== id).map((x) => peaks[x]);
    const offsetDb = others.length ? peaks[id] - median(others) : 0;
    const requestedDb = Number(requested[id]) || 0;
    out[id] = { M: +peaks[id].toFixed(2), offsetDb: +offsetDb.toFixed(2), requestedDb, errorDb: +(offsetDb - requestedDb).toFixed(2) };
  }
  return out;
}
