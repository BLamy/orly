/**
 * ch06-s05 — the 1995 bet: two wagers, three signatures, and a question card for the board
 * (duskRose at Bell Labs → candleAmber in the study, cut in, 24.9 s; re-narrated 2026-10-12: both men are named).
 *
 * CAMERA: SIDE (the table) → TOP-DOWN on the typed sheet (a detective's slow read, one bet at a time) → BOARD (Q2).
 *   0 → 'each'     Bell Labs, an evening office: a window wall onto the dusk, a pendant lamp over a small table. Three
 *                  seated: Vapnik (left), Jackel (right) and, set back behind the table, LeCun, the witness. Place stamp
 *                  on 'Bell Labs'. On 'signed' Vapnik passes the fountain pen across to Jackel; on 'fancy dinner' the
 *                  two wine glasses set out for the dinners to come catch the lamp.
 *   'Larry'        in-shot dissolve to top-down on the typed sheet under the lamp (both bets, a row of asterisks between
 *                  them: the typed text is texture until the camera reads it). The camera leans in on bet 1 so it reads
 *                  at its true typed size (≥ 22 px cap at 1080p) and the bet's ink comes up; name card Larry Jackel.
 *                  As the narrator says each key word, the lamp warms that word on the paper and it stays marked:
 *                  Jackel · bets · 2000 · understand · why · big neural nets working.
 *   'Vladimir'     the camera reads down to bet 2 (Jackel's bet stays legible above, read): Vapnik · bets · 2005; the
 *                  quote slip lifts off the sheet to the upper right (verbatim, early, so it can be read).
 *   'no' → 'mind'  the narrator's pen underlines the phrase on the sheet as it is spoken; the slip's underline grows
 *                  with it; then use · nets · like those.
 *   sign           the camera drifts down to the signature lines: V. Vapnik, L. Jackel, Witnessed by Y. LeCun, each
 *                  3/14/95, write themselves in, one after another, in blue-black fountain-pen ink.
 *   'paid'         in-shot dissolve to the study (tint-crossfade duskRose → candleAmber): the signed sheet flies to the
 *                  case board and hangs pinned below the oxblood thread (ch07-s01 finds it there); the hands pin a new
 *                  card at Q2 on the thread, WHO PAID FOR DINNER?, and it sways a little. The quote slip stays.
 *
 * TEXT: the quote slip and the Q2 card (two items); the name card and the place stamp are cards/stamps; the typed
 * sheet is the document itself (verbatim, research/quotes.json q-bet-jackel / q-bet-vapnik).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose } from '../../../film';
import { CAMERA3_HOME, FONT, LAYERS, MOODS, PUPPET_NEAR_BLACK, bankersLamp, envelope, legibleSize, POSES, blendPose, defineShot, forestBand, mixLab, overscan, placeStamp, pose, softPlate, textColor, toLayer, toScreen, withAlpha, withLife } from '../../../film';
import { cast, hands } from '../cast';
import { STUDY, studyCase, studyRoom } from '../sets/study';
import { BOARD, Q_SLOTS, boardStateAt } from '../sets/studyState';
import { DEFAULT_POOL, drawCard, oxblood, poolAt } from '../sets/caseBoard';
import { nameCardLg } from '../sets/ch02-s01-nameCardLg';
import { chairBack } from '../sets/occluders';
import { BET, betSheet, wineGlasses } from '../sets/ch07-s01-betSheet';
import { clamp01, camPath, easeIO, h01, inkVeil, lerp, mixCam, screenPass, sm, tq12, win } from '../sets/ch06-s01-kit';
import {
  PEN_PUPPETS, PHRASE_FONT, SHEET, TYPE_TEXTURE_A, fountainPen, layoutSheet, paintSheet, pendantLamp, sheetInk, sideChair, signature, wineGlass, wineGlassTop, type SheetLayout, type WordBox,
} from '../sets/ch06-s05-bet';

type C = CanvasRenderingContext2D;
type P = { x: number; y: number };
const ID = 'ch06-s05';

// =============================================================================================== SIDE (Bell Labs)
const FY = 640;
const TABLE = { x0: 548, x1: 742, y: FY - 170 };
const VAP = { x: 476 };
const JAC = { x: 814 };
/** LeCun sits BEHIND the table, centred under the lamp (a step back: the tablecloth hides him below the chest) */
const LEC = { x: 652, s: 0.95, lift: 44 };
const LAMP = { x: 645, y: 288 };
/** the two glasses, set out for the dinners to come (both against the window light, clear of every figure) */
const GLASSES = [584, 712];
const SV0: Camera3 = { x: 642, y: 424, z: 270, lens: 1 };
const SV1: Camera3 = { x: 650, y: 430, z: 340, lens: 1 };
const SIDE_CAMS = [SV0, SV1];
const SITP = POSES.sit.angles;
/** seated, reaching across the table (the near hand pinches the pen) */
const REACH: Pose = pose({ ...SITP, torso: 12, neck: -2, head: 4, shoulderF: 66, elbowF: 14, wristF: -14 }, { handF: 'pinch' });
const SIT_HOLD: Pose = pose({ ...SITP, torso: 5, shoulderF: 30, elbowF: 70, wristF: -6 }, { handF: 'pinch' });
/** Jackel bends to sign (the near hand, pinching the pen, down on the sheet) */
const SIGN: Pose = pose({ ...SITP, torso: 14, neck: 2, head: 8, shoulderF: 50, elbowF: 36, wristF: -18 }, { handF: 'pinch' });
const SIT_REST: Pose = pose({ ...SITP, torso: 4, head: 2, shoulderF: 24, elbowF: 64, wristF: 0 }, { handF: 'relaxed' });
const WITNESS: Pose = pose({ ...SITP, torso: 3, neck: 4, head: -4, shoulderF: 26, elbowF: 70, wristF: 4 }, { handF: 'relaxed' });
const WITNESS_TURN: Pose = pose({ ...SITP, torso: 3, neck: 6, head: 4, shoulderF: 26, elbowF: 70, wristF: 4 }, { handF: 'relaxed' });

// =============================================================================================== TOP-DOWN (the sheet)
/** the whole sheet under the lamp (the first top-down frame) */
const TD0: Camera3 = { x: 702, y: 330, z: 40, lens: 1 };
/** reading scale: k = 1000 / (1000 − z) ≈ 2.33 at L4, so the 15 px typed face reads at ≈ 24 px cap height at 1080p */
const ZR = 571;
/** the signature lines (a touch wider: bet 2's last line stays in view above them) */
const ZS = 480;
const TD_SAFE: Camera3[] = [TD0, { x: 560, y: 260, z: ZR, lens: 1 }, { x: 560, y: 560, z: ZR, lens: 1 }, { x: 560, y: 640, z: ZS, lens: 1 }];
/** the camera that puts L4 world point (wx, wy) at screen (sx, sy) at depth z */
function camAt(z: number, wx: number, wy: number, sx: number, sy: number): Camera3 {
  const base: Camera3 = { x: CAMERA3_HOME.x, y: CAMERA3_HOME.y, z, lens: 1 };
  const p0 = toScreen(LAYERS.L4, base, wx, wy);
  const px = toScreen(LAYERS.L4, { ...base, x: base.x + 1 }, wx, wy);
  const py = toScreen(LAYERS.L4, { ...base, y: base.y + 1 }, wx, wy);
  return { x: base.x + (sx - p0.x) / (px.x - p0.x), y: base.y + (sy - p0.y) / (py.y - p0.y), z, lens: 1 };
}
/** the pendant shade between the camera and the table (L6): top-left in the first top-down frame */
const SHADE = toLayer(LAYERS.L6, TD0, 30, 14);

// =============================================================================================== BOARD (the study)
const BK = STUDY.board;
const sagAt = (bx: number) => BK.y + BOARD.threadY * BK.k + Math.sin(((bx - 40) / 920) * Math.PI) * 10 * BK.k;
const Q2X = Q_SLOTS.Q2;
const Q_CLIP = { x: BK.x + Q2X * BK.k, y: sagAt(Q2X) };
const Q_W = 168, Q_H = 44;
const Q_C = { x: Q_CLIP.x, y: Q_CLIP.y + (10 + 22) * BK.k };
const GRIP_IN = { x: 9, y: 5 };
const Q_GRIP = { x: Q_C.x + (Q_W / 2 - GRIP_IN.x) * BK.k, y: Q_C.y - (Q_H / 2) * BK.k + GRIP_IN.y * BK.k };
const Q_TEXT = 'WHO PAID FOR DINNER?';
const SHEET_LIGHT = 0;
/** the board: Q2 on the thread, the pinned sheet and Vapnik's slip in one frame; a slow push with a drift right */
const CAM_B: Camera3 = { x: 722, y: 150, z: 520, lens: 1 };
const CAM_B1: Camera3 = { x: 746, y: 154, z: 540, lens: 1 };
const BOARD_CAMS = [CAM_B, CAM_B1];
/** the near plane (L5 world, placed from the board camera's frame): the desk's edge and the banker's lamp */
const NEAR_DESK_Y = toLayer(LAYERS.L5, CAM_B, 0, 650).y;
const NEAR_LAMP = (() => {
  const p = toLayer(LAYERS.L5, CAM_B, 1205, 668);
  return { x: p.x, y: p.y, s: 0.92 };
})();
const POOL_B = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - BK.x, cy: STUDY.pool.cy - BK.y, k: 1 };

// =============================================================================================== the quote slip (screen)
const SLIP = { x: 760, y: 70, w: 470, h: 214 };
const SLIP_LINES = ['…no one in his right mind will use', 'neural nets that are essentially', 'like those used in 1995.'];

/** the words the narrator speaks, matched to the typed words they warm on the sheet: [line word, bet, typed word] */
const SPOKEN: [string, 1 | 2, string][] = [
  ['Larry', 1, 'jackel'],
  ['bet', 1, 'bets'],
  ['two#2', 1, '2000'],
  ['understand', 1, 'understand'],
  ['why', 1, 'why'],
  ['big', 1, 'big'],
  ['neural', 1, 'neural'],
  ['nets', 1, 'nets'],
  ['work', 1, 'working'],
  ['Vladimir', 2, 'vapnik'],
  ['bet#2', 2, 'bets'],
  ['two#3', 2, '2005'],
  ['use', 2, 'use'],
  ['nets#2', 2, 'nets'],
  ['like', 2, 'like'],
  ['those', 2, 'those'],
];
const norm = (w: string) => w.replace(/[^a-z0-9]/gi, '').toLowerCase();

interface B {
  D: number;
  bell: number;
  passAt: number;
  fancy: number;
  dis1A: number;
  dis1B: number;
  larry: number;
  vlad: number;
  vap: number;
  noAt: number;
  mindEnd: number;
  toSig: number;
  sigs: [number, number][];
  paid: number;
  who: number;
  dis2A: number;
  dis2B: number;
  p0: number;
  pDur: number;
  marks: { t: number; bet: 1 | 2; word: string }[];
}

let SCRATCH: HTMLCanvasElement | null = null;
function scratchCopy(src: HTMLCanvasElement | OffscreenCanvas) {
  if (!SCRATCH) SCRATCH = document.createElement('canvas');
  if (SCRATCH.width !== src.width || SCRATCH.height !== src.height) {
    SCRATCH.width = src.width;
    SCRATCH.height = src.height;
  }
  const g = SCRATCH.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, SCRATCH.width, SCRATCH.height);
  g.drawImage(src as CanvasImageSource, 0, 0);
}
/** an in-shot dissolve: paint A, keep it, paint B over the whole frame, lay A back on top at 1 − u */
function dissolve(f: Frame, u: number, a: () => void, b: () => void) {
  if (u <= 0) return a();
  if (u >= 1) return b();
  a();
  scratchCopy(f.c.canvas);
  b();
  const c = f.c;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1 - u;
  c.drawImage(SCRATCH!, 0, 0);
  c.restore();
}

let LAYOUT: SheetLayout | null = null;
const layoutOf = (c: C) => {
  if (LAYOUT) return LAYOUT;
  const L = layoutSheet(c);
  // keep it only once the typewriter face is in (its widths drive the wrap)
  if (typeof document === 'undefined' || document.fonts.check(`15px ${FONT.typewriter}`)) LAYOUT = L;
  return L;
};

/** the top-down camera path, framed on the measured layout (memoised per layout) */
let TD_KEY: SheetLayout | null = null;
let TD_PATH: ((t: number) => Camera3) | null = null;
function tdCam(L: SheetLayout, b: B, t: number): Camera3 {
  if (TD_KEY !== L || !TD_PATH) {
    const b1 = L.block1, b2 = L.block2;
    // each bet framed in the left two-thirds at reading scale (the right third keeps the name card / the slip)
    const TDJ = camAt(ZR, b1.x + b1.w / 2, b1.y + b1.h / 2, 456, 336);
    const TDJb = camAt(ZR + 6, b1.x + b1.w / 2, b1.y + b1.h / 2 + 6, 452, 336);
    const TDV = camAt(ZR, b2.x + b2.w / 2, b2.y + b2.h / 2, 486, 452);
    const TDVb = camAt(ZR + 6, b2.x + b2.w / 2, b2.y + b2.h / 2 + 4, 482, 448);
    const s = L.sigs;
    const TDS = camAt(ZS, s[0].x + s[0].w / 2, (s[0].y + s[2].y) / 2 - 8, 500, 436);
    TD_KEY = L;
    TD_PATH = camPath([
      [b.dis1A, TD0],
      [b.larry - 0.15, { ...TD0, z: TD0.z + 30 }, (u) => u],
      [b.larry + 1.35, TDJ, easeIO],
      // the read down to bet 2 starts on 'Vladimir', so Vapnik's paragraph is centred as his name is said
      [b.vlad - 0.6, TDJb, (u) => u],
      [b.vap - 0.02, TDV, easeIO],
      [b.toSig, TDVb, (u) => u],
      [b.toSig + 0.85, TDS, easeIO],
      [b.dis2B, { ...TDS, z: TDS.z + 14 }, (u) => u],
    ]);
  }
  return TD_PATH(t);
}

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const W = (w: string) => T.word('L0610', w);
    const larry = W('Larry');
    const vlad = W('Vladimir');
    const noAt = W('no');
    const mindEnd = T.beat('underline');
    const paid = T.beat('card');
    const who = T.word('L0612', 'who');
    // three signatures, one after another, from 'use' (the camera keeps bet 2's last lines in view above them), each
    // about half a second of pen, all signed before the board comes in on 'who' (the sign beat sits in the middle)
    const s0 = W('use') + 0.1;
    const sd = 0.52;
    const sigs: [number, number][] = [0, 1, 2].map((i) => [s0 + i * sd, s0 + i * sd + (i === 2 ? 0.58 : 0.5)]);
    // the hand carries WHO PAID FOR DINNER? in from 'who' and presses the pin between 'paid' and 'dinner'
    const pDur = 1.0;
    const b: B = {
      D,
      bell: W('Bell'),
      passAt: W('signed') + 0.45,
      fancy: W('fancy'),
      // a dip through the dark (the lamp is the bridge): side view down on 'each', the lamp-lit sheet up for 'Larry'
      dis1A: W('each') + 0.1,
      dis1B: larry - 0.05,
      larry,
      vlad,
      vap: T.beat('vapnik'),
      noAt,
      mindEnd,
      toSig: mindEnd + 0.05,
      sigs,
      paid,
      who,
      dis2A: who - 0.5,
      dis2B: who - 0.02,
      p0: who - 0.05,
      pDur,
      marks: SPOKEN.map(([w, bet, word]) => ({ t: W(w), bet, word })),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const b = scene.b as B;
    if (t < b.dis1A) side(f, t, tq, b);
    else if (t < b.dis1B) {
      // the dip: the side view sinks into the dark, the top-down sheet rises out of it (no double exposure)
      const u = (t - b.dis1A) / (b.dis1B - b.dis1A);
      if (u < 0.5) {
        side(f, t, tq, b);
        inkVeil(f, 0.95 * sm(u / 0.5));
      } else {
        topDown(f, t, tq, b, true);
        inkVeil(f, 0.95 * sm((1 - u) / 0.5));
      }
    } else if (t < b.dis2A) topDown(f, t, tq, b, true);
    else {
      // the sheet leaves the table (the flying sheet carries it), the board dissolves in under it
      const d2 = win(t, b.dis2A, b.dis2B);
      dissolve(f, d2, () => topDown(f, t, tq, b, false), () => board(f, t, tq, b));
      if (t < b.dis2B + 0.08) flyingSheet(f, t, b, clamp01((t - b.dis2A) / (b.dis2B + 0.08 - b.dis2A)));
    }

    // ---- screen-locked type
    screenPass(f, (c) => {
      const env = { t, mood: f.mood, seed: 65 };
      // the one name card (Vapnik was carded in ch06-s03, LeCun in ch06-s04): Jackel, as he is named, in the right
      // third beside his bet (over the dark table, never over the typed text), clear before Vapnik's slip lifts
      jackelCard(c, env, b.larry - 0.05, b.vlad - 0.7 - (b.larry - 0.05));
      // the place stamp holds through the side view and the read of bet 1; it leaves before the camera reads down
      // to bet 2 (whose last lines would run under it)
      placeStamp(c, { place: 'Bell Labs', date: '14 March 1995', year: 1995, x: 1232, align: 'right', at: b.bell - 0.15, dur: b.vlad - 0.75 - (b.bell - 0.15), fade: 0.35 }, env);
      // the quote slip: screen-locked while it is read off the sheet; from the flight on it is paper on the board
      if (t < b.dis2B + 0.08) quoteSlip(c, f, t, b);
    });
  },
});

// =============================================================================================== SIDE
function sideCam(t: number, b: B): Camera3 {
  return mixCam(SV0, SV1, easeIO(t / (b.dis1B + 0.3)));
}
function side(f: Frame, t: number, tq: number, b: B) {
  const cam = sideCam(t, b);
  f.camera(cam);
  f.backlight({ sunX: 760, sunY: 420, sunRadius: 620, intensity: 0.95 });
  // far: a low wooded ridge under the dusk, seen through the window wall
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, SIDE_CAMS, 40);
    f.cached(`${ID}/side/L1/${env.mood.id}`, Math.ceil(r.w), 260, (cc) => {
      cc.translate(-r.x, -360);
      forestBand(cc, { x0: r.x, x1: r.x + r.w, y: 492, h: 64, kind: 'leafy', density: 1.3, seed: 95 }, env);
    })(c, r.x, 360);
  });
  // back: the office's window wall (the panes are holes onto the dusk)
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, SIDE_CAMS, 40);
    f.cached(`${ID}/side/L2/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      const p = new Path2D();
      p.rect(r.x, r.y, r.w, r.h);
      const X0 = 150, X1 = 1130, Y0 = 70, Y1 = 470, cols = 6, rows = 3, mu = 9;
      const pw = (X1 - X0 - (cols - 1) * mu) / cols, ph = (Y1 - Y0 - (rows - 1) * mu) / rows;
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) p.rect(X0 + j * (pw + mu), Y0 + i * (ph + mu), pw, ph);
      cc.fillStyle = env.fill('set');
      cc.fill(p, 'evenodd');
      // a ceiling soffit and the sill
      cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.35);
      cc.fillRect(r.x, Y1, r.w, 16);
      cc.fillRect(r.x, r.y, r.w, Y0 - 24 - r.y);
    })(c, r.x, r.y);
  });
  f.fog('A');
  // mid: a low credenza along the sill, a filing cabinet
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, SIDE_CAMS, 40);
    f.cached(`${ID}/side/L3/${env.mood.id}`, Math.ceil(r.w), 320, (cc) => {
      cc.translate(-r.x, -420);
      cc.fillStyle = env.fill('set');
      cc.fillRect(110, 486, 1060, 90);
      cc.fillRect(1180, 430, 90, 146);
      cc.strokeStyle = withAlpha(env.mood.rim, 0.14);
      cc.lineWidth = 1;
      for (let x = 160; x < 1150; x += 120) cc.strokeRect(x, 498, 100, 64);
      for (let y = 444; y < 566; y += 40) cc.strokeRect(1188, y, 74, 32);
    })(c, r.x, 420);
  });
  f.fog('B');
  // the action: Vapnik signs and passes the pen across; Jackel takes it and bends to sign ('signed a pair of bets')
  const P = b.passAt;
  const passed = tq >= P;
  const vu = sm((tq - (P - 1.0)) / 0.6) * (1 - sm((tq - (P + 0.1)) / 0.6));
  const ju = sm((tq - (P - 0.55)) / 0.55) * (1 - sm((tq - (P + 0.2)) / 0.5));
  const su = passed ? win(tq, P + 0.45, P + 0.95) * (1 - win(tq, P + 1.9, P + 2.4)) : 0;
  const vapP = withLife(blendPose(passed ? SIT_REST : SIT_HOLD, REACH, vu), tq, 81, 0.6);
  const jacP = withLife(blendPose(blendPose(passed ? SIT_HOLD : SIT_REST, REACH, ju), SIGN, su), tq, 82, 0.6);
  // LeCun turns his head from one to the other (the witness)
  const lecP = withLife(blendPose(WITNESS, WITNESS_TURN, win(tq, P - 0.2, P + 0.6)), tq, 83, 0.6);
  // a fancy dinner each: the two glasses catch the lamp as it is said
  const glint = win(t, b.fancy - 0.15, b.fancy + 0.35) * (1 - 0.55 * win(t, b.fancy + 1.0, b.fancy + 1.8));
  f.layer('L4', (c, env) => {
    const light = { x: 0.2, y: -1, floor: 0.15 };
    // value hierarchy: the three men are the darkest shapes in frame (near-black ink), each with a 1.5 px rim cut on
    // the contour facing the lamp; the table, chairs and glasses stay one step lighter (set ink)
    const ink = PUPPET_NEAR_BLACK;
    // LeCun sits BEHIND the table, a step back, centred under the lamp, turned toward the bettors
    cast.lecun.draw(c, { x: LEC.x, y: FY - LEC.lift, facing: 'left', pose: lecP, scale: LEC.s, cutLines: true, light, ink, edgeRim: { x: -0.2, y: -1, px: 1.5 } }, env);
    // the table: a dark cloth dropping almost to the floor (it hides LeCun below the chest and his chair entirely),
    // a scalloped hem, two fold cut-lines; the turned legs show below the hem
    clothTableSide(c, env);
    // the typed sheet lying on the table (a pale sliver), two glasses set out for the dinners to come
    c.fillStyle = mixLab(env.mood.halo, env.mood.rim, 0.5);
    c.fillRect(604, TABLE.y - 1.6, 70, 1.6);
    for (const gx of GLASSES) wineGlass(c, gx, TABLE.y, 1, env);
    if (glint > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (const gx of GLASSES) {
        const gy = TABLE.y - 36;
        const g = c.createRadialGradient(gx - 3, gy, 0, gx - 3, gy, 26);
        g.addColorStop(0, withAlpha(env.mood.core, 0.55 * glint));
        g.addColorStop(0.25, withAlpha(env.mood.halo, 0.25 * glint));
        g.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = g;
        c.fillRect(gx - 30, gy - 30, 60, 60);
        // the rim's specular line on the lamp side
        c.strokeStyle = withAlpha(env.mood.core, 0.8 * glint);
        c.lineWidth = 1.3;
        c.beginPath();
        c.moveTo(gx - 6.5, TABLE.y - 42);
        c.quadraticCurveTo(gx - 7.5, TABLE.y - 32, gx - 3, TABLE.y - 27);
        c.stroke();
      }
      c.restore();
    }
    // the bettors at the ends, facing each other across the lamp
    sideChair(c, VAP.x - 8, FY - 118, FY, 'right', env);
    sideChair(c, JAC.x + 8, FY - 118, FY, 'left', env);
    (passed ? PEN_PUPPETS.vapnikBare : PEN_PUPPETS.vapnikPen).draw(c, { x: VAP.x, y: FY, facing: 'right', pose: vapP, cutLines: true, light, ink, edgeRim: { x: 0.5, y: -1, px: 1.5 } }, env);
    (passed ? PEN_PUPPETS.jackelPen : cast.jackel).draw(c, { x: JAC.x, y: FY, facing: 'left', pose: jacP, cutLines: true, light, ink, edgeRim: { x: -0.5, y: -1, px: 1.5 } }, env);
    pendantLamp(c, LAMP.x, LAMP.y, env);
  });
  f.rim({ x: 0.15, y: -1 });
  f.practical({ x: LAMP.x, y: LAMP.y + 10, kind: 'lamp', seed: 95, intensity: 0.85, radius: 60 });
  // near: a spindle chair back at the lower left, out of focus; it slides against the window wall as the camera pushes
  f.layer('L5', (c, env) => {
    f.cached(`${ID}/side/L5chair/${env.mood.id}`, 420, 520, (cc) => {
      cc.translate(210, 500);
      chairBack(cc, { x: 0, y: 0, s: 1.25, kind: 'spindle' }, env);
    }, { blur: 3 })(c, 150 - 210, 760 - 500);
  });
}

/** the table at Bell Labs, side-on: a cloth that drops almost to the floor over a plain table (set ink) */
function clothTableSide(c: C, env: PaintEnv) {
  const x0 = TABLE.x0 - 4, x1 = TABLE.x1 + 4, top = TABLE.y, hem = FY - 44;
  c.save();
  c.fillStyle = env.fill('ink');
  // the legs below the hem
  c.fillRect(TABLE.x0 + 12, hem - 4, 7, FY - hem + 4);
  c.fillRect(TABLE.x1 - 19, hem - 4, 7, FY - hem + 4);
  // the top board and the cloth with a scalloped hem
  c.fillRect(x0 - 2, top - 2, x1 - x0 + 4, 6);
  const p = new Path2D();
  p.moveTo(x0, top);
  p.lineTo(x1, top);
  p.lineTo(x1 + 3, hem);
  const n = 8;
  for (let i = n; i > 0; i--) {
    const xa = x0 - 3 + ((x1 - x0 + 6) * i) / n, xb = x0 - 3 + ((x1 - x0 + 6) * (i - 1)) / n;
    p.quadraticCurveTo((xa + xb) / 2, hem + 7, xb, hem);
  }
  p.closePath();
  c.fill(p);
  // fold cut-lines and the top's rim (lit from the lamp above)
  c.strokeStyle = withAlpha(env.mood.rim, 0.16);
  c.lineWidth = 1.2;
  for (const fx of [x0 + 22, x1 - 26]) {
    c.beginPath();
    c.moveTo(fx, top + 10);
    c.quadraticCurveTo(fx + 3, (top + hem) / 2, fx - 1, hem - 2);
    c.stroke();
  }
  c.fillStyle = withAlpha(env.mood.rim, 0.38);
  c.fillRect(x0 - 2, top - 2.6, x1 - x0 + 4, 1.2);
  c.restore();
}

// =============================================================================================== TOP-DOWN
/** the typed words of one bet, drawn live at `alpha` (crisp ink: at reading scale they are the subject) */
function typedLive(c: C, env: PaintEnv, ws: WordBox[], seed: number, alpha: number, skip?: Set<number>) {
  if (alpha <= 0.005) return;
  const ink = sheetInk(env);
  c.save();
  c.font = PHRASE_FONT;
  c.letterSpacing = '0px';
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  ws.forEach((q, i) => {
    if (skip?.has(i)) return;
    c.fillStyle = withAlpha(ink, alpha * (0.92 + 0.08 * h01(i, seed)));
    c.fillText(q.w, q.x, q.y + (h01(i, seed + 1) - 0.5) * 0.8);
  });
  c.restore();
}

/** the lamp warming a spoken word on the paper: a soft amber wash that peaks on the word and stays as a mark */
function warmWord(c: C, env: PaintEnv, q: WordBox, u: number) {
  if (u <= 0.005) return;
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.35), 0.5 * u);
  c.beginPath();
  c.roundRect(q.x - 3, q.y - 15, q.width + 6, 21, 5);
  c.fill();
  c.restore();
}

/** the phrase's index range in bet 2 */
function phraseIdxOf(L: SheetLayout) {
  const start = L.bet2.findIndex((q, i) => ['no', 'one', 'in', 'his', 'right', 'mind'].every((p, k) => norm(L.bet2[i + k]?.w ?? '') === p));
  return { start, set: new Set([0, 1, 2, 3, 4, 5].map((k) => start + k)) };
}

/** one confident, slightly wavy pen stroke from x0 to x (of a full stroke x0 → x1) */
function penStroke(c: C, x0: number, x1: number, x: number, y: number) {
  if (x <= x0) return;
  c.beginPath();
  const wav = (xx: number) => y + 1.3 * Math.sin(((xx - x0) / Math.max(1, x1 - x0)) * Math.PI * 1.7 + 0.3) - 0.6 * ((xx - x0) / Math.max(1, x1 - x0));
  c.moveTo(x0 - 3, wav(x0) + 0.4);
  for (let xx = x0; xx <= x; xx += 2) c.lineTo(xx, wav(xx));
  c.lineTo(x, wav(x));
  c.stroke();
}

/** the sheet's live state at time t (ink coming up as it is read, warmed words, the underline, the signatures). Returns the pen nibs. */
function sheetLive(c: C, env: PaintEnv, L: SheetLayout, b: B, t: number, tq: number): { nib: P | null; sigNib: P | null } {
  const ph = phraseIdxOf(L);
  // ---- the read: each bet's ink comes up as the camera leans in on it (texture, < 0.3, until then)
  const a1 = TYPE_TEXTURE_A + (0.84 - TYPE_TEXTURE_A) * win(t, b.larry - 0.25, b.larry + 0.9) - 0.22 * win(t, b.vlad, b.vlad + 1.0);
  const a2 = TYPE_TEXTURE_A + (0.86 - TYPE_TEXTURE_A) * win(t, b.vlad - 0.1, b.vlad + 1.0);
  // the words the narrator speaks, warmed by the lamp as they are said, and left marked
  for (const m of b.marks) {
    const ws = m.bet === 1 ? L.bet1 : L.bet2;
    const q = ws.find((w) => norm(w.w) === m.word);
    if (!q) continue;
    const u = win(t, m.t - 0.12, m.t + 0.12) * (1 - 0.45 * win(t, m.t + 0.5, m.t + 1.4));
    warmWord(c, env, q, u);
  }
  typedLive(c, env, L.bet1, 501, a1 - TYPE_TEXTURE_A * 0.5);
  typedLive(c, env, L.bet2, 502, a2 - TYPE_TEXTURE_A * 0.5, ph.set);
  // the spoken phrase ('no one in his right mind') is left out of the bake: always drawn live, darkest once said
  const pa = Math.max(a2, lerp(a2, 0.97, win(t, b.noAt - 0.2, b.noAt + 0.4)));
  typedLive(c, env, L.bet2.slice(ph.start, ph.start + 6), 503, pa);
  // the underline, as the phrase is spoken (the narrator's pen): one stroke, starting on 'no'
  const uu = clamp01((t - b.noAt + 0.05) / (b.mindEnd - b.noAt + 0.05));
  const ink = sheetInk(env);
  let nib: P | null = null;
  if (uu > 0) {
    c.save();
    c.strokeStyle = withAlpha(ink, 0.9);
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const s of L.phrase) {
      const v = clamp01((uu - s.f0) / Math.max(1e-6, s.f1 - s.f0));
      if (v <= 0) continue;
      const x1 = lerp(s.x0, s.x1, v);
      penStroke(c, s.x0, s.x1, x1, s.y + 2);
      if (v < 1) nib = { x: x1, y: s.y + 2 };
    }
    c.restore();
  }
  // the signatures, one after another
  let sigNib: P | null = null;
  b.sigs.forEach(([a, z], i) => {
    const n = signature(c, L, i, clamp01((tq - a) / (z - a)), env);
    if (n) sigNib = n;
  });
  return { nib, sigNib };
}

/** the fountain pen with its soft shadow; the barrel trails down and to the right of the nib (below the line) */
function penAt(c: C, env: PaintEnv, x: number, y: number, ang: number, s: number, a = 1) {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha = 0.3 * a;
  c.filter = `blur(${(2.5 * env.pxScale).toFixed(1)}px)`;
  fountainPen(c, x + 14, y + 18, ang, s, env);
  c.restore();
  c.save();
  c.globalAlpha = a;
  fountainPen(c, x, y, ang, s, env);
  c.restore();
}

function topDown(f: Frame, t: number, tq: number, b: B, withSheet: boolean) {
  const L = layoutOf(f.c);
  const cam = tdCam(L, b, t);
  f.camera(cam);
  f.backlight({ intensity: 0.3 });
  f.layer('L4', (c, env) => {
    // the table: dark wood with a grain, the lamp's pool on it (baked once); the sheet is its own bake (it leaves)
    const r = overscan(LAYERS.L4, TD_SAFE, 80);
    f.cached(`${ID}/td/table2/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      cc.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.55);
      cc.fillRect(r.x, r.y, r.w, r.h);
      cc.strokeStyle = withAlpha(env.mood.set, 0.55);
      cc.lineWidth = 1.2;
      for (let i = 0; i < 70; i++) {
        const y = r.y + (i / 70) * r.h + 6 * h01(i, 91);
        cc.beginPath();
        cc.moveTo(r.x, y);
        for (let x = r.x; x <= r.x + r.w; x += 40) cc.lineTo(x, y + 3 * Math.sin(x / 140 + i) + 2 * h01(i * 7 + Math.round(x), 92));
        cc.stroke();
      }
      // the lamp's pool: a DEFINED disc (the shade's mouth projected on the table), brightest toward its far side,
      // with a hot rim where the shade's lip focuses the light; beyond it the table falls straight to dark
      const PC = { x: 600, y: 360, r: 470 };
      cc.save();
      cc.translate(PC.x, PC.y);
      cc.scale(1, 1.06);
      const pool = cc.createRadialGradient(-60, -50, 30, 0, 0, PC.r);
      pool.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.25), 0.55));
      pool.addColorStop(0.7, withAlpha(env.mood.halo, 0.36));
      pool.addColorStop(0.93, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.35), 0.5));
      pool.addColorStop(0.965, withAlpha(env.mood.halo, 0.12));
      pool.addColorStop(1, withAlpha(env.mood.halo, 0));
      cc.fillStyle = pool;
      cc.beginPath();
      cc.arc(0, 0, PC.r, 0, Math.PI * 2);
      cc.fill();
      cc.restore();
      const dark = new Path2D();
      dark.rect(r.x, r.y, r.w, r.h);
      dark.ellipse(PC.x, PC.y, PC.r * 0.99, PC.r * 1.05, 0, 0, Math.PI * 2);
      cc.fillStyle = withAlpha(env.mood.fg, 0.5);
      cc.fill(dark, 'evenodd');
      // the glasses, set out for the dinners to come
      wineGlassTop(cc, 860, 236, 27, env);
      wineGlassTop(cc, 902, 700, 27, env);
    })(c, r.x, r.y);
    if (!withSheet) return;
    f.cached(`${ID}/td/sheet/${env.mood.id}`, SHEET.w + 24, SHEET.h + 24, (cc) => {
      cc.translate(-SHEET.x + 4, -SHEET.y + 4);
      paintSheet(cc, env, L, { phrase: false });
    })(c, SHEET.x - 4, SHEET.y - 4);
    const { nib, sigNib } = sheetLive(c, env, L, b, t, tq);
    // the narrator's pen: it comes in from the lower right, its nib at the start of the phrase as 'no' is said, the
    // barrel trailing down and to the right BELOW the line (the spoken words stay clear); one stroke, then it lifts away
    const p0 = L.phrase[0];
    if (p0) {
      const come = sm((t - (b.noAt - 0.6)) / 0.55);
      const go = sm((t - (b.mindEnd + 0.08)) / 0.45);
      if (come > 0 && go < 1) {
        const at: P = nib ?? (t < b.noAt ? { x: p0.x0, y: p0.y + 2 } : { x: L.phrase[L.phrase.length - 1].x1, y: L.phrase[L.phrase.length - 1].y + 2 });
        const off = 1 - come + go;
        penAt(c, env, at.x + 70 * off, at.y + 80 * off - 3 * go, -2.42, 0.82, Math.min(come, 1 - go) * 1.0 + 0.0);
      }
    }
    if (sigNib) penAt(c, env, (sigNib as P).x, (sigNib as P).y, -2.3, 0.62);
  });
  // between us and the table: dust turning slowly in the lamp's cone, out of focus (a third plane on every move)
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, TD_SAFE, 40);
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const px = r.x + r.w * h01(i * 3 + 1, 551) + 26 * Math.sin(t * 0.21 + i);
      const py = r.y + r.h * h01(i * 3 + 2, 552) + 18 * Math.cos(t * 0.17 + i * 1.7);
      const rad = 3 + 7 * h01(i * 3 + 3, 553);
      const a = 0.05 + 0.08 * h01(i, 554) * (0.6 + 0.4 * Math.sin(t * 0.9 + i * 2.3));
      const g = c.createRadialGradient(px, py, 0, px, py, rad);
      g.addColorStop(0, withAlpha(env.mood.halo, a));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    }
    c.restore();
  });
  // near: the pendant's shade between us and the table, out of focus (it slides away as the camera reads down)
  f.layer('L6', (c, env) => {
    f.cached(`${ID}/td/shade/${env.mood.id}`, 360, 360, (cc) => {
      cc.translate(180, 180);
      cc.fillStyle = env.fill('fg');
      cc.beginPath();
      cc.arc(0, 0, 120, 0, Math.PI * 2);
      cc.fill();
      cc.strokeStyle = withAlpha(env.mood.halo, 0.35);
      cc.lineWidth = 6;
      cc.beginPath();
      cc.arc(0, 0, 118, Math.PI * 0.1, Math.PI * 0.9);
      cc.stroke();
    }, { blur: 10 })(c, SHADE.x - 180, SHADE.y - 180);
  });
  // the shade's warmth on the sheet (the lamp is just above frame left)
  screenPass(f, (c) => {
    const g = c.createRadialGradient(560, 320, 300, 640, 380, 900);
    g.addColorStop(0, withAlpha(f.mood.fg, 0));
    g.addColorStop(1, withAlpha(f.mood.fg, 0.3));
    c.fillStyle = g;
    c.fillRect(0, 0, 1280, 720);
  });
}

// =============================================================================================== BOARD
function boardCam(t: number, b: B) {
  return mixCam(CAM_B, CAM_B1, easeIO(clamp01((t - b.dis2A) / (b.D - b.dis2A))));
}

/** settle a crossfading mood to its nearer end (bakes must not re-key every frame) */
function settledEnv(env0: PaintEnv): PaintEnv {
  const id0 = env0.mood.id;
  const mid = id0.includes('->') ? (parseFloat(id0.split('@')[1]) < 0.5 ? id0.split('->')[0] : id0.split('->')[1].split('@')[0]) : id0;
  return { ...env0, mood: MOODS[mid as keyof typeof MOODS] ?? env0.mood } as PaintEnv;
}

function board(f: Frame, t: number, tq: number, b: B) {
  const cam = boardCam(t, b);
  f.camera(cam);
  f.setMood('candleAmber', { from: 'duskRose', u: win(t, b.dis2A, b.dis2B + 0.4) });
  studyRoom(f, { key: ID, cams: BOARD_CAMS, outside: { mood: 'duskRose', kind: 'night' } });
  const entry = { R: toLayer(LAYERS.L4, cam, 1500, 470), L: toLayer(LAYERS.L4, cam, 1500, 640) };
  const pU = clamp01((tq - b.p0) / b.pDur);
  const pinPose = pU > 0 && pU < 0.94 ? hands.act('pin', pU, Q_GRIP, { held: 'card', entry, scale: 0.85 }) : null;
  const placed = pU >= 0.45;
  const tPlaced = b.p0 + 0.45 * b.pDur;
  const lightQ = poolAt(POOL_B, Q2X, BOARD.threadY + 40);
  const st = boardStateAt(ID, 'start');
  const sheetIn = t >= b.dis2B + 0.08;
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: false,
    wall: false,
    xray: false,
    board: { state: st },
    extra: (c, env) => {
      if (sheetIn) {
        pinnedSheet(f, c, env);
        boardSlip(c, env, t, b);
      }
      if (placed) {
        // the card sways a little and settles (about 2 degrees, damped out in ~1.2 s)
        const tp = tq - tPlaced;
        hangQ(c, env, lightQ, 0.035 * Math.exp(-tp * 2.8) * Math.sin(tp * 8));
      } else bareClip(c, env);
      if (pinPose) {
        hands.draw(c, pinPose, env, {
          heldDraw: (cc, at, _h, e) =>
            drawCard(cc, { id: 'Q-held', w: Q_W, h: Q_H, icon: 'question', text: Q_TEXT }, { x: at.x - (Q_W / 2 - GRIP_IN.x) * BK.k, y: at.y + (Q_H / 2 - GRIP_IN.y) * BK.k, k: BK.k, light: lightQ, pin: false }, e),
        });
      }
    },
  });
  // the lamp's pool on the insert (exposure, not a veil): the green-shaded lamp is at the lower right
  screenPass(f, (c) => {
    const g = c.createRadialGradient(760, 420, 160, 700, 360, 1000);
    g.addColorStop(0, withAlpha(f.mood.fg, 0));
    g.addColorStop(0.55, withAlpha(f.mood.fg, 0.18));
    g.addColorStop(1, withAlpha(f.mood.fg, 0.55));
    c.fillStyle = g;
    c.fillRect(0, 0, 1280, 720);
  });
  f.fog({ yCenter: 560, height: 260, alpha: 0.1, drift: 7 });
  // NEAR (L5): the desk's edge along the bottom and the green-shaded banker's lamp at the lower right, its bulb a
  // practical in frame; they slide against the board as the camera pushes in (three planes: wall, board, desk)
  f.practical({ x: NEAR_LAMP.x, y: NEAR_LAMP.y - 30.4 * NEAR_LAMP.s, kind: 'lamp', seed: 41, intensity: 0.75, radius: 70, layer: 'L5' });
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, BOARD_CAMS, 60);
    f.cached(`${ID}/board/L5/${settledEnv(env).mood.id}/${Math.round(r.x)},${Math.round(r.y)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      const e = settledEnv(env);
      cc.fillStyle = e.fill('fg');
      cc.fillRect(r.x, NEAR_DESK_Y, r.w, r.y + r.h - NEAR_DESK_Y);
      cc.fillStyle = withAlpha(e.mood.rim, 0.3);
      cc.fillRect(r.x, NEAR_DESK_Y - 1, r.w, 2);
      // the lamp's warm pool on the desk top
      const g = cc.createRadialGradient(NEAR_LAMP.x - 40, NEAR_DESK_Y + 6, 4, NEAR_LAMP.x - 40, NEAR_DESK_Y + 6, 260);
      g.addColorStop(0, withAlpha(e.mood.halo, 0.32));
      g.addColorStop(1, withAlpha(e.mood.halo, 0));
      cc.fillStyle = g;
      cc.fillRect(NEAR_LAMP.x - 320, NEAR_DESK_Y - 2, 560, 40);
    }, { blur: 3 })(c, r.x, r.y);
    bankersLamp(c, { x: NEAR_LAMP.x, y: NEAR_LAMP.y, s: NEAR_LAMP.s, lit: true, seed: 41 }, env);
  });
}

function pinnedSheet(_f: Frame, c: C, env: PaintEnv) {
  // continuity: drawn exactly as ch06-s08 and ch07-s01 draw it (the sheet and its paper wine glasses)
  const light = poolAt(POOL_B, 505, 168) + SHEET_LIGHT;
  betSheet(c, env, { light });
  wineGlasses(c, env, { x: BET.x + BET.w - 12, y: BET.y - 6, s: 0.95, light });
}

function hangQ(c: C, env: PaintEnv, light: number, sway: number) {
  c.save();
  c.translate(Q_CLIP.x, Q_CLIP.y);
  c.rotate(sway);
  c.strokeStyle = oxblood(env);
  c.lineWidth = 1.2 * BK.k;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(0, 10 * BK.k);
  c.stroke();
  drawCard(c, { id: 'Q-Q2', w: Q_W, h: Q_H, icon: 'question', text: Q_TEXT }, { x: 0, y: (10 + 22) * BK.k, k: BK.k, light, pin: false }, env);
  c.restore();
}
function bareClip(c: C, env: PaintEnv) {
  c.strokeStyle = oxblood(env);
  c.lineWidth = 1.2 * BK.k;
  c.beginPath();
  c.moveTo(Q_CLIP.x, Q_CLIP.y);
  c.lineTo(Q_CLIP.x, Q_CLIP.y + 8 * BK.k);
  c.stroke();
}

/** the real sheet in its last top-down state (signed, underlined, read), baked at 2x for the flight */
function readSheetBitmap(f: Frame, c: C, env0: PaintEnv, b: B) {
  const L = layoutOf(c);
  const env = settledEnv(env0);
  f.cached(`${ID}/fly/${env.mood.id}`, SHEET.w + 24, SHEET.h + 24, (cc) => {
    cc.translate(-SHEET.x + 4, -SHEET.y + 4);
    paintSheet(cc, env, L, { phrase: false });
    sheetLive(cc, env, L, b, b.dis2A - 0.01, b.dis2A - 0.01);
  }, { res: 2 } as { blur?: number })(c, SHEET.x - 4, SHEET.y - 4);
}

/**
 * The flight (one object): the signed sheet lifts off the table and shrinks into its pinned slot on the board. It is
 * the real sheet (text and signatures) while it is big; it blurs as it travels and, under that blur, becomes the
 * pinned sheet's typed-dash texture at the slot's proportions, landing exactly where the board's copy takes over.
 */
function flyingSheet(f: Frame, t: number, b: B, u: number) {
  const L = layoutOf(f.c);
  const ca = tdCam(L, b, b.dis2A);
  const a0 = toScreen(LAYERS.L4, ca, SHEET.x, SHEET.y);
  const a1 = toScreen(LAYERS.L4, ca, SHEET.x + SHEET.w, SHEET.y + SHEET.h);
  const cb = boardCam(t, b);
  const z0 = toScreen(LAYERS.L4, cb, BET.x, BET.y);
  const z1 = toScreen(LAYERS.L4, cb, BET.x + BET.w, BET.y + BET.h);
  const e = easeIO(u);
  const lg = (p: number, q: number) => Math.exp(lerp(Math.log(p), Math.log(q), e));
  const w = lg(a1.x - a0.x, z1.x - z0.x), h = lg(a1.y - a0.y, z1.y - z0.y);
  const cx = lerp((a0.x + a1.x) / 2, (z0.x + z1.x) / 2, e), cy = lerp((a0.y + a1.y) / 2, (z0.y + z1.y) / 2, e);
  const x = cx - w / 2, y = cy - h / 2;
  const blur = 7 * Math.sin(Math.PI * Math.min(1, u * 1.15));
  const real = 1 - sm((u - 0.3) / 0.3);
  screenPass(f, (c) => {
    const env = { t, mood: f.mood, pxScale: f.pxScale, fill: (role: string) => (f.mood as unknown as Record<string, string>)[role] ?? f.mood.ink } as unknown as PaintEnv;
    c.save();
    if (blur > 0.3) c.filter = `blur(${(blur * f.pxScale).toFixed(1)}px)`;
    // its shadow on whatever is below, lifting with the sheet
    c.fillStyle = withAlpha(f.mood.fg, 0.35 * Math.sin(Math.PI * u) + 0.2);
    c.fillRect(x + 10 * Math.sin(Math.PI * e) + 3, y + 14 * Math.sin(Math.PI * e) + 4, w, h);
    if (real > 0.01) {
      c.save();
      c.globalAlpha = real;
      c.translate(x, y);
      c.scale(w / SHEET.w, h / SHEET.h);
      c.translate(-SHEET.x, -SHEET.y);
      readSheetBitmap(f, c, env, b);
      c.restore();
    }
    if (real < 0.99) {
      c.save();
      c.globalAlpha = 1 - real;
      c.translate(x, y);
      c.scale(w / BET.w, h / BET.h);
      c.translate(-BET.x, -BET.y);
      const light = poolAt(POOL_B, 505, 168) + SHEET_LIGHT;
      betSheet(c, env, { light });
      wineGlasses(c, env, { x: BET.x + BET.w - 12, y: BET.y - 6, s: 0.95, light });
      c.restore();
    }
    c.restore();
  });
}

// =============================================================================================== TYPE
/** where the slip hangs on the board: pinned over the sheet's right edge, below the wine-glass tab (world) */
const SLIP_W = { x: BET.x + BET.w - 18, y: BET.y + 36, w: 184, rot: 0.018 };
const SLIP_K = SLIP_W.w / 470;

/** the slip's paper and words in its own units (0..SLIP.w × 0..SLIP.h) */
function slipPaper(c: C, m: PaintEnv['mood'], t: number, b: B, paperLight = 1) {
  const attrSize = legibleSize(c, `600 21px ${FONT.sc}`, 21, 'h');
  const paper = mixLab(mixLab(m.set, m.setHaze, 0.5), mixLab(mixLab(m.halo, m.rim, 0.6), '#efe6d2', 0.5), 0.35 + 0.65 * paperLight);
  c.fillStyle = paper;
  c.fillRect(0, 0, SLIP.w, SLIP.h);
  c.strokeStyle = withAlpha(m.ink, 0.25);
  c.lineWidth = 1;
  c.strokeRect(7.5, 7.5, SLIP.w - 15, SLIP.h - 15);
  const ink = mixLab(m.ink, '#2a1d18', 0.4);
  c.fillStyle = ink;
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  const size = 29;
  c.font = `italic 400 ${size}px ${FONT.text}`;
  c.letterSpacing = '0px';
  const lx = 30;
  SLIP_LINES.forEach((line, i) => c.fillText(line, lx, 58 + i * 40));
  c.font = `600 ${attrSize}px ${FONT.sc}`;
  c.letterSpacing = '1.5px';
  c.textAlign = 'right';
  c.fillStyle = withAlpha(ink, 0.8);
  c.fillText('— vapnik’s bet', SLIP.w - 30, SLIP.h - 26);
  c.letterSpacing = '0px';
  c.textAlign = 'left';
  // the underline under "no one in his right mind", growing with the words (the same stroke as on the sheet)
  const uu = clamp01((t - b.noAt + 0.05) / (b.mindEnd - b.noAt + 0.05));
  if (uu > 0) {
    c.font = `italic 400 ${size}px ${FONT.text}`;
    const x0 = lx + c.measureText('…').width + 1;
    const x1 = lx + c.measureText('…no one in his right mind').width;
    c.save();
    c.strokeStyle = withAlpha(ink, 0.88);
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    penStroke(c, x0, x1, lerp(x0, x1, uu), 67);
    c.restore();
  }
}

/** the slip as paper pinned on the board (world): lamp-lit, a contact shadow, a brass pin */
function boardSlip(c: C, env: PaintEnv, t: number, b: B) {
  const light = poolAt(POOL_B, SLIP_W.x - BK.x + SLIP_W.w / 2, SLIP_W.y - BK.y + 40);
  c.save();
  c.translate(SLIP_W.x, SLIP_W.y);
  c.rotate(SLIP_W.rot);
  c.fillStyle = withAlpha(env.mood.fg, 0.4);
  c.fillRect(2.5, 3.5, SLIP_W.w, SLIP.h * SLIP_K);
  c.save();
  c.scale(SLIP_K, SLIP_K);
  slipPaper(c, env.mood, t, b, 0.55 + 0.45 * Math.min(1, light));
  c.restore();
  // the brass pin at the top centre
  const px = SLIP_W.w / 2, py = 5;
  c.fillStyle = withAlpha(env.mood.fg, 0.5);
  c.beginPath();
  c.arc(px + 1.2, py + 1.6, 3.2, 0, Math.PI * 2);
  c.fill();
  const g = c.createRadialGradient(px - 1, py - 1, 0.3, px, py, 3.4);
  g.addColorStop(0, mixLab(env.mood.core, '#f3e2b0', 0.4));
  g.addColorStop(1, mixLab(env.mood.set, '#8a6a2a', 0.5));
  c.fillStyle = g;
  c.beginPath();
  c.arc(px, py, 3.2, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** the quote slip: lifts off Vapnik's bet to the upper right (screen), then flies with the sheet to the board */
function quoteSlip(c: C, f: Frame, t: number, b: B) {
  const lu = win(t, b.vap - 0.05, b.vap + 0.62);
  if (lu <= 0) return;
  const m = f.mood;
  // the flight (with the sheet): screen rect → its world rect on the board, projected through the board camera
  const fu = easeIO(clamp01((t - b.dis2A) / (b.dis2B + 0.08 - b.dis2A)));
  const cb = boardCam(t, b);
  const zp = toScreen(LAYERS.L4, cb, SLIP_W.x, SLIP_W.y);
  const zk = zp.k * SLIP_K;
  const k0 = lerp(0.93, 1, lu);
  const x0 = SLIP.x + 34 * (1 - lu), y0 = SLIP.y + 26 * (1 - lu);
  const k = Math.exp(lerp(Math.log(k0), Math.log(zk), fu));
  const x = lerp(x0, zp.x, fu), y = lerp(y0, zp.y, fu);
  c.save();
  c.translate(x, y);
  c.rotate((-0.02 * (1 - lu) + 0.004) * (1 - fu) + SLIP_W.rot * fu);
  c.scale(k, k);
  c.globalAlpha = Math.min(1, lu * 1.6);
  softPlate(c, SLIP.w / 2 + 10, SLIP.h / 2 + 14, SLIP.w + 60, SLIP.h + 60, m.fg, (0.35 + 0.25 * lu) * (1 - fu));
  if (fu > 0) {
    c.fillStyle = withAlpha(m.fg, 0.4 * fu);
    c.fillRect(2.5 / SLIP_K, 3.5 / SLIP_K, SLIP.w, SLIP.h);
  }
  slipPaper(c, m, t, b, 1 - 0.45 * fu);
  c.restore();
}

/** Larry Jackel's name card on the dark wood beside the sheet: name, then the role on two short lines on one soft plate */
function jackelCard(c: C, env: { t: number; mood: PaintEnv['mood']; seed: number }, at: number, dur: number) {
  const A = envelope(env.t, at, dur, 0.35);
  if (A <= 0) return;
  const k = 1.25;
  const x = 1232, y = 176;
  // the plate first (fully over the wood strip)
  c.save();
  c.globalAlpha = A;
  softPlate(c, x - 130, y + 34, 380, 170, env.mood.ink, 0.62);
  c.restore();
  nameCardLg(c, { name: 'Larry Jackel', role: 'with Vapnik', x, y, align: 'right', at, dur, fade: 0.35, plate: false }, env, k);
  // the second role line, set exactly like the first (the kit card draws one line)
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  c.translate(-x, -y);
  const rSize = legibleSize(c, `italic 400 19px ${FONT.text}`, 19);
  const g = clamp01((env.t - at - 0.3) / 0.6);
  c.globalAlpha = A * 0.92 * g * g * (3 - 2 * g);
  c.fillStyle = mixLab(textColor(env.mood), '#f4ead6', 0.25);
  c.font = `italic 400 ${rSize}px ${FONT.text}`;
  c.textAlign = 'right';
  c.textBaseline = 'alphabetic';
  c.fillText('LeCun (witness)', x, y + 11 + rSize + 9 + rSize * 1.25);
  c.restore();
}
