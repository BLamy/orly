// Shared math for chapters 4–5: the fiber cubic of the announced map.
//
// In coordinates s = 1/x, t = xy (x ≠ 0), the fiber of F over a target
// (a, b, c) reduces (resultant in t, verified symbolically for this book) to
//
//     2c·s³ + (3bc − 4)·s² + Δ(a,b,c) = 0,
//     Δ = b² − 16a + 18abc − 27a²c² − b³c.
//
// Note the missing s¹ term: when Δ = 0 (and c ≠ 0), s = 0 is a DOUBLE root —
// two preimages sit at x = ∞ and only one finite preimage survives.
// Roots are tracked along precomputed target paths with Durand–Kerner
// iteration seeded by the previous sample (deterministic, no Math.random).

export type Cx = [number, number]; // [re, im]

const cadd = (p: Cx, q: Cx): Cx => [p[0] + q[0], p[1] + q[1]];
const csub = (p: Cx, q: Cx): Cx => [p[0] - q[0], p[1] - q[1]];
const cmul = (p: Cx, q: Cx): Cx => [p[0] * q[0] - p[1] * q[1], p[0] * q[1] + p[1] * q[0]];
const cdiv = (p: Cx, q: Cx): Cx => {
  const d = q[0] * q[0] + q[1] * q[1] || 1e-12;
  return [(p[0] * q[0] + p[1] * q[1]) / d, (p[1] * q[0] - p[0] * q[1]) / d];
};

export const delta = (a: number, b: number, c: number): number =>
  b * b - 16 * a + 18 * a * b * c - 27 * a * a * c * c - b * b * b * c;

/** Monic cubic s³ + B·s² + 0·s + D evaluated at s. */
const evalCubic = (B: number, D: number, s: Cx): Cx => {
  const s2 = cmul(s, s);
  const s3 = cmul(s2, s);
  return cadd(cadd(s3, [B * s2[0], B * s2[1]]), [D, 0]);
};

/** One Durand–Kerner sweep for the 3 roots of s³ + B·s² + D. */
function dkStep(B: number, D: number, r: Cx[]): Cx[] {
  return r.map((ri, i) => {
    let denom: Cx = [1, 0];
    for (let j = 0; j < 3; j++) if (j !== i) denom = cmul(denom, csub(ri, r[j]));
    return csub(ri, cdiv(evalCubic(B, D, ri), denom));
  });
}

/**
 * Track the 3 roots of 2c·s³ + (3bc−4)·s² + Δ along a target path.
 * `path(τ)` gives (a,b,c) for τ ∈ [0,1]; returns `n` samples of 3 roots,
 * continuation-seeded so each root's index is continuous along the path.
 */
export function trackRoots(path: (tau: number) => [number, number, number], n: number): Cx[][] {
  const out: Cx[][] = [];
  let guess: Cx[] = [
    [0.4, 0.9],
    [-0.65, 0.72],
    [0.98, -0.31],
  ];
  for (let k = 0; k < n; k++) {
    const [a, b, c] = path(k / (n - 1));
    const B = (3 * b * c - 4) / (2 * c);
    const D = delta(a, b, c) / (2 * c);
    let r = guess;
    const iters = k === 0 ? 80 : 30;
    for (let it = 0; it < iters; it++) r = dkStep(B, D, r);
    out.push(r);
    guess = r.map((ri) => [ri[0] + 1e-6, ri[1] + 2e-6] as Cx); // nudge off exact collisions
  }
  return out;
}

/** Linear interpolation between adjacent samples of a tracked root path. */
export function rootsAt(samples: Cx[][], tau: number): Cx[] {
  const f = Math.min(Math.max(tau, 0), 1) * (samples.length - 1);
  const k = Math.min(Math.floor(f), samples.length - 2);
  const u = f - k;
  return samples[k].map((r, i) => [r[0] + (samples[k + 1][i][0] - r[0]) * u, r[1] + (samples[k + 1][i][1] - r[1]) * u] as Cx);
}
