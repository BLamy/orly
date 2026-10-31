/**
 * Timeline media caches — shot/picture thumbnails painted lazily in idle time, and waveform peaks.
 *
 *   const thumbs = new ThumbCache(() => redraw())
 *   thumbs.setCompositor(compositor)
 *   thumbs.beginFrame()                                  // once per lane paint: older requests go stale
 *   thumbs.get(mediaId, src, w, h, priority)             -> cached canvas, or null (and it is queued)
 *   thumbs.setBusy(playing)                              // throttle to one paint per idle slot during playback
 *   thumbs.mediaReady()                                  // the compositor's onInvalidate: retry misses now
 *
 *   const waves = new PeakCache(() => redraw())
 *   waves.get(audio, mediaId, src0, src1, buckets)       -> Float32Array | null (null: not decoded yet; re-polled
 *                                                          with back-off until the engine has it)
 *
 * Thumbnails are procedural shot paints (the film engine at low resolution), each costing a few ms, so
 * they never run inside a paint: a lane paint asks for what it can see, misses go to a queue, and the
 * queue drains in requestIdleCallback slices (setTimeout where that is missing), most important first
 * (the head frame of each event), dropping requests that scrolled out of view. Each finished thumbnail
 * is copied into a canvas we own (the compositor may reuse its own) and kept in an LRU.
 *
 * A null from the compositor means its media is not ready yet (an image decoding, a video seeking, a shot source
 * still loading). Such a miss is retried when the compositor says media became ready (mediaReady, wired to its
 * onInvalidate by the renderer) and, as a fallback, on a timer — so a thumbnail never stays missing until some
 * unrelated repaint happens to ask again.
 */
import type { AudioEngine, VideoCompositor } from '../../model/types';

const THUMB_CAP = 900;
/** how long to wait before asking again for a thumbnail the compositor could not make yet */
const RETRY_MS = 1500;

interface Request {
  key: string;
  mediaId: string;
  src: number;
  w: number;
  h: number;
  priority: number;
  gen: number;
}

type IdleDeadlineLike = { timeRemaining(): number };
type IdleHandle = { cancel(): void };

function requestIdle(cb: (d: IdleDeadlineLike) => void): IdleHandle {
  const w = globalThis as typeof globalThis & {
    requestIdleCallback?: (cb: (d: IdleDeadlineLike) => void, o?: { timeout: number }) => number;
    cancelIdleCallback?: (h: number) => void;
  };
  if (w.requestIdleCallback && w.cancelIdleCallback) {
    const h = w.requestIdleCallback(cb, { timeout: 250 });
    const cancel = w.cancelIdleCallback;
    return { cancel: () => cancel(h) };
  }
  const start = performance.now();
  const h = setTimeout(() => cb({ timeRemaining: () => Math.max(0, 10 - (performance.now() - start - 24)) }), 24);
  return { cancel: () => clearTimeout(h) };
}

/** quantise a thumbnail height so nearby track heights share cache entries */
export function thumbHeight(h: number): number {
  const steps = [20, 28, 36, 48, 64, 84, 110, 144, 190, 250];
  for (const s of steps) if (h <= s) return s;
  return steps[steps.length - 1];
}

export class ThumbCache {
  private compositor: VideoCompositor | null = null;
  private cache = new Map<string, HTMLCanvasElement>();
  private failed = new Map<string, number>();
  private queue = new Map<string, Request>();
  private gen = 0;
  private idle: IdleHandle | null = null;
  private busy = false;
  private disposed = false;
  private retry: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly onReady: () => void) {}

  setCompositor(c: VideoCompositor | null): void {
    if (c === this.compositor) return;
    this.compositor = c;
    this.cache.clear();
    this.failed.clear();
    this.queue.clear();
  }

  /** throttle while the preview is playing (it needs the main thread more than we do) */
  setBusy(b: boolean): void {
    this.busy = b;
  }

  beginFrame(): void {
    this.gen++;
  }

  /** media became ready somewhere (compositor onInvalidate): forget the misses so the next paint asks again */
  mediaReady(): void {
    if (!this.failed.size) return;
    this.failed.clear();
    this.onReady();
  }

  /**
   * A thumbnail of `mediaId` at source time `src`, `w`×`h` device px. Returns the cached canvas or null;
   * on a miss the paint is queued (lower `priority` runs first) and onReady fires when it lands.
   */
  get(mediaId: string, src: number, w: number, h: number, priority: number): HTMLCanvasElement | null {
    if (!this.compositor) return null;
    const key = `${mediaId}|${src.toFixed(3)}|${w}x${h}`;
    const hit = this.cache.get(key);
    if (hit) {
      // LRU bump
      this.cache.delete(key);
      this.cache.set(key, hit);
      return hit;
    }
    const failedAt = this.failed.get(key);
    if (failedAt != null && performance.now() - failedAt < RETRY_MS) return null;
    const q = this.queue.get(key);
    if (q) {
      q.gen = this.gen;
      q.priority = Math.min(q.priority, priority);
    } else {
      this.queue.set(key, { key, mediaId, src, w, h, priority, gen: this.gen });
    }
    this.schedule();
    return null;
  }

  private schedule(): void {
    if (this.idle || this.disposed || this.queue.size === 0) return;
    this.idle = requestIdle((d) => this.drain(d));
  }

  private drain(deadline: IdleDeadlineLike): void {
    this.idle = null;
    const c = this.compositor;
    if (!c || this.disposed) return;
    // only what the last two paints asked for is still wanted
    for (const [k, r] of this.queue) if (r.gen < this.gen - 1) this.queue.delete(k);
    const pending = [...this.queue.values()].sort((a, b) => a.priority - b.priority);
    let made = 0;
    for (const r of pending) {
      if (made > 0 && (this.busy || deadline.timeRemaining() < 6)) break;
      this.queue.delete(r.key);
      let out: HTMLCanvasElement | null = null;
      try {
        const src = c.thumbnail(r.mediaId, r.src, r.w, r.h);
        if (src) {
          out = document.createElement('canvas');
          out.width = r.w;
          out.height = r.h;
          out.getContext('2d')?.drawImage(src, 0, 0, r.w, r.h);
        }
      } catch {
        out = null;
      }
      if (out) {
        this.cache.set(r.key, out);
        this.failed.delete(r.key);
        if (this.cache.size > THUMB_CAP) {
          const oldest = this.cache.keys().next().value;
          if (oldest !== undefined) this.cache.delete(oldest);
        }
      } else {
        this.failed.set(r.key, performance.now());
      }
      made++;
    }
    if (made > 0) this.onReady();
    // misses ask again after RETRY_MS even if the compositor never signals (a repaint re-requests what is visible)
    if (this.failed.size && !this.retry && !this.disposed) {
      this.retry = setTimeout(() => {
        this.retry = null;
        if (!this.disposed) this.onReady();
      }, RETRY_MS);
    }
    this.schedule();
  }

  dispose(): void {
    this.disposed = true;
    this.idle?.cancel();
    this.idle = null;
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    this.cache.clear();
    this.queue.clear();
  }
}

/**
 * Waveform peaks per (media, source window, column count). `audio.peaks` is cheap once a file is decoded
 * but is called for every visible event on every lane paint, so results are memoised for the current view;
 * a null (still decoding) is re-polled on a timer until the engine has it.
 */
export class PeakCache {
  private cache = new Map<string, Float32Array>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  /** consecutive polls that still found something undecoded (backs the poll off: 0.4 s → 6 s) */
  private misses = 0;

  constructor(private readonly onReady: () => void) {}

  get(audio: AudioEngine | null, mediaId: string, src0: number, src1: number, buckets: number): Float32Array | null {
    if (!audio || buckets <= 0 || !(src1 > src0)) return null;
    const key = `${mediaId}|${src0.toFixed(4)}|${src1.toFixed(4)}|${buckets}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    let out: Float32Array | null = null;
    try {
      out = audio.peaks(mediaId, src0, src1, buckets);
    } catch {
      out = null;
    }
    if (!out) {
      this.poll();
      return null;
    }
    this.misses = 0;
    if (this.cache.size > 600) this.cache.clear();
    this.cache.set(key, out);
    return out;
  }

  /** forget everything (new project / new engine) */
  clear(): void {
    this.cache.clear();
    this.misses = 0;
  }

  private poll(): void {
    if (this.timer) return;
    const delay = Math.min(6000, 400 * 1.5 ** this.misses++);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.onReady();
    }, delay);
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.cache.clear();
  }
}
