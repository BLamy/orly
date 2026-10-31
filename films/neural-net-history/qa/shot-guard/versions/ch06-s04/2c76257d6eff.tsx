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
 *
 * Round 6 (review r1): the naming card reads only 'lit MID-1990s' (a NEW candle: its out-date belongs to the shot that
 * puts it out) and leaves over 2.2 → 2.6 s, before the push; the push through the flame is held at ≤ 85 % luminance
 * under a dark vignette with the wick as a silhouette; the narrator's hands strike at twice the old size (tweed cuff and
 * fingers at the match, short sleeves from just off frame); the near chair back is ink and 120 px further left; the
 * pool's near row is ~85 % ink; the holdouts are spread wider (LeCun +40, Bengio +120) with long lantern-side floor
 * shadows; Bengio's lift starts at 13.75 with his card; the place tags fade before the pull-back shrinks them, and the
 * last 0.6 s hold still.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose } from '../../../film';
import { FONT, LAYERS, POSES, blendPose, defineShot, fogBank, mixLab, overscan, softPlate, toLayer, toScreen, withAlpha, withLife } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { cast, hands } from '../cast';
import { STUDY, STUDY_CAMS, candleX, studyCase, studyNear, studyRoom } from '../sets/study';
import { NAMING, shelfStateAt } from '../sets/studyState';
import { namedLabelStaged } from '../sets/ch05-s04-namedCard';
import { inkChairNear } from '../sets/ch06-s04-chair';
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

// round 4: the pool's crowd is a large, comfortable crowd: TWENTY figures in three depth rows, all facing the flame. The
// far and middle rows stand on L3 (hazed 0.6 / 0.4 toward the room); the near row stands on the action plane at the
// pool's right (hazed 0.3, so the holdouts stay the darkest shapes), facing LEFT into the candle, fronts warmly lit,
// two of them with paper stacks (reviewers). The whiteboard stands at the pool's left, clear of the near row.
type CrowdId = 'reviewerA' | 'reviewerB' | 'goerA' | 'goerB' | 'goerC' | 'goerD';
type CrowdQ = { id: CrowdId; x: number; s: number; dy: number; facing: 'left' | 'right'; pose: Pose; seed: number; haze: number };
const ROW = (ids: CrowdId[], xs: number[], s: number, dy: number, haze: number, seed0: number): CrowdQ[] =>
  xs.map((x, i) => ({ id: ids[i % ids.length], x, s, dy, facing: x < CX ? 'right' : 'left', pose: [POSES.stand, POSES.clasp, POSES.listen][(i + seed0) % 3], seed: seed0 + i, haze }));
const CROWD: CrowdQ[] = [
  // far row (small, high on the floor, deep in the haze)
  ...ROW(['goerD', 'goerC', 'goerB', 'reviewerB', 'goerA', 'goerC', 'goerD', 'goerB'], [-170, -96, -22, 50, 122, 552, 628, 704], 0.58, -26, 0.42, 61),
  // middle row (clear of the board at x 136…264)
  ...ROW(['goerB', 'reviewerA', 'goerA', 'goerC', 'goerD', 'reviewerB', 'goerA'], [-136, -48, 40, 106, 520, 606, 690], 0.7, -12, 0.18, 51),
];
/** the near row on L4 (feet on the stage floor), facing left into the flame */
// round 6 (review, art): the near row carries ink weight (~85 % ink, haze 0.12), rim-lit by the candle; only the far
// rows and the rim figures stay faint
const NEAR_HAZE = 0.12;
const NEAR: CrowdQ[] = [
  { id: 'goerA', x: 452, s: 0.86, dy: 0, facing: 'left', pose: POSES.clasp, seed: 81, haze: NEAR_HAZE },
  { id: 'reviewerA', x: 516, s: 0.88, dy: 0, facing: 'left', pose: POSES.listen, seed: 82, haze: NEAR_HAZE },
  { id: 'goerC', x: 582, s: 0.84, dy: 0, facing: 'left', pose: POSES.stand, seed: 83, haze: NEAR_HAZE },
  { id: 'reviewerB', x: 646, s: 0.86, dy: 0, facing: 'left', pose: POSES.listen, seed: 84, haze: NEAR_HAZE },
  { id: 'goerD', x: 708, s: 0.86, dy: 0, facing: 'left', pose: POSES.stand, seed: 85, haze: NEAR_HAZE },
];
const BOARD3 = { x: 200, y: FY3 - 224, w: 128, h: 84 };

// the rim: three named holdouts (L4), spaced far apart in the dark, facing OUT (right, away from the candle)
const HIN = { x: 806, seat: FY - 118 };
const WIN = { x: 862, sill: FY - 168, w: 150, h: 214 };
const DESK = { x0: 846, x1: 968, y: FY - 160 };
// round 6 (review, staging): spread ~1.3× wider along the dark edge (LeCun +40, Bengio +120)
const LEC = { x: 1126 };
const BEN = { x: 1426 };
/** each standing holdout's own small backlit opening, right behind his head and shoulders */
const LEC_WIN = { x: LEC.x + 6, sill: FY - 150, w: 128, h: 226 };
const BEN_WIN = { x: BEN.x + 6, sill: FY - 150, w: 128, h: 226 };
// the fainter holdouts (L3), and one more further out
const FAINT = [
  { id: 'faintA', x: 908, seed: 71, joined: false },
  { id: 'faintB', x: 1470, seed: 72, joined: true },
  { id: 'faintC', x: 1545, seed: 73, joined: true },
] as const;
const LAMP_S = 1.25;

// ------------------------------------------------------------------------------------------------ cameras (stage)
const C0: Camera3 = { x: CX, y: GEO.flame.y + 20, z: 820, lens: 1 };
const C0b: Camera3 = { x: CX + 10, y: GEO.flame.y + 48, z: 690, lens: 1 };
/** round 4: the pool, landed by 'fog' (candle, crowd, board and the rim's first window), and the 10% push to the board */
const CP: Camera3 = { x: 380, y: 430, z: 0, lens: 1 };
const CPb: Camera3 = { x: 334, y: 418, z: 92, lens: 1 };
const CW: Camera3 = { x: 752, y: 430, z: 0, lens: 1 };
const CR: Camera3 = { x: 1040, y: 450, z: 0, lens: 1 };
const CR2: Camera3 = { x: 1058, y: 456, z: 90, lens: 1 };
const CF: Camera3 = { x: 966, y: 432, z: -110, lens: 1 };
const STAGE_CAMS = [C0, C0b, CP, CPb, CW, CR, CR2, CF];

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
  fog: number;
  rim: number;
  hinton: number;
  lecun: number;
  bengio: number;
  thread: number;
  /** the candle's naming card: in on 'candle', out over 2.2 → 2.6 s (before the push enters the flame) */
  nameIn: number;
  nameOut: number;
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
      // round 4: it waits for the kit's naming card (which follows the candle onto the stage) to leave
      labelIn: Math.max(stage + 0.08, T.word('L0608', 'candle') - NAMING.lead + NAMING.rise + NAMING.hold + NAMING.fall),
      labelOut: T.wordEnd('L0608', 'anyway') + 0.5,
      // round 4: the white push-through is short (≈ 0.4 s, peaking on the cut, 'fiddly' − 0.2)
      push: stage - 0.3,
      stage,
      beaten: T.word('L0608', 'beaten'),
      fog: T.word('L0608', 'fog'),
      rim: T.beat('rim'),
      hinton,
      lecun: T.beat('lecun'),
      bengio: T.beat('bengio'),
      thread,
      nameIn: T.word('L0608', 'candle') - NAMING.lead,
      nameOut: 2.2,
      cam: camPath([
        [stage, C0],
        [stage + 0.4, C0b, sm],
        // land on the pool by 'fog' (the crowd, the board, the first rim window), push 10% to the board on 'beaten'
        [T.word('L0608', 'fog') - 0.25, CP, easeIO],
        [T.word('L0608', 'beaten') - 0.3, CP],
        [T.word('L0608', 'beaten') + 1.0, CPb, sm],
        [T.beat('rim') - 0.6, CPb],
        [hinton - 0.35, CR, easeIO],
        [thread - 0.1, CR2, sm],
        // round 6: the pull-back lands 0.6 s before the cut and holds still (the shot ends clean)
        [D - 0.6, CF, easeIO],
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
    const flash = t < b.stage ? win(t, b.stage - 0.2, b.stage) : 1 - win(t, b.stage, b.stage + 0.2);
    if (t < b.stage) shelf(f, t, tq, b);
    else stage(f, t, tq, b);

    if (flash > 0.002) {
      screenPass(f, (c) => {
        const P = f.mood;
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(640, 360, 20, 640, 360, 900);
        g.addColorStop(0, withAlpha(P.core, 0.6 * flash));
        g.addColorStop(0.4, withAlpha(mixLab(P.core, P.halo, 0.5), 0.4 * flash));
        g.addColorStop(1, withAlpha(P.halo, 0.18 * flash));
        c.fillStyle = g;
        c.fillRect(0, 0, 1280, 720);
      });
    }
    // round 6 (review): the push through the flame reads as light passing through, not a blank cream card: the frame
    // is held at ≤ 85 % luminance (a multiply), a dark vignette closes in, and the wick stands as a silhouette in the
    // flame until the cut
    const pushK = t < b.stage ? win(t, b.push - 0.15, b.push + 0.12) : 1 - win(t, b.stage, b.stage + 0.25);
    if (pushK > 0.002) {
      screenPass(f, (c) => {
        const P = f.mood;
        c.globalCompositeOperation = 'multiply';
        const v = Math.round(255 * (1 - 0.18 * pushK));
        c.fillStyle = `rgb(${v},${v},${v})`;
        c.fillRect(0, 0, 1280, 720);
        c.globalCompositeOperation = 'source-over';
        const vg = c.createRadialGradient(640, 300, 110, 640, 360, 800);
        vg.addColorStop(0, withAlpha(P.fg, 0));
        vg.addColorStop(0.45, withAlpha(P.fg, 0.4 * pushK));
        vg.addColorStop(1, withAlpha(P.ink, 0.88 * pushK));
        c.fillStyle = vg;
        c.fillRect(0, 0, 1280, 720);
      });
      if (t < b.stage) wickSilhouette(f, t, b, pushK);
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
  // round 4: the narrator's hands at half the old size (a tweed cuff, the match in the fingers), the working hand
  // entering from the frame's RIGHT edge, nearly level, the matchbox hand low at the bottom right
  // round 6 (review): the hands at twice that size (the tweed cuff, the shirt cuff and the fingers read at the match), their
  // sleeves entering from JUST off the right / lower-right edge, so no long dark rod crosses the shelf
  const entry = {
    R: toLayer(LAYERS.L4, cam, 1390, Math.min(700, tgt.y + 330)),
    L: toLayer(LAYERS.L4, cam, 1360, 820),
  };
  const strikeAt = toLayer(LAYERS.L4, cam, Math.min(1110, tgt.x + 260), Math.min(600, tgt.y + 230));
  const hp = u > 0 && u < 1 ? hands.act('strikeLight', u, SHELF_FLAME, { entry, scale: 0.5, strikeAt }) : null;
  // round 2 hand-off (legibility): on the shelf, the case board's pinned cards (C1-a's typed 1943 assumption) and the
  // wax's own small lettering are TEXTURE here: the belief is read on the kit's naming card (beliefCandle, at
  // 'candle', 26 px cap) and then on the stage label; the board is set dressing behind the shelf. The L4 draw context
  // is one scratch canvas per frame, so the role is set around the study's L4 pass and cleared right after.
  shelfTextRole(f, 'texture');
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: { drawFlames: false },
    extra: (c, env) => {
      // the new candle: the full stub, its flame on the top ring once lit, its tag MID-1990s
      // round 6 (review, candle rule): the kit's automatic naming card is switched off here (named: 0) and the staged
      // card names this NEW candle with 'lit MID-1990s' only (ending: 0: no out-date, no span until the shot that puts
      // it out); it leaves over 2.2 → 2.6 s, before the camera enters the flame
      beliefCandle(c, { x: SHELF_X, y: STUDY.shelf.y, view: FID, s: STUDY.shelf.s, flame: flameK, letters: 0, drawFlame: false, named: 0 }, env);
      const nk = Math.min(sm((tq - b.nameIn) / NAMING.rise), 1 - sm((t - b.nameOut) / 0.4));
      if (nk > 0.001) namedLabelStaged(c, { x: SHELF_X, y: STUDY.shelf.y, view: FID, s: STUDY.shelf.s, named: nk, ending: 0 }, env);
      waxCandle(c, { x: SHELF_X, y: STUDY.shelf.y, view: FID, s: STUDY.shelf.s, flame: flameK, letters: 0.85 }, env);
      if (hp) {
        c.save();
        c.filter = `blur(${(0.6 * env.pxScale).toFixed(2)}px)`;
        hands.draw(c, hp, env);
        c.restore();
      }
    },
  });
  const fl = hp ? hands.flameAt(hp) : null;
  if (fl) f.practical({ x: fl.x, y: fl.y, kind: 'candle', seed: 1995, intensity: 0.85 + 0.6 * pulse(t, b.strike0 + 0.36 * b.strikeDur - 0.05, 0.08, 0.4), radius: 34 });
  if (flameK > 0) f.practical({ x: SHELF_FLAME.x, y: SHELF_FLAME.y + 2, kind: 'candle', seed: 1996, intensity: 0.9 * flameK, radius: 40 + 10 * flameK });
  shelfTextRole(f, undefined);
  if (cam.z < 560) studyNear(f, { key: ID, cams: SHELF_CAMS, file: true });
}

/** set (or clear) the text role on the frame's L4 draw context (see the note in shelf()) */
function shelfTextRole(f: Frame, role: 'texture' | undefined) {
  f.layer('L4', (c) => {
    (c as C & { __textRole?: 'subject' | 'texture' }).__textRole = role;
  });
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
  // round 4: the tint crossfade runs through the push and finishes by ~4.5 s, so the stage pool reads ROSE (and hands
  // on to ch06-s05's duskRose)
  f.setMood('duskRose', { from: 'candleAmber', u: Math.max(win(t, b.stage - 0.3, b.stage + 0.25) * 0.55, win(t, b.stage - 0.3, b.fog - 0.2)) });

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
  // round 6 (review, sync): Bengio's lantern starts up at 13.75 (not before 'Yoshua'), arriving with his card
  const N = named('ben', b.bengio - 0.04 + 0.3, 13, 2);
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
    // review round 3: the rim room's ornamental near plane (a carved chair back, lower left). Round-3 hand-off re-sheet:
    // at scale 1 its crest rose to y ≈ 450 behind the left crowd and its stile ran under the GEOFFREY HINTON card;
    // at 0.75 its crest sits at y ≈ 494 (below every face) and, drifting left with the truck, it stays at x ≤ 128 in
    // the rim frames, clear of all three name cards (Bengio's included) and of the NCAP label
    // round 6 (review, art): the kit's chair back (fg grey) is replaced by sets/ch06-s04-chair.ts's INK chair, 120 px
    // further left so only its stile, an ear of the crest and half the pierced splat show (drawn after the stage)
    back: (c, env) => {
      // the back rank of the crowd, facing the flame; the whiteboard with the clean bowl
      bowlBoard(c, { x: BOARD3.x, y: BOARD3.y, floorY: FY3 - 14, w: BOARD3.w, h: BOARD3.h, light: 0.8, roll: beatenRoll }, env);
      for (const q of CROWD) {
        // each row hazed toward the room by its depth; the candle-facing edge warmly lit
        const ink = mixLab(env.fill('ink'), env.mood.haze, q.haze);
        const toFlame = { x: q.x < CX ? 1 : -1, y: -0.25 };
        GEN6[q.id].draw(c, { x: q.x, y: FY3 + q.dy, facing: q.facing, pose: withLife(q.pose, tq, q.seed, 0.6), scale: q.s, cutLines: false, ink, edgeRim: { ...toFlame, px: 1.4, alpha: 0.55 * (1 - q.haze), warm: 1 } }, env);
      }
      // the dark beyond the pool (round 4: ~30% darker): the candle's light falls away toward the rim, so each window
      // and lantern is the only light around its figure
      const dk = c.createLinearGradient(600, 0, 1000, 0);
      dk.addColorStop(0, withAlpha(env.mood.fg, 0));
      dk.addColorStop(1, withAlpha(env.mood.fg, 0.72));
      c.fillStyle = dk;
      c.fillRect(600, -400, 2600, 1600);
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
      // round 4: a wider, rose pool on the floor (≈ 760 px across, its bright core ≈ 600): the crowd stands in it, the
      // three holdouts stand past its rim
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.translate(CX + 40, FY + 12);
      c.scale(1, 0.14);
      const rose = mixLab(env.mood.rim, env.mood.sky[3], 0.5);
      const pg = c.createRadialGradient(0, 0, 20, 0, 0, 390);
      pg.addColorStop(0, withAlpha(rose, 0.34));
      pg.addColorStop(0.72, withAlpha(rose, 0.2));
      pg.addColorStop(1, withAlpha(rose, 0));
      c.fillStyle = pg;
      c.fillRect(-400, -400, 800, 800);
      c.restore();
      // the floor past the rim falls into the dark (before anything at the rim is drawn, so the windows stay lit)
      const fd = c.createLinearGradient(700, 0, 980, 0);
      fd.addColorStop(0, withAlpha(env.mood.fg, 0));
      fd.addColorStop(1, withAlpha(env.mood.fg, 0.55));
      c.fillStyle = fd;
      c.fillRect(700, FY - 8, 2200, 600);
      waxCandle(c, { x: g.candleX, y: g.floorY, view: FID, s: STAGE_S, flame: 1, letters: 0.42 }, env);
      // the near row of the crowd, inside the pool, facing the flame (fronts warm in its light)
      for (const q of NEAR) {
        const ink = mixLab(PUPPET_NEAR_BLACK, env.mood.haze, q.haze);
        GEN6[q.id].draw(c, { x: q.x, y: FY, facing: 'left', pose: withLife(q.pose, tq, q.seed, 0.6), scale: q.s, cutLines: false, ink, edgeRim: { x: -1, y: -0.2, px: 2.6, alpha: 0.95, warm: 1 } }, env);
      }
      // long shadows first (away from the candle): soft-edged dark cut-outs laid along the floor, no strokes
      const shade = (pup: (typeof cast)['lecun'], pose: Pose) => (cc: C) => {
        cc.filter = `blur(${(3 * env.pxScale).toFixed(1)}px)`;
        pup.draw(cc, { x: 0, y: 0, facing: 'right', pose, cutLines: false, ink: env.mood.fg, edgeRim: { x: 0, y: -1, alpha: 0 } }, env);
        cc.filter = 'none';
      };
      floorShadow(c, g, LEC.x, shade(cast.lecun, L.pose), env, 1.1);
      floorShadow(c, g, BEN.x, shade(cast.bengio, N.pose), env, 1.1);
      floorShadow(c, g, HIN.x, shade(cast['hinton-young'], H.pose), env, 0.9);
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
        g.addColorStop(0, withAlpha(env.mood.halo, 0.36 * h.lamp));
        g.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = g;
        c.fillRect(-R, -R, 2 * R, 2 * R);
        c.restore();
      }
      c.restore();
      // round 6 (review, staging): each holdout throws a long shadow ~200 px along the floor, away from the candle,
      // through his own lantern's pool (a soft dark streak, low alpha)
      for (const h of [H, L, N]) {
        const sx = h.x + 6;
        const sg = c.createLinearGradient(sx, 0, sx + 210, 0);
        sg.addColorStop(0, withAlpha(mixLab(env.mood.fg, env.mood.ink, 0.5), 0.72));
        sg.addColorStop(1, withAlpha(env.mood.fg, 0));
        c.fillStyle = sg;
        c.beginPath();
        c.moveTo(sx - 8, FY + 1);
        c.lineTo(sx + 210, FY + 3);
        c.lineTo(sx + 210, FY + 12);
        c.lineTo(sx - 8, FY + 7);
        c.closePath();
        c.fill();
      }
      // the place tags lowered from the flies as each is named (place stamps, in the world)
      // round 6 (review, legibility): 22 px type (cap ≥ 22 px at 1080p through the rim frames), and the tags fade out as
      // the pull-back starts (16.3 → 16.9), before the camera's widening shrinks them under the floor
      const tagA = 1 - win(t, b.thread + 1.05, b.thread + 1.6);
      const tag = (x: number, text: string, at: number, seed: number) => {
        const d = sm((tq - at - 0.05) / 0.55);
        const sway = 0.06 * Math.exp(-Math.max(0, tq - at - 0.55) * 1.6) * Math.sin((tq - at) * 6 + seed);
        if (tagA > 0.01) hangTag(c, { x, y: 196, text, drop: d, sway, size: 22, alpha: tagA }, env);
      };
      tag(HIN.x + 20, 'TORONTO', b.hinton, 1);
      tag(LEC.x + 6, 'HOLMDEL / NEW YORK', b.lecun, 2);
      tag(BEN.x + 6, 'MONTRÉAL', b.bengio, 3);
    },
  });
  inkChairNear(f, { ref: STAGE_CAMS[STAGE_CAMS.length - 1], scale: 0.75, shiftX: 120 });
  // 'fog': a thin bank rolls in from the left across the crowd's feet, and thins as the camera leaves the pool
  const fogU = win(t, b.fog - 0.35, b.fog + 0.7) * (1 - 0.6 * win(t, b.rim, b.rim + 2));
  if (fogU > 0.01) {
    f.layer('L4', (c, env) => {
      c.save();
      c.translate(-380 * (1 - fogU), 0);
      fogBank(c, { y: FY + 10, height: 86, speed: 14, density: 0.75 * fogU, layers: 2, x0: -500, x1: 900, color: mixLab(env.mood.haze, env.mood.rim, 0.25), salt: 64 }, env);
      c.restore();
    });
  }
  // the hand-lanterns' light (practicals on the action plane)
  for (const [i, h] of [H, L, N].entries()) {
    const p = handLampLight(h.grip.x, h.grip.y, LAMP_S);
    f.practical({ x: p.x, y: p.y, kind: 'lamp', seed: 600 + i, intensity: 0.22 + 0.5 * h.lamp, radius: 22 + 10 * h.lamp });
  }
  // round 4, near plane (L5): the backs of two crowd heads at the bottom left, blurred, drifting out against the
  // truck right (drawn only once the camera is back from the flame)
  const nearK = clamp01((260 - cam.z) / 160);
  if (nearK > 0.01) {
    f.layer('L5', (c, env) => {
      c.save();
      c.globalAlpha *= nearK;
      c.fillStyle = env.fill('fg');
      for (const [hx, hy, k] of [[-250, 706, 1], [-74, 722, 0.92]] as const) {
        c.beginPath();
        // shoulders (a broad low curve off the bottom of frame), neck, the back of the head
        c.moveTo(hx - 120 * k, hy + 200);
        c.bezierCurveTo(hx - 118 * k, hy + 70 * k, hx - 70 * k, hy + 46 * k, hx - 26 * k, hy + 36 * k);
        c.lineTo(hx - 22 * k, hy + 8 * k);
        c.bezierCurveTo(hx - 52 * k, hy - 6 * k, hx - 54 * k, hy - 74 * k, hx - 6 * k, hy - 84 * k);
        c.bezierCurveTo(hx + 42 * k, hy - 90 * k, hx + 54 * k, hy - 30 * k, hx + 30 * k, hy + 6 * k);
        c.lineTo(hx + 30 * k, hy + 36 * k);
        c.bezierCurveTo(hx + 76 * k, hy + 44 * k, hx + 120 * k, hy + 72 * k, hx + 124 * k, hy + 200);
        c.closePath();
        c.fill();
        // the candle's warm rim on the flame side of each head
        c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.35);
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(hx + 44 * k, hy - 26 * k);
        c.bezierCurveTo(hx + 50 * k, hy - 56 * k, hx + 30 * k, hy - 86 * k, hx - 4 * k, hy - 85 * k);
        c.stroke();
      }
      c.restore();
    });
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

/** the wick, a dark silhouette standing in the flame as the camera passes through it (screen-locked, after the flash) */
function wickSilhouette(f: Frame, t: number, b: B, k: number) {
  let cam = mixCam(CAM_SHELF0, CAM_SHELF1, sm(t / b.push));
  if (t > b.push) cam = mixCam(cam, CAM_FLAME, sm((t - b.push) / (b.stage - b.push)));
  const s = STUDY.shelf.s;
  // a thin, short wick (about a fifth of the flame's width), curling a little at its tip
  const base = toScreen(LAYERS.L4, cam, SHELF_FLAME.x, SHELF_FLAME.y + 2 * s);
  const tip = toScreen(LAYERS.L4, cam, SHELF_FLAME.x + 0.8 * s, SHELF_FLAME.y - 4.5 * s);
  const w = Math.max(1.2, 0.85 * s * base.k);
  screenPass(f, (c) => {
    c.globalAlpha = Math.min(1, 1.2 * k);
    c.strokeStyle = mixLab(f.mood.ink, '#000000', 0.4);
    c.lineCap = 'round';
    c.lineWidth = w;
    c.beginPath();
    c.moveTo(base.x, base.y);
    c.quadraticCurveTo(base.x, (base.y + tip.y) / 2, tip.x, tip.y);
    c.stroke();
    // the glowing ember at its tip
    c.fillStyle = withAlpha(mixLab(f.mood.core, '#e0782c', 0.6), 0.55);
    c.beginPath();
    c.arc(tip.x, tip.y, w * 0.5, 0, Math.PI * 2);
    c.fill();
  });
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
  nameCardLg(c, { name: 'Yoshua Bengio', role: 'Montréal', x: at(b.bengio, BEN.x) + 70, y, align: 'right', at: b.bengio - 0.25, dur: b.thread - b.bengio + 0.5, fade: 0.35 }, env, k);
}

void overscan;
void (null as unknown as StageGeo);
