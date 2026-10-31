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
 *   chokepoint 'fence'    "The fence still stands, argued over": the far paper fence catches the light beside the
 *                         chokepoint candle's reflection, and ch14-s02's question card CAN A FENCE AROUND CHIPS HOLD?
 *                         drops in from the window's top rail on its oxblood thread; STATUS: OPEN stamps on 'stands'
 *   rise       'nobody'   the camera pulls BACK into the study: the window frame comes in from the edges, the
 *                         reflection steadies in the glass, both shores and the jetty seen whole through it
 *
 * Round 2: the new taper reads at once (fog in front of it halved, a warm streak on the water under it, its flame's
 * glow twice the other candles' radius); its horizontal named label sits beside its flame in the glass; the tags'
 * estimate and speaker lines are both at or over the 22 px cap floor.
 *
 * Review r1: the reflected columns a step darker, their lettering ≤ 0.25 and thinner still where they cross the
 * skylines; the reflected hand is ink with a candleAmber rim, the match blooms briefly on 'candle'; on tag3 the
 * chokepoint flame lifts 1.4× and settles at 1.15×; Liang's card rises 0.5 s before 'founder' and the tags dim to 0.4
 * under it; the WASHINGTON page has left the frame by ~2.5 s (whole again in the pull back); STATUS: OPEN in
 * desaturated oxblood ink; in the pull back the sill's real candles (gap, chokepoint, match, the dark stub) stand at
 * one constant offset from their reflections, same order and spacing.
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
import { FILM_H, FONT, LAYERS, MOODS, defineShot, makeEnv, mixLab, quoteCard, softSprite, textRole, toScreen, withAlpha } from '../../../film';
import { monotone } from '../sets/ch02-s05b-util';
import { beliefCandle, candleFlame } from '../sets/beliefCandle';
import { BEHIND, CAM_HOLD, CAM_OPEN, CHOKE, GAP, MATCH, SX, gapBaseScreen, gapFlameScreen, gapNamedLabel, sheetOnScreen, windowReflection } from '../sets/ch14-s07-window';
import { fenceQuestionCard } from '../sets/ch14-s02-question';
import {
  HZ, LANTERN, SHORE, WARM, across, boardStones, clamp01, handset, handsetCords, handsetEnds, jetty, lerp, nearWater,
  pageEdgeAlpha, paperTag, railLampPoint, sm, straitBack, tq12, win, windowFrame,
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
/** both tag lines at or over the 22 px cap floor (line 2 is 0.96 of line 1; screen-locked, 1.5 px per stage px) */
const TAG_SIZE = 23;
const TAG_TOP = 82;
const TAG_PITCH = 86;
/** half the widest tag (IBM Plex Mono advance ≈ 0.6 em), for the column's centre */
const TAG_HALF = (Math.max(...TAGS.map(([a, b]) => Math.max(a.length * TAG_SIZE, b.length * TAG_SIZE * 0.96))) * 0.6 + 30) / 2;

/** the far lit hall on the right bank (L1): one larger window, one generic figure at it (Liang, never a likeness) */
const HALL = { x: 1046, y: HZ - 40 };

interface B {
  D: number;
  strike0: number;
  /** the hand has left the glass */
  strikeEnd: number;
  /** 'newer': the match catches (a brief bloom) */
  candle: number;
  /** 'founder': Liang's card owns the frame, the tags dim */
  founder: number;
  lit: number;
  tags: number[];
  liang: number;
  quote: number;
  quoteEnd: number;
  pushIn: [number, number];
  pushOut: [number, number];
  /** L1418 'fence' / 'stands': the far fence lit, the question card in, OPEN stamped */
  fence: number;
  stands: number;
  stamp: number;
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
    // round 3 (art): the new candle burns ON 'A newer candle', not 0.75 s after it: the hand comes in with the cut,
    // the match catches on 'newer', and its flame is on the wick by 'candle' (the beat), so the taper reads at once
    const catchAt = T.word('L1417', 'newer') - 0.05;
    const litAt = T.beat('gapcandle') - 0.08;
    const b: B = {
      D,
      strike0: 0.08,
      strikeEnd: litAt + 2.0,
      candle: catchAt,
      founder: T.word('L1420', 'founder'),
      lit: litAt,
      tags: [T.beat('tags'), T.beat('tag2'), T.beat('tag3')],
      liang: T.beat('liang'),
      // review r1: its first line visibly rising ~0.2 s before 'founder' (the card's lines start 0.25 s after `at`)
      quote: T.word('L1420', 'founder') - 0.5,
      // the quote is held through its line and clears before 'The fence still stands' (the question card's place)
      quoteEnd: T.word('L1418', 'fence') - 0.42,
      // the push in the glass: from the cut to the new candle's lighting, held through the tags; back out on L1420
      pushIn: [0.25, T.word('L1417', 'months')],
      pushOut: [T.line('L1420').start - 0.3, T.word('L1420', 'gap') + 0.2],
      fence: T.beat('chokepoint'),
      stands: T.word('L1418', 'stands'),
      // the card has settled by then (it drops from 'fence' - 0.38 over 0.9 s, inked by 'fence')
      stamp: Math.max(T.word('L1418', 'stands') - 0.05, T.beat('chokepoint') + 0.62),
      rise: T.beat('rise'),
    };
    const keys: [number, Camera3][] = [
      [0, CAM_OPEN],
      // the pages slide out past the left edge by ~2.5 s (clean edges), the hold reached by 3.2 s
      [3.2, CAM_HOLD],
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
    // 'The fence still stands': the far rule fence comes up and its page tops catch the light, held, then settles
    const fenceUp = win(t, b.fence - 0.35, b.fence + 0.5) * (1 - 0.5 * win(t, b.fence + 3.2, b.fence + 4.6));
    const fenceHi = win(t, b.fence - 0.2, b.fence + 0.4) * (1 - win(t, b.fence + 2.6, b.fence + 3.8));
    straitBack(f, { key: 'night', fence: lerp(0.55, 0.3, sm(t / 4)) + 0.6 * fenceUp, fenceHi, sunX: 640, sun: 0.55 });
    const hallK = win(t, b.liang - 0.3, b.liang + 0.8);
    f.layer('L1', (c, env) => hall(c, env, hallK, tq));
    // round 3 (art): the horizon fog sits in front of the new taper's lower half: halved (0.18 → 0.09)
    f.fog({ yCenter: HZ + 6, height: 70, alpha: 0.09, drift: 5 });

    // ------------------------------------------------------------- the reflection in the glass: shelf, candles, hand
    const u = strikeU(tq, b);
    // the wick takes the match's flame on 'candle' and is full within ~0.3 s
    const lit = win(t, b.lit - 0.04, b.lit + 0.3);
    // the far skylines' screen band: the reflected columns thin to about half there, so both cities stay whole
    const skyBand = { y0: toScreen(LAYERS.L1, cam, 0, HZ - 128).y, y1: toScreen(LAYERS.L1, cam, 0, HZ + 4).y, k: 0.4 };
    windowReflection(f, {
      alpha: lerp(0.36, 0.44, sm(t / 1.1)),
      rise: 1 - sm(t / 1.3),
      lit,
      // tag3: the chokepoint flame lifts, as if fed: 1.4× with a warmer halo over 0.4 s, then settles at ~1.15×
      fed: 1 + 0.4 * win(t, b.tags[2] - 0.05, b.tags[2] + 0.35) - 0.25 * win(t, b.tags[2] + 0.6, b.tags[2] + 1.8),
      strike: u,
      flare: win(t, b.candle - 0.02, b.candle + 0.06) * (1 - win(t, b.candle + 0.1, b.candle + 0.45)),
      skyBand,
      push,
      back,
      cam,
    });

    // ------------------------------------------------------------- mid: near ripples; the jetty, board and handset
    f.layer('L3', (c, env) => nearWater(c, env, -400, 1700, 470, 1100));
    // the new taper's warm streak on the water under it (its light on the strait, rippling), then fog B at HALF its
    // default strength, so nothing veils the new candle
    warmStreak(f, gapBaseScreen({ push, back, rise: 1 - sm(t / 1.3) }), lit);
    f.fog({ yCenter: 0.7 * FILM_H, height: 0.22 * FILM_H, alpha: 0.06, drift: 10 });
    const ends = handsetEnds();
    f.layer('L4', (c, env) => {
      jetty(c, env, {
        // the three pages still pinned to the rail, lifted into the light (as ch14-s06 left them); read there, so
        // here they are set dressing at the frame's edge (texture)
        pages: [
          { text: 'BLETCHLEY', year: '2023', u: 0.44 },
          { text: 'LIMA', year: '2024', u: 0.6 },
          { text: 'WASHINGTON', year: '2026', u: 0.76 },
        ].map((p) => ({ ...p, lift: 1, role: 'texture' as const, alpha: pageEdgeAlpha(p.u, cam) })),
        lantern: 1,
        railLamp: 1,
        onBoard: (cc, e2) => {
          boardStones(cc, e2);
          handsetCords(cc, e2, {
            ends,
            // out to each city (where ch14-s05's threads landed), so the pulse is seen to travel to both shores
            farL: across(LAYERS.L1, LAYERS.L4, cam, { x: SHORE.L.cx + 40, y: HZ + 2 }),
            farR: across(LAYERS.L1, LAYERS.L4, cam, { x: SHORE.R.cx - 40, y: HZ + 2 }),
            reveal: 1,
            // as ch14-s06 left them: the channel's even light and its landings, settling
            glow: lerp(0.6, 0.35, sm(t / 3)),
            land: lerp(0.55, 0.3, sm(t / 3)),
            t,
          });
          handset(cc, e2, { drop: 1, plates: 0.6 });
        },
      });
    });
    f.rim({ x: 0.3, y: -1 });
    f.practical({ x: LANTERN.x, y: LANTERN.y, kind: 'lamp', seed: 1406, intensity: 0.62, radius: 34 });
    const rl = railLampPoint();
    f.practical({ x: rl.x, y: rl.y, kind: 'lamp', seed: 1407, intensity: 0.55, radius: 26 });

    // ------------------------------------------------------------- the tags, hung in the window beside the gap candle
    const c = f.c;
    // the tags dim to 0.4 on 'founder' (Liang's card owns the frame), stay back while the fence and its question card
    // are the subject, and clear on the pull back
    const fade = (1 - 0.6 * win(t, b.founder - 0.35, b.founder + 0.25)) * (1 - win(t, b.rise + 0.2, b.rise + 2.2));
    if (fade > 0.01) {
      c.save();
      c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
      c.globalAlpha = fade;
      const gf = gapFlameScreen(push);
      const right = gf.x - 24 - 12 * push;
      const cx = right - TAG_HALF;
      const env = { ...makeEnv({ mood: 'winterBlue', layer: 'L4', t, pxScale: f.pxScale, seed: 1417, frame: f.frame }) };
      const tagLit = 0.5 + 0.5 * lit;
      TAGS.forEach((lines, i) => {
        const uu = clamp01((tq - b.tags[i] + 0.05) / 1.25);
        if (uu <= 0) return;
        const at = { x: cx, y: TAG_TOP + i * TAG_PITCH };
        paperTag(c, { hang: { x: cx + 14, y: -40 }, at, lines, u: uu, lit: tagLit, seed: i * 3, t, size: TAG_SIZE, swing: 0.28 }, env);
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
    if (back > 0.01) studyNear(f, back, push);
    // the NAMING RULE label for the new candle, beside its flame in the glass, from the moment it is lit
    const named = win(t, b.lit - 0.15, b.lit + 0.25) * (1 - win(t, b.lit + 2.6, b.lit + 3.1));
    gapNamedLabel(f, { push, back, rise: 1 - sm(t / 1.3), k: named });
    // ch14-s02's question card, paid off: it drops from the window's top rail on 'The fence', OPEN stamps on 'stands';
    // it hangs in the window, so the pull back carries it with the frame (and it stays to the cut)
    // round 3: inked ON 'fence' (13.75): the short drop starts 0.38 s before the word and card + question fade in
    // together (fenceQuestionCard), so the card is whole and legible by 'fence' with no blank strip before it
    const drop = clamp01((t - (b.fence - 0.38)) / 0.9);
    if (drop > 0) {
      c.save();
      c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
      const wk = lerp(1, 0.74, sm(back));
      const wcy = lerp(360, 340, sm(back));
      c.translate(640, wcy);
      c.scale(wk, wk);
      c.translate(-640, -wcy);
      const cenv = makeEnv({ mood: 'winterBlue', layer: 'L4', t, pxScale: f.pxScale * wk, seed: 1418, frame: f.frame });
      const CARD = { x: 930, y: 200, k: 1.7 };
      const sway = 0.035 * Math.sin(tq * 0.9) * (1 - 0.6 * sm(back));
      fenceQuestionCard(c, cenv, {
        ...CARD,
        drop,
        sway,
        stamp: 0,
        light: 0.55 + 0.25 * sm((t - b.fence) / 0.8),
      });
      // STATUS: OPEN, stamped in the card's clear lower band (under the question, never over it) on 'stands'
      const st = win(t, b.stamp, b.stamp + 0.12);
      if (st > 0.001) openStamp(c, CARD, sway, st);
      c.restore();
    }
    c.save();
    c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
    // a soft, low plate under the quote (lighter than the kit's: the sky stays open)
    const qa = win(t, b.quote, b.quote + 0.7) * (1 - win(t, b.quoteEnd - 0.7, b.quoteEnd));
    if (qa > 0.01) {
      // reaching down over the attribution and date lines (they read on it, not on the open sky)
      c.save();
      c.translate(934, 236);
      c.scale(1, 0.62);
      const g = c.createRadialGradient(0, 0, 10, 0, 0, 400);
      g.addColorStop(0, withAlpha(f.mood.ink, 0.62 * qa));
      g.addColorStop(0.55, withAlpha(f.mood.ink, 0.42 * qa));
      g.addColorStop(1, withAlpha(f.mood.ink, 0));
      c.fillStyle = g;
      c.fillRect(-410, -410, 820, 820);
      c.restore();
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

/** the hand's strikeLight progress (null when out of the glass), on twos: in with the cut (approach + strike → 0.38,
 *  the match catching on 'newer'), carried to the wick (→ 0.6 on 'candle'), held while the wick takes it (→ 0.8),
 *  then withdrawn */
function strikeU(tq: number, b: B): number | null {
  if (tq < b.strike0 || tq >= b.strikeEnd) return null;
  const seg = (t0: number, t1: number, u0: number, u1: number) => u0 + (u1 - u0) * clamp01((tq - t0) / Math.max(0.05, t1 - t0));
  if (tq < b.candle + 0.02) return seg(b.strike0, b.candle + 0.02, 0, 0.38);
  if (tq < b.lit) return seg(b.candle + 0.02, b.lit, 0.38, 0.6);
  if (tq < b.lit + 0.9) return seg(b.lit, b.lit + 0.9, 0.6, 0.8);
  return seg(b.lit + 0.9, b.strikeEnd, 0.8, 1);
}

const OXBLOOD = '#5e2f2b';

/** STATUS: OPEN on the fence question card (ch14-s02-question geometry: 170 × 112 board units at k; the typed
 *  question fills the upper two thirds, so the stamp sits in the band below it), with a small press-in */
function openStamp(c: C, card: { x: number; y: number; k: number }, sway: number, u: number) {
  const { x, y, k } = card;
  const h = 112 * k, w = 170 * k;
  const pinY = y - h / 2 + 7 * k;
  const cy = y + h / 2 - 15.2 * k;
  c.save();
  c.translate(x, pinY);
  c.rotate(sway);
  c.translate(-x, -pinY);
  c.translate(x, cy);
  c.rotate(-0.035);
  const press = 1 + 0.25 * (1 - u);
  c.scale(press, press);
  // review r1: a desaturated oxblood ink at ~70 %, so the candles stay the only warm accent
  c.globalAlpha *= u * 0.7;
  c.strokeStyle = OXBLOOD;
  c.fillStyle = OXBLOOD;
  c.lineWidth = 2.2 * k;
  const bw = w * 0.64, bh = 16.4 * k;
  c.strokeRect(-bw / 2, -bh / 2, bw, bh);
  textRole(c, 'subject', () => {
    c.font = `400 ${(13.6 * k).toFixed(1)}px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('STATUS: OPEN', 0, 1);
  });
  c.restore();
}

/** the new candle's light on the strait under it: a column of short warm glints, wider and fainter with distance down
 *  the water, rippling (screen-locked over the water, additive; candleAmber, as the reflection is) */
function warmStreak(f: Frame, base: { x: number; y: number; q: number }, lit: number) {
  if (lit <= 0.01) return;
  const c = f.c;
  const t = f.t;
  const am = MOODS.candleAmber;
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  c.globalCompositeOperation = 'lighter';
  const col = mixLab(am.halo, am.core, 0.35);
  const y0 = base.y + 6;
  const len = Math.min(720 - y0, 150 + 40 * base.q);
  for (let i = 0; i < 26; i++) {
    const v = i / 25;
    const y = y0 + len * v * v * 0.9 + len * 0.1 * v;
    const w = (10 + 46 * v) * (0.7 + 0.3 * Math.sin(t * 1.7 + i * 2.1));
    const x = base.x + 5 * Math.sin(t * 0.9 + i * 0.8) * (0.4 + v);
    c.fillStyle = withAlpha(col, 0.5 * lit * (1 - 0.6 * v) * (0.65 + 0.35 * Math.sin(t * 2.3 + i * 1.3)));
    c.fillRect(x - w / 2, y, w, 1.6 + 1.6 * v);
  }
  const g = c.createRadialGradient(base.x, y0 + 30, 2, base.x, y0 + 30, 90);
  g.addColorStop(0, withAlpha(col, 0.3 * lit));
  g.addColorStop(1, withAlpha(col, 0));
  c.save();
  c.translate(base.x, y0 + 30);
  c.scale(1, 0.4);
  c.translate(-base.x, -(y0 + 30));
  c.fillStyle = g;
  c.fillRect(base.x - 100, y0 - 70, 200, 200);
  c.restore();
  c.restore();
}

/** the study itself, seen as the camera pulls back from the glass (screen-locked near plane, blurred): a drape at the
 *  window's left jamb, the desk's edge along the bottom, and on it the right end of the candle shelf with the two REAL
 *  flames (the gap candle and the chokepoint) whose reflections burn in the glass (STUDY LOCK: candleAmber) */
function studyNear(f: Frame, back: number, push: number) {
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
  // the REAL candles at the shelf's right end (lamp side), large and soft in the foreground. Review r1: the same four
  // as the glass shows, in the same order and at the same spacing (gap, chokepoint, the match lying flat, the dark
  // one-to-three-years stub), each at ONE constant offset from its reflection, so the ghosts over the water are these
  const s = 1.15;
  const so = sheetOnScreen({ push, back, rise: 0 });
  const OFFSET = 372;
  const rx = (sx: number) => so.x + sx * so.q + OFFSET;
  const reals = [
    { x: rx(SX.gap), view: GAP, seed: 25 },
    { x: rx(SX.choke), view: CHOKE, seed: 22 },
    { x: rx(SX.match), view: MATCH, seed: 24 },
    { x: rx(SX.behind), view: BEHIND, seed: 23 },
  ];
  c.filter = `blur(${(2.4 * f.pxScale).toFixed(2)}px)`;
  for (const r of reals) beliefCandle(c, { x: r.x, y: deskY + 4, view: r.view, s, letters: 0.25, seed: r.seed, drawFlame: false }, env);
  c.filter = 'none';
  // their flames (sharp enough to read as the same two that burn in the glass) and their warm pool
  c.globalCompositeOperation = 'lighter';
  for (const r of reals.slice(0, 2)) {
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
