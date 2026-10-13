/**
 * ch14-s07 — in the window's reflection the hands light a new candle, THE GAP IS MONTHS, NOT YEARS; three estimate
 * tags swing in; Liang's originality-and-imitation card rises over the right shore; then the camera pulls back into
 * the study to see both lit shores whole (winterBlue night outside, the reflection candleAmber; 21.25 s; in: cut,
 * matched from ch14-s06's end at the jetty).
 *
 *   reflect    (0)        matched cut: beyond the jetty's end the study window's reflection rises over the water
 *   gapcandle  'candle'   the hands (in reflection) strike a match and light the new candle beside the chokepoint candle
 *   tags/2/3   L1417 end  three estimate tags swing into the new candle's light, a second apart; on the third the
 *                         chokepoint flame lifts a little, as if fed
 *   liang      'founder'  the far lit hall on the right bank glimpsed (one generic figure); his quote card rises over
 *                         the right shore; the gap flame does not change
 *   rise       'nobody'   the camera pulls BACK into the study: the window frame comes in from the edges, the
 *                         reflection steadies in the glass, both shores and the jetty seen whole through it
 *
 * WINDOW RULE (ch14): the strait is always seen THROUGH the study window; candles, match and hands only as a
 * reflection on ONE plane (L2, ~35 %, slight ripple), in the study's candleAmber (STUDY LOCK).
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at 6 px per ring (270 px at
 * scale 1); it burns down one ring per year held and the burned wax stays above the stub as a ghost sleeve, so the
 * SLEEVE's length is the years. Here: the chokepoint candle (lit 2022) has a four-ring sleeve and burns on; the
 * one-to-three-years candle is a dark two-ring sleeve, out; the new gap candle is lit on its top ring (no sleeve yet).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { LAYERS, MOODS, defineShot, makeEnv, mixLab, quoteCard, softSprite, withAlpha } from '../../../film';
import { monotone } from '../sets/ch02-s05b-util';
import { beliefCandle, candleFlame } from '../sets/beliefCandle';
import { CAM_HOLD, CAM_OPEN, CHOKE, GAP, gapFlameScreen, windowReflection } from '../sets/ch14-s07-window';
import {
  HZ, LANTERN, SHORE, WARM, across, boardStones, clamp01, handset, handsetCords, handsetEnds, jetty, lerp, nearWater,
  paperTag, sm, straitBack, tq12, win, windowFrame,
} from '../sets/ch14-s05-strait';

const ID = 'ch14-s07';
type C = CanvasRenderingContext2D;

const CAM_BACK: Camera3 = { x: 640, y: 372, z: -170, lens: 1 };

// ------------------------------------------------------------------------------------------------ the tags
/** three tags hung in the window on threads from above its head, in a column just above and beside the gap candle
 *  (screen px; the column's right edge keeps clear of the candle as the push in the glass grows it) */
const TAGS: [string, string][] = [
  ['~6 MONTHS', 'HASSABIS (GOOGLE DEEPMIND)'],
  ['IN CHIPS: “NANOSECONDS”', 'HUANG (NVIDIA)'],
  ['OVERTAKE IN 3–5 YRS?', 'UNDER 1 IN 5 · LIN (QWEN)'],
];
const TAG_SIZE = 20;
const TAG_TOP = 84;
const TAG_PITCH = 76;
/** half the widest tag (IBM Plex Mono advance ≈ 0.6 em), for the column's centre */
const TAG_HALF = (Math.max(...TAGS.map(([a, b]) => Math.max(a.length * TAG_SIZE, b.length * TAG_SIZE * 0.9))) * 0.6 + 30) / 2;

/** the far lit hall on the right bank (L1): one larger window, one generic figure at it (Liang, never a likeness) */
const HALL = { x: 1046, y: HZ - 40 };

interface B {
  D: number;
  strike0: number;
  strikeDur: number;
  lit: number;
  tags: number[];
  liang: number;
  quote: number;
  quoteEnd: number;
  pushIn: [number, number];
  pushOut: [number, number];
  rise: number;
}
interface Scene {
  tl: Timeline;
  b: B;
  cam: (t: number) => Camera3;
  [k: string]: unknown;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const strike0 = Math.max(0, T.beat('gapcandle') - 0.36 * 3.0);
    const b: B = {
      D,
      strike0,
      strikeDur: 3.0,
      lit: strike0 + 0.6 * 3.0,
      tags: [T.beat('tags'), T.beat('tag2'), T.beat('tag3')],
      liang: T.beat('liang'),
      quote: T.word('L1420', 'founder') - 0.2,
      quoteEnd: T.word('L1418', 'nobody') - 0.5,
      // the push in the glass: from the cut to the new candle's lighting, held through the tags; back out on L1420
      pushIn: [0.25, T.word('L1417', 'months')],
      pushOut: [T.line('L1420').start - 0.3, T.word('L1420', 'gap') + 0.2],
      rise: T.beat('rise'),
    };
    const keys: [number, Camera3][] = [
      [0, CAM_OPEN],
      [3.6, CAM_HOLD],
      // the hold only breathes in depth (a lateral drift would slide the pages at the left edge in and out)
      [b.liang, { ...CAM_HOLD, z: CAM_HOLD.z + 4 }],
      [b.rise - 0.2, { ...CAM_HOLD, z: CAM_HOLD.z + 7 }],
      [D - 0.3, CAM_BACK],
      [D, { ...CAM_BACK, z: CAM_BACK.z - 4 }],
    ];
    const ch = (f: (c: Camera3) => number) => monotone(keys.map(([t, c]) => [t, f(c)]));
    const fx = ch((c) => c.x), fy = ch((c) => c.y), fz = ch((c) => c.z);
    // the pull back eases in and out over the whole last line (on ones)
    const cam = (t: number): Camera3 => {
      if (t <= b.rise - 0.2) return { x: fx(t), y: fy(t), z: fz(t), lens: 1 };
      const a = keys[3][1];
      const u = sm((t - (b.rise - 0.2)) / (D - 0.3 - (b.rise - 0.2)));
      const e = u * u * (3 - 2 * u);
      return { x: lerp(a.x, CAM_BACK.x, e), y: lerp(a.y, CAM_BACK.y, e), z: lerp(a.z, CAM_BACK.z, e), lens: 1 };
    };
    tl.hold(0, D);
    return { tl, b, cam };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const tq = tq12(t);
    const b = sc.b;
    const cam = sc.cam(t);
    f.camera(cam);
    const back = win(t, b.rise - 0.2, b.D - 0.3);
    const push = win(t, b.pushIn[0], b.pushIn[1]) * (1 - win(t, b.pushOut[0], b.pushOut[1]));

    // ------------------------------------------------------------- far: sky, both shores (equal warmth), water, fence
    straitBack(f, { key: 'night', fence: lerp(0.55, 0.3, sm(t / 4)), sunX: 640, sun: 0.55 });
    const hallK = win(t, b.liang - 0.3, b.liang + 0.8);
    f.layer('L1', (c, env) => hall(c, env, hallK, tq));
    f.fog({ yCenter: HZ + 6, height: 70, alpha: 0.18, drift: 5 });

    // ------------------------------------------------------------- the reflection in the glass: shelf, candles, hand
    const u = clamp01((tq - b.strike0) / b.strikeDur);
    const lit = win(t, b.lit - 0.05, b.lit + 0.5);
    windowReflection(f, {
      alpha: lerp(0.36, 0.62, sm(t / 1.1)),
      rise: 1 - sm(t / 1.3),
      lit,
      fed: 1 + 0.22 * win(t, b.tags[2] - 0.1, b.tags[2] + 0.7),
      strike: t >= b.strike0 && t < b.strike0 + b.strikeDur + 0.05 ? u : null,
      push,
      back,
      cam,
    });

    // ------------------------------------------------------------- mid: near ripples; the jetty, board and handset
    f.layer('L3', (c, env) => nearWater(c, env, -400, 1700, 470, 1100));
    f.fog('B');
    const ends = handsetEnds();
    f.layer('L4', (c, env) => {
      jetty(c, env, {
        // the three pages still pinned to the rail, lifted into the light (as ch14-s06 left them)
        pages: [
          { text: 'BLETCHLEY', year: '2023', u: 0.44, lift: 1 },
          { text: 'LIMA', year: '2024', u: 0.6, lift: 1 },
          { text: 'WASHINGTON', year: '2026', u: 0.76, lift: 1 },
        ],
        lantern: 1,
        onBoard: (cc, e2) => {
          boardStones(cc, e2);
          handsetCords(cc, e2, {
            ends,
            farL: across(LAYERS.L1, LAYERS.L4, cam, { x: SHORE.L.x1 - 40, y: HZ + 4 }),
            farR: across(LAYERS.L1, LAYERS.L4, cam, { x: SHORE.R.x0 + 40, y: HZ + 4 }),
            reveal: 1,
            glow: lerp(0.45, 0.12, sm(t / 3)),
            t,
          });
          handset(cc, e2, { drop: 1, plates: 0.6 });
        },
      });
    });
    f.rim({ x: 0.3, y: -1 });
    f.practical({ x: LANTERN.x, y: LANTERN.y, kind: 'lamp', seed: 1406, intensity: 0.62, radius: 34 });

    // ------------------------------------------------------------- the tags, hung in the window beside the gap candle
    const c = f.c;
    const fade = 1 - win(t, b.rise + 0.2, b.rise + 2.2);
    if (fade > 0.01) {
      c.save();
      c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
      c.globalAlpha = fade;
      const gf = gapFlameScreen(push);
      const right = gf.x - 44 - 12 * push;
      const cx = right - TAG_HALF;
      const env = { ...makeEnv({ mood: 'winterBlue', layer: 'L4', t, pxScale: f.pxScale, seed: 1417, frame: f.frame }) };
      const tagLit = 0.5 + 0.5 * lit;
      TAGS.forEach((lines, i) => {
        const uu = clamp01((tq - b.tags[i] + 0.05) / 1.25);
        if (uu <= 0) return;
        const at = { x: cx, y: TAG_TOP + i * TAG_PITCH };
        paperTag(c, { hang: { x: cx + 14, y: -40 }, at, lines, u: uu, lit: tagLit, seed: i * 3, t, size: TAG_SIZE, swing: 0.45 }, env);
      });
      // the new candle's warm light on the tags' near (lower right) side
      if (lit > 0.01) {
        c.globalCompositeOperation = 'lighter';
        const spr = softSprite(WARM, 0.12);
        c.globalAlpha = fade * 0.32 * lit;
        c.drawImage(spr, gf.x - 380, gf.y - 300, 520, 520);
      }
      c.restore();
    }

    // ------------------------------------------------------------- the study window (screen-locked), the study, type
    windowFrame(f, { back });
    if (back > 0.01) studyNear(f, back);
    c.save();
    c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
    // a soft, low plate under the quote (lighter than the kit's: the sky stays open)
    const qa = win(t, b.quote, b.quote + 0.7) * (1 - win(t, b.quoteEnd - 0.7, b.quoteEnd));
    if (qa > 0.01) {
      const g = c.createRadialGradient(934, 232, 10, 934, 232, 380);
      g.addColorStop(0, withAlpha(f.mood.ink, 0.5 * qa));
      g.addColorStop(0.6, withAlpha(f.mood.ink, 0.24 * qa));
      g.addColorStop(1, withAlpha(f.mood.ink, 0));
      c.fillStyle = g;
      c.fillRect(934 - 400, 232 - 220, 800, 440);
    }
    quoteCard(
      c,
      {
        quote: '…the real gap is the difference between originality and imitation.',
        speaker: 'Liang Wenfeng',
        source: 'July 2024 · ChinaTalk translation',
        x: 934,
        y: 214,
        width: 470,
        maxChars: 36,
        size: 26,
        at: b.quote,
        dur: b.quoteEnd - b.quote,
        fade: 0.7,
        plate: false,
      },
      { t, mood: f.mood, seed: 1420 },
    );
    c.restore();
  },
});

/** the study itself, seen as the camera pulls back from the glass (screen-locked near plane, blurred): a drape at the
 *  window's left jamb, the desk's edge along the bottom, and on it the right end of the candle shelf with the two REAL
 *  flames (the gap candle and the chokepoint) whose reflections burn in the glass (STUDY LOCK: candleAmber) */
function studyNear(f: Frame, back: number) {
  const c = f.c;
  const am = MOODS.candleAmber;
  const t = f.t;
  const k = sm(back);
  const env0 = makeEnv({ mood: 'candleAmber', layer: 'L5', t, pxScale: f.pxScale, seed: 1418, frame: f.frame });
  const ink = mixLab(am.fg, am.ink, 0.3);
  // the near study is the darkest thing in frame: the real candles are ink silhouettes, lit only at their flames
  const env: PaintEnv = { ...env0, fill: (r) => (r === 'ink' ? mixLab(am.fg, am.ink, 0.6) : env0.fill(r)) };
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  // parallax: the near study slides in from the frame's edges as the camera backs away
  const dy = (1 - k) * 300;
  const dx = (1 - k) * 260;
  c.filter = `blur(${(3.2 * f.pxScale).toFixed(2)}px)`;
  // the drape at the left jamb: heavy folds, its lamp-side edge warm
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-40 - dx, -20);
  c.lineTo(150 - dx, -20);
  c.bezierCurveTo(118 - dx, 220, 176 - dx, 430, 128 - dx, 740);
  c.lineTo(-40 - dx, 740);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(am.rim, 0.32 * k);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(150 - dx, -20);
  c.bezierCurveTo(118 - dx, 220, 176 - dx, 430, 128 - dx, 740);
  c.stroke();
  for (const fx of [40, 84]) {
    c.strokeStyle = withAlpha(am.halo, 0.12 * k);
    c.beginPath();
    c.moveTo(fx - dx, -20);
    c.bezierCurveTo(fx - 14 - dx, 260, fx + 18 - dx, 470, fx - 6 - dx, 740);
    c.stroke();
  }
  // the desk's edge and the shelf plank along the bottom
  const deskY = 668 + dy;
  c.fillStyle = ink;
  c.fillRect(-20, deskY, 1320, 80);
  c.filter = 'none';
  c.fillStyle = withAlpha(am.rim, 0.5 * k);
  c.fillRect(-20, deskY - 1, 1320, 2);
  // the two real candles at the shelf's right end (lamp side), large and soft in the foreground
  c.filter = `blur(${(2.4 * f.pxScale).toFixed(2)}px)`;
  const s = 1.15;
  const reals = [
    { x: 900, view: GAP, seed: 25 },
    { x: 1030, view: CHOKE, seed: 22 },
  ];
  for (const r of reals) beliefCandle(c, { x: r.x, y: deskY + 4, view: r.view, s, letters: 0.25, seed: r.seed, drawFlame: false }, env);
  c.filter = 'none';
  // their flames (sharp enough to read as the same two that burn in the glass) and their warm pool
  c.globalCompositeOperation = 'lighter';
  for (const r of reals) {
    const fp = candleFlame({ x: r.x, y: deskY + 4, view: r.view, s });
    const tr = 1 + 0.06 * Math.sin(t * 8.3 + r.seed) * Math.sin(t * 3.1 + r.seed);
    const g = c.createRadialGradient(fp.x, fp.y, 0, fp.x, fp.y, 120 * tr);
    g.addColorStop(0, withAlpha(am.core, 0.85 * k));
    g.addColorStop(0.12, withAlpha(am.halo, 0.3 * k));
    g.addColorStop(1, withAlpha(am.halo, 0));
    c.fillStyle = g;
    c.fillRect(fp.x - 130, fp.y - 130, 260, 260);
    c.fillStyle = withAlpha(am.core, 0.95 * k);
    c.beginPath();
    c.ellipse(fp.x, fp.y - 6, 4.2 * tr, 11 * tr, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** the far lit hall on the right bank: a long low hall front with one wider lit window and a single small generic
 *  figure standing at it (Liang; never a likeness), glimpsed as it warms a little on 'founder' */
function hall(c: C, env: PaintEnv, k: number, tq: number) {
  const m = env.mood;
  const x = HALL.x, y = HALL.y;
  if (k <= 0.005) return;
  c.save();
  c.globalAlpha *= Math.min(1, k * 1.5);
  c.fillStyle = env.fill('set');
  c.fillRect(x - 26, y - 4, 52, 34);
  c.fillRect(x - 30, y - 7, 60, 3.4);
  // the window, warmed (same WARM as every window on both shores; a little brighter while glimpsed)
  c.fillStyle = withAlpha(WARM, 0.55 + 0.4 * k);
  c.fillRect(x - 14, y + 2, 28, 12);
  c.fillStyle = env.fill('set');
  c.fillRect(x - 0.6, y + 2, 1.2, 12);
  if (k > 0.01) {
    // the figure: head, shoulders, a dark jacket, standing at the glass (on twos: the faintest breath)
    const br = 0.25 * Math.sin(tq * 1.6);
    c.fillStyle = withAlpha(mixLab(env.mood.ink, env.fill('set'), 0.2), Math.min(1, k * 1.3));
    c.beginPath();
    c.arc(x + 6, y + 5.2 + br * 0.2, 1.5, 0, Math.PI * 2);
    c.fill();
    c.fillRect(x + 4.1, y + 6.8, 3.8, 7.2);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = withAlpha(WARM, 0.12 * k);
    c.fillRect(x - 16, y + 15, 32, 22);
    c.restore();
  }
  c.restore();
  void m;
}
