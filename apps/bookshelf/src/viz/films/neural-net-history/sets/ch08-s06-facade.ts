/**
 * ch08-s06 / ch08-s09 — the AlexNet cathedral seen from its steps: a forced-perspective (paper-theatre flat)
 * elevation of `alexnetCathedral` with the ROSE WINDOW large at the base, so its 96 first-layer stencils read.
 * Same building, same true proportions as the kit's elevation (face width <- 55, 27, 13, 13, 13; the fully
 * connected halls as tall narrow blocks; one tower per GPU; bridges ONLY into conv3, fc6, fc7 and the crown,
 * fc8), with the courses diminishing toward a vanishing point above the crown.
 *
 * World coordinates are the action plane (L4) at CAMERA3_HOME.
 *
 *   FAC                          the layout: window {x, y, r (glass), ring}, plinth, levels[], bridges[], crown
 *   windowTiles()                96 tile slots (k, x, y, size, half: 0 = left/GPU 1, 1 = right/GPU 2)
 *   facade(c, opts, env)         draw it (call inside f.layer('L4'))
 *     split      0..1           the façade parts down the middle (one tower per card); the sky shows through
 *     flow       [l, r] 0..1    light rising inside each tower from the window to the crown
 *     tug        (li, gpu) 0..1 a block's lancets flare (a messenger passing, a pulse)
 *     bridgeLit  number[4]      light crossing each bridge (conv3, fc6, fc7, fc8)
 *     glass      (c, half, dx)  paints the window glass for one half (tiles), already clipped
 *     glassLight 0..1           sunlight through the glass (a halo spilling onto the stone)
 *     led        0..1           a status LED in each tower's portal (ch08-s09)
 *     ledColor   string
 *   beadPath(side, u)            a point on the messenger's route: crown -> bridge -> down the tower's column shaft ->
 *                                cornice -> the window's crown (u 0..1), with `li` = the block it is passing
 *   halfDx(split, half)          the x offset of a half at a split amount
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { ALEXNET } from '../../../film/silhouette/metaphors/alexnetCathedral';
import { addFoil } from '../../../film/silhouette/ornament';

type C = CanvasRenderingContext2D;
const CX = 640;
export const SPLIT_GAP = 30;

export const WIN = { x: 640, y: 470, r: 194, ring: 216 };
const PL = { x0: 150, x1: 1130, top: 226, bottom: 780 };
const TOWER_TOP = -250;
const AXIS = 340;

export interface Level {
  li: number;
  y0: number; // top
  y1: number; // bottom
  sig: number; // perspective scale at this course
  fw: number; // face width
  axis: number; // tower axis offset from CX
  d: number; // side depth
}

function buildLevels(kh: number): { levels: Level[]; top: number } {
  const sig = (y: number) => 0.5 + 0.5 * Math.max(0, Math.min(1, (y - TOWER_TOP) / (PL.top - TOWER_TOP)));
  const levels: Level[] = [];
  let y = PL.top - 6;
  ALEXNET.layers.forEach((L, li) => {
    if (L.id === 'fc8') return;
    const s = sig(y);
    const fw = (L.hw ? 30 + L.hw * 2.4 : 40) * s;
    const fh = (L.hw ? 18 + L.hw * 1.05 : (L.c / 2048) * 30) * s * kh;
    const d = (L.hw ? 8 + L.split[0] * 0.1 : 12) * s * 0.8;
    levels.push({ li, y0: y - fh, y1: y, sig: s, fw, axis: AXIS * (0.62 + 0.38 * s), d });
    y -= fh + 6 * s;
  });
  return { levels, top: y };
}
const LV = (() => {
  // fit the stack so the fc7 top sits at TOWER_TOP (the crown's spire rises above it)
  let lo = 0.3;
  let hi = 4;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (buildLevels(m).top < TOWER_TOP) hi = m;
    else lo = m;
  }
  return buildLevels((lo + hi) / 2);
})();

const TOP = LV.top + 4; // fc7 top
const CROWN = { y: TOP - 2, sig: LV.levels[LV.levels.length - 1].sig };

export interface Bridge {
  li: number;
  y: number;
  /** inner edge of the left block / right block at split 0 */
  xl: number;
  xr: number;
}
const BRIDGES: Bridge[] = [2, 5, 6].map((li) => {
  const L = LV.levels[li];
  const below = LV.levels[li - 1];
  const y = L.y1 + 1;
  const xl = CX - below.axis + below.fw / 2 + below.d * 0.8;
  return { li, y, xl, xr: 2 * CX - xl };
});
{
  const L = LV.levels[6];
  const xl = CX - L.axis + L.fw / 2 + L.d * 0.8;
  BRIDGES.push({ li: 7, y: CROWN.y - 3, xl, xr: 2 * CX - xl });
}

export const FAC = { CX, WIN, PL, levels: LV.levels, bridges: BRIDGES, crown: CROWN, top: TOP };

export const halfDx = (split: number, half: number) => (half === 0 ? -1 : 1) * split * (SPLIT_GAP / 2);

// ------------------------------------------------------------------------------------------- window tiles
export interface TileSlot {
  k: number;
  x: number;
  y: number;
  size: number;
  half: 0 | 1;
  row: number;
}
const ROW_N = [6, 8, 10, 12, 12, 12, 12, 10, 8, 6];
export const TILE_PITCH = 30;
export const TILE_PITCH_Y = 33;
const SLOTS: TileSlot[] = (() => {
  const out: TileSlot[] = [];
  const p = TILE_PITCH;
  let kL = 0;
  let kR = 48;
  ROW_N.forEach((n, j) => {
    const y = WIN.y + (j - (ROW_N.length - 1) / 2) * TILE_PITCH_Y;
    const h = n / 2;
    // left half: outer -> centre (so each row's first GPU-1 tile is its outermost)
    for (let i = 0; i < h; i++) out.push({ k: kL++, x: WIN.x - (h - i - 0.5) * p, y, size: p - 3, half: 0, row: j });
    for (let i = 0; i < h; i++) out.push({ k: kR++, x: WIN.x + (h - i - 0.5) * p, y, size: p - 3, half: 1, row: j });
  });
  return out;
})();
export const windowTiles = () => SLOTS;
export const tileSlot = (k: number) => SLOTS.find((s) => s.k === k)!;

// ------------------------------------------------------------------------------------------- static paths
function arched(p: Path2D, cx: number, w: number, yTop: number, yBot: number) {
  p.moveTo(cx - w / 2, yBot);
  p.lineTo(cx - w / 2, yTop + w * 0.55);
  p.quadraticCurveTo(cx - w / 2, yTop + w * 0.08, cx, yTop);
  p.quadraticCurveTo(cx + w / 2, yTop + w * 0.08, cx + w / 2, yTop + w * 0.55);
  p.lineTo(cx + w / 2, yBot);
  p.closePath();
}

/** one half of the plinth (0 = left of the centre line, 1 = right), with the window and the portal cut out */
const PLINTH_HALF: Path2D[] = [0, 1].map((half) => {
  const p = new Path2D();
  const xa = half === 0 ? PL.x0 : CX;
  const xb = half === 0 ? CX : PL.x1;
  p.rect(xa, PL.top, xb - xa, PL.bottom - PL.top);
  // the window hole (its half)
  const a0 = half === 0 ? Math.PI / 2 : -Math.PI / 2;
  p.moveTo(CX, WIN.y + (half === 0 ? WIN.ring : -WIN.ring));
  p.arc(CX, WIN.y, WIN.ring, a0, a0 + Math.PI, false);
  p.closePath();
  // the portal under the tower (open to the dawn)
  const ax = half === 0 ? CX - LV.levels[0].axis : CX + LV.levels[0].axis;
  arched(p, ax, 70, 476, 708);
  // small lancets flanking the portal, and a pierced quatrefoil over it
  for (const dx of [-64, 64]) arched(p, ax + dx, 16, 520, 640);
  addFoil(p, ax, 420, 15, 4, { rot: Math.PI / 4 });
  // a run of pierced trefoils under the cornice (the façade's repeating ornament)
  const xs0 = half === 0 ? PL.x0 + 22 : CX + WIN.ring + 26;
  const xs1 = half === 0 ? CX - WIN.ring - 26 : PL.x1 - 22;
  for (let x = xs0; x <= xs1 + 0.1; x += (xs1 - xs0) / 6) addFoil(p, x, PL.top + 26, 7, 3);
  return p;
});

/** the ring of stone around the glass with pierced trefoils, per half */
const RING_HALF: Path2D[] = [0, 1].map((half) => {
  const p = new Path2D();
  const a0 = half === 0 ? Math.PI / 2 : -Math.PI / 2;
  p.moveTo(CX, WIN.y + (half === 0 ? WIN.ring : -WIN.ring));
  p.arc(CX, WIN.y, WIN.ring, a0, a0 + Math.PI, false);
  p.lineTo(CX, WIN.y + (half === 0 ? -WIN.r : WIN.r));
  p.arc(CX, WIN.y, WIN.r, a0 + Math.PI, a0, true);
  p.closePath();
  // pierced trefoils in the ring (the rose's petals)
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = a0 + ((i + 0.5) / n) * Math.PI;
    const rr = (WIN.r + WIN.ring) / 2;
    addFoil(p, CX + Math.cos(a) * rr, WIN.y + Math.sin(a) * rr, 6.5, 3, { rot: a });
  }
  return p;
});

/** the came (lead) inside the glass: the disc minus the tile panes, per half */
const CAME_HALF: Path2D[] = [0, 1].map((half) => {
  const p = new Path2D();
  const a0 = half === 0 ? Math.PI / 2 : -Math.PI / 2;
  p.moveTo(CX, WIN.y + (half === 0 ? WIN.r : -WIN.r));
  p.arc(CX, WIN.y, WIN.r + 0.5, a0, a0 + Math.PI, false);
  p.closePath();
  for (const s of SLOTS) {
    if (s.half !== half) continue;
    p.rect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
  }
  return p;
});
/** small pierced lights in the leftover stone of the disc */
const SPANDREL_LIGHTS: Path2D[] = [0, 1].map((half) => {
  const p = new Path2D();
  const sgn = half === 0 ? -1 : 1;
  for (let j = 0; j < ROW_N.length; j++) {
    const y = WIN.y + (j - (ROW_N.length - 1) / 2) * TILE_PITCH_Y;
    const xEdge = (ROW_N[j] / 2) * TILE_PITCH + 9;
    const avail = Math.sqrt(Math.max(0, WIN.r * WIN.r - y * 0 - (y - WIN.y) * (y - WIN.y))) - 7;
    if (avail - xEdge > 6) {
      const x = CX + sgn * (xEdge + (avail - xEdge) / 2 - 1);
      p.moveTo(x + 2.4, y);
      p.arc(x, y, 2.4, 0, Math.PI * 2);
    }
  }
  return p;
});

/** a tower block: front face + oblique side toward the aisle; lancet windows as one path (holes for lit glass) */
interface BlockGeom {
  face: Path2D;
  side: Path2D;
  top: Path2D;
  lancets: Path2D[]; // three groups (activation variety)
  course: Path2D;
  cx: number;
  cy: number;
  w: number;
  h: number;
}
const BLOCKS: BlockGeom[][] = [0, 1].map((gpu) =>
  LV.levels.map((L) => {
    const dir = gpu === 0 ? 1 : -1;
    const ax = CX + (gpu === 0 ? -L.axis : L.axis);
    const fx = ax - L.fw / 2;
    const y = L.y0;
    const fh = L.y1 - L.y0;
    const dx = L.d * 0.8 * dir;
    const dy = -L.d * 0.45;
    const face = new Path2D();
    face.rect(fx, y, L.fw, fh);
    const sideX = dir > 0 ? fx + L.fw : fx;
    const side = new Path2D();
    side.moveTo(sideX, y);
    side.lineTo(sideX + dx, y + dy);
    side.lineTo(sideX + dx, y + fh + dy);
    side.lineTo(sideX, y + fh);
    side.closePath();
    const top = new Path2D();
    top.moveTo(fx, y);
    top.lineTo(fx + dx, y + dy);
    top.lineTo(fx + L.fw + dx, y + dy);
    top.lineTo(fx + L.fw, y);
    top.closePath();
    const lancets = [new Path2D(), new Path2D(), new Path2D()];
    const AL = ALEXNET.layers[L.li];
    const cols = AL.hw ? Math.max(2, Math.round(L.fw / (9 * L.sig))) : 2;
    const rows = Math.max(1, Math.round(fh / ((AL.hw ? 16 : 13) * L.sig)));
    const pw = (L.fw - 6 * L.sig) / cols;
    const ph = (fh - 6 * L.sig) / rows;
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++) {
        const wx = fx + 3 * L.sig + i * pw + pw * 0.22;
        const wy = y + 3 * L.sig + j * ph + ph * 0.15;
        const ww = pw * 0.56;
        const wh = ph * 0.7;
        const g = Math.floor(((Math.sin((L.li * 97 + gpu * 31 + i * 13 + j * 7) * 12.9898) * 43758.5453) % 1 + 1) % 1 * 3);
        const p = lancets[g];
        p.moveTo(wx, wy + wh);
        p.lineTo(wx, wy + ww * 0.5);
        p.quadraticCurveTo(wx + ww / 2, wy - ww * 0.35, wx + ww, wy + ww * 0.5);
        p.lineTo(wx + ww, wy + wh);
        p.closePath();
      }
    const course = new Path2D();
    course.rect(fx - 4 * L.sig, y + fh, L.fw + 8 * L.sig, 4 * L.sig);
    return { face, side, top, lancets, course, cx: ax, cy: y + fh / 2, w: L.fw, h: fh };
  }),
);

/** the outer column shafts: a slender colonnette up the outer edge of each tower (the messenger's road) */
const SHAFTS: Path2D[] = [0, 1].map((gpu) => {
  const p = new Path2D();
  const pts = LV.levels.map((L) => {
    const ax = CX + (gpu === 0 ? -L.axis : L.axis);
    return { x: ax, yb: L.y1, yt: L.y0, w: L.fw };
  });
  // finials over each tower
  const L6 = LV.levels[6];
  const ax = CX + (gpu === 0 ? -L6.axis : L6.axis);
  p.moveTo(ax - 9 * L6.sig, L6.y0);
  p.lineTo(ax, L6.y0 - 52 * L6.sig);
  p.lineTo(ax + 9 * L6.sig, L6.y0);
  p.closePath();
  void pts;
  return p;
});

const BRIDGE_PATHS = (dxl: number, dxr: number) => {
  const p = new Path2D();
  for (const b of BRIDGES) {
    const x0 = b.xl + dxl;
    const x1 = b.xr + dxr;
    const y = b.y;
    const s = b.li >= 5 ? 0.62 : 0.8;
    p.moveTo(x0, y - 9 * s);
    p.lineTo(x1, y - 9 * s);
    p.lineTo(x1, y + 13 * s);
    p.quadraticCurveTo((x0 + x1) / 2, y - 5 * s, x0, y + 13 * s);
    p.closePath();
    // balustrade
    p.rect(x0, y - 19 * s, x1 - x0, 2.6 * s);
    for (let x = x0 + 7 * s; x < x1 - 3 * s; x += 8 * s) p.rect(x, y - 17 * s, 2.4 * s, 8.5 * s);
  }
  return p;
};
const bridgeCache = new Map<number, Path2D>();
function bridgesAt(split: number): Path2D {
  const key = Math.round(split * 200);
  let p = bridgeCache.get(key);
  if (!p) {
    p = BRIDGE_PATHS(halfDx(key / 200, 0), halfDx(key / 200, 1));
    if (bridgeCache.size > 300) bridgeCache.clear();
    bridgeCache.set(key, p);
  }
  return p;
}

const CROWN_PATH = (() => {
  const p = new Path2D();
  const s = CROWN.sig;
  const y = CROWN.y;
  p.moveTo(CX - 66 * s, y);
  p.lineTo(CX - 66 * s, y - 14 * s);
  p.lineTo(CX, y - 96 * s);
  p.lineTo(CX + 66 * s, y - 14 * s);
  p.lineTo(CX + 66 * s, y);
  p.closePath();
  // the output lancet (fc8, the thousand answers) is a hole lit separately
  p.moveTo(CX - 11 * s, y - 6 * s);
  p.lineTo(CX - 11 * s, y - 40 * s);
  p.quadraticCurveTo(CX, y - 62 * s, CX + 11 * s, y - 40 * s);
  p.lineTo(CX + 11 * s, y - 6 * s);
  p.closePath();
  return p;
})();
const CROWN_LANCET = (() => {
  const p = new Path2D();
  const s = CROWN.sig;
  const y = CROWN.y;
  p.moveTo(CX - 11 * s, y - 6 * s);
  p.lineTo(CX - 11 * s, y - 40 * s);
  p.quadraticCurveTo(CX, y - 62 * s, CX + 11 * s, y - 40 * s);
  p.lineTo(CX + 11 * s, y - 6 * s);
  p.closePath();
  return p;
})();
export const CROWN_LIGHT = { x: CX, y: CROWN.y - 28 * CROWN.sig };

// ------------------------------------------------------------------------------------------- the messenger's road
interface RoadPt {
  x: number;
  y: number;
  li: number;
}
function road(side: 0 | 1): RoadPt[] {
  const sg = side === 0 ? -1 : 1;
  const pts: RoadPt[] = [];
  pts.push({ x: CX, y: CROWN_LIGHT.y, li: 7 });
  pts.push({ x: CX, y: BRIDGES[3].y - 6, li: 7 });
  const L6 = LV.levels[6];
  pts.push({ x: CX + sg * L6.axis, y: BRIDGES[3].y - 6, li: 6 });
  for (let i = LV.levels.length - 1; i >= 0; i--) {
    const L = LV.levels[i];
    pts.push({ x: CX + sg * L.axis, y: L.y0 + 2, li: L.li });
    pts.push({ x: CX + sg * L.axis, y: L.y1 - 2, li: L.li });
  }
  pts.push({ x: CX + sg * LV.levels[0].axis, y: PL.top + 8, li: -1 });
  pts.push({ x: CX + sg * 96, y: PL.top + 10, li: -1 });
  pts.push({ x: CX + sg * 18, y: WIN.y - WIN.ring + 4, li: -1 });
  pts.push({ x: CX, y: WIN.y - WIN.r * 0.35, li: -2 });
  return pts;
}
const ROADS = [road(0), road(1)].map((pts) => {
  const len = [0];
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, len, total: len[len.length - 1] };
});
/** a point on the messenger's road (u 0 = the crown's lancet, 1 = inside the window); li = the course it passes */
export function beadPath(side: 0 | 1, u: number): { x: number; y: number; li: number } {
  const R = ROADS[side];
  const d = Math.max(0, Math.min(1, u)) * R.total;
  let i = 1;
  while (i < R.len.length - 1 && R.len[i] < d) i++;
  const a = R.pts[i - 1];
  const b = R.pts[i];
  const v = (d - R.len[i - 1]) / Math.max(1e-6, R.len[i] - R.len[i - 1]);
  return { x: a.x + (b.x - a.x) * v, y: a.y + (b.y - a.y) * v, li: b.li };
}

// ------------------------------------------------------------------------------------------- painter
export interface FacadeOpts {
  split?: number;
  flow?: [number, number];
  tug?: (li: number, gpu: number) => number;
  bridgeLit?: number[];
  glass?: (c: C, half: 0 | 1, dx: number) => void;
  glassLight?: number;
  led?: number;
  ledColor?: string;
}

const colCache = new Map<string, string>();
function mixQ(a: string, b: string, u: number): string {
  const q = Math.round(Math.max(0, Math.min(1, u)) * 24);
  const k = `${a}${b}${q}`;
  let v = colCache.get(k);
  if (!v) {
    v = mixLab(a, b, q / 24);
    if (colCache.size > 2000) colCache.clear();
    colCache.set(k, v);
  }
  return v;
}

export function facade(c: C, o: FacadeOpts, env: PaintEnv): void {
  const m = env.mood;
  const ink = env.fill('ink');
  const split = o.split ?? 0;
  const flow = o.flow ?? [0, 0];
  const nL = 8;
  const litOf = (li: number, gpu: number) => {
    const f = flow[gpu];
    const u = Math.max(0, Math.min(1, (f - (li + 0.6) / (nL + 1)) / (0.6 / (nL + 1))));
    return u * u * (3 - 2 * u);
  };
  const setTone = mixQ(env.fill('set'), m.ink, 0.25);
  const sideTone = mixQ(env.fill('set'), m.ink, 0.45);
  const glassL = o.glassLight ?? 1;
  const wallTone = mixQ(ink, env.fill('set'), 0.4);

  // ---- the glass (tiles) and the stone of the window, per half
  for (const half of [0, 1] as const) {
    const dx = halfDx(split, half);
    c.save();
    c.translate(dx, 0);
    // clip to this half's disc
    c.save();
    const clip = new Path2D();
    const a0 = half === 0 ? Math.PI / 2 : -Math.PI / 2;
    clip.moveTo(CX, WIN.y);
    clip.arc(CX, WIN.y, WIN.r + 1, a0, a0 + Math.PI, false);
    clip.closePath();
    c.clip(clip);
    // dark glass ground behind the panes
    c.fillStyle = mixQ(m.ink, m.halo, 0.22 * glassL);
    c.fillRect(CX - WIN.r - 2, WIN.y - WIN.r - 2, WIN.r * 2 + 4, WIN.r * 2 + 4);
    o.glass?.(c, half, dx);
    c.restore();
    // came and stone
    c.fillStyle = ink;
    c.fill(CAME_HALF[half], 'evenodd');
    c.fill(RING_HALF[half], 'evenodd');
    c.strokeStyle = withAlpha(m.rim, 0.22);
    c.lineWidth = 1;
    c.beginPath();
    const a1 = half === 0 ? Math.PI / 2 : -Math.PI / 2;
    c.arc(CX, WIN.y, WIN.ring, a1, a1 + Math.PI, false);
    c.stroke();
    // pierced lights in the leftover stone glow faintly with the dawn behind
    c.fillStyle = withAlpha(m.halo, 0.5 * glassL);
    c.fill(SPANDREL_LIGHTS[half]);
    c.restore();
  }
  // ---- the plinth halves
  for (const half of [0, 1] as const) {
    const dx = halfDx(split, half);
    c.save();
    c.translate(dx, 0);
    c.fillStyle = wallTone;
    c.fill(PLINTH_HALF[half], 'evenodd');
    // the piers under the towers stand proud of the wall, in full ink
    {
      const ax = CX + (half === 0 ? -LV.levels[0].axis : LV.levels[0].axis);
      c.save();
      c.beginPath();
      c.rect(ax - 96, PL.top, 192, PL.bottom - PL.top);
      c.clip();
      c.fillStyle = ink;
      c.fill(PLINTH_HALF[half], 'evenodd');
      c.restore();
    }
    // cornice, string course and steps (rim on the top edges only)
    const xa = half === 0 ? PL.x0 - 10 : CX;
    const xb = half === 0 ? CX : PL.x1 + 10;
    c.fillRect(xa, PL.top - 8, xb - xa, 10);
    c.fillRect(xa - (half === 0 ? 14 : 0), 700, xb - xa + 14, 80);
    c.fillStyle = withAlpha(m.rim, 0.28);
    c.fillRect(xa, PL.top - 8, xb - xa, 1.2);
    c.fillRect(xa, 700, xb - xa, 1);
    // blind arcade incised into the wall (faint rim cut-lines)
    c.strokeStyle = withAlpha(m.rim, 0.1);
    c.lineWidth = 1;
    c.beginPath();
    const n = 7;
    const x0 = half === 0 ? PL.x0 + 14 : CX + WIN.ring + 18;
    const x1 = half === 0 ? CX - WIN.ring - 18 : PL.x1 - 14;
    for (let k = 0; k < n; k++) {
      const aw = (x1 - x0) / n - 6;
      const ax = x0 + k * ((x1 - x0) / n);
      const pAx = CX + (half === 0 ? -LV.levels[0].axis : LV.levels[0].axis);
      if (Math.abs(ax + aw / 2 - pAx) < 70) continue;
      c.moveTo(ax, 460);
      c.lineTo(ax, 300);
      c.quadraticCurveTo(ax, 280, ax + aw / 2, 272);
      c.quadraticCurveTo(ax + aw, 280, ax + aw, 300);
      c.lineTo(ax + aw, 460);
    }
    c.stroke();
    // the piers under each tower (rim on their window-side edges only)
    {
      const ax = CX + (half === 0 ? -LV.levels[0].axis : LV.levels[0].axis);
      c.fillStyle = withAlpha(m.rim, 0.16);
      c.fillRect(ax - 96, PL.top + 2, 1.2, 698 - PL.top);
      c.fillRect(ax + 95, PL.top + 2, 1.2, 698 - PL.top);
    }
    // the portal's status LED (one per card)
    if ((o.led ?? 0) > 0.002) {
      const ax = CX + (half === 0 ? -LV.levels[0].axis : LV.levels[0].axis);
      const col = o.ledColor ?? m.core;
      const k = o.led ?? 0;
      glow(c, ax, 640, 120, col, 0.22 * k);
      glow(c, ax, 640, 26, col, 0.7 * k);
      c.fillStyle = withAlpha(col, Math.min(1, 0.4 + k));
      c.beginPath();
      c.arc(ax, 640, 3.2, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  // sunlight spilling through the glass onto the stone (light wrap)
  if (glassL > 0.01) glow(c, CX, WIN.y, WIN.ring * 1.55, m.halo, 0.1 * glassL);

  // ---- bridges (cross-GPU), then light crossing them
  c.fillStyle = ink;
  c.fill(bridgesAt(split));
  BRIDGES.forEach((b, i) => {
    const lit = o.bridgeLit?.[i] ?? 0;
    if (lit <= 0.01) return;
    const x0 = b.xl + halfDx(split, 0);
    const x1 = b.xr + halfDx(split, 1);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(m.core, 0.6 * lit);
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(x0 - 14, b.y + 10);
    c.quadraticCurveTo((x0 + x1) / 2, b.y - 34, x1 + 14, b.y - 20);
    c.moveTo(x1 + 14, b.y + 10);
    c.quadraticCurveTo((x0 + x1) / 2, b.y - 34, x0 - 14, b.y - 20);
    c.stroke();
    c.restore();
    glow(c, (x0 + x1) / 2, b.y - 12, 70, m.halo, 0.3 * lit);
  });

  // ---- tower blocks
  for (const gpu of [0, 1] as const) {
    const dx = halfDx(split, gpu);
    c.save();
    c.translate(dx, 0);
    LV.levels.forEach((L, i) => {
      const B = BLOCKS[gpu][i];
      const lit = Math.min(1, litOf(L.li, gpu) + (o.tug?.(L.li, gpu) ?? 0));
      c.fillStyle = setTone;
      c.fill(B.top);
      c.fillStyle = sideTone;
      c.fill(B.side);
      c.fillStyle = ink;
      c.fill(B.face);
      B.lancets.forEach((p, g) => {
        const v = lit * (0.45 + 0.27 * g);
        c.fillStyle = v > 0.02 ? mixQ(mixQ(m.set, m.ink, 0.2), m.core, v) : mixQ(m.set, m.ink, 0.15);
        c.fill(p);
      });
      c.fillStyle = ink;
      c.fill(B.course);
      if (lit > 0.01) glow(c, B.cx, B.cy, Math.max(B.w, B.h) * 1.1, m.halo, 0.14 * lit);
    });
    c.fillStyle = ink;
    c.fill(SHAFTS[gpu]);
    c.restore();
  }
  // ---- crown (fc8)
  c.fillStyle = ink;
  c.fill(CROWN_PATH, 'evenodd');
  const crownLit = Math.max(litOf(7, 0), litOf(7, 1), o.tug?.(7, 0) ?? 0);
  c.fillStyle = crownLit > 0.02 ? mixQ(m.halo, m.core, crownLit) : mixQ(m.set, m.ink, 0.15);
  c.fill(CROWN_LANCET);
  if (crownLit > 0.01) glow(c, CROWN_LIGHT.x, CROWN_LIGHT.y, 110, m.core, 0.3 * crownLit);
}

/** The backprop messenger (ch05's design): a dark bead in a ring of rim light. */
export function messengerBead(c: C, x: number, y: number, r: number, k: number, env: PaintEnv): void {
  if (k <= 0.003) return;
  const m = env.mood;
  glow(c, x, y, r * 4.2, m.rim, 0.32 * k);
  glow(c, x, y, r * 1.8, m.halo, 0.3 * k);
  c.save();
  c.globalAlpha *= Math.min(1, 0.3 + k);
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.arc(x, y, r * 0.75, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = m.core;
  c.lineWidth = Math.max(1.2, r * 0.22);
  c.beginPath();
  c.arc(x, y, r * 0.75, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}
