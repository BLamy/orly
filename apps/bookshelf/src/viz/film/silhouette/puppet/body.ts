/**
 * Puppet anatomy (style bible §4.1–4.2): proportions by build and figure, and
 * the limb / shoe cut-outs every wardrobe dresses.
 *
 *   bodyFor(spec)                        -> Body (pivots, lengths, width factor)
 *   armArt(body, sleeve)                 -> { upper, fore } pieces + cuff cut-lines
 *   legArt(body, trousers)               -> { thigh, shin } pieces + hem/crease cut-lines
 *   shoeArt(kind)                        -> foot piece (origin = ankle pivot, sole at y = ankleH)
 *
 * Realist register: 7.5 heads, smooth tapered limbs with hinge lobes so joints
 * never gap. Figure 'f' narrows shoulders/waist and slims the limbs; builds
 * scale widths (slight .88 · average 1 · stocky 1.14 · tall .95, longer legs).
 */
import type { PuppetSpec } from '../../contracts';
import { HEAD_U, limb, smooth, curve, type Pt } from './rig';

export type Figure = 'm' | 'f';

export interface Body {
  fig: Figure;
  build: PuppetSpec['build'];
  /** width multiplier */
  W: number;
  hipY: number;
  thigh: number;
  shin: number;
  ankleH: number;
  upperArm: number;
  foreArm: number;
  head: number;
  /** torso-local (origin = hip joint) pivots */
  shoulder: [number, number];
  neckBase: [number, number];
  neckLen: number;
  /** forward offset of the neck top (head carriage) */
  neckLean: number;
  /** root-local hip pivots for the near / far leg */
  hipF: [number, number];
  hipB: [number, number];
  /** stocky belly push (units) */
  belly: number;
}

const BUILD_W: Record<PuppetSpec['build'], number> = { slight: 0.88, average: 1, stocky: 1.14, tall: 0.95 };

export function bodyFor(spec: PuppetSpec, fig: Figure): Body {
  const tall = spec.build === 'tall';
  const thigh = tall ? 74 : 72;
  const shin = tall ? 72 : 70;
  const ankleH = 8;
  const hipY = thigh + shin + ankleH;
  // everything above the hip shrinks to keep the total at UNIT_H
  const top = 300 - hipY; // hip → crown
  const head = HEAD_U * (top / 150) * (fig === 'f' ? 0.97 : 1);
  const chinY = -(top - head);
  const W = BUILD_W[spec.build] * (fig === 'f' ? 0.9 : 1);
  return {
    fig,
    build: spec.build,
    W,
    hipY,
    thigh,
    shin,
    ankleH,
    upperArm: 58 * (top / 150),
    foreArm: 47 * (top / 150),
    head,
    shoulder: [-2.5, chinY + 18],
    neckBase: [2.5, chinY + 10],
    neckLen: 18 * (top / 150),
    neckLean: fig === 'f' ? 4 : 4.5,
    hipF: [1, 0],
    hipB: [-2, 0],
    belly: spec.build === 'stocky' ? 4 : 0,
  };
}

// ---------------------------------------------------------------- limbs

export interface Cut {
  /** detail id (the ≤ 8 budget counts distinct ids) */
  id: string;
  path: Path2D;
  /** stroke width factor (1 = 1.0 stage px) or 'fill' for dots / semi-transparent cloth */
  mode?: 'stroke' | 'fill';
  alpha?: number;
  w?: number;
}

export interface LimbArt {
  pieces: Path2D[];
  cuts: Cut[];
}

export type SleeveKind = 'jacket' | 'shirt' | 'knit' | 'short' | 'rolled' | 'hoodie' | 'labcoat' | 'fleece' | 'dress';

export interface SleeveSpec {
  kind: SleeveKind;
  /** shoulder pad 0..1 (squares and lifts the cap) */
  pad?: number;
  /** show a pale shirt cuff below a jacket sleeve */
  shirtCuff?: boolean;
}

const SLEEVES: Record<SleeveKind, { u: [number, number]; f: [number, number] }> = {
  jacket: { u: [17.5, 13.5], f: [13.2, 11.4] },
  shirt: { u: [15.5, 12], f: [11.8, 9.6] },
  knit: { u: [16.5, 12.8], f: [12.4, 9.8] },
  short: { u: [12.5, 10.5], f: [9.8, 6.8] },
  rolled: { u: [15.5, 12], f: [10.4, 7] },
  hoodie: { u: [17.5, 14], f: [13.6, 10.4] },
  labcoat: { u: [18.5, 15], f: [15, 13.6] },
  fleece: { u: [18, 14.2], f: [14, 11] },
  dress: { u: [13.5, 10.5], f: [10, 7.2] },
};

export function armArt(b: Body, s: SleeveSpec, near: boolean): { upper: LimbArt; fore: LimbArt } {
  const W = b.W;
  const d = SLEEVES[s.kind];
  const pad = s.pad ?? 0;
  const U = b.upperArm;
  const F = b.foreArm;
  const upper: LimbArt = { pieces: [], cuts: [] };
  const fore: LimbArt = { pieces: [], cuts: [] };
  const uw0 = d.u[0] * W;
  const uw1 = d.u[1] * W;
  upper.pieces.push(limb(U, uw0, uw1, { front: 0.6, back: 1.2, at: 0.3, lobe: 0.56 + pad * 0.08, skew: 0.8 }));
  if (pad > 0) {
    // squared shoulder cap: a flat-topped pad over the hinge
    const r = uw0 * 0.56;
    upper.pieces.push(smooth([[-r, 2], [-r * 0.95, -r * 0.62, 0.6], [0, -r * (0.9 + pad * 0.1)], [r * 0.95, -r * 0.66, 0.6], [r, 2]]));
  }
  if (s.kind === 'short') {
    // short sleeve over a bare upper arm: a wider bell that ends at 55%
    upper.pieces.push(limb(U * 0.52, 17.5 * W, 15.5 * W, { over: 0.5, skew: 0.6 }));
    upper.cuts.push({ id: 'sleeveHem', path: curve([[-7.4 * W, U * 0.5], [0.6, U * 0.53], [7.6 * W, U * 0.5]]) });
  }
  const fw0 = d.f[0] * W;
  const fw1 = d.f[1] * W;
  fore.pieces.push(limb(F, fw0, fw1, { front: 0.4, back: 0.9, at: 0.25, skew: 0.6, over: 2 }));
  if (s.kind === 'rolled') {
    // rolled cuff bulge just below the elbow
    fore.pieces.push(limb(9, 14.5 * W, 14 * W, { over: 1 }));
    fore.cuts.push({ id: 'cuff', path: curve([[-6.6 * W, 8.5], [0, 9.6], [6.8 * W, 8.5]]) });
  }
  if (s.kind === 'hoodie' || s.kind === 'knit' || s.kind === 'fleece') {
    // gathered rib cuff
    fore.cuts.push({ id: 'cuff', path: curve([[-fw1 * 0.48 + 0.6, F - 6], [0.6, F - 5.4], [fw1 * 0.48 + 0.6, F - 6]]) });
  } else if (s.kind === 'jacket' || s.kind === 'labcoat') {
    fore.cuts.push({ id: 'cuff', path: curve([[-fw1 * 0.5 + 0.5, F - 7], [0.6, F - 6.2], [fw1 * 0.5 + 0.5, F - 7.2]]) });
    if (s.shirtCuff) {
      const cuff = new Path2D();
      cuff.rect(-fw1 * 0.38 + 0.6, F - 1, fw1 * 0.76, 3.2);
      fore.cuts.push({ id: 'shirtCuff', path: cuff, mode: 'fill', alpha: 0.26 });
    }
  } else if (s.kind === 'shirt' || s.kind === 'dress') {
    fore.cuts.push({ id: 'cuff', path: curve([[-fw1 * 0.5 + 0.5, F - 5], [0.6, F - 4.6], [fw1 * 0.5 + 0.5, F - 5]]) });
  }
  if (near) {
    // the sleeve's back seam: lets the near arm read over the torso
    upper.cuts.push({ id: 'armSeam', path: curve([[-uw0 * 0.42, 4], [-uw0 * 0.44 - 0.5, U * 0.45], [-uw1 * 0.42 + 0.6, U - 2]]), alpha: 0.3 });
    fore.cuts.push({ id: 'armSeam', path: curve([[-fw0 * 0.4 + 0.4, 3], [-fw0 * 0.42 + 0.4, F * 0.5], [-fw1 * 0.38 + 0.6, F - 8]]), alpha: 0.3 });
  }
  return { upper, fore };
}

export type TrouserKind = 'pleated' | 'straight' | 'slim' | 'flared' | 'wide' | 'jeans' | 'cargo' | 'legs' | 'tights';

const TROUSERS: Record<TrouserKind, { t: [number, number]; s: [number, number]; flare?: number; bare?: boolean }> = {
  pleated: { t: [33, 21.5], s: [21, 18.5] },
  straight: { t: [31, 19.5], s: [19.5, 16.5] },
  slim: { t: [29, 17.5], s: [17.5, 13.8] },
  flared: { t: [30, 18.5], s: [18, 18], flare: 5.2 },
  wide: { t: [31, 24], s: [24, 26], flare: 1.5 },
  jeans: { t: [29.5, 18], s: [18, 15.2] },
  cargo: { t: [32, 21.5], s: [21, 18.4] },
  legs: { t: [27, 14.6], s: [14.8, 7.2], bare: true },
  tights: { t: [27.5, 15], s: [15.2, 7.8], bare: true },
};

export function legArt(b: Body, kind: TrouserKind, near: boolean): { thigh: LimbArt; shin: LimbArt } {
  const W = b.W * (b.fig === 'f' && !TROUSERS[kind].bare ? 0.98 : 1);
  const d = TROUSERS[kind];
  const T = b.thigh;
  const S = b.shin;
  const thigh: LimbArt = { pieces: [], cuts: [] };
  const shin: LimbArt = { pieces: [], cuts: [] };
  const tw0 = d.t[0] * W;
  const tw1 = d.t[1] * W;
  thigh.pieces.push(limb(T, tw0, tw1, { front: d.bare ? 2.2 : 1.2, back: d.bare ? 0.6 : 0.4, at: 0.3, lobe: 0.5, over: 5 }));
  const sw0 = d.s[0] * W;
  const sw1 = d.s[1] * W;
  if (d.bare) {
    // calf: a soft bulge at the back, slim ankle
    shin.pieces.push(limb(S + 2, sw0, sw1, { back: 4.6 * W, front: 1.1, at: 0.27, over: 2 }));
  } else {
    // trouser leg falls to the instep (a slight break over the shoe)
    shin.pieces.push(limb(S + 3.5, sw0, sw1, { back: 0.4, front: 0.2, at: 0.3, flare: d.flare ?? 0, skew: 1.2, over: 0.5, square: true }));
    if (near) shin.cuts.push({ id: 'crease', path: curve([[0.8, 6], [1.2, S * 0.5], [1.6, S - 2]]), alpha: 0.32 });
    if (kind === 'pleated') shin.cuts.push({ id: 'trouserCuff', path: curve([[-sw1 / 2 + 0.8, S - 1.5], [1, S - 0.8], [sw1 / 2 + 1.4, S - 1.6]]) });
    if (kind === 'cargo' && near) {
      const pk = new Path2D();
      pk.rect(-6, T * 0.42, 11, 14);
      thigh.cuts.push({ id: 'cargoPocket', path: pk });
    }
  }
  return { thigh, shin };
}

export type ShoeKind = 'oxford' | 'pump' | 'sneaker' | 'loafer' | 'boot' | 'flat';

const SHOES: Record<ShoeKind, Pt[]> = {
  oxford: [
    [-5, -5], [-9, 1, 0.8], [-9.6, 7.9, 0], [-1.5, 8, 0], [2, 6.8, 0.6], [12, 8, 0], [25, 8.1, 0.4], [30, 6.4, 0.7], [28.6, 2.6, 0.8],
    [20, 0.2], [10.5, -2.6], [5, -5.5],
  ],
  loafer: [
    [-5, -5], [-9, 1, 0.8], [-9.4, 7.9, 0], [-2, 8, 0], [2, 7, 0.6], [12, 8, 0], [27, 8.1, 0.4], [32, 6.2, 0.7], [30.5, 2.8, 0.8],
    [21, 0.8], [11, -1.4], [5, -5],
  ],
  pump: [
    [-4.2, -5], [-7.4, -0.5, 0.7], [-6.8, 2.4, 0.5], [-6.6, 8.1, 0], [-4.8, 8.1, 0], [-3.6, 3.6, 0.6], [8, 5, 0.8], [17, 7.9, 0.5],
    [26, 7.4, 0.6], [29.5, 5.9, 0.4], [24, 3.6], [12, 1], [4.5, -5],
  ],
  flat: [
    [-4.5, -5], [-8, 1, 0.8], [-8.4, 8, 0], [-1, 8, 0], [2, 7.3, 0.6], [12, 8, 0], [26, 8, 0.4], [30, 6.4, 0.6], [27, 4], [14, 2.2], [4.5, -4.5],
  ],
  sneaker: [
    [-5.5, -6], [-9.8, 0, 0.7], [-10.2, 8.2, 0.2], [27, 8.3, 0.3], [31.5, 5.2, 0.8], [29, 0.4, 0.8], [18, -2.4], [9, -4.6], [5.5, -7],
  ],
  boot: [
    [-5.4, -12], [-8.8, -2], [-9.6, 8, 0], [-1, 8.2, 0], [2, 7, 0.6], [12, 8.2, 0], [27, 8.2, 0.4], [32, 6.2, 0.7], [30, 1.8, 0.8],
    [20, -0.6], [9, -4], [5.6, -12],
  ],
};

export function shoeArt(kind: ShoeKind, near: boolean): LimbArt {
  const art: LimbArt = { pieces: [smooth(SHOES[kind])], cuts: [] };
  if (kind === 'sneaker' && near) art.cuts.push({ id: 'sole', path: curve([[-9.6, 5.2], [12, 5.4], [30.8, 5]]), alpha: 0.4 });
  return art;
}

/** Contact points of a shoe (foot-local) for grounding and planted walks. */
export function shoeContacts(kind: ShoeKind): { heel: [number, number]; toe: [number, number] } {
  switch (kind) {
    case 'pump':
      return { heel: [-5.7, 8.1], toe: [26, 7.6] };
    case 'sneaker':
      return { heel: [-9, 8.3], toe: [28, 8.2] };
    default:
      return { heel: [-8, 8], toe: [26, 8.1] };
  }
}
