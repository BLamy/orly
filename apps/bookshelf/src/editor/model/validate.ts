/**
 * Structural validation and repair of a loaded project (project.json, a pasted or uploaded file, a backup).
 *
 *   const r = validateProject(json)            // repair on (default): r.project is a safe, normalized copy
 *   if (!r.ok) show(r.issues)                  // ok = no error left unrepaired
 *   const r2 = validateProject(json, { repair: false })   // check only: r2.project is json itself when ok
 *   assertProject(json)                        // -> Project, or throws with every error
 *
 * Every problem is an issue {path, message, severity, repaired}. Repairs keep as much as possible: missing
 * scalars get defaults; a media `duration` of null (JSON cannot carry Infinity) becomes Infinity for stills and
 * generators; bad keyframes, FX and duck sources are dropped; events whose medium is missing or of the wrong kind
 * for their track are dropped; duplicate ids are renamed; events are sorted. Unrepairable: a root that is not an
 * object, a newer PROJECT_VERSION, a missing slug. A repaired project is passed through ops.normalize().
 */
import type {
  AudioFx,
  AudioFxKind,
  BlendMode,
  EditEvent,
  Fade,
  FadeCurve,
  Keyframe,
  Marker,
  Media,
  PanCrop,
  Project,
  ProjectView,
  Region,
  TextSpec,
  Track,
  TransitionKind,
  VideoFx,
  VideoFxKind,
} from './types.ts';
import { PROJECT_VERSION } from './types.ts';
import { normalize } from './ops.ts';

export interface ValidationIssue {
  /** JSON path, e.g. tracks[1].events[4].fadeIn */
  path: string;
  message: string;
  severity: 'error' | 'warning';
  /** true when repair fixed it */
  repaired: boolean;
}

export interface ValidationResult {
  /** no error left unrepaired */
  ok: boolean;
  /** repaired copy (repair on), the input itself (repair off and ok), or null */
  project: Project | null;
  issues: ValidationIssue[];
}

const FADE_CURVES = new Set<FadeCurve>(['linear', 'fast', 'slow', 'smooth', 'sharp']);
const KEY_CURVES = new Set<NonNullable<Keyframe['curve']>>(['linear', 'hold', 'smooth', 'fast', 'slow']);
const VIDEO_FX = new Set<VideoFxKind>(['brightness', 'contrast', 'saturation', 'hue', 'blur', 'sepia', 'grayscale', 'invert', 'vignette', 'filmFinish']);
const AUDIO_FX = new Set<AudioFxKind>(['eq3', 'compressor', 'highpass', 'lowpass', 'reverb', 'delay']);
const TRANSITIONS = new Set<TransitionKind>(['crossfade', 'cut', 'iris', 'inkBleed', 'paperWipe', 'fadeBlack', 'lampChange', 'wipeLeft', 'wipeRight', 'push', 'dipWhite']);
const BLENDS = new Set<BlendMode>(['normal', 'screen', 'multiply', 'add', 'overlay', 'lighten', 'darken']);
const ROLES = new Set(['narration', 'music', 'sfx', 'other'] as const);
const ALIGNS = new Set(['left', 'center', 'right'] as const);

type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => !!v && typeof v === 'object' && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';

/** issue collector + typed field readers that repair as they read */
class Ctx {
  issues: ValidationIssue[] = [];
  readonly repair: boolean;
  constructor(repair: boolean) {
    this.repair = repair;
  }
  error(path: string, message: string, repaired = this.repair) {
    this.issues.push({ path, message, severity: 'error', repaired });
  }
  warn(path: string, message: string) {
    this.issues.push({ path, message, severity: 'warning', repaired: this.repair });
  }
  num(o: Rec, k: string, path: string, def: number, check: (v: number) => boolean = () => true, label = 'a number'): number {
    const v = o[k];
    if (isNum(v) && check(v)) return v;
    this.error(`${path}.${k}`, `expected ${label}, got ${JSON.stringify(v)}; using ${def}`);
    return def;
  }
  optNum(o: Rec, k: string, path: string, check: (v: number) => boolean = () => true): number | undefined {
    const v = o[k];
    if (v === undefined) return undefined;
    if (isNum(v) && check(v)) return v;
    this.warn(`${path}.${k}`, `invalid value ${JSON.stringify(v)} dropped`);
    return undefined;
  }
  str(o: Rec, k: string, path: string, def: string): string {
    const v = o[k];
    if (isStr(v)) return v;
    this.error(`${path}.${k}`, `expected a string, got ${JSON.stringify(v)}; using "${def}"`);
    return def;
  }
  optStr(o: Rec, k: string, path: string): string | undefined {
    const v = o[k];
    if (v === undefined) return undefined;
    if (isStr(v)) return v;
    this.warn(`${path}.${k}`, `invalid value ${JSON.stringify(v)} dropped`);
    return undefined;
  }
  bool(o: Rec, k: string, path: string, def: boolean): boolean {
    const v = o[k];
    if (typeof v === 'boolean') return v;
    if (v !== undefined) this.warn(`${path}.${k}`, `expected a boolean, got ${JSON.stringify(v)}; using ${def}`);
    else this.warn(`${path}.${k}`, `missing; using ${def}`);
    return def;
  }
}

/** unique-id registry across one project (all object kinds share one namespace) */
class Ids {
  private seen = new Set<string>();
  private ctx: Ctx;
  constructor(ctx: Ctx) {
    this.ctx = ctx;
  }
  take(raw: unknown, path: string, prefix: string): string {
    let id = isStr(raw) && raw ? raw : '';
    if (!id) {
      id = this.fresh(prefix);
      this.ctx.error(`${path}.id`, `missing id; assigned ${id}`);
    } else if (this.seen.has(id)) {
      const n = this.fresh(id);
      this.ctx.error(`${path}.id`, `duplicate id "${id}"; renamed ${n}`);
      id = n;
    }
    this.seen.add(id);
    return id;
  }
  /** reserve an id without checking (media keys are checked separately) */
  reserve(id: string) {
    this.seen.add(id);
  }
  private fresh(base: string): string {
    let i = 2;
    while (this.seen.has(`${base}~${i}`)) i++;
    return `${base}~${i}`;
  }
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------
function keyframes(ctx: Ctx, raw: unknown, path: string): Keyframe[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    ctx.warn(path, 'expected keyframes; dropped');
    return undefined;
  }
  const out: Keyframe[] = [];
  raw.forEach((k, i) => {
    if (!isRec(k) || !isNum(k.t) || !isNum(k.v)) {
      ctx.warn(`${path}[${i}]`, 'bad keyframe dropped');
      return;
    }
    const curve = isStr(k.curve) && KEY_CURVES.has(k.curve as NonNullable<Keyframe['curve']>) ? (k.curve as Keyframe['curve']) : undefined;
    out.push({ t: k.t, v: k.v, ...(curve ? { curve } : {}) });
  });
  return out.sort((a, b) => a.t - b.t);
}

function panCropKeys(ctx: Ctx, raw: unknown, path: string): Keyframe<PanCrop>[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    ctx.warn(path, 'expected Pan/Crop keyframes; dropped');
    return undefined;
  }
  const out: Keyframe<PanCrop>[] = [];
  raw.forEach((k, i) => {
    const v = isRec(k) ? k.v : undefined;
    if (!isRec(k) || !isNum(k.t) || !isRec(v) || !isNum(v.x) || !isNum(v.y) || !isNum(v.zoom) || !(v.zoom > 0)) {
      ctx.warn(`${path}[${i}]`, 'bad Pan/Crop keyframe dropped');
      return;
    }
    const curve = isStr(k.curve) && KEY_CURVES.has(k.curve as NonNullable<Keyframe['curve']>) ? (k.curve as Keyframe['curve']) : undefined;
    out.push({ t: k.t, v: { x: v.x, y: v.y, zoom: v.zoom, rot: isNum(v.rot) ? v.rot : 0 }, ...(curve ? { curve } : {}) });
  });
  return out.length ? out.sort((a, b) => a.t - b.t) : undefined;
}

function fade(ctx: Ctx, raw: unknown, path: string): Fade {
  if (isRec(raw) && isNum(raw.len) && raw.len >= 0 && isStr(raw.curve) && FADE_CURVES.has(raw.curve as FadeCurve)) return { len: raw.len, curve: raw.curve as FadeCurve };
  if (isRec(raw) && isNum(raw.len) && raw.len >= 0) {
    ctx.warn(`${path}.curve`, `unknown fade curve ${JSON.stringify(raw.curve)}; using smooth`);
    return { len: raw.len, curve: 'smooth' };
  }
  if (raw !== undefined) ctx.warn(path, 'bad fade; using none');
  return { len: 0, curve: 'smooth' };
}

function videoFxList(ctx: Ctx, ids: Ids, raw: unknown, path: string): VideoFx[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    ctx.warn(path, 'expected a video FX list; dropped');
    return undefined;
  }
  const out: VideoFx[] = [];
  raw.forEach((f, i) => {
    const p = `${path}[${i}]`;
    if (!isRec(f) || !isStr(f.kind) || !VIDEO_FX.has(f.kind as VideoFxKind)) {
      ctx.warn(p, 'unknown video FX dropped');
      return;
    }
    const value = Array.isArray(f.value) ? (keyframes(ctx, f.value, `${p}.value`) ?? []) : isNum(f.value) ? f.value : undefined;
    if (value === undefined) {
      ctx.warn(`${p}.value`, 'bad FX value; FX dropped');
      return;
    }
    out.push({ id: ids.take(f.id, p, 'fx'), kind: f.kind as VideoFxKind, enabled: f.enabled !== false, value });
  });
  return out.length ? out : undefined;
}

function audioFxList(ctx: Ctx, ids: Ids, raw: unknown, path: string): AudioFx[] | undefined {
  if (raw === undefined) return undefined;
  if (!Array.isArray(raw)) {
    ctx.warn(path, 'expected an audio FX list; dropped');
    return undefined;
  }
  const out: AudioFx[] = [];
  raw.forEach((f, i) => {
    const p = `${path}[${i}]`;
    if (!isRec(f) || !isStr(f.kind) || !AUDIO_FX.has(f.kind as AudioFxKind)) {
      ctx.warn(p, 'unknown audio FX dropped');
      return;
    }
    const params: Record<string, number> = {};
    if (isRec(f.params)) for (const [k, v] of Object.entries(f.params)) if (isNum(v)) params[k] = v;
    out.push({ id: ids.take(f.id, p, 'fx'), kind: f.kind as AudioFxKind, enabled: f.enabled !== false, params });
  });
  return out.length ? out : undefined;
}

function textSpec(ctx: Ctx, raw: unknown, path: string): TextSpec {
  const o = isRec(raw) ? raw : {};
  if (!isRec(raw)) ctx.error(path, 'missing text spec; using defaults');
  const align = isStr(o.align) && ALIGNS.has(o.align as TextSpec['align']) ? (o.align as TextSpec['align']) : 'center';
  const spec: TextSpec = {
    content: ctx.str(o, 'content', path, ''),
    font: ctx.str(o, 'font', path, 'Georgia, serif'),
    size: ctx.num(o, 'size', path, 64, (v) => v > 0),
    color: ctx.str(o, 'color', path, '#ffffff'),
    align,
    x: ctx.num(o, 'x', path, 640),
    y: ctx.num(o, 'y', path, 360),
  };
  // optional styling passes through when it has the right primitive shape
  if (isNum(o.weight)) spec.weight = o.weight;
  if (typeof o.italic === 'boolean') spec.italic = o.italic;
  if (isNum(o.typeOn)) spec.typeOn = o.typeOn;
  if (isRec(o.outline) && isStr(o.outline.color) && isNum(o.outline.width)) spec.outline = { color: o.outline.color, width: o.outline.width };
  if (isRec(o.shadow) && isStr(o.shadow.color) && isNum(o.shadow.blur) && isNum(o.shadow.dx) && isNum(o.shadow.dy))
    spec.shadow = { color: o.shadow.color, blur: o.shadow.blur, dx: o.shadow.dx, dy: o.shadow.dy };
  if (isRec(o.plate) && isStr(o.plate.color) && isNum(o.plate.padding) && isNum(o.plate.radius))
    spec.plate = { color: o.plate.color, padding: o.plate.padding, radius: o.plate.radius };
  return spec;
}

/** media duration: finite > 0, or Infinity for stills/generators (null on the wire) */
function duration(ctx: Ctx, o: Rec, path: string, unbounded: boolean): number {
  const v = o.duration;
  if (isNum(v) && v > 0) return v;
  if (unbounded && (v === null || v === undefined || v === Infinity || v === 'Infinity')) return Infinity;
  if (unbounded) {
    ctx.warn(`${path}.duration`, `bad duration ${JSON.stringify(v)}; using Infinity`);
    return Infinity;
  }
  ctx.error(`${path}.duration`, `expected a positive length, got ${JSON.stringify(v)}; using 1`);
  return 1;
}

function media(ctx: Ctx, key: string, raw: unknown, path: string): Media | null {
  if (!isRec(raw) || !isStr(raw.kind)) {
    ctx.error(path, 'not a media entry; dropped');
    return null;
  }
  if (raw.id !== key) ctx.error(`${path}.id`, `id ${JSON.stringify(raw.id)} differs from its key; using "${key}"`);
  const label = isStr(raw.label) ? raw.label : key;
  const tags: Record<string, string> | undefined = isRec(raw.tags)
    ? Object.fromEntries(Object.entries(raw.tags).filter((e): e is [string, string] => isStr(e[1])))
    : undefined;
  const base = { id: key, label, ...(tags ? { tags } : {}) };
  switch (raw.kind) {
    case 'shot':
      if (!isStr(raw.shotId) || !raw.shotId) {
        ctx.error(`${path}.shotId`, 'shot media without a shotId; dropped');
        return null;
      }
      return { ...base, kind: 'shot', film: ctx.str(raw, 'film', path, ''), shotId: raw.shotId, duration: duration(ctx, raw, path, false) };
    case 'audio': {
      if (!isStr(raw.url)) {
        ctx.error(`${path}.url`, 'audio media without a url; dropped');
        return null;
      }
      const role = isStr(raw.role) && ROLES.has(raw.role as 'other') ? (raw.role as 'narration' | 'music' | 'sfx' | 'other') : 'other';
      if (role !== raw.role) ctx.warn(`${path}.role`, `unknown role ${JSON.stringify(raw.role)}; using other`);
      const m: Media = { ...base, kind: 'audio', url: raw.url, role, duration: duration(ctx, raw, path, false) };
      if (isRec(raw.speech) && isNum(raw.speech.start) && isNum(raw.speech.end) && raw.speech.end >= raw.speech.start)
        m.speech = { start: raw.speech.start, end: raw.speech.end };
      if (Array.isArray(raw.words)) {
        const words = raw.words.filter((w): w is { w: string; start: number; end: number } => isRec(w) && isStr(w.w) && isNum(w.start) && isNum(w.end));
        if (words.length !== raw.words.length) ctx.warn(`${path}.words`, `${raw.words.length - words.length} bad word timing(s) dropped`);
        if (words.length) m.words = words.map((w) => ({ w: w.w, start: w.start, end: w.end }));
      }
      const sr = ctx.optNum(raw, 'sampleRate', path, (v) => v > 0);
      const ch = ctx.optNum(raw, 'channels', path, (v) => v > 0);
      if (sr !== undefined) m.sampleRate = sr;
      if (ch !== undefined) m.channels = ch;
      return m;
    }
    case 'image':
    case 'video': {
      if (!isStr(raw.url)) {
        ctx.error(`${path}.url`, `${raw.kind} media without a url; dropped`);
        return null;
      }
      const width = ctx.num(raw, 'width', path, 1920, (v) => v > 0);
      const height = ctx.num(raw, 'height', path, 1080, (v) => v > 0);
      if (raw.kind === 'image') return { ...base, kind: 'image', url: raw.url, width, height, duration: duration(ctx, raw, path, true) };
      const fps = ctx.optNum(raw, 'fps', path, (v) => v > 0);
      return {
        ...base,
        kind: 'video',
        url: raw.url,
        width,
        height,
        duration: duration(ctx, raw, path, false),
        ...(fps !== undefined ? { fps } : {}),
        ...(typeof raw.hasAudio === 'boolean' ? { hasAudio: raw.hasAudio } : {}),
      };
    }
    case 'text':
      return { ...base, kind: 'text', text: textSpec(ctx, raw.text, `${path}.text`), duration: duration(ctx, raw, path, true) };
    case 'color':
      return { ...base, kind: 'color', color: ctx.str(raw, 'color', path, '#000000'), duration: duration(ctx, raw, path, true) };
    default:
      ctx.error(`${path}.kind`, `unknown media kind ${JSON.stringify(raw.kind)}; dropped`);
      return null;
  }
}

function envelopes(ctx: Ctx, raw: unknown, path: string): EditEvent['envelopes'] | undefined {
  if (raw === undefined) return undefined;
  if (!isRec(raw)) {
    ctx.warn(path, 'expected envelopes; dropped');
    return undefined;
  }
  const out: NonNullable<EditEvent['envelopes']> = {};
  for (const k of ['volume', 'pan', 'opacity'] as const) {
    const keys = keyframes(ctx, raw[k], `${path}.${k}`);
    if (keys?.length) out[k] = keys;
  }
  return Object.keys(out).length ? out : undefined;
}

function event(ctx: Ctx, ids: Ids, raw: unknown, path: string, track: { kind: Track['kind'] }, pool: Record<string, Media>): EditEvent | null {
  if (!isRec(raw)) {
    ctx.error(path, 'not an event; dropped');
    return null;
  }
  const m = isStr(raw.mediaId) ? pool[raw.mediaId] : undefined;
  if (!m) {
    ctx.error(`${path}.mediaId`, `unknown media ${JSON.stringify(raw.mediaId)}; event dropped`);
    return null;
  }
  const fits = track.kind === 'audio' ? m.kind === 'audio' || (m.kind === 'video' && m.hasAudio === true) : m.kind !== 'audio';
  if (!fits) {
    ctx.error(`${path}.mediaId`, `${m.kind} media on a ${track.kind} track; event dropped`);
    return null;
  }
  if (!isNum(raw.length) || raw.length <= 0) {
    ctx.error(`${path}.length`, `expected a positive length, got ${JSON.stringify(raw.length)}; event dropped`);
    return null;
  }
  const e: EditEvent = {
    id: ids.take(raw.id, path, 'e'),
    mediaId: m.id,
    start: ctx.num(raw, 'start', path, 0),
    length: raw.length,
    srcIn: ctx.num(raw, 'srcIn', path, 0),
    rate: ctx.num(raw, 'rate', path, 1, (v) => v > 0, 'a positive rate'),
    fadeIn: fade(ctx, raw.fadeIn, `${path}.fadeIn`),
    fadeOut: fade(ctx, raw.fadeOut, `${path}.fadeOut`),
  };
  if (raw.transition !== undefined) {
    const k = isRec(raw.transition) ? raw.transition.kind : undefined;
    if (isStr(k) && TRANSITIONS.has(k as TransitionKind)) e.transition = { kind: k as TransitionKind };
    else {
      ctx.warn(`${path}.transition`, `unknown transition ${JSON.stringify(k)}; using crossfade`);
      e.transition = { kind: 'crossfade' };
    }
  }
  if (raw.mute === true) e.mute = true;
  if (raw.lock === true) e.lock = true;
  const color = ctx.optStr(raw, 'color', path);
  const label = ctx.optStr(raw, 'label', path);
  const group = ctx.optStr(raw, 'group', path);
  const gainDb = ctx.optNum(raw, 'gainDb', path);
  const opacity = ctx.optNum(raw, 'opacity', path);
  if (color) e.color = color;
  if (label) e.label = label;
  if (group) e.group = group;
  if (gainDb !== undefined) e.gainDb = gainDb;
  if (opacity !== undefined) e.opacity = opacity;
  const env = envelopes(ctx, raw.envelopes, `${path}.envelopes`);
  if (env) e.envelopes = env;
  const pc = panCropKeys(ctx, raw.panCrop, `${path}.panCrop`);
  if (pc) e.panCrop = pc;
  const vfx = videoFxList(ctx, ids, raw.videoFx, `${path}.videoFx`);
  const afx = audioFxList(ctx, ids, raw.audioFx, `${path}.audioFx`);
  if (vfx) e.videoFx = vfx;
  if (afx) e.audioFx = afx;
  if (raw.text !== undefined) {
    if (isRec(raw.text)) e.text = raw.text as Partial<TextSpec>;
    else ctx.warn(`${path}.text`, 'bad text override dropped');
  }
  return e;
}

function track(ctx: Ctx, ids: Ids, raw: unknown, path: string, pool: Record<string, Media>): Track | null {
  if (!isRec(raw)) {
    ctx.error(path, 'not a track; dropped');
    return null;
  }
  const kind = raw.kind === 'video' || raw.kind === 'audio' ? raw.kind : null;
  if (!kind) {
    ctx.error(`${path}.kind`, `unknown track kind ${JSON.stringify(raw.kind)}; track dropped`);
    return null;
  }
  const id = ids.take(raw.id, path, kind === 'video' ? 'tv' : 'ta');
  const t: Track = {
    id,
    kind,
    name: ctx.str(raw, 'name', path, id),
    events: [],
    mute: ctx.bool(raw, 'mute', path, false),
    solo: ctx.bool(raw, 'solo', path, false),
    lock: ctx.bool(raw, 'lock', path, false),
    height: ctx.num(raw, 'height', path, kind === 'video' ? 64 : 56, (v) => v > 0),
  };
  if (Array.isArray(raw.events)) {
    raw.events.forEach((r, i) => {
      const e = event(ctx, ids, r, `${path}.events[${i}]`, t, pool);
      if (e) t.events.push(e);
    });
  } else ctx.error(`${path}.events`, 'expected an event list; using none');
  const color = ctx.optStr(raw, 'color', path);
  const gainDb = ctx.optNum(raw, 'gainDb', path);
  const pan = ctx.optNum(raw, 'pan', path, (v) => v >= -1 && v <= 1);
  const opacity = ctx.optNum(raw, 'opacity', path, (v) => v >= 0 && v <= 1);
  if (color) t.color = color;
  if (gainDb !== undefined) t.gainDb = gainDb;
  if (pan !== undefined) t.pan = pan;
  if (opacity !== undefined) t.opacity = opacity;
  if (raw.blend !== undefined) {
    if (isStr(raw.blend) && BLENDS.has(raw.blend as BlendMode)) t.blend = raw.blend as BlendMode;
    else ctx.warn(`${path}.blend`, `unknown blend ${JSON.stringify(raw.blend)} dropped`);
  }
  const env = envelopes(ctx, raw.envelopes, `${path}.envelopes`);
  if (env) t.envelopes = env;
  const vfx = videoFxList(ctx, ids, raw.videoFx, `${path}.videoFx`);
  const afx = audioFxList(ctx, ids, raw.audioFx, `${path}.audioFx`);
  if (vfx) t.videoFx = vfx;
  if (afx) t.audioFx = afx;
  if (raw.duck !== undefined) {
    const d = raw.duck;
    if (isRec(d) && Array.isArray(d.by)) {
      t.duck = {
        by: d.by.filter(isStr),
        depthDb: isNum(d.depthDb) ? d.depthDb : 6,
        attack: isNum(d.attack) && d.attack >= 0 ? d.attack : 0.02,
        release: isNum(d.release) && d.release >= 0 ? d.release : 0.5,
        ...(isNum(d.threshold) ? { threshold: d.threshold } : {}),
      };
    } else ctx.warn(`${path}.duck`, 'bad duck settings dropped');
  }
  // sorted by start (stable)
  for (let i = 1; i < t.events.length; i++)
    if (t.events[i].start < t.events[i - 1].start) {
      ctx.warn(`${path}.events`, 'events out of order; sorted');
      t.events.sort((a, b) => a.start - b.start);
      break;
    }
  return t;
}

// ---------------------------------------------------------------------------
// Project
// ---------------------------------------------------------------------------
function build(ctx: Ctx, raw: Rec): Project | null {
  const now = new Date().toISOString();
  if (raw.version !== PROJECT_VERSION) {
    if (isNum(raw.version) && raw.version > PROJECT_VERSION) {
      ctx.error('version', `project version ${raw.version} is newer than this editor (${PROJECT_VERSION})`, false);
      return null;
    }
    ctx.error('version', `expected version ${PROJECT_VERSION}, got ${JSON.stringify(raw.version)}`);
  }
  if (!isStr(raw.slug) || !raw.slug) {
    ctx.error('slug', 'missing film slug', false);
    return null;
  }
  const ids = new Ids(ctx);
  const pool: Record<string, Media> = {};
  if (isRec(raw.media)) {
    for (const [k, v] of Object.entries(raw.media)) {
      const m = media(ctx, k, v, `media.${k}`);
      if (m) {
        pool[k] = m;
        ids.reserve(k);
      }
    }
  } else ctx.error('media', 'expected a media pool; using an empty one');
  const tracks: Track[] = [];
  if (Array.isArray(raw.tracks)) {
    raw.tracks.forEach((r, i) => {
      const t = track(ctx, ids, r, `tracks[${i}]`, pool);
      if (t) tracks.push(t);
    });
  } else ctx.error('tracks', 'expected a track list; using none');
  // duck sources must be other audio tracks
  const audio = new Set(tracks.filter((t) => t.kind === 'audio').map((t) => t.id));
  tracks.forEach((t, i) => {
    if (!t.duck) return;
    const by = t.duck.by.filter((b) => b !== t.id && audio.has(b));
    if (by.length !== t.duck.by.length) ctx.warn(`tracks[${i}].duck.by`, 'unknown or non-audio duck sources dropped');
    if (by.length) t.duck = { ...t.duck, by };
    else delete t.duck;
  });
  const markers: Marker[] = [];
  if (Array.isArray(raw.markers)) {
    raw.markers.forEach((m, i) => {
      if (!isRec(m) || !isNum(m.t)) return ctx.warn(`markers[${i}]`, 'bad marker dropped');
      markers.push({ id: ids.take(m.id, `markers[${i}]`, 'mk'), t: Math.max(0, m.t), label: isStr(m.label) ? m.label : '', ...(isStr(m.color) ? { color: m.color } : {}) });
    });
  } else if (raw.markers !== undefined) ctx.warn('markers', 'expected a marker list; using none');
  const regions: Region[] = [];
  if (Array.isArray(raw.regions)) {
    raw.regions.forEach((r, i) => {
      if (!isRec(r) || !isNum(r.start) || !isNum(r.end) || r.start === r.end) return ctx.warn(`regions[${i}]`, 'bad region dropped');
      if (r.end < r.start) ctx.warn(`regions[${i}]`, 'start after end; swapped');
      regions.push({
        id: ids.take(r.id, `regions[${i}]`, 'rg'),
        start: Math.max(0, Math.min(r.start, r.end)),
        end: Math.max(r.start, r.end),
        label: isStr(r.label) ? r.label : '',
        ...(isStr(r.color) ? { color: r.color } : {}),
      });
    });
  } else if (raw.regions !== undefined) ctx.warn('regions', 'expected a region list; using none');
  const ms = isRec(raw.master) ? raw.master : {};
  if (!isRec(raw.master)) ctx.error('master', 'missing master settings; using defaults');
  let source: Project['source'];
  if (isRec(raw.source) && raw.source.kind === 'film-import' && isStr(raw.source.at)) {
    source = {
      kind: 'film-import',
      at: raw.source.at,
      ...(isStr(raw.source.timelineSha) ? { timelineSha: raw.source.timelineSha } : {}),
      ...(isStr(raw.source.cuesSha) ? { cuesSha: raw.source.cuesSha } : {}),
    };
  } else if (raw.source !== undefined) ctx.warn('source', 'unknown provenance dropped');
  const view = projectView(raw.view);
  if (raw.view !== undefined && !view) ctx.warn('view', 'bad saved view dropped');
  return {
    version: PROJECT_VERSION,
    slug: raw.slug,
    title: ctx.str(raw, 'title', '$', raw.slug),
    fps: ctx.num(raw, 'fps', '$', 24, (v) => v > 0 && v <= 240, 'a frame rate'),
    width: ctx.num(raw, 'width', '$', 1920, (v) => v >= 16 && Number.isInteger(v), 'a pixel width'),
    height: ctx.num(raw, 'height', '$', 1080, (v) => v >= 16 && Number.isInteger(v), 'a pixel height'),
    sampleRate: ctx.num(raw, 'sampleRate', '$', 48000, (v) => v >= 8000 && v <= 384000, 'a sample rate'),
    media: pool,
    tracks,
    markers,
    regions,
    master: {
      gainDb: ctx.num(ms, 'gainDb', 'master', 0),
      limiterDb: ctx.num(ms, 'limiterDb', 'master', -1.5, (v) => v <= 0),
      finish: ctx.num(ms, 'finish', 'master', 1, (v) => v >= 0 && v <= 1),
    },
    ...(source ? { source } : {}),
    ...(view ? { view } : {}),
    createdAt: isStr(raw.createdAt) ? raw.createdAt : (ctx.warn('createdAt', 'missing; set to now'), now),
    updatedAt: isStr(raw.updatedAt) ? raw.updatedAt : (ctx.warn('updatedAt', 'missing; set to now'), now),
  };
}

/** the saved timeline view (UI state only: anything malformed is dropped, never an error) */
function projectView(v: unknown): ProjectView | null {
  if (!isRec(v) || !isNum(v.cursor) || !isNum(v.pxPerSec) || !isNum(v.scrollT) || !(v.pxPerSec > 0)) return null;
  const l = v.loop;
  const loop = isRec(l) && isNum(l.start) && isNum(l.end) && l.end > l.start ? { start: Math.max(0, l.start), end: l.end } : null;
  return { cursor: Math.max(0, v.cursor), pxPerSec: v.pxPerSec, scrollT: Math.max(0, v.scrollT), loop, looping: v.looping === true && !!loop };
}

export function validateProject(raw: unknown, opts: { repair?: boolean } = {}): ValidationResult {
  const repair = opts.repair !== false;
  const ctx = new Ctx(repair);
  if (!isRec(raw)) {
    ctx.error('$', 'a project must be a JSON object', false);
    return { ok: false, project: null, issues: ctx.issues };
  }
  const built = build(ctx, raw);
  const fatal = ctx.issues.some((i) => i.severity === 'error' && !i.repaired);
  if (!repair) {
    const ok = !ctx.issues.some((i) => i.severity === 'error');
    return { ok, project: ok ? (raw as unknown as Project) : null, issues: ctx.issues };
  }
  if (!built || fatal) return { ok: false, project: null, issues: ctx.issues };
  return { ok: true, project: normalize(built), issues: ctx.issues };
}

/** a valid (repaired) project, or throws listing every unrepairable error */
export function assertProject(raw: unknown): Project {
  const r = validateProject(raw);
  if (!r.ok || !r.project) {
    const errs = r.issues.filter((i) => i.severity === 'error' && !i.repaired);
    throw new Error(`invalid project: ${errs.map((i) => `${i.path}: ${i.message}`).join('; ') || 'unknown error'}`);
  }
  return r.project;
}

/** human-readable lines for a result's issues (status bar, server log) */
export function formatIssues(issues: readonly ValidationIssue[]): string[] {
  return issues.map((i) => `${i.severity}${i.repaired ? ' (repaired)' : ''} ${i.path}: ${i.message}`);
}
