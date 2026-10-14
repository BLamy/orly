#!/usr/bin/env node
// scene-sheet.mjs — contact sheets + layout checks for a book chapter's scene, against the running dev server.
//
//   npm run dev                                   # once, in another terminal (http://localhost:5173)
//   node generator/scene-sheet.mjs --slug <slug> --chapter 2 [--times 3,10.5,40] [--out .orly-work/sheets] [--cols 3]
//
// Opens /scene-sheet.html?scene=books/<slug>/chapter-<n> (src/viz/sheet/main.tsx), samples the scene at --times
// (default: the middle of every caption, plus the last frame), and writes <out>/<slug>-ch<n>.png: a tiled sheet,
// each tile labelled (top left) with its authored time. Times are on the AUTHORED timeline (the scene's own clock, which the
// player retimes to the narration). For each frame it also measures visible <text>: labels that run off the 1280×720
// stage, labels that overlap each other, labels under the caption band (y > 630 while a caption shows), and text
// smaller than 12px. Prints a JSON report; exits 1 on a page error or an unknown scene.
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const arg = (n, d) => (process.argv.includes(`--${n}`) ? process.argv[process.argv.indexOf(`--${n}`) + 1] : d);
const slug = arg('slug');
const chapter = arg('chapter');
if (!slug || !chapter) {
  console.error('usage: node generator/scene-sheet.mjs --slug <slug> --chapter <n> [--times a,b,c] [--out dir] [--cols 3]');
  process.exit(2);
}
const base = arg('base', process.env.ORLY_DEV_URL || 'http://localhost:5173');
const out = arg('out', '.orly-work/sheets');
const cols = Number(arg('cols', 3));
const scene = `books/${slug}/chapter-${chapter}`;
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${base}/scene-sheet.html?scene=${encodeURIComponent(scene)}`, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__sheet?.ready, null, { timeout: 30000 });
const info = await page.evaluate(() => ({ error: window.__sheet.error, duration: window.__sheet.duration, captions: window.__sheet.captions }));
if (info.error) {
  console.log(JSON.stringify({ scene, error: info.error }, null, 1));
  await browser.close();
  process.exit(1);
}
const times = arg('times')
  ? arg('times').split(',').map(Number)
  : [...info.captions.map((c) => +(c.at + c.dur / 2).toFixed(2)), +Math.max(0, info.duration - 0.05).toFixed(2)];

const tmp = mkdtempSync(path.join(tmpdir(), 'scene-sheet-'));
const frames = [];
for (const [i, t] of times.entries()) {
  await page.evaluate((x) => window.__sheet.seek(x), t);
  const layout = await page.evaluate(() => {
    const visible = (el) => {
      for (let n = el; n && n instanceof Element; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.15) return false;
      }
      return true;
    };
    const texts = [...document.querySelectorAll('.bp-stage svg text')].filter((t) => t.textContent.trim() && visible(t));
    const boxes = texts.map((t) => ({ t: t.textContent.trim().slice(0, 40), r: t.getBoundingClientRect(), fs: parseFloat(getComputedStyle(t).fontSize) }));
    const captionOn = !!document.querySelector('.captions');
    const off = boxes.filter((b) => b.r.width > 0 && (b.r.left < -1 || b.r.top < -1 || b.r.right > 1281 || b.r.bottom > 721)).map((b) => b.t);
    const underCaption = captionOn ? boxes.filter((b) => b.r.bottom > 632 && b.r.top < 720).map((b) => b.t) : [];
    const tiny = boxes.filter((b) => b.fs * (b.r.height / Math.max(1, b.fs)) < 11 && b.r.height > 0 && b.r.height < 11).map((b) => b.t);
    const overlaps = [];
    for (let a = 0; a < boxes.length; a++)
      for (let b = a + 1; b < boxes.length; b++) {
        const A = boxes[a].r, B = boxes[b].r;
        const w = Math.min(A.right, B.right) - Math.max(A.left, B.left);
        const h = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top);
        if (w > 4 && h > 4 && w * h > 0.25 * Math.min(A.width * A.height, B.width * B.height)) overlaps.push(`${boxes[a].t} × ${boxes[b].t}`);
      }
    return { texts: boxes.length, offStage: off, overlaps: overlaps.slice(0, 8), underCaption, tiny: tiny.slice(0, 8) };
  });
  await page.evaluate((x) => {
    let el = document.getElementById('sheet-t');
    if (!el) {
      el = Object.assign(document.createElement('div'), { id: 'sheet-t' });
      el.style.cssText = 'position:fixed;left:8px;top:8px;z-index:9;padding:2px 10px;font:600 28px/1.3 system-ui;color:#fff;background:rgba(0,0,0,.65);border-radius:6px';
      document.body.appendChild(el);
    }
    el.textContent = `t=${x}s`;
  }, t);
  const file = path.join(tmp, `f${String(i).padStart(3, '0')}.png`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1280, height: 720 } });
  frames.push({ t, file, ...layout });
}
await browser.close();

// tile: each frame scaled to 640×360 with its time burned in
const sheet = path.join(out, `${slug}-ch${chapter}.png`);
const rows = Math.ceil(frames.length / cols);
const inputs = frames.flatMap((f) => ['-i', f.file]);
const labelled = frames.map((f, i) => `[${i}:v]scale=640:360[v${i}]`).join(';');
const pad = Array.from({ length: rows * cols - frames.length }, (_, k) => `color=c=black:s=640x360:d=1[p${k}]`).join(';');
const all = [...frames.map((_, i) => `[v${i}]`), ...Array.from({ length: rows * cols - frames.length }, (_, k) => `[p${k}]`)].join('');
const filter = [labelled, pad, `${all}xstack=inputs=${rows * cols}:layout=${Array.from({ length: rows * cols }, (_, k) => `${(k % cols) * 640}_${Math.floor(k / cols) * 360}`).join('|')}[out]`].filter(Boolean).join(';');
execFileSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', filter, '-map', '[out]', '-frames:v', '1', sheet]);
rmSync(tmp, { recursive: true, force: true });

const report = {
  scene,
  sheet,
  duration: +info.duration.toFixed(2),
  captions: info.captions.length,
  pageErrors: errors,
  frames: frames.map(({ t, texts, offStage, overlaps, underCaption, tiny }) => ({ t, texts, offStage, overlaps, underCaption, tiny })).filter((f) => f.offStage.length || f.overlaps.length || f.underCaption.length || f.tiny.length),
};
report.problems = report.frames.reduce((n, f) => n + f.offStage.length + f.overlaps.length + f.underCaption.length + f.tiny.length, 0);
writeFileSync(path.join(out, `${slug}-ch${chapter}.json`), JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
process.exit(errors.length ? 1 : 0);
