/**
 * ch08-s14 — the paper's waiting sentence is pinned in W4 on the Wall of Forecasts and filed, while a single
 * green LED multiplies into a distant aisle of racks (candleAmber, STUDY LOCK; 13.13 s; chapter 8's last shot).
 * Round 2 clock (L0827 / L0828 re-recorded): every beat reads the clock (T.word / T.beat): slip pinned by 'said' (2.12),
 * LED card opens on 'waiting' (3.89), the rack on 'G P Us' (4.89), the aisle by 'available' (7.53), FILE cut on 'Put'
 * (8.57) closing on 'file' (10.30), clue card at 10.46, LED push ends at the handoff beat (13.0).
 *
 *   in        crossfade from ch08-s13b's candle stage (dawnGold): the REVERSE FLAME PUSH. We open INSIDE the new
 *             candle's flame: until ~0.45 s a dark vignette with the flame's teardrop core standing in it,
 *             centred where s13b leaves its flame (upper left), so the crossfade reads as one move out of it. We pull back out of it (dawnGold →
 *             candleAmber over 1.2 s) onto the SHELF: the three candles whole, their tags and stubs in frame
 *   results-.45 a soft 0.4 s dissolve SHELF → WALL while the camera tilts up (the Wall readable on 'results'); the
 *             arm (broken at the elbow, its paper-cut shadow on the cork) pins the slip in W4 by 'said' with a
 *             two-frame overshoot, and lifts as it withdraws (W6's corner half-lit in shadow
 *             beside it, W5 and W7 bare pins). The lamp's light falls diagonally from the upper left, dying
 *             toward W6's corner, with a pool on W4; a thin fog band crosses the lower third; the near banker's
 *             lamp (finial, rolled lip, a warm sliver under it) stands at the lower right edge
 *   +0.8      the quote card sets in once the camera has landed (the paper's words, verbatim, on its soft plate;
 *             the slip's own lettering is small and pale, so the card is the one legible text)
 *   'waiting' a small pinned card beside the slip, ON THE WALL (world space, cream deckled mount), opens on the
 *             dark: ONE green status LED; 'faster' two; 'G P Us' dozens on a rack face; 'datasets' the aisle of
 *             racks receding to a vanishing point, all blinking (no dates claimed). Its serverCyan glow is the
 *             shot's one accent.
 *   'Put'     FILE insert (top-down): the hand is already carrying the copy over the open manila file as the cut
 *             lands; it lets go; the flat hand eases the flap shut over 0.35 s, ending on 'file'
 *   file+.16  BOARD insert (a slow push in): the hand pins the clue card (one learned filter, 2012; it hangs a size
 *             larger than a slot card) in C3-c under the furnaces; threads of light run one after another to the
 *             pierced stencil (1989), FIRE (2012) and the backward bead (1986), and hold lit; on the 'clue' beat a
 *             shimmer runs along them
 *   handoff   the camera trucks right from the board to the Wall (they are adjacent) and settles on the pinned
 *             LED card, then pushes into it while the lamp crossfades candleAmber → serverCyan (0.8 s, no dip)
 *             and the study goes dark: the inner camera dives back onto the first LED. The last frame is a
 *             single green LED in serverCyan dark; ch09-s01 cuts on its blink.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { LAYERS, MOODS, CAMERA3_HOME, FONT, defineShot, dustMotes, hash1, mixLab, quoteCard, toLayer, toScreen, withAlpha } from '../../../film';
import { hands } from '../cast';
import { HAND_LEN, handsEntry, type HandsPose, type HeldDraw, type Pt } from '../sets/narratorHands';
import { STUDY, candleX, slotWorld, studyCase, studyRoom } from '../sets/study';
import { SLOTS, shelfStateAt, wallStateAt, type SlotId } from '../sets/studyState';
import { candleFlame } from '../sets/beliefCandle';
import { DEFAULT_POOL, drawCard, paperTone, poolAt, typedText } from '../sets/caseBoard';
import { WALL_SLOTS, drawSlip, slotLight, wallSlotAt } from '../sets/wallOfForecasts';
import { XRAY } from '../sets/xrayColumn';
import { clamp01, compositeSub, lerp, monotone, sm, subFrame, tq12, win } from '../sets/ch02-s05b-util';
import { IW, IH, ledInset, insetGeo, type InsetRect } from '../sets/ch08-s14-ledInset';
import { chairBack, drapery, valance } from '../sets/occluders';
import { overscan } from '../../../film/core/multiplane';
import { makeCanvas } from '../../../film/silhouette/atmosphere';

type C = CanvasRenderingContext2D;
const ID = 'ch08-s14';
const QUOTE = '…our results can be improved simply by waiting for faster GPUs and bigger datasets to become available.';

// ------------------------------------------------------------------------------------------------ geometry
const V0 = shelfStateAt(ID, 'start');
const LX = candleX(V0, 'learned');
const LV = V0.find((v) => v.id === 'learned')!;
const LFLAME = candleFlame({ x: LX, y: STUDY.shelf.y, view: LV, s: STUDY.shelf.s });
const W4V = wallStateAt(ID, 'end').find((s) => s.slot === 'W4')!;
const WK = STUDY.wall.k;
const W4 = WALL_SLOTS.W4;
const W4C = { x: STUDY.wall.x + W4.x * WK, y: STUDY.wall.y + W4.y * WK };
const W4PIN = wallSlotAt(STUDY.wall, 'W4');
const W6 = WALL_SLOTS.W6;
const W6C = { x: STUDY.wall.x + W6.x * WK, y: STUDY.wall.y + W6.y * WK };
const C3C = SLOTS['C3-c'];
const POOL = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };

/** the LED card, pinned on the Wall (L4 world): right of W4, above W6's shadowed corner, under W5/W7's bare pins */
const INSET_WW = 150;
const INSET_WH = (INSET_WW * IH) / IW;
const IC = { x: W4C.x + 152, y: W4C.y - 94 };
/** the card's screen width once the truck has settled on it (k 1.22): the push's starting size */
const INSET_REST_W = INSET_WW * 1.22;

// ------------------------------------------------------------------------------------------------ cameras
const kz = (k: number) => 1000 - 1000 / k; // L4 scale → camera z
const kOf = (c: Camera3) => 1000 / (1000 - c.z);
/** a camera at scale k that puts world point p at screen point s */
const frameOn = (p: Pt, s: Pt, k: number): Camera3 => ({ x: p.x + (640 - s.x) / k, y: p.y + (360 - s.y) / k, z: kz(k), lens: 1 });
/** inside the new candle's flame (centred where ch08-s13b leaves its flame), then out onto the shelf */
const K_IN = 16;
const K_SHELF = 1.7;
const S13B_FLAME = { x: 243, y: 108 };
const SHELF_AT = { x: 770, y: 200 };
const FLAME = frameOn(LFLAME, S13B_FLAME, K_IN);
const SHELF = frameOn(LFLAME, SHELF_AT, K_SHELF);
/** the Wall: the W4 slip lower left, its LED card upper right of it, both inside the lamp's pool */
const WALL0 = frameOn(W4C, { x: 470, y: 384 }, 1.74);
const WALL1 = frameOn(W4C, { x: 462, y: 390 }, 1.86);
/** 'datasets': a dolly in on the LED card so its aisle of racks fills ≈ 35 % of the frame width before the FILE cut
 *  (the card upper centre, the quote card still clear below it) */
const WALLD = frameOn(IC, { x: 700, y: 236 }, 2.75);
/** the board insert: C3-c left of centre, the 1986 and 1989 cards at left, FIRE above; a slow push in on the clue */
const C3W0 = slotWorld('C3-c');
/** the clue card is the subject of the insert: it hangs a size larger than a slot card (its learned-filter tile
 *  reads at ~70 px), its left edge kept off the case card's */
const CLUE_K = 1.22;
const CLUE_DX = 8;
const C3W = { x: C3W0.x + CLUE_DX, y: C3W0.y + ((C3C.h / 2 - 7) * (CLUE_K - 1)) * STUDY.board.k };
const CLUE_PIN = { x: C3W0.x + CLUE_DX, y: slotWorld('C3-c', 'pin').y };
const BOARD0 = frameOn(C3W0, { x: 492, y: 334 }, 1.08);
const BOARD1 = frameOn(C3W0, { x: 482, y: 344 }, 1.15);
/** the end of the push: the LED card fills the frame */
const K_FULL = 9.2;
const PUSHED = frameOn(IC, { x: 640, y: 360 }, K_FULL);
const CAMS = [FLAME, SHELF, WALL0, WALL1, BOARD0, BOARD1, PUSHED];
/** the board insert's camera path up to the truck's settle (k ≤ 1.22): the shared L6 near plane is baked to cover
 *  it (beyond k ≈ 1.45 the camera passes the L6 plane, so the occluders fade out on the push before then) */
const BOARD_NEAR_CAMS: Camera3[] = [BOARD0, BOARD1];
{
  const s0 = toScreen(LAYERS.L4, BOARD1, IC.x, IC.y);
  for (const u of [0, 0.25, 0.5, 0.75, 1])
    for (const k of [kOf(BOARD1), 1.22]) BOARD_NEAR_CAMS.push(frameOn(IC, { x: lerp(s0.x, 640, u), y: lerp(s0.y, 360, u) }, k));
}
const BOARD_NEAR_R = overscan(LAYERS.L6, BOARD_NEAR_CAMS, 60);

/** the tilt between SHELF and WALL (screen px): the shelf drifts down out, the Wall settles from below */
const TILT_OUT = 46;
const TILT_IN = 40;


/** the LED card's screen rect through a camera (it lives on the Wall, L4) */
function insetRect(cm: Camera3): InsetRect {
  const p = toScreen(LAYERS.L4, cm, IC.x - INSET_WW / 2, IC.y - INSET_WH / 2);
  return { x: p.x, y: p.y, w: INSET_WW * p.k, h: INSET_WH * p.k };
}

interface B {
  D: number;
  results: number;
  pinLand: number;
  dis0: number;
  dis1: number;
  wallIn: number;
  quoteAt: number;
  waiting: number;
  faster: number;
  gpus: number;
  bigger: number;
  datasets: number;
  avail: number;
  cutFile: number;
  file: number;
  closeAt: number;
  cutBoard: number;
  clueLand: number;
  threads: number;
  clue: number;
  truck0: number;
  truck1: number;
  pushA: number;
  pushB: number;
  wallK: (t: number) => number;
  wallX: (t: number) => number;
  wallY: (t: number) => number;
  endK: (t: number) => number;
}
const PIN_DUR = 1.9;
const CLUE_DUR = 1.05;
const CLOSE_DUR = 0.35;

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const results = T.word('L0827', 'results');
    const said = T.word('L0827', 'said');
    const avail = T.wordEnd('L0827', -1);
    const put = T.line('L0828').start;
    const file = T.beat('file');
    const clue = T.beat('clue');
    const pushB = Math.min(D - 0.1, T.beat('handoff'));
    const pushA = pushB - 0.8;
    const cutFile = put - 0.12;
    const cutBoard = file + 0.16;
    const clueLand = cutBoard + 0.36;
    // the dissolve to the Wall starts just before 'results', so the hand is already reaching on the word
    const dis0 = Math.max(0.7, results - 0.45);
    const dis1 = dis0 + 0.4;
    const wallIn = dis1 + 0.7;
    // the move (REVIEW round 1): the truck to the LED card starts right after the clue shimmer and the push into it
    // is eased over ≈ 1.0 s (never a 4× jump in half a second)
    const truck0 = clue + 0.1;
    const truck1 = truck0 + 0.7;
    const lk = Math.log;
    const b: B = {
      D,
      results,
      pinLand: said - 0.06,
      dis0,
      dis1,
      wallIn,
      quoteAt: wallIn - 0.05,
      waiting: T.beat('leds'),
      faster: T.word('L0827', 'faster'),
      gpus: T.word('L0827', 'G'),
      bigger: T.word('L0827', 'bigger'),
      datasets: T.word('L0827', 'datasets'),
      avail,
      cutFile,
      file,
      closeAt: file - CLOSE_DUR,
      cutBoard,
      clueLand,
      threads: clueLand + 0.08,
      clue,
      truck0,
      truck1,
      pushA,
      pushB,
      wallK: monotone([
        [dis0, lk(kOf(WALL0))],
        [wallIn, lk(kOf(WALL0))],
        [T.word('L0827', 'datasets') - 0.15, lk(kOf(WALL1))],
        [cutFile, lk(kOf(WALLD))],
      ]),
      wallX: monotone([
        [dis0, WALL0.x],
        [wallIn, WALL0.x],
        [T.word('L0827', 'datasets') - 0.15, WALL1.x],
        [cutFile, WALLD.x],
      ]),
      wallY: monotone([
        [dis0, WALL0.y + TILT_IN / kOf(WALL0)],
        [wallIn, WALL0.y],
        [T.word('L0827', 'datasets') - 0.15, WALL1.y],
        [cutFile, WALLD.y],
      ]),
      endK: monotone([
        [truck0 + 0.1, lk(kOf(BOARD1))],
        [pushB, lk(K_FULL)],
      ]),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    if (t < b.cutFile) {
      if (t < b.dis0) paintShelf(f, b, t);
      else if (t < b.dis1) {
        // the soft dissolve SHELF → WALL (the outgoing shelf painted first, in its own frame)
        const u = sm((t - b.dis0) / (b.dis1 - b.dis0));
        const mood = f.mood;
        const cv = subFrame(f, `${ID}/shelf`, mood, (g) => paintShelf(g, b, t));
        paintWall(f, b, t);
        compositeSub(f, cv, 1 - u);
      } else paintWall(f, b, t);
      quoteCard(
        f.c,
        { quote: QUOTE, speaker: 'Krizhevsky, Sutskever & Hinton', source: '2012', x: 890, y: 532, width: 620, maxChars: 38, size: 27, at: b.quoteAt, dur: b.cutFile - 0.12 - b.quoteAt, fade: 0.4, stagger: 0.28 },
        { t, mood: f.mood },
      );
    } else if (t < b.cutBoard) paintFile(f, b, t);
    else paintBoard(f, b, t);
  },
});

/** STUDY LOCK: out of the candle stage's dawnGold into the study's candleAmber over the first 1.2 s */
function studyMood(f: Frame, t: number) {
  const mu = sm(t / 1.2);
  if (mu < 1) f.setMood('candleAmber', { from: 'dawnGold', u: mu });
  else f.setMood('candleAmber');
}

// ================================================================================================ SHELF
const outQuad = (u: number) => 1 - Math.pow(1 - clamp01(u), 2);
function shelfCam(b: B, t: number): Camera3 {
  // the reverse push: scale falls fast while we are still inside the halo, then settles; the flame travels from
  // where s13b left it to its place on the shelf; then the first of the tilt up as the dissolve begins
  const u = t / (b.dis0 - 0.02);
  const k = Math.exp(lerp(Math.log(K_IN), Math.log(K_SHELF), outQuad(u)));
  const a = sm(u);
  const tilt = TILT_OUT * sm((t - (b.dis0 - 0.12)) / (b.dis1 - b.dis0 + 0.12));
  return frameOn(LFLAME, { x: lerp(S13B_FLAME.x, SHELF_AT.x, a), y: lerp(S13B_FLAME.y, SHELF_AT.y, a) + tilt }, k);
}

function paintShelf(f: Frame, b: B, t: number) {
  const cm = shelfCam(b, t);
  f.camera(cm);
  studyMood(f, t);
  studyRoom(f, { key: ID, cams: CAMS, outside: { mood: 'duskRose', kind: 'city' } });
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    flames: false,
    xray: { light: 0.18 },
    extra: (c, env) => xraySleep(c, env),
  });
  // the new candle's flame: a big halo while we are inside it, settling to a candle on the shelf
  const inside = 1 - sm(t / 0.9);
  f.practical({ x: LFLAME.x, y: LFLAME.y + 6, kind: 'candle', seed: 2012, intensity: 0.95 + 0.3 * inside, radius: 38 + 10 * inside });
  for (const v of V0) {
    if (v.id === 'learned' || v.state !== 'live') continue;
    const p = candleFlame({ x: candleX(V0, v.id), y: STUDY.shelf.y, view: v, s: STUDY.shelf.s });
    f.practical({ x: p.x, y: p.y, kind: 'candle', seed: 300 + v.slot * 7, intensity: 0.85, radius: 36 });
  }
  f.layer('L4', (c, env) => dustMotes(c, { area: { x: LFLAME.x - 520, y: LFLAME.y - 300, w: 1040, h: 620 }, count: 30, drift: { x: -3, y: -2 }, brightness: 0.5, salt: 813 }, env));
  // INSIDE THE FLAME: for the first ~0.4 s we are in its halo. Not a white-out: a dark vignette toward the set
  // tone with the flame's teardrop core still standing in it, so the frame stays a silhouette while we back out
  const wash = 1 - win(t, 0.15, 0.45);
  if (wash > 0.003) {
    const fp = toScreen(LAYERS.L4, cm, LFLAME.x, LFLAME.y);
    const m = f.mood;
    const c = f.c;
    const g = c.createRadialGradient(fp.x, fp.y, 0, fp.x, fp.y, 1300);
    g.addColorStop(0, withAlpha(mixLab(m.halo, m.core, 0.5), 0.85 * wash));
    g.addColorStop(0.18, withAlpha(mixLab(m.halo, m.set, 0.25), 0.72 * wash));
    g.addColorStop(0.5, withAlpha(mixLab(m.halo, m.set, 0.7), 0.62 * wash));
    g.addColorStop(1, withAlpha(mixLab(m.set, m.fg, 0.45), 0.6 * wash));
    c.fillStyle = g;
    c.fillRect(0, 0, 1280, 720);
    // the teardrop core, its size following the camera's scale as we back out of it
    const kk = kOf(cm) / K_IN;
    const fw = 150 * (0.35 + 0.65 * kk), fh = 330 * (0.35 + 0.65 * kk);
    c.save();
    c.translate(fp.x, fp.y + fh * 0.12);
    c.globalCompositeOperation = 'lighter';
    const cg = c.createRadialGradient(0, fh * 0.12, 0, 0, fh * 0.05, fh * 0.62);
    cg.addColorStop(0, withAlpha(mixLab(m.core, '#fff6dc', 0.35), 0.75 * wash));
    cg.addColorStop(0.45, withAlpha(m.core, 0.42 * wash));
    cg.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = cg;
    c.beginPath();
    c.moveTo(0, -fh * 0.6);
    c.bezierCurveTo(fw * 0.18, -fh * 0.3, fw * 0.55, fh * 0.02, fw * 0.48, fh * 0.2);
    c.bezierCurveTo(fw * 0.4, fh * 0.42, -fw * 0.4, fh * 0.42, -fw * 0.48, fh * 0.2);
    c.bezierCurveTo(-fw * 0.55, fh * 0.02, -fw * 0.18, -fh * 0.3, 0, -fh * 0.6);
    c.fill();
    c.restore();
  }
}

// ================================================================================================ WALL
function wallCam(b: B, t: number): Camera3 {
  const k = Math.exp(b.wallK(t));
  return { x: b.wallX(t), y: b.wallY(t), z: kz(k), lens: 1 };
}

/** the Wall with its slips as this shot leaves it (W4 pinned, W6's corner in shadow); `slip` false while the hand
 *  is still bringing it */
function wallExtras(c: C, env: PaintEnv, slip: boolean, sway = 0) {
  xraySleep(c, env);
  w6Corner(c, env);
  if (!slip) return;
  c.save();
  c.translate(W4PIN.x, W4PIN.y);
  c.rotate(sway);
  c.translate(-W4PIN.x, -W4PIN.y);
  w4Slip(c, env, W4C, slotLight('W4'), true);
  c.restore();
}

function paintWall(f: Frame, b: B, t: number) {
  const cm = wallCam(b, t);
  f.camera(cm);
  studyMood(f, t);
  studyRoom(f, { key: ID, cams: CAMS, outside: { mood: 'duskRose', kind: 'city' } });
  f.fog('B');
  const tq = tq12(t);
  const pin0 = b.pinLand - 0.45 * PIN_DUR;
  const u = (tq - pin0) / PIN_DUR;
  const landed = tq >= b.pinLand;
  // the hand comes in steeply from the TOP edge (upper right), so only ≈ 70 % of the old forearm crosses the frame
  // and the cuff and hand carry the silhouette, high and clear of the quote's place
  const entry = { R: toLayer(LAYERS.L4, cm, 1150, -150), L: toLayer(LAYERS.L4, cm, 1300, 120) };
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    flames: false,
    board: false,
    shelf: false,
    xray: { light: 0.18 },
    wall: {
      hide: ['W6'],
      glint: landed ? { W4: Math.exp(-Math.max(0, t - b.pinLand) * 2.2) * win(t, b.pinLand - 0.05, b.pinLand + 0.1) } : undefined,
    },
    extra: (c, env) => {
      const dt = tq - b.pinLand;
      wallExtras(c, env, landed, landed ? 0.05 * Math.exp(-dt * 2.4) * Math.sin(dt * 7.5) : 0);
      if (u > 0 && u < 1) {
        const hp = pinPose(hands.act('pin', u, W4PIN, { held: 'slip', scale: 0.62, entry }), u, tq, b.pinLand);
        const o: HeldDraw = { heldDraw: (cc, at, _h, e) => w4Slip(cc, e, { x: at.x, y: at.y + (W4.h / 2 - 6) * WK }, 0.85, false) };
        // the arm's paper-cut shadow on the cork, thrown down and away from the key (the lamp high at upper left), soft
        castShadow(c, (g) => wallArm(g, hp, env, o), 13, 15, 0.55, 3 * env.pxScale);
        wallArm(c, hp, env, o);
      }
    },
  });
  f.layer('L4', (c, env) => dustMotes(c, { area: { x: W4C.x - 380, y: W4C.y - 300, w: 900, h: 560 }, count: 40, drift: { x: -3, y: -2 }, brightness: 0.5, salt: 814 }, env));
  // value: the lamp's pool on W4, the Wall a stop darker toward the frame edges, a thin fog band low
  wallPool(f, cm);
  f.fog({ yCenter: 610, height: 150, alpha: 0.16, drift: 8 });
  // the LED card on the Wall, beside the slip
  paintInset(f, b, t, insetRect(cm));
  // the near plane: the banker's lamp shade at lower right (its light pools on the Wall), the desk's edge
  f.practical({ x: LAMP_BULB.x, y: LAMP_BULB.y, kind: 'lamp', seed: 41, intensity: 0.32, radius: 34, layer: 'L5' });
  f.layer('L5', (c, env) => nearLamp(f, c, env));
}

// ------------------------------------------------------------------------------------------------ the arm
/** the pin action, performed: a two-frame overshoot past the pin when it lands, a settle on twos, and a small
 *  lift as the hand withdraws (the shared action only slides) */
function pinPose(hp: HandsPose, u: number, tq: number, pinLand: number): HandsPose {
  const a = hp.right;
  if (!a) return hp;
  const len = HAND_LEN * (hp.scale ?? 1);
  const dt = tq - pinLand;
  let along = 0;
  if (dt >= 0 && dt < 1 / 12) along = 0.09; // the press carries a hair past the pin (one drawing = two frames)
  else if (dt >= 1 / 12 && dt < 2 / 12) along = -0.03; // springs back
  const lift = 0.32 * Math.sin((Math.PI / 2) * clamp01((u - 0.6) / 0.22));
  const dx = Math.cos(a.angle) * along * len;
  const dy = Math.sin(a.angle) * along * len - lift * len;
  return { ...hp, right: { ...a, wrist: { x: a.wrist.x + dx, y: a.wrist.y + dy } } };
}

/** a paper-cut cast shadow: `draw` renders once into a scratch canvas (so overlapping parts never double up), then it
 *  lands on the surface as one soft dark shape, offset (dx, dy) screen px */
let shadowCv: HTMLCanvasElement | null = null;
function castShadow(c: C, draw: (g: C) => void, dx: number, dy: number, alpha: number, blurDev: number) {
  const W = c.canvas.width, H = c.canvas.height;
  if (!shadowCv || shadowCv.width !== W || shadowCv.height !== H) shadowCv = makeCanvas(W, H);
  const g = shadowCv.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'source-over';
  g.filter = 'none';
  g.clearRect(0, 0, W, H);
  const m = c.getTransform();
  g.setTransform(m);
  draw(g);
  const dev = W / 1280;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = alpha;
  c.filter = `brightness(0) blur(${blurDev.toFixed(1)}px)`;
  c.drawImage(shadowCv, dx * dev, dy * dev);
  c.restore();
}

/** where the forearm breaks at the elbow (hand lengths back from the wrist) and by how much */
const ELBOW = 2.35;
const ELBOW_BREAK = 0.46;
/** the narrator's arm on the Wall: the shared rigid forearm, cut at an elbow, with an upper arm breaking up toward
 *  the shoulder (out of frame above), and a turned-back cuff standing proud of the sleeve (a notch in the outline) */
function wallArm(c: C, hp: HandsPose, env: PaintEnv, o: HeldDraw, shoulder: 'above' | 'below' = 'above') {
  const a = hp.right;
  if (!a) return;
  const len = HAND_LEN * (hp.scale ?? 1);
  const A = a.angle;
  const ca = Math.cos(A), sa = Math.sin(A);
  const E = { x: a.wrist.x - ca * ELBOW * len, y: a.wrist.y - sa * ELBOW * len };
  const back = A + Math.PI;
  // the shoulder is out of frame above (an arm reaching down from the upper right) or below (from the lower right)
  const hi = Math.sin(back + ELBOW_BREAK) < Math.sin(back - ELBOW_BREAK);
  const up = (shoulder === 'above') === hi ? back + ELBOW_BREAK : back - ELBOW_BREAK;
  const ux = Math.cos(up), uy = Math.sin(up);
  const ink = env.fill('ink');
  const rim = env.mood.rim;
  // the upper arm: a tapered tweed slab from the elbow off frame, the elbow a rounded knuckle of cloth
  const nx = -uy, ny = ux; // normal of the upper arm
  const topSide = ny < 0 ? 1 : -1; // which normal side faces up-screen
  const w0 = 0.33 * len, w1 = 0.44 * len, L = 9 * len;
  c.save();
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(E.x + nx * w0, E.y + ny * w0);
  c.lineTo(E.x + ux * L + nx * w1, E.y + uy * L + ny * w1);
  c.lineTo(E.x + ux * L - nx * w1, E.y + uy * L - ny * w1);
  c.lineTo(E.x - nx * w0, E.y - ny * w0);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(E.x, E.y, 0.34 * len, 0, Math.PI * 2);
  c.fill();
  // its lit top edge, and the crease across the inside of the elbow
  c.strokeStyle = withAlpha(rim, 0.5);
  c.lineWidth = Math.max(0.8, 1.1 * (len / HAND_LEN));
  c.beginPath();
  c.moveTo(E.x + nx * w0 * topSide + ux * 0.25 * len, E.y + ny * w0 * topSide + uy * 0.25 * len);
  c.lineTo(E.x + ux * 3.2 * len + nx * (w0 + 0.03 * len) * topSide, E.y + uy * 3.2 * len + ny * (w0 + 0.03 * len) * topSide);
  c.stroke();
  c.strokeStyle = withAlpha(rim, 0.3);
  c.beginPath();
  c.moveTo(E.x - nx * w0 * topSide * 0.9 + ux * 0.05 * len, E.y - ny * w0 * topSide * 0.9 + uy * 0.05 * len);
  c.quadraticCurveTo(E.x - ca * 0.1 * len, E.y - sa * 0.1 * len, E.x - nx * w0 * topSide * 0.15 - ca * 0.35 * len, E.y - ny * w0 * topSide * 0.15 - sa * 0.35 * len);
  c.stroke();
  c.restore();
  // the shared forearm and hand, cut at the elbow
  c.save();
  c.beginPath();
  c.moveTo(E.x - sa * 4 * len, E.y + ca * 4 * len);
  c.lineTo(E.x + sa * 4 * len, E.y - ca * 4 * len);
  c.lineTo(E.x + sa * 4 * len + ca * 8 * len, E.y - ca * 4 * len + sa * 8 * len);
  c.lineTo(E.x - sa * 4 * len + ca * 8 * len, E.y + ca * 4 * len + sa * 8 * len);
  c.closePath();
  c.clip();
  hands.draw(c, hp, env, o);
  c.restore();
  // the turned-back cuff, standing a little proud of the sleeve: a step in the outline, rimmed on top
  const flipY = ca < 0 ? -1 : 1;
  c.save();
  c.translate(a.wrist.x, a.wrist.y);
  c.rotate(A);
  c.scale(len, len * flipY);
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-0.17, -0.3);
  c.lineTo(-0.2, -0.345);
  c.lineTo(-0.43, -0.352);
  c.lineTo(-0.45, -0.31);
  c.lineTo(-0.45, 0.31);
  c.lineTo(-0.43, 0.345);
  c.lineTo(-0.2, 0.34);
  c.lineTo(-0.17, 0.29);
  c.closePath();
  c.fill();
  c.restore();
  c.save();
  c.translate(a.wrist.x, a.wrist.y);
  c.rotate(A);
  c.scale(1, flipY);
  c.strokeStyle = withAlpha(rim, 0.55);
  c.lineWidth = Math.max(0.8, 1.2 * (len / HAND_LEN));
  c.beginPath();
  c.moveTo(-0.2 * len, -0.345 * len);
  c.lineTo(-0.43 * len, -0.352 * len);
  c.stroke();
  // the cuff's notch: a small dark nick where the turn-back meets the sleeve, cut with a rim line
  c.strokeStyle = withAlpha(rim, 0.32);
  c.beginPath();
  c.moveTo(-0.45 * len, -0.31 * len);
  c.lineTo(-0.45 * len, 0.31 * len);
  c.stroke();
  c.restore();
}

/** the light on the Wall: it comes from the lamp high at upper left, so a warm wash falls diagonally across the cork
 *  and dies toward W6's corner (lower right); a pool still sits on W4; the edges fall about a stop darker */
function wallPool(f: Frame, cm: Camera3) {
  const p = toScreen(LAYERS.L4, cm, W4C.x + 60, W4C.y - 30);
  const w6 = toScreen(LAYERS.L4, cm, W6C.x + 40, W6C.y + 40);
  const c = f.c;
  const m = f.mood;
  c.save();
  // the diagonal falloff: clear at the upper left, darkening along the light's direction toward the W6 corner
  const src = { x: -140, y: -160 };
  const diag = c.createLinearGradient(src.x, src.y, w6.x + 260, w6.y + 200);
  diag.addColorStop(0, withAlpha(m.fg, 0));
  diag.addColorStop(0.42, withAlpha(m.fg, 0.08));
  diag.addColorStop(0.72, withAlpha(m.fg, 0.34));
  diag.addColorStop(1, withAlpha(m.fg, 0.62));
  c.fillStyle = diag;
  c.fillRect(0, 0, 1280, 720);
  const dark = c.createRadialGradient(p.x - 40, p.y - 20, 260, p.x, p.y, 920);
  dark.addColorStop(0, withAlpha(m.fg, 0));
  dark.addColorStop(0.5, withAlpha(m.fg, 0.24));
  dark.addColorStop(1, withAlpha(m.fg, 0.5));
  c.fillStyle = dark;
  c.fillRect(0, 0, 1280, 720);
  c.globalCompositeOperation = 'lighter';
  // the lamp's warm throw from the upper left, and its pool on W4
  const throwG = c.createRadialGradient(src.x + 120, src.y + 120, 0, src.x + 120, src.y + 120, 760);
  throwG.addColorStop(0, withAlpha(m.halo, 0.16));
  throwG.addColorStop(0.55, withAlpha(m.halo, 0.06));
  throwG.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = throwG;
  c.fillRect(0, 0, 1280, 720);
  const warm = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 380);
  warm.addColorStop(0, withAlpha(m.halo, 0.12));
  warm.addColorStop(0.6, withAlpha(m.halo, 0.05));
  warm.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = warm;
  c.fillRect(p.x - 380, p.y - 380, 760, 760);
  c.restore();
}

/** the near lamp (L5): a banker's lamp at the lower right, side-on, most of it beyond the frame edge: the shade's
 *  crown with its finial, the rolled lip, a warm sliver of bulb-light under the lip, and the stem dropping out of
 *  frame. Drawn in screen px at WALL1 (divided by L5's scale there); the slow push WALL0 → WALL1 slides it ~120 px
 *  out toward the corner (L5 parallax), and it stays right of and below the quote card's text */
const K5 = toScreen(LAYERS.L5, WALL1, 0, 0).k;
const LAMP_S = { x: 1372, y: 606 }; // the shade's crown centre on screen at WALL1
const NEAR_LAMP = toLayer(LAYERS.L5, WALL1, LAMP_S.x, LAMP_S.y);
/** the bulb under the lip (screen at WALL1 → L5 layer px) */
const LAMP_BULB = toLayer(LAYERS.L5, WALL1, LAMP_S.x - 40, LAMP_S.y + 84);
function nearLamp(f: Frame, c: C, env: PaintEnv) {
  const m = env.mood;
  const W = 640, H = 320; // screen px of art
  const ox = 260, oy = 70; // the crown centre inside the art
  const draw = f.cached(`${ID}/nearLamp2/${m.id}`, W / K5, H / K5, (cc) => {
    cc.scale(1 / K5, 1 / K5);
    cc.translate(ox, oy);
    const ink = env.fill('fg');
    cc.fillStyle = ink;
    // the stem, from under the shade down out of frame
    cc.fillRect(-10, 70, 20, 260);
    // the shade: a long half-cylinder seen side-on, curving down to its ends
    const hw = 215;
    cc.beginPath();
    cc.moveTo(-hw, 74);
    cc.bezierCurveTo(-hw + 6, 18, -120, 0, 0, 0);
    cc.bezierCurveTo(120, 0, hw - 6, 18, hw, 74);
    cc.closePath();
    cc.fill();
    // the rolled lip: a band a little wider than the shade, its lower edge rounded
    cc.beginPath();
    cc.roundRect(-hw - 7, 68, 2 * hw + 14, 13, 6);
    cc.fill();
    // the finial: a knob on a short neck at the crown
    cc.fillRect(-3.5, -18, 7, 20);
    cc.beginPath();
    cc.arc(0, -22, 8.5, 0, Math.PI * 2);
    cc.fill();
    cc.beginPath();
    cc.ellipse(0, -1, 17, 4, 0, 0, Math.PI * 2);
    cc.fill();
    // the pull chain, hanging from under the lip
    cc.fillRect(-80, 80, 2, 50);
    cc.beginPath();
    cc.arc(-79, 133, 4.5, 0, Math.PI * 2);
    cc.fill();
    // rim: along the crown (the Wall's pool behind it), the finial, and the lip's top edge
    cc.strokeStyle = withAlpha(m.rim, 0.42);
    cc.lineWidth = 2.2;
    cc.beginPath();
    cc.moveTo(-hw + 3, 64);
    cc.bezierCurveTo(-hw + 8, 18, -120, 1.5, -10, 1.5);
    cc.stroke();
    cc.beginPath();
    cc.arc(0, -22, 8, Math.PI * 0.95, Math.PI * 1.75);
    cc.stroke();
    cc.strokeStyle = withAlpha(m.rim, 0.3);
    cc.lineWidth = 1.6;
    cc.beginPath();
    cc.moveTo(-hw - 6, 68.5);
    cc.lineTo(hw - 40, 68.5);
    cc.stroke();
    // the warm sliver under the lip: the bulb seen past the rolled edge
    const sl = cc.createLinearGradient(0, 80, 0, 92);
    sl.addColorStop(0, withAlpha(mixLab(m.halo, m.core, 0.5), 0.85));
    sl.addColorStop(1, withAlpha(m.halo, 0));
    cc.fillStyle = sl;
    cc.beginPath();
    cc.ellipse(-10, 82, hw - 14, 7, 0, 0, Math.PI);
    cc.fill();
  });
  draw(c, NEAR_LAMP.x - ox / K5, NEAR_LAMP.y - oy / K5);
}

/** W6: the 30-to-50-years slip in deep shadow, only its lower corner (about a third) catching the lamp; unread */
function w6Corner(c: C, env: PaintEnv) {
  const m = env.mood;
  const w = W6.w * WK, h = W6.h * WK;
  const rot = hash1(5, 23) * 0.04;
  c.save();
  c.translate(W6C.x, W6C.y);
  c.rotate(rot);
  // contact shadow and the dark paper (barely off the wall's tone, but a crisp cut edge)
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.fillRect(-w / 2 + 2, -h / 2 + 3, w, h);
  const dark = mixLab(mixLab(m.set, m.fg, 0.3), m.halo, 0.06);
  c.fillStyle = dark;
  c.fillRect(-w / 2, -h / 2, w, h);
  c.strokeStyle = withAlpha(m.rim, 0.1);
  c.lineWidth = 0.8;
  c.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);
  // the lit lower corner: everything beyond a soft diagonal shadow edge
  c.save();
  c.beginPath();
  c.rect(-w / 2, -h / 2, w, h);
  c.clip();
  const lit = mixLab(mixLab(m.setHaze, m.halo, 0.32), '#b08a52', 0.12);
  const ex = -w / 2 + w * 0.62, ey = h / 2; // the shadow edge runs from (-w/2, h/2 - .68h) to (ex, ey)
  const e0 = { x: -w / 2, y: h / 2 - h * 0.7 };
  const nx = -(ey - e0.y), ny = ex - e0.x; // normal toward the lit corner (lower left)
  const nl = Math.hypot(nx, ny);
  const mx = (e0.x + ex) / 2, my = (e0.y + ey) / 2;
  const g = c.createLinearGradient(mx + (nx / nl) * 6, my + (ny / nl) * 6, mx - (nx / nl) * 3, my - (ny / nl) * 3);
  g.addColorStop(0, withAlpha(lit, 0.92));
  g.addColorStop(1, withAlpha(lit, 0));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(-w / 2 - 2, h / 2 + 2);
  c.lineTo(-w / 2 - 2, e0.y - 6);
  c.lineTo(ex + 6, ey + 2);
  c.closePath();
  c.fill();
  // two typed lines' ends in the light, too small and broken to read
  c.fillStyle = withAlpha(mixLab(m.ink, lit, 0.2), 0.55);
  for (let i = 0; i < 3; i++) {
    const yy = h / 2 - 14 - i * 9;
    const len = (w * 0.55 - (i * 18)) * (0.7 + 0.2 * hash1(i, 61));
    for (let x = -w / 2 + 8; x < -w / 2 + 8 + len; x += 5 + 3 * Math.abs(hash1(i * 13 + x, 62))) c.fillRect(x, yy, 3, 1.6);
  }
  c.restore();
  // its pin, in the dark
  c.fillStyle = mixLab(m.set, m.halo, 0.12);
  c.beginPath();
  c.arc(0, -h / 2 + 6, 3.6, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** the W4 slip (the shared slip painter) with its due date left blank */
function w4Slip(c: C, env: PaintEnv, at: Pt, light: number, pin: boolean, k: number = WK, rot = 0) {
  // the slip's body is prop lettering: ~70% of the shared size, pale ink, so the quote card is the one text to read
  drawSlip(c, { ...W4V, who: '', text: '' }, { x: at.x, y: at.y, k, light, pin, rot }, env);
  const w = W4.w * k, h = W4.h * k;
  const seedRot = hash1(3, 23) * 0.04;
  c.save();
  c.translate(at.x, at.y);
  c.rotate(seedRot + rot);
  const ink = withAlpha(mixLab(env.mood.ink, env.mood.halo, 0.1), 0.85);
  typedText(c, W4V.text, 0, 9 * k, w * 0.74, h * 0.42, withAlpha(mixLab(env.mood.ink, env.mood.halo, 0.1), 0.6), 7 * k);
  c.fillStyle = ink;
  // the attribution line, condensed to fit the slip, and its rule
  c.font = `400 ${8.5 * k}px ${FONT.typewriter}`;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  const who = W4V.who;
  const tw = c.measureText(who).width;
  const sx = Math.min(1, (w - 14 * k) / tw);
  c.save();
  c.translate(-w / 2 + 7 * k, -h / 2 + 15 * k);
  c.scale(sx, 1);
  c.fillText(who, 0, 0);
  c.restore();
  c.fillRect(-w / 2 + 7 * k, -h / 2 + 21 * k, w - 14 * k, 0.7 * k);
  // DUE ____ : a due date left blank
  c.font = `400 ${7.5 * k}px "IBM Plex Mono"`;
  c.textAlign = 'right';
  c.textBaseline = 'alphabetic';
  c.fillText('DUE', w / 2 - 44 * k, h / 2 - 7 * k);
  c.fillRect(w / 2 - 40 * k, h / 2 - 7.5 * k, 32 * k, 0.6 * k);
  c.restore();
}

/** the X-ray box sleeps in this shot (no X-ray beat): its glass sits back under a dark, desaturating veil, so
 *  the inset's LED is the only live cyan */
function xraySleep(c: C, env: PaintEnv) {
  const s = STUDY.xray.s;
  const w = XRAY.w * s, h = XRAY.h * s;
  c.save();
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = '#808080';
  c.beginPath();
  c.roundRect(STUDY.xray.x - w / 2, STUDY.xray.y - h, w, h, 6 * s);
  c.fill();
  c.restore();
  c.fillStyle = withAlpha(env.mood.fg, 0.8);
  c.beginPath();
  c.roundRect(STUDY.xray.x - w / 2, STUDY.xray.y - h, w, h, 6 * s);
  c.fill();
}

// ================================================================================================ FILE
const FOLDER = { x: 470, y: 440, w: 420, h: 300 };
function paintFile(f: Frame, b: B, t: number) {
  const span = b.cutBoard - b.cutFile;
  // a slow top-down settle: a touch of dolly with a small drift toward the lamp, so the desk (L4), the lamp's foot
  // and the pen (L5) and the lamp's shade overhead (L6) slide against one another
  const fu = sm((t - b.cutFile) / span);
  f.camera({ ...CAMERA3_HOME, x: CAMERA3_HOME.x - 14 * fu, y: CAMERA3_HOME.y - 6 * fu, z: kz(1 + 0.035 * fu) });
  f.setMood('candleAmber');
  f.backlight({ intensity: 0.15 });
  const tq = tq12(t);
  // the hand carries the copy in from the lamp side (0 → .45), lets it fall (.5), the flat hand presses the flap
  // fileFold's flat-hand press is u .6–.75: map it onto the flap's close (closeAt → 'file'), so the carry is
  // already under way as the cut lands and the slip is over the folder by 'Put'
  const uDur = CLOSE_DUR / 0.15;
  const u0 = b.closeAt - 0.6 * uDur;
  const u = clamp01((tq - u0) / uDur);
  const placedAt = u0 + 0.5 * uDur;
  const close = sm((t - b.closeAt) / CLOSE_DUR);
  const S = 2.1;
  const drop = { x: FOLDER.x + 6, y: FOLDER.y + 8 };
  // hold the slip so its centre is over the folder's centre when the fingers open
  const heldOff = (W4.h / 2 - 8) * S * WK;
  const len = HAND_LEN * 1.45;
  const dropAt = { x: drop.x, y: drop.y - heldOff + len * 0.25 };
  const fall = sm((t - placedAt) / 0.2);
  f.layer('L4', (c, env) => {
    deskTop(c, env);
    folderBack(c, env, 4);
    if (tq >= placedAt) {
      // the copy falls the last inch into the file: it shrinks to the folder's plane, its shadow closing in
      const s = lerp(1.07, 1, fall);
      const sh = lerp(16, 3, fall);
      c.save();
      c.fillStyle = withAlpha(env.mood.fg, 0.3 * (1 - 0.4 * fall));
      c.translate(drop.x + sh, drop.y + sh);
      c.rotate(-0.05 + hash1(3, 23) * 0.04);
      c.fillRect((-W4.w * S * WK * s) / 2, (-W4.h * S * WK * s) / 2, W4.w * S * WK * s, W4.h * S * WK * s);
      c.restore();
      c.save();
      c.translate(drop.x, drop.y);
      c.scale(s, s);
      c.translate(-drop.x, -drop.y);
      w4Slip(c, env, drop, 0.8, false, S * WK, -0.05 + 0.03 * (1 - fall));
      c.restore();
    }
    folderFlap(c, env, close);
    if (u > 0 && u < 1) {
      const hp = hands.act('fileFold', u, drop, { held: 'slip', scale: 1.45, entry: { R: { x: 1440, y: 900 } }, dropAt });
      const heldDraw = (cc: C, at: Pt, _h: unknown, e: PaintEnv) => w4Slip(cc, e, { x: at.x, y: at.y + heldOff }, 0.85, false, S * WK, -0.05);
      // the hand's soft cast shadow on the desk and folder (the lamp is high at upper left)
      c.save();
      c.translate(10, 10);
      c.globalAlpha = 0.3;
      c.filter = `brightness(0) blur(${(3 * env.pxScale).toFixed(1)}px)`;
      hands.draw(c, hp, env, { heldDraw });
      c.restore();
      hands.draw(c, hp, env, { heldDraw });
    }
    // the lamp's pool: bright upper left, falling to dark at the edges
    const m = env.mood;
    const v = c.createRadialGradient(420, 300, 220, 520, 360, 820);
    v.addColorStop(0, withAlpha(m.fg, 0));
    v.addColorStop(0.6, withAlpha(m.fg, 0.28));
    v.addColorStop(1, withAlpha(m.fg, 0.82));
    c.fillStyle = v;
    c.fillRect(-200, -200, 1680, 1120);
  });
  f.practical({ x: 150, y: 70, kind: 'lamp', seed: 41, intensity: 0.42, radius: 80 });
  // the near plane, soft: the banker's lamp's round foot at upper left and a fountain pen lying whole at lower right
  f.layer('L5', (c, env) => {
    const m = env.mood;
    const lampFoot = f.cached(`${ID}/fileFoot/${m.id}`, 340, 300, (cc) => {
      const cx = 150, cy = 130;
      cc.fillStyle = env.fill('fg');
      // the cord, running off the left edge
      cc.lineWidth = 9;
      cc.strokeStyle = env.fill('fg');
      cc.beginPath();
      cc.moveTo(cx - 60, cy + 70);
      cc.bezierCurveTo(cx - 110, cy + 140, cx - 150, cy + 90, cx - 200, cy + 150);
      cc.stroke();
      // the stepped round foot (top-down): an outer ring, a raised inner ring, the stem's boss
      cc.beginPath();
      cc.arc(cx, cy, 128, 0, Math.PI * 2);
      cc.fill();
      cc.strokeStyle = withAlpha(m.rim, 0.32);
      cc.lineWidth = 3;
      cc.beginPath();
      cc.arc(cx, cy, 126, -0.2, 1.7);
      cc.stroke();
      cc.fillStyle = mixLab(env.fill('fg'), m.set, 0.18);
      cc.beginPath();
      cc.arc(cx, cy, 86, 0, Math.PI * 2);
      cc.fill();
      cc.strokeStyle = withAlpha(m.rim, 0.24);
      cc.lineWidth = 2;
      cc.beginPath();
      cc.arc(cx, cy, 85, -0.1, 1.6);
      cc.stroke();
      cc.fillStyle = env.fill('fg');
      cc.beginPath();
      cc.arc(cx, cy, 34, 0, Math.PI * 2);
      cc.fill();
      cc.strokeStyle = withAlpha(m.rim, 0.3);
      cc.beginPath();
      cc.arc(cx, cy, 33, 0, 1.5);
      cc.stroke();
    });
    lampFoot(c, -120, -70);
    const pen = f.cached(`${ID}/filePen/${m.id}`, 520, 120, (cc) => {
      cc.translate(260, 60);
      const ink = env.fill('fg');
      cc.fillStyle = ink;
      // the cap (with its clip), the barrel, the section and the nib: a fountain pen, whole
      cc.beginPath();
      cc.roundRect(-235, -15, 180, 30, 14);
      cc.fill();
      cc.fillRect(-215, -21, 120, 7);
      cc.beginPath();
      cc.arc(-95, -17.5, 4.5, 0, Math.PI * 2);
      cc.fill();
      cc.beginPath();
      cc.roundRect(-60, -13, 200, 26, 10);
      cc.fill();
      cc.beginPath();
      cc.moveTo(140, -11);
      cc.lineTo(176, -8);
      cc.lineTo(176, 8);
      cc.lineTo(140, 11);
      cc.fill();
      cc.beginPath();
      cc.moveTo(176, -8);
      cc.quadraticCurveTo(206, -4, 236, 0);
      cc.quadraticCurveTo(206, 4, 176, 8);
      cc.fill();
      // its rim, along the top edge toward the lamp
      cc.fillStyle = withAlpha(m.rim, 0.34);
      cc.fillRect(-225, -15, 160, 2);
      cc.fillRect(-52, -13, 186, 2);
      cc.fillStyle = withAlpha(m.rim, 0.5);
      cc.fillRect(-58, -13, 3, 26);
    });
    c.save();
    c.translate(1012, 616);
    c.rotate(-0.36);
    pen(c, -260, -60);
    c.restore();
  });
  // the nearest plane (L6, softest): the banker's lamp's long shade seen from above, hanging out over the desk from
  // its foot at the corner; its lip catches the bulb's light from beneath
  f.layer('L6', (c, env) => {
    const m = env.mood;
    const shade = f.cached(`${ID}/fileShade/${m.id}`, 520, 260, (cc) => {
      cc.translate(260, 130);
      cc.rotate(-0.4);
      cc.fillStyle = env.fill('fg');
      // the arm from the foot, then the half-cylinder shade (a long rounded slab from above) and its end caps
      cc.fillRect(-250, -9, 120, 18);
      cc.beginPath();
      cc.roundRect(-150, -62, 330, 124, 56);
      cc.fill();
      // the crown's ridge, faintly lit (the Wall's pool behind)
      cc.strokeStyle = withAlpha(m.rim, 0.22);
      cc.lineWidth = 3;
      cc.beginPath();
      cc.moveTo(-120, -4);
      cc.lineTo(150, -4);
      cc.stroke();
      // the lit lip along the edge facing the desk (the bulb is beneath it)
      cc.strokeStyle = withAlpha(m.halo, 0.42);
      cc.lineWidth = 4;
      cc.beginPath();
      cc.moveTo(-120, 60);
      cc.quadraticCurveTo(15, 66, 150, 60);
      cc.stroke();
    });
    shade(c, -40, -150);
  });
}

const manila = (env: PaintEnv) => mixLab(mixLab(env.mood.halo, '#b08a52', 0.35), env.mood.set, 0.22);
function deskTop(c: C, env: PaintEnv) {
  const m = env.mood;
  c.fillStyle = mixLab(m.set, m.fg, 0.3);
  c.fillRect(-200, -200, 1680, 1120);
  const g = c.createRadialGradient(380, 330, 30, 380, 330, 760);
  g.addColorStop(0, withAlpha(mixLab(m.setHaze, m.halo, 0.5), 0.95));
  g.addColorStop(0.6, withAlpha(mixLab(m.set, m.halo, 0.2), 0.5));
  g.addColorStop(1, withAlpha(m.set, 0));
  c.fillStyle = g;
  c.fillRect(-200, -200, 1680, 1120);
  c.strokeStyle = withAlpha(m.fg, 0.25);
  c.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const yy = -40 + i * 31 + hash1(i, 3) * 6;
    c.beginPath();
    c.moveTo(-200, yy);
    c.bezierCurveTo(300, yy + hash1(i, 4) * 14, 900, yy - hash1(i, 5) * 14, 1480, yy);
    c.stroke();
  }
}
function folderBack(c: C, env: PaintEnv, filed: number) {
  const { x, y, w: W, h: H } = FOLDER;
  const m = env.mood;
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(x - W / 2 + 8, y - H / 2 + 10, W, H);
  c.fillStyle = mixLab(manila(env), m.set, 0.25);
  c.fillRect(x - W / 2, y - H / 2, W, H);
  c.fillRect(x - W / 2 + 30, y - H / 2 - 22, 110, 24);
  c.fillStyle = withAlpha(m.fg, 0.2);
  c.fillRect(x - W / 2 + 14, y - H / 2 + 14, W - 28, H - 28);
  // the four earlier slips (the refrain's first four), their top edges standing a little proud of the folder
  for (let i = 0; i < filed; i++) {
    const sx = x - W / 2 + 150 + i * 46 + hash1(i, 41) * 8, sw = 70 + hash1(i, 42) * 30;
    c.fillStyle = withAlpha(m.fg, 0.3);
    c.fillRect(sx + 3, y - H / 2 - 8 - i * 2 + 3, sw, 14);
    c.fillStyle = mixLab(mixLab(m.rim, m.halo, 0.45 + 0.1 * i), m.set, 0.15 + 0.08 * i);
    c.fillRect(sx, y - H / 2 - 8 - i * 2, sw, 14);
  }
}
/** the front flap, hinged at the folder's bottom edge: lying open below it (close 0) → shut over it (close 1) */
function folderFlap(c: C, env: PaintEnv, close: number) {
  const { x, y, w: W, h: H } = FOLDER;
  const m = env.mood;
  const hinge = y + H / 2;
  const a = Math.PI * close; // 0: flat open, π: shut
  const ext = close < 0.5 ? H * 0.42 * Math.cos(a) : H * -Math.cos(a);
  if (close < 0.5) {
    // the inside of the flap, foreshortened below the hinge
    c.fillStyle = mixLab(manila(env), m.rim, 0.12);
    c.fillRect(x - W / 2, hinge, W, Math.max(0, ext));
    c.fillStyle = withAlpha(m.fg, 0.25);
    c.fillRect(x - W / 2, hinge + Math.max(0, ext) - 2, W, 2);
  } else {
    c.fillStyle = withAlpha(m.fg, 0.3);
    c.fillRect(x - W / 2 + 6, hinge - ext + 6, W, ext);
    c.fillStyle = manila(env);
    c.fillRect(x - W / 2, hinge - ext, W, ext);
    c.fillStyle = withAlpha(m.rim, 0.4);
    c.fillRect(x - W / 2, hinge - ext, W, 1.4);
    // the string-and-button closure, at the flap's free edge
    const by = hinge - ext + 26;
    if (ext > 40) {
      c.fillStyle = mixLab(manila(env), m.fg, 0.35);
      c.beginPath();
      c.arc(x, by, 9, 0, Math.PI * 2);
      c.arc(x, by + Math.min(70, ext - 40), 9, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = mixLab(m.fg, m.set, 0.4);
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(x, by);
      c.bezierCurveTo(x + 30, by + 20, x - 24, by + 40, x, by + Math.min(70, ext - 40));
      c.quadraticCurveTo(x + 40, by + Math.min(70, ext - 40) + 20, x + 26, by + Math.min(70, ext - 40) + 60);
      c.stroke();
    }
  }
}

// ================================================================================================ BOARD
/** the clue's three threads (script): FIRE (2012) above, the backward bead (1986) and the pierced stencil (1989)
 *  at left. Each runs on its own arc (control point, world px) so none crosses a card face or the case card. */
const TIES: { to: SlotId; ctrl: Pt }[] = [
  // drawn one after another so the eye can follow each: the pierced stencil (1989), the furnaces (2012), the
  // backward bead (1986)
  { to: 'C2-d', ctrl: { x: 660, y: 560 } },
  { to: 'C3-b', ctrl: { x: 912, y: 300 } },
  { to: 'C2-b', ctrl: { x: 640, y: 470 } },
];
const THREAD_GAP = 0.2;
const THREAD_DUR = 0.34;
function thread(c: C, env: PaintEnv, a: Pt, b: Pt, m: Pt, u: number, k: number, bead: number, comet = false) {
  if (u <= 0.003 || k <= 0.003) return;
  const at = (v: number) => {
    const w = 1 - v;
    return { x: w * w * a.x + 2 * w * v * m.x + v * v * b.x, y: w * w * a.y + 2 * w * v * m.y + v * v * b.y };
  };
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const [lw, al] of [[6, 0.07], [2.4, 0.22], [1, 0.62]] as const) {
    c.strokeStyle = withAlpha(env.mood.core, Math.min(1, al * k));
    c.lineWidth = lw;
    c.beginPath();
    c.moveTo(a.x, a.y);
    const n = 36;
    for (let i = 1; i <= n * Math.min(1, u); i++) {
      const p = at(i / n);
      c.lineTo(p.x, p.y);
    }
    c.stroke();
  }
  // the shimmer: a soft bead of light running from the clue out along the thread
  if (bead > 0 && bead < 1) {
    const p = at(bead);
    const a2 = Math.sin(Math.PI * bead);
    if (comet) {
      // a bright tail behind the bead
      c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.2), 0.9 * a2);
      c.lineWidth = 2.6;
      c.lineCap = 'round';
      c.beginPath();
      const t0 = Math.max(0, bead - 0.16);
      for (let i = 0; i <= 8; i++) {
        const q = at(t0 + ((bead - t0) * i) / 8);
        if (i === 0) c.moveTo(q.x, q.y);
        else c.lineTo(q.x, q.y);
      }
      c.stroke();
    }
    const R = comet ? 22 : 14;
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
    g.addColorStop(0, withAlpha(env.mood.core, 0.85 * a2));
    g.addColorStop(1, withAlpha(env.mood.core, 0));
    c.fillStyle = g;
    c.fillRect(p.x - R, p.y - R, 2 * R, 2 * R);
  }
  c.restore();
}

function boardCam(b: B, t: number): Camera3 {
  if (t < b.truck0) {
    const u = sm((t - b.cutBoard) / (b.truck0 - b.cutBoard));
    return mixCamLinear(BOARD0, BOARD1, u);
  }
  // the truck right to the Wall (screen path of the LED card), settling on it, then the push into it
  const s0 = toScreen(LAYERS.L4, BOARD1, IC.x, IC.y);
  const u = ease.move(clamp01((t - b.truck0) / (b.truck1 - b.truck0)));
  const s = { x: lerp(s0.x, 640, u), y: lerp(s0.y, 360, u) };
  // the push, eased in log scale over ≈ 1.0 s (truck0 + 0.1 → the handoff)
  const kb = Math.log(kOf(BOARD1)), kf = Math.log(K_FULL);
  const v = clamp01((Math.min(t, b.pushB) - b.truck0 - 0.1) / (b.pushB - b.truck0 - 0.1));
  const k = Math.exp(lerp(kb, kf, v * v * v * (v * (6 * v - 15) + 10)));
  return frameOn(IC, s, k);
}

function paintBoard(f: Frame, b: B, t: number) {
  const cm = boardCam(b, t);
  f.camera(cm);
  // the lamp crossfades to serverCyan under the push (0.8 s, no dip)
  const mu = sm((t - b.pushA) / (b.pushB - b.pushA));
  if (mu > 0) f.setMood('serverCyan', { from: 'candleAmber', u: mu });
  else f.setMood('candleAmber');
  studyRoom(f, { key: ID, cams: CAMS, outside: { mood: 'duskRose', kind: 'city' } });
  const tq = tq12(t);
  const c0 = b.clueLand - 0.45 * CLUE_DUR;
  const u = (tq - c0) / CLUE_DUR;
  const pin = CLUE_PIN;
  const entry = handsEntry(cm, 'L4');
  const thr = (d: number) => sm((t - b.threads - d) / THREAD_DUR);
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: false,
    xray: { light: 0.18 },
    wall: { hide: ['W6'] },
    extra: (c, env) => {
      wallExtras(c, env, true);
      if (u >= 0.45) {
        TIES.forEach(({ to, ctrl }, i) => {
          const bead = (t - b.clue - i * 0.07) / 0.55;
          // the head of each thread as it draws carries a bright bead, so the eye rides it to its card; ON the
          // 'clue' beat the threads flare and a comet of light runs out along each (the music sting's picture)
          const grow = thr(i * THREAD_GAP);
          const flare = Math.exp(-Math.max(0, t - b.clue) * 2.6) * win(t, b.clue - 0.04, b.clue + 0.04);
          thread(c, env, pin, slotWorld(to, 'pin'), ctrl, grow, 1.45 + 1.3 * flare, grow > 0 && grow < 1 ? grow : bead, grow >= 1 && bead > 0 && bead < 1);
        });
        const land = Math.exp(-Math.max(0, t - b.clueLand) * 2.0) * win(t, b.clueLand - 0.04, b.clueLand + 0.08);
        const ring = 0.3 * Math.exp(-Math.max(0, t - b.threads) * 1.4) * win(t, b.threads, b.threads + 0.2);
        const shimmer = 0.22 * Math.exp(-Math.max(0, t - b.clue) * 2.5) * win(t, b.clue - 0.05, b.clue + 0.1);
        const glow = 0.3 * land + ring + shimmer;
        drawCard(c, C3C, { x: C3W.x, y: C3W.y, k: STUDY.board.k * CLUE_K, light: poolAt(POOL, C3C.x, C3C.y) + glow, lit: glow > 0.05 }, env);
      }
      if (u > 0 && u < 1) {
        const hp = pinPose(hands.act('pin', u, pin, { held: 'card', scale: 0.66, entry }), u, tq, b.clueLand);
        const o: HeldDraw = {
          heldDraw: (cc, at, _h, e) => drawCard(cc, C3C, { x: at.x, y: at.y + (C3C.h / 2 - 7) * CLUE_K, k: STUDY.board.k * CLUE_K, light: 0.8, pin: false }, e),
        };
        castShadow(c, (g) => wallArm(g, hp, env, o, 'below'), 13, 15, 0.5, 3 * env.pxScale);
        wallArm(c, hp, env, o, 'below');
      }
    },
  });
  f.layer('L4', (c, env) => dustMotes(c, { area: { x: C3W.x - 520, y: C3W.y - 330, w: 1500, h: 640 }, count: 34, drift: { x: -3, y: -2 }, brightness: 0.45, salt: 815 }, env));
  // the shared study near plane (L6): the pelmet along the top, the drape at far left, the wing-chair back on the
  // lamp side; the truck slides it across faster than the board, and it thins away as the push begins
  const kNow = kOf(cm);
  const nearA = 1 - sm((kNow - 1.24) / 0.2);
  if (nearA > 0.002) {
    f.layer('L6', (c, env) => {
      const r = BOARD_NEAR_R;
      const draw = f.cached(`${ID}/boardNear/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        drapery(cc, { x: -60, top: r.y - 20, bottom: 1240, w: 150, side: 'left', folds: 6, seed: 3 }, env);
        valance(cc, { x0: r.x - 20, x1: r.x + r.w + 20, y: -20, depth: 30 }, env);
        chairBack(cc, { x: 2280, y: 1330, s: 1.35, kind: 'wing' }, env);
      });
      c.save();
      c.globalAlpha = nearA;
      draw(c, r.x, r.y);
      c.restore();
    });
  }
  // the LED card on the Wall: off frame right during the insert (its spill just touches the edge), then the truck
  // brings it in and the push dives into it
  paintInset(f, b, t, insetRect(cm));
}

function mixCamLinear(a: Camera3, c: Camera3, u: number): Camera3 {
  const ka = kOf(a), kc = kOf(c);
  return { x: lerp(a.x, c.x, u), y: lerp(a.y, c.y, u), z: kz(Math.exp(lerp(Math.log(ka), Math.log(kc), u))), lens: 1 };
}

// ================================================================================================ THE INSET
function paintInset(f: Frame, b: B, t: number, rect: InsetRect) {
  const open = sm((t - (b.waiting - 0.2)) / 0.32);
  if (open <= 0) return;
  // fully off frame (beyond its spill): nothing to draw
  if (rect.x > 1280 + rect.w * 0.6 || rect.x + rect.w < -rect.w * 0.6) return;
  const g = insetGeo();
  // how many LEDs are lit: one on 'waiting', two on 'faster', dozens on 'G P Us', the aisle by 'available'
  let n = 0;
  if (t >= b.waiting) n = 1;
  if (t >= b.faster) n = 1 + clamp01((t - b.faster) / 0.25);
  if (t >= b.gpus) n = Math.exp(lerp(Math.log(2), Math.log(g.n0), sm((t - b.gpus) / (b.bigger - b.gpus + 0.1))));
  if (t >= b.bigger) n = Math.exp(lerp(Math.log(g.n0), Math.log(g.leds.length), sm((t - b.bigger) / (b.avail - b.bigger + 0.2))));
  // the inner camera: close on the first LED, then pulling back to the whole aisle; a slow drift after
  const pz = sm((t - (b.gpus - 0.15)) / (b.avail + 0.35 - (b.gpus - 0.15)));
  let zoom = Math.exp(lerp(Math.log(5.2), 0, pz)) * (1 + 0.05 * sm((t - b.avail) / (b.pushA - b.avail)));
  let pivot = sm(pz);
  // the push: the camera dives into the card; inside it, the inner camera dives back onto the first LED
  // (progress is measured by the card's own size on screen, so the study stays until the card has grown over it)
  const rA = INSET_REST_W;
  const q = t > b.truck0 ? clamp01(Math.log(rect.w / rA) / Math.log(1360 / rA)) : 0;
  const fade = sm(clamp01((q - 0.15) * 1.4));
  if (q > 0) {
    const app = Math.exp(lerp(Math.log(zoom * (rA / IW)), Math.log(3.4 * (1360 / IW)), sm(q)));
    zoom = app / (rect.w / IW);
    pivot = lerp(pivot, 0, sm(q * 1.15));
    // the study dims into the night as the card grows over it (never a pale board)
    f.c.fillStyle = withAlpha(MOODS.serverCyan.fg, 0.85 * sm(q * 1.2));
    f.c.fillRect(0, 0, 1280, 720);
  }
  // the shutter: the card's window opens as a slit widening top and bottom
  const r = open < 1 ? { x: rect.x, y: rect.y + (rect.h * (1 - open)) / 2, w: rect.w, h: rect.h * open } : rect;
  const study = MOODS.candleAmber;
  const flare = win(t, b.D - 0.16, b.D - 0.06);
  // 'bigger datasets': faint picture-tiles drift down the aisle floor toward us
  const tiles = win(t, b.datasets - 0.1, b.datasets + 0.6);
  const paper = paperTone({ mood: f.mood } as PaintEnv, 0.72);
  ledInset(f.c, {
    rect: r,
    mount: rect,
    n,
    zoom,
    pivotMix: pivot,
    fade,
    racks: 1,
    t,
    frame: 1 - sm((q - 0.45) * 2.2),
    study: { ink: study.ink, rim: f.mood.rim, fg: f.mood.fg, paper },
    flare,
    tiles,
    pxScale: f.pxScale,
  });
}
