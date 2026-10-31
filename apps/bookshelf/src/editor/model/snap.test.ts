/**
 * Snapping tests (node --test; erasable TS only):
 *   node --test apps/bookshelf/src/editor/model/*.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AudioMedia, EditEvent, Project } from './types.ts';
import { buildSnapIndex, editPoints, eventWordTimes, nextEditPoint, snapToFrame } from './snap.ts';
import { moveEvents } from './ops.ts';

const fade = { len: 0, curve: 'smooth' } as const;
const ev = (id: string, mediaId: string, start: number, length: number, extra: Partial<EditEvent> = {}): EditEvent => ({
  id,
  mediaId,
  start,
  length,
  srcIn: 0,
  rate: 1,
  fadeIn: { ...fade },
  fadeOut: { ...fade },
  ...extra,
});

const line: AudioMedia = {
  id: 'L1',
  kind: 'audio',
  label: 'L1',
  url: '/L1.wav',
  role: 'narration',
  duration: 3,
  speech: { start: 0.2, end: 2.6 },
  words: [
    { w: 'Once', start: 0.2, end: 0.6 },
    { w: 'upon', start: 0.7, end: 1.1 },
    { w: 'a', start: 1.15, end: 1.2 },
    { w: 'time', start: 1.3, end: 2.6 },
  ],
};

function project(): Project {
  return {
    version: 1,
    slug: 't',
    title: 't',
    fps: 24,
    width: 1920,
    height: 1080,
    sampleRate: 48000,
    media: { s: { id: 's', kind: 'shot', label: 's', film: 't', shotId: 's', duration: 10 }, L1: line },
    tracks: [
      { id: 'V1', kind: 'video', name: 'V1', mute: false, solo: false, lock: false, height: 60, events: [ev('a', 's', 0, 10), ev('b', 's', 10, 10)] },
      // the clip plays from source 0.5 at half speed, starting at 30
      { id: 'A1', kind: 'audio', name: 'A1', mute: false, solo: false, lock: false, height: 60, events: [ev('n', 'L1', 30, 4, { srcIn: 0.5, rate: 0.5 })] },
    ],
    markers: [{ id: 'm', t: 12.5, label: 'beat' }],
    regions: [{ id: 'r', start: 40, end: 45, label: 'reg' }],
    master: { gainDb: 0, limiterDb: -1.5, finish: 1 },
    createdAt: '',
    updatedAt: '',
  };
}

test('snap: nearest target within the pixel threshold wins', () => {
  const S = buildSnapIndex(project(), { cursor: 7 });
  // 40 px/s: 8 px = 0.2 s reach
  assert.deepEqual(S.snap(10.15, 40).t, 10);
  assert.equal(S.snap(10.15, 40).target?.kind, 'edge');
  assert.equal(S.snap(12.4, 40).target?.kind, 'marker');
  assert.equal(S.snap(6.9, 40).target?.kind, 'cursor');
  assert.equal(S.snap(40.1, 40).target?.kind, 'region');
  // zoomed out (4 px/s): reach is 2 s, so 10.15 still finds 10, and 11.5 finds the marker at 12.5
  assert.equal(S.snap(11.5, 4).target?.label, 'beat');
});

test('snap: frame grid when nothing is in reach (snapped=false), or raw time with frames off', () => {
  const S = buildSnapIndex(project());
  const r = S.snap(5.02, 400);
  assert.equal(r.snapped, false);
  assert.equal(r.t, snapToFrame(5.02, 24));
  assert.equal(buildSnapIndex(project(), { frames: false }).snap(5.02, 400).t, 5.02);
});

test('snap: equal distance goes to the stronger kind', () => {
  const p = project();
  p.markers.push({ id: 'm2', t: 20, label: 'end' }); // same time as the end of event b
  const S = buildSnapIndex(p);
  assert.equal(S.snap(20.05, 40).target?.kind, 'marker');
});

test('snap: narration word boundaries are placed through srcIn and rate', () => {
  const p = project();
  const e = p.tracks[1].events[0];
  const ws = eventWordTimes(e, line);
  // 'upon' starts at source 0.7 -> 30 + (0.7 − 0.5) / 0.5 = 30.4; 'Once' starts before srcIn: excluded
  assert.ok(ws.some((w) => w.w === 'upon' && w.edge === 'start' && Math.abs(w.t - 30.4) < 1e-9));
  assert.ok(!ws.some((w) => w.w === 'Once' && w.edge === 'start'));
  // 'time' ends at source 2.6 -> 34.2: past the event end (34): excluded
  assert.ok(!ws.some((w) => w.w === 'time' && w.edge === 'end'));
  const S = buildSnapIndex(p, { edges: false });
  const r = S.snap(30.43, 100);
  assert.equal(r.target?.kind, 'word');
  assert.equal(r.target?.label, 'upon');
  assert.equal(buildSnapIndex(p, { words: false, edges: false }).snap(30.43, 100).snapped, false);
});

test('snapDelta: a dragged block snaps whichever edge is nearest, ignoring its own edges', () => {
  const p = project();
  const S = buildSnapIndex(p, { exclude: ['b'] });
  // b is [10, 20]; drag by +2.42: its end lands at 22.42 (nothing), its start at 12.42 -> marker 12.5
  const r = S.snapDelta([10, 20], 2.42, 40);
  assert.ok(r.snapped);
  assert.equal(r.edge, 10);
  assert.ok(Math.abs(r.dt - 2.5) < 1e-9);
  // applying the snapped delta through the op puts the start on the marker
  const q = moveEvents(p, ['b'], r.dt);
  assert.equal(q.tracks[0].events[1].start, 12.5);
  // the excluded event's own old edges are not targets
  assert.ok(!S.targets.some((t) => t.ref === 'b'));
});

test('window limits collection; edit points and next/previous', () => {
  const S = buildSnapIndex(project(), { window: { start: 25, end: 50 } });
  assert.ok(S.targets.every((t) => t.t >= 25 && t.t <= 50));
  const p = project();
  assert.deepEqual(editPoints(p), [0, 10, 20, 30, 34]);
  assert.equal(nextEditPoint(p, 10, 1), 20);
  assert.equal(nextEditPoint(p, 10, -1), 0);
  assert.equal(nextEditPoint(p, 34, 1), null);
  assert.equal(nextEditPoint(p, 11, 1, { markers: true }), 12.5);
  assert.deepEqual(editPoints(p, { trackIds: ['A1'] }), [0, 30, 34]);
});

test('quantize: a caught target between frames is rounded to the frame grid (Vegas "Quantize to frames")', () => {
  const p = {
    version: 1,
    slug: 't',
    title: 't',
    fps: 24,
    width: 1920,
    height: 1080,
    sampleRate: 48000,
    media: {},
    tracks: [],
    markers: [{ id: 'm', t: 10.0123, label: 'off-frame' }],
    regions: [],
    master: { gainDb: 0, limiterDb: -1.5, finish: 1 },
    createdAt: '',
    updatedAt: '',
  } as unknown as Project;
  const plain = buildSnapIndex(p);
  const q = buildSnapIndex(p, { quantize: true });
  assert.equal(plain.snap(10.01, 100).t, 10.0123);
  const r = q.snap(10.01, 100);
  assert.ok(r.snapped && Math.abs(r.t * 24 - Math.round(r.t * 24)) < 1e-9, `${r.t}`);
  const d = q.snapDelta([2, 4], 8.0, 100);
  assert.ok(d.snapped && Math.abs((d.edge + d.dt) * 24 - Math.round((d.edge + d.dt) * 24)) < 1e-9);
});
