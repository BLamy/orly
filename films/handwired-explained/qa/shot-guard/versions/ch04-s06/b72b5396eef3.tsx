/**
 * ch04-s06 — FOUR AND A HALF (scene; parchment → candleAmber tint crossfade; crossfade in from the NaN tray; 16.5 s).
 * L0409 "Now four and a half. The bit reads a half: half of ten, half of twelve."
 * L0410 "Eleven."                (1.6 s of near-silence)
 * L0411 "Every if here is a dimmer switch. The program's job: keep it fully on, or fully off."
 *
 * The prologue's eleven, explained as arithmetic, on the backlit workbench (sets/ch04-s06-bench) as the lamp warms
 * it from paper to amber over the first 3 s. L2 the tall window bay, L3 the long bench and its lamp, a low haze at
 * board height, L4 the machine: the two ramps on their numbered floor rule (sets/rampBench), plumb bars at the marble
 * that read each board's height (board one copper, board two pale), the LEVER that reads their difference (0..1, a
 * half tick), a link rod up to the shutter frame, the two BELTS running across the upper middle (10 tiles above, 12
 * tiles below) through their paper shutters (open = bit for the 10, 1 − bit for the 12), and the TRAY they throw into.
 * L5 the near bench edge; the formula card hangs on a clip wire from the L6 post at the right edge.
 *
 * TEACHES, word by word (every number is COMPUTED with Math.fround, rampBench's RB maths):
 *   start          the NaN sand of ch04-s05 drains out of the tray's foot as the light warms
 *   'four'         the narrator's hand sets the marble on the rule at 4.5 ('half' = released)
 *   → 'reads'      the lever swings up and stops exactly on its half tick; the copper plumb bar stands half a unit
 *                  tall; the shutters stand half open; the card inks 'a = 4.5:' and '0.5 × 10 + 0.5 × 12'
 *   'half of ten'  the 10 belt steps: a 10 slides under the half-drawn panel and comes out re-lettered 5 ('= 5' inks)
 *   'half of twelve' the 12 belt steps: a 12 comes out 6 ('+ 6'); each is thrown into the tray
 *   'Eleven'       the 5 and the 6 slide together and fuse with a heavy clack: 11 ('= 11'); a breath of stillness
 *   quarter        the hand lifts the marble to 4.25: the lever settles a quarter of the way, the 10 shutter a quarter
 *                  open, the 12 three quarters; a 2.5 and a 9 come through and fuse: 11.5 (card 2, term by term)
 *   'dimmer'       both shutters flip (a paper card turned edge-on) into dimmer knobs at a quarter and three
 *                  quarters, hold, and flip back
 *   'fully on … off' the card comes down; the hand sets the marble on the corner at 5; the lever slams to 1, the 10
 *                  shutter fully open, the 12 fully shut: a 10 and a flat 0 fuse into 10
 * Camera: a slow 4 % push and drift right over the whole shot (ends on CAM6_END, where ch04-s07's whip pan starts).
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, LayerSpec, PaintEnv } from '../../../film';
import { CAMERA3_HOME, cam3Interp, cardPaperAlpha, defineShot, mixLab, textSwapOut, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { RB, rampBench } from '../sets/rampBench';
import { copperOf } from '../sets/narratorHands';
import {
  CAM6_END,
  M6,
  beltBand,
  benchRoom,
  dimmerKnob,
  heroTile,
  leverGauge,
  marble,
  nearEdge,
  nearPost,
  postCard,
  settle,
  shutter,
  tray,
  xOfA,
  type RoomOpts,
} from '../sets/ch04-s06-bench';

const ID = 'ch04-s06';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
const f32 = Math.fround;

// ---------------------------------------------------------------- geometry (L4 rest px, sets/ch04-s06-bench M6)
const { BY, S, MARBLE_R, LX, LY, LR, BELT_X0, SX, END10, END12, Y10, Y12, TX, TY, TW, SLOT10, SLOT12, TILE_S } = M6;
const U = 110 * S;
const TILE_W = 34 * TILE_S;
const TILE_H = 26 * TILE_S;
const P = 150; // belt pitch
const STEP = 0.5; // a belt step (one pitch)
const CRAWL = 2; // px/s: the belts never stop
const D0 = 54; // a tile waits this far before the shutter before its step
const G = 2600; // px/s² for the throw into the tray
/** the card hangs between the belts' end and the post */
const CARD = { x: 884, y: 54, w: 296, h: 110 };
const CARD_LAYER: LayerSpec = { id: 'L5card', z: 760, haze: 0, blur: 0 };
const HAND_S = 1.6;
const LIFT = 1.3;
const PLACE = 1.4;

/** the three evaluations: the marble's a, and what each shutter passes (COMPUTED) */
const A1 = 4.5, A2 = 4.25, A3 = 5;
const bitOf = (a: number) => RB.above4(a);
const scaled = (v: number, open: number) => RB.fmt(f32(v * open));
const EVALS = [A1, A2, A3].map((a) => {
  const b = bitOf(a);
  const o10 = f32(b), o12 = f32(1 - b);
  return { a, o10, o12, t10: scaled(10, o10), t12: scaled(12, o12), sum: RB.fmt(RB.result(a)) };
});

interface Ev {
  /** belt step starts (10 belt, 12 belt) */
  step10: number;
  step12: number;
  /** fuse (the clack) and when the fused tile slides off the tray */
  fuse: number;
  off: number;
}
interface Beats {
  placeAt: number;
  placed: number;
  both: number;
  lift2: number;
  release2: number;
  lift3: number;
  release3: number;
  dimmer: number;
  cardOut: number;
  card2: number;
  ev: Ev[];
  /** per belt, per tile k: when it passes the shutter, reaches the belt's end, lands in the tray */
  cross: { b10: number[]; b12: number[] };
  endAt: { b10: number[]; b12: number[] };
  land: { b10: number[]; b12: number[] };
}

// ---------------------------------------------------------------- the belts (pure functions of t)
function stepU(t: number, s: number) {
  return sm((t - s) / STEP);
}
function phase(t: number, steps: number[]) {
  let p = CRAWL * Math.max(0, t);
  for (const s of steps) p += P * stepU(t, s);
  return p;
}
/** x of tile k on a belt whose first step is steps[0] (tile k crosses on step k) */
function tileX(t: number, steps: number[], k: number) {
  const x0 = SX - D0 - CRAWL * steps[0];
  return x0 + phase(t, steps) - k * P;
}
/** the time tile k first reaches x (bisection on the monotone belt) */
function timeAt(steps: number[], k: number, x: number, lo = 0, hi = 30) {
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (tileX(m, steps, k) < x) lo = m;
    else hi = m;
  }
  return hi;
}
const throwDur = (y: number) => Math.sqrt((2 * Math.max(10, TY - 4 - y)) / G);

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const placeAt = T.word('L0409', 'half') - 0.5 * PLACE;
    const quarter = T.beat('quarter');
    const full = T.beat('full');
    const release3 = full - 0.16;
    const ev: Ev[] = [
      { step10: T.word('L0409', 'ten') - 0.26, step12: T.word('L0409', 'twelve') - 0.26, fuse: T.beat('eleven'), off: quarter + 0.12 },
      { step10: quarter + 0.22, step12: quarter + 0.36, fuse: 0, off: release3 - 0.75 },
      { step10: full - 0.12, step12: full - 0.1, fuse: 0, off: Infinity },
    ];
    const steps10 = ev.map((e) => e.step10);
    const steps12 = ev.map((e) => e.step12);
    const cross = { b10: [0, 1, 2].map((k) => timeAt(steps10, k, SX)), b12: [0, 1, 2].map((k) => timeAt(steps12, k, SX)) };
    const endAt = { b10: [0, 1, 2].map((k) => timeAt(steps10, k, END10)), b12: [0, 1, 2].map((k) => timeAt(steps12, k, END12)) };
    const land = { b10: endAt.b10.map((e) => e + throwDur(Y10)), b12: endAt.b12.map((e) => e + throwDur(Y12)) };
    // evaluations 2 and 3 fuse as soon as both tiles are in the tray
    ev[1].fuse = Math.max(land.b10[1], land.b12[1]) + 0.2;
    ev[2].fuse = Math.max(land.b10[2], land.b12[2]) + 0.1;
    const b: Beats = {
      placeAt,
      placed: placeAt + 0.5 * PLACE,
      both: T.beat('both'),
      lift2: quarter - 0.62 * LIFT,
      release2: quarter,
      lift3: release3 - 0.62 * LIFT,
      release3,
      dimmer: T.beat('dimmer'),
      cardOut: T.word('L0411', 'keep') - 0.2,
      card2: quarter + 0.12,
      ev,
      cross,
      endAt,
      land,
    };
    const cam = tl.channel<Camera3>('cam', CAMERA3_HOME, cam3Interp);
    tl.tween(cam, { ...CAM6_END }, { at: 0, dur: D, ease: ease.move });
    tl.hold(0, D);
    return { tl, cam, b, D, T };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = q2(t);
    const b = scene.b;
    const cam = s.get(scene.cam);
    f.camera(cam);
    // the 3 s tint crossfade: the workbench warms from paper to lamplight (from the start of the dissolve)
    const moodU = sm((t + 0.4) / 3.2);
    f.setMood('candleAmber', { from: 'parchment', u: moodU });
    const room: RoomOpts = { key: ID, from: 'parchment', to: 'candleAmber', u: moodU, sunX: 560 };
    benchRoom(f, room);
    // the bench lamp (behind the action plane), warming with the tint
    f.practical({ x: 300, y: 488, kind: 'lamp', seed: 41, intensity: 0.25 + 0.75 * moodU, radius: 64, layer: 'L3' });
    // the low haze lying at board height
    f.fog({ yCenter: 540, height: 120, alpha: 0.12, drift: 8 });

    const lv = leverValue(tq, b);
    const st = marbleState(t, b);
    f.layer('L4', (c, env) => {
      rampBench(c, env, { x: M6.BX, y: BY, s: S, domain: M6.DOMAIN, boards: 2, lever: false, tray: false, numerals: true });
      if (st.onRule) plumbBars(c, env, st.a, t, b);
      if (st.onRule) marble(c, env, xOfA(st.a), BY - MARBLE_R, MARBLE_R, (xOfA(st.a) - xOfA(A1)) / MARBLE_R);
      linkRod(c, env);
      leverGauge(c, env, { x: LX, y: LY, r: LR, value: lv, stand: BY - LY, halfGlow: win(t, b.both - 0.3, b.both + 0.2) * (1 - win(t, b.release2 - 0.1, b.release2 + 0.4)) });
      belts(c, env, t, tq, b, lv);
      trayAndTiles(c, env, t, tq, b);
    });
    f.rim({ x: 0, y: -1 });
    nearEdge(f, ID, room);
    // the formula card on its clip wire from the post
    f.layer(CARD_LAYER, (c, env) => card(c, env, t, tq, b));
    nearPost(f, ID, room, 1226);
    // the narrator's hand over everything near (it reaches across the bench edge)
    const hp = handPose(t, tq, b, cam);
    if (hp) f.layer('L4', (c, env) => hands.draw(c, hp, env));
  },
});

// ---------------------------------------------------------------- the lever and the marble
/** the lever's reading on twos: settles to each new bit after the marble is set down (it holds while lifted) */
function leverValue(tq: number, b: Beats): number {
  const segs = [
    { t0: b.placed, v1: EVALS[0].o10, k: 4.2, w: 11 },
    { t0: b.release2, v1: EVALS[1].o10, k: 4.6, w: 12 },
    { t0: b.release3, v1: EVALS[2].o10, k: 10, w: 20 },
  ];
  let v = 0;
  let prev = { t0: -1, v0: 0, v1: 0, k: 1, w: 1 };
  for (const sg of segs) {
    if (tq < sg.t0) break;
    const v0 = prev.t0 < 0 ? 0 : settle(sg.t0, prev.t0, prev.v0, prev.v1, prev);
    prev = { t0: sg.t0, v0, v1: sg.v1, k: sg.k, w: sg.w };
    v = settle(tq, sg.t0, v0, sg.v1, sg);
  }
  // it can only rest between its stops
  return Math.max(-0.02, Math.min(1.0, v));
}

function marbleState(t: number, b: Beats): { onRule: boolean; a: number } {
  if (t < b.placed) return { onRule: false, a: A1 };
  const lifted2 = b.lift2 + 0.36 * LIFT;
  if (t < lifted2) return { onRule: true, a: A1 };
  if (t < b.release2) return { onRule: false, a: A1 };
  const lifted3 = b.lift3 + 0.36 * LIFT;
  if (t < lifted3) return { onRule: true, a: A2 };
  if (t < b.release3) return { onRule: false, a: A2 };
  return { onRule: true, a: A3 };
}

function handPose(t: number, tq: number, b: Beats, cam: Camera3) {
  const entry = hands.entry(cam, 'L4');
  const at = (a: number) => ({ x: xOfA(a), y: BY - MARBLE_R });
  if (t >= b.placeAt && t < b.placeAt + PLACE) {
    return hands.act('place', (tq - b.placeAt) / PLACE, at(A1), { held: 'marble', scale: HAND_S, entry });
  }
  if (t >= b.lift2 && t < b.lift2 + LIFT) {
    return hands.act('lift', (tq - b.lift2) / LIFT, at(A1), { held: 'marble', scale: HAND_S, entry, dropAt: at(A2) });
  }
  if (t >= b.lift3 && t < b.lift3 + LIFT) {
    return hands.act('lift', (tq - b.lift3) / LIFT, at(A2), { held: 'marble', scale: HAND_S, entry, dropAt: at(A3) });
  }
  return null;
}

/**
 * Two plumb bars at the marble: board one's height above its own base (copper) and board two's (pale). Their
 * difference is what the lever reads: half a unit at 4.5, a quarter at 4.25, a whole unit at 5.
 */
function plumbBars(c: C, env: PaintEnv, a: number, t: number, b: Beats) {
  const show = win(t, b.placed, b.placed + 0.4);
  if (show <= 0) return;
  const mx = xOfA(a);
  const cols = [copperOf(env, 0.75), mixLab(mixLab('#efe2c4', env.mood.halo, 0.3), env.mood.core, 0.2)];
  c.save();
  c.globalAlpha *= show;
  for (let k = 0; k < 2; k++) {
    const x = mx + (k === 0 ? -10 : 10);
    const base = BY - 6 * S - k * 34 * S - 4 * S;
    const top = base - RB.ramp(a, 4 + k) * U * win(t, b.placed + 0.05, b.placed + 0.55);
    c.strokeStyle = withAlpha(cols[k], 0.85);
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
      c.strokeStyle = cols[k];
      c.lineWidth = 5;
      c.beginPath();
      c.moveTo(x, base);
      c.lineTo(x, top);
      c.stroke();
    }
    c.strokeStyle = PUPPET_NEAR_BLACK;
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(x - 9, top);
    c.lineTo(x + 9, top);
    c.stroke();
    c.strokeStyle = cols[k];
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(x - 8, top);
    c.lineTo(x + 8, top);
    c.stroke();
  }
  c.restore();
}

/** the thin rod from the lever's hub up to the shutter frame: the bit sets both shutters */
function linkRod(c: C, env: PaintEnv) {
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 2.4;
  c.beginPath();
  c.moveTo(LX, LY);
  c.lineTo(SX + 6, Y12 + 18);
  c.lineTo(SX + 6, Y12 + 10);
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.4);
  c.lineWidth = 0.8;
  c.stroke();
  c.fillStyle = copperOf(env, 0.3);
  c.beginPath();
  c.arc(SX + 6, Y12 + 18, 3, 0, Math.PI * 2);
  c.fill();
}

// ---------------------------------------------------------------- belts, shutters, knobs
/** the dimmer flip: 0 = shutters, 1 = knobs (a paper card turned edge-on and back, on twos) */
function knobPhase(tq: number, b: Beats): { sh: number; kn: number } {
  const a = b.dimmer - 0.14;
  const e = b.dimmer + 1.45;
  if (tq < a || tq > e + 0.32) return { sh: 1, kn: 0 };
  if (tq < a + 0.16) return { sh: 1 - sm((tq - a) / 0.16), kn: 0 };
  if (tq < a + 0.32) return { sh: 0, kn: sm((tq - a - 0.16) / 0.16) };
  if (tq < e) return { sh: 0, kn: 1 };
  if (tq < e + 0.12) return { sh: 0, kn: 1 - sm((tq - e) / 0.12) };
  return { sh: sm((tq - e - 0.12) / 0.2), kn: 0 };
}

function belts(c: C, env: PaintEnv, t: number, tq: number, b: Beats, lv: number) {
  const o10 = clamp01(lv), o12 = 1 - o10;
  const rows = [
    { v: 10, y: Y10, end: END10, open: o10, steps: b.ev.map((e) => e.step10), lab: EVALS.map((e) => e.t10), key: 'b10' as const },
    { v: 12, y: Y12, end: END12, open: o12, steps: b.ev.map((e) => e.step12), lab: EVALS.map((e) => e.t12), key: 'b12' as const },
  ];
  const kp = knobPhase(tq, b);
  for (const r of rows) {
    const ph = phase(t, r.steps);
    beltBand(c, env, BELT_X0, r.end, r.y, ph / 8);
    // tiles riding the belt: k = 0, 1, 2 are the three that cross; k ≥ 3 queue behind (never cross in this shot)
    for (let k = 0; k < 6; k++) {
      const x = tileX(t, r.steps, k);
      if (x > r.end || x < BELT_X0 - TILE_W) continue;
      const fadeIn = clamp01((x - BELT_X0 + TILE_W * 0.6) / 50);
      if (fadeIn <= 0) continue;
      c.save();
      c.globalAlpha *= fadeIn;
      // before the shutter: the original tile; past it: re-lettered by what the shutter passed (computed)
      c.save();
      c.beginPath();
      c.rect(BELT_X0 - 80, r.y - 120, SX - (BELT_X0 - 80), 140);
      c.clip();
      heroTile(c, env, x, r.y, String(r.v), { s: TILE_S });
      c.restore();
      if (x + TILE_W / 2 > SX && k < 3) {
        c.save();
        c.beginPath();
        c.rect(SX, r.y - 120, 400, 140);
        c.clip();
        const lab = r.lab[k];
        heroTile(c, env, x, r.y, lab, { s: TILE_S, sliver: lab === '0' });
        c.restore();
      }
      c.restore();
    }
    // the shutter over the belt: open = what it passes (flips to a knob on 'dimmer')
    shutter(c, env, { x: SX, y: r.y, h: 48, open: r.open, sx: kp.sh });
    if (kp.kn > 0) dimmerKnob(c, env, { x: SX, y: r.y - 26, r: 22, open: r.open, sx: kp.kn });
  }
  // the shutter frame's spine (one frame, two panels) and its feed from the link rod
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(SX + 4, Y10 + 8, 5, Y12 - Y10 + 4);
}

// ---------------------------------------------------------------- the tray: throws, fuses, slides off
function trayAndTiles(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  tray(c, env, TX, TY, TW);
  // ch04-s05's grey NaN sand drains out of the tray's foot as the light warms
  const sand = 1 - win(t, 0.1, 1.5);
  if (sand > 0) {
    c.fillStyle = withAlpha(mixLab('#8d8a83', env.mood.haze, 0.3), 0.95);
    c.beginPath();
    c.moveTo(TX - TW / 2 + 6, TY - 5);
    c.quadraticCurveTo(TX, TY - 5 - 26 * sand, TX + TW / 2 - 6, TY - 5);
    c.closePath();
    c.fill();
    c.fillStyle = withAlpha('#8d8a83', 0.5 * sand);
    for (let i = 0; i < 14; i++) {
      const yy = TY + 14 + ((t * 260 + i * 23) % 200);
      c.fillRect(TX - 2 + Math.sin(i * 1.7) * 2, yy, 1.6, 4);
    }
  }
  for (let k = 0; k < 3; k++) {
    const e = b.ev[k];
    const E = EVALS[k];
    // each tile: along the belt (drawn by belts()) → thrown from the belt's end → in its slot → slides to the centre
    const parts = [
      { lab: E.t12, end: b.endAt.b12[k], land: b.land.b12[k], y0: Y12, x0: END12 + 10, slot: SLOT12 },
      { lab: E.t10, end: b.endAt.b10[k], land: b.land.b10[k], y0: Y10, x0: END10 + 10, slot: SLOT10 },
    ];
    if (t < e.fuse) {
      for (const p of parts) {
        if (t < p.end) continue;
        let x: number, y: number;
        if (t < p.land) {
          const u = (t - p.end) / (p.land - p.end);
          x = lerp(p.x0, p.slot, u);
          y = p.y0 + 0.5 * G * (t - p.end) * (t - p.end);
          y = Math.min(y, TY - 5);
        } else {
          // a small bounce on landing, then slide toward the centre just before the fuse
          const dt = tq - p.land;
          y = TY - 5 - (dt < 1 / 12 ? 4 : dt < 2 / 12 ? 1 : 0);
          x = lerp(p.slot, TX + (p.slot < TX ? -TILE_W * 0.5 : TILE_W * 0.5), win(t, e.fuse - 0.2, e.fuse));
        }
        heroTile(c, env, x, y, p.lab, { s: TILE_S, sliver: p.lab === '0' });
      }
    } else if (t < e.off + 0.6) {
      // the fused answer (computed: RB.result), a heavy clack on twos, catching the lamp
      const dt = tq - e.fuse;
      let x = TX;
      let y = TY - 5 - (dt < 1 / 12 ? 7 : dt < 2 / 12 ? 2 : 0);
      let a = 1;
      if (t >= e.off) {
        const u = clamp01((t - e.off) / 0.55);
        x = TX + u * (TW / 2 + 60);
        y += sm((u - 0.55) / 0.45) * 60;
        a = 1 - sm((u - 0.5) / 0.5);
      }
      const glow = win(t, e.fuse - 0.05, e.fuse + 0.25) * (1 - 0.55 * win(t, e.fuse + 0.6, e.fuse + 1.6));
      c.save();
      c.globalAlpha *= a;
      heroTile(c, env, x, y, E.sum, { s: TILE_S * 1.08, glow });
      c.restore();
    }
  }
}

// ---------------------------------------------------------------- the card (two equations, inked term by term)
function card(c: C, env: PaintEnv, t: number, tq: number, b: Beats) {
  const e1 = b.ev[0], e2 = b.ev[1];
  const inkAt = (at: number) => win(t, at, at + 0.3);
  const paper = cardPaperAlpha(t, b.both) * (1 - win(t, b.cardOut, b.cardOut + 0.45));
  if (paper <= 0.001) return;
  const out1 = textSwapOut(t, b.card2);
  const in2 = inkAt(b.card2);
  const swing = Math.sin(tq * 1.3) * 0.006;
  const lines1 = [
    { text: `a = ${RB.fmt(A1)}:`, ink: inkAt(b.both) * out1 },
    { text: `${RB.fmt(EVALS[0].o10)} × 10 + ${RB.fmt(EVALS[0].o12)} × 12`, ink: inkAt(b.both + 0.45) * out1 },
    {
      text: `= ${EVALS[0].t10} + ${EVALS[0].t12} = ${EVALS[0].sum}`,
      ink: out1,
      segs: [
        { text: `= ${EVALS[0].t10}`, ink: inkAt(b.cross.b10[0] + 0.1) },
        { text: ` + ${EVALS[0].t12}`, ink: inkAt(b.cross.b12[0] + 0.1) },
        { text: ` = ${EVALS[0].sum}`, ink: inkAt(e1.fuse - 0.05), hot: win(t, e1.fuse, e1.fuse + 0.3) * (1 - win(t, e1.fuse + 1.2, e1.fuse + 2)) },
      ],
    },
  ];
  const lines2 = [
    { text: `a = ${RB.fmt(A2)}:`, ink: in2 },
    {
      text: `${EVALS[1].t10} + ${EVALS[1].t12} = ${EVALS[1].sum}`,
      ink: in2 > 0 ? 1 : 0,
      segs: [
        { text: EVALS[1].t10, ink: inkAt(b.cross.b10[1] + 0.1) },
        { text: ` + ${EVALS[1].t12}`, ink: inkAt(b.cross.b12[1] + 0.1) },
        { text: ` = ${EVALS[1].sum}`, ink: inkAt(e2.fuse - 0.05), hot: win(t, e2.fuse, e2.fuse + 0.3) * (1 - win(t, e2.fuse + 1.2, e2.fuse + 2)) },
      ],
    },
  ];
  const common = { x: CARD.x, y: CARD.y, w: CARD.w, h: CARD.h, swing, clipTo: { x: 1200, y: 36 }, size: 22, lead: 30 };
  postCard(c, env, { id: `${ID}/card`, paper, lines: out1 > 0.001 ? lines1 : lines2, ...common });
  if (out1 > 0.001 && in2 > 0.001) postCard(c, env, { id: `${ID}/card2`, paper, lines: lines2, ...common, bare: true });
}
