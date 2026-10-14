/**
 * neural-net-history — THE CASE STAMP: the film's place / date stamp, one device everywhere it appears.
 *
 * Special Elite, typed on the twos at 16 cps, each key struck a little differently (seeded, static), on a
 * feathered ink plate. Set inside title-safe (x 64 on the 1280 stage, 5%; baseline y 604, above the bottom 12%
 * caption band) at 24 px, filled with the warm
 * paper white #efe3cf at full strength so the finish pass's corner vignette and grain do not grey it.
 * Draw it LAST in paint() (after every layer, fog and practical), so no haze sits over it.
 *
 *   caseStamp(c, 'CHICAGO · 1940s', { t, at, A, mood })     A = the caller's envelope (0..1)
 *
 * The script's own case is kept (the decade's "s", "c. 1941"), which the kit's placeStamp would upper-case.
 * ch02-s01's 'CHICAGO · c. 1941' should use this same helper so the two stamps read as one device.
 */
import { FONT, hash1, softPlate } from '../../../film';
import type { Palette } from '../../../film';

/** baseline at y 604 (0.84H) and a plate that stays above 0.88H (y 634): the bottom 12% of the frame is the
 *  caption band and stays clear (review round 1) */
export const STAMP = { x: 64, y: 604, size: 24, cps: 16, fill: '#efe3cf' } as const;

export interface CaseStampOpts {
  /** shot-local time */
  t: number;
  /** when the first key strikes */
  at: number;
  /** overall envelope 0..1 (fade in / out is the caller's) */
  A: number;
  mood: Palette;
  /** seed for the per-key jitter (default 1940) */
  seed?: number;
}

export function caseStamp(c: CanvasRenderingContext2D, text: string, o: CaseStampOpts) {
  const { t, at, A } = o;
  if (t < at || A <= 0) return;
  const seed = o.seed ?? 1940;
  const { x, y, size, cps } = STAMP;
  const tq = Math.floor(t * 12 + 1e-9) / 12;
  const shown = Math.max(0, Math.min(text.length, Math.floor((tq - at) * cps + 1e-6) + 1));
  c.save();
  c.font = `400 ${size}px ${FONT.typewriter}`;
  c.letterSpacing = '0px';
  const adv = c.measureText('M').width * 1.02;
  const total = adv * text.length;
  c.globalAlpha = A;
  c.globalCompositeOperation = 'source-over';
  // plate: centre y − 0.35·size, height size + 50, so it spans ≈ y − 45 … y + 25 (bottom edge ≤ 0.88H)
  softPlate(c, x + total / 2, y - size * 0.35, total + 170, size + 50, o.mood.ink, 0.7);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  for (let i = 0; i < shown; i++) {
    const ch = text[i];
    if (ch === ' ') continue;
    const ink = 0.9 + 0.1 * (0.5 + 0.5 * hash1(i, seed + 41));
    const dy = hash1(i, seed + 42) * 0.6;
    const rot = hash1(i, seed + 43) * 0.0125;
    c.save();
    c.translate(x + i * adv + adv / 2, y + dy);
    c.rotate(rot);
    c.globalAlpha = A * ink;
    c.fillStyle = STAMP.fill;
    c.fillText(ch, 0, 0);
    // the fresh strike is a touch heavier
    if (i === shown - 1 && shown < text.length) {
      c.globalAlpha = A * 0.35;
      c.fillText(ch, 0.4, 0);
    }
    c.restore();
  }
  c.restore();
}
