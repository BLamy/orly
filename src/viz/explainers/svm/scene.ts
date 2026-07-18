import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Support Vector Machines — the widest street.
 *
 * All math at module scope and verified by running it. The max-margin
 * hyperplane on 20 seeded points is solved EXACTLY by enumerating candidate
 * support sets (pairs and 2+1 triples) and checking feasibility: verified
 * w = (0.707, 1.405), b = -0.386, street width 1.272, exactly three support
 * vectors, and every point's margin ≥ 1.000. The XOR lift solves the dual of
 * a kernel machine with the quadratic kernel (x·y + 1)²: verified alphas all
 * 0.125 and decision values exactly +1 +1 −1 −1 on the four corners.
 */

const rand = mulberry32(66);
const g = gaussian(rand);

export interface Pt {
  x: number;
  y: number;
  c: -1 | 1;
}
export const POINTS: Pt[] = (() => {
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) pts.push({ x: -1.05 + g() * 0.4, y: -0.75 + g() * 0.4, c: -1 });
  for (let i = 0; i < 10; i++) pts.push({ x: 1.05 + g() * 0.4, y: 0.75 + g() * 0.4, c: 1 });
  return pts;
})();

interface Plane {
  w: { x: number; y: number };
  b: number;
  marg: number;
  sv: number[];
}
export const SOLVED: Plane = (() => {
  const P = POINTS;
  const n = P.length;
  let best: Plane | null = null;
  const feasible = (w: { x: number; y: number }, b: number) => P.every((p) => p.c * (w.x * p.x + w.y * p.y + b) >= 1 - 1e-9);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      if (P[i].c !== 1 || P[j].c !== -1) continue;
      const dx = P[i].x - P[j].x;
      const dy = P[i].y - P[j].y;
      const d2 = dx * dx + dy * dy;
      const w = { x: (2 * dx) / d2, y: (2 * dy) / d2 };
      const mid = { x: (P[i].x + P[j].x) / 2, y: (P[i].y + P[j].y) / 2 };
      const b = -(w.x * mid.x + w.y * mid.y);
      if (feasible(w, b)) {
        const marg = 2 / Math.hypot(w.x, w.y);
        if (!best || marg > best.marg) best = { w, b, marg, sv: [i, j] };
      }
    }
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      if (P[i].c !== P[j].c) continue;
      for (let k = 0; k < n; k++) {
        if (P[k].c === P[i].c) continue;
        const ux = P[j].x - P[i].x;
        const uy = P[j].y - P[i].y;
        const dot = -uy * (P[i].x - P[k].x) + ux * (P[i].y - P[k].y);
        if (Math.abs(dot) < 1e-9) continue;
        const sc = (2 * P[i].c) / dot;
        const w = { x: -uy * sc, y: ux * sc };
        const b = P[i].c - (w.x * P[i].x + w.y * P[i].y);
        if (feasible(w, b)) {
          const marg = 2 / Math.hypot(w.x, w.y);
          if (!best || marg > best.marg) best = { w, b, marg, sv: [i, j, k] };
        }
      }
    }
  return best!;
})();

/** the point farthest from the street (safe to delete in the demo). */
export const FAR_IDX: number = (() => {
  let bi = 0;
  let bm = -1;
  POINTS.forEach((p, i) => {
    const m = p.c * (SOLVED.w.x * p.x + SOLVED.w.y * p.y + SOLVED.b);
    if (m > bm) {
      bm = m;
      bi = i;
    }
  });
  return bi;
})();

// XOR + quadratic kernel, dual solved by projected gradient (verified:
// alphas 0.125 each; corner decisions exactly ±1; boundary the two axes)
export const XOR: Pt[] = [
  { x: -1, y: -1, c: 1 },
  { x: 1, y: 1, c: 1 },
  { x: -1, y: 1, c: -1 },
  { x: 1, y: -1, c: -1 },
];
const k2 = (a: { x: number; y: number }, b: { x: number; y: number }) => (a.x * b.x + a.y * b.y + 1) ** 2;
export const XOR_ALPHA: number[] = (() => {
  const K = XOR.map((a) => XOR.map((b) => k2(a, b)));
  const al = [0.1, 0.1, 0.1, 0.1];
  for (let it = 0; it < 20000; it++) {
    for (let i = 0; i < 4; i++) {
      const gr = 1 - XOR[i].c * al.reduce((s, aj, j) => s + aj * XOR[j].c * K[i][j], 0);
      al[i] = Math.max(0, al[i] + 0.01 * gr);
    }
    const sum = al.reduce((s2, a, i) => s2 + a * XOR[i].c, 0);
    for (let i = 0; i < 4; i++) al[i] = Math.max(0, al[i] - (sum / 4) * XOR[i].c);
  }
  return al;
})();
const XOR_F = (x: number, y: number): number => XOR.reduce((s, p, i) => s + XOR_ALPHA[i] * p.c * k2(p, { x, y }), 0);
export const XOR_B: number = XOR.reduce((s, p) => s + (p.c - XOR_F(p.x, p.y)), 0) / 4;
export const xorDecision = (x: number, y: number): number => XOR_F(x, y) + XOR_B;

// kernel decision field on a grid for the curved-boundary reveal
export const XF_N = 26;
export const XOR_FIELD: number[] = (() => {
  const f: number[] = [];
  for (let r = 0; r < XF_N; r++)
    for (let c = 0; c < XF_N; c++) {
      const x = -1.6 + (3.2 * (c + 0.5)) / XF_N;
      const y = 1.6 - (3.2 * (r + 0.5)) / XF_N;
      f.push(xorDecision(x, y));
    }
  return f;
})();

// stage mapping — main plot (left/center), XOR panel (right)
export const PLOT = { x: 90, y: 80, w: 640, h: 500 };
export const DATAW = { x0: -2.3, x1: 2.3, y0: -1.9, y1: 1.9 };
export const sx = (x: number): number => PLOT.x + ((x - DATAW.x0) / (DATAW.x1 - DATAW.x0)) * PLOT.w;
export const sy = (y: number): number => PLOT.y + PLOT.h - ((y - DATAW.y0) / (DATAW.y1 - DATAW.y0)) * PLOT.h;

export const XPLOT = { x: 810, y: 130, w: 380, h: 380 };
export const xxs = (x: number): number => XPLOT.x + ((x + 1.6) / 3.2) * XPLOT.w;
export const xys = (y: number): number => XPLOT.y + XPLOT.h - ((y + 1.6) / 3.2) * XPLOT.h;

/** a family of feasible-but-narrow separating lines for the opening beat. */
export const CANDIDATES: { w: { x: number; y: number }; b: number }[] = [
  { w: { x: 1.0, y: 3.2 }, b: -0.6 },
  { w: { x: 1.1, y: 2.6 }, b: -0.5 },
  { w: { x: 2.4, y: 1.5 }, b: -0.75 },
];

export const CAM_PLOT: CameraState = { x: 405, y: 330, k: 1.28 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ptsU: ChannelRef<number>;
  candU: ChannelRef<number>; // candidate lines
  streetU: ChannelRef<number>; // street band width grow 0..1
  lineU: ChannelRef<number>; // center line draw
  svU: ChannelRef<number>; // support vector rings
  deleteU: ChannelRef<number>; // far point fades out
  texU: ChannelRef<number>;
  xorU: ChannelRef<number>;
  xorSweep: ChannelRef<number>; // failing line sweeps 0..1
  liftU: ChannelRef<number>; // kernel field reveal
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ptsU = tl.channel('ptsU', 0);
  const candU = tl.channel('candU', 0);
  const streetU = tl.channel('streetU', 0);
  const lineU = tl.channel('lineU', 0);
  const svU = tl.channel('svU', 0);
  const deleteU = tl.channel('deleteU', 0);
  const texU = tl.channel('texU', 0);
  const xorU = tl.channel('xorU', 0);
  const xorSweep = tl.channel('xorSweep', 0);
  const liftU = tl.channel('liftU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · many lines work ——————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.0,
    text: 'Twenty points, two classes, clearly separable. The question sounds trivial: draw the line between them. But look, infinitely many lines get every point right.',
  });
  tl.tween(ptsU, 1, { at: 0.6, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_PLOT, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.tween(candU, 1, { at: 3.0, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 5.9,
    dur: 4.6,
    text: 'Some of those lines pass uncomfortably close to the data. One nudge of noise at test time and they misfire. Which line should you trust?',
  });
  tl.hold(10.7, 0.5);

  // — Beat 2 · the widest street ————————————————————————————————————————————
  tl.caption({
    at: 11.2,
    dur: 5.6,
    text: 'The support vector machine gives a principled answer: pick the line with the widest empty street between the classes. Maximize the margin, the buffer of safety on both sides.',
  });
  tl.tween(candU, 0, { at: 11.8, dur: 0.9, ease: ease.move });
  tl.tween(lineU, 1, { at: 12.4, dur: 1.2, ease: ease.draw });
  tl.tween(streetU, 1, { at: 13.6, dur: 1.8, ease: ease.move });
  tl.caption({
    at: 17.1,
    dur: 5.2,
    text: 'This street is solved exactly on these twenty points, not sketched. Its width comes out to one point two seven, and no wider street exists that keeps every point outside.',
    tex: '\\max \\frac{2}{\\lVert w \\rVert} \\;\\text{ s.t. }\\; y_i(w\\cdot x_i + b) \\ge 1',
  });
  tl.tween(texU, 1, { at: 17.9, dur: 0.7, ease: ease.enter });
  tl.hold(22.5, 0.5);

  // — Beat 3 · support vectors ——————————————————————————————————————————————
  tl.caption({
    at: 23.0,
    dur: 5.4,
    text: 'Now the strange, beautiful part. Only three points touch the curb. They are the support vectors, and they alone determine the street. Every other point could vanish without moving it.',
  });
  tl.tween(svU, 1, { at: 23.8, dur: 1.0, ease: ease.pop });
  tl.caption({
    at: 28.6,
    dur: 4.8,
    text: 'Watch: delete the farthest point entirely. The street does not budge. The model compressed twenty examples into three that matter.',
  });
  tl.tween(deleteU, 1, { at: 30.2, dur: 1.2, ease: ease.move });
  tl.hold(33.6, 0.6);

  // — Beat 4 · a problem no line solves —————————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 34.2, dur: 1.4, ease: ease.move });
  tl.caption({
    at: 34.4,
    dur: 5.2,
    text: 'But some problems have no street at all. The exclusive or pattern: matching corners belong together, opposite corners apart. Sweep every possible line, and every one of them fails.',
  });
  tl.tween(xorU, 1, { at: 35.2, dur: 1.0, ease: ease.enter });
  tl.tween(texU, 0, { at: 35.2, dur: 0.7, ease: ease.move });
  tl.tween(xorSweep, 1, { at: 36.6, dur: 3.0, ease: ease.linear });
  tl.hold(40.1, 0.5);

  // — Beat 5 · the kernel trick —————————————————————————————————————————————
  tl.caption({
    at: 40.6,
    dur: 6.0,
    text: 'The kernel trick fixes this without ever leaving flatland. Replace every dot product with a kernel, here the squared dot product plus one, and the machine implicitly works in a higher dimensional space where a flat street exists.',
    tex: 'k(x, x\') = (x \\cdot x\' + 1)^2',
  });
  tl.caption({
    at: 46.8,
    dur: 5.6,
    text: 'Solve the same maximum margin problem through that kernel, and project the answer back down. The straight street upstairs lands here as curves: the four corners split perfectly, plus one and minus one exactly.',
  });
  tl.tween(liftU, 1, { at: 47.6, dur: 2.0, ease: ease.draw });
  tl.hold(52.6, 0.6);

  // — Beat 6 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 53.2, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 54.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 54.4,
    dur: 6.2,
    text: 'That is the support vector machine: demand the widest street, let a handful of boundary points carry the whole model, and when no street exists, borrow one from a higher dimension through a kernel.',
  });
  tl.hold(60.8, 1.2);

  return { tl, cam, ptsU, candU, streetU, lineU, svU, deleteU, texU, xorU, xorSweep, liftU, dimU, endU };
}
