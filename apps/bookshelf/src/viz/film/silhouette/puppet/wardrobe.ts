/**
 * Era wardrobe (style bible §4.3) as silhouette-relevant cut-outs: the torso
 * garment outline, the hanging lower garment (skirts, lab-coat / overcoat
 * skirts) that drapes over the thighs, collars, ties, hoods, drawstrings and
 * lanyards, and the cut-line details (≤ 8 per figure, §2.6).
 *
 *   WARDROBES[name]           -> WardrobeDef (figure default, sleeves, trousers, shoes, details)
 *   wardrobeFor(name)         -> WardrobeDef (unknown names fall back to 'suit')
 *   torsoArt(body, w, facing) -> { pieces, cuts }   torso-local (origin = hip joint)
 *   lowerArt(body, w, a)      -> Path2D | undefined  per frame; a = effective thigh/torso angles
 *   neckArt(body, w)          -> { pieces, cuts }   neck-local (origin = neck base)
 *   hangers(body, w)          -> tie / strings / lanyard secondary parts (pivot + pieces)
 *
 * Names: doubleBreasted · suit · threePiece · overcoat · labCoat · shortSleeve ·
 * cardigan · turtleneck · slimSuit · sweaterVest · rolledSleeves · blazer ·
 * polo · fleece · hoodie · tshirt · quarterZip · gilet · skirtSuit · dress ·
 * cardiganDress · shiftDress · blouseTrousers · powerSuit · trouserSuit · fleeceF.
 */
import type { Facing } from '../../contracts';
import type { Body, Cut, Figure, ShoeKind, SleeveSpec, TrouserKind } from './body';
import { curve, ellipsePath, lerp, smooth, type Pt, DEG } from './rig';

export type TopKind =
  | 'tailored' | 'doubleBreasted' | 'labcoat' | 'overcoat' | 'cardigan' | 'turtleneck' | 'vest' | 'shirt'
  | 'hoodie' | 'fleece' | 'quarterZip' | 'tshirt' | 'gilet' | 'bodice' | 'blouse' | 'peplum';

export interface LowerDef {
  /** where the lower garment starts (fraction of hip→neck height above the hip) */
  waist: number;
  /** hem, units below the hip joint (knee ≈ 72) */
  hem: number;
  /** extra half-width at the hem (A-line / full skirt) */
  flare: number;
  /** open-front coat (lab coat, overcoat) vs closed skirt */
  coat?: boolean;
}

export interface WardrobeDef {
  fig: Figure;
  top: TopKind;
  /** torso garment hem, units below the hip joint */
  hem: number;
  sleeve: SleeveSpec;
  trousers: TrouserKind;
  shoes: ShoeKind;
  lower?: LowerDef;
  collar: 'notch' | 'shirt' | 'turtle' | 'hood' | 'zip' | 'crew' | 'vneck' | 'peter' | 'open' | 'mock';
  tie?: 'wide' | 'narrow' | 'loose';
  lanyard?: boolean;
  strings?: boolean;
  /** shoulder pad 0..1, waist suppression 0..1, chest fullness (units), bulk (fraction) */
  pad: number;
  waist: number;
  chest: number;
  bulk: number;
  /** cut-line details, priority order (see DETAILS in this file) */
  details: string[];
}

const T = (o: Partial<WardrobeDef> & Pick<WardrobeDef, 'top' | 'sleeve' | 'trousers' | 'shoes' | 'collar' | 'details'>): WardrobeDef => ({
  fig: 'm',
  hem: 16,
  pad: 0,
  waist: 0.3,
  chest: 0,
  bulk: 0,
  ...o,
});

export const WARDROBES: Record<string, WardrobeDef> = {
  doubleBreasted: T({ top: 'doubleBreasted', hem: 18, pad: 0.9, waist: 0.2, chest: 1.5, sleeve: { kind: 'jacket', pad: 0.9, shirtCuff: true }, trousers: 'pleated', shoes: 'oxford', collar: 'notch', details: ['lapel', 'buttons', 'pocketFlap', 'breastPocket', 'shirtCuff', 'trouserCuff', 'cuff'] }),
  suit: T({ top: 'tailored', hem: 16, pad: 0.5, sleeve: { kind: 'jacket', pad: 0.5, shirtCuff: true }, trousers: 'straight', shoes: 'oxford', collar: 'notch', details: ['lapel', 'buttons', 'pocketFlap', 'breastPocket', 'shirtCuff', 'cuff'] }),
  threePiece: T({ top: 'tailored', hem: 16, pad: 0.6, chest: 1, sleeve: { kind: 'jacket', pad: 0.6, shirtCuff: true }, trousers: 'pleated', shoes: 'oxford', collar: 'notch', details: ['lapel', 'waistcoat', 'watchChain', 'buttons', 'pocketFlap', 'shirtCuff', 'trouserCuff'] }),
  overcoat: T({ top: 'overcoat', hem: 16, pad: 0.8, chest: 2, bulk: 0.06, sleeve: { kind: 'labcoat', pad: 0.8 }, trousers: 'pleated', shoes: 'oxford', collar: 'notch', lower: { waist: 0.36, hem: 86, flare: 6, coat: true }, details: ['lapel', 'buttons', 'beltLine', 'coatPocket', 'cuff'] }),
  labCoat: T({ top: 'labcoat', hem: 16, pad: 0.2, chest: 0.5, bulk: 0.04, sleeve: { kind: 'labcoat' }, trousers: 'straight', shoes: 'oxford', collar: 'notch', tie: 'narrow', lower: { waist: 0.36, hem: 92, flare: 5, coat: true }, details: ['lapel', 'penPocket', 'buttons', 'coatPocket', 'cuff', 'hemLine'] }),
  shortSleeve: T({ top: 'shirt', hem: 2, waist: 0.2, sleeve: { kind: 'short' }, trousers: 'straight', shoes: 'oxford', collar: 'shirt', tie: 'narrow', details: ['placket', 'shirtPocket', 'belt', 'sleeveHem', 'crease'] }),
  cardigan: T({ top: 'cardigan', hem: 8, waist: 0.1, bulk: 0.03, sleeve: { kind: 'knit' }, trousers: 'straight', shoes: 'oxford', collar: 'vneck', tie: 'narrow', details: ['buttons', 'vneck', 'rib', 'knitPocket', 'cuff'] }),
  turtleneck: T({ top: 'turtleneck', hem: 4, waist: 0.15, sleeve: { kind: 'knit' }, trousers: 'slim', shoes: 'loafer', collar: 'turtle', details: ['turtleFold', 'rib', 'cuff', 'belt', 'crease'] }),
  slimSuit: T({ top: 'tailored', hem: 13, pad: 0.15, waist: 0.45, sleeve: { kind: 'jacket', shirtCuff: true }, trousers: 'slim', shoes: 'loafer', collar: 'notch', tie: 'narrow', details: ['lapel', 'buttons', 'pocketFlap', 'shirtCuff'] }),
  sweaterVest: T({ top: 'vest', hem: 4, waist: 0.1, sleeve: { kind: 'shirt' }, trousers: 'flared', shoes: 'boot', collar: 'shirt', tie: 'wide', details: ['vneck', 'rib', 'cuff', 'belt', 'crease'] }),
  rolledSleeves: T({ top: 'shirt', hem: 2, waist: 0.1, sleeve: { kind: 'rolled' }, trousers: 'pleated', shoes: 'oxford', collar: 'shirt', tie: 'loose', details: ['placket', 'cuff', 'belt', 'shirtPocket', 'crease'] }),
  blazer: T({ top: 'tailored', hem: 19, pad: 0.7, bulk: 0.05, waist: 0.05, sleeve: { kind: 'jacket', pad: 0.7 }, trousers: 'pleated', shoes: 'loafer', collar: 'notch', details: ['lapel', 'buttons', 'pocketFlap', 'breastPocket', 'cuff'] }),
  polo: T({ top: 'shirt', hem: 4, waist: 0, bulk: 0.02, sleeve: { kind: 'short' }, trousers: 'pleated', shoes: 'loafer', collar: 'shirt', details: ['placket', 'belt', 'sleeveHem', 'crease'] }),
  fleece: T({ top: 'fleece', hem: 9, waist: 0, bulk: 0.08, chest: 1, sleeve: { kind: 'fleece' }, trousers: 'cargo', shoes: 'sneaker', collar: 'zip', lanyard: true, details: ['zip', 'chestZip', 'rib', 'cuff', 'cargoPocket', 'sole'] }),
  hoodie: T({ top: 'hoodie', hem: 9, waist: 0, bulk: 0.07, sleeve: { kind: 'hoodie' }, trousers: 'jeans', shoes: 'sneaker', collar: 'hood', strings: true, details: ['strings', 'hoodEdge', 'kangaroo', 'rib', 'cuff', 'sole'] }),
  tshirt: T({ top: 'tshirt', hem: 5, waist: 0, sleeve: { kind: 'short' }, trousers: 'jeans', shoes: 'sneaker', collar: 'crew', details: ['crewNeck', 'sleeveHem', 'sole'] }),
  quarterZip: T({ top: 'quarterZip', hem: 6, waist: 0.15, sleeve: { kind: 'knit' }, trousers: 'slim', shoes: 'sneaker', collar: 'mock', lanyard: true, details: ['zip', 'rib', 'cuff', 'sole'] }),
  gilet: T({ top: 'gilet', hem: 7, waist: 0.1, bulk: 0.08, sleeve: { kind: 'shirt' }, trousers: 'slim', shoes: 'sneaker', collar: 'mock', details: ['zip', 'quilting', 'cuff', 'sole'] }),
  // ---- women
  skirtSuit: T({ fig: 'f', top: 'peplum', hem: 10, pad: 1, waist: 0.8, chest: 0.5, sleeve: { kind: 'jacket', pad: 1 }, trousers: 'legs', shoes: 'pump', collar: 'notch', lower: { waist: 0.36, hem: 66, flare: 4 }, details: ['lapel', 'buttons', 'waistSeam', 'pocketFlap', 'cuff', 'hemLine'] }),
  dress: T({ fig: 'f', top: 'bodice', hem: -30, waist: 0.9, sleeve: { kind: 'dress' }, trousers: 'legs', shoes: 'pump', collar: 'peter', lower: { waist: 0.36, hem: 64, flare: 22 }, details: ['collar', 'buttons', 'waistSeam', 'hemLine', 'cuff'] }),
  cardiganDress: T({ fig: 'f', top: 'cardigan', hem: -24, waist: 0.9, bulk: 0.02, sleeve: { kind: 'knit' }, trousers: 'legs', shoes: 'pump', collar: 'vneck', lower: { waist: 0.36, hem: 64, flare: 20 }, details: ['buttons', 'vneck', 'waistSeam', 'cuff', 'hemLine'] }),
  shiftDress: T({ fig: 'f', top: 'bodice', hem: -20, waist: 0.15, sleeve: { kind: 'dress' }, trousers: 'legs', shoes: 'flat', collar: 'crew', lower: { waist: 0.42, hem: 52, flare: 2 }, details: ['crewNeck', 'hemLine', 'dartLine'] }),
  blouseTrousers: T({ fig: 'f', top: 'blouse', hem: 2, waist: 0.6, sleeve: { kind: 'shirt' }, trousers: 'wide', shoes: 'flat', collar: 'open', details: ['placket', 'cuff', 'belt'] }),
  powerSuit: T({ fig: 'f', top: 'tailored', hem: 16, pad: 1, waist: 0.4, chest: 0.5, sleeve: { kind: 'jacket', pad: 1 }, trousers: 'legs', shoes: 'pump', collar: 'notch', lower: { waist: 0.3, hem: 60, flare: 1 }, details: ['lapel', 'buttons', 'pocketFlap', 'cuff', 'hemLine'] }),
  trouserSuit: T({ fig: 'f', top: 'tailored', hem: 17, pad: 0.6, waist: 0.4, bulk: 0.03, sleeve: { kind: 'jacket', pad: 0.6 }, trousers: 'straight', shoes: 'flat', collar: 'notch', details: ['lapel', 'buttons', 'pocketFlap', 'cuff', 'crease'] }),
  fleeceF: T({ fig: 'f', top: 'fleece', hem: 8, waist: 0.1, bulk: 0.06, sleeve: { kind: 'fleece' }, trousers: 'jeans', shoes: 'sneaker', collar: 'zip', lanyard: true, details: ['zip', 'chestZip', 'rib', 'cuff', 'sole'] }),
};
WARDROBES.labcoat = WARDROBES.labCoat;
WARDROBES.cardiganF = { ...WARDROBES.cardigan, fig: 'f', tie: undefined, trousers: 'slim', shoes: 'flat', waist: 0.5 };
WARDROBES.hoodieF = { ...WARDROBES.hoodie, fig: 'f' };
WARDROBES.quarterZipF = { ...WARDROBES.quarterZip, fig: 'f' };
WARDROBES.turtleneckF = { ...WARDROBES.turtleneck, fig: 'f', waist: 0.5 };
WARDROBES.labCoatF = { ...WARDROBES.labCoat, fig: 'f', tie: undefined, collar: 'notch', trousers: 'slim', shoes: 'flat' };

export function wardrobeFor(name: string): WardrobeDef {
  return WARDROBES[name] ?? WARDROBES.suit;
}

// ---------------------------------------------------------------- torso
interface Land {
  y: (f: number) => number;
  W: number;
  fem: boolean;
  /** approx front x at fraction f (for placing details) */
  fx: (f: number) => number;
}

function land(b: Body, w: WardrobeDef): Land {
  const H = -b.neckBase[1];
  const W = b.W * (1 + w.bulk);
  const fem = b.fig === 'f';
  const y = (f: number) => -f * H;
  const fx = (f: number) => {
    const chest = (fem ? 18.6 : 19.2) * W * 0.94 + w.chest;
    const waist = waistX(b, w, W * 0.94).f;
    if (f >= 0.7) return lerp(chest, 16 * W, (f - 0.7) / 0.2);
    if (f >= 0.38) return lerp(waist, chest, (f - 0.38) / 0.32);
    return lerp(17 * W + b.belly, waist, f / 0.38);
  };
  return { y, W, fem, fx };
}

/** front / back x of the natural waist (shared by torso and lower garment so they always meet) */
function waistX(b: Body, w: WardrobeDef, W: number): { f: number; b: number } {
  const fem = b.fig === 'f';
  return {
    f: (fem ? 13.6 : 16.8) * W + b.belly * 0.7 - w.waist * (fem ? 1.6 : 1.0),
    b: -(fem ? 13 : 15.4) * W + w.waist * 1.6,
  };
}

export interface PartArt {
  pieces: Path2D[];
  cuts: Cut[];
  /** semi-transparent cloth (shirt collar, lace) */
  lights?: { path: Path2D; alpha: number; id: string }[];
}

/** Torso garment + pelvis (torso-local, origin = hip joint, up = −y). */
export function torsoArt(b: Body, w: WardrobeDef, facing: Facing): PartArt {
  const L = land(b, w);
  const { y, fem } = L;
  const W = L.W * 0.94;
  const pad = w.pad;
  const knit = ['cardigan', 'turtleneck', 'vest', 'shirt', 'tshirt', 'quarterZip', 'blouse', 'gilet'].includes(w.top);
  const bulky = w.top === 'hoodie' || w.top === 'fleece';
  const hem = w.hem;
  const chestX = (fem ? 19.8 : 19.2) * W + w.chest;
  const { f: waistF, b: waistB } = waistX(b, w, W);
  const seatB = -(fem ? 21.5 : 19.4) * W;
  // back: neck → sloped trapezius → shoulder point → convex shoulder blades →
  // concave small of the back → seat (the S-curve every figure stands on)
  const pts: Pt[] = [
    [-4.5, y(1.06)],
    [-10.5 * W, y(0.985) - pad * 0.8, 0.9],
    [-15.6 * W - pad * 0.6, y(0.925) - pad * 0.8, 0.9],
    [-18.3 * W - pad * 0.5, y(0.8)],
    [-17.2 * W, y(0.63)],
    [waistB, y(0.38)],
  ];
  if (hem > 4) {
    // jacket / coat / knit falling over the seat
    pts.push([seatB - (knit ? 0 : 0.5), y(0.1)]);
    pts.push([seatB + (bulky ? 0.5 : 1.2), hem - 2, 0.6]);
    pts.push([seatB + (bulky ? 2 : 2.5), hem, 0]);
    const frontHem = w.top === 'tailored' || w.top === 'doubleBreasted' || w.top === 'peplum' ? 14 * W : 15.5 * W;
    pts.push([frontHem, hem, w.top === 'tailored' || w.top === 'peplum' ? 0.4 : 0]);
    pts.push([17 * W + b.belly, Math.min(hem - 6, y(0.02)), 0.8]);
  } else if (hem > -10) {
    // shirt/knit to the hip; the trouser seat continues the outline to the crotch
    pts.push([seatB - 0.2, y(0.08)]);
    pts.push([seatB + 2.4, 9.5, 0.8]);
    pts.push([-11 * W, 16.5, 0.6]);
    pts.push([5, 16.5, 0.7]);
    pts.push([14.5 * W, 9]);
    pts.push([17.2 * W + b.belly, y(0.08)]);
  } else {
    // bodice: stops at the natural waist (the skirt covers the hips)
    pts.push([waistB - 0.5, hem, 0.4]);
    pts.push([waistF + 0.5, hem, 0.4]);
  }
  pts.push([waistF, y(0.38)]);
  pts.push([chestX, y(fem ? 0.64 : 0.7)]);
  if (fem) pts.push([chestX - 2.2 * W, y(0.75), 0.8]);
  pts.push([(fem ? 14.6 : 16.8) * W + w.chest * 0.5, y(0.87)]);
  pts.push([10.5, y(0.975), 0.6]);
  pts.push([2, y(1.07)]);
  const pieces: Path2D[] = [smooth(pts)];
  if (w.top === 'peplum') {
    // nipped waist with a small flared peplum over the hips
    pieces.push(smooth([[waistB, y(0.36)], [waistB - 7, hem + 2, 0.4], [waistF + 6, hem + 1, 0.4], [waistF, y(0.36)]]));
  }
  if (w.collar === 'hood') {
    pieces.push(smooth([[-5, y(1.0)], [-8, y(1.11)], [-14, y(1.16), 0.8], [-20.5 * W, y(1.11), 0.8], [-23.5 * W, y(1.0)], [-22.5 * W, y(0.9)], [-18 * W, y(0.84)]]));
  }

  const cuts: Cut[] = [];
  const lights: PartArt['lights'] = [];
  const st = (id: string, p: Pt[], alpha = 0.48, wd?: number) => cuts.push({ id, path: curve(p), alpha, w: wd });
  const dots = (id: string, xs: [number, number][], r = 1.3) => {
    const p = new Path2D();
    for (const [x, yy] of xs) ellipsePath(x, yy, r, r, 0, p);
    cuts.push({ id, path: p, mode: 'fill', alpha: 0.5 });
  };
  const nearLeft = facing === 'right'; // facing right shows the person's LEFT side
  const fx = L.fx;
  const ribY = hem > 4 ? hem - 5 : hem - 4;
  for (const d of w.details) {
    switch (d) {
      case 'lapel': {
        const top = w.top === 'doubleBreasted' ? 0.47 : 0.52;
        st('lapel', [[8, y(0.99)], [13 * W, y(0.86)], [fx(0.68) - 4, y(0.68)], [fx(top) - 1.5, y(top)]]);
        break;
      }
      case 'buttons': {
        if (w.top === 'doubleBreasted') dots('buttons', [[fx(0.44) - 4.5, y(0.44)], [fx(0.33) - 4.5, y(0.33)], [fx(0.22) - 4.5, y(0.22)]], 1.35);
        else if (w.top === 'cardigan') dots('buttons', [0.74, 0.62, 0.5, 0.38, 0.26].map((f) => [fx(f) - 2.2, y(f)] as [number, number]), 1);
        else if (w.top === 'labcoat' || w.top === 'overcoat') dots('buttons', [0.5, 0.36, 0.22].map((f) => [fx(f) - 2.2, y(f)] as [number, number]), 1.3);
        else if (w.top === 'bodice') dots('buttons', [0.86, 0.76, 0.66, 0.56, 0.46].map((f) => [fx(f) - 2.4, y(f)] as [number, number]), 0.95);
        else dots('buttons', [0.46, 0.33].map((f) => [fx(f) - 2.2, y(f)] as [number, number]), 1.25);
        break;
      }
      case 'pocketFlap':
        if (hem > 8) st('pocketFlap', [[-2 * W, y(0.12)], [6 * W, y(0.125)], [12 * W, y(0.11)]], 0.44);
        break;
      case 'breastPocket':
        if (nearLeft) st('breastPocket', [[2 * W, y(0.73)], [9 * W, y(0.735)]], 0.44);
        break;
      case 'penPocket':
        if (nearLeft) {
          st('penPocket', [[1 * W, y(0.72)], [9.5 * W, y(0.725)]], 0.46);
          const pen = new Path2D();
          pen.rect(5 * W, y(0.79), 1.3, y(0.72) - y(0.79));
          cuts.push({ id: 'penPocket', path: pen, mode: 'fill', alpha: 0.42 });
        } else st('penPocket', [[1 * W, y(0.72)], [9.5 * W, y(0.725)]], 0.3);
        break;
      case 'waistcoat':
        st('waistcoat', [[fx(0.6) - 5, y(0.62)], [fx(0.46) - 3.5, y(0.44)], [fx(0.3) - 2.2, y(0.28)]], 0.36);
        break;
      case 'watchChain':
        if (nearLeft) st('watchChain', [[fx(0.4) - 3, y(0.4)], [4, y(0.33)], [-3 * W, y(0.37)]], 0.5, 0.9);
        break;
      case 'beltLine':
        st('beltLine', [[-18 * W, y(0.38)], [0, y(0.39)], [waistF - 0.5, y(0.38)]], 0.36);
        break;
      case 'waistSeam':
        st('waistSeam', [[waistB + 0.8, y(0.37)], [0, y(0.38)], [waistF - 0.8, y(0.37)]], 0.44);
        break;
      case 'vneck':
        st('vneck', [[8, y(0.99)], [fx(0.8) - 3, y(0.82)], [fx(0.64) - 2.5, y(0.62)]], 0.5);
        break;
      case 'crewNeck':
        st('crewNeck', [[-6, y(1.0)], [2, y(0.97)], [9, y(0.985)]], 0.44);
        break;
      case 'turtleFold':
        break; // drawn on the neck
      case 'rib':
        if (hem > -10) st('rib', [[seatB + 2.2, ribY], [0, ribY + 0.5], [16 * W + b.belly, ribY]], 0.4);
        break;
      case 'knitPocket':
        if (hem > 4) st('knitPocket', [[2, y(0.13)], [12 * W, y(0.12)]], 0.36);
        break;
      case 'placket':
        st('placket', [[fx(0.92) - 3, y(0.94)], [fx(0.7) - 2.5, y(0.68)], [fx(0.4) - 2, y(0.4)], [fx(0.12) - 1.5, y(0.1)]], 0.34);
        break;
      case 'shirtPocket':
        if (nearLeft) st('shirtPocket', [[3 * W, y(0.74)], [3 * W, y(0.64)], [10 * W, y(0.64)]], 0.38);
        break;
      case 'belt':
        if (!w.lower && hem <= 4) st('belt', [[waistB + 0.5, y(0.24)], [0, y(0.25)], [16.8 * W + b.belly, y(0.24)]], 0.48, 1.2);
        break;
      case 'zip':
        if (w.top === 'quarterZip') st('zip', [[9, y(1.0)], [fx(0.86) - 1.2, y(0.86)], [fx(0.76) - 1.4, y(0.76)]], 0.46);
        else st('zip', [[9, y(1.0)], [fx(0.8) - 1.2, y(0.8)], [fx(0.5) - 1.2, y(0.5)], [fx(0.1) - 1.2, hem > 4 ? hem - 1 : y(0.05)]], 0.46);
        break;
      case 'chestZip':
        if (nearLeft) st('chestZip', [[0, y(0.78)], [8 * W, y(0.7)]], 0.42);
        break;
      case 'kangaroo':
        st('kangaroo', [[-2 * W, y(0.06)], [5 * W, y(0.26)], [fx(0.26) - 1, y(0.27)]], 0.42);
        break;
      case 'hoodEdge':
        st('hoodEdge', [[-6, y(1.03)], [-12, y(1.1)], [-19 * W, y(1.06)], [-21 * W, y(0.97)]], 0.4);
        break;
      case 'quilting':
        for (const f of [0.78, 0.6, 0.42, 0.24]) st('quilting', [[-19 * W, y(f) + 1], [0, y(f)], [fx(f) - 0.5, y(f) + 1]], 0.3);
        break;
      case 'collar':
        if (w.collar === 'peter') {
          const p = smooth([[-4, y(1.0)], [9, y(0.985)], [13 * W, y(0.92), 0.7], [7, y(0.9)], [-2, y(0.93)]]);
          lights.push({ path: p, alpha: 0.3, id: 'collar' });
        }
        break;
      case 'dartLine':
        st('dartLine', [[6, y(0.66)], [7, y(0.42)]], 0.3);
        break;
    }
  }
  if (w.collar === 'shirt' || w.top === 'tailored' || w.top === 'doubleBreasted' || w.top === 'labcoat') {
    // pale shirt collar at the throat (semi-transparent cloth, §2.6)
    lights.push({ path: smooth([[3, y(1.04)], [9.5, y(1.0)], [12.5 * W, y(0.93), 0.6], [8, y(0.95)], [2, y(0.98)]]), alpha: 0.24, id: 'shirtCollar' });
  }
  if (w.collar === 'open') {
    lights.push({ path: smooth([[2, y(1.03)], [10, y(0.97)], [14 * W, y(0.84), 0.5], [9, y(0.9)]]), alpha: 0.24, id: 'shirtCollar' });
  }
  return { pieces, cuts, lights };
}

/** Neck (origin = neck base on the torso, up = −y). */
export function neckArt(b: Body, w: WardrobeDef): PartArt {
  const nw = (b.fig === 'f' ? 15 : 18.5) * b.W ** 0.5;
  const L = b.neckLen;
  const lx = b.neckLean;
  const pieces: Path2D[] = [];
  const cuts: Cut[] = [];
  pieces.push(smooth([[-nw / 2 - 4, 5], [-nw / 2 - 1.2, -L * 0.12, 0.8], [-nw / 2 + lx * 0.45, -L * 0.5], [-nw / 2 + lx + 1.5, -L - 3], [nw / 2 + lx - 1, -L - 3], [nw / 2 + lx * 0.5, -L * 0.45], [nw / 2 + 1, 4]]));
  if (w.collar === 'turtle' || w.collar === 'mock' || w.collar === 'zip') {
    const h = w.collar === 'turtle' ? L * 0.72 : L * 0.42;
    const tw = nw + (w.collar === 'turtle' ? 2.6 : 1.8);
    pieces.push(smooth([[-tw / 2 - 0.5, 5], [-tw / 2 + lx * 0.35, -h, 0.5], [tw / 2 + lx * 0.6, -h - 0.6, 0.5], [tw / 2 + 1.2, 5]]));
    if (w.collar === 'turtle') cuts.push({ id: 'turtleFold', path: curve([[-tw / 2 + 1, -h * 0.55], [1, -h * 0.5], [tw / 2 + 1.4, -h * 0.58]]), alpha: 0.44 });
  }
  return { pieces, cuts };
}

// ---------------------------------------------------------------- lower garment
export interface LowerAngles {
  torso: number;
  hipF: number;
  hipB: number;
}

/**
 * The hanging lower garment, rebuilt per frame: front edge rides the more
 * forward thigh, back edge the more backward one (gravity otherwise), so a
 * skirt drapes over sitting knees and a lab-coat hem parts as the legs stride.
 */
export function lowerArt(b: Body, w: WardrobeDef, a: LowerAngles): Path2D | undefined {
  const lw = w.lower;
  if (!lw) return undefined;
  const H = -b.neckBase[1];
  const W = b.W * (1 + w.bulk) * 0.94;
  const fem = b.fig === 'f';
  const tr = a.torso * DEG;
  const rot = (x: number, y: number): [number, number] => [x * Math.cos(tr) - y * Math.sin(tr), x * Math.sin(tr) + y * Math.cos(tr)];
  const wy = -lw.waist * H;
  const wx = waistX(b, w, W);
  const waistB = rot(wx.b, wy);
  const waistF = rot(wx.f, wy);
  const cw = lw.coat ? 2.2 : 0;
  const hipB = rot(-(fem ? 22 : 20.5) * W - cw, -2);
  const hipF = rot((fem ? 16.5 : 17.5) * W + b.belly + cw, -4);
  const fA = Math.max(a.hipF, a.hipB, -10) * DEG;
  const bA = Math.min(a.hipF, a.hipB, 6) * DEG;
  const hemL = lw.hem;
  const fl = lw.flare;
  const thighHalf = 15 * W;
  // front hem: along the forward thigh, offset to its front, plus flare (reduced as the thigh lifts)
  const lift = Math.max(0, Math.sin(fA));
  const fd: [number, number] = [Math.sin(fA), Math.cos(fA)];
  const fn: [number, number] = [Math.cos(fA), -Math.sin(fA)];
  const reachF = Math.max(hemL, 30) * (1 - 0.12 * lift);
  const frontOff = thighHalf + 2 + fl * (1 - 0.7 * lift);
  const hemF: [number, number] = [fd[0] * reachF + fn[0] * frontOff, fd[1] * reachF + fn[1] * frontOff];
  const bd: [number, number] = [Math.sin(bA), Math.cos(bA)];
  const bn: [number, number] = [-Math.cos(bA), Math.sin(bA)];
  const backOff = thighHalf + 4 + fl * (1 - 0.5 * lift);
  const hemB: [number, number] = [bd[0] * hemL + bn[0] * backOff, bd[1] * hemL + bn[1] * backOff];
  if (lift > 0.5) {
    // seated: the back of the skirt folds onto the seat behind the knees
    hemB[0] = Math.min(hemB[0], hipB[0] + 6);
    hemB[1] = Math.min(hemB[1], 22);
  }
  const midF: [number, number] = [lerp(hipF[0], hemF[0], 0.5) + (lw.coat ? 1 : 2) * (1 - lift), lerp(hipF[1], hemF[1], 0.5)];
  const midB: [number, number] = [lerp(hipB[0], hemB[0], 0.5) - 1.5, lerp(hipB[1], hemB[1], 0.5)];
  const sag = 3 + fl * 0.08;
  const hemMid: [number, number] = [(hemF[0] + hemB[0]) / 2, Math.max(hemF[1], hemB[1]) + sag * (1 - lift * 0.6)];
  const pts: Pt[] = [
    [waistB[0], waistB[1]],
    [hipB[0], hipB[1]],
    [midB[0], midB[1]],
    [hemB[0], hemB[1], 0.25],
    [lerp(hemB[0], hemMid[0], 0.5), lerp(hemB[1], hemMid[1], 0.8)],
    [hemMid[0], hemMid[1]],
    [lerp(hemMid[0], hemF[0], 0.5), lerp(hemMid[1], hemF[1], 0.2)],
    [hemF[0], hemF[1], 0.25],
    [midF[0], midF[1]],
    [hipF[0], hipF[1]],
    [waistF[0], waistF[1]],
  ];
  return smooth(pts);
}

/** cut-lines for the lower garment (hem line, coat pocket), built from the same frame geometry */
export function lowerCuts(b: Body, w: WardrobeDef, a: LowerAngles, allowed: Set<string>): Cut[] {
  const lw = w.lower;
  if (!lw) return [];
  const out: Cut[] = [];
  const W = b.W * (1 + w.bulk);
  const fA = Math.max(a.hipF, a.hipB, -10) * DEG;
  const s = Math.sin(fA);
  const c = Math.cos(fA);
  const along = (d: number, off: number): Pt => [s * d + c * off, c * d - s * off];
  if (allowed.has('hemLine')) out.push({ id: 'hemLine', path: curve([along(lw.hem - 5, -12 * W), along(lw.hem - 4.5, 2), along(lw.hem - 5, 15 * W + lw.flare * 0.8)]), alpha: 0.36 });
  if (allowed.has('coatPocket')) out.push({ id: 'coatPocket', path: curve([along(14, 0), along(14.5, 9 * W), along(14, 15 * W)]), alpha: 0.42 });
  if (lw.coat && allowed.has('buttons')) out.push({ id: 'coatEdge', path: curve([along(0, 16 * W), along(lw.hem * 0.6, 17 * W + lw.flare * 0.4)]), alpha: 0.32 });
  return out;
}

// ---------------------------------------------------------------- hanging extras
export interface Hanger {
  id: 'tie' | 'strings' | 'lanyard';
  /** torso-local pivot */
  pivot: [number, number];
  pieces: Path2D[];
  cuts: Cut[];
  /** min forward swing relative to the torso (deg): it lies on the chest, never inside it */
  rest: number;
  /** visible only when it swings out past the chest (tie under a closed jacket) */
  hiddenUnder?: boolean;
}

export function hangers(b: Body, w: WardrobeDef): Hanger[] {
  const H = -b.neckBase[1];
  const W = b.W * (1 + w.bulk);
  const out: Hanger[] = [];
  const y = (f: number) => -f * H;
  if (w.tie) {
    const len = w.tie === 'loose' ? 44 : 46;
    const wd = w.tie === 'wide' ? 8.4 : w.tie === 'loose' ? 6.5 : 5.2;
    const knotY = w.tie === 'loose' ? 7 : 2;
    const p = smooth([[-2.2, knotY - 2, 0.4], [2.6, knotY - 2, 0.4], [1.8, knotY + 3.5, 0], [wd * 0.62, len - 6, 0.5], [0.4, len, 0], [-wd * 0.5, len - 6, 0.5], [-1.8, knotY + 3.5, 0]]);
    const enclosed = w.top === 'tailored' || w.top === 'doubleBreasted' || w.top === 'cardigan' || w.top === 'labcoat';
    out.push({
      id: 'tie',
      pivot: [9 * W, y(0.985)],
      pieces: [p],
      cuts: [{ id: 'tie', path: curve([[-1.6, knotY + 4], [-wd * 0.45, len - 6], [0.4, len - 0.5]]), alpha: enclosed ? 0 : 0.42 }],
      rest: 9,
      hiddenUnder: enclosed,
    });
  }
  if (w.strings) {
    const s = new Path2D();
    for (const dx of [0, 3]) {
      s.moveTo(dx, 0);
      s.lineTo(dx + 0.6, 26);
    }
    const tips = new Path2D();
    ellipsePath(0.6, 27, 0.9, 1.6, 0, tips);
    ellipsePath(3.6, 27, 0.9, 1.6, 0, tips);
    out.push({ id: 'strings', pivot: [9 * W, y(0.96)], pieces: [], cuts: [{ id: 'strings', path: s, alpha: 0.55, w: 1.1 }, { id: 'strings', path: tips, mode: 'fill', alpha: 0.55 }], rest: 12 });
  }
  if (w.lanyard) {
    const s = curve([[0, 0], [1.4, 18], [2.2, 30]]);
    const card = new Path2D();
    card.roundRect(-4.5, 30, 8, 11, 1);
    out.push({ id: 'lanyard', pivot: [7 * W, y(0.97)], pieces: [card], cuts: [{ id: 'lanyard', path: s, alpha: 0.5, w: 0.9 }, { id: 'lanyard', path: (() => { const q = new Path2D(); q.roundRect(-3.5, 31.2, 6, 8.6, 0.8); return q; })(), mode: 'fill', alpha: 0.3 }], rest: 11 });
  }
  return out;
}
