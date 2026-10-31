/**
 * handwired-explained — DEEP DIVE II's room: THE CLOCK ROOM (ch06-s01 .. ch06-s05; owned by their author).
 *
 * The host clockwork lives in a clock-tower room: a dark wall pierced by a great ROUND window (a clock face seen
 * from behind: ring bars, twelve spokes, sixty tick holes, no numerals) flanked by two tall narrow lights, a fog sheet,
 * a long workbench edge-on at L3 with the clock's hanging weights, and a near bench lip / post. One room, so the five
 * shots cut together and the clockwork always stands against the round window's light.
 *
 *   clockRoom(f, { key, oculus?: {x, y, r}, sunX?, bench?, weights? })   backlight · L2 wall · fog A · L3 · fog B
 *   clockNear(f, { key, lip?, post? })                                    L5 bench lip · L6 post (blurred, fg)
 *   clockArms(c, env, { x, y, r, arms: [u0..u3], lit? })                  the four arms of Q015, swung one by one
 *   paperSlip(c, env, { ... })                                            a pinned paper label (card + text rules)
 *   plateSheet(c, env, rect, lamp)                                        an upright parchment sheet (bake it)
 *   brassOf(env, k) / paperCol(env) / inkCol(env)                         the chapter's three materials
 *
 * All geometry is rest-screen stage px of the layer it is drawn in. Colour roles come from env; the only fixed hues
 * are brass, parchment and the plate ink, which match sets/ch03-s02-plate and sets/hostClockwork.
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { hash1 } from '../../../film/core/frame';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { FONT, cardInkAlpha, cardPaperAlpha, cardProbe, legibleSize, textProbe, textRole } from '../../../film/silhouette/type';
import { CLOCK } from './hostClockwork';
import { paperOf, plateInk } from './ch03-s02-plate';

type C2 = CanvasRenderingContext2D;

// ---------------------------------------------------------------- tiny pure helpers
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
export const seg = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
export const lin = (t: number, a: number, b: number) => clamp01((t - a) / Math.max(1e-6, b - a));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
/** smootherstep, for camera moves */
export const ease5 = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
/** device-px line width in the current transform */
export function lw(c: C2, dev: number) {
  const m = c.getTransform();
  return dev / (Math.hypot(m.a, m.b) || 1);
}

// ---------------------------------------------------------------- materials
export const brassOf = (env: Pick<PaintEnv, 'mood'>, k = 0) => mixLab(mixLab('#a8823e', env.mood.halo, 0.35), env.mood.core, clamp01(k) * 0.55);
export const paperCol = (env: Pick<PaintEnv, 'mood'>) => paperOf(env);
export const inkCol = (env: Pick<PaintEnv, 'mood'>) => plateInk(env);
export const cardPaper = (env: Pick<PaintEnv, 'mood'>) => mixLab(mixLab('#f4e8cb', env.mood.core, 0.3), '#ffffff', 0.1);
export const shadowCol = '#1d140d';

// ---------------------------------------------------------------- the room
export interface RoomOpts {
  key: string;
  /** the round window's centre and radius (L2 rest px); default (640, 300, 300) */
  oculus?: { x: number; y: number; r: number };
  sunX?: number;
  sunY?: number;
  intensity?: number;
  /** L2 / L3 art margin (rest px) beyond the frame; default 360 */
  pad?: number;
  /** draw the L3 bench with the hanging weights; default true */
  bench?: boolean;
  /** gap between the round window's rim and the tall side lights (L2 px); default 250 */
  lightGap?: number;
}

export function clockRoom(f: Frame, o: RoomOpts) {
  const pad = o.pad ?? 360;
  const oc = o.oculus ?? { x: 640, y: 300, r: 300 };
  const key = `ch06room/${o.key}`;
  f.backlight({ sunX: o.sunX ?? oc.x, sunY: o.sunY, intensity: o.intensity ?? 1 });
  f.layer('L2', (c, env) => {
    const x0 = -pad, y0 = -pad * 0.7, w = 1280 + 2 * pad, h = 720 + pad * 1.4;
    const gap = o.lightGap ?? 250;
    f.cached(`${key}/L2/${env.mood.id}/${oc.x},${oc.y},${oc.r},${gap}`, w, h, (cc) => {
      cc.translate(-x0, -y0);
      roomWall(cc, env, x0, y0, w, h, oc, gap);
    })(c, x0, y0);
  });
  f.fog('A');
  if (o.bench !== false) {
    f.layer('L3', (c, env) => {
      const x0 = -pad, w = 1280 + 2 * pad;
      f.cached(`${key}/L3/${env.mood.id}`, w, 900, (cc) => {
        cc.translate(-x0, 200);
        roomBench(cc, env, x0, x0 + w);
      })(c, x0, -200);
    });
  }
  f.fog('B');
}

/** L2: the clock-tower wall: a great round window (holes), two tall narrow lights, a dado, faint cut-lines */
function roomWall(c: C2, env: PaintEnv, x0: number, y0: number, w: number, h: number, oc: { x: number; y: number; r: number }, gap: number) {
  const wall = mixLab(mixLab('#4b3828', env.mood.set, 0.15), PUPPET_NEAR_BLACK, 0.2);
  const p = new Path2D();
  p.rect(x0, y0, w, h);
  // --- the round window: two rings of glass sectors between ring bars and twelve spokes
  const rings = [
    [0.2, 0.52],
    [0.56, 0.86],
  ];
  const spoke = 0.035; // radians half-gap at each spoke
  for (const [ra, rb] of rings) {
    for (let k = 0; k < 12; k++) {
      const a0 = (k / 12) * Math.PI * 2 + spoke;
      const a1 = ((k + 1) / 12) * Math.PI * 2 - spoke;
      const sub = new Path2D();
      sub.arc(oc.x, oc.y, oc.r * rb, a0, a1);
      sub.arc(oc.x, oc.y, oc.r * ra, a1, a0, true);
      sub.closePath();
      p.addPath(sub);
    }
  }
  // the hub glass
  const hub = new Path2D();
  hub.arc(oc.x, oc.y, oc.r * 0.15, 0, Math.PI * 2);
  p.addPath(hub);
  // sixty tick holes in the outer band (the clock face's minute ring)
  for (let k = 0; k < 60; k++) {
    const a = (k / 60) * Math.PI * 2;
    const big = k % 5 === 0;
    const r0 = oc.r * 0.9, r1 = oc.r * (big ? 0.985 : 0.95);
    const hw = big ? 0.012 : 0.006;
    const sub = new Path2D();
    sub.moveTo(oc.x + Math.cos(a - hw) * r0, oc.y + Math.sin(a - hw) * r0);
    sub.lineTo(oc.x + Math.cos(a - hw) * r1, oc.y + Math.sin(a - hw) * r1);
    sub.lineTo(oc.x + Math.cos(a + hw) * r1, oc.y + Math.sin(a + hw) * r1);
    sub.lineTo(oc.x + Math.cos(a + hw) * r0, oc.y + Math.sin(a + hw) * r0);
    sub.closePath();
    p.addPath(sub);
  }
  // --- two tall narrow round-headed lights either side (and two more past the frame for camera moves)
  const lights = [oc.x - oc.r - gap, oc.x + oc.r + gap, oc.x - oc.r - gap - 390, oc.x + oc.r + gap + 390];
  const lwid = 120, top = 40, sill = 600;
  for (const cx of lights) {
    const r = lwid / 2;
    const rows = 8, bar = 4;
    const spring = top + r;
    const ph = (sill - spring - bar * (rows - 1)) / rows;
    for (let j = 0; j < rows; j++) p.rect(cx - r, spring + 6 + j * (ph + bar), lwid, ph - 2);
    const head = new Path2D();
    head.moveTo(cx - r, spring + 2);
    head.arc(cx, spring + 2, r, Math.PI, Math.PI * 2);
    head.closePath();
    p.addPath(head);
  }
  const g = c.createLinearGradient(0, y0, 0, y0 + h);
  g.addColorStop(0, mixLab(wall, env.mood.fg, 0.4));
  g.addColorStop(0.45, wall);
  g.addColorStop(1, mixLab(wall, env.mood.fg, 0.25));
  c.fillStyle = g;
  c.fill(p, 'evenodd');
  // old-glass mottling inside the round window (subtle)
  c.save();
  const clip = new Path2D();
  clip.arc(oc.x, oc.y, oc.r * 0.86, 0, Math.PI * 2);
  c.clip(clip);
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    const v = (hash1(k, 61) + 1) / 2;
    c.fillStyle = withAlpha(v > 0.6 ? '#fff3dc' : '#6a4a2c', 0.03 + 0.05 * v);
    c.beginPath();
    c.moveTo(oc.x, oc.y);
    c.arc(oc.x, oc.y, oc.r, a, a + Math.PI / 12);
    c.closePath();
    c.fill();
  }
  c.restore();
  // stone cut-lines: the window's moulding, a dado rail, pilaster edges
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.16);
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(oc.x, oc.y, oc.r * 1.04, 0, Math.PI * 2);
  c.moveTo(oc.x + oc.r * 1.1, oc.y);
  c.arc(oc.x, oc.y, oc.r * 1.1, 0, Math.PI * 2);
  c.moveTo(x0, sill + 34);
  c.lineTo(x0 + w, sill + 34);
  for (const cx of lights) {
    c.moveTo(cx - lwid / 2 - 14, sill);
    c.lineTo(cx - lwid / 2 - 14, top + lwid / 2 - 10);
    c.arc(cx, top + lwid / 2 - 10, lwid / 2 + 14, Math.PI, Math.PI * 2);
    c.lineTo(cx + lwid / 2 + 14, sill);
  }
  c.stroke();
}

/** L3: a long bench edge-on (y 548..), gear blanks and jars on it, three clock weights hanging on chains */
function roomBench(c: C2, env: PaintEnv, x0: number, x1: number) {
  const ink = env.fill('ink');
  c.fillStyle = ink;
  // the bench top and apron
  c.fillRect(x0, 556, x1 - x0, 14);
  c.fillRect(x0, 570, x1 - x0, 300);
  // legs (holes between them show the floor haze)
  c.save();
  c.globalCompositeOperation = 'destination-out';
  for (let x = x0 + 120; x < x1 - 120; x += 420) c.fillRect(x + 30, 610, 360, 260);
  c.restore();
  // gear blanks standing on the bench (pierced: spokes as holes)
  const gear = (gx: number, r: number, teeth: number, seed: number) => {
    const p = new Path2D();
    const gy = 556 - r;
    for (let i = 0; i < teeth; i++) {
      const a0 = (i / teeth) * Math.PI * 2, a1 = ((i + 0.5) / teeth) * Math.PI * 2;
      const pts = [
        [a0, r * 0.88],
        [a0 + 0.06 / (teeth / 24), r],
        [a1 - 0.06 / (teeth / 24), r],
        [a1, r * 0.88],
      ];
      for (const [a, rr] of pts) {
        const px = gx + Math.cos(a) * rr, py = gy + Math.sin(a) * rr;
        if (i === 0 && rr === r * 0.88 && a === a0) p.moveTo(px, py);
        else p.lineTo(px, py);
      }
    }
    p.closePath();
    const sp = 4 + (seed % 3);
    for (let k = 0; k < sp; k++) {
      const a = (k / sp) * Math.PI * 2 + seed;
      const a2 = a + (Math.PI * 2) / sp - 0.5;
      const h = new Path2D();
      h.moveTo(gx + Math.cos(a) * r * 0.25, gy + Math.sin(a) * r * 0.25);
      h.arc(gx, gy, r * 0.72, a, a2);
      h.arc(gx, gy, r * 0.25, a2, a, true);
      h.closePath();
      p.addPath(h);
    }
    c.fill(p, 'evenodd');
  };
  gear(x0 + 260, 46, 30, 1);
  gear(x0 + 330, 30, 22, 2);
  gear(x1 - 300, 54, 36, 3);
  gear(x1 - 220, 26, 18, 4);
  // jars and a small vice
  for (const [jx, jh] of [
    [x0 + 470, 52],
    [x0 + 500, 38],
    [x1 - 470, 46],
  ]) {
    c.beginPath();
    c.roundRect(jx - 12, 556 - jh, 24, jh, 4);
    c.fill();
    c.fillRect(jx - 9, 556 - jh - 6, 18, 6);
  }
  // clock weights on chains from the ceiling (chain links as a dotted cut)
  for (const [wx, wy, wh] of [
    [x0 + 150, 330, 120],
    [x0 + 200, 420, 110],
    [x1 - 140, 380, 130],
  ]) {
    c.fillRect(wx - 1, -200, 2, wy + 200);
    c.beginPath();
    c.roundRect(wx - 16, wy, 32, wh, 6);
    c.fill();
    c.fillRect(wx - 20, wy - 6, 40, 8);
  }
  // rim on the bench top only (window light from behind and above)
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.32);
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(x0, 556.5);
  c.lineTo(x1, 556.5);
  c.stroke();
}

/** L5 bench lip across the bottom and an optional L6 post (fg, blurred by the layer) */
export function clockNear(f: Frame, o: { key: string; lip?: number | false; post?: number | false; postL?: number | false }) {
  const key = `ch06room/${o.key}`;
  if (o.lip !== false) {
    const y = o.lip ?? 676;
    f.layer('L5', (c, env) => {
      f.cached(`${key}/L5/${env.mood.id}/${y}`, 2400, 300, (cc) => {
        cc.translate(700, -y + 20);
        cc.fillStyle = mixLab(env.mood.fg, env.mood.ink, 0.4);
        cc.beginPath();
        cc.moveTo(-700, y + 6);
        cc.lineTo(1700, y - 4);
        cc.lineTo(1700, y + 300);
        cc.lineTo(-700, y + 300);
        cc.closePath();
        cc.fill();
        cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.4), 0.28);
        cc.lineWidth = 1.6;
        cc.beginPath();
        cc.moveTo(-700, y + 6.5);
        cc.lineTo(1700, y - 3.5);
        cc.stroke();
      })(c, -700, y - 20);
    });
  }
  const posts = [o.post, o.postL].filter((p): p is number => typeof p === 'number');
  if (posts.length) {
    f.layer('L6', (c, env) => {
      for (const px of posts) {
        f.cached(`${key}/L6/${env.mood.id}/${px}`, 200, 1300, (cc) => {
          cc.translate(-px + 100, 300);
          cc.fillStyle = env.mood.fg;
          cc.fillRect(px - 34, -300, 68, 1300);
          // a turned collar and a hanging chain ring
          cc.fillRect(px - 46, 150, 92, 22);
          cc.fillRect(px - 42, 178, 84, 10);
          cc.beginPath();
          cc.ellipse(px, 420, 44, 16, 0, 0, Math.PI * 2);
          cc.fill();
        })(c, px - 100, -300);
      }
    });
  }
}

// ---------------------------------------------------------------- the four arms (Q015's nouns), one by one
export interface ArmsOpts {
  x: number;
  y: number;
  r: number;
  /** swing-out of each arm 0..1: [count, tree, table, same work] */
  arms: [number, number, number, number];
  /** a brief brass flare on each arm as it locks (0..1 each) */
  lit?: [number, number, number, number];
  /** silhouette ink (behind a plate) */
  silhouette?: boolean;
  /** arm length factor (1 = hostClockwork's) */
  reach?: number;
  /** override the four arm angles (radians); default hostClockwork's */
  angles?: number[];
  /** brass arms and tips even in silhouette (so they read against a dark wall) */
  brass?: boolean;
  /** size of the machine-shapes at the tips (1 = hostClockwork's) */
  tipScale?: number;
  /** tips as dark ink cut-outs with a thin brass rim on a soft dark plate (read against a bright window) */
  cutout?: boolean;
}
/** arm tip for one arm at swing u (hostClockwork's geometry: from straight up to its own angle) */
export function armTipAt(o: Pick<ArmsOpts, 'x' | 'y' | 'r' | 'reach' | 'angles'>, i: number, u: number) {
  const uu = Math.max(0, Math.min(1.12, u));
  const a = (o.angles ?? CLOCK.ARM_ANG)[i] * uu + (-Math.PI / 2) * (1 - uu);
  const L = o.r * (1.25 + 0.55 * uu) * (o.reach ?? 1);
  return { x: o.x + Math.cos(a) * L, y: o.y + Math.sin(a) * L, a };
}
export function clockArms(c: C2, env: PaintEnv, o: ArmsOpts) {
  const ink0 = o.silhouette ? env.fill('ink') : PUPPET_NEAR_BLACK;
  const rimC = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.85);
  for (let i = 0; i < 4; i++) {
    const u = Math.max(0, Math.min(1.12, o.arms[i]));
    if (u <= 0.001) continue;
    const lit = clamp01(o.lit?.[i] ?? 0);
    const tip = armTipAt(o, i, u);
    const br = brassOf(env, lit);
    const ink = o.brass ? mixLab(mixLab(brassOf(env, lit * 0.6), ink0, 0.42), env.mood.haze, env.layer.haze * 0.5) : ink0;
    // the arm: a tapered brass bar from the hub, a collar near the tip
    c.save();
    c.globalAlpha *= clamp01(u * 4);
    c.strokeStyle = ink;
    c.lineCap = 'round';
    c.lineWidth = Math.max(lw(c, 4), o.r * 0.05);
    c.beginPath();
    c.moveTo(o.x, o.y);
    c.lineTo(tip.x, tip.y);
    c.stroke();
    c.strokeStyle = withAlpha(br, 0.75 + 0.25 * lit);
    c.lineWidth = Math.max(lw(c, 1.6), o.r * 0.012);
    c.beginPath();
    const nx = -Math.sin(tip.a), ny = Math.cos(tip.a);
    const off = o.r * 0.018;
    c.moveTo(o.x + nx * -off, o.y + ny * -off);
    c.lineTo(tip.x + nx * -off, tip.y + ny * -off);
    c.stroke();
    // the machine-shape at the tip (shapes, not words), upright whatever the arm's angle
    c.translate(tip.x, tip.y);
    const k = o.r * 0.2 * (o.tipScale ?? 1);
    if (o.cutout) {
      tipCutout(c, env, i, k, lit);
      c.restore();
      continue;
    }
    c.fillStyle = ink;
    c.strokeStyle = ink;
    c.lineWidth = Math.max(lw(c, 2.4), k * 0.12);
    if (i === 0) {
      // COUNT: a peg rail with five pegs and a pointer bar
      c.fillRect(-k * 1.5, -k * 0.12, k * 3, k * 0.32);
      for (let p = 0; p < 5; p++) c.fillRect(-k * 1.3 + p * k * 0.62, -k * 0.85, k * 0.16, k * 0.75);
      c.fillRect(-k * 1.5, -k * 0.55, k * 3, k * 0.07);
    } else if (i === 1) {
      // TREE: a forked thread
      c.beginPath();
      c.moveTo(0, k * 0.9);
      c.lineTo(0, 0);
      c.lineTo(-k, -k);
      c.moveTo(0, 0);
      c.lineTo(k, -k);
      c.moveTo(-k, -k);
      c.lineTo(-k * 1.4, -k * 1.8);
      c.moveTo(-k, -k);
      c.lineTo(-k * 0.6, -k * 1.8);
      c.moveTo(k, -k);
      c.lineTo(k * 0.6, -k * 1.8);
      c.moveTo(k, -k);
      c.lineTo(k * 1.4, -k * 1.8);
      c.stroke();
      for (const [bx, by] of [
        [-k * 1.4, -k * 1.8],
        [-k * 0.6, -k * 1.8],
        [k * 0.6, -k * 1.8],
        [k * 1.4, -k * 1.8],
      ]) {
        c.beginPath();
        c.arc(bx, by, k * 0.14, 0, Math.PI * 2);
        c.fill();
      }
    } else if (i === 2) {
      // TABLE: a card drawer, half pulled, with a ring pull
      c.fillRect(-k * 1.1, -k * 0.8, k * 2.2, k * 1.6);
      c.save();
      c.globalCompositeOperation = 'destination-out';
      c.fillRect(-k * 0.85, -k * 0.55, k * 1.7, k * 0.5);
      c.restore();
      c.fillRect(-k * 0.95, -k * 0.2, k * 1.9, k * 0.85);
      c.strokeStyle = rimC;
      c.lineWidth = lw(c, 1.3);
      c.beginPath();
      c.arc(0, k * 0.25, k * 0.16, 0, Math.PI * 2);
      c.stroke();
      // cards standing in the drawer
      c.fillStyle = withAlpha(cardPaper(env), 0.8);
      for (let p = 0; p < 4; p++) c.fillRect(-k * 0.75 + p * k * 0.42, -k * 0.5, k * 0.08, k * 0.32);
    } else {
      // SAME WORK ON EVERY ITEM: a row of identical tiles, each with the same notch
      for (let p = 0; p < 4; p++) {
        const tx = -k * 1.6 + p * k * 0.82;
        c.fillStyle = ink;
        c.fillRect(tx, -k * 0.35, k * 0.66, k * 0.66);
        c.fillStyle = withAlpha(rimC, 0.9);
        c.fillRect(tx + k * 0.22, -k * 0.2, k * 0.22, k * 0.08);
      }
    }
    // the tip's brass flare as it locks
    if (lit > 0) {
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(0, 0, 0, 0, 0, k * 2.2);
      g.addColorStop(0, withAlpha(env.mood.core, 0.32 * lit));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(-k * 2.2, -k * 2.2, k * 4.4, k * 4.4);
    }
    c.restore();
  }
}

/**
 * One arm-tip machine-shape as a CUT-OUT (origin at the tip): a soft dark plate behind it, the shape in near-black
 * ink with a thin brass rim on its outer contour (rim stroked first, ink filled over, so only the silhouette's edge
 * shows), and the brass flare as it locks. Shapes, not words: peg rail · forked thread · card drawer · tile row.
 */
function tipCutout(c: C2, env: PaintEnv, i: number, k: number, lit: number) {
  const dark = mixLab(PUPPET_NEAR_BLACK, env.mood.haze, env.layer.haze * 0.25);
  const rim = brassOf(env, 0.35 + 0.65 * lit);
  const rimW = lw(c, 2.6);
  // the soft dark plate the shape is cut against
  const pr = k * 2.1;
  // the forked thread hangs from its arm (centred on the tip, so it does not climb out of the top of the frame)
  if (i === 1) c.translate(0, k * 0.9);
  // the tile row sits a little outboard, clear of the plate's edge
  if (i === 3) c.translate(-k * 0.35, 0);
  const cy = i === 1 ? -k * 0.5 : 0;
  const g = c.createRadialGradient(0, cy, 0, 0, cy, pr);
  g.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0.38));
  g.addColorStop(0.6, withAlpha(PUPPET_NEAR_BLACK, 0.3));
  g.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0));
  c.fillStyle = g;
  c.fillRect(-pr, cy - pr, pr * 2, pr * 2);
  c.lineJoin = 'round';
  /** rim then fill: a union of rects reads as one silhouette with a brass edge */
  const rects = (rs: [number, number, number, number][]) => {
    c.strokeStyle = rim;
    c.lineWidth = rimW * 2;
    for (const r of rs) c.strokeRect(r[0], r[1], r[2], r[3]);
    c.fillStyle = dark;
    for (const r of rs) c.fillRect(r[0], r[1], r[2], r[3]);
  };
  if (i === 0) {
    // COUNT: a peg rail, five pegs and a cross bar
    const rs: [number, number, number, number][] = [[-k * 1.5, -k * 0.12, k * 3, k * 0.36], [-k * 1.5, -k * 0.6, k * 3, k * 0.1]];
    for (let p = 0; p < 5; p++) rs.push([-k * 1.32 + p * k * 0.62, -k * 0.9, k * 0.2, k * 0.8]);
    rects(rs);
  } else if (i === 1) {
    // TREE: a forked thread, one stem into two, each into two, beads at the four ends
    const segs = [
      [0, k * 0.9, 0, 0],
      [0, 0, -k, -k],
      [0, 0, k, -k],
      [-k, -k, -k * 1.4, -k * 1.8],
      [-k, -k, -k * 0.6, -k * 1.8],
      [k, -k, k * 0.6, -k * 1.8],
      [k, -k, k * 1.4, -k * 1.8],
    ];
    const ends = [-1.4, -0.6, 0.6, 1.4].map((x) => [x * k, -k * 1.8]);
    const w = Math.max(lw(c, 3), k * 0.16);
    c.lineCap = 'round';
    for (const [col, width] of [
      [rim, w + rimW * 2],
      [dark, w],
    ] as [string, number][]) {
      c.strokeStyle = col;
      c.lineWidth = width;
      c.beginPath();
      for (const s of segs) {
        c.moveTo(s[0], s[1]);
        c.lineTo(s[2], s[3]);
      }
      c.stroke();
      c.fillStyle = col;
      for (const [bx, by] of ends) {
        c.beginPath();
        c.arc(bx, by, k * 0.2 + (col === rim ? rimW : 0), 0, Math.PI * 2);
        c.fill();
      }
    }
  } else if (i === 2) {
    // TABLE: a card cabinet, its drawer half pulled, pale cards standing in it, a brass ring pull
    for (let p = 0; p < 5; p++) {
      c.fillStyle = withAlpha(cardPaper(env), 0.92);
      c.fillRect(-k * 0.8 + p * k * 0.36, -k * 1.15 + (p % 2) * k * 0.1, k * 0.22, k * 0.7);
    }
    rects([
      [-k * 1.15, -k * 0.55, k * 2.3, k * 0.22],
      [-k * 1.15, -k * 0.55, k * 0.18, k * 1.45],
      [k * 0.97, -k * 0.55, k * 0.18, k * 1.45],
      [-k * 1.15, k * 0.72, k * 2.3, k * 0.18],
      [-k * 1.0, -k * 0.2, k * 2.0, k * 0.78],
    ]);
    c.strokeStyle = rim;
    c.lineWidth = Math.max(lw(c, 2), k * 0.07);
    c.beginPath();
    c.arc(0, k * 0.2, k * 0.17, 0, Math.PI * 2);
    c.stroke();
  } else {
    // SAME WORK ON EVERY ITEM: four identical tiles, each with the same brass notch
    const rs: [number, number, number, number][] = [];
    for (let p = 0; p < 4; p++) rs.push([-k * 1.64 + p * k * 0.84, -k * 0.36, k * 0.68, k * 0.68]);
    c.strokeStyle = rim;
    c.lineWidth = rimW * 2;
    for (const r of rs) c.strokeRect(r[0], r[1], r[2], r[3]);
    c.fillStyle = dark;
    for (const r of rs) c.fillRect(r[0], r[1], r[2], r[3]);
    c.fillStyle = rim;
    for (const r of rs) c.fillRect(r[0] + k * 0.2, r[1] + k * 0.16, k * 0.28, k * 0.1);
  }
  if (lit > 0) {
    c.globalCompositeOperation = 'lighter';
    const gg = c.createRadialGradient(0, cy, 0, 0, cy, k * 2.2);
    gg.addColorStop(0, withAlpha(env.mood.core, 0.22 * lit));
    gg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = gg;
    c.fillRect(-k * 2.2, cy - k * 2.2, k * 4.4, k * 4.4);
    c.globalCompositeOperation = 'source-over';
  }
}

// ---------------------------------------------------------------- a pinned paper slip (label)
export interface SlipOpts {
  /** text lines (first line inks at inkAt) */
  lines: string[];
  /** centre x, top y (layer px) */
  x: number;
  y: number;
  t: number;
  inkAt: number;
  /** 1 → 0 fade-out multiplier (e.g. a textSwap's out) */
  out?: number;
  /** font size (raised to the legibility floor) */
  size?: number;
  font?: 'italic' | 'mono' | 'sc';
  id: string;
  /** a copper pin at the top */
  pin?: boolean;
  /** paper tint: 'card' (pale) or 'plate' (parchment) */
  tint?: 'card' | 'plate';
  /** fixed width (else fits the text) */
  w?: number;
  /** a slight tilt (radians) */
  tilt?: number;
  /** emphasise one line index (copper ink) */
  accent?: number;
}
export function paperSlip(c: C2, env: PaintEnv, o: SlipOpts) {
  const out = clamp01(o.out ?? 1);
  const paper = cardPaperAlpha(o.t, o.inkAt) * out;
  if (paper <= 0.002) return;
  const ink = cardInkAlpha(o.t, o.inkAt) * out;
  textRole(c, 'subject', () => {
    const fam = o.font === 'mono' ? FONT.mono : o.font === 'sc' ? FONT.sc : FONT.text;
    const style = o.font === 'mono' ? '500' : o.font === 'sc' ? '600' : 'italic 500';
    const base = o.size ?? 26;
    const size = legibleSize(c, `${style} ${base}px ${fam}`, base, o.font === 'sc' ? 'x' : 'H');
    c.save();
    c.translate(o.x, o.y);
    if (o.tilt) c.rotate(o.tilt);
    c.font = `${style} ${size}px ${fam}`;
    const lh = size * 1.28;
    const tw = o.w ?? Math.max(...o.lines.map((s) => c.measureText(s).width)) + size * 1.3;
    const th = lh * o.lines.length + size * 0.7;
    // shadow, paper, deckle rule
    c.globalAlpha = paper;
    c.fillStyle = withAlpha(shadowCol, 0.35);
    c.fillRect(-tw / 2 + 3, 5, tw, th);
    c.fillStyle = o.tint === 'plate' ? paperCol(env) : cardPaper(env);
    c.fillRect(-tw / 2, 0, tw, th);
    c.strokeStyle = withAlpha(inkCol(env), 0.35);
    c.lineWidth = lw(c, 1.2);
    c.strokeRect(-tw / 2 + 0.5, 0.5, tw - 1, th - 1);
    cardProbe(c, o.id, -tw / 2, 0, tw, th, paper, ink);
    if (o.pin) {
      c.fillStyle = mixLab('#b0683a', env.mood.core, 0.25);
      c.beginPath();
      c.arc(0, 4, 4.5, 0, Math.PI * 2);
      c.fill();
    }
    // the text
    c.globalAlpha = ink;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    o.lines.forEach((s, i) => {
      c.fillStyle = o.accent === i ? mixLab('#8a3d14', inkCol(env), 0.25) : inkCol(env);
      const y = size * 0.35 + lh * (i + 0.5) + size * 0.36;
      c.fillText(s, 0, y);
      const w = c.measureText(s).width;
      textProbe(c, `${o.id}-${i}`, -w / 2, y - size, w, size * 1.25, ink);
    });
    c.restore();
  });
}

// ---------------------------------------------------------------- an upright parchment sheet (bake it)
export function plateSheet(c: C2, env: PaintEnv, r: { x: number; y: number; w: number; h: number }, lamp: { x: number; y: number }, o: { shadow?: boolean } = {}) {
  const { x, y, w, h } = r;
  c.save();
  if (o.shadow !== false) {
    c.fillStyle = withAlpha(env.mood.fg, 0.5);
    c.filter = 'blur(10px)';
    c.fillRect(x + 8, y + 12, w, h);
    c.filter = 'none';
  }
  const N = 48;
  c.beginPath();
  for (let i = 0; i <= N; i++) c.lineTo(x + (w * i) / N, y + Math.sin(i * 2.3) * 1.4);
  for (let i = 0; i <= N; i++) c.lineTo(x + w + Math.sin(i * 3.1) * 1.4, y + (h * i) / N);
  for (let i = N; i >= 0; i--) c.lineTo(x + (w * i) / N, y + h + Math.sin(i * 1.7) * 1.4);
  for (let i = N; i >= 0; i--) c.lineTo(x + Math.sin(i * 2.9) * 1.4, y + (h * i) / N);
  c.closePath();
  c.fillStyle = paperCol(env);
  c.fill();
  c.clip();
  const warm = mixLab('#f6c983', env.mood.core, 0.35);
  const g = c.createRadialGradient(lamp.x, lamp.y, 20, lamp.x + 60, lamp.y + 80, Math.max(w, h) * 1.05);
  g.addColorStop(0, withAlpha(warm, 0.3));
  g.addColorStop(0.5, withAlpha(warm, 0.06));
  g.addColorStop(1, withAlpha('#3a2614', 0.32));
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  // fibres
  c.strokeStyle = withAlpha('#6a4a2c', 0.05);
  c.lineWidth = 1;
  for (let i = 0; i < 70; i++) {
    const fx = x + ((hash1(i, 3) + 1) / 2) * w, fy = y + ((hash1(i, 5) + 1) / 2) * h;
    const a = hash1(i, 9) * Math.PI;
    c.beginPath();
    c.moveTo(fx, fy);
    c.lineTo(fx + Math.cos(a) * 18, fy + Math.sin(a) * 18);
    c.stroke();
  }
  // a ruled margin
  c.strokeStyle = withAlpha(inkCol(env), 0.16);
  c.lineWidth = 1;
  c.strokeRect(x + 18, y + 18, w - 36, h - 36);
  c.restore();
}

/** a brass bead (a paper bead lacquered): dark body, a warm highlight toward the key light */
export function brassBead(c: C2, env: PaintEnv, x: number, y: number, r: number, glow = 0) {
  c.save();
  c.fillStyle = withAlpha(shadowCol, 0.3);
  c.beginPath();
  c.ellipse(x + 2, y + r * 0.9, r * 0.9, r * 0.3, 0, 0, Math.PI * 2);
  c.fill();
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, mixLab(brassOf(env, 0.6 + glow * 0.4), '#fff3d0', 0.2 + glow * 0.3));
  g.addColorStop(0.55, brassOf(env, glow * 0.5));
  g.addColorStop(1, mixLab(brassOf(env, 0), '#2a1d14', 0.6));
  c.fillStyle = g;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ---------------------------------------------------------------- the host clockwork, with its parts driven apart
/**
 * The same clockwork as sets/hostClockwork (300-tooth ratchet, six pierced spokes, the release pawl, the escapement
 * anchor above-left, the hub and the crank), but with the escapement and the crank driven separately: the escapement
 * ticks once per PHRASE of the host loop (esc: a continuous count of ticks), the crank turns once per EVALUATION
 * (crank: revolutions), so one turn of the clock can show four ticks and one revolution (ch06-s02). Also: the case
 * (two posts, a bridge, a base) whose brass edges warm with `lit`, and an escapement `lock` (a detent latch drops).
 */
export interface ClockXOpts {
  x: number;
  y: number;
  r: number;
  esc?: number;
  crank?: number;
  steps?: number;
  release?: number;
  /** 0..1 the case's brass edges warm (the host lit) */
  lit?: number;
  /** 0..1 the escapement's detent latch dropped (the clock at rest) */
  lock?: number;
  /** draw the case (posts, bridge, base); default true */
  frame?: boolean;
  /** silhouette ink for a deeper layer */
  silhouette?: boolean;
  /** draw the built-in release pawl; default true (ch06-s04 draws its own, larger) */
  pawl?: boolean;
}
export function clockworkX(c: C2, env: PaintEnv, o: ClockXOpts) {
  const ink = o.silhouette ? env.fill('ink') : PUPPET_NEAR_BLACK;
  const r = o.r;
  const lit = clamp01(o.lit ?? 0);
  const br = brassOf(env, lit);
  const rimC = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.85);
  // ---- the case: posts, bridge and base (behind the wheel)
  if (o.frame !== false) {
    c.fillStyle = ink;
    const px = r * 1.22;
    c.fillRect(o.x - px - 10, o.y - r * 1.5, 20, r * 2.9);
    c.fillRect(o.x + px - 10, o.y - r * 1.5, 20, r * 2.9);
    c.fillRect(o.x - px - 24, o.y - r * 1.56, px * 2 + 48, 16);
    c.fillRect(o.x - px - 36, o.y + r * 1.36, px * 2 + 72, 24);
    c.fillRect(o.x - px - 24, o.y + r * 1.36 + 24, px * 2 + 48, 10);
    // finials
    for (const s of [-1, 1]) {
      c.beginPath();
      c.arc(o.x + s * px, o.y - r * 1.62, 12, 0, Math.PI * 2);
      c.fill();
    }
    // brass edges: the posts' window-facing edges, the bridge and the base tops
    c.strokeStyle = withAlpha(br, 0.35 + 0.6 * lit);
    c.lineWidth = lw(c, 1.6 + 1.2 * lit);
    c.beginPath();
    c.moveTo(o.x - px - 24, o.y - r * 1.56);
    c.lineTo(o.x + px + 24, o.y - r * 1.56);
    c.moveTo(o.x - px - 36, o.y + r * 1.36);
    c.lineTo(o.x + px + 36, o.y + r * 1.36);
    c.moveTo(o.x - px + 10, o.y - r * 1.5);
    c.lineTo(o.x - px + 10, o.y + r * 1.36);
    c.moveTo(o.x + px - 10, o.y - r * 1.5);
    c.lineTo(o.x + px - 10, o.y + r * 1.36);
    c.stroke();
  }
  // ---- the ratchet wheel
  const TEETH = CLOCK.TEETH;
  const steps = Math.max(0, Math.min(TEETH, o.steps ?? 0));
  c.save();
  c.translate(o.x, o.y);
  c.rotate((steps / TEETH) * Math.PI * 2);
  c.fillStyle = ink;
  c.beginPath();
  for (let i = 0; i < TEETH; i++) {
    const a0 = (i / TEETH) * Math.PI * 2;
    const a1 = ((i + 0.85) / TEETH) * Math.PI * 2;
    const a2 = ((i + 1) / TEETH) * Math.PI * 2;
    if (i === 0) c.moveTo(Math.cos(a0) * r * 0.97, Math.sin(a0) * r * 0.97);
    c.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    c.lineTo(Math.cos(a2) * r * 0.97, Math.sin(a2) * r * 0.97);
  }
  c.closePath();
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.26;
    const a2 = a + (Math.PI * 2) / 6 - 0.32;
    c.moveTo(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22);
    c.arc(0, 0, r * 0.84, a, a2);
    c.arc(0, 0, r * 0.22, a2, a, true);
    c.closePath();
  }
  c.fill('evenodd');
  c.strokeStyle = rimC;
  c.lineWidth = lw(c, 2);
  c.beginPath();
  c.arc(0, 0, r, Math.PI * 1.1, Math.PI * 1.9);
  c.stroke();
  c.restore();
  // ---- the release pawl
  const rel = clamp01(o.release ?? 0);
  c.fillStyle = ink;
  if (o.pawl !== false) {
  c.beginPath();
  c.moveTo(o.x + r * 0.62, o.y - r * 1.12);
  c.lineTo(o.x + r * 0.08, o.y - r * 0.985 - rel * r * 0.18);
  c.lineTo(o.x + r * 0.16, o.y - r * 1.07 - rel * r * 0.18);
  c.lineTo(o.x + r * 0.68, o.y - r * 1.2);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(o.x + r * 0.66, o.y - r * 1.16, r * 0.05, 0, Math.PI * 2);
  c.fill();
  }
  // ---- the escapement: an anchor rocking once per tick, above-left of the wheel
  const esc = o.esc ?? 0;
  const ph = esc - Math.floor(esc);
  const rock = Math.sin(Math.min(1, ph * 4) * Math.PI) * 0.22 * (Math.floor(esc) % 2 === 0 ? 1 : -1);
  const ex = o.x - r * 0.9, ey = o.y - r * 0.95;
  c.save();
  c.translate(ex, ey);
  c.rotate(rock);
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-r * 0.32, r * 0.18);
  c.quadraticCurveTo(0, -r * 0.12, r * 0.32, r * 0.18);
  c.lineTo(r * 0.26, r * 0.22);
  c.quadraticCurveTo(0, -r * 0.02, -r * 0.26, r * 0.22);
  c.closePath();
  c.rect(-r * 0.025, -r * 0.4, r * 0.05, r * 0.42);
  c.fill();
  c.beginPath();
  c.arc(0, 0, r * 0.05, 0, Math.PI * 2);
  c.fillStyle = o.silhouette ? ink : brassOf(env, ph > 0 && ph < 0.2 ? 1 : lit * 0.4);
  c.fill();
  c.restore();
  // the detent latch: a small hooked lever that drops onto the anchor's arm when the clock rests
  const lock = clamp01(o.lock ?? 0);
  c.save();
  c.translate(ex - r * 0.5, ey - r * 0.42);
  c.rotate(-0.9 + 0.9 * lock);
  c.fillStyle = ink;
  c.fillRect(0, -r * 0.03, r * 0.44, r * 0.06);
  c.beginPath();
  c.moveTo(r * 0.44, -r * 0.03);
  c.lineTo(r * 0.5, r * 0.1);
  c.lineTo(r * 0.4, r * 0.03);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(0, 0, r * 0.045, 0, Math.PI * 2);
  c.fillStyle = o.silhouette ? ink : brassOf(env, lock * 0.6);
  c.fill();
  c.restore();
  // ---- the hub and the crank (one revolution per evaluation)
  const ca = (o.crank ?? 0) * Math.PI * 2;
  c.fillStyle = o.silhouette ? ink : brassOf(env, 0.2 + lit * 0.3);
  c.beginPath();
  c.arc(o.x, o.y, r * 0.12, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = o.silhouette ? ink : brassOf(env, 0.2 + lit * 0.3);
  c.lineWidth = Math.max(lw(c, 3), r * 0.045);
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(o.x, o.y);
  const cx = o.x + Math.cos(ca) * r * 0.45, cy = o.y + Math.sin(ca) * r * 0.45;
  c.lineTo(cx, cy);
  c.stroke();
  c.fillStyle = ink;
  c.beginPath();
  c.arc(cx, cy, r * 0.055, 0, Math.PI * 2);
  c.fill();
}
/** where the clockwork's escapement pivot is (for flares) */
export const escapementAt = (o: { x: number; y: number; r: number }) => ({ x: o.x - o.r * 0.9, y: o.y - o.r * 0.95 });
