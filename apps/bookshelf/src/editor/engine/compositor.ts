/**
 * Video compositor: project + timeline time → pixels (the editor preview and the export harness paint with it,
 * so the preview equals the render).
 *
 *   const shots = await loadShotSource('neural-net-history', { width: 1920 })  // the film engine's shot painter
 *   const comp = createCompositor({ shots, project })
 *   const f = comp.render(t, ctx)          // ctx: any size; returns contributing events + stage-space overlays
 *   await comp.prepare(t)                  // before an exact render: images decoded, videos seeked, fonts loaded
 *   comp.onInvalidate(() => repaint())     // async media became ready (image decode, video seek), or setProject ran
 *   comp.thumbnail(mediaId, src, w, h)     // cached, painted synchronously (callers schedule it in idle time); null
 *                                          // while its media loads (an image decode, a video seek: onInvalidate fires)
 *
 * Per frame (EDITOR.md "Engines"):
 *   1. Video tracks from the BOTTOM (last) to the TOP (track 0); mute/solo honoured; per track the events under t.
 *   2. Each event's media is painted into a frame-sized buffer: a shot through ShotSource.paint (the reel's own
 *      painter, at up to 2× resolution under a Pan/Crop zoom), an image or video fitted (contain), a text
 *      generator in stage space, a solid colour.
 *   3. Pan/Crop (keyframed, curve-shaped) places it; event FX apply as the canvas filter on that draw, then the
 *      vignette/finish passes; opacity = event level × opacity envelope × fades.
 *   4. Events that overlap on a track composite through the later event's transition (film TransitionFns plus the
 *      editor's wipes/push/dip). Fades are not applied on an edge that is a transition: the transition is the fade.
 *   5. Each track lands on the output with its opacity (level × envelope), blend mode and track FX; then the
 *      registered film finish runs over the output, mixed by project.master.finish.
 *
 * Fast paths keep the common case at reel cost: an opaque, untransformed, un-FX'd shot paints straight into its
 * destination, and a normal-blend, full-opacity, FX-free track paints straight into the output (source-over is
 * associative, so skipping the track layer is exact). An imported, unedited film therefore takes exactly the
 * reel's path: shot → (transition A/B buffers →) output → finish, with the same seeds, frame numbers and moods.
 * Known difference: the reel paints glossary tags once over the composite; the shot source carries them with
 * each shot, so during a transition a tag dissolves with its shot instead of switching at the midpoint.
 *
 * Overlays (shot SVG, stage space 1280×720) are returned for the DOM stack above the canvas, with the event's
 * opacity × transition weight × track opacity and the Pan/Crop as an SVG transform; they do not take blend
 * modes or FX (they are DOM, not pixels).
 *
 * Buffers come from a size-keyed pool and are reused across frames, so steady-state frames allocate no pixel
 * memory (small per-frame objects remain: active-event arrays, transition environments, transform strings).
 */
import '../../viz/film/setup';
import type { FinishFn, Palette } from '../../viz/film/contracts';
import { FILM_H, FILM_W } from '../../viz/film/contracts';
import { fontSpecs, getFinish, getFinishOverlay } from '../../viz/film/core/registry';
import { createShotSource, seedOf, type FilmShotSource } from '../../viz/film/core/reel';
import { loadShotModules, loadTimeline } from '../../viz/film/core/shot';
import { filmFontsReady } from '../../viz/film/setup';
import { MOODS } from '../../viz/film/silhouette/palette';
import type {
  BlendMode,
  ColorMedia,
  CompositorFrame,
  EditEvent,
  ImageMedia,
  Media,
  PanCrop,
  Project,
  ShotMedia,
  ShotSource,
  TextMedia,
  Track,
  VideoCompositor,
  VideoMedia,
} from '../model/types';
import { srcAt } from '../model/types';
import { applyFinish, paintVignette, resolveFx, type FinishEnv } from './fx';
import { fadeGain, isIdentity, panCropAt, panCropMatrix, panCropSvg, sampleKeys } from './pancrop';
import { paintText, resolveText, textFont } from './text';
import { alphaCrossfade, needsOpaque, transitionFn } from './transitions';

type VisualMedia = ShotMedia | ImageMedia | VideoMedia | TextMedia | ColorMedia;
type Ctx = CanvasRenderingContext2D;

const isVisual = (m: Media | undefined): m is VisualMedia => !!m && m.kind !== 'audio';
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** below this an event or track contributes nothing visible (one 8-bit step at most) */
const ALPHA_EPS = 1 / 512;

const BLEND: Record<BlendMode, GlobalCompositeOperation> = {
  normal: 'source-over',
  screen: 'screen',
  multiply: 'multiply',
  add: 'lighter',
  overlay: 'overlay',
  lighten: 'lighten',
  darken: 'darken',
};

function resetCtx(c: Ctx): void {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.filter = 'none';
  c.shadowColor = 'rgba(0,0,0,0)';
  c.shadowBlur = 0;
}

/** draw a file-backed source scaled into all of `c` with high-quality resampling (state restored after) */
function drawSmooth(c: Ctx, src: CanvasImageSource, W: number, H: number): void {
  c.save();
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.drawImage(src, 0, 0, W, H);
  c.restore();
}

function makeCtx(w: number, h: number): Ctx {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, w);
  cv.height = Math.max(1, h);
  const c = cv.getContext('2d');
  if (!c) throw new Error('compositor: 2D canvas unavailable');
  return c;
}

/** Size-keyed scratch canvases, handed out per frame and returned at frame end (no per-frame allocation in
 *  steady state). Sizes are kept LRU: an output resize or a new media size retires the least recently used. */
class BufferPool {
  private free = new Map<string, Ctx[]>();
  private used: [string, Ctx][] = [];
  private static readonly MAX_SIZES = 12;
  private static readonly MAX_PER_SIZE = 6;
  /** a w×h context at identity/default state; cleared unless the caller overwrites every pixel */
  take(w: number, h: number, clear = true): Ctx {
    const k = `${w}x${h}`;
    let l = this.free.get(k);
    if (l) {
      this.free.delete(k); // bump to most recently used
      this.free.set(k, l);
    } else this.free.set(k, (l = []));
    const c = l.pop() ?? makeCtx(w, h);
    this.used.push([k, c]);
    resetCtx(c);
    if (clear) c.clearRect(0, 0, w, h);
    return c;
  }
  /** return every buffer taken since the last release */
  release(): void {
    for (const [k, c] of this.used) {
      const l = this.free.get(k);
      if (l && l.length < BufferPool.MAX_PER_SIZE) l.push(c);
    }
    this.used.length = 0;
    while (this.free.size > BufferPool.MAX_SIZES) this.free.delete(this.free.keys().next().value!);
  }
  clear(): void {
    this.free.clear();
    this.used.length = 0;
  }
  /** pooled buffers and their device megapixels */
  stats(): { count: number; megapixels: number } {
    let count = 0, px = 0;
    for (const l of this.free.values()) for (const c of l) {
      count++;
      px += c.canvas.width * c.canvas.height;
    }
    return { count, megapixels: +(px / 1e6).toFixed(1) };
  }
}

// ---------------------------------------------------------------------------
// Track index: per (immutable) Track, the playable events sorted by start, a running max end for interval
// lookup, and which edges are transitions (overlap a neighbour)
// ---------------------------------------------------------------------------
interface TrackIndex {
  events: EditEvent[];
  maxEnd: Float64Array;
  /** overlapped at its head by an earlier event (fade-in suppressed: the transition blends it) */
  head: Uint8Array;
  /** overlapped at its tail by a later event */
  tail: Uint8Array;
}
const EDGE_EPS = 1e-6;

function buildIndex(tr: Track): TrackIndex {
  const evs = tr.events.filter((e) => !e.mute && e.length > 0);
  for (let i = 1; i < evs.length; i++) {
    if (evs[i].start < evs[i - 1].start) {
      evs.sort((a, b) => a.start - b.start);
      break;
    }
  }
  const n = evs.length;
  const maxEnd = new Float64Array(n);
  const head = new Uint8Array(n);
  const tail = new Uint8Array(n);
  let m = -Infinity;
  for (let i = 0; i < n; i++) {
    const e = evs[i];
    if (m > e.start + EDGE_EPS) head[i] = 1;
    m = Math.max(m, e.start + e.length);
    maxEnd[i] = m;
    if (i + 1 < n && evs[i + 1].start < e.start + e.length - EDGE_EPS) tail[i] = 1;
  }
  return { events: evs, maxEnd, head, tail };
}

/** indices (ascending start) of the events covering t */
function activeAt(ix: TrackIndex, t: number, out: number[]): number[] {
  out.length = 0;
  const ev = ix.events;
  let lo = 0, hi = ev.length - 1, k = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (ev[mid].start <= t) {
      k = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  for (; k >= 0 && ix.maxEnd[k] > t; k--) {
    if (ev[k].start + ev[k].length > t) out.push(k);
  }
  return out.reverse();
}

// ---------------------------------------------------------------------------
// Media loaders (images, videos)
// ---------------------------------------------------------------------------
interface ImageSlot {
  img: HTMLImageElement;
  ready: boolean;
  error?: string;
  promise: Promise<void>;
}

interface VideoSlot {
  el: HTMLVideoElement;
  meta: Promise<void>;
  error?: string;
  /** previous render's source time and wall clock: tells playback (real-time progression) from scrubbing */
  lastSrc: number;
  lastWall: number;
  /** a seek requested while another was in flight */
  pendingSeek: number | null;
}

const SEEK_TIMEOUT_MS = 8000;

function once(el: HTMLElement, ev: string, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      el.removeEventListener(ev, done);
      resolve();
    };
    const timer = setTimeout(done, timeoutMs);
    el.addEventListener(ev, done, { once: true });
  });
}

/** exact presentation time for source second `src` of a video (frame centre when the frame rate is known) */
function videoTarget(m: VideoMedia, el: HTMLVideoElement, src: number): number {
  const dur = Number.isFinite(el.duration) ? el.duration : m.duration;
  let s = Math.max(0, src);
  if (m.fps && m.fps > 0) s = (Math.floor(s * m.fps + 1e-6) + 0.5) / m.fps;
  return Number.isFinite(dur) && dur > 0 ? Math.min(s, Math.max(0, dur - 1e-3)) : s;
}

// ---------------------------------------------------------------------------
// Thumbnails
// ---------------------------------------------------------------------------
interface ThumbEntry {
  cv: HTMLCanvasElement;
  px: number;
  mediaId: string;
}
interface ThumbJob {
  key: string;
  mediaId: string;
  src: number;
  w: number;
  h: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export interface CompositorOptions {
  /** shot painter for the project's own film (see loadShotSource); can be set later with setShotSource */
  shots?: ShotSource | null;
  /** shot painters for other films (ShotMedia.film ≠ project.slug), by slug */
  films?: Record<string, ShotSource>;
  project?: Project | null;
  /** run the master film finish (project.master.finish); default true. A draft preview may switch it off. */
  finish?: boolean;
  /** thumbnail cache budget in device pixels (default 24 Mpx ≈ 96 MB) */
  thumbBudget?: number;
}

export interface CompositorStats {
  /** last render (ms, CPU side) */
  ms: number;
  /** of which shot painting */
  shotMs: number;
  /** shots painted as placeholders last frame (unauthored, failed, or no shot source yet) */
  placeholders: number;
  thumbs: { count: number; megapixels: number; queued: number };
  /** scratch buffers held by the pool */
  buffers: { count: number; megapixels: number };
}

export interface EditorCompositor extends VideoCompositor {
  /** the shot painter for `film` (default: the project's own film); null removes it */
  setShotSource(src: ShotSource | null, film?: string): void;
  setOptions(o: { finish?: boolean }): void;
  /** load/decode/seek everything visible at t (images, video frames, text fonts): await before an exact render */
  prepare(t: number): Promise<void>;
  /** subscribe to "render again": async media became ready, or the project changed (setProject, which a timeline
   *  drag also uses to show its draft live). Coalesced to one call per animation frame. */
  onInvalidate(fn: () => void): () => void;
  stats(): CompositorStats;
}

export function createCompositor(opts: CompositorOptions = {}): EditorCompositor {
  let project: Project | null = null;
  let finishOn = opts.finish !== false;
  let ownShots: ShotSource | null = opts.shots ?? null;
  const filmShots = new Map<string, ShotSource>(Object.entries(opts.films ?? {}));
  const pool = new BufferPool();
  const indexes = new WeakMap<Track, TrackIndex>();
  const images = new Map<string, ImageSlot>();
  const videos = new Map<string, VideoSlot>();
  const thumbVideos = new Map<string, VideoSlot>();
  const listeners = new Set<() => void>();
  const activeScratch: number[] = [];
  let stats: CompositorStats = { ms: 0, shotMs: 0, placeholders: 0, thumbs: { count: 0, megapixels: 0, queued: 0 }, buffers: { count: 0, megapixels: 0 } };
  let shotMs = 0;
  let placeholders = 0;
  let disposed = false;
  /** shot media that painted as a placeholder card (failed module, a throw): the timeline flags them */
  const failedMedia = new Set<string>();

  // ------------------------------------------------------------- invalidation
  let invalidateQueued = false;
  const invalidate = () => {
    if (invalidateQueued || disposed || listeners.size === 0) return;
    invalidateQueued = true;
    const fire = () => {
      invalidateQueued = false;
      if (!disposed) for (const fn of [...listeners]) fn();
    };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(fire);
    else setTimeout(fire, 16);
  };

  // ------------------------------------------------------------- shots
  const sourceFor = (m: ShotMedia): ShotSource | null => {
    if (project && m.film !== project.slug) return filmShots.get(m.film) ?? null;
    return ownShots ?? filmShots.get(m.film) ?? null;
  };
  const moodOf = (m: ShotMedia | null): Palette => {
    const id = m ? sourceFor(m)?.moodId?.(m.shotId) : undefined;
    return (id ? (MOODS as Record<string, Palette | undefined>)[id] : undefined) ?? MOODS.duskRose;
  };
  const shotSeed = (m: ShotMedia): number => sourceFor(m)?.seed?.(m.shotId) ?? seedOf(`${m.film}/${m.shotId}`);

  /** paint a shot into all of `c` (identity on return); returns its overlay */
  const paintShot = (m: ShotMedia, local: number, c: Ctx, t: number): unknown => {
    const src = sourceFor(m);
    if (!src) {
      paintPending(c, m.label || m.shotId, 'loading shot…');
      placeholders++;
      return undefined;
    }
    const r = src.paint(m.shotId, local, c, t);
    shotMs += r.ms;
    if (r.placeholder) {
      placeholders++;
      if (!failedMedia.has(m.id)) {
        failedMedia.add(m.id);
        invalidate(); // the timeline marks the event
      }
    }
    resetCtx(c);
    return r.overlay;
  };

  // ------------------------------------------------------------- images / videos
  const image = (url: string): ImageSlot => {
    let s = images.get(url);
    if (s) return s;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    const slot: ImageSlot = { img, ready: false, promise: Promise.resolve() };
    slot.promise = new Promise<void>((resolve) => {
      img.onload = () => {
        img
          .decode()
          .catch(() => undefined)
          .then(() => {
            slot.ready = true;
            invalidate();
            resolve();
          });
      };
      img.onerror = () => {
        slot.error = `image failed to load: ${url}`;
        console.warn(`[editor] ${slot.error}`);
        resolve();
      };
    });
    img.src = url;
    images.set(url, slot);
    return slot;
  };

  const makeVideo = (url: string, notify: boolean): VideoSlot => {
    const el = document.createElement('video');
    el.muted = true; // picture only: the audio engine plays the sound
    el.playsInline = true;
    el.preload = 'auto';
    el.crossOrigin = 'anonymous';
    const slot: VideoSlot = { el, meta: Promise.resolve(), lastSrc: NaN, lastWall: 0, pendingSeek: null };
    slot.meta = new Promise<void>((resolve) => {
      el.addEventListener('loadeddata', () => resolve(), { once: true });
      el.addEventListener(
        'error',
        () => {
          slot.error = `video failed to load: ${url}`;
          console.warn(`[editor] ${slot.error}`);
          resolve();
        },
        { once: true },
      );
    });
    if (notify) {
      el.addEventListener('loadeddata', invalidate);
      el.addEventListener('seeked', () => {
        if (slot.pendingSeek != null) {
          el.currentTime = slot.pendingSeek;
          slot.pendingSeek = null;
        }
        invalidate();
      });
    }
    el.src = url;
    return slot;
  };
  const video = (url: string): VideoSlot => {
    let s = videos.get(url);
    if (!s) videos.set(url, (s = makeVideo(url, true)));
    return s;
  };

  /** await an exact frame (export, thumbnails) */
  const seekExact = async (slot: VideoSlot, m: VideoMedia, src: number): Promise<void> => {
    await slot.meta;
    if (slot.error) return;
    const el = slot.el;
    if (!el.paused) el.pause();
    const target = videoTarget(m, el, src);
    if (Math.abs(el.currentTime - target) < 1e-4 && el.readyState >= 2 && !el.seeking) return;
    slot.pendingSeek = null;
    const done = once(el, 'seeked', SEEK_TIMEOUT_MS);
    el.currentTime = target;
    await done;
    slot.lastSrc = src;
    slot.lastWall = performance.now();
  };

  /**
   * Preview sync (render is synchronous, so it draws whatever frame the element holds and steers it): when the
   * source time advances in real time (playback) the element plays at the event rate and is re-seeked only on
   * drift; otherwise (scrub, step, stopped) it is paused and seeked to the frame, coalescing seeks in flight.
   */
  const SHUTTLE_SPEEDS = [1, 2, 4] as const;
  const syncVideo = (slot: VideoSlot, m: VideoMedia, src: number, rate: number) => {
    const el = slot.el;
    if (slot.error || el.readyState < 1) return;
    const now = performance.now();
    const target = videoTarget(m, el, src);
    const dWall = (now - slot.lastWall) / 1000;
    // real-time progression at the event rate times a J/K/L shuttle speed (1×, 2×, 4×): let the element play at
    // that speed instead of re-seeking every frame
    let speed = 0;
    if (Number.isFinite(slot.lastSrc) && dWall > 0 && dWall < 0.25) {
      for (const k of SHUTTLE_SPEEDS) {
        const r = rate * k;
        if (Math.abs(src - slot.lastSrc - dWall * r) < 0.06 + 0.1 * dWall * k) {
          speed = r;
          break;
        }
      }
    }
    slot.lastSrc = src;
    slot.lastWall = now;
    if (speed > 0) {
      if (Math.abs(el.playbackRate - speed) > 1e-3) el.playbackRate = speed;
      if (el.paused) el.play().catch(() => undefined);
      if (Math.abs(el.currentTime - target) > 0.2 && !el.seeking) el.currentTime = target;
      return;
    }
    if (!el.paused) el.pause();
    const halfFrame = 0.5 / (m.fps && m.fps > 0 ? m.fps : project?.fps ?? 24);
    if (Math.abs(el.currentTime - target) > halfFrame) {
      if (el.seeking) slot.pendingSeek = target;
      else el.currentTime = target;
    }
  };

  // ------------------------------------------------------------- media frames
  /** the media's fitted frame (device px) inside a W×H output: contain for images/video/shots, full for generators */
  const frameSize = (m: VisualMedia, W: number, H: number): { w: number; h: number } => {
    let mw: number, mh: number;
    if (m.kind === 'shot') {
      mw = FILM_W;
      mh = FILM_H;
    } else if (m.kind === 'image' || m.kind === 'video') {
      mw = m.width || W;
      mh = m.height || H;
    } else return { w: W, h: H };
    const s = Math.min(W / mw, H / mh);
    // snap to the output when within a pixel (a 16:9 shot in a 16:9 output is exactly full-frame)
    const w = Math.abs(mw * s - W) < 1 ? W : Math.round(mw * s);
    const h = Math.abs(mh * s - H) < 1 ? H : Math.round(mh * s);
    return { w, h };
  };

  /** paint the media itself (no Pan/Crop, FX or opacity) into all of `c`; false when nothing is available yet */
  const paintMedia = (m: VisualMedia, e: EditEvent, src: number, t: number, c: Ctx): { drawn: boolean; overlay?: unknown } => {
    const W = c.canvas.width, H = c.canvas.height;
    switch (m.kind) {
      case 'shot':
        return { drawn: true, overlay: paintShot(m, src, c, t) };
      case 'image': {
        const s = image(m.url);
        if (!s.ready) return { drawn: false };
        drawSmooth(c, s.img, W, H);
        return { drawn: true };
      }
      case 'video': {
        const s = video(m.url);
        syncVideo(s, m, src, e.rate);
        if (s.error || s.el.readyState < 2) return { drawn: false };
        drawSmooth(c, s.el, W, H);
        return { drawn: true };
      }
      case 'text':
        paintText(c, resolveText(m.text, e.text), src, 1);
        return { drawn: true };
      case 'color':
        c.fillStyle = m.color;
        c.fillRect(0, 0, W, H);
        return { drawn: true };
    }
  };

  // ------------------------------------------------------------- events
  interface Painted {
    drawn: boolean;
    /** covers the whole output with alpha 1 */
    opaque: boolean;
    alpha: number;
    overlay?: unknown;
    pc: PanCrop;
    shot: ShotMedia | null;
  }
  const NOTHING: Painted = { drawn: false, opaque: false, alpha: 0, pc: { x: 0, y: 0, zoom: 1, rot: 0 }, shot: null };

  /** does a Pan/Crop keep a full-frame media covering the output? */
  const covers = (pc: PanCrop) =>
    isIdentity(pc) || (Math.abs(pc.rot % 360) < 1e-6 && pc.zoom >= 1 && Math.abs(pc.x) <= (pc.zoom - 1) / 2 + 1e-9 && Math.abs(pc.y) <= (pc.zoom - 1) / 2 + 1e-9);
  const opaqueColor = (c: string) => !/rgba|hsla|transparent|#[0-9a-f]{8}\b|#[0-9a-f]{4}\b|\/\s*0?\.\d/i.test(c);

  /**
   * Paint one event at timeline time t into `dest` (device px, W×H, identity on entry and return).
   * `head`/`tail`: whether that edge's fade applies (false on transition edges).
   */
  const paintEvent = (e: EditEvent, m: VisualMedia, head: boolean, tail: boolean, t: number, dest: Ctx, frame: number): Painted => {
    const W = dest.canvas.width, H = dest.canvas.height;
    const local = t - e.start;
    const src = srcAt(e, t);
    const alpha = clamp01((e.opacity ?? 1) * sampleKeys(e.envelopes?.opacity, local, 1) * fadeGain(e, local, { head, tail }));
    if (alpha <= ALPHA_EPS) return NOTHING;
    const pc = panCropAt(e.panCrop, local);
    const ident = isIdentity(pc);
    const fx = resolveFx(e.videoFx, local, H);
    const fs = frameSize(m, W, H);
    const full = fs.w === W && fs.h === H;
    const shot = m.kind === 'shot' ? m : null;

    // fast paths: straight into the destination
    if (ident && !fx) {
      if (m.kind === 'shot' && alpha >= 0.999 && full) {
        const overlay = paintShot(m, src, dest, t);
        return { drawn: true, opaque: true, alpha: 1, overlay, pc, shot };
      }
      if (m.kind === 'color') {
        dest.globalAlpha = alpha;
        dest.fillStyle = m.color;
        dest.fillRect(0, 0, W, H);
        dest.globalAlpha = 1;
        return { drawn: true, opaque: alpha >= 0.999 && opaqueColor(m.color), alpha, pc, shot };
      }
      if (m.kind === 'text') {
        paintText(dest, resolveText(m.text, e.text), src, alpha);
        return { drawn: true, opaque: false, alpha, pc, shot };
      }
    }

    // general path: media → frame buffer → (Pan/Crop + filter) → [layer: vignette, finish] → dest at alpha
    // procedural shots repaint sharp under a zoom (in steps, so an animated zoom reuses three buffer sizes)
    const ss = m.kind !== 'shot' || pc.zoom <= 1.15 ? 1 : pc.zoom <= 1.6 ? 1.5 : 2;
    const bw = Math.max(1, Math.round(fs.w * ss)), bh = Math.max(1, Math.round(fs.h * ss));
    const media = pool.take(bw, bh, m.kind !== 'shot' && m.kind !== 'color');
    const r = paintMedia(m, e, src, t, media);
    if (!r.drawn) return NOTHING;
    const layered = !!fx && (fx.vignette > 0 || fx.finish > 0);
    const tgt = layered ? pool.take(W, H, true) : dest;
    const mx = panCropMatrix(pc, W, H);
    tgt.save();
    tgt.setTransform(mx[0], mx[1], mx[2], mx[3], mx[4], mx[5]);
    tgt.globalAlpha = layered ? 1 : alpha;
    tgt.filter = fx ? fx.filter : 'none';
    tgt.imageSmoothingEnabled = true;
    tgt.imageSmoothingQuality = 'high';
    tgt.drawImage(media.canvas, -fs.w / 2, -fs.h / 2, fs.w, fs.h);
    tgt.restore();
    const opaqueMedia = m.kind === 'shot' || m.kind === 'video' || (m.kind === 'color' && opaqueColor(m.color));
    const opaque = opaqueMedia && full && covers(pc) && alpha >= 0.999 && !fx?.blurs;
    if (layered && fx) {
      if (fx.vignette > 0) paintVignette(tgt, fx.vignette);
      const fin = getFinish();
      if (fx.finish > 0 && fin) applyFinish(tgt, fin, fx.finish, finishEnv(W, t, frame, shot), pool.take(W, H, false), !opaque);
      dest.save();
      resetCtx(dest);
      dest.globalAlpha = alpha;
      dest.drawImage(tgt.canvas, 0, 0);
      dest.restore();
    }
    return { drawn: true, opaque, alpha, overlay: r.overlay, pc, shot };
  };

  const finishEnv = (W: number, t: number, frame: number, shot: ShotMedia | null): FinishEnv => ({
    W: FILM_W,
    H: FILM_H,
    pxScale: W / FILM_W,
    frame,
    t,
    seed: seedOf(project?.slug ?? ''),
    mood: moodOf(shot),
  });

  // ------------------------------------------------------------- tracks
  interface TrackPaint {
    drawn: boolean;
    /** the shot that dominates this track's picture (finish-pass mood) */
    shot: ShotMedia | null;
  }

  /**
   * Paint a track's active events into `target`. `onContent`: target already holds pixels other than the cleared
   * black/transparent base, so non-opaque transition results go through a buffer instead of straight in.
   */
  const paintTrack = (ix: TrackIndex, act: number[], t: number, target: Ctx, onContent: boolean, trackAlpha: number, frame: number, out: CompositorFrame): TrackPaint => {
    const W = target.canvas.width, H = target.canvas.height;
    const media = project!.media;
    const evs = act.map((k) => ix.events[k]);
    const ms = evs.map((e) => media[e.mediaId] as VisualMedia);
    const pushOverlay = (e: EditEvent, r: Painted, weight: number) => {
      if (r.overlay == null || r.overlay === false) return;
      const op = r.alpha * weight * trackAlpha;
      if (op > ALPHA_EPS) out.overlays.push({ id: e.id, node: r.overlay, opacity: op, transform: panCropSvg(r.pc) });
    };

    if (evs.length === 1) {
      const k = act[0];
      const r = paintEvent(evs[0], ms[0], !ix.head[k], !ix.tail[k], t, target, frame);
      if (r.drawn) {
        out.events.push(evs[0].id);
        pushOverlay(evs[0], r, 1);
      }
      return { drawn: r.drawn, shot: r.drawn ? r.shot : null };
    }

    // overlapping events: fold left through each later event's transition
    const n = evs.length;
    const first = act[0];
    let acc = pool.take(W, H, true);
    let accR = paintEvent(evs[0], ms[0], !ix.head[first], false, t, acc, frame);
    let accOpaque = accR.drawn && accR.opaque;
    const painted: { e: EditEvent; r: Painted; w: number }[] = [{ e: evs[0], r: accR, w: 1 }];
    let shot: ShotMedia | null = accR.drawn ? accR.shot : null;
    let anyDrawn = accR.drawn;
    for (let i = 1; i < n; i++) {
      const prev = evs[i - 1], b = evs[i];
      const last = i === n - 1;
      const bBuf = pool.take(W, H, true);
      const mb = ms[i];
      const rb = paintEvent(b, mb, false, last ? !ix.tail[act[i]] : false, t, bBuf, frame);
      anyDrawn ||= rb.drawn;
      const ovEnd = Math.min(prev.start + prev.length, b.start + b.length);
      const u = clamp01((t - b.start) / Math.max(1e-6, ovEnd - b.start));
      const kind = b.transition?.kind ?? 'crossfade';
      const both = accOpaque && rb.drawn && rb.opaque;
      const fn = !both && needsOpaque(kind) ? alphaCrossfade : transitionFn(kind);
      const direct = last && (both || !onContent);
      const dest = direct ? target : pool.take(W, H, true);
      dest.save();
      resetCtx(dest);
      dest.setTransform(W / FILM_W, 0, 0, H / FILM_H, 0, 0);
      fn(dest, acc.canvas, bBuf.canvas, u, {
        W: FILM_W,
        H: FILM_H,
        pxScale: W / FILM_W,
        seed: mb.kind === 'shot' ? shotSeed(mb) : seedOf(b.id),
        frame,
        mood: moodOf(rb.shot ?? accR.shot ?? shot),
      });
      dest.restore();
      resetCtx(dest);
      if (last && !direct) target.drawImage(dest.canvas, 0, 0);
      // overlay weights: the film's convention (cut switches at the midpoint, everything else dissolves)
      const wb = kind === 'cut' ? +(u >= 0.5) : u;
      for (const p of painted) p.w *= 1 - wb;
      painted.push({ e: b, r: rb, w: wb });
      if (rb.drawn && rb.shot && u >= 0.5) shot = rb.shot;
      else if (!shot && rb.shot) shot = rb.shot;
      acc = dest;
      accR = rb;
      accOpaque = both;
    }
    for (const p of painted) {
      if (!p.r.drawn) continue;
      out.events.push(p.e.id);
      pushOverlay(p.e, p.r, p.w);
    }
    return { drawn: anyDrawn, shot };
  };

  // ------------------------------------------------------------- render
  const render = (t: number, ctx: Ctx): CompositorFrame => {
    const t0 = performance.now();
    shotMs = 0;
    placeholders = 0;
    const W = ctx.canvas.width, H = ctx.canvas.height;
    resetCtx(ctx);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const out: CompositorFrame = { t, ms: 0, events: [], overlays: [] };
    const p = project;
    if (p) {
      const fps = p.fps || 24;
      const frame = Math.round(t * fps);
      const tracks = p.tracks;
      const solo = tracks.some((tr) => tr.kind === 'video' && tr.solo);
      let onContent = false;
      let frontShot: ShotMedia | null = null;
      for (let i = tracks.length - 1; i >= 0; i--) {
        const tr = tracks[i];
        if (tr.kind !== 'video' || tr.mute || (solo && !tr.solo)) continue;
        let ix = indexes.get(tr);
        if (!ix) indexes.set(tr, (ix = buildIndex(tr)));
        const act = activeAt(ix, t, activeScratch).filter((k) => isVisual(p.media[ix!.events[k].mediaId]));
        if (!act.length) continue;
        const tAlpha = clamp01((tr.opacity ?? 1) * sampleKeys(tr.envelopes?.opacity, t, 1));
        if (tAlpha <= ALPHA_EPS) continue;
        const tfx = resolveFx(tr.videoFx, t, H);
        const blend = tr.blend ?? 'normal';
        const direct = blend === 'normal' && tAlpha >= 0.999 && !tfx;
        const target = direct ? ctx : pool.take(W, H, true);
        const r = paintTrack(ix, act, t, target, direct && onContent, direct ? 1 : tAlpha, frame, out);
        if (!r.drawn) continue;
        if (!direct) {
          if (tfx && tfx.vignette > 0) paintVignette(target, tfx.vignette);
          const fin = getFinish();
          if (tfx && tfx.finish > 0 && fin) applyFinish(target, fin, tfx.finish, finishEnv(W, t, frame, r.shot), pool.take(W, H, false), true);
          ctx.save();
          resetCtx(ctx);
          ctx.globalAlpha = tAlpha;
          ctx.globalCompositeOperation = BLEND[blend] ?? 'source-over';
          ctx.filter = tfx ? tfx.filter : 'none';
          ctx.drawImage(target.canvas, 0, 0);
          ctx.restore();
        }
        if (r.shot) frontShot = r.shot;
        onContent = true;
      }
      // master: the film's finish pass (grain, flicker, bloom, vignette, dust), exactly as the reel runs it
      const amount = clamp01(p.master.finish ?? 0);
      if (finishOn && amount > 0) {
        const env = finishEnv(W, t, frame, frontShot);
        const fin = getFinish();
        if (fin) applyFinish(ctx, fin, amount, env, amount < 0.999 ? pool.take(W, H, false) : null, false);
        const fo: FinishFn | null = getFinishOverlay();
        if (fo) applyFinish(ctx, fo, amount, { ...env, bloom: 0 }, amount < 0.999 ? pool.take(W, H, false) : null, false);
      }
    }
    resetCtx(ctx);
    pool.release();
    out.ms = performance.now() - t0;
    stats = { ms: out.ms, shotMs, placeholders, thumbs: thumbStats(), buffers: pool.stats() };
    return out;
  };

  // ------------------------------------------------------------- thumbnails
  const thumbs = new Map<string, ThumbEntry>();
  const thumbKeysByMedia = new Map<string, Set<string>>();
  let thumbPx = 0;
  const thumbBudget = opts.thumbBudget ?? 24e6;
  /** video thumbnails seek a dedicated element one at a time (keys queued or in flight) */
  const videoQueued = new Set<string>();
  let videoChain: Promise<void> = Promise.resolve();

  const thumbStats = () => ({ count: thumbs.size, megapixels: +(thumbPx / 1e6).toFixed(1), queued: videoQueued.size });

  const storeThumb = (key: string, mediaId: string, cv: HTMLCanvasElement) => {
    const px = cv.width * cv.height;
    thumbs.set(key, { cv, px, mediaId });
    let ks = thumbKeysByMedia.get(mediaId);
    if (!ks) thumbKeysByMedia.set(mediaId, (ks = new Set()));
    ks.add(key);
    thumbPx += px;
    while (thumbPx > thumbBudget && thumbs.size > 1) {
      const [k0, v0] = thumbs.entries().next().value!;
      dropThumb(k0, v0);
    }
  };
  const dropThumb = (key: string, e: ThumbEntry) => {
    thumbs.delete(key);
    thumbPx -= e.px;
    thumbKeysByMedia.get(e.mediaId)?.delete(key);
  };
  const dropMediaThumbs = (mediaId: string) => {
    const ks = thumbKeysByMedia.get(mediaId);
    if (!ks) return;
    for (const k of [...ks]) {
      const e = thumbs.get(k);
      if (e) dropThumb(k, e);
    }
    thumbKeysByMedia.delete(mediaId);
  };

  /** paint a still of media at source time into a fresh w×h canvas (cover-fit), synchronously; null if not ready
   *  (a shot whose film's painter has not loaded yet is not ready: a "loading" card must not be cached as its
   *  thumbnail — setShotSource invalidates, and the callers ask again) */
  const paintThumb = (m: VisualMedia, src: number, w: number, h: number): HTMLCanvasElement | null => {
    if (m.kind === 'shot' && !sourceFor(m)) return null;
    const c = makeCtx(w, h);
    c.fillStyle = '#000';
    c.fillRect(0, 0, w, h);
    const fake: EditEvent = {
      id: `thumb:${m.id}`,
      mediaId: m.id,
      start: 0,
      length: 1,
      srcIn: src,
      rate: 1,
      fadeIn: { len: 0, curve: 'linear' },
      fadeOut: { len: 0, curve: 'linear' },
    };
    const fs = frameSize(m, w, h);
    if (fs.w === w && fs.h === h) {
      if (!paintMedia(m, fake, src, src, c).drawn) return null;
      resetCtx(c);
      return c.canvas;
    }
    // cover: paint at the media's aspect, large enough to fill, centred
    const s = Math.max(w / fs.w, h / fs.h);
    const mw = Math.max(1, Math.round(fs.w * s)), mh = Math.max(1, Math.round(fs.h * s));
    const tmp = pool.take(mw, mh, true);
    const ok = paintMedia(m, fake, src, src, tmp).drawn;
    if (ok) c.drawImage(tmp.canvas, (w - mw) / 2, (h - mh) / 2);
    pool.release();
    return ok ? c.canvas : null;
  };

  const enqueueVideoThumb = (j: ThumbJob, m: VideoMedia) => {
    if (videoQueued.has(j.key)) return;
    videoQueued.add(j.key);
    videoChain = videoChain.then(async () => {
      videoQueued.delete(j.key);
      if (disposed || thumbs.has(j.key)) return;
      let slot = thumbVideos.get(m.url);
      if (!slot) thumbVideos.set(m.url, (slot = makeVideo(m.url, false)));
      await seekExact(slot, m, j.src);
      if (slot.error || slot.el.readyState < 2) return;
      const c = makeCtx(j.w, j.h);
      c.fillStyle = '#000';
      c.fillRect(0, 0, j.w, j.h);
      const s = Math.max(j.w / (m.width || j.w), j.h / (m.height || j.h));
      const dw = (m.width || j.w) * s, dh = (m.height || j.h) * s;
      c.drawImage(slot.el, (j.w - dw) / 2, (j.h - dh) / 2, dw, dh);
      storeThumb(j.key, j.mediaId, c.canvas);
      invalidate();
    });
  };

  const thumbnail = (mediaId: string, src: number, w: number, h: number): HTMLCanvasElement | null => {
    const m = project?.media[mediaId];
    if (!isVisual(m)) return null;
    const tw = Math.max(1, Math.round(w)), th = Math.max(1, Math.round(h));
    const fps = project?.fps || 24;
    // timeless media share one thumbnail; time-based media are cached per frame
    const timeless = m.kind === 'color' || m.kind === 'image';
    const q = timeless ? 0 : Math.round(src * fps);
    const qs = q / fps;
    const key = `${mediaId}|${q}|${tw}x${th}`;
    const hit = thumbs.get(key);
    if (hit) {
      thumbs.delete(key); // LRU: most recent last
      thumbs.set(key, hit);
      return hit.cv;
    }
    if (m.kind === 'image' && !image(m.url).ready) return null; // its onload invalidates
    if (m.kind === 'video') {
      // a video frame needs an async seek: queue it; onInvalidate fires when it lands
      enqueueVideoThumb({ key, mediaId, src, w: tw, h: th }, m);
      return null;
    }
    // everything else paints now: callers (timeline ThumbCache, media pool, Pan/Crop) schedule thumbnails in idle
    // time themselves, so a budget here would only hand them nulls to retry
    const cv = paintThumb(m, qs, tw, th);
    if (cv) storeThumb(key, mediaId, cv);
    return cv;
  };

  // ------------------------------------------------------------- prepare (exact renders)
  const prepare = async (t: number): Promise<void> => {
    const p = project;
    if (!p) return;
    const jobs: Promise<unknown>[] = [];
    const act: number[] = [];
    for (const tr of p.tracks) {
      if (tr.kind !== 'video' || tr.mute) continue;
      let ix = indexes.get(tr);
      if (!ix) indexes.set(tr, (ix = buildIndex(tr)));
      for (const k of activeAt(ix, t, act)) {
        const e = ix.events[k];
        const m = p.media[e.mediaId];
        if (!isVisual(m)) continue;
        if (m.kind === 'image') jobs.push(image(m.url).promise);
        else if (m.kind === 'video') jobs.push(seekExact(video(m.url), m, srcAt(e, t)));
        else if (m.kind === 'text' && typeof document !== 'undefined' && document.fonts) {
          jobs.push(document.fonts.load(textFont(resolveText(m.text, e.text))).catch(() => undefined));
        }
      }
    }
    await Promise.all(jobs);
  };

  // ------------------------------------------------------------- project
  const setProject = (p: Project) => {
    const prev = project;
    if (p === prev) return;
    project = p;
    invalidate();
    if (prev) {
      // a media entry that changed (text edited, colour picked, file re-linked) loses its cached thumbnails
      for (const id of thumbKeysByMedia.keys()) {
        if (prev.media[id] !== p.media[id]) dropMediaThumbs(id);
      }
    }
  };
  if (opts.project) setProject(opts.project);

  return {
    render,
    setProject,
    thumbnail,
    prepare,
    failed: (mediaId: string) => failedMedia.has(mediaId),
    setShotSource(src, film) {
      failedMedia.clear();
      if (!film || film === project?.slug) ownShots = src;
      else if (src) filmShots.set(film, src);
      else filmShots.delete(film);
      // shot thumbnails painted as "loading" cards are stale now
      if (project) for (const [id, m] of Object.entries(project.media)) if (m.kind === 'shot') dropMediaThumbs(id);
      invalidate();
    },
    setOptions(o) {
      if (o.finish !== undefined) finishOn = o.finish;
    },
    onInvalidate(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    stats: () => stats,
    dispose() {
      disposed = true;
      listeners.clear();
      videoQueued.clear();
      for (const s of [...videos.values(), ...thumbVideos.values()]) {
        s.el.pause();
        s.el.removeAttribute('src');
        s.el.load();
      }
      videos.clear();
      thumbVideos.clear();
      images.clear();
      thumbs.clear();
      thumbKeysByMedia.clear();
      thumbPx = 0;
      pool.clear();
    },
  };
}

/** the "shot not loaded yet" card (no shot source for its film yet) */
function paintPending(c: Ctx, label: string, sub: string): void {
  const W = c.canvas.width, H = c.canvas.height;
  resetCtx(c);
  c.fillStyle = '#16120f';
  c.fillRect(0, 0, W, H);
  const s = Math.min(W / FILM_W, H / FILM_H);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = '#8c7f6c';
  c.font = `500 ${Math.max(6, Math.round(34 * s))}px ui-monospace, Menlo, monospace`;
  c.fillText(label, W / 2, H / 2 - 18 * s);
  c.font = `400 ${Math.max(5, Math.round(20 * s))}px ui-monospace, Menlo, monospace`;
  c.fillStyle = '#5d5447';
  c.fillText(sub, W / 2, H / 2 + 22 * s);
  resetCtx(c);
}

// ---------------------------------------------------------------------------
// Loading a film's shot painter
// ---------------------------------------------------------------------------
async function preloadFilmFonts(): Promise<void> {
  if (typeof document === 'undefined') return;
  await filmFontsReady;
  await Promise.all(fontSpecs().map((spec) => document.fonts.load(spec).catch(() => undefined)));
  await document.fonts.ready;
}

/**
 * Load a film's timeline, shot modules and webfonts, and build its ShotSource. `width` is the nominal output
 * width (the type kit's legibility floor is laid out for it: pass the project's render width).
 * Shot files that fail to import paint as placeholder cards, as in the reel.
 */
export async function loadShotSource(slug: string, opts: { width?: number; height?: number; weave?: number } = {}): Promise<FilmShotSource> {
  const [data, mods] = await Promise.all([loadTimeline(slug), loadShotModules(slug)]);
  await preloadFilmFonts();
  return createShotSource({ data, modules: mods.modules, errors: mods.errors, width: opts.width, height: opts.height, weave: opts.weave });
}
