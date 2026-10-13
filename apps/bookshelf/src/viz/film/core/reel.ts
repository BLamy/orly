/**
 * The reel: film time → active shot(s) → pixels.
 *
 *   const reel = createReel({ data, modules, errors, width: 1920, height: 1080 });
 *   reel.at(t)            -> { a, la, b?, lb?, u?, kind? }  active shots + shot-local times
 *   reel.render(t, sceneCtx, finishCtx?) -> { overlays, ms, ... }
 *
 *   const src = createShotSource({ data, modules, errors, width })   // the film editor's ShotSource
 *   src.paint(shotId, local, ctx, t) -> { overlay?, placeholder, ms }  one shot, any time, any canvas size
 *
 * Transitions straddle the cut (ARCHITECTURE §4): a transitionIn of duration d on shot B
 * paints A on [B.start − d/2, B.start + d/2] (A's local time runs past its end; timelines
 * clamp, fog/flicker keep moving) and B from B.start − d/2 (negative local time). Each
 * active shot renders into its own offscreen canvas; the registered TransitionFn composites
 * them. Then the registered finish pass (registry.setFinish) runs on the scene canvas, and
 * the finish-overlay pass (setFinishOverlay) on the transparent top canvas.
 *
 * A shot with no module (not authored yet) renders as a parchment PLACEHOLDER card — id,
 * chapter, setting/visual (extra fields copied into timeline.json shots, optional), the
 * current narration line with the spoken word marked — so a film is always previewable.
 * A shot whose build/paint throws renders the same card with the error.
 */
import type { ReactNode } from 'react';
import type { FilmTimelineData, LineTiming, MoodId, Palette, ShotContext, ShotModule, ShotScene, ShotTiming, ShotTimingData } from '../contracts';
import { FILM_H, FILM_W } from '../contracts';
import { MOODS, mood as getMood, withAlpha, mixLab } from '../silhouette/palette';
import { createFrame } from './frame';
import { defaultTransitionDur, getFinish, getFinishOverlay, getTransition } from './registry';
import { lineAt, shotTiming, wordIndexAt } from './timing';
import { paintTerms } from './terms';
import { setPaintContext, takeOverlays } from './paintContext';
import { setTypeFrameScale } from '../silhouette/type';
import type { ShotSource } from '../../../editor/model/types';

/** optional per-shot metadata the pipeline may copy into timeline.json (not in the contract) */
export type ShotMeta = ShotTimingData & { setting?: string; visual?: string; kind?: string; era?: string };

export interface ReelShot {
  id: string;
  index: number;
  start: number;
  end: number;
  data: ShotMeta;
  timing: ShotTiming;
  ctx: ShotContext;
  mod?: ShotModule;
  loadError?: string;
  /** transition INTO this shot */
  trans: { kind: string; dur: number };
}

export interface ReelAt {
  a: ReelShot;
  la: number;
  b?: ReelShot;
  lb?: number;
  u?: number;
  kind?: string;
}

export interface ReelOverlay {
  id: string;
  node: ReactNode;
  opacity: number;
}

export interface ReelRenderInfo {
  t: number;
  frame: number;
  shots: { id: string; local: number }[];
  u?: number;
  kind?: string;
  overlays: ReelOverlay[];
  /** paint time of this frame (ms) */
  ms: number;
  placeholder: boolean;
}

export interface Reel {
  slug: string;
  fps: number;
  duration: number;
  width: number;
  height: number;
  pxScale: number;
  shots: ReelShot[];
  data: FilmTimelineData;
  at(t: number): ReelAt;
  render(t: number, scene: CanvasRenderingContext2D, finish?: CanvasRenderingContext2D | null): ReelRenderInfo;
}

export interface CreateReelOpts {
  data: FilmTimelineData;
  modules: Record<string, ShotModule>;
  errors?: Record<string, string>;
  width?: number;
  height?: number;
  /** run the registered finish passes (default true) */
  finish?: boolean;
  /** gate weave multiplier (default 1) */
  weave?: number;
}

/** FNV-1a → positive 31-bit seed */
export function seedOf(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
  return (h >>> 1) || 1;
}

function makeBuf(w: number, h: number): CanvasRenderingContext2D {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  return cv.getContext('2d')!;
}

const errorLogged = new Set<string>();

/** the palette a shot paints in (module mood, then the timeline's, then the kit default) */
function shotMood(s: ReelShot): Palette {
  return getMood((s.mod?.mood ?? s.data.mood ?? 'duskRose') as MoodId);
}

/** timeline shots → ReelShots (timing, seeded context, module, transition into each); transitions are not yet clamped */
function reelShots(data: FilmTimelineData, modules: Record<string, ShotModule>, errors?: Record<string, string>): ReelShot[] {
  const fps = data.fps || 24;
  return data.shots.map((d, index) => {
    const timing = shotTiming(d);
    const kind = index === 0 ? 'cut' : d.transitionIn ?? 'cut';
    const dur = kind === 'cut' ? 0 : d.transitionDur ?? defaultTransitionDur(kind);
    return {
      id: d.id,
      index,
      start: d.start,
      end: d.end,
      data: d as ShotMeta,
      timing,
      ctx: { timing, fps, seed: seedOf(`${data.slug}/${d.id}`) },
      mod: modules[d.id],
      loadError: errors?.[d.id],
      trans: { kind, dur },
    };
  });
}

type ShotPainter = (s: ReelShot, local: number, c: CanvasRenderingContext2D, t: number, pxScale: number) => { overlay: ReactNode; placeholder: boolean };

/** The per-shot paint shared by the reel and the editor's shot source: one shot at shot-local `local` into a
 *  device-res context at `pxScale` device px per stage px. `t` is film/timeline time (grain/weave/frame seeds).
 *  Returns the shot's SVG overlay and whether a placeholder card was painted instead. */
function createShotPainter(fps: number, weave?: number): ShotPainter {
  return (s, local, c, t, pxScale) => {
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.filter = 'none';
    const m = shotMood(s);
    c.fillStyle = m.fg;
    c.fillRect(0, 0, c.canvas.width, c.canvas.height);
    if (s.mod) {
      try {
        const scene = s.mod.build(s.ctx) as ShotScene;
        const st = scene.tl.sample(local);
        const f = createFrame({ c, pxScale, t: local, fps, frame: Math.round(t * fps), seed: s.ctx.seed, mood: m, weave, weaveT: t });
        setPaintContext({ shotId: s.id, timing: s.timing });
        takeOverlays();
        try {
          s.mod.paint(f, st, scene, s.ctx);
          // screen-locked kit overlays queued during the paint (stage px)
          const q = takeOverlays();
          if (q.length) {
            c.save();
            c.setTransform(pxScale, 0, 0, pxScale, 0, 0);
            c.globalAlpha = 1;
            c.globalCompositeOperation = 'source-over';
            c.filter = 'none';
            for (const fn of q) fn(c);
            c.restore();
          }
        } finally {
          setPaintContext(null);
        }
        let overlay: ReactNode = null;
        if (s.mod.overlay) overlay = s.mod.overlay(st, scene, s.ctx);
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
        c.filter = 'none';
        return { overlay, placeholder: false };
      } catch (e) {
        const msg = String((e as Error)?.message ?? e);
        if (!errorLogged.has(s.id + msg)) {
          errorLogged.add(s.id + msg);
          console.error(`[film] shot ${s.id} failed at t=${local.toFixed(2)}`, e);
        }
        paintPlaceholder(c, pxScale, s, local, msg);
        return { overlay: null, placeholder: true };
      }
    }
    paintPlaceholder(c, pxScale, s, local, s.loadError);
    return { overlay: null, placeholder: true };
  };
}

export function createReel(o: CreateReelOpts): Reel {
  const data = o.data;
  const width = o.width ?? 1920;
  const height = o.height ?? Math.round((width * FILM_H) / FILM_W);
  const pxScale = width / FILM_W;
  setTypeFrameScale(pxScale); // the type kit's legibility floor is measured on this frame size
  const fps = data.fps || 24;
  const shots = reelShots(data, o.modules, o.errors);
  // a transition can't be longer than either neighbour
  for (let i = 1; i < shots.length; i++) {
    const s = shots[i];
    s.trans.dur = Math.min(s.trans.dur, (s.end - s.start) * 0.9, (shots[i - 1].end - shots[i - 1].start) * 0.9);
  }
  const duration = data.duration || (shots.length ? shots[shots.length - 1].end : 0);

  const find = (t: number): number => {
    let lo = 0, hi = shots.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (shots[mid].start <= t) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  };

  const at = (t: number): ReelAt => {
    const tt = Math.max(0, Math.min(t, duration));
    const i = find(tt);
    const s = shots[i];
    const half = s.trans.dur / 2;
    if (i > 0 && half > 0 && tt - s.start < half) {
      const p = shots[i - 1];
      return { a: p, la: tt - p.start, b: s, lb: tt - s.start, u: (tt - (s.start - half)) / s.trans.dur, kind: s.trans.kind };
    }
    const n = shots[i + 1];
    if (n && n.trans.dur > 0 && n.start - tt < n.trans.dur / 2) {
      return { a: s, la: tt - s.start, b: n, lb: tt - n.start, u: (tt - (n.start - n.trans.dur / 2)) / n.trans.dur, kind: n.trans.kind };
    }
    return { a: s, la: tt - s.start };
  };

  let bufA: CanvasRenderingContext2D | null = null;
  let bufB: CanvasRenderingContext2D | null = null;

  const painter = createShotPainter(fps, o.weave);
  const paintShot = (s: ReelShot, local: number, c: CanvasRenderingContext2D, t: number) => painter(s, local, c, t, pxScale);

  const render = (t: number, scene: CanvasRenderingContext2D, finishCtx?: CanvasRenderingContext2D | null): ReelRenderInfo => {
    const t0 = performance.now();
    const tt = Math.max(0, Math.min(t, duration));
    const A = at(tt);
    const frame = Math.round(tt * fps);
    const overlays: ReelOverlay[] = [];
    let placeholder = false;
    if (scene.canvas.width !== width || scene.canvas.height !== height) {
      scene.canvas.width = width;
      scene.canvas.height = height;
    }
    if (!A.b || A.u == null) {
      const r = paintShot(A.a, A.la, scene, tt);
      placeholder = r.placeholder;
      if (r.overlay) overlays.push({ id: A.a.id, node: r.overlay, opacity: 1 });
    } else {
      if (!bufA || bufA.canvas.width !== width || bufA.canvas.height !== height) {
        bufA = makeBuf(width, height);
        bufB = makeBuf(width, height);
      }
      const ra = paintShot(A.a, A.la, bufA, tt);
      const rb = paintShot(A.b, A.lb!, bufB!, tt);
      placeholder = ra.placeholder || rb.placeholder;
      const u = Math.max(0, Math.min(1, A.u));
      scene.setTransform(pxScale, 0, 0, pxScale, 0, 0);
      scene.globalAlpha = 1;
      scene.globalCompositeOperation = 'source-over';
      scene.filter = 'none';
      getTransition(A.kind)(scene, bufA.canvas, bufB!.canvas, u, {
        W: FILM_W,
        H: FILM_H,
        pxScale,
        seed: A.b.ctx.seed,
        frame,
        mood: shotMood(A.b),
      });
      if (ra.overlay) overlays.push({ id: A.a.id, node: ra.overlay, opacity: A.kind === 'cut' ? +(u < 0.5) : 1 - u });
      if (rb.overlay) overlays.push({ id: A.b.id, node: rb.overlay, opacity: A.kind === 'cut' ? +(u >= 0.5) : u });
    }
    const cur = A.b && (A.u ?? 0) >= 0.5 ? A.b : A.a;
    // glossary tags (timeline shot.terms): film-level, over the composited shot, under the finish pass
    {
      const curLocal = cur === A.a ? A.la : A.lb!;
      const terms = (cur.data as ShotMeta & { terms?: { text: string; gloss?: string; at: number; until: number }[] }).terms;
      if (terms?.length) {
        scene.setTransform(pxScale, 0, 0, pxScale, 0, 0);
        scene.globalAlpha = 1;
        scene.globalCompositeOperation = 'source-over';
        scene.filter = 'none';
        paintTerms(scene, terms, curLocal, shotMood(cur));
      }
    }
    const fenv = { W: FILM_W, H: FILM_H, pxScale, frame, t: tt, seed: seedOf(data.slug), mood: shotMood(cur) };
    if (o.finish !== false) {
      const fin = getFinish();
      if (fin) {
        scene.setTransform(pxScale, 0, 0, pxScale, 0, 0);
        scene.globalAlpha = 1;
        scene.globalCompositeOperation = 'source-over';
        fin(scene, fenv);
      }
      if (finishCtx) {
        if (finishCtx.canvas.width !== width || finishCtx.canvas.height !== height) {
          finishCtx.canvas.width = width;
          finishCtx.canvas.height = height;
        }
        finishCtx.setTransform(1, 0, 0, 1, 0, 0);
        finishCtx.clearRect(0, 0, width, height);
        const fo = getFinishOverlay();
        if (fo) {
          finishCtx.setTransform(pxScale, 0, 0, pxScale, 0, 0);
          fo(finishCtx, fenv);
        }
      }
    }
    scene.setTransform(1, 0, 0, 1, 0, 0);
    const shotsOut = [{ id: A.a.id, local: A.la }];
    if (A.b) shotsOut.push({ id: A.b.id, local: A.lb! });
    return { t: tt, frame, shots: shotsOut, u: A.u, kind: A.kind, overlays, ms: performance.now() - t0, placeholder };
  };

  return { slug: data.slug, fps, duration, width, height, pxScale, shots, data, at, render };
}

// ---------------------------------------------------------------------------
// Shot source (the film editor paints shots one at a time, at any source time)
// ---------------------------------------------------------------------------
export interface CreateShotSourceOpts {
  data: FilmTimelineData;
  modules: Record<string, ShotModule>;
  errors?: Record<string, string>;
  /** nominal output frame (device px). Sets the type kit's legibility floor, so every paint size (preview,
   *  thumbnail) lays type out exactly like the render at this size. Default 1920 wide. */
  width?: number;
  height?: number;
  /** gate weave multiplier (default 1) */
  weave?: number;
  /** paint the film's glossary tags (shot.terms) over each shot (default true). The reel paints them once over
   *  the composite; a shot source carries them with the shot, so a moved or re-timed shot keeps its tag. */
  terms?: boolean;
}

/** A ShotSource bound to one film, plus what the editor's compositor needs to reproduce the reel exactly. */
export interface FilmShotSource extends ShotSource {
  readonly slug: string;
  readonly fps: number;
  /** the shot's mood id (palette for transitions and the finish pass) */
  moodId(shotId: string): string;
  /** the shot's seed (transition noise fields), as the reel derives it */
  seed(shotId: string): number;
}

/**
 * The reel's per-shot painter without the reel's clock: paint any shot of the film at any shot-local time into
 * any device-res context (pxScale = canvas width / 1280). Pixel-identical to a reel frame of the same shot at
 * the same time (outside transitions and term tags, which the reel composites at film level).
 */
export function createShotSource(o: CreateShotSourceOpts): FilmShotSource {
  const data = o.data;
  const fps = data.fps || 24;
  const framePx = (o.width ?? 1920) / FILM_W;
  const shots = reelShots(data, o.modules, o.errors);
  const byId = new Map(shots.map((s) => [s.id, s]));
  const painter = createShotPainter(fps, o.weave);
  const withTerms = o.terms !== false;
  return {
    slug: data.slug,
    fps,
    has: (id) => byId.has(id),
    duration: (id) => {
      const s = byId.get(id);
      return s ? s.end - s.start : 0;
    },
    moodId: (id) => {
      const s = byId.get(id);
      return s ? shotMood(s).id : 'duskRose';
    },
    seed: (id) => byId.get(id)?.ctx.seed ?? seedOf(`${data.slug}/${id}`),
    paint(id, local, c, t) {
      const t0 = performance.now();
      const pxScale = c.canvas.width / FILM_W;
      setTypeFrameScale(framePx); // shared kit state: another reel/source may have set its own
      const s = byId.get(id);
      if (!s) {
        const d: ShotMeta = { id, chapter: '', start: 0, end: 0, lines: [], beats: {} };
        paintPlaceholder(c, pxScale, { id, data: d, timing: shotTiming(d) }, local, `shot "${id}" is not in the ${data.slug} timeline`);
        return { placeholder: true, ms: performance.now() - t0 };
      }
      const r = painter(s, local, c, t, pxScale);
      if (withTerms && s.data.terms?.length) {
        c.setTransform(pxScale, 0, 0, pxScale, 0, 0);
        c.globalAlpha = 1;
        c.globalCompositeOperation = 'source-over';
        c.filter = 'none';
        paintTerms(c, s.data.terms, local, shotMood(s));
        c.setTransform(1, 0, 0, 1, 0, 0);
      }
      return { overlay: r.overlay ?? undefined, placeholder: r.placeholder, ms: performance.now() - t0 };
    },
  };
}

// ---------------------------------------------------------------------------
// Placeholder card (parchment)
// ---------------------------------------------------------------------------
const SERIF = '"Cormorant Garamond", "EB Garamond", Garamond, Georgia, serif';

function wrap(c: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const w of text.split(/\s+/).filter(Boolean)) {
    const next = cur ? `${cur} ${w}` : w;
    if (c.measureText(next).width > maxW && cur) {
      out.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

const tc = (s: number) => {
  const m = Math.floor(Math.max(0, s) / 60);
  return `${m}:${(Math.max(0, s) - m * 60).toFixed(2).padStart(5, '0')}`;
};

/** The parchment card for an unauthored (or failing) shot. c: device-res context. */
export function paintPlaceholder(c: CanvasRenderingContext2D, pxScale: number, s: Pick<ReelShot, 'id' | 'data' | 'timing'>, local: number, error?: string): void {
  const P = MOODS.parchment;
  const W = FILM_W, H = FILM_H;
  c.setTransform(pxScale, 0, 0, pxScale, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.filter = 'none';
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, P.sky[0]);
  g.addColorStop(0.55, P.sky[1]);
  g.addColorStop(1, P.sky[3]);
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  // foxed edges
  const v = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  v.addColorStop(0, withAlpha(P.set, 0));
  v.addColorStop(1, withAlpha(P.set, 0.55));
  c.fillStyle = v;
  c.fillRect(0, 0, W, H);
  const ink = P.ink;
  const faint = mixLab(P.ink, P.sky[1], 0.55);
  // double rule
  c.strokeStyle = withAlpha(ink, 0.7);
  c.lineWidth = 1.6;
  c.strokeRect(40, 40, W - 80, H - 80);
  c.lineWidth = 0.7;
  c.strokeRect(48, 48, W - 96, H - 96);
  // corner fleurons
  c.fillStyle = withAlpha(ink, 0.7);
  for (const [x, y] of [[48, 48], [W - 48, 48], [48, H - 48], [W - 48, H - 48]] as const) {
    c.beginPath();
    c.moveTo(x, y - 7);
    c.lineTo(x + 7, y);
    c.lineTo(x, y + 7);
    c.lineTo(x - 7, y);
    c.closePath();
    c.fill();
  }
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillStyle = error ? '#7a2418' : faint;
  c.font = `600 15px ${SERIF}`;
  const label = error ? 'SHOT FAILED TO PAINT' : 'SHOT NOT YET AUTHORED';
  c.fillText(label.split('').join(' '), W / 2, 104);
  c.fillStyle = ink;
  c.font = `500 64px ${SERIF}`;
  c.fillText(s.id, W / 2, 178);
  const d = s.data as ShotMeta;
  c.font = `italic 400 22px ${SERIF}`;
  c.fillStyle = faint;
  const sub = [d.chapter && `chapter ${d.chapter}`, d.kind, d.mood, d.era].filter(Boolean).join('  ·  ');
  c.fillText(sub, W / 2, 214);
  // ornament rule
  c.strokeStyle = withAlpha(ink, 0.5);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(W / 2 - 160, 236);
  c.lineTo(W / 2 - 12, 236);
  c.moveTo(W / 2 + 12, 236);
  c.lineTo(W / 2 + 160, 236);
  c.stroke();
  c.beginPath();
  c.arc(W / 2, 236, 3.2, 0, Math.PI * 2);
  c.fillStyle = withAlpha(ink, 0.6);
  c.fill();
  let y = 278;
  if (d.setting) {
    c.font = `600 26px ${SERIF}`;
    c.fillStyle = ink;
    for (const l of wrap(c, d.setting, 920).slice(0, 2)) {
      c.fillText(l, W / 2, y);
      y += 32;
    }
    y += 6;
  }
  const body = error ?? d.visual;
  if (body) {
    c.font = error ? `500 17px ui-monospace, Menlo, monospace` : `400 20px ${SERIF}`;
    c.fillStyle = error ? '#7a2418' : withAlpha(ink, 0.8);
    for (const l of wrap(c, body, 940).slice(0, error ? 6 : 5)) {
      c.fillText(l, W / 2, y);
      y += error ? 24 : 27;
    }
  }
  // narration (karaoke)
  const line: LineTiming | undefined = lineAt(s.timing, local);
  if (line) {
    c.font = `italic 500 30px ${SERIF}`;
    const rows = wrap(c, line.text, 980).slice(0, 3);
    const wi = line.words.length ? wordIndexAt(line, local) : -1;
    let k = 0;
    let ly = H - 112 - (rows.length - 1) * 38;
    c.textAlign = 'left';
    for (const row of rows) {
      const rw = c.measureText(row).width;
      let x = W / 2 - rw / 2;
      for (const w of row.split(' ')) {
        const spoken = local > line.end || k <= wi;
        c.fillStyle = spoken ? ink : withAlpha(ink, 0.32);
        c.fillText(w, x, ly);
        const ww = c.measureText(w).width;
        if (k === wi && local <= line.end) {
          c.fillRect(x, ly + 6, ww, 1.6);
        }
        x += ww + c.measureText(' ').width;
        k++;
      }
      ly += 38;
    }
    c.textAlign = 'center';
    c.font = `500 13px ui-monospace, Menlo, monospace`;
    c.fillStyle = faint;
    c.fillText(line.id, W / 2, H - 150 - (rows.length - 1) * 38);
  }
  // progress
  const dur = s.timing.duration || 1;
  const u = Math.max(0, Math.min(1, local / dur));
  c.fillStyle = withAlpha(ink, 0.18);
  c.fillRect(120, H - 72, W - 240, 2);
  c.fillStyle = withAlpha(ink, 0.75);
  c.fillRect(120, H - 72, (W - 240) * u, 2);
  c.font = `500 13px ui-monospace, Menlo, monospace`;
  c.textAlign = 'left';
  c.fillText(tc(local), 120, H - 54);
  c.textAlign = 'right';
  c.fillText(tc(dur), W - 120, H - 54);
  c.textAlign = 'left';
  c.setTransform(1, 0, 0, 1, 0, 0);
}
