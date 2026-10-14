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
 * Round 4 (critic): water and skylines ~15 % darker (the gap candle's streak the one warm light below the horizon);
 * LIMA kept out of the opening and WASHINGTON faded by 1.5 s (both back, clear of the mullion, in the pull back); the
 * gap label breaks 'THE GAP IS MONTHS, / NOT YEARS'; the hand is an ink silhouette with a candleAmber rim (reflHand)
 * and the match blooms 0.2 s; the tags hang 30 px further left and clear by 'fence'; on tag3 the chokepoint sleeve's
 * rings show (≈ 0.5, 1 s); Liang's far hall is a 60 × 40 lit window with an ink figure in it (7.3-12.9 s); on 'fence'
 * the far fence pages brighten to ≈ 0.8 under a warm edge sweep (left → right, 0.6 s); the question card is ~25 %
 * smaller; STATUS: OPEN inks at 0.85 and stamps ON 'stands' with a 2-frame pop.
 * Round 5 (critic): ONE SHELF, ONE PLANE: the gap taper, the chokepoint candle (its four-ring sleeve scored with an
 * amber edge, as in ch14-s04b), the laid match and the dark two-ring stub are painted together by shelfOverlay as one
 * source-over plane at one alpha (~0.72, eased up from the matched cut's ghost), so the comparison the narration makes
 * reads; the new taper is a candle of the same kind: the 2022 candles' width, scored with 45 rings (6 px pitch, 1 px
 * at ~12 % darker wax), its flame on the top ring, its candleAmber rim the full height at ~80 %; behind Liang's quote
 * the columns above the plank fade to 10 % inside the quote's box.
 * WINDOW RULE (ch14): the strait is always seen THROUGH the study window; candles, match and hands only as a
 * reflection on ONE plane (L2, ~35 %, slight ripple), in the study's candleAmber (STUDY LOCK).
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at 6 px per ring (270 px at
 * scale 1); it burns down one ring per year held and the burned wax stays above the stub as a ghost sleeve, so the
 * SLEEVE's length is the years. Here: the chokepoint candle (lit 2022) has a four-ring sleeve and burns on; the
 * year-or-two-behind candle is a dark two-ring sleeve, out; the new gap candle is lit on its top ring (no sleeve yet).
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { FILM_H, FONT, LAYERS, MOODS, cardProbe, defineShot, hash1, makeEnv, mixLab, quoteCard, softSprite, textRole, textSwapOut, toScreen, withAlpha } from '../../../film';
import type { CandleView } from '../sets/studyState';
import { makeCanvas } from '../../../film/silhouette/atmosphere';
import { monotone } from '../sets/ch02-s05b-util';
import { beliefCandle, candleFlame } from '../sets/beliefCandle';
import { BEHIND, CAM_HOLD, CAM_OPEN, CHOKE, GAP, GAP_WAX, MATCH, SH, SX, gapBaseScreen, gapFlameScreen, gapNamedLabel, sheetOnScreen, strikePose, windowReflection } from '../sets/ch14-s07-window';
import { inkHand } from '../sets/ch14-s02-inkhand';
import { HAND_LEN } from '../sets/narratorHands';
import { fenceQuestionCard } from '../sets/ch14-s02-question';
import {
  FENCE, HZ, LANTERN, SHORE, WARM, across, boardStones, clamp01, handset, handsetCords, handsetEnds, jetty, lerp, nearWater,
  pageEdgeAlpha, pageScreenRect, paperTag, railLampPoint, sm, straitBack, tq12, win, windowFrame,
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
/** sharp planes at the far shores' depth: the night's darkening (multiply) and the fence's light on 'fence' */
const FAR: LayerSpec = { ...LAYERS.L1, id: 'ch14s07Far', blur: 0 };
const FENCE_LIT: LayerSpec = { ...LAYERS.L1, id: 'ch14s07Fence', blur: 0.8 };

interface B {
  D: number;
  strike0: number;
  /** the hand has left the glass */
  strikeEnd: number;
  /** 'newer': the match catches (a brief bloom) */
  candle: number;
  /** reviser r1: the word 'candle' (1.05): the taper's wax is solid by then; its label inks just after */
  candleWord: number;
  /** 'founder': Liang's card owns the frame, the tags dim */
  founder: number;
  lit: number;
  tags: number[];
  liang: number;
  quote: number;
  quoteEnd: number;
  pushIn: [number, number];
  /** round 5: ONE continuous pull back (ease.move, 1.0 s) from the gap-candle close to the wide, after the tags clear */
  pushOut: [number, number];
  /** round 5: the tags' textSwapOut starts here and is complete before 7.2 (before the pull back and the quote) */
  tagsOut: number;
  /** reviser r1: the slow push over the wide (8.3 → 13.5), held to the pull back */
  holdPush: [number, number];
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
    // the match catches on 'A', the wick takes it on 'newer', and the flame is full on 'candle' (the beat), so the
    // taper reads at once
    const catchAt = T.word('L1417', 'A');
    const litAt = Math.min(T.wordEnd('L1417', 'newer'), T.beat('gapcandle') - 0.2);
    const b: B = {
      D,
      strike0: 0.08,
      strikeEnd: litAt + 2.0,
      candle: catchAt,
      candleWord: T.word('L1417', 'candle'),
      founder: T.word('L1420', 'founder'),
      lit: litAt,
      tags: [T.beat('tags'), T.beat('tag2'), T.beat('tag3')],
      liang: T.beat('liang'),
      // round 5 (story + art): the quote fades in only after the tags have cleared and the pull back is under way
      // (its first line rises ~0.3 s after 'founder', its plate full as the shelf reaches the wide), no double exposure
      quote: T.word('L1420', 'founder') + 0.06,
      // the quote is held through its line and clears before 'The fence still stands' (the question card's place)
      quoteEnd: T.word('L1418', 'fence') - 0.42,
      // the push in the glass: from the cut to the new candle's lighting, held through the tags; back out on L1420
      pushIn: [0.25, T.word('L1417', 'months')],
      // round 5: one continuous pull back on a single opaque shelf plane, 1.0 s, eased with ease.move (no dissolve
      // between two framings): it starts as the tags finish clearing and lands on the wide by ~8.2
      pushOut: [T.line('L1420').start + 0.25, T.line('L1420').start + 1.25],
      // the tags' swap-out (≈ 0.43 s) ends ~7.08, before 7.2
      tagsOut: T.line('L1420').start - 0.26,
      holdPush: [8.3, 13.5],
      fence: T.beat('chokepoint'),
      stands: T.word('L1418', 'stands'),
      // the card has settled by then (it drops from 'fence' - 0.38 over 0.9 s, inked by 'fence')
      // round 4: STATUS: OPEN strikes ON the clock's named beat 'stamp' (= T.word(L1418,'stands'), 14.33), which the
      // score's fx-stamp-fence foley anchors to; move both together or neither
      stamp: T.beat('stamp'),
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
    // round 5: the pull back is one ease.move over pushOut (1.0 s): a single continuous camera move, no dissolve
    // (the sheet's placement smoothsteps `push` again, so the pull is fed through the inverse smoothstep: the framing
    // itself then follows ease.move exactly, an even dolly with no whip in its middle)
    const pull = ease.move(clamp01((t - b.pushOut[0]) / (b.pushOut[1] - b.pushOut[0])));
    const push = win(t, b.pushIn[0], b.pushIn[1]) * invSm(1 - pull);

    // ------------------------------------------------------------- far: sky, both shores (equal warmth), water, fence
    // 'The fence still stands': the far rule fence comes up and its page tops catch the light, held, then settles
    const fenceUp = win(t, b.fence - 0.35, b.fence + 0.5) * (1 - 0.5 * win(t, b.fence + 3.2, b.fence + 4.6));
    const fenceHi = win(t, b.fence - 0.2, b.fence + 0.4) * (1 - win(t, b.fence + 2.6, b.fence + 3.8));
    straitBack(f, { key: 'night', fence: lerp(0.55, 0.3, sm(t / 4)) + 0.6 * fenceUp, fenceHi, sunX: 640, sun: 0.55 });
    // round 4: the water and both skylines ~15 % darker (multiply), the sky's glow above them kept
    f.layer(FAR, (c) => {
      c.save();
      c.globalCompositeOperation = 'multiply';
      const g = c.createLinearGradient(0, HZ - 170, 0, HZ - 110);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(1, '#d6d6d6');
      c.fillStyle = g;
      c.fillRect(-900, HZ - 170, 3100, 1400);
      c.restore();
    });
    // 'The fence still stands': its pages brighten to ≈ 0.8 and a warm edge sweeps them left → right over 0.6 s
    const fenceLit = win(t, b.fence - 0.1, b.fence + 0.3) * (1 - 0.6 * win(t, b.fence + 3.4, b.fence + 4.8));
    if (fenceLit > 0.01) f.layer(FENCE_LIT, (c, env) => fenceLight(c, env, fenceLit, t - (b.fence - 0.05)));
    // Liang's far hall: from just before 'founder' to the end of his line
    const hallK = win(t, b.liang - 0.24, b.liang + 0.5) * (1 - win(t, 12.9, 13.5));
    f.layer('L1', (c, env) => hall(c, env, hallK, tq));
    // round 3 (art): the horizon fog sits in front of the new taper's lower half: halved (0.18 → 0.09)
    f.fog({ yCenter: HZ + 6, height: 70, alpha: 0.09, drift: 5 });

    // ------------------------------------------------------------- the reflection in the glass: shelf, candles, hand
    const u = strikeU(tq, b);
    // the wick takes the match's flame on 'candle' and is full within ~0.3 s
    const lit = win(t, b.lit - 0.04, b.lit + 0.2);
    // the far skylines' screen band: the reflected columns thin to about half there, so both cities stay whole
    const skyBand = { y0: toScreen(LAYERS.L1, cam, 0, HZ - 128).y, y1: toScreen(LAYERS.L1, cam, 0, HZ + 4).y, k: 0.4 };
    windowReflection(f, {
      alpha: lerp(0.36, 0.44, sm(t / 1.1)),
      rise: 1 - sm(t / 1.3),
      lit,
      // tag3: the chokepoint flame lifts, as if fed: 1.4× with a warmer halo over 0.4 s, then settles at ~1.15×
      fed: 1 + 0.4 * win(t, b.tags[2] - 0.05, b.tags[2] + 0.35) - 0.25 * win(t, b.tags[2] + 0.6, b.tags[2] + 1.8),
      strike: u,
      // round 4: a 0.2 s bloom as the match catches
      flare: win(t, b.candle - 0.02, b.candle + 0.04) * (1 - win(t, b.candle + 0.08, b.candle + 0.2)),
      skyBand,
      push,
      back,
      cam,
      handOverlay: true,
      ringsK: win(t, b.tags[2] - 0.1, b.tags[2] + 0.15) * (1 - win(t, b.tags[2] + 0.9, b.tags[2] + 1.3)),
      // round 4: the new taper in warm wax (#e3cfa2) with a 1.5 px candleAmber rim, its halo 20 % darker
      warmGap: true,
      // round 5: the candles are painted by shelfOverlay (one plane, one alpha), not in the screen-blended sheet
      overlay: true,
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
        // round 4: LIMA (cropped at the opening's edge) stays out until the pull back; WASHINGTON fades by 1.5 s; both
        // return in the pull back, WASHINGTON slid along the rail past the window's centre mullion (sliding it left put
        // it under LIMA), so no mullion crosses its text
        pages: [
          { text: 'BLETCHLEY', year: '2023', u: 0.44, k: 1 },
          { text: 'LIMA', year: '2024', u: 0.6, k: sm(back * 2.5) },
          // reviser r1 (critic, ghost paper): paper and lettering fade TOGETHER (one page alpha) and are both at 0 by
          // 1.2 s (washingtonK; probed for the card audit below), so no blank pale page is left in the corner
          { text: 'WASHINGTON', year: '2026', u: back > 0.001 ? 0.84 : 0.76, k: back > 0.001 ? sm(back * 2.5) : washingtonK(t) },
        ].map(({ k, ...p }) => ({ ...p, lift: 1, role: 'texture' as const, alpha: k * pageEdgeAlpha(p.u, cam) })),
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
    // reviser r1: the WASHINGTON page reported to the card audit (paper and ink share one alpha, so they leave together)
    if (back <= 0.001) {
      const pa = washingtonK(t) * pageEdgeAlpha(0.76, cam);
      const r = pageScreenRect(0.76, cam);
      f.c.save();
      f.c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
      cardProbe(f.c, 'washington-page', r.x0, r.y0, r.x1 - r.x0, r.y1 - r.y0, pa, pa);
      f.c.restore();
    }
    f.rim({ x: 0.3, y: -1 });
    // round 4: the jetty's lamps a step down, so the gap candle's streak is the warm light below the horizon
    f.practical({ x: LANTERN.x, y: LANTERN.y, kind: 'lamp', seed: 1406, intensity: 0.42, radius: 30 });
    const rl = railLampPoint();
    f.practical({ x: rl.x, y: rl.y, kind: 'lamp', seed: 1407, intensity: 0.36, radius: 22 });
    // round 4: the new taper's warm wax on the glass plane, in front of the world beyond it (so no jetty post or lamp
    // crosses it), then the hand that lit it over the taper
    // round 5: the whole shelf end (gap, chokepoint, match, behind) as ONE opaque plane at one alpha, eased up from the
    // matched cut's ghost; nothing fades out of it under Liang's quote (the quote card sits clear of the columns at
    // the wide), so the pull back reads as one move, never a dissolve
    shelfOverlay(f, {
      push,
      back,
      rise: 1 - sm(t / 1.3),
      lit,
      fed: 1 + 0.4 * win(t, b.tags[2] - 0.05, b.tags[2] + 0.35) - 0.25 * win(t, b.tags[2] + 0.6, b.tags[2] + 1.8),
      ringsK: win(t, b.tags[2] - 0.1, b.tags[2] + 0.15) * (1 - win(t, b.tags[2] + 0.9, b.tags[2] + 1.3)),
      // reviser r1 (critic, the lighting beat): the shelf plane reaches its full alpha by 0.95 s, so the new taper's
      // wax is solid (not a pale ghost) on 'candle' (1.05), before its label inks
      alpha: lerp(0.18, OVERLAY_ALPHA, sm(t / 0.95)) * (1 - 0.35 * sm(back)),
      // reviser r1 (critic, continuity): the chokepoint's three dissent tags (ch14-s04b), small and dim, from 13.5 s
      dissent: win(t, 13.5, 14.3),
      quote: 0,
    });
    // reviser r1 (critic): the hand's sleeve is one smooth tapered shape (no stepped cuff edges), rimmed 2.6 px
    reflHandSmooth(f, { strike: u, push, back, rise: 1 - sm(t / 1.3), alpha: 0.46 });

    // ------------------------------------------------------------- the tags, hung in the window beside the gap candle
    const c = f.c;
    // the tags dim to 0.4 on 'founder' (Liang's card owns the frame), stay back while the fence and its question card
    // are the subject, and clear on the pull back
    // round 4 (finishing note): no ghosted tags behind Liang's quote. Round 5: their textSwapOut runs in place (no
    // slide, so no tag is cropped at the frame's edge) and is complete before 7.2, before the pull back and the quote
    const fade = textSwapOut(t, b.tagsOut, 0.7);
    const slide = 0;
    if (fade > 0.01) {
      c.save();
      c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
      c.globalAlpha = fade;
      const gf = gapFlameScreen(push);
      const right = gf.x - 24 - 12 * push;
      const cx = right - TAG_HALF - 30 + slide;
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
    // reviser r1 (critic, the lighting beat): the wax is solid first; the label inks from 1.15 s (after 'candle')
    const named = win(t, b.candleWord + 0.1, b.candleWord + 0.4) * (1 - win(t, b.lit + 2.6, b.lit + 3.1));
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
      // round 4: ~25 % smaller (still over the 22 px cap floor while it is the subject)
      const CARD = { x: 930, y: 190, k: 1.28 };
      const sway = 0.035 * Math.sin(tq * 0.9) * (1 - 0.6 * sm(back));
      fenceQuestionCard(c, cenv, {
        ...CARD,
        drop,
        sway,
        stamp: 0,
        light: 0.55 + 0.25 * sm((t - b.fence) / 0.8),
      });
      // STATUS: OPEN, stamped in the card's clear lower band (under the question, never over it) on 'stands'
      if (t >= b.stamp - 0.001) openStamp(c, CARD, sway, t - b.stamp);
      c.restore();
    }
    c.save();
    c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
    // a soft, low plate under the quote (lighter than the kit's: the sky stays open)
    const qa = win(t, b.quote, b.quote + 0.7) * (1 - win(t, b.quoteEnd - 0.7, b.quoteEnd));
    if (qa > 0.01) {
      // reaching down over the attribution and date lines (they read on it, not on the open sky)
      c.save();
      c.translate(950, 236);
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
        x: 950,
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
    // reviser r1 (critic, sync/camera): the wide is no longer locked off for 10.5 s: a slow ~3 % push (ease.move,
    // 8.3 → 13.5) toward the candles and the quote, held through the fence and the stamp, then given back under the
    // pull back on 'nobody' (its counter-move). The whole composed frame is pushed (glass, window and type alike)
    const holdPush = ease.move(clamp01((t - b.holdPush[0]) / (b.holdPush[1] - b.holdPush[0]))) * (1 - back);
    if (holdPush > 0.001) pushFrame(f, 1 + 0.03 * holdPush, HOLD_PIVOT);
  },
});

/** reviser r1: where the hold's push heads (stage px): between the candles and Liang's quote */
const HOLD_PIVOT = { x: 740, y: 300 };
let pushCv: HTMLCanvasElement | null = null;
/** scale the composed frame by z about a stage point (a slow push; z ≥ 1, so the frame stays covered) */
function pushFrame(f: Frame, z: number, p: { x: number; y: number }) {
  const c = f.c;
  const w = c.canvas.width, h = c.canvas.height;
  if (!pushCv || pushCv.width !== w || pushCv.height !== h) pushCv = makeCanvas(w, h);
  const pc = pushCv.getContext('2d') as CanvasRenderingContext2D;
  pc.setTransform(1, 0, 0, 1, 0, 0);
  pc.globalAlpha = 1;
  pc.globalCompositeOperation = 'copy';
  pc.drawImage(c.canvas, 0, 0);
  const px = p.x * f.pxScale, py = p.y * f.pxScale;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'copy';
  c.filter = 'none';
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.drawImage(pushCv, px * (1 - z), py * (1 - z), w * z, h * z);
  c.restore();
}

/** reviser r1 (critic: 'a crude stair-stepped block'): the hand in the glass as ch14-s07-window's reflHand drew it (an
 *  ink silhouette over a candleAmber rim copy, inkHand), with two changes: its rim is 2.6 px at 1080p (the cast rule's
 *  2.25-3 px) at every push, and its sleeve is ONE smooth tapered shape laid over the kit's stepped tweed/shirt cuff
 *  edges, rimmed on its lit side and turned back at a cuff line, a pale shirt-cuff band at the wrist; the forearm then
 *  falls away behind the wrist as before */
let handCv7: HTMLCanvasElement | null = null;
function reflHandSmooth(f: Frame, o: { strike: number | null; push?: number; back?: number; rise?: number; alpha: number }) {
  const pose = strikePose(o.strike);
  if (!pose?.right) return;
  const arm = pose.right;
  const s0 = sheetOnScreen(o);
  const px = f.pxScale;
  const c = f.c;
  const w0 = c.canvas.width, h0 = c.canvas.height;
  if (!handCv7 || handCv7.width !== w0 || handCv7.height !== h0) handCv7 = makeCanvas(w0, h0);
  const hc = handCv7.getContext('2d') as CanvasRenderingContext2D;
  hc.setTransform(1, 0, 0, 1, 0, 0);
  hc.globalAlpha = 1;
  hc.globalCompositeOperation = 'source-over';
  hc.clearRect(0, 0, w0, h0);
  hc.setTransform(s0.q * px, 0, 0, s0.q * px, s0.x * px, s0.y * px);
  const env = makeEnv({ mood: 'candleAmber', layer: 'L4', t: f.t, pxScale: px * s0.q, seed: 1417, frame: f.frame });
  const lk = Math.min(1, arm.lit ?? 0);
  // 2.6 px at 1080p in sheet units (1080p = 1.5 device px per stage px; q stage px per sheet unit)
  const rim1080 = 2.6 / (1.5 * s0.q);
  inkHand(hc, { right: arm, scale: pose.scale }, env, { lit: lk, rimPx: rim1080 });
  // the smooth sleeve, in the kit's hand-local frame (x back along the forearm, unit = the hand's length)
  const am = MOODS.candleAmber;
  const len = HAND_LEN * (pose.scale ?? 1);
  const flipY = Math.cos(arm.angle) < 0 ? -1 : 1;
  const ink = mixLab(env.mood.ink, '#000000', 0.35);
  const rimCol = mixLab(am.rim, am.core, 0.3 + 0.35 * lk);
  // which long edge faces the lamp (up-right): local -y maps to screen (flipY sin a, -flipY cos a)
  const L = { x: 0.55, y: -0.85 };
  const topLit = flipY * Math.sin(arm.angle) * L.x - flipY * Math.cos(arm.angle) * L.y > 0;
  hc.save();
  hc.translate(arm.wrist.x, arm.wrist.y);
  hc.rotate(arm.angle);
  hc.scale(len, len * flipY);
  const X0 = -0.17, X1 = -3.4;
  const sleeve = new Path2D();
  sleeve.moveTo(X0, -0.305);
  sleeve.quadraticCurveTo(-1.6, -0.345, X1, -0.4);
  sleeve.lineTo(X1, 0.42);
  sleeve.quadraticCurveTo(-1.6, 0.345, X0, 0.3);
  sleeve.quadraticCurveTo(X0 + 0.045, 0, X0, -0.305);
  sleeve.closePath();
  hc.fillStyle = ink;
  hc.fill(sleeve);
  // the pale shirt cuff band just past the sleeve (period detail), dim in the glass
  hc.fillStyle = withAlpha(mixLab(ink, am.halo, 0.42), 0.85);
  hc.beginPath();
  hc.moveTo(X0 + 0.01, -0.215);
  hc.lineTo(-0.035, -0.205);
  hc.quadraticCurveTo(-0.01, 0, -0.035, 0.205);
  hc.lineTo(X0 + 0.01, 0.215);
  hc.quadraticCurveTo(X0 + 0.05, 0, X0 + 0.01, -0.215);
  hc.fill();
  // the lit edge's rim (2.6 px at 1080p) and the turned-back cuff line (a fine hairline)
  const lw = rim1080 / len;
  const sy = topLit ? -1 : 1;
  hc.strokeStyle = withAlpha(rimCol, 0.95);
  hc.lineWidth = lw;
  hc.lineCap = 'round';
  hc.beginPath();
  hc.moveTo(X0, sy * (sy < 0 ? 0.305 : 0.3));
  hc.quadraticCurveTo(-1.6, sy * 0.345, X1, sy * (sy < 0 ? 0.4 : 0.42));
  hc.stroke();
  hc.strokeStyle = withAlpha(rimCol, 0.4);
  hc.lineWidth = lw * 0.45;
  hc.beginPath();
  hc.moveTo(-0.36, -0.31);
  hc.quadraticCurveTo(-0.31, 0, -0.36, 0.305);
  hc.stroke();
  hc.restore();
  // the forearm falls away behind the wrist (as reflHand)
  const w = arm.wrist;
  const ang = arm.angle;
  hc.save();
  hc.globalCompositeOperation = 'destination-in';
  const bk = { x: w.x - Math.cos(ang) * 60, y: w.y - Math.sin(ang) * 60 };
  const g = hc.createLinearGradient(bk.x, bk.y, w.x + Math.cos(ang) * 4, w.y + Math.sin(ang) * 4);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,1)');
  hc.fillStyle = g;
  hc.fillRect(-400, -400, SH.w + 800, SH.h + 800);
  hc.restore();
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = Math.min(1, o.alpha);
  c.drawImage(hc.canvas, 0, 0);
  c.restore();
}

/** reviser r1: the WASHINGTON page's opening alpha (paper and lettering share it): whole on the matched cut, then ONE
 *  short dissolve (0.5 → 0.85 s), gone well before 1.2. Kept short on purpose: under a shared alpha its dark lettering
 *  sinks into the dark water long before its pale paper does, so a long fade read as a blank page in the corner */
function washingtonK(t: number): number {
  return 1 - win(t, 0.5, 0.85);
}

/** the inverse of smoothstep (3y² - 2y³) on 0..1 */
function invSm(y: number): number {
  const v = clamp01(y);
  return 0.5 - Math.sin(Math.asin(1 - 2 * v) / 3);
}

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
function openStamp(c: C, card: { x: number; y: number; k: number }, sway: number, dt: number) {
  const { x, y, k } = card;
  const h = 112 * k, w = 170 * k;
  const pinY = y - h / 2 + 7 * k;
  const cy = y + h / 2 - 12 * k;
  c.save();
  c.translate(x, pinY);
  c.rotate(sway);
  c.translate(-x, -pinY);
  c.translate(x, cy);
  c.rotate(-0.035);
  // round 4: stamped ON the word, a 2-frame scale pop (1.22 → 1), the ink at 0.85 (desaturated oxblood: the candles stay
  // the only warm accent)
  const press = dt < 1 / 24 ? 1.22 : dt < 2 / 24 ? 1.1 : 1;
  c.scale(press, press);
  c.globalAlpha *= 0.85;
  c.strokeStyle = OXBLOOD;
  c.fillStyle = OXBLOOD;
  c.lineWidth = 2.2 * k;
  // round 4: the smaller card keeps the stamp over the 22 px cap floor: a wider box, 18-unit type
  const bw = w * 0.84, bh = 19 * k;
  c.strokeRect(-bw / 2, -bh / 2, bw, bh);
  textRole(c, 'subject', () => {
    c.font = `400 ${(18 * k).toFixed(1)}px ${FONT.typewriter}`;
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

/** round 5: the shelf end's one alpha (the critic: "settle all three at about 70 %") */
const OVERLAY_ALPHA = 0.72;
/** round 5: Liang's quote box (stage px): the columns above the plank fade to 10 % inside it while the quote is up */
const QUOTE_BOX = { x0: 688, x1: 1182, y0: 30, y1: 304 };
const GAP_UNLIT_VIEW: CandleView = { ...GAP, state: 'out', smoke: false };
/** reviser r1 (critic, continuity with ch14-s04b): the year-or-two-behind candle was blown out CLEANLY there ('no fray'),
 *  so its stub keeps a straight top under its two-ring sleeve here; its base tag is drawn by outTag (the s04b record) */
const BEHIND_CLEAN: CandleView = { ...BEHIND, frayed: false, tag: '' };
/** reviser r1: the chokepoint's three dissent tags as ch14-s04b hung them (same order, same size: none is the verdict),
 *  small and dim here (texture), above the chokepoint candle, from the 'chokepoint' clause */
const DISSENT: string[][] = [
  ['HELPS HUAWEI', 'HUANG (NVIDIA)'],
  ['SELF-DEFEATING', 'CHINA’S FOREIGN MINISTRY'],
  ['DECISIVE', 'AMODEI (ANTHROPIC), KHAN (EX-NSC)'],
];
const CANDLE_W = 30 * SH.s;
const RING_S = 6 * SH.s;

let overlayCv: HTMLCanvasElement | null = null;
function overlayCanvas(c: C): CanvasRenderingContext2D {
  const w = c.canvas.width, h = c.canvas.height;
  if (!overlayCv || overlayCv.width !== w || overlayCv.height !== h) overlayCv = makeCanvas(w, h);
  const oc = overlayCv.getContext('2d') as CanvasRenderingContext2D;
  oc.setTransform(1, 0, 0, 1, 0, 0);
  oc.globalAlpha = 1;
  oc.globalCompositeOperation = 'source-over';
  oc.filter = 'none';
  oc.clearRect(0, 0, w, h);
  return oc;
}

/** round 5 (critic: 'one shelf, two planes'): the right end of the shelf as ONE plane in the glass, painted on its own
 *  sheet and laid over the frame at one alpha: the gap taper (warm wax, scored, rimmed), the chokepoint candle burning
 *  with its four-ring sleeve scored in amber, the blackened match lying flat, the dark two-ring stub. Screen-locked in
 *  the sheet's own placement (sheetOnScreen), so it rises, pushes and pulls back with the reflection */
function shelfOverlay(f: Frame, o: { push: number; back: number; rise: number; lit: number; fed: number; ringsK: number; alpha: number; quote: number; dissent: number }) {
  const s0 = sheetOnScreen(o);
  const px = f.pxScale;
  const q = s0.q;
  const oc = overlayCanvas(f.c);
  oc.setTransform(q * px, 0, 0, q * px, s0.x * px, s0.y * px);
  const env0 = makeEnv({ mood: 'candleAmber', layer: 'L4', t: f.t, pxScale: px * q, seed: 1418, frame: f.frame });
  const am = env0.mood;
  // the shelf's ink, a step warm (the study's candleAmber), so the 2022 pair are dark candles against the night
  const ink = mixLab(am.ink, am.halo, 0.14);
  const env: PaintEnv = { ...env0, fill: (r) => (r === 'ink' ? ink : env0.fill(r)) };
  const lit = o.lit;
  textRole(oc, 'texture', () => {
    beliefCandle(oc, { x: SX.choke, y: SH.plank, view: CHOKE, s: SH.s, flame: o.fed, letters: 0.3, seed: 22, named: 0 }, env);
    beliefCandle(oc, { x: SX.behind, y: SH.plank, view: BEHIND_CLEAN, s: SH.s, letters: 0.28, seed: 23, named: 0 }, env);
    // the out candle's record, as ch14-s04b left it: OCT 2022 – JAN 2025 · ≈ 2
    // (CLEAN EDGES: in the close framing the stub stands at the frame's right edge, so the tag waits until it is whole
    // inside the safe area: it comes in with the pull back, never cut by the jamb)
    const tagRight = s0.x + (SX.behind + 66) * q;
    const tagK = 1 - sm((tagRight - 1170) / 50);
    if (tagK > 0.01) outTag(oc, env, SX.behind + (30 * SH.s) / 2 + 3 * SH.s, SH.plank, ['OCT 2022 –', 'JAN 2025', '≈ 2'], SH.s, tagK);
    if (o.dissent > 0.01) dissentTags(oc, env, o.dissent);
    beliefCandle(oc, { x: SX.match, y: SH.plank, view: MATCH, s: SH.s, seed: 24, named: 0 }, env);
    beliefCandle(oc, { x: SX.gap, y: SH.plank, view: lit > 0.02 ? GAP : GAP_UNLIT_VIEW, s: SH.s, flame: lit > 0.02 ? lit : undefined, letters: 0, seed: 25, named: 0 }, env);
  });
  // the chokepoint candle's four-ring sleeve: its ring lines and edges in an amber hairline (as in ch14-s04b), raised
  // on tag3 when the narration sets the new candle beside it
  const top = SH.plank - 45 * RING_S;
  const hair = 1 / (1.5 * q);
  const amber = mixLab(am.rim, am.core, 0.3);
  const n = Math.round(CHOKE.rings ?? 0);
  if (n > 0) {
    const x0 = SX.choke - CANDLE_W / 2;
    oc.fillStyle = withAlpha(amber, 0.6 + 0.4 * o.ringsK);
    for (let i = 0; i <= n; i++) oc.fillRect(x0, top + i * RING_S - hair, CANDLE_W, 2 * hair);
    oc.fillRect(x0, top, 2 * hair, n * RING_S);
    oc.fillRect(x0 + CANDLE_W - 2 * hair, top, 2 * hair, n * RING_S);
  }
  gapTaper(oc, am, lit, hair);
  // behind Liang's quote: the columns above the plank fall to 10 % inside its box (feathered)
  if (o.quote > 0.005) {
    oc.save();
    oc.setTransform(px, 0, 0, px, 0, 0);
    oc.globalCompositeOperation = 'destination-out';
    oc.filter = `blur(${(10 * px).toFixed(1)}px)`;
    oc.fillStyle = `rgba(0,0,0,${(o.quote * (1 - 0.1 / OVERLAY_ALPHA)).toFixed(3)})`;
    const B = QUOTE_BOX;
    const plankY = s0.y + (SH.plank - 4) * q;
    oc.fillRect(B.x0, B.y0, B.x1 - B.x0, Math.min(B.y1, plankY) - B.y0);
    oc.restore();
  }
  const c = f.c;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = Math.min(1, o.alpha);
  c.drawImage(oc.canvas, 0, 0);
  c.restore();
}

/** round 5 (critic: 'the new taper is still a blank slab'): the gap candle as a belief candle of the same kind as its
 *  neighbours: the same width, its warm wax (GAP_WAX) scored with the rule's 45 rings (6 px pitch, a 1 px line at ~12 %
 *  darker wax), its sleeve empty so the flame sits on the top ring, its body a step darker on the shadow side and
 *  toward the base, and a 1.5 px candleAmber rim the full height of its lit (right) side at ~80 %. Before the wick
 *  takes the match it is the same wax, unlit (a step down) */
function gapTaper(c: C, am: (typeof MOODS)['candleAmber'], lit: number, hair: number) {
  const w = CANDLE_W;
  const x0 = SX.gap - w / 2, x1 = SX.gap + w / 2;
  const top = SH.plank - 45 * RING_S;
  const h = SH.plank - top;
  const wax = mixLab(mixLab(GAP_WAX, am.set, 0.35), GAP_WAX, lit);
  // the wax: warmest under its own flame, falling off down the column. Reviser r1 (critic: 'an emissive tube'): graded
  // ~25 % darker from the flame to the base (a candle lit from its top), still the brightest candle on the shelf
  const g = c.createLinearGradient(0, top, 0, SH.plank);
  g.addColorStop(0, mixLab(wax, am.core, 0.24 * lit));
  g.addColorStop(0.1, wax);
  g.addColorStop(0.45, mixLab(wax, am.set, 0.22));
  g.addColorStop(1, mixLab(wax, am.set, 0.52));
  c.fillStyle = g;
  c.fillRect(x0, top, w, h);
  // the shadow side (left), so the column has a body
  const gs = c.createLinearGradient(x0, 0, x1, 0);
  gs.addColorStop(0, withAlpha(mixLab(GAP_WAX, am.ink, 0.5), 0.55));
  gs.addColorStop(0.42, withAlpha(mixLab(GAP_WAX, am.ink, 0.5), 0));
  c.fillStyle = gs;
  c.fillRect(x0, top, w, h);
  // the 45 scored rings: a 1 px line at ~12 % darker wax every 6 px (every fifth a little longer, as the rule's)
  c.fillStyle = mixLab(wax, am.ink, 0.12);
  for (let i = 1; i < 45; i++) {
    const inset = i % 5 === 0 ? 1 * SH.s : 5 * SH.s;
    c.fillRect(x0 + inset, top + i * RING_S - hair / 2, w - 2 * inset, hair);
  }
  // the melt pool's lip under the flame (the top ring)
  c.fillStyle = mixLab(am.core, GAP_WAX, 0.4 * (1 - lit) + 0.35);
  c.fillRect(x0, top - hair, w, 2.4 * hair);
  // the candleAmber rim on the lit (right) side only, strongest under the flame
  const rg = c.createLinearGradient(0, top, 0, SH.plank);
  rg.addColorStop(0, withAlpha(am.rim, 0.85 * (0.45 + 0.55 * lit)));
  rg.addColorStop(1, withAlpha(am.rim, 0.55 * (0.45 + 0.55 * lit)));
  c.fillStyle = rg;
  c.fillRect(x1 - 1.5 * hair, top, 1.5 * hair, h);
}

/** reviser r1: the out candle's base tag lying flat at its right, as ch14-s04b's flatTag (sheet units) */
function outTag(c: C, env: PaintEnv, x: number, y: number, lines: string[], s: number, a = 1) {
  const m = env.mood;
  textRole(c, 'texture', () => {
    c.save();
    c.globalAlpha *= a;
    const fs = 8.4 * s;
    c.font = `500 ${fs}px ${FONT.mono}`;
    const tw = Math.max(...lines.map((l) => c.measureText(l).width)) + 7 * s;
    const lh = fs * 1.12;
    const th = lines.length * lh + 5 * s;
    const n = 4 * s;
    const paper = mixLab(m.setHaze, m.halo, 0.6);
    c.translate(x, y - th);
    c.fillStyle = paper;
    c.beginPath();
    c.moveTo(0, th / 2);
    c.lineTo(n, 0);
    c.lineTo(n + tw, 0);
    c.lineTo(n + tw, th);
    c.lineTo(n, th);
    c.closePath();
    c.fill();
    c.fillStyle = mixLab(m.ink, paper, 0.15);
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    lines.forEach((l, i) => c.fillText(l, n + 3.5 * s, 2.5 * s + lh * (i + 0.5)));
    c.restore();
  });
}

/** reviser r1: ch14-s04b's three dissent tags, small and dim (texture), in ONE row above the chokepoint candle, the
 *  same size and height, turning gently on their threads (sheet units; k 0..1 their fade in) */
function dissentTags(c: C, env: PaintEnv, k: number) {
  const m = env.mood;
  const t = env.t;
  const W = 60, H = 25, PITCH = 66, TOP = 46;
  const paper = mixLab('#b8a47a', m.ink, 0.25);
  textRole(c, 'texture', () => {
    DISSENT.forEach((lines, i) => {
      const cx = SX.choke + (i - 1) * PITCH;
      const th = 0.02 * Math.sin(t * 0.7 + i * 2.1) + 0.012 * Math.sin(t * 1.3 + i);
      c.save();
      c.globalAlpha *= 0.5 * k;
      // the thread, from above the frame
      c.strokeStyle = withAlpha(m.ink, 0.6);
      c.lineWidth = 0.6;
      c.beginPath();
      c.moveTo(cx, -160);
      c.lineTo(cx, TOP);
      c.stroke();
      c.translate(cx, TOP);
      c.rotate(th);
      c.fillStyle = paper;
      c.fillRect(-W / 2, 0, W, H);
      c.strokeStyle = withAlpha(mixLab(paper, m.ink, 0.5), 0.8);
      c.lineWidth = 0.5;
      c.strokeRect(-W / 2, 0, W, H);
      c.fillStyle = mixLab(m.ink, paper, 0.12);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      // fitted to the tag (texture: the same size on all three)
      const fit = (n: number, max: number) => Math.min(max, (W - 5) / (n * 0.6));
      c.font = `700 ${fit(14, 6.2).toFixed(2)}px ${FONT.mono}`;
      c.fillText(lines[0], 0, 8.5);
      c.font = `500 ${fit(33, 3.6).toFixed(2)}px ${FONT.mono}`;
      c.fillText(lines[1], 0, 17);
      c.restore();
    });
  });
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
  // year-or-two-behind stub), each at ONE constant offset from its reflection, so the ghosts over the water are these
  const s = 1.15;
  const so = sheetOnScreen({ push, back, rise: 0 });
  const OFFSET = 372;
  const rx = (sx: number) => so.x + sx * so.q + OFFSET;
  const reals = [
    { x: rx(SX.gap), view: GAP, seed: 25 },
    { x: rx(SX.choke), view: CHOKE, seed: 22 },
    { x: rx(SX.match), view: MATCH, seed: 24 },
    { x: rx(SX.behind), view: BEHIND_CLEAN, seed: 23 },
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

/** the far lit hall on the right bank (round 4): a low hall front with one large lit window (60 × 40) and a single
 *  generic ink figure standing in it (Liang; never a likeness), from just before 'founder' to the end of his line */
function hall(c: C, env: PaintEnv, k: number, tq: number) {
  const x = HALL.x, y = HALL.y;
  if (k <= 0.005) return;
  const ink = mixLab(env.mood.ink, '#000000', 0.3);
  c.save();
  c.globalAlpha *= Math.min(1, k * 1.4);
  // the hall's front and roof line
  c.fillStyle = env.fill('set');
  c.fillRect(x - 52, y - 22, 104, 62);
  c.fillRect(x - 58, y - 27, 116, 5);
  // the window, warm (the same WARM as every window on both shores), its light falling out onto the quay
  const wy = y - 14;
  c.fillStyle = withAlpha(WARM, 0.62 + 0.3 * k);
  c.fillRect(x - 30, wy, 60, 40);
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = withAlpha(WARM, 0.14 * k);
  c.fillRect(x - 40, wy + 40, 80, 18);
  c.restore();
  // glazing bars
  c.fillStyle = env.fill('set');
  c.fillRect(x - 0.8, wy, 1.6, 40);
  c.fillRect(x - 30, wy + 19, 60, 1.4);
  // the figure: standing in the window, turned to the strait, on twos (the faintest breath)
  const br = 0.3 * Math.sin(tq * 1.6);
  c.fillStyle = ink;
  const fx = x + 9, fb = wy + 40;
  c.beginPath();
  c.ellipse(fx, fb - 30 + br * 0.2, 3.4, 4, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(fx - 1.4, fb - 26.5, 2.8, 2.5);
  c.beginPath();
  c.moveTo(fx - 7.5, fb - 23 + br * 0.3);
  c.quadraticCurveTo(fx, fb - 25.5, fx + 7.5, fb - 23 + br * 0.3);
  c.lineTo(fx + 6.5, fb - 9);
  c.lineTo(fx + 4.5, fb);
  c.lineTo(fx - 4.5, fb);
  c.lineTo(fx - 6.5, fb - 9);
  c.closePath();
  c.fill();
  // a warm rim on the figure's window-lit edge
  c.fillStyle = withAlpha(WARM, 0.5 * k);
  c.fillRect(fx + 6.6, fb - 22, 0.9, 13);
  c.restore();
}

/** round 4: the far fence on 'fence' (sets/ch14-s05-strait farFence geometry: nine pinned sheets on a sagging tie line):
 *  each page brightened to ≈ 0.8 paper and a warm edge sweeping left → right over 0.6 s (u = seconds since the sweep) */
function fenceLight(c: C, env: PaintEnv, k: number, u: number) {
  const n = 9;
  const span = FENCE.x1 - FENCE.x0;
  const pitch = span / n;
  const w = pitch - 5;
  const topY = HZ - FENCE.h - 4;
  const lineY = (x: number) => topY + 5 * (1 - Math.pow((2 * (x - FENCE.x0)) / span - 1, 2));
  const paper = mixLab('#e9e2d2', env.mood.halo, 0.25);
  const am = MOODS.candleAmber;
  c.save();
  for (let i = 0; i < n; i++) {
    const x = FENCE.x0 + (i + 0.5) * pitch;
    const h = FENCE.h * (0.74 + 0.16 * Math.abs(hash1(i, 33)));
    const lean = (i % 2 ? 1 : -1) * 0.05 + 0.04 * hash1(i, 34);
    const t0 = (0.6 * i) / (n - 1);
    const sw = win(u, t0, t0 + 0.14) * (1 - 0.55 * win(u, 0.9, 2.4));
    c.save();
    c.translate(x, lineY(x));
    c.rotate(lean);
    c.globalAlpha = 0.8 * k;
    c.fillStyle = paper;
    c.beginPath();
    c.moveTo(-w / 2, 0);
    c.lineTo(w / 2, 0);
    c.lineTo(w / 2, h - 4);
    c.lineTo(w / 2 - 4, h);
    c.lineTo(-w / 2, h);
    c.closePath();
    c.fill();
    // the typed lines again over the brighter sheet
    c.fillStyle = withAlpha(env.mood.ink, 0.45);
    c.fillRect(-w / 2 + 2.5, 5, w * 0.55, 1.3);
    for (let q = 0; q < 5; q++) c.fillRect(-w / 2 + 2.5, 9.5 + q * ((h - 14) / 5), (w - 5) * (0.55 + 0.4 * Math.abs(hash1(i * 7 + q, 35))), 0.7);
    // the warm edge: the top and the lit side catch it as the sweep passes
    if (sw > 0.01) {
      c.globalAlpha = k;
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = withAlpha(mixLab(am.core, am.halo, 0.4), 0.9 * sw);
      c.fillRect(-w / 2, -0.8, w, 1.8);
      c.fillRect(w / 2 - 1.4, 0, 1.4, h - 4);
      c.fillStyle = withAlpha(am.halo, 0.18 * sw);
      c.fillRect(-w / 2, 0, w, h);
    }
    c.restore();
  }
  c.restore();
}
