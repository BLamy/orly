/**
 * neural-net-history — the Case Board (staging.caseBoard, BOARD MAP), the oxblood question thread and
 * the clue cards' paper-cut icons. A dark corkboard lit by the green-shaded lamp's pool; paper cards
 * pinned with brass pins; threads of light between clues; question cards hanging from the top thread.
 *
 *   caseBoard(c, { x, y, k, state, pool }, env)           draw the whole board from boardStateAt(...)
 *   drawCard(c, slotDef, { x, y, k, pool, alpha }, env)   one card (for a shot animating a pin / a drop)
 *   cardIcon(c, icon, cx, cy, size, env, ink)             the paper-cut object on a card
 *   boardToWorld(o, bx, by)                               board units → layer px (for hands targets)
 *
 * Board units: the cork is BOARD.w × BOARD.h (1000 × 620), origin at its top-left; (x, y) is where that
 * origin lands in the layer, k is layer px per board unit. Cards hang from a pin at their top centre.
 * The lamp pool: { cx, cy, r } in board units (default: centred on K, warm, falling off to the edges);
 * colour comes from env (candleAmber in every study visit: STUDY LOCK).
 */
import type { PaintEnv } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/core/frame';
import { filigreeCorner } from './occluders';
import { BOARD, SLOTS, type BoardState, type CardIcon, type SlotDef, type SlotId } from './studyState';

export interface Pool {
  cx: number;
  cy: number;
  r: number;
  /** 0..1 lamp intensity (the lamp clicks on in ch01-s04) */
  k?: number;
}
export const DEFAULT_POOL: Pool = { cx: 520, cy: 330, r: 560, k: 1 };

export interface BoardDraw {
  x: number;
  y: number;
  /** layer px per board unit */
  k: number;
  state: BoardState;
  pool?: Pool;
  /** hide these slots (a shot animating them itself) */
  hide?: SlotId[];
  /** draw faint pin-holes at every empty slot (ch01-s04's empty board) */
  pinHoles?: boolean;
  /** 0..1: the threads of light's brightness (they pulse once when a new tie is made) */
  threadGlow?: number;
  /** extra glints on the oxblood thread (0..1) */
  threadGlint?: number;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
/** lamp light at a board point (0 at the rim of the pool → 1 at its heart) */
export function poolAt(p: Pool, x: number, y: number): number {
  const d = Math.hypot((x - p.cx) / 1.15, y - p.cy) / p.r;
  const u = clamp01(1 - d);
  return (p.k ?? 1) * u * u * (3 - 2 * u);
}
/** the oxblood question thread colour (emberRed rim mixed ~60% into candleAmber's set): low chroma */
export function oxblood(env: PaintEnv, lift = 0) {
  return mixLab(mixLab(MOODS.emberRed.rim, env.mood.set, 0.6), env.mood.halo, lift);
}
/** card paper under the lamp: from shadowed paper (set) to lamp-lit paper (rim/halo) */
export function paperTone(env: PaintEnv, light: number) {
  const lit = mixLab(env.mood.halo, env.mood.rim, 0.62);
  return mixLab(mixLab(env.mood.set, env.mood.setHaze, 0.6), lit, clamp01(0.12 + light * 0.95));
}
export function boardToWorld(o: Pick<BoardDraw, 'x' | 'y' | 'k'>, bx: number, by: number) {
  return { x: o.x + bx * o.k, y: o.y + by * o.k };
}
/** the pin point (top centre) of a slot, in layer px */
export function slotPin(o: Pick<BoardDraw, 'x' | 'y' | 'k'>, id: SlotId) {
  const s = SLOTS[id];
  return boardToWorld(o, s.x, s.y - s.h / 2 + 7);
}

// ---------------------------------------------------------------- cork
const corkCache = new Map<string, HTMLCanvasElement>();
function corkTexture(env: PaintEnv, pool: Pool): HTMLCanvasElement {
  const key = `${env.mood.id}/${pool.cx},${pool.cy},${pool.r},${(pool.k ?? 1).toFixed(2)}`;
  let cv = corkCache.get(key);
  if (cv) return cv;
  cv = document.createElement('canvas');
  const S = 0.6; // texture px per board unit
  cv.width = Math.ceil(BOARD.w * S);
  cv.height = Math.ceil(BOARD.h * S);
  const c = cv.getContext('2d')!;
  c.scale(S, S);
  // dark cork, warmed by the pool
  const dark = mixLab(env.mood.set, env.mood.fg, 0.35);
  const warm = mixLab(env.mood.setHaze, env.mood.halo, 0.42);
  c.fillStyle = dark;
  c.fillRect(0, 0, BOARD.w, BOARD.h);
  const k = pool.k ?? 1;
  const g = c.createRadialGradient(pool.cx, pool.cy, 10, pool.cx, pool.cy, pool.r * 1.1);
  g.addColorStop(0, withAlpha(warm, 0.95 * k));
  g.addColorStop(0.45, withAlpha(mixLab(warm, dark, 0.35), 0.8 * k));
  g.addColorStop(1, withAlpha(dark, 0));
  c.save();
  c.translate(pool.cx, pool.cy);
  c.scale(1.15, 1);
  c.translate(-pool.cx, -pool.cy);
  c.fillStyle = g;
  c.fillRect(-200, -200, BOARD.w + 400, BOARD.h + 400);
  c.restore();
  // cork grain: seeded flecks (static)
  for (let i = 0; i < 2600; i++) {
    const x = (hash1(i, 71) * 0.5 + 0.5) * BOARD.w;
    const y = (hash1(i, 72) * 0.5 + 0.5) * BOARD.h;
    const r = 0.8 + (hash1(i, 73) * 0.5 + 0.5) * 2.2;
    const lite = hash1(i, 74) > 0;
    c.fillStyle = withAlpha(lite ? env.mood.halo : env.mood.fg, 0.05 + 0.07 * (hash1(i, 75) * 0.5 + 0.5) * (0.4 + poolAt(pool, x, y)));
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  corkCache.set(key, cv);
  if (corkCache.size > 24) corkCache.delete(corkCache.keys().next().value as string);
  return cv;
}

/** the board frame (a dark moulded frame, rim-lit on its top edge by the lamp) */
function frame(c: CanvasRenderingContext2D, o: BoardDraw, env: PaintEnv) {
  const { x, y, k } = o;
  const W = BOARD.w * k, H = BOARD.h * k, b = 16 * k;
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.rect(x - b, y - b, W + 2 * b, H + 2 * b);
  c.rect(x, y, W, H);
  c.fill('evenodd');
  c.strokeStyle = withAlpha(env.mood.rim, 0.35);
  c.lineWidth = 1.2 * k;
  c.beginPath();
  c.moveTo(x - b + 2 * k, y - b + 2 * k);
  c.lineTo(x + W + b - 2 * k, y - b + 2 * k);
  c.moveTo(x - 3 * k, y - 3 * k);
  c.lineTo(x + W + 3 * k, y - 3 * k);
  c.stroke();
  // cut-paper filigree at the four corners, overlapping the frame (review round 1: filigree on the recurring sets)
  const fs = 78 * k;
  filigreeCorner(c, { x: x - b * 0.6, y: y - b * 0.6, size: fs, rot: 0 }, env);
  filigreeCorner(c, { x: x + W + b * 0.6, y: y - b * 0.6, size: fs, rot: Math.PI / 2 }, env);
  filigreeCorner(c, { x: x + W + b * 0.6, y: y + H + b * 0.6, size: fs, rot: Math.PI }, env);
  filigreeCorner(c, { x: x - b * 0.6, y: y + H + b * 0.6, size: fs, rot: -Math.PI / 2 }, env);
}

// ---------------------------------------------------------------- icons (paper-cut objects, ink on paper)
/** draw a card's object icon centred at (cx, cy), fitting a box of `size` (layer px) */
export function cardIcon(c: CanvasRenderingContext2D, icon: CardIcon, cx: number, cy: number, size: number, env: PaintEnv, ink: string, opts: { lit?: number; light?: string } = {}) {
  const s = size / 100;
  c.save();
  c.translate(cx, cy);
  c.scale(s, s);
  c.fillStyle = ink;
  c.strokeStyle = ink;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const P = new Path2D();
  const lightCol = opts.light ?? env.mood.core;
  switch (icon) {
    case 'lantern': {
      // a paper lantern with a wick: cap, ribbed body, base; lit = glow inside
      P.rect(-10, -44, 20, 7);
      P.moveTo(-2, -52);
      P.rect(-2, -52, 4, 9);
      P.ellipse(0, -2, 30, 36, 0, 0, Math.PI * 2);
      P.rect(-12, 32, 24, 7);
      c.fill(P);
      const lit = opts.lit ?? 0;
      // ribs (cut through to the paper, or glowing when lit)
      c.strokeStyle = lit > 0 ? withAlpha(lightCol, 0.4 + 0.6 * lit) : withAlpha(env.mood.halo, 0.35);
      c.lineWidth = 2.2;
      for (const rx of [-16, 0, 16]) {
        c.beginPath();
        c.ellipse(0, -2, Math.abs(rx) + 2, 33, 0, -Math.PI / 2, Math.PI / 2, rx < 0);
        if (rx === 0) {
          c.moveTo(0, -35);
          c.lineTo(0, 31);
        }
        c.stroke();
      }
      if (lit > 0) {
        const g = c.createRadialGradient(0, 0, 2, 0, 0, 34);
        g.addColorStop(0, withAlpha(lightCol, 0.9 * lit));
        g.addColorStop(1, withAlpha(lightCol, 0));
        c.fillStyle = g;
        c.beginPath();
        c.ellipse(0, -2, 27, 33, 0, 0, Math.PI * 2);
        c.fill();
      }
      break;
    }
    case 'threshold-lantern': {
      // the 1943 THRESHOLD lantern (ch02-s02's logic lantern, X-ray band 1, clue C1): a squared paper barrel
      // on a cord, capped top and bottom, a tassel, and a window on its WICK and flame tip (all or none) —
      // never the LEARNING suspect's oval cocoon
      const h = 33, w = 25;
      const halfW = (y: number) => {
        const u = Math.min(1, Math.abs(y) / h);
        return w * Math.pow(Math.max(0, 1 - Math.pow(u, 2.4)), 0.42) + 5 * (1 - u);
      };
      P.rect(-1.5, -h - 15, 3, 10); // cord
      P.rect(-13, -h - 5, 26, 6); // top cap
      P.rect(-11, h - 1, 22, 5); // bottom cap
      const N = 20;
      for (let i = 0; i <= N; i++) {
        const y = -h + (2 * h * i) / N;
        i ? P.lineTo(halfW(y), y) : P.moveTo(halfW(y), y);
      }
      for (let i = N; i >= 0; i--) {
        const y = -h + (2 * h * i) / N;
        P.lineTo(-halfW(y), y);
      }
      P.closePath();
      c.fill(P);
      c.lineWidth = 2.4;
      c.beginPath();
      for (const dx of [-5, 0, 5]) {
        c.moveTo(0, h + 4);
        c.lineTo(dx * 1.4, h + 15);
      }
      c.stroke();
      const lit = opts.lit ?? 0;
      // the paper's ribs (faint cut-lines)
      c.strokeStyle = withAlpha(env.mood.halo, 0.28 + 0.3 * lit);
      c.lineWidth = 1.6;
      for (const ry of [-18, 18]) {
        c.beginPath();
        c.moveTo(-halfW(ry) + 3, ry);
        c.quadraticCurveTo(0, ry + 3, halfW(ry) - 3, ry);
        c.stroke();
      }
      // the window on the flame: a teardrop flame tip over a short ink wick
      const fl = lit > 0 ? withAlpha(mixLab(lightCol, env.mood.halo, 0.2), 0.55 + 0.45 * lit) : withAlpha(mixLab(env.mood.halo, env.mood.core, 0.4), 0.8);
      c.fillStyle = fl;
      c.beginPath();
      c.moveTo(0, -20);
      c.bezierCurveTo(9, -6, 9, 10, 0, 12);
      c.bezierCurveTo(-9, 10, -9, -6, 0, -20);
      c.fill();
      c.fillStyle = ink;
      c.fillRect(-1.6, 6, 3.2, 12); // the wick
      if (lit > 0) {
        const g = c.createRadialGradient(0, 0, 2, 0, 0, 30);
        g.addColorStop(0, withAlpha(lightCol, 0.7 * lit));
        g.addColorStop(1, withAlpha(lightCol, 0));
        c.fillStyle = g;
        c.beginPath();
        c.arc(0, 0, 30, 0, Math.PI * 2);
        c.fill();
      }
      break;
    }
    case 'key-tree': {
      // a branching tree (rules) with a key laid over it
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(0, 40);
      c.lineTo(0, 0);
      c.moveTo(0, 10);
      c.lineTo(-26, -18);
      c.moveTo(0, 10);
      c.lineTo(26, -18);
      c.moveTo(-26, -18);
      c.lineTo(-38, -40);
      c.moveTo(-26, -18);
      c.lineTo(-14, -40);
      c.moveTo(26, -18);
      c.lineTo(14, -40);
      c.moveTo(26, -18);
      c.lineTo(38, -40);
      c.stroke();
      for (const [x, y] of [[-38, -40], [-14, -40], [14, -40], [38, -40]]) {
        P.moveTo(x + 5, y);
        P.arc(x, y, 5, 0, Math.PI * 2);
      }
      // the key
      P.moveTo(-40 + 13, 18);
      P.arc(-40, 18, 13, 0, Math.PI * 2);
      P.rect(-28, 15, 62, 6);
      P.rect(22, 21, 5, 9);
      P.rect(30, 21, 4, 7);
      c.fill(P, 'nonzero');
      c.fillStyle = withAlpha(env.mood.halo, 0.6);
      c.beginPath();
      c.arc(-40, 18, 6, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 'drawer': {
      // a small drawer of index cards
      P.rect(-40, -6, 80, 40);
      c.fill(P);
      c.fillStyle = withAlpha(env.mood.halo, 0.55);
      c.fillRect(-8, 10, 16, 6);
      c.fillStyle = ink;
      for (let i = 0; i < 7; i++) {
        const xx = -34 + i * 10;
        c.save();
        c.translate(xx, -6);
        c.rotate((i - 3) * 0.04);
        c.fillRect(-1, -26 + (i % 3) * 4, 8, 24 - (i % 3) * 4);
        c.restore();
      }
      break;
    }
    case 'knob': {
      // a potentiometer knob: ticks round a fluted knob, pointer line
      for (let i = 0; i < 11; i++) {
        const a = Math.PI * (0.75 + (1.5 * i) / 10);
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(Math.cos(a) * 40, Math.sin(a) * 40);
        c.lineTo(Math.cos(a) * 46, Math.sin(a) * 46);
        c.stroke();
      }
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        P.moveTo(Math.cos(a) * 33, Math.sin(a) * 33);
        P.arc(Math.cos(a) * 30, Math.sin(a) * 30, 5, 0, Math.PI * 2);
      }
      P.moveTo(31, 0);
      P.arc(0, 0, 31, 0, Math.PI * 2);
      c.fill(P);
      c.strokeStyle = withAlpha(env.mood.halo, 0.75);
      c.lineWidth = 4;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(-0.9) * 24, Math.sin(-0.9) * 24);
      c.stroke();
      break;
    }
    case 'scissors': {
      // black paper scissors making two cuts (two dashed cut lines)
      c.save();
      c.rotate(-0.25);
      P.ellipse(-30, -12, 13, 9, 0.2, 0, Math.PI * 2);
      P.ellipse(-30, 12, 13, 9, -0.2, 0, Math.PI * 2);
      c.fill(P, 'nonzero');
      c.fillStyle = withAlpha(env.mood.halo, 0.6);
      c.beginPath();
      c.ellipse(-30, -12, 7, 4.5, 0.2, 0, Math.PI * 2);
      c.ellipse(-30, 12, 7, 4.5, -0.2, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = ink;
      c.beginPath();
      c.moveTo(-20, -8);
      c.lineTo(36, 4);
      c.lineTo(38, 0);
      c.closePath();
      c.moveTo(-20, 8);
      c.lineTo(36, -4);
      c.lineTo(38, 0);
      c.closePath();
      c.fill();
      c.restore();
      c.setLineDash([6, 6]);
      c.lineWidth = 2.5;
      c.beginPath();
      c.moveTo(-46, 40);
      c.lineTo(46, -6);
      c.moveTo(-46, 6);
      c.lineTo(46, 46);
      c.stroke();
      c.setLineDash([]);
      break;
    }
    case 'bead': {
      // a bead of light running BACKWARD along a string (an arrow pointing back)
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-46, 10);
      c.quadraticCurveTo(0, 30, 46, 10);
      c.stroke();
      c.beginPath();
      c.moveTo(-46, 10);
      c.lineTo(-34, 2);
      c.moveTo(-46, 10);
      c.lineTo(-33, 18);
      c.stroke();
      for (const [x, r] of [[-30, 5], [30, 5], [0, 5]] as const) {
        c.beginPath();
        c.arc(x, 0 + (x === 0 ? 20 : 15), r, 0, Math.PI * 2);
        c.fill();
      }
      const g = c.createRadialGradient(10, 19, 1, 10, 19, 16);
      g.addColorStop(0, withAlpha(lightCol, 0.95));
      g.addColorStop(0.4, withAlpha(lightCol, 0.5));
      g.addColorStop(1, withAlpha(lightCol, 0));
      c.fillStyle = ink;
      c.beginPath();
      c.arc(10, 19, 7, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = g;
      c.beginPath();
      c.arc(10, 19, 16, 0, Math.PI * 2);
      c.fill();
      break;
    }
    case 'stencil-pipe': {
      // a pierced 3×3 tin stencil and, beside it, a small straight pipe
      P.rect(-46, -30, 54, 54);
      c.fill(P);
      c.fillStyle = withAlpha(env.mood.halo, 0.7);
      const holes = [3, 1, 0, 2, 4, 1, 0, 2, 3];
      holes.forEach((h, i) => {
        if (!h) return;
        c.beginPath();
        c.arc(-37 + (i % 3) * 18, -21 + Math.floor(i / 3) * 18, 1.5 + h * 1.3, 0, Math.PI * 2);
        c.fill();
      });
      c.fillStyle = ink;
      c.fillRect(18, -30, 14, 54);
      c.fillRect(15, -32, 20, 5);
      c.fillRect(15, 21, 20, 5);
      break;
    }
    case 'tiles': {
      // a grid of a thousand tiny tiles (data): drawn as 10 × 7 with seeded light/dark
      for (let j = 0; j < 7; j++)
        for (let i = 0; i < 10; i++) {
          const v = hash1(i + j * 10, 91);
          c.fillStyle = v > -0.2 ? ink : withAlpha(ink, 0.45);
          c.fillRect(-45 + i * 9, -32 + j * 9, 7.5, 7.5);
        }
      break;
    }
    case 'furnaces': {
      // two small furnaces (graphics cards as fire): body, chimney, glowing mouth
      for (const dx of [-24, 24]) {
        P.rect(dx - 18, -14, 36, 42);
        P.moveTo(dx - 14, -14);
        P.lineTo(dx - 4, -30);
        P.lineTo(dx + 4, -30);
        P.lineTo(dx + 14, -14);
        P.closePath();
        P.rect(dx - 4, -46, 8, 18);
      }
      c.fill(P);
      for (const dx of [-24, 24]) {
        const g = c.createLinearGradient(0, 4, 0, 22);
        g.addColorStop(0, withAlpha(lightCol, 0.95));
        g.addColorStop(1, withAlpha(env.mood.halo, 0.6));
        c.fillStyle = g;
        c.beginPath();
        c.moveTo(dx - 10, 22);
        c.lineTo(dx - 10, 10);
        c.arc(dx, 10, 10, Math.PI, 0);
        c.lineTo(dx + 10, 22);
        c.closePath();
        c.fill();
      }
      break;
    }
    case 'filter': {
      // one learned filter tile: a grey striped edge
      c.fillStyle = withAlpha(ink, 0.25);
      c.fillRect(-36, -36, 72, 72);
      c.save();
      c.beginPath();
      c.rect(-36, -36, 72, 72);
      c.clip();
      c.rotate(-0.5);
      for (let i = -6; i <= 6; i++) {
        c.fillStyle = withAlpha(ink, i % 2 === 0 ? 0.85 : 0.15);
        c.fillRect(i * 9, -70, 9, 140);
      }
      c.restore();
      c.lineWidth = 3;
      c.strokeRect(-36, -36, 72, 72);
      break;
    }
    case 'thread': {
      // two word-slips with a thread of light between them
      P.rect(-48, 6, 34, 18);
      P.rect(14, -26, 34, 18);
      c.fill(P);
      c.strokeStyle = withAlpha(lightCol, 0.95);
      c.lineWidth = 3.2;
      c.beginPath();
      c.moveTo(-31, 6);
      c.quadraticCurveTo(-4, -30, 31, -8);
      c.stroke();
      c.strokeStyle = withAlpha(lightCol, 0.35);
      c.lineWidth = 8;
      c.stroke();
      break;
    }
    case 'sort': {
      // a single type sort: a tall metal block, the raised letter on its face, the nick
      P.rect(-14, -40, 28, 78);
      c.fill(P);
      c.fillStyle = withAlpha(env.mood.halo, 0.5);
      c.fillRect(-14, 18, 28, 3);
      c.font = `700 30px ${FONT.display}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = withAlpha(env.mood.halo, 0.75);
      c.fillText('a', 0, -16);
      break;
    }
    case 'shears': {
      // a pair of garden shears: two long blades, two handles, a pivot
      c.save();
      c.rotate(-0.15);
      c.beginPath();
      c.moveTo(-6, -2);
      c.lineTo(46, -16);
      c.lineTo(48, -10);
      c.lineTo(-2, 6);
      c.closePath();
      c.moveTo(-6, 2);
      c.lineTo(46, 16);
      c.lineTo(48, 10);
      c.lineTo(-2, -6);
      c.closePath();
      c.fill();
      c.lineWidth = 8;
      c.beginPath();
      c.moveTo(-6, 0);
      c.lineTo(-48, -18);
      c.moveTo(-6, 0);
      c.lineTo(-48, 18);
      c.stroke();
      c.fillStyle = withAlpha(env.mood.halo, 0.7);
      c.beginPath();
      c.arc(-4, 0, 3, 0, Math.PI * 2);
      c.fill();
      c.restore();
      break;
    }
    case 'row': {
      // a loose row of small cards
      for (let i = 0; i < 6; i++) {
        c.save();
        c.translate(-44 + i * 17.6, (i % 2) * 4 - 2);
        c.rotate(hash1(i, 31) * 0.12);
        c.fillStyle = withAlpha(ink, 0.85);
        c.fillRect(-7, -12, 14, 22);
        c.restore();
      }
      break;
    }
    case 'announcement': {
      // a typewritten announcement: lines of type
      for (let i = 0; i < 6; i++) c.fillRect(-40, -26 + i * 10, i === 0 ? 50 : 80 - (i % 3) * 12, 3);
      break;
    }
    case 'chatbox': {
      // the glowing chat box: a lit rectangle, lines of text, a cursor
      const g = c.createLinearGradient(0, -50, 0, 50);
      g.addColorStop(0, withAlpha(MOODS.serverCyan.halo, 0.85));
      g.addColorStop(1, withAlpha(MOODS.serverCyan.core, 0.95));
      c.fillStyle = ink;
      c.fillRect(-42, -60, 84, 120);
      c.fillStyle = g;
      c.fillRect(-36, -54, 72, 108);
      c.fillStyle = withAlpha(ink, 0.55);
      for (let i = 0; i < 6; i++) c.fillRect(-28, -42 + i * 13, 56 - (i % 3) * 10, 3);
      c.fillRect(-28, 36, 6, 10);
      break;
    }
    case 'typed':
    case 'question':
      break;
  }
  c.restore();
}

// ---------------------------------------------------------------- text
function wrapWords(c: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (c.measureText(t).width > maxW && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}
/** typed lettering (Special Elite) centred in a box; shrinks to fit */
export function typedText(c: CanvasRenderingContext2D, text: string, cx: number, cy: number, w: number, h: number, ink: string, size0: number) {
  let size = size0;
  let lines: string[] = [];
  for (let i = 0; i < 6; i++) {
    c.font = `400 ${size}px ${FONT.typewriter}`;
    lines = wrapWords(c, text, w);
    const widest = Math.max(...lines.map((l) => c.measureText(l).width));
    if (lines.length * size * 1.15 <= h && widest <= w * 1.02) break;
    size *= 0.85;
  }
  c.fillStyle = ink;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const lh = size * 1.15;
  lines.forEach((l, i) => c.fillText(l, cx, cy + (i - (lines.length - 1) / 2) * lh));
}

// ---------------------------------------------------------------- one card
export interface CardDraw {
  /** card centre in layer px */
  x: number;
  y: number;
  /** layer px per board unit */
  k: number;
  /** lamp light 0..1 on this card */
  light: number;
  alpha?: number;
  /** extra rotation (a drop, a tilt) */
  rot?: number;
  /** draw the brass pin (false while a hand carries it) */
  pin?: boolean;
  /** S3 lantern: 0 dark … 1 glowing */
  lanternLit?: number;
  /** a card lit from within (S2, Helsinki) */
  lit?: boolean;
  /** greyed out (the finale's verdict on S1, S2) */
  grey?: boolean;
  /** STATUS: OPEN stamp (K, ch15-s09): 0..1 ink */
  stamp?: number;
}

export function drawCard(c: CanvasRenderingContext2D, def: { id: string; w: number; h: number; icon: CardIcon; text?: string }, o: CardDraw, env: PaintEnv) {
  const w = def.w * o.k, h = def.h * o.k;
  const seedRot = hash1(def.id.length * 31 + def.id.charCodeAt(def.id.length - 1), 17) * 0.025;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.translate(o.x, o.y);
  c.rotate(seedRot + (o.rot ?? 0));
  // card hangs from its pin at the top centre: the paper, a soft contact shadow, the object, the type
  const light = o.grey ? o.light * 0.45 : o.light;
  const paper = paperTone(env, light);
  c.fillStyle = withAlpha(env.mood.fg, 0.35);
  c.fillRect(-w / 2 + 2.5 * o.k, -h / 2 + 3.5 * o.k, w, h);
  c.fillStyle = paper;
  c.fillRect(-w / 2, -h / 2, w, h);
  // a lamp-lit card has a faint rim on its top edge
  c.fillStyle = withAlpha(env.mood.rim, 0.25 * light);
  c.fillRect(-w / 2, -h / 2, w, 1.2 * o.k);
  const ink = mixLab(env.mood.ink, paper, o.grey ? 0.45 : 0.08);
  const hasIcon = def.icon !== 'typed' && def.icon !== 'question' && def.icon !== 'announcement';
  if (def.id === 'K' || def.icon === 'typed' || def.icon === 'question') {
    typedText(c, def.text ?? '', 0, 2 * o.k, w * 0.84, h * 0.72, ink, (def.id === 'K' ? 19 : 11) * o.k);
    if (def.id === 'C1-c') {
      // the false clue's oxblood question mark tag
      c.fillStyle = oxblood(env, 0.15);
      c.font = `700 ${16 * o.k}px ${FONT.display}`;
      c.fillText('?', w / 2 - 9 * o.k, -h / 2 + 12 * o.k);
    }
  } else if (def.icon === 'announcement') {
    cardIcon(c, 'announcement', 0, 6 * o.k, h * 0.9, env, withAlpha(ink, 0.55));
    c.font = `400 ${8.2 * o.k}px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = ink;
    c.fillText(def.text ?? '', 0, -h / 2 + 10 * o.k);
  } else if (hasIcon) {
    const iconH = def.text ? h * 0.66 : h * 0.86;
    cardIcon(c, def.icon, 0, -h / 2 + 5 * o.k + iconH / 2, Math.min(w * 0.8, iconH), env, ink, { lit: o.lanternLit });
    if (def.text) {
      let fs = (def.text.length > 6 ? 9.5 : 11) * o.k;
      c.font = `400 ${fs}px ${FONT.typewriter}`;
      const tw = c.measureText(def.text).width;
      if (tw > w * 0.9) {
        fs *= (w * 0.9) / tw;
        c.font = `400 ${fs}px ${FONT.typewriter}`;
      }
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = ink;
      c.fillText(def.text, 0, h / 2 - 9 * o.k);
    }
  }
  if (o.lit) {
    // lit from within: a warm wash and a hairline glow at the edges
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = withAlpha(env.mood.halo, 0.22);
    c.fillRect(-w / 2, -h / 2, w, h);
    c.globalCompositeOperation = 'source-over';
  }
  if (o.stamp && o.stamp > 0) {
    // STATUS: OPEN — the film's one full-saturation red (ch15-s09)
    c.save();
    c.rotate(-0.12);
    c.globalAlpha *= o.stamp;
    c.strokeStyle = '#b3261e';
    c.fillStyle = '#b3261e';
    c.lineWidth = 2.4 * o.k;
    c.strokeRect(-w * 0.38, h * 0.08, w * 0.76, h * 0.3);
    c.font = `400 ${12 * o.k}px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('STATUS: OPEN', 0, h * 0.23);
    c.restore();
  }
  if (o.pin !== false) {
    // brass pin: head with a highlight
    c.fillStyle = mixLab(env.mood.halo, env.mood.set, 0.35);
    c.beginPath();
    c.arc(0, -h / 2 + 7 * o.k, 4.2 * o.k, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(env.mood.core, 0.55 * (0.3 + light));
    c.beginPath();
    c.arc(-1.2 * o.k, -h / 2 + 5.8 * o.k, 1.6 * o.k, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ---------------------------------------------------------------- the whole board
export function caseBoard(c: CanvasRenderingContext2D, o: BoardDraw, env: PaintEnv) {
  const pool = o.pool ?? DEFAULT_POOL;
  const { x, y, k, state } = o;
  frame(c, o, env);
  c.drawImage(corkTexture(env, pool), x, y, BOARD.w * k, BOARD.h * k);
  const hide = new Set(o.hide ?? []);
  const present = new Set(state.cards.map((d) => d.id));

  // pin-holes at empty slots (the board's grid is there from the start)
  if (o.pinHoles !== false) {
    c.fillStyle = withAlpha(env.mood.fg, 0.55);
    for (const s of Object.values(SLOTS)) {
      if (present.has(s.id) && !hide.has(s.id)) continue;
      const p = slotPin(o, s.id);
      c.beginPath();
      c.arc(p.x, p.y, 1.6 * k, 0, Math.PI * 2);
      c.fill();
    }
  }

  // the oxblood question thread along the top edge: glints only where the pool falls
  const ty = y + BOARD.threadY * k;
  const thread = oxblood(env);
  c.strokeStyle = thread;
  c.lineWidth = 1.6 * k;
  c.beginPath();
  c.moveTo(x + 40 * k, ty);
  const sagAt = (bx: number) => ty + Math.sin(((bx - 40) / 920) * Math.PI) * 10 * k;
  for (let bx = 40; bx <= 960; bx += 20) c.lineTo(x + bx * k, sagAt(bx));
  c.stroke();
  // glint (lamp pool on the thread)
  const gl = c.createLinearGradient(x + (pool.cx - 220) * k, 0, x + (pool.cx + 220) * k, 0);
  const gA = 0.32 * (pool.k ?? 1) * (0.7 + 0.6 * (o.threadGlint ?? 0));
  gl.addColorStop(0, withAlpha(oxblood(env, 0.55), 0));
  gl.addColorStop(0.5, withAlpha(oxblood(env, 0.55), gA));
  gl.addColorStop(1, withAlpha(oxblood(env, 0.55), 0));
  c.strokeStyle = gl;
  c.lineWidth = 1.2 * k;
  c.beginPath();
  c.moveTo(x + 40 * k, ty - 0.6 * k);
  for (let bx = 40; bx <= 960; bx += 20) c.lineTo(x + bx * k, sagAt(bx) - 0.6 * k);
  c.stroke();
  // nails at the ends
  c.fillStyle = mixLab(env.mood.halo, env.mood.set, 0.4);
  for (const bx of [40, 960]) {
    c.beginPath();
    c.arc(x + bx * k, ty, 3 * k, 0, Math.PI * 2);
    c.fill();
  }
  // question cards hang from the thread on short clips
  for (const q of state.questions) {
    const qx = x + q.x * k;
    const qy = sagAt(q.x);
    const light = poolAt(pool, q.x, BOARD.threadY + 40);
    c.strokeStyle = thread;
    c.lineWidth = 1.2 * k;
    c.beginPath();
    c.moveTo(qx, qy);
    c.lineTo(qx, qy + 10 * k);
    c.stroke();
    drawCard(c, { id: `Q-${q.slot}`, w: 168, h: 44, icon: 'question', text: q.text }, { x: qx, y: qy + 10 * k + 22 * k, k, light, pin: false }, env);
  }

  // threads of light between clues (drawn under the cards, pin to pin)
  if (state.threads.length) {
    const glow = 0.55 + 0.45 * (o.threadGlow ?? 0);
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (const [a, b] of state.threads) {
      if (hide.has(a) || hide.has(b)) continue;
      const p = slotPin(o, a), q = slotPin(o, b);
      const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2 + Math.hypot(q.x - p.x, q.y - p.y) * 0.08;
      for (const [lw, al] of [[6, 0.07], [2.4, 0.22], [1, 0.6]] as const) {
        c.strokeStyle = withAlpha(env.mood.core, al * glow);
        c.lineWidth = lw * k;
        c.beginPath();
        c.moveTo(p.x, p.y);
        c.quadraticCurveTo(mx, my, q.x, q.y);
        c.stroke();
      }
    }
    c.restore();
  }

  // cards
  for (const card of state.cards) {
    if (hide.has(card.id)) continue;
    if (card.id === 'K' && state.kDropped) continue;
    const p = boardToWorld(o, card.x, card.y);
    const light = poolAt(pool, card.x, card.y);
    const rot = card.id === 'K' ? state.kTilt : 0;
    if (card.id === 'O') {
      drawCard(c, { ...card, text: undefined }, { x: p.x, y: p.y, k, light, pin: false }, env);
      continue;
    }
    drawCard(c, card, {
      x: p.x,
      y: p.y,
      k,
      light,
      rot,
      lit: card.lit,
      grey: card.lantern === 'grey',
      lanternLit: card.lantern === 'glow' ? 1 : 0,
      stamp: card.id === 'K' && state.kStamped ? 1 : 0,
    }, env);
  }
}
