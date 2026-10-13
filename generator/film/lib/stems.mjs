// Publish a film's audio as STEMS: one AAC file per narration line and per music cue, plus the data the
// player needs to place each one on the film clock (audio/film-audio.json).
//
// Why: a single pre-mixed track is only in sync with the picture for the clock it was mixed against; any later
// re-narration or timing change made the shelf drift. With stems the player (src/player/FilmPlayer.tsx) builds
// the same placement the editor's importer does (editor/model/importFilm.ts: line clip sample 0 at
// shot.start + line.start − speechStart, cues at cue.start, ducking, stem gains) from the SAME timeline.json the
// picture paints from, so every line starts exactly where its shot expects it; gaps are music or silence.
//
// Encoding: AAC in MP4 (ffmpeg writes the encoder delay as an edit list; measured sample-exact through
// decodeAudioData in Chromium). Narration 48 kHz mono 96 kb/s, music 48 kHz stereo 160 kb/s. Files are re-encoded
// only when the source is newer than the published file.
import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { mediaDuration } from './ffmpeg.mjs';
import { readJson, writeJson, mkdirp, rel } from './paths.mjs';

const run = promisify(execFile);
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

async function encode(src, dst, { channels, bitrate }) {
  if (fs.existsSync(dst) && fs.statSync(dst).mtimeMs >= fs.statSync(src).mtimeMs) return false;
  const tmp = `${dst}.tmp.m4a`;
  await run(FFMPEG, ['-v', 'error', '-y', '-i', src, '-ac', String(channels), '-ar', '48000', '-c:a', 'aac', '-b:a', bitrate, '-movflags', '+faststart', tmp]);
  fs.renameSync(tmp, dst);
  return true;
}

/** run fn over items with at most n in flight */
async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}

/**
 * Write <out>/audio/lines/<lineId>.m4a, <out>/audio/cues/<cueId>.m4a and <out>/audio/film-audio.json.
 * Returns { file, lines, cues, encoded, bytes }.
 */
export async function publishStems(P, out, { slug, timeline, cues, log = () => {} }) {
  const linesDoc = readJson(P.narration.lines);
  const lines = linesDoc.lines ?? linesDoc;
  const stem = readJson(P.narration.stem, null);
  const loudness = readJson(P.mix.loudness, null);
  const linesDir = path.join(out, 'audio', 'lines');
  const cuesDir = path.join(out, 'audio', 'cues');
  mkdirp(linesDir);
  mkdirp(cuesDir);

  // every line the clock places (the picture's timeline), not stale entries in lines.json
  const placed = timeline.shots.flatMap((s) => s.lines.map((l) => l.id));
  const missing = placed.filter((id) => !lines[id]?.clip || !fs.existsSync(path.join(P.dir, lines[id].clip)));
  if (missing.length) throw new Error(`narration clips missing for ${missing.join(', ')} — run film:narrate`);

  let encoded = 0;
  const clips = await pool(placed, 8, async (id) => {
    const src = path.join(P.dir, lines[id].clip);
    const name = `${id}.m4a`;
    if (await encode(src, path.join(linesDir, name), { channels: 1, bitrate: '96k' })) encoded++;
    return { path: lines[id].clip, url: `audio/lines/${name}`, duration: mediaDuration(src), lineId: id };
  });
  const withRender = cues.filter((c) => c.render && fs.existsSync(path.join(P.dir, c.render)));
  const renders = await pool(withRender, 4, async (c) => {
    const src = path.join(P.dir, c.render);
    const name = `${c.id}.m4a`;
    if (await encode(src, path.join(cuesDir, name), { channels: 2, bitrate: '160k' })) encoded++;
    return { path: c.render, url: `audio/cues/${name}`, duration: mediaDuration(src), cueId: c.id };
  });
  if (withRender.length < cues.length) log(`  note: ${cues.length - withRender.length} cue(s) have no render and are left out`);

  // remove stems of lines/cues that no longer exist
  const keep = new Set([...clips.map((c) => path.basename(c.url)), ...renders.map((r) => path.basename(r.url))]);
  for (const d of [linesDir, cuesDir]) for (const f of fs.readdirSync(d)) if (!keep.has(f)) fs.rmSync(path.join(d, f));

  const doc = {
    version: 1,
    slug,
    // the clock these stems were cut for (the player warns when its own timeline differs: placement still follows
    // the player's timeline, so only lines re-recorded since the publish could differ)
    clock: { duration: timeline.duration, lines: placed.length },
    lines: Object.fromEntries(placed.map((id) => [id, lines[id]])),
    clips,
    cues: withRender,
    renders,
    stem,
    loudness: loudness?.loudnorm ? { loudnorm: { gainDb: loudness.loudnorm.gainDb } } : null,
  };
  const file = path.join(out, 'audio', 'film-audio.json');
  writeJson(file, doc, 1);
  const bytes = [...clips, ...renders].reduce((s, c) => s + fs.statSync(path.join(out, c.url)).size, 0);
  log(`  stems: ${clips.length} narration lines + ${renders.length} cues (${encoded} encoded, ${(bytes / 1048576).toFixed(1)} MB) → ${rel(file)}`);
  return { file: 'audio/film-audio.json', lines: clips.length, cues: renders.length, encoded, bytes };
}
