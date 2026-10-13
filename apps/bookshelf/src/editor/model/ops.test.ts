/**
 * Edit operation tests (node --test; erasable TS only):
 *   node --test apps/bookshelf/src/editor/model/*.test.ts
 *
 * Every fixture is deep-frozen, so an op that mutated its input would throw (ES modules are strict): that is the
 * "undo-free" invariant the store relies on (undo keeps the old Project object as the before-state).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AudioMedia, EditEvent, Keyframe, Media, Project, ShotMedia, Track } from './types.ts';
import { eventEnd, projectDuration, srcAt } from './types.ts';
import { dbToGain, eventFadeGain, sampleEnvelope } from '../engine/envelope.ts';
import {
  addEnvelopePoint,
  addMarker,
  addRegion,
  addTrack,
  addVideoFx,
  copyEvents,
  deleteEnvelopePoint,
  expandGroups,
  findEvent,
  groupEvents,
  insertMedia,
  moveEnvelopePoint,
  moveEvents,
  moveTrack,
  normalize,
  parseClipboard,
  pasteEvents,
  removeEvents,
  removeFx,
  removeTrack,
  serializeClipboard,
  setEventGain,
  setEventProps,
  setFade,
  setOverlapAtCut,
  setRate,
  setTrackDuck,
  setTrackProps,
  slipEvents,
  splitBlocked,
  splitEvents,
  stretchEvent,
  syncOffsets,
  toggleTrackFlag,
  trimEnd,
  trimStart,
  ungroupEvents,
  updateRegion,
} from './ops.ts';

// ---------------------------------------------------------------------------
// fixtures
// ---------------------------------------------------------------------------
function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o as Record<string, unknown>)) deepFreeze(v);
  }
  return o;
}

const shot = (id: string, duration: number): ShotMedia => ({ id, kind: 'shot', label: id, film: 'test', shotId: id, duration });
const audio = (id: string, duration: number, extra: Partial<AudioMedia> = {}): AudioMedia => ({ id, kind: 'audio', label: id, url: `/a/${id}.wav`, role: 'sfx', duration, ...extra });

function ev(id: string, mediaId: string, start: number, length: number, extra: Partial<EditEvent> = {}): EditEvent {
  return { id, mediaId, start, length, srcIn: 0, rate: 1, fadeIn: { len: 0, curve: 'smooth' }, fadeOut: { len: 0, curve: 'smooth' }, ...extra };
}

function trk(id: string, kind: Track['kind'], events: EditEvent[], extra: Partial<Track> = {}): Track {
  return { id, kind, name: id, events, mute: false, solo: false, lock: false, height: 60, ...extra };
}

/** V1: three shots back to back; A1: three clips with gaps; A2: one long bed. Markers at 4 and 20. */
function fixture(): Project {
  const media: Record<string, Media> = {
    s1: shot('s1', 10),
    s2: shot('s2', 10),
    s3: shot('s3', 10),
    a: audio('a', 10),
    b: audio('b', 10),
    bed: audio('bed', 60),
  };
  return deepFreeze<Project>({
    version: 1,
    slug: 'test',
    title: 'Test',
    fps: 24,
    width: 1920,
    height: 1080,
    sampleRate: 48000,
    media,
    tracks: [
      trk('V1', 'video', [ev('v1', 's1', 0, 10), ev('v2', 's2', 10, 10), ev('v3', 's3', 20, 10)]),
      trk('A1', 'audio', [ev('n1', 'a', 1, 4, { srcIn: 2 }), ev('n2', 'b', 8, 3), ev('n3', 'a', 15, 5)]),
      trk('A2', 'audio', [ev('m1', 'bed', 0, 30, { gainDb: -6 })], { duck: { by: ['A1'], depthDb: 6, attack: 0.02, release: 0.5 } }),
    ],
    markers: [
      { id: 'mk1', t: 4, label: 'four' },
      { id: 'mk2', t: 20, label: 'twenty' },
    ],
    regions: [{ id: 'rg1', start: 12, end: 18, label: 'r' }],
    master: { gainDb: 0, limiterDb: -1.5, finish: 1 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
}

const get = (p: Project, id: string): EditEvent => {
  const r = findEvent(p, id);
  assert.ok(r, `event ${id} exists`);
  return r.event;
};
const ids = (p: Project, track: string) => p.tracks.find((t) => t.id === track)!.events.map((e) => e.id);
const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

/** linear envelope value at event-relative t (enough to check that edits preserve envelopes) */
function envAt(keys: Keyframe[] | undefined, t: number): number {
  if (!keys?.length) return 0;
  if (t <= keys[0].t) return keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (t <= b.t) return a.v + ((t - a.t) / (b.t - a.t)) * (b.v - a.v);
  }
  return keys[keys.length - 1].v;
}

/** what plays at timeline time t on a track: [mediaId, source time] pairs */
function playing(p: Project, track: string, t: number): [string, number][] {
  return p.tracks
    .find((x) => x.id === track)!
    .events.filter((e) => e.start <= t && t < eventEnd(e))
    .map((e) => [e.mediaId, srcAt(e, t)] as [string, number]);
}

// ---------------------------------------------------------------------------
// split
// ---------------------------------------------------------------------------
test('split: both halves play exactly what the original played', () => {
  const p0 = fixture();
  const p1 = splitEvents(p0, ['v2'], 13.25, { rightIds: { v2: 'v2b' } });
  assert.notEqual(p1, p0);
  const l = get(p1, 'v2');
  const r = get(p1, 'v2b');
  near(l.length, 3.25);
  near(r.start, 13.25);
  near(r.length, 6.75);
  near(r.srcIn, 3.25);
  for (let t = 0; t < 30; t += 0.37) assert.deepEqual(playing(p1, 'V1', t), playing(p0, 'V1', t));
  assert.deepEqual(ids(p1, 'V1'), ['v1', 'v2', 'v2b', 'v3']);
});

test('split: fades, transition and envelopes are distributed and continuous', () => {
  let p = fixture();
  p = setFade(p, 'n3', 'in', { len: 1 });
  p = setFade(p, 'n3', 'out', { len: 2 });
  p = addEnvelopePoint(p, { scope: 'event', id: 'n3', env: 'volume' }, { t: 0.5, v: 0 });
  p = addEnvelopePoint(p, { scope: 'event', id: 'n3', env: 'volume' }, { t: 2.5, v: -12 });
  p = addEnvelopePoint(p, { scope: 'event', id: 'n3', env: 'volume' }, { t: 4.5, v: -3 });
  p = deepFreeze(setOverlapAtCut(p, 'v3', 2, 'iris'));
  const s = deepFreeze(splitEvents(splitEvents(p, ['n3'], 17, { rightIds: { n3: 'n3b' } }), ['v3'], 25, { rightIds: { v3: 'v3b' } }));
  const L = get(s, 'n3');
  const R = get(s, 'n3b');
  assert.equal(L.fadeIn.len, 1);
  assert.equal(L.fadeOut.len, 0);
  assert.equal(R.fadeIn.len, 0);
  assert.equal(R.fadeOut.len, 2);
  const orig = get(p, 'n3');
  for (let t = 15; t < 20; t += 0.1) {
    const want = envAt(orig.envelopes?.volume, t - orig.start);
    const half = t < 17 ? L : R;
    near(envAt(half.envelopes?.volume, t - half.start), want, 1e-9);
  }
  assert.equal(get(s, 'v3').transition?.kind, 'iris');
  assert.equal(get(s, 'v3b').transition, undefined);
});

test('split: outside or at an edge is a no-op (same project)', () => {
  const p = fixture();
  assert.equal(splitEvents(p, ['v1'], 10), p);
  assert.equal(splitEvents(p, ['v1'], 0), p);
  assert.equal(splitEvents(p, ['v1'], 25), p);
  assert.equal(splitEvents(p, ['nope'], 5), p);
});

test('split: grouped events split into a fresh group for the right halves', () => {
  const p = deepFreeze(groupEvents(fixture(), ['v1', 'm1'], 'g1'));
  const s = splitEvents(p, ['v1', 'm1'], 5, { rightIds: { v1: 'v1b', m1: 'm1b' } });
  assert.equal(get(s, 'v1').group, 'g1');
  assert.equal(get(s, 'm1').group, 'g1');
  const g2 = get(s, 'v1b').group;
  assert.ok(g2 && g2 !== 'g1');
  assert.equal(get(s, 'm1b').group, g2);
});

test('split: inside a transition (an overlap) is refused, so the transition cannot restart', () => {
  const p = deepFreeze(setOverlapAtCut(fixture(), 'v2', 2, 'iris'));
  // the overlap is 9..11: both events cover 10
  assert.deepEqual(splitBlocked(p, ['v1', 'v2'], 10).sort(), ['v1', 'v2']);
  assert.equal(splitEvents(p, ['v1', 'v2'], 10), p);
  // outside it the same split works, and only on the events that are not blocked
  assert.deepEqual(splitBlocked(p, ['v2'], 14), []);
  const s = splitEvents(p, ['v1', 'v2', 'm1'], 10.5, { rightIds: { m1: 'm1b' } });
  assert.equal(get(s, 'm1b').start, 10.5);
  assert.equal(ids(s, 'V1').length, 3);
});

/** the gain an audio event plays at event-relative tau: fades × the volume envelope (dB) */
const audioGain = (e: EditEvent, tau: number) => eventFadeGain(e.length, e.fadeIn, e.fadeOut, tau) * dbToGain(sampleEnvelope(e.envelopes?.volume, tau, 0));

test('split inside a fade: the cut part of the fade is baked into the envelope, so both halves sound the same', () => {
  let p = fixture();
  p = setFade(p, 'm1', 'in', { len: 6, curve: 'fast' });
  p = setFade(p, 'm1', 'out', { len: 8, curve: 'slow' });
  p = deepFreeze(addEnvelopePoint(p, { scope: 'event', id: 'm1', env: 'volume' }, { t: 3, v: -4 }));
  const orig = get(p, 'm1');
  // split inside the fade-in, then the right half again inside the fade-out
  const s1 = splitEvents(p, ['m1'], 2.5, { rightIds: { m1: 'm1b' } });
  const s = deepFreeze(splitEvents(s1, ['m1b'], 25, { rightIds: { m1b: 'm1c' } }));
  const halves = ['m1', 'm1b', 'm1c'].map((id) => get(s, id));
  assert.equal(halves[0].fadeIn.len, 0);
  assert.equal(halves[2].fadeOut.len, 0, 'the right half holds only part of the fade-out: it is baked, not squeezed');
  assert.ok((halves[2].envelopes?.volume?.length ?? 0) > 2);
  let worst = 0;
  for (let t = 0.05; t < 30; t += 0.05) {
    const want = audioGain(orig, t - orig.start);
    const h = halves.find((e) => e.start <= t && t < eventEnd(e))!;
    const got = audioGain(h, t - h.start);
    // dB keys are linear in dB between points: compare in dB above the bake floor
    if (want > 0.002) worst = Math.max(worst, Math.abs(20 * Math.log10(got / want)));
  }
  assert.ok(worst < 0.35, `worst deviation ${worst.toFixed(3)} dB`);
});

test('split inside a video fade bakes into the opacity envelope', () => {
  let p = setFade(fixture(), 'v2', 'in', { len: 4, curve: 'smooth' });
  p = deepFreeze(p);
  const s = splitEvents(p, ['v2'], 11, { rightIds: { v2: 'v2b' } });
  const L = get(s, 'v2');
  const R = get(s, 'v2b');
  const orig = get(p, 'v2');
  for (let t = 10; t < 14; t += 0.05) {
    const want = eventFadeGain(orig.length, orig.fadeIn, orig.fadeOut, t - 10);
    const h = t < 11 ? L : R;
    const got = eventFadeGain(h.length, h.fadeIn, h.fadeOut, t - h.start) * sampleEnvelope(h.envelopes?.opacity, t - h.start, 1);
    near(got, want, 0.006);
  }
});

test('syncOffsets: a narration line moved off its shot reports the drift (Vegas out-of-sync)', () => {
  const p0 = fixture();
  const line: AudioMedia = audio('ln', 4, { role: 'narration', speech: { start: 0.5, end: 3 }, tags: { shot: 's2', at: '1.5' } });
  // shot s2 plays on v2 from 10 s with srcIn 0: the line's speech belongs at 11.5 s → event start 11 s
  const p = deepFreeze<Project>({
    ...p0,
    media: { ...p0.media, ln: line },
    tracks: p0.tracks.map((t) => (t.id === 'A1' ? { ...t, events: [...t.events, ev('L', 'ln', 11, 4)].sort((a, b) => a.start - b.start) } : t)),
  });
  assert.equal(syncOffsets(p).has('L'), false);
  const moved = moveEvents(p, ['L'], 0.25);
  near(syncOffsets(moved).get('L') ?? NaN, 0.25);
  // moving the shot too (a group move) keeps them in sync
  const both = moveEvents(groupEvents(p, ['v2', 'L'], 'g'), ['L'], 0.25);
  assert.equal(syncOffsets(both).has('L'), false);
});

test('Ignore Event Grouping: groups:false acts on the given events only', () => {
  const p = deepFreeze(groupEvents(fixture(), ['v1', 'n1'], 'g'));
  assert.deepEqual(expandGroups(p, ['v1'], false), ['v1']);
  const m = moveEvents(p, ['v1'], 1, { groups: false });
  assert.equal(get(m, 'n1').start, 1);
  const d = removeEvents(p, ['v1'], 'off', { groups: false });
  assert.ok(findEvent(d, 'n1') && !findEvent(d, 'v1'));
  assert.equal(copyEvents(p, ['v1'], { groups: false })?.items.length, 1);
});

// ---------------------------------------------------------------------------
// trim
// ---------------------------------------------------------------------------
test('trim: file media stop at their source; material stays put', () => {
  const p = fixture();
  // n1: start 1, srcIn 2, length 4, media length 10
  const a = trimStart(p, 'n1', -5);
  near(get(a, 'n1').start, 0); // srcIn could only go back 2 s, but the timeline stops at 0 first
  near(get(a, 'n1').srcIn, 1);
  const b = trimEnd(p, 'n1', 100);
  near(eventEnd(get(b, 'n1')), 1 + (10 - 2)); // source end 10
  for (const q of [a, b]) for (let t = 1; t < 5; t += 0.3) assert.deepEqual(playing(q, 'A1', t), playing(p, 'A1', t));
  const c = trimStart(p, 'n1', 4.999999);
  assert.ok(get(c, 'n1').length >= 0.01 - 1e-9, 'min length kept');
});

test('trim: shots are unlimited (negative source time is fine)', () => {
  const p = fixture();
  const q = trimStart(p, 'v2', 7);
  near(get(q, 'v2').start, 7);
  near(get(q, 'v2').srcIn, -3);
  const r = trimEnd(p, 'v3', 50);
  near(eventEnd(get(r, 'v3')), 50);
});

test('trim: head trim keeps envelope points at their timeline positions', () => {
  let p = fixture();
  p = deepFreeze(addEnvelopePoint(p, { scope: 'event', id: 'n3', env: 'volume' }, { t: 3, v: -6 }));
  const q = trimStart(p, 'n3', 16);
  const k = get(q, 'n3').envelopes!.volume![0];
  near(get(q, 'n3').start + k.t, 18);
});

test('trim with ripple: tracks vs all', () => {
  const p = fixture();
  const t1 = trimEnd(p, 'n2', 9, { ripple: 'tracks' }); // n2 shrinks by 2
  near(get(t1, 'n3').start, 13);
  near(get(t1, 'v3').start, 20, 0); // other tracks untouched
  assert.equal(t1.markers[1].t, 20);
  const t2 = trimEnd(p, 'n2', 9, { ripple: 'all' });
  near(get(t2, 'n3').start, 13);
  near(get(t2, 'v3').start, 18);
  near(t2.markers[1].t, 18);
  near(t2.markers[0].t, 4); // before the edit point
  // ripple head trim: the event's start stays, content advances, followers close up
  const t3 = trimStart(p, 'n2', 9, { ripple: 'tracks' });
  near(get(t3, 'n2').start, 8);
  near(get(t3, 'n2').srcIn, 1);
  near(get(t3, 'n2').length, 2);
  near(get(t3, 'n3').start, 14);
});

test('locked track or event refuses edits; unlocking works', () => {
  const p = deepFreeze(setTrackProps(fixture(), 'A1', { lock: true }));
  assert.equal(trimEnd(p, 'n1', 3), p);
  assert.equal(splitEvents(p, ['n1'], 3), p);
  assert.equal(removeEvents(p, ['n1']), p);
  assert.equal(moveEvents(p, ['n1'], 1), p);
  const q = deepFreeze(setEventProps(fixture(), 'v1', { lock: true }));
  assert.equal(trimEnd(q, 'v1', 5), q);
  const r = setEventProps(q, 'v1', { lock: false });
  assert.equal(get(r, 'v1').lock, undefined);
  assert.notEqual(trimEnd(r, 'v1', 5), r);
});

// ---------------------------------------------------------------------------
// delete / move
// ---------------------------------------------------------------------------
test('ripple delete closes the gap (tracks, all, off)', () => {
  const p = fixture();
  const off = removeEvents(p, ['n2']);
  assert.deepEqual(ids(off, 'A1'), ['n1', 'n3']);
  near(get(off, 'n3').start, 15);
  const tr = removeEvents(p, ['n2'], 'tracks');
  near(get(tr, 'n3').start, 12);
  near(get(tr, 'v3').start, 20);
  const all = removeEvents(p, ['n2'], 'all');
  near(get(all, 'n3').start, 12);
  near(get(all, 'v3').start, 17);
  near(all.markers[1].t, 17);
  near(all.regions[0].start, 9);
  near(all.regions[0].end, 15);
});

test('move: within and across tracks, clamped at 0, refused across kinds', () => {
  const p = fixture();
  const a = moveEvents(p, ['n2'], -20);
  near(get(a, 'n2').start, 0);
  const b = moveEvents(p, ['n2'], 2, { trackDelta: 1 });
  assert.deepEqual(ids(b, 'A2'), ['m1', 'n2']);
  near(get(b, 'n2').start, 10);
  assert.equal(moveEvents(p, ['n2'], 0, { trackDelta: -1 }), p, 'audio onto video refused');
  assert.equal(moveEvents(p, ['n2'], 0, { trackDelta: 5 }), p, 'no such track');
  assert.equal(moveEvents(p, ['n2'], 0), p, 'no-op');
});

test('move with ripple carries the material after the moved event', () => {
  const p = fixture();
  const q = moveEvents(p, ['n2'], 3, { ripple: 'tracks' });
  near(get(q, 'n2').start, 11);
  near(get(q, 'n3').start, 18);
  near(get(q, 'n1').start, 1);
  near(get(q, 'v3').start, 20);
  const r = moveEvents(p, ['n2'], 3, { ripple: 'all' });
  near(get(r, 'v3').start, 23);
  near(get(r, 'v2').start, 13); // starts after the edit point (8)
  near(get(r, 'v1').start, 0, 0); // starts before it
  near(r.markers[1].t, 23);
});

test('groups move and delete together; ungroup dissolves', () => {
  const p = deepFreeze(groupEvents(fixture(), ['v1', 'n1'], 'g'));
  assert.deepEqual(new Set(expandGroups(p, ['v1'])), new Set(['v1', 'n1']));
  const q = moveEvents(p, ['v1'], 1);
  near(get(q, 'n1').start, 2);
  const r = removeEvents(p, ['n1']);
  assert.equal(findEvent(r, 'v1'), null);
  const u = ungroupEvents(p, ['v1']);
  assert.equal(get(u, 'v1').group, undefined);
  assert.equal(get(u, 'n1').group, undefined, 'a one-member group dissolves');
});

// ---------------------------------------------------------------------------
// slip / stretch / rate
// ---------------------------------------------------------------------------
test('slip: srcIn moves inside the source limits; shots unlimited', () => {
  const p = fixture();
  near(get(slipEvents(p, ['n1'], 100), 'n1').srcIn, 6); // 10 − length 4
  near(get(slipEvents(p, ['n1'], -100), 'n1').srcIn, 0);
  near(get(slipEvents(p, ['v2'], -4), 'v2').srcIn, -4);
  const q = slipEvents(p, ['n1'], 1);
  near(get(q, 'n1').start, 1);
  near(get(q, 'n1').length, 4);
});

test('stretch: span kept, rate follows, keys scale', () => {
  let p = fixture();
  p = deepFreeze(addEnvelopePoint(p, { scope: 'event', id: 'n3', env: 'volume' }, { t: 2.5, v: -3 }));
  const q = stretchEvent(p, 'n3', 'end', 25); // 5 s -> 10 s
  const e = get(q, 'n3');
  near(e.length, 10);
  near(e.rate, 0.5);
  near(e.envelopes!.volume![0].t, 5);
  near(srcAt(e, 25), 5);
  const r = stretchEvent(p, 'n3', 'start', 10); // keep the end at 20
  near(eventEnd(get(r, 'n3')), 20);
  near(get(r, 'n3').rate, 0.5);
  const s = stretchEvent(p, 'n3', 'end', 15.1); // would be 50×: clamped to RATE_MAX
  near(get(s, 'n3').rate, 4);
  near(get(s, 'n3').length, 1.25);
  const t = setRate(p, 'n3', 2);
  near(get(t, 'n3').length, 2.5);
});

// ---------------------------------------------------------------------------
// transitions
// ---------------------------------------------------------------------------
test('transition at a cut straddles it (film model) and resizes back to a butt edit', () => {
  const p = fixture();
  const q = deepFreeze(setOverlapAtCut(p, 'v2', 2, 'inkBleed'));
  near(eventEnd(get(q, 'v1')), 11);
  near(get(q, 'v2').start, 9);
  near(get(q, 'v2').srcIn, -1);
  assert.equal(get(q, 'v2').transition?.kind, 'inkBleed');
  // outside the overlap nothing changed
  for (const t of [5, 8.9, 11.1, 15]) assert.deepEqual(playing(q, 'V1', t).at(-1), playing(p, 'V1', t).at(-1));
  const r = setOverlapAtCut(q, 'v2', 0);
  near(eventEnd(get(r, 'v1')), 10);
  near(get(r, 'v2').start, 10);
  near(get(r, 'v2').srcIn, 0);
  assert.equal(get(r, 'v2').transition, undefined);
  // file media: the left clip cannot run past its source end
  const s = setOverlapAtCut(p, 'n2', 4); // n1 ends at 5 (src 6 of 10): no neighbour within reach
  assert.equal(s, p);
});

// ---------------------------------------------------------------------------
// envelopes, fx, levels
// ---------------------------------------------------------------------------
test('envelope points: add, move (held between neighbours), delete; values clamped', () => {
  const tgt = { scope: 'event', id: 'n3', env: 'volume' } as const;
  let p = fixture();
  p = addEnvelopePoint(p, tgt, { t: 1, v: 0 });
  p = addEnvelopePoint(p, tgt, { t: 3, v: -200 });
  p = deepFreeze(addEnvelopePoint(p, tgt, { t: 2, v: 50 }));
  const keys = get(p, 'n3').envelopes!.volume!;
  assert.deepEqual(keys.map((k) => k.t), [1, 2, 3]);
  assert.equal(keys[1].v, 12);
  assert.equal(keys[2].v, -96);
  const q = moveEnvelopePoint(p, tgt, 1, { t: 10 });
  assert.ok(get(q, 'n3').envelopes!.volume![1].t < 3);
  const r = deleteEnvelopePoint(deleteEnvelopePoint(deleteEnvelopePoint(p, tgt, 0), tgt, 0), tgt, 0);
  assert.equal(get(r, 'n3').envelopes?.volume, undefined);
  const tr = addEnvelopePoint(p, { scope: 'track', id: 'A2', env: 'pan' }, { t: 100, v: 3 });
  assert.deepEqual(tr.tracks[2].envelopes?.pan, [{ t: 100, v: 1 }]);
});

test('fx, gain and fades clamp; removing an fx clears the chain', () => {
  const p = fixture();
  const q = deepFreeze(addVideoFx(p, { scope: 'event', id: 'v1' }, 'sepia', { id: 'fx1' }));
  assert.equal(get(q, 'v1').videoFx?.[0].value, 1);
  const r = removeFx(q, { scope: 'event', id: 'v1' }, 'fx1');
  assert.equal(get(r, 'v1').videoFx, undefined);
  assert.equal(get(setEventGain(p, 'n1', 99), 'n1').gainDb, 12);
  assert.equal(get(setFade(p, 'n1', 'in', { len: 99 }), 'n1').fadeIn.len, 4);
  assert.equal(setEventGain(p, 'n1', 0), p, 'unchanged value is a no-op');
});

// ---------------------------------------------------------------------------
// tracks, markers, regions
// ---------------------------------------------------------------------------
test('tracks: add, move, flags, duck sources, remove cleans duck refs', () => {
  const p = fixture();
  const a = addTrack(p, 'video', { id: 'V2' });
  assert.equal(a.tracks[1].id, 'V2', 'video goes after the last video track');
  const b = addTrack(p, 'audio', { id: 'A3' });
  assert.equal(b.tracks.at(-1)!.id, 'A3');
  assert.deepEqual(moveTrack(p, 'A2', 0).tracks.map((t) => t.id), ['A2', 'V1', 'A1']);
  assert.equal(toggleTrackFlag(p, 'A1', 'mute').tracks[1].mute, true);
  assert.equal(setTrackProps(p, 'A1', { height: 9999 }).tracks[1].height, 480);
  assert.deepEqual(setTrackDuck(p, 'A2', { by: ['A1', 'V1', 'A2'], depthDb: 3, attack: 0.01, release: 0.2 }).tracks[2].duck?.by, ['A1']);
  const c = removeTrack(p, 'A1');
  assert.equal(c.tracks.find((t) => t.id === 'A2')!.duck, undefined);
});

test('markers and regions stay sorted; a region keeps a positive length', () => {
  let p = addMarker(fixture(), 10, 'ten', { id: 'mk3' });
  assert.deepEqual(p.markers.map((m) => m.id), ['mk1', 'mk3', 'mk2']);
  p = addRegion(p, 5, 2, 'swapped', { id: 'rg2' });
  assert.deepEqual([p.regions[0].start, p.regions[0].end], [2, 5]);
  const q = updateRegion(p, 'rg2', { end: 1 });
  assert.deepEqual([q.regions[0].start, q.regions[0].end], [1, 2]);
});

// ---------------------------------------------------------------------------
// clipboard
// ---------------------------------------------------------------------------
test('copy/paste: relative times and rows, new ids, ripple insert, JSON round trip', () => {
  const p = fixture();
  const clip = copyEvents(p, ['n2', 'n3'])!;
  assert.equal(clip.items[0].event.start, 0);
  near(clip.length, 12);
  const text = serializeClipboard(clip);
  const back = parseClipboard(text);
  assert.deepEqual(back, clip);
  const q = pasteEvents(p, back!, 30, { trackId: 'A1' });
  const a1 = q.tracks.find((t) => t.id === 'A1')!.events;
  assert.equal(a1.length, 5);
  near(a1[3].start, 30);
  near(a1[4].start, 37);
  assert.ok(!['n2', 'n3'].includes(a1[3].id), 'pasted events get new ids');
  // pasting onto the music row lands there; rows below it are created as needed
  const two = copyEvents(p, ['n1', 'm1'])!;
  const r = pasteEvents(p, two, 40, { trackId: 'A2' });
  assert.equal(r.tracks.length, 4);
  assert.equal(r.tracks[3].events.length, 1);
  // ripple paste opens a gap on the target track
  const s = pasteEvents(p, copyEvents(p, ['n2'])!, 8, { trackId: 'A1', ripple: 'tracks' });
  near(get(s, 'n2').start, 11);
  near(get(s, 'n3').start, 18);
  // into another project: media come along (Infinity survives the text form)
  const still: Media = { id: 'still', kind: 'color', label: 'black', color: '#000', duration: Infinity };
  const withStill = insertMedia(p, 'V1', still, 30, { id: 'c1' });
  const c2 = parseClipboard(serializeClipboard(copyEvents(withStill, ['c1'])!))!;
  assert.equal(c2.media.still.duration, Infinity);
  const empty = { ...p, media: {}, tracks: p.tracks.map((t) => ({ ...t, events: [] })) };
  const t2 = pasteEvents(empty, c2, 0, { trackId: 'V1' });
  assert.ok(t2.media.still);
  assert.equal(t2.tracks[0].events.length, 1);
});

// ---------------------------------------------------------------------------
// normalize + invariants
// ---------------------------------------------------------------------------
test('normalize: sorts, drops zero-length, turns a negative start into a head trim; idempotent', () => {
  const base = fixture();
  const messy: Project = {
    ...base,
    tracks: [
      trk('V1', 'video', [ev('b', 's2', 10, 10), ev('a', 's1', -2, 6), ev('z', 's3', 5, 0)]),
      ...base.tracks.slice(1),
    ],
    markers: [...base.markers].reverse(),
  };
  const n = normalize(deepFreeze(messy));
  assert.deepEqual(ids(n, 'V1'), ['a', 'b']);
  near(get(n, 'a').start, 0);
  near(get(n, 'a').srcIn, 2);
  near(get(n, 'a').length, 4);
  assert.deepEqual(n.markers.map((m) => m.t), [4, 20]);
  assert.equal(normalize(n), n);
  assert.equal(normalize(base), base);
});

test('ops never mutate their input and keep untouched tracks by reference', () => {
  const p = fixture(); // deep-frozen: a mutation would throw
  const q = trimEnd(p, 'n1', 4);
  assert.equal(q.tracks[0], p.tracks[0]);
  assert.equal(q.tracks[2], p.tracks[2]);
  assert.notEqual(q.tracks[1], p.tracks[1]);
  assert.equal(q.tracks[1].events[1], p.tracks[1].events[1]);
  assert.equal(projectDuration(q), projectDuration(p));
});
