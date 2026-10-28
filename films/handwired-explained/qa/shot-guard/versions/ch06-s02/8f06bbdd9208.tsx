/**
 * ch06-s02 — ONE TURN OF THE CLOCK (scene, the clock room, candleAmber; crossfade in; 24.04 s).
 *   L0603 "The looping lives outside, in the host: the plain JavaScript around it."
 *   L0604 "Flick the toggle, and the event is queued with its time."
 *   L0605 "Inputs in. The loom runs once. Next state copied back. The page moves."
 *   L0606 "When nothing moves, the clock rests: between frames, never inside one."
 *
 * Medium shot. At the left, the HOST CLOCKWORK in its case, against the clock room's round window (the same room and
 * wheel as ch06-s01). Beside it the template's TOGGLE on a small parchment card. To the right, THE SOURCE TABLE of
 * ch03-s04 on a parchment board: the toggle's 20 numbered pigeonholes (1280 and 800 in 0 and 1, the event flags, the
 * four-card spring rack, the state cards: sets/ch03-s02-plate's TOGGLE_CELLS). Behind, small and in haze at L3, THE
 * LOOM (sets/matmulLoom, the real circuit), joined to the clockwork only by a crank rod.
 *
 * TEACHES, word by word:
 *   host (2.92)     the clockwork's case lights (brass edges warm, a lamp glows behind its wheel): the host sits
 *                   OUTSIDE the loom, joined to it only by the crank rod
 *   toggle (6.58)   a paper cursor presses the toggle; the thumb does NOT move (the handler hasn't run the program);
 *                   'toggle · track 52 × 32 px' inks on its card
 *   queued (8.03)   the clockwork's little press stamps a paper token (the event, and a clock-hand for its time) and
 *                   drops it in the tray; a paper flag pops up on the case (frame requested; the voice says it)
 *   Inputs (9.84)   TICK: the token's cards (the press flag, now 1, and its x and y) slide into pigeonholes 2-4 and four
 *                   matrix cards from the case's rack into the spring rack (11-14); the step rail inks under the scene
 *                   and lights 'write inputs'
 *   loom (12.01)    TICK: the crank turns ONE revolution, the rod turns, and one wave of light crosses the loom, once
 *   copied (15.07)  TICK: the next-state cards slide out of the loom's far end into their pigeonholes (9, 10, 17-19)
 *   page (16.97)    TICK: a thread runs from the loom's output to the toggle's thumb, and the thumb slides: the page
 *                   moves from the outputs alone
 *   rests (19.75)   the escapement's latch drops; the flag falls; the case dims; the clock is still (hold)
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { FONT, cardPaperAlpha, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { matmulLoom } from '../sets/matmulLoom';
import { STRIP, TOGGLE_CELLS, cellX, paperToggle, pigeonStrip, toggleCard } from '../sets/ch03-s02-plate';
import {
  brassOf,
  cardPaper,
  clamp01,
  clockNear,
  clockRoom,
  clockworkX,
  ease5,
  escapementAt,
  inkCol,
  lerp,
  lin,
  lw,
  paperSlip,
  plateSheet,
  seg,
  shadowCol,
  sm,
  twos,
} from '../sets/ch06-s01-clockroom';
import { copperOf } from '../sets/narratorHands';

type C2 = CanvasRenderingContext2D;
const ID = 'ch06-s02';

// ------------------------------------------------------------------ layout (L4 rest px unless noted)
const CLK = { x: 292, y: 330, r: 148 };
/** the press on the case's right post: plunger over an anvil, the tray under it */
const PRESS = { x: 548, y: 446, anvil: 486, tray: 552 };
/** the toggle's card and the toggle on it */
const TCARD = { x: 600, y: 430, w: 286, h: 132 };
const TOG = { x: 743, y: 472 };
/** the source table's board and the strip on it (the ch03 strip scaled into it) */
const BOARD = { x: 646, y: 278, w: 588, h: 136 };
const SS = 0.54;
const STRIP_AT = { x: 664, y: 300 };
/** the loom, small, in haze (L3 rest px) */
const LOOM = { x: 700, y: 58, w: 500, h: 176 };
const LOOM_OUT = { x: 1198, y: 238 };
/** the matrix-card rack on the case's bridge */
const RACK = { x: 214, y: 156 };
/** the flag on the case's top */
const FLAG = { x: 436, y: 96 };
/** the step rail */
const RAIL = { y: 592 };
const PHRASES = ['write inputs', 'evaluate once', 'copy next state back', 'write the page'];

interface Beats {
  D: number;
  host: number;
  toggle: number;
  queue: number;
  ticks: [number, number, number, number];
  rests: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      host: T.beat('host'),
      toggle: T.beat('toggle'),
      queue: T.beat('queue'),
      ticks: [T.beat('inputs'), T.beat('loom'), T.beat('copied'), T.beat('page')],
      rests: T.beat('rests'),
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(cam(t, b));
    clockRoom(f, { key: ID, oculus: { x: 300, y: 300, r: 300 }, lightGap: 130, sunX: 330, sunY: 300 });
    const lit = litAt(t, b);
    // L3 (drawn as a second L3 pass, above the room's bench): the loom in haze, the crank rod to the clockwork
    f.layer('L3', (c, env) => {
      crankRod(c, env, t, b);
      const w = b.ticks[1];
      const wave = t >= w - 0.05 ? clamp01((t - (w + 0.05)) / 1.5) : undefined;
      matmulLoom(f, c, env, { ...LOOM, key: ID, wave, threads: 0.9 });
      if (wave !== undefined) loomWave(c, env, wave, 1 - seg(t, w + 1.7, w + 2.6));
    });
    // the lamp behind the wheel (the case lights on 'host'), before the action plane so it never washes the clockwork
    f.practical({ x: CLK.x + 10, y: CLK.y - 10, kind: 'lamp', seed: 23, intensity: 0.08 + 0.92 * lit, radius: 160, layer: 'L3' });
    f.layer('L4', (c, env) => {
      boards(f, c, env);
      table(c, env, t, tq, b);
      toggleCardArt(c, env, t, tq, b);
      clockworkX(c, env, { ...CLK, esc: escAt(t, b), crank: crankAt(t, b), lit, lock: seg(t, b.rests - 0.05, b.rests + 0.25) });
      matrixRack(c, env, t, b);
      press(c, env, t, tq, b);
      flag(c, env, t, tq, b);
      flyingCards(c, env, t, tq, b);
      pageThread(c, env, t, b);
      cursor(c, env, t, tq, b);
      rail(c, env, t, b);
    });
    f.rim({ x: 0, y: -1 });
    // the escapement's brass pivot catches the light on each tick
    const tk = b.ticks.reduce((m, at) => Math.max(m, seg(t, at - 0.03, at + 0.05) * (1 - seg(t, at + 0.12, at + 0.6))), 0);
    if (tk > 0.01) {
      const e = escapementAt(CLK);
      f.practical({ x: e.x, y: e.y, kind: 'led', seed: 29, intensity: tk, radius: 40 });
    }
    clockNear(f, { key: ID, lip: 690, post: 1430 });
  },
});

// ------------------------------------------------------------------ clocks
/** a slow drift: settle in on the clockwork for 'host', ease right toward the table from the first tick, back to the
 *  clockwork for the rest (≤ 15 px/s) */
function cam(t: number, b: Beats): Camera3 {
  const u1 = ease5((t - 0.4) / (b.host + 2.2));
  const u2 = ease5((t - (b.ticks[0] - 1.2)) / 5.5);
  const u3 = ease5((t - (b.rests - 1.0)) / 4.5);
  const x = 628 - 10 * u1 + 70 * u2 - 40 * u3;
  const z = -30 + 30 * u1 + 70 * u2 - 20 * u3;
  return { x, y: 352 + 4 * u1 - 8 * u2, z, lens: 1 };
}
/** the case lights on 'host', stays lit through the turn, dims a little when the clock rests */
const litAt = (t: number, b: Beats) => seg(t, b.host - 0.1, b.host + 0.6) * (1 - 0.5 * seg(t, b.rests + 0.1, b.rests + 1.0));
/** one escapement tick per phrase of L0605 */
const escAt = (t: number, b: Beats) => b.ticks.reduce((n, at) => n + lin(t, at - 0.04, at + 0.32), 0);
/** one revolution of the crank, on 'loom' only */
const crankAt = (t: number, b: Beats) => 0.25 + ease5((t - (b.ticks[1] - 0.05)) / 1.25);

/** the evaluation, seen: one bright band of light crossing the loom's frames left to right, once (L3, additive) */
function loomWave(c: C2, env: PaintEnv, u: number, a: number) {
  if (a <= 0) return;
  const x = LOOM.x + u * LOOM.w;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(x - 90, 0, x + 14, 0);
  g.addColorStop(0, withAlpha(env.mood.halo, 0));
  g.addColorStop(0.8, withAlpha(env.mood.core, 0.42 * a));
  g.addColorStop(1, withAlpha(env.mood.core, 0));
  c.fillStyle = g;
  c.fillRect(x - 90, LOOM.y - 16, 104, LOOM.h + 32);
  // the frames already passed keep a soft warmth until the wave has gone
  const g2 = c.createLinearGradient(LOOM.x, 0, x, 0);
  g2.addColorStop(0, withAlpha(env.mood.halo, 0.05 * a));
  g2.addColorStop(1, withAlpha(env.mood.halo, 0.16 * a));
  c.fillStyle = g2;
  c.fillRect(LOOM.x, LOOM.y - 6, Math.max(0, x - 90 - LOOM.x), LOOM.h + 12);
  c.restore();
}

/** the crank rod from the clockwork's hub up to the loom's left end (L3): its collars roll as the crank turns */
function crankRod(c: C2, env: PaintEnv, t: number, b: Beats) {
  const p0 = { x: CLK.x + 30, y: CLK.y - 20 }, p1 = { x: LOOM.x - 6, y: LOOM.y + LOOM.h * 0.62 };
  const ink = env.fill('ink');
  c.save();
  c.strokeStyle = ink;
  c.lineWidth = 7;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(p0.x, p0.y);
  c.lineTo(p1.x, p1.y);
  c.stroke();
  // the knuckle at the loom
  c.fillStyle = ink;
  c.beginPath();
  c.arc(p1.x, p1.y, 11, 0, Math.PI * 2);
  c.fill();
  // collars: their brass bands slide along the rod while it turns (one revolution = one band spacing)
  const rev = crankAt(t, b) - 0.25;
  const n = 7;
  const dx = p1.x - p0.x, dy = p1.y - p0.y;
  const L = Math.hypot(dx, dy);
  const nx = -dy / L, ny = dx / L;
  const turning = seg(t, b.ticks[1] - 0.05, b.ticks[1] + 0.2) * (1 - seg(t, b.ticks[1] + 1.0, b.ticks[1] + 1.3));
  c.strokeStyle = withAlpha(brassOf(env, turning), 0.45 + 0.45 * turning);
  c.lineWidth = 2;
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5 + (rev % 1) * 0.999) / n;
    const x = p0.x + dx * u, y = p0.y + dy * u;
    c.moveTo(x - nx * 4.5, y - ny * 4.5);
    c.lineTo(x + nx * 4.5, y + ny * 4.5);
  }
  c.stroke();
  c.restore();
}

// ------------------------------------------------------------------ the parchment boards (cached)
function boards(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/boards/${env.mood.id}`, 700, 380, (cc) => {
    cc.translate(-BOARD.x + 30, -BOARD.y + 30);
    // the table's board on two brass feet, and the toggle's card on a little easel
    cc.fillStyle = PUPPET_INK;
    cc.fillRect(BOARD.x + 40, BOARD.y + BOARD.h, 10, 160);
    cc.fillRect(BOARD.x + BOARD.w - 50, BOARD.y + BOARD.h, 10, 160);
    cc.fillRect(TCARD.x + TCARD.w / 2 - 5, TCARD.y + TCARD.h - 4, 10, 80);
    cc.fillRect(TCARD.x + TCARD.w / 2 - 40, TCARD.y + TCARD.h + 66, 80, 8);
    plateSheet(cc, env, BOARD, { x: BOARD.x + 90, y: BOARD.y + 10 });
    plateSheet(cc, env, TCARD, { x: TCARD.x + 50, y: TCARD.y + 10 });
  })(c, BOARD.x - 30, BOARD.y - 30);
}
const PUPPET_INK = '#0b0d0b';

// ------------------------------------------------------------------ the source table
/** which cells are present at t (a card drops in on its landing; old cards lift out just before) */
interface CellPlan {
  /** the old card leaves at this time (undefined = it stays) */
  out?: number;
  /** a new card lands at this time */
  land?: number;
  /** the new card's flag value */
  flag?: number;
}
function plan(b: Beats): CellPlan[] {
  const p: CellPlan[] = TOGGLE_CELLS.map(() => ({}));
  const [inT, , cpT] = b.ticks;
  // the token's cards: the press flag (now 1) and its x and y; empty matrix holes fill from the rack
  [2, 3, 4].forEach((i, k) => (p[i] = { out: inT + 0.05, land: inT + 0.55 + k * 0.1, flag: 1 }));
  [11, 12, 13, 14].forEach((i, k) => (p[i] = { land: inT + 0.75 + k * 0.12 }));
  // the next state: on, armed, displacement, velocity, destination come back out of the loom
  [9, 10, 17, 18, 19].forEach((i, k) => (p[i] = { out: cpT - 0.1 + k * 0.08, land: cpT + 0.45 + k * 0.12 }));
  return p;
}
const MATRIX_EMPTY = new Set([11, 12, 13, 14]);

function table(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const P = plan(b);
  c.save();
  c.translate(STRIP_AT.x, STRIP_AT.y);
  c.scale(SS, SS);
  c.translate(-STRIP.x, -STRIP.y);
  pigeonStrip(c, env, {});
  for (let i = 0; i < STRIP.n; i++) {
    const p = P[i];
    // the card standing before this frame's input
    const startsEmpty = MATRIX_EMPTY.has(i);
    if (!startsEmpty) {
      const oa = p.out !== undefined ? 1 - seg(tq, p.out, p.out + 0.18) : 1;
      if (oa > 0.01 && !(p.land !== undefined && tq >= p.land)) toggleCard(c, env, i, { a: oa, lift: (1 - oa) * 26, flag: 0, subject: false });
    }
    if (p.land !== undefined && tq >= p.land - 0.12) {
      const a = seg(tq, p.land - 0.12, p.land);
      const glow = seg(t, p.land, p.land + 0.1) * (1 - seg(t, p.land + 0.5, p.land + 1.4));
      toggleCard(c, env, i, { a, flag: p.flag ?? 0, glow, subject: false });
    }
  }
  c.restore();
}
/** a cell's top-centre on the board (L4 px) */
const cellPt = (i: number) => ({ x: STRIP_AT.x + (cellX(i) - STRIP.x) * SS, y: STRIP_AT.y + 8 });

// ------------------------------------------------------------------ the toggle, its card, the cursor
function toggleCardArt(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const thumb = ease5((tq - (b.ticks[3] + 0.35)) / 0.5);
  // the press: a faint flash of the track under the cursor (nothing else moves)
  const pressed = seg(tq, b.toggle - 0.02, b.toggle + 0.06) * (1 - seg(tq, b.toggle + 0.25, b.toggle + 0.5));
  c.save();
  c.translate(TOG.x, TOG.y);
  c.scale(0.86, 0.86);
  c.shadowColor = withAlpha(shadowCol, 0.35);
  c.shadowBlur = 6;
  c.shadowOffsetY = 4;
  paperToggle(c, env, 0, 0, thumb, 1);
  c.restore();
  if (pressed > 0) {
    c.save();
    c.strokeStyle = withAlpha(copperOf(env, 0.5), 0.8 * pressed);
    c.lineWidth = lw(c, 2.4);
    c.beginPath();
    c.roundRect(TOG.x - 58, TOG.y - 25, 116, 50, 25);
    c.stroke();
    c.restore();
  }
  // the label on the card: what the toggle is, and its size
  textRole(c, 'subject', () => {
    const a = seg(t, b.toggle + 0.05, b.toggle + 0.4);
    if (a <= 0) return;
    const size = legibleSize(c, `italic 500 22px ${FONT.text}`, 22);
    c.save();
    c.globalAlpha = a;
    c.font = `italic 500 ${size}px ${FONT.text}`;
    c.fillStyle = inkCol(env);
    c.textAlign = 'center';
    const s = 'toggle · track 52 × 32 px';
    c.fillText(s, TCARD.x + TCARD.w / 2, TCARD.y + TCARD.h - 18);
    const w = c.measureText(s).width;
    textProbe(c, `${ID}-toggle`, TCARD.x + TCARD.w / 2 - w / 2, TCARD.y + TCARD.h - 18 - size, w, size * 1.25, a);
    c.restore();
  });
}

/** a black paper arrow cursor: in from the lower right, presses the toggle on 'toggle', and leaves (on twos) */
function cursor(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const t0 = b.toggle - 1.0, t1 = b.toggle - 0.1, t2 = b.toggle + 0.55, t3 = b.toggle + 1.3;
  if (tq < t0 || tq > t3) return;
  const tip = { x: TOG.x + 6, y: TOG.y + 2 };
  const from = { x: TOG.x + 210, y: TOG.y + 190 };
  const away = { x: TOG.x + 260, y: TOG.y + 230 };
  let p: { x: number; y: number };
  if (tq < t1) {
    const u = ease5((tq - t0) / (t1 - t0));
    p = { x: lerp(from.x, tip.x, u), y: lerp(from.y, tip.y, u) };
  } else if (tq < t2) {
    p = tip;
  } else {
    const u = ease5((tq - t2) / (t3 - t2));
    p = { x: lerp(tip.x, away.x, u), y: lerp(tip.y, away.y, u) };
  }
  const press = seg(tq, b.toggle - 0.08, b.toggle) * (1 - seg(tq, b.toggle + 0.16, b.toggle + 0.3));
  const k = 1.3 - 0.08 * press;
  c.save();
  c.translate(p.x, p.y + press * 3);
  c.scale(k, k);
  c.rotate(-0.08);
  c.fillStyle = withAlpha(shadowCol, 0.3);
  arrowPath(c, 3, 5);
  c.fill();
  c.fillStyle = PUPPET_INK;
  arrowPath(c, 0, 0);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.8);
  c.lineWidth = lw(c, 1.4);
  c.stroke();
  c.restore();
}
function arrowPath(c: C2, ox: number, oy: number) {
  c.beginPath();
  c.moveTo(ox, oy);
  c.lineTo(ox, oy + 30);
  c.lineTo(ox + 7.5, oy + 23);
  c.lineTo(ox + 13, oy + 35);
  c.lineTo(ox + 18, oy + 32.5);
  c.lineTo(ox + 12.5, oy + 21);
  c.lineTo(ox + 22, oy + 21);
  c.closePath();
}

// ------------------------------------------------------------------ the press, the token, the tray, the flag
function press(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const down = seg(tq, b.queue - 0.18, b.queue) * (1 - seg(tq, b.queue + 0.12, b.queue + 0.42));
  const ink = PUPPET_INK;
  c.save();
  c.fillStyle = ink;
  // the bracket off the case's right post, the plunger, the anvil and the tray
  c.fillRect(CLK.x + CLK.r * 1.22, PRESS.y - 58, PRESS.x - CLK.x - CLK.r * 1.22 + 24, 14);
  c.fillRect(PRESS.x - 4, PRESS.y - 58, 8, 22 + down * 20);
  c.fillRect(PRESS.x - 18, PRESS.y - 38 + down * 20, 36, 12);
  c.fillRect(CLK.x + CLK.r * 1.22, PRESS.anvil + 4, PRESS.x - CLK.x - CLK.r * 1.22 + 30, 10);
  c.fillRect(PRESS.x - 22, PRESS.anvil, 44, 8);
  // the tray: an open box with a brass lip
  c.beginPath();
  c.moveTo(PRESS.x - 36, PRESS.tray - 22);
  c.lineTo(PRESS.x - 30, PRESS.tray + 6);
  c.lineTo(PRESS.x + 30, PRESS.tray + 6);
  c.lineTo(PRESS.x + 36, PRESS.tray - 22);
  c.lineTo(PRESS.x + 31, PRESS.tray - 22);
  c.lineTo(PRESS.x + 26, PRESS.tray);
  c.lineTo(PRESS.x - 26, PRESS.tray);
  c.lineTo(PRESS.x - 31, PRESS.tray - 22);
  c.closePath();
  c.fill();
  c.fillRect(CLK.x + CLK.r * 1.22, PRESS.tray - 4, PRESS.x - 30 - CLK.x - CLK.r * 1.22, 8);
  const hot = seg(t, b.queue - 0.02, b.queue + 0.05) * (1 - seg(t, b.queue + 0.2, b.queue + 0.8));
  c.strokeStyle = withAlpha(brassOf(env, hot), 0.7 + 0.3 * hot);
  c.lineWidth = lw(c, 1.6);
  c.beginPath();
  c.moveTo(PRESS.x - 18, PRESS.y - 38 + down * 20);
  c.lineTo(PRESS.x + 18, PRESS.y - 38 + down * 20);
  c.moveTo(PRESS.x - 36, PRESS.tray - 22);
  c.lineTo(PRESS.x - 31, PRESS.tray - 22);
  c.moveTo(PRESS.x + 31, PRESS.tray - 22);
  c.lineTo(PRESS.x + 36, PRESS.tray - 22);
  c.stroke();
  c.restore();
  // the token: stamped on the anvil at 'queued', slides off into the tray, sits there until the first tick
  const stamped = tq >= b.queue - 0.01;
  if (!stamped) return;
  const slide = ease5((tq - (b.queue + 0.3)) / 0.35);
  const leave = b.ticks[0] + 0.05;
  if (tq >= leave) return;
  const x = PRESS.x + slide * 2;
  const y = lerp(PRESS.anvil - 17, PRESS.tray - 16, slide);
  token(c, env, x, y, slide * 0.5, 1);
}
/** a paper token: the event (a little pressed-toggle mark) and its time (a clock hand), stamped in ink */
function token(c: C2, env: PaintEnv, x: number, y: number, rot: number, a: number) {
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.rotate(rot * 0.3);
  c.fillStyle = withAlpha(shadowCol, 0.3);
  c.fillRect(-13, -15, 28, 34);
  c.fillStyle = cardPaper(env);
  c.fillRect(-15, -17, 28, 34);
  c.strokeStyle = withAlpha(inkCol(env), 0.6);
  c.lineWidth = lw(c, 1);
  c.strokeRect(-15, -17, 28, 34);
  const ink = inkCol(env);
  // the event: a tiny toggle, pressed
  c.fillStyle = ink;
  c.beginPath();
  c.roundRect(-10, -12, 18, 9, 4.5);
  c.fill();
  c.fillStyle = cardPaper(env);
  c.beginPath();
  c.arc(-5.5, -7.5, 3, 0, Math.PI * 2);
  c.fill();
  // its time: a small clock face with one hand
  c.strokeStyle = ink;
  c.lineWidth = lw(c, 1.3);
  c.beginPath();
  c.arc(-1, 7, 6.5, 0, Math.PI * 2);
  c.moveTo(-1, 7);
  c.lineTo(3, 3.5);
  c.stroke();
  c.restore();
}

/** a paper pennant on a brass stalk: up on 'queued' (a frame is requested), down when the clock rests */
function flag(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const up = seg(tq, b.queue + 0.05, b.queue + 0.3) * (1 - seg(tq, b.rests + 0.05, b.rests + 0.35));
  c.save();
  c.fillStyle = PUPPET_INK;
  c.fillRect(FLAG.x - 2, FLAG.y - 4, 4, 12);
  c.translate(FLAG.x, FLAG.y + 4);
  // the stalk swings up from lying flat along the bridge to upright
  c.rotate((-Math.PI / 2) * up);
  c.fillRect(-1.5, -2, 62, 3.5);
  c.fillStyle = mixLab(cardPaper(env), copperOf(env, 0.2), 0.25);
  c.beginPath();
  c.moveTo(60, 0);
  c.lineTo(36, 0);
  c.lineTo(42, -14);
  c.lineTo(36, -26);
  c.lineTo(60, -26);
  c.closePath();
  c.translate(0, 0);
  c.fill();
  c.restore();
}

/** the case's rack of matrix cards (the host's four numbers for this frame), on its bridge */
function matrixRack(c: C2, env: PaintEnv, t: number, b: Beats) {
  c.save();
  c.fillStyle = PUPPET_INK;
  c.fillRect(RACK.x - 36, RACK.y + 6, 92, 8);
  c.restore();
  const P = plan(b);
  [11, 12, 13, 14].forEach((i, k) => {
    const leave = (P[i].land ?? 0) - 0.55;
    if (t >= leave) return;
    miniCard(c, env, RACK.x - 24 + k * 22, RACK.y - 20, 1, 'matrix');
  });
}
function miniCard(c: C2, env: PaintEnv, x: number, y: number, a: number, kind: 'matrix' | 'blank' | 'flag' | 'coord', glow = 0) {
  const w = 16, h = 26;
  c.save();
  c.globalAlpha *= a;
  c.fillStyle = withAlpha(shadowCol, 0.3);
  c.fillRect(x - w / 2 + 2, y + 2, w, h);
  c.fillStyle = cardPaper(env);
  c.fillRect(x - w / 2, y, w, h);
  c.strokeStyle = glow > 0 ? withAlpha(copperOf(env, 0.6), 0.5 + 0.5 * glow) : withAlpha(inkCol(env), 0.5);
  c.lineWidth = lw(c, glow > 0 ? 1.8 : 0.8);
  c.strokeRect(x - w / 2, y, w, h);
  c.fillStyle = withAlpha(inkCol(env), 0.7);
  if (kind === 'matrix') {
    for (const [dx, dy] of [
      [-3, -5],
      [3, -5],
      [-3, 5],
      [3, 5],
    ]) {
      c.beginPath();
      c.arc(x + dx, y + h / 2 + dy, 1.5, 0, Math.PI * 2);
      c.fill();
    }
  } else c.fillRect(x - 4, y + h / 2 - 0.8, 8, 1.6);
  c.restore();
}

/** the cards in flight: the token's three cards and the four matrix cards on 'Inputs'; the next-state cards on 'copied' */
function flyingCards(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const P = plan(b);
  const fly = (i: number, from: { x: number; y: number }, kind: 'matrix' | 'blank' | 'flag' | 'coord', dur: number, arc: number) => {
    const land = P[i].land!;
    const t0 = land - dur;
    if (tq < t0 || tq >= land - 0.1) return;
    const u = ease5((tq - t0) / (dur - 0.1));
    const to = cellPt(i);
    const x = lerp(from.x, to.x, u);
    const y = lerp(from.y, to.y - 30, u) - arc * Math.sin(Math.PI * u);
    miniCard(c, env, x, y, 1, kind, 0.4);
  };
  [2, 3, 4].forEach((i) => fly(i, { x: PRESS.x, y: PRESS.tray - 30 }, i === 2 ? 'flag' : 'coord', 0.55, 70));
  [11, 12, 13, 14].forEach((i, k) => fly(i, { x: RACK.x - 24 + k * 22, y: RACK.y - 20 }, 'matrix', 0.7, 60));
  [9, 10, 17, 18, 19].forEach((i) => fly(i, LOOM_OUT, 'blank', 0.55, 30));
}

/** on 'page': a thin copper thread from the loom's output down to the toggle's thumb */
function pageThread(c: C2, env: PaintEnv, t: number, b: Beats) {
  const at = b.ticks[3];
  const u = seg(t, at - 0.05, at + 0.45);
  if (u <= 0) return;
  const fade = 1 - 0.55 * seg(t, b.rests, b.rests + 1.2);
  const thumbX = TOG.x + (-38 + 76 * ease5((t - (at + 0.35)) / 0.5)) * 0.86;
  const p0 = LOOM_OUT, p1 = { x: thumbX, y: TOG.y - 18 };
  const cx = (p0.x + p1.x) / 2 + 40, cy = Math.min(p0.y, p1.y) - 60;
  c.save();
  c.shadowColor = withAlpha(env.mood.core, 0.7 * fade);
  c.shadowBlur = 6;
  c.strokeStyle = withAlpha(copperOf(env, 0.9), fade);
  c.lineWidth = lw(c, 3);
  c.setLineDash([2000]);
  c.lineDashOffset = 2000 * (1 - u);
  c.beginPath();
  c.moveTo(p0.x, p0.y);
  c.quadraticCurveTo(cx, cy, p1.x, p1.y);
  c.stroke();
  c.restore();
}

// ------------------------------------------------------------------ the step rail
/** a long paper strip under the scene: four phrases joined by arrows; each lights on its tick */
function rail(c: C2, env: PaintEnv, t: number, b: Beats) {
  const inkAt = b.ticks[0];
  const paperA = cardPaperAlpha(t, inkAt);
  if (paperA <= 0) return;
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `italic 500 25px ${FONT.text}`, 25);
    c.save();
    c.font = `italic 500 ${size}px ${FONT.text}`;
    const arrow = '   →   ';
    const wa = c.measureText(arrow).width;
    const ws = PHRASES.map((p) => c.measureText(p).width);
    const total = ws.reduce((s, w) => s + w, 0) + 3 * wa;
    const x0 = 640 - total / 2;
    const h = size * 1.6;
    const y0 = RAIL.y;
    // the strip (paper and its first phrase arrive together: card rule)
    c.globalAlpha = paperA;
    c.fillStyle = withAlpha(shadowCol, 0.35);
    c.fillRect(x0 - 26 + 3, y0 + 4, total + 52, h);
    c.fillStyle = cardPaper(env);
    c.fillRect(x0 - 26, y0, total + 52, h);
    c.strokeStyle = withAlpha(inkCol(env), 0.35);
    c.lineWidth = lw(c, 1);
    c.strokeRect(x0 - 26, y0, total + 52, h);
    const ink0 = clamp01((t - inkAt) / 0.12);
    cardProbe(c, `${ID}-rail`, x0 - 26, y0, total + 52, h, paperA, ink0);
    // brass pins at both ends
    c.fillStyle = brassOf(env, 0.3);
    for (const px of [x0 - 14, x0 + total + 14]) {
      c.beginPath();
      c.arc(px, y0 + h / 2, 4, 0, Math.PI * 2);
      c.fill();
    }
    let x = x0;
    const by = y0 + h / 2 + size * 0.34;
    c.textAlign = 'left';
    PHRASES.forEach((p, i) => {
      const at = b.ticks[i];
      const shown = i === 0 ? ink0 : seg(t, at - 0.05, at + 0.2);
      const next = i < 3 ? b.ticks[i + 1] : b.rests;
      const on = seg(t, at - 0.05, at + 0.15) * (1 - seg(t, next - 0.05, next + 0.3));
      // every phrase is printed from the first tick (faint); the current one is inked dark with a copper underline
      const a = Math.max(0.42 * ink0, shown * (0.55 + 0.45 * on));
      c.globalAlpha = paperA * a;
      c.fillStyle = on > 0.05 ? mixLab(inkCol(env), '#7a3410', 0.35 * on) : inkCol(env);
      c.fillText(p, x, by);
      textProbe(c, `${ID}-rail-${i}`, x, by - size, ws[i], size * 1.25, a);
      if (on > 0.01) {
        c.globalAlpha = paperA * on;
        c.strokeStyle = copperOf(env, 0.5);
        c.lineWidth = lw(c, 2);
        c.beginPath();
        c.moveTo(x, by + 5);
        c.lineTo(x + ws[i] * clamp01(on * 1.2), by + 5);
        c.stroke();
      }
      x += ws[i];
      if (i < 3) {
        c.globalAlpha = paperA * ink0 * 0.6;
        c.fillStyle = inkCol(env);
        c.fillText(arrow, x, by);
        x += wa;
      }
    });
    c.restore();
  });
}
void sm;
void paperSlip;
