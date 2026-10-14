/**
 * ch15-s01 — cut-paper seated busts with six head types (shoulder width, neck, hair, collar), for the Hall of
 * Mirrors' reflected figures and its real audience. Same footprint as ch05's bust5 (y = the shoulders' base,
 * the head centre about 61·s above it) so they drop into the hall's rows.
 *
 *   figure15(c, x, y, s, view, ink, type, tilt?)
 *     view:  0 = the back of the head (to us)
 *           ±1 = a profile looking right / left
 *           ±0.5 = a three-quarter turn toward right / left (one drawing between back and profile, on twos)
 *     type:  0..5 (see TYPES)
 *
 *   audienceBust(c, x, y, s, variant, ink, o?)   (review round 5: the Nobel audience read as rows of identical
 *     round-headed busts) a seated listener seen from behind, same footprint, in four head/hair variants that differ
 *     in OUTLINE, not only in ink: 'bald' (a smooth, slightly smaller skull, ears out), 'parted' (two hair lobes with
 *     a side-parting dip at the crown), 'bun' (a chignon rising above the crown), 'greyWave' (a scalloped wave of
 *     grey hair, a lighter value than the ink). Shoulders carry a jacket collar with a lapel notch either side
 *     (o.collar 'notch') or a raised shirt collar (o.collar 'points'). o.rim draws a 1 device-px warm rim on the lit
 *     side (o.rimDir, default upper-left), by laying the silhouette in the rim colour one pixel toward the light
 *     under the ink.
 */
import { mixLab } from '../../../film/silhouette/palette';

type C = CanvasRenderingContext2D;

interface HeadType {
  /** shoulder half-width (× s) */
  sw: number;
  /** shoulder height of the slope (× s) */
  sh: number;
  /** head rx / ry */
  hx: number;
  hy: number;
  /** neck length (× s) */
  neck: number;
  /** hair: crop (short, ears show), bun (a chignon), bob (to the jaw), wave (full on top), bald (a fringe), tied */
  hair: 'crop' | 'bun' | 'bob' | 'wave' | 'bald' | 'tied';
  /** a raised shirt collar (points) or a soft shawl */
  collar: 'points' | 'shawl' | 'none';
  /** head forward (an older stoop) */
  stoop: number;
}
export const TYPES: HeadType[] = [
  { sw: 23, sh: 30, hx: 10.2, hy: 12.4, neck: 11, hair: 'crop', collar: 'points', stoop: 0 },
  { sw: 19, sh: 26, hx: 9.4, hy: 11.8, neck: 13, hair: 'bun', collar: 'shawl', stoop: 0 },
  { sw: 27.5, sh: 33, hx: 10.8, hy: 12.6, neck: 9.5, hair: 'bald', collar: 'points', stoop: 0 },
  { sw: 20, sh: 27, hx: 9.8, hy: 12, neck: 11.5, hair: 'bob', collar: 'none', stoop: 0 },
  { sw: 24.5, sh: 31, hx: 10.6, hy: 12.8, neck: 10.5, hair: 'wave', collar: 'points', stoop: 0 },
  { sw: 25, sh: 29, hx: 10.2, hy: 12.2, neck: 9, hair: 'tied', collar: 'shawl', stoop: 4 },
];

export function figure15(c: C, x: number, y: number, s: number, view: number, ink: string, type = 0, tilt = 0) {
  const T = TYPES[((type % TYPES.length) + TYPES.length) % TYPES.length];
  c.fillStyle = ink;
  // shoulders and upper arms: a soft trapezoid; width by type
  const sw = T.sw * s;
  const top = y - (T.sh + 8) * s;
  c.beginPath();
  c.moveTo(x - sw, y);
  c.quadraticCurveTo(x - sw, top + 7 * s, x - sw * 0.46, top + 1.5 * s);
  c.lineTo(x - 4.5 * s, top);
  c.lineTo(x + 4.5 * s, top);
  c.lineTo(x + sw * 0.46, top + 1.5 * s);
  c.quadraticCurveTo(x + sw, top + 7 * s, x + sw, y);
  c.closePath();
  c.fill();
  // collar
  if (T.collar === 'points') {
    c.beginPath();
    c.moveTo(x - 7 * s, top + 1);
    c.lineTo(x - 5.6 * s, top - 4.5 * s);
    c.lineTo(x + 5.6 * s, top - 4.5 * s);
    c.lineTo(x + 7 * s, top + 1);
    c.closePath();
    c.fill();
  } else if (T.collar === 'shawl') {
    c.beginPath();
    c.ellipse(x, top + 1.5 * s, 10 * s, 3.4 * s, 0, Math.PI, 0);
    c.fill();
  }
  // neck
  const dir = view === 0 ? 0 : Math.sign(view);
  const fx = dir * T.stoop * s;
  c.fillRect(x - 4.4 * s + fx * 0.5, top - T.neck * s, 8.8 * s, T.neck * s + 2);
  // head
  const hcx = x + fx, hcy = top - T.neck * s - T.hy * s * 0.62 + T.stoop * 0.6 * s;
  c.save();
  c.translate(hcx, hcy);
  if (view === 0) {
    backHead(c, s, T);
  } else {
    const F = Math.sign(view);
    c.rotate(-tilt * F);
    // a three-quarter turn: the profile foreshortened (the nose half out), the back of the head still broad
    if (Math.abs(view) < 0.99) {
      c.save();
      c.scale(0.62, 1);
      profileHead(c, s, T, F);
      c.restore();
      c.beginPath();
      c.ellipse(-F * 2 * s, -1 * s, T.hx * s * 0.92, T.hy * s, 0, 0, Math.PI * 2);
      c.fill();
    } else profileHead(c, s, T, F);
  }
  c.restore();
}

function backHead(c: C, s: number, T: HeadType) {
  c.beginPath();
  c.ellipse(0, 0, T.hx * s, T.hy * s, 0, 0, Math.PI * 2);
  c.fill();
  switch (T.hair) {
    case 'crop':
    case 'wave':
      // ears either side
      for (const sx of [-1, 1]) {
        c.beginPath();
        c.ellipse(sx * T.hx * s, 1.5 * s, 2.4 * s, 3.6 * s, 0, 0, Math.PI * 2);
        c.fill();
      }
      if (T.hair === 'wave') {
        c.beginPath();
        c.ellipse(0, -T.hy * s * 0.55, T.hx * s * 1.12, T.hy * s * 0.6, 0, 0, Math.PI * 2);
        c.fill();
      }
      break;
    case 'bald':
      for (const sx of [-1, 1]) {
        c.beginPath();
        c.ellipse(sx * T.hx * s, 1.5 * s, 2.6 * s, 3.8 * s, 0, 0, Math.PI * 2);
        c.fill();
      }
      break;
    case 'bun':
      c.beginPath();
      c.arc(0, -T.hy * s * 0.15, 5.6 * s, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(0, -T.hy * s * 0.15, 7 * s, 3 * s, 0, 0, Math.PI * 2);
      c.fill();
      break;
    case 'bob':
      c.beginPath();
      c.moveTo(-T.hx * s * 1.18, -2 * s);
      c.quadraticCurveTo(-T.hx * s * 1.25, T.hy * s * 0.9, -T.hx * s * 0.7, T.hy * s * 0.95);
      c.lineTo(T.hx * s * 0.7, T.hy * s * 0.95);
      c.quadraticCurveTo(T.hx * s * 1.25, T.hy * s * 0.9, T.hx * s * 1.18, -2 * s);
      c.closePath();
      c.fill();
      break;
    case 'tied':
      c.beginPath();
      c.moveTo(-2 * s, T.hy * s * 0.6);
      c.quadraticCurveTo(0, T.hy * s * 1.5, 3 * s, T.hy * s * 1.9);
      c.lineTo(1 * s, T.hy * s * 0.6);
      c.closePath();
      c.fill();
      for (const sx of [-1, 1]) {
        c.beginPath();
        c.ellipse(sx * T.hx * s, 1.5 * s, 2.3 * s, 3.4 * s, 0, 0, Math.PI * 2);
        c.fill();
      }
      break;
  }
}

/** a clear profile (crown, brow, nose, lips, chin, jaw to the nape) with the type's hair at the back */
function profileHead(c: C, s: number, T: HeadType, F: number) {
  const kx = T.hx / 10.5, ky = T.hy / 12.5;
  const p = (dx: number, dy: number) => [F * dx * s * kx, (dy + 9) * s * ky] as const;
  c.beginPath();
  c.moveTo(...p(-6, 4));
  c.lineTo(...p(-9.5, -3));
  c.quadraticCurveTo(...p(-13.5, -15), ...p(-5, -22.5));
  c.quadraticCurveTo(...p(5, -25), ...p(9, -16));
  c.lineTo(...p(9.5, -13.5));
  c.lineTo(...p(8.6, -12.2));
  c.lineTo(...p(15.5, -6.2));
  c.lineTo(...p(10.2, -5.2));
  c.lineTo(...p(11, -3.6));
  c.lineTo(...p(9.6, -2.6));
  c.lineTo(...p(10.6, -1.4));
  c.lineTo(...p(8.6, 0.4));
  c.quadraticCurveTo(...p(11, 2.2), ...p(9, 4.2));
  c.quadraticCurveTo(...p(5, 5.4), ...p(3, 6.5));
  c.lineTo(...p(2.5, 10));
  c.lineTo(...p(-6, 10));
  c.closePath();
  c.fill();
  c.beginPath();
  switch (T.hair) {
    case 'bun':
      c.arc(...p(-12, -12), 5.4 * s, 0, Math.PI * 2);
      break;
    case 'bob':
      c.moveTo(...p(-4, -23));
      c.quadraticCurveTo(...p(-15, -18), ...p(-13, 3));
      c.lineTo(...p(-3, 4));
      c.lineTo(...p(2, -12));
      c.closePath();
      break;
    case 'wave':
      c.ellipse(F * -2 * s * kx, (-13.5 + 9) * s * ky, 11 * s * kx, 6.5 * s * ky, F * -0.25, 0, Math.PI * 2);
      break;
    case 'tied':
      c.moveTo(...p(-11, -8));
      c.quadraticCurveTo(...p(-17, -2), ...p(-15, 8));
      c.lineTo(...p(-11, -2));
      c.closePath();
      break;
    case 'crop':
      c.ellipse(F * -3 * s * kx, (-15 + 9) * s * ky, 9.4 * s * kx, 5 * s * ky, F * -0.3, 0, Math.PI * 2);
      break;
    default:
      break;
  }
  c.fill();
}

// ------------------------------------------------------------------------------------- review round 5: audience busts
export type BustVariant = 'bald' | 'parted' | 'bun' | 'greyWave';
export const BUST_VARIANTS: BustVariant[] = ['bald', 'parted', 'bun', 'greyWave'];
export interface BustOpts {
  /** 'notch' = jacket collar with a lapel notch either side; 'points' = a raised shirt collar */
  collar?: 'notch' | 'points';
  /** the warm rim colour (1 device px on the lit side); omitted = no rim */
  rim?: string;
  rimAlpha?: number;
  /** direction TOWARD the light (screen space); default upper-left */
  rimDir?: { x: number; y: number };
  /** shoulder width multiplier (body variety, about ±8 %) */
  build?: number;
}

/** the silhouette of one bust (back view), filled in `ink`; grey hair is a separate pass */
function bustShape(c: C, x: number, y: number, s: number, v: BustVariant, collar: 'notch' | 'points', build: number) {
  const sw = (v === 'bun' ? 19.5 : v === 'bald' ? 25.5 : 23) * s * build;
  const sh = v === 'bun' ? 27 : 30;
  const top = y - (sh + 8) * s;
  c.beginPath();
  c.moveTo(x - sw, y);
  c.quadraticCurveTo(x - sw, top + 7 * s, x - sw * 0.5, top + 1.5 * s);
  if (collar === 'notch') {
    // jacket: the collar stands 4 px above the shoulder line; the lapel notch is a small V where it meets it
    c.lineTo(x - 10.5 * s, top + 1 * s);
    c.lineTo(x - 8.6 * s, top + 3.6 * s);
    c.lineTo(x - 7.2 * s, top - 3.8 * s);
    c.lineTo(x + 7.2 * s, top - 3.8 * s);
    c.lineTo(x + 8.6 * s, top + 3.6 * s);
    c.lineTo(x + 10.5 * s, top + 1 * s);
  } else {
    c.lineTo(x - 7 * s, top + 1);
    c.lineTo(x - 5.6 * s, top - 4.5 * s);
    c.lineTo(x + 5.6 * s, top - 4.5 * s);
    c.lineTo(x + 7 * s, top + 1);
  }
  c.lineTo(x + sw * 0.5, top + 1.5 * s);
  c.quadraticCurveTo(x + sw, top + 7 * s, x + sw, y);
  c.closePath();
  c.fill();
  // neck
  const neck = v === 'bun' ? 12.5 : v === 'bald' ? 9 : 10.5;
  c.fillRect(x - 4.4 * s, top - neck * s - 3 * s, 8.8 * s, neck * s + 4 * s);
  const hx = (v === 'bald' ? 9.6 : 10.2) * s, hy = (v === 'bald' ? 11.6 : 12.2) * s;
  const hcy = top - neck * s - hy * 0.62;
  const ell = (cx: number, cy: number, rx: number, ry: number, rot = 0) => {
    c.beginPath();
    c.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
    c.fill();
  };
  // ears (bald and parted show them; the bun's hair covers them)
  if (v !== 'bun') for (const sx of [-1, 1]) ell(x + sx * hx, hcy + 1.5 * s, (v === 'bald' ? 2.7 : 2.3) * s, (v === 'bald' ? 3.9 : 3.4) * s);
  switch (v) {
    case 'bald':
      // a smooth dome, a touch flatter on top
      ell(x, hcy + 0.6 * s, hx, hy * 0.96);
      break;
    case 'parted':
      // the head below the hairline, then two lobes of hair meeting in a side-parting dip right of centre
      ell(x, hcy + 1.2 * s, hx, hy * 0.86);
      ell(x - 2.6 * s, hcy - 2.6 * s, hx * 0.86, hy * 0.82, -0.12);
      ell(x + 6.4 * s, hcy - 1.6 * s, hx * 0.5, hy * 0.7, 0.2);
      break;
    case 'bun':
      ell(x, hcy, hx * 0.96, hy);
      // the chignon rides high at the back of the crown: it breaks the round outline
      ell(x + 0.8 * s, hcy - hy * 0.98, 6.2 * s, 5.4 * s);
      ell(x + 0.8 * s, hcy - hy * 0.62, 4.2 * s, 2.6 * s);
      break;
    case 'greyWave':
      ell(x, hcy + 0.8 * s, hx, hy * 0.9);
      break;
  }
}

/** the grey wave: a scalloped cap of lighter hair over the crown (its own value, so the outline AND the tone differ) */
function greyWaveHair(c: C, x: number, y: number, s: number, build: number, grey: string) {
  const top = y - 38 * s;
  const hx = 10.2 * s, hy = 12.2 * s;
  const hcy = top - 10.5 * s - hy * 0.62;
  c.fillStyle = grey;
  c.beginPath();
  c.ellipse(x, hcy - 0.6 * s, hx * 1.06, hy * 0.82, 0, Math.PI, 0);
  c.closePath();
  c.fill();
  // three soft swept waves (not a wig's tight curls), lifting off the right of the crown
  for (let k = 0; k < 3; k++) {
    const a = Math.PI * (1.12 + k * 0.36);
    c.beginPath();
    c.ellipse(x + Math.cos(a) * hx * 0.98, hcy - 0.6 * s + Math.sin(a) * hy * 0.8, 5.2 * s, 3.6 * s, a + Math.PI / 2 + 0.35, 0, Math.PI * 2);
    c.fill();
  }
  void build;
}

export function audienceBust(c: C, x: number, y: number, s: number, variant: BustVariant, ink: string, o: BustOpts = {}) {
  const collar = o.collar ?? 'notch';
  const build = o.build ?? 1;
  const m = c.getTransform();
  const px = 1 / Math.max(1e-6, Math.hypot(m.a, m.b));
  if (o.rim) {
    const d = o.rimDir ?? { x: -0.8, y: -0.6 };
    const n = Math.hypot(d.x, d.y) || 1;
    c.save();
    c.globalAlpha *= o.rimAlpha ?? 0.6;
    c.fillStyle = o.rim;
    bustShape(c, x + (d.x / n) * px, y + (d.y / n) * px, s, variant, collar, build);
    if (variant === 'greyWave') greyWaveHair(c, x + (d.x / n) * px, y + (d.y / n) * px, s, build, o.rim);
    c.restore();
  }
  c.fillStyle = ink;
  bustShape(c, x, y, s, variant, collar, build);
  if (variant === 'greyWave') greyWaveHair(c, x, y, s, build, mixLab(ink, '#8f877c', 0.13));
}

