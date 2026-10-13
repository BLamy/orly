/**
 * ch03-s06 — "At the moment, none whatever": the most likeable man in the chapter, then the chess slip.
 *
 * Cut back from the case board to the 1958 candle's pool (labGreen); under the cut the tint crossfades
 * candleAmber → labGreen (0.7 s, no dip). THE STAGE: the learning-machine candle (two rings burned) at left,
 * Rosenblatt alone in its pool, in profile, facing the flame.
 *   "magazine…was"   he listens, head inclined (the question comes from off-stage)
 *   "none"           the open hand rises, palm up, presenting nothing at all: a cheerful shrug
 *   "cheerfully"     silent: both arms thrown up, held on the twos; three sparks lift from his hands one at a
 *                    time and set as words on a small card beside him: “Love,” he said. “Hope. Despair.”
 *                    with the attribution line beneath (the question he was answering), held to read
 *   +7.8 s           only once the card has been read: a pan right off the stage; the stage's dark velvet leg
 *                    crosses the lens and the frame lands, still trucking, on the Wall of Forecasts beside the
 *                    case board, where the light crossfades labGreen → candleAmber (1.2 s, STUDY LOCK)
 *   slip             the hands pin the chess slip in W2, just right of Turing's W1; a small due-date tag (1968)
 *                    hangs from its pin; W6's corner half-lit in shadow further along; held to read to the end.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose, ShotScene } from '../../../film';
import { FONT, LAYERS, PUPPET_NEAR_BLACK, chair, legibleSize, makeCanvas, overscan, toLayer, PoseTrack, addPose, defineShot, hash1, markIPerceptron, mixLab, pose, softPlate, toScreen, withAlpha, withLife } from '../../../film';
import { hands } from '../cast';
import { paperTone } from '../sets/caseBoard';
import { candleStage, floorShadow } from '../sets/candleStage';
import { STUDY, studyCase, studyRoom } from '../sets/study';
import { shelfStateAt } from '../sets/studyState';
import { slotLight, wallSlotAt, WALL_SLOTS } from '../sets/wallOfForecasts';
import { handsEntry } from '../sets/narratorHands';
import { ROSE_STAGE, camKeys, clamp01, drawChessSlip, lampSpill, lerp, pinSway, sm, smearX, stageLip, tq12, win } from '../sets/ch03-s06-kit';

const ID = 'ch03-s06';

const CANDLE_X = 470;
/** a little shorter than the shared 2.1 so the push can hold Rosenblatt at ≈50% of frame with the flame's cap in headroom */
const STAGE_S = 1.8;
const ROSE_X = 690;
/** the learning-machine candle as it stands here (lit 1958, two rings burned by the clock) */
const LEARNS = shelfStateAt(ID, 'start').find((v) => v.id === 'learns')!;
const LIGHT_DIR = { x: -0.92, y: -0.4 };

// ------------------------------------------------------------------ Rosenblatt's performance (on twos)
const LISTEN: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: 0, neck: 12, head: 2, shoulderF: 2, elbowF: 18, wristF: 6, shoulderB: -6, elbowB: 14 });
/** the cheerful shrug: shoulders tipped back, elbows in, both forearms lifted, palms up and out (offering nothing) */
const SHRUG: Pose = pose({ hipF: 5, kneeF: -4, hipB: -4, kneeB: -1, torso: -8, neck: 2, head: -12, shoulderF: 16, elbowF: 104, wristF: -40, shoulderB: -16, elbowB: 82, wristB: -36 }, { handF: 'open', handB: 'open' });
/** both hands thrown up, open */
const HANDS_UP: Pose = pose({ hipF: 6, kneeF: -3, hipB: -6, kneeB: -1, torso: -6, neck: -6, head: -12, shoulderF: 158, elbowF: 22, wristF: -10, shoulderB: 146, elbowB: 26, wristB: -8 }, { handF: 'open', handB: 'open' });
/** the way down from HANDS_UP: elbows fold and the hands drop past the shoulders (never a straight-arm reach) */
const LOWER: Pose = pose({ hipF: 6, kneeF: -4, hipB: -5, kneeB: -1, torso: -4, neck: 0, head: -8, shoulderF: 52, elbowF: 118, wristF: -24, shoulderB: 40, elbowB: 104, wristB: -20 }, { handF: 'open', handB: 'open' });
/** after: arms down, a small satisfied stillness facing the flame */
const AFTER: Pose = pose({ hipF: 6, kneeF: -5, hipB: -4, kneeB: -1, torso: -2, neck: 8, head: -4, shoulderF: -10, elbowF: 30, wristF: 6, shoulderB: -14, elbowB: 26 }, { handF: 'relaxed', handB: 'relaxed' });
/** after, glancing up and back toward the card he has just made (head turned up, chest open) */
const AFTER_UP: Pose = pose({ hipF: 6, kneeF: -5, hipB: -4, kneeB: -1, torso: -4, neck: -10, head: -10, shoulderF: -10, elbowF: 30, wristF: 6, shoulderB: -14, elbowB: 26 }, { handF: 'relaxed', handB: 'relaxed' });

/** the held shrug's life: a small head tilt and palm bob on the twos (±3–4°), swelling toward 'cheerfully' */
function shrugBob(tq: number, b: Beats): Partial<Record<'head' | 'neck' | 'wristF' | 'elbowF' | 'wristB', number>> {
  const t0 = b.none + 0.35, t1 = b.love - 0.2;
  if (tq <= t0 || tq >= t1) return {};
  const env = Math.min(1, (tq - t0) / 0.4) * Math.min(1, (t1 - tq) / 0.25);
  // two bobs: one on 'whatever', a bigger one leading into 'cheerfully'
  const ph = (tq - t0) / (t1 - t0);
  const w = Math.sin(ph * Math.PI * 3) * env;
  return { head: 3.5 * w, neck: 1.5 * w, wristF: -4 * w, elbowF: 3 * w, wristB: -3 * w };
}

interface Beats {
  none: number;
  love: number;
  despair: number;
  slip: number;
  /** spark emission times for the three words */
  sparks: [number, number, number];
  attrib: number;
  cardOut: number;
  panStart: number;
  cut: number;
  pin0: number;
  pinDur: number;
}

interface Scene extends ShotScene {
  b: Beats;
  D: number;
  rose: PoseTrack;
  stageCam: (t: number) => Camera3;
  studyCam: (t: number) => Camera3;
  STAGE_CAMS: Camera3[];
  STUDY_CAMS: Camera3[];
  legAt: (t: number) => { x: number; y: number };
}

export default defineShot<Scene>({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const love = T.beat('love');
    const despair = T.beat('despair');
    const slip = T.beat('slip');
    // each spark LANDS on the word it carries (Love · Hope · Despair, as spoken)
    const sparks: [number, number, number] = [
      T.word('L0312', 'Love') - FLY + 0.04,
      T.word('L0312', 'Hope') - FLY + 0.04,
      T.word('L0312', 'Despair') - FLY + 0.04,
    ];
    // the cut comes a breath before the 'slip' beat (a music-only silence), so the pinned slip holds ≥ 2.5 s
    const cut = slip - 0.2;
    const b: Beats = {
      none: T.beat('none'),
      love,
      despair,
      slip,
      sparks,
      attrib: T.wordEnd('L0312', 'Despair') + 0.15,
      // the card holds ≈4 s after 'Despair' and leaves WITH the stage as the pan begins
      cardOut: cut - 1.15,
      // the pan: a soft ease-in (the stage visibly slides for ≈0.5 s) before the whip and the velvet leg
      panStart: cut - 1.1,
      cut,
      // a brisk pin (the hand is gone by cut + 1.15) so the slip reads clean for > 3 s
      pin0: cut + 0.25,
      pinDur: 0.85,
    };
    // Rosenblatt
    const rose = new PoseTrack(tl, 'rosenblatt.pose', LISTEN, 'left', 0.4);
    rose.to(SHRUG, { at: b.none - 0.42, dur: 0.5 });
    rose.to(HANDS_UP, { at: love - 0.2, dur: 0.34, force: true });
    // down from the raised hands through folded elbows (hands drop past the shoulders), then settle
    rose.to(LOWER, { at: sparks[2] + 1.9, dur: 0.3 });
    rose.to(AFTER, { at: sparks[2] + 2.2, dur: 0.4 });
    // the after-hold: he glances up toward the card (≈12.0 s) and settles back to the flame (≈13.5 s)
    rose.to(AFTER_UP, { at: Math.max(12.0, sparks[2] + 3.5), dur: 0.6 });
    rose.to(AFTER, { at: Math.max(13.5, sparks[2] + 5.0), dur: 0.7 });
    // stage camera: a slow push toward him for the shrug, a little room on the right for the card, then hold
    // (framed so he stands ≈50% of frame height, the candle's cap ≈80 px under the top edge)
    const stageCam0 = camKeys([
      [0, 736, 375, 176],
      [b.none - 0.2, 740, 376, 198],
      [love + 0.9, 747, 378, 208],
      [b.panStart, 752, 380, 222],
    ]);
    // the pan right: an ease-in whip off the stage (the velvet leg carries the cut)
    const stageCam = (t: number): Camera3 => {
      if (t <= b.panStart) return stageCam0(t);
      const u = clamp01((t - b.panStart) / (cut - b.panStart));
      const c0 = stageCam0(b.panStart);
      return { ...c0, x: c0.x + 760 * u * u * (0.5 + 0.5 * u) };
    };
    // study camera: lands mid-truck along the Wall from W1 (lamp side) toward W2, then pushes in until the
    // slip is the subject (its typing ≥ 22 px cap height at 1080p by the time it has been pinned)
    const W2 = { x: STUDY.wall.x + WALL_SLOTS.W2.x * STUDY.wall.k, y: STUDY.wall.y + WALL_SLOTS.W2.y * STUDY.wall.k };
    // framed so W2 sits right of centre and low, Turing's W1 whole at the upper left (a dim neighbour)
    // it lands on W1 + W2 (the slip goes in just right of Turing's: context; the frame's left edge holds between
    // the X-ray box and W1, so no clipped cyan box), then, once the hand is gone, pushes in on the slip until its
    // typing reads (≥ 22 px cap at 1080p): W1 leaves cleanly over the top, the box stays out at the left
    const studyKeys = camKeys([
      // the slip whole and clear of the bottom safe area while it is pinned (the hand and its pinching fingers
      // in frame on the pin)
      [cut + 0.75, W2.x + 226, W2.y - 30, 496],
      [cut + 1.25, W2.x + 212, W2.y - 26, 512],
      [cut + 2.5, W2.x + 80, W2.y - 8, 664],
      [D, W2.x + 76, W2.y - 2, 678],
    ]);
    const studyCam = (t: number): Camera3 => {
      const k0 = studyKeys(cut + 0.75);
      if (t >= cut + 0.75) return studyKeys(t);
      // the arriving whip: decelerating from the left (cubic ease-out)
      const u = clamp01((t - cut) / 0.75);
      const e = 1 - (1 - u) ** 3;
      return { ...k0, x: lerp(k0.x - 190, k0.x, e) };
    };
    tl.hold(0, D);
    const STAGE_CAMS = [stageCam(0), stageCam(b.none), stageCam(love + 1), stageCam(b.panStart), { ...stageCam(b.panStart), x: stageCam(b.panStart).x + 420 }];
    const STUDY_CAMS = [studyCam(cut), studyCam(cut + 0.75), studyCam(D)];
    // the stage's near velvet leg (L6) at the left frame edge: its inner edge drifts out (140 → 56 px on screen)
    // as the camera pushes in, the way a near leg slides past the lens (the whip pan then carries it off)
    const legAt = (t: number) => {
      const u = clamp01(t / b.panStart);
      return toLayer(LAYERS.L6, stageCam(t), lerp(140, 56, u * (2 - u)), 0);
    };
    return { tl, b, D, rose, stageCam, studyCam, STAGE_CAMS, STUDY_CAMS, legAt };
  },
  paint(f, _s, sc) {
    const t = f.t;
    if (t < sc.b.cut) paintStage(f, sc, t);
    else paintStudy(f, sc, t);
    // the whip's motion smear, peaking on the cut
    smearX(f, 28 * Math.exp(-(((t - sc.b.cut) / 0.26) ** 2)));
    velvetLeg(f, sc.b, t);
  },
});

// ------------------------------------------------------------------ the stage
function paintStage(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = sc.stageCam(t);
  f.camera(cam);
  f.setMood('labGreen', { from: 'candleAmber', u: sm(t / 0.7) });
  let hand = { x: ROSE_X, y: 300 };
  candleStage(f, {
    key: ID,
    cams: sc.STAGE_CAMS,
    candle: LEARNS,
    candleX: CANDLE_X,
    s: STAGE_S,
    // the vertical lettering is texture here: it steps back while the quote card is up
    letters: 0.72 - 0.24 * win(t, b.sparks[0] - 0.2, b.sparks[0] + 0.5),
    rimDir: LIGHT_DIR,
    back: (c, env) => stageBack(f, c, env),
    draw: (c, env, g) => {
      const smp = sc.rose.sample(t);
      const p = withLife(addPose(smp.pose, shrugBob(tq, b)), tq, 1958, 0.8);
      // the floor: a perspective tile pattern, lit only in the pool
      stageFloor(f, c, env, g.floorY, sc.STAGE_CAMS);
      // the darkest shape in frame: near-black, his cut-lines and a 1.5 px rim only on the window (flame) side
      const o = { x: ROSE_X, y: g.floorY, facing: 'left' as const, pose: p, cutLines: true, ink: PUPPET_NEAR_BLACK, light: { x: -1, y: -0.35, floor: 0 }, edgeRim: { x: -1, y: -0.45, px: 1.5, alpha: 0.75 } };
      floorShadow(c, g, ROSE_X, (cc) => ROSE_STAGE.draw(cc, { ...o, x: 0, y: 0, edgeRim: undefined, cutLines: false }, env), env);
      ROSE_STAGE.draw(c, o, env);
      // the raised hands (between both hands once they are up): where the sparks lift from
      const hf = ROSE_STAGE.anchor(o, 'handF');
      const hb = ROSE_STAGE.anchor(o, 'handB');
      const up = smp.pose.angles.shoulderB !== undefined && (smp.pose.angles.shoulderB ?? 0) > 90;
      hand = up ? { x: (hf.x + hb.x) / 2, y: Math.min(hf.y, hb.y) - 6 } : hf;
    },
  });
  stageLip(f, sc.STAGE_CAMS, ID, 636);
  nearChair(f, sc);
  sideLeg(f, sc, t);
  // the pool falls off hard: the right third of the stage sinks into shadow
  stageFalloff(f);
  // the sparks and the card (screen-locked, after the layers)
  const hs = toScreen(LAYERS.L4, cam, hand.x, hand.y);
  // once the pan begins the card leaves with the stage (it is pinned to the stage's air, not to the lens)
  const slide = t > b.panStart ? toScreen(LAYERS.L4, cam, 900, 300).x - toScreen(LAYERS.L4, sc.stageCam(b.panStart), 900, 300).x : 0;
  sparkCard(f, b, t, hs, slide);
}

/** L3: the Mark I installation standing in the haze behind him (≈35% haze), nearer than the back wall so the push
 *  has parallax; its cabinet tops catch the flame in a 1 px rim (tops only), so it reads as the machine */
const MARK_AT = { x: 940, y: 612, s: 0.58, retina: false, seed: 5 };
function stageBack(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv) {
  stageWindow(f, c, env);
  const r0 = markIPerceptron.bounds(MARK_AT);
  const r = { x: r0.x - 30, y: r0.y - 40, w: r0.w + 60, h: r0.h + 50 };
  const flat = (cc: CanvasRenderingContext2D) => {
    cc.save();
    cc.translate(-r.x, -r.y);
    markIPerceptron(cc, MARK_AT, env);
    // flattened to one cut-out silhouette, ≈35% into the haze: it stands back in the dark, a step lighter than him
    cc.globalCompositeOperation = 'source-atop';
    cc.fillStyle = mixLab(env.mood.fg, env.mood.haze, 0.16);
    cc.fillRect(r.x, r.y, r.w, r.h);
    cc.restore();
  };
  f.cached(`${ID}/stage/L3/markI2/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    flat(cc);
    // a few of its console lamps survive as dim pinpricks
    cc.save();
    cc.translate(-r.x, -r.y);
    const lp = markIPerceptron.anchors(MARK_AT).lamps;
    for (let i = 0; i < 4; i++) {
      cc.fillStyle = withAlpha(env.mood.halo, 0.25 + 0.1 * (i % 2));
      cc.fillRect(lp.x - 14 + i * 9, lp.y, 3, 3);
    }
    cc.restore();
  })(c, r.x, r.y);
  // the tops rim, baked SHARP (the layer's depth blur would erase a 1 px line): the solid silhouette (smeared
  // down 60 px so the patch-panel holes fill) minus itself shifted down ≈1 px, kept only on the cut-out
  f.cached(`${ID}/stage/L3/markIrim/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    const W = cc.canvas.width, H = cc.canvas.height;
    const dev = cc.getTransform().a;
    const cut = makeCanvas(W, H);
    const k0 = cut.getContext('2d')!;
    k0.setTransform(cc.getTransform());
    flat(k0);
    const solid = makeCanvas(W, H);
    const sc2 = solid.getContext('2d')!;
    for (let dy = 0; dy <= 60 * dev; dy += 1.5 * dev) sc2.drawImage(cut, 0, dy);
    const tmp = makeCanvas(W, H);
    const tc = tmp.getContext('2d')!;
    tc.drawImage(solid, 0, 0);
    tc.globalCompositeOperation = 'source-in';
    tc.fillStyle = mixLab(env.mood.rim, env.mood.halo, 0.3);
    tc.fillRect(0, 0, W, H);
    tc.globalCompositeOperation = 'destination-out';
    tc.drawImage(solid, 0, Math.max(1.2, dev * 1.1));
    tc.globalCompositeOperation = 'destination-in';
    tc.drawImage(cut, 0, 0);
    cc.save();
    cc.setTransform(1, 0, 0, 1, 0, 0);
    cc.globalAlpha = 0.7;
    cc.drawImage(tmp, 0, 0);
    cc.restore();
  }, { blur: 0 })(c, r.x, r.y);
}

/** L4 floor: square tiles in perspective (the reference's chequer, quieter), each dark tile one step down, the
 *  light ones warmed by the pool; baked once per mood */
function stageFloor(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, fy: number, cams: Camera3[]) {
  const r = overscan(LAYERS.L4, cams, 40);
  const top = fy + 1, bot = r.y + r.h;
  if (bot <= top) return;
  const VP = { x: CANDLE_X + 120, y: fy - 520 };
  f.cached(`${ID}/stage/L4/floor/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)},${Math.round(bot)}`, Math.ceil(r.w), Math.ceil(bot - top), (cc) => {
    cc.translate(-r.x, -top);
    const xAt = (x0: number, y: number) => VP.x + ((x0 - VP.x) * (y - VP.y)) / (fy - VP.y);
    // row edges: tiles foreshorten toward the back (geometric)
    const rows: number[] = [fy];
    let h = 7;
    while (rows[rows.length - 1] < bot) {
      rows.push(rows[rows.length - 1] + h);
      h *= 1.42;
    }
    const TW = 46;
    const i0 = Math.floor((r.x - 2000 - VP.x) / TW), i1 = Math.ceil((r.x + r.w + 2000 - VP.x) / TW);
    for (let j = 0; j < rows.length - 1; j++) {
      const ya = rows[j], yb = rows[j + 1];
      for (let i = i0; i < i1; i++) {
        if ((i + j) % 2 === 0) continue;
        const xa0 = xAt(VP.x + i * TW, ya), xa1 = xAt(VP.x + (i + 1) * TW, ya);
        const xb0 = xAt(VP.x + i * TW, yb), xb1 = xAt(VP.x + (i + 1) * TW, yb);
        if (Math.max(xa1, xb1) < r.x || Math.min(xa0, xb0) > r.x + r.w) continue;
        cc.fillStyle = withAlpha(env.mood.fg, 0.34);
        cc.beginPath();
        cc.moveTo(xa0, ya);
        cc.lineTo(xa1, ya);
        cc.lineTo(xb1, yb);
        cc.lineTo(xb0, yb);
        cc.closePath();
        cc.fill();
      }
      // a hairline seam where each row meets the next catches the flame faintly
      cc.fillStyle = withAlpha(env.mood.rim, 0.05);
      cc.fillRect(r.x, yb - 0.5, r.w, 0.8);
    }
  })(c, r.x, top);
}

/** L5: a carved period chair at the right third, out of focus, framing the card from below */
function nearChair(f: Frame, sc: Scene) {
  f.layer('L5', (c, env) => {
    const ref = sc.stageCam(sc.b.love + 1);
    // its crest rail ≈20% of the frame up from the bottom edge, at the right third, under the card
    const base = toLayer(LAYERS.L5, ref, 1150, 1000);
    const o = { x: 0, y: 0, s: 1.6, style: 'carved' as const, view: 'front' as const };
    const b0 = chair.bounds(o);
    const r = { x: b0.x - 20, y: b0.y - 20, w: b0.w + 40, h: b0.h + 30 };
    f.cached(`${ID}/stage/L5/chair/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      chair(cc, o, env);
      // near-plane ink: the darkest set piece in frame (only he is darker, being sharp)
      cc.globalCompositeOperation = 'source-atop';
      cc.fillStyle = mixLab(env.mood.fg, '#000000', 0.25);
      cc.fillRect(b0.x - 5, b0.y - 5, b0.w + 10, b0.h + 10);
      // the crest rail catches the flame: a soft rim on the chair's top edge only
      cc.globalCompositeOperation = 'source-atop';
      const g = cc.createLinearGradient(0, b0.y, 0, b0.y + 14);
      g.addColorStop(0, withAlpha(env.mood.rim, 0.32));
      g.addColorStop(1, withAlpha(env.mood.rim, 0));
      cc.fillStyle = g;
      cc.fillRect(b0.x, b0.y, b0.w, 14);
    }, { blur: 4.5 })(c, base.x + r.x, base.y + r.y);
  });
}

/** L6: the proscenium's near velvet leg at the left frame edge (heavily blurred), sliding with the push */
function sideLeg(f: Frame, sc: Scene, t: number) {
  f.layer('L6', (c, env) => {
    const { x, y } = sc.legAt(Math.min(t, sc.b.panStart));
    const H = 1400;
    c.save();
    c.fillStyle = env.fill('fg');
    c.beginPath();
    c.moveTo(x - 700, y - 400);
    c.lineTo(x, y - 400);
    // the leg's lit inner edge hangs in shallow folds
    for (let i = 1; i <= 8; i++) c.quadraticCurveTo(x + 10 * Math.sin(i * 1.9), y - 400 + (i - 0.5) * (H / 8), x + 6 * Math.cos(i * 1.3), y - 400 + i * (H / 8));
    c.lineTo(x - 700, y - 400 + H);
    c.closePath();
    c.fill();
    // a thread of candle light along the fold nearest the flame
    c.strokeStyle = withAlpha(env.mood.rim, 0.14);
    c.lineWidth = 5;
    c.beginPath();
    c.moveTo(x - 4, y - 400);
    c.lineTo(x - 2, y - 400 + H);
    c.stroke();
    c.restore();
  });
}

/** L3: a tall arched opening in the stage's back wall behind the candle — the far dusk beyond it backlights the
 *  candle's shaft (a hole in the backdrop: sky, a far ridge, glazing bars in silhouette) */
/** the window sits LEFT of the candle's line: the flame stands against the right-hand pane, beside the mullion */
const WIN = { cx: 380, top: 150, bot: 520, w: 270 };
function stageWindow(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv) {
  const r = { x: WIN.cx - WIN.w / 2 - 40, y: WIN.top - 40, w: WIN.w + 80, h: WIN.bot - WIN.top + 80 };
  f.cached(`${ID}/stage/L3/window/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    const m = env.mood;
    const x0 = WIN.cx - WIN.w / 2, x1 = WIN.cx + WIN.w / 2, ar = WIN.w / 2;
    const path = (p: Path2D, inset: number) => {
      p.moveTo(x0 + inset, WIN.bot);
      p.lineTo(x0 + inset, WIN.top + ar);
      p.arc(WIN.cx, WIN.top + ar, ar - inset, Math.PI, 0);
      p.lineTo(x1 - inset, WIN.bot);
      p.closePath();
    };
    // the sky beyond: brightest low, at the horizon band
    const hole = new Path2D();
    path(hole, 0);
    cc.save();
    cc.clip(hole);
    const g = cc.createLinearGradient(0, WIN.top, 0, WIN.bot);
    g.addColorStop(0, mixLab(m.sky[1], m.set, 0.55));
    g.addColorStop(0.62, mixLab(m.sky[3], m.setHaze, 0.45));
    g.addColorStop(0.8, mixLab(m.sky[3], m.set, 0.5));
    g.addColorStop(1, mixLab(m.sky[2], m.set, 0.6));
    cc.fillStyle = g;
    cc.fillRect(x0, WIN.top, WIN.w, WIN.bot - WIN.top);
    // a far ridge, low (L1-like: hazed nearly into the sky)
    cc.fillStyle = mixLab(m.set, m.setHaze, 0.35);
    cc.beginPath();
    cc.moveTo(x0, WIN.bot - 92);
    cc.quadraticCurveTo(WIN.cx - 40, WIN.bot - 118, WIN.cx + 20, WIN.bot - 96);
    cc.quadraticCurveTo(x1 - 30, WIN.bot - 80, x1, WIN.bot - 100);
    cc.lineTo(x1, WIN.bot);
    cc.lineTo(x0, WIN.bot);
    cc.closePath();
    cc.fill();
    cc.restore();
    // the frame and glazing bars (paper-cut, a step lighter than the figure)
    const fr = mixLab(m.fg, m.set, 0.3);
    cc.strokeStyle = fr;
    cc.lineWidth = 14;
    cc.stroke(hole);
    cc.lineWidth = 4;
    cc.beginPath();
    cc.moveTo(WIN.cx, WIN.top);
    cc.lineTo(WIN.cx, WIN.bot);
    for (const yy of [WIN.top + ar, WIN.top + ar + 118]) {
      cc.moveTo(x0, yy);
      cc.lineTo(x1, yy);
    }
    cc.stroke();
    cc.fillStyle = fr;
    cc.fillRect(x0 - 22, WIN.bot - 4, WIN.w + 44, 12);
    // the sill's top edge catches the sky
    cc.fillStyle = withAlpha(m.rim, 0.2);
    cc.fillRect(x0 - 22, WIN.bot - 4, WIN.w + 44, 1.5);
  })(c, r.x, r.y);
  // the glow it throws onto the backdrop around it (soft, dynamic-free: part of the baked layer would clip)
  const m = env.mood;
  const gx = WIN.cx, gy = WIN.bot - 110;
  const R = 320;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const hg = c.createRadialGradient(gx, gy, 40, gx, gy, R);
  hg.addColorStop(0, withAlpha(m.sky[3], 0.1));
  hg.addColorStop(1, withAlpha(m.sky[3], 0));
  c.fillStyle = hg;
  c.fillRect(gx - R, gy - R, 2 * R, 2 * R);
  c.restore();
}

/** screen-space: the right third of the frame sinks ≈25% darker (the pool's hard falloff) */
function stageFalloff(f: Frame) {
  const c = f.c;
  c.save();
  const g = c.createLinearGradient(760, 0, 1280, 0);
  g.addColorStop(0, withAlpha(f.mood.fg, 0));
  g.addColorStop(0.55, withAlpha(f.mood.fg, 0.22));
  g.addColorStop(1, withAlpha(f.mood.fg, 0.32));
  c.fillStyle = g;
  c.fillRect(760, 0, 520, 720);
  c.restore();
}

/** three sparks lift from his hands and set as the words of the reported quote, on a small pinned parchment card
 *  (the film's reported-quote card: paper edge, deckle, pin, attribution beneath) */
const CARD = { cx: 934, y1: 206, y2: 254 };
const SEGS = [
  { text: '“Love,” he said.', spark: 0 },
  { text: '“Hope.', spark: 1 },
  { text: 'Despair.”', spark: 2 },
] as const;
const FLY = 0.55;
const ATTRIB = '— Rosenblatt, on its limits (New Yorker, 1958)';

/** the card's deckled outline (seeded, ≈2 px tooth), centred on (0, 0) */
function deckle(w: number, h: number): Path2D {
  const p = new Path2D();
  const step = 7;
  const j = (i: number, s: number) => hash1(i, s) * 1.1 + hash1(i * 3 + 1, s + 1) * 0.9;
  const nx = Math.ceil(w / step), ny = Math.ceil(h / step);
  p.moveTo(-w / 2, -h / 2);
  for (let i = 1; i <= nx; i++) p.lineTo(-w / 2 + (w * i) / nx, -h / 2 + j(i, 71));
  for (let i = 1; i <= ny; i++) p.lineTo(w / 2 + j(i, 73), -h / 2 + (h * i) / ny);
  for (let i = 1; i <= nx; i++) p.lineTo(w / 2 - (w * i) / nx, h / 2 + j(i, 75));
  for (let i = 1; i <= ny; i++) p.lineTo(-w / 2 + j(i, 77), h / 2 - (h * i) / ny);
  p.closePath();
  return p;
}
let DECKLE: { w: number; h: number; p: Path2D } | null = null;

function sparkCard(f: Frame, b: Beats, t: number, from: { x: number; y: number }, slide: number) {
  const c = f.c;
  const m = f.mood;
  const A = win(t, b.sparks[0] - 0.1, b.sparks[0] + 0.3) * (1 - win(t, b.cardOut, b.cardOut + 0.45));
  if (A <= 0) return;
  c.save();
  const size = legibleSize(c, `italic 400 34px ${FONT.text}`, 34);
  const font = `italic 400 ${size}px ${FONT.text}`;
  const as = legibleSize(c, `italic 400 24px ${FONT.text}`, 24, ATTRIB);
  const afont = `italic 400 ${as}px ${FONT.text}`;
  c.font = font;
  const gap = c.measureText('  ').width;
  const ws = SEGS.map((s) => c.measureText(s.text).width);
  const total = ws.reduce((a, w) => a + w, 0) + gap * (SEGS.length - 1);
  c.font = afont;
  const aw = c.measureText(ATTRIB).width;
  const cx = CARD.cx + slide;
  let x = cx - total / 2;
  const pos = SEGS.map((s, i) => {
    const p = { x, w: ws[i] };
    x += ws[i] + gap;
    return p;
  });
  // the card: parchment at ≈0.85 with a deckled edge, a contact shadow on the backdrop and a pin at its head
  const cw = Math.round(Math.max(total, aw) + 76), ch = Math.round(CARD.y2 - CARD.y1 + size + 62);
  const cy = (CARD.y1 - size + CARD.y2) / 2 + 4;
  if (!DECKLE || DECKLE.w !== cw || DECKLE.h !== ch) DECKLE = { w: cw, h: ch, p: deckle(cw, ch) };
  const paper = mixLab(paperTone({ mood: m } as PaintEnv, 0.85), m.rim, 0.12);
  const ink = mixLab(m.ink, paper, 0.08);
  c.globalAlpha = A;
  c.save();
  c.translate(cx, cy);
  c.rotate(-0.012);
  // a soft plate of shadow behind it (the card hangs a hand's width off the backdrop)
  softPlate(c, 6, 10, cw + 60, ch + 50, m.fg, 0.4);
  c.globalAlpha = A * 0.88;
  c.fillStyle = paper;
  c.fill(DECKLE.p);
  // the paper's edge: a darker deckle line and a warm lit top edge (the flame is up-left)
  c.globalAlpha = A;
  c.strokeStyle = withAlpha(mixLab(paper, m.fg, 0.45), 0.6);
  c.lineWidth = 1.2;
  c.stroke(DECKLE.p);
  const vg = c.createLinearGradient(-cw / 2, -ch / 2, cw / 2, ch / 2);
  vg.addColorStop(0, withAlpha(m.halo, 0.1));
  vg.addColorStop(1, withAlpha(m.fg, 0.14));
  c.fillStyle = vg;
  c.fill(DECKLE.p);
  // the pin
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.beginPath();
  c.ellipse(2, -ch / 2 + 15, 6, 4, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(m.halo, m.set, 0.4);
  c.beginPath();
  c.arc(0, -ch / 2 + 12, 5, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(m.core, 0.55);
  c.beginPath();
  c.arc(-1.4, -ch / 2 + 10.6, 1.8, 0, Math.PI * 2);
  c.fill();
  c.restore();
  SEGS.forEach((s, i) => {
    const te = b.sparks[s.spark];
    const arrive = te + FLY;
    const target = { x: pos[i].x + pos[i].w * 0.18, y: CARD.y1 - size * 0.32 };
    // the spark in flight: a hot point with a short trail of embers, on a rising arc (on the twos for the trail)
    if (t >= te && t < arrive + 0.15) {
      const tqq = tq12(t);
      for (let k = 6; k >= 0; k--) {
        const tt = tqq - k * 0.035;
        const u = clamp01((tt - te) / FLY);
        if (tt < te) continue;
        const e = 1 - (1 - u) * (1 - u);
        const px = lerp(from.x, target.x, e), py = lerp(from.y, target.y, e) - Math.sin(Math.PI * e) * 70;
        const head = k === 0;
        const r = head ? 9 : 5 - k * 0.5;
        const al = (head ? 0.95 : 0.5 - k * 0.06) * (1 - win(t, arrive, arrive + 0.15));
        const g = c.createRadialGradient(px, py, 0, px, py, r * 2.6);
        g.addColorStop(0, withAlpha(m.core, al));
        g.addColorStop(0.35, withAlpha(m.halo, al * 0.55));
        g.addColorStop(1, withAlpha(m.halo, 0));
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = A;
        c.fillStyle = g;
        c.fillRect(px - r * 2.6, py - r * 2.6, r * 5.2, r * 5.2);
        c.globalCompositeOperation = 'source-over';
      }
    }
    // the word sets: it lands hot (a warm scorch that cools into the card's ink)
    const k = win(t, arrive - 0.08, arrive + 0.32);
    if (k <= 0) return;
    const glow = Math.exp(-Math.max(0, t - arrive) * 2.4) * (t >= arrive - 0.08 ? 1 : 0);
    if (glow > 0.02) {
      const gx = pos[i].x + pos[i].w / 2, gy = CARD.y1 - size * 0.35;
      const hg = c.createRadialGradient(gx, gy, 0, gx, gy, pos[i].w * 0.75);
      hg.addColorStop(0, withAlpha(m.core, 0.35 * glow));
      hg.addColorStop(1, withAlpha(m.halo, 0));
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = A;
      c.fillStyle = hg;
      c.fillRect(gx - pos[i].w, gy - pos[i].w, pos[i].w * 2, pos[i].w * 2);
      c.globalCompositeOperation = 'source-over';
    }
    c.globalAlpha = A * k;
    c.font = font;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillStyle = mixLab(ink, mixLab(m.halo, '#8a3b12', 0.5), 0.7 * glow);
    c.fillText(s.text, pos[i].x, CARD.y1 + (1 - k) * 6);
  });
  // attribution: the question he was answering, the source on the card
  const ka = win(t, b.attrib, b.attrib + 0.6);
  if (ka > 0) {
    c.globalAlpha = A * ka;
    c.fillStyle = withAlpha(ink, 0.45);
    c.fillRect(cx - 90 * ka, CARD.y2 - 24, 180 * ka, 0.9);
    c.globalAlpha = A * ka * 0.92;
    c.font = afont;
    c.textAlign = 'center';
    c.fillStyle = mixLab(ink, paper, 0.12);
    c.fillText(ATTRIB, cx, CARD.y2 + (as - 20) * 0.6);
  }
  c.restore();
}

/** the stage's velvet leg (L6 occluder) crossing the lens during the pan: it covers the cut to the study */
function velvetLeg(f: Frame, b: Beats, t: number) {
  // a fast leg: it covers the whole frame for only ≈0.08 s (two frames) around the cut; the smear carries the rest
  const W = 1500, X0 = 1300, X1 = -W - 100;
  const uCut = (X0 + 110) / (X0 - X1);
  const span = 0.55;
  const c0 = b.cut - uCut * span, c1 = c0 + span;
  if (t < c0 || t > c1) return;
  const u = (t - c0) / span;
  const x = lerp(X0, X1, u);
  const c = f.c;
  const m = f.mood;
  c.save();
  // the drape: ink with vertical folds, a soft leading edge (8–12 px blur at L6), a rim on the folds
  const g = c.createLinearGradient(x, 0, x + W, 0);
  g.addColorStop(0, withAlpha(m.fg, 0));
  g.addColorStop(0.03, withAlpha(m.fg, 0.92));
  g.addColorStop(0.06, m.fg);
  g.addColorStop(0.94, m.fg);
  g.addColorStop(0.97, withAlpha(m.fg, 0.92));
  g.addColorStop(1, withAlpha(m.fg, 0));
  c.fillStyle = g;
  c.fillRect(x, -10, W, 740);
  for (let i = 0; i < 10; i++) {
    const fx = x + 70 + i * 170 + 30 * Math.sin(i * 1.7);
    const fg = c.createLinearGradient(fx - 40, 0, fx + 40, 0);
    fg.addColorStop(0, withAlpha(m.rim, 0));
    fg.addColorStop(0.5, withAlpha(m.rim, 0.07));
    fg.addColorStop(1, withAlpha(m.rim, 0));
    c.fillStyle = fg;
    c.fillRect(fx - 40, -10, 80, 740);
  }
  c.restore();
}

// ------------------------------------------------------------------ the study: the Wall of Forecasts
function paintStudy(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const cam = sc.studyCam(t);
  f.camera(cam);
  f.setMood('candleAmber', { from: 'labGreen', u: win(t, b.cut, b.cut + 1.2) });
  studyRoom(f, { key: ID, cams: sc.STUDY_CAMS, outside: { mood: 'labGreen', kind: 'night' } });
  const k = STUDY.wall.k;
  const sz = WALL_SLOTS.W2;
  const pinPt = wallSlotAt(STUDY.wall, 'W2');
  const ctr = { x: STUDY.wall.x + sz.x * k, y: STUDY.wall.y + sz.y * k };
  const u = (tq - b.pin0) / b.pinDur;
  const hp = u > 0 && u < 1 ? hands.act('pin', u, pinPt, { held: 'slip', scale: 0.62, entry: handsEntry(cam, 'L4') }) : null;
  const light = slotLight('W2');
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: false,
    // W6 is drawn here as only its lower corner (the rest lost in shadow)
    wall: { hide: ['W2', 'W6'] },
    // the X-ray box at the frame's left edge: its practical dimmed while the Wall holds the shot
    xray: { light: 0.15 },
    extra: (c, env) => {
      w6Corner(c, env, cam);
      if (u >= 0.45) {
        const dt = tq - (b.pin0 + 0.45 * b.pinDur);
        drawChessSlip(c, { x: ctr.x, y: ctr.y, k, light, rot: pinSway(dt), tagSway: 0.12 * Math.exp(-dt * 1.6) * Math.sin(dt * 6.5) + 0.02 * Math.sin(t * 1.3) }, env);
      }
      if (hp) {
        hands.draw(c, hp, env, {
          heldDraw: (cc, at, _h, e) => drawChessSlip(cc, { x: at.x, y: at.y + (sz.h / 2 - 6) * k, k, light: 0.85, pin: false, tagSway: 0.2 * Math.sin(t * 5) }, e),
        });
      }
    },
  });
  wallPool(f, cam, ctr, win(t, b.cut + 0.2, b.cut + 1.8));
  lampSpill(f, win(t, b.cut, b.cut + 0.6));
}

/** W6 by rule: deep shadow, and only its lower-left corner catches the lamp: a ≈40 × 30 px (screen) triangle of
 *  paper lit at ≈0.15 with its tip curling off the wall; the rest of the slip is lost in the dark */
function w6Corner(c: CanvasRenderingContext2D, env: PaintEnv, cam: Camera3) {
  const k = STUDY.wall.k;
  const sz = WALL_SLOTS.W6;
  const cx = STUDY.wall.x + sz.x * k, cy = STUDY.wall.y + sz.y * k;
  const x0 = cx - (sz.w / 2) * k, y1 = cy + (sz.h / 2) * k;
  const sk = toScreen(LAYERS.L4, cam, x0, y1).k || 1;
  const a = 42 / sk, h = 30 / sk, cu = 7 / sk;
  const paper = paperTone(env, 0.15);
  c.save();
  // the slip's left edge running up into the dark (barely there)
  const eg = c.createLinearGradient(0, y1, 0, y1 - h * 2.6);
  eg.addColorStop(0, withAlpha(paper, 0.35));
  eg.addColorStop(1, withAlpha(paper, 0));
  c.fillStyle = eg;
  c.fillRect(x0, y1 - h * 2.6, 1.2 / sk, h * 2.6);
  // the lit corner: a triangle fading along its hypotenuse into shadow, its tip curled
  const g = c.createLinearGradient(x0, y1, x0 + a * 0.55, y1 - h * 0.55);
  g.addColorStop(0, paper);
  g.addColorStop(0.7, withAlpha(paper, 0.55));
  g.addColorStop(1, withAlpha(paper, 0));
  c.fillStyle = withAlpha(env.mood.fg, 0.35);
  c.beginPath();
  c.moveTo(x0 + 2 / sk, y1 - h + 3 / sk);
  c.lineTo(x0 + 2 / sk, y1 + 3 / sk);
  c.lineTo(x0 + a + 2 / sk, y1 + 3 / sk);
  c.closePath();
  c.fill();
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x0, y1 - h);
  c.lineTo(x0, y1 - cu);
  c.lineTo(x0 + cu, y1);
  c.lineTo(x0 + a, y1);
  c.closePath();
  c.fill();
  // the curl: the corner lifts off the wall, showing its paler underside
  c.fillStyle = mixLab(paper, env.mood.rim, 0.3);
  c.beginPath();
  c.moveTo(x0, y1 - cu);
  c.quadraticCurveTo(x0 + cu * 0.9, y1 - cu * 0.9, x0 + cu, y1);
  c.quadraticCurveTo(x0 + cu * 0.25, y1 - cu * 0.2, x0, y1 - cu);
  c.fill();
  c.restore();
}

/** the lamp pools on the new slip; the rest of the Wall falls away into shadow */
function wallPool(f: Frame, cam: Camera3, ctr: { x: number; y: number }, k: number) {
  if (k <= 0) return;
  const c = f.c;
  const p = toScreen(LAYERS.L4, cam, ctr.x, ctr.y);
  c.save();
  const g = c.createRadialGradient(p.x, p.y, 110 * p.k, p.x, p.y, 820);
  g.addColorStop(0, withAlpha(f.mood.fg, 0));
  g.addColorStop(0.5, withAlpha(f.mood.fg, 0.22 * k));
  g.addColorStop(1, withAlpha(f.mood.fg, 0.45 * k));
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  // Turing's W1 stays a dim neighbour (texture, not the subject): a soft shade over it
  const kw = STUDY.wall.k;
  const p1 = toScreen(LAYERS.L4, cam, STUDY.wall.x + WALL_SLOTS.W1.x * kw, STUDY.wall.y + WALL_SLOTS.W1.y * kw);
  c.save();
  c.translate(p1.x, p1.y);
  c.scale(1.5, 1);
  const g1 = c.createRadialGradient(0, 0, 20, 0, 0, 110 * p1.k);
  g1.addColorStop(0, withAlpha(f.mood.fg, 0.3 * k));
  g1.addColorStop(1, withAlpha(f.mood.fg, 0));
  c.fillStyle = g1;
  c.fillRect(-110 * p1.k, -110 * p1.k, 220 * p1.k, 220 * p1.k);
  c.restore();
  c.globalCompositeOperation = 'lighter';
  const w = c.createRadialGradient(p.x, p.y, 10, p.x, p.y, 120 * p.k);
  w.addColorStop(0, withAlpha(f.mood.halo, 0.12 * k));
  w.addColorStop(1, withAlpha(f.mood.halo, 0));
  c.fillStyle = w;
  c.fillRect(p.x - 120 * p.k, p.y - 120 * p.k, 240 * p.k, 240 * p.k);
  c.restore();
}

