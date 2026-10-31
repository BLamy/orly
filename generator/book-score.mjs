#!/usr/bin/env node
// book-score.mjs — compose a book's music with Strudel and bind it into the manifest.
//
//   node generator/book-score.mjs --slug <slug> [--chapter 2] [--gain 0.3] [--force]
//   npm run book:score -- --slug <slug>
//
// A chapter's music is a Strudel pattern at public/generated/<slug>/music/chapter-<n>.strudel (committed: the code is
// the score, and the credits cite it). This renders each one through strudel.cc's own "Export to WAV"
// (generator/film/score.mjs `file` mode: OfflineAudioContext, sample-exact, headless Chromium), sized to the
// chapter's narrated duration from manifest.json, then encodes music/chapter-<n>.mp3 (loudness-leveled to a quiet bed,
// fading out over the last 3 s) and writes manifest.chapters[n-1].music = { audio, gain, strudel }. The player mixes it
// under the narration (apps/bookshelf/src/player/music-bed.ts). Re-running skips a chapter whose .strudel and duration
// are unchanged unless --force. video.mjs keeps `music` when it rewrites the manifest.
//
// Composition rules for books (shorter and quieter than film cues): docs/book-quality.md §Music.
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const slug = opt('slug');
if (!slug) {
  console.error('usage: node generator/book-score.mjs --slug <slug> [--chapter n] [--gain 0.3] [--force]');
  process.exit(2);
}
const dir = join(ROOT, 'public', 'generated', slug);
const manifestPath = join(dir, 'manifest.json');
if (!existsSync(manifestPath)) {
  console.error(`no manifest at ${manifestPath}: build the book (node generator/video.mjs) before scoring it`);
  process.exit(2);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const only = opt('chapter') ? Number(opt('chapter')) : null;
const gain = Number(opt('gain', 0.3));
const sha = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const musicDir = join(dir, 'music');
mkdirSync(musicDir, { recursive: true });

let rendered = 0;
for (const ch of manifest.chapters) {
  if (only && ch.number !== only) continue;
  const src = join(musicDir, `chapter-${ch.number}.strudel`);
  if (!existsSync(src)) {
    console.log(`chapter ${ch.number}: no music/chapter-${ch.number}.strudel, skipped`);
    continue;
  }
  const dur = ch.duration;
  if (!dur) throw new Error(`chapter ${ch.number} has no duration in the manifest`);
  const code = readFileSync(src, 'utf8');
  const stamp = join(musicDir, `.chapter-${ch.number}.hash`);
  const hash = sha(`${code}\n${dur}`);
  const mp3 = join(musicDir, `chapter-${ch.number}.mp3`);
  if (!flag('force') && existsSync(mp3) && existsSync(stamp) && readFileSync(stamp, 'utf8') === hash) {
    console.log(`chapter ${ch.number}: music up to date`);
  } else {
    const wav = join(musicDir, `.chapter-${ch.number}.wav`);
    console.log(`chapter ${ch.number}: rendering ${dur.toFixed(1)}s through strudel.cc ...`);
    execFileSync(
      'node',
      [join(ROOT, 'generator', 'film', 'score.mjs'), 'file', '--code', src, '--seconds', String(dur), '--tail', '2', '--out', wav],
      { stdio: 'inherit' },
    );
    execFileSync(
      'ffmpeg',
      ['-y', '-v', 'error', '-i', wav, '-t', String(dur), '-af', `loudnorm=I=-20:TP=-2:LRA=7,afade=t=out:st=${Math.max(0, dur - 3).toFixed(2)}:d=3`, '-ac', '2', '-c:a', 'libmp3lame', '-b:a', '128k', mp3],
      { stdio: 'inherit' },
    );
    rmSync(wav, { force: true });
    writeFileSync(stamp, hash);
    rendered++;
  }
  ch.music = { audio: `music/chapter-${ch.number}.mp3`, gain, strudel: `music/chapter-${ch.number}.strudel` };
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`done: ${rendered} rendered; manifest updated (${manifest.chapters.filter((c) => c.music).length}/${manifest.chapters.length} chapters have music)`);
