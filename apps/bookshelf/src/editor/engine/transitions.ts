/**
 * Editor transitions: the film's registered TransitionFns (cut, crossfade, iris, inkBleed, paperWipe, fadeBlack,
 * lampChange; viz/film/core/registry + the silhouette kit) plus the editor's own wipeLeft, wipeRight, push and
 * dipWhite. Same contract as the film (registry.ts): fn(out, a, b, u, env) with `out` pre-scaled to stage px
 * (draw a/b at 0, 0, env.W, env.H), a/b device-res canvases, u 0 → 1 through the overlap.
 *
 *   transitionFn(kind)            → TransitionFn (editor kinds first, then the film registry)
 *   TRANSITIONS_UI                kinds with labels, default lengths and whether they need opaque layers (Explorer)
 *   alphaCrossfade                the dissolve for layers with transparency (titles, keyed stills): a true
 *                                 premultiplied lerp, where the film crossfade (A, then B at alpha e) would leave A
 *                                 un-faded under a transparent B
 *   needsOpaque(kind)             film transitions that paint the mood's black/colour (iris, fades, lamp, ink) assume
 *                                 opaque frames; with transparent layers the compositor dissolves instead
 *
 * Importing this module registers the silhouette kit (viz/film/setup), so every film kind resolves.
 */
import '../../viz/film/setup';
import type { TransitionFn } from '../../viz/film/contracts';
import { getTransition } from '../../viz/film/core/registry';
import type { TransitionKind } from '../model/types';

/** the dissolve's ease: smootherstep, as the film crossfade uses (no visible start/stop) */
const smoother = (u: number) => {
  const x = u < 0 ? 0 : u > 1 ? 1 : u;
  return x * x * x * (x * (x * 6 - 15) + 10);
};

/** premultiplied lerp A→B: A at 1−e, then B at e added ('lighter' sums premultiplied colour and alpha).
 *  Needs a transparent `out` (the compositor gives it a cleared layer buffer). */
export const alphaCrossfade: TransitionFn = (out, a, b, u, env) => {
  const e = smoother(u);
  const { W, H } = env;
  out.save();
  if (e < 1) {
    out.globalAlpha = 1 - e;
    out.drawImage(a, 0, 0, W, H);
  }
  if (e > 0) {
    out.globalCompositeOperation = 'lighter';
    out.globalAlpha = e;
    out.drawImage(b, 0, 0, W, H);
  }
  out.restore();
};

/** a hard-edged wipe with a narrow soft shadow on the moving edge (cut-paper feel, no new art) */
function wipe(dir: 1 | -1): TransitionFn {
  return (out, a, b, u, env) => {
    const { W, H } = env;
    const e = smoother(u);
    // dir 1: the edge travels left → right, B revealed from the left; −1: right → left
    const x = dir === 1 ? W * e : W * (1 - e);
    out.save();
    out.drawImage(a, 0, 0, W, H);
    out.beginPath();
    if (dir === 1) out.rect(0, 0, x, H);
    else out.rect(x, 0, W - x, H);
    out.clip();
    out.drawImage(b, 0, 0, W, H);
    out.restore();
    if (e > 0 && e < 1) {
      // shadow cast by B's edge onto A
      const w = 18;
      const g = out.createLinearGradient(x, 0, x + dir * w, 0);
      g.addColorStop(0, 'rgba(0,0,0,0.32)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      out.save();
      out.fillStyle = g;
      out.fillRect(dir === 1 ? x : x - w, 0, w, H);
      out.restore();
    }
  };
}

/** B pushes A out to the left */
const push: TransitionFn = (out, a, b, u, env) => {
  const { W, H } = env;
  const e = smoother(u);
  const dx = -W * e;
  out.drawImage(a, dx, 0, W, H);
  out.drawImage(b, dx + W, 0, W, H);
};

/** fade up to warm paper white, then down into B (the film's fadeBlack, inverted) */
const DIP_WHITE = '#f6efe0';
const dipWhite: TransitionFn = (out, a, b, u, env) => {
  const { W, H } = env;
  out.drawImage(u < 0.5 ? a : b, 0, 0, W, H);
  const d = u < 0.5 ? u * 2 : (1 - u) * 2;
  const e = d * d * (3 - 2 * d);
  if (e > 0) {
    out.save();
    out.globalAlpha = Math.min(1, e * 1.04);
    out.fillStyle = DIP_WHITE;
    out.fillRect(0, 0, W, H);
    out.restore();
  }
};

const EDITOR_TRANSITIONS: Partial<Record<TransitionKind, TransitionFn>> = {
  wipeLeft: wipe(-1),
  wipeRight: wipe(1),
  push,
  dipWhite,
};

/** the TransitionFn for a kind (editor kinds, then the film registry; unknown kinds fall back to crossfade there) */
export function transitionFn(kind: TransitionKind | undefined): TransitionFn {
  const k = kind ?? 'crossfade';
  return EDITOR_TRANSITIONS[k] ?? getTransition(k);
}

/** kinds whose look depends on painting over opaque frames (mood blacks, lamp tint, ink field, white) */
const OPAQUE_ONLY = new Set<TransitionKind>(['crossfade', 'iris', 'inkBleed', 'paperWipe', 'fadeBlack', 'lampChange', 'dipWhite']);
export function needsOpaque(kind: TransitionKind | undefined): boolean {
  return OPAQUE_ONLY.has(kind ?? 'crossfade');
}

export interface TransitionInfo {
  kind: TransitionKind;
  label: string;
  /** default overlap (s) when dropped on a cut */
  dur: number;
  /** from the film kit (vs. the editor's own) */
  film: boolean;
}

/** every transition the editor offers, in Explorer order */
export const TRANSITIONS_UI: readonly TransitionInfo[] = [
  { kind: 'crossfade', label: 'Crossfade', dur: 1.0, film: true },
  { kind: 'cut', label: 'Cut', dur: 0, film: true },
  { kind: 'fadeBlack', label: 'Dip to black', dur: 1.6, film: true },
  { kind: 'dipWhite', label: 'Dip to white', dur: 1.2, film: false },
  { kind: 'iris', label: 'Iris', dur: 2.2, film: true },
  { kind: 'inkBleed', label: 'Ink bleed', dur: 2.0, film: true },
  { kind: 'paperWipe', label: 'Paper wipe', dur: 1.1, film: true },
  { kind: 'lampChange', label: 'Lamp change', dur: 3.0, film: true },
  { kind: 'wipeLeft', label: 'Wipe left', dur: 0.8, film: false },
  { kind: 'wipeRight', label: 'Wipe right', dur: 0.8, film: false },
  { kind: 'push', label: 'Push', dur: 0.8, film: false },
];
