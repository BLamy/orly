/**
 * Timeline tests (node --test; erasable TS only):
 *   node --test apps/bookshelf/src/editor/ui/timeline/timeline.test.ts
 *
 * Covers the pure layers: geometry (ticks, timecode, layout, zoom), curves (fade shapes, level scales),
 * the gesture edits (drag move / copy / trim, auto-crossfade, duplicate track) and the gesture state machine
 * end to end (press → drag → draft) including snapping, ripple and cancel-free recomputation.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { EditEvent, Project, Track } from '../../model/types';
import type { EditorUi } from '../../state/store';
import { crossfadeFixup, dragMove, dragTrim, duplicateTrack, moveRange, trimRange } from './edits.ts';
import { deltaCode, layoutTracks, rowAt, rulerTicks, timecode, visibleRange, zoomAround, zoomLimits, type View } from './geometry.ts';
import { ENVELOPES, fadeInGain, fadeOutGain, fracToGain, gainToFrac, keyValue } from './curves.ts';
import { startGesture, type GestureEnv, type Pointer } from './gestures.ts';
import { hitTest, type LaneScene } from './hit.ts';
import { RULER_H } from './style.ts';

// ---------------------------------------------------------------------------
// fixture: V1 three shots (a→b is an iris transition overlap), A1 narration (a 4 s file), A2 music (60 s file)
// ---------------------------------------------------------------------------
function ev(id: string, mediaId: string, start: number, length: number, extra: Partial<EditEvent> = {}): EditEvent {
  return { id, mediaId, start, length, srcIn: 0, rate: 1, fadeIn: { len: 0, curve: 'linear' }, fadeOut: { len: 0, curve: 'linear' }, ...extra };
}
function track(id: string, kind: Track['kind'], events: EditEvent[], extra: Partial<Track> = {}): Track {
  return { id, kind, name: id, events, mute: false, solo: false, lock: false, height: 60, ...extra };
}
function fixture(): Project {
  return {
    version: 1,
    slug: 'test',
    title: 'Test',
    fps: 24,
    width: 1920,
    height: 1080,
    sampleRate: 48000,
    media: {
      s1: { id: 's1', kind: 'shot', label: 's1', duration: 10, film: 'test', shotId: 'a' },
      s2: { id: 's2', kind: 'shot', label: 's2', duration: 10, film: 'test', shotId: 'b' },
      s3: { id: 's3', kind: 'shot', label: 's3', duration: 10, film: 'test', shotId: 'c' },
      n1: {
        id: 'n1',
        kind: 'audio',
        label: 'L1',
        duration: 4,
        url: '/n1.wav',
        role: 'narration',
        words: [
          { w: 'hello', start: 0.25, end: 0.75 },
          { w: 'world', start: 1, end: 1.5 },
        ],
      },
      m1: { id: 'm1', kind: 'audio', label: 'cue', duration: 60, url: '/m1.wav', role: 'music' },
    },
    tracks: [
      track('V1', 'video', [ev('a', 's1', 0, 10.5), ev('b', 's2', 9.5, 10.5, { srcIn: -0.5, transition: { kind: 'iris' } }), ev('c', 's3', 20, 10)]),
      track('A1', 'audio', [ev('n', 'n1', 2, 4), ev('n2', 'n1', 12, 4)]),
      track('A2', 'audio', [ev('m', 'm1', 0, 30)]),
    ],
    markers: [{ id: 'mk', t: 15, label: 'ch2' }],
    regions: [{ id: 'rg', start: 20, end: 30, label: 'ch3' }],
    master: { gainDb: 0, limiterDb: -1, finish: 0 },
    createdAt: '',
    updatedAt: '',
  };
}
const find = (p: Project, id: string): EditEvent => {
  for (const t of p.tracks) for (const e of t.events) if (e.id === id) return e;
  throw new Error(`no event ${id}`);
};
const near = (a: number, b: number, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

const UI: EditorUi = {
  cursor: 7,
  playing: false,
  loop: null,
  looping: false,
  selection: [],
  track: null,
  pxPerSec: 40,
  scrollT: 0,
  snapping: true,
  ripple: 'off',
  autoCrossfade: true,
  tool: 'normal',
  previewScale: 0.5,
  showEnvelopes: true,
  status: '',
};

// ---------------------------------------------------------------------------
// geometry
// ---------------------------------------------------------------------------
test('timecode floors frames; ":" before the frames, ";" only at drop-frame rates', () => {
  assert.equal(timecode(0, 24), '00:00:00:00');
  assert.equal(timecode(61 + 12 / 24, 24), '00:01:01:12');
  assert.equal(timecode(3600, 24), '01:00:00:00');
  assert.equal(deltaCode(-1.5, 24), '-1:12');
  assert.equal(deltaCode(75, 24), '+1:15:00');
  assert.equal(timecode(1, 30000 / 1001), '00:00:01;00');
  assert.equal(timecode(1, 25), '00:00:01:00');
});

test('ruler ticks adapt from frames to minutes and minor divides major', () => {
  const fine = rulerTicks(2000, 24);
  assert.ok(fine.frames && fine.major < 1);
  assert.ok(rulerTicks(0.5, 24).major >= 60);
  for (const px of [0.2, 3, 40, 300, 1900]) {
    const t = rulerTicks(px, 24);
    assert.ok(t.major * px >= 104 || t.major === 7200);
    near((t.major / t.minor) % 1, 0, 1e-6);
  }
});

test('track layout, row lookup and visible range', () => {
  const p = fixture();
  const { rows, total } = layoutTracks(p.tracks, new Map([['A1', 100]]));
  assert.equal(total, 220);
  assert.equal(rowAt(rows, 0), 0);
  assert.equal(rowAt(rows, 61), 1);
  assert.equal(rowAt(rows, 219), 2);
  assert.equal(rowAt(rows, 220), -1);
  const [i0, i1] = visibleRange(p.tracks[0], 10.5, 19.9, 21);
  assert.deepEqual([i0, i1], [1, 3]); // a (0..10.5) has ended before 19.9
  const [j0, j1] = visibleRange(p.tracks[0], 10.5, 25, 26);
  assert.deepEqual(p.tracks[0].events.slice(j0, j1).map((e) => e.id).includes('c'), true);
});

test('zoom keeps the anchor under the same x and respects limits', () => {
  const view = { scrollT: 10, pxPerSec: 40, width: 1000 };
  const lim = zoomLimits(2000, 1000, 24);
  const z = zoomAround(view, 2, 15, lim);
  near((15 - z.scrollT) * z.pxPerSec, (15 - 10) * 40, 1e-9);
  assert.equal(zoomAround(view, 1e9, 15, lim).pxPerSec, lim.max);
  assert.equal(zoomAround(view, 1e-9, 15, lim).pxPerSec, lim.min);
});

// ---------------------------------------------------------------------------
// curves
// ---------------------------------------------------------------------------
test('fade shapes hit their ends and level scales round-trip', () => {
  for (const c of ['linear', 'fast', 'slow', 'smooth', 'sharp'] as const) {
    near(fadeInGain(c, 0), 0, 1e-9);
    near(fadeInGain(c, 1), 1, 1e-9);
    near(fadeOutGain(c, 0), 1, 1e-9);
  }
  assert.ok(fadeInGain('fast', 0.2) > 0.2 && fadeInGain('slow', 0.2) < 0.2);
  near(gainToFrac(0), 1);
  near(fracToGain(gainToFrac(-9)), -9, 1e-9);
  near(ENVELOPES.volume.fromFrac(ENVELOPES.volume.toFrac(-3)), -3, 1e-9);
  near(ENVELOPES.pan.fromFrac(ENVELOPES.pan.toFrac(-0.4)), -0.4, 1e-9);
  near(keyValue([{ t: 0, v: 0 }, { t: 2, v: 1 }], 1, 5), 0.5);
  near(keyValue([{ t: 0, v: 0, curve: 'hold' }, { t: 2, v: 1 }], 1.9, 5), 0);
  near(keyValue(undefined, 1, 5), 5);
});

// ---------------------------------------------------------------------------
// gesture edits
// ---------------------------------------------------------------------------
test('drag move: clamps at 0, keeps order, never moves locked events', () => {
  const p = fixture();
  const q = dragMove(p, { ids: ['c'], dt: -100, trackDelta: 0, ripple: 'off', autoCrossfade: true });
  near(find(q, 'c').start, 0);
  assert.equal(q.tracks[0].events[0].start, 0);
  const locked = { ...p, tracks: p.tracks.map((t, i) => (i === 0 ? { ...t, lock: true } : t)) };
  assert.equal(dragMove(locked, { ids: ['c'], dt: 2, trackDelta: 0, ripple: 'off', autoCrossfade: true }), locked);
});

test('move range: same-kind, unlocked destination tracks only', () => {
  const p = fixture();
  assert.equal(moveRange(p, ['n'], 1).trackDelta, 1);
  assert.equal(moveRange(p, ['n'], -1).trackDelta, 0, 'audio cannot go onto a video track');
  assert.equal(moveRange(p, ['n'], 5).trackDelta, 1, 'clamped to the last audio track');
  const q = dragMove(p, { ids: ['n'], dt: 0, trackDelta: 5, ripple: 'off', autoCrossfade: false });
  assert.ok(q.tracks[2].events.some((e) => e.id === 'n'));
});

test('drag move with ripple shifts following material (tracks) and markers (all)', () => {
  const p = fixture();
  const q = dragMove(p, { ids: ['a'], dt: 2, trackDelta: 0, ripple: 'tracks', autoCrossfade: true });
  near(find(q, 'b').start, 11.5);
  near(find(q, 'c').start, 22);
  near(find(q, 'n').start, 2);
  const r = dragMove(p, { ids: ['a'], dt: 2, trackDelta: 0, ripple: 'all', autoCrossfade: true });
  near(find(r, 'n').start, 4);
  near(r.markers[0].t, 17);
});

test('ctrl-drag copy leaves the original and adds a copy with a fresh id', () => {
  const p = fixture();
  const q = dragMove(p, { ids: ['c'], dt: 15, trackDelta: 0, copy: true, ripple: 'all', autoCrossfade: true });
  assert.equal(q.tracks[0].events.length, 4);
  near(find(q, 'c').start, 20);
  assert.ok(q.tracks[0].events.some((e) => e.id !== 'c' && e.start === 35 && e.mediaId === 's3'));
  near(q.markers[0].t, 15, 0);
});

test('audio auto-crossfade sets fades to the overlap and clears them when pulled apart', () => {
  const p = fixture();
  const q = dragMove(p, { ids: ['n2'], dt: -7, trackDelta: 0, ripple: 'off', autoCrossfade: true });
  near(find(q, 'n').fadeOut.len, 1);
  near(find(q, 'n2').fadeIn.len, 1);
  const r = dragMove(q, { ids: ['n2'], dt: 5, trackDelta: 0, ripple: 'off', autoCrossfade: true });
  near(find(r, 'n').fadeOut.len, 0);
  near(find(r, 'n2').fadeIn.len, 0);
  const off = dragMove(p, { ids: ['n2'], dt: -7, trackDelta: 0, ripple: 'off', autoCrossfade: false });
  near(find(off, 'n').fadeOut.len, 0);
});

test('video overlap: auto-crossfade off makes a new overlap a cut; existing transitions are kept', () => {
  const p = fixture();
  const q = dragMove(p, { ids: ['c'], dt: -1, trackDelta: 0, ripple: 'off', autoCrossfade: false });
  assert.deepEqual(find(q, 'c').transition, { kind: 'cut' });
  assert.deepEqual(find(q, 'b').transition, { kind: 'iris' });
  assert.equal(find(crossfadeFixup(p, q, new Set(['c']), true), 'c').transition, undefined);
});

test('drag trim: files stop at their source, shots are unlimited, ripple keeps transition overlaps', () => {
  const p = fixture();
  const [lo, hi] = trimRange(p, ['n'], 'end', 'off');
  near(lo, 1 / 24 - 4);
  near(hi, 0);
  near(trimRange(p, ['n'], 'start', 'off')[0], 0);
  near(find(dragTrim(p, { ids: ['n'], edge: 'end', dt: 3, ripple: 'off', autoCrossfade: true }), 'n').length, 4);
  near(find(dragTrim(p, { ids: ['c'], edge: 'end', dt: 100, ripple: 'off', autoCrossfade: true }), 'c').length, 110);
  const h = dragTrim(p, { ids: ['c'], edge: 'start', dt: 2, ripple: 'off', autoCrossfade: true });
  near(find(h, 'c').start, 22);
  near(find(h, 'c').srcIn, 2);
  // ripple tail trim of a: the overlapping successor b moves with it, so the iris overlap survives
  const rt = dragTrim(p, { ids: ['a'], edge: 'end', dt: -2, ripple: 'tracks', autoCrossfade: true });
  near(find(rt, 'b').start, 7.5);
  near(find(rt, 'c').start, 18);
  near(find(rt, 'n').start, 2);
  // two selected events trimmed together by the same amount
  const both = dragTrim(p, { ids: ['n', 'n2'], edge: 'end', dt: -1, ripple: 'off', autoCrossfade: true });
  near(find(both, 'n').length, 3);
  near(find(both, 'n2').length, 3);
});

test('duplicate track copies events with fresh ids directly below', () => {
  const { project, id } = duplicateTrack(fixture(), 'V1');
  assert.equal(project.tracks[1].id, id);
  assert.equal(project.tracks[1].events.length, 3);
  assert.ok(project.tracks[1].events.every((e) => !['a', 'b', 'c'].includes(e.id)));
});

// ---------------------------------------------------------------------------
// gestures end to end: press → drag → draft
// ---------------------------------------------------------------------------
function sceneAndEnv(p: Project, ui: EditorUi = UI): { scene: LaneScene; env: GestureEnv } {
  const view: View = { scrollT: 0, pxPerSec: ui.pxPerSec, width: 1600 };
  const { rows } = layoutTracks(p.tracks);
  const maxLens = new Map(p.tracks.map((t) => [t.id, Math.max(0, ...t.events.map((e) => e.length))]));
  const scene: LaneScene = { project: p, ui, view, height: 400, rows, scrollY: 0, maxLens, tabs: [] };
  return { scene, env: { base: p, ui, view, rows, scrollY: 0, height: 400 } };
}
const ptr = (x: number, y: number, mods: Partial<Pointer> = {}): Pointer => ({ x, y, ctrl: false, alt: false, shift: false, ...mods });
/** canvas y in the middle of a track body */
const rowMid = (i: number) => RULER_H + i * 60 + 40;

test('hit testing finds edges, bodies, fade handles and the ruler', () => {
  const p = fixture();
  const { scene } = sceneAndEnv(p);
  assert.equal(hitTest(scene, 100, 20).zone, 'ruler');
  const body = hitTest(scene, 2 * 40 + 60, rowMid(1));
  assert.ok(body.zone === 'event' && body.eventId === 'n' && body.part === 'body');
  const edge = hitTest(scene, 6 * 40 + 2, rowMid(1));
  assert.ok(edge.zone === 'event' && edge.eventId === 'n' && edge.part === 'trimEnd');
  const fade = hitTest(scene, 2 * 40 + 2, RULER_H + 60 + 3);
  assert.ok(fade.zone === 'event' && fade.part === 'fadeIn', JSON.stringify(fade));
  const lane = hitTest(scene, 9 * 40, rowMid(1));
  assert.equal(lane.zone, 'lane');
});

test('move gesture snaps the dragged edge to the cursor and recomputes from the press', () => {
  const p = fixture();
  const { scene, env } = sceneAndEnv(p);
  const x0 = 13 * 40; // inside n2 (12..16)
  const hit = hitTest(scene, x0, rowMid(1));
  assert.ok(hit.zone === 'event' && hit.eventId === 'n2');
  const g = startGesture(hit, env, ptr(x0, rowMid(1)), ['n2']);
  assert.equal(g?.kind, 'move');
  // drag left 4.9 s: n2's start lands 4 px from the cursor at 7 s → snaps exactly to 7
  const f = g!.update(env, ptr(x0 - 4.9 * 40, rowMid(1)));
  near(find(f.project!, 'n2').start, 7);
  near(f.snapT ?? NaN, 7);
  // shift inverts snapping: raw position
  const raw = g!.update(env, ptr(x0 - 4.9 * 40, rowMid(1), { shift: true }));
  near(find(raw.project!, 'n2').start, 7.1, 1e-9);
  // the draft always derives from the press-time project
  assert.equal(find(p, 'n2').start, 12);
});

test('trim gesture clamps a narration file at its source end; ctrl-drag stretches', () => {
  const p = fixture();
  const { scene, env } = sceneAndEnv(p);
  const x = 16 * 40;
  const hit = hitTest(scene, x, rowMid(1));
  assert.ok(hit.zone === 'event' && hit.eventId === 'n2' && hit.part === 'trimEnd');
  const trim = startGesture(hit, env, ptr(x, rowMid(1)), ['n2']);
  near(find(trim!.update(env, ptr(x + 200, rowMid(1))).project ?? p, 'n2').length, 4);
  const stretch = startGesture(hit, env, ptr(x, rowMid(1), { ctrl: true }), ['n2']);
  assert.equal(stretch?.kind, 'stretch');
  const f = stretch!.update(env, ptr(x + 4 * 40, rowMid(1), { ctrl: true }));
  near(find(f.project!, 'n2').length, 8);
  near(find(f.project!, 'n2').rate, 0.5);
});

test('marquee gesture (Selection tool, or Ctrl-drag) selects intersecting events across rows', () => {
  const p = fixture();
  const { env } = sceneAndEnv(p);
  const sel = { ...env, ui: { ...env.ui, tool: 'select' as const } };
  const g = startGesture({ zone: 'lane', trackId: 'A1', row: 1, t: 9 }, sel, ptr(9 * 40, rowMid(1)), []);
  assert.equal(g?.kind, 'marquee');
  const f = g!.update(sel, ptr(13 * 40, rowMid(0)));
  assert.deepEqual(new Set(f.ui?.selection), new Set(['a', 'b', 'n2']));
  const c = startGesture({ zone: 'lane', trackId: 'A1', row: 1, t: 9 }, env, { ...ptr(9 * 40, rowMid(1)), ctrl: true }, []);
  assert.equal(c?.kind, 'marquee');
});

test('a drag on an empty lane with the Normal tool makes a time selection (the loop bar), as in Vegas', () => {
  const p = fixture();
  const { env } = sceneAndEnv(p);
  const g = startGesture({ zone: 'lane', trackId: 'A1', row: 1, t: 9 }, env, ptr(9 * 40, rowMid(1)), []);
  assert.equal(g?.kind, 'loop');
  const f = g!.update(env, ptr(13 * 40, rowMid(0)));
  assert.ok(f.ui?.loop && Math.abs(f.ui.loop.start - 9) < 1e-9 && Math.abs(f.ui.loop.end - 13) < 1e-9, JSON.stringify(f.ui));
});
