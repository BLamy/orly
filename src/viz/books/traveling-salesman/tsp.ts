// Shared, deterministic TSP kernel for the traveling-salesman book.
//
// Everything here is a PURE function of a seed — no Math.random(), no Date.now().
// The algorithms mirror python-tsp (fillipe-gsm/python-tsp): a fixed start city
// 0 and (n-1)! permutations (exact/brute_force.py), reversal-based 2-opt
// neighbours (heuristics/perturbation_schemes.py: two_opt_gen), first-improvement
// local search (heuristics/local_search.py) and the Metropolis acceptance rule
// with a cooling temperature (heuristics/simulated_annealing.py). Scenes import
// these so every tour and length on screen is really computed on real coordinates.

export interface Pt {
  x: number;
  y: number;
}

/** mulberry32 — tiny deterministic PRNG (seeded). */
export function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** n cities in the logical box x∈[6,94], y∈[10,90] (matches the seeded layout). */
export function makeCities(seed: number, n: number): Pt[] {
  const r = mulberry32(seed);
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) pts.push({ x: 6 + r() * 88, y: 10 + r() * 80 });
  return pts;
}

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** (i, j) entry = distance from city i to city j — the distance_matrix input. */
export function distanceMatrix(pts: Pt[]): number[][] {
  return pts.map((a) => pts.map((b) => dist(a, b)));
}

/** Total closed-tour length of a permutation (compute_permutation_distance). */
export function tourLength(order: number[], D: number[][]): number {
  let s = 0;
  for (let i = 0; i < order.length; i++) s += D[order[i]][order[(i + 1) % order.length]];
  return s;
}

/** Greedy nearest-neighbour construction from a fixed start (default home = 0). */
export function nearestNeighbor(D: number[][], start = 0): { order: number[]; len: number } {
  const n = D.length;
  const seen = new Set([start]);
  const order = [start];
  while (order.length < n) {
    const last = order[order.length - 1];
    let bd = Infinity;
    let bi = -1;
    for (let j = 0; j < n; j++)
      if (!seen.has(j) && D[last][j] < bd) {
        bd = D[last][j];
        bi = j;
      }
    order.push(bi);
    seen.add(bi);
  }
  return { order, len: tourLength(order, D) };
}

function permutations(arr: number[]): number[][] {
  if (arr.length <= 1) return [arr];
  const out: number[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) out.push([arr[i], ...p]);
  }
  return out;
}

/** Brute force: fix city 0, try all (n-1)! orderings, keep the shortest. */
export function bruteForce(D: number[][]): { order: number[]; len: number } {
  const n = D.length;
  let best: number[] = [];
  let bl = Infinity;
  const rest = Array.from({ length: n - 1 }, (_, i) => i + 1);
  for (const p of permutations(rest)) {
    const order = [0, ...p];
    const l = tourLength(order, D);
    if (l < bl) {
      bl = l;
      best = order;
    }
  }
  return { order: best, len: bl };
}

/** A single accepted 2-opt move: reverse tour[i..j], shortening the tour. */
export interface TwoOptMove {
  i: number;
  j: number;
  from: number[];
  to: number[];
  before: number;
  after: number;
}

/** Reverse the segment tour[i..j] — the two_opt_gen neighbour (swaps two edges). */
export function twoOptReverse(order: number[], i: number, j: number): number[] {
  return order.slice(0, i).concat(order.slice(i, j + 1).reverse(), order.slice(j + 1));
}

/**
 * First-improvement 2-opt local search: scan reversal neighbours, take the first
 * that is shorter, repeat until no neighbour improves (a local minimum). Returns
 * the sequence of accepted moves so a scene can animate the descent.
 */
export function twoOptSteps(
  start: number[],
  D: number[][]
): { order: number[]; len: number; steps: TwoOptMove[] } {
  let x = start.slice();
  const steps: TwoOptMove[] = [];
  let improved = true;
  while (improved) {
    improved = false;
    const fx = tourLength(x, D);
    const n = x.length;
    for (let i = 1; i < n - 1 && !improved; i++) {
      for (let j = i + 1; j < n; j++) {
        const xn = twoOptReverse(x, i, j);
        const fn = tourLength(xn, D);
        if (fn < fx - 1e-9) {
          steps.push({ i, j, from: x.slice(), to: xn.slice(), before: fx, after: fn });
          x = xn;
          improved = true;
          break;
        }
      }
    }
  }
  return { order: x, len: tourLength(x, D), steps };
}

/** Random 2-opt neighbour — next() of the randomised two_opt_gen. */
export function twoOptRandNeighbor(x: number[], rnd: () => number): number[] {
  const n = x.length;
  const i = 2 + Math.floor(rnd() * (n - 2));
  const j = i + 1 + Math.floor(rnd() * (n + 1 - (i + 1)));
  return x.slice(0, i - 1).concat(x.slice(i - 1, j).reverse(), x.slice(j));
}

/** Initial temperature ≈ mean |Δf| over 100 perturbations / −ln(0.5) (_initial_temperature). */
export function initialTemperature(x: number[], D: number[][], rnd: () => number): number {
  let acc = 0;
  const fx = tourLength(x, D);
  for (let k = 0; k < 100; k++) acc += Math.abs(tourLength(twoOptRandNeighbor(x, rnd), D) - fx);
  return acc / 100 / -Math.log(0.5);
}

export interface WorseAccept {
  dfx: number;
  temp: number;
  p: number;
  from: number[];
  to: number[];
}

/**
 * Simulated annealing (Metropolis acceptance + geometric cooling temp*=alpha),
 * mirroring python-tsp. Returns the best tour found, the initial temperature, and
 * the FIRST worse-but-accepted move (the escape from a local minimum) so a scene
 * can display its real Δ, T and acceptance probability exp(−Δ/T).
 */
export function simulatedAnnealing(
  start: number[],
  D: number[][],
  saSeed: number,
  alpha = 0.9
): { order: number[]; len: number; temp0: number; firstWorse: WorseAccept | null } {
  const rnd = mulberry32(saSeed);
  const n = start.length;
  let x = start.slice();
  let fx = tourLength(x, D);
  const temp0 = initialTemperature(x, D, rnd);
  let temp = temp0;
  let best = x.slice();
  let bestf = fx;
  let noimp = 0;
  let firstWorse: WorseAccept | null = null;
  for (let cyc = 0; cyc < 80 && noimp < 3; cyc++) {
    let kacc = 0;
    for (let k = 0; k < 10 * n; k++) {
      const xn = twoOptRandNeighbor(x, rnd);
      const fn = tourLength(xn, D);
      const dfx = fn - fx;
      let accept = false;
      if (dfx < 0) accept = true;
      else {
        const p = Math.exp(-dfx / temp);
        if (rnd() <= p) {
          accept = true;
          if (!firstWorse && dfx > 1e-9)
            firstWorse = { dfx, temp, p, from: x.slice(), to: xn.slice() };
        }
      }
      if (accept) {
        x = xn;
        fx = fn;
        kacc++;
        if (fx < bestf - 1e-9) {
          bestf = fx;
          best = x.slice();
        }
      }
      if (kacc >= n) break;
    }
    temp *= alpha;
    if (kacc === 0) noimp++;
    else noimp = 0;
  }
  return { order: best, len: bestf, temp0, firstWorse };
}

// —————————————————————— rendering helpers ——————————————————————

/** Map a logical city point into a stage rectangle. */
export function place(p: Pt, box: { x: number; y: number; w: number; h: number }): Pt {
  return {
    x: box.x + (p.x / 100) * box.w,
    y: box.y + (p.y / 100) * box.h,
  };
}

/** SVG points string for a closed tour drawn through staged city positions. */
export function tourPoints(order: number[], staged: Pt[]): string {
  return order.map((c) => `${staged[c].x},${staged[c].y}`).join(' ') + ` ${staged[order[0]].x},${staged[order[0]].y}`;
}

/** n! (for the route-count explosion). */
export function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

/** Human route count: exact with thousands separators when small, else a×10^b. */
export function formatCount(v: number): string {
  if (v < 1e6) return Math.round(v).toLocaleString('en-US');
  const exp = Math.floor(Math.log10(v));
  const mant = v / Math.pow(10, exp);
  return `${mant.toFixed(2)} × 10^${exp}`;
}
