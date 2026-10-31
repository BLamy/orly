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
  { x: 92, y: 90, w: 420, h: 444, title: 'in a row', kind: 'row' as const, res: ROW_S },
  { x: 768, y: 90, w: 420, h: 444, title: 'in pairs', kind: 'pairs' as const, res: PAIRS_S },
];
const STRIP = { x: 34, y0: 104, dy: 54, h: 34, k: 1.12 };
const stripY = (i: number) => STRIP.y0 + i * STRIP.dy;
const RES_Y = 386;
const WATCH = { x: 640, y: 158, r: 44 };
const GAUGE = { x: 640, y0: 236, y1: 420, w: 54, max: 6 };
const RULER = { x: 640, y: 470, w: 132 };
const LABEL = { x: 640, y: 560 };

/** joins inside a plate (plate-local px): from two sources (strip i right end or node) to a knot */
type Node = { x: number; y: number };
function plateGeom(kind: 'row' | 'pairs') {
  const end = (i: number): Node => ({ x: STRIP.x + H[i] * STRIP.k + 6, y: stripY(i) + STRIP.h / 2 });
  if (kind === 'row') {
    const j1 = { x: 330, y: (end(0).y + end(1).y) / 2 + 6 };
    const j2 = { x: 352, y: (j1.y + end(2).y) / 2 + 12 };
    const j3 = { x: 374, y: (j2.y + end(3).y) / 2 + 14 };
    return {
      joins: [
        { from: [end(0), end(1)], at: j1, step: 0 },
        { from: [j1, end(2)], at: j2, step: 1 },
        { from: [j2, end(3)], at: j3, step: 2 },
      ],
      out: j3,
    };
  }
  const p1 = { x: 334, y: (end(0).y + end(1).y) / 2 + 4 };
  const p2 = { x: 334, y: (end(2).y + end(3).y) / 2 + 4 };
  const p3 = { x: 374, y: (p1.y + p2.y) / 2 + 10 };
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
}
const joinAt = (b: Beats, step: number) => b.sums + 0.35 + step * 0.42;
const resultAt = (b: Beats) => b.sums + 0.35 + 3 * 0.42 + 0.1;

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, sums: T.beat('sums'), group: T.beat('group'), slow: T.beat('slow'), drift: T.beat('drift') };
    const keys: CamKey[] = [
      { t: 0, cam: camK(640, 340, 1.0) },
      { t: b.slow - 0.4, cam: camK(640, 334, 1.04) },
      { t: b.drift + 1.6, cam: camK(640, 348, 1.08) },
      { t: b.D + 0.4, cam: camK(640, 350, 1.1) },
    ];
    return { tl, b, keys };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(camAt(sc.keys, t));
    clockRoom(f, { key: ID, oculus: { x: 640, y: 300, r: 300 }, lightGap: 520, sunX: 640, sunY: 300 });
    f.layer('L4', (c, env) => {
      gauge(c, env, t, tq, b);
      PL.forEach((p, i) => plate(f, c, env, t, b, i));
      stopwatch(c, env, t, tq, b);
      stepRuler(c, env, t, b);
      label(c, env, t, b);
    });
    f.rim({ x: 0, y: -1 });
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
    const size = legibleSize(c, `italic 600 28px ${FONT.display}`, 28, P.title);
    c.font = `italic 600 ${size}px ${FONT.display}`;
    c.fillStyle = inkCol(env);
    c.globalAlpha = ink;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillText(P.title, STRIP.x, 62);
    textProbe(c, `${ID}-title${i}`, STRIP.x, 62 - size * 0.7, c.measureText(P.title).width, size * 0.8, ink);
  });
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
      const s = legibleSize(c, `500 19px ${FONT.mono}`, 19, '167.4');
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
    j.from.forEach((a) => copperThread(c, env, a, j.at, u, { sag: 4, glow: 0.5 }));
    const land = t > at ? Math.exp(-(t - at) * 3) : 0;
    knotLight(c, env, j.at.x, j.at.y, u >= 1 ? 0.6 + 0.4 * land : 0, 7);
  });
  // the out thread down to the result
  const rA = resultAt(b);
  const ru = seg(t, rA - 0.3, rA);
  const resTop: Pt = { x: G.out.x, y: RES_Y - 26 };
  if (ru > 0) copperThread(c, env, G.out, resTop, ru, { sag: 0, glow: 0.5 });
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
/** the tiny ruler: two marks one division apart, joined by fine threads to the two glowing tails */
function stepRuler(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = seg(t, b.group + 0.1, b.group + 0.6);
  if (a <= 0.01) return;
  const { x, y, w } = RULER;
  const div = 12;
  const m0 = x - div / 2, m1 = x + div / 2;
  c.save();
  c.globalAlpha = a;
  // threads from the two result cards (their inner edges) to the marks
  const left: Pt = { x: PL[0].x + PL[0].w / 2 + 150, y: RES_Y - 26 + 20 };
  const right: Pt = { x: PL[1].x + PL[1].w / 2 - 160, y: RES_Y - 26 + 20 };
  copperThread(c, env, left, { x: m0, y: y - 8 }, seg(t, b.group + 0.1, b.group + 0.6), { sag: 10, glow: 0.4, w: 1.4 });
  copperThread(c, env, right, { x: m1, y: y - 8 }, seg(t, b.group + 0.1, b.group + 0.6), { sag: 10, glow: 0.4, w: 1.4 });
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
  c.strokeStyle = copperOf(env, 0.7);
  c.lineWidth = lw(c, 2.4);
  for (const mx of [m0, m1]) {
    c.beginPath();
    c.moveTo(mx, y - 10);
    c.lineTo(mx, y + 12);
    c.stroke();
  }
  textRole(c, 'subject', () => {
    const text = 'one 32-bit step';
    const s = legibleSize(c, `italic 500 16px ${FONT.text}`, 16, text);
    c.font = `italic 500 ${s}px ${FONT.text}`;
    c.fillStyle = mixLab(env.mood.core, env.mood.rim, 0.3);
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.fillText(text, x, y + 24);
    const tw = c.measureText(text).width;
    textProbe(c, `${ID}-step`, x - tw / 2, y + 24, tw, s, a);
  });
  c.restore();
}

/** the CPU stopwatch: two hands from twelve; the row's (three dots) stops first, the pairs' (a fork) runs on */
function stopwatch(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const a = seg(t, b.slow - 0.45, b.slow - 0.05);
  if (a <= 0.01) return;
  const { x, y, r } = WATCH;
  const run0 = b.slow;
  const stopRow = run0 + 0.75, stopTree = run0 + 1.45;
  const turns = (stop: number, frac: number) => frac * seg(tq, run0, stop);
  const angRow = -Math.PI / 2 + Math.PI * 2 * turns(stopRow, 0.42);
  const angTree = -Math.PI / 2 + Math.PI * 2 * turns(stopTree, 0.78);
  c.save();
  c.globalAlpha = a;
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
  const hand = (ang: number, len: number, w: number, glyph: 'row' | 'fork') => {
    const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
    c.strokeStyle = inkCol(env);
    c.lineWidth = lw(c, w);
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - Math.cos(ang) * 8, y - Math.sin(ang) * 8);
    c.lineTo(ex, ey);
    c.stroke();
    // the glyph at the tip: a row of three dots, or a small fork
    const gx = x + Math.cos(ang) * (len - 12), gy = y + Math.sin(ang) * (len - 12);
    c.save();
    c.translate(gx, gy);
    c.rotate(ang + Math.PI / 2);
    c.fillStyle = inkCol(env);
    c.strokeStyle = inkCol(env);
    if (glyph === 'row') {
      for (let k = -1; k <= 1; k++) {
        c.beginPath();
        c.arc(0, k * 5, 2.2, 0, Math.PI * 2);
        c.fill();
      }
    } else {
      c.lineWidth = lw(c, 1.6);
      c.beginPath();
      c.moveTo(0, 6);
      c.lineTo(0, 0);
      c.lineTo(-4, -6);
      c.moveTo(0, 0);
      c.lineTo(4, -6);
      c.stroke();
    }
    c.restore();
  };
  hand(angTree, r - 6, 2.2, 'fork');
  hand(angRow, r - 12, 3, 'row');
  // the row's hand stops first: a click flash at its stop
  const fl = tq > stopRow ? Math.exp(-(tq - stopRow) * 4) : 0;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(x, y, 4, 0, Math.PI * 2);
  c.fill();
  if (fl > 0.02) {
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y, 0, x, y, r * 1.3);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.25 * fl));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(x - r * 1.3, y - r * 1.3, r * 2.6, r * 2.6);
  }
  c.restore();
}

/** the 10,000-row drift gauge: rises between the plates; the row's pointer climbs to 5.67 px, the pairs' to 0.26 px */
function gauge(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const rise = seg(t, b.drift - 0.25, b.drift + 0.45);
  if (rise <= 0.01) return;
  const off = (1 - rise) * 260;
  const { x, y0, y1, w, max } = GAUGE;
  const vy = (v: number) => y1 - (v / max) * (y1 - y0);
  const pRow = DRIFT_ROW * seg(tq, b.drift + 0.25, b.drift + 1.25);
  const pTree = DRIFT_TREE * seg(tq, b.drift + 0.25, b.drift + 0.6);
  c.save();
  c.translate(0, off);
  // the column: a dark case with a paper scale
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(x - w / 2 - 8, y0 - 40, w + 16, y1 - y0 + 300);
  c.fillStyle = cardPaper(env);
  c.fillRect(x - w / 2 + 6, y0 - 8, w - 12, y1 - y0 + 16);
  c.strokeStyle = withAlpha(brassOf(env, 0.5), 0.9);
  c.lineWidth = lw(c, 1.6);
  c.strokeRect(x - w / 2 - 5, y0 - 37, w + 10, y1 - y0 + 300);
  // the scale: 0..6 px, a tick per 0.5, numbered per 1 (texture), engraved 10,000 ROWS at the head
  c.strokeStyle = withAlpha(inkCol(env), 0.6);
  for (let v = 0; v <= max + 1e-6; v += 0.5) {
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
    c.fillText(text, x, y0 - 24);
    const tw = c.measureText(text).width;
    textProbe(c, `${ID}-rows`, x - tw / 2, y0 - 24 - s / 2, tw, s, rise);
  });
  // the two pointers: left = in a row, right = in pairs (the plates' sides)
  const pointer = (v: number, side: -1 | 1) => {
    const yy = vy(v);
    const xx = x + side * (w / 2 - 6);
    c.fillStyle = side < 0 ? inkCol(env) : copperOf(env, 0.7);
    c.beginPath();
    c.moveTo(xx, yy);
    c.lineTo(xx + side * 16, yy - 8);
    c.lineTo(xx + side * 16, yy + 8);
    c.closePath();
    c.fill();
    c.strokeStyle = c.fillStyle;
    c.lineWidth = lw(c, 2);
    c.beginPath();
    c.moveTo(xx + side * 16, yy);
    c.lineTo(xx + side * 40, yy);
    c.stroke();
  };
  pointer(pRow, -1);
  pointer(pTree, 1);
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

