#!/usr/bin/env node
// Film Editor smoke test (docs/film/EDITOR.md "Verification") against the film dev server.
//
//   node tools/film/editor-smoke.mjs [--slug neural-net-history] [--base http://127.0.0.1:5199]
//                                    [--no-export] [--no-roundtrip] [--roundtrip-from <s>] [--roundtrip-len 10]
//                                    [--keep-export] [--no-audio-roundtrip] [--no-ui (skip steps 1-4)]
//
// Steps (each prints PASS/FAIL with its numbers; exit code 1 when any check fails):
//   0. the dev server answers (started with `npm run film:dev` into .orly-work/film-dev.log when it does not);
//      films/<slug>/edit/project.json is removed ONLY when it is malformed (unparseable or not a project), so the
//      editor re-imports the film
//   1. open /?film-edit=<slug>, wait for the project, the timeline and the shot painters; no page errors
//   2. screenshot the full UI (.orly-work/editor/smoke-*.png)
//   3. play 2 s: the audio clock advances and preview frames change
//   3b. editing feel (the review fixes): a click on a lane puts the cursor on the frame grid; S with nothing
//      selected splits every track under the cursor; S inside a transition is refused with a status message; an
//      Alt-drag slip shows in the preview while the button is down (and Esc cancels it); late shot thumbnails fill
//      in without any other repaint (screenshot smoke-2b-thumbs.png)
//   4. split a picture event, undo, redo; save; reload; the split persisted; restore the pre-split project and
//      save it, so project.json equals the import again
//   4c. server: autosave writes edit/autosave.json and leaves project.json alone; a foreign Host (DNS rebinding)
//      is refused
//   4b. drag-and-drop from the Explorer: a Title generator onto the Titles track, a Video FX onto a picture event
//      (real HTML5 drags), then undo both
//   5. export 0:00-0:06 through POST /__editor/render/<slug> and ffprobe it: 144 frames at 24 fps, an audio stream,
//      audio and video lengths within one frame (the export is moved to .orly-work/editor/ unless --keep-export)
//   6. round trip: export a 10 s window of the unedited import starting just before the film's first transition
//      (generator/film/edit-render.mjs --dev) and compare its picture (ffmpeg psnr, target >= 35 dB average) with
//        a. the film as it renders NOW: the same frames from the film's own render harness (/?film-render=<slug>,
//           lib/harness.mjs, encoded like render.mjs) into .orly-work/editor/ — the gate;
//        b. films/<slug>/render/film.mp4 — the gate too while it is current; when render-report.json predates the
//           clock (narration/timeline.json) or the shot modules, it shows an older cut of the film and is only
//           reported.
//   7. audio round trip: the whole unedited import rendered through the export's audio path (the edit harness's
//      renderAudio, 60 s chunks) against mix/master.wav: integrated loudness within 1 LU, sample peak at or under
//      the project's limiter ceiling (+0.1 dB); and chunk seams: [170, 190) rendered in one go equals two 10 s
//      chunks joined at 180 s (the limiter has finite memory), max difference ≤ 2 LSB
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { parseArgs, num } from '../../generator/film/lib/args.mjs';
import { launchChromium } from '../../generator/film/lib/browser.mjs';
import { ff, startEncoder, videoInfo, x264Args } from '../../generator/film/lib/ffmpeg.mjs';
import { openHarness } from '../../generator/film/lib/harness.mjs';
import { ROOT, WORK, mkdirp, rel } from '../../generator/film/lib/paths.mjs';

const a = parseArgs(process.argv.slice(2), {
  boolean: ['ui', 'export', 'roundtrip', 'audio-roundtrip', 'keep-export'],
  string: ['slug', 'base', 'roundtrip-from', 'roundtrip-len'],
  default: { ui: true, export: true, roundtrip: true, 'audio-roundtrip': true },
});
const SLUG = a.slug || 'neural-net-history';
const BASE = (a.base || 'http://127.0.0.1:5199').replace(/\/$/, '');
const OUT = path.join(WORK, 'editor');
const FILM = path.join(ROOT, 'films', SLUG);
const PROJECT = path.join(FILM, 'edit', 'project.json');
mkdirp(OUT);

// ---------------------------------------------------------------------------
// reporting
// ---------------------------------------------------------------------------
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  return !!ok;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const t0 = Date.now();
const since = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;

// ---------------------------------------------------------------------------
// 0. dev server + project sanity
// ---------------------------------------------------------------------------
async function answers(url, ms = 4000) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(ms) });
    return r.ok;
  } catch {
    return false;
  }
}

async function ensureDevServer() {
  if (await answers(`${BASE}/__editor/films`)) return;
  console.log(`dev server not answering at ${BASE}: starting npm run film:dev (log: .orly-work/film-dev.log)`);
  const log = fs.openSync(path.join(WORK, 'film-dev.log'), 'a');
  const child = spawn('npm', ['run', 'film:dev'], { cwd: ROOT, detached: true, stdio: ['ignore', log, log] });
  child.unref();
  for (let i = 0; i < 90; i++) {
    await sleep(1000);
    if (await answers(`${BASE}/__editor/films`)) return;
  }
  throw new Error(`dev server did not come up at ${BASE} (see .orly-work/film-dev.log)`);
}

/** remove project.json only when it cannot be a project (the editor then re-imports the film) */
function dropMalformedProject() {
  if (!fs.existsSync(PROJECT)) return 'absent (the editor imports the film)';
  let p;
  try {
    p = JSON.parse(fs.readFileSync(PROJECT, 'utf8'));
  } catch (e) {
    fs.rmSync(PROJECT);
    return `malformed JSON (${e.message.slice(0, 60)}): removed`;
  }
  const ok = p && typeof p === 'object' && p.slug === SLUG && Array.isArray(p.tracks) && p.media && typeof p.media === 'object';
  if (!ok) {
    fs.rmSync(PROJECT);
    return 'not a project for this film: removed';
  }
  return `present (${p.tracks.length} tracks)`;
}

// ---------------------------------------------------------------------------
// browser helpers
// ---------------------------------------------------------------------------
async function openEditor(page) {
  await page.goto(`${BASE}/?film-edit=${SLUG}`, { waitUntil: 'domcontentloaded' });
  // the project (imported or loaded) and the engines
  await page.waitForFunction(() => !!window.__filmEditor?.store.getState().project, null, { timeout: 120_000, polling: 250 });
  // the lazy timeline canvas, and the shot painters (no placeholder frames at the cursor)
  await page.waitForSelector('.tl-canvas', { timeout: 60_000 });
  await page.waitForFunction(
    () => {
      const fe = window.__filmEditor;
      const c = document.createElement('canvas');
      c.width = 320;
      c.height = 180;
      fe.compositor.render(fe.store.getState().ui.cursor, c.getContext('2d'));
      return fe.compositor.stats().placeholders === 0;
    },
    null,
    { timeout: 120_000, polling: 500 },
  );
}

/** 4b. real HTML5 drags from the Explorer onto the timeline, then undo */
async function dndChecks(page) {
  const before = await page.evaluate(() => window.__filmEditor.store.getState().project);
  const canvas = page.locator('.tl-canvas');
  const box = await canvas.boundingBox();
  const rowY = async (i) => {
    const r = await page.locator('.tl-th').nth(i).boundingBox();
    return r.y + r.height / 2 - box.y;
  };
  const tracks = await page.evaluate(() => window.__filmEditor.store.getState().project.tracks.map((t) => t.id));
  const titles = tracks.indexOf('V0');
  const picture = tracks.indexOf('V1');
  // show 20-40 s so the drop lands on a known time
  await page.evaluate(() => window.__filmEditor.store.set({ scrollT: 20, pxPerSec: (document.querySelector('.tl-canvas').clientWidth || 1000) / 20, cursor: 30 }));
  await sleep(300);
  // a Title generator at ~30 s on the Titles track
  await page.getByRole('tab', { name: 'Generators' }).click();
  await page.locator('.fe-tile', { hasText: 'Centred display title' }).dragTo(canvas, { targetPosition: { x: box.width / 2, y: await rowY(titles) } });
  const t = await page.evaluate(() => {
    const p = window.__filmEditor.store.getState().project;
    const ev = p.tracks.find((x) => x.id === 'V0').events;
    return { n: ev.length, start: ev[0]?.start, kind: ev[0] ? p.media[ev[0].mediaId]?.kind : null };
  });
  check('drop: a Title generator lands on the Titles track', t.n === 1 && t.kind === 'text' && Math.abs(t.start - 30) < 0.6, `${t.n} event(s), ${t.kind} at ${t.start?.toFixed(3)} s`);
  await sleep(600);
  await page.screenshot({ path: path.join(OUT, 'smoke-5-dnd-title.png') });
  // a Sepia FX onto the picture event under ~25 s
  await page.getByRole('tab', { name: 'Video FX' }).click();
  await page.locator('.fe-media-item', { hasText: 'Sepia' }).first().dragTo(canvas, { targetPosition: { x: box.width / 4, y: await rowY(picture) } });
  const fx = await page.evaluate(() => {
    const p = window.__filmEditor.store.getState().project;
    const e = p.tracks.find((x) => x.id === 'V1').events.find((x) => x.start <= 25 && x.start + x.length > 25);
    return { id: e?.id, fx: (e?.videoFx ?? []).map((f) => f.kind).join(',') };
  });
  check('drop: a Video FX lands on the picture event', fx.fx === 'sepia', `${fx.id}: [${fx.fx}]`);
  await page.evaluate(() => {
    const fe = window.__filmEditor;
    fe.commands.undo();
    fe.commands.undo();
  });
  const same = await page.evaluate((b) => JSON.stringify(window.__filmEditor.store.getState().project.tracks) === JSON.stringify(b.tracks), before);
  check('drops undo cleanly', same);
  await page.getByRole('tab', { name: 'Project Media' }).click();
}

/** 3b. editing feel: frame-exact clicks, Vegas split rules, live slip preview, late thumbnails */
async function feelChecks(page) {
  const projectJson = () => page.evaluate(() => JSON.stringify(window.__filmEditor.store.getState().project.tracks));
  const before = await projectJson();
  const fps = await page.evaluate(() => window.__filmEditor.store.getState().project.fps);
  const canvas = page.locator('.tl-canvas');
  const box = await canvas.boundingBox();
  const rowOf = async (id) => {
    const i = await page.evaluate((tid) => window.__filmEditor.store.getState().project.tracks.findIndex((t) => t.id === tid), id);
    const r = await page.locator('.tl-th').nth(i).boundingBox();
    return { y: r.y + r.height / 2, top: r.y, h: r.height };
  };

  // late thumbnails: zoom to 20 px/s around 9:30 and leave it alone; the shot thumbnails must fill in by themselves
  await page.evaluate(() => window.__filmEditor.store.set({ pxPerSec: 20, scrollT: 560, cursor: 570, selection: [] }));
  await sleep(5000);
  await page.screenshot({ path: path.join(OUT, 'smoke-2b-thumbs.png') });

  // a click on an empty stretch of the Titles lane at an arbitrary x: the cursor lands on a frame
  const titles = await rowOf('V0');
  await page.mouse.click(box.x + box.width * 0.37 + 0.31, titles.y);
  const cur = await page.evaluate(() => window.__filmEditor.store.getState().ui.cursor);
  check('a click puts the cursor on the frame grid', Math.abs(cur * fps - Math.round(cur * fps)) < 1e-6, `cursor ${cur.toFixed(6)} s = frame ${(cur * fps).toFixed(4)}`);

  // S with nothing selected: every track under the cursor splits (Vegas), at a frame
  const pick = await page.evaluate(() => {
    const p = window.__filmEditor.store.getState().project;
    const pic = p.tracks.find((t) => t.id === 'V1');
    const nar = p.tracks.find((t) => t.id === 'A1');
    // a narration line inside a shot, away from the shot's transitions: its middle
    for (const n of nar.events) {
      const t = Math.round((n.start + n.length / 2) * p.fps) / p.fps;
      const under = pic.events.filter((e) => e.start < t && t < e.start + e.length);
      if (under.length === 1 && t > 120) return { t, shot: under[0].id, line: n.id };
    }
    return null;
  });
  if (pick) {
    const counts = () => page.evaluate(() => Object.fromEntries(window.__filmEditor.store.getState().project.tracks.map((t) => [t.id, t.events.length])));
    await page.evaluate((t) => window.__filmEditor.store.set({ cursor: t, selection: [] }), pick.t);
    const c0 = await counts();
    await page.locator('.tl-root').focus();
    await page.keyboard.press('s');
    const c1 = await counts();
    const split = Object.keys(c0).filter((k) => c1[k] === c0[k] + 1);
    check('S with nothing selected splits every track under the cursor', split.includes('V1') && split.includes('A1'), `split tracks: ${split.join(', ')} at ${pick.t.toFixed(3)} s`);
    await page.evaluate(() => window.__filmEditor.commands.undo());
  }

  // S inside a transition is refused (the transition would restart from 0 %)
  const tr = firstTransition();
  if (tr) {
    const t = Math.round(tr.cut * fps) / fps;
    await page.evaluate((x) => window.__filmEditor.store.set({ cursor: x, selection: [], track: 'V1' }), t);
    const n0 = await page.evaluate(() => window.__filmEditor.store.getState().project.tracks.find((x) => x.id === 'V1').events.length);
    await page.locator('.tl-root').focus();
    await page.keyboard.press('s');
    const after = await page.evaluate(() => ({ n: window.__filmEditor.store.getState().project.tracks.find((x) => x.id === 'V1').events.length, status: window.__filmEditor.store.getState().ui.status }));
    check('S inside a transition leaves the picture whole and says why', after.n === n0 && /transition/i.test(after.status), `V1 ${n0} → ${after.n} events; status "${after.status}"`);
    if (await page.evaluate(() => window.__filmEditor.store.getState().undoLabel === 'Split')) await page.evaluate(() => window.__filmEditor.commands.undo());
  }

  // Alt-drag slip: the preview shows the slipped picture while the button is down; Esc cancels
  if (pick) {
    // the film's shots warm up on their first paint (the reel does the same): visit a neighbouring frame first so
    // the reference is the frame as it paints from then on
    await page.evaluate((p) => window.__filmEditor.store.set({ pxPerSec: 40, scrollT: Math.max(0, p.t - 10), cursor: p.t + 0.5, selection: [] }), pick);
    await sleep(300);
    await page.evaluate((p) => window.__filmEditor.store.set({ cursor: p.t }), pick);
    await sleep(400);
    const pic = await rowOf('V1');
    const x = box.x + 10 * 40 + 6; // the cursor's x (the event is under it)
    const h0 = await previewHash(page);
    await page.keyboard.down('Alt');
    await page.mouse.move(x, pic.top + pic.h * 0.75);
    await page.mouse.down();
    await page.mouse.move(x + 40, pic.top + pic.h * 0.75, { steps: 6 });
    await sleep(350);
    const h1 = await previewHash(page);
    await page.screenshot({ path: path.join(OUT, 'smoke-3b-slip-live.png') });
    await page.keyboard.press('Escape');
    await page.mouse.up();
    await page.keyboard.up('Alt');
    await sleep(300);
    const h2 = await previewHash(page);
    check('slip: the preview shows the slip live; Esc cancels it', h1 !== h0 && h2 === h0, `preview ${h0} → ${h1} (dragging) → ${h2} (after Esc)`);
  }
  check('editing-feel checks leave the project as it was', (await projectJson()) === before);
}

/** 4c. autosave never touches project.json; a foreign Host header is refused (DNS rebinding) */
async function serverChecks() {
  const mtime0 = fs.statSync(PROJECT).mtimeMs;
  const body = fs.readFileSync(PROJECT);
  const put = await fetch(`${BASE}/__editor/project/${SLUG}?autosave=1`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body });
  const auto = path.join(FILM, 'edit', 'autosave.json');
  const wrote = put.ok && fs.existsSync(auto);
  const untouched = fs.statSync(PROJECT).mtimeMs === mtime0;
  await fetch(`${BASE}/__editor/project/${SLUG}/autosave`, { method: 'DELETE' });
  check('autosave writes edit/autosave.json, not project.json', wrote && untouched && !fs.existsSync(auto), `PUT ${put.status}; project.json untouched: ${untouched}`);
  const u = new URL(`${BASE}/__editor/films`);
  const status = await new Promise((resolve) => {
    const req = http.request({ host: u.hostname, port: u.port, path: u.pathname, headers: { host: `rebind.example.com:${u.port}` } }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('error', () => resolve(0));
    req.end();
  });
  check('a foreign Host is refused (DNS rebinding)', status === 403, `HTTP ${status}`);
}

/** a cheap fingerprint of the preview canvas (changes when the picture does) */
const previewHash = (page) =>
  page.evaluate(() => {
    const c = document.querySelector('.fe-preview-frame canvas');
    if (!c) return null;
    const s = document.createElement('canvas');
    s.width = 64;
    s.height = 36;
    const x = s.getContext('2d');
    x.drawImage(c, 0, 0, 64, 36);
    const d = x.getImageData(0, 0, 64, 36).data;
    let h = 0;
    for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0;
    return h;
  });

const eventCount = (page) => page.evaluate(() => window.__filmEditor.store.getState().project.tracks.reduce((n, t) => n + t.events.length, 0));

// ---------------------------------------------------------------------------
// export helpers
// ---------------------------------------------------------------------------
function avCheck(file, { frames, fps }) {
  const v = videoInfo(file);
  const frameSec = 1 / fps;
  check('export: frame count', v.frames === frames, `${v.frames} frames, expected ${frames}`);
  check('export: frame rate', Math.abs(v.fps - fps) < 1e-6, `${v.fps} fps`);
  check('export: audio stream', v.audioCodec != null, `audio codec ${v.audioCodec}`);
  const dv = Math.abs((v.audioDuration ?? NaN) - v.videoDuration);
  check('export: audio/video lengths within one frame', dv <= frameSec + 1e-6, `video ${v.videoDuration?.toFixed(4)} s, audio ${v.audioDuration?.toFixed(4)} s, |Δ| ${dv.toFixed(4)} s`);
  return v;
}

async function exportViaRoute(from, to) {
  const name = `smoke-${from}-${to}`;
  const r = await fetch(`${BASE}/__editor/render/${SLUG}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ from, to, preset: 'final', name }),
  });
  if (!r.ok) throw new Error(`POST /__editor/render: ${r.status} ${await r.text()}`);
  let st = null;
  let lastPhase = '';
  const deadline = Date.now() + 15 * 60_000;
  while (Date.now() < deadline) {
    await sleep(1000);
    st = await (await fetch(`${BASE}/__editor/render/${SLUG}/status`)).json();
    if (st.phase !== lastPhase) {
      lastPhase = st.phase;
      console.log(`      render ${st.phase} ${Math.round((st.progress ?? 0) * 100)}% ${st.message ?? ''}`);
    }
    if (st.state !== 'running') break;
  }
  if (st?.state !== 'done') throw new Error(`render ended ${st?.state}/${st?.phase}: ${st?.message ?? ''}\n${(st?.log ?? []).slice(-12).join('\n')}`);
  return { status: st, file: path.join(FILM, st.out) };
}

/** the first non-cut transition on the film clock: [overlap start, cut, kind] */
function firstTransition() {
  const tl = JSON.parse(fs.readFileSync(path.join(FILM, 'narration', 'timeline.json'), 'utf8'));
  for (const s of tl.shots) {
    if (!s.transitionIn || s.transitionIn === 'cut' || !(s.start > 0)) continue;
    return { cut: s.start, from: s.start - (s.transitionDur ?? 1) / 2, kind: s.transitionIn, shot: s.id, fps: tl.fps };
  }
  return null;
}

/** PSNR (dB, average and min over frames) of `a` against `ref` frames [f0, f0 + n) */
function psnr(file, ref, f0, n) {
  const statsFile = path.join(OUT, 'roundtrip-psnr.log');
  const r = ff([
    '-i', file,
    '-i', ref,
    '-filter_complex',
    `[0:v]trim=start_frame=0:end_frame=${n},setpts=PTS-STARTPTS,format=yuv420p[a];` +
      `[1:v]trim=start_frame=${f0}:end_frame=${f0 + n},setpts=PTS-STARTPTS,format=yuv420p[b];` +
      `[a][b]scale2ref=flags=bicubic[a2][b2];[a2][b2]psnr=stats_file=${statsFile.replace(/:/g, '\\:')}`,
    '-an', '-f', 'null', '-',
  ]);
  const m = /average:([\d.]+|inf)/.exec(String(r.stderr));
  const per = fs
    .readFileSync(statsFile, 'utf8')
    .trim()
    .split('\n')
    .map((l) => /psnr_avg:([\d.]+|inf)/.exec(l)?.[1])
    .filter(Boolean)
    .map((v) => (v === 'inf' ? 99 : Number(v)));
  return { avg: m ? (m[1] === 'inf' ? 99 : Number(m[1])) : NaN, min: Math.min(...per), frames: per.length };
}

/** frames [f0, f0 + n) of the film's own render harness (the reel), encoded like render.mjs */
async function captureReel(f0, n, fps, out, { width = 1920, height = 1080 } = {}) {
  const browser = await launchChromium({ gpu: true });
  try {
    const h = await openHarness(browser, BASE, SLUG, { width, height });
    const enc = startEncoder(x264Args({ fps, crf: 18, preset: 'medium', out }));
    for (let i = 0; i < n; i++) {
      await h.seek((f0 + i) / fps);
      const jpeg = await h.capture({ format: 'jpeg', quality: 95 });
      await enc.write(jpeg);
    }
    await enc.end();
    await h.close();
    return h.errors;
  } finally {
    await browser.close();
  }
}

/** newest mtime (ms) of the files under a directory (shot modules) */
function newestUnder(dir) {
  let t = 0;
  if (!fs.existsSync(dir)) return t;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    t = Math.max(t, e.isDirectory() ? newestUnder(f) : fs.statSync(f).mtimeMs);
  }
  return t;
}

// ---------------------------------------------------------------------------
// run
// ---------------------------------------------------------------------------
async function main() {
  await ensureDevServer();
  check('dev server answers', true, BASE);
  console.log(`      project.json: ${dropMalformedProject()}`);

  if (a.ui) await uiChecks();
  await exportChecks();
  if (a['audio-roundtrip']) await audioRoundTrip();
}

/** EBU R128 integrated loudness (LUFS) and sample peak (dBFS) of a file */
function levels(file) {
  const r = ff(['-i', file, '-af', 'ebur128,volumedetect', '-f', 'null', '-']);
  const err = String(r.stderr);
  const sum = err.slice(err.lastIndexOf('Summary:'));
  return { I: Number(/I:\s+(-?[\d.]+) LUFS/.exec(sum)?.[1]), peak: Number(/max_volume: (-?[\d.]+) dB/.exec(err)?.[1]) };
}

/** 7. the whole edit mix through the export's audio path vs the film's master */
async function audioRoundTrip() {
  const master = path.join(FILM, 'mix', 'master.wav');
  if (!fs.existsSync(master)) {
    console.log(`      ${rel(master)} missing: audio round trip skipped`);
    return;
  }
  console.log(`[${since()}] audio round trip: the whole edit mix through __edit.renderAudio`);
  const project = fs.readFileSync(PROJECT);
  const pj = JSON.parse(project);
  const browser = await launchChromium({ audio: true });
  const wav = path.join(OUT, 'roundtrip-mix.wav');
  try {
    const page = await (await browser.newContext()).newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/__edit-render/project.json', (r) => r.fulfill({ body: project, contentType: 'application/json' }));
    await page.goto(`${BASE}/?film-edit-render=${SLUG}&project=/__edit-render/project.json&w=640&h=360`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.__edit, null, { timeout: 120_000 });
    await page.evaluate(() => window.__edit.ready);
    const { duration, sampleRate } = await page.evaluate(() => ({ duration: window.__edit.duration, sampleRate: window.__edit.sampleRate ?? 48000 }));
    const tStart = Date.now();
    const chunks = [];
    for (let t = 0; t < duration; t += 60) {
      const b64 = await page.evaluate(([x, y]) => window.__edit.renderAudio(x, y), [t, Math.min(duration, t + 60)]);
      chunks.push(Buffer.from(typeof b64 === 'string' ? b64 : (b64.data ?? b64.pcm), 'base64'));
    }
    // chunk seams under the limiter: one render vs two chunks joined at 180 s
    if (duration > 190) {
      const r16 = (b64) => {
        const b = Buffer.from(b64, 'base64');
        return new Int16Array(b.buffer, b.byteOffset, b.length / 2);
      };
      const whole = r16(await page.evaluate(() => window.__edit.renderAudio(170, 190)));
      const a1 = r16(await page.evaluate(() => window.__edit.renderAudio(170, 180)));
      const a2 = r16(await page.evaluate(() => window.__edit.renderAudio(180, 190)));
      let worst = 0;
      let at = 0;
      const joined = new Int16Array(a1.length + a2.length);
      joined.set(a1, 0);
      joined.set(a2, a1.length);
      for (let i = 0; i < Math.min(whole.length, joined.length); i++) {
        const d = Math.abs(whole[i] - joined[i]);
        if (d > worst) {
          worst = d;
          at = 170 + i / 2 / sampleRate;
        }
      }
      check('audio: chunked render joins the one-shot render (limiter seams)', worst <= 2 && whole.length === joined.length, `max |Δ| ${worst} LSB${worst ? ` at ${at.toFixed(3)} s` : ''} over ${(whole.length / 2 / sampleRate).toFixed(1)} s`);
    }
    const pcm = Buffer.concat(chunks);
    const h = Buffer.alloc(44);
    h.write('RIFF', 0);
    h.writeUInt32LE(36 + pcm.length, 4);
    h.write('WAVEfmt ', 8);
    h.writeUInt32LE(16, 16);
    h.writeUInt16LE(1, 20);
    h.writeUInt16LE(2, 22);
    h.writeUInt32LE(sampleRate, 24);
    h.writeUInt32LE(sampleRate * 4, 28);
    h.writeUInt16LE(4, 32);
    h.writeUInt16LE(16, 34);
    h.write('data', 36);
    h.writeUInt32LE(pcm.length, 40);
    fs.writeFileSync(wav, Buffer.concat([h, pcm]));
    console.log(`      ${duration.toFixed(1)} s rendered in ${((Date.now() - tStart) / 1000).toFixed(1)} s${errors.length ? `; page errors: ${errors.slice(0, 2).join(' | ')}` : ''}`);
  } finally {
    await browser.close();
  }
  const e = levels(wav);
  const m = levels(master);
  check('audio round trip: loudness within 1 LU of mix/master.wav', Math.abs(e.I - m.I) <= 1, `edit ${e.I} LUFS, film ${m.I} LUFS, Δ ${(e.I - m.I).toFixed(1)} LU`);
  const ceiling = Math.min(0, pj.master?.limiterDb ?? 0);
  check('audio round trip: sample peak at the limiter ceiling', e.peak <= ceiling + 0.1, `edit peak ${e.peak} dBFS, ceiling ${ceiling} dBFS (film ${m.peak} dBFS)`);
}

async function uiChecks() {
  const browser = await launchChromium({ gpu: true, audio: true });
  const ctx = await browser.newContext({ viewport: { width: 1680, height: 1000 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  // page errors (uncaught exceptions, console errors, failed requests) fail the run; a film shot module that throws
  // while building is film content, not the editor: it is listed (the compositor paints a placeholder) but passes
  const errors = [];
  const shotFailures = new Set();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    const shot = /^\[film\] shot (\S+) failed/.exec(text);
    if (shot) shotFailures.add(`${shot[1]}: ${text.split('\n')[0].replace(/^.*?Error: /, '').slice(0, 140)}`);
    else if (!/^Failed to load resource/.test(text)) errors.push(`console: ${text.slice(0, 300)}`);
  });
  page.on('response', (r) => {
    // a 404 for the project is how the server says "not imported yet" (the editor then imports the film)
    if (r.status() === 404 && r.request().method() === 'GET' && r.url().startsWith(`${BASE}/__editor/project/`)) return;
    if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.request().method()} ${r.url().replace(BASE, '')}`);
  });

  let restored = false;
  let original = null;
  try {
    // ---- 1. open ----
    const tOpen = Date.now();
    await openEditor(page);
    const info = await page.evaluate(() => {
      const p = window.__filmEditor.store.getState().project;
      return { tracks: p.tracks.map((t) => `${t.id}:${t.events.length}`).join(' '), media: Object.keys(p.media).length, duration: p.tracks.reduce((m, t) => Math.max(m, ...t.events.map((e) => e.start + e.length)), 0) };
    });
    check('editor opens and loads the project', true, `${((Date.now() - tOpen) / 1000).toFixed(1)} s; tracks ${info.tracks}; ${info.media} media; ${info.duration.toFixed(2)} s`);
    // let audio decoding and thumbnails settle a little for the screenshot
    await page.waitForFunction(() => document.querySelector('.fe-root') != null, null, { timeout: 10_000 });
    await sleep(2500);
    await page.screenshot({ path: path.join(OUT, 'smoke-1-loaded.png') });
    check('no page errors on load', errors.length === 0, errors.slice(0, 3).join(' | '));

    // a closer view: zoom the timeline in around 28 s (shot thumbnails, waveforms, the first transitions)
    await page.evaluate(() => {
      const s = window.__filmEditor.store;
      s.set({ cursor: 28, pxPerSec: 60, scrollT: 14 });
    });
    await sleep(1500);
    await page.screenshot({ path: path.join(OUT, 'smoke-2-zoomed.png') });

    // ---- 3. play 2 s ----
    const h0 = await previewHash(page);
    const playFrom = await page.evaluate(() => {
      const fe = window.__filmEditor;
      fe.commands.playStop();
      return fe.store.getState().ui.cursor;
    });
    const hashes = new Set([h0]);
    const clock0 = await page.evaluate(() => window.__filmEditor.audio.now());
    const wall0 = Date.now();
    for (let i = 0; i < 8; i++) {
      await sleep(250);
      hashes.add(await previewHash(page));
    }
    const clock1 = await page.evaluate(() => window.__filmEditor.audio.now());
    const wall = (Date.now() - wall0) / 1000;
    await page.screenshot({ path: path.join(OUT, 'smoke-3-playing.png') });
    const playing = await page.evaluate(() => window.__filmEditor.audio.playing);
    await page.evaluate(() => window.__filmEditor.commands.playStop());
    const adv = clock1 - clock0;
    check('playback: audio clock advances', playing && adv > 0.75 * wall, `from ${playFrom.toFixed(2)} s: clock +${adv.toFixed(2)} s in ${wall.toFixed(2)} s wall`);
    check('playback: preview frames change', hashes.size >= 4, `${hashes.size} distinct preview frames in ${wall.toFixed(2)} s`);
    const back = await page.evaluate(() => window.__filmEditor.store.getState().ui.cursor);
    check('stop returns to the play start', Math.abs(back - playFrom) < 1e-6, `cursor ${back.toFixed(3)} s`);

    await feelChecks(page);

    // ---- 4. split / undo / redo / save / reload ----
    original = await page.evaluate(() => JSON.stringify(window.__filmEditor.store.getState().project));
    const n0 = await eventCount(page);
    const target = await page.evaluate(() => {
      const fe = window.__filmEditor;
      const p = fe.store.getState().project;
      const pic = p.tracks.find((t) => t.id === 'V1') ?? p.tracks.find((t) => t.kind === 'video' && t.events.length);
      // a shot event around 40 s, split mid-way (away from its transitions)
      const e = pic.events.find((x) => x.start <= 40 && x.start + x.length > 40) ?? pic.events[0];
      const t = Math.round((e.start + e.length / 2) * p.fps) / p.fps;
      fe.store.set({ selection: [e.id], track: pic.id, cursor: t });
      fe.commands.split();
      return { id: e.id, t, track: pic.id };
    });
    const n1 = await eventCount(page);
    await page.evaluate(() => window.__filmEditor.commands.undo());
    const n2 = await eventCount(page);
    await page.evaluate(() => window.__filmEditor.commands.redo());
    const n3 = await eventCount(page);
    check('split / undo / redo', n1 === n0 + 1 && n2 === n0 && n3 === n0 + 1, `events ${n0} → ${n1} → ${n2} → ${n3} (split ${target.id} at ${target.t.toFixed(3)} s)`);
    await page.screenshot({ path: path.join(OUT, 'smoke-4-split.png') });
    const saved = await page.evaluate(() => window.__filmEditor.save());
    const dirty = await page.evaluate(() => window.__filmEditor.store.getState().dirty);
    check('save', saved && !dirty, `saved=${saved} dirty=${dirty}`);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await openEditor(page);
    const persisted = await page.evaluate(({ t, track }) => {
      const p = window.__filmEditor.store.getState().project;
      const tr = p.tracks.find((x) => x.id === track);
      return { n: p.tracks.reduce((n, x) => n + x.events.length, 0), cut: tr.events.some((e) => Math.abs(e.start - t) < 1e-6) };
    }, target);
    check('the split persisted across a reload', persisted.n === n0 + 1 && persisted.cut, `${persisted.n} events, an event starts at ${target.t.toFixed(3)} s: ${persisted.cut}`);

    // restore the import (one undoable edit), save, and confirm the file matches it
    await page.evaluate((json) => {
      const fe = window.__filmEditor;
      const p = JSON.parse(json);
      // JSON turned Infinity durations into null: map them back (the wire convention)
      for (const m of Object.values(p.media)) if (m.duration == null) m.duration = Infinity;
      fe.store.apply('Restore import', () => p);
      return fe.save();
    }, original);
    restored = true;
    const onDisk = JSON.parse(fs.readFileSync(PROJECT, 'utf8'));
    // the saved view (cursor, zoom, loop) is UI state, not the edit
    const strip = (p) => JSON.stringify({ ...p, updatedAt: null, createdAt: null, view: null });
    const was = JSON.parse(original);
    check('restored project equals the import', strip(onDisk) === strip(was), `${onDisk.tracks.reduce((n, t) => n + t.events.length, 0)} events on disk`);
    await dndChecks(page);
    await serverChecks();
    check('no page errors during the session', errors.length === 0, errors.slice(0, 3).join(' | '));
    if (shotFailures.size) console.log(`      film content: ${shotFailures.size} shot module(s) threw while building (placeholder painted, as in the reel):\n        ${[...shotFailures].join('\n        ')}`);
  } finally {
    if (!restored && original) {
      // never leave the smoke edit behind
      const p = JSON.parse(original);
      await fetch(`${BASE}/__editor/project/${SLUG}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p) }).catch(() => undefined);
    }
    await browser.close();
  }
}

async function exportChecks() {
  // ---- 5. export 0:00-0:06 through the render route ----
  if (a.export) {
    console.log(`[${since()}] export 0-6 s through POST /__editor/render/${SLUG}`);
    const tEx = Date.now();
    const { file } = await exportViaRoute(0, 6);
    console.log(`      ${rel(file)} in ${((Date.now() - tEx) / 1000).toFixed(1)} s`);
    avCheck(file, { frames: 144, fps: 24 });
    const kept = a['keep-export'] ? file : path.join(OUT, path.basename(file));
    if (!a['keep-export']) {
      fs.renameSync(file, kept);
      const report = file.replace(/\.mp4$/, '.json');
      if (fs.existsSync(report)) fs.renameSync(report, kept.replace(/\.mp4$/, '.json'));
    }
    ff(['-y', '-ss', '3', '-i', kept, '-frames:v', '1', path.join(OUT, 'smoke-6-export-3s.png')]);
  }

  // ---- 6. round trip against the film's own render ----
  if (a.roundtrip) {
    const tr = firstTransition();
    if (!tr) {
      check('round trip', false, 'no transition on the clock');
      return;
    }
    const fps = tr.fps;
    const len = num(a['roundtrip-len'], 10);
    const from = a['roundtrip-from'] != null ? num(a['roundtrip-from'], 0) : Math.max(0, Math.floor((tr.from - 0.5) * fps) / fps);
    const f0 = Math.round(from * fps);
    const n = Math.round(len * fps);
    console.log(`[${since()}] round trip: ${len} s from ${from.toFixed(3)} s (frames ${f0}-${f0 + n - 1}; first transition: ${tr.kind} into ${tr.shot} at ${tr.cut} s)`);
    const out = path.join(OUT, `roundtrip-${f0}.mp4`);
    const r = spawnSync(
      process.execPath,
      [path.join(ROOT, 'generator/film/edit-render.mjs'), '--slug', SLUG, '--project', PROJECT, '--dev', '--base', BASE, '--from', String(from), '--to', String(from + len), '--out', out, '--no-audio'],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 },
    );
    if (r.status !== 0) {
      check('round trip export', false, String(r.stderr || r.stdout).trim().split('\n').slice(-8).join(' | '));
      return;
    }
    const v = videoInfo(out);
    check('round trip export', v.frames === n, `${v.frames} frames ${v.width}×${v.height}`);
    const mid = Math.max(0, tr.cut - from);
    ff(['-y', '-ss', mid.toFixed(3), '-i', out, '-frames:v', '1', path.join(OUT, 'roundtrip-edit.png')]);

    // a. the film as it renders now (the reel harness)
    const reel = path.join(OUT, `roundtrip-${f0}-reel.mp4`);
    const reelErrors = await captureReel(f0, n, fps, reel, { width: v.width, height: v.height });
    const qr = psnr(out, reel, 0, n);
    check('round trip picture vs the film harness (reel) >= 35 dB', qr.avg >= 35, `average ${qr.avg.toFixed(2)} dB, worst frame ${qr.min.toFixed(2)} dB over ${qr.frames} frames${reelErrors.length ? `; harness errors: ${reelErrors.slice(0, 2).join(' | ')}` : ''}`);
    ff(['-y', '-ss', mid.toFixed(3), '-i', reel, '-frames:v', '1', path.join(OUT, 'roundtrip-reel.png')]);

    // b. the film's last full render
    const ref = path.join(FILM, 'render', 'film.mp4');
    if (!fs.existsSync(ref)) {
      console.log(`      ${rel(ref)} missing: film.mp4 comparison skipped`);
      return;
    }
    const q = psnr(out, ref, f0, n);
    const renderedAt = fs.statSync(path.join(FILM, 'render', 'render-report.json')).mtimeMs;
    const clockAt = fs.statSync(path.join(FILM, 'narration', 'timeline.json')).mtimeMs;
    const shotsAt = newestUnder(path.join(ROOT, 'apps/bookshelf/src/viz/films', SLUG));
    const stale = renderedAt < Math.max(clockAt, shotsAt);
    ff(['-y', '-ss', (from + mid).toFixed(3), '-i', ref, '-frames:v', '1', path.join(OUT, 'roundtrip-film.png')]);
    const detail = `average ${q.avg.toFixed(2)} dB, worst frame ${q.min.toFixed(2)} dB over ${q.frames} frames`;
    if (!stale) check('round trip picture vs render/film.mp4 >= 35 dB', q.avg >= 35, detail);
    else
      console.log(
        `NOTE  round trip vs render/film.mp4: ${detail} — not gated: film.mp4 (${new Date(renderedAt).toISOString()}) predates the current ` +
          `${clockAt > renderedAt ? `clock (${new Date(clockAt).toISOString()})` : ''}${clockAt > renderedAt && shotsAt > renderedAt ? ' and ' : ''}` +
          `${shotsAt > renderedAt ? `shot modules (${new Date(shotsAt).toISOString()})` : ''}; re-render the film (npm run film:render) to gate on it`,
      );
  }
}

async function run() {
  await main();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed in ${since()}; screenshots in ${rel(OUT)}/`);
  fs.writeFileSync(path.join(OUT, 'smoke-report.json'), JSON.stringify({ at: new Date().toISOString(), slug: SLUG, results }, null, 1));
  process.exit(failed.length ? 1 : 0);
}

run().catch((e) => {
  console.error(`FAIL  ${e.stack || e}`);
  process.exit(1);
});
