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
import type { Camera3, Frame, PaintEnv, ShotScene } from '../../../film';
import { CAMERA3_HOME, FONT, LAYERS, MOODS, PUPPET_NEAR_BLACK, defineShot, dustMotes, hash1, mixLab, toLayer, toScreen, vnoise2, withAlpha, wrapLines } from '../../../film';
import { hands } from '../cast';
import { HAND_LEN, type HandsPose } from '../sets/narratorHands';
import { STUDY, STUDY_WALL, candleX, studyCase, studyRoom } from '../sets/study';
import { SLOTS, shelfStateAt, wallStateAt, type CandleView } from '../sets/studyState';
import { WALL_SLOTS, drawSlip, slotLight } from '../sets/wallOfForecasts';
import { beliefCandle, candleFlame } from '../sets/beliefCandle';
import { drawCard, paperTone } from '../sets/caseBoard';
import { frameOn } from '../sets/ch09-s03a-kit';
import { clamp01, lerp, sm, tq12, win } from '../sets/ch13-s01-kit';

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
const CAM_A1 = frameOn({ x: W7C.x - 10, y: W7C.y + 150 }, { x: 640, y: 360 }, 2.9);

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
const CAM_D0 = frameOn({ x: NEW_X + 60, y: SY - 196 }, { x: 640, y: 360 }, 1.42);
const CAM_D1 = frameOn({ x: NEW_X + 40, y: SY - 192 }, { x: 640, y: 360 }, 1.56);
/** where the cursor blinks in the dark: exactly where the new candle's flame will be */
const CURSOR = toScreen(LAYERS.L4, CAM_D0, WICK.x, WICK.y - 8);

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
  /** 'a lamp is on': a far window across the city lights */
  farLamp: number;
  /** 'suspicious': the hand and the matchbox come up from the bottom edge */
  handIn: number;
  /** 'new': the strike */
  strike: number;
  /** 'candles' (+): the wick catches; the flame stands by 'come from' */
  light: number;
  dark: number;
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
      // laid down 0.6 s before b3 so the stamped card reads for ~1.8 s before the click
      lay: T.beat('b3') - 0.6,
      stamp: T.beat('b3') - 0.6 + 0.6,
      off: T.beat('b4'),
      slow: T.word('L1520', 'new'),
      // review round 1: no long black under the last line. The study comes up in moonlight soon after the click,
      // a far window lights on 'a lamp is on', the hand and the matchbox rise on 'suspicious', the match strikes
      // on 'new', the wick catches on 'candles' and the flame stands on 'come from'; then the hold
      // round-1 notes: the hand comes in from 'come', strikes on 'from' (b5), the flare reveals the shelf's end, the wick
      // catches on b6 (on the twos), then the match is shaken out
      farLamp: T.word('L1520', 'lamp') - 0.1,
      handIn: T.word('L1520', 'come') - 0.3,
      strike: T.beat('b5'),
      light: T.beat('b6'),
      dark: T.beat('b4') + 0.85,
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
  // a push in on W7 from the first frame (settling as the slip unpins), then a tilt down after the falling slip
  const p0 = sm(clamp01(t / (b.word + 0.3)));
  const u = sm(win(t, b.word + 0.5, b.cut));
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
      const y = W7C.y + tug - 9 * lift + 520 * e;
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
  c.strokeStyle = withAlpha(brass, 0.55);
  c.lineWidth = 2.4;
  c.beginPath();
  c.arc(1150, 80, 68, Math.PI * 0.5, Math.PI * 1.25);
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
  // a breath of drift while held (the hand is steady; the paper is not quite)
  const hold = { x: HOLD.x, y: HOLD.y + 1.5 * Math.sin(tq * 1.1), s: 1, rot: -0.025 + 0.004 * Math.sin(tq * 0.8) };
  const l = sm((tq - b.lay) / 0.45);
  return { x: lerp(hold.x, LAID.x, l), y: lerp(hold.y, LAID.y, l), s: lerp(1, LAID.s, l), rot: lerp(hold.rot, LAID.rot, l) };
}

function paintDesk(f: Frame, t: number, b: B) {
  const tq = tq12(t);
  const du = sm((t - b.cut) / (b.off - b.cut));
  f.camera({ ...CAMERA3_HOME, x: 640 - 16 * du, y: 360 + 8 * du, z: 34 * du });
  f.setMood('candleAmber');
  // the lamp: on, then the click (on the twos): a dip, a flash of filament, out
  const dt = tq - Math.floor(b.off * 12) / 12;
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
    if (hp) hands.draw(c, hp, env);
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
function cursor(f: Frame, t: number, b: B) {
  const t0 = b.off + 0.35;
  if (t < t0) return;
  const ph = blinkPhase(t, t0, b.slow);
  const on = ph % 1 < 0.5;
  const fadeIn = win(t, t0, t0 + 0.2) * (1 - win(t, b.strike - 0.05, b.strike + 0.2));
  if (fadeIn <= 0.003) return;
  const c = f.c;
  const cool = mixLab(MOODS.serverCyan.core, '#f2f5f6', 0.45);
  const x = CURSOR.x - 70, y = CURSOR.y;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const halo = c.createRadialGradient(x, y, 0, x, y, 26);
  halo.addColorStop(0, withAlpha(MOODS.serverCyan.halo, (on ? 0.28 : 0.04) * fadeIn));
  halo.addColorStop(1, withAlpha(MOODS.serverCyan.halo, 0));
  c.fillStyle = halo;
  c.fillRect(x - 30, y - 30, 60, 60);
  c.restore();
  c.save();
  // the chat box's underline: a faint cool rule, the cursor at its left end
  c.globalAlpha = 0.16 * fadeIn;
  c.fillStyle = cool;
  c.fillRect(x - 10, y + 14, 260, 1);
  if (on) {
    c.globalAlpha = 0.95 * fadeIn;
    c.fillRect(x - 1, y - 4.7, 2, 9.4);
  }
  c.restore();
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
  const candleK = dc < 0 ? 0 : dc < 1 / 12 ? 0.35 : dc < 2 / 12 ? 0.25 : Math.min(1, 0.55 + (dc - 2 / 12) * 1.6);
  const light = Math.max(matchK * 0.85, candleK);
  // the candle and the shelf's end exist for the eye only once the flare finds them
  const reveal = sm(win(t, b.strike - 0.02, b.strike + 0.3));
  studyRoom(f, { key: `${ID}/end`, cams: [CAM_D0, CAM_D1], outside: { mood: 'winterBlue', kind: 'night' }, lamp: 0, fog: 0.35 });
  f.layer('L4', (c, env) => {
    // the shelf's far end: the plank and the new candle only (the lamp is off; the room is dark)
    const views = V9.map((v) => (v.id === 'new' ? (candleK > 0 ? NEW_LIT : NEW0) : v));
    candleShelfEnd(c, env, views, reveal);
    if (hp) {
      c.save();
      c.translate(shakeX, 0);
      hands.draw(c, hp, env);
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
  const moon = sm((t - b.dark) / 1.8);
  const vis = 0.02 + 0.13 * moon + 0.5 * light;
  c.save();
  c.fillStyle = `rgba(3,2,1,${(1 - vis).toFixed(3)})`;
  c.fillRect(-20, -20, 1320, 760);
  // the study window: the night outside reads as the room's brightest value until the flame takes over
  const Wn = STUDY.window;
  const a0 = toScreen(STUDY_WALL, cam, Wn.x - 18, Wn.y - 18), a1 = toScreen(STUDY_WALL, cam, Wn.x + Wn.w + 18, Wn.y + Wn.h + 24);
  const wv = 0.01 + 0.5 * moon + 0.2 * light;
  c.fillStyle = `rgba(3,2,1,${(1 - Math.min(1, wv / vis)).toFixed(3)})`;
  c.filter = 'blur(6px)';
  c.fillRect(a0.x, a0.y, a1.x - a0.x, a1.y - a0.y);
  c.restore();
  farLamp(f, cam, t, b, moon);
  cursor(f, t, b);
  if (fl && matchK > 0.01) f.practical({ x: fl.x, y: fl.y, kind: 'candle', seed: 2026, intensity: 0.9 * matchK, radius: 52 });
  if (candleK > 0.01) {
    const sway = 1.2 * vnoise2(t * 2.1, 7.7);
    // the halo blooms a little as the flame settles
    const bloom = sm((t - b.light - 0.3) / 1.4);
    f.practical({ x: WICK.x + sway, y: WICK.y - 4, kind: 'candle', seed: 2027, intensity: (0.95 + 0.15 * bloom) * candleK, radius: 56 + 26 * bloom });
  }
  // the final hold's depth: a faint haze band across the sill and a soft curtain edge on the near plane (L5)
  if (light > 0.01) {
    f.fog({ yCenter: toScreen(LAYERS.L4, cam, 0, SY - 120).y, height: 170, alpha: 0.1 * light, drift: 5 });
    f.layer('L5', (c, env) => {
      c.save();
      c.globalAlpha = Math.min(1, light * 1.2);
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
/** the near curtain's edge (L5 world), at the frame's left edge in the shelf camera */
const DRAPE = toLayer(LAYERS.L5, CAM_D0, 40, 0);

/** the match hand, timed to the words: in from the bottom edge (right of the candle) from 'come', the box and the
 *  strike on 'from' (b5), a flare; the box hand goes; the match is carried to the wick FROM THE SIDE (the fist stays
 *  right of the candle, the match's tip meets the wick); the wick catches on b6; the match is shaken out and the hand
 *  withdraws. The match arm is solved so its flame lands exactly on its mark. */
function matchHands(tq: number, b: B, cam: Camera3) {
  const scale = 1.35;
  const len = HAND_LEN * scale;
  const entry = { R: toLayer(LAYERS.L4, cam, 1060, 880), L: toLayer(LAYERS.L4, cam, 760, 960) };
  const strikeAt = { x: WICK.x + 170, y: WICK.y + 200 };
  const shakeAt = b.light + 0.5;
  const none = { hp: null as HandsPose | null, fl: null as Pt | null, matchK: 0, out: false, tip: null as Pt | null, shakeX: 0, shakeAt };
  // the strike itself: the kit's strikeLight from 0 to its flare (.42), mapped onto 'come' → 'from'
  const sk: [number, number][] = [[b.handIn, 0], [b.strike, 0.36], [b.strike + 0.25, 0.42]];
  if (tq <= sk[0][0] || tq > shakeAt + 1.4) return none;
  let U = 0.42;
  for (let i = 0; i < sk.length - 1; i++) {
    if (tq <= sk[i + 1][0]) {
      U = lerp(sk[i][1], sk[i + 1][1], (tq - sk[i][0]) / (sk[i + 1][0] - sk[i][0]));
      break;
    }
  }
  const base = hands.act('strikeLight', U, { x: WICK.x, y: WICK.y }, { scale, entry, strikeAt });
  const boxGo = sm(clamp01((tq - (b.strike + 0.25)) / 0.6));
  const left = tq <= b.strike + 0.25 ? base.left : boxGo < 1 ? hands.act('strikeLight', 0.42 + 0.2 * boxGo, { x: WICK.x, y: WICK.y }, { scale, entry, strikeAt }).left : undefined;
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
  if (tq > b.strike + 0.25) {
    const carry = sm(clamp01((tq - (b.strike + 0.3)) / (b.light - 0.25 - (b.strike + 0.3))));
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

/** 'Somewhere tonight a lamp is on': across the city, one far window lights warm (on the twos: a flicker, then on)
 *  and stays on. Drawn in screen space after the darkness pass, at a fixed point of the far (L1) plane. */
const FAR_LAMP = toLayer(LAYERS.L1, CAM_D0, 1118, 604); // low in the skyline, in a building across the street
function farLamp(f: Frame, cam: Camera3, t: number, b: B, moon: number) {
  const dt = tq12(t) - b.farLamp;
  if (dt < 0 || moon <= 0.01) return;
  const on = (dt < 1 / 12 ? 0.6 : dt < 2 / 12 ? 0.15 : Math.min(1, 0.7 + dt * 1.5)) * moon;
  const p = toScreen(LAYERS.L1, cam, FAR_LAMP.x, FAR_LAMP.y);
  const c = f.c;
  const m = f.mood;
  const warm = mixLab(m.core, m.halo, 0.35);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 20);
  g.addColorStop(0, withAlpha(warm, 0.2 * on));
  g.addColorStop(1, withAlpha(warm, 0));
  c.fillStyle = g;
  c.fillRect(p.x - 30, p.y - 30, 60, 60);
  c.restore();
  c.save();
  c.globalAlpha = 0.9 * on;
  c.fillStyle = warm;
  c.fillRect(p.x - 4, p.y - 6, 8, 12);
  // its glazing cross: a lit room in someone else's building
  c.fillStyle = withAlpha(m.ink, 0.7);
  c.fillRect(p.x - 4, p.y - 0.6, 8, 1.2);
  c.fillRect(p.x - 0.6, p.y - 6, 1.2, 12);
  c.restore();
}

/** the plank's far end: the last belief candles of the shelf (dim, at frame left: their ghost sleeves and stubs at the
 *  canonical lit height) and the new, unlettered candle (no rings scored) with a blank year tag. `reveal` is the
 *  match's flare finding them: before it, the candle is all but invisible (the cursor is the only thing in the dark). */
function candleShelfEnd(c: C, env: PaintEnv, views: CandleView[], reveal: number) {
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
  c.globalAlpha *= 0.12 + 0.6 * reveal;
  for (const id of LAST3) {
    const v = views.find((q) => q.id === id);
    if (!v) continue;
    beliefCandle(c, { x: candleX(views, id), y: SY, view: v, s: STUDY.shelf.s, letters: 0.35, named: 0 }, env);
  }
  c.restore();
  const v = views.find((q) => q.id === 'new')!;
  c.save();
  c.globalAlpha *= 0.05 + 0.95 * reveal;
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
