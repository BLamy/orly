/**
 * ch14-s02 — the fence and the two candles. A paper fence of rule pages rises across the strait (October 2022
 * export controls), Beijing's reply flies back over it, and in the window's reflection one match lights two
 * candles: COMPUTE IS THE CHOKEPOINT and CHINA IS A YEAR OR TWO BEHIND (dawnGold; 19.5 s; in: cut).
 *
 *   (open)   the wide through the study window: left quay, a delegate at a lectern lifts a page
 *   fence    'fenced'   tall parchment rule pages rise out of the water one after another, edge to edge, along the
 *                       strait's middle: a paper fence; Washington's stated reason rises over the left bank
 *   tools    'tools'    the chipmaking tool on the left bank catches a rim of light behind the standing fence; in the
 *                       same wide a hand from the LEFT shore sets one stone on the board (the answer to ch14-s01's)
 *   reply    'replied'  the mirrored delegate on the right bank answers; one reply page flies back over the fence and
 *                       settles on the left bank; Beijing's reply rises over the right bank (both cards stay up)
 *   candle   'candles'  the camera tilts from the water up to the study shelf's reflection in the glass: the hands
 *                       strike one match and light two new candles; their light falls on both banks at once
 *   behind   'behind'   the second candle's lettering catches the flame; hold on the two flames
 *   question 'question' the camera tilts back down from the reflection; on 'for the file' a new question card, CAN A
 *            → 'fence'  FENCE AROUND CHIPS HOLD?, comes in on its oxblood thread from the window's top rail (a short
 *                       drop, fading in with its typed question, the case's hand as WHO TAUGHT IT?) and lands on
 *                       'fence' as the camera settles on the paper fence (round 3: re-fit to the re-recorded L1405;
 *                       the card is paid off, stamped OPEN, in ch14-s07)
 *   (name)   'China'    the behind candle's naming card, CHINA IS A YEAR / OR TWO BEHIND, on 'China is a year or two
 *                       behind' (round 3)
 * Round 4 (critic): the banks, lecterns, machine and delegates are near-black ink under their gold rims and the sky
 * behind the skylines is ~18 % darker, so the paper fence and the quote cards are the one bright plane; the camera
 * dollies in ~12 % over 0-13 s so the delegates act; on 'tools' an INK ARM reaches in from the left frame edge at
 * board height and sets the white stone (it lands at ~7.3 s and settles 0.3 s) while the machine's gold rim ramps up
 * from 7.1 s; each quote's attribution comes in with it; the match strikes ON 'candles' (0.25 s flare) and both
 * candles are lit by 15.0 s; the reflected hand is an ink silhouette with a candleAmber rim; the shelf reflection
 * sits 120 px higher (candle bases above the fence tops), its ripple a third, the older candles at half, the jetty
 * lantern dimmed while the candles are read; the named cards are smaller (22 px cap) with no date line; the question
 * card is ~77 % (the legibility floor) and hangs higher; the two flames stay as faint points to the cut.
 * Round 4 (review, 14.0-19.0 double exposure): the study shelf, its paper and the candles are an OPAQUE plane (alpha
 * 1) seated on a dark sill/ledge; it dissolves in 13.4-13.95 (complete before the strike on 'candles') and out after
 * 'behind' (19.6-20.2), so the skyline, the jetty and the fence never show through them; the only multiply left is the
 * sky's darkening above the waterline.
 * Round 5 (critic): NO DISSOLVE AT ALL. The sill plane is opaque from its first frame: a 1.2 s tilt (push0-push1,
 * ease.move) slides it up from below the bottom edge over the strait while the camera tilts, and after 'behind' it
 * slides back down off the bottom (pull0-pull1), so no frame holds two half-alpha scenes. The plane sits DX to the
 * right on the glass, so the lamp-side forearm is short (cuff in at the right frame edge, y ~445 stage, ~35 deg) with
 * its warm rim on the top edge only; the camera is ~8 % closer on the shelf (candle bases ~72 % of frame height) and
 * the sill face carries a warm pool under the two new flames (~25 %) and a faint panelled wall; before the strike the
 * two new candles are warm mid-value wax with a lit top rim (not towers); after the cut back the two flames lay soft
 * warm pools on BOTH quays at the waterline.
 * TEXT RULE: the two mirrored quote cards are the only text items; the candles' lettering and LIT 2022 tags carry
 * the rest. WINDOW RULE · CANDLE PLACEMENT · CANDLE-CLOCK RULE (sets/ch14-s01-strait).
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, LayerSpec, PaintEnv, Pose } from '../../../film';
import { FONT, LAYERS, POSES, PUPPET_NEAR_BLACK, blendPose, defineShot, drawTracked, mixLab, textColor, titleColor, withLife, withAlpha } from '../../../film';
import { cast, hands } from '../cast';
import {
  RING,
  RINGS,
  STONES,
  boardPoint,
  candleFlameAt,
  clamp01,
  glassReflection,
  labelPlate,
  lerp,
  monotone,
  reflCandle,
  sm,
  stoneAt,
  stoneHand,
  strait,
  tq12,
  win,
  windowFrame,
  type P,
} from '../sets/ch14-s01-strait';
import { FENCE_N, chipMachine, chipTiles, lectern, quay, ruleFence } from '../sets/ch14-s02-fence';
import { SHELF_R, behindCandle, chokeCandle, shelfRefl } from '../sets/ch14-s02-shelf';
import { fenceQuestionCard } from '../sets/ch14-s02-question';
import { namingK, reflFlameOnScreen, reflNamedCard } from '../sets/ch14-s02-naming';
import { inkHand } from '../sets/ch14-s02-inkhand';

const ID = 'ch14-s02';
type C = CanvasRenderingContext2D;

const DEL = { s: 0.5, y: 596, L: 300, R: 980 } as const;
const LECTERN = { L: 356, R: 924 } as const;
const LAND: P = { x: 398, y: 594 };
/** round 4: the shelf's reflection sits this far higher on the glass (L2 px), so the candle bases clear the fence */
const SH_DY = -120;
/** a sharp plane at the cities' depth for the sky's darkening (multiply, painted straight onto the frame) */
const SKY: LayerSpec = { id: 'ch14s02Sky', z: LAYERS.L2.z, haze: 0, blur: 0 };
/** the stone hand's geometry (L3): its fingertips travel from off the left edge to the board */
const ARM = { from: { x: -80, y: 452 } as P, len: 34, armAxis: 0.1, handAxis: 0.62 };
/** round 5: the reflection plane sits this far right on the glass (L2 px), so the lamp-side hand reaches both wicks
 *  from the frame's right edge with a short forearm */
const DX = 180;
/** round 5: how far below its place the opaque plane starts (L2 px): the candle tops start under the bottom edge */
const SLIDE = 480;
/** round 5: the lamp-side entries on the STAGE (1280 x 720): the cuff comes in at the right frame edge, y 413-467 */
const ENTRY_STAGE = { R: { x: 1312, y: 432 }, L: { x: 1312, y: 530 } };
/** round 5: unlit wax, a warm mid value two steps above the skyline's buildings */
const UNLIT_WAX = '#665036';
/** round 5: the shelf framing (camera y, lens): ~8 % closer than round 4's 1.32 */
const SHELF_CAM = { y: 232, lens: 1.425 };
/** round 5: the two warm pools at the waterline under each bank (L4 px) */
const POOL = { L: 300, R: 985, y: 598 };

interface B {
  D: number;
  fence: number;
  tools: number;
  beijing: number;
  reply: number;
  candle: number;
  chokeword: number;
  china: number;
  behind: number;
  /** the left stone lands */
  contact: number;
  /** the hand's strike on 'candles', and when it has left the glass */
  strike: number;
  handOut: number;
  tilt0: number;
  tilt1: number;
  /** round 5: the opaque sill plane slides in from below (push0-push1) and back out (pull0-pull1) */
  push0: number;
  push1: number;
  pull0: number;
  pull1: number;
  lit1: number;
  lit2: number;
  /** the tilt back down to the fence (after the second candle's lettering has been read) */
  back0: number;
  back1: number;
  /** 'question' (the card drops), 'fence' (the camera settles), 'hold' */
  question: number;
  fenceQ: number;
  hold: number;
  /** the naming rule's windows: the chokepoint candle on its own words, the behind candle on 'a year or two
   *  behind' (rise at, full for hold) */
  name1: number;
  name1Hold: number;
  name2: number;
  name2Hold: number;
}
interface Scene {
  tl: Timeline;
  b: B;
  cam: (t: number) => Camera3;
  [k: string]: unknown;
}

/** a pose track as keys [t, pose] blended over `dur` seconds, on twos */
function poseAt(keys: [number, Pose][], tq: number, dur = 0.5): Pose {
  let p = keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t0, q] = keys[i];
    if (tq < t0) break;
    p = blendPose(p, q, sm((tq - t0) / dur));
  }
  return p;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      fence: T.beat('fence'),
      tools: T.beat('tools'),
      beijing: T.word('L1403', 'Beijing'),
      reply: T.beat('reply'),
      candle: T.beat('candle'),
      chokeword: T.word('L1405', 'chokepoint'),
      china: T.word('L1405', 'China'),
      behind: T.beat('behind'),
      // round 5: a 1.2 s tilt (12.85-14.05), the opaque plane fully in place before the strike on 'candles'
      tilt0: T.beat('candle') - 1.25,
      tilt1: T.beat('candle') + 0.55,
      push0: T.beat('candle') - 1.25,
      push1: T.beat('candle') - 0.05,
      pull0: 0,
      pull1: 0,
      // round 4: the match strikes ON 'candles' and lights both candles by 15.0 s ('Two new candles')
      strike: T.beat('candle'),
      lit1: T.beat('candle') + 0.45,
      lit2: T.beat('candle') + 0.8,
      handOut: T.beat('candle') + 1.45,
      // round 4: the left stone lands on the board just after 'tools' (7.2-7.6 s) and settles for 0.3 s
      contact: T.beat('tools') + 0.1,
      back0: T.wordEnd('L1405', 'behind') + 0.5,
      back1: T.beat('question') + 0.15,
      question: T.word('L1405', 'question'),
      fenceQ: T.beat('question'),
      hold: T.word('L1405', 'hold'),
      name1: 0,
      name1Hold: 0,
      name2: 0,
      name2Hold: 0,
    };
    // the chokepoint candle is named on its words, 'computing power is the chokepoint'
    b.name1 = T.word('L1405', 'computing') - 0.1;
    b.name1Hold = Math.max(1.2, T.word('L1405', 'China') + 0.25 - (b.name1 + 0.35));
    // round 3 (re-recorded L1405): the behind candle is named on the words that say it, 'China is a year or two
    // behind': its card rises on 'China' (as its wick takes the flame) and holds through 'behind' into the tilt back
    b.name2 = T.word('L1405', 'China') - 0.05;
    b.name2Hold = Math.max(T.wordEnd('L1405', 'behind') + 0.4 - (b.name2 + 0.35), b.back0 + 0.3 - (b.name2 + 0.35));
    // up to the reflection on 'candles' (lens 1.3 → 1.36 so the two candles' lettering reads), then on 'A new
    // question' back down to the fence standing in the water, settling on 'fence'
    // round 4: a ~12 % dolly in over 0-13 s, so the delegates read as puppets that act
    // round 5: the tilt up is the 1.2 s push (the plane slides in with it, opaque); the shelf framing is ~8 % closer;
    // after 'behind' the plane slides back down off the bottom (pull0-pull1) while the camera tilts back to the fence
    b.pull0 = b.back0 + 0.1;
    b.pull1 = b.pull0 + 0.8;
    const fx = monotone([[0, 622], [b.tilt0, 646], [b.tilt1, 650], [b.back0, 654], [b.back1, 640], [D, 640]]);
    const fy = monotone([[0, 394], [b.tilt0, 404], [b.tilt1, SHELF_CAM.y], [b.back0, SHELF_CAM.y - 4], [b.back1, 400], [D, 402]]);
    const fl = monotone([[0, 1.0], [b.tilt0, 1.12], [b.tilt1, SHELF_CAM.lens], [b.back0, SHELF_CAM.lens + 0.04], [b.back1, 1.1], [D, 1.115]]);
    const cam = (t: number): Camera3 => ({ x: fx(t), y: fy(t), z: 0, lens: fl(t) });
    tl.hold(0, D);
    return { tl, b, cam };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const tq = tq12(t);
    f.camera(sc.cam(t));
    // the fence: page i rises 0.11 s after the one before it, near → far (on twos)
    const rise = (i: number) => sm((tq - (b.fence - 0.1 + i * 0.065)) / 0.45);
    // stones: the right shore's from ch14-s01; the left shore answers on 'tools'
    // review r1: the left shore's hand comes in from the LEFT frame edge at jetty height, as s01's came from the
    // right; it is already over the water on 'tools' and sets the stone just after
    const H0 = b.contact - 1.15;
    const HD = 2.3;
    const uStone = (tq - H0) / HD;
    const stones: Array<[number, number, 'b' | 'w']> = [STONES.r1];
    if (uStone >= 0.5) stones.push(STONES.l1);
    // the candles' light on both banks once lit
    const lit = 0.5 * win(t, b.lit1, b.lit1 + 0.5) + 0.5 * win(t, b.lit2, b.lit2 + 0.5);
    // the post lantern flares ~0.3 s as the stone lands
    const flare = win(t, b.contact - 0.03, b.contact + 0.07) * (1 - win(t, b.contact + 0.12, b.contact + 0.34));
    strait(f, {
      key: 'ch14',
      moodKey: 'dawnGold',
      sunX: lerp(612, 676, sm(t / b.D)),
      lit: 1 + 0.3 * lit,
      stones,
      flare,
      // round 4: the jetty lantern dims while the reflected candles are read (no hot dot on their lettering)
      lantern: 1 - 0.75 * win(t, b.tilt0, b.tilt1) * (1 - win(t, b.back0, b.back1)),
      afterL2: () => darkenSky(f),
      l3back: (c, env) => ruleFence(c, env, { rise, light: 1 }),
      l3: (c, env) => {
        const tgt = boardPoint(STONES.l1[0], STONES.l1[1]);
        if (uStone > 0 && uStone < 1) {
          inkArm(c, env, uStone, tgt);
          stoneHand(c, env, { side: -1, u: uStone, target: tgt, col: 'w', len: ARM.len, from: ARM.from, armAxis: ARM.armAxis, handAxis: ARM.handAxis, sleeve: 2.0 });
        }
        // the stone settles (0.3 s): a small press and a glint, a ring on the board's face
        const st = (tq - b.contact) / 0.3;
        if (st >= 0 && st < 1) {
          stoneAt(c, env, { x: tgt.x, y: tgt.y + 0.6 * Math.sin(st * Math.PI) }, 'w', 1, 1 - st);
          c.save();
          c.strokeStyle = withAlpha(env.mood.rim, 0.7 * (1 - st));
          c.lineWidth = 0.8;
          c.beginPath();
          c.ellipse(tgt.x, tgt.y, 5 + 9 * st, 2.2 + 3.6 * st, 0, 0, Math.PI * 2);
          c.stroke();
          c.restore();
        }
      },
      l4: (c, env) => {
        banks(c, env, t, b);
        bankPools(c, env, t, b);
      },
      afterL4: () => reflection(f, t, b),
    });
    windowFrame(f, {});
    quotes(f.c, f.mood, t, b);
    namedCards(f, t, b);
    // the new question: round 3 (re-recorded L1405) — it comes in on 'for the file' as a short drop that fades in
    // WITH its typed question (fenceQuestionCard), lands on 'fence' as the camera settles on the paper fence, and is
    // read through 'hold'
    const q0 = b.fenceQ - 1.1;
    const qd = clamp01((tq - q0) / 1.1);
    if (qd > 0) {
      const sway = 0.035 * Math.sin((tq - q0) * 1.6) * Math.exp(-Math.max(0, tq - b.fenceQ) * 0.5) + 0.006 * Math.sin(tq * 0.9);
      const glint = win(t, b.hold - 0.1, b.hold + 0.3) * (1 - win(t, b.hold + 0.5, b.hold + 1.4));
      // round 4: ~77 % (the 22 px cap floor), hung higher and left of centre, so the fence the camera settles on stays
      // the subject and the two flames' faint points (over the centre) stay clear of it
      fenceQuestionCard(f.c, { t, mood: f.mood } as PaintEnv, { x: 400, y: 130, k: 1.2, drop: qd, sway, light: 0.75 + 0.2 * glint });
    }
  },
});

/** both quays, the delegates at their identical lecterns, the chipmaking tool and tiles, the flying reply page */
function banks(c: C, env0: PaintEnv, t: number, b: B) {
  const tq = tq12(t);
  // round 4: the banks, lecterns, machine and tiles are near-black ink (value < 12 %) under their gold rims
  const NEAR = mixLab(PUPPET_NEAR_BLACK, env0.fill('ink'), 0.2);
  const env: PaintEnv = { ...env0, fill: (r) => (r === 'set' || r === 'ink' || r === 'fg' ? NEAR : env0.fill(r)) };
  quay(c, env, -1);
  quay(c, env, 1);
  // round 4: the machine's gold rim ramps 0 → full over 0.4 s from 7.1 s ('tools' 7.21), then settles
  const rim = clamp01((tq - (b.tools - 0.11)) / 0.4) * (1 - 0.45 * win(tq, b.tools + 1.4, b.tools + 3));
  chipMachine(c, env, { x: 150, y: DEL.y, s: 0.6, rim });
  chipTiles(c, env, { x: 404, y: DEL.y, s: 0.72, rim });
  // review r1: on 'tools' the dawn behind the fence finds the machine: a rim along the illumination column's top, its
  // back (sunward) edge and the body's top, with a bloom at the corner (round 4: 2 px, on the same ramp)
  const flareK = rim;
  if (flareK > 0.01) {
    const m = env.mood;
    const S = 0.6;
    const X = (u: number) => 150 + u * S;
    const Y = (v: number) => DEL.y + v * S;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.4), 0.95 * flareK);
    c.fillRect(X(58), Y(-199) - 1, 72 * S, 2);
    c.fillRect(X(130) - 1, Y(-198), 2, 140 * S);
    c.fillRect(X(-150), Y(-67) - 0.8, 214 * S, 1.6);
    c.fillRect(X(-140), Y(-79) - 0.8, 150 * S, 1.6);
    const gx = X(130), gy = Y(-199);
    const rg = c.createRadialGradient(gx, gy, 0, gx, gy, 34);
    rg.addColorStop(0, withAlpha(m.core, 0.6 * flareK));
    rg.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = rg;
    c.fillRect(gx - 34, gy - 34, 68, 68);
    c.restore();
  }
  // left delegate: lifts a page, points to the strait as the fence rises, then listens
  const pL = poseAt(
    [
      [0, POSES.stand],
      [0.7, POSES.present],
      [b.fence - 0.25, POSES.point],
      [b.tools + 0.8, POSES.stand],
      [b.reply + 1.4, POSES.listen],
    ],
    tq,
  );
  // right delegate: still, then on 'Beijing' raises his page; on 'replied' it leaves his hand
  const pR = poseAt(
    [
      [0, POSES.listen],
      [b.beijing - 0.1, POSES.present],
      [b.reply + 0.7, POSES.authority],
      [b.reply + 2.6, POSES.stand],
    ],
    tq,
  );
  const common = { scale: DEL.s, ink: PUPPET_NEAR_BLACK };
  const oL = { x: DEL.L, y: DEL.y, facing: 'right' as const, pose: withLife(pL, tq, 31), light: { x: 1, y: -0.6, floor: 0 }, edgeRim: { x: 1, y: -0.5, px: 1.5 }, ...common };
  const oR = { x: DEL.R, y: DEL.y, facing: 'left' as const, pose: withLife(pR, tq, 37), light: { x: -1, y: -0.6, floor: 0 }, edgeRim: { x: -1, y: -0.5, px: 1.5 }, ...common };
  cast.delegate.draw(c, oL, env);
  cast.delegate.draw(c, oR, env);
  lectern(c, env, { x: LECTERN.L, y: DEL.y, s: 0.5 });
  lectern(c, env, { x: LECTERN.R, y: DEL.y, s: 0.5 });
  // the reply page (review r1): leaves the right lectern on 'replied', flies a 1.2 s arc just over the fence's crest
  // and settles on the left bank; ~40 px wide in flight, face-on, its sunward edge rimmed
  const from = { x: LECTERN.R - 6, y: DEL.y - 64 };
  const u = clamp01((tq - (b.reply - 0.05)) / 1.2);
  if (u > 0) {
    const ease = sm(u);
    const x = lerp(from.x, LAND.x, ease);
    // the crest of the fence (L3) sits at about y 300 on this plane; the page clears it by ~30 px at mid flight
    const y = lerp(from.y, LAND.y, ease) - Math.sin(Math.PI * u) * 268;
    const land = u >= 1;
    const k = land ? 0.6 : lerp(1.0, 1.8, Math.min(1, u * 5)) * (u > 0.8 ? lerp(1, 0.6 / 1.8, (u - 0.8) / 0.2) : 1);
    sheet(c, env, x, y, land ? 0 : -0.35 + Math.sin(u * 4) * 0.25, land ? 0.18 : 0.82 + 0.18 * Math.cos(u * 6), k, x);
  }
}

/** a single sheet of parchment, a few typed lines; squash = its tumble (1 face on, ~0 edge on); its edge facing the
 *  dawn (sunX ≈ 640, world x `wx`) carries a rim */
function sheet(c: C, env: PaintEnv, x: number, y: number, rot: number, squash: number, k = 1, wx = x) {
  const m = env.mood;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(k, k * Math.max(0.12, squash));
  c.fillStyle = mixLab(m.rim, '#f3ead6', 0.35);
  c.fillRect(-11, -14, 22, 28);
  c.fillStyle = withAlpha(m.ink, 0.5);
  for (let q = 0; q < 6; q++) c.fillRect(-7, -9 + q * 4, 10 + (q % 3) * 2, 0.9);
  // the sunward edge (and the top) catch the dawn
  c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.5), 0.95);
  const lw = 1.2 / k;
  if (wx > 640) c.fillRect(-11, -14, lw, 28);
  else c.fillRect(11 - lw, -14, lw, 28);
  c.fillRect(-11, -14, 22, lw);
  c.restore();
}

/** the two quote cards, mirror placed (centres 320 and 960): Washington's reason over the left bank, Beijing's
 *  reply over the right. Verbatim quotes; attributions in tracked small caps at ≥ 26 px (1080p) */
function quotes(c: C, m: PaintEnv['mood'], t: number, b: B) {
  // round 4: cleared as the camera starts to rise (L1403 has ended), before the hand strikes on 'candles'
  // round 5: both held together until the push starts, then out together as the opaque plane rises (gone by ~13.4,
  // long before the candle tops reach their height)
  const out = b.push0 - 0.05;
  const card = (x: number, at: number, lines: string[], attrib: string[]) => {
    if (t < at || t > out + 0.6) return;
    const a = win(t, at, at + 0.6) * (1 - win(t, out, out + 0.6));
    if (a <= 0.003) return;
    labelPlate(c, m, x, 150, 450, 260, 0.85 * a);
    c.save();
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.font = `italic 400 23px ${FONT.text}`;
    c.fillStyle = textColor(m);
    lines.forEach((ln, i) => {
      const k = win(t, at + 0.25 + i * 0.3, at + 0.95 + i * 0.3);
      c.globalAlpha = a * k;
      const txt = (i === 0 ? '“' : '') + ln + (i === lines.length - 1 ? '”' : '');
      c.fillText(txt, x, 112 + i * 31 + (1 - k) * 4);
    });
    // round 4: the attribution comes in WITH its quote (within 0.4 s of the last line)
    const ka = win(t, at + 0.6, at + 1.1);
    c.globalAlpha = a * 0.92 * ka;
    c.fillStyle = titleColor(m);
    attrib.forEach((ln, i) => {
      // round-2 legibility: the attributions are read (24 px small caps ≥ 22 px cap at 1080p)
      const w = drawTracked(c, ln, x, 112 + lines.length * 31 + 26 + i * 29, { font: `500 24px ${FONT.sc}`, size: 24, tracking: 0.08, align: 'center' });
      if (i === 0) c.fillRect(x - w / 2 - 30, 112 + lines.length * 31 + 26 - 8, 20, 1.2);
    });
    c.restore();
  };
  card(320, b.fence + 0.05, ['…certain high-end chips', 'used in military applications'], ['BIS, 7 OCT 2022']);
  card(960, b.reply + 0.05, ['…the U.S. abuses export', 'control measures…'], ['MAO NING, 8 OCT 2022', '(AP TRANSLATION)']);
}

/** round 5: the opaque plane's vertical offset on the glass (L2 px; 0 = in place, SLIDE = under the bottom edge).
 *  A 1.2 s tilt in (push0-push1, ease.move) and a 0.8 s tilt out (pull0-pull1); on ones (it is the camera's move) */
function slideY(t: number, b: B): number {
  if (t <= b.push0 || t >= b.pull1) return SLIDE;
  if (t < b.push1) return SLIDE * (1 - ease.move((t - b.push0) / (b.push1 - b.push0)));
  if (t <= b.pull0) return 0;
  return SLIDE * ease.move((t - b.pull0) / (b.pull1 - b.pull0));
}
/** is the plane on screen at all (it is opaque whenever it is) */
const planeOn = (t: number, b: B) => t > b.push0 && t < b.pull1;

/** the two new candles as ReflCandle templates on the shifted plane */
const C1at = (o: Parameters<typeof chokeCandle>[0] = {}) => chokeCandle({ x: SHELF_R.choke + DX, y: SHELF_R.y + SH_DY, ...o });
const C2at = (o: Parameters<typeof behindCandle>[0] = {}) => behindCandle({ x: SHELF_R.behind + DX, y: SHELF_R.y + SH_DY, ...o });

/** stage px → reflection-plane px under the current camera (the plane's slide `dy` removed) */
function stageToPlane(f: Parameters<typeof glassReflection>[0], s: P, dy: number): P {
  const a = reflFlameOnScreen(f, { x: 0, y: 0 });
  const q = reflFlameOnScreen(f, { x: 1000, y: 1000 });
  const kx = (q.x - a.x) / 1000 || 1, ky = (q.y - a.y) / 1000 || 1;
  return { x: (s.x - a.x) / kx, y: (s.y - a.y) / ky - dy };
}

/** the study shelf's right end in the glass: one match lights two candles (CANDLE-CLOCK RULE: both just lit,
 *  their flames on the top ring, sleeves empty). Round 4: the whole shelf sits SH_DY higher on the glass. Round 5:
 *  the plane is OPAQUE from its first frame and slides in/out (slideY), never dissolves */
function reflection(f: Parameters<typeof glassReflection>[0], t: number, b: B) {
  const tq = tq12(t);
  const on = planeOn(t, b);
  const dy = slideY(t, b);
  const a = on ? 1 : 0;
  // the two flames stay as faint points over the strait to the cut (light only, never the plane): round 5, they
  // come up only once the plane has left the frame
  const aF0 = 0.24 * win(t, b.pull1 - 0.1, b.pull1 + 0.6);
  if (!on && aF0 <= 0.002) return;
  const fl1 = clamp01((t - b.lit1) / 0.3);
  const fl2 = clamp01((t - b.lit2) / 0.3);
  // round-2 legibility: lettering × 1.15; NAMING RULE: while a candle is named its vertical lettering gives way
  const n1 = namingK(t, b.name1, b.name1Hold), n2 = namingK(t, b.name2, b.name2Hold);
  const C1 = C1at({ state: fl1 > 0 ? 'live' : 'unlit', flame: fl1, letterSize: 1.15, letters: 0.8 * (1 - 0.85 * n1) });
  const C2 = C2at({ state: fl2 > 0 ? 'live' : 'unlit', flame: fl2, letterSize: 1.15, letters: 0.8 * (1 - 0.85 * n2), letterGlow: win(t, b.behind - 0.15, b.behind + 0.25) * (1 - 0.5 * win(t, b.behind + 1, b.behind + 2.2)) });
  const w1 = candleFlameAt(C1), w2 = candleFlameAt(C2);
  // the hand (WINDOW RULE: a reflection from the lower right): in as the plane settles, the match struck ON 'candles'
  // (u .38), carried to the first wick (lit1), then the second (lit2), withdrawn by handOut
  const s0 = b.strike - 0.4;
  let u = -1;
  let target: P = w1;
  if (tq >= s0 && tq < b.strike) u = (0.38 * (tq - s0)) / (b.strike - s0);
  else if (tq >= b.strike && tq < b.lit1 - 0.02) u = 0.38 + (0.22 * (tq - b.strike)) / (b.lit1 - 0.02 - b.strike);
  else if (tq >= b.lit1 - 0.02 && tq < b.lit1 + 0.12) u = 0.6 + (0.05 * (tq - b.lit1 + 0.02)) / 0.14;
  else if (tq >= b.lit1 + 0.12 && tq < b.lit2 + 0.12) {
    u = 0.65 + (0.13 * (tq - b.lit1 - 0.12)) / (b.lit2 - b.lit1);
    const k = sm((tq - b.lit1 - 0.12) / Math.max(0.1, b.lit2 - 0.06 - b.lit1 - 0.12));
    target = { x: lerp(w1.x, w2.x, k), y: lerp(w1.y, w2.y, k) };
  } else if (tq >= b.lit2 + 0.12 && tq < b.handOut) {
    u = 0.78 + (0.22 * (tq - b.lit2 - 0.12)) / (b.handOut - b.lit2 - 0.12);
    target = w2;
  }
  // round 5 (critic: 'the forearm is too big'): the sleeve runs off through the RIGHT frame edge at y ~446 (stage),
  // ~35 deg, so only a short forearm shows; the hand and match keep their size (scale 0.5)
  let pose = null as ReturnType<typeof hands.act> | null;
  let opts = null as Parameters<typeof hands.act>[3] | null;
  if (on && u >= 0 && u < 1) {
    opts = {
      scale: 0.5,
      entry: { R: stageToPlane(f, ENTRY_STAGE.R, dy), L: stageToPlane(f, ENTRY_STAGE.L, dy) },
      strikeAt: { x: SHELF_R.behind + DX + 104, y: SHELF_R.y + SH_DY - 70 },
    };
    pose = hands.act('strikeLight', u, target, opts);
    // put the match flame (not the wrist) on the wick
    const fp = hands.flameAt(pose);
    if (fp && u >= 0.55) pose = hands.act('strikeLight', u, { x: target.x + (target.x - fp.x), y: target.y + (target.y - fp.y) - 2 }, opts);
  }
  const mf = pose ? hands.flameAt(pose) : null;
  const matchLit = pose?.right?.lit ?? 0;
  // the strike's flare: 0.25 s on 'candles'
  const flare = win(t, b.strike - 0.02, b.strike + 0.05) * (1 - win(t, b.strike + 0.1, b.strike + 0.25));
  const rF = 64;
  const oldFlames: { x: number; y: number }[] = [];
  const lit = (fl1 + fl2) * 0.5;
  // the flames' glows ride the plane while it is in; afterwards only the two faint points remain, at rest
  const gY = (y: number) => y + (on ? dy : 0);
  glassReflection(f, {
    key: ID,
    rect: { x: 40, y: 140 + SH_DY + dy, w: 1220, h: 700 },
    res: f.pxScale * 1.36,
    // round 4 (review: 'buildings and the jetty show through the shelf, paper and candles'): the shelf, its paper and
    // the candles are an OPAQUE plane (alpha 1, no vignette, no ripple) seated on a dark sill; nothing of the skyline,
    // the jetty or the fence shows through them. Only the flames' light is added on top. Round 5: never partial
    alpha: a,
    light: 0.1 * a,
    ripple: 0,
    draw: (c, env) => {
      if (!on) return;
      c.save();
      c.translate(0, dy);
      sill(c, env, SHELF_R.y + SH_DY + 12 * SHELF_R.s, 1 + 0.6 * lit);
      c.save();
      c.translate(DX, SH_DY);
      // the plank continues off to the left (the plane sits DX right of round 4's place)
      plankLeft(c, env, -700, SHELF_R.x0 + 1, SHELF_R.y, SHELF_R.s);
      // the older chapters' candles: opaque, their lettering dim (letters 0.35 in shelfRefl), flames dimmer below
      oldFlames.push(...shelfRefl(c, env, ID, 1).map((p) => ({ x: p.x + DX, y: p.y + SH_DY })));
      c.restore();
      newCandle(c, C1, env, fl1);
      newCandle(c, C2, env, fl2);
      c.restore();
    },
    glows: () => [
      ...(on ? oldFlames.map((p) => ({ x: p.x, y: gY(p.y) - 4, r: 46, a: 0.25 })) : []),
      { x: w1.x, y: gY(w1.y) - 6, r: on ? rF : 0.42 * rF, a: 0.85 * fl1 * Math.max(a, aF0) },
      { x: w2.x, y: gY(w2.y) - 6, r: on ? rF : 0.42 * rF, a: 0.85 * fl2 * Math.max(a, aF0) },
      ...(mf && matchLit > 0 ? [{ x: mf.x, y: gY(mf.y), r: 70, a: Math.min(1.3, matchLit) * a }] : []),
      ...(mf && flare > 0.01 ? [{ x: mf.x, y: gY(mf.y), r: 130, a: 1.4 * flare * a }] : []),
      // round 5: a warm pool on the sill's face under the two new flames (~25 % at its core, 1.2x round 4's radius)
      { x: (w1.x + w2.x) / 2, y: gY(SHELF_R.y + SH_DY + 46), r: 228, a: 0.42 * lit * a },
      // their light falling on both banks at once
      { x: (w1.x + w2.x) / 2, y: gY(SHELF_R.y + SH_DY - 160), r: 700, a: 0.16 * lit * a },
    ],
  });
  // the hand on its own sheet of the same plane: round 4, an INK silhouette cut out by a candleAmber rim, whole to the
  // cuff. Round 5: a short forearm from the right frame edge, its warm rim (2-3 px at 1080p) on the top edge only
  if (pose) {
    const hp = pose;
    glassReflection(f, {
      key: `${ID}-hands`,
      rect: { x: 440, y: 150 + SH_DY + dy, w: 900, h: 800 },
      res: f.pxScale * 1.36,
      alpha: a,
      light: 0.2 * a,
      ripple: 0,
      draw: (c, env) => {
        c.save();
        c.translate(0, dy);
        inkHand(c, hp, env, { lit: Math.min(1, matchLit), rimPx: 1.1, light: { x: 0.5, y: -0.86 } });
        c.restore();
      },
    });
  }
}

/** round 5 (critic: 'unlit candles read as towers'): before its wick takes the flame a new candle is warm mid-value
 *  wax (UNLIT_WAX) with a lit 1.5 px top rim; as it catches it settles toward the shelf's ink silhouette, keeping a
 *  little warmth */
function newCandle(c: C, o: ReturnType<typeof chokeCandle>, env: PaintEnv, fl: number) {
  const ink = env.fill('ink');
  const k = sm(fl / 1);
  const body = mixLab(mixLab(UNLIT_WAX, ink, 0.08), ink, 0.72 * k);
  reflCandle(c, o, { ...env, fill: (r) => (r === 'ink' ? body : env.fill(r)) });
  const s = o.s;
  const w = 38 * s;
  const top = o.y - RINGS * RING * s;
  c.save();
  // a dark wick (the body fill would have tinted it)
  c.fillStyle = ink;
  c.fillRect(o.x - 0.8 * s, top - 5 * s, 1.6 * s, 6 * s);
  // the top rim: lit wax catching the window light (fades as the flame takes over)
  c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.25), 0.9 * (1 - 0.6 * k));
  c.fillRect(o.x - w / 2, top - 0.5, w, 1.1);
  // the lit side: a hairline down the lamp-side edge of the wax while it is unlit
  c.fillStyle = withAlpha(env.mood.rim, 0.35 * (1 - k));
  c.fillRect(o.x + w / 2 - 1, top, 1, RINGS * RING * s);
  c.restore();
}

/** round 5: the plank continued to the left of shelfEnd's start (no bracket), same section and scallops */
function plankLeft(c: C, env: PaintEnv, x0: number, x1: number, y: number, s: number) {
  c.fillStyle = env.fill('ink');
  c.fillRect(x0, y, x1 - x0, 12 * s);
  c.beginPath();
  c.moveTo(x0, y + 12 * s);
  for (let x = x0; x < x1; x += 24 * s) {
    c.lineTo(x, y + 12 * s);
    c.quadraticCurveTo(x + 12 * s, y + 22 * s, Math.min(x1, x + 24 * s), y + 12 * s);
  }
  c.lineTo(x1, y + 12 * s);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(env.mood.rim, 0.45);
  c.fillRect(x0, y - 0.6 * s, x1 - x0, 1.2 * s);
}

/** round 4: the dark sill/ledge the shelf is seated on (L2 coords): a lit top edge where the plank stands, a ledge
 *  face, then the study wall below, all opaque near-black; the two new flames warm its top edge (`warm` 1..1.6).
 *  Round 5: the wall below is a faint panelled wainscot (a dado rail and stiles catching the candlelight), so the
 *  lower third is a wall, not a flat black slab */
function sill(c: C, env: PaintEnv, y: number, warm: number) {
  const A = env.mood;
  const ink = mixLab(PUPPET_NEAR_BLACK, A.ink, 0.25);
  c.save();
  c.globalAlpha = 1;
  // the ledge top (a narrow, slightly lighter face) and the wall below it
  c.fillStyle = mixLab(ink, A.set, 0.22);
  c.fillRect(-200, y - 2, 1700, 18);
  c.fillStyle = ink;
  c.fillRect(-200, y + 16, 1700, 900);
  // the ledge's front lip: a darker shadow line under the top face
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, '#000000', 0.4);
  c.fillRect(-200, y + 16, 1700, 5);
  // the wainscot: a dado rail and raised panels, lit only from above (top edges), fading away from the candles
  const cx = SHELF_R.behind + DX - 50;
  const fall = (x: number) => Math.max(0, 1 - Math.abs(x - cx) / 620);
  const rail = y + 64;
  c.fillStyle = mixLab(ink, A.set, 0.12);
  c.fillRect(-200, rail, 1700, 7);
  for (let x = -200; x < 1500; x += 40) {
    c.fillStyle = withAlpha(A.rim, 0.05 + 0.2 * fall(x + 20) * (warm - 0.6));
    c.fillRect(x, rail - 0.6, 40, 1.1);
  }
  for (let x = -140; x < 1500; x += 176) {
    const k = fall(x + 70);
    c.strokeStyle = withAlpha(A.rim, 0.04 + 0.12 * k * (warm - 0.6));
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x, rail + 150);
    c.lineTo(x, rail + 26);
    c.lineTo(x + 140, rail + 26);
    c.stroke();
    c.strokeStyle = withAlpha('#000000', 0.25);
    c.beginPath();
    c.moveTo(x + 140, rail + 26);
    c.lineTo(x + 140, rail + 150);
    c.stroke();
  }
  // the top edge catches the candles (a warm hairline, brightest under the two new flames)
  const g = c.createLinearGradient(160 + DX, 0, 1140 + DX, 0);
  g.addColorStop(0, withAlpha(A.rim, 0.18));
  g.addColorStop(0.5, withAlpha(A.rim, Math.min(0.9, 0.5 * warm)));
  g.addColorStop(1, withAlpha(A.rim, 0.22));
  c.fillStyle = g;
  c.fillRect(-200, y - 2.6, 1700, 1.3);
  c.restore();
}

/** NAMING RULE (sets/beliefCandle.ts) for the two reflected candles: the chokepoint candle's card on its own words
 *  (to the LEFT of its flame), then the behind candle's on 'China is a year or two behind' (to the RIGHT), so the two
 *  never cover each other. Round 4 (TEXT RULE): small (the 22 px cap floor), no date line (the LIT 2022 tags and the
 *  live flames already say it). Round 5: they ride the plane and are gone before it slides out */
function namedCards(f: Parameters<typeof glassReflection>[0], t: number, b: B) {
  if (!planeOn(t, b)) return;
  const dy = slideY(t, b);
  const a = 1 - win(t, b.pull0 - 0.2, b.pull0 + 0.15);
  const n1 = namingK(t, b.name1, b.name1Hold) * a;
  const n2 = namingK(t, b.name2, b.name2Hold) * a;
  if (n1 > 0.003) {
    const w = candleFlameAt(C1at());
    const p = reflFlameOnScreen(f, { x: w.x, y: w.y + dy });
    reflNamedCard(f.c, { sx: p.x, sy: p.y, k: n1, lines: ['COMPUTE IS', 'THE CHOKEPOINT'], cap: 22, side: 'left' }, f.mood);
  }
  if (n2 > 0.003) {
    const w = candleFlameAt(C2at());
    const p = reflFlameOnScreen(f, { x: w.x, y: w.y + dy });
    reflNamedCard(f.c, { sx: p.x, sy: p.y, k: n2, lines: ['CHINA IS A YEAR', 'OR TWO BEHIND'], cap: 22, side: 'right' }, f.mood);
  }
}

/** round 5 (critic: 'light on both banks'): after the cut back to the wide, the two flames' light lies on BOTH quays:
 *  two soft warm pools (~18 %, additive) at the waterline under each bank's lectern */
function bankPools(c: C, env: PaintEnv, t: number, b: B) {
  const k = win(t, b.pull1 - 0.2, b.pull1 + 0.9);
  if (k <= 0.003) return;
  const m = env.mood;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const [x, y] of [[POOL.L, POOL.y], [POOL.R, POOL.y]] as const) {
    c.save();
    c.translate(x, y);
    c.scale(1, 0.3);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 270);
    g.addColorStop(0, withAlpha(mixLab(m.core, m.halo, 0.3), 0.36 * k));
    g.addColorStop(0.4, withAlpha(m.halo, 0.14 * k));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(-270, -270, 540, 540);
    c.restore();
  }
  c.restore();
}

/** round 4: the sky behind the skylines ~18 % darker (a multiply over the frame above the horizon, fading out at the
 *  water line), so the paper fence and the quote cards are the one bright plane */
function darkenSky(f: Parameters<typeof glassReflection>[0]) {
  f.layer(SKY, (c) => {
    c.save();
    c.globalCompositeOperation = 'multiply';
    const g = c.createLinearGradient(0, -300, 0, 420);
    g.addColorStop(0, '#c4c4c4');
    g.addColorStop(0.75, '#d2d2d2');
    g.addColorStop(1, '#ffffff');
    c.fillStyle = g;
    c.fillRect(-1600, -900, 4500, 1320);
    c.restore();
  });
}

/** round 4 (review: 'a detached forearm, a thrown cigar'): the left shore's arm is one unbroken ink sleeve from off the
 *  frame's LEFT edge, at board height, to the stone hand's wrist (stoneHand draws the hand, cuff and near sleeve over
 *  it). The same reach as stoneHand, so wrist and sleeve stay joined */
function inkArm(c: C, env: PaintEnv, U: number, target: P) {
  const L = ARM.len;
  const reach = U < 0.42 ? sm(U / 0.42) : U < 0.58 ? 1 : 1 - sm((U - 0.58) / 0.42);
  const press = U >= 0.42 && U < 0.58 ? Math.sin(((U - 0.42) / 0.16) * Math.PI) * 1.4 : 0;
  const away = 1 - reach;
  const tip = { x: lerp(target.x, ARM.from.x, away), y: lerp(target.y - 2.4, ARM.from.y, away) + press };
  const ah = ARM.handAxis, aa = ARM.armAxis;
  const wr = { x: tip.x - Math.cos(ah) * L * 0.6, y: tip.y - Math.sin(ah) * L * 0.6 };
  const nA = { x: -Math.sin(aa), y: Math.cos(aa) };
  const back = { x: wr.x - Math.cos(aa) * 2400, y: wr.y - Math.sin(aa) * 2400 };
  // the sleeve swells toward the frame's edge (the arm comes from near the lens, a coat sleeve, not a pole)
  const w0 = L * 0.2, w1 = L * 1.6;
  const m = env.mood;
  c.save();
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, env.fill('ink'), 0.2);
  c.beginPath();
  c.moveTo(wr.x - nA.x * w0, wr.y - nA.y * w0);
  c.lineTo(back.x - nA.x * w1, back.y - nA.y * w1);
  c.lineTo(back.x + nA.x * w1, back.y + nA.y * w1);
  c.lineTo(wr.x + nA.x * w0, wr.y + nA.y * w0);
  c.closePath();
  c.fill();
  // its top contour catches the dawn (gold rim), and a seam of the coat sleeve
  c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.25), 0.75);
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(wr.x - nA.x * w0, wr.y - nA.y * w0);
  c.lineTo(back.x - nA.x * w1, back.y - nA.y * w1);
  c.stroke();
  c.restore();
}

void FENCE_N;
