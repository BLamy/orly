/**
 * handwired-explained — ch11-s01 / ch11-s01b: THE RECOVERY GRID (bible image 25), the JSON highlighter's strict
 * parser table laid on the lab bench at night like a paper quilt of shallow wells, seen at a steep three-quarter angle.
 *
 *   40 columns x 39 rows = 1,560 cells (the claim's "about 1,560", drawn as an exact grid for layout only). Exactly
 *   240 cells lie on one winding river with six tributaries (the entries valid JSON reads): warm copper, each with a
 *   tiny frozen copper pin. The other 1,320 are dark wells in the winterBlue haze. The numbers are layout, not data: no count is
 *   spoken, and the one label (ch11-s01) says "about".
 *
 *   quiltRoom(f, key)                      backlight, L2 window wall (cold), fog, L3 far bench edge props, fog
 *   drawQuilt(f, c, env, key, o)           L4: the bench top, the paper quilt, lit cells, wells (+ the training layers)
 *   drawPins(f, c, env, key)               the 240 copper pins alone (drawn again above the stencil in ch11-s01b)
 *   drawStencil(f, c, env, key, o)         ch11-s01b: the pale stencil, solid over the lit cells, cut over the wells
 *   drawThread(c, env, run)                a bead-thread of light (abstract glyph beads) along a route
 *   quiltNear(f, key)                      L5: the near bench lip (soft)
 *   gp(i, j) / cellPx(i, j)                grid point (cells) -> L4 rest px, and the local cell width there
 *   MAIN, MAIN_LEN, ERR, WELL, mainAt(s)   the valid route (cell centres), its length, the stall index and well
 *
 * Purity: the river, tributaries and tiles are fixed geometry computed at module scope; every drawing is a function of t.
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { windowWall } from '../../../film/silhouette/architecture';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hash1 } from '../../../film/core/frame';
import { copperOf } from './narratorHands';

type C = CanvasRenderingContext2D;
export type Pt = { x: number; y: number };
const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);

// ---------------------------------------------------------------- the grid and its projection
export const QCOLS = 40;
export const QROWS = 39;
/** the quilt's corners on the bench (L4 rest px): far-left, far-right, near-right, near-left */
export const QUAD = { p00: { x: 398, y: 232 }, p10: { x: 962, y: 206 }, p11: { x: 1150, y: 622 }, p01: { x: 150, y: 668 } } as const;

const H = (() => {
  const { p00: a, p10: b, p11: c2, p01: d } = QUAD;
  const dx1 = b.x - c2.x, dx2 = d.x - c2.x, dx3 = a.x - b.x + c2.x - d.x;
  const dy1 = b.y - c2.y, dy2 = d.y - c2.y, dy3 = a.y - b.y + c2.y - d.y;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const h = (dx1 * dy3 - dx3 * dy1) / den;
  return { a: b.x - a.x + g * b.x, b: d.x - a.x + h * d.x, c: a.x, d: b.y - a.y + g * b.y, e: d.y - a.y + h * d.y, f: a.y, g, h };
})();
/** grid point (i = column, j = row, in cells; fractional allowed) -> L4 rest px */
export function gp(i: number, j: number): Pt {
  const u = i / QCOLS, v = j / QROWS;
  const w = H.g * u + H.h * v + 1;
  return { x: (H.a * u + H.b * v + H.c) / w, y: (H.d * u + H.e * v + H.f) / w };
}
/** the cell's width in px at a grid point (for bead sizes) */
export function cellPx(i: number, j: number): number {
  const a = gp(i - 0.5, j), b = gp(i + 0.5, j), c2 = gp(i, j - 0.5), d = gp(i, j + 0.5);
  return Math.sqrt(Math.hypot(b.x - a.x, b.y - a.y) * Math.hypot(d.x - c2.x, d.y - c2.y));
}
function quadPath(p: Path2D | C, i0: number, j0: number, i1: number, j1: number) {
  const a = gp(i0, j0), b = gp(i1, j0), c2 = gp(i1, j1), d = gp(i0, j1);
  p.moveTo(a.x, a.y);
  p.lineTo(b.x, b.y);
  p.lineTo(c2.x, c2.y);
  p.lineTo(d.x, d.y);
  p.closePath();
}

// ---------------------------------------------------------------- the lit path (240 cells)
export const LIT_COUNT = 240;
const key = (i: number, j: number) => j * QCOLS + i;
type Cell = [number, number];
/**
 * One winding RIVER with tributaries (review r1: short square spurs one cell apart read as handwriting, and square
 * L-shaped branches still read as letters). The river: a smooth Catmull-Rom centreline from the far-left edge to the
 * near-right edge; every cell whose centre lies within a half-width that widens downstream (1.25 -> 2.1 cells) is lit,
 * so the channel grows as it flows. Six tributaries are thin curves of their own (half-width 0.62 -> 0.5, tapering),
 * each bending once as it leaves the bank and fanning out a different way, at least two cells clear of the river and
 * of each other past their roots. Their tips are trimmed so river + tributaries = exactly LIT_COUNT.
 */
const RIVER_WP: [number, number][] = [[-2, 6], [6, 7], [12, 11], [18, 13], [23, 17], [28, 18], [33, 22], [36, 28], [42, 31]];
const RIVER_HALF: [number, number] = [1.25, 2.1];
const TRIB_HALF: [number, number] = [0.62, 0.5];
/** each from its junction on the river outward to its source: three reaching up-left into the far rows, three
 *  spreading left and down-left over the near rows (dendritic, never hanging straight down) */
const TRIBS: [number, number][][] = [
  [[9, 8.5], [6, 3.5], [1, 1]],
  [[20, 14.5], [19, 8], [14, 3]],
  [[30, 19.5], [32, 12], [29, 5]],
  [[15, 13], [10, 16.5], [3, 18]],
  [[25, 18.5], [21, 24], [15, 27]],
  [[35, 25], [31, 30.5], [24, 33]],
];
function catmull(P: [number, number][], steps: number): Pt[] {
  const out: Pt[] = [];
  for (let k = 0; k < P.length - 1; k++) {
    const p0 = P[Math.max(0, k - 1)], p1 = P[k], p2 = P[k + 1], p3 = P[Math.min(P.length - 1, k + 2)];
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0[0], p1[0], p2[0], p3[0]), y: f(p0[1], p1[1], p2[1], p3[1]) });
    }
  }
  const e = P[P.length - 1];
  out.push({ x: e[0], y: e[1] });
  return out;
}
/** distance from (px, py) to a polyline, and how far along it (0..1) the nearest point lies */
function nearOn(poly: Pt[], px: number, py: number) {
  let tot = 0;
  for (let k = 0; k < poly.length - 1; k++) tot += Math.hypot(poly[k + 1].x - poly[k].x, poly[k + 1].y - poly[k].y);
  let m = 1e9, u = 0, acc = 0;
  for (let k = 0; k < poly.length - 1; k++) {
    const a = poly[k], b = poly[k + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const l = Math.hypot(dx, dy);
    const w = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / (l * l || 1)));
    const d = Math.hypot(px - a.x - w * dx, py - a.y - w * dy);
    if (d < m) {
      m = d;
      u = (acc + w * l) / (tot || 1);
    }
    acc += l;
  }
  return { d: m, u };
}
function buildRiver() {
  const poly = catmull(RIVER_WP, 30);
  const lit = new Uint8Array(QCOLS * QROWS);
  for (let j = 0; j < QROWS; j++) {
    for (let i = 0; i < QCOLS; i++) {
      const n = nearOn(poly, i + 0.5, j + 0.5);
      if (n.d <= RIVER_HALF[0] + (RIVER_HALF[1] - RIVER_HALF[0]) * n.u) lit[key(i, j)] = 1;
    }
  }
  const tribCells: { k: number; u: number }[] = [];
  for (const wp of TRIBS) {
    const tp = catmull(wp, 20);
    for (let j = 0; j < QROWS; j++) {
      for (let i = 0; i < QCOLS; i++) {
        if (lit[key(i, j)]) continue;
        const n = nearOn(tp, i + 0.5, j + 0.5);
        if (n.d <= TRIB_HALF[0] + (TRIB_HALF[1] - TRIB_HALF[0]) * n.u) tribCells.push({ k: key(i, j), u: n.u });
      }
    }
  }
  for (const tc of tribCells) lit[tc.k] = 1;
  let count = 0;
  for (const v of lit) count += v;
  // trim the tributaries' outermost tips until the table holds exactly LIT_COUNT lit cells
  tribCells.sort((a, b) => b.u - a.u);
  for (let q = 0; q < tribCells.length && count > LIT_COUNT; q++) {
    if (!lit[tribCells[q].k]) continue;
    lit[tribCells[q].k] = 0;
    count--;
  }
  // the centreline resampled about one cell apart, inside the quilt (continuous grid coords): the threads' channel
  const pts: Pt[] = [];
  let acc = 1;
  for (let k = 1; k < poly.length; k++) {
    acc += Math.hypot(poly[k].x - poly[k - 1].x, poly[k].y - poly[k - 1].y);
    if (acc >= 1 && poly[k].x >= 0.3 && poly[k].x <= QCOLS - 0.3) {
      pts.push(poly[k]);
      acc = 0;
    }
  }
  // the stall: a dark well just past the river's NEAR bank, a little under halfway along, where the river runs to the
  // right; its own neighbours dark (so it reads as "off the map")
  let err = -1;
  let well: Cell | null = null;
  for (let k = Math.floor(pts.length * 0.42); k < pts.length - 6 && !well; k++) {
    const p = pts[k], q = pts[k + 1];
    if (q.x - p.x < 0.7) continue;
    const i = Math.floor(p.x);
    let j = Math.floor(p.y);
    while (j < QROWS && lit[key(i, j)]) j++;
    if (j >= QROWS - 1) continue;
    const iso = [[1, 0], [-1, 0], [0, 1], [1, 1], [-1, 1]].every(([a, b2]) => {
      const x3 = i + a, y3 = j + b2;
      return x3 < 0 || x3 >= QCOLS || y3 < 0 || y3 >= QROWS || !lit[key(x3, y3)];
    });
    if (iso) {
      well = [i, j];
      err = k;
    }
  }
  if (count !== LIT_COUNT || !well) throw new Error(`ch11 quilt: river gave ${count} cells`);
  // MAIN in the legacy cell form (cell = centre - 0.5) so cc() maps each back onto the centreline
  const main: Cell[] = pts.map((p) => [p.x - 0.5, p.y - 0.5]);
  return { lit, main, err, well, count };
}
const built = buildRiver();

export const LIT = built.lit;
export const isLit = (i: number, j: number) => LIT[key(i, j)] === 1;
/** the valid route's cells (column, row), first to last */
export const MAIN = built.main;
/** index into MAIN of the cell where the kinked input goes astray, and the dark well it falls into */
export const ERR = built.err;
export const WELL = { i: built.well[0], j: built.well[1] };

// ---------------------------------------------------------------- routes (grid coords, cell centres)
export interface Route {
  pts: Pt[];
  /** cumulative arc length (cells) at each point */
  acc: number[];
  len: number;
}
function route(pts: Pt[]): Route {
  const acc = [0];
  for (let k = 1; k < pts.length; k++) acc.push(acc[k - 1] + Math.hypot(pts[k].x - pts[k - 1].x, pts[k].y - pts[k - 1].y));
  return { pts, acc, len: acc[acc.length - 1] };
}
/** build a route through grid points (cell centres) */
export const makeRoute = (pts: Pt[]): Route => route(pts);
const cc = ([i, j]: [number, number]): Pt => ({ x: i + 0.5, y: j + 0.5 });
const ENTRY: Pt = { x: -3.2, y: MAIN[0][1] + 0.5 };
const EXIT: Pt = { x: QCOLS + 3.5, y: MAIN[MAIN.length - 1][1] + 0.5 };
/** the valid route: in from the top-left edge, along every main cell, out at the far edge */
export const ROUTE_VALID = route([ENTRY, ...MAIN.map(cc), EXIT]);
/** the kinked route: the same, until the error cell; then into the dark well (where it stalls) */
export const ROUTE_KINK = route([ENTRY, ...MAIN.slice(0, ERR + 1).map(cc), { x: WELL.i + 0.5, y: WELL.j + 0.5 }]);
/** the recovery route (ch11-s01b): from the filled well back onto the route and on to the far edge */
export const ROUTE_RECOVER = route([{ x: WELL.i + 0.5, y: WELL.j + 0.5 }, ...MAIN.slice(ERR + 1).map(cc), EXIT]);
/** arc length along ROUTE_VALID of the error cell's centre */
export const S_ERR = ROUTE_VALID.acc[ERR + 1];

export function routeAt(r: Route, s: number): Pt & { dir: number } {
  if (s <= 0) {
    const d = Math.atan2(r.pts[1].y - r.pts[0].y, r.pts[1].x - r.pts[0].x);
    return { x: r.pts[0].x + Math.cos(d) * s, y: r.pts[0].y + Math.sin(d) * s, dir: d };
  }
  if (s >= r.len) {
    const n = r.pts.length;
    const d = Math.atan2(r.pts[n - 1].y - r.pts[n - 2].y, r.pts[n - 1].x - r.pts[n - 2].x);
    return { x: r.pts[n - 1].x + Math.cos(d) * (s - r.len), y: r.pts[n - 1].y + Math.sin(d) * (s - r.len), dir: d };
  }
  let lo = 0, hi = r.acc.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (r.acc[m] <= s) lo = m;
    else hi = m;
  }
  const u = (s - r.acc[lo]) / Math.max(1e-6, r.acc[hi] - r.acc[lo]);
  const a = r.pts[lo], b = r.pts[hi];
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, dir: Math.atan2(b.y - a.y, b.x - a.x) };
}

// ---------------------------------------------------------------- colours
const paperCol = (env: PaintEnv, far: number) => mixLab(mixLab(env.mood.set, env.mood.haze, 0.22 + 0.36 * far), '#b8b2a4', 0.06);
const wellCol = (env: PaintEnv) => mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.62);
export const litCol = (env: PaintEnv, k = 0) => mixLab(mixLab(copperOf(env, 0.6), '#cf7e3e', 0.5), env.mood.core, k);
export const beadCol = (env: PaintEnv) => mixLab(env.mood.core, '#ffffff', 0.25);
/** the trained tiles: a paler, quieter copper than the pinned cells (they were learned, not written) */
export const tileCol = (env: PaintEnv) => mixLab(mixLab(copperOf(env, 0.2), env.mood.rim, 0.45), env.mood.haze, 0.15);

// ---------------------------------------------------------------- the room
/** backlight, L2 cold window wall above the bench, fog, L3 the bench's far edge (lamp, cabinet, books), fog */
export function quiltRoom(f: Frame, keyS: string, o: { lamp?: number } = {}) {
  f.backlight({ sunX: 700, sunY: 150, intensity: 0.8 });
  f.layer('L2', (c, env) => {
    f.cached(`ch11quilt/L2/${env.mood.id}`, 2400, 1300, (cc2) => {
      cc2.translate(560, 700);
      windowWall(cc2, {
        x: -560, y: -700, w: 2400, h: 1000, centers: [-260, 160, 640, 1120, 1540], winW: 250, apex: -380, sill: 214,
        shape: 'flat', lights: 3, panes: { cols: 1, rows: 8 }, transoms: [], tracery: 'none', spandrel: 'none', pilasters: true,
        cornice: 40, wainscot: 0, glass: 0.55, seed: 1101,
      }, env);
      // the wall below the sills, in shadow behind the bench
      cc2.fillStyle = env.fill('set');
      cc2.fillRect(-560, 214, 2400, 400);
    })(c, -560, -700);
  });
  f.fog({ yCenter: 200, height: 220, alpha: 0.22, drift: 6 });
  f.layer('L3', (c, env) => {
    f.cached(`ch11quilt/L3/${env.mood.id}`, 2000, 420, (cc2) => {
      cc2.translate(360, 0);
      benchFar(cc2, env);
    })(c, -360, -60);
  });
  f.fog({ yCenter: 240, height: 120, alpha: 0.14, drift: 9 });
  // the bench lamp is ON (review r1): the one warm practical in the room, its pool grazing the quilt's far-left
  // corner (drawQuilt's `lamp`); painted before L4 so its halo never washes over the action plane
  const lamp = o.lamp ?? 1;
  if (lamp > 0.001) {
    f.layer('L3', (c, env) => {
      const warm = mixLab('#f0a35a', env.mood.core, 0.12);
      // the lamp's own light, warm in the cold room: a hot core under the shade and a cone falling to the bench
      c.save();
      c.globalCompositeOperation = 'lighter';
      const fl = 1 + 0.02 * Math.sin(env.t * 3.1);
      const g = c.createRadialGradient(250, 106, 2, 250, 112, 150 * fl);
      g.addColorStop(0, withAlpha(warm, 0.75 * lamp));
      g.addColorStop(0.18, withAlpha(warm, 0.32 * lamp));
      g.addColorStop(0.6, withAlpha(warm, 0.08 * lamp));
      g.addColorStop(1, withAlpha(warm, 0));
      c.fillStyle = g;
      c.fillRect(100, -44, 300, 300);
      c.beginPath();
      c.moveTo(240, 100);
      c.lineTo(264, 104);
      c.lineTo(380, 200);
      c.lineTo(150, 200);
      c.closePath();
      const cg = c.createLinearGradient(0, 100, 0, 200);
      cg.addColorStop(0, withAlpha(warm, 0.22 * lamp));
      cg.addColorStop(1, withAlpha(warm, 0.03 * lamp));
      c.fillStyle = cg;
      c.fill();
      c.restore();
      // the lit underside of the shade
      c.fillStyle = withAlpha(mixLab('#f6c48a', env.mood.core, 0.2), 0.95 * lamp);
      c.beginPath();
      c.moveTo(262, 104);
      c.lineTo(236, 96);
      c.lineTo(244, 101);
      c.lineTo(258, 105);
      c.closePath();
      c.fill();
    });
  }
  void keyS;
}

/** L3: the bench's far edge with its silhouettes: the anglepoise lamp (off), a stack of books, the ledger cabinet */
function benchFar(c: C, env: PaintEnv) {
  c.translate(0, 60);
  const ink = env.fill('set');
  c.fillStyle = ink;
  // the bench's far edge (the top surface recedes behind the quilt)
  c.fillRect(-360, 196, 2000, 200);
  // lamp at left
  c.beginPath();
  c.rect(200, 186, 40, 10);
  c.moveTo(214, 188);
  c.lineTo(208, 120);
  c.lineTo(215, 120);
  c.lineTo(222, 188);
  c.moveTo(208, 122);
  c.lineTo(240, 80);
  c.lineTo(246, 84);
  c.lineTo(215, 124);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(232, 72);
  c.lineTo(272, 84);
  c.lineTo(262, 104);
  c.lineTo(236, 96);
  c.closePath();
  c.fill();
  // books, stacked and leaning
  c.fillRect(300, 168, 70, 28);
  c.fillRect(306, 150, 62, 18);
  c.save();
  c.translate(392, 196);
  c.rotate(-0.22);
  c.fillRect(0, -64, 12, 64);
  c.restore();
  // the ledger cabinet: a tall paper cabinet of labelled drawers (ch11 staging: L3, beside the bench)
  c.fillRect(1050, -40, 150, 236);
  c.fillRect(1040, -52, 170, 14);
  c.strokeStyle = withAlpha(env.mood.rim, 0.16);
  c.lineWidth = 1.2;
  for (let k = 0; k < 4; k++) {
    c.strokeRect(1062, -24 + k * 54, 126, 44);
    c.beginPath();
    c.arc(1125, -2 + k * 54, 3, 0, Math.PI * 2);
    c.stroke();
  }
  // rim on the tops only (the window light comes from above and behind)
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.5);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-360, 196);
  c.lineTo(1640, 196);
  c.moveTo(1040, -52);
  c.lineTo(1210, -52);
  c.moveTo(232, 72);
  c.lineTo(272, 84);
  c.stroke();
}

/** L5: the near bench lip, dark and soft, under the quilt's near edge; `props` (L5 px): an inkpot with its dip pen
 *  and a steel rule lying across the near corner, so a camera move slides the near plane against the window wall */
export function quiltNear(f: Frame, o: { props?: Pt } = {}) {
  if (o.props) {
    const at = o.props;
    f.layer('L5', (c, env) => {
      f.cached(`ch11quilt/L5props/${env.mood.id}`, 640, 420, (cc2) => {
        cc2.translate(320, 300);
        nearProps(cc2, env);
      })(c, at.x - 320, at.y - 300);
    });
  }
  f.layer('L5', (c, env) => {
    f.cached(`ch11quilt/L5/${env.mood.id}`, 2600, 420, (cc2) => {
      cc2.translate(660, -640);
      cc2.fillStyle = mixLab(env.mood.fg, env.mood.ink, 0.4);
      cc2.beginPath();
      cc2.moveTo(-660, 742);
      cc2.quadraticCurveTo(640, 712, 1940, 736);
      cc2.lineTo(1940, 1060);
      cc2.lineTo(-660, 1060);
      cc2.closePath();
      cc2.fill();
      cc2.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.4);
      cc2.lineWidth = 2;
      cc2.beginPath();
      cc2.moveTo(-660, 742);
      cc2.quadraticCurveTo(640, 712, 1940, 736);
      cc2.stroke();
    })(c, -660, 640);
  });
}

/** the near props, origin = the inkpot's foot: a squat inkpot, a dip pen leaning out of it, a steel rule */
function nearProps(c: C, env: PaintEnv) {
  const ink = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.12);
  const rim = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.35), 0.6);
  c.fillStyle = ink;
  // the rule, lying at an angle across the bench and off frame to the right
  c.save();
  c.rotate(-0.16);
  c.fillRect(-150, 30, 620, 26);
  c.strokeStyle = rim;
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(-150, 30);
  c.lineTo(470, 30);
  c.stroke();
  c.strokeStyle = withAlpha(env.mood.rim, 0.22);
  c.lineWidth = 1;
  c.beginPath();
  for (let k = 0; k < 30; k++) {
    c.moveTo(-140 + k * 20, 31);
    c.lineTo(-140 + k * 20, k % 5 ? 37 : 42);
  }
  c.stroke();
  c.restore();
  // the inkpot: squat, shouldered, a short neck
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-62, 0);
  c.lineTo(-58, -58);
  c.quadraticCurveTo(-56, -76, -30, -80);
  c.lineTo(-20, -82);
  c.lineTo(-20, -100);
  c.lineTo(20, -100);
  c.lineTo(20, -82);
  c.lineTo(30, -80);
  c.quadraticCurveTo(56, -76, 58, -58);
  c.lineTo(62, 0);
  c.closePath();
  c.fill();
  // the dip pen leaning out of it
  c.save();
  c.translate(4, -96);
  c.rotate(-0.42);
  c.fillRect(-3, -150, 6, 152);
  c.fillRect(-4.5, -150, 9, 40);
  c.restore();
  // a cold rim on the shoulders and the pen's top edge (the window is behind)
  c.strokeStyle = rim;
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(-58, -58);
  c.quadraticCurveTo(-56, -76, -30, -80);
  c.moveTo(-20, -100);
  c.lineTo(20, -100);
  c.moveTo(30, -80);
  c.quadraticCurveTo(56, -76, 58, -58);
  c.stroke();
}

// ---------------------------------------------------------------- the quilt (L4)
const BENCH = { x: -400, y: 150, w: 2080, h: 800 };
function bakeBase(c: C, env: PaintEnv) {
  // the bench top: lit from the far windows, falling into darkness toward us
  const g = c.createLinearGradient(0, 180, 0, 760);
  g.addColorStop(0, mixLab(env.mood.setHaze, env.mood.set, 0.3));
  g.addColorStop(0.35, env.mood.set);
  g.addColorStop(1, mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.6));
  c.fillStyle = g;
  c.fillRect(BENCH.x, 196, BENCH.w, BENCH.h);
  // a band of window light lying across the far bench
  c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.2), 0.12);
  c.fillRect(BENCH.x, 196, BENCH.w, 6);
  // the quilt's cast shadow, then the paper (with a little margin round the cells)
  c.save();
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.45);
  c.translate(5, 8);
  c.beginPath();
  quadPath(c, -0.7, -0.7, QCOLS + 0.7, QROWS + 0.7);
  c.fill();
  c.restore();
  const pg = c.createLinearGradient(0, QUAD.p10.y, 0, QUAD.p01.y);
  pg.addColorStop(0, paperCol(env, 1));
  pg.addColorStop(1, mixLab(paperCol(env, 0), env.mood.set, 0.35));
  c.fillStyle = pg;
  c.beginPath();
  quadPath(c, -0.7, -0.7, QCOLS + 0.7, QROWS + 0.7);
  c.fill();
  // the paper's top edge catches the window light
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.7);
  c.lineWidth = 1.4;
  c.beginPath();
  const e0 = gp(-0.7, -0.7), e1 = gp(QCOLS + 0.7, -0.7);
  c.moveTo(e0.x, e0.y);
  c.lineTo(e1.x, e1.y);
  c.stroke();
  // the wells: every cell an inset paper well. Dark wells first (one path), then their shadow lips.
  const IN = 0.13;
  const dark = new Path2D();
  const lips = new Path2D();
  const shade = new Path2D();
  for (let j = 0; j < QROWS; j++) {
    for (let i = 0; i < QCOLS; i++) {
      if (isLit(i, j)) continue;
      quadPath(dark, i + IN, j + IN, i + 1 - IN, j + 1 - IN);
      // the near lip of the well catches light (lower edge), the far wall is in shadow (upper edge)
      const a = gp(i + IN, j + 1 - IN), b = gp(i + 1 - IN, j + 1 - IN);
      lips.moveTo(a.x, a.y);
      lips.lineTo(b.x, b.y);
      const s0 = gp(i + IN, j + IN), s1 = gp(i + 1 - IN, j + IN);
      shade.moveTo(s0.x, s0.y);
      shade.lineTo(s1.x, s1.y);
    }
  }
  c.fillStyle = wellCol(env);
  c.fill(dark);
  // paper wells are not machined: each one a shade lighter or darker (three bins, one fill each)
  for (const [bin, k, a] of [[0, PUPPET_NEAR_BLACK, 0.22], [1, env.mood.haze, 0.1]] as const) {
    const p = new Path2D();
    for (let j = 0; j < QROWS; j++) for (let i = 0; i < QCOLS; i++) {
      if (isLit(i, j)) continue;
      const h = hash1(key(i, j), 211);
      if ((bin === 0 && h > 0.45) || (bin === 1 && h < -0.5)) quadPath(p, i + IN, j + IN, i + 1 - IN, j + 1 - IN);
    }
    c.fillStyle = withAlpha(k, a);
    c.fill(p);
  }
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.55);
  c.lineWidth = 1.2;
  c.stroke(shade);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.haze, 0.3), 0.35);
  c.lineWidth = 0.8;
  c.stroke(lips);
  // the night window's light lying on the far half of the quilt, falling off toward us and the near corners
  c.save();
  const pool = c.createRadialGradient(700, 210, 40, 700, 260, 640);
  pool.addColorStop(0, withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.16));
  pool.addColorStop(0.5, withAlpha(env.mood.rim, 0.04));
  pool.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0.32));
  c.fillStyle = pool;
  c.beginPath();
  quadPath(c, -0.7, -0.7, QCOLS + 0.7, QROWS + 0.7);
  c.fill();
  c.restore();
  // a faint haze lying low over the far wells (winterBlue night air on the bench)
  const hz = c.createLinearGradient(0, QUAD.p10.y, 0, QUAD.p01.y);
  hz.addColorStop(0, withAlpha(env.mood.haze, 0.22));
  hz.addColorStop(0.6, withAlpha(env.mood.haze, 0.06));
  hz.addColorStop(1, withAlpha(env.mood.haze, 0));
  c.fillStyle = hz;
  c.fill(dark);
  bakeLitCells(c, env);
}
/** the lit cells: shallow wells of warm copper light (in the base bake, and again above the stencil in ch11-s01b) */
function bakeLitCells(c: C, env: PaintEnv) {
  const IN = 0.13;
  for (let j = 0; j < QROWS; j++) {
    for (let i = 0; i < QCOLS; i++) {
      if (!isLit(i, j)) continue;
      const p = new Path2D();
      quadPath(p, i + IN, j + IN, i + 1 - IN, j + 1 - IN);
      const a = gp(i + 0.5, j + IN), b = gp(i + 0.5, j + 1 - IN);
      const lg = c.createLinearGradient(a.x, a.y, b.x, b.y);
      lg.addColorStop(0, litCol(env, 0.05));
      lg.addColorStop(1, litCol(env, 0.32));
      c.fillStyle = lg;
      c.fill(p);
      c.strokeStyle = withAlpha(mixLab(copperOf(env, 0), PUPPET_NEAR_BLACK, 0.3), 0.6);
      c.lineWidth = 0.8;
      c.beginPath();
      const s0 = gp(i + IN, j + IN), s1 = gp(i + 1 - IN, j + IN);
      c.moveTo(s0.x, s0.y);
      c.lineTo(s1.x, s1.y);
      c.stroke();
    }
  }
}
/** additive copper glow over the lit cells (baked once, drawn with 'lighter') */
function bakeGlow(c: C, env: PaintEnv) {
  for (let j = 0; j < QROWS; j++) {
    for (let i = 0; i < QCOLS; i++) {
      if (!isLit(i, j)) continue;
      const p = gp(i + 0.5, j + 0.5);
      const r = cellPx(i + 0.5, j + 0.5) * 1.4;
      const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, withAlpha(mixLab(env.mood.halo, '#d48a48', 0.7), 0.34));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(p.x - r, p.y - r, 2 * r, 2 * r);
    }
  }
}
function bakePins(c: C, env: PaintEnv) {
  for (let j = 0; j < QROWS; j++) {
    for (let i = 0; i < QCOLS; i++) {
      if (!isLit(i, j)) continue;
      const p = gp(i + 0.5, j + 0.5);
      const r = Math.max(1.1, cellPx(i + 0.5, j + 0.5) * 0.13);
      // the pin's shadow, its copper head, a frozen glint
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.5);
      c.beginPath();
      c.ellipse(p.x + r * 0.6, p.y + r * 0.7, r, r * 0.7, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = mixLab(copperOf(env, 0.3), '#7a3f1c', 0.35);
      c.beginPath();
      c.arc(p.x, p.y, r, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.3), 0.9);
      c.beginPath();
      c.arc(p.x - r * 0.35, p.y - r * 0.4, r * 0.38, 0, Math.PI * 2);
      c.fill();
    }
  }
}

/** the shapes of the glyph vocabulary (beads and tiles): round, square, angled, bar */
export function glyph(c: C, kind: number, x: number, y: number, r: number, rot = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.beginPath();
  switch (kind % 4) {
    case 0:
      c.arc(0, 0, r, 0, Math.PI * 2);
      break;
    case 1:
      c.rect(-r * 0.86, -r * 0.86, r * 1.72, r * 1.72);
      break;
    case 2:
      c.moveTo(0, -r * 1.1);
      c.lineTo(r * 1.05, r * 0.75);
      c.lineTo(-r * 1.05, r * 0.75);
      c.closePath();
      break;
    default:
      c.rect(-r * 1.15, -r * 0.42, r * 2.3, r * 0.84);
  }
  c.restore();
}

/** each dark well's tiles: its candidates (3 or 4) with blend weights, and the strongest (the one it snaps to) */
export function tilesOf(i: number, j: number) {
  const n = 3 + (hash1(key(i, j), 77) > 0.2 ? 1 : 0);
  const kinds: number[] = [];
  const w: number[] = [];
  let best = 0;
  for (let k = 0; k < n; k++) {
    kinds.push(Math.floor((hash1(key(i, j) * 7 + k, 79) + 1) * 2) % 4);
    w.push(0.35 + 0.65 * (hash1(key(i, j) * 7 + k, 83) + 1) / 2);
    if (w[k] > w[best]) best = k;
  }
  return { kinds, w, best };
}
/** variant 0/1: the soft blend (faint copper tiles overlapping), two weightings for the shimmer; 2: snapped */
function bakeTiles(c: C, env: PaintEnv, variant: 0 | 1 | 2) {
  const col = tileCol(env);
  for (let j = 0; j < QROWS; j++) {
    for (let i = 0; i < QCOLS; i++) {
      if (isLit(i, j)) continue;
      const p = gp(i + 0.5, j + 0.5);
      const r = cellPx(i + 0.5, j + 0.5) * (variant === 2 ? 0.27 : 0.26);
      const tt = tilesOf(i, j);
      if (variant === 2) {
        const k = tt.kinds[tt.best];
        c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.4);
        glyph(c, k, p.x + r * 0.25, p.y + r * 0.3, r);
        c.fill();
        c.fillStyle = mixLab(col, env.mood.set, 0.5);
        glyph(c, k, p.x, p.y, r);
        c.fill();
        c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.28);
        c.lineWidth = 0.7;
        c.stroke();
      } else {
        tt.kinds.forEach((k, m) => {
          const ph = variant === 0 ? tt.w[m] : 1 - tt.w[m] * 0.7;
          c.fillStyle = withAlpha(col, 0.07 + 0.13 * ph);
          const off = (m - (tt.kinds.length - 1) / 2) * r * 0.32;
          glyph(c, k, p.x + off, p.y - off * 0.4, r * (0.85 + 0.2 * ph), m * 0.3);
          c.fill();
        });
      }
    }
  }
}
/** the stencil: paper over the quilt, solid over the lit cells, cut open over every dark well (evenodd). Review r1:
 *  its value sits at ~45 % of the old pale paper (a night-dark sheet, not a grey veil), falling off toward the far
 *  edge into the winterBlue haze, so the backlight through the holes reads brighter than the paper */
function bakeStencil(c: C, env: PaintEnv) {
  const p = new Path2D();
  quadPath(p, -1.1, -1.1, QCOLS + 1.1, QROWS + 1.1);
  const IN = 0.08;
  for (let j = 0; j < QROWS; j++) for (let i = 0; i < QCOLS; i++) if (!isLit(i, j)) quadPath(p, i + IN, j + IN, i + 1 - IN, j + 1 - IN);
  const g = c.createLinearGradient(0, QUAD.p10.y, 0, QUAD.p01.y);
  const paper = mixLab(mixLab('#cfc8b6', env.mood.rim, 0.3), env.mood.haze, 0.32);
  g.addColorStop(0, mixLab(mixLab(paper, PUPPET_NEAR_BLACK, 0.66), env.mood.haze, 0.22));
  g.addColorStop(0.35, mixLab(paper, PUPPET_NEAR_BLACK, 0.7));
  g.addColorStop(1, mixLab(mixLab('#b4ac9a', env.mood.set, 0.4), PUPPET_NEAR_BLACK, 0.78));
  c.fillStyle = g;
  c.fill(p, 'evenodd');
  // its edge, lit along the far side
  c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), 0.7);
  c.lineWidth = 1.2;
  const e0 = gp(-1.1, -1.1), e1 = gp(QCOLS + 1.1, -1.1);
  c.beginPath();
  c.moveTo(e0.x, e0.y);
  c.lineTo(e1.x, e1.y);
  c.stroke();
}

const BAKE = { x: -60, y: 150, w: 1400, h: 640 };
function baked(f: Frame, name: string, env: PaintEnv, draw: (c: C) => void, res = 1.6) {
  return f.cached(`ch11quilt/${name}/${env.mood.id}`, BAKE.w, BAKE.h, (cc2) => {
    cc2.translate(-BAKE.x, -BAKE.y);
    draw(cc2);
  }, { res } as { blur?: number });
}

export interface QuiltOpts {
  /** ch11-s01b: 0..1 the soft blends filling the wells */
  blend?: number;
  /** shimmer phase (seconds) */
  shimmer?: number;
  /** the snapped region: a staircase front (cells): a well (i, j) is snapped when i + SLOPE*j < front */
  front?: number;
  /** extra light over the dark wells (a sweep that shows them as the majority), 0..1, and its x position */
  sweep?: { u: number; x: number };
  /** the bench lamp's warm pool on the quilt's far-left corner, 0..1 (default 1) */
  lamp?: number;
  /** false: leave out the lit cells' additive glow (ch11-s01b paints it above the stencil with drawLitCells) */
  glow?: boolean;
}
export const FRONT_SLOPE = 0.45;
export const FRONT_MAX = QCOLS + FRONT_SLOPE * QROWS + 1;

/** L4: bench, quilt, wells, lit cells and their glow (and, in ch11-s01b, the trained tiles) */
export function drawQuilt(f: Frame, c: C, env: PaintEnv, o: QuiltOpts = {}) {
  // the bench top beyond the bake (wide, plain), with the bake's own fall from window-lit to dark (no seam)
  c.fillStyle = mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.6);
  c.fillRect(-500, 700, 2300, 400);
  const bg = c.createLinearGradient(0, 180, 0, 760);
  bg.addColorStop(0, mixLab(env.mood.setHaze, env.mood.set, 0.3));
  bg.addColorStop(0.35, env.mood.set);
  bg.addColorStop(1, mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.6));
  c.fillStyle = bg;
  c.fillRect(-500, 196, 441, 560);
  c.fillRect(1339, 196, 500, 560);
  baked(f, 'base', env, (b) => bakeBase(b, env))(c, BAKE.x, BAKE.y);
  if (o.glow !== false) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    baked(f, 'glow', env, (b) => bakeGlow(b, env), 1)(c, BAKE.x, BAKE.y);
    c.restore();
  }
  lampPool(c, env, clamp01(o.lamp ?? 1));
  const bl = clamp01(o.blend ?? 0);
  const front = o.front ?? -1;
  if (bl > 0.001) {
    const ph = o.shimmer ?? 0;
    // unsnapped region: the shimmering blend (two weightings crossfading)
    c.save();
    if (front > 0) {
      c.beginPath();
      staircase(c, front, true);
      c.clip('evenodd');
    }
    c.globalAlpha = bl;
    baked(f, 'blendA', env, (b) => bakeTiles(b, env, 0))(c, BAKE.x, BAKE.y);
    c.globalAlpha = bl * (0.5 + 0.5 * Math.sin(ph * 5.1));
    baked(f, 'blendB', env, (b) => bakeTiles(b, env, 1))(c, BAKE.x, BAKE.y);
    c.restore();
  }
  if (front > 0) {
    c.save();
    c.beginPath();
    staircase(c, front, false);
    c.clip();
    baked(f, 'snap', env, (b) => bakeTiles(b, env, 2))(c, BAKE.x, BAKE.y);
    c.restore();
  }
  const sw = o.sweep;
  if (sw && sw.u > 0.001) {
    // a cool sheen sliding across the dark wells (the majority) while the lit cells stay as they are
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createLinearGradient(sw.x - 260, 0, sw.x + 260, 0);
    g.addColorStop(0, withAlpha(env.mood.halo, 0));
    g.addColorStop(0.5, withAlpha(env.mood.halo, 0.1 * sw.u));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.beginPath();
    quadPath(c, 0, 0, QCOLS, QROWS);
    c.fill();
    c.restore();
  }
}
/** the bench lamp's pool: warm light grazing the quilt's far-left quarter, falling off into the winterBlue night
 *  (and a cold falloff that darkens the far-right and near corners, so the bench is never evenly grey) */
function lampPool(c: C, env: PaintEnv, k: number) {
  const q = gp(0, 0);
  c.save();
  // the night falloff first: away from the lamp and the window, the paper goes down toward the dark
  const dk = c.createRadialGradient(q.x + 120, q.y + 60, 80, q.x + 260, q.y + 160, 980);
  dk.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0));
  dk.addColorStop(0.55, withAlpha(PUPPET_NEAR_BLACK, 0.14));
  dk.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0.42));
  c.fillStyle = dk;
  c.beginPath();
  quadPath(c, -0.7, -0.7, QCOLS + 0.7, QROWS + 0.7);
  c.fill();
  if (k > 0.001) {
    c.globalCompositeOperation = 'lighter';
    c.translate(q.x - 10, q.y + 40);
    c.scale(1, 0.5);
    const g = c.createRadialGradient(0, 0, 10, 0, 0, 420);
    const warm = mixLab('#e89850', env.mood.core, 0.1);
    g.addColorStop(0, withAlpha(warm, 0.42 * k));
    g.addColorStop(0.45, withAlpha(warm, 0.17 * k));
    g.addColorStop(1, withAlpha(warm, 0));
    c.fillStyle = g;
    c.fillRect(-420, -420, 840, 840);
  }
  c.restore();
}

/** the snapped region's outline: rows of cells with i + SLOPE*j < front (or, inverted, the grid minus it) */
function staircase(c: C, front: number, invert: boolean) {
  if (invert) quadPath(c, -2, -2, QCOLS + 2, QROWS + 2);
  const cols: number[] = [];
  for (let j = 0; j < QROWS; j++) cols.push(Math.max(0, Math.min(QCOLS, Math.floor(front - FRONT_SLOPE * j))));
  // build the polygon: down the left edge, back up along the staircase
  const pts: Pt[] = [gp(0, 0)];
  for (let j = 0; j < QROWS; j++) pts.push(gp(0, j + 1));
  for (let j = QROWS - 1; j >= 0; j--) {
    pts.push(gp(cols[j], j + 1));
    pts.push(gp(cols[j], j));
  }
  c.moveTo(pts[0].x, pts[0].y);
  for (let k = 1; k < pts.length; k++) c.lineTo(pts[k].x, pts[k].y);
  c.closePath();
}
/** the wells on the snapping front this tick (for the detent glints) */
export function frontCells(front: number): [number, number][] {
  const out: [number, number][] = [];
  if (front <= 0) return out;
  for (let j = 0; j < QROWS; j++) {
    const i = Math.floor(front - FRONT_SLOPE * j) - 1;
    if (i >= 0 && i < QCOLS && !isLit(i, j)) out.push([i, j]);
  }
  return out;
}

export function drawPins(f: Frame, c: C, env: PaintEnv) {
  baked(f, 'pins', env, (b) => bakePins(b, env))(c, BAKE.x, BAKE.y);
}
/** the 240 lit cells (copper, glow, pins) alone, at full constant brightness: ch11-s01b paints them ABOVE the stencil
 *  so the valid path is the one steady thing while everything around it moves (review r1) */
export function drawLitCells(f: Frame, c: C, env: PaintEnv) {
  baked(f, 'litcells', env, (b) => bakeLitCells(b, env))(c, BAKE.x, BAKE.y);
  c.save();
  c.globalCompositeOperation = 'lighter';
  baked(f, 'glow', env, (b) => bakeGlow(b, env), 1)(c, BAKE.x, BAKE.y);
  c.restore();
  drawPins(f, c, env);
}
/** the backlight glowing THROUGH the stencil's holes (the open wells), additive, 0..1; draw only while it is registered */
export function drawHoleGlow(f: Frame, c: C, env: PaintEnv, k: number) {
  if (k <= 0.001) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = clamp01(k);
  baked(f, 'holeglow', env, (b) => {
    const p = new Path2D();
    for (let j = 0; j < QROWS; j++) for (let i = 0; i < QCOLS; i++) if (!isLit(i, j)) quadPath(p, i + 0.1, j + 0.1, i + 0.9, j + 0.9);
    const g = b.createLinearGradient(0, QUAD.p10.y, 0, QUAD.p01.y);
    g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.rim, 0.4), 0.22));
    g.addColorStop(1, withAlpha(mixLab(env.mood.halo, env.mood.rim, 0.4), 0.13));
    b.fillStyle = g;
    b.fill(p);
  }, 1)(c, BAKE.x, BAKE.y);
  c.restore();
}

export interface StencilOpts {
  /** offset (L4 px) and scale about the near-left corner while carried; alpha */
  dx?: number;
  dy?: number;
  lift?: number;
  alpha?: number;
}
/** the stencil, carried (dx, dy, lifted toward the lens) or lying registered on the quilt (all 0) */
export function drawStencil(f: Frame, c: C, env: PaintEnv, o: StencilOpts = {}) {
  const a = clamp01(o.alpha ?? 1);
  if (a <= 0.001) return;
  const lift = clamp01(o.lift ?? 0);
  const piv = gp(0, QROWS);
  c.save();
  c.globalAlpha = a;
  // its shadow on the quilt grows softer and further as it lifts
  if (lift > 0.01) {
    c.save();
    c.globalAlpha = a * (0.35 - 0.15 * lift);
    c.translate((o.dx ?? 0) + 10 + 30 * lift, (o.dy ?? 0) + 14 + 40 * lift);
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.beginPath();
    quadPath(c, -1.1, -1.1, QCOLS + 1.1, QROWS + 1.1);
    c.fill();
    c.restore();
  }
  c.translate((o.dx ?? 0) + piv.x, (o.dy ?? 0) + piv.y);
  const s = 1 + 0.06 * lift;
  c.scale(s, s);
  c.translate(-piv.x, -piv.y);
  baked(f, 'stencil', env, (b) => bakeStencil(b, env))(c, BAKE.x, BAKE.y);
  c.restore();
}

// ---------------------------------------------------------------- bead-threads of light
export interface ThreadRun {
  route: Route;
  /** arc length (cells) of the head bead */
  head: number;
  /** number of beads, spacing (cells) */
  n?: number;
  gap?: number;
  /** 0..1 how compressed the beads behind the head are (the stall: beads stack up) */
  stack?: number;
  /** the head bead is the kinked one (out of place) */
  kinked?: boolean;
  alpha?: number;
  /** ghost: outlines only (ch11-s01b's first run lying over the second) */
  ghost?: boolean;
  /** a seed for the bead sequence */
  seed?: number;
  /** a small jolt (the relay clack), stage px */
  jolt?: number;
}
/** a thread of light with glyph beads along a route (draw in L4 after the quilt) */
export function drawBeadThread(c: C, env: PaintEnv, r: ThreadRun) {
  const n = r.n ?? 14;
  const gap = r.gap ?? 0.95;
  const a = clamp01(r.alpha ?? 1);
  if (a <= 0.001) return;
  const st = clamp01(r.stack ?? 0);
  const col = beadCol(env);
  const pos: (Pt & { dir: number; k: number })[] = [];
  for (let k = 0; k < n; k++) {
    // stacked: the spacing behind the head closes to about 40 % (0.95 -> 0.38 cells): the trailing beads bunch up
    // in the cells before the well, each still its own shape (review r1: a white clump read as nothing)
    const g = gap * (1 - 0.6 * st);
    const s = r.head - k * g;
    if (s < -3.2 || s > r.route.len + 3.4) continue;
    const p = routeAt(r.route, s);
    // crowded beads shoulder sideways a little (they stack, not overlap)
    const side = st > 0 && k > 0 ? Math.sin(k * 2.3) * 0.08 * st : 0;
    pos.push({ x: p.x - Math.sin(p.dir) * side, y: p.y + Math.cos(p.dir) * side, dir: p.dir, k });
  }
  if (!pos.length) return;
  const J = r.jolt ?? 0;
  const scr = pos.map((p) => {
    const q = gp(p.x, p.y);
    return { ...p, sx: q.x + J, sy: q.y, cw: cellPx(Math.max(0, Math.min(QCOLS, p.x)), Math.max(0, Math.min(QROWS, p.y))) };
  });
  c.save();
  c.globalAlpha = a;
  // the thread itself: a fine line of light joining the beads
  if (!r.ghost) {
    c.strokeStyle = withAlpha(col, 0.5);
    c.lineWidth = 1.1;
    c.beginPath();
    scr.forEach((p, i) => (i ? c.lineTo(p.sx, p.sy) : c.moveTo(p.sx, p.sy)));
    c.stroke();
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (const p of scr) {
      const rr = p.cw * 1.1;
      const g = c.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, rr);
      g.addColorStop(0, withAlpha(env.mood.core, 0.5));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(p.sx - rr, p.sy - rr, rr * 2, rr * 2);
    }
    c.restore();
  }
  const seed = r.seed ?? 3;
  for (const p of scr) {
    const kind = Math.floor((hash1(p.k, seed) + 1) * 2) % 3;
    const rad = p.cw * 0.34;
    let x = p.sx, y = p.sy, rot = p.dir;
    let kd = kind;
    const isKink = !!r.kinked && p.k === 0;
    if (isKink) {
      // the kinked bead (review r1): a bar knocked about 35 deg crooked and shouldered half a bead off the line, in
      // the night's cold rim colour, so the one bead out of place reads at a glance among the warm-white others
      kd = 3;
      rot = p.dir + 0.61;
      x += -Math.sin(p.dir) * rad;
      y += Math.cos(p.dir) * rad;
    }
    if (isKink && !r.ghost) {
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.55);
      glyph(c, kd, x + rad * 0.3, y + rad * 0.4, rad * 1.45, rot);
      c.fill();
      c.fillStyle = mixLab(env.mood.rim, '#8fb8e0', 0.45);
      glyph(c, kd, x, y, rad * 1.45, rot);
      c.fill();
      c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.8);
      c.lineWidth = Math.max(0.8, rad * 0.16);
      c.stroke();
      continue;
    }
    if (r.ghost) {
      // the ghost hugs its bead exactly (review r1: it lies ON the path, bead for bead)
      c.strokeStyle = withAlpha(col, 0.9);
      c.lineWidth = Math.max(1, rad * 0.16);
      glyph(c, kd, x, y, rad * 1.22, rot);
      c.stroke();
    } else {
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.35);
      glyph(c, kd, x + rad * 0.3, y + rad * 0.4, rad, rot);
      c.fill();
      c.fillStyle = col;
      glyph(c, kd, x, y, rad, rot);
      c.fill();
    }
  }
  c.restore();
}
