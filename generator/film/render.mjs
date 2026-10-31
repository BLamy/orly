#!/usr/bin/env node
// Stage 8 — frame-exact render. Headless-shell workers step the harness frame by frame into H.264 segments.
//
//   npm run film:render -- --slug <slug> [--preview] [--shots a,b | --from 60 --to 90] [--workers 6]
//                          [--dev | --base <url> | --static <dir>] [--no-rebuild] [--seg 480] [--resume]
//                          [--crf 18] [--preset medium] [--fps N] [--w 1920 --h 1080] [--no-audio] [--out file.mp4]
//
// Site: default `vite build` + a local static server (lib/site.mjs); --dev uses the running dev server
// (http://127.0.0.1:5199); --static serves a folder (stub harness); --base any URL serving the harness.
// Per frame n: await __film.seek(n / fps) (resolves after paint), CDP Page.captureScreenshot JPEG q95
// optimizeForSpeed, piped to ffmpeg (libx264 -crf 18 -preset medium -tune grain, BT.709 tv, yuv420p).
// Work is split into segments of --seg frames (render/segments/<w>x<h>@<fps>/<from>-<to>.mp4) pulled by
// --workers browsers with the Metal GPU flags; finished segments carry a .json marker keyed by the build
// identity + timeline, so an interrupted build-mode render resumes (dev mode resumes only with --resume).
// Every segment's packet count is verified, segments are joined with the concat demuxer (no re-encode),
// then muxed with mix/master.wav (else narration/narration.wav) as AAC 256k, chapters (render/chapters.ffmeta)
// and WebVTT captions (render/film.vtt as mov_text) for full renders. Final checks: frame count =
// round(duration × fps), audio/video lengths within one frame.
// Outputs: render/film.mp4 · render/preview.mp4 (--preview: 960×540 @ 12 fps, crf 23 veryfast) ·
//          render/shots/<ids>[-preview].mp4 (--shots) · render/render-report.json · film.json stages.render
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, list, num, die, helpText } from './lib/args.mjs';
import { filmPaths, readJson, writeJson, sha, rel, mkdirp, fileSha } from './lib/paths.mjs';
import { stageStart, stageDone, stageFailed } from './lib/ledger.mjs';
import { launchChromium } from './lib/browser.mjs';
import { openSite } from './lib/site.mjs';
import { openHarness } from './lib/harness.mjs';
import { ff, startEncoder, videoInfo, x264Args } from './lib/ffmpeg.mjs';

const a = parseArgs(process.argv.slice(2), {
  boolean: ['preview', 'dev', 'rebuild', 'resume', 'audio', 'help', 'captions'],
  string: ['slug', 'dir', 'shots', 'workers', 'base', 'static', 'seg', 'crf', 'preset', 'fps', 'w', 'h', 'out', 'from', 'to', 'tune'],
  default: { rebuild: true, audio: true, captions: true },
});
if (a.help || !a.slug) {
  console.log(await helpText(import.meta.url));
  process.exit(a.help ? 0 : 2);
}
const P = filmPaths(a.slug, { dir: a.dir });
const PREVIEW = !!a.preview;
const W = num(a.w, PREVIEW ? 960 : 1920);
const H = num(a.h, PREVIEW ? 540 : 1080);
const CRF = num(a.crf, PREVIEW ? 23 : 18);
const PRESET = a.preset || (PREVIEW ? 'veryfast' : 'medium');
const SEG = num(a.seg, 480);
const WORKERS = Math.max(1, num(a.workers, Math.min(6, Math.max(1, Math.floor(os.cpus().length / 2)))));

function frameRanges(info, fps) {
  const total = Math.round(info.duration * fps);
  const shots = list(a.shots);
  let ranges;
  if (shots.length) {
    ranges = shots.map((id) => {
      const s = info.shots.find((x) => x.id === id);
      if (!s) throw new Error(`shot ${id} is not in the harness (${info.shots.map((x) => x.id).join(', ')})`);
      return [Math.round(s.start * fps), Math.round(s.end * fps)];
    });
  } else if (a.from != null || a.to != null) {
    ranges = [[Math.max(0, Math.round(num(a.from, 0) * fps)), Math.min(total, Math.round(num(a.to, info.duration) * fps))]];
  } else ranges = [[0, total]];
  ranges.sort((x, y) => x[0] - y[0]);
  const merged = [];
  for (const r of ranges) {
    if (r[1] <= r[0]) continue;
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([...r]);
  }
  return { total, ranges: merged };
}

function segmentsOf(ranges) {
  // short renders: shrink segments so every worker gets one (boundaries stay a pure function of the args, so resume works)
  const frames = ranges.reduce((q, [s, e]) => q + e - s, 0);
  const seg = Math.max(24, Math.min(SEG, Math.ceil(frames / WORKERS)));
  const segs = [];
  for (const [s, e] of ranges) for (let f = s; f < e; f += seg) segs.push({ a: f, b: Math.min(e, f + seg) });
  return segs;
}

async function main() {
  const t0 = Date.now();
  stageStart(P, 'render', { args: process.argv.slice(2) });
  const site = await openSite({ mode: a.static ? 'static' : a.dev ? 'dev' : 'build', base: a.base, staticDir: a.static, rebuild: a.rebuild !== false });
  const report = { at: new Date().toISOString(), site: site.mode, base: site.base, width: W, height: H, crf: CRF, preset: PRESET, workers: WORKERS };
  try {
    // ---- probe the harness
    const probeBrowser = await launchChromium({ gpu: true });
    let info;
    try {
      const h = await openHarness(probeBrowser, site.base, a.slug, { width: W, height: H });
      info = h.info;
      await h.close();
    } finally {
      await probeBrowser.close();
    }
    const fps = num(a.fps, PREVIEW ? 12 : info.fps);
    const timeline = readJson(P.narration.timeline, null);
    if (timeline && Math.abs(timeline.duration - info.duration) > 1 / info.fps) {
      console.warn(`  warn: harness duration ${info.duration}s != narration/timeline.json ${timeline.duration}s (is the app copy current? run film:timeline)`);
    }
    const { total, ranges } = frameRanges(info, fps);
    const segs = segmentsOf(ranges);
    const frames = segs.reduce((s, x) => s + x.b - x.a, 0);
    const variant = `${W}x${H}@${fps}`;
    const segDir = path.join(P.render.segments, variant);
    mkdirp(segDir);
    const tlSha = fileSha(P.app.timeline) ?? 'none';
    const keyBase = { tl: tlSha, W, H, fps, CRF, PRESET, tune: a.tune ?? 'grain' };
    // build/static mode: identical code + timeline => reuse; dev mode (code may be mid-edit) => only with --resume
    const key = sha({ ...keyBase, site: site.key ?? 'dev' });
    for (const s of segs) {
      s.file = path.join(segDir, `${String(s.a).padStart(6, '0')}-${String(s.b).padStart(6, '0')}.mp4`);
      const m = readJson(s.file.replace(/\.mp4$/, '.json'), null);
      const keyOk = m && m.key === key && (site.mode !== 'dev' || a.resume);
      s.done = !!(keyOk && fs.existsSync(s.file) && m.frames === s.b - s.a && videoInfo(s.file).frames === s.b - s.a);
    }
    const todo = segs.filter((s) => !s.done);
    const todoFrames = todo.reduce((q, x) => q + x.b - x.a, 0);
    console.log(`render ${a.slug}: ${frames} frames (${(frames / fps).toFixed(1)} s of ${info.duration.toFixed(1)} s) @ ${variant}, ${segs.length} segments (${segs.length - todo.length} reused), ${WORKERS} workers, site ${site.mode}`);
    Object.assign(report, { fps, totalFilmFrames: total, frames, ranges, segments: segs.length, reused: segs.length - todo.length });

    // ---- workers
    let next = 0;
    let doneFrames = 0;
    let lastLog = Date.now();
    const tRender = Date.now();
    const pageErrors = [];
    const worker = async (wi) => {
      if (next >= todo.length) return;
      const browser = await launchChromium({ gpu: true });
      let h;
      try {
        h = await openHarness(browser, site.base, a.slug, { width: W, height: H });
        while (next < todo.length) {
          const s = todo[next++];
          const tmp = `${s.file}.part.mp4`;
          const enc = startEncoder(x264Args({ fps, crf: CRF, preset: PRESET, tune: a.tune === 'none' ? null : a.tune ?? 'grain', out: tmp }));
          let pending = Promise.resolve();
          try {
            for (let n = s.a; n < s.b; n++) {
              await h.seek(n / fps);
              const buf = await h.capture({ format: 'jpeg', quality: 95 });
              await pending;
              pending = enc.write(buf);
              doneFrames++;
              if (Date.now() - lastLog > 5000) {
                lastLog = Date.now();
                const rate = doneFrames / ((Date.now() - tRender) / 1000);
                console.log(`  ${doneFrames}/${todoFrames} frames · ${rate.toFixed(1)} fps · ETA ${((todoFrames - doneFrames) / Math.max(rate, 0.01) / 60).toFixed(1)} min`);
              }
            }
            await pending;
            await enc.end();
          } catch (e) {
            enc.kill();
            throw e;
          }
          const got = videoInfo(tmp).frames;
          if (got !== s.b - s.a) throw new Error(`segment ${path.basename(s.file)}: ${got} frames, expected ${s.b - s.a}`);
          fs.renameSync(tmp, s.file);
          writeJson(s.file.replace(/\.mp4$/, '.json'), { key, frames: s.b - s.a, a: s.a, b: s.b, fps, worker: wi, at: new Date().toISOString() });
        }
        pageErrors.push(...h.errors);
      } finally {
        await h?.close().catch(() => {});
        await browser.close();
      }
    };
    await Promise.all(Array.from({ length: Math.min(WORKERS, todo.length) }, (_, i) => worker(i)));
    const renderSec = (Date.now() - tRender) / 1000;
    report.captureFps = todo.length ? +(doneFrames / renderSec).toFixed(2) : null;
    report.pageErrors = [...new Set(pageErrors)].slice(0, 20);
    if (pageErrors.length) console.warn(`  warn: ${pageErrors.length} page errors (first: ${pageErrors[0]})`);

    // ---- concat
    const ids = list(a.shots);
    const out = a.out
      ? path.resolve(a.out)
      : ids.length || a.from != null || a.to != null
        ? path.join(P.render.shots, `${ids.length ? ids.join('+') : `t${num(a.from, 0)}-${num(a.to, info.duration)}`}${PREVIEW ? '-preview' : ''}.mp4`)
        : PREVIEW
          ? P.render.preview
          : P.render.film;
    mkdirp(path.dirname(out));
    const listFile = path.join(segDir, `concat-${process.pid}.txt`);
    fs.writeFileSync(listFile, segs.map((s) => `file '${s.file.replace(/'/g, "'\\''")}'`).join('\n') + '\n');
    const video = `${out}.video.mp4`;
    ff(['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', '-movflags', '+faststart', video]);
    fs.unlinkSync(listFile);
    const vi = videoInfo(video);
    if (vi.frames !== frames) throw new Error(`concat has ${vi.frames} frames, expected ${frames}`);

    // ---- audio mux
    const audioSrc = fs.existsSync(P.mix.master) ? P.mix.master : fs.existsSync(P.narration.wav) ? P.narration.wav : null;
    const full = ranges.length === 1 && ranges[0][0] === 0 && ranges[0][1] === total;
    const vDur = frames / fps;
    if (a.audio !== false && audioSrc) {
      const args = ['-y', '-v', 'error', '-i', video, '-i', audioSrc];
      let maps = ['-map', '0:v'];
      if (full) {
        args.push('-filter_complex', `[1:a]apad=whole_dur=${vDur},atrim=end=${vDur}[aout]`);
        maps.push('-map', '[aout]');
        let nIn = 2;
        if (fs.existsSync(P.render.ffmeta)) {
          args.push('-i', P.render.ffmeta);
          maps.push('-map_chapters', String(nIn++));
        }
        if (a.captions !== false && fs.existsSync(P.render.vtt)) {
          args.push('-i', P.render.vtt);
          // mov_text defaults to a 1/1000000 track timescale, which makes the QT chapter track's timescale the lcm
          // with video/audio (192 MHz): a chapter over ~11 s then overflows its int32 sample duration and the muxer
          // drops the track ('Referenced QT chapter track not found'). Millisecond subtitle timestamps avoid it.
          maps.push('-map', `${nIn++}:s`, '-c:s', 'mov_text', '-bsf:s', 'setts=time_base=1/1000', '-metadata:s:s:0', 'language=eng');
        }
      } else {
        const parts = ranges.map(([s, e], i) => `[1:a]atrim=start=${(s / fps).toFixed(6)}:end=${(e / fps).toFixed(6)},asetpts=PTS-STARTPTS[p${i}]`);
        args.push('-filter_complex', `${parts.join(';')};${ranges.map((_, i) => `[p${i}]`).join('')}concat=n=${ranges.length}:v=0:a=1,apad=whole_dur=${vDur},atrim=end=${vDur}[aout]`);
        maps.push('-map', '[aout]');
      }
      ff([...args, ...maps, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', out]);
      fs.unlinkSync(video);
      report.audio = rel(audioSrc);
      if (audioSrc === P.narration.wav) console.warn('  warn: no mix/master.wav yet — muxed the narration stem');
    } else {
      fs.renameSync(video, out);
      report.audio = null;
      if (a.audio !== false) console.warn('  warn: no audio found (run film:mix or film:timeline)');
    }

    // ---- verify
    const fin = videoInfo(out);
    const checks = {
      frames: fin.frames === frames,
      fullLength: !full || fin.frames === Math.round(info.duration * fps),
      size: fin.width === W && fin.height === H,
      fps: Math.abs(fin.fps - fps) < 1e-6,
      av: fin.audioDuration == null || Math.abs(fin.audioDuration - vDur) <= 1 / fps + 0.03,
      // chapters muxed (full renders with chapters.ffmeta) and readable without container warnings
      chapters: !(full && fs.existsSync(P.render.ffmeta) && a.audio !== false && audioSrc) || (fin.chapters.count > 0 && !fin.chapters.warnings.length),
    };
    Object.assign(report, { out: rel(out), bytes: fs.statSync(out).size, final: fin, checks, wallSec: +((Date.now() - t0) / 1000).toFixed(1) });
    writeJson(path.join(P.render.dir, PREVIEW ? 'render-report-preview.json' : 'render-report.json'), report);
    const ok = Object.values(checks).every(Boolean);
    console.log(
      `→ ${rel(out)}: ${fin.frames} frames ${fin.width}×${fin.height} @ ${fin.fps} fps, ${(fin.duration || 0).toFixed(2)} s, ${(report.bytes / 1e6).toFixed(1)} MB` +
        `${report.captureFps ? `, ${report.captureFps} fps aggregate` : ''}, ${report.wallSec} s wall${ok ? '' : ` — CHECKS FAILED: ${Object.entries(checks).filter(([, v]) => !v).map(([k]) => k).join(',')}`}`,
    );
    stageDone(P, 'render', { ok, out: rel(out), preview: PREVIEW, frames: fin.frames, fps, checks, outputs: [rel(out)] });
    if (!ok) process.exitCode = 1;
  } finally {
    await site.close();
  }
}

main().catch((e) => {
  try {
    stageFailed(P, 'render', e);
  } catch {}
  console.error(`error: ${e.message}`);
  process.exit(1);
});
