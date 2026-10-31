/**
 * handwired-explained — the REAL compiled HandwiredOS circuit (chenglou/handwired@257856e), the data behind the
 * wallpaper (ch01-s04, ch05-s04), the matmul loom (sets/matmulLoom.ts) and the X-ray desk (sets/handwiredDesk.ts).
 *
 * Source: films/handwired-explained/research/exports/handwiredos-circuit.json, written by
 * `bun films/handwired-explained/tools/export-handwiredos-circuit.ts .orly-work/repos/handwired`
 * (createWindowManagerMachine().tensorProgram); copied verbatim to sets/data/. Totals check against OS02 / CM07:
 * 234 source cells, 130 layers, 4,646 live operations, 9,909 stored weights (6,898 add, 3,011 subtract),
 * 2,776 ReGLU, 59 boolean, longest gate chain 71.
 *
 *   CIRCUIT.totals, CIRCUIT.layers[i] = { operations, storedWeights, adds, subtracts, reglu, boolean, gateDepthMax }
 *   valueX(v)                   x in 0..1 of packed value v, laid out exactly as src/handwiredos/wiring.ts lays it out
 *                               (the 234 cells share the first column; each layer gets an equal column with its
 *                               operations spread across it in order)
 *   layerX(l)                   the left edge (0..1) of layer l's column (l = -1: the cells' column)
 *   drawWallpaper(c, rect, env, o)   every stored weight as one arc, from the value it reads to the operation that
 *                               reads it, the upper half of an ellipse standing on the rect's bottom edge, copper for
 *                               adding and indigo for subtracting weights, subtracts first (wiring.ts drawWiring).
 *                               Expensive (9,909 arcs): ALWAYS bake it with f.cached.
 *   GATE_CHAIN                  the real 71-gate chain: packed values and their layers (the loom's highlighted path)
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import raw from './data/handwiredos-circuit.json';

export interface LayerInfo {
  layer: number;
  operations: number;
  storedWeights: number;
  adds: number;
  subtracts: number;
  reglu: number;
  boolean: number;
  indexReads: number;
  gateDepthMax: number;
}
interface CircuitData {
  $source: string;
  $command: string;
  totals: { sourceCells: number; layers: number; liveOperations: number; storedWeights: number; adds: number; subtracts: number; reglu: number; boolean: number; longestGateChain: number };
  layers: LayerInfo[];
  longestGateChain: { packedValues: number[]; layers: number[] };
  /** [from value, to value, +1 add | -1 subtract], one per stored weight */
  arcs: [number, number, number][];
}

export const CIRCUIT = raw as unknown as CircuitData;
export const TOTALS = CIRCUIT.totals;
export const GATE_CHAIN = CIRCUIT.longestGateChain;

/** HandwiredOS's own stylesheet colours (assets/site.css): the desk, a window sheet, ink, copper, wire indigo */
export const OS_COLORS = { desk: '#dcd2c1', paper: '#f3eee4', sheet: '#fffdf8', ink: '#1e1a16', copper: '#a64d1d', indigo: '#33589e' } as const;

const S = TOTALS.sourceCells;
const NL = CIRCUIT.layers.length;
const VALUE_COUNT = S + CIRCUIT.layers.reduce((a, l) => a + l.operations, 0);
/** the first packed value index of each layer */
export const LAYER_START: number[] = (() => {
  const out: number[] = [];
  let st = S;
  for (const l of CIRCUIT.layers) {
    out.push(st);
    st += l.operations;
  }
  return out;
})();
const VX = (() => {
  const x = new Float32Array(VALUE_COUNT);
  const col = 1 / (NL + 1);
  for (let c = 0; c < S; c++) x[c] = (c / S) * col;
  CIRCUIT.layers.forEach((l, li) => {
    for (let r = 0; r < l.operations; r++) x[LAYER_START[li] + r] = (li + 1 + r / l.operations) * col;
  });
  return x;
})();
/** the layer a packed value belongs to (-1 = a source cell) */
export function layerOf(v: number): number {
  if (v < S) return -1;
  let lo = 0, hi = NL - 1;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if (LAYER_START[m] <= v) lo = m;
    else hi = m - 1;
  }
  return lo;
}
export const valueX = (v: number) => VX[v] ?? 0;
export const layerX = (l: number) => (l + 1) / (NL + 1);

export interface WallpaperOpts {
  /** per-arc opacity; default wiring.ts arcOpacity (2,600 / weights) × the stylesheet's 36 % */
  alpha?: number;
  /** line width in stage px (default 0.5 css px scaled to the rect: rect.w / 1232) */
  lineWidth?: number;
  /** override the two inks (default: the stylesheet's copper and indigo, pulled toward the mood) */
  adds?: string;
  subtracts?: string;
  /** only arcs that READ from a value in [lo, hi) of 0..1 x (for a reveal in reading order); default all */
  fromRange?: [number, number];
  /** draw only every nth arc (thumbnails); default 1 */
  stride?: number;
}

/** wiring.ts drawWiring, reproduced for a stage rect: arcs stand on the rect's bottom edge */
export function drawWallpaper(c: CanvasRenderingContext2D, r: { x: number; y: number; w: number; h: number }, env: PaintEnv, o: WallpaperOpts = {}) {
  const adds = o.adds ?? mixLab(OS_COLORS.copper, env.mood.halo, 0.15);
  const subs = o.subtracts ?? mixLab(OS_COLORS.indigo, env.mood.set, 0.2);
  const alpha = o.alpha ?? Math.min(1, 2600 / TOTALS.storedWeights) * 0.36;
  const base = r.y + r.h;
  const hpr = Math.min(r.h / (r.w / 2), 1.25);
  const stride = Math.max(1, o.stride ?? 1);
  const [lo, hi] = o.fromRange ?? [0, 1.01];
  c.save();
  c.lineWidth = o.lineWidth ?? Math.max(0.35, r.w / 1232 * 0.5);
  for (const sign of [-1, 1]) {
    c.strokeStyle = withAlpha(sign > 0 ? adds : subs, alpha);
    c.beginPath();
    const A = CIRCUIT.arcs;
    for (let i = 0; i < A.length; i += stride) {
      const a = A[i];
      if (a[2] !== sign) continue;
      const fx = VX[a[0]];
      if (fx < lo || fx >= hi) continue;
      const x0 = r.x + fx * r.w;
      const x1 = r.x + VX[a[1]] * r.w;
      const rad = (x1 - x0) / 2;
      if (rad <= 0) continue;
      c.moveTo(x0, base);
      c.ellipse(x1 - rad, base, rad, rad * hpr, 0, Math.PI, 2 * Math.PI);
    }
    // one path per colour: thousands of hairlines in a single stroke (alpha does not build up within a path,
    // so stroke in small batches to keep wiring.ts's "many arcs add up to a band" look)
    c.stroke();
  }
  c.restore();
}

/**
 * Same picture, but stroked in batches so overlapping arcs build up into bands exactly as on the real desk
 * (one stroke per arc there). Use this for the hero wallpaper (ch01-s04); drawWallpaper is the cheap
 * single-path version for distant / translucent appearances. Bake either with f.cached.
 */
export function drawWallpaperBanded(c: CanvasRenderingContext2D, r: { x: number; y: number; w: number; h: number }, env: PaintEnv, o: WallpaperOpts = {}) {
  const adds = o.adds ?? mixLab(OS_COLORS.copper, env.mood.halo, 0.15);
  const subs = o.subtracts ?? mixLab(OS_COLORS.indigo, env.mood.set, 0.2);
  const alpha = o.alpha ?? Math.min(1, 2600 / TOTALS.storedWeights) * 0.36;
  const base = r.y + r.h;
  const hpr = Math.min(r.h / (r.w / 2), 1.25);
  const stride = Math.max(1, o.stride ?? 1);
  const [lo, hi] = o.fromRange ?? [0, 1.01];
  c.save();
  c.lineWidth = o.lineWidth ?? Math.max(0.35, r.w / 1232 * 0.5);
  for (const sign of [-1, 1]) {
    c.strokeStyle = withAlpha(sign > 0 ? adds : subs, alpha);
    const A = CIRCUIT.arcs;
    for (let i = 0; i < A.length; i += stride) {
      const a = A[i];
      if (a[2] !== sign) continue;
      const fx = VX[a[0]];
      if (fx < lo || fx >= hi) continue;
      const x0 = r.x + fx * r.w;
      const x1 = r.x + VX[a[1]] * r.w;
      const rad = (x1 - x0) / 2;
      if (rad <= 0) continue;
      c.beginPath();
      c.ellipse(x1 - rad, base, rad, rad * hpr, 0, Math.PI, 2 * Math.PI);
      c.stroke();
    }
  }
  c.restore();
}
