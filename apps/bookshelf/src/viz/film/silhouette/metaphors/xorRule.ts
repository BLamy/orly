/**
 * Rosenblatt's rule on XOR, for real (claim limit-linear). A single threshold unit on two inputs
 * (two weights and a bias, w = 0 at the start) is shown the four XOR cases in a fixed order, 00, 10, 01, 11
 * ("YES when exactly one cell is lit"), and corrected on every mistake: w ← w + η·target·x (bias input 1).
 * No line separates {10, 01} from {00, 11}, so the unit can never answer all four cases at once: the rule
 * never settles, however long it runs. trainXor() returns the full record so a painter can scrub it; the
 * unit test (xorRule.test.mjs) asserts score < 4 after every try of a long run.
 *
 * Dependency-free on purpose, so `node --test` can import it directly.
 */
export interface XorStep {
  x: [number, number];
  target: 1 | -1;
  sum: number;
  out: 1 | -1;
  error: boolean;
  wBefore: [number, number, number];
  wAfter: [number, number, number];
  /** how many of the four cases the unit answers correctly AFTER this try */
  score: number;
}

export const XOR_CASES: [number, number, 1 | -1][] = [
  [0, 0, -1],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, -1],
];
const answer = (w: number[], a: number, b: number): 1 | -1 => (w[0] * a + w[1] * b + w[2] > 0 ? 1 : -1);

export function trainXor(steps: number, eta = 1): { steps: XorStep[] } {
  let w: [number, number, number] = [0, 0, 0];
  const out: XorStep[] = [];
  for (let k = 0; k < steps; k++) {
    const [a, b, target] = XOR_CASES[k % 4];
    const sum = w[0] * a + w[1] * b + w[2];
    const o: 1 | -1 = sum > 0 ? 1 : -1;
    const error = o !== target;
    const next: [number, number, number] = error ? [w[0] + eta * target * a, w[1] + eta * target * b, w[2] + eta * target] : [w[0], w[1], w[2]];
    const score = XOR_CASES.filter(([p, q, t]) => answer(next, p, q) === t).length;
    out.push({ x: [a, b], target, sum, out: o, error, wBefore: w, wAfter: next, score });
    w = next;
  }
  return { steps: out };
}
