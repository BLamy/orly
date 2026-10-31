// ffmpeg / ffprobe helpers for the film pipeline.
//
//   ff(['-i', a, b])                       run ffmpeg synchronously (throws with stderr tail)
//   probe(file) / mediaDuration(file)      ffprobe JSON / container duration (s)
//   videoInfo(file)                        { frames (packet count), fps, width, height, duration, audioDuration }
//   decodeMono(file, sr=48000)             Float32Array mono PCM (any input ffmpeg can read)
//   loudness(file)                         { I, LRA, TP, threshold } EBU R128 (ebur128=peak=true)
//   loudnormMeasure(file, {I,TP,LRA})      first pass of two-pass loudnorm -> measured_* json
//   spectrogram(file, png, {w,h})          showspectrumpic PNG (log freq, 'intensity' colours)
//   startEncoder(args) -> { write(buf), end() }   streaming ffmpeg stdin (backpressure aware)
//   x264Args({ fps, crf, preset, out })    image2pipe(mjpeg) -> libx264 BT.709 tv-range, -tune grain
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { FFMPEG, FFPROBE } from './paths.mjs';

export function ff(args, opts = {}) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', ...args], { maxBuffer: 1 << 30, encoding: opts.encoding ?? 'utf8', input: opts.input });
  if (r.status !== 0) {
    const err = String(r.stderr || '').trim().split('\n').slice(-12).join('\n');
    throw new Error(`ffmpeg failed (${r.status}): ${err}`);
  }
  return r;
}

export function probe(file, extra = []) {
  const r = spawnSync(FFPROBE, ['-v', 'error', '-of', 'json', '-show_format', '-show_streams', ...extra, file], { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`ffprobe ${file}: ${String(r.stderr).trim().slice(0, 400)}`);
  return JSON.parse(r.stdout);
}

export const mediaDuration = (file) => Number(probe(file).format?.duration ?? NaN);

const rate = (s) => {
  const [a, b] = String(s || '0/1').split('/').map(Number);
  return b ? a / b : a;
};

/** Frame count by packet count (fast and equal to frames for H.264 constant-rate segments). */
export function videoInfo(file) {
  const j = probe(file, ['-count_packets']);
  const v = j.streams.find((s) => s.codec_type === 'video');
  const a = j.streams.find((s) => s.codec_type === 'audio');
  return {
    frames: v ? Number(v.nb_read_packets ?? v.nb_frames) : 0,
    fps: v ? rate(v.r_frame_rate) : 0,
    width: v?.width,
    height: v?.height,
    pixFmt: v?.pix_fmt,
    duration: Number(j.format?.duration ?? NaN),
    videoDuration: v ? Number(v.duration ?? NaN) : NaN,
    audioDuration: a ? Number(a.duration ?? NaN) : null,
    audioCodec: a?.codec_name ?? null,
    subtitles: j.streams.filter((s) => s.codec_type === 'subtitle').length,
    chapters: chapterInfo(file),
  };
}

/** Chapters as players see them, plus any container warning (a broken QT chapter track still lists the Nero chapters). */
export function chapterInfo(file) {
  const r = spawnSync(FFPROBE, ['-v', 'warning', '-of', 'json', '-show_chapters', file], { encoding: 'utf8', maxBuffer: 1 << 24 });
  let list = [];
  try {
    list = JSON.parse(r.stdout).chapters || [];
  } catch {}
  const warnings = String(r.stderr || '').split('\n').map((l) => l.replace(/^\[[^\]]*\]\s*/, '').trim()).filter((l) => l && !/^Unsupported codec with id \d+ for input stream/.test(l));
  return { count: list.length, end: list.length ? Number(list[list.length - 1].end_time) : null, titles: list.map((c) => c.tags?.title ?? ''), warnings };
}

export function decodeMono(file, sr = 48000) {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-nostdin', '-i', file, '-ac', '1', '-ar', String(sr), '-f', 'f32le', '-'], { maxBuffer: 2 ** 31 });
  if (r.status !== 0) throw new Error(`decode ${file}: ${String(r.stderr).slice(0, 300)}`);
  const b = r.stdout;
  return new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + (b.byteLength - (b.byteLength % 4))));
}

/** Decode to interleaved-free stereo channels at sr. */
export function decodeStereo(file, sr = 48000) {
  const r = spawnSync(FFMPEG, ['-v', 'error', '-nostdin', '-i', file, '-ac', '2', '-ar', String(sr), '-f', 'f32le', '-'], { maxBuffer: 2 ** 31 });
  if (r.status !== 0) throw new Error(`decode ${file}: ${String(r.stderr).slice(0, 300)}`);
  const all = new Float32Array(r.stdout.buffer.slice(r.stdout.byteOffset, r.stdout.byteOffset + r.stdout.byteLength - (r.stdout.byteLength % 8)));
  const n = all.length / 2;
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    L[i] = all[2 * i];
    R[i] = all[2 * i + 1];
  }
  return [L, R];
}

export function loudness(file, filterPrefix = '') {
  const r = ff(['-nostats', '-i', file, '-af', `${filterPrefix}ebur128=peak=true`, '-f', 'null', '-']);
  const e = r.stderr;
  const tail = e.slice(e.lastIndexOf('Summary:'));
  const n = (re) => {
    const m = tail.match(re);
    return m ? Number(m[1]) : NaN;
  };
  return {
    I: n(/I:\s+(-?[\d.]+|-inf) LUFS/),
    threshold: n(/Threshold:\s+(-?[\d.]+) LUFS/),
    LRA: n(/LRA:\s+(-?[\d.]+) LU/),
    TP: n(/Peak:\s+(-?[\d.]+|-inf) dBFS/),
  };
}

/** Short-term loudness (EBU R128, 3 s window) every 100 ms: [{t, S}]; the file is padded with 3 s of silence so a
 *  short event is measured over a whole window. `from`/`to` (seconds) limit the analysis to a slice. */
export function shortTerm(file, { from = null, to = null } = {}) {
  const tmp = path.join(os.tmpdir(), `shortterm-${process.pid}-${Date.now()}.txt`);
  const cut = from != null ? ['-ss', String(Math.max(0, from)), ...(to != null ? ['-to', String(to)] : [])] : [];
  ff(['-v', 'error', ...cut, '-i', file, '-af', `apad=pad_dur=3,ebur128=metadata=1,ametadata=print:key=lavfi.r128.S:file=${tmp}`, '-f', 'null', '-']);
  const out = [];
  let t = null;
  for (const line of fs.readFileSync(tmp, 'utf8').split('\n')) {
    const pt = line.match(/pts_time:([\d.]+)/);
    if (pt) t = Number(pt[1]);
    const m = line.match(/lavfi\.r128\.S=(\S+)/);
    if (m && t != null) out.push({ t: t + (from ?? 0), S: Number.isFinite(Number(m[1])) ? Number(m[1]) : -120 });
  }
  fs.rmSync(tmp, { force: true });
  return out;
}
export const maxShortTerm = (file, opts) => Math.max(...shortTerm(file, opts).map((q) => q.S));

/** Momentary loudness (EBU R128, 400 ms window) every 100 ms: [{t, M}] with t = window end in seconds. */
export function momentary(file) {
  const tmp = path.join(os.tmpdir(), `momentary-${process.pid}-${Date.now()}.txt`);
  ff(['-v', 'error', '-i', file, '-af', `ebur128=metadata=1,ametadata=print:key=lavfi.r128.M:file=${tmp}`, '-f', 'null', '-']);
  const out = [];
  let t = null;
  for (const line of fs.readFileSync(tmp, 'utf8').split('\n')) {
    const pt = line.match(/pts_time:([\d.]+)/);
    if (pt) t = Number(pt[1]);
    const m = line.match(/lavfi\.r128\.M=(\S+)/);
    if (m && t != null) out.push({ t, M: Number.isFinite(Number(m[1])) ? Number(m[1]) : -120 });
  }
  fs.rmSync(tmp, { force: true });
  return out;
}

export function loudnormMeasure(file, { I = -16, TP = -1.5, LRA = 11 } = {}) {
  const r = ff(['-nostats', '-i', file, '-af', `loudnorm=I=${I}:TP=${TP}:LRA=${LRA}:print_format=json`, '-f', 'null', '-']);
  const m = r.stderr.match(/\{[\s\S]*?"target_offset"[\s\S]*?\}/);
  if (!m) throw new Error('loudnorm: no JSON in output');
  return JSON.parse(m[0]);
}

export function spectrogram(file, png, { w = 1600, h = 600, legend = true } = {}) {
  ff(['-y', '-v', 'error', '-i', file, '-lavfi', `showspectrumpic=s=${w}x${h}:legend=${legend ? 1 : 0}:fscale=log:color=intensity:scale=log`, png]);
}

export function startEncoder(args) {
  const p = spawn(FFMPEG, args, { stdio: ['pipe', 'ignore', 'pipe'] });
  let err = '';
  p.stderr.on('data', (d) => {
    err += d;
    if (err.length > 20000) err = err.slice(-10000);
  });
  const done = new Promise((res, rej) => {
    p.on('error', rej);
    p.on('close', (code) => (code === 0 ? res() : rej(new Error(`ffmpeg ${code}: ${err.trim().slice(-800)}`))));
  });
  done.catch(() => {});
  const write = (buf) => (p.stdin.write(buf) ? Promise.resolve() : new Promise((r) => p.stdin.once('drain', r)));
  const end = () => {
    p.stdin.end();
    return done;
  };
  const kill = () => p.kill('SIGKILL');
  return { write, end, kill, done };
}

/**
 * Chrome's JPEG is full-range BT.601 YCbCr; convert explicitly to BT.709 limited range and tag the
 * stream so players do not guess (measured in .orly-work/probes/render/render-bench.mjs).
 */
export function x264Args({ fps, crf = 18, preset = 'medium', tune = 'grain', out, threads }) {
  return [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-vf', 'scale=in_color_matrix=bt601:in_range=full:out_color_matrix=bt709:out_range=tv,format=yuv420p',
    '-c:v', 'libx264', '-preset', preset, '-crf', String(crf), ...(tune ? ['-tune', tune] : []),
    ...(threads ? ['-threads', String(threads)] : []),
    '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
    '-fps_mode', 'passthrough', '-movflags', '+faststart', out,
  ];
}
