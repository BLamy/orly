// node --test apps/bookshelf/src/editor/engine/audio.test.ts
// The pure parts of the audio engine: the peaks pyramid, FX parameter defaults, playable media, pre-roll.
// (The master limiter is tested in limiter.test.ts.)
// (The WebAudio graph itself is exercised in the browser by tools/film/editor-smoke.mjs.)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AudioFx, Project } from '../model/types.ts';
import { AUDIO_FX_PARAMS, PEAK_BLOCK, buildPeakPyramid, fxParam, fxTail, playableUrl, prerollSeconds, readPeaks } from './audio.ts';

/** brute-force min/max over sample range [i0, i1) of all channels */
function bruteMinMax(chs: Float32Array[], i0: number, i1: number): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const c of chs) for (let i = Math.max(0, i0); i < Math.min(c.length, i1); i++) {
    lo = Math.min(lo, c[i]);
    hi = Math.max(hi, c[i]);
  }
  return [lo, hi];
}

const noise = (n: number, seed: number): Float32Array => {
  let s = seed;
  return Float32Array.from({ length: n }, () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s / 0x7fffffff) * 2 - 1;
  });
};

test('pyramid levels halve and every level bounds the samples it covers', () => {
  const sr = 48000;
  const l = noise(sr * 3 + 77, 1);
  const r = noise(sr * 3 + 77, 2);
  const pyr = buildPeakPyramid([l, r], sr);
  assert.equal(pyr.length, l.length);
  assert.equal(pyr.levels[0].block, PEAK_BLOCK);
  for (let k = 1; k < pyr.levels.length; k++) assert.equal(pyr.levels[k].block, pyr.levels[k - 1].block * 2);
  assert.ok(pyr.levels[pyr.levels.length - 1].data.length / 2 <= 8);
  for (const lv of pyr.levels) {
    for (let j = 0; j < lv.data.length / 2; j += 7) {
      const [lo, hi] = bruteMinMax([l, r], j * lv.block, (j + 1) * lv.block);
      assert.equal(lv.data[j * 2], lo, `block ${lv.block} #${j} min`);
      assert.equal(lv.data[j * 2 + 1], hi, `block ${lv.block} #${j} max`);
    }
  }
});

test('readPeaks: exact from raw samples when zoomed in, a covering level when zoomed out', () => {
  const sr = 1000;
  const x = noise(20000, 3);
  const pyr = buildPeakPyramid([x], sr);
  // zoomed in: 10 samples per bucket < PEAK_BLOCK → raw read, exact
  const fine = readPeaks(pyr, [x], 1, 1.5, 50);
  for (let b = 0; b < 50; b++) {
    const [lo, hi] = bruteMinMax([x], 1000 + b * 10, 1000 + (b + 1) * 10);
    assert.equal(fine[b * 2], lo);
    assert.equal(fine[b * 2 + 1], hi);
  }
  // zoomed out: every bucket's range contains the true min/max of its samples (blocks may overhang)
  const coarse = readPeaks(pyr, null, 0, 20, 37);
  for (let b = 0; b < 37; b++) {
    const i0 = Math.floor((b * 20000) / 37);
    const i1 = Math.floor(((b + 1) * 20000) / 37);
    const [lo, hi] = bruteMinMax([x], i0, i1);
    assert.ok(coarse[b * 2] <= lo && coarse[b * 2 + 1] >= hi, `bucket ${b}`);
  }
  // evicted samples while zoomed in: falls back to level 0 (still bounds the truth)
  const fallback = readPeaks(pyr, null, 1, 1.5, 50);
  for (let b = 0; b < 50; b++) {
    const [lo, hi] = bruteMinMax([x], 1000 + b * 10, 1000 + (b + 1) * 10);
    assert.ok(fallback[b * 2] <= lo && fallback[b * 2 + 1] >= hi);
  }
});

test('readPeaks: outside the media is silence; degenerate requests are empty', () => {
  const x = Float32Array.from({ length: 4000 }, () => 0.5);
  const pyr = buildPeakPyramid([x], 1000);
  const out = readPeaks(pyr, [x], -2, 6, 8);
  assert.deepEqual([...out.subarray(0, 4)], [0, 0, 0, 0]); // −2..0 s
  assert.deepEqual([...out.subarray(4, 6)], [0.5, 0.5]);
  assert.deepEqual([...out.subarray(12, 16)], [0, 0, 0, 0]); // 4..6 s
  assert.equal(readPeaks(pyr, [x], 3, 3, 10).every((v) => v === 0), true);
  assert.equal(readPeaks(pyr, [x], 0, 1, 0).length, 0);
});

test('FX parameters: every kind has defaults; values are clamped; tails are finite', () => {
  for (const [kind, specs] of Object.entries(AUDIO_FX_PARAMS)) {
    assert.ok(specs.length > 0, kind);
    for (const s of specs) assert.ok(s.min <= s.default && s.default <= s.max, `${kind}.${s.key}`);
  }
  const rv: AudioFx = { id: 'r', kind: 'reverb', enabled: true, params: { decay: 99 } };
  assert.equal(fxParam(rv, 'decay'), 8);
  assert.equal(fxParam(rv, 'mix'), 0.25);
  assert.equal(fxTail(rv), 8 + 0.01);
  assert.equal(fxTail({ ...rv, enabled: false }), 0);
  const dl: AudioFx = { id: 'd', kind: 'delay', enabled: true, params: { time: 0.5, feedback: 0.5 } };
  assert.ok(fxTail(dl) > 4 && fxTail(dl) < 6);
});

test('playable media and the offline pre-roll', () => {
  assert.equal(playableUrl({ id: 'a', kind: 'audio', label: 'a', duration: 1, url: '/a.wav', role: 'music' }), '/a.wav');
  assert.equal(playableUrl({ id: 'v', kind: 'video', label: 'v', duration: 1, url: '/v.mp4', width: 1, height: 1, hasAudio: true }), '/v.mp4');
  assert.equal(playableUrl({ id: 'v', kind: 'video', label: 'v', duration: 1, url: '/v.mp4', width: 1, height: 1 }), null);
  assert.equal(playableUrl({ id: 's', kind: 'shot', label: 's', duration: 1, film: 'f', shotId: 's' }), null);
  assert.equal(playableUrl(undefined), null);
  const base = { tracks: [] } as unknown as Project;
  assert.equal(prerollSeconds(base), 0.5);
  const withVerb = {
    tracks: [
      { id: 'A1', kind: 'audio', events: [], audioFx: [{ id: 'r', kind: 'reverb', enabled: true, params: { decay: 2 } }] },
    ],
  } as unknown as Project;
  assert.ok(Math.abs(prerollSeconds(withVerb) - 2.51) < 1e-9);
});
