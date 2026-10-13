/**
 * Era hair and hats, cut as profile shapes in head units (style bible §4.3).
 *
 *   hairArt(style, o) -> { pieces, fall?, cuts, cutsFacingLeft? }   (head-local units; see heads.ts)
 *   hatArt(kind, era) -> { pieces, cuts, hairClip }  hairClip: 'all' hides hair above the brim
 *   HAIR_STYLES       -> the supported style names
 *
 * Styles: sidePart · slicked · crewCut · flatTop · receding · bald · curly ·
 * shaggy · messy · long · bob · bun · ponytail · beehive · perm · waves.
 * `fall` is the secondary part (long hair, ponytail) with its own pivot; the
 * rig swings it with the one-twos-tick lag. A parting is asymmetric: it is
 * drawn as a part line only when the parted side faces camera; the other
 * facing gets the swept side instead (never mirrored).
 */
import type { PuppetSpec } from '../../contracts';
import type { Cut } from './body';
import { HEAD_PIVOT } from './heads';
import { curve, ellipsePath, smooth, sxy, type Pt } from './rig';

export const HAIR_STYLES = [
  'sidePart', 'slicked', 'crewCut', 'flatTop', 'receding', 'bald', 'curly', 'shaggy', 'messy',
  'long', 'bob', 'bun', 'ponytail', 'beehive', 'perm', 'waves',
] as const;

export interface HairArt {
  pieces: Path2D[];
  fall?: { pivot: [number, number]; pieces: Path2D[]; cuts: Cut[] };
  cuts: Cut[];
  /** cut-lines replacing `cuts` entries with the same id when facing left */
  cutsFacingLeft?: Cut[];
}

const C: [number, number] = [-0.04, -0.56];

/** scalloped curl contour: offsets a base contour outward with alternating crests */
function curls(base: Pt[], thick: number, n: number, seed: number): Pt[] {
  // resample the base polyline to n points
  const pts: [number, number][] = [];
  const L: number[] = [0];
  for (let i = 1; i < base.length; i++) L.push(L[i - 1] + Math.hypot(base[i][0] - base[i - 1][0], base[i][1] - base[i - 1][1]));
  const total = L[L.length - 1];
  for (let k = 0; k < n; k++) {
    const d = (k / (n - 1)) * total;
    let i = 1;
    while (i < L.length - 1 && L[i] < d) i++;
    const u = (d - L[i - 1]) / (L[i] - L[i - 1] || 1);
    pts.push([base[i - 1][0] + (base[i][0] - base[i - 1][0]) * u, base[i - 1][1] + (base[i][1] - base[i - 1][1]) * u]);
  }
  const out: Pt[] = [];
  pts.forEach(([x, y], k) => {
    const dx = x - C[0];
    const dy = y - C[1];
    const r = Math.hypot(dx, dy) || 1;
    const crest = k % 2 === 0;
    const jit = ((Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
    const off = crest ? thick * (0.92 + jit * 0.16) : thick * 0.62;
    out.push([C[0] + dx * (1 + off / r), C[1] + dy * (1 + off / r), crest ? 1 : 0.35]);
  });
  return out;
}

const SKULL_ARC: Pt[] = [
  [0.33, -0.8], [0.34, -0.9], [0.22, -0.99], [0.05, -1.02], [-0.14, -1.0], [-0.3, -0.92], [-0.42, -0.78], [-0.47, -0.6], [-0.46, -0.44], [-0.4, -0.32],
];

export function hairArt(style: string, o: { h: number; fig: 'm' | 'f'; seed: number }): HairArt {
  const h = o.h;
  const [px, py] = HEAD_PIVOT;
  const S = (pts: Pt[]) => sxy(pts, h, -px * h, -py * h);
  const sm = (pts: Pt[]) => smooth(S(pts));
  const cut = (id: string, pts: Pt[], alpha = 0.42, w?: number): Cut => ({ id, path: curve(S(pts)), alpha, w });
  const art: HairArt = { pieces: [], cuts: [] };
  const hairline = (): Cut => cut('hairline', [[0.31, -0.8], [0.17, -0.74], [0.08, -0.6], [0.06, -0.45]], 0.28);
  switch (style) {
    case 'sidePart':
      art.pieces.push(sm([[0.3, -0.8], [0.338, -0.865], [0.328, -0.945], [0.24, -1.03], [0.06, -1.07], [-0.16, -1.065], [-0.36, -0.96], [-0.48, -0.74], [-0.495, -0.55], [-0.46, -0.38], [-0.38, -0.3], [-0.2, -0.36, 0], [0.05, -0.6, 0], [0.2, -0.74]]));
      art.cuts.push(hairline(), cut('part', [[0.17, -1.035], [-0.05, -1.05], [-0.24, -1.02]], 0.5));
      art.cutsFacingLeft = [hairline(), cut('part', [[0.3, -0.92], [0.12, -0.97], [-0.12, -0.99], [-0.34, -0.92]], 0.34)];
      break;
    case 'slicked':
      art.pieces.push(sm([[0.31, -0.79], [0.345, -0.852], [0.3, -0.968], [0.12, -1.034], [-0.12, -1.04], [-0.34, -0.93], [-0.47, -0.72], [-0.48, -0.5], [-0.43, -0.34], [-0.3, -0.3], [-0.1, -0.5, 0], [0.15, -0.72]]));
      art.cuts.push(hairline(), cut('comb', [[0.27, -0.93], [0.02, -0.99], [-0.25, -0.95], [-0.42, -0.8]], 0.4));
      break;
    case 'crewCut':
      art.pieces.push(sm([[0.32, -0.8], [0.345, -0.9], [0.29, -1.0], [0.12, -1.045], [-0.1, -1.045], [-0.3, -0.985], [-0.44, -0.84], [-0.488, -0.64], [-0.475, -0.55], [-0.44, -0.36], [-0.33, -0.28], [-0.15, -0.4, 0], [0.12, -0.7]]));
      art.cuts.push(hairline());
      break;
    case 'flatTop':
      art.pieces.push(sm([[0.32, -0.8], [0.34, -0.92, 0.4], [0.31, -1.07, 0], [0.0, -1.08, 0.4], [-0.25, -1.07, 0], [-0.38, -0.98], [-0.46, -0.78], [-0.475, -0.55], [-0.44, -0.36], [-0.33, -0.28], [-0.15, -0.4, 0], [0.12, -0.7]]));
      art.cuts.push(hairline());
      break;
    case 'receding':
      art.pieces.push(sm([[0.0, -0.84], [-0.18, -0.95], [-0.36, -0.92], [-0.468, -0.72], [-0.478, -0.5], [-0.435, -0.34], [-0.32, -0.27], [-0.12, -0.4, 0], [0.04, -0.6, 0]]));
      art.cuts.push(cut('hairline', [[0.06, -0.45], [0.07, -0.66], [-0.06, -0.85], [-0.26, -0.95]], 0.38));
      break;
    case 'bald':
      art.pieces.push(sm([[-0.18, -0.64], [-0.36, -0.8], [-0.47, -0.66], [-0.475, -0.47], [-0.425, -0.33], [-0.3, -0.27], [-0.12, -0.42, 0]]));
      art.cuts.push(cut('hairline', [[0.02, -0.5], [-0.12, -0.6], [-0.3, -0.7], [-0.4, -0.76]], 0.3));
      break;
    case 'curly': {
      const base: Pt[] = [[0.31, -0.8], ...SKULL_ARC.slice(1)];
      const outer = curls(base, o.fig === 'f' ? 0.12 : 0.085, 17, o.seed);
      art.pieces.push(sm([...outer, [-0.3, -0.3, 0], [-0.05, -0.55, 0], [0.18, -0.74, 0]]));
      art.cuts.push(hairline(), cut('curls', [[0.2, -1.02], [0.14, -1.06], [0.08, -1.02]], 0.4), cut('curls', [[-0.24, -1.0], [-0.3, -1.02], [-0.33, -0.96]], 0.4));
      break;
    }
    case 'perm': {
      const base: Pt[] = [[0.33, -0.78], [0.36, -0.92], [0.24, -1.04], [0.04, -1.08], [-0.18, -1.05], [-0.36, -0.94], [-0.48, -0.74], [-0.53, -0.5], [-0.52, -0.22], [-0.46, 0.04], [-0.34, 0.18]];
      const outer = curls(base, 0.15, 21, o.seed);
      art.pieces.push(sm([...outer, [-0.2, 0.1, 0.5], [-0.05, -0.1], [0.06, -0.35], [0.14, -0.6], [0.24, -0.72]]));
      art.cuts.push(cut('hairline', [[0.33, -0.76], [0.2, -0.68], [0.1, -0.45], [0.05, -0.2]], 0.4), cut('curls', [[-0.38, -0.38], [-0.46, -0.3], [-0.42, -0.2]], 0.38), cut('curls', [[0.1, -1.1], [0.02, -1.12], [-0.04, -1.07]], 0.38));
      break;
    }
    case 'shaggy':
      art.pieces.push(sm([[0.34, -0.76], [0.38, -0.82], [0.355, -0.95], [0.2, -1.06], [-0.05, -1.09], [-0.3, -1.03], [-0.47, -0.85], [-0.53, -0.6], [-0.525, -0.35], [-0.49, -0.13, 0.7], [-0.44, -0.04, 0.5], [-0.41, -0.12, 0.4], [-0.36, -0.06, 0.5], [-0.32, -0.16], [-0.2, -0.2, 0], [0.06, -0.32, 0.4], [0.1, -0.45], [0.16, -0.62], [0.3, -0.7]]));
      art.cuts.push(cut('hairline', [[0.33, -0.74], [0.18, -0.66], [0.11, -0.5], [0.08, -0.3]], 0.38), cut('locks', [[-0.3, -0.9], [-0.4, -0.6], [-0.42, -0.25]], 0.34));
      break;
    case 'messy':
      art.pieces.push(sm([[0.32, -0.8], [0.35, -0.89], [0.32, -0.985, 0.5], [0.25, -1.04, 0.4], [0.17, -1.035, 0.6], [0.08, -1.075, 0.4], [-0.02, -1.055, 0.6], [-0.13, -1.085, 0.4], [-0.25, -1.04, 0.6], [-0.37, -0.97], [-0.47, -0.78], [-0.48, -0.54], [-0.43, -0.36], [-0.33, -0.29], [-0.15, -0.4, 0], [0.12, -0.7]]));
      art.cuts.push(hairline());
      break;
    case 'long':
      art.pieces.push(sm([[0.31, -0.8], [0.352, -0.88], [0.28, -1.0], [0.08, -1.07], [-0.16, -1.065], [-0.38, -0.95], [-0.5, -0.72], [-0.52, -0.5], [-0.48, -0.35], [-0.2, -0.3, 0], [0.1, -0.6, 0]]));
      art.cuts.push(cut('hairline', [[0.31, -0.8], [0.16, -0.72], [0.09, -0.52], [0.06, -0.25]], 0.4));
      art.fall = {
        pivot: [-0.18, -0.78],
        pieces: [sm([[0.1, -0.66], [0.07, -0.3], [0.04, 0.1], [0.0, 0.42], [0.01, 0.62, 0.6], [-0.12, 0.67, 0.6], [-0.28, 0.6], [-0.44, 0.63, 0.6], [-0.54, 0.48], [-0.555, 0.1], [-0.54, -0.3], [-0.5, -0.64], [-0.2, -0.78]])],
        cuts: [cut('locks', [[-0.3, -0.4], [-0.32, 0.1], [-0.26, 0.55]], 0.34)],
      };
      break;
    case 'bob':
      art.pieces.push(sm([[0.384, -0.64, 0.6], [0.405, -0.7, 0.5], [0.385, -0.85], [0.27, -1.0], [0.06, -1.08], [-0.18, -1.07], [-0.4, -0.95], [-0.535, -0.72], [-0.555, -0.45], [-0.525, -0.2], [-0.45, -0.06, 0.7], [-0.36, -0.035, 0.6], [-0.35, -0.12], [-0.2, -0.3, 0], [0.12, -0.05, 0.6], [0.165, -0.015, 0.7], [0.205, -0.1, 0.6], [0.16, -0.3], [0.2, -0.55], [0.3, -0.62]]));
      art.cuts.push(cut('hairline', [[0.37, -0.64], [0.25, -0.6], [0.18, -0.36], [0.17, -0.08]], 0.42), cut('locks', [[-0.1, -1.0], [-0.34, -0.85], [-0.44, -0.4], [-0.4, -0.1]], 0.3));
      break;
    case 'bun':
    case 'ponytail':
      art.pieces.push(sm([[0.32, -0.8], [0.35, -0.87], [0.28, -0.99], [0.08, -1.05], [-0.15, -1.04], [-0.36, -0.94], [-0.47, -0.74], [-0.48, -0.52], [-0.42, -0.36], [-0.2, -0.4, 0], [0.1, -0.65, 0]]));
      art.cuts.push(cut('hairline', [[0.32, -0.8], [0.17, -0.75], [0.07, -0.62], [0.05, -0.48]], 0.36), cut('sweep', [[0.24, -0.97], [0.02, -1.0], [-0.24, -0.93], [-0.42, -0.79]], 0.3));
      if (style === 'bun') {
        art.pieces.push(ellipsePath(...S([[-0.54, -0.68]])[0] as [number, number], 0.135 * h, 0.125 * h, -0.3));
        art.cuts.push({ id: 'bunRing', path: curve(S([[-0.5, -0.78], [-0.6, -0.74], [-0.62, -0.62], [-0.54, -0.57]])), alpha: 0.4 });
      } else {
        art.pieces.push(ellipsePath(...S([[-0.47, -0.74]])[0] as [number, number], 0.055 * h, 0.065 * h, -0.4));
        art.fall = {
          pivot: [-0.49, -0.74],
          pieces: [sm([[-0.45, -0.8], [-0.56, -0.79], [-0.63, -0.6], [-0.635, -0.32], [-0.6, -0.08], [-0.56, 0.06, 0.5], [-0.535, -0.08], [-0.53, -0.32], [-0.5, -0.56], [-0.45, -0.68]])],
          cuts: [cut('locks', [[-0.56, -0.66], [-0.585, -0.4], [-0.57, -0.1]], 0.34)],
        };
      }
      break;
    case 'beehive':
      art.pieces.push(sm([[0.33, -0.78], [0.37, -0.9], [0.33, -1.07], [0.17, -1.24], [-0.1, -1.33], [-0.36, -1.27], [-0.52, -1.07], [-0.56, -0.8], [-0.51, -0.56], [-0.44, -0.4], [-0.2, -0.4, 0], [0.1, -0.66, 0]]));
      art.cuts.push(cut('hairline', [[0.33, -0.78], [0.18, -0.74], [0.06, -0.62]], 0.36), cut('sweep', [[0.3, -1.0], [0.05, -1.2], [-0.3, -1.2], [-0.48, -1.0]], 0.38));
      break;
    case 'waves':
      art.pieces.push(sm([[0.31, -0.8], [0.37, -0.86], [0.385, -0.98, 0.6], [0.29, -1.085, 0.7], [0.14, -1.06], [0.0, -1.1], [-0.2, -1.085], [-0.4, -0.97], [-0.52, -0.76], [-0.555, -0.5], [-0.535, -0.28], [-0.465, -0.13, 0.6], [-0.36, -0.1, 0.6], [-0.3, -0.2], [-0.1, -0.4, 0], [0.12, -0.66, 0]]));
      art.cuts.push(cut('roll', [[0.32, -0.92], [0.28, -1.0], [0.2, -1.02], [0.16, -0.96]], 0.44), cut('curls', [[-0.48, -0.36], [-0.42, -0.2], [-0.34, -0.2]], 0.4), hairline());
      break;
    default:
      // unknown style → tidy short hair
      return hairArt('sidePart', o);
  }
  return art;
}

export interface HatArt {
  pieces: Path2D[];
  cuts: Cut[];
}

export function hatArt(kind: PuppetSpec['hat'], era: PuppetSpec['era'], h: number): HatArt | undefined {
  if (!kind || kind === 'none') return undefined;
  const [px, py] = HEAD_PIVOT;
  const S = (pts: Pt[]) => sxy(pts, h, -px * h, -py * h);
  const cut = (id: string, pts: Pt[], alpha = 0.42): Cut => ({ id, path: curve(S(pts)), alpha });
  const modern = era >= '1990s';
  switch (kind) {
    case 'fedora':
      return {
        pieces: [
          smooth(S([
            [-0.6, -0.84, 0.6], [-0.64, -0.9, 0.5], [-0.46, -0.9], [-0.44, -0.93, 0.4], [-0.42, -1.18], [-0.3, -1.28], [-0.14, -1.235, 0.7], [-0.04, -1.27, 0.7],
            [0.14, -1.255], [0.31, -1.18], [0.37, -0.95, 0.4], [0.4, -0.915], [0.6, -0.875], [0.67, -0.82, 0.5], [0.58, -0.8], [0.38, -0.82], [0.0, -0.845], [-0.42, -0.825],
          ])),
        ],
        cuts: [cut('hatBand', [[-0.43, -0.98], [0.0, -0.99], [0.36, -0.99]], 0.48), cut('hatPinch', [[0.12, -1.25], [0.2, -1.12]], 0.36)],
      };
    case 'cap':
      return modern
        ? {
            pieces: [smooth(S([[-0.47, -0.76], [-0.47, -0.98], [-0.3, -1.12], [0.0, -1.165], [0.25, -1.1], [0.36, -0.96], [0.4, -0.87, 0.4], [0.7, -0.845], [0.745, -0.8, 0.5], [0.42, -0.785], [0.0, -0.8], [-0.42, -0.72]]))],
            cuts: [cut('capSeam', [[-0.05, -1.16], [0.1, -1.02], [0.34, -0.9]], 0.38)],
          }
        : {
            pieces: [smooth(S([[-0.48, -0.78], [-0.47, -0.98], [-0.3, -1.1], [0.0, -1.135], [0.3, -1.07], [0.47, -0.95], [0.6, -0.885], [0.645, -0.84, 0.5], [0.5, -0.82], [0.35, -0.84], [0.0, -0.86], [-0.4, -0.76]]))],
            cuts: [cut('capSeam', [[-0.2, -1.1], [0.15, -1.0], [0.42, -0.9]], 0.38)],
          };
    case 'beanie':
      return {
        pieces: [smooth(S([[-0.485, -0.66], [-0.5, -0.88], [-0.38, -1.08], [-0.12, -1.18], [0.12, -1.16], [0.3, -1.06], [0.38, -0.88], [0.372, -0.775], [0.0, -0.74], [-0.4, -0.64]]))],
        cuts: [cut('beanieFold', [[-0.49, -0.79], [0.0, -0.86], [0.375, -0.86]], 0.44)],
      };
  }
  return undefined;
}
