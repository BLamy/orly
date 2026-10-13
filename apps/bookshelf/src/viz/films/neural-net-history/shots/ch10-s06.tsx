/**
 * ch10-s06 — the worked example (serverCyan hall; 28.0 s; cut in). A parchment plate hangs on two cords from the
 * hall's beam under its lamp (warm pool on the parchment, cool vignette at the corners); the cyan hall stands hazed
 * behind it. ILLUSTRATIVE toy numbers, all computed (the stamped tag sits in the plate's lower-right corner all shot):
 *
 *   question (bank)  q = [1, 2, 0, 1]
 *   labels           crossed [0, 1, 1, 0] · the [0, 0, 1, 0] · river [2, 1, 0, 0] · bank [1, 0, 1, 1]
 *   q · k            2 · 0 · 4 · 2     ÷ √4  →  1 · 0 · 2 · 1     softmax → 0.20 · 0.07 · 0.53 · 0.20
 *   messages         crossed "action" · the (unlabelled: the thinnest stream) · river "water" · bank "money"
 *
 *   'Four' …         the slips hang in, each on its own spoken word, each with ch10-s05's three objects: the oval hand
 *                    mirror with its tag (label) on its own cord at the slip's left, the sealed note (message) under
 *                    its bottom-right corner, and (bank) the paper lantern (question)
 *   'question'       bank's lantern lights; its beam touches each mirror in turn
 *   'scores'/'way'   label numbers, then the question's numbers drop into every column
 *   'multiply'/'add' the camera pulls back from the slip row to the table; products ink, a rule and plus signs sum them
 *   L1012            the scores ink (2 · 0 · 4 · 2), each pulsing as it is spoken
 *   'halve'          the pen strikes from 'halve' -0.15 s, 0.15 s apart; all four halves are written by ≈ 15.3 s and the
 *                    equation inks right after the fourth; the struck row HOLDS to 15.9 s
 *   15.9 s           only then: the work rows clear, the scores and equation rise, the halves drop under their cups,
 *                    the cups firm up with each cup's own WORD etched under it (crossed · the · river · bank) to the end
 *   pour             the jug pours cup by cup, levels = the real softmax; on 'river' its cup and its word glow
 *   'messages'       each word's sealed note (s05's envelope, ≈ 40 px) leaves its slip, drops into its own cup and rides
 *                    that cup's stream of light up into bank; stream width ∝ share. The cup levels STAY (they are the
 *                    shares, not used up)
 *   'water's'        the meter comes in 0.3 s before the word (0.53 bar full on it); bank's slip tints gold → water-blue
 * Camera: close on the slip row (1.25×) → pulled back to the table on 'multiply' → after the hold, the whole plate at
 * 1.0× for the pour (slips under the glossary tag, cups and their words above the caption band) → a slow settle.
 * Depth: hazed hall (L2/L3), the plate (L4), the lamp shade (L5, in frame during the close opening), near timber posts
 * left and right (L5, blurred).
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { LAYERS, MOODS, defineShot, mixLab, overscan, withAlpha } from '../../../film';
import { glow, parchmentPlate } from '../../../film/silhouette/metaphors/kit';
import {
  INK,
  INK_FAINT,
  OXBLOOD,
  P,
  arcPts,
  bankMeter,
  clamp01,
  glassCup,
  hallBackdrop,
  ink,
  jug,
  kMirror,
  lampWash,
  lerp,
  lightStream,
  mirrorLoop,
  nearPost,
  plateCords,
  qLantern,
  slipWidth,
  sm,
  softmax,
  tq12,
  vNote,
  win,
  wordSlip,
} from '../sets/ch10-s06-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch10-s06';
const CY = MOODS.serverCyan;

// ------------------------------------------------------------------------------------------- the toy numbers
const WORDS = ['crossed', 'the', 'river', 'bank'];
const Q = [1, 2, 0, 1];
const K = [
  [0, 1, 1, 0],
  [0, 0, 1, 0],
  [2, 1, 0, 0],
  [1, 0, 1, 1],
];
const PROD = K.map((k) => k.map((v, d) => v * Q[d]));
const SCORE = PROD.map((p) => p.reduce((a, b) => a + b, 0)); // 2 0 4 2
const HALF = SCORE.map((s) => s / Math.sqrt(Q.length)); // 1 0 2 1
const SHARE = softmax(HALF); // .197 .072 .534 .197
const MSG = ['action', '', 'water', 'money'];

// ------------------------------------------------------------------------------------------- layout (L4 world px)
const PLATE = { x: 110, y: 30, w: 1060, h: 600 };
const X = [372, 545, 718, 891];
const SLIP_SIZE = 30;
const SLIP_Y = 112;
const SLIP_H = 60;
const RAIL_Y = 66;
const ROW = { k: 232, q: 266, prod: 304, rule: 318, score: 362, half: 406 };
/** after the halving the workings clear and the score rows rise by this much */
const RISE = 176;
const HDR_X = 290;
const CUP = { y: 500, h: 100, w: 72 };
/** under each cup: the half (later its message) and the cup's own word */
const HALF_Y = CUP.y + 34;
const WORD_Y = CUP.y + 66;
const MIR_S = 1.5;
const NOTE_S = 0.62;
/** cup level = share / LVL (so river's 0.53 leaves room above its waterline for the etching) */
const LVL = 0.8;
const BANK = 3;
const slipW = (i: number) => slipWidth(WORDS[i], SLIP_SIZE);
/** bank's lantern hangs from a little arm over the slip's own top-right corner; rises 12 px on 'Bank' */
const LANT = { x: X[BANK] + slipW(BANK) / 2 + 17, y0: SLIP_Y - 4, y1: SLIP_Y - 16 };
/** s05's hand mirror hangs from the rail on its own cord, just left of its slip (glass centre) */
const mirrorAt = (i: number) => ({ x: X[i] - slipW(i) / 2 - 32, y: SLIP_Y + 44 });
/** s05's sealed note hangs from the slip's bottom-right corner (centre) */
const noteAt = (i: number) => ({ x: X[i] + slipW(i) / 2 - 20, y: SLIP_Y + SLIP_H + 20 });
const METER = { x: 984, y: 238 };
const ROWLBL = 28;

const LIGHT = mixLab(CY.halo, CY.core, 0.35);
const CORE = mixLab(CY.core, '#ffffff', 0.3);

interface B {
  D: number;
  slipIn: number[];
  bankWord: number;
  question: number;
  beamAt: number[];
  kRow: number;
  qRow: number;
  multiply: number;
  add: number;
  scores: number;
  spoken: number[];
  halve: number;
  pour: number;
  pourAt: [number, number][];
  jugOut: number;
  far: number;
  river: number;
  messages: number;
  shares2: number;
  water: number;
}

/**
 * close: on the slip row (1.25×) · table: pulled back on 'multiply' to the whole table · pour: after the struck row
 * has held, a slow tilt down and left (≤ 1.15×) that keeps the slips, cups and the cups' words all in frame (the
 * glossary tag owns the top-left; the plate's left margin and the hall's near post sit under it) · full: eased back
 * and right for the messages and the meter · end: a slow settle.
 */
const CAM_CLOSE: Camera3 = { x: 650, y: 160, z: 200, lens: 1 };
const CAM_CLOSE2: Camera3 = { x: 648, y: 168, z: 212, lens: 1 };
const CAM_TABLE: Camera3 = { x: 566, y: 318, z: 96, lens: 1 };
const CAM_TABLE2: Camera3 = { x: 562, y: 320, z: 110, lens: 1 };
/** the whole plate at 1.0×: the slip row sits just under the glossary tag's bottom edge, the cups' words above the caption band */
const CAM_POUR: Camera3 = { x: 640, y: 302, z: 0, lens: 1 };
const CAM_POUR2: Camera3 = { x: 642, y: 304, z: 10, lens: 1 };
const CAM_FULL: Camera3 = { x: 646, y: 312, z: 24, lens: 1 };
const CAM_END: Camera3 = { x: 652, y: 316, z: 44, lens: 1 };
const CAMS = [CAM_CLOSE, CAM_CLOSE2, CAM_TABLE, CAM_TABLE2, CAM_POUR, CAM_POUR2, CAM_FULL, CAM_END];
const mixCam = (a: Camera3, b: Camera3, u: number): Camera3 => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), lens: 1 });
/** the struck row holds until here; only then does anything move toward the pour */
const holdEnd = (b: B) => b.halve + 1.42;
function camAt(t: number, b: B): Camera3 {
  const back0 = b.multiply - 0.45;
  const back1 = back0 + 2.4;
  const pour0 = holdEnd(b);
  const pour1 = pour0 + 2.1;
  const full0 = b.river + 0.35;
  const full1 = full0 + 2.4;
  let c = mixCam(CAM_CLOSE, CAM_CLOSE2, sm(t / back0));
  c = mixCam(c, CAM_TABLE, sm((t - back0) / (back1 - back0)));
  c = mixCam(c, CAM_TABLE2, sm((t - back1) / (pour0 - back1)));
  c = mixCam(c, CAM_POUR, sm((t - pour0) / (pour1 - pour0)));
  c = mixCam(c, CAM_POUR2, sm((t - pour1) / (full0 - pour1)));
  c = mixCam(c, CAM_FULL, sm((t - full0) / (full1 - full0)));
  return mixCam(c, CAM_END, sm((t - full1) / (b.D - full1)));
}

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const pour = T.beat('pour');
    // the jug pours cup by cup; each pour lasts in proportion to its share (river's runs long through 'far bigger')
    // (the halves leave their row at holdEnd and land under the cups before the first pour)
    const p0 = T.beat('halve') + 2.2;
    const total = T.word('L1013', 'shares') + 0.6 - p0 - 3 * 0.18;
    const pourAt: [number, number][] = [];
    let at = p0;
    for (let i = 0; i < 4; i++) {
      const d = Math.max(0.3, total * SHARE[i]);
      pourAt.push([at, at + d]);
      at += d + 0.18;
    }
    const b: B = {
      D,
      // the first slip lands on 'Four' itself, so the number has its image at once
      slipIn: [T.beat('slipsSet'), T.word('L1011', 'the'), T.word('L1011', 'river'), T.word('L1011', 'bank')],
      bankWord: T.word('L1011', 'Bank#2'),
      question: T.beat('query'),
      beamAt: [T.word('L1011', 'up'), T.word('L1011', 'every'), T.word('L1011', 'label'), T.word('L1011', 'label') + 0.45],
      kRow: T.word('L1011', 'scores'),
      qRow: T.word('L1011', "stencil's"),
      multiply: T.beat('dot'),
      add: T.word('L1011', 'add'),
      scores: T.beat('scores'),
      spoken: [T.word('L1012', 'two'), T.word('L1012', 'nothing'), T.word('L1012', 'four'), T.word('L1012', 'two#2')],
      halve: T.beat('halve'),
      pour,
      pourAt,
      jugOut: at + 0.1,
      far: T.word('L1013', 'far'),
      river: T.beat('shares'),
      messages: T.beat('messages'),
      shares2: T.word('L1014', 'shares'),
      water: T.beat('tint'),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    f.camera(camAt(t, b));
    f.backlight({ sunX: 640, sunY: 430, sunRadius: 560, intensity: 0.75 });
    hallBackdrop(f, ID, CAMS, { beamY: -10, dim: 0.12 });
    f.layer('L4', (c, env) => {
      plateCords(c, PLATE, env, -400);
      parchmentPlate(c, { ...PLATE, seed: 1006 }, env);
      lampWash(c, PLATE, 640, 1);
      plate(c, t, b, env);
    });
    f.practical({ x: 640, y: 6, kind: 'lamp', seed: 1006, intensity: 0.72, radius: 64, layer: 'L4' });
    // L5 posts (rest-screen coords): the right one stands just off the plate in the wide end frames; the left one comes
    // into the frame's left edge as the camera tilts down and left for the pour
    nearPost(f, ID, CAMS, 1215, -1, 40, 24, 30);
    nearPost(f, `${ID}-l`, CAMS, 26, 1, 40, 60, 150);
    // L5: the plate lamp's shade hanging into the top of frame (blurred, nearest plane)
    f.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, CAMS, 30);
      f.cached(`${ID}/L5/${env.mood.id}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        cc.fillStyle = env.fill('fg');
        const dy = -105;
        cc.fillRect(637, r.y, 6, -8 + dy - r.y);
        cc.beginPath();
        cc.moveTo(598, 12 + dy);
        cc.quadraticCurveTo(602, -12 + dy, 626, -16 + dy);
        cc.lineTo(654, -16 + dy);
        cc.quadraticCurveTo(678, -12 + dy, 682, 12 + dy);
        cc.closePath();
        cc.fill();
        cc.fillStyle = withAlpha(env.mood.core, 0.5);
        cc.beginPath();
        cc.ellipse(640, 13 + dy, 40, 3.5, 0, 0, Math.PI * 2);
        cc.fill();
      })(c, r.x, r.y);
    });
  },
});

// ================================================================================================= the plate
function plate(c: C, t: number, b: B, env: PaintEnv) {
  const tq = tq12(t);
  // ---------------------------------------------------------------- the tag: the plate's lower-right corner, all shot
  // (a stamped tag with a thin border, so it never reads as one of the cups' words on the same line)
  {
    const tA = win(t, 0.3, 0.75);
    const tx = PLATE.x + PLATE.w - 44;
    const tw = ink(c, 'ILLUSTRATIVE', tx, WORD_Y, { font: 'sc', size: 20, weight: 600, tracking: 2.5, align: 'right', color: mixLab(INK, P.sky[1], 0.3), alpha: tA, legible: true });
    c.save();
    c.globalAlpha *= tA * 0.55;
    c.strokeStyle = mixLab(INK, P.sky[1], 0.3);
    c.lineWidth = 1.2;
    c.strokeRect(tx - tw - 10, WORD_Y - 24, tw + 18, 33);
    c.restore();
  }

  // ---------------------------------------------------------------- the workings clear once they have served
  // the struck row (scores, the pen's halves, the equation) holds complete until holdEnd; then the work rows fade, the
  // scores and equation rise, and the halves drop to the slots under their cups (all before the first pour)
  const H = holdEnd(b);
  const clear = win(t, H, H + 0.55);
  const workA = 1 - clear;
  const rise = -RISE * win(t, H + 0.05, H + 0.7);
  const dimScores = 1 - win(t, H + 0.05, H + 0.7);
  const eqDim = lerp(1, 0.22, win(t, b.messages - 0.7, b.messages + 0.1));
  const yS = ROW.score + rise;
  const yH = ROW.half + rise;

  // ---------------------------------------------------------------- row headers
  const hdr = (text: string, y: number, at: number, a = 1) =>
    ink(c, text, HDR_X, y, { italic: true, size: ROWLBL, align: 'right', color: mixLab(INK, P.sky[1], 0.3), alpha: win(t, at - 0.1, at + 0.4) * a });
  hdr('label', ROW.k, b.kRow, workA);
  hdr('question', ROW.q, b.qRow, workA);
  hdr('multiply, add', ROW.prod, b.multiply, workA);
  hdr('score', yS, b.scores, dimScores);
  hdr('÷ √4', ROW.half, b.halve, dimScores);
  // each half drops from its row to the slot under its own cup (on twos), so the frame reads score → share
  const dropAt = (i: number) => H + 0.1 + i * 0.09;
  const dropK = (i: number) => sm(clamp01((tq - dropAt(i)) / 0.7));
  const halvesOut = 1 - win(t, b.messages - 0.55, b.messages - 0.05);

  // ---------------------------------------------------------------- the rail the slips hang from
  {
    const a = win(t, 0.3, 0.7);
    c.save();
    c.globalAlpha *= a;
    c.strokeStyle = INK;
    c.lineWidth = 2.2;
    c.beginPath();
    c.moveTo(X[0] - 130, RAIL_Y);
    c.lineTo(X[3] + 26, RAIL_Y);
    c.stroke();
    c.fillStyle = INK;
    for (const x of [X[0] - 130, X[3] + 26]) {
      c.beginPath();
      c.arc(x, RAIL_Y, 4.5, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }

  // ---------------------------------------------------------------- the beam of the question (behind the slips)
  const lanternUp = win(t, b.question - 0.35, b.question + 0.35);
  const lantY = lerp(LANT.y0, LANT.y1, win(tq, b.bankWord - 0.1, b.bankWord + 0.4));
  const beamOut = 1 - win(t, b.add + 0.2, b.add + 1.2);
  for (let i = 0; i < 4; i++) {
    const at = b.beamAt[i];
    const d = win(t, at - 0.32, at);
    if (d <= 0 || beamOut <= 0) continue;
    const m = mirrorAt(i);
    const pts = arcPts(LANT.x, lantY + 4, m.x, m.y - 6, -40 - Math.abs(m.x - LANT.x) * 0.1, d, 32);
    const fresh = 1 - 0.6 * win(t, at + 0.4, at + 1.2);
    lightStream(c, pts, 1.8, LIGHT, CORE, 0.8 * fresh * beamOut);
  }

  // ---------------------------------------------------------------- slips, with s05's mirror and sealed note; the lantern
  for (let i = 0; i < 4; i++) {
    const at = b.slipIn[i];
    const a = win(t, at - 0.25, at + 0.15);
    if (a <= 0) continue;
    const swing = (1 - win(tq, at - 0.1, at + 0.7)) * 0.22 * (i % 2 ? 1 : -1);
    const tint = i === BANK ? win(t, b.water - 0.2, b.water + 0.8) : 0;
    const flutter = i === BANK ? 0.05 * Math.sin((tq - b.bankWord) * 9) * (win(tq, b.bankWord - 0.05, b.bankWord + 0.1) - win(tq, b.bankWord + 0.5, b.bankWord + 0.9)) : 0;
    const lit = i === BANK ? 0.6 * win(t, b.water - 0.2, b.water + 0.6) * (1 - 0.5 * win(t, b.water + 1, b.water + 2.5)) : 0;
    // the mirror's cord from the rail, then the mirror (it unfolds on its cord with the slip: cut paper, it scales)
    const m = mirrorAt(i);
    const g = sm(win(tq, at - 0.1, at + 0.45));
    const loopY = m.y - mirrorLoop(MIR_S);
    c.save();
    c.globalAlpha *= a;
    c.strokeStyle = mixLab(INK, P.sky[1], 0.15);
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(m.x, RAIL_Y);
    c.lineTo(m.x, loopY);
    c.stroke();
    c.restore();
    const touched = win(t, b.beamAt[i] - 0.05, b.beamAt[i] + 0.1) * (1 - win(t, b.beamAt[i] + 0.5, b.beamAt[i] + 1.1));
    c.save();
    c.translate(m.x, loopY);
    c.scale(g, g);
    kMirror(c, 0, mirrorLoop(MIR_S), touched, MIR_S, a, INK, env);
    c.restore();
    wordSlip(c, { x: X[i], y: SLIP_Y, text: WORDS[i], size: SLIP_SIZE, h: SLIP_H, alpha: a, rot: swing + flutter, tint, lit, cord: SLIP_Y - RAIL_Y - 10 });
    // the sealed note (message) hangs from the slip's bottom-right corner on a short cord
    const n = noteAt(i);
    const ng = sm(win(tq, at + 0.05, at + 0.6));
    if (ng > 0) {
      c.save();
      c.globalAlpha *= a;
      c.strokeStyle = mixLab(INK, P.sky[1], 0.15);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(n.x, SLIP_Y + SLIP_H - 6);
      c.lineTo(n.x, n.y - 17 * NOTE_S * ng);
      c.stroke();
      c.translate(n.x, n.y - 17 * NOTE_S);
      c.scale(ng, ng);
      vNote(c, 0, 17 * NOTE_S, NOTE_S, 1, 0.03, env);
      c.restore();
    }
  }
  // bank's lantern (its question): hangs from a little wire arm over the slip's own top-right corner (it comes in
  // with the slip), rises 12 px on 'Bank', lights on 'question'
  const lantA = win(t, b.slipIn[BANK] - 0.1, b.slipIn[BANK] + 0.3);
  if (lantA > 0) {
    const cx = X[BANK] + slipW(BANK) / 2 - 3;
    c.save();
    c.globalAlpha *= lantA;
    c.strokeStyle = INK;
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx, SLIP_Y + 3);
    c.lineTo(cx, lantY - 26);
    c.quadraticCurveTo(cx, lantY - 32, cx + 6, lantY - 32);
    c.lineTo(LANT.x, lantY - 32);
    c.stroke();
    c.restore();
    const k = 0.18 + 0.82 * lanternUp - 0.3 * win(t, b.halve, b.halve + 1.5) + 0.25 * win(t, b.messages, b.messages + 0.6);
    qLantern(c, LANT.x, lantY, k, env, 1.3, lantA);
  }

  // ---------------------------------------------------------------- the workings, column by column
  for (let i = 0; i < 4; i++) {
    const x = X[i];
    const kA = win(t, b.kRow + i * 0.12, b.kRow + i * 0.12 + 0.35) * workA;
    nums(c, K[i], x, ROW.k, kA, INK);
    const qA = win(t, b.qRow + i * 0.12, b.qRow + i * 0.12 + 0.4) * workA;
    const drop = (1 - win(t, b.qRow + i * 0.12, b.qRow + i * 0.12 + 0.4)) * -26;
    nums(c, Q, x, ROW.q + drop, qA, mixLab(INK, CY.set, 0.45));
    const mA = win(t, b.multiply + i * 0.18, b.multiply + i * 0.18 + 0.35) * workA;
    if (mA > 0) {
      ink(c, '×', x - 66, (ROW.k + ROW.q) / 2 + 7, { size: 22, color: OXBLOOD, alpha: mA, align: 'center' });
      nums(c, PROD[i], x, ROW.prod, mA, INK, true);
    }
    const aA = win(t, b.add + i * 0.08, b.add + i * 0.08 + 0.35) * workA;
    if (aA > 0) {
      for (let d = 0; d < 3; d++) ink(c, '+', x - 42 + d * 28 + 14, ROW.prod - 2, { size: 17, color: OXBLOOD, alpha: aA * 0.9, align: 'center' });
      c.save();
      c.globalAlpha *= aA;
      c.strokeStyle = INK_FAINT;
      c.lineWidth = 1.3;
      c.beginPath();
      c.moveTo(x - 56, ROW.rule);
      c.lineTo(x - 56 + 112 * aA, ROW.rule);
      c.stroke();
      c.restore();
    }
    // the score
    const sA = win(t, b.scores + i * 0.12, b.scores + i * 0.12 + 0.3) * dimScores;
    if (sA > 0) {
      const sp = b.spoken[i];
      const pulse = win(t, sp - 0.12, sp + 0.05) * (1 - win(t, sp + 0.35, sp + 0.9));
      if (pulse > 0.01) {
        c.save();
        c.globalAlpha *= pulse * 0.6;
        c.fillStyle = withAlpha(P.halo, 0.6);
        c.beginPath();
        c.ellipse(x, yS - 14, 34, 27, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
      ink(c, String(SCORE[i]), x, yS, { font: 'mono', size: 40 + 5 * pulse, weight: 600, align: 'center', alpha: sA });
    }
    // halve: the pen strikes each score on 'halve' (-0.15 s, 0.15 s apart) and writes its half beneath
    const s0 = strikeAt(b, i);
    const strike = win(t, s0, s0 + 0.14);
    if (strike > 0) {
      c.save();
      c.globalAlpha *= dimScores;
      c.strokeStyle = OXBLOOD;
      c.lineWidth = 2.6;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(x - 19, yS - 7);
      c.lineTo(x - 19 + 38 * strike, yS - 19);
      c.stroke();
      c.restore();
    }
    const hA = win(t, s0 + 0.14, s0 + 0.3) * halvesOut;
    if (hA > 0) {
      const k = dropK(i);
      // a gentle arc: out and down, landing under the cup
      const hy = lerp(ROW.half, HALF_Y, k) - Math.sin(k * Math.PI) * 18;
      ink(c, String(HALF[i]), x, hy, { font: 'mono', size: lerp(34, 30, k), weight: 600, align: 'center', color: INK, alpha: hA, draw: win(t, s0 + 0.14, s0 + 0.3) });
    }
  }
  // the pen itself (on twos): visits each column in turn, then lifts away once the fourth half is written
  {
    const st = strikeAt(b, 0);
    const p0 = st - 0.25;
    const p1 = strikeAt(b, 3) + 0.34;
    const a = win(tq, p0, p0 + 0.2) * (1 - win(tq, p1, p1 + 0.3));
    if (a > 0) {
      const k = Math.max(0, Math.min(3.999, (tq - st) / 0.15));
      const i = Math.floor(k);
      const fr = k - i;
      const before = tq < st;
      const px = before ? X[0] - 40 : X[i] - 19 + 38 * Math.min(1, fr / 0.6) + (fr > 0.6 ? 8 : 0);
      const py = before ? yS - 34 : fr < 0.6 ? yS - 9 : yH - 6;
      pen(c, px, py, a);
    }
  }
  // the equation: inked under the halves right after the fourth one is written; it rises with the rows and stays in
  // view through the pour as the recipe
  const eq0 = strikeAt(b, 3) + 0.38;
  const eqA = win(t, eq0, eq0 + 0.5);
  ink(c, '2 · 0 · 4 · 2   ÷ √4   →   1 · 0 · 2 · 1', (X[0] + X[3]) / 2, yH + 50, { italic: true, size: 28, align: 'center', color: INK, alpha: Math.min(1, eqA * 1.6) * eqDim, draw: eqA });

  // ---------------------------------------------------------------- the cups and the jug
  // the four empty cups wait faintly along the bottom from 'Four' on (the frame's destination), then firm up
  const cupsA = win(t, H + 0.3, H + 0.8);
  const etchAt = (i: number) => b.river - 0.7 + i * 0.15;
  for (let i = 0; i < 4; i++) {
    const [a0, a1] = b.pourAt[i];
    const fill = sm(clamp01((t - a0 - 0.12) / (a1 - a0)));
    const level = (SHARE[i] / LVL) * fill;
    const riverGlow = i === 2 ? 1 + 0.7 * win(t, b.river - 0.2, b.river + 0.3) * (1 - win(t, b.river + 1.2, b.river + 2.4)) : 1;
    // the levels stay: they ARE the shares (each message is poured out in that proportion, not used up)
    glassCup(c, {
      x: X[i],
      y: CUP.y,
      w: CUP.w,
      h: CUP.h,
      level,
      light: LIGHT,
      core: CORE,
      alpha: cupsA,
      etch: SHARE[i].toFixed(2),
      etchAlpha: win(t, etchAt(i), etchAt(i) + 0.4),
      etchSize: 22,
      etchLegible: true,
      etchY: 0.82,
      glowK: riverGlow,
    });
    // each cup's own word, etched under it from the pour to the end (river's on 'river' is already there, and
    // brightens with its cup)
    const wA = win(t, H + 0.2, H + 0.7);
    const rv = i === 2 ? win(t, b.river - 0.2, b.river + 0.2) * (1 - 0.6 * win(t, b.river + 1.2, b.river + 2.4)) : 0;
    if (wA > 0) {
      if (rv > 0.01) glow(c, X[i], WORD_Y - 9, 52, P.halo, 0.5 * rv);
      ink(c, WORDS[i], X[i], WORD_Y, { size: 26, weight: rv > 0.3 ? 600 : 500, align: 'center', color: INK, alpha: wA * (0.82 + 0.18 * rv), legible: true });
    }
    const nA = win(t, b.messages - 0.5, b.messages);
    if (MSG[i]) ink(c, MSG[i], X[i], HALF_Y, { italic: true, size: 24, align: 'center', color: mixLab(INK, P.sky[1], 0.3), alpha: nA, legible: true });
  }
  // the jug: comes in from the right, pours into each cup in turn, lifts away
  {
    const inA = win(tq, H + 0.2, H + 0.75);
    const outA = 1 - win(tq, b.jugOut, b.jugOut + 0.5);
    const a = inA * outA;
    if (a > 0) {
      let tx = X[3] + 180;
      let tilt = 0.1;
      let pouring = -1;
      for (let i = 0; i < 4; i++) {
        const [a0, a1] = b.pourAt[i];
        const prevEnd = i ? b.pourAt[i - 1][1] : H + 0.75;
        const mv = sm(clamp01((tq - prevEnd) / Math.max(0.15, a0 - prevEnd)));
        const fromX = i ? X[i - 1] : X[3] + 180;
        if (tq >= prevEnd) tx = lerp(fromX, X[i], mv);
        if (tq >= a0 - 0.1 && tq <= a1 + 0.05) pouring = i;
      }
      if (tq > b.pourAt[3][1]) tx = lerp(X[3], X[3] + 210, sm((tq - b.pourAt[3][1]) / 0.8));
      if (pouring >= 0) {
        const [a0, a1] = b.pourAt[pouring];
        tilt = 0.1 + 0.95 * (sm((tq - a0 + 0.1) / 0.2) - sm((tq - a1) / 0.2));
      }
      const S = 1.05;
      const jugY = CUP.y - CUP.h - 22;
      const lip0 = jug(c, 0, 0, tilt, S, LIGHT, CORE, 0, 0);
      const px = tx + 2 - lip0.lipX;
      const py = jugY - lip0.lipY;
      const remaining = 1 - b.pourAt.reduce((acc, [a0, a1], i) => acc + SHARE[i] * clamp01((t - a0) / (a1 - a0)), 0);
      const lip = jug(c, px, py, tilt, S, LIGHT, CORE, 0.35 + 0.65 * remaining, a);
      if (pouring >= 0) {
        const [a0, a1] = b.pourAt[pouring];
        const flow = win(t, a0, a0 + 0.12) * (1 - win(t, a1 - 0.05, a1 + 0.1));
        if (flow > 0.01) {
          const yEnd = CUP.y - CUP.h * (SHARE[pouring] / LVL) * clamp01((t - a0) / (a1 - a0)) - 2;
          const w = 2 + 8 * SHARE[pouring];
          lightStream(c, [{ x: lip.lipX, y: lip.lipY }, { x: lip.lipX - 3, y: lip.lipY + 14 }, { x: X[pouring] - 2, y: yEnd }], w, LIGHT, CORE, flow * a);
        }
      }
    }
  }

  // ---------------------------------------------------------------- the messages: each word's sealed note leaves its
  // slip, drops into its own cup, and rides that cup's light up into bank; stream width ∝ share (river ≈ 3× the 0.20
  // streams, 'the' a hairline and no label: it hands over almost nothing)
  const target = { x: X[BANK], y: SLIP_Y + SLIP_H - 4 };
  for (let i = 0; i < 4; i++) {
    const m0 = b.messages - 0.35 + i * 0.12;
    const x0 = X[i];
    // the streams leave from the cup's rim (above the etched share, never across it)
    const y0 = CUP.y - CUP.h - 6;
    const tx = target.x - 27 + i * 18;
    const lift = i === BANK ? -40 : -120 - (X[BANK] - x0) * 0.22;
    // 1) the note drops from the slip into the cup (0.55 s), 2) the stream draws up from the cup to bank, 3) the note
    //    rides it
    const n = noteAt(i);
    const fall = clamp01((tq - m0) / 0.55);
    const d = win(t, m0 + 0.45, m0 + 1.25);
    const fade = 1 - win(t, b.water + 0.4, b.D - 1.2);
    if (d > 0 && fade > 0) {
      const pts = arcPts(x0, y0, tx, target.y + 6, lift, d, 36);
      const w = Math.max(0.7, 32 * (SHARE[i] - 0.04));
      lightStream(c, pts, w, LIGHT, CORE, 0.85 * fade);
    }
    const ride = clamp01((tq - m0 - 0.6) / 1.35);
    const noteS = 0.72 + 0.35 * SHARE[i];
    const noteA = (i === 1 ? 0.7 : 1) * win(tq, m0, m0 + 0.12) * (1 - win(ride, 0.85, 1));
    if (fall > 0 && ride < 1 && noteA > 0.01) {
      let nx: number;
      let ny: number;
      let rot = 0;
      if (ride <= 0) {
        const u = sm(fall);
        nx = lerp(n.x, x0, u);
        ny = lerp(n.y, y0 + 4, u * u);
        rot = 0.25 * Math.sin(u * Math.PI) * (i % 2 ? 1 : -1);
      } else {
        const all = arcPts(x0, y0, tx, target.y + 6, lift, 1, 36);
        const k = Math.min(all.length - 1, Math.floor(sm(ride) * (all.length - 1)));
        nx = all[k].x;
        ny = all[k].y;
        rot = 0.15 * Math.sin(k * 0.4);
      }
      glow(c, nx, ny, 40 * noteS, LIGHT, 0.35 * noteA * (0.4 + SHARE[i]));
      vNote(c, nx, ny, lerp(NOTE_S, noteS, sm(clamp01(fall * 1.6))), noteA, rot, env);
    }
  }
  if (t > b.messages && t < b.water + 2) glow(c, target.x, target.y - 24, 80, LIGHT, 0.35 * win(t, b.messages + 0.6, b.shares2) * (1 - win(t, b.water + 0.5, b.water + 2)));

  // ---------------------------------------------------------------- the meter: what bank now means (in 0.3 s before
  // 'water's', the 0.53 bar full on the word)
  const mA = win(t, b.water - 0.55, b.water - 0.25);
  if (mA > 0) bankMeter(c, METER.x, METER.y, mA, win(t, b.water - 0.45, b.water), [
    ['water', SHARE[2]],
    ['action', SHARE[0]],
    ['money', SHARE[3]],
  ]);
}

/** when the pen strikes score i: on 'halve' -0.15 s, 0.15 s apart (all four halves written ~0.8 s after 'halve') */
function strikeAt(b: B, i: number): number {
  return b.halve - 0.15 + i * 0.15;
}

/** a row of four numerals centred on x */
function nums(c: C, v: number[], x: number, y: number, a: number, col: string, bold = false) {
  if (a <= 0.003) return;
  for (let d = 0; d < 4; d++) ink(c, String(v[d]), x - 42 + d * 28, y, { font: 'mono', size: 24, weight: bold ? 600 : 500, align: 'center', color: col, alpha: a });
}

/** a fountain pen in ink silhouette, nib at (x, y) */
function pen(c: C, x: number, y: number, a: number) {
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.rotate(-0.75);
  c.fillStyle = INK;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(5.5, -15);
  c.lineTo(-5.5, -15);
  c.closePath();
  c.fill();
  c.beginPath();
  c.roundRect(-6.5, -84, 13, 70, 5);
  c.fill();
  c.fillStyle = withAlpha(OXBLOOD, 0.9);
  c.fillRect(-6.5, -48, 13, 4);
  c.restore();
}
