/**
 * Which shot is painting right now. The reel sets it around each shot's paint() (paint is synchronous), so kit
 * and film-set painters can apply film-wide rules that depend on the narration without every shot wiring them:
 * e.g. the candle shelf's naming rule (films/neural-net-history/sets/beliefCandle.ts) finds the words that name a
 * candle in this shot. Null outside a shot's paint.
 */
import type { ShotTiming } from '../contracts';

export interface PaintContext {
  shotId: string;
  timing: ShotTiming;
}
let current: PaintContext | null = null;
export function setPaintContext(p: PaintContext | null): void {
  current = p;
}
export function paintContext(): PaintContext | null {
  return current;
}

let baking = 0;
/** true while a static bitmap is being baked (Frame.cached): time-dependent rules must not draw into a bake */
export function isBaking(): boolean {
  return baking > 0;
}
export function bakeScope<T>(fn: () => T): T {
  baking++;
  try {
    return fn();
  } finally {
    baking--;
  }
}

/** Screen-locked draws queued by kit painters during a shot's paint (e.g. a candle's naming label, which must sit
 *  above the fog and the near layers even though its candle is drawn far back). The reel runs them right after
 *  the shot's paint(), on the shot's canvas in STAGE px (1280x720, screen-locked). */
type Overlay = (c: CanvasRenderingContext2D) => void;
let overlays: Overlay[] = [];
export function queueOverlay(fn: Overlay): void {
  overlays.push(fn);
}
export function takeOverlays(): Overlay[] {
  const o = overlays;
  overlays = [];
  return o;
}
