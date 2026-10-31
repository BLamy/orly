/**
 * Lane canvas renderer — owns the timeline <canvas>, its DPR backing store, an offscreen STATIC layer and
 * the redraw scheduling.
 *
 *   const r = new LaneCanvas(canvas, () => inputs)     // inputs read fresh on every paint
 *   r.resize(cssW, cssH, dpr)
 *   r.invalidate()        // content changed: repaint the static layer + overlay on the next frame
 *   r.invalidate(false)   // only the overlay (cursor, play head, hover, guides) changed
 *   r.scene()             // the LaneScene for the current inputs (hit testing between paints)
 *
 * Any number of invalidations within a frame coalesce into one requestAnimationFrame. The static layer
 * (lanes, events, thumbnails, waveforms, ruler) is repainted only when something it shows changed; the
 * per-frame work during playback or hovering is one blit plus a few lines.
 */
import type { AudioEngine, Project, Track, VideoCompositor } from '../../model/types';
import type { EditorUi } from '../../state/store';
import { paintOverlay, paintStatic, type OverlayState } from './draw.ts';
import { layoutTracks, trackMaxLen } from './geometry.ts';
import type { LaneScene, Tab } from './hit.ts';
import { M } from './style.ts';
import { PeakCache, ThumbCache } from './thumbs.ts';

export interface LaneInputs {
  project: Project | null;
  ui: EditorUi;
  scrollY: number;
  /** live track-height overrides (header resize drags) */
  heights: ReadonlyMap<string, number> | null;
  /** selection as a set (the caller memoises it per selection array) */
  selected: ReadonlySet<string>;
  overlay: Omit<OverlayState, 'cursor'>;
}

export class LaneCanvas {
  readonly thumbs: ThumbCache;
  readonly peaks: PeakCache;
  private readonly ctx: CanvasRenderingContext2D | null;
  private readonly layer: HTMLCanvasElement;
  private readonly lctx: CanvasRenderingContext2D | null;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private staticDirty = true;
  private raf = 0;
  private tabs: Tab[] = [];
  private audio: AudioEngine | null = null;
  private maxLens = new WeakMap<Track, number>();
  private disposed = false;
  private unCompositor: (() => void) | null = null;
  private compositor: VideoCompositor | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly inputs: () => LaneInputs,
  ) {
    this.ctx = canvas.getContext('2d');
    this.layer = document.createElement('canvas');
    this.lctx = this.layer.getContext('2d');
    this.thumbs = new ThumbCache(() => this.invalidate());
    this.peaks = new PeakCache(() => this.invalidate());
  }

  setCompositor(c: VideoCompositor | null): void {
    this.unCompositor?.();
    this.unCompositor = null;
    this.thumbs.setCompositor(c);
    this.compositor = c;
    // media that becomes ready (a shot source, an image decode, a video seek) re-asks for the thumbnails it missed
    if (c?.onInvalidate)
      this.unCompositor = c.onInvalidate(() => {
        this.thumbs.mediaReady();
        this.invalidate(); // a shot that just failed to paint is flagged on the timeline
      });
    this.invalidate();
  }

  setAudio(a: AudioEngine | null): void {
    if (a === this.audio) return;
    this.audio = a;
    this.peaks.clear();
    this.invalidate();
  }

  get width(): number {
    return this.w;
  }

  resize(w: number, h: number, dpr: number): void {
    const W = Math.max(1, Math.round(w));
    const H = Math.max(1, Math.round(h));
    if (W === this.w && H === this.h && dpr === this.dpr) return;
    this.w = W;
    this.h = H;
    this.dpr = dpr;
    for (const c of [this.canvas, this.layer]) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    this.canvas.style.width = `${W}px`;
    this.canvas.style.height = `${H}px`;
    this.invalidate();
  }

  invalidate(staticToo = true): void {
    if (this.disposed) return;
    if (staticToo) this.staticDirty = true;
    if (!this.raf) this.raf = requestAnimationFrame(() => this.paint());
  }

  /** the scene for the current inputs (cheap: layout + cached per-track maxima) */
  scene(): LaneScene | null {
    const inp = this.inputs();
    const p = inp.project;
    if (!p || this.w <= 0) return null;
    const { rows } = layoutTracks(p.tracks, inp.heights ?? undefined, M.minTrackH, M.maxTrackH);
    const maxLens = new Map<string, number>();
    for (const tr of p.tracks) {
      let m = this.maxLens.get(tr);
      if (m === undefined) this.maxLens.set(tr, (m = trackMaxLen(tr)));
      maxLens.set(tr.id, m);
    }
    return {
      project: p,
      ui: inp.ui,
      view: { scrollT: inp.ui.scrollT, pxPerSec: inp.ui.pxPerSec, width: this.w },
      height: this.h,
      rows,
      scrollY: inp.scrollY,
      maxLens,
      tabs: this.tabs,
    };
  }

  private paint(): void {
    this.raf = 0;
    const ctx = this.ctx;
    const lctx = this.lctx;
    if (!ctx || !lctx || this.disposed) return;
    const inp = this.inputs();
    const s = this.scene();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (!s) {
      ctx.fillStyle = '#141518';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      return;
    }
    if (this.staticDirty) {
      this.staticDirty = false;
      lctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      const comp = this.compositor;
      this.tabs = paintStatic(lctx, s, inp.selected, { thumbs: this.thumbs, peaks: this.peaks, audio: this.audio, dpr: this.dpr, failed: comp?.failed ? (id) => comp.failed?.(id) ?? false : undefined });
      s.tabs = this.tabs;
    }
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.drawImage(this.layer, 0, 0);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    paintOverlay(ctx, s, { ...inp.overlay, cursor: inp.ui.cursor });
  }

  dispose(): void {
    this.disposed = true;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.unCompositor?.();
    this.unCompositor = null;
    this.thumbs.dispose();
    this.peaks.dispose();
  }
}
