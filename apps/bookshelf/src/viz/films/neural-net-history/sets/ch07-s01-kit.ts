/**
 * neural-net-history — small helpers shared by ch07-s01 … ch07-s06 (one animator's group, chapter 7
 * "Two Accomplices: Data and Fire").
 *
 *   clamp01 / sm / lerp / win / tq12 / mixCam                       (re-exported)
 *   pulse(t, at, rise, fall)            a 0..1 bump (fast rise, slow fall)
 *   monoCard(c, o, m)                   a small deckled parchment card set in IBM Plex Mono (screen-locked
 *                                       labels and the "Plex Mono on parchment" quote cards of this chapter)
 *   beliefLabel(c, lines, x, y, a, m)   the belief, in Plex Mono small caps on a soft ink plate (screen-locked)
 *   tickBox(c, o, m)                    a pictogram tick-box (clock / cards / seed) with a hand-inked tick
 *   brassPin(c, env, x, y, light, glint)
 *   paperTag(c, env, o)                 a small paper tag on a thread (blank or inked)
 */
import type { PaintEnv, Palette } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, softPlate } from '../../../film/silhouette/type';
import { parchmentPlate } from '../../../film/silhouette/metaphors/kit';
import { clamp01, sm } from './ch02-s05b-util';

export { clamp01, sm, lerp, win, tq12 } from './ch02-s05b-util';
export { mixCam } from './ch03-s01-kit';

type C = CanvasRenderingContext2D;
const PARCH = MOODS.parchment;
/** fountain-pen ink: sepia-black (never a second, blue accent: review ch07 r1) */
export const PEN_INK = '#21170f';

/** a 0..1 bump: rises over `rise` s from `at`, decays over `fall` s */
export function pulse(t: number, at: number, rise: number, fall: number): number {
  if (t < at) return 0;
  if (t < at + rise) return sm((t - at) / rise);
  return Math.exp(-(t - at - rise) / Math.max(1e-3, fall));
}

// ------------------------------------------------------------------------------------------- type
/**
 * The px size `font` needs so its cap height reaches `minCap` px on a 1080p frame under c's CURRENT transform
 * (camera, layer and device scale included), never below `size`. Measured live in this context, every call:
 * the face's real cap ratio (≈ 0.69 em for Special Elite and Plex Mono).
 */
export function capSize(c: C, font: string, size: number, minCap = 23.5): number {
  const f100 = font.replace(/\d+(\.\d+)?px/, '100px');
  // measured against the alphabetic baseline (actualBoundingBoxAscent is relative to the current textBaseline)
  const save = c.font, base = c.textBaseline;
  c.font = f100;
  c.textBaseline = 'alphabetic';
  const asc = c.measureText('H').actualBoundingBoxAscent;
  c.font = save;
  c.textBaseline = base;
  const r = asc > 5 ? asc / 100 : 0.6;
  const t = c.getTransform();
  const dev = Math.max(0.05, Math.hypot(t.a, t.b));
  const H = c.canvas && c.canvas.height >= 300 ? c.canvas.height : 1080;
  const px = (dev * 1080) / H;
  return Math.max(size, Math.ceil((minCap / (r * px)) * 10) / 10);
}
/** `font` (a CSS font string with a px size) raised to the floor: the new string */
export function capFont(c: C, font: string, minCap = 23.5): string {
  const sz = Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 16);
  return font.replace(/\d+(\.\d+)?px/, `${capSize(c, font, sz, minCap)}px`);
}

export interface MonoCardOpts {
  /** centre (stage px) */
  x: number;
  y: number;
  lines: string[];
  size?: number;
  /** a smaller attribution line under a rule */
  attrib?: string;
  alpha?: number;
  /** rise from below while appearing (0..1 of the reveal) */
  rise?: number;
  seed?: number;
  /** pad around the text block */
  pad?: number;
  /** letter tracking px */
  tracking?: number;
}
let MC: C | null = null;
const mctx = (): C => (MC ??= document.createElement('canvas').getContext('2d')!);
export function monoCard(c: C, o: MonoCardOpts, _m: Palette) {
  const A = o.alpha ?? 1;
  if (A <= 0.003) return;
  const size = capSize(c, `500 21px ${FONT.mono}`, o.size ?? 21);
  const pad = o.pad ?? 22;
  const tr = o.tracking ?? 0.6;
  const font = `500 ${size}px ${FONT.mono}`;
  const aSize = capSize(c, `italic 400 20px ${FONT.text}`, Math.max(17.5, size * 0.78));
  const aFont = `italic 400 ${aSize}px ${FONT.text}`;
  const mc = mctx();
  mc.font = font;
  (mc as C & { letterSpacing: string }).letterSpacing = `${tr}px`;
  let w = Math.max(...o.lines.map((l) => mc.measureText(l).width));
  if (o.attrib) {
    mc.font = aFont;
    (mc as C & { letterSpacing: string }).letterSpacing = '0px';
    w = Math.max(w, mc.measureText(o.attrib).width);
  }
  const lh = size * 1.35;
  const h = o.lines.length * lh + (o.attrib ? aSize * 1.9 : 0);
  const W = Math.round(w + pad * 2), H = Math.round(h + pad * 1.6);
  const dy = (1 - sm(o.rise ?? 1)) * 14;
  const x0 = o.x - W / 2, y0 = o.y - H / 2 + dy;
  c.save();
  c.globalAlpha *= A;
  const env = { pxScale: c.getTransform().a || 1 } as PaintEnv;
  parchmentPlate(c, { x: x0, y: y0, w: W, h: H, seed: o.seed ?? 7, ornament: false }, env);
  c.fillStyle = PARCH.ink;
  c.font = font;
  (c as C & { letterSpacing: string }).letterSpacing = `${tr}px`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  o.lines.forEach((l, i) => c.fillText(l, o.x, y0 + pad * 0.8 + size + i * lh));
  if (o.attrib) {
    const ay = y0 + pad * 0.8 + size + o.lines.length * lh + aSize * 0.55;
    c.fillStyle = withAlpha(PARCH.ink, 0.55);
    c.fillRect(o.x - 18, ay - aSize * 0.95, 36, 0.9);
    c.font = aFont;
    (c as C & { letterSpacing: string }).letterSpacing = '0px';
    c.fillStyle = withAlpha(PARCH.ink, 0.85);
    c.fillText(o.attrib, o.x, ay + aSize * 0.35);
  }
  c.restore();
}

/** the belief in Plex Mono small caps on a soft ink plate (screen-locked) */
export function beliefLabel(c: C, lines: string[], x: number, y: number, a: number, m: Palette, o: { size?: number; align?: 'left' | 'center' | 'right' } = {}) {
  if (a <= 0.003) return;
  const size = capSize(c, `500 22px ${FONT.mono}`, o.size ?? 22);
  const lh = size * 1.4;
  const align = o.align ?? 'center';
  c.save();
  c.font = `500 ${size}px ${FONT.mono}`;
  (c as C & { letterSpacing: string }).letterSpacing = '1.2px';
  const w = Math.max(...lines.map((l) => c.measureText(l).width));
  const cx = align === 'center' ? x : align === 'left' ? x + w / 2 : x - w / 2;
  c.globalAlpha = a;
  softPlate(c, cx, y + ((lines.length - 1) * lh) / 2 - size * 0.35, w + 200, lines.length * lh + 90, m.ink, 0.62);
  c.fillStyle = mixLab('#efe3cf', m.core, 0.25);
  c.textAlign = align;
  c.textBaseline = 'alphabetic';
  lines.forEach((l, i) => c.fillText(l, x, y + i * lh));
  c.restore();
}

// ------------------------------------------------------------------------------------------- tick boxes
export type Pictogram = 'clock' | 'cards' | 'seed';
export interface TickBoxOpts {
  x: number;
  y: number;
  /** box side, stage px */
  s: number;
  icon: Pictogram;
  /** 0..1 how much of the tick has been inked */
  tick: number;
  /** 0..1 ink strength of the tick (pales to an outline toward 0) */
  ink?: number;
  /** 0..1 the tick drawn as a thin DASHED outline (still there, no longer required) */
  outline?: number;
  /** 0..1 the pictogram and the box pale with it (to ≈ 35 % alpha at 1) */
  fade?: number;
}
/** ink on parchment: draw on a plate (PARCH colours) */
export function tickBox(c: C, o: TickBoxOpts) {
  const s = o.s;
  const ink = PARCH.ink;
  const fade = clamp01(o.fade ?? 0);
  c.save();
  c.translate(o.x, o.y);
  const A0 = c.globalAlpha;
  c.globalAlpha = A0 * (1 - 0.65 * fade);
  // the pictogram, left of the box
  const px = -s * 1.15;
  c.strokeStyle = ink;
  c.fillStyle = ink;
  c.lineWidth = Math.max(1.2, s * 0.06);
  c.lineCap = 'round';
  if (o.icon === 'clock') {
    c.beginPath();
    c.arc(px, 0, s * 0.42, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.moveTo(px, 0);
    c.lineTo(px, -s * 0.3);
    c.moveTo(px, 0);
    c.lineTo(px + s * 0.22, s * 0.08);
    c.stroke();
    // two small speed lines: fast
    c.globalAlpha *= 0.7;
    c.beginPath();
    c.moveTo(px - s * 0.62, -s * 0.12);
    c.lineTo(px - s * 0.86, -s * 0.12);
    c.moveTo(px - s * 0.6, s * 0.1);
    c.lineTo(px - s * 0.78, s * 0.1);
    c.stroke();
    c.globalAlpha /= 0.7;
  } else if (o.icon === 'cards') {
    for (let k = 0; k < 4; k++) {
      const yy = s * 0.28 - k * s * 0.17;
      c.fillStyle = k === 3 ? PARCH.sky[0] : PARCH.sky[2];
      c.fillRect(px - s * 0.38 + k * 1.2, yy - s * 0.12, s * 0.76, s * 0.22);
      c.strokeRect(px - s * 0.38 + k * 1.2, yy - s * 0.12, s * 0.76, s * 0.22);
    }
  } else {
    // a seed: an almond with a sprouting curl
    c.beginPath();
    c.ellipse(px, s * 0.1, s * 0.22, s * 0.32, 0.5, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(px + s * 0.05, -s * 0.2);
    c.quadraticCurveTo(px + s * 0.1, -s * 0.45, px + s * 0.32, -s * 0.42);
    c.stroke();
  }
  // the box
  c.lineWidth = Math.max(1.1, s * 0.05);
  c.strokeStyle = ink;
  c.strokeRect(-s / 2, -s / 2, s, s);
  c.globalAlpha = A0;
  // the tick: two strokes inked in order
  const u = clamp01(o.tick);
  if (u > 0) {
    const a1 = clamp01(u / 0.35), a2 = clamp01((u - 0.35) / 0.65);
    const P0 = [-s * 0.32, -s * 0.02], P1 = [-s * 0.08, s * 0.26], P2 = [s * 0.42, -s * 0.48];
    const path = new Path2D();
    path.moveTo(P0[0], P0[1]);
    path.lineTo(P0[0] + (P1[0] - P0[0]) * a1, P0[1] + (P1[1] - P0[1]) * a1);
    if (a2 > 0) path.lineTo(P1[0] + (P2[0] - P1[0]) * a2, P1[1] + (P2[1] - P1[1]) * a2);
    const k = o.ink ?? 1;
    const out = clamp01(o.outline ?? 0);
    c.lineJoin = 'round';
    if (out < 1) {
      c.strokeStyle = withAlpha(PEN_INK, k * (1 - out));
      c.lineWidth = s * 0.16;
      c.stroke(path);
    }
    if (out > 0) {
      // what is left behind: a thin dashed outline of the tick (still there, no longer required)
      c.strokeStyle = withAlpha(PEN_INK, 0.75 * out);
      c.lineWidth = Math.max(1, s * 0.05);
      c.setLineDash([s * 0.11, s * 0.08]);
      c.stroke(path);
      c.setLineDash([]);
    }
  }
  c.restore();
}

// ------------------------------------------------------------------------------------------- small props
export function brassPin(c: C, env: PaintEnv, x: number, y: number, light: number, glint = 0, r = 4) {
  c.fillStyle = mixLab(env.mood.halo, env.mood.set, 0.35);
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(env.mood.core, 0.5 * (0.3 + light));
  c.beginPath();
  c.arc(x - r * 0.28, y - r * 0.28, r * 0.38, 0, Math.PI * 2);
  c.fill();
  if (glint > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const R = 18 * glint;
    const g = c.createRadialGradient(x, y, 0, x, y, R);
    g.addColorStop(0, withAlpha(env.mood.core, 0.9 * glint));
    g.addColorStop(1, withAlpha(env.mood.core, 0));
    c.fillStyle = g;
    c.fillRect(x - R, y - R, 2 * R, 2 * R);
    c.restore();
  }
}

export interface PaperTagOpts {
  /** where the thread is tied (world) */
  x: number;
  y: number;
  /** tag size (world px) */
  w: number;
  h: number;
  /** swing angle (radians) */
  rot?: number;
  /** thread length */
  len?: number;
  text?: string;
  /** 0..1 how much of the text is inked */
  ink?: number;
  light?: number;
  font?: string;
}
/** a small manila tag hanging on a thread from (x, y), its eyelet at the top */
export function paperTag(c: C, env: PaintEnv, o: PaperTagOpts) {
  const len = o.len ?? 12;
  const light = o.light ?? 0.8;
  c.save();
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, len);
  c.stroke();
  const w = o.w, h = o.h;
  const paper = mixLab(mixLab(env.mood.halo, '#b08a52', 0.3), env.mood.rim, 0.25 + 0.35 * light);
  c.fillStyle = withAlpha(env.mood.fg, 0.3);
  c.beginPath();
  tagPath(c, 1.5, len + 2, w, h);
  c.fill();
  c.fillStyle = paper;
  c.beginPath();
  tagPath(c, 0, len, w, h);
  c.fill();
  c.fillStyle = withAlpha(env.mood.fg, 0.6);
  c.beginPath();
  c.arc(0, len + h * 0.16, Math.max(1, w * 0.05), 0, Math.PI * 2);
  c.fill();
  if (o.text && (o.ink ?? 1) > 0) {
    const fs = h * 0.36;
    c.font = o.font ?? `600 ${fs}px ${FONT.mono}`;
    const tw = c.measureText(o.text).width;
    const sc = Math.min(1, (w * 0.84) / tw);
    c.save();
    c.translate(0, len + h * 0.62);
    c.scale(sc, 1);
    c.beginPath();
    c.rect(-tw / 2 - 2, -fs, (tw + 4) * clamp01(o.ink ?? 1), fs * 1.6);
    c.clip();
    c.fillStyle = mixLab(PEN_INK, paper, 0.1);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText(o.text, 0, fs * 0.35);
    c.restore();
  }
  c.restore();
}
function tagPath(c: C, dx: number, top: number, w: number, h: number) {
  const n = w * 0.22;
  c.moveTo(dx - w / 2 + n, top + dx);
  c.lineTo(dx + w / 2 - n, top + dx);
  c.lineTo(dx + w / 2, top + n + dx);
  c.lineTo(dx + w / 2, top + h + dx);
  c.lineTo(dx - w / 2, top + h + dx);
  c.lineTo(dx - w / 2, top + n + dx);
  c.closePath();
}
