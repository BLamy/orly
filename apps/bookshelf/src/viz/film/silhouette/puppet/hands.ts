/**
 * Hand swaps and props (style bible §4.2): a SPRITE SET of cut-out hands, one
 * per HandShape — never rotate one hand into another; swap on a hold.
 *
 *   handArt(shape, len, frame?) -> { pieces, socket }  hand-local units: origin = wrist
 *        pivot, hand hangs along +y, thumb side = +x (forward). `frame` picks the
 *        typing loop drawing (0/1). socket = where a held prop's origin sits.
 *   propArt(prop)               -> { pieces, cuts, lights, upright }  in socket space
 *        (+x forward, +y toward the fingertips). upright props (mug) are
 *        counter-rotated by the rig so they stay level.
 *   HOLDING_SHAPES              -> shapes that can carry a prop (others pass it to the far hand)
 *
 * Shapes: relaxed · open (present, fanned fingers) · point · grip · fist ·
 * pinch · palmDown · typing (2-frame loop) · chin (index along the cheek).
 * Props: pipe · chalk · pen · book · clipboard · papers · mug · laptop · phone · cards.
 */
import type { HandShape, PuppetSpec } from '../../contracts';
import type { Cut } from './body';
import { curve, smooth, sxy, type Pt } from './rig';

export interface HandArt {
  pieces: Path2D[];
  socket: [number, number];
}

function capsule(x0: number, y0: number, x1: number, y1: number, w: number): Pt[] {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const l = Math.hypot(dx, dy) || 1;
  const nx = (-dy / l) * (w / 2);
  const ny = (dx / l) * (w / 2);
  const ex = (dx / l) * (w / 2);
  const ey = (dy / l) * (w / 2);
  return [
    [x0 + nx, y0 + ny],
    [x1 + nx, y1 + ny, 0.8],
    [x1 + ex * 1.05, y1 + ey * 1.05, 1],
    [x1 - nx, y1 - ny, 0.8],
    [x0 - nx, y0 - ny],
  ];
}

const LOBE: Pt[] = [[-0.17, 0.02], [-0.12, -0.11], [0.0, -0.15], [0.12, -0.11], [0.17, 0.02]];

/** hand shapes in units of hand length */
const SHAPES: Record<string, Pt[][]> = {
  relaxed: [
    [[0.17, -0.02], [0.195, 0.24], [0.175, 0.5], [0.15, 0.72], [0.09, 0.92, 0.7], [0.0, 0.985, 0.7], [-0.075, 0.9], [-0.135, 0.68], [-0.185, 0.42], [-0.19, 0.15], [-0.17, -0.02]],
    [[0.12, 0.16], [0.235, 0.29], [0.305, 0.47, 0.7], [0.295, 0.57, 0.6], [0.24, 0.55], [0.16, 0.4]],
  ],
  open: [
    [[0.17, -0.02], [0.2, 0.26], [0.19, 0.48], [0.0, 0.56], [-0.19, 0.46], [-0.19, 0.15], [-0.17, -0.02]],
    capsule(0.1, 0.42, 0.16, 0.98, 0.1),
    capsule(0.02, 0.44, 0.03, 1.02, 0.1),
    capsule(-0.07, 0.44, -0.11, 0.96, 0.1),
    capsule(-0.14, 0.4, -0.22, 0.84, 0.09),
    capsule(0.13, 0.18, 0.36, 0.52, 0.11),
  ],
  point: [
    [[0.18, -0.02], [0.2, 0.25], [0.215, 0.5], [0.16, 0.63], [0.0, 0.66], [-0.16, 0.6], [-0.205, 0.32], [-0.18, -0.02]],
    capsule(0.08, 0.45, 0.1, 1.1, 0.095),
    [[0.13, 0.18], [0.255, 0.33], [0.27, 0.5], [0.2, 0.53], [0.13, 0.42]],
  ],
  grip: [
    [[0.18, -0.02], [0.21, 0.22], [0.24, 0.42], [0.2, 0.6], [0.05, 0.665], [-0.12, 0.62], [-0.2, 0.42], [-0.2, 0.15], [-0.18, -0.02]],
    [[0.15, 0.2], [0.275, 0.32], [0.3, 0.44], [0.22, 0.47], [0.14, 0.38]],
  ],
  fist: [
    [[0.18, -0.02], [0.215, 0.22], [0.23, 0.42], [0.18, 0.57], [0.03, 0.6], [-0.13, 0.56], [-0.2, 0.38], [-0.2, 0.14], [-0.18, -0.02]],
    [[0.14, 0.2], [0.26, 0.32], [0.27, 0.44], [0.19, 0.46], [0.13, 0.38]],
  ],
  pinch: [
    [[0.17, -0.02], [0.195, 0.28], [0.165, 0.52], [0.1, 0.68], [-0.04, 0.72], [-0.15, 0.6], [-0.19, 0.3], [-0.18, -0.02]],
    capsule(0.06, 0.56, 0.3, 0.8, 0.085),
    capsule(0.14, 0.24, 0.32, 0.72, 0.095),
  ],
  palmDown: [
    [[0.17, -0.02], [0.18, 0.3], [0.155, 0.6], [0.105, 0.92], [0.03, 1.02, 0.6], [-0.05, 0.97], [-0.1, 0.7], [-0.16, 0.4], [-0.18, -0.02]],
    [[0.12, 0.2], [0.22, 0.32], [0.24, 0.45], [0.16, 0.46]],
  ],
  typing0: [
    [[0.17, -0.02], [0.18, 0.3], [0.16, 0.56], [0.08, 0.74], [-0.06, 0.82, 0.7], [-0.2, 0.8, 0.7], [-0.26, 0.72], [-0.2, 0.68], [-0.08, 0.66], [-0.17, 0.4], [-0.18, -0.02]],
    [[0.12, 0.2], [0.22, 0.34], [0.22, 0.48], [0.15, 0.46]],
  ],
  typing1: [
    [[0.17, -0.02], [0.18, 0.3], [0.16, 0.56], [0.1, 0.76], [-0.02, 0.86, 0.7], [-0.15, 0.88, 0.7], [-0.22, 0.82], [-0.17, 0.76], [-0.07, 0.7], [-0.17, 0.4], [-0.18, -0.02]],
    [[0.12, 0.2], [0.22, 0.34], [0.22, 0.48], [0.15, 0.46]],
  ],
  chin: [
    [[0.18, -0.02], [0.2, 0.25], [0.21, 0.5], [0.14, 0.62], [-0.02, 0.64], [-0.17, 0.56], [-0.2, 0.3], [-0.18, -0.02]],
    capsule(0.09, 0.46, 0.2, 1.02, 0.095),
    capsule(0.15, 0.22, 0.38, 0.44, 0.1),
  ],
};

const SOCKETS: Record<string, [number, number]> = {
  relaxed: [0.04, 0.58],
  open: [0.06, 0.5],
  point: [0.02, 0.42],
  grip: [0.04, 0.44],
  fist: [0.02, 0.4],
  pinch: [0.31, 0.79],
  palmDown: [0.0, 0.6],
  typing0: [0.0, 0.6],
  typing1: [0.0, 0.6],
  chin: [0.18, 0.52],
};

export const HOLDING_SHAPES: HandShape[] = ['relaxed', 'grip', 'fist', 'pinch'];

const handCache = new Map<string, HandArt>();
export function handArt(shape: HandShape, len: number, frame = 0): HandArt {
  const key = shape === 'typing' ? `typing${frame & 1}` : shape;
  const ck = `${key}@${len.toFixed(2)}`;
  let a = handCache.get(ck);
  if (!a) {
    const pts = SHAPES[key] ?? SHAPES.relaxed;
    a = {
      pieces: [...pts.map((p) => smooth(sxy(p, len))), smooth(sxy(LOBE, len))],
      socket: [(SOCKETS[key] ?? SOCKETS.relaxed)[0] * len, (SOCKETS[key] ?? SOCKETS.relaxed)[1] * len],
    };
    handCache.set(ck, a);
  }
  return a;
}

export interface PropArt {
  pieces: Path2D[];
  cuts: Cut[];
  /** semi-transparent lit areas (phone screen) */
  lights: { path: Path2D; alpha: number }[];
  /** counter-rotate to stay level in the world */
  upright: boolean;
  /** world-ish offset of the "business end" (pen tip, pipe bowl) in socket space */
  tip: [number, number];
}

function rr(x: number, y: number, w: number, h: number, r: number, p = new Path2D()): Path2D {
  p.roundRect(x, y, w, h, r);
  return p;
}

const propCache = new Map<string, PropArt>();
/** Prop art in socket space, units ≈ stage px at a 300-unit figure. */
export function propArt(prop: NonNullable<PuppetSpec['prop']>, s = 1): PropArt | undefined {
  if (prop === 'none') return undefined;
  const ck = `${prop}@${s}`;
  const hit = propCache.get(ck);
  if (hit) return hit;
  const S = (pts: Pt[]) => sxy(pts, s);
  const c = (id: string, pts: Pt[], alpha = 0.45): Cut => ({ id: `prop:${id}`, path: curve(S(pts)), alpha });
  let a: PropArt;
  switch (prop) {
    case 'pen':
      a = { pieces: [smooth(S([[-3.4, -3.6, 0.6], [7.6, 11.9, 0.3], [9.3, 14.2, 0], [8.4, 11.3, 0.3], [-2.1, -4.6, 0.6]]))], cuts: [], lights: [], upright: false, tip: [9.3 * s, 14.2 * s] };
      break;
    case 'chalk':
      a = { pieces: [smooth(S([[-3, 1.3, 0.3], [9, 0.6, 0.3], [9.6, -1.6, 0.3], [-3, -1.4, 0.3]]))], cuts: [], lights: [], upright: false, tip: [9.6 * s, -0.5 * s] };
      break;
    case 'pipe':
      a = {
        pieces: [smooth(S([[-2, 1.2, 0], [9, 0.2], [12, 1.2], [12.5, 8.5, 0.6], [15, 10.6, 0.8], [20, 10, 0.8], [21.5, 5, 0.5], [21.5, -0.6, 0], [13, -0.2, 0.6], [9, -1.2], [-2, -1.2, 0]]))],
        cuts: [c('pipeRim', [[13, 0.3], [21, 0.3]], 0.35)],
        lights: [],
        upright: false,
        tip: [17 * s, -1 * s],
      };
      break;
    case 'mug': {
      const body = rr(2 * s, -6 * s, 13 * s, 14 * s, 2 * s);
      const handle = new Path2D();
      handle.moveTo(2.5 * s, -3.4 * s);
      handle.bezierCurveTo(-4.6 * s, -3.8 * s, -4.6 * s, 5.4 * s, 2.5 * s, 4.8 * s);
      handle.lineTo(2.5 * s, 2.6 * s);
      handle.bezierCurveTo(-1.8 * s, 3.2 * s, -1.8 * s, -1.6 * s, 2.5 * s, -1.2 * s);
      handle.closePath();
      a = { pieces: [body, handle], cuts: [c('mugRim', [[2.6, -4.6], [14.4, -4.6]], 0.35)], lights: [], upright: true, tip: [8 * s, -7 * s] };
      break;
    }
    case 'book':
      a = {
        pieces: [rr(-3 * s, -3 * s, 23 * s, 30 * s, 1.6 * s)],
        cuts: [c('pages', [[18.5, -1.2], [18.5, 25.5]], 0.4), c('spine', [[-1, -1.5], [-1, 25.5]], 0.28)],
        lights: [],
        upright: false,
        tip: [10 * s, 12 * s],
      };
      break;
    case 'clipboard':
      a = {
        pieces: [rr(-3 * s, -1 * s, 24 * s, 32 * s, 1.4 * s), rr(4 * s, -4 * s, 10 * s, 5 * s, 1.5 * s)],
        cuts: [c('paperEdge', [[-0.8, 3], [-0.8, 29], [19, 29]], 0.4)],
        lights: [],
        upright: false,
        tip: [10 * s, 14 * s],
      };
      break;
    case 'papers': {
      const sheets: Path2D[] = [];
      for (let i = 0; i < 3; i++) {
        const q = new Path2D();
        const r = (i - 1) * 0.07;
        const cx = 6 * s;
        const pts: Pt[] = [[-4, -2], [17, -2], [17, 24], [-4, 24]].map(([x, y]) => [
          cx + (x - 6) * s * Math.cos(r) - y * s * Math.sin(r),
          (x - 6) * s * Math.sin(r) + y * s * Math.cos(r),
          0,
        ]);
        smooth(pts, { path: q });
        sheets.push(q);
      }
      a = {
        pieces: sheets,
        cuts: [c('sheetEdge', [[-3, 4], [-3.6, 23]], 0.35), c('lines', [[0, 6], [13, 6]], 0.25)],
        lights: [],
        upright: false,
        tip: [6 * s, 10 * s],
      };
      break;
    }
    case 'cards': {
      const card = smooth(S([[1.5, -2, 0], [17, -2, 0], [17, 6.5, 0], [-2, 6.5, 0], [-2, 1.5, 0]]));
      const holes = new Path2D();
      for (let r = 0; r < 2; r++) for (let k = 0; k < 7; k++) holes.rect((1.5 + k * 2.1) * s, (0.8 + r * 2.6) * s, 0.9 * s, 1.3 * s);
      a = { pieces: [card], cuts: [{ id: 'prop:holes', path: holes, mode: 'fill', alpha: 0.4 }], lights: [], upright: false, tip: [8 * s, 2 * s] };
      break;
    }
    case 'laptop':
      a = {
        pieces: [rr(-3 * s, -2 * s, 32 * s, 22 * s, 2 * s)],
        cuts: [c('lid', [[-1.5, 1.5], [27.5, 1.5]], 0.32)],
        lights: [],
        upright: false,
        tip: [13 * s, 9 * s],
      };
      break;
    case 'phone':
      a = {
        pieces: [rr(-1 * s, -2 * s, 8.4 * s, 15 * s, 1.6 * s)],
        cuts: [],
        lights: [{ path: rr(0 * s, -0.8 * s, 6.4 * s, 12.4 * s, 1 * s), alpha: 0.5 }],
        upright: false,
        tip: [3 * s, 4 * s],
      };
      break;
    default:
      return undefined;
  }
  propCache.set(ck, a);
  return a;
}
