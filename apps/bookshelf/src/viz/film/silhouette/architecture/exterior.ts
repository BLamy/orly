/**
 * Exteriors: a colonial college hall with a cupola, the El trestle, and procedural city skylines.
 * No real landmarks, flags, logos or lettering: generic period architecture only.
 *
 *   collegeHall(c, { x, y, w, h, floors?, bays?, cupola?, lit?, seed? }, env)
 *       (x,y) = ground centre. Three-storey clapboard hall, central pavilion + pediment with oculus,
 *       sash windows (lit fraction `lit`), fanlit door, chimneys, octagonal cupola whose arched
 *       openings are holes to the sky, ogee dome, finial and arrow weathervane.
 *   skyline(c, { style, x0, x1, y, height, seed?, lit?, ground? }, env)
 *       style 'chicago1940' : setback towers, crowns, water towers, smokestacks, sawtooth warehouses
 *       style 'bayArea'     : hills (fbm) covered in gabled row houses with bay windows, a modest downtown
 *       style 'megacity'    : dense slender towers with tapered, stepped and tiered crowns, sky bridges
 *       `lit` 0..1 fraction of windows lit; drawn in halo, dimmed by layer haze.
 *   elTrestle(c, { x0, x1, y, h, seed? }, env)  elevated-railway steel lattice with a passing-train option.
 */
import type { FillRole, Painter } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import { addCircle, addPolyWound, addRect, addFoil, memoPath, palmette, at } from '../ornament';
import { placeTurning, turning } from '../lathe';
import { addArchContour, arch } from './openings';
import { cutColor, keyOf, memo, rng, strokeCuts, type Pt } from './common';

// ---------------------------------------------------------------------------
// college hall
// ---------------------------------------------------------------------------
export interface CollegeHallOpts {
  x: number;
  y: number;
  w: number;
  /** eaves height */
  h: number;
  floors?: number;
  bays?: number;
  cupola?: boolean;
  /** fraction of windows lit 0..1 */
  lit?: number;
  seed?: number;
  role?: FillRole;
}
interface HallGeom {
  body: Path2D;
  panes: Path2D;
  litPanes: Path2D;
  bars: Path2D;
  cuts: Path2D;
}
const hallCache = new Map<string, HallGeom>();
function buildHall(o: CollegeHallOpts): HallGeom {
  const R = rng(o.seed ?? 1756, 2);
  const floors = o.floors ?? 3;
  const bays = o.bays ?? 15;
  const { x, y, w, h } = o;
  const L = x - w / 2;
  const body = new Path2D();
  const panes = new Path2D();
  const litPanes = new Path2D();
  const bars = new Path2D();
  const cuts = new Path2D();
  const top = y - h;
  // main block + plinth + hipped roof
  addRect(body, L, top, w, h);
  addRect(body, L - 4, y - h * 0.06, w + 8, h * 0.06);
  const roofH = h * 0.28;
  addPolyWound(body, [[L - 6, top + 1], [L + w * 0.06, top - roofH], [L + w * 0.94, top - roofH], [L + w + 6, top + 1]]);
  addRect(body, L - 8, top - 4, w + 16, 6); // cornice
  // central pavilion + pediment
  const pw = (w / bays) * 3.2;
  addRect(body, x - pw / 2, top - 6, pw, h - h * 0.06);
  const pedH = roofH * 0.62;
  addPolyWound(body, [[x - pw / 2 - 8, top - 4], [x, top - 4 - pedH], [x + pw / 2 + 8, top - 4]]);
  // chimneys
  for (const cx of [L + w * 0.12, L + w * 0.88]) addRect(body, cx - 7, top - roofH - 22, 14, 40);
  // cupola on the ridge
  if (o.cupola ?? true) {
    const cb = Math.min(w * 0.07, h * 0.4);
    const ridge = top - roofH;
    addRect(body, x - cb / 2, ridge - cb * 0.55, cb, cb * 0.6); // base
    addRect(body, x - cb * 0.6, ridge - cb * 0.62, cb * 1.2, cb * 0.1);
    // balustrade around the base deck
    for (let i = 0; i <= 6; i++) placeTurning(body, turning('balusterSlim', cb * 0.16, cb * 0.06), x - cb * 0.55 + (cb * 1.1 * i) / 6, ridge - cb * 0.62);
    addRect(body, x - cb * 0.6, ridge - cb * 0.8, cb * 1.2, cb * 0.04);
    // octagonal lantern with arched openings as holes
    const lw = cb * 0.72;
    const lb = ridge - cb * 0.62;
    const lt = lb - cb * 0.85;
    addRect(body, x - lw / 2, lt, lw, lb - lt);
    for (const f of [-0.27, 0, 0.27]) {
      const ow = lw * 0.17;
      const A = arch(x + f * lw, ow, lt + cb * 0.22, 'round');
      addArchContour(body, A, lb - cb * 0.12, true);
    }
    addRect(body, x - lw * 0.6, lt - cb * 0.06, lw * 1.2, cb * 0.08); // entablature
    // ogee dome
    const dh = cb * 0.7;
    const dome: Pt[] = [];
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      const rr = (lw * 0.55) * (t < 0.55 ? Math.sin((t / 0.55) * Math.PI * 0.5) : 1 - 0.85 * Math.sin(((t - 0.55) / 0.45) * Math.PI * 0.5)) ;
      dome.push([x - Math.max(rr, lw * 0.05), lt - cb * 0.06 - t * dh]);
    }
    const domeR = dome.map(([px, py]) => [2 * x - px, py] as Pt).reverse();
    addPolyWound(body, [[x - lw * 0.55, lt - cb * 0.05], ...dome, ...domeR, [x + lw * 0.55, lt - cb * 0.05]]);
    // finial + weathervane arrow
    const ft = lt - cb * 0.06 - dh;
    placeTurning(body, turning('finial', cb * 0.32), x, ft + 2);
    addRect(body, x - 0.8, ft - cb * 0.75, 1.6, cb * 0.48);
    const vy = ft - cb * 0.62;
    addRect(body, x - cb * 0.4, vy - 0.9, cb * 0.8, 1.8);
    addPolyWound(body, [[x + cb * 0.4, vy - 4], [x + cb * 0.55, vy], [x + cb * 0.4, vy + 4]]);
    addPolyWound(body, [[x - cb * 0.4, vy], [x - cb * 0.5, vy - 5], [x - cb * 0.32, vy - 5], [x - cb * 0.25, vy], [x - cb * 0.32, vy + 5], [x - cb * 0.5, vy + 5]]);
    // compass arms
    addRect(body, x - cb * 0.18, ft - cb * 0.3, cb * 0.36, 1.4);
  }
  // pediment oculus (a lit round window)
  addCircle(litPanes, x, top - 4 - pedH * 0.42, pedH * 0.2);
  // windows
  const bw = w / bays;
  const fh = (h * 0.9) / floors;
  for (let f = 0; f < floors; f++) {
    const wy0 = top + h * 0.05 + f * fh + fh * 0.18;
    const wh = fh * (f === 0 ? 0.6 : 0.58);
    for (let b = 0; b < bays; b++) {
      const cx = L + bw * (b + 0.5);
      if (f === floors - 1 && b === Math.floor(bays / 2)) continue; // door below
      const ww = bw * 0.46;
      const lit = R() < (o.lit ?? 0.3);
      addRect(lit ? litPanes : panes, cx - ww / 2, wy0, ww, wh);
      // sash muntins: 12 over 12 -> 3 cols x 4 rows each sash
      for (let k = 1; k < 3; k++) bars.rect(cx - ww / 2 + (ww * k) / 3 - 0.5, wy0, 1, wh);
      for (let k = 1; k < 8; k++) bars.rect(cx - ww / 2, wy0 + (wh * k) / 8 - (k === 4 ? 1 : 0.5), ww, k === 4 ? 2 : 1);
      // shutters/lintels as cut-lines
      cuts.rect(cx - ww / 2 - 2, wy0 - 4, ww + 4, 3);
      cuts.moveTo(cx - ww / 2 - 4, wy0 + wh + 2);
      cuts.lineTo(cx + ww / 2 + 4, wy0 + wh + 2);
    }
  }
  // door with fanlight
  const dw = bw * 0.6;
  const dTop = y - h * 0.06 - fh * 0.62;
  addRect(litPanes, x - dw / 2, dTop, dw, fh * 0.62);
  const fan = new Path2D();
  fan.moveTo(x - dw / 2, dTop);
  fan.arc(x, dTop, dw / 2, Math.PI, 0, false);
  fan.closePath();
  litPanes.addPath(fan);
  for (let k = 1; k < 5; k++) {
    const a = Math.PI + (Math.PI * k) / 5;
    bars.moveTo(x, dTop);
    bars.lineTo(x + Math.cos(a) * dw / 2, dTop + Math.sin(a) * dw / 2);
    bars.lineTo(x + Math.cos(a) * dw / 2 + 1, dTop + Math.sin(a) * dw / 2);
    bars.closePath();
  }
  bars.rect(x - 0.6, dTop, 1.2, fh * 0.62);
  // clapboard
  for (let yy = top + 6; yy < y - h * 0.06; yy += 5) {
    cuts.moveTo(L + 2, yy);
    cuts.lineTo(L + w - 2, yy);
  }
  // corner quoins / pavilion edges
  cuts.moveTo(x - pw / 2, top);
  cuts.lineTo(x - pw / 2, y - h * 0.06);
  cuts.moveTo(x + pw / 2, top);
  cuts.lineTo(x + pw / 2, y - h * 0.06);
  return { body, panes, litPanes, bars, cuts };
}
export const collegeHall: Painter<CollegeHallOpts> = (c, o, env) => {
  const g = memo(hallCache, keyOf(o), () => buildHall(o), 20);
  const base = env.fill(o.role ?? 'set');
  c.fillStyle = base;
  c.fill(g.body, 'nonzero');
  c.fillStyle = mixLab(base, env.mood.haze, 0.22);
  c.fill(g.panes);
  c.fillStyle = withAlpha(env.mood.halo, 0.9 - env.layer.haze * 0.3);
  c.fill(g.litPanes);
  c.fillStyle = base;
  c.fill(g.bars);
  strokeCuts(c, g.cuts, cutColor(env, 0.06), 1);
};

// ---------------------------------------------------------------------------
// skylines
// ---------------------------------------------------------------------------
export type SkylineStyle = 'chicago1940' | 'bayArea' | 'megacity';
export interface SkylineOpts {
  style: SkylineStyle;
  x0: number;
  x1: number;
  /** ground line y */
  y: number;
  /** tallest building height */
  height: number;
  seed?: number;
  /** fraction of windows lit */
  lit?: number;
  /** extend the silhouette down by this much (fill to the frame bottom) */
  ground?: number;
  role?: FillRole;
}
interface SkyGeom {
  solid: Path2D;
  lights: Path2D;
}
const skyCache = new Map<string, SkyGeom>();

function windowsGrid(lights: Path2D, R: () => number, x: number, top: number, w: number, bottom: number, lit: number, cw = 5, rh = 7) {
  // never finer than ~2 world px per cell: far skylines stay cheap and read as texture
  cw = Math.max(2.2, cw);
  rh = Math.max(3, rh);
  const cols = Math.max(1, Math.floor((w - 4) / cw));
  const rows = Math.max(0, Math.floor((bottom - top - 4) / rh));
  const ox = x + (w - cols * cw) / 2;
  // lights cluster by floor: decide per row then per window
  for (let r = 0; r < rows; r++) {
    const rowLit = R() < lit * 1.6;
    if (!rowLit) continue;
    for (let k = 0; k < cols; k++) {
      if (R() < 0.55) lights.rect(ox + k * cw + 1, top + 3 + r * rh, cw * 0.5, rh * 0.42);
    }
  }
}

function waterTower(p: Path2D, x: number, roof: number, s: number) {
  const legH = 10 * s;
  const tw = 12 * s;
  const th = 12 * s;
  for (const f of [-0.4, -0.1, 0.1, 0.4]) addRect(p, x + f * tw - 0.6, roof - legH, 1.2, legH);
  addRect(p, x - tw / 2, roof - legH * 0.55, tw, 0.9); // cross brace
  addRect(p, x - tw / 2, roof - legH - th, tw, th);
  addPolyWound(p, [[x - tw / 2 - 1, roof - legH - th], [x, roof - legH - th - 7 * s], [x + tw / 2 + 1, roof - legH - th]]);
  addRect(p, x - 0.5, roof - legH - th - 10 * s, 1, 4 * s);
}

function buildSkyline(o: SkylineOpts): SkyGeom {
  const R = rng(o.seed ?? 42, o.style.length);
  const solid = new Path2D();
  const lights = new Path2D();
  const lit = o.lit ?? 0.35;
  const H = o.height;
  const gnd = o.ground ?? 200;
  /** detail unit: building widths, windows and roof furniture scale with the requested height */
  const u = H / 220;
  addRect(solid, o.x0, o.y - 2, o.x1 - o.x0, gnd + 2);
  if (o.style === 'chicago1940') {
    let x = o.x0 - 20;
    while (x < o.x1) {
      const r = R();
      const w = (30 + R() * 70) * u;
      const centre = 1 - Math.abs((x - (o.x0 + o.x1) / 2) / ((o.x1 - o.x0) / 2));
      let h = H * (0.18 + 0.35 * R() + 0.5 * centre * R());
      if (r < 0.12) {
        // sawtooth-roof warehouse + smokestack
        h = H * 0.12;
        addRect(solid, x, o.y - h, w * 1.5, h);
        for (let k = 0; k < 4; k++) addPolyWound(solid, [[x + (k * w * 1.5) / 4, o.y - h], [x + ((k + 0.7) * w * 1.5) / 4, o.y - h - 10 * u], [x + ((k + 1) * w * 1.5) / 4, o.y - h - 10 * u], [x + ((k + 1) * w * 1.5) / 4, o.y - h]]);
        const sx = x + w * 1.2;
        addPolyWound(solid, [[sx - 4 * u, o.y - h], [sx - 2.5 * u, o.y - h - H * 0.28], [sx + 2.5 * u, o.y - h - H * 0.28], [sx + 4 * u, o.y - h]]);
        x += w * 1.5 + 2;
        continue;
      }
      if (h > H * 0.55) {
        // setback tower: tiers narrowing, then a crown
        let tw = w;
        let ty = o.y;
        let tx = x;
        const tiers = 2 + Math.floor(R() * 3);
        const tierH = [0.55, 0.22, 0.13, 0.1];
        for (let k = 0; k < tiers; k++) {
          const th = h * tierH[k] * (k === tiers - 1 ? 1.3 : 1);
          addRect(solid, tx, ty - th, tw, th + 1);
          windowsGrid(lights, R, tx, ty - th, tw, ty, lit, 5 * u, 7 * u);
          ty -= th;
          const nw = tw * (0.62 + R() * 0.15);
          tx += (tw - nw) / 2;
          tw = nw;
        }
        const crown = R();
        if (crown < 0.4) {
          addPolyWound(solid, [[tx, ty + 1], [tx + tw / 2, ty - tw * 0.9], [tx + tw, ty + 1]]);
          addRect(solid, tx + tw / 2 - 0.6 * u, ty - tw * 0.9 - 14 * u, 1.2 * u, 15 * u);
        } else if (crown < 0.75) {
          // stepped lantern crown
          addRect(solid, tx + tw * 0.2, ty - tw * 0.3, tw * 0.6, tw * 0.31);
          addRect(solid, tx + tw * 0.35, ty - tw * 0.55, tw * 0.3, tw * 0.26);
          addRect(solid, tx + tw / 2 - 0.7 * u, ty - tw * 0.55 - 18 * u, 1.4 * u, 19 * u);
        } else {
          waterTower(solid, tx + tw * 0.5, ty, 1.1 * u);
        }
      } else {
        addRect(solid, x, o.y - h, w, h);
        // parapet and cornice
        addRect(solid, x - 1.5 * u, o.y - h, w + 3 * u, 2.5 * u);
        windowsGrid(lights, R, x, o.y - h, w, o.y, lit, 5 * u, 7 * u);
        if (R() < 0.55) waterTower(solid, x + w * (0.25 + R() * 0.5), o.y - h, (0.8 + R() * 0.5) * u);
        if (R() < 0.2) addRect(solid, x + w * 0.2, o.y - h - 8 * u, w * 0.25, 8 * u); // stair bulkhead
      }
      x += w + (R() < 0.3 ? (4 + R() * 12) * u : 0);
    }
  } else if (o.style === 'bayArea') {
    // hills from summed sines (deterministic), houses following the slope
    const ph = [R() * 6, R() * 6, R() * 6];
    const hill = (x: number) => {
      const u = (x - o.x0) / (o.x1 - o.x0);
      return H * 0.42 * (0.55 * Math.sin(u * 5.2 + ph[0]) * 0.5 + 0.5) + H * 0.18 * Math.sin(u * 13 + ph[1]) + H * 0.08 * Math.sin(u * 29 + ph[2]);
    };
    const ground: Pt[] = [[o.x0, o.y + gnd]];
    for (let x = o.x0; x <= o.x1; x += 6) ground.push([x, o.y - Math.max(0, hill(x))]);
    ground.push([o.x1, o.y + gnd]);
    addPolyWound(solid, ground);
    // a modest downtown cluster
    const dc = o.x0 + (o.x1 - o.x0) * (0.3 + R() * 0.4);
    for (let k = 0; k < 9; k++) {
      const w = (16 + R() * 26) * u;
      const bx = dc + ((k - 4.5) * 24 + R() * 10) * u;
      const bh = H * (0.35 + R() * 0.55) * (1 - Math.abs(k - 4.5) / 7);
      const gy = o.y - Math.max(0, hill(bx)) * 0.4;
      addRect(solid, bx, gy - bh, w, bh + 4);
      windowsGrid(lights, R, bx, gy - bh, w, gy, lit, 4 * u, 6 * u);
      if (R() < 0.3) addRect(solid, bx + w / 2 - 0.6 * u, gy - bh - 12 * u, 1.2 * u, 12 * u);
    }
    // gabled row houses with bay windows on the slopes
    let x = o.x0;
    while (x < o.x1) {
      const w = (9 + R() * 6) * u;
      if (Math.abs(x - dc) < 130 * u) {
        x += w;
        continue;
      }
      const gy = o.y - Math.max(0, hill(x + w / 2));
      const hh = (12 + R() * 9) * u;
      const roof = R();
      if (roof < 0.6) addPolyWound(solid, [[x, gy + 2], [x, gy - hh], [x + w / 2, gy - hh - w * 0.55], [x + w, gy - hh], [x + w, gy + 2]]);
      else {
        addRect(solid, x, gy - hh, w, hh + 2);
        addRect(solid, x - 0.8 * u, gy - hh - 1.5 * u, w + 1.6 * u, 1.8 * u); // flat cornice
      }
      addRect(solid, x + w * 0.2, gy - hh * 0.75, w * 0.6, hh * 0.35); // bay window box
      if (R() < lit) lights.rect(x + w * 0.3, gy - hh * 0.7, w * 0.4, hh * 0.22);
      if (R() < 0.12) {
        // a round street tree
        const tx = x + w + 2 * u;
        addCircle(solid, tx, gy - 9 * u, (5 + R() * 3) * u);
        addRect(solid, tx - 0.6 * u, gy - 6 * u, 1.2 * u, 7 * u);
        x += 8 * u;
      }
      x += w + (R() < 0.1 ? 4 * u : 0.6 * u);
    }
  } else {
    // megacity: dense layered slender towers; tallest near the centre
    const back: number[] = [];
    let x = o.x0 - 10;
    while (x < o.x1) {
      const w = (16 + R() * 34) * u * (R() < 0.15 ? 1.8 : 1);
      back.push(x, w);
      x += w + R() * 3 * u;
    }
    for (let i = 0; i < back.length; i += 2) {
      const bx = back[i];
      const w = back[i + 1];
      const f = (bx - o.x0) / (o.x1 - o.x0);
      const peak = Math.exp(-(((f - 0.5) / 0.28) ** 2));
      const h = H * (0.25 + 0.3 * R() + 0.45 * peak * R());
      const kind = R();
      addRect(solid, bx, o.y - h, w, h + 1);
      windowsGrid(lights, R, bx, o.y - h, w, o.y, lit, 4 * u, 5 * u);
      if (kind < 0.25) {
        // tapered crown + spire
        addPolyWound(solid, [[bx, o.y - h + 1], [bx + w * 0.3, o.y - h - w * 0.8], [bx + w * 0.7, o.y - h - w * 0.8], [bx + w, o.y - h + 1]]);
        addRect(solid, bx + w / 2 - 0.7 * u, o.y - h - w * 0.8 - 26 * u, 1.4 * u, 27 * u);
      } else if (kind < 0.45) {
        // tiered crown (stacked eaves)
        let ty = o.y - h;
        let tw = w;
        let tx = bx;
        for (let k = 0; k < 4; k++) {
          addPolyWound(solid, [[tx - 2 * u, ty + 1], [tx + tw + 2 * u, ty + 1], [tx + tw * 0.9, ty - 4 * u], [tx + tw * 0.1, ty - 4 * u]]);
          ty -= 4 * u;
          const nw = tw * 0.8;
          tx += (tw - nw) / 2;
          tw = nw;
          addRect(solid, tx, ty - 7 * u, tw, 7.5 * u);
          ty -= 7 * u;
        }
        addRect(solid, tx + tw / 2 - 0.6 * u, ty - 12 * u, 1.2 * u, 12 * u);
      } else if (kind < 0.6) {
        // slanted roof cut
        addPolyWound(solid, [[bx, o.y - h + 1], [bx, o.y - h - w * 0.6], [bx + w, o.y - h + 1]]);
      } else if (kind < 0.7 && i + 2 < back.length) {
        // sky bridge to the next tower
        addRect(solid, bx + w - 1, o.y - h * 0.7, back[i + 2] - bx - w + 3, 5 * u);
      } else {
        addRect(solid, bx + w * 0.15, o.y - h - 6 * u, w * 0.7, 6.5 * u); // plant room
        if (R() < 0.4) addRect(solid, bx + w * 0.5 - 0.6 * u, o.y - h - 20 * u, 1.2 * u, 15 * u);
      }
    }
  }
  return { solid, lights };
}

export const skyline: Painter<SkylineOpts> = (c, o, env) => {
  const g = memo(skyCache, keyOf(o), () => buildSkyline(o), 30);
  c.fillStyle = env.fill(o.role ?? 'set');
  c.fill(g.solid);
  c.fillStyle = withAlpha(env.mood.halo, 0.75 * (1 - env.layer.haze * 0.45));
  c.fill(g.lights);
};

// ---------------------------------------------------------------------------
// elevated railway trestle
// ---------------------------------------------------------------------------
export interface ElTrestleOpts {
  x0: number;
  x1: number;
  /** street level y */
  y: number;
  /** deck height */
  h: number;
  /** a train passing: car count (0 = none) and its x offset */
  train?: { cars: number; x: number };
  role?: FillRole;
}
export const elTrestle: Painter<ElTrestleOpts> = (c, o, env) => {
  const p = memoPath(`el${o.x0},${o.x1},${o.y},${o.h}`, () => {
    const q = new Path2D();
    const deck = o.y - o.h;
    addRect(q, o.x0, deck - 10, o.x1 - o.x0, 10); // girder
    addRect(q, o.x0, deck - 13, o.x1 - o.x0, 2); // rail
    const bay = o.h * 0.9;
    for (let x = o.x0; x <= o.x1; x += bay) {
      // column pair with lattice bracing
      addRect(q, x - 3, deck, 6, o.h);
      addPolyWound(q, [[x - 3, deck], [x - 3 - o.h * 0.18, deck], [x - 3, deck + o.h * 0.18]]);
      addPolyWound(q, [[x + 3, deck], [x + 3 + o.h * 0.18, deck], [x + 3, deck + o.h * 0.18]]);
    }
    // lattice in the girder: x-bracing holes are implied with thin diagonals
    for (let x = o.x0; x < o.x1; x += 12) {
      addPolyWound(q, [[x, deck], [x + 1.2, deck], [x + 13.2, deck + 8], [x + 12, deck + 8]]);
    }
    addRect(q, o.x0, deck, o.x1 - o.x0, 1.6);
    addRect(q, o.x0, deck + 8, o.x1 - o.x0, 1.6);
    return q;
  });
  const base = env.fill(o.role ?? 'set');
  c.fillStyle = base;
  c.fill(p);
  if (o.train && o.train.cars > 0) {
    const deck = o.y - o.h;
    const cw = 70;
    const q = new Path2D();
    const win = new Path2D();
    for (let i = 0; i < o.train.cars; i++) {
      const x = o.train.x + i * (cw + 4);
      q.roundRect(x, deck - 13 - 34, cw, 34, 5);
      addRect(q, x + cw, deck - 30, 4, 3);
      for (let k = 0; k < 6; k++) addRect(win, x + 6 + k * 10.5, deck - 13 - 26, 7, 10);
    }
    c.fillStyle = base;
    c.fill(q);
    c.fillStyle = withAlpha(env.mood.halo, 0.8);
    c.fill(win);
  }
  void palmette;
  void at;
  void addFoil;
};
