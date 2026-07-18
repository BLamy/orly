import { CAMERA_HOME, Timeline, cameraInterp, ease, gaussian, mulberry32 } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Clustering — structure without labels.
 *
 * All math at module scope and verified by running it. A REAL k-means run on
 * 120 seeded points (three gaussians), started from a deliberately bad corner
 * init: converges in 5 recorded iterations, inertia 707 → 77 → 38 → 35 → 35.
 * Then the honest failure: a broad cluster (70 pts, spread 0.62) beside a
 * tight one (30 pts, spread 0.16). K-means' halfway boundary steals 9 points
 * from the broad cluster; a Gaussian mixture fit by expectation maximization
 * on the same data learns spreads 0.64 vs 0.16 and weights 0.7 vs 0.3, and
 * gets all 100 right.
 */

const rand = mulberry32(77);
const g = gaussian(rand);

export interface Pt {
  x: number;
  y: number;
}
export const PTS: Pt[] = (() => {
  const centers = [
    { x: -1.1, y: 0.7 },
    { x: 1.0, y: 0.9 },
    { x: 0.1, y: -0.9 },
  ];
  const pts: Pt[] = [];
  centers.forEach((c) => {
    for (let j = 0; j < 40; j++) pts.push({ x: c.x + g() * 0.38, y: c.y + g() * 0.38 });
  });
  return pts;
})();

export interface KmSnap {
  cents: { x: number; y: number }[];
  asg: number[];
  inertia: number;
}
export const KM: KmSnap[] = (() => {
  let cents = [
    { x: -1.6, y: -1.2 },
    { x: -1.4, y: -1.35 },
    { x: -1.2, y: -1.5 },
  ];
  const snaps: KmSnap[] = [];
  for (let it = 0; it < 20; it++) {
    const asg = PTS.map((p) => {
      let bi = 0;
      let bd = Infinity;
      cents.forEach((c, i) => {
        const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
        if (d < bd) {
          bd = d;
          bi = i;
        }
      });
      return bi;
    });
    const inertia = PTS.reduce((s, p, i) => s + (p.x - cents[asg[i]].x) ** 2 + (p.y - cents[asg[i]].y) ** 2, 0);
    snaps.push({ cents: cents.map((c) => ({ ...c })), asg, inertia });
    const nc = cents.map((c, i) => {
      const m = PTS.filter((_, j) => asg[j] === i);
      return m.length ? { x: m.reduce((s, p) => s + p.x, 0) / m.length, y: m.reduce((s, p) => s + p.y, 0) / m.length } : c;
    });
    const moved = Math.max(...cents.map((c, i) => Math.hypot(c.x - nc[i].x, c.y - nc[i].y)));
    cents = nc;
    if (moved < 1e-4) break;
  }
  return snaps;
})();
export const KM_ITERS = KM.length; // 5

/** centroid k position at fractional iteration f. */
export function kmCentAt(f: number, k: number): { x: number; y: number } {
  const m = Math.max(0, Math.min(KM.length - 1, f));
  const i = Math.min(KM.length - 2, Math.floor(m));
  const t = Math.min(1, m - i);
  const A = KM[i].cents[k];
  const B = KM[Math.min(KM.length - 1, i + 1)].cents[k];
  return { x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t };
}
export function kmAsgAt(f: number, j: number): number {
  const i = Math.round(Math.max(0, Math.min(KM.length - 1, f)));
  return KM[i].asg[j];
}
export function kmInertiaAt(f: number): number {
  const m = Math.max(0, Math.min(KM.length - 1, f));
  const i = Math.min(KM.length - 2, Math.floor(m));
  const t = Math.min(1, m - i);
  return KM[i].inertia + (KM[Math.min(KM.length - 1, i + 1)].inertia - KM[i].inertia) * t;
}

// ---------------------------------------------------------------------------
// The failure dataset + GMM (verified)
// ---------------------------------------------------------------------------

const r2 = mulberry32(88);
const g2 = gaussian(r2);
export interface FPt extends Pt {
  true: 0 | 1;
}
export const FAIL: FPt[] = (() => {
  const el: FPt[] = [];
  for (let i = 0; i < 70; i++) el.push({ x: -0.7 + g2() * 0.62, y: g2() * 0.62, true: 0 });
  for (let i = 0; i < 30; i++) el.push({ x: 1.15 + g2() * 0.16, y: g2() * 0.16, true: 1 });
  return el;
})();

export const FKM: { cents: { x: number; y: number }[]; stolen: number[] } = (() => {
  let c2 = [
    { x: -0.7, y: 0 },
    { x: 1.15, y: 0 },
  ];
  for (let it = 0; it < 40; it++) {
    const asg = FAIL.map((p) =>
      (p.x - c2[0].x) ** 2 + (p.y - c2[0].y) ** 2 < (p.x - c2[1].x) ** 2 + (p.y - c2[1].y) ** 2 ? 0 : 1,
    );
    const nc = [0, 1].map((i) => {
      const m = FAIL.filter((_, j) => asg[j] === i);
      return { x: m.reduce((s, p) => s + p.x, 0) / m.length, y: m.reduce((s, p) => s + p.y, 0) / m.length };
    });
    if (Math.max(...c2.map((c, i) => Math.hypot(c.x - nc[i].x, c.y - nc[i].y))) < 1e-6) {
      c2 = nc;
      break;
    }
    c2 = nc;
  }
  const asgF = FAIL.map((p) =>
    (p.x - c2[0].x) ** 2 + (p.y - c2[0].y) ** 2 < (p.x - c2[1].x) ** 2 + (p.y - c2[1].y) ** 2 ? 0 : 1,
  );
  const stolen = FAIL.map((p, i) => i).filter((i) => asgF[i] !== FAIL[i].true);
  return { cents: c2, stolen };
})();
export const N_STOLEN = FKM.stolen.length; // 9
export const FKM_BOUNDARY_X = (FKM.cents[0].x + FKM.cents[1].x) / 2; // ≈ 0.05

export interface Gm {
  mx: number;
  my: number;
  s: number;
  pi: number;
}
export const GMM_SNAPS: Gm[][] = (() => {
  let gm: Gm[] = [
    { mx: -0.7, my: 0, s: 0.5, pi: 0.5 },
    { mx: 1.15, my: 0, s: 0.5, pi: 0.5 },
  ];
  const snaps: Gm[][] = [gm.map((c) => ({ ...c }))];
  for (let it = 0; it < 60; it++) {
    const R = FAIL.map((p) => {
      const like = gm.map((c) => (c.pi / (c.s * c.s)) * Math.exp(-((p.x - c.mx) ** 2 + (p.y - c.my) ** 2) / (2 * c.s * c.s)));
      const sum = like[0] + like[1];
      return [like[0] / sum, like[1] / sum];
    });
    gm = gm.map((c, k) => {
      const Nk = R.reduce((s, r) => s + r[k], 0);
      const mx = R.reduce((s, r, i) => s + r[k] * FAIL[i].x, 0) / Nk;
      const my = R.reduce((s, r, i) => s + r[k] * FAIL[i].y, 0) / Nk;
      const s2 = R.reduce((s, r, i) => s + r[k] * ((FAIL[i].x - mx) ** 2 + (FAIL[i].y - my) ** 2), 0) / (2 * Nk);
      return { mx, my, s: Math.sqrt(s2) + 1e-4, pi: Nk / FAIL.length };
    });
    if (it < 8 || it % 10 === 9) snaps.push(gm.map((c) => ({ ...c })));
  }
  snaps.push(gm.map((c) => ({ ...c })));
  return snaps;
})();
export const GMM_FINAL: Gm[] = GMM_SNAPS[GMM_SNAPS.length - 1];
/** responsibility of component 0 for failure-point j under the FINAL fit. */
export const RESP0: number[] = FAIL.map((p) => {
  const like = GMM_FINAL.map(
    (c) => (c.pi / (c.s * c.s)) * Math.exp(-((p.x - c.mx) ** 2 + (p.y - c.my) ** 2) / (2 * c.s * c.s)),
  );
  return like[0] / (like[0] + like[1]);
});
export function gmAt(f: number): Gm[] {
  const m = Math.max(0, Math.min(GMM_SNAPS.length - 1, f));
  const i = Math.min(GMM_SNAPS.length - 2, Math.floor(m));
  const t = Math.min(1, m - i);
  return GMM_SNAPS[i].map((c, k) => {
    const B = GMM_SNAPS[i + 1][k];
    return { mx: c.mx + (B.mx - c.mx) * t, my: c.my + (B.my - c.my) * t, s: c.s + (B.s - c.s) * t, pi: c.pi + (B.pi - c.pi) * t };
  });
}
export const GMM_STEPS = GMM_SNAPS.length - 1;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export const PLOT = { x: 110, y: 70, w: 620, h: 510 };
export const sx = (x: number): number => PLOT.x + ((x + 2.3) / 4.6) * PLOT.w;
export const sy = (y: number): number => PLOT.y + PLOT.h - ((y + 2.1) / 4.2) * PLOT.h;

export const METER = { x: 820, y: 160, w: 340, h: 26 };
export const CLUSTER_COLORS_HINT = 'ACCENT / SECONDARY / WARM';

export const CAM_PLOT: CameraState = { x: 400, y: 320, k: 1.25 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ptsU: ChannelRef<number>;
  centsU: ChannelRef<number>;
  iterF: ChannelRef<number>; // 0..KM_ITERS-1 fractional k-means iteration
  colorU: ChannelRef<number>; // assignment coloring strength
  meterU: ChannelRef<number>;
  failU: ChannelRef<number>; // failure dataset master
  fkmU: ChannelRef<number>; // k-means boundary + stolen highlight
  gmmF: ChannelRef<number>; // 0..GMM_STEPS fractional EM progress
  gmmU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ptsU = tl.channel('ptsU', 0);
  const centsU = tl.channel('centsU', 0);
  const iterF = tl.channel('iterF', 0);
  const colorU = tl.channel('colorU', 0);
  const meterU = tl.channel('meterU', 0);
  const failU = tl.channel('failU', 0);
  const fkmU = tl.channel('fkmU', 0);
  const gmmF = tl.channel('gmmF', 0);
  const gmmU = tl.channel('gmmU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · no labels at all —————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.2,
    text: 'Every model so far was handed labels. Now take them away. One hundred twenty points, no colors, no answers, and one suspicion: there is structure hiding in here.',
  });
  tl.tween(ptsU, 1, { at: 0.6, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_PLOT, { at: 1.0, dur: 1.5, ease: ease.move });
  tl.hold(5.9, 0.5);

  // — Beat 2 · the k-means loop —————————————————————————————————————————————
  tl.caption({
    at: 6.4,
    dur: 5.6,
    text: 'K-means is the classic two step dance. Drop three centers anywhere, even somewhere terrible like this corner. Then repeat: assign every point to its nearest center, and move each center to the middle of its points.',
  });
  tl.tween(centsU, 1, { at: 7.2, dur: 0.7, ease: ease.pop });
  tl.tween(colorU, 1, { at: 9.6, dur: 1.0, ease: ease.move });
  tl.caption({
    at: 12.4,
    dur: 5.2,
    text: 'Watch the real run. First iteration: everything belongs to the corner, so the centers lurch toward the crowd. Total squared distance plummets from seven hundred to seventy seven.',
  });
  tl.tween(meterU, 1, { at: 12.8, dur: 0.8, ease: ease.enter });
  tl.tween(iterF, 1, { at: 13.4, dur: 2.6, ease: ease.move });
  tl.caption({
    at: 18.0,
    dur: 5.4,
    text: 'Assign, average, assign, average. By the fifth pass nothing moves anymore: thirty five is the floor. Each step provably lowers this number, which is why k-means always settles somewhere.',
  });
  tl.tween(iterF, KM_ITERS - 1, { at: 18.6, dur: 4.0, ease: ease.move });
  tl.hold(23.6, 0.6);

  // — Beat 3 · it found the structure ——————————————————————————————————————
  tl.caption({
    at: 24.2,
    dur: 4.6,
    text: 'Three clean clusters, recovered from a hostile start with no labels anywhere in sight. When the data really is round blobs of similar size, k-means is close to unbeatable.',
  });
  tl.hold(29.0, 0.6);

  // — Beat 4 · the honest failure ———————————————————————————————————————————
  tl.tween(colorU, 0, { at: 29.6, dur: 0.9, ease: ease.move });
  tl.tween(centsU, 0, { at: 29.6, dur: 0.9, ease: ease.move });
  tl.tween(meterU, 0, { at: 29.6, dur: 0.9, ease: ease.move });
  tl.tween(ptsU, 0, { at: 29.6, dur: 0.9, ease: ease.move });
  tl.tween(failU, 1, { at: 30.7, dur: 1.2, ease: ease.draw });
  tl.caption({
    at: 30.9,
    dur: 5.4,
    text: 'But its one rule, nearest center wins, hides an assumption: clusters are the same size and shape. Here is a broad scattered cloud next to a small tight one. Run k-means to convergence.',
  });
  tl.tween(fkmU, 1, { at: 36.0, dur: 1.2, ease: ease.move });
  tl.caption({
    at: 36.5,
    dur: 5.6,
    text: 'The boundary lands halfway between the centers, and the tight cluster steals nine points from the broad one. K-means cannot say a cluster is wide; distance is its only language.',
  });
  tl.hold(42.3, 0.5);

  // — Beat 5 · soften it with a mixture ————————————————————————————————————
  tl.caption({
    at: 42.8,
    dur: 5.8,
    text: 'The fix is to let each cluster be a gaussian with its own spread and its own share of the data, and to make membership a probability instead of a verdict. Fitting this is the expectation maximization dance from the generative modeling book.',
  });
  tl.tween(fkmU, 0.15, { at: 43.2, dur: 0.9, ease: ease.move });
  tl.tween(gmmU, 1, { at: 44.4, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 48.8,
    dur: 5.6,
    text: 'Same two steps, but soft. Watch the circles learn: one grows to spread sixty four hundredths, the other shrinks to sixteen, and the weights settle at seventy thirty. The boundary slides off the small cluster.',
  });
  tl.tween(gmmF, GMM_STEPS, { at: 49.2, dur: 4.6, ease: ease.move });
  tl.caption({
    at: 54.8,
    dur: 4.6,
    text: 'Every point k-means stole now sits on the correct side: one hundred out of one hundred. K-means is just this model with the spreads forced equal and the probabilities rounded.',
  });
  tl.hold(59.6, 0.6);

  // — Beat 6 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.13, { at: 60.2, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 61.4, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 61.4,
    dur: 6.2,
    text: 'And that closes the tour: memory in nearest neighbors, questions in trees, committees in ensembles, margins in support vector machines, and structure without labels here. Five small machines, and most of applied learning is one of them in disguise.',
  });
  tl.hold(67.8, 1.2);

  return { tl, cam, ptsU, centsU, iterF, colorU, meterU, failU, fkmU, gmmF, gmmU, dimU, endU };
}
