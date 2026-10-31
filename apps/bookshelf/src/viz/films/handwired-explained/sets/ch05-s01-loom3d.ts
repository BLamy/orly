/**
 * handwired-explained — ch05-s01..s05: THE MATMUL LOOM IN DEPTH (owned by the ch05-s01..s05 author).
 *
 * The same real compiled HandwiredOS circuit as sets/matmulLoom.ts (sets/circuit.ts, the export of
 * chenglou/handwired@257856e), but staged as a true multiplane run: 130 thin upright frames, one per layer, each a flat
 * standing at its own depth, receding diagonally from the near end post (the 234 source cells, z = ZA) toward the
 * far windows. Between frames run the threads, ONE PER STORED WEIGHT (9,909): each starts at the right stile of the
 * frame that produced the value it reads (row = that value's place in its layer) and ends at a knot on the reading
 * frame's face (column = the input's place among the distinct inputs that layer reads, row = the operation). So a
 * frame's face IS its layer's matrix: rows × distinct inputs, a knot only where a weight is stored, mostly empty air.
 * Copper for adding weights, indigo for subtracting (the wallpaper's two colours, OS14). Each frame carries one small
 * ReLU ramp per ReGLU gate it holds (2,776) on its right stile and one toothed detent wheel per boolean row (59)
 * under its foot rail; the real 71-gate chain (GATE_CHAIN) can be traced through the frames as one copper line.
 *
 * Projection = the film's own multiplane camera (core/multiplane): a world point (X, Y, Z) lands at
 *   screen = centre + (P - cam.xy) · ZA·lens / (Z − cam.z),
 * so the frames slide against the room's L1..L6 layers with exactly their parallax. Everything is drawn in SCREEN
 * stage px (the layer transform is undone inside each call), split into depth-of-field RUNS: consecutive frames that
 * share a blur level go into one f.layer call with that blur, far to near, with fog A / B laid between, so the
 * sharp plane can rack (opts.focusZ) and the far frames haze and soften as in the style bible's layer table.
 *
 *   import { loom3, LOOM, frameX, frameZ, project, exitPt, knotPt } from '../sets/ch05-s01-loom3d';
 *   loom3(f, { cam, copper: u, indigo: v, focusZ: 1100 }, { run: (c, env, r) => { ... your objects at depth ... } });
 *   loom3Flat(c, env, cam, opts)     the whole loom in ONE context (screen px), for baking into f.cached (ch05-s05)
 *   loomToWallpaper(c, env, cam, u, rect, o)   each thread morphs into its own wallpaper arc (ch05-s04)
 */
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film/contracts';
import { layerXform } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { CIRCUIT, GATE_CHAIN, LAYER_START, OS_COLORS, TOTALS, layerOf, valueX } from './circuit';
import gatesRaw from './data/ch05-s02-gates.json';

type C2 = CanvasRenderingContext2D;
const NL = CIRCUIT.layers.length;
const S = TOTALS.sourceCells;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

// ---------------------------------------------------------------- world geometry
/** the loom's world placement: the end post (frame -1, the source cells) at z0; frame l at z0 + dz·(l+1) */
export const LOOM = { z0: 1000, dz: 26, x0: 170, dx: 21.8, yc: 372, floor: 640 } as const;
export const frameZ = (l: number) => LOOM.z0 + LOOM.dz * (l + 1);
export const frameX = (l: number) => LOOM.x0 + LOOM.dx * (l + 1);
const MAXN = Math.max(...CIRCUIT.layers.map((l) => l.operations));
/** frame height: log of its operation count (the post holds the 234 cells) */
export const frameH = (l: number) => {
  const n = l < 0 ? S : CIRCUIT.layers[l].operations;
  return 150 + 300 * (Math.log(1 + n) / Math.log(1 + Math.max(MAXN, S)));
};

/** distinct inputs per layer (sorted), from the arcs: the columns of each layer's matrix */
const INPUTS: number[][] = (() => {
  const sets: Set<number>[] = CIRCUIT.layers.map(() => new Set<number>());
  for (const a of CIRCUIT.arcs) sets[layerOf(a[1])].add(a[0]);
  return sets.map((s) => [...s].sort((x, y) => x - y));
})();
export const inputsOf = (l: number) => INPUTS[l];
const MAXM = Math.max(...INPUTS.map((s) => s.length));
/** frame width: log of the number of distinct inputs its layer reads (its matrix's column count) */
export const frameW = (l: number) => (l < 0 ? 26 : 64 + 64 * (Math.log(1 + INPUTS[l].length) / Math.log(1 + MAXM)));
const rowY = (l: number, r: number) => {
  const n = l < 0 ? S : CIRCUIT.layers[l].operations;
  const h = frameH(l) * 0.9;
  return LOOM.yc - h / 2 + (h * (r + 0.5)) / n;
};
export const rowAt = (l: number, r: number) => rowY(l, r);
export const layerRows = (l: number) => (l < 0 ? S : CIRCUIT.layers[l].operations);

/**
 * Which operations are gates (sets/data/ch05-s02-gates.json, a sidecar run of the same compiled program: '1' = a
 * ReGLU row in layer.gateRows, '2' = a boolean row in layer.booleanRows, '0' otherwise, per packed value). Totals
 * check: 2,776 ReGLU, 59 boolean, and exactly 71 gates on the longest chain (CM07).
 */
const KIND: string = (gatesRaw as { kind: string }).kind;
export const kindOf = (v: number) => (KIND.charCodeAt(v) - 48) as 0 | 1 | 2;
const GATE_ROWS: number[][] = CIRCUIT.layers.map((L, l) => {
  const out: number[] = [];
  for (let r = 0; r < L.operations; r++) if (KIND[LAYER_START[l] + r] !== '0') out.push(r);
  return out;
});
/** the chain's gates (71): indexes into GATE_CHAIN.packedValues */
export const CHAIN_GATES: number[] = GATE_CHAIN.packedValues.map((v, i) => (KIND[v] !== '0' ? i : -1)).filter((i) => i >= 0);

export interface P3 {
  x: number;
  y: number;
  z: number;
}
/** where value v leaves its frame (the right stile at its row; a source cell leaves the post's face) */
export function exitPt(v: number): P3 {
  // (rowY is also exported below as rowAt)
  const l = layerOf(v);
  const r = l < 0 ? v : v - LAYER_START[l];
  return { x: frameX(l) + frameW(l) / 2, y: rowY(l, r), z: frameZ(l) };
}
/** the knot of arc i on its reading frame's face (column = input, row = operation) */
export function knotPt(i: number): P3 {
  const a = CIRCUIT.arcs[i];
  const l = layerOf(a[1]);
  const r = a[1] - LAYER_START[l];
  const cols = INPUTS[l];
  const j = lowerBound(cols, a[0]);
  const w = frameW(l) * 0.86;
  return { x: frameX(l) - w / 2 + (w * (j + 0.5)) / cols.length, y: rowY(l, r), z: frameZ(l) };
}
function lowerBound(a: number[], v: number) {
  let lo = 0, hi = a.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (a[m] < v) lo = m + 1;
    else hi = m;
  }
  return lo;
}

// packed per-arc world endpoints, grouped by reading frame
const NA = CIRCUIT.arcs.length;
const ORDER = Array.from({ length: NA }, (_, i) => i).sort((p, q) => layerOf(CIRCUIT.arcs[p][1]) - layerOf(CIRCUIT.arcs[q][1]) || p - q);
const AX0 = new Float32Array(NA), AY0 = new Float32Array(NA), AZ0 = new Float32Array(NA);
const AX1 = new Float32Array(NA), AY1 = new Float32Array(NA), AZ1 = new Float32Array(NA);
const ASG = new Int8Array(NA);
const AID = new Int32Array(NA);
/** arcs of reading frame l are ORDER-slots [FROM[l], FROM[l + 1]) */
const FROM = new Int32Array(NL + 1);
(() => {
  let l = 0;
  ORDER.forEach((i, k) => {
    const a = CIRCUIT.arcs[i];
    const p0 = exitPt(a[0]);
    const p1 = knotPt(i);
    AX0[k] = p0.x; AY0[k] = p0.y; AZ0[k] = p0.z;
    AX1[k] = p1.x; AY1[k] = p1.y; AZ1[k] = p1.z;
    ASG[k] = a[2];
    AID[k] = i;
    const lb = layerOf(a[1]);
    while (l <= lb) FROM[l++] = k;
  });
  while (l <= NL) FROM[l++] = NA;
})();
const SLOT_OF = new Int32Array(NA);
for (let k = 0; k < NA; k++) SLOT_OF[AID[k]] = k;
/** the slot of arc i (CIRCUIT.arcs index) */
export const slotOf = (i: number) => SLOT_OF[i];
/** slot range of the arcs read by frame l */
export const arcSlots = (l: number): [number, number] => [FROM[l], FROM[l + 1]];
export const slotArc = (k: number) => AID[k];
export const slotSign = (k: number) => ASG[k];
export function slotEnds(k: number): [P3, P3] {
  return [
    { x: AX0[k], y: AY0[k], z: AZ0[k] },
    { x: AX1[k], y: AY1[k], z: AZ1[k] },
  ];
}

// ---------------------------------------------------------------- projection
export function scaleAt(z: number, cam: Camera3) {
  return (1000 * cam.lens) / Math.max(4, z - cam.z);
}
export function project(p: P3, cam: Camera3): { x: number; y: number; s: number } {
  const s = scaleAt(p.z, cam);
  return { x: 640 + (p.x - cam.x) * s, y: 360 + (p.y - cam.y) * s, s };
}
/** undo the layer transform inside f.layer so the painter draws in screen stage px */
export function screenSpace(c: C2, spec: Pick<LayerSpec, 'z'>, cam: Camera3) {
  const m = layerXform(spec, cam);
  c.transform(1 / m.k, 0, 0, 1 / m.k, -m.tx / m.k, -m.ty / m.k);
}

// ---------------------------------------------------------------- colours (memoised per mood)
const colMemo = new Map<string, string>();
function memo(key: string, f: () => string) {
  let v = colMemo.get(key);
  if (v === undefined) {
    v = f();
    if (colMemo.size > 4000) colMemo.clear();
    colMemo.set(key, v);
  }
  return v;
}
/** haze amount at depth (the style bible's atmospheric ladder, continuous) */
export const hazeAt = (z: number) => {
  // review r1 (ch05-s01): the far half melted into a bright haze band at the frame's edge; beyond the midpoint the
  // haze climbs 30 % more slowly
  const lin = clamp01((z - 1000) / 3600);
  return (lin < 0.5 ? lin : 0.5 + (lin - 0.5) * 0.7) * 0.62;
};
/** the two thread families' own hues (review r1: copper #c8794a, indigo / grey-blue #6f7fb8; never the same cream) */
export const THREAD_HUE = { copper: '#c8794a', indigo: '#6f7fb8' } as const;
export function inks(env: PaintEnv, z: number, ghost = 0) {
  const h = Math.round(hazeAt(z) * 20) / 20;
  const g = Math.round(ghost * 10) / 10;
  const m = env.mood;
  const k = `${m.id}|${m.haze}|${h}|${g}`;
  const frame = memo(`f${k}`, () => mixLab(mixLab(m.ink, m.haze, h), mixLab(m.rim, m.haze, 0.5), g * 0.55));
  const rail = memo(`r${k}`, () => mixLab(mixLab(m.rim, m.core, 0.35), m.haze, h * 0.7));
  const copper = memo(`c${k}`, () => mixLab(mixLab(THREAD_HUE.copper, m.haze, h * 0.55), mixLab(m.rim, '#ffffff', 0.3), g * 0.75));
  const indigo = memo(`i${k}`, () => mixLab(mixLab(THREAD_HUE.indigo, m.haze, h * 0.55), mixLab(m.rim, '#ffffff', 0.3), g * 0.75));
  const gate = memo(`g${k}`, () => mixLab(mixLab(m.set, m.rim, 0.3), m.haze, 0.25 + h * 0.5));
  return { frame, rail, copper, indigo, gate };
}

// ---------------------------------------------------------------- options
export interface Loom3Opts {
  cam: Camera3;
  /** shot time on twos (thread shimmer) */
  tq?: number;
  /** thread visibility multiplier; default 1 */
  threads?: number;
  /** 0..1 the copper (adding) threads catch the rim */
  copper?: number;
  /** 0..1 the indigo (subtracting) threads catch the rim */
  indigo?: number;
  /** per-family brightness (review r1, ch05-s01): 1 = full (85 % alpha in its own hue), 0.6 settled, 0.25 dropped.
   *  When given it replaces the copper / indigo rim-catch model for the threads */
  fam?: { copper: number; indigo: number };
  /** a local dark vignette laid behind one frame (0..1): its field reads as dark air */
  vignette?: { frame: number; u: number };
  /** the sharp depth (world z); default just behind the end post */
  focusZ?: number;
  /** blur px per unit of perspective-scale difference from the focus; default 3.6 */
  dof?: number;
  maxBlur?: number;
  /** a floor on every frame's blur (a loom seen as a hazed backdrop never takes the sharp plane) */
  minBlur?: number;
  /** 0..1 the flashback tint (ch05-s05): paler, cooler, softer */
  ghost?: number;
  /** extra copies of each thread (ch05-s05's ghost density, NOT individual weights): mean multiplicity ≥ 1 */
  density?: number;
  /** 0..1 fraction of the (multiplied) threads kept; the rest are gone (ch05-s05's shed) */
  keep?: number;
  /** per-frame kept fraction (overrides keep): ch05-s05 empties whole frames as the ghost loom sheds */
  keepFrame?: (l: number) => number;
  /** 0..1 the real 71-gate chain traced in copper, with a brass notch per gate */
  chain?: number;
  /** 0..1 gate fixtures emphasised (ch05-s02's ribs) */
  ribs?: number;
  /** frames to light (0..1 each): their stiles warm and their knots brighten */
  lit?: Record<number, number>;
  /** one frame's face drawn as its full matrix grid: every cell a dim dot, every stored weight a lit knot */
  lattice?: { frame: number; u: number };
  /** per-arc overrides keyed by SLOT (arcSlots / slotEnds): a moved knot or start (world), an alpha multiplier and a
   *  highlight 0..1; moved arcs are drawn in their own lit pass (ch05-s02's fold and stop) */
  move?: Map<number, { to?: P3; from?: P3; a?: number; hi?: number }>;
  /** per-frame visibility multiplier (dissolves); default all 1 */
  frameAlpha?: (l: number) => number;
  /** frames drawn: [from, to] inclusive (default -1..129) */
  range?: [number, number];
  /** skip the end post (frame -1): a shot that draws its own */
  noPost?: boolean;
  /** fog sheets between the runs (default true) */
  fog?: boolean;
  /** scale on the two fog sheets' density (default 1; ch05-s02 halves it while the camera rides inside the loom) */
  fogScale?: number;
  /** world z subtracted before the haze ladder (a camera riding deep inside the loom: haze by distance, not by z) */
  hazeShift?: number;
  /** 0..1 every frame that carries real gate rows gets a short dark RIB on its right stile, rising from its head rail
   *  (ch05-s02's pull back: the gates stand out along the length like the ribs of a boat) */
  ribBars?: number;
  /** route the chain along the frames' heads (smoothed), not through the gates' own rows (ch05-s02) */
  chainTops?: boolean;
  key?: string;
}
export interface LoomRun {
  /** frames in this run, far to near */
  frames: number[];
  zFar: number;
  zNear: number;
  blur: number;
  spec: LayerSpec;
}
export interface Loom3Hooks {
  /** draw your own objects inside a run (screen px), after the loom's frames of that run */
  run?: (c: C2, env: PaintEnv, r: LoomRun) => void;
  /** after all runs, in the sharp layer (screen px): text plates, glints */
  top?: (c: C2, env: PaintEnv) => void;
}

const BLUR_STEPS = [0, 1.2, 3, 6];
const quantBlur = (b: number) => {
  let best = 0;
  for (const s of BLUR_STEPS) if (Math.abs(s - b) < Math.abs(best - b)) best = s;
  return best;
};

/** the per-frame blur level for a camera and focus */
export function blurOf(l: number, o: Loom3Opts) {
  const fz = o.focusZ ?? 1060;
  const b = (o.dof ?? 3.6) * Math.abs(scaleAt(frameZ(l), o.cam) - scaleAt(fz, o.cam)) + (o.ghost ?? 0) * 1.6;
  return quantBlur(Math.max(o.minBlur ?? 0, Math.min(o.maxBlur ?? 6, b)));
}

/** compute the runs, far to near */
export function loomRuns(o: Loom3Opts): LoomRun[] {
  const [a, b] = o.range ?? [-1, NL - 1];
  const runs: LoomRun[] = [];
  let cur: LoomRun | null = null;
  for (let l = b; l >= a; l--) {
    if (l < 0 && o.noPost) continue;
    // frames behind the camera are not drawn
    if (frameZ(l) - o.cam.z < 60) continue;
    const bl = blurOf(l, o);
    if (!cur || cur.blur !== bl) {
      cur = { frames: [], zFar: frameZ(l), zNear: frameZ(l), blur: bl, spec: { id: '', z: 0, haze: 0, blur: bl } };
      runs.push(cur);
    }
    cur.frames.push(l);
    cur.zNear = frameZ(l);
  }
  runs.forEach((r, i) => {
    const z = (r.zFar + r.zNear) / 2;
    r.spec = r.blur === 0 ? { id: 'L4', z: 1000, haze: 0.03, blur: 0 } : { id: `loom3-${i}`, z: Math.round(z), haze: hazeAt(z - (o.hazeShift ?? 0)), blur: r.blur };
  });
  return runs;
}

/** paint the loom as depth runs (call after the backlight / far room, before your near layers) */
export function loom3(f: Frame, o: Loom3Opts, hooks: Loom3Hooks = {}) {
  const runs = loomRuns(o);
  let fogA = o.fog === false, fogB = o.fog === false;
  let sharpDone = false;
  const fs = o.fogScale ?? 1;
  const fogSheet = (k: 'A' | 'B') =>
    fs === 1 ? f.fog(k) : fs > 0.01 && f.fog(k === 'A' ? { yCenter: 432, height: 288, alpha: 0.3 * fs, drift: 6 } : { yCenter: 504, height: 158.4, alpha: 0.12 * fs, drift: 10 });
  const zs = o.hazeShift ?? 0;
  for (const r of runs) {
    if (!fogA && r.zNear - zs < 2300) {
      fogSheet('A');
      fogA = true;
    }
    if (!fogB && r.zNear - zs < 1350) {
      fogSheet('B');
      fogB = true;
    }
    f.layer(r.spec, (c, env) => {
      c.save();
      screenSpace(c, r.spec, o.cam);
      paintRun(c, env, o, r.frames);
      hooks.run?.(c, env, r);
      if (r.blur === 0 && !sharpDone) {
        sharpDone = true;
      }
      c.restore();
    });
  }
  if (!fogA) fogSheet('A');
  if (!fogB) fogSheet('B');
  if (o.chain || hooks.top) {
    f.layer('L4', (c, env) => {
      c.save();
      screenSpace(c, LAYER_L4, o.cam);
      if (o.chain) paintChain(c, env, o);
      hooks.top?.(c, env);
      c.restore();
    });
  }
}
const PUPPET_INK = '#0b0d0b';
const LAYER_L4: LayerSpec = { id: 'L4', z: 1000, haze: 0.03, blur: 0 };

/** the whole loom in one context (screen px, no blur split): for f.cached bakes */
export function loom3Flat(c: C2, env: PaintEnv, o: Loom3Opts) {
  const [a, b] = o.range ?? [-1, NL - 1];
  const frames: number[] = [];
  for (let l = b; l >= a; l--) if (!(l < 0 && o.noPost) && frameZ(l) - o.cam.z >= 60) frames.push(l);
  paintRun(c, env, o, frames);
  if (o.chain) paintChain(c, env, o);
}

// ---------------------------------------------------------------- painters
const hashU = (i: number, s: number) => {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(s + 17, 0xc2b2ae35);
  h ^= h >>> 13;
  h = Math.imul(h, 0x27d4eb2d);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
};

function paintRun(c: C2, env: PaintEnv, o: Loom3Opts, frames: number[]) {
  const cam = o.cam;
  const th = o.threads ?? 1;
  const ghost = o.ghost ?? 0;
  const cu = clamp01(o.copper ?? 0), iu = clamp01(o.indigo ?? 0);
  const keep = o.keep ?? 1;
  const dens = Math.max(1, o.density ?? 1);
  const shimmer = o.tq !== undefined ? 0.06 * Math.sin(o.tq * 2.1) : 0;
  for (const l of frames) {
    const z = frameZ(l);
    const fa = clamp01(o.frameAlpha ? o.frameAlpha(l) : 1);
    if (fa <= 0.002) continue;
    const zh = z - (o.hazeShift ?? 0);
    const k = inks(env, zh, ghost);
    const s = scaleAt(z, cam);
    // the lattice frame's dark gauze goes up first, so the threads arriving at its knots read across it
    if (o.vignette && o.vignette.frame === l && o.vignette.u > 0) vignette(c, env, o, l, s, clamp01(o.vignette.u));
    if (o.lattice && o.lattice.frame === l && o.lattice.u > 0) gauze(c, env, o, l, s, clamp01(o.lattice.u) * fa);
    // ---- threads into this frame (one per stored weight), drawn before the frame so its stiles cross them
    if (l >= 0 && th > 0) {
      const [k0, k1] = arcSlots(l);
      const keepL = o.keepFrame ? clamp01(o.keepFrame(l)) : keep;
      const lit = o.lit?.[l] ?? 0;
      for (const sign of [-1, 1]) {
        const famL = o.fam ? clamp01(sign > 0 ? o.fam.copper : o.fam.indigo) : -1;
        const catchU = famL >= 0 ? Math.max(0, famL - 0.6) / 0.4 : sign > 0 ? cu : iu;
        const base = (0.26 + 0.1 * (1 - hazeAt(zh))) * (1 - ghost * 0.35);
        const a =
          famL >= 0
            ? th * fa * Math.min(0.95, 0.85 * famL * (0.55 + 0.45 * (1 - hazeAt(zh) / 0.62)) + lit * 0.3 + shimmer * 0.2)
            : th * fa * Math.min(0.95, base + catchU * 0.36 + lit * 0.3 + shimmer * 0.4);
        if (a <= 0.003) continue;
        const col = famL >= 0 ? (sign > 0 ? k.copper : k.indigo) : sign > 0 ? mixLab(k.copper, '#ffc890', catchU * 0.35) : mixLab(k.indigo, '#a8c4ff', catchU * 0.35);
        const lw = Math.max(0.45, Math.min(1.3, 0.6 * s)) * (1 + catchU * 0.3);
        const path = new Path2D();
        let n = 0;
        for (let q = k0; q < k1; q++) {
          if (ASG[q] !== sign) continue;
          if (o.move && o.move.has(q)) continue;
          const copies = dens > 1 ? Math.floor(dens) + (hashU(q, 5) < dens - Math.floor(dens) ? 1 : 0) : 1;
          for (let cp = 0; cp < copies; cp++) {
            if (keepL < 1 && hashU(q * 7 + cp, 11) >= keepL) continue;
            const s0 = scaleAt(AZ0[q], cam), s1 = scaleAt(AZ1[q], cam);
            const jy = cp ? (hashU(q * 13 + cp, 3) - 0.5) * 26 : 0;
            const jx = cp ? (hashU(q * 17 + cp, 4) - 0.5) * frameW(l) * 0.7 : 0;
            const x0 = 640 + (AX0[q] - cam.x) * s0, y0 = 360 + (AY0[q] + jy * 0.4 - cam.y) * s0;
            const x1 = 640 + (AX1[q] + jx - cam.x) * s1, y1 = 360 + (AY1[q] + jy - cam.y) * s1;
            const len = Math.abs(x1 - x0) + Math.abs(y1 - y0);
            path.moveTo(x0, y0);
            path.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + Math.min(14, len * 0.045), x1, y1);
            n++;
          }
        }
        if (!n) continue;
        c.strokeStyle = withAlpha(col, a);
        c.lineWidth = lw;
        c.stroke(path);
        // catching the rim: the same threads glow (additive, wider, faint)
        // (per-family mode: the hue itself carries the lift; only a faint glow so indigo never washes to white)
        const glow = famL >= 0 ? (sign > 0 ? catchU * 0.25 : catchU * 0.12) + lit * 0.35 : catchU * 0.5 + lit * 0.35;
        if (glow > 0.02) {
          c.globalCompositeOperation = 'lighter';
          c.strokeStyle = withAlpha(col, Math.min(0.5, 0.22 * glow * th * fa));
          c.lineWidth = lw * 2.6;
          c.stroke(path);
          c.globalCompositeOperation = 'source-over';
        }
      }
    }
    if (o.move && l >= 0) movedArcs(c, env, o, l, k, fa);
    paintFrame(c, env, o, l, k, s, fa);
  }
}

function paintFrame(c: C2, env: PaintEnv, o: Loom3Opts, l: number, k: ReturnType<typeof inks>, s: number, fa: number) {
  const cam = o.cam;
  const z = frameZ(l);
  const X = frameX(l), w = frameW(l), h = frameH(l);
  const cx = 640 + (X - cam.x) * s;
  const top = 360 + (LOOM.yc - h / 2 - cam.y) * s;
  const bot = 360 + (LOOM.yc + h / 2 - cam.y) * s;
  const floor = 360 + (LOOM.floor - cam.y) * s;
  const half = (w / 2) * s;
  if (cx + half < -40 || cx - half > 1320) return;
  const lit = clamp01(o.lit?.[l] ?? 0);
  const ghost = o.ghost ?? 0;
  c.save();
  c.globalAlpha = fa;
  if (l < 0) {
    // THE END POST (the 234 source cells): a turned post with a pierced cell column down its face
    const pw = 26 * s;
    c.fillStyle = k.frame;
    c.beginPath();
    c.rect(cx - pw / 2, top - 30 * s, pw, floor - top + 30 * s);
    c.ellipse(cx, top - 34 * s, 16 * s, 11 * s, 0, 0, Math.PI * 2);
    c.rect(cx - 20 * s, top - 26 * s, 40 * s, 8 * s);
    c.rect(cx - 22 * s, floor - 14 * s, 44 * s, 14 * s);
    c.fill();
    // the cells: a slot of tiny holes (backlight through)
    c.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.3), 0.55 * (1 - ghost * 0.4));
    const n = 39;
    for (let i = 0; i < n; i++) {
      const yy = top + ((bot - top) * (i + 0.5)) / n;
      c.fillRect(cx + 4 * s, yy, Math.max(0.6, 3 * s), Math.max(0.6, 2.2 * s));
    }
    c.strokeStyle = withAlpha(k.rail, 0.7);
    c.lineWidth = Math.max(0.6, 1.1 * s);
    c.beginPath();
    c.moveTo(cx - pw / 2, top - 30 * s);
    c.lineTo(cx - pw / 2, floor - 14 * s);
    c.stroke();
    c.restore();
    return;
  }
  const L = CIRCUIT.layers[l];
  const sw = Math.max(0.7, 2.6 * s);
  // gate fixtures BEHIND the frame (half in haze), each on its own row off the right stile: a small hinged ReLU ramp
  // per ReGLU, a toothed detent wheel per boolean row
  const ribs = clamp01(o.ribs ?? 0);
  const rows = GATE_ROWS[l];
  if (rows.length && s > 0.16) {
    const gx = cx + half + 2.5 * s;
    const ramp = Math.max(1.4, 5 * s) * (1 + ribs * 0.5);
    c.strokeStyle = withAlpha(mixLab(k.gate, env.mood.rim, ribs * 0.55), Math.min(1, 0.5 + ribs * 0.45));
    c.lineWidth = Math.max(0.4, 0.8 * s) * (1 + ribs * 0.7);
    c.beginPath();
    for (const r of rows) {
      const yy = 360 + (rowY(l, r) - cam.y) * s;
      if (KIND[LAYER_START[l] + r] === '2') {
        const rr = ramp * 0.5;
        c.moveTo(gx + ramp * 0.5 + rr, yy);
        c.arc(gx + ramp * 0.5, yy, rr, 0, Math.PI * 2);
        for (let tt = 0; tt < 6; tt++) {
          const an = (tt / 6) * Math.PI * 2;
          c.moveTo(gx + ramp * 0.5 + Math.cos(an) * rr, yy + Math.sin(an) * rr);
          c.lineTo(gx + ramp * 0.5 + Math.cos(an) * rr * 1.5, yy + Math.sin(an) * rr * 1.5);
        }
      } else {
        c.moveTo(gx, yy + ramp * 0.35);
        c.lineTo(gx + ramp * 0.45, yy + ramp * 0.35);
        c.lineTo(gx + ramp, yy - ramp * 0.45);
      }
    }
    c.stroke();
  }
  // the ribs (ch05-s02): a short heavy dark bar up the right stile from the head rail, on every gate-carrying frame
  const rb = clamp01(o.ribBars ?? 0);
  if (rb > 0 && rows.length) {
    const rw = Math.max(1.3, 5 * s);
    const r0 = top - sw * 1.8 - Math.max(6, 46 * s);
    const r1 = top + (bot - top) * 0.3;
    c.fillStyle = withAlpha(PUPPET_INK, 0.92 * rb);
    c.fillRect(cx + half, r0, rw, r1 - r0);
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.75 * rb);
    c.lineWidth = Math.max(0.6, 1.2 * s);
    c.beginPath();
    c.moveTo(cx + half, r1);
    c.lineTo(cx + half, r0);
    c.lineTo(cx + half + rw, r0);
    c.stroke();
  }
  // the frame: two stiles, head and foot rails, two legs to the floor
  c.fillStyle = k.frame;
  c.beginPath();
  c.rect(cx - half - sw, top - sw, sw, floor - top + sw);
  c.rect(cx + half, top - sw, sw, floor - top + sw);
  c.rect(cx - half - sw * 1.6, top - sw * 1.8, 2 * half + sw * 3.2, sw * 1.3);
  c.rect(cx - half - sw, bot, 2 * half + sw * 2, sw);
  // a single cross-rail low down (the treadle bar)
  c.rect(cx - half, bot + (floor - bot) * 0.55, 2 * half, Math.max(0.5, sw * 0.6));
  c.fill();
  // inner heddle rules (the paper lattice): faint
  const hed = Math.max(2, Math.round(h / 46));
  c.fillStyle = withAlpha(k.frame, 0.4);
  for (let i = 1; i < hed; i++) c.fillRect(cx - half, top + ((bot - top) * i) / hed, 2 * half, Math.max(0.4, 0.7 * s));
  // the backlight catching the head rail (and, when lit, the stiles)
  c.strokeStyle = withAlpha(mixLab(k.rail, env.mood.core, lit * 0.6), 0.55 + lit * 0.4);
  c.lineWidth = Math.max(0.5, 1.2 * s) * (1 + lit);
  c.beginPath();
  c.moveTo(cx - half - sw * 1.6, top - sw * 1.8);
  c.lineTo(cx + half + sw * 1.6, top - sw * 1.8);
  if (lit > 0) {
    c.moveTo(cx - half - sw, top);
    c.lineTo(cx - half - sw, bot);
    c.moveTo(cx + half + sw, top);
    c.lineTo(cx + half + sw, bot);
  }
  c.stroke();
  // the matrix face: a dark gauze stretched in the frame, so its cells read as dark air
  const lat = o.lattice && o.lattice.frame === l ? clamp01(o.lattice.u) : 0;
  // knots: one per stored weight, where its thread is tied to the frame's face
  const emptied = o.keepFrame ? o.keepFrame(l) <= 0 : false;
  if ((s > 0.3 || lit > 0 || lat > 0) && !emptied) {
    const [k0, k1] = arcSlots(l);
    const ks = Math.max(0.6, 1.6 * s) * (1 + lat * 0.8);
    for (const sign of [-1, 1]) {
      c.fillStyle = withAlpha(mixLab(sign > 0 ? mixLab(k.copper, '#ffc890', 0.3) : mixLab(k.indigo, '#a8c4ff', 0.3), env.mood.core, 0.1 + lit * 0.2), Math.min(1, 0.6 + lit * 0.3 + lat * 0.4));
      c.beginPath();
      for (let q = k0; q < k1; q++) {
        if (ASG[q] !== sign) continue;
        if (o.move && o.move.has(q)) continue;
        const x = 640 + (AX1[q] - cam.x) * s, y = 360 + (AY1[q] - cam.y) * s;
        c.rect(x - ks / 2, y - ks / 2, ks, ks);
      }
      c.fill();
    }
  }
  // the matrix grid: every cell (row × distinct input) a dim point; mostly empty air
  if (lat > 0) {
    const cols = INPUTS[l].length, rows = L.operations;
    const wIn = w * 0.86 * s;
    const h9 = h * 0.9 * s;
    const y0 = 360 + (LOOM.yc - (h * 0.9) / 2 - cam.y) * s;
    const x0 = cx - wIn / 2;
    c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.haze, 0.2), 0.42 * lat);
    const d = Math.max(0.9, Math.min(1.8, (wIn / cols) * 0.5));
    c.beginPath();
    for (let r = 0; r < rows; r++) {
      const yy = y0 + (h9 * (r + 0.5)) / rows;
      for (let j = 0; j < cols; j++) c.rect(x0 + (wIn * (j + 0.5)) / cols - d / 2, yy - d / 2, d, d);
    }
    c.fill();
  }
  c.restore();
}

/** the overridden arcs of reading frame l: drawn lit, at their moved ends, with their knots */
function movedArcs(c: C2, env: PaintEnv, o: Loom3Opts, l: number, k: ReturnType<typeof inks>, fa: number) {
  const cam = o.cam;
  const [k0, k1] = arcSlots(l);
  for (let q = k0; q < k1; q++) {
    const m = o.move!.get(q);
    if (!m) continue;
    const a = clamp01(m.a ?? 1) * fa;
    if (a <= 0.003) continue;
    const p0 = project(m.from ?? { x: AX0[q], y: AY0[q], z: AZ0[q] }, cam);
    const p1 = project(m.to ?? { x: AX1[q], y: AY1[q], z: AZ1[q] }, cam);
    const hi = clamp01(m.hi ?? 0);
    const col = ASG[q] > 0 ? mixLab(k.copper, '#ffd2a0', 0.25 + hi * 0.35) : mixLab(k.indigo, '#b8d0ff', 0.25 + hi * 0.35);
    const len = Math.abs(p1.x - p0.x) + Math.abs(p1.y - p0.y);
    c.save();
    c.lineCap = 'round';
    for (const pass of [0, 1]) {
      c.globalCompositeOperation = pass ? 'source-over' : 'lighter';
      c.strokeStyle = withAlpha(col, pass ? Math.min(1, 0.5 + hi * 0.5) * a : 0.32 * hi * a);
      c.lineWidth = Math.max(0.8, 1.1 * p1.s) * (pass ? 1 + hi * 1.4 : 5);
      c.beginPath();
      c.moveTo(p0.x, p0.y);
      c.quadraticCurveTo((p0.x + p1.x) / 2, (p0.y + p1.y) / 2 + Math.min(14, len * 0.045), p1.x, p1.y);
      c.stroke();
    }
    const ks = Math.max(1, 2.2 * p1.s) * (1 + hi * 0.6);
    c.fillStyle = withAlpha(mixLab(col, env.mood.core, 0.2), Math.min(1, 0.7 + hi * 0.3) * a);
    c.fillRect(p1.x - ks / 2, p1.y - ks / 2, ks, ks);
    c.restore();
  }
}

/** a soft dark pool laid behind frame l (everything further back sinks), so its face reads against dark air */
function vignette(c: C2, env: PaintEnv, o: Loom3Opts, l: number, s: number, u: number) {
  const cam = o.cam;
  const cx = 640 + (frameX(l) - cam.x) * s, cy = 360 + (LOOM.yc - cam.y) * s;
  const r = Math.max(frameH(l), frameW(l)) * s * 1.6;
  const ink = mixLab(env.mood.ink, '#000000', 0.4);
  // the whole field behind sinks a little, and a pool behind the frame itself at 0.5
  c.fillStyle = withAlpha(ink, 0.28 * u);
  c.fillRect(-40, -40, 1360, 800);
  const g = c.createRadialGradient(cx, cy, r * 0.15, cx, cy, r);
  g.addColorStop(0, withAlpha(ink, 0.5 * u));
  g.addColorStop(0.55, withAlpha(ink, 0.4 * u));
  g.addColorStop(1, withAlpha(ink, 0));
  c.fillStyle = g;
  c.fillRect(cx - r, cy - r, 2 * r, 2 * r);
}

/** a frame's face as a dark gauze (its matrix's field of dark air) */
function gauze(c: C2, env: PaintEnv, o: Loom3Opts, l: number, s: number, u: number) {
  const cam = o.cam;
  const cx = 640 + (frameX(l) - cam.x) * s;
  const h = frameH(l);
  const top = 360 + (LOOM.yc - h / 2 - cam.y) * s, bot = 360 + (LOOM.yc + h / 2 - cam.y) * s;
  const wIn = frameW(l) * 0.94 * s;
  c.fillStyle = withAlpha(mixLab(env.mood.ink, env.mood.set, 0.3), 0.8 * u);
  c.fillRect(cx - wIn / 2, top, wIn, bot - top);
}

/** the real longest gate chain, as one copper line through the frames (a brass notch on each gate) */
function paintChain(c: C2, env: PaintEnv, o: Loom3Opts) {
  const u = clamp01(o.chain ?? 0);
  if (u <= 0) return;
  const pv = GATE_CHAIN.packedValues;
  const n = pv.length;
  const upto = u * (n - 1);
  const pts = pv.map((v) => project(o.chainTops ? chainTopPt(v) : exitPt(v), o.cam));
  const cop = mixLab(OS_COLORS.copper, '#f0a060', 0.45);
  c.save();
  c.lineJoin = 'round';
  c.lineCap = 'round';
  // glow under, then the line
  for (const pass of [0, 1]) {
    c.strokeStyle = pass ? withAlpha(cop, 0.95) : withAlpha(mixLab(cop, env.mood.core, 0.3), 0.3);
    c.lineWidth = pass ? 2 : 6;
    c.beginPath();
    for (let i = 0; i <= Math.floor(upto); i++) {
      if (i === 0) c.moveTo(pts[i].x, pts[i].y);
      else c.lineTo(pts[i].x, pts[i].y);
    }
    const fi = Math.floor(upto);
    if (fi < n - 1) {
      const fr = upto - fi;
      c.lineTo(pts[fi].x + (pts[fi + 1].x - pts[fi].x) * fr, pts[fi].y + (pts[fi + 1].y - pts[fi].y) * fr);
    }
    c.stroke();
  }
  // brass notches, one per gate on the chain (no numerals)
  const brass = mixLab('#b08d4a', env.mood.core, 0.35);
  for (const i of CHAIN_GATES) {
    if (i > upto) break;
    const p = pts[i];
    const r = Math.max(3.4, 5 * p.s);
    c.fillStyle = brass;
    c.beginPath();
    c.moveTo(p.x - r, p.y - r * 1.6);
    c.lineTo(p.x + r, p.y - r * 1.6);
    c.lineTo(p.x, p.y + r * 0.2);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(PUPPET_INK, 0.6);
    c.lineWidth = 0.6;
    c.stroke();
  }
  c.restore();
}

/** the frames' heads, smoothed over ±5 frames (so a line along them never swings with each frame's height) */
const TOPS_SMOOTH: number[] = (() => {
  const raw = CIRCUIT.layers.map((_, l) => LOOM.yc - frameH(l) / 2);
  return raw.map((_, l) => {
    let a = 0, n = 0;
    for (let k = Math.max(0, l - 5); k <= Math.min(NL - 1, l + 5); k++) {
      a += raw[k];
      n++;
    }
    return a / n;
  });
})();
/** a chain value's point on the line along the frames' heads (at its frame's right stile, where its rib stands) */
function chainTopPt(v: number): P3 {
  const l = layerOf(v);
  if (l < 0) return { x: frameX(-1), y: TOPS_SMOOTH[0] - 30, z: frameZ(-1) };
  return { x: frameX(l) + frameW(l) / 2 + 2, y: TOPS_SMOOTH[l] - 30, z: frameZ(l) };
}

/** the chain's gate points on screen (for shots that time ticks to them) */
export const chainPoints = (cam: Camera3) => GATE_CHAIN.packedValues.map((v) => project(exitPt(v), cam));

// ---------------------------------------------------------------- loom → wallpaper (ch05-s04)
export interface WallRect {
  x: number;
  y: number;
  w: number;
  h: number;
}
/**
 * Each thread becomes its own wallpaper arc: u = 0 the loom's thread (projected with cam), u = 1 the arc that
 * src/handwiredos/wiring.ts draws for the same weight (from the value it reads to the operation that reads it, the
 * upper half of an ellipse standing on rect's bottom edge), in screen px. Per-arc stagger so the change ripples
 * left to right in reading order.
 */
export function loomToWallpaper(c: C2, env: PaintEnv, cam: Camera3, u: number, r: WallRect, o: { alpha?: number; adds?: string; subs?: string; lineWidth?: number } = {}) {
  const base = r.y + r.h;
  const hpr = Math.min(r.h / (r.w / 2), 1.25);
  const adds = o.adds ?? mixLab(OS_COLORS.copper, env.mood.halo, 0.15);
  const subs = o.subs ?? mixLab(OS_COLORS.indigo, env.mood.set, 0.2);
  c.save();
  c.lineWidth = o.lineWidth ?? Math.max(0.35, (r.w / 1232) * 0.5);
  for (const sign of [-1, 1]) {
    c.strokeStyle = withAlpha(sign > 0 ? adds : subs, o.alpha ?? 0.14);
    c.beginPath();
    let n = 0;
    for (let q = 0; q < NA; q++) {
      if (ASG[q] !== sign) continue;
      const i = AID[q];
      const a = CIRCUIT.arcs[i];
      const fx = valueX(a[0]);
      const v = clamp01((u - fx * 0.35) / 0.65);
      const e = v * v * (3 - 2 * v);
      // the loom thread (straight, slight droop)
      const s0 = scaleAt(AZ0[q], cam), s1 = scaleAt(AZ1[q], cam);
      const lx0 = 640 + (AX0[q] - cam.x) * s0, ly0 = 360 + (AY0[q] - cam.y) * s0;
      const lx1 = 640 + (AX1[q] - cam.x) * s1, ly1 = 360 + (AY1[q] - cam.y) * s1;
      // the wallpaper arc (a semi-ellipse as a cubic: control points 4/3 of its height above both ends)
      const wx0 = r.x + fx * r.w, wx1 = r.x + valueX(a[1]) * r.w;
      const rad = Math.max(0.5, (wx1 - wx0) / 2);
      const hh = rad * hpr * (4 / 3);
      const x0 = lx0 + (wx0 - lx0) * e, y0 = ly0 + (base - ly0) * e;
      const x1 = lx1 + (wx1 - lx1) * e, y1 = ly1 + (base - ly1) * e;
      const sag = Math.min(14, (Math.abs(lx1 - lx0) + Math.abs(ly1 - ly0)) * 0.045) * (1 - e);
      const c1x = x0 + (x1 - x0) / 3, c1y = y0 + (y1 - y0) / 3 + sag - hh * e;
      const c2x = x0 + ((x1 - x0) * 2) / 3, c2y = y0 + ((y1 - y0) * 2) / 3 + sag - hh * e;
      c.moveTo(x0, y0);
      c.bezierCurveTo(c1x, c1y, c2x, c2y, x1, y1);
      if (++n > 1200) {
        c.stroke();
        c.beginPath();
        n = 0;
      }
    }
    c.stroke();
  }
  c.restore();
}
