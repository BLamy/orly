import { CAMERA_HOME, Timeline, ease } from '../../core';
import type { CameraState } from '../../core';

/**
 * Fourier Series — Drawing with Rotating Circles.
 *
 * Everything here is pure and computed once at module scope of the component
 * file: the timeline, the star's DFT, and the closed-form partial-series
 * helpers. Nothing accumulates state at render time — every frame is a
 * function of the sampled channels (the scrubbability invariant).
 */

export interface Pt {
  x: number;
  y: number;
}

export const TWO_PI = Math.PI * 2;

/** Fundamental angular speed in rad/s of animation time — one turn every 4s. */
export const OMEGA = Math.PI / 2;

/** How many radians of signal history the unrolled trace shows (2 periods). */
export const HISTORY = 4 * Math.PI;

/** The square wave's odd harmonics, out to N = 25 (13 circles). */
export const ODD = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25];

/** Layout on the 1280×720 stage. Captions own the bottom ~12% (y ≳ 633). */
export const SQ = { cx: 300, cy: 300, R: 110, traceX0: 560, traceX1: 1200 };
export const SPEC = { x0: 560, x1: 1180, y: 595, barMax: 96 };
export const SHAPE = { cx: 640, cy: 330 };

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/**
 * Per-harmonic amplitude derived from the single N channel: harmonic n fades
 * in as N sweeps from n−2 up to n. "Render floor(N) circles" thus reads as a
 * smooth entrance rather than a hard pop, and the traced wave morphs
 * continuously with the sweep.
 */
export function harmonicAmps(N: number): number[] {
  return ODD.map((n) => clamp01((N - n + 2) / 2));
}

/**
 * The partial Fourier series of the square wave, in closed form:
 *   g(θ) = Σ amps[i] · sin(nᵢθ) / nᵢ   (nᵢ odd)
 * The trace samples this at (θ_now − offset) — always a pure function of the
 * linearly-tweened phase channel, never accumulated frame to frame.
 */
export function gTrace(amps: number[], theta: number): number {
  let v = 0;
  for (let i = 0; i < ODD.length; i++) {
    const a = amps[i];
    if (a > 0) v += (a * Math.sin(ODD[i] * theta)) / ODD[i];
  }
  return v;
}

/**
 * The square-wave epicycle chain, tip-to-tail: circle i has radius R·amp/n
 * and spins at n·θ. Returns the cumulative joints in local coords (screen y,
 * so +sin points up as −y); the tip's y offset is exactly −R·gTrace(amps, θ),
 * which keeps the chain tip and the trace head rigidly in sync.
 */
export function squareChain(amps: number[], theta: number): Pt[] {
  const pts: Pt[] = [{ x: 0, y: 0 }];
  let x = 0;
  let y = 0;
  for (let i = 0; i < ODD.length; i++) {
    const n = ODD[i];
    const r = (SQ.R * amps[i]) / n;
    x += r * Math.cos(n * theta);
    y -= r * Math.sin(n * theta);
    pts.push({ x, y });
  }
  return pts;
}

/* --------------------------------------------------------------------- */
/* Finale: complex DFT of a five-pointed star, computed once here.        */
/* --------------------------------------------------------------------- */

const STAR_M = 256; // samples along the star outline
const STAR_OUTER = 205;
const STAR_INNER = 82;
const MAX_FREQ = 64; // keep 128 coefficients: f ∈ [−64, 64)

/**
 * Closed-form parametric star: 10 alternating outer/inner vertices sampled
 * uniformly edge-by-edge. Screen coords (y down); the top point aims up.
 */
function starPoints(): Pt[] {
  const verts: Pt[] = [];
  for (let j = 0; j < 10; j++) {
    const a = -Math.PI / 2 + (j * Math.PI) / 5;
    const r = j % 2 === 0 ? STAR_OUTER : STAR_INNER;
    verts.push({ x: r * Math.cos(a), y: r * Math.sin(a) });
  }
  const pts: Pt[] = [];
  for (let m = 0; m < STAR_M; m++) {
    const u = (m / STAR_M) * 10;
    const j = Math.floor(u);
    const f = u - j;
    const a = verts[j % 10];
    const b = verts[(j + 1) % 10];
    pts.push({ x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f });
  }
  return pts;
}

export interface ShapeCoef {
  freq: number;
  re: number;
  im: number;
  amp: number;
}

/** Complex DFT of the outline, sorted by magnitude so the chain nests big → small. */
function dft(pts: Pt[]): ShapeCoef[] {
  const M = pts.length;
  const out: ShapeCoef[] = [];
  for (let f = -MAX_FREQ; f < MAX_FREQ; f++) {
    let re = 0;
    let im = 0;
    for (let m = 0; m < M; m++) {
      const a = (-TWO_PI * f * m) / M;
      const c = Math.cos(a);
      const s = Math.sin(a);
      re += pts[m].x * c - pts[m].y * s;
      im += pts[m].x * s + pts[m].y * c;
    }
    re /= M;
    im /= M;
    out.push({ freq: f, re, im, amp: Math.hypot(re, im) });
  }
  return out.sort((a, b) => b.amp - a.amp);
}

export const SHAPE_COEFS: ShapeCoef[] = dft(starPoints());

/**
 * The star epicycle chain at phase θ (2π = one lap of the drawing): the
 * cumulative joints of all 128 coefficient vectors. The tip is exactly the
 * truncated-DFT reconstruction, so it rides SHAPE_PATH precisely.
 */
export function shapeChain(theta: number): Pt[] {
  const pts: Pt[] = [{ x: 0, y: 0 }];
  let x = 0;
  let y = 0;
  for (const c of SHAPE_COEFS) {
    const a = c.freq * theta;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    x += c.re * ca - c.im * sa;
    y += c.re * sa + c.im * ca;
    pts.push({ x, y });
  }
  return pts;
}

/** The reconstructed outline the tip traces — memoized once at module scope. */
export const SHAPE_PATH: Pt[] = (() => {
  const pts: Pt[] = [];
  for (let m = 0; m <= STAR_M; m++) {
    const chain = shapeChain((TWO_PI * m) / STAR_M);
    pts.push(chain[chain.length - 1]);
  }
  return pts;
})();

/* --------------------------------------------------------------------- */
/* The timeline.                                                          */
/* --------------------------------------------------------------------- */

export const T_TOTAL = 60.4;

export function buildScene() {
  const tl = new Timeline();

  const phase = tl.channel('phase', 0); // square-wave rotation θ = ω·t_anim
  const N = tl.channel('N', -1); // harmonic sweep; amp₁ = 0 at N = −1
  const shapePhase = tl.channel('shapePhase', 0); // star lap phase (2π = once around)
  const bars = ODD.map((n) => tl.channel(`bar${n}`, 0)); // spectrum bar pops
  const specReveal = tl.channel('specReveal', 0); // frequency number line draw-on
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const texU = tl.channel('texU', 0); // e^{iωt} label
  const sumU = tl.channel('sumU', 0); // partial-sum label
  const blend = tl.channel('blend', 0); // 0 = square-wave mode, 1 = star mode

  // Rotation speed is constant for the whole piece: one linear tween.
  tl.tween(phase, OMEGA * T_TOTAL, { at: 0, dur: T_TOTAL, ease: ease.linear });

  // ---- beat 1: one spinning arrow → a sine wave -------------------------
  tl.tween(N, 1, { at: 0.3, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: 'Meet a spinning arrow: constant speed, fixed length. Keep your eye on its height.',
  });
  tl.tween(texU, 1, { at: 2.2, dur: 0.6, ease: ease.enter });
  tl.caption({
    at: 7.4,
    dur: 5.0,
    text: 'Unrolled over time, that height is a pure sine wave. One frequency, one circle.',
  });
  tl.hold(12.6, 0.6);

  // ---- beat 2: harmonics 3, 5, 7 stagger in tip-to-tail ------------------
  tl.caption({
    at: 13.2,
    dur: 6.6,
    text: 'Now bolt on harmonics 3, 5, 7 — each 1/n as long, spinning n times as fast.',
  });
  tl.tween(texU, 0, { at: 13.2, dur: 0.5, ease: ease.enter });
  tl.tween(sumU, 1, { at: 13.7, dur: 0.7, ease: ease.enter });
  tl.tween(N, 3, { at: 14.0, dur: 1.0, ease: ease.enter });
  tl.tween(N, 5, { at: 15.7, dur: 1.0, ease: ease.enter });
  tl.tween(N, 7, { at: 17.4, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 20.2,
    dur: 4.2,
    text: 'Tip to tail, circle on circle — and the wave starts squaring off.',
  });
  tl.hold(24.6, 0.6);

  // ---- beat 3: the spectrum — same data, second view ---------------------
  tl.caption({
    at: 25.2,
    dur: 6.2,
    text: 'Second view, same recipe: the spectrum. One bar per arrow — frequency n, height 1/n.',
  });
  tl.tween(cam, { x: 780, y: 460, k: 1.28 }, { at: 25.2, dur: 1.3, ease: ease.move });
  tl.tween(specReveal, 1, { at: 25.5, dur: 1.1, ease: ease.draw });
  for (let i = 0; i < 4; i++) {
    tl.tween(bars[i], 1, { at: 26.8 + i * 0.35, dur: 0.55, ease: ease.pop });
  }
  tl.tween(cam, CAMERA_HOME, { at: 30.6, dur: 1.2, ease: ease.move });
  tl.hold(31.8, 0.2);

  // ---- beat 4: sweep N → 25; the fit sharpens, Gibbs stays ----------------
  tl.caption({
    at: 32.0,
    dur: 5.4,
    text: 'Crank it to N = 25. Every new arrow is smaller — a nudge, not a shove.',
  });
  tl.tween(N, 25, { at: 32.4, dur: 9.0, ease: ease.linear });
  for (let i = 4; i < ODD.length; i++) {
    // N is linear here, so it crosses harmonic n at exactly 32.4 + (n−7)/2:
    // each spectrum bar pops the moment its circle reaches full size.
    tl.tween(bars[i], 1, { at: 32.4 + (ODD[i] - 7) / 2, dur: 0.5, ease: ease.pop });
  }
  tl.caption({
    at: 38.2,
    dur: 6.0,
    text: 'The corners sharpen, but the overshoot at each jump refuses to die. Gibbs says hi.',
  });
  tl.hold(44.4, 0.4);

  // ---- beat 5: retune the arrows to a drawing's DFT ----------------------
  tl.caption({
    at: 44.8,
    dur: 5.8,
    text: 'Last trick: retune the arrows to the Fourier coefficients of a drawing.',
  });
  tl.tween(blend, 1, { at: 45.2, dur: 2.6, ease: ease.move });
  tl.tween(shapePhase, TWO_PI * 2.2, { at: 47.9, dur: 11.0, ease: ease.linear });
  tl.caption({
    at: 52.0,
    dur: 6.4,
    text: 'Any drawing is just circles on circles — enough of them, at the right sizes and speeds.',
  });
  tl.hold(58.9, 1.5); // total = T_TOTAL

  return { tl, phase, N, shapePhase, bars, specReveal, cam, texU, sumU, blend };
}
