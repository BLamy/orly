/**
 * ch08-s01 — DEEP DIVE opens: the expert-features candle is set on the shelf; in a craftsman's workshop tin
 * stencils are cut by hand, and even with five guesses a quarter of the ring of pictures goes dark
 * (candleAmber throughout; 16.83 s; in: paperWipe from ch07-s06's study).
 *
 *   0.1           CHAPTER INDEX TAB 'DEEP DIVE · The Night in Florence' drops at top-left, holds 2.5 s, slides up
 *   'promise'     SHELF (low macro): the two steady hands bring a tall candle into the lamp's pool, already burning,
 *                 its ghost sleeve eleven rings long (1999 → 2010)
 *   'belief'      they set it into its year's place, left of the guttered 2006 candle (tag 1999); the belief rises
 *                 on a plate: TO SEE, A MACHINE NEEDS FEATURES DESIGNED BY EXPERTS
 *   'experts'     an unseen hand draws a sheet of dark paper across the frame (same lamp, never a dim to black);
 *                 behind it, the WORKSHOP: a craftsman cuts tin stencils with snips under a hanging lamp, finished
 *                 stencils hang on hooks like tools; IMAGENET CHALLENGE · 2010–2011
 *   ≈ +1.5 s      he carries his stencil to the judge's lectern (camera trucks with him)
 *   'five'        a husky thumbnail is pinned on the lectern's board, five guess slips fan beneath it; one slip
 *                 is ticked (top-5 scoring, shown, not said); the label: top-5 error · 2010: 28.2% · 2011: ≈ 25.8%
 *   'best'        the 2010 and 2011 lanterns glow on the ruled leaderboard, barely a hand's width apart
 *   'four'        seven of the ring's 25 thumbnails go dark, one after another (28 %: more than one in four)
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose } from '../../../film';
import { createPuppet, defineShot, placeStamp, pose, withLife, walkTo, PUPPET_NEAR_BLACK, withAlpha, mixLab, toScreen, toLayer, LAYERS, FONT, legibleSize, hash1 } from '../../../film';
import { createFrame } from '../../../film/core/frame';
import { makeCanvas } from '../../../film/silhouette/atmosphere';
import type { PuppetSpec } from '../../../film/contracts';
import { hands } from '../cast';
import { HAND_LEN, handsEntry, type ArmPose, type HandsPose, type Pt } from '../sets/narratorHands';
import { STUDY, candleX, studyCase, studyNear, studyRoom } from '../sets/study';
import { shelfStateAt } from '../sets/studyState';
import { beliefCandle, candleFlame } from '../sets/beliefCandle';
import { indexTab } from '../sets/indexTab';
import { beliefLabel, monoCard } from '../sets/ch07-s01-kit';
import { clamp01, lerp, mixCam, sm, tq12, win } from '../sets/ch08-s01-kit';
import { WS, benchAndLamp, benchWork, guesses, lectern, leaderboard, thumbRing, tinPlate, workshopBack } from '../sets/ch08-s01-workshop';

type C = CanvasRenderingContext2D;
const ID = 'ch08-s01';

// ------------------------------------------------------------------------------------------------ the study shelf
const V0 = shelfStateAt(ID, 'start');
const VE = shelfStateAt(ID, 'end').find((v) => v.id === 'experts')!;
/** eleven rings already burned (1999 to 2010), live; its base tag ('lit 1999') is drawn by this shot, larger than
 *  the shelf's own tags, so it reads at 1080p (≥ 26 px) in the macro */
const EXPERTS = { ...VE, rings: 11, state: 'live' as const, tag: '' };
const TAG_TEXT = 'lit 1999';
const EX = candleX(shelfStateAt(ID, 'end'), 'experts');
const SHELF_Y = STUDY.shelf.y;
/** the macro sits the new candle on the RIGHT third (the older candles fill the left two thirds), and dollies in a
 *  touch while it trucks, so the near shelf bracket and book spines (L5) slide against the shelf */
const SH0: Camera3 = { x: EX - 64, y: SHELF_Y - 150, z: 420, lens: 1 };
const SH1: Camera3 = { x: EX - 122, y: SHELF_Y - 160, z: 474, lens: 1 };
const STUDY_CAMS = [SH0, SH1];

// ------------------------------------------------------------------------------------------------ the workshop
const W0: Camera3 = { x: 486, y: 372, z: 150, lens: 1 };
const W1: Camera3 = { x: 868, y: 360, z: 40, lens: 1 };
const W2: Camera3 = { x: 892, y: 352, z: 92, lens: 1 };
const WS_CAMS = [W0, W1, W2];
const CRAFT_SPEC: PuppetSpec = {
  id: 'ch08-craftsman', height: 318, build: 'average', era: '1990s', wardrobe: 'rolledSleeves', hair: 'receding',
  facialHair: 'beard', glasses: 'round', hat: 'none', profile: { nose: 0.5, brow: 0.5, chin: 0.48, jaw: 0.52 }, prop: 'none',
  details: ['placket', 'cuff', 'belt'],
};
const CRAFT = createPuppet(CRAFT_SPEC);
const CX0 = 400;
const CX1 = 676;
/** at the bench: forearms forward and down over the plate, snips in the near hand */
const CUT_A: Pose = pose({ hipF: 6, kneeF: -5, hipB: -4, kneeB: -1, torso: 9, neck: 4, head: 14, shoulderF: 52, elbowF: 48, wristF: -10, shoulderB: 40, elbowB: 52, wristB: -6 }, { handF: 'grip', handB: 'pinch' });
const CUT_B: Pose = pose({ hipF: 6, kneeF: -5, hipB: -4, kneeB: -1, torso: 9, neck: 4, head: 14, shoulderF: 48, elbowF: 56, wristF: 6, shoulderB: 40, elbowB: 52, wristB: -6 }, { handF: 'fist', handB: 'pinch' });
/** at the lectern: presenting the stencil toward the board */
const PRESENT: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 2, neck: 6, head: -9, shoulderF: 58, elbowF: 38, wristF: -16, shoulderB: -8, elbowB: 14 }, { handF: 'pinch' });
const WATCH: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -1, neck: 7, head: -10, shoulderF: 6, elbowF: 22, wristF: 4, shoulderB: -8, elbowB: 14 }, { handF: 'pinch' });
const LIGHT = { x: -0.7, y: -0.5, floor: 0.15 };
/** one snip every 1/3 s: open slowly over most of it, close hard on one 'two' */
const SNIP_P = 1 / 3;

interface B {
  D: number;
  tab: number;
  promise: number;
  candle: number;
  release: number;
  handsOut: number;
  workshop: number;
  wipeA: number;
  wipeB: number;
  cut0: number;
  /** the three snip closes (on twos), each dropping a sliver of tin */
  snipsAt: number[];
  walk: number;
  arrive: number;
  five: number;
  best: number;
  four: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const workshop = T.beat('workshop');
    // the cut-cut rhythm (on twos: one snip every 4 frames x 2) holds from the wipe to 'hand' + 0.6, then he walks
    const walk = T.word('L0802', 'hand') + 0.6;
    const snipsAt: number[] = [];
    for (let ct = workshop + 0.62; ct < walk - 0.12; ct += SNIP_P) snipsAt.push(ct);
    const b: B = {
      D,
      tab: T.beat('indexTab'),
      promise: T.beat('promise'),
      candle: T.beat('candle'),
      release: T.beat('candle') + 0.05,
      handsOut: T.beat('candle') + 0.5,
      workshop,
      wipeA: workshop - 0.6,
      wipeB: workshop + 0.6,
      cut0: workshop + 0.15,
      snipsAt,
      walk,
      arrive: 0,
      five: T.beat('guesses'),
      best: T.beat('board'),
      four: T.beat('four'),
    };
    b.arrive = walkTo(CRAFT_SPEC, { x0: CX0, x1: CX1, at: b.walk })(b.walk).arrive;
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    // the wipe: the study stays the main plate until the sheet has fully crossed; the workshop is painted into its
    // own frame and shown only on the sheet's trailing side, so one of the two rooms is always in view
    if (t < b.wipeB) paintStudy(f, t, b);
    else paintWorkshop(f, t, b);
    if (t >= b.wipeA && t < b.wipeB) workshopBehindSheet(f, t, b);
    // screen-locked type: the belief, on a soft plate in the open wall left of the new candle
    const ba = win(t, b.candle + 0.15, b.candle + 0.65) * (1 - win(t, b.wipeA - 0.35, b.wipeA + 0.05));
    if (ba > 0.003) {
      labelPlate(f.c, 560, 196, 470, 96, ba, f.mood);
      beliefLabel(f.c, ['TO SEE, A MACHINE NEEDS', 'FEATURES DESIGNED BY EXPERTS'], 560, 186, ba, f.mood, { size: 22, align: 'center' });
    }
    if (t >= b.workshop) {
      placeStamp(f.c, { place: 'IMAGENET CHALLENGE', date: '2010–2011', year: 2010, at: b.wipeB + 0.1 }, { t, mood: f.mood });
      const la = win(t, b.five + 0.25, b.five + 0.75);
      // two lines at the legibility floor (one card, one text item): the measure, then the two years' scores
      const ls = legibleSize(f.c, `500 21px ${FONT.mono}`, 21);
      if (la > 0) monoCard(f.c, { x: 1010, y: 552, lines: ['top-5 error', '2010: 28.2% · 2011: ≈ 25.8%'], size: ls, alpha: la, rise: la, seed: 81 }, f.mood);
    }
    wipeSheet(f, t, b);
    indexTab(f.c, { title: 'DEEP DIVE · The Night in Florence', at: b.tab, hold: 2.5 }, { t, mood: f.mood });
  },
});

// ================================================================================================= THE STUDY
function shelfCam(t: number, b: B): Camera3 {
  return mixCam(SH0, SH1, sm(t / b.workshop));
}

/** the candle's base position (world): carried in from the lower right, lowered into its slot on 'belief' */
function candleBase(tq: number, b: B): Pt {
  const above = { x: EX, y: SHELF_Y - 30 };
  const from = { x: EX + 420, y: SHELF_Y + 190 };
  const t1 = b.candle - 0.5;
  if (tq <= b.promise) return from;
  if (tq < t1) {
    const u = sm((tq - b.promise) / (t1 - b.promise));
    return { x: lerp(from.x, above.x, u), y: lerp(from.y, above.y, u) - 40 * Math.sin(Math.PI * u) };
  }
  if (tq < b.candle) return { x: EX, y: lerp(above.y, SHELF_Y, sm((tq - t1) / (b.candle - t1))) };
  return { x: EX, y: SHELF_Y };
}

function paintStudy(f: Frame, t: number, b: B) {
  const cam = shelfCam(t, b);
  f.camera(cam);
  const tq = tq12(t);
  studyRoom(f, { key: ID, cams: STUDY_CAMS, outside: { mood: 'winterBlue', kind: 'city' } });
  const base = candleBase(tq, b);
  const entry = handsEntry(cam, 'L4');
  const placed = tq >= b.candle;
  const fl = candleFlame({ x: base.x, y: base.y, view: EXPERTS, s: STUDY.shelf.s });
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    board: false,
    wall: false,
    xray: false,
    shelf: { views: V0 },
    extra: (c, env) => {
      if (tq < b.promise - 0.05) return;
      beliefCandle(c, { x: base.x, y: base.y, view: EXPERTS, s: STUDY.shelf.s, drawFlame: false }, env);
      litTag(c, env, base.x + 22, base.y);
      drawHands(c, env, tq, b, base, entry, placed, fl);
    },
  });
  if (tq >= b.promise - 0.05) f.practical({ x: fl.x, y: fl.y - 4, kind: 'candle', seed: 1999, intensity: 0.95, radius: 42 });
  studyNear(f, { key: ID, cams: STUDY_CAMS, file: true });
  nearShelf(f);
  lampPool(f, cam);
}

/** L5 world anchor (screen (0, 0) at SH0) and the L5 scale there: the near furniture is authored in SH0 screen px */
const NEAR = (() => {
  const o = toLayer(LAYERS.L5, SH0, 0, 0);
  const k = toScreen(LAYERS.L5, SH0, 0, 0).k;
  return { x: o.x, y: o.y, k };
})();
/**
 * The near plane of the macro (L5, blurred): two short leaning book spines at the lower-left corner on the shelf's
 * near lip, and an iron shelf bracket under the plank at lower right, close to the lens, so the SH0 → SH1 truck and
 * dolly parallax against the candles. Authored in SH0 screen px (scaled into L5 world).
 */
function nearShelf(f: Frame) {
  f.layer('L5', (c, env) => {
    const ink = env.fill('fg');
    c.save();
    c.translate(NEAR.x, NEAR.y);
    c.scale(1 / NEAR.k, 1 / NEAR.k);
    c.fillStyle = ink;
    // the near lip of a lower shelf, across the very bottom
    c.fillRect(-300, 704, 1900, 120);
    // two spines leaning right from the lower-left corner, headbands catching the lamp
    const spines = [
      { x: 14, w: 46, h: 190, r: 0.04 },
      { x: 66, w: 38, h: 150, r: 0.2 },
    ];
    for (const sp of spines) {
      c.save();
      c.translate(sp.x, 720);
      c.rotate(sp.r);
      c.fillStyle = ink;
      c.fillRect(-sp.w / 2, -sp.h, sp.w, sp.h + 40);
      c.fillStyle = withAlpha(env.mood.rim, 0.3);
      c.fillRect(-sp.w / 2, -sp.h, sp.w, 2.5);
      c.fillRect(-sp.w / 2 + 5, -sp.h + 26, sp.w - 10, 1.6);
      c.restore();
    }
    // the bracket: a scrolled iron knee under the plank at right
    c.save();
    c.translate(1176, 652);
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(-6, 0);
    c.lineTo(84, 0);
    c.lineTo(84, 8);
    c.bezierCurveTo(44, 12, 8, 36, 6, 90);
    c.lineTo(-6, 90);
    c.closePath();
    c.fill();
    c.strokeStyle = ink;
    c.lineWidth = 5;
    c.beginPath();
    c.arc(30, 30, 13, Math.PI * 0.9, Math.PI * 2.3);
    c.stroke();
    c.fillStyle = withAlpha(env.mood.rim, 0.3);
    c.fillRect(-6, -1, 90, 1.6);
    c.restore();
    c.restore();
  });
}

/** a soft dark plate behind floating type: feathered edges, no hard frame */
function labelPlate(c: C, x: number, y: number, w: number, h: number, a: number, m: Frame['mood']) {
  c.save();
  c.globalAlpha = a;
  c.shadowColor = withAlpha(m.fg, 0.75);
  c.shadowBlur = 26;
  c.fillStyle = withAlpha(mixLab(m.fg, m.set, 0.3), 0.62);
  const r = 14;
  c.beginPath();
  c.roundRect(x - w / 2, y - h / 2, w, h, r);
  c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = withAlpha(m.rim, 0.16);
  c.lineWidth = 1;
  c.stroke();
  c.restore();
}

/**
 * The lamp's pool on the 1999 slot: a warm wash (≈ 380 px wide at 1080p) where the candle is set, and the rest of the
 * shelf falling off to ≈ 60 % value, so the eye goes to the slot before the candle arrives and stays on it after.
 */
function lampPool(f: Frame, cam: Camera3) {
  const c = f.c;
  const p = toScreen(LAYERS.L4, cam, EX, SHELF_Y - 120);
  c.save();
  // fall-off: multiply toward 60 % away from the slot
  c.globalCompositeOperation = 'multiply';
  const g = c.createRadialGradient(p.x, p.y, 120, p.x, p.y, 520);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.45, '#d6d6d6');
  g.addColorStop(1, '#999999');
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  // the pool itself: a warm, soft ellipse on the shelf and the wall behind the slot
  c.globalCompositeOperation = 'screen';
  c.translate(p.x, p.y + 30);
  c.scale(1, 1.35);
  const w = c.createRadialGradient(0, 0, 0, 0, 0, 128);
  w.addColorStop(0, withAlpha(f.mood.halo, 0.35));
  w.addColorStop(0.55, withAlpha(f.mood.halo, 0.18));
  w.addColorStop(1, withAlpha(f.mood.halo, 0));
  c.fillStyle = w;
  c.fillRect(-140, -140, 280, 280);
  c.restore();
}

/** the candle's base tag, 'lit 1999': the shelf's paper tag, set a size up so it reads in the macro */
function litTag(c: C, env: PaintEnv, x: number, y: number) {
  c.save();
  c.translate(x, y - 30);
  c.rotate(0.1);
  c.strokeStyle = withAlpha(env.mood.rim, 0.45);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(-4, -8);
  c.lineTo(2, 0);
  c.stroke();
  // the narration says the year aloud: the tag is read, so it meets the 22 px floor in the macro
  // (Plex Mono, like the candle's own lettering)
  const fs = legibleSize(c, `500 11.5px ${FONT.mono}`, 11.5, TAG_TEXT);
  c.font = `500 ${fs}px ${FONT.mono}`;
  const tw = c.measureText(TAG_TEXT).width + 10;
  const th = fs * 1.48;
  const paper = mixLab(env.mood.setHaze, env.mood.halo, 0.6);
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(2, 0);
  c.lineTo(4 + tw, 0);
  c.lineTo(4 + tw, th);
  c.lineTo(2, th);
  c.lineTo(-3, th / 2);
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(env.mood.ink, paper, 0.12);
  // alphabetic baseline (a 'middle' baseline halves every cap-height measurement made on this context)
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  c.fillText(TAG_TEXT, 7, th / 2 + fs * 0.35);
  c.restore();
}

/**
 * The two steady hands: the right hand relaxed round the stub low (thumb along the wax, fingers curled under), the
 * left laid flat against it higher up, steadying. Both carry a 1-2 px rim on the edge that faces the candle flame
 * (an offset copy in the rim colour under the ink). After 'belief' they let go and drop straight down and out of
 * frame, gone by +0.5 s, never back over the shelf lip.
 */
function drawHands(c: C, env: PaintEnv, tq: number, b: B, base: Pt, entry: { R: Pt; L: Pt }, placed: boolean, flame: Pt) {
  const hs = 0.7;
  const len = HAND_LEN * hs;
  const gripR = { x: base.x + 30, y: base.y - 40 };
  const gripL = { x: base.x + 26, y: base.y - 128 };
  let R: ArmPose;
  let L: ArmPose;
  if (!placed) {
    R = hands.reach(entry.R, gripR, 'rest', len, { bend: 0.18 });
    L = hands.reach(entry.L, gripL, 'flat', len, { bend: 0.06 });
  } else {
    const u = (tq - b.release) / (b.handsOut - b.release);
    if (u >= 1) return;
    if (u < 0) {
      R = hands.reach(entry.R, gripR, 'rest', len, { bend: 0.18 });
      L = hands.reach(entry.L, gripL, 'flat', len, { bend: 0.06 });
    } else {
      // let go (fingers ease off the wax), then straight down and out of the bottom of frame
      const k = sm(clamp01((u - 0.12) / 0.88));
      const drop = (p: Pt, dx: number) => ({ x: p.x + dx + 50 * k, y: p.y + 380 * k });
      R = hands.reach(entry.R, drop(gripR, 8 * clamp01(u / 0.12)), 'rest', len, { bend: 0.18 - 0.1 * k });
      L = hands.reach(entry.L, drop(gripL, 10 * clamp01(u / 0.12)), 'flat', len, { bend: 0.06 });
    }
  }
  const pose: HandsPose = { right: R, left: L, scale: hs };
  // the candle-side rim: the same hands, nudged 1 px toward the flame, in the rim colour, under the ink
  const mid = { x: (R.wrist.x + L.wrist.x) / 2, y: (R.wrist.y + L.wrist.y) / 2 };
  const d = Math.hypot(flame.x - mid.x, flame.y - mid.y) || 1;
  const off = 1.15;
  const rimEnv: PaintEnv = { ...env, fill: (r) => (r === 'ink' ? withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.35), 0.75) : env.fill(r)) };
  c.save();
  c.translate(((flame.x - mid.x) / d) * off, ((flame.y - mid.y) / d) * off);
  hands.draw(c, pose, rimEnv);
  c.restore();
  hands.draw(c, pose, env);
}

// ================================================================================================= THE WORKSHOP
function wsCam(t: number, b: B): Camera3 {
  const a = mixCam(W0, W1, sm((t - b.walk - 0.2) / (b.arrive - b.walk + 0.4)));
  return mixCam(a, W2, sm((t - b.arrive - 0.2) / (b.D - b.arrive)));
}

function paintWorkshop(f: Frame, t: number, b: B) {
  const cam = wsCam(t, b);
  f.camera(cam);
  const tq = tq12(t);
  f.backlight({ sunX: 560, sunY: 430, sunRadius: 620, intensity: 0.6 });
  workshopBack(f, ID, WS_CAMS);
  f.fog({ yCenter: 0.6 * 720, height: 0.4 * 720, alpha: 0.2, drift: 6 });
  const st = {
    show: 1,
    glow: [win(t, b.best, b.best + 0.45), win(t, b.best + 0.45, b.best + 0.9)] as [number, number],
    dark: clamp01((tq - b.four) / 0.9),
  };
  f.layer('L3', (c, env) => {
    leaderboard(c, env, st);
    thumbRing(c, env, st);
  });
  f.fog('B');
  // the hanging lamp's light sits behind the figure's plane (painted before L4 so its halo never washes him)
  f.practical({ x: WS.lamp.x, y: WS.lamp.y + 4, kind: 'lamp', seed: 811, intensity: 0.85, radius: 70 });
  const walk = walkTo(CRAFT_SPEC, { x0: CX0, x1: CX1, at: b.walk, end: PRESENT })(t);
  f.layer('L4', (c, env) => {
    const ink = env.fill('ink');
    benchAndLamp(c, env, ink);
    benchWork(c, env, ink, clamp01((tq - b.cut0) / (b.walk - b.cut0)));
    lectern(c, env, ink);
    guesses(c, env, clamp01((tq - (b.five - 0.15)) / 0.6), win(t, b.five + 0.9, b.five + 1.3));
    // the craftsman
    let p: Pose;
    let x = CX0;
    const open = snipOpen(tq, b);
    if (tq < b.walk) {
      // the snips open slowly, close hard (on twos): the hand squeezes, the wrist dips
      p = open < 0.08 ? CUT_B : CUT_A;
    } else if (walk.walking) {
      x = walk.x;
      p = { ...walk.pose, angles: { ...walk.pose.angles, shoulderF: 34, elbowF: 64, wristF: -20 }, handF: 'pinch' };
    } else {
      x = walk.x;
      p = tq < b.arrive + 1.4 ? walk.pose : blendPose2(PRESENT, WATCH, sm((tq - b.arrive - 1.4) / 0.5));
    }
    const drawn = withLife(p, tq, 81, tq < b.walk || !walk.walking ? 1 : 0);
    const opts = { x, y: WS.floor, facing: 'right' as const, pose: drawn, ink: PUPPET_NEAR_BLACK, light: LIGHT, edgeRim: { x: -0.7, y: -0.5, px: 1.4 } };
    // slivers already cut lie on the bench top and the floor (behind his legs)
    slivers(c, env, tq, b, true);
    CRAFT.draw(c, opts, env);
    const hand = CRAFT.anchor(opts, 'handF');
    const handB = CRAFT.anchor(opts, 'handB');
    if (tq < b.walk) {
      // the plate in his far hand, the snips biting its edge; the hanging lamp catches the tin (a 1 px rim on the
      // plate's lamp-side edges and a glint that flicks on each close)
      const px = handB.x + 14, py = handB.y - 2;
      tinPlate(c, env, px, py, 34, 'arrows', { lit: 0.45 });
      plateRim(c, env, px, py, 34, 0.85 + 0.15 * (open < 0.05 ? 1 : 0));
      snips(c, env, hand, open);
    } else if (tq < b.arrive + 1.4) {
      tinPlate(c, env, hand.x + 14, hand.y - 4, 30, 'arrows', { lit: 0.4 });
      plateRim(c, env, hand.x + 14, hand.y - 4, 30, 0.8);
    } else {
      // the stencil, set on the lectern's desk
      tinPlate(c, env, WS.lectern.x - 30, WS.lectern.top + 14, 26, 'arrows', { lit: 0.3 });
    }
    // falling slivers (in front)
    slivers(c, env, tq, b, false);
  });
  f.rim({ x: -0.6, y: -0.8 });
  f.layer('L5', (c, env) => {
    // the near edge, blurred: the end of a second bench at lower left with an iron vise clamped to it, a stool
    // and the floor's lip, so the empty left of the room has a foreground
    c.fillStyle = env.fill('fg');
    c.fillRect(-400, 690, 2400, 200);
    c.fillRect(-400, 560, 520, 26);
    c.fillRect(70, 586, 34, 140);
    c.fillRect(-60, 586, 30, 140);
    // the vise: jaw, screw, handle bar
    c.fillRect(60, 512, 62, 48);
    c.fillRect(48, 500, 86, 16);
    c.fillRect(122, 526, 34, 10);
    c.fillRect(150, 506, 8, 52);
    c.beginPath();
    c.arc(154, 504, 6, 0, Math.PI * 2);
    c.arc(154, 560, 6, 0, Math.PI * 2);
    c.fill();
    c.fillRect(1240, 600, 400, 300);
    c.fillRect(1200, 680, 60, 40);
  });
}

/** how far the snips' blades are open (radians/2): open slowly, close hard on twos, one bite every SNIP_P */
function snipOpen(tq: number, b: B): number {
  let a = 0.06;
  for (const ct of b.snipsAt) {
    if (tq >= ct - SNIP_P + 1 / 12 && tq < ct) a = 0.06 + 0.34 * sm((tq - (ct - SNIP_P + 1 / 12)) / (SNIP_P - 2 / 12));
    else if (tq >= ct && tq < ct + 1 / 12) a = 0.03;
  }
  return a;
}

/** a cut sliver of tin: starts at the plate's edge on the close, falls and turns on twos, rests on the floor */
const SLIVER_FROM = (() => {
  const o = { x: CX0, y: WS.floor, facing: 'right' as const, pose: CUT_B, ink: PUPPET_NEAR_BLACK };
  const h = CRAFT.anchor(o, 'handF');
  return { x: h.x + 16, y: h.y + 2 };
})();
function slivers(c: C, env: PaintEnv, tq: number, b: B, resting: boolean) {
  b.snipsAt.forEach((ct, k) => {
    if (k % 2 === 1) return;
    const u = (tq - ct) / 0.55;
    if (u < 0) return;
    const landed = u >= 1;
    if (landed !== resting) return;
    const x0 = SLIVER_FROM.x + k * 3, y0 = SLIVER_FROM.y;
    const yEnd = WS.floor - 2;
    const uu = Math.min(1, u);
    const x = x0 + 18 * uu + 6 * k;
    const y = y0 + (yEnd - y0) * uu * uu;
    const rot = landed ? 0.2 * k : 0.6 + uu * 5.5 + k;
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.strokeStyle = landed ? mixLab(env.fill('ink'), env.mood.rim, 0.25) : mixLab(env.mood.rim, env.mood.halo, 0.4);
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(-5, 0);
    c.quadraticCurveTo(0, -4, 5, 0);
    c.quadraticCurveTo(7, 2, 5, 3);
    c.stroke();
    c.restore();
  });
}

function blendPose2(a: Pose, b: Pose, u: number): Pose {
  if (u <= 0) return a;
  if (u >= 1) return b;
  const angles: Pose['angles'] = {};
  const keys = new Set([...Object.keys(a.angles), ...Object.keys(b.angles)]) as Set<keyof Pose['angles']>;
  for (const k of keys) angles[k] = lerp(a.angles[k] ?? 0, b.angles[k] ?? 0, u);
  return { ...b, angles, handF: u < 0.5 ? a.handF : b.handF };
}

/** the lamp (upper left) catching the tin plate: a 1 px rim along its top and left edges */
function plateRim(c: C, env: PaintEnv, x: number, y: number, w: number, a: number) {
  c.save();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.35), a);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x - w / 2, y + w / 2 - 2);
  c.lineTo(x - w / 2, y - w / 2);
  c.lineTo(x + w / 2, y - w / 2);
  c.stroke();
  c.restore();
}

/** tin snips in the near hand: two heavy blades (pivot at the hand's front) and handles back into the fist */
function snips(c: C, env: PaintEnv, h: Pt, open: number) {
  c.save();
  c.translate(h.x + 3, h.y + 3);
  c.rotate(0.22);
  c.fillStyle = env.fill('ink');
  for (const s of [1, -1]) {
    c.save();
    c.rotate(s * open);
    c.beginPath();
    c.moveTo(-6, -2.6);
    c.lineTo(30, -1.4);
    c.lineTo(34, 0);
    c.lineTo(-6, 2.6);
    c.closePath();
    c.fill();
    c.restore();
    // handles, back through the fist
    c.save();
    c.rotate(Math.PI - s * open * 0.7);
    c.fillRect(2, -1.8, 14, 3.6);
    c.restore();
  }
  c.beginPath();
  c.arc(0, 0, 3.4, 0, Math.PI * 2);
  c.fill();
  // the lamp catches the upper blade's spine
  c.rotate(-open);
  c.fillStyle = withAlpha(env.mood.rim, 0.75);
  c.fillRect(4, -2.4, 24, 1);
  c.restore();
}

// ================================================================================================= THE WIPE
/**
 * An unseen hand draws a sheet of dark paper across the frame, right → left. The sheet is narrower than the frame
 * (70 % W) and leans a little, so the study is always visible ahead of it and the workshop behind it: the eye never
 * rests on a dark frame. It is cut paper: a grain, a lamp gradient, laid lines, a 1.5 px rim-lit leading edge.
 */
const SHEET_W = 0.7 * 1280;
const SLANT = 70;
function sheetAt(t: number, b: B) {
  const u = sm((t - b.wipeA) / (b.wipeB - b.wipeA));
  const x0 = lerp(1280 + SLANT + 30, -SHEET_W - SLANT - 30, u);
  // edge x at height y: the slant plus a faint hand-cut waver
  const lead = (y: number) => x0 + SLANT * (y / 720 - 0.5) + Math.sin(y * 0.031 + 0.4) * 2.4 + (hash1(Math.floor(y / 36), 11) - 0.5) * 2;
  const trail = (y: number) => x0 + SHEET_W + SLANT * (y / 720 - 0.5) + Math.sin(y * 0.027 + 1.3) * 2.4 + (hash1(Math.floor(y / 36), 12) - 0.5) * 2;
  return { u, lead, trail };
}
const EDGE_YS = Array.from({ length: 21 }, (_, i) => -12 + i * 37.2);

let GRAIN: HTMLCanvasElement | null = null;
function grain(): HTMLCanvasElement {
  if (GRAIN) return GRAIN;
  const g = makeCanvas(192, 192);
  const x = g.getContext('2d')!;
  const im = x.createImageData(192, 192);
  for (let i = 0; i < 192 * 192; i++) {
    const n = hash1(i, 808);
    const fib = hash1(Math.floor(i / 7), 809) > 0.92 ? 40 : 0;
    const v = 128 + (n - 0.5) * 90 + fib;
    im.data[i * 4] = v;
    im.data[i * 4 + 1] = v * 0.92;
    im.data[i * 4 + 2] = v * 0.8;
    im.data[i * 4 + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  GRAIN = g;
  return g;
}

function wipeSheet(f: Frame, t: number, b: B) {
  if (t < b.wipeA || t > b.wipeB) return;
  const c = f.c;
  const S = sheetAt(t, b);
  const sheet = new Path2D();
  sheet.moveTo(S.lead(EDGE_YS[0]), EDGE_YS[0]);
  for (const y of EDGE_YS) sheet.lineTo(S.lead(y), y);
  for (let i = EDGE_YS.length - 1; i >= 0; i--) sheet.lineTo(S.trail(EDGE_YS[i]), EDGE_YS[i]);
  sheet.closePath();
  c.save();
  // a soft shadow cast ahead of the lifted sheet's leading edge, and a contact shadow behind its trailing edge
  for (const [edge, dir, a] of [[S.lead, -1, 0.42], [S.trail, 1, 0.3]] as const) {
    const sh = new Path2D();
    sh.moveTo(edge(EDGE_YS[0]), EDGE_YS[0]);
    for (const y of EDGE_YS) sh.lineTo(edge(y), y);
    for (let i = EDGE_YS.length - 1; i >= 0; i--) sh.lineTo(edge(EDGE_YS[i]) + dir * 64, EDGE_YS[i]);
    sh.closePath();
    const ex = edge(360);
    const g = c.createLinearGradient(ex, 0, ex + dir * 64, 0);
    g.addColorStop(0, withAlpha(f.mood.fg, a));
    g.addColorStop(1, withAlpha(f.mood.fg, 0));
    c.fillStyle = g;
    c.fill(sh);
  }
  // the paper: a dark brown stock, lit warmer toward the lamp (upper left) and falling off below
  c.save();
  c.clip(sheet);
  const mid = S.lead(360) + SHEET_W / 2;
  const body = c.createLinearGradient(mid - SHEET_W / 2, 0, mid + SHEET_W / 2, 720);
  body.addColorStop(0, mixLab(f.mood.set, f.mood.halo, 0.12));
  body.addColorStop(0.5, mixLab(f.mood.fg, f.mood.set, 0.55));
  body.addColorStop(1, mixLab(f.mood.fg, f.mood.set, 0.3));
  c.fillStyle = body;
  c.fillRect(-200, -20, 1700, 760);
  // grain (multiplied in): fibres and tooth
  const pat = c.createPattern(grain(), 'repeat');
  if (pat) {
    c.globalCompositeOperation = 'overlay';
    c.globalAlpha = 0.35;
    c.fillStyle = pat;
    c.fillRect(-200, -20, 1700, 760);
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
  }
  // laid lines, leaning with the sheet
  c.strokeStyle = withAlpha(f.mood.rim, 0.05);
  c.lineWidth = 0.7;
  c.beginPath();
  for (let y = 4; y < 720; y += 8) {
    c.moveTo(-200, y);
    c.lineTo(1500, y);
  }
  c.stroke();
  // a fold crease down the sheet, catching the lamp
  c.strokeStyle = withAlpha(f.mood.rim, 0.1);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(S.lead(-10) + SHEET_W * 0.38, -10);
  c.lineTo(S.lead(730) + SHEET_W * 0.41, 730);
  c.stroke();
  c.restore();
  // the lamp catches the cut edges: a 1.5 px rim on the leading edge (it faces the lamp), a dimmer one trailing
  for (const [edge, a, w] of [[S.lead, 0.85, 1.6], [S.trail, 0.3, 1]] as const) {
    c.strokeStyle = withAlpha(mixLab(f.mood.rim, f.mood.halo, 0.3), a);
    c.lineWidth = w;
    c.beginPath();
    EDGE_YS.forEach((y, i) => (i ? c.lineTo(edge(y), y) : c.moveTo(edge(y), y)));
    c.stroke();
  }
  c.restore();
}

/** the workshop, painted into its own frame, shown only behind (to the right of) the sheet's trailing edge */
let SUB: HTMLCanvasElement | null = null;
function workshopBehindSheet(f: Frame, t: number, b: B) {
  const c = f.c;
  const cv = c.canvas;
  if (!SUB || SUB.width !== cv.width || SUB.height !== cv.height) SUB = makeCanvas(cv.width, cv.height);
  const g = SUB.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.filter = 'none';
  g.clearRect(0, 0, SUB.width, SUB.height);
  const sf = createFrame({ c: g, pxScale: f.pxScale, t, fps: f.fps, frame: f.frame, seed: f.seed, mood: f.mood, weave: 0 });
  paintWorkshop(sf, t, b);
  const S = sheetAt(t, b);
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.filter = 'none';
  c.beginPath();
  c.moveTo(1400, EDGE_YS[0]);
  for (const y of EDGE_YS) c.lineTo(S.trail(y) - 1, y);
  c.lineTo(1400, EDGE_YS[EDGE_YS.length - 1]);
  c.closePath();
  c.clip();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.drawImage(SUB, 0, 0);
  c.restore();
}
