/**
 * Walls, columns, arcades and doorways (draw on L2/L3 with role 'set'; frame pillars on L6 with 'fg').
 *
 *   windowWall(c, WindowWallOpts, env)     THE reference back wall: a wall rect with lancet / round /
 *       tudor / flat windows cut as evenodd holes (lights, tracery foils), leaded panes, transoms,
 *       pierced spandrel foils or palmettes, pierced crest, pilasters, cornice and wainscot cut-lines.
 *       windowWallLayout(o) -> { centers, windows: WindowSpec[] }  (for staging figures against glass)
 *   panelledWall(c, { x, y, w, h, bays, cornice?, wainscot?, door? }, env)   solid panelled wall
 *   column(c, { x, y, h, d?, order: 'tuscan'|'ionic'|'corinthian'|'gothic' }, env)  (x,y)=base centre
 *   colonnade(c, { x0, x1, y, h, count, order, entablature? }, env)
 *   arcade(c, { x, y, w, h, bays, spring, shape?, rise?, pier? }, env)   wall pierced by arches to the floor
 *   doorway(c, { x, y, w, h, style: 'panelled'|'gothic'|'colonial', open?, glow? }, env) (x,y)=floor centre
 *   framePillar(c, { x, y0, y1, w }, env)  a dark L6 foreground pillar with base, capital, flutes
 */
import type { FillRole, PaintEnv, Painter } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import { acanthus, addCircle, addFoil, addRect, at, dentils, eggAndDart, memoPath, palmette, volute } from '../ornament';
import { lathe, placeTurning, type Seg } from '../lathe';
import { addArchContour, arch, type ArchShape, windowGeom, type WindowSpec } from './openings';
import { cutColor, hash01, keyOf, memo, shadeColor, strokeCuts } from './common';

// ---------------------------------------------------------------------------
// window wall
// ---------------------------------------------------------------------------
export interface WindowWallOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  count?: number;
  /** explicit window centres (absolute x); overrides count */
  centers?: number[];
  winW: number;
  /** absolute y of window tops and sills */
  apex: number;
  sill: number;
  shape?: ArchShape;
  rise?: number;
  lights?: number;
  mullion?: number;
  transoms?: number[];
  panes?: { cols: number; rows: number } | null;
  bar?: number;
  tracery?: WindowSpec['tracery'];
  spandrel?: 'trefoil' | 'quatrefoil' | 'palmette' | 'none';
  /** pierced palmette crest in the frieze above each pier */
  crest?: boolean;
  pilasters?: boolean;
  /** cornice band height (cut-lines + dentils), 0 = none */
  cornice?: number;
  /** wainscot/dado height from the bottom, 0 = none */
  wainscot?: number;
  /** old-glass tint variation 0..1 */
  glass?: number;
  cutAlpha?: number;
  /** darkening toward the ceiling 0..1 */
  shade?: number;
  seed?: number;
  role?: FillRole;
}

export function windowWallLayout(o: WindowWallOpts): { centers: number[]; windows: WindowSpec[] } {
  const n = o.centers?.length ?? o.count ?? 3;
  const centers = o.centers ?? Array.from({ length: n }, (_, i) => o.x + (o.w * (i + 0.5)) / n);
  const windows = centers.map<WindowSpec>((cx) => ({
    cx,
    w: o.winW,
    apex: o.apex,
    sill: o.sill,
    shape: o.shape ?? 'pointed',
    rise: o.rise,
    lights: o.lights ?? 2,
    mullion: o.mullion,
    transoms: o.transoms ?? [0.38],
    panes: o.panes === undefined ? { cols: 2, rows: 8 } : o.panes,
    bar: o.bar,
    tracery: o.tracery ?? 'quatrefoil',
  }));
  return { centers, windows };
}

interface WallGeom {
  wall: Path2D;
  bars: Path2D;
  cuts: Path2D;
  recess: Path2D;
  cells: [number, number, number, number][];
}
const wallCache = new Map<string, WallGeom>();

function buildWindowWall(o: WindowWallOpts): WallGeom {
  const { centers, windows } = windowWallLayout(o);
  const wall = new Path2D();
  addRect(wall, o.x, o.y, o.w, o.h);
  const bars = new Path2D();
  const cuts = new Path2D();
  const recess = new Path2D();
  const cells: [number, number, number, number][] = [];
  const geoms = windows.map((s) => windowGeom(s));
  for (const g of geoms) {
    wall.addPath(g.holes);
    bars.addPath(g.bars);
    cuts.addPath(g.mould);
    cells.push(...g.cells);
  }
  const cornice = o.cornice ?? Math.min(60, (o.apex - o.y) * 0.6);
  const wains = o.wainscot ?? 0;
  const yTop = o.y + cornice;
  const yW = o.y + o.h - wains;
  const A0 = geoms[0].arch;
  const spring = A0.spring;
  const rise = A0.rise;
  const half = o.winW / 2;
  // piers: midpoints between windows plus the two ends
  const piers: { x: number; gap: number }[] = [];
  const edges = [o.x, ...centers, o.x + o.w];
  for (let i = 0; i < edges.length - 1; i++) {
    const left = i === 0 ? o.x : edges[i] + half;
    const right = i === edges.length - 2 ? o.x + o.w : edges[i + 1] - half;
    const gap = right - left;
    if (gap > 8) piers.push({ x: (left + right) / 2, gap });
  }
  // pilasters
  if (o.pilasters ?? true) {
    for (const p of piers) {
      const pw = Math.min(p.gap * 0.42, o.winW * 0.3);
      if (pw < 10) continue;
      const top = spring - rise * 0.15;
      const bot = (wains ? yW : o.sill) - 6;
      cuts.rect(p.x - pw / 2, top, pw, bot - top);
      cuts.rect(p.x - pw / 2 + 4, top + 10, pw - 8, bot - top - 20);
      recess.rect(p.x - pw / 2 + 4, top + 10, pw - 8, bot - top - 20);
      // capital
      cuts.rect(p.x - pw / 2 - 4, top - 8, pw + 8, 8);
      cuts.moveTo(p.x - pw / 2 - 2, top - 12);
      cuts.lineTo(p.x + pw / 2 + 2, top - 12);
    }
  }
  // pierced spandrel ornament above each pier
  const sp = o.spandrel ?? 'trefoil';
  if (sp !== 'none' && rise > 0) {
    for (const p of piers) {
      const room = Math.min(p.gap * 0.32, rise * 0.32);
      if (room < 5) continue;
      const cy = o.apex + rise * 0.42;
      if (sp === 'palmette') {
        const pm = palmette({ r: room * 1.6, leaves: 7 });
        at(wall, pm, p.x, cy + room * 0.9);
      } else if (sp === 'trefoil') {
        // a trio of small trefoils, like the reference's clover clusters
        const r = room * 0.48;
        addFoil(wall, p.x, cy - r * 1.05, r, 3, { ccw: true });
        addFoil(wall, p.x - r * 1.15, cy + r * 0.85, r * 0.8, 3, { ccw: true });
        addFoil(wall, p.x + r * 1.15, cy + r * 0.85, r * 0.8, 3, { ccw: true });
      } else {
        addFoil(wall, p.x, cy, room, 4, { ccw: true, rot: -Math.PI / 4 });
      }
    }
  }
  // pierced crest in the frieze above each pier and window
  if ((o.crest ?? true) && cornice > 24) {
    const r = Math.min(cornice * 0.55, 40);
    for (const p of piers) at(wall, palmette({ r, leaves: 9 }), p.x, o.y + cornice * 0.82);
  }
  // cornice
  if (cornice > 0) {
    cuts.moveTo(o.x, yTop);
    cuts.lineTo(o.x + o.w, yTop);
    cuts.moveTo(o.x, yTop - 4);
    cuts.lineTo(o.x + o.w, yTop - 4);
    cuts.moveTo(o.x, o.y + 6);
    cuts.lineTo(o.x + o.w, o.y + 6);
    const dh = Math.min(10, cornice * 0.18);
    const pitch = dh * 1.3;
    for (let x = o.x + 4; x < o.x + o.w - pitch; x += pitch) cuts.rect(x, o.y + 8, pitch * 0.55, dh);
  }
  // wainscot
  if (wains > 0) {
    cuts.moveTo(o.x, yW);
    cuts.lineTo(o.x + o.w, yW);
    cuts.moveTo(o.x, yW + 5);
    cuts.lineTo(o.x + o.w, yW + 5);
    cuts.moveTo(o.x, o.y + o.h - 10);
    cuts.lineTo(o.x + o.w, o.y + o.h - 10);
    const bays = Math.max(1, Math.round(o.w / Math.max(60, wains * 1.1)));
    const bw = o.w / bays;
    for (let i = 0; i < bays; i++) {
      const x = o.x + i * bw + 8;
      const pw = bw - 16;
      const py = yW + 14;
      const ph = wains - 34;
      if (ph < 8) continue;
      cuts.rect(x, py, pw, ph);
      cuts.rect(x + 5, py + 5, pw - 10, ph - 10);
      recess.rect(x + 5, py + 5, pw - 10, ph - 10);
    }
  }
  return { wall, bars, cuts, recess, cells };
}

function wallFill(c: CanvasRenderingContext2D, base: string, env: PaintEnv, y: number, h: number, shade: number) {
  const g = c.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, mixLab(base, env.mood.fg, 0.38 * shade));
  g.addColorStop(0.4, base);
  g.addColorStop(1, mixLab(base, env.mood.fg, 0.18 * shade));
  return g;
}

export const windowWall: Painter<WindowWallOpts> = (c, o, env) => {
  const g = memo(wallCache, keyOf(o), () => buildWindowWall(o), 60);
  const base = env.fill(o.role ?? 'set');
  // glass tint first (under the bars), only inside the panes
  const glass = o.glass ?? 0.6;
  if (glass > 0 && g.cells.length) {
    const seed = o.seed ?? 7;
    for (let i = 0; i < g.cells.length; i++) {
      const v = hash01(seed, i);
      if (v > 0.55) continue;
      const [x, y, w, h] = g.cells[i];
      c.fillStyle = v < 0.12 ? withAlpha(env.mood.rim, 0.06 * glass) : withAlpha(env.mood.ink, (0.03 + 0.12 * v) * glass);
      c.fillRect(x, y, w, h);
    }
  }
  c.fillStyle = wallFill(c, base, env, o.y, o.h, o.shade ?? 1);
  c.fill(g.wall, 'evenodd');
  c.fillStyle = base;
  c.fill(g.bars);
  c.fillStyle = shadeColor(env, 0.12);
  c.fill(g.recess);
  strokeCuts(c, g.cuts, cutColor(env, o.cutAlpha ?? 0.2), 1.1);
};

// ---------------------------------------------------------------------------
// panelled wall
// ---------------------------------------------------------------------------
export interface PanelledWallOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  bays?: number;
  cornice?: number;
  wainscot?: number;
  role?: FillRole;
  cutAlpha?: number;
}
const panelCache = new Map<string, { cuts: Path2D; recess: Path2D }>();
export const panelledWall: Painter<PanelledWallOpts> = (c, o, env) => {
  const g = memo(panelCache, keyOf(o), () => {
    const cuts = new Path2D();
    const recess = new Path2D();
    const bays = o.bays ?? Math.max(1, Math.round(o.w / 220));
    const cor = o.cornice ?? 40;
    const wn = o.wainscot ?? o.h * 0.22;
    const bw = o.w / bays;
    cuts.moveTo(o.x, o.y + cor);
    cuts.lineTo(o.x + o.w, o.y + cor);
    cuts.moveTo(o.x, o.y + cor - 4);
    cuts.lineTo(o.x + o.w, o.y + cor - 4);
    cuts.moveTo(o.x, o.y + o.h - wn);
    cuts.lineTo(o.x + o.w, o.y + o.h - wn);
    for (let i = 0; i < bays; i++) {
      const x = o.x + i * bw;
      // tall upper panel and short dado panel per bay
      const px = x + bw * 0.16;
      const pw = bw * 0.68;
      const top = o.y + cor + 18;
      const bot = o.y + o.h - wn - 18;
      cuts.rect(px, top, pw, bot - top);
      cuts.rect(px + 6, top + 6, pw - 12, bot - top - 12);
      recess.rect(px + 6, top + 6, pw - 12, bot - top - 12);
      cuts.rect(px, o.y + o.h - wn + 14, pw, wn - 34);
      // pilaster strip between bays
      if (i > 0) cuts.rect(x - 6, o.y + cor + 6, 12, o.h - cor - 16);
    }
    return { cuts, recess };
  });
  const base = env.fill(o.role ?? 'set');
  c.fillStyle = wallFill(c, base, env, o.y, o.h, 1);
  c.fillRect(o.x, o.y, o.w, o.h);
  c.fillStyle = shadeColor(env, 0.12);
  c.fill(g.recess);
  strokeCuts(c, g.cuts, cutColor(env, o.cutAlpha ?? 0.18), 1.1);
};

// ---------------------------------------------------------------------------
// columns
// ---------------------------------------------------------------------------
export type Order = 'tuscan' | 'ionic' | 'corinthian' | 'gothic';
export interface ColumnOpts {
  x: number;
  y: number;
  h: number;
  d?: number;
  order?: Order;
  role?: FillRole;
}

/** Column path, base centre (0,0), up = -y. Cached. */
export function columnPath(h: number, d: number, order: Order): Path2D {
  return memoPath(`column${h},${d},${order}`, () => {
    const p = new Path2D();
    const r = d / 2;
    const capH = order === 'corinthian' ? d * 1.15 : order === 'ionic' ? d * 0.45 : d * 0.38;
    const baseH = d * 0.5;
    const shaftH = h - capH - baseH;
    if (order === 'gothic') {
      // clustered shaft: three shafts with shared bands
      const segsMain: Seg[] = [['cyl', d * 0.12, r * 1.25], ['ogee', d * 0.3, r * 1.15, r * 0.7], ['bead', d * 0.08, r * 0.8, r * 0.7], ['cyl', shaftH, r * 0.62], ['bead', d * 0.12, r * 0.85, r * 0.62], ['flare', d * 0.18, r * 0.8, r * 1.15], ['cyl', d * 0.2, r * 1.2]];
      placeTurning(p, lathe(segsMain), 0, 0);
      const side = lathe([['bead', d * 0.06, r * 0.4, r * 0.32], ['cyl', shaftH, r * 0.3], ['bead', d * 0.06, r * 0.4, r * 0.32]]);
      placeTurning(p, side, -r * 0.75, -baseH);
      placeTurning(p, side, r * 0.75, -baseH);
      // foliate capital
      at(p, acanthus({ len: d * 0.5, curl: -1.2 }), -r * 0.6, -h + d * 0.62, 1, 1);
      at(p, acanthus({ len: d * 0.5, curl: 1.2 }), r * 0.6, -h + d * 0.62, 1, 1);
      return p;
    }
    const segs: Seg[] = [
      ['cyl', d * 0.12, r * 1.42],
      ['ogee', capH - d * 0.22, r * 1.3, r * 1.0],
      ['bead', d * 0.1, r * 1.08, r],
      ['taper', shaftH, r * 0.84, r],
      ['cove', d * 0.06, r, r * 1.12],
      ['bead', d * 0.16, r * 1.3, r * 1.12],
      ['bead', d * 0.1, r * 1.18, r * 1.1],
      ['cyl', d * 0.18, r * 1.45],
    ];
    placeTurning(p, lathe(segs), 0, 0);
    if (order === 'ionic') {
      const v = volute(d * 0.28, { turns: 2, width: 0.75 });
      at(p, v, -r * 1.25, -h + d * 0.36, 1, 1);
      at(p, v, r * 1.25, -h + d * 0.36, -1, 1);
      addRect(p, -r * 1.25, -h + d * 0.12, r * 2.5, d * 0.14);
    } else if (order === 'corinthian') {
      // bell of acanthus leaves
      const base = -h + capH;
      for (const [dx, len, curl] of [[-0.75, 0.62, -1.5], [0.75, 0.62, 1.5], [-0.3, 0.75, -0.6], [0.3, 0.75, 0.6], [0, 0.5, 0.2]] as [number, number, number][]) {
        at(p, acanthus({ len: d * len, w: d * 0.36, curl }), dx * r, base + d * 0.08);
      }
      const v = volute(d * 0.13, { turns: 1.8, width: 0.7 });
      at(p, v, -r * 1.25, -h + d * 0.24, 1, 1);
      at(p, v, r * 1.25, -h + d * 0.24, -1, 1);
      addRect(p, -r * 1.5, -h, r * 3, d * 0.12);
    }
    return p;
  });
}

export const column: Painter<ColumnOpts> = (c, o, env) => {
  const d = o.d ?? o.h * 0.1;
  c.save();
  c.translate(o.x, o.y);
  c.fillStyle = env.fill(o.role ?? 'set');
  c.fill(columnPath(o.h, d, o.order ?? 'tuscan'), 'nonzero');
  // flute cut-lines on the shaft
  if (o.order !== 'gothic') {
    const r = d / 2;
    const cuts = memoPath(`flutes${o.h},${d}`, () => {
      const q = new Path2D();
      const top = -o.h + d * 0.6;
      for (const f of [-0.5, -0.18, 0.18, 0.5]) {
        q.moveTo(f * r * 0.86, top);
        q.lineTo(f * r, -d * 0.55);
      }
      return q;
    });
    strokeCuts(c, cuts, cutColor(env, 0.14), 1);
  }
  c.restore();
};

export interface ColonnadeOpts {
  x0: number;
  x1: number;
  /** floor y */
  y: number;
  h: number;
  count: number;
  d?: number;
  order?: Order;
  /** entablature height above the columns (0 = none) */
  entablature?: number;
  role?: FillRole;
}
export const colonnade: Painter<ColonnadeOpts> = (c, o, env) => {
  const d = o.d ?? o.h * 0.1;
  const step = o.count > 1 ? (o.x1 - o.x0) / (o.count - 1) : 0;
  for (let i = 0; i < o.count; i++) column(c, { x: o.x0 + i * step, y: o.y, h: o.h, d, order: o.order, role: o.role }, env);
  const eh = o.entablature ?? d * 1.4;
  if (eh > 0) {
    const L = o.x0 - d * 0.9;
    const W = o.x1 - o.x0 + d * 1.8;
    const top = o.y - o.h - eh;
    const p = memoPath(`entab${L},${W},${top},${eh}`, () => {
      const q = new Path2D();
      addRect(q, L, top + eh * 0.55, W, eh * 0.45);
      q.addPath(eggAndDart({ w: W, h: eh * 0.18 }), new DOMMatrix([1, 0, 0, 1, L, top + eh * 0.37]));
      q.addPath(dentils({ w: W, h: eh * 0.2 }), new DOMMatrix([1, 0, 0, 1, L, top + eh * 0.18]));
      addRect(q, L - eh * 0.15, top, W + eh * 0.3, eh * 0.2);
      return q;
    });
    c.fillStyle = env.fill(o.role ?? 'set');
    c.fill(p, 'evenodd');
  }
};

// ---------------------------------------------------------------------------
// arcade
// ---------------------------------------------------------------------------
export interface ArcadeOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  bays: number;
  /** springing y of the arches (absolute) */
  spring: number;
  shape?: ArchShape;
  rise?: number;
  /** pier width as a fraction of the bay */
  pier?: number;
  /** arch openings run to this y (default: wall bottom) */
  floor?: number;
  role?: FillRole;
  cutAlpha?: number;
}
const arcadeCache = new Map<string, { wall: Path2D; cuts: Path2D }>();
export const arcade: Painter<ArcadeOpts> = (c, o, env) => {
  const g = memo(arcadeCache, keyOf(o), () => {
    const wall = new Path2D();
    const cuts = new Path2D();
    addRect(wall, o.x, o.y, o.w, o.h);
    const bw = o.w / o.bays;
    const pier = o.pier ?? 0.24;
    const ow = bw * (1 - pier);
    const floor = o.floor ?? o.y + o.h;
    for (let i = 0; i < o.bays; i++) {
      const cx = o.x + bw * (i + 0.5);
      const A = arch(cx, ow, o.spring, o.shape ?? 'round', o.rise);
      addArchContour(wall, A, floor + 1, true);
      // archivolt cut-lines, keystone, impost blocks
      const d = ow * 0.07;
      const B = { ...A, a: A.a + d, rise: A.rise + d };
      const pts: [number, number][] = [];
      for (let k = 0; k <= 30; k++) {
        const u = -1 + (2 * k) / 30;
        const hh = u === -1 || u === 1 ? 0 : (B.shape === 'round' ? B.rise * Math.sqrt(1 - u * u) : 0);
        pts.push([B.cx + u * B.a, B.spring - hh]);
      }
      cuts.moveTo(pts[0][0], pts[0][1]);
      for (const q of pts) cuts.lineTo(q[0], q[1]);
      const top = A.spring - A.rise;
      cuts.rect(cx - d * 0.9, top - d * 1.6, d * 1.8, d * 2.2);
      cuts.rect(cx - A.a - d * 1.2, o.spring - d * 0.8, d * 1.2, d * 0.8);
      cuts.rect(cx + A.a, o.spring - d * 0.8, d * 1.2, d * 0.8);
    }
    cuts.moveTo(o.x, o.y + 10);
    cuts.lineTo(o.x + o.w, o.y + 10);
    return { wall, cuts };
  });
  const base = env.fill(o.role ?? 'set');
  c.fillStyle = wallFill(c, base, env, o.y, o.h, 0.8);
  c.fill(g.wall, 'evenodd');
  strokeCuts(c, g.cuts, cutColor(env, o.cutAlpha ?? 0.18), 1.1);
};

// ---------------------------------------------------------------------------
// doorway
// ---------------------------------------------------------------------------
export interface DoorwayOpts {
  /** floor centre */
  x: number;
  y: number;
  w: number;
  h: number;
  style?: 'panelled' | 'gothic' | 'colonial';
  /** 0 = shut, 1 = wide open (leaf swings toward the viewer, hinge on the left) */
  open?: number;
  /** brightness of the room beyond when open, 0..1 */
  glow?: number;
  role?: FillRole;
}
export const doorway: Painter<DoorwayOpts> = (c, o, env) => {
  const style = o.style ?? 'panelled';
  const { x, y, w, h } = o;
  const open = Math.max(0, Math.min(1, o.open ?? 0));
  const base = env.fill(o.role ?? 'set');
  const leafTop = style === 'gothic' ? y - h : y - h;
  const A = arch(x, w, y - h + (style === 'gothic' ? w * 0.8 : 0), style === 'gothic' ? 'pointed' : 'flat', style === 'gothic' ? w * 0.8 : 0);
  // opening (light beyond)
  if (open > 0) {
    const op = new Path2D();
    addArchContour(op, A, y, false);
    const g = c.createLinearGradient(0, leafTop, 0, y);
    g.addColorStop(0, withAlpha(env.mood.sky[2], 0.9 * (o.glow ?? 1)));
    g.addColorStop(1, withAlpha(env.mood.sky[3], 1 * (o.glow ?? 1)));
    c.fillStyle = g;
    c.fill(op);
  }
  // surround
  const sur = memoPath(`doorSur${x},${y},${w},${h},${style}`, () => {
    const p = new Path2D();
    const f = w * 0.12;
    if (style === 'colonial') {
      addRect(p, x - w / 2 - f, y - h - f, f, h + f);
      addRect(p, x + w / 2, y - h - f, f, h + f);
      // fanlight band + pediment
      const fan = w * 0.35;
      addRect(p, x - w / 2 - f, y - h - f, w + 2 * f, f * 0.6);
      p.moveTo(x - w / 2 - f * 1.8, y - h - f - fan * 0.15);
      p.lineTo(x, y - h - f - fan * 0.95);
      p.lineTo(x + w / 2 + f * 1.8, y - h - f - fan * 0.15);
      p.lineTo(x + w / 2 + f * 1.8, y - h - f + 2);
      p.lineTo(x - w / 2 - f * 1.8, y - h - f + 2);
      p.closePath();
      at(p, palmette({ r: fan * 0.5, leaves: 7 }), x, y - h - f * 0.4, 1, 1);
    } else {
      const B = { ...A, a: A.a + f, rise: A.rise + (style === 'gothic' ? f : 0) };
      addArchContour(p, B, y, false);
      addArchContour(p, A, y + 1, true);
      if (style === 'panelled') {
        // broken pediment with an urn
        addRect(p, x - w / 2 - f * 1.6, y - h - f * 1.6, w + f * 3.2, f * 0.7);
        at(p, volute(f * 0.9, { turns: 1.6 }), x - w * 0.32, y - h - f * 2.4, 1, 1);
        at(p, volute(f * 0.9, { turns: 1.6 }), x + w * 0.32, y - h - f * 2.4, -1, 1);
      }
    }
    return p;
  });
  c.fillStyle = base;
  c.fill(sur, style === 'colonial' ? 'nonzero' : 'evenodd');
  // leaf: foreshortened as it swings open
  const lw = w * Math.cos((open * Math.PI) / 2.2);
  if (lw > 1) {
    const lx = x - w / 2;
    const leaf = new Path2D();
    const skew = open * h * 0.04;
    leaf.moveTo(lx, y);
    leaf.lineTo(lx, A.spring);
    if (style === 'gothic') {
      for (let k = 0; k <= 16; k++) {
        const u = 1 - k / 16;
        const xx = A.cx - u * A.a;
        const frac = (xx - lx) / w;
        leaf.lineTo(lx + frac * lw, A.spring - (A.rise * (1 - u * u) ** 0.5) - skew * frac);
      }
      leaf.lineTo(lx + lw, A.spring - skew);
    } else {
      leaf.lineTo(lx, y - h);
      leaf.lineTo(lx + lw, y - h - skew);
    }
    leaf.lineTo(lx + lw, y + skew * 0.5);
    leaf.closePath();
    c.fillStyle = mixLab(base, env.mood.fg, 0.25);
    c.fill(leaf);
    // panel cut-lines
    const cuts = new Path2D();
    const pr = (fx: number, fy: number, fw: number, fh: number) => cuts.rect(lx + fx * lw, y - h + fy * h, fw * lw, fh * h);
    pr(0.15, 0.1, 0.7, 0.38);
    pr(0.15, 0.56, 0.7, 0.36);
    strokeCuts(c, cuts, cutColor(env, 0.16), 1);
  }
};

// ---------------------------------------------------------------------------
// foreground pillar (L6)
// ---------------------------------------------------------------------------
export interface FramePillarOpts {
  x: number;
  y0: number;
  y1: number;
  w: number;
  role?: FillRole;
}
export const framePillar: Painter<FramePillarOpts> = (c, o, env) => {
  const p = memoPath(`fpillar${o.x},${o.y0},${o.y1},${o.w}`, () => {
    const q = new Path2D();
    const { x, y0, y1, w } = o;
    addRect(q, x - w / 2, y0, w, y1 - y0);
    // base mouldings and a capital that step out
    addRect(q, x - w * 0.62, y1 - w * 0.5, w * 1.24, w * 0.5);
    addRect(q, x - w * 0.56, y1 - w * 0.7, w * 1.12, w * 0.22);
    addRect(q, x - w * 0.66, y0 + w * 0.3, w * 1.32, w * 0.24);
    addCircle(q, x, y0 + w * 0.82, w * 0.12);
    return q;
  });
  c.fillStyle = env.fill(o.role ?? 'fg');
  c.fill(p);
  const flutes = memoPath(`fpflutes${o.x},${o.y0},${o.y1},${o.w}`, () => {
    const q = new Path2D();
    for (const f of [-0.28, 0, 0.28]) {
      q.moveTo(o.x + f * o.w, o.y0 + o.w * 1.2);
      q.lineTo(o.x + f * o.w, o.y1 - o.w * 0.9);
    }
    return q;
  });
  strokeCuts(c, flutes, cutColor(env, 0.07), 1.2);
};
