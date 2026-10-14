/**
 * neural-net-history — ch06-s03's teaching pieces: the rivals' gallery and the widest street.
 *
 * THE STREET IS REAL. Two crowds of points (warm / cool) are generated at module scope; the street is the true
 * hard-margin maximum-margin separator for them, found by an exact sweep over the normal's angle (the margin of a
 * direction n is (min_cool n·x − max_warm n·x) / 2; the best direction wins, refined by golden section). The kerb
 * lanterns that get chalk circles are the actual support vectors (the points on the kerbs). The faint first try is a
 * real separating line with a much narrower street (its own margin ≤ 40% of the best), so 'widest' reads as a choice.
 *
 * THE BOWL IS REAL. f(x) = x² (convex: one global optimum at 0); the balls are true gradient-descent iterates
 * x ← x − η f'(x) from either rim (η = 0.16), so both reach the same bottom.
 *
 *   SVM            { pts, best: { n, b, margin }, narrow: { n, b, margin }, sv: number[] }   (data units −1..1)
 *   streetGeom(area, line)   map a data-space line + margin to board px
 *   paperLantern2(c, env, x, y, r, warm, glow)   a small paper lantern (warm or cool), glowing
 *   chalkCircle(c, x, y, r, u, seed, col)        a hand-drawn chalk ring, drawn on to u
 *   decisionTree(c, env, x, y, h, seed, u)       a little cut-paper decision tree (3 levels of splits)
 *   bowlPath / BOWL_ITER                          the clean bowl's profile and the descent iterates
 */
import type { PaintEnv } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { h01 } from './ch03-s01-kit';

export interface Pt2 {
  x: number;
  y: number;
  /** -1 = warm crowd (left), +1 = cool crowd (right) */
  c: -1 | 1;
}
export interface Line2 {
  /** unit normal (pointing to the cool side) */
  n: [number, number];
  /** offset: the centre line is n·x = b */
  b: number;
  /** half-width of the street (data units) */
  margin: number;
}

function marginAt(pts: Pt2[], th: number): { m: number; b: number } {
  const n: [number, number] = [Math.cos(th), Math.sin(th)];
  let maxW = -Infinity, minC = Infinity;
  for (const p of pts) {
    const v = n[0] * p.x + n[1] * p.y;
    if (p.c < 0) maxW = Math.max(maxW, v);
    else minC = Math.min(minC, v);
  }
  return { m: (minC - maxW) / 2, b: (minC + maxW) / 2 };
}

function solve(pts: Pt2[]): Line2 {
  let best = { th: 0, m: -Infinity, b: 0 };
  const N = 3600;
  for (let i = 0; i < N; i++) {
    const th = (i / N) * Math.PI * 2;
    const r = marginAt(pts, th);
    if (r.m > best.m) best = { th, m: r.m, b: r.b };
  }
  // golden-section refinement around the best sample
  let a = best.th - (2 * Math.PI) / N, c = best.th + (2 * Math.PI) / N;
  const g = (Math.sqrt(5) - 1) / 2;
  for (let k = 0; k < 60; k++) {
    const x1 = c - g * (c - a), x2 = a + g * (c - a);
    if (marginAt(pts, x1).m > marginAt(pts, x2).m) c = x2;
    else a = x1;
  }
  const th = (a + c) / 2;
  const r = marginAt(pts, th);
  return { n: [Math.cos(th), Math.sin(th)], b: r.b, margin: r.m };
}

function makeData(): { pts: Pt2[]; best: Line2; narrow: Line2; sv: number[] } {
  for (let seed = 1; seed < 400; seed++) {
    const r = (k: number) => h01(k, 9100 + seed);
    const pts: Pt2[] = [];
    // a true street leaning ~12° from vertical, width ~0.36; crowds scattered to either side
    const th0 = 0.2 + 0.08 * (r(1) - 0.5);
    const n: [number, number] = [Math.cos(th0), Math.sin(th0)];
    for (let i = 0; pts.length < 26 && i < 600; i++) {
      const x = r(10 + i * 2) * 2 - 1;
      const y = r(11 + i * 2) * 2 - 1;
      const d = n[0] * x + n[1] * y - 0.02;
      if (Math.abs(d) < 0.17 || Math.abs(d) > 0.85) continue;
      // keep the crowds from crowding the board edges
      if (Math.abs(x) > 0.92 || Math.abs(y) > 0.86) continue;
      pts.push({ x, y, c: d > 0 ? 1 : -1 });
    }
    const warm = pts.filter((p) => p.c < 0).length;
    if (warm < 11 || warm > 15) continue;
    const best = solve(pts);
    if (best.margin < 0.15) continue;
    // support vectors: points on the kerbs (within a hair of the margin)
    const sv: number[] = [];
    pts.forEach((p, i) => {
      const v = best.n[0] * p.x + best.n[1] * p.y - best.b;
      if (Math.abs(Math.abs(v) - best.margin) < 1e-6 + best.margin * 0.01) sv.push(i);
    });
    if (sv.length < 3 || sv.length > 4) continue;
    // the narrow try: another direction that still separates, with ≤ 40% of the margin, far from the best angle
    const thB = Math.atan2(best.n[1], best.n[0]);
    let narrow: Line2 | null = null;
    let far = 0;
    for (let i = -200; i <= 200; i++) {
      const th = thB + (i / 200) * 0.9;
      const m = marginAt(pts, th);
      if (m.m > 0.05 && m.m < best.margin * 0.4 && Math.abs(th - thB) > far) {
        far = Math.abs(th - thB);
        narrow = { n: [Math.cos(th), Math.sin(th)], b: m.b, margin: m.m };
      }
    }
    if (!narrow || far < 0.25) continue;
    return { pts, best, narrow, sv };
  }
  // never throw at module scope
  const pts: Pt2[] = [{ x: -0.5, y: 0, c: -1 }, { x: 0.5, y: 0, c: 1 }];
  const best: Line2 = { n: [1, 0], b: 0, margin: 0.5 };
  return { pts, best, narrow: { n: [0.95, 0.31], b: 0, margin: 0.2 }, sv: [0, 1] };
}

export const SVM = makeData();

export interface Area {
  x: number;
  y: number;
  w: number;
  h: number;
}
/** data (−1..1, y up) → board px */
export const toBoard = (a: Area, x: number, y: number) => ({ x: a.x + ((x + 1) / 2) * a.w, y: a.y + ((1 - y) / 2) * a.h });

/** the segment of the line n·x = b + off clipped to the data square, in board px */
export function lineSeg(a: Area, L: Pick<Line2, 'n'>, b: number): [{ x: number; y: number }, { x: number; y: number }] {
  const [nx, ny] = L.n;
  // the direction along the line
  const dx = -ny, dy = nx;
  const p0 = { x: nx * b, y: ny * b };
  // clip p0 + s·d to the square [-1.1, 1.1]
  let s0 = -10, s1 = 10;
  const lim = 1.08;
  for (const [pc, dc] of [[p0.x, dx], [p0.y, dy]] as const) {
    if (Math.abs(dc) < 1e-9) continue;
    const ta = (-lim - pc) / dc, tb = (lim - pc) / dc;
    s0 = Math.max(s0, Math.min(ta, tb));
    s1 = Math.min(s1, Math.max(ta, tb));
  }
  return [toBoard(a, p0.x + s0 * dx, p0.y + s0 * dy), toBoard(a, p0.x + s1 * dx, p0.y + s1 * dy)];
}

// ---------------------------------------------------------------------------------------------- lanterns
/** a small paper lantern: ribbed body, caps, a glow; warm (the left crowd) or cool (the right crowd) */
export function paperLantern2(c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, r: number, warm: boolean, glow: number) {
  const m = env.mood;
  const cool = MOODS.winterBlue;
  const lit = warm ? mixLab(m.halo, m.core, 0.35) : mixLab(cool.rim, cool.core, 0.25);
  const dim = warm ? mixLab(m.set, m.halo, 0.45) : mixLab(m.set, cool.rim, 0.45);
  // glow halo
  if (glow > 0.02) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y, r * 0.3, x, y, r * 3.2);
    g.addColorStop(0, withAlpha(lit, 0.32 * glow));
    g.addColorStop(1, withAlpha(lit, 0));
    c.fillStyle = g;
    c.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4);
    c.restore();
  }
  c.fillStyle = mixLab(dim, lit, 0.35 + 0.65 * glow);
  c.beginPath();
  c.ellipse(x, y, r * 0.86, r, 0, 0, Math.PI * 2);
  c.fill();
  // ribs
  c.strokeStyle = withAlpha(m.ink, 0.35);
  c.lineWidth = 0.9;
  c.beginPath();
  c.ellipse(x, y, r * 0.42, r * 0.98, 0, 0, Math.PI * 2);
  c.moveTo(x, y - r);
  c.lineTo(x, y + r);
  c.stroke();
  // caps and a hanging loop
  c.fillStyle = env.fill('ink');
  c.fillRect(x - r * 0.45, y - r - 2.5, r * 0.9, 3);
  c.fillRect(x - r * 0.45, y + r - 0.5, r * 0.9, 3);
  c.fillRect(x - 0.6, y - r - 6, 1.2, 4);
}

/** a hand-drawn chalk ring (slightly open, overshooting), drawn on to u ∈ 0..1 */
export function chalkCircle(c: CanvasRenderingContext2D, x: number, y: number, r: number, u: number, seed: number, col: string) {
  if (u <= 0) return;
  c.save();
  c.strokeStyle = col;
  c.lineWidth = 2.2;
  c.lineCap = 'round';
  c.beginPath();
  const a0 = -2.2 + h01(seed, 3);
  const steps = 36;
  const n = Math.max(1, Math.floor(steps * u));
  for (let i = 0; i <= n; i++) {
    const a = a0 + (i / steps) * Math.PI * 2.15;
    const rr = r * (1 + 0.07 * Math.sin(a * 2 + seed));
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.94;
    if (i === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.stroke();
  c.restore();
}

// ---------------------------------------------------------------------------------------------- the forest
/**
 * A little cut-paper decision tree: a trunk, then three levels of binary splits (each split a short horizontal
 * cut with two drops), leaves as tiny squares. (x, y) = foot of the trunk, h = height. u 0..1 grows it (on twos).
 * Returns the top point (where its flag goes).
 */
export function decisionTree(c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, h: number, seed: number, u = 1) {
  const ink = env.fill('ink');
  c.save();
  c.fillStyle = ink;
  c.strokeStyle = ink;
  c.lineCap = 'square';
  const lw = Math.max(2, h * 0.022);
  c.lineWidth = lw;
  const levels = 2;
  const top = y - h;
  const lv = h / (levels + 1.3);
  // the decision tree is drawn root at the TOP (as they are), its trunk the stand that holds it up
  const grow = Math.max(0, Math.min(1, u));
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x, y - (h - (levels + 0.3) * lv) * Math.min(1, grow * 3));
  c.stroke();
  const rootY = top + lv * 0.3;
  const draw = (cx: number, cy: number, span: number, d: number, id: number) => {
    const g = grow * (levels + 1) - d;
    if (g <= 0) return;
    // the node: a small square card
    c.fillRect(cx - lw * 1.4, cy - lw * 1.4, lw * 2.8, lw * 2.8);
    if (d >= levels) return;
    const sp = span * (0.85 + 0.3 * h01(id, seed));
    const ny = cy + lv;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx, cy + lv * 0.45);
    c.moveTo(cx - sp / 2, cy + lv * 0.45);
    c.lineTo(cx + sp / 2, cy + lv * 0.45);
    c.moveTo(cx - sp / 2, cy + lv * 0.45);
    c.lineTo(cx - sp / 2, ny);
    c.moveTo(cx + sp / 2, cy + lv * 0.45);
    c.lineTo(cx + sp / 2, ny);
    c.stroke();
    // some branches stop early (a leaf), as real trees do
    const stopL = h01(id * 2 + 1, seed + 7) < 0.22 && d > 0;
    const stopR = h01(id * 2 + 2, seed + 7) < 0.22 && d > 0;
    if (!stopL) draw(cx - sp / 2, ny, span / 2, d + 1, id * 2 + 1);
    else c.fillRect(cx - sp / 2 - lw * 1.4, ny - lw * 1.4, lw * 2.8, lw * 2.8);
    if (!stopR) draw(cx + sp / 2, ny, span / 2, d + 1, id * 2 + 2);
    else c.fillRect(cx + sp / 2 - lw * 1.4, ny - lw * 1.4, lw * 2.8, lw * 2.8);
  };
  draw(x, rootY, h * 0.44, 0, 0);
  c.restore();
  return { x, y: top };
}

/** a tiny paper flag on a pin: warm or cool, raised by u */
export function paperFlag(c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, s: number, warm: boolean, u: number) {
  if (u <= 0) return;
  const m = env.mood;
  const cool = MOODS.winterBlue;
  const col = warm ? mixLab(m.halo, m.core, 0.3) : mixLab(cool.rim, cool.core, 0.2);
  const pole = 26 * s;
  const lift = pole * Math.min(1, u);
  c.save();
  c.fillStyle = env.fill('ink');
  c.fillRect(x - 0.9 * s, y - lift, 1.8 * s, lift);
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(x + 0.9 * s, y - lift);
  c.lineTo(x + 15 * s, y - lift + 5 * s);
  c.lineTo(x + 0.9 * s, y - lift + 10 * s);
  c.closePath();
  c.fill();
  c.restore();
}

// ---------------------------------------------------------------------------------------------- the bowl
export const BOWL_LR = 0.16;
/** gradient-descent iterates on f(x) = x² from x0 (f'(x) = 2x): x ← x − η·2x */
export function bowlIter(x0: number, n = 24): number[] {
  const xs = [x0];
  let x = x0;
  for (let k = 0; k < n; k++) {
    x = x - BOWL_LR * 2 * x;
    xs.push(x);
  }
  return xs;
}
export const BOWL_ITER = { left: bowlIter(-0.94), right: bowlIter(0.94) };

export function ellipsisText(c: CanvasRenderingContext2D, s: string, maxW: number) {
  if (c.measureText(s).width <= maxW) return s;
  let t = s;
  while (t.length > 1 && c.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}
