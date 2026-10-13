/**
 * ch14-s04b — the struck match. In the study window's reflection over the strait (a SHELF macro, in the glass): a
 * match lettered COMPUTE MATTERS LESS? flares for one day and is shaken out; the chokepoint candle steadies and burns
 * on as dissent tags swing into its light; the one-to-three-years candle is named, then blows out at two rings
 * (winterBlue outside, the reflection candleAmber; 15.29 s on the locked clock; in: cut).
 *
 *   match   'struck'      the hands strike the match: it flares (the one warm alarm, a practical), burns down
 *   (push)  'struck'→'match'  the camera pushes in on the match so its lettering COMPUTE MATTERS LESS? reads; the
 *                         lens focuses on the match, so the candles' vertical lettering and base tags fall out of
 *                         focus (fade) while the lens is past ~1.8 (review r1: no half-words at the frame's bottom);
 *                         it eases back out to the wide before 'trailing'
 *   smoke   line end+0.1  shaken out: one day's flare, a thin curl of smoke; both 2022 candles lean in its draught;
 *                         the blackened match is laid on the shelf between them
 *   steady  line end+0.5  the chokepoint candle flickers low, then steadies
 *   tag1    5.59          HELPS HUAWEI · HUANG (NVIDIA) swings in on its thread, the LEFT tag of one row hung above
 *                         the flames and lit by the chokepoint flame (round 2: the Anthropic-attributed tag is not first)
 *   tag2    6.19          SELF-DEFEATING · CHINA'S FOREIGN MINISTRY swings in to the row's CENTRE (round 3: one row,
 *                         one height, one size; no tag hangs higher than another)
 *   (name)  'China'       NAMING RULE: the behind candle's label turns horizontal and large beside its flame with its
 *                         dates (lit Oct 2022 · out Jan 2025 · ≈ 2 years) for ~2.3 s; its vertical lettering fades
 *   out     'trailing'    the draught blows it out cleanly: a thread of smoke, a clean dark two-ring sleeve, its tag
 *                         now OCT 2022 – JAN 2025 · ≈ 2
 *   two     'two'         the sleeve's two rings are scored bright by the chokepoint flame's light (two bands); the
 *                         third tag, DECISIVE · AMODEI (ANTHROPIC), KHAN (EX-NSC), swings in at the row's RIGHT
 *   (tail)  10.9 → 15.29  all three tags hang lit, turning gently, over the blackened match, the dark stub and the
 *                         living flame (the third has ~4.8 s lit before the cut)
 * Round 4 (critic): the reflected columns are ink (≈ 25-30 % luminance over the fog), their ripple halved; an ink sill
 * runs along the frame's bottom 8 % (the foreground plane); the hand is an ink silhouette with a candleAmber rim
 * (inkHand); the match flame is dead by 5.0 s and its smoke curls from 5.05; the pull back reaches the wide by ~6.1 s
 * and the tags swing in only once the lens is near the wide (no tag crosses the frame edge); the burned sleeve is a
 * darker ink ghost scored in candleAmber hairlines, and on 'two' its two ring lines brighten in turn 0.15 s apart;
 * the named card rises on 'trailing' (as the flame dies, so its 'out' date is true) 60 px lower than before; the
 * hold pushes ~3 % toward the blackened match, which keeps a faint ember rim.
 * WINDOW RULE (review r1): every candle, the 2022 pair included, is a ~35% rippled reflection over the strait; only
 * the small paper details (base tags, the scored sleeve, the flames) are drawn on a brighter detail sheet.
 * CANDLE-CLOCK RULE · CANDLE PLACEMENT · WINDOW RULE (sets/ch14-s01-strait).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { FONT, MOODS, defineShot, mixLab, withAlpha } from '../../../film';
import { hands } from '../cast';
import { REFL, RING, baseTag, candleFlameAt, clamp01, glassReflection, lerp, monotone, reflCandle, reflEnv, sm, smokeCurl, strait, tq12, win, windowFrame, type P, type ReflCandle } from '../sets/ch14-s01-strait';
import { namingK, reflFlameOnScreen, reflNamedCard } from '../sets/ch14-s02-naming';
import { flame as flameShape } from '../../../film/silhouette/props/_kit';
import { SHELF_R, behindCandle, chokeCandle, shelfRefl } from '../sets/ch14-s02-shelf';
import { blurRect } from '../sets/ch02-s05b-util';
import { inkHand } from '../sets/ch14-s02-inkhand';

const ID = 'ch14-s04b';
type C = CanvasRenderingContext2D;

const MATCH_REST: P = { x: (SHELF_R.choke + SHELF_R.behind) / 2 + 2, y: SHELF_R.y - 2 };
/** where the lit match is held: right of the behind candle, so its long stick and lettering cross clear glass (round 2) */
const HOLD_AT: P = { x: 808, y: 322 };
/** the wide (round 2: every candle whole in frame, the 'scale' candle at left to the ≈ 2 tag at right): the L2 point
 *  at the frame's centre and the lens */
const WIDE = { x: 583, y: 360, lens: 1.5 } as const;
/** the three dissent tags (review r1), in the order they swing in (round 2: the Anthropic-attributed tag is not
 *  first). Round 3 (historian): all three hang in ONE row, at the same height and the same size, above the flames,
 *  so no position reads as the verdict: HELPS HUAWEI left, SELF-DEFEATING centre (over the chokepoint candle),
 *  DECISIVE right. x / top on the reflection plane (L2); `from` = the side it swings in from */
const TAG_ROW = { top: 170, w: 184, pitch: 208, cx: 589 } as const;
const TAGS = [
  { lines: ['HELPS HUAWEI', 'HUANG (NVIDIA)'], x: TAG_ROW.cx - TAG_ROW.pitch, top: TAG_ROW.top, w: TAG_ROW.w, from: -1 },
  { lines: ['SELF-DEFEATING', 'CHINA’S FOREIGN', 'MINISTRY'], x: TAG_ROW.cx, top: TAG_ROW.top, w: TAG_ROW.w, from: 1 },
  { lines: ['DECISIVE', 'AMODEI (ANTHROPIC),', 'KHAN (EX-NSC)'], x: TAG_ROW.cx + TAG_ROW.pitch, top: TAG_ROW.top, w: TAG_ROW.w, from: 1 },
] as const;
const TAG_H = 84;
/** the threads hang from far above the frame (a long pendulum: the swing-in travels) */
const PIVOT_Y = -160;
/** cam.x / cam.y that put REFL-plane (L2) point w at screen sc with lens k */
function camRefl(w: number, sc: number, k: number, c0 = 640) {
  return c0 + ((w - c0) * k - (sc - c0)) / ((k * 1000) / REFL.z);
}

interface B {
  D: number;
  match: number;
  smoke: number;
  steady: number;
  out: number;
  two: number;
  hold: number;
  /** the three tags' swing-in times (tag1, tag2, 'two') */
  lit: [number, number, number];
  /** the behind candle is named (NAMING RULE): rise at, full for */
  name: number;
  nameHold: number;
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
    const b: B = {
      D,
      match: T.beat('match'),
      smoke: T.beat('smoke'),
      steady: T.beat('steady'),
      out: T.beat('out'),
      two: T.beat('two'),
      hold: T.beat('hold'),
      lit: [T.beat('tag1'), T.beat('tag2'), T.beat('two')],
      // round 4: the card rises on 'trailing', as the flame dies (its 'out' date is then true)
      name: T.word('L1410b', 'trailing') - 0.1,
      nameHold: 2.0,
    };
    // round 4: the pull back from the match runs from the shake-out to the wide in ~1 s; the first two tags swing in
    // only once the lens is near the wide (no tag crosses the frame's edge at any frame)
    const pullEnd = b.smoke + 1.0;
    b.lit[0] = Math.max(b.lit[0], pullEnd - 0.25);
    b.lit[1] = Math.max(b.lit[1], b.lit[0] + 0.5);
    // the push: centre the match's lettering (where it is held, just after 'match') in a lens-2.6 close-up
    const word = T.word('L1410', 'match');
    const ms = matchState(word + 0.1, b);
    const g = matchPose(ms);
    const P0: P = g ? { x: g.x + Math.cos(g.ang) * MATCH_L * 0.5, y: g.y + Math.sin(g.ang) * MATCH_L * 0.5 } : HOLD_AT;
    const keys: [number, number, number, number][] = [
      // [t, L2 x at centre, L2 y at centre, lens]
      [0, WIDE.x - 6, WIDE.y + 4, WIDE.lens],
      [T.word('L1410', 'struck') - 0.45, WIDE.x, WIDE.y, WIDE.lens * 1.02],
      // (review r1: the candles' lettering is out of focus in this close-up, so no half-words sit at its bottom)
      [word + 0.05, P0.x, P0.y, 2.6],
      [b.smoke + 0.02, P0.x + 4, P0.y + 2, 2.64],
      [pullEnd, WIDE.x + 4, WIDE.y, WIDE.lens * 1.01],
      // round 4 (the hold): a slow ~3 % push toward the blackened match between the dark stub and the living flame
      [b.two + 0.45, WIDE.x + 3, WIDE.y - 1, WIDE.lens * 1.014],
      [D, WIDE.x + 12, WIDE.y + 7, WIDE.lens * 1.045],
    ];
    const fl = monotone(keys.map((k) => [k[0], Math.log(k[3])]));
    const fx = monotone(keys.map((k) => [k[0], k[1]]));
    const fy = monotone(keys.map((k) => [k[0], k[2]]));
    const cam = (t: number): Camera3 => {
      const k = Math.exp(fl(t));
      return { x: camRefl(fx(t), 640, k), y: camRefl(fy(t), 360, k, 360), z: 0, lens: k };
    };
    tl.hold(0, D);
    return { tl, b, cam };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const cam = sc.cam(t);
    f.camera(cam);
    // the strait beyond the glass: present, cold, soft (focus is on the reflection)
    strait(f, { key: 'ch14', moodKey: 'winterBlue', sunX: 640, sunI: 0.5, stones: [], lantern: 0.8 });
    blurRect(f, 0, 0, 1280, 720, 2.6, 1);
    reflection(f, t, b, cam.lens);
    tags(f, t, b);
    windowFrame(f, {});
    sill(f);
    // NAMING RULE: the behind candle's card, above-right of its flame (the second tag hangs at flame height there)
    const nk = namingK(t, b.name, b.nameHold);
    if (nk > 0.003) {
      const p = reflFlameOnScreen(f, candleFlameAt(behindCandle({ rings: 2 })));
      reflNamedCard(f.c, { sx: p.x, sy: p.y, k: nk, lines: ['CHINA IS A YEAR', 'OR TWO BEHIND'], dates: 'lit Oct 2022 · out Jan 2025 · ≈ 2 years', side: 'right', top: 112 }, f.mood);
    }
  },
});

/** round 4: the study window's sill along the frame's bottom 8 % (screen-locked, the foreground plane): ink, a carved
 *  moulding, its top edge catching the room's lamp in a candleAmber hairline */
function sill(f: Frame) {
  const c = f.c;
  const A = MOODS.candleAmber;
  const y0 = 720 * 0.92;
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  c.filter = `blur(${(1.4 * f.pxScale).toFixed(2)}px)`;
  const ink = mixLab(A.ink, '#000000', 0.45);
  c.fillStyle = ink;
  c.fillRect(-10, y0, 1300, 720 - y0 + 10);
  // the moulding: a lip, a cove, a bead
  c.fillStyle = mixLab(ink, A.set, 0.18);
  c.fillRect(-10, y0 + 9, 1300, 3);
  c.fillRect(-10, y0 + 22, 1300, 2);
  c.filter = 'none';
  c.fillStyle = withAlpha(A.rim, 0.55);
  c.fillRect(-10, y0 - 0.6, 1300, 1.4);
  c.fillStyle = withAlpha(A.rim, 0.18);
  c.fillRect(-10, y0 + 12, 1300, 0.8);
  c.restore();
}

// ------------------------------------------------------------------------------------------- the hands and match
interface MatchState {
  pose: ReturnType<typeof hands.act> | null;
  /** 0..1.4 flame strength (flare > 1) */
  lit: number;
  /** burned fraction of the match (head end) */
  burnt: number;
  /** lying on the shelf */
  laid: boolean;
}
function matchState(t: number, b: B): MatchState {
  const tq = tq12(t);
  const s0 = b.match - 1.25;
  // u: approach (→ .25 at s0+1.1), strike stroke (.25 → .38: lit on 'struck'), carry (→ .6), hold (→ .8), withdraw
  let u: number;
  let target = HOLD_AT;
  // round 4: shaken out from ~4.89 so the flame is dead by 5.0 s (before 'smoke'), the curl rising from 5.05
  const shake = b.smoke - 0.2;
  const lay0 = shake + 0.45, lay1 = shake + 1.25;
  if (tq < s0) u = -1;
  else if (tq < b.match - 0.15) u = (0.25 * (tq - s0)) / (b.match - 0.15 - s0);
  else if (tq < b.match + 0.06) u = 0.25 + (0.13 * (tq - b.match + 0.15)) / 0.21;
  else if (tq < b.match + 0.7) u = 0.38 + (0.22 * (tq - b.match - 0.06)) / 0.64;
  else if (tq < lay1) {
    u = 0.6 + (0.2 * (tq - b.match - 0.7)) / (lay1 - b.match - 0.7);
    if (tq >= shake && tq < shake + 0.36) target = { x: HOLD_AT.x + 9 * Math.sin((tq - shake) * 34), y: HOLD_AT.y + 3 * Math.cos((tq - shake) * 34) };
    if (tq >= lay0) target = { x: lerp(HOLD_AT.x, MATCH_REST.x - 30, sm((tq - lay0) / (lay1 - lay0))), y: lerp(HOLD_AT.y, MATCH_REST.y - 4, sm((tq - lay0) / (lay1 - lay0))) };
  } else if (tq < lay1 + 1.0) {
    u = 0.8 + 0.2 * (tq - lay1);
    target = { x: MATCH_REST.x - 30, y: MATCH_REST.y - 4 };
  } else u = -1;
  // the flame: a flare on the strike, then burning down toward the fingers; shaken out on 'chokepoint'
  let lit = 0;
  if (tq >= b.match - 0.03 && tq < shake + 0.1) {
    const k = tq - b.match;
    lit = k < 0.25 ? 1.45 - k * 1.6 : lerp(1.05, 0.72, clamp01((k - 0.25) / Math.max(0.2, shake - b.match - 0.25)));
    if (tq >= shake) lit *= Math.max(0, 1 - (tq - shake) / 0.1);
  }
  const burnt = clamp01((tq - b.match) / Math.max(0.3, shake - b.match)) * 0.2;
  const opts = { scale: 0.38, entry: { R: { x: 1000, y: 610 }, L: { x: 950, y: 650 } }, strikeAt: { x: SHELF_R.behind + 92, y: SHELF_R.y - 74 } };
  let pose = u >= 0 && u < 1 ? hands.act('strikeLight', u, target, opts) : null;
  if (pose?.right) pose = { ...pose, right: { ...pose.right, held: 'none' as const, shape: tq >= lay1 - 0.05 ? ('open' as const) : pose.right.shape } };
  return { pose, lit: Math.max(0, lit), burnt, laid: tq >= lay1 - 0.05 };
}

/** a long fireplace match: its lettering is read in the push-in (8.4 px at lens 2.6 ≥ 22 px cap) */
const MATCH_L = 112;
/** where the match lies: its butt point and angle (in the hand: along the fingers; laid: flat on the shelf) */
function matchPose(ms: MatchState): { x: number; y: number; ang: number } | null {
  if (ms.laid) return { x: MATCH_REST.x - MATCH_L / 2, y: MATCH_REST.y + 9, ang: -0.035 };
  const p = ms.pose;
  if (!p?.right) return null;
  const s = hands.socket(p, 'right')!;
  return { x: s.x, y: s.y, ang: p.right.angle + (p.right.bend ?? 0) - 0.35 };
}
function matchHead(ms: MatchState): P | null {
  const g = matchPose(ms);
  return g ? { x: g.x + Math.cos(g.ang) * (MATCH_L + 3), y: g.y + Math.sin(g.ang) * (MATCH_L + 3) } : null;
}
/** a match about as long as a candle is wide ×2, lettered COMPUTE MATTERS LESS? small along the stick; once shaken
 *  out and laid on the shelf it is charred: a dark stick, a black crumbled head, the lettering ghosted */
function drawMatch(c: C, env: PaintEnv, ms: MatchState) {
  const g = matchPose(ms);
  if (!g) return;
  const m = env.mood;
  const L = MATCH_L;
  c.save();
  c.translate(g.x, g.y);
  c.rotate(g.ang);
  if (ms.laid) {
    c.fillStyle = mixLab(m.ink, m.set, 0.35);
    c.fillRect(-3, -4.2, L + 3, 8.4);
    c.fillStyle = m.ink;
    c.fillRect(L * 0.82, -4.2, L * 0.18, 8.4);
    // the crumbled head
    c.beginPath();
    c.moveTo(L - 1, -3.4);
    c.lineTo(L + 3, -4.2);
    c.lineTo(L + 6.5, -1.5);
    c.lineTo(L + 5, 1.2);
    c.lineTo(L + 6.2, 3.4);
    c.lineTo(L + 1.5, 3.8);
    c.lineTo(L - 1, 2.8);
    c.closePath();
    c.fill();
    c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.3);
    // round 4: a faint ember rim along its top edge and a coal at the crumbled head, so the eye finds it in the hold
    c.save();
    c.globalCompositeOperation = 'lighter';
    const em = 0.75 + 0.25 * Math.sin(env.t * 2.3);
    c.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.4), 0.55 * em);
    c.fillRect(-3, -4.6, L + 3, 1.3);
    c.fillStyle = withAlpha(m.core, 0.7 * em);
    c.beginPath();
    c.ellipse(L + 2.5, -0.5, 2.6, 2, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  } else {
    // a pale stick wide enough to carry its lettering
    c.fillStyle = mixLab(m.halo, m.set, 0.25);
    c.fillRect(-3, -4.2, L + 3, 8.4);
    c.fillStyle = mixLab(m.ink, m.set, 0.15);
    c.fillRect(L * (1 - ms.burnt * 0.5), -4.2, L * ms.burnt * 0.5, 8.4);
    c.fillStyle = ms.lit > 0 ? mixLab(m.ink, m.halo, 0.3) : m.ink;
    c.beginPath();
    c.ellipse(L + 2, 0, 6, 5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(mixLab(m.ink, m.set, 0.1), 0.9);
  }
  c.font = `600 8.4px ${FONT.mono}`;
  c.textBaseline = 'middle';
  c.textAlign = 'center';
  // keep the lettering upright to the viewer whichever way the stick points
  if (Math.cos(g.ang) < 0) {
    c.translate(L * 0.46, 0);
    c.rotate(Math.PI);
    c.fillText('COMPUTE MATTERS LESS?', 0, -0.4);
  } else c.fillText('COMPUTE MATTERS LESS?', L * 0.46, 0.4);
  c.restore();
}

// ------------------------------------------------------------------------------------------- the reflection
function reflection(f: Frame, t: number, b: B, lens: number) {
  const tq = tq12(t);
  const ms = matchState(t, b);
  // draughts: the shake-out and the gust on 'trailing' lean both 2022 flames (the flames bend; the wax stands)
  const d1 = Math.max(0, tq - b.smoke), d2 = Math.max(0, tq - (b.out - 0.25));
  const lean = (tq >= b.smoke ? 13 * Math.exp(-d1 * 2.0) * Math.cos(d1 * 5) : 0) + (tq >= b.out - 0.25 ? 17 * Math.exp(-d2 * 1.8) * Math.cos(d2 * 4) : 0);
  // the chokepoint flame: flickers low on 'steady', steadies; its own sleeve keeps growing (two rings and more)
  const dip = win(tq, b.steady - 0.5, b.steady - 0.1) * (1 - win(tq, b.steady + 0.2, b.steady + 0.9));
  const chokeF = 1 - 0.62 * dip + 0.06 * Math.sin(t * 9.3) * dip;
  // the behind candle's vertical lettering gives way to its named card
  const nk = namingK(t, b.name, b.nameHold);
  // focus: in the push-in on the match the candles' lettering and tags go soft (fade), so none is cut at the frame
  const focus = 1 - sm((lens - 1.75) / 0.45);
  // round 4: ink wax (the columns ≈ 25-30 % luminance over the fog), so the flames and the paper tags do the lighting
  const C1 = chokeCandle({ rings: 2 + 0.35 * (t / b.D), flame: chokeF, lean, tag: '', letters: 0.8 * focus });
  const outK = clamp01((tq - b.out) / 0.25);
  const isOut = outK >= 1;
  const C2 = behindCandle({
    rings: 2,
    state: isOut ? 'out' : 'live',
    flame: 1 - outK,
    lean: lean * 1.3,
    smoke: isOut ? win(t, b.out + 0.1, b.out + 0.5) * (1 - win(t, b.out + 2.2, b.out + 3.4)) : 0,
    tag: '',
    letters: 0.8 * (1 - 0.9 * nk) * focus,
  });
  const w1 = candleFlameAt(C1), w2 = candleFlameAt(C2);
  const head = matchHead(ms);
  const old: P[] = [];
  // the candles, the shelf, the laid match: one ~35% reflection (WINDOW RULE), rippled 1-2 px
  glassReflection(f, {
    key: ID,
    rect: { x: 250, y: 150, w: 1000, h: 640 },
    res: f.pxScale * 1.95,
    // round 4: a darker veil (ink columns) and half the ripple (the 270 px columns no longer bend)
    alpha: 0.56,
    light: 0.12,
    ripple: 0.8,
    fade: { cx: 640, cy: 400, r0: 300, r1: 640 },
    draw: (c, env) => {
      old.push(...shelfRefl(c, env, ID));
      reflCandle(c, C1, env);
      reflCandle(c, C2, env);
      if (ms.laid) drawMatch(c, env, ms);
      // the match's thin curl of smoke after the shake-out
      const sk = win(tq, b.smoke - 0.04, b.smoke + 0.3) * (1 - win(tq, b.smoke + 3, b.smoke + 5));
      const hp = ms.laid ? { x: MATCH_REST.x + MATCH_L / 2 + 4, y: MATCH_REST.y + 8 } : head;
      if (sk > 0.01 && hp) smokeCurl(c, env, hp, 60, 0.92, sk, 5);
    },
    glows: () => [
      ...old.map((p) => ({ x: p.x, y: p.y - 4, r: 46, a: 0.4 })),
      { x: w1.x, y: w1.y - 6, r: 64, a: 0.8 * chokeF },
      { x: w2.x, y: w2.y - 6, r: 64, a: 0.8 * (1 - outK) },
      // the match: the brightest bloom in the frame (a tight hot core and a wider spill)
      ...(head && ms.lit > 0
        ? [
            { x: head.x + 3, y: head.y - 6, r: 36, a: Math.min(2.2, 1.6 * ms.lit) },
            { x: head.x + 3, y: head.y - 6, r: 110, a: 0.9 * Math.min(1.4, ms.lit) },
          ]
        : []),
      { x: w1.x, y: w1.y + 40, r: 520, a: 0.1 * chokeF + 0.08 * (1 - outK) },
      // the laid match's ember
      ...(ms.laid ? [{ x: MATCH_REST.x + MATCH_L / 2 + 4, y: MATCH_REST.y + 8, r: 16, a: 0.35 }] : []),
    ],
  });
  // the small paper details, brighter on the same plane: the flames' own shapes, the base tags, and on 'two' the
  // sleeve's two rings scored bright by the chokepoint flame (two bands, so 'about two' is two rings)
  glassReflection(f, {
    key: `${ID}-detail`,
    rect: { x: 520, y: 200, w: 600, h: 360 },
    res: f.pxScale * Math.max(1.95, lens * 1.08),
    alpha: 0.86,
    light: 0.22,
    ripple: 0.8,
    draw: (c, env) => {
      for (const C of [C1, C2]) {
        if (C.state === 'live' && (C.flame ?? 1) > 0) {
          const fp = candleFlameAt(C);
          c.save();
          c.translate(C.x, fp.y + 2 * C.s);
          c.rotate((C.lean ?? 0) * 0.055);
          c.scale(C.s * 1.9, C.s * 1.9);
          flameShape(c, env, 0, 0, 9 * Math.max(0.25, C.flame ?? 1), C.seed ?? 3, 0.8 + 0.3 * (C.flame ?? 1));
          c.restore();
        }
      }
      if (head && ms.lit > 0) {
        c.save();
        c.translate(head.x + 2, head.y + 1);
        c.scale(1.8, 1.8);
        flameShape(c, env, 0, 0, 9 * Math.min(1.5, ms.lit), 41, 1.2);
        c.restore();
      }
      const tagAt = (C: ReflCandle) => ({ x: C.x + (38 * C.s) / 2 + 2 * C.s, y: C.y - 4 * C.s });
      const t1 = tagAt(C1), t2 = tagAt(C2);
      baseTag(c, env, t1.x, t1.y, 'LIT 2022', C1.s, focus);
      baseTag(c, env, t2.x, t2.y, tq >= b.out + 0.3 ? 'OCT 2022 – JAN 2025 · ≈ 2' : 'LIT 2022', C2.s, focus);
      if (outK > 0) scoredSleeve(c, env, C2, tq, b, outK);
    },
  });
  // the hands and the match they hold: their own faint sheet on the same plane (WINDOW RULE: ≈ 35% alpha, small,
  // from the lower right; the forearms fade out long before the frame's right side)
  if (ms.pose) {
    const pose = ms.pose;
    glassReflection(f, {
      key: `${ID}-hands`,
      rect: { x: 420, y: 120, w: 640, h: 560 },
      // sharp enough for the match's lettering in the push-in
      res: f.pxScale * Math.max(1.95, lens * 1.08),
      // round 4: an ink hand at the REFL alpha, cut out by a candleAmber rim (inkHand), whole to the cuff
      alpha: 0.5,
      light: 0.3,
      ripple: 0.8,
      fade: { cx: 760, cy: 360, r0: 150, r1: 300 },
      draw: (c, env) => {
        inkHand(c, pose, env, { lit: Math.min(1, ms.lit), rimPx: 1.8 });
        if (!ms.laid) drawMatch(c, env, ms);
      },
    });
  }
}

/** the out candle's burned sleeve (round 4): a clean DARK ghost, darker than the stub (ink ≈ 60 % on the detail
 *  sheet), its rings scored in candleAmber hairlines; on 'two' the two ring lines brighten in turn, 0.15 s apart, so the
 *  count is SHOWN (each band warms under its line, from the side facing the living flame) */
function scoredSleeve(c: C, env: PaintEnv, o: ReflCandle, tq: number, b: B, outK: number) {
  const m = env.mood;
  const s = o.s;
  const w = 38 * s;
  const top = o.y - 45 * RING * s;
  const x0 = o.x - w / 2;
  const amber = mixLab(m.rim, m.core, 0.3);
  c.save();
  c.fillStyle = withAlpha(mixLab(m.ink, '#000000', 0.3), 0.6 * outK);
  c.fillRect(x0, top, w, o.rings * RING * s);
  // the hairlines: the sleeve's top edge, the score between the rings, and the line where the sleeve meets the stub
  for (let i = 0; i <= o.rings; i++) {
    const y = top + i * RING * s;
    c.fillStyle = withAlpha(amber, 0.5 * outK);
    c.fillRect(x0, y - 0.45 * s, w, 0.9 * s);
  }
  c.strokeStyle = withAlpha(amber, 0.35 * outK);
  c.lineWidth = 0.8 * s;
  c.strokeRect(x0, top, w, o.rings * RING * s);
  // 'two': ring 1, then ring 2 (0.15 s later), each band lit and its lower line bright
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < o.rings; i++) {
    const at = b.two - 0.05 + i * 0.15;
    const k = win(tq, at, at + 0.1) * (1 - 0.55 * win(tq, at + 1.6, at + 3.2));
    if (k <= 0.01) continue;
    const y = top + i * RING * s;
    const g = c.createLinearGradient(x0, 0, x0 + w, 0);
    g.addColorStop(0, withAlpha(amber, 0.62 * k));
    g.addColorStop(1, withAlpha(amber, 0.16 * k));
    c.fillStyle = g;
    c.fillRect(x0 + 1, y + 1.1 * s, w - 2, RING * s - 2.2 * s);
    c.fillStyle = withAlpha(mixLab(m.core, amber, 0.3), 0.95 * k);
    c.fillRect(x0 - 1.5 * s, y + RING * s - 0.7 * s, w + 3 * s, 1.4 * s);
  }
  c.restore();
}

// ------------------------------------------------------------------------------------------- the dissent tags
/** the three paper tags on long threads (review r1): each swings in from its side on its beat (tag1, tag2, 'two')
 *  and settles, turning gently; they hang in the chokepoint candle's light and are lit BY that flame (bright on the
 *  side facing it, falling off with distance), and stay lit through the tail. Lettering horizontal, 17 / 14.5 px on
 *  the reflection plane at lens 1.5 (≥ 26 / 22.5 px cap at 1080p) */
function tags(f: Frame, t: number, b: B) {
  const tq = tq12(t);
  const chokeAt = candleFlameAt(chokeCandle({ rings: 2 + 0.35 * (t / b.D) }));
  const dip = win(tq, b.steady - 0.5, b.steady - 0.1) * (1 - win(tq, b.steady + 0.2, b.steady + 0.9));
  const flameK = 1 - 0.5 * dip;
  f.layer(REFL, (c) => {
    const env = reflEnv(f);
    const m = env.mood;
    TAGS.forEach((tg, i) => {
      const u = tq - (b.lit[i] - 0.1);
      if (u <= 0) return;
      const L = tg.top - PIVOT_Y;
      // the swing: in from its side, a damped pendulum, then a gentle idle turn
      const th = tg.from * 0.42 * Math.exp(-u * 1.9) * Math.cos(u * 3.4) + 0.012 * Math.sin(tq * 0.8 + i * 2);
      const a = sm(u / 0.25);
      const px = tg.x, py = PIVOT_Y;
      const ex = px + Math.sin(th) * L, ey = py + Math.cos(th) * L;
      const w = tg.w, h = TAG_H;
      // its light: from the chokepoint flame, by distance
      const cx = ex, cy = ey + h / 2;
      const dist = Math.hypot(cx - chokeAt.x, cy - chokeAt.y);
      const lit = Math.max(0.35, Math.min(1, 1.25 - dist / 380)) * flameK;
      c.save();
      c.globalAlpha = a * 0.94;
      c.strokeStyle = withAlpha(mixLab(m.ink, m.set, 0.2), 0.8);
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(px, py);
      c.lineTo(ex, ey);
      c.stroke();
      // the flame's light around the tag (a warm spill on the glass behind it)
      c.save();
      c.globalCompositeOperation = 'lighter';
      const gl = c.createRadialGradient(cx, cy, 10, cx, cy, w * 0.8);
      gl.addColorStop(0, withAlpha(m.halo, 0.12 * lit));
      gl.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = gl;
      c.fillRect(cx - w, cy - w, w * 2, w * 2);
      c.restore();
      c.translate(ex, ey);
      c.rotate(-th);
      // the paper: lit on the side facing the flame, falling off across it
      const fx = chokeAt.x - cx;
      const litPaper = mixLab(m.setHaze, m.halo, 0.8);
      const shade = mixLab(mixLab(m.ink, m.set, 0.5), litPaper, 0.45);
      const near = mixLab(shade, litPaper, lit);
      const far = mixLab(shade, litPaper, lit * 0.62);
      const g = c.createLinearGradient(fx < 0 ? -w / 2 : w / 2, 0, fx < 0 ? w / 2 : -w / 2, 0);
      g.addColorStop(0, near);
      g.addColorStop(1, far);
      c.fillStyle = withAlpha(m.ink, 0.3);
      c.fillRect(-w / 2 + 3, 3, w, h);
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(-w / 2, 6);
      c.lineTo(-w / 2 + 6, 0);
      c.lineTo(w / 2 - 6, 0);
      c.lineTo(w / 2, 6);
      c.lineTo(w / 2, h);
      c.lineTo(-w / 2, h);
      c.closePath();
      c.fill();
      // the flame-facing edge catches a rim
      c.fillStyle = withAlpha(mixLab(m.core, m.rim, 0.4), 0.7 * lit);
      if (fx < 0) c.fillRect(-w / 2, 6, 1, h - 6);
      else c.fillRect(w / 2 - 1, 6, 1, h - 6);
      // the eyelet
      c.fillStyle = mixLab(m.ink, litPaper, 0.3);
      c.beginPath();
      c.arc(0, 5.5, 1.8, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = mixLab(m.ink, litPaper, 0.06);
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      const n = tg.lines.length;
      const y0 = n === 2 ? 38 : 30;
      tg.lines.forEach((ln, k) => {
        c.font = k === 0 ? `700 17px ${FONT.mono}` : `500 14.5px ${FONT.mono}`;
        c.fillText(ln, 0, k === 0 ? y0 : y0 + 6 + k * 19);
      });
      c.restore();
    });
  });
}
