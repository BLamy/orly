// Film pipeline paths + small fs/json helpers shared by every generator/film/*.mjs stage.
//
//   import { ROOT, filmPaths, readJson, writeJson, sha } from './lib/paths.mjs';
//   const P = filmPaths('neural-net-history');      // P.dir, P.script, P.voice, P.narration.wav, P.app.timeline …
//   const P2 = filmPaths('x', { dir: '/tmp/x' });     // tests / smoke runs outside films/
//
// Tools: FFMPEG / FFPROBE (env overrides, else Homebrew, else PATH).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
export const WORK = path.join(ROOT, '.orly-work');

function tool(name, envName) {
  if (process.env[envName]) return process.env[envName];
  const brew = `/opt/homebrew/bin/${name}`;
  return fs.existsSync(brew) ? brew : name;
}
export const FFMPEG = tool('ffmpeg', 'FFMPEG');
export const FFPROBE = tool('ffprobe', 'FFPROBE');

/** Every path a stage reads or writes for one film (layout: ARCHITECTURE §2). */
export function filmPaths(slug, opts = {}) {
  if (!slug || !/^[a-z0-9_][a-z0-9._-]*$/i.test(slug)) throw new Error(`bad film slug: ${JSON.stringify(slug)}`);
  const dir = path.resolve(opts.dir || path.join(ROOT, 'films', slug));
  const j = (...p) => path.join(dir, ...p);
  return {
    slug,
    dir,
    ledger: j('film.json'),
    brief: j('brief.md'),
    script: j('story', 'script.json'),
    voiceDir: j('voice'),
    voice: j('voice', 'voice.json'),
    lexicon: j('voice', 'lexicon.json'),
    auditions: j('voice', 'auditions'),
    narration: {
      dir: j('narration'),
      cache: j('narration', 'cache'),
      clips: j('narration', 'clips'),
      lines: j('narration', 'lines.json'),
      wav: j('narration', 'narration.wav'),
      stem: j('narration', 'stem.json'),
      timeline: j('narration', 'timeline.json'),
      spend: j('narration', 'ledger.json'),
      solo: j('narration', 'solo.json'),
    },
    score: {
      dir: j('score'),
      cues: j('score', 'cues.json'),
      cueDir: j('score', 'cues'),
      renders: j('score', 'renders'),
      analysis: j('score', 'analysis'),
    },
    mix: {
      dir: j('mix'),
      master: j('mix', 'master.wav'),
      loudness: j('mix', 'loudness.json'),
      chapters: j('mix', 'chapters'),
    },
    qa: { dir: j('qa'), stills: j('qa', 'stills'), sheets: j('qa', 'sheets'), reports: j('qa', 'reports') },
    render: {
      dir: j('render'),
      segments: j('render', 'segments'),
      film: j('render', 'film.mp4'),
      preview: j('render', 'preview.mp4'),
      shots: j('render', 'shots'),
      vtt: j('render', 'film.vtt'),
      chaptersTxt: j('render', 'chapters.txt'),
      ffmeta: j('render', 'chapters.ffmeta'),
    },
    // a film outside films/ (tests, smoke runs) keeps its app copy inside its own dir
    app: {
      dir: opts.dir ? j('app') : path.join(ROOT, 'apps/bookshelf/src/viz/films', slug),
      timeline: opts.dir ? j('app', 'timeline.json') : path.join(ROOT, 'apps/bookshelf/src/viz/films', slug, 'timeline.json'),
    },
    publish: opts.dir
      ? { dir: j('publish', slug), library: j('publish', 'library.json') }
      : { dir: path.join(ROOT, 'public/generated', slug), library: path.join(ROOT, 'public/generated/library.json') },
  };
}

export function readJson(file, fallback) {
  if (!fs.existsSync(file)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`missing ${path.relative(ROOT, file)}`);
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    throw new Error(`cannot parse ${path.relative(ROOT, file)}: ${e.message}`);
  }
}

/** Atomic JSON write (tmp + rename), creating parent folders. */
export function writeJson(file, value, indent = 1) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(value, null, indent) + '\n');
  fs.renameSync(tmp, file);
}

export function writeText(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}

export const sha = (v, n = 16) =>
  crypto.createHash('sha256').update(typeof v === 'string' || Buffer.isBuffer(v) ? v : JSON.stringify(v)).digest('hex').slice(0, n);

export const fileSha = (file, n = 16) => (fs.existsSync(file) ? sha(fs.readFileSync(file), n) : null);

export const rel = (p) => path.relative(ROOT, p) || '.';

export const mkdirp = (d) => fs.mkdirSync(d, { recursive: true });

/** Resolve a path written in a film data file: absolute, else relative to the film dir, else to `alt`. */
export function resolveIn(P, p, alt) {
  if (!p) return null;
  if (path.isAbsolute(p)) return p;
  const a = path.join(P.dir, p);
  if (fs.existsSync(a) || !alt) return a;
  return path.join(alt, p);
}

/** "12.3" -> 12.3, "1:02.5" -> 62.5, "1:00:00" -> 3600 */
export function parseTime(s) {
  if (typeof s === 'number') return s;
  const parts = String(s).trim().split(':').map(Number);
  if (parts.some((x) => !Number.isFinite(x))) throw new Error(`bad time ${s}`);
  return parts.reduce((a, x) => a * 60 + x, 0);
}

export function fmtClock(sec, withMs = false) {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const ss = withMs ? r.toFixed(3).padStart(6, '0') : String(Math.floor(r)).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}
