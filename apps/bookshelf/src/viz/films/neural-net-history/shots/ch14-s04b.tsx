/**
 * ch14-s04b — the struck match. In the study window's reflection over the strait (a SHELF macro, in the glass): a
 * match lettered COMPUTE MATTERS LESS? flares for one day and is shaken out; the chokepoint candle steadies and burns
 * on under three dissent tags; the one-to-three-years candle blows out at two rings (winterBlue outside, the
 * reflection candleAmber; 18.21 s; in: cut).
 *
 *   match   'struck'      the hands strike the match: it flares (the one warm alarm, a practical), burns down
 *   smoke   'chokepoint'  shaken out: one day's flare, a thin curl of smoke; both 2022 candles lean in its draught;
 *                         the blackened match is laid on the shelf between them
 *   steady  'burns'       the chokepoint candle flickers low, then steadies
 *   tag1    'argued'      DECISIVE · AMODEI (ANTHROPIC), KHAN (EX-NSC) swings into its light
 *   tag2    after 'over'  HELPS HUAWEI · HUANG (NVIDIA) swings in opposite (in the breath opened after 'over')
 *   out     'trailing'    the draught blows the CHINA IS ONE TO THREE YEARS BEHIND candle out cleanly: a thread of
 *                         smoke, a clean dark two-ring sleeve (no fray), its tag now OCT 2022 – JAN 2025 · ≈ 2
 *   two     'two'         the dark two-ring sleeve catches the living flame's light; SELF-DEFEATING · CHINA'S
 *                         FOREIGN MINISTRY swings in
 *   hold                  the blackened match on the shelf between the dark stub and the living flame, the tags turning
 * The strait and both shores lie soft beyond the glass in the cold haze (the lens is focused on the reflection).
 * CANDLE-CLOCK RULE · CANDLE PLACEMENT · WINDOW RULE (sets/ch14-s01-strait).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { FONT, defineShot, mixLab, withAlpha } from '../../../film';
import { hands } from '../cast';
import { REFL, candleFlameAt, clamp01, glassReflection, lerp, monotone, reflCandle, reflEnv, sm, smokeCurl, strait, tq12, win, windowFrame, type P } from '../sets/ch14-s01-strait';
import { flame as flameShape } from '../../../film/silhouette/props/_kit';
import { SHELF_R, behindCandle, chokeCandle, shelfRefl } from '../sets/ch14-s02-shelf';
import { blurRect } from '../sets/ch02-s05b-util';

const ID = 'ch14-s04b';
type C = CanvasRenderingContext2D;

const MATCH_REST: P = { x: (SHELF_R.choke + SHELF_R.behind) / 2 + 2, y: SHELF_R.y - 2 };
const HOLD_AT: P = { x: 668, y: 356 };
/** the three dissent tags hang on threads from above the glass, in a tight arc around the chokepoint flame (screen
 *  ≈ 540, 200): upper-left, above-between the two flames, lower-left; clear of the other candles. `at` = where the
 *  tag's top hangs (L2), the thread's pivot sits at the top of the glass straight above it */
const TAGS = [
  { lines: ['DECISIVE', 'AMODEI (ANTHROPIC),', 'KHAN (EX-NSC)'], at: { x: 512, y: 262 }, side: -1 },
  { lines: ['HELPS HUAWEI', 'HUANG (NVIDIA)'], at: { x: 645, y: 222 }, side: 1 },
  { lines: ['SELF-DEFEATING', 'CHINA’S FOREIGN', 'MINISTRY'], at: { x: 494, y: 334 }, side: -1 },
] as const;

interface B {
  D: number;
  match: number;
  smoke: number;
  steady: number;
  tag1: number;
  tag2: number;
  out: number;
  two: number;
  hold: number;
}
interface Scene {
  tl: Timeline;
  b: B;
  lens: (t: number) => number;
  [k: string]: unknown;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = { D, match: T.beat('match'), smoke: T.beat('smoke'), steady: T.beat('steady'), tag1: T.beat('tag1'), tag2: T.beat('tag2'), out: T.beat('out'), two: T.beat('two'), hold: T.beat('hold') };
    const lens = monotone([[0, 1.78], [b.out, 1.86], [D, 1.92]]);
    tl.hold(0, D);
    return { tl, b, lens };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const cam: Camera3 = { x: 646, y: 380 + 6 * sm(t / b.D), z: 0, lens: sc.lens(t) };
    f.camera(cam);
    // the strait beyond the glass: present, cold, soft (focus is on the reflection)
    strait(f, { key: 'ch14', moodKey: 'winterBlue', sunX: 640, sunI: 0.5, stones: [], lantern: 0.8 });
    blurRect(f, 0, 0, 1280, 720, 2.6, 1);
    reflection(f, t, b);
    tags(f, t, b);
    windowFrame(f, {});
  },
});

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
  const shake = b.smoke;
  const lay0 = shake + 0.35, lay1 = shake + 1.05;
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
  if (tq >= b.match - 0.03 && tq < shake + 0.12) {
    const k = tq - b.match;
    lit = k < 0.25 ? 1.45 - k * 1.6 : lerp(1.05, 0.72, clamp01((k - 0.25) / Math.max(0.2, shake - b.match - 0.25)));
    if (tq >= shake) lit *= 1 - (tq - shake) / 0.12;
  }
  const burnt = clamp01((tq - b.match) / Math.max(0.3, shake - b.match)) * 0.2;
  const opts = { scale: 0.38, entry: { R: { x: 1000, y: 610 }, L: { x: 950, y: 650 } }, strikeAt: { x: SHELF_R.behind + 92, y: SHELF_R.y - 74 } };
  let pose = u >= 0 && u < 1 ? hands.act('strikeLight', u, target, opts) : null;
  if (pose?.right) pose = { ...pose, right: { ...pose.right, held: 'none' as const, shape: tq >= lay1 - 0.05 ? ('open' as const) : pose.right.shape } };
  return { pose, lit: Math.max(0, lit), burnt, laid: tq >= lay1 - 0.05 };
}

const MATCH_L = 68;
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
    c.fillRect(-3, -2.6, L + 3, 5.2);
    c.fillStyle = m.ink;
    c.fillRect(L * 0.6, -2.6, L * 0.4, 5.2);
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
  } else {
    c.fillStyle = mixLab(m.halo, m.set, 0.35);
    c.fillRect(-3, -2.6, L + 3, 5.2);
    c.fillStyle = mixLab(m.ink, m.set, 0.15);
    c.fillRect(L * (1 - ms.burnt), -2.6, L * ms.burnt, 5.2);
    c.fillStyle = ms.lit > 0 ? mixLab(m.ink, m.halo, 0.3) : m.ink;
    c.beginPath();
    c.ellipse(L + 1.5, 0, 4.4, 3.6, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(mixLab(m.ink, m.set, 0.1), 0.9);
  }
  c.font = `600 5.2px ${FONT.mono}`;
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
function reflection(f: Frame, t: number, b: B) {
  const tq = tq12(t);
  const ms = matchState(t, b);
  // draughts: the shake-out and the gust on 'trailing' lean both 2022 flames (the flames bend; the wax stands)
  const d1 = Math.max(0, tq - b.smoke), d2 = Math.max(0, tq - (b.out - 0.25));
  const lean = (tq >= b.smoke ? 13 * Math.exp(-d1 * 2.0) * Math.cos(d1 * 5) : 0) + (tq >= b.out - 0.25 ? 17 * Math.exp(-d2 * 1.8) * Math.cos(d2 * 4) : 0);
  // the chokepoint flame: flickers low on 'burns', steadies; its own sleeve keeps growing (two rings and more)
  const dip = win(tq, b.steady - 0.5, b.steady - 0.1) * (1 - win(tq, b.steady + 0.2, b.steady + 0.9));
  const chokeF = 1 - 0.62 * dip + 0.06 * Math.sin(t * 9.3) * dip;
  // CANDLE-CLOCK: pale cold wax stubs; the burned rings stand above as a DARK ghost sleeve (two rings each by now)
  const C1 = chokeCandle({ rings: 2 + 0.35 * (t / b.D), flame: chokeF, lean, tag: 'LIT 2022', wax: 'pale', sideLight: { x: SHELF_R.behind, k: 0 } });
  // the behind candle: out cleanly on 'trailing' (no fray), a curl of smoke, the dark two-ring sleeve; on 'two' the
  // living flame's light lifts that sleeve's edges warm, so 'about two' is visibly two rings
  const outK = clamp01((tq - b.out) / 0.25);
  const isOut = outK >= 1;
  const glow = win(t, b.two - 0.15, b.two + 0.45) * (1 - 0.35 * win(t, b.two + 1.5, b.two + 3));
  const C2 = behindCandle({
    rings: 2,
    state: isOut ? 'out' : 'live',
    flame: 1 - outK,
    lean: lean * 1.3,
    smoke: isOut ? win(t, b.out + 0.1, b.out + 0.5) * (1 - win(t, b.out + 2.2, b.out + 3.4)) : 0,
    tag: tq >= b.out + 0.3 ? 'OCT 2022 – JAN 2025 · ≈ 2' : 'LIT 2022',
    sleeveGlow: isOut ? glow : 0,
    wax: 'pale',
    sideLight: { x: SHELF_R.choke, k: 0.55 * chokeF },
  });
  const w1 = candleFlameAt(C1), w2 = candleFlameAt(C2);
  const head = matchHead(ms);
  const old: P[] = [];
  glassReflection(f, {
    key: ID,
    rect: { x: 250, y: 150, w: 1000, h: 640 },
    res: f.pxScale * 1.95,
    alpha: 0.3,
    light: 0.58,
    ripple: 0.9,
    fade: { cx: 640, cy: 400, r0: 300, r1: 640 },
    draw: (c, env) => {
      old.push(...shelfRefl(c, env, ID));
      reflCandle(c, C1, env);
      reflCandle(c, C2, env);
      if (ms.laid) drawMatch(c, env, ms);
      // the match flame itself (the one warm alarm)
      if (head && ms.lit > 0) {
        c.save();
        c.translate(head.x + 2, head.y + 1);
        c.scale(1.8, 1.8);
        flameShape(c, env, 0, 0, 9 * Math.min(1.5, ms.lit), 41, 1.2);
        c.restore();
      }
      // the match's thin curl of smoke after the shake-out
      const sk = win(tq, b.smoke + 0.05, b.smoke + 0.4) * (1 - win(tq, b.smoke + 3, b.smoke + 5));
      const hp = ms.laid ? { x: MATCH_REST.x + MATCH_L / 2 + 4, y: MATCH_REST.y + 8 } : head;
      if (sk > 0.01 && hp) smokeCurl(c, env, hp, 60, 0.92, sk, 5);
    },
    glows: () => [
      ...old.map((p) => ({ x: p.x, y: p.y - 4, r: 46, a: 0.4 })),
      { x: w1.x, y: w1.y - 6, r: 64, a: 0.8 * chokeF },
      { x: w2.x, y: w2.y - 6, r: 64, a: 0.8 * (1 - outK) },
      // the match: the brightest bloom in the frame (a tight hot core, ≈ 60 px on screen, and a wider spill)
      ...(head && ms.lit > 0
        ? [
            { x: head.x + 3, y: head.y - 6, r: 36, a: Math.min(2.2, 1.6 * ms.lit) },
            { x: head.x + 3, y: head.y - 6, r: 110, a: 0.9 * Math.min(1.4, ms.lit) },
          ]
        : []),
      { x: w1.x, y: w1.y + 40, r: 520, a: 0.14 * chokeF + 0.1 * (1 - outK) },
    ],
  });
  // the hands and the match they hold: their own faint sheet on the same plane (WINDOW RULE: ≈ 35% alpha, small,
  // from the lower right; the forearms fade out long before the frame's right side)
  if (ms.pose) {
    const pose = ms.pose;
    glassReflection(f, {
      key: `${ID}-hands`,
      rect: { x: 420, y: 160, w: 640, h: 520 },
      res: f.pxScale * 1.95,
      alpha: 0.36,
      light: 0.24,
      ripple: 0.9,
      fade: { cx: 680, cy: 370, r0: 70, r1: 168 },
      draw: (c, env) => {
        hands.draw(c, pose, env);
        if (!ms.laid) drawMatch(c, env, ms);
      },
    });
  }
}

// ------------------------------------------------------------------------------------------- the dissent tags
/** three small paper tags on dark straight threads, swinging in one at a time to hang in a tight arc around the
 *  chokepoint candle's flame; drawn on the reflection plane, sharp (the lens is focused on the glass) */
function tags(f: Frame, t: number, b: B) {
  const at = [b.tag1, b.tag2, b.two];
  const PIVOT_Y = 60;
  f.layer(REFL, (c) => {
    const env = reflEnv(f);
    const m = env.mood;
    [2, 0, 1].forEach((i) => {
      const tg = TAGS[i];
      const tq = tq12(t);
      const u = tq - (at[i] - 0.05);
      if (u <= 0) return;
      const len = tg.at.y - PIVOT_Y;
      // released from the side, a long pendulum settles into the light, then turns gently
      const ang = tg.side * (0.3 * Math.exp(-u * 1.5) * Math.cos(u * 2.6)) + 0.006 * Math.sin(t * 0.7 + i * 2);
      const a = sm(u / 0.35);
      c.save();
      c.globalAlpha = a;
      c.translate(tg.at.x, PIVOT_Y);
      c.rotate(ang);
      c.strokeStyle = withAlpha(mixLab(m.ink, m.set, 0.2), 0.75);
      c.lineWidth = 0.7;
      c.beginPath();
      c.moveTo(0, -200);
      c.lineTo(0, len);
      c.stroke();
      c.translate(0, len);
      c.rotate(-ang * 0.5 + 0.03 * Math.sin(t * 0.9 + i));
      c.font = `600 9.4px ${FONT.mono}`;
      let w = c.measureText(tg.lines[0]).width;
      c.font = `500 8.4px ${FONT.mono}`;
      for (const ln of tg.lines.slice(1)) w = Math.max(w, c.measureText(ln).width);
      w += 12;
      const h = 9 + tg.lines.length * 9.6;
      const paper = mixLab(m.setHaze, m.halo, 0.75);
      c.fillStyle = withAlpha(m.ink, 0.3);
      c.fillRect(-w / 2 + 2, 2, w, h);
      c.fillStyle = paper;
      c.beginPath();
      c.moveTo(-w / 2, 4);
      c.lineTo(-w / 2 + 4, 0);
      c.lineTo(w / 2 - 4, 0);
      c.lineTo(w / 2, 4);
      c.lineTo(w / 2, h);
      c.lineTo(-w / 2, h);
      c.closePath();
      c.fill();
      c.fillStyle = mixLab(m.ink, paper, 0.3);
      c.beginPath();
      c.arc(0, 3.4, 1.2, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = mixLab(m.ink, paper, 0.06);
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      tg.lines.forEach((ln, k) => {
        c.font = k === 0 ? `600 9.4px ${FONT.mono}` : `500 8.4px ${FONT.mono}`;
        c.fillText(ln, 0, 10.5 + k * 9.6);
      });
      c.restore();
    });
  });
}
