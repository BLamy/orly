/**
 * Film import tests (node --test; erasable TS only):
 *   node --test apps/bookshelf/src/editor/model/*.test.ts
 *
 * Round-trip invariants, checked on a small synthetic film and on the real films on disk:
 *   picture    at every frame, V1 plays exactly the shots (and shot-local times) reel.ts paints, and every
 *              overlap carries the reel's transition kind (the reel's `at` is mirrored below)
 *   narration  every timeline line is placed, its speech and each word land where timeline.json has them,
 *              and neighbouring clips do not overlap
 *   music      cues sit at cue.start with their gain and fades; overlapping cues alternate rows; ducked rows
 *              duck under A1
 *   project    length = film length; it survives JSON and validates without errors
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FilmBundle, Project } from './types.ts';
import { eventEnd, projectDuration, srcAt } from './types.ts';
import type { FilmFileInfo, FilmImportData, ImportShot } from './importFilm.ts';
import { IMPORT_TRACKS, cueFadeOut, importFilmReport, shotTransitions, shotGroup } from './importFilm.ts';
import { syncOffsets } from './ops.ts';
import { validateProject } from './validate.ts';

/** FilmBundle (the server's wire type) is accepted as it is */
export const bundleIsImportData = (b: FilmBundle): FilmImportData => b;

const NOW = '2026-10-08T00:00:00.000Z';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..');

// ---------------------------------------------------------------------------
// the reel's clock (reel.ts createReel().at), mirrored for the invariant
// ---------------------------------------------------------------------------
interface ReelSlice {
  a: string;
  la: number;
  b?: string;
  lb?: number;
  kind?: string;
}
function reelAt(shots: readonly ImportShot[], duration: number, t: number): ReelSlice {
  const trans = shotTransitions(shots);
  const tt = Math.max(0, Math.min(t, duration));
  let i = 0;
  while (i + 1 < shots.length && shots[i + 1].start <= tt) i++;
  const s = shots[i];
  const half = trans[i].dur / 2;
  if (i > 0 && half > 0 && tt - s.start < half) {
    const p = shots[i - 1];
    return { a: p.id, la: tt - p.start, b: s.id, lb: tt - s.start, kind: trans[i].kind };
  }
  const n = shots[i + 1];
  if (n && trans[i + 1].dur > 0 && n.start - tt < trans[i + 1].dur / 2) {
    return { a: s.id, la: tt - s.start, b: n.id, lb: tt - n.start, kind: trans[i + 1].kind };
  }
  return { a: s.id, la: tt - s.start };
}

/** assert the imported project against the film it came from */
function checkRoundTrip(data: FilmImportData, project: Project, opts: { allowOverlapWarnings?: boolean } = {}) {
  const tl = data.timeline;
  const duration = tl.duration;
  const fps = tl.fps;
  assert.ok(Math.abs(projectDuration(project) - duration) < 1e-6, `project length ${projectDuration(project)} = film ${duration}`);
  const V1 = project.tracks.find((t) => t.id === IMPORT_TRACKS.picture)!;
  // picture: every frame, sampled mid-frame (and the exact frame instants)
  const frames = Math.round(duration * fps);
  for (let f = 0; f < frames; f++) {
    for (const t of [f / fps, (f + 0.5) / fps]) {
      const want = reelAt(tl.shots, duration, t);
      // the frame exactly at an overlap's start is u = 0: the reel paints A alone, the editor composites A with B at
      // u = 0 (which the compositor must treat as A alone); compare the shot the viewer sees
      const active = V1.events.filter((e, k, all) => e.start <= t + 1e-9 && t < eventEnd(e) - 1e-9 && !(k > 0 && Math.abs(e.start - t) < 1e-9 && eventEnd(all[k - 1]) > t + 1e-9));
      const got = active.map((e) => ({ shot: project.media[e.mediaId].kind === 'shot' ? (project.media[e.mediaId] as { shotId: string }).shotId : '', local: srcAt(e, t), e }));
      const exp = want.b ? [{ shot: want.a, local: want.la }, { shot: want.b, local: want.lb! }] : [{ shot: want.a, local: want.la }];
      assert.equal(got.length, exp.length, `t=${t.toFixed(4)}: ${got.map((g) => g.shot)} vs ${exp.map((x) => x.shot)}`);
      got.forEach((g, k) => {
        assert.equal(g.shot, exp[k].shot, `t=${t}`);
        assert.ok(Math.abs(g.local - exp[k].local) < 1e-5, `t=${t} ${g.shot}: local ${g.local} vs ${exp[k].local}`);
      });
      if (want.b) assert.equal(got[1].e.transition?.kind, want.kind, `t=${t}: transition kind`);
    }
  }
  // narration: speech and words land on the timeline's line
  const A1 = project.tracks.find((t) => t.id === IMPORT_TRACKS.narration)!;
  for (const s of tl.shots)
    for (const l of s.lines) {
      const e = A1.events.find((x) => x.mediaId === `line-${l.id}`);
      assert.ok(e, `line ${l.id} placed`);
      const m = project.media[e.mediaId];
      assert.equal(m.kind, 'audio');
      if (m.kind !== 'audio') continue;
      const at = (src: number) => e.start + (src - e.srcIn) / e.rate;
      assert.ok(Math.abs(at(m.speech!.start) - (s.start + l.start)) < 2e-3, `${l.id} speech start ${at(m.speech!.start)} vs ${s.start + l.start}`);
      assert.ok(Math.abs(at(m.speech!.end) - (s.start + l.end)) < 2e-3, `${l.id} speech end`);
      (m.words ?? []).forEach((w, k) => {
        const tw = l.words[k];
        assert.ok(tw && Math.abs(at(w.start) - (s.start + tw.start)) < 2e-3, `${l.id} word ${k} "${w.w}"`);
      });
      // the speech is inside the event
      assert.ok(e.start <= at(m.speech!.start) + 1e-6 && at(m.speech!.end) <= eventEnd(e) + 1e-6, `${l.id} speech inside its event`);
    }
  if (!opts.allowOverlapWarnings)
    for (let i = 1; i < A1.events.length; i++) assert.ok(eventEnd(A1.events[i - 1]) <= A1.events[i].start + 1e-6, `A1 ${A1.events[i - 1].id} / ${A1.events[i].id} do not overlap`);
  // music
  const music = project.tracks.filter((t) => t.kind === 'audio' && t.id !== IMPORT_TRACKS.narration);
  for (const c of data.cues ?? []) {
    const e = music.flatMap((t) => t.events).find((x) => x.mediaId === `cue-${c.id}`);
    assert.ok(e, `cue ${c.id} placed`);
    assert.equal(e.start, c.start);
    assert.equal(e.gainDb ?? 0, c.gainDb ?? 0);
    assert.equal(e.fadeIn.len, Math.min(c.fadeIn ?? 0, e.length));
    const render = (data.renders ?? []).find((r) => typeof r !== 'string' && r.cueId === c.id);
    const renderLen = typeof render === 'object' ? render.duration : undefined;
    if ((c.fadeOut ?? 0) > 0) {
      // cut at its end (or where a short render ends), the fade starting exactly where the mix starts it
      const end = Math.min(c.end, duration, renderLen !== undefined ? c.start + renderLen : Infinity);
      assert.ok(Math.abs(eventEnd(e) - end) < 1e-6, `cue ${c.id} cut at ${end}`);
      const fadeStart = c.end - cueFadeOut(c);
      if (end > fadeStart) assert.ok(Math.abs(eventEnd(e) - e.fadeOut.len - fadeStart) < 1e-6, `cue ${c.id} fade starts at ${fadeStart}`);
      else assert.equal(e.fadeOut.len, 0);
    } else if (renderLen !== undefined) {
      assert.ok(Math.abs(eventEnd(e) - Math.min(c.start + renderLen, duration)) < 1e-6, `cue ${c.id} rings out`);
    }
  }
  for (const t of music) {
    for (let i = 1; i < t.events.length; i++) assert.ok(eventEnd(t.events[i - 1]) <= t.events[i].start + 1e-6, `${t.id}: overlapping cues alternate rows`);
    if (t.duck) assert.deepEqual(t.duck.by, [IMPORT_TRACKS.narration]);
  }
  // persistence: JSON round trip validates cleanly and changes nothing
  const r = validateProject(JSON.parse(JSON.stringify(project)));
  assert.ok(r.ok, JSON.stringify(r.issues.slice(0, 5)));
  assert.deepEqual(r.issues.filter((i) => i.severity === 'error'), []);
  assert.deepEqual(r.project, project);
}

// ---------------------------------------------------------------------------
// synthetic film
// ---------------------------------------------------------------------------
function synthetic(): FilmImportData {
  const words = (offset: number, ws: [string, number, number][]) => ws.map(([w, a, b]) => ({ w, start: a + offset, end: b + offset }));
  return {
    slug: 'synth',
    title: 'Synthetic',
    timeline: {
      slug: 'synth',
      fps: 24,
      duration: 20,
      chapters: [
        { id: 'ch01', number: 1, title: 'One', start: 0, end: 12 },
        { id: 'ch02', number: 2, title: 'Two', start: 12, end: 20 },
      ],
      shots: [
        // the first shot's transitionIn is ignored by the reel
        { id: 's1', chapter: 'ch01', start: 0, end: 5, beats: {}, transitionIn: 'fadeBlack', transitionDur: 1.6, lines: [{ id: 'L1', text: 'one two', start: 0.6, end: 1.8, words: words(0, [['one', 0.6, 1.0], ['two', 1.2, 1.8]]) }] },
        // crossfade 1 s at 5
        { id: 's2', chapter: 'ch01', start: 5, end: 12, beats: {}, transitionIn: 'crossfade', transitionDur: 1, lines: [{ id: 'L2', text: 'three', start: 0.6, end: 1.4, words: words(0, [['three', 0.6, 1.4]]) }, { id: 'L3', text: 'four', start: 1.7, end: 2.5, words: words(0, [['four', 1.7, 2.5]]) }] },
        // iris with no duration: the kit default (2.2 s)
        { id: 's3', chapter: 'ch02', start: 12, end: 16, beats: {}, transitionIn: 'iris', lines: [] },
        // a 5 s inkBleed on a 4 s shot: clamped to 90 % of the shorter neighbour (3.6 s)
        { id: 's4', chapter: 'ch02', start: 16, end: 20, beats: {}, transitionIn: 'inkBleed', transitionDur: 5, lines: [] },
      ],
    },
    lines: {
      lines: {
        // L2 and L3 clips overlap in their silent tail/head (0.3 s gap between speech, 0.25 s pads each side)
        L1: { shot: 's1', chapter: 'ch01', text: 'one two', clip: 'narration/clips/L1.wav', duration: 1.7, speechStart: 0.25, speechEnd: 1.45, words: words(-0.35, [['one', 0.6, 1.0], ['two', 1.2, 1.8]]) },
        L2: { shot: 's2', chapter: 'ch01', text: 'three', clip: 'narration/clips/L2.wav', duration: 1.3, speechStart: 0.25, speechEnd: 1.05, words: [{ w: 'three', start: 0.25, end: 1.05 }] },
        L3: { shot: 's2', chapter: 'ch01', text: 'four', clip: 'narration/clips/L3.wav', duration: 1.3, speechStart: 0.25, speechEnd: 1.05, words: [{ w: 'four', start: 0.25, end: 1.05 }] },
      },
    },
    clips: [
      { lineId: 'L1', path: 'narration/clips/L1.wav', duration: 1.7, sampleRate: 48000, channels: 1 },
      { lineId: 'L2', path: 'narration/clips/L2.wav', duration: 1.3 },
      { lineId: 'L3', path: 'narration/clips/L3.wav', duration: 1.3 },
    ],
    cues: [
      { id: 'm1', start: 0, end: 13, render: 'score/renders/m1.wav', gainDb: -3, fadeIn: 1, fadeOut: 2, lastStrike: 10.8, duck: { depthDb: 4, attack: 20, release: 250 } },
      // overlaps m1 by a second: goes to the second row; no fade-out: rings out, cut at the film end
      { id: 'm2', start: 12, end: 18, render: 'score/renders/m2.wav', gainDb: -5, fadeIn: 0.5, fadeOut: 0, duck: true },
    ],
    renders: [
      { cueId: 'm1', path: 'score/renders/m1.wav', duration: 19 },
      { cueId: 'm2', path: 'score/renders/m2.wav', duration: 16 },
    ],
    stem: { gainDb: 6, compressor: { grDb: 3 }, peakStage: { speechGrDb: 1 }, rides: { L1: { rideDb: -1, clipGainDb: 0.5, words: { two: 4 } } } },
    loudness: { loudnorm: { gainDb: 2.5 } },
    sha: { timeline: 'abc', cues: 'def' },
  };
}

test('import: synthetic film round-trips (picture frames, narration words, cues)', () => {
  const data = synthetic();
  const { project, warnings } = importFilmReport(data, { now: NOW });
  checkRoundTrip(data, project);
  assert.deepEqual(project.tracks.map((t) => t.id), ['V0', 'V1', 'A1', 'A2', 'A3']);
  assert.equal(project.tracks[0].events.length, 0);
  // transitions: s3 iris at the kit default, s4 clamped to 3.6 s
  const V1 = project.tracks[1].events;
  assert.equal(V1[0].transition, undefined);
  assert.ok(Math.abs(V1[2].start - (12 - 1.1)) < 1e-9 && V1[2].transition?.kind === 'iris');
  assert.ok(Math.abs(V1[3].srcIn + 1.8) < 1e-9 && V1[3].transition?.kind === 'inkBleed');
  // narration: L2/L3 met in the silence between speech spans, L1 gain from the stem chain, word ride envelope
  const A1 = project.tracks[2].events;
  assert.ok(Math.abs(eventEnd(A1[1]) - A1[2].start) < 1e-9);
  assert.equal(A1[0].gainDb, -1 + 0.5 + 6 - 3 - 1);
  assert.ok(A1[0].envelopes?.volume?.some((k) => k.v === 4));
  // music: m1 fade starts 1.6 s after its last strike (10.8 + 1.6 = 12.4 → 0.6 s fade to 13), m2 rings to the film end
  const [m1] = project.tracks[3].events;
  const [m2] = project.tracks[4].events;
  assert.ok(Math.abs(m1.fadeOut.len - 0.6) < 1e-9);
  assert.equal(m1.fadeOut.curve, 'fast');
  assert.equal(eventEnd(m2), 20);
  assert.deepEqual(project.tracks[3].duck, { by: ['A1'], depthDb: 4, attack: 0.02, release: 0.25 });
  // markers: chapters + cues; regions: chapters
  assert.deepEqual(project.markers.map((m) => m.t), [0, 0, 12, 12]);
  assert.deepEqual(project.regions.map((r) => [r.start, r.end]), [[0, 12], [12, 20]]);
  assert.equal(project.master.gainDb, 2.5);
  assert.deepEqual(project.source, { kind: 'film-import', at: NOW, timelineSha: 'abc', cuesSha: 'def' });
  assert.deepEqual(warnings, []);
});

test('import: missing clips/renders are reported and skipped, not fatal', () => {
  const data = synthetic();
  data.clips = data.clips!.filter((c) => typeof c !== 'string' && c.lineId !== 'L2');
  data.renders = [];
  data.stem = null;
  const { project, warnings } = importFilmReport(data, { now: NOW });
  assert.ok(warnings.some((w) => w.includes('L2')));
  assert.ok(warnings.some((w) => w.includes('cue m1')));
  assert.ok(warnings.some((w) => w.includes('stem')));
  assert.equal(project.tracks[2].events.length, 2);
  assert.equal(project.tracks[3].events.length, 0);
});

test('import: is deterministic (same input, same project)', () => {
  assert.deepEqual(importFilmReport(synthetic(), { now: NOW }), importFilmReport(synthetic(), { now: NOW }));
});

// ---------------------------------------------------------------------------
// real films on disk
// ---------------------------------------------------------------------------
/** duration/format of a PCM WAV from its header (no decoding) */
function wavInfo(file: string): { duration: number; sampleRate: number; channels: number } {
  const fd = fs.openSync(file, 'r');
  try {
    const head = Buffer.alloc(12);
    fs.readSync(fd, head, 0, 12, 0);
    assert.equal(head.toString('ascii', 0, 4), 'RIFF');
    let pos = 12;
    let fmt: { sampleRate: number; channels: number; blockAlign: number } | null = null;
    const ch = Buffer.alloc(24);
    for (;;) {
      if (fs.readSync(fd, ch, 0, 24, pos) < 8) throw new Error(`${file}: no data chunk`);
      const id = ch.toString('ascii', 0, 4);
      const size = ch.readUInt32LE(4);
      if (id === 'fmt ') fmt = { channels: ch.readUInt16LE(10), sampleRate: ch.readUInt32LE(12), blockAlign: ch.readUInt16LE(20) };
      if (id === 'data') {
        assert.ok(fmt, `${file}: fmt before data`);
        return { duration: size / fmt.blockAlign / fmt.sampleRate, sampleRate: fmt.sampleRate, channels: fmt.channels };
      }
      pos += 8 + size + (size & 1);
    }
  } finally {
    fs.closeSync(fd);
  }
}

/** what GET /__editor/film/<slug> carries, read straight from films/<slug>/ */
function loadFilm(slug: string): FilmImportData | null {
  const dir = path.join(ROOT, 'films', slug);
  const json = (rel: string): unknown => (fs.existsSync(path.join(dir, rel)) ? JSON.parse(fs.readFileSync(path.join(dir, rel), 'utf8')) : null);
  const timeline = json('narration/timeline.json') as FilmImportData['timeline'] | null;
  if (!timeline) return null;
  // the clips and renders are regenerable media (gitignored): a fresh checkout/CI has no audio to measure
  const clipDir = path.join(dir, 'narration/clips');
  if (!fs.existsSync(clipDir)) return null;
  const clips: FilmFileInfo[] = fs
    .readdirSync(clipDir)
    .filter((f) => f.endsWith('.wav'))
    .map((f) => ({ lineId: f.replace(/\.wav$/, ''), path: `narration/clips/${f}`, ...wavInfo(path.join(clipDir, f)) }));
  const cues = (json('score/cues.json') as FilmImportData['cues']) ?? [];
  const renders: FilmFileInfo[] = (cues ?? []).flatMap((c) => {
    const rel = c.render ?? `score/renders/${c.id}.wav`;
    return fs.existsSync(path.join(dir, rel)) ? [{ cueId: c.id, path: rel, ...wavInfo(path.join(dir, rel)) }] : [];
  });
  return {
    slug,
    timeline,
    cues,
    lines: json('narration/lines.json') as FilmImportData['lines'],
    clips,
    renders,
    stem: json('narration/stem.json') as FilmImportData['stem'],
    loudness: json('mix/loudness.json') as FilmImportData['loudness'],
  };
}

test('import: films/perceptron-short round-trips', (t) => {
  const data = loadFilm('perceptron-short');
  if (!data) return t.skip('films/perceptron-short media is not on disk (narration clips are regenerable and gitignored)');
  const { project, warnings } = importFilmReport(data, { now: NOW });
  checkRoundTrip(data, project);
  assert.equal(projectDuration(project), 67.75);
  const lines = data.timeline.shots.flatMap((s) => s.lines).length;
  assert.equal(project.tracks[2].events.length, lines);
  assert.deepEqual(warnings, []);
  // L0107 has a word ride on "right" (stem.json rides.L0107.words): a +5 dB bump
  const e = project.tracks[2].events.find((x) => x.id === 'n-L0107')!;
  assert.ok(e.envelopes?.volume?.some((k) => k.v === 5));
  // the m01 render is 73.75 s but the cue fades out and is cut at 67.75
  const m = project.tracks[3].events[0];
  assert.equal(eventEnd(m), 67.75);
  assert.equal(project.media[m.mediaId].duration, 73.75);
});

test('import: films/neural-net-history round-trips (33 min, 121 shots)', (t) => {
  const data = loadFilm('neural-net-history');
  if (!data) return t.skip('films/neural-net-history media is not on disk (narration clips are regenerable and gitignored)');
  const t0 = performance.now();
  const { project, warnings } = importFilmReport(data, { now: NOW });
  const ms = performance.now() - t0;
  assert.ok(ms < 500, `import took ${ms.toFixed(0)} ms`);
  checkRoundTrip(data, project, { allowOverlapWarnings: warnings.some((w) => w.includes('speech overlaps')) });
  assert.equal(project.tracks[1].events.length, 121);
  assert.equal(projectDuration(project), data.timeline.duration);
  // known: m16's render is shorter than its window (the mix warns about it too)
  assert.deepEqual(warnings.filter((w) => !w.includes('speech overlaps') && !w.includes('shorter than its window')), []);
});

test('import: each shot and its narration lines share a group; lines carry their shot-local start (sync badge)', () => {
  const data = synthetic();
  const { project } = importFilmReport(data, { now: NOW });
  const pic = project.tracks.find((t) => t.id === 'V1')!.events;
  const nar = project.tracks.find((t) => t.id === 'A1')!.events;
  for (const s of data.timeline.shots) {
    const shotEv = pic.find((e) => e.id === `v-${s.id}`)!;
    const lines = nar.filter((e) => project.media[e.mediaId]?.tags?.shot === s.id);
    if (!s.lines.length) continue;
    assert.equal(shotEv.group, shotGroup(s.id));
    for (const l of lines) {
      assert.equal(l.group, shotEv.group);
      const m = project.media[l.mediaId];
      assert.ok(m?.kind === 'audio' && m.tags?.at !== undefined && Number.isFinite(Number(m.tags.at)));
    }
  }
  // an unedited import is in sync everywhere
  assert.equal(syncOffsets(project).size, 0);
});
