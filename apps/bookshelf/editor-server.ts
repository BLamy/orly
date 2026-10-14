/**
 * Film Editor dev server: the /__editor/* routes (docs/film/EDITOR.md "Server"), as a Vite plugin (apply: 'serve').
 *
 *   GET    /__editor/films                          films that have a timeline -> FilmListEntry[]
 *   GET    /__editor/film/<slug>                    importer bundle -> FilmBundle (timeline, cues, lines, clips, text)
 *   GET    /__editor/project/<slug>                 films/<slug>/edit/project.json (404 when there is none)
 *   PUT    /__editor/project/<slug>                 validate + back up the previous save (keep 30) + atomic write
 *                                                   (drops a pending autosave: the save supersedes it)
 *   PUT    /__editor/project/<slug>?autosave=1      validate + write edit/autosave.json (no backup; project.json untouched)
 *   GET    /__editor/project/<slug>/autosave        the autosave, if any (404 when there is none)
 *   DELETE /__editor/project/<slug>/autosave        discard it (the user declined to recover it)
 *   GET    /__editor/project/<slug>/backups[/<f>]   list backups / fetch one
 *   GET    /__editor/media/<slug>/<path>            stream any file under films/<slug>/ (HTTP Range, HEAD, ETag)
 *   POST   /__editor/import/<slug>[?name=<file>]    upload (raw body or multipart/form-data) into edit/media/ -> ImportedMedia
 *   POST   /__editor/render/<slug>                  RenderRequest -> spawn generator/film/edit-render.mjs (one job per film)
 *   GET    /__editor/render/<slug>/status           RenderStatus (parsed from the job's `PROGRESS {json}` lines)
 *   DELETE /__editor/render/<slug>  (or POST …/cancel)   cancel the running job (SIGTERM, SIGKILL after 8 s)
 *
 * Every request's Host must name this machine (localhost, a loopback or LAN IP literal, or server.allowedHosts),
 * checked before anything else: the routes run ahead of Vite's own host check, and without it a DNS-rebinding page
 * could read films/ and drive writes through the user's browser. Writes also need an Origin from that same list.
 * Every <slug> is checked against the film-slug pattern and every file path is resolved inside films/<slug>/
 * (lexically and through symlinks) before it is touched. Media responses carry nosniff + a sandbox CSP (imported
 * SVGs must never run as pages of the editor's origin). Media probes (duration, rate, channels, size) read WAV
 * headers directly and fall back to ffprobe; results are cached by (path, size, mtime) in memory and in
 * .orly-work/editor/probe-cache.json, so a 231-clip film lists in milliseconds after the first visit.
 * The render job renders against this dev server (--base), so it needs no build; it gets the project as a file
 * (the saved one, or the unsaved in-memory one when the request carries `project`).
 */
import { spawn, execFile, type ChildProcess } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import type {
  FilmBundle,
  FilmBundleTimeline,
  FilmClipFile,
  FilmCue,
  FilmCueRender,
  FilmLine,
  FilmListEntry,
  FilmOnScreenText,
  ImportedMedia,
  RenderPreset,
  RenderRequest,
  RenderStatus,
} from './src/editor/model/types';

export interface EditorServerOptions {
  /** repo root (default: two levels above the Vite root, i.e. the monorepo root) */
  root?: string;
  /** max upload size in bytes (default 4 GiB) */
  maxUpload?: number;
  /** backups kept per film (default 30) */
  keepBackups?: number;
  /** accept writes (save, import, render) from other machines when the dev server listens on the LAN (default false) */
  allowRemoteWrites?: boolean;
}

const SLUG_RE = /^[a-z0-9_][a-z0-9._-]*$/i;
const MAX_PROJECT_BYTES = 64 << 20;
const MAX_RENDER_BODY = 96 << 20;
const PROBE_CONCURRENCY = 8;
const LOG_TAIL = 40;

const CONTENT_TYPES: Record<string, string> = {
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.aif': 'audio/aiff',
  '.aiff': 'audio/aiff',
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.vtt': 'text/vtt',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.ffmeta': 'text/plain; charset=utf-8',
  '.strudel': 'text/plain; charset=utf-8',
};
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif', '.bmp']);
const contentType = (file: string) => CONTENT_TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream';

// ---------------------------------------------------------------------------
// HTTP plumbing
// ---------------------------------------------------------------------------
class HttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function sendJson(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  const text = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': Buffer.byteLength(text), ...headers });
  res.end(text);
}

async function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  const declared = Number(req.headers['content-length'] ?? NaN);
  if (declared > limit) throw new HttpError(413, `body is ${declared} bytes (limit ${limit})`);
  const parts: Buffer[] = [];
  let n = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    n += chunk.length;
    if (n > limit) throw new HttpError(413, `body exceeds ${limit} bytes`);
    parts.push(chunk);
  }
  return Buffer.concat(parts);
}

async function readJsonBody(req: IncomingMessage, limit: number): Promise<unknown> {
  const buf = await readBody(req, limit);
  try {
    return JSON.parse(buf.toString('utf8'));
  } catch (e) {
    throw new HttpError(400, `body is not JSON: ${(e as Error).message}`);
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const optNum = (v: unknown): number | undefined => (finite(v) ? v : undefined);
const round4 = (v: number | undefined): number | undefined => (v == null ? v : Math.round(v * 1e4) / 1e4);

function checkSlug(slug: string): string {
  if (!SLUG_RE.test(slug)) throw new HttpError(400, `bad film slug ${JSON.stringify(slug)}`);
  return slug;
}

/** Resolve `rel` inside `dir`, refusing anything that escapes it (`..`, absolute paths, NUL, symlinks out). */
async function resolveInside(dir: string, rel: string): Promise<string> {
  if (rel.includes('\0')) throw new HttpError(400, 'bad path');
  const abs = path.resolve(dir, rel);
  if (abs !== dir && !abs.startsWith(dir + path.sep)) throw new HttpError(403, 'path escapes the film folder');
  let real: string;
  let realDir: string;
  try {
    [real, realDir] = await Promise.all([fsp.realpath(abs), fsp.realpath(dir)]);
  } catch {
    throw new HttpError(404, `not found: ${rel}`);
  }
  if (real !== realDir && !real.startsWith(realDir + path.sep)) throw new HttpError(403, 'path escapes the film folder');
  return real;
}

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/** the host name of a Host header value ("example.com:5199", "[::1]:5199" → "example.com", "::1"), lower-cased */
export function hostName(host: string): string {
  const h = host.trim().toLowerCase();
  if (h.startsWith('[')) return h.slice(1, h.indexOf(']') > 0 ? h.indexOf(']') : undefined);
  const i = h.lastIndexOf(':');
  return i > 0 && h.indexOf(':') === i ? h.slice(0, i) : h;
}

const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;

/**
 * May a request naming `host` reach the editor routes? (Vite's own rule, applied before Vite applies it.) IP
 * literals are always fine (DNS rebinding needs a domain name), so are localhost and *.localhost; any other name
 * must be listed in server.allowedHosts (exactly, or under a ".example.com" suffix entry), or allowedHosts is true.
 */
export function isAllowedHost(host: string | undefined, allowed: readonly string[] | true | undefined): boolean {
  if (!host) return false;
  if (allowed === true) return true;
  const name = hostName(host);
  if (!name) return false;
  if (name === 'localhost' || name.endsWith('.localhost')) return true;
  if (IPV4.test(name) || name.includes(':')) return true;
  for (const a of allowed ?? []) {
    const e = a.toLowerCase();
    if (e.startsWith('.') ? name === e.slice(1) || name.endsWith(e) : name === e) return true;
  }
  return false;
}

/**
 * Writes (PUT/POST/DELETE) must come from this machine (unless allowRemoteWrites) and, when a browser sends an
 * Origin, from an allowed host: the routes answer before Vite's CORS and host checks, so without this a page on
 * another origin — or a DNS-rebinding page whose Origin and Host it controls — could save over a project, drop
 * files into films/ or start renders through a running dev server.
 */
function checkWriteAllowed(req: IncomingMessage, allowRemote: boolean, allowed: readonly string[] | true | undefined): void {
  if (!allowRemote && !LOOPBACK.has(req.socket.remoteAddress ?? '')) throw new HttpError(403, 'editor writes are only accepted from this machine');
  const origin = req.headers.origin;
  if (origin && origin !== 'null') {
    let host: string;
    try {
      host = new URL(origin).host;
    } catch {
      throw new HttpError(403, 'bad Origin');
    }
    if (!isAllowedHost(host, allowed)) throw new HttpError(403, `cross-origin editor write from ${origin} refused`);
  } else if (origin === 'null') throw new HttpError(403, 'opaque-origin editor write refused');
}

/** sha256 of a file, streamed (uploads may be larger than a Buffer can hold) */
function hashFile(file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const h = crypto.createHash('sha256');
    fs.createReadStream(file)
      .on('error', reject)
      .on('data', (c) => h.update(c))
      .on('end', () => resolve(h.digest('hex')));
  });
}

const posixRel = (from: string, to: string) => path.relative(from, to).split(path.sep).join('/');
const sha16 = (buf: Buffer | string) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 16);

// ---------------------------------------------------------------------------
// Cached JSON reads (timeline / script / cues are re-read only when the file changes)
// ---------------------------------------------------------------------------
const jsonCache = new Map<string, { key: string; value: unknown; sha: string }>();

async function readJsonCached(file: string): Promise<{ value: unknown; sha: string } | null> {
  let st: fs.Stats;
  try {
    st = await fsp.stat(file);
  } catch {
    return null;
  }
  const key = `${st.size}:${st.mtimeMs}`;
  const hit = jsonCache.get(file);
  if (hit && hit.key === key) return hit;
  const buf = await fsp.readFile(file);
  let value: unknown;
  try {
    value = JSON.parse(buf.toString('utf8'));
  } catch (e) {
    throw new HttpError(500, `cannot parse ${path.basename(file)}: ${(e as Error).message}`);
  }
  const entry = { key, value, sha: sha16(buf) };
  jsonCache.set(file, entry);
  return entry;
}

// ---------------------------------------------------------------------------
// Media probing: WAV header fast path, else ffprobe (bounded concurrency), cached by (path, size, mtime)
// ---------------------------------------------------------------------------
export interface ProbeInfo {
  /** seconds; null for stills */
  duration: number | null;
  hasAudio: boolean;
  hasVideo: boolean;
  /** a single-frame image format (png, jpeg, …) */
  still: boolean;
  sampleRate?: number;
  channels?: number;
  width?: number;
  height?: number;
  fps?: number;
}

function toolPath(name: string, env: string): string {
  const fromEnv = process.env[env];
  if (fromEnv) return fromEnv;
  const brew = `/opt/homebrew/bin/${name}`;
  return fs.existsSync(brew) ? brew : name;
}
const FFPROBE = toolPath('ffprobe', 'FFPROBE');

/** Parse a RIFF/WAVE header (PCM or float, WAVE_FORMAT_EXTENSIBLE ok) from the first bytes of a file. */
export function wavHeaderInfo(head: Buffer, fileSize: number): ProbeInfo | null {
  if (head.length < 12 || head.toString('ascii', 0, 4) !== 'RIFF' || head.toString('ascii', 8, 12) !== 'WAVE') return null;
  let o = 12;
  let fmt: { channels: number; sampleRate: number; blockAlign: number } | null = null;
  while (o + 8 <= head.length) {
    const id = head.toString('ascii', o, o + 4);
    const size = head.readUInt32LE(o + 4);
    if (id === 'fmt ' && o + 8 + 16 <= head.length) {
      fmt = { channels: head.readUInt16LE(o + 10), sampleRate: head.readUInt32LE(o + 12), blockAlign: head.readUInt16LE(o + 20) };
    } else if (id === 'data') {
      if (!fmt || !fmt.blockAlign || !fmt.sampleRate) return null;
      const avail = fileSize - (o + 8);
      // streamed WAVs write 0 / 0xffffffff as the data size: the rest of the file is data
      const bytes = size === 0 || size === 0xffffffff || size > avail ? avail : size;
      const frames = Math.floor(bytes / fmt.blockAlign);
      return { duration: frames / fmt.sampleRate, hasAudio: true, hasVideo: false, still: false, sampleRate: fmt.sampleRate, channels: fmt.channels };
    }
    o += 8 + size + (size & 1);
  }
  return null;
}

const rateOf = (s: unknown): number | undefined => {
  const [a, b] = String(s ?? '').split('/').map(Number);
  const r = b ? a / b : a;
  return Number.isFinite(r) && r > 0 ? r : undefined;
};

function ffprobe(file: string): Promise<ProbeInfo> {
  return new Promise((resolve, reject) => {
    execFile(FFPROBE, ['-v', 'error', '-of', 'json', '-show_format', '-show_streams', file], { maxBuffer: 1 << 24 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(`ffprobe ${path.basename(file)}: ${String(stderr || err.message).split(file).join(path.basename(file)).trim().slice(0, 300)}`));
        return;
      }
      try {
        const j = JSON.parse(stdout) as { format?: { duration?: string; format_name?: string }; streams?: Record<string, unknown>[] };
        const streams = j.streams ?? [];
        const disposition = (s: Record<string, unknown>) => (isRecord(s.disposition) ? s.disposition : {});
        // cover art in audio files is a video stream with attached_pic: not picture content
        const v = streams.find((s) => s.codec_type === 'video' && !disposition(s).attached_pic);
        const a = streams.find((s) => s.codec_type === 'audio');
        const fmtName = String(j.format?.format_name ?? '');
        const still = !!v && (/image2|_pipe$|png|webp_pipe|gif/.test(fmtName) || IMAGE_EXT.has(path.extname(file).toLowerCase())) && !a;
        const dur = Number(j.format?.duration ?? (v?.duration as string | undefined) ?? (a?.duration as string | undefined) ?? NaN);
        resolve({
          duration: still ? null : Number.isFinite(dur) ? dur : null,
          hasAudio: !!a,
          hasVideo: !!v && !still,
          still,
          sampleRate: a ? optNum(Number(a.sample_rate)) : undefined,
          channels: a ? optNum(Number(a.channels)) : undefined,
          width: v ? optNum(Number(v.width)) : undefined,
          height: v ? optNum(Number(v.height)) : undefined,
          fps: v && !still ? rateOf(v.avg_frame_rate) ?? rateOf(v.r_frame_rate) : undefined,
        });
      } catch (e) {
        reject(e);
      }
    });
  });
}

function createProber(cacheFile: string) {
  const mem = new Map<string, { key: string; info: ProbeInfo }>();
  let loaded = false;
  let saveTimer: NodeJS.Timeout | null = null;
  let active = 0;
  const waiting: (() => void)[] = [];

  const load = () => {
    if (loaded) return;
    loaded = true;
    try {
      const j = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as Record<string, { key: string; info: ProbeInfo }>;
      for (const [k, v] of Object.entries(j)) if (isRecord(v) && typeof v.key === 'string' && isRecord(v.info)) mem.set(k, v);
    } catch {
      /* no cache yet */
    }
  };
  const scheduleSave = () => {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      try {
        fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
        const tmp = `${cacheFile}.${process.pid}.tmp`;
        fs.writeFileSync(tmp, JSON.stringify(Object.fromEntries(mem)));
        fs.renameSync(tmp, cacheFile);
      } catch {
        /* the cache is an optimisation */
      }
    }, 1500);
    saveTimer.unref?.();
  };
  const slot = async <T>(fn: () => Promise<T>): Promise<T> => {
    if (active >= PROBE_CONCURRENCY) await new Promise<void>((r) => waiting.push(r));
    active++;
    try {
      return await fn();
    } finally {
      active--;
      waiting.shift()?.();
    }
  };

  /** probe one file (absolute path); throws when it is not media ffprobe understands */
  return async function probe(file: string): Promise<ProbeInfo> {
    load();
    const st = await fsp.stat(file);
    const key = `${st.size}:${Math.round(st.mtimeMs)}`;
    const hit = mem.get(file);
    if (hit && hit.key === key) return hit.info;
    let info: ProbeInfo | null = null;
    if (path.extname(file).toLowerCase() === '.wav') {
      const fh = await fsp.open(file, 'r');
      try {
        const head = Buffer.alloc(Math.min(st.size, 64 * 1024));
        await fh.read(head, 0, head.length, 0);
        info = wavHeaderInfo(head, st.size);
      } finally {
        await fh.close();
      }
    }
    if (!info) info = await slot(() => ffprobe(file));
    mem.set(file, { key, info });
    scheduleSave();
    return info;
  };
}

// ---------------------------------------------------------------------------
// Project validation (structural: the server never stores a project the editor could not load)
// ---------------------------------------------------------------------------
const MEDIA_KINDS = new Set(['shot', 'audio', 'image', 'video', 'text', 'color']);
const FADE_CURVES = new Set(['linear', 'fast', 'slow', 'smooth', 'sharp']);

/** Returns a list of problems (empty = valid). JSON-encoded Infinity arrives as null, so media durations may be null. */
export function validateProject(v: unknown, slug: string): string[] {
  const errs: string[] = [];
  const E = (m: string) => {
    if (errs.length < 50) errs.push(m);
  };
  if (!isRecord(v)) return ['project is not an object'];
  if (v.version !== 1) E(`version ${JSON.stringify(v.version)} (expected 1)`);
  if (v.slug !== slug) E(`slug ${JSON.stringify(v.slug)} does not match the route (${slug})`);
  if (typeof v.title !== 'string') E('title must be a string');
  if (!finite(v.fps) || v.fps <= 0 || v.fps > 240) E('fps must be a number in (0, 240]');
  for (const k of ['width', 'height'] as const) if (!Number.isInteger(v[k]) || (v[k] as number) < 16 || (v[k] as number) > 8192) E(`${k} must be an integer in [16, 8192]`);
  if (!Number.isInteger(v.sampleRate) || (v.sampleRate as number) < 8000 || (v.sampleRate as number) > 192000) E('sampleRate must be an integer in [8000, 192000]');
  if (!isRecord(v.master) || !finite(v.master.gainDb) || !finite(v.master.limiterDb) || !finite(v.master.finish)) E('master must be {gainDb, limiterDb, finish}');
  for (const k of ['createdAt', 'updatedAt'] as const) if (typeof v[k] !== 'string') E(`${k} must be an ISO string`);

  const media = isRecord(v.media) ? v.media : null;
  if (!media) E('media must be an object keyed by id');
  else
    for (const [id, m] of Object.entries(media)) {
      if (!isRecord(m)) {
        E(`media ${id}: not an object`);
        continue;
      }
      if (m.id !== id) E(`media ${id}: id field ${JSON.stringify(m.id)} differs from its key`);
      if (typeof m.kind !== 'string' || !MEDIA_KINDS.has(m.kind)) E(`media ${id}: unknown kind ${JSON.stringify(m.kind)}`);
      if (typeof m.label !== 'string') E(`media ${id}: label must be a string`);
      if (!(m.duration === null || (typeof m.duration === 'number' && !Number.isNaN(m.duration)))) E(`media ${id}: duration must be a number (null = Infinity)`);
      if (m.kind === 'shot' && (typeof m.shotId !== 'string' || typeof m.film !== 'string')) E(`media ${id}: shot needs film + shotId`);
      if ((m.kind === 'audio' || m.kind === 'image' || m.kind === 'video') && typeof m.url !== 'string') E(`media ${id}: ${m.kind} needs a url`);
      if (m.kind === 'text' && !isRecord(m.text)) E(`media ${id}: text needs a text spec`);
      if (m.kind === 'color' && typeof m.color !== 'string') E(`media ${id}: color needs a color`);
    }

  const ids = new Set<string>();
  if (!Array.isArray(v.tracks)) E('tracks must be an array');
  else
    v.tracks.forEach((tr: unknown, ti: number) => {
      const where = `track ${ti}`;
      if (!isRecord(tr)) {
        E(`${where}: not an object`);
        return;
      }
      if (typeof tr.id !== 'string' || ids.has(tr.id)) E(`${where}: missing or duplicate id`);
      else ids.add(tr.id);
      if (tr.kind !== 'video' && tr.kind !== 'audio') E(`${where}: kind must be video|audio`);
      if (typeof tr.name !== 'string') E(`${where}: name must be a string`);
      for (const k of ['mute', 'solo', 'lock'] as const) if (typeof tr[k] !== 'boolean') E(`${where}: ${k} must be boolean`);
      if (!finite(tr.height)) E(`${where}: height must be a number`);
      if (!Array.isArray(tr.events)) {
        E(`${where}: events must be an array`);
        return;
      }
      tr.events.forEach((ev: unknown, ei: number) => {
        const w = `${where} event ${ei}`;
        if (!isRecord(ev)) {
          E(`${w}: not an object`);
          return;
        }
        if (typeof ev.id !== 'string' || ids.has(ev.id)) E(`${w}: missing or duplicate id`);
        else ids.add(ev.id);
        if (typeof ev.mediaId !== 'string' || (media && !(ev.mediaId in media))) E(`${w}: mediaId ${JSON.stringify(ev.mediaId)} is not in the media pool`);
        for (const k of ['start', 'srcIn'] as const) if (!finite(ev[k])) E(`${w}: ${k} must be a finite number`);
        if (!finite(ev.length) || ev.length <= 0) E(`${w}: length must be > 0`);
        if (!finite(ev.rate) || ev.rate <= 0) E(`${w}: rate must be > 0`);
        for (const k of ['fadeIn', 'fadeOut'] as const) {
          const f = ev[k];
          if (!isRecord(f) || !finite(f.len) || f.len < 0 || typeof f.curve !== 'string' || !FADE_CURVES.has(f.curve)) E(`${w}: ${k} must be {len >= 0, curve}`);
        }
      });
    });
  for (const k of ['markers', 'regions'] as const) {
    const list = v[k];
    if (!Array.isArray(list)) {
      E(`${k} must be an array`);
      continue;
    }
    list.forEach((m: unknown, i: number) => {
      if (!isRecord(m) || typeof m.id !== 'string' || typeof m.label !== 'string') E(`${k}[${i}]: needs id + label`);
      else if (k === 'markers' ? !finite(m.t) : !finite(m.start) || !finite(m.end) || (m.end as number) < (m.start as number)) E(`${k}[${i}]: bad time`);
    });
  }
  return errs;
}

// ---------------------------------------------------------------------------
// Multipart / raw upload receiver (streams to a temp file; never buffers the whole body)
// ---------------------------------------------------------------------------
interface Received {
  filename: string | null;
  bytes: number;
  sha: string;
}

/** stream an upload body (raw, or the first file part of multipart/form-data) into `tmpFile` (exported for tests) */
export async function receiveUpload(req: IncomingMessage, tmpFile: string, limit: number): Promise<Received> {
  const ctype = String(req.headers['content-type'] ?? '');
  const m = /^multipart\/form-data;.*boundary=(?:"([^"]+)"|([^;\s]+))/i.exec(ctype);
  const hash = crypto.createHash('sha256');
  const fh = await fsp.open(tmpFile, 'w');
  let bytes = 0;
  let filename: string | null = null;
  const emit = async (buf: Buffer) => {
    if (!buf.length) return;
    bytes += buf.length;
    if (bytes > limit) throw new HttpError(413, `upload exceeds ${limit} bytes`);
    hash.update(buf);
    await fh.write(buf);
  };
  try {
    if (!m) {
      for await (const chunk of req as AsyncIterable<Buffer>) await emit(chunk);
    } else {
      // state machine over `\r\n--boundary` delimiters; the first file part is the upload, other parts are skipped
      const delim = Buffer.from(`\r\n--${m[1] ?? m[2]}`);
      const keep = delim.length - 1;
      type State = 'preamble' | 'after' | 'headers' | 'file' | 'skip' | 'done';
      let state: State = 'preamble';
      let gotFile = false;
      let buf: Buffer = Buffer.from('\r\n'); // so the opening boundary matches the CRLF-led delimiter
      const step = async (final: boolean): Promise<boolean> => {
        switch (state) {
          case 'preamble':
          case 'file':
          case 'skip': {
            const i = buf.indexOf(delim);
            if (i < 0) {
              const flush = final ? buf.length : Math.max(0, buf.length - keep);
              if (state === 'file') await emit(buf.subarray(0, flush));
              buf = buf.subarray(flush);
              return false;
            }
            if (state === 'file') {
              await emit(buf.subarray(0, i));
              gotFile = true;
            }
            buf = buf.subarray(i + delim.length);
            state = 'after';
            return true;
          }
          case 'after':
            if (buf.length < 2) return false;
            if (buf[0] === 0x2d && buf[1] === 0x2d) {
              state = 'done';
              return false;
            }
            buf = buf.subarray(buf[0] === 0x0d && buf[1] === 0x0a ? 2 : 0);
            state = 'headers';
            return true;
          case 'headers': {
            const i = buf.indexOf('\r\n\r\n');
            if (i < 0) {
              if (buf.length > 16 * 1024) throw new HttpError(400, 'multipart part headers too long');
              return false;
            }
            const head = buf.subarray(0, i).toString('utf8');
            buf = buf.subarray(i + 4);
            const fn = /filename\*=UTF-8''([^;\r\n]+)/i.exec(head)?.[1] ?? /filename="([^"]*)"/i.exec(head)?.[1] ?? null;
            if (fn != null && !gotFile) {
              filename = fn.includes('%') ? decodeURIComponent(fn) : fn;
              state = 'file';
            } else state = 'skip';
            return true;
          }
          case 'done':
            return false;
        }
      };
      for await (const chunk of req as AsyncIterable<Buffer>) {
        buf = buf.length ? Buffer.concat([buf, chunk]) : chunk;
        while (await step(false));
      }
      while (await step(true));
      if (!gotFile) throw new HttpError(400, 'multipart body has no file part');
    }
  } finally {
    await fh.close();
  }
  if (!bytes) throw new HttpError(400, 'empty upload');
  return { filename, bytes, sha: hash.digest('hex') };
}

/** a safe file name for edit/media/: keeps letters, digits, dot, dash, underscore (exported for tests) */
export function safeName(name: string): string {
  const base = path.basename(name.replace(/\\/g, '/'));
  const ext = path.extname(base).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const stem = base
    .slice(0, base.length - path.extname(base).length)
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 80);
  return `${stem || 'media'}${ext}`;
}

// ---------------------------------------------------------------------------
// Render jobs
// ---------------------------------------------------------------------------
interface Job {
  slug: string;
  proc: ChildProcess;
  status: RenderStatus;
  log: string[];
  cancel: boolean;
  /** temp project file to delete when the job ends */
  tmpProject: string | null;
  killTimer: NodeJS.Timeout | null;
}

const PRESETS = new Set<RenderPreset>(['final', 'preview', 'draft']);

/** cancel (SIGTERM: edit-render closes its browsers and encoders) or force-stop (SIGKILL) a job */
function signalJob(job: Job, signal: NodeJS.Signals): void {
  try {
    job.proc.kill(signal);
  } catch {
    /* already gone */
  }
}

/**
 * Render jobs live on globalThis, not in the plugin instance: Vite re-instantiates plugins when vite.config.ts or
 * this file changes, and a running export (and its status) must survive that. Jobs share the dev server's process
 * group, so a Ctrl+C in the terminal reaches them too; a programmatic exit stops them here.
 */
const JOBS_KEY = '__orlyEditorRenderJobs';
function jobRegistry(): Map<string, Job> {
  const g = globalThis as typeof globalThis & { [JOBS_KEY]?: Map<string, Job> };
  let jobs = g[JOBS_KEY];
  if (!jobs) {
    const created = new Map<string, Job>();
    g[JOBS_KEY] = jobs = created;
    process.once('exit', () => {
      for (const job of created.values()) if (job.status.state === 'running') signalJob(job, 'SIGTERM');
    });
  }
  return jobs;
}

function renderArgs(slug: string, projectFile: string, base: string, r: RenderRequest): string[] {
  const args = ['--slug', slug, '--project', projectFile, '--base', base, '--progress'];
  const num = (flag: string, v: unknown, ok: (n: number) => boolean) => {
    if (v == null) return;
    if (!finite(v) || !ok(v)) throw new HttpError(400, `bad ${flag.slice(2)}: ${JSON.stringify(v)}`);
    args.push(flag, String(v));
  };
  num('--from', r.from, (n) => n >= 0);
  num('--to', r.to, (n) => n > (r.from ?? 0));
  num('--w', r.width, (n) => Number.isInteger(n) && n >= 16 && n <= 8192 && n % 2 === 0);
  num('--h', r.height, (n) => Number.isInteger(n) && n >= 16 && n <= 8192 && n % 2 === 0);
  num('--fps', r.fps, (n) => n > 0 && n <= 120);
  num('--workers', r.workers, (n) => Number.isInteger(n) && n >= 1 && n <= 16);
  if (r.preset != null) {
    if (!PRESETS.has(r.preset)) throw new HttpError(400, `unknown preset ${JSON.stringify(r.preset)} (final | preview | draft)`);
    args.push('--quality', r.preset);
  }
  if (r.name != null) {
    if (typeof r.name !== 'string' || !/^[\w.-]{1,120}$/.test(r.name)) throw new HttpError(400, 'name must match [A-Za-z0-9_.-]{1,120}');
    args.push('--name', r.name);
  }
  return args;
}

// ---------------------------------------------------------------------------
// The plugin
// ---------------------------------------------------------------------------
export function editorServer(opts: EditorServerOptions = {}): Plugin {
  let ROOT = '';
  let FILMS = '';
  let probe: (file: string) => Promise<ProbeInfo> = () => Promise.reject(new Error('editor server not configured'));
  const maxUpload = opts.maxUpload ?? 4 * 1024 ** 3;
  const keepBackups = opts.keepBackups ?? 30;
  const jobs = jobRegistry();
  /** per-film write queue, so overlapping saves land in order */
  const writes = new Map<string, Promise<unknown>>();
  let devServer: ViteDevServer | null = null;

  const filmDir = (slug: string) => path.join(FILMS, checkSlug(slug));
  const editDir = (slug: string) => path.join(filmDir(slug), 'edit');
  const projectFile = (slug: string) => path.join(editDir(slug), 'project.json');
  const autosaveFile = (slug: string) => path.join(editDir(slug), 'autosave.json');
  const mediaUrl = (slug: string, rel: string) => `/__editor/media/${slug}/${rel.split('/').map(encodeURIComponent).join('/')}`;

  const serialize = <T>(slug: string, fn: () => Promise<T>): Promise<T> => {
    const prev = writes.get(slug) ?? Promise.resolve();
    const next = prev.catch(() => {}).then(fn);
    writes.set(slug, next);
    return next;
  };

  async function requireFilm(slug: string): Promise<string> {
    const dir = filmDir(slug);
    if (!fs.existsSync(path.join(dir, 'narration', 'timeline.json'))) throw new HttpError(404, `no film "${slug}" with a narration/timeline.json`);
    return dir;
  }

  async function filmTitle(dir: string, slug: string): Promise<string> {
    const s = await readJsonCached(path.join(dir, 'story', 'script.json')).catch(() => null);
    return s && isRecord(s.value) && typeof s.value.title === 'string' ? s.value.title : slug;
  }

  // ---- GET /__editor/films
  async function listFilms(): Promise<FilmListEntry[]> {
    const out: FilmListEntry[] = [];
    let names: string[] = [];
    try {
      names = await fsp.readdir(FILMS);
    } catch {
      return out;
    }
    for (const slug of names.sort()) {
      if (!SLUG_RE.test(slug)) continue;
      const dir = path.join(FILMS, slug);
      const tl = await readJsonCached(path.join(dir, 'narration', 'timeline.json')).catch(() => null);
      if (!tl || !isRecord(tl.value)) continue;
      const proj = await readJsonCached(path.join(dir, 'edit', 'project.json')).catch(() => null);
      out.push({
        slug,
        title: await filmTitle(dir, slug),
        duration: optNum(tl.value.duration) ?? 0,
        fps: optNum(tl.value.fps) ?? 24,
        hasProject: !!proj,
        projectUpdatedAt: proj && isRecord(proj.value) && typeof proj.value.updatedAt === 'string' ? proj.value.updatedAt : null,
      });
    }
    return out;
  }

  // ---- GET /__editor/film/<slug>
  async function filmBundle(slug: string): Promise<FilmBundle> {
    const dir = await requireFilm(slug);
    const warnings: string[] = [];
    const tl = await readJsonCached(path.join(dir, 'narration', 'timeline.json'));
    if (!tl || !isRecord(tl.value) || !Array.isArray(tl.value.shots)) throw new HttpError(500, 'narration/timeline.json has no shots');
    const timeline = tl.value as unknown as FilmBundleTimeline;

    // the reel paints from the app copy: say so when the two clocks differ
    const app = await readJsonCached(path.join(ROOT, 'apps/bookshelf/src/viz/films', slug, 'timeline.json')).catch(() => null);
    if (!app) warnings.push(`no app timeline copy (apps/bookshelf/src/viz/films/${slug}/timeline.json): shots cannot be painted (run film:timeline)`);
    else if (isRecord(app.value) && app.value.duration !== timeline.duration)
      warnings.push(`app timeline copy is ${String(app.value.duration)} s, narration/timeline.json is ${timeline.duration} s (run film:timeline)`);

    const cuesJ = await readJsonCached(path.join(dir, 'score', 'cues.json')).catch(() => null);
    const cues: FilmCue[] = Array.isArray(cuesJ?.value)
      ? (cuesJ.value as unknown[]).filter(isRecord).flatMap((c): FilmCue[] => {
          if (typeof c.id !== 'string' || !finite(c.start) || !finite(c.end)) return [];
          const duck =
            typeof c.duck === 'boolean'
              ? c.duck
              : isRecord(c.duck)
                ? { depthDb: optNum(c.duck.depthDb), attack: optNum(c.duck.attack), release: optNum(c.duck.release), ratio: optNum(c.duck.ratio), threshold: optNum(c.duck.threshold) }
                : undefined;
          return [
            {
              id: c.id,
              start: c.start,
              end: c.end,
              render: typeof c.render === 'string' ? c.render : undefined,
              gainDb: optNum(c.gainDb),
              fadeIn: optNum(c.fadeIn),
              fadeOut: optNum(c.fadeOut),
              duck,
              tail: optNum(c.tail),
              lastStrike: optNum(c.lastStrike),
              fadeAfterStrike: optNum(c.fadeAfterStrike),
              shots: Array.isArray(c.shots) ? c.shots.filter((s): s is string => typeof s === 'string') : undefined,
              mood: typeof c.mood === 'string' ? c.mood : undefined,
            },
          ];
        })
      : [];

    const linesJ = await readJsonCached(path.join(dir, 'narration', 'lines.json')).catch(() => null);
    const lines: Record<string, FilmLine> = {};
    if (linesJ && isRecord(linesJ.value) && isRecord(linesJ.value.lines))
      for (const [id, l] of Object.entries(linesJ.value.lines)) {
        if (!isRecord(l)) continue;
        lines[id] = {
          shot: String(l.shot ?? ''),
          chapter: String(l.chapter ?? ''),
          text: String(l.text ?? ''),
          clip: typeof l.clip === 'string' ? l.clip : undefined,
          duration: optNum(l.duration),
          speechStart: optNum(l.speechStart),
          speechEnd: optNum(l.speechEnd),
          words: Array.isArray(l.words)
            ? l.words.filter(isRecord).flatMap((w) => (typeof w.w === 'string' && finite(w.start) && finite(w.end) ? [{ w: w.w, start: w.start, end: w.end }] : []))
            : undefined,
        };
      }
    else warnings.push('narration/lines.json missing: narration clips cannot be placed');

    const stemJ = await readJsonCached(path.join(dir, 'narration', 'stem.json')).catch(() => null);
    let stem: FilmBundle['stem'] = null;
    if (stemJ && isRecord(stemJ.value)) {
      const sv = stemJ.value;
      const rides: NonNullable<FilmBundle['stem']>['rides'] = {};
      if (isRecord(sv.rides))
        for (const [id, r] of Object.entries(sv.rides)) {
          if (!isRecord(r)) continue;
          const words = isRecord(r.words) ? Object.fromEntries(Object.entries(r.words).filter((e): e is [string, number] => finite(e[1]))) : undefined;
          rides[id] = { clipGainDb: optNum(r.clipGainDb), rideDb: optNum(r.rideDb), trimDb: optNum(r.trimDb), words };
        }
      stem = {
        gainDb: optNum(sv.gainDb),
        compressor: isRecord(sv.compressor) ? { grDb: optNum(sv.compressor.grDb) } : null,
        peakStage: isRecord(sv.peakStage) ? { speechGrDb: optNum(sv.peakStage.speechGrDb) } : null,
        rides,
      };
    }
    const loudJ = await readJsonCached(path.join(dir, 'mix', 'loudness.json')).catch(() => null);
    const loudness: FilmBundle['loudness'] =
      loudJ && isRecord(loudJ.value) && isRecord(loudJ.value.loudnorm) ? { loudnorm: { gainDb: optNum(loudJ.value.loudnorm.gainDb) } } : null;

    // clips on disk, probed (the importer needs real file lengths for trims)
    const clipsDir = path.join(dir, 'narration', 'clips');
    const clipNames = (await fsp.readdir(clipsDir).catch(() => [] as string[])).filter((f) => /\.(wav|mp3|m4a|flac)$/i.test(f)).sort();
    const clips: FilmClipFile[] = (
      await Promise.all(
        clipNames.map(async (f): Promise<FilmClipFile | null> => {
          const rel = `narration/clips/${f}`;
          try {
            const p = await probe(path.join(clipsDir, f));
            return { lineId: f.replace(/\.[^.]+$/, ''), path: rel, url: mediaUrl(slug, rel), duration: p.duration ?? 0, sampleRate: p.sampleRate, channels: p.channels };
          } catch (e) {
            warnings.push(`clip ${rel}: ${(e as Error).message}`);
            return null;
          }
        }),
      )
    ).filter((c): c is FilmClipFile => !!c);
    const haveClip = new Set(clips.map((c) => c.lineId));
    const missing = Object.keys(lines).filter((id) => !haveClip.has(id));
    if (missing.length) warnings.push(`${missing.length} line clip(s) missing in narration/clips: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ', …' : ''}`);

    const renders: FilmCueRender[] = (
      await Promise.all(
        cues.map(async (c): Promise<FilmCueRender | null> => {
          const rel = c.render ?? `score/renders/${c.id}.wav`;
          let abs: string;
          try {
            abs = await resolveInside(dir, rel);
          } catch {
            warnings.push(`cue ${c.id}: render ${rel} missing`);
            return null;
          }
          try {
            const p = await probe(abs);
            const meta = await readJsonCached(abs.replace(/\.[^.]+$/, '.json')).catch(() => null);
            const mv = meta && isRecord(meta.value) ? meta.value : {};
            return {
              cueId: c.id,
              path: posixRel(dir, abs),
              url: mediaUrl(slug, posixRel(dir, abs)),
              duration: p.duration ?? 0,
              sampleRate: p.sampleRate,
              channels: p.channels,
              bodySeconds: optNum(mv.bodySeconds),
              tailSeconds: optNum(mv.tailSeconds),
            };
          } catch (e) {
            warnings.push(`cue ${c.id}: ${(e as Error).message}`);
            return null;
          }
        }),
      )
    ).filter((r): r is FilmCueRender => !!r);

    // on-screen text from the script, placed on the film clock through the timeline's beats
    const text: FilmOnScreenText[] = [];
    const script = await readJsonCached(path.join(dir, 'story', 'script.json')).catch(() => null);
    const shotTimes = new Map(timeline.shots.map((s) => [s.id, s]));
    if (script && isRecord(script.value) && Array.isArray(script.value.chapters))
      for (const ch of script.value.chapters.filter(isRecord))
        for (const sh of (Array.isArray(ch.shots) ? ch.shots : []).filter(isRecord)) {
          if (typeof sh.id !== 'string' || !Array.isArray(sh.onScreenText)) continue;
          const T = shotTimes.get(sh.id);
          for (const o of sh.onScreenText.filter(isRecord)) {
            if (typeof o.text !== 'string') continue;
            const beat = typeof o.beat === 'string' ? o.beat : undefined;
            const until = typeof o.until === 'string' ? o.until : undefined;
            const at = (b: string | undefined) => (T && b && finite(T.beats?.[b]) ? T.start + T.beats[b] : undefined);
            text.push({
              shotId: sh.id,
              kind: typeof o.kind === 'string' ? o.kind : 'label',
              text: o.text,
              beat,
              until,
              start: T ? round4(beat ? at(beat) : T.start) : undefined,
              end: T ? round4(until ? at(until) : T.end) : undefined,
            });
          }
        }

    const masterAbs = path.join(dir, 'mix', 'master.wav');
    let master: FilmBundle['master'] = null;
    if (fs.existsSync(masterAbs)) {
      const p = await probe(masterAbs).catch(() => null);
      if (p) master = { path: 'mix/master.wav', url: mediaUrl(slug, 'mix/master.wav'), duration: p.duration ?? 0 };
    }

    return {
      slug,
      title: await filmTitle(dir, slug),
      fps: timeline.fps,
      duration: timeline.duration,
      timeline,
      cues,
      lines,
      stem,
      loudness,
      clips,
      renders,
      text,
      master,
      sha: { timeline: tl.sha, cues: cuesJ?.sha ?? null },
      warnings,
    };
  }

  // ---- project load / save / backups
  async function saveProject(slug: string, body: unknown): Promise<{ ok: true; savedAt: string; bytes: number; backup: string | null }> {
    await requireFilm(slug);
    const errs = validateProject(body, slug);
    if (errs.length) throw new HttpError(422, `invalid project:\n- ${errs.join('\n- ')}`);
    const text = JSON.stringify(body, null, 1) + '\n';
    return serialize(slug, async () => {
      const file = projectFile(slug);
      const bdir = path.join(editDir(slug), 'backups');
      await fsp.mkdir(bdir, { recursive: true });
      let backup: string | null = null;
      // back up the save being replaced (skipped when unchanged), then write atomically
      const prev = await fsp.readFile(file, 'utf8').catch(() => null);
      if (prev != null && prev !== text) {
        backup = `${new Date().toISOString().replace(/:/g, '-')}.json`;
        await fsp.writeFile(path.join(bdir, backup), prev);
        const all = (await fsp.readdir(bdir)).filter((f) => f.endsWith('.json')).sort();
        await Promise.all(all.slice(0, Math.max(0, all.length - keepBackups)).map((f) => fsp.rm(path.join(bdir, f), { force: true })));
      }
      const tmp = `${file}.${process.pid}.tmp`;
      await fsp.writeFile(tmp, text);
      await fsp.rename(tmp, file);
      // a real save supersedes the crash-recovery copy
      await fsp.rm(autosaveFile(slug), { force: true });
      return { ok: true as const, savedAt: new Date().toISOString(), bytes: Buffer.byteLength(text), backup: backup ? `edit/backups/${backup}` : null };
    });
  }

  /** autosave (Vegas's crash-recovery file): edit/autosave.json, atomically; project.json and the backups untouched */
  async function autosaveProject(slug: string, body: unknown): Promise<{ ok: true; savedAt: string; bytes: number }> {
    await requireFilm(slug);
    const errs = validateProject(body, slug);
    if (errs.length) throw new HttpError(422, `invalid project:\n- ${errs.join('\n- ')}`);
    const text = JSON.stringify(body) + '\n';
    return serialize(slug, async () => {
      const file = autosaveFile(slug);
      await fsp.mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await fsp.writeFile(tmp, text);
      await fsp.rename(tmp, file);
      return { ok: true as const, savedAt: new Date().toISOString(), bytes: Buffer.byteLength(text) };
    });
  }

  async function sendFileJson(res: ServerResponse, file: string, notFound: string): Promise<void> {
    let text: string;
    try {
      text = await fsp.readFile(file, 'utf8');
    } catch {
      throw new HttpError(404, notFound);
    }
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': Buffer.byteLength(text) });
    res.end(text);
  }

  // ---- media streaming with Range
  async function streamMedia(req: IncomingMessage, res: ServerResponse, slug: string, rel: string): Promise<void> {
    const dir = await requireFilm(slug);
    const file = await resolveInside(dir, rel);
    const st = await fsp.stat(file);
    if (!st.isFile()) throw new HttpError(404, `not a file: ${rel}`);
    const etag = `W/"${st.size.toString(16)}-${Math.round(st.mtimeMs).toString(16)}"`;
    const base: Record<string, string> = {
      'content-type': contentType(file),
      'accept-ranges': 'bytes',
      etag,
      'last-modified': st.mtime.toUTCString(),
      'cache-control': 'no-cache',
      // films/<slug>/ files are served from the editor's own origin: never sniff a type, never run one as a page
      'x-content-type-options': 'nosniff',
      'content-security-policy': 'sandbox',
    };
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, base);
      res.end();
      return;
    }
    let start = 0;
    let end = st.size - 1;
    let status = 200;
    const range = req.headers.range;
    // a stale If-Range validator means "send the whole file"
    if (range && (!req.headers['if-range'] || req.headers['if-range'] === etag)) {
      const m = /^bytes=(\d*)-(\d*)(?:,.*)?$/.exec(range.trim());
      if (!m || (m[1] === '' && m[2] === '')) {
        res.writeHead(416, { ...base, 'content-range': `bytes */${st.size}` });
        res.end();
        return;
      }
      if (m[1] === '') {
        start = Math.max(0, st.size - Number(m[2])); // suffix range: the last N bytes
      } else {
        start = Number(m[1]);
        if (m[2] !== '') end = Math.min(end, Number(m[2]));
      }
      if (start >= st.size || start > end) {
        res.writeHead(416, { ...base, 'content-range': `bytes */${st.size}` });
        res.end();
        return;
      }
      status = 206;
      base['content-range'] = `bytes ${start}-${end}/${st.size}`;
    }
    res.writeHead(status, { ...base, 'content-length': String(st.size ? end - start + 1 : 0) });
    if (req.method === 'HEAD' || !st.size) {
      res.end();
      return;
    }
    await new Promise<void>((resolve) => {
      const s = fs.createReadStream(file, { start, end });
      s.on('error', () => {
        res.destroy();
        resolve();
      });
      res.on('close', () => {
        s.destroy();
        resolve();
      });
      s.pipe(res);
    });
  }

  // ---- POST /__editor/import/<slug>
  async function importMedia(req: IncomingMessage, slug: string, query: URLSearchParams): Promise<ImportedMedia> {
    await requireFilm(slug);
    const mdir = path.join(editDir(slug), 'media');
    await fsp.mkdir(mdir, { recursive: true });
    const tmp = path.join(mdir, `.upload-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    let moved = false;
    try {
      const got = await receiveUpload(req, tmp, maxUpload);
      const headerName = req.headers['x-file-name'];
      let fromHeader: string | null = null;
      if (typeof headerName === 'string') {
        try {
          fromHeader = decodeURIComponent(headerName);
        } catch {
          throw new HttpError(400, 'X-File-Name is not valid percent-encoding');
        }
      }
      const given = query.get('name') ?? fromHeader ?? got.filename;
      if (!given) throw new HttpError(400, 'no file name (pass ?name=<file>, an X-File-Name header, or a multipart filename)');
      let name = safeName(given);
      if (!path.extname(name)) throw new HttpError(415, `"${given}" has no extension; cannot tell what kind of media it is`);

      // same name + same bytes = the same file (re-import is idempotent); otherwise suffix -2, -3, …
      const stem = name.slice(0, -path.extname(name).length);
      for (let i = 2; ; i++) {
        const dest = path.join(mdir, name);
        if (!fs.existsSync(dest)) {
          await fsp.rename(tmp, dest);
          moved = true;
          break;
        }
        const same = (await fsp.stat(dest)).size === got.bytes && (await hashFile(dest)) === got.sha;
        if (same) break;
        name = `${stem}-${i}${path.extname(name)}`;
      }
      const abs = path.join(mdir, name);
      const rel = posixRel(filmDir(slug), abs);
      let info: ProbeInfo;
      try {
        info = await probe(abs);
      } catch (e) {
        if (moved) await fsp.rm(abs, { force: true });
        throw new HttpError(415, `not a media file ffprobe can read: ${(e as Error).message}`);
      }
      const id = `imp-${got.sha.slice(0, 12)}`;
      const label = stem;
      const tags = { file: rel, bytes: String(got.bytes), imported: new Date().toISOString() };
      const url = mediaUrl(slug, rel);
      if (info.still || (IMAGE_EXT.has(path.extname(name).toLowerCase()) && !info.hasAudio)) {
        if (!info.width || !info.height) throw new HttpError(415, `${name}: image without dimensions`);
        // JSON has no Infinity: null on the wire = an unbounded still (see types.ts wire notes)
        return { kind: 'image', id, label, url, width: info.width, height: info.height, duration: null as unknown as number, tags };
      }
      if (info.hasVideo) {
        if (!info.width || !info.height || info.duration == null) throw new HttpError(415, `${name}: video without size or duration`);
        return { kind: 'video', id, label, url, width: info.width, height: info.height, fps: info.fps, hasAudio: info.hasAudio, duration: info.duration, tags };
      }
      if (info.hasAudio && info.duration != null) {
        return { kind: 'audio', id, label, url, role: 'other', duration: info.duration, sampleRate: info.sampleRate, channels: info.channels, tags };
      }
      throw new HttpError(415, `${name}: no audio or video streams`);
    } finally {
      if (!moved) await fsp.rm(tmp, { force: true });
    }
  }

  // ---- render jobs
  function devBase(): string {
    const url = devServer?.resolvedUrls?.local[0];
    if (url) return url.replace(/\/$/, '');
    const addr = devServer?.httpServer?.address();
    const port = addr && typeof addr === 'object' ? addr.port : (devServer?.config.server.port ?? 5173);
    return `http://127.0.0.1:${port}`;
  }

  async function startRender(slug: string, body: unknown): Promise<RenderStatus> {
    await requireFilm(slug);
    if (!isRecord(body)) throw new HttpError(400, 'render request must be a JSON object');
    const running = jobs.get(slug);
    if (running && running.status.state === 'running') throw new HttpError(409, `a render of ${slug} is already running (cancel it first)`);
    const r = body as unknown as RenderRequest;

    // the project to render: the unsaved in-memory one if sent, else the saved file
    let file = projectFile(slug);
    let tmpProject: string | null = null;
    if (r.project != null) {
      const errs = validateProject(r.project, slug);
      if (errs.length) throw new HttpError(422, `invalid project:\n- ${errs.join('\n- ')}`);
      const work = path.join(editDir(slug), 'exports', '.work');
      await fsp.mkdir(work, { recursive: true });
      tmpProject = path.join(work, `project-${Date.now()}.json`);
      await fsp.writeFile(tmpProject, JSON.stringify(r.project));
      file = tmpProject;
    } else if (!fs.existsSync(file)) throw new HttpError(404, `no saved project for ${slug}; save first or send {project}`);

    let args: string[];
    try {
      args = renderArgs(slug, file, devBase(), r);
    } catch (e) {
      if (tmpProject) await fsp.rm(tmpProject, { force: true });
      throw e;
    }
    const proc = spawn(process.execPath, [path.join(ROOT, 'generator/film/edit-render.mjs'), ...args], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' },
    });
    const job: Job = {
      slug,
      proc,
      cancel: false,
      tmpProject,
      killTimer: null,
      log: [],
      status: { state: 'running', phase: 'queued', progress: 0, startedAt: new Date().toISOString() },
    };
    jobs.set(slug, job);
    const onLine = (line: string) => {
      if (line.startsWith('PROGRESS ')) {
        try {
          const p = JSON.parse(line.slice(9)) as Partial<RenderStatus>;
          if (isRecord(p)) {
            const { state: _ignored, log: _log, ...rest } = p;
            job.status = { ...job.status, ...rest };
            if (typeof p.out === 'string' && !p.url) job.status.url = mediaUrl(slug, p.out);
          }
        } catch {
          /* a malformed progress line is just log */
        }
        return;
      }
      if (!line.trim()) return;
      job.log.push(line.slice(0, 500));
      if (job.log.length > LOG_TAIL) job.log.splice(0, job.log.length - LOG_TAIL);
    };
    const pipeLines = (stream: NodeJS.ReadableStream | null) => {
      if (!stream) return;
      let rest = '';
      stream.setEncoding('utf8');
      stream.on('data', (d: string) => {
        rest += d;
        let i: number;
        while ((i = rest.indexOf('\n')) >= 0) {
          onLine(rest.slice(0, i).replace(/\r$/, ''));
          rest = rest.slice(i + 1);
        }
      });
      stream.on('end', () => rest && onLine(rest));
    };
    pipeLines(proc.stdout);
    pipeLines(proc.stderr);
    proc.on('error', (e) => job.log.push(`spawn failed: ${e.message}`));
    proc.on('close', (code, signal) => {
      if (job.killTimer) clearTimeout(job.killTimer);
      const endedAt = new Date().toISOString();
      if (job.cancel) job.status = { ...job.status, state: 'cancelled', phase: 'cancelled', message: 'cancelled', endedAt };
      else if (code === 0 && job.status.phase === 'done') job.status = { ...job.status, state: 'done', progress: 1, endedAt };
      else {
        const why = job.status.phase === 'error' && job.status.message ? job.status.message : job.log.filter((l) => /error|fail/i.test(l)).at(-1) ?? job.log.at(-1) ?? `exit ${code ?? signal}`;
        job.status = { ...job.status, state: 'error', phase: 'error', message: why, endedAt };
      }
      if (job.tmpProject) fsp.rm(job.tmpProject, { force: true }).catch(() => {});
    });
    return { ...job.status, log: [] };
  }

  function cancelRender(slug: string): RenderStatus {
    checkSlug(slug);
    const job = jobs.get(slug);
    if (!job || job.status.state !== 'running') throw new HttpError(409, `no render of ${slug} is running`);
    job.cancel = true;
    job.status = { ...job.status, message: 'cancelling…' };
    signalJob(job, 'SIGTERM');
    job.killTimer = setTimeout(() => signalJob(job, 'SIGKILL'), 8000);
    job.killTimer.unref?.();
    return { ...job.status, log: job.log.slice(-10) };
  }

  function renderStatus(slug: string): RenderStatus {
    checkSlug(slug);
    const job = jobs.get(slug);
    if (!job) return { state: 'idle', phase: 'queued', progress: 0 };
    return { ...job.status, log: job.log.slice() };
  }

  // ---- router
  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const allowed = devServer?.config.server.allowedHosts;
    if (!isAllowedHost(req.headers.host, allowed)) throw new HttpError(403, `host ${JSON.stringify(req.headers.host ?? '')} is not allowed (add it to server.allowedHosts)`);
    const url = new URL(req.url ?? '/', 'http://editor.local');
    const parts = url.pathname.slice('/__editor/'.length).split('/');
    let seg: string[];
    try {
      seg = parts.map((p) => decodeURIComponent(p));
    } catch {
      throw new HttpError(400, 'bad URL encoding');
    }
    const [route, slug = '', ...rest] = seg;
    const method = req.method ?? 'GET';
    if (method !== 'GET' && method !== 'HEAD') checkWriteAllowed(req, !!opts.allowRemoteWrites, allowed);
    const only = (...ms: string[]) => {
      if (!ms.includes(method)) throw new HttpError(405, `${method} not allowed on /__editor/${route}`);
    };

    switch (route) {
      case 'films':
        only('GET');
        return sendJson(res, 200, await listFilms());
      case 'film':
        only('GET');
        return sendJson(res, 200, await filmBundle(checkSlug(slug)));
      case 'project': {
        checkSlug(slug);
        if (rest[0] === 'backups') {
          only('GET');
          const bdir = path.join(editDir(slug), 'backups');
          if (rest[1]) {
            if (!/^[\w.-]+\.json$/.test(rest[1])) throw new HttpError(400, 'bad backup name');
            return sendFileJson(res, path.join(bdir, rest[1]), `no backup ${rest[1]}`);
          }
          const names = (await fsp.readdir(bdir).catch(() => [] as string[])).filter((f) => f.endsWith('.json')).sort().reverse();
          const list = await Promise.all(names.map(async (name) => ({ name, bytes: (await fsp.stat(path.join(bdir, name))).size, at: name.replace(/\.json$/, '').replace(/T(\d\d)-(\d\d)-/, 'T$1:$2:') })));
          return sendJson(res, 200, list);
        }
        if (rest[0] === 'autosave' && rest.length === 1) {
          only('GET', 'DELETE');
          if (method === 'GET') return sendFileJson(res, autosaveFile(slug), `no autosave for ${slug}`);
          await serialize(slug, () => fsp.rm(autosaveFile(slug), { force: true }));
          return sendJson(res, 200, { ok: true });
        }
        if (rest.length) throw new HttpError(404, 'unknown project route');
        only('GET', 'PUT');
        if (method === 'GET') return sendFileJson(res, projectFile(slug), `no project for ${slug} yet (import the film)`);
        const body = await readJsonBody(req, MAX_PROJECT_BYTES);
        if (url.searchParams.get('autosave') === '1') return sendJson(res, 200, await autosaveProject(slug, body));
        return sendJson(res, 200, await saveProject(slug, body));
      }
      case 'media': {
        only('GET', 'HEAD');
        const rel = rest.join('/');
        if (!rel) throw new HttpError(400, 'media path required');
        return streamMedia(req, res, checkSlug(slug), rel);
      }
      case 'import':
        only('POST');
        return sendJson(res, 201, await importMedia(req, checkSlug(slug), url.searchParams));
      case 'render': {
        checkSlug(slug);
        if (rest[0] === 'status') {
          only('GET');
          return sendJson(res, 200, renderStatus(slug));
        }
        if (rest[0] === 'cancel') {
          only('POST');
          return sendJson(res, 200, cancelRender(slug));
        }
        if (rest.length) throw new HttpError(404, 'unknown render route');
        only('POST', 'DELETE');
        if (method === 'DELETE') return sendJson(res, 200, cancelRender(slug));
        return sendJson(res, 202, await startRender(slug, await readJsonBody(req, MAX_RENDER_BODY)));
      }
      default:
        throw new HttpError(404, `unknown editor route /__editor/${route}`);
    }
  }

  return {
    name: 'orly-film-editor-server',
    apply: 'serve',
    configureServer(server) {
      devServer = server;
      ROOT = path.resolve(opts.root ?? path.resolve(server.config.root, '../..'));
      FILMS = path.join(ROOT, 'films');
      probe = createProber(path.join(ROOT, '.orly-work', 'editor', 'probe-cache.json'));
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/__editor/')) return next();
        handle(req, res).catch((e: unknown) => {
          const status = e instanceof HttpError ? e.status : 500;
          if (status >= 500) server.config.logger.error(`[editor] ${req.method} ${req.url}: ${(e as Error).stack ?? String(e)}`);
          if (res.headersSent) res.destroy();
          else sendJson(res, status, { error: (e as Error).message ?? String(e) });
        });
      });
    },
  };
}
