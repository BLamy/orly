#!/usr/bin/env node
// screenshot-chapters.mjs — grab one still per narration cue, for the blog post.
//
//   node generator/screenshot-chapters.mjs --slug <slug>
//
// Expects `npm run build` to have ALREADY produced dist/ (same precondition as
// verify-book.mjs, whose server-boot/scene-mount pattern this reuses). For
// EVERY chapter in the format-3 manifest, seeks the chapter's <audio> to
// EVERY value in `chapter.cues` (the same array the player uses to retime
// captions) and screenshots each, writing:
//   public/generated/<slug>/blog/chapter-<n>-<cueIndex>.png
// Re-runnable any time to refresh a book's blog screenshots without
// regenerating the book itself.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const PORT = 5198;
const BASE = `http://localhost:${PORT}`;
const SETTLE_MS = 900; // let the seek propagate + the scene render

// Same chrome-hiding CSS as export-mp4.mjs: no topbar/controls/captions/
// sidebar/endcard in the shot, just the visualization. We also screenshot
// only the `.bp-stage` element's box (not the full viewport), so the frame
// is exactly the visualization with no letterboxing around it.
const CLEAN_CSS = `
  .bp-topbar, .bp-controls, .bp-bigplay, .bp-endcard, .bp-side,
  .captions, .captions-below { display: none !important; }
  .bp-stagewrap { padding: 0 !important; }
  .bp-stage { max-width: none !important; max-height: none !important;
              border-radius: 0 !important; box-shadow: none !important; }
  html, body { background: #0a0e1a !important; }
  * { cursor: none !important; }
`;

const args = process.argv.slice(2);
const slugIdx = args.indexOf('--slug');
const slug = slugIdx >= 0 ? args[slugIdx + 1] : undefined;
if (!slug) {
  console.error('usage: node generator/screenshot-chapters.mjs --slug <slug>');
  process.exit(2);
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const manifestPath = path.join(root, 'public', 'generated', slug, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`✗ no manifest at ${manifestPath}`);
  process.exit(2);
}
if (!fs.existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('✗ dist/ is missing — run `npm run build` first');
  process.exit(2);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.format !== 3) {
  console.error(`✗ manifest for "${slug}" is not format 3 (got ${manifest.format ?? 'legacy'})`);
  process.exit(2);
}
const chapters = manifest.chapters ?? [];
if (!chapters.length) {
  console.error(`✗ manifest for "${slug}" has no chapters`);
  process.exit(2);
}

let server = null;
let browser = null;
function killServer() {
  if (server && server.pid) {
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      try { server.kill('SIGTERM'); } catch { /* already gone */ }
    }
  }
  server = null;
}
process.on('exit', killServer);
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => { killServer(); process.exit(130); });
}

const CLIP_PADDING = 28; // px breathing room around the tight content box

// The full .bp-stage box is a 16:9 frame — most scenes only draw content in
// a small region of it, surrounded by empty background. Crop to the union
// of visible SVG elements' rects instead, so the shot is just the graphic
// (padded a little), not a mostly-empty 16:9 frame with a small diagram
// floating in the middle.
async function contentClip(page) {
  const box = await page.evaluate((pad) => {
    const stage = document.querySelector('.bp-stage');
    const svg = stage?.querySelector('svg');
    if (!stage || !svg) return null;
    const stageRect = stage.getBoundingClientRect();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of svg.querySelectorAll('*')) {
      if (typeof el.getBBox !== 'function' && !(el instanceof SVGGraphicsElement)) continue;
      let opacity = 1;
      for (let n = el; n && n !== svg; n = n.parentElement) {
        const cs = getComputedStyle(n);
        if (cs.visibility === 'hidden' || cs.display === 'none') { opacity = 0; break; }
        opacity *= parseFloat(cs.opacity || '1');
      }
      if (opacity < 0.05) continue;
      let r;
      try { r = el.getBoundingClientRect(); } catch { continue; }
      if (r.width <= 0 || r.height <= 0) continue;
      // skip full-bleed background rects/panels — they're not "the graphic"
      if (r.width >= stageRect.width * 0.98 && r.height >= stageRect.height * 0.98) continue;
      minX = Math.min(minX, r.left);
      minY = Math.min(minY, r.top);
      maxX = Math.max(maxX, r.right);
      maxY = Math.max(maxY, r.bottom);
    }
    if (minX === Infinity) return null;
    const left = Math.max(stageRect.left, minX - pad);
    const top = Math.max(stageRect.top, minY - pad);
    const right = Math.min(stageRect.right, maxX + pad);
    const bottom = Math.min(stageRect.bottom, maxY + pad);
    return { x: left, y: top, width: right - left, height: bottom - top };
  }, CLIP_PADDING);
  if (box && box.width > 40 && box.height > 40) return box;
  // fall back to the full stage if nothing measurable was found
  return page.locator('.bp-stage').boundingBox();
}

async function waitFor200(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`preview server did not answer 200 at ${url} within ${timeoutMs}ms`);
}

const failures = [];
const summary = [];

try {
  server = spawn(
    'npx',
    ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
    { cwd: root, stdio: 'ignore', detached: true }
  );
  server.on('error', (e) => {
    console.error(`✗ could not start vite preview: ${e.message}`);
    process.exit(2);
  });
  await waitFor200(`http://127.0.0.1:${PORT}/`);
  console.log(`· serving dist/ at ${BASE}`);

  browser = await chromium.launch({ headless: true });
  const blogDir = path.join(root, 'public', 'generated', slug, 'blog');
  fs.mkdirSync(blogDir, { recursive: true });

  for (const chapter of chapters) {
    const n = chapter.number;
    const label = `chapter ${n} “${chapter.title}”`;
    const cues = chapter.cues?.length ? chapter.cues : [0];

    const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript((css) => {
      const add = () => {
        const s = document.createElement('style');
        s.textContent = css;
        document.head.appendChild(s);
      };
      if (document.head) add();
      else document.addEventListener('DOMContentLoaded', add);
    }, CLEAN_CSS);

    try {
      await page.goto(`${BASE}/?bundle=${encodeURIComponent(slug)}&chapter=${n}`, {
        waitUntil: 'load',
        timeout: 30000,
      });

      await page.waitForFunction(
        () => {
          if (document.querySelector('.bp-stage-msg')) return true; // fail fast below
          if (document.querySelector('.bp-stage svg')) return true;
          const svgs = [...document.querySelectorAll('#root svg, body svg')];
          return svgs.some((s) => {
            const r = s.getBoundingClientRect();
            return r.width > 400 && r.height > 200 && s.childElementCount > 0;
          });
        },
        { timeout: 20000 }
      );
      if (await page.locator('.bp-stage-msg').count()) {
        failures.push(`[${label}] scene '${chapter.scene}' is NOT AVAILABLE in the player`);
        continue;
      }

      await page.evaluate(() => {
        for (const a of document.querySelectorAll('audio')) a.muted = true;
        const btn = [...document.querySelectorAll('button')].find((b) =>
          /play|start|begin|▶/i.test(b.textContent + ' ' + (b.getAttribute('aria-label') ?? ''))
        );
        btn?.click();
      });

      for (let i = 0; i < cues.length; i++) {
        // cue[0] is always t=0 — the scene's very first instant, before its
        // first beat has drawn anything (confirmed reliably blank/near-blank
        // even seconds in). Shoot 60% of the way into the opening cue's
        // window instead, which is deep into that beat's entrance animation
        // but still well before the NEXT caption starts.
        const target = i === 0 && cues[1] ? cues[1] * 0.6 : cues[i];
        const seeked = await page.evaluate((t) => {
          const a = document.querySelector('audio');
          if (a) { a.muted = true; a.pause(); a.currentTime = t; return 'audio'; }
          return 'none';
        }, target);
        if (seeked === 'none') {
          await page.waitForTimeout(Math.min(4000, target * 1000));
        }
        await page.waitForTimeout(SETTLE_MS);
        const shot = path.join(blogDir, `chapter-${n}-${i}.png`);
        const clip = await contentClip(page);
        await page.screenshot({ path: shot, clip: clip ?? undefined });
      }
      summary.push(`  chapter ${n}: ${cues.length} cue(s) shot`);
    } catch (e) {
      failures.push(`[${label}] did not load/play: ${e.message}`);
      summary.push(`  chapter ${n}: FAIL (${e.message})`);
    } finally {
      await context.close().catch(() => {});
    }
  }
} finally {
  if (browser) await browser.close().catch(() => {});
  killServer();
}

console.log(`\nscreenshot-chapters · ${slug} · ${chapters.length} chapter(s)`);
for (const line of summary) console.log(line);
if (failures.length) {
  console.error(`\n✗ ${failures.length} failure(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('\n✓ all chapter cue screenshots written to public/generated/<slug>/blog/');
