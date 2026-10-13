/**
 * ch08-s05 — the cathedral of stencils (AlexNet, Krizhevsky, Sutskever & Hinton 2012), built for this shot because
 * the kit's alexnetCathedral has no rose-window vignettes, no great halls of lanterns and no band of a thousand.
 * True shapes (paper, Fig. 2): five stencil courses whose face widths are 55, 27, 13, 13, 13 (× 8 px), two great
 * halls of 4,096 lanterns each (fc6, fc7; drawn as 32 lanterns each, every one threaded to every one below), and a
 * last hall of 1,000 small lanterns, one per category (fc8, the output; nothing above it).
 *
 * GEOGRAPHY (L4 world; ground y 640, axis x 640):
 *   plinth        x 380–900, y 480–640, the ROSE WINDOW at (640, 560): the photograph (r 48) in a ring of 96 tiles
 *   courses       conv1 y 410–480 (w 440) · conv2 350–410 (216) · conv3 300–350 · conv4 250–300 · conv5 200–250 (104)
 *   towers        x 640 ± 262 (w 46), ground → y 70, pinnacles above
 *   halls         fc6 y 146–188, fc7 y 96–138, spanning tower to tower (x 410–870)
 *   crown         the band of 1,000 small lit lanterns, y 46–86 (100 × 10), each with a tag tick, between the tower tops
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { hash1 } from '../../../film/core/frame';
import { huskyCanvas, tileArt } from './ch08-s01-kit';

type C = CanvasRenderingContext2D;
export const CAT = {
  ground: 640,
  cx: 640,
  rose: { x: 640, y: 560, r: 48 },
  plinth: { y: 480 },
  towerDX: 262,
  towerW: 46,
  towerTop: 70,
};
export const COURSES = [
  { id: 'conv1', hw: 55, y0: 410, y1: 480, cols: 22, rows: 3 },
  { id: 'conv2', hw: 27, y0: 350, y1: 410, cols: 11, rows: 3 },
  { id: 'conv3', hw: 13, y0: 300, y1: 350, cols: 5, rows: 2 },
  { id: 'conv4', hw: 13, y0: 250, y1: 300, cols: 5, rows: 2 },
  { id: 'conv5', hw: 13, y0: 200, y1: 250, cols: 5, rows: 2 },
].map((c) => ({ ...c, w: c.hw * 8 }));
export const HALLS = [
  { id: 'fc6', y0: 146, y1: 188, n: 32 },
  { id: 'fc7', y0: 96, y1: 138, n: 32 },
];
export const CROWN = { y0: 46, y1: 86, cols: 100, rows: 10 };
const HX0 = CAT.cx - CAT.towerDX + CAT.towerW / 2 + 6;
const HX1 = CAT.cx + CAT.towerDX - CAT.towerW / 2 - 6;
export const hallLantern = (h: number, i: number) => ({ x: HX0 + 14 + ((HX1 - HX0 - 28) * (i + 0.5)) / HALLS[h].n, y: (HALLS[h].y0 + HALLS[h].y1) / 2 + 2 });

export interface CathedralState {
  /** 0..1 build of each course (conv1..conv5), each hall (fc6, fc7), the crown */
  course: number[];
  hall: number[];
  crown: number;
  /** 0..1 the 96 first-layer tiles on the rose window */
  tiles: number;
  /** light level of each stage (conv1..5, fc6, fc7, fc8): windows, lanterns */
  lit: number[];
  /** threads: the alpha of each thread (≈ 0.12 as they flash up on 'every', settling to 0.06) */
  threads: number;
  /** optional: a FAN of ≈ 50 brighter threads per hall (a subset of the all-pairs threads, alpha `fan`), drawn
   *  over the faint all-pairs sheet so 'every lantern sees everything' reads as lines, not a haze (ch08-s05) */
  fan?: number;
  /** 'stencilling': 0..1 a column of bright cells in each course lifts straight up into the next course's arches,
   *  which light in response, one course after another; 1..2 the lit columns fade */
  feed: number;
  /** the course the feed's climb starts from (default 0); ch08-s05 starts it at 1, after the stencilling close-up */
  feedFrom?: number;
  /** 'stencilling' close-up (ch08-s05): 0..1 a 3 × 3 cluster of course 1's bright spots lifts, ghosted, onto course 2's
   *  face as a small lit pattern (0–0.42); one course-2 stencil tile slides across it in three steps on twos
   *  (0.42–0.8) and, matched, the course-2 cell above lights (0.8–1); 1..2 the pattern fades as the light climbs */
  stencil?: number;
  /** pooling marks: a rim-coloured 3 × 3 frame SNAPS across course k-1 in `steps` positions (u 0..1 over `dur`
   *  seconds) while course k rises; the cell it keeps flashes core for one 'two' at each snap. `mag` draws the frame
   *  and its nine cells magnified about the window's centre (a loupe), so 'keep the brightest' reads */
  pool: { k: number; u: number; steps?: number; dur?: number; mag?: number } | null;
  /** the rose-window vignette: kind and strength (0 = the photograph) */
  vignette: { kind: 'strokes' | 'textures' | 'parts' | 'things' | null; k: number };
  t: number;
}

// ------------------------------------------------------------------------------------------------ plinth piercings
/** a slender lancet hole inside each blind-arcade niche (niches at x 390 + 36k, w 28, as ch08-s06 relies on) and a
 *  row of quatrefoils above the arcade */
const PLINTH_HOLES: Path2D = (() => {
  const p = new Path2D();
  const P = CAT.rose;
  const top = CAT.plinth.y;
  for (let k = 0; k < 14; k++) {
    const ax = CAT.cx - 250 + k * 36;
    if (Math.abs(ax + 14 - P.x) < P.r + 44) continue;
    const lx = ax + 9, lw = 10;
    p.moveTo(lx, CAT.ground - 26);
    p.lineTo(lx, top + 58);
    p.quadraticCurveTo(lx + lw / 2, top + 44, lx + lw, top + 58);
    p.lineTo(lx + lw, CAT.ground - 26);
    p.closePath();
    // a quatrefoil over each niche
    const qx = ax + 14, qy = top + 22;
    for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) {
      p.moveTo(qx + dx + 2.6, qy + dy);
      p.arc(qx + dx, qy + dy, 2.6, 0, Math.PI * 2);
    }
  }
  return p;
})();

// ------------------------------------------------------------------------------------------------ helpers
const act = (k: number, i: number, j: number) => {
  const h = hash1(k * 977 + j * 61 + i, 551);
  return h > 0.62 ? 0.45 + 0.55 * h : 0.12 * h;
};

/** a slender crocketed pinnacle standing on (x, y): shaft, gablet, spirelet, finial */
function pinnacle(c: C, x: number, y: number, h: number, w = 8) {
  c.fillRect(x - w / 2, y - h * 0.45, w, h * 0.45 + 1);
  c.beginPath();
  c.moveTo(x - w / 2 - 1.5, y - h * 0.45);
  c.lineTo(x, y - h);
  c.lineTo(x + w / 2 + 1.5, y - h * 0.45);
  c.closePath();
  c.fill();
  // crockets: little hooks up the spirelet's edges
  for (let k = 1; k <= 3; k++) {
    const u = k / 4.2;
    const yy = y - h * 0.45 - (h * 0.55) * u;
    const dx = (w / 2 + 1.5) * (1 - u);
    c.fillRect(x - dx - 2.4, yy - 1, 2.6, 2);
    c.fillRect(x + dx - 0.2, yy - 1, 2.6, 2);
  }
  c.beginPath();
  c.arc(x, y - h - 1.6, 1.8, 0, Math.PI * 2);
  c.fill();
}
/** the height grade (aerial perspective of a tall façade): low stone darkest, upper stone toward the haze */
const grade = (env: PaintEnv, u: number) => mixLab(mixLab(env.fill('ink'), env.mood.set, 0.18), env.mood.setHaze, 0.32 * u);
/** u (0 at the ground, 1 at the crown) for a world y */
const gradeU = (y: number) => Math.max(0, Math.min(1, (CAT.ground - y) / (CAT.ground - CROWN.y0)));

// ------------------------------------------------------------------------------------------------ the façade
export function cathedral(c: C, env: PaintEnv, s: CathedralState) {
  const m = env.mood;
  const ink = env.fill('ink');
  const G = CAT.ground;
  // ---- towers (ground to the crown), graded with height, stepped buttresses with pinnacles on every set-off,
  // lancet slits and the spire
  for (const sx of [-1, 1]) {
    const x = CAT.cx + sx * CAT.towerDX - CAT.towerW / 2;
    const tg = c.createLinearGradient(0, G, 0, CAT.towerTop - 64);
    tg.addColorStop(0, grade(env, 0));
    tg.addColorStop(1, grade(env, 0.9));
    c.fillStyle = tg;
    c.fillRect(x, CAT.towerTop, CAT.towerW, G - CAT.towerTop);
    // the outer buttress: three stages, each set back with a sloped weathering and a pinnacle on the set-off
    const outer = sx < 0 ? x : x + CAT.towerW;
    const stages = [
      { y0: 470, y1: G, d: 30 },
      { y0: 300, y1: 470, d: 19 },
      { y0: 170, y1: 300, d: 9 },
    ];
    for (const st of stages) {
      const bx = sx < 0 ? outer - st.d : outer;
      c.fillRect(bx, st.y0, st.d, st.y1 - st.y0);
      c.beginPath();
      c.moveTo(sx < 0 ? outer - st.d : outer + st.d, st.y0);
      c.lineTo(outer, st.y0 - st.d * 0.9);
      c.lineTo(outer, st.y0);
      c.closePath();
      c.fill();
      pinnacle(c, sx < 0 ? outer - st.d + 4 : outer + st.d - 4, st.y0 + 1, 26 + st.d * 0.4, 6);
    }
    // string courses across the tower face
    c.fillRect(x - 3, 300, CAT.towerW + 6, 6);
    c.fillRect(x - 3, 470, CAT.towerW + 6, 7);
    c.fillStyle = tg;
    c.beginPath();
    c.moveTo(x - 4, CAT.towerTop);
    c.lineTo(x + CAT.towerW / 2, CAT.towerTop - 64);
    c.lineTo(x + CAT.towerW + 4, CAT.towerTop);
    c.closePath();
    c.fill();
    for (const px of [x - 2, x + CAT.towerW + 2]) pinnacle(c, px, CAT.towerTop + 4, 30, 7);
    // slits that catch the dawn
    c.fillStyle = withAlpha(m.halo, 0.35);
    for (let y = 120; y < 600; y += 46) {
      c.beginPath();
      c.moveTo(x + 18, y + 26);
      c.lineTo(x + 18, y + 6);
      c.quadraticCurveTo(x + 23, y, x + 28, y + 6);
      c.lineTo(x + 28, y + 26);
      c.closePath();
      c.fill();
    }
  }
  // ---- plinth with the rose window hole (the photograph shows through it)
  const P = CAT.rose;
  const pl = new Path2D();
  pl.rect(CAT.cx - 260, CAT.plinth.y, 520, G - CAT.plinth.y);
  pl.moveTo(P.x + P.r + 30, P.y);
  pl.arc(P.x, P.y, P.r + 30, 0, Math.PI * 2);
  // the slab is pierced: a slender lancet in every blind-arcade niche and a row of quatrefoils over the arcade, so
  // the dawn shows through the lower façade (holes, evenodd: the backlight and the far hills read through them)
  pl.addPath(PLINTH_HOLES);
  c.fillStyle = ink;
  c.fill(pl, 'evenodd');
  c.fillRect(CAT.cx - 280, G - 10, 560, 10);
  c.fillRect(CAT.cx - 270, CAT.plinth.y - 6, 540, 7);
  // blind arcade on the plinth
  c.strokeStyle = withAlpha(m.rim, 0.14);
  c.lineWidth = 1;
  c.beginPath();
  for (let k = 0; k < 14; k++) {
    const ax = CAT.cx - 250 + k * 36;
    if (Math.abs(ax + 14 - P.x) < P.r + 44) continue;
    c.moveTo(ax, G - 14);
    c.lineTo(ax, CAT.plinth.y + 40);
    c.quadraticCurveTo(ax + 14, CAT.plinth.y + 18, ax + 28, CAT.plinth.y + 40);
    c.lineTo(ax + 28, G - 14);
  }
  c.stroke();
  roseWindow(c, env, s);
  // ---- the five courses: graded with height, a gablet parapet on each, a pierced quatrefoil string course at the
  // foot, crocketed pinnacles on both ends
  COURSES.forEach((co, k) => {
    const b = s.course[k];
    if (b <= 0.001) return;
    const lift = (1 - b) * 26;
    const x0 = CAT.cx - co.w / 2;
    const y0 = co.y0 + lift;
    const stone = grade(env, gradeU((co.y0 + co.y1) / 2));
    c.save();
    c.globalAlpha *= Math.min(1, b * 1.6);
    c.fillStyle = stone;
    const body = new Path2D();
    body.rect(x0, y0, co.w, co.y1 - co.y0);
    body.rect(x0 - 6, co.y1 - 7 + lift, co.w + 12, 8);
    // quatrefoil piercings in the string course
    for (let qx = x0 + 9; qx < x0 + co.w - 6; qx += 15) {
      const qy = co.y1 - 3 + lift;
      for (const [dx, dy] of [[-1.5, 0], [1.5, 0], [0, -1.5], [0, 1.5]]) {
        body.moveTo(qx + dx + 1.4, qy + dy);
        body.arc(qx + dx, qy + dy, 1.4, 0, Math.PI * 2);
      }
    }
    c.fill(body, 'evenodd');
    // the gablet parapet along the top
    c.beginPath();
    for (let gx = x0 + 6; gx + 12 <= x0 + co.w - 4; gx += 14) {
      c.moveTo(gx, y0 + 1);
      c.lineTo(gx + 6, y0 - 8);
      c.lineTo(gx + 12, y0 + 1);
    }
    c.fill();
    // corner pinnacles
    for (const px of [x0 - 2, x0 + co.w + 2]) pinnacle(c, px, y0 + 4, 34 - k * 2, 8);
    // lancet windows: the course's bright spots (real-looking variety, seeded), lit by the flow
    const pw = (co.w - 8) / co.cols;
    const ph = (co.y1 - co.y0 - 10) / co.rows;
    const L = s.lit[k];
    for (let j = 0; j < co.rows; j++)
      for (let i = 0; i < co.cols; i++) {
        const a = act(k, i, j);
        const v = Math.min(1, 0.12 + L * a);
        const wx = x0 + 4 + i * pw + pw * 0.2, wy = y0 + 5 + j * ph + ph * 0.12;
        const ww = pw * 0.6, wh = ph * 0.76;
        c.fillStyle = mixLab(mixLab(m.set, m.ink, 0.2), m.core, v);
        c.beginPath();
        c.moveTo(wx, wy + wh);
        c.lineTo(wx, wy + ww * 0.5);
        c.quadraticCurveTo(wx + ww / 2, wy - ww * 0.3, wx + ww, wy + ww * 0.5);
        c.lineTo(wx + ww, wy + wh);
        c.closePath();
        c.fill();
      }
    c.restore();
    if (s.lit[k] > 0.05) glow(c, CAT.cx, (co.y0 + co.y1) / 2, co.w * 0.6 + 40, m.halo, 0.12 * s.lit[k]);
  });
  // ---- pooling: a 3 × 3 frame snaps across the lower course (on twos) and keeps its brightest cell
  if (s.pool && s.pool.k > 0) poolFrame(c, env, s.pool);
  // ---- 'stencilling': a column of bright cells lifts straight up into the next course, which lights in response
  if (s.stencil !== undefined && s.stencil > 0 && s.stencil < 2.2) stencilLift(c, env, s.stencil);
  if (s.feed > 0 && s.feed < 2) feedUp(c, env, s.feed, s.feedFrom ?? 0);
  // ---- the two great halls: arcades of 32 lanterns spanning tower to tower
  HALLS.forEach((h, k) => {
    const b = s.hall[k];
    if (b <= 0.001) return;
    const lift = (1 - b) * 22;
    c.save();
    c.globalAlpha *= Math.min(1, b * 1.6);
    c.fillStyle = grade(env, gradeU((h.y0 + h.y1) / 2));
    // the hall is built INTO the stone: its ends run into the towers on corbel brackets, and short piers stand it
    // on what is below (the 13-tower's top for fc6, fc6 for fc7), so it never floats
    const TI0 = CAT.cx - CAT.towerDX + CAT.towerW / 2, TI1 = CAT.cx + CAT.towerDX - CAT.towerW / 2;
    c.fillRect(TI0, h.y0 + lift, HX0 - TI0, h.y1 - h.y0);
    c.fillRect(HX1, h.y0 + lift, TI1 - HX1, h.y1 - h.y0);
    for (const [ex, dir] of [[TI0, 1], [TI1, -1]] as const) {
      c.beginPath();
      c.moveTo(ex, h.y1 + lift);
      c.lineTo(ex + dir * 34, h.y1 + lift);
      c.quadraticCurveTo(ex + dir * 10, h.y1 + 6 + lift, ex, h.y1 + 26 + lift);
      c.closePath();
      c.fill();
    }
    const below = k === 0 ? COURSES[4].y0 : HALLS[0].y0;
    const piers = k === 0 ? [CAT.cx - 44, CAT.cx - 14, CAT.cx + 14, CAT.cx + 44] : Array.from({ length: 9 }, (_, a) => HX0 + ((HX1 - HX0) * a) / 8);
    for (const px of piers) c.fillRect(px - 3, h.y1 + lift - 1, 6, below - h.y1 + 2);
    if (k === 0) {
      // a pierced arcade on the 13-tower's top carries fc6
      c.fillRect(CAT.cx - 56, below - 7 + lift * 0, 112, 8);
    }
    c.fillRect(HX0 - 6, h.y1 - 5 + lift, HX1 - HX0 + 12, 7);
    c.fillRect(HX0 - 6, h.y0 + lift, HX1 - HX0 + 12, 5);
    // arcade piers and drip arches
    const n = 8;
    for (let a = 0; a <= n; a++) c.fillRect(HX0 + ((HX1 - HX0) * a) / n - 2, h.y0 + lift, 4, h.y1 - h.y0);
    c.beginPath();
    for (let a = 0; a < n; a++) {
      const ax = HX0 + ((HX1 - HX0) * a) / n, bx = HX0 + ((HX1 - HX0) * (a + 1)) / n;
      c.moveTo(ax, h.y0 + 5 + lift);
      c.quadraticCurveTo((ax + bx) / 2, h.y0 + 22 + lift, bx, h.y0 + 5 + lift);
      c.lineTo(bx, h.y0 + 5 + lift);
    }
    c.fill();
    const L = s.lit[5 + k];
    for (let i = 0; i < h.n; i++) {
      const p = hallLantern(k, i);
      const a = 0.35 + 0.65 * hash1(k * 101 + i, 581);
      const v = Math.min(1, 0.1 + L * a);
      c.fillStyle = mixLab(mixLab(m.set, m.ink, 0.1), m.core, v);
      c.beginPath();
      c.ellipse(p.x, p.y + lift, 4.6, 6.6, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    if (L > 0.05) glow(c, CAT.cx, (h.y0 + h.y1) / 2, 260, m.halo, 0.1 * L);
  });
  // ---- every lantern sees everything: fc6 ← conv5 top, fc7 ← fc6, all pairs
  if (s.threads > 0.002) threadsAll(c, env, s.threads, s.lit);
  if ((s.fan ?? 0) > 0.003) threadsFan(c, env, s.fan!, s.lit);
  // ---- the crown: a band of 1,000 small lanterns, one per category
  if (s.crown > 0.001) crownBand(c, env, s);
}

const cellOf = (k: number) => {
  const co = COURSES[k];
  const pw = (co.w - 8) / co.cols;
  const ph = (co.y1 - co.y0 - 10) / co.rows;
  const x0 = CAT.cx - co.w / 2 + 4;
  return { co, pw, ph, x0, cx: (i: number) => x0 + (i + 0.5) * pw, cy: (j: number) => co.y0 + 5 + j * ph + ph * 0.5 };
};
/** a lancet window (the same arch the courses cut), filled */
function lancet(c: C, cx: number, cy: number, pw: number, ph: number) {
  const ww = pw * 0.6, wh = ph * 0.76;
  const wx = cx - ww / 2, wy = cy - ph * 0.5 + ph * 0.12;
  c.beginPath();
  c.moveTo(wx, wy + wh);
  c.lineTo(wx, wy + ww * 0.5);
  c.quadraticCurveTo(wx + ww / 2, wy - ww * 0.3, wx + ww, wy + ww * 0.5);
  c.lineTo(wx + ww, wy + wh);
  c.closePath();
  c.fill();
}

/** POOLING: a rim-coloured 3 × 3 frame (≈ 2-3 px at 1080p) snaps across the lower course in `steps` positions;
 *  on each snap the cell it keeps (the brightest of its nine) flashes core for one 'two', then stays marked */
function poolFrame(c: C, env: PaintEnv, p: { k: number; u: number; steps?: number; dur?: number; mag?: number }) {
  const m = env.mood;
  const steps = p.steps ?? 5;
  const dur = p.dur ?? 0.85;
  const k0 = p.k - 1;
  const L = cellOf(k0);
  const rows = Math.min(3, L.co.rows);
  const u = Math.max(0, Math.min(0.9999, p.u));
  const step = Math.floor(u * steps);
  const since = (u * steps - step) * (dur / steps);
  const pos = Math.round((step * (L.co.cols - 3)) / Math.max(1, steps - 1));
  const fx = L.x0 + pos * L.pw;
  const fy = L.co.y0 + 5;
  const fw = 3 * L.pw, fh = rows * L.ph;
  let bi = 0, bj = 0, bv = -1;
  for (let j = 0; j < rows; j++) for (let i = 0; i < 3; i++) if (act(k0, pos + i, j) > bv) { bv = act(k0, pos + i, j); bi = i; bj = j; }
  const fade = Math.min(1, (1 - u) * steps * 1.5, u * steps * 4 + 0.3);
  c.save();
  const mag = p.mag ?? 1;
  if (mag !== 1) {
    // the loupe: the window and its nine cells drawn magnified about the window's centre, on a dark backing, so the
    // nine values and the one kept read at a glance
    const mx = fx + fw / 2, my = fy + fh / 2;
    c.translate(mx, my);
    c.scale(mag, mag);
    c.translate(-mx, -my);
    c.fillStyle = withAlpha(mixLab(m.ink, '#000000', 0.25), 0.88 * fade);
    c.fillRect(fx - 2, fy - 2, fw + 4, fh + 4);
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < 3; i++) {
        const v = Math.min(1, 0.14 + 0.62 * act(k0, pos + i, j));
        c.fillStyle = withAlpha(mixLab(mixLab(m.set, m.ink, 0.2), m.core, v), fade);
        lancet(c, L.cx(pos + i), L.cy(j), L.pw, L.ph);
      }
  }
  // the kept cell: core for one 'two' after the snap, then a steady marked cell
  const flash = since < 1 / 12 ? 1 : 0;
  c.fillStyle = withAlpha(m.core, (0.45 + 0.55 * flash) * fade);
  lancet(c, L.cx(pos + bi), L.cy(bj), L.pw * 1.15, L.ph * 1.05);
  if (flash) glow(c, L.cx(pos + bi), L.cy(bj), 14, m.core, 0.8 * fade);
  // the frame and its two inner rules each way
  c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.25), 0.95 * fade);
  c.lineWidth = 1.3 / Math.sqrt(mag);
  c.strokeRect(fx, fy, fw, fh);
  c.lineWidth = 0.5 / Math.sqrt(mag);
  c.strokeStyle = withAlpha(m.rim, 0.55 * fade);
  c.beginPath();
  for (let q = 1; q < 3; q++) {
    c.moveTo(fx + q * L.pw, fy);
    c.lineTo(fx + q * L.pw, fy + fh);
  }
  for (let q = 1; q < rows; q++) {
    c.moveTo(fx, fy + q * L.ph);
    c.lineTo(fx + fw, fy + q * L.ph);
  }
  c.stroke();
  c.restore();
}

/** the column each course hands up (in the UPPER course's columns), staggered so the climb zig-zags up the tower */
const FEED_COL = [6, 1, 3, 2];
/**
 * 'each stencilling the one below': course by course (0.25 of `feed` each), a column of bright cells in course k
 * brightens, lifts STRAIGHT up into course k+1's arches, and those arches light in response; after feed 1 the lit
 * columns fade out by feed 2.
 */
function feedUp(c: C, env: PaintEnv, feed: number, from = 0) {
  const m = env.mood;
  const out = 1 - Math.max(0, Math.min(1, (feed - 1.2) / 0.8));
  const n0 = 4 - from;
  c.save();
  for (let k = from; k < 4; k++) {
    const u = Math.max(0, Math.min(1, Math.min(feed, 1) * n0 - (k - from)));
    if (u <= 0) continue;
    const lo = cellOf(k), hi = cellOf(k + 1);
    const hc = FEED_COL[k];
    const hx = hi.cx(hc);
    const li = Math.max(0, Math.min(lo.co.cols - 1, Math.round((hx - lo.x0) / lo.pw - 0.5)));
    const lx = lo.cx(li);
    const n = lo.co.rows;
    // 1. the source column brightens
    const src = u < 0.25 ? u / 0.25 : 0.55;
    c.fillStyle = withAlpha(m.core, Math.min(1, src) * out);
    for (let j = 0; j < n; j++) lancet(c, lx, lo.cy(j), lo.pw, lo.ph);
    // 2. its cells lift straight up (a faint rim trail behind them)
    if (u >= 0.25 && u < 0.8) {
      const v = Math.min(1, (u - 0.25) / 0.5);
      const e = v * v * (3 - 2 * v);
      c.strokeStyle = withAlpha(m.rim, 0.45);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(lx, lo.cy(0));
      c.lineTo(lx + (hx - lx) * e, lo.cy(0) + (hi.cy(hi.co.rows - 1) - lo.cy(0)) * e);
      c.stroke();
      for (let j = 0; j < n; j++) {
        const tj = Math.min(hi.co.rows - 1, j);
        const x = lx + (hx - lx) * e;
        const y = lo.cy(j) + (hi.cy(tj) - lo.cy(j)) * e;
        c.fillStyle = withAlpha(m.core, 0.95);
        c.fillRect(x - lo.pw * 0.26, y - lo.ph * 0.3, lo.pw * 0.52, lo.ph * 0.6);
        glow(c, x, y, 10, m.core, 0.5);
      }
    }
    // 3. the upper course's arches in that column light in response (and stay lit while the climb goes on)
    if (u >= 0.7) {
      const r = Math.min(1, (u - 0.7) / 0.2) * out;
      c.fillStyle = withAlpha(m.core, r);
      for (let j = 0; j < hi.co.rows; j++) lancet(c, hx, hi.cy(j), hi.pw, hi.ph);
      glow(c, hx, (hi.co.y0 + hi.co.y1) / 2, 22, m.core, 0.55 * r);
    }
  }
  c.restore();
}

/** the close-up's 3 × 3 cluster of course 1 (under course 2's FEED_COL[0] column) and its bright spots: a diagonal
 *  stroke (illustrative) — the course-2 stencil that matches it is a tin square with its diagonal cut open */
const STENCIL_MASK = (() => {
  const lo = cellOf(0), hi = cellOf(1);
  const hx = hi.cx(FEED_COL[0]);
  const li0 = Math.max(0, Math.min(lo.co.cols - 3, Math.round((hx - lo.x0) / lo.pw - 0.5) - 1));
  const v = [1, 0.12, 0.22, 0.12, 1, 0.16, 0.2, 0.14, 1];
  const m = v.map((x) => (x > 0.5 ? 1 : 0));
  return { li0, v, m };
})();
/**
 * 'each stencilling the one below', in close-up (ch08-s05): a 3 × 3 cluster of course 1's bright spots brightens and
 * lifts, ghosted, onto course 2's face, landing as a small lit pattern; one course-2 stencil tile (a tin square with
 * three open cells on its diagonal and the pattern's other bright cells) slides across it in three steps on twos;
 * matched, the light shows through its holes and the course-2 arches above it light. u 0..1 (see CathedralState),
 * 1..2.2 it fades as the light climbs on.
 */
function stencilLift(c: C, env: PaintEnv, u: number) {
  const m = env.mood;
  const lo = cellOf(0), hi = cellOf(1);
  const hc = FEED_COL[0];
  const hx = hi.cx(hc), hy = hi.cy(1);
  const { li0, v: val, m: mask } = STENCIL_MASK;
  const q = 15; // the landed pattern's pitch (world px): ≈ 60 px wide on screen, legible in the tilt-up framing
  const out = 1 - Math.max(0, Math.min(1, (u - 1.4) / 0.8));
  const sm3 = (x0: number) => { const x = Math.max(0, Math.min(1, x0)); return x * x * (3 - 2 * x); };
  c.save();
  // 1. course 1's cluster shows its bright spots (0 → 0.1): a diagonal stroke of three lit cells
  const src = Math.min(1, u / 0.1) * (u < 0.42 ? 1 : 0.4) * out;
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < 3; i++) {
      c.fillStyle = withAlpha(m.core, src * val[j * 3 + i]);
      lancet(c, lo.cx(li0 + i), lo.cy(j), lo.pw, lo.ph);
      if (val[j * 3 + i] > 0.5) glow(c, lo.cx(li0 + i), lo.cy(j), 12, m.core, 0.5 * src);
    }
  // 2. the ghost cluster lifts (0.08 → 0.4) onto course 2's face and lands there as a small lit picture
  const lift = sm3((u - 0.08) / 0.32);
  // 4. (later) the stencil, matched, lifts away and course 2's cell lights: the pattern dims as it does
  const done = sm3((u - 0.9) / 0.12);
  if (u >= 0.08) {
    const ground = sm3((u - 0.28) / 0.12) * out;
    if (ground > 0) {
      c.fillStyle = withAlpha(mixLab(m.ink, '#000000', 0.3), 0.9 * ground);
      c.fillRect(hx - q * 1.7, hy - q * 1.7, q * 3.4, q * 3.4);
    }
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < 3; i++) {
        const a = val[j * 3 + i];
        const x = lo.cx(li0 + i) + (hx + (i - 1) * q - lo.cx(li0 + i)) * lift;
        const y = lo.cy(j) + (hy + (j - 1) * q - lo.cy(j)) * lift;
        const sz = lo.pw * 0.55 + (q * 0.66 - lo.pw * 0.55) * lift;
        c.fillStyle = withAlpha(mixLab(m.halo, m.core, 0.6), (lift < 1 ? 0.8 : 1) * a * out * (1 - 0.6 * done));
        c.fillRect(x - sz / 2, y - sz / 2, sz, sz);
        if (a > 0.5 && lift < 1) glow(c, x, y, 10, m.core, 0.4 * out);
      }
  }
  // 3. the stencil tile slides across in three steps on twos (0.42, 0.53, 0.64), aligned from 0.64
  if (u >= 0.42 && done < 1) {
    const step = Math.min(2, Math.floor((u - 0.42) / 0.11));
    const tx = hx - (2 - step) * q * 1.7;
    const ty = hy - 14 * done;
    const tin = mixLab(mixLab(m.set, m.setHaze, 0.45), m.rim, 0.15);
    const T = q * 1.55;
    c.globalAlpha *= 1 - done;
    c.fillStyle = withAlpha(tin, 0.96 * out);
    const plate = new Path2D();
    plate.rect(tx - T, ty - T, 2 * T, 2 * T);
    for (let j = 0; j < 3; j++)
      for (let i = 0; i < 3; i++) if (mask[j * 3 + i]) plate.rect(tx + (i - 1) * q - q * 0.36, ty + (j - 1) * q - q * 0.36, q * 0.72, q * 0.72);
    c.fill(plate, 'evenodd');
    c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.9 * out);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(tx - T, ty + T);
    c.lineTo(tx - T, ty - T);
    c.lineTo(tx + T, ty - T);
    c.stroke();
    // matched: every hole fills with light (all three spots show through)
    const hit = step === 2 ? sm3((u - 0.66) / 0.08) * out : 0;
    if (hit > 0) {
      c.fillStyle = withAlpha(m.core, hit);
      for (let j = 0; j < 3; j++)
        for (let i = 0; i < 3; i++)
          if (mask[j * 3 + i]) {
            c.fillRect(tx + (i - 1) * q - q * 0.34, ty + (j - 1) * q - q * 0.34, q * 0.68, q * 0.68);
            glow(c, tx + (i - 1) * q, ty + (j - 1) * q, 12, m.core, 0.6 * hit);
          }
    }
    c.globalAlpha /= Math.max(0.001, 1 - done);
  }
  // 4. course 2's arches in that column light (the detector fired) as the tile lifts away
  const fire = sm3((u - 0.86) / 0.12) * out;
  if (fire > 0) {
    c.fillStyle = withAlpha(m.core, fire);
    for (let j = 0; j < hi.co.rows; j++) lancet(c, hx, hi.cy(j), hi.pw, hi.ph);
    glow(c, hx, (hi.co.y0 + hi.co.y1) / 2, 26, m.core, 0.6 * fire);
  }
  c.restore();
}

/** every lantern sees everything: each fc6 lantern threads to every top cell of the 13-tower (conv5), and each fc7
 *  lantern to every fc6 lantern. One fine thread per pair, alpha `a` each (they pile up where they cross). */
function threadsAll(c: C, env: PaintEnv, a: number, lit: number[]) {
  const m = env.mood;
  const top = COURSES[4];
  const pw = (top.w - 8) / top.cols;
  const tops = Array.from({ length: top.cols }, (_, q) => ({ x: CAT.cx - top.w / 2 + 4 + (q + 0.5) * pw, y: top.y0 + 6 }));
  c.save();
  c.lineWidth = 1;
  c.strokeStyle = withAlpha(mixLab(m.core, m.halo, 0.3), Math.min(1, a * 1.5) * (0.8 + 0.2 * lit[5]));
  c.beginPath();
  for (let i = 0; i < 32; i++) {
    const p = hallLantern(0, i);
    for (const q of tops) {
      c.moveTo(p.x, p.y + 6);
      c.lineTo(q.x, q.y);
    }
  }
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(m.core, m.halo, 0.3), a * (0.8 + 0.2 * lit[6]));
  c.beginPath();
  for (let i = 0; i < 32; i++) {
    const p = hallLantern(1, i);
    for (let j = 0; j < 32; j++) {
      const q = hallLantern(0, j);
      c.moveTo(p.x, p.y + 6);
      c.lineTo(q.x, q.y - 6);
    }
  }
  c.stroke();
  c.restore();
}

/** the FAN: ≈ 55 brighter threads per hall (fc6: every 3rd lantern to every top cell of conv5; fc7: every 4th
 *  lantern to every 4th of fc6), rim-coloured, over the faint all-pairs sheet */
function threadsFan(c: C, env: PaintEnv, a: number, lit: number[]) {
  const m = env.mood;
  const top = COURSES[4];
  const pw = (top.w - 8) / top.cols;
  const col = mixLab(m.rim, m.core, 0.35);
  c.save();
  c.lineWidth = 0.9;
  c.strokeStyle = withAlpha(col, Math.min(1, a * (0.85 + 0.15 * lit[5])));
  c.beginPath();
  for (let i = 0; i < 32; i += 3) {
    const p = hallLantern(0, i);
    for (let q = 0; q < top.cols; q++) {
      c.moveTo(p.x, p.y + 6);
      c.lineTo(CAT.cx - top.w / 2 + 4 + (q + 0.5) * pw, top.y0 + 6);
    }
  }
  c.stroke();
  c.strokeStyle = withAlpha(col, Math.min(1, a * (0.85 + 0.15 * lit[6])));
  c.beginPath();
  for (let i = 0; i < 32; i += 4) {
    const p = hallLantern(1, i);
    for (let j = 1; j < 32; j += 4) {
      const q = hallLantern(0, j);
      c.moveTo(p.x, p.y + 6);
      c.lineTo(q.x, q.y - 6);
    }
  }
  c.stroke();
  c.restore();
}

/** the last hall: a band of a thousand small lit lanterns (100 × 10), one per category, each with a tiny tag tick
 *  beneath it; the brightest of the three halls, under a low gable (nothing stacks above the output) */
function crownBand(c: C, env: PaintEnv, s: CathedralState) {
  const m = env.mood;
  const b = s.crown;
  const lift = (1 - b) * 20;
  const x0 = HX0 - 6, x1 = HX1 + 6;
  const ink = env.fill('ink');
  c.save();
  c.globalAlpha *= Math.min(1, b * 1.6);
  c.fillStyle = grade(env, 1);
  void ink;
  // piers stand the last hall on fc7
  for (let a = 0; a <= 8; a++) c.fillRect(HX0 + ((HX1 - HX0) * a) / 8 - 3, CROWN.y1 + lift, 6, HALLS[1].y0 - CROWN.y1 + 2);
  c.fillRect(x0, CROWN.y0 - 6 + lift, x1 - x0, CROWN.y1 - CROWN.y0 + 12);
  c.beginPath();
  c.moveTo(x0 + 10, CROWN.y0 - 6 + lift);
  c.lineTo(CAT.cx, CROWN.y0 - 34 + lift);
  c.lineTo(x1 - 10, CROWN.y0 - 6 + lift);
  c.closePath();
  c.fill();
  const L = s.lit[7];
  const pw = (x1 - x0 - 12) / CROWN.cols;
  const ph = (CROWN.y1 - CROWN.y0) / CROWN.rows;
  const warm = mixLab(m.halo, m.core, 0.5);
  for (let j = 0; j < CROWN.rows; j++)
    for (let i = 0; i < CROWN.cols; i++) {
      const q = j * CROWN.cols + i;
      const a = q === 437 ? 1 : 0.55 + 0.45 * hash1(q, 591);
      const v = Math.min(1, 0.2 + L * a);
      const x = x0 + 6 + (i + 0.5) * pw, y = CROWN.y0 + j * ph + lift + ph * 0.32;
      c.fillStyle = mixLab(mixLab(m.set, m.ink, 0.1), warm, v);
      c.fillRect(x - 1.1, y - 1.1, 2.2, 2.2);
      // its category tag: a tick beneath
      c.fillStyle = withAlpha(m.rim, 0.35 + 0.3 * L);
      c.fillRect(x - 0.35, y + 1.6, 0.7, ph * 0.32);
    }
  c.restore();
  if (L > 0.05) {
    glow(c, CAT.cx, (CROWN.y0 + CROWN.y1) / 2 + lift, 330, m.halo, 0.2 * L);
    const i = 437 % CROWN.cols, j = Math.floor(437 / CROWN.cols);
    glow(c, x0 + 6 + (i + 0.5) * pw, CROWN.y0 + j * ph + lift + ph * 0.32, 16, m.core, 0.6 * Math.max(0, L - 0.7) / 0.3);
  }
}

// ------------------------------------------------------------------------------------------------ the rose window
function roseWindow(c: C, env: PaintEnv, s: CathedralState) {
  const m = env.mood;
  const P = CAT.rose;
  // the 96 first-layer tiles in two rings around the photograph (tiny 11 × 11 stencils, flickering in)
  const tileCv = tilesSprite();
  for (let q = 0; q < 96; q++) {
    const ring = q < 48 ? 0 : 1;
    const k = q % 48;
    const r = ring === 0 ? P.r + 9 : P.r + 21;
    const a = (k / 48) * Math.PI * 2 + ring * 0.065;
    const appear = Math.max(0, Math.min(1, s.tiles * 1.6 - hash1(q, 601) * 0.6));
    if (appear <= 0) continue;
    const flick = appear < 1 ? (Math.floor(s.t * 24 + q) % 3 === 0 ? 0.4 : 1) : 1;
    const sz = ring === 0 ? 6.4 : 8;
    c.save();
    c.globalAlpha *= appear * flick;
    c.translate(P.x + Math.cos(a) * r, P.y + Math.sin(a) * r);
    c.rotate(a + Math.PI / 2);
    c.imageSmoothingEnabled = false;
    c.drawImage(tileCv, (q % 12) * 11, Math.floor(q / 12) * 11, 11, 11, -sz / 2, -sz / 2, sz, sz);
    c.restore();
  }
  // the photograph in the central light
  c.save();
  c.beginPath();
  c.arc(P.x, P.y, P.r, 0, Math.PI * 2);
  c.clip();
  c.imageSmoothingEnabled = true;
  c.drawImage(huskyCanvas(128), P.x - P.r, P.y - P.r, P.r * 2, P.r * 2);
  if (s.vignette.kind && s.vignette.k > 0.01) vignette(c, env, s.vignette.kind, s.vignette.k, s.t);
  c.restore();
  // tracery: spokes and rings in ink over the glass
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 2.2;
  c.beginPath();
  c.arc(P.x, P.y, P.r, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = 3;
  c.beginPath();
  c.arc(P.x, P.y, P.r + 30, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = 1;
  c.strokeStyle = withAlpha(m.fg, 0.55);
  c.beginPath();
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    c.moveTo(P.x + Math.cos(a) * (P.r + 2), P.y + Math.sin(a) * (P.r + 2));
    c.lineTo(P.x + Math.cos(a) * (P.r + 29), P.y + Math.sin(a) * (P.r + 29));
  }
  c.stroke();
  glow(c, P.x, P.y, P.r * 2.4, m.halo, 0.12);
}

let TILES: HTMLCanvasElement | null = null;
/** the 96 learned tiles (illustrative) in one 132 × 88 sprite sheet */
function tilesSprite(): HTMLCanvasElement {
  if (TILES) return TILES;
  const cv = document.createElement('canvas');
  cv.width = 12 * 11;
  cv.height = 8 * 11;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(cv.width, cv.height);
  for (let q = 0; q < 96; q++) {
    const px = tileArt(q, 1);
    const ox = (q % 12) * 11, oy = Math.floor(q / 12) * 11;
    px.forEach((col, k) => {
      const x = ox + (k % 11), y = oy + Math.floor(k / 11);
      const o = (y * cv.width + x) * 4;
      // muted (saturation ≤ 0.35): the dawn and the lit windows stay the only warmth
      const lum = 0.3 * col[0] + 0.59 * col[1] + 0.11 * col[2];
      img.data[o] = (lum + (col[0] - lum) * 0.35) * 255;
      img.data[o + 1] = (lum + (col[1] - lum) * 0.35) * 255;
      img.data[o + 2] = (lum + (col[2] - lum) * 0.35) * 255;
      img.data[o + 3] = 255;
    });
  }
  g.putImageData(img, 0, 0);
  TILES = cv;
  return cv;
}

/** what a layer responds to, shown one at a time in the rose window (drawn over the photo at strength k) */
function vignette(c: C, env: PaintEnv, kind: 'strokes' | 'textures' | 'parts' | 'things', k: number, t: number) {
  const P = CAT.rose;
  const m = env.mood;
  const R = P.r;
  c.save();
  c.globalAlpha *= k;
  c.fillStyle = '#16120d';
  c.fillRect(P.x - R, P.y - R, R * 2, R * 2);
  const lit = mixLab(m.core, '#ffffff', 0.15);
  if (kind === 'strokes') {
    // oriented strokes: short bright bars at every angle
    c.strokeStyle = lit;
    c.lineCap = 'round';
    for (let j = -3; j <= 3; j++)
      for (let i = -3; i <= 3; i++) {
        const a = hash1(i * 7 + j * 13 + 40, 611) * Math.PI;
        const x = P.x + i * 13 + (j % 2) * 4, y = P.y + j * 13;
        c.lineWidth = 2.2;
        c.globalAlpha = k * (0.55 + 0.45 * hash1(i * 3 + j, 612));
        c.beginPath();
        c.moveTo(x - Math.cos(a) * 5, y - Math.sin(a) * 5);
        c.lineTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5);
        c.stroke();
      }
  } else if (kind === 'textures') {
    // woven textures: a basket weave and a crosshatch, side by side
    c.strokeStyle = lit;
    c.lineWidth = 1.6;
    for (let j = -4; j <= 4; j++)
      for (let i = -4; i <= 4; i++) {
        const x = P.x + i * 11, y = P.y + j * 11;
        c.globalAlpha = k * 0.85;
        c.beginPath();
        if ((i + j) % 2 === 0) {
          for (let l = -1; l <= 1; l++) {
            c.moveTo(x - 4, y + l * 3);
            c.lineTo(x + 4, y + l * 3);
          }
        } else {
          for (let l = -1; l <= 1; l++) {
            c.moveTo(x + l * 3, y - 4);
            c.lineTo(x + l * 3, y + 4);
          }
        }
        c.stroke();
      }
  } else if (kind === 'parts') {
    // a detector's response to PARTS: two isolated lit patches on the dark, a fur patch and an eye
    c.save();
    c.shadowColor = withAlpha(m.halo, 0.9);
    c.shadowBlur = 10;
    // the fur patch: a soft oval of light combed with short bright strands
    c.save();
    c.beginPath();
    c.ellipse(P.x - R * 0.36, P.y + R * 0.2, R * 0.3, R * 0.36, -0.3, 0, Math.PI * 2);
    c.globalAlpha = k * 0.55;
    c.fillStyle = mixLab(lit, m.halo, 0.45);
    c.fill();
    c.clip();
    c.strokeStyle = lit;
    c.lineWidth = 1.2;
    for (let q = 0; q < 90; q++) {
      const x = P.x - R * 0.66 + hash1(q, 621) * R * 0.62;
      const y = P.y - R * 0.2 + hash1(q, 622) * R * 0.8;
      const a = 1.15 + 0.45 * hash1(q, 623);
      c.globalAlpha = k * (0.55 + 0.45 * hash1(q, 624));
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8);
      c.stroke();
    }
    c.restore();
    // the eye: an almond of light with a dark pupil
    c.globalAlpha = k;
    c.fillStyle = lit;
    c.beginPath();
    c.moveTo(P.x + R * 0.08, P.y - R * 0.18);
    c.quadraticCurveTo(P.x + R * 0.38, P.y - R * 0.46, P.x + R * 0.68, P.y - R * 0.2);
    c.quadraticCurveTo(P.x + R * 0.38, P.y + R * 0.06, P.x + R * 0.08, P.y - R * 0.18);
    c.fill();
    c.restore();
    c.globalAlpha = k;
    c.fillStyle = '#100d09';
    c.beginPath();
    c.arc(P.x + R * 0.39, P.y - R * 0.2, R * 0.075, 0, Math.PI * 2);
    c.fill();
  } else {
    // a detector's response to a THING: the whole dog's head as one silhouette of light (rim/core tone, no
    // features), in the photograph's own three-quarter pose: the near ear full, the far ear foreshortened, the
    // snout reaching left past the far cheek, the ruff below (same geometry as huskyRGB in ch08-s01-kit)
    const X = (u: number) => P.x - R + 2 * R * u, Y = (v: number) => P.y - R + 2 * R * v;
    const head = new Path2D();
    const el = (u: number, v: number, ru: number, rv: number) => {
      head.moveTo(X(u + ru), Y(v));
      head.ellipse(X(u), Y(v), 2 * R * ru, 2 * R * rv, 0, 0, Math.PI * 2);
    };
    el(0.52, 0.46, 0.215, 0.215);
    el(0.39, 0.6, 0.15, 0.1);
    el(0.48, 0.62, 0.15, 0.1);
    el(0.5, 1.0, 0.36, 0.3);
    const tri = (pts: number[]) => {
      head.moveTo(X(pts[0]), Y(pts[1]));
      head.lineTo(X(pts[2]), Y(pts[3]));
      head.lineTo(X(pts[4]), Y(pts[5]));
      head.closePath();
    };
    tri([0.74, 0.36, 0.7, 0.05, 0.58, 0.27]);
    tri([0.33, 0.32, 0.37, 0.08, 0.45, 0.27]);
    const tone = mixLab(m.rim, m.core, 0.4);
    c.save();
    c.globalAlpha = k * 0.92;
    c.shadowColor = withAlpha(m.halo, 0.8);
    c.shadowBlur = 12;
    c.fillStyle = tone;
    c.fill(head, 'nonzero');
    c.restore();
    // a soft inner shading so it reads as a lit form, not a flat sticker: the far side falls off
    c.save();
    c.clip(head, 'nonzero');
    const sh = c.createLinearGradient(X(0.2), 0, X(0.85), 0);
    sh.addColorStop(0, withAlpha('#16120d', 0.0));
    sh.addColorStop(1, withAlpha('#16120d', 0.35 * k));
    c.fillStyle = sh;
    c.fillRect(P.x - R, P.y - R, 2 * R, 2 * R);
    c.restore();
  }
  void t;
  c.restore();
}
