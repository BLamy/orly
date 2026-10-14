/**
 * ch06-s01 → ch06-s02: the ONE '▶ recording' chip that drifts out of the collage's runs tile and settles beside the
 * Replay QA lock-up on the end card. Both shots draw it in their SVG overlay from the same path (a function of
 * ch06-s02-local time), so it reads as one object across the 1 s blur dissolve (overlays crossfade at matched places).
 *
 * Also the end card's lock-up layout (ch06-s02), since the chip's landing spot depends on it.
 */
import { SvgChip, tw } from './ch04-s02-svg';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const easeInOut = (u: number) => {
  const x = clamp(u);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/** the end card lock-up: Replay mark + 'Replay QA' (Promo Sans medium 40 px), centre line at 58 % height */
export const END = { lockY: 418, markH: 56, size: 40, weight: 500, chipGap: 24, chipScale: 1.4 } as const;

/** lock-up + chip as one centred group: returns the lock-up's left x and the chip's landing centre */
export function endLayout() {
  const markW = END.markH * 0.78;
  const gap = END.markH * 0.42;
  const lockW = markW + gap + tw('Replay QA', END.size, END.weight);
  const chipW = (tw('▶ recording', 12, 600, true) + 22) * END.chipScale;
  const group = lockW + END.chipGap + chipW;
  const lockX0 = 640 - group / 2;
  return { lockX0, lockW, chip: { x: lockX0 + lockW + END.chipGap + chipW / 2, y: END.lockY } };
}

/** ch06-s01's duration (s): ch06-s01-local t = ch06-s02-local t + S01_DUR */
export const S01_DUR = 5.125;
/** where the chip leaves the runs tile: its CENTRE, parked on the first PR #3 row of ch06-s01's runs tile just right of
 *  the row's description (stage px, with the push-in and the tile's transform at the departure time; ch06-s01 parks
 *  it there from 'recording' and follows the tile, ending exactly here at T0) */
export const FROM = { x: 848, y: 44 };
/** ch06-s02-local seconds: leaves the runs tile (just after 'confirm') … lands as 'QA' is spoken */
export const T0 = -0.42;
const T1 = 0.95;
/** the chip's scale while parked on the collage (ch04-s03's 1.15) */
export const PARK_SCALE = 1.15;

/** the chip at ch06-s02-local time t2 (null before the dissolve; parked at FROM until T0, then travelling) */
export function chipAt(t2: number): { x: number; y: number; u: number; k: number } | null {
  // ch06-s01 draws the parked chip itself until T0; ch06-s02 (whose dissolve starts at t2 = -0.5) draws it parked at
  // FROM until T0 too, so the two layers agree through the crossfade
  if (t2 < -0.6) return null;
  const to = endLayout().chip;
  const p = t2 < T0 ? 0 : easeInOut((t2 - T0) / (T1 - T0));
  // a soft curve down the collage's centre gutter (between the left and right lanes), then onto the lock-up's right
  const c = { x: 640, y: 330 };
  const q = 1 - p;
  const x = q * q * FROM.x + 2 * q * p * c.x + p * p * to.x;
  const y = q * q * FROM.y + 2 * q * p * c.y + p * p * to.y;
  return { x, y, u: 1, k: PARK_SCALE + (END.chipScale - PARK_SCALE) * p };
}

/** park: ch06-s01's parked chip (riding the runs tile) used while t2 < T0 */
export function DriftChip(p: { t2: number; park?: { x: number; y: number; u: number; k?: number } | null }) {
  if (p.t2 < T0 && p.park !== undefined) {
    if (!p.park) return null;
    return <SvgChip x={p.park.x} y={p.park.y} u={p.park.u} scale={p.park.k ?? PARK_SCALE} />;
  }
  const at = chipAt(p.t2);
  if (!at) return null;
  // it grows from the collage's chip size (ch04-s03's 1.15) to the end card's as it travels
  return <SvgChip x={at.x} y={at.y} u={at.u} scale={at.k} />;
}
