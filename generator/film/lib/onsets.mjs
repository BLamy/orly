// Note onsets in a rendered cue (pure DSP on decoded PCM).
//
//   onsets(channels, sr, { from, to })   -> [seconds]  onsets (energy rises) between from..to (s)
//   lastStrike(channels, sr, body)       -> seconds    the onset of the cue's final chord or note inside its body
//                                                      (null when the body is silent)
//
// Used by film:score analyze (cues.json lastStrike, so mix.mjs can hold a fade clear of the last chord: QA
// mix.fadeAfterStrike) and by mix.mjs as a fallback for a cue without a marker. Review round 1: no cue carried a
// lastStrike, so fadeAfterStrike never ran.
const FRAME = 0.02; // 20 ms energy frames
const LOOKBACK = 0.12; // a rise is measured against the quietest frame in the previous 120 ms
const RISE_DB = 6; // an onset raises the frame energy at least this much
const FLOOR_BELOW_PEAK_DB = 36; // ignore rises in material this far under the cue's loudest frame

function frames(channels, sr) {
  const n = Math.round(FRAME * sr);
  const len = channels[0].length;
  const out = new Float32Array(Math.ceil(len / n));
  for (let k = 0; k < out.length; k++) {
    let e = 0;
    const i0 = k * n;
    const i1 = Math.min(len, i0 + n);
    for (const ch of channels) for (let i = i0; i < i1; i++) e += ch[i] * ch[i];
    out[k] = 10 * Math.log10(e / Math.max(1, (i1 - i0) * channels.length) + 1e-14);
  }
  return out;
}

export function onsets(channels, sr, { from = 0, to = Infinity } = {}) {
  const E = frames(channels, sr);
  const peak = Math.max(...E);
  const look = Math.round(LOOKBACK / FRAME);
  const out = [];
  let last = -Infinity;
  for (let k = 1; k < E.length; k++) {
    const t = k * FRAME;
    if (t < from || t > to) continue;
    if (E[k] < peak - FLOOR_BELOW_PEAK_DB) continue;
    let mn = Infinity;
    for (let j = Math.max(0, k - look); j < k; j++) mn = Math.min(mn, E[j]);
    if (E[k] - mn >= RISE_DB && t - last > 0.1 + 1e-6) { // (epsilon: k*FRAME float error counted one strike twice, 100 ms apart)
      out.push(+t.toFixed(3));
      last = t;
    }
  }
  return out;
}

export function lastStrike(channels, sr, body) {
  const o = onsets(channels, sr, { from: 0, to: body });
  return o.length ? o[o.length - 1] : null;
}
