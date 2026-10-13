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
 *   L1516b      (review round 3; pays off ch13-s01's second question) on 'And' the HOW FAR? HOW FAST? card drops onto
 *               the question thread at the rewired board's upper right; on 'how far, how fast' a gentle push onto it;
 *               on 'file' the case file opens on the tray: its page printed (CASE FILE, ruled lines, typed lines, the
 *               WHO TAUGHT IT? slip clipped to it at ~60 % ink). Review round 4: on 'stays' the push to ~1.25x onto
 *               HOW FAR? HOW FAST? (the tray leaves frame; THE FIELD card slides out left), on 'open' (the clock's
 *               'stamp' beat, where fx-stamp-howfar sounds) STATUS: OPEN is struck at ch15-s09's size and red, held
 *               1.2 s; then the pull back that sets the dark lantern near frame centre for the final 2 s, THE FIELD
 *               card back in at ~0.85 and ~60 px down-left, clear of the lanterns
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at a pitch of 6 px per ring
 * at L3 (270 px), its flame on the top ring and a small tag at its base giving the year it was lit. It burns down one
 * ring per year the belief is held; the burned wax stays above the stub as a ghost sleeve (39 rings = 234 px).
 * TEXT DISCIPLINE: two text items only: the question card (from 'lantern') and the microscope-limit quote.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, ShotScene } from '../../../film';
import { FONT, LAYERS, MOODS, PUPPET_NEAR_BLACK, capPx1080, defineShot, drawTracked, ghostOk, hash1, legibleSize, mixLab, paperLantern, textColor, wrapLines, textRole, titleColor, toLayer, toScreen, withAlpha } from '../../../film';
import { drapery } from '../sets/occluders';
import { hands } from '../cast';
import { handsEntry } from '../sets/narratorHands';
import { STUDY, candleX, slotWorld, studyCase, studyRoom } from '../sets/study';
import { BOARD, SLOTS, boardStateAt, shelfStateAt, type CandleView, type SlotId } from '../sets/studyState';
import { candleFlame } from '../sets/beliefCandle';
import { DEFAULT_POOL, drawCard, oxblood, paperTone, poolAt, typedText, type Pool } from '../sets/caseBoard';
import { cardProbe, softPlate } from '../../../film/silhouette/type';
import { REWIND_STEP, paintRewindImage, tapeShudder, type RewindImage } from '../sets/ch01-s06-rewind';
import { CLUE_IDS, DARK, EDGES, NET, OUT, pickOut, pinGlint, type NetNode } from '../sets/ch15-s08-kit';
// the brass microscope: the one shared silhouette (ch15-s03's desk insert draws the same instrument; review round 1)
import { studyMicroscope as brassMicroscope } from '../sets/ch15-s03-microscope';
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
// round-2 legibility: the card's lettering at the 22 px cap floor in the final framing (K = 2.2, card 280 x 96)
// round-1 revision: the end framing is wider (scale 1.0-1.045), so the card's lettering is scaled up to hold the floor
// round-4 r1 (critic): 40 px narrower and 20 px left, so the C3 lantern at its right edge is no longer half hidden
const Q4 = { x: STUDY.board.x + 480, clipY: sagAt(480), top: 128, w: 266, h: 106, K: 2.55, text: 'How, exactly, does it reach its answer?' };
/** ch13-s01's second question (review round 3), hung on the question thread at the board's upper right, between the
 *  C4 lineage card and the board's edge, above the chat box (world units; typed as WHO TAUGHT IT? is) */
// review round 4: a little larger (248 x 166) so ch15-s09's stamp fits its clear lower band at the 1.25x push
const HF = { x: 1008, clipY: sagAt(868), top: 78, w: 248, h: 166, text: 'HOW FAR? HOW FAST?' };
/** ch15-s09's STATUS: OPEN stamp at the same on-screen size (its 31 px type, 258 x 54 box and 4.2 px rule at the desk's
 *  ~1.085 scale) seen through this shot's 1.25x push: world units here */
const STAMP = { w: 224, h: 47, fs: 27, rule: 3.6, inner: 1.2, red: '#b3261e', wet: '#7a140f' };
/** the board's tray: a shallow ledge along the board's lower right, its top seen from just above (depth = the
 *  foreshortened top surface); the microscope stands on it, WHO TAUGHT IT? comes to rest on it, the case file lies on it */
const LEDGE = { x0: 560, x1: 1134, y: STUDY.board.y + BOARD.h + 22, depth: 30 };
const MIC = { x: 1040, y: LEDGE.y - 9, s: 1.28, tilt: -1.0 };
/** the manila case file lying on the tray, closed until 'file' (its front cover opens leftward about the spine) */
const FILE = { x0: 780, w: 150, front: LEDGE.y - 5, d: 21 };
/** where WHO TAUGHT IT? comes to rest, lying flat on the tray, after its drop into the lamp's pool */
const K_REST = { x: 676, y: LEDGE.y - 16, flat: 0.16 };
/** the end card (the field, 2019-2025), standing on the tray at the back, leaning on the board (world rect) */
const END_CARD = { x0: 286, x1: 724, y0: 398, y1: LEDGE.y - LEDGE.depth + 2 };
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
  /** L1516b: 'how far, how fast?' (start, end) and 'file' */
  how: number;
  fast: number;
  file: number;
  /** L1516b: 'And' (the HOW FAR? HOW FAST? card drops in), 'stays' (the push) and the stamp on 'open' */
  and: number;
  stays: number;
  stamp: number;
}
interface Scene extends ShotScene {
  b: B;
  cam: (t: number) => Camera3;
  /** the camera's action-plane scale at t */
  scaleAt: (t: number) => number;
  /** the wide camera (the shelf seen whole), for placing the near occluder */
  wide: Camera3;
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
      how: T.word('L1516b', 'how'),
      fast: T.wordEnd('L1516b', 'fast'),
      file: T.beat('openFile'),
      and: T.word('L1516b', 'And'),
      stays: T.word('L1516b', 'stays'),
      // review round 4: the clock's named beat 'stamp' (= 'open'); fx-stamp-howfar sounds on it
      stamp: T.beat('stamp'),
    };
    // ONE continuous camera after the fast-forward. Round-2 notes: a push onto each suspect and accomplice ON ITS WORD
    // (close enough that its lettering reads at the 22 px cap floor), then the pull back to the full board on 'Never one
    // person' so the board-to-network morph reads full-frame; then the tilt down to the shelf and back up to the dark
    // lantern; [t, x, y, scale at L4]
    const never = T.word('L1514', 'Never');
    const keys: [number, number, number, number][] = [
      [0, 640, 345, 1.04],
      [b.who, 640, 345, 1.06],
      // 'Who taught it?': a breath in on the case card, drifting toward the left margin
      [b.who + 0.7, 610, 332, 1.2],
      // 'rules': S1 at the top of the left margin (S2 waiting below it)
      [b.rules - 0.1, 320, 232, 2.15],
      [b.rules + 0.75, 322, 240, 2.15],
      // 'knowledge … typed in by hand': S2
      [b.know - 0.05, 324, 352, 2.35],
      [b.know + 1.4, 326, 362, 2.35],
      // 'Learning': S3, its lantern catching
      [b.learn - 0.05, 328, 452, 2.35],
      [b.acc - 0.1, 336, 446, 2.3],
      // the threads run out of the margin: ride the first one to DATA and FIRE (both in C3, one above the other)
      [b.words[0] - 0.35, 520, 330, 1.4],
      [b.words[0] + 0.3, 768, 246, 2.15],
      [b.words[1] + 0.6, 768, 252, 2.15],
      // 'a messenger': the backward bead in C2, with LEARNING's lantern still in frame
      [b.words[2] + 0.1, 560, 360, 1.5],
      // 'people choosing': the board's pins
      [b.choosing + 0.1, 630, 345, 1.0],
      // 'Never one person': the full board
      [never + 0.4, 680, 370, 0.84],
      [b.net + 0.2, 690, 380, 0.78],
      [b.tilt - 0.1, 740, 420, 0.74],
      [b.candles + 0.2, 1078, 522, 0.6],
      [b.day, 1088, 528, 0.6],
      [b.burn + 0.5, 1096, 526, 0.61],
      [b.lantern + 1.9, 800, 404, 1.06],
      // round-1 revision: on 'answers' a breath back so the tray under the board (microscope, the fallen case card,
      // the case file) and the field's card stand clear of the bottom margin
      [b.answers + 0.5, 792, 428, 1.0],
      // round 3: on 'how far, how fast?' a gentle push onto the HOW FAR? HOW FAST? card (upper right); it holds
      // through the stamp on 'stays open'; then the pull back to the dark lantern for the final hold.
      // Review round 1 (sync): the push is limited (8 %, drifting toward the card) so the tray stays in frame and the
      // case file opens IN SHOT on 'file', and the field's card stays whole inside the frame (dimmed while pushed)
      [b.how - 0.05, 796, 424, 1.0],
      [b.fast + 0.4, 866, 386, 1.08],
      [b.file + 0.05, 868, 384, 1.085],
      // review round 4: on 'stays' the push to ~1.25x onto HOW FAR? HOW FAST? (the tray leaves frame; the question
      // card above the dark lantern stays whole at frame left), settled before 'open'; held 1.2 s past the stamp
      [b.stays + 0.14, 940, 226, 1.25],
      [b.stamp + 1.2, 942, 227, 1.25],
      // then the pull back: the dark lantern near frame centre for the final 2 s (the tray, the open file, the
      // microscope and the field's card below it)
      [D - 2.0, 664, 380, 0.98],
      [D, 662, 379, 0.978],
    ];
    const fx = monotone(keys.map((k) => [k[0], k[1]]));
    const fy = monotone(keys.map((k) => [k[0], k[2]]));
    const fk = monotone(keys.map((k) => [k[0], Math.log(k[3])]));
    const cam = (t: number) => frameOn({ x: fx(t), y: fy(t) }, { x: 640, y: 360 }, Math.exp(fk(t)));
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 120; i++) CAMS.push(cam(b.who + ((D - b.who) * i) / 120));
    CAMS.push(cam(0));
    tl.hold(0, D);
    return { tl, b, cam, CAMS, scaleAt: (t: number) => Math.exp(fk(t)), wide: cam(b.burn) };
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

/** ff5: where the wick image's lantern hangs (L4 world), the chat box's centre */
const CHAT_FF = { x: 772, y: 302 };
/** ff5: the flame inside the glowing chat box (screen space, around the lantern of the wick image) */
function chatBoxAround(f: Frame, u: number) {
  const k = sm((u - 0.5) / 0.3);
  if (k <= 0.003) return;
  // review round 1: the box is centred on the lantern (the flame sits inside the glowing chat box, not on its edge)
  const p = toScreen(LAYERS.L4, f.cam, CHAT_FF.x, CHAT_FF.y);
  const w = 300 * p.k, h = 262 * p.k;
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
  studyCase(textureFrame(f), {
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
      caseFile(c, env, t, b);
      netStrings(c, env, t, b, netU);
      tieThreads(c, env, t, b, tight);
      accompliceThreads(c, env, t, b, tight);
      textRole(c, 'subject', () => suspects(c, env, t, b, spot));
      clueCardsAndLanterns(c, env, t, b, swell);
      darkLantern(c, env, tq, b, swell);
      textRole(c, 'subject', () => q4Card(c, env, t, b));
      howFarCard(c, env, t, b);
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
    // (round-1: larger, and held half a second longer, so it reads in the full-board frame)
    const gk = win(t, b.choosing - 0.05, b.choosing + 0.12) * (1 - win(t, b.choosing + 0.8, b.choosing + 1.7));
    if (gk > 0.003) for (const n of NET) pinGlint(c, env, n.pin.x, n.pin.y, gk, 12);
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
    // round-4 r1 (critic): each of 'forty' · 'two' · 'day' gets the same treatment (its bar lit to one level and a
    // legible plate from its own base tag, held 1.2 s), and each goes back to rest before the next word, so the bar
    // being named is always the brightest (Cyc is at rest by 'two')
    const back = (w: number, next: number) => 1 - win(t, Math.min(w + 1.35, next - 0.55), next - 0.05);
    const cycK = 0.55 * win(t, b.tilt + 0.5, b.tilt + 1.1) * (1 - win(t, b.candles - 0.3, b.candles + 0.3)) + win(t, b.forty - 0.15, b.forty + 0.25) * back(b.forty, b.two);
    const goK = win(t, b.two - 0.15, b.two + 0.25) * back(b.two, b.day);
    const mK = win(t, b.day - 0.15, b.day + 0.25) * back(b.day, b.burn);
    // 'forty': Cyc is a taper, so its sleeve is thin; a light ghost bar the width of every other bar stands behind
    // it, so its LENGTH compares bar to bar (round-1 note)
    ghostBar(c, env, CYC.x, CYC.top, CYC.bot, 0.35 * win(t, b.forty - 0.15, b.forty + 0.35) * back(b.forty, b.two));
    barWash(c, env, t, b);
    // b6–b9: the rest of the shelf drops a stop so each word points at one object
    const focus = t < b.two - 0.15 ? CYC.x : t < b.day - 0.15 ? GO.x : MATCH.x;
    shelfDimming(c, env, shelfDim, focus, focus === MATCH.x ? 58 : 34);
    pickOut(c, env, CYC.x, CYC.top - 20, CYC.bot + 30, cycK * 1.4, 26);
    sleeveRim(c, env, t, b.forty - 0.1, CYC.x, 15.5, CYC.top, CYC.bot, b.two);
    pickOut(c, env, GO.x, GO.top - 30, SY + 10, goK * 2.0, 40);
    sleeveRim(c, env, t, b.two - 0.1, GO.x, 15.5, GO.top, GO.bot, b.day);
    // the 2-ring sleeve itself lit to Cyc's level (it is short: the light fills it)
    litSleeve(c, env, GO.x, GO.top, GO.bot, goK);
    pickOut(c, env, MATCH.x, SY - 110, SY + 18, mK * 2.1, 60);
    if (mK > 0.003) {
      // the lamp catches the blackened match lying on the shelf: its whole top edge and its burnt head
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = withAlpha(env.mood.core, 0.9 * Math.min(1, mK));
      c.fillRect(MATCH.x - 32, SY - 4.2, 60, 2);
      const g = c.createRadialGradient(MATCH.x, SY - 6, 0, MATCH.x, SY - 6, 46);
      g.addColorStop(0, withAlpha(mixLab(env.mood.core, env.mood.rim, 0.3), 0.32 * Math.min(1, mK)));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(MATCH.x - 46, SY - 52, 92, 92);
      c.restore();
    }
    textRole(c, 'subject', () => {
      bigTag(c, env, CYC.x + 18, SY - 44, '1984–2023 · 39', cycK * (1 - win(t, b.two - 0.4, b.two)));
      // round-4 r1: each named bar's own base tag, raised the same way (the script's tags: GO 2014, the match JAN 2025)
      bigTag(c, env, GO.x + 18, SY - 44, '2014', goK * (1 - win(t, b.day - 0.4, b.day)));
      bigTag(c, env, MATCH.x + 36, SY - 44, 'JAN 2025', mK * (1 - win(t, b.burn - 0.4, b.burn)));
    });
  });

  // ---- the wide (round-1 revision): the room outside the lamp's pool a stop down, and a haze band in front of the
  //      shelf, so the pool shapes the frame and the shelf sits back in the air
  const wk = wideK(sc.scaleAt(t));
  if (wk > 0.003) {
    roomFalloff(f, cam, wk);
    const sh = toScreen(LAYERS.L4, cam, 1000, SY - 125);
    f.fog({ yCenter: sh.y, height: 190 * sh.k + 40, alpha: 0.12 * wk, drift: 9 });
  }

  // ---- 'burn' (review round 1): the dark sleeves drop a stop and the five still-lit flames swell together (each
  //      inner halo 40 -> 70 px on screen over 0.6 s, then settles), their stub tops catching the light
  const sw = win(t, b.burn - 0.1, b.burn + 0.5) * (1 - 0.65 * win(t, b.burn + 0.9, b.burn + 2.4));
  if (sw > 0.003) {
    const k8 = sc.scaleAt(t);
    f.layer('L4', (c, env) => {
      c.save();
      c.filter = `blur(${(14 * env.pxScale).toFixed(2)}px)`;
      c.fillStyle = withAlpha(env.mood.fg, 0.3 * sw);
      c.fillRect(STUDY.shelf.x - 120, SY - 300, NEW_X - STUDY.shelf.x + 240, 320);
      c.restore();
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (const id of LIVE) {
        const v = view(id);
        const p = candleFlame({ x: X(id), y: SY, view: v, s: STUDY.shelf.s });
        const R = (40 + 30 * Math.min(1, sw * 1.15)) / k8;
        const g = c.createRadialGradient(p.x, p.y - 2, 0, p.x, p.y - 2, R);
        g.addColorStop(0, withAlpha(env.mood.core, 0.5 * sw));
        g.addColorStop(0.35, withAlpha(env.mood.halo, 0.26 * sw));
        g.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = g;
        c.fillRect(p.x - R, p.y - 2 - R, 2 * R, 2 * R);
        // the stub's top lip lifted into the light
        c.fillStyle = withAlpha(env.mood.core, 0.55 * sw);
        c.fillRect(p.x - 9, p.y + 8, 18, 1.6);
      }
      // round-4 r1 (critic): 'still burn': a 0.6 s warm rim round the five LIVE sleeves only (never the dark ones),
      // so the five read as five bars in one colour
      const rimK = win(t, b.burn - 0.1, b.burn + 0.12) * (1 - win(t, b.burn + 0.5, b.burn + 0.85));
      if (rimK > 0.003) {
        const top = SY - 270;
        const col = mixLab(env.mood.halo, env.mood.core, 0.35);
        for (const id of LIVE) {
          const v = view(id);
          const w = v.kind === 'taper' ? 6.5 : 15;
          const h = Math.max(6, Math.max(0, v.rings) * 6);
          c.strokeStyle = withAlpha(col, 0.95 * rimK);
          c.lineWidth = 2.4;
          c.strokeRect(x0(id, w) - 1, top - 1, 2 * w + 2, h + 2);
          c.fillStyle = withAlpha(env.mood.halo, 0.3 * rimK);
          c.fillRect(x0(id, w), top, 2 * w, h);
        }
      }
      c.restore();
    });
  }
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
  // the near plane: the study's heavy curtain edge at frame left (L5, blurred), sliding faster than the board on the
  // pull-back; placed from the wide camera so it never crosses the board's left margin
  nearCurtain(f, sc, sm((0.8 - sc.scaleAt(t)) / 0.14));

  // ---- the end: everything but the dark lantern and the microscope settles a stop down; then the card
  // (lifted while the camera is pushed onto HOW FAR? HOW FAST?, so the card is not in the falloff)
  const onHow = win(t, b.how - 0.05, b.fast + 0.4) * (1 - win(t, b.stamp + 1.2, b.D - 2.0));
  const endK = win(t, b.answers - 0.4, b.answers + 1.6) * (1 - 0.75 * onHow);
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
  fieldPair(f, t, b, sc);
}

/** how 'wide' the camera is: 0 at the board's own framing (scale >= 1), 1 at the shelf wide (scale <= 0.72) */
const wideK = (scale: number) => sm((1 - scale) / 0.28);

/** the room a stop down outside the lamp's pool (screen space; the study window is left alone) */
function roomFalloff(f: Frame, cam: Camera3, k: number) {
  const c = f.c;
  const p = toScreen(LAYERS.L4, cam, 760, 520);
  const w0 = toScreen(LAYERS.L4, cam, STUDY.window.x - 24, STUDY.window.y - 24);
  const w1 = toScreen(LAYERS.L4, cam, STUDY.window.x + STUDY.window.w + 24, STUDY.window.y + STUDY.window.h + 30);
  // a gradient is resolved in the transform at fill time: built in the ellipse's unit space, filled after the scale
  const g = c.createRadialGradient(0, 0, 330 * p.k, 0, 0, 1050 * p.k);
  g.addColorStop(0, withAlpha(f.mood.fg, 0));
  g.addColorStop(0.55, withAlpha(f.mood.fg, 0.32 * k));
  g.addColorStop(1, withAlpha(f.mood.fg, 0.58 * k));
  c.save();
  c.fillStyle = g;
  c.beginPath();
  c.rect(-20, -20, 1320, 760);
  c.rect(w0.x, w0.y, w1.x - w0.x, w1.y - w0.y);
  c.clip('evenodd');
  c.translate(p.x, p.y);
  c.scale(1.35, 1);
  c.fillRect(-1400, -1400, 2800, 2800);
  c.restore();
}

/** the study's curtain edge at frame left on the near plane (L5), placed from the wide camera */
function nearCurtain(f: Frame, sc: Scene, wk: number) {
  if (wk <= 0.01) return;
  const top = toLayer(LAYERS.L5, sc.wide, -40, -60);
  const bot = toLayer(LAYERS.L5, sc.wide, -40, 800);
  const ww = 150;
  // it hangs at the room's edge: in the board's close framings it is beyond frame left; the pull-back draws it in
  const x = top.x + 62 - 900 * (1 - wk);
  f.layer('L5', (c, env) => {
    const W = ww + 140, H = Math.ceil(bot.y - top.y) + 80;
    f.cached(`${ID}/curtain/${env.mood.id}/${Math.round(top.x)},${Math.round(top.y)}`, W, H, (cc) => {
      cc.translate(80, 40 - top.y);
      drapery(cc, { x: 0, top: top.y, bottom: bot.y, w: ww, side: 'left', folds: 5, seed: 11, tieback: top.y + (bot.y - top.y) * 0.62 }, env);
    })(c, x - 80, top.y - 40);
  });
}

/** the study's case drawn through this proxy paints its lettering as TEXTURE (candle sleeves, Wall slips, clue cards
 *  read as pattern here); the shot's own named cards re-mark themselves as subjects inside `extra` */
function textureFrame(f: Frame): Frame {
  return new Proxy(f, {
    get(tg, p) {
      if (p === 'layer') return (spec: Parameters<Frame['layer']>[0], draw: Parameters<Frame['layer']>[1]) => tg.layer(spec, (c, env) => textRole(c, 'texture', () => draw(c, env)));
      const v = Reflect.get(tg, p, tg);
      return typeof v === 'function' ? v.bind(tg) : v;
    },
  });
}

/** round-2 note: the open question belongs to the whole field, not one lab. Round-1 revision: one hard-edged cut-paper
 *  card (dark mount board, a 1 px rim on its top edge) stands on the tray at the back, leaning on the board below-left
 *  of the dark lantern, so no lettering ever sits over bare lanterns. Its label comes FIRST ('the field, 2019–2025', on
 *  'answers'), then the two attributions 0.35 s apart: the microscope-limit quote [e14-anthropic-releases] and Jain &
 *  Wallace's 2019 paper title [e10-attention-explanation]. From 36.6 it dims ~30% so the eye goes to the case file. */
/** round 4: the card's second place, for the pull-back to the dark lantern: ~0.85 of its size (380 wide, re-wrapped at
 *  the legibility floor of the end framing; its height from its lines) and, on screen, its top-right corner ~50 px
 *  down-left of where it stood, so its top edge sits under the dark lantern's tassel and the lanterns above it; it still
 *  stands on the tray (clear of LEARNING at its left and of the fallen WHO TAUGHT IT? card below it) */
const FIELD_B = { x0: 279, x1: 659, y1: 647 };
/** how far it slides out left while the camera is pushed onto HOW FAR? HOW FAST? (out of frame at the 1.25x push, so
 *  its layout changes unseen) */
const FIELD_OUT = 400;
const FIELD_QUOTES: [string, string][] = [
  ['satisfying insight for about a quarter of the prompts we’ve tried', 'anthropic, 2025'],
  ['Attention is not Explanation', 'jain & wallace, 2019'],
];
function fieldPair(f: Frame, t: number, b: B, sc: Scene) {
  const A = win(t, b.answers - 0.05, b.answers + 0.4);
  if (A <= 0.003) return;
  const k1 = win(t, b.answers + 0.3, b.answers + 0.7);
  const k2 = win(t, b.answers + 0.65, b.answers + 1.05);
  // round 4: out left with the push on 'stays'; back in (smaller, lower, left) with the pull-back after the stamp
  const second = t >= b.stamp + 1.2;
  const inAt = b.stamp + 1.3, inEnd = b.D - 1.8;
  const away = second ? 1 - sm((t - inAt) / (inEnd - inAt)) : sm((t - (b.file + 0.05)) / (b.stays + 0.14 - (b.file + 0.05)));
  const slide = -FIELD_OUT * away;
  // it fades with the slide (card and words together), so no half-cut line of type rides across the frame edge
  const gone = sm(away / 0.55);
  if (slide <= -FIELD_OUT + 0.5) return;
  // dims ~30 % for the case file; in its second place a stop under the dark lantern
  const dim = second ? 0.8 : 1 - 0.3 * win(t, b.file - 0.6, b.file - 0.1);
  // its type is set for the END framing from the start of the pull-back, so nothing re-wraps while the camera moves
  const grow = second ? sc.scaleAt(t) / sc.scaleAt(b.D) : 1;
  f.layer('L4', (c, env) => {
    const m = env.mood;
    const fit = (font: (s: number) => string, base: number, text = 'H') => {
      const s0 = legibleSize(c, font(base), base, text);
      if (grow <= 1.0001) return s0;
      const capEnd = capPx1080(c, font(base), text) / grow;
      return Math.max(s0, Math.ceil(((base * 22.3) / capEnd) * 10) / 10);
    };
    const ls = fit((s) => `500 ${s}px ${FONT.sc}`, 19, 'THE FIELD, 2019–2025');
    const qs = fit((s) => `italic 400 ${s}px ${FONT.text}`, 21);
    const as = fit((s) => `500 ${s}px ${FONT.sc}`, 17, 'anthropic');
    const qf = `italic 400 ${qs}px ${FONT.text}`;
    const af = `500 ${as}px ${FONT.sc}`;
    const lh = qs * 1.24;
    const x0 = second ? FIELD_B.x0 : END_CARD.x0, x1 = second ? FIELD_B.x1 : END_CARD.x1;
    const maxW = x1 - x0 - (second ? 50 : 56);
    const wrapped = FIELD_QUOTES.map(([q]) => wrapLines(c, q, qf, maxW, 46));
    const H = 12 + ls + 8 + wrapped.reduce((n, l) => n + l.length * lh + as + 12, 0) + (second ? 12 : 18);
    const R = second ? { x0, x1, y0: FIELD_B.y1 - H, y1: FIELD_B.y1 } : END_CARD;
    c.save();
    c.translate(slide, (1 - A) * 20);
    const Ag = A * (1 - gone);
    c.globalAlpha = Ag;
    // the card, lifted off the cork by a soft shadow
    c.save();
    c.shadowColor = withAlpha(m.ink, 0.6);
    c.shadowBlur = 9 * env.pxScale;
    c.shadowOffsetY = 4 * env.pxScale;
    c.fillStyle = mixLab(m.ink, m.set, 0.2);
    c.beginPath();
    c.moveTo(R.x0 + 3, R.y0);
    c.lineTo(R.x1 - 1, R.y0 + 1);
    c.lineTo(R.x1, R.y1);
    c.lineTo(R.x0, R.y1);
    c.closePath();
    c.fill();
    c.restore();
    c.fillStyle = withAlpha(m.rim, 0.75);
    c.fillRect(R.x0 + 3, R.y0 - 0.5, R.x1 - R.x0 - 4, 1);
    const X0 = R.x0 + (second ? 26 : 30);
    textRole(c, 'subject', () => {
      // the label
      c.globalAlpha = Ag * 0.95 * dim;
      c.fillStyle = mixLab(m.core, m.halo, 0.35);
      const label = 'THE FIELD, 2019–2025';
      let y = R.y0 + 12 + ls;
      const lw = drawTracked(c, label, X0, y, { font: `500 ${ls}px ${FONT.sc}`, size: ls, tracking: 0.15, align: 'left' });
      c.globalAlpha = Ag * 0.5 * dim;
      c.fillRect(X0, y + 8, lw, 1);
      // the two attributions
      y += 8;
      const group = (lines: string[], who: string, k: number) => {
        c.font = qf;
        c.textAlign = 'left';
        c.letterSpacing = '0px';
        lines.forEach((ln, i) => {
          y += lh;
          c.globalAlpha = Ag * k * dim;
          c.fillStyle = textColor(m);
          c.fillText((i === 0 ? '“' : '') + ln + (i === lines.length - 1 ? '”' : ''), X0 - (i === 0 ? qs * 0.42 : 0), y - (1 - k) * 3);
        });
        y += as + 8;
        c.globalAlpha = Ag * k * 0.9 * dim;
        c.fillStyle = titleColor(m);
        // the attribution fits the card: its tracking (0.14 em at most) and its dash give way on the narrower card
        c.font = af;
        c.letterSpacing = '0px';
        const room = R.x1 - X0 - 12;
        const bare = c.measureText(who).width;
        const dash = bare + 24 + 0.04 * as * (who.length - 1) <= room;
        const ax = dash ? X0 + 24 : X0;
        const tr = Math.max(0, Math.min(0.14, (R.x1 - ax - 12 - bare) / (as * Math.max(1, who.length - 1))));
        if (dash) c.fillRect(X0, y - as * 0.32, 16, 0.9);
        drawTracked(c, who, ax, y, { font: af, size: as, tracking: tr, align: 'left' });
        y += 4;
      };
      group(wrapped[0], FIELD_QUOTES[0][1], k1);
      group(wrapped[1], FIELD_QUOTES[1][1], k2);
    });
    c.restore();
  });
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
    // round-1: a thicker core and a wider halo, so 'threads of light' read at a glance at the 2.15x push
    for (const [lw, al] of [[9, 0.08], [3, 0.26], [1.6, 0.75]] as const) {
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
      // DATA and FIRE are named ('data, fire'): read as subjects; the rest of the clue lettering is board texture
      const named = n.id === 'C3-a' || n.id === 'C3-b';
      textRole(c, named ? 'subject' : 'texture', () =>
        drawCard(c, S, { x: n.x, y, k, light: cardLight(n.id as SlotId), alpha: 1 - sw, lit: !!BS.cards.find((q) => q.id === n.id)?.lit }, env),
      );
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
/** WHO TAUGHT IT?: pinned at the centre until 'network', then it drops from its pin, turning, straight down into the
 *  lamp's pool, and comes to rest lying flat on the board's tray (seen almost edge-on from here) */
function kCard(c: C, env: PaintEnv, tq: number, b: B) {
  const S = SLOTS.K;
  const p = W('K');
  const u = clamp01((tq - b.net) / 1.25);
  const fall = u * u;
  const x = lerp(p.x, K_REST.x, sm(u)) + 14 * Math.sin(u * 6.5) * u * (1 - u);
  const y = lerp(p.y, K_REST.y, fall);
  // it turns as it falls, then settles flat: rotation back to 0 and the face foreshortened onto the tray
  const land = sm((u - 0.7) / 0.3);
  const rot = (0.55 * Math.sin(u * 3.2) + 0.12 * Math.sin(u * 9)) * (1 - land);
  const sy = lerp(1, K_REST.flat, land);
  const light = Math.min(1, cardLight('K') + 0.1) * lerp(1, 0.55, land);
  textRole(c, sy > 0.6 ? 'subject' : 'texture', () => {
    c.save();
    c.translate(x, y);
    c.scale(1, sy);
    drawCard(c, S, { x: 0, y: 0, k: 1, light, rot, pin: u <= 0 }, env);
    c.restore();
  });
  if (land > 0.5) {
    // its front edge catches the lamp where it lies
    c.fillStyle = withAlpha(env.mood.rim, 0.45 * land);
    c.fillRect(x - S.w / 2, y + (S.h / 2) * sy - 0.6, S.w, 1.2);
  }
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
  const K = Q4.K;
  drawCard(c, { id: 'Q-Q4', w: Q4.w / K, h: Q4.h / K, icon: 'question', text: Q4.text }, { x: 0, y: Q4.top - Q4.clipY + drop + Q4.h / 2, k: K, light: 0.75, pin: false }, env);
  c.restore();
}
/** HOW FAR? HOW FAST? (ch13-s01's second question, review round 3): it drops a short way onto the question thread on
 *  'And', card and question fading in together (the kit's card-entry rule), sways slightly, and on 'stays open' is
 *  stamped STATUS: OPEN in its clear lower band: ch14-s07's stamp (desaturated oxblood at 70 %, a small press-in) */
function howFarCard(c: C, env: PaintEnv, t: number, b: B) {
  const u = clamp01((t - (b.and - 0.25)) / 0.55);
  if (u <= 0.003) return;
  const tq = tq12(t);
  const over = u < 0.7 ? sm(u / 0.7) * 1.06 : 1.06 - 0.06 * sm((u - 0.7) / 0.3);
  const drop = (over - 1) * 40;
  // the strike knocks the hanging card: a small swing on its pin that dies away (on the twos)
  const kick = tq >= b.stamp ? 0.016 * Math.exp(-(tq - b.stamp) * 3.2) * Math.sin((tq - b.stamp) * 9) : 0;
  const sway = kick + 0.028 * Math.sin((tq - b.and) * 1.1 + 1.2) * (0.5 + 0.5 * Math.exp(-(tq - b.and) * 0.4));
  const top = HF.top + drop;
  const cy = top + HF.h / 2;
  const fade = sm(u / 0.45);
  c.save();
  c.globalAlpha *= fade;
  c.translate(HF.x, HF.clipY);
  c.rotate(sway);
  c.translate(-HF.x, -HF.clipY);
  // the oxblood thread from the question thread down to the pin
  c.strokeStyle = oxblood(env, 0.15);
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(HF.x, HF.clipY);
  c.lineTo(HF.x, top + 6);
  c.stroke();
  // the card stock, as the case board's cards (a soft shadow, a lamp rim on the top edge)
  // the same card stock and lamp light as the question card beside it (never brighter: the lamp is the light)
  const light = 0.6 + 0.12 * win(t, b.how - 0.1, b.fast + 0.4);
  const paper = paperTone(env, light);
  c.fillStyle = withAlpha(env.mood.fg, 0.35);
  c.fillRect(HF.x - HF.w / 2 + 3, top + 4, HF.w, HF.h);
  c.fillStyle = paper;
  c.fillRect(HF.x - HF.w / 2, top, HF.w, HF.h);
  cardProbe(c, 'howFarCard', HF.x - HF.w / 2, top, HF.w, HF.h, fade, fade);
  c.fillStyle = withAlpha(env.mood.rim, 0.28 * light);
  c.fillRect(HF.x - HF.w / 2, top, HF.w, 1.4);
  const ink = mixLab(env.mood.ink, paper, 0.08);
  // the two questions on two lines (the box is narrow enough that 'HOW FAR?' breaks before the second 'HOW')
  textRole(c, 'subject', () => typedText(c, HF.text, HF.x, top + HF.h * 0.38, 160, HF.h * 0.52, ink, 28));
  // STATUS: OPEN struck on 'open' (review round 4): ch15-s09's stamp (the same red, the same on-screen size) in the
  // card's clear lower band; ghostOk: a stamp on a card is a deliberate overlap
  ghostOk(c, () => textRole(c, 'subject', () => stampOpen(c, env, t - b.stamp + 1 / 48, HF.x, top + HF.h * 0.8, paper)));
  // the brass pin
  c.fillStyle = mixLab(env.mood.halo, env.mood.set, 0.35);
  c.beginPath();
  c.arc(HF.x, top + 7, 4.4, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
/** ch15-s09's STATUS: OPEN stamp (its #b3261e red at 90 %, a heavy outer rule and a fine inner one, typewriter capitals,
 *  dry flecks; wet a shade darker for 0.6 s), struck in one frame at dt = 0 with a 3-frame press, centred at (x, y) */
function stampOpen(c: C, env: PaintEnv, dt: number, x: number, y: number, paper: string) {
  if (dt < 0) return;
  const press = 1 + 0.07 * (1 - clamp01(dt / (3 / 24)));
  const wet = Math.max(0, 1 - dt / 0.6);
  const red = wet > 0 ? mixLab(STAMP.red, STAMP.wet, 0.35 * wet) : STAMP.red;
  c.save();
  c.translate(x, y);
  c.rotate(-0.035);
  c.scale(press, press);
  c.globalAlpha *= 0.9;
  c.strokeStyle = red;
  c.fillStyle = red;
  const bw = STAMP.w, bh = STAMP.h;
  c.lineWidth = STAMP.rule;
  c.strokeRect(-bw / 2, -bh / 2, bw, bh);
  c.lineWidth = STAMP.inner;
  c.strokeRect(-bw / 2 + 4.5, -bh / 2 + 4.5, bw - 9, bh - 9);
  const fs = legibleSize(c, `400 ${STAMP.fs}px ${FONT.typewriter}`, STAMP.fs, 'STATUS: OPEN');
  c.font = `400 ${fs}px ${FONT.typewriter}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('STATUS: OPEN', 0, 1);
  // the stamp's uneven inking: dry flecks where the rubber missed (the card's own paper showing through)
  c.fillStyle = paper;
  for (let i = 0; i < 34; i++) {
    c.globalAlpha = 0.45;
    c.fillRect((hash1(i, 81) * 0.5) * bw, (hash1(i, 82) * 0.5) * bh, 1.6 + 1.6 * (hash1(i, 83) * 0.5 + 0.5), 1.2);
  }
  void env;
  c.restore();
}

/** the board's tray under its lower right (its top seen from just above), and the brass microscope standing on it,
 *  tipped toward the dark lantern */
function ledgeAndMicroscope(c: C, env: PaintEnv, t: number, b: B) {
  const top = LEDGE.y - LEDGE.depth;
  // the top surface, foreshortened, warmer toward the lamp's pool (left) and dark where it meets the board
  c.fillStyle = mixLab(env.fill('ink'), env.mood.set, 0.42);
  c.beginPath();
  c.moveTo(LEDGE.x0 + 10, top);
  c.lineTo(LEDGE.x1 - 4, top);
  c.lineTo(LEDGE.x1, LEDGE.y);
  c.lineTo(LEDGE.x0, LEDGE.y);
  c.closePath();
  c.fill();
  const wash = c.createLinearGradient(LEDGE.x0, 0, LEDGE.x1, 0);
  wash.addColorStop(0, withAlpha(env.mood.halo, 0.05));
  wash.addColorStop(0.35, withAlpha(env.mood.halo, 0.16));
  wash.addColorStop(1, withAlpha(env.mood.halo, 0.02));
  c.fillStyle = wash;
  c.fill();
  c.fillStyle = withAlpha(env.mood.fg, 0.7);
  c.fillRect(LEDGE.x0 + 10, top, LEDGE.x1 - LEDGE.x0 - 14, 2);
  // the front lip
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
  c.fillStyle = withAlpha(env.mood.rim, 0.45);
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

/** the manila case file lying on the tray. On 'file' (36.9 -> 37.4, on the twos) its cover lifts about the back
 *  edge and comes to lean on the board: a blank sheet on top, in the lamp's pool. Projected from just above: the
 *  folder's real depth (110) shows as d = 21 on the tray; a raised cover shows almost its full height. */
function caseFile(c: C, env: PaintEnv, t: number, b: B) {
  const { x0, w: Wd, front: F, d } = FILE;
  const DR = 96;
  const tq = tq12(t);
  const u = clamp01((tq - (b.file - 0.29)) / 0.5);
  const th = ((Math.PI * 112) / 180) * sm(u);
  const manila = mixLab(env.mood.halo, '#b08a52', 0.35);
  const out = mixLab(manila, env.mood.set, 0.38);
  const inside = mixLab(manila, env.mood.set, 0.3);
  const paper = mixLab(env.mood.core, env.mood.halo, 0.3);
  const back = F - d;
  // the lamp's pool gathering on it (from 36.6)
  const pool = win(t, b.file - 0.6, b.file + 0.3);
  // its soft shadow on the tray
  c.fillStyle = withAlpha(env.mood.fg, 0.4);
  c.fillRect(x0 + 4, F - d + 3, Wd, d);
  // the back cover (the folder's body), its front edge's thickness, the tab at the back
  const trap = (y0: number, y1: number, ins: number) => {
    c.beginPath();
    c.moveTo(x0 + ins, y0);
    c.lineTo(x0 + Wd - ins, y0);
    c.lineTo(x0 + Wd, y1);
    c.lineTo(x0, y1);
    c.closePath();
  };
  c.fillStyle = mixLab(out, env.mood.fg, 0.25);
  c.fillRect(x0, F, Wd, 3);
  c.fillStyle = out;
  trap(back, F, 4);
  c.fill();
  c.fillRect(x0 + 16, back - 4, 40, 5);
  // the file's papers on the back cover (seen nearly edge-on): a typed sheet, a step under the cards' paper
  if (th > 0.01) {
    c.fillStyle = mixLab(paper, env.mood.set, 0.3 - 0.12 * pool);
    trap(back + 3, F - 2, 9);
    c.fill();
    c.fillStyle = withAlpha(env.mood.ink, 0.3);
    for (let i = 0; i < 3; i++) c.fillRect(x0 + 16 + 4 * i, back + 7 + i * 4, Wd - 44 - 18 * hash1(i, 61), 0.9);
  }
  // the cover: hinge at the back edge; free edge at (depth DR cos th toward the front, height DR sin th)
  const fy = back + DR * 0.19 * Math.cos(th) - DR * 0.98 * Math.sin(th);
  // round-4 r1 (critic): the cover's OUTSIDE, seen while it rises, is dull manila a step under every card (never a lit
  // blank), and it carries its typed label (CASE FILE) from the first frame it is visible
  const face = th < Math.PI / 2 ? (th < 0.02 ? out : mixLab(out, env.mood.set, 0.32)) : inside;
  c.fillStyle = face;
  c.beginPath();
  c.moveTo(x0 + 4, back);
  c.lineTo(x0 + Wd - 4, back);
  c.lineTo(x0 + Wd, fy);
  c.lineTo(x0, fy);
  c.closePath();
  c.fill();
  if (th >= 0.02 && th < Math.PI / 2 && back - fy > 6) coverLabel(c, env, x0, fy, Wd, back - fy);
  if (th > Math.PI / 2) {
    // the open cover's inside: the tab at its top edge, a crease along the hinge, the lamp falling off toward the top
    c.fillRect(x0 + Wd - 58, fy - 6, 40, 7);
    // review round 4: the page clipped inside it is PRINTED (it read as the brightest blank in frame)
    // round-4 r1 (critic): the page is printed from the first frame it shows (no fade-in of a blank sheet)
    casePage(c, env, x0, fy, Wd, back - fy, 1);
    const sh = c.createLinearGradient(0, fy, 0, back);
    sh.addColorStop(0, withAlpha(env.mood.fg, 0.32));
    sh.addColorStop(1, withAlpha(env.mood.fg, 0));
    c.fillStyle = sh;
    c.fillRect(x0, fy, Wd, back - fy);
    c.fillStyle = withAlpha(env.mood.fg, 0.5);
    c.fillRect(x0 + 4, back - 2, Wd - 8, 2);
  }
  // 1 px rims where the lamp catches: the cover's free edge, the folder's front edge
  c.fillStyle = withAlpha(env.mood.rim, 0.55);
  c.fillRect(x0, Math.min(fy, back) - 0.6, Wd, 1.2);
  c.fillRect(x0, F - 0.6, Wd, 1.2);
  if (pool > 0.003) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const cx = x0 + Wd / 2, cy = F - 30;
    const g = c.createRadialGradient(cx, cy, 10, cx, cy, 190);
    g.addColorStop(0, withAlpha(mixLab(env.mood.core, env.mood.halo, 0.5), 0.12 * pool));
    g.addColorStop(0.5, withAlpha(env.mood.halo, 0.05 * pool));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(cx - 190, cy - 190, 380, 380);
    c.restore();
  }
}

/** the case file's cover label (round-4 r1): a typed paper label on the rising cover's outside, foreshortened with it
 *  (x0, top, w, h: the cover's projected quad), CASE FILE inked at the same moment as its paper */
function coverLabel(c: C, env: PaintEnv, x0: number, top: number, w: number, h: number) {
  const m = env.mood;
  const fh = h / 98;
  const lw = w * 0.7, lh = 30;
  const lx = x0 + (w - lw) / 2;
  const ly = top + h * 0.22;
  const label = paperTone(env, 0.3);
  c.save();
  c.translate(0, ly);
  c.scale(1, fh);
  c.fillStyle = label;
  c.fillRect(lx, 0, lw, lh);
  cardProbe(c, `${ID}/coverLabel`, lx, 0, lw, lh, 1, 1);
  textRole(c, 'texture', () => {
    c.fillStyle = mixLab(m.ink, label, 0.12);
    c.font = `400 15px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('CASE FILE', lx + lw / 2, lh / 2 + 1);
  });
  // the cover's own printed form under the label: NO. / OPENED rules, inked with it
  c.fillStyle = withAlpha(mixLab(m.ink, label, 0.2), 0.5);
  for (let i = 0; i < 3; i++) c.fillRect(lx + 4, lh + 16 + i * 14, lw - 8 - 22 * i, 1.1);
  c.restore();
}

/** the case file's page (review round 4), inside the raised cover (x0, top, w, h): a sheet a step UNDER the cards'
 *  paper with a typed CASE FILE header and its rule, faint ruled lines carrying a few typed lines, and the WHO TAUGHT IT?
 *  slip clipped to it with a wire paper clip, its typing at ~60 % ink. Paper with writing, never a lit blank. */
function casePage(c: C, env: PaintEnv, x0: number, top: number, w: number, h: number, k: number) {
  if (k <= 0.01 || h < 30) return;
  const m = env.mood;
  const px = x0 + 7, py = top + 6, pw = w - 14, ph = h - 11;
  const sheet = paperTone(env, 0.36);
  const ink = mixLab(m.ink, sheet, 0.12);
  c.save();
  c.globalAlpha *= k;
  c.fillStyle = withAlpha(m.fg, 0.3);
  c.fillRect(px + 2, py + 2, pw, ph);
  c.fillStyle = sheet;
  c.fillRect(px, py, pw, ph);
  // round-4 r1: the page and its typing arrive in the same frame (the cards audit sees both)
  cardProbe(c, `${ID}/casePage`, px, py, pw, ph, k, k);
  // the header, typed (read: at the legibility floor), and its rule
  const hs = legibleSize(c, `400 15px ${FONT.typewriter}`, 15, 'CASE FILE');
  const hy = py + 5 + hs * 0.72;
  textRole(c, 'subject', () => {
    c.fillStyle = ink;
    c.font = `400 ${hs}px ${FONT.typewriter}`;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillText('CASE FILE', px + 8, hy);
  });
  c.fillStyle = withAlpha(ink, 0.7);
  c.fillRect(px + 8, hy + 4, pw - 16, 1);
  // ruled lines, most carrying a typed line (texture: short dark strokes, word-broken)
  for (let i = 0, y = hy + 12; y < py + ph - 4; i++, y += 7.5) {
    c.fillStyle = withAlpha(m.set, 0.35);
    c.fillRect(px + 4, y + 1.6, pw - 8, 0.6);
    if (i % 4 === 3) continue;
    c.fillStyle = withAlpha(ink, 0.42);
    let x = px + 8;
    const end = px + pw - 12 - 26 * (hash1(i, 71) * 0.5 + 0.5);
    for (let j = 0; x < end; j++) {
      const ww = 6 + 14 * (hash1(i * 13 + j, 72) * 0.5 + 0.5);
      c.fillRect(x, y - 1.6, Math.min(ww, end - x), 2.2);
      x += ww + 3.2;
    }
  }
  // the slip, clipped at the lower right, a hair askew
  const sw = Math.min(pw * 0.62, 92), sh = 30;
  c.save();
  c.translate(px + pw - sw / 2 - 5, py + ph - sh / 2 - 4);
  c.rotate(-0.05);
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(-sw / 2 + 1.5, -sh / 2 + 2, sw, sh);
  const slip = paperTone(env, 0.5);
  c.fillStyle = slip;
  c.fillRect(-sw / 2, -sh / 2, sw, sh);
  textRole(c, 'texture', () => {
    c.globalAlpha *= 0.6;
    c.fillStyle = mixLab(m.ink, slip, 0.1);
    c.font = `400 9.5px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('WHO TAUGHT IT?', 0, 2);
  });
  // the wire clip over its top edge
  c.strokeStyle = withAlpha(mixLab(m.rim, m.haze, 0.4), 0.85);
  c.lineWidth = 1.1;
  c.beginPath();
  c.roundRect(-sw / 2 + 10, -sh / 2 - 6, 7, 17, 3.5);
  c.roundRect(-sw / 2 + 11.8, -sh / 2 - 3.5, 3.4, 11, 1.7);
  c.stroke();
  c.restore();
  c.restore();
}

// ------------------------------------------------------------------------------------------------ the shelf
/** a rim of light running up a sleeve's two edges (stub to lit height) in 0.8 s, then staying faintly */
function sleeveRim(c: C, env: PaintEnv, t: number, t0: number, x: number, w: number, top: number, bot: number, restBy = Infinity) {
  if (t < t0 || t >= restBy) return;
  const u = clamp01((t - t0) / 0.8);
  // round-4 r1: back to rest (off) by the next named word
  const after = (1 - 0.6 * win(t, t0 + 1.0, t0 + 2.0)) * (1 - win(t, restBy - 0.55, restBy - 0.05));
  const head = lerp(bot, top, sm(u));
  const x0 = x - w, x1 = x + w;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const col = mixLab(env.mood.core, env.mood.rim, 0.35);
  c.strokeStyle = withAlpha(col, 0.85 * after);
  c.lineWidth = 2;
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
/** round-4 r1: a short sleeve lit through by the lamp (additive fill, world coords), at the level Cyc's ghost bar reads */
const x0 = (id: string, w: number) => X(id) - w;
function litSleeve(c: C, env: PaintEnv, x: number, top: number, bot: number, k: number) {
  if (k <= 0.003) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = withAlpha(mixLab(env.mood.core, env.mood.halo, 0.3), 0.55 * Math.min(1, k));
  c.fillRect(x - 15, top, 30, Math.max(6, bot - top));
  const g = c.createRadialGradient(x, top + 6, 0, x, top + 6, 70);
  g.addColorStop(0, withAlpha(env.mood.core, 0.22 * Math.min(1, k)));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - 70, top - 64, 140, 140);
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
/** a light bar the common width (half-width 15) standing behind a thin sleeve, so a taper's length reads as a bar */
function ghostBar(c: C, env: PaintEnv, x: number, top: number, bot: number, a: number) {
  if (a <= 0.003) return;
  const paper = mixLab(mixLab(env.mood.setHaze, env.mood.core, 0.55), env.mood.halo, 0.2);
  c.save();
  c.fillStyle = withAlpha(paper, a);
  c.fillRect(x - 15, top, 30, bot - top);
  c.strokeStyle = withAlpha(env.mood.core, Math.min(1, a * 1.6));
  c.lineWidth = 1;
  c.strokeRect(x - 15 + 0.5, top + 0.5, 29, bot - top - 1);
  c.restore();
}
/** b6–b9: the shelf a stop down everywhere but around the candle being named (normal blend, world coords) */
function shelfDimming(c: C, env: PaintEnv, k: number, fx: number, hw: number) {
  if (k <= 0.003) return;
  c.save();
  c.filter = `blur(${(18 * env.pxScale).toFixed(2)}px)`;
  c.fillStyle = withAlpha(env.mood.fg, 0.55 * k);
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
  // the tag is read ('1984–2023 · 39'): its lettering at the 22 px cap floor in the shelf wide
  const size = legibleSize(c, `400 30px ${FONT.typewriter}`, 30, text);
  c.font = `400 ${size}px ${FONT.typewriter}`;
  const tw = c.measureText(text).width + 26;
  const th = size * 1.45;
  c.translate(x, y);
  c.rotate(0.05 * (1 - Math.min(1, k)));
  c.strokeStyle = withAlpha(env.mood.rim, 0.6);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(-14, 26);
  c.lineTo(4, 0);
  c.stroke();
  // review round 1: read on 'forty': a dark tag on a soft plate, its lettering inked in the rim colour (the grey
  // paper tag at ~35 % contrast did not read over the sleeves)
  softPlate(c, 4 + tw / 2, 0, tw + 90, th + 50, env.mood.ink, 0.7);
  const paper = mixLab(env.mood.ink, env.mood.fg, 0.35);
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
  c.strokeStyle = withAlpha(env.mood.rim, 0.55);
  c.lineWidth = 1;
  c.stroke();
  c.fillStyle = mixLab(env.mood.rim, env.mood.core, 0.35);
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
