/**
 * ch04-s08 — WHAT THE RUNTIME REALLY BUILDS (scene, parchment; crossfade in from the doubles study; 12.0 s).
 * L0414 "The real library won't compare until you promise a range."
 * L0415 "Promise more, that a is a whole number, and the comparison takes two operations."
 *
 * Back on the backlit workbench of ch04-s06 (sets/ch04-s06-bench room, in paper light): the README's machine (two
 * ramps on the numbered rule, the lever that reads their difference, the belts through their gate, the tray); the
 * input a is a single copper WIRE that runs in from the upper left and bends DOWN into the rule (sets/ch04-s08-grid);
 * the film's copper line crosses the top left with tag 6 hanging on it, where ch04-s14 left it.
 *
 * TEACHES, word by word (TE04, TE05; every reading COMPUTED in FP32 by sets/ch04-s08-grid GRID):
 *   'compare'   a monospace chip clips onto the lever, 'emitCompare: needs a declared range', and a small red stop
 *               jams under the needle: no range, no comparison (beat refuse)
 *   'range'     the narrator's hand ties a small range card (a bounded bracket, no numbers) onto the wire of a; the
 *               red stop lifts out, the needle trembles free (beat rangeTag); the chip comes off
 *   'Promise'   the hand reaches up to the copper line, unties tag 6 ('For an integer a') and carries it down
 *               (beat retie)
 *   'whole'     it is tied onto the wire of a, and its print re-letters itself in ink: 'grid 1' (beat reletter)
 *   'number'    the two ramps and the lever fold flat into the rule; the grid rig unfolds in their place: board A
 *               relu(5 − a) on the rule and the little board B relu(1 − ramp) beside it (two small boards in
 *               series); the card inks its two formulas; the brass counter rolls down and stops at 2 on 'two'
 *               (beat shrink)
 *   checks      the marble rolls down the tagged wire onto the rule and checks three whole numbers: at 5 board A
 *               reads 0 and B 1, the 10 belt passes a 10; at 4 they read 1 and 0, a 12; at 3, 2 and nought, a 12
 *               (beat checks). Tiles only, no new text.
 * Camera: a slow drift up and left to the tags for the retie, then back down and right to the rig for the checks.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { CAMERA3_HOME, cam3Interp, cardInkAlpha, cardPaperAlpha, defineShot, mixLab, textSwap, withAlpha } from '../../../film';
import { hands } from '../cast';
import type { ArmPose, HandsPose, Held, Pt } from '../sets/narratorHands';
import { LAMP, benchRoom, marble, nearEdge, nearPost, postCard, type RoomOpts } from '../sets/ch04-s06-bench';
import {
  BELT,
  G,
  GRID,
  beltThrow,
  chip,
  copperLine,
  flightPos,
  gridReadings,
  gridRig,
  heroTile,
  lineY,
  linkRod,
  marbleOnPath,
  opsCounter,
  pathOfA,
  rangeCard,
  readmeRig,
  selectBelts,
  tag6,
  tray,
  wireOfA,
  type RowSpec,
} from '../sets/ch04-s08-grid';

const ID = 'ch04-s08';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

const HAND_S = 1.25;
const LEN = 118 * HAND_S;
const TS = G.TAG_S;
/** the knots: the range card and tag 6 on the wire of a; tag 6 on the copper line */
const K_RANGE: Pt = { x: G.RANGE_X, y: G.WIRE.y };
const K_TAG_WIRE: Pt = { x: G.TAG6_WIRE_X, y: G.WIRE.y };
const K_TAG_LINE: Pt = { x: G.TAG6_LINE_X, y: lineY(G.TAG6_LINE_X) };
/** the three checks (whole numbers) */
const CHECKS = [5, 4, 3];

interface Beats {
  refuse: number;
  rangeTag: number;
  retie: number;
  reletter: number;
  shrink: number;
  two: number;
  /** hand segments */
  aStart: number;
  aEnd: number;
  bStart: number;
  bEnd: number;
  cStart: number;
  cEnd: number;
  cOut: number;
  /** the knot pulled tight on the wire (the tag leaves the hand and hangs there); the re-letter's swap point */
  tied: number;
  swapAt: number;
  /** the marble: enters the wire, settles at each check */
  mIn: number;
  arrive: number[];
  /** where the marble settles at each check (a breath before its readings rise) */
  settle: number[];
  /** each check's belt step (the open belt) */
  step: number[];
}

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const refuse = T.beat('refuse');
    const rangeTag = T.beat('rangeTag');
    const retie = T.beat('retie');
    const reletter = T.beat('reletter');
    const shrink = T.beat('shrink');
    const two = T.word('L0415', 'two');
    // hand A: tie the range card (knot pulled on 'range'); B: from u .3 to .61 of a lift (tag 6 off the line on
    // 'Promise'); C: tie tag 6 on the wire, the knot finished 0.25 s BEFORE 'whole' so the hand has swung clear
    // (down and left) and the re-lettering plays on a clear tag, 6.9 - 7.3 s
    const DA = 1.5;
    const aStart = rangeTag - 0.55 * DA;
    const aEnd = aStart + 0.6 * DA;
    const bDur = 1.3;
    const bStart = retie - (0.06 / 0.31) * bDur;
    const bEnd = bStart + bDur;
    const cDur = 0.65;
    const cEnd = reletter - 0.25;
    const cStart = cEnd - cDur;
    const tied = cStart + (0.25 / 0.3) * cDur;
    const cOut = cEnd + 0.6;
    const swapAt = reletter - 0.03;
    // the marble settles at 5 on 'two', then checks 5, 4 and 3 about a second apart; at each stop board B's flap
    // lifts so its bit reads before the belt steps (the last 12 lands ~0.4 s before the cut)
    const arrive = [two + 0.07, two + 1.07, two + 1.97];
    const settle = [two - 0.08, arrive[1] - 0.1, arrive[2] - 0.1];
    const mIn = settle[0] - 0.95;
    const step = arrive.map((a) => a + 0.45);
    const b: Beats = { refuse, rangeTag, retie, reletter, shrink, two, aStart, aEnd, bStart, bEnd, cStart, cEnd, cOut, tied, swapAt, mIn, arrive, settle, step };
    const cam = tl.channel<Camera3>('cam', { x: 636, y: 356, z: 0, lens: 1 }, cam3Interp);
    // up and left to the tags; the move back down and right to the rig starts 0.3 s before 'whole' so the formula
    // card is inside the frame when it inks on 'number'
    const back = reletter - 0.2;
    tl.tween(cam, { x: 560, y: 322, z: 66, lens: 1 }, { at: 0.4, dur: back - 0.5, ease: ease.move });
    tl.tween(cam, { x: 664, y: 372, z: 44, lens: 1 }, { at: back, dur: 2.9, ease: ease.move });
    tl.tween(cam, { x: 670, y: 376, z: 60, lens: 1 }, { at: back + 3.0, dur: D - back - 3.0, ease: ease.move });
    tl.hold(0, D);
    return { tl, cam, b, D };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    const cam = s.get(scene.cam);
    f.camera(cam);
    f.setMood('parchment');
    const room: RoomOpts = { key: ID, to: 'parchment', u: 1, sunX: 520 };
    benchRoom(f, room);
    f.practical({ x: LAMP.x, y: LAMP.y, kind: 'lamp', seed: LAMP.seed, intensity: 0.5, radius: LAMP.radius, layer: 'L3' });
    f.fog({ yCenter: 540, height: 120, alpha: 0.1, drift: 8 });

    const hp = handPose(t, tq, b, cam);
    const st = machineState(t, tq, b);
    f.layer('L4', (c, env) => {
      copperLine(c, env);
      wireOfA(c, env, { glow: st.wireGlow });
      // the tags on the wire / line (behind the hand)
      drawTags(c, env, t, tq, b, hp);
      // the README rig folding away; the grid rig unfolding
      readmeRig(c, env, { fold: st.fold, stop: st.stop, lever: st.lever });
      gridRig(c, env, { show: st.grid, a: st.a, read: st.read, carry: st.carry, kick: st.kick, flap: st.flap });
      if (st.grid > 0.5 && st.a !== undefined) {
        const R = gridReadings(st.a);
        linkRod(c, env, { x: R.bx, y: R.bTop });
      } else linkRod(c, env, { x: G.LX, y: G.LY });
      selectBelts(c, env, t, st.rows, st.open10, 1 - st.open10);
      trayTiles(c, env, t, tq, b);
      if (st.marble) marble(c, env, st.marble.x, st.marble.y, G.MARBLE_R, st.marble.x / G.MARBLE_R);
      // the chip on the comparison
      chip(c, env, {
        id: `${ID}/chip`,
        x: 712,
        y: 520,
        text: 'emitCompare: needs a declared range',
        paper: cardPaperAlpha(t, b.refuse) * (1 - win(t, b.rangeTag + 0.55, b.rangeTag + 0.95)),
        ink: cardInkAlpha(t, b.refuse),
        clipTo: { x: G.LX, y: G.LY },
      });
      formulaCard(c, env, t, tq, b);
      opsCounter(c, env, { value: 2, spin: win(t, b.shrink, b.two), alpha: win(t, b.shrink - 0.1, b.shrink + 0.25), id: `${ID}/ops` });
      if (hp) hands.draw(c, hp.pose, env, { heldDraw: (cc, at, held, e) => heldDraw(cc, e, at, held, t, b) });
    });
    f.rim({ x: 0, y: -1 });
    nearEdge(f, ID, room);
    nearPost(f, ID, room, 1186);
    // the lamp's falloff: the right third of the room sinks ~15 % (screen-locked, so the lamp side stays lit)
    const sc = f.c;
    sc.save();
    const fall = sc.createLinearGradient(700, 0, 1280, 0);
    fall.addColorStop(0, withAlpha(f.mood.ink, 0));
    fall.addColorStop(0.45, withAlpha(f.mood.ink, 0.1));
    fall.addColorStop(1, withAlpha(f.mood.ink, 0.2));
    sc.fillStyle = fall;
    sc.fillRect(700, 0, 580, 720);
    sc.restore();
  },
});

// ---------------------------------------------------------------- the machine's state at t
function machineState(t: number, tq: number, b: Beats) {
  // the lock: the red stop jams in on 'compare' and lifts out when the range is tied on
  const stop = win(t, b.refuse - 0.05, b.refuse + 0.2) * (1 - win(t, b.rangeTag + 0.05, b.rangeTag + 0.4));
  const free = tq - (b.rangeTag + 0.1);
  const lever = free > 0 ? 0.07 * Math.exp(-free * 4) * Math.sin(free * 22) : 0;
  const fold = win(tq, b.shrink - 0.12, b.shrink + 0.3);
  const grid = win(tq, b.shrink + 0.12, b.shrink + 0.55);
  // the marble: from the wire (beside the tags) round the bend, down, along the rule to 5; then to 4; then to 3
  let a: number | undefined;
  let marblePt: Pt | null = null;
  let read = 0;
  let carry = 0;
  let flap = 0;
  if (t >= b.mIn) {
    const p0 = 120;
    const p5 = pathOfA(CHECKS[0]);
    let p: number;
    if (t < b.settle[0]) {
      const u = clamp01((t - b.mIn) / (b.settle[0] - b.mIn));
      p = lerp(p0, p5, u * u * (1.6 - 0.6 * u));
    } else {
      // roll from check k to check k + 1 over the 0.45 s before it settles
      const ax = (k: number) => pathOfA(CHECKS[k]);
      p = p5;
      for (let k = 1; k < CHECKS.length; k++) {
        const u = win(t, b.settle[k] - 0.45, b.settle[k]);
        if (t >= b.settle[k] - 0.45) p = lerp(ax(k - 1), ax(k), u);
      }
    }
    marblePt = marbleOnPath(p);
    // the checked value: the one the marble is on (readings rise after it settles and drop while it rolls)
    let k = 0;
    for (let i = 0; i < CHECKS.length; i++) if (t >= b.arrive[i]) k = i;
    if (t >= b.arrive[0]) {
      a = CHECKS[k];
      const settled = b.arrive[k];
      const leaving = k + 1 < CHECKS.length ? b.settle[k + 1] - 0.45 : 1e6;
      read = win(t, settled, settled + 0.18) * (1 - win(t, leaving - 0.05, leaving + 0.1));
      carry = win(t, settled + 0.14, settled + 0.32) * (1 - win(t, leaving - 0.05, leaving + 0.1));
      // board B's flap lifts at its reading (on twos), holds through the belt step, then lies down
      flap = win(tq, settled + 0.3, settled + 0.42) * (1 - win(tq, Math.min(leaving - 0.15, settled + 0.85), Math.min(leaving - 0.02, settled + 0.98)));
    }
  }
  // the gate follows the bit (on twos): shut 10 / open 12 until the first check
  let open10 = 0;
  for (let k = 0; k < CHECKS.length; k++) {
    if (t >= b.arrive[k] + 0.4) {
      const prev = k === 0 ? 0 : GRID.bit(CHECKS[k - 1]);
      open10 = lerp(prev, GRID.bit(CHECKS[k]), win(tq, b.arrive[k] + 0.4, b.arrive[k] + 0.56));
    }
  }
  const rows: RowSpec[] = [
    { v: 10, y: G.Y10, steps: CHECKS.map((v, k) => (GRID.bit(v) >= 1 ? b.step[k] : NaN)).filter((x) => !Number.isNaN(x)), lab: ['10'], fr: [1] },
    { v: 12, y: G.Y12, steps: CHECKS.map((v, k) => (GRID.bit(v) < 1 ? b.step[k] : NaN)).filter((x) => !Number.isNaN(x)), lab: ['12', '12'], fr: [1, 1] },
  ];
  const kick = win(t, b.two - 0.05, b.two + 0.1) * (1 - win(t, b.two + 0.3, b.two + 0.9));
  const wireGlow = win(t, b.reletter - 0.1, b.reletter + 0.3) * (1 - win(t, b.reletter + 0.8, b.reletter + 1.8));
  return { stop, lever, fold, grid, a, read, carry, flap, marble: marblePt, open10, rows, kick, wireGlow };
}

// ---------------------------------------------------------------- the tray: each check's tile lands, the last stays
function trayTiles(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  tray(c, env, G.TX, G.TY, G.TW, 30, G.BY);
  const steps10 = [b.step[0]];
  const steps12 = [b.step[1], b.step[2]];
  const flights = [
    { v: '10', ...beltThrow(steps10, 0, G.Y10), y0: G.Y10, x0: G.SX + BELT.P - BELT.D0 },
    { v: '12', ...beltThrow(steps12, 0, G.Y12), y0: G.Y12, x0: G.SX + BELT.P - BELT.D0 },
    { v: '12', ...beltThrow(steps12, 1, G.Y12), y0: G.Y12, x0: G.SX + BELT.P - BELT.D0 },
  ];
  flights.forEach((fl, k) => {
    if (t < fl.off) return;
    const next = flights[k + 1];
    const p = flightPos(t, fl.off, fl.y0, fl.x0, G.TX);
    let x = p.x, y = p.y;
    let a = 1;
    if (t >= fl.land) {
      const dt = tq - fl.land;
      y = G.TY - 5 - (dt >= 0 && dt < 1 / 12 ? 5 : dt < 2 / 12 ? 1 : 0);
    }
    // slides off the tray's right lip as the next one falls
    if (next && t >= next.off - 0.1) {
      const u = clamp01((t - (next.off - 0.1)) / 0.4);
      x = G.TX + u * (G.TW / 2 + 50);
      y += sm((u - 0.5) / 0.5) * 50;
      a = 1 - sm((u - 0.55) / 0.45);
    }
    if (a <= 0) return;
    const glow = win(t, fl.land - 0.05, fl.land + 0.15) * (1 - win(t, fl.land + 0.3, fl.land + 0.9));
    c.save();
    c.globalAlpha *= a;
    heroTile(c, env, x, y, fl.v, { s: G.TILE_S, glow: 0.6 * glow });
    c.restore();
  });
}

// ---------------------------------------------------------------- the tags
function drawTags(c: C, env: PaintEnv, t: number, tq: number, b: Beats, hp: HP | null) {
  const sw = (ph: number, amp = 0.03) => amp * Math.sin(tq * 1.7 + ph);
  // the range card: held (drawn by the hand) until its knot is pulled, then on the wire
  if (t >= b.rangeTag) {
    const kick = Math.exp(-Math.max(0, tq - b.rangeTag) * 2.5);
    rangeCard(c, env, K_RANGE, { x: K_RANGE.x, y: K_RANGE.y + 16 }, { swing: sw(0.7, 0.03 + 0.08 * kick) });
  }
  // tag 6 is drawn ONCE per frame: on the copper line, in the hand (heldDraw), or on the wire
  const where = tagWhere(t, b, hp);
  if (where === 'line') {
    tag6(c, env, { knot: K_TAG_LINE, eye: { x: K_TAG_LINE.x, y: K_TAG_LINE.y + 24 * TS }, swing: sw(1.3, 0.025), id: `${ID}/tag6`, subject: true });
  } else if (where === 'wire') {
    const sx = textSwap(t, b.swapAt, 0.33);
    const kick = Math.exp(-Math.max(0, tq - b.tied) * 2.2);
    tag6(c, env, { knot: K_TAG_WIRE, eye: { x: K_TAG_WIRE.x, y: K_TAG_WIRE.y + 24 * TS }, swap: sx, swing: sw(2.1, 0.02 + 0.07 * kick), glow: 0.4 * sx.in * (1 - win(t, b.reletter + 1, b.reletter + 2)), id: `${ID}/tag6`, subject: true });
  }
}
/** where tag 6 is at t: on the line until the lift pinches it, held until the knot on the wire is pulled, then on the
 *  wire (the hand lets go at the same instant, so the tag is never drawn twice) */
function tagWhere(t: number, b: Beats, hp: HP | null): 'line' | 'held' | 'wire' {
  if (t >= b.tied) return 'wire';
  if (hp && hp.tagHeld) return 'held';
  return t < b.retie + 0.2 ? 'line' : 'held';
}

/** what the hand carries, drawn at its fingers */
function heldDraw(c: C, env: PaintEnv, at: Pt, held: Held, t: number, b: Beats) {
  if (held === 'card') rangeCard(c, env, null, { x: at.x, y: at.y - 6 });
  if (held === 'tag' && t < b.tied) tag6(c, env, { knot: at, eye: { x: at.x, y: at.y + 24 * TS }, id: `${ID}/tag6`, subject: true });
}

// ---------------------------------------------------------------- the narrator's hand (one continuous take)
interface HP {
  pose: HandsPose;
  tagHeld: boolean;
}
function mixArm(a: ArmPose, z: ArmPose, k: number): ArmPose {
  let da = z.angle - a.angle;
  while (da > Math.PI) da -= Math.PI * 2;
  while (da < -Math.PI) da += Math.PI * 2;
  const e = sm(k);
  return {
    ...(e < 0.5 ? a : z),
    wrist: { x: lerp(a.wrist.x, z.wrist.x, e), y: lerp(a.wrist.y, z.wrist.y, e) },
    angle: a.angle + da * e,
    bend: lerp(a.bend ?? 0, z.bend ?? 0, e),
  };
}
function handPose(t: number, tq: number, b: Beats, cam: Camera3): HP | null {
  if (t < b.aStart || t > b.cOut) return null;
  const entry = hands.entry(cam, 'L4');
  const o = { scale: HAND_S, entry };
  const A = (u: number) => hands.act('tie', u, K_RANGE, { ...o, held: 'card' });
  const B = (u: number) => hands.act('lift', u, K_TAG_LINE, { ...o, held: 'tag', dropAt: under(K_TAG_WIRE) });
  const Cc = (u: number) => hands.act('tie', u, K_TAG_WIRE, { ...o, held: 'tag' });
  const uOf = (t0: number, t1: number, u0: number, u1: number) => lerp(u0, u1, clamp01((tq - t0) / (t1 - t0)));
  if (tq < b.aEnd) return { pose: A(uOf(b.aStart, b.aEnd, 0, 0.6)), tagHeld: false };
  if (tq < b.bStart) {
    const pa = A(0.6), pb = B(0.3);
    return { pose: { ...pb, right: mixArm(pa.right!, pb.right!, (tq - b.aEnd) / (b.bStart - b.aEnd)), presence: 1 }, tagHeld: false };
  }
  if (tq < b.bEnd) {
    const p = B(uOf(b.bStart, b.bEnd, 0.3, 0.61));
    return { pose: p, tagHeld: !!p.lifted };
  }
  if (tq < b.cStart) {
    const p = B(0.61);
    // hold under the wire's knot with the tag, a breath before the tie
    return { pose: p, tagHeld: true };
  }
  if (tq < b.cOut) {
    const u = tq < b.cEnd ? uOf(b.cStart, b.cEnd, 0.3, 0.6) : uOf(b.cEnd, b.cOut, 0.6, 1);
    const p = Cc(u);
    // after the knot the hand swings clear, down and to the left of the tag, before the print re-letters
    const away = sm((tq - b.cEnd) / 0.2);
    if (away > 0 && p.right) p.right = { ...p.right, wrist: { x: p.right.wrist.x - 95 * away, y: p.right.wrist.y + 70 * away } };
    return { pose: p, tagHeld: tq < b.tied };
  }
  return null;
}
/** the tie action's approach point under a knot (where the lift carries the tag) */
function under(k: Pt): Pt {
  return { x: k.x - LEN * 0.05, y: k.y + LEN * 0.35 };
}

// ---------------------------------------------------------------- the formula card
function formulaCard(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  const ink0 = b.shrink - 0.05;
  const paper = cardPaperAlpha(t, ink0);
  if (paper <= 0.001) return;
  const inkAt = (at: number) => win(t, at, at + 0.3);
  const swing = Math.sin(tq * 1.3) * 0.006;
  const card = G.CARD;
  postCard(c, env, {
    id: `${ID}/card`,
    x: card.x,
    y: card.y,
    w: card.w,
    h: card.h,
    paper,
    swing,
    clipTo: { x: card.x + card.w / 2 + 30, y: -60 },
    size: 22,
    lead: 32,
    lines: [
      { text: 'ramp = relu(5 − a)', ink: cardInkAlpha(t, ink0) },
      { text: 'bit = relu(1 − ramp)', ink: inkAt(b.shrink + 0.5) },
    ],
  });
  void withAlpha;
  void mixLab;
  void CAMERA3_HOME;
}
