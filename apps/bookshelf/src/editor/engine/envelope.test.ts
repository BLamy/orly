// node --test apps/bookshelf/src/editor/engine/envelope.test.ts
// Keyframe interpolation, fade curves and their linearisation into AudioParam breakpoints.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { EditEvent, Fade, FadeCurve, Keyframe } from '../model/types.ts';
import {
  curveShape,
  dbToGain,
  effectiveFades,
  envelopePoints,
  eventFadeGain,
  fadeInGain,
  fadeOutGain,
  fadePoints,
  gainToDb,
  linearize,
  mapPoints,
  pointsValueAt,
  sampleEnvelope,
  sampleKeyframes,
  slicePoints,
  type Point,
} from './envelope.ts';

const close = (a: number, b: number, eps = 1e-9, msg?: string): void => assert.ok(Math.abs(a - b) <= eps, msg ?? `${a} ≉ ${b} (±${eps})`);
const CURVES: FadeCurve[] = ['linear', 'fast', 'slow', 'smooth', 'sharp'];

test('every curve shape runs 0 → 1, monotonic, clamped outside [0, 1]', () => {
  for (const c of CURVES) {
    close(curveShape(c, 0), 0, 1e-12, `${c}(0)`);
    close(curveShape(c, 1), 1, 1e-12, `${c}(1)`);
    close(curveShape(c, -1), 0, 1e-12);
    close(curveShape(c, 2), 1, 1e-12);
    let prev = -1;
    for (let i = 0; i <= 200; i++) {
      const v = curveShape(c, i / 200);
      assert.ok(v >= prev - 1e-12, `${c} not monotonic at ${i / 200}`);
      prev = v;
    }
  }
  assert.equal(curveShape('hold', 0.999), 0);
  assert.equal(curveShape('hold', 1), 1);
});

test('curve characters: fast leads linear, slow lags it, smooth/sharp are S / inverse S', () => {
  close(curveShape('fast', 0.5), Math.SQRT1_2, 1e-12); // quarter sine (ffmpeg afade qsin)
  assert.ok(curveShape('fast', 0.25) > 0.25);
  assert.ok(curveShape('slow', 0.25) < 0.25);
  close(curveShape('smooth', 0.5), 0.5, 1e-12);
  assert.ok(curveShape('smooth', 0.2) < 0.2 && curveShape('smooth', 0.8) > 0.8);
  close(curveShape('sharp', 0.5), 0.5, 1e-12);
  assert.ok(curveShape('sharp', 0.2) > 0.2 && curveShape('sharp', 0.8) < 0.8);
});

test('fade-out is the time mirror of the fade-in; fast in/out is an equal-power crossfade', () => {
  for (const c of CURVES) for (let i = 0; i <= 20; i++) close(fadeOutGain(c, i / 20), fadeInGain(c, 1 - i / 20), 1e-12);
  for (let i = 0; i <= 20; i++) {
    const u = i / 20;
    close(fadeInGain('fast', u) ** 2 + fadeOutGain('fast', u) ** 2, 1, 1e-12, 'equal power');
    close(fadeInGain('linear', u) + fadeOutGain('linear', u), 1, 1e-12, 'linear sums to unity');
  }
});

test('eventFadeGain: fades at both ends, silent outside, overlapping fades multiply', () => {
  const fi: Fade = { len: 1, curve: 'linear' };
  const fo: Fade = { len: 2, curve: 'linear' };
  close(eventFadeGain(10, fi, fo, 0), 0);
  close(eventFadeGain(10, fi, fo, 0.5), 0.5);
  close(eventFadeGain(10, fi, fo, 5), 1);
  close(eventFadeGain(10, fi, fo, 9), 0.5);
  close(eventFadeGain(10, fi, fo, 10), 0);
  assert.equal(eventFadeGain(10, fi, fo, -0.1), 0);
  assert.equal(eventFadeGain(10, fi, fo, 10.1), 0);
  // a 1 s event with 1 s fades each way: product of the two ramps
  close(eventFadeGain(1, fi, { len: 1, curve: 'linear' }, 0.5), 0.25);
  // zero-length fades: unity throughout
  close(eventFadeGain(4, { len: 0, curve: 'fast' }, { len: 0, curve: 'fast' }, 0), 1);
});

test('dB conversion', () => {
  close(dbToGain(0), 1);
  close(dbToGain(-6), 0.501187, 1e-6);
  close(gainToDb(dbToGain(-13.5)), -13.5, 1e-9);
  assert.equal(dbToGain(-200), 0);
  assert.equal(gainToDb(0), -Infinity);
});

test('sampleEnvelope: holds before/after, interpolates with the left key curve, hold steps', () => {
  const keys: Keyframe[] = [
    { t: 1, v: 0, curve: 'linear' },
    { t: 3, v: 10, curve: 'hold' },
    { t: 5, v: -4, curve: 'smooth' },
    { t: 7, v: 4 },
  ];
  assert.equal(sampleEnvelope(undefined, 3, 7), 7);
  assert.equal(sampleEnvelope([], 3, 7), 7);
  close(sampleEnvelope(keys, 0), 0);
  close(sampleEnvelope(keys, 2), 5);
  close(sampleEnvelope(keys, 4.99), 10);
  close(sampleEnvelope(keys, 5), -4);
  close(sampleEnvelope(keys, 6), 0); // smooth midpoint
  close(sampleEnvelope(keys, 9), 4);
  // unsorted keys are sorted first
  close(sampleEnvelope([keys[2], keys[0], keys[1]], 2), 5);
});

test('sampleKeyframes works on structured values (Pan/Crop style)', () => {
  type P = { x: number; zoom: number };
  const mix = (a: P, b: P, u: number): P => ({ x: a.x + (b.x - a.x) * u, zoom: a.zoom + (b.zoom - a.zoom) * u });
  const keys: Keyframe<P>[] = [
    { t: 0, v: { x: 0, zoom: 1 } },
    { t: 2, v: { x: 0.5, zoom: 2 } },
  ];
  assert.deepEqual(sampleKeyframes(keys, 1, mix, { x: 9, zoom: 9 }), { x: 0.25, zoom: 1.5 });
  assert.deepEqual(sampleKeyframes([], 1, mix, { x: 9, zoom: 9 }), { x: 9, zoom: 9 });
});

/** max |pointsValueAt(points) − f| over a dense grid */
function maxErr(points: Point[], f: (t: number) => number, a: number, b: number, n = 2000): number {
  let e = 0;
  for (let i = 0; i <= n; i++) {
    const t = a + ((b - a) * i) / n;
    e = Math.max(e, Math.abs(pointsValueAt(points, t) - f(t)));
  }
  return e;
}

test('linearize approximates curves within tolerance and keeps lines as two points', () => {
  const line = linearize((t) => 2 * t + 1, 0, 10);
  assert.equal(line.length, 2);
  for (const c of CURVES) {
    const f = (t: number): number => curveShape(c, t / 3);
    const pts = linearize(f, 0, 3, 0.001);
    assert.ok(maxErr(pts, f, 0, 3) <= 0.0011, `${c}: error ${maxErr(pts, f, 0, 3)}`);
    assert.ok(pts.length < 200, `${c}: ${pts.length} points`);
  }
});

test('fadePoints matches eventFadeGain and is compact', () => {
  for (const c of CURVES) {
    const fi: Fade = { len: 1.5, curve: c };
    const fo: Fade = { len: 2.5, curve: c };
    const scale = dbToGain(-4);
    const pts = fadePoints(30, fi, fo, scale);
    const f = (t: number): number => scale * eventFadeGain(30, fi, fo, t);
    assert.ok(maxErr(pts, f, 0, 30, 6000) <= 0.0025, `${c}: ${maxErr(pts, f, 0, 30, 6000)}`);
    assert.equal(pts[0].t, 0);
    assert.equal(pts[pts.length - 1].t, 30);
  }
  // no fades: just the constant
  const flat = fadePoints(8, { len: 0, curve: 'linear' }, { len: 0, curve: 'linear' }, 0.5);
  assert.deepEqual(flat, [
    { t: 0, v: 0.5 },
    { t: 8, v: 0.5 },
  ]);
  assert.deepEqual(fadePoints(0, undefined, undefined), []);
});

test('envelopePoints: dB envelope → gain within tolerance, hold becomes a step, constant without keys', () => {
  const keys: Keyframe[] = [
    { t: 1, v: 0, curve: 'slow' },
    { t: 4, v: -18, curve: 'hold' },
    { t: 6, v: 6, curve: 'linear' },
    { t: 8, v: 0 },
  ];
  const pts = envelopePoints(keys, 0, 10, dbToGain);
  const f = (t: number): number => dbToGain(sampleEnvelope(keys, t));
  // compare away from the hold step itself (the step is exact: two points at t = 6)
  assert.ok(maxErr(pts, f, 0, 5.99) <= 0.0025);
  assert.ok(maxErr(pts, f, 6, 10) <= 0.0025);
  const step = pts.filter((p) => p.t === 6);
  assert.equal(step.length, 2);
  close(step[0].v, dbToGain(-18), 1e-12);
  close(step[1].v, dbToGain(6), 1e-12);
  assert.deepEqual(envelopePoints(undefined, 2, 5, dbToGain, 0), [
    { t: 2, v: 1 },
    { t: 5, v: 1 },
  ]);
  // a window inside one linear segment (identity map): exactly its two ends
  const lin = envelopePoints([{ t: 0, v: 0 }, { t: 10, v: 1 }], 2, 4);
  assert.equal(lin.length, 2);
  close(lin[0].v, 0.2);
  close(lin[1].v, 0.4);
});

test('pointsValueAt / slicePoints: steps take the later value, slices interpolate their ends', () => {
  const pts: Point[] = [
    { t: 0, v: 0 },
    { t: 1, v: 1 },
    { t: 1, v: 5 },
    { t: 3, v: 7 },
  ];
  close(pointsValueAt(pts, 0.5), 0.5);
  close(pointsValueAt(pts, 1), 5);
  close(pointsValueAt(pts, 2), 6);
  close(pointsValueAt(pts, -1), 0);
  close(pointsValueAt(pts, 9), 7);
  const s = slicePoints(pts, 0.5, 2);
  assert.deepEqual(
    s.map((p) => [p.t, p.v]),
    [
      [0.5, 0.5],
      [1, 1],
      [1, 5],
      [2, 6],
    ],
  );
});

test('mapPoints re-linearises a dB ramp into gain', () => {
  const db: Point[] = [
    { t: 0, v: 0 },
    { t: 1, v: -24 },
    { t: 1, v: 0 },
  ];
  const g = mapPoints(db, dbToGain, 0.001);
  const f = (t: number): number => dbToGain(-24 * Math.min(1, t));
  assert.ok(maxErr(g, f, 0, 0.999) <= 0.0011);
  close(pointsValueAt(g, 1), 1);
});

test('effectiveFades: overlaps become crossfades at least as long as the overlap', () => {
  const ev = (id: string, start: number, length: number, fin = 0, fout = 0): EditEvent => ({
    id,
    mediaId: 'm',
    start,
    length,
    srcIn: 0,
    rate: 1,
    fadeIn: { len: fin, curve: 'fast' },
    fadeOut: { len: fout, curve: 'slow' },
  });
  const f = effectiveFades([ev('a', 0, 10, 0, 0.5), ev('b', 8, 10, 3, 0), ev('c', 20, 5)]);
  assert.deepEqual(f.get('a'), { fadeIn: { len: 0, curve: 'fast' }, fadeOut: { len: 2, curve: 'slow' } });
  // b's explicit 3 s fade-in is longer than the 2 s overlap: kept
  assert.deepEqual(f.get('b')!.fadeIn, { len: 3, curve: 'fast' });
  assert.deepEqual(f.get('c'), { fadeIn: { len: 0, curve: 'fast' }, fadeOut: { len: 0, curve: 'slow' } });
});
