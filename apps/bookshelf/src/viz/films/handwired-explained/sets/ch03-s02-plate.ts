/**
 * handwired-explained — ch03's parchment PLATES (ch03-s02 the builder ribbon, ch03-s04 the source table, ch03-s05 the
 * four instructions): one lamp-lit parchment sheet pinned on the dark workbench, so the three plates read as the same
 * object between the workshop shots. Owned by the ch03-s01..s05 author.
 *
 *   plateScene(f, { key: 'ch03-s04', near: 'spool', drift: u }, { l4: (c, env) => ..., l5: ... })
 *     backlight → L3 the bench at the margins → L4 the plate (cached) + your ink → L5 a soft near object
 *   PLATE                      the sheet's rect (L4 rest px); inside it, keep text above y 634 (bottom 12 % clear)
 *   plateInk(env) / plateRule(env) / copperInk(env)   ink colours on the paper
 *   opTag(c, env, {x, y, kind, ...})   a small ink operation tag stamped with its kind (sum · ReGLU · boolean)
 *   pigeonStrip(c, env, {...})          the toggle's source table: 20 numbered ink pigeonholes (ch03-s04, s05)
 *
 * Plate lettering is ink on the paper itself (never a floating caption); text that the narration names is set at the
 * 22 px cap floor (legibleSize) under textRole('subject').
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { toScreen } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, legibleSize, textProbe, textRole } from '../../../film/silhouette/type';
import { copperOf } from './narratorHands';

type C2 = CanvasRenderingContext2D;

// ---------------------------------------------------------------- tiny pure helpers
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
export const seg = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

// ---------------------------------------------------------------- the sheet
export const PLATE = { x: 40, y: 30, w: 1200, h: 664 } as const;

export const paperOf = (env: Pick<PaintEnv, 'mood'>) => mixLab(mixLab('#e8d6ab', env.mood.halo, 0.22), env.mood.core, 0.1);
export const plateInk = (env: Pick<PaintEnv, 'mood'>) => mixLab('#2a1d14', env.mood.ink, 0.25);
export const plateRule = (env: Pick<PaintEnv, 'mood'>, a = 0.22) => withAlpha(plateInk(env), a);
/** the film's copper, on paper (a little darker than on the line so it reads against parchment) */
export const copperInk = (env: PaintEnv, glow = 0) => mixLab(copperOf(env, glow), '#5a2d12', 0.18);

/** the camera's gentle drift over a locked plate: u 0..1 over the shot (≤ 2 % push, a few px of truck) */
export function plateCam(u: number, dx = 8, push = 0.02): Camera3 {
  const k = 1 + push * u;
  return { x: 640 + dx * u, y: 360 + 2 * u, z: 1000 - 1000 / k, lens: 1 };
}

export type Near = 'spool' | 'dividers' | 'pen' | 'none';
export interface PlateSceneOpts {
  key: string;
  near?: Near;
  /** lamp pool centre (L4 rest px), default upper left */
  lamp?: { x: number; y: number };
}
/** the plate's backlight, L3 bench margins, L4 cached sheet; returns nothing (draw your ink in your own L4 call after) */
export function plateBack(f: Frame, o: PlateSceneOpts) {
  f.backlight({ intensity: 0.2 });
  f.layer('L3', (c, env) => {
    f.cached(`${o.key}/plate-L3/${env.mood.id}`, 1800, 1200, (cc) => {
      cc.translate(260, 240);
      // dark workbench wood seen past the sheet's edges, with a few long grain lines
      cc.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.3);
      cc.fillRect(-260, -240, 1800, 1200);
      cc.strokeStyle = withAlpha(env.mood.set, 0.12);
      cc.lineWidth = 1.2;
      for (let i = 0; i < 26; i++) {
        const y = -200 + i * 46 + Math.sin(i * 2.1) * 8;
        cc.beginPath();
        cc.moveTo(-260, y);
        cc.bezierCurveTo(300, y + 10 * Math.sin(i), 900, y - 12 * Math.cos(i * 1.3), 1540, y + 4);
        cc.stroke();
      }
      const g = cc.createRadialGradient(360, 120, 60, 520, 300, 1100);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.22));
      g.addColorStop(1, withAlpha(env.mood.fg, 0.35));
      cc.fillStyle = g;
      cc.fillRect(-260, -240, 1800, 1200);
    })(c, -260, -240);
  });
  f.layer('L4', (c, env) => {
    f.cached(`${o.key}/plate/${env.mood.id}`, PLATE.w + 40, PLATE.h + 40, (cc) => {
      cc.translate(-PLATE.x + 20, -PLATE.y + 20);
      sheet(cc, env, o.lamp ?? { x: 300, y: 80 });
    })(c, PLATE.x - 20, PLATE.y - 20);
  });
}

/** a soft near object at a frame corner (L5): the copper spool, brass dividers or a dip pen */
export function plateNear(f: Frame, o: PlateSceneOpts) {
  const near = o.near ?? 'none';
  if (near === 'none') return;
  f.layer('L5', (c, env) => {
    f.cached(`${o.key}/plate-L5/${near}/${env.mood.id}`, 520, 420, (cc) => {
      cc.translate(-NEAR_AT[near].x, -NEAR_AT[near].y);
      if (near === 'spool') spool(cc, env);
      else if (near === 'dividers') dividers(cc, env);
      else pen(cc, env);
    })(c, NEAR_AT[near].x, NEAR_AT[near].y);
  });
}
const NEAR_AT: Record<Exclude<Near, 'none'>, { x: number; y: number }> = {
  spool: { x: 960, y: 440 },
  dividers: { x: 1010, y: -60 },
  pen: { x: -80, y: 520 },
};

function sheet(c: C2, env: PaintEnv, lamp: { x: number; y: number }) {
  const { x, y, w, h } = PLATE;
  c.save();
  // the sheet's soft shadow on the bench
  c.fillStyle = withAlpha(env.mood.fg, 0.55);
  c.filter = 'blur(9px)';
  c.fillRect(x + 7, y + 11, w, h);
  c.filter = 'none';
  // deckled edge
  c.beginPath();
  const N = 64;
  for (let i = 0; i <= N; i++) c.lineTo(x + (w * i) / N, y + Math.sin(i * 2.3) * 1.5);
  for (let i = 0; i <= N; i++) c.lineTo(x + w + Math.sin(i * 3.1) * 1.5, y + (h * i) / N);
  for (let i = N; i >= 0; i--) c.lineTo(x + (w * i) / N, y + h + Math.sin(i * 1.7) * 1.5);
  for (let i = N; i >= 0; i--) c.lineTo(x + Math.sin(i * 2.9) * 1.5, y + (h * i) / N);
  c.closePath();
  c.fillStyle = paperOf(env);
  c.fill();
  c.clip();
  // the lamp's warm pool from the upper left, falling off across the sheet toward the far corners
  const warm = mixLab('#f6c983', env.mood.core, 0.35);
  const g = c.createRadialGradient(lamp.x, lamp.y, 30, lamp.x + 80, lamp.y + 90, 1400);
  g.addColorStop(0, withAlpha(warm, 0.42));
  g.addColorStop(0.18, withAlpha(warm, 0.16));
  g.addColorStop(0.4, withAlpha(env.mood.fg, 0.06));
  g.addColorStop(0.7, withAlpha(env.mood.fg, 0.2));
  g.addColorStop(1, withAlpha(env.mood.fg, 0.4));
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  // a soft edge vignette: the sheet curls a little out of the lamp at its margins
  const v = c.createRadialGradient(x + w * 0.42, y + h * 0.42, h * 0.45, x + w * 0.5, y + h * 0.5, w * 0.72);
  v.addColorStop(0, withAlpha(env.mood.fg, 0));
  v.addColorStop(1, withAlpha(env.mood.fg, 0.22));
  c.fillStyle = v;
  c.fillRect(x, y, w, h);
  // fibre and a few foxing spots
  c.fillStyle = withAlpha(env.mood.ink, 0.035);
  for (let i = 0; i < 1000; i++) {
    const px = x + ((i * 7919) % 1201) * (w / 1201);
    const py = y + ((i * 104729) % 667) * (h / 667);
    c.fillRect(px, py, 5 + (i % 7), 0.8);
  }
  c.fillStyle = withAlpha('#8a6a3a', 0.06);
  for (const [fx, fy, fr] of [[1120, 620, 14], [180, 600, 9], [1010, 90, 7], [90, 260, 6]]) {
    c.beginPath();
    c.arc(fx, fy, fr, 0, Math.PI * 2);
    c.fill();
  }
  // the double rule
  c.strokeStyle = withAlpha(plateInk(env), 0.42);
  c.lineWidth = 1.4;
  c.strokeRect(x + 24, y + 22, w - 48, h - 44);
  c.lineWidth = 0.7;
  c.strokeRect(x + 31, y + 29, w - 62, h - 58);
  c.restore();
  // brass drawing pins at the top corners
  for (const px of [x + 14, x + w - 14]) {
    c.fillStyle = mixLab('#a8823f', env.mood.halo, 0.25);
    c.beginPath();
    c.arc(px, y + 12, 4.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(env.mood.core, 0.7);
    c.beginPath();
    c.arc(px - 1.2, y + 10.8, 1.3, 0, Math.PI * 2);
    c.fill();
  }
}

function spool(c: C2, env: PaintEnv) {
  // a wooden spool of the ribbon's copper thread lying on its side at the lower right (the same spool in s02, s04,
  // s05): two dark flanges and, between them, the wound barrel, its copper turns catching the lamp from the upper left
  const ink = env.fill('fg');
  const cu = copperOf(env, 0.15);
  c.save();
  c.translate(1172, 660);
  c.rotate(-0.3);
  c.scale(0.85, 0.85);
  const R0 = 92, L = 74;
  // the far flange
  c.fillStyle = ink;
  c.beginPath();
  c.ellipse(L, 0, 36, R0, 0, 0, Math.PI * 2);
  c.fill();
  // the wound barrel (radius 62): many copper turns, lit across the top, falling into shadow underneath
  const Rb = 62;
  c.save();
  c.beginPath();
  c.rect(-L, -Rb, 2 * L, 2 * Rb);
  c.clip();
  c.fillStyle = mixLab(cu, env.mood.fg, 0.55);
  c.fillRect(-L, -Rb, 2 * L, 2 * Rb);
  for (let yy = -Rb; yy <= Rb; yy += 5.5) {
    const lit = Math.max(0, 1 - Math.abs((yy + Rb * 0.45) / (Rb * 0.7)));
    c.strokeStyle = withAlpha(mixLab(mixLab(cu, env.mood.fg, 0.45 - 0.45 * lit), '#ffd9a8', 0.35 * lit * lit), 0.95);
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-L, yy);
    c.quadraticCurveTo(0, yy + 2.2, L, yy);
    c.stroke();
  }
  // the barrel's roundness: shadow under, a soft specular streak along the top third
  const sh = c.createLinearGradient(0, -Rb, 0, Rb);
  sh.addColorStop(0, withAlpha(env.mood.fg, 0.15));
  sh.addColorStop(0.25, withAlpha('#fff0d8', 0.12));
  sh.addColorStop(0.45, withAlpha(env.mood.fg, 0));
  sh.addColorStop(1, withAlpha(env.mood.fg, 0.7));
  c.fillStyle = sh;
  c.fillRect(-L, -Rb, 2 * L, 2 * Rb);
  c.restore();
  // the near flange, its rim catching the lamp
  c.fillStyle = ink;
  c.beginPath();
  c.ellipse(-L, 0, 36, R0, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab('#e8b878', env.mood.core, 0.3), 0.5);
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(-L, 0, 36, R0, 0, Math.PI * 1.0, Math.PI * 1.6);
  c.stroke();
  // the loose end, unwinding off the barrel toward the sheet
  c.strokeStyle = withAlpha(mixLab(cu, '#ffd9a8', 0.2), 0.95);
  c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(-40, -Rb + 2);
  c.bezierCurveTo(-60, -Rb - 40, -120, -Rb - 50, -170, -Rb - 30);
  c.stroke();
  c.restore();
}
function dividers(c: C2, env: PaintEnv) {
  // brass dividers lying across the upper-right corner
  c.strokeStyle = env.fill('fg');
  c.lineCap = 'round';
  c.lineWidth = 12;
  c.beginPath();
  c.moveTo(1330, -40);
  c.lineTo(1120, 120);
  c.moveTo(1330, -40);
  c.lineTo(1180, 150);
  c.stroke();
  c.fillStyle = env.fill('fg');
  c.beginPath();
  c.arc(1330, -40, 26, 0, Math.PI * 2);
  c.fill();
}
function pen(c: C2, env: PaintEnv) {
  // a dip pen lying diagonally at the lower left
  c.save();
  c.translate(60, 700);
  c.rotate(-0.42);
  c.fillStyle = env.fill('fg');
  c.fillRect(-40, -9, 380, 18);
  c.beginPath();
  c.moveTo(340, -7);
  c.lineTo(400, 0);
  c.lineTo(340, 7);
  c.closePath();
  c.fill();
  c.restore();
}

// ---------------------------------------------------------------- an operation tag (the builder ribbon's unit)
export type OpKind = 'sum' | 'ReGLU' | 'boolean' | 'index';
export const OP_TAG = { w: 106, h: 44 } as const;
export interface OpTagOpts {
  x: number;
  y: number;
  kind: OpKind;
  /** 0..1 stamped in (paper and ink together) */
  a?: number;
  /** a nod (radians) about the tag's top pin */
  nod?: number;
  /** 0..1 copper glow on its edge (the duplicate's thread touching it) */
  glow?: number;
  /** text role: the stamp is read in narration as kinds of operation */
  subject?: boolean;
  /** probe id for the cards audit */
  probe?: string;
  scale?: number;
}
/** the left and right pins of a tag (thread anchors), L4 world */
export const opIn = (x: number, y: number, s = 1) => ({ x: x - (OP_TAG.w / 2) * s, y });
export const opOut = (x: number, y: number, s = 1) => ({ x: x + (OP_TAG.w / 2) * s, y });

export function opTag(c: C2, env: PaintEnv, o: OpTagOpts) {
  const a = clamp01(o.a ?? 1);
  if (a <= 0) return;
  const s = o.scale ?? 1;
  const w = OP_TAG.w * s, h = OP_TAG.h * s;
  c.save();
  c.globalAlpha = a;
  c.translate(o.x, o.y - h / 2);
  c.rotate(o.nod ?? 0);
  // the small paper tag, a notched left end where its thread ties
  c.fillStyle = withAlpha('#1d140d', 0.16);
  c.fillRect(-w / 2 + 2, 3, w, h);
  c.beginPath();
  c.moveTo(-w / 2 + 9 * s, 0);
  c.lineTo(w / 2, 0);
  c.lineTo(w / 2, h);
  c.lineTo(-w / 2 + 9 * s, h);
  c.lineTo(-w / 2, h / 2);
  c.closePath();
  c.fillStyle = mixLab(mixLab('#f1e4c4', env.mood.core, 0.25), '#ffffff', 0.08);
  c.fill();
  c.strokeStyle = withAlpha(plateInk(env), 0.75);
  c.lineWidth = 1.3;
  c.stroke();
  const glow = clamp01(o.glow ?? 0);
  if (glow > 0) {
    c.strokeStyle = withAlpha(copperInk(env, 0.6), glow);
    c.lineWidth = 2.6;
    c.stroke();
  }
  c.fillStyle = plateInk(env);
  c.beginPath();
  c.arc(-w / 2 + 6 * s, h / 2, 2.2 * s, 0, Math.PI * 2);
  c.fill();
  // the kind, stamped
  textRole(c, o.subject ? 'subject' : 'texture', () => {
    const fs = o.subject ? legibleSize(c, `600 ${(22 * s).toFixed(2)}px ${FONT.text}`, 22 * s) : 22 * s;
    c.font = `600 ${fs.toFixed(2)}px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = plateInk(env);
    c.fillText(o.kind, 5 * s, h / 2 + 1);
    if (o.probe) textProbe(c, o.probe, -w / 2, 0, w, h, a);
  });
  c.restore();
}

/** a fine ink thread between two points (an op reading its input), sagging slightly; u = how far it has drawn */
export function inkThread(c: C2, env: PaintEnv, p0: { x: number; y: number }, p1: { x: number; y: number }, u = 1, col?: string, width = 1.1) {
  if (u <= 0) return;
  const mx = (p0.x + p1.x) / 2;
  c.save();
  c.strokeStyle = col ?? withAlpha(plateInk(env), 0.62);
  c.lineWidth = width;
  c.beginPath();
  const N = 18;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * u;
    // cubic with horizontal tangents
    const x = cub(p0.x, mx, mx, p1.x, t);
    const y = cub(p0.y, p0.y, p1.y, p1.y, t);
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  c.restore();
}
const cub = (a: number, b: number, c: number, d: number, t: number) => {
  const m = 1 - t;
  return m * m * m * a + 3 * m * m * t * b + 3 * m * t * t * c + t * t * t * d;
};

// ---------------------------------------------------------------- the source table: 20 numbered pigeonholes
export const STRIP = { x: 140, y: 322, cell: 50, h: 104, n: 20 } as const;
export const cellX = (i: number, x0: number = STRIP.x) => x0 + i * STRIP.cell + STRIP.cell / 2;
export interface StripOpts {
  x?: number;
  y?: number;
  /** 0..1 settled (the strip drops in) */
  a?: number;
  /** text role for the numerals */
  subject?: boolean;
}
/** the strip of 20 ink pigeonholes with their numbers (0..19) under each hole */
export function pigeonStrip(c: C2, env: PaintEnv, o: StripOpts = {}) {
  const a = clamp01(o.a ?? 1);
  if (a <= 0) return;
  const x0 = o.x ?? STRIP.x, y0 = o.y ?? STRIP.y;
  const W = STRIP.cell * STRIP.n;
  const ink = plateInk(env);
  c.save();
  c.globalAlpha = a;
  // the case: a shallow ink box with a shadowed back inside each hole
  c.fillStyle = withAlpha(ink, 0.08);
  c.fillRect(x0, y0, W, STRIP.h);
  for (let i = 0; i < STRIP.n; i++) {
    const hx = x0 + i * STRIP.cell;
    const g = c.createLinearGradient(0, y0, 0, y0 + STRIP.h);
    g.addColorStop(0, withAlpha(ink, 0.2));
    g.addColorStop(1, withAlpha(ink, 0.04));
    c.fillStyle = g;
    c.fillRect(hx + 3, y0 + 3, STRIP.cell - 6, STRIP.h - 6);
  }
  c.strokeStyle = withAlpha(ink, 0.85);
  c.lineWidth = 1.6;
  c.strokeRect(x0, y0, W, STRIP.h);
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 1; i < STRIP.n; i++) {
    c.moveTo(x0 + i * STRIP.cell, y0);
    c.lineTo(x0 + i * STRIP.cell, y0 + STRIP.h);
  }
  c.stroke();
  // numbers under the holes
  textRole(c, o.subject ? 'subject' : 'texture', () => {
    c.font = `500 15px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.fillStyle = withAlpha(ink, 0.8);
    for (let i = 0; i < STRIP.n; i++) c.fillText(String(i), cellX(i, x0), y0 + STRIP.h + 6);
  });
  c.restore();
}

/** a paper card standing in a pigeonhole, with an ink value (or a flag); y0 = the strip's top */
export function cellCard(c: C2, env: PaintEnv, i: number, text: string, o: { x0?: number; y0?: number; a?: number; lift?: number; size?: number; glow?: number; probe?: string; subject?: boolean } = {}) {
  const a = clamp01(o.a ?? 1);
  if (a <= 0) return;
  const x0 = o.x0 ?? STRIP.x, y0 = o.y0 ?? STRIP.y;
  const cx = cellX(i, x0);
  const cw = STRIP.cell - 12, ch = STRIP.h - 22;
  const y = y0 + 14 - (o.lift ?? 0) + (1 - a) * -18;
  c.save();
  c.globalAlpha = a;
  c.fillStyle = withAlpha('#1d140d', 0.15);
  c.fillRect(cx - cw / 2 + 2, y + 3, cw, ch);
  c.fillStyle = mixLab(mixLab('#f4e8cb', env.mood.core, 0.3), '#ffffff', 0.1);
  c.fillRect(cx - cw / 2, y, cw, ch);
  c.strokeStyle = withAlpha(plateInk(env), 0.5);
  c.lineWidth = 0.9;
  c.strokeRect(cx - cw / 2, y, cw, ch);
  const g = clamp01(o.glow ?? 0);
  if (g > 0) {
    c.strokeStyle = withAlpha(copperInk(env, 0.5), g);
    c.lineWidth = 2.2;
    c.strokeRect(cx - cw / 2 - 1, y - 1, cw + 2, ch + 2);
  }
  if (text) {
    const subj = o.subject !== false;
    textRole(c, subj ? 'subject' : 'texture', () => {
      const size = subj ? legibleSize(c, `600 ${o.size ?? 16}px ${FONT.mono}`, o.size ?? 16, text) : o.size ?? 16;
      c.font = `600 ${size}px ${FONT.mono}`;
      c.fillStyle = plateInk(env);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      // set vertically (the card is narrow): one glyph group, rotated
      c.save();
      c.translate(cx, y + ch / 2);
      if (text.length > 2) c.rotate(-Math.PI / 2);
      c.fillText(text, 0, 1);
      c.restore();
      if (o.probe) textProbe(c, o.probe, cx - cw / 2, y, cw, ch, a);
    });
  }
  c.restore();
}

/** is the plate camera pushed enough that L4 type reads at the floor? (for subject roles) */
export const plateScale = (cam: Camera3) => toScreen(LAYERS.L4, cam, 0, 0).k;

// ---------------------------------------------------------------- the toggle's 20 cells (CB09, in its listed order)
/** what each card shows: a value, an event flag (0/1), a coordinate letter, or a blank card (no invented values) */
export type CellKind = 'value' | 'flag' | 'coord' | 'matrix' | 'blank';
export const TOGGLE_CELLS: { kind: CellKind; text: string }[] = [
  { kind: 'value', text: '1280' },
  { kind: 'value', text: '800' },
  { kind: 'flag', text: '0' }, // pointer press
  { kind: 'coord', text: 'x' },
  { kind: 'coord', text: 'y' },
  { kind: 'flag', text: '0' }, // pointer release
  { kind: 'coord', text: 'x' },
  { kind: 'coord', text: 'y' },
  { kind: 'flag', text: '0' }, // cancel
  { kind: 'blank', text: '' }, // on
  { kind: 'blank', text: '' }, // armed
  { kind: 'matrix', text: '' },
  { kind: 'matrix', text: '' },
  { kind: 'matrix', text: '' },
  { kind: 'matrix', text: '' },
  { kind: 'blank', text: '' }, // settleCheck
  { kind: 'blank', text: '' }, // snap
  { kind: 'blank', text: '' }, // displacement
  { kind: 'blank', text: '' }, // velocity
  { kind: 'blank', text: '' }, // destination
];
/** grouped brackets under the strip (labels are the claim's own words; settleCheck and snap stay unbracketed) */
export const TOGGLE_GROUPS: { from: number; to: number; label: string }[] = [
  { from: 0, to: 1, label: 'window' },
  { from: 2, to: 8, label: 'pointer events' },
  { from: 9, to: 10, label: 'state' },
  { from: 11, to: 14, label: 'spring' },
  { from: 17, to: 19, label: 'state' },
];
export const isFlag = (i: number) => TOGGLE_CELLS[i].kind === 'flag';

/** one card's face for the toggle table (value / flag / coordinate / a 2x2 dot matrix / a blank card's ink tick) */
export function toggleCard(c: C2, env: PaintEnv, i: number, o: { x0?: number; y0?: number; a?: number; flag?: number; lift?: number; glow?: number; subject?: boolean } = {}) {
  const cell = TOGGLE_CELLS[i];
  const text = cell.kind === 'flag' ? ((o.flag ?? 0) >= 0.5 ? '1' : '0') : cell.text;
  cellCard(c, env, i, cell.kind === 'value' || cell.kind === 'flag' || cell.kind === 'coord' ? text : '', { x0: o.x0, y0: o.y0, a: o.a, lift: (o.lift ?? 0) + (cell.kind === 'flag' ? 10 * (o.flag ?? 0) : 0), size: cell.kind === 'value' ? 16 : 19, glow: o.glow, probe: undefined, subject: o.subject });
  const a = clamp01(o.a ?? 1);
  if (a <= 0) return;
  const x0 = o.x0 ?? STRIP.x, y0 = o.y0 ?? STRIP.y;
  const cx = cellX(i, x0);
  const cy = y0 + 14 - (o.lift ?? 0) + (1 - a) * -18 + (STRIP.h - 22) / 2;
  c.save();
  c.globalAlpha = a;
  c.fillStyle = withAlpha(plateInk(env), 0.7);
  if (cell.kind === 'matrix') {
    for (const [dx, dy] of [[-6, -9], [6, -9], [-6, 9], [6, 9]]) {
      c.beginPath();
      c.arc(cx + dx, cy + dy, 2.6, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = withAlpha(plateInk(env), 0.6);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(cx - 11, cy - 16);
    c.lineTo(cx - 13, cy - 16);
    c.lineTo(cx - 13, cy + 16);
    c.lineTo(cx - 11, cy + 16);
    c.moveTo(cx + 11, cy - 16);
    c.lineTo(cx + 13, cy - 16);
    c.lineTo(cx + 13, cy + 16);
    c.lineTo(cx + 11, cy + 16);
    c.stroke();
  } else if (cell.kind === 'blank') {
    c.fillRect(cx - 8, cy - 1, 16, 1.6);
  }
  c.restore();
}

/** the whole filled table (strip, numbers, the 20 cards) at a position and scale: ch03-s05 slides it to the top margin */
export function toggleTable(c: C2, env: PaintEnv, o: { x: number; y: number; scale?: number; a?: number; flags?: number[]; groups?: number }) {
  const s = o.scale ?? 1;
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  c.translate(-STRIP.x, -STRIP.y);
  pigeonStrip(c, env, { a: o.a });
  for (let i = 0; i < STRIP.n; i++) toggleCard(c, env, i, { a: o.a, flag: o.flags?.[i] ?? 0, subject: false });
  if ((o.groups ?? 0) > 0) groupBrackets(c, env, o.groups ?? 0, (o.a ?? 1) * (o.groups ?? 0), false);
  c.restore();
}

/** ink brackets and small grouped labels under the strip's numbers; `n` groups shown (fractional = fading in) */
export function groupBrackets(c: C2, env: PaintEnv, n: number, a = 1, subject = true, x0: number = STRIP.x, y0: number = STRIP.y) {
  const ink = plateInk(env);
  const by = y0 + STRIP.h + 38;
  TOGGLE_GROUPS.forEach((g, k) => {
    const ga = clamp01(n - k) * a;
    if (ga <= 0) return;
    const xa = x0 + g.from * STRIP.cell + 5, xb = x0 + (g.to + 1) * STRIP.cell - 5;
    c.save();
    c.globalAlpha = ga;
    c.strokeStyle = withAlpha(ink, 0.75);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(xa, by - 6);
    c.lineTo(xa, by);
    c.lineTo(xb, by);
    c.lineTo(xb, by - 6);
    c.moveTo((xa + xb) / 2, by);
    c.lineTo((xa + xb) / 2, by + 5);
    c.stroke();
    textRole(c, subject ? 'subject' : 'texture', () => {
      const size = subject ? legibleSize(c, `italic 500 22px ${FONT.text}`, 22) : 22;
      c.font = `italic 500 ${size}px ${FONT.text}`;
      c.fillStyle = ink;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.fillText(g.label, (xa + xb) / 2, by + 8);
      if (subject) {
        const tw = c.measureText(g.label).width;
        textProbe(c, `grp-${k}-${g.from}`, (xa + xb) / 2 - tw / 2, by + 8, tw, size * 1.2, ga);
      }
    });
    c.restore();
  });
}

/** the template's toggle switch as a black paper cut-out: a rounded track and a round thumb (u 0 = off .. 1 = on) */
export function paperToggle(c: C2, env: PaintEnv, x: number, y: number, u: number, a = 1) {
  if (a <= 0) return;
  const w = 128, h = 50;
  c.save();
  c.globalAlpha = a;
  c.fillStyle = withAlpha('#1d140d', 0.22);
  c.beginPath();
  c.roundRect(x - w / 2 + 3, y - h / 2 + 5, w, h, h / 2);
  c.fill();
  c.fillStyle = mixLab(env.mood.ink, '#2a1d14', 0.4);
  c.beginPath();
  c.roundRect(x - w / 2, y - h / 2, w, h, h / 2);
  c.fill();
  // the thumb, a pale paper disc riding the track
  const tx = x - w / 2 + h / 2 + (w - h) * clamp01(u);
  c.fillStyle = mixLab(mixLab('#f4e8cb', env.mood.core, 0.25), '#ffffff', 0.1);
  c.beginPath();
  c.arc(tx, y, h / 2 - 5, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(env.mood.core, 0.5);
  c.lineWidth = 1.2;
  c.beginPath();
  c.roundRect(x - w / 2 + 1, y - h / 2 + 1, w - 2, h - 2, h / 2);
  c.stroke();
  c.restore();
}

/** a small copper wire tag clipped to a point: a clip, a short copper lead up, and a little tag with a position */
export function wireClip(c: C2, env: PaintEnv, at: { x: number; y: number }, label: string, u: number, rise = 46) {
  if (u <= 0) return;
  const cu = copperInk(env, 0.25);
  const top = { x: at.x + 10, y: at.y - rise * clamp01(u) };
  c.save();
  c.globalAlpha = clamp01(u * 2);
  c.strokeStyle = cu;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(at.x, at.y);
  c.quadraticCurveTo(at.x - 4, (at.y + top.y) / 2, top.x, top.y);
  c.stroke();
  // the clip
  c.fillStyle = cu;
  c.fillRect(at.x - 5, at.y - 3, 10, 6);
  // the tag
  if (u > 0.6) {
    const ta = (u - 0.6) / 0.4;
    c.globalAlpha = ta;
    textRole(c, 'subject', () => {
      const size = legibleSize(c, `600 17px ${FONT.mono}`, 17);
      c.font = `600 ${size}px ${FONT.mono}`;
      const tw = c.measureText(label).width + 14;
      c.fillStyle = mixLab(mixLab('#f4e8cb', env.mood.core, 0.25), '#ffffff', 0.1);
      c.fillRect(top.x - 2, top.y - size - 6, tw, size + 10);
      c.strokeStyle = cu;
      c.lineWidth = 1.6;
      c.strokeRect(top.x - 2, top.y - size - 6, tw, size + 10);
      c.fillStyle = mixLab(cu, '#3a1d0a', 0.35);
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.fillText(label, top.x + 5, top.y + 1);
      textProbe(c, `wire-${label}-${Math.round(at.x)}`, top.x - 2, top.y - size - 6, tw, size + 10, ta);
    });
  }
  c.restore();
}
