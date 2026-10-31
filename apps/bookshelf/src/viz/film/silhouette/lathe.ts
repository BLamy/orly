/**
 * Lathe: turned silhouettes from a half-profile mirrored about a vertical axis.
 *
 *   lathe(segs, { anchor })            -> Turning { path, h, w, profile }   (cached by segs)
 *   turning(kind, h, w?)               -> Turning for a preset:
 *       'baluster' 'balusterSlim' 'candlestick' 'candlestickTall' 'vase' 'urn' 'chairLeg'
 *       'column' 'lampBase' 'finial' 'finialAcorn' 'bedpost' 'newel' 'goblet' 'flask' 'beaker' 'bottle'
 *   drawTurning(c, { kind|segs, x, y, h, w?, role? }, env)   painter; (x, y) = base centre (anchor 'bottom')
 *   placeTurning(p, t, x, y, sx?, sy?)  add a Turning's path into a bigger Path2D at (x, y)
 *
 * Segments run top -> bottom; r is the half-width. Consecutive segments may jump in r
 * (a step / fillet). Shapes: ['cyl',h,r] ['taper',h,r0,r1] ['flare',h,r0,r1] (convex)
 * ['cove',h,r0,r1] (concave) ['ogee',h,r0,r1] (S) ['bead',h,r,rEnd?] ['vase',h,r0,rMax,r1,at?]
 * ['point',h,r0] (to a tip) ['gap',h] (zero-width neck, splits the outline).
 * Paths are built with anchor 'bottom' by default: base at y = 0, extending to y = -h.
 */
import type { FillRole, Painter } from '../contracts';

export type Seg =
  | ['cyl', number, number]
  | ['taper', number, number, number]
  | ['flare', number, number, number]
  | ['cove', number, number, number]
  | ['ogee', number, number, number]
  | ['bead', number, number, number?]
  | ['vase', number, number, number, number, number?]
  | ['point', number, number];

export interface Turning {
  path: Path2D;
  /** total height */
  h: number;
  /** max full width */
  w: number;
  /** [y, r] samples (y from the anchor; negative is up for anchor 'bottom') */
  profile: [number, number][];
}

const N = 10; // samples per curved segment

function sampleSeg(s: Seg, y0: number, out: [number, number][]) {
  const kind = s[0];
  const h = s[1];
  const push = (t: number, r: number) => out.push([y0 + h * t, Math.max(0, r)]);
  switch (kind) {
    case 'cyl':
      push(0, s[2]);
      push(1, s[2]);
      return;
    case 'taper':
      push(0, s[2]);
      push(1, s[3]);
      return;
    default:
      break;
  }
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    let r = 0;
    switch (kind) {
      case 'flare': {
        const [, , r0, r1] = s;
        r = r0 + (r1 - r0) * Math.sin((t * Math.PI) / 2);
        break;
      }
      case 'cove': {
        const [, , r0, r1] = s;
        r = r0 + (r1 - r0) * (1 - Math.cos((t * Math.PI) / 2));
        break;
      }
      case 'ogee': {
        const [, , r0, r1] = s;
        r = r0 + (r1 - r0) * (0.5 - 0.5 * Math.cos(t * Math.PI));
        break;
      }
      case 'bead': {
        const rr = s[2];
        const re = s[3] ?? rr * 0.55;
        r = re + (rr - re) * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2));
        break;
      }
      case 'vase': {
        const [, , r0, rMax, r1] = s;
        const at = s[5] ?? 0.55;
        if (t <= at) r = rMax + (r0 - rMax) * Math.cos(((t / at) * Math.PI) / 2) ** 1.3;
        else r = r1 + (rMax - r1) * Math.cos((((t - at) / (1 - at)) * Math.PI) / 2) ** 0.8;
        // reversed so top is r0 -> rMax -> r1 bottom
        break;
      }
      case 'point': {
        const r0 = s[2];
        r = r0 * Math.pow(t, 0.75);
        // top of the point is the tip
        break;
      }
    }
    push(t, r);
  }
}

const cache = new Map<string, Turning>();

/** Build (and cache) a turning from segments. */
export function lathe(segs: Seg[], opts: { anchor?: 'bottom' | 'top' } = {}): Turning {
  const anchor = opts.anchor ?? 'bottom';
  const key = anchor + JSON.stringify(segs);
  const hit = cache.get(key);
  if (hit) return hit;
  const prof: [number, number][] = [];
  let y = 0;
  for (const s of segs) {
    sampleSeg(s, y, prof);
    y += s[1];
  }
  const h = y;
  const off = anchor === 'bottom' ? -h : 0;
  const profile = prof.map(([py, r]) => [py + off, r] as [number, number]);
  const path = new Path2D();
  // right side top->bottom, left side bottom->top
  path.moveTo(0, profile[0][0]);
  for (const [py, r] of profile) path.lineTo(r, py);
  path.lineTo(0, profile[profile.length - 1][0]);
  for (let i = profile.length - 1; i >= 0; i--) path.lineTo(-profile[i][1], profile[i][0]);
  path.closePath();
  const w = 2 * Math.max(...profile.map((p) => p[1]));
  const t: Turning = { path, h, w, profile };
  if (cache.size > 400) cache.clear();
  cache.set(key, t);
  return t;
}

export type TurningKind =
  | 'baluster'
  | 'balusterSlim'
  | 'candlestick'
  | 'candlestickTall'
  | 'vase'
  | 'urn'
  | 'chairLeg'
  | 'column'
  | 'lampBase'
  | 'finial'
  | 'finialAcorn'
  | 'bedpost'
  | 'newel'
  | 'goblet'
  | 'flask'
  | 'beaker'
  | 'bottle';

/** Preset profiles, proportional to (h, w). w defaults to a kind-specific ratio of h. */
export function presetSegs(kind: TurningKind, h: number, w?: number): Seg[] {
  const W = (ratio: number) => (w ?? h * ratio) / 2; // half width
  const k = (f: number) => h * f;
  switch (kind) {
    case 'baluster': {
      const r = W(0.3);
      return [
        ['cyl', k(0.05), r * 0.92],
        ['cove', k(0.03), r * 0.7, r * 0.5],
        ['bead', k(0.04), r * 0.55, r * 0.4],
        ['cove', k(0.16), r * 0.32, r * 0.38],
        ['vase', k(0.48), r * 0.38, r * 0.95, r * 0.55, 0.62],
        ['bead', k(0.05), r * 0.68, r * 0.5],
        ['cove', k(0.06), r * 0.55, r * 0.85],
        ['cyl', k(0.13), r * 0.92],
      ];
    }
    case 'balusterSlim': {
      const r = W(0.18);
      return [
        ['cyl', k(0.06), r],
        ['bead', k(0.05), r * 0.7, r * 0.45],
        ['taper', k(0.45), r * 0.38, r * 0.5],
        ['bead', k(0.07), r * 0.85, r * 0.5],
        ['vase', k(0.2), r * 0.5, r * 0.9, r * 0.45, 0.5],
        ['bead', k(0.05), r * 0.7, r * 0.45],
        ['cyl', k(0.12), r],
      ];
    }
    case 'candlestick': {
      const r = W(0.42);
      return [
        ['cyl', k(0.1), r * 0.16], // the candle
        ['cyl', k(0.015), r * 0.4], // drip pan
        ['cove', k(0.05), r * 0.38, r * 0.2],
        ['bead', k(0.05), r * 0.3, r * 0.16],
        ['taper', k(0.22), r * 0.12, r * 0.16],
        ['bead', k(0.06), r * 0.32, r * 0.15],
        ['vase', k(0.2), r * 0.14, r * 0.3, r * 0.14, 0.55],
        ['bead', k(0.04), r * 0.24, r * 0.15],
        ['ogee', k(0.18), r * 0.18, r * 0.92],
        ['cyl', k(0.035), r],
      ];
    }
    case 'candlestickTall': {
      const r = W(0.22);
      return [
        ['cyl', k(0.07), r * 0.2],
        ['cyl', k(0.012), r * 0.62],
        ['cove', k(0.04), r * 0.55, r * 0.22],
        ['bead', k(0.03), r * 0.42, r * 0.2],
        ['taper', k(0.24), r * 0.16, r * 0.22],
        ['bead', k(0.04), r * 0.48, r * 0.2],
        ['vase', k(0.16), r * 0.2, r * 0.5, r * 0.2, 0.6],
        ['taper', k(0.14), r * 0.2, r * 0.26],
        ['bead', k(0.04), r * 0.5, r * 0.25],
        ['ogee', k(0.15), r * 0.3, r * 0.95],
        ['cyl', k(0.025), r],
      ];
    }
    case 'vase': {
      const r = W(0.55);
      return [
        ['cove', k(0.08), r * 0.55, r * 0.4],
        ['vase', k(0.72), r * 0.4, r, r * 0.42, 0.55],
        ['cove', k(0.08), r * 0.42, r * 0.55],
        ['cyl', k(0.12), r * 0.55],
      ];
    }
    case 'urn': {
      const r = W(0.6);
      return [
        ['point', k(0.14), r * 0.12],
        ['bead', k(0.08), r * 0.28, r * 0.14],
        ['cyl', k(0.03), r * 0.5],
        ['flare', k(0.1), r * 0.62, r * 0.95],
        ['vase', k(0.36), r * 0.95, r, r * 0.3, 0.2],
        ['bead', k(0.06), r * 0.3, r * 0.18],
        ['ogee', k(0.15), r * 0.2, r * 0.6],
        ['cyl', k(0.08), r * 0.65],
      ];
    }
    case 'chairLeg': {
      const r = W(0.16);
      return [
        ['cyl', k(0.16), r],
        ['cove', k(0.04), r, r * 0.6],
        ['bead', k(0.06), r * 0.8, r * 0.5],
        ['vase', k(0.36), r * 0.5, r * 0.9, r * 0.45, 0.4],
        ['bead', k(0.06), r * 0.75, r * 0.4],
        ['taper', k(0.24), r * 0.5, r * 0.32],
        ['flare', k(0.08), r * 0.32, r * 0.55],
      ];
    }
    case 'column': {
      const r = W(0.12);
      return [
        ['cyl', k(0.03), r * 1.45], // abacus
        ['ogee', k(0.035), r * 1.3, r * 1.02], // echinus
        ['bead', k(0.02), r * 1.1, r], // astragal
        ['taper', k(0.82), r * 0.86, r], // shaft with entasis approximated
        ['cove', k(0.02), r, r * 1.12],
        ['bead', k(0.035), r * 1.3, r * 1.1], // torus
        ['cyl', k(0.04), r * 1.45], // plinth
      ];
    }
    case 'lampBase': {
      const r = W(0.5);
      return [
        ['cyl', k(0.08), r * 0.08],
        ['bead', k(0.05), r * 0.2, r * 0.1],
        ['vase', k(0.58), r * 0.25, r * 0.85, r * 0.35, 0.6],
        ['bead', k(0.06), r * 0.5, r * 0.3],
        ['ogee', k(0.15), r * 0.4, r * 0.95],
        ['cyl', k(0.08), r],
      ];
    }
    case 'finial': {
      const r = W(0.36);
      return [
        ['point', k(0.32), r * 0.3],
        ['bead', k(0.06), r * 0.45, r * 0.25],
        ['bead', k(0.34), r, r * 0.3],
        ['bead', k(0.06), r * 0.5, r * 0.25],
        ['cove', k(0.08), r * 0.28, r * 0.6],
        ['cyl', k(0.14), r * 0.6],
      ];
    }
    case 'finialAcorn': {
      const r = W(0.42);
      return [
        ['point', k(0.08), r * 0.15],
        ['vase', k(0.42), r * 0.2, r, r * 0.7, 0.55],
        ['cyl', k(0.04), r * 0.9],
        ['bead', k(0.1), r * 0.8, r * 0.4],
        ['cove', k(0.16), r * 0.32, r * 0.55],
        ['cyl', k(0.2), r * 0.6],
      ];
    }
    case 'bedpost': {
      const r = W(0.07);
      return [
        ['point', k(0.04), r * 0.6],
        ['bead', k(0.04), r * 1.2, r * 0.6],
        ['taper', k(0.3), r * 0.65, r * 0.8],
        ['bead', k(0.03), r * 1.3, r * 0.8],
        ['vase', k(0.16), r * 0.8, r * 1.4, r * 0.8, 0.6],
        ['bead', k(0.03), r * 1.3, r * 0.8],
        ['cyl', k(0.3), r],
        ['taper', k(0.1), r, r * 0.75],
      ];
    }
    case 'newel': {
      const r = W(0.2);
      return [
        ['point', k(0.05), r * 0.4],
        ['bead', k(0.12), r * 0.85, r * 0.35],
        ['cyl', k(0.03), r * 0.5],
        ['cyl', k(0.04), r * 1.1],
        ['cove', k(0.04), r * 1.05, r * 0.85],
        ['cyl', k(0.5), r * 0.85],
        ['ogee', k(0.06), r * 0.85, r * 1.05],
        ['cyl', k(0.16), r * 1.05],
      ];
    }
    case 'goblet': {
      const r = W(0.55);
      return [
        ['taper', k(0.4), r, r * 0.6],
        ['cove', k(0.08), r * 0.6, r * 0.08],
        ['bead', k(0.06), r * 0.2, r * 0.08],
        ['cyl', k(0.36), r * 0.07],
        ['flare', k(0.1), r * 0.1, r * 0.75],
      ];
    }
    case 'flask': {
      // Erlenmeyer: narrow neck, conical body
      const r = W(0.7);
      return [
        ['cyl', k(0.04), r * 0.24],
        ['cyl', k(0.3), r * 0.18],
        ['taper', k(0.6), r * 0.2, r],
        ['cyl', k(0.06), r * 0.96],
      ];
    }
    case 'beaker': {
      const r = W(0.65);
      return [
        ['cyl', k(0.03), r * 1.05],
        ['taper', k(0.97), r, r * 0.97],
      ];
    }
    case 'bottle': {
      const r = W(0.38);
      return [
        ['cyl', k(0.05), r * 0.36],
        ['taper', k(0.22), r * 0.3, r * 0.33],
        ['flare', k(0.13), r * 0.35, r],
        ['cyl', k(0.6), r],
      ];
    }
  }
}

/** A cached preset turning (base centre at 0,0, extends up). */
export function turning(kind: TurningKind, h: number, w?: number): Turning {
  return lathe(presetSegs(kind, h, w));
}

/** Add a turning into another path at (x, y) with optional scale. */
export function placeTurning(p: Path2D, t: Turning, x: number, y: number, sx = 1, sy = 1) {
  p.addPath(t.path, new DOMMatrix([sx, 0, 0, sy, x, y]));
}

export interface TurningOpts {
  kind?: TurningKind;
  segs?: Seg[];
  /** base centre */
  x: number;
  y: number;
  h: number;
  w?: number;
  role?: FillRole;
}

/** Painter: one turned object, base centre at (x, y). */
export const drawTurning: Painter<TurningOpts> = (c, o, env) => {
  const t = o.segs ? lathe(o.segs) : turning(o.kind ?? 'baluster', o.h, o.w);
  c.save();
  c.translate(o.x, o.y);
  c.fillStyle = env.fill(o.role ?? 'ink');
  c.fill(t.path);
  c.restore();
};
