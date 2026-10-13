/**
 * neural-net-history — ch12-s02's paper garden at dusk (duskRose): rankings train a judge, the judge shapes the
 * model, like a gardener shaping a hedge.
 *
 *   gardenBack(f, { key, cams })                     sky, far trees (L1), garden wall (L2), the vast hedge (L3)
 *   GARDEN                                           geometry (L4 world = rest-screen px)
 *   vastHedgeTag / topiary / shearsArt / scalesArt / sketchArt / rosette / gardenPlate / leaves
 *
 * THE METHOD as three garden tools on a hanging parchment plate (sketch → scales → shears):
 *   sketch  people write example answers (a gardener's sketch of the shape wanted)
 *   scales  the judge: a reward model learned from people's rankings (it tips toward the ranked scroll)
 *   shears  reinforcement learning against that judge (they move on their own and snip, one snip per ranking)
 * The vast shaggy hedge (tag 175B) stands untrimmed at left; the small topiary (tag 1.3B) at right takes its
 * shape snip by snip (roughness ← snips so far).
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, type Rect } from '../../../film/core/multiplane';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { tree } from '../../../film/silhouette/nature';
import { FONT } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/core/frame';
import { clamp01, sm } from './ch02-s05b-util';

type C = CanvasRenderingContext2D;
type Pt = { x: number; y: number };

export const GARDEN = {
  ground: 640,
  /** the vast hedge (L3): x span, base, typical top */
  hedge: { x0: -260, x1: 700, base: 650, top: 84 },
  /** (round 1) the 175B tag hangs at mid-height on the hedge's lit (sky-facing, right) shoulder */
  hedgeTag: { x: 626, y: 340 },
  /** the topiary (L4): pot base centre */
  topiary: { x: 930, y: 652, s: 0.76 },
  /** the labeller's desk (L4) */
  desk: { x0: 150, x1: 560, y: 590 },
  labeller: { x: 176, y: 712, s: 0.86 },
  /** the two scrolls hang from a little rod-frame on the desk */
  scrollRod: { x0: 372, x1: 548, y: 362 },
  scrolls: [
    { x: 410, w: 66 },
    { x: 506, w: 66 },
  ],
  scrollH: 150,
  /** the hanging parchment plate (L4): rect and tool pegs */
  plate: { x: 690, y: 38, w: 500, h: 270, tilt: -0.013 },
  pegs: [
    { x: 784, y: 66 },
    { x: 940, y: 66 },
    { x: 1096, y: 66 },
  ] as Pt[],
  /** (round 1) the plate is drawn 1.12× about its top centre (the teaching diagram, a little larger) */
  plateS: 1.12,
  /** the low clipped hedge behind the topiary where the judges stand (L3) */
  jury: { x0: 760, x1: 1340, y: 560 },
} as const;

const bake = (f: Frame, c: C, key: string, r: Rect, paint: (cc: C) => void) =>
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

// ------------------------------------------------------------------------------------------------ shaggy outlines
/** a shaggy leaf-edge path around a polygon outline (bumps of leaves), seeded */
function shaggy(p: Path2D, pts: Pt[], seed: number, bump: number) {
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const L = Math.hypot(b.x - a.x, b.y - a.y);
    const n = Math.max(1, Math.round(L / 11));
    for (let k = 0; k < n; k++) {
      const u0 = k / n, u1 = (k + 1) / n;
      const x0 = a.x + (b.x - a.x) * u0, y0 = a.y + (b.y - a.y) * u0;
      const x1 = a.x + (b.x - a.x) * u1, y1 = a.y + (b.y - a.y) * u1;
      const nx = (y1 - y0) / (L / n), ny = -(x1 - x0) / (L / n);
      const h = bump * (0.5 + hash1(i * 97 + k, seed));
      if (i === 0 && k === 0) p.moveTo(x0, y0);
      p.quadraticCurveTo((x0 + x1) / 2 + nx * h, (y0 + y1) / 2 + ny * h, x1, y1);
    }
  }
  p.closePath();
}

/** the vast hedge's crown line (round 1: its untrimmed TOP is in frame, a leafy irregular edge, and its right end is a
 *  rounded, lit shoulder that comes down to a visible base on the lawn) */
export function hedgeCrownY(x: number): number {
  const H = GARDEN.hedge;
  const sh0 = 540;
  const top = (xx: number) => H.top + 20 * Math.sin(xx * 0.011 + 1) + 13 * Math.sin(xx * 0.037 + 0.4) + 9 * Math.sin(xx * 0.083);
  if (x <= sh0) return top(x);
  const u = Math.min(1, (x - sh0) / (H.x1 - sh0));
  return top(sh0) + (H.base - top(sh0)) * (1 - Math.sqrt(Math.max(0, 1 - u * u)));
}
function hedgePath(): Path2D {
  const H = GARDEN.hedge;
  const pts: Pt[] = [];
  pts.push({ x: H.x0, y: H.base });
  for (let x = H.x0; x < H.x1; x += 18) pts.push({ x, y: hedgeCrownY(x) + 10 * hash1(Math.round(x), 3) });
  pts.push({ x: H.x1, y: H.base - 12 });
  pts.push({ x: H.x1 - 8, y: H.base });
  const p = new Path2D();
  shaggy(p, pts, 41, 12);
  return p;
}
/** stray sprigs standing out of the crown and the shoulder: thin stems with a few leaves (untrimmed growth) */
function hedgeSprigs(c: C, fill: string) {
  const H = GARDEN.hedge;
  c.fillStyle = fill;
  c.strokeStyle = fill;
  for (let i = 0; i < 34; i++) {
    const x = H.x0 + 40 + (H.x1 - H.x0 - 60) * (i / 34 + 0.02 * hash1(i, 81));
    const y0 = hedgeCrownY(x) + 2;
    const shoulder = x > 540;
    const ang = shoulder ? -0.2 + 0.9 * ((x - 540) / (H.x1 - 540)) : -1.57 + 0.5 * hash1(i, 82);
    const len = 16 + 22 * (hash1(i, 83) * 0.5 + 0.5);
    const dir = shoulder ? { x: Math.cos(ang), y: -Math.sin(Math.PI / 2 - ang) * 0.4 - 0.6 } : { x: Math.cos(ang), y: Math.sin(ang) };
    const dl = Math.hypot(dir.x, dir.y) || 1;
    const ex = x + (dir.x / dl) * len, ey = y0 + (dir.y / dl) * len;
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x, y0);
    c.quadraticCurveTo((x + ex) / 2 + 4 * hash1(i, 84), (y0 + ey) / 2, ex, ey);
    c.stroke();
    for (let k = 1; k <= 3; k++) {
      const u = k / 3.2;
      const lx = x + (ex - x) * u, ly = y0 + (ey - y0) * u;
      c.beginPath();
      c.ellipse(lx + (k % 2 ? 4 : -4), ly, 5.5, 2.6, (k % 2 ? 0.6 : -0.6) + ang * 0.3, 0, Math.PI * 2);
      c.fill();
    }
  }
}
let HEDGE: Path2D | null = null;

// ------------------------------------------------------------------------------------------------ the backdrop
export function gardenBack(f: Frame, o: { key: string; cams: Camera3[] }) {
  f.backlight({ sunX: 780, sunY: 430, sunRadius: 520, intensity: 0.95 });
  // L1: far trees and a far garden wall, hazy
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, o.cams, 60);
    bake(f, c, `${o.key}/g/L1/${env.mood.id}/${rk(r)}`, r, (cc) => {
      for (let i = 0; i < 7; i++) {
        const x = r.x + 60 + i * ((r.w - 120) / 6) + 40 * (hash1(i, 5) - 0.5);
        tree(cc, { x, y: 520, h: 210 + 90 * hash1(i, 6), kind: i % 3 === 0 ? 'elm' : 'oak', seed: 120 + i, leaves: 0.8, detail: 0.6 }, env);
      }
      cc.fillStyle = env.fill('set');
      cc.fillRect(r.x, 500, r.w, r.y + r.h - 500);
    });
  });
  // L2: a clipped yew wall across the garden with an arched gap at the centre (the dusk shows through)
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 60);
    bake(f, c, `${o.key}/g/L2/${env.mood.id}/${rk(r)}`, r, (cc) => {
      const top = 452;
      const p = new Path2D();
      const pts: Pt[] = [
        { x: r.x - 20, y: r.y + r.h },
        { x: r.x - 20, y: top },
        { x: 690, y: top },
        { x: 690, y: 560 },
        { x: 830, y: 560 },
        { x: 830, y: top },
        { x: r.x + r.w + 20, y: top },
        { x: r.x + r.w + 20, y: r.y + r.h },
      ];
      shaggy(p, pts, 17, 2.4);
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.15);
      cc.fill(p);
      cc.strokeStyle = withAlpha(env.mood.rim, 0.16);
      cc.lineWidth = 1.2;
      cc.beginPath();
      cc.moveTo(r.x, top);
      cc.lineTo(r.x + r.w, top);
      cc.stroke();
      // the lawn: darker toward us
      const g = cc.createLinearGradient(0, 560, 0, r.y + r.h);
      g.addColorStop(0, mixLab(env.fill('set'), env.mood.setHaze, 0.25));
      g.addColorStop(1, mixLab(env.fill('set'), env.mood.fg, 0.5));
      cc.fillStyle = g;
      cc.fillRect(r.x, 560, r.w, r.y + r.h - 560);
    });
  });
  f.fog({ yCenter: 470, height: 260, alpha: 0.26, drift: 6 });
  // L3: the vast hedge (untrimmed), its tag; the low clipped hedge behind the topiary
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, o.cams, 40);
    bake(f, c, `${o.key}/g/L3/${env.mood.id}/${rk(r)}`, r, (cc) => {
      if (!HEDGE) HEDGE = hedgePath();
      const H = GARDEN.hedge;
      // the contact shadow on the lawn: the hedge stands ON the ground plane
      const sh = cc.createRadialGradient(240, H.base + 4, 40, 240, H.base + 4, 560);
      sh.addColorStop(0, withAlpha(env.mood.fg, 0.4));
      sh.addColorStop(1, withAlpha(env.mood.fg, 0));
      cc.fillStyle = sh;
      cc.beginPath();
      cc.ellipse(240, H.base + 4, 560, 20, 0, 0, Math.PI * 2);
      cc.fill();
      // one step darker than the garden wall and the trees behind it
      const hedgeFill = mixLab(env.fill('set'), env.mood.fg, 0.52);
      cc.fillStyle = hedgeFill;
      cc.fill(HEDGE);
      hedgeSprigs(cc, hedgeFill);
      // leaf texture: a scatter of darker and lighter leaf-shapes inside (cut-paper relief)
      cc.save();
      cc.clip(HEDGE);
      for (let i = 0; i < 900; i++) {
        const x = H.x0 + (H.x1 - H.x0 + 30) * (hash1(i, 61) * 0.5 + 0.5);
        const y = H.top - 40 + (H.base - H.top + 40) * (hash1(i, 62) * 0.5 + 0.5);
        cc.fillStyle = i % 3 ? withAlpha(env.mood.fg, 0.25) : withAlpha(env.mood.rim, 0.06);
        cc.beginPath();
        cc.ellipse(x, y, 7 + 5 * hash1(i, 63), 3.5, hash1(i, 64) * 3, 0, Math.PI * 2);
        cc.fill();
      }
      // the base: woody shadow where the leaves thin out above the lawn
      const bg = cc.createLinearGradient(0, H.base - 70, 0, H.base);
      bg.addColorStop(0, withAlpha(env.mood.fg, 0));
      bg.addColorStop(1, withAlpha(env.mood.fg, 0.45));
      cc.fillStyle = bg;
      cc.fillRect(H.x0 - 20, H.base - 70, H.x1 - H.x0 + 60, 90);
      cc.restore();
      // the rim: a 1.5 px backlit edge on the sky-facing crown and the lit right shoulder only
      cc.save();
      cc.beginPath();
      cc.rect(H.x0 - 40, H.top - 80, H.x1 - H.x0 + 120, H.base - 60 - (H.top - 80));
      cc.clip();
      cc.strokeStyle = withAlpha(env.mood.rim, 0.5);
      cc.lineWidth = 1.5;
      cc.save();
      cc.translate(0.8, -0.8);
      cc.stroke(HEDGE);
      cc.restore();
      cc.restore();
      // the low clipped jury hedge (a neat box hedge) behind the topiary
      const J = GARDEN.jury;
      const jp = new Path2D();
      shaggy(jp, [{ x: J.x0, y: J.y + 120 }, { x: J.x0, y: J.y }, { x: J.x1, y: J.y }, { x: J.x1, y: J.y + 120 }], 23, 1.6);
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.3);
      cc.fill(jp);
      cc.strokeStyle = withAlpha(env.mood.rim, 0.2);
      cc.beginPath();
      cc.moveTo(J.x0, J.y);
      cc.lineTo(J.x1, J.y);
      cc.stroke();
      // the hedge's tag: string and paper
      tag(cc, env, GARDEN.hedgeTag.x, GARDEN.hedgeTag.y, '175B', 0.05, 30, true);
    });
  });
  f.fog({ yCenter: 620, height: 140, alpha: 0.12, drift: -5 });
}

/** a small paper prop tag on a string (Special Elite); `size` is the typed letters' px size (round 1: 175B on L3 at 30
 *  on a PALE tag, 1.3B on L4 at 26: ≥ 28 px cap height at 1080p with Special Elite's cap ratio of 0.69). Set on the
 *  alphabetic baseline (the legibility audit measures cap height from the current baseline). */
export function tag(c: C, env: PaintEnv, x: number, y: number, text: string, rot: number, size = 24, pale = false) {
  const m = env.mood;
  const k = size / 24;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.strokeStyle = withAlpha(mixLab(m.rim, m.halo, 0.4), 0.8);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, -26);
  c.lineTo(0, 0);
  c.stroke();
  c.font = `400 ${size}px ${FONT.typewriter}`;
  const w = c.measureText(text).width + 22 * k;
  const h = 32 * k;
  if (pale) {
    // a soft shadow under a pale paper tag (it hangs against the dark hedge)
    c.fillStyle = withAlpha(m.fg, 0.35);
    c.fillRect(-w / 2 + 3, 4, w, h);
  }
  c.fillStyle = pale ? mixLab(mixLab(m.rim, m.halo, 0.35), '#f3e6cf', 0.45) : mixLab(m.rim, m.halo, 0.35);
  c.beginPath();
  c.moveTo(-w / 2 + 8 * k, 0);
  c.lineTo(w / 2, 0);
  c.lineTo(w / 2, h);
  c.lineTo(-w / 2, h);
  c.lineTo(-w / 2, 8 * k);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(pale ? MOODS.parchment.ink : m.ink, 0.92);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  // (round 1) set on the alphabetic baseline: the cap sits centred in the tag
  c.fillText(text, 0, h / 2 + size * 0.345);
  c.restore();
}

// ------------------------------------------------------------------------------------------------ the topiary
/** the topiary at `rough` (1 = an untrimmed bush, 0 = clipped clean: two stacked balls on a stem in a pot) */
export function topiary(c: C, env: PaintEnv, rough: number, seed: number) {
  const { x, y, s: S } = GARDEN.topiary;
  c.save();
  c.translate(x, y);
  c.scale(S, S);
  c.translate(-x, -y);
  topiaryArt(c, env, rough, seed);
  c.restore();
}
/** a point given in the topiary's unscaled drawing coords → world (the topiary is drawn scaled about its pot base) */
export function topiaryPt(p: Pt): Pt {
  const T = GARDEN.topiary;
  return { x: T.x + (p.x - T.x) * T.s, y: T.y + (p.y - T.y) * T.s };
}
function topiaryArt(c: C, env: PaintEnv, rough: number, seed: number) {
  const { x, y } = GARDEN.topiary;
  const ink = mixLab(env.fill('ink'), env.mood.set, 0.15);
  c.fillStyle = ink;
  // pot
  c.beginPath();
  c.moveTo(x - 46, y - 58);
  c.lineTo(x + 46, y - 58);
  c.lineTo(x + 36, y);
  c.lineTo(x - 36, y);
  c.closePath();
  c.fill();
  c.fillRect(x - 52, y - 66, 104, 10);
  // stem
  c.fillRect(x - 4, y - 120, 8, 64);
  // the two balls (clipped) blending from a ragged bush; leaf bumps shrink as rough → 0
  const balls = [
    { cx: x, cy: y - 170, r: 64 },
    { cx: x, cy: y - 272, r: 40 },
  ];
  const p = new Path2D();
  const bush = rough;
  for (let b = 0; b < balls.length; b++) {
    const B = balls[b];
    const N = 56;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const n = hash1(i * 7 + b * 131, seed) * 0.5 + 0.5;
      const sprig = hash1(i * 3 + b * 17, seed + 2) > 0.72 ? 1 : 0;
      const R = B.r * (1 + 0.32 * bush) + bush * (10 * n + 18 * sprig) + (1 - bush) * 1.2 * n;
      const px = B.cx + Math.cos(a) * R * (1 + 0.12 * bush * Math.sin(a * 2 + b));
      const py = B.cy + Math.sin(a) * R;
      if (i === 0) p.moveTo(px, py);
      else p.lineTo(px, py);
    }
    p.closePath();
  }
  // the untrimmed bush also bridges the two balls
  if (bush > 0.05) p.ellipse(x, y - 222, 48 * bush + 12, 60, 0, 0, Math.PI * 2);
  c.fill(p);
  // clipped surface: two faint rim arcs on the lit (upper-left) side once neat
  const neat = 1 - bush;
  if (neat > 0.05) {
    c.strokeStyle = withAlpha(env.mood.rim, 0.4 * neat);
    c.lineWidth = 1.4;
    for (const B of balls) {
      c.beginPath();
      c.arc(B.cx, B.cy, B.r * (1 + 0.32 * bush) + 0.5, Math.PI * 1.05, Math.PI * 1.6);
      c.stroke();
    }
  }
}

// ------------------------------------------------------------------------------------------------ the tools
/** garden shears: blades open by `open` (0..1), drawn along +x (blades) from the pivot at (0,0) */
export function shearsArt(c: C, env: PaintEnv, x: number, y: number, s: number, rot: number, open: number) {
  const ink = env.fill('ink');
  const a = 0.06 + 0.32 * open;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  c.fillStyle = ink;
  for (const sgn of [-1, 1]) {
    c.save();
    c.rotate(sgn * a);
    // blade
    c.beginPath();
    c.moveTo(-4, 0);
    c.lineTo(60, sgn * -2);
    c.quadraticCurveTo(66, sgn * 3, 58, sgn * 7);
    c.lineTo(-2, sgn * 7);
    c.closePath();
    c.fill();
    // handle (wooden, the long grip)
    c.beginPath();
    c.roundRect(-64, sgn * 2 - 3.5, 52, 7, 3.5);
    c.fill();
    c.restore();
  }
  c.fillStyle = withAlpha(env.mood.rim, 0.8);
  c.beginPath();
  c.arc(0, 0, 2.6, 0, Math.PI * 2);
  c.fill();
  // the edge catches the light
  c.strokeStyle = withAlpha(env.mood.rim, 0.55);
  c.lineWidth = 1 / s;
  c.beginPath();
  c.rotate(-a);
  c.moveTo(2, -2);
  c.lineTo(58, -2);
  c.stroke();
  c.restore();
}

/** a pair of balance scales hanging from its ring at (x, y): beam tilt `tip` (radians, + = left pan down) */
export function scalesArt(c: C, env: PaintEnv, x: number, y: number, tip: number, load: number) {
  const ink = env.fill('ink');
  c.save();
  c.translate(x, y);
  c.fillStyle = ink;
  c.strokeStyle = ink;
  // hanging ring and post
  c.lineWidth = 3;
  c.beginPath();
  c.arc(0, 4, 5, 0, Math.PI * 2);
  c.stroke();
  c.fillRect(-2, 8, 4, 16);
  // the beam
  c.save();
  c.translate(0, 26);
  c.rotate(-tip);
  c.fillRect(-62, -2.5, 124, 5);
  c.beginPath();
  c.moveTo(0, -8);
  c.lineTo(6, 2);
  c.lineTo(-6, 2);
  c.closePath();
  c.fill();
  const ends = [-60, 60];
  c.restore();
  // pans hang plumb from the beam's ends
  for (let i = 0; i < 2; i++) {
    const ex = Math.cos(tip) * ends[i];
    const ey = 26 + Math.sin(tip) * -ends[i];
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x - x + ex, ey);
    c.lineTo(ex - 18, ey + 46);
    c.moveTo(ex, ey);
    c.lineTo(ex + 18, ey + 46);
    c.stroke();
    c.beginPath();
    c.moveTo(ex - 22, ey + 46);
    c.quadraticCurveTo(ex, ey + 60, ex + 22, ey + 46);
    c.closePath();
    c.fill();
    // the left pan holds the ranked scroll (a tiny rolled scroll)
    if (i === 0 && load > 0) {
      c.globalAlpha *= load;
      c.fillRect(ex - 10, ey + 36, 20, 8);
      c.globalAlpha /= load;
    }
  }
  c.restore();
}

/** a gardener's sketchbook on a peg: an open page with a pencil sketch of the topiary (the example answers) */
export function sketchArt(c: C, env: PaintEnv, x: number, y: number) {
  const m = env.mood;
  const P = MOODS.parchment;
  c.save();
  c.translate(x, y);
  c.rotate(-0.04);
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-20, 18);
  c.moveTo(0, 0);
  c.lineTo(20, 18);
  c.stroke();
  c.fillStyle = mixLab(P.sky[0], m.halo, 0.12);
  c.fillRect(-36, 18, 72, 96);
  c.strokeStyle = withAlpha(P.ink, 0.5);
  c.strokeRect(-36, 18, 72, 96);
  // the sketch: two balls on a stem, a pot, hatching
  c.strokeStyle = withAlpha(P.ink, 0.75);
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(0, 52, 12, 0, Math.PI * 2);
  c.moveTo(18, 74);
  c.arc(0, 74, 18, 0, Math.PI * 2);
  c.moveTo(0, 92);
  c.lineTo(0, 98);
  c.moveTo(-10, 98);
  c.lineTo(10, 98);
  c.lineTo(7, 108);
  c.lineTo(-7, 108);
  c.closePath();
  c.stroke();
  c.lineWidth = 0.7;
  for (let i = 0; i < 5; i++) {
    c.beginPath();
    c.moveTo(-14 + i * 5, 64 + i);
    c.lineTo(-6 + i * 5, 84);
    c.stroke();
  }
  // a pencil tucked on the peg
  c.fillStyle = env.fill('ink');
  c.save();
  c.translate(30, 12);
  c.rotate(0.9);
  c.fillRect(0, -1.6, 34, 3.2);
  c.restore();
  c.restore();
}

/** a rosette ribbon pinned at (x, y): a pleated disc and two tails (the shot's one warm accent) */
export function rosette(c: C, env: PaintEnv, x: number, y: number, a: number, seed: number) {
  if (a <= 0) return;
  const m = env.mood;
  const col = mixLab(m.core, '#d48a6a', 0.45);
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.rotate((hash1(seed, 3) - 0.5) * 0.4);
  c.fillStyle = mixLab(col, m.ink, 0.25);
  c.beginPath();
  c.moveTo(-4, 4);
  c.lineTo(-9, 26);
  c.lineTo(-4, 22);
  c.lineTo(-1, 27);
  c.closePath();
  c.moveTo(4, 4);
  c.lineTo(9, 25);
  c.lineTo(4, 21);
  c.lineTo(1, 26);
  c.closePath();
  c.fill();
  c.fillStyle = col;
  c.beginPath();
  for (let i = 0; i <= 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    const r = i % 2 ? 9 : 11;
    if (i === 0) c.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
    else c.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
  }
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(col, m.core, 0.5);
  c.beginPath();
  c.arc(0, 0, 4.5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** falling clippings: small leaf cut-outs released at snip times, tumbling down (pure in t) */
export function clippings(c: C, env: PaintEnv, t: number, snips: number[], at: Pt) {
  const ink = mixLab(env.fill('ink'), env.mood.set, 0.25);
  c.fillStyle = ink;
  for (let k = 0; k < snips.length; k++) {
    const dt = t - snips[k];
    if (dt < 0 || dt > 1.6) continue;
    for (let i = 0; i < 6; i++) {
      const sx = at.x + (hash1(k * 13 + i, 71) - 0.2) * 70;
      const sy = at.y + (hash1(k * 13 + i, 72) - 0.5) * 60;
      const vx = (hash1(k * 13 + i, 73) - 0.5) * 40;
      const y = sy + 140 * dt * dt + 20 * dt;
      if (y > GARDEN.topiary.y) continue;
      const x = sx + vx * dt + 6 * Math.sin(dt * 7 + i);
      c.save();
      c.globalAlpha *= clamp01(1.6 - dt);
      c.translate(x, y);
      c.rotate(dt * 5 + i);
      c.beginPath();
      c.ellipse(0, 0, 5, 2.4, 0, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
    // (round 1) and one whole SPRIG per snip: a twig with three leaves, tumbling down to the lawn
    const sx = at.x + 30 + (hash1(k, 75) - 0.5) * 40, sy = at.y + (hash1(k, 76) - 0.5) * 50;
    const y = sy + 150 * dt * dt + 10 * dt;
    if (y < GARDEN.topiary.y - 4) {
      c.save();
      c.globalAlpha *= clamp01(1.6 - dt);
      c.translate(sx + 14 * dt + 5 * Math.sin(dt * 6), y);
      c.rotate(0.6 + dt * 3.2 * (k % 2 ? 1 : -1));
      c.strokeStyle = ink;
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(-13, 0);
      c.lineTo(13, 0);
      c.stroke();
      for (let i = 0; i < 3; i++) {
        c.beginPath();
        c.ellipse(-8 + i * 8, i % 2 ? 4 : -4, 6, 2.8, i % 2 ? 0.5 : -0.5, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }
  }
}

/** the plate's transform (a slight tilt about its top centre): apply inside, or map plate points to world */
export function plateXf(c: C) {
  const R = GARDEN.plate;
  c.translate(R.x + R.w / 2, R.y);
  c.rotate(R.tilt);
  c.scale(GARDEN.plateS, GARDEN.plateS);
  c.translate(-(R.x + R.w / 2), -R.y);
}
export function plateToWorld(p: Pt): Pt {
  const R = GARDEN.plate;
  const dx = (p.x - (R.x + R.w / 2)) * GARDEN.plateS, dy = (p.y - R.y) * GARDEN.plateS;
  const ca = Math.cos(R.tilt), sa = Math.sin(R.tilt);
  return { x: R.x + R.w / 2 + dx * ca - dy * sa, y: R.y + dx * sa + dy * ca };
}
/** a deckled (torn-paper) rectangle path */
function deckle(x: number, y: number, w: number, h: number, seed: number): Path2D {
  const p = new Path2D();
  const j = (i: number, k: number) => 2.2 * hash1(i, seed + k);
  const step = 9;
  p.moveTo(x, y + j(0, 1));
  for (let xx = x + step; xx < x + w; xx += step) p.lineTo(xx, y + j(xx, 1));
  for (let yy = y; yy < y + h; yy += step) p.lineTo(x + w - j(yy, 2), yy);
  for (let xx = x + w; xx > x; xx -= step) p.lineTo(xx, y + h - j(xx, 3));
  for (let yy = y + h; yy > y; yy -= step) p.lineTo(x + j(yy, 4), yy);
  p.closePath();
  return p;
}
/** the parchment plate hanging on two cords from above: unfurls top-down by `open` (0..1) */
export function gardenPlate(c: C, env: PaintEnv, open: number) {
  const P = MOODS.parchment;
  const R = GARDEN.plate;
  const h = R.h * sm(open);
  if (open <= 0) return;
  c.save();
  // cords up out of frame (world-vertical), tied to the rod's ends
  const ends = [plateToWorld({ x: R.x + 26, y: R.y - 4 }), plateToWorld({ x: R.x + R.w - 26, y: R.y - 4 })];
  c.strokeStyle = withAlpha(env.fill('ink'), 0.8);
  c.lineWidth = 1.2;
  for (const e of ends) {
    c.beginPath();
    c.moveTo(e.x + (e.x < R.x + R.w / 2 ? 18 : -18), -200);
    c.lineTo(e.x, e.y);
    c.stroke();
  }
  plateXf(c);
  // a soft drop shadow, the deckled sheet (a step darker than the action), a faint inner rule
  const sheet = deckle(R.x, R.y, R.w, h, 51);
  c.save();
  c.translate(5, 8);
  c.fillStyle = withAlpha(env.mood.fg, 0.3);
  c.fill(sheet);
  c.restore();
  const g = c.createLinearGradient(R.x, R.y, R.x + R.w, R.y + R.h);
  g.addColorStop(0, mixLab(mixLab(P.sky[1], env.mood.halo, 0.2), env.mood.set, 0.14));
  g.addColorStop(1, mixLab(mixLab(P.sky[3], env.mood.halo, 0.28), env.mood.set, 0.2));
  c.fillStyle = g;
  c.fill(sheet);
  // the paper darkens toward its edges (age, and the dusk falling on it)
  const v = c.createRadialGradient(R.x + R.w / 2, R.y + R.h * 0.45, R.h * 0.3, R.x + R.w / 2, R.y + R.h * 0.45, R.w * 0.62);
  v.addColorStop(0, withAlpha(P.ink, 0));
  v.addColorStop(1, withAlpha(P.ink, 0.16));
  c.save();
  c.clip(sheet);
  c.fillStyle = v;
  c.fillRect(R.x, R.y, R.w, h);
  c.restore();
  c.strokeStyle = withAlpha(P.ink, 0.2);
  c.lineWidth = 1;
  c.strokeRect(R.x + 10, R.y + 12, R.w - 20, Math.max(0, h - 22));
  // the slim hanging rod with two knobs (no heavy bar)
  c.fillStyle = env.fill('ink');
  c.fillRect(R.x - 6, R.y - 6, R.w + 12, 4);
  for (const x of [R.x - 8, R.x + R.w + 8]) {
    c.beginPath();
    c.arc(x, R.y - 4, 4, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
