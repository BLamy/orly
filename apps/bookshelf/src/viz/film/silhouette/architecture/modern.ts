/**
 * 20th/21st-century interiors: labs, offices, a 2012 bedroom, glass atria, data-centre aisles.
 * Emissive bits (tubes, screens, LEDs) use the mood's core/halo; keep them as the shot's one accent.
 *
 *   ceilingGrid(c, { x0, x1, yTop, yBack, horizon, vpX, tile, troffers? }, env)   suspended ceiling in perspective
 *   labWall(c, { x, y, w, h, windows?, blinds?, tileTop?, tubes?, ceiling? }, env)  1950s-70s lab back wall:
 *       glazed-tile dado, venetian-blind windows (holes with slats), hanging fluorescent fixtures.
 *   labBench(c, { x, y, w, h?, seed?, shelf?, sink?, glassware? }, env)   bench, cabinets, reagent shelf,
 *       flasks, retort stand, gooseneck tap. (x,y) = floor at the left end.
 *   cubicles(c, { x0, x1, y, h?, count?, seed?, screens? }, env)  1980s partitions (role 'ink' default) with CRTs, lamps, chair backs rising above them.
 *   bedroomWall(c, { x, y, w, h, window, poster? }, env)   2012 student room back wall (window hole, curtains, poster)
 *   bedroom2012(c, { x, y, w, seed?, screen? }, env)       bed, desk, tower PC with a lit side window and two
 *       glowing GPU fans, monitor, chair, shelf, lamp. (x,y) = floor left.
 *   glassAtrium(c, { x, y, w, h, floors?, bays?, seed? }, env)  curtain-wall atrium: glass grid holes, mezzanines
 *       with glass balustrades, columns, pendant lights, planters.
 *   openOffice(c, { x0, x1, y, count?, seed? }, env)       standing desks, monitors, laptops, whiteboard, plants.
 *   dataCentreAisle(c, { x0, x1, y0, y1, vpX, vpY, racks?, aisle?, seed?, leds? }, env)  one-point aisle with
 *       racks, blinking LEDs (deterministic in env.t), cable trays, perforated floor tiles.
 */
import type { FillRole, PaintEnv, Painter } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import { addCircle, addEllipse, addPolyWound, addRect, memoPath } from '../ornament';
import { placeTurning, turning } from '../lathe';
import { cutColor, hash01, keyOf, memo, rng, strokeCuts, type Pt } from './common';

const quad = (p: Path2D, a: Pt, b: Pt, c: Pt, d: Pt) => {
  p.moveTo(a[0], a[1]);
  p.lineTo(b[0], b[1]);
  p.lineTo(c[0], c[1]);
  p.lineTo(d[0], d[1]);
  p.closePath();
};

function additive(c: CanvasRenderingContext2D, fn: () => void) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  fn();
  c.restore();
}

// ---------------------------------------------------------------------------
// ceilings
// ---------------------------------------------------------------------------
export interface CeilingGridOpts {
  x0: number;
  x1: number;
  /** y of the ceiling's front edge (frame top) */
  yTop: number;
  /** y where the ceiling meets the back wall */
  yBack: number;
  horizon: number;
  vpX: number;
  tile: number;
  focal?: number;
  /** every n-th tile is a glowing troffer (0 = none) */
  troffers?: number;
  role?: FillRole;
}
export const ceilingGrid: Painter<CeilingGridOpts> = (c, o, env) => {
  const f = o.focal ?? 700;
  const g = memo(ceilCache, keyOf(o), () => {
    const lines = new Path2D();
    const lights = new Path2D();
    const P = (X: number, Z: number): Pt => {
      const s = f / (f + Z);
      return [o.vpX + (X - o.vpX) * s, o.horizon + (o.yTop - o.horizon) * s];
    };
    const Zm = (f * (o.yTop - o.horizon)) / (o.yBack - o.horizon) - f;
    const span = ((Math.max(o.vpX - o.x0, o.x1 - o.vpX) * (f + Zm)) / f) + o.tile;
    for (let Z = 0; Z <= Zm; Z += o.tile) {
      const [, y] = P(0, Z);
      lines.moveTo(o.x0, y);
      lines.lineTo(o.x1, y);
    }
    let j = 0;
    for (let X = o.vpX - Math.ceil(span / o.tile) * o.tile; X <= o.vpX + span; X += o.tile, j++) {
      const a = P(X, 0);
      const b = P(X, Zm);
      lines.moveTo(a[0], a[1]);
      lines.lineTo(b[0], b[1]);
      if (o.troffers) {
        let i = 0;
        for (let Z = 0; Z + o.tile <= Zm; Z += o.tile, i++) {
          if ((i + j) % o.troffers !== 0 || j % 2) continue;
          quad(lights, P(X + o.tile * 0.25, Z + o.tile * 0.1), P(X + o.tile * 0.75, Z + o.tile * 0.1), P(X + o.tile * 0.75, Z + o.tile * 0.9), P(X + o.tile * 0.25, Z + o.tile * 0.9));
        }
      }
    }
    return { lines, lights };
  });
  c.save();
  c.beginPath();
  c.rect(o.x0, Math.min(o.yTop, o.yBack) - 400, o.x1 - o.x0, Math.abs(o.yBack - o.yTop) + 400);
  c.clip();
  const gr = c.createLinearGradient(0, o.yTop, 0, o.yBack);
  const base = env.fill(o.role ?? 'set');
  gr.addColorStop(0, mixLab(base, env.mood.fg, 0.5));
  gr.addColorStop(1, mixLab(base, env.mood.haze, 0.25));
  c.fillStyle = gr;
  c.fillRect(o.x0, o.yTop - 400, o.x1 - o.x0, o.yBack - o.yTop + 400);
  strokeCuts(c, g.lines, withAlpha(env.mood.fg, 0.45), 1);
  c.fillStyle = withAlpha(env.mood.core, 0.75);
  c.fill(g.lights);
  c.restore();
};
const ceilCache = new Map<string, { lines: Path2D; lights: Path2D }>();

// ---------------------------------------------------------------------------
// venetian blinds window (shared)
// ---------------------------------------------------------------------------
function blindsInto(wall: Path2D, slats: Path2D, cuts: Path2D, x: number, y: number, w: number, h: number, open: number, frameCut = true) {
  addRect(wall, x, y, w, h, true);
  const pitch = Math.max(4, h / 26);
  const th = pitch * (0.18 + 0.8 * (1 - open));
  for (let yy = y + pitch * 0.6; yy < y + h - 1; yy += pitch) slats.rect(x - 0.5, yy, w + 1, th);
  // headrail, bottom rail, ladder cords
  slats.rect(x - 2, y - 1, w + 4, pitch * 0.9);
  slats.rect(x - 1, y + h - pitch * 0.5, w + 2, pitch * 0.5);
  for (const f of [0.22, 0.78]) slats.rect(x + w * f - 0.5, y, 1, h);
  // frame mullion cross
  slats.rect(x + w / 2 - 2, y, 4, h);
  // an all-round cut-line around the opening (off for sets that light only window-facing edges)
  if (frameCut) cuts.rect(x - 5, y - 5, w + 10, h + 10);
}

// ---------------------------------------------------------------------------
// lab wall
// ---------------------------------------------------------------------------
export interface LabWallOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  /** window centres (absolute x) */
  windows?: number[];
  winW?: number;
  winTop?: number;
  winH?: number;
  /** blind openness 0 (shut) .. 1 */
  blinds?: number;
  /** the all-round light cut-line around each window opening (default true; false = no window outline) */
  frameCuts?: boolean;
  /** y where the glazed tile dado ends */
  tileTop?: number;
  tile?: number;
  /** hanging fluorescent fixtures: centre x list */
  tubes?: number[];
  tubeY?: number;
  role?: FillRole;
}
const labCache = new Map<string, { wall: Path2D; slats: Path2D; cuts: Path2D; tiles: Path2D; fixtures: Path2D; tubes: Path2D }>();
export const labWall: Painter<LabWallOpts> = (c, o, env) => {
  const g = memo(labCache, keyOf(o), () => {
    const wall = new Path2D();
    const slats = new Path2D();
    const cuts = new Path2D();
    const tiles = new Path2D();
    const fixtures = new Path2D();
    const tubes = new Path2D();
    addRect(wall, o.x, o.y, o.w, o.h);
    const winW = o.winW ?? 220;
    const winTop = o.winTop ?? o.y + o.h * 0.22;
    const winH = o.winH ?? o.h * 0.42;
    for (const cx of o.windows ?? []) blindsInto(wall, slats, cuts, cx - winW / 2, winTop, winW, winH, o.blinds ?? 0.6, o.frameCuts !== false);
    const tt = o.tileTop ?? o.y + o.h * 0.7;
    const T = o.tile ?? 14;
    for (let y = tt; y < o.y + o.h; y += T) {
      tiles.moveTo(o.x, y);
      tiles.lineTo(o.x + o.w, y);
    }
    for (let x = o.x; x < o.x + o.w; x += T) {
      tiles.moveTo(x, tt);
      tiles.lineTo(x, o.y + o.h);
    }
    cuts.moveTo(o.x, tt - 3);
    cuts.lineTo(o.x + o.w, tt - 3);
    const ty = o.tubeY ?? o.y + o.h * 0.1;
    for (const cx of o.tubes ?? []) {
      const L = 150;
      addRect(fixtures, cx - 0.6, o.y, 1.2, ty - o.y); // hanging rods
      addRect(fixtures, cx - L * 0.4 - 0.6, o.y, 1.2, ty - o.y);
      addRect(fixtures, cx - L / 2, ty, L, 7); // housing
      addPolyWound(fixtures, [[cx - L / 2 - 3, ty + 7], [cx + L / 2 + 3, ty + 7], [cx + L / 2 - 2, ty + 11], [cx - L / 2 + 2, ty + 11]]);
      addRect(tubes, cx - L / 2 + 4, ty + 11, L - 8, 3.2);
    }
    return { wall, slats, cuts, tiles, fixtures, tubes };
  });
  const base = env.fill(o.role ?? 'set');
  c.fillStyle = base;
  c.fill(g.wall, 'evenodd');
  c.fill(g.slats);
  strokeCuts(c, g.tiles, cutColor(env, 0.1), 1);
  strokeCuts(c, g.cuts, cutColor(env, 0.16), 1);
  c.fillStyle = mixLab(base, env.mood.fg, 0.5);
  c.fill(g.fixtures);
  if ((o.tubes ?? []).length) {
    const ty = o.tubeY ?? o.y + o.h * 0.1;
    additive(c, () => {
      for (const cx of o.tubes ?? []) {
        const gr = c.createRadialGradient(cx, ty + 12, 2, cx, ty + 12, 170);
        gr.addColorStop(0, withAlpha(env.mood.halo, 0.32));
        gr.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = gr;
        c.fillRect(cx - 170, ty - 160, 340, 340);
      }
    });
    c.fillStyle = env.mood.core;
    c.fill(g.tubes);
  }
};

// ---------------------------------------------------------------------------
// lab bench
// ---------------------------------------------------------------------------
export interface LabBenchOpts {
  x: number;
  y: number;
  w: number;
  /** bench top height */
  h?: number;
  seed?: number;
  shelf?: boolean;
  sink?: boolean;
  glassware?: boolean;
  role?: FillRole;
}
export const labBench: Painter<LabBenchOpts> = (c, o, env) => {
  const p = memoPath(`labbench${keyOf(o)}`, () => {
    const q = new Path2D();
    const R = rng(o.seed ?? 9, 2);
    const h = o.h ?? 95;
    const { x, y, w } = o;
    addRect(q, x - 6, y - h, w + 12, 7); // worktop
    addRect(q, x, y - h + 7, w, h - 7 - 8); // cabinets
    addRect(q, x + 6, y - 8, w - 12, 8); // toe kick
    if (o.shelf ?? true) {
      const sy = y - h - 95;
      addRect(q, x + w * 0.05, sy, 3, 95);
      addRect(q, x + w * 0.95 - 3, sy, 3, 95);
      addRect(q, x + w * 0.05, sy, w * 0.9, 4);
      addRect(q, x + w * 0.05, sy + 45, w * 0.9, 3);
      // reagent bottles on the shelves
      for (const sh of [sy, sy + 45]) {
        let bx = x + w * 0.08;
        while (bx < x + w * 0.9) {
          const kind = R() < 0.6 ? 'bottle' : R() < 0.5 ? 'flask' : 'beaker';
          const bh = 18 + R() * 20;
          const t = turning(kind, bh);
          placeTurning(q, t, bx + t.w / 2, sh);
          bx += t.w + 3 + R() * 10;
          if (R() < 0.15) bx += 20;
        }
      }
    }
    const top = y - h;
    if (o.sink ?? true) {
      // gooseneck tap
      const sx = x + w * 0.78;
      addRect(q, sx - 2, top - 40, 4, 40);
      q.moveTo(sx - 2, top - 40);
      q.arc(sx + 10, top - 40, 12, Math.PI, 0, false);
      q.lineTo(sx + 22, top - 32);
      q.lineTo(sx + 18, top - 32);
      q.arc(sx + 10, top - 40, 8, 0, Math.PI, true);
      q.closePath();
      addRect(q, sx - 6, top - 6, 12, 6);
    }
    if (o.glassware ?? true) {
      // retort stand with clamp, flask and burner
      const rx = x + w * 0.3;
      addRect(q, rx - 18, top - 4, 40, 4);
      addRect(q, rx - 1.5, top - 120, 3, 120);
      addRect(q, rx, top - 82, 34, 3);
      placeTurning(q, turning('flask', 48), rx + 36, top - 30);
      addRect(q, rx + 26, top - 30, 22, 2.5); // ring
      addRect(q, rx + 33, top - 26, 6, 26); // burner
      placeTurning(q, turning('beaker', 30), x + w * 0.5, top);
      placeTurning(q, turning('flask', 38), x + w * 0.58, top);
      placeTurning(q, turning('goblet', 26), x + w * 0.64, top);
      // test-tube rack
      const tx = x + w * 0.12;
      addRect(q, tx, top - 22, 40, 3);
      addRect(q, tx, top - 4, 40, 4);
      for (let i = 0; i < 6; i++) {
        const th = 26 + R() * 6;
        q.moveTo(tx + 3 + i * 6.5, top - th);
        q.lineTo(tx + 6.5 + i * 6.5, top - th);
        q.lineTo(tx + 6.5 + i * 6.5, top - 6);
        q.arc(tx + 4.75 + i * 6.5, top - 6, 1.75, 0, Math.PI, false);
        q.closePath();
      }
    }
    return q;
  });
  c.fillStyle = env.fill(o.role ?? 'ink');
  c.fill(p);
  const cuts = memoPath(`labbenchcuts${keyOf(o)}`, () => {
    const q = new Path2D();
    const h = o.h ?? 95;
    const n = Math.max(1, Math.round(o.w / 60));
    for (let i = 0; i < n; i++) {
      const dx = o.x + (o.w * i) / n;
      q.rect(dx + 4, o.y - h + 14, o.w / n - 8, h - 30);
      q.rect(dx + o.w / n / 2 - 5, o.y - h + 20, 10, 2);
    }
    return q;
  });
  strokeCuts(c, cuts, cutColor(env, 0.12), 1);
};

// ---------------------------------------------------------------------------
// 1980s cubicles
// ---------------------------------------------------------------------------
export interface CubiclesOpts {
  x0: number;
  x1: number;
  /** floor y */
  y: number;
  /** partition height */
  h?: number;
  count?: number;
  seed?: number;
  /** CRT screen glow 0..1 */
  screens?: number;
  role?: FillRole;
}
export const cubicles: Painter<CubiclesOpts> = (c, o, env) => {
  const h = o.h ?? 120;
  const n = o.count ?? 3;
  const cw = (o.x1 - o.x0) / n;
  const g = memo(cubeCache, keyOf(o), () => {
    const R = rng(o.seed ?? 4, 8);
    const solid = new Path2D();
    const cuts = new Path2D();
    const screens: [number, number, number, number][] = [];
    for (let i = 0; i < n; i++) {
      const x = o.x0 + i * cw;
      // the desk sits hidden behind the partition; the CRT, lamp and chair back rise above it
      const deskY = o.y - h + 26;
      const mx = x + cw * (0.3 + R() * 0.3);
      // CRT: boxy body, bezel, deep back
      const mw = 62;
      const mh = 52;
      addRect(solid, mx - mw / 2, deskY - mh - 10, mw, mh);
      addPolyWound(solid, [[mx - mw * 0.3, deskY - mh - 6], [mx + mw * 0.3, deskY - mh - 6], [mx + mw * 0.22, deskY - 12], [mx - mw * 0.22, deskY - 12]]);
      addRect(solid, mx - 14, deskY - 12, 28, 12);
      const sTop = deskY - mh - 4;
      screens.push([mx - mw / 2 + 7, sTop, mw - 14, Math.min(mh - 14, o.y - h - 4 - sTop)]);
      // desk lamp (anglepoise) on the other side
      const lx = x + cw * (R() < 0.5 ? 0.15 : 0.82);
      addRect(solid, lx - 9, deskY - 3, 18, 3);
      solid.moveTo(lx - 1, deskY - 3);
      solid.lineTo(lx + 1, deskY - 3);
      solid.lineTo(lx + 22, deskY - 46);
      solid.lineTo(lx + 20, deskY - 47);
      solid.closePath();
      solid.moveTo(lx + 21, deskY - 47);
      solid.lineTo(lx + 23, deskY - 45);
      solid.lineTo(lx + 2, deskY - 70);
      solid.lineTo(lx, deskY - 71);
      solid.closePath();
      addPolyWound(solid, [[lx - 6, deskY - 74], [lx + 6, deskY - 68], [lx - 6, deskY - 56], [lx - 16, deskY - 62]]);
      // in-tray, papers
      addRect(solid, x + cw * 0.62, deskY - 8, 30, 8);
      // partition panel with a rounded top cap
      addRect(solid, x + 2, o.y - h, cw - 4, h);
      addRect(solid, x, o.y - h - 3, cw, 4);
      for (let k = 1; k < 8; k++) {
        const fx = x + 2 + ((cw - 4) * k) / 8;
        cuts.moveTo(fx, o.y - h + 8);
        cuts.lineTo(fx, o.y - 6);
      }
      cuts.rect(x + 6, o.y - h + 4, cw - 12, h - 8);
      // office chair back peeking above
      const chx = x + cw * 0.45;
      solid.moveTo(chx - 22, o.y - h + 2);
      solid.quadraticCurveTo(chx - 24, o.y - h - 42, chx, o.y - h - 44);
      solid.quadraticCurveTo(chx + 24, o.y - h - 42, chx + 22, o.y - h + 2);
      solid.closePath();
    }
    return { solid, cuts, screens };
  });
  c.fillStyle = env.fill(o.role ?? 'ink');
  c.fill(g.solid);
  strokeCuts(c, g.cuts, cutColor(env, 0.08), 1);
  const sc = o.screens ?? 1;
  if (sc > 0) {
    for (const [sx, sy, sw, sh] of g.screens) {
      const gr = c.createLinearGradient(0, sy, 0, sy + sh);
      gr.addColorStop(0, withAlpha(env.mood.core, 0.55 * sc));
      gr.addColorStop(1, withAlpha(env.mood.halo, 0.45 * sc));
      c.fillStyle = gr;
      c.beginPath();
      c.roundRect(sx, sy, sw, sh, 5);
      c.fill();
      // scanline text rows
      c.fillStyle = withAlpha(env.mood.fg, 0.25 * sc);
      for (let k = 0; k < 6; k++) c.fillRect(sx + 5, sy + 6 + k * (sh / 7), sw * (0.4 + 0.5 * hash01(k, sx | 0)), 1.6);
    }
  }
};
const cubeCache = new Map<string, { solid: Path2D; cuts: Path2D; screens: [number, number, number, number][] }>();

// ---------------------------------------------------------------------------
// 2012 bedroom
// ---------------------------------------------------------------------------
export interface BedroomWallOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  window: { x: number; y: number; w: number; h: number };
  poster?: { x: number; y: number; w: number; h: number };
  /** frost on the glass 0..1 */
  frost?: number;
  role?: FillRole;
}
export const bedroomWall: Painter<BedroomWallOpts> = (c, o, env) => {
  const g = memoPath(`bedwall${keyOf(o)}`, () => {
    const p = new Path2D();
    addRect(p, o.x, o.y, o.w, o.h);
    const W = o.window;
    // two-pane casement: holes either side of a mullion, a transom
    const m = 5;
    addRect(p, W.x, W.y, W.w / 2 - m / 2, W.h * 0.3 - m / 2, true);
    addRect(p, W.x + W.w / 2 + m / 2, W.y, W.w / 2 - m / 2, W.h * 0.3 - m / 2, true);
    addRect(p, W.x, W.y + W.h * 0.3 + m / 2, W.w / 2 - m / 2, W.h * 0.7 - m / 2, true);
    addRect(p, W.x + W.w / 2 + m / 2, W.y + W.h * 0.3 + m / 2, W.w / 2 - m / 2, W.h * 0.7 - m / 2, true);
    return p;
  });
  const base = env.fill(o.role ?? 'set');
  c.fillStyle = base;
  c.fill(g, 'evenodd');
  const W = o.window;
  // frost creeping in from the corners of the glass
  const fr = o.frost ?? 0.6;
  if (fr > 0) {
    const gr = c.createRadialGradient(W.x + W.w / 2, W.y + W.h / 2, Math.min(W.w, W.h) * 0.25, W.x + W.w / 2, W.y + W.h / 2, Math.max(W.w, W.h) * 0.75);
    gr.addColorStop(0, withAlpha(env.mood.rim, 0));
    gr.addColorStop(1, withAlpha(env.mood.rim, 0.35 * fr));
    c.fillStyle = gr;
    c.fillRect(W.x, W.y, W.w, W.h);
  }
  // curtains with folds and a rail
  const curtains = memoPath(`curt${keyOf(W)}`, () => {
    const p = new Path2D();
    addRect(p, W.x - 40, W.y - 18, W.w + 80, 4);
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? W.x - 36 : W.x + W.w + 36;
      const cw = 46;
      const pts: Pt[] = [];
      const top = W.y - 14;
      const bot = W.y + W.h + 30;
      for (let k = 0; k <= 20; k++) {
        const t = k / 20;
        const xin = x0 - side * cw * (1 - 0.35 * Math.sin(t * Math.PI * 0.9));
        pts.push([xin + Math.sin(t * 9) * 2, top + t * (bot - top)]);
      }
      pts.push([x0 + side * 4, bot], [x0 + side * 4, top]);
      addPolyWound(p, pts);
    }
    return p;
  });
  c.fillStyle = mixLab(base, env.mood.fg, 0.3);
  c.fill(curtains);
  const folds = memoPath(`folds${keyOf(W)}`, () => {
    const p = new Path2D();
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? W.x - 36 : W.x + W.w + 36;
      for (const f of [0.25, 0.5, 0.75]) {
        p.moveTo(x0 - side * 46 * f, W.y - 10);
        p.quadraticCurveTo(x0 - side * 46 * f * 0.8, W.y + W.h * 0.6, x0 - side * 46 * f * 0.9, W.y + W.h + 28);
      }
    }
    return p;
  });
  strokeCuts(c, folds, cutColor(env, 0.12), 1);
  if (o.poster) {
    const P = o.poster;
    c.fillStyle = mixLab(base, env.mood.haze, 0.35);
    c.fillRect(P.x, P.y, P.w, P.h);
    // an abstract print: a big circle and bands (no logos, no text)
    c.fillStyle = mixLab(base, env.mood.fg, 0.2);
    c.beginPath();
    c.arc(P.x + P.w * 0.5, P.y + P.h * 0.42, Math.min(P.w, P.h) * 0.28, 0, Math.PI * 2);
    c.fill();
    c.fillRect(P.x + P.w * 0.12, P.y + P.h * 0.8, P.w * 0.76, 3);
    c.fillRect(P.x + P.w * 0.12, P.y + P.h * 0.86, P.w * 0.5, 3);
    c.fillStyle = withAlpha(env.mood.rim, 0.25);
    for (const [tx, ty] of [[P.x, P.y], [P.x + P.w, P.y]]) c.fillRect(tx - 5, ty - 3, 10, 6); // tape
  }
};

export interface Bedroom2012Opts {
  /** floor left */
  x: number;
  y: number;
  w: number;
  seed?: number;
  /** screen & GPU glow 0..1 */
  screen?: number;
  role?: FillRole;
}
export const bedroom2012: Painter<Bedroom2012Opts> = (c, o, env) => {
  const { x, y, w } = o;
  const g = memoPath(`bed12${keyOf(o)}`, () => {
    const p = new Path2D();
    // bed on the left: headboard, mattress, rumpled duvet, pillow
    const bx = x + w * 0.02;
    const bl = w * 0.42;
    addRect(p, bx, y - 110, 10, 110);
    addRect(p, bx + bl - 8, y - 60, 8, 60);
    addRect(p, bx, y - 52, bl, 24);
    const duvet: Pt[] = [];
    for (let k = 0; k <= 30; k++) {
      const t = k / 30;
      duvet.push([bx + bl * 0.25 + t * bl * 0.77, y - 52 - 8 - Math.sin(t * Math.PI) * 10 - Math.sin(t * 13) * 2.5]);
    }
    duvet.push([bx + bl + 4, y - 22], [bx + bl * 0.25, y - 30]);
    addPolyWound(p, duvet);
    addEllipse(p, bx + bl * 0.12, y - 60, bl * 0.1, 10);
    // desk on the right
    const dx = x + w * 0.55;
    const dw = w * 0.4;
    addRect(p, dx, y - 78, dw, 5);
    addRect(p, dx + 4, y - 73, 5, 73);
    addRect(p, dx + dw - 9, y - 73, 5, 73);
    addRect(p, dx + dw * 0.55, y - 73, dw * 0.4, 30); // drawer
    // monitor + keyboard + mug
    const mx = dx + dw * 0.42;
    addRect(p, mx - 52, y - 160, 104, 64);
    addRect(p, mx - 4, y - 96, 8, 14);
    addEllipse(p, mx, y - 82, 22, 3);
    addRect(p, mx - 40, y - 82, 70, 3);
    placeTurning(p, turning('beaker', 14, 11), dx + dw * 0.85, y - 78);
    // tower PC on the floor beside the desk
    addRect(p, dx - 70, y - 120, 56, 120);
    // desk chair (office swivel)
    const chx = dx + dw * 0.3;
    p.moveTo(chx - 16, y - 54);
    p.quadraticCurveTo(chx - 22, y - 130, chx + 2, y - 132);
    p.lineTo(chx + 6, y - 54);
    p.closePath();
    addRect(p, chx - 20, y - 56, 46, 6);
    addRect(p, chx + 1, y - 50, 4, 36);
    for (const s of [-1, 1]) addPolyWound(p, [[chx + 3, y - 14], [chx + 3 + s * 26, y - 4], [chx + 3 + s * 26, y - 1], [chx + 3, y - 10]]);
    // wall shelf with a few books, and a lamp
    addRect(p, dx + dw * 0.1, y - 230, dw * 0.8, 4);
    let sx = dx + dw * 0.14;
    const R = rng(o.seed ?? 12, 3);
    while (sx < dx + dw * 0.6) {
      const bw = 4 + R() * 6;
      addRect(p, sx, y - 230 - (22 + R() * 14), bw, 22 + R() * 14 - 0.1);
      sx += bw + 1;
    }
    placeTurning(p, turning('lampBase', 40), dx + dw * 0.8, y - 78);
    addPolyWound(p, [[dx + dw * 0.8 - 18, y - 118], [dx + dw * 0.8 + 18, y - 118], [dx + dw * 0.8 + 12, y - 138], [dx + dw * 0.8 - 12, y - 138]]);
    return p;
  });
  c.fillStyle = env.fill(o.role ?? 'ink');
  c.fill(g);
  const k = o.screen ?? 1;
  if (k > 0) {
    const dx = x + w * 0.55;
    const dw = w * 0.4;
    const mx = dx + dw * 0.42;
    // monitor screen + its spill
    const gr = c.createLinearGradient(0, y - 156, 0, y - 100);
    gr.addColorStop(0, withAlpha(env.mood.core, 0.75 * k));
    gr.addColorStop(1, withAlpha(env.mood.halo, 0.7 * k));
    c.fillStyle = gr;
    c.fillRect(mx - 48, y - 156, 96, 56);
    additive(c, () => {
      const r = c.createRadialGradient(mx, y - 128, 10, mx, y - 128, 160);
      r.addColorStop(0, withAlpha(env.mood.halo, 0.22 * k));
      r.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = r;
      c.fillRect(mx - 160, y - 290, 320, 320);
    });
    // tower side window with two GPU fans
    const tx = dx - 70;
    c.fillStyle = withAlpha(env.mood.halo, 0.35 * k);
    c.fillRect(tx + 8, y - 110, 40, 72);
    for (const fy of [y - 92, y - 60]) {
      c.strokeStyle = withAlpha(env.mood.core, 0.85 * k);
      c.lineWidth = 2;
      c.beginPath();
      c.arc(tx + 28, fy, 11, 0, Math.PI * 2);
      c.stroke();
      // fan blades, turning with time (on ones)
      c.save();
      c.translate(tx + 28, fy);
      c.rotate(env.t * 9);
      c.fillStyle = withAlpha(env.mood.core, 0.55 * k);
      for (let b = 0; b < 5; b++) {
        c.rotate((Math.PI * 2) / 5);
        c.beginPath();
        c.ellipse(5, 0, 5, 2, 0.5, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }
    additive(c, () => {
      const r = c.createRadialGradient(tx + 28, y - 76, 4, tx + 28, y - 76, 90);
      r.addColorStop(0, withAlpha(env.mood.core, 0.2 * k));
      r.addColorStop(1, withAlpha(env.mood.core, 0));
      c.fillStyle = r;
      c.fillRect(tx - 70, y - 170, 200, 200);
    });
  }
};

// ---------------------------------------------------------------------------
// glass atrium
// ---------------------------------------------------------------------------
export interface GlassAtriumOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  /** mezzanine floors */
  floors?: number;
  /** curtain wall bays */
  bays?: number;
  seed?: number;
  role?: FillRole;
}
export const glassAtrium: Painter<GlassAtriumOpts> = (c, o, env) => {
  const g = memo(atriumCache, keyOf(o), () => {
    const R = rng(o.seed ?? 21, 4);
    const wall = new Path2D();
    const slabs = new Path2D();
    const glass = new Path2D();
    const lamps: Pt[] = [];
    addRect(wall, o.x, o.y, o.w, o.h);
    const bays = o.bays ?? Math.round(o.w / 90);
    const rows = Math.round(o.h / 70);
    const bw = o.w / bays;
    const rh = o.h / rows;
    const mull = 3;
    for (let i = 0; i < bays; i++) {
      for (let j = 0; j < rows; j++) {
        addRect(wall, o.x + i * bw + mull / 2, o.y + j * rh + mull / 2, bw - mull, rh - mull, true);
      }
    }
    // mezzanines across the front of the curtain wall
    const fl = o.floors ?? 3;
    for (let k = 1; k <= fl; k++) {
      const sy = o.y + (o.h * k) / (fl + 1);
      const inset = o.w * 0.04 * k;
      addRect(slabs, o.x + inset, sy, o.w - 2 * inset, 9);
      // glass balustrade (translucent) + steel top rail
      addRect(glass, o.x + inset, sy - 26, o.w - 2 * inset, 26);
      addRect(slabs, o.x + inset, sy - 28, o.w - 2 * inset, 2.5);
      // planters with leafy shrubs
      for (let p = 0; p < 4; p++) {
        const px = o.x + inset + 30 + R() * (o.w - 2 * inset - 60);
        addRect(slabs, px - 12, sy - 18, 24, 18);
        for (let l = 0; l < 9; l++) {
          const a = -Math.PI / 2 + (l / 8 - 0.5) * 2.2;
          addEllipse(slabs, px + Math.cos(a) * 14, sy - 22 + Math.sin(a) * 14, 9, 3, a, false);
        }
      }
      if (k < fl) for (let i = 0; i < 6; i++) lamps.push([o.x + (o.w * (i + 0.5)) / 6, sy + 70]);
    }
    // round columns rising through the floors
    for (const fx of [0.2, 0.5, 0.8]) addRect(slabs, o.x + o.w * fx - 7, o.y, 14, o.h);
    // pendant lamps
    for (const [lx, ly] of lamps) {
      addRect(slabs, lx - 0.5, ly - 60, 1, 60);
      slabs.moveTo(lx - 14, ly + 8);
      slabs.quadraticCurveTo(lx, ly - 12, lx + 14, ly + 8);
      slabs.closePath();
    }
    return { wall, slabs, glass, lamps };
  });
  const base = env.fill(o.role ?? 'set');
  c.fillStyle = base;
  c.fill(g.wall, 'evenodd');
  c.fillStyle = withAlpha(env.mood.haze, 0.18);
  c.fill(g.glass);
  c.fillStyle = mixLab(base, env.mood.fg, 0.35);
  c.fill(g.slabs);
  additive(c, () => {
    for (const [lx, ly] of g.lamps) {
      const r = c.createRadialGradient(lx, ly + 8, 1, lx, ly + 8, 40);
      r.addColorStop(0, withAlpha(env.mood.core, 0.5));
      r.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = r;
      c.fillRect(lx - 40, ly - 32, 80, 80);
    }
  });
};
const atriumCache = new Map<string, { wall: Path2D; slabs: Path2D; glass: Path2D; lamps: Pt[] }>();

export interface OpenOfficeOpts {
  x0: number;
  x1: number;
  y: number;
  count?: number;
  seed?: number;
  role?: FillRole;
}
export const openOffice: Painter<OpenOfficeOpts> = (c, o, env) => {
  const g = memoPath(`openoffice${keyOf(o)}`, () => {
    const p = new Path2D();
    const R = rng(o.seed ?? 31, 5);
    const n = o.count ?? 3;
    const span = (o.x1 - o.x0) / n;
    for (let i = 0; i < n; i++) {
      const x = o.x0 + i * span + span * 0.1;
      const dw = span * 0.62;
      const standing = R() < 0.5;
      const dh = standing ? 108 : 74;
      addRect(p, x, o.y - dh, dw, 4);
      // T-legs
      for (const lx of [x + 10, x + dw - 14]) {
        addRect(p, lx, o.y - dh + 4, 4, dh - 6);
        addRect(p, lx - 14, o.y - 3, 32, 3);
      }
      // dual monitors on arms or a laptop
      if (R() < 0.6) {
        for (const mx of [x + dw * 0.32, x + dw * 0.62]) {
          addRect(p, mx - 26, o.y - dh - 58, 52, 32);
          addRect(p, mx - 1.5, o.y - dh - 26, 3, 26);
        }
      } else {
        addPolyWound(p, [[x + dw * 0.4, o.y - dh], [x + dw * 0.7, o.y - dh], [x + dw * 0.68, o.y - dh - 2], [x + dw * 0.42, o.y - dh - 2]]);
        addPolyWound(p, [[x + dw * 0.42, o.y - dh - 2], [x + dw * 0.46, o.y - dh - 30], [x + dw * 0.48, o.y - dh - 30], [x + dw * 0.45, o.y - dh - 2]]);
      }
      // plant in a pot
      const px = x + dw + span * 0.14;
      placeTurning(p, turning('vase', 34), px, o.y);
      for (let l = 0; l < 11; l++) {
        const a = -Math.PI / 2 + (l / 10 - 0.5) * 2.4;
        const L = 26 + R() * 22;
        addEllipse(p, px + Math.cos(a) * L * 0.55, o.y - 34 + Math.sin(a) * L * 0.55, L * 0.5, 4, a, false);
      }
    }
    // whiteboard on a stand at the right
    const wx = o.x1 - 40;
    addRect(p, wx - 70, o.y - 190, 140, 4);
    addRect(p, wx - 70, o.y - 110, 140, 4);
    addRect(p, wx - 70, o.y - 190, 4, 84);
    addRect(p, wx + 66, o.y - 190, 4, 84);
    addRect(p, wx - 58, o.y - 106, 4, 106);
    addRect(p, wx + 54, o.y - 106, 4, 106);
    return p;
  });
  c.fillStyle = env.fill(o.role ?? 'ink');
  c.fill(g);
  // whiteboard surface (lighter) with arrow sketches
  const wx = o.x1 - 40;
  c.fillStyle = withAlpha(env.mood.rim, 0.5);
  c.fillRect(wx - 66, o.y - 186, 132, 76);
  c.strokeStyle = withAlpha(env.mood.ink, 0.6);
  c.lineWidth = 1.4;
  c.beginPath();
  for (let i = 0; i < 4; i++) {
    const ax = wx - 50 + i * 30;
    c.moveTo(ax, o.y - 170 + (i % 2) * 20);
    c.quadraticCurveTo(ax + 15, o.y - 185, ax + 28, o.y - 150 + (i % 2) * 10);
  }
  c.stroke();
};

// ---------------------------------------------------------------------------
// data-centre aisle
// ---------------------------------------------------------------------------
export interface DataCentreOpts {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  vpX: number;
  vpY: number;
  /** racks per side */
  racks?: number;
  /** aisle half-width in front-plane px */
  aisle?: number;
  rackH?: number;
  /** eye height above the floor in front-plane px */
  eye?: number;
  focal?: number;
  seed?: number;
  /** LED density 0..1 */
  leds?: number;
  role?: FillRole;
}
interface AisleGeom {
  racks: Path2D;
  cuts: Path2D;
  floor: Path2D;
  trays: Path2D;
  leds: { x: number; y: number; s: number; warm: boolean; rate: number; ph: number }[];
  end: [number, number, number, number];
}
const aisleCache = new Map<string, AisleGeom>();
function buildAisle(o: DataCentreOpts): AisleGeom {
  const f = o.focal ?? 600;
  const A = o.aisle ?? 170;
  const eye = o.eye ?? 160;
  const RH = o.rackH ?? 230;
  const n = o.racks ?? 12;
  const depth = 140; // rack width along the aisle
  const P = (X: number, Y: number, Z: number): Pt => {
    const s = f / (f + Z);
    return [o.vpX + X * s, o.vpY + Y * s];
  };
  const R = rng(o.seed ?? 77, 1);
  const racks = new Path2D();
  const cuts = new Path2D();
  const floor = new Path2D();
  const trays = new Path2D();
  const leds: AisleGeom['leds'] = [];
  const Z0 = -f * 0.55;
  const Zend = Z0 + n * (depth + 8);
  for (const side of [-1, 1]) {
    for (let i = n - 1; i >= 0; i--) {
      const za = Z0 + i * (depth + 8);
      const zb = za + depth;
      const X = side * A;
      // rack face (the plane facing the aisle) + top
      quad(racks, P(X, eye - RH, za), P(X, eye - RH, zb), P(X, eye, zb), P(X, eye, za));
      quad(racks, P(X, eye - RH, za), P(X + side * 120, eye - RH, za), P(X + side * 120, eye - RH, zb), P(X, eye - RH, zb));
      // units: horizontal seams
      const units = 14;
      for (let u = 1; u < units; u++) {
        const Y = eye - RH + (RH * u) / units;
        const a = P(X, Y, za + 6);
        const b = P(X, Y, zb - 6);
        cuts.moveTo(a[0], a[1]);
        cuts.lineTo(b[0], b[1]);
        // LEDs near the front edge of each unit
        const count = R() < 0.25 ? 0 : 1 + Math.floor(R() * 3);
        for (let k = 0; k < count; k++) {
          if (R() > (o.leds ?? 0.8)) continue;
          const zz = za + 12 + k * 9 + R() * 30;
          const [lx, ly] = P(X, Y - RH / units / 2, zz);
          leds.push({ x: lx, y: ly, s: f / (f + zz), warm: R() < 0.08, rate: 0.3 + R() * 3, ph: R() * 10 });
        }
      }
      // door frame lines
      const a = P(X, eye - RH + 4, za + 4);
      const b = P(X, eye - 4, za + 4);
      cuts.moveTo(a[0], a[1]);
      cuts.lineTo(b[0], b[1]);
    }
  }
  // perforated floor tiles
  for (let Z = Z0; Z < Zend; Z += 60) {
    const a = P(-A, eye, Z);
    const b = P(A, eye, Z);
    floor.moveTo(a[0], a[1]);
    floor.lineTo(b[0], b[1]);
  }
  for (let X = -A; X <= A; X += 60) {
    const a = P(X, eye, Z0);
    const b = P(X, eye, Zend);
    floor.moveTo(a[0], a[1]);
    floor.lineTo(b[0], b[1]);
  }
  // overhead cable trays (ladder racks) along both sides
  for (const side of [-1, 1]) {
    const X = side * (A - 30);
    const Y = eye - RH - 40;
    for (const dx of [-14, 14]) {
      const a = P(X + dx, Y, Z0);
      const b = P(X + dx, Y, Zend);
      trays.moveTo(a[0], a[1]);
      trays.lineTo(b[0], b[1]);
    }
    for (let Z = Z0; Z < Zend; Z += 30) {
      const a = P(X - 14, Y, Z);
      const b = P(X + 14, Y, Z);
      trays.moveTo(a[0], a[1]);
      trays.lineTo(b[0], b[1]);
    }
    // hangers
    for (let Z = Z0; Z < Zend; Z += 180) {
      const a = P(X, Y, Z);
      const b = P(X, Y - 400, Z);
      trays.moveTo(a[0], a[1]);
      trays.lineTo(b[0], b[1]);
    }
  }
  const e0 = P(-A, eye - RH - 60, Zend);
  const e1 = P(A, eye, Zend);
  return { racks, cuts, floor, trays, leds, end: [e0[0], e0[1], e1[0] - e0[0], e1[1] - e0[1]] };
}
export const dataCentreAisle: Painter<DataCentreOpts> = (c, o, env) => {
  const g = memo(aisleCache, keyOf(o), () => buildAisle(o), 20);
  const base = env.fill(o.role ?? 'set');
  c.save();
  c.beginPath();
  c.rect(o.x0, o.y0, o.x1 - o.x0, o.y1 - o.y0);
  c.clip();
  // floor and ceiling darkness
  const eye = o.eye ?? 160;
  c.fillStyle = mixLab(base, env.mood.fg, 0.4);
  c.fillRect(o.x0, o.vpY, o.x1 - o.x0, o.y1 - o.vpY);
  const fl = c.createLinearGradient(0, o.vpY, 0, o.y1);
  fl.addColorStop(0, withAlpha(env.mood.haze, 0.5));
  fl.addColorStop(1, withAlpha(env.mood.fg, 0));
  c.fillStyle = fl;
  c.fillRect(o.x0, o.vpY, o.x1 - o.x0, o.y1 - o.vpY);
  strokeCuts(c, g.floor, withAlpha(env.mood.core, 0.08), 1);
  // the lit end of the aisle
  const [ex, ey, ew, eh] = g.end;
  const eg = c.createRadialGradient(o.vpX, o.vpY, 2, o.vpX, o.vpY, Math.max(ew, eh));
  eg.addColorStop(0, withAlpha(env.mood.core, 0.8));
  eg.addColorStop(1, withAlpha(env.mood.halo, 0.3));
  c.fillStyle = eg;
  c.fillRect(ex, ey, ew, eh);
  c.fillStyle = base;
  c.fill(g.racks);
  strokeCuts(c, g.cuts, withAlpha(env.mood.fg, 0.55), 1);
  strokeCuts(c, g.trays, mixLab(base, env.mood.fg, 0.3), 1.6);
  // LEDs: deterministic blink from env.t
  const cool = new Path2D();
  const warm = new Path2D();
  for (let i = 0; i < g.leds.length; i++) {
    const L = g.leds[i];
    const on = hash01(i, Math.floor(env.t * L.rate + L.ph)) > 0.25;
    if (!on) continue;
    const r = Math.max(0.5, 1.6 * L.s);
    (L.warm ? warm : cool).rect(L.x - r, L.y - r * 0.6, r * 2, r * 1.2);
  }
  c.fillStyle = env.mood.core;
  c.fill(cool);
  c.fillStyle = '#ff7a5c';
  c.fill(warm);
  additive(c, () => {
    c.shadowColor = withAlpha(env.mood.core, 0.9);
    c.shadowBlur = 6 * env.pxScale;
    c.fillStyle = withAlpha(env.mood.core, 0.5);
    c.fill(cool);
  });
  void eye;
  c.restore();
};

/** convenience: rgba for an emissive tone */
export function emissive(env: PaintEnv, a: number) {
  return withAlpha(env.mood.core, a);
}
void addCircle;
