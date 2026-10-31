/**
 * perceptron-short — ch01-s03: the training record the "machine's mind" shows, started from small
 * seeded RANDOM weights instead of all-zero dials.
 *
 * Same machine and rule as the kit's trainPerceptron (perceptronMath: 20 × 20 retina, 64 A-units on
 * wiring seed 101, horizontal (+1) vs vertical (−1) bars, w ← w + η·target·a on mistakes only, η = 1),
 * but every dial (and the bias) starts at a seeded value in [−W_MAX, W_MAX], rounded to tenths so the
 * dials read cleanly. With all-zero dials the first guess has nothing to tug the needle; with small
 * random settings each lit cell's dial visibly pulls it, which is what the narration describes. The
 * on-screen caption already calls this "an illustration of the rule", and random initial weights are
 * how such a machine starts.
 *
 *   trainFromRandom({ seed, wSeed, steps, eta?, wiringSeed?, wMax? })  -> { units, steps, eta }
 *       (the same shape as trainPerceptron, so the mind machine scrubs it unchanged)
 */
import { mulberry32 } from '../../../core';
import { N_A, TASK, aOutputs, makeAUnits, makeImage } from '../../../film/silhouette/metaphors/perceptronMath';
import type { PerceptronStep } from '../../../film/silhouette/metaphors/perceptronMath';

export const W_MAX = 0.6;

export function trainFromRandom(o: { seed: number; wSeed: number; steps: number; eta?: number; wiringSeed?: number; wMax?: number }) {
  const units = makeAUnits(o.wiringSeed ?? 101);
  const rand = mulberry32(o.seed);
  const wr = mulberry32(o.wSeed);
  const eta = o.eta ?? 1;
  const wMax = o.wMax ?? W_MAX;
  let w = new Float32Array(N_A + 1);
  for (let i = 0; i <= N_A; i++) w[i] = Math.round((wr() * 2 - 1) * wMax * 10) / 10;
  const steps: PerceptronStep[] = [];
  const recent: boolean[] = [];
  for (let k = 0; k < o.steps; k++) {
    // alternate classes so the sequence reads clearly, positions random (as the kit's trainer)
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
