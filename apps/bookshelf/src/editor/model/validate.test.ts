/**
 * Project validation tests (node --test; erasable TS only):
 *   node --test apps/bookshelf/src/editor/model/*.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Project } from './types.ts';
import { assertProject, formatIssues, validateProject } from './validate.ts';

function good(): Project {
  return {
    version: 1,
    slug: 'film',
    title: 'Film',
    fps: 24,
    width: 1920,
    height: 1080,
    sampleRate: 48000,
    media: {
      s1: { id: 's1', kind: 'shot', label: 's1', film: 'film', shotId: 's1', duration: 8 },
      a1: { id: 'a1', kind: 'audio', label: 'a1', url: '/a1.wav', role: 'narration', duration: 3, speech: { start: 0.1, end: 2.8 }, words: [{ w: 'hi', start: 0.1, end: 0.4 }] },
      t1: { id: 't1', kind: 'text', label: 'Title', duration: Infinity, text: { content: 'Hello', font: 'Georgia', size: 64, color: '#fff', align: 'center', x: 640, y: 360 } },
    },
    tracks: [
      {
        id: 'V0',
        kind: 'video',
        name: 'Titles',
        events: [{ id: 'e3', mediaId: 't1', start: 1, length: 4, srcIn: 0, rate: 1, fadeIn: { len: 0.5, curve: 'smooth' }, fadeOut: { len: 0.5, curve: 'slow' } }],
        mute: false,
        solo: false,
        lock: false,
        height: 48,
      },
      {
        id: 'V1',
        kind: 'video',
        name: 'Picture',
        events: [
          {
            id: 'e1',
            mediaId: 's1',
            start: 0,
            length: 8,
            srcIn: 0,
            rate: 1,
            fadeIn: { len: 0, curve: 'smooth' },
            fadeOut: { len: 0, curve: 'smooth' },
            panCrop: [{ t: 0, v: { x: 0, y: 0, zoom: 1, rot: 0 } }],
            videoFx: [{ id: 'fx1', kind: 'sepia', enabled: true, value: [{ t: 0, v: 0 }, { t: 2, v: 1 }] }],
          },
        ],
        mute: false,
        solo: false,
        lock: false,
        height: 72,
        opacity: 1,
      },
      {
        id: 'A1',
        kind: 'audio',
        name: 'Narration',
        events: [{ id: 'e2', mediaId: 'a1', start: 1, length: 3, srcIn: 0, rate: 1, fadeIn: { len: 0, curve: 'smooth' }, fadeOut: { len: 0, curve: 'smooth' }, gainDb: -2, envelopes: { volume: [{ t: 1, v: -3, curve: 'fast' }] } }],
        mute: false,
        solo: false,
        lock: false,
        height: 64,
        gainDb: 0,
        pan: 0,
        audioFx: [{ id: 'fx2', kind: 'highpass', enabled: true, params: { frequency: 70 } }],
      },
      { id: 'A2', kind: 'audio', name: 'Music', events: [], mute: false, solo: false, lock: false, height: 56, duck: { by: ['A1'], depthDb: 6, attack: 0.02, release: 0.5 } },
    ],
    markers: [{ id: 'm1', t: 2, label: 'mark' }],
    regions: [{ id: 'r1', start: 0, end: 8, label: 'all' }],
    master: { gainDb: 0, limiterDb: -1.5, finish: 1 },
    source: { kind: 'film-import', at: '2026-10-08T00:00:00.000Z', timelineSha: 'x' },
    createdAt: '2026-10-08T00:00:00.000Z',
    updatedAt: '2026-10-08T00:00:00.000Z',
  };
}

test('a valid project passes untouched, including through JSON (Infinity -> null -> Infinity)', () => {
  const p = good();
  const json = JSON.parse(JSON.stringify(p));
  assert.equal(json.media.t1.duration, null);
  const r = validateProject(json);
  assert.ok(r.ok);
  assert.deepEqual(r.issues, []);
  assert.deepEqual(r.project, p);
  const check = validateProject(json, { repair: false });
  assert.ok(check.ok);
  assert.equal(check.project, json, 'check-only returns the input itself');
});

test('repairs: defaults, dropped events and FX, renamed duplicates, sorted events, duck sources', () => {
  const raw = JSON.parse(JSON.stringify(good()));
  delete raw.fps;
  raw.tracks[1].events.push(
    { id: 'e1', mediaId: 's1', start: 9, length: 2, srcIn: 0, rate: 1, fadeIn: { len: 0, curve: 'smooth' }, fadeOut: { len: 0, curve: 'smooth' } }, // duplicate id
    { id: 'e4', mediaId: 'ghost', start: 3, length: 1 }, // unknown media
    { id: 'e5', mediaId: 'a1', start: 3, length: 1 }, // audio on a video track
    { id: 'e6', mediaId: 's1', start: -1, length: 0 }, // zero length
  );
  raw.tracks[1].events.reverse();
  const dup = raw.tracks[1].events.find((e: { start: number }) => e.start === 9);
  dup.fadeIn = { len: 1, curve: 'wobbly' };
  dup.rate = -2;
  dup.transition = { kind: 'starWipe' };
  raw.tracks[1].events.at(-1).videoFx.push({ id: 'fx9', kind: 'glow', enabled: true, value: 1 });
  raw.tracks[3].duck.by = ['A1', 'V1', 'nope'];
  const r = validateProject(raw);
  assert.ok(r.ok, formatIssues(r.issues).join('\n'));
  const p = r.project!;
  assert.equal(p.fps, 24);
  const v1 = p.tracks[1].events;
  assert.deepEqual(v1.map((e) => e.start), [0, 9]);
  assert.equal(new Set(v1.map((e) => e.id)).size, 2);
  assert.ok(v1.some((e) => e.id === 'e1~2'));
  const moved = v1.find((e) => e.start === 9)!;
  assert.equal(moved.fadeIn.curve, 'smooth');
  assert.equal(moved.rate, 1);
  assert.equal(moved.transition?.kind, 'crossfade');
  assert.deepEqual(v1[0].videoFx?.map((f) => f.kind), ['sepia']);
  assert.deepEqual(p.tracks[3].duck?.by, ['A1']);
  const paths = r.issues.map((i) => i.path);
  for (const want of ['fps', 'mediaId', 'length', '.id', 'fadeIn.curve', 'duck.by']) assert.ok(paths.some((x) => x.includes(want)), `issue about ${want}`);
  assert.ok(r.issues.every((i) => i.repaired));
});

test('check-only mode reports without repairing', () => {
  const raw = JSON.parse(JSON.stringify(good()));
  raw.tracks[2].events[0].mediaId = 'missing';
  const r = validateProject(raw, { repair: false });
  assert.equal(r.ok, false);
  assert.equal(r.project, null);
  assert.ok(r.issues.some((i) => i.severity === 'error' && !i.repaired));
});

test('fatal: not an object, newer version, missing slug', () => {
  assert.equal(validateProject(null).ok, false);
  assert.equal(validateProject([1, 2]).ok, false);
  assert.equal(validateProject({ ...good(), version: 99 }).ok, false);
  const noSlug: Record<string, unknown> = { ...good() };
  delete noSlug.slug;
  assert.equal(validateProject(noSlug).ok, false);
  assert.throws(() => assertProject({ ...good(), version: 99 }), /newer/);
  assert.equal(assertProject(good()).slug, 'film');
});

test('media repairs: id/key mismatch, unknown kind dropped with its events, bad words filtered', () => {
  const raw = JSON.parse(JSON.stringify(good()));
  raw.media.s1.id = 'other';
  raw.media.zz = { id: 'zz', kind: 'hologram', duration: 1 };
  raw.media.a1.words.push({ w: 'bad', start: 'x', end: 1 });
  raw.tracks[1].events.push({ id: 'e9', mediaId: 'zz', start: 9, length: 1, srcIn: 0, rate: 1, fadeIn: { len: 0, curve: 'smooth' }, fadeOut: { len: 0, curve: 'smooth' } });
  const r = validateProject(raw);
  assert.ok(r.ok);
  assert.equal(r.project!.media.s1.id, 's1');
  assert.equal(r.project!.media.zz, undefined);
  assert.equal(r.project!.tracks[1].events.length, 1);
  const a1 = r.project!.media.a1;
  assert.ok(a1.kind === 'audio' && a1.words?.length === 1);
});
