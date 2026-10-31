/**
 * ch03-s02 — WHAT A PROGRAM IS: the builder ribbon (plate, parchment; paperWipe in; 14.33 s on the locked clock).
 *   L0303 "Its tutorial: “A numeric program is a fixed list of operations over 32-bit floats”."
 *   L0304 "You don't write the list. Builder code, ordinary JavaScript run once, appends to it."
 *
 * The ch03 parchment plate (sets/ch03-s02-plate) pinned on the dark bench, camera all but locked (a 1.5 % drift; a
 * copper spool lies soft at the lower right, L5). Upper third: the tutorial's fragment in ink, attributed (the full
 * sentence is spoken, not set). Across the middle runs a long paper ribbon with faint column rules: a column is a
 * dependency depth. Four ink pins at its left are the cells the first operations read.
 *
 * TEACHES, word by word (the toy list below is illustrative: its shape, not the repo's own program):
 *   tutorial (0.86)   the fragment inks in, left to right
 *   fixed (3.26)      the first tags stamp onto the ribbon (sum · sum · ReGLU, then boolean on '32-bit'): each is
 *                     pinned ONE COLUMN RIGHT OF THE DEEPEST TAG IT READS, with fine ink threads back to its inputs
 *   list (7.86)       a small card of builder code slides in at left (ordinary JavaScript as unreadable ink strokes);
 *                     its caption inks under it
 *   Builder (8.69)    each pass of its pen writes one line on the card and appends one tag to the ribbon
 *   appends (11.40)   the pen writes a line that matches the card's first line: no new tag. Both lines glint copper,
 *                     and a copper thread loops back from the card to the tag that already exists, which nods: the same
 *                     expression built twice is one operation
 *   (hold)            three more tags, then fixedList (13.39): the ribbon stops, a double bar closes the list, and
 *                     the builder card folds away, its job done once
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import {
  OP_TAG,
  clamp01,
  copperInk,
  inkThread,
  opIn,
  opOut,
  opTag,
  paperOf,
  plateBack,
  plateCam,
  plateInk,
  plateNear,
  seg,
  sm,
  twos,
  type OpKind,
} from '../sets/ch03-s02-plate';

type C2 = CanvasRenderingContext2D;
const ID = 'ch03-s02';

// ---------------------------------------------------------------- the ribbon and its toy list
const RIB = { x: 258, y: 222, w: 948, h: 326 };
/** tag scale: the operation kinds are the teaching content (with the 4 % push-in over L0304, ~1.17x on screen) */
const S = 1.12;
const COLS = 8;
/** column 0 (the cells) is narrow; columns 1..7 share the rest, leaving room for the closing bar */
const PIN_W = 54;
const END_W = 34;
const COL_W = (RIB.w - PIN_W - END_W) / (COLS - 1);
const colX = (d: number) => (d === 0 ? RIB.x + PIN_W / 2 : RIB.x + PIN_W + COL_W * (d - 0.5));
/** the four cells the first operations read, pinned in column 0 */
const PINS = [306, 366, 426, 486];
interface Op {
  kind: OpKind;
  /** inputs: op index (≥ 0) or a pin (-1..-4) */
  ins: number[];
}
const OPS: Op[] = [
  { kind: 'sum', ins: [-1, -2] },
  { kind: 'sum', ins: [-3, -4] },
  { kind: 'ReGLU', ins: [0, 1] },
  { kind: 'boolean', ins: [2] },
  { kind: 'sum', ins: [2, -3] },
  { kind: 'ReGLU', ins: [3, 4] },
  { kind: 'sum', ins: [5, -1] },
  { kind: 'boolean', ins: [6] },
  { kind: 'sum', ins: [6, 4] },
  { kind: 'ReGLU', ins: [7, 8] },
];
/** depth = one column right of the deepest input (pins are depth 0) */
const DEPTH: number[] = [];
OPS.forEach((op, i) => (DEPTH[i] = 1 + Math.max(...op.ins.map((j) => (j < 0 ? 0 : DEPTH[j])))));
/** rows: a column holding two tags sets them high and low; a lone tag sits between */
const POS = OPS.map((_, i) => {
  const mates = OPS.map((__, j) => j).filter((j) => DEPTH[j] === DEPTH[i]);
  const r = mates.indexOf(i);
  const y = mates.length === 1 ? 394 : r === 0 ? 330 : 458;
  return { x: colX(DEPTH[i]), y };
});
const pinPt = (j: number) => ({ x: colX(0) + 9, y: PINS[-j - 1] });
const outPt = (j: number) => (j < 0 ? pinPt(j) : opOut(POS[j].x, POS[j].y, S));

// ---------------------------------------------------------------- the builder card
const CARD = { x: 64, y: 280, w: 180, h: 228 };
const LINE0 = CARD.y + 40;
const LINE_H = 19;

interface Beats {
  D: number;
  tutorial: number;
  ribbon: number;
  card: number;
  append: number;
  dup: number;
  fixedList: number;
  /** when each op stamps in */
  at: number[];
  /** when the pen begins each line on the card (index = card line; line 0..2 are there when it arrives) */
  pen: { line: number; t0: number; op: number }[];
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const ribbon = T.beat('ribbon');
    const append = T.beat('append');
    const dup = T.beat('dup');
    const fixedList = T.beat('fixedList');
    // the first tag lands just ahead of 'fixed', the second on 'list': the picture says 'fixed list' with the words
    const at = [
      ribbon - 0.15,
      T.word('L0303', 'list'),
      T.word('L0303', 'operations'),
      T.word('L0303', '32-bit'),
      append + 0.55,
      T.word('L0304', 'ordinary') + 0.45,
      T.word('L0304', 'run') + 0.5,
      // after the duplicate's pass the pen waits for its copper loop to land before the next three tags
      dup + 1.0,
      dup + 1.45,
      dup + 1.9,
    ];
    // card lines: 0..2 written already; then one per pen pass (ops 4..6), the duplicate (op -1), then ops 7..9
    const pen = [
      { line: 3, t0: at[4] - 0.55, op: 4 },
      { line: 4, t0: at[5] - 0.55, op: 5 },
      { line: 5, t0: at[6] - 0.55, op: 6 },
      { line: 6, t0: dup - 0.5, op: -1 },
      { line: 7, t0: at[7] - 0.45, op: 7 },
      { line: 8, t0: at[8] - 0.45, op: 8 },
      { line: 9, t0: at[9] - 0.45, op: 9 },
    ];
    const b: Beats = { D: T.duration, tutorial: T.beat('tutorial'), ribbon, card: T.beat('card'), append, dup, fixedList, at, pen };
    return { tl, b, l4: { a: T.line('L0304').start, z: T.line('L0304').end } };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(ribbonCam(t, sc.l4));
    const key = { key: ID, near: 'spool' as const };
    plateBack(f, key);
    f.layer('L4', (c, env) => {
      quote(c, env, t, b);
      ribbon(c, env, t, tq, b);
      builderCard(c, env, t, tq, b);
      cardCaption(c, env, t, b);
    });
    plateNear(f, key);
  },
});

/** locked plate, except a slow 4 % push-in toward the ribbon across L0304 (ease in/out) */
function ribbonCam(t: number, l4: { a: number; z: number }): Camera3 {
  const u = smoother(clamp01((t - l4.a) / (l4.z - l4.a)));
  const k = 1 + 0.04 * u;
  return { x: 640 + 12 * u, y: 360 + 22 * u, z: 1000 - 1000 / k, lens: 1 };
}
const smoother = (u: number) => u * u * u * (u * (u * 6 - 15) + 10);

// ---------------------------------------------------------------- painters
/** the tutorial's fragment, inked across the upper third, attributed */
function quote(c: C2, env: PaintEnv, t: number, b: Beats) {
  const q = '“a fixed list of operations”';
  const who = '— the tutorial';
  // half inked by 'tutorial' (it starts 0.3 s ahead), the whole fragment by 1.6 s
  const t0 = b.tutorial - 0.3, tHalf = b.tutorial - 0.02, t1 = 1.6;
  const u = t < t0 ? 0 : t < tHalf ? 0.5 * ((t - t0) / (tHalf - t0)) : Math.min(1, 0.5 + 0.5 * ((t - tHalf) / (t1 - tHalf)));
  if (u <= 0) return;
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `italic 400 40px ${FONT.text}`, 40);
    c.font = `italic 400 ${size}px ${FONT.text}`;
    const qw = c.measureText(q).width;
    const aSize = legibleSize(c, `600 22px ${FONT.sc}`, 22, who);
    c.save();
    c.font = `600 ${aSize}px ${FONT.sc}`;
    const aw = c.measureText(who).width;
    c.restore();
    const total = qw + 24 + aw;
    const x0 = 640 - total / 2;
    const y = 150;
    c.save();
    c.fillStyle = plateInk(env);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    // ink in by characters (a pen's pace), then the attribution
    const n = Math.ceil(q.length * u);
    c.fillText(q.slice(0, n), x0, y);
    const ua = seg(t, 1.45, 1.85);
    c.globalAlpha = ua;
    c.font = `600 ${aSize}px ${FONT.sc}`;
    c.fillStyle = withAlpha(plateInk(env), 0.85);
    c.fillText(who, x0 + qw + 24, y);
    c.globalAlpha = 1;
    // a fine rule under the definition
    c.strokeStyle = withAlpha(plateInk(env), 0.3);
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(640 - 300 * u, y + 24);
    c.lineTo(640 + 300 * u, y + 24);
    c.stroke();
    textProbe(c, `${ID}-quote`, x0, y - size, total, size * 1.25, Math.max(0.0001, u));
    c.restore();
  });
}

function ribbon(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const ink = plateInk(env);
  const appear = seg(t, b.tutorial + 0.6, b.tutorial + 1.6);
  if (appear <= 0) return;
  c.save();
  c.globalAlpha = appear;
  // the paper ribbon: a long strip, a touch whiter than the plate, its ends cut on the bias
  c.fillStyle = withAlpha('#1d140d', 0.12);
  c.fillRect(RIB.x + 3, RIB.y + 4, RIB.w, RIB.h);
  c.beginPath();
  c.moveTo(RIB.x - 14, RIB.y);
  c.lineTo(RIB.x + RIB.w, RIB.y);
  c.lineTo(RIB.x + RIB.w + 14, RIB.y + RIB.h);
  c.lineTo(RIB.x, RIB.y + RIB.h);
  c.closePath();
  c.fillStyle = mixLab(paperOf(env), '#fffaf0', 0.35);
  c.fill();
  c.strokeStyle = withAlpha(ink, 0.45);
  c.lineWidth = 1;
  c.stroke();
  // faint column rules: one column per dependency depth
  c.strokeStyle = withAlpha(ink, 0.13);
  c.setLineDash([3, 5]);
  c.beginPath();
  for (let i = 0; i < COLS; i++) {
    const x = RIB.x + PIN_W + i * COL_W;
    c.moveTo(x, RIB.y + 14);
    c.lineTo(x, RIB.y + RIB.h - 14);
  }
  c.stroke();
  c.setLineDash([]);
  textRole(c, 'texture', () => {
    c.font = `italic 400 13px ${FONT.text}`;
    c.fillStyle = withAlpha(ink, 0.45);
    c.textAlign = 'left';
    c.fillText('depth →', RIB.x + 8, RIB.y + 20);
  });
  // the cells read at depth 0: small ink pins
  for (const y of PINS) {
    c.fillStyle = ink;
    c.beginPath();
    c.arc(colX(0) + 4, y, 5.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = mixLab(paperOf(env), '#fffaf0', 0.5);
    c.beginPath();
    c.arc(colX(0) + 4, y, 2, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();

  // threads first (behind), then the tags
  const dupTouch = b.dup + 0.45;
  OPS.forEach((op, i) => {
    const a0 = b.at[i];
    if (t < a0 - 0.2) return;
    const u = seg(t, a0 - 0.18, a0 + 0.22);
    for (const j of op.ins) inkThread(c, env, outPt(j), opIn(POS[i].x, POS[i].y, S), u);
  });
  OPS.forEach((op, i) => {
    const a0 = b.at[i];
    if (t < a0 - 0.02) return;
    const stamp = seg(t, a0 - 0.02, a0 + 0.12);
    // a stamped tag lands with a tiny press (scale 1.08 → 1 on twos)
    const press = 1 + 0.08 * (1 - seg(tq, a0, a0 + 0.17));
    // the existing tag nods when the duplicate's thread touches it
    const dt = t - dupTouch;
    // a clear ~5 deg nod (on twos), damped
    const dq = tq - dupTouch;
    const nod = i === 0 && dq > 0 ? 0.09 * Math.sin(dq * 9) * Math.exp(-dq * 2.6) : 0;
    const glow = i === 0 ? seg(t, dupTouch - 0.1, dupTouch + 0.15) * (1 - seg(t, dupTouch + 1.0, dupTouch + 1.6)) : 0;
    if (glow > 0.01) warmHalo(c, env, POS[i].x, POS[i].y, glow);
    opTag(c, env, { x: POS[i].x, y: POS[i].y, kind: op.kind, a: stamp, scale: press * S, nod, glow, subject: true, probe: `${ID}-op${i}` });
  });
  // the list closes: a double bar after the last column
  const close = seg(t, b.fixedList - 0.05, b.fixedList + 0.35);
  if (close > 0) {
    const x = RIB.x + RIB.w - END_W / 2 + 3;
    c.save();
    c.strokeStyle = withAlpha(ink, 0.85 * close);
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(x, RIB.y + 18 + (1 - close) * 100);
    c.lineTo(x, RIB.y + RIB.h - 18 - (1 - close) * 100);
    c.stroke();
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x - 6, RIB.y + 18 + (1 - close) * 100);
    c.lineTo(x - 6, RIB.y + RIB.h - 18 - (1 - close) * 100);
    c.stroke();
    c.restore();
  }
}

/** a line of builder code on the card: unreadable ink strokes (words of varying length), seeded per line */
function codeLine(c: C2, x: number, y: number, line: number, u: number, col: string) {
  if (u <= 0) return;
  const indent = line === 0 ? 0 : line % 3 === 0 ? 12 : 24;
  const words = [3 + ((line * 7) % 5), 5 + ((line * 3) % 6), 2 + ((line * 5) % 4), 6 + ((line * 11) % 5), 3];
  const total = words.reduce((a, w) => a + w * 6.2 + 7, 0);
  const lim = (CARD.w - 36 - indent) / total;
  let cx = x + indent;
  let budget = u * (CARD.w - 36 - indent);
  c.strokeStyle = col;
  c.lineWidth = 2.1;
  c.lineCap = 'round';
  c.beginPath();
  for (let i = 0; i < words.length && budget > 0; i++) {
    const w = words[i] * 6.2 * lim;
    const seg2 = Math.min(w, budget);
    // a word as a slightly wavering stroke
    c.moveTo(cx, y);
    for (let k = 1; k <= 6; k++) c.lineTo(cx + (seg2 * k) / 6, y + Math.sin((cx + k * 3) * 0.9 + line) * 1.1);
    cx += w + 7 * lim;
    budget -= w + 7 * lim;
  }
  c.stroke();
}
/** the line the duplicate repeats (it matches the card's first line) */
const DUP_OF = 0;

function builderCard(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const slide = seg(t, b.card - 0.25, b.card + 0.45);
  if (slide <= 0) return;
  const fold = seg(t, b.fixedList, b.fixedList + 0.6);
  if (fold >= 1) return;
  const ink = plateInk(env);
  const dx = (1 - slide) * -300;
  c.save();
  c.translate(dx, 0);
  // fold away: the card's lower part folds up over its top edge (scaleY about the top), then it is gone
  c.translate(0, CARD.y);
  c.scale(1, 1 - fold);
  c.translate(0, -CARD.y);
  c.globalAlpha = 1 - fold * 0.6;
  // a separate sheet lying on the plate: a soft 2-3 px paper drop shadow toward the lower right (lamp upper left)
  c.save();
  c.shadowColor = withAlpha('#1d140d', 0.42 * (1 - fold));
  c.shadowBlur = 5;
  c.shadowOffsetX = 2.5;
  c.shadowOffsetY = 3;
  c.fillStyle = mixLab(mixLab('#f4e8cb', env.mood.core, 0.25), '#ffffff', 0.12);
  c.fillRect(CARD.x, CARD.y, CARD.w, CARD.h);
  c.restore();
  c.strokeStyle = withAlpha(ink, 0.6);
  c.lineWidth = 1.1;
  c.strokeRect(CARD.x, CARD.y, CARD.w, CARD.h);
  // a tab at the top, as an index card: nothing written on it
  c.fillStyle = withAlpha(ink, 0.1);
  c.fillRect(CARD.x, CARD.y, CARD.w, 22);
  // the lines already there, then one per pen pass
  const dupGlint = seg(t, b.dup - 0.05, b.dup + 0.2) * (1 - seg(t, b.dup + 1.4, b.dup + 2.0));
  for (let l = 0; l < 3; l++) codeLine(c, CARD.x + 16, LINE0 + l * LINE_H, l, 1, l === DUP_OF && dupGlint > 0 ? mixLab(withAlpha(ink, 0.8), copperInk(env, 0.4), dupGlint) : withAlpha(ink, 0.78));
  let nib = { x: CARD.x + 30, y: LINE0 + 2 * LINE_H, active: false };
  for (const p of b.pen) {
    const u = clamp01((tq - p.t0) / 0.45);
    if (u <= 0) continue;
    const y = LINE0 + p.line * LINE_H;
    const isDup = p.op < 0;
    const col = isDup && dupGlint > 0 ? mixLab(withAlpha(ink, 0.8), copperInk(env, 0.4), dupGlint) : withAlpha(ink, 0.78);
    // the duplicate repeats line 0 exactly
    codeLine(c, CARD.x + 16, y, isDup ? DUP_OF : p.line, u, col);
    if (u < 1) nib = { x: CARD.x + 16 + 24 + u * (CARD.w - 60), y, active: true };
  }
  c.restore();
  // the pen: a dip-pen nib riding the line being written (drawn unfolded, it lifts away as the card folds)
  if (nib.active && fold <= 0) pen(c, env, nib.x + dx, nib.y);
  // each pass: a fine ink flight from the card's edge to the new tag as it stamps
  if (fold <= 0) {
    for (const p of b.pen) {
      if (p.op < 0) continue;
      const a0 = b.at[p.op];
      const u = seg(t, a0 - 0.22, a0 + 0.02);
      const out = 1 - seg(t, a0 + 0.05, a0 + 0.4);
      if (u <= 0 || out <= 0) continue;
      const from = { x: CARD.x + CARD.w + dx, y: LINE0 + p.line * LINE_H };
      inkThread(c, env, from, opIn(POS[p.op].x, POS[p.op].y, S), u, withAlpha(ink, 0.35 * out), 0.9);
    }
  }
  // the duplicate: a copper thread loops back from the card to the tag that already exists
  const dupLine = b.pen.find((p) => p.op < 0)!;
  const lu = seg(t, b.dup - 0.05, b.dup + 0.45);
  const la = 1 - seg(t, b.fixedList - 0.1, b.fixedList + 0.4);
  if (lu > 0 && la > 0) {
    // from where the pen's nib finished the duplicate line, arcing up over the ribbon and back down onto the tag
    const from = { x: CARD.x + 16 + 24 + (CARD.w - 60) + dx, y: LINE0 + dupLine.line * LINE_H };
    const to = { x: POS[0].x + 8, y: POS[0].y - (OP_TAG.h * S) / 2 };
    loopThread(c, env, from, to, lu, la);
  }
}

/** the duplicate's copper thread: out from the card, a loop back up, landing on the existing tag's top */
function loopThread(c: C2, env: PaintEnv, p0: { x: number; y: number }, p1: { x: number; y: number }, u: number, a: number) {
  c.save();
  const N = 40;
  const c1 = { x: p0.x + 40, y: p0.y - 210 };
  const c2 = { x: p1.x - 30, y: p1.y - 120 };
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const s = (i / N) * u;
    const m = 1 - s;
    pts.push({
      x: m * m * m * p0.x + 3 * m * m * s * c1.x + 3 * m * s * s * c2.x + s * s * s * p1.x,
      y: m * m * m * p0.y + 3 * m * m * s * c1.y + 3 * m * s * s * c2.y + s * s * s * p1.y,
    });
  }
  const trace = () => {
    c.beginPath();
    pts.forEach((p, i) => (i === 0 ? c.moveTo(p.x, p.y) : c.lineTo(p.x, p.y)));
    c.stroke();
  };
  c.lineCap = 'round';
  c.lineJoin = 'round';
  // a pale paper underlay so the copper separates from the ink threads it crosses
  c.strokeStyle = withAlpha(mixLab(paperOf(env), '#fffaf0', 0.6), 0.75 * a);
  c.lineWidth = 5;
  trace();
  // the copper thread itself: 2 px, saturated (the shot's one copper accent)
  c.strokeStyle = withAlpha(mixLab('#b5602a', env.mood.halo, 0.12), a);
  c.lineWidth = 2;
  trace();
  // its running head while it draws: a bright copper bead
  if (u < 1) {
    const h = pts[pts.length - 1];
    c.fillStyle = withAlpha(mixLab('#d98a4e', env.mood.core, 0.2), a);
    c.beginPath();
    c.arc(h.x, h.y, 3.2, 0, Math.PI * 2);
    c.fill();
  }
  if (u >= 1) {
    // where it lands: a small copper knot on the existing tag
    c.fillStyle = withAlpha(mixLab('#b5602a', env.mood.halo, 0.12), a);
    c.beginPath();
    c.arc(p1.x, p1.y, 4.2, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** a brief warm halo behind the tag the duplicate returns (lamp-warm, soft) */
function warmHalo(c: C2, env: PaintEnv, x: number, y: number, a: number) {
  c.save();
  const g = c.createRadialGradient(x, y, 10, x, y, 96);
  g.addColorStop(0, withAlpha(mixLab('#f3c27a', env.mood.core, 0.3), 0.55 * a));
  g.addColorStop(1, withAlpha('#f3c27a', 0));
  c.fillStyle = g;
  c.fillRect(x - 100, y - 100, 200, 200);
  c.restore();
}

/** a dip pen: the nib at (x, y), the holder running up and right out of the card */
function pen(c: C2, env: PaintEnv, x: number, y: number) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.95);
  c.fillStyle = mixLab(env.mood.fg, '#2a1d14', 0.3);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(16, -3.2);
  c.lineTo(16, 3.2);
  c.closePath();
  c.fill();
  c.fillRect(16, -4, 150, 8);
  c.fillStyle = withAlpha(mixLab('#a8823f', env.mood.halo, 0.3), 0.9);
  c.fillRect(16, -4, 16, 8);
  c.restore();
}

/** the card's caption, inked on the plate under the card and the ribbon */
function cardCaption(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = seg(t, b.card + 0.1, b.card + 0.5);
  if (a <= 0) return;
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `italic 400 27px ${FONT.text}`, 27);
    const txt1 = 'builder code: ordinary JS, run once';
    const txt2 = ' · appends to a Circuit';
    c.save();
    c.font = `italic 400 ${size}px ${FONT.text}`;
    const w1 = c.measureText(txt1).width;
    const w2 = c.measureText(txt2).width;
    const x0 = CARD.x + 6;
    const y = 604;
    c.globalAlpha = a;
    c.fillStyle = plateInk(env);
    c.textAlign = 'left';
    c.fillText(txt1, x0, y);
    c.fillStyle = withAlpha(plateInk(env), 0.85);
    c.fillText(txt2, x0 + w1, y);
    textProbe(c, `${ID}-caption`, x0, y - size, w1 + w2, size * 1.25, a);
    c.restore();
  });
}
