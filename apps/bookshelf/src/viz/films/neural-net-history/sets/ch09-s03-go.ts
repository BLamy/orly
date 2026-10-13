/**
 * ch09-s03 — the Go board in the Seoul match hall, in two cameras of one paper theatre:
 *
 *   goTop(c, env, o)     the board square-on from above (the TEACHING camera): cut-out grid lines, black stones of
 *                        card, white stones of backlit paper, a hanging lamp's pool; ghost game sheets riffling over
 *                        it, rings of light spreading from a stone, a reward pulse running back through a game
 *   goSide(c, env, o)    the same board on its table seen from the side, a little above (the WIDE camera): the grid
 *                        foreshortened, stones as ellipses, rings as ellipses on the board's plane
 *   bowl(c, env, o)      a stone bowl with its lid (lid 0 = off, lying beside it; 1 = on)
 *   castHand(c, env, o)  an arm from a frame edge setting a stone: 'machine' (anonymous dark sleeve, never a body)
 *                        or 'lee' (a suit sleeve and a pale shirt cuff)
 *
 * Positions are the REAL match records (Google DeepMind Challenge Match, SGF from homepages.cwi.nl/~aeb/go/games):
 * game 2 before move 37 and game 4 before move 78 (captures applied). The self-play game and the ghost sheets are
 * illustrative. Move 37 = record 'oj', the fifth-line shoulder hit; move 78 = record 'ki', the wedge.
 * Board coordinates: col 0..18 left → right, row 0..18 top → bottom (as seen from above / far → near in the side view).
 */
import type { PaintEnv } from '../../../film/contracts';
import { hash1 } from '../../../film/core/frame';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';

type C = CanvasRenderingContext2D;
export type Col = 'b' | 'w';
export interface Stone {
  c: number;
  r: number;
  col: Col;
}

// ------------------------------------------------------------------------------------------------ positions
const S = (c: number, r: number, col: Col): Stone => ({ c, r, col });
/** game 2 (10 March 2016, AlphaGo black) after move 36, from the match record: White's move 36 sits on the fourth
 *  line of the right side at (15, 8); the lower-left corner fight and the lower-right framework are settled */
export const GAME2: Stone[] = [
  S(8, 2, 'b'), S(2, 3, 'b'), S(4, 3, 'b'), S(13, 3, 'b'), S(15, 3, 'b'), S(16, 4, 'b'), S(15, 5, 'w'), S(16, 5, 'w'),
  S(2, 6, 'w'), S(15, 8, 'w'), S(3, 9, 'w'), S(2, 12, 'w'), S(1, 13, 'w'), S(2, 13, 'b'), S(16, 13, 'w'), S(1, 14, 'w'),
  S(2, 14, 'w'), S(3, 14, 'b'), S(15, 14, 'b'), S(16, 14, 'w'), S(1, 15, 'b'), S(2, 15, 'b'), S(3, 15, 'w'), S(4, 15, 'w'),
  S(9, 15, 'b'), S(12, 15, 'b'), S(14, 15, 'b'), S(16, 15, 'w'), S(1, 16, 'b'), S(2, 16, 'w'), S(3, 16, 'b'), S(5, 16, 'w'),
  S(13, 16, 'b'), S(14, 16, 'w'), S(15, 16, 'w'), S(3, 17, 'b'),
];
/** move 37 (record: B 'oj'): the fifth-line shoulder hit on the right side, diagonally above-left of White 36 */
export const M37: Stone = S(14, 9, 'b');

/** game 4 (13 March 2016) after move 77, from the match record (captures applied): the centre is crowded and Black
 *  walls a narrow gap at (10, 8) from both sides */
export const GAME4: Stone[] = [
  S(13, 1, 'b'), S(3, 2, 'b'), S(4, 2, 'w'), S(5, 2, 'b'), S(7, 2, 'b'), S(11, 2, 'w'), S(12, 2, 'w'), S(13, 2, 'b'),
  S(2, 3, 'b'), S(4, 3, 'b'), S(5, 3, 'w'), S(7, 3, 'b'), S(8, 3, 'w'), S(12, 3, 'b'), S(13, 3, 'b'), S(15, 3, 'b'),
  S(6, 4, 'w'), S(7, 4, 'b'), S(12, 4, 'b'), S(13, 4, 'w'), S(5, 5, 'w'), S(6, 5, 'b'), S(11, 5, 'b'), S(12, 5, 'w'),
  S(13, 5, 'w'), S(2, 6, 'w'), S(5, 6, 'w'), S(6, 6, 'b'), S(9, 6, 'w'), S(12, 6, 'b'), S(13, 6, 'w'), S(4, 7, 'w'),
  S(5, 7, 'b'), S(6, 7, 'w'), S(11, 7, 'b'), S(12, 7, 'b'), S(13, 7, 'w'), S(4, 8, 'w'), S(5, 8, 'b'), S(9, 8, 'b'),
  S(11, 8, 'b'), S(12, 8, 'w'), S(13, 8, 'b'), S(14, 8, 'w'), S(15, 8, 'w'), S(16, 8, 'w'), S(1, 9, 'w'), S(2, 9, 'w'),
  S(3, 9, 'w'), S(4, 9, 'b'), S(7, 9, 'b'), S(12, 9, 'w'), S(13, 9, 'b'), S(14, 9, 'b'), S(15, 9, 'b'), S(16, 9, 'w'),
  S(2, 10, 'b'), S(3, 10, 'b'), S(5, 10, 'b'), S(8, 10, 'w'), S(10, 10, 'b'), S(12, 10, 'w'), S(2, 13, 'b'), S(4, 14, 'w'),
  S(15, 14, 'w'), S(1, 15, 'w'), S(3, 15, 'w'), S(4, 15, 'b'), S(5, 15, 'w'), S(12, 15, 'b'), S(14, 15, 'b'), S(16, 15, 'w'),
  S(5, 16, 'w'), S(8, 16, 'b'), S(13, 16, 'b'), S(14, 16, 'w'), S(15, 16, 'w'),
];
/** move 78 (record: W 'ki'): Lee Sedol's wedge into the gap between Black (9, 8) and (11, 8) */
export const M78: Stone = S(10, 8, 'w');

/** a quick self-play game (illustrative): stones in the order the anonymous hand sets them, both colours */
export const SELFPLAY: Stone[] = [
  S(15, 3, 'b'), S(3, 15, 'w'), S(3, 3, 'b'), S(15, 15, 'w'), S(9, 9, 'b'), S(13, 15, 'w'), S(15, 9, 'b'), S(5, 3, 'w'), S(9, 15, 'b'), S(3, 9, 'w'),
  S(12, 12, 'b'), S(6, 6, 'w'),
];

/** ghost games (the human record): seeded scatters around the corners, one per sheet */
export function ghostGame(seed: number, n = 44): Stone[] {
  const out: Stone[] = [];
  const used = new Set<number>();
  for (let i = 0; out.length < n && i < n * 8; i++) {
    const hub = [[3, 3], [15, 3], [3, 15], [15, 15], [9, 9], [9, 3], [3, 9], [15, 9], [9, 15]][Math.floor((hash1(i, seed) * 0.5 + 0.5) * 8.999)];
    const c = Math.max(0, Math.min(18, hub[0] + Math.round(hash1(i, seed + 1) * 4)));
    const r = Math.max(0, Math.min(18, hub[1] + Math.round(hash1(i, seed + 2) * 4)));
    if (used.has(r * 19 + c)) continue;
    used.add(r * 19 + c);
    out.push(S(c, r, out.length % 2 ? 'w' : 'b'));
  }
  return out;
}

// ------------------------------------------------------------------------------------------------ the top view
export const TOP = { cx: 640, cy: 360, step: 30, margin: 24 } as const;
export const topXY = (c: number, r: number) => ({ x: TOP.cx + (c - 9) * TOP.step, y: TOP.cy + (r - 9) * TOP.step });
const HOSHI = [3, 9, 15];

export interface Ring {
  c: number;
  r: number;
  /** 0..1 progress of the spreading ring */
  u: number;
  /** strength */
  k?: number;
  /** max radius in board steps */
  reach?: number;
}

export interface GoTopOpts {
  stones: Stone[];
  /** stones fading in (0..1) by index into `stones`, for the newest moves */
  alpha?: (i: number) => number;
  /** warm highlight per stone (reward pulse) */
  glow?: (i: number) => number;
  /** ghost sheets riffling over the board: each {stones, a, dx, dy, rot} */
  ghosts?: { stones: Stone[]; a: number; dx: number; dy: number; rot: number }[];
  rings?: Ring[];
  /** the lamp's pool strength 0..1 */
  lamp?: number;
}

/** the board, square-on from above (draw in L4 at the TEACHING camera) */
export function goTop(c: C, env: PaintEnv, o: GoTopOpts) {
  const m = env.mood;
  const half = 9 * TOP.step + TOP.margin;
  // the board: a thick slab of pale wood (paper-cut), a contact shadow on the table
  const wood = mixLab(mixLab(m.setHaze, m.halo, 0.45), '#b48a5a', 0.18);
  c.fillStyle = withAlpha(m.fg, 0.55);
  c.fillRect(TOP.cx - half + 10, TOP.cy - half + 14, half * 2, half * 2);
  c.fillStyle = wood;
  c.fillRect(TOP.cx - half, TOP.cy - half, half * 2, half * 2);
  // grain: a few long soft lines
  c.strokeStyle = withAlpha(mixLab(wood, m.set, 0.5), 0.18);
  c.lineWidth = 1.2;
  for (let i = 0; i < 16; i++) {
    const x = TOP.cx - half + 20 + i * ((half * 2 - 40) / 15) + hash1(i, 41) * 8;
    c.beginPath();
    c.moveTo(x, TOP.cy - half);
    c.bezierCurveTo(x + hash1(i, 42) * 12, TOP.cy - 80, x - hash1(i, 43) * 12, TOP.cy + 80, x + hash1(i, 44) * 6, TOP.cy + half);
    c.stroke();
  }
  // the grid: cut-out lines (the table's dark shows through), star points
  const ink = mixLab(m.ink, wood, 0.22);
  c.fillStyle = ink;
  for (let i = 0; i < 19; i++) {
    const a = topXY(i, 0), b = topXY(i, 18);
    c.fillRect(a.x - 0.8, a.y, 1.6, b.y - a.y);
    const p = topXY(0, i), q = topXY(18, i);
    c.fillRect(p.x, p.y - 0.8, q.x - p.x, 1.6);
  }
  for (const hc of HOSHI) for (const hr of HOSHI) {
    const p = topXY(hc, hr);
    c.beginPath();
    c.arc(p.x, p.y, 3.4, 0, Math.PI * 2);
    c.fill();
  }
  // ghost sheets (thin paper laid over the grid, each with a faint game on it)
  for (const g of o.ghosts ?? []) {
    if (g.a <= 0.01) continue;
    c.save();
    c.globalAlpha *= g.a;
    c.translate(TOP.cx + g.dx, TOP.cy + g.dy);
    c.rotate(g.rot);
    c.translate(-TOP.cx, -TOP.cy);
    c.fillStyle = withAlpha(mixLab(m.rim, '#fff4e4', 0.4), 0.16);
    c.fillRect(TOP.cx - half + 8, TOP.cy - half + 8, half * 2 - 16, half * 2 - 16);
    c.strokeStyle = withAlpha(m.rim, 0.25);
    c.lineWidth = 1;
    c.strokeRect(TOP.cx - half + 8, TOP.cy - half + 8, half * 2 - 16, half * 2 - 16);
    for (const s of g.stones) {
      const p = topXY(s.c, s.r);
      c.fillStyle = s.col === 'b' ? withAlpha(m.ink, 0.42) : withAlpha('#fff6e8', 0.45);
      c.beginPath();
      c.arc(p.x, p.y, TOP.step * 0.42, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  // rings of light on the board (under the stones)
  for (const r of o.rings ?? []) ringTop(c, env, r);
  // stones
  o.stones.forEach((s, i) => {
    const a = o.alpha ? o.alpha(i) : 1;
    if (a <= 0.01) return;
    stoneTop(c, env, topXY(s.c, s.r), s.col, a, o.glow ? o.glow(i) : 0);
  });
  // the lamp's pool: warm in the middle, the board's edges a stop down
  const lamp = o.lamp ?? 1;
  const g = c.createRadialGradient(TOP.cx - 40, TOP.cy - 60, 80, TOP.cx, TOP.cy, half * 1.9);
  g.addColorStop(0, withAlpha(m.fg, 0));
  g.addColorStop(0.55, withAlpha(m.fg, 0.18 * lamp));
  g.addColorStop(1, withAlpha(m.fg, 0.62 * lamp));
  c.fillStyle = g;
  c.fillRect(TOP.cx - half * 2, TOP.cy - half * 2, half * 4, half * 4);
}

export function stoneTop(c: C, env: PaintEnv, p: { x: number; y: number }, col: Col, a = 1, glow = 0, rr = TOP.step * 0.46) {
  const m = env.mood;
  c.save();
  c.globalAlpha *= a;
  // a small contact shadow
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.beginPath();
  c.arc(p.x + 2, p.y + 3, rr, 0, Math.PI * 2);
  c.fill();
  if (col === 'b') {
    c.fillStyle = mixLab(m.ink, m.set, 0.1);
    c.beginPath();
    c.arc(p.x, p.y, rr, 0, Math.PI * 2);
    c.fill();
    // card edge catching the lamp (upper left)
    c.strokeStyle = withAlpha(m.rim, 0.45);
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(p.x, p.y, rr - 1, Math.PI * 1.05, Math.PI * 1.65);
    c.stroke();
  } else {
    // backlit white paper: warm core, a soft edge
    const g = c.createRadialGradient(p.x - rr * 0.25, p.y - rr * 0.3, 1, p.x, p.y, rr);
    g.addColorStop(0, mixLab('#fff7ea', m.core, 0.25));
    g.addColorStop(0.8, mixLab(m.rim, '#f3e6d4', 0.5));
    g.addColorStop(1, mixLab(m.rim, m.halo, 0.4));
    c.fillStyle = g;
    c.beginPath();
    c.arc(p.x, p.y, rr, 0, Math.PI * 2);
    c.fill();
  }
  if (glow > 0.01) {
    c.globalCompositeOperation = 'lighter';
    const R = rr * 2.6;
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
    g.addColorStop(0, withAlpha(m.core, 0.9 * glow));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - R, p.y - R, 2 * R, 2 * R);
  }
  c.restore();
}

function ringTop(c: C, env: PaintEnv, r: Ring) {
  if (r.u <= 0 || r.u >= 1) return;
  const m = env.mood;
  const p = topXY(r.c, r.r);
  const R = (r.reach ?? 14) * TOP.step * easeOut(r.u);
  const k = (r.k ?? 1) * Math.pow(1 - r.u, 1.3);
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = withAlpha(m.core, 0.75 * k);
  c.lineWidth = 3;
  c.beginPath();
  c.arc(p.x, p.y, R, 0, Math.PI * 2);
  c.stroke();
  const g = c.createRadialGradient(p.x, p.y, Math.max(0, R - 26), p.x, p.y, R + 4);
  g.addColorStop(0, withAlpha(m.halo, 0));
  g.addColorStop(0.85, withAlpha(m.halo, 0.28 * k));
  g.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = g;
  c.fillRect(p.x - R - 6, p.y - R - 6, 2 * R + 12, 2 * R + 12);
  c.restore();
}
const easeOut = (u: number) => 1 - (1 - u) * (1 - u);

// ------------------------------------------------------------------------------------------------ the side view
/** the board on its table in the WIDE camera (world px): near edge y, far edge y, centre x, widths */
export const SIDE = { cx: 652, near: 494, far: 470, wNear: 150, wFar: 136, slab: 13 } as const;
export function sideXY(col: number, row: number) {
  // row 0 = far (machine's view: top of the board seen from above) … 18 = near
  const v = row / 18;
  const y = SIDE.far + (SIDE.near - SIDE.far) * v;
  const hw = (SIDE.wFar + (SIDE.wNear - SIDE.wFar) * v) / 2;
  return { x: SIDE.cx + ((col - 9) / 9) * (hw - 6), y };
}

export interface GoSideOpts {
  stones: Stone[];
  alpha?: (i: number) => number;
  rings?: Ring[];
}
export function goSide(c: C, env: PaintEnv, o: GoSideOpts) {
  const m = env.mood;
  const wood = mixLab(mixLab(m.setHaze, m.halo, 0.5), '#b48a5a', 0.18);
  const hwN = SIDE.wNear / 2, hwF = SIDE.wFar / 2;
  // the slab's front face (thickness) in ink, its top surface in lamp-lit wood
  c.fillStyle = env.fill('ink');
  c.fillRect(SIDE.cx - hwN, SIDE.near, SIDE.wNear, SIDE.slab);
  c.fillStyle = wood;
  c.beginPath();
  c.moveTo(SIDE.cx - hwF, SIDE.far);
  c.lineTo(SIDE.cx + hwF, SIDE.far);
  c.lineTo(SIDE.cx + hwN, SIDE.near);
  c.lineTo(SIDE.cx - hwN, SIDE.near);
  c.closePath();
  c.fill();
  // the grid, foreshortened
  c.strokeStyle = withAlpha(mixLab(m.ink, wood, 0.25), 0.7);
  c.lineWidth = 0.7;
  c.beginPath();
  for (let i = 0; i < 19; i++) {
    const a = sideXY(i, 0), b = sideXY(i, 18);
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    const p = sideXY(0, i), q = sideXY(18, i);
    c.moveTo(p.x, p.y);
    c.lineTo(q.x, q.y);
  }
  c.stroke();
  for (const r of o.rings ?? []) {
    if (r.u <= 0 || r.u >= 1) continue;
    const p = sideXY(r.c, r.r);
    const R = (r.reach ?? 14) * (SIDE.wNear / 18) * easeOut(r.u);
    const k = (r.k ?? 1) * Math.pow(1 - r.u, 1.3);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(m.core, 0.8 * k);
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(p.x, p.y, R, R * ((SIDE.near - SIDE.far) / SIDE.wNear), 0, 0, Math.PI * 2);
    c.stroke();
    c.restore();
  }
  // stones: small ellipses, black card / white paper
  o.stones.forEach((s, i) => {
    const a = o.alpha ? o.alpha(i) : 1;
    if (a <= 0.01) return;
    const p = sideXY(s.c, s.r);
    c.globalAlpha = a;
    c.fillStyle = s.col === 'b' ? mixLab(m.ink, m.set, 0.1) : mixLab('#fff4e6', m.rim, 0.35);
    c.beginPath();
    c.ellipse(p.x, p.y - 1, 3.6, 1.9, 0, 0, Math.PI * 2);
    c.fill();
    c.globalAlpha = 1;
  });
}

// ------------------------------------------------------------------------------------------------ bowls + hands
export interface BowlOpts {
  x: number;
  /** table top y */
  y: number;
  col: Col;
  /** lid: 0 = lying on the table beside the bowl, 1 = on */
  lid: number;
  s?: number;
  /** lid rests on this side when off (+1 right, -1 left) */
  side?: number;
}
export function bowl(c: C, env: PaintEnv, o: BowlOpts) {
  const s = o.s ?? 1;
  const ink = env.fill('ink');
  const w = 30 * s, h = 18 * s;
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(o.x - w / 2, o.y - h * 0.75);
  c.bezierCurveTo(o.x - w / 2, o.y - h * 0.1, o.x - w * 0.3, o.y, o.x - w * 0.18, o.y);
  c.lineTo(o.x + w * 0.18, o.y);
  c.bezierCurveTo(o.x + w * 0.3, o.y, o.x + w / 2, o.y - h * 0.1, o.x + w / 2, o.y - h * 0.75);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(env.mood.rim, 0.4);
  c.fillRect(o.x - w / 2, o.y - h * 0.78, w, 1.1 * s);
  // the stones heaped inside (a low dome above the rim) while the lid is off
  const u = Math.max(0, Math.min(1, o.lid));
  if (u < 0.98) {
    c.fillStyle = o.col === 'b' ? mixLab(ink, env.mood.set, 0.2) : mixLab('#f6ead8', env.mood.rim, 0.4);
    c.beginPath();
    c.ellipse(o.x, o.y - h * 0.78, w * 0.42, 4 * s, 0, Math.PI, 0);
    c.fill();
  }
  // the lid: from the table beside the bowl, lifted and set on (on twos by the caller)
  const side = o.side ?? 1;
  const lx = o.x + side * w * 1.05 * (1 - u);
  const arc = Math.sin(Math.PI * u) * 22 * s;
  const ly = (o.y - 3 * s) * (1 - u) + (o.y - h * 0.78 - 2 * s) * u - arc;
  c.fillStyle = ink;
  c.beginPath();
  c.ellipse(lx, ly, w * 0.52, 4.2 * s, 0, Math.PI, 0);
  c.lineTo(lx + w * 0.52, ly + 2 * s);
  c.lineTo(lx - w * 0.52, ly + 2 * s);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(env.mood.rim, 0.35);
  c.fillRect(lx - w * 0.4, ly - 4.2 * s, w * 0.8, 0.9 * s);
}

export interface HandOpts {
  /** fingertip point (where the stone is held), world */
  x: number;
  y: number;
  /** direction the forearm points (radians, wrist → fingertips) */
  angle: number;
  who: 'machine' | 'lee';
  stone?: Col | null;
  /** hand length (px) */
  len?: number;
  /** stone radius to draw in the fingers */
  stoneR?: number;
}
/** a forearm reaching in from a frame edge to set a stone (top view): rigid paper parts, held stone between fingers */
export function castHand(c: C, env: PaintEnv, o: HandOpts) {
  const m = env.mood;
  const L = o.len ?? 120;
  // seen from above, the forearm rises toward the lens: a SHORT sleeve (≈ 2 hand lengths, < 250 px) that fades into
  // the dark toward its far end, so it reads as an arm coming down from the player's side, never as a rod
  const sleeveL = L * 2.0;
  const ink = o.who === 'lee' ? mixLab(m.ink, m.set, 0.12) : m.ink;
  c.save();
  c.translate(o.x, o.y);
  c.rotate(o.angle);
  // the sleeve (tapering wider toward the lens), faded at its far end
  const sg = c.createLinearGradient(-L * 0.62 - sleeveL, 0, -L * 0.62, 0);
  sg.addColorStop(0, withAlpha(ink, 0));
  sg.addColorStop(0.45, withAlpha(ink, 0.92));
  sg.addColorStop(1, ink);
  c.fillStyle = sg;
  c.beginPath();
  c.moveTo(-L * 0.6, -L * 0.19);
  c.lineTo(-L * 0.62 - sleeveL, -L * 0.27);
  c.lineTo(-L * 0.62 - sleeveL, L * 0.27);
  c.lineTo(-L * 0.6, L * 0.19);
  c.closePath();
  c.fill();
  // the shirt cuff: Lee's pale; the machine's operator's a muted grey (anonymous, but a person's hand)
  c.fillStyle = o.who === 'lee' ? mixLab(m.rim, '#efe4d4', 0.35) : mixLab(m.set, m.rim, 0.45);
  c.beginPath();
  c.moveTo(-L * 0.6, -L * 0.185);
  c.lineTo(-L * 0.68, -L * 0.2);
  c.lineTo(-L * 0.68, L * 0.2);
  c.lineTo(-L * 0.6, L * 0.185);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(m.rim, 0.3);
  c.fillRect(-L * 0.62 - sleeveL * 0.55, -L * 0.24, sleeveL * 0.55, 1.1);
  // the hand: back of the hand, knuckles, then index and middle fingers extended together, the stone pinched
  // between their tips (the Go grip); thumb and curled fingers tucked under
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-L * 0.6, -L * 0.17);
  c.quadraticCurveTo(-L * 0.42, -L * 0.21, -L * 0.3, -L * 0.13);
  // index finger (upper), its tip just past the stone's upper edge
  c.quadraticCurveTo(-L * 0.16, -L * 0.1, -L * 0.02, -L * 0.075);
  c.quadraticCurveTo(L * 0.05, -L * 0.07, L * 0.05, -L * 0.035);
  c.quadraticCurveTo(L * 0.0, -L * 0.02, -L * 0.1, -L * 0.03);
  // the gap between the two fingertips (where the stone sits) — middle finger (lower)
  c.lineTo(-L * 0.1, L * 0.02);
  c.quadraticCurveTo(L * 0.02, L * 0.025, L * 0.04, L * 0.055);
  c.quadraticCurveTo(L * 0.02, L * 0.09, -L * 0.06, L * 0.085);
  c.quadraticCurveTo(-L * 0.2, L * 0.1, -L * 0.3, L * 0.14);
  // curled ring/little fingers and the heel of the hand
  c.quadraticCurveTo(-L * 0.36, L * 0.22, -L * 0.46, L * 0.2);
  c.quadraticCurveTo(-L * 0.54, L * 0.2, -L * 0.6, L * 0.17);
  c.closePath();
  c.fill();
  // a knuckle line catching the lamp
  c.strokeStyle = withAlpha(m.rim, 0.35);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-L * 0.52, -L * 0.18);
  c.quadraticCurveTo(-L * 0.4, -L * 0.2, -L * 0.3, -L * 0.135);
  c.stroke();
  c.restore();
  if (o.stone) stoneTop(c, env, { x: o.x, y: o.y }, o.stone, 1, 0, o.stoneR ?? TOP.step * 0.42);
}
