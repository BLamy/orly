/**
 * ch05-s07 — the KNOWLEDGE suspect gets its own candle: engineers type rules into an expert system that is rated
 * above Stanford specialists in a blinded test, while the ward door stays shut (candleAmber throughout, 17.29 s).
 *
 * CAMERA: SHELF (low macro) with a 1.2 s BOARD insert on the S2 card, then the flame push onto the paper stage.
 *   0.2 → 2.6     plain cut from the board: the candle shelf beneath it, the three spent candles at left (1943 dark
 *                 sleeve, 1958 guttered, 1969 out, still smoking) and a new, uncut candle; the hands come in from
 *                 the lamp side with a matchbox and strike
 *   'suspect'     the match flares → INSERT: the KNOWLEDGE card (S2, the drawer of index cards) catches the light
 *   'candle'      back on the shelf: the match touches the wick; the knowledge candle is lit on its top ring
 *                 (no sleeve yet), its base tag c. 1980; the belief is set in the era face (VT323):
 *                 INTELLIGENCE IS KNOWLEDGE, / TYPED IN BY HAND
 *   'knowledge'   the push through the flame onto the stage: the same candle, huge, its amber pool on the floor.
 *                 Inside the pool, facing the flame, anonymous knowledge engineers copy rules from tall stacks of
 *                 index cards onto terminals; paper strips printed IF … THEN drift up toward the flame like sparks.
 *                 At the pool's left edge a clinician at a time-sharing terminal answers question after question:
 *                 on the screen, WHY?. At the right rim, half in shadow, FACING OUT: a small figure holding the
 *                 trained lantern network from ch05-s04 like a hand-lantern (the connectionists).
 *   'system'      a blinded-test plate drops on two strings in front of the stage: ten sealed envelopes (cases),
 *                 eight blindfolded judges; on 'rated' the program's bar grows to 65 %, on 'Stanford' the
 *                 specialists' range (42.5–62.5 %) appears as a band. Caption: MYCIN · blinded test, 1979 ·
 *                 acceptable: 65% vs 42.5–62.5%
 *   'yet'         the camera drifts left toward the clinician and the ward door at the back (the plate, hung at the
 *                 right, holds until 'routine' so both bars can be read, then rises out)
 *   'never'       the clinician's screen goes quiet; the typing stops; the ward door behind him stays shut
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose } from '../../../film';
import { FONT, LAYERS, MOODS, POSES, addPose, blendPose, defineShot, legibleSize, mixLab, overscan, paintContext, pose, setPaintContext, softPlate, toLayer, toScreen, withAlpha, withLife } from '../../../film';
import { hands } from '../cast';
import { STUDY, STUDY_CAMS, candleX, studyCase, studyNear, studyRoom } from '../sets/study';
import { boardStateAt, shelfStateAt } from '../sets/studyState';
import { beliefCandle, candleFlame } from '../sets/beliefCandle';
import { STAGE, candleStage, floorShadow, stageGeo } from '../sets/candleStage';
import { waxCandle } from '../sets/ch02-s04-waxCandle';
import { glow } from '../../../film/silhouette/metaphors/kit';
import {
  GEN, cardStack, clamp01, softArmHands, handLantern, ifThenStrip, lerp, mixCam, officeStool, phosphorOf, pulse, simpleDesk, sm, terminal80, terminalScreen, tq12, win,
} from '../sets/ch05-s07-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch05-s07';

// ------------------------------------------------------------------------------------------------ the shelf
const VIEWS_END = shelfStateAt(ID, 'end');
const KNOW = VIEWS_END.find((v) => v.id === 'knowledge')!;
const SHELF_X = candleX(VIEWS_END, 'knowledge');
const SHELF_FLAME = candleFlame({ x: SHELF_X, y: STUDY.shelf.y, view: KNOW, s: STUDY.shelf.s });
// a slow truck (~120 px on screen) that settles the new candle on the right third, the spent ones to its left
// (review r1) a longer truck (~150 px) so the wall, the shelf and the blurred desk corner on L5 slide apart
// (review r2) the new candle sits on the right third from the FIRST frame (not centre): the move is a small truck left
// with a rise and a dolly in, so the spent candles open up on the left while the desk corner (L5) slides past
const CAM_SHELF0: Camera3 = { x: SHELF_X - 110, y: STUDY.shelf.y - 150, z: 396, lens: 1 };
const CAM_SHELF1: Camera3 = { x: SHELF_X - 142, y: STUDY.shelf.y - 140, z: 440, lens: 1 };
const CAM_FLAME: Camera3 = { x: SHELF_FLAME.x, y: SHELF_FLAME.y - 6, z: 900, lens: 1.4 };
// the narration is ABOUT this card ('our second suspect'): the insert pushes in until its KNOWLEDGE lettering
// clears the 22 px (1080p) floor, the card a little left of centre with RULES above and LEARNING below it
const CAM_INS0: Camera3 = { ...STUDY_CAMS.insert('S2', 650), x: STUDY_CAMS.insert('S2').x + 26, y: STUDY_CAMS.insert('S2').y + 4 };
const CAM_INS1: Camera3 = { ...STUDY_CAMS.insert('S2', 735), x: STUDY_CAMS.insert('S2').x + 16, y: STUDY_CAMS.insert('S2').y + 2 };
const SHELF_CAMS = [CAM_SHELF0, CAM_SHELF1, STUDY_CAMS.board, CAM_INS0];

// ------------------------------------------------------------------------------------------------ the stage
const CX = 540;
/** the new candle is uncut (no sleeve yet): the ch03-s03 stage scale keeps its flame inside the wide frame */
const STAGE_S = 1.62;
const GEO = stageGeo({ candle: KNOW, candleX: CX, s: STAGE_S });
const FLAME_Y = GEO.flame.y;
const FY = STAGE.floorY;

// the clinician at the pool's left edge, facing right, at a front-view terminal (WHY? on its screen)
const CLIN_X = 196;
const CLIN = GEN.clinician;
const CLIN_HAND = CLIN.anchor({ x: CLIN_X, y: FY, facing: 'right', pose: POSES.type }, 'handF');
const CLIN_DESK_Y = Math.round(CLIN_HAND.y + 9);
const CLIN_TERM = { x: CLIN_X + 108, y: CLIN_DESK_Y, s: 1.3, view: 'front' as const };
// the knowledge engineer in the pool, facing the flame, at a side-view terminal; card stacks on the desk and floor
const E1_X = 760;
const E1 = GEN.engineerA;
const E1_HAND = E1.anchor({ x: E1_X, y: FY, facing: 'left', pose: POSES.type }, 'handF');
const E1_DESK_Y = Math.round(E1_HAND.y + 9);
const E1_TERM = { x: E1_X - 104, y: E1_DESK_Y, s: 1.0, view: 'side' as const, facing: 'right' as const };
// a second engineer one rank back (L3)
const E2_X = 930;
const E2 = GEN.engineerB;
const E2_HAND = E2.anchor({ x: E2_X, y: FY, facing: 'left', pose: POSES.type }, 'handF');
const E2_DESK_Y = Math.round(E2_HAND.y + 9);
// the connectionist at the right rim, facing OUT, the lantern network held forward like a hand-lantern
const CONN_X = GEO.rimX + 52;
const CONN = GEN.connectionist;
const CONN_HOLD: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -1, neck: 6, head: -4, shoulderF: 62, elbowF: 26, wristF: -20, shoulderB: -8, elbowB: 16 }, { handF: 'grip' });
const CLIN_REST: Pose = { ...POSES.sit, angles: { ...POSES.sit.angles, torso: 0, neck: 0, head: 6, shoulderF: 8, elbowF: 50, wristF: 6, shoulderB: 6, elbowB: 52 }, handF: 'relaxed', handB: 'relaxed' };
// the ward door at the back of the stage (L3), behind the clinician
const DOOR = { x: 128, w: 150, h: 262 };

interface B {
  D: number;
  strike0: number;
  strikeDur: number;
  insert0: number;
  insert1: number;
  lit: number;
  labelIn: number;
  labelOut: number;
  push: number;
  stage: number;
  /** 'typed' (6.80): one IF … THEN strip drifts through the near plane, big enough to read */
  typed: number;
  system: number;
  rated: number;
  stanford: number;
  /** the program bar grows on 'was' and is full by 'above'; the specialists' band lands on 'above' */
  barAt: number;
  rangeAt: number;
  yet: number;
  never: number;
  plateOut: number;
  drift: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const suspect = T.beat('lit');
    // the strike: the match flares just before 'suspect' (u = .36), touches the wick on 'candle' (u = .6)
    const strike = suspect - 0.3;
    const touch = T.word('L0513', 'candle') + 0.3;
    const strikeDur = (touch - strike) / 0.24;
    const b: B = {
      D,
      strikeDur,
      strike0: strike - 0.36 * strikeDur,
      insert0: suspect - 0.18,
      insert1: T.word('L0513', 'candle'),
      lit: touch,
      // the candle rule: the belief's horizontal label comes up as soon as the candle is named and lit
      // (this shot draws its own label: the kit's naming card would print the candle's whole date range here)
      labelIn: Math.min(touch + 0.15, T.word('L0513', 'intelligence') - 0.3),
      // (review r1) out by 8.0, before 'One expert system': the plate is the next thing to read
      labelOut: Math.min(T.wordEnd('L0513', 'hand') + 0.1, T.word('L0514', 'One') - 0.9),
      push: T.beat('stage') - 0.62,
      stage: T.beat('stage'),
      typed: T.word('L0513', 'typed'),
      system: T.beat('test'),
      rated: T.word('L0514', 'rated'),
      stanford: T.word('L0514', 'Stanford'),
      barAt: T.word('L0514', 'was') - 0.12,
      rangeAt: T.word('L0514', 'above') - 0.12,
      yet: T.word('L0514', 'yet'),
      never: T.beat('never'),
      // (review r1) the plate lifts out from ~14.3 so the frame is clear by 'never': the payoff (the screen
      // going quiet, the ward door's light going out) plays on an open stage
      plateOut: T.beat('never') - 0.47,
      drift: T.word('L0514', 'yet') - 0.45,
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const b = scene.b as B;
    // the bright pass over the cut: rises through the push, peaks at the cut, falls as the stage pulls back
    // (capped near L* 80 and kept to ~0.6 s around 'knowledge')
    const flash = t < b.stage ? win(t, b.stage - 0.3, b.stage) : 1 - win(t, b.stage, b.stage + 0.3);
    if (t < b.insert0 || (t >= b.insert1 && t < b.stage)) shelf(f, t, tq, b);
    else if (t < b.insert1) insert(f, t, b);
    else stage(f, t, tq, b);

    if (flash > 0.002) {
      const c = f.c;
      const P = f.mood;
      c.save();
      c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(640, 360, 20, 640, 360, 900);
      // (review r1) capped: a warm lift over the cut, never a white-out (the candle edge and the planks keep
      // their darks, at least 25% under the flame)
      g.addColorStop(0, withAlpha(P.core, 0.1 * flash));
      g.addColorStop(0.4, withAlpha(mixLab(P.core, P.halo, 0.5), 0.06 * flash));
      g.addColorStop(1, withAlpha(P.halo, 0));
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
      c.restore();
    }
    // (review r1) through the push and the cut the edges stay dark: a vignette round the flame keeps the candle's
    // edge and the planks well under the flame's value
    const vig = t < b.stage ? win(t, b.push, b.push + 0.4) : 1 - win(t, b.stage + 0.2, b.stage + 0.9);
    if (vig > 0.01) {
      const c = f.c;
      c.save();
      c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
      const fx = 640, fy = t < b.stage ? 330 : 300;
      const g = c.createRadialGradient(fx, fy, 50, fx, fy + 120, 640);
      g.addColorStop(0, withAlpha(f.mood.ink, 0));
      g.addColorStop(0.45, withAlpha(f.mood.ink, 0.3 * vig));
      g.addColorStop(1, withAlpha(f.mood.ink, 0.62 * vig));
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
      c.restore();
    }
    // screen-locked type: the belief (era face), then the blinded-test plate with its caption
    // the belief steps aside through the flame push and returns once the stage has resolved (~6.6 s)
    const through = t < b.stage ? 1 - win(t, b.stage - 0.45, b.stage - 0.2) : win(t, b.stage + 0.45, b.stage + 0.75);
    const lab = win(t, b.labelIn, b.labelIn + 0.4) * (1 - win(t, b.labelOut, b.labelOut + 0.4)) * through;
    // on the shelf it sits on the clear wall right of the new candle (below the withdrawn arm); on the stage, upper right
    if (lab > 0.01) {
      if (t < b.stage) beliefLabel(f, lab, 1082, 452, 0.84);
      else beliefLabel(f, lab, 948, 96);
    }
    if (t >= b.system - 0.2 && t < b.plateOut + 0.5) testPlate(f, t, tq, b);
    if (t > b.typed - 0.5 && t < b.typed + 1.9) nearStrip(f, t, b);
  },
});

// ================================================================================================= SHELF
function shelf(f: Frame, t: number, tq: number, b: B) {
  // strike → touch on the action's own clock; after the touch (u = .6) the hold and the withdrawal are
  // compressed so the hands are gone before the push into the flame
  const uRaw = (tq - b.strike0) / b.strikeDur;
  const u = uRaw <= 0.6 ? clamp01(uRaw) : Math.min(1, 0.6 + (0.4 * (tq - b.lit)) / Math.max(0.6, b.push - 0.1 - b.lit));
  const caught = tq >= b.lit;
  const flameK = caught ? Math.min(1, 0.55 + 0.45 * sm((tq - b.lit) / 0.3)) : 0;
  let cam = mixCam(CAM_SHELF0, CAM_SHELF1, sm(t / (b.lit + 0.6)));
  const pushU = t > b.push ? sm((t - b.push) / (b.stage - b.push)) : 0;
  if (t > b.push) cam = mixCam(cam, CAM_FLAME, pushU);
  // (review r1) the bloom is capped through the push: the room's lights come DOWN as the lens closes on the
  // flame, so the candle edge and the planks keep their darks
  const bloomK = 1 - 0.7 * pushU;
  f.camera(cam);
  studyRoom(f, { key: ID, cams: SHELF_CAMS, outside: { mood: 'labGreen', kind: 'night' } });
  if (t >= b.insert1) {
    const fs = toScreen(LAYERS.L4, cam, SHELF_FLAME.x, SHELF_FLAME.y);
    const k = 0.25 * win(t, b.insert1, b.insert1 + 0.6) * bloomK;
    f.layer('L2', (c, env) => {
      const p = toLayer(LAYERS.L2, cam, fs.x, fs.y + 60);
      glow(c, p.x, p.y, 520, mixLab(env.mood.halo, env.mood.core, 0.3), k);
      glow(c, p.x, p.y - 20, 220, env.mood.core, 0.5 * k);
    });
  }
  // ONE forearm enters from the right edge with the match; the matchbox hand stays at the bottom edge
  const tgt = toScreen(LAYERS.L4, cam, SHELF_FLAME.x, SHELF_FLAME.y);
  const entry = {
    R: toLayer(LAYERS.L4, cam, tgt.x + 1150, tgt.y + 1150 * Math.tan(0.35)),
    L: toLayer(LAYERS.L4, cam, tgt.x + 240, 1500),
  };
  const strikeAt = toLayer(LAYERS.L4, cam, Math.min(1190, tgt.x + 250), 700);
  const hp = u > 0 && u < 1 ? hands.act('strikeLight', u, wickTarget(entry, strikeAt), { entry, scale: 0.8, strikeAt }) : null;
  // lighting the candle changes the room: a warm halo grows on the wall behind the shelf from 'candle'

  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    flames: false,
    shelf: { hideUnlit: false, only: ['logic', 'learns', 'sterile'], drawFlames: false },
    extra: (c, env) => {
      // the new candle: full stub, flame on the top ring once lit, its tag c. 1980
      // the naming rule's dim on the spent neighbours while the new candle's label is up
      const dimK = 0.5 * win(t, b.labelIn, b.labelIn + 0.4);
      if (dimK > 0.01) {
        // a soft elliptical shade over the three spent candles (no hard edge on the wall)
        c.save();
        c.translate(SHELF_X - 196, STUDY.shelf.y - 150);
        c.scale(1, 0.95);
        const g = c.createRadialGradient(0, 0, 60, 0, 0, 240);
        g.addColorStop(0, withAlpha(env.mood.ink, dimK));
        g.addColorStop(0.7, withAlpha(env.mood.ink, 0.7 * dimK));
        g.addColorStop(1, withAlpha(env.mood.ink, 0));
        c.fillStyle = g;
        c.fillRect(-240, -240, 480, 480);
        c.restore();
      }
      beliefCandle(c, { x: SHELF_X, y: STUDY.shelf.y, view: KNOW, s: STUDY.shelf.s, flame: flameK, letters: 0, drawFlame: false, named: 0 }, env);
      waxCandle(c, { x: SHELF_X, y: STUDY.shelf.y, view: KNOW, s: STUDY.shelf.s, flame: flameK, letters: 0.85 }, env);
      if (hp) softArmHands(c, hp, env);
    },
  });
  const fl = hp ? hands.flameAt(hp) : null;
  if (fl) f.practical({ x: fl.x, y: fl.y, kind: 'candle', seed: 1980, intensity: 0.85 + 0.6 * pulse(t, b.strike0 + 0.36 * b.strikeDur - 0.05, 0.08, 0.4), radius: 34 });
  if (flameK > 0) f.practical({ x: SHELF_FLAME.x, y: SHELF_FLAME.y + 2, kind: 'candle', seed: 1981, intensity: 0.9 * flameK * bloomK, radius: (40 + 10 * flameK) * (1 - 0.45 * pushU) });
  if (cam.z < 560) studyNear(f, { key: ID, cams: SHELF_CAMS, file: true });
  if (cam.z < 600) deskCorner(f, cam);
}

/** the third plane of the shelf macro (L5): the desk's near corner, with two books lying flat and an inkwell holding a
 *  quill. (review r2) Authored in SCREEN px (the L5 scale at this macro is ~4x, which turned the first cut into a
 *  smear): its top edge sits at y 652, so the slab covers under 10% of frame, and only the inkwell and the quill's
 *  thin profile rise above it. Baked crisp, then a soft 4.5 px blur (it was ~28 px), so it reads as a cut edge. */
const DESK_TOP = 652;
const DESK_K0 = toScreen(LAYERS.L5, CAM_SHELF0, 0, 0).k;
const DESK_AT = toLayer(LAYERS.L5, CAM_SHELF0, -70, DESK_TOP);
function deskCorner(f: Frame, cam: Camera3) {
  void cam;
  f.layer('L5', (c, env) => {
    // local art box in screen px: x -10 … 560, y -170 … 90 (the desk top at y = 0)
    const X0 = -10, Y0 = -170, W = 570, H = 260, BL = 4.5;
    c.save();
    c.translate(DESK_AT.x, DESK_AT.y);
    c.scale(1 / DESK_K0, 1 / DESK_K0);
    f.cached(`${ID}/deskCorner2/${env.mood.id}`, W, H, (cc) => {
      cc.translate(-X0, -Y0);
      const ink = env.fill('fg');
      const rim = env.mood.rim;
      cc.fillStyle = ink;
      // the desk: its top running in from the left edge to a moulded near corner, the front face dropping away
      cc.beginPath();
      cc.moveTo(X0, 0);
      cc.lineTo(458, 0);
      cc.quadraticCurveTo(472, 0, 474, 6);
      cc.lineTo(476, 12);
      cc.quadraticCurveTo(470, 14, 468, 20);
      cc.lineTo(486, 90);
      cc.lineTo(X0, 90);
      cc.closePath();
      cc.fill();
      cc.fillStyle = withAlpha(rim, 0.34);
      cc.fillRect(X0, -0.5, 466 - X0, 1.6);
      // two books lying flat, the upper one set back and turned a little
      cc.fillStyle = ink;
      cc.beginPath();
      cc.roundRect(54, -24, 176, 24, [3, 3, 0, 0]);
      cc.fill();
      cc.save();
      cc.translate(128, -24);
      cc.rotate(-0.035);
      cc.beginPath();
      cc.roundRect(-58, -17, 120, 17, [2, 2, 0, 0]);
      cc.fill();
      cc.restore();
      cc.fillStyle = withAlpha(rim, 0.26);
      cc.fillRect(56, -24, 172, 1.4);
      cc.fillRect(72, -41, 112, 1.2);
      // the page block's fore-edge on the lower book, a lighter band
      cc.fillStyle = withAlpha(env.mood.halo, 0.12);
      cc.fillRect(62, -19, 160, 12);
      // the inkwell: a squat bottle with a collar, the quill leaning out of it
      const ix = 344;
      cc.fillStyle = ink;
      cc.beginPath();
      cc.moveTo(ix - 26, 0);
      cc.lineTo(ix - 26, -16);
      cc.quadraticCurveTo(ix - 26, -26, ix - 12, -28);
      cc.lineTo(ix - 9, -34);
      cc.lineTo(ix + 9, -34);
      cc.lineTo(ix + 12, -28);
      cc.quadraticCurveTo(ix + 26, -26, ix + 26, -16);
      cc.lineTo(ix + 26, 0);
      cc.closePath();
      cc.fill();
      cc.fillRect(ix - 12, -38, 24, 5);
      cc.fillStyle = withAlpha(rim, 0.36);
      cc.fillRect(ix - 24, -25, 14, 1.4);
      cc.fillRect(ix - 12, -38, 24, 1.2);
      // the quill: a shaft and a curved vane, leaning back over the books
      cc.fillStyle = ink;
      cc.save();
      cc.translate(ix - 2, -30);
      cc.rotate(-0.5);
      cc.fillRect(-1.2, -150, 2.4, 152);
      cc.beginPath();
      cc.moveTo(0, -40);
      cc.bezierCurveTo(-13, -70, -14, -120, -2, -158);
      cc.bezierCurveTo(4, -120, 6, -80, 0, -40);
      cc.closePath();
      cc.fill();
      cc.beginPath();
      cc.moveTo(0, -46);
      cc.bezierCurveTo(9, -80, 9, -120, 1, -150);
      cc.lineTo(-1, -150);
      cc.closePath();
      cc.fill();
      cc.restore();
    }, { blur: BL })(c, X0, Y0);
    c.restore();
  });
}

/** the hand target that puts the match flame (at the hold) right at the wick */
function wickTarget(entry: { R: { x: number; y: number }; L: { x: number; y: number } }, strikeAt: { x: number; y: number }) {
  let tg = { x: SHELF_FLAME.x, y: SHELF_FLAME.y };
  for (let i = 0; i < 4; i++) {
    const fl = hands.flameAt(hands.act('strikeLight', 0.7, tg, { entry, scale: 0.8, strikeAt }));
    if (!fl) break;
    tg = { x: tg.x + (SHELF_FLAME.x - fl.x), y: tg.y + (SHELF_FLAME.y + 4 - fl.y) };
  }
  return tg;
}

// ================================================================================================= INSERT
/** the KNOWLEDGE suspect card catches the light (it is lit from within from here on) */
function insert(f: Frame, t: number, b: B) {
  const cam = mixCam(CAM_INS0, CAM_INS1, sm((t - b.insert0) / (b.insert1 - b.insert0)));
  f.camera(cam);
  studyRoom(f, { key: ID, cams: SHELF_CAMS, outside: { mood: 'labGreen', kind: 'night' } });
  const st = boardStateAt(ID, 'start');
  const catchAt = b.insert0 + 0.18;
  // (review r1) the card keeps its near-black ink: no from-within wash over the drawer and the lettering. The
  // light is a bloom on its EDGE and a halo AROUND it, and the neighbours sink (already dark on 'suspect')
  for (const c of st.cards) if (c.id === 'S2') c.lit = false;
  const k = pulse(t, catchAt - 0.05, 0.22, 1.4) + 0.35 * win(t, catchAt, catchAt + 0.6);
  studyCase(f, { shot: ID, when: 'start', key: ID, shelf: false, wall: false, xray: false, board: { state: st } });
  f.layer('L4', (c, env) => {
    const p = { x: STUDY.board.x + 80, y: STUDY.board.y + 300 };
    const HW = 59, HH = 48;
    const sink = 0.74 * win(t, b.insert0 - 0.12, b.insert0 + 0.06);
    // everything but the card goes down: a hole the card's size, feathered out over ~90 px
    c.save();
    const hole = new Path2D();
    hole.rect(p.x - 900, p.y - 700, 1800, 1400);
    hole.rect(p.x - HW - 3, p.y - HH - 3, 2 * HW + 6, 2 * HH + 6);
    c.clip(hole, 'evenodd');
    c.translate(p.x, p.y);
    c.scale(1, HH / HW);
    const g = c.createRadialGradient(0, 0, HW + 4, 0, 0, HW + 96);
    g.addColorStop(0, withAlpha(env.mood.ink, 0.25 * sink));
    g.addColorStop(1, withAlpha(env.mood.ink, sink));
    c.fillStyle = g;
    c.fillRect(-900, -900, 1800, 1800);
    c.restore();
    // the halo: outside the card only (clipped), warm, hugging the edge
    c.save();
    c.clip(hole, 'evenodd');
    glow(c, p.x, p.y, 150 + 30 * k, env.mood.halo, 0.42 * k);
    glow(c, p.x, p.y, 96, env.mood.core, 0.22 * k);
    c.restore();
    // the edge bloom: a bright hairline and a soft second line just outside it
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(env.mood.core, 0.85 * Math.min(1, k));
    c.lineWidth = 1.8;
    c.strokeRect(p.x - HW, p.y - HH, 2 * HW, 2 * HH);
    c.strokeStyle = withAlpha(env.mood.halo, 0.35 * Math.min(1, k));
    c.lineWidth = 5;
    c.strokeRect(p.x - HW - 3, p.y - HH - 3, 2 * HW + 6, 2 * HH + 6);
    c.restore();
  });
  studyNear(f, { key: ID, cams: SHELF_CAMS, file: true });
}

// ================================================================================================= STAGE
function stageCam(t: number, b: B): Camera3 {
  // (review r2) ONE continuous pull and ONE push, no ping-pong. The cut lands mid-distance (the flame and the candle's
  // shoulder) and pulls back on a single decelerating curve (an exponential settle, ~z 96 by 7.3 s so the pool's
  // silhouettes are in frame on 'typed') to z 45 on 'system'; it then drifts a few px toward the clinician and,
  // after 'never', makes one slow push toward the ward door that keeps the connectionist's lantern in frame.
  const C0: Camera3 = { x: CX + 14, y: FLAME_Y + 120, z: 420, lens: 1 };
  const CW: Camera3 = { x: 612, y: 384, z: 45, lens: 1 };
  const CN: Camera3 = { x: 604, y: 388, z: 45, lens: 1 };
  const CD: Camera3 = { x: 600, y: 394, z: 70, lens: 1 };
  if (t < b.system) {
    const U = b.system - b.stage, K = 1.6;
    const u = clamp01((t - b.stage) / U);
    const e = (1 - Math.exp(-K * U * u)) / (1 - Math.exp(-K * U));
    return mixCam(C0, CW, e);
  }
  if (t < b.never) return mixCam(CW, CN, sm((t - b.system) / (b.never - b.system)));
  return mixCam(CN, CD, sm((t - b.never) / (b.D - b.never)));
}

function stage(f: Frame, t: number, tq: number, b: B) {
  const cam = stageCam(t, b);
  f.camera(cam);
  const CAMS: Camera3[] = [stageCam(b.stage, b), stageCam(b.stage + 1.25, b), stageCam(b.system, b), stageCam(b.never, b), stageCam(b.D, b)];
  // (review r1) on 'never' exactly the screen goes dark: done by ~15.0 s
  const quiet = win(t, b.never - 0.02, b.never + 0.24);
  const typing = tq < b.never;
  // the clinician: types an answer, pauses, types again (question after question); then hands drop
  const clinBeat = Math.floor((tq - b.stage) / 1.4);
  const clinTyping = typing && (clinBeat % 3 !== 2);
  const clinP = withLife(typing ? (clinTyping ? typeLoop(POSES.type, tq) : POSES.type) : blendPose(POSES.type, CLIN_REST, sm((tq - b.never) / 0.5)), tq, 31, 0.6);
  const e1P = withLife(typing ? typeLoop(POSES.type, tq + 0.08) : blendPose(POSES.type, CLIN_REST, sm((tq - b.never - 0.15) / 0.5)), tq, 57, 0.6);
  const e2P = withLife(typing ? typeLoop(POSES.type, tq + 0.17) : POSES.type, tq, 83, 0.6);
  const connP = withLife(CONN_HOLD, tq, 19, 0.8);
  const screenK = 1 - 0.88 * quiet;
  const whyA = (clinTyping ? 0.55 : 1) * (1 - quiet);

  // the stage candle is the same candle: its naming label is this shot's own (beliefLabel), so the kit's
  // naming card is held off while the stage paints
  const pc = paintContext();
  setPaintContext(null);
  candleStage(f, {
    key: ID,
    cams: CAMS,
    candle: KNOW,
    candleX: CX,
    s: STAGE_S,
    flame: 1,
    letters: 0,
    back: (c, env) => {
      wardDoor(f, c, env, CAMS, t, b);
      // the second engineer, one rank back
      simpleDesk(c, E2_X - 150, E2_X - 52, E2_DESK_Y, FY, env);
      cardStack(c, E2_X - 132, E2_DESK_Y, 24, 92, env, 7);
      terminal80(c, { x: E2_X - 92, y: E2_DESK_Y, view: 'side', facing: 'right', screen: 0.85 }, env);
      officeStool(c, E2_X + 8, FY - 118, FY, 'left', env);
      E2.draw(c, { x: E2_X, y: FY, facing: 'left', pose: e2P }, env);
    },
    draw: (c, env, g) => {
      doorSeam(c, env, cam, t, b);
      waxCandle(c, { x: g.candleX, y: g.floorY, view: KNOW, s: STAGE_S, flame: 1, letters: 0.42 }, env);
      // shadows first (away from the candle), then furniture and figures
      floorShadow(c, g, CONN_X, (cc) => CONN.draw(cc, { x: 0, y: 0, facing: 'right', pose: connP }, env), env, 1.05);
      floorShadow(c, g, E1_X, (cc) => E1.draw(cc, { x: 0, y: 0, facing: 'left', pose: e1P }, env), env, 0.7);
      floorShadow(c, g, CLIN_X, (cc) => CLIN.draw(cc, { x: 0, y: 0, facing: 'right', pose: clinP }, env), env, 0.7);
      // the clinician's corner: desk, front-view terminal, WHY?
      simpleDesk(c, CLIN_X + 30, CLIN_X + 176, CLIN_DESK_Y, FY, env);
      terminal80(c, { ...CLIN_TERM, screen: screenK, word: 'WHY?', wordAlpha: whyA, rows: 0.5 * (1 - quiet) }, env);
      officeStool(c, CLIN_X - 8, FY - 118, FY, 'right', env);
      CLIN.draw(c, { x: CLIN_X, y: FY, facing: 'right', pose: clinP, cutLines: true, light: { x: 1, y: -0.4, floor: 0.2 } }, env);
      // the engineer: stacks of index cards, the terminal he copies them into
      cardStack(c, E1_X + 92, FY, 34, 168, env, 3);
      cardStack(c, E1_X + 128, FY, 30, 120, env, 4);
      // (the desk's near leg stands clear of the candle's base tag)
      simpleDesk(c, E1_X - 126, E1_X - 40, E1_DESK_Y, FY, env);
      cardStack(c, E1_X - 120, E1_DESK_Y, 26, 104, env, 5);
      terminal80(c, { ...E1_TERM, screen: 0.9 }, env);
      officeStool(c, E1_X + 10, FY - 118, FY, 'left', env);
      E1.draw(c, { x: E1_X, y: FY, facing: 'left', pose: e1P, cutLines: true, light: { x: -1, y: -0.4, floor: 0.2 } }, env);
      // the connectionist at the rim, facing out, the lantern network held forward
      CONN.draw(c, { x: CONN_X, y: FY, facing: 'right', pose: connP, cutLines: true, light: { x: -1, y: -0.35, floor: 0.04 } }, env);
      const hand = CONN.anchor({ x: CONN_X, y: FY, facing: 'right', pose: connP }, 'handF');
      handLantern(c, hand.x + 2, hand.y - 4, 84, env, { light: 0.95 });
      // IF … THEN strips rising like sparks toward the flame
      strips(c, env, t, b, g.flame);
    },
  });
  setPaintContext(pc);
  // the screens' light (phosphor practicals) and the held lanterns' faint glow
  const cs = terminalScreen(CLIN_TERM);
  f.practical({ x: cs.x, y: cs.y + 30, kind: 'screen', seed: 1979, intensity: 0.32 * screenK, radius: 40 });
  const es = terminalScreen(E1_TERM);
  f.practical({ x: es.x, y: es.y, kind: 'screen', seed: 1984, intensity: 0.45, radius: 36 });
  // the stage lip (L5): once the camera is back from the flame
  const lipA = clamp01((420 - cam.z) / 160);
  if (lipA > 0.01) stageLip(f, CAMS, lipA);
}

/** a two-drawing typing loop on twos */
function typeLoop(base: Pose, tq: number): Pose {
  const tick = Math.floor(tq * 12 + 1e-6);
  const d = Math.floor(tick / 2) % 2;
  return addPose(base, d ? { elbowF: 3.5, wristF: -4, elbowB: -3, wristB: 3.5, head: 0.6 } : { elbowF: -3.5, wristF: 4, elbowB: 3, wristB: -3.5 });
}

/** the IF … THEN strips: born at the typists' terminals, drifting up toward the flame like sparks */
function strips(c: C, env: PaintEnv, t: number, b: B, flame: { x: number; y: number }) {
  const LIFE = 3.4;
  const srcs = [
    { x: E1_TERM.x + 4, y: E1_DESK_Y - 70 },
    { x: CLIN_TERM.x + 6, y: CLIN_DESK_Y - 76 },
    { x: E2_X - 96, y: E2_DESK_Y - 76 },
  ];
  for (let i = 0; i < 26; i++) {
    const born = b.stage + 0.1 + i * 0.36 + 0.2 * (0.5 + 0.5 * Math.sin(i * 7.3));
    if (born > b.never) break;
    const age = t - born;
    if (age < 0 || age > LIFE) continue;
    const src = srcs[i % 5 === 1 ? 1 : i % 4 === 3 ? 2 : 0];
    const u = age / LIFE;
    const x = lerp(src.x, flame.x + (src.x < flame.x ? -40 : 40) + 30 * Math.sin(i * 2.1), sm(u) * 0.75) + 14 * Math.sin(age * 2.2 + i);
    const y = src.y - 70 * age - 6 * age * age;
    const a = win(age, 0, 0.25) * (1 - win(age, LIFE - 0.9, LIFE));
    ifThenStrip(c, x, y, 1.05 - 0.25 * u, 0.25 * Math.sin(age * 1.6 + i * 1.3), a, env);
  }
}

/** the hospital ward door at the back of the stage (L3): double doors with porthole windows, a seam of light.
 *  (review r2) Behind the portholes, backlit ward light with a small ward silhouette at haze ~0.4: an IV stand with
 *  its bag in the left porthole, the end of a hospital bed (footboard rails, a chart) in the right one. */
const PORT_R = 19;
const PORT_Y = 76;
function wardDoor(f: Frame, c: C, env: PaintEnv, cams: Camera3[], t: number, b: B) {
  void cams;
  const x0 = DOOR.x - DOOR.w / 2, y0 = FY - DOOR.h;
  const behind = mixLab(env.mood.setHaze, env.mood.halo, 0.2);
  const ward = mixLab(env.mood.core, MOODS.winterBlue.halo, 0.35);
  const ports = [x0 + DOOR.w / 4, x0 + (3 * DOOR.w) / 4];
  const draw = f.cached(`${ID}/door2/${env.mood.id}`, DOOR.w + 80, DOOR.h + 60, (cc) => {
    cc.translate(-x0 + 40, -y0 + 30);
    // frame
    cc.fillStyle = env.fill('ink');
    cc.fillRect(x0 - 16, y0 - 16, DOOR.w + 32, DOOR.h + 16);
    cc.fillStyle = behind;
    cc.fillRect(x0, y0, DOOR.w, DOOR.h);
    // the ward seen through the glass: a cool lit room, its fittings cut at haze ~0.4
    const sil = mixLab(env.fill('ink'), mixLab(behind, ward, 0.5), 0.4);
    for (const [i, cx] of ports.entries()) {
      cc.save();
      cc.beginPath();
      cc.arc(cx, y0 + PORT_Y, PORT_R + 1, 0, Math.PI * 2);
      cc.clip();
      const g = cc.createRadialGradient(cx + 4, y0 + PORT_Y - 8, 2, cx, y0 + PORT_Y, PORT_R + 4);
      g.addColorStop(0, mixLab(ward, '#f2efe6', 0.35));
      g.addColorStop(1, mixLab(ward, behind, 0.45));
      cc.fillStyle = g;
      cc.fillRect(cx - PORT_R - 2, y0 + PORT_Y - PORT_R - 2, 2 * PORT_R + 4, 2 * PORT_R + 4);
      cc.fillStyle = sil;
      const by = y0 + PORT_Y;
      if (i === 0) {
        // an IV stand: a pole on a wheeled base, a hook bar, a drip bag and its line
        cc.fillRect(cx + 3, by - 22, 1.8, 46);
        cc.fillRect(cx - 4, by - 21, 15, 1.6);
        cc.beginPath();
        cc.roundRect(cx - 5, by - 19, 7, 11, 2.5);
        cc.fill();
        cc.fillRect(cx - 1.9, by - 8, 0.9, 12);
        cc.fillRect(cx - 6, by + 15, 20, 1.6);
        // the bed's head rail just in shot at the porthole's left edge
        cc.fillRect(cx - 22, by + 4, 12, 2);
      } else {
        // the end of a bed: a footboard of rails between two posts, the mattress line, a chart hung on it
        cc.fillRect(cx - 16, by - 2, 2.4, 26);
        cc.fillRect(cx + 12, by - 2, 2.4, 26);
        cc.fillRect(cx - 16, by - 2, 30, 2);
        cc.fillRect(cx - 16, by + 9, 30, 1.6);
        for (let k = 0; k < 4; k++) cc.fillRect(cx - 10 + k * 6, by - 1, 1.1, 10);
        cc.fillRect(cx - 24, by - 6, 48, 3.4);
        cc.fillRect(cx - 4, by + 1, 8, 9);
      }
      cc.restore();
    }
    // the two leaves with porthole holes (evenodd)
    const p = new Path2D();
    p.rect(x0, y0, DOOR.w / 2 - 1.5, DOOR.h);
    p.rect(x0 + DOOR.w / 2 + 1.5, y0, DOOR.w / 2 - 1.5, DOOR.h);
    for (const cx of ports) {
      p.moveTo(cx + PORT_R, y0 + PORT_Y);
      p.arc(cx, y0 + PORT_Y, PORT_R, 0, Math.PI * 2);
    }
    cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.55);
    cc.fill(p, 'evenodd');
    // porthole rims, kick plates and push plates (cut-lines)
    cc.strokeStyle = withAlpha(env.mood.rim, 0.22);
    cc.lineWidth = 1.4;
    for (const cx of ports) {
      cc.beginPath();
      cc.arc(cx, y0 + PORT_Y, PORT_R + 1.5, 0, Math.PI * 2);
      cc.stroke();
    }
    cc.strokeStyle = withAlpha(env.mood.rim, 0.18);
    cc.lineWidth = 1.2;
    for (const lx of [x0 + 8, x0 + DOOR.w / 2 + 9]) {
      cc.strokeRect(lx, FY - 46, DOOR.w / 2 - 18, 34);
      cc.strokeRect(lx + DOOR.w / 4 - 14, y0 + 124, 10, 34);
    }
  });
  draw(c, x0 - 40, y0 - 30);
  // the portholes keep their ward light (the ward is there; nobody comes through); they dim a little with the seam
  const seam = doorSeamK(t, b);
  c.save();
  c.fillStyle = withAlpha(env.mood.ink, 0.45 * (1 - seam));
  for (const cx of ports) {
    c.beginPath();
    c.arc(cx, y0 + PORT_Y, PORT_R + 0.5, 0, Math.PI * 2);
    c.fill();
  }
  c.globalCompositeOperation = 'lighter';
  for (const cx of ports) glow(c, cx, y0 + PORT_Y, 40, ward, 0.26 * seam);
  c.restore();
}

/** (review r2) the ward door's own beat on 'never': the seam of light under it NARROWS and dims to ~40% over 0.6 s
 *  (starting just after the screen goes quiet), so the shut door reads as staying shut */
function doorSeamK(t: number, b: B) {
  return 1 - 0.6 * win(t, b.never + 0.1, b.never + 0.7);
}

/** the line of ward light under the door and its spill on the boards, drawn on the action plane (the L4 floor would
 *  cover it on L3): the door's L3 sill is carried into L4 through the current camera */
function doorSeam(c: C, env: PaintEnv, cam: Camera3, t: number, b: B) {
  const seam = doorSeamK(t, b);
  // the seam's height narrows with its light (1 → ~0.4)
  const narrow = seam;
  const sL = toScreen(LAYERS.L3, cam, DOOR.x - DOOR.w / 2 + 3, FY);
  const sR = toScreen(LAYERS.L3, cam, DOOR.x + DOOR.w / 2 - 3, FY);
  const a = toLayer(LAYERS.L4, cam, sL.x, sL.y);
  const z = toLayer(LAYERS.L4, cam, sR.x, sR.y);
  const w = z.x - a.x, y = a.y - 8;
  const ward = mixLab(env.mood.core, MOODS.winterBlue.halo, 0.35);
  const hh = 7 * narrow;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, y + 2 - hh, 0, y + 2);
  g.addColorStop(0, withAlpha(ward, 0));
  g.addColorStop(0.6, withAlpha(ward, 0.6 * seam));
  g.addColorStop(1, withAlpha(ward, 0.95 * seam));
  c.fillStyle = g;
  c.fillRect(a.x, y + 2 - hh, w, hh);
  c.translate(a.x + w / 2, y + 2);
  c.scale(1, 0.12 * narrow);
  const sg = c.createRadialGradient(0, 0, 4, 0, 0, w * 0.8);
  sg.addColorStop(0, withAlpha(ward, 0.5 * seam));
  sg.addColorStop(1, withAlpha(ward, 0));
  c.fillStyle = sg;
  c.fillRect(-w, 0, 2 * w, w);
  c.restore();
}

/** the stage lip (L5): a blurred apron edge with footlight hoods */
function stageLip(f: Frame, cams: Camera3[], a: number) {
  const LIP_Y = 680;
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, cams, 60);
    c.save();
    c.globalAlpha *= a;
    f.cached(`${ID}/lip/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), 160, (cc) => {
      cc.translate(-r.x, -LIP_Y);
      cc.fillStyle = env.fill('fg');
      cc.fillRect(r.x, LIP_Y, r.w, 160);
      cc.fillStyle = withAlpha(env.mood.rim, 0.35);
      cc.fillRect(r.x, LIP_Y, r.w, 2);
      for (let x = Math.ceil(r.x / 150) * 150; x < r.x + r.w; x += 150) {
        cc.fillStyle = env.fill('fg');
        cc.beginPath();
        cc.moveTo(x - 26, LIP_Y + 2);
        cc.quadraticCurveTo(x, LIP_Y - 18, x + 26, LIP_Y + 2);
        cc.closePath();
        cc.fill();
        const g = cc.createRadialGradient(x, LIP_Y - 2, 2, x, LIP_Y - 2, 40);
        g.addColorStop(0, withAlpha(env.mood.halo, 0.35));
        g.addColorStop(1, withAlpha(env.mood.halo, 0));
        cc.fillStyle = g;
        cc.fillRect(x - 40, LIP_Y - 42, 80, 44);
      }
    })(c, r.x, LIP_Y);
    c.restore();
  });
}

/** (review r2) the visual for 'typed in by hand': ONE IF … THEN strip leaves the engineer's terminal and drifts up
 *  and left through the near plane, past the lens, at a cap height of >= 24 px (1080p) for ~1.2 s around 'typed';
 *  the rest stay small sparks rising to the flame. Screen-locked (it is nearer than every layer), moved on twos. */
function nearStrip(f: Frame, t: number, b: B) {
  const c = f.c;
  const tq = tq12(t);
  const t0 = b.typed - 0.45, t1 = b.typed + 1.75;
  const u = clamp01((tq - t0) / (t1 - t0));
  // born small at the engineer's terminal, it grows as it comes toward the lens, then drifts up-left out of the pool
  const src = toScreen(LAYERS.L4, stageCam(t0, b), E1_TERM.x - 40, E1_DESK_Y - 80);
  const grow = sm(clamp01(u / 0.22));
  const x = lerp(src.x, 300, sm(u)) + 10 * Math.sin(tq * 2.3);
  const y = lerp(src.y, 150, sm(u)) - 30 * Math.sin(Math.PI * u);
  const a = win(u, 0, 0.1) * (1 - win(u, 0.84, 1));
  if (a <= 0.01) return;
  // the scale that puts the 13 px strip lettering at >= 24 px cap on a 1080p frame (measured ~26 px in the frame)
  const full = (legibleSize(c, `400 13px ${FONT.phosphor}`, 13, 'IF') * (26 / 22)) / 13;
  const s = lerp(0.9, full, grow) * (1 + 0.08 * u);
  c.save();
  ifThenStrip(c, x, y, s, -0.09 + 0.05 * Math.sin(tq * 1.4), a, { mood: f.mood } as unknown as PaintEnv);
  c.restore();
}

// ================================================================================================= TYPE
/** the belief, in the era face (VT323): screen-locked, upper right, on a soft plate */
function beliefLabel(f: Frame, a: number, x: number, y: number, k = 1) {
  const c = f.c;
  const P = f.mood;
  c.save();
  c.globalAlpha = a;
  c.translate(x, y);
  c.scale(k, k);
  c.translate(-x, -y);
  softPlate(c, x, y + 14, 600, 150, P.ink, 0.64);
  // sized after the scale so both lines and the year clear the 22 px (1080p) floor on the shelf and the stage
  const big = legibleSize(c, `400 36px ${FONT.phosphor}`, 36);
  const small = legibleSize(c, `400 28px ${FONT.phosphor}`, 28);
  c.font = `400 ${big}px ${FONT.phosphor}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = mixLab(P.core, '#efe2c8', 0.45);
  c.fillText('INTELLIGENCE IS KNOWLEDGE,', x, y - 10);
  c.fillText('TYPED IN BY HAND', x, y + 24);
  c.font = `400 ${small}px ${FONT.phosphor}`;
  c.fillStyle = withAlpha(mixLab(P.core, '#efe2c8', 0.45), 0.8);
  c.fillText('c. 1980', x, y + 24 + 0.5 * big + 0.62 * small);
  c.restore();
}

/** the blinded-test plate: a parchment flat lowered on two strings in front of the stage. Everything on it that
 *  is meant to be read is sized to the 22 px (1080p) cap-height floor with legibleSize; the axis is two numbers. */
function testPlate(f: Frame, t: number, tq: number, b: B) {
  const c = f.c;
  const Pp = MOODS.parchment;
  const P = f.mood;
  // (right of the stage candle's flame, inside the safe area)
  const X = 616, Y = 36, W = 604, H = 482;
  // drop on twos with a small settle; rise out at the end
  // (review r1) a 0.3 s drop: the whole plate, title included, is in by ~9.5 (on 'system')
  const d0 = b.system - 0.12;
  let dy: number;
  const du = clamp01((tq - d0) / 0.3);
  if (tq < d0) dy = -H - 120;
  else if (du < 1) dy = -(H + 120) * Math.pow(1 - du, 2.2) + 10 * Math.sin(du * Math.PI);
  else dy = 0;
  const ru = clamp01((t - b.plateOut) / 0.42);
  dy -= (H + 140) * ru * ru;
  const y0 = Y + dy;
  const ink = Pp.ink;
  const TW = FONT.typewriter;
  const tSize = legibleSize(c, `400 31px ${TW}`, 31, 'H');
  const hSize = legibleSize(c, `600 32px ${FONT.sc}`, 32, 'MYCIN');
  const iSize = legibleSize(c, `italic 400 26px ${FONT.text}`, 26, 'H');
  c.save();
  // the strings from the flies
  c.strokeStyle = withAlpha(mixLab(P.ink, P.set, 0.4), 0.9);
  c.lineWidth = 1.5;
  for (const sx of [X + 60, X + W - 60]) {
    c.beginPath();
    c.moveTo(sx, -10);
    c.lineTo(sx, y0 + 6);
    c.stroke();
  }
  // shadow, paper (lamp-lit parchment, a step down so it sits in the amber room rather than glowing), rule
  c.fillStyle = withAlpha(P.fg, 0.5);
  c.fillRect(X + 8, y0 + 10, W, H);
  c.fillStyle = mixLab(mixLab(Pp.sky[1], P.halo, 0.12), P.set, 0.16);
  c.fillRect(X, y0, W, H);
  c.strokeStyle = withAlpha(ink, 0.5);
  c.lineWidth = 1.2;
  c.strokeRect(X + 10, y0 + 10, W - 20, H - 20);
  // pins
  c.fillStyle = mixLab(P.halo, P.set, 0.3);
  for (const sx of [X + 60, X + W - 60]) {
    c.beginPath();
    c.arc(sx, y0 + 8, 3.4, 0, Math.PI * 2);
    c.fill();
  }
  const text = (txt: string, x: number, y: number, align: CanvasTextAlign, font: string, a = 1) => {
    c.font = font;
    c.textAlign = align;
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(ink, 0.94 * a);
    c.fillText(txt, x, y);
  };
  // the heading (the plate's caption: what this is)
  text('MYCIN · blinded test, 1979', X + W / 2, y0 + 52, 'center', `600 ${hSize}px ${FONT.sc}`);
  c.fillStyle = withAlpha(ink, 0.4);
  c.fillRect(X + W / 2 - 120, y0 + 64, 240, 1.2);

  // row 1: ten sealed envelopes (the cases), printed on the plate so they ride down with it
  const ew = 38, eh = 25, egap = 50, ex0 = X + (W - (9 * egap + ew)) / 2, ey = y0 + 82;
  for (let i = 0; i < 10; i++) {
    const x = ex0 + i * egap;
    c.fillStyle = mixLab(Pp.set, Pp.sky[0], 0.55);
    c.fillRect(x, ey, ew, eh);
    c.strokeStyle = withAlpha(ink, 0.75);
    c.lineWidth = 1.1;
    c.strokeRect(x, ey, ew, eh);
    c.beginPath();
    c.moveTo(x, ey);
    c.lineTo(x + ew / 2, ey + eh * 0.58);
    c.lineTo(x + ew, ey);
    c.stroke();
    // the wax seal (sealed: the program's and the doctors' answers are not told apart)
    c.fillStyle = mixLab(ink, MOODS.emberRed.rim, 0.35);
    c.beginPath();
    c.arc(x + ew / 2, ey + eh * 0.58, 4, 0, Math.PI * 2);
    c.fill();
  }
  // row 2: eight judges in head-and-shoulders profile, a pale cut-paper band across the eyes
  const jy = y0 + 162, jgap = 62, jx0 = X + (W - 7 * jgap) / 2;
  for (let i = 0; i < 8; i++) judge(c, jx0 + i * jgap, jy, i % 2 ? 1 : -1, i, ink, mixLab(Pp.sky[0], Pp.rim, 0.4));
  // what the bars measure (italic, under the judges)
  text('prescriptions rated acceptable', X + W / 2, y0 + 254, 'center', `italic 400 ${iSize}px ${FONT.text}`, 0.85);

  // the bars: share of prescriptions rated acceptable, 0 … 100 %
  const ax0 = X + 40, ax1 = X + W - 40, aw = ax1 - ax0;
  const r1 = y0 + 316, r2 = y0 + 402, axisY = r2 + 28;
  const lab = (txt: string, x: number, y: number, align: CanvasTextAlign, a = 1) => text(txt, x, y, align, `400 ${tSize}px ${TW}`, a);
  c.strokeStyle = withAlpha(ink, 0.7);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(ax0, r1 - 40);
  c.lineTo(ax0, axisY);
  c.lineTo(ax1, axisY);
  c.stroke();
  c.setLineDash([3, 5]);
  c.strokeStyle = withAlpha(ink, 0.22);
  for (const v of [0.5, 1]) {
    c.beginPath();
    c.moveTo(ax0 + aw * v, r1 - 40);
    c.lineTo(ax0 + aw * v, axisY);
    c.stroke();
  }
  c.setLineDash([]);
  c.strokeStyle = withAlpha(ink, 0.8);
  for (const v of [0, 0.5, 1]) {
    c.beginPath();
    c.moveTo(ax0 + aw * v, axisY);
    c.lineTo(ax0 + aw * v, axisY + 7);
    c.stroke();
  }
  // the axis is read by its two ends only
  lab('0', ax0, axisY + 7 + tSize * 0.95, 'center', 0.75);
  lab('100%', ax1, axisY + 7 + tSize * 0.95, 'right', 0.75);
  // lettered row labels
  lab('program', ax0 + 10, r1 - 18, 'left');
  lab('5 Stanford specialists', ax0 + 10, r2 - 18, 'left');
  // the program's bar grows from 'was' to 65 %, full by 'above'
  const g1 = sm((t - b.barAt) / 0.55);
  if (g1 > 0) {
    c.fillStyle = mixLab(ink, P.ink, 0.2);
    c.fillRect(ax0, r1 - 3, aw * 0.65 * g1, 24);
    c.fillStyle = withAlpha(Pp.rim, 0.35);
    c.fillRect(ax0, r1 - 3, aw * 0.65 * g1, 2);
    if (g1 > 0.9) lab('65%', ax0 + aw * 0.65 + 12, r1 + 18, 'left', win(g1, 0.9, 1));
  }
  // the specialists' range (42.5–62.5 %) lands on 'above' as a band, hatched, with end ticks
  const g2 = win(t, b.rangeAt, b.rangeAt + 0.35);
  if (g2 > 0) {
    const xa = ax0 + aw * 0.425, xb = ax0 + aw * 0.625;
    const cy = r2 + 9;
    c.save();
    c.globalAlpha = g2;
    c.strokeStyle = withAlpha(ink, 0.35);
    c.setLineDash([2, 4]);
    c.beginPath();
    c.moveTo(ax0, cy);
    c.lineTo(xa, cy);
    c.stroke();
    c.setLineDash([]);
    c.fillStyle = mixLab(Pp.set, ink, 0.35);
    c.fillRect(xa, cy - 12, xb - xa, 24);
    c.save();
    c.beginPath();
    c.rect(xa, cy - 12, xb - xa, 24);
    c.clip();
    c.strokeStyle = withAlpha(ink, 0.55);
    c.lineWidth = 1.2;
    for (let x = xa - 30; x < xb + 30; x += 7) {
      c.beginPath();
      c.moveTo(x, cy + 12);
      c.lineTo(x + 24, cy - 12);
      c.stroke();
    }
    c.restore();
    c.strokeStyle = ink;
    c.lineWidth = 2;
    for (const xx of [xa, xb]) {
      c.beginPath();
      c.moveTo(xx, cy - 16);
      c.lineTo(xx, cy + 16);
      c.stroke();
    }
    lab('42.5–62.5%', xb + 12, cy + 9, 'left');
    // the program's mark carried down: it stands beyond the whole range
    if (g1 >= 1) {
      c.strokeStyle = withAlpha(ink, 0.6);
      c.setLineDash([4, 4]);
      c.beginPath();
      c.moveTo(ax0 + aw * 0.65, r1 + 21);
      c.lineTo(ax0 + aw * 0.65, cy - 16);
      c.stroke();
      c.setLineDash([]);
    }
    c.restore();
  }
  c.restore();
}

/** a judge: a cut-paper head-and-shoulders profile (no features but the profile line), eyes covered by a pale band */
function judge(c: C, x: number, y: number, dir: 1 | -1, i: number, ink: string, band: string) {
  const v = (k: number) => 1 + 0.06 * Math.sin(i * 2.7 + k);
  c.save();
  c.translate(x, y);
  c.scale(dir, 1);
  c.fillStyle = ink;
  // shoulders and the collar (a jacket line)
  c.beginPath();
  c.moveTo(-27, 52);
  c.bezierCurveTo(-27, 34, -18, 27, -6, 25);
  c.lineTo(9, 25);
  c.bezierCurveTo(20, 27, 27, 34, 27, 52);
  c.closePath();
  c.fill();
  // neck
  c.fillRect(-6, 8, 12, 20);
  // head in profile, facing +x: back of skull, crown, brow, nose, lips, chin, jaw
  const hs = v(1);
  c.beginPath();
  c.moveTo(-6, 14);
  c.bezierCurveTo(-15 * hs, 10, -16 * hs, -10, -12 * hs, -18);
  c.bezierCurveTo(-7, -27, 6, -27, 11, -19);
  c.lineTo(12, -11); // brow
  c.lineTo(13.5, -8.5);
  c.lineTo(18 * v(2), -1); // nose tip
  c.lineTo(13, 1);
  c.lineTo(14, 4); // lips
  c.lineTo(12.5, 6);
  c.lineTo(13, 9); // chin
  c.bezierCurveTo(12, 13, 6, 14, 2, 13);
  c.closePath();
  c.fill();
  // hair line variety
  if (i % 3 === 0) {
    c.beginPath();
    c.moveTo(-13, -16);
    c.quadraticCurveTo(-2, -32, 12, -20);
    c.lineTo(9, -18);
    c.quadraticCurveTo(-2, -24, -12, -12);
    c.fill();
  }
  // the blindfold: a pale cut-paper band across the eyes, its knot tails behind the head
  c.fillStyle = band;
  c.beginPath();
  c.moveTo(-14, -14);
  c.lineTo(14.5, -11);
  c.lineTo(14, -4.5);
  c.lineTo(-15, -7);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(-14, -12);
  c.lineTo(-24, -6);
  c.lineTo(-22, -2);
  c.lineTo(-13, -8);
  c.closePath();
  c.fill();
  c.restore();
}

void phosphorOf;
void overscan;
