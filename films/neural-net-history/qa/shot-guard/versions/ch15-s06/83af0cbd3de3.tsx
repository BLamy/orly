/**
 * ch15-s06 — the three holdouts, now. Hassabis's forecast is pinned at W8; then, through a flame, the paper stage of
 * the candles still burning in October 2026: Hassabis small in the pool of SCALE IS THE MAIN LEVER; Hinton and Bengio
 * in the light of SMARTER-THAN-HUMAN AI MAY BE YEARS AWAY, AND DANGEROUS; LeCun at the rim, facing out, his long
 * shadow on the floor. A held tableau. (candleAmber; 14.42 s; in: crossfade from the shelf of lamps' tilt up.)
 *
 *   b1 (0.3)   WALL: a brisk truck past W6 (bare pin) and W7 to the empty W8; the hands pin Hassabis's slip with a
 *              tap and withdraw; the slip's label (held through the shot)
 *   b1b        the FLAME CROSSFADE, moved to land just before 'three' (review round 3, story + historian: the silent
 *              Hassabis-on-stage beat is cut; Hassabis stays only as background texture, his W8 slip on the Wall flat):
 *              the study lamp becomes the stage's backlight; the Wall hangs at the back of the stage, W8 still legible
 *   'three'    L1509 opens straight on the three holdouts, all standing (their candle's pool opens); shared name card
 *   'now'      the old candle behind them, LEARNED FEATURES, GIVEN DATA AND ARITHMETIC, flares once and steadies
 *   'third'    LeCun's off-ramp card rises beside him at the rim, held through the music-only hold; under it, his
 *              2025 move as a 22 px label: left Meta, Nov 2025, to build world models · AMI Labs [e14-lecun]
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at a pitch of 6 px per ring at
 * L3 (270 px), its flame on the top ring and a small tag at its base giving the year it was lit. It burns down one
 * ring per year the belief is held; the burned wax stays above the stub as a ghost sleeve (sleeve = years).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv, Pose } from '../../../film';
import { LAYERS, PUPPET_NEAR_BLACK, POSES, defineShot, mixLab, nameCard, quoteCard, toScreen, withAlpha, withLife } from '../../../film';
import { softPlate } from '../../../film/silhouette/type';
import { cast, hands } from '../cast';
import { handsEntry } from '../sets/narratorHands';
import { STUDY, STUDY_CAMS, studyCase, studyNear, studyRoom, wallSlotWorld } from '../sets/study';
import { FINAL_SHELF, SLIPS, wallStateAt } from '../sets/studyState';
import { WALL_SLOTS, drawSlip, wallOfForecasts, wallSlotAt } from '../sets/wallOfForecasts';
import { beliefCandle, candleFlame } from '../sets/beliefCandle';
import { compositeSub, monotone, subFrame } from '../sets/ch02-s05b-util';
import { HINTON13, ST13, longShadow, stage13 } from '../sets/ch13-s01-kit';
import { bloom, clamp01, label15, lerp, pulse, screen, sm, tq12, win } from '../sets/ch15-s01-kit';

const ID = 'ch15-s06';
type C = CanvasRenderingContext2D;

// ===================================================================================================== the study
const W8V = SLIPS.find((s) => s.slot === 'W8')!;
const W8C = wallSlotWorld('W8');
const W8PIN = wallSlotAt(STUDY.wall, 'W8');
const WALL_START = wallStateAt(ID, 'start');
const W6U = (WALL_SLOTS.W6.x - WALL_SLOTS.W1.x) / (WALL_SLOTS.W8.x - WALL_SLOTS.W1.x);

// ===================================================================================================== the stage
const view = (id: string) => FINAL_SHELF.find((v) => v.id === id)!;
const WORRY = view('worry');
const SCALE = view('scale');
const LEARNED = view('learned');
const CHOKE = view('chokepoint');
const GAP = view('gap');
const MAIN = { x: 470, s: 1.5, poolRx: 400 };
/** upstage candles (L3 world): base y and positions */
const UP = { y: 604, s: 1.05, scale: 120, learned: 805, choke: 1080, gap: 1170 };
const BENGIO = cast['bengio-2020s'];
const LECUN = cast['lecun-2020s'];
/** Hinton and Bengio inside the bright pool of the SMARTER-THAN-HUMAN candle, a clear gap between them so the two
 *  profiles read apart (Bengio's curls and beard line, Hinton's height); LeCun ~250 px further, at the pool's rim,
 *  turned out (round head, glasses, stocky) (review round 2: the silhouettes, not only the captions, tell them apart) */
const POS = { hassabis: 214, hinton: 548, bengio: 652, lecun: 1010 };
/** the Wall flat at the back of the stage, shifted left so its new W8 slip clears LeCun's head in the wide */
const BACKDROP = { x: 322, y: 70 };

interface B {
  D: number;
  truck: number;
  pin: number;
  push: number;
  stage: number;
  three: number;
  now: number;
  third: number;
}
interface Scene {
  tl: Timeline;
  b: B;
  study: (t: number) => Camera3;
  stage: (t: number) => Camera3;
  SCAMS: Camera3[];
  GCAMS: Camera3[];
  [k: string]: unknown;
}

function frameOnLayer(L: Pick<LayerSpec, 'z'>, p: { x: number; y: number }, s: { x: number; y: number }, k: number): Camera3 {
  const z = L.z - L.z / k;
  const sa = (1000 * k) / L.z;
  return { x: 640 + (640 + (p.x - 640) * k - s.x) / sa, y: 360 + (360 + (p.y - 360) * k - s.y) / sa, z, lens: 1 };
}
function path(keys: [number, Camera3][]) {
  const ch = (sel: (c: Camera3) => number) => monotone(keys.map(([t, c]) => [t, sel(c)] as [number, number]));
  const fx = ch((c) => c.x), fy = ch((c) => c.y), fz = ch((c) => c.z);
  return (t: number): Camera3 => ({ x: fx(t), y: fy(t), z: fz(t), lens: 1 });
}

export default defineShot<Scene>({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      truck: T.beat('b1'),
      pin: T.beat('b1') + 0.2,
      // round 3: the flame crossfade lands just before 'three' (no silent Hassabis beat on the stage): the study holds
      // on the new slip, then the stage arrives with the three holdouts already standing in it
      push: T.beat('b2') - 1.07,
      stage: T.beat('b2') - 0.47,
      three: T.beat('b2'),
      now: T.beat('b3'),
      third: T.beat('b5'),
    };
    const study = path([
      [0, STUDY_CAMS.wall(W6U - 0.06, 380)],
      [b.truck + 0.95, STUDY_CAMS.wall(1.0, 400)],
      // push in on the new slip so its typed head (HASSABIS · 2025) reads at the 22 px floor before the flame
      [b.push, { ...STUDY_CAMS.wall(1.0, 540), x: W8C.x, y: W8C.y + 4 }],
      [b.stage, { ...STUDY_CAMS.wall(1.0, 660), x: W8C.x, y: W8C.y }],
    ]);
    const stage = path([
      // the stage opens wide on the three holdouts (round 3), then a slow push through the line and the hold
      [b.stage - 0.4, frameOnLayer(LAYERS.L4, { x: 616, y: 470 }, { x: 640, y: 420 }, 0.95)],
      [b.three + 2.6, frameOnLayer(LAYERS.L4, { x: 624, y: 470 }, { x: 640, y: 419 }, 0.975)],
      [b.third, frameOnLayer(LAYERS.L4, { x: 640, y: 470 }, { x: 640, y: 418 }, 1.0)],
      [D, frameOnLayer(LAYERS.L4, { x: 690, y: 466 }, { x: 640, y: 414 }, 1.06)],
    ]);
    const SCAMS: Camera3[] = [];
    for (let i = 0; i <= 16; i++) SCAMS.push(study((b.stage * i) / 16));
    const GCAMS: Camera3[] = [];
    for (let i = 0; i <= 24; i++) GCAMS.push(stage(b.stage - 0.4 + ((D - b.stage + 0.4) * i) / 24));
    tl.hold(0, D);
    return { tl, b, study, stage, SCAMS, GCAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const dis = win(t, b.stage - 0.45, b.stage + 0.2);
    if (dis < 1) {
      paintStudy(f, sc, t);
      if (dis > 0) compositeSub(f, subFrame(f, `${ID}/stage`, 'candleAmber', (g) => paintStage(g, sc, t)), dis);
    } else paintStage(f, sc, t);
    // the flame crossfade: a candle flame blooms to fill about a third of the frame at the mid-point (the study lamp
    // becoming the stage's backlight), then sinks into the stage's own light
    const fl = t < b.stage ? win(t, b.push, b.stage - 0.1) : 1 - win(t, b.stage - 0.1, b.stage + 0.7);
    bloom(f, 0.35 * fl);
    if (fl > 0.01) flameBloom(f, fl, t);
    const stageCam = sc.stage(t);
    screen(f, (c) => {
      const te = { t, mood: f.mood };
      // the slip's label: read in the study (low, on its own plate, clear of the slips); on the stage the slip itself
      // stays legible on the backdrop
      label15(c, { text: 'Hassabis, 2025 · AGI in 5 to 10 years · about even odds', x: 640, y: 604, at: b.pin + 0.45, until: b.stage - 0.65, size: 20 }, te);
      // one shared card, names in the figures' left-to-right order, laid under the pair with LeCun's name toward him
      // right-aligned inside the safe area (review round 2: it cropped to 'YANN LEC' at the frame edge)
      nameCard(c, { name: 'Geoffrey Hinton · Yoshua Bengio · Yann LeCun', role: '2018 Turing Award', at: b.three + 0.2, dur: b.third - b.three - 0.3, align: 'right', x: 1196, y: 602 }, te);
      const ql = clamp01(Math.min((t - b.third) / 0.6, 1));
      const lx = Math.min(1000, toScreen(LAYERS.L4, stageCam, POS.lecun + 150, 0).x);
      if (ql > 0) {
        c.save();
        c.globalAlpha = ql;
        softPlate(c, lx, 156, 560, 240, f.mood.ink, 0.6);
        c.restore();
      }
      quoteCard(c, {
        quote: 'an LLM is basically an off-ramp, a distraction, a dead end.',
        speaker: 'Yann LeCun',
        source: '2024',
        x: lx,
        // high and clear of LeCun's head (his round head and glasses must read against the light)
        y: 156,
        width: 360,
        size: 28,
        at: b.third,
        stagger: 0.4,
        plate: false,
      }, te);
      // round 3 (historian): under LeCun's 2024 quote, from 'the third', his own next step [e14-lecun], 22 px cap,
      // low right under his feet (the shared name card has gone by then), held through the music-only hold
      label15(c, { text: 'left Meta, Nov 2025, to build world models · AMI Labs', x: 1196, y: 604, align: 'right', at: b.third + 0.1, size: 22 }, te);
    });
  },
});

// ===================================================================================================== THE STUDY
function paintStudy(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const cam = sc.study(t);
  f.camera(cam);
  const tq = tq12(t);
  const u = clamp01((tq - b.pin) / 1.15);
  studyRoom(f, { key: ID, cams: sc.SCAMS, outside: { mood: 'duskRose', kind: 'dusk' } });
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: false,
    flames: false,
    wall: { hide: ['W8'] },
    extra: (c, env) => {
      const pose = hands.act('pin', u, W8PIN, { held: 'slip', entry: handsEntry(cam, 'L4'), scale: 0.85 });
      if (pose.placed) {
        const tap = pulse(t, b.pin + 0.52 * 1.15, 0.05, 0.25);
        drawSlip(c, W8V, { x: W8C.x, y: W8C.y + tap * 1.5, k: STUDY.wall.k, light: 0.55 + 0.25 * win(t, b.pin + 0.6, b.pin + 1.2), pin: true }, env);
      }
      if (u > 0 && u < 1) {
        hands.draw(c, pose, env, {
          heldDraw: (cc, at, held, e) => {
            if (held !== 'slip') return;
            drawSlip(cc, W8V, { x: at.x, y: at.y + (WALL_SLOTS.W8.h / 2 - 6) * STUDY.wall.k, k: STUDY.wall.k, light: 0.6 }, e);
          },
        });
      }
    },
  });
  void WALL_START;
  studyNear(f, { key: ID, cams: sc.SCAMS, file: true });
}

// ===================================================================================================== THE STAGE
const STAND: Pose = POSES.stand;
const WARN: Pose = { ...POSES.stand, angles: { ...POSES.stand.angles, head: -2, neck: 6, torso: -1 } };
const OUT: Pose = { ...POSES.authority };

function paintStage(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const cam = sc.stage(t);
  f.camera(cam);
  const tq = tq12(t);
  // 'now': LEARNED FEATURES flares once (a clear ~0.5 s bloom) and steadies
  const flare = pulse(t, b.now - 0.1, 0.12, 0.45);
  const wallSlips = wallStateAt(ID, 'end');
  const geo = stage13(f, {
    key: ID,
    cams: sc.GCAMS,
    candle: WORRY,
    candleX: MAIN.x,
    s: MAIN.s,
    letters: 0.85,
    poolRx: MAIN.poolRx,
    // the holdouts' candle stays low until 'three' (Hassabis alone in the SCALE pool), then its pool opens
    flame: 0.25 + 0.75 * win(t, b.three - 0.35, b.three + 0.5),
    sky: 1.15,
    pools: [
      { x: UP.scale + 40, rx: 260, k: 0.7 },
      { x: UP.learned, rx: 300, k: 0.55 + 0.4 * flare },
      { x: (UP.choke + UP.gap) / 2, rx: 300, k: 0.5 },
    ],
    // the Wall hangs at the back of the stage as a flat (behind the upstage candles), its new W8 slip legible
    backdrop: (c, env) => {
      wallOfForecasts(c, { x: BACKDROP.x, y: BACKDROP.y, k: 1.0, slips: wallSlips, light: 0.8 }, env);
      const g = c.createRadialGradient(MAIN.x, 300, 60, MAIN.x, 300, 760);
      g.addColorStop(0, withAlpha(env.mood.fg, 0));
      g.addColorStop(1, withAlpha(env.mood.fg, 0.55));
      c.fillStyle = g;
      c.fillRect(BACKDROP.x - 20, 50, 660, 510);
    },
    depth: { fogA: 0.16, fogAY: 470, curtain: 'both', curtainW: 70, lipY: 668, near: 1 },
    back: (c, env) => {
      // the other candles still burning, upstage: SCALE, LEARNED FEATURES, and the two
      // window candles (COMPUTE IS THE CHOKEPOINT, THE GAP IS MONTHS, NOT YEARS)
      for (const [v, x] of [[SCALE, UP.scale], [LEARNED, UP.learned], [CHOKE, UP.choke], [GAP, UP.gap]] as const) {
        beliefCandle(c, { x, y: UP.y, view: v, s: UP.s, drawFlame: false, letters: 0.55 }, env);
      }
    },
    draw: (c, env) => {
      const lightL = { x: 1, y: -0.2, floor: 0.12 };
      const lightR = { x: -1, y: -0.2, floor: 0.12 };
      // the holdouts are already standing when the stage arrives (round 3); their candle's pool opens on 'three'
      const up = win(t, b.stage - 0.5, b.stage);
      if (up <= 0.01) return;
      c.save();
      c.globalAlpha *= up;
      const pB = withLife({ ...WARN }, tq, 1964, 0.8);
      const pH = withLife({ ...WARN }, tq, 1947, 0.8);
      const pL = withLife({ ...OUT }, tq, 1960, 0.8);
      // LeCun's long shadow across the floor, away from the candle
      longShadow(c, env, POS.lecun, MAIN.x, (cc) => LECUN.draw(cc, { x: 0, y: 0, facing: 'right', pose: pL, ink: PUPPET_NEAR_BLACK }, env), 2.1, 1.6);
      longShadow(c, env, POS.hinton, MAIN.x, (cc) => HINTON13.draw(cc, { x: 0, y: 0, facing: 'left', pose: pH, ink: PUPPET_NEAR_BLACK }, env), 0.55);
      longShadow(c, env, POS.bengio, MAIN.x, (cc) => BENGIO.draw(cc, { x: 0, y: 0, facing: 'left', pose: pB, ink: PUPPET_NEAR_BLACK }, env), 0.55);
      // the two who warn: side by side in the bright pool, both turned toward the candle (the road's danger)
      HINTON13.draw(c, { x: POS.hinton, y: ST13.floorY, facing: 'left', pose: pH, ink: PUPPET_NEAR_BLACK, light: lightR, edgeRim: { x: -1, y: -0.3, px: 1.5, alpha: 0.7 } }, env);
      BENGIO.draw(c, { x: POS.bengio, y: ST13.floorY, facing: 'left', pose: pB, ink: PUPPET_NEAR_BLACK, light: lightR, edgeRim: { x: -1, y: -0.3, px: 1.5, alpha: 0.7 } }, env);
      // LeCun at the rim, half in shadow, facing OUT (away from the pool): his light ~40% of theirs
      // facing out, away from the group: no fill light at all, only a thin rim on the edge toward the light
      LECUN.draw(c, { x: POS.lecun, y: ST13.floorY, facing: 'right', pose: pL, ink: PUPPET_NEAR_BLACK, light: { x: -1, y: -0.2, floor: 0 }, edgeRim: { x: -1, y: -0.35, px: 1.6, alpha: 0.75 } }, env);
      c.restore();
      void geo;
      void lightL;
    },
  });
  // the far side of the pool's rim falls into shade (LeCun half in it)
  f.layer('L4', (c, env) => {
    const x0 = POS.lecun - 110;
    const g = c.createLinearGradient(x0, 0, x0 + 220, 0);
    g.addColorStop(0, withAlpha(env.mood.fg, 0));
    g.addColorStop(1, withAlpha(env.mood.fg, 0.6));
    c.fillStyle = g;
    c.fillRect(x0, 300, 900, 500);
  });
  // the upstage flames (L3): the LEARNED FEATURES flame flares once on 'now'
  const flames: [typeof SCALE, number, number][] = [[SCALE, UP.scale, 0], [LEARNED, UP.learned, flare], [CHOKE, UP.choke, 0], [GAP, UP.gap, 0]];
  for (const [v, x, fx] of flames) {
    const p = candleFlame({ x, y: UP.y, view: v, s: UP.s });
    f.practical({ x: p.x, y: p.y + 3, kind: 'candle', seed: 1600 + v.slot * 7, intensity: 0.8 * (1 + 0.8 * fx), radius: 46 + 70 * fx, layer: 'L3' });
    if (fx > 0.01) {
      // the bloom round the flaring flame (screen space at its projected position)
      const sp = toScreen(LAYERS.L3, cam, p.x, p.y);
      screen(f, (c) => {
        c.save();
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, 190);
        g.addColorStop(0, withAlpha(f.mood.core, 0.55 * fx));
        g.addColorStop(0.3, withAlpha(f.mood.halo, 0.25 * fx));
        g.addColorStop(1, withAlpha(f.mood.halo, 0));
        c.fillStyle = g;
        c.fillRect(sp.x - 190, sp.y - 190, 380, 380);
        c.restore();
      });
    }
  }
  void lerp;
  void ({} as PaintEnv);
  void ({} as C);
}

/** the flame of the crossfade: a candle flame blooming to about a third of the frame, screen-centred */
function flameBloom(f: Frame, k: number, t: number) {
  const m = f.mood;
  const sway = Math.sin(Math.floor(t * 12) * 0.9) * 6;
  screen(f, (c) => {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const cx = 640, cy = 380;
    const R = 420 * (0.55 + 0.45 * k);
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, withAlpha(m.core, 0.75 * k));
    g.addColorStop(0.35, withAlpha(m.halo, 0.42 * k));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    // the flame itself: a tall soft teardrop (about 30% of the frame at the peak): a halo-coloured outer tongue, a
    // hot inner core low in it, and a dark wick root, all feathered
    const h = 520 * k, w = 190 * k;
    const tongue = (sc: number, col: string, a: number, dy: number) => {
      const hh = h * sc, ww = w * sc;
      const y0 = cy + dy;
      c.beginPath();
      c.moveTo(cx, y0 + hh * 0.42);
      c.bezierCurveTo(cx - ww * 0.75, y0 + hh * 0.3, cx - ww * 0.5, y0 - hh * 0.15, cx + sway * sc, y0 - hh * 0.58);
      c.bezierCurveTo(cx + ww * 0.5, y0 - hh * 0.15, cx + ww * 0.75, y0 + hh * 0.3, cx, y0 + hh * 0.42);
      const g2 = c.createLinearGradient(0, y0 - hh * 0.58, 0, y0 + hh * 0.42);
      g2.addColorStop(0, withAlpha(col, 0));
      g2.addColorStop(0.45, withAlpha(col, a * 0.8));
      g2.addColorStop(0.85, withAlpha(col, a));
      g2.addColorStop(1, withAlpha(col, a * 0.4));
      c.fillStyle = g2;
      c.fill();
    };
    c.filter = `blur(${(10 * k).toFixed(1)}px)`;
    tongue(1, m.halo, 0.75 * k, 0);
    tongue(0.62, mixLab(m.core, '#fff6dc', 0.3), 0.8 * k, h * 0.1);
    c.filter = 'none';
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = withAlpha(m.fg, 0.55 * k);
    c.beginPath();
    c.ellipse(cx, cy + h * 0.36, w * 0.06, h * 0.06, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  });
}
