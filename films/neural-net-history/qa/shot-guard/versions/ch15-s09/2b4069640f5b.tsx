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
 *   b3 - 1.35  wordless: the hands lay the slip on WHO TAUGHT IT? and withdraw
 *   ~12.3      (review round 4) in the silence after L1518 one hand comes up from the bottom edge and pins a small typed
 *              verdict slip under the card's question (LEARNING + ACCOMPLICES · NEVER ONE PERSON), so the film's answer
 *              stands; the case file (ch01-s04's manila folder, ch15-s08's file) lies under the card, its long tab at
 *              upper right
 *   b3         the stamp comes in from the right and strikes STATUS: OPEN on the FOLDER'S FACE, centred under its
 *              CASE FILE title (not the question card): the investigation stays open, the answer stands; full red ink
 *              at ch15-s08's size, tilted -2.5 deg, struck at full opacity on the b3 frame, read ~2.5 s to the click
 *   b4         the desk lamp clicks off (on the twos); in the black only ch01-s01's chat-box cursor (a cool bar on a
 *              steady blink over a faint chat-box underline)
 *   'Somewhere' (round 3) the room rises: a warm interior plane at left (the shelf's live candles warming the back
 *              wall; the shelf, the unlit new candle and the desk's near edge in silhouette, ~15% luma) and the
 *              moonlit window at right, both full by 'lamp'
 *   'lamp'     across the street, one window's desk lamp is already ON at full when the word lands
 *   'suspicious' the hand and the matchbox come up from the bottom edge, right of the candle
 *   'new'      the scratch (foley fx-match-strike); the head ignites at the end of the stroke; the cursor goes out
 *   'candles'  the match's flame touches the wick and it catches (foley fx-match-flare); settled by 'come from'
 *   then       the match is shaken out as it leaves the wick and the hand is gone off the bottom edge by ~22.7 s, so
 *              the lit candle holds clean for 2.5 s before the fadeBlack (25.24)
 *   hold       the single new flame (its halo blooming as it settles), a haze band, a near curtain edge; a slow 3.5% push
 *              ends framed on the new flame, the window veils down and the old 2025 candle's halo steps back to ~60%
 * SYNC (round-3 shots r1, recorded in the ledger): the match is deliberately anchored to the FOLEY (score/foley.json:
 * fx-match-strike on 'new', fx-match-flare on 'candles'), ~0.9 s ahead of the script's b5 ('from') / b6 (end + 1.2),
 * so the picture and its own sound agree and 'come from' plays over a flame that has already caught.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv, ShotScene } from '../../../film';
import { CAMERA3_HOME, FONT, LAYERS, MOODS, PUPPET_NEAR_BLACK, cardProbe, defineShot, dustMotes, ghostOk, hash1, legibleSize, mixLab, textRole, toLayer, toScreen, vnoise2, withAlpha, wrapLines } from '../../../film';
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
import { drapery } from '../sets/occluders';
import { drawMatchbox, drawPaperArm, pinchFlame, solveGrip, solvePinch, type PaperArm } from '../sets/ch15-s09-paperHand';

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
/** the opening's near plane: in front of the Wall but behind the push-in camera (L5 at z 650 is behind the lens at W7's
 *  framing) */
const NEAR_A: LayerSpec = { id: 'nearW7', z: 880, haze: 0, blur: 3 };
const CAM_A1 = frameOn({ x: W7C.x - 30, y: W7C.y + 4 + TRACK_Y }, { x: 640, y: 340 }, 2.9);

// ------------------------------------------------------------------------------------------------ the desk (B, top-down)
const SLIP = { w: 620, h: 284 };
const HOLD: Pt = { x: 560, y: 236 };
const K_DESK = { x: 712, y: 506, k: 2.3, rot: 0.05 };
const LAID = { x: 540, y: 330, s: 0.6, rot: -0.07 };
const QUOTE = 'The future depends on some graduate student who is deeply suspicious of everything I have said.';
const ATTR = '— Geoffrey Hinton, 2017, as quoted by Gary Marcus';
/** review round 4: the verdict, typed on a small slip pinned under the case card's question (L1527's answer, so the
 *  STATUS: OPEN stamp does not read as the film taking it back); set on two lines at the ' · ' */
const VERDICT = 'LEARNING + ACCOMPLICES · NEVER ONE PERSON';
const VERDICT_AT = { x: 716, y: 607, w: 330, h: 66, rot: 0.03 };
/** the pin through the slip's top edge (where the pinching hand lets go) */
const VERDICT_PIN: Pt = { x: VERDICT_AT.x + 0.03 * 27, y: VERDICT_AT.y - 27 };
/** the case file under the card (ch01-s04's manila folder, ch15-s08's file), closed, its long label tab at upper right,
 *  clear of the lamp's foot; STATUS: OPEN is struck across the tab (folder-local units, centred, rotated) */
const FOLDER = { x: 900, y: 360, w: 360, h: 404, rot: 0.06, tab: { dx: 20, w: 292, h: 62 } };
/** round-4 r1 (critic): the file's title set on the folder's FACE (not the texture-sized tab label) at the legibility
 *  floor, and the stamp struck just below it on the face, so the frame reads 'CASE FILE' over 'STATUS: OPEN'
 *  (folder-local; the face's visible band runs between the laid Hinton slip at left and the question card below) */
const FACE_TITLE = { x: 8, y: -146 };
// review round 5: the stamp sits wholly on the folder's FACE, centred under 'CASE FILE' (the title's centre, x 8), its box
// 41 px clear of the face's right edge and 57 px of its left; tilted -2.5 deg on SCREEN (the folder itself lies at
// +3.4 deg), struck at ch15-s08's size and red
const STAMP_ON_FACE = { x: FACE_TITLE.x, y: -96, rot: -0.044 - 0.06 };
const folderToWorld = (lx: number, ly: number): Pt => ({
  x: FOLDER.x + lx * Math.cos(FOLDER.rot) - ly * Math.sin(FOLDER.rot),
  y: FOLDER.y + lx * Math.sin(FOLDER.rot) + ly * Math.cos(FOLDER.rot),
});

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
/** round-3 shots r1: from the moment the wick catches, a slow 3.5% push that ends framed on the NEW flame (the window
 *  slides out to the right edge and recedes), so the last image centres the new candle */
const CAM_D2 = frameOn({ x: NEW_X, y: SY - 206 }, { x: 640, y: 360 }, 1.6 * 1.035);

interface B {
  D: number;
  word: number;
  cut: number;
  catchAt: number;
  end18: number;
  lay: number;
  /** review round 4: the verdict slip's hand comes up (placed ~0.45 s later, in the silence after L1518) */
  pin: number;
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
      // review round 4: the verdict slip is pinned in the silence after L1518 (placed at end + 0.15), then the stamp
      // (a quicker 0.8 s gesture) still strikes ON b3, where fx-stamp sounds
      pin: end18 - 0.3,
      // (the hands move on the twos: the strike is the twos-frame that holds b3, so the red is down when fx-stamp sounds)
      stamp: Math.floor(T.beat('b3') * 12 + 1e-6) / 12 - STAMP_DUR / 2,
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
      // round-3 shots r1: the cursor is alone through the start of 'Somewhere'; the warm plane rises from just before
      // the word, eased in (below 10% for its first 0.3 s), and is up by 'tonight'
      warm: T.word('L1520', 'Somewhere') - 0.1,
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
  // round-3 shots r1: the lamp's pool is on W7 (Hinton's slip ~1.3x its neighbours, the neighbours down 15%), so the
  // eye finds it before 'word'
  const NEIGHBOURS = 0.85;
  const W7_LIGHT = Math.min(1, 1.3 * slotLight('W4', NEIGHBOURS));
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    board: false,
    shelf: false,
    xray: false,
    flames: false,
    wall: { slips, hide: ['W7'], light: NEIGHBOURS },
    extra: (c, env) => {
      const light = W7_LIGHT;
      // the pool of the lamp on W7's patch of wall
      {
        const R = 170 * WK;
        c.save();
        c.globalCompositeOperation = 'lighter';
        const pg = c.createRadialGradient(W7C.x, W7C.y, 8 * WK, W7C.x, W7C.y, R);
        pg.addColorStop(0, withAlpha(env.mood.halo, 0.2));
        pg.addColorStop(0.5, withAlpha(env.mood.halo, 0.08));
        pg.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = pg;
        c.fillRect(W7C.x - R, W7C.y - R, 2 * R, 2 * R);
        c.restore();
      }
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
      const rot = wob + 0.22 * Math.sin(fall * 2.6) * fall;
      drawSlip(c, W7_SLIP, { x, y, k, light: Math.min(1, light + 0.3 * e), rot, pin: tq < b.word + 0.25 }, env);
      c.save();
      c.translate(x, y);
      c.rotate(rot);
      cardProbe(c, `${ID}/wallSlip`, (-W7.w / 2) * k, (-W7.h / 2) * k, W7.w * k, W7.h * k, 1, 1);
      c.restore();
    },
  });
  // round-3 shots r1: the blue window sliver at the right edge was the brightest thing in frame: down ~40%
  {
    const Wn = STUDY.window;
    const a0 = toScreen(STUDY_WALL, cam, Wn.x - 18, Wn.y - 18), a1 = toScreen(STUDY_WALL, cam, Wn.x + Wn.w + 18, Wn.y + Wn.h + 24);
    if (a0.x < 1300) {
      const c = f.c;
      c.save();
      c.filter = 'blur(4px)';
      c.fillStyle = 'rgba(6,4,3,0.42)';
      c.fillRect(a0.x, a0.y, a1.x - a0.x, a1.y - a0.y);
      c.restore();
    }
  }
  // continuity (round-3 shots r1): coming from ch15-s08's wide lantern board, a near drape edge at frame left (L5,
  // soft) gives the first 1.5 s a depth cue; the push in slides it off the frame
  const nearA = 1 - win(t, 1.0, 1.6);
  if (nearA > 0.003) {
    f.layer(NEAR_A, (c, env) => {
      const p0 = toLayer(NEAR_A, CAM_A0, 0, 0), p1 = toLayer(NEAR_A, CAM_A0, 1, 0);
      const uu = p1.x - p0.x;
      const top = toLayer(NEAR_A, CAM_A0, 0, -120).y, bottom = toLayer(NEAR_A, CAM_A0, 0, 860).y;
      c.save();
      c.globalAlpha *= nearA;
      drapery(c, { x: toLayer(NEAR_A, CAM_A0, -12, 0).x, top, bottom, w: 96 * uu, side: 'left', folds: 5, seed: 15 }, env);
      c.restore();
    });
  }
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
  // indented clear of the holding thumb on the lower-left corner (round-3 shots r1)
  c.fillText(ATTR, -w / 2 + 52, h / 2 - 24);
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
  // round-4 r1 (critic, safe area): as the Hinton slip is laid down, a slow tilt that lifts the desk ~40 px, so the
  // verdict slip pinned at ~12.3 s sits with its second line above the bottom 12 % (baseline <= 628)
  const lift = 40 * sm((t - (b.pin - 0.75)) / 1.15);
  f.camera({ ...CAMERA3_HOME, x: 640 - 16 * du - 18 * push, y: 360 + 8 * du - 16 * push + lift, z: 34 * du + 29 * push });
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
  const pads: { at: Pt; ang: number; k: number }[] = [];
  const hold0 = slipPose(b.catchAt, b);
  const corner = (p: typeof sp, side: 1 | -1): Pt => {
    // round-3 shots r1: the grip points sit right on the slip's lower corners (~40 px further out than before), clear
    // of the attribution line
    const lx = side * (SLIP.w / 2 - 2), ly = SLIP.h / 2 - 6;
    return { x: p.x + (lx * Math.cos(p.rot) - ly * Math.sin(p.rot)) * p.s, y: p.y + (lx * Math.sin(p.rot) + ly * Math.cos(p.rot)) * p.s };
  };
  const reachIn = sm((tq - 3.85) / 0.55);
  const release = b.lay + 0.45;
  const caught = tq >= b.catchAt;
  if (tq < release + 0.35 && reachIn > 0) {
    const out = sm((tq - release) / 0.35);
    const arm = (E: Pt, side: 1 | -1) => {
      // before the catch the hand waits a little below where the corner will arrive; after it, it holds the corner:
      // (round-3 shots r1) a relaxed hand (thumb along the index) whose fingers slide in UNDER the paper (the slip is painted over them) with only
      // the thumb's pad over the corner, so it reads as holding, not pointing
      const wait = corner(hold0, side);
      const waitAt = { x: wait.x + side * 10, y: wait.y + 26 };
      const edge = corner(sp, side);
      const dl = Math.hypot(edge.x - E.x, edge.y - E.y) || 1;
      const dir = { x: (edge.x - E.x) / dl, y: (edge.y - E.y) / dl };
      const under = { x: edge.x + dir.x * 48, y: edge.y + dir.y * 48 };
      const close = caught ? sm((tq - b.catchAt) / 0.17) : 0;
      const tgt = { x: lerp(waitAt.x, under.x, close), y: lerp(waitAt.y, under.y, close) };
      const from = { x: E.x - side * 60, y: E.y - 90 };
      const at = { x: lerp(lerp(from.x, tgt.x, reachIn), from.x, out), y: lerp(lerp(from.y, tgt.y, reachIn), from.y + 60, out) };
      if (caught && tq < release) pads.push({ at: { x: edge.x + dir.x * 7 * close, y: edge.y + dir.y * 7 * close }, ang: Math.atan2(dir.y, dir.x), k: close });
      return hands.reach(E, at, caught && tq < release ? 'rest' : 'open', len, { bend: side * 0.1 });
    };
    hp = { right: arm(ER, 1), left: arm(EL, -1), scale: 1.75 };
  }
  const su = (tq - b.stamp) / STAMP_DUR;
  // review round 4 (r1: on the folder's face, under CASE FILE): the grip sits ~36 px above-left of the stamp face's centre
  const face = folderToWorld(STAMP_ON_FACE.x, STAMP_ON_FACE.y);
  const stampTarget = { x: face.x - 10, y: face.y - 36 };
  // round-3 shots r1: the stamp arm comes in from the lower right at ~20 degrees (not flat from the right edge)
  const STAMP_ENTRY = { x: stampTarget.x + 1000 * Math.cos(0.35), y: stampTarget.y + 1000 * Math.sin(0.35) };
  if (su >= 0 && su < 1) hp = hands.act('stamp', su, stampTarget, { scale: 1.75, entry: { R: STAMP_ENTRY } });
  const stamped = su >= 0.5 ? 1 : 0;
  // review round 4: one hand comes straight up from the bottom edge with the verdict slip, pins it under the question
  // (placed at u .45) and withdraws, clear of the Hinton slip's hands (out by then) and of the stamp arm (upper right)
  const pu = (tq - b.pin) / PIN_DUR;
  const pinHp = pu >= 0 && pu < 1 ? hands.act('pin', pu, VERDICT_PIN, { scale: 1.75, entry: { R: PIN_ENTRY }, held: 'none' }) : null;
  f.layer('L4', (c, env) => {
    f.cached(`${ID}/desk/${env.mood.id}`, 1680, 1120, (cc) => {
      cc.translate(200, 200);
      desk(cc, env);
    })(c, -200, -200);
    // the case file under the card (round 4)
    caseFolder(c, env);
    // WHO TAUGHT IT? where it dropped: face up in the pool; then the stamp
    drawCard(c, SLOTS.K, { x: K_DESK.x, y: K_DESK.y, k: K_DESK.k, light: 0.9, rot: K_DESK.rot, pin: false }, env);
    c.save();
    c.translate(K_DESK.x, K_DESK.y);
    c.rotate(K_DESK.rot);
    cardProbe(c, `${ID}/caseCard`, (-SLOTS.K.w * K_DESK.k) / 2, (-SLOTS.K.h * K_DESK.k) / 2, SLOTS.K.w * K_DESK.k, SLOTS.K.h * K_DESK.k, lamp, lamp);
    c.restore();
    // the verdict slip, once pinned under the question; then STATUS: OPEN on the folder's tab
    const vu = (tq - b.pin) / PIN_DUR;
    if (vu >= 0.45) verdictSlip(c, env, VERDICT_AT, VERDICT_AT.rot, true, lamp);
    if (stamped) statusOpen(c, env, tq - (b.stamp + STAMP_DUR * 0.5));
    // round-3 shots r1: while the hands hold the slip, its paper lies OVER their fingers and only a short thumb pad
    // comes over each corner (a hold, not a pointing finger)
    const holding = tq < release;
    const cuffTone = mixLab(env.mood.halo, PUPPET_NEAR_BLACK, 0.5);
    if (hp && holding) drawHands(c, hp, env, { dx: 0.9, dy: -0.9 }, cuffTone);
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
    cardProbe(c, `${ID}/slip`, -SLIP.w / 2, -SLIP.h / 2, SLIP.w, SLIP.h, lamp, lamp);
    c.restore();
    if (hp && holding) for (const pd of pads) if (pd.k > 0.05) thumbPad(c, pd.at, pd.ang, env);
    if (hp && !holding) drawHands(c, hp, env, { dx: 0.9, dy: -0.9 }, cuffTone);
    if (pinHp) {
      // carried by its top edge in the pinch until it is placed, turning true as it comes down
      if (pu < 0.45) {
        const so = hands.socket(pinHp) ?? VERDICT_PIN;
        const k = clamp01(pu / 0.45);
        verdictSlip(c, env, { x: so.x + VERDICT_AT.x - VERDICT_PIN.x, y: so.y + VERDICT_AT.y - VERDICT_PIN.y }, VERDICT_AT.rot - 0.08 * (1 - k), false, lamp);
      }
      drawHands(c, pinHp, env, { dx: 0.9, dy: -0.9 }, cuffTone);
    }
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
/** the thumb's pad over a held corner of the slip (the fingers are under the paper): a short rounded tip along the
 *  arm, its nail edge catching the lamp */
function thumbPad(c: C, at: Pt, ang: number, env: PaintEnv) {
  c.save();
  c.translate(at.x, at.y);
  c.rotate(ang);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.ellipse(-6, 0, 19, 12.5, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.6);
  c.lineWidth = 1.4;
  c.beginPath();
  c.ellipse(-6, 0, 19, 12.5, 0, Math.PI * 1.15, Math.PI * 1.8);
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.3);
  c.lineWidth = 1;
  c.beginPath();
  c.ellipse(3, 0, 7, 6.5, 0, -Math.PI * 0.45, Math.PI * 0.45);
  c.stroke();
  c.restore();
}

const STAMP_DUR = 0.8;
/** ch15-s08's stamp red (its STAMP.red) */
const STAMP_RED = '#b3261e';
const PIN_DUR = 1.0;
/** the verdict hand's entry: the bottom edge, just right of centre (straight up to the card) */
const PIN_ENTRY: Pt = { x: 760, y: 1060 };

/** the manila case file lying closed under the card (ch01-s04's tones: the manila about L* 45-50 under the pool, a step
 *  under the slips' paper, so the slip and the card stay the brightest things): the back panel with its long label tab
 *  (typed CASE FILE at ~50 % ink, texture), the front cover over it, a fold line, and the pool's falloff across it */
function caseFolder(c: C, env: PaintEnv) {
  const m = env.mood;
  const { w, h, tab } = FOLDER;
  const manila = mixLab(m.halo, '#b08a52', 0.35);
  const back = mixLab(manila, m.set, 0.55);
  const front = mixLab(manila, m.set, 0.45);
  c.save();
  c.translate(FOLDER.x, FOLDER.y);
  c.rotate(FOLDER.rot);
  const outline = folderPath();
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.save();
  c.translate(7, 10);
  c.fill(outline);
  c.restore();
  c.fillStyle = back;
  c.fill(outline);
  // the front cover: the whole panel but the tab, its top edge a hair below the back's
  c.fillStyle = front;
  c.fillRect(-w / 2, -h / 2 + 4, w, h - 4);
  c.fillStyle = withAlpha(m.rim, 0.22);
  c.fillRect(-w / 2, -h / 2 + 4, w, 1.2);
  // the fold along the bottom edge
  c.fillStyle = withAlpha(m.fg, 0.25);
  c.fillRect(-w / 2, h / 2 - 9, w, 1.4);
  // a ruled line across the front cover's top
  c.fillStyle = withAlpha(mixLab(m.ink, front, 0.1), 0.35);
  c.fillRect(-w / 2 + 22, -h / 2 + 34, w - 44, 0.8);
  // the lamp's pool falls off across it (the desk's own falloff is baked under it)
  c.clip(outline);
  const pc = { x: 600 - FOLDER.x, y: 380 - FOLDER.y };
  const g = c.createRadialGradient(pc.x, pc.y, 200, pc.x, pc.y, 760);
  g.addColorStop(0, withAlpha(m.fg, 0));
  g.addColorStop(0.6, withAlpha(m.fg, 0.3));
  g.addColorStop(1, withAlpha(m.fg, 0.7));
  c.fillStyle = g;
  c.fillRect(-w / 2 - 10, -h / 2 - tab.h - 10, w + 20, h + tab.h + 20);
  // the tab's blank paper label, where the stamp will fall (a step under the card's paper)
  const lw = tab.w - 16, lh = tab.h - 14;
  c.fillStyle = withAlpha(m.fg, 0.3);
  c.fillRect(tab.dx - lw / 2 + 1.5, -h / 2 - tab.h / 2 - lh / 2 + 2, lw, lh);
  const label = paperTone(env, 0.5);
  c.fillStyle = label;
  c.fillRect(tab.dx - lw / 2, -h / 2 - tab.h / 2 - lh / 2, lw, lh);
  // round-4 r1: the file's title, typed large on the face (read: CASE FILE over the stamp that will fall under it)
  textRole(c, 'subject', () => {
    const fs = legibleSize(c, `400 30px ${FONT.typewriter}`, 30, 'CASE FILE');
    c.fillStyle = withAlpha(mixLab(m.ink, front, 0.08), 0.88);
    c.font = `400 ${fs}px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.letterSpacing = `${(0.12 * fs).toFixed(1)}px`;
    c.fillText('CASE FILE', FACE_TITLE.x + 0.06 * fs, FACE_TITLE.y);
    c.letterSpacing = '0px';
    c.fillStyle = withAlpha(mixLab(m.ink, front, 0.1), 0.5);
    c.fillRect(FACE_TITLE.x - 100, FACE_TITLE.y + 9, 200, 1.2);
  });
  // the file's typed title on its label (texture at ~45 % ink)
  textRole(c, 'texture', () => {
    c.fillStyle = withAlpha(mixLab(m.ink, label, 0.1), 0.36);
    c.font = `400 12px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('CASE FILE · WHO TAUGHT IT?', tab.dx, -h / 2 - tab.h / 2 + 1);
  });
  c.restore();
}
/** the folder's outline (back panel + its tab with rounded top corners), folder-local */
function folderPath(): Path2D {
  const { w, h, tab } = FOLDER;
  const p = new Path2D();
  const tl = tab.dx - tab.w / 2, tr = tab.dx + tab.w / 2, top = -h / 2 - tab.h, r = 8;
  p.moveTo(-w / 2, -h / 2);
  p.lineTo(tl - 10, -h / 2);
  p.quadraticCurveTo(tl, -h / 2, tl + 2, -h / 2 - 10);
  p.lineTo(tl + 4, top + r);
  p.quadraticCurveTo(tl + 5, top, tl + r + 6, top);
  p.lineTo(tr - r - 6, top);
  p.quadraticCurveTo(tr - 5, top, tr - 4, top + r);
  p.lineTo(tr - 2, -h / 2 - 10);
  p.quadraticCurveTo(tr, -h / 2, tr + 10, -h / 2);
  p.lineTo(w / 2, -h / 2);
  p.lineTo(w / 2, h / 2);
  p.lineTo(-w / 2, h / 2);
  p.closePath();
  return p;
}

/** the verdict slip (round 4): a small typed slip under the case card's question, two lines at the legibility floor,
 *  a brass pin through its top edge once placed */
function verdictSlip(c: C, env: PaintEnv, at: Pt, rot: number, pinned: boolean, lamp: number) {
  const m = env.mood;
  const { w, h } = VERDICT_AT;
  const paper = paperTone(env, 0.92);
  c.save();
  c.translate(at.x, at.y);
  c.rotate(rot);
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(-w / 2 + 4, -h / 2 + 6, w, h);
  c.fillStyle = paper;
  c.fillRect(-w / 2, -h / 2, w, h);
  cardProbe(c, `${ID}/verdictSlip`, -w / 2, -h / 2, w, h, lamp, lamp);
  // its typing sits under the card's question on purpose (a slip pinned on a card)
  ghostOk(c, () =>
    textRole(c, 'subject', () => {
      const [l1, l2] = VERDICT.split(' · ');
      const fs = legibleSize(c, `400 21px ${FONT.typewriter}`, 21, l1);
      c.fillStyle = mixLab(m.ink, paper, 0.08);
      c.font = `400 ${fs}px ${FONT.typewriter}`;
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.fillText(l1, 0, 1);
      c.fillText(l2, 0, 1 + fs * 1.16);
    }),
  );
  if (pinned) {
    const py = -h / 2 + 6;
    c.fillStyle = withAlpha(m.fg, 0.45);
    c.beginPath();
    c.arc(2, py + 3, 5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = mixLab(m.halo, m.set, 0.3);
    c.beginPath();
    c.arc(0, py, 5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(m.core, 0.55);
    c.beginPath();
    c.arc(-1.4, py - 1.4, 1.8, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** STATUS: OPEN, struck in red ink on the case file's FACE under its CASE FILE title (review round 4: the investigation
 *  stays open; the question card and its verdict are not stamped; review round 5: wholly on the face, full ink). The
 *  film's one full red. For a moment after the stamp lifts the ink sits wet and a shade darker. Size and red are
 *  ch15-s08's (its stamp is this one seen through a 1.25x push). */
function statusOpen(c: C, env: PaintEnv, dt: number) {
  const bw = 258, bh = 54;
  const wet = Math.max(0, 1 - dt / 0.6);
  c.save();
  c.translate(FOLDER.x, FOLDER.y);
  c.rotate(FOLDER.rot);
  c.clip(folderPath());
  c.translate(STAMP_ON_FACE.x, STAMP_ON_FACE.y);
  c.rotate(STAMP_ON_FACE.rot);
  // the press-in (ch15-s08's): a hair large on the strike, settling over three frames
  const press = 1 + 0.06 * (1 - clamp01(dt / (3 / 24)));
  c.scale(press, press);
  // review round 5: FULL ink (the film's loudest stamp is no longer its faintest): the red at full opacity from the
  // strike frame, a shade darker while wet, and the type set at the legibility floor or above
  const red = wet > 0 ? mixLab(STAMP_RED, '#7a140f', 0.35 * wet) : STAMP_RED;
  c.strokeStyle = red;
  c.fillStyle = red;
  c.globalAlpha = 1;
  c.lineWidth = 4.4;
  c.strokeRect(-bw / 2, -bh / 2, bw, bh);
  c.lineWidth = 1.5;
  c.strokeRect(-bw / 2 + 5, -bh / 2 + 5, bw - 10, bh - 10);
  ghostOk(c, () =>
    textRole(c, 'subject', () => {
      const fs = legibleSize(c, `400 31px ${FONT.typewriter}`, 31, 'STATUS: OPEN');
      c.font = `400 ${fs}px ${FONT.typewriter}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('STATUS: OPEN', 0, 1);
      // the rubber's ink spread: a second impression a hair offset, so the strokes print solid, not thin
      c.fillText('STATUS: OPEN', 0.6, 1.4);
    }),
  );
  // the stamp's uneven inking: a few small dry flecks where the rubber missed (the face's manila showing through)
  c.fillStyle = mixLab(mixLab(env.mood.halo, '#b08a52', 0.35), env.mood.set, 0.55);
  for (let i = 0; i < 18; i++) {
    c.globalAlpha = 0.4;
    c.fillRect((hash1(i, 81) * 0.5) * bw, (hash1(i, 82) * 0.5) * bh, 1.4 + 1.4 * (hash1(i, 83) * 0.5 + 0.5), 1.1);
  }
  c.restore();
}

/** the cursor from the very first shot (ch01-s01's chat-box cursor: a cool off-white bar, 3 x 14 px at 1080p, on a
 *  steady half-second blink, a faint chat-box underline beneath it), blinking in the dark where the chat box was.
 *  On 'new candles' its blink slows; it goes out as the match flares. */
function cursor(f: Frame, t: number, b: B, cam: Camera3 = CAM_D0) {
  const t0 = b.off + 0.12;
  if (t < t0) return;
  const ph = blinkPhase(t, t0, b.slow);
  const on = ph % 1 < 0.5;
  // it holds steady through the line and goes out as the match flares on 'candles'
  const fadeIn = win(t, t0, t0 + 0.2) * (1 - win(t, b.flare - 0.05, b.flare + 0.2));
  if (fadeIn <= 0.003) return;
  const c = f.c;
  const cool = mixLab(MOODS.serverCyan.core, '#f2f5f6', 0.45);
  // round-3 shots r1: the cursor is the subject of the dark: it blinks just above the new candle's wick (where the flame
  // will stand), 1.5x its round-2 size, over a brighter chat-box underline
  const P = toScreen(LAYERS.L4, cam, WICK.x, WICK.y);
  const x = P.x, y = P.y - 24;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const R = 46;
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
  c.globalAlpha = 0.4 * fadeIn * (1 - warmAt(t, b));
  c.fillStyle = cool;
  c.fillRect(x - 12, y + 22, 320, 1.6);
  if (on) {
    c.globalAlpha = 0.97 * fadeIn;
    c.fillRect(x - 3.15, y - 13.5, 6.3, 27);
  }
  c.restore();
}
/** the warm interior plane: an eased rise from just before 'Somewhere' (under 10% for its first 0.3 s, so the cursor
 *  holds the dark alone), half up by the end of the word, full in 1.2 s */
function warmAt(t: number, b: B) {
  return sm(clamp01((t - b.warm) / 1.2));
}
/** the moonlit room's rise: held under 10% for its first 0.4 s (the cursor alone), full by 'lamp' */
function moonAt(t: number, b: B) {
  const x = clamp01((t - b.moon) / b.moonDur);
  return sm(x) * (0.35 + 0.65 * x);
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
  // from the catch, the slow push toward the new flame (CAM_D2) takes over the drift
  const p2 = sm((t - b.light) / (b.D - b.light));
  const cam: Camera3 = {
    x: lerp(lerp(CAM_D0.x, CAM_D1.x, u), CAM_D2.x, p2),
    y: lerp(lerp(CAM_D0.y, CAM_D1.y, u), CAM_D2.y, p2),
    z: lerp(lerp(CAM_D0.z, CAM_D1.z, u), CAM_D2.z, p2),
    lens: 1,
  };
  f.camera(cam);
  f.setMood('candleAmber');
  const { hp, fl, matchK, out, tip, shakeX, shakeAt, paper } = matchHands(tq, b, cam);
  // the new candle catches on b6 (on the twos): a bead, a gutter, then the flame stands
  const dc = tq - b.light;
  const candleK = dc < 0 ? 0 : dc < 1 / 12 ? 0.35 : dc < 2 / 12 ? 0.25 : Math.min(1, 0.55 + (dc - 2 / 12) * 2.6);
  const light = Math.max(matchK * 0.85, candleK);
  // the flare lights the candle's detail; before it, from 'Somewhere', the shelf and the unlit candle stand in
  // silhouette against the warm interior plane
  const reveal = sm(win(t, b.flare - 0.02, b.flare + 0.3));
  const warm = warmAt(t, b);
  studyRoom(f, { key: `${ID}/end`, cams: [CAM_D0, CAM_D1, CAM_D2], outside: { mood: 'winterBlue', kind: 'night' }, lamp: 0, fog: 0.35 });
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
    candleShelfEnd(c, env, views, reveal, warm, candleK);
    if (hp && paper) {
      c.save();
      c.translate(shakeX, 0);
      // the darkest shapes in frame. Before the flare one thin cool rim toward the window's moonlight (up-right);
      // once the match flares (round-3 shots r1) the rim turns to the MATCH FLAME, warm, ~2.5 px at 1080p, so the
      // practical lights the knuckles. Review round 5: the articulated paper-cut hands (one cuff, a single button)
      let rim = { dx: 1.15, dy: -1.15, col: mixLab(env.mood.rim, env.mood.core, 0.3), a: 0.8 };
      const arm = paper.right;
      if (fl && arm && matchK > 0.05) {
        const dx = fl.x - shakeX - arm.wrist.x, dy = fl.y - arm.wrist.y;
        const d = Math.hypot(dx, dy) || 1;
        rim = { dx: (1.6 * dx) / d, dy: (1.6 * dy) / d, col: mixLab(env.mood.halo, env.mood.core, 0.55), a: 0.9 * Math.min(1, matchK) };
      }
      drawMatchHands(c, paper, env, rim);
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
  const moon = moonAt(t, b);
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
  // round-3 shots r1: the window RECEDES as the new flame takes over (it used to brighten with it)
  const wv = 0.01 + 0.75 * moon * (1 - 0.45 * light);
  c.fillStyle = `rgba(3,2,1,${(1 - Math.min(1, wv / vis)).toFixed(3)})`;
  c.filter = 'blur(6px)';
  c.fillRect(a0.x, a0.y, a1.x - a0.x, a1.y - a0.y);
  c.restore();
  acrossStreet(f, cam, t, b, moon, light);
  glass(f, cam, moon, candleK, t, b);
  // round-3 shots r1: as the new flame takes over, a veil over the whole window (panes, street, the lit window to ~70%)
  if (light > 0.01) {
    const g0 = toScreen(STUDY_WALL, cam, Wn.x - 18, Wn.y - 18), g1 = toScreen(STUDY_WALL, cam, Wn.x + Wn.w + 18, Wn.y + Wn.h + 24);
    c.save();
    c.fillStyle = `rgba(3,2,1,${(0.3 * light).toFixed(3)})`;
    c.fillRect(g0.x, g0.y, g1.x - g0.x, g1.y - g0.y);
    c.restore();
  }
  // round-4 r1 (critic, continuity into ch15-s10): over the shot's last stretch the room (window, shelf, warm plane,
  // haze) goes to black around the new candle; its flame and small halo (the practicals below) stay at full strength,
  // so the fadeBlack carries a lone flame in the dark into the end cards (ch15-s10 picks it up where it stands)
  const endK = endDark(t, b);
  if (endK > 0.003) {
    c.save();
    c.fillStyle = `rgba(2,1,1,${(0.985 * endK).toFixed(3)})`;
    c.fillRect(-20, -20, 1320, 760);
    c.restore();
  }
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
      // round-3 shots r1: the old candle's halo steps down to ~60% over the 1.5 s after the new wick catches
      const yield_ = 1 - 0.4 * sm((t - b.light) / 1.5);
      f.practical({ x: p.x, y: p.y - 3, kind: 'candle', seed: 2025, intensity: 0.42 * gapK * yield_ * (1 - endK), radius: 26 });
    }
  }
  if (candleK > 0.01) {
    const sway = 1.2 * vnoise2(t * 2.1, 7.7);
    // the halo blooms as the flame settles (over THE GAP's smaller flame)
    const bloom = sm((t - b.light - 0.3) / 1.4);
    f.practical({ x: WICK.x + sway, y: WICK.y - 4, kind: 'candle', seed: 2027, intensity: (0.95 + 0.2 * bloom) * candleK, radius: 56 + 44 * bloom });
  }
  // the final hold's depth: a faint haze band across the sill and a soft curtain edge on the near plane (L5)
  const nearK = Math.max(light, warm) * (1 - endK);
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
/** the room's fall to black around the new flame: from D - 1.5 to D - 0.7 (the fadeBlack begins at D - 0.8) */
function endDark(t: number, b: B) {
  return sm(clamp01((t - (b.D - 1.5)) / 0.8));
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

/** the hands as the darkest shapes in frame (value hierarchy): PUPPET_NEAR_BLACK fills, one rim cut by drawing a
 *  light copy offset toward the key (dx, dy, in `col`) under the dark hands. The kit's finger segments overlap with
 *  opposite winding (small holes), so each hand is covered by its hole-filled silhouette (a light closing only: round-3
 *  shots r1, the heavy closing made blocky lumps with stair-step cuffs); then the kit's own CUT-LINES go back on top
 *  (knuckle crease, thumb, the tweed cuff's turn-back and buttons) in a dim rim tone, and the shirt cuff reads as a band
 *  (`cuff`). A lit match's flame is drawn on top in its own colours. */
function drawHands(c: C, hp: HandsPose, env: PaintEnv, rim: { dx: number; dy: number; col?: string; a?: number }, cuff?: string) {
  const K = PUPPET_NEAR_BLACK;
  const rimCol = rim.col ?? mixLab(env.mood.rim, env.mood.core, 0.3);
  const rimEnv: PaintEnv = { ...env, mood: { ...env.mood, rim: rimCol, halo: rimCol, core: rimCol, set: rimCol, ink: rimCol }, fill: () => rimCol };
  const darkEnv: PaintEnv = { ...env, mood: { ...env.mood, rim: K, halo: K, core: K, set: K, ink: K }, fill: (r) => (r === 'ink' ? K : env.fill(r)) };
  const cut = mixLab(K, rimCol, 0.55);
  const lineEnv: PaintEnv = { ...env, mood: { ...env.mood, rim: cut, halo: mixLab(K, rimCol, 0.4), core: mixLab(K, rimCol, 0.4) }, fill: () => 'rgba(0,0,0,0)' };
  const len = HAND_LEN * (hp.scale ?? 1);
  // each arm whole (rim, fill, hole-filled hand, its own cut-lines, its cuff), the back (left) arm first, so no line
  // or band of one arm ever shows through the other
  for (const side of ['left', 'right'] as const) {
    const a = hp[side];
    if (!a) continue;
    const one: HandsPose = { scale: hp.scale, [side]: side === 'right' ? { ...a, lit: 0 } : a };
    c.save();
    c.globalAlpha *= rim.a ?? 0.8;
    c.translate(rim.dx, rim.dy);
    hands.draw(c, one, rimEnv);
    c.restore();
    hands.draw(c, one, darkEnv);
    solidHand(c, a, len, env);
    // the cut-lines over the solid hand (strokes only: the kit's fills go transparent); the matchbox keeps its
    // striker strip and edges in this pass, so it reads as a box, not a lump on the fist
    const bare: ArmPose = { ...a, held: a.held === 'matchbox' ? 'matchbox' : 'none', lit: 0 };
    hands.draw(c, { scale: hp.scale, [side]: bare }, lineEnv);
    if (cuff) cuffBand(c, a, len, cuff);
  }
  const fl = hands.flameAt(hp);
  if (fl && hp.right) {
    const k = Math.max(0, Math.min(1, hp.right.lit ?? 0));
    c.save();
    c.translate(fl.x, fl.y);
    c.scale(len / 100, len / 100);
    flameShape(c, env, 0, 4, 10 * (0.5 + 0.5 * k), 31, 0.9 + 0.2 * k);
    c.restore();
  }
}
/** the shirt cuff showing between the tweed sleeve and the hand: a band (hand-local, the kit's arm transform) */
function cuffBand(c: C, a: ArmPose, len: number, tone: string) {
  const flipY = Math.cos(a.angle) < 0 ? -1 : 1;
  c.save();
  c.translate(a.wrist.x, a.wrist.y);
  c.rotate(a.angle);
  c.scale(len, len * flipY);
  c.fillStyle = tone;
  c.beginPath();
  c.moveTo(-0.15, -0.228);
  c.lineTo(-0.03, -0.218);
  c.quadraticCurveTo(-0.005, 0, -0.03, 0.218);
  c.lineTo(-0.15, 0.228);
  c.quadraticCurveTo(-0.125, 0, -0.15, -0.228);
  c.closePath();
  c.fill();
  c.restore();
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
  const R = 3;
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
const DRAPE = toLayer(LAYERS.L5, CAM_D2, -36, 0); // the near plane slides in from the left on the final push: it ends at the frame's left edge

/** the match hand, timed to the words: in from the bottom edge (right of the candle) from 'come', the box and the
 *  strike on 'from' (b5), a flare; the box hand goes; the match is carried to the wick FROM THE SIDE (the fist stays
 *  right of the candle, the match's tip meets the wick); the wick catches on b6; the match is shaken out and the hand
 *  withdraws. The match arm is solved so its flame lands exactly on its mark. */
function matchHands(tq: number, b: B, cam: Camera3) {
  const len = HAND_LEN * 1.35;
  // round-3 shots r1: both forearms come up from the TRUE bottom edge, right of centre (not a long diagonal from the
  // right). Review round 5: the box arm comes straight up under the matchbox, the match arm from right of it, so the
  // two hands stand apart and the match runs across between them to the striker
  const entryR = toLayer(LAYERS.L4, cam, 1100, 1060);
  // round-3 shots r1: shaken out as it leaves the wick and gone off the bottom edge by ~'from' + 0.0, so the lit candle
  // holds clean for 2.5 s before the fadeBlack
  const shakeAt = b.touch + 0.22;
  const none = { hp: null as HandsPose | null, fl: null as Pt | null, matchK: 0, out: false, tip: null as Pt | null, shakeX: 0, shakeAt, paper: null as PaperHands | null };
  // the kit's strikeLight timing (box in by .22, scratch .25 -> ignition .36, flare .38): the hand and the matchbox
  // rise on 'suspicious' and are in a second later; the match waits at the striker through 'That is where'; the
  // scratch on 'new' (foley fx-match-strike), ignition at the end of the stroke
  const sk: [number, number][] = [[b.handIn, 0], [b.handIn + 1.2, 0.22], [b.strike - 0.25, 0.25], [b.strike, 0.25], [b.flare, 0.36], [b.flare + 1 / 12, 0.38]];
  if (tq <= sk[0][0] || tq > shakeAt + 0.47) return none;
  let U = 0.42;
  for (let i = 0; i < sk.length - 1; i++) {
    if (tq <= sk[i + 1][0]) {
      U = lerp(sk[i][1], sk[i + 1][1], (tq - sk[i][0]) / (sk[i + 1][0] - sk[i][0]));
      break;
    }
  }
  // review round 5: the match head's own path (L4 world). The striker lies right of the candle, a little under the
  // wick; the scratch runs along it TOWARD the candle, so the flick from its end to the wick on 'candles' is short
  const S0 = { x: WICK.x + 122, y: WICK.y + 30 };
  const S1 = { x: WICK.x + 64, y: WICK.y + 26 };
  // the mark: the match's tip just right of the wick, a hair below it
  const mark = { x: WICK.x + 7, y: WICK.y + 2 };
  const rise = { x: S0.x + 70, y: S0.y + 320 };
  const wait = { x: S0.x + 6, y: S0.y - 9 };
  const P = (a: Pt, q: Pt, k: number): Pt => ({ x: lerp(a.x, q.x, k), y: lerp(a.y, q.y, k) });
  let H: Pt = U < 0.22 ? P(rise, wait, sm(U / 0.22)) : U < 0.25 ? P(wait, S0, sm((U - 0.22) / 0.03)) : U < 0.38 ? P(S0, S1, sm((U - 0.25) / 0.11)) : S1;
  if (tq > b.flare + 1 / 12) {
    // the flick to the wick: the match's tip is on its mark on 'candles'; then shaken out and carried off the bottom
    const carry = sm(clamp01((tq - (b.flare + 1 / 12)) / Math.max(1 / 12, b.touch - (b.flare + 1 / 12))));
    const goHome = sm(clamp01((tq - shakeAt) / 0.45));
    H = P(P(S1, mark, carry), { x: S0.x + 190, y: S0.y + 470 }, goHome);
  }
  const out = tq >= shakeAt + 2 / 12;
  let lit = U < 0.36 ? 0 : U < 0.42 ? 1.3 - (U - 0.36) * 5 : 1;
  if (out) lit = 0;
  const shakeX = tq >= shakeAt && tq < shakeAt + 4 / 12 ? (Math.floor((tq - shakeAt) * 12) % 2 ? -9 : 9) : 0;
  const tip = H;
  const fl = lit > 0 ? { x: H.x + shakeX, y: H.y } : null;
  const matchK = fl ? Math.max(0, Math.min(1.3, lit)) : 0;
  // review round 5 (ART): the articulated paper-cut pinch hand (sets/ch15-s09-paperHand), solved so its match burns
  // on this path; the matchbox is laid along the scratch, so the head drags across its striker on 'new'
  const pr = solvePinch(entryR, H, len);
  const boxGo = sm(clamp01((tq - b.flare) / 0.3));
  const uL = tq <= b.flare ? U : 0.42 + 0.2 * boxGo;
  const boxIn = sm(clamp01(uL / 0.22)) * (1 - sm(clamp01((uL - 0.42) / 0.2)));
  let box: PaperHands['box'] = null;
  let pl: PaperArm | null = null;
  if (boxIn > 0.003) {
    const d = { x: S1.x - S0.x, y: S1.y - S0.y };
    let ang = Math.atan2(d.y, d.x);
    // the box hangs below the scratch line (its local +y points down-screen), the striker on its top edge
    if (Math.cos(ang) < 0) ang += Math.PI;
    const n = { x: -Math.sin(ang), y: Math.cos(ang) };
    const bw = Math.hypot(d.x, d.y) + 30, bh = len * 0.26;
    const mid = { x: (S0.x + S1.x) / 2, y: (S0.y + S1.y) / 2 };
    const placed = { x: mid.x + n.x * (bh / 2 + 4), y: mid.y + n.y * (bh / 2 + 4) };
    const at = P({ x: placed.x + 60, y: placed.y + 380 }, placed, boxIn);
    box = { at, ang, w: bw, h: bh };
    pl = solveGrip({ x: placed.x + 30, y: placed.y + 760 }, { x: at.x + n.x * bh * 0.36, y: at.y + n.y * bh * 0.36 }, len);
  }
  const paper: PaperHands = { right: pr, left: pl, box, lit, len };
  return { hp: { scale: 1.35 } as HandsPose | null, fl, matchK, out, tip, shakeX, shakeAt, paper };
}
interface PaperHands {
  right: PaperArm | null;
  left: PaperArm | null;
  box: { at: Pt; ang: number; w: number; h: number } | null;
  lit: number;
  len: number;
}
/** review round 5: the match hands as articulated paper cut-outs: the matchbox hand behind, then the pinching hand,
 *  each with one rimmed cuff and a single button; the rim turns warm toward the match once it burns */
function drawMatchHands(c: C, ph: PaperHands, env: PaintEnv, rim: { dx: number; dy: number; col: string; a: number }) {
  const cuffRim = mixLab(env.mood.halo, env.mood.core, 0.45);
  if (ph.box) drawMatchbox(c, ph.box.at, ph.box.ang, ph.box.w, ph.box.h, env, rim);
  if (ph.left) drawPaperArm(c, ph.left, ph.len, env, { kind: 'grip', rim, cuffRim });
  if (ph.right) {
    drawPaperArm(c, ph.right, ph.len, env, { kind: 'pinch', rim, cuffRim, match: true, lit: ph.lit });
    const k = Math.max(0, Math.min(1, ph.lit));
    if (ph.lit > 0) {
      const fp = pinchFlame(ph.right, ph.len);
      c.save();
      c.translate(fp.x, fp.y);
      c.scale(ph.len / 100, ph.len / 100);
      flameShape(c, env, 0, 4, 10 * (0.5 + 0.5 * k), 31, 0.9 + 0.2 * k);
      c.restore();
    }
  }
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
function acrossStreet(f: Frame, cam: Camera3, t: number, b: B, moon: number, light = 0) {
  // round-3 shots r1: as the new flame takes over, the street recedes: facade, haze and spill to 60%, the lit window
  // itself to ~70% (it stays the answer to 'a lamp is on')
  const recede = 1 - 0.4 * light;
  const litK = 1; // the veil over the panes (paintShelfEnd) brings it to ~70%
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
    c.globalAlpha = moon * recede;
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
      c.globalAlpha = moon * on * litK;
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
      c.globalAlpha = moon * recede;
      c.fillStyle = mixLab(N.set, N.ink, 0.5);
      c.fillRect(-W2, -26 * u, 2 * W2, 3 * u);
    }
    c.restore();
    // round-1: winter air between the street and the study glass: a cool haze, thicker low (the street's breath)
    {
      c.save();
      c.globalCompositeOperation = 'source-over';
      c.globalAlpha = moon * recede;
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
      c.globalAlpha = moon * on * recede;
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
function candleShelfEnd(c: C, env: PaintEnv, views: CandleView[], reveal: number, warm = 0, lit = 0) {
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
  newWax(c, env, shape, lit);
  // the blank year tag at its base (the year not yet written), the same cut as every candle's tag
  blankTag(c, NEW_X + 15 * STUDY.shelf.s, SY, STUDY.shelf.s, env);
  c.restore();
}
/** round-3 shots r1: the new candle's wax is not a flat slab: a soft vertical value (a step lighter toward its top,
 *  deeper into the cup) and, once lit, the wax glowing a few cm below the flame with a narrow warm side-light down
 *  its flame-side edge. Unlettered and unscored, as the script asks. */
function newWax(c: C, env: PaintEnv, shape: number, lit: number) {
  const s = STUDY.shelf.s;
  const w = 30 * s, x0 = NEW_X - w / 2, bot = SY - 7, top = bot - 270 * s;
  c.save();
  c.beginPath();
  c.rect(x0, top - 1, w, bot - top + 1);
  c.clip();
  const vg = c.createLinearGradient(0, top, 0, bot);
  vg.addColorStop(0, withAlpha(mixLab(env.mood.set, env.mood.halo, 0.4), 0.3 * shape));
  vg.addColorStop(0.45, withAlpha(mixLab(env.mood.set, env.mood.halo, 0.15), 0.12 * shape));
  vg.addColorStop(1, withAlpha(env.mood.fg, 0.3 * shape));
  c.fillStyle = vg;
  c.fillRect(x0, top, w, bot - top);
  // a soft roundness: the edges a shade deeper than the middle
  const hg = c.createLinearGradient(x0, 0, x0 + w, 0);
  hg.addColorStop(0, withAlpha(env.mood.fg, 0.22 * shape));
  hg.addColorStop(0.45, withAlpha(env.mood.fg, 0));
  hg.addColorStop(1, withAlpha(env.mood.fg, 0.18 * shape));
  c.fillStyle = hg;
  c.fillRect(x0, top, w, bot - top);
  if (lit > 0.01) {
    c.globalCompositeOperation = 'lighter';
    // translucent wax under the flame
    const g = c.createRadialGradient(NEW_X, top + 4, 2, NEW_X, top + 10, 78 * s);
    g.addColorStop(0, withAlpha(mixLab(env.mood.core, env.mood.halo, 0.3), 0.55 * lit));
    g.addColorStop(0.4, withAlpha(env.mood.halo, 0.22 * lit));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(x0, top, w, 90 * s);
    // the narrow side-light down the flame side
    const sg = c.createLinearGradient(0, top, 0, top + 150 * s);
    sg.addColorStop(0, withAlpha(env.mood.halo, 0.42 * lit));
    sg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = sg;
    c.fillRect(x0 + w - 3.2 * s, top, 2.4 * s, 150 * s);
  }
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
