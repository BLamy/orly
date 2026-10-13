/**
 * ch11-s02 — the 2019 card and the 1985 card (candleAmber, STUDY LOCK; 27.6 s; cut in from the library).
 *
 * CAMERA: BOARD (column C3 → C4, the hands at work) → INSERT on the new card → WINDOW glance (the library: no tag on
 * any shelf) → back to the card → FILE (top-down) → the PAIR of cards (a lateral dolly with a rack focus) → SHELF.
 *   lead-in    the hands pin a small card in the gutter between C3 and C4 (GENERATING WIKIPEDIA · 2018 · GPT)
 *   'writing'  an oxblood thread, run from ch10's thread-of-light card at the foot of C3, lands on it: the blueprint
 *              passes hands (the Transformer's writing half → a decoder-only model)
 *   'goal'     a crisp new card is pinned beside it (IBM Plex Mono): the 2019 sentence, its source small at the foot
 *   'predict'  'predict the next word' catches the lamp
 *   'labels'   a glance through the window at the library of raw text: not one tag on any shelf
 *   ≈ 13.6     back on the card: each word in turn underlines the word after it (every next word its own answer)
 *   'oldCard'  the breath before 'From': the FILE (top-down): the folder opens, a yellowed card is drawn out (filed in
 *              chapter 5): the 1985 sentence in VT323 phosphor-green on old stock, the key words underlined in faded ink
 *   'Lenat's'  the hands pin it beside the new card, level and the same size; a lateral dolly between them, the focus
 *              racking from 2019 to 1985, then a push in on the 1985 card as 'practically nothing' is said (its
 *              words underlining themselves in faded ink, legible: the card is the subject)
 *   'from'     the pull back: the 1985 card at frame left, the study window at frame right
 *   'raw'      a thread of light runs from the 1985 card toward the library glowing in the window
 *   'sensible' SHELF: the thin Cyc taper (lit 1984, 35 rings burned, still burning in 2019) flickers once and steadies;
 *              the camera rests along the shelf, warmly (no irony: the old card is lit as warmly as the new)
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at a pitch of 6 px per ring
 * at L3 (270 px), its flame on the top ring and a small tag at its base giving the year it was lit. It burns down one
 * ring per year the belief is held; the burned wax stays above the stub as a ghost sleeve.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { LAYERS, defineShot, hash1, mixLab, overscan, toLayer, toScreen, withAlpha } from '../../../film';
import { cardProbe, legibleSize } from '../../../film/silhouette/type';
import { FONT } from '../../../film/silhouette/type';
import { hands } from '../cast';
import { HAND_LEN, type Pt } from '../sets/narratorHands';
import { STUDY, STUDY_WALL, candleX, slotWorld, studyCase, studyNear } from '../sets/study';
import { bankersLamp, candlestick } from '../../../film/silhouette/props';
import type { LayerSpec } from '../../../film';
import { LIT_HEIGHT, SLOTS, shelfStateAt, xrayBandsAt } from '../sets/studyState';
import { vellumBox, vellumHalo } from '../sets/ch11-s01-vellum';
import { candleFlame, fontForYear } from '../sets/beliefCandle';
import { DEFAULT_POOL, oxblood, poolAt } from '../sets/caseBoard';
import { screenPass } from '../sets/ch06-s01-kit';
import { LIBV, LIB_WINDOW, WINDOW_CAM, clamp01, lerp, libraryRoom, mixCam, pinArm, sm, tq12, win } from '../sets/ch11-s01-kit';
import { CARD19, CARD85, GPT_CARD, GW_CARD, drawQuoteCard, lineageCard, type QuoteCardGeo } from '../sets/ch11-s02-cards';

type C = CanvasRenderingContext2D;
const ID = 'ch11-s02';
const POOL = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };
const V = shelfStateAt(ID, 'start');
const CYC_X = candleX(V, 'cyc');
const CYC = V.find((v) => v.id === 'cyc')!;
const CYC_FLAME = candleFlame({ x: CYC_X, y: STUDY.shelf.y, view: CYC, s: STUDY.shelf.s });
/** the shelf views with Cyc's label reading as of 2019 ('lit 1984 · still burning': it goes out only in ch13) */
const V_NAMED = V.map((v) => (v.id === 'cyc' ? { ...v, years: null } : v));
/** the Cyc taper's label: named through the shelf hold (drawn by the shot BELOW THE SHELF LIP, review round 3: beside
 *  the flame it sat over the neighbouring candle's 'NEURAL NETS ARE FIDDLY' wax lettering) */
function cycNamed(t: number, b: B): number {
  return win(t, b.taper - 0.3, b.taper + 0.3) * (1 - win(t, b.D - 0.9, b.D - 0.35));
}

// ------------------------------------------------------------------------------------------------ cameras
const BOARD0: Camera3 = { x: 868, y: 330, z: 190, lens: 1 };
const BOARD1: Camera3 = { x: 872, y: 318, z: 214, lens: 1 };
/** the push in (≈1.4×) on the C3 → C4 thread, landing on the GPT card on 'writing' */
const THREAD: Camera3 = { x: 878, y: 292, z: 428, lens: 1 };
/** the 2019 card framed in the LEFT of the frame (screen ≈ 430, 420), the chat box at right: the glossary tag
 *  (core/terms.ts, top-left from 'predict') then hangs over plain cork above the FIRE column, not over the WHO TAUGHT
 *  IT? case card (review round 3) */
const C19A: Camera3 = { x: CARD19.x + 117, y: CARD19.y - 30, z: 500, lens: 1 };
const C19B: Camera3 = { x: CARD19.x + 109, y: CARD19.y - 28, z: 540, lens: 1 };
/** back on the card for the chain, centred, then an 8 % push in (z 540 → 574 is k 2.17 → 2.35 on L4) */
const C19C0: Camera3 = { x: CARD19.x + 2, y: CARD19.y + 6, z: 540, lens: 1 };
const C19C1: Camera3 = { x: CARD19.x + 4, y: CARD19.y + 8, z: 574, lens: 1 };
/** the window as the hero (review round 3): the glass fills ≈ 70 % of the frame width (wall k ≈ 2.9), centred on the
 *  window (a wall-plane point wx sits at frame centre for cam.x = 640 + (wx − 640)·1.07) */
const wallCam = (wx: number, wy: number, z: number): Camera3 => ({ ...WINDOW_CAM, x: 640 + (wx - 640) * (STUDY_WALL.z / 1000), y: 360 + (wy - 360) * (STUDY_WALL.z / 1000), z });
const WIN0: Camera3 = wallCam(STUDY.window.x + STUDY.window.w / 2 + 8, 520, 700);
const WIN1: Camera3 = wallCam(STUDY.window.x + STUDY.window.w / 2 + 2, 512, 716);
const PAIR0: Camera3 = { x: (CARD19.x + CARD85.x) / 2 - 30, y: CARD19.y - 4, z: 360, lens: 1 };
const PAIR1: Camera3 = { x: (CARD19.x + CARD85.x) / 2 + 40, y: CARD19.y - 6, z: 392, lens: 1 };
/** close on the 1985 card while 'practically nothing' is said (VT323 at ≈ 27 px cap height at 1080p) */
const C85A: Camera3 = { x: CARD85.x - 6, y: CARD85.y - 2, z: 588, lens: 1 };
const C85B: Camera3 = { x: CARD85.x + 2, y: CARD85.y - 4, z: 606, lens: 1 };
/** the pull back on 'raw': the 1985 card at frame left, the study window (its library) at frame right */
/** (review round 3) 40 px lower than before and further back, so the 1985 card, the chat box and the window glass are
 *  all whole where the thread lands (the Wall of Forecasts' slips no longer cropped at the top edge) */
const RAWCAM: Camera3 = { x: 1598, y: 440, z: -285, lens: 1 };
/** the shelf (review round 3): framed higher so the plank and its apron read above the near lip, the label under it */
const SHELF0: Camera3 = { x: CYC_X + 40, y: STUDY.shelf.y - 70, z: 430, lens: 1 };
/** the shelf hold (music only to the end): a slow truck along the candles, the taper drifting toward frame centre */
const SHELF1: Camera3 = { x: CYC_X + 12, y: STUDY.shelf.y - 74, z: 455, lens: 1 };
const CAMS = [BOARD0, BOARD1, THREAD, C19A, C19B, C19C0, C19C1, WIN0, WIN1, PAIR0, PAIR1, C85A, C85B, RAWCAM, SHELF0, SHELF1];

interface B {
  D: number;
  linPin: number;
  gptPin: number;
  thread0: number;
  /** the thread reaches the GENERATING WIKIPEDIA card */
  threadGw: number;
  push0: number;
  blueprint: number;
  goal: number;
  predict: number;
  /** the gold sheen across 'predict the next word' starts here (0.4 s) */
  sheen0: number;
  move19: number;
  win0: number;
  win1: number;
  /** 'labels': the empty tag-hooks glint */
  labels: number;
  chain0: number;
  chain1: number;
  file0: number;
  /** the hand pinches the old card on the oldCard beat: the drawing-out starts here */
  oldCard: number;
  /** the rack focus 2019 → 1985 ends as 'From' is said */
  rackEnd: number;
  pair0: number;
  pin85: number;
  rack0: number;
  close0: number;
  pull0: number;
  raw: number;
  shelf0: number;
  taper: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const goal = T.beat('newCard');
    // round 3 (re-recorded narration): the lead-in pins are anchored to the new take. The GENERATING WIKIPEDIA card
    // is up before the first word; the GPT card lands as 'G P T' is said; the oxblood thread then runs C3-d → GW → GPT,
    // brisk, landing on 'writing' (the blueprint passing hands)
    const PIN = 1.1;
    const gptPin = T.word('L1103', 'G') - 0.45 * PIN;
    const thread0 = gptPin + PIN + 0.05;
    const push0 = T.word('L1103', 'Transformer\'s') - 0.8;
    const blueprint = T.beat('blueprint');
    const b: B = {
      D,
      linPin: Math.min(0.15, T.line('L1103').start - 0.45 * PIN),
      gptPin,
      thread0,
      threadGw: Math.min(blueprint - 0.7, Math.max(push0 + 0.2, thread0 + 0.85)),
      push0,
      blueprint,
      goal,
      predict: T.beat('predict'),
      sheen0: T.word('L1103', 'predict') - 0.15,
      move19: T.word('L1103', 'pages') - 0.2,
      win0: T.beat('noLabels') - 0.12,
      win1: T.word('L1103', 'every') - 0.1,
      labels: T.beat('noLabels'),
      chain0: T.word('L1103', 'every'),
      chain1: T.wordEnd('L1103', 'answer'),
      file0: T.beat('oldCard') - 0.15,
      oldCard: T.beat('oldCard'),
      rackEnd: T.line('L1104').start,
      pair0: T.word('L1104', "Lenat's") + 0.05,
      pin85: T.word('L1104', "Lenat's") + 0.05,
      rack0: T.word('L1104', 'practically') - 0.35,
      // the push in on the 1985 card lands as 'practically' is said; the pull back starts on the second 'from'
      close0: T.word('L1104', 'practically') - 0.65,
      // (the pull back starts just after 'nothing', so the mid-move frames around 'raw' are already wide)
      pull0: T.word('L1104', 'nothing') + 0.1,
      raw: T.beat('thread'),
      shelf0: T.word('L1104', 'Sensible') - 0.32,
      taper: T.beat('taper'),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    if (t >= b.file0 && t < b.pair0) return paintFile(f, t, b);
    const cam = camAt(t, b);
    f.camera(cam);
    const tq = tq12(t);
    const flick = flickAt(t, b.taper);
    libraryRoom(f, { key: ID, cams: CAMS, crisp: true, windowGlow: 0.25 + 0.6 * win(t, b.raw + 0.3, b.raw + 0.7) + 0.3 * (t > b.win0 && t < b.win1 ? 1 : 0) });
    // the arms enter from the bottom edge below the board (bent at the elbow, never across the chat box)
    const below = toLayer(LAYERS.L4, cam, 700, 820);
    const entry = { R: below, L: below };
    const rack = 0;
    studyCase(f, {
      shot: ID,
      when: 'start',
      key: ID,
      flames: false,
      xray: false,
      shelf: { views: V_NAMED, over: { cyc: { flame: flick } }, named: {} },
      extra: (c, env) => {
        // the X-ray as backlit vellum (the round-1 restyle, as in ch11-s01)
        vellumBox(c, env, { ...STUDY.xray, state: xrayBandsAt(ID, 'start'), light: 0.85 });
        vellumHalo(c, STUDY.xray, 0.85);
        boardBeat(c, env, t, tq, b, entry, rack, cam);
      },
    });
    // candle flames (the Cyc taper's own, with the flicker)
    for (const v of V) {
      if (v.state !== 'live') continue;
      const p = candleFlame({ x: candleX(V, v.id), y: STUDY.shelf.y, view: v, s: STUDY.shelf.s });
      const k = v.id === 'cyc' ? flick : 1;
      f.practical({ x: p.x, y: p.y + 2, kind: 'candle', seed: 300 + v.slot * 7, intensity: 0.9 * k, radius: v.id === 'cyc' ? 34 : 40 });
    }
    if (cam.z < 330) studyNear(f, { key: ID, cams: CAMS.filter((q) => q.z < 480), file: true });
    pairNear(f, t, b, cam);
    if (t >= b.win0 && t < b.win1) windowGlance(f, t, b, cam);
    if (t >= b.shelf0) shelfNear(f, cam);
    if (t >= b.shelf0) {
      // the shelf: a pool of light on the Cyc taper; its neighbours fall away into the room's shadow
      const sp = toScreen(LAYERS.L4, cam, CYC_FLAME.x, CYC_FLAME.y + 20);
      screenPass(f, (c) => {
        const g = c.createRadialGradient(sp.x, sp.y - 60, 90, sp.x, sp.y - 60, 640);
        g.addColorStop(0, withAlpha(f.mood.fg, 0));
        g.addColorStop(0.45, withAlpha(f.mood.fg, 0.28));
        g.addColorStop(1, withAlpha(f.mood.fg, 0.62));
        c.fillStyle = g;
        c.fillRect(-4, -4, 1288, 728);
      });
      cycLabel(f, cam, cycNamed(t, b));
    }
    // the glossary tag (core/terms.ts, top-left, 'TOKENS' from 'predict'): the board's corner falls into the lamp's
    // shadow while it hangs, so the tag reads over a plain dark field
    const termK = win(t, b.predict - 0.1, b.predict + 0.4) * (1 - win(t, b.win0 - 0.4, b.win0));
    if (termK > 0) {
      screenPass(f, (c) => {
        const g = c.createRadialGradient(170, 70, 30, 170, 70, 520);
        const dark = mixLab(f.mood.ink, '#000000', 0.35);
        g.addColorStop(0, withAlpha(dark, 0.72 * termK));
        g.addColorStop(0.5, withAlpha(dark, 0.45 * termK));
        g.addColorStop(1, withAlpha(dark, 0));
        c.fillStyle = g;
        c.fillRect(-4, -4, 760, 560);
      });
    }
    void CYC_FLAME;
    void LIT_HEIGHT;
  },
});

// ================================================================================================= CAMERA
function camAt(t: number, b: B): Camera3 {
  if (t < b.push0) return mixCam(BOARD0, BOARD1, sm(t / b.push0));
  if (t < b.move19) return mixCam(BOARD1, THREAD, sm((t - b.push0) / (b.blueprint + 0.45 - b.push0)));
  if (t < b.win0) return mixCam(mixCam(THREAD, C19A, sm((t - b.move19) / 1.6)), C19B, sm((t - b.move19 - 1.6) / (b.win0 - b.move19 - 1.6)) * 0.4);
  if (t < b.win1) return mixCam(WIN0, WIN1, sm((t - b.win0) / (b.win1 - b.win0)));
  // the chain: back on the card, centred, pushing in ≈ 8 % while the hops run (so the chain is the subject)
  if (t < b.file0) return mixCam(C19C0, C19C1, sm((t - b.chain0 + 0.1) / 1.9));
  if (t < b.shelf0) {
    const u1 = sm((t - b.pair0) / 0.9);
    const pair = mixCam(PAIR0, PAIR1, u1);
    const uc = sm((t - b.close0) / 0.75);
    const close = mixCam(C85A, C85B, sm((t - b.close0 - 0.75) / (b.pull0 - b.close0 - 0.75)));
    const near = mixCam(pair, close, uc);
    // the pull back: eased out over 1.2 s, landing as the thread reaches the glass
    const u2 = sm((t - b.pull0) / 1.2);
    return mixCam(near, RAWCAM, u2);
  }
  return mixCam(SHELF0, SHELF1, sm((t - b.shelf0) / (b.D - b.shelf0)));
}

// ================================================================================================= BOARD
/** the lineage: a GENERATING WIKIPEDIA · 2018 card clear of C3's DATA card, and GPT as its own card at the head of C4 */
const GW = GW_CARD;
const GPT = GPT_CARD;
const GW_PIN = { x: GW.x, y: GW.y - GW.h / 2 + 7 };
const GPT_PIN = { x: GPT.x, y: GPT.y - GPT.h / 2 + 7 };
const C3D_PIN = slotWorld('C3-d', 'pin');
/** the thread's path: C3-d → up the gutter → GW → GPT (world points; u 0..1 along it) */
const PATH: Pt[] = [C3D_PIN, { x: 850, y: 380 }, { x: 852, y: 210 }, { x: GW.x - 30, y: GW.y + GW.h / 2 - 4 }, { x: GW.x + 30, y: GW.y + GW.h / 2 - 4 }, { x: GPT.x - 16, y: GPT_PIN.y }];
const SEG_LEN = PATH.slice(1).map((p, i) => Math.hypot(p.x - PATH[i].x, p.y - PATH[i].y));
const TOTAL = SEG_LEN.reduce((a, v) => a + v, 0);
/** the length along PATH at which the thread reaches the GW card */
const AT_GW = (SEG_LEN[0] + SEG_LEN[1] + SEG_LEN[2]) / TOTAL;
function pathAt(u: number): { pts: Pt[]; end: Pt } {
  let d = clamp01(u) * TOTAL;
  const pts: Pt[] = [PATH[0]];
  for (let i = 0; i < SEG_LEN.length; i++) {
    if (d <= SEG_LEN[i]) {
      const k = d / SEG_LEN[i];
      const e = { x: lerp(PATH[i].x, PATH[i + 1].x, k), y: lerp(PATH[i].y, PATH[i + 1].y, k) };
      pts.push(e);
      return { pts, end: e };
    }
    d -= SEG_LEN[i];
    pts.push(PATH[i + 1]);
  }
  return { pts, end: PATH[PATH.length - 1] };
}

function boardBeat(c: C, env: PaintEnv, t: number, tq: number, b: B, entry: { R: Pt; L: Pt }, rack: number, cam: Camera3) {
  // ---- the two lineage cards (pinned in the lead-in) and the oxblood thread run through them from C3-d
  const uLin = (tq - b.linPin) / 1.1;
  const uGpt = (tq - b.gptPin) / 1.1;
  const landed = win(t, b.blueprint - 0.1, b.blueprint + 0.3) * (1 - win(t, b.blueprint + 1.6, b.blueprint + 2.6));
  if (uLin >= 0.45) {
    lineageCard(c, env, GW, ['GENERATING', 'WIKIPEDIA · 2018'], 12.6, 0.15);
    cardProbe(c, 'ch11-s02/gw', GW.x - GW.w / 2, GW.y - GW.h / 2, GW.w, GW.h, 1, 1);
  }
  if (uGpt >= 0.45) {
    lineageCard(c, env, GPT, ['GPT'], 21, 0.15 + 0.35 * landed);
    cardProbe(c, 'ch11-s02/gpt', GPT.x - GPT.w / 2, GPT.y - GPT.h / 2, GPT.w, GPT.h, 1, 1);
  }
  // the thread: C3-d → GW by 'Transformer's', GW → GPT landing on 'writing'
  const tGw = b.threadGw;
  const th = tq < tGw ? AT_GW * clamp01((tq - b.thread0) / (tGw - b.thread0)) : AT_GW + (1 - AT_GW) * clamp01((tq - tGw) / (b.blueprint - tGw));
  if (tq > b.thread0) {
    const { pts, end } = pathAt(th);
    c.save();
    c.strokeStyle = oxblood(env, 0.4 + 0.35 * landed);
    c.lineWidth = 2.8;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
    c.stroke();
    c.restore();
    // the brass pins glint as the thread passes them, the GPT pin brightest as it lands
    glint(c, env, GW_PIN, win(t, tGw - 0.1, tGw + 0.1) * (1 - win(t, tGw + 0.3, tGw + 0.9)));
    if (th >= 1) glint(c, env, GPT_PIN, 1.2 * landed);
    if (th < 1) {
      const pose = { right: hands.reach(entry.R, { x: end.x + 3, y: end.y + 2 }, 'pinch', HAND_LEN * 0.6), scale: 0.6 };
      pinArm(c, env, pose);
    }
  }
  if (uLin > 0 && uLin < 1) {
    const pose = hands.act('pin', uLin, GW_PIN, { held: 'card', scale: 0.6, entry });
    pinArm(c, env, pose, {
      heldDraw: (cc, at, _h, e) => {
        lineageCard(cc, e, { ...GW, x: at.x, y: at.y + GW.h / 2 - 7 }, ['GENERATING', 'WIKIPEDIA · 2018'], 12.6, 0.3);
        cardProbe(cc, 'ch11-s02/gw-held', at.x - GW.w / 2, at.y - 7, GW.w, GW.h, 1, 1);
      },
    });
  }
  if (uGpt > 0 && uGpt < 1) {
    const pose = hands.act('pin', uGpt, GPT_PIN, { held: 'card', scale: 0.6, entry });
    pinArm(c, env, pose, {
      heldDraw: (cc, at, _h, e) => {
        lineageCard(cc, e, { ...GPT, x: at.x, y: at.y + GPT.h / 2 - 7 }, ['GPT'], 21, 0.3);
        cardProbe(cc, 'ch11-s02/gpt-held', at.x - GPT.w / 2, at.y - 7, GPT.w, GPT.h, 1, 1);
      },
    });
  }
  // ---- the 2019 card: pinned on 'goal'
  const PIN_DUR = 1.15;
  const u19 = (tq - (b.goal - 0.45 * PIN_DUR)) / PIN_DUR;
  // 'predict the next word' catches the lamp on 'predict' (a feathered glow clipped to the card, then a 0.4 s gold
  // sheen from T.word('L1103','predict') - 0.15); the glow settles to a low warmth for the rest of the line
  const lamp19 = win(t, b.predict - 0.15, b.predict + 0.35) * (1 - 0.55 * win(t, b.predict + 1.6, b.predict + 3.0));
  const sheen = (t - b.sheen0) / 0.4;
  // every next word its own right answer: 5 hops of ≈ 0.35 s on twos from T.word('L1103','every'), along
  // 'objective: predict the next word…' (a lamp-gold underline under word n arcs on to word n+1)
  const hop = Math.max(0, Math.min(5, (tq - b.chain0) / 0.35));
  const hopFade = win(t, b.chain1 + 0.35, b.chain1 + 0.9);
  // the rack focus 2019 → 1985: the 2019 card goes soft (≈ 1.5 px) in the breath before 'From' and stays soft beside
  // the sharp 1985 card; the old card sharpens in the FILE insert, ending on T.line('L1104').start
  const blur19 = 1.5 * win(t, b.file0 - 0.3, b.file0) * (1 - win(t, b.raw - 0.6, b.raw + 0.2) * 0.5);
  if (u19 >= 0.45) {
    drawQuoteCard(c, env, CARD19, { light: poolAt(POOL, CARD19.x - STUDY.board.x, CARD19.y - STUDY.board.y) + 0.2, highlight: lamp19, sheen, hop, hopFrom: 6, hopFade, blur: blur19 });
    cardProbe(c, 'ch11-s02/2019', CARD19.x - CARD19.w / 2, CARD19.y - CARD19.h / 2, CARD19.w, CARD19.h, 1, 1);
  }
  if (u19 > 0 && u19 < 1) {
    const pose = hands.act('pin', u19, { x: CARD19.x, y: CARD19.y - CARD19.h / 2 + 7 }, { held: 'card', scale: 0.78, entry });
    pinArm(c, env, pose, {
      heldDraw: (cc, at, _h, e) => {
        drawQuoteCard(cc, e, { ...CARD19, x: at.x, y: at.y + CARD19.h / 2 - 7 }, { light: 0.9, highlight: 0, chain: 0 });
        cardProbe(cc, 'ch11-s02/2019-held', at.x - CARD19.w / 2, at.y - 7, CARD19.w, CARD19.h, 1, 1);
      },
    });
  }
  // ---- the 1985 card: pinned beside it, after the FILE insert
  const PIN85 = 0.95;
  const u85 = (tq - b.pin85) / PIN85;
  if (u85 >= 0.45 || tq >= b.pin85 + PIN85) {
    const lit85 = poolAt(POOL, CARD85.x - STUDY.board.x, CARD85.y - STUDY.board.y) + 0.22;
    // the faded-ink underline was on the card in the file: it is there as the card is pinned (as in ch11-s08)
    drawQuoteCard(c, env, CARD85, { light: lit85, underline: 1 });
    void rack;
    cardProbe(c, 'ch11-s02/1985', CARD85.x - CARD85.w / 2, CARD85.y - CARD85.h / 2, CARD85.w, CARD85.h, 1, 1);
    // 'raw': a thread of light from the card, routed BELOW the chat box, ending on the study window's glass where
    // the library shows (the glass is on the wall plane: its point is projected into L4 under the live camera)
    const ru = clamp01((t - b.raw + 0.15) / 0.6);
    if (ru > 0) {
      const a = { x: CARD85.x + CARD85.w / 2 - 8, y: CARD85.y + CARD85.h / 2 - 8 };
      const gs = toScreen(STUDY_WALL, cam, STUDY.window.x + 46, STUDY.window.y + STUDY.window.h * 0.66);
      const w = toLayer(LAYERS.L4, cam, gs.x, gs.y);
      rawThread(c, env, a, w, ru);
      if (ru >= 1) glint(c, env, w, 1.6 * (1 - 0.6 * win(t, b.raw + 1.2, b.shelf0)));
    }
  }
  if (u85 > 0 && u85 < 1) {
    const pose = hands.act('pin', u85, { x: CARD85.x, y: CARD85.y - CARD85.h / 2 + 7 }, { held: 'card', scale: 0.78, entry });
    pinArm(c, env, pose, {
      heldDraw: (cc, at, _h, e) => {
        drawQuoteCard(cc, e, { ...CARD85, x: at.x, y: at.y + CARD85.h / 2 - 7 }, { light: 0.85, underline: 1 });
        cardProbe(cc, 'ch11-s02/1985-held', at.x - CARD85.w / 2, at.y - 7, CARD85.w, CARD85.h, 1, 1);
      },
    });
  }
}

/** the thread of light from the 1985 card to the window: down off the card, under the chat box, up onto the glass */
function rawThread(c: C, env: PaintEnv, a: Pt, w: Pt, u: number) {
  const box = STUDY.xray;
  const under = box.y + 70; // below the box's plinth
  const c1 = { x: a.x + 40, y: under + 40 };
  const c2 = { x: Math.max(box.x + 260, w.x - 260), y: under + 40 };
  const P = (v: number) => {
    const q = 1 - v;
    return {
      x: q * q * q * a.x + 3 * q * q * v * c1.x + 3 * q * v * v * c2.x + v * v * v * w.x,
      y: q * q * q * a.y + 3 * q * q * v * c1.y + 3 * q * v * v * c2.y + v * v * v * w.y,
    };
  };
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  const n = 48;
  for (const [lw, al] of [[7, 0.08], [2.8, 0.24], [1.2, 0.7]] as const) {
    c.strokeStyle = withAlpha(env.mood.core, al);
    c.lineWidth = lw;
    c.beginPath();
    c.moveTo(a.x, a.y);
    for (let i = 1; i <= n * u; i++) {
      const p = P(i / n);
      c.lineTo(p.x, p.y);
    }
    c.stroke();
  }
  if (u < 1) glint(c, env, P(u), 0.8);
  c.restore();
}

/** a blurred banker's-lamp shade in the near plane at the lower right while the two cards are framed: it slides
 *  against the board through the lateral dolly and the push, then drops out of frame as the camera pulls back */
const PAIR_NEAR: LayerSpec = { id: 'pairNear', z: 760, haze: 0, blur: 7 };
function pairNear(f: Frame, t: number, b: B, cam: Camera3) {
  const t0 = b.pair0 - 0.3, t1 = b.raw + 0.2;
  if (t < t0 || t > t1) return;
  const u = (t - t0) / (b.pull0 - t0);
  const sx = lerp(1250, 1170, sm(Math.min(1, u)));
  const sy = 800 + 420 * sm((t - b.pull0) / (t1 - b.pull0));
  const k = toScreen(PAIR_NEAR, cam, 0, 0).k;
  const at = toLayer(PAIR_NEAR, cam, sx, sy);
  f.layer(PAIR_NEAR, (c, env) => {
    const ink = mixLab(env.mood.ink, '#000000', 0.3);
    const e2 = { ...env, fill: (r: Parameters<PaintEnv['fill']>[0]) => (r === 'ink' || r === 'fg' ? ink : env.fill(r)) } as PaintEnv;
    c.save();
    c.filter = `blur(${(5 * env.pxScale).toFixed(1)}px)`;
    bankersLamp(c, { x: at.x, y: at.y, s: 6 / k, lit: true, seed: 41 }, e2);
    c.restore();
  });
}

/** the shelf hold's near plane (review round 3): the shelf's front lip at about 60 % (not a black band), below the plank
 *  and its apron so they read, and a small unlit candlestick at the far left, both blurred */
const SHELF_NEAR: LayerSpec = { id: 'shelfNear', z: 820, haze: 0, blur: 6 };
function shelfNear(f: Frame, cam: Camera3) {
  f.layer(SHELF_NEAR, (c, env) => {
    const ink = mixLab(env.mood.ink, '#000000', 0.3);
    const lip = mixLab(env.mood.ink, env.mood.set, 0.6);
    const e2 = { ...env, fill: (r: Parameters<PaintEnv['fill']>[0]) => (r === 'ink' || r === 'fg' ? ink : env.fill(r)) } as PaintEnv;
    // world anchors: the lip runs under the frame ≈ 110 below the plank's screen line; the candlestick stands on it
    const base = { x: CYC_X - 330, y: STUDY.shelf.y + 160 };
    c.save();
    c.filter = `blur(${(4 * env.pxScale).toFixed(1)}px)`;
    c.globalAlpha = 0.6;
    c.fillStyle = lip;
    c.fillRect(CYC_X - 1200, base.y, 2600, 300);
    c.globalAlpha = 1;
    c.fillStyle = withAlpha(env.mood.rim, 0.45);
    c.fillRect(CYC_X - 1200, base.y, 2600, 2.4);
    candlestick(c, { x: base.x, y: base.y, s: 6, variant: 'table', lit: false, burn: 0.6 }, e2);
    c.restore();
    void cam;
  });
}

/** the Cyc flicker on 'sensible': the flame dips to 40 % for 2 frames, then recovers over 0.5 s */
function flickAt(t: number, taper: number): number {
  const d = t - taper;
  if (d < 0 || d > 0.62) return 1;
  if (d < 2 / 24) return 0.4;
  return 0.4 + 0.6 * sm((d - 2 / 24) / 0.5);
}

/** the Cyc taper's label, BELOW the shelf lip under the taper (screen-locked, legible), a fine leader up to its tag */
function cycLabel(f: Frame, cam: Camera3, k: number) {
  if (k <= 0.01) return;
  const p = toScreen(LAYERS.L4, cam, CYC_X, STUDY.shelf.y + 24 * STUDY.shelf.s);
  screenPass(f, (c) => {
    const m = f.mood;
    const face = fontForYear(1984);
    const size = legibleSize(c, `400 20px ${face}`, 20);
    const dSize = legibleSize(c, `italic 400 18px ${FONT.text}`, 18);
    const t1 = 'CYC';
    const t2 = 'lit 1984 · still burning';
    c.save();
    c.font = `italic 400 ${dSize}px ${FONT.text}`;
    const dw = c.measureText(t2).width;
    c.font = `400 ${size}px ${face}`;
    const tw = c.measureText(t1).width;
    const pad = 12;
    const w = Math.max(tw, dw) + pad * 2;
    const h = size * 1.1 + dSize * 1.35 + pad * 1.4;
    const x0 = Math.max(40, Math.min(1240 - w, p.x - w / 2));
    const y0 = Math.min(720 * 0.88 - h - 4, p.y + 14);
    c.globalAlpha = Math.min(1, k * 1.15);
    c.strokeStyle = withAlpha(m.rim, 0.7);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(p.x, p.y - 4);
    c.lineTo(p.x, y0);
    c.stroke();
    c.shadowColor = withAlpha('#000000', 0.45);
    c.shadowBlur = 10;
    c.shadowOffsetY = 4;
    const paper = mixLab(m.halo, '#efe4cc', 0.6);
    c.fillStyle = paper;
    c.fillRect(x0, y0, w, h);
    c.shadowColor = 'rgba(0,0,0,0)';
    c.shadowBlur = 0;
    c.shadowOffsetY = 0;
    c.strokeStyle = withAlpha(m.ink, 0.35);
    c.lineWidth = 0.8;
    c.strokeRect(x0 + 4, y0 + 4, w - 8, h - 8);
    const inkC = mixLab(m.ink, '#1d160f', 0.5);
    c.fillStyle = inkC;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.font = `400 ${size}px ${face}`;
    c.fillText(t1, x0 + pad, y0 + pad * 0.7 + size * 0.95);
    c.font = `italic 400 ${dSize}px ${FONT.text}`;
    c.fillStyle = withAlpha(inkC, 0.88);
    c.fillText(t2, x0 + pad, y0 + pad * 0.7 + size * 1.1 + dSize * 1.05);
    cardProbe(c, 'ch11-s02/cyc-label', x0, y0, w, h, Math.min(1, k * 1.15), Math.min(1, k * 1.15));
    c.restore();
  });
}

// ================================================================================================= WINDOW glance
/** one empty tag-hook per visible shelf of the library behind the glass (the crisp canyon on LIB_WINDOW, centred on
 *  LIBV): a dark pin under the shelf board's front edge with no tag on it. World points on LIB_WINDOW, chosen at
 *  module load for the WIN0 framing so each sits inside a glass pane. */
const PANE_BAR = 9;
function panesScreen(cam: Camera3): { x: number; y: number; w: number; h: number }[] {
  const W = STUDY.window;
  const out: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 6; j++) {
      const ax = W.x + (W.w * i) / 3 + (i ? PANE_BAR / 2 : 0), bx = W.x + (W.w * (i + 1)) / 3 - (i < 2 ? PANE_BAR / 2 : 0);
      const ay = W.y + (W.h * j) / 6 + (j ? PANE_BAR / 2 : 0), by = W.y + (W.h * (j + 1)) / 6 - (j < 5 ? PANE_BAR / 2 : 0);
      const p = toScreen(STUDY_WALL, cam, ax, ay), q = toScreen(STUDY_WALL, cam, bx, by);
      out.push({ x: p.x, y: p.y, w: q.x - p.x, h: q.y - p.y });
    }
  }
  return out;
}
const HOOKS: { x: number; y: number; r: number; i: number }[] = (() => {
  const out: { x: number; y: number; r: number; i: number }[] = [];
  const panes = panesScreen(WIN0);
  const inPane = (x: number, y: number) => panes.some((p) => x > p.x + 14 && x < p.x + p.w - 14 && y > p.y + 14 && y < p.y + p.h - 14 && y > 40 && y < 600);
  // the aisle's left-hand stack (side −1, X = LIBV.x − 430/z) is the one across the glass at this framing; one hook
  // per shelf board, at a depth where it is inside a pane
  for (let row = 0; row < 9; row++) {
    const yb = 300 - 40 - row * 118;
    for (const sx of [700, 560, 840, 980, 420]) {
      const Xw = toLayer(LIB_WINDOW, WIN0, sx, 0).x;
      const z = 430 / (LIBV.x - Xw);
      if (!(z > 0.45 && z < 4)) continue;
      const wy = LIBV.y + (yb + 9) / z;
      const sp = toScreen(LIB_WINDOW, WIN0, Xw, wy);
      if (!inPane(sp.x, sp.y)) continue;
      out.push({ x: Xw, y: wy, r: 1 / z, i: out.length });
      break;
    }
  }
  return out;
})();
/** the glance's near plane: the edge of a heavy curtain at frame left (L5, blurred), sliding against the glass */
const WIN_NEAR: LayerSpec = { id: 'winNear', z: 860, haze: 0, blur: 6 };
function windowGlance(f: Frame, t: number, b: B, cam: Camera3) {
  // the hooks, seen through the panes only (clipped to the glass on screen)
  const panes = panesScreen(cam);
  const at = b.labels;
  f.layer(LIB_WINDOW, (c, env) => {
    c.save();
    c.beginPath();
    for (const p of panes) {
      const a = toLayer(LIB_WINDOW, cam, p.x, p.y), q = toLayer(LIB_WINDOW, cam, p.x + p.w, p.y + p.h);
      c.rect(a.x, a.y, q.x - a.x, q.y - a.y);
    }
    c.clip();
    const pin = mixLab(MOODS_CYAN_INK, '#000000', 0.25);
    for (const h of HOOKS) {
      const r = 7 * h.r;
      c.fillStyle = pin;
      c.strokeStyle = pin;
      c.lineWidth = Math.max(0.8, 1.6 * h.r);
      // the pin head under the board's front edge, and its empty hook (a small J, nothing hanging from it)
      c.beginPath();
      c.arc(h.x, h.y + r * 0.5, r * 0.45, 0, Math.PI * 2);
      c.fill();
      c.beginPath();
      c.moveTo(h.x, h.y + r * 0.8);
      c.lineTo(h.x, h.y + r * 2.0);
      c.quadraticCurveTo(h.x, h.y + r * 2.7, h.x + r * 0.7, h.y + r * 2.5);
      c.stroke();
      // each glints once on 'labels' (staggered along the shelves)
      const gk = win(t, at - 0.05 + 0.05 * h.i, at + 0.12 + 0.05 * h.i) * (1 - win(t, at + 0.3 + 0.05 * h.i, at + 0.75 + 0.05 * h.i));
      if (gk > 0.01) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        const R = r * 3.2;
        const g = c.createRadialGradient(h.x, h.y + r * 0.5, 0, h.x, h.y + r * 0.5, R);
        g.addColorStop(0, withAlpha('#dff6ff', 0.85 * gk));
        g.addColorStop(1, withAlpha('#dff6ff', 0));
        c.fillStyle = g;
        c.fillRect(h.x - R, h.y + r * 0.5 - R, 2 * R, 2 * R);
        c.strokeStyle = withAlpha('#eafaff', 0.7 * gk);
        c.lineWidth = Math.max(0.6, 0.9 * h.r);
        c.beginPath();
        c.moveTo(h.x - R * 0.8, h.y + r * 0.5);
        c.lineTo(h.x + R * 0.8, h.y + r * 0.5);
        c.moveTo(h.x, h.y + r * 0.5 - R * 0.8);
        c.lineTo(h.x, h.y + r * 0.5 + R * 0.8);
        c.stroke();
        c.restore();
      }
    }
    c.restore();
    void env;
  });
  // the curtain's edge at frame left (and a sliver of the window casing), out of focus
  f.layer(WIN_NEAR, (c, env) => {
    const ink = mixLab(env.mood.ink, '#000000', 0.25);
    const top = toLayer(WIN_NEAR, WIN0, 0, -40), bot = toLayer(WIN_NEAR, WIN0, 0, 780);
    const edge = toLayer(WIN_NEAR, WIN0, 150, 0).x;
    const left = toLayer(WIN_NEAR, WIN0, -120, 0).x;
    c.save();
    c.filter = `blur(${(5 * env.pxScale).toFixed(1)}px)`;
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(left, top.y);
    c.lineTo(edge, top.y);
    const n = 8;
    for (let i = 1; i <= n; i++) {
      const y = top.y + ((bot.y - top.y) * i) / n;
      c.lineTo(edge + (i % 2 ? -1 : 1) * (edge - left) * 0.06, y);
    }
    c.lineTo(left, bot.y);
    c.closePath();
    c.fill();
    // fold lines catching the lamp (warm, faint)
    c.strokeStyle = withAlpha(env.mood.rim, 0.3);
    c.lineWidth = (edge - left) * 0.012;
    for (const u of [0.42, 0.7, 0.9]) {
      const x = left + (edge - left) * u;
      c.beginPath();
      c.moveTo(x, top.y);
      c.lineTo(x - (edge - left) * 0.03, bot.y);
      c.stroke();
    }
    c.restore();
    void t;
  });
}
/** the hooks' ink: the library's cool near-black, through the glass */
const MOODS_CYAN_INK = '#0c1820';

function glint(c: C, env: PaintEnv, p: Pt, k: number) {
  if (k <= 0.01) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const R = 22 * k;
  const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
  g.addColorStop(0, withAlpha(env.mood.core, 0.9 * k));
  g.addColorStop(1, withAlpha(env.mood.core, 0));
  c.fillStyle = g;
  c.fillRect(p.x - R, p.y - R, 2 * R, 2 * R);
  c.restore();
}

// ================================================================================================= FILE (top-down)
/** the folder on the desk (the FILE insert's action plane) */
const FOLDER = { x: 640, y: 400, w: 420, h: 300 };
/** FILE insert cameras: a slow top-down push (a dolly, not a zoom, so the desk, the folder and the near objects slide
 *  against each other) */
const FILE0: Camera3 = { x: 640, y: 360, z: 0, lens: 1 };
const FILE1: Camera3 = { x: 652, y: 352, z: 70, lens: 1 };
const FILE_CAMS = [FILE0, FILE1];

function paintFile(f: Frame, t: number, b: B) {
  const d = t - b.file0;
  const dur = b.pair0 - b.file0;
  f.camera(mixCam(FILE0, FILE1, sm(d / dur)));
  f.backlight({ intensity: 0.15 });
  const tq = tq12(t) - b.file0;
  // the hand comes in from the lower right in the breath after 'answer' and pinches the card's top edge ON the oldCard
  // beat; the card slides out of the folder's mouth from there and is lifted toward the lamp (review round 3)
  const hd = b.oldCard - b.file0;
  const slide = sm((tq - hd) / 0.45);
  const lift = sm((tq - hd - 0.45) / Math.max(0.3, dur - hd - 0.55));
  // the rack focus's second half: the insert comes into focus as the old card is drawn, sharp on T.line('L1104').start
  const focus = 2.6 * (1 - sm((t - (b.rackEnd - 0.6)) / 0.6));
  const S = lerp(2.0, 2.3, lift);
  const sy = lerp(0.5, 1, lift);
  const card = { x: lerp(640, 664, lift), y: lerp(lerp(MOUTH + 92, MOUTH - 82, slide), 318, lift), rot: lerp(-0.02, 0.02, lift) };
  // far plane: the desk top in perspective under the lamp's pool (grain converging away from the lens)
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, FILE_CAMS, 60);
    f.cached(`${ID}/file/deskP/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      cc.fillStyle = mixLab(env.mood.set, env.mood.fg, 0.35);
      cc.fillRect(r.x, r.y, r.w, r.h);
      const g = cc.createRadialGradient(560, 300, 30, 560, 300, 720);
      g.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.5), 0.9));
      g.addColorStop(0.55, withAlpha(mixLab(env.mood.set, env.mood.halo, 0.2), 0.45));
      g.addColorStop(1, withAlpha(env.mood.set, 0));
      cc.fillStyle = g;
      cc.fillRect(r.x, r.y, r.w, r.h);
      // grain: boards running away from the lens toward a vanishing point high above the frame
      const VP = { x: 640, y: -900 };
      const far = (xb: number) => ({ x: VP.x + (xb - VP.x) * 0.25, y: VP.y + (r.y + r.h - VP.y) * 0.25 });
      // boards of slightly different tone (not a ruled stripe), each with a few long grain streaks and a rare knot
      for (let i = -24; i <= 24; i++) {
        const xa = 640 + i * 70 + hash1(i, 3) * 10, xb = 640 + (i + 1) * 70 + hash1(i + 1, 3) * 10;
        const fa = far(xa), fb = far(xb);
        cc.fillStyle = withAlpha(hash1(i, 5) > 0 ? env.mood.halo : env.mood.fg, 0.05 + 0.06 * Math.abs(hash1(i, 6)));
        cc.beginPath();
        cc.moveTo(xa, r.y + r.h);
        cc.lineTo(xb, r.y + r.h);
        cc.lineTo(fb.x, fb.y);
        cc.lineTo(fa.x, fa.y);
        cc.closePath();
        cc.fill();
        cc.strokeStyle = withAlpha(env.mood.fg, 0.38);
        cc.lineWidth = 1.2;
        cc.beginPath();
        cc.moveTo(xa, r.y + r.h);
        cc.lineTo(fa.x, fa.y);
        cc.stroke();
        cc.strokeStyle = withAlpha(env.mood.fg, 0.12);
        cc.lineWidth = 0.8;
        for (let q = 0; q < 3; q++) {
          const u = 0.2 + 0.6 * (0.5 + 0.5 * hash1(i * 5 + q, 7));
          const x0 = lerp(xa, xb, u), x1 = lerp(fa.x, fb.x, u + 0.08 * hash1(i * 5 + q, 8));
          cc.beginPath();
          cc.moveTo(x0, r.y + r.h);
          cc.quadraticCurveTo((x0 + x1) / 2 + 6 * hash1(i * 5 + q, 9), (r.y + r.h + fa.y) / 2, x1, fa.y);
          cc.stroke();
        }
        if (hash1(i, 10) > 0.6) {
          const kx = lerp(xa, xb, 0.5), ky = 120 + 400 * (0.5 + 0.5 * hash1(i, 11));
          cc.beginPath();
          cc.ellipse(kx, ky, 5, 14, 0, 0, Math.PI * 2);
          cc.stroke();
        }
      }
    })(c, r.x, r.y);
  });
  f.layer('L4', (c, env) => {
    if (focus > 0.05) c.filter = `blur(${(focus * env.pxScale).toFixed(2)}px)`;
    // the folder lies on the desk, seen at an angle (its far edge, the mouth, narrower than its near edge)
    folderBack(c, env);
    // the card while it is still in the folder or sliding out of its mouth: drawn UNDER the front cover
    const drawCardNow = (cc: C) => {
      cc.save();
      cc.translate(card.x, card.y);
      cc.rotate(card.rot);
      cc.transform(1, 0, -0.08 * (1 - lift), 1, 0, 0);
      cc.scale(S, S * sy);
      cc.fillStyle = withAlpha(env.mood.fg, 0.4 * lift);
      cc.fillRect(-CARD85.w / 2 + 8, -CARD85.h / 2 + 12, CARD85.w, CARD85.h);
      drawQuoteCard(cc, env, { ...CARD85, x: 0, y: 0 }, { light: 0.95, underline: 1 });
      cardProbe(cc, 'ch11-s02/1985-file', -CARD85.w / 2, -CARD85.h / 2, CARD85.w, CARD85.h, 1, 1);
      cc.restore();
    };
    if (lift < 0.02) drawCardNow(c);
    folderFront(c, env, tq);
    if (lift >= 0.02) drawCardNow(c);
    // the hand: reaches to the mouth, pinches the card's top edge as it slides out, draws it up toward the lamp
    const len = HAND_LEN * 1.5;
    const top = { x: card.x + (CARD85.w / 2) * S - 34, y: card.y - (CARD85.h / 2) * S * sy + 10 };
    if (tq < hd) {
      // already in frame at the cut (lower right), reaching the mouth on the beat
      const u = sm(tq / hd);
      const at = { x: lerp(1000, 820, u), y: lerp(560, MOUTH + 6, u) };
      hands.draw(c, { right: hands.reach({ x: 1500, y: 860 }, at, u > 0.8 ? 'pinch' : 'open', len), scale: 1.5 }, env);
    } else {
      hands.draw(c, { right: hands.reach({ x: 1500, y: top.y + 380 }, top, 'pinch', len), scale: 1.5 }, env);
    }
  });
  f.rim({ x: 0, y: -1 });
  f.practical({ x: 330, y: 40, kind: 'lamp', seed: 41, intensity: 0.5, radius: 110 });
  // L5: the desk's near edge across the bottom of the frame (dark, blurred, a rim of lamp light on its lip)
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, FILE_CAMS, 60);
    f.cached(`${ID}/file/edge/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      cc.fillStyle = mixLab(env.mood.ink, env.mood.fg, 0.4);
      cc.beginPath();
      cc.moveTo(r.x, 668);
      cc.quadraticCurveTo(640, 650, r.x + r.w, 676);
      cc.lineTo(r.x + r.w, r.y + r.h);
      cc.lineTo(r.x, r.y + r.h);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = withAlpha(env.mood.rim, 0.4);
      cc.lineWidth = 2;
      cc.beginPath();
      cc.moveTo(r.x, 668);
      cc.quadraticCurveTo(640, 650, r.x + r.w, 676);
      cc.stroke();
    }, { blur: 3 })(c, r.x, r.y);
  });
  // near plane: an ink bottle at the lower left and the fountain pen lying across the top-right corner, out of focus
  f.layer('L6', (c, env) => {
    const r = overscan(LAYERS.L6, FILE_CAMS, 60);
    f.cached(`${ID}/file/near/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      const ink = env.fill('fg');
      cc.fillStyle = ink;
      cc.beginPath();
      cc.arc(40, 690, 150, 0, Math.PI * 2);
      cc.fill();
      cc.strokeStyle = withAlpha(env.mood.rim, 0.35);
      cc.lineWidth = 5;
      cc.beginPath();
      cc.arc(40, 690, 88, -1.4, 0.1);
      cc.stroke();
      cc.fillStyle = ink;
      cc.save();
      cc.translate(1130, -10);
      cc.rotate(0.62);
      cc.beginPath();
      cc.roundRect(-30, -24, 520, 48, 22);
      cc.fill();
      cc.fillStyle = withAlpha(env.mood.rim, 0.3);
      cc.fillRect(-10, -22, 480, 4);
      cc.restore();
    })(c, r.x, r.y);
    // the green-shaded banker's lamp's rim at the top edge, out of focus: its glass shade's lower lip (bottle green,
    // low chroma) and the warm underside where the bulb shows
    // (screen-placed at the FILE0 framing: the shade's lower lip ≈ 84 px down the frame at upper left)
    const L = toLayer(LAYERS.L6, FILE0, 300, 84);
    const sc = toScreen(LAYERS.L6, FILE0, 0, 0).k;
    const u = (v: number) => v / sc;
    c.save();
    c.filter = `blur(${(4 * env.pxScale).toFixed(1)}px)`;
    // the warm underside (the bulb's light inside the shade) just under the lip
    const glow = c.createRadialGradient(L.x, L.y + u(4), u(10), L.x, L.y + u(4), u(260));
    glow.addColorStop(0, withAlpha(mixLab(env.mood.core, '#fff0c8', 0.5), 0.85));
    glow.addColorStop(0.35, withAlpha(env.mood.halo, 0.35));
    glow.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = glow;
    c.beginPath();
    c.ellipse(L.x, L.y + u(6), u(300), u(34), 0, 0, Math.PI * 2);
    c.fill();
    // the shade: a long bottle-green half-cylinder seen from below, its lip a lit curve
    const shade = mixLab('#1d3a28', env.mood.ink, 0.3);
    c.fillStyle = shade;
    c.beginPath();
    c.moveTo(L.x - u(330), L.y - u(400));
    c.lineTo(L.x + u(330), L.y - u(400));
    c.lineTo(L.x + u(330), L.y - u(30));
    c.quadraticCurveTo(L.x, L.y + u(14), L.x - u(330), L.y - u(30));
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha(mixLab('#8fbf8f', env.mood.core, 0.45), 0.8);
    c.lineWidth = u(3);
    c.beginPath();
    c.moveTo(L.x + u(330), L.y - u(30));
    c.quadraticCurveTo(L.x, L.y + u(14), L.x - u(330), L.y - u(30));
    c.stroke();
    // the green glass catching its own light along the cylinder (a soft highlight band)
    c.fillStyle = withAlpha('#5f8f68', 0.35);
    c.fillRect(L.x - u(330), L.y - u(70), u(660), u(14));
    c.restore();
  });
  // the lamp pool's falloff and a vignette, over everything (screen)
  screenPass(f, (c) => {
    const m = f.mood;
    const g = c.createLinearGradient(330, 140, 1080, 690);
    g.addColorStop(0, withAlpha(m.halo, 0));
    g.addColorStop(0.5, withAlpha(m.fg, 0.08));
    g.addColorStop(1, withAlpha(m.fg, 0.5));
    c.fillStyle = g;
    c.fillRect(-4, -4, 1288, 728);
    const v = c.createRadialGradient(560, 320, 260, 600, 340, 840);
    v.addColorStop(0, withAlpha(m.fg, 0));
    v.addColorStop(1, withAlpha(m.fg, 0.7));
    c.fillStyle = v;
    c.fillRect(-4, -4, 1288, 728);
  });
}

/** the folder in perspective: its mouth (far edge) at y MOUTH, its near edge at y 640 */
const MOUTH = 318;
const FOLD = { fl: { x: 410, y: MOUTH }, fr: { x: 890, y: MOUTH }, nr: { x: 990, y: 640 }, nl: { x: 300, y: 640 } };
function quad(c: C, q: Pt[]) {
  c.beginPath();
  q.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.closePath();
}
const manilaOf = (env: PaintEnv) => mixLab(env.mood.halo, '#b08a52', 0.35);
/** the back cover (the part that shows above the front cover's top edge: its tab and the filed slips) */
function folderBack(c: C, env: PaintEnv) {
  const manila = manilaOf(env);
  // its shadow on the desk
  c.fillStyle = withAlpha(env.mood.fg, 0.4);
  quad(c, [{ x: FOLD.fl.x + 10, y: FOLD.fl.y - 12 }, { x: FOLD.fr.x + 18, y: FOLD.fr.y - 12 }, { x: FOLD.nr.x + 22, y: FOLD.nr.y + 10 }, { x: FOLD.nl.x + 12, y: FOLD.nl.y + 10 }]);
  c.fill();
  c.fillStyle = mixLab(manila, env.mood.set, 0.3);
  quad(c, [{ x: FOLD.fl.x + 4, y: FOLD.fl.y - 16 }, { x: FOLD.fr.x - 4, y: FOLD.fr.y - 16 }, FOLD.nr, FOLD.nl]);
  c.fill();
  // the tab on the back cover's far edge
  quad(c, [{ x: 450, y: MOUTH - 16 }, { x: 560, y: MOUTH - 16 }, { x: 552, y: MOUTH - 36 }, { x: 462, y: MOUTH - 36 }]);
  c.fill();
  // the cards filed in it before (the earlier 'Put that in the file' cards): five stacked edges standing up out of the
  // mouth, staggered, each with its lit top edge, a shadow line between them and a typed ink tick at the corner
  for (let i = 0; i < 5; i++) {
    const x0 = FOLD.fl.x + 22 + i * 9 + 6 * hash1(i, 71);
    const x1 = FOLD.fr.x - 26 - i * 13 + 8 * hash1(i, 72);
    const top = MOUTH - 40 + i * 6 + 3 * hash1(i, 73);
    const paper = i % 2 ? mixLab('#d9c792', env.mood.halo, 0.3) : mixLab('#e6dcc1', env.mood.halo, 0.25);
    c.fillStyle = withAlpha(env.mood.fg, 0.45);
    c.fillRect(x0 + 2, top + 3, x1 - x0, MOUTH - top);
    c.fillStyle = mixLab(paper, env.mood.set, 0.12 + 0.07 * i);
    c.fillRect(x0, top, x1 - x0, MOUTH - top + 2);
    c.fillStyle = withAlpha(env.mood.core, 0.55);
    c.fillRect(x0, top, x1 - x0, 1.4);
    c.fillStyle = withAlpha('#2a2418', 0.45);
    c.fillRect(x0 + 8 + 30 * (0.5 + 0.5 * hash1(i, 74)), top + 5, 26 + 18 * (0.5 + 0.5 * hash1(i, 75)), 1.6);
  }
}
/** the front cover, on top: lit by the lamp's pool, its top edge (the mouth) lifted a hair by the fingers */
function folderFront(c: C, env: PaintEnv, tq: number) {
  const manila = manilaOf(env);
  const liftEdge = 6 * sm((tq - 0.15) / 0.2) * (1 - sm((tq - 1.0) / 0.4));
  const q = [{ x: FOLD.fl.x, y: FOLD.fl.y - liftEdge }, { x: FOLD.fr.x, y: FOLD.fr.y - liftEdge }, FOLD.nr, FOLD.nl];
  c.fillStyle = manila;
  quad(c, q);
  c.fill();
  // the lamp's pool on it (upper left), falling off toward the near edge
  c.save();
  quad(c, q);
  c.clip();
  const g = c.createRadialGradient(520, 300, 20, 520, 300, 520);
  g.addColorStop(0, withAlpha(mixLab(env.mood.halo, '#fff3d6', 0.3), 0.55));
  g.addColorStop(1, withAlpha(env.mood.fg, 0.35));
  c.fillStyle = g;
  c.fillRect(250, 250, 800, 420);
  c.restore();
  // the mouth's lit lip and a crease
  c.strokeStyle = withAlpha(env.mood.core, 0.6);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(q[0].x, q[0].y);
  c.lineTo(q[1].x, q[1].y);
  c.stroke();
  c.strokeStyle = withAlpha(env.mood.fg, 0.35);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(FOLD.fl.x + 18, MOUTH + 22);
  c.lineTo(FOLD.fr.x - 18, MOUTH + 22);
  c.stroke();
}

export type { QuoteCardGeo };
void mixLab;
void FONT;
