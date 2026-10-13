/**
 * Trees and forests (recursive branching; bare winter trees are the priority).
 *
 *   tree(c, { x, y, h, kind, seed?, leaves?, snow?, lean?, detail?, role? }, env)
 *       (x,y) = base of the trunk; h = height. kind:
 *       'oak' (wide, gnarled) | 'elm' (vase-shaped, campus) | 'birch' (slender, weeping twigs) |
 *       'willow' (arching, hanging strands) | 'pine' (tiered spruce) | 'sapling'
 *       leaves 0..1 adds foliage clumps at the twig ends (a fixed, GPU-safe circle budget scaled by detail);
 *       snow 0..1 lays snow on the upper sides of
 *       limbs (and on spruce tiers); detail 0..1 trims recursion depth for far layers.
 *   treeGeom(opts) -> { wood, leaves, snow, bounds }   cached Path2Ds at the origin (base at 0,0)
 *   forestBand(c, { x0, x1, y, h, kind?: 'bare'|'pine'|'mixed'|'leafy', density?, seed?, snow?, ground? }, env)
 *       a band of small trees on a ground strip (for L1/L2 distances); one cached path.
 */
import type { FillRole, Painter } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import { addCircle, addPolyWound } from '../ornament';
import { keyOf, memo, rng, type Pt } from '../architecture/common';
import { fbm1 } from './noise';

export type TreeKind = 'oak' | 'elm' | 'birch' | 'willow' | 'pine' | 'sapling';
export interface TreeOpts {
  x: number;
  y: number;
  h: number;
  kind?: TreeKind;
  seed?: number;
  leaves?: number;
  snow?: number;
  /** trunk lean in radians (+ = right) */
  lean?: number;
  detail?: number;
  role?: FillRole;
}

interface KindParams {
  depth: number;
  trunkW: number; // fraction of h
  trunkLen: number; // fraction of h
  kids: [number, number];
  spread: number;
  ratio: number;
  gnarl: number;
  up: number; // tropism toward vertical
  droop: number; // gravity at the tips
  taper: number;
  leader: number; // probability the branch continues straight on
}
const KINDS: Record<Exclude<TreeKind, 'pine'>, KindParams> = {
  oak: { depth: 8, trunkW: 0.075, trunkLen: 0.3, kids: [2, 3], spread: 0.72, ratio: 0.7, gnarl: 0.45, up: 0.07, droop: 0.015, taper: 0.62, leader: 0.55 },
  elm: { depth: 8, trunkW: 0.06, trunkLen: 0.34, kids: [2, 3], spread: 0.36, ratio: 0.74, gnarl: 0.2, up: 0.06, droop: 0.1, taper: 0.66, leader: 0.7 },
  birch: { depth: 7, trunkW: 0.032, trunkLen: 0.3, kids: [2, 3], spread: 0.7, ratio: 0.58, gnarl: 0.16, up: 0.03, droop: 0.22, taper: 0.7, leader: 0.95 },
  willow: { depth: 7, trunkW: 0.07, trunkLen: 0.28, kids: [2, 3], spread: 0.6, ratio: 0.74, gnarl: 0.3, up: 0.05, droop: 0.4, taper: 0.66, leader: 0.6 },
  sapling: { depth: 6, trunkW: 0.03, trunkLen: 0.35, kids: [2, 2], spread: 0.55, ratio: 0.68, gnarl: 0.3, up: 0.06, droop: 0.05, taper: 0.66, leader: 0.8 },
};

export interface TreeGeom {
  wood: Path2D;
  leaves: Path2D;
  snow: Path2D;
  bounds: { x: number; y: number; w: number; h: number };
}
const treeCache = new Map<string, TreeGeom>();

export function treeGeom(o: Omit<TreeOpts, 'x' | 'y' | 'role'>): TreeGeom {
  return memo(treeCache, keyOf({ ...o }), () => (o.kind === 'pine' ? buildPine(o) : buildTree(o)), 300);
}

function buildTree(o: Omit<TreeOpts, 'x' | 'y' | 'role'>): TreeGeom {
  const kind = (o.kind ?? 'oak') as Exclude<TreeKind, 'pine'>;
  const K = KINDS[kind];
  const R = rng(o.seed ?? 1, 77);
  const wood = new Path2D();
  const leaves = new Path2D();
  const snow = new Path2D();
  const maxDepth = Math.max(3, Math.round(K.depth * (0.55 + 0.45 * (o.detail ?? 1))));
  const leafAmt = o.leaves ?? 0;
  const snowAmt = o.snow ?? 0;
  let minX = 0;
  let maxX = 0;
  let minY = 0;
  const tips: [number, number, number][] = [];
  const grow = (x: number, y: number, ang: number, len: number, w: number, depth: number) => {
    const segs = depth < 2 ? 7 : depth < 4 ? 5 : 3;
    const pts: Pt[] = [[x, y]];
    const ws: number[] = [w];
    const angs: number[] = [ang];
    let a = ang;
    const wEnd = Math.max(0.3, w * K.taper);
    for (let s = 1; s <= segs; s++) {
      const t = s / segs;
      a += (R() - 0.5) * K.gnarl * (depth === 0 ? 0.35 : 1);
      // tropisms: up toward -PI/2, droop toward +PI/2 grows with depth
      a += (-Math.PI / 2 - a) * K.up;
      a += (Math.PI / 2 - a) * K.droop * (depth / maxDepth) ** 2 * 0.35;
      const sl = len / segs;
      x += Math.cos(a) * sl;
      y += Math.sin(a) * sl;
      pts.push([x, y]);
      ws.push(w + (wEnd - w) * t);
      angs.push(a);
    }
    // flare the trunk base (root buttress)
    if (depth === 0) {
      const fl: Pt[] = [];
      for (let k = 0; k <= 8; k++) {
        const t = k / 8;
        fl.push([pts[0][0] - w * (0.48 + 0.75 * (1 - t) ** 3), pts[0][1] + 1 - t * len * 0.18]);
      }
      for (let k = 8; k >= 0; k--) {
        const t = k / 8;
        fl.push([pts[0][0] + w * (0.48 + 0.8 * (1 - t) ** 3), pts[0][1] + 1 - t * len * 0.18]);
      }
      addPolyWound(wood, fl);
    }
    // the limb polygon
    const L: Pt[] = [];
    const Rr: Pt[] = [];
    for (let i = 0; i < pts.length; i++) {
      const aa = angs[i];
      const nx = Math.sin(aa) * ws[i] * 0.5;
      const ny = -Math.cos(aa) * ws[i] * 0.5;
      L.push([pts[i][0] + nx, pts[i][1] + ny]);
      Rr.push([pts[i][0] - nx, pts[i][1] - ny]);
      minX = Math.min(minX, pts[i][0]);
      maxX = Math.max(maxX, pts[i][0]);
      minY = Math.min(minY, pts[i][1]);
    }
    addPolyWound(wood, [...L, ...Rr.reverse()]);
    // snow on the upper side of near-horizontal, thick-enough limbs
    if (snowAmt > 0 && w > 0.9) {
      for (let i = 0; i < pts.length - 1; i++) {
        const aa = angs[i + 1];
        const horiz = Math.abs(Math.cos(aa));
        if (horiz < 0.45) continue;
        const th = ws[i] * 0.55 * snowAmt * horiz;
        if (th < 0.35) continue;
        const [x0, y0] = pts[i];
        const [x1, y1] = pts[i + 1];
        const up0 = y0 - ws[i] * 0.45;
        const up1 = y1 - ws[i + 1] * 0.45;
        addPolyWound(snow, [[x0, up0 + 0.3], [x1, up1 + 0.3], [x1, up1 - th], [x0, up0 - th]]);
      }
    }
    if (depth >= maxDepth) {
      if (leafAmt > 0) tips.push([x, y, len]);
      if (kind === 'willow') {
        // hanging strands
        const sl = len * (2 + R() * 3);
        addPolyWound(wood, [[x - 0.3, y], [x + 0.3, y], [x + 0.6 + R() * 2, y + sl], [x + 0.2 + R() * 2, y + sl]]);
      }
      return;
    }
    // children
    const nk = K.kids[0] + Math.floor(R() * (K.kids[1] - K.kids[0] + 1));
    if (depth === 0) {
      // a crotch wedge so the main limbs grow out of the trunk instead of stepping down from it
      const e = pts.length - 1;
      const aa = angs[e];
      const hw = ws[e] * 0.5;
      const ex = pts[e][0];
      const ey = pts[e][1];
      addPolyWound(wood, [[ex + Math.sin(aa) * hw * 1.05, ey - Math.cos(aa) * hw * 1.05], [ex + Math.cos(aa) * ws[e] * 0.9, ey + Math.sin(aa) * ws[e] * 0.9], [ex - Math.sin(aa) * hw * 1.05, ey + Math.cos(aa) * hw * 1.05], [pts[e - 1][0], pts[e - 1][1]]]);
    }
    const childDepth = depth + 1;
    for (let k = 0; k < nk; k++) {
      const t = depth === 0 ? 1 : 0.4 + 0.6 * ((k + R() * 0.8) / nk);
      const i = Math.min(pts.length - 1, Math.max(1, Math.round(t * (pts.length - 1))));
      const side = k % 2 === 0 ? 1 : -1;
      let ca = angs[i] + side * K.spread * (0.55 + 0.6 * R());
      if (kind === 'elm' && depth === 0) ca = -Math.PI / 2 + (k - (nk - 1) / 2) * 0.5 + (R() - 0.5) * 0.2;
      const cl = len * K.ratio * (0.75 + 0.45 * R()) * (depth === 0 && kind === 'oak' ? 1.25 : 1);
      grow(pts[i][0], pts[i][1], ca, cl, ws[i] * (depth === 0 ? 0.74 : 0.62) + ws[i] * 0.12 * R(), childDepth);
    }
    if (depth > 0 && R() < K.leader) {
      const end = pts[pts.length - 1];
      grow(end[0], end[1], angs[angs.length - 1] + (R() - 0.5) * 0.3, len * K.ratio * 0.9, wEnd, childDepth);
    }
  };
  const lean = o.lean ?? 0;
  const trunkLen = o.h * K.trunkLen;
  const scale = kind === 'birch' ? 1 : 1;
  grow(0, 0, -Math.PI / 2 + lean, trunkLen * scale, o.h * K.trunkW, 0);
  // birch: a long single leader up the middle
  if (kind === 'birch') grow(0, -trunkLen, -Math.PI / 2 + lean * 1.2, o.h * 0.5, o.h * K.trunkW * 0.6, 2);
  // foliage: a fixed circle budget (a GPU-safe path) spread over the twig ends; sparser tips get
  // bigger clumps so the crown stays closed, plus a few flecks so its edge stays lacy
  if (leafAmt > 0 && tips.length) {
    const budget = Math.max(60, (220 + 900 * leafAmt) * (o.detail ?? 1) ** 1.5);
    const per = 2 + Math.round(leafAmt * 2);
    const stride = Math.max(1, (tips.length * per) / budget);
    const grow2 = Math.min(1.7, Math.sqrt(stride));
    const rMax = o.h * 0.032;
    const LR = rng((o.seed ?? 1) * 7 + 3, 5);
    for (let f = 0; f < tips.length; f += stride) {
      const [x, y, len] = tips[Math.floor(f)];
      for (let k = 0; k < per; k++) {
        const r = Math.min(rMax * (0.6 + 0.4 * LR()), len * (0.22 + 0.32 * LR()) * (0.7 + leafAmt * 0.5) * grow2);
        addCircle(leaves, x + (LR() - 0.5) * Math.min(len * 1.3 * grow2, rMax * 3), y + (LR() - 0.65) * Math.min(len * 1.1 * grow2, rMax * 2.6), r);
      }
      if (LR() < 0.5) {
        const a = LR() * Math.PI * 2;
        const d = Math.min(len * (0.9 + LR() * 0.6) * grow2, rMax * 2.2);
        addCircle(leaves, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, Math.max(0.6, Math.min(rMax * 0.3, len * 0.12 * (0.6 + LR()) * grow2)));
      }
    }
  }
  return { wood, leaves, snow, bounds: { x: minX, y: minY, w: maxX - minX, h: -minY } };
}

function buildPine(o: Omit<TreeOpts, 'x' | 'y' | 'role'>): TreeGeom {
  const R = rng(o.seed ?? 1, 91);
  const wood = new Path2D();
  const snow = new Path2D();
  const h = o.h;
  const w = h * 0.42;
  const snowAmt = o.snow ?? 0;
  // trunk
  addPolyWound(wood, [[-h * 0.02, 0], [-h * 0.012, -h * 0.98], [h * 0.012, -h * 0.98], [h * 0.02, 0]]);
  const tiers = Math.max(4, Math.round(9 * (0.6 + 0.4 * (o.detail ?? 1))));
  for (let k = 0; k < tiers; k++) {
    const t = k / tiers;
    const yTop = -h * (0.14 + 0.84 * ((k + 1) / tiers)) - h * 0.02;
    const yBot = -h * (0.12 + 0.82 * (k / tiers));
    const half = (w / 2) * (1 - t) ** 0.9 * (0.88 + 0.2 * R());
    // drooping skirt: concave sag toward the tips with many small needle notches
    const pts: Pt[] = [[0, yTop]];
    const teeth = 8 + Math.round(half / 3);
    for (let i = 1; i <= teeth; i++) {
      const u = i / teeth;
      const x = half * u;
      const sag = (yBot - yTop) * (0.25 + 0.75 * Math.pow(u, 1.6));
      const notch = i % 2 ? -(yBot - yTop) * 0.09 * (1 - 0.4 * u) * (0.6 + 0.8 * R()) : (yBot - yTop) * 0.04;
      pts.push([x, yTop + sag + notch]);
    }
    pts.push([half * 0.92, yTop + (yBot - yTop) * 1.06]);
    pts.push([half * 0.3, yTop + (yBot - yTop) * 0.86]);
    const left = pts.slice(1).map(([x, y]) => [-x * (0.9 + 0.2 * R()), y + (R() - 0.5) * 1.5] as Pt).reverse();
    addPolyWound(wood, [...pts, ...left]);
    if (snowAmt > 0) {
      const sp: Pt[] = [[0, yTop - 1]];
      for (let i = 0; i <= 6; i++) {
        const u = i / 6;
        sp.push([half * 0.85 * u, yTop + (yBot - yTop) * 0.5 * u - 0.5]);
      }
      for (let i = 6; i >= 0; i--) {
        const u = i / 6;
        sp.push([half * 0.85 * u, yTop + (yBot - yTop) * 0.5 * u + (yBot - yTop) * 0.18 * snowAmt * (1 - u * 0.5)]);
      }
      const mirror = sp.map(([x, y]) => [-x, y] as Pt);
      addPolyWound(snow, sp);
      addPolyWound(snow, mirror);
    }
  }
  // tip
  addPolyWound(wood, [[-2, -h * 0.94], [0, -h * 1.04], [2, -h * 0.94]]);
  return { wood, leaves: new Path2D(), snow, bounds: { x: -w / 2, y: -h, w, h } };
}

export const tree: Painter<TreeOpts> = (c, o, env) => {
  const g = treeGeom({ h: o.h, kind: o.kind, seed: o.seed, leaves: o.leaves, snow: o.snow, lean: o.lean, detail: o.detail });
  c.save();
  c.translate(o.x, o.y);
  c.fillStyle = env.fill(o.role ?? 'set');
  c.fill(g.wood);
  if ((o.leaves ?? 0) > 0) c.fill(g.leaves);
  if ((o.snow ?? 0) > 0) {
    c.fillStyle = mixLab(env.mood.rim, env.mood.haze, 0.25 + env.layer.haze * 0.5);
    c.fill(g.snow);
  }
  c.restore();
};

// ---------------------------------------------------------------------------
// forest band
// ---------------------------------------------------------------------------
export interface ForestBandOpts {
  x0: number;
  x1: number;
  /** ground line */
  y: number;
  /** typical tree height */
  h: number;
  kind?: 'bare' | 'pine' | 'mixed' | 'leafy';
  /** trees per 100 px */
  density?: number;
  seed?: number;
  snow?: number;
  /** ground strip below y */
  ground?: number;
  role?: FillRole;
}
const bandCache = new Map<string, { wood: Path2D; snow: Path2D }>();
export const forestBand: Painter<ForestBandOpts> = (c, o, env) => {
  const g = memo(bandCache, keyOf(o), () => {
    const R = rng(o.seed ?? 5, 33);
    const wood = new Path2D();
    const snow = new Path2D();
    const n = Math.round(((o.x1 - o.x0) / 100) * (o.density ?? 4));
    const kind = o.kind ?? 'mixed';
    // undulating ground
    const pts: Pt[] = [[o.x0, o.y + (o.ground ?? 60)]];
    for (let x = o.x0; x <= o.x1; x += 8) pts.push([x, o.y - fbm1(x / 180, o.seed ?? 5, 3) * o.h * 0.08]);
    pts.push([o.x1, o.y + (o.ground ?? 60)]);
    addPolyWound(wood, pts);
    for (let i = 0; i < n; i++) {
      const x = o.x0 + ((i + R()) / n) * (o.x1 - o.x0);
      const gy = o.y - fbm1(x / 180, o.seed ?? 5, 3) * o.h * 0.08 + 2;
      const h = o.h * (0.55 + R() * 0.5);
      const k: TreeKind = kind === 'pine' ? 'pine' : kind === 'bare' ? (R() < 0.6 ? 'oak' : 'birch') : kind === 'leafy' ? (R() < 0.5 ? 'elm' : 'oak') : R() < 0.45 ? 'pine' : R() < 0.5 ? 'oak' : 'birch';
      const tg = treeGeom({ h, kind: k, seed: (o.seed ?? 5) * 1000 + i, detail: 0.35, leaves: kind === 'leafy' ? 0.9 : 0, snow: o.snow });
      const m = new DOMMatrix([1, 0, 0, 1, x, gy]);
      wood.addPath(tg.wood, m);
      if (kind === 'leafy') wood.addPath(tg.leaves, m);
      if (o.snow) snow.addPath(tg.snow, m);
    }
    return { wood, snow };
  });
  c.fillStyle = env.fill(o.role ?? 'set');
  c.fill(g.wood);
  if (o.snow) {
    c.fillStyle = mixLab(env.mood.rim, env.mood.haze, 0.35 + env.layer.haze * 0.5);
    c.fill(g.snow);
  }
  void withAlpha;
};
