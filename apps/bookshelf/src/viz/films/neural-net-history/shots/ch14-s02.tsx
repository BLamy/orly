/**
 * ch14-s02 — the fence and the two candles. A paper fence of rule pages rises across the strait (October 2022
 * export controls), Beijing's reply flies back over it, and in the window's reflection one match lights two
 * candles: COMPUTE IS THE CHOKEPOINT and CHINA IS ONE TO THREE YEARS BEHIND (dawnGold; 19.5 s; in: cut).
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
      contact: T.beat('tools') + 0.05 + 0.625,
    };
    const fx = monotone([[0, 622], [b.tilt0, 664], [b.tilt1, 650], [D, 654]]);
    const fy = monotone([[0, 394], [b.tilt0, 392], [b.tilt1, 300], [D, 296]]);
    const fl = monotone([[0, 1.0], [b.tilt0, 1.012], [b.tilt1, 1.3], [D, 1.33]]);
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
    const uStone = (tq - (b.tools + 0.05)) / 1.25;
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
        if (uStone > 0 && uStone < 1) stoneHand(c, env, { side: -1, u: uStone, target: boardPoint(STONES.l1[0], STONES.l1[1]), col: 'w', len: 34 });
      },
      l4: (c, env) => banks(c, env, t, b),
      afterL4: () => reflection(f, t, b),
    });
    windowFrame(f, {});
    quotes(f.c, f.mood, t, b);
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
  // the reply page: leaves the right delegate's hand on 'replied', arcs high over the fence, settles on the left bank
  const from = cast.delegate.anchor(oR, 'handF');
  const u = clamp01((tq - b.reply) / 1.55);
  if (u > 0) {
    const ease = sm(u);
    const x = lerp(from.x, LAND.x, ease);
    // a high arc (its peak well over the fence's top edge) and a page that reads as a page: it tumbles slowly,
    // mostly face-on, ≈ 44 px wide in flight
    const y = lerp(from.y, LAND.y, ease) - Math.sin(Math.PI * Math.min(1, u * 1.04)) * 330;
    const land = u >= 1;
    const k = land ? 0.5 : 0.5 + 1.5 * Math.sin(Math.PI * Math.min(1, u));
    sheet(c, env, x, y, land ? 0 : Math.sin(u * 5) * 0.6, land ? 0.18 : 1 - 0.45 * Math.abs(Math.sin(u * 4.5)), Math.min(2, k));
  }
}

/** a single sheet of parchment, a few typed lines; squash = its tumble (1 face on, ~0 edge on) */
function sheet(c: C, env: PaintEnv, x: number, y: number, rot: number, squash: number, k = 1) {
  const m = env.mood;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(k, k * Math.max(0.12, squash));
  c.fillStyle = withAlpha(m.rim, 0.95);
  c.fillRect(-11, -14, 22, 28);
  c.fillStyle = withAlpha(m.ink, 0.45);
  for (let k = 0; k < 6; k++) c.fillRect(-7, -9 + k * 4, 10 + (k % 3) * 2, 0.9);
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
    labelPlate(c, m, x, 140, 430, 240, 0.85 * a);
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
      const w = drawTracked(c, ln, x, 112 + lines.length * 31 + 22 + i * 25, { font: `500 18px ${FONT.sc}`, size: 18, tracking: 0.12, align: 'center' });
      if (i === 0) c.fillRect(x - w / 2 - 30, 112 + lines.length * 31 + 22 - 6, 20, 1);
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
  const a = win(t, b.tilt0 + 0.1, b.tilt1 - 0.3);
  if (a <= 0.002) return;
  const fl1 = clamp01((t - b.lit1) / 0.35);
  const fl2 = clamp01((t - b.lit2) / 0.35);
  const C1 = chokeCandle({ state: fl1 > 0 ? 'live' : 'unlit', flame: fl1 });
  const C2 = behindCandle({ state: fl2 > 0 ? 'live' : 'unlit', flame: fl2, letterGlow: win(t, b.behind - 0.15, b.behind + 0.25) * (1 - 0.5 * win(t, b.behind + 1, b.behind + 2.2)) });
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
    alpha: 0.24 * a,
    light: 0.5 * a,
    ripple: 1.1,
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
      { x: (w1.x + w2.x) / 2, y: SHELF_R.y - 160, r: 700, a: 0.3 * (fl1 + fl2) * 0.5 * a },
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
      light: 0.22 * a,
      ripple: 1.1,
      fade: { cx: 668, cy: 300, r0: 80, r1: 215 },
      draw: (c, env) => hands.draw(c, hp, env),
    });
  }
}

void FENCE_N;
