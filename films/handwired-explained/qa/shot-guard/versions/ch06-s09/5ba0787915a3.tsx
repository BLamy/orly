/**
 * ch06-s09 — A TABLE (scene, the clock room, labGreen; cut; 12.96 s).
 *   L0620 "A table. As arithmetic, you test all ten thousand rows, zero out all but one, and add: thirty thousand
 *          operations. Or one index read."
 *
 * The TABLE arm's machine: a TALL CARD CABINET of 10,000 thin drawers standing in the clock room and rising out of
 * frame into haze (the drawers we see are the bottom hundred or so; the rest climb into the fog). A slip pinned beside
 * it: one row of a 10,000-row table. LEFT, the arithmetic way: along the cabinet's left face a column of tiny paper
 * SHUTTERS (Deep Dive I's 0/1 shutters, one per drawer), one of them open; below, ONE FUNNEL. RIGHT, the INDEX-READ
 * DRAWER: a rotary selector arm on a detent wheel, its tip resting above the cabinet's right face, which stays dark.
 *
 * TEACHES, word by word (PR17, PR02):
 *   cabinet (0.30)   the cabinet rises into haze (a slow tilt down from its upper drawers); the slip inks
 *   test (2.73)      every drawer at once pushes its card out of the left face past its own shutter: one shutter
 *                    open, all the others shut, so the cards come out BLANK (multiplied by nought), all but one whole
 *                    card, lit, with its row on it ('zero out all but one' 4.72)
 *   arith (7.26)     'thirty': the cards pour down into the funnel together and are added; the operation counter
 *                    beside it spins up to 30,002 (its card: arithmetic: … operations)
 *   index (10.19)    the selector arm swings across, drops into its detent with one clean click and lifts a single
 *                    card from the one drawer, which alone lights on the dark right face; its counter reads 1 (index
 *                    read:). Hold on the two counters, 30,002 and 1.
 */
import { Timeline } from '../../../core';
import type { Frame, PaintEnv } from '../../../film';
import { FONT, cardInkAlpha, cardPaperAlpha, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { brassOf, cardPaper, clockNear, clockRoom, inkCol, lw, paperSlip, seg, shadowCol, twos } from '../sets/ch06-s01-clockroom';
import { camAt, camK, counterDrum, tubeFixture, type CamKey } from '../sets/ch06-s06-kit';

type C2 = CanvasRenderingContext2D;
const ID = 'ch06-s09';

/** the cabinet (L4 rest px): its face from x0 to x1, the foot at y1; drawers every PITCH px upward into the haze */
const CAB = { x0: 540, x1: 800, y1: 560, top: -520 };
const PITCH = 5.2;
const N_VIS = Math.floor((CAB.y1 - 26 - 30) / PITCH);
const drawerY = (i: number) => CAB.y1 - 26 - i * PITCH;
/** the one row (index) the table is asked for */
const ONE = 46;
const ONE_Y = drawerY(ONE);
const SHUT_X = CAB.x0 - 14;
const OUT_X = CAB.x0 - 64;
const FUNNEL = { x: 360, y: 452, w: 118, spout: 16, h: 64 };
const OPS = { arith: 30002, index: 1 };
const LEFT = { x: 300, y: 576 };
const RIGHT = { x: 1010, y: 576 };
const SEL = { x: 1004, y: 392, L: 0 };
SEL.L = Math.hypot(CAB.x1 + 8 - SEL.x, ONE_Y - SEL.y);
const SEL_A = Math.atan2(ONE_Y - SEL.y, CAB.x1 + 8 - SEL.x);
const SEL_REST = -Math.PI * 0.3;

interface Beats {
  D: number;
  cabinet: number;
  test: number;
  zero: number;
  add: number;
  arith: number;
  ops: number;
  or: number;
  index: number;
}

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      cabinet: T.beat('cabinet'),
      test: T.beat('test'),
      zero: T.word('L0620', 'zero'),
      add: T.word('L0620', 'add'),
      arith: T.beat('arith'),
      ops: T.wordEnd('L0620', 'operations'),
      or: T.word('L0620', 'Or'),
      index: T.beat('index'),
    };
    const keys: CamKey[] = [
      // looking up the cabinet into the haze, then tilting down to the machines
      { t: 0, cam: camK(660, 236, 1.04) },
      { t: b.test - 0.2, cam: camK(640, 352, 1.04) },
      // toward the funnel as the cards pour
      { t: b.ops, cam: camK(612, 360, 1.07) },
      // across to the index drawer
      { t: b.index + 0.6, cam: camK(668, 360, 1.06) },
      { t: b.D + 0.4, cam: camK(652, 362, 1.03) },
    ];
    return { tl, b, keys };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(camAt(sc.keys, t));
    clockRoom(f, { key: ID, oculus: { x: 660, y: 250, r: 340 }, lightGap: 160, sunX: 660, sunY: 260 });
    f.layer('L3', (c, env) => {
      tubeFixture(c, env, 330, 40, 220);
      tubeFixture(c, env, 1010, 40, 220);
    });
    f.practical({ x: 330, y: 44, kind: 'tube', seed: 81, intensity: 0.55, radius: 120, layer: 'L3' });
    f.practical({ x: 1010, y: 44, kind: 'tube', seed: 83, intensity: 0.4, radius: 120, layer: 'L3' });
    f.layer('L4', (c, env) => {
      funnel(f, c, env);
      cards(c, env, t, tq, b);
      cabinet(f, c, env);
      shutters(c, env, t, b);
      oneDrawer(c, env, t, b);
      selector(c, env, t, tq, b);
      counters(c, env, t, b);
      paperSlip(c, env, { lines: ['one row of a 10,000-row table'], x: 1010, y: 120, t, inkAt: Math.max(0.05, b.cabinet), id: `${ID}-slip`, pin: true, size: 21, tilt: -0.012 });
    });
    f.rim({ x: 0, y: -1 });
    clockNear(f, { key: ID, lip: 700, post: 1540, postL: -280 });
  },
});

// ------------------------------------------------------------------ the cabinet
function cabinet(f: Frame, c: C2, env: PaintEnv) {
  const { x0, x1, y1, top } = CAB;
  const w = x1 - x0 + 80, h = y1 - top + 60;
  f.cached(`${ID}/cabinet/${env.mood.id}`, w, h, (cc) => {
    cc.translate(-(x0 - 40), -top);
    // the body
    cc.fillStyle = PUPPET_NEAR_BLACK;
    cc.fillRect(x0 - 6, top, x1 - x0 + 12, y1 - top + 16);
    // a plinth
    cc.fillRect(x0 - 16, y1 - 4, x1 - x0 + 32, 20);
    // the drawer fronts: a fine cut-line per drawer, a knob every drawer at the centre
    for (let i = 0; ; i++) {
      const y = drawerY(i);
      if (y < top + 4) break;
      if (i % 2 === 0) {
        cc.fillStyle = withAlpha(env.mood.set, 0.22);
        cc.fillRect(x0, y - PITCH, x1 - x0, PITCH);
      }
      cc.strokeStyle = withAlpha(env.mood.rim, i % 10 === 0 ? 0.42 : 0.24);
      cc.lineWidth = 0.9;
      cc.beginPath();
      cc.moveTo(x0, y);
      cc.lineTo(x1, y);
      cc.stroke();
      cc.fillStyle = withAlpha(brassOf(env, 0.4), 0.7);
      cc.fillRect(x0 + (x1 - x0) * 0.3 - 3, y - PITCH / 2 - 0.7, 6, 1.4);
      cc.fillRect(x0 + (x1 - x0) * 0.7 - 3, y - PITCH / 2 - 0.7, 6, 1.4);
    }
    // brass edges on the two faces
    cc.strokeStyle = withAlpha(brassOf(env, 0.45), 0.8);
    cc.lineWidth = 1.6;
    cc.beginPath();
    cc.moveTo(x0 - 6, top);
    cc.lineTo(x0 - 6, y1 + 12);
    cc.moveTo(x1 + 6, top);
    cc.lineTo(x1 + 6, y1 + 12);
    cc.stroke();
    // rising into haze: the upper drawers dissolve into the fog
    const g = cc.createLinearGradient(0, -160, 0, 300);
    g.addColorStop(0, withAlpha(env.mood.haze, 0.97));
    g.addColorStop(0.5, withAlpha(env.mood.haze, 0.6));
    g.addColorStop(1, withAlpha(env.mood.haze, 0));
    cc.fillStyle = withAlpha(env.mood.haze, 0.97);
    cc.fillRect(x0 - 40, top, x1 - x0 + 80, -160 - top);
    cc.fillStyle = g;
    cc.fillRect(x0 - 40, -160, x1 - x0 + 80, 460);
  })(c, x0 - 40, top);
}

/** the column of tiny shutters on the left face: every one shut but the one row's (open, a lit slot) */
function shutters(c: C2, env: PaintEnv, t: number, b: Beats) {
  const lit = seg(t, b.test - 0.3, b.test + 0.2);
  c.save();
  for (let i = 0; i < N_VIS; i++) {
    const y = drawerY(i) - PITCH / 2;
    if (i === ONE) {
      c.fillStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.15), 0.6 + 0.4 * lit);
      c.fillRect(SHUT_X - 4, y - 1.6, 9, 3.2);
    } else {
      c.fillStyle = mixLab(cardPaper(env), env.mood.set, 0.55);
      c.fillRect(SHUT_X - 4, y - 1.8, 9, 3.6);
      c.fillStyle = PUPPET_NEAR_BLACK;
      c.fillRect(SHUT_X - 4, y - 0.4, 9, 0.8);
    }
  }
  // the shutter rail
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(SHUT_X + 5, drawerY(N_VIS) - 2, 3, CAB.y1 - drawerY(N_VIS) - 20);
  c.restore();
}

/** the cards: out past the shutters on 'test' (blank all but one), down into the funnel on 'thirty' */
function cards(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  if (tq < b.test - 0.05) return;
  const out = seg(tq, b.test, b.test + 0.55);
  const blank = mixLab(mixLab(cardPaper(env), env.mood.set, 0.65), PUPPET_NEAR_BLACK, 0.2);
  const whole = mixLab(cardPaper(env), env.mood.core, 0.25);
  const zero = seg(t, b.zero - 0.1, b.zero + 0.4);
  const mouth = { x: FUNNEL.x, y: FUNNEL.y };
  c.save();
  for (let i = 0; i < N_VIS; i++) {
    const y0 = drawerY(i) - PITCH / 2;
    // pour: each card leaves the face in turn (the lowest first), arcs down to the funnel mouth and drops in
    const d = i / N_VIS;
    const p = seg(tq, b.arith + d * 0.75, b.arith + 0.4 + d * 0.75);
    if (p >= 1) continue;
    const x = CAB.x0 - (CAB.x0 - OUT_X) * out;
    let cx = x, cy = y0;
    if (p > 0) {
      const q = p * p * (3 - 2 * p);
      cx = x + (mouth.x - x) * q;
      cy = y0 + (mouth.y - y0) * q - Math.sin(Math.PI * q) * 24;
    }
    const isOne = i === ONE;
    const w = 46, h = 3.4;
    // inside the shutter the card is paper; out past it, blank (nought) unless it is the one row
    const passed = cx < SHUT_X;
    c.fillStyle = isOne ? whole : passed ? blank : cardPaper(env);
    c.fillRect(cx - w, cy - h / 2, w, h);
    if (isOne && passed) {
      // the whole card: its row's ink, and a soft light
      c.fillStyle = withAlpha(inkCol(env), 0.8);
      c.fillRect(cx - w + 6, cy - 0.5, w * 0.55, 1);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const k = 0.5 + 0.5 * zero;
      const g = c.createRadialGradient(cx - w / 2, cy, 0, cx - w / 2, cy, 46);
      g.addColorStop(0, withAlpha(env.mood.core, 0.4 * k));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(cx - w / 2 - 46, cy - 46, 92, 92);
      c.restore();
    }
  }
  c.restore();
}

/** the funnel at the cabinet's foot (left): wide mouth, a spout down to the counter */
function funnel(f: Frame, c: C2, env: PaintEnv) {
  const { x, y, w, spout, h } = FUNNEL;
  f.cached(`${ID}/funnel/${env.mood.id}`, w + 40, h + 120, (cc) => {
    cc.translate(-(x - w / 2 - 20), -(y - 20));
    cc.fillStyle = PUPPET_NEAR_BLACK;
    cc.beginPath();
    cc.moveTo(x - w / 2, y);
    cc.lineTo(x + w / 2, y);
    cc.lineTo(x + spout / 2, y + h);
    cc.lineTo(x + spout / 2, y + h + 70);
    cc.lineTo(x - spout / 2, y + h + 70);
    cc.lineTo(x - spout / 2, y + h);
    cc.closePath();
    cc.fill();
    cc.strokeStyle = withAlpha(brassOf(env, 0.5), 0.9);
    cc.lineWidth = 2;
    cc.beginPath();
    cc.moveTo(x - w / 2, y);
    cc.lineTo(x + w / 2, y);
    cc.stroke();
  })(c, x - w / 2 - 20, y - 20);
}

/** the one drawer on the dark right face: lights when the selector drops into its detent */
function oneDrawer(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = seg(t, b.index - 0.05, b.index + 0.2);
  if (u <= 0.01) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = withAlpha(env.mood.core, 0.55 * u);
  c.fillRect(CAB.x1 - 70, ONE_Y - PITCH + 0.6, 70, PITCH - 1.2);
  const g = c.createRadialGradient(CAB.x1, ONE_Y - PITCH / 2, 0, CAB.x1, ONE_Y - PITCH / 2, 60);
  g.addColorStop(0, withAlpha(env.mood.halo, 0.35 * u));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(CAB.x1 - 60, ONE_Y - 60, 120, 120);
  c.restore();
}

/** the index-read drawer: a selector arm on a detent wheel; swings, drops into the detent, lifts one card */
function selector(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  const swing = seg(tq, b.or + 0.1, b.index - 0.08);
  const settle = tq > b.index - 0.08 ? 0.035 * Math.exp(-(tq - b.index + 0.08) * 9) * Math.cos((tq - b.index + 0.08) * 26) : 0;
  const lift = seg(tq, b.index + 0.2, b.index + 0.75);
  const a = SEL_REST + (SEL_A - SEL_REST) * swing + settle - 0.1 * lift;
  const L = SEL.L;
  const tip = { x: SEL.x + Math.cos(a) * L, y: SEL.y + Math.sin(a) * L };
  c.save();
  // the stand
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(SEL.x - 7, SEL.y, 14, 150);
  c.fillRect(SEL.x - 40, SEL.y + 146, 80, 10);
  // the detent wheel: a disc with notches, one per drawer row in this window
  c.beginPath();
  c.arc(SEL.x, SEL.y, 34, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(brassOf(env, 0.55), 0.9);
  c.lineWidth = lw(c, 1.6);
  for (let k = 0; k < 24; k++) {
    const an = (k / 24) * Math.PI * 2;
    c.beginPath();
    c.moveTo(SEL.x + Math.cos(an) * 28, SEL.y + Math.sin(an) * 28);
    c.lineTo(SEL.x + Math.cos(an) * 34, SEL.y + Math.sin(an) * 34);
    c.stroke();
  }
  // the pawl that drops into the detent
  const pawlA = -Math.PI / 2 + 0.25 * (1 - seg(tq, b.index - 0.1, b.index));
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = lw(c, 5);
  c.beginPath();
  c.moveTo(SEL.x + 52, SEL.y - 40);
  c.lineTo(SEL.x + Math.cos(pawlA) * 36, SEL.y + Math.sin(pawlA) * 36);
  c.stroke();
  // the arm
  c.lineCap = 'round';
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 8;
  c.beginPath();
  c.moveTo(SEL.x, SEL.y);
  c.lineTo(tip.x, tip.y);
  c.stroke();
  c.strokeStyle = withAlpha(brassOf(env, 0.4 + 0.5 * seg(t, b.index - 0.1, b.index + 0.2)), 0.9);
  c.lineWidth = lw(c, 2);
  c.beginPath();
  c.moveTo(SEL.x, SEL.y - 3.4);
  c.lineTo(tip.x, tip.y - 3.4);
  c.stroke();
  // the hub
  c.fillStyle = brassOf(env, 0.5);
  c.beginPath();
  c.arc(SEL.x, SEL.y, 8, 0, Math.PI * 2);
  c.fill();
  // the lifted card, hooked on the tip
  if (lift > 0) {
    const w = 52, h = 4.2;
    c.fillStyle = mixLab(cardPaper(env), env.mood.core, 0.3);
    c.fillRect(tip.x - 4, tip.y + 2, w, h);
    c.fillStyle = withAlpha(inkCol(env), 0.8);
    c.fillRect(tip.x + 4, tip.y + 3.6, w * 0.55, 1);
  }
  c.restore();
}

/** the two counters with their cards: arithmetic: [30,002] operations and index read: [1] */
function counters(c: C2, env: PaintEnv, t: number, b: Beats) {
  // left: spins up from 'thirty' as the cards pour in
  const lInk = b.arith - 0.05;
  const spin = seg(t, b.arith, b.ops + 0.1);
  const vL = OPS.arith * (1 - Math.pow(1 - spin, 2.2));
  group(c, env, t, lInk, LEFT, 'arithmetic:', 'operations', vL, 5, true, 'arith', spin >= 1 && t < b.ops + 1 ? Math.exp(-(t - b.ops - 0.1) * 3) : 0);
  // right: one detent click to 1 on 'index'
  const rInk = b.index + 0.05;
  const vR = OPS.index * seg(t, b.index + 0.05, b.index + 0.3);
  group(c, env, t, rInk, RIGHT, 'index read:', '', vR, 1, false, 'index', t > b.index + 0.3 ? Math.exp(-(t - b.index - 0.3) * 3) : 0);
}
function group(c: C2, env: PaintEnv, t: number, inkAt: number, at: { x: number; y: number }, pre: string, post: string, v: number, digits: number, commas: boolean, id: string, flash: number) {
  const paper = cardPaperAlpha(t, inkAt);
  if (paper <= 0.01) return;
  const ink = cardInkAlpha(t, inkAt);
  textRole(c, 'subject', () => {
    const s = legibleSize(c, `italic 500 22px ${FONT.text}`, 22, pre);
    c.save();
    c.font = `italic 500 ${s}px ${FONT.text}`;
    const wPre = c.measureText(pre).width;
    const wPost = post ? c.measureText(post).width : 0;
    const cell = 30;
    const drumW = digits * cell + (commas ? Math.floor((digits - 1) / 3) * cell * 0.28 : 0) + cell * 0.4 + 12;
    const gap = s * 0.5;
    const W = wPre + gap + drumW + (post ? gap + wPost : 0) + s * 1.2;
    const H = Math.max(s * 2.1, cell * 1.32 + 22);
    const x0 = at.x - W / 2, y0 = at.y - H / 2;
    c.globalAlpha = paper;
    c.fillStyle = withAlpha(shadowCol, 0.4);
    c.fillRect(x0 + 3, y0 + 4, W, H);
    c.fillStyle = cardPaper(env);
    c.fillRect(x0, y0, W, H);
    c.strokeStyle = withAlpha(inkCol(env), 0.3);
    c.lineWidth = lw(c, 1.1);
    c.strokeRect(x0, y0, W, H);
    cardProbe(c, `${ID}-${id}-card`, x0, y0, W, H, paper, ink);
    c.globalAlpha = paper * ink;
    c.fillStyle = inkCol(env);
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    let x = x0 + s * 0.6;
    c.fillText(pre, x, at.y + s * 0.04);
    textProbe(c, `${ID}-${id}-pre`, x, at.y - s / 2, wPre, s, paper * ink);
    x += wPre + gap;
    c.restore();
    counterDrum(c, env, { x: x + drumW / 2, y: at.y, value: v, digits, cell, commas, alpha: paper * ink, flash, id: `${ID}-${id}-drum`, blankLead: true });
    if (post) {
      c.save();
      c.font = `italic 500 ${s}px ${FONT.text}`;
      c.globalAlpha = paper * ink;
      c.fillStyle = inkCol(env);
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      const px = x + drumW + gap;
      c.fillText(post, px, at.y + s * 0.04);
      textProbe(c, `${ID}-${id}-post`, px, at.y - s / 2, wPost, s, paper * ink);
      c.restore();
    }
  });
}
