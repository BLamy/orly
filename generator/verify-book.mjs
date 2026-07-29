#!/usr/bin/env node
// verify-book.mjs — the manual QA bar for v3 scene-native books, automated.
//
//   node generator/verify-book.mjs --slug <slug>
//
// Expects `npm run build` to have ALREADY produced dist/. Serves dist/ with
// `vite preview`, opens the book (?bundle=<slug>) in headless Chromium, and for
// EVERY chapter in the format-3 manifest:
//   (a) enters the chapter (?bundle=<slug>&chapter=<n>),
//   (b) asserts the scene is actually mounted and playing — an <svg> inside the
//       play surface with real content, and a captions element present
//       (selectors are asserted robustly: the v3 player's exact class names are
//       owned by a sibling agent, so we look for an SVG anywhere in the app
//       root plus any caption-ish element),
//   (c) asserts ZERO console errors (favicon noise excluded),
//   (d) seeks/waits to mid-chapter and screenshots to
//       public/generated/<slug>/previews/chapter-<n>.png.
// Exits non-zero on any failure.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

const PORT = 5199;
// vite preview may bind IPv6 ::1 for "localhost" — we force 127.0.0.1 below,
// but connect via localhost so either family works.
const BASE = `http://localhost:${PORT}`;
const SEEK_FRACTION = 0.5; // mid-chapter
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
if (manifest.format !== 3) {
  console.error(`✗ manifest for "${slug}" is not format 3 (got ${manifest.format ?? 'legacy'}) — regenerate with generator/video.mjs`);
  process.exit(2);
}
const chapters = manifest.chapters ?? [];
if (!chapters.length) {
  console.error(`✗ manifest for "${slug}" has no chapters`);
  process.exit(2);
}

// ---- preview server ----------------------------------------------------------
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

// ---- the run -----------------------------------------------------------------
const failures = [];
const summary = [];

try {
  server = spawn(
    'npx',
    // --host 127.0.0.1: vite's default "localhost" may bind IPv6-only ([::1]);
    // pinning the host makes the health check and CI deterministic.
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
  const previewsDir = path.join(root, 'public', 'generated', slug, 'previews');
  fs.mkdirSync(previewsDir, { recursive: true });

  for (const chapter of chapters) {
    const n = chapter.number;
    const label = `chapter ${n} “${chapter.title}”`;
    const duration = chapter.duration ?? 0;
    const target = duration * SEEK_FRACTION;

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

      // (b) the scene svg must mount in the play surface. Prefer the v3
      // player's own stage (`.bp-stage svg`, src/player/ChapterPlayer.tsx);
      // fall back to "a large SVG with real content" so a selector rename
      // doesn't false-fail the gate. `.bp-stage-msg` = scene unavailable.
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
        chapterFailures.push(`scene '${chapter.scene}' is NOT AVAILABLE in the player (.bp-stage-msg) — is it registered under apps/bookshelf/src/viz/books/?`);
      }
      if (await page.locator('.bp-spinner').count()) {
        await page.waitForTimeout(2000);
        if (await page.locator('.bp-spinner').count()) {
          chapterFailures.push('scene stuck on its loading spinner (.bp-spinner) after 2s');
        }
      }

      // start playback muted (autoplay policies), then seek to mid-chapter
      await page.evaluate(() => {
        for (const a of document.querySelectorAll('audio')) a.muted = true;
        // click an obvious play affordance if the player gates on one
        const btn = [...document.querySelectorAll('button')].find((b) =>
          /play|start|begin|▶/i.test(b.textContent + ' ' + (b.getAttribute('aria-label') ?? ''))
        );
        btn?.click();
      });
      const seeked = await page.evaluate((t) => {
        const a = document.querySelector('audio');
        if (a) { a.muted = true; a.currentTime = t; return 'audio'; }
        return 'none';
      }, target);
      if (seeked === 'none') {
        // no audio element (player may drive time itself) — just wait a beat
        await page.waitForTimeout(Math.min(4000, target * 1000));
      }
      await page.waitForTimeout(SETTLE_MS);

      // playing = the SVG's rendered content changes over time, OR the clock is
      // advancing (a well-authored scene may hold perfectly still between
      // beats — a quiet stretch is not a frozen player).
      const alive = await page.evaluate(async () => {
        const svg = [...document.querySelectorAll('svg')].sort(
          (a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width
        )[0];
        if (!svg) return false;
        const audio = document.querySelector('audio');
        const t0 = audio ? audio.currentTime : null;
        const a = svg.innerHTML;
        await new Promise((r) => setTimeout(r, 700));
        if (svg.innerHTML !== a) return true;
        if (audio && !audio.paused && audio.currentTime > t0 + 0.3) return true;
        return false;
      });
      if (!alive) {
        chapterFailures.push(`scene appears frozen at t≈${target.toFixed(1)}s (static innerHTML and no advancing clock over 700ms)`);
      }

      // captions element present (robust: class containing "caption", or the
      // current caption's text rendered somewhere on the page)
      const captionsOk = await page.evaluate(() => !!document.querySelector('[class*="caption" i], [data-captions], .captions'));
      if (!captionsOk) {
        chapterFailures.push('no captions element found ([class*="caption"], [data-captions], .captions)');
      }

      // (e) half-clipped labels — WARNING, not failure: a VISIBLE
      // text/foreignObject straddling the stage edge at the sampled frame is
      // the signature of the "camera parked on a sub-region while later beats
      // reveal content outside it" bug (measured as a ~200px right shift
      // clipping right-side panels in several books). It is a warning because
      // one sampled instant can also catch a benign mid-tween or an
      // intentional push-in past a neighboring label — review the preview
      // screenshot when this fires. Partial cuts only (25–95% of the element):
      // fully offscreen elements can be legitimately parked out of frame, and
      // small spill (<25%) is within artistic tolerance.
      const clipped = await page.evaluate(() => {
        const svg = document.querySelector('.bp-stage svg') ?? document.querySelector('#root svg');
        if (!svg) return [];
        const S = svg.getBoundingClientRect();
        const bad = [];
        for (const el of svg.querySelectorAll('text, foreignObject')) {
          const r = el.getBoundingClientRect();
          if (r.width < 8 || r.height < 6) continue;
          let o = 1;
          for (let n = el; n && n !== svg; n = n.parentElement)
            o *= parseFloat(getComputedStyle(n).opacity || '1');
          if (o < 0.15) continue;
          const txt = (el.textContent || '').trim();
          if (!txt) continue;
          const cut =
            (Math.max(0, S.left - r.left) + Math.max(0, r.right - S.right)) / r.width +
            (Math.max(0, S.top - r.top) + Math.max(0, r.bottom - S.bottom)) / r.height;
          if (cut > 0.25 && cut < 0.95) bad.push(`"${txt.slice(0, 40)}" (${Math.round(cut * 100)}% cut)`);
        }
        return bad.slice(0, 6);
      });
      for (const c of clipped) {
        console.warn(`  ⚠ [${label}] label clipped by the stage edge at t≈${target.toFixed(1)}s: ${c} — is the camera parked on a sub-region while this content is revealed?`);
      }

      // (c) console must be clean
      for (const e of consoleErrors) chapterFailures.push(`console error: ${e}`);

      // (d) screenshot mid-chapter
      const shot = path.join(previewsDir, `chapter-${n}.png`);
      await page.screenshot({ path: shot });
      summary.push(
        `  chapter ${n}: seek ${target.toFixed(1)}s/${duration.toFixed(1)}s (${seeked})` +
          ` · ${chapterFailures.length ? 'FAIL' : 'ok'} · ${path.relative(root, shot)}`
      );
    } catch (e) {
      chapterFailures.push(`did not load/play: ${e.message}`);
      summary.push(`  chapter ${n}: FAIL (${e.message})`);
      try { await page.screenshot({ path: path.join(previewsDir, `chapter-${n}.png`) }); } catch { /* page gone */ }
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
console.log('\n✓ all chapters verified — scene mounted + animating, captions present, console clean, previews written');
