/**
 * Rosenblatt's perceptron (Mark I organisation), computed for real at module scope.
 *
 *   S-units: a 20x20 photocell retina (binary pixels)
 *   A-units: N_A association units, each wired at random to a few retina cells
 *            (+1 excitatory / -1 inhibitory), firing when the sum reaches its threshold
 *   R-unit:  one response unit: fires (+1) if sum_a w_a·a + w_0 > 0, else -1
 *   rule:    on a mistake, w <- w + eta·target·a  (only the A-units that fired move)
 *
 * The task: tell HORIZONTAL bars (target +1) from VERTICAL bars (target -1) of
 * random length, jittered around the centre of the retina. Verified offline
 * (wiring seed 101, presentation seed 1958, eta 1): held-out accuracy on 400 fresh
 * images is ~0.67 after 10 presentations, ~0.95 after 40 and ~0.99 after 120.
 * (A square-vs-circle task at random positions does NOT train with these local
 * A-units: it stays near chance, the translation problem Minsky & Papert stressed.)
 * Exports the full training record so a painter can scrub it with a `step` param.
 */
import { mulberry32 } from '../../../core';

export const RETINA = 20;
export const N_A = 64;
export const FAN_IN = 10;

export type Shape = 'square' | 'circle' | 'hbar' | 'vbar';
/** The discrimination taught: HORIZONTAL bars (+1) vs VERTICAL bars (-1), jittered ±JITTER cells. */
export const TASK: [Shape, Shape] = ['hbar', 'vbar'];
export const TASK_NAMES: Record<Shape, string> = { hbar: 'horizontal', vbar: 'vertical', square: 'square', circle: 'circle' };
export const JITTER = 2.5;
export interface RetinaImage {
  shape: Shape;
  target: 1 | -1;
  px: Uint8Array; // RETINA*RETINA
}
export interface AUnit {
  cells: number[];
  sign: number[];
  theta: number;
}
export interface PerceptronStep {
  img: RetinaImage;
  a: Uint8Array; // A-unit outputs for this image
  sum: number; // R-unit input sum with the weights BEFORE the update
  out: 1 | -1;
  error: boolean;
  wBefore: Float32Array; // N_A + 1 (index N_A = bias)
  wAfter: Float32Array;
  /** mistakes in the last 20 presentations, after this one */
  recentErrors: number;
}

function drawShape(shape: Shape, cx: number, cy: number, s: number): Uint8Array {
  const px = new Uint8Array(RETINA * RETINA);
  for (let y = 0; y < RETINA; y++)
    for (let x = 0; x < RETINA; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const on =
        shape === 'square'
          ? Math.abs(dx) <= s && Math.abs(dy) <= s
          : shape === 'circle'
            ? dx * dx + dy * dy <= s * 1.18 * (s * 1.18)
            : shape === 'hbar'
              ? Math.abs(dx) <= s * 1.6 && Math.abs(dy) <= 1.1
              : Math.abs(dy) <= s * 1.6 && Math.abs(dx) <= 1.1;
      px[y * RETINA + x] = on ? 1 : 0;
    }
  return px;
}

export function makeImage(rand: () => number, shape?: Shape): RetinaImage {
  const sh: Shape = shape ?? (rand() < 0.5 ? TASK[0] : TASK[1]);
  const s = 3 + rand() * 2.5;
  const bar = sh === 'hbar' || sh === 'vbar';
  const mx = (sh === 'hbar' ? s * 1.6 : bar ? 1.1 : s) + 1;
  const my = (sh === 'vbar' ? s * 1.6 : bar ? 1.1 : s) + 1;
  const cx = Math.max(mx, Math.min(RETINA - mx, RETINA / 2 + (rand() - 0.5) * 2 * JITTER));
  const cy = Math.max(my, Math.min(RETINA - my, RETINA / 2 + (rand() - 0.5) * 2 * JITTER));
  return { shape: sh, target: sh === TASK[0] ? 1 : -1, px: drawShape(sh, cx, cy, s) };
}

/** A-unit wiring: random retina points, mostly clustered near a random centre (Mark I plugboard). */
export function makeAUnits(seed: number): AUnit[] {
  const rand = mulberry32(seed);
  return Array.from({ length: N_A }, () => {
    const cx = rand() * RETINA;
    const cy = rand() * RETINA;
    const cells: number[] = [];
    const sign: number[] = [];
    for (let k = 0; k < FAN_IN; k++) {
      const x = Math.max(0, Math.min(RETINA - 1, Math.floor(cx + (rand() - 0.5) * 9)));
      const y = Math.max(0, Math.min(RETINA - 1, Math.floor(cy + (rand() - 0.5) * 9)));
      cells.push(y * RETINA + x);
      sign.push(k % 2 === 0 ? 1 : -1);
    }
    return { cells, sign, theta: 1 };
  });
}

export function aOutputs(units: AUnit[], px: Uint8Array): Uint8Array {
  const out = new Uint8Array(units.length);
  units.forEach((u, i) => {
    let s = 0;
    for (let k = 0; k < u.cells.length; k++) s += u.sign[k] * px[u.cells[k]];
    out[i] = s >= u.theta ? 1 : 0;
  });
  return out;
}

export function trainPerceptron(o: { seed: number; steps: number; eta?: number; wiringSeed?: number }) {
  const units = makeAUnits(o.wiringSeed ?? 101);
  const rand = mulberry32(o.seed);
  const eta = o.eta ?? 1;
  let w = new Float32Array(N_A + 1);
  const steps: PerceptronStep[] = [];
  const recent: boolean[] = [];
  for (let k = 0; k < o.steps; k++) {
    // alternate classes so the sequence reads clearly, positions random
    const img = makeImage(rand, k % 2 === 0 ? TASK[0] : TASK[1]);
    const a = aOutputs(units, img.px);
    let sum = w[N_A];
    for (let i = 0; i < N_A; i++) sum += w[i] * a[i];
    const out: 1 | -1 = sum > 0 ? 1 : -1;
    const error = out !== img.target;
    const next = new Float32Array(w);
    if (error) {
      for (let i = 0; i < N_A; i++) next[i] += eta * img.target * a[i];
      next[N_A] += eta * img.target;
    }
    recent.push(error);
    if (recent.length > 20) recent.shift();
    steps.push({ img, a, sum, out, error, wBefore: w, wAfter: next, recentErrors: recent.filter(Boolean).length });
    w = next;
  }
  return { units, steps, eta };
}

/** Accuracy of a weight vector on fresh images (for verification). */
export function testAccuracy(units: AUnit[], w: Float32Array, n: number, seed: number): number {
  const rand = mulberry32(seed);
  let ok = 0;
  for (let k = 0; k < n; k++) {
    const img = makeImage(rand);
    const a = aOutputs(units, img.px);
    let s = w[N_A];
    for (let i = 0; i < N_A; i++) s += w[i] * a[i];
    if ((s > 0 ? 1 : -1) === img.target) ok++;
  }
  return ok / n;
}

/** The default training record shown by perceptronRetina (seeded). */
export const PERCEPTRON_RUN = trainPerceptron({ seed: 1958, steps: 120 });
/** Held-out accuracy (400 fresh images) after n presentations, for on-screen numbers. */
export function perceptronAccuracy(n: number): number {
  const k = Math.max(0, Math.min(PERCEPTRON_RUN.steps.length, Math.round(n)));
  const w = k === 0 ? new Float32Array(N_A + 1) : PERCEPTRON_RUN.steps[k - 1].wAfter;
  return testAccuracy(PERCEPTRON_RUN.units, w, 400, 5);
}

/** The limit (claim limit-linear): the same rule on XOR with a single threshold unit, which never settles
 * (xorRule.ts; unit-tested in xorRule.test.mjs). Used by perceptron-short ch01-s03's XOR plate. */
export { trainXor, XOR_CASES } from './xorRule';
export type { XorStep } from './xorRule';
