#!/usr/bin/env node
// Film Editor export — frame-exact render of an editor project (docs/film/EDITOR.md "Export").
//
//   npm run film:edit-render -- --slug <slug> [--project films/<slug>/edit/project.json] [--from 60 --to 90]
//                               [--w 1920 --h 1080] [--fps 24] [--quality final|preview|draft] [--workers 6]
//                               [--dev | --base <url>] [--no-rebuild] [--name <name> | --out file.mp4]
//                               [--crf 18] [--preset medium] [--seg 480] [--resume] [--no-audio] [--progress]
//                               [--keep-segments] [--dir <film dir> (tests / smoke runs outside films/)]
//
// Harness: /?film-edit-render=<slug>&project=<url>&w=&h= exposes window.__edit
//   { ready, fps, duration, width, height, sampleRate?, error?, seek(t) -> after paint, renderAudio(from, to) -> base64 PCM16 }
// The project file reaches the page through Playwright request interception (/__edit-render/project.json), and
// /__editor/media/<slug>/<path> is served from films/<slug>/ the same way (with HTTP Range), so the export runs
// against a fresh build (default, lib/site.mjs), the dev server (--dev, or --base <url> as the editor's dev server
// passes) or any URL serving the app, without the dev server's /__editor routes.
// Audio: renderAudio in 60 s chunks (the editor's OfflineAudioContext graph = the preview) -> one PCM16 WAV, sample
// counts pinned to the frame range so audio and video lengths agree exactly.
// Video: segments of --seg frames pulled by --workers headless-shell browsers (Metal GPU flags), per frame
// await __edit.seek(n / fps), CDP JPEG q95 -> libx264 (lib/ffmpeg x264Args: BT.709 tv, yuv420p); segments carry a
// .json marker keyed by project + build identity, so an interrupted build-mode export resumes (dev only with --resume).
// Mux: concat (no re-encode) + AAC 256k + chapters from the project's regions (clipped to the range).
// Checks: frame count = range × fps, size, fps, audio/video lengths within one frame, chapters present.
// Output: films/<slug>/edit/exports/<name>.mp4 (+ <name>.json report). Default name <slug>-edit[-t<from>-<to>].
// Quality: final = project size, crf 18 medium · preview = 960×540 crf 23 veryfast · draft = 640×360 crf 28 ultrafast.
// --progress prints machine-readable `PROGRESS {json}` lines (RenderStatus fields) for the editor dev server.
// SIGTERM/SIGINT cancel cleanly (encoders killed, browsers closed, partial outputs removed).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, num, helpText } from './lib/args.mjs';
import { filmPaths, readJson, writeJson, sha, rel, mkdirp, ROOT } from './lib/paths.mjs';
import { launchChromium } from './lib/browser.mjs';
import { openSite } from './lib/site.mjs';
import { ff, startEncoder, videoInfo, x264Args } from './lib/ffmpeg.mjs';
import { encodeWav } from './lib/wav.mjs';

const a = parseArgs(process.argv.slice(2), {
  boolean: ['dev', 'rebuild', 'resume', 'audio', 'help', 'progress', 'keep-segments'],
  string: ['slug', 'dir', 'project', 'from', 'to', 'w', 'h', 'fps', 'workers', 'base', 'out', 'name', 'quality', 'crf', 'preset', 'seg', 'tune'],
  default: { rebuild: true, audio: true },
});
if (a.help || !a.slug) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}

const QUALITY = {
  final: { w: null, h: null, crf: 18, preset: 'medium' },
  preview: { w: 960, h: 540, crf: 23, preset: 'veryfast' },
  draft: { w: 640, h: 360, crf: 28, preset: 'ultrafast' },
};
const AUDIO_CHUNK_SEC = 60;
const PROJECT_ROUTE = '/__edit-render/project.json';

const P = filmPaths(a.slug, { dir: a.dir });
const EDIT = path.join(P.dir, 'edit');
const quality = QUALITY[a.quality ?? 'final'];
if (!quality) {
  console.error(`error: --quality must be one of ${Object.keys(QUALITY).join(', ')}`);
  process.exit(2);
}
const WORKERS = Math.max(1, num(a.workers, Math.min(6, Math.max(1, Math.floor(os.cpus().length / 2)))));
const SEG = num(a.seg, 480);
const CRF = num(a.crf, quality.crf);
const PRESET = a.preset || quality.preset;
const TUNE = a.tune === 'none' ? null : a.tune ?? 'grain';

// ---------------------------------------------------------------------------
// progress + cancellation
// ---------------------------------------------------------------------------
/** overall progress bands per phase: [start, end] of the 0..1 bar */
const BANDS = { site: [0, 0.03], probe: [0.03, 0.05], audio: [0.05, 0.2], video: [0.2, 0.95], mux: [0.95, 0.98], verify: [0.98, 1] };
let bands = BANDS;
function progress(phase, frac = 0, extra = {}) {
  const [b0, b1] = bands[phase] ?? [1, 1];
  const p = { phase, progress: +Math.min(1, b0 + (b1 - b0) * Math.max(0, Math.min(1, frac))).toFixed(4), ...extra };
  if (a.progress) process.stdout.write(`PROGRESS ${JSON.stringify(p)}\n`);
}

const live = { browsers: new Set(), encoders: new Set(), site: null, partial: new Set() };
let cancelled = false;
async function shutdown(signal) {
  if (cancelled) return;
  cancelled = true;
  console.error(`edit-render: ${signal}, cancelling`);
  for (const e of live.encoders) e.kill();
  await Promise.allSettled([...live.browsers].map((b) => b.close()));
  await live.site?.close().catch(() => {});
  for (const f of live.partial) fs.rmSync(f, { force: true });
  if (a.progress) process.stdout.write(`PROGRESS ${JSON.stringify({ phase: 'cancelled', message: `cancelled (${signal})` })}\n`);
  process.exit(130);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
const checkCancel = () => {
  if (cancelled) throw new Error('cancelled');
};

async function browser() {
  const b = await launchChromium({ gpu: true });
  live.browsers.add(b);
  return {
    b,
    close: async () => {
      live.browsers.delete(b);
      await b.close().catch(() => {});
    },
  };
}

// ---------------------------------------------------------------------------
// harness (the lib/harness.mjs pattern, for ?film-edit-render with project + media interception)
// ---------------------------------------------------------------------------
const MEDIA_TYPES = {
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.flac': 'audio/flac', '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg', '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.mov': 'video/quicktime', '.webm': 'video/webm',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif',
  '.svg': 'image/svg+xml', '.json': 'application/json',
};

/** films/<slug>/<rel> for a /__editor/media/<slug>/<rel> URL, or null when it escapes the film folder */
function mediaFile(pathname) {
  const m = /^\/__editor\/media\/([^/]+)\/(.+)$/.exec(pathname);
  if (!m) return null;
  let slug, relPath;
  try {
    slug = decodeURIComponent(m[1]);
    relPath = m[2].split('/').map(decodeURIComponent).join('/');
  } catch {
    return null;
  }
  if (!/^[a-z0-9_][a-z0-9._-]*$/i.test(slug) || relPath.includes('\0')) return null;
  const dir = slug === a.slug ? P.dir : path.join(ROOT, 'films', slug);
  const abs = path.resolve(dir, relPath);
  if (!abs.startsWith(dir + path.sep)) return null;
  try {
    const real = fs.realpathSync(abs);
    return real.startsWith(fs.realpathSync(dir) + path.sep) && fs.statSync(real).isFile() ? real : null;
  } catch {
    return null;
  }
}

async function serveMedia(route) {
  const req = route.request();
  const file = mediaFile(new URL(req.url()).pathname);
  if (!file) return route.fulfill({ status: 404, body: 'not found' });
  const size = fs.statSync(file).size;
  const type = MEDIA_TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  const m = /^bytes=(\d*)-(\d*)/.exec(req.headers()['range'] ?? '');
  if (!m || (m[1] === '' && m[2] === '')) return route.fulfill({ status: 200, path: file, contentType: type, headers: { 'accept-ranges': 'bytes' } });
  let start = m[1] === '' ? Math.max(0, size - Number(m[2])) : Number(m[1]);
  const end = m[1] !== '' && m[2] !== '' ? Math.min(size - 1, Number(m[2])) : size - 1;
  if (start >= size || start > end) return route.fulfill({ status: 416, headers: { 'content-range': `bytes */${size}` } });
  const body = Buffer.alloc(end - start + 1);
  const fd = fs.openSync(file, 'r');
  try {
    fs.readSync(fd, body, 0, body.length, start);
  } finally {
    fs.closeSync(fd);
  }
  return route.fulfill({
    status: 206,
    body,
    contentType: type,
    headers: { 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${size}`, 'content-length': String(body.length) },
  });
}

async function openEditHarness(b, base, slug, projectText, { width, height, timeout = 180 }) {
  const context = await b.newContext({ viewport: { width, height }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const page = await context.newPage();
  page.setDefaultTimeout(timeout * 1000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e.message).slice(0, 400)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text().slice(0, 400));
  });
  // Dev server: neutralise Vite's HMR socket so an edit elsewhere in the repo cannot reload the page mid-export.
  await context.addInitScript(() => {
    const Native = window.WebSocket;
    window.WebSocket = function (url, protocols) {
      if (String(protocols).includes('vite-hmr') || /[?&]token=/.test(String(url))) {
        const fake = new EventTarget();
        Object.assign(fake, { readyState: 0, send() {}, close() {}, url: String(url), protocol: 'vite-hmr' });
        return fake;
      }
      return new Native(url, protocols);
    };
    Object.assign(window.WebSocket, { CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 });
  });
  // the project under export (also answers the editor's own project route, in case the harness uses it)
  const projectRoute = (url) => url.pathname === PROJECT_ROUTE || url.pathname === `/__editor/project/${slug}`;
  await context.route(projectRoute, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: projectText }));
  await context.route((url) => url.pathname.startsWith('/__editor/media/'), serveMedia);

  const url = `${base}/?film-edit-render=${encodeURIComponent(slug)}&project=${encodeURIComponent(PROJECT_ROUTE)}&w=${width}&h=${height}`;
  await page.goto(url, { waitUntil: 'load' });
  let info;
  for (let attempt = 0; ; attempt++) {
    try {
      // a first dev-server visit may reload once (dependency optimisation): retry across navigations
      await page.waitForFunction(() => !!(window.__edit && (window.__edit.ready || window.__edit.error)), null, { timeout: timeout * 1000 });
      await page.evaluate(() => (window.__edit.error ? null : window.__edit.ready));
      info = await page.evaluate(() => {
        const e = window.__edit;
        return { fps: e.fps, duration: e.duration, width: e.width, height: e.height, sampleRate: e.sampleRate ?? null, error: e.error ?? null };
      });
      break;
    } catch (e) {
      if (attempt >= 3 || !/context was destroyed|navigation/i.test(String(e))) throw new Error(`edit harness did not become ready: ${String(e.message ?? e).split('\n')[0]}${errors.length ? ` (page: ${errors[0]})` : ''}`);
      await page.waitForLoadState('load');
    }
  }
  if (info.error) throw new Error(`edit harness error: ${info.error}`);
  let clip = null;
  if (info.width !== width || info.height !== height) {
    // harness renders at its own size: capture it whole and scale in the screenshot
    await page.setViewportSize({ width: info.width, height: info.height });
    clip = { x: 0, y: 0, width: info.width, height: info.height, scale: width / info.width };
  }
  const cdp = await context.newCDPSession(page);
  return {
    info,
    errors,
    seek: (t) => page.evaluate((tt) => window.__edit.seek(tt), t),
    renderAudio: (from, to) => page.evaluate(([f, t]) => window.__edit.renderAudio(f, t), [from, to]),
    async capture() {
      const r = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 95, optimizeForSpeed: true, ...(clip ? { clip } : {}) });
      return Buffer.from(r.data, 'base64');
    },
    close: () => context.close(),
  };
}

// ---------------------------------------------------------------------------
// audio: 60 s chunks of interleaved stereo PCM16 -> one WAV (header from lib/wav, sizes patched at the end)
// ---------------------------------------------------------------------------
/** decode a renderAudio result: a base64 string (interleaved stereo s16le) or {data|pcm, sampleRate?, channels?} */
function decodeChunk(r, sampleRate) {
  const b64 = typeof r === 'string' ? r : r?.data ?? r?.pcm;
  if (typeof b64 !== 'string') throw new Error(`renderAudio returned ${r === null ? 'null' : typeof r}, expected base64 PCM16`);
  const channels = typeof r === 'object' && r.channels ? Number(r.channels) : 2;
  const sr = typeof r === 'object' && r.sampleRate ? Number(r.sampleRate) : sampleRate;
  if (sr !== sampleRate) throw new Error(`renderAudio chunk at ${sr} Hz, expected ${sampleRate} Hz`);
  const buf = Buffer.from(b64, 'base64');
  const pcm = new Int16Array(buf.buffer, buf.byteOffset, Math.floor(buf.byteLength / 2));
  if (channels === 2) return pcm;
  if (channels !== 1) throw new Error(`renderAudio chunk has ${channels} channels (1 or 2 supported)`);
  const st = new Int16Array(pcm.length * 2); // mono -> both channels
  for (let i = 0; i < pcm.length; i++) st[2 * i] = st[2 * i + 1] = pcm[i];
  return st;
}

async function renderAudioWav(h, file, t0, nSamples, sampleRate) {
  const header = encodeWav([new Float32Array(0), new Float32Array(0)], sampleRate, 's16').buf;
  const fd = fs.openSync(file, 'w');
  live.partial.add(file);
  let written = 0;
  let short = 0;
  try {
    fs.writeSync(fd, header);
    const chunk = AUDIO_CHUNK_SEC * sampleRate;
    for (let s0 = 0; s0 < nSamples; s0 += chunk) {
      checkCancel();
      const s1 = Math.min(nSamples, s0 + chunk);
      const want = (s1 - s0) * 2;
      let pcm = decodeChunk(await h.renderAudio(t0 + s0 / sampleRate, t0 + s1 / sampleRate), sampleRate);
      // pin every chunk to its exact sample count (a resampler may be off by a sample or two)
      if (pcm.length !== want) {
        short += Math.abs(pcm.length - want) / 2;
        const fixed = new Int16Array(want);
        fixed.set(pcm.subarray(0, Math.min(want, pcm.length)));
        pcm = fixed;
      }
      fs.writeSync(fd, Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength));
      written += s1 - s0;
      progress('audio', written / nSamples, { message: `audio ${(written / sampleRate).toFixed(0)} / ${(nSamples / sampleRate).toFixed(0)} s` });
    }
    // patch RIFF and data sizes
    const dataBytes = written * 4;
    const sizes = Buffer.alloc(4);
    sizes.writeUInt32LE(36 + dataBytes);
    fs.writeSync(fd, sizes, 0, 4, 4);
    sizes.writeUInt32LE(dataBytes);
    fs.writeSync(fd, sizes, 0, 4, 40);
  } finally {
    fs.closeSync(fd);
  }
  live.partial.delete(file);
  return { samples: written, padded: short };
}

// ---------------------------------------------------------------------------
// chapters from regions
// ---------------------------------------------------------------------------
const metaEscape = (s) => String(s).replace(/([=;#\\\n])/g, '\\$1');

/** ffmetadata chapters for the regions overlapping [t0, t1), re-based to t0, made sequential (no overlaps) */
function chaptersMeta(regions, t0, t1, fps) {
  const list = (regions ?? [])
    .filter((r) => Number.isFinite(r.start) && Number.isFinite(r.end) && r.end > t0 && r.start < t1)
    .map((r) => ({ start: Math.max(r.start, t0) - t0, end: Math.min(r.end, t1) - t0, title: r.label || 'Chapter' }))
    .sort((x, y) => x.start - y.start);
  for (let i = 0; i < list.length - 1; i++) list[i].end = Math.min(list[i].end, list[i + 1].start);
  const kept = list.filter((c) => c.end - c.start >= 1 / fps);
  if (!kept.length) return null;
  const ms = (s) => Math.round(s * 1000);
  return {
    count: kept.length,
    text: [';FFMETADATA1', ...kept.flatMap((c) => ['[CHAPTER]', 'TIMEBASE=1/1000', `START=${ms(c.start)}`, `END=${ms(c.end)}`, `title=${metaEscape(c.title)}`])].join('\n') + '\n',
  };
}

/** drop leftovers of abandoned exports (segments of older project states, temp audio) after a week */
function pruneWork(dir, maxAgeMs = 7 * 24 * 3600 * 1000) {
  const now = Date.now();
  const walk = (d) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const f = path.join(d, ent.name);
      if (ent.isDirectory()) walk(f);
      else if (now - fs.statSync(f).mtimeMs > maxAgeMs) fs.rmSync(f, { force: true });
    }
  };
  try {
    walk(dir);
  } catch {
    /* best effort */
  }
}

const projectEnd = (p) => p.tracks.reduce((m, tr) => tr.events.reduce((q, e) => Math.max(q, e.start + e.length), m), 0);

// ---------------------------------------------------------------------------
async function main() {
  const t0Wall = Date.now();
  const projectFile = path.resolve(a.project ?? path.join(EDIT, 'project.json'));
  const projectText = fs.readFileSync(projectFile, 'utf8');
  const project = JSON.parse(projectText);
  if (project.slug !== a.slug) throw new Error(`project ${rel(projectFile)} is for "${project.slug}", not "${a.slug}"`);
  if (!Array.isArray(project.tracks)) throw new Error(`project ${rel(projectFile)} has no tracks`);
  const W = num(a.w, quality.w ?? project.width ?? 1920);
  const H = num(a.h, quality.h ?? project.height ?? 1080);
  if (W % 2 || H % 2) throw new Error(`output size ${W}×${H} must be even (yuv420p)`);

  progress('site', 0, { message: 'preparing the site' });
  const site = await openSite({ mode: a.dev ? 'dev' : 'build', base: a.base, rebuild: a.rebuild !== false });
  live.site = site;
  const report = { at: new Date().toISOString(), slug: a.slug, project: rel(projectFile), site: site.mode, base: site.base, width: W, height: H, crf: CRF, preset: PRESET, workers: WORKERS };
  try {
    // ---- probe the harness (this page also renders the audio)
    progress('probe', 0, { message: 'opening the edit harness' });
    const pb = await browser();
    let info, audio = null, audioFile = null, errorsSeen = [];
    let fps, f0, f1, frames, sampleRate;
    const exportsDir = path.join(EDIT, 'exports');
    const workDir = path.join(exportsDir, '.work');
    mkdirp(workDir);
    pruneWork(workDir);
    try {
      const h = await openEditHarness(pb.b, site.base, a.slug, projectText, { width: W, height: H });
      info = h.info;
      fps = num(a.fps, info.fps || project.fps);
      const dur = info.duration;
      const pDur = projectEnd(project);
      if (Math.abs(pDur - dur) > 1 / fps) console.warn(`  warn: harness duration ${dur.toFixed(3)} s != project end ${pDur.toFixed(3)} s`);
      const total = Math.round(dur * fps);
      f0 = Math.max(0, Math.round(num(a.from, 0) * fps));
      f1 = Math.min(total, Math.round(num(a.to, dur) * fps));
      if (f1 <= f0) throw new Error(`empty range: frames ${f0}..${f1} of ${total}`);
      frames = f1 - f0;
      sampleRate = info.sampleRate || project.sampleRate || 48000;
      Object.assign(report, { fps, duration: dur, totalFrames: total, from: f0 / fps, to: f1 / fps, frames, sampleRate });
      console.log(`edit-render ${a.slug}: frames ${f0}..${f1} (${(frames / fps).toFixed(2)} s of ${dur.toFixed(2)} s) @ ${W}x${H}@${fps}, ${WORKERS} workers, site ${site.mode}`);
      bands = a.audio === false ? { ...BANDS, video: [0.05, 0.95] } : BANDS;
      progress('probe', 1, { totalFrames: frames, frames: 0 });

      // ---- audio
      if (a.audio !== false) {
        checkCancel();
        audioFile = path.join(workDir, `audio-${process.pid}.wav`);
        const nSamples = Math.round((frames / fps) * sampleRate);
        const tA = Date.now();
        audio = await renderAudioWav(h, audioFile, f0 / fps, nSamples, sampleRate);
        report.audio = { sampleRate, samples: audio.samples, paddedSamples: audio.padded, sec: +((Date.now() - tA) / 1000).toFixed(1) };
        if (audio.padded > sampleRate / fps) console.warn(`  warn: renderAudio chunks were off by ${audio.padded} samples in total (padded/trimmed)`);
        console.log(`  audio: ${(audio.samples / sampleRate).toFixed(2)} s @ ${sampleRate} Hz in ${report.audio.sec} s`);
      }
      errorsSeen.push(...h.errors);
      await h.close();
    } finally {
      await pb.close();
    }

    // ---- video segments
    const variant = `${W}x${H}@${fps}`;
    const segDir = path.join(workDir, variant);
    mkdirp(segDir);
    const key = sha({ project: sha(projectText), W, H, fps, CRF, PRESET, tune: TUNE, site: site.key ?? 'dev' });
    const seg = Math.max(24, Math.min(SEG, Math.ceil(frames / WORKERS)));
    const segs = [];
    for (let f = f0; f < f1; f += seg) segs.push({ a: f, b: Math.min(f1, f + seg) });
    for (const s of segs) {
      s.file = path.join(segDir, `${key}-${String(s.a).padStart(6, '0')}-${String(s.b).padStart(6, '0')}.mp4`);
      const m = readJson(s.file.replace(/\.mp4$/, '.json'), null);
      const keyOk = m && m.key === key && (site.mode !== 'dev' && site.mode !== 'base' ? true : !!a.resume);
      s.done = !!(keyOk && fs.existsSync(s.file) && m.frames === s.b - s.a && videoInfo(s.file).frames === s.b - s.a);
    }
    const todo = segs.filter((s) => !s.done);
    const todoFrames = todo.reduce((q, s) => q + s.b - s.a, 0);
    let doneFrames = frames - todoFrames;
    Object.assign(report, { segments: segs.length, reused: segs.length - todo.length });
    let next = 0;
    let lastTick = 0;
    let lastLog = Date.now();
    const tRender = Date.now();
    /** progress line at most once a second, human log line every 5 s */
    const tick = (force = false) => {
      const now = Date.now();
      if (!force && now - lastTick < 1000) return;
      lastTick = now;
      const captured = doneFrames - (frames - todoFrames);
      const rate = captured / Math.max(0.001, (now - tRender) / 1000);
      const eta = (frames - doneFrames) / Math.max(rate, 0.01);
      const est = captured > 0 ? { fps: +rate.toFixed(2), etaSec: Math.round(eta) } : {};
      progress('video', doneFrames / frames, { frames: doneFrames, totalFrames: frames, ...est, message: `video ${doneFrames}/${frames} frames` });
      if (now - lastLog >= 5000) {
        lastLog = now;
        console.log(`  ${doneFrames}/${frames} frames · ${rate.toFixed(1)} fps · ETA ${(eta / 60).toFixed(1)} min`);
      }
    };
    tick(true);
    const worker = async (wi) => {
      if (next >= todo.length) return;
      const wb = await browser();
      let h;
      try {
        h = await openEditHarness(wb.b, site.base, a.slug, projectText, { width: W, height: H });
        while (next < todo.length) {
          checkCancel();
          const s = todo[next++];
          const tmp = `${s.file}.part.mp4`;
          live.partial.add(tmp);
          const enc = startEncoder(x264Args({ fps, crf: CRF, preset: PRESET, tune: TUNE, out: tmp }));
          live.encoders.add(enc);
          let pending = Promise.resolve();
          try {
            for (let n = s.a; n < s.b; n++) {
              checkCancel();
              await h.seek(n / fps);
              const buf = await h.capture();
              await pending;
              pending = enc.write(buf);
              doneFrames++;
              tick();
            }
            await pending;
            await enc.end();
          } catch (e) {
            enc.kill();
            throw e;
          } finally {
            live.encoders.delete(enc);
          }
          const got = videoInfo(tmp).frames;
          if (got !== s.b - s.a) throw new Error(`segment ${path.basename(s.file)}: ${got} frames, expected ${s.b - s.a}`);
          fs.renameSync(tmp, s.file);
          live.partial.delete(tmp);
          writeJson(s.file.replace(/\.mp4$/, '.json'), { key, frames: s.b - s.a, a: s.a, b: s.b, fps, worker: wi, at: new Date().toISOString() });
        }
        errorsSeen.push(...h.errors);
      } finally {
        await h?.close().catch(() => {});
        await wb.close();
      }
    };
    await Promise.all(Array.from({ length: Math.min(WORKERS, todo.length) }, (_, i) => worker(i)));
    tick(true);
    report.captureFps = todo.length ? +(todoFrames / ((Date.now() - tRender) / 1000)).toFixed(2) : null;
    report.pageErrors = [...new Set(errorsSeen)].slice(0, 20);
    if (errorsSeen.length) console.warn(`  warn: ${errorsSeen.length} page errors (first: ${errorsSeen[0]})`);

    // ---- concat + mux
    checkCancel();
    progress('mux', 0, { message: 'muxing' });
    const full = f0 === 0 && f1 === report.totalFrames;
    const name = a.name || `${a.slug}-edit${full ? '' : `-t${+(f0 / fps).toFixed(2)}-${+(f1 / fps).toFixed(2)}`}`;
    const out = a.out ? path.resolve(a.out) : path.join(exportsDir, `${name}.mp4`);
    mkdirp(path.dirname(out));
    const listFile = path.join(segDir, `concat-${process.pid}.txt`);
    fs.writeFileSync(listFile, segs.map((s) => `file '${s.file.replace(/'/g, "'\\''")}'`).join('\n') + '\n');
    const video = `${out}.video.mp4`;
    live.partial.add(video);
    ff(['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-movflags', '+faststart', video]);
    fs.unlinkSync(listFile);
    const vi = videoInfo(video);
    if (vi.frames !== frames) throw new Error(`concat has ${vi.frames} frames, expected ${frames}`);

    const vDur = frames / fps;
    const chapters = chaptersMeta(project.regions, f0 / fps, f1 / fps, fps);
    const args = ['-y', '-v', 'error', '-i', video];
    const maps = ['-map', '0:v'];
    let nIn = 1;
    if (audioFile) {
      args.push('-i', audioFile);
      args.push('-filter_complex', `[${nIn}:a]aresample=48000,apad=whole_dur=${vDur},atrim=end=${vDur}[aout]`);
      maps.push('-map', '[aout]', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000');
      nIn++;
    }
    let metaFile = null;
    if (chapters) {
      metaFile = path.join(workDir, `chapters-${process.pid}.ffmeta`);
      fs.writeFileSync(metaFile, chapters.text);
      args.push('-i', metaFile);
      maps.push('-map_chapters', String(nIn++));
    }
    live.partial.add(out);
    ff([...args, ...maps, '-c:v', 'copy', '-metadata', `title=${project.title ?? a.slug}`, '-movflags', '+faststart', out]);
    fs.unlinkSync(video);
    live.partial.delete(video);
    if (metaFile) fs.rmSync(metaFile, { force: true });
    if (audioFile) fs.rmSync(audioFile, { force: true });
    progress('mux', 1);

    // ---- verify
    progress('verify', 0, { message: 'verifying' });
    const fin = videoInfo(out);
    const checks = {
      frames: fin.frames === frames,
      size: fin.width === W && fin.height === H,
      fps: Math.abs(fin.fps - fps) < 1e-6,
      audio: a.audio === false || fin.audioDuration != null,
      av: fin.audioDuration == null || Math.abs(fin.audioDuration - vDur) <= 1 / fps + 0.03,
      chapters: !chapters || (fin.chapters.count === chapters.count && !fin.chapters.warnings.length),
    };
    live.partial.delete(out);
    const ok = Object.values(checks).every(Boolean);
    const reportFile = out.replace(/\.mp4$/i, '') + '.json';
    Object.assign(report, { out: rel(out), bytes: fs.statSync(out).size, final: fin, checks, ok, wallSec: +((Date.now() - t0Wall) / 1000).toFixed(1) });
    writeJson(reportFile, report);
    // segments are a pure function of the project: drop this export's (an edit invalidates them anyway)
    if (ok && !a['keep-segments']) for (const s of segs) for (const f of [s.file, s.file.replace(/\.mp4$/, '.json')]) fs.rmSync(f, { force: true });

    const outRel = path.relative(P.dir, out).split(path.sep).join('/');
    console.log(
      `→ ${rel(out)}: ${fin.frames} frames ${fin.width}×${fin.height} @ ${fin.fps} fps, ${(fin.duration || 0).toFixed(2)} s, ${(report.bytes / 1e6).toFixed(1)} MB` +
        `${report.captureFps ? `, ${report.captureFps} fps aggregate` : ''}, ${report.wallSec} s wall${ok ? '' : ` — CHECKS FAILED: ${Object.entries(checks).filter(([, v]) => !v).map(([k]) => k).join(',')}`}`,
    );
    if (ok) progress('verify', 1, { phase: 'done', progress: 1, out: outRel.startsWith('..') ? undefined : outRel, checks, frames, totalFrames: frames, message: `exported ${rel(out)}` });
    else {
      progress('verify', 1, { phase: 'error', checks, message: `checks failed: ${Object.entries(checks).filter(([, v]) => !v).map(([k]) => k).join(', ')}` });
      process.exitCode = 1;
    }
  } finally {
    await site.close();
    live.site = null;
  }
}

main().catch(async (e) => {
  if (cancelled) return;
  for (const enc of live.encoders) enc.kill();
  await Promise.allSettled([...live.browsers].map((b) => b.close()));
  for (const f of live.partial) fs.rmSync(f, { force: true });
  if (a.progress) process.stdout.write(`PROGRESS ${JSON.stringify({ phase: 'error', message: String(e.message).split('\n')[0] })}\n`);
  console.error(`error: ${e.message}`);
  process.exit(1);
});
