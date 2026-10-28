/**
 * handwired-explained — ch04-s10 / ch04-s11: THE SIGN-CASCADE LENS TRAIN (machine 3; TE08, EX05).
 *
 * Without a grid, a > 4 (a within −1000..1000) is a sign cascade of 16 operations in 15 layers: d = a − 4 as its own
 * operation, six clamp stages scaling by 2^14 then 2^24 five times (each followed by a stop that clips at height 1),
 * the final ReGLU relu(1 − 2^15 · stage) and then the bit. The scales multiply to 2^149 = 2^(14 + 5·24 + 15), so the
 * faintest nonzero FP32 difference (2^−149, a subnormal) comes out at full height 1.
 *
 * The beam's drawn thickness is the difference's EXPONENT, not its value (a log scale: 2^−149 is a hairline, 2^0 a
 * full bar), so each lens visibly thickens it by its own power of two: after stage k the exponent is
 * −149 + 14 + 24·(k − 1) … and reaches 0 at the seventh stage. EXP[] below is computed from the scales.
 *
 *   LT                         geometry (rest-screen L4 px): stage x positions, beam axis, full-bar height
 *   lensTrain(c, env, o)       the train in the dark (lit lenses on black card stands, stops, the ReGLU and flip,
 *                              the beam) or as INK on a parchment plate (style 'ink', ch04-s11)
 *   opPins(c, env, o)          the 16 operation pins under the train (lit as the beam passes; `keep` = fade 14)
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { copperOf } from './narratorHands';

type C = CanvasRenderingContext2D;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** the scales, in powers of two: lens 1, lenses 2-6, the ReGLU inside the seventh stage (TE08) */
export const SCALES = [14, 24, 24, 24, 24, 24, 15];
export const TOTAL_EXP = SCALES.reduce((a, b) => a + b, 0); // 149
/** the faintest difference's exponent after each stage (start −149; 0 = the full bar) */
export const EXP = SCALES.reduce<number[]>((acc, s) => [...acc, acc[acc.length - 1] + s], [-TOTAL_EXP]);
/** drawn thickness fraction (0..1) for an exponent */
export const thick = (e: number) => clamp01((e + TOTAL_EXP) / TOTAL_EXP);

export const LT = {
  /** the beam's axis and the full-bar height (value 1) */
  Y: 382,
  H: 46,
  /** the d = a − 4 box, the six lenses (each with a stop after it), the seventh stage (ReGLU ramp) and the flip */
  BOX: 96,
  LENS: [196, 312, 428, 544, 660, 776],
  STOP_DX: 44,
  REGLU: 884,
  FLIP: 944,
  /** where the bar ends (at the select) */
  END: 992,
  /** the stands' foot (the bench) */
  FOOT: 596,
  /** the pin rail */
  PIN_Y: 470,
} as const;

/** x positions of the 16 operation pins: d (1), each lens + stop (2 × 6), the ReGLU stage (2), the flip / bit (1) */
export const PIN_X: number[] = (() => {
  const xs: number[] = [LT.BOX];
  for (const x of LT.LENS) xs.push(x - 12, x + LT.STOP_DX - 12);
  xs.push(LT.REGLU - 14, LT.REGLU + 14, LT.FLIP);
  return xs;
})();

export interface TrainOpts {
  style: 'lit' | 'ink';
  /** 0..8: how far the beam has come: segment k (box exit → lens 1 → … → lens 6 → ReGLU → flip) fills over [k, k + 1]; 1 = at lens 1, 6 = at lens 6, 7 = at the ReGLU, 8 = at the flip */
  front: number;
  /** the hairline's flicker (0..1 alpha multiplier) */
  flick?: number;
  /** 0..1 the bar flooding past the flip to LT.END */
  flood?: number;
  /** 0..1 a warm kick on the last lit lens */
  kick?: number;
  /** ink plates: global x scale about LT.BOX (the plate's side-by-side drawing) */
  lensGlow?: number;
}

/** the stands, lenses, stops, the ReGLU ramp and the flip; then the beam (draw in L4) */
export function lensTrain(c: C, env: PaintEnv, o: TrainOpts) {
  const ink = o.style === 'ink';
  const dark = ink ? '#2a211b' : PUPPET_NEAR_BLACK;
  const rimC = ink ? withAlpha('#2a211b', 0.9) : withAlpha(mixLab(env.mood.rim, env.mood.core, 0.55), 0.8);
  const { Y, H } = LT;
  // the rail the stands are fixed to (a bench strip)
  c.fillStyle = dark;
  if (!ink) c.fillRect(LT.BOX - 60, LT.FOOT - 8, LT.END - LT.BOX + 120, 10);
  // the d = a − 4 box: a small black housing the wire of a enters
  c.fillStyle = dark;
  c.fillRect(LT.BOX - 26, Y - 26, 52, 52);
  if (!ink) c.fillRect(LT.BOX - 4, Y + 26, 8, LT.FOOT - Y - 26);
  // the wire of a into the box from the left
  c.strokeStyle = ink ? withAlpha('#7a4a2a', 0.9) : copperOf(env, 0.25);
  c.lineWidth = 3.4;
  c.beginPath();
  c.moveTo(-300, Y);
  c.lineTo(LT.BOX - 26, Y);
  c.stroke();
  c.strokeStyle = rimC;
  c.lineWidth = 1.6;
  c.strokeRect(LT.BOX - 26, Y - 26, 52, 52);
  // lenses on black card stands, each with a stop after it
  LT.LENS.forEach((x, i) => {
    const lit = clamp01((o.front - i - 0.85) / 0.15);
    const passed = o.front >= i + 1.3;
    // stand
    c.fillStyle = dark;
    if (!ink) {
      c.fillRect(x - 5, Y + 52, 10, LT.FOOT - Y - 52);
      c.beginPath();
      c.moveTo(x - 22, LT.FOOT - 6);
      c.lineTo(x + 22, LT.FOOT - 6);
      c.lineTo(x + 6, LT.FOOT - 26);
      c.lineTo(x - 6, LT.FOOT - 26);
      c.closePath();
      c.fill();
    } else {
      c.fillRect(x - 2, Y + 52, 4, 40);
    }
    // the lens: a backlit paper disc seen edge-on (an ellipse) in a black ring
    c.beginPath();
    c.ellipse(x, Y, 17, 54, 0, 0, Math.PI * 2);
    c.fill();
    if (ink) {
      c.fillStyle = mixLab('#efe3c8', '#d8c393', 0.3);
      c.beginPath();
      c.ellipse(x, Y, 12, 48, 0, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = withAlpha('#2a211b', 0.6);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, Y - 44);
      c.lineTo(x, Y + 44);
      c.stroke();
    } else {
      const glowK = 0.16 + 0.5 * lit + (passed ? 0.1 : 0) + (i === Math.round(o.front) - 1 ? 0.24 * clamp01(o.kick ?? 0) : 0);
      const g = c.createLinearGradient(x - 12, 0, x + 12, 0);
      g.addColorStop(0, mixLab(env.mood.halo, PUPPET_NEAR_BLACK, 0.6 - 0.5 * glowK));
      g.addColorStop(0.5, mixLab(mixLab(env.mood.halo, env.mood.core, 0.4 * glowK), PUPPET_NEAR_BLACK, 0.55 - 0.55 * glowK));
      g.addColorStop(1, mixLab(env.mood.halo, PUPPET_NEAR_BLACK, 0.6 - 0.5 * glowK));
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(x, Y, 12, 48, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.strokeStyle = rimC;
    c.lineWidth = 1.4;
    c.beginPath();
    c.ellipse(x, Y, 17, 54, 0, Math.PI * 1.15, Math.PI * 1.85);
    c.stroke();
    // the stop: two black plates leaving an opening exactly the full-bar height (value 1)
    const sx = x + LT.STOP_DX;
    c.fillStyle = dark;
    c.fillRect(sx - 3, Y - H / 2 - 40, 6, 40);
    c.fillRect(sx - 3, Y + H / 2, 6, 40);
    if (!ink) c.fillRect(sx - 2, Y + H / 2 + 40, 4, LT.FOOT - Y - H / 2 - 40);
    c.strokeStyle = rimC;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(sx - 3, Y - H / 2 - 40);
    c.lineTo(sx + 3, Y - H / 2 - 40);
    c.stroke();
  });
  // the seventh stage: a small ReGLU ramp (flat, then a climb) in a frame; the flip: a hinged plate
  {
    const x = LT.REGLU;
    c.fillStyle = dark;
    c.fillRect(x - 34, Y - 34, 68, 68);
    if (!ink) c.fillRect(x - 4, Y + 34, 8, LT.FOOT - Y - 34);
    c.strokeStyle = ink ? '#2a211b' : withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4 + 0.5 * clamp01(o.front - 6.8)), 0.9);
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(x - 24, Y + 18);
    c.lineTo(x - 2, Y + 18);
    c.lineTo(x + 22, Y - 18);
    c.stroke();
    if (ink) {
      c.fillStyle = mixLab('#efe3c8', '#d8c393', 0.3);
      c.fillRect(x - 28, Y - 28, 56, 56);
      c.strokeStyle = '#2a211b';
      c.beginPath();
      c.moveTo(x - 24, Y + 18);
      c.lineTo(x - 2, Y + 18);
      c.lineTo(x + 22, Y - 18);
      c.stroke();
    }
    const fx = LT.FLIP;
    const flip = clamp01((o.front - 7.75) / 0.25);
    c.save();
    c.translate(fx, Y + H / 2 + 6);
    c.rotate(-Math.PI / 2 * (1 - flip) * 0.6);
    c.fillStyle = dark;
    c.fillRect(-3, -H - 12, 6, H + 12);
    c.restore();
    c.fillStyle = ink ? '#7a4a2a' : copperOf(env, 0.5);
    c.beginPath();
    c.arc(fx, Y + H / 2 + 6, 4, 0, Math.PI * 2);
    c.fill();
  }
  if (!ink) beam(c, env, o);
}

/** the beam: a hairline out of the box, thickened by each lens (its exponent), clipped by each stop, then the bar */
function beam(c: C, env: PaintEnv, o: TrainOpts) {
  const { Y, H } = LT;
  const xs = [LT.BOX + 26, ...LT.LENS, LT.REGLU, LT.FLIP];
  const seg = (k: number) => ({ x0: xs[k], x1: xs[k + 1] ?? LT.FLIP, e: EXP[k] });
  const front = o.front;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let k = 0; k < xs.length - 1; k++) {
    const u = clamp01(front - k);
    if (u <= 0) break;
    const s = seg(k);
    const x1 = s.x0 + (s.x1 - s.x0) * u;
    const th = Math.max(0.9, thick(s.e) * H);
    const a = k === 0 ? 0.15 + 0.5 * clamp01(o.flick ?? 1) : 0.92;
    drawBeam(c, env, s.x0, x1, Y, th, a);
  }
  // past the flip: the bar floods to the select at full height
  const fl = clamp01(o.flood ?? 0);
  if (fl > 0) drawBeam(c, env, LT.FLIP, LT.FLIP + (LT.END - LT.FLIP) * fl, Y, H, 1);
  c.restore();
}
function drawBeam(c: C, env: PaintEnv, x0: number, x1: number, y: number, th: number, a: number) {
  const core = mixLab(copperOf(env, 0.9), env.mood.core, 0.45);
  // a hairline barely glows (it is at the edge of visibility); a thick beam carries a wide halo
  const halo = th < 2 ? 3 : Math.max(10, th * 0.9);
  const g = c.createLinearGradient(0, y - th / 2 - halo, 0, y + th / 2 + halo);
  g.addColorStop(0, withAlpha(env.mood.halo, 0));
  g.addColorStop(0.5, withAlpha(copperOf(env, 0.7), 0.22 * a));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(x0, y - th / 2 - halo, x1 - x0, th + 2 * halo);
  c.fillStyle = withAlpha(core, 0.85 * a);
  c.fillRect(x0, y - th / 2, x1 - x0, th);
}

/** the 16 operation pins along the rail: `lit` (count lit, left to right), `keep` 0..1 (fade 14 of 16, leaving the
 *  first and last... (ch04-s11 draws its own marks on the plate)) */
export function opPins(c: C, env: PaintEnv, o: { lit: number; style: 'lit' | 'ink'; y?: number }) {
  const y = o.y ?? LT.PIN_Y;
  PIN_X.forEach((x, i) => {
    const on = clamp01(o.lit - i);
    c.fillStyle = o.style === 'ink' ? '#2a211b' : PUPPET_NEAR_BLACK;
    c.beginPath();
    c.arc(x, y, 6, 0, Math.PI * 2);
    c.fill();
    if (on > 0) {
      c.fillStyle = withAlpha(o.style === 'ink' ? '#8a4421' : copperOf(env, 0.8), on);
      c.beginPath();
      c.arc(x, y, 3.4, 0, Math.PI * 2);
      c.fill();
    }
  });
}
