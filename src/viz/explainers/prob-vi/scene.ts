import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Variational Inference — fit a shape you can handle.
 *
 * The target is a real two-mode posterior (Gaussian mixture, weights
 * 0.65/0.35). A diagonal Gaussian q(μx, μy, σx, σy) is really optimized at
 * module scope: KL(q‖p) is evaluated by quadrature on a 40×40 grid and
 * minimized with 60 steps of finite-difference gradient descent. Computed
 * anchors: the optimization lands on the big mode with KL ≈ 0.42, while a
 * wide q covering both modes scores KL ≈ 1.86 — hedging costs more than
 * four times as much divergence as committing, which is exactly why this
 * approximation is mode-seeking.
 */

export interface Mode {
  x: number;
  y: number;
  s: number;
  w: number;
}
export const MODES: Mode[] = [
  { x: -1.2, y: 0.6, s: 0.55, w: 0.65 },
  { x: 1.4, y: -0.5, s: 0.45, w: 0.35 },
];

export const DENS = (x: number, y: number): number =>
  MODES.reduce(
    (s, m) =>
      s + (m.w * Math.exp(-((x - m.x) ** 2 + (y - m.y) ** 2) / (2 * m.s * m.s))) / (2 * Math.PI * m.s * m.s),
    0,
  );

const G = 40;
const XS: number[] = Array.from({ length: G }, (_, i) => -3 + (6 * i) / (G - 1));
const DX = 6 / (G - 1);

export type Theta = [number, number, number, number]; // μx, μy, σx, σy

export function klOf([mx, my, sx0, sy0]: Theta): number {
  let s = 0;
  for (const x of XS)
    for (const y of XS) {
      const q =
        Math.exp(-((x - mx) ** 2 / (2 * sx0 * sx0) + (y - my) ** 2 / (2 * sy0 * sy0))) /
        (2 * Math.PI * sx0 * sy0);
      if (q < 1e-12) continue;
      s += q * Math.log(q / Math.max(DENS(x, y), 1e-12)) * DX * DX;
    }
  return s;
}

export const N_ITERS = 60;
export const TRAJ: Theta[] = (() => {
  let th: Theta = [0, 1.5, 0.9, 0.9];
  const out: Theta[] = [[...th] as Theta];
  for (let it = 0; it < N_ITERS; it++) {
    const grad = th.map((_, i) => {
      const e = 0.02;
      const a = [...th] as Theta;
      const b = [...th] as Theta;
      a[i] += e;
      b[i] -= e;
      return (klOf(a) - klOf(b)) / (2 * e);
    });
    th = th.map((v, i) => Math.max(i >= 2 ? 0.15 : -3, v - 0.25 * grad[i])) as Theta;
    out.push([...th] as Theta);
  }
  return out;
})();

export const KL_TRAJ: number[] = TRAJ.map(klOf);
export const KL_FINAL: number = KL_TRAJ[N_ITERS]; // ≈ 0.42
export const WIDE_Q: Theta = [0, 0, 1.6, 1.2];
export const KL_WIDE: number = klOf(WIDE_Q); // ≈ 1.86

/** θ at fractional iteration t — pure lerp along the optimization path */
export function thetaAt(t: number): Theta {
  const f = Math.max(0, Math.min(N_ITERS, t));
  const i = Math.floor(f);
  if (i >= N_ITERS) return TRAJ[N_ITERS];
  const u = f - i;
  return TRAJ[i].map((v, k) => v + (TRAJ[i + 1][k] - v) * u) as Theta;
}
export function klAt(t: number): number {
  const f = Math.max(0, Math.min(N_ITERS, t));
  const i = Math.floor(f);
  if (i >= N_ITERS) return KL_TRAJ[N_ITERS];
  return KL_TRAJ[i] + (KL_TRAJ[i + 1] - KL_TRAJ[i]) * (f - i);
}

export const px: ScaleLinear<number, number> = scaleLinear().domain([-3, 3]).range([120, 800]);
export const py: ScaleLinear<number, number> = scaleLinear().domain([-2.6, 2.8]).range([620, 105]);
export const kx: ScaleLinear<number, number> = scaleLinear().domain([0, N_ITERS]).range([880, 1200]);
export const ky: ScaleLinear<number, number> = scaleLinear().domain([0, 2.6]).range([540, 240]);

export const CAM_PLANE: CameraState = { x: 460, y: 360, k: 1.15 };
export const CAM_SMALL: CameraState = { x: px(MODES[1].x), y: py(MODES[1].y), k: 1.4 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  fieldU: ChannelRef<number>;
  qU: ChannelRef<number>;
  iterT: ChannelRef<number>;
  curveU: ChannelRef<number>;
  wideU: ChannelRef<number>;
  missU: ChannelRef<number>;
  elboU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const fieldU = tl.channel('fieldU', 0);
  const qU = tl.channel('qU', 0);
  const iterT = tl.channel('iterT', 0);
  const curveU = tl.channel('curveU', 0);
  const wideU = tl.channel('wideU', 0);
  const missU = tl.channel('missU', 0);
  const elboU = tl.channel('elboU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the trade —————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'Sampling is honest but slow. Variational inference makes the opposite trade: replace the awkward posterior with a shape you can actually handle.',
  });
  tl.tween(fieldU, 1, { at: 0.6, dur: 2.6, ease: ease.draw });
  tl.tween(cam, CAM_PLANE, { at: 0.9, dur: 2.0, ease: ease.move });

  tl.caption({
    at: 6.7,
    dur: 5.4,
    text: 'Here is the true posterior: two islands of probability, the left one holding about two thirds of the mass. And here is our candidate: one ellipse — a plain Gaussian.',
  });
  tl.tween(qU, 1, { at: 9.1, dur: 1.2, ease: ease.enter });

  // — Beat 2 · the objective ————————————————————————————————————————————
  tl.caption({
    at: 12.5,
    dur: 6.2,
    text: 'Turn inference into optimization: measure the divergence between the ellipse and the truth, and descend it. Maximizing the evidence lower bound is the same move.',
    tex: '\\mathrm{KL}(q \\,\\|\\, p) \\downarrow \\;\\equiv\\; \\mathrm{ELBO} \\uparrow',
  });
  // Pull back to the full stage: the ELBO/KL chart (x 880–1200) is revealed
  // here — CAM_PLANE (x 460, k 1.15) clips it past the right edge by ~210px.
  tl.tween(cam, CAMERA_HOME, { at: 12.9, dur: 1.8, ease: ease.move });
  tl.tween(elboU, 1, { at: 13.1, dur: 0.9, ease: ease.enter });
  tl.tween(curveU, 1, { at: 14.3, dur: 1.6, ease: ease.draw });

  tl.caption({
    at: 19.1,
    dur: 6.0,
    text: 'Sixty real gradient steps, computed on this very landscape. Watch the ellipse slide, shrink, and lock onto the bigger island. The divergence falls with it.',
  });
  tl.tween(iterT, 60, { at: 19.5, dur: 7.0, ease: ease.move });

  tl.caption({
    at: 25.7,
    dur: 5.2,
    text: 'It converges in a blink — that is the whole appeal. No chains, no burn in: just a loss curve you can watch like any other training run.',
  });
  tl.hold(30.9, 0.6);

  // — Beat 3 · the confession ———————————————————————————————————————————
  tl.caption({
    at: 31.5,
    dur: 5.8,
    text: 'Now the confession. Look at the smaller island: a third of the true probability lives there, and our answer assigns it essentially nothing.',
  });
  tl.tween(cam, CAM_SMALL, { at: 31.9, dur: 1.8, ease: ease.move });
  tl.tween(missU, 1, { at: 32.7, dur: 0.9, ease: ease.enter });

  tl.caption({
    at: 37.7,
    dur: 6.4,
    text: 'Why not stretch the ellipse to cover both? We measured that too: hedging across the islands scores a divergence of one point eight six, versus zero point four two for committing.',
  });
  // Return to HOME (not CAM_PLANE): the hedging/committing scores and the KL
  // chart on the right must stay in frame through the verdict beats.
  tl.tween(cam, CAMERA_HOME, { at: 38.1, dur: 1.8, ease: ease.move });
  tl.tween(wideU, 1, { at: 39.3, dur: 1.2, ease: ease.enter });

  tl.caption({
    at: 44.5,
    dur: 6.0,
    text: 'This direction of divergence punishes q for putting mass where p has none — so the cheapest move is to pick one mode and be confidently narrow. Mode seeking is baked in.',
  });
  tl.tween(wideU, 0, { at: 49.3, dur: 0.8, ease: ease.move });
  tl.tween(missU, 0, { at: 49.3, dur: 0.8, ease: ease.move });

  // — Beat 4 · the verdict ——————————————————————————————————————————————
  tl.caption({
    at: 51.1,
    dur: 5.8,
    text: 'So the trade is explicit: variational inference buys speed and scale, and pays in missed modes and overconfidence. Know the bill before you sign.',
  });

  tl.caption({
    at: 57.3,
    dur: 5.2,
    text: 'Sampling wanders toward truth slowly; optimization sprints toward an approximation. Serious systems often use one to check the other.',
  });
  tl.tween(closeU, 1, { at: 57.7, dur: 0.9, ease: ease.enter });
  tl.hold(62.5, 1.4);

  return { tl, cam, fieldU, qU, iterT, curveU, wideU, missU, elboU, closeU };
}
