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
 * TEXT RULE: the two mirrored quote cards are the only text items; the candles' lettering and LIT 2022 tags carry
 * the rest. WINDOW RULE · CANDLE PLACEMENT · CANDLE-CLOCK RULE (sets/ch14-s01-strait).
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv, Pose } from '../../../film';
import { FONT, POSES, PUPPET_NEAR_BLACK, blendPose, defineShot, drawTracked, mixLab, textColor, titleColor, withLife, withAlpha } from '../../../film';
import { cast, hands } from '../cast';
import {
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

const ID = 'ch14-s02';
type C = CanvasRenderingContext2D;

const DEL = { s: 0.5, y: 596, L: 300, R: 980 } as const;
const LECTERN = { L: 356, R: 924 } as const;
const LAND: P = { x: 398, y: 594 };

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
  tilt0: number;
  tilt1: number;
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
      tilt0: T.beat('candle') - 0.45,
      tilt1: T.beat('candle') + 1.75,
      lit1: T.word('L1405', 'chokepoint') - 0.12,
      lit2: T.word('L1405', 'China') + 0.05,
      contact: T.beat('tools') - 0.75 + 1.15,
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
    b.name1 = b.lit1 - 0.1;
    b.name1Hold = Math.max(1.2, T.word('L1405', 'China') + 0.25 - (b.name1 + 0.35));
    // round 3 (re-recorded L1405): the behind candle is named on the words that say it, 'China is a year or two
    // behind': its card rises on 'China' (as its wick takes the flame) and holds through 'behind' into the tilt back
    b.name2 = T.word('L1405', 'China') - 0.05;
    b.name2Hold = Math.max(T.wordEnd('L1405', 'behind') + 0.4 - (b.name2 + 0.35), b.back0 + 0.3 - (b.name2 + 0.35));
    // up to the reflection on 'candles' (lens 1.3 → 1.36 so the two candles' lettering reads), then on 'A new
    // question' back down to the fence standing in the water, settling on 'fence'
    const fx = monotone([[0, 622], [b.tilt0, 664], [b.tilt1, 650], [b.back0, 654], [b.back1, 640], [D, 640]]);
    const fy = monotone([[0, 394], [b.tilt0, 392], [b.tilt1, 300], [b.back0, 296], [b.back1, 400], [D, 402]]);
    const fl = monotone([[0, 1.0], [b.tilt0, 1.012], [b.tilt1, 1.32], [b.back0, 1.36], [b.back1, 1.06], [D, 1.075]]);
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
    const H0 = b.tools - 0.75;
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
      l3back: (c, env) => ruleFence(c, env, { rise, light: 1 }),
      l3: (c, env) => {
        if (uStone > 0 && uStone < 1)
          stoneHand(c, env, { side: -1, u: uStone, target: boardPoint(STONES.l1[0], STONES.l1[1]), col: 'w', len: 30, from: { x: -80, y: 452 }, armAxis: 0.1, handAxis: 0.62, sleeve: 2.0 });
      },
      l4: (c, env) => banks(c, env, t, b),
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
      fenceQuestionCard(f.c, { t, mood: f.mood } as PaintEnv, { x: 640, y: 168, k: 1.55, drop: qd, sway, light: 0.75 + 0.2 * glint });
    }
  },
});

/** both quays, the delegates at their identical lecterns, the chipmaking tool and tiles, the flying reply page */
function banks(c: C, env: PaintEnv, t: number, b: B) {
  const tq = tq12(t);
  quay(c, env, -1);
  quay(c, env, 1);
  const rim = win(tq, b.tools - 0.1, b.tools + 0.4) * (1 - 0.55 * win(tq, b.tools + 1.4, b.tools + 3));
  chipMachine(c, env, { x: 150, y: DEL.y, s: 0.6, rim });
  chipTiles(c, env, { x: 404, y: DEL.y, s: 0.72, rim });
  // review r1: on 'tools' the dawn behind the fence finds the machine: a 1.5 px rim flares along the illumination
  // column's top and its back (sunward) edge, with a short bloom at the corner, then settles to a hairline
  const flareK = win(tq, b.tools - 0.12, b.tools + 0.18) * (1 - 0.6 * win(tq, b.tools + 0.7, b.tools + 2.2));
  if (flareK > 0.01) {
    const m = env.mood;
    const S = 0.6;
    const X = (u: number) => 150 + u * S;
    const Y = (v: number) => DEL.y + v * S;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.4), 0.95 * flareK);
    c.fillRect(X(58), Y(-199) - 0.5, 72 * S, 1.1);
    c.fillRect(X(130) - 0.6, Y(-198), 1.1, 140 * S);
    c.fillRect(X(-150), Y(-67) - 0.5, 214 * S, 1);
    const gx = X(130), gy = Y(-199);
    const rg = c.createRadialGradient(gx, gy, 0, gx, gy, 34);
    rg.addColorStop(0, withAlpha(m.core, 0.45 * flareK));
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
  const out = b.candle - 0.05;
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
    const ka = win(t, at + 0.95 + lines.length * 0.3, at + 1.55 + lines.length * 0.3);
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

/** the study shelf's right end in the glass: one match lights two candles (CANDLE-CLOCK RULE: both just lit,
 *  their flames on the top ring, sleeves empty) */
function reflection(f: Parameters<typeof glassReflection>[0], t: number, b: B) {
  const tq = tq12(t);
  const a = win(t, b.tilt0 + 0.1, b.tilt1 - 0.3) * (1 - 0.94 * win(t, b.back0 + 0.2, b.back1 - 0.2));
  if (a <= 0.002) return;
  const fl1 = clamp01((t - b.lit1) / 0.35);
  const fl2 = clamp01((t - b.lit2) / 0.35);
  // round-2 legibility: lettering × 1.15 (≥ 22 px cap at lens 1.32 while each candle is named)
  // NAMING RULE: while a candle is named its vertical lettering gives way to the horizontal card (namedCards)
  const n1 = namingK(t, b.name1, b.name1Hold), n2 = namingK(t, b.name2, b.name2Hold);
  const C1 = chokeCandle({ state: fl1 > 0 ? 'live' : 'unlit', flame: fl1, letterSize: 1.15, letters: 0.8 * (1 - 0.85 * n1) });
  const C2 = behindCandle({ state: fl2 > 0 ? 'live' : 'unlit', flame: fl2, letterSize: 1.15, letters: 0.8 * (1 - 0.85 * n2), letterGlow: win(t, b.behind - 0.15, b.behind + 0.25) * (1 - 0.5 * win(t, b.behind + 1, b.behind + 2.2)) });
  const w1 = candleFlameAt(C1), w2 = candleFlameAt(C2);
  // the hands (WINDOW RULE: a faint reflection, small, from the lower-right corner, never a giant over the water):
  // they come in on 'candles', strike within ~1.1 s, carry the flame to the first wick on 'chokepoint', then to the
  // second on 'China', and are gone by China + 0.75
  const s0 = b.candle + 0.2;
  const strikeEnd = s0 + 0.9;
  let u = -1;
  let target: P = w1;
  if (tq >= s0 && tq < strikeEnd) u = (0.38 * (tq - s0)) / 0.9;
  else if (tq >= strikeEnd && tq < b.lit1 + 0.05) u = 0.38 + (0.22 * (tq - strikeEnd)) / Math.max(0.2, b.lit1 + 0.05 - strikeEnd);
  else if (tq >= b.lit1 + 0.05 && tq < b.lit1 + 0.35) u = 0.6 + (0.1 * (tq - b.lit1 - 0.05)) / 0.3;
  else if (tq >= b.lit1 + 0.35 && tq < b.lit2 - 0.05) {
    u = 0.7;
    const k = sm((tq - b.lit1 - 0.35) / Math.max(0.2, b.lit2 - 0.05 - b.lit1 - 0.35));
    target = { x: lerp(w1.x, w2.x, k), y: lerp(w1.y, w2.y, k) };
  } else if (tq >= b.lit2 - 0.05 && tq < b.china + 0.2) {
    u = 0.7 + (0.1 * (tq - b.lit2 + 0.05)) / Math.max(0.1, b.china + 0.2 - b.lit2 + 0.05);
    target = w2;
  } else if (tq >= b.china + 0.2 && tq < b.china + 0.75) {
    u = 0.8 + (0.2 * (tq - b.china - 0.2)) / 0.55;
    target = w2;
  }
  const opts = { scale: 0.33, entry: { R: { x: 1010, y: 620 }, L: { x: 940, y: 650 } }, strikeAt: { x: SHELF_R.behind + 70, y: SHELF_R.y - 96 } };
  let pose = u >= 0 && u < 1 ? hands.act('strikeLight', u, target, opts) : null;
  if (pose) {
    // put the match flame (not the wrist) on the wick
    const fp = hands.flameAt(pose);
    if (fp && u >= 0.55) pose = hands.act('strikeLight', u, { x: target.x + (target.x - fp.x), y: target.y + (target.y - fp.y) - 2 }, opts);
  }
  const mf = pose ? hands.flameAt(pose) : null;
  const matchLit = pose?.right?.lit ?? 0;
  const oldFlames: { x: number; y: number }[] = [];
  glassReflection(f, {
    key: ID,
    rect: { x: 90, y: 140, w: 1120, h: 700 },
    res: f.pxScale * 1.36,
    // WINDOW RULE (review r1): a ~35% veil over the dawn, the fence showing through the wax; 1-2 px ripple
    alpha: 0.34 * a,
    light: 0.3 * a,
    ripple: 1.7,
    fade: { cx: 640, cy: 390, r0: 250, r1: 520 },
    draw: (c, env) => {
      oldFlames.push(...shelfRefl(c, env, ID));
      reflCandle(c, C1, env);
      reflCandle(c, C2, env);
    },
    glows: () => [
      ...oldFlames.map((p) => ({ x: p.x, y: p.y - 4, r: 46, a: 0.5 * a })),
      { x: w1.x, y: w1.y - 6, r: 64, a: 0.85 * fl1 * a },
      { x: w2.x, y: w2.y - 6, r: 64, a: 0.85 * fl2 * a },
      ...(mf && matchLit > 0 ? [{ x: mf.x, y: mf.y, r: 70, a: Math.min(1.3, matchLit) * a }] : []),
      // their light falling on both banks at once
      { x: (w1.x + w2.x) / 2, y: SHELF_R.y - 160, r: 700, a: 0.16 * (fl1 + fl2) * 0.5 * a },
    ],
  });
  // the hands on their own faint sheet of the same plane, rippled with it; the forearms fade out well before
  // x ≈ 1000 (a radial fade around the wicks)
  if (pose) {
    const hp = pose;
    glassReflection(f, {
      key: `${ID}-hands`,
      rect: { x: 440, y: 150, w: 640, h: 520 },
      res: f.pxScale * 1.36,
      alpha: 0.35 * a,
      light: 0.18 * a,
      ripple: 1.7,
      fade: { cx: 668, cy: 300, r0: 80, r1: 215 },
      draw: (c, env) => hands.draw(c, hp, env),
    });
  }
}

/** NAMING RULE (sets/beliefCandle.ts) for the two reflected candles: the chokepoint candle's card on its own words
 *  (to the LEFT of its flame), then the behind candle's on 'a year or two behind' (to the RIGHT), so the two
 *  never cover each other. Both are still burning in October 2022, so their date line is 'lit 2022 · still burning' */
function namedCards(f: Parameters<typeof glassReflection>[0], t: number, b: B) {
  const a = win(t, b.tilt0 + 0.1, b.tilt1 - 0.3) * (1 - win(t, b.back0 + 0.2, b.back0 + 0.7));
  const n1 = namingK(t, b.name1, b.name1Hold) * a;
  const n2 = namingK(t, b.name2, b.name2Hold) * a;
  if (n1 > 0.003) {
    const p = reflFlameOnScreen(f, candleFlameAt(chokeCandle()));
    reflNamedCard(f.c, { sx: p.x, sy: p.y, k: n1, lines: ['COMPUTE IS', 'THE CHOKEPOINT'], dates: 'lit 2022 · still burning', side: 'left' }, f.mood);
  }
  if (n2 > 0.003) {
    const p = reflFlameOnScreen(f, candleFlameAt(behindCandle()));
    reflNamedCard(f.c, { sx: p.x, sy: p.y, k: n2, lines: ['CHINA IS A YEAR', 'OR TWO BEHIND'], dates: 'lit 2022 · still burning', side: 'right' }, f.mood);
  }
}

void FENCE_N;
