/**
 * Floors projected toward a horizon (style bible §3.2: "checker tiles projected as y = horizon + K/z").
 *
 *   checkerFloor(c, CheckerFloorOpts, env)   marble checkerboard (or diagonal diamonds) in perspective,
 *       hazed toward the back, darkened toward the viewer, optional window-reflection sheen strips.
 *   boardFloor(c, BoardFloorOpts, env)       floorboards running toward the vanishing point.
 *   floorProject(o, X, Z) -> [x, y]          front-row px X and depth Z (px) to screen, for placing props.
 *
 * Geometry: front edge at yFront, tiles `tile` px wide at the front row, vanishing point (vpX, horizon),
 * focal (default 900) sets the foreshortening; the floor is cut off at yBack (where it meets the wall).
 */
import type { Painter } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import { cutColor, keyOf, memo, strokeCuts } from './common';

export interface FloorGeom {
  x0: number;
  x1: number;
  yBack: number;
  yFront: number;
  horizon: number;
  vpX: number;
  focal?: number;
}
export interface CheckerFloorOpts extends FloorGeom {
  tile: number;
  diagonal?: boolean;
  /** tile contrast 0..1 (default 0.55) */
  contrast?: number;
  /** horizontal scroll of the pattern in front-row px (for camera trucks over a fixed floor) */
  offset?: number;
  /** soft reflections of bright openings: x at the back edge, width */
  sheen?: { x: number; w: number }[];
}

export function floorProject(o: FloorGeom, X: number, Z: number): [number, number] {
  const f = o.focal ?? 900;
  const s = f / (f + Z);
  return [o.vpX + (X - o.vpX) * s, o.horizon + (o.yFront - o.horizon) * s];
}

function zMax(o: FloorGeom) {
  const f = o.focal ?? 900;
  return (f * (o.yFront - o.horizon)) / (o.yBack - o.horizon) - f;
}

const checkCache = new Map<string, { light: Path2D; grout: Path2D }>();

export const checkerFloor: Painter<CheckerFloorOpts> = (c, o, env) => {
  const g = memo(checkCache, keyOf(o), () => {
    const light = new Path2D();
    const grout = new Path2D();
    const f = o.focal ?? 900;
    const Zm = zMax(o);
    const T = o.tile;
    const off = o.offset ?? 0;
    const spanX = ((Math.max(Math.abs(o.x0 - o.vpX), Math.abs(o.x1 - o.vpX)) * (f + Zm)) / f) + T * 2;
    const P = (X: number, Z: number) => floorProject(o, X, Math.min(Z, Zm));
    const rows = Math.ceil(Zm / T) + 1;
    if (!o.diagonal) {
      const j0 = Math.floor((-spanX - off) / T);
      const j1 = Math.ceil((spanX - off) / T);
      for (let i = 0; i < rows; i++) {
        const Za = i * T;
        if (Za >= Zm) break;
        const Zb = (i + 1) * T;
        for (let j = j0; j < j1; j++) {
          if ((((i + j) % 2) + 2) % 2) continue;
          const Xa = o.vpX + j * T + off;
          const Xb = Xa + T;
          const a = P(Xa, Za);
          const b = P(Xb, Za);
          const cc = P(Xb, Zb);
          const d = P(Xa, Zb);
          light.moveTo(a[0], a[1]);
          light.lineTo(b[0], b[1]);
          light.lineTo(cc[0], cc[1]);
          light.lineTo(d[0], d[1]);
          light.closePath();
        }
      }
      for (let i = 0; i <= rows; i++) {
        const [, y] = P(0, i * T);
        grout.moveTo(o.x0, y);
        grout.lineTo(o.x1, y);
      }
      for (let j = Math.floor(-spanX / T); j < spanX / T; j++) {
        const a = P(o.vpX + j * T + off, 0);
        const b = P(o.vpX + j * T + off, Zm);
        grout.moveTo(a[0], a[1]);
        grout.lineTo(b[0], b[1]);
      }
    } else {
      // diamonds: tiles rotated 45° on the floor plane
      const D = T * Math.SQRT1_2;
      const n = Math.ceil((spanX + Zm) / D) + 2;
      for (let i = -n; i < n; i++) {
        for (let j = -n; j < n; j++) {
          if ((((i + j) % 2) + 2) % 2) continue;
          // diamond centre in floor coords
          const cx = (i - j) * D + o.vpX + off;
          const cz = (i + j) * D;
          if (cz < -D || cz > Zm + D) continue;
          if (Math.abs(cx - o.vpX) > spanX) continue;
          const pts = [P(cx, cz - D), P(cx + D, cz), P(cx, cz + D), P(cx - D, cz)].map(([x, y], k) => {
            const Z = [cz - D, cz, cz + D, cz][k];
            return Z < 0 ? floorProject(o, [cx, cx + D, cx, cx - D][k], 0) : ([x, y] as [number, number]);
          });
          light.moveTo(pts[0][0], pts[0][1]);
          for (let k = 1; k < 4; k++) light.lineTo(pts[k][0], pts[k][1]);
          light.closePath();
        }
      }
    }
    return { light, grout };
  });
  const set = env.fill('set');
  const fg = env.fill('fg');
  const k = o.contrast ?? 0.55;
  const dark = mixLab(fg, set, 0.5);
  const lite = mixLab(dark, mixLab(set, env.mood.haze, 0.15), k);
  c.save();
  c.beginPath();
  c.rect(o.x0, o.yBack, o.x1 - o.x0, o.yFront - o.yBack + 400);
  c.clip();
  c.fillStyle = dark;
  c.fillRect(o.x0, o.yBack, o.x1 - o.x0, o.yFront - o.yBack + 400);
  c.fillStyle = lite;
  c.fill(g.light);
  if (!o.diagonal) strokeCuts(c, g.grout, withAlpha(env.mood.fg, 0.35), 1);
  // reflections of bright openings
  for (const s of o.sheen ?? []) {
    const gr = c.createLinearGradient(0, o.yBack, 0, o.yFront);
    gr.addColorStop(0, withAlpha(env.mood.sky[3], 0.22));
    gr.addColorStop(0.5, withAlpha(env.mood.sky[3], 0.06));
    gr.addColorStop(1, withAlpha(env.mood.sky[3], 0));
    c.fillStyle = gr;
    const f = o.focal ?? 900;
    const Zm = zMax(o);
    const Xa = o.vpX + ((s.x - s.w / 2 - o.vpX) * (f + Zm)) / f;
    const Xb = o.vpX + ((s.x + s.w / 2 - o.vpX) * (f + Zm)) / f;
    const a = floorProject(o, Xa, Zm);
    const b = floorProject(o, Xb, Zm);
    const cc = floorProject(o, Xb, 0);
    const d = floorProject(o, Xa, 0);
    c.beginPath();
    c.moveTo(a[0], a[1]);
    c.lineTo(b[0], b[1]);
    c.lineTo(cc[0], cc[1]);
    c.lineTo(d[0], d[1]);
    c.closePath();
    c.fill();
  }
  // haze at the back, darkness toward the viewer
  const gr = c.createLinearGradient(0, o.yBack, 0, o.yFront);
  gr.addColorStop(0, withAlpha(env.mood.haze, 0.38));
  gr.addColorStop(0.3, withAlpha(env.mood.haze, 0.06));
  gr.addColorStop(0.65, withAlpha(env.mood.fg, 0.1));
  gr.addColorStop(1, withAlpha(env.mood.fg, 0.6));
  c.fillStyle = gr;
  c.fillRect(o.x0, o.yBack, o.x1 - o.x0, o.yFront - o.yBack + 400);
  c.restore();
};

export interface BoardFloorOpts extends FloorGeom {
  /** board width at the front row */
  board: number;
  /** board length (depth) in px, for the staggered butt joints */
  length?: number;
}
const boardCache = new Map<string, Path2D>();
export const boardFloor: Painter<BoardFloorOpts> = (c, o, env) => {
  const lines = memo(boardCache, keyOf(o), () => {
    const p = new Path2D();
    const f = o.focal ?? 900;
    const Zm = zMax(o);
    const span = (Math.max(Math.abs(o.x0 - o.vpX), Math.abs(o.x1 - o.vpX)) * (f + Zm)) / f;
    const L = o.length ?? o.board * 8;
    for (let j = Math.floor(-span / o.board); j <= span / o.board; j++) {
      const X = o.vpX + j * o.board;
      const a = floorProject(o, X, 0);
      const b = floorProject(o, X, Zm);
      p.moveTo(a[0], a[1]);
      p.lineTo(b[0], b[1]);
      const ph = ((j * 0.37) % 1 + 1) % 1;
      for (let Z = ph * L; Z < Zm; Z += L) {
        const u = floorProject(o, X, Z);
        const v = floorProject(o, X + o.board, Z);
        p.moveTo(u[0], u[1]);
        p.lineTo(v[0], v[1]);
      }
    }
    return p;
  });
  c.save();
  c.beginPath();
  c.rect(o.x0, o.yBack, o.x1 - o.x0, o.yFront - o.yBack + 400);
  c.clip();
  c.fillStyle = mixLab(env.fill('fg'), env.fill('set'), 0.62);
  c.fillRect(o.x0, o.yBack, o.x1 - o.x0, o.yFront - o.yBack + 400);
  strokeCuts(c, lines, cutColor(env, 0.07), 1);
  const gr = c.createLinearGradient(0, o.yBack, 0, o.yFront);
  gr.addColorStop(0, withAlpha(env.mood.haze, 0.3));
  gr.addColorStop(0.35, withAlpha(env.mood.haze, 0));
  gr.addColorStop(1, withAlpha(env.mood.fg, 0.6));
  c.fillStyle = gr;
  c.fillRect(o.x0, o.yBack, o.x1 - o.x0, o.yFront - o.yBack + 400);
  c.restore();
};
