import { Timeline, ease, stagger } from '../../core';

/**
 * Eigenvectors — The Axes That Stay.
 *
 * The one mechanic everything rides on is the 3b1b grid morph: a single
 * channel u ∈ [0,1] drives M(u) = (1−u)·I + u·A, and every piece of geometry
 * on stage (grid lines, basis vectors, sample vectors, the unit square, the
 * eigenbasis grid) is just its rest-position endpoints pushed through M(u).
 * Linear maps send lines to lines, so transforming endpoints is exact — no
 * resampling, no accumulated state, pure functions of the sampled channels
 * (the scrubbability invariant).
 */

export interface Pt {
  x: number;
  y: number;
}

/** Row-major 2×2: [[a, b], [c, d]]. */
export interface Mat2 {
  a: number;
  b: number;
  c: number;
  d: number;
}

/**
 * The star of the show. A = [[3, 1], [0, 2]]:
 * eigenvalues 3 and 2, eigenvectors [1, 0] and [1, −1] — big, visible moves.
 */
export const A: Mat2 = { a: 3, b: 1, c: 0, d: 2 };

export const V1: Pt = { x: 1, y: 0 }; // eigenvector for λ₁ = 3
export const V2: Pt = { x: 1, y: -1 }; // eigenvector for λ₂ = 2
export const LAMBDA1 = 3;
export const LAMBDA2 = 2;

/** World → stage: grid centered at (640, 340), 70 px per unit, world y up. */
export const WORLD = { cx: 640, cy: 340, s: 70 };
export const toX = (x: number) => WORLD.cx + WORLD.s * x;
export const toY = (y: number) => WORLD.cy - WORLD.s * y;

/** M(u) = (1−u)·I + u·A — linear interpolation of the matrix entries. */
export function matAt(u: number): Mat2 {
  return {
    a: 1 + u * (A.a - 1),
    b: u * A.b,
    c: u * A.c,
    d: 1 + u * (A.d - 1),
  };
}

export function apply(m: Mat2, p: Pt): Pt {
  return { x: m.a * p.x + m.b * p.y, y: m.c * p.x + m.d * p.y };
}

export const detOf = (m: Mat2) => m.a * m.d - m.b * m.c;

/* --------------------------------------------------------------------- */
/* Grids, computed once at module scope.                                  */
/* --------------------------------------------------------------------- */

export const GRID_N = 12; // integer lines each side of the origin
export const GRID_EXT = 12; // half-length of each line, in world units

export interface GridLine {
  p: Pt;
  q: Pt;
  /** distance rank from the origin — drives the center-out reveal stagger */
  ord: number;
  axis: boolean;
}

/** The standard square grid: x = k and y = k for k ∈ [−N, N]. */
export const STD_LINES: GridLine[] = (() => {
  const lines: GridLine[] = [];
  for (let k = -GRID_N; k <= GRID_N; k++) {
    lines.push({ p: { x: k, y: -GRID_EXT }, q: { x: k, y: GRID_EXT }, ord: Math.abs(k), axis: k === 0 });
    lines.push({ p: { x: -GRID_EXT, y: k }, q: { x: GRID_EXT, y: k }, ord: Math.abs(k), axis: k === 0 });
  }
  return lines;
})();

export const EIG_N = 10;
export const EIG_EXT = 12;

export interface EigLine extends GridLine {
  dir: 'v1' | 'v2';
}

/**
 * The eigenbasis grid: lines parallel to v₁ through j·v₂, and parallel to v₂
 * through i·v₁. Both families run along eigendirections, so M(u) can only
 * slide/stretch them within their own family — in this grid nothing shears.
 */
export const EIG_LINES: EigLine[] = (() => {
  const lines: EigLine[] = [];
  for (let k = -EIG_N; k <= EIG_N; k++) {
    lines.push({
      p: { x: k * V2.x - EIG_EXT * V1.x, y: k * V2.y - EIG_EXT * V1.y },
      q: { x: k * V2.x + EIG_EXT * V1.x, y: k * V2.y + EIG_EXT * V1.y },
      ord: Math.abs(k),
      axis: k === 0,
      dir: 'v1',
    });
    lines.push({
      p: { x: k * V1.x - EIG_EXT * V2.x, y: k * V1.y - EIG_EXT * V2.y },
      q: { x: k * V1.x + EIG_EXT * V2.x, y: k * V1.y + EIG_EXT * V2.y },
      ord: Math.abs(k),
      axis: k === 0,
      dir: 'v2',
    });
  }
  return lines;
})();

/**
 * Sample vectors for beat 3, hand-picked (deterministic) to stay on stage
 * after A and to avoid both eigendirections — all seven visibly rotate.
 */
export const SAMPLES: Pt[] = [
  { x: 1, y: 2 },
  { x: -1, y: 1.5 },
  { x: -2, y: -0.7 },
  { x: 0.5, y: -1.6 },
  { x: 2, y: 1 },
  { x: -1.5, y: 0.5 },
  { x: -0.6, y: -1.9 },
];

export const SPAN_LEN = 3.6; // half-length of a sample vector's span line
export const EIG_SPAN_LEN = 4.6; // eigen span half-length (contains the ×3 tip)

/** Endpoints of a vector's span (its line through the origin), length ±len. */
export function spanOf(v: Pt, len: number): [Pt, Pt] {
  const n = Math.hypot(v.x, v.y);
  const ux = v.x / n;
  const uy = v.y / n;
  return [
    { x: -len * ux, y: -len * uy },
    { x: len * ux, y: len * uy },
  ];
}

/* --------------------------------------------------------------------- */
/* The timeline.                                                          */
/* --------------------------------------------------------------------- */

export const T_TOTAL = 72.4;

export function buildScene() {
  const tl = new Timeline();

  const gridU = tl.channel('gridU', 0); // THE morph parameter: M(u) = (1−u)I + uA
  const gridReveal = tl.channel('gridReveal', 0); // center-out grid draw-in
  const stdGridU = tl.channel('stdGridU', 1); // standard grid opacity (fades in finale)
  const eigGridU = tl.channel('eigGridU', 0); // eigenbasis grid draw-in
  const iU = tl.channel('iU', 0); // î grow
  const jU = tl.channel('jU', 0); // ĵ grow
  const basisOp = tl.channel('basisOp', 1); // î/ĵ fade once the eigenvectors take over
  const matU = tl.channel('matU', 0); // the A-with-highlighted-columns label
  const sampleGrow = SAMPLES.map((_, i) => tl.channel(`sample${i}`, 0));
  const samplesOp = tl.channel('samplesOp', 1); // group fade for all samples
  const spansU = tl.channel('spansU', 0); // sample span lines
  const eigU = tl.channel('eigU', 0); // v₁/v₂ arrows + their spans
  const scaleU = tl.channel('scaleU', 0); // ×3 / ×2 pops
  const eigMathU = tl.channel('eigMathU', 0); // Av = λv
  const sqU = tl.channel('sqU', 0); // unit square + live area label
  const detU = tl.channel('detU', 0); // det A = λ₁λ₂ label
  const diagU = tl.channel('diagU', 0); // finale diagonal-matrix label

  // ---- beat 1: grid + basis vectors draw in over dark axes ---------------
  tl.tween(gridReveal, 1, { at: 0.0, dur: 1.6, ease: ease.draw });
  tl.caption({
    at: 0.4,
    dur: 5.2,
    text: 'A matrix is a machine: it picks up every point in space and puts it somewhere new.',
  });
  tl.tween(iU, 1, { at: 1.4, dur: 0.7, ease: ease.enter });
  tl.tween(jU, 1, { at: 1.65, dur: 0.7, ease: ease.enter });
  tl.caption({ at: 5.8, dur: 3.2, text: 'The whole grid hangs on two arrows: î and ĵ.' });
  tl.hold(9.0, 0.4);

  // ---- beat 2: apply A, watch î and ĵ land on its columns, snap back -----
  tl.tween(matU, 1, { at: 9.4, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 9.6,
    dur: 4.6,
    text: 'Apply A: every point moves at once — and î and ĵ land exactly on the columns of A.',
  });
  tl.tween(gridU, 1, { at: 10.4, dur: 2.0, ease: ease.move });
  tl.hold(12.4, 2.0);
  tl.caption({ at: 14.4, dur: 3.0, text: 'Rewind — every point remembers exactly where it came from.' });
  tl.tween(gridU, 0, { at: 15.0, dur: 0.9, ease: ease.move });
  tl.hold(15.9, 1.5);

  // ---- beat 3: most vectors get knocked off their own line ---------------
  tl.caption({
    at: 17.4,
    dur: 4.6,
    text: 'Now scatter a few vectors, each pinned to its own line through the origin.',
  });
  stagger(SAMPLES.length, { at: 17.8, each: 0.1, dur: 0.6, ease: ease.enter }).forEach((o, i) =>
    tl.tween(sampleGrow[i], 1, o),
  );
  tl.tween(spansU, 1, { at: 18.9, dur: 0.8, ease: ease.enter });
  tl.caption({ at: 22.2, dur: 5.2, text: 'Apply A again: almost every vector is knocked clean off its line.' });
  tl.tween(gridU, 1, { at: 22.8, dur: 2.4, ease: ease.move });
  tl.hold(25.2, 2.0);
  tl.tween(gridU, 0, { at: 27.2, dur: 0.9, ease: ease.move });
  tl.hold(28.1, 0.7);

  // ---- beat 4: the two directions that survive ----------------------------
  tl.tween(samplesOp, 0.22, { at: 28.8, dur: 0.7, ease: ease.enter });
  tl.tween(spansU, 0, { at: 28.8, dur: 0.7, ease: ease.enter });
  tl.tween(basisOp, 0.25, { at: 28.8, dur: 0.7, ease: ease.enter });
  tl.tween(eigU, 1, { at: 29.2, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 29.0,
    dur: 5.2,
    text: 'But two directions survive: one along the x-axis, one along [1, −1].',
  });
  tl.caption({
    at: 34.4,
    dur: 5.6,
    text: 'Apply A slowly. They never leave their lines — they only stretch: ×3 and ×2.',
  });
  tl.tween(gridU, 1, { at: 35.2, dur: 3.2, ease: ease.move });
  tl.tween(scaleU, 1, { at: 38.2, dur: 0.55, ease: ease.pop });
  tl.tween(eigMathU, 1, { at: 39.0, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 40.6,
    dur: 4.8,
    text: 'These are the eigenvectors — the directions the matrix cannot turn, only stretch.',
  });
  tl.hold(45.4, 0.6);
  tl.tween(gridU, 0, { at: 46.0, dur: 0.9, ease: ease.move });
  tl.tween(scaleU, 0, { at: 46.0, dur: 0.4, ease: ease.enter });
  tl.tween(eigMathU, 0, { at: 46.2, dur: 0.5, ease: ease.enter });

  // ---- beat 5: determinant aside — the unit square's area ----------------
  tl.tween(sqU, 1, { at: 47.2, dur: 0.7, ease: ease.enter });
  tl.caption({ at: 47.4, dur: 4.2, text: 'One more read on A: shade the unit square and watch its area.' });
  tl.tween(gridU, 1, { at: 49.0, dur: 2.2, ease: ease.move });
  tl.tween(detU, 1, { at: 51.4, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 51.8,
    dur: 5.0,
    text: 'Area ×6 — the determinant. No accident: it is 3 × 2, the eigenvalues multiplied.',
  });
  tl.hold(56.8, 0.4);
  tl.tween(sqU, 0, { at: 57.2, dur: 0.6, ease: ease.enter });
  tl.tween(detU, 0, { at: 57.2, dur: 0.5, ease: ease.enter });
  tl.tween(gridU, 0, { at: 57.2, dur: 0.9, ease: ease.move });

  // ---- beat 6: swap in the eigenbasis grid — A becomes pure stretch ------
  tl.tween(stdGridU, 0.12, { at: 58.4, dur: 1.2, ease: ease.move });
  tl.tween(basisOp, 0, { at: 58.4, dur: 0.8, ease: ease.enter });
  tl.tween(samplesOp, 0, { at: 58.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 58.6,
    dur: 4.8,
    text: 'Change the grid itself: draw the coordinate lines the eigenvectors carve out.',
  });
  tl.tween(eigGridU, 1, { at: 59.2, dur: 1.6, ease: ease.draw });
  tl.caption({
    at: 63.6,
    dur: 6.6,
    text: 'Apply A one last time — nothing shears. In the right coordinates, every hard matrix is just numbers on a diagonal.',
  });
  tl.tween(gridU, 1, { at: 64.4, dur: 3.0, ease: ease.move });
  tl.tween(diagU, 1, { at: 67.6, dur: 0.7, ease: ease.enter });
  tl.hold(70.2, 2.2); // total = T_TOTAL

  return {
    tl,
    gridU,
    gridReveal,
    stdGridU,
    eigGridU,
    iU,
    jU,
    basisOp,
    matU,
    sampleGrow,
    samplesOp,
    spansU,
    eigU,
    scaleU,
    eigMathU,
    sqU,
    detU,
    diagU,
  };
}
