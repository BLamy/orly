/**
 * ch15-s09 — the last word (candleAmber; 25.33 s; in: cut from the verdict's dark lantern; out: fadeBlack to the end
 * cards). The film's last spoken lines.
 *
 * CAMERA: WALL (W7) → FILE (top-down on the desk under the lamp) → the dark → SHELF (its far end, by the window).
 *   0 → 'word' a push in on W7; on the anchor (1.2 s) Hinton's 2017 slip wobbles on its pin, lifts off by itself and
 *              floats down out of frame, toward the lamp
 *   cut        top-down on the desk: both cuffed hands come up (in by 4.4 s) and catch the falling slip by its two lower
 *              corners at 4.8 s
 *   'future'   (b2) held under the lamp, its typed words legible as they are read
 *   b3 - 0.6   wordless: the hands lay the slip on WHO TAUGHT IT? and withdraw; the stamp comes in from the right, over
 *              the card (clear of the ink pad): STATUS: OPEN in red ink, the film's one full red, read ~1.8 s
 *   b4         the desk lamp clicks off (on the twos); in the black only ch01-s01's chat-box cursor (a cool bar on a
 *              steady blink over a faint chat-box underline). The study comes up in moonlight; the candle stays
 *              invisible until the flare finds it
 *   'lamp'     across the city, one far window lights warm and stays on
 *   'new'      the cursor's blink slows
 *   'come'     a hand comes up from the bottom edge, right of the candle, with the matchbox
 *   'from' (b5) the strike; the flare finds the shelf's end: the last belief candles (ghost sleeves and stubs at the
 *              canonical lit height) and the new, unlettered candle with its blank year tag; the cursor goes out
 *   b6         the match, carried in from the side, lights the wick (on the twos); shaken out; the hand goes
 *   hold       the single new flame (its halo blooming as it settles), a haze band, a near curtain edge
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv, ShotScene } from '../../../film';
import { CAMERA3_HOME, FONT, LAYERS, MOODS, PUPPET_NEAR_BLACK, defineShot, dustMotes, hash1, mixLab, toLayer, toScreen, vnoise2, withAlpha, wrapLines } from '../../../film';
import { hands } from '../cast';
import { HAND_LEN, type ArmPose, type HandShapeN, type HandsPose } from '../sets/narratorHands';
import { STUDY, STUDY_WALL, candleX, studyCase, studyRoom } from '../sets/study';
import { SLOTS, shelfStateAt, wallStateAt, type CandleView } from '../sets/studyState';
import { WALL_SLOTS, drawSlip, slotLight } from '../sets/wallOfForecasts';
import { beliefCandle, candleFlame } from '../sets/beliefCandle';
import { drawCard, paperTone } from '../sets/caseBoard';
import { frameOn } from '../sets/ch09-s03a-kit';
import { clamp01, lerp, sm, tq12, win } from '../sets/ch13-s01-kit';
import { flame as flameShape } from '../../../film/silhouette/props/_kit';

const ID = 'ch15-s09';
type C = CanvasRenderingContext2D;
type Pt = { x: number; y: number };

// ------------------------------------------------------------------------------------------------ the Wall (A)
const W7 = WALL_SLOTS.W7;
const WK = STUDY.wall.k;
const W7C: Pt = { x: STUDY.wall.x + W7.x * WK, y: STUDY.wall.y + W7.y * WK };
const W7_SLIP = { slot: 'W7' as const, who: 'HINTON · SEPT 2017', text: 'The future depends on some graduate student who is deeply suspicious of everything I have said.' };
// round-1 notes: push in on W7 from the first frame, so the lifting slip is ~2x the wide's size when it moves
const CAM_A0 = frameOn({ x: W7C.x + 30, y: W7C.y + 20 }, { x: 640, y: 360 }, 1.9);
const CAM_AM = frameOn({ x: W7C.x + 4, y: W7C.y + 4 }, { x: 640, y: 340 }, 2.9);
/** round-1 revision: the falling slip is the subject of every frame to the cut. It falls FALL_Y with e = fall^2 and
 *  the camera tilts down TRACK_Y with the same e, so the slip stays in the middle third (just below centre) */
const FALL_Y = 300;
const TRACK_Y = 262;
const CAM_A1 = frameOn({ x: W7C.x - 30, y: W7C.y + 4 + TRACK_Y }, { x: 640, y: 340 }, 2.9);

// ------------------------------------------------------------------------------------------------ the desk (B, top-down)
const SLIP = { w: 620, h: 284 };
const HOLD: Pt = { x: 560, y: 236 };
const K_DESK = { x: 712, y: 506, k: 2.3, rot: 0.05 };
const LAID = { x: 540, y: 330, s: 0.6, rot: -0.07 };
const QUOTE = 'The future depends on some graduate student who is deeply suspicious of everything I have said.';
const ATTR = '— Geoffrey Hinton, 2017, as quoted by Gary Marcus';

// ------------------------------------------------------------------------------------------------ the shelf's end (D)
const SY = STUDY.shelf.y;
const V9 = shelfStateAt(ID, 'start');
const NEW_X = candleX(V9, 'new');
const NEW0: CandleView = { ...V9.find((v) => v.id === 'new')!, state: 'unlit' };
const NEW_LIT: CandleView = { ...NEW0, state: 'live', rings: 0 };
const WICK = candleFlame({ x: NEW_X, y: SY - 7, view: NEW_LIT, s: STUDY.shelf.s });
// round-2: the dark frames the shelf's end AND the study window, so 'a lamp is on' can show a lamp: the new candle at
// the left third, the window's panes filling the right half, and across the street one window lit
const CAM_D0 = frameOn({ x: NEW_X + 250, y: SY - 232 }, { x: 640, y: 360 }, 1.42);
const CAM_D1 = frameOn({ x: NEW_X + 140, y: SY - 206 }, { x: 640, y: 360 }, 1.6);

interface B {
  D: number;
  word: number;
  cut: number;
  catchAt: number;
  end18: number;
  lay: number;
  stamp: number;
  off: number;
  slow: number;
  /** 'a lamp is on': across the street, one window's desk lamp clicks on */
  farLamp: number;
  /** 'someone … suspicious': the figure at the rim of that lamp's pool leans in */
  lean: number;
  /** 'suspicious': the hand and the matchbox come up from the bottom edge */
  handIn: number;
  /** 'new': the scratch (foley fx-match-strike) */
  strike: number;
  /** the head ignites at the end of the scratch (the cursor goes out; the flare finds the shelf) */
  flare: number;
  /** 'candles': the match's flame touches the wick (foley fx-match-flare) */
  touch: number;
  /** 'candles': the wick catches; the flame has settled by 'come from' */
  light: number;
  dark: number;
  /** 'Somewhere': the moonlit room and the warm interior plane come up; both are full by 'lamp' */
  moon: number;
  moonDur: number;
  /** the warm interior plane at left (the shelf's live candles on the back wall), from 'Somewhere' */
  warm: number;
}
interface Scene extends ShotScene {
  b: B;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    tl.hold(0, D);
    const end18 = T.line('L1518').end;
    const b: B = {
      D,
      // the unpin starts on the anchor (a hair before 'word'), with a visible wobble on the pin
      word: T.beat('b1') - 0.17,
      cut: T.beat('b1') + 1.55,
      // both hands are in by 4.4 s and catch the slip mid-fall at 4.8 s
      catchAt: 4.8,
      end18,
      // round 2 (foley fx-stamp sounds ON b3): the slip is laid down under the line's last words, the stamp comes in
      // so that it lands on b3 (its act strikes at mid-gesture), and the red reads ~2.5 s before the click
      lay: T.beat('b3') - 1.35,
      stamp: T.beat('b3') - 0.65,
      off: T.beat('b4'),
      slow: T.word('L1520', 'new'),
      // round 2 (re-anchored to the re-recorded L1520 and to score/foley.json): a beat of black after the click, the
      // study comes up in moonlight on 'Somewhere'; across the street a desk lamp clicks on at 'lamp'; its sitter leans
      // in on 'suspicious', when the hand and the matchbox rise; the match is scratched on 'new', flares on 'candles',
      // lights the wick on 'come', and the flame stands by 'from'; then the hold on the new flame
      // round 3 (showrunner, third routing): every beat of the dark is a T.word on L1520 (L1517 is being re-taken
      // longer, so nothing here is a hard-coded second). The desk lamp across the street is at FULL by 'lamp'
      farLamp: T.word('L1520', 'lamp') - 0.3,
      lean: T.word('L1520', 'suspicious'),
      // the hand and the matchbox are coming in ON 'suspicious' (visible on the word, settled a second later)
      handIn: T.word('L1520', 'suspicious') - 0.6,
      // the scratch starts on 'new' (score/foley.json fx-match-strike), the head ignites at the end of the stroke,
      // the match is flicked to the wick and touches it on 'candles' (fx-match-flare); the wick catches on 'candles'
      // and the flame has settled by 'come from'
      strike: T.word('L1520', 'new'),
      flare: T.word('L1520', 'new') + 0.1,
      touch: T.word('L1520', 'candles') - 0.02,
      light: T.word('L1520', 'candles') - 1 / 24,
      dark: Math.min(T.beat('b4') + 0.3, T.word('L1520', 'Somewhere') - 0.4),
      // a beat of true dark with only the cursor after the click, then from 'Somewhere' the moonlit room and the warm
      // interior plane rise together, full by 'lamp'
      moon: T.word('L1520', 'Somewhere') - 0.4,
      moonDur: Math.max(0.6, T.word('L1520', 'lamp') - 0.12 - (T.word('L1520', 'Somewhere') - 0.4)),
      warm: T.word('L1520', 'Somewhere') - 0.4,
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    if (t < b.cut) return paintWall(f, t, b);
    if (t < b.dark) {
      paintDesk(f, t, b);
      cursor(f, t, b);
      return;
    }
    paintShelfEnd(f, t, b);
  },
});

// =====================================================================================================
// A · the Wall: the 2017 slip lifts off its pin and floats down toward the lamp
// =====================================================================================================
function paintWall(f: Frame, t: number, b: B) {
  // a push in on W7 from the first frame (settling as the slip unpins), then a tilt down that tracks the falling slip
  const p0 = sm(clamp01(t / (b.word + 0.3)));
  const fall0 = clamp01((t - b.word - 0.55) / (b.cut - b.word - 0.55));
  const u = fall0 * fall0;
  const cam = {
    x: lerp(lerp(CAM_A0.x, CAM_AM.x, p0), CAM_A1.x, u),
    y: lerp(lerp(CAM_A0.y, CAM_AM.y, p0), CAM_A1.y, u),
    z: lerp(lerp(CAM_A0.z, CAM_AM.z, p0), CAM_A1.z, u),
    lens: 1,
  };
  f.camera(cam);
  f.setMood('candleAmber');
  studyRoom(f, { key: ID, cams: [CAM_A0, CAM_AM, CAM_A1], outside: { mood: 'winterBlue', kind: 'night' } });
  const slips = wallStateAt(ID, 'start');
  const tq = tq12(t);
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    board: false,
    shelf: false,
    xray: false,
    flames: false,
    wall: { slips, hide: ['W7'] },
    extra: (c, env) => {
      const light = slotLight('W7');
      // the bare pin left behind
      const pinY = W7C.y + (-W7.h / 2 + 6) * WK;
      c.fillStyle = mixLab(env.mood.halo, env.mood.set, 0.35);
      c.beginPath();
      c.arc(W7C.x, pinY, 4 * WK, 0, Math.PI * 2);
      c.fill();
      // the unpin: a wobble on the pin (on twos), then it lifts off a hair, hangs, and floats down toward us,
      // turning slowly
      const wob = tq >= b.word && tq < b.word + 0.34 ? (Math.floor((tq - b.word) * 12) % 2 ? 0.05 : -0.045) * (1 - (tq - b.word) / 0.34) : 0;
      const tug = tq >= b.word && tq < b.word + 0.34 ? -3 : 0;
      const lift = sm((tq - b.word - 0.25) / 0.3);
      const fall = clamp01((tq - b.word - 0.55) / (b.cut - b.word - 0.55));
      const e = fall * fall;
      const x = W7C.x - 40 * e + 22 * Math.sin(fall * 3.2) * fall;
      const y = W7C.y + tug - 9 * lift + FALL_Y * e;
      const k = WK * (1 + 0.5 * e);
      drawSlip(c, W7_SLIP, { x, y, k, light: Math.min(1, light + 0.4 * e), rot: wob + 0.22 * Math.sin(fall * 2.6) * fall, pin: tq < b.word + 0.25 }, env);
    },
  });
}

// =====================================================================================================
// B · the desk, top-down, under the lamp: catch, read, lay down, stamp; the lamp clicks off
// =====================================================================================================
function desk(c: C, env: PaintEnv) {
  c.fillStyle = mixLab(env.mood.set, env.mood.fg, 0.35);
  c.fillRect(-200, -200, 1680, 1120);
  const g = c.createRadialGradient(600, 380, 30, 600, 380, 760);
  g.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.5), 0.95));
  g.addColorStop(0.55, withAlpha(mixLab(env.mood.set, env.mood.halo, 0.2), 0.55));
  g.addColorStop(1, withAlpha(env.mood.set, 0));
  c.fillStyle = g;
  c.fillRect(-200, -200, 1680, 1120);
  c.strokeStyle = withAlpha(env.mood.fg, 0.22);
  c.lineWidth = 1;
  for (let i = 0; i < 28; i++) {
    const yy = -60 + i * 30 + hash1(i, 3) * 6;
    c.beginPath();
    c.moveTo(-200, yy);
    c.bezierCurveTo(300, yy + hash1(i, 4) * 14, 900, yy - hash1(i, 5) * 14, 1480, yy);
    c.stroke();
  }
  // the lamp's round brass foot at top right, seen from above: dark iron with a turned brass rim, its stem boss, and
  // the flex running off frame
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 7;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(1200, 120);
  c.bezierCurveTo(1260, 190, 1330, 150, 1490, 210);
  c.stroke();
  c.fillStyle = withAlpha(env.mood.fg, 0.4);
  c.beginPath();
  c.arc(1162, 96, 78, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.arc(1150, 80, 74, 0, Math.PI * 2);
  c.fill();
  const brass = mixLab(env.mood.halo, env.mood.core, 0.3);
  // round-1: a turned brass rim round the whole foot (brightest on the lamp side), so it reads as a foot, not a hole
  c.strokeStyle = withAlpha(brass, 0.6);
  c.lineWidth = 2.6;
  c.beginPath();
  c.arc(1150, 80, 70, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(brass, env.mood.core, 0.4), 0.75);
  c.lineWidth = 2.2;
  c.beginPath();
  c.arc(1150, 80, 70, Math.PI * 0.45, Math.PI * 1.3);
  c.stroke();
  c.strokeStyle = withAlpha(brass, 0.3);
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(1150, 80, 56, Math.PI * 0.55, Math.PI * 1.2);
  c.stroke();
  c.fillStyle = mixLab(env.fill('ink'), brass, 0.25);
  c.beginPath();
  c.arc(1150, 80, 20, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(brass, 0.5);
  c.beginPath();
  c.arc(1144, 74, 6, 0, Math.PI * 2);
  c.fill();
  // the ink pad at lower right (the stamp's): a tin with its lid open, the pad inside dark with old red ink
  const tin = { x: 1040, y: 560, w: 230, h: 150 };
  c.fillStyle = withAlpha(env.mood.fg, 0.4);
  c.beginPath();
  c.roundRect(tin.x + 10, tin.y + 14, tin.w, tin.h, 12);
  c.fill();
  c.fillStyle = mixLab(env.fill('ink'), brass, 0.18);
  c.beginPath();
  c.roundRect(tin.x, tin.y, tin.w, tin.h, 12);
  c.fill();
  c.strokeStyle = withAlpha(brass, 0.4);
  c.lineWidth = 1.6;
  c.beginPath();
  c.roundRect(tin.x + 1, tin.y + 1, tin.w - 2, tin.h - 2, 11);
  c.stroke();
  c.fillStyle = mixLab('#3a1512', env.fill('ink'), 0.35);
  c.beginPath();
  c.roundRect(tin.x + 16, tin.y + 16, tin.w - 32, tin.h - 32, 6);
  c.fill();
  c.fillStyle = withAlpha(env.mood.rim, 0.08);
  c.fillRect(tin.x + 22, tin.y + 22, tin.w - 44, 3);
  // the pool's falloff: the desk sinks to dark away from the lamp, so the card sits in a real pool of light
  const v = c.createRadialGradient(600, 380, 260, 600, 380, 900);
  v.addColorStop(0, withAlpha(env.mood.fg, 0));
  v.addColorStop(0.55, withAlpha(env.mood.fg, 0.35));
  v.addColorStop(1, withAlpha(env.mood.fg, 0.82));
  c.fillStyle = v;
  c.fillRect(-200, -200, 1680, 1120);
}

/** the slip as paper on the desk / in a hand (centred at 0,0, upright): who-line, the sentence, the attribution */
function slipPaper(c: C, env: PaintEnv, light: number) {
  const w = SLIP.w, h = SLIP.h;
  const paper = paperTone(env, light);
  c.fillStyle = withAlpha(env.mood.fg, 0.4);
  c.fillRect(-w / 2 + 8, -h / 2 + 12, w, h);
  c.fillStyle = paper;
  c.fillRect(-w / 2, -h / 2, w, h);
  // age: a faint foxing and a crease (pinned since 2017)
  c.strokeStyle = withAlpha(env.mood.set, 0.18);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-w * 0.12, -h / 2);
  c.lineTo(-w * 0.1, h / 2);
  c.stroke();
  c.fillStyle = withAlpha(mixLab(env.mood.halo, '#8a6a2a', 0.5), 0.12);
  c.beginPath();
  c.arc(w * 0.36, h * 0.28, 22, 0, Math.PI * 2);
  c.fill();
  const ink = mixLab(env.mood.ink, paper, 0.08);
  c.fillStyle = ink;
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  // every line the viewer reads is at the legibility floor while the slip is held under the lamp (22 px cap at 1080p)
  c.font = `400 28px ${FONT.typewriter}`;
  c.fillText('HINTON · SEPT 2017', -w / 2 + 26, -h / 2 + 40);
  c.fillRect(-w / 2 + 26, -h / 2 + 52, w - 52, 1);
  const font = `400 29px ${FONT.typewriter}`;
  const lines = wrapLines(c, QUOTE, font, w - 64, 40);
  c.font = font;
  lines.forEach((ln, i) => c.fillText(ln, -w / 2 + 30, -h / 2 + 98 + i * 38));
  // the attribution in pen (EB Garamond italic) so the whole line fits the slip at a readable size
  c.font = `italic 400 25px ${FONT.text}`;
  c.globalAlpha *= 0.9;
  c.fillText(ATTR, -w / 2 + 30, h / 2 - 24);
}

function slipPose(t: number, b: B): { x: number; y: number; s: number; rot: number } {
  const tq = tq12(t);
  // floats down into the pool (from above frame), turning; caught at catchAt; held; laid down on the case card
  const fall = clamp01((tq - b.cut + 0.05) / (b.catchAt - b.cut + 0.05));
  if (tq < b.catchAt) {
    const e = 1 - Math.pow(1 - fall, 2);
    return { x: lerp(700, HOLD.x, e) + 40 * Math.sin(fall * 4) * (1 - fall), y: lerp(-260, HOLD.y, e), s: lerp(1.15, 1, e), rot: 0.35 * (1 - e) * Math.cos(fall * 3) - 0.025 };
  }
  // round-1: a breath while held (on the twos, ±1.5 px, a 3.6 s breath): the hands and the paper drift together
  const hold = { x: HOLD.x + 1.0 * Math.sin(tq * 1.75 + 1.3), y: HOLD.y + 1.5 * Math.sin(tq * 1.75), s: 1, rot: -0.025 + 0.004 * Math.sin(tq * 0.9) };
  const l = sm((tq - b.lay) / 0.45);
  return { x: lerp(hold.x, LAID.x, l), y: lerp(hold.y, LAID.y, l), s: lerp(1, LAID.s, l), rot: lerp(hold.rot, LAID.rot, l) };
}

function paintDesk(f: Frame, t: number, b: B) {
  const tq = tq12(t);
  const du = sm((t - b.cut) / (b.off - b.cut));
  // round-1: through the six-second read, a slow 3% push toward the held slip
  const push = sm((t - b.catchAt) / (b.lay - b.catchAt));
  f.camera({ ...CAMERA3_HOME, x: 640 - 16 * du - 18 * push, y: 360 + 8 * du - 16 * push, z: 34 * du + 29 * push });
  f.setMood('candleAmber');
  // the lamp: on, then the click (on the twos): a dip, a flash of filament, out
  const dt = tq - Math.round(b.off * 12) / 12;
  const lamp = dt < 0 ? 1 : dt < 1 / 12 ? 0.55 : dt < 2 / 12 ? 0.12 : 0;
  const sp = slipPose(t, b);
  // hands: BOTH cuffed hands come up from the bottom edge (in by 4.4 s), wait open under the falling slip and catch it
  // by its two lower corners at 4.8 s (kept low in frame, clear of every word); they lay it down on the case card and
  // withdraw; then the stamp comes in from the right, over the card and clear of the ink pad
  const len = HAND_LEN * 1.75;
  const ER = { x: 1420, y: 940 };
  const EL = { x: -160, y: 940 };
  let hp: HandsPose | null = null;
  const hold0 = slipPose(b.catchAt, b);
  const corner = (p: typeof sp, side: 1 | -1): Pt => {
    const lx = side * (SLIP.w / 2 - 18), ly = SLIP.h / 2 - 40;
    return { x: p.x + (lx * Math.cos(p.rot) - ly * Math.sin(p.rot)) * p.s, y: p.y + (lx * Math.sin(p.rot) + ly * Math.cos(p.rot)) * p.s };
  };
  const reachIn = sm((tq - 3.85) / 0.55);
  const release = b.lay + 0.45;
  const caught = tq >= b.catchAt;
  if (tq < release + 0.35 && reachIn > 0) {
    const out = sm((tq - release) / 0.35);
    const arm = (E: Pt, side: 1 | -1) => {
      // before the catch the hand waits a little below where the corner will arrive; after it, it holds the corner
      const wait = corner(hold0, side);
      const tgt = caught ? corner(sp, side) : { x: wait.x + side * 10, y: wait.y + 26 };
      const from = { x: E.x - side * 60, y: E.y - 90 };
      const at = { x: lerp(lerp(from.x, tgt.x, reachIn), from.x, out), y: lerp(lerp(from.y, tgt.y, reachIn), from.y + 60, out) };
      return hands.reach(E, at, caught && tq < release ? 'pinch' : 'open', len, { bend: side * 0.1 });
    };
    hp = { right: arm(ER, 1), left: arm(EL, -1), scale: 1.75 };
  }
  const STAMP_DUR = 1.3;
  const su = (tq - b.stamp) / STAMP_DUR;
  const stampTarget = { x: K_DESK.x + 10, y: K_DESK.y + 52 };
  if (su >= 0 && su < 1) hp = hands.act('stamp', su, stampTarget, { scale: 1.75, entry: { R: { x: 1500, y: 420 } } });
  const stamped = su >= 0.5 ? 1 : 0;
  f.layer('L4', (c, env) => {
    f.cached(`${ID}/desk/${env.mood.id}`, 1680, 1120, (cc) => {
      cc.translate(200, 200);
      desk(cc, env);
    })(c, -200, -200);
    // WHO TAUGHT IT? where it dropped: face up in the pool; then the stamp
    drawCard(c, SLOTS.K, { x: K_DESK.x, y: K_DESK.y, k: K_DESK.k, light: 0.9, rot: K_DESK.rot, pin: false }, env);
    if (stamped) statusOpen(c, tq - (b.stamp + STAMP_DUR * 0.5));
    // the slip
    c.save();
    c.translate(sp.x, sp.y);
    c.rotate(sp.rot);
    c.scale(sp.s, sp.s);
    const lift = 1 - sm((tq - b.lay) / 0.45);
    if (tq >= b.catchAt) {
      // held above the desk: a soft shadow offset on the wood below
      c.fillStyle = withAlpha(env.mood.fg, 0.22 * lift);
      c.fillRect(-SLIP.w / 2 + 30, -SLIP.h / 2 + 40, SLIP.w, SLIP.h);
    }
    slipPaper(c, env, 0.95);
    c.restore();
    if (hp) drawHands(c, hp, env, { dx: 0.9, dy: -0.9 });
  });
  f.rim({ x: 0.4, y: -0.9 });
  // L5: dust turning in the lamp's pool, between the shade and the desk (dims with the lamp)
  if (lamp > 0.01) {
    f.layer('L5', (c, env) => {
      dustMotes(c, { area: { x: 120, y: 40, w: 1000, h: 640 }, count: 46, drift: { x: 4, y: -3 }, size: 1.4, brightness: 0.75 * lamp, color: env.mood.core, salt: 1509 }, env);
    });
  }
  // L6: the lamp's shade hanging over the desk at top right, seen from above (near, soft): it frames the pool and
  // slides against the desk as the camera settles (the third plane)
  f.layer('L6', (c, env) => {
    const ink = mixLab(PUPPET_NEAR_BLACK, '#1d2a20', 0.35);
    c.fillStyle = ink;
    c.beginPath();
    c.ellipse(1290, -40, 300, 230, -0.35, 0, Math.PI * 2);
    c.fill();
    // the shade's rolled brass lip catches the bulb below it
    c.strokeStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.3), 0.35 * lamp);
    c.lineWidth = 5;
    c.beginPath();
    c.ellipse(1290, -40, 300, 230, -0.35, Math.PI * 0.48, Math.PI * 1.02);
    c.stroke();
  });
  // the click: everything goes dark (the desk, the card, the red) — only the cursor will remain
  if (lamp < 1) {
    const c = f.c;
    c.save();
    c.fillStyle = `rgba(4,3,2,${(0.985 * (1 - lamp)).toFixed(3)})`;
    c.fillRect(-20, -20, 1320, 760);
    c.restore();
  }
}
/** STATUS: OPEN, stamped in red ink low on the case card (below its title, so both read); the film's one full red.
 *  For a moment after the stamp lifts the ink sits wet and a shade darker. */
function statusOpen(c: C, dt: number) {
  const w = SLOTS.K.w * K_DESK.k, h = SLOTS.K.h * K_DESK.k;
  const wet = Math.max(0, 1 - dt / 0.6);
  c.save();
  c.translate(K_DESK.x, K_DESK.y);
  c.rotate(K_DESK.rot - 0.1);
  const red = wet > 0 ? mixLab('#b3261e', '#7a140f', 0.35 * wet) : '#b3261e';
  c.strokeStyle = red;
  c.fillStyle = red;
  c.globalAlpha = 0.9;
  c.lineWidth = 4.2;
  const bw = w * 0.66, bh = 54, by = h * 0.5 - bh - 14;
  c.strokeRect(-bw / 2, by, bw, bh);
  c.lineWidth = 1.4;
  c.strokeRect(-bw / 2 + 5, by + 5, bw - 10, bh - 10);
  c.font = `400 31px ${FONT.typewriter}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('STATUS: OPEN', 0, by + bh / 2 + 1);
  // the stamp's uneven inking: a few dry flecks knocked out of the letters
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 40; i++) {
    c.globalAlpha = 0.5;
    c.fillRect(-bw / 2 + (hash1(i, 81) * 0.5 + 0.5) * bw, by + (hash1(i, 82) * 0.5 + 0.5) * bh, 2 + 2 * hash1(i, 83), 1.5);
  }
  c.restore();
}

/** the cursor from the very first shot (ch01-s01's chat-box cursor: a cool off-white bar, 3 x 14 px at 1080p, on a
 *  steady half-second blink, a faint chat-box underline beneath it), blinking in the dark where the chat box was.
 *  On 'new candles' its blink slows; it goes out as the match flares. */
function cursor(f: Frame, t: number, b: B, cam: Camera3 = CAM_D0) {
  const t0 = b.off + 0.2;
  if (t < t0) return;
  const ph = blinkPhase(t, t0, b.slow);
  const on = ph % 1 < 0.5;
  // it holds steady through the line and goes out as the match flares on 'candles'
  const fadeIn = win(t, t0, t0 + 0.2) * (1 - win(t, b.flare - 0.05, b.flare + 0.2));
  if (fadeIn <= 0.003) return;
  const c = f.c;
  const cool = mixLab(MOODS.serverCyan.core, '#f2f5f6', 0.45);
  const P = toScreen(LAYERS.L4, cam, WICK.x, WICK.y - 8);
  const x = P.x - 70, y = P.y;
  c.save();
  c.globalCompositeOperation = 'lighter';
  // round-1: big enough for the callback to register (6 x 26 px at 1080p), in a soft cyan halo
  const R = 30;
  const halo = c.createRadialGradient(x, y, 0, x, y, R);
  halo.addColorStop(0, withAlpha(MOODS.serverCyan.halo, (on ? 0.4 : 0.06) * fadeIn));
  halo.addColorStop(0.45, withAlpha(MOODS.serverCyan.halo, (on ? 0.14 : 0.02) * fadeIn));
  halo.addColorStop(1, withAlpha(MOODS.serverCyan.halo, 0));
  c.fillStyle = halo;
  c.fillRect(x - R, y - R, 2 * R, 2 * R);
  c.restore();
  c.save();
  // the chat box's underline: a faint cool rule, the cursor at its left end
  // (it fades as the room comes up from 'Somewhere', so it never reads as a rail across the new candle's top)
  c.globalAlpha = 0.16 * fadeIn * (1 - warmAt(t, b));
  c.fillStyle = cool;
  c.fillRect(x - 10, y + 16, 260, 1);
  if (on) {
    c.globalAlpha = 0.95 * fadeIn;
    c.fillRect(x - 2.1, y - 9, 4.2, 18);
  }
  c.restore();
}
/** the warm interior plane: an ease-out rise from just before 'Somewhere', visibly up on the word, full in ~1 s */
function warmAt(t: number, b: B) {
  const x = clamp01((t - b.warm) / 1.0);
  return 1 - (1 - x) * (1 - x);
}
/** blink phase (cycles): ch01-s01's steady 1.0 s period (0.5 on / 0.5 off) until 'new'; from the next blink after it
 *  the period is 1.6 s (one long, slow on-beat under 'candles') */
function blinkPhase(t: number, t0: number, ts: number) {
  const r0 = 1;
  const next = Math.ceil((ts - t0) * r0 - 1e-6);
  const tNext = t0 + next / r0;
  if (t < tNext) return (t - t0) * r0;
  return next + (t - tNext) / 1.6;
}

// =====================================================================================================
// D · the end of the shelf, by the window: a hand from the viewer's side strikes a match and lights a new candle
// =====================================================================================================
function paintShelfEnd(f: Frame, t: number, b: B) {
  const tq = tq12(t);
  const u = sm((t - b.dark) / (b.D - b.dark));
  const cam: Camera3 = { x: lerp(CAM_D0.x, CAM_D1.x, u), y: lerp(CAM_D0.y, CAM_D1.y, u), z: lerp(CAM_D0.z, CAM_D1.z, u), lens: 1 };
  f.camera(cam);
  f.setMood('candleAmber');
  const { hp, fl, matchK, out, tip, shakeX, shakeAt } = matchHands(tq, b, cam);
  // the new candle catches on b6 (on the twos): a bead, a gutter, then the flame stands
  const dc = tq - b.light;
  const candleK = dc < 0 ? 0 : dc < 1 / 12 ? 0.35 : dc < 2 / 12 ? 0.25 : Math.min(1, 0.55 + (dc - 2 / 12) * 2.6);
  const light = Math.max(matchK * 0.85, candleK);
  // the flare lights the candle's detail; before it, from 'Somewhere', the shelf and the unlit candle stand in
  // silhouette against the warm interior plane
  const reveal = sm(win(t, b.flare - 0.02, b.flare + 0.3));
  const warm = warmAt(t, b);
  studyRoom(f, { key: `${ID}/end`, cams: [CAM_D0, CAM_D1], outside: { mood: 'winterBlue', kind: 'night' }, lamp: 0, fog: 0.35 });
  // the warm interior plane (round 3): the shelf's live candles, further along at left, warm the back wall behind the
  // shelf's end, so from 'Somewhere' the left of the frame reads as a room (~15% luma), not as black
  const G = gapFlame(cam);
  if (warm > 0.003) {
    f.layer('L3', (c, env) => {
      const p = toLayer(LAYERS.L3, cam, G.x, G.y);
      const q = toLayer(LAYERS.L3, cam, G.x + 1, G.y);
      const u = q.x - p.x;
      c.save();
      c.globalCompositeOperation = 'lighter';
      const R = 760 * u;
      const g = c.createRadialGradient(p.x, p.y, 10 * u, p.x, p.y, R);
      g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.25), 0.34 * warm));
      g.addColorStop(0.3, withAlpha(env.mood.halo, 0.17 * warm));
      g.addColorStop(0.7, withAlpha(mixLab(env.mood.halo, env.mood.set, 0.5), 0.05 * warm));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(p.x - R, p.y - R, 2 * R, 2 * R);
      c.restore();
    });
  }
  f.layer('L4', (c, env) => {
    // the shelf's far end: the plank and the new candle only (the lamp is off; the room is dark)
    const views = V9.map((v) => (v.id === 'new' ? (candleK > 0 ? NEW_LIT : NEW0) : v));
    candleShelfEnd(c, env, views, reveal, warm);
    if (hp) {
      c.save();
      c.translate(shakeX, 0);
      // round-1: the darkest shapes in frame; one thin rim toward the window's moonlight (up-right) so the hand,
      // the matchbox (its top edge) and the match separate; the match stick lit by its own head only
      drawHands(c, hp, env, { dx: 0.8, dy: -0.8 });
      c.restore();
    }
    // the shaken-out match: a thin thread of smoke from its tip as the hand goes
    if (out && tip) {
      const sk = 1 - win(t, shakeAt + 0.5, b.D);
      c.save();
      c.strokeStyle = withAlpha(mixLab(env.mood.haze, env.mood.rim, 0.5), 0.4 * sk);
      c.lineWidth = 1.3;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(tip.x, tip.y);
      const age = Math.min(1, (t - shakeAt) / 0.5);
      for (let i = 1; i <= 18; i++) {
        const q = i / 18;
        c.lineTo(tip.x + Math.sin(q * 6 - t * 1.6) * (2 + 10 * q), tip.y - q * 110 * age);
      }
      c.stroke();
      c.restore();
    }
  });
  f.rim({ x: 0, y: -1 });
  // the room's darkness: after the click a beat of black, then the study comes up in moonlight (the window, the
  // shelf's end and the unlit candle as dim shapes), lifted further by the match and the flame
  const c = f.c;
  // review round 2: no near-black under L1520; the moonlit room reads (the panes, the shelf's end, the candle's shape)
  const moon = sm((t - b.moon) / b.moonDur);
  const vis = 0.03 + 0.24 * moon + 0.45 * light;
  // the darkness lifts most around the shelf's live candles (the warm interior plane), least at frame centre
  const visW = Math.min(0.9, vis + 0.56 * warm);
  c.save();
  const dg = c.createRadialGradient(G.x, G.y + 60, 30, G.x, G.y + 60, 820);
  dg.addColorStop(0, `rgba(3,2,1,${(1 - visW).toFixed(3)})`);
  dg.addColorStop(0.45, `rgba(3,2,1,${(1 - (vis + 0.55 * (visW - vis))).toFixed(3)})`);
  dg.addColorStop(1, `rgba(3,2,1,${(1 - vis).toFixed(3)})`);
  c.fillStyle = dg;
  c.fillRect(-20, -20, 1320, 760);
  // the study window: the night outside reads as the room's brightest value until the flame takes over
  const Wn = STUDY.window;
  const a0 = toScreen(STUDY_WALL, cam, Wn.x - 18, Wn.y - 18), a1 = toScreen(STUDY_WALL, cam, Wn.x + Wn.w + 18, Wn.y + Wn.h + 24);
  const wv = 0.01 + 0.75 * moon + 0.2 * light;
  c.fillStyle = `rgba(3,2,1,${(1 - Math.min(1, wv / vis)).toFixed(3)})`;
  c.filter = 'blur(6px)';
  c.fillRect(a0.x, a0.y, a1.x - a0.x, a1.y - a0.y);
  c.restore();
  acrossStreet(f, cam, t, b, moon);
  glass(f, cam, moon, candleK, t, b);
  cursor(f, t, b, cam);
  if (fl && matchK > 0.01) f.practical({ x: fl.x, y: fl.y, kind: 'candle', seed: 2026, intensity: 0.9 * matchK, radius: 52 });
  // THE GAP, the neighbouring live candle, further from the lens: its small flame at ~40%, under the new one's bloom
  // (round 3) it burns from 'Somewhere': it is the warm interior plane's practical
  const gapK = Math.max(reveal, warm);
  if (gapK > 0.01) {
    for (const id of LAST3) {
      const v = V9.find((q) => q.id === id)!;
      if (v.state !== 'live') continue;
      const p = candleFlame({ x: candleX(V9, id), y: SY, view: v, s: STUDY.shelf.s });
      f.practical({ x: p.x, y: p.y - 3, kind: 'candle', seed: 2025, intensity: 0.42 * gapK, radius: 26 });
    }
  }
  if (candleK > 0.01) {
    const sway = 1.2 * vnoise2(t * 2.1, 7.7);
    // the halo blooms as the flame settles (over THE GAP's smaller flame)
    const bloom = sm((t - b.light - 0.3) / 1.4);
    f.practical({ x: WICK.x + sway, y: WICK.y - 4, kind: 'candle', seed: 2027, intensity: (0.95 + 0.2 * bloom) * candleK, radius: 56 + 44 * bloom });
  }
  // the final hold's depth: a faint haze band across the sill and a soft curtain edge on the near plane (L5)
  const nearK = Math.max(light, warm);
  if (nearK > 0.01) {
    f.fog({ yCenter: toScreen(LAYERS.L4, cam, 0, SY - 120).y, height: 170, alpha: 0.1 * nearK, drift: 5 });
    f.layer('L5', (c, env) => {
      c.save();
      c.globalAlpha = Math.min(1, nearK * 1.2);
      // the desk's near edge at lower left, in silhouette, its top lip catching the warm plane behind it
      const d0 = toLayer(LAYERS.L5, cam, -40, 684), d1 = toLayer(LAYERS.L5, cam, 250, 760);
      c.fillStyle = PUPPET_NEAR_BLACK;
      c.beginPath();
      c.moveTo(d0.x - 200, d0.y);
      c.lineTo(d1.x - 26, d0.y);
      c.quadraticCurveTo(d1.x, d0.y + 2, d1.x + 8, d0.y + 22);
      c.lineTo(d1.x + 20, d1.y + 200);
      c.lineTo(d0.x - 200, d1.y + 200);
      c.closePath();
      c.fill();
      c.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.rim, 0.5), 0.45 * Math.min(1, nearK));
      c.fillRect(d0.x - 200, d0.y - 1, d1.x - 26 - (d0.x - 200), 2);
      const top = toLayer(LAYERS.L5, cam, 0, -60).y, bottom = toLayer(LAYERS.L5, cam, 0, 800).y;
      // a plain dark curtain edge (no lit folds: it is a near silhouette, soft with the L5 blur)
      c.fillStyle = PUPPET_NEAR_BLACK;
      c.beginPath();
      c.moveTo(DRAPE.x - 400, top);
      c.lineTo(DRAPE.x + 40, top);
      for (let k = 0; k <= 12; k++) {
        const yy = top + ((bottom - top) * k) / 12;
        c.lineTo(DRAPE.x + 40 + 14 * Math.sin(k * 1.3) + 22 * (k / 12), yy);
      }
      c.lineTo(DRAPE.x - 400, bottom);
      c.closePath();
      c.fill();
      void env;
      c.restore();
    });
  }
}
/** the study glass (screen space, over the panes): a faint diagonal moon sheen, and once the new candle lights, its
 *  flame's warm reflection low in the left-hand pane, tying the two halves of the frame together */
function glass(f: Frame, cam: Camera3, moon: number, candleK: number, t: number, b: B) {
  if (moon <= 0.01) return;
  const Wn = STUDY.window;
  const a0 = toScreen(STUDY_WALL, cam, Wn.x, Wn.y), a1 = toScreen(STUDY_WALL, cam, Wn.x + Wn.w, Wn.y + Wn.h);
  const c = f.c;
  c.save();
  c.beginPath();
  c.rect(a0.x, a0.y, a1.x - a0.x, a1.y - a0.y);
  c.clip();
  c.globalCompositeOperation = 'lighter';
  // the sheen: one soft diagonal band
  const N = MOODS.winterBlue;
  const sx = a0.x + (a1.x - a0.x) * 0.62;
  const g = c.createLinearGradient(sx - 120, 0, sx + 120, 0);
  g.addColorStop(0, withAlpha(N.core, 0));
  g.addColorStop(0.5, withAlpha(N.core, 0.06 * moon));
  g.addColorStop(1, withAlpha(N.core, 0));
  c.save();
  c.translate(sx, (a0.y + a1.y) / 2);
  c.transform(1, 0, -0.45, 1, 0, 0);
  c.translate(-sx, -(a0.y + a1.y) / 2);
  c.fillStyle = g;
  c.fillRect(sx - 120, a0.y, 240, a1.y - a0.y);
  c.restore();
  if (candleK > 0.01) {
    const P = toScreen(LAYERS.L4, cam, WICK.x, WICK.y);
    // low in the left-hand pane, clear of the lit window across the street
    const rx = a0.x + (a1.x - a0.x) * 0.15, ry = P.y + 165;
    const sway = 0.8 * vnoise2(t * 2.1, 7.7);
    const k = candleK * (0.85 + 0.15 * sm((t - b.light - 0.3) / 1.4));
    const r = c.createRadialGradient(rx + sway, ry, 0, rx + sway, ry, 64);
    r.addColorStop(0, withAlpha(f.mood.core, 0.34 * k));
    r.addColorStop(0.25, withAlpha(f.mood.halo, 0.14 * k));
    r.addColorStop(1, withAlpha(f.mood.halo, 0));
    c.fillStyle = r;
    c.fillRect(rx - 66, ry - 66, 132, 132);
    c.fillStyle = withAlpha(f.mood.core, 0.6 * k);
    c.beginPath();
    c.ellipse(rx + sway, ry, 2.2, 6, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** the hands as the darkest shapes in frame (value hierarchy, round-1 notes): PUPPET_NEAR_BLACK throughout, no inner
 *  cut-line highlights and no ring glint (they read as a segmented glove); one 1 px rim cut by drawing a light copy
 *  offset toward the key (dx, dy) under the dark hands. A lit match's flame is drawn on top in its own colours. */
function drawHands(c: C, hp: HandsPose, env: PaintEnv, rim: { dx: number; dy: number }) {
  const K = PUPPET_NEAR_BLACK;
  const unlit: HandsPose = hp.right ? { ...hp, right: { ...hp.right, lit: 0 } } : hp;
  const rimCol = mixLab(env.mood.rim, env.mood.core, 0.3);
  const rimEnv: PaintEnv = { ...env, mood: { ...env.mood, rim: rimCol, halo: rimCol, core: rimCol, set: rimCol, ink: rimCol }, fill: () => rimCol };
  const darkEnv: PaintEnv = { ...env, mood: { ...env.mood, rim: K, halo: K, core: K, set: K, ink: K }, fill: (r) => (r === 'ink' ? K : env.fill(r)) };
  c.save();
  c.globalAlpha *= 0.7;
  c.translate(rim.dx, rim.dy);
  hands.draw(c, unlit, rimEnv);
  c.restore();
  hands.draw(c, unlit, darkEnv);
  // the kit's finger segments overlap the palm with opposite winding, which leaves small holes (read as light beads
  // along the fingers): cover each hand with its hole-filled silhouette, in the same near-black
  const len = HAND_LEN * (hp.scale ?? 1);
  for (const a of [hp.left, hp.right]) if (a) solidHand(c, a, len, env);
  const fl = hands.flameAt(hp);
  if (fl && hp.right) {
    const len = HAND_LEN * (hp.scale ?? 1);
    const k = Math.max(0, Math.min(1, hp.right.lit ?? 0));
    c.save();
    c.translate(fl.x, fl.y);
    c.scale(len / 100, len / 100);
    flameShape(c, env, 0, 4, 10 * (0.5 + 0.5 * k), 31, 0.9 + 0.2 * k);
    c.restore();
  }
}

/** hole-filled hand silhouettes, one per sprite shape, baked once: the kit hand drawn in hand-local units into a small
 *  canvas, then every transparent pixel not reachable from the border (a winding hole) is filled */
const MASK = { x0: -0.04, x1: 1.26, y0: -0.78, y1: 0.78, ppu: 420 };
const masks = new Map<HandShapeN, HTMLCanvasElement | null>();
function handMask(shapeId: HandShapeN, env: PaintEnv): HTMLCanvasElement | null {
  const shape0 = shapeId;
  if (masks.has(shape0)) return masks.get(shape0)!;
  if (typeof document === 'undefined') return null;
  const W = Math.ceil((MASK.x1 - MASK.x0) * MASK.ppu), H = Math.ceil((MASK.y1 - MASK.y0) * MASK.ppu);
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d', { willReadFrequently: true });
  if (!g) {
    masks.set(shape0, null);
    return null;
  }
  const K = PUPPET_NEAR_BLACK;
  const kEnv: PaintEnv = { ...env, mood: { ...env.mood, rim: K, halo: K, core: K, set: K, ink: K }, fill: () => K };
  // the hand alone (the sleeve runs back along -x: clipped away at the wrist)
  g.save();
  g.beginPath();
  g.rect(-MASK.x0 * MASK.ppu + 0.02 * MASK.ppu, 0, W, H);
  g.clip();
  hands.draw(g, { right: { wrist: { x: -MASK.x0 * MASK.ppu, y: -MASK.y0 * MASK.ppu }, angle: 0, bend: 0, shape: shape0 }, scale: MASK.ppu / HAND_LEN }, kEnv);
  g.restore();
  const img = g.getImageData(0, 0, W, H);
  const d = img.data;
  // a morphological closing (dilate R, flood the outside, erode R): the gaps between finger segments and the palm
  // can be a pixel wide, so a plain hole-fill would leak; the closing seals them without fattening the outline
  const R = 9;
  const N = W * H;
  const A = new Uint8Array(N);
  for (let i = 0; i < N; i++) A[i] = d[i * 4 + 3] >= 110 ? 1 : 0;
  const pass = (src: Uint8Array, horiz: boolean, max: boolean) => {
    const out = new Uint8Array(N);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let v = max ? 0 : 1;
        for (let k = -R; k <= R; k++) {
          const xx = horiz ? x + k : x, yy = horiz ? y : y + k;
          const inside = xx >= 0 && xx < W && yy >= 0 && yy < H;
          const q = inside ? src[yy * W + xx] : 0;
          if (max ? q : !q) {
            v = max ? 1 : 0;
            break;
          }
        }
        out[y * W + x] = v;
      }
    }
    return out;
  };
  const dil = pass(pass(A, true, true), false, true);
  const outside = new Uint8Array(N);
  const stack: number[] = [];
  const push = (i: number) => {
    if (!outside[i] && !dil[i]) {
      outside[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < W; x++) {
    push(x);
    push((H - 1) * W + x);
  }
  for (let y = 0; y < H; y++) {
    push(y * W);
    push(y * W + W - 1);
  }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % W, y = (i - x) / W;
    if (x > 0) push(i - 1);
    if (x < W - 1) push(i + 1);
    if (y > 0) push(i - W);
    if (y < H - 1) push(i + W);
  }
  const shape = new Uint8Array(N);
  for (let i = 0; i < N; i++) shape[i] = outside[i] ? 0 : 1;
  const closed = pass(pass(shape, true, false), false, false);
  for (let i = 0; i < N; i++) {
    if (closed[i] && d[i * 4 + 3] < 255) {
      d[i * 4] = 11;
      d[i * 4 + 1] = 13;
      d[i * 4 + 2] = 11;
      d[i * 4 + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  masks.set(shape0, cv);
  return cv;
}
/** draw one arm's hole-filled hand silhouette with the kit's own arm transform (wrist, angle, mirror, bend) */
function solidHand(c: C, a: ArmPose, len: number, env: PaintEnv) {
  const m = handMask(a.shape, env);
  if (!m) return;
  const flipY = Math.cos(a.angle) < 0 ? -1 : 1;
  c.save();
  c.translate(a.wrist.x, a.wrist.y);
  c.rotate(a.angle);
  c.scale(len, len * flipY);
  c.rotate(a.bend ?? 0);
  c.drawImage(m, MASK.x0, MASK.y0, MASK.x1 - MASK.x0, MASK.y1 - MASK.y0);
  c.restore();
}

/** the near curtain's edge (L5 world), at the frame's left edge in the shelf camera */
const DRAPE = toLayer(LAYERS.L5, CAM_D0, -250, 0); // the near plane slides right as the camera pushes: it ends at the frame's left edge

/** the match hand, timed to the words: in from the bottom edge (right of the candle) from 'come', the box and the
 *  strike on 'from' (b5), a flare; the box hand goes; the match is carried to the wick FROM THE SIDE (the fist stays
 *  right of the candle, the match's tip meets the wick); the wick catches on b6; the match is shaken out and the hand
 *  withdraws. The match arm is solved so its flame lands exactly on its mark. */
function matchHands(tq: number, b: B, cam: Camera3) {
  const scale = 1.35;
  const len = HAND_LEN * scale;
  const entry = { R: toLayer(LAYERS.L4, cam, 1060, 880), L: toLayer(LAYERS.L4, cam, 760, 960) };
  // struck right under the wick, so the match lit on 'new' can touch the wick on 'candles' a fifth of a second later
  const strikeAt = { x: WICK.x + 70, y: WICK.y + 84 };
  const shakeAt = b.touch + 0.4;
  const none = { hp: null as HandsPose | null, fl: null as Pt | null, matchK: 0, out: false, tip: null as Pt | null, shakeX: 0, shakeAt };
  // the kit's strikeLight (box in by .22, scratch .25 → ignition .36, flare .38): the hand and the matchbox rise on
  // 'suspicious' and are in a second later; the match waits at the striker through 'That is where'; the scratch on
  // 'new' (foley fx-match-strike), ignition at the end of the stroke
  const sk: [number, number][] = [[b.handIn, 0], [b.handIn + 1.2, 0.22], [b.strike - 0.25, 0.25], [b.strike, 0.25], [b.flare, 0.36], [b.flare + 1 / 12, 0.38]];
  if (tq <= sk[0][0] || tq > shakeAt + 1.4) return none;
  let U = 0.42;
  for (let i = 0; i < sk.length - 1; i++) {
    if (tq <= sk[i + 1][0]) {
      U = lerp(sk[i][1], sk[i + 1][1], (tq - sk[i][0]) / (sk[i + 1][0] - sk[i][0]));
      break;
    }
  }
  const base = hands.act('strikeLight', U, { x: WICK.x, y: WICK.y }, { scale, entry, strikeAt });
  const boxGo = sm(clamp01((tq - (b.flare + 1 / 12)) / 0.6));
  const left = tq <= b.flare + 1 / 12 ? base.left : boxGo < 1 ? hands.act('strikeLight', 0.42 + 0.2 * boxGo, { x: WICK.x, y: WICK.y }, { scale, entry, strikeAt }).left : undefined;
  const startAt = { x: strikeAt.x - len * 0.2, y: strikeAt.y - len * 0.05 };
  // the mark: the match's tip just right of the wick, a hair below it
  const mark = { x: WICK.x + 7, y: WICK.y + 2 };
  let atMark = { x: mark.x + len * 0.5, y: mark.y + len * 0.5 };
  for (let i = 0; i < 6; i++) {
    const fl = hands.flameAt({ right: hands.reach(entry.R, atMark, 'grip', len, { held: 'match', lit: 1 }), scale })!;
    atMark = { x: atMark.x + (mark.x - fl.x), y: atMark.y + (mark.y - fl.y) };
  }
  const out = tq >= shakeAt + 2 / 12;
  let lit = U < 0.36 ? 0 : U < 0.42 ? 1.3 - (U - 0.36) * 5 : 1;
  if (out) lit = 0;
  let right: HandsPose['right'] = base.right ? { ...base.right, lit } : undefined;
  if (tq > b.flare + 1 / 12) {
    // the flick to the wick: the match's tip is on its mark on 'candles'
    const carry = sm(clamp01((tq - (b.flare + 1 / 12)) / Math.max(1 / 12, b.touch - (b.flare + 1 / 12))));
    const goHome = sm(clamp01((tq - (shakeAt + 0.4)) / 0.9));
    const home = { x: entry.R.x - 60, y: entry.R.y + 40 };
    const at0 = { x: lerp(startAt.x, atMark.x, carry), y: lerp(startAt.y, atMark.y, carry) };
    const at = { x: lerp(at0.x, home.x, goHome), y: lerp(at0.y, home.y, goHome) };
    right = hands.reach(entry.R, at, 'grip', len, { held: 'match', lit });
  }
  const hp: HandsPose = { right, left, scale };
  const shakeX = tq >= shakeAt && tq < shakeAt + 4 / 12 ? (Math.floor((tq - shakeAt) * 12) % 2 ? -9 : 9) : 0;
  const tip = right ? hands.flameAt({ ...hp, right: { ...right, lit: 1 } }) : null;
  const fl0 = hands.flameAt(hp);
  const fl = fl0 ? { x: fl0.x + shakeX, y: fl0.y } : null;
  const matchK = fl ? Math.max(0, Math.min(1.3, lit)) : 0;
  return { hp, fl, matchK, out, tip, shakeX, shakeAt };
}

/** 'Somewhere tonight a lamp is on, and someone at the rim is suspicious': through the study window's panes, the
 *  building across the street (a cool winter-night facade, its other windows dark) and in it ONE window whose desk lamp
 *  clicks on at 'lamp' (on the twos) and stays on: a green-shaded banker's lamp, its warm pool on the desk, and at the
 *  pool's edge (the rim of the light) a seated figure, rim-lit, who on 'suspicious' leans in toward the page, hand to
 *  chin. Drawn on its own plane between the skyline and the study wall, clipped to the panes (after the darkness pass:
 *  the lit window is the brightest thing in the room until the match). */
const ACROSS: LayerSpec = { id: 'acrossSt', z: 2600, haze: 0.4, blur: 2.2 };
const AK = toScreen(ACROSS, CAM_D0, 0, 0).k;
const AL = (sx: number, sy: number) => toLayer(ACROSS, CAM_D0, sx, sy);
const FACADE = { a: AL(560, 112), b: AL(1460, 900) };
const LIT = { ...AL(905, 300), u: 1 / AK }; // its centre; u = layer units per screen px at the rest framing
function acrossStreet(f: Frame, cam: Camera3, t: number, b: B, moon: number) {
  if (moon <= 0.01) return;
  const tq = tq12(t);
  const dt = tq - b.farLamp;
  const on = dt < 0 ? 0 : dt < 1 / 12 ? 0.6 : dt < 2 / 12 ? 0.15 : 1;
  const lean = sm((tq - b.lean) / 0.5);
  const Wn = STUDY.window;
  const bar = 9;
  f.layer(ACROSS, (c, env) => {
    const N = MOODS.winterBlue;
    const L = (x: number, y: number) => {
      const sp = toScreen(STUDY_WALL, cam, x, y);
      return toLayer(ACROSS, cam, sp.x, sp.y);
    };
    c.save();
    c.beginPath();
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 6; j++) {
        const x0 = Wn.x + (Wn.w * i) / 3 + (i > 0 ? bar / 2 : 0), x1 = Wn.x + (Wn.w * (i + 1)) / 3 - (i < 2 ? bar / 2 : 0);
        const y0 = Wn.y + (Wn.h * j) / 6 + (j > 0 ? bar / 2 : 0), y1 = Wn.y + (Wn.h * (j + 1)) / 6 - (j < 5 ? bar / 2 : 0);
        const p0 = L(x0, y0), p1 = L(x1, y1);
        c.rect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
      }
    }
    c.clip();
    c.globalAlpha = moon;
    const u = LIT.u;
    // the facade: a cool dark wall with a cornice, its windows dark glass catching a little moon
    const fa = FACADE.a, fb = FACADE.b;
    c.fillStyle = mixLab(N.set, N.haze, 0.22);
    c.fillRect(fa.x, fa.y, fb.x - fa.x, fb.y - fa.y);
    c.fillStyle = mixLab(N.set, N.ink, 0.5);
    c.fillRect(fa.x - 10 * u, fa.y - 8 * u, fb.x - fa.x + 20 * u, 12 * u);
    c.fillStyle = withAlpha(N.rim, 0.35);
    c.fillRect(fa.x - 10 * u, fa.y - 8.5 * u, fb.x - fa.x + 20 * u, 1.2 * u);
    for (let r = 0; r < 4; r++) {
      for (let q = 0; q < 6; q++) {
        const cx = LIT.x + (q - 2) * 190 * u, cy = LIT.y + (r - 1) * 170 * u;
        if (q === 2 && r === 1) continue;
        c.fillStyle = mixLab(N.set, N.ink, 0.35);
        c.fillRect(cx - 76 * u, cy - 58 * u, 152 * u, 116 * u);
        c.fillStyle = withAlpha(N.sky[1], 0.16 + 0.1 * (hash1(q * 7 + r, 41) * 0.5 + 0.5));
        c.fillRect(cx - 70 * u, cy - 52 * u, 140 * u, 104 * u);
      }
    }
    // the one lit window
    const W2 = 75 * u, H2 = 56 * u;
    c.save();
    c.translate(LIT.x, LIT.y);
    c.fillStyle = mixLab(N.set, N.ink, 0.35);
    c.fillRect(-W2 - 6 * u, -H2 - 6 * u, 2 * W2 + 12 * u, 2 * H2 + 12 * u);
    c.fillStyle = mixLab(N.set, N.ink, 0.6);
    c.fillRect(-W2, -H2, 2 * W2, 2 * H2);
    if (on > 0.003) {
      const warm = env.mood;
      c.globalAlpha = moon * on;
      const g = c.createRadialGradient(36 * u, 14 * u, 4 * u, 36 * u, 14 * u, 150 * u);
      g.addColorStop(0, mixLab(warm.core, '#ffffff', 0.15));
      g.addColorStop(0.35, warm.core);
      g.addColorStop(0.75, warm.halo);
      g.addColorStop(1, mixLab(warm.halo, warm.set, 0.55));
      c.fillStyle = g;
      c.fillRect(-W2, -H2, 2 * W2, 2 * H2);
      const ink = PUPPET_NEAR_BLACK;
      // the desk's top edge and its front, the lamp's pool bright on it
      c.fillStyle = ink;
      c.fillRect(-W2, 24 * u, 2 * W2, H2 - 24 * u);
      c.fillStyle = withAlpha(mixLab(warm.core, '#ffffff', 0.3), 0.85);
      c.beginPath();
      c.ellipse(36 * u, 24 * u, 30 * u, 3.2 * u, 0, 0, Math.PI * 2);
      c.fill();
      // a sheet of paper in the pool
      c.fillStyle = mixLab(warm.core, '#ffffff', 0.5);
      c.beginPath();
      c.moveTo(6 * u, 22.6 * u);
      c.lineTo(30 * u, 21.8 * u);
      c.lineTo(34 * u, 24 * u);
      c.lineTo(9 * u, 24.6 * u);
      c.closePath();
      c.fill();
      // the banker's lamp: foot, stem, and its green shade (seen against the lit wall)
      c.fillStyle = ink;
      c.beginPath();
      c.ellipse(46 * u, 23 * u, 9 * u, 2.4 * u, 0, 0, Math.PI * 2);
      c.fill();
      c.fillRect(45 * u, 2 * u, 2 * u, 21 * u);
      c.fillStyle = mixLab(ink, '#1f4a2c', 0.55);
      c.beginPath();
      c.moveTo(28 * u, 4 * u);
      c.quadraticCurveTo(30 * u, -6 * u, 40 * u, -7 * u);
      c.lineTo(52 * u, -7 * u);
      c.quadraticCurveTo(62 * u, -6 * u, 64 * u, 4 * u);
      c.closePath();
      c.fill();
      c.fillStyle = withAlpha(mixLab(warm.core, '#ffffff', 0.4), 0.9);
      c.fillRect(30 * u, 3.4 * u, 32 * u, 1.4 * u);
      // the sitter at the pool's edge, facing the lamp: back, shoulders, head; on 'suspicious' a lean in, hand to chin
      const hx = -16 * u + 6 * u * lean, hy = -10 * u + 3 * u * lean;
      c.fillStyle = ink;
      c.beginPath();
      c.moveTo(-60 * u, H2);
      c.lineTo(-56 * u, 6 * u);
      c.quadraticCurveTo(-52 * u, -4 * u, hx - 12 * u, hy + 10 * u);
      c.lineTo(hx + 6 * u, hy + 14 * u);
      c.quadraticCurveTo(-4 * u + 4 * u * lean, 16 * u, -10 * u, 24 * u);
      c.lineTo(-14 * u, H2);
      c.closePath();
      c.fill();
      c.beginPath();
      c.ellipse(hx, hy, 8.5 * u, 9.5 * u, 0.2 * lean, 0, Math.PI * 2);
      c.fill();
      // the forearm: on the desk, then up to the chin
      const elbow = { x: -6 * u, y: 23 * u };
      const hand = { x: lerp(8 * u, hx + 5 * u, lean), y: lerp(22 * u, hy + 9 * u, lean) };
      c.strokeStyle = ink;
      c.lineCap = 'round';
      c.lineWidth = 6 * u;
      c.beginPath();
      c.moveTo(hx - 8 * u, hy + 18 * u);
      c.lineTo(elbow.x, elbow.y);
      c.lineTo(hand.x, hand.y);
      c.stroke();
      // the rim of the light on the sitter's lamp-side contour
      c.strokeStyle = withAlpha(mixLab(warm.core, '#ffffff', 0.35), 0.8);
      c.lineWidth = 1.3 * u;
      c.beginPath();
      c.arc(hx, hy, 8.8 * u, -1.2, 0.9);
      c.stroke();
      // the window's own frame: a transom and the sash edges
      c.globalAlpha = moon;
      c.fillStyle = mixLab(N.set, N.ink, 0.5);
      c.fillRect(-W2, -26 * u, 2 * W2, 3 * u);
    }
    c.restore();
    // round-1: winter air between the street and the study glass: a cool haze, thicker low (the street's breath)
    {
      c.save();
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = moon;
      const top = FACADE.a.y - 200 * u, bot = FACADE.b.y;
      const hz = c.createLinearGradient(0, top, 0, bot);
      hz.addColorStop(0, withAlpha(N.haze, 0.16));
      hz.addColorStop(0.5, withAlpha(N.haze, 0.3));
      hz.addColorStop(1, withAlpha(mixLab(N.haze, N.sky[2], 0.4), 0.55));
      c.fillStyle = hz;
      c.fillRect(FACADE.a.x - 400 * u, top, FACADE.b.x - FACADE.a.x + 800 * u, bot - top);
      c.restore();
    }
    // the lit window's spill on the facade and the cold air around it
    if (on > 0.003) {
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = moon * on;
      const g = c.createRadialGradient(LIT.x, LIT.y, 40 * u, LIT.x, LIT.y, 190 * u);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.22));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(LIT.x - 200 * u, LIT.y - 200 * u, 400 * u, 400 * u);
    }
    c.restore();
  });
}

/** the plank's far end: the last belief candles of the shelf (dim, at frame left: their ghost sleeves and stubs at the
 *  canonical lit height) and the new, unlettered candle (no rings scored) with a blank year tag. `reveal` is the
 *  match's flare finding them: before it, the candle is all but invisible (the cursor is the only thing in the dark). */
function candleShelfEnd(c: C, env: PaintEnv, views: CandleView[], reveal: number, warm = 0) {
  // round 3: from 'Somewhere' the warm interior plane stands them up in silhouette; the flare then lights them
  const shape = Math.max(reveal, 0.9 * warm);
  const ink = env.fill('ink');
  const x0 = NEW_X - 480, x1 = NEW_X + 120;
  c.fillStyle = ink;
  c.fillRect(x0 - 400, SY, x1 - x0 + 400, 12);
  const ap = new Path2D();
  ap.moveTo(x0 - 400, SY + 12);
  for (let xx = x0 - 400; xx <= x1; xx += 24) ap.quadraticCurveTo(xx + 12, SY + 22, Math.min(x1, xx + 24), SY + 12);
  ap.lineTo(x1, SY + 12);
  ap.closePath();
  c.fill(ap);
  c.fillStyle = withAlpha(env.mood.rim, 0.4);
  c.fillRect(x0 - 400, SY - 0.6, x1 - x0 + 400, 1.2);
  // the last candles of the shelf (the flare catches them dimly)
  c.save();
  c.globalAlpha *= 0.12 + 0.6 * Math.max(reveal, 0.8 * shape);
  for (const id of LAST3) {
    const v = views.find((q) => q.id === id);
    if (!v) continue;
    beliefCandle(c, { x: candleX(views, id), y: SY, view: v, s: STUDY.shelf.s, letters: 0.35, named: 0, drawFlame: false }, env);
  }
  c.restore();
  const v = views.find((q) => q.id === 'new')!;
  c.save();
  c.globalAlpha *= 0.05 + 0.95 * shape;
  // its brass cup, then the candle (blank: no lettering, no rings)
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(NEW_X - 17, SY);
  c.lineTo(NEW_X - 12, SY - 7);
  c.lineTo(NEW_X + 12, SY - 7);
  c.lineTo(NEW_X + 17, SY);
  c.closePath();
  c.fill();
  beliefCandle(c, { x: NEW_X, y: SY - 7, view: { ...v, tag: '' }, s: STUDY.shelf.s, drawFlame: false, letters: 0 }, env);
  // the blank year tag at its base (the year not yet written), the same cut as every candle's tag
  blankTag(c, NEW_X + 15 * STUDY.shelf.s, SY, STUDY.shelf.s, env);
  c.restore();
}
/** the screen point of the shelf's nearest live candle flame left of the new one (the warm interior plane's source) */
function gapFlame(cam: Camera3): Pt {
  for (const id of [...LAST3].reverse()) {
    const v = V9.find((q) => q.id === id)!;
    if (v.state !== 'live') continue;
    const p = candleFlame({ x: candleX(V9, id), y: SY, view: v, s: STUDY.shelf.s });
    return toScreen(LAYERS.L4, cam, p.x, p.y);
  }
  return toScreen(LAYERS.L4, cam, NEW_X - 260, SY - 280);
}
/** the shelf's last three belief candles before the new one */
const LAST3 = (() => {
  const order = V9.filter((v) => v.id !== 'new').sort((a, b) => a.slot - b.slot);
  return order.slice(-3).map((v) => v.id);
})();
function blankTag(c: C, x: number, y: number, s: number, env: PaintEnv) {
  const tw = 30 * s, th = 12 * s;
  c.save();
  c.translate(x, y - 22 * s);
  c.rotate(0.12);
  c.strokeStyle = withAlpha(env.mood.rim, 0.4);
  c.lineWidth = Math.max(0.6, 0.8 * s);
  c.beginPath();
  c.moveTo(-3 * s, -6 * s);
  c.lineTo(2 * s, 0);
  c.stroke();
  c.fillStyle = mixLab(env.mood.setHaze, env.mood.halo, 0.55);
  c.beginPath();
  c.moveTo(2 * s, 0);
  c.lineTo(2 * s + tw, 0);
  c.lineTo(2 * s + tw, th);
  c.lineTo(2 * s, th);
  c.lineTo(-2 * s, th / 2);
  c.closePath();
  c.fill();
  c.restore();
}
