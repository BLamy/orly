/**
 * ch15-s06 — the three holdouts, now. The Wall, still and dim (the W8 slip at rest on it, never handled); then,
 * through a flame, the paper stage of the candles still burning in October 2026: Hinton and Bengio in the light of
 * SMARTER-THAN-HUMAN AI MAY BE YEARS AWAY, AND DANGEROUS; LeCun at the rim, facing out, his long shadow on the floor.
 * A held tableau. (candleAmber; 14.42 s; in: crossfade from the shelf of lamps' tilt up to the Wall.)
 *
 *   0 → 1.8    WALL: a slow drift along the Wall at rest (no hands, no pin, no caption); the W8 slip hangs at its
 *              rest alpha (about a third) from frame 0 and is never lit or pushed
 *   b1b (1.8)  the FLAME CROSSFADE (review round 4): a flame rises out of the dim wall at the screen position of
 *              the stage candle that stands between Hinton/Bengio and LeCun (LEARNED FEATURES); the study hands over
 *              to the stage through the type kit's textSwapOut/textSwapIn (the study is gone four frames after the
 *              stage passes 30 %), and the flame sinks into that candle by 3.1
 *   'three'    L1509 opens on the three holdouts alone, all standing (their candle's pool opens); shared name card
 *   'now'      the old candle behind them, LEARNED FEATURES, GIVEN DATA AND ARITHMETIC, flares once and steadies
 *   'third'    LeCun's off-ramp card rises beside him at the rim, held through the music-only hold; under it, his
 *              2025 move as a 22 px label: left Meta, Nov 2025, to build world models · AMI Labs [e14-lecun]
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at a pitch of 6 px per ring at
 * L3 (270 px), its flame on the top ring and a small tag at its base giving the year it was lit. It burns down one
 * ring per year the belief is held; the burned wax stays above the stub as a ghost sleeve (sleeve = years).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv, Pose } from '../../../film';
import { LAYERS, PUPPET_NEAR_BLACK, POSES, blendPose, defineShot, mixLab, nameCard, quoteCard, toScreen, withAlpha, withLife } from '../../../film';
import { FONT } from '../../../film/silhouette/type';
import { waxRings } from '../sets/ch02-s04-waxCandle';
import { LIT_HEIGHT, RING_PX } from '../sets/studyState';
import { softPlate, textRole, textSwapIn, textSwapOut } from '../../../film/silhouette/type';
import { cast } from '../cast';
import { STUDY, STUDY_CAMS, studyCase, studyNear, studyRoom, wallSlotWorld } from '../sets/study';
import { FINAL_SHELF, SLIPS, wallStateAt } from '../sets/studyState';
import { WALL_SLOTS, drawSlip, wallOfForecasts } from '../sets/wallOfForecasts';
import { beliefCandle, candleFlame } from '../sets/beliefCandle';
import { compositeSub, monotone, subFrame } from '../sets/ch02-s05b-util';
import { HINTON13, ST13, longShadow, stage13 } from '../sets/ch13-s01-kit';
import { bloom, clamp01, label15, lerp, pulse, screen, tq12, win } from '../sets/ch15-s01-kit';

const ID = 'ch15-s06';
type C = CanvasRenderingContext2D;

// ===================================================================================================== the study
const W8V = SLIPS.find((s) => s.slot === 'W8')!;
const W8C = wallSlotWorld('W8');
/** the W8 slip's rest alpha on the Wall (review round 4: never pinned, captioned, pushed or lit) */
const W8_REST = 0.32;
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
/** the stage candle between Hinton/Bengio and LeCun (LEARNED FEATURES): the crossfade's flame blooms on it */
const STAGE_FLAME = candleFlame({ x: UP.learned, y: UP.y, view: LEARNED, s: UP.s });
const BENGIO = cast['bengio-2020s'];
const LECUN = cast['lecun-2020s'];
/** Hinton and Bengio inside the bright pool of the SMARTER-THAN-HUMAN candle, a clear gap between them so the two
 *  profiles read apart (Bengio's curls and beard line, Hinton's height); LeCun ~250 px further, at the pool's rim,
 *  turned out (round head, glasses, stocky) (review round 2: the silhouettes, not only the captions, tell them apart) */
const POS = { hinton: 548, bengio: 652, lecun: 1010 };
/** the Wall flat at the back of the stage, shifted left so its new W8 slip clears LeCun's head in the wide */
const BACKDROP = { x: 322, y: 70 };

interface B {
  D: number;
  /** the flame starts to rise (b1b) */
  flame: number;
  /** the stage starts to come up (textSwapIn); the study is gone four frames after it passes 30 % */
  swap: number;
  stage: number;
  three: number;
  now: number;
  third: number;
  /** reviser r1: 'warn' (Hinton's open hand rises, Bengio turns his head up to the candle) and 'dangerous' (their
   *  candle's pool flares once) */
  warn: number;
  dangerous: number;
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
      // round 4: the flame rises from 1.8 s on a frame with no readable card; the study hands over to the stage at
      // swap (a text swap, never a long two-layer dissolve), and from 'The' (L1509) only the holdouts' stage shows
      flame: T.beat('b1b'),
      swap: T.beat('b1b') + 0.45,
      stage: T.beat('b1b') + 0.85,
      three: T.beat('b2'),
      now: T.beat('b3'),
      third: T.beat('b5'),
      warn: T.word('L1509', 'warn'),
      dangerous: T.word('L1509', 'dangerous'),
    };
    // round 4: the Wall at rest: one slow lateral drift (no truck to W8, no push on any slip), continuing the
    // previous shot's tilt up to the Wall
    const study = path([
      [0, STUDY_CAMS.wall(W6U - 0.07, 380)],
      [b.swap + 0.5, STUDY_CAMS.wall(W6U - 0.02, 410)],
    ]);
    const stage = path([
      // the stage opens wide on the three holdouts (round 3), then a slow push through the line and the hold
      [b.stage - 0.4, frameOnLayer(LAYERS.L4, { x: 616, y: 470 }, { x: 640, y: 420 }, 0.95)],
      [b.three + 2.6, frameOnLayer(LAYERS.L4, { x: 624, y: 470 }, { x: 640, y: 419 }, 0.975)],
      [b.third, frameOnLayer(LAYERS.L4, { x: 640, y: 470 }, { x: 640, y: 418 }, 1.0)],
      [D, frameOnLayer(LAYERS.L4, { x: 690, y: 466 }, { x: 640, y: 414 }, 1.06)],
    ]);
    const SCAMS: Camera3[] = [];
    for (let i = 0; i <= 16; i++) SCAMS.push(study(((b.swap + 0.5) * i) / 16));
    const GCAMS: Camera3[] = [];
    for (let i = 0; i <= 24; i++) GCAMS.push(stage(b.stage - 0.4 + ((D - b.stage + 0.4) * i) / 24));
    tl.hold(0, D);
    return { tl, b, study, stage, SCAMS, GCAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    // the hand-over (review round 4, ghost text): the study's weight is the type kit's textSwapOut, the stage's is
    // textSwapIn, so the study (and its wall slips) is at 0 four frames after the stage passes 30 %; between the two
    // the dim wall sinks into the rising flame, never into a second readable layer
    const wOut = textSwapOut(t, b.swap, 0.6);
    const wIn = textSwapIn(t, b.swap, 0.6);
    if (wIn <= 0) paintStudy(f, sc, t);
    else if (wOut > 0) {
      paintStudy(f, sc, t);
      screen(f, (c) => {
        c.fillStyle = mixLab(f.mood.fg, f.mood.ink, 0.5);
        c.globalAlpha = 1 - wOut;
        c.fillRect(0, 0, 1280, 720);
      });
      compositeSub(f, subFrame(f, `${ID}/stage`, 'candleAmber', (g) => paintStage(g, sc, t)), wIn);
    } else paintStage(f, sc, t);
    // the flame: it rises at the screen position of the stage candle between Hinton/Bengio and LeCun (LEARNED
    // FEATURES), peaks while the stage comes up through it, then sinks into that candle's own flame
    const fl = t < b.swap + 0.15 ? win(t, b.flame, b.swap + 0.15) : 1 - win(t, b.swap + 0.15, b.stage + 0.45);
    const fp = toScreen(LAYERS.L3, sc.stage(Math.max(t, b.stage - 0.4)), STAGE_FLAME.x, STAGE_FLAME.y);
    bloom(f, 0.14 * fl);
    if (fl > 0.01) flameBloom(f, fl, t, fp.x, fp.y);
    const stageCam = sc.stage(t);
    screen(f, (c) => {
      const te = { t, mood: f.mood };
      // one shared card, names in the figures' left-to-right order, laid under the pair with LeCun's name toward him
      // right-aligned inside the safe area (review round 2: it cropped to 'YANN LEC' at the frame edge)
      nameCard(c, { name: 'Geoffrey Hinton · Yoshua Bengio · Yann LeCun', role: '2018 Turing Award', at: b.three + 0.2, dur: b.third - b.three - 0.3, align: 'right', x: 1196, y: 602 }, te);
      const ql = clamp01(Math.min((t - b.third) / 0.6, 1));
      const lx = Math.min(1000, toScreen(LAYERS.L4, stageCam, POS.lecun + 150, 0).x);
      if (ql > 0) {
        c.save();
        c.globalAlpha = ql;
        softPlate(c, lx, 156, 600, 290, f.mood.ink, 0.6);
        c.restore();
      }
      quoteCard(c, {
        quote: 'an LLM is basically an off-ramp, a distraction, a dead end.',
        speaker: 'Yann LeCun',
        source: '2024',
        x: lx,
        // high and clear of LeCun's head (his round head and glasses must read against the light)
        y: 128,
        width: 360,
        size: 28,
        at: b.third,
        stagger: 0.4,
        plate: false,
      }, te);
      // round 3 (historian): directly under LeCun's 2024 quote, from 'the third', his own next step [e14-lecun], 22 px
      // cap, on the quote's plate above his head (the bottom row would run across the pair's feet in the push).
      // Review round 1: ~24 px (1080p) clear of the quote's '2024', on its own soft plate (the backdrop slips behind
      // it are taken a stop down while LeCun's card is up)
      const la = win(t, b.third + 0.35, b.third + 0.85);
      // reviser r1: a soft dark plate behind the label (about 35 %, a 12 px feather) over the backdrop's slips; the
      // label's text and position stay exactly as ruled
      if (la > 0.003) {
        c.save();
        c.filter = 'blur(12px)';
        c.fillStyle = withAlpha(f.mood.ink, 0.35 * la);
        c.beginPath();
        c.roundRect(1196 - 712, 222, 736, 46, 10);
        c.fill();
        c.restore();
      }
      textRole(c, 'subject', () => label15(c, { text: 'left Meta, Nov 2025, to build world models · AMI Labs', x: 1196, y: 250, align: 'right', at: b.third + 0.35, size: 22 }, te));
    });
  },
});

// ===================================================================================================== THE STUDY
function paintStudy(f: Frame, sc: Scene, t: number) {
  const cam = sc.study(t);
  f.camera(cam);
  studyRoom(f, { key: ID, cams: sc.SCAMS, outside: { mood: 'duskRose', kind: 'dusk' } });
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: false,
    flames: false,
    wall: { hide: ['W8'] },
    // round 4: the W8 slip is simply on the Wall at its rest alpha from frame 0 (texture: not handled, not lit)
    extra: (c, env) => textRole(c, 'texture', () => drawSlip(c, W8V, { x: W8C.x, y: W8C.y, k: STUDY.wall.k, light: 0.3, pin: true, shadow: true, alpha: W8_REST }, env)),
  });
  void WALL_START;
  void t;
  studyNear(f, { key: ID, cams: sc.SCAMS, file: true });
}

// ===================================================================================================== THE STAGE
const STAND: Pose = POSES.stand;
const WARN: Pose = { ...POSES.stand, angles: { ...POSES.stand.angles, head: -2, neck: 6, torso: -1 } };
const OUT: Pose = { ...POSES.authority };
/** reviser r1: Hinton's open-hand warning (the near arm out toward the candle, palm open) */
const WARN_HAND: Pose = { ...POSES.present, angles: { ...POSES.present.angles, head: -4, neck: 6, shoulderF: 30, elbowF: 44, wristF: -24 } };
/** reviser r1: Bengio looks up to the candle's flame (chin up) */
const BENGIO_UP: Pose = { ...WARN, angles: { ...WARN.angles, head: -12, neck: 2 } };

/** reviser r1: the worry candle's belief in two columns cut into the lit stub (the kit's one column ran past the stub's
 *  top), rising up the wax, so the whole line reads down to DANGEROUS; texture (cut into the wax) */
const WORRY_COLS = ['SMARTER-THAN-HUMAN AI MAY BE', 'YEARS AWAY, AND DANGEROUS'];
function worryLetters(c: C, env: PaintEnv) {
  const s = MAIN.s;
  const w = 30 * s + 1;
  const stubH = LIT_HEIGHT * s - waxRings(WORRY) * RING_PX * s;
  c.save();
  textRole(c, 'texture', () => {
    let fs = 8.4 * s;
    c.font = `400 ${fs}px ${FONT.typewriter}`;
    const longest = Math.max(...WORRY_COLS.map((l) => c.measureText(l).width));
    const room = stubH - 18 * s;
    if (longest > room) {
      fs *= room / longest;
      c.font = `400 ${fs}px ${FONT.typewriter}`;
    }
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.fillStyle = withAlpha(mixLab(env.mood.fg, env.mood.ink, 0.5), 0.62 * 0.85);
    WORRY_COLS.forEach((l, i) => {
      c.save();
      c.translate(MAIN.x + (i === 0 ? -1 : 1) * w * 0.22, ST13.floorY - 10 * s);
      c.rotate(-Math.PI / 2);
      c.fillText(l, 0, 0);
      c.restore();
    });
  });
  c.restore();
}

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
    // reviser r1: the kit's single column of lettering ran past the stub's top ('…AND DANGER'); the shot cuts it in two
    // columns fitted to the lit stub instead (worryLetters, in draw)
    letters: 0,
    poolRx: MAIN.poolRx,
    // the holdouts' candle stays low until 'three' (the Wall at rest), then its pool opens; on
    // 'dangerous' its pool flares once (+20 %, a slow 0.6 s swell)
    flame: (0.25 + 0.75 * win(t, b.three - 0.35, b.three + 0.5)) * (1 + 0.2 * pulse(t, b.dangerous - 0.1, 0.3, 0.6)),
    sky: 1.15,
    pools: [
      { x: UP.scale + 40, rx: 260, k: 0.7 },
      { x: UP.learned, rx: 300, k: 0.55 + 0.4 * flare },
      // (review round 1: LeCun stands at the RIM of the pool, not in a pool of his own: the window candles' light lower)
      { x: (UP.choke + UP.gap) / 2, rx: 300, k: 0.34 },
    ],
    // the Wall hangs at the back of the stage as a flat (behind the upstage candles), its new W8 slip legible
    backdrop: (c, env) => {
      // the flat's slips are background texture here (the Wall at the back of the stage, never the subject)
      textRole(c, 'texture', () => wallOfForecasts(c, { x: BACKDROP.x, y: BACKDROP.y, k: 1.0, slips: wallSlips, light: 0.8, hide: ['W8'] }, env));
      // round 4: the W8 slip at its rest alpha on the flat (texture, never lit)
      const w8 = WALL_SLOTS.W8;
      textRole(c, 'texture', () => drawSlip(c, W8V, { x: BACKDROP.x + w8.x, y: BACKDROP.y + w8.y, k: 1.0, light: 0.3, pin: true, shadow: true, alpha: W8_REST }, env));
      const g = c.createRadialGradient(MAIN.x, 300, 60, MAIN.x, 300, 760);
      g.addColorStop(0, withAlpha(env.mood.fg, 0));
      g.addColorStop(1, withAlpha(env.mood.fg, 0.55));
      c.fillStyle = g;
      c.fillRect(BACKDROP.x - 20, 50, 660, 510);
      // review round 1: while LeCun's card is up the backdrop's slips sit a stop down, so the card and its label
      // never fight the Rosenblatt / Coulom / Hinton slips behind them
      const down = win(t, b.third - 0.1, b.third + 0.7);
      if (down > 0.003) {
        c.fillStyle = withAlpha(mixLab(env.mood.fg, env.mood.ink, 0.4), 0.5 * down);
        c.fillRect(BACKDROP.x - 20, 50, 660, 510);
      }
    },
    // review round 4 (art, global): the hall's carved plane: rimNear's pierced chair-back at lower right (the newel
    // stays lower left); the checker floor comes from stage13
    depth: { fogA: 0.16, fogAY: 470, curtain: 'both', curtainW: 70, lipY: 668, near: 1, chair: { side: 'right', scale: 0.5, dx: -70, rim: 1.5 } },
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
      worryLetters(c, env);
      const up = win(t, b.swap - 0.1, b.swap);
      if (up <= 0.01) return;
      c.save();
      c.globalAlpha *= up;
      // reviser r1, 'warn': Hinton's open warning hand rises (on twos, ~0.4 s; the hand lifts a further ~8 deg after it
      // lands), Bengio's head turns up toward the candle's flame; both ease back to their idles before 'the third'
      const wu = clamp01((tq - (b.warn - 0.2)) / 0.4) * (1 - clamp01((tq - (b.third - 0.7)) / 0.6));
      const lift = clamp01((tq - (b.warn + 0.25)) / 0.35) * (1 - clamp01((tq - (b.third - 0.7)) / 0.6));
      const WARN_OPEN: Pose = { ...WARN_HAND, angles: { ...WARN_HAND.angles, shoulderF: (WARN_HAND.angles.shoulderF ?? 0) + 8 * lift } };
      const pB = blendPose(withLife({ ...WARN }, tq, 1964, 0.8), withLife({ ...BENGIO_UP }, tq, 1964, 0.8), wu);
      const pH = blendPose(withLife({ ...WARN }, tq, 1947, 0.8), withLife(WARN_OPEN, tq, 1947, 0.8), wu);
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
    const x0 = POS.lecun - 90;
    const g = c.createLinearGradient(x0, 0, x0 + 200, 0);
    g.addColorStop(0, withAlpha(env.mood.fg, 0));
    g.addColorStop(1, withAlpha(env.mood.fg, 0.75));
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

/** the flame of the crossfade (review round 1): a candle's teardrop, not a bulb: at most ~107 × 200 px at the peak
 *  (160 × 300 at 1080p), a narrow flickering tip on the twos, its core capped at the mood's core token (never
 *  white), a thin dark wick root, and a halo low enough that the stage comes up through it */
function flameBloom(f: Frame, k: number, t: number, cx: number, cy0: number) {
  const m = f.mood;
  const tq = Math.floor(t * 12) / 12;
  const sway = Math.sin(tq * 7.1) * 5 + Math.sin(tq * 13.3) * 2;
  const tipStretch = 1 + 0.06 * Math.sin(tq * 9.7);
  screen(f, (c) => {
    c.save();
    c.globalCompositeOperation = 'lighter';
    // the flame stands on the stage candle's wick (its base at the wick as it sinks back to the candle's size)
    const cy = cy0 - 200 * k * 0.6 + 4;
    const R = 300 * (0.5 + 0.5 * k);
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0, withAlpha(m.core, 0.32 * k));
    g.addColorStop(0.3, withAlpha(m.halo, 0.2 * k));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    const h = 200 * k, w = 100 * k;
    const tongue = (sc: number, col: string, a: number, dy: number) => {
      const hh = h * sc, ww = w * sc;
      const base = cy + hh * 0.4 + dy;
      const tipY = base - hh * tipStretch;
      c.beginPath();
      c.moveTo(cx, base);
      // a round belly low, narrowing to a fine tip that sways
      c.bezierCurveTo(cx - ww * 0.62, base - hh * 0.04, cx - ww * 0.42, base - hh * 0.55, cx + sway * sc, tipY);
      c.bezierCurveTo(cx + ww * 0.42, base - hh * 0.55, cx + ww * 0.62, base - hh * 0.04, cx, base);
      const g2 = c.createLinearGradient(0, tipY, 0, base);
      g2.addColorStop(0, withAlpha(col, 0));
      g2.addColorStop(0.35, withAlpha(col, a * 0.7));
      g2.addColorStop(0.8, withAlpha(col, a));
      g2.addColorStop(1, withAlpha(col, a * 0.5));
      c.fillStyle = g2;
      c.fill();
    };
    c.filter = `blur(${(4 * k).toFixed(1)}px)`;
    tongue(1, m.halo, 0.6 * k, 0);
    tongue(0.55, m.core, 0.7 * k, h * 0.06);
    c.filter = 'none';
    c.globalCompositeOperation = 'source-over';
    // the wick root: a thin dark stroke, soft
    c.strokeStyle = withAlpha(m.fg, 0.35 * k);
    c.lineWidth = Math.max(1, 3 * k);
    c.beginPath();
    c.moveTo(cx, cy + h * 0.42);
    c.lineTo(cx + 1, cy + h * 0.3);
    c.stroke();
    c.restore();
  });
}
