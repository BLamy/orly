/**
 * ch14-s02 / ch14-s04b — the right end of the study's candle shelf as it shows in the window glass (L2 plane coords).
 * CANDLE PLACEMENT: the China-race candles stand at the right end of the study's own shelf, seen only as this
 * reflection; it keeps the study's candleAmber (STUDY LOCK) while the strait beyond keeps the shot's mood.
 *
 *   SHELF_R                    plank line, scale, candle x positions, the hands' lamp-side entries (L2 px)
 *   chokeCandle / behindCandle the two 2022 candles as ReflCandle templates
 *   shelfRefl(c, env, o)       the plank's right end + the older candles (scale 2020, worry 2023) at left, dimmer
 */
import type { PaintEnv } from '../../../film/contracts';
import { beliefCandle, candleFlame } from './beliefCandle';
import { shelfStateAt, type CandleView } from './studyState';
import { shelfEnd, type ReflCandle } from './ch14-s01-strait';

type C = CanvasRenderingContext2D;

export const SHELF_R = {
  y: 532,
  s: 0.92,
  x0: 120,
  x1: 806,
  old: { scale: 268, worry: 362 },
  choke: 592,
  behind: 694,
  /** the narrator's hands enter from the lamp side, lower right of the glass */
  entry: { R: { x: 1120, y: 420 }, L: { x: 1080, y: 560 } },
} as const;

export const chokeCandle = (o: Partial<ReflCandle> = {}): ReflCandle => ({
  x: SHELF_R.choke,
  y: SHELF_R.y,
  s: SHELF_R.s,
  lines: ['COMPUTE IS', 'THE CHOKEPOINT'],
  tag: 'LIT 2022',
  rings: 0,
  state: 'live',
  seed: 22,
  ...o,
});
export const behindCandle = (o: Partial<ReflCandle> = {}): ReflCandle => ({
  x: SHELF_R.behind,
  y: SHELF_R.y,
  s: SHELF_R.s,
  lines: ['CHINA IS A YEAR', 'OR TWO BEHIND'],
  tag: 'LIT 2022',
  rings: 0,
  state: 'live',
  seed: 23,
  ...o,
});

function oldView(shot: string, id: string): CandleView {
  return { ...shelfStateAt(shot, 'start').find((v) => v.id === id)!, tag: '' };
}

/** the plank and the older candles at its left (texture: dim, unlabelled); returns their flame points. oldAlpha
 *  dims the older candles further (ch14-s02 review: half, so the two new candles own the shelf) */
export function shelfRefl(c: C, env: PaintEnv, shot: string, oldAlpha = 1): { x: number; y: number }[] {
  shelfEnd(c, env, SHELF_R.x0, SHELF_R.x1, SHELF_R.y, SHELF_R.s);
  const out: { x: number; y: number }[] = [];
  for (const [id, x] of [['scale', SHELF_R.old.scale], ['worry', SHELF_R.old.worry]] as const) {
    const v = oldView(shot, id);
    c.save();
    c.globalAlpha *= oldAlpha;
    beliefCandle(c, { x, y: SHELF_R.y, view: v, s: SHELF_R.s, letters: 0.35, seed: x }, env);
    c.restore();
    if (v.state === 'live') out.push(candleFlame({ x, y: SHELF_R.y, view: v, s: SHELF_R.s }));
  }
  return out;
}
