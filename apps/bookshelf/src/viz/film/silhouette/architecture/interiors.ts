/**
 * Interior set pieces: bookshelves, staircases, lecture-hall blackboards and tiered seating.
 *
 *   bookshelfWall(c, { x, y, w, h, bays?, shelves?, seed?, lean?, gaps?, objects?, backTone? }, env)
 *       a library case: cornice, plinth, uprights, a lighter shelf back, varied books (folios, leaning
 *       runs, stacks lying flat, gilt bands), the odd turned urn or globe. (x,y) top-left.
 *   staircase(c, { x, y, steps, rise, run, dir?, rail?, open?, newel?, perTread?, role? }, env)
 *       side elevation; (x,y) = floor at the foot of the first step; dir 1 climbs to the right.
 *       Separate bullnosed treads + risers, a diagonal stringer, a landing with a post, turned
 *       balusters (perTread, default 2), a moulded handrail, newels with finials, rim-lit tread and
 *       rail edges. Closed (default) adds a lighter panelled spandrel; open shows the wall beneath.
 *       Use role 'ink' on the action plane for a near-black foreground stair.
 *   blackboardWall(c, { x, y, w, h, boards?, boardTop?, boardH?, chalk?, clerestory?, seed? }, env)
 *       lecture-hall front wall: clerestory window holes, framed slate boards with chalk trays and
 *       chalk ('scribble' | 'network' | 'none'). Returns nothing; boards rects via blackboardRects(o).
 *   tieredSeating(c, { x0, x1, y, tiers, tierH?, vpX? }, env)
 *       foreground rows of lecture desks stepping up toward the viewer (use on L5, role 'fg'/'ink').
 */
import type { FillRole, Painter } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import { addCircle, addRect, addPolyWound, dentils, memoPath } from '../ornament';
import { placeTurning, turning } from '../lathe';
import { arch, windowGeom } from './openings';
import { cutColor, keyOf, memo, rng, shadeColor, strokeCuts, type Pt } from './common';

// ---------------------------------------------------------------------------
// bookshelf
// ---------------------------------------------------------------------------
export interface BookshelfOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  bays?: number;
  shelves?: number;
  seed?: number;
  /** probability a run ends in a leaning book (0..1) */
  lean?: number;
  /** probability of a gap / stack / object per slot (0..1) */
  gaps?: number;
  objects?: boolean;
  /** shelf-back tone toward haze 0..1 (lighter back makes books read) */
  backTone?: number;
  role?: FillRole;
}
interface ShelfGeom {
  carcass: Path2D;
  back: Path2D;
  books: Path2D;
  gilt: Path2D;
  cuts: Path2D;
}
const shelfCache = new Map<string, ShelfGeom>();

function buildShelf(o: BookshelfOpts): ShelfGeom {
  const R = rng(o.seed ?? 3, 11);
  const bays = o.bays ?? Math.max(1, Math.round(o.w / 170));
  const shelves = o.shelves ?? Math.max(2, Math.round(o.h / 85));
  const cor = Math.min(40, o.h * 0.07);
  const plinth = Math.min(36, o.h * 0.07);
  const up = Math.max(6, o.w * 0.012);
  const board = Math.max(3, up * 0.55);
  const carcass = new Path2D();
  const back = new Path2D();
  const books = new Path2D();
  const gilt = new Path2D();
  const cuts = new Path2D();
  const { x, y, w, h } = o;
  // cornice with dentils and plinth
  addRect(carcass, x - cor * 0.3, y, w + cor * 0.6, cor * 0.45);
  carcass.addPath(dentils({ w: w + cor * 0.2, h: cor * 0.3 }), new DOMMatrix([1, 0, 0, 1, x - cor * 0.1, y + cor * 0.43]));
  addRect(carcass, x, y + cor * 0.7, w, cor * 0.3 + 1);
  addRect(carcass, x - 2, y + h - plinth, w + 4, plinth);
  const innerTop = y + cor;
  const innerBot = y + h - plinth;
  const bw = (w - up) / bays;
  const sh = (innerBot - innerTop) / shelves;
  for (let b = 0; b <= bays; b++) addRect(carcass, x + b * bw, innerTop, up, innerBot - innerTop);
  for (let b = 0; b < bays; b++) {
    const bx0 = x + b * bw + up;
    const bx1 = x + (b + 1) * bw;
    addRect(back, bx0, innerTop, bx1 - bx0, innerBot - innerTop);
    for (let s = 0; s < shelves; s++) {
      const sy = innerTop + (s + 1) * sh; // shelf board top (books stand on sy - board)
      addRect(carcass, bx0, sy - board, bx1 - bx0, board);
      const floor = sy - board;
      const clear = sh - board;
      let cx = bx0 + 1;
      let guard = 0;
      while (cx < bx1 - 4 && guard++ < 200) {
        const roll = R();
        const gapP = o.gaps ?? 0.12;
        if (roll < gapP * 0.35) {
          cx += 6 + R() * 18; // gap
          continue;
        }
        if (roll < gapP * 0.6) {
          // stack lying flat
          const n = 2 + Math.floor(R() * 4);
          const sw = clear * (0.5 + R() * 0.3);
          if (cx + sw > bx1 - 2) break;
          let yy = floor;
          for (let k = 0; k < n; k++) {
            const bh = 3 + R() * 4;
            const ww = sw * (0.82 + R() * 0.18);
            addRect(books, cx + (sw - ww) * R(), yy - bh, ww, bh - 0.6);
            yy -= bh;
          }
          cx += sw + 2;
          continue;
        }
        if ((o.objects ?? true) && roll < gapP * 0.8) {
          const oh = clear * (0.4 + R() * 0.35);
          const kind = R() < 0.5 ? 'urn' : 'vase';
          const t = turning(kind, oh);
          if (cx + t.w + 6 > bx1) break;
          placeTurning(books, t, cx + t.w / 2 + 3, floor);
          cx += t.w + 8;
          continue;
        }
        // a run of books
        const run = 3 + Math.floor(R() * 9);
        for (let k = 0; k < run && cx < bx1 - 4; k++) {
          const folio = R() < 0.12;
          const bh = clear * (folio ? 0.88 + R() * 0.08 : 0.58 + R() * 0.28);
          const bwid = folio ? 9 + R() * 7 : 4 + R() * 6;
          if (cx + bwid > bx1 - 1) break;
          // slightly rounded spine tops
          books.moveTo(cx, floor);
          books.lineTo(cx, floor - bh + 1.2);
          books.quadraticCurveTo(cx + bwid / 2, floor - bh - 0.8, cx + bwid, floor - bh + 1.2);
          books.lineTo(cx + bwid, floor);
          books.closePath();
          if (R() < 0.55 && bwid > 4.5) {
            for (const f of [0.1, 0.16, 0.84]) {
              gilt.moveTo(cx + 0.8, floor - bh * (1 - f));
              gilt.lineTo(cx + bwid - 0.8, floor - bh * (1 - f));
            }
          }
          cx += bwid + 0.7;
        }
        // leaning book at the end of a run
        if (R() < (o.lean ?? 0.4)) {
          const bh = clear * (0.62 + R() * 0.24);
          const bwid = 4 + R() * 5;
          const ang = 0.18 + R() * 0.3;
          const room = bh * Math.sin(ang) + bwid * Math.cos(ang);
          if (cx + room < bx1 - 2) {
            // book leans left onto the run: bottom-right corner at (cx + room, floor)
            const bxR = cx + room;
            const s = Math.sin(ang);
            const cs = Math.cos(ang);
            const pts: Pt[] = [
              [bxR, floor],
              [bxR - bwid * cs, floor - bwid * s],
              [bxR - bwid * cs - bh * s, floor - bwid * s - bh * cs],
              [bxR - bh * s, floor - bh * cs],
            ];
            addPolyWound(books, pts);
            cx = bxR + 3 + R() * 10;
          }
        }
      }
    }
    // bay panel cut-lines on the uprights
    cuts.moveTo(x + b * bw + up / 2, innerTop + 4);
    cuts.lineTo(x + b * bw + up / 2, innerBot - 4);
  }
  cuts.moveTo(x + w - up / 2, innerTop + 4);
  cuts.lineTo(x + w - up / 2, innerBot - 4);
  cuts.moveTo(x, innerBot + 4);
  cuts.lineTo(x + w, innerBot + 4);
  return { carcass, back, books, gilt, cuts };
}

export const bookshelfWall: Painter<BookshelfOpts> = (c, o, env) => {
  const g = memo(shelfCache, keyOf(o), () => buildShelf(o), 40);
  const base = env.fill(o.role ?? 'set');
  c.fillStyle = mixLab(base, env.mood.haze, o.backTone ?? 0.3);
  c.fill(g.back);
  // a soft shadow at the top of each shelf compartment is implied by the darker books
  c.fillStyle = mixLab(base, env.mood.fg, 0.25);
  c.fill(g.books);
  c.fillStyle = base;
  c.fill(g.carcass, 'evenodd');
  strokeCuts(c, g.gilt, withAlpha(env.mood.halo, 0.28 * (1 - env.layer.haze)), 0.9);
  strokeCuts(c, g.cuts, cutColor(env, 0.14), 1);
};

// ---------------------------------------------------------------------------
// staircase
// ---------------------------------------------------------------------------
export interface StaircaseOpts {
  x: number;
  y: number;
  steps: number;
  rise: number;
  run: number;
  /** 1 climbs to the right, -1 to the left */
  dir?: 1 | -1;
  /** handrail height above the nosing line (0 = no balustrade) */
  rail?: number;
  /** open string (wall shows under the flight) vs a lighter panelled spandrel (default) */
  open?: boolean;
  newel?: boolean;
  /** balusters per tread */
  perTread?: number;
  role?: FillRole;
}
interface StairGeom {
  solid: Path2D;
  spandrel: Path2D;
  panels: Path2D;
  rims: Path2D;
}
const stairCache = new Map<string, StairGeom>();
function buildStair(o: StaircaseOpts): StairGeom {
  const solid = new Path2D();
  const spandrel = new Path2D();
  const panels = new Path2D();
  const rims = new Path2D();
  const d = o.dir ?? 1;
  const { x, y, steps, rise, run } = o;
  const X = (u: number) => x + d * u;
  const nose = run * 0.14;
  const tt = Math.max(2, rise * 0.2); // tread thickness
  const topY = y - steps * rise;
  const landing = run * 0.9;
  // treads: separate slabs with a bullnose; rim highlights along their top edges
  for (let i = 0; i < steps; i++) {
    const ty = y - (i + 1) * rise;
    const a0 = i * run - nose;
    const a1 = (i + 1) * run + (i === steps - 1 ? landing : 0);
    const l = Math.min(X(a0), X(a1));
    addRect(solid, l, ty, Math.abs(X(a1) - X(a0)), tt);
    addCircle(solid, X(a0), ty + tt / 2, tt * 0.55);
    rims.moveTo(X(a0), ty);
    rims.lineTo(X(a1), ty);
    // closed riser below each tread (set back from the nosing)
    const rw = Math.max(1.5, run * 0.05);
    addRect(solid, Math.min(X(i * run), X(i * run + rw)), ty + tt - 0.5, rw, rise - tt + 1);
  }
  // stringer: a diagonal band under the nosings, with a moulded top edge
  const sd = rise * 1.25;
  const s0: Pt = [X(-nose * 0.5), y];
  const s1: Pt = [X(steps * run + landing), topY + tt];
  addPolyWound(solid, [s0, [X(run * 0.9), y - rise + tt], [X(steps * run), topY + tt], s1, [s1[0], topY + tt + sd], [X(run * 0.9 + sd * (run / rise) * 0.6), y]]);
  // landing beam and post down to the floor
  const pw = Math.max(4, run * 0.22);
  addRect(solid, Math.min(X(steps * run + landing - pw), X(steps * run + landing)), topY, pw, y - topY);
  // closed spandrel under the flight: a lighter panelled board (not one black mass)
  if (!o.open) {
    addPolyWound(spandrel, [[X(run * 0.9 + sd * (run / rise) * 0.6), y], [s1[0], topY + tt + sd], [X(steps * run + landing - pw), topY + tt + sd], [X(steps * run + landing - pw), y]]);
    const nP = Math.max(2, Math.round(steps / 3));
    for (let k = 0; k < nP; k++) {
      const u0 = run * 1.4 + ((steps * run + landing - pw - run * 1.6) * k) / nP;
      const u1 = run * 1.4 + ((steps * run + landing - pw - run * 1.6) * (k + 1)) / nP - run * 0.35;
      const yTop0 = y - (u0 / run) * rise + sd + rise * 0.6;
      const yTop1 = y - (u1 / run) * rise + sd + rise * 0.6;
      const yb = y - rise * 0.6;
      if (yb - Math.max(yTop0, yTop1) < rise) continue;
      panels.moveTo(X(u0), yb);
      panels.lineTo(X(u0), Math.min(yb, yTop0));
      panels.lineTo(X(u1), Math.min(yb, yTop1));
      panels.lineTo(X(u1), yb);
      panels.closePath();
    }
  }
  const rail = o.rail ?? rise * 5;
  if (rail > 0) {
    const per = o.perTread ?? 2;
    const bw = Math.max(3, run * 0.12);
    const rakeY = (u: number) => y - (u / run + 0.6) * rise - rail; // underside of the handrail along the rake
    for (let u = run * 1.0 + run / per / 2; u < steps * run + landing - pw * 1.5; u += run / per) {
      const footY = u < steps * run ? y - (Math.floor(u / run) + 1) * rise : topY;
      const hb = footY - rakeY(Math.min(u, steps * run)) - 1;
      if (hb < rise) continue;
      placeTurning(solid, turning('balusterSlim', hb, bw), X(u), footY + 0.5);
    }
    // handrail: a thick moulded rail along the rake, flattening over the landing, rim-lit on top
    const hr = Math.max(3.5, rise * 0.3);
    const a: Pt = [X(run * 0.45), rakeY(run * 0.45)];
    const b: Pt = [X(steps * run), rakeY(steps * run)];
    const c2: Pt = [X(steps * run + landing), b[1]];
    addPolyWound(solid, [[a[0], a[1] - hr], [b[0], b[1] - hr], [c2[0], c2[1] - hr], [c2[0], c2[1]], [b[0], b[1]], [a[0], a[1]]]);
    rims.moveTo(a[0], a[1] - hr);
    rims.lineTo(b[0], b[1] - hr);
    rims.lineTo(c2[0], c2[1] - hr);
    if (o.newel ?? true) {
      // starting newel with a finial, and a landing newel
      const nh = y - a[1] + rise * 0.8;
      placeTurning(solid, turning('newel', nh, Math.max(10, run * 0.42)), X(run * 0.4), y + 0.5);
      placeTurning(solid, turning('finial', rise * 1.5, run * 0.36), X(run * 0.4), y - nh + 1);
      const lh = topY - c2[1] + hr + rise * 0.7;
      placeTurning(solid, turning('newel', lh, Math.max(9, run * 0.38)), X(steps * run + landing - pw / 2), topY + 0.5);
      placeTurning(solid, turning('finialAcorn', rise * 1.1, run * 0.3), X(steps * run + landing - pw / 2), topY - lh + 1);
    }
  }
  return { solid, spandrel, panels, rims };
}

export const staircase: Painter<StaircaseOpts> = (c, o, env) => {
  const g = memo(stairCache, keyOf(o), () => buildStair(o), 40);
  const base = env.fill(o.role ?? 'set');
  if (!o.open) {
    c.fillStyle = mixLab(base, env.mood.haze, 0.16);
    c.fill(g.spandrel);
    strokeCuts(c, g.panels, cutColor(env, 0.22), 1);
  }
  c.fillStyle = base;
  c.fill(g.solid);
  strokeCuts(c, g.rims, cutColor(env, 0.55), 1.4);
};

// ---------------------------------------------------------------------------
// lecture hall
// ---------------------------------------------------------------------------
export interface BlackboardWallOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  boards?: number;
  boardTop?: number;
  boardH?: number;
  chalk?: 'scribble' | 'network' | 'none';
  /** clerestory window count (holes high in the wall) */
  clerestory?: number;
  seed?: number;
  role?: FillRole;
}
export function blackboardRects(o: BlackboardWallOpts): [number, number, number, number][] {
  const n = o.boards ?? 3;
  const top = o.boardTop ?? o.y + o.h * 0.42;
  const bh = o.boardH ?? o.h * 0.36;
  const margin = o.w * 0.06;
  const gap = o.w * 0.012;
  const bw = (o.w - 2 * margin - (n - 1) * gap) / n;
  return Array.from({ length: n }, (_, i) => [o.x + margin + i * (bw + gap), top, bw, bh] as [number, number, number, number]);
}
const bbCache = new Map<string, { wall: Path2D; frames: Path2D; slate: Path2D; chalk: Path2D; cuts: Path2D }>();
export const blackboardWall: Painter<BlackboardWallOpts> = (c, o, env) => {
  const g = memo(bbCache, keyOf(o), () => {
    const R = rng(o.seed ?? 5, 3);
    const wall = new Path2D();
    const frames = new Path2D();
    const slate = new Path2D();
    const chalk = new Path2D();
    const cuts = new Path2D();
    addRect(wall, o.x, o.y, o.w, o.h);
    const nc = o.clerestory ?? 5;
    if (nc > 0) {
      const ww = (o.w / nc) * 0.55;
      for (let i = 0; i < nc; i++) {
        const cx = o.x + (o.w * (i + 0.5)) / nc;
        const geo = windowGeom({ cx, w: ww, apex: o.y + o.h * 0.06, sill: o.y + o.h * 0.3, shape: 'segmental', lights: 3, panes: { cols: 2, rows: 3 }, tracery: 'none', hood: true });
        wall.addPath(geo.holes);
        frames.addPath(geo.bars);
        cuts.addPath(geo.mould);
      }
    }
    for (const [bx, by, bw, bh] of blackboardRects(o)) {
      const f = Math.max(5, bh * 0.035);
      addRect(frames, bx - f, by - f, bw + 2 * f, bh + 2 * f);
      addRect(frames, bx, by, bw, bh, true);
      addRect(frames, bx - f * 1.4, by + bh + f, bw + f * 2.8, f * 0.9); // chalk tray
      addRect(slate, bx, by, bw, bh);
      if (o.chalk === 'network') {
        const layers = [3, 4, 4, 2];
        const nodes: Pt[][] = layers.map((n, li) => Array.from({ length: n }, (_, k) => [bx + bw * (0.15 + (0.7 * li) / (layers.length - 1)), by + bh * (0.5 + (k - (n - 1) / 2) * 0.2)] as Pt));
        for (let li = 0; li < layers.length - 1; li++) {
          for (const a of nodes[li]) for (const b of nodes[li + 1]) {
            chalk.moveTo(a[0], a[1]);
            chalk.lineTo(b[0], b[1]);
          }
        }
        for (const row of nodes) for (const [nx, ny] of row) {
          chalk.moveTo(nx + bh * 0.045, ny);
          chalk.arc(nx, ny, bh * 0.045, 0, Math.PI * 2);
        }
      } else if (o.chalk !== 'none') {
        // lines of handwriting-like loops and the odd underline/box
        const lines = 5;
        for (let l = 0; l < lines; l++) {
          let lx = bx + bw * (0.06 + R() * 0.05);
          const ly = by + bh * (0.16 + (0.74 * l) / lines);
          const end = bx + bw * (0.5 + R() * 0.42);
          chalk.moveTo(lx, ly);
          while (lx < end) {
            const wl = 6 + R() * 20;
            for (let k = 0; k < wl; k += 2) {
              const xx = lx + k;
              chalk.lineTo(xx, ly - Math.abs(Math.sin(xx * 0.9 + l)) * bh * 0.035 * (0.6 + R() * 0.6));
            }
            lx += wl + 5 + R() * 6;
            chalk.moveTo(lx, ly);
          }
          if (R() < 0.3) {
            chalk.moveTo(bx + bw * 0.06, ly + bh * 0.03);
            chalk.lineTo(end, ly + bh * 0.03);
          }
        }
      }
    }
    cuts.moveTo(o.x, o.y + o.h * 0.36);
    cuts.lineTo(o.x + o.w, o.y + o.h * 0.36);
    return { wall, frames, slate, chalk, cuts };
  });
  const base = env.fill(o.role ?? 'set');
  c.fillStyle = base;
  c.fill(g.wall, 'evenodd');
  c.fillStyle = mixLab(base, env.mood.fg, 0.45);
  c.fill(g.slate);
  c.fillStyle = mixLab(base, env.mood.fg, 0.15);
  c.fill(g.frames, 'evenodd');
  strokeCuts(c, g.chalk, withAlpha(env.mood.rim, 0.42 * (1 - env.layer.haze * 0.6)), 1.3);
  strokeCuts(c, g.cuts, cutColor(env, 0.16), 1);
};

export interface TieredSeatingOpts {
  x0: number;
  x1: number;
  /** y of the lowest (farthest) desk top */
  y: number;
  tiers: number;
  tierH?: number;
  role?: FillRole;
}
export const tieredSeating: Painter<TieredSeatingOpts> = (c, o, env) => {
  const p = memoPath(`tiers${keyOf(o)}`, () => {
    const q = new Path2D();
    const th = o.tierH ?? 46;
    for (let i = 0; i < o.tiers; i++) {
      const y = o.y + i * th * 0.6 - i * i * 2;
      const k = 1 + i * 0.22;
      // desk top lip and front panel
      addRect(q, o.x0, y, o.x1 - o.x0, 5 * k);
      addRect(q, o.x0, y + 5 * k, o.x1 - o.x0, th * k);
      // the backs of the bench seats peeking above each desk (rounded backrests)
      // folding seat backs above each desk, in pairs with an aisle gap, staggered row to row
      const pitch = 64 * k;
      let n = 0;
      for (let x = o.x0 + pitch * (0.5 + (i % 2) * 0.5); x < o.x1; x += pitch, n++) {
        if (n % 7 === 6) continue;
        const bw = pitch * 0.66;
        q.roundRect(x - bw / 2, y - 26 * k, bw, 28 * k, [7 * k, 7 * k, 0, 0]);
        addRect(q, x - bw * 0.42, y - 30 * k, bw * 0.84, 4 * k);
      }
    }
    addRect(q, o.x0, o.y + o.tiers * (o.tierH ?? 46) * 0.6, o.x1 - o.x0, 800);
    return q;
  });
  c.fillStyle = env.fill(o.role ?? 'fg');
  c.fill(p);
  const cuts = memoPath(`tiercuts${keyOf(o)}`, () => {
    const q = new Path2D();
    const th = o.tierH ?? 46;
    for (let i = 0; i < o.tiers; i++) {
      const y = o.y + i * th * 0.6 - i * i * 2;
      const k = 1 + i * 0.22;
      q.moveTo(o.x0, y + 5.5 * k);
      q.lineTo(o.x1, y + 5.5 * k);
      for (let x = o.x0 + 90 * k; x < o.x1; x += 180 * k) q.rect(x, y + 12 * k, 120 * k, th * k * 0.5);
    }
    return q;
  });
  strokeCuts(c, cuts, cutColor(env, 0.16), 1.2);
  void shadeColor;
  void addCircle;
  void arch;
};
