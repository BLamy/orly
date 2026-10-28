/**
 * ch08-s04 — A RESULT THAT SHOULD NOT HAVE MOVED, MOVED (plate, winterBlue cold grey light; paperWipe in; 18.58 s).
 *   L0807 "One test, learning two additions, scored nought out of twenty. Multiply its error by a million, which should
 *          change nothing: twenty out of twenty. A tiny safety constant was swamping the slopes."
 *
 * The reassessment's loss-scale test on a parchment plate (sets/ch08-s04-plate), the camera locked (a breath of drift).
 *   test (0.84)        at left, a paper tally board of twenty pegs (twenty seeds) inks in, every peg dark
 *   two (2.03)         the table's row heads ink: loss × · two adds
 *   nought (3.20)      a small card above the tally: 0 / 20; the table's first column: ×1 → 0
 *   Multiply (5.01)    at right, the brass loss-scale dial (six detents ×1 … ×1,000,000): a hand-less crank turns it one
 *                      detent at a time, one dry click each; with each detent the tally lights the real number of pegs
 *                      for the two-adds task, 0, 0, 3, 4, 9, and the table inks that column
 *   which (7.52)       a small arrow at the dial: should change nothing (the spoken words)
 *   twenty (9.24)      the last detent, ×1,000,000: all twenty pegs light; 20 / 20
 *   A (12.26)          the cause inks in under the dial: a balance, a grain of sand (ε) on one pan, a feather (the slope)
 *                      on the other; on 'swamping' the grain's side goes down. The label: Adam's ε = 10⁻⁸ swamped tiny
 *                      slopes, and then the reassessment's caution: not proof it scales.
 * Every number is the script's (LB04, LB05); the earlier report is undated, so nothing places it in July.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, cardPaperAlpha, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { PLATE_CAM, PLATE_INK, P_BRASS, P_COPPER, P_INK, pFont, pInk, plateNear, plateRoom } from '../sets/ch08-s04-plate';

const ID = 'ch08-s04';
type C2 = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

// ---------------------------------------------------------------- the plate's facts (script ch08-s04)
const FACTORS = ['1', '10', '100', '1,000', '10,000', '1,000,000'];
const PEGS_LIT = [0, 0, 3, 4, 9, 20];
const RESULTS = ['0', '0', '3', '4', '9', '20 of 20'];

// ---------------------------------------------------------------- layout (sheet rest px)
const TABLE = { labelX: 172, ruleX: 300, cols: [384, 486, 598, 724, 868, 1052], y1: 98, y2: 150 };
const BOARD = { x: 168, y: 258, w: 392, h: 290 };
const peg = (i: number) => ({ x: BOARD.x + 48 + (i % 5) * 74, y: BOARD.y + 45 + Math.floor(i / 5) * 67 });
const CARD = { x: 364, y: 214 };
const DIAL = { x: 852, y: 404, r: 138 };
/** six detents over a 240° arc, ×1 low at the left round to ×1,000,000 low at the right */
const detentAng = (i: number) => ((-210 + i * 48) * Math.PI) / 180;
/** the crank wheel, lower left of the dial, belted to its hub */
const CRANK = { x: 664, y: 586, r: 28 };
const BAL = { x: 906, y: 590 };
const LABEL = { x: 172, y1: 602, y2: 640 };

interface Beats {
  D: number;
  test: number;
  two: number;
  nought: number;
  multiply: number;
  which: number;
  twenty: number;
  cause: number;
  swamp: number;
  /** each detent lands (×10 … ×1,000,000) */
  det: number[];
}

/** the dial's position (detent index, fractional while it turns) */
function dialAt(tq: number, b: Beats): number {
  let v = 0;
  b.det.forEach((d, i) => {
    const u = clamp01((tq - (d - 0.32)) / 0.32);
    // ease out with a small catch at the detent
    const e = u >= 1 ? 1 : 1 - Math.pow(1 - u, 3) + 0.06 * Math.sin(u * Math.PI);
    v += e;
  });
  return v;
}
/** detents passed (whole) */
const detentNow = (t: number, b: Beats) => b.det.filter((d) => t >= d).length;
/** pegs lit: the detent's real count; the last detent ripples across the board on twos */
function pegsLit(t: number, tq: number, b: Beats): number {
  const n = detentNow(t, b);
  if (n < 5) return PEGS_LIT[n];
  const u = clamp01((tq - b.det[4]) / 0.42);
  return 9 + Math.ceil(11 * u - 1e-6);
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const twenty = T.beat('twenty');
    const multiply = T.beat('dial');
    const b: Beats = {
      D: T.duration,
      test: T.word('L0807', 'test'),
      two: T.word('L0807', 'two'),
      nought: T.beat('zero'),
      multiply,
      which: T.word('L0807', 'which'),
      twenty,
      cause: T.beat('cause'),
      swamp: T.word('L0807', 'swamping'),
      // ×10 … ×10,000 click through on 'Multiply its error by a million'; the million lands just before 'twenty'
      det: [multiply + 0.35, multiply + 1.0, multiply + 1.65, multiply + 2.3, twenty - 0.22],
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const b = sc.b as Beats;
    const t = f.t;
    const tq = q2(t);
    const cam: Camera3 = { ...PLATE_CAM, z: PLATE_CAM.z - 6 + 22 * sm(t / b.D) };
    f.camera(cam);
    plateRoom(f, { key: ID });

    const lit = t < b.nought ? 0 : pegsLit(t, tq, b);
    const pos = dialAt(tq, b);
    f.layer(PLATE_INK, (c, env) => {
      table(c, env, t, b);
      tally(c, env, t, b, lit);
      countCard(c, env, t, b, lit);
      dial(c, env, t, b, pos);
      note(c, env, t, b);
      balance(c, env, t, b);
      causeLabel(c, env, t, b);
      // the newly lit pegs' glow: the plate's one warm light (additive, after the ink)
      pegGlow(c, env, t, tq, b, lit);
    });
    plateNear(f, ID);
  },
});

// ---------------------------------------------------------------- painters (sheet rest px, on PLATE_INK)
/** the table: loss × factors over the two-adds results, a column inked at each detent */
function table(c: C2, env: PaintEnv, t: number, b: Beats) {
  const head = win(t, b.two - 0.1, b.two + 0.4);
  if (head <= 0.003) return;
  c.save();
  c.strokeStyle = withAlpha(P_INK, 0.45 * head);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(TABLE.labelX - 12, (TABLE.y1 + TABLE.y2) / 2 - 8);
  c.lineTo(TABLE.labelX - 12 + (1150 - TABLE.labelX) * head, (TABLE.y1 + TABLE.y2) / 2 - 8);
  c.moveTo(TABLE.ruleX, TABLE.y1 - 26);
  c.lineTo(TABLE.ruleX, TABLE.y2 + 10);
  c.stroke();
  c.restore();
  pInk(c, 'loss ×', TABLE.labelX - 14, TABLE.y1, { font: 'mono', size: 24, alpha: head, id: `${ID}-h1` });
  pInk(c, 'two adds', TABLE.labelX - 14, TABLE.y2, { font: 'italic', size: 25, alpha: head, id: `${ID}-h2` });
  for (let i = 0; i < 6; i++) {
    const at = i === 0 ? b.nought : b.det[i - 1] + 0.05;
    const a = win(t, at - 0.05, at + 0.3);
    if (a <= 0.003) continue;
    const last = i === 5;
    pInk(c, FACTORS[i], TABLE.cols[i], TABLE.y1, { font: 'mono', size: 24, alpha: a, align: 'center', id: `${ID}-f${i}` });
    pInk(c, RESULTS[i], TABLE.cols[i], TABLE.y2, { font: last ? 'monoBold' : 'mono', size: 24, alpha: a, align: 'center', color: last ? mixLab(P_COPPER, P_INK, 0.2) : P_INK, id: `${ID}-r${i}` });
  }
}

/** the tally board: twenty pegs (twenty seeds), dark holes until they light */
function tally(c: C2, env: PaintEnv, t: number, b: Beats, lit: number) {
  const a = win(t, b.test - 0.05, b.test + 0.7);
  if (a <= 0.003) return;
  c.save();
  c.globalAlpha = a;
  // the board: a dark paper frame, a lighter inlay
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.18);
  c.fillRect(BOARD.x + 4, BOARD.y + 5, BOARD.w, BOARD.h);
  c.fillStyle = mixLab('#3a3430', env.mood.set, 0.3);
  c.fillRect(BOARD.x, BOARD.y, BOARD.w, BOARD.h);
  c.fillStyle = mixLab('#6c6156', env.mood.sky[2], 0.25);
  c.fillRect(BOARD.x + 9, BOARD.y + 9, BOARD.w - 18, BOARD.h - 18);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#ffffff', 0.3), 0.5);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(BOARD.x, BOARD.y + 0.6);
  c.lineTo(BOARD.x + BOARD.w, BOARD.y + 0.6);
  c.stroke();
  for (let i = 0; i < 20; i++) {
    const p = peg(i);
    // the hole
    c.fillStyle = mixLab('#1a1714', env.mood.ink, 0.3);
    c.beginPath();
    c.arc(p.x, p.y, 16, 0, Math.PI * 2);
    c.fill();
    if (i < lit) {
      // a lit brass peg: its head catches the light
      const g = c.createRadialGradient(p.x - 4, p.y - 4, 1, p.x, p.y, 13);
      g.addColorStop(0, mixLab('#fff0c8', env.mood.core, 0.2));
      g.addColorStop(0.45, mixLab('#e2b55e', env.mood.halo, 0.12));
      g.addColorStop(1, mixLab(P_BRASS, '#5a3f18', 0.4));
      c.fillStyle = g;
      c.beginPath();
      c.arc(p.x, p.y, 12.5, 0, Math.PI * 2);
      c.fill();
    } else {
      // an unlit peg sunk in its hole
      c.fillStyle = mixLab('#4a4038', env.mood.set, 0.3);
      c.beginPath();
      c.arc(p.x, p.y + 1, 8.5, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

/** the count card above the tally: n / 20 (it first reads 0 / 20 on 'nought'); the paper never shows blank */
function countCard(c: C2, env: PaintEnv, t: number, b: Beats, lit: number) {
  const inkAt = b.nought + 0.04;
  const paper = cardPaperAlpha(t, inkAt, 0.25);
  if (paper <= 0.003) return;
  const ink = clamp01((t - inkAt) / 0.12);
  const text = `${lit} / 20`;
  c.save();
  c.font = pFont(c, { font: 'monoBold', size: 28 }, '20 / 20');
  const w = c.measureText('20 / 20').width + 34, h = 54;
  const x0 = CARD.x - w / 2, y0 = CARD.y - h / 2;
  c.globalAlpha = paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.18);
  c.fillRect(x0 + 2, y0 + 3, w, h);
  c.fillStyle = mixLab('#f6f1e6', env.mood.core, 0.25);
  c.fillRect(x0, y0, w, h);
  c.strokeStyle = withAlpha(P_INK, 0.4);
  c.lineWidth = 0.8;
  c.strokeRect(x0, y0, w, h);
  c.globalAlpha = 1;
  pInk(c, text, CARD.x, CARD.y + 10, { font: 'monoBold', size: 28, alpha: ink, align: 'center', color: lit === 20 ? mixLab(P_COPPER, P_INK, 0.15) : P_INK });
  cardProbe(c, `${ID}-count`, x0, y0, w, h, paper, ink);
  c.restore();
}

/** the brass loss-scale dial: six detents, the pointer, a hand-less crank on the hub, a pawl at the top */
function dial(c: C2, env: PaintEnv, t: number, b: Beats, pos: number) {
  const a = win(t, b.multiply - 1.4, b.multiply - 0.6);
  if (a <= 0.003) return;
  const { x, y, r } = DIAL;
  c.save();
  c.globalAlpha = a;
  // the crank wheel, belted to the hub behind the case: one full turn of its handle per detent (it turns by itself)
  crankWheel(c, env, pos);
  // the case: a dark ring, a brass bezel, a pale face
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
  c.beginPath();
  c.arc(x + 4, y + 5, r + 8, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab('#2a2420', env.mood.ink, 0.2);
  c.beginPath();
  c.arc(x, y, r + 8, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(P_BRASS, env.mood.halo, 0.3);
  c.beginPath();
  c.arc(x, y, r + 3, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab('#efe7d6', env.mood.core, 0.3);
  c.beginPath();
  c.arc(x, y, r - 4, 0, Math.PI * 2);
  c.fill();
  // the detent notches and their marks
  for (let i = 0; i < 6; i++) {
    const ang = detentAng(i);
    c.strokeStyle = P_INK;
    c.lineWidth = 2.4;
    c.beginPath();
    c.moveTo(x + Math.cos(ang) * (r - 22), y + Math.sin(ang) * (r - 22));
    c.lineTo(x + Math.cos(ang) * (r - 6), y + Math.sin(ang) * (r - 6));
    c.stroke();
    c.fillStyle = mixLab('#2a2420', env.mood.ink, 0.2);
    c.beginPath();
    c.arc(x + Math.cos(ang) * (r + 3), y + Math.sin(ang) * (r + 3), 4.2, 0, Math.PI * 2);
    c.fill();
  }
  c.globalAlpha = 1;
  // the labels, outside the bezel
  for (let i = 0; i < 6; i++) {
    const ang = detentAng(i);
    const rx = x + Math.cos(ang) * (r + 24), ry = y + Math.sin(ang) * (r + 24);
    const cx = Math.cos(ang);
    const align: CanvasTextAlign = cx < -0.3 ? 'right' : cx > 0.3 ? 'left' : 'center';
    const on = i <= Math.round(pos) ? 1 : 0.5;
    pInk(c, `×${FACTORS[i]}`, rx, ry + 8 + Math.sin(ang) * 6, { font: 'mono', size: 22, alpha: a * on, align, id: `${ID}-d${i}` });
  }
  c.globalAlpha = a;
  // the crank and pointer turn together about the hub
  const ang = detentAng(0) + (pos * 48 * Math.PI) / 180;
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  // the pointer
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.moveTo(0, -5);
  c.lineTo(r - 18, -1.2);
  c.lineTo(r - 10, 0);
  c.lineTo(r - 18, 1.2);
  c.lineTo(0, 5);
  c.closePath();
  c.fill();
  c.restore();
  // hub
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(x, y, 10, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(P_BRASS, env.mood.core, 0.25);
  c.beginPath();
  c.arc(x, y, 4, 0, Math.PI * 2);
  c.fill();
  // the ratchet pawl at the top: it jumps a hair at each click (on twos)
  const click = b.det.reduce((m, d) => Math.max(m, t >= d ? Math.exp(-(t - d) * 14) : 0), 0);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.save();
  c.translate(x + r * 0.15, y - r - 10);
  c.rotate(-0.25 - 0.3 * click);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(30, -6);
  c.lineTo(30, 2);
  c.closePath();
  c.fill();
  c.restore();
  c.restore();
}

/** a small arrow at the dial: should change nothing (on 'which'), set above it and pointing down at its face */
function note(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = win(t, b.which - 0.05, b.which + 0.45);
  if (a <= 0.003) return;
  const x = DIAL.x, y0 = 206, y1 = DIAL.y - DIAL.r - 4;
  const g = win(t, b.which + 0.05, b.which + 0.5);
  c.save();
  c.strokeStyle = withAlpha(P_INK, 0.8 * a);
  c.lineWidth = 1.6;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y0 + 12);
  c.lineTo(x, y0 + 12 + (y1 - y0 - 12) * g);
  if (g > 0.95) {
    c.moveTo(x - 6, y1 - 9);
    c.lineTo(x, y1);
    c.lineTo(x + 6, y1 - 9);
  }
  c.stroke();
  c.restore();
  pInk(c, 'should change nothing', x, y0, { font: 'italic', size: 24, alpha: a, align: 'center', id: `${ID}-note` });
  void env;
}

/** the cause: a balance under the dial, a feather (the slope) on one pan and a grain of sand (ε) on the other */
function balance(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = win(t, b.cause - 0.05, b.cause + 0.6);
  if (a <= 0.003) return;
  const tilt = 0.14 * win(t, b.swamp - 0.15, b.swamp + 0.5) + 0.025 * Math.exp(-Math.max(0, t - b.swamp - 0.5) * 3) * Math.sin(Math.max(0, t - b.swamp - 0.5) * 11);
  const L = 122;
  c.save();
  c.globalAlpha = a;
  c.fillStyle = PUPPET_NEAR_BLACK;
  // the post and foot
  c.fillRect(BAL.x - 3, BAL.y, 6, 60);
  c.fillRect(BAL.x - 34, BAL.y + 58, 68, 7);
  // the beam (pivot at the post's top): the right (grain) side goes down
  const ends = [-1, 1].map((s) => ({ x: BAL.x + s * L * Math.cos(tilt), y: BAL.y + s * L * Math.sin(tilt) }));
  c.lineWidth = 4;
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(ends[0].x, ends[0].y);
  c.lineTo(ends[1].x, ends[1].y);
  c.stroke();
  c.beginPath();
  c.arc(BAL.x, BAL.y, 5, 0, Math.PI * 2);
  c.fill();
  // the pans on their strings
  ends.forEach((e, i) => {
    const py = e.y + 26;
    c.strokeStyle = withAlpha(P_INK, 0.8);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(e.x, e.y);
    c.lineTo(e.x - 20, py);
    c.moveTo(e.x, e.y);
    c.lineTo(e.x + 20, py);
    c.stroke();
    c.fillStyle = mixLab(P_BRASS, '#3a2a12', 0.35);
    c.beginPath();
    c.moveTo(e.x - 26, py);
    c.quadraticCurveTo(e.x, py + 14, e.x + 26, py);
    c.closePath();
    c.fill();
    if (i === 0) {
      // the feather: a long light quill lying across the pan
      c.fillStyle = mixLab('#f4f1ea', env.mood.core, 0.2);
      c.strokeStyle = withAlpha(P_INK, 0.7);
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(e.x - 22, py - 2);
      c.quadraticCurveTo(e.x - 2, py - 16, e.x + 20, py - 6);
      c.quadraticCurveTo(e.x, py - 4, e.x - 22, py - 2);
      c.fill();
      c.stroke();
      c.beginPath();
      c.moveTo(e.x - 24, py - 1);
      c.quadraticCurveTo(e.x - 2, py - 10, e.x + 21, py - 6);
      c.stroke();
    } else {
      // the grain of sand
      c.fillStyle = PUPPET_NEAR_BLACK;
      c.beginPath();
      c.arc(e.x + 2, py - 3.4, 3.4, 0, Math.PI * 2);
      c.fill();
    }
  });
  c.restore();
  // what each pan holds
  const l = win(t, b.cause + 0.3, b.cause + 0.8);
  pInk(c, 'slope', ends0(BAL, L, tilt, -1).x - 44, ends0(BAL, L, tilt, -1).y + 34, { font: 'italic', size: 22, alpha: l * a, align: 'center', id: `${ID}-slope` });
  pInk(c, 'ε', ends0(BAL, L, tilt, 1).x + 40, ends0(BAL, L, tilt, 1).y + 34, { font: 'italic', size: 26, alpha: l * a, align: 'center', id: `${ID}-eps` });
}
const ends0 = (p: { x: number; y: number }, L: number, tilt: number, s: number) => ({ x: p.x + s * L * Math.cos(tilt), y: p.y + s * L * Math.sin(tilt) });

/** the label: Adam's ε = 10⁻⁸ swamped tiny slopes, then the caution: not proof it scales */
function causeLabel(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a1 = win(t, b.cause + 0.1, b.cause + 0.6);
  if (a1 <= 0.003) return;
  const a2 = win(t, b.swamp + 0.6, b.swamp + 1.1);
  textRole(c, 'subject', () => {
    c.save();
    const base = `500 25px ${FONT.text}`;
    const s = legibleSize(c, base, 25);
    const sup = s * 0.62;
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    c.fillStyle = withAlpha(P_INK, a1);
    const parts: [string, number, number][] = [["Adam's ε = 10", s, 0], ['−8', sup, -s * 0.42], [' swamped tiny slopes', s, 0]];
    let x = LABEL.x;
    for (const [txt, size, dy] of parts) {
      c.font = `500 ${size}px ${FONT.text}`;
      c.fillText(txt, x, LABEL.y1 + dy);
      x += c.measureText(txt).width;
    }
    textProbe(c, `${ID}-cause`, LABEL.x, LABEL.y1 - s, x - LABEL.x, s * 1.1, a1);
    if (a2 > 0.003) {
      c.font = `italic 400 ${s}px ${FONT.text}`;
      c.fillStyle = withAlpha(mixLab(P_INK, '#5a4a3c', 0.3), a2);
      c.fillText('not proof it scales', LABEL.x, LABEL.y2);
      textProbe(c, `${ID}-caution`, LABEL.x, LABEL.y2 - s, c.measureText('not proof it scales').width, s * 1.1, a2);
    }
    c.restore();
  });
}

/** the lit pegs' glow (additive), a brighter flash as each lights */
function pegGlow(c: C2, env: PaintEnv, t: number, tq: number, b: Beats, lit: number) {
  if (lit <= 0) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < lit; i++) {
    const p = peg(i);
    // when did this peg light? (the detent that first reached it, or its ripple step on the last)
    let at = b.det[0];
    for (let k = 1; k <= 5; k++) if (PEGS_LIT[k] > i) { at = k < 5 ? b.det[k - 1] : b.det[4] + (Math.max(0, i - 9) / 11) * 0.42; break; }
    const flash = Math.exp(-Math.max(0, tq - at) * 3);
    const r = 26 + 10 * flash;
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g.addColorStop(0, withAlpha(mixLab('#f0c068', env.mood.core, 0.25), 0.3 + 0.35 * flash));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - r, p.y - r, 2 * r, 2 * r);
  }
  c.restore();
}

/** the crank: a small wheel below-left of the dial with a handle, a belt to the dial's hub; it turns by itself */
function crankWheel(c: C2, env: PaintEnv, pos: number) {
  const { x, y, r } = CRANK;
  const hubR = 20;
  // the belt: the two outer tangents between the wheel and the hub
  const dx = DIAL.x - x, dy = DIAL.y - y;
  const d = Math.hypot(dx, dy);
  const base = Math.atan2(dy, dx);
  const off = Math.acos((r - hubR) / d);
  c.strokeStyle = withAlpha(P_INK, 0.85);
  c.lineWidth = 2;
  c.beginPath();
  for (const sgn of [1, -1]) {
    const a0 = base + sgn * off;
    c.moveTo(x + Math.cos(a0) * r, y + Math.sin(a0) * r);
    c.lineTo(DIAL.x + Math.cos(a0) * hubR, DIAL.y + Math.sin(a0) * hubR);
  }
  c.stroke();
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(P_BRASS, env.mood.halo, 0.3);
  c.beginPath();
  c.arc(x, y, r - 6, 0, Math.PI * 2);
  c.fill();
  // spokes and the handle (one turn per detent)
  const th = pos * Math.PI * 2 - Math.PI / 2;
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 3;
  c.beginPath();
  for (let k = 0; k < 3; k++) {
    const a = th + (k * Math.PI * 2) / 3;
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * (r - 6), y + Math.sin(a) * (r - 6));
  }
  c.stroke();
  const hx = x + Math.cos(th) * (r - 4), hy = y + Math.sin(th) * (r - 4);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(hx - 3, hy - 3, 6, 6);
  c.beginPath();
  c.arc(hx + Math.cos(th) * 10, hy + Math.sin(th) * 10, 8, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(x, y, 6, 0, Math.PI * 2);
  c.fill();
}

