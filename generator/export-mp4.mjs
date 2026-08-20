#!/usr/bin/env node
// Export a format-3 book as a single narrated .mp4.
//
//   node generator/export-mp4.mjs --slug replay-qa-week --out /path/to/dir
//
// Serves the built app (dist/) with `vite preview`, plays each chapter in a
// headless Chromium with Playwright video recording (chrome hidden, captions
// kept), trims each webm to the exact moment narration started, muxes the
// chapter MP3 over it (H.264 + AAC, 1280x720), then concats all chapters.

import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FFMPEG = process.env.FFMPEG || '/opt/homebrew/bin/ffmpeg';
const FFPROBE = process.env.FFPROBE || FFMPEG.replace(/ffmpeg$/, 'ffprobe');

const W = 1280;
const H = 720;
const FPS = 30;

function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : dflt;
}

const slug = arg('slug');
const onlyChapters = arg('chapters') ? arg('chapters').split(',').map(Number) : null;
const args = { dir: arg('dir') };
const outDir = path.resolve(arg('out', path.join(ROOT, 'exports', slug ?? 'book')));
if (!slug) {
  console.error('usage: node generator/export-mp4.mjs --slug <slug> --out <dir>');
  process.exit(1);
}

function ffprobeJson(file) {
  const out = execFileSync(FFPROBE, [
    '-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file,
  ]);
  return JSON.parse(out.toString());
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

async function waitForServer(url, ms = 20000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`server never came up at ${url}`);
}

// CSS injected before the app boots: hide every piece of player chrome but
// keep the caption pills; make the 16:9 stage fill the viewport exactly.
const CLEAN_CSS = `
  .bp-topbar, .bp-controls, .bp-bigplay, .bp-endcard, .bp-side { display: none !important; }  .bp-stagewrap { padding: 0 !important; }
  .bp-stage { max-width: none !important; max-height: none !important;
              border-radius: 0 !important; box-shadow: none !important; }
  html, body { background: #0a0e1a !important; }
  * { cursor: none !important; }
`;

async function recordChapter(browser, baseUrl, chapter, workDir) {
  const n = chapter.number;
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    recordVideo: { dir: workDir, size: { width: W, height: H } },
  });
  const page = await context.newPage();

  // Install the chrome-hiding CSS before any React render, so no frame ever
  // shows the topbar/transport (playback autostarts as soon as the scene loads).
  await page.addInitScript((css) => {
    const add = () => {
      const s = document.createElement('style');
      s.textContent = css;
      document.head.appendChild(s);
    };
    if (document.readyState === 'loading')
      document.addEventListener('DOMContentLoaded', add);
    else add();
  }, CLEAN_CSS);

  await page.goto(`${baseUrl}/?bundle=${slug}&chapter=${n}`, { waitUntil: 'load' });

  // The <audio> element is the playback clock. Force it muted (so playback is
  // never blocked by autoplay policy — we mux the real MP3 later anyway) and
  // stamp performance.now() the instant currentTime starts advancing.
  const timing = await page.evaluate(
    ({ duration }) =>
      new Promise((resolve, reject) => {
        const deadline = performance.now() + 30000;
        const findAudio = () => {
          const a = document.querySelector('audio');
          if (a) {
            a.muted = true;
            waitStart(a);
          } else if (performance.now() > deadline) {
            reject(new Error('no <audio> element appeared'));
          } else requestAnimationFrame(findAudio);
        };
        const waitStart = (a) => {
          a.muted = true;
          if (a.currentTime > 0 && !a.paused) {
            // back-date by however far the clock already ran before we noticed
            const startWall = performance.now() - a.currentTime * 1000;
            waitEnd(a, startWall);
          } else if (performance.now() > deadline) {
            reject(new Error(`audio never started (currentTime=${a.currentTime})`));
          } else requestAnimationFrame(() => waitStart(a));
        };
        const waitEnd = (a, startWall) => {
          if (a.ended || a.currentTime >= duration) {
            resolve({ startWall, endWall: performance.now() });
          } else requestAnimationFrame(() => waitEnd(a, startWall));
        };
        findAudio();
      }),
    { duration: chapter.duration }
  );

  // Last wall-clock instant that will appear in the recording ≈ page close.
  const closeWall = await page.evaluate(() => performance.now());
  const video = page.video();
  await page.close();
  await context.close();
  const webm = await video.path();

  // The webm's last frame corresponds to closeWall; anchor the trim off the
  // END of the file (recording start time is not exposed by Playwright):
  //   trimStart = webmDuration - (closeWall - startWall)
  const webmDur = parseFloat(ffprobeJson(webm).format.duration);
  const trimStart = Math.max(0, webmDur - (closeWall - timing.startWall) / 1000);
  return { webm, webmDur, trimStart };
}

function encodeChapter(webm, trimStart, mp3, duration, outMp4) {
  execFileSync(FFMPEG, [
    '-y',
    '-ss', trimStart.toFixed(3), '-i', webm,
    '-i', mp3,
    '-map', '0:v:0', '-map', '1:a:0',
    '-t', duration.toFixed(3),
    '-vf', `scale=${W}:${H},fps=${FPS}`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k',
    '-shortest',
    outMp4,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
}

async function main() {
  // --dir overrides where the book's manifest/audio live (e.g. a private,
  // untracked build that must never enter public/generated or the shelf).
  const bookDir = args.dir ? path.resolve(args.dir) : path.join(ROOT, 'public', 'generated', slug);
  const manifest = JSON.parse(readFileSync(path.join(bookDir, 'manifest.json'), 'utf8'));
  if (manifest.format !== 3) throw new Error(`"${slug}" is not a format-3 book`);

  if (!existsSync(path.join(ROOT, 'dist', 'index.html'))) {
    console.log('dist/ missing — running npm run build …');
    execFileSync('npm', ['run', 'build'], { cwd: ROOT, stdio: 'inherit' });
  }

  mkdirSync(outDir, { recursive: true });
  const workDir = path.join(outDir, 'work');
  mkdirSync(workDir, { recursive: true });

  const port = await freePort();
  const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
    cwd: ROOT, stdio: 'ignore', detached: false,
  });
  const baseUrl = `http://localhost:${port}`;

  let browser;
  try {
    await waitForServer(`${baseUrl}/generated/${slug}/manifest.json`);
    browser = await chromium.launch({
      args: [
        '--autoplay-policy=no-user-gesture-required',
        '--force-color-profile=srgb',
        '--disable-lcd-text',
      ],
    });

    const chapterMp4s = [];
    for (const ch of manifest.chapters) {
      if (onlyChapters && !onlyChapters.includes(ch.number)) continue;
      const mp3 = path.join(bookDir, ch.audio);
      const outMp4 = path.join(outDir, `chapter-${ch.number}.mp4`);
      process.stdout.write(`chapter ${ch.number} (${ch.duration.toFixed(1)}s): recording… `);
      const { webm, webmDur, trimStart } = await recordChapter(browser, baseUrl, ch, workDir);
      process.stdout.write(`webm ${webmDur.toFixed(2)}s, trim ${trimStart.toFixed(3)}s → encode… `);
      encodeChapter(webm, trimStart, mp3, ch.duration, outMp4);
      const enc = ffprobeJson(outMp4);
      console.log(`${parseFloat(enc.format.duration).toFixed(2)}s ✓`);
      chapterMp4s.push(outMp4);
    }

    // Concat (identical codecs/params → stream copy).
    const listFile = path.join(workDir, 'concat.txt');
    writeFileSync(listFile, chapterMp4s.map((f) => `file '${f}'`).join('\n') + '\n');
    const finalMp4 = path.join(outDir, `${slug}.mp4`);
    execFileSync(FFMPEG, [
      '-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', finalMp4,
    ], { stdio: ['ignore', 'ignore', 'pipe'] });

    const info = ffprobeJson(finalMp4);
    console.log(`\n${finalMp4}`);
    console.log(`  duration ${parseFloat(info.format.duration).toFixed(2)}s, ` +
      info.streams.map((s) => `${s.codec_type}:${s.codec_name}` +
        (s.width ? ` ${s.width}x${s.height}` : '')).join(', '));
  } finally {
    await browser?.close();
    server.kill();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
