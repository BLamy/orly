/**
 * ch06-s08 — THE GROUPING IS PART OF THE ANSWER (plate, the clock room, labGreen; cut; 10.63 s).
 *   L0619 "In thirty-two-bit floats, grouping changes the final digit. The tree is slower here, but drifts far less."
 *
 * Two parchment plates stand side by side in the clock room, the round window's light between them. Each carries the
 * same four paper row strips, 229, 167.4, 208.5 and 194.4 px (strip lengths to scale), joined by copper threads with
 * knots of light: the LEFT plate sums them IN A ROW (a chain of three joins, three deep), the RIGHT plate IN PAIRS (two
 * joins, then one: two deep). The results are computed in FP32 (Math.fround), never typed: 799.300048828125 and
 * 799.2999877929688. A tiny ruler between them shows the gap is one 32-bit step.
 *
 * TEACHES, word by word (PT03, PT06, PT14):
 *   sums (0.30)        the plates, strips and numbers; the joins draw (the row three in turn, the pairs two at once,
 *                      then one); the two results ink at the foot of each plate
 *   group (2.31)       'grouping': the results' last digits glow; threads from them run to the tiny ruler's two marks,
 *                      one step apart (one 32-bit step)
 *   slow (5.63)        'slower': a small CPU stopwatch between the plates; two hands (a row of three dots, a fork) run
 *                      from twelve: the row's hand stops first, the fork's runs on (hands only, no caption)
 *   drift (6.82)       'drifts': a tall drift gauge, its scale engraved 10,000 ROWS, rises between the plates; the left
 *                      (row) pointer climbs to 5.67 px, the right (pairs) pointer barely moves, 0.26 px (both against
 *                      float64 sums of the same heights); the label inks under it. Neither plate is struck. Hold.
 */
import { Timeline } from '../../../core';
import type { Frame, PaintEnv } from '../../../film';
import { FONT, cardInkAlpha, cardPaperAlpha, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { brassOf, cardPaper, clockNear, clockRoom, inkCol, lw, plateSheet, seg, shadowCol, twos } from '../sets/ch06-s01-clockroom';
import { camAt, camK, copperThread, knotLight, type CamKey, type Pt } from '../sets/ch06-s06-kit';
import { ch06Near, windowVeil } from '../sets/ch06-s06-near';

const NEAR_CAM = camK(640, 340, 1.04);
import { copperOf } from '../sets/narratorHands';

type C2 = CanvasRenderingContext2D;
const ID = 'ch06-s08';
const f32 = Math.fround;

const H = [229, 167.4, 208.5, 194.4];
const ROW = f32(f32(f32(f32(H[0]) + f32(H[1])) + f32(H[2])) + f32(H[3]));
const PAIRS = f32(f32(f32(H[0]) + f32(H[1])) + f32(f32(H[2]) + f32(H[3])));
const ROW_S = String(ROW);
const PAIRS_S = String(PAIRS);
/** the digits that glow: the tail after the first four decimals */
const split = (s: string) => {
  const i = s.indexOf('.') + 5;
  return [s.slice(0, i), s.slice(i)];
};
/** drift at 10,000 rows against float64 sums (PT14) */
const DRIFT_ROW = 5.67, DRIFT_TREE = 0.26;

const PL = [
  { x: 64, y: 86, w: 404, h: 404, title: 'in a row', kind: 'row' as const, res: ROW_S },
  { x: 812, y: 86, w: 404, h: 404, title: 'in pairs', kind: 'pairs' as const, res: PAIRS_S },
];
const STRIP = { x: 30, y0: 92, dy: 60, h: 42, k: 1.1 };
const stripY = (i: number) => STRIP.y0 + i * STRIP.dy;
const RES_Y = 388;
/**
 * review r1 layout of the centre column (top to bottom, no overlaps): the stopwatch raised; the gauge shortened onto
 * its own plinth standing on the bench (y 206-488); the one-32-bit-step ruler under the plates' result cards, below
 * the plinth; the drift label on the bench below it all
 */
const WATCH = { x: 640, y: 104, r: 50 };
const GAUGE = { x: 640, y0: 248, y1: 436, w: 62, max: 6.5, plinth: 470, bench: 490 };
const RULER = { x: 640, y: 520, w: 150 };
const LABEL = { x: 640, y: 594 };
/** identities: the row (chain) is plate ink, the pairs (tree) the warm copper accent; each plate carries a marker */
const MARK_ROW = { x: PL[0].x + PL[0].w - 22, y: PL[0].y + 22 };
const MARK_TREE = { x: PL[1].x + 22, y: PL[1].y + 22 };

/** joins inside a plate (plate-local px): from two sources (strip i right end or node) to a knot */
type Node = { x: number; y: number };
function plateGeom(kind: 'row' | 'pairs') {
  const end = (i: number): Node => ({ x: STRIP.x + H[i] * STRIP.k + 6, y: stripY(i) + STRIP.h / 2 });
  if (kind === 'row') {
    const j1 = { x: 308, y: (end(0).y + end(1).y) / 2 + 6 };
    const j2 = { x: 336, y: (j1.y + end(2).y) / 2 + 12 };
    const j3 = { x: 364, y: (j2.y + end(3).y) / 2 + 14 };
    return {
      joins: [
        { from: [end(0), end(1)], at: j1, step: 0 },
        { from: [j1, end(2)], at: j2, step: 1 },
        { from: [j2, end(3)], at: j3, step: 2 },
      ],
      out: j3,
    };
  }
  const p1 = { x: 314, y: (end(0).y + end(1).y) / 2 + 4 };
  const p2 = { x: 314, y: (end(2).y + end(3).y) / 2 + 4 };
  const p3 = { x: 364, y: (p1.y + p2.y) / 2 + 10 };
  return {
    joins: [
      { from: [end(0), end(1)], at: p1, step: 0 },
      { from: [end(2), end(3)], at: p2, step: 0 },
      { from: [p1, p2], at: p3, step: 1 },
    ],
    out: p3,
  };
}
const GEOM = { row: plateGeom('row'), pairs: plateGeom('pairs') };

interface Beats {
  D: number;
  sums: number;
  group: number;
  slow: number;
  drift: number;
  /** 'digit': the ruler's bracket lights (the actual proof: one 32-bit step) */
  digit: number;
}
const joinAt = (b: Beats, step: number) => b.sums + 0.35 + step * 0.42;
const resultAt = (b: Beats) => b.sums + 0.35 + 3 * 0.42 + 0.1;

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, sums: T.beat('sums'), group: T.beat('group'), slow: T.beat('slow'), drift: T.beat('drift'), digit: T.word('L0619', 'digit') };
    const keys: CamKey[] = [
      { t: 0, cam: camK(640, 340, 1.0) },
      { t: b.slow - 0.4, cam: camK(640, 334, 1.04) },
      { t: b.drift + 1.6, cam: camK(640, 356, 1.07) },
      { t: b.D + 0.4, cam: camK(640, 360, 1.085) },
    ];
    return { tl, b, keys };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(camAt(sc.keys, t));
    clockRoom(f, { key: ID, oculus: { x: 640, y: 300, r: 300 }, lightGap: 520, sunX: 640, sunY: 300 });
    // review r1: the window hazed ~20 % darker behind the centre column, so the needles and hands read
    f.layer('L3', (c, env) => windowVeil(c, env, { x: 640, y: 300, rx: 300, ry: 330, alpha: 0.3 }));
    f.layer('L4', (c, env) => {
      gauge(c, env, t, tq, b);
      PL.forEach((p, i) => plate(f, c, env, t, b, i));
      stopwatch(c, env, t, tq, b);
      stepRuler(c, env, t, b);
      label(c, env, t, b);
    });
    f.rim({ x: 0, y: -1 });
    // review r1: a dark cut-paper near plane at both lower corners (the bench's moulded, pierced edge)
    ch06Near(f, { key: `${ID}-L`, side: 'left', cam: NEAR_CAM, kind: 'bench', size: 0.62 });
    ch06Near(f, { key: `${ID}-R`, side: 'right', cam: NEAR_CAM, kind: 'bench', size: 0.62 });
    clockNear(f, { key: ID, lip: 694, post: 1540, postL: -280 });
  },
});

// ------------------------------------------------------------------ a plate
function plate(f: Frame, c: C2, env: PaintEnv, t: number, b: Beats, i: number) {
  const P = PL[i];
  const G = GEOM[P.kind];
  // the parchment, baked (with its hanging cords)
  f.cached(`${ID}/plate${i}/${env.mood.id}`, P.w + 60, P.h + 120, (cc) => {
    cc.translate(30, 90);
    cc.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.85);
    cc.lineWidth = 2;
    cc.beginPath();
    cc.moveTo(P.w * 0.2, 0);
    cc.lineTo(P.w * 0.2, -90);
    cc.moveTo(P.w * 0.8, 0);
    cc.lineTo(P.w * 0.8, -90);
    cc.stroke();
    plateSheet(cc, env, { x: 0, y: 0, w: P.w, h: P.h }, { x: P.w * 0.5, y: -60 });
  })(c, P.x - 30, P.y - 90);
  c.save();
  c.translate(P.x, P.y);
  const inkAt = Math.max(0.05, b.sums - 0.2);
  const ink = cardInkAlpha(t, inkAt);
  cardProbe(c, `${ID}-plate${i}`, 0, 0, P.w, P.h, 1, ink);
  // the title
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `italic 600 32px ${FONT.display}`, 32, P.title);
    c.font = `italic 600 ${size}px ${FONT.display}`;
    c.fillStyle = inkCol(env);
    c.globalAlpha = ink;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillText(P.title, STRIP.x, 64);
    textProbe(c, `${ID}-title${i}`, STRIP.x, 64 - size * 0.7, c.measureText(P.title).width, size * 0.8, ink);
  });
  // the plate's identity marker (top inner corner): a brass-rimmed pin in its colour, the stopwatch thread's anchor
  {
    const m = i === 0 ? MARK_ROW : MARK_TREE;
    const a = seg(t, b.slow - 0.45, b.slow - 0.05);
    if (a > 0.01) {
      c.globalAlpha = a;
      c.fillStyle = withAlpha(shadowCol, 0.4);
      c.beginPath();
      c.arc(m.x - P.x + 1.5, m.y - P.y + 2, 7.5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = i === 0 ? inkCol(env) : copperOf(env, 0.85);
      c.beginPath();
      c.arc(m.x - P.x, m.y - P.y, 7, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = withAlpha(brassOf(env, 0.5), 0.9);
      c.lineWidth = lw(c, 1.4);
      c.stroke();
      c.globalAlpha = 1;
    }
  }
  // the four strips, lengths to scale, each with its height
  H.forEach((h, k) => {
    const y = stripY(k), w = h * STRIP.k;
    c.globalAlpha = 1;
    c.fillStyle = withAlpha(shadowCol, 0.3);
    c.fillRect(STRIP.x + 2, y + 3, w, STRIP.h);
    c.fillStyle = mixLab(cardPaper(env), '#ffffff', 0.15);
    c.fillRect(STRIP.x, y, w, STRIP.h);
    c.strokeStyle = withAlpha(inkCol(env), 0.4);
    c.lineWidth = lw(c, 1.1);
    c.strokeRect(STRIP.x, y, w, STRIP.h);
    textRole(c, 'subject', () => {
      const s = legibleSize(c, `500 22px ${FONT.mono}`, 22, '167.4');
      c.font = `500 ${s}px ${FONT.mono}`;
      c.fillStyle = inkCol(env);
      c.globalAlpha = ink;
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText(String(h), STRIP.x + 10, y + STRIP.h / 2 + s * 0.04);
      textProbe(c, `${ID}-strip${i}-${k}`, STRIP.x + 10, y + STRIP.h / 2 - s / 2, c.measureText(String(h)).width, s, ink);
    });
  });
  // the joins: copper threads into knots of light
  G.joins.forEach((j) => {
    const at = joinAt(b, j.step);
    const u = seg(t, at - 0.35, at);
    if (u <= 0) return;
    j.from.forEach((a) => copperThread(c, env, a, j.at, u, { sag: 4, paper: true, w: 2.4 }));
    const land = t > at ? Math.exp(-(t - at) * 3) : 0;
    knotLight(c, env, j.at.x, j.at.y, u >= 1 ? 0.6 + 0.4 * land : 0, 9, { paper: true });
  });
  // the out thread down to the result
  const rA = resultAt(b);
  const ru = seg(t, rA - 0.3, rA);
  const resTop: Pt = { x: G.out.x, y: RES_Y - 26 };
  if (ru > 0) copperThread(c, env, G.out, resTop, ru, { sag: 0, paper: true, w: 2.4 });
  result(c, env, t, b, i);
  c.restore();
}

/** a plate's result: computed in FP32; the tail digits glow from 'grouping' */
function result(c: C2, env: PaintEnv, t: number, b: Beats, i: number) {
  const P = PL[i];
  const inkAt = resultAt(b);
  const paper = cardPaperAlpha(t, inkAt);
  if (paper <= 0.01) return;
  const ink = cardInkAlpha(t, inkAt);
  const glow = seg(t, b.group - 0.1, b.group + 0.35);
  const [head, tail] = split(P.res);
  textRole(c, 'subject', () => {
    const s = legibleSize(c, `600 22px ${FONT.mono}`, 22, P.res);
    c.save();
    c.font = `600 ${s}px ${FONT.mono}`;
    const wH = c.measureText(head).width, wT = c.measureText(tail).width;
    const w = wH + wT + s * 1.2, h = s * 1.8;
    const x = P.w / 2 - w / 2, y = RES_Y - 26;
    c.globalAlpha = paper;
    c.fillStyle = withAlpha(shadowCol, 0.35);
    c.fillRect(x + 2, y + 3, w, h);
    c.fillStyle = cardPaper(env);
    c.fillRect(x, y, w, h);
    c.strokeStyle = withAlpha(brassOf(env, 0.4), 0.9);
    c.lineWidth = lw(c, 1.6);
    c.strokeRect(x, y, w, h);
    cardProbe(c, `${ID}-res${i}-card`, x, y, w, h, paper, ink);
    c.globalAlpha = paper * ink;
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    const ty = y + h / 2 + s * 0.04;
    c.fillStyle = inkCol(env);
    c.fillText(head, x + s * 0.6, ty);
    // the tail: copper, with a soft additive glow behind it
    if (glow > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const gx = x + s * 0.6 + wH + wT / 2;
      const g = c.createRadialGradient(gx, ty, 0, gx, ty, wT * 0.75);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.32 * glow));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(gx - wT, ty - s * 1.4, wT * 2, s * 2.8);
      c.restore();
    }
    c.fillStyle = mixLab(inkCol(env), mixLab('#9a4a18', copperOf(env, 0.6), 0.4), glow);
    c.fillText(tail, x + s * 0.6 + wH, ty);
    textProbe(c, `${ID}-res${i}`, x + s * 0.6, ty - s / 2, wH + wT, s, paper * ink);
    c.restore();
  });
}

// ------------------------------------------------------------------ between the plates
/**
 * the tiny ruler under the plates' result cards: two marks one division apart, joined by fine threads to the two
 * glowing tails. review r1: its bracket LIGHTS on 'digit' for ~1 s (the proof), and it fades to 0.4 as the gauge rises
 */
function stepRuler(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a0 = seg(t, b.group + 0.1, b.group + 0.6);
  if (a0 <= 0.01) return;
  const a = a0 * (1 - 0.6 * seg(t, b.drift - 0.3, b.drift + 0.3));
  const hl = seg(t, b.digit - 0.15, b.digit + 0.1) * (1 - seg(t, b.digit + 0.9, b.digit + 1.3));
  const { x, y, w } = RULER;
  const div = 12;
  const m0 = x - div / 2, m1 = x + div / 2;
  c.save();
  c.globalAlpha = a;
  // threads from the two result cards (the plates' inner edges at the result row) to the marks
  const left: Pt = { x: PL[0].x + PL[0].w - 4, y: PL[0].y + RES_Y - 6 };
  const right: Pt = { x: PL[1].x + 4, y: PL[1].y + RES_Y - 6 };
  const tu = seg(t, b.group + 0.1, b.group + 0.6);
  copperThread(c, env, left, { x: m0, y: y - 10 }, tu, { sag: 8, glow: 0.4 + 0.6 * hl, w: 1.4 + 0.8 * hl });
  copperThread(c, env, right, { x: m1, y: y - 10 }, tu, { sag: 8, glow: 0.4 + 0.6 * hl, w: 1.4 + 0.8 * hl });
  // the ruler: a paper strip with fine divisions
  c.fillStyle = withAlpha(shadowCol, 0.4);
  c.fillRect(x - w / 2 + 2, y + 2, w, 20);
  c.fillStyle = cardPaper(env);
  c.fillRect(x - w / 2, y - 2, w, 20);
  c.strokeStyle = withAlpha(inkCol(env), 0.6);
  c.lineWidth = lw(c, 1);
  for (let k = -5; k <= 5; k++) {
    const xx = x + k * div;
    c.beginPath();
    c.moveTo(xx, y - 2);
    c.lineTo(xx, y + (k % 5 === 0 ? 10 : 6));
    c.stroke();
  }
  // the bracket: the two copper marks and the span between them, lit on 'digit'
  if (hl > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y + 6, 0, x, y + 6, 40);
    g.addColorStop(0, withAlpha(env.mood.core, 0.55 * hl));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(x - 40, y - 34, 80, 80);
    c.restore();
  }
  c.strokeStyle = copperOf(env, 0.7 + 0.3 * hl);
  c.lineWidth = lw(c, 2.4 + 0.8 * hl);
  c.beginPath();
  c.moveTo(m0, y - 10);
  c.lineTo(m0, y + 14);
  c.lineTo(m1, y + 14);
  c.lineTo(m1, y - 10);
  c.stroke();
  textRole(c, 'subject', () => {
    const text = 'one 32-bit step';
    const s = legibleSize(c, `italic 500 16px ${FONT.text}`, 16, text);
    c.font = `italic 500 ${s}px ${FONT.text}`;
    c.fillStyle = mixLab(mixLab(env.mood.core, env.mood.rim, 0.3), '#ffffff', 0.25 * hl);
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.fillText(text, x, y + 24);
    const tw = c.measureText(text).width;
    textProbe(c, `${ID}-step`, x - tw / 2, y + 24, tw, s, a);
  });
  c.restore();
}

/**
 * the CPU stopwatch (review r1): each hand carries its plate's identity, a fine thread from the hub to that plate's
 * marker, the chain's hand in plate ink, the tree's in the warm copper. Both run from twelve at one rate; the chain's
 * stops first with a visible tick (~5.9 s) while the tree's sweeps on and stops about half a second later
 */
function stopwatch(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const a = seg(t, b.slow - 0.45, b.slow - 0.05);
  if (a <= 0.01) return;
  const { x, y, r } = WATCH;
  const run0 = b.slow - 0.05;
  const stopRow = run0 + 0.32, stopTree = stopRow + 0.52;
  const rate = Math.PI * 2 * 0.95;
  const ang = (stop: number) => -Math.PI / 2 + rate * Math.max(0, Math.min(tq, stop) - run0);
  // the tick: the chain's hand jolts back a hair as it stops
  const jolt = (stop: number) => (tq > stop ? -0.07 * Math.exp(-(tq - stop) * 9) * Math.cos((tq - stop) * 30) : 0);
  const angRow = ang(stopRow) + jolt(stopRow);
  const angTree = ang(stopTree) + jolt(stopTree) * 0.6;
  c.save();
  c.globalAlpha = a;
  // the identity threads from the hub out to each plate's marker (behind the case)
  c.lineCap = 'round';
  c.strokeStyle = withAlpha(inkCol(env), 0.75);
  c.lineWidth = Math.max(lw(c, 1.3), 0.9);
  c.beginPath();
  c.moveTo(x - r * 0.9, y + 6);
  c.quadraticCurveTo((x + MARK_ROW.x) / 2, y + 30, MARK_ROW.x, MARK_ROW.y);
  c.stroke();
  copperThread(c, env, { x: x + r * 0.9, y: y + 6 }, MARK_TREE, 1, { sag: 12, glow: 0.5, w: 1.4 });
  // hanging cord, crown and case
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = lw(c, 2);
  c.beginPath();
  c.moveTo(x, -40);
  c.lineTo(x, y - r - 14);
  c.stroke();
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(x - 6, y - r - 16, 12, 10);
  c.beginPath();
  c.arc(x, y, r + 6, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(brassOf(env, 0.55), 0.95);
  c.lineWidth = lw(c, 2);
  c.beginPath();
  c.arc(x, y, r + 3, Math.PI * 1.05, Math.PI * 1.95);
  c.stroke();
  // the dial
  c.fillStyle = cardPaper(env);
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(inkCol(env), 0.6);
  for (let k = 0; k < 60; k++) {
    const an = (k / 60) * Math.PI * 2;
    const L = k % 5 === 0 ? 7 : 3.5;
    c.lineWidth = lw(c, k % 5 === 0 ? 1.4 : 0.8);
    c.beginPath();
    c.moveTo(x + Math.cos(an) * (r - 2), y + Math.sin(an) * (r - 2));
    c.lineTo(x + Math.cos(an) * (r - 2 - L), y + Math.sin(an) * (r - 2 - L));
    c.stroke();
  }
  const hand = (an: number, len: number, w: number, col: string) => {
    c.strokeStyle = col;
    c.lineWidth = lw(c, w);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - Math.cos(an) * 9, y - Math.sin(an) * 9);
    c.lineTo(x + Math.cos(an) * len, y + Math.sin(an) * len);
    c.stroke();
    // a small counterweight disc in the hand's colour
    c.fillStyle = col;
    c.beginPath();
    c.arc(x - Math.cos(an) * 9, y - Math.sin(an) * 9, 3, 0, Math.PI * 2);
    c.fill();
  };
  hand(angTree, r - 5, 2.8, copperOf(env, 0.9));
  hand(angRow, r - 10, 3.2, inkCol(env));
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(x, y, 4.2, 0, Math.PI * 2);
  c.fill();
  // each stop: a click flash at the hand's tip, the chain's first
  for (const [stop, an, warm] of [[stopRow, angRow, 0], [stopTree, angTree, 1]] as const) {
    const fl = tq > stop ? Math.exp(-(tq - stop) * 5) : 0;
    if (fl <= 0.02) continue;
    const tx = x + Math.cos(an) * (r - 10), ty = y + Math.sin(an) * (r - 10);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(tx, ty, 0, tx, ty, 22);
    g.addColorStop(0, withAlpha(warm ? env.mood.core : mixLab(env.mood.rim, '#ffffff', 0.4), 0.55 * fl));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(tx - 22, ty - 22, 44, 44);
    c.restore();
  }
  c.restore();
}

/**
 * the 10,000-row drift gauge (review r1): shortened onto its own plinth on the bench, rising out of it on 'drifts'.
 * Each needle carries its plate's identity and an engraved tab: 'in a row' (plate ink, left) SWINGS up to 5.67 px,
 * overshoots and settles over ~0.6 s; 'in pairs' (copper, right) barely moves, to 0.26 px
 */
function gauge(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const rise = seg(t, b.drift - 0.25, b.drift + 0.45);
  if (rise <= 0.01) return;
  const { x, y0, y1, w, max, plinth, bench } = GAUGE;
  const off = (1 - rise) * (bench - (y0 - 44));
  const vy = (v: number) => y1 - (v / max) * (y1 - y0);
  const d0 = b.drift + 0.3;
  const settle = 0.42 * (tq > d0 + 0.4 ? Math.exp(-(tq - d0 - 0.4) * 5.5) * Math.sin((tq - d0 - 0.4) * 13) : 0);
  const pRow = DRIFT_ROW * seg(tq, d0, d0 + 0.4) * (1 + 0.06 * Math.sin(Math.PI * seg(tq, d0 + 0.2, d0 + 0.4))) + settle;
  const pTree = DRIFT_TREE * seg(tq, d0, d0 + 0.35) + (tq > d0 + 0.35 ? 0.02 * Math.exp(-(tq - d0 - 0.35) * 6) * Math.sin((tq - d0 - 0.35) * 18) : 0);
  c.save();
  // it rises out of the bench: clipped at the bench line
  c.beginPath();
  c.rect(x - 200, -400, 400, bench + 400);
  c.clip();
  // the plinth (fixed on the bench): a stepped dark block with a brass edge
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(x - 54, plinth, 108, bench - plinth);
  c.fillRect(x - 44, plinth - 8, 88, 10);
  c.strokeStyle = withAlpha(brassOf(env, 0.45), 0.85);
  c.lineWidth = lw(c, 1.6);
  c.beginPath();
  c.moveTo(x - 54, plinth);
  c.lineTo(x + 54, plinth);
  c.stroke();
  c.translate(0, off);
  // the column: a dark case with a paper scale, standing in the plinth
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(x - w / 2 - 8, y0 - 44, w + 16, plinth - 8 - (y0 - 44));
  c.fillStyle = mixLab(brassOf(env, 0.45), cardPaper(env), 0.35);
  c.fillRect(x - w / 2 + 6, y0 - 8, w - 12, y1 - y0 + 16);
  // the scale face is engraved (its ticks are its ink), never a blank card
  cardProbe(c, `${ID}-gauge-face`, x - w / 2 + 6, y0 - 8, w - 12, y1 - y0 + 16, rise, rise);
  c.strokeStyle = withAlpha(brassOf(env, 0.5), 0.9);
  c.lineWidth = lw(c, 1.6);
  c.strokeRect(x - w / 2 - 5, y0 - 41, w + 10, plinth - 14 - (y0 - 44));
  c.strokeStyle = withAlpha(inkCol(env), 0.6);
  for (let v = 0; v <= 6 + 1e-6; v += 0.5) {
    const yy = vy(v);
    c.lineWidth = lw(c, v % 1 === 0 ? 1.3 : 0.8);
    c.beginPath();
    c.moveTo(x - (v % 1 === 0 ? 10 : 6), yy);
    c.lineTo(x + (v % 1 === 0 ? 10 : 6), yy);
    c.stroke();
  }
  textRole(c, 'subject', () => {
    const text = '10,000 ROWS';
    const s = legibleSize(c, `600 13px ${FONT.sc}`, 13, text);
    c.font = `600 ${s}px ${FONT.sc}`;
    c.fillStyle = brassOf(env, 0.75);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, x, y0 - 25);
    const tw = c.measureText(text).width;
    textProbe(c, `${ID}-rows`, x - tw / 2, y0 - 25 - s / 2, tw, s, rise);
  });
  // the two needles with their engraved tabs: left = in a row (plate ink), right = in pairs (copper)
  const needle = (v: number, side: -1 | 1, text: string) => {
    const yy = vy(v);
    const xx = x + side * (w / 2 - 6);
    const col = side < 0 ? mixLab(cardPaper(env), '#ffffff', 0.25) : copperOf(env, 0.85);
    c.fillStyle = col;
    c.strokeStyle = side < 0 ? inkCol(env) : mixLab(copperOf(env, 0.5), PUPPET_NEAR_BLACK, 0.4);
    c.lineWidth = lw(c, 1.2);
    c.beginPath();
    c.moveTo(xx, yy);
    c.lineTo(xx + side * 16, yy - 8);
    c.lineTo(xx + side * 16, yy + 8);
    c.closePath();
    c.fill();
    c.stroke();
    c.strokeStyle = col;
    c.lineWidth = lw(c, 2.2);
    c.beginPath();
    c.moveTo(xx + side * 16, yy);
    c.lineTo(xx + side * 30, yy);
    c.stroke();
    // the engraved tab riding the needle's tail
    textRole(c, 'subject', () => {
      const s = legibleSize(c, `italic 600 15px ${FONT.display}`, 15, text);
      c.font = `italic 600 ${s}px ${FONT.display}`;
      const tw = c.measureText(text).width;
      const pw = tw + s * 0.8, ph = s * 1.35;
      const px = side < 0 ? xx - 30 - pw : xx + 30, py = yy - ph / 2;
      c.fillStyle = withAlpha(shadowCol, 0.4);
      c.fillRect(px + 2, py + 2.5, pw, ph);
      c.fillStyle = side < 0 ? mixLab(cardPaper(env), '#ffffff', 0.1) : mixLab(copperOf(env, 0.6), cardPaper(env), 0.55);
      c.fillRect(px, py, pw, ph);
      c.strokeStyle = side < 0 ? withAlpha(inkCol(env), 0.6) : copperOf(env, 0.9);
      c.lineWidth = lw(c, 1.4);
      c.strokeRect(px, py, pw, ph);
      cardProbe(c, `${ID}-needle${side}-card`, px, py, pw, ph, rise, rise);
      c.fillStyle = inkCol(env);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(text, px + pw / 2, yy + s * 0.04);
      textProbe(c, `${ID}-needle${side}`, px + pw / 2 - tw / 2, yy - s / 2, tw, s, rise);
    });
  };
  needle(pRow, -1, PL[0].title);
  needle(pTree, 1, PL[1].title);
  c.restore();
}

/** the label under the gauge: drift: loop 5.67 px · tree 0.26 px */
function label(c: C2, env: PaintEnv, t: number, b: Beats) {
  const inkAt = b.drift + 0.9;
  const paper = cardPaperAlpha(t, inkAt);
  if (paper <= 0.01) return;
  const ink = cardInkAlpha(t, inkAt);
  const text = `drift: loop ${DRIFT_ROW} px · tree ${DRIFT_TREE} px`;
  textRole(c, 'subject', () => {
    const s = legibleSize(c, `500 18px ${FONT.mono}`, 18, text);
    c.save();
    c.font = `500 ${s}px ${FONT.mono}`;
    const tw = c.measureText(text).width;
    const w = tw + s * 1.4, h = s * 1.9;
    const x = LABEL.x - w / 2, y = LABEL.y - h / 2;
    c.globalAlpha = paper;
    c.fillStyle = withAlpha(shadowCol, 0.4);
    c.fillRect(x + 3, y + 4, w, h);
    c.fillStyle = cardPaper(env);
    c.fillRect(x, y, w, h);
    c.strokeStyle = withAlpha(inkCol(env), 0.3);
    c.lineWidth = lw(c, 1.1);
    c.strokeRect(x, y, w, h);
    cardProbe(c, `${ID}-label-card`, x, y, w, h, paper, ink);
    c.globalAlpha = paper * ink;
    c.fillStyle = inkCol(env);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(text, LABEL.x, LABEL.y + s * 0.04);
    textProbe(c, `${ID}-label`, LABEL.x - tw / 2, LABEL.y - s / 2, tw, s, paper * ink);
    c.restore();
  });
}

