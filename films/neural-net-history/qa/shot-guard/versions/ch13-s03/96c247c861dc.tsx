/**
 * ch13-s03 — a match lights the worry candle; a pause letter lies unanswered beside it; a one-sentence warning is
 * signed, Hinton first, Bengio second, then lab heads (candleAmber on the study shelf → duskRose on the new candle's
 * stage; 23.75 s; in: crossfade from the 2012 stage, duskRose → candleAmber, STUDY LOCK).
 *
 * CAMERA: SHELF (low macro, the worry candle at the right end of the row) → the FLAME PUSH onto its stage.
 *   'strike'   the hands strike a match on the shelf
 *   'lit'      on 'candle' the new candle catches: a brief emberRed bloom from the match (practical only, the act's one
 *              red accent), settling to an ordinary flame within a second. Lettered on the wax in IBM Plex Mono:
 *              SMARTER-THAN-HUMAN AI MAY BE YEARS AWAY, AND DANGEROUS; its first ring just below the wick; no sleeve
 *   'belief'   a slow push toward the lettering as the belief is spoken
 *   'letter'   a small open letter stands beside the candle; its label rises: MARCH 2023 · PAUSE LETTER · NO MAJOR LAB
 *              PAUSED; on 'None came' the hands lay it face down and push it aside, unanswered
 *   'strip'    a second after 'None came' ends: the FLAME PUSH (1.2 s, lens 1.6, bloom, candleAmber → duskRose) onto the
 *              stage; the worry candle stands huge; a parchment strip unrolls across the backdrop with the statement's
 *              opening clause (not narrated), attributed 'Statement on AI Risk'; the date 30 MAY 2023
 *   'sig1'     the first pen line on the strip: Geoffrey Hinton (name card · first signatory); his figure in the pool
 *   'sig2'     Yoshua Bengio (name card · second signatory); his silhouette steps in from the dark beside Hinton
 *   'labs'     three more pen lines (Demis Hassabis, Sam Altman, Dario Amodei, part of the strip prop); three smaller
 *              figures stand further back in the same pool, equal in size and light: no lab singled out
 *   'read'     music-only hold on the strip and the figures; the candle's first ring the only one burning
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at a pitch of 6 px per ring
 * at L3 (270 px), its flame on the top ring and a small tag at its base giving the year it was lit. It burns down one
 * ring per year the belief is held; the burned wax stays above the stub as a ghost sleeve. This one is new: no sleeve.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose, ShotScene } from '../../../film';
import {
  FONT, LAYERS, MOODS, PUPPET_NEAR_BLACK, defineShot, drawTracked, mixLab, nameCard, softPlate, strideLength,
  textRole, toLayer, toScreen, walkTo, withAlpha, withLife,
} from '../../../film';
import { cast, hands } from '../cast';
import type { Palette } from '../../../film';
import { STUDY, STUDY_WALL, candleX, studyCase, studyRoom } from '../sets/study';
import { NAMING, candleDates, shelfStateAt, type CandleView } from '../sets/studyState';
import { beliefCandle, candleFlame, candleShelf, fontForYear, shelfFlames, type ShelfDraw } from '../sets/beliefCandle';
import { capPx1080, cardProbe, legibleSize } from '../../../film/silhouette/type';
import { waxCandle } from '../sets/ch02-s04-waxCandle';
import { HAND_LEN } from '../sets/narratorHands';
import { BX13, CSX13, HX13, NEAR13, NEWEL13, SS13, STAGE_END13, drawStrip, labHeads13, labIn13, stageBays13 } from '../sets/ch13-s03-strip';
import { frameOn } from '../sets/ch09-s03a-kit';
import { monotone } from '../sets/ch02-s05b-util';
import {
  BENGIO13, HINTON13, STAND13, bloom, labGlow, longShadow, monoDate, penLine, roseGrade, screen, stage13, tq12, win, sm, clamp01, lerp, worryLetters,
} from '../sets/ch13-s01-kit';

const ID = 'ch13-s03';
type C = CanvasRenderingContext2D;
type P = { x: number; y: number };

// ------------------------------------------------------------------------------------------------ the shelf
const V0 = shelfStateAt(ID, 'start');
const V1 = shelfStateAt(ID, 'end');
const WORRY: CandleView = V1.find((v) => v.id === 'worry')!;
const WORRY_UNLIT: CandleView = { ...WORRY, state: 'unlit' };
const SY = STUDY.shelf.y;
const WX = candleX(V1, 'worry');
const FLAME = candleFlame({ x: WX, y: SY, view: WORRY, s: STUDY.shelf.s });
/** the pause letter: standing open beside the candle (round 1: 1.5x, and close in, so letter, label and candle
 *  read as one group). Critic r5: 36 px further right, so the new candle's 2023 year tag stays readable beside it */
const LETTER = { x: WX + 100, y: SY, w: 69, h: 93 };
/** the shared shelf (the older candles), drawn by this shot as texture */
const SHELF_DRAW: ShelfDraw = { ...STUDY.shelf, views: V0, drawFlames: false };
/** the worry candle's lettering size on the shelf (layer px) */
const WORRY_PX = 11.6;
/** how far the face-down letter is pushed aside */
const SLIDE = 40;

// ------------------------------------------------------------------------------------------------ the stage
const SX = 640;
const SS = SS13;
const POOL = 520;
const STAGE_FLAME = candleFlame({ x: SX, y: 640, view: WORRY, s: SS });
const HX = HX13;
const BENGIO_X1 = BX13;

interface B {
  D: number;
  strike0: number;
  strikeDur: number;
  lit: number;
  belief: number;
  letter: number;
  none: number;
  press0: number;
  pressDur: number;
  push0: number;
  stageT: number;
  /** the naming rule's card for the worry candle (drawn by this shot, in the clear wall right of the candle) */
  name: number;
  sig1: number;
  sig2: number;
  labs: number;
  /** review r1: the lab heads start stepping out 0.2 s before 'heads' and are all solid by 'labs' */
  heads0: number;
  read: number;
}
interface Scene extends ShotScene {
  b: B;
  study: (t: number) => Camera3;
  stage: (t: number) => Camera3;
  bengio: ReturnType<typeof walkTo>;
  SCAMS: Camera3[];
  GCAMS: Camera3[];
}

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
    const lit = T.beat('lit');
    const strikeDur = 2.3;
    const none = T.word('L1307b', 'None');
    const pressDur = 1.6;
    const push0 = T.beat('strip');
    const b: B = {
      D,
      strike0: lit - 0.6 * strikeDur,
      strikeDur,
      lit,
      belief: T.beat('belief'),
      letter: T.beat('letter'),
      none,
      press0: none + 0.12 - 0.45 * pressDur,
      pressDur,
      push0,
      stageT: push0 + 1.2,
      name: T.word('L1307', 'candle') - NAMING.lead,
      sig1: T.beat('sig1'),
      sig2: T.beat('sig2'),
      labs: T.beat('labs'),
      heads0: T.word('L1308', 'heads') - 0.2,
      read: T.beat('read'),
    };
    // SHELF: the worry candle on the right third (the older candles marching away to the left), so the hands come
    // in from frame right on a short forearm; the push toward the lettering frames the whole belief, held while it
    // is spoken; then the letter beside it
    const study = framePath([
      // round 3: the row sits ~60 px further left, so the clear wall right of the worry candle holds its naming card
      // review r1 (low macro): every key tilted up ~58 screen px, so the shelf edge sits ~8% lower in frame over the
      // defocused near plane (the plank's lip and a book lying along the bottom edge, shelfNear)
      [0, WX - 156, 815 - 58 / 1.55, 1.55],
      [b.belief - 0.2, WX - 142, 815 - 58 / 1.58, 1.58],
      // round 2: a deeper push, so the lettering on the wax reads (>= 22 px cap) while the belief is spoken
      [b.belief + 1.5, WX - 18, 812 - 58 / 1.98, 1.98],
      [b.letter - 0.5, WX - 4, 818 - 58 / 2.0, 2.0],
      // the group (candle · letter · its label) centred as the letter arrives
      [b.letter + 0.9, WX + 30, 852 - 58 / 1.98, 1.98],
      [b.push0, WX + 20, 854 - 58 / 2.0, 2.0],
      [b.stageT, FLAME.x, FLAME.y + 4, 4.2],
    ]);
    // the stage: out of the flame and back fast enough that the strip is unrolling as the push lands
    // round 3: it lands from k 1.45, not 2.6 (Hinton never fills more than ~45% of the frame height, and stays the
    // darkest shape), and settles a touch wider so three planes slide: the L5 wing, the figures, the L2 window bays
    const stage = framePath([
      [b.stageT, STAGE_FLAME.x, STAGE_FLAME.y + 10, 1.45],
      [b.stageT + 1.1, 644, 330, 1.0],
      [b.labs, 640, 332, 1.02],
      [D, ...STAGE_END13],
    ]);
    const stride = strideLength(BENGIO13.spec);
    // round 2: he waits at the dark left edge of the pool from the moment the stage lands, and on his name takes three
    // steps into the light (arriving before 'heads'), instead of a long walk in from off frame
    const steps = 3;
    const bengio = walkTo(BENGIO13.spec, { x0: BENGIO_X1 - steps * stride, x1: BENGIO_X1, at: b.sig2 - 0.3, cadence: 1.2, settle: 0.4 });
    const SCAMS: Camera3[] = [];
    for (let i = 0; i <= 24; i++) SCAMS.push(study((b.push0 * i) / 24));
    const GCAMS: Camera3[] = [];
    for (let i = 1; i <= 16; i++) GCAMS.push(stage(b.stageT + 0.6 + ((D - b.stageT - 0.6) * i) / 16));
    tl.hold(0, D);
    return { tl, b, study, stage, bengio, SCAMS, GCAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    if (t < b.stageT) paintStudy(f, sc, t);
    else paintStage(f, sc, t);
    // round 3: the bloom clears faster on the stage side, so the figure lands as the darkest shape
    const flash = t < b.stageT ? win(t, b.stageT - 0.45, b.stageT) : 1 - win(t, b.stageT, b.stageT + 0.2);
    bloom(f, 0.85 * flash);
    const env = { t, mood: f.mood };
    screen(f, (c) => {
      if (t < b.stageT) {
        // the letter's label (until the push)
        const cam = sc.study(t);
        // the leader follows the letter: standing, then lying face down where the hand pushed it
        const ph = letterPhase(b, tq12(t));
        const p = ph.drawing < 3
          ? toScreen(LAYERS.L4, cam, LETTER.x + 6, LETTER.y - LETTER.h * 0.8)
          : toScreen(LAYERS.L4, cam, LETTER.x + LETTER.w / 2 + ph.slide + LETTER.h * 0.4, LETTER.y - 8);
        const A = win(t, b.letter, b.letter + 0.4) * (1 - win(t, b.push0 - 0.4, b.push0));
        if (A > 0.01) letterLabel(c, p, A, f.mood);
      }
      if (t < b.stageT) worryNameCard(c, sc.study(t), t, b, f.mood);
      // round 3: in as the stage lands, and up for 3.6 s (it shares the frame with Hinton's card, opposite corners)
      // review r1: held through 'Bengio second' (it dates the first two signatures), out by ~1 s after it
      monoDate(c, '30 MAY 2023', b.stageT + 0.1, b.sig2 + 0.95 - (b.stageT + 0.1), env);
      // round 1: the stack sits at the bottom RIGHT, above the 88% line, clear of Bengio's entrance from the left
      // review r1 (crowding): both cards fade out over 0.3 s from 'heads', before the lab heads step out beside them
      nameCard(c, { name: 'Geoffrey Hinton', role: 'first signatory', at: b.sig1 - 0.1, dur: b.labs + 0.3 - (b.sig1 - 0.1), fade: 0.3, align: 'right', x: 1236, y: 508 }, env);
      nameCard(c, { name: 'Yoshua Bengio', role: 'second signatory', at: b.sig2 + 0.1, dur: b.labs + 0.3 - (b.sig2 + 0.1), fade: 0.3, align: 'right', x: 1236, y: 588 }, env);
    });
  },
});

// ===================================================================================================== THE STUDY
function paintStudy(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  const base = sc.study(t);
  const pu = win(t, b.push0, b.stageT);
  const cam = { ...base, lens: lerp(1, 1.6, pu * pu) };
  f.camera(cam);
  if (t < 1.2) f.setMood('candleAmber', { from: 'duskRose', u: win(t, 0, 1.0) });
  else if (t > b.push0) f.setMood('duskRose', { from: 'candleAmber', u: pu });
  studyRoom(f, { key: ID, cams: sc.SCAMS, outside: { mood: 'duskRose', kind: 'night' } });
  const flameK = t < b.lit ? 0 : Math.min(1, 0.55 + 0.45 * sm((t - b.lit) / 0.4));
  // the new flame's warm pool on the study wall behind the row
  if (flameK > 0.01) {
    f.layer(STUDY_WALL, (c, env) => {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const R = 330;
      const cx = FLAME.x + 10, cy = FLAME.y + 40;
      const g = c.createRadialGradient(cx, cy, 8, cx, cy, R);
      g.addColorStop(0, withAlpha(env.mood.halo, 0.3 * flameK));
      g.addColorStop(0.4, withAlpha(env.mood.halo, 0.12 * flameK));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      // and the wall past the pool falls a stop darker, so the pool reads as the new flame's
      c.globalCompositeOperation = 'source-over';
      const D2 = 900;
      const dg = c.createRadialGradient(cx, cy, 160, cx, cy, D2);
      dg.addColorStop(0, withAlpha(env.mood.fg, 0));
      dg.addColorStop(0.45, withAlpha(env.mood.fg, 0.3 * flameK));
      dg.addColorStop(1, withAlpha(env.mood.fg, 0.55 * flameK));
      c.fillStyle = dg;
      c.fillRect(cx - 160, cy - D2, D2 * 2, D2 * 2);
      c.restore();
    });
  }
  // the hands: a short cuffed forearm from frame RIGHT at about shelf-top height, angled ~20°, the elbow off frame
  const entry = sideEntry(cam, FLAME.x, FLAME.y);
  const strikeAt = toLayer(LAYERS.L4, cam, 1150, toScreen(LAYERS.L4, cam, FLAME.x, FLAME.y).y + 120);
  const uS = (tq - b.strike0) / b.strikeDur;
  const tg = wickTarget(entry, strikeAt);
  const hp = uS > 0 && uS < 1 ? hands.act('strikeLight', uS, tg, { entry, scale: 0.62, strikeAt }) : null;
  const hpP = letterHand(b, tq, sideEntry(cam, LETTER.x, LETTER.y - LETTER.h));
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    wall: false,
    xray: false,
    // round 2 (legibility): the older candles' lettering (A GO MACHINE IS A DECADE AWAY…) is the shelf's texture, not
    // this line's subject: the shelf is drawn here inside textRole 'texture' (the naming label stays the kit's)
    shelf: false,
    extra: (c, env) => {
      textRole(c, 'texture', () => candleShelf(c, SHELF_DRAW, env));
      beliefCandle(c, { x: WX, y: SY, view: t < b.lit ? WORRY_UNLIT : WORRY, s: STUDY.shelf.s, flame: flameK, letters: 0, drawFlame: false, named: 0 }, env);
      waxCandle(c, { x: WX, y: SY, view: t < b.lit ? WORRY_UNLIT : WORRY, s: STUDY.shelf.s, flame: flameK, letters: 0 }, env);
      // the belief, legible: Plex Mono in near-black with a warm halo, two lines up the wax (round 2: 11.6 px and the
      // deeper push, >= 24 px cap at 1080p while it is spoken; it is this line's subject)
      textRole(c, 'subject', () => worryLetters(c, WX, SY, STUDY.shelf.s, WORRY_PX, 0.55 + 0.45 * win(t, b.lit - 0.3, b.lit + 0.4), env));
      letter(c, env, t, b, flameK);
      // the hands are the near plane: a touch soft
      if (hp || hpP) {
        // round 3: the forearm is the near plane's darkest shape (the figure's ink, not the hazed set ink)
        const inkEnv: PaintEnv = { ...env, fill: (r) => (r === 'ink' ? PUPPET_NEAR_BLACK : env.fill(r)) };
        c.save();
        c.filter = `blur(${(1.1 * env.pxScale).toFixed(2)}px)`;
        if (hp) hands.draw(c, hp, inkEnv);
        if (hpP) hands.draw(c, hpP, inkEnv);
        c.restore();
      }
    },
  });
  for (const sf of shelfFlames(SHELF_DRAW)) f.practical({ x: sf.x, y: sf.y + 6, kind: 'candle', seed: sf.seed, intensity: 0.9, radius: 40 });
  // the struck match's flame, and the emberRed bloom as the wick takes (the act's one red accent): a 0.6 s peak at
  // twice the candle's halo, warm red, settled within a second
  const fl = hp ? hands.flameAt(hp) : null;
  if (fl) f.practical({ x: fl.x, y: fl.y, kind: 'candle', seed: 2023, intensity: 0.85 + 0.5 * pulse(t, b.strike0 + 0.36 * b.strikeDur - 0.05, 0.08, 0.4), radius: 30 });
  // round 1: a clearly red bloom from the match head as it touches the wick (0.15 s up, ~0.6 s held, gone by 1 s)
  const ember = win(t, b.lit - 0.15, b.lit + 0.05) * (1 - win(t, b.lit + 0.6, b.lit + 1.05));
  if (ember > 0.01) {
    f.layer('L4', (c) => {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const E = MOODS.emberRed;
      const red = mixLab(E.rim, '#d8361a', 0.55);
      const src = fl ?? FLAME;
      const cx = (src.x + FLAME.x) / 2, cy = (src.y + FLAME.y) / 2;
      const R = 300;
      const g = c.createRadialGradient(cx, cy, 2, cx, cy, R);
      g.addColorStop(0, withAlpha(mixLab(E.core, red, 0.35), 0.95 * ember));
      g.addColorStop(0.1, withAlpha(red, 0.75 * ember));
      g.addColorStop(0.35, withAlpha(red, 0.3 * ember));
      g.addColorStop(0.7, withAlpha(E.halo, 0.1 * ember));
      g.addColorStop(1, withAlpha(E.halo, 0));
      c.fillStyle = g;
      c.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      c.restore();
    });
  }
  if (flameK > 0) f.practical({ x: FLAME.x, y: FLAME.y + 2, kind: 'candle', seed: 2031, intensity: 0.95 * flameK + 0.3 * ember, radius: 44 + 14 * flameK + 30 * ember });
  shelfNear(f, cam, sc.study(b.letter), t, b);
  // review r1 (depth): a blurred candle stub on the near end of the shelf, lower left, cut by the frame edge
  stubNear(f, cam, sc.study(0));
  // review r1 (mood): the rose grade arrives with the FLAME PUSH, so the stage beyond reads as another place
  roseGrade(f, pu);
}

/** THE NEAR PLANE on the shelf (L5, blurred): the plank's front lip across the bottom of frame, the matchbox at its
 *  right end and, once the hand has gone, the spent match beside it. Laid out at `ref`; under the shelf camera it
 *  keeps 40% of its true L5 parallax (it slides, never wanders), and it falls away in the flame push. */
function shelfNear(f: Frame, cam: Camera3, ref: Camera3, t: number, b: B) {
  const k = 1 - win(cam.z + (cam.lens - 1) * 400, 520, 700);
  if (k <= 0.01) return;
  const L5 = LAYERS.L5;
  const at = (sx: number, sy: number) => {
    const a = toLayer(L5, ref, sx, sy);
    const n = toScreen(L5, cam, a.x, a.y);
    // review r1: a gentler slide (the tilted framing keeps the plank near one screen line; the near plane must not
    // rise over the candles' year tags as the camera settles on the letter)
    const cl = (v: number) => Math.max(-40, Math.min(40, v));
    return toLayer(L5, cam, sx + cl(0.28 * (n.x - sx)), sy + cl(0.28 * (n.y - sy)));
  };
  const one = toLayer(L5, cam, 1, 0).x - toLayer(L5, cam, 0, 0).x;
  const spent = win(t, b.strike0 + b.strikeDur - 0.2, b.strike0 + b.strikeDur + 0.1);
  f.layer('L5', (c, env) => {
    const m = env.mood;
    c.save();
    c.globalAlpha *= k;
    c.filter = `blur(${(4 * env.pxScale).toFixed(1)}px)`;
    // the plank's front lip (review r1: taller and near-black, the low macro's out-of-focus foreground)
    const lip = at(640, 690);
    const l0 = toLayer(L5, cam, -300, 0).x, l1 = toLayer(L5, cam, 1580, 0).x, lb = toLayer(L5, cam, 0, 900).y;
    const lg = c.createLinearGradient(0, lip.y, 0, lip.y + 40 * one);
    lg.addColorStop(0, mixLab(m.fg, m.halo, 0.2));
    lg.addColorStop(0.14, mixLab(m.fg, m.set, 0.18));
    lg.addColorStop(0.4, mixLab(PUPPET_NEAR_BLACK, m.fg, 0.5));
    lg.addColorStop(1, mixLab(PUPPET_NEAR_BLACK, m.fg, 0.5));
    c.fillStyle = lg;
    c.fillRect(l0, lip.y, l1 - l0, lb - lip.y);
    // the matchbox: a small tray drawn half out of its sleeve, lit on the flame side
    const mb = at(1060, 684);
    const W = 150 * one, H = 46 * one;
    // its face catches the candle (the flame is to its left): a warm gradient across the sleeve
    const fg2 = c.createLinearGradient(mb.x, 0, mb.x + W, 0);
    fg2.addColorStop(0, mixLab(m.set, m.halo, 0.45));
    fg2.addColorStop(1, mixLab(m.fg, m.set, 0.5));
    c.fillStyle = fg2;
    c.fillRect(mb.x, mb.y - H, W, H);
    c.fillStyle = mixLab(m.set, m.halo, 0.3);
    c.fillRect(mb.x - 30 * one, mb.y - H * 0.72, 34 * one, H * 0.72);
    c.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.5), 0.75);
    c.fillRect(mb.x, mb.y - H - 2 * one, W, 3 * one);
    c.fillRect(mb.x - 30 * one, mb.y - H * 0.72 - 2 * one, 32 * one, 3 * one);
    // the striking strip on the sleeve's side
    c.fillStyle = withAlpha(mixLab('#4a2418', m.fg, 0.4), 0.9);
    c.fillRect(mb.x + 6 * one, mb.y - H * 0.62, W - 12 * one, H * 0.3);
    if (spent > 0.01) {
      // the spent match: a thin stick with a charred head, laid across the lip toward the candle
      c.globalAlpha *= spent;
      c.strokeStyle = mixLab(m.fg, m.halo, 0.35);
      c.lineWidth = 3 * one;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(mb.x - 44 * one, mb.y - 3 * one);
      c.lineTo(mb.x - 132 * one, mb.y - 9 * one);
      c.stroke();
      c.fillStyle = mixLab(m.fg, '#000000', 0.3);
      c.beginPath();
      c.ellipse(mb.x - 136 * one, mb.y - 9 * one, 5 * one, 3.6 * one, -0.07, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  });
  // review r1 (depth): a book lying along the near edge of the plank (L5, deeply defocused; L6 is behind this macro's
  // camera): its spine's raised bands catch the candles; it slides against the push (60 % of its parallax, clamped)
  const L6 = LAYERS.L5;
  const at6 = (sx: number, sy: number) => {
    const a = toLayer(L6, ref, sx, sy);
    const n = toScreen(L6, cam, a.x, a.y);
    const cl = (v: number) => Math.max(-60, Math.min(60, v));
    return toLayer(L6, cam, sx + cl(0.4 * (n.x - sx)), Math.max(sy - 12, sy + cl(0.4 * (n.y - sy))));
  };
  const one6 = toLayer(L6, cam, 1, 0).x - toLayer(L6, cam, 0, 0).x;
  f.layer('L5', (c, env) => {
    const m = env.mood;
    const p0 = at6(-80, 668), p1 = at6(400, 668);
    const H = 70 * one6;
    const bot = toLayer(L6, cam, 0, 900).y;
    c.save();
    c.globalAlpha *= k;
    c.filter = `blur(${(7 * env.pxScale).toFixed(1)}px)`;
    const ink = mixLab(PUPPET_NEAR_BLACK, m.fg, 0.45);
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(p0.x, p0.y + 6 * one6);
    c.lineTo(p1.x - 16 * one6, p1.y);
    c.quadraticCurveTo(p1.x + 6 * one6, p1.y + H * 0.4, p1.x, p1.y + H);
    c.lineTo(p1.x, bot);
    c.lineTo(p0.x, bot);
    c.closePath();
    c.fill();
    // the spine's top edge and its raised bands, warm from the candles above
    c.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.4), 0.42);
    c.fillRect(p0.x, p0.y + 4 * one6, p1.x - p0.x - 18 * one6, 3 * one6);
    for (const u of [0.22, 0.27, 0.62, 0.67]) {
      const x = p0.x + (p1.x - p0.x) * u;
      c.fillRect(x, p0.y + 8 * one6, 5 * one6, H * 0.8);
    }
    c.restore();
  });
}

/** THE NEAR CANDLE (L5, deeply defocused): an old, unlit stub at the near end of the shelf, ~30 % of the frame height at
 *  lower left and half cut by the frame edge, its right flank catching the row's light. Laid out at `ref` (the opening
 *  framing); it keeps 55 % of its true L5 parallax, so the slow push on 'machines' slides it out past the frame edge
 *  faster than the row moves (the parallax the push needs) */
function stubNear(f: Frame, cam: Camera3, ref: Camera3) {
  const k = 1 - win(cam.z + (cam.lens - 1) * 400, 520, 700);
  if (k <= 0.01) return;
  const L5 = LAYERS.L5;
  const anchor = { x: 44, y: 742 };
  const a = toLayer(L5, ref, anchor.x, anchor.y);
  const n = toScreen(L5, cam, a.x, a.y);
  const cl = (v: number) => Math.max(-260, Math.min(60, v));
  const sx = anchor.x + cl(0.55 * (n.x - anchor.x)), sy = anchor.y + cl(0.3 * (n.y - anchor.y));
  const p = toLayer(L5, cam, sx, sy);
  const one = toLayer(L5, cam, 1, 0).x - toLayer(L5, cam, 0, 0).x;
  f.layer('L5', (c, env) => {
    const m = env.mood;
    const W = 92 * one, H = 250 * one;
    c.save();
    c.globalAlpha *= k;
    c.filter = `blur(${(6 * env.pxScale).toFixed(1)}px)`;
    // the wax: near-black, a guttered crown with one drip run down its lit flank
    const wax = mixLab(PUPPET_NEAR_BLACK, m.fg, 0.5);
    c.fillStyle = wax;
    c.beginPath();
    c.moveTo(p.x - W / 2, p.y);
    c.lineTo(p.x - W / 2, p.y - H + 10 * one);
    c.quadraticCurveTo(p.x - W * 0.25, p.y - H - 8 * one, p.x, p.y - H + 4 * one);
    c.quadraticCurveTo(p.x + W * 0.3, p.y - H + 14 * one, p.x + W / 2, p.y - H + 2 * one);
    c.lineTo(p.x + W / 2 + 5 * one, p.y - H * 0.62);
    c.quadraticCurveTo(p.x + W / 2 + 9 * one, p.y - H * 0.55, p.x + W / 2, p.y - H * 0.5);
    c.lineTo(p.x + W / 2, p.y);
    c.closePath();
    c.fill();
    // its right flank catches the row's warm light; a dead wick
    const rg = c.createLinearGradient(p.x + W * 0.1, 0, p.x + W / 2 + 6 * one, 0);
    rg.addColorStop(0, withAlpha(m.halo, 0));
    rg.addColorStop(1, withAlpha(mixLab(m.rim, m.halo, 0.4), 0.38));
    c.fillStyle = rg;
    c.fillRect(p.x + W * 0.1, p.y - H, W * 0.4 + 9 * one, H);
    c.strokeStyle = mixLab(PUPPET_NEAR_BLACK, m.fg, 0.3);
    c.lineWidth = 3 * one;
    c.beginPath();
    c.moveTo(p.x - 2 * one, p.y - H + 2 * one);
    c.quadraticCurveTo(p.x + 2 * one, p.y - H - 12 * one, p.x - 4 * one, p.y - H - 20 * one);
    c.stroke();
    c.restore();
  });
}

/** the hands' entry for this shot: off frame right, rising ~20° toward a target point (L4 world), in L4 coords */
function sideEntry(cam: Camera3, x: number, y: number): { R: P; L: P } {
  const sp = toScreen(LAYERS.L4, cam, x, y);
  const ex = 1280 + 420;
  const tan = Math.tan((20 * Math.PI) / 180);
  return {
    R: toLayer(LAYERS.L4, cam, ex, sp.y + tan * (ex - sp.x)),
    L: toLayer(LAYERS.L4, cam, 1280 + 300, sp.y + 300),
  };
}

/** the letter flip on 'None came': in from the right, pinch its top corner (11.4–11.6), topple it over face down in
 *  two drawings on twos, a flat hand pushes it aside, out by 12.9 */
const FLIP = { in0: -0.3, pinch: -0.04, tilt1: 0.06, tilt2: 0.22, flat: 0.36, slide: 0.74, out: 1.2 };
function letterPhase(b: B, tq: number) {
  const r = tq - b.none;
  // 0 standing · 1 tilted (face still toward us) · 2 nearly over (its blank back) · 3 flat, face down
  const drawing = r < FLIP.tilt1 ? 0 : r < FLIP.tilt2 ? 1 : r < FLIP.flat ? 2 : 3;
  const slide = SLIDE * sm((r - FLIP.flat) / (FLIP.slide - FLIP.flat));
  return { r, drawing, slide };
}
const TILT = [0, 0.62, 1.22, Math.PI / 2];
/** the letter's top-right corner (world), for the pinching hand: it pivots about its bottom-right corner */
function letterCorner(drawing: number, slide: number): P {
  const a = TILT[drawing];
  const px = LETTER.x + LETTER.w / 2 + slide, py = LETTER.y;
  // top-left corner relative to the pivot is (-w, -h); rotate clockwise by a (falls to the right)
  const dx = -LETTER.w * 0.15, dy = -LETTER.h;
  return { x: px + dx * Math.cos(a) - dy * Math.sin(a), y: py + dx * Math.sin(a) + dy * Math.cos(a) };
}
function letterHand(b: B, tq: number, entry: { R: P; L: P }) {
  const { r, drawing, slide } = letterPhase(b, tq);
  if (r < FLIP.in0 - 0.4 || r > FLIP.out) return null;
  const len = HAND_LEN * 0.62;
  const out = { x: entry.R.x + (LETTER.x - entry.R.x) * 0.15, y: entry.R.y + (LETTER.y - entry.R.y) * 0.15 };
  let at: P;
  let shape: 'pinch' | 'flat' | 'rest' = 'pinch';
  const corner = letterCorner(Math.min(2, drawing), 0);
  if (r < FLIP.pinch) at = lerpP(out, letterCorner(0, 0), sm((r - FLIP.in0 + 0.4) / (FLIP.pinch - FLIP.in0 + 0.4)));
  else if (r < FLIP.flat) at = corner;
  else if (r < FLIP.slide) {
    shape = 'flat';
    at = { x: LETTER.x + LETTER.w / 2 + LETTER.h * 0.55 + slide, y: LETTER.y - 7 };
  } else {
    shape = 'rest';
    at = lerpP({ x: LETTER.x + LETTER.w / 2 + LETTER.h * 0.55 + SLIDE, y: LETTER.y - 7 }, out, sm((r - FLIP.slide) / (FLIP.out - FLIP.slide)));
  }
  return { right: hands.reach(entry.R, at, shape, len, { held: 'none' }), scale: 0.62, presence: 1 };
}
const lerpP = (a: P, c: P, u: number): P => ({ x: a.x + (c.x - a.x) * u, y: a.y + (c.y - a.y) * u });

/** the hand target that puts the match flame (at the hold) right at the wick */
function wickTarget(entry: { R: P; L: P }, strikeAt: P) {
  let tg = { x: FLAME.x, y: FLAME.y };
  for (let i = 0; i < 4; i++) {
    const fl = hands.flameAt(hands.act('strikeLight', 0.7, tg, { entry, scale: 0.62, strikeAt }));
    if (!fl) break;
    tg = { x: tg.x + (FLAME.x - fl.x), y: tg.y + (FLAME.y + 4 - fl.y) };
  }
  return tg;
}

/** the small open pause letter: standing beside the candle; on 'None came' toppled over face down (two drawings on
 *  twos: tilted with its face still to us, then nearly over showing its blank back), then flat and pushed aside */
function letter(c: C, env: PaintEnv, t: number, b: B, flameK: number) {
  // review r5: the letter is PRINTED from its first visible frame (header line, ruled text, signature scrawl): it
  // falls in from above already inked, paper and ink opaque together within two frames (a slow shared fade read as a
  // blank pale rectangle), and settles on the plank just before 'letter'
  const fall0 = b.letter - 0.3;
  const appear = win(t, fall0, fall0 + 0.08);
  if (appear <= 0.002) return;
  const fallU = clamp01((t - fall0) / 0.26);
  const drop = -34 * (1 - fallU) * (1 - fallU);
  const { drawing, slide } = letterPhase(b, tq12(t));
  const m = env.mood;
  const { w, h } = LETTER;
  const q = w / 46;
  const front = mixLab(mixLab(MOODS.parchment.sky[2], m.halo, 0.3), m.rim, 0.15 + 0.2 * flameK);
  const back = mixLab(mixLab(m.setHaze, m.halo, 0.3), front, 0.25);
  c.save();
  c.globalAlpha *= appear;
  if (drawing < 3) {
    // pivot: the bottom-right corner; it falls to the right (away from the candle)
    c.translate(LETTER.x + w / 2, LETTER.y + drop);
    c.rotate(drawing === 0 ? -0.1 : TILT[drawing]);
    const showBack = drawing === 2;
    c.fillStyle = withAlpha(m.fg, 0.4);
    c.fillRect(-w + 3, -h + 2, w, h);
    c.fillStyle = showBack ? back : front;
    c.fillRect(-w, -h, w, h);
    c.fillStyle = withAlpha(m.fg, 0.18);
    c.fillRect(-w, -h * 0.66, w, 0.8);
    c.fillRect(-w, -h * 0.33, w, 0.8);
    if (!showBack) {
      letterFace(c, w, h, q);
      // the card audit: paper and its printed face share one opacity (the face is fully inked relative to the paper)
      cardProbe(c, 'pause-letter', -w, -h, w, h, 1, 1);
    } else {
      // the blank back, its fold creases catching the flame
      c.strokeStyle = withAlpha(m.rim, 0.3);
      c.lineWidth = 0.8;
      c.strokeRect(-w + 0.5, -h + 0.5, w - 1, h - 1);
    }
  } else {
    // flat, face down on the plank: the blank back seen just from above, a thin pale slab with its shadow
    const x0 = LETTER.x + w / 2 + slide, L = h;
    c.fillStyle = withAlpha(m.fg, 0.45);
    c.fillRect(x0 + 2, LETTER.y - 1, L, 2.5 * q);
    c.fillStyle = back;
    c.beginPath();
    c.moveTo(x0, LETTER.y - 1);
    c.lineTo(x0 + L, LETTER.y - 1);
    c.lineTo(x0 + L - 4 * q, LETTER.y - 7 * q);
    c.lineTo(x0 + 4 * q, LETTER.y - 7 * q);
    c.closePath();
    c.fill();
    c.fillStyle = withAlpha(m.rim, 0.45);
    c.fillRect(x0 + 4 * q, LETTER.y - 7.4 * q, L - 8 * q, 0.9 * q);
  }
  c.restore();
}

/** the pause letter's printed face (texture; the label carries the words), in the letter's local frame (its
 *  bottom-right corner at 0,0): a dark header line with a hairline rule under it, ruled lines of type, and a
 *  signature scrawl at ~60 % ink */
function letterFace(c: C, w: number, h: number, q: number) {
  const ink = MOODS.parchment.ink;
  const x0 = -w + 6 * q;
  const tw = w - 12 * q;
  // the header line: a bold letterhead bar and a hairline rule across the page beneath it
  c.fillStyle = withAlpha(ink, 0.85);
  c.fillRect(x0, -h + 6.5 * q, tw * 0.66, 2.6 * q);
  c.fillStyle = withAlpha(ink, 0.55);
  c.fillRect(x0, -h + 11 * q, tw, 0.6 * q);
  // ruled text: eight lines of type, ragged right, the last of a paragraph short
  c.fillStyle = withAlpha(ink, 0.7);
  for (let i = 0; i < 8; i++) {
    const len = i === 3 ? 0.42 : i === 7 ? 0.5 : 0.72 + 0.28 * (((i * 37) % 10) / 10);
    c.fillRect(x0, -h + (16 + i * 4.6) * q, tw * len, 1.15 * q);
  }
  // the signature scrawl at ~60 % ink, lower left, over a short sign-off line
  c.fillStyle = withAlpha(ink, 0.6);
  c.fillRect(x0, -h + 54.5 * q, tw * 0.28, 0.9 * q);
  c.save();
  c.strokeStyle = withAlpha(ink, 0.6);
  c.lineWidth = 0.9 * q;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const sy = -h + 59.5 * q;
  c.beginPath();
  c.moveTo(x0 + 0.5 * q, sy + 0.6 * q);
  c.bezierCurveTo(x0 + 2 * q, sy - 3.4 * q, x0 + 4 * q, sy - 3.2 * q, x0 + 3.6 * q, sy + 0.4 * q);
  c.bezierCurveTo(x0 + 3.4 * q, sy + 2.2 * q, x0 + 6 * q, sy - 2.4 * q, x0 + 8 * q, sy - 0.6 * q);
  c.bezierCurveTo(x0 + 9.6 * q, sy + 1.2 * q, x0 + 11 * q, sy - 2.8 * q, x0 + 13.4 * q, sy - 0.2 * q);
  c.bezierCurveTo(x0 + 15 * q, sy + 1.4 * q, x0 + 17 * q, sy - 1.6 * q, x0 + 20 * q, sy - 1.2 * q);
  c.stroke();
  c.restore();
}

// ===================================================================================================== THE STAGE
function paintStage(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const tq = tq12(t);
  f.camera(sc.stage(t));
  f.setMood('duskRose');
  const bw = sc.bengio(t);
  // Hinton, inside the light, facing the flame; Bengio steps in from the dark beside him
  const hp = withLife({ ...STAND13, angles: { ...STAND13.angles, head: -2 } }, tq, 2023, 0.9);
  const ho = { x: HX, y: 640, facing: 'right' as const, pose: hp };
  const bp = bw.walking ? bw.pose : withLife({ ...bw.pose }, tq, 1964, 0.8);
  const bo = { x: bw.x, y: 640, facing: 'right' as const, pose: bp };
  // the lab heads step out of the dark on 'heads': the backdrop behind them comes up as they do
  const labUp = Math.max(labIn13(t, b.heads0, 0), labIn13(t, b.heads0, 2) * 0.999);
  stage13(f, {
    key: ID,
    cams: sc.GCAMS,
    candle: WORRY,
    candleX: SX,
    s: SS,
    letters: 0,
    poolRx: POOL,
    // review r1 ('stands huge'): 1.15x taller (SS13) and 1.4x wider than round 3
    candleSx: CSX13,
    flat: (c, env) => drawStrip(c, env, t, b),
    // round 3: a far plane: two pale backlit window bays in the curtain behind the boards (L2)
    backdrop: (c, env) => {
      stageBays13(c, env);
      // review r1 (value): the haze behind the signatories ~20 % brighter, filling the wall between the arched
      // windows, so the pair cut out against light
      pairGlow(c, env);
      labGlow(c, env, sm(labUp));
    },
    // round 3: dark wings at the frame edges (L5, blurred) as well as the lip: three planes slide in the push-in.
    // Round 3 hand-off + review r1 (clutter): the carved newel (lower left) at NEAR13's 0.6 scale, slid 40 px toward
    // the frame edge and pushed back into the dark (newelDark), so it no longer cuts behind Bengio's entrance
    depth: { fogA: 0.3, fogAY: 0.66 * 720, fogAH: 0.3 * 720, ...NEAR13, newel: true, newelScale: NEWEL13, newelDx: -40, newelDark: 1 },
    // review r1 (mood): the stage graded ~10 % toward rose (stage13's roseGrade), so the FLAME PUSH changes location
    grade: 1,
    draw: (c, env) => {
      // on the stage the lettering is the candle's texture (the strip is the subject)
      textRole(c, 'texture', () => worryLetters(c, SX, 640, SS, 10.4, 0.85, env));
      // the floor shadows (the figures themselves are painted after the flame, in `front`)
      longShadow(c, env, HX, SX, (cc) => HINTON13.draw(cc, { ...ho, x: 0, y: 0, ink: PUPPET_NEAR_BLACK }, env), 1);
      longShadow(c, env, bw.x, SX, (cc) => BENGIO13.draw(cc, { ...bo, x: 0, y: 0, ink: PUPPET_NEAR_BLACK }, env), 1);
    },
    // review r1 (value): every figure is painted after the flame's halo, so all five are true near-black. The lab
    // heads (review r1, continuity): SOLID silhouettes a step upstage (0.8x), never translucent, each with the
    // candle's warm rim; then Bengio stepping in, then Hinton. Round 3 kit pass: 2.5 px warm rims toward the flame
    // (lapel notch, shirt V and tie, cuffs come from the kit)
    front: (c, env) => {
      // review r1: equal in light with the signatories (near-black, the same warm rim), in from 'heads' - 0.2 s
      labHeads13(c, env, t, b.heads0);
      BENGIO13.draw(c, { ...bo, ink: PUPPET_NEAR_BLACK, light: { x: 1, y: -0.2, floor: 0.12 }, edgeRim: { x: 1, y: -0.35, px: 2.5, alpha: 0.9, warm: 0.65 } }, env);
      HINTON13.draw(c, { ...ho, ink: PUPPET_NEAR_BLACK, light: { x: 1, y: -0.2, floor: 0.12 }, edgeRim: { x: 1, y: -0.35, px: 2.5, alpha: 0.9, warm: 0.65 } }, env);
    },
  });
}

/** the backdrop haze behind Hinton and Bengio, between the arched windows (L2, additive) */
function pairGlow(c: C, env: PaintEnv) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.translate(520, 430);
  c.scale(1.35, 1);
  const R = 260;
  const g = c.createRadialGradient(0, 0, 0, 0, 0, R);
  const col = mixLab(env.mood.halo, env.mood.rim, 0.35);
  g.addColorStop(0, withAlpha(col, 0.16));
  g.addColorStop(0.5, withAlpha(col, 0.08));
  g.addColorStop(1, withAlpha(col, 0));
  c.fillStyle = g;
  c.fillRect(-R, -R, 2 * R, 2 * R);
  c.restore();
}

/** the naming rule's card for the worry candle on the shelf (round 3: drawn by this shot in the clear wall to the
 *  RIGHT of the candle, not over the older candles' wicks): the belief in Plex Mono over its date range, an opaque
 *  paper card on a soft ink plate, a fine leader to the flame */
const WORRY_NAME_LINES = ['SMARTER-THAN-HUMAN', 'AI MAY BE YEARS', 'AWAY, AND DANGEROUS'];
function worryNameCard(c: C, cam: Camera3, t: number, b: B, mood: Palette) {
  const at = b.name;
  const k = Math.min(sm((t - at) / NAMING.rise), sm((at + NAMING.rise + NAMING.hold + NAMING.fall - t) / NAMING.fall));
  if (k <= 0.003) return;
  const face = fontForYear(WORRY.litYear);
  const size = Math.max(legibleSize(c, `400 18px ${face}`, 18), (18 * 26) / Math.max(1e-3, capPx1080(c, `400 18px ${face}`)));
  const dSize = legibleSize(c, `italic 400 18px ${FONT.text}`, 18);
  const tFont = `400 ${size}px ${face}`;
  const dFont = `italic 400 ${dSize}px ${FONT.text}`;
  const dates = candleDates(WORRY);
  c.save();
  c.font = tFont;
  const tw = Math.max(...WORRY_NAME_LINES.map((l) => c.measureText(l).width));
  c.font = dFont;
  const dw = c.measureText(dates).width;
  const pad = 14, lh = size * 1.2;
  const w = Math.max(tw, dw) + pad * 2;
  const h = WORRY_NAME_LINES.length * lh + dSize * 1.45 + pad * 1.7;
  const fl = toScreen(LAYERS.L4, cam, FLAME.x, FLAME.y);
  const x0 = Math.min(1236 - w, fl.x + 46);
  const y0 = 330;
  softPlate(c, x0 + w / 2, y0 + h / 2, w + 120, h + 90, mood.fg, 0.55 * k);
  const grow = 0.94 + 0.06 * k;
  c.globalAlpha = Math.min(1, k * 1.15);
  c.translate(x0 + w / 2, y0 + h / 2);
  c.scale(grow, grow);
  c.translate(-w / 2, -h / 2);
  // the leader, from the card's left edge to just right of the flame
  c.strokeStyle = withAlpha(mood.rim, 0.75);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, h * 0.3);
  c.lineTo(fl.x + 10 - x0, fl.y + 4 - y0);
  c.stroke();
  const paper = mixLab(mood.halo, '#efe4cc', 0.6);
  c.shadowColor = withAlpha('#000000', 0.45);
  c.shadowBlur = 10;
  c.shadowOffsetY = 4;
  c.fillStyle = paper;
  c.fillRect(0, 0, w, h);
  c.shadowColor = 'rgba(0,0,0,0)';
  c.shadowBlur = 0;
  c.shadowOffsetY = 0;
  c.strokeStyle = withAlpha(mood.ink, 0.35);
  c.lineWidth = 0.8;
  c.strokeRect(5, 5, w - 10, h - 10);
  const inkC = mixLab(mood.ink, '#1d160f', 0.5);
  c.fillStyle = inkC;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.font = tFont;
  textRole(c, 'subject', () => WORRY_NAME_LINES.forEach((l, i) => c.fillText(l, pad, pad + size * 0.95 + i * lh)));
  c.fillStyle = withAlpha(inkC, 0.85);
  c.font = dFont;
  c.fillText(dates, pad, pad + WORRY_NAME_LINES.length * lh + dSize * 1.05);
  c.restore();
}

/** the letter's typed label (IBM Plex Mono, two lines) on a soft plate, a hairline leader down to the letter */
function letterLabel(c: C, p: P, A: number, mood: Palette) {
  const lines = ['MARCH 2023 · PAUSE LETTER', 'NO MAJOR LAB PAUSED'];
  // round 1: larger (28 px cap at 1080p) and set close above-right of the letter, a short leader
  const size = 27;
  const x = Math.min(800, p.x + 48), y = Math.max(150, p.y - 128);
  c.save();
  softPlate(c, x + 220, y + 12, 760, 210, mood.fg, 0.62 * A);
  c.textBaseline = 'alphabetic';
  c.globalAlpha = A;
  const col = mixLab('#efe3cf', mood.core, 0.2);
  c.strokeStyle = withAlpha(col, 0.55);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(p.x + 4, p.y - 6);
  c.lineTo(x - 8, y + 30);
  c.lineTo(x - 2, y + 30);
  c.stroke();
  c.fillStyle = col;
  c.beginPath();
  c.arc(p.x + 3, p.y - 4, 2.2, 0, Math.PI * 2);
  c.fill();
  lines.forEach((ln, i) => {
    c.globalAlpha = A * win(A, 0.2 + i * 0.3, 0.6 + i * 0.3);
    drawTracked(c, ln, x, y + i * (size * 1.5), { font: `500 ${size}px ${FONT.mono}`, size, tracking: 0.06, align: 'left' });
  });
  c.restore();
}

function pulse(t: number, at: number, rise: number, fall: number): number {
  if (t <= at) return 0;
  if (t < at + rise) return sm((t - at) / rise);
  return 1 - sm((t - at - rise) / fall);
}
