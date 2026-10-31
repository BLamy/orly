/**
 * ch03-s05 — THE FOUR INSTRUCTIONS, the program's whole instruction set (plate, parchment; crossfade in from the
 * source-table plate; 19.29 s).
 *   L0309 "Four instructions: a weighted sum, a gated product, a snap to a whole number, a read from a list."
 *   L0310 "Each step rounds to a thirty-two-bit float, a number that keeps about seven digits. Even whole numbers stay
 *          exact only to about seventeen million."
 *
 * The same ch03 parchment plate (sets/ch03-s02-plate). The toggle's filled pigeonhole strip from ch03-s04 slides up
 * to the top margin. Four rows appear down the plate, one per instruction, each a formula ENGRAVED small into the
 * parchment as plate lettering (texture at this distance; PR02, PR03's evaluated affine form, never the bare code
 * line) with its paper object beside it, drawn in the plate's ink:
 *   sum (2.69)     a loom row: five threads of different weights converging on one knot ·
 *                  affine: value = f(bias) + Σ f(f(weight) × wire), term by term
 *   gated (3.76)   a paper valve: the flow passes through an opening of max(0, gate) ·
 *                  reglu(left, gate) = f(left × max(0, gate))
 *   snap (5.47)    a toothed detent wheel and its pawl · boolean(score) = f(f(f(score) + 8,388,609) − 8,388,609)
 *                  (the odd number in full, twice, at the same weight as every other glyph: a silent plant, paid in
 *                  ch04-s12; nothing draws attention to it)
 *   read (7.29)    a card drawer with a pointer · index: values[candidates[floor(form)]]; the caption naming the four
 *                  sets in under the rows
 *   rounds (9.82)  a faint 'f' stamp prints beside every operation in all four rows; the FP32 small print sets in
 *   whole (15.14)  a short ink ruler of whole-number ticks runs out along the foot of the plate; near its far end the
 *                  ticks begin to skip, two apart (exact only so far)
 *   (hold)         the plate rests; the detent wheel turns one tooth and stops
 */
import { Timeline } from '../../../core';
import type { PaintEnv } from '../../../film';
import { FONT, defineShot, ghostOk, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { STRIP, clamp01, groupBrackets, plateBack, plateCam, plateInk, plateNear, seg, sm, toggleTable, twos } from '../sets/ch03-s02-plate';

type C2 = CanvasRenderingContext2D;
const ID = 'ch03-s05';

/** the strip's resting place in ch03-s04 (its top-left) and at the top margin here */
const STRIP_FROM = { x: STRIP.x, y: STRIP.y, s: 1 };
const STRIP_TO = { x: 330, y: 62, s: 0.62 };
const ROW_Y = [214, 290, 366, 442];
const OBJ_X = 214;
const TXT_X = 316;
const FORMULAS = [
  'affine: value = f(bias) + Σ f(f(weight) × wire), term by term',
  'reglu(left, gate) = f(left × max(0, gate))',
  'boolean(score) = f(f(f(score) + 8,388,609) − 8,388,609)',
  'index: values[candidates[floor(form)]]',
];

interface Beats {
  D: number;
  rows: number[];
  read: number;
  round: number;
  exact: number;
  tooth: number;
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const rows = [T.beat('sum'), T.beat('gated'), T.beat('snap'), T.beat('read')];
    const b: Beats = { D: T.duration, rows, read: rows[3], round: T.beat('round'), exact: T.beat('exact'), tooth: T.duration - 1.25 };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(plateCam(sm(t / b.D), 5, 0.016));
    const key = { key: ID, near: 'pen' as const };
    plateBack(f, key);
    f.layer('L4', (c, env) => {
      // the toggle's table, carried over from ch03-s04, slides up to the top margin
      const u = sm(seg(t, 0.15, 1.45));
      const p = { x: STRIP_FROM.x + (STRIP_TO.x - STRIP_FROM.x) * u, y: STRIP_FROM.y + (STRIP_TO.y - STRIP_FROM.y) * u, s: STRIP_FROM.s + (STRIP_TO.s - STRIP_FROM.s) * u };
      toggleTable(c, env, { x: p.x, y: p.y, scale: p.s, a: 1, groups: 0 });
      // its brackets come along (texture once small)
      c.save();
      c.translate(p.x, p.y);
      c.scale(p.s, p.s);
      c.translate(-STRIP.x, -STRIP.y);
      groupBrackets(c, env, 5, 1, false);
      c.restore();
      // the four rows
      rowRules(c, env, t, b);
      ROW_Y.forEach((y, i) => {
        const a0 = b.rows[i];
        const ink = seg(t, a0 - 0.15, a0 + 0.25);
        if (ink <= 0) return;
        drawObject(c, env, i, OBJ_X, y, ink, t, tq, b);
        engrave(c, env, FORMULAS[i], TXT_X, y + 7, clamp01((t - (a0 - 0.1)) / 0.8));
      });
      stamps(c, env, t, b);
      captions(c, env, t, b);
      ruler(c, env, t, b);
    });
    plateNear(f, key);
  },
});

// ---------------------------------------------------------------- painters
const ink = (env: PaintEnv, a = 1) => withAlpha(plateInk(env), a);

/** fine engraved rules between the rows (the plate's own drawing) */
function rowRules(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = seg(t, b.rows[0] - 0.4, b.rows[0] + 0.3);
  if (a <= 0) return;
  c.save();
  c.strokeStyle = ink(env, 0.16 * a);
  c.lineWidth = 0.8;
  c.beginPath();
  for (let i = 0; i < 5; i++) {
    const y = ROW_Y[0] - 38 + i * 76;
    c.moveTo(120, y);
    c.lineTo(1160, y);
  }
  c.stroke();
  c.restore();
}

/** a formula engraved into the parchment: small, plate lettering (texture), inked left to right */
function engrave(c: C2, env: PaintEnv, txt: string, x: number, y: number, u: number) {
  if (u <= 0) return;
  textRole(c, 'texture', () => {
    c.save();
    c.font = `italic 400 23px ${FONT.text}`;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    const n = Math.ceil(txt.length * clamp01(u));
    // a faint impression first (the burin's groove), then the ink
    c.fillStyle = withAlpha('#fffaf0', 0.5);
    c.fillText(txt.slice(0, n), x + 0.6, y + 0.8);
    c.fillStyle = ink(env, 0.86);
    c.fillText(txt.slice(0, n), x, y);
    c.restore();
  });
}

function drawObject(c: C2, env: PaintEnv, i: number, x: number, y: number, a: number, t: number, tq: number, b: Beats) {
  c.save();
  c.globalAlpha = a;
  c.translate(x, y);
  const s = 0.92 + 0.08 * a;
  c.scale(s, s);
  c.strokeStyle = ink(env, 0.9);
  c.fillStyle = ink(env, 0.9);
  c.lineCap = 'round';
  c.lineJoin = 'round';
  if (i === 0) loomRow(c, env);
  else if (i === 1) valve(c, env, t, b);
  else if (i === 2) detent(c, env, tq, b);
  else drawer(c, env);
  c.restore();
}

/** a single loom row: threads of different weights (thickness) converging on one knot */
function loomRow(c: C2, env: PaintEnv) {
  const ws = [1, 3.2, 1.8, 4.2, 2.4];
  ws.forEach((w, k) => {
    const y0 = -28 + k * 14;
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(-74, y0);
    c.bezierCurveTo(-30, y0, 10, y0 * 0.2, 46, 0);
    c.stroke();
    c.beginPath();
    c.arc(-76, y0, 3, 0, Math.PI * 2);
    c.fill();
  });
  c.beginPath();
  c.arc(50, 0, 8, 0, Math.PI * 2);
  c.fill();
  c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(58, 0);
  c.lineTo(74, 0);
  c.stroke();
  void env;
}

/** a paper valve: a channel, a sluice gate lifted to the opening max(0, gate), the flow passing under it */
function valve(c: C2, env: PaintEnv, t: number, b: Beats) {
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-76, -12);
  c.lineTo(76, -12);
  c.moveTo(-76, 14);
  c.lineTo(76, 14);
  c.stroke();
  // the flow: a wash of light ink passing through the opening (lower part of the channel)
  const open = 12;
  c.fillStyle = withAlpha(mixLab(plateInk(env), '#8a6a3a', 0.6), 0.28);
  c.fillRect(-76, 14 - open, 152, open);
  // flow marks drifting right
  c.strokeStyle = ink(env, 0.5);
  c.lineWidth = 1.2;
  c.beginPath();
  for (let k = 0; k < 6; k++) {
    const xx = -70 + (((t - b.rows[1]) * 30 + k * 26) % 140 + 140) % 140;
    c.moveTo(xx, 8);
    c.lineTo(xx + 9, 8);
  }
  c.stroke();
  // the gate, lifted: its foot leaves the opening
  c.fillStyle = ink(env, 0.9);
  c.fillRect(-7, -34, 14, 48 - open);
  c.fillRect(-14, -38, 28, 5);
  // a small ruler beside it: the opening drawn to scale
  c.strokeStyle = ink(env, 0.7);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(18, 14);
  c.lineTo(18, 14 - open);
  c.moveTo(14, 14);
  c.lineTo(22, 14);
  c.moveTo(14, 14 - open);
  c.lineTo(22, 14 - open);
  c.stroke();
}

/** a toothed detent wheel with a pawl; it turns one tooth in the hold */
function detent(c: C2, env: PaintEnv, tq: number, b: Beats) {
  const teeth = 12;
  const step = (Math.PI * 2) / teeth;
  const turn = step * sm(clamp01((tq - b.tooth) / 0.25));
  c.save();
  c.translate(-14, 0);
  c.rotate(turn);
  c.beginPath();
  for (let k = 0; k < teeth; k++) {
    const a0 = k * step;
    const r0 = 22, r1 = 31;
    c.lineTo(Math.cos(a0) * r0, Math.sin(a0) * r0);
    c.lineTo(Math.cos(a0 + step * 0.25) * r1, Math.sin(a0 + step * 0.25) * r1);
    c.lineTo(Math.cos(a0 + step * 0.5) * r1, Math.sin(a0 + step * 0.5) * r1);
    c.lineTo(Math.cos(a0 + step * 0.75) * r0, Math.sin(a0 + step * 0.75) * r0);
  }
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(mixLab('#f4e8cb', env.mood.core, 0.3), '#ffffff', 0.1);
  c.beginPath();
  c.arc(0, 0, 6, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // the pawl: an arm from a pivot at the upper right, its tip sitting between two teeth
  c.lineWidth = 3.2;
  c.beginPath();
  c.moveTo(58, -30);
  c.lineTo(10, -28);
  c.stroke();
  c.beginPath();
  c.arc(58, -30, 4.5, 0, Math.PI * 2);
  c.fill();
  c.lineWidth = 1.2;
  c.beginPath();
  // its spring
  for (let k = 0; k <= 6; k++) c.lineTo(58 + (k % 2 ? 5 : -5), -30 + k * 5);
  c.stroke();
}

/** a card drawer: a box with a handle, index cards standing in it, a pointer at one */
function drawer(c: C2, env: PaintEnv) {
  // cards standing up behind the front
  for (let k = 0; k < 6; k++) {
    const x = -50 + k * 15;
    const h = 22 + (k % 2) * 4;
    c.fillStyle = mixLab(mixLab('#f4e8cb', env.mood.core, 0.25), '#ffffff', 0.1);
    c.fillRect(x, -h, 12, h + 2);
    c.strokeStyle = ink(env, 0.6);
    c.lineWidth = 1;
    c.strokeRect(x, -h, 12, h + 2);
  }
  // the box front
  c.fillStyle = ink(env, 0.9);
  c.fillRect(-60, 0, 104, 30);
  c.fillStyle = mixLab(mixLab('#f4e8cb', env.mood.core, 0.3), '#ffffff', 0.1);
  c.fillRect(-22, 11, 28, 8);
  // the pointer: an arrow coming down onto the fourth card
  c.strokeStyle = ink(env, 0.9);
  c.fillStyle = ink(env, 0.9);
  c.lineWidth = 2;
  const px = -50 + 3 * 15 + 6;
  c.beginPath();
  c.moveTo(px + 34, -52);
  c.lineTo(px + 3, -32);
  c.stroke();
  c.beginPath();
  c.moveTo(px, -29);
  c.lineTo(px + 11, -33);
  c.lineTo(px + 5, -41);
  c.closePath();
  c.fill();
}

/** a faint circled 'f' stamped beside every row (every step rounds) */
function stamps(c: C2, env: PaintEnv, t: number, b: Beats) {
  ROW_Y.forEach((y, i) => {
    const at = b.round + 0.05 + i * 0.14;
    const a = seg(t, at, at + 0.08);
    if (a <= 0) return;
    const press = 1 + 0.25 * (1 - seg(t, at, at + 0.16));
    c.save();
    c.translate(1110, y);
    c.rotate(-0.12 + i * 0.05);
    c.scale(press, press);
    c.globalAlpha = 0.6 * a;
    c.strokeStyle = ink(env, 0.8);
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(0, 0, 17, 0, Math.PI * 2);
    c.stroke();
    ghostOk(c, () =>
      textRole(c, 'texture', () => {
        c.font = `italic 600 24px ${FONT.text}`;
        c.fillStyle = ink(env, 0.85);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('f', 0, 1);
      }),
    );
    c.restore();
  });
}

function captions(c: C2, env: PaintEnv, t: number, b: Beats) {
  const set = (txt: string, y: number, a: number, id: string, size0: number) => {
    if (a <= 0.01) return;
    textRole(c, 'subject', () => {
      const size = legibleSize(c, `italic 400 ${size0}px ${FONT.text}`, size0);
      c.save();
      c.font = `italic 400 ${size}px ${FONT.text}`;
      c.globalAlpha = a;
      c.fillStyle = plateInk(env);
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.fillText(txt, 640, y);
      const tw = c.measureText(txt).width;
      textProbe(c, id, 640 - tw / 2, y - size, tw, size * 1.25, a);
      c.restore();
    });
  };
  set('the whole instruction set: affine · reglu · boolean · index', 520, seg(t, b.read + 0.35, b.read + 0.75), `${ID}-set`, 28);
  set('f: round to FP32 · integers exact only to 2²⁴ = 16,777,216', 562, seg(t, b.round + 0.6, b.round + 1.0), `${ID}-fp32`, 25);
}

/** whole-number ticks running out along the foot; near the far end they skip, two apart */
function ruler(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = seg(t, b.exact - 0.1, b.exact + 1.5);
  if (u <= 0) return;
  const x0 = 250, x1 = 1030, y = 606;
  const skipFrom = 880;
  const step = 10;
  const xr = x0 + (x1 - x0) * u;
  c.save();
  c.strokeStyle = ink(env, 0.8);
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(x0, y);
  c.lineTo(xr, y);
  let k = 0;
  for (let x = x0; x <= xr; x += step, k++) {
    // past skipFrom only every other whole number can be held: the odd ticks are missing
    if (x > skipFrom && k % 2 === 1) continue;
    const h = k % 10 === 0 ? 11 : k % 5 === 0 ? 8 : 5;
    c.moveTo(x, y);
    c.lineTo(x, y - h);
  }
  c.stroke();
  // the missing ticks, ghosted as tiny gaps of dotted ink (the numbers that round away)
  if (xr > skipFrom) {
    c.fillStyle = ink(env, 0.35);
    k = 0;
    for (let x = x0; x <= xr; x += step, k++) {
      if (x > skipFrom && k % 2 === 1) {
        c.beginPath();
        c.arc(x, y - 3, 1, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
  c.restore();
}
