/**
 * ch13-s01 — the case reopens: Geoffrey Hinton takes his own 30-to-50-years slip off the Wall; it darkens and
 * curls in his hand; the new question is asked (candleAmber in the study → duskRose on the 2012 candle's stage;
 * 26.33 s; in: lampChange, the chapter break).
 *
 * CAMERA: WALL (a slow lateral truck along the Wall of Forecasts to W6) → the FLAME PUSH anchored on the slip
 * (1.2 s push to lens 1.6, bloom up, candleAmber → duskRose) → the 2012 candle's paper stage, where the same Wall
 * stands huge as a flat behind the action plane.
 *   0 → 1.2     wordless truck right: Turing's curled slip, the chess slip's bare pin, Rosenblatt, Florence,
 *               Coulom; the CHAPTER INDEX TAB 'The Case Reopened' drops at 0.1, holds 2.5 s
 *   'slip'      the truck settles on W6, the slip half in shadow: a faint rim on its curled corner; the lamp's edge
 *               finds the typed line 30 TO 50 YEARS OR EVEN LONGER (no date of pinning); a slow creep in while the
 *               pool narrows onto it (the 3.3 s HEAD-HOLD is a moving beat, never a frozen frame)
 *   'through'   the push through the slip's paper grain (1.2 s), timed to land as the first line begins (L1302 − 1.25 s,
 *               never before the script's beat), onto the stage: the 2012 candle LEARNED FEATURES,
 *               GIVEN DATA AND ARITHMETIC (eleven rings of sleeve), the tall man in its pool facing the Wall flat;
 *               the date 1 MAY 2023
 *   'reach'     his near hand rises to the pin (name card)
 *   'lift'      the slip comes off its pin in one slow arc on twos; the bare pin glints
 *   'own'       he lowers it and looks at it; hold
 *   'quote'     the quote card rises beside him (verbatim, NYT, 1 May 2023)
 *   'nolonger'  the slip's paper darkens and curls in his hand
 *   'question'  the card fades; hold on him with the darkened slip; the bare pin glints once
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at a pitch of 6 px per ring
 * at L3 (270 px), its flame on the top ring and a small tag at its base giving the year it was lit. It burns down
 * one ring per year the belief is held; the burned wax stays above the stub as a ghost sleeve (sleeve = years).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose, ShotScene } from '../../../film';
import { LAYERS, PUPPET_NEAR_BLACK, blendPose, defineShot, mixLab, nameCard, toLayer, withAlpha, withLife } from '../../../film';
import { STUDY, studyCase, studyRoom, wallSlotWorld } from '../sets/study';
import { wallStateAt } from '../sets/studyState';
import { WALL_SLOTS } from '../sets/wallOfForecasts';
import { XRAY } from '../sets/xrayColumn';
import { indexTab } from '../sets/indexTab';
import { frameOn, paperGrain, wallPool } from '../sets/ch09-s03a-kit';
import { monotone } from '../sets/ch02-s05b-util';
import {
  HINTON13, LEARNED23, LOOK, REACH, ST13, STAND13, W6_CENTRE, W6_PIN, W7F, WALL13_K, darkW7,
  HELD_K, SHIFT13, barePin, bloom, heldSlip, longShadow, monoDate, quoteCardAt, screen, stage13, tq12, win, sm, clamp01, lerp,
} from '../sets/ch13-s01-kit';

const ID = 'ch13-s01';
type C = CanvasRenderingContext2D;

const W6W = wallSlotWorld('W6');
const W7W = wallSlotWorld('W7');
/** W7 on the stage's wall flat */
const W6S = WALL_SLOTS.W6;
const WALL_START = wallStateAt(ID, 'start');
const WALL_END = wallStateAt(ID, 'end');

interface B {
  D: number;
  slip: number;
  push0: number;
  stageT: number;
  reach: number;
  lift: number;
  low: number;
  own: number;
  quote: number;
  nolonger: number;
  /** 'longer' in 'I no longer think that': the slip has finished darkening */
  longer: number;
  question: number;
  /** the quote card's plate rises on 'Machines'; each line on its spoken word */
  qAt: number;
  qLines: number[];
}
interface Scene extends ShotScene {
  b: B;
  study: (t: number) => Camera3;
  stage: (t: number) => Camera3;
  SCAMS: Camera3[];
  GCAMS: Camera3[];
}

/** a camera path over (x, y, log k) keys, monotone (no overshoot) */
function framePath(keys: [number, number, number, number][]): (t: number) => Camera3 {
  const fx = monotone(keys.map((k) => [k[0], k[1]]));
  const fy = monotone(keys.map((k) => [k[0], k[2]]));
  const fk = monotone(keys.map((k) => [k[0], Math.log(k[3])]));
  return (t) => frameOn({ x: fx(t), y: fy(t) }, { x: 640, y: 360 }, Math.exp(fk(t)));
}

export default defineShot<Scene>({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    // HEAD-HOLD (round 1): the lead-in is 3.3 s, so the wordless study plays longer: the truck, a slow creep in on
    // the slip while the lamp's edge finds it, and the 1.2 s push timed to land as the first line begins
    const through = Math.max(T.beat('through'), T.line('L1302').start - 1.25);
    const b: B = {
      D,
      slip: T.beat('slip'),
      push0: through,
      stageT: through + 1.2,
      reach: T.beat('reach') - 0.15,
      lift: T.beat('lift'),
      low: T.beat('lift') + 1.4,
      own: T.beat('own'),
      quote: T.beat('quote'),
      nolonger: T.beat('nolonger'),
      longer: T.word('L1303', 'longer#2'),
      question: T.beat('question'),
      qAt: T.word('L1303', 'Machines') - 0.1,
      qLines: [T.word('L1303', 'I') - 0.1, T.word('L1303', 'years') - 0.1, T.word('L1303', 'Obviously') - 0.1, T.word('L1303', 'think') - 0.1],
    };
    const obviously = T.word('L1303', 'Obviously');
    // ---- the study: the truck along the Wall, the settle on W6, the push (z) — lens is added in paint
    // round 1: a tighter WALL truck, starting at 0.3 s, so Florence's and Coulom's slips pass legibly before the
    // settle on W6 (the X-ray box at frame left is cropped out)
    const study = framePath([
      [0, 1548, 318, 2.05],
      [0.3, 1552, 320, 2.05],
      [b.slip + 0.35, 1694, 350, 2.2],
      [b.push0, 1712, W6W.y - 4, 2.3],
      [b.stageT, W6W.x - 6, W6W.y + 6, 4.4],
    ]);
    // where his hands hold the slip (LOOK), and the bare pin: the targets of the late push and the lift
    const hand = HINTON13.anchor({ x: ST13.hx, y: ST13.floorY, facing: 'right', pose: LOOK }, 'handF');
    const qx = lerp(676, hand.x + 30, 0.35), qy = lerp(382, hand.y + 40, 0.3);
    // ---- the stage: land on the slip (matching the push), pull back to the medium, a slow lean in, ease back
    const stage = framePath([
      [b.stageT, W6_CENTRE.x, W6_CENTRE.y, 2.5],
      [b.stageT + 1.7, 660, 392, 1.16],
      [b.own, 668, 386, 1.3],
      [b.quote + 1, 672, 383, 1.31],
      // a slow creep through the quotation, then on 'Obviously' a 7% push onto the slip and his hands as it darkens
      [obviously - 0.3, 678, 381, 1.335],
      [b.longer + 0.7, qx, qy, 1.43],
      [b.question - 0.25, qx + 2, qy, 1.435],
      // on 'question' his head lifts toward the bare pin and the camera drifts up with it
      [b.question + 2.2, lerp(qx, W6_PIN.x, 0.22), qy - 30, 1.44],
      [D, lerp(qx, W6_PIN.x, 0.26), qy - 34, 1.44],
    ]);
    const SCAMS: Camera3[] = [];
    for (let i = 0; i <= 30; i++) SCAMS.push(study((b.push0 * i) / 30));
    const GCAMS: Camera3[] = [];
    for (let i = 1; i <= 30; i++) GCAMS.push(stage(b.stageT + ((D - b.stageT) * i) / 30));
    tl.hold(0, D);
    return { tl, b, study, stage, SCAMS, GCAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    if (t < b.stageT) paintStudy(f, sc, t);
    else paintStage(f, sc, t);
    // the bright pass over the push's cut: rises into the slip, peaks on the cut, falls as the stage pulls back.
    // Held well below paper white (the peak frame tops out near 70% luminance), so the grain and the slip's type
    // still read through it.
    const flash = t < b.stageT ? win(t, b.stageT - 0.45, b.stageT) : 1 - win(t, b.stageT, b.stageT + 0.45);
    bloom(f, 0.45 * flash);
    const env = { t, mood: f.mood };
    screen(f, (c) => {
      indexTab(c, { title: 'The Case Reopened', number: 13, at: 0.1, hold: 2.5 }, env);
      // the date holds about 3 s, overlapping the name card's rise (opposite corners)
      monoDate(c, '1 MAY 2023', b.stageT + 0.2, 3.0, env);
      // the script's card is the name alone; right-aligned under the quote area, clear of the candle and its tag
      nameCard(c, { name: 'Geoffrey Hinton', role: '', at: b.reach + 0.15, dur: 3.6, align: 'right', x: 1150, y: 600 }, env);
      // the plate rises on 'Machines'; each line lands on its spoken word (I · years · Obviously · think)
      quoteCardAt(c, {
        quote: 'I thought it was 30 to 50 years or even longer away. Obviously, I no longer think that.',
        speaker: 'Geoffrey Hinton',
        source: 'The New York Times, 1 May 2023',
        x: 1010,
        y: 300,
        width: 400,
        maxChars: 30,
        size: 27,
        at: b.qAt,
        dur: b.question - b.qAt + 0.2,
        lineAt: b.qLines,
      }, env);
    });
  },
});

// ===================================================================================================== THE STUDY
function paintStudy(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const base = sc.study(t);
  // the push: lens up to 1.6 over the same 1.2 s
  const pu = win(t, b.push0, b.stageT);
  const cam = { ...base, lens: lerp(1, 1.6, pu * pu) };
  f.camera(cam);
  if (t > b.push0) f.setMood('duskRose', { from: 'candleAmber', u: pu });
  studyRoom(f, { key: ID, cams: sc.SCAMS, outside: { mood: 'duskRose', kind: 'night' } });
  // the slip: deep shadow (the W6 rule) until the lamp's edge finds its corner on 'slip'; lit as we push into it
  const find = win(t, b.slip - 0.2, b.slip + 0.6);
  const sh = 1 - 0.5 * find - 0.5 * win(t, b.push0, b.push0 + 0.7);
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: false,
    flames: false,
    // the X-ray lightbox stays in the room's geography but low (vellum, not a cyan accent in the Wall's truck)
    xray: { light: 0.1 },
    wall: { hide: ['W6', 'W7'], glint: { W5: 0.35 * (1 - win(t, 0.4, 1.4)) } },
    extra: (c, env) => {
      // the X-ray lightbox sits outside the lamp's pool here: a shadow over it, so its vellum glows low and the
      // Wall stays the subject of the truck
      boxShade(c, env);
      // the far end: Hinton's 2017 slip sits in the dark, unvisited
      darkW7(c, env, W7W.x, W7W.y, STUDY.wall.k, 0.5);
      heldSlip(c, env, { x: W6W.x, y: W6W.y, k: STUDY.wall.k, light: 0.55 + 0.35 * find, shadow: sh, pin: true, curl: 0.55 });
      // the faint rim on its curled corner
      rimCorner(c, env, find * (1 - win(t, b.push0, b.push0 + 0.5)));
    },
  });
  // the lamp's pool narrows onto W6 as the truck settles (the rest of the Wall a stop darker)
  wallPool(f, cam, { x: lerp(1600, W6W.x, sm(t / b.slip)), y: W6W.y }, lerp(420, 260, find), 1, 0.55 + 0.35 * find);
  // the push into the paper grain: a veil over the slip (its type still reads through), never a white-out
  // the green banker's lamp: its glass shade rises out of focus into the frame's lower right (L5), its warm
  // light spilling up the Wall; it slides away as the push goes in
  bankerShade(f, t, b.push0, 1 - win(t, b.push0, b.push0 + 0.5));
  paperGrain(f, 0.48 * win(t, b.stageT - 0.55, b.stageT), '#b89d76', 13);
}

/** the out-of-focus green glass shade of the banker's lamp low in the frame's right corner (L5). Screen-anchored
 *  with a short drift against the truck (the near plane slides faster than the Wall), blurred and kept dark: only
 *  its lit rim and a muted green glass read */
function bankerShade(f: Frame, t: number, until: number, a: number) {
  if (a <= 0.01) return;
  const drift = -150 * sm(t / Math.max(0.1, until));
  const p = toLayer(LAYERS.L5, f.cam, 1170 + drift, 700);
  const q = toLayer(LAYERS.L5, f.cam, 1170 + drift + 220, 700);
  const R = q.x - p.x;
  f.layer('L5', (c, env) => {
    const m = env.mood;
    c.save();
    c.globalAlpha *= a * 0.92;
    c.filter = `blur(${(5 * env.pxScale).toFixed(1)}px)`;
    // the warm cone it throws up the wall (behind the shade)
    c.globalCompositeOperation = 'lighter';
    const up = c.createRadialGradient(p.x, p.y - R * 0.35, R * 0.1, p.x, p.y - R * 0.35, R * 2.2);
    up.addColorStop(0, withAlpha(m.halo, 0.22));
    up.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = up;
    c.fillRect(p.x - R * 2.2, p.y - R * 2.6, R * 4.4, R * 4.4);
    c.globalCompositeOperation = 'source-over';
    // the shade: a long half-cylinder of green glass, seen from below its rim
    const glass = mixLab(mixLab('#2f5a3a', m.fg, 0.55), m.halo, 0.08);
    const g = c.createLinearGradient(0, p.y - R * 0.42, 0, p.y + R * 0.1);
    g.addColorStop(0, mixLab(glass, m.fg, 0.45));
    g.addColorStop(0.7, glass);
    g.addColorStop(1, mixLab(glass, m.halo, 0.4));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(p.x - R, p.y + R * 0.08);
    c.bezierCurveTo(p.x - R * 0.96, p.y - R * 0.38, p.x - R * 0.55, p.y - R * 0.46, p.x, p.y - R * 0.46);
    c.bezierCurveTo(p.x + R * 0.55, p.y - R * 0.46, p.x + R * 0.96, p.y - R * 0.38, p.x + R, p.y + R * 0.08);
    c.closePath();
    c.fill();
    // the lit rim of the glass where the bulb glows through it
    c.strokeStyle = withAlpha(mixLab(m.core, '#bfe0b4', 0.3), 0.45);
    c.lineWidth = R * 0.03;
    c.beginPath();
    c.moveTo(p.x - R * 0.98, p.y + R * 0.06);
    c.lineTo(p.x + R * 0.98, p.y + R * 0.06);
    c.stroke();
    // the brass finial on top
    c.fillStyle = mixLab(m.fg, m.halo, 0.2);
    c.beginPath();
    c.arc(p.x, p.y - R * 0.5, R * 0.05, 0, Math.PI * 2);
    c.fill();
    c.restore();
  });
}

/** the shadow over the X-ray lightbox (it stands between the board and the Wall, outside the pool) */
function boxShade(c: C, env: PaintEnv) {
  const X = STUDY.xray;
  // exactly the cabinet (frame 14 px each side), so no shadow edge shows on the wall
  const w = (XRAY.w + 28) * X.s, top = X.y - (XRAY.h + 14) * X.s;
  c.save();
  c.fillStyle = withAlpha(mixLab(env.mood.fg, '#000000', 0.5), 0.9);
  c.fillRect(X.x - w / 2, top, w, X.y + 40 * X.s - top);
  c.restore();
}

function rimCorner(c: C, env: PaintEnv, a: number) {
  if (a <= 0.01) return;
  const k = STUDY.wall.k;
  const x = W6W.x + (W6S.w * k) / 2 - 6, y = W6W.y + (W6S.h * k) / 2 - 8;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, 26);
  g.addColorStop(0, `rgba(255,226,170,${(0.32 * a).toFixed(3)})`);
  g.addColorStop(1, 'rgba(255,226,170,0)');
  c.fillStyle = g;
  c.fillRect(x - 30, y - 30, 60, 60);
  c.strokeStyle = `rgba(255,226,170,${(0.55 * a).toFixed(3)})`;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x - 18, y + 7);
  c.quadraticCurveTo(x - 4, y + 2, x + 4, y - 12);
  c.stroke();
  c.restore();
  void env;
}

// ===================================================================================================== THE STAGE
/** his pose and the slip's state at time t */
function hintonAt(b: B, t: number): { pose: Pose; held: number } {
  const tq = tq12(t);
  let p: Pose;
  let held = 0;
  if (tq < b.reach) p = STAND13;
  else if (tq < b.lift) p = blendPose(STAND13, REACH, sm((tq - b.reach) / Math.max(0.3, b.lift - b.reach - 0.1)));
  else {
    // one slow arc down to the chest, on twos
    p = blendPose(REACH, LOOK, sm((tq - b.lift) / (b.low - b.lift)));
    held = 1;
  }
  // after the quote begins: the head settles a touch lower (reading); on the question, lifts slightly toward the Wall
  const read = win(tq, b.nolonger - 0.3, b.nolonger + 0.8) * (1 - win(tq, b.question - 0.2, b.question + 0.9));
  const up = win(tq, b.question - 0.2, b.question + 0.9);
  p = { ...p, angles: { ...p.angles, head: (p.angles.head ?? 0) + 4 * read - 10 * up * held, neck: (p.angles.neck ?? 0) - 6 * up * held } };
  return { pose: withLife({ ...p }, tq, 2023, 0.9), held };
}

function paintStage(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const cam = sc.stage(t);
  f.camera(cam);
  f.setMood('duskRose');
  const { pose, held } = hintonAt(b, t);
  const o = { x: ST13.hx, y: ST13.floorY, facing: 'right' as const, pose };
  const hand = HINTON13.anchor(o, 'handF');
  const glint = pulse(t, b.lift + 0.05, 0.12, 0.9);
  // on 'question': a short specular pop on the bare pin (0.4 s), in the same glance as the slip he holds
  const pop = pulse(t, b.question - 0.06, 0.12, 0.7);
  // on 'Obviously … no longer': the slip darkens and curls, landing on the words
  const dark = win(t, b.nolonger - 0.2, b.longer);
  const lightDir = { x: -1, y: -0.15 };
  stage13(f, {
    key: ID,
    cams: sc.GCAMS,
    candle: LEARNED23,
    candleX: ST13.candleX,
    s: ST13.s,
    letters: 0.85,
    poolRx: 470,
    depth: { fogA: 0.26, wallRim: 1, curtain: 'right', curtainW: 104, lipY: 694 },
    wall: {
      slips: WALL_START,
      hide: ['W6', 'W7'],
      shift: SHIFT13,
      extra: (c, env) => {
        darkW7(c, env, W7F.x, W7F.y, WALL13_K, 0.5);
        if (!held) heldSlip(c, env, { x: W6_CENTRE.x, y: W6_CENTRE.y, k: WALL13_K, light: 0.72, pin: true, curl: 0.5 });
        else {
          barePin(c, env, W6_PIN.x, W6_PIN.y, WALL13_K, Math.min(1, glint));
          if (pop > 0.01) {
            barePin(c, env, W6_PIN.x, W6_PIN.y, WALL13_K * 1.6, pop);
            specular(c, env, W6_PIN.x - 1, W6_PIN.y - 1, pop);
          }
        }
      },
    },
    draw: (c, env, g) => {
      longShadow(c, env, ST13.hx, ST13.candleX, (cc) => HINTON13.draw(cc, { ...o, x: 0, y: 0, ink: PUPPET_NEAR_BLACK }, env), 1.1);
      if (held) {
        // the slip hangs from his pinch (behind his fingers), swinging a little as it comes down, then held up to read
        const u = sm((tq12(t) - b.lift) / (b.low - b.lift));
        const swing = Math.sin(clamp01((tq12(t) - b.lift) / 1.8) * Math.PI * 2.5) * 0.08 * (1 - clamp01((tq12(t) - b.lift) / 2));
        const rot = lerp(0, -0.18, u) + swing;
        const k = WALL13_K * lerp(1, HELD_K, u);
        const hang = (W6S.h / 2 - 9) * k;
        heldSlip(c, env, {
          x: hand.x - Math.sin(rot) * hang + 2,
          y: hand.y + Math.cos(rot) * hang,
          k,
          rot,
          light: 0.78 - 0.45 * dark,
          dark,
          curl: 0.5 + 0.5 * dark,
        });
      }
      HINTON13.draw(c, { ...o, ink: PUPPET_NEAR_BLACK, light: { ...lightDir, floor: 0.12 }, edgeRim: { x: -1, y: -0.35, px: 1.6, alpha: 0.7 } }, env);
      void g;
    },
  });
}

/** a crisp specular star on a pin head (about 6 px), with a small soft halo */
function specular(c: C, env: PaintEnv, x: number, y: number, a: number) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  const core = mixLab(env.mood.core, '#ffffff', 0.5);
  // round 1: about 2.5x the earlier pop, so it reads at sheet scale
  const g = c.createRadialGradient(x, y, 0, x, y, 40);
  g.addColorStop(0, withAlpha(core, 1 * a));
  g.addColorStop(0.25, withAlpha(env.mood.core, 0.5 * a));
  g.addColorStop(1, withAlpha(env.mood.core, 0));
  c.fillStyle = g;
  c.fillRect(x - 40, y - 40, 80, 80);
  c.fillStyle = withAlpha(core, a);
  const r = 18, q = 1.8;
  c.beginPath();
  c.moveTo(x - r, y);
  c.lineTo(x - q, y - q);
  c.lineTo(x, y - r);
  c.lineTo(x + q, y - q);
  c.lineTo(x + r, y);
  c.lineTo(x + q, y + q);
  c.lineTo(x, y + r);
  c.lineTo(x - q, y + q);
  c.closePath();
  c.fill();
  c.restore();
}

function pulse(t: number, at: number, rise: number, fall: number): number {
  if (t <= at) return 0;
  if (t < at + rise) return sm((t - at) / rise);
  return 1 - sm((t - at - rise) / fall);
}

void WALL_END;
