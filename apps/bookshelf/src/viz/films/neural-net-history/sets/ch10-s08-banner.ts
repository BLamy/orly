/**
 * neural-net-history — the nine-word banner shared by ch10-s08 (eight heads) and ch10-s09 (clock faces), so the cut
 * between them is invisible: the example sentence from Google's 2017 Transformer announcement, its HAND-SET head
 * table (ILLUSTRATIVE), the head hues, the banner geometry (a sagging cord between two posts), and s08's end camera.
 */
import { color as d3color, hcl } from 'd3';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { LAYERS, mixLab, overscan, withAlpha } from '../../../film';
import { headHues } from '../../../film/silhouette/metaphors/kit';
import { ink, kMirror, mirrorLoop, nearPost, slipWidth, vNote } from './ch10-s06-kit';

export const WORDS = ['I', 'arrived', 'at', 'the', 'bank', 'after', 'crossing', 'the', 'river'];
export const BANK = 4;
export const N = WORDS.length;
/** HAND-SET weights for 'bank' (head 1), from the script; sums to 1 */
export const H1 = [0.03, 0.06, 0.04, 0.04, 0.08, 0.03, 0.1, 0.04, 0.58];
/** the hand-built head table: named slips take the share given, the rest spread evenly (each row sums to 1) */
function row(named: Record<number, number>): number[] {
  const taken = Object.values(named).reduce((a, b) => a + b, 0);
  const rest = (1 - taken) / (N - Object.keys(named).length);
  return WORDS.map((_, j) => named[j] ?? rest);
}
export const HEADS = [H1, row({ 3: 0.7 }), row({ 1: 0.45, 6: 0.35 }), row({ 0: 0.65 })];
export const HEAD_Q = ['what am I?', 'what came just before?', 'what was done?', 'who did it?'];
/** the kit's head hues, with head 4 moved to a low-chroma violet ≥ 90° of hue away from head 1's cyan */
export function hues4(m: Parameters<typeof headHues>[0]): string[] {
  const out = headHues(m, 4);
  const base = hcl(m.rim);
  const h = hcl((base.h || 200) + 100, Math.max(24, base.c * 0.9), base.l);
  const col = d3color(h.toString());
  out[3] = col && col.displayable() ? col.formatHex() : (d3color(hcl(h.h, h.c * 0.7, h.l).toString())?.formatHex() ?? out[3]);
  return out;
}
/**
 * The film's head colours for the legend and threads: hues4 with head 1 ('what am I?', bank's hand-set row) one step
 * brighter, so it reads apart from the single base thread colour before the split and stays the brightest head.
 */
export function headCols(m: Parameters<typeof headHues>[0]): string[] {
  const out = hues4(m);
  out[0] = mixLab(out[0], '#ffffff', 0.38);
  return out;
}

// ------------------------------------------------------------------------------------------- layout (L4 world)
export const SIZE = 26;
export const X0 = 122;
export const X1 = 1158;
export const CORD_Y = 282;
export const SLIP_H = 54;
export const widths = WORDS.map((w) => slipWidth(w, SIZE));
const gap = (X1 - X0 - widths.reduce((a, b) => a + b, 0)) / (N - 1);
/** the cord's sag at world x */
export const cordY = (x: number) => {
  const u = (x - X0) / (X1 - X0);
  return CORD_Y + 22 * 4 * u * (1 - u) - 2;
};
export const SLIPS = (() => {
  let x = X0;
  return widths.map((w) => {
    const cx = x + w / 2;
    x += w + gap;
    const u = (cx - X0) / (X1 - X0);
    return { cx, w, top: CORD_Y + 18 + 22 * 4 * u * (1 - u) };
  });
})();
/** the cups hang low and tall, so the banner fills the frame from lanterns to the lower third */
export const CUP_Y = 606;
export const CUP_H = 112;
export const CUP_W = 48;
/** river's share sits just above its cup's rim (clear of the caption band) */
export const RIVER_SHARE_Y = CUP_Y - CUP_H - 12;
export const lanternOf = (i: number) => ({ x: SLIPS[i].cx, y: SLIPS[i].top - 40 });
/** ch10-s08's end camera = ch10-s09's opening camera */
export const S08_END: Camera3 = { x: 644, y: 326, z: -52, lens: 1 };

/** the two posts and the sagging cord (L4, ink) */
export function postsAndCord(c: CanvasRenderingContext2D, ink: string): void {
  c.save();
  c.fillStyle = ink;
  for (const px of [X0 - 34, X1 + 34]) {
    c.fillRect(px - 5, CORD_Y - 30, 10, 760 - CORD_Y + 30);
    c.beginPath();
    c.arc(px, CORD_Y - 34, 8, 0, Math.PI * 2);
    c.fill();
  }
  c.strokeStyle = ink;
  c.lineWidth = 1.8;
  c.beginPath();
  for (let k = 0; k <= 40; k++) {
    const x = X0 - 34 + (k / 40) * (X1 - X0 + 68);
    const y = cordY(x);
    if (k === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  c.restore();
}

/** the honesty tag at the banner's end, right-aligned at (x, y): ILLUSTRATIVE (small caps) · hand-set weights (italic),
 *  both raised to the legibility floor */
export function illustrativeTag(c: CanvasRenderingContext2D, x: number, y: number, col: string, a: number): void {
  if (a <= 0.003) return;
  const w2 = ink(c, '· hand-set weights', x, y, { italic: true, size: 23, align: 'right', color: col, alpha: a, legible: true });
  ink(c, 'ILLUSTRATIVE', x - w2 - 9, y, { font: 'sc', size: 21, weight: 600, tracking: 2, align: 'right', color: col, alpha: a, legible: true });
}

/**
 * ch10-s05's three objects on every banner slip (the 'same three objects in every word' promise): the hand mirror
 * (label) hangs from the slip's bottom-left corner and the sealed note (message) from its bottom-right corner, small,
 * on short cords; the lantern (question) hangs above (lanternOf). Drawn in the slip's frame: (cx, top), rot.
 */
export function slipTokens(c: CanvasRenderingContext2D, env: PaintEnv, i: number, cx: number, top: number, rot: number, a: number): void {
  if (a <= 0.003) return;
  const w = SLIPS[i].w;
  const ink0 = mixLab(env.mood.ink, env.mood.set, 0.1);
  const ms = 0.92;
  const mx = -w / 2 + 3;
  const my = SLIP_H + 6 + mirrorLoop(ms);
  const nx = w / 2 - 6;
  const ny = SLIP_H + 16;
  c.save();
  c.translate(cx, top);
  c.rotate(rot);
  c.globalAlpha *= a;
  c.strokeStyle = ink0;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(mx, SLIP_H - 4);
  c.lineTo(mx, SLIP_H + 6);
  c.moveTo(nx, SLIP_H - 4);
  c.lineTo(nx, ny - 7);
  c.stroke();
  kMirror(c, mx, my, 0, ms, 1, ink0, env);
  vNote(c, nx, ny, 0.42, 1, 0.04, env);
  c.restore();
}

/**
 * The near plane of the banner shots (L5, blurred): a timber post at the left that slides in as the camera pulls back,
 * and a big blank slip hanging into the top-right corner on its cord (the hall's nearest slip).
 */
export function hallNear(f: Frame, id: string, cams: Camera3[]): void {
  nearPost(f, 'ch10-banner', cams, -20, 1);
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, cams, 40);
    f.cached(`ch10-banner/L5slip/${env.mood.id}/${Math.round(r.x)}/${Math.round(r.w)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      const fg = env.fill('fg');
      cc.strokeStyle = fg;
      cc.lineWidth = 3;
      cc.beginPath();
      cc.moveTo(1212, r.y);
      cc.lineTo(1212, 18);
      cc.stroke();
      cc.fillStyle = fg;
      cc.fillRect(1206, 6, 12, 20);
      cc.beginPath();
      cc.moveTo(1168, 22);
      cc.lineTo(1256, 22);
      cc.lineTo(1256, 132);
      cc.lineTo(1232, 138);
      cc.lineTo(1212, 131);
      cc.lineTo(1190, 139);
      cc.lineTo(1168, 133);
      cc.closePath();
      cc.fill();
      cc.fillStyle = withAlpha(env.mood.rim, 0.22);
      cc.fillRect(1168, 22, 88, 1.5);
    })(c, r.x, r.y);
  });
  void id;
}

/** the hall's haze bloom on 'question' (L4, additive, before the slips): k 0..1 */
export function hallBloom(c: CanvasRenderingContext2D, env: PaintEnv, k: number): void {
  if (k <= 0.003) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(640, 250, 40, 640, 300, 720);
  g.addColorStop(0, withAlpha(env.mood.halo, 0.16 * k));
  g.addColorStop(0.5, withAlpha(env.mood.halo, 0.06 * k));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(-400, -300, 2080, 1300);
  c.restore();
}
