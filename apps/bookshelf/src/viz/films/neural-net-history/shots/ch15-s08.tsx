/**
 * ch15-s08 — THE VERDICT (montage, candleAmber; 42.0 s; in: lampChange from Widrow's winter sill).
 *
 * The study under the green-shaded lamp (STUDY LOCK). THE FAST-FORWARD, then THE FULL WIDE: one continuous camera
 * from BOARD, pulling back and tilting down to the whole SHELF, and drifting back up to the BOARD.
 *
 *   0 → ff1     the lamp change lands on the board; the two steady hands are pressing the last pin home
 *   ff1 … ff5   the prologue's rewind replayed FORWARDS, one wordless flash each, 0.75 s apart (sets/ch01-s06-rewind,
 *               dir +1, the tape lurching down instead of up): a motorised knob turns · snow falls · two fans spin up
 *               in a desktop tower · a Go stone is set down · a lantern wick catches, and the flame sits inside the
 *               glowing chat box. No captions.
 *   'Who'       (b2) back in the study: the hands sit back off the pin and out of frame; the pull-back begins
 *   'rules'     (b11) the lamp's light passes over RULES (key over a branching tree) and moves on: it stays grey
 *   'knowledge' (b12) the same over KNOWLEDGE (the drawer of index cards): its inner light goes out; grey
 *   'Learning'  (b13) LEARNING's paper lantern, dark since chapter 1, catches and glows for the first time
 *   'accomplices' (b14) threads of light run from it, one per word: 'data' → the ImageNet tiles (C3), 'fire' → the
 *               two furnaces (C3), 'messenger' → the backward bead (C2); on 'choosing' every pin in the clue columns
 *               glints at once (people choosing)
 *   'board'     (b3) the threads tighten into straight strings and every clue card in C1–C4 swells into a paper
 *               lantern; the founding row F1–F2 and the question thread dim to cork, unswollen; the Wall stays paper
 *   'network'   (b4) a forward wave of light runs lantern by lantern from the 1943 wick to the chat box, which glows;
 *               WHO TAUGHT IT? drops from its pin into the lamp's pool, uncovering a lantern that does not light
 *   b4c         the tilt down: the whole shelf, a bar chart in wax, ending by the study window; first stop, wordless:
 *               Cyc's dark 39-ring sleeve (tag 1984–2023 · 39), the tallest bar
 *   'forty' · 'two' · 'day'   the lamp's light finds Cyc's 39-ring sleeve · the 2-ring GO sleeve · the blackened match
 *   'burn'      (b9) the five still-lit flames, scattered mid-shelf to the window, brighten together; their tags
 *               'as of October 2026'
 *   'lantern'   (b10) drift back up: the one dark lantern in the middle; the last question card hung above it on the
 *               oxblood thread, swaying; on the board's ledge the brass microscope, its lens turned toward the dark one
 *   'answers'   (b10b) only the dark lantern is dark; the microscope-limit card rises beside the microscope; hold
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at a pitch of 6 px per ring
 * at L3 (270 px), its flame on the top ring and a small tag at its base giving the year it was lit. It burns down one
 * ring per year the belief is held; the burned wax stays above the stub as a ghost sleeve (39 rings = 234 px).
 * TEXT DISCIPLINE: two text items only: the question card (from 'lantern') and the microscope-limit quote.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, ShotScene } from '../../../film';
import { FONT, LAYERS, MOODS, PUPPET_NEAR_BLACK, defineShot, mixLab, paperLantern, quoteCard, softPlate, toScreen, withAlpha } from '../../../film';
import { hands } from '../cast';
import { handsEntry } from '../sets/narratorHands';
import { STUDY, candleX, slotWorld, studyCase, studyRoom } from '../sets/study';
import { BOARD, SLOTS, boardStateAt, shelfStateAt, type CandleView, type SlotId } from '../sets/studyState';
import { candleFlame } from '../sets/beliefCandle';
import { DEFAULT_POOL, drawCard, oxblood, poolAt, type Pool } from '../sets/caseBoard';
import { REWIND_STEP, paintRewindImage, tapeShudder, type RewindImage } from '../sets/ch01-s06-rewind';
import { CLUE_IDS, DARK, EDGES, NET, OUT, brassMicroscope, pickOut, pinGlint, type NetNode } from '../sets/ch15-s08-kit';
import { frameOn } from '../sets/ch09-s03a-kit';
import { monotone } from '../sets/ch02-s05b-util';
import { clamp01, lerp, sm, tq12, win } from '../sets/ch13-s01-kit';

const ID = 'ch15-s08';
type C = CanvasRenderingContext2D;
type Pt = { x: number; y: number };

// ------------------------------------------------------------------------------------------------ the study state
const BS = boardStateAt(ID, 'start');
const V0 = shelfStateAt(ID, 'start');
const SY = STUDY.shelf.y;
const view = (id: string) => V0.find((v) => v.id === id)!;
const LIVE = V0.filter((v) => v.state === 'live').map((v) => v.id);
/** the shelf as this shot shows it: Cyc's tag gives its whole span; the match keeps its own */
const VIEWS: CandleView[] = V0.map((v) => (v.id === 'cyc' ? { ...v, tag: '1984–2023 · 39', smoke: false } : v));
const X = (id: string) => candleX(V0, id);
const CYC = { x: X('cyc'), top: SY - 270, bot: SY - 270 + 39 * 6 };
const GO = { x: X('go'), top: SY - 270, bot: SY - 270 + 2 * 6 };
const MATCH = { x: X('match'), y: SY };
const NEW_X = X('new');
/** the board-unit lamp pool (as studyCase passes it) */
const POOL: Pool = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };
const cardLight = (id: SlotId) => poolAt(POOL, SLOTS[id].x, SLOTS[id].y);
const SUSPECTS: SlotId[] = ['S1', 'S2', 'S3'];
const W = (id: SlotId) => slotWorld(id);
/** S3's lantern icon (world): where LEARNING's light sits on its card */
const S3_LAMP: Pt = { x: W('S3').x, y: W('S3').y - 11 };
/** the accomplices: data, fire, the messenger */
const ACC: { id: SlotId; word: string }[] = [
  { id: 'C3-a', word: 'data' },
  { id: 'C3-b', word: 'fire' },
  { id: 'C2-b', word: 'messenger' },
];
/** the question thread (world) and the last question card, hung long so it sits just above the dark lantern */
const THREAD_Y = STUDY.board.y + BOARD.threadY;
const sagAt = (bx: number) => THREAD_Y + Math.sin(((bx - 40) / 920) * Math.PI) * 10;
const Q4 = { x: STUDY.board.x + 500, clipY: sagAt(500), top: 136, w: 204, h: 70, text: 'How, exactly, does it reach its answer?' };
/** the microscope on a small ledge under the board's lower right (beside the X-ray box), tipped toward the dark one */
const LEDGE = { x0: 966, x1: 1134, y: STUDY.board.y + BOARD.h + 22 };
/** the microscope-limit quote: in the clear cork between the dark lantern and the microscope (world) */
const QUOTE_AT = { x: 655, y: 498 };
const MIC = { x: 1040, y: LEDGE.y, s: 1.28, tilt: -1.0 };
/** the X-ray box's rect (world), dimmed and desaturated with the room: only the chat box glows teal */
const XR = { x: STUDY.xray.x - 96, y: STUDY.xray.y - 330, w: 192, h: 352 };

// ------------------------------------------------------------------------------------------------ fast-forward
const FF: { beat: string; img: RewindImage }[] = [
  { beat: 'ff1', img: 'knob' },
  { beat: 'ff2', img: 'snow' },
  { beat: 'ff3', img: 'fans' },
  { beat: 'ff4', img: 'goStone' },
  { beat: 'ff5', img: 'wick' },
];

interface B {
  D: number;
  ff: number[];
  who: number;
  rules: number;
  know: number;
  learn: number;
  acc: number;
  words: number[];
  choosing: number;
  board: number;
  net: number;
  tilt: number;
  candles: number;
  forty: number;
  two: number;
  day: number;
  burn: number;
  lantern: number;
  answers: number;
}
interface Scene extends ShotScene {
  b: B;
  cam: (t: number) => Camera3;
  CAMS: Camera3[];
}

/** the wave reaches network column c (0 = C1 … 8 = the chat box; 3 = the dark one) */
const waveAt = (b: B, col: number) => b.net + 0.12 + col * 0.2;

export default defineShot<Scene>({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      ff: FF.map((q) => T.beat(q.beat)),
      who: T.beat('b2'),
      rules: T.beat('b11'),
      know: T.beat('b12'),
      learn: T.beat('b13'),
      acc: T.beat('b14'),
      words: ACC.map((a) => T.word('L1527', a.word)),
      choosing: T.word('L1527', 'choosing'),
      board: T.beat('b3'),
      net: T.beat('b4'),
      tilt: T.beat('b4c'),
      candles: T.beat('b5'),
      forty: T.beat('b6'),
      two: T.beat('b7'),
      day: T.beat('b8'),
      burn: T.beat('b9'),
      lantern: T.beat('b10'),
      answers: T.beat('b10b'),
    };
    // ONE continuous camera after the fast-forward: board → pull back (the verdict in the left margin) → wider for
    // the network → tilt down to the whole shelf → drift back up to the dark lantern; [t, x, y, scale at L4]
    const keys: [number, number, number, number][] = [
      [0, 640, 345, 1.04],
      [b.who, 640, 345, 1.06],
      [b.learn, 625, 352, 0.93],
      [b.choosing + 0.4, 655, 365, 0.84],
      [b.net + 0.2, 690, 380, 0.78],
      [b.tilt - 0.1, 740, 420, 0.74],
      [b.candles + 0.2, 1078, 522, 0.6],
      [b.day, 1088, 528, 0.6],
      [b.burn + 0.5, 1096, 526, 0.61],
      [b.lantern + 1.9, 800, 404, 1.06],
      [b.answers + 0.4, 806, 404, 1.1],
      [D, 812, 402, 1.15],
    ];
    const fx = monotone(keys.map((k) => [k[0], k[1]]));
    const fy = monotone(keys.map((k) => [k[0], k[2]]));
    const fk = monotone(keys.map((k) => [k[0], Math.log(k[3])]));
    const cam = (t: number) => frameOn({ x: fx(t), y: fy(t) }, { x: 640, y: 360 }, Math.exp(fk(t)));
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 48; i++) CAMS.push(cam(b.who + ((D - b.who) * i) / 48));
    CAMS.push(cam(0));
    tl.hold(0, D);
    return { tl, b, cam, CAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    // ---- THE FAST-FORWARD (wordless): five flashes at the rewind's own pitch, forwards
    const ffEnd = b.ff[4] + REWIND_STEP;
    if (t >= b.ff[0] && t < ffEnd) {
      const k = Math.min(4, Math.floor((t - b.ff[0]) / REWIND_STEP + 1e-9));
      const local = t - b.ff[k];
      const u = local / REWIND_STEP;
      const uq = Math.floor(local * 12 + 1e-9) / 12 / REWIND_STEP;
      paintRewindImage(f, FF[k].img, u, uq, 1);
      if (FF[k].img === 'wick') chatBoxAround(f, u);
      const toCut = Math.min(local, REWIND_STEP - local);
      let amt = 0.34 + 0.66 * (1 - sm(toCut / 0.09));
      if (k === 4) amt *= 1 - sm((local - 0.5) / 0.22);
      tapeShudder(f, amt, 2026, 1);
      return;
    }
    paintStudy(f, t, b, sc);
    // the tape lurch into the fast-forward
    if (t < b.ff[0]) tapeShudder(f, 0.8 * sm((t - (b.ff[0] - 0.16)) / 0.14), 2026, 1);
  },
});

/** ff5: the flame inside the glowing chat box (screen space, around the lantern of the wick image) */
function chatBoxAround(f: Frame, u: number) {
  const k = sm((u - 0.5) / 0.3);
  if (k <= 0.003) return;
  const p = toScreen(LAYERS.L4, f.cam, 640, 312);
  const w = 300 * p.k, h = 236 * p.k;
  const C = MOODS.serverCyan;
  const c = f.c;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = withAlpha(C.halo, 0.25 * k);
  c.lineWidth = 10;
  c.beginPath();
  c.roundRect(p.x - w / 2, p.y - h / 2, w, h, 14);
  c.stroke();
  c.strokeStyle = withAlpha(C.core, 0.8 * k);
  c.lineWidth = 2;
  c.stroke();
  c.fillStyle = withAlpha(C.halo, 0.06 * k);
  c.fill();
  c.restore();
}

// =====================================================================================================
// THE STUDY (one continuous camera)
// =====================================================================================================
function paintStudy(f: Frame, t: number, b: B, sc: Scene) {
  const tq = tq12(t);
  const cam = sc.cam(t);
  f.camera(cam);
  f.setMood('candleAmber');
  studyRoom(f, { key: ID, cams: sc.CAMS, outside: { mood: 'winterBlue', kind: 'night' } });

  // ---- the verdict's light: the lamp's pool narrowed to a spot passing down the left margin
  const spot = spotAt(t, b);
  // ---- the network's clocks
  const swell = (n: NetNode) => win(tq, b.board - 0.05 + n.col * 0.02, b.board + 0.5 + n.col * 0.02);
  const tight = win(t, b.board - 0.1, b.board + 0.45);
  const netU = win(t, b.board, b.board + 0.6);
  const corkDim = win(t, b.board + 0.1, b.board + 0.9);
  const hideCards: SlotId[] = [...SUSPECTS, 'K', ...CLUE_IDS];

  // the hands: pressing the last pin home (before the fast-forward); on 'Who' they sit back out of frame
  const pinAt = W('C4-b');
  const pinPt = { x: pinAt.x, y: pinAt.y - SLOTS['C4-b'].h / 2 + 7 };
  const hu = t < b.ff[0] ? 0.5 : 0.6 + 0.4 * clamp01((tq - b.who + 0.05) / 0.85);
  const hp = hu < 0.999 ? hands.act('pin', hu, pinPt, { entry: handsEntry(cam, 'L4'), scale: 0.82, held: 'none' }) : null;

  // ---- the case (board with this shot's own cards, the shelf, the Wall, the X-ray box)
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    board: { state: { ...BS, threads: [], questions: [] }, hide: hideCards },
    shelf: { views: VIEWS },
    flames: false,
    xray: { light: lerp(0.26, 0.14, win(t, b.lantern, b.answers + 1)) },
    extra: (c, env) => {
      xrayMuted(c, env);
      corkDimming(c, env, corkDim);
      ledgeAndMicroscope(c, env, t, b);
      netStrings(c, env, t, b, netU);
      tieThreads(c, env, t, b, tight);
      accompliceThreads(c, env, t, b, tight);
      suspects(c, env, t, b, spot);
      clueCardsAndLanterns(c, env, t, b, swell);
      darkLantern(c, env, tq, b, swell);
      q4Card(c, env, t, b);
      kCard(c, env, tq, b);
      emptyPlace(c, env);
      liveTags(c, env, t, b);
      if (hp) {
        c.save();
        c.filter = `blur(${(0.8 * env.pxScale).toFixed(2)}px)`;
        hands.draw(c, hp, env);
        c.restore();
      }
    },
  });

  // ---- light after the rim pass: the spot, the glints, the wave, the candles picked out, the chat box
  f.layer('L4', (c, env) => {
    if (spot.k > 0.003) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, 120);
      g.addColorStop(0, withAlpha(mixLab(env.mood.core, env.mood.halo, 0.4), 0.2 * spot.k));
      g.addColorStop(0.6, withAlpha(env.mood.halo, 0.07 * spot.k));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(spot.x - 120, spot.y - 120, 240, 240);
      c.restore();
    }
    // people choosing: every pin in the clue columns glints at once
    const gk = win(t, b.choosing - 0.05, b.choosing + 0.12) * (1 - win(t, b.choosing + 0.3, b.choosing + 1.2));
    if (gk > 0.003) for (const n of NET) pinGlint(c, env, n.pin.x, n.pin.y, gk, 8);
    // the wave arrives at the output: the chat box glows (and keeps a glow)
    const oK = win(t, waveAt(b, 8) - 0.05, waveAt(b, 8) + 0.3);
    if (oK > 0.003) {
      const C = MOODS.serverCyan;
      c.save();
      c.globalCompositeOperation = 'lighter';
      const fl = 1 + 0.5 * Math.max(0, 1 - Math.abs(t - waveAt(b, 8) - 0.2) / 0.5);
      const g = c.createRadialGradient(OUT.x, OUT.y, 10, OUT.x, OUT.y, 170);
      g.addColorStop(0, withAlpha(C.core, 0.22 * oK * fl));
      g.addColorStop(0.4, withAlpha(C.halo, 0.12 * oK * fl));
      g.addColorStop(1, withAlpha(C.halo, 0));
      c.fillStyle = g;
      c.fillRect(OUT.x - 170, OUT.y - 170, 340, 340);
      c.restore();
    }
    // the bar chart in wax: the first, wordless stop on Cyc, then 'forty', 'two', 'day'
    const shelfDim = win(t, b.forty - 0.3, b.forty + 0.3) * (1 - win(t, b.burn - 0.3, b.burn + 0.4));
    const cycK = 0.55 * win(t, b.tilt + 0.5, b.tilt + 1.1) * (1 - win(t, b.candles - 0.3, b.candles + 0.3)) + win(t, b.forty - 0.15, b.forty + 0.25) * (1 - 0.6 * win(t, b.forty + 1.1, b.two - 0.1));
    const goK = win(t, b.two - 0.15, b.two + 0.25) * (1 - 0.6 * win(t, b.two + 1.1, b.day - 0.1));
    const mK = win(t, b.day - 0.15, b.day + 0.25) * (1 - 0.6 * win(t, b.day + 1.1, b.burn - 0.1));
    barWash(c, env, t, b);
    // b6–b9: the rest of the shelf drops a stop so each word points at one object
    const focus = t < b.two - 0.15 ? CYC.x : t < b.day - 0.15 ? GO.x : MATCH.x;
    shelfDimming(c, env, shelfDim, focus, focus === MATCH.x ? 58 : 34);
    pickOut(c, env, CYC.x, CYC.top - 20, CYC.bot + 30, cycK * 1.4, 26);
    sleeveRim(c, env, t, b.forty - 0.1, CYC.x, 6.5, CYC.top, CYC.bot);
    pickOut(c, env, GO.x, GO.top - 30, SY + 10, goK * 1.4, 26);
    sleeveRim(c, env, t, b.two - 0.1, GO.x, 15.5, GO.top, GO.bot);
    pickOut(c, env, MATCH.x, SY - 110, SY + 18, mK * 2.1, 60);
    if (mK > 0.003) {
      // the lamp catches the top edge of the struck match lying on the shelf
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = withAlpha(env.mood.core, 0.7 * Math.min(1, mK));
      c.fillRect(MATCH.x - 32, SY - 3.8, 60, 1.3);
      c.restore();
    }
    bigTag(c, env, CYC.x + 18, SY - 44, '1984–2023 · 39', cycK * (1 - win(t, b.two - 0.4, b.two)));
  });

  // ---- practicals: the five still-lit flames (brightening together on 'burn'), LEARNING's lantern
  const burnK = 1 + 0.45 * win(t, b.burn - 0.1, b.burn + 0.2) * (1 - 0.6 * win(t, b.burn + 0.8, b.burn + 2.2));
  for (const id of LIVE) {
    const v = view(id);
    const p = candleFlame({ x: X(id), y: SY, view: v, s: STUDY.shelf.s });
    f.practical({ x: p.x, y: p.y - 4, kind: 'candle', seed: 300 + v.slot * 7, intensity: 0.8 * burnK, radius: 34 * (0.85 + 0.15 * burnK) });
  }
  const s3 = s3Lantern(tq, b);
  if (s3 > 0.01) f.practical({ x: S3_LAMP.x, y: S3_LAMP.y, kind: 'candle', seed: 1515, intensity: 0.75 * s3, radius: 44 });
  // (no desk in this shot: in the full wide its near edge would stand in front of the shelf's window end)

  // ---- the end: everything but the dark lantern and the microscope settles a stop down; then the card
  const endK = win(t, b.answers - 0.4, b.answers + 1.6);
  if (endK > 0.003) {
    const ps = toScreen(LAYERS.L4, f.cam, (DARK.x + MIC.x) / 2, (DARK.y + MIC.y - 60) / 2);
    const c = f.c;
    c.save();
    const g = c.createRadialGradient(ps.x, ps.y, 260, ps.x, ps.y, 900);
    g.addColorStop(0, withAlpha(f.mood.fg, 0));
    g.addColorStop(1, withAlpha(f.mood.fg, 0.55 * endK));
    c.fillStyle = g;
    c.fillRect(-20, -20, 1320, 760);
    c.restore();
  }
  const qa = toScreen(LAYERS.L4, sc.cam(b.D), QUOTE_AT.x, QUOTE_AT.y);
  const qA = win(t, b.answers - 0.05, b.answers + 0.55);
  if (qA > 0.003) {
    f.c.save();
    f.c.globalAlpha = qA;
    softPlate(f.c, qa.x, qa.y + 4, 330, 200, f.mood.ink, 0.55);
    f.c.restore();
  }
  quoteCard(f.c, {
    quote: 'satisfying insight for about a quarter of the prompts we’ve tried',
    speaker: 'Anthropic, 2025',
    x: qa.x,
    y: qa.y,
    width: 250,
    size: 22,
    maxChars: 24,
    plate: false,
    at: b.answers - 0.05,
  }, { t, mood: f.mood, seed: 1516 });
}

// ------------------------------------------------------------------------------------------------ the verdict
/** the lamp's light narrowed to a spot: from the pool's heart to RULES, KNOWLEDGE, LEARNING */
function spotAt(t: number, b: B): { x: number; y: number; k: number } {
  const S1 = W('S1'), S2 = W('S2'), S3 = W('S3');
  const keys: [number, number, number][] = [
    [b.who + 0.3, 600, 330],
    [b.rules - 0.15, S1.x + 6, S1.y],
    [b.rules + 0.55, S1.x + 4, S1.y + 18],
    [b.know - 0.15, S2.x + 6, S2.y],
    [b.know + 0.6, S2.x + 4, S2.y + 22],
    [b.learn - 0.15, S3.x + 4, S3.y - 6],
    [b.D, S3.x + 4, S3.y - 6],
  ];
  const fx = monotone(keys.map((q) => [q[0], q[1]]));
  const fy = monotone(keys.map((q) => [q[0], q[2]]));
  const k = win(t, b.who + 0.3, b.rules - 0.3) * (1 - win(t, b.choosing + 0.3, b.board - 0.2));
  return { x: fx(t), y: fy(t), k };
}
/** LEARNING's lantern catches on 'Learning' (on the twos: a spark, a gutter, then the flame takes) */
function s3Lantern(tq: number, b: B): number {
  const d = tq - (b.learn - 0.05);
  if (d < 0) return 0;
  if (d < 1 / 12) return 0.45;
  if (d < 2 / 12) return 0.2;
  if (d < 3 / 12) return 0.7;
  return Math.min(1, 0.7 + (d - 0.25) * 1.5);
}
function suspects(c: C, env: PaintEnv, t: number, b: B, spot: { x: number; y: number; k: number }) {
  for (const id of SUSPECTS) {
    const S = SLOTS[id];
    const p = W(id);
    const near = spot.k * Math.max(0, 1 - Math.hypot(p.x - spot.x, p.y - spot.y) / 150);
    const light = Math.min(1, cardLight(id) + 0.6 * near);
    const grey = id === 'S1' ? win(t, b.rules + 0.45, b.rules + 1.1) : id === 'S2' ? win(t, b.know + 0.45, b.know + 1.1) : 0;
    const base = { x: p.x, y: p.y, k: 1, light };
    if (id === 'S3') {
      drawCard(c, S, { ...base, lanternLit: s3Lantern(tq12(t), b) }, env);
      continue;
    }
    if (grey < 1) drawCard(c, S, { ...base, alpha: 1 - grey, lit: id === 'S2' }, env);
    if (grey > 0) drawCard(c, S, { ...base, alpha: grey, grey: true }, env);
  }
}
/** threads of light run from LEARNING's lantern to data, fire and the messenger, one per word */
function accompliceThreads(c: C, env: PaintEnv, t: number, b: B, tight: number) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  ACC.forEach((a, i) => {
    const u = sm((t - (b.words[i] - 0.12)) / 0.6);
    if (u <= 0.002) return;
    const to = W(a.id);
    const q = { x: to.x, y: to.y - SLOTS[a.id].h / 2 + 7 };
    const p = S3_LAMP;
    const d = Math.hypot(q.x - p.x, q.y - p.y);
    const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2 + d * 0.12 * (1 - tight);
    const n = 40;
    const m = Math.max(1, Math.round(n * u));
    const pt = (s: number) => {
      const a1 = (1 - s) * (1 - s), b1 = 2 * (1 - s) * s, c1 = s * s;
      return { x: a1 * p.x + b1 * mx + c1 * q.x, y: a1 * p.y + b1 * my + c1 * q.y };
    };
    const glow = 0.75 + 0.25 * (1 - win(t, b.words[i] + 0.7, b.words[i] + 1.6));
    for (const [lw, al] of [[7, 0.07], [2.6, 0.24], [1.1, 0.7]] as const) {
      c.strokeStyle = withAlpha(env.mood.core, al * glow);
      c.lineWidth = lw;
      c.beginPath();
      const s0 = pt(0);
      c.moveTo(s0.x, s0.y);
      for (let j = 1; j <= m; j++) {
        const s = pt(j / n);
        c.lineTo(s.x, s.y);
      }
      c.stroke();
    }
    if (u < 1) {
      const h = pt(m / n);
      const g = c.createRadialGradient(h.x, h.y, 0, h.x, h.y, 16);
      g.addColorStop(0, withAlpha(env.mood.core, 0.8));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(h.x - 16, h.y - 16, 32, 32);
    } else {
      // the accomplice's card answers with a short flare where the thread lands
      const fl = 1 - win(t, b.words[i] + 0.5, b.words[i] + 1.2);
      if (fl > 0.01) pinGlint(c, env, q.x, q.y, fl, 10);
    }
  });
  c.restore();
}
/** the threads of light pinned over the film (clue to clue): curved; on 'board' they tighten into straight strings */
function tieThreads(c: C, env: PaintEnv, t: number, b: B, tight: number) {
  const glow = 0.55 + 0.45 * win(t, b.board - 0.1, b.board + 0.3) * (1 - 0.5 * win(t, b.board + 0.5, b.board + 1.4));
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const [a, z] of BS.threads) {
    const pa = W(a), pz = W(z);
    const p = { x: pa.x, y: pa.y - SLOTS[a].h / 2 + 7 }, q = { x: pz.x, y: pz.y - SLOTS[z].h / 2 + 7 };
    const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2 + Math.hypot(q.x - p.x, q.y - p.y) * 0.08 * (1 - tight);
    for (const [lw, al] of [[6, 0.07], [2.4, 0.22], [1, 0.6]] as const) {
      c.strokeStyle = withAlpha(env.mood.core, al * glow);
      c.lineWidth = lw;
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.quadraticCurveTo(mx, my, q.x, q.y);
      c.stroke();
    }
  }
  c.restore();
}

// ------------------------------------------------------------------------------------------------ the network
/** the network's strings: straight, pin to pin, column to column; the wave runs along them (never to the dark one) */
function netStrings(c: C, env: PaintEnv, t: number, b: B, netU: number) {
  if (netU <= 0.003) return;
  const base = mixLab(oxblood(env, 0.35), env.mood.rim, 0.35);
  c.save();
  c.lineCap = 'round';
  for (const e of EDGES) {
    const a = 'pin' in e.a ? (e.a as NetNode).pin : e.a;
    const z = 'pin' in e.b ? (e.b as NetNode).pin : e.b;
    c.strokeStyle = withAlpha(base, (e.dark ? 0.22 : 0.34) * netU);
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(z.x, z.y);
    c.stroke();
  }
  // the wave: a bead of light along every live string as it crosses, then a faint warmth left behind
  c.globalCompositeOperation = 'lighter';
  for (const e of EDGES) {
    if (e.dark) continue;
    const a = 'pin' in e.a ? (e.a as NetNode).pin : e.a;
    const z = 'pin' in e.b ? (e.b as NetNode).pin : e.b;
    const t0 = waveAt(b, e.colA), t1 = waveAt(b, e.colB);
    const u = (t - t0) / (t1 - t0);
    if (u < 0) continue;
    const after = clamp01(u) >= 1 ? 1 : 0;
    const warm = 0.2 * win(t, t1, t1 + 0.3);
    if (warm > 0.003) {
      c.strokeStyle = withAlpha(env.mood.halo, warm);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(z.x, z.y);
      c.stroke();
    }
    if (!after) {
      const x = lerp(a.x, z.x, u), y = lerp(a.y, z.y, u);
      const g = c.createRadialGradient(x, y, 0, x, y, 9);
      g.addColorStop(0, withAlpha(env.mood.core, 0.75));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(x - 9, y - 9, 18, 18);
    }
  }
  c.restore();
}
/** every clue card in C1–C4: a card until 'board', then it shrinks into its pin as a paper lantern swells there */
function clueCardsAndLanterns(c: C, env: PaintEnv, t: number, b: B, swell: (n: NetNode) => number) {
  for (const n of NET) {
    const S = SLOTS[n.id as SlotId];
    const sw = swell(n);
    if (sw < 0.999) {
      const k = 1 - 0.45 * sw;
      // shrink toward the pin (the card hangs from it)
      const y = n.pin.y + (S.h / 2 - 7) * k;
      drawCard(c, S, { x: n.x, y, k, light: cardLight(n.id as SlotId), alpha: 1 - sw, lit: !!BS.cards.find((q) => q.id === n.id)?.lit }, env);
    }
    if (sw > 0.001) {
      const wc = waveAt(b, n.col);
      const lit = win(t, wc - 0.06, wc + 0.1);
      const flare = Math.max(0, 1 - Math.abs(t - (wc + 0.12)) / 0.35);
      const r = n.r * (0.35 + 0.65 * sw);
      const hang = Math.max(0, n.y - r * 1.2 - n.pin.y);
      paperLantern(c, { x: n.x, y: n.y, r, act: 0.05 + 0.6 * lit + 0.3 * flare, flare, hang, tassel: false, alpha: sw, halo: 0.55 }, env);
      // the brass pin it hangs from
      pinHead(c, env, n.pin);
    }
  }
}
/** the one lantern that never lights, hanging from the case card's pin (uncovered when the card drops) */
function darkLantern(c: C, env: PaintEnv, tq: number, b: B, swell: (n: NetNode) => number) {
  const sw = swell(DARK);
  if (sw <= 0.001) return;
  const r = DARK.r * (0.35 + 0.65 * sw);
  const hang = Math.max(0, DARK.y - r * 1.2 - DARK.pin.y);
  // a slight sway (on the twos) once the card has left it
  const sway = 0.02 * Math.sin((tq - b.net) * 1.3) * win(tq, b.net + 0.3, b.net + 1.2);
  c.save();
  c.translate(DARK.pin.x, DARK.pin.y);
  c.rotate(sway);
  c.translate(-DARK.pin.x, -DARK.pin.y);
  paperLantern(c, { x: DARK.x, y: DARK.y, r, act: 0, hang, tassel: true, alpha: sw }, env);
  c.restore();
  pinHead(c, env, DARK.pin);
}
function pinHead(c: C, env: PaintEnv, p: Pt) {
  c.fillStyle = mixLab(env.mood.halo, env.mood.set, 0.35);
  c.beginPath();
  c.arc(p.x, p.y, 4.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(env.mood.core, 0.5);
  c.beginPath();
  c.arc(p.x - 1.2, p.y - 1.2, 1.6, 0, Math.PI * 2);
  c.fill();
}
/** WHO TAUGHT IT?: pinned at the centre until 'network', then it drops from its pin, turning, into the lamp's pool */
function kCard(c: C, env: PaintEnv, tq: number, b: B) {
  const S = SLOTS.K;
  const p = W('K');
  const u = clamp01((tq - b.net) / 1.25);
  if (u >= 1) return;
  const x = p.x + 210 * Math.pow(u, 1.3) + 16 * Math.sin(u * 6.5) * u;
  const y = p.y + 760 * u * u;
  const rot = u * 1.3 + 0.18 * Math.sin(u * 8.5) * u;
  drawCard(c, S, { x, y, k: 1, light: Math.min(1, cardLight('K') + 0.1), rot, pin: u <= 0 }, env);
}
/** on 'board' the founding row and the question thread dim to the cork's tone: they are not part of the network */
function corkDimming(c: C, env: PaintEnv, k: number) {
  if (k <= 0.003) return;
  const cork = mixLab(mixLab(env.mood.set, env.mood.fg, 0.35), mixLab(env.mood.setHaze, env.mood.halo, 0.42), 0.55);
  for (const id of ['F1', 'F2'] as SlotId[]) {
    const S = SLOTS[id];
    const p = W(id);
    c.fillStyle = withAlpha(cork, 0.62 * k);
    c.fillRect(p.x - S.w / 2 - 2, p.y - S.h / 2 - 2, S.w + 6, S.h + 7);
  }
  c.strokeStyle = withAlpha(cork, 0.6 * k);
  c.lineWidth = 2.6;
  c.beginPath();
  for (let bx = 40; bx <= 960; bx += 20) {
    const x = STUDY.board.x + bx, y = sagAt(bx);
    if (bx === 40) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
}
/** the last question card, hung on the oxblood thread above the dark lantern from 'lantern' on, swaying slightly */
function q4Card(c: C, env: PaintEnv, t: number, b: B) {
  const a = win(t, b.lantern - 0.45, b.lantern + 0.15);
  if (a <= 0.003) return;
  const tq = tq12(t);
  const drop = (1 - a) * -46;
  const sway = 0.03 * Math.sin((tq - b.lantern) * 1.25 + 0.4) * (0.6 + 0.4 * Math.exp(-(tq - b.lantern) * 0.25));
  c.save();
  c.translate(Q4.x, Q4.clipY);
  c.rotate(sway);
  c.globalAlpha *= a;
  c.strokeStyle = oxblood(env, 0.15);
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, Q4.top - Q4.clipY + drop);
  c.stroke();
  c.fillStyle = mixLab(env.mood.halo, env.mood.set, 0.4);
  c.fillRect(-4, Q4.top - Q4.clipY + drop - 5, 8, 7);
  const K = 1.6;
  drawCard(c, { id: 'Q-Q4', w: Q4.w / K, h: Q4.h / K, icon: 'question', text: Q4.text }, { x: 0, y: Q4.top - Q4.clipY + drop + Q4.h / 2, k: K, light: 0.75, pin: false }, env);
  c.restore();
}
/** the small ledge under the board's lower right, and the brass microscope on it, tipped toward the dark lantern */
function ledgeAndMicroscope(c: C, env: PaintEnv, t: number, b: B) {
  c.fillStyle = env.fill('ink');
  c.fillRect(LEDGE.x0, LEDGE.y, LEDGE.x1 - LEDGE.x0, 8);
  for (const bx of [LEDGE.x0 + 16, LEDGE.x1 - 16]) {
    c.beginPath();
    c.moveTo(bx - 3, LEDGE.y + 8);
    c.lineTo(bx + 3, LEDGE.y + 8);
    c.lineTo(bx + 3, LEDGE.y + 32);
    c.quadraticCurveTo(bx, LEDGE.y + 18, bx - 16, LEDGE.y + 9);
    c.closePath();
    c.fill();
  }
  c.fillStyle = withAlpha(env.mood.rim, 0.35);
  c.fillRect(LEDGE.x0, LEDGE.y - 0.6, LEDGE.x1 - LEDGE.x0, 1.2);
  const light = 0.3 + 0.7 * win(t, b.lantern - 0.2, b.lantern + 1.4);
  // its soft shadow thrown up-left onto the cork by the lamp (it stands in front of the board, not on it)
  c.save();
  c.globalAlpha *= 0.28;
  c.filter = `blur(${(5 * env.pxScale).toFixed(2)}px)`;
  brassMicroscope(c, { x: MIC.x - 16, y: MIC.y - 10, s: MIC.s, tilt: MIC.tilt, light: 0 }, env);
  c.restore();
  brassMicroscope(c, { x: MIC.x, y: MIC.y, s: MIC.s, tilt: MIC.tilt, light }, env);
}

// ------------------------------------------------------------------------------------------------ the shelf
/** a rim of light running up a sleeve's two edges (stub to lit height) in 0.8 s, then staying faintly */
function sleeveRim(c: C, env: PaintEnv, t: number, t0: number, x: number, w: number, top: number, bot: number) {
  if (t < t0) return;
  const u = clamp01((t - t0) / 0.8);
  const after = 1 - 0.6 * win(t, t0 + 1.0, t0 + 2.0);
  const head = lerp(bot, top, sm(u));
  const x0 = x - w, x1 = x + w;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const col = mixLab(env.mood.core, env.mood.rim, 0.35);
  c.strokeStyle = withAlpha(col, 0.85 * after);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(x0, bot);
  c.lineTo(x0, head);
  c.moveTo(x1, bot);
  c.lineTo(x1, head);
  if (u >= 1) {
    c.moveTo(x0 - 1, top - 0.5);
    c.lineTo(x1 + 1, top - 0.5);
  }
  c.stroke();
  c.fillStyle = withAlpha(col, 0.12 * after * sm(u));
  c.fillRect(x0, head, x1 - x0, bot - head);
  c.restore();
}
/** the empty place at the shelf's end, by the window, where tomorrow's candle will stand: a bare brass cup */
function emptyPlace(c: C, env: PaintEnv) {
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.moveTo(NEW_X - 17, SY);
  c.lineTo(NEW_X - 12, SY - 7);
  c.lineTo(NEW_X + 12, SY - 7);
  c.lineTo(NEW_X + 17, SY);
  c.closePath();
  c.fill();
  c.fillRect(NEW_X - 9, SY - 13, 18, 6);
  c.fillStyle = withAlpha(env.mood.rim, 0.35);
  c.fillRect(NEW_X - 9, SY - 13.5, 18, 1);
}
/** on 'burn' the still-lit candles' tags read 'as of October 2026' (a second strip on each tag's string) */
function liveTags(c: C, env: PaintEnv, t: number, b: B) {
  const a = win(t, b.burn - 0.1, b.burn + 0.5);
  if (a <= 0.003) return;
  c.save();
  c.globalAlpha *= a;
  c.font = `400 7.6px ${FONT.typewriter}`;
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  for (const id of LIVE) {
    const x = X(id) + 15 + 6;
    const y = SY - 6;
    const paper = mixLab(env.mood.setHaze, env.mood.halo, 0.55);
    c.fillStyle = paper;
    c.fillRect(x, y, 78, 10);
    c.fillStyle = mixLab(env.mood.ink, paper, 0.15);
    c.fillText('as of October 2026', x + 2.5, y + 5.4);
  }
  c.restore();
}

/** the bar chart in wax: once the shelf is in view the burned years (the ghost SLEEVES) turn to a pale translucent
 *  paper with their rings scored, hanging from the one lit height every candle was cut to, and the stubs go near-black,
 *  so a 39-ring sleeve and a 2-ring sleeve read as bars of very different length; a faint ruled line marks the top */
function barWash(c: C, env: PaintEnv, t: number, b: B) {
  const a = win(t, b.tilt + 0.2, b.candles + 0.3) * (1 - 0.35 * win(t, b.lantern - 0.6, b.lantern + 1.2));
  if (a <= 0.003) return;
  const top = SY - 270;
  const paper = mixLab(mixLab(env.mood.setHaze, env.mood.core, 0.42), env.mood.halo, 0.2);
  const score = mixLab(env.mood.ink, env.mood.set, 0.35);
  c.save();
  for (const v of V0) {
    if (v.kind === 'match' || v.kind === 'blank' || v.state === 'unlit') continue;
    const x = X(v.id);
    const w = v.kind === 'taper' ? 6.5 : 15;
    const h = Math.max(0, v.rings) * 6;
    // the stub: near-black wax from the burn line to the shelf
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.5 * a);
    c.fillRect(x - w, top + h, 2 * w, SY - top - h);
    if (h <= 0) continue;
    // the sleeve: pale translucent paper, one scored ring per year
    c.fillStyle = withAlpha(paper, 0.62 * a);
    c.fillRect(x - w, top, 2 * w, h);
    c.strokeStyle = withAlpha(score, 0.45 * a);
    c.lineWidth = 1;
    c.beginPath();
    for (let r = 1; r < v.rings; r++) {
      c.moveTo(x - w, top + r * 6 + 0.5);
      c.lineTo(x + w, top + r * 6 + 0.5);
    }
    c.stroke();
    c.strokeStyle = withAlpha(env.mood.rim, 0.5 * a);
    c.strokeRect(x - w + 0.5, top + 0.5, 2 * w - 1, h - 1);
    // the burn line, where sleeve meets stub
    c.fillStyle = withAlpha(env.mood.core, 0.55 * a);
    c.fillRect(x - w, top + h - 0.8, 2 * w, 1.6);
  }
  c.strokeStyle = withAlpha(env.mood.rim, 0.3 * a);
  c.lineWidth = 1;
  c.setLineDash([6, 6]);
  c.beginPath();
  c.moveTo(STUDY.shelf.x + 20, top - 1.5);
  c.lineTo(NEW_X + 30, top - 1.5);
  c.stroke();
  c.restore();
}
/** b6–b9: the shelf a stop down everywhere but around the candle being named (normal blend, world coords) */
function shelfDimming(c: C, env: PaintEnv, k: number, fx: number, hw: number) {
  if (k <= 0.003) return;
  c.save();
  c.filter = `blur(${(18 * env.pxScale).toFixed(2)}px)`;
  c.fillStyle = withAlpha(env.mood.fg, 0.3 * k);
  c.beginPath();
  c.rect(STUDY.shelf.x - 200, SY - 330, NEW_X - STUDY.shelf.x + 400, 400);
  c.rect(fx - hw, SY - 300, 2 * hw, 340);
  c.fill('evenodd');
  c.restore();
}
/** a candle's base tag turned up to the lamp so it can be read (world coords; legible at the shelf wide) */
function bigTag(c: C, env: PaintEnv, x: number, y: number, text: string, k: number) {
  if (k <= 0.003) return;
  c.save();
  c.globalAlpha *= Math.min(1, k);
  c.font = `400 30px ${FONT.typewriter}`;
  const tw = c.measureText(text).width + 26;
  const th = 44;
  c.translate(x, y);
  c.rotate(0.05 * (1 - Math.min(1, k)));
  c.strokeStyle = withAlpha(env.mood.rim, 0.6);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-14, 26);
  c.lineTo(4, 0);
  c.stroke();
  const paper = mixLab(env.mood.setHaze, env.mood.core, 0.6);
  c.fillStyle = withAlpha(env.mood.fg, 0.4);
  c.fillRect(6, -th / 2 + 4, tw, th);
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(12, -th / 2);
  c.lineTo(4 + tw, -th / 2);
  c.lineTo(4 + tw, th / 2);
  c.lineTo(12, th / 2);
  c.lineTo(2, 0);
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(env.mood.ink, paper, 0.1);
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  c.fillText(text, 20, 2);
  c.restore();
}
/** the X-ray box muted with the room: its chroma pulled ~60% toward grey and a stop darker */
function xrayMuted(c: C, env: PaintEnv) {
  c.save();
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = withAlpha('#808080', 0.6);
  c.fillRect(XR.x, XR.y, XR.w, XR.h);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = withAlpha(env.mood.fg, 0.28);
  c.fillRect(XR.x, XR.y, XR.w, XR.h);
  c.restore();
}
