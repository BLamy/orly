/**
 * ch03-s03 — the second belief candle is lit, and Minsky stands at its rim (candleAmber → labGreen, 12.92 s).
 *
 * CAMERA: SHELF (low macro; the second candle lit), then the flame push onto the paper stage.
 *   cut in               the study shelf beneath the case board, in the banker's lamp's pool; under the cut the tint
 *                        crossfades from the dawn street's labGreen to candleAmber (0.7 s, no dip: STUDY LOCK). The
 *                        first candle's stub stands at the far left with its dark sixteen-ring sleeve.
 *   'second' (belief)    the hands strike a match; the kit's candle-naming card holds the belief beside the flame
 *                        (A MACHINE THAT LEARNS WILL SOON SEE, TALK AND THINK, with its date range — a paraphrase,
 *                        never in quotation marks), carried across the flame push
 *   'candle' (lit)       the match lights the second candle, flame on the top ring; the camera pushes into its
 *                        brightness (≈ 1.2 s, never through black) while the tint crossfades candleAmber → labGreen,
 *                        and we arrive on the paper stage, close on the same flame, huge, and pull back down its wax.
 *                        In the pool, facing the flame: Rosenblatt, the naval officer, the reporter (believers stand
 *                        in the light).
 *   'rim' (rim)          the camera drifts right and finds young Minsky (the Dartmouth puppet of ch02-s07) at the
 *                        rim, half in shadow, FACING OUT, his long shadow thrown across the floor toward us
 *   'Minsky' (built)     a tiny cut-out of his 1951 tube-rack learning machine glints at his feet
 *   'shape' → 'two'      his doubt becomes a picture: beside him a paper-cut shape lifts into the light (one piece);
 *   (minskycard)         on 'two' it is cut into two separate pieces with a gap between, and a cut-out question mark
 *                        rises beside it. Rosenblatt, inside the pool, turns toward the rim: two views, one light.
 *                        A slow push-in on the gap between them (< 3% of frame width per second).
 */
import { Timeline } from '../../../core';
import { FONT, LAYERS, POSES, PUPPET_NEAR_BLACK, blendPose, capPx1080, createPuppet, defineShot, ibm704, legibleSize, mixLab, overscan, pose, softPlate, toLayer, toScreen, tubeRack, withAlpha, withLife } from '../../../film';
import type { Camera3, Frame, PaintEnv, Pose } from '../../../film';
import { cast, hands } from '../cast';
import { STUDY, STUDY_CAMS, candleX, studyCase, studyNear, studyRoom } from '../sets/study';
import { NAMING, shelfStateAt } from '../sets/studyState';
import { candleFlame } from '../sets/beliefCandle';
import { STAGE, candleStage, floorShadow, stageGeo } from '../sets/candleStage';
import { handsEntry } from '../sets/narratorHands';
import { peakedCap } from '../sets/ch03-s01-peakedCap';
import { waxCandle } from '../sets/ch02-s04-waxCandle';
import { clamp01, lerp, mixCam, sm, tq12, win } from '../sets/ch03-s01-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch03-s03';

// ------------------------------------------------------------------------------------------------ the shelf
const VIEWS_END = shelfStateAt(ID, 'end');
const LEARNS = VIEWS_END.find((v) => v.id === 'learns')!;
/** the same candle under another id for the STAGE draw: the kit's naming card (which would print the candle's whole
 *  date range, its death included, while it is being lit) keys on the view id; this shot names it itself */
const LEARNS_STAGE = { ...LEARNS, id: 'learns-stage' };
const LOGIC = VIEWS_END.find((v) => v.id === 'logic')!;
const SHELF_X = candleX(VIEWS_END, 'learns');
const STUB_X = candleX(VIEWS_END, 'logic');
const SHELF_FLAME = candleFlame({ x: SHELF_X, y: STUDY.shelf.y, view: LEARNS, s: STUDY.shelf.s });
// low macro along the rings: the stub at frame left, the new candle centred-right
// round 1: the new candle sits left of centre so its label card can hold centre frame, clear of the flame
const CAM_SHELF0: Camera3 = { x: (SHELF_X + STUB_X) / 2 + 96, y: STUDY.shelf.y - 132, z: 404, lens: 1 };
const CAM_SHELF1: Camera3 = { x: SHELF_X + 82, y: STUDY.shelf.y - 150, z: 477, lens: 1 };
const CAM_FLAME: Camera3 = { x: SHELF_FLAME.x, y: SHELF_FLAME.y - 6, z: 900, lens: 1.4 };
const SHELF_CAMS = [CAM_SHELF0, CAM_SHELF1, STUDY_CAMS.board];

// ------------------------------------------------------------------------------------------------ the stage
/** round 1 (continuity): the SAME stage candle as ch03-s06 (the shared beliefCandle at s 1.8, x 470, its '1958'
 *  base tag), no candlestick: a drip on the rim and a melt cup glowing under the flame make it read as wax */
const CX = 470;
const STAGE_S = 1.8;
/** a TIGHT pool: its falloff ends between Rosenblatt and Minsky */
const POOL_K = 0.74;
const GEO = stageGeo({ candle: LEARNS, candleX: CX, s: STAGE_S, pool: POOL_K });
const FLAME_Y = GEO.flame.y;
/** the believers stand UPSTAGE inside the pool (feet higher, a touch smaller), staggered in depth */
const BELIEVERS = {
  rep: { x: CX - 262, y: 604, s: 0.84 },
  off: { x: CX - 150, y: 616, s: 0.9 },
  ros: { x: CX + 150, y: 622, s: 0.94 },
};
const ROS_X = BELIEVERS.ros.x;
/** Minsky: at the rim, NEARER the lens (feet lower, ~10% larger than Rosenblatt), his far side in shadow */
const MIN_S = 1.13;
const MIN_FEET = 670;
const MIN_X = GEO.rimX + 72;
/** the doubt's shape hangs in the GAP between Rosenblatt and Minsky, at the edge of the light */
const SHAPE = { x: (ROS_X + MIN_X) / 2 - 4, y: 448 };
const SNARC = { x: MIN_X - 40, y: MIN_FEET + 12 };
const SNARC_S = 0.28; // ~70 px: a small cut-out at his feet that still reads as a rack of tubes
/** the 1950s lab dressing (L3): a clerestory flat hung HIGH (its sill well above the flame, a dark gap round it,
 *  no window bays behind the candle), two low runs of 704-style cabinets */
const LAB = { winY: -70, winH: 120, winW: 170, pitch: 236, x0: -560, floor3: 612, skip: [180, 700] as [number, number] };
/** the stage lip, near (L5): a blurred apron edge with footlight hoods */
const LIP_Y = 742;

/** young Minsky as at Dartmouth (ch02-s07): the same cut-out */
const MINSKY = createPuppet({ ...cast.minsky.spec, id: 'minsky-s07', wardrobe: 'rolledSleeves', build: 'stocky', height: 298 });
/** he turns his head back toward the shape in the gap (still facing out), the near hand opening toward it */
const MIN_DOUBT: Pose = pose({ hipF: 3, kneeF: -2, hipB: -6, kneeB: 0, torso: -4, neck: 2, head: -4, shoulderF: -24, elbowF: 64, wristF: -10, shoulderB: -20, elbowB: 50 }, { handF: 'fist', handB: 'fist' });
const MIN_SHOW: Pose = pose({ hipF: 4, kneeF: -3, hipB: -5, kneeB: 0, torso: -2, neck: 2, head: 6, shoulderF: -10, elbowF: 50, wristF: -10, shoulderB: -22, elbowB: 30, wristB: 12 }, { handF: 'fist', handB: 'open' });
const ROS_FACE: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 0, neck: 9, head: -6, shoulderF: 4, elbowF: 18, wristF: 6, shoulderB: -6, elbowB: 14 });

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const lit = T.beat('lit');
    const b = {
      D,
      belief: T.beat('belief'),
      lit,
      push: lit + 0.15,
      cut: lit + 0.15 + 0.63,
      rim: T.beat('rim'),
      built: T.beat('built'),
      shape: T.word('L0306', 'shape'),
      one: T.word('L0306', 'one'),
      two: T.beat('minskycard'),
      nets: T.word('L0306', 'nets'),
      learns: T.word('L0305', 'machine'),
      lineEnd: T.line('L0305').end,
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const b = scene.b;
    // tint: in from the street's labGreen (0.7 s), then out to the stage's labGreen across the flame push
    const toStage = win(t, b.lit, b.lit + 1.2);
    if (t < 0.7) f.setMood('candleAmber', { from: 'labGreen', u: sm(t / 0.7) });
    else if (toStage > 0) f.setMood('labGreen', { from: 'candleAmber', u: toStage });
    // the bright pass over the cut: rises through the push, peaks at CUT, falls as the stage pulls back
    const flash = t < b.cut ? win(t, b.push - 0.05, b.cut) : 1 - win(t, b.cut, b.cut + 0.75);

    const flameOnScreen = t < b.cut ? shelf(f, t, tq, b) : stage(f, t, tq, b);

    if (flash > 0.002) {
      const c = f.c;
      c.save();
      c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
      c.globalCompositeOperation = 'lighter';
      const P = f.mood;
      const g = c.createRadialGradient(640, 360, 20, 640, 360, 900);
      g.addColorStop(0, withAlpha(P.core, 0.95 * flash));
      g.addColorStop(0.4, withAlpha(mixLab(P.core, P.halo, 0.5), 0.85 * flash));
      g.addColorStop(1, withAlpha(P.halo, 0.6 * flash));
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
      c.restore();
    }

    // THE NAMING CARD (this shot's own, round 1): the belief beside the flame with ONLY the year it is lit
    // ('lit 1958'): the candle is being lit here, so its end date must not show. Same timing and placement as the
    // kit's naming rule (studyState NAMING), carried screen-locked across the flame push.
    // round 1: up from the head of the shot (legible from ~0.1 s), held through 'second' and the strike, and only
    // fading once the flame push is under way (≥ 1.2 s of reading before the push)
    void NAMING;
    const k = Math.min(sm(t / 0.12), 1 - win(t, b.push + 0.12, b.push + 0.4));
    if (k > 0.001) namingCard(f, flameOnScreen, k, t < b.cut);
  },
});

type B = { D: number; belief: number; lit: number; push: number; cut: number; rim: number; built: number; shape: number; one: number; two: number; nets: number; learns: number; lineEnd: number };
type F = Frame;

// ================================================================================================= SHELF
function shelf(f: F, t: number, tq: number, b: B): { x: number; y: number } {
  const strikeDur = 1.6;
  const s0 = b.lit - 0.6 * strikeDur;
  // the strike runs at its own pace up to the light (U 0.6, on 'candle'); then the hand stays at the wick only
  // a beat (0.12 s) and withdraws to the bottom-right in 0.25 s, before the flame push magnifies the frame
  const caughtAt = s0 + 0.6 * strikeDur;
  const u = tq < caughtAt ? clamp01((tq - s0) / strikeDur) : tq < caughtAt + 0.12 ? 0.6 + (0.2 * (tq - caughtAt)) / 0.12 : Math.min(1, 0.8 + (0.2 * (tq - caughtAt - 0.12)) / 0.25);
  const caught = u >= 0.6 ? 1 : 0;
  const flameK = caught ? Math.min(1, 0.55 + sm((tq - caughtAt) / 0.3) * 0.45) : 0;
  let cam = mixCam(CAM_SHELF0, CAM_SHELF1, sm(t / (b.lit - 0.05)));
  if (t > b.push) cam = mixCam(cam, CAM_FLAME, sm((t - b.push) / 0.63));
  f.camera(cam);
  studyRoom(f, { key: ID, cams: SHELF_CAMS, outside: { mood: 'labGreen', kind: 'dawn' } });
  // ONE forearm enters from the right edge at ~30° with the match; the matchbox hand stays at the bottom edge,
  // mostly off frame (entries and strike point are set in SCREEN terms, then taken into the shelf's layer)
  // round 1: only the HAND and its cuff come in, from the frame's bottom-right, at 60% of the first cut's scale,
  // so the match and its flame stay the subject (no diagonal slab of sleeve across the frame)
  const tgt = toScreen(LAYERS.L4, cam, SHELF_FLAME.x, SHELF_FLAME.y);
  const entry = {
    // a steep forearm from the bottom edge just right of the candle: it reaches UP to the wick between the
    // candle and its label (never across the card), so the reach reads as a hand, not a pole across frame
    R: toLayer(LAYERS.L4, cam, tgt.x + 150, 1150),
    L: toLayer(LAYERS.L4, cam, tgt.x + 340, 1300),
  };
  const strikeAt = toLayer(LAYERS.L4, cam, tgt.x + 236, 664);
  // the hand keeps its small on-screen size while the flame push magnifies the shelf (it is leaving the frame)
  const sNow = (1000 * cam.lens) / (1000 - cam.z), sBase = 1000 / (1000 - CAM_SHELF1.z);
  // round 1: the glove at a readable size (the hand and cuff read; the matchstick is a matchstick), and the match
  // is shaken out the moment the wick catches (never two flames side by side)
  const hs = 0.58 * Math.min(1, sBase / sNow);
  const hp = u > 0 && u < 1 ? hands.act('strikeLight', u, SHELF_FLAME, { entry, scale: hs, strikeAt }) : null;
  if (hp?.right && u >= 0.62) hp.right = { ...hp.right, lit: 0 };
  void handsEntry;
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: { hideUnlit: false, only: ['logic', 'learns'], over: { learns: { flame: flameK, letters: 0 } }, drawFlames: false, named: {} },
    extra: (c, env) => {
      waxCandle(c, { x: SHELF_X, y: STUDY.shelf.y, view: LEARNS, s: STUDY.shelf.s, flame: flameK, letters: 0.8 }, env);
      if (hp) {
        // the near arm is softened (it is nearer the lens than the shelf): a light blur, a touch of haze
        c.save();
        c.filter = `blur(${(1.6 * env.pxScale).toFixed(2)}px)`;
        hands.draw(c, hp, env);
        c.restore();
      }
    },
  });
  const fl = hp ? hands.flameAt(hp) : null;
  if (fl) f.practical({ x: fl.x, y: fl.y, kind: 'candle', seed: 1958, intensity: 0.85, radius: 34 });
  if (cam.z < 560) studyNear(f, { key: ID, cams: SHELF_CAMS, file: true });
  void LOGIC;
  return toScreen(LAYERS.L4, cam, SHELF_FLAME.x, SHELF_FLAME.y);
}

// ================================================================================================= STAGE
function stage(f: F, t: number, tq: number, b: B): { x: number; y: number } {
  // camera: close on the flame → pull back down the wax to the wide (flame high in frame with dark round it, the
  // pool radiating on the floor) → on 'rim' a drift right onto Minsky → a slow push on the GAP between Rosenblatt
  // and Minsky for the last ~6 s (≈ 2.5% of frame width per second at most)
  const C0: Camera3 = { x: CX, y: FLAME_Y + 30, z: 760, lens: 1 };
  const C0b: Camera3 = { x: CX + 10, y: FLAME_Y + 70, z: 600, lens: 1 };
  const CW: Camera3 = { x: 470, y: 342, z: 1000 - 1000 / 0.92, lens: 1 };
  const CR: Camera3 = { x: 540, y: 352, z: 1000 - 1000 / 0.97, lens: 1 };
  const CE: Camera3 = { x: 640, y: 384, z: 1000 - 1000 / 1.12, lens: 1 };
  const PB0 = b.cut + 0.45, PB1 = b.learns + 1.6;
  const R0 = b.rim - 1.0, R1 = b.rim + 0.6;
  const P0 = Math.min(b.rim + 1.0, b.D - 6);
  let cam: Camera3;
  if (t < PB0) cam = mixCam(C0, C0b, sm((t - b.cut) / (PB0 - b.cut)));
  else if (t < PB1) cam = mixCam(C0b, CW, sm((t - PB0) / (PB1 - PB0)));
  else if (t < R0) cam = CW;
  else if (t < R1) cam = mixCam(CW, CR, sm((t - R0) / (R1 - R0)));
  else cam = mixCam(CR, CE, sm((t - P0) / (b.D - P0)));
  f.camera(cam);

  // SNARC: dim at his feet until 'Minsky', then a 0.5 s glint, then dim again
  const flash = win(t, b.built - 0.06, b.built + 0.06) * (1 - win(t, b.built + 0.3, b.built + 0.5));
  // the doubt (round 1): the WHOLE disc lifts into the light on 'shape' and holds intact through 'one piece';
  // on 'two' it splits FAST (0.3 s, on twos) into two pieces with a clear gap, and the question mark rises
  const show = win(tq, b.shape - 0.2, b.shape + 0.25);
  const split = clamp01((tq - (b.two - 0.15)) / 0.3);
  const rosTurn = tq >= b.nets ? 1 : 0; // the profile flip, on a hold
  const minP = withLife(blendPose(MIN_DOUBT, MIN_SHOW, show), tq, 1951, 0.8);
  const rosP = withLife(rosTurn ? ROS_FACE : POSES.listen, tq, 1928, 0.9);
  const offP = withLife(POSES.clasp, tq, 58, 0.8);
  const repP = withLife(POSES.listen, tq, 31, 0.8);
  const cams = [C0b, CW, CR, CE];

  candleStage(f, {
    key: ID,
    cams,
    candle: LEARNS_STAGE,
    candleX: CX,
    s: STAGE_S,
    flame: 1,
    pool: POOL_K,
    letters: 0.72,
    back: (c, env) => labDressing(f, c, env, cams),
    draw: (c, env, g) => {
      const P = env.mood;
      // the pool RADIATES from the candle's foot: a bright core at the base, rays of light along the boards
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.translate(g.candleX, g.floorY + 8);
      c.scale(1, 0.2);
      const core = c.createRadialGradient(0, 0, 10, 0, 0, g.poolRx * 0.9);
      core.addColorStop(0, withAlpha(mixLab(P.halo, P.core, 0.4), 0.5));
      core.addColorStop(0.4, withAlpha(P.halo, 0.18));
      core.addColorStop(1, withAlpha(P.halo, 0));
      c.fillStyle = core;
      c.fillRect(-g.poolRx, -g.poolRx, g.poolRx * 2, g.poolRx * 2);
      c.restore();
      // the candle's faint SPILL beyond the tight pool, toward the rim: enough for Minsky's long shadow to read
      c.save();
      c.translate(g.candleX, g.floorY + 30);
      c.scale(1, 0.16);
      const sp = c.createRadialGradient(0, 0, 200, 0, 0, 900);
      sp.addColorStop(0, withAlpha(P.halo, 0.16));
      sp.addColorStop(0.6, withAlpha(P.halo, 0.08));
      sp.addColorStop(1, withAlpha(P.halo, 0));
      c.fillStyle = sp;
      c.fillRect(-900, -900, 1800, 1800);
      c.restore();
      waxRim(c, env, g.candleX, FLAME_Y);
      // the pool is CUT at the rim: past Minsky's near shoulder the stage falls into shadow (his far side dark)
      {
        const x0 = MIN_X - 30, x1 = MIN_X + 260;
        const gr = c.createLinearGradient(x0, 0, x1, 0);
        gr.addColorStop(0, withAlpha(P.ink, 0));
        gr.addColorStop(0.4, withAlpha(P.ink, 0.38));
        gr.addColorStop(1, withAlpha(P.ink, 0.66));
        c.fillStyle = gr;
        c.fillRect(x0, -400, 1400, 1400);
      }
      // the believers, upstage in the light, facing the flame (a step lighter than the doubter: in the haze)
      const bInk = mixLab(PUPPET_NEAR_BLACK, P.set, 0.12);
      const B = BELIEVERS;
      const at = (feetY: number) => ({ ...g, floorY: feetY });
      const rep = (cc: C) => cast.reporter.draw(cc, { x: 0, y: 0, facing: 'right', pose: repP, scale: B.rep.s }, env);
      const off = (cc: C) => cast['navy-officer'].draw(cc, { x: 0, y: 0, facing: 'right', pose: offP, scale: B.off.s }, env);
      const ros = (cc: C) => cast.rosenblatt.draw(cc, { x: 0, y: 0, facing: rosTurn ? 'right' : 'left', pose: rosP, scale: B.ros.s }, env);
      const min = (cc: C) => MINSKY.draw(cc, { x: 0, y: 0, facing: 'right', pose: minP, scale: MIN_S }, env);
      floorShadow(c, at(B.off.y), B.off.x, off, env, 0.8);
      floorShadow(c, at(B.rep.y), B.rep.x, rep, env, 0.75);
      floorShadow(c, at(B.ros.y), B.ros.x, ros, env, 0.85);
      minskyShadow(c, MIN_FEET, min, env);
      const oOpts = { x: B.off.x, y: B.off.y, scale: B.off.s, facing: 'right' as const, pose: offP, cutLines: true, ink: bInk, light: { x: 1, y: -0.4, floor: 0 }, edgeRim: { x: 1, y: -0.4, px: 1.4 } };
      cast['navy-officer'].draw(c, oOpts, env);
      peakedCap(c, env, cast['navy-officer'].anchor(oOpts, 'head'), B.off.s, bInk);
      cast.reporter.draw(c, { x: B.rep.x, y: B.rep.y, scale: B.rep.s, facing: 'right', pose: repP, cutLines: true, ink: bInk, light: { x: 1, y: -0.4, floor: 0 }, edgeRim: { x: 1, y: -0.4, px: 1.4 } }, env);
      cast.rosenblatt.draw(c, { x: B.ros.x, y: B.ros.y, scale: B.ros.s, facing: rosTurn ? 'right' : 'left', pose: rosP, cutLines: true, ink: PUPPET_NEAR_BLACK, light: { x: -1, y: -0.4, floor: 0 }, edgeRim: { x: -1, y: -0.4, px: 1.5 } }, env);
      // the doubt's shape, in the gap at the edge of the light (behind Minsky's near hand)
      if (show > 0.01) twoPieces(c, env, SHAPE.x, SHAPE.y, show, split, tq - (b.two - 0.15));
      // Minsky: the darkest and nearest shape, a rim only on his candle side (the far side falls into the dark)
      MINSKY.draw(c, { x: MIN_X, y: MIN_FEET, facing: 'right', pose: minP, scale: MIN_S, cutLines: true, ink: PUPPET_NEAR_BLACK, light: { x: -1, y: -0.35, floor: 0 }, edgeRim: { x: -1, y: -0.3, px: 1.6, alpha: 0.75 } }, env);
      // SNARC in miniature at his feet: dim (hazed back) until his name, then its tubes glint for half a second
      c.save();
      c.globalAlpha *= 0.55 + 0.45 * flash;
      tubeRack(c, { x: SNARC.x, y: SNARC.y, s: SNARC_S, shelves: 4, perShelf: 6, glow: flash, seed: 51 }, env);
      c.restore();
      if (flash > 0.01) {
        c.save();
        c.globalAlpha *= flash;
        c.filter = 'brightness(5) saturate(0.5)';
        tubeRack(c, { x: SNARC.x - 2, y: SNARC.y - 2, s: SNARC_S, shelves: 4, perShelf: 6, glow: 0, seed: 51 }, env);
        c.restore();
      }
    },
  });
  if (flash > 0.02) {
    const top = tubeRack.anchors({ x: SNARC.x, y: SNARC.y, s: SNARC_S, shelves: 4, perShelf: 6 }).glow;
    f.practical({ x: top.x, y: top.y + 6, kind: 'tube', seed: 1951, intensity: 1.3 * flash, radius: 26 + 30 * flash });
  }
  // the flame's own practical, larger: the stage's one light
  // (round 1: the stage's flame is candleStage's own practical, exactly as in ch03-s06: a flame with a warm halo,
  // no second, larger glow that turned it into a lamp globe)
  // the stage lip (L5): only once the camera is well back from the flame
  const lipA = clamp01((420 - cam.z) / 160);
  if (lipA > 0.01) {
    f.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, cams, 60);
      c.save();
      c.globalAlpha *= lipA;
      f.cached(`${ID}/lip2/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), 200, (cc) => {
        cc.translate(-r.x, -LIP_Y);
        cc.fillStyle = env.fill('fg');
        cc.fillRect(r.x, LIP_Y, r.w, 200);
        cc.fillStyle = withAlpha(env.mood.rim, 0.35);
        cc.fillRect(r.x, LIP_Y, r.w, 2);
        // footlight hoods along the lip, each spilling a little light up onto the apron edge
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
  return toScreen(LAYERS.L4, cam, GEO.flame.x, GEO.flame.y);
}

/** the doubt as a picture: a paper-cut disc lifts WHOLE, then on 'two' it is cut by one clean, gently curved line
 *  and the two pieces slide apart fast (a gap of ~50 stage px), and a large cut-out question mark rises over it */
function twoPieces(c: C, env: PaintEnv, x: number, y: number, show: number, split: number, dtq: number) {
  const P = env.mood;
  // lamp-lit card stock: lighter than the set, clearly paper (not a light)
  const paper = mixLab(mixLab(P.set, P.halo, 0.62), P.rim, 0.28);
  const edge = withAlpha(P.ink, 0.7);
  const lift = (1 - show) * 46;
  // on twos: the pieces move in 12 Hz steps
  const sq = Math.floor(split * 4 + 1e-6) / 4;
  const gap = 28 * sm(sq); // each piece travels 28: a ~56 px gap
  // one clean cut: a gentle curve top to bottom
  const cut = (side: -1 | 1) => {
    const p = new Path2D();
    p.moveTo(side * 100, -100);
    p.lineTo(5, -100);
    p.quadraticCurveTo(-8, 0, 5, 100);
    p.lineTo(side * 100, 100);
    p.closePath();
    return p;
  };
  const cutLine = () => {
    c.beginPath();
    c.moveTo(5, -45);
    c.quadraticCurveTo(-8, 0, 5, 45);
  };
  c.save();
  c.globalAlpha *= show;
  c.translate(x, y + lift);
  // a soft cast shadow on the backdrop behind the paper (a cut-out in front of the haze)
  c.save();
  c.globalAlpha *= 0.4;
  c.fillStyle = P.ink;
  c.filter = `blur(${(4 * env.pxScale).toFixed(1)}px)`;
  c.beginPath();
  c.arc(8, 10, 46, 0, Math.PI * 2);
  c.fill();
  c.restore();
  const piece = (side: -1 | 1) => {
    c.save();
    c.translate(side * gap, -sm(sq) * 3);
    c.rotate(side * sm(sq) * 0.07);
    c.save();
    c.clip(cut(side));
    c.fillStyle = paper;
    blob(c);
    c.fill();
    c.strokeStyle = edge;
    c.lineWidth = 2;
    c.stroke();
    cutLine();
    c.stroke();
    c.restore();
    c.restore();
  };
  if (sq <= 0) {
    c.fillStyle = paper;
    blob(c);
    c.fill();
    c.strokeStyle = edge;
    c.lineWidth = 2;
    c.stroke();
  } else {
    piece(-1);
    piece(1);
  }
  // the question mark: cut from the same stock, 1.5x the first cut, rising over the pieces on 'two'
  const q = sm((dtq + 0.05) / 0.35);
  if (q > 0.01) {
    c.save();
    c.globalAlpha *= q;
    c.font = `700 ${138}px ${FONT.display}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const qy = -128 + (1 - q) * 24;
    c.fillStyle = withAlpha(P.ink, 0.45);
    c.fillText('?', 6, qy + 6);
    c.fillStyle = paper;
    c.strokeStyle = edge;
    c.lineWidth = 2.5;
    c.fillText('?', 0, qy);
    c.strokeText('?', 0, qy);
    c.restore();
  }
  c.restore();
}
function blob(c: C) {
  // a plain paper disc: crisp, so that cut in two it is unmistakably two pieces
  c.beginPath();
  c.arc(0, 0, 46, 0, Math.PI * 2);
  c.closePath();
}

/** Minsky's long shadow: thrown from the candle THROUGH his feet and on toward the frame's lower-right corner
 *  (toward the lens), the figure laid flat along that line */
function minskyShadow(c: C, floorY: number, draw: (c: C) => void, env: PaintEnv) {
  void env;
  const dx = MIN_X - CX, dy = MIN_FEET - STAGE.floorY + 120;
  const L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L;
  const len = 420 / (298 * MIN_S);
  c.save();
  c.globalAlpha *= 0.5;
  c.translate(MIN_X, floorY + 2);
  c.transform(-uy * 0.75, ux * 0.75, -ux * len, -uy * len, 0, 0);
  draw(c);
  c.restore();
}

/** wax on the shared candle's top ring: a melt cup glowing under the flame and one drip down the rim (cut paper),
 *  so the huge belief candle reads as a candle, not a lit post (same drawing and proportions as ch03-s06) */
function waxRim(c: C, env: PaintEnv, x: number, flameY: number) {
  const P = env.mood;
  const w = 30 * STAGE_S;
  const top = flameY + 2 * STAGE_S + 2;
  const wax = mixLab(mixLab(P.set, P.halo, 0.6), P.core, 0.22);
  c.save();
  // the melt cup: a lit ellipse just under the flame
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, top + 6, 2, x, top + 6, w * 0.9);
  g.addColorStop(0, withAlpha(mixLab(P.halo, P.core, 0.5), 0.55));
  g.addColorStop(1, withAlpha(P.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - w, top - w * 0.4, w * 2, w * 1.4);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = wax;
  c.beginPath();
  c.ellipse(x, top, w / 2 + 3, 4.5, 0, 0, Math.PI * 2);
  c.fill();
  // one drip on the lit side, one short one on the far side
  for (const [fx, len, r] of [[-0.36, 46, 5.5], [0.3, 18, 4]] as [number, number, number][]) {
    const dx = x + fx * w;
    c.beginPath();
    c.moveTo(dx - r, top);
    c.lineTo(dx - r * 0.75, top + len);
    c.arc(dx, top + len, r * 0.8, Math.PI, 0, true);
    c.lineTo(dx + r, top);
    c.closePath();
    c.fill();
  }
  c.restore();
}

/** this shot's naming card, screen-locked beside the flame: the belief (a paraphrase, no quotation marks) in the
 *  era's typewriter face at ~26 px cap height (1080p), and ONLY the year it is lit */
function namingCard(f: F, flame: { x: number; y: number }, k: number, onShelf = true) {
  const c = f.c;
  const P = f.mood;
  const lines = ['A MACHINE THAT LEARNS', 'WILL SOON SEE, TALK', 'AND THINK'];
  c.save();
  // screen-locked in stage px whatever transform the layers left on the main canvas; sized by the kit's own
  // legibility measure (the same one the audit uses) at or over the 22 px floor
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  const size = Math.max(31, legibleSize(c, `400 31px ${FONT.typewriter}`, 31));
  const dSize = Math.max(22, legibleSize(c, `italic 400 22px ${FONT.text}`, 22));
  void capPx1080;
  c.font = `400 ${size}px ${FONT.typewriter}`;
  const tw = Math.max(...lines.map((l) => c.measureText(l).width));
  const pad = 16;
  const lh = size * 1.22;
  const w = tw + pad * 2;
  const h = lines.length * lh + dSize * 1.5 + pad * 1.6;
  // round 1: RIGHT of the candle and BELOW the flame, clear of both (the candle's half-width on screen plus air)
  const left = flame.x > 1280 * 0.62;
  let x0 = left ? flame.x - 84 - w : flame.x + (onShelf ? 196 : 84);
  x0 = Math.max(40, Math.min(1240 - w, x0));
  const y0 = Math.max(36, Math.min(720 * 0.86 - h, flame.y + 46));
  const grow = 0.94 + 0.06 * k;
  c.globalAlpha = Math.min(1, k * 1.15);
  c.translate(x0 + w / 2, y0 + h / 2);
  c.scale(grow, grow);
  c.translate(-w / 2, -h / 2);
  // a fine leader to the flame
  c.strokeStyle = withAlpha(P.rim, 0.75);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(left ? w : 0, 14);
  c.lineTo(flame.x - x0 + (left ? 30 : -30), flame.y - y0 + 26);
  c.stroke();
  c.shadowColor = withAlpha('#000000', 0.45);
  c.shadowBlur = 10;
  c.shadowOffsetY = 4;
  c.fillStyle = mixLab(P.halo, '#efe4cc', 0.6);
  c.fillRect(0, 0, w, h);
  c.shadowColor = 'rgba(0,0,0,0)';
  c.fillStyle = withAlpha('#1f1810', 0.92);
  c.textBaseline = 'alphabetic';
  c.font = `400 ${size}px ${FONT.typewriter}`;
  lines.forEach((l, i) => c.fillText(l, pad, pad * 0.8 + size + i * lh));
  c.font = `italic 400 ${dSize}px ${FONT.text}`;
  c.fillStyle = withAlpha('#3a2c1e', 0.85);
  c.fillText('lit 1958', pad, pad * 0.8 + size + (lines.length - 1) * lh + dSize * 1.5);
  c.restore();
}

/** the 1950s lab dressing, drawn on L3 behind fog B: clerestory windows (lit holes in a flat) and two cabinet runs */
function labDressing(f: F, c: C, env: PaintEnv, cams: Camera3[]) {
  const r = overscan(LAYERS.L3, cams, 60);
  f.cached(`${ID}/lab2/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    const wall = mixLab(env.fill('set'), env.mood.fg, 0.35);
    const pane = mixLab(mixLab(env.mood.setHaze, env.mood.halo, 0.35), env.mood.sky[2], 0.3);
    // the flat hung from the flies: a band from the top down to the sill, window holes lit from behind
    const sill = LAB.winY + LAB.winH + 26;
    const bays: number[] = [];
    for (let x = LAB.x0; x < r.x + r.w; x += LAB.pitch) if (x + LAB.winW < LAB.skip[0] || x > LAB.skip[1]) bays.push(x);
    for (const x of bays) {
      cc.fillStyle = pane;
      cc.fillRect(x, LAB.winY, LAB.winW, LAB.winH);
    }
    cc.fillStyle = wall;
    cc.beginPath();
    cc.rect(r.x, r.y, r.w, sill - r.y);
    for (const x of bays) cc.rect(x, LAB.winY, LAB.winW, LAB.winH);
    cc.fill('evenodd');
    // steel-sash glazing bars and an opened hopper pane
    for (const x of bays) {
      for (let k = 1; k < 4; k++) cc.fillRect(x + (LAB.winW * k) / 4 - 2, LAB.winY, 4, LAB.winH);
      for (let k = 1; k < 3; k++) cc.fillRect(x, LAB.winY + (LAB.winH * k) / 3 - 2, LAB.winW, 4);
      cc.fillRect(x + LAB.winW / 4, LAB.winY + LAB.winH / 3 - 2, LAB.winW / 4, 9);
    }
    // the flat's bottom edge: a cut paper scallop (a theatre border), catching a little light
    cc.fillStyle = wall;
    for (let x = r.x; x < r.x + r.w; x += 60) {
      cc.beginPath();
      cc.arc(x + 30, sill, 30, 0, Math.PI);
      cc.fill();
    }
    cc.strokeStyle = withAlpha(env.mood.rim, 0.14);
    cc.lineWidth = 1.2;
    cc.beginPath();
    cc.moveTo(r.x, LAB.winY + LAB.winH + 12);
    cc.lineTo(r.x + r.w, LAB.winY + LAB.winH + 12);
    cc.stroke();
  })(c, r.x, r.y);
  // two runs of cabinets, clear of the candle's glow and of the doubter's ground
  ibm704(c, { x: -60, y: LAB.floor3, s: 0.72, units: ['tape', 'frame', 'tape', 'frame'], spin: 0.25, activity: 0.3, seed: 41 }, env);
  ibm704(c, { x: 1470, y: LAB.floor3, s: 0.72, units: ['console', 'tape', 'tape', 'frame'], spin: 0.25, activity: 0.35, seed: 42 }, env);
}

