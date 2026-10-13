// node --test apps/bookshelf/src/editor/engine/duck.test.ts
// The deterministic duck: speech spans → dB automation with compressor-like ballistics.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AudioMedia, EditEvent, Project, Track } from '../model/types.ts';
import { DEFAULT_BRIDGE, duckDbAt, duckPoints, duckSettings, duckTimeSeconds, eventSpeechSpans, keySpans, mergeSpans, trackAudible } from './duck.ts';

const close = (a: number, b: number, eps = 1e-9, msg?: string): void => assert.ok(Math.abs(a - b) <= eps, msg ?? `${a} ≉ ${b} (±${eps})`);

const ev = (id: string, mediaId: string, start: number, length: number, srcIn = 0, rate = 1): EditEvent => ({
  id,
  mediaId,
  start,
  length,
  srcIn,
  rate,
  fadeIn: { len: 0, curve: 'linear' },
  fadeOut: { len: 0, curve: 'linear' },
});
const track = (id: string, events: EditEvent[], extra: Partial<Track> = {}): Track => ({ id, kind: 'audio', name: id, events, mute: false, solo: false, lock: false, height: 60, ...extra });
const clip = (id: string, extra: Partial<AudioMedia> = {}): AudioMedia => ({ id, kind: 'audio', label: id, duration: 10, url: `/m/${id}.wav`, role: 'narration', ...extra });

test('duckTimeSeconds reads the score convention (ms) and seconds', () => {
  assert.equal(duckTimeSeconds(20), 0.02);
  assert.equal(duckTimeSeconds(500), 0.5);
  assert.equal(duckTimeSeconds(0.25), 0.25);
  assert.equal(duckTimeSeconds(0), 0);
  assert.equal(duckTimeSeconds(Number.NaN), 0);
  assert.deepEqual(duckSettings(undefined), { depthDb: 6, attack: 0.02, release: 0.5 });
  assert.deepEqual(duckSettings({ depthDb: 3, attack: 20, release: 250 }), { depthDb: 3, attack: 0.02, release: 0.25 });
});

test('mergeSpans unions, sorts, bridges small gaps and drops empty spans', () => {
  assert.deepEqual(
    mergeSpans([
      { start: 5, end: 6 },
      { start: 0, end: 2 },
      { start: 1, end: 3 },
      { start: 4, end: 4 },
      { start: 6.2, end: 7 },
    ]),
    [
      { start: 0, end: 3 },
      { start: 5, end: 6 },
      { start: 6.2, end: 7 },
    ],
  );
  assert.deepEqual(
    mergeSpans(
      [
        { start: 5, end: 6 },
        { start: 6.2, end: 7 },
      ],
      0.3,
    ),
    [{ start: 5, end: 7 }],
  );
});

test('Vegas solo semantics', () => {
  const a = track('a', []);
  const b = track('b', [], { solo: true });
  const c = track('c', [], { solo: true, mute: true });
  assert.equal(trackAudible([a], a), true);
  assert.equal(trackAudible([a, b], a), false);
  assert.equal(trackAudible([a, b], b), true);
  assert.equal(trackAudible([a, b, c], c), false, 'mute wins over solo');
  // video tracks do not take part in audio solo
  const v: Track = { ...track('v', []), kind: 'video', solo: true };
  assert.equal(trackAudible([a, v], a), true);
});

test('eventSpeechSpans: words (bridged, clipped to speech) > speech > event, mapped through srcIn and rate', () => {
  const words = [
    { w: 'here', start: 0.5, end: 0.8 },
    { w: 'is', start: 0.9, end: 1.0 }, // 0.1 gap: bridged
    { w: 'a', start: 2.0, end: 2.2 }, // 1.0 gap: separate
    { w: 'tail', start: 3.0, end: 3.5 }, // past the speech span: clipped away
  ];
  const m = clip('L1', { words, speech: { start: 0.5, end: 2.2 } });
  // event at 10 s, starting 0.2 s into the file
  assert.deepEqual(eventSpeechSpans(ev('e', 'L1', 10, 5, 0.2), m), [
    { start: 10.3, end: 10.8 },
    { start: 11.8, end: 12 },
  ]);
  // at rate 2 source seconds pass twice as fast
  const r2 = eventSpeechSpans(ev('e', 'L1', 0, 5, 0, 2), m);
  close(r2[0].start, 0.25);
  close(r2[0].end, 0.5);
  // speech only
  assert.deepEqual(eventSpeechSpans(ev('e', 'L1', 10, 5), clip('L1', { speech: { start: 1, end: 3 } })), [{ start: 11, end: 13 }]);
  // clipped by the event's own trim
  assert.deepEqual(eventSpeechSpans(ev('e', 'L1', 10, 1.5), clip('L1', { speech: { start: 1, end: 3 } })), [{ start: 11, end: 11.5 }]);
  // nothing known: the event span
  assert.deepEqual(eventSpeechSpans(ev('e', 'X', 4, 2), undefined), [{ start: 4, end: 6 }]);
  assert.ok(DEFAULT_BRIDGE > 0.1);
});

test('keySpans: union over key tracks; muted events, muted and soloed-out tracks do not key', () => {
  const media = { L1: clip('L1', { speech: { start: 0, end: 1 } }), L2: clip('L2', { speech: { start: 0, end: 1 } }) };
  const muted = { ...ev('m', 'L2', 30, 2), mute: true };
  const a1 = track('A1', [ev('e1', 'L1', 0, 2), ev('e2', 'L2', 0.5, 2), muted]);
  const a2 = track('A2', [ev('e3', 'L1', 10, 2)]);
  const music = track('A3', []);
  const p = { tracks: [a1, a2, music], media } as Pick<Project, 'tracks' | 'media'>;
  assert.deepEqual(keySpans(p, ['A1', 'A2']), [
    { start: 0, end: 1.5 },
    { start: 10, end: 11 },
  ]);
  assert.deepEqual(keySpans({ ...p, tracks: [{ ...a1, mute: true }, a2, music] }, ['A1']), []);
  assert.deepEqual(keySpans({ ...p, tracks: [a1, a2, { ...music, solo: true }] }, ['A1', 'A2']), []);
  assert.deepEqual(keySpans(p, ['missing']), []);
});

test('duckPoints: attack to −depth, hold, release to 0 (linear in dB)', () => {
  const pts = duckPoints([{ start: 2, end: 5 }], { depthDb: 6, attack: 0.02, release: 0.5 });
  assert.deepEqual(
    pts.map((p) => [+p.t.toFixed(6), +p.v.toFixed(6)]),
    [
      [2, 0],
      [2.02, -6],
      [5, -6],
      [5.5, 0],
    ],
  );
  close(duckDbAt(pts, 0), 0);
  close(duckDbAt(pts, 2.01), -3);
  close(duckDbAt(pts, 4), -6);
  close(duckDbAt(pts, 5.25), -3);
  close(duckDbAt(pts, 9), 0);
});

test('duckPoints: a span inside the release attacks from the current level; short spans do not reach depth', () => {
  const s = { depthDb: 6, attack: 0.1, release: 1 };
  const pts = duckPoints(
    [
      { start: 0, end: 1 },
      { start: 1.5, end: 3 },
      { start: 10, end: 10.05 },
    ],
    s,
  );
  // released for 0.5 s at 6 dB/s → −3 dB when the second span starts
  close(duckDbAt(pts, 1.5), -3, 1e-9);
  // and is back at full depth 0.05 s later (60 dB/s attack)
  close(duckDbAt(pts, 1.55), -6, 1e-9);
  // the 50 ms span only gets halfway down
  close(duckDbAt(pts, 10.05), -3, 1e-9);
  close(duckDbAt(pts, 10.55), 0, 1e-9);
  // never above 0 or below −depth
  for (let t = -1; t < 12; t += 0.01) {
    const v = duckDbAt(pts, t);
    assert.ok(v <= 1e-12 && v >= -6 - 1e-12, `${v} at ${t}`);
  }
  // ordered in time
  for (let i = 1; i < pts.length; i++) assert.ok(pts[i].t >= pts[i - 1].t);
});

test('duckPoints: zero attack/release are steps; no depth or no spans → no automation', () => {
  const pts = duckPoints([{ start: 1, end: 2 }], { depthDb: 4, attack: 0, release: 0 });
  assert.deepEqual(pts, [
    { t: 1, v: 0 },
    { t: 1, v: -4 },
    { t: 2, v: -4 },
    { t: 2, v: 0 },
  ]);
  assert.deepEqual(duckPoints([], { depthDb: 6, attack: 0.02, release: 0.5 }), []);
  assert.deepEqual(duckPoints([{ start: 0, end: 1 }], { depthDb: 0, attack: 0.02, release: 0.5 }), []);
});

test('the duck is deterministic: same input, same breakpoints', () => {
  const spans = Array.from({ length: 200 }, (_, i) => ({ start: i * 3.1, end: i * 3.1 + 1.7 + (i % 3) * 0.4 }));
  const s = { depthDb: 6, attack: 0.02, release: 0.5 };
  assert.deepEqual(duckPoints(spans, s), duckPoints([...spans].reverse(), s));
});
