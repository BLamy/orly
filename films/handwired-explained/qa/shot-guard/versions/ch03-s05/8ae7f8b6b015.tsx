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

/** the strip's resting place at the end of ch03-s04 (its top-left on screen: s04 draws it 1.06x and pushes in ~5.6 %)
 *  and at the top margin here */
const STRIP_FROM = { x: 80, y: 302, s: 1.12 };
const STRIP_TO = { x: 380, y: 46, s: 0.52 };
/** the four rows: a centred block, objects ~1.3x larger than before (the objects teach; the formulas are texture) */
const ROW_Y = [196, 288, 380, 472];
const ROW_PITCH = 92;
const OBJ_X = 322;
const TXT_X = 446;
const ENGRAVE_PX = 25;
const OBJ_S = 1.32;
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
    const key = { key: ID, near: 'spool' as const };
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
        engrave(c, env, FORMULAS[i], TXT_X, y + 8, clamp01((t - (a0 - 0.1)) / 0.8));
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
    const y = ROW_Y[0] - ROW_PITCH / 2 + i * ROW_PITCH;
    c.moveTo(216, y);
    c.lineTo(1084, y);
  }
  c.stroke();
  c.restore();
}

/** a formula engraved into the parchment: small, plate lettering (texture), inked left to right */
function engrave(c: C2, env: PaintEnv, txt: string, x: number, y: number, u: number) {
  if (u <= 0) return;
  textRole(c, 'texture', () => {
    c.save();
    c.font = `italic 400 ${ENGRAVE_PX}px ${FONT.text}`;
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
  const s = OBJ_S * (0.94 + 0.06 * a);
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

/**
 * 'Every step rounds': on 'rounds' a small circled 'f' stamp presses just above each f( wrapper in the engraved formulas,
 * right where the rounding happens (row by row, left to right; nested wrappers step up so their stamps never overlap);
 * the index read, which has no wrapper, takes one 'f' stamp just after its formula.
 */
function stamps(c: C2, env: PaintEnv, t: number, b: Beats) {
  let n = 0;
  ROW_Y.forEach((y, i) => {
    const txt = FORMULAS[i];
    const at: number[] = [];
    for (let k = txt.indexOf('f('); k >= 0; k = txt.indexOf('f(', k + 1)) at.push(k);
    textRole(c, 'texture', () => {
      c.save();
      c.font = `italic 400 ${ENGRAVE_PX}px ${FONT.text}`;
      const fw = c.measureText('f').width;
      const marks: { x: number; y: number; solo: boolean }[] = at.length
        ? at.map((k) => ({ x: TXT_X + c.measureText(txt.slice(0, k)).width + fw / 2, y: y + 8 - ENGRAVE_PX * 1.25, solo: false }))
        : [{ x: TXT_X + c.measureText(txt).width + 26, y: y + 8 - ENGRAVE_PX * 0.32, solo: true }];
      // nested wrappers sit ~10 px apart: step each crowded stamp up and over so they read as separate stamps
      for (let j = 1; j < marks.length; j++)
        if (marks[j].x - marks[j - 1].x < 18) {
          marks[j].y = marks[j - 1].y - 9;
          marks[j].x = marks[j - 1].x + 13;
        }
      c.restore();
      for (const m of marks) {
        const t0 = b.round + 0.04 + n * 0.07;
        n++;
        const a = seg(t, t0, t0 + 0.08);
        if (a <= 0) continue;
        const press = 1 + 0.3 * (1 - seg(t, t0, t0 + 0.16));
        c.save();
        c.translate(m.x, m.y);
        c.rotate(-0.1 + ((n * 37) % 7) * 0.03);
        c.scale(press, press);
        c.globalAlpha = 0.62 * a;
        c.strokeStyle = ink(env, 0.8);
        c.lineWidth = 1.4;
        c.beginPath();
        c.arc(0, 0, m.solo ? 15 : 7.5, 0, Math.PI * 2);
        c.stroke();
        {
          const fsz = m.solo ? 22 : 12;
          ghostOk(c, () =>
            textRole(c, 'texture', () => {
              c.font = `italic 600 ${fsz}px ${FONT.text}`;
              c.fillStyle = ink(env, 0.85);
              c.textAlign = 'center';
              c.textBaseline = 'middle';
              c.fillText('f', 0, 1);
            }),
          );
        }
        c.restore();
      }
    });
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
  set('the whole instruction set: affine · reglu · boolean · index', 556, seg(t, b.read + 0.35, b.read + 0.75), `${ID}-set`, 28);
  set('f: round to FP32 · integers exact only to 2²⁴ = 16,777,216', 596, seg(t, b.round + 0.6, b.round + 1.0), `${ID}-fp32`, 25);
}

/**
 * Whole-number ticks running out along the foot of the plate. Near the far end the spacing opens up (a magnified run of
 * the same ruler) and the ticks skip, two apart: the missing odd ticks stand as faint dotted ghosts, and a pale bracket
 * spans the zone where only every other whole number can be held.
 */
function ruler(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = seg(t, b.exact - 0.1, b.exact + 1.5);
  if (u <= 0) return;
  const x0 = 250, x1 = 1030, y = 642;
  const dense = 9;
  const xOpen = 790;
  const wide = 22;
  // tick positions: dense up to xOpen, then wide, the odd ones in the wide run missing
  const ticks: { x: number; k: number; skip: boolean }[] = [];
  let x = x0, k = 0;
  while (x <= x1) {
    const open = x > xOpen;
    ticks.push({ x, k, skip: open && k % 2 === 1 });
    x += open ? wide : x + dense > xOpen ? wide : dense;
    k++;
  }
  const xr = x0 + (x1 - x0) * u;
  c.save();
  c.strokeStyle = ink(env, 0.95);
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(x0, y);
  c.lineTo(xr, y);
  for (const tk of ticks) {
    if (tk.x > xr || tk.skip) continue;
    const h = tk.k % 10 === 0 ? 16 : tk.k % 5 === 0 ? 12 : 8;
    c.moveTo(tk.x, y);
    c.lineTo(tk.x, y - h);
  }
  c.stroke();
  // the ghosts of the ticks that round away: faint dotted strokes where they would stand
  c.strokeStyle = ink(env, 0.5);
  c.lineWidth = 1.3;
  c.setLineDash([1.6, 2.4]);
  c.beginPath();
  for (const tk of ticks) {
    if (tk.x > xr || !tk.skip) continue;
    c.moveTo(tk.x, y - 1);
    c.lineTo(tk.x, y - 9);
  }
  c.stroke();
  c.setLineDash([]);
  // the pale bracket over the skip zone (exact only so far)
  const ba = seg(xr, xOpen + 20, xOpen + 90);
  if (ba > 0) {
    const bx0 = xOpen + 4, bx1 = Math.min(xr, x1) + 6, by = y - 24;
    c.fillStyle = withAlpha(mixLab('#fffaf0', env.mood.core, 0.3), 0.5 * ba);
    c.fillRect(bx0, by - 7, bx1 - bx0, 6);
    c.strokeStyle = ink(env, 0.45 * ba);
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(bx0, by + 6);
    c.lineTo(bx0, by);
    c.lineTo(bx1, by);
    c.lineTo(bx1, by + 6);
    c.stroke();
  }
  c.restore();
}
