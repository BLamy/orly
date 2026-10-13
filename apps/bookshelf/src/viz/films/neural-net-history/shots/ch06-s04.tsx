/**
 * ch06-s04 — the quiet-years candle, and the few holdouts at its rim (candleAmber → duskRose, cut in, 19.21 s).
 *
 * CAMERA: SHELF (low macro; the candle lit) → the flame push onto the stage → the pool → a slow truck to the rim
 *         → a slow push on the three names → a pull back that puts the big pool and the small lights in one frame.
 *   0 → 0.7      cut on action: the candle shelf (crossfadeMood duskRose → candleAmber, 0.7 s, no dip). The spent
 *                candles stand at left (1943 dark sleeve, 1958 guttered, 1969 out, c. 1980 guttered), the thin CYC
 *                taper still burning, and a new, uncut candle; the hands strike a match
 *   'candle'     the match touches the wick: the quiet-years candle is lit on its top ring, no sleeve yet, its base
 *                tag MID-1990s; the kit's candle-naming card (beliefCandle, studyState CANDLE_CUES) names it on the
 *                shelf; after the flash, on the stage, the belief (IBM Plex Mono, the era face) holds at upper right:
 *                NEURAL NETS ARE FIDDLY, / AND BEATEN ANYWAY (one label at a time, never both)
 *   'are'        the push through the flame (tint-crossfade candleAmber → duskRose as the camera passes through):
 *                on the stage the same candle stands huge and casts a wide duskRose pool. Inside it, facing the
 *                flame: a comfortable crowd (conference-goers, reviewers with papers) and a whiteboard with the
 *                clean bowl; on 'beaten' a dot rolls into the bowl's single bottom (the chapter's SVM, winning)
 *   'rim'        the camera drifts right into the dark: a few small figures at the rim, facing out, each with a
 *                small tin hand-lantern held low, long shadows thrown away from the candle; three of them nearer
 *   'Geoffrey'   Hinton, SEATED at a desk by a free-standing Toronto window (winter beyond the glass), lifts his
 *                lantern; name card; a place tag TORONTO lowers from the flies
 *   'Yann'       LeCun, standing, lifts his; name card; tag HOLMDEL / NEW YORK
 *   'Yoshua'     Bengio, standing, lifts his; name card; tag MONTRÉAL
 *   thread       as LeCun's quoted words begin: a thin thread of light runs lantern to lantern through the dark (the
 *                three named and two of the fainter ones); the joined lanterns brighten; label
 *                2004 · CIFAR NCAP · Hinton, Bengio, others. The camera pulls back: the big pool does not notice.
 *
 * TEXT: the belief label and the NCAP label (two items); the three name cards and three place tags are cards/stamps.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose } from '../../../film';
import { FONT, LAYERS, POSES, blendPose, defineShot, mixLab, overscan, softPlate, toLayer, toScreen, withAlpha, withLife } from '../../../film';
import { cast, hands } from '../cast';
import { STUDY, STUDY_CAMS, candleX, studyCase, studyNear, studyRoom } from '../sets/study';
import { shelfStateAt } from '../sets/studyState';
import { beliefCandle, candleFlame } from '../sets/beliefCandle';
import { STAGE, candleStage, floorShadow, stageGeo, type StageGeo } from '../sets/candleStage';
import { waxCandle } from '../sets/ch02-s04-waxCandle';
import { nameCardLg } from '../sets/ch02-s01-nameCardLg';
import { lightThread, officeStool, pulse, simpleDesk } from '../sets/ch05-s07-kit';
import { clamp01, camPath, easeIO, mixCam, monoLabel, screenPass, sm, tq12, win } from '../sets/ch06-s01-kit';
import { rimWindow } from '../sets/ch06-s04-rimWindows';
import { GEN6, LIFT_LOW, LIFT_UP, SIT_LOW, SIT_UP, bowlBoard, handLamp, handLampLight, hangTag, torontoWindow } from '../sets/ch06-s04-holdouts';

type C = CanvasRenderingContext2D;
type P = { x: number; y: number };
const ID = 'ch06-s04';

// ------------------------------------------------------------------------------------------------ the shelf
const VIEWS_END = shelfStateAt(ID, 'end');
const FID = VIEWS_END.find((v) => v.id === 'fiddly')!;
const SHELF_X = candleX(VIEWS_END, 'fiddly');
const SHELF_FLAME = candleFlame({ x: SHELF_X, y: STUDY.shelf.y, view: FID, s: STUDY.shelf.s });
const CAM_SHELF0: Camera3 = { x: SHELF_X - 96, y: STUDY.shelf.y - 136, z: 400, lens: 1 };
const CAM_SHELF1: Camera3 = { x: SHELF_X - 30, y: STUDY.shelf.y - 150, z: 480, lens: 1 };
const CAM_FLAME: Camera3 = { x: SHELF_FLAME.x, y: SHELF_FLAME.y - 6, z: 900, lens: 1.4 };
const SHELF_CAMS = [CAM_SHELF0, CAM_SHELF1, STUDY_CAMS.board];

// ------------------------------------------------------------------------------------------------ the stage (L4 world)
const CX = 360;
/** the new candle is uncut (no sleeve yet): the ch05-s07 stage scale keeps its flame inside the wide frame */
const STAGE_S = 1.62;
const GEO = stageGeo({ candle: FID, candleX: CX, s: STAGE_S });
const FY = STAGE.floorY;
/** the back rank's floor line on L3 (rest-screen px: it lands just above the L4 floor edge in every stage camera) */
const FY3 = 601;
/** back-rank figures are cut smaller (rest-screen coordinates carry no size falloff of their own) */
const S3 = 0.82;

// the pool's crowd: ELEVEN hazed figures on L3, inside the warm pool, mid-left, all facing the candle and the
// whiteboard (two ranks: the nearer at S3, the further smaller); the action plane belongs to the rim alone
type CrowdId = 'reviewerA' | 'reviewerB' | 'goerA' | 'goerB' | 'goerC' | 'goerD';
const CROWD: { id: CrowdId; x: number; s: number; dy: number; facing: 'left' | 'right'; pose: Pose; seed: number }[] = [
  // the further rank (smaller, a little higher on the floor)
  { id: 'goerD', x: -40, s: 0.64, dy: -14, facing: 'right', pose: POSES.stand, seed: 61 },
  { id: 'goerC', x: 62, s: 0.66, dy: -14, facing: 'right', pose: POSES.clasp, seed: 62 },
  { id: 'reviewerB', x: 160, s: 0.64, dy: -14, facing: 'right', pose: POSES.listen, seed: 63 },
  { id: 'goerB', x: 250, s: 0.66, dy: -14, facing: 'right', pose: POSES.stand, seed: 64 },
  { id: 'reviewerA', x: 628, s: 0.64, dy: -14, facing: 'left', pose: POSES.listen, seed: 65 },
  { id: 'goerD', x: 712, s: 0.66, dy: -14, facing: 'left', pose: POSES.clasp, seed: 66 },
  // the nearer rank
  { id: 'goerB', x: 12, s: S3, dy: 0, facing: 'right', pose: POSES.stand, seed: 51 },
  { id: 'reviewerA', x: 112, s: S3, dy: 0, facing: 'right', pose: POSES.listen, seed: 52 },
  { id: 'goerA', x: 212, s: S3, dy: 0, facing: 'right', pose: POSES.clasp, seed: 53 },
  { id: 'reviewerB', x: 600, s: S3, dy: 0, facing: 'left', pose: POSES.listen, seed: 54 },
  { id: 'goerC', x: 684, s: S3, dy: 0, facing: 'left', pose: POSES.stand, seed: 55 },
];
const BOARD3 = { x: 470, y: FY3 - 224, w: 128, h: 84 };

// the rim: three named holdouts (L4), spaced far apart in the dark, facing OUT (right, away from the candle)
const HIN = { x: 806, seat: FY - 118 };
const WIN = { x: 862, sill: FY - 168, w: 150, h: 214 };
const DESK = { x0: 846, x1: 968, y: FY - 160 };
const LEC = { x: 1086 };
const BEN = { x: 1306 };
/** each standing holdout's own small backlit opening, right behind his head and shoulders */
const LEC_WIN = { x: LEC.x + 6, sill: FY - 150, w: 128, h: 226 };
const BEN_WIN = { x: BEN.x + 6, sill: FY - 150, w: 128, h: 226 };
// the fainter holdouts (L3), and one more further out
const FAINT = [
  { id: 'faintA', x: 908, seed: 71, joined: false },
  { id: 'faintB', x: 1318, seed: 72, joined: true },
  { id: 'faintC', x: 1428, seed: 73, joined: true },
] as const;
const LAMP_S = 1.25;

// ------------------------------------------------------------------------------------------------ cameras (stage)
const C0: Camera3 = { x: CX, y: GEO.flame.y + 20, z: 820, lens: 1 };
const C0b: Camera3 = { x: CX + 10, y: GEO.flame.y + 48, z: 690, lens: 1 };
const CW: Camera3 = { x: 752, y: 430, z: 0, lens: 1 };
const CR: Camera3 = { x: 1040, y: 450, z: 0, lens: 1 };
const CR2: Camera3 = { x: 1058, y: 456, z: 90, lens: 1 };
const CF: Camera3 = { x: 966, y: 432, z: -110, lens: 1 };
const STAGE_CAMS = [C0, C0b, CW, CR, CR2, CF];

interface B {
  D: number;
  strike0: number;
  strikeDur: number;
  lit: number;
  labelIn: number;
  labelOut: number;
  push: number;
  stage: number;
  beaten: number;
  rim: number;
  hinton: number;
  lecun: number;
  bengio: number;
  thread: number;
  cam: (t: number) => Camera3;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    // the strike: the match flares at 0.25 (u .36) and touches the wick just after 'candle' (u .6)
    const touch = T.beat('lit') + 0.04;
    const flare = 0.25;
    const strikeDur = (touch - flare) / 0.24;
    const stage = T.word('L0608', 'are');
    const hinton = T.beat('hinton');
    const thread = T.beat('thread');
    const b: B = {
      D,
      strikeDur,
      strike0: flare - 0.36 * strikeDur,
      lit: touch,
      // round 1 (candle rule): on the shelf the kit's naming card (beliefCandle, at 'candle') carries the belief with
      // its date range; this screen label takes over only after the flash, on the stage, so the two never overlap
      labelIn: stage + 0.08,
      labelOut: T.wordEnd('L0608', 'anyway') + 0.5,
      push: stage - 0.62,
      stage,
      beaten: T.word('L0608', 'beaten'),
      rim: T.beat('rim'),
      hinton,
      lecun: T.beat('lecun'),
      bengio: T.beat('bengio'),
      thread,
      cam: camPath([
        [stage, C0],
        [stage + 0.55, C0b, sm],
        [stage + 3.5, CW, easeIO],
        [hinton - 0.35, CR, sm],
        [thread - 0.1, CR2, sm],
        [D - 0.15, CF, easeIO],
      ]),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const b = scene.b as B;
    // the bright pass over the cut: rises through the push, peaks at the cut, falls as the stage pulls back
    // brief (≈ 0.45 s): it peaks on the cut and is gone a quarter-second into the stage
    const flash = t < b.stage ? win(t, b.stage - 0.2, b.stage) : 1 - win(t, b.stage, b.stage + 0.25);
    if (t < b.stage) shelf(f, t, tq, b);
    else stage(f, t, tq, b);

    if (flash > 0.002) {
      screenPass(f, (c) => {
        const P = f.mood;
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(640, 360, 20, 640, 360, 900);
        g.addColorStop(0, withAlpha(P.core, 0.85 * flash));
        g.addColorStop(0.4, withAlpha(mixLab(P.core, P.halo, 0.5), 0.6 * flash));
        g.addColorStop(1, withAlpha(P.halo, 0.3 * flash));
        c.fillStyle = g;
        c.fillRect(0, 0, 1280, 720);
      });
    }
    // ---- screen-locked type
    screenPass(f, (c) => {
      const lab = win(t, b.labelIn, b.labelIn + 0.45) * (1 - win(t, b.labelOut, b.labelOut + 0.45));
      if (lab > 0.01) beliefLabel(c, f, lab, 936, 92);
      if (t > b.hinton - 0.6) names(c, f, t, b);
      const nl = win(t, b.thread + 0.2, b.thread + 0.75);
      monoLabel(c, '2004 · CIFAR NCAP · Hinton, Bengio, others', 640, 604, { mood: f.mood, a: nl, align: 'center', size: 21 });
    });
  },
});

// ================================================================================================= SHELF
function shelf(f: Frame, t: number, tq: number, b: B) {
  const u = clamp01((tq - b.strike0) / b.strikeDur);
  const caught = tq >= b.lit;
  const flameK = caught ? Math.min(1, 0.55 + 0.45 * sm((tq - b.lit) / 0.3)) : 0;
  let cam = mixCam(CAM_SHELF0, CAM_SHELF1, sm(t / b.push));
  if (t > b.push) cam = mixCam(cam, CAM_FLAME, sm((t - b.push) / (b.stage - b.push)));
  f.camera(cam);
  if (t < 0.7) f.setMood('candleAmber', { from: 'duskRose', u: sm(t / 0.7) });
  studyRoom(f, { key: ID, cams: SHELF_CAMS, outside: { mood: 'duskRose', kind: 'night' } });
  // the working forearm enters from the right edge with the match; the matchbox hand stays at the bottom edge
  const tgt = toScreen(LAYERS.L4, cam, SHELF_FLAME.x, SHELF_FLAME.y);
  const entry = {
    R: toLayer(LAYERS.L4, cam, tgt.x + 1150, tgt.y + 1150 * Math.tan(0.5)),
    L: toLayer(LAYERS.L4, cam, tgt.x + 300, 1500),
  };
  const strikeAt = toLayer(LAYERS.L4, cam, Math.min(1180, tgt.x + 260), 716);
  const hp = u > 0 && u < 1 ? hands.act('strikeLight', u, SHELF_FLAME, { entry, scale: 0.5, strikeAt }) : null;
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: { drawFlames: false },
    extra: (c, env) => {
      // the new candle: the full stub, its flame on the top ring once lit, its tag MID-1990s
      beliefCandle(c, { x: SHELF_X, y: STUDY.shelf.y, view: FID, s: STUDY.shelf.s, flame: flameK, letters: 0, drawFlame: false }, env);
      waxCandle(c, { x: SHELF_X, y: STUDY.shelf.y, view: FID, s: STUDY.shelf.s, flame: flameK, letters: 0.85 }, env);
      if (hp) {
        c.save();
        c.filter = `blur(${(1.6 * env.pxScale).toFixed(2)}px)`;
        hands.draw(c, hp, env);
        c.restore();
      }
    },
  });
  const fl = hp ? hands.flameAt(hp) : null;
  if (fl) f.practical({ x: fl.x, y: fl.y, kind: 'candle', seed: 1995, intensity: 0.85 + 0.6 * pulse(t, b.strike0 + 0.36 * b.strikeDur - 0.05, 0.08, 0.4), radius: 34 });
  if (flameK > 0) f.practical({ x: SHELF_FLAME.x, y: SHELF_FLAME.y + 2, kind: 'candle', seed: 1996, intensity: 0.9 * flameK, radius: 40 + 10 * flameK });
  if (cam.z < 560) studyNear(f, { key: ID, cams: SHELF_CAMS, file: true });
}

// ================================================================================================= STAGE
interface Holdout {
  x: number;
  pose: Pose;
  lamp: number;
  grip: P;
}

/** the lantern lift for a name (on twos): 0 low … 1 up */
const liftAt = (tq: number, at: number) => sm((tq - (at - 0.3)) / 0.4);

function stage(f: Frame, t: number, tq: number, b: B) {
  const cam = b.cam(t);
  f.camera(cam);
  f.setMood('duskRose', { from: 'candleAmber', u: win(t, b.stage - 0.3, b.stage + 0.25) });

  // the joined lanterns brighten a little once the thread has reached them
  const threadU = (t - b.thread - 0.15) / 2.0;
  const joinK = (i: number) => 0.18 * sm(threadU * 5 - i);
  const rimK = win(t, b.rim - 0.4, b.rim + 0.8);
  const named = (who: 'hin' | 'lec' | 'ben', at: number, seed: number, ji: number): Holdout => {
    const u = liftAt(tq, at);
    const seated = who === 'hin';
    const base = seated ? blendPose(SIT_LOW, SIT_UP, u) : blendPose(LIFT_LOW, LIFT_UP, u);
    const pose = withLife(base, tq, seed, seated ? 0.5 : 0.8);
    const x = who === 'hin' ? HIN.x : who === 'lec' ? LEC.x : BEN.x;
    const pup = who === 'hin' ? cast['hinton-young'] : who === 'lec' ? cast.lecun : cast.bengio;
    const grip = pup.anchor({ x, y: FY, facing: 'right', pose }, 'handF');
    const lamp = 0.26 + 0.12 * rimK + 0.62 * u + joinK(ji);
    return { x, pose, lamp, grip };
  };
  const H = named('hin', b.hinton, 11, 0);
  const L = named('lec', b.lecun, 12, 1);
  const N = named('ben', b.bengio, 13, 2);
  const faintPose = (i: number) => withLife(blendPose(LIFT_LOW, LIFT_UP, 0.72 + 0.1 * i), tq, 31 + i, 0.6);

  const beatenRoll = sm((tq - b.beaten + 0.05) / 0.9);

  candleStage(f, {
    key: ID,
    cams: STAGE_CAMS,
    candle: FID,
    candleX: CX,
    s: STAGE_S,
    flame: 1,
    letters: 0,
    rimDir: { x: -1, y: -0.3 },
    back: (c, env) => {
      // the back rank of the crowd, facing the flame; the whiteboard with the clean bowl
      bowlBoard(c, { x: BOARD3.x, y: BOARD3.y, floorY: FY3 - 14, w: BOARD3.w, h: BOARD3.h, light: 0.8, roll: beatenRoll }, env);
      for (const q of CROWD) {
        c.save();
        // the further rank sits deeper in the haze
        if (q.s < S3) c.globalAlpha *= 0.72;
        GEN6[q.id].draw(c, { x: q.x, y: FY3 + q.dy, facing: q.facing, pose: withLife(q.pose, tq, q.seed, 0.6), scale: q.s, cutLines: false }, env);
        c.restore();
      }
      // the dark beyond the pool: the candle's light falls away into shadow toward the rim
      const dk = c.createLinearGradient(640, 0, 1120, 0);
      dk.addColorStop(0, withAlpha(env.mood.fg, 0));
      dk.addColorStop(1, withAlpha(env.mood.fg, 0.42));
      c.fillStyle = dk;
      c.fillRect(640, -400, 2600, 1600);
      // the fainter holdouts, far out along the dark edge, facing out, their lanterns small
      for (let i = 0; i < FAINT.length; i++) {
        const q = FAINT[i];
        const pup = GEN6[q.id];
        const pz = faintPose(i);
        pup.draw(c, { x: q.x, y: FY3, facing: 'right', pose: pz, scale: S3, cutLines: false }, env);
        const g = pup.anchor({ x: q.x, y: FY3, facing: 'right', pose: pz, scale: S3 }, 'handF');
        const k = 0.42 + 0.14 * rimK + (q.joined ? joinK(i + 2) * 1.6 : 0);
        handLamp(c, g.x, g.y, LAMP_S * S3, k, env);
      }
    },
    draw: (c, env, g) => {
      waxCandle(c, { x: g.candleX, y: g.floorY, view: FID, s: STAGE_S, flame: 1, letters: 0.42 }, env);
      // long shadows first (away from the candle)
      floorShadow(c, g, LEC.x, (cc) => cast.lecun.draw(cc, { x: 0, y: 0, facing: 'right', pose: L.pose }, env), env, 1.1);
      floorShadow(c, g, BEN.x, (cc) => cast.bengio.draw(cc, { x: 0, y: 0, facing: 'right', pose: N.pose }, env), env, 1.1);
      floorShadow(c, g, HIN.x, (cc) => cast['hinton-young'].draw(cc, { x: 0, y: 0, facing: 'right', pose: H.pose }, env), env, 0.9);
      // the rim: Hinton's corner (window flat, desk, chair), LeCun's and Bengio's own openings, then the three
      torontoWindow(c, { x: WIN.x, sill: WIN.sill, floorY: FY, w: WIN.w, h: WIN.h, t }, env);
      rimWindow(c, { ...LEC_WIN, floorY: FY, t, kind: 'holmdel' }, env);
      rimWindow(c, { ...BEN_WIN, floorY: FY, t, kind: 'montreal' }, env);
      simpleDesk(c, DESK.x0, DESK.x1, DESK.y, FY, env);
      officeStool(c, HIN.x - 8, HIN.seat, FY, 'right', env);
      const lightDir = { x: -1, y: -0.35, floor: 0.05 };
      cast['hinton-young'].draw(c, { x: HIN.x, y: FY, facing: 'right', pose: H.pose, cutLines: true, light: lightDir }, env);
      cast.lecun.draw(c, { x: LEC.x, y: FY, facing: 'right', pose: L.pose, cutLines: true, light: lightDir }, env);
      cast.bengio.draw(c, { x: BEN.x, y: FY, facing: 'right', pose: N.pose, cutLines: true, light: lightDir }, env);
      for (const h of [H, L, N]) handLamp(c, h.grip.x, h.grip.y, LAMP_S, h.lamp, env);
      // each lantern's own small pool on the floor (the little lights against the big one)
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (const h of [H, L, N]) {
        c.save();
        c.translate(h.grip.x - 10, FY + 8);
        c.scale(1, 0.16);
        const R = 70 + 40 * h.lamp;
        const g = c.createRadialGradient(0, 0, 4, 0, 0, R);
        g.addColorStop(0, withAlpha(env.mood.halo, 0.26 * h.lamp));
        g.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = g;
        c.fillRect(-R, -R, 2 * R, 2 * R);
        c.restore();
      }
      c.restore();
      // the place tags lowered from the flies as each is named (place stamps, in the world)
      const tag = (x: number, text: string, at: number, seed: number) => {
        const d = sm((tq - at - 0.05) / 0.55);
        const sway = 0.06 * Math.exp(-Math.max(0, tq - at - 0.55) * 1.6) * Math.sin((tq - at) * 6 + seed);
        hangTag(c, { x, y: 196, text, drop: d, sway, size: 20 }, env);
      };
      tag(HIN.x + 20, 'TORONTO', b.hinton, 1);
      tag(LEC.x + 6, 'HOLMDEL / NEW YORK', b.lecun, 2);
      tag(BEN.x + 6, 'MONTRÉAL', b.bengio, 3);
    },
  });
  // the hand-lanterns' light (practicals on the action plane)
  for (const [i, h] of [H, L, N].entries()) {
    const p = handLampLight(h.grip.x, h.grip.y, LAMP_S);
    f.practical({ x: p.x, y: p.y, kind: 'lamp', seed: 600 + i, intensity: 0.22 + 0.5 * h.lamp, radius: 22 + 10 * h.lamp });
  }
  // the thread of light, lantern to lantern (screen space: the lanterns stand on two depths)
  if (t > b.thread) {
    const pts: P[] = [];
    const lp = (layer: 'L3' | 'L4', g: P) => {
      const q = handLampLight(g.x, g.y, LAMP_S);
      const s = toScreen(LAYERS[layer], cam, q.x, q.y);
      return { x: s.x, y: s.y };
    };
    const fa = FAINT[1], fb = FAINT[2];
    const ga = GEN6[fa.id].anchor({ x: fa.x, y: FY3, facing: 'right', pose: faintPose(1), scale: S3 }, 'handF');
    const gb = GEN6[fb.id].anchor({ x: fb.x, y: FY3, facing: 'right', pose: faintPose(2), scale: S3 }, 'handF');
    const lp3 = (g: P) => {
      const q = handLampLight(g.x, g.y, LAMP_S * S3);
      const s = toScreen(LAYERS.L3, cam, q.x, q.y);
      return { x: s.x, y: s.y };
    };
    pts.push(lp('L4', H.grip), lp('L4', L.grip), lp('L4', N.grip), lp3(ga), lp3(gb));
    screenPass(f, (c) => {
      const env = { mood: f.mood } as PaintEnv;
      for (let i = 0; i < pts.length - 1; i++) {
        const u = clamp01(threadU * 4 - i);
        lightThread(c, env, pts[i], pts[i + 1], u, 0.9, 16);
      }
    });
  }
}

// ================================================================================================= TYPE
/** the belief, in the era face (IBM Plex Mono, from 1989): screen-locked, upper right, on a soft plate */
function beliefLabel(c: C, f: Frame, a: number, x: number, y: number) {
  const P = f.mood;
  c.save();
  c.globalAlpha = a;
  softPlate(c, x, y + 14, 640, 160, P.ink, 0.66);
  c.font = `500 30px ${FONT.mono}`;
  c.letterSpacing = '1.5px';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = mixLab(P.core, '#efe2c8', 0.45);
  c.fillText('NEURAL NETS ARE FIDDLY,', x, y - 10);
  c.fillText('AND BEATEN ANYWAY', x, y + 26);
  c.font = `500 20px ${FONT.mono}`;
  c.fillStyle = withAlpha(mixLab(P.core, '#efe2c8', 0.45), 0.8);
  c.fillText('MID-1990s', x, y + 62);
  c.letterSpacing = '0px';
  c.restore();
}

/** the three name cards, each under its owner as the lantern lifts (one at a time, handing on) */
function names(c: C, f: Frame, t: number, b: B) {
  const env = { t, mood: f.mood };
  const at = (who: number, x: number) => {
    const cam = b.cam(who);
    return toScreen(LAYERS.L4, cam, x, FY).x;
  };
  const k = 1.2;
  const y = 584;
  // Hinton's card sits to his left (behind him), so it can stay while LeCun's arrives to the right
  nameCardLg(c, { name: 'Geoffrey Hinton', role: 'Toronto', x: at(b.hinton, HIN.x) + 4, y, align: 'right', at: b.hinton - 0.25, dur: b.bengio - b.hinton - 0.2, fade: 0.35 }, env, k);
  nameCardLg(c, { name: 'Yann LeCun', role: 'Bell Labs, then NYU', x: at(b.lecun, LEC.x) - 40, y, at: b.lecun - 0.2, dur: b.bengio - b.lecun + 0.15, fade: 0.3 }, env, k);
  nameCardLg(c, { name: 'Yoshua Bengio', role: 'Montréal', x: at(b.bengio, BEN.x) + 70, y, align: 'right', at: b.bengio - 0.1, dur: b.thread - b.bengio + 0.35, fade: 0.35 }, env, k);
}

void overscan;
void (null as unknown as StageGeo);
