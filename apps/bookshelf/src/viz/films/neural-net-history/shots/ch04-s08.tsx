/**
 * ch04-s08 — Sussex, 1976. Back on the candle stage, deep in winter: the sterile candle burns at centre,
 * seven years held (a seven-ring ghost sleeve above the stub, live flame where they meet, clean rim), its
 * pool small; snow drifts through the rim. At the very rim of the light, right third, half in shadow, a
 * plain wooden desk with a reading lamp switched off.
 *   "Sussex"      date stamp SUSSEX · 1976 (Special Elite)
 *   "place"       a tall young man in 1970s dress (hinton-young; unnamed: no name card, TEXT RULE) has walked in
 *                 from the dark on the twos; he turns on a hold and SITS at the desk, facing out from the flame, the
 *                 darkest shape on the stage (near-black, rimmed on the flame side), his long shadow raking right
 *                 across the floor to the frame's edge. He stays seated, breathing; on "far from the flame" his head
 *                 turns back toward the candle, then out again.
 *   "thirty-six"  a match-dissolve, never a dip: from 1.0 s before the word the camera eases in toward the flame and
 *                 the flame swells into the board lamp's warm pool, so the Case Board is up ON the word; the tint
 *                 crossfades winterBlue → candleAmber (1.2 s, STUDY LOCK). The hands pin the scissors clue into C2-a
 *                 on "years"; over "near the edge" a thread of light drops from it to the Helsinki card just below
 *                 (s07's thread lands) as the camera pushes in ≈25% on column C2, so HELSINKI / 1970 reads
 *   "light"       on the oxblood thread the hands unpin AND IF NO STRAIGHT LINE EXISTS? and pin, along the top
 *                 edge, THEN HOW DO YOU TRAIN THE HIDDEN LAYER? hanging from the thread itself, clear of the
 *                 column heads (carried into ch05)
 *   "chess"       a 1.3 s pan to the Wall of Forecasts: the chess slip (W2) on the left third, yellowing, its corner
 *                 curling, its manila tag CHESS CHAMPION / DUE 1968 stamped OVERDUE (readable ≥ 1.5 s); W6's
 *                 half-lit corner on the right third, farther along. W3 (Rosenblatt 1961) stays pinned: studyState
 *                 pins it in ch03-s08, so the script's "only W1 and W2" note is the continuity error, not the Wall.
 *   end           a short light-to-light dissolve (no dip) back onto the desk at the rim (candleAmber →
 *                 winterBlue, 1.2 s), and a clean second on him in the snow before the cut
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at a pitch of 6 px per
 * ring at L3 (270 px), its flame on the top ring and a small tag at its base giving the year it was lit. It
 * burns down one ring per year the belief is held; the burned wax stays above the stub as a ghost sleeve.
 * Here: seven rings (1969 → 1976), live flame, clean rim.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose, ShotScene } from '../../../film';
import {
  MOODS, POSES, PUPPET_NEAR_BLACK, addPose, hash1, anglepoiseLamp, blendPose, chair, defineShot, mixLab, placeStamp, seatHeight, snow,
  toLayer, toScreen, walkTo, withAlpha, withLife, writingDesk, LAYERS,
} from '../../../film';
import { SPECS, cast, hands } from '../cast';
import { candleStage, floorShadow, type StageGeo } from '../sets/candleStage';
import { STUDY, slotWorld, studyCase, studyNear, studyRoom, wallSlotWorld } from '../sets/study';
import { BOARD, SLOTS, boardStateAt, shelfStateAt, xrayBandsAt, type BoardState, type SlotId } from '../sets/studyState';
import { DEFAULT_POOL, drawCard, oxblood, paperTone, poolAt, slotPin, typedText } from '../sets/caseBoard';
import { WALL_SLOTS, slotLight } from '../sets/wallOfForecasts';
import { XRAY } from '../sets/xrayColumn';
import { handsEntry } from '../sets/narratorHands';
import { agedChessSlip } from '../sets/ch04-s08-slip';
import { FONT } from '../../../film/silhouette/type';
import { camKeys, clamp01, compositeSub, glow, lightThread, pinSway, sm, stageLip, subFrame, tq12, win } from '../sets/ch04-s06-kit';
import { drapery } from '../sets/occluders';

const ID = 'ch04-s08';
type C = CanvasRenderingContext2D;

// ------------------------------------------------------------------ the stage
const STERILE = shelfStateAt(ID, 'end').find((v) => v.id === 'sterile')!;
/** the candle stands a little right of the old mark, so the stage's middle third is not empty haze */
const CANDLE_X = 560;
const STAGE_S = 1.32;
/** the flame's height on the stage (L4 world), for the match-dissolve's bridge of light */
const FLAME_Y = 330;
const POOL = 0.6;
const HINTON = cast['hinton-young'];
const H_SPEC = SPECS['hinton-young'];
/** his feet when seated (facing right, out from the flame) */
const SEAT_FEET = 892;
/** the chair's seat centre relative to his root (his pelvis sits over the seat's back half) */
const CHAIR_DX = -6;
const ENTER_X = 1420;
const DESK_X = 1004;
const SIT: Pose = { ...addPose(POSES.sit, { torso: 8, neck: 8, head: 3, shoulderF: 12, elbowF: 100, wristF: -8, shoulderB: 10, elbowB: 40, wristB: -14 }), handF: 'chin', handB: 'palmDown' };
/** "far from the flame": the head turns back toward the candle behind him (lifted, drawn back), then out again */
const LOOKBACK: Pose = { ...addPose(SIT, { torso: -5, neck: -14, head: -16, shoulderF: -6, elbowF: -16 }), handF: 'chin', handB: 'palmDown' };
const SIT_H = seatHeight(H_SPEC, SIT);
/** the half-widths of the two match-dissolves (s): candle flame → board lamp pool, and Wall → stage */
const XF = 0.38;
const XB = 0.2;

// ------------------------------------------------------------------ the study
const BK = STUDY.board.k;
const POOL_B = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };
const Q_OLD = 'AND IF NO STRAIGHT LINE EXISTS?';
const Q_NEW = 'THEN HOW DO YOU TRAIN THE HIDDEN LAYER?';
/**
 * the new question card: one typed line on a long card, hanging 3 units under the thread so it clears the column
 * heads. Its type is sized for the camera that holds on it (z ≈ 400, k ≈ 1.67): 18 units ≈ 23 px cap at 1080p.
 */
const QN = { font: 18, padX: 15, h: 34, drop: 3 };

interface Beats {
  stamp: number;
  stampEnd: number;
  name: number;
  walk0: number;
  arrive: number;
  place: number;
  far: number;
  flame: number;
  six: number;
  x0: number;
  xm: number;
  x1: number;
  years: number;
  edge0: number;
  edge1: number;
  pin0: number;
  pinDur: number;
  unpin0: number;
  unpinDur: number;
  qpin0: number;
  qpinDur: number;
  pan0: number;
  pan1: number;
  age0: number;
  age1: number;
  back0: number;
  backm: number;
  back1: number;
}
interface Scene extends ShotScene {
  b: Beats;
  D: number;
  stageCam: (t: number) => Camera3;
  studyCam: (t: number) => Camera3;
  STAGE_CAMS: Camera3[];
  STUDY_CAMS: Camera3[];
  walk: ReturnType<typeof walkTo>;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const place = T.beat('sits');
    const six = T.beat('clue');
    const q = T.beat('question');
    const chess = T.beat('chess');
    // he walks in from the dark so that he arrives just before "place", turns on a hold, and sits on it
    const probe = walkTo(H_SPEC, { x0: ENTER_X, x1: SEAT_FEET, at: 0, cadence: 0.92 });
    const walkDur = probe(0).arrive;
    const arrive = place - 0.55;
    const walk0 = arrive - walkDur;
    const walk = walkTo(H_SPEC, { x0: ENTER_X, x1: SEAT_FEET, at: walk0, cadence: 0.92 });
    // the move off the desk onto the board: a match-dissolve (never a dip) from the candle's flame into the board
    // lamp's pool, starting 1.0 s before "thirty-six" so the board is up ON the word; the board camera is all but
    // settled by the time the scissors card lands on "years"
    const x0 = six - 1.0;
    const xm = x0 + 0.55;
    const x1 = x0 + 1.9;
    // the scissors pin lands (u = 0.45) on "years"; the hero thread of light runs to Helsinki over "near the edge"
    const years = T.word('L0416', 'years');
    const pinDur = 0.74;
    const pin0 = years - 0.45 * pinDur;
    const edge0 = T.word('L0416', 'near') - 0.05;
    const edge1 = edge0 + 0.7;
    // the question swap: the hands take the old card off over "edge of the", and the new card is placed (u = 0.45)
    // ON "light", so it hangs readable through the silence before the pan
    const unpinDur = 0.66;
    const qpinDur = 0.76;
    const qpin0 = q - 0.45 * qpinDur;
    const unpin0 = Math.max(pin0 + pinDur + 0.02, qpin0 - unpinDur + 0.1);
    // the pan to the Wall on "chess" (1.3 s, eased), the slip ageing as the camera arrives, then a long hold on the
    // overdue tag (≥ 1.5 s), then a short light-to-light dissolve back to the desk
    const pan0 = chess;
    const pan1 = pan0 + 1.3;
    const age0 = pan1 - 0.9;
    const age1 = age0 + 0.6;
    // ≥ 1.5 s reading the overdue tag, then back to the desk with ≥ 1.3 s on him in the snow before the cut
    const back0 = Math.min(D - 1.85, age1 + 1.6);
    const backm = back0 + 0.22;
    const back1 = back0 + 0.5;
    const b: Beats = {
      // the date stamp clears before his name is spoken; the name card takes over on "Hinton" (never stacked)
      stamp: T.beat('stamp'), stampEnd: T.word('L0415', 'Geoffrey') - 0.15, name: T.word('L0415', 'Hinton') - 0.12, walk0, arrive, place, far: T.word('L0415', 'far'), flame: T.wordEnd('L0415', 'flame'), six,
      x0, xm, x1, years, edge0, edge1, pin0, pinDur, unpin0, unpinDur, qpin0, qpinDur, pan0, pan1, age0, age1, back0, backm, back1,
    };

    // on the way out the camera eases in and left toward the flame, so the flame sits where the board lamp's pool
    // comes up; on the way back it eases out from the flame onto the desk
    const stageCam = camKeys([
      [0, 604, 372, -36],
      [arrive, 690, 390, 60],
      [x0, 760, 400, 110],
      [xm + XF, 694, 384, 220],
      [backm - XB, 700, 392, 200],
      [back1, 846, 410, 196],
      [D, 832, 410, 186],
    ], 0.2);
    // the board: arrive on a frame that holds column C2 (the scissors and the Helsinki card) AND the oxblood thread
    // with its question card, settling as the card lands; then the pan to W2, framed low and right so the W1 slips
    // are cleanly out of frame and the X-ray box is only an edge
    // the board: up out of the lamp's pool (placed where the flame was), onto a frame that holds column C2 (the
    // scissors and the Helsinki card) AND the oxblood thread; as the thread of light runs to Helsinki the camera
    // pushes in ≈25% on C2 so the Helsinki card reads, and holds there through the question swap. Then the pan to
    // the Wall: the chess slip on the left third, W6's half-lit corner on the right third
    const W2 = wallSlotWorld('W2'), W6 = wallSlotWorld('W6');
    const wallX = (W2.x + W6.x) / 2;
    const studyCam = camKeys([
      [xm - XF, 730, 330, 290],
      [years - 0.3, 494, 186, 398],
      [edge0, 496, 184, 404],
      [edge1 + 0.3, 506, 186, 486],
      [pan0, 508, 186, 492],
      [(pan0 + pan1) / 2, 1060, 300, 300],
      [pan1, wallX, 366, 400],
      [back0, wallX + 6, 366, 412],
      [backm + XB, wallX + 40, 366, 420],
    ], 0.2);
    const STAGE_CAMS = [0, arrive, x0, xm + XF, backm - XB, back1, D].map(stageCam);
    const STUDY_CAMS = [xm - XF, years - 0.3, x1, pan0, (pan0 + pan1) / 2, pan1, back0, backm + XB].map(studyCam);
    tl.hold(0, D);
    return { tl, b, D, stageCam, studyCam, STAGE_CAMS, STUDY_CAMS, walk };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    // the stage until the camera is deep in the dark vignette past the desk; the study until it is deep in the dark
    // past the Wall; the stage again. At the darkest point the two worlds dissolve (never a black frame).
    const toStudy = win(t, b.xm - XF, b.xm + XF);
    const toStage = win(t, b.backm - XB, b.backm + XB);
    const studyW = toStudy * (1 - toStage);
    if (studyW >= 0.5) paintStudy(f, sc, t);
    else paintStage(f, sc, t);
    if (studyW > 0.001 && studyW < 0.999) {
      const other = studyW >= 0.5
        ? subFrame(f, `${ID}/stage`, 'winterBlue', (g) => paintStage(g, sc, t))
        : subFrame(f, `${ID}/study`, 'winterBlue', (g) => paintStudy(g, sc, t));
      compositeSub(f, other, studyW >= 0.5 ? 1 - studyW : studyW);
    }
    // the match: the candle's flame swells into the board lamp's warm pool as the two worlds dissolve (a bridge of
    // light where the flame sits, never a dark frame)
    if (t >= b.x0 && t < b.xm + XF) flameBridge(f, sc, t);
    // the date stamp only (TEXT RULE: he is not named on screen; ch05-s03 carries his first name card)
    placeStamp(f.c, { place: 'Sussex', date: '1976', style: 'typewriter', at: b.stamp, dur: b.stampEnd - b.stamp }, { t, mood: f.mood, seed: 76 });
  },
});

/**
 * The light bridge of the outbound match-dissolve: a warm glow at the candle flame's screen point that swells as the
 * flame "becomes" the board lamp's pool and fades as the board settles (screen space, additive, capped).
 */
function flameBridge(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const k = sm((t - b.x0) / (b.xm - b.x0)) * (1 - sm((t - b.xm) / XF));
  if (k <= 0.01) return;
  const fl = toScreen(LAYERS.L4, sc.stageCam(t), CANDLE_X, FLAME_Y);
  const c = f.c;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const r = 140 + 260 * k;
  const g = c.createRadialGradient(fl.x, fl.y, 0, fl.x, fl.y, r);
  const warm = mixLab(MOODS.candleAmber.halo, MOODS.winterBlue.core, 0.25);
  g.addColorStop(0, withAlpha(warm, 0.34 * k));
  g.addColorStop(0.35, withAlpha(warm, 0.14 * k));
  g.addColorStop(1, withAlpha(warm, 0));
  c.fillStyle = g;
  c.fillRect(fl.x - r, fl.y - r, 2 * r, 2 * r);
  c.restore();
}
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// =====================================================================================================
// THE STAGE
// =====================================================================================================
function paintStage(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = sc.stageCam(t);
  f.camera(cam);
  // on the way into the study the tint starts toward the lamp's amber; on the way back it returns to the winter
  if (t >= b.x0 && t < b.xm + XF) f.setMood('candleAmber', { from: 'winterBlue', u: win(t, b.x0, b.x0 + 1.2) });
  if (t >= b.backm - XB) f.setMood('winterBlue', { from: 'candleAmber', u: win(t, b.back0, b.back0 + 1.2) });
  candleStage(f, {
    key: ID,
    cams: sc.STAGE_CAMS,
    candle: STERILE,
    candleX: CANDLE_X,
    s: STAGE_S,
    pool: POOL,
    letters: 0.5,
    rimDir: { x: -0.7, y: -0.7 },
    back: (c, env, g) => {
      // a second, farther floor plane: the back riser of the stage, its top edge catching the candle only near it
      farFloor(c, env, g);
      // snow drifting in the dark beyond the rim (behind the action plane)
      snow(c, { area: { x: 560, y: -200, w: 1400, h: 1000 }, count: 110, salt: 81, fall: 26, wind: -8, size: 0.85, color: env.mood.core }, env);
      // the middle third: snow drifting down through the edge of the candle's light, its flakes catching the flame
      snow(c, { area: { x: CANDLE_X + 70, y: -120, w: 300, h: 760 }, count: 46, salt: 85, fall: 22, wind: -6, size: 1.05, color: mixLab(env.mood.halo, env.mood.core, 0.5) }, env);
    },
    draw: (c, env, g) => {
      deskAndHim(c, env, g, sc, t, tq);
    },
  });
  // near snow, and the near wing: a heavy curtain edge at the right of frame (blurred by its plane), the side
  // he walks in from; it slides against the stage as the camera moves
  f.layer('L5', (c, env) => {
    snow(c, { area: { x: 500, y: -400, w: 1500, h: 1400 }, count: 26, salt: 87, fall: 40, wind: -10, size: 0.95, color: env.mood.core }, env);
    f.cached(`${ID}/stage/L5/wing/${env.mood.id}`, 260, 1400, (cc) => {
      cc.translate(-1180, 300);
      drapery(cc, { x: 1330, top: -300, bottom: 1060, w: 92, side: 'right', folds: 4, tieback: 470, seed: 19 }, env);
    })(c, 1180, -300);
  });
  stageLip(f, sc.STAGE_CAMS, ID, 684);
  // the haze falls off with distance from the flame: everything far from the candle sinks toward ink, and the
  // nearest floor edge is darker still (screen space)
  const c = f.c;
  const fl = toScreen(LAYERS.L4, cam, CANDLE_X, 330);
  c.save();
  const g = c.createRadialGradient(fl.x, fl.y, 160 * fl.k, fl.x, fl.y, 980 * fl.k);
  g.addColorStop(0, withAlpha(f.mood.ink, 0));
  g.addColorStop(0.5, withAlpha(f.mood.ink, 0.3));
  g.addColorStop(1, withAlpha(f.mood.ink, 0.66));
  c.fillStyle = g;
  c.fillRect(-40, -40, 1360, 800);
  const fg = c.createLinearGradient(0, 640, 0, 720);
  fg.addColorStop(0, withAlpha(f.mood.ink, 0));
  fg.addColorStop(1, withAlpha(f.mood.ink, 0.6));
  c.fillStyle = fg;
  c.fillRect(-40, 640, 1360, 120);
  c.restore();
}

/** L3: the stage's far floor plane, a low riser behind the action plane (rest-screen px) */
function farFloor(c: C, env: PaintEnv, g: StageGeo) {
  const y = g.floorY - 34;
  const m = env.mood;
  c.fillStyle = mixLab(m.fg, m.set, 0.42);
  c.fillRect(-1200, y, 4200, 120);
  // its top edge, lit near the candle and lost in the dark away from it
  const e = c.createLinearGradient(g.candleX - 900, 0, g.candleX + 900, 0);
  e.addColorStop(0, withAlpha(m.rim, 0));
  e.addColorStop(0.5, withAlpha(mixLab(m.rim, m.halo, 0.5), 0.3));
  e.addColorStop(1, withAlpha(m.rim, 0));
  c.fillStyle = e;
  c.fillRect(g.candleX - 900, y - 0.5, 1800, 1.6);
  // faint board seams on the riser
  c.fillStyle = withAlpha(m.fg, 0.4);
  for (let x = -1200; x < 3000; x += 140) c.fillRect(x, y + 3, 1.2, 28);
}

function deskAndHim(c: C, env: PaintEnv, g: StageGeo, sc: Scene, t: number, tq: number) {
  const b = sc.b;
  const fy = g.floorY;
  // the chair under his seat (it faces the way he faces: out from the flame, to the right); the desk in front of him
  const seatY = -chair.anchors({ x: 0, y: 0 }).seat.y;
  const cs = SIT_H / Math.max(1, seatY);
  const ch = { x: SEAT_FEET + CHAIR_DX - 2 * cs, y: fy };
  // where he is and how he stands
  let x = ENTER_X, facing: 'left' | 'right' = 'left', p: Pose = POSES.stand;
  const visible = tq >= b.walk0 - 0.01;
  if (tq < b.arrive) {
    const w = sc.walk(t);
    x = w.x;
    facing = w.facing;
    p = w.pose;
  } else {
    x = SEAT_FEET;
    const turn = b.arrive + 0.26; // a hold, then the profile flip
    facing = tq < turn ? 'left' : 'right';
    const sitU = clamp01((tq - b.place) / 0.5);
    const e = sitU * sitU * (3 - 2 * sitU);
    // seated: breathing, and on "far from the flame" one turn of the head back toward the candle, then out
    const look = sm((tq - (b.far - 0.05)) / 0.35) * (1 - sm((tq - (b.flame + 0.25)) / 0.45));
    const seated = blendPose(SIT, LOOKBACK, look);
    p = tq < b.place ? withLife({ ...POSES.stand }, tq, 1976, 0.7) : withLife({ ...blendPose(POSES.stand, seated, e) }, tq, 1976, 1.35);
  }
  if (!visible) x = 2000;
  // he is the darkest shape on the stage: near-black, with a fine rim cut on the side facing the flame
  const light = { x: -1, y: -0.35, floor: 0.18 };
  const drawHim = (cc: C, xx: number, yy: number) =>
    HINTON.draw(cc, { x: xx, y: yy, facing, pose: p, light, ink: PUPPET_NEAR_BLACK, edgeRim: { x: -1, y: -0.3, px: 1.5, alpha: 0.7 } }, env);
  const shadowOf = (cc: C) => HINTON.draw(cc, { x: 0, y: 0, facing, pose: p, light, ink: PUPPET_NEAR_BLACK, cutLines: false }, env);
  // his long shadow, thrown from the candle through his seated figure and raking right across the floor to the
  // frame's edge (the candle's last light grazes that floor strip, so the shadow has light to cut)
  if (visible) {
    const reach = 1520;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const gz = c.createLinearGradient(g.candleX, 0, reach, 0);
    gz.addColorStop(0, withAlpha(env.mood.halo, 0.42));
    gz.addColorStop(0.45, withAlpha(env.mood.halo, 0.34));
    gz.addColorStop(1, withAlpha(env.mood.halo, 0.18));
    c.fillStyle = gz;
    c.beginPath();
    c.moveTo(g.candleX, fy + 1);
    c.lineTo(reach, fy + 1);
    c.lineTo(reach, fy + 58);
    c.lineTo(g.candleX, fy + 22);
    c.closePath();
    c.fill();
    c.restore();
    // the shadow: his figure laid flat along the floor away from the flame, long enough to leave the frame
    const figH = H_SPEC.height * 0.78;
    const len = Math.max(1.2, (reach - x) / figH);
    c.save();
    // (≈0.35 of ink where it falls on the lit strip, after the stage's distance falloff; drawn at 0.55 before it)
    c.globalAlpha *= 0.55;
    c.translate(x, fy + 2);
    c.transform(0, 0.3, -len, -0.07 * len, 0, 0);
    shadowOf(c);
    c.restore();
    // a contact shadow under the chair and his feet
    floorShadow(c, g, x, shadowOf, env, 0.6);
  }
  // the chair, then him, then the desk: its top and its one pedestal on the far (right) side, so his knees go into
  // the open kneehole under the top; the near end stands on a single turned leg
  chair(c, { x: ch.x, y: fy, s: cs, style: 'wooden', view: 'side' }, env);
  if (visible) drawHim(c, x, fy);
  const dOpts = { x: DESK_X, y: fy, s: 1.02, variant: 'pedestal' as const, w: 132 };
  const top = writingDesk.anchors(dOpts).top;
  const hw = 66 * 1.02;
  const pw = Math.min(46, 132 * 0.3) * 1.02;
  c.save();
  const keep = new Path2D();
  keep.rect(DESK_X - hw - 8, top.y - 6, 2 * hw + 16, 14); // the top slab and the frieze, full length
  keep.rect(DESK_X + hw - pw - 1, top.y - 6, pw + 10, fy - top.y + 12); // the far pedestal
  c.clip(keep);
  writingDesk(c, dOpts, env);
  c.restore();
  // the near leg: turned, under the top's left end
  {
    const lx = DESK_X - hw + 5;
    const y0 = top.y + 8;
    c.fillStyle = env.fill('ink');
    c.beginPath();
    c.moveTo(lx - 3.2, y0);
    c.lineTo(lx + 3.2, y0);
    c.lineTo(lx + 2.6, y0 + 10);
    c.quadraticCurveTo(lx + 4.4, y0 + 14, lx + 2.2, y0 + 18);
    c.lineTo(lx + 1.7, fy - 6);
    c.quadraticCurveTo(lx + 3, fy - 3, lx + 2.4, fy);
    c.lineTo(lx - 2.4, fy);
    c.quadraticCurveTo(lx - 3, fy - 3, lx - 1.7, fy - 6);
    c.lineTo(lx - 2.2, y0 + 18);
    c.quadraticCurveTo(lx - 4.4, y0 + 14, lx - 2.6, y0 + 10);
    c.closePath();
    c.fill();
    // a stretcher to the pedestal, low
    c.fillRect(lx, fy - 16, DESK_X + hw - pw - lx, 2.2);
  }
  // the reading lamp, switched off, at the desk's far right end, its head turned away from him
  anglepoiseLamp(c, { x: top.x + 46, y: top.y, s: 1.0, reach: 0.12, aim: 0.25, lit: false, seed: 9 }, env);
  // the desk's far half in shadow (it stands half out of the light)
  const sh = c.createLinearGradient(DESK_X - 12, 0, DESK_X + 36, 0);
  sh.addColorStop(0, withAlpha(env.mood.ink, 0));
  sh.addColorStop(1, withAlpha(env.mood.ink, 0.85));
  c.save();
  c.clip(keep);
  c.fillStyle = sh;
  c.fillRect(DESK_X - 12, top.y - 6, 120, fy - top.y + 12);
  c.restore();
}

// =====================================================================================================
// THE STUDY
// =====================================================================================================
function paintStudy(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = sc.studyCam(t);
  f.camera(cam);
  // STUDY LOCK: candleAmber in the study (the crossfade runs on through the move in); the winter only past the
  // window; and on the way out the tint starts back toward the winter in the dark
  if (t < b.back0) f.setMood('candleAmber', { from: 'winterBlue', u: win(t, b.x0, b.x0 + 1.2) });
  else f.setMood('winterBlue', { from: 'candleAmber', u: win(t, b.back0, b.back0 + 1.2) });
  studyRoom(f, { key: ID, cams: sc.STUDY_CAMS, outside: { mood: 'winterBlue', kind: 'snow' } });
  const end = boardStateAt(ID, 'end');
  const pinU = (tq - b.pin0) / b.pinDur;
  const placed = pinU >= 0.45;
  const board: BoardState = {
    ...end,
    questions: [],
    threads: end.threads.filter(([a, q]) => a !== 'C2-a' && q !== 'C2-a'),
  };
  // C2-h is drawn here (below) so its typed line breaks cleanly as HELSINKI / 1970 (no dangling separator)
  const hide: SlotId[] = ['C2-a', 'C2-h'];
  const unU = (tq - b.unpin0) / b.unpinDur;
  const qU = (tq - b.qpin0) / b.qpinDur;
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    board: { state: board, hide },
    wall: { hide: ['W2'] },
    // the X-ray box stays in its place but low (the study's one cyan must not sweep the frame during the pan)
    xray: { light: 0.22, state: xrayBandsAt(ID, 'start') },
    shelf: false,
    extra: (c, env) => {
      const k = BK;
      // the question cards on the oxblood thread
      const qx = STUDY.board.x + 270 * k;
      const qy = STUDY.board.y + BOARD.threadY * k + Math.sin(((270 - 40) / 920) * Math.PI) * 10 * k;
      const qPin = { x: qx, y: qy };
      // the hands enter along the top edge for the swap (so the cards never cross the board's middle)
      const topEntry = { R: toLayer(LAYERS.L4, cam, 1980, -60), L: toLayer(LAYERS.L4, cam, 1980, 40) };
      // the old card: hangs until the hand takes it
      if (unU < 0.36) qLineCard(c, env, qx, qy, Q_OLD, t);
      // the new card: in the hand, then hanging from the thread (it settles with a little swing)
      if (qU >= 0.45) qLineCard(c, env, qx, qy, Q_NEW, t, pinSway(tq - (b.qpin0 + 0.45 * b.qpinDur)));
      // C2-h: the Helsinki card, typed large on two lines (HELSINKI / 1970, no dangling separator) so it reads when
      // the camera pushes in on it as the thread lands (the card's own typed size is too small for this insert)
      {
        const dh = SLOTS['C2-h'];
        const ch = slotWorld('C2-h', 'centre');
        const light = poolAt(POOL_B, dh.x, dh.y);
        drawCard(c, { ...dh, text: '' }, { x: ch.x, y: ch.y, k, light }, env);
        const seedRot = hash1(dh.id.length * 31 + dh.id.charCodeAt(dh.id.length - 1), 17) * 0.025;
        c.save();
        c.translate(ch.x, ch.y);
        c.rotate(seedRot);
        typedText(c, 'HELSINKI 1970', 0, 1.5 * k, dh.w * 0.94 * k, dh.h * 0.84 * k, mixLab(env.mood.ink, paperTone(env, light), 0.08), 17 * k);
        c.restore();
      }
      // C2-a: the scissors clue, pinned; threads of light to the Helsinki card below and back to the knob clue
      const def = SLOTS['C2-a'];
      const pinPt = slotWorld('C2-a', 'pin');
      const ctr = slotWorld('C2-a', 'centre');
      if (placed) {
        const dt = tq - (b.pin0 + 0.45 * b.pinDur);
        c.save();
        c.translate(pinPt.x, pinPt.y);
        c.rotate(pinSway(dt));
        c.translate(-pinPt.x, -pinPt.y);
        drawCard(c, def, { x: ctr.x, y: ctr.y, k, light: poolAt(POOL_B, def.x, def.y) }, env);
        c.restore();
        const pA = slotPin(STUDY.board, 'C2-a'), pH = slotPin(STUDY.board, 'C2-h'), pK = slotPin(STUDY.board, 'C1-b');
        // the hero: the thread from s07 lands. It drops from the foot of the scissors card, with a slight sag, straight
        // to the Helsinki pin just below it, a bead of light running down it, a flare where it lands
        heroThread(c, env, { x: ctr.x + 6 * k, y: ctr.y + (def.h / 2 - 3) * k }, pH, t, b.edge0, b.edge1);
        // the board's standing tie back to the 1958 knob card (studyState: C2-a ties C1-b), after the swap, faint
        lightThread(c, env, pA, pK, win(t, b.qpin0 + b.qpinDur + 0.2, b.qpin0 + b.qpinDur + 0.8), 0.4, 0.1);
      }
      // the hands: pin C2-a, then the question swap
      const entry = handsEntry(cam, 'L4');
      if (pinU > 0 && pinU < 1) {
        const hp = hands.act('pin', pinU, pinPt, { held: 'card', scale: 0.72, entry });
        hands.draw(c, hp, env, { heldDraw: (cc, at, _h, e) => drawCard(cc, def, { x: at.x, y: at.y + (def.h / 2 - 7) * k, k, light: 0.85, pin: false }, e) });
      }
      if (unU > 0 && unU < 1) {
        const drop = { x: qPin.x + 420, y: qPin.y - 30 };
        const hp = hands.act('unpinDrop', unU, qPin, { held: 'card', scale: 0.72, entry: topEntry, dropAt: drop });
        hands.draw(c, hp, env, { heldDraw: (cc, at, _h, e) => qLineAt(cc, e, at.x, at.y, Q_OLD) });
        if (hp.released) {
          // let go above the board's top edge: the card drops away into the dark behind the frame
          const du = clamp01((unU - 0.62) / 0.38);
          c.save();
          c.globalAlpha *= 1 - du;
          c.translate(drop.x + 60 * du, drop.y - 40 * du);
          c.rotate(0.5 * du);
          qLineAt(c, env, 0, 0, Q_OLD);
          c.restore();
        }
      }
      if (qU > 0 && qU < 1) {
        const hp = hands.act('pin', qU, qPin, { held: 'card', scale: 0.72, entry: topEntry });
        hands.draw(c, hp, env, { heldDraw: (cc, at, _h, e) => qLineAt(cc, e, at.x, at.y, Q_NEW) });
      }
      // the study's cyan (the X-ray box and the chat-box card O), pulled down to the winter's low chroma for this
      // visit, so no saturated block sweeps through the pan
      {
        const xw = XRAY.w * STUDY.xray.s + 30, xh = XRAY.h * STUDY.xray.s + 30;
        const O = SLOTS.O;
        const rects = [
          [STUDY.xray.x - xw / 2, STUDY.xray.y - xh + 15, xw, xh],
          [STUDY.board.x + (O.x - O.w / 2 - 8) * k, STUDY.board.y + (O.y - O.h / 2 - 8) * k, (O.w + 16) * k, (O.h + 16) * k],
        ] as const;
        c.save();
        for (const [x, y, w, h] of rects) {
          c.globalCompositeOperation = 'saturation';
          c.fillStyle = withAlpha('#808080', 0.8);
          c.fillRect(x, y, w, h);
          // warmed toward the lamp's amber, so the cold glass never fights the study lock
          c.globalCompositeOperation = 'color';
          c.fillStyle = withAlpha(MOODS.candleAmber.halo, 0.55);
          c.fillRect(x, y, w, h);
        }
        c.restore();
      }
      // the Wall: W2, the chess slip, yellowing and curling, overdue (its tag carries the label)
      const W2 = WALL_SLOTS.W2;
      const wx = STUDY.wall.x + W2.x * STUDY.wall.k, wy = STUDY.wall.y + W2.y * STUDY.wall.k;
      const age = sm((tq - b.age0) / (b.age1 - b.age0));
      agedChessSlip(c, {
        x: wx, y: wy, k: STUDY.wall.k, light: slotLight('W2'), yellow: 0.15 + 0.85 * age, curl: age,
        tagSway: 0.04 * Math.sin(t * 1.1) + 0.1 * Math.exp(-Math.max(0, tq - b.age1) * 1.6) * Math.sin(Math.max(0, tq - b.age1) * 7),
        overdue: sm((tq - (b.age1 - 0.15)) / 0.3), tagFont: 16.5,
      }, env);
    },
  });
  studyNear(f, { key: ID, cams: sc.STUDY_CAMS, file: true, occluders: { drape: false, valance: false } });
}

/**
 * The hero thread of light: a short sagging drop from p (the scissors card's foot) to q (the Helsinki pin), drawn on from e0 to e1 on the twos with a running bead; on arrival a small flare blooms at the pin
 * (a ring and a glow, ≈0.6 s) and settles to a low steady glow.
 */
function heroThread(c: C, env: PaintEnv, p: { x: number; y: number }, q: { x: number; y: number }, t: number, e0: number, e1: number) {
  const tq = tq12(t);
  const u = clamp01((tq - e0) / (e1 - e0));
  if (u <= 0) return;
  const ue = 1 - (1 - u) * (1 - u);
  // a short drop with a slight sag (it bows a little to the lamp side)
  const c1 = { x: p.x + 9, y: p.y + (q.y - p.y) * 0.35 }, c2 = { x: q.x + 9, y: q.y - (q.y - p.y) * 0.35 };
  const at = (s: number) => {
    const r = 1 - s;
    return {
      x: r * r * r * p.x + 3 * r * r * s * c1.x + 3 * r * s * s * c2.x + s * s * s * q.x,
      y: r * r * r * p.y + 3 * r * r * s * c1.y + 3 * r * s * s * c2.y + s * s * s * q.y,
    };
  };
  const n = 40;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= Math.ceil(n * ue); i++) pts.push(at(Math.min(ue, i / n)));
  const col = env.mood.core;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  c.lineJoin = 'round';
  for (const [lw, al] of [[9, 0.08], [4, 0.22], [1.6, 0.85]] as const) {
    c.strokeStyle = withAlpha(col, al);
    c.lineWidth = lw;
    c.beginPath();
    pts.forEach((pt, i) => (i ? c.lineTo(pt.x, pt.y) : c.moveTo(pt.x, pt.y)));
    c.stroke();
  }
  c.restore();
  // the bead running ahead of the line
  if (u < 1) {
    const h = pts[pts.length - 1];
    glow(c, h.x, h.y, 22, col, 0.75);
    c.fillStyle = withAlpha(col, 0.95);
    c.beginPath();
    c.arc(h.x, h.y, 2.6, 0, Math.PI * 2);
    c.fill();
  }
  // the flare at the Helsinki pin
  const since = tq - e1;
  if (since >= 0) {
    const fl = Math.exp(-since * 4.2);
    glow(c, q.x, q.y, 34 + 26 * (1 - fl), col, 0.18 + 0.6 * fl);
    if (since < 0.7) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = withAlpha(col, 0.55 * fl);
      c.lineWidth = 1.4;
      c.beginPath();
      c.arc(q.x, q.y, 6 + 30 * (1 - fl), 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
  }
}

/**
 * A question card on the oxblood thread: one typed line on a long card, its top a short clip under the thread, with a
 * slow sway (+ an extra settle swing). Both questions (the one taken down and the one put up) share this format, so
 * each reads at the same size (≈25 px cap at 1080p on the board camera).
 */
function qLineCard(c: C, env: PaintEnv, qx: number, qy: number, text: string, t: number, extra = 0) {
  const k = BK;
  const sway = 0.012 * Math.sin(t * 1.5 + 0.4) + 0.004 * Math.sin(t * 3.3) + extra * 0.5;
  c.save();
  c.translate(qx, qy);
  c.rotate(sway);
  c.strokeStyle = oxblood(env);
  c.lineWidth = 1.2 * k;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, QN.drop * k);
  c.stroke();
  qLineAt(c, env, 0, QN.drop * k, text, Math.max(0.7, poolAt(POOL_B, 270, BOARD.threadY + 20)));
  c.restore();
}
/** the one-line question card drawn with its top centre at (x, y) */
function qLineAt(c: C, env: PaintEnv, x: number, y: number, text: string, light = 0.85) {
  const k = BK;
  c.font = `400 ${QN.font * k}px ${FONT.typewriter}`;
  const w = c.measureText(text).width + 2 * QN.padX * k, h = QN.h * k;
  const paper = paperTone(env, light);
  c.save();
  c.translate(x, y);
  c.fillStyle = withAlpha(env.mood.fg, 0.35);
  c.fillRect(-w / 2 + 2.5 * k, 3 * k, w, h);
  c.fillStyle = paper;
  c.fillRect(-w / 2, 0, w, h);
  c.fillStyle = withAlpha(env.mood.rim, 0.25 * light);
  c.fillRect(-w / 2, 0, w, 1.2 * k);
  // the clip
  c.fillStyle = mixLab(env.mood.halo, env.mood.set, 0.4);
  c.fillRect(-3 * k, -1.5 * k, 6 * k, 4 * k);
  c.fillStyle = mixLab(env.mood.ink, paper, 0.08);
  c.font = `400 ${QN.font * k}px ${FONT.typewriter}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, 0, h / 2 + 0.5 * k);
  c.restore();
}
