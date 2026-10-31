#!/usr/bin/env node
// Contact sheets — one PNG per shot: frames across the shot, each captioned with its time and the
// narration line being spoken (or the next one, in a silence). What shot authors and reviewers Read.
//
//   npm run film:sheets -- --slug <slug> [--shot id[,id] | --all] [--every 2] [--n MIN] [--no-beats]
//                          [--cols C] [--tile PX] [--build | --base <url> | --static <dir>] (default: the running dev server)
//
// Output: films/<slug>/qa/sheets/<shot>.png (+ <shot>.json with the sampled times). Sampling follows the shot's
// LENGTH, not a fixed count: n = max(--n, ceil(duration / --every)) frames at (k + 0.5)/n of the shot (so no two are
// more than --every s apart; default 2 s), snapped to whole frames, plus one frame on every timeline beat (labelled;
// a beat within one frame of a sample labels that sample instead). --no-beats drops the beat frames. Layout: 3
// columns of 640 px up to 9 frames, else 4 columns of 480 px (override with --cols / --tile).
// The header strip shows shot id, absolute span, duration, transition and beats. Captions are rendered on
// a separate strip under each frame, so they never cover the picture.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, list, num, helpText } from './lib/args.mjs';
import { filmPaths, readJson, rel, mkdirp, fmtClock } from './lib/paths.mjs';
import { launchChromium } from './lib/browser.mjs';
import { openSite } from './lib/site.mjs';
import { openHarness } from './lib/harness.mjs';
import { ff } from './lib/ffmpeg.mjs';
import { lineAt } from './lib/timing.mjs';

const a = parseArgs(process.argv.slice(2), {
  boolean: ['all', 'build', 'beats', 'help', 'rebuild'],
  string: ['slug', 'dir', 'shot', 'shots', 'n', 'every', 'cols', 'tile', 'base', 'static'],
  default: { rebuild: true, beats: true },
});
if (a.help || !a.slug) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });
const N_MIN = Math.max(1, num(a.n, 1));
const EVERY = Math.max(0.25, num(a.every, 2));
const W = 1920;
const H = 1080;
const CAP_H = 150; // caption strip height in 1920-px units (scaled with the tile)

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

async function strip(page, html, w, h) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;width:${w}px;height:${h}px;background:#111;color:#eee;font:500 38px/1.28 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden">${html}</body></html>`,
  );
  return page.screenshot({ type: 'png' });
}

function caption(tl, shot, t) {
  const at = tl ? lineAt(tl, t) : null;
  const head = `<b>${fmtClock(t, true)}</b> <span style="color:#aaa">· ${shot.id} +${(t - shot.start).toFixed(2)}s</span>`;
  if (!at?.line) return `${head}<br><span style="color:#888">(no narration)</span>`;
  const txt = at.line.text.length > 120 ? at.line.text.slice(0, 117) + '…' : at.line.text;
  return at.speaking
    ? `${head}<br><span style="color:#ffd27a">${esc(at.line.id)}</span> “${esc(txt)}”`
    : `${head}<br><span style="color:#888">(silence) next ${esc(at.line.id)}: “${esc(txt)}”</span>`;
}

async function main() {
  const tl = readJson(P.app.timeline, null) ?? readJson(P.narration.timeline, null);
  const site = await openSite({ mode: a.static ? 'static' : a.build ? 'build' : 'dev', base: a.base, staticDir: a.static, rebuild: a.rebuild !== false });
  const browser = await launchChromium({ gpu: true });
  const out = [];
  try {
    const h = await openHarness(browser, site.base, a.slug, { width: W, height: H });
    const ids = [...list(a.shot), ...list(a.shots)];
    const shots = ids.length ? ids.map((id) => h.info.shots.find((s) => s.id === id) ?? (() => { throw new Error(`shot ${id} is not in the harness`); })()) : h.info.shots;
    const labelCtx = await browser.newContext({ deviceScaleFactor: 1 });
    const lp = await labelCtx.newPage();
    mkdirp(P.qa.sheets);
    const fps = h.info.fps;
    for (const shot of shots) {
      const dur = shot.end - shot.start;
      const N = Math.max(N_MIN, Math.ceil(dur / EVERY - 1e-6));
      const samples = Array.from({ length: N }, (_, k) => ({ t: Math.floor((shot.start + ((k + 0.5) / N) * dur) * fps + 1e-6) / fps }));
      const tlShot = tl?.shots.find((s) => s.id === shot.id);
      if (a.beats !== false && tlShot)
        for (const [id, bt] of Object.entries(tlShot.beats)) {
          const t = Math.floor((shot.start + Math.max(0, Math.min(bt, dur - 1 / fps))) * fps + 1e-6) / fps;
          const near = samples.find((q) => !q.beat && Math.abs(q.t - t) < 1.5 / fps);
          if (near) Object.assign(near, { t, beat: id });
          else samples.push({ t, beat: id });
        }
      samples.sort((x, y) => x.t - y.t);
      const COLS = Math.max(1, num(a.cols, samples.length > 9 ? 4 : 3));
      const TILE = num(a.tile, COLS >= 4 ? 480 : 640);
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sheet-'));
      const files = [];
      for (let i = 0; i < samples.length; i++) {
        const t = Math.floor(samples[i].t * fps + 1e-6) / fps;
        samples[i].t = +t.toFixed(4);
        await h.seek(t);
        const f = path.join(tmp, `f${i}.jpg`);
        fs.writeFileSync(f, await h.capture({ format: 'jpeg', quality: 90 }));
        const c = path.join(tmp, `c${i}.png`);
        const beat = samples[i].beat ? `<span style="float:right;color:#7fd3ff">beat: ${esc(samples[i].beat)}</span>` : '';
        fs.writeFileSync(c, await strip(lp, `<div style="padding:10px 18px">${beat}${caption(tl, shot, t)}</div>`, W, CAP_H));
        files.push([f, c]);
      }
      const cols = Math.min(COLS, samples.length);
      const rows = Math.ceil(samples.length / cols);
      const th = Math.round((TILE * H) / W);
      const ch = Math.round((TILE * CAP_H) / W);
      const beatsTxt = tlShot ? Object.entries(tlShot.beats).map(([k, v]) => `${k} ${v.toFixed(2)}`).join(' · ') : '';
      const header = path.join(tmp, 'header.png');
      fs.writeFileSync(
        header,
        await strip(
          lp,
          `<div style="padding:14px 22px;font-size:34px"><b>${esc(shot.id)}</b> <span style="color:#aaa">${fmtClock(shot.start, true)} → ${fmtClock(shot.end, true)} · ${dur.toFixed(2)} s · in: ${esc(shot.transitionIn ?? tlShot?.transitionIn ?? 'cut')}${tlShot?.mood ? ` · ${esc(tlShot.mood)}` : ''}${shot.authored === false ? ' · <span style="color:#f77">PLACEHOLDER</span>' : ''}</span><br><span style="color:#7fd3ff;font-size:28px">${esc(beatsTxt || 'no beats')}</span></div>`,
          TILE * cols,
          110,
        ),
      );
      const inputs = files.flatMap(([f, c]) => ['-i', f, '-i', c]);
      const parts = files.map((_, i) => `[${2 * i}:v]scale=${TILE}:${th}[v${i}];[${2 * i + 1}:v]scale=${TILE}:${ch}[c${i}];[v${i}][c${i}]vstack[t${i}]`);
      const pads = Array.from({ length: rows * cols - files.length }, (_, k) => `color=c=0x111111:s=${TILE}x${th + ch}:d=1[p${k}]`);
      const cells = [...files.map((_, i) => `[t${i}]`), ...pads.map((_, k) => `[p${k}]`)];
      const layout = cells.map((_, i) => `${(i % cols) * TILE}_${Math.floor(i / cols) * (th + ch)}`).join('|');
      const grid = cells.length > 1 ? `${cells.join('')}xstack=inputs=${cells.length}:layout=${layout}:fill=0x111111[grid]` : `${cells[0]}null[grid]`;
      const hi = files.length * 2;
      const graph = [...parts, ...pads, grid, `[${hi}:v]scale=${TILE * cols}:-1[hd]`, `[hd][grid]vstack[out]`].join(';');
      const sheet = path.join(P.qa.sheets, `${shot.id}.png`);
      ff(['-y', '-v', 'error', ...inputs, '-i', header, '-filter_complex', graph, '-map', '[out]', '-frames:v', '1', sheet]);
      fs.writeFileSync(sheet.replace(/\.png$/, '.json'), JSON.stringify({ shot: shot.id, start: shot.start, end: shot.end, samples }, null, 1));
      fs.rmSync(tmp, { recursive: true, force: true });
      out.push(rel(sheet));
      console.log(`  ${shot.id}: ${samples.length} frames → ${rel(sheet)}`);
    }
    await labelCtx.close();
    if (h.errors.length) {
      console.warn(`  page errors: ${[...new Set(h.errors)].slice(0, 5).join(' | ')}`);
      process.exitCode = 1;
    }
    await h.close();
  } finally {
    await browser.close();
    await site.close();
  }
  console.log(`${out.length} sheets in ${rel(P.qa.sheets)}`);
}

main().catch((e) => {
  console.error(`error: ${e.message}`);
  process.exit(1);
});
