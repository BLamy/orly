/**
 * neural-net-history — small helpers shared by ch06-s01 … ch06-s05 (one animator's group, chapter 6 "The Quiet Years").
 *
 *   clamp01 / sm / lerp / win / tq12 / mixCam / camPath / easeIO / h01 / bake / typedLine   (re-exported from ch03-s01-kit)
 *   screenSpace(c, layer, cam, draw)    inside f.layer(...), draw in SCREEN stage px (undo the layer's parallax transform),
 *                                       e.g. a teaching machine that must hold a fixed screen box during a dissolve
 *   screenPass(f, draw)                 a screen-locked pass on f.c in stage px (type, veils), after the layers
 *   monoLabel(c, text, x, y, o)         an IBM Plex Mono caption (≥ 18.5 stage px) on a feathered ink plate, alpha-able
 *   inkVeil(f, a, col?)                 a full-frame veil (a dissolve to dark / an in-shot fade)
 *   paperTone(env, light)               lamp-lit paper (shadowed → lit), from the mood's ladder
 *   scribble(c, x, y, w, seed, o)       a handwritten scrawl (illegible on purpose: texture, not text)
 */
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film/contracts';
import { layerXform } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, drawTracked, measureTracked, softPlate } from '../../../film/silhouette/type';
import { h01 } from './ch03-s01-kit';

export { clamp01, sm, lerp, win, tq12, mixCam, camPath, easeIO, h01, bake, typedLine, monotone, linear } from './ch03-s01-kit';
export type { CamKey } from './ch03-s01-kit';

type C = CanvasRenderingContext2D;

/** draw in screen stage px from inside a layer callback (the layer transform is undone, then restored) */
export function screenSpace(c: C, layer: Pick<LayerSpec, 'z'>, cam: Camera3, draw: (c: C) => void) {
  const m = layerXform(layer, cam);
  c.save();
  c.scale(1 / m.k, 1 / m.k);
  c.translate(-m.tx, -m.ty);
  draw(c);
  c.restore();
}

/** a screen-locked pass on the composed frame, in stage px */
export function screenPass(f: Frame, draw: (c: C) => void) {
  const c = f.c;
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  draw(c);
  c.restore();
}

export function inkVeil(f: Frame, a: number, col?: string) {
  if (a <= 0.002) return;
  screenPass(f, (c) => {
    c.globalAlpha = Math.min(1, a);
    c.fillStyle = col ?? f.mood.fg;
    c.fillRect(-4, -4, 1288, 728);
  });
}

/** lamp-lit paper: from paper in shadow (set/setHaze) to paper under the lamp (halo→rim) */
export function paperTone(env: { mood: PaintEnv['mood'] }, light: number) {
  const m = env.mood;
  const lit = mixLab(m.halo, m.rim, 0.62);
  const u = Math.max(0, Math.min(1, light));
  return mixLab(mixLab(m.set, m.setHaze, 0.6), lit, 0.12 + u * 0.88);
}

/** a mono caption on a soft plate (screen px). Returns the text width. */
export function monoLabel(
  c: C,
  text: string,
  x: number,
  y: number,
  o: { mood: PaintEnv['mood']; a: number; size?: number; align?: 'left' | 'center' | 'right'; color?: string; plate?: number; tracking?: number },
): number {
  if (o.a <= 0.003) return 0;
  const size = o.size ?? 19;
  const font = `500 ${size}px ${FONT.mono}`;
  const tracking = o.tracking ?? 0.06;
  const w = measureTracked(c, text, { font, size, tracking });
  const align = o.align ?? 'left';
  const cx = align === 'center' ? x : align === 'right' ? x - w / 2 : x + w / 2;
  c.save();
  c.globalAlpha = o.a;
  if ((o.plate ?? 0.55) > 0) softPlate(c, cx, y - size * 0.35, w + 150, size + 64, o.mood.ink, o.plate ?? 0.55);
  c.fillStyle = o.color ?? mixLab('#efe4cf', o.mood.core, 0.25);
  drawTracked(c, text, x, y, { font, size, tracking, align });
  c.restore();
  return w;
}

/** a handwritten scrawl (pen strokes, illegible on purpose) across width w, baseline y */
export function scribble(c: C, x: number, y: number, w: number, seed: number, o: { color: string; lw?: number; h?: number; u?: number }) {
  const h = o.h ?? 10;
  const n = Math.max(4, Math.round(w / (h * 0.9)));
  const u = o.u ?? 1;
  c.save();
  c.strokeStyle = o.color;
  c.lineWidth = o.lw ?? 1.4;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  const last = Math.floor(n * 6 * u);
  let k = 0;
  for (let i = 0; i < n && k <= last; i++) {
    const x0 = x + (i / n) * w;
    const gap = h01(i, seed) < 0.18;
    for (let j = 0; j < 6 && k <= last; j++, k++) {
      const px = x0 + (j / 6) * (w / n) * 1.1;
      const py = y - h * (0.15 + 0.8 * h01(i * 7 + j, seed + 3)) * (j % 2 ? 1 : 0.35);
      if (j === 0 && (i === 0 || gap)) c.moveTo(px, py);
      else c.lineTo(px, py);
    }
  }
  c.stroke();
  c.restore();
}

export const PLEX = FONT.mono;
export { withAlpha, mixLab };
