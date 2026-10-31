/**
 * Film registry: transitions, finish passes and fonts the reel uses. The kit
 * registers its pieces at import time; core ships 'cut', 'crossfade', 'fadeBlack'.
 *
 *   registerTransition('iris', fn)      fn: TransitionFn (out, a, b, u, env) — draw the blend, u 0→1.
 *                                       `out` is pre-scaled to stage px (draw a/b at 0,0,env.W,env.H);
 *                                       a/b are device-resolution canvases; source-over, alpha 1 on entry
 *   getTransition(kind)                 -> TransitionFn (unknown kinds fall back to crossfade, warned once)
 *   defaultTransitionDur(kind)          seconds a transition straddles the cut (when timeline gives none)
 *   setFinish(fn) / getFinish()         FinishFn over the COMPOSED scene canvas (bloom, flicker, grain …)
 *   setFinishOverlay(fn) / getFinishOverlay()
 *                                       optional FinishFn drawn on the transparent top canvas ABOVE the
 *                                       SVG overlay (screen-locked grain/vignette that should also cover plates)
 *   registerFonts('600 48px "Cormorant Garamond"', …) / fontSpecs()
 *                                       font specs the harness/studio preload before the first paint
 */
import type { FinishFn, TransitionFn, TransitionKind } from '../contracts';

const transitions = new Map<string, TransitionFn>();
const durations = new Map<string, number>();
const warned = new Set<string>();
let finish: FinishFn | null = null;
let finishOverlay: FinishFn | null = null;
const fonts = new Set<string>();

export function registerTransition(kind: TransitionKind | string, fn: TransitionFn, defaultDur?: number): void {
  transitions.set(kind, fn);
  if (defaultDur != null) durations.set(kind, defaultDur);
}

export function getTransition(kind: TransitionKind | string | undefined): TransitionFn {
  const k = kind ?? 'cut';
  const fn = transitions.get(k);
  if (fn) return fn;
  if (!warned.has(k)) {
    warned.add(k);
    console.warn(`[film] transition "${k}" not registered yet; using crossfade`);
  }
  return transitions.get('crossfade')!;
}

export function hasTransition(kind: string): boolean {
  return transitions.has(kind);
}

const DEFAULT_DUR: Record<TransitionKind, number> = {
  cut: 0,
  crossfade: 1.0,
  fadeBlack: 1.6,
  iris: 2.2,
  inkBleed: 2.0,
  paperWipe: 1.2,
  lampChange: 3.0,
  blur: 0.6,
  whip: 0.45,
};

export function defaultTransitionDur(kind: TransitionKind | string | undefined): number {
  if (!kind) return 0;
  return durations.get(kind) ?? DEFAULT_DUR[kind as TransitionKind] ?? 1.0;
}

export function setFinish(fn: FinishFn | null): void {
  finish = fn;
}
/** a film's look (timeline.json `look`, e.g. 'promo') may bring its own finish; null = no finish pass */
const lookFinish = new Map<string, { finish: FinishFn | null; overlay: FinishFn | null }>();
export function setLookFinish(look: string, fn: FinishFn | null, overlay: FinishFn | null = null): void {
  lookFinish.set(look, { finish: fn, overlay });
}
export function getFinish(look?: string): FinishFn | null {
  if (look && lookFinish.has(look)) return lookFinish.get(look)!.finish;
  return finish;
}
export function setFinishOverlay(fn: FinishFn | null): void {
  finishOverlay = fn;
}
export function getFinishOverlay(look?: string): FinishFn | null {
  if (look && lookFinish.has(look)) return lookFinish.get(look)!.overlay;
  return finishOverlay;
}

export function registerFonts(...specs: string[]): void {
  for (const s of specs) fonts.add(s);
}
export function fontSpecs(): string[] {
  return [...fonts];
}

// ---------------------------------------------------------------- built-ins
registerTransition('cut', (out, a, b, u, env) => {
  out.drawImage(u < 0.5 ? a : b, 0, 0, env.W, env.H);
});

registerTransition('crossfade', (out, a, b, u, env) => {
  const { W, H } = env;
  out.drawImage(a, 0, 0, W, H);
  // smootherstep so the dissolve has no visible start/stop
  const e = u * u * u * (u * (u * 6 - 15) + 10);
  if (e > 0) {
    out.globalAlpha = e;
    out.drawImage(b, 0, 0, W, H);
    out.globalAlpha = 1;
  }
});

/** fade down to the mood's warm near-black (never #000), then up into B */
registerTransition('fadeBlack', (out, a, b, u, env) => {
  const { W, H } = env;
  out.drawImage(u < 0.5 ? a : b, 0, 0, W, H);
  const d = u < 0.5 ? u * 2 : (1 - u) * 2;
  const e = d * d * (3 - 2 * d);
  if (e > 0) {
    out.globalAlpha = Math.min(1, e * 1.04);
    out.fillStyle = env.mood.fg;
    out.fillRect(0, 0, W, H);
    out.globalAlpha = 1;
  }
});
