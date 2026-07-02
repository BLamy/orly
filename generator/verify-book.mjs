#!/usr/bin/env node
// verify-book.mjs — the manual QA bar, automated.
//
//   node generator/verify-book.mjs --slug <slug>
//
// Expects `npm run build` to have ALREADY produced dist/. Serves dist/ with
// `vite preview`, opens the book (?bundle=<slug>) in headless Chromium, and for
// EVERY chapter: starts playback (muted), seeks the narration to ~55% of
// audioEnd, and asserts
//   (a) ZERO console errors (favicon noise excluded),
//   (b) where the manifest declares `viz` on the step active at that time, the
//       3b1b scene (`.viz-stage`) is actually mounted — not the legacy diagram,
//       not an "Unknown scene" placeholder, not a stuck loading spinner,
// then screenshots the stage to public/generated/<slug>/previews/chapter-<n>.png
// (those PNGs ship with the book's PR). Exits non-zero on any failure.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const PORT = 5199;
const BASE = `http://127.0.0.1:${PORT}`;
const SEEK_FRACTION = 0.55; // mid-chapter — past the cover, inside the meat
const SETTLE_MS = 1500; // let the seek propagate + the scene render

// ---- args -------------------------------------------------------------------
const args = process.argv.slice(2);
const slugIdx = args.indexOf('--slug');
const slug = slugIdx >= 0 ? args[slugIdx + 1] : undefined;
if (!slug) {
  console.error('usage: node generator/verify-book.mjs --slug <slug>');
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
const chapters = manifest.chapters ?? [];
if (!chapters.length) {
  console.error(`✗ manifest for "${slug}" has no chapters`);
  process.exit(2);
}

// ---- cue resolution (mirror of src/engine/align.ts resolveCues, numeric-only:
// generated manifests carry exact ElevenLabs cue seconds) ----------------------
function resolveCueTimes(steps, totalTime) {
  const n = steps.length;
  const anchor = new Array(n).fill(null);
  for (let i = 0; i < n; i++) {
    if (typeof steps[i].cue === 'number') anchor[i] = steps[i].cue;
  }
  if (anchor[0] == null) anchor[0] = 0;
  const times = new Array(n).fill(0);
  let i = 0;
  while (i < n) {
    if (anchor[i] != null) {
      times[i] = anchor[i];
      i++;
      continue;
    }
    let j = i;
    while (j < n && anchor[j] == null) j++;
    const startIdx = i - 1;
    const startT = times[startIdx];
    const endT = j < n ? anchor[j] : totalTime;
    const span = j - startIdx;
    for (let k = i; k < j; k++) times[k] = startT + ((endT - startT) * (k - startIdx)) / span;
    i = j;
  }
  for (let k = 1; k < n; k++) if (times[k] < times[k - 1]) times[k] = times[k - 1];
  return times;
}

// ---- preview server ----------------------------------------------------------
let server = null;
let browser = null;
function killServer() {
  if (server && server.pid) {
    // npx wraps vite in a child — kill the whole process group so the
    // listener itself dies, not just the wrapper (spawned detached below).
    try {
      process.kill(-server.pid, 'SIGTERM');
    } catch {
      try {
        server.kill('SIGTERM');
      } catch {
        /* already gone */
      }
    }
  }
  server = null;
}
process.on('exit', killServer);
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    killServer();
    process.exit(130);
  });
}

async function waitFor200(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`preview server did not answer 200 at ${url} within ${timeoutMs}ms`);
}

// ---- the run -----------------------------------------------------------------
const failures = [];
const summary = [];

try {
  server = spawn(
    'npx',
    // --host 127.0.0.1: vite's default "localhost" may bind IPv6-only ([::1]),
    // which the health check (and CI) would miss.
    ['vite', 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'],
    {
      cwd: root,
      stdio: 'ignore',
      detached: true, // own process group → killServer can take out npx AND vite
    }
  );
  server.on('error', (e) => {
    console.error(`✗ could not start vite preview: ${e.message}`);
    process.exit(2);
  });
  await waitFor200(`${BASE}/`);
  console.log(`· serving dist/ at ${BASE}`);

  browser = await chromium.launch({ headless: true });
  const previewsDir = path.join(root, 'public', 'generated', slug, 'previews');
  fs.mkdirSync(previewsDir, { recursive: true });

  for (const chapter of chapters) {
    const n = chapter.number;
    const label = `chapter ${n} “${chapter.title}”`;
    const steps = chapter.story?.steps ?? [];
    const audioEnd = chapter.audioEnd ?? 0;
    const target = audioEnd * SEEK_FRACTION;
    const cueTimes = resolveCueTimes(steps, audioEnd || 1);
    // the step the engine shows at `target` (same rule as Presentation.onTime)
    let stepIdx = 0;
    for (let k = 0; k < cueTimes.length; k++) {
      if (target >= cueTimes[k] - 0.02) stepIdx = k;
      else break;
    }
    const step = steps[stepIdx] ?? {};
    const expectViz = !!step.viz && !step.cover;

    const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (/favicon/i.test(text)) return;
      consoleErrors.push(text);
    });
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

    const chapterFailures = [];
    try {
      await page.goto(`${BASE}/?bundle=${encodeURIComponent(slug)}&chapter=${n}`, {
        waitUntil: 'load',
        timeout: 30000,
      });
      await page.waitForSelector('.presentation', { timeout: 20000 });

      // start playback muted, then seek the narration to mid-chapter
      await page.evaluate(() => {
        const a = document.querySelector('.presentation audio');
        if (a) a.muted = true;
      });
      const overlay = page.locator('button.play-overlay');
      if (await overlay.count()) await overlay.first().click();
      await page.evaluate((t) => {
        const a = document.querySelector('.presentation audio');
        if (a) {
          a.muted = true;
          a.currentTime = t;
        }
      }, target);
      await page.waitForTimeout(SETTLE_MS);

      // (b) viz mounted where the manifest declares it
      const vizState = await page.evaluate(() => {
        const el = document.querySelector('.viz-stage');
        return {
          mounted: !!el,
          unknown: !!el && /^Unknown scene/.test(el.getAttribute('aria-label') ?? ''),
          loading: !!document.querySelector('.viz-stage .viz-spinner'),
        };
      });
      if (expectViz) {
        const where = `${label}, step ${stepIdx} (“${step.title ?? ''}”, viz ${step.viz.scene}${
          step.viz.beat != null ? ` beat ${step.viz.beat}` : ''
        })`;
        if (!vizState.mounted) {
          chapterFailures.push(
            `viz declared but the LEGACY DIAGRAM rendered instead — .viz-stage not mounted at t=${target.toFixed(1)}s — ${where}`
          );
        } else if (vizState.unknown) {
          chapterFailures.push(`viz scene is NOT REGISTERED (Unknown scene placeholder) — ${where}`);
        } else if (vizState.loading) {
          chapterFailures.push(`viz scene still shows its loading spinner after ${SETTLE_MS}ms — ${where}`);
        }
      }

      // (a) console must be clean
      for (const e of consoleErrors) chapterFailures.push(`console error: ${e}`);

      // screenshot the stage area (viz or diagram), full page as a fallback
      const shot = path.join(previewsDir, `chapter-${n}.png`);
      const stage = page.locator('.presentation .stage').first();
      if (await stage.count()) await stage.screenshot({ path: shot });
      else await page.screenshot({ path: shot });
      summary.push(
        `  chapter ${n}: seek ${target.toFixed(1)}s/${audioEnd.toFixed(1)}s → step ${stepIdx}` +
          ` [${expectViz ? `viz ${step.viz.scene}#${step.viz.beat ?? '-'}` : 'diagram'}]` +
          ` · ${chapterFailures.length ? 'FAIL' : 'ok'} · ${path.relative(root, shot)}`
      );
    } catch (e) {
      chapterFailures.push(`did not load/play: ${e.message}`);
      summary.push(`  chapter ${n}: FAIL (${e.message})`);
    } finally {
      await context.close().catch(() => {});
    }
    for (const f of chapterFailures) failures.push(`[${label}] ${f}`);
  }
} finally {
  if (browser) await browser.close().catch(() => {});
  killServer();
}

console.log(`\nverify-book · ${slug} · ${chapters.length} chapter(s)`);
for (const line of summary) console.log(line);
if (failures.length) {
  console.error(`\n✗ ${failures.length} failure(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('\n✓ all chapters verified — console clean, viz mounted where declared, previews written');
