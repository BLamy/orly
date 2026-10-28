/**
 * handwired-explained — ch04-s08 / ch04-s09: WHAT THE RUNTIME REALLY BUILDS (Tags on Wires, machine 5), on the
 * backlit workbench of ch04-s06 (sets/ch04-s06-bench: the room, the gate, the tiles, the tray, the post card).
 *
 * TE04 / TE05 / TE07 (script ch04-s08, ch04-s09): the runtime will not compare without a declared range; promise a
 * grid of 1 (a is a whole number) and a > 4 is built as ramp = relu(5 − a), bit = relu(1 − ramp): two operations.
 * At 5 the boards read 0 and 1 (a 10), at 4 they read 1 and 0 (a 12), at 3 they read 2 and nought (a 12). Break the
 * promise with 4.5 and the ramp reads a half, the bit a half: 11 again. Every value here is COMPUTED (Math.fround).
 *
 *   G                       the shared geometry (rest-screen L4 px)
 *   readmeRig(c, env, o)    the README's two ramps and lever (sets/rampBench boards + the s06 lever), folding away
 *   gridRig(c, env, o)      the grid rig: board A (relu(5 − a)) on the rule, board B (relu(1 − ramp)) at the right,
 *                           plumb bars that read each board, the copper thread that carries A's reading to B
 *   wireOfA(c, env, o)      the wire of a: a copper wire from the upper left that bends DOWN into the number rule
 *   copperLine(c, env, o)   the film's copper tag line across the top left (tag 6 waits on it), to a peg
 *   rangeCard(c, env, …)    the small range card (a bounded bracket glyph, no numbers) tied on the wire
 *   tag6(c, env, …)         Promise Tag 6 at a readable scale, lettered here: 'For an integer a' → 'grid 1'
 *   selectGate(c, env, o)   the two belts' ends, the s06 gate (open = bit / 1 − bit) and its link rod, the tray
 *   opsCounter(c, env, o)   the brass operation counter (a drum that rolls down and stops)
 *   chip(c, env, o)         the monospace label chip clipped on the comparison
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, cardProbe, legibleSize, textProbe, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { copperOf, PENCIL_MARK } from './narratorHands';
import { RB, rampBench } from './rampBench';
import { PAPER, PAPER_INK, beltBand, feeder, heroTile, leverGauge, tray } from './ch04-s06-bench';
import { GATE, gateBack, gateFront, slabTile } from './ch04-s06-gate';
import { drawTag, type TagState } from './tagLine';

type C = CanvasRenderingContext2D;
type Pt = { x: number; y: number };
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const f32 = Math.fround;

// ---------------------------------------------------------------- the maths (TE05), FP32
export const GRID = {
  ramp: (a: number) => Math.max(0, f32(5 - f32(a))),
  bit: (a: number) => Math.max(0, f32(1 - Math.max(0, f32(5 - f32(a))))),
  result: (a: number) => {
    const b = Math.max(0, f32(1 - Math.max(0, f32(5 - f32(a)))));
    return f32(f32(b * 10) + f32(f32(1 - b) * 12));
  },
  fmt: RB.fmt,
};

// ---------------------------------------------------------------- geometry (rest-screen L4 px)
const S = 1.5;
const BX = 560;
export const G = {
  /** the floor rule: a = 4.5 at BX, 165 px per unit */
  BY: 596,
  BX,
  S,
  U: 110 * S,
  DOMAIN: [2.8, 5.8] as [number, number],
  xOfA: (a: number) => BX + (a - 4.5) * 110 * S,
  MARBLE_R: 13,
  /** the README lever */
  LX: 884,
  LY: 474,
  LR: 70,
  /** the grid rig: board A's height per unit of ramp; board B's base (ramp 0 .. 2) and its height per unit */
  VA: 70,
  B: { x0: 830, ux: 62, VB: 70 },
  /** belts (their ends), the gate, the tray */
  BELT_X0: 420,
  SX: 906,
  END10: 990,
  END12: 970,
  Y10: 200,
  Y12: 276,
  TX: 1092,
  TY: 424,
  TW: 150,
  TILE_S: 1.5,
  /** the copper tag line (top left) and the wire of a (its level stretch, its bend down into the rule) */
  LINE: { x0: -420, x1: 352, y: 66, sag: 12 },
  WIRE: { x0: -420, y: 300, bendX: 258, ruleX: 288 },
  /** tag 6's knot on the line and on the wire; the range card's knot */
  TAG6_LINE_X: 168,
  TAG6_WIRE_X: 168,
  RANGE_X: 74,
  TAG_S: 1.65,
  /** the post card (formulas) and the brass counter */
  CARD: { x: 890, y: 40, w: 300, h: 98 },
  COUNTER: { x: 1140, y: 300 },
} as const;

/** the copper line's y at x (gentle sag between the off-frame post and the peg) */
export function lineY(x: number): number {
  const { x0, x1, y, sag } = G.LINE;
  const u = clamp01((x - x0) / (x1 - x0));
  return y + sag * 4 * u * (1 - u);
}

// ---------------------------------------------------------------- the wire of a (and the marble's path along it)
/** the wire's path: level from the left, a quarter bend down at bendX, the drop, a quarter bend onto the rule */
function wirePath(): Path2D {
  const { x0, y, bendX, ruleX } = G.WIRE;
  const p = new Path2D();
  const r = ruleX - bendX;
  p.moveTo(x0, y);
  p.lineTo(bendX - r, y);
  p.quadraticCurveTo(bendX, y, bendX, y + r);
  p.lineTo(bendX, G.BY - r - 4);
  p.quadraticCurveTo(bendX, G.BY - 4, ruleX + 4, G.BY - 4);
  p.lineTo(G.xOfA(G.DOMAIN[0]), G.BY - 4);
  return p;
}
const WIRE_PATH = wirePath();

/**
 * Where a marble sits on the wire / rule at a path parameter p (stage px of travel from the level stretch's x0 = 0
 * at x = PATH_X0): along the level wire, round the bend, down the drop, round the foot, then along the rule. Returns
 * the marble's centre (resting ON the wire / rule).
 */
const PATH_X0 = 40;
export function marbleOnPath(p: number, r = G.MARBLE_R): Pt {
  const { y, bendX, ruleX } = G.WIRE;
  const rr = ruleX - bendX;
  const lvl = bendX - rr - PATH_X0;
  const arc = (Math.PI / 2) * rr;
  const drop = G.BY - rr - 4 - (y + rr);
  if (p <= lvl) return { x: PATH_X0 + p, y: y - r };
  p -= lvl;
  if (p <= arc) {
    const th = p / rr; // 0 → π/2 round the bend (outside of the curve)
    const cx = bendX - rr, cy = y + rr;
    return { x: cx + Math.sin(th) * (rr + r), y: cy - Math.cos(th) * (rr + r) };
  }
  p -= arc;
  if (p <= drop) return { x: bendX + r, y: y + rr + p };
  p -= drop;
  if (p <= arc) {
    const th = p / rr;
    const cx = bendX + rr, cy = G.BY - 4 - rr;
    return { x: cx - Math.cos(th) * (rr - r), y: cy + Math.sin(th) * (rr - r) };
  }
  p -= arc;
  return { x: ruleX + p, y: G.BY - r };
}
/** the path parameter at which the marble on the rule sits at a */
export function pathOfA(a: number): number {
  const { y, bendX, ruleX } = G.WIRE;
  const rr = ruleX - bendX;
  const lvl = bendX - rr - PATH_X0;
  const arc = (Math.PI / 2) * rr;
  const drop = G.BY - rr - 4 - (y + rr);
  return lvl + 2 * arc + drop + (G.xOfA(a) - ruleX);
}

export function wireOfA(c: C, env: PaintEnv, o: { glow?: number } = {}) {
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 8;
  c.stroke(WIRE_PATH);
  c.strokeStyle = mixLab(copperOf(env, 0.5 * clamp01(o.glow ?? 0)), PUPPET_NEAR_BLACK, 0.3 * (1 - clamp01(o.glow ?? 0)));
  c.lineWidth = 4.6;
  c.stroke(WIRE_PATH);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.5);
  c.lineWidth = 1;
  c.translate(0, -1.2);
  c.stroke(WIRE_PATH);
  c.restore();
}

/** the film's copper tag line across the top left, from off frame to a turned peg (draw in L4) */
export function copperLine(c: C, env: PaintEnv) {
  const { x0, x1 } = G.LINE;
  c.save();
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 4.6;
  c.beginPath();
  for (let x = x0; x <= x1; x += 16) (x === x0 ? c.moveTo : c.lineTo).call(c, x, lineY(x));
  c.stroke();
  c.strokeStyle = copperOf(env, 0.4);
  c.lineWidth = 2.6;
  c.stroke();
  // the peg it is tied off on
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.ellipse(x1 + 8, lineY(x1), 9, 9, 0, 0, Math.PI * 2);
  c.rect(x1 + 4, lineY(x1) - 30, 8, 60);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.55);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(x1 + 4, lineY(x1) - 30);
  c.lineTo(x1 + 12, lineY(x1) - 30);
  c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- the range card and tag 6
const manilaOf = (env: PaintEnv, lift = 0) => mixLab(mixLab(mixLab('#cfb07a', env.mood.halo, 0.32), env.mood.core, lift * 0.35), env.mood.haze, env.layer.haze * 0.7);
const inkOf = (env: PaintEnv) => mixLab('#1d140d', env.mood.ink, 0.3);

/**
 * The range card, hanging from `knot` (or held at `eye` with no string): a small manila card with a bounded bracket
 * glyph |◂──▸| (a range, no numbers). alpha 0..1.
 */
export function rangeCard(c: C, env: PaintEnv, knot: Pt | null, eye: Pt, o: { alpha?: number; swing?: number; s?: number } = {}) {
  const a = clamp01(o.alpha ?? 1);
  if (a <= 0) return;
  const s = o.s ?? 1.4;
  const w = 40 * s, h = 26 * s;
  c.save();
  c.globalAlpha *= a;
  if (knot) {
    c.strokeStyle = withAlpha(mixLab('#d9c7a2', env.mood.rim, 0.4), 0.9);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(knot.x - 2.5, knot.y);
    c.lineTo(eye.x, eye.y);
    c.lineTo(knot.x + 2.5, knot.y);
    c.stroke();
  }
  c.translate(eye.x, eye.y);
  c.rotate(o.swing ?? 0);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.22);
  c.fillRect(-w / 2 + 2, 3, w, h);
  c.fillStyle = manilaOf(env, 0.2);
  c.fillRect(-w / 2, 0, w, h);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.7);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-w / 2 + 3, 0);
  c.lineTo(w / 2 - 3, 0);
  c.stroke();
  // the eyelet
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.85);
  c.beginPath();
  c.arc(0, 5 * s, 2 * s, 0, Math.PI * 2);
  c.fill();
  // the bounded range: two end stops and a span between them
  const y = h * 0.66, x0 = -w * 0.36, x1 = w * 0.36;
  c.strokeStyle = inkOf(env);
  c.lineWidth = 2;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x0, y - 6 * s);
  c.lineTo(x0, y + 6 * s);
  c.moveTo(x1, y - 6 * s);
  c.lineTo(x1, y + 6 * s);
  c.moveTo(x0 + 3, y);
  c.lineTo(x1 - 3, y);
  c.moveTo(x0 + 3, y);
  c.lineTo(x0 + 3 + 4 * s, y - 3 * s);
  c.moveTo(x0 + 3, y);
  c.lineTo(x0 + 3 + 4 * s, y + 3 * s);
  c.moveTo(x1 - 3, y);
  c.lineTo(x1 - 3 - 4 * s, y - 3 * s);
  c.moveTo(x1 - 3, y);
  c.lineTo(x1 - 3 - 4 * s, y + 3 * s);
  c.stroke();
  c.restore();
}

export interface Tag6Opts {
  /** where the string is tied (null: held, no string) and the eyelet */
  knot: Pt | null;
  eye: Pt;
  /** 0..1: the small print re-lettered from 'For an integer a' to 'grid 1' (a clean swap, never both at once) */
  grid?: number;
  /** an explicit text swap (type kit textSwap): out = the old print's alpha, in = 'grid 1' (overrides grid) */
  swap?: { in: number; out: number };
  /** 0..1 the tag turned over (front → back) */
  flip?: number;
  /** the back's red-pencil word and how much is written */
  back?: string;
  backInk?: number;
  glow?: number;
  swing?: number;
  alpha?: number;
  /** text role: the shot pushes in to read it */
  subject?: boolean;
  id?: string;
}
/**
 * Promise Tag 6 at the shot's scale (G.TAG_S), drawn with the tagLine painter for the paper, string, eyelet and its
 * README knot card, and lettered HERE at a size that reads: the front 'For an integer a' (two lines), or after the
 * re-letter 'grid 1'; under it the README's ternary as small print (texture). The back carries the red-pencil word.
 */
export function tag6(c: C, env: PaintEnv, o: Tag6Opts) {
  const a = clamp01(o.alpha ?? 1);
  if (a <= 0) return;
  const s = G.TAG_S;
  const st: TagState = {
    id: '6',
    front: ' ',
    sub: ' ',
    knot: o.knot ? ['the README'] : [],
    flip: o.flip ?? 0,
    back: o.back ? [' '] : [],
    backInk: 0,
    scale: s,
    glow: o.glow ?? 0,
    swing: 0,
    alpha: a,
  };
  const knot = o.knot ?? { x: o.eye.x, y: o.eye.y - 0.5 };
  c.save();
  // the slow turn on the string is applied about the knot (string and tag together)
  const sw = o.swing ?? 0;
  c.translate(knot.x, knot.y);
  c.rotate(sw);
  c.translate(-knot.x, -knot.y);
  drawTag(c, env, st, { at: o.eye, knotAt: knot });
  // the lettering, in the tag's own frame
  const w = 60 * s, h = 86 * s;
  const flip = clamp01(o.flip ?? 0);
  const sx = Math.cos(Math.PI * flip);
  c.translate(o.eye.x, o.eye.y);
  c.scale(Math.max(0.04, Math.abs(sx)), 1);
  c.globalAlpha *= a;
  const role = o.subject ? 'subject' : 'texture';
  if (sx >= 0) {
    const g = clamp01(o.grid ?? 0);
    // a clean swap: the old print is gone before the new one inks (no ghost text)
    const oldA = o.swap ? clamp01(o.swap.out) : 1 - sm(g / 0.45);
    const newA = o.swap ? clamp01(o.swap.in) : sm((g - 0.5) / 0.5);
    textRole(c, role, () => {
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.fillStyle = inkOf(env);
      if (oldA > 0.001) {
        const fs = Math.min(legibleSize(c, `${'20'}px ${FONT.fell}`, 20), 16 * s);
        c.font = `${fs.toFixed(2)}px ${FONT.fell}`;
        c.globalAlpha = a * oldA;
        c.fillText('For an', 0, 30 * s + fs * 0.6);
        c.fillText('integer a', 0, 30 * s + fs * 1.75);
        // one probe round BOTH lines (ascenders to descenders), so each line reads as this probe's own text
        textProbe(c, `${o.id ?? 'tag6'}/old`, -w * 0.46, 30 * s - fs * 0.45, w * 0.92, fs * 2.75, oldA * a);
      }
      if (newA > 0.001) {
        const fs = Math.min(legibleSize(c, `600 ${'24'}px ${FONT.fell}`, 24), 19 * s);
        c.font = `${fs.toFixed(2)}px ${FONT.fell}`;
        c.globalAlpha = a * newA;
        c.fillText('grid 1', 0, 30 * s + fs * 1.0);
        textProbe(c, `${o.id ?? 'tag6'}/grid`, -w * 0.42, 30 * s, w * 0.84, fs * 1.2, newA * a);
      }
    });
    // the README's ternary, small print (texture)
    textRole(c, 'texture', () => {
      c.globalAlpha = a * 0.8;
      c.font = `italic ${(6.6 * s).toFixed(2)}px ${FONT.text}`;
      c.fillStyle = inkOf(env);
      c.textAlign = 'center';
      c.fillText('(a > 4) ? 10 : 12', 0, h * 0.82);
    });
  } else if (o.back) {
    // the back (the |cos| squash already keeps it reading left to right): the doubter's word in red pencil
    const bi = clamp01(o.backInk ?? 0);
    if (bi > 0) {
      textRole(c, role, () => {
        const fs = Math.min(legibleSize(c, `italic 20px ${FONT.fell}`, 20), 15 * s);
        c.font = `italic ${fs.toFixed(2)}px ${FONT.fell}`;
        const tw = c.measureText(o.back!).width;
        c.save();
        c.beginPath();
        c.rect(-tw / 2 - 2, 20 * s, (tw + 4) * bi, fs * 2);
        c.clip();
        c.fillStyle = mixLab(PENCIL_MARK, env.mood.ink, 0.12);
        c.textAlign = 'left';
        c.fillText(o.back!, -tw / 2, 30 * s + fs * 0.9);
        c.restore();
        textProbe(c, `${o.id ?? 'tag6'}/back`, -tw / 2, 30 * s, tw, fs, bi * a);
      });
    }
  }
  c.restore();
}

// ---------------------------------------------------------------- the README rig (folding away)
/** the README's two ramps (boards hinged at 4 and 5) and the lever that reads their difference; fold 0 → 1 folds
 *  them flat into the rule (paper hinged at its foot), on twos; stop 0..1 a small red stop jammed under the needle */
export function readmeRig(c: C, env: PaintEnv, o: { fold?: number; stop?: number; lever?: number; numerals?: boolean }) {
  const fold = clamp01(o.fold ?? 0);
  const k = 1 - sm(fold);
  if (k <= 0.01) {
    numeralsOnly(c, env, o.numerals !== false);
    return;
  }
  c.save();
  c.translate(0, G.BY);
  c.scale(1, k);
  c.translate(0, -G.BY);
  rampBench(c, env, { x: G.BX, y: G.BY, s: G.S, domain: G.DOMAIN, boards: 2, lever: false, tray: false, numerals: false });
  c.restore();
  numeralsOnly(c, env, o.numerals !== false);
  // the lever folds down about its foot the same way
  c.save();
  c.translate(0, G.BY);
  c.scale(1, k);
  c.translate(0, -G.BY);
  leverGauge(c, env, { x: G.LX, y: G.LY, r: G.LR, value: o.lever ?? 0, stand: G.BY - G.LY });
  const st = clamp01(o.stop ?? 0);
  if (st > 0) redStop(c, env, st);
  c.restore();
}
/** the numerals under the integer ticks (the rule itself is drawn by rampBench; this keeps it when the boards fold) */
function numeralsOnly(c: C, env: PaintEnv, on: boolean) {
  if (!on) return;
  // rampBench with no boards draws the paper rule, its ticks and numerals
  rampBench(c, env, { x: G.BX, y: G.BY, s: G.S, domain: G.DOMAIN, boards: 0, lever: false, tray: false, numerals: true });
}
/** a small red-pencil stop jammed between the needle and its zero peg: the comparison is locked */
function redStop(c: C, env: PaintEnv, st: number) {
  const a = -Math.PI * 0.75 + 0.18;
  const R = G.LR * 0.7;
  const x = G.LX + Math.cos(a) * R, y = G.LY + Math.sin(a) * R - (1 - sm(st)) * 26;
  c.save();
  c.globalAlpha *= sm(st);
  c.translate(x, y);
  c.rotate(a + Math.PI / 2);
  c.fillStyle = mixLab(PENCIL_MARK, PUPPET_NEAR_BLACK, 0.12);
  c.beginPath();
  c.moveTo(-7, -9);
  c.lineTo(7, -9);
  c.lineTo(4, 10);
  c.lineTo(-4, 10);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.7);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-7, -9);
  c.lineTo(7, -9);
  c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- the grid rig (two small boards in series)
/** the boards are thin cut-paper bands that follow their profile (as sets/rampBench's), 12 px deep */
const BAND = 12;
function band(pts: Pt[]): Path2D {
  const p = new Path2D();
  pts.forEach((q, i) => (i ? p.lineTo(q.x, q.y) : p.moveTo(q.x, q.y)));
  for (let i = pts.length - 1; i >= 0; i--) p.lineTo(pts[i].x, pts[i].y + BAND);
  p.closePath();
  return p;
}
function edge(pts: Pt[]): Path2D {
  const p = new Path2D();
  pts.forEach((q, i) => (i ? p.lineTo(q.x, q.y) : p.moveTo(q.x, q.y)));
  return p;
}
const A_PTS: Pt[] = (() => {
  const [d0, d1] = G.DOMAIN;
  const by = G.BY - 6 - 4;
  return [{ x: G.xOfA(d0), y: by - (5 - d0) * G.VA }, { x: G.xOfA(5), y: by }, { x: G.xOfA(d1), y: by }];
})();
const A_PATH = band(A_PTS);
const A_EDGE = edge(A_PTS);
/** board A's struts: a few thin uprights holding the band off the rule */
const A_STRUTS = (() => {
  const p = new Path2D();
  for (const a of [3, 3.75, 4.5]) {
    const x = G.xOfA(a);
    const top = G.BY - 10 - (5 - a) * G.VA + BAND;
    p.rect(x - 2, top, 4, G.BY - top);
  }
  return p;
})();
const B_BASE = G.BY - 6;
const bx = (r: number) => G.B.x0 + r * G.B.ux;
const B_PTS: Pt[] = [{ x: bx(0), y: B_BASE - G.B.VB - 4 }, { x: bx(1), y: B_BASE - 4 }, { x: bx(2.2), y: B_BASE - 4 }];
const B_PATH = band(B_PTS);
const B_EDGE = edge(B_PTS);
const B_STRUTS = (() => {
  const p = new Path2D();
  for (const r of [0.05, 0.55]) {
    const x = bx(r);
    const top = B_BASE - 4 - (1 - r) * G.B.VB + BAND;
    p.rect(x - 2, top, 4, G.BY - top);
  }
  return p;
})();
/** board B's input (ramp) bead x and its reading top y, for a */
export function gridReadings(a: number) {
  const r = GRID.ramp(a);
  const b = GRID.bit(a);
  return { r, b, ax: G.xOfA(a), aTop: B_BASE - 4 - r * G.VA, bx: bx(Math.min(2.2, r)), bTop: B_BASE - 4 - b * G.B.VB };
}
export interface GridRigOpts {
  /** 0..1 the boards unfold up out of the rule (on twos) */
  show: number;
  /** the marble's a (readings drawn when given) and how far the readings have risen 0..1 */
  a?: number;
  read?: number;
  /** the copper thread from A's reading over to B's bead 0..1 */
  carry?: number;
  /** a warm kick on both boards' rims (the two-click) */
  kick?: number;
  /** 0..1 board B's flap lifted at its reading (the bit, shown high for 1, low for 0) */
  flap?: number;
}
export function gridRig(c: C, env: PaintEnv, o: GridRigOpts) {
  const show = clamp01(o.show);
  if (show <= 0) return;
  const k = sm(show);
  const rimC = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6 + 0.3 * clamp01(o.kick ?? 0)), 0.85);
  c.save();
  c.translate(0, G.BY);
  c.scale(1, k);
  c.translate(0, -G.BY);
  // board B (the second operation), a step behind: a little board on its own 0..2 rule
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.2);
  c.fill(B_PATH);
  c.fill(B_STRUTS);
  c.strokeStyle = rimC;
  c.lineWidth = 2.4;
  c.stroke(B_EDGE);
  // B's little rule: ticks at ramp 0, 1, 2 (texture, no numerals)
  c.fillStyle = mixLab(mixLab('#d8c393', env.mood.halo, 0.3), env.mood.set, 0.15);
  c.fillRect(bx(-0.2), G.BY, bx(2.25) - bx(-0.2), 9);
  c.strokeStyle = withAlpha('#1d140d', 0.8);
  c.lineWidth = 1.3;
  c.beginPath();
  for (const r of [0, 1, 2]) {
    c.moveTo(bx(r), G.BY);
    c.lineTo(bx(r), G.BY + 8);
  }
  c.stroke();
  // board A (the first operation): relu(5 − a), high on the left, flat from its hinge at 5
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fill(A_PATH);
  c.fill(A_STRUTS);
  c.strokeStyle = rimC;
  c.lineWidth = 2.4;
  c.stroke(A_EDGE);
  // unit marks up A's left end (0, 1, 2 heights): texture ticks so the reading can be counted
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.7);
  c.lineWidth = 1.4;
  c.beginPath();
  for (const r of [1, 2]) {
    const y = B_BASE - 4 - r * G.VA;
    c.moveTo(G.xOfA(G.DOMAIN[0]) - 10, y);
    c.lineTo(G.xOfA(G.DOMAIN[0]) - 2, y);
  }
  c.stroke();
  // copper hinge pins at each board's corner
  c.fillStyle = copperOf(env, 0.5 + 0.4 * clamp01(o.kick ?? 0));
  for (const p of [{ x: G.xOfA(5), y: B_BASE - 1 }, { x: bx(1), y: B_BASE - 1 }]) {
    c.beginPath();
    c.arc(p.x, p.y, 4.6, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  if (o.a === undefined) return;
  const read = clamp01(o.read ?? 0) * k;
  if (read <= 0) return;
  const R = gridReadings(o.a);
  // plumb bar on A at the marble (copper), the thread over to B's bead, plumb bar on B (pale)
  plumb(c, env, R.ax + 14, B_BASE - 4, B_BASE - 4 - R.r * G.VA * read, copperOf(env, 0.75));
  const carry = clamp01(o.carry ?? read);
  if (carry > 0) {
    const yA = B_BASE - 4 - R.r * G.VA;
    const x1 = R.ax + 14 + (R.bx - R.ax - 14) * carry;
    c.save();
    c.strokeStyle = withAlpha(copperOf(env, 0.6), 0.8);
    c.lineWidth = 1.6;
    c.setLineDash([5, 4]);
    c.beginPath();
    c.moveTo(R.ax + 14, yA);
    c.lineTo(x1, yA);
    if (carry >= 1) c.lineTo(R.bx, B_BASE - 8);
    c.stroke();
    c.setLineDash([]);
    c.restore();
    // B's input bead on its rule
    c.fillStyle = copperOf(env, 0.7);
    c.beginPath();
    c.arc(R.bx, G.BY - 5, 5.5 * sm(carry), 0, Math.PI * 2);
    c.fill();
    if (carry >= 1) plumb(c, env, R.bx, B_BASE - 4, B_BASE - 4 - R.b * G.B.VB * sm((read - 0.0) / 1), mixLab(mixLab('#efe2c4', env.mood.halo, 0.3), env.mood.core, 0.2));
    const fl = clamp01(o.flap ?? 0) * (carry >= 1 ? 1 : 0);
    if (fl > 0) bitFlap(c, env, R.bx, B_BASE - 4 - R.b * G.B.VB * sm(read), fl);
  }
}
/** board B's paper flap at its reading: hinged on the plumb's head, it swings up from flat (fl 0 → 1) and glows, so
 *  the bit reads at a glance: standing high on the board for 1, down at the rule for 0 (no numerals) */
function bitFlap(c: C, env: PaintEnv, x: number, y: number, fl: number) {
  const e = sm(fl);
  c.save();
  // the glow behind it
  const g = c.createRadialGradient(x, y - 24, 2, x, y - 24, 62);
  g.addColorStop(0, withAlpha(copperOf(env, 0.85), 0.5 * e));
  g.addColorStop(1, withAlpha(copperOf(env, 0.85), 0));
  c.fillStyle = g;
  c.fillRect(x - 64, y - 88, 128, 128);
  c.translate(x, y - 3);
  c.rotate((-Math.PI / 2) * e);
  // the flap: a pale card 46 x 26 with a copper tip, on a black hinge, cut out with a dark edge
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(-2, -15, 50, 30);
  c.fillStyle = mixLab(mixLab(PAPER, env.mood.halo, 0.25), env.mood.core, 0.3 * e);
  c.fillRect(1, -12, 44, 24);
  c.fillStyle = copperOf(env, 0.75);
  c.fillRect(33, -12, 12, 24);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(0, 0, 5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
function plumb(c: C, env: PaintEnv, x: number, base: number, top: number, col: string) {
  c.save();
  c.strokeStyle = withAlpha(col, 0.85);
  c.lineWidth = 1.4;
  c.setLineDash([3, 3]);
  c.beginPath();
  c.moveTo(x - 9, base);
  c.lineTo(x + 9, base);
  c.stroke();
  c.setLineDash([]);
  if (base - top > 0.5) {
    c.strokeStyle = PUPPET_NEAR_BLACK;
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(x, base);
    c.lineTo(x, top);
    c.stroke();
    c.strokeStyle = col;
    c.lineWidth = 5;
    c.stroke();
  }
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(x - 9, top);
  c.lineTo(x + 9, top);
  c.stroke();
  c.strokeStyle = col;
  c.lineWidth = 3.2;
  c.beginPath();
  c.moveTo(x - 8, top);
  c.lineTo(x + 8, top);
  c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- the counter, the chip
/** the brass operation counter: a drum window that rolls DOWN (spin 0..1) and stops on `value`; 'ops' engraved */
export function opsCounter(c: C, env: PaintEnv, o: { value: number; spin: number; alpha?: number; x?: number; y?: number; id?: string }) {
  const a = clamp01(o.alpha ?? 1);
  if (a <= 0) return;
  const x = o.x ?? G.COUNTER.x, y = o.y ?? G.COUNTER.y;
  // the engraved 'ops' (small caps): sized on its own glyphs so its cap height clears the legibility floor
  const opsFont = (() => {
    const f0 = `600 26px ${FONT.sc}`;
    const sz = legibleSize(c, f0, 26, 'ops') * 1.06;
    return `600 ${sz.toFixed(1)}px ${FONT.sc}`;
  })();
  c.save();
  c.font = opsFont;
  const opsW = c.measureText('ops').width;
  c.restore();
  const w = 10 + 22 * String(o.value).length + 18 + 12 + opsW + 14, h = 58;
  c.save();
  c.globalAlpha *= a;
  // bracket to the post
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(x + w / 2 - 4, y - 6, 90, 10);
  // brass body
  const brass = mixLab(mixLab('#9a7438', env.mood.halo, 0.25), PUPPET_NEAR_BLACK, 0.25);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
  c.fillRect(x - w / 2 + 3, y - h / 2 + 4, w, h);
  c.fillStyle = brass;
  c.beginPath();
  c.roundRect(x - w / 2, y - h / 2, w, h, 6);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.75);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(x - w / 2 + 6, y - h / 2);
  c.lineTo(x + w / 2 - 6, y - h / 2);
  c.stroke();
  // the drum window
  const digits = String(o.value);
  const ww = 22 * digits.length + 18, wh = 44;
  const wx = x - w / 2 + 10 + ww / 2;
  c.fillStyle = mixLab(PAPER, env.mood.halo, 0.2);
  c.fillRect(wx - ww / 2, y - wh / 2, ww, wh);
  c.save();
  c.beginPath();
  c.rect(wx - ww / 2, y - wh / 2, ww, wh);
  c.clip();
  const spin = clamp01(o.spin);
  // the drum rolls down through a few blurred digits before it stops (they are motion, not figures to read)
  const roll = (1 - sm(spin)) * 4.6;
  const fs = 34;
  // while the drum rolls its digits are motion (texture); only the settled figure is read
  textRole(c, roll > 0.05 ? 'texture' : 'subject', () => {
    c.font = `500 ${fs}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let i = -1; i <= 1; i++) {
      if (roll <= 0.05 && i !== 0) continue;
      const off = roll - Math.floor(roll);
      const digit = (((o.value + Math.floor(roll) + i) % 10) + 10) % 10;
      const yy = y + (off - i) * wh;
      const blur = roll > 0.05 ? 0.45 : 1;
      c.fillStyle = withAlpha(PAPER_INK, blur * (1 - Math.min(1, Math.abs(yy - y) / wh)));
      // the tens stay put; the units drum rolls
      const lead = digits.slice(0, -1);
      if (Math.abs(yy - y) < wh) c.fillText(lead + String(digit), wx, yy + 2);
    }
  });
  c.restore();
  // engraved 'ops' under the window
  textRole(c, 'subject', () => {
    c.font = opsFont;
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    c.fillStyle = mixLab('#1e1206', brass, 0.1);
    c.fillText('ops', wx + ww / 2 + 12, y + 1);
    c.textAlign = 'left';
  });
  textProbe(c, `${o.id ?? 'ops'}/n`, wx - ww / 2, y - wh / 2, ww, wh, a * (spin >= 1 ? 1 : 0.4));
  c.restore();
}

/** the label chip clipped on the comparison: a strip of paper with one monospace line (cards rule: paper + ink
 *  together). x, y: the chip's left / top. */
export function chip(c: C, env: PaintEnv, o: { x: number; y: number; text: string; paper: number; ink: number; clipTo?: Pt; id: string }) {
  if (o.paper <= 0.001) return;
  c.save();
  const size = legibleSize(c, `500 20px ${FONT.mono}`, 20);
  c.font = `500 ${size}px ${FONT.mono}`;
  const tw = c.measureText(o.text).width;
  const w = tw + 28, h = size * 1.7;
  if (o.clipTo) {
    c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.9 * o.paper);
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(o.clipTo.x, o.clipTo.y);
    c.lineTo(o.x + 18, o.y + 2);
    c.stroke();
  }
  c.globalAlpha *= o.paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
  c.fillRect(o.x + 3, o.y + 4, w, h);
  c.fillStyle = mixLab(mixLab(PAPER, env.mood.halo, 0.2), env.mood.core, 0.1);
  c.fillRect(o.x, o.y, w, h);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(o.x + 10, o.y - 5, 16, 10);
  c.globalAlpha = 1;
  cardProbe(c, o.id, o.x, o.y, w, h, o.paper, o.ink * o.paper);
  textRole(c, 'subject', () => {
    c.fillStyle = withAlpha(PAPER_INK, o.ink * o.paper);
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.fillText(o.text, o.x + 14, o.y + h / 2 + 1);
  });
  c.restore();
}

// ---------------------------------------------------------------- the select: belts, gate, tray (s06's machine)
/** belt pitch and step (a step carries a tile from its wait point clean through the gate) */
export const BELT = { P: 150, STEP: 0.5, D0: GATE.W / 2 + (34 * G.TILE_S) / 2 + 20, G: 2600 } as const;
const stepU = (t: number, s: number) => sm((t - s) / BELT.STEP);
/** x of tile k on a belt that steps at `steps` (tile k crosses on step k) */
export function beltTileX(t: number, steps: number[], k: number): number {
  let p = 0;
  for (const s of steps) p += BELT.P * stepU(t, s);
  return G.SX - BELT.D0 + p - k * BELT.P;
}
/** the moment tile k leaves the belt's end (its step is over) and lands in the tray at (slot, TY) */
export function beltThrow(steps: number[], k: number, y0: number) {
  const off = steps[k] + BELT.STEP;
  const fall = Math.sqrt((2 * Math.max(10, G.TY - 5 - y0)) / BELT.G);
  return { off, land: off + fall, fall };
}
export interface RowSpec {
  v: number;
  y: number;
  steps: number[];
  /** what each crossing tile comes out as, and the open fraction it was pressed to */
  lab: string[];
  fr: number[];
}
/** both belts with their tiles (a passing tile is pressed to its fraction under the gate's panel), the gate over
 *  them and the feeder. open10 / open12: the gate's panels now. */
export function selectBelts(c: C, env: PaintEnv, t: number, rows: RowSpec[], open10: number, open12: number) {
  const TW = 34 * G.TILE_S;
  for (const r of rows) beltBand(c, env, G.BELT_X0, r.v === 10 ? G.END10 : G.END12, r.y, beltTileX(t, r.steps, 0) / 9);
  const gate = { x: G.SX, y10: G.Y10, y12: G.Y12, open10, open12 };
  gateBack(c, env, gate);
  for (const r of rows) {
    const end = r.v === 10 ? G.END10 : G.END12;
    for (let k = 0; k < r.steps.length + 4; k++) {
      const x = beltTileX(t, r.steps, k);
      if (x < G.BELT_X0 - TW / 2 || x > end + 6) continue;
      if (k < r.steps.length && t >= r.steps[k] + BELT.STEP) continue; // thrown (drawn by the tray)
      c.save();
      c.beginPath();
      c.rect(G.BELT_X0, -100, 1400, 900);
      c.clip();
      // while a tile is half through the gate, its old numeral is out before the pressed value inks (no ghost text)
      const cross = clamp01((x + TW / 2 - G.SX) / TW);
      const pressed = k < r.steps.length && r.lab[k] !== String(r.v);
      c.save();
      c.beginPath();
      c.rect(G.BELT_X0 - 80, r.y - 120, G.SX - (G.BELT_X0 - 80), 140);
      c.clip();
      heroTile(c, env, x, r.y, String(r.v), { s: G.TILE_S, label: pressed ? 1 - sm(cross / 0.35) : 1 });
      c.restore();
      if (x + TW / 2 > G.SX && k < r.steps.length) {
        c.save();
        c.beginPath();
        c.rect(G.SX, r.y - 120, 400, 140);
        c.clip();
        slabTile(c, env, x, r.y, pressed && cross < 0.5 ? ' ' : r.lab[k], r.fr[k], { s: G.TILE_S });
        c.restore();
      }
      c.restore();
    }
  }
  gateFront(c, env, gate);
  feeder(c, env, G.BELT_X0, G.Y10 - 70, G.Y12 + 22, [G.Y10, G.Y12]);
}
/** the link rod from the bit's reading (x, y) up to the gate's foot */
export function linkRod(c: C, env: PaintEnv, from: Pt) {
  const fy = G.Y12 + GATE.FOOT / 2;
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(from.x, from.y);
  c.lineTo(G.SX, fy);
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.4);
  c.lineWidth = 0.8;
  c.stroke();
}
/** a tile in flight from the belt's end to its landing point in the tray (x1), then resting there */
export function flightPos(t: number, off: number, y0: number, x0: number, x1: number): Pt {
  const tau = t - off;
  const fall = Math.sqrt((2 * Math.max(10, G.TY - 5 - y0)) / BELT.G);
  const u = clamp01(tau / fall);
  return { x: x0 + (x1 - x0) * u, y: Math.min(G.TY - 5, y0 + 0.5 * BELT.G * tau * tau) };
}
export { tray, heroTile, slabTile };
