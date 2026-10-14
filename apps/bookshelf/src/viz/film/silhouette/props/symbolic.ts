/**
 * Symbolic props (real size at s = 1; y = the surface they stand on unless noted).
 *
 *   globe({ x, y, spin?: rad (default env.t·0.15), tilt?: rad (23.4°) })          anchors: centre, top
 *   chessboard({ x, y, position?: 'start'|'midgame'|'endgame'|string[8] (FEN rows), lit? })
 *       board in low perspective, white pieces in paper tone, black in ink. anchors: centre, square(o,c,r)
 *   chessPiece(c, kind 'KQRBNP'|'kqrbnp', x, y, h, env)   one piece silhouette (local units)
 *   goBoard({ x, y, view?: 'perspective'|'top', stones?: string[19] ('.','b','w') | count?: n random, seed?,
 *             bowls?: true })  y = floor (perspective) or board centre (top). anchors: centre, point(o,c,r)
 *   newspaper({ x, y, folded?: false, photo?: true, seed? })  a flat plate, y = bottom edge.
 *       anchors: masthead, headlineTL, headlineBR, photo   (text comes from the type module)
 *   microphone({ x, y, kind?: 'ribbon'|'dynamic'|'condenser', stand?: 'floor'|'desk'|'none' })  anchors: capsule
 *   podium({ x, y, mic?: true, w? })                          anchors: top, mic, emblem
 *   medallion({ x, y, motif?: 'star'|'blank', ribbon?: true, tone?: 'ink'|'gold' })  y = medal centre.
 *       anchors: centre
 *   clock({ x, y, time?: hours (float, default 10.15), kind?: 'wall'|'mantel'|'pocket' })
 *       wall/pocket: y = centre; mantel: y = shelf. anchors: centre, top
 */
import type { PaintEnv } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import {
  type PropAt,
  type Pt,
  circle,
  cut,
  defineProp,
  ellipse,
  fillInk,
  hash,
  lamp,
  lathe,
  memo,
  paper,
  poly,
  rect,
  rrect,
  toWorld,
  veil,
} from './_kit';

// ---------------------------------------------------------------------------
// Globe
// ---------------------------------------------------------------------------
export interface GlobeOpts extends PropAt {
  spin?: number;
  tilt?: number;
}

const GL = { R: 15, cy: -40 };

export const globe = defineProp<GlobeOpts, 'centre' | 'top'>(
  (c, o, env) => {
    const ink = env.fill('ink');
    const tilt = o.tilt ?? (23.4 * Math.PI) / 180;
    const S = memo('globe:stand', () => {
      const p = new Path2D();
      lathe([[8.6, 0, 1], [8.6, -0.9, 1], [7.4, -1.6], [4.0, -2.6], [2.2, -3.8], [1.4, -6], [2.3, -8.2], [1.4, -10.2], [1.0, -12.4, 1], [1.6, -13.2, 1], [1.6, -14.4, 1]], 0, p);
      // three cabriole feet hint
      for (const sx of [-1, 1]) poly(p, [sx * 6, -0.6, sx * 10.6, 0, sx * 10.6, 0.0, sx * 6.4, 0]);
      return p;
    });
    fillInk(c, env, S);
    // swan-neck arm from the stand to the ring's lower pivot (follows the axis tilt)
    const pv = { x: -Math.sin(tilt) * (GL.R + 3.0), y: GL.cy + Math.cos(tilt) * (GL.R + 3.0) };
    c.save();
    c.strokeStyle = ink;
    c.lineCap = 'round';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(0, -14);
    c.bezierCurveTo(0, -19, pv.x * 0.4, pv.y + 3, pv.x, pv.y);
    c.stroke();
    c.restore();
    c.save();
    c.translate(0, GL.cy);
    // meridian ring (a half-circle bracket) with degree ticks
    c.save();
    c.rotate(tilt);
    const ring = memo('globe:ring', () => {
      const p = new Path2D();
      p.arc(0, 0, GL.R + 2.2, -Math.PI * 0.5 - 0.02, Math.PI * 0.5 + 0.02, true);
      p.arc(0, 0, GL.R + 1.0, Math.PI * 0.5 + 0.02, -Math.PI * 0.5 - 0.02, false);
      p.closePath();
      rect(p, -0.5, -GL.R - 3.4, 1, 2.4);
      rect(p, -0.5, GL.R + 1, 1, 2.4);
      const ticks = new Path2D();
      for (let k = -8; k <= 8; k++) {
        const a = Math.PI + (k / 18) * Math.PI;
        ticks.moveTo(Math.cos(a) * (GL.R + 1.2), Math.sin(a) * (GL.R + 1.2));
        ticks.lineTo(Math.cos(a) * (GL.R + 1.8), Math.sin(a) * (GL.R + 1.8));
      }
      return { p, ticks };
    });
    c.fillStyle = ink;
    c.fill(ring.p);
    cut(c, env, ring.ticks, 0.3, 0.9);
    // the sphere with graticule cut-lines; longitudes turn with spin
    const sph = new Path2D();
    circle(sph, 0, 0, GL.R);
    c.fill(sph);
    const g = new Path2D();
    for (const lat of [-60, -30, 0, 30, 60]) {
      const phi = (lat * Math.PI) / 180;
      const y = -Math.sin(phi) * GL.R;
      const rx = Math.cos(phi) * GL.R;
      g.moveTo(rx, y);
      g.ellipse(0, y, rx, rx * 0.16, 0, 0, Math.PI);
    }
    const spin = o.spin ?? env.t * 0.15;
    for (let k = 0; k < 12; k++) {
      const lam = (k / 12) * Math.PI * 2 + spin;
      const sx = Math.sin(lam);
      if (Math.cos(lam) < 0) continue; // back hemisphere
      const rx = Math.abs(sx) * GL.R;
      g.moveTo(0, -GL.R);
      g.ellipse(0, 0, Math.max(0.01, rx), GL.R, 0, -Math.PI / 2, Math.PI / 2, sx < 0);
    }
    cut(c, env, g, 0.3, 1);
    // rim highlight on the lit side
    const hl = new Path2D();
    hl.arc(0, 0, GL.R - 0.6, -Math.PI * 0.95, -Math.PI * 0.6);
    cut(c, env, hl, 0.5, 1.4);
    c.restore();
    c.restore();
  },
  () => ({ centre: { x: 0, y: GL.cy }, top: { x: 0, y: GL.cy - GL.R - 3.4 } }),
  () => ({ x: -18, y: GL.cy - GL.R - 4, w: 36, h: -GL.cy + GL.R + 4 }),
);

// ---------------------------------------------------------------------------
// Chess
// ---------------------------------------------------------------------------
const PIECE_PROF: Record<string, Array<[number, number] | [number, number, number]>> = {
  p: [[0.42, 0, 1], [0.42, -0.08, 1], [0.34, -0.14], [0.2, -0.22], [0.15, -0.42], [0.26, -0.47, 1], [0.26, -0.51, 1], [0.13, -0.55], [0.2, -0.64], [0.18, -0.74], [0.08, -0.8], [0.02, -0.81, 1]],
  r: [[0.45, 0, 1], [0.45, -0.08, 1], [0.36, -0.15], [0.26, -0.24], [0.24, -0.6], [0.32, -0.66, 1], [0.32, -0.84, 1]],
  b: [[0.44, 0, 1], [0.44, -0.08, 1], [0.34, -0.15], [0.19, -0.26], [0.15, -0.52], [0.27, -0.57, 1], [0.27, -0.61, 1], [0.14, -0.64], [0.22, -0.8], [0.15, -0.94], [0.06, -1.0], [0.08, -1.04, 1], [0.08, -1.1, 1]],
  q: [[0.47, 0, 1], [0.47, -0.08, 1], [0.37, -0.16], [0.2, -0.3], [0.15, -0.75], [0.29, -0.8, 1], [0.29, -0.84, 1], [0.18, -0.88], [0.32, -1.04, 1], [0.32, -1.1, 1], [0.1, -1.14], [0.1, -1.2, 1]],
  k: [[0.48, 0, 1], [0.48, -0.08, 1], [0.38, -0.16], [0.21, -0.32], [0.16, -0.8], [0.3, -0.86, 1], [0.3, -0.9, 1], [0.19, -0.93], [0.28, -1.12, 1], [0.28, -1.16, 1], [0.05, -1.18, 1]],
};

function piecePath(kind: string): Path2D {
  const k = kind.toLowerCase();
  return memo(`chess:${k}`, () => {
    if (k === 'n') {
      // the knight's horse-head profile on a turned base (facing +x)
      const p = new Path2D();
      lathe([[0.45, 0, 1], [0.45, -0.08, 1], [0.36, -0.15], [0.3, -0.22, 1], [0.3, -0.26, 1]], 0, p);
      p.moveTo(-0.3, -0.25);
      p.bezierCurveTo(-0.34, -0.5, -0.3, -0.78, -0.12, -0.96);
      p.lineTo(-0.06, -1.06);
      p.lineTo(0.0, -0.98);
      p.bezierCurveTo(0.16, -0.95, 0.3, -0.82, 0.38, -0.66);
      p.lineTo(0.37, -0.6);
      p.bezierCurveTo(0.3, -0.6, 0.18, -0.64, 0.06, -0.62);
      p.bezierCurveTo(0.12, -0.5, 0.26, -0.38, 0.3, -0.25);
      p.closePath();
      return p;
    }
    const p = lathe(PIECE_PROF[k] ?? PIECE_PROF.p);
    if (k === 'r') for (const x of [-0.32, -0.07, 0.17]) rect(p, x, -0.97, 0.15, 0.15); // merlons
    if (k === 'k') {
      rect(p, -0.035, -1.36, 0.07, 0.2);
      rect(p, -0.1, -1.3, 0.2, 0.06);
    }
    if (k === 'q') for (let i = -2; i <= 2; i++) circle(p, i * 0.075, -1.24 - (2 - Math.abs(i)) * 0.015, 0.04);
    return p;
  });
}

/** draw one chess piece silhouette: kind upper = white (paper tone), lower = black (ink); y = base, h = height scale */
export function chessPiece(c: CanvasRenderingContext2D, kind: string, x: number, y: number, h: number, env: PaintEnv, facing = 1) {
  c.save();
  c.translate(x, y);
  c.scale(h * facing, h);
  const white = kind === kind.toUpperCase();
  c.fillStyle = white ? paper(env, 1) : env.fill('ink');
  c.fill(piecePath(kind));
  if (white) {
    c.strokeStyle = env.fill('ink');
    c.lineWidth = 0.03;
    c.stroke(piecePath(kind));
  }
  c.restore();
}

export interface ChessOpts extends PropAt {
  position?: 'start' | 'midgame' | 'endgame' | string[];
}
const POS: Record<string, string[]> = {
  start: ['rnbqkbnr', 'pppppppp', '........', '........', '........', '........', 'PPPPPPPP', 'RNBQKBNR'],
  midgame: ['r..q.rk.', 'pp..bppp', '..n.pn..', '...p....', '..PP....', '..N.PN..', 'PP..BPPP', 'R..Q.RK.'],
  endgame: ['......k.', '.....pp.', '........', '...K....', '........', '....R...', '.....P..', '........'],
};

const CB = { back: 30, front: 40, yb: -12.5, yf: -2.4, thick: 2.4 };

function boardPt(col: number, row: number): Pt & { s: number } {
  // row 0 = back rank (far), row 8 = front edge; col 0..8 across
  const v = row / 8;
  const w = CB.back + (CB.front - CB.back) * v;
  const y = CB.yb + (CB.yf - CB.yb) * Math.pow(v, 1.08);
  return { x: -w / 2 + (w * col) / 8, y, s: 0.8 + 0.2 * v };
}

export const chessboard = Object.assign(
  defineProp<ChessOpts, 'centre'>(
    (c, o, env) => {
      const ink = env.fill('ink');
      // board slab: front face, then the checker top in perspective
      const B = memo('chess:board', () => {
        const slab = new Path2D();
        const a = boardPt(0, 0);
        const b = boardPt(8, 0);
        const cc = boardPt(8, 8);
        const d = boardPt(0, 8);
        poly(slab, [a.x - 0.8, a.y - 0.3, b.x + 0.8, b.y - 0.3, cc.x + 1, cc.y, cc.x + 1, cc.y + CB.thick, d.x - 1, d.y + CB.thick, d.x - 1, d.y]);
        const dark = new Path2D();
        const light = new Path2D();
        for (let r = 0; r < 8; r++)
          for (let k = 0; k < 8; k++) {
            const p0 = boardPt(k, r);
            const p1 = boardPt(k + 1, r);
            const p2 = boardPt(k + 1, r + 1);
            const p3 = boardPt(k, r + 1);
            poly((r + k) % 2 ? dark : light, [p0.x, p0.y, p1.x, p1.y, p2.x, p2.y, p3.x, p3.y]);
          }
        return { slab, dark, light };
      });
      c.fillStyle = ink;
      c.fill(B.slab);
      c.fillStyle = mixLab(ink, env.mood.haze, 0.55);
      c.fill(B.light);
      c.fillStyle = mixLab(ink, env.mood.set, 0.25);
      c.fill(B.dark);
      cut(c, env, memo('chess:edge', () => {
        const p = new Path2D();
        const d = boardPt(0, 8);
        const cc = boardPt(8, 8);
        p.moveTo(d.x - 1, d.y + 0.3);
        p.lineTo(cc.x + 1, cc.y + 0.3);
        return p;
      }), 0.35, 1.1);
      const pos = Array.isArray(o.position) ? o.position : POS[o.position ?? 'start'] ?? POS.start;
      for (let r = 0; r < 8; r++)
        for (let k = 0; k < 8; k++) {
          const ch = pos[r]?.[k];
          if (!ch || ch === '.') continue;
          const p = boardPt(k + 0.5, r + 0.5);
          chessPiece(c, ch, p.x, p.y, 4.4 * p.s, env, ch === 'n' ? -1 : 1);
        }
    },
    () => ({ centre: { x: 0, y: (CB.yb + CB.yf) / 2 } }),
    () => ({ x: -CB.front / 2 - 1, y: CB.yb - 6.5, w: CB.front + 2, h: -CB.yb + 6.5 + CB.thick }),
  ),
  {
    /** world point of a square centre (col 0..7 from the left, row 0 = far rank) */
    square(o: ChessOpts, col: number, row: number): Pt {
      const p = boardPt(col + 0.5, row + 0.5);
      return toWorld(o, p.x, p.y);
    },
  },
);

// ---------------------------------------------------------------------------
// Go
// ---------------------------------------------------------------------------
export interface GoOpts extends PropAt {
  view?: 'perspective' | 'top';
  stones?: string[];
  count?: number;
  seed?: number;
  bowls?: boolean;
}

function goStones(o: GoOpts): Array<[number, number, 'b' | 'w']> {
  if (o.stones) {
    const out: Array<[number, number, 'b' | 'w']> = [];
    o.stones.forEach((row, r) => [...row].forEach((ch, k) => (ch === 'b' || ch === 'w') && out.push([k, r, ch])));
    return out;
  }
  const n = o.count ?? 60;
  const seed = o.seed ?? 9;
  return memo(`go:rand:${n}:${seed}`, () => {
    const used = new Set<number>();
    const out: Array<[number, number, 'b' | 'w']> = [];
    let i = 0;
    while (out.length < n && i < n * 20) {
      // cluster around a few hoshi so it looks like a game, not noise
      const hub = [[3, 3], [15, 3], [3, 15], [15, 15], [9, 9], [9, 3]][Math.floor(hash(i, seed) * 6)];
      const k = Math.max(0, Math.min(18, hub[0] + Math.round((hash(i, seed + 1) - 0.5) * 9)));
      const r = Math.max(0, Math.min(18, hub[1] + Math.round((hash(i, seed + 2) - 0.5) * 9)));
      const key = r * 19 + k;
      i++;
      if (used.has(key)) continue;
      used.add(key);
      out.push([k, r, out.length % 2 ? 'w' : 'b']);
    }
    return out;
  });
}

const GO = { size: 45, back: 30, front: 38, yb: -27, yf: -18, thick: 12 };
function goPt(col: number, row: number): Pt & { s: number } {
  const v = (row + 0.6) / 19.2;
  const w = GO.back + (GO.front - GO.back) * v;
  const y = GO.yb + (GO.yf - GO.yb) * v;
  return { x: (-w / 2) * 0.94 + ((w * 0.94) * (col + 0.6 - 0.1)) / 19.2, y, s: 0.82 + 0.18 * v };
}

export const goBoard = Object.assign(
  defineProp<GoOpts, 'centre'>(
    (c, o, env) => {
      const ink = env.fill('ink');
      const wood = mixLab(env.mood.set, env.mood.haze, 0.55);
      const stones = goStones(o);
      if (o.view === 'top') {
        const S = GO.size;
        const step = S / 20;
        const board = new Path2D();
        rect(board, -S / 2, -S / 2, S, S);
        c.fillStyle = wood;
        c.fill(board);
        const grid = memo('go:topgrid', () => {
          const p = new Path2D();
          for (let i = 0; i < 19; i++) {
            const u = -S / 2 + step * (i + 1);
            p.moveTo(-S / 2 + step, u);
            p.lineTo(S / 2 - step, u);
            p.moveTo(u, -S / 2 + step);
            p.lineTo(u, S / 2 - step);
          }
          for (const a of [3, 9, 15]) for (const b of [3, 9, 15]) circle(p, -S / 2 + step * (a + 1), -S / 2 + step * (b + 1), 0.18);
          return p;
        });
        c.save();
        c.strokeStyle = withAlpha(ink, 0.7);
        c.lineWidth = 0.08;
        c.stroke(grid);
        c.restore();
        const blk = new Path2D();
        const wht = new Path2D();
        for (const [k, r, col] of stones) circle(col === 'b' ? blk : wht, -S / 2 + step * (k + 1), -S / 2 + step * (r + 1), step * 0.47);
        c.fillStyle = ink;
        c.fill(blk);
        c.fillStyle = paper(env, 1);
        c.fill(wht);
        c.strokeStyle = withAlpha(ink, 0.5);
        c.lineWidth = 0.06;
        c.stroke(wht);
        return;
      }
      // perspective: a thick goban on four carved legs
      const B = memo('go:board', () => {
        const p = new Path2D();
        const top = new Path2D();
        poly(top, [-GO.back / 2, GO.yb, GO.back / 2, GO.yb, GO.front / 2, GO.yf, -GO.front / 2, GO.yf]);
        rect(p, -GO.front / 2, GO.yf, GO.front, GO.thick);
        for (const sx of [-1, 1]) {
          // kuchinashi (gardenia-fruit) legs
          lathe([[1.6, 0, 1], [2.6, -1.2], [3.0, -3], [2.4, -4.6], [1.4, -5.4], [1.6, -6, 1]], sx * (GO.front / 2 - 4.4), p);
        }
        lathe([[1.0, -5.2, 1], [1.8, -5.6], [2.0, -5.9, 1]], 0, p);
        const grid = new Path2D();
        for (let i = 0; i < 19; i++) {
          const l0 = goPt(0, i);
          const l1 = goPt(18, i);
          grid.moveTo(l0.x, l0.y);
          grid.lineTo(l1.x, l1.y);
          const c0 = goPt(i, 0);
          const c1 = goPt(i, 18);
          grid.moveTo(c0.x, c0.y);
          grid.lineTo(c1.x, c1.y);
        }
        return { p, top, grid };
      });
      c.fillStyle = ink;
      c.fill(B.p);
      c.fillStyle = wood;
      c.fill(B.top);
      c.save();
      c.strokeStyle = withAlpha(ink, 0.55);
      c.lineWidth = 0.07;
      c.stroke(B.grid);
      c.restore();
      cut(c, env, memo('go:edge', () => {
        const p = new Path2D();
        p.moveTo(-GO.front / 2, GO.yf + 0.4);
        p.lineTo(GO.front / 2, GO.yf + 0.4);
        return p;
      }), 0.3, 1);
      // stones back-to-front as lens shapes
      const sorted = [...stones].sort((p, q) => p[1] - q[1]);
      for (const [k, r, col] of sorted) {
        const p = goPt(k, r);
        const rr = 0.95 * p.s;
        const st = new Path2D();
        ellipse(st, p.x, p.y - rr * 0.22, rr, rr * 0.42);
        c.fillStyle = col === 'b' ? ink : paper(env, 1);
        c.fill(st);
        if (col === 'w') {
          c.strokeStyle = withAlpha(ink, 0.45);
          c.lineWidth = 0.06;
          c.stroke(st);
        }
      }
      if (o.bowls !== false) {
        // go-ke bowls on the floor beside the board
        const bowl = memo('go:bowl', () => lathe([[3.6, 0, 1], [5.6, -1.2], [6.2, -3.8], [5.6, -6.2], [4.4, -7.0, 1], [4.6, -7.4], [3.8, -8.2], [0.6, -8.6, 1]]));
        for (const sx of [-1, 1]) {
          c.save();
          c.translate(sx * (GO.front / 2 + 9), 0);
          c.fillStyle = ink;
          c.fill(bowl);
          cut(c, env, memo('go:bowlL', () => {
            const p = new Path2D();
            p.moveTo(-4.4, -7.0);
            p.quadraticCurveTo(0, -6.4, 4.4, -7.0);
            return p;
          }), 0.35, 1);
          c.restore();
        }
      }
    },
    () => ({ centre: { x: 0, y: (GO.yb + GO.yf) / 2 } }),
    (o) => (o.view === 'top' ? { x: -GO.size / 2, y: -GO.size / 2, w: GO.size, h: GO.size } : { x: -GO.front / 2 - 16, y: GO.yb - 2, w: GO.front + 32, h: -GO.yb + 2 }),
  ),
  {
    /** world point of intersection (col, row), 0..18 */
    point(o: GoOpts, col: number, row: number): Pt {
      if (o.view === 'top') {
        const step = GO.size / 20;
        return toWorld(o, -GO.size / 2 + step * (col + 1), -GO.size / 2 + step * (row + 1));
      }
      const p = goPt(col, row);
      return toWorld(o, p.x, p.y);
    },
  },
);

// ---------------------------------------------------------------------------
// Newspaper plate
// ---------------------------------------------------------------------------
export interface NewspaperOpts extends PropAt {
  folded?: boolean;
  photo?: boolean;
  seed?: number;
}

const NP = { w: 38, h: 58 };

export const newspaper = defineProp<NewspaperOpts, 'masthead' | 'headlineTL' | 'headlineBR' | 'photo'>(
  (c, o, env) => {
    const H = o.folded ? NP.h / 2 : NP.h;
    const ink = env.fill('ink');
    const sheet = new Path2D();
    sheet.moveTo(-NP.w / 2, 0);
    sheet.lineTo(-NP.w / 2 + 0.2, -H);
    sheet.lineTo(NP.w / 2, -H + 0.2);
    sheet.lineTo(NP.w / 2 - 0.15, 0);
    sheet.closePath();
    c.fillStyle = paper(env, 1);
    c.fill(sheet);
    // ageing: a soft darkening toward the edges
    const g = c.createRadialGradient(0, -H / 2, H * 0.2, 0, -H / 2, H * 0.75);
    g.addColorStop(0, withAlpha(ink, 0));
    g.addColorStop(1, withAlpha(ink, 0.16));
    c.fillStyle = g;
    c.fill(sheet);
    const top = -H;
    c.fillStyle = withAlpha(ink, 0.85);
    // masthead rules (the masthead text itself comes from the type module)
    c.fillRect(-NP.w / 2 + 1.5, top + 1.6, NP.w - 3, 0.12);
    c.fillRect(-NP.w / 2 + 1.5, top + 7.4, NP.w - 3, 0.35);
    c.fillRect(-NP.w / 2 + 1.5, top + 8.0, NP.w - 3, 0.1);
    // dateline strip
    c.fillStyle = withAlpha(ink, 0.4);
    c.fillRect(-NP.w / 2 + 1.5, top + 8.4, 6, 0.3);
    c.fillRect(NP.w / 2 - 7.5, top + 8.4, 6, 0.3);
    // headline area left clear: [top+9.4, top+16]; then columns of text
    const cols = 5;
    const cw = (NP.w - 3) / cols;
    const t0 = top + 17.2;
    const seed = o.seed ?? 3;
    c.fillStyle = withAlpha(ink, 0.32);
    for (let k = 0; k < cols; k++) {
      const x = -NP.w / 2 + 1.5 + k * cw;
      for (let yy = t0; yy < -1.2; yy += 0.62) {
        const inPhoto = o.photo !== false && k >= 1 && k <= 2 && yy < t0 + 13;
        if (inPhoto) continue;
        const para = hash(Math.floor(yy * 10) + k * 1000, seed) < 0.06;
        c.fillRect(x + (para ? 0.6 : 0.15), yy, cw - 0.6 - (para ? 0.6 : 0) - (hash(Math.floor(yy * 7) + k, seed) < 0.12 ? cw * 0.4 : 0), 0.28);
      }
      if (k > 0) {
        c.fillStyle = withAlpha(ink, 0.5);
        c.fillRect(x - 0.05, t0, 0.08, -1.2 - t0);
        c.fillStyle = withAlpha(ink, 0.32);
      }
    }
    if (o.photo !== false) {
      const px0 = -NP.w / 2 + 1.5 + cw + 0.3;
      c.fillStyle = mixLab(ink, env.mood.haze, 0.35);
      c.fillRect(px0, t0, cw * 2 - 0.6, 12);
      // a halftone hint: a dark silhouette band in the photo
      c.fillStyle = withAlpha(ink, 0.6);
      c.fillRect(px0, t0 + 8, cw * 2 - 0.6, 4);
      c.fillStyle = withAlpha(ink, 0.35);
      c.fillRect(px0, t0 + 12.4, cw * 2 - 0.6, 0.3);
    }
    if (!o.folded) {
      const fold = new Path2D();
      fold.moveTo(-NP.w / 2, -NP.h / 2);
      fold.lineTo(NP.w / 2, -NP.h / 2 + 0.2);
      c.save();
      c.strokeStyle = withAlpha(ink, 0.18);
      c.lineWidth = 0.15;
      c.stroke(fold);
      c.restore();
    }
  },
  (o) => {
    const H = o.folded ? NP.h / 2 : NP.h;
    return {
      masthead: { x: 0, y: -H + 4.6 },
      headlineTL: { x: -NP.w / 2 + 1.5, y: -H + 9.4 },
      headlineBR: { x: NP.w / 2 - 1.5, y: -H + 16.2 },
      photo: { x: -NP.w / 2 + 1.5 + (NP.w - 3) / 5 * 2, y: -H + 23 },
    };
  },
  (o) => ({ x: -NP.w / 2, y: -(o.folded ? NP.h / 2 : NP.h), w: NP.w, h: o.folded ? NP.h / 2 : NP.h }),
);

// ---------------------------------------------------------------------------
// Microphone and podium
// ---------------------------------------------------------------------------
export interface MicOpts extends PropAt {
  kind?: 'ribbon' | 'dynamic' | 'condenser';
  stand?: 'floor' | 'desk' | 'none';
}

function micHead(kind: NonNullable<MicOpts['kind']>) {
  return memo(`mic:${kind}`, () => {
    const p = new Path2D();
    const cl = new Path2D();
    if (kind === 'ribbon') {
      // 1940s ribbon: a tall pill-shaped grille in a yoke
      rrect(p, -4.2, -14, 8.4, 14, 4.2);
      rect(p, -0.6, 0, 1.2, 2.2);
      p.moveTo(-5.6, -6.5);
      p.lineTo(-5.6, 1.6);
      p.lineTo(5.6, 1.6);
      p.lineTo(5.6, -6.5);
      p.lineTo(4.8, -6.5);
      p.lineTo(4.8, 0.8);
      p.lineTo(-4.8, 0.8);
      p.lineTo(-4.8, -6.5);
      p.closePath();
      for (const sx of [-1, 1]) circle(p, sx * 5.2, -7, 0.9);
      for (let y = -12; y < -1.4; y += 0.9) {
        cl.moveTo(-3.0, y);
        cl.lineTo(3.0, y);
      }
      cl.moveTo(-4.2, -7);
      cl.lineTo(4.2, -7);
    } else if (kind === 'dynamic') {
      // 1950s "skeleton": a ribbed grille capsule with vertical chrome bars
      p.moveTo(0, -12.4);
      p.bezierCurveTo(4.8, -12.4, 5.2, -6, 4.0, -3);
      p.quadraticCurveTo(2.6, 0, 0, 0.2);
      p.quadraticCurveTo(-2.6, 0, -4.0, -3);
      p.bezierCurveTo(-5.2, -6, -4.8, -12.4, 0, -12.4);
      p.closePath();
      rect(p, -0.9, 0, 1.8, 2.6);
      for (const x of [-3.0, -1.5, 0, 1.5, 3.0]) {
        cl.moveTo(x, -11.6 + Math.abs(x) * 0.5);
        cl.quadraticCurveTo(x * 1.25, -6, x * 0.85, -1.2);
      }
    } else {
      // modern large-diaphragm condenser in a shock mount
      rrect(p, -2.6, -14, 5.2, 13.6, 2.6);
      rect(p, -0.7, -0.4, 1.4, 2.8);
      p.moveTo(-4.6, -9);
      p.lineTo(-4.6, -3.2);
      p.quadraticCurveTo(0, 0.6, 4.6, -3.2);
      p.lineTo(4.6, -9);
      p.lineTo(4.0, -9);
      p.lineTo(4.0, -3.6);
      p.quadraticCurveTo(0, -0.4, -4.0, -3.6);
      p.lineTo(-4.0, -9);
      p.closePath();
      cl.moveTo(-2.6, -8.6);
      cl.lineTo(2.6, -8.6);
      for (let y = -13; y < -9; y += 0.6) {
        cl.moveTo(-1.8, y);
        cl.lineTo(1.8, y);
      }
    }
    return { p, cl };
  });
}

export const microphone = defineProp<MicOpts, 'capsule'>(
  (c, o, env) => {
    const kind = o.kind ?? 'ribbon';
    const stand = o.stand ?? 'floor';
    const ink = env.fill('ink');
    const H = stand === 'floor' ? 150 : stand === 'desk' ? 22 : 0;
    if (stand !== 'none') {
      const S = memo(`micstand:${stand}`, () => {
        const p = new Path2D();
        if (stand === 'floor') {
          lathe([[13, 0, 1], [13, -1.0, 1], [11, -1.8], [3, -2.6], [1.6, -4], [1.6, -5, 1]], 0, p);
          rect(p, -0.9, -80, 1.8, 76);
          rect(p, -0.6, -H, 1.2, 70);
          rrect(p, -1.6, -82, 3.2, 3.6, 1);
          circle(p, 2.6, -80.2, 1.1);
        } else {
          lathe([[7, 0, 1], [7, -0.8, 1], [5.8, -1.6], [1.6, -2.6], [1, -3.2, 1]], 0, p);
          rect(p, -0.6, -H, 1.2, H - 3);
        }
        return p;
      });
      c.fillStyle = ink;
      c.fill(S);
    }
    c.save();
    c.translate(0, -H - 2.4);
    const M = micHead(kind);
    c.fillStyle = ink;
    c.fill(M.p);
    cut(c, env, M.cl, 0.35, 1);
    c.restore();
  },
  (o) => {
    const H = (o.stand ?? 'floor') === 'floor' ? 150 : o.stand === 'desk' ? 22 : 0;
    return { capsule: { x: 0, y: -H - 2.4 - 7 } };
  },
  (o) => {
    const H = (o.stand ?? 'floor') === 'floor' ? 150 : o.stand === 'desk' ? 22 : 0;
    return { x: -13, y: -H - 17, w: 26, h: H + 17 };
  },
);

export interface PodiumOpts extends PropAt {
  mic?: boolean;
  w?: number;
}

export const podium = defineProp<PodiumOpts, 'top' | 'mic' | 'emblem'>(
  (c, o, env) => {
    const w = o.w ?? 62;
    const ink = env.fill('ink');
    const G = memo(`podium:${w}`, () => {
      const p = new Path2D();
      // plinth, tapered panelled body, sloped reading desk with a lip
      rect(p, -w / 2 - 3, -5, w + 6, 5);
      rect(p, -w / 2 - 1.5, -8, w + 3, 3);
      poly(p, [-w / 2, -8, w / 2, -8, w / 2 + 3, -104, -w / 2 - 3, -104]);
      poly(p, [-w / 2 - 6, -104, w / 2 + 6, -104, w / 2 + 6, -110, -w / 2 - 6, -116]);
      rect(p, -w / 2 - 6, -118, 2.4, 3.6);
      const cl = new Path2D();
      // raised panel + moulding
      cl.moveTo(-w / 2 + 5, -16);
      cl.lineTo(w / 2 - 5, -16);
      cl.lineTo(w / 2 - 3.2, -96);
      cl.lineTo(-w / 2 + 3.2, -96);
      cl.closePath();
      cl.moveTo(-w / 2 - 2.6, -100);
      cl.lineTo(w / 2 + 2.6, -100);
      // emblem roundel (generic) + laurel arcs
      circle(cl, 0, -62, 9);
      circle(cl, 0, -62, 7.2);
      for (const sx of [-1, 1]) {
        cl.moveTo(sx * 3, -50);
        cl.quadraticCurveTo(sx * 12.5, -54, sx * 11.6, -68);
        for (let k = 0; k < 5; k++) {
          const u = 0.15 + k * 0.17;
          const bx = sx * (3 + 9 * u);
          const by = -50 - 14 * u * u;
          cl.moveTo(bx, by);
          cl.lineTo(bx + sx * 1.6, by - 1.4);
        }
      }
      // a five-pointed star in the roundel
      const star = new Path2D();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const r = k % 2 ? 2.2 : 5.2;
        const x = Math.cos(a) * r;
        const y = -62 + Math.sin(a) * r;
        if (k === 0) star.moveTo(x, y);
        else star.lineTo(x, y);
      }
      star.closePath();
      return { p, cl, star };
    });
    c.fillStyle = ink;
    c.fill(G.p);
    cut(c, env, G.cl, 0.3, 1.1);
    cut(c, env, G.star, 0.4, 1.1);
    if (o.mic !== false) {
      // gooseneck mic on the desk
      c.save();
      c.strokeStyle = ink;
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(w / 2 - 6, -110.5);
      c.bezierCurveTo(w / 2 - 6, -122, w / 2 - 14, -128, w / 2 - 20, -127);
      c.stroke();
      c.restore();
      const m = new Path2D();
      rrect(m, w / 2 - 25, -129.4, 6.2, 4.6, 2.2);
      c.fillStyle = ink;
      c.fill(m);
    }
  },
  (o) => {
    const w = o.w ?? 62;
    return { top: { x: 0, y: -112 }, mic: { x: w / 2 - 22, y: -127 }, emblem: { x: 0, y: -62 } };
  },
  (o) => {
    const w = (o.w ?? 62) + 12;
    return { x: -w / 2, y: -130, w, h: 130 };
  },
);

// ---------------------------------------------------------------------------
// Medallion
// ---------------------------------------------------------------------------
export interface MedallionOpts extends PropAt {
  motif?: 'star' | 'blank';
  ribbon?: boolean;
  tone?: 'ink' | 'gold';
}

export const medallion = defineProp<MedallionOpts, 'centre'>(
  (c, o, env) => {
    const G = memo('medal', () => {
      const R = 4;
      const disc = new Path2D();
      circle(disc, 0, 0, R);
      // laurel wreath: leaves along two arcs, pierced gaps between leaves
      const wreath = new Path2D();
      for (const sx of [-1, 1]) {
        for (let k = 0; k < 9; k++) {
          const a = Math.PI / 2 + sx * (0.25 + k * 0.29);
          const r = R * 0.78;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          const t = a + (sx > 0 ? -Math.PI / 2 : Math.PI / 2);
          ellipse(wreath, x + Math.cos(t) * 0.32, y + Math.sin(t) * 0.32, 0.55, 0.22, t + sx * 0.5);
        }
      }
      const beads = new Path2D();
      for (let k = 0; k < 40; k++) {
        const a = (k / 40) * Math.PI * 2;
        circle(beads, Math.cos(a) * (R - 0.3), Math.sin(a) * (R - 0.3), 0.09);
      }
      const star = new Path2D();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const r = k % 2 ? 0.7 : 1.7;
        if (k === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      star.closePath();
      const ribbon = new Path2D();
      poly(ribbon, [-2.2, -R - 6.4, 2.2, -R - 6.4, 1.2, -R + 0.4, -1.2, -R + 0.4]);
      rect(ribbon, -1.0, -R - 0.6, 2.0, 1.2);
      const ring = new Path2D();
      circle(ring, 0, -R - 0.3, 0.6);
      circle(ring, 0, -R - 0.3, 0.35, true);
      return { disc, wreath, beads, star, ribbon, ring, R };
    });
    const ink = env.fill('ink');
    const gold = o.tone === 'gold';
    if (o.ribbon !== false) {
      c.fillStyle = ink;
      c.fill(G.ribbon);
      cut(c, env, G.ribbon, 0.25, 1);
    }
    c.fillStyle = gold ? lamp(env, 0.25, 1) : ink;
    c.fill(G.disc);
    c.fill(G.ring);
    if (gold) {
      c.fillStyle = withAlpha(ink, 0.55);
      c.fill(G.wreath);
      c.fill(G.beads);
      if (o.motif !== 'blank') c.fill(G.star);
    } else {
      veil(c, env, G.wreath, 0.4);
      veil(c, env, G.beads, 0.4);
      if (o.motif !== 'blank') cut(c, env, G.star, 0.55, 1.2);
    }
    const rim = new Path2D();
    circle(rim, 0, 0, G.R - 0.08);
    cut(c, env, rim, gold ? 0.25 : 0.4, 1.1);
  },
  () => ({ centre: { x: 0, y: 0 } }),
  () => ({ x: -4, y: -10.4, w: 8, h: 14.4 }),
);

// ---------------------------------------------------------------------------
// Clock
// ---------------------------------------------------------------------------
export interface ClockOpts extends PropAt {
  time?: number;
  kind?: 'wall' | 'mantel' | 'pocket';
}

function clockFace(R: number, env: PaintEnv, c: CanvasRenderingContext2D, time: number, roman: boolean) {
  const ink = env.fill('ink');
  const face = new Path2D();
  circle(face, 0, 0, R);
  c.fillStyle = paper(env, 0.95);
  c.fill(face);
  const T = memo(`clock:ticks:${R}:${roman}`, () => {
    const minor = new Path2D();
    const major = new Path2D();
    for (let k = 0; k < 60; k++) {
      const a = (k / 60) * Math.PI * 2;
      const r0 = R * (k % 5 ? 0.9 : 0.8);
      (k % 5 ? minor : major).moveTo(Math.sin(a) * r0, -Math.cos(a) * r0);
      (k % 5 ? minor : major).lineTo(Math.sin(a) * R * 0.94, -Math.cos(a) * R * 0.94);
    }
    return { minor, major };
  });
  c.save();
  c.strokeStyle = ink;
  c.lineWidth = R * 0.012;
  c.stroke(T.minor);
  c.lineWidth = R * 0.045;
  c.stroke(T.major);
  // hands: spade hour hand, long minute hand
  const hrs = time % 12;
  const mins = (time * 60) % 60;
  const ah = (hrs / 12) * Math.PI * 2;
  const am = (mins / 60) * Math.PI * 2;
  c.fillStyle = ink;
  c.save();
  c.rotate(ah);
  c.beginPath();
  c.moveTo(-R * 0.03, R * 0.12);
  c.lineTo(-R * 0.035, -R * 0.38);
  c.quadraticCurveTo(-R * 0.1, -R * 0.42, 0, -R * 0.55);
  c.quadraticCurveTo(R * 0.1, -R * 0.42, R * 0.035, -R * 0.38);
  c.lineTo(R * 0.03, R * 0.12);
  c.closePath();
  c.fill();
  c.restore();
  c.save();
  c.rotate(am);
  c.beginPath();
  c.moveTo(-R * 0.022, R * 0.16);
  c.lineTo(-R * 0.012, -R * 0.8);
  c.lineTo(0, -R * 0.86);
  c.lineTo(R * 0.012, -R * 0.8);
  c.lineTo(R * 0.022, R * 0.16);
  c.closePath();
  c.fill();
  c.restore();
  c.beginPath();
  c.arc(0, 0, R * 0.05, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

export const clock = defineProp<ClockOpts, 'centre' | 'top'>(
  (c, o, env) => {
    const kind = o.kind ?? 'wall';
    const time = o.time ?? 10.15;
    const ink = env.fill('ink');
    if (kind === 'mantel') {
      const G = memo('clock:mantel', () => {
        const p = new Path2D();
        // a Napoleon-hat mantel clock: plinth, swept shoulders, domed centre with finial
        rect(p, -21, -2.4, 42, 2.4);
        for (const x of [-18, 18]) circle(p, x, -0.4, 1.4);
        p.moveTo(-20, -2.4);
        p.bezierCurveTo(-20, -10, -16, -12, -10, -13.4);
        p.bezierCurveTo(-8.4, -22, 8.4, -22, 10, -13.4);
        p.bezierCurveTo(16, -12, 20, -10, 20, -2.4);
        p.closePath();
        lathe([[0.9, -20.8, 1], [1.4, -21.8], [0.6, -23], [0.9, -23.6, 1]], 0, p);
        const bezel = new Path2D();
        circle(bezel, 0, -11.6, 7.6);
        return { p, bezel };
      });
      c.fillStyle = ink;
      c.fill(G.p);
      cut(c, env, G.bezel, 0.45, 1.2);
      c.save();
      c.translate(0, -11.6);
      clockFace(6.8, env, c, time, true);
      c.restore();
      return;
    }
    const R = kind === 'pocket' ? 2.5 : 16;
    // case ring
    const ringP = new Path2D();
    circle(ringP, 0, 0, R * 1.12);
    c.fillStyle = ink;
    c.fill(ringP);
    if (kind === 'pocket') {
      const bow = new Path2D();
      circle(bow, 0, -R * 1.5, R * 0.36);
      circle(bow, 0, -R * 1.5, R * 0.22, true);
      rect(bow, -R * 0.14, -R * 1.3, R * 0.28, R * 0.25);
      c.fill(bow);
      // chain
      c.save();
      c.strokeStyle = ink;
      c.lineWidth = R * 0.05;
      c.setLineDash([R * 0.12, R * 0.06]);
      c.beginPath();
      c.moveTo(0, -R * 1.85);
      c.bezierCurveTo(R * 0.8, -R * 3, R * 2.6, -R * 2.8, R * 3.2, -R * 1.6);
      c.stroke();
      c.restore();
    } else {
      // wall clock: a hanging loop and a pierced crest
      const crest = new Path2D();
      poly(crest, [-R * 0.18, -R * 1.1, R * 0.18, -R * 1.1, 0, -R * 1.34]);
      c.fill(crest);
    }
    clockFace(R, env, c, time, true);
    const rim = new Path2D();
    circle(rim, 0, 0, R * 1.04);
    cut(c, env, rim, 0.35, 1.1);
  },
  (o) => {
    const kind = o.kind ?? 'wall';
    if (kind === 'mantel') return { centre: { x: 0, y: -11.6 }, top: { x: 0, y: -23.6 } };
    const R = kind === 'pocket' ? 2.5 : 16;
    return { centre: { x: 0, y: 0 }, top: { x: 0, y: -R * 1.34 } };
  },
  (o) => {
    const kind = o.kind ?? 'wall';
    if (kind === 'mantel') return { x: -21, y: -23.6, w: 42, h: 23.6 };
    const R = kind === 'pocket' ? 2.5 : 16;
    return { x: -R * 1.2, y: -R * 1.4, w: R * 2.4, h: R * 2.6 };
  },
);
