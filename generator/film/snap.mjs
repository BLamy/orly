#!/usr/bin/env node
// Screenshot a page of the running dev server — kit galleries, the film harness, the studio.
//
//   node generator/film/snap.mjs --url "/film-gallery.html?g=puppets&t=2" --out .orly-work/snaps/puppets.png
//   node generator/film/snap.mjs --url "/film-gallery.html?g=puppets" --times 0,1,2,3,4,5 --out sheet.png [--cols 3]
//
// --base defaults to $FILM_DEV_URL or http://127.0.0.1:5199 (start it with: npm run film:dev).
// Waits for window.__galleryReady (galleries) or window.__film.ready (harness, then seeks --t).
// With --times, renders each time and tiles them into one contact sheet (ffmpeg), labelling each tile.
// Prints a JSON report; exits non-zero on a page error or a gallery error.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const FFMPEG = process.env.FFMPEG || '/opt/homebrew/bin/ffmpeg';
export const GPU_ARGS = ['--enable-gpu', '--use-angle=metal', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'];

function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : dflt;
}

const base = arg('base', process.env.FILM_DEV_URL || 'http://127.0.0.1:5199');
const url = arg('url');
const out = arg('out');
const w = Number(arg('w', '1920'));
const h = Number(arg('h', '1080'));
const times = arg('times') ? arg('times').split(',').map(Number) : null;
const cols = Number(arg('cols', '3'));
const timeout = Number(arg('timeout', '60')) * 1000;
if (!url || !out) {
  console.error('usage: snap.mjs --url <path?query> --out <png> [--times 0,1,2] [--cols 3] [--w 1920 --h 1080] [--base url]');
  process.exit(2);
}

const withT = (u, t) => {
  const x = new URL(u, base);
  x.searchParams.set('t', String(t));
  return x.toString();
};

const browser = await chromium.launch({ headless: true, args: GPU_ARGS });
const report = { url, out, frames: [], errors: [] };
try {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => report.errors.push(String(e.message).slice(0, 500)));
  page.on('console', (m) => { if (m.type() === 'error') report.errors.push(m.text().slice(0, 500)); });

  const shoot = async (t, file) => {
    const isHarness = /film-render=|film-studio=/.test(url);
    if (isHarness) {
      if (!report.loaded) {
        await page.goto(new URL(url, base).toString(), { waitUntil: 'load', timeout });
        await page.waitForFunction(() => window.__film && window.__film.ready, null, { timeout });
        await page.evaluate(() => window.__film.ready);
        report.loaded = true;
      }
      await page.evaluate((tt) => window.__film.seek(tt), t ?? 0);
    } else {
      await page.goto(t == null ? new URL(url, base).toString() : withT(url, t), { waitUntil: 'load', timeout });
      await page.waitForFunction(() => window.__galleryReady === true, null, { timeout });
      const gErr = await page.evaluate(() => window.__galleryError);
      if (gErr) report.errors.push(gErr.slice(0, 800));
    }
    if (times) {
      // label the tile in-page (Homebrew ffmpeg has no drawtext)
      await page.evaluate((tt) => {
        let d = document.getElementById('__snaplabel');
        if (!d) {
          d = document.createElement('div');
          d.id = '__snaplabel';
          d.style.cssText = 'position:fixed;left:14px;top:14px;z-index:2147483647;font:600 30px ui-monospace,monospace;color:#fff;background:rgba(0,0,0,.62);padding:4px 12px;border-radius:6px';
          document.body.appendChild(d);
        }
        d.textContent = `t=${tt}s`;
      }, t);
    }
    await page.screenshot({ path: file, type: 'png' });
    report.frames.push({ t, file });
  };

  mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  if (!times) {
    await shoot(arg('t') == null ? null : Number(arg('t')), out);
  } else {
    const dir = mkdtempSync(path.join(tmpdir(), 'snap-'));
    for (let i = 0; i < times.length; i++) await shoot(times[i], path.join(dir, `${String(i).padStart(3, '0')}.png`));
    const rows = Math.ceil(times.length / cols);
    const tw = Math.round(w / cols);
    const th = Math.round((tw * h) / w);
    // tiles are labelled in-page; scale and tile them
    const inputs = times.flatMap((_, i) => ['-i', path.join(dir, `${String(i).padStart(3, '0')}.png`)]);
    const scaled = times
      .map((_, i) => `[${i}:v]scale=${tw}:${th}[v${i}]`)
      .join(';');
    const pads = Array.from({ length: rows * cols - times.length }, (_, k) => `color=c=black:s=${tw}x${th}:d=1[p${k}]`).join(';');
    const all = [...times.map((_, i) => `[v${i}]`), ...Array.from({ length: rows * cols - times.length }, (_, k) => `[p${k}]`)].join('');
    const graph = [scaled, pads, `${all}xstack=inputs=${rows * cols}:layout=${Array.from({ length: rows * cols }, (_, i) => `${(i % cols) * tw}_${Math.floor(i / cols) * th}`).join('|')}[out]`]
      .filter(Boolean)
      .join(';');
    execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex', graph, '-map', '[out]', '-frames:v', '1', out]);
    rmSync(dir, { recursive: true, force: true });
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
if (report.errors.length) process.exitCode = 1;
