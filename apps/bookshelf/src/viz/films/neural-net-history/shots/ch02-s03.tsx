/**
 * ch02-s03 — the Case Board under the desk lamp (candleAmber, plain cut back to the study, 7.67 s).
 *
 * CAMERA: BOARD, on the far-left input column C1 and the oxblood question thread above it.
 *   'wiring' − .56 (pinAssumption)  the detective's hands pin a typed index card in slot C1-a (the footnote
 *                                   slot under column C1's head): the 1943 paper's fifth assumption, verbatim.
 *   line end + .2 (quoteRead)       the camera pushes in on the typed words and HOLDS in the silence, so the
 *                                   sentence is read from the card itself; its attribution sits beneath it.
 *   L0207 start (redThread)         hard cut to the THREAD insert: there is no thread yet. In order, as the
 *                                   script has it: the right hand runs a length of oxblood thread along the
 *                                   board's top edge, right to left (≈4.0–4.6 s), and loops it on the left
 *                                   nail; then the left hand, holding the open-question card by its top edge
 *                                   (thumb and forefinger, clear of the lettering), lets it drop onto the
 *                                   thread at Q1, the first slot (the leftmost, over column C1). The card
 *                                   sways on a damped swing (≈4°, 2–3 cycles). It is HANDWRITTEN (fountain-pen
 *                                   italic) — the open question — unlike the typed fact below it.
 *   line end + .9 (file)            FILE insert, top-down: wordless, a kraft folder under the lamp. The right
 *                                   hand slips the carbon copy in (its top edge shows above the flap); the left
 *                                   hand swings the front flap shut on its hinge and presses it flat.
 * The thread is the canon oxblood (emberRed rim ~60% into candleAmber), a 2–3 px cord whose glint follows the
 * lamp's pool along x. C1 shows a faint ruled column head (the empty slot ch02-s08 fills) with C1-a under it.
 * The hands always come from the lamp side (right); for a pin they come in high, so the arm lies above the
 * card's top edge and the type below stays clear. The board, shelf and Wall come from studyState (STUDY
 * LOCK); this shot animates only C1-a, Q1 and the thread (caseBoard draws the thread from the start of the
 * film's state; this shot masks it until it is strung).
 */
import { Timeline, ease } from '../../../core';
import { CAMERA3_HOME, FONT, LAYERS, defineShot, layerXform, mixLab, toLayer, toScreen, withAlpha } from '../../../film';
import { legibleSize } from '../../../film/silhouette/type';
import type { Camera3, LayerSpec, PaintEnv } from '../../../film';
import { hands } from '../cast';
import { STUDY, STUDY_CAMS, slotWorld, studyCase, studyNear, studyRoom } from '../sets/study';
import { BOARD, SLOTS, boardStateAt } from '../sets/studyState';
import { DEFAULT_POOL, caseBoard, drawCard, oxblood, paperTone, poolAt } from '../sets/caseBoard';
import { HAND_LEN, handsEntry } from '../sets/narratorHands';
import type { HandsPose } from '../sets/narratorHands';
import { CARBON, FLAP_H, carbonCopy, fileInsertDesk, folderGeo, kraftFolder } from '../sets/ch02-s03-file';

type C2 = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ------------------------------------------------------------------------------------------------ geometry
const B = STUDY.board;
const C1A = SLOTS['C1-a'];
const CARD_PIN = slotWorld('C1-a', 'pin');
const CARD_C = slotWorld('C1-a', 'centre');
/** the hand carries each card by its TOP-RIGHT CORNER (board units in from the corner), so the hand, which
 *  comes in from the lamp side, stays off the card's type; the card is pinned / clipped at its own centre-top */
const GRIP_IN = { x: 9, y: 5 };
const gripOf = (cx: number, top: number, w: number) => ({ x: cx + (w / 2 - GRIP_IN.x) * B.k, y: top + GRIP_IN.y * B.k });
const CARD_GRIP = gripOf(CARD_C.x, CARD_C.y - (C1A.h / 2) * B.k, C1A.w);
/** the question thread's sag (caseBoard's own curve) and the Q1 clip point, world */
const sagAt = (bx: number) => B.y + BOARD.threadY * B.k + Math.sin(((bx - 40) / 920) * Math.PI) * 10 * B.k;
const Q1X = 270;
const Q_CLIP = { x: B.x + Q1X * B.k, y: sagAt(Q1X) };
const Q_DEF = { id: 'Q-Q1', w: 168, h: 44, icon: 'question' as const, text: '' };
/** the open question, in two handwritten lines */
const Q_LINES = ['How could a net', 'rewire itself?'];
/** the Q card's centre hangs 32 units under its clip on the thread */
const Q_CARD_C = { x: Q_CLIP.x, y: Q_CLIP.y + (10 + 22) * B.k };

/** cameras: the C1 column medium, the push on the card (read), the thread + card, (FILE is its own plate) */
const CAM_COL: Camera3 = { x: 420, y: 214, z: 330, lens: 1 };
/** the read: the card CENTRED (the push trucks right onto it); the margin suspects fall off into the dark at left */
const READ_S = (1000 * 2.0) / (1000 - 470);
const CAM_READ: Camera3 = { x: CARD_C.x, y: CARD_C.y + 16, z: 470, lens: 2.0 };
/** the thread insert: one framing that holds the thread and Q1 in the upper third and C1-a (at ~70% of its read
 *  size) below them, so the assumption stays up and legible through L0207 */
// (revised: framed ~12% wider and lower so the thread sits ~75 px under the frame's top edge and the hands that
// run it and hang Q1 are seen coming in from the top right)
const CAM_Q: Camera3 = { x: 404, y: 184, z: 242, lens: 1.76 };
/** a hair of drift through the thread insert (a held insert, not a move) */
const CAM_Q1: Camera3 = { x: 407, y: 186, z: 256, lens: 1.76 };
/** a near plane (between the board and the lens): the desk lamp clamped over the board, its shade and brass arm
 *  soft across the top-right corner (world-fixed in each section, so it slides against the board on every move) */
const NEAR: LayerSpec = { id: 'ch02-s03-near', z: 880, haze: 0, blur: 6 };
/** the lit lantern card set aside by C1's empty head (the AND lantern lifted off ch02-s02's plate, now a small
 *  paper-cut card); ch02-s08 pins it into C1 */
const LANTERN_AT = { x: slotWorld('C1').x - 10, y: slotWorld('C1').y + 8, rot: -0.13 };
/** the attribution slip pinned with the card, directly beneath it: world size fixed for the read framing
 *  (≈24 px cap at 1080p there) */
const ATTR_FS = 6.7;
/** the most the slip's type may grow (world px) when the read push raises it to the floor */
const ATTR_MAX = 8;
const CAMS = [CAM_COL, CAM_READ, CAM_Q, CAM_Q1, STUDY_CAMS.board];
function mixCam(a: Camera3, b: Camera3, u: number): Camera3 {
  const sa = (1000 * a.lens) / (1000 - a.z), sb = (1000 * b.lens) / (1000 - b.z);
  const s = Math.exp(lerp(Math.log(sa), Math.log(sb), u));
  const lens = Math.exp(lerp(Math.log(a.lens), Math.log(b.lens), u));
  return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: 1000 - (1000 * lens) / s, lens };
}

interface Beats {
  pin: number;
  read: number;
  q: number;
  file: number;
  cutQ: number;
  cutFile: number;
  D: number;
}

/** a card held at its pin: the fingers pinch where the brass pin will go */
function heldCard(def: { id: string; w: number; h: number; icon: 'typed' | 'question'; text?: string }, light: number) {
  return (c: C2, at: { x: number; y: number }, _h: unknown, env: PaintEnv) => {
    const k = B.k;
    drawCard(c, def, { x: at.x - (def.w / 2 - GRIP_IN.x) * k, y: at.y + (def.h / 2 - GRIP_IN.y) * k, k, light, pin: false }, env);
  };
}

/** the open-question card: the same card stock, the question in a fountain-pen italic hand (ink), not typed */
function questionCard(c: C2, x: number, y: number, light: number, env: PaintEnv, rot = 0) {
  const k = B.k;
  drawCard(c, Q_DEF, { x, y, k, light, pin: false, rot }, env);
  const paper = paperTone(env, light);
  const ink = mixLab(env.mood.ink, paper, 0.05);
  c.save();
  c.translate(x, y);
  c.rotate(rot + 0.012);
  c.fillStyle = ink;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  // the question is READ under L0207: the hand is sized to the legibility floor through the camera (capped to the card)
  const fs = Math.min(19.5 * k, legibleSize(c, `italic 500 ${15.5 * k}px ${FONT.text}`, 15.5 * k) * 1.05);
  c.font = `italic 500 ${fs}px ${FONT.text}`;
  Q_LINES.forEach((l, i) => {
    // a hand, not a font: each line sits a hair off the last
    c.save();
    c.translate((i === 0 ? -3 : 4) * k, (i - 0.5) * fs * 1.04 + 1 * k);
    c.rotate(i === 0 ? -0.018 : 0.01);
    c.fillText(l, 0, 0);
    c.restore();
  });
  c.restore();
}

/** the board-local lamp pool (for the thread's glint ramp and the cards' light) */
const BPOOL = { ...STUDY.pool, cx: STUDY.pool.cx - B.x, cy: STUDY.pool.cy - B.y, k: 1 };
/** the oxblood cord: the canon mix, a touch deeper so it reads as thread and not a pale line */
const cordColor = (env: PaintEnv) => oxblood(env, 0.06);
/** ~2-2.5 px on the thread insert at 720 (wider than the first cut's near-black hairline) */
const CORD_W = 1.3;

/** the oxblood thread between board x a..b (board units); its glint lives only in the lamp's pool (an alpha
 *  ramp along x from the pool's falloff); `end` replaces the b end with a free point (the hand's fingers) */
function threadSpan(c: C2, env: PaintEnv, a: number, b: number, end?: { x: number; y: number }, cam?: Camera3) {
  const k = B.k;
  if (b <= a) return;
  const pts: { x: number; y: number; bx: number }[] = [];
  pts.push({ x: B.x + a * k, y: sagAt(a), bx: a });
  for (let bx = Math.ceil(a / 20) * 20; bx < b; bx += 20) if (bx > a) pts.push({ x: B.x + bx * k, y: sagAt(bx), bx });
  pts.push(end ? { ...end, bx: b } : { x: B.x + b * k, y: sagAt(b), bx: b });
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = cordColor(env);
  c.lineWidth = CORD_W * k;
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.stroke();
  // the glint: a thin lifted stroke along the cord's top, per segment, alpha = the pool's light (squared, so
  // it dies before the pool's rim)
  c.lineWidth = CORD_W * 0.45 * k;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], q = pts[i];
    const L = poolAt(BPOOL, (p.bx + q.bx) / 2, BOARD.threadY);
    const al = 0.75 * L * L;
    if (al < 0.02) continue;
    c.strokeStyle = withAlpha(oxblood(env, 0.62), al);
    c.beginPath();
    c.moveTo(p.x, p.y - CORD_W * 0.3 * k);
    c.lineTo(q.x, q.y - CORD_W * 0.3 * k);
    c.stroke();
  }
  // the glint where the lamp's pool crosses the cord in frame (screen x ≈ 300-700): an additive warm highlight
  if (cam) {
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'butt';
    c.lineWidth = CORD_W * 0.7 * k;
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], q = pts[i];
      const sx = toScreen(LAYERS.L4, cam, (p.x + q.x) / 2, (p.y + q.y) / 2).x;
      const w = Math.exp(-(((sx - 500) / 170) ** 2));
      if (w < 0.03) continue;
      c.strokeStyle = withAlpha(mixLab(oxblood(env, 0.5), env.mood.core, 0.35), 0.55 * w);
      c.beginPath();
      c.moveTo(p.x, p.y - CORD_W * 0.25 * k);
      c.lineTo(q.x, q.y - CORD_W * 0.25 * k);
      c.stroke();
    }
  }
  c.restore();
}

/** the two brass nails the cord is tied between (board furniture: there from the start) */
function nails(c: C2, env: PaintEnv) {
  const k = B.k;
  for (const bx of [40, 960]) {
    const X = B.x + bx * k, Y = sagAt(bx);
    c.fillStyle = withAlpha(env.mood.fg, 0.45);
    c.beginPath();
    c.arc(X + 1.2 * k, Y + 1.5 * k, 3 * k, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = mixLab(env.mood.halo, env.mood.set, 0.4);
    c.beginPath();
    c.arc(X, Y, 3 * k, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(env.mood.core, 0.35 * poolAt(BPOOL, bx, BOARD.threadY));
    c.beginPath();
    c.arc(X - 0.9 * k, Y - 0.9 * k, 1.1 * k, 0, Math.PI * 2);
    c.fill();
  }
}

/** C1's column head: a faint pencil-ruled header strip over the empty head slot (ch02-s08 pins the C1 card
 *  there), so C1-a reads as the footnote slot directly beneath the column's head */
function c1Head(c: C2, env: PaintEnv) {
  const k = B.k;
  const S = SLOTS.C1;
  const x0 = B.x + (S.x - S.w / 2 - 10) * k, x1 = B.x + (S.x + S.w / 2 + 10) * k;
  const yh = B.y + (S.y - S.h / 2 - 12) * k;
  c.save();
  c.strokeStyle = withAlpha(env.mood.fg, 0.42);
  c.lineWidth = 1.1 * k;
  c.beginPath();
  c.moveTo(x0, yh);
  c.lineTo(x1, yh);
  c.moveTo(x0, yh + 5 * k);
  c.lineTo(x1, yh + 5 * k);
  // end ticks
  c.moveTo(x0, yh - 3 * k);
  c.lineTo(x0, yh + 8 * k);
  c.moveTo(x1, yh - 3 * k);
  c.lineTo(x1, yh + 8 * k);
  c.stroke();
  // the empty head slot, ruled faintly in pencil (dashed): the column's place, waiting
  c.strokeStyle = withAlpha(env.mood.fg, 0.2);
  c.lineWidth = 0.9 * k;
  c.setLineDash([4 * k, 4 * k]);
  c.strokeRect(B.x + (S.x - S.w / 2) * k, B.y + (S.y - S.h / 2) * k, S.w * k, S.h * k);
  c.setLineDash([]);
  // the column's two edge rules running down past C1-a, very faint
  c.strokeStyle = withAlpha(env.mood.fg, 0.1);
  c.beginPath();
  c.moveTo(x0, yh + 8 * k);
  c.lineTo(x0, B.y + (C1A.y + C1A.h / 2 + 18) * k);
  c.moveTo(x1, yh + 8 * k);
  c.lineTo(x1, B.y + (C1A.y + C1A.h / 2 + 18) * k);
  c.stroke();
  c.restore();
}

/** hide caseBoard's thread (and its nails): repaint a thin band along it from the same board drawn 24 units
 *  HIGHER, so the band shows plain cork from just below it (shifting the board down instead pulled the
 *  frame's inner lip into the band: a dark clipped stroke at the top-left corner) */
function maskThread(c: C2, env: PaintEnv) {
  const k = B.k;
  const band = new Path2D();
  band.moveTo(B.x + 30 * k, sagAt(30) - 6 * k);
  for (let bx = 40; bx <= 970; bx += 10) band.lineTo(B.x + bx * k, sagAt(Math.min(960, bx)) - 6 * k);
  for (let bx = 970; bx >= 30; bx -= 10) band.lineTo(B.x + bx * k, sagAt(Math.max(40, Math.min(960, bx))) + 6 * k);
  band.closePath();
  const pool = { ...STUDY.pool, k: 1 };
  c.save();
  c.clip(band);
  c.translate(0, -24 * k);
  caseBoard(c, { ...STUDY.board, state: boardStateAt('ch02-s03', 'start'), pool: { ...DEFAULT_POOL, ...pool, cx: pool.cx - STUDY.board.x, cy: pool.cy - STUDY.board.y } }, env);
  c.restore();
}

export default defineShot({
  id: 'ch02-s03',
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: Beats = {
      pin: T.beat('pinAssumption'),
      read: T.beat('quoteRead'),
      q: T.beat('redThread'),
      file: T.beat('file'),
      // the thread insert is a hard cut just before L0207, after >= 1.2 s of still frame on the quote
      cutQ: T.line('L0207').start - 0.08,
      // the question card holds clear until just before the 'file' beat
      cutFile: T.beat('file') - 0.1,
      D,
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = twos(t);
    const b = scene.b;

    // ================================================================ FILE insert (top-down), wordless
    if (t >= b.cutFile) {
      // a slow dolly down toward the folder (true parallax between the desk, the inkwell and the lamp shade)
      const cu = sm((t - b.cutFile) / (b.D - b.cutFile));
      f.camera({ ...CAMERA3_HOME, x: 640 + 10 * cu, z: 46 * cu });
      f.backlight({ intensity: 0.15 });
      const FX = 610, FY = 286;
      const g = folderGeo(FX, FY);
      // the carbon: carried in from the lower right under the right hand, filed at `carbonIn`
      const c0 = b.cutFile - 0.12;
      const carbonIn = b.cutFile + 0.3;
      const cu0 = sm((tq - c0) / (carbonIn - c0));
      const filedAt = { x: g.left + 30, y: g.top + 8, rot: -0.008 };
      const fromAt = { x: 1010, y: 560, rot: -0.16 };
      const carbonAt = { x: lerp(fromAt.x, filedAt.x, cu0), y: lerp(fromAt.y, filedAt.y, cu0), rot: lerp(fromAt.rot, filedAt.rot, cu0) };
      const filed = tq >= carbonIn;
      // the flap: a hinge about the spine, open (−1) → shut (+1) over 0.5 s, landing at ~7.4 s
      // (the filed carbon's first typed line reads for ~0.5 s before the flap rises over it)
      const flapB = Math.min(b.D - 0.36, b.file + 1.05);
      const flapA = flapB - 0.5;
      const phi = Math.PI * sm((tq - flapA) / (flapB - flapA));
      const flap = -Math.cos(phi);
      // the hands (on twos): RIGHT carries the carbon in and lets go; LEFT lifts the flap's free edge over and
      // presses it flat. Both come from the lamp side (lower right).
      const scale = 1.25;
      const len = HAND_LEN * scale;
      const ER = { x: 1460, y: 840 }, EL = { x: 1340, y: 930 };
      const pose: HandsPose = { scale };
      // right: the socket pinches the carbon's right edge, a third of the way down
      const gx0 = CARBON.w - 14, gy0 = CARBON.h * 0.33;
      const grip = (a: { x: number; y: number; rot: number }) => ({ x: a.x + gx0 * Math.cos(a.rot) - gy0 * Math.sin(a.rot), y: a.y + gx0 * Math.sin(a.rot) + gy0 * Math.cos(a.rot) });
      if (tq < carbonIn) pose.right = hands.reach(ER, grip(carbonAt), 'pinch', len, { held: 'none' });
      else if (tq < carbonIn + 0.1) pose.right = hands.reach(ER, grip(filedAt), 'open', len, { held: 'none' });
      else {
        const wu = sm((tq - carbonIn - 0.1) / 0.45);
        const gp = grip(filedAt);
        if (wu < 1) pose.right = hands.reach(ER, { x: lerp(gp.x, ER.x - 60, wu), y: lerp(gp.y, ER.y - 40, wu) }, 'rest', len, { held: 'none' });
      }
      // left: reach the open flap's free edge, swing it over with the hinge, press flat, withdraw
      const edgeAt = (fl: number) => ({ x: FX + 70, y: g.spine - fl * FLAP_H + 4 });
      const l0 = flapA - 0.4;
      if (tq >= l0) {
        if (tq < flapA) {
          const e = edgeAt(-1);
          const u = sm((tq - l0) / 0.4);
          pose.left = hands.reach(EL, { x: lerp(EL.x - 120, e.x, u), y: lerp(EL.y - 140, e.y, u) }, 'pinch', len, { held: 'none' });
        } else if (tq < flapB) pose.left = hands.reach(EL, edgeAt(flap), 'pinch', len, { held: 'none' });
        else if (tq < flapB + 0.18) pose.left = hands.reach(EL, { x: FX + 60, y: g.spine - FLAP_H * 0.42 }, 'flat', len, { held: 'none' });
        else {
          const wu = sm((tq - flapB - 0.18) / 0.4);
          if (wu < 1) pose.left = hands.reach(EL, { x: lerp(FX + 60, EL.x - 80, wu), y: lerp(g.spine - FLAP_H * 0.42, EL.y - 60, wu) }, 'rest', len, { held: 'none' });
        }
      }
      // the lamp's pool: the desk falls off into the dark toward the frame edges (exposure, not a veil)
      const pool = (c: C2, env: PaintEnv) => {
        c.save();
        // the banker's lamp is off the upper right: an oval pool on the folder, falling off down-left
        c.translate(820, 230);
        c.scale(1.3, 1);
        const gr = c.createRadialGradient(0, 0, 120, 0, 0, 760);
        gr.addColorStop(0, withAlpha(env.mood.fg, 0));
        gr.addColorStop(0.45, withAlpha(env.mood.fg, 0.2));
        gr.addColorStop(0.8, withAlpha(env.mood.fg, 0.55));
        gr.addColorStop(1, withAlpha(env.mood.fg, 0.74));
        c.fillStyle = gr;
        c.fillRect(-1400, -1000, 2800, 2000);
        c.restore();
      };
      f.layer('L4', (c, env) => {
        fileInsertDesk(f, c, FX, FY, env);
        kraftFolder(f, c, { x: FX, y: FY, flap, carbon: filed ? 1 : 0 }, env);
        // the carbon in flight lies over the open flap (it is filed under it)
        if (!filed && tq >= c0) carbonCopy(c, carbonAt.x, carbonAt.y, carbonAt.rot, env, f.pxScale);
        pool(c, env);
        hands.draw(c, pose, env);
      });
      // nearer the lens than the desk: the inkwell's mouth and its dip pen (L5), the banker's lamp shade (L6)
      f.layer('L5', (c, env) => {
        f.cached(`ch02-s03/fileInk/${env.mood.id}`, 360, 360, (cc) => {
          cc.translate(180, 180);
          topInkwell(cc, env);
        })(c, 70 - 180, 640 - 180);
      });
      f.practical({ x: 1180, y: 60, kind: 'lamp', seed: 41, intensity: 0.5, radius: 90 });
      f.layer('L6', (c, env) => {
        f.cached(`ch02-s03/fileShade/${env.mood.id}`, 520, 360, (cc) => {
          cc.translate(260, 120);
          topShade(cc, env);
        })(c, 1250 - 260, -40 - 120);
      });
      return;
    }

    // ================================================================ BOARD
    // camera: column medium → push in on the card (read, held) → HARD CUT to the thread insert (held, a hair
    // of drift): no whip-pan across the board
    let cam: Camera3;
    // the read push starts on the pin (~0.9 s) and runs 1.9 s on the film's move ease; then a still hold on the
    // quote to the cut (>= 1.2 s)
    const pushAt = b.pin + 0.53;
    const PUSH_DUR = 1.9;
    const readAt = pushAt;
    const COL1 = { ...CAM_COL, z: 342, x: 412, y: 219 };
    const inQ = t >= b.cutQ;
    if (t < pushAt) cam = mixCam(CAM_COL, COL1, t / pushAt);
    else if (!inQ) cam = mixCam(COL1, CAM_READ, ease.move(clamp01((t - pushAt) / PUSH_DUR)));
    else cam = mixCam(CAM_Q, CAM_Q1, sm((t - b.cutQ) / (b.cutFile - b.cutQ)));
    f.camera(cam);
    studyRoom(f, { key: 'ch02-s03', cams: CAMS });

    // the hands come in from the lamp side (right) but HIGH, so the arm lies above the card's top edge
    const entry = {
      // (far beyond the right edge: the retreat ends AT the entry, which must be well out of frame)
      R: toLayer(LAYERS.L4, cam, 2000, 10),
      L: toLayer(LAYERS.L4, cam, 2000, 260),
    };
    // the pin action: placed (thumb on the pin) on the pinAssumption beat; on twos
    const pinDur = 1.4;
    const pin0 = b.pin + 0.18 - 0.45 * pinDur;
    const uPin = clamp01((tq - pin0) / pinDur);
    const pinPose = uPin > 0 && uPin < 0.92 ? hands.act('pin', uPin, CARD_GRIP, { held: 'card', entry, scale: 0.7 }) : null;
    const lightC = poolAt(BPOOL, C1A.x, C1A.y);
    const lightQ = poolAt(BPOOL, Q1X, BOARD.threadY + 40);
    const placedC = uPin >= 0.45 || tq >= pin0 + pinDur;

    // ---- the THREAD insert, in the script's order: run the thread (≈4.0–4.6 s), THEN the card drops and sways
    const runEnd = b.q + 0.53;
    const tie = runEnd + 0.12;
    const BX_IN = 660; // board x where the right hand starts (beyond the frame's right edge)
    const runU = sm((tq - b.cutQ) / (runEnd - b.cutQ));
    const handBx = lerp(BX_IN, 40, runU);
    const handLen = HAND_LEN * 0.72;
    const qPose: HandsPose = { scale: 0.72 };
    let threadEnd: { x: number; y: number } | null = null; // the cord's free end while it is being run
    if (inQ) {
      const nail = { x: B.x + 40 * B.k, y: sagAt(40) };
      // right hand: pinches the cord's end and lays it along the top edge, right to left; loops it on the nail;
      // lifts away up and to the right
      let sock: { x: number; y: number } | null = null;
      if (tq < runEnd) sock = { x: B.x + handBx * B.k, y: sagAt(handBx) - 1.5 };
      else if (tq < tie) sock = { x: nail.x + 2, y: nail.y + 3 * Math.sin(((tq - runEnd) / (tie - runEnd)) * Math.PI) };
      else {
        const wu = sm((tq - tie) / 0.42);
        if (wu < 1) sock = { x: lerp(nail.x, nail.x + 240, wu), y: lerp(nail.y, nail.y - 200, wu) };
      }
      if (sock) {
        qPose.right = hands.reach({ x: sock.x + 300, y: sock.y - 270 }, sock, 'pinch', handLen, { held: 'none' });
        if (tq < runEnd) threadEnd = hands.socket(qPose, 'right');
      }
      // left hand: brings the card in high (after the cord has passed Q1), holds it by its top edge with thumb and
      // forefinger just above the cord, lets it drop at runEnd, opens, and lifts away
      // (revised) it enters from the top right on the line's start (~4.0 s) in 2-3 drawings on twos, holds the card
      // over its slot, and releases at ~4.6 s
      const l0 = b.q - 0.08;
      if (tq >= l0) {
        // pinched at the card's top-right corner, above the lettering
        const gripPt = (dy: number) => ({ x: Q_CARD_C.x + 76 * B.k, y: Q_CARD_C.y - (Q_DEF.h / 2) * B.k + 2 * B.k + dy });
        const held = gripPt(-14 * B.k);
        let lsock: { x: number; y: number } | null = null;
        let shape: 'pinch' | 'open' | 'rest' = 'pinch';
        if (tq < runEnd - 0.04) {
          const u = sm((tq - l0) / 0.42);
          lsock = { x: lerp(held.x + 190, held.x, u), y: lerp(held.y - 170, held.y, u) };
        } else if (tq < runEnd) lsock = held;
        else if (tq < runEnd + 0.12) {
          lsock = { x: held.x + 4, y: held.y - 6 };
          shape = 'open';
        } else {
          const wu = sm((tq - runEnd - 0.12) / 0.4);
          if (wu < 1) lsock = { x: lerp(held.x + 4, held.x + 200, wu), y: lerp(held.y - 6, held.y - 190, wu) };
          shape = 'rest';
        }
        if (lsock) qPose.left = hands.reach({ x: lsock.x + 260, y: lsock.y - 300 }, lsock, shape, handLen, { held: tq < runEnd ? 'card' : 'none' });
      }
    }
    const cardHeld = inQ && tq >= b.q - 0.08 && tq < runEnd;
    const cardHung = inQ && tq >= runEnd;

    studyCase(f, {
      shot: 'ch02-s03',
      when: 'start',
      key: 'ch02-s03',
      extra: (c, env) => {
        // the column head of C1 (faint, ruled), then the thread: none on the board until the insert lays it
        c1Head(c, env);
        maskThread(c, env);
        nails(c, env);
        if (inQ) {
          if (threadEnd) threadSpan(c, env, Math.max(40, (threadEnd.x - B.x) / B.k), 960, undefined, cam);
          else threadSpan(c, env, 40, 960, undefined, cam);
          // the loose end in the fingers: the short run from the board line up to the pinch
          if (threadEnd) {
            const bx = Math.max(40, (threadEnd.x - B.x) / B.k);
            c.save();
            c.strokeStyle = cordColor(env);
            c.lineWidth = CORD_W * B.k;
            c.lineCap = 'round';
            c.beginPath();
            c.moveTo(B.x + bx * B.k, sagAt(bx));
            c.lineTo(threadEnd.x, threadEnd.y);
            c.stroke();
            c.restore();
          }
        }
        // the hand-off from ch02-s02: the lit AND lantern, now a small paper-cut card, has just been set down
        // beside C1's empty head (it rocks to rest on twos in the first 0.35 s; its wick stays lit)
        lanternCard(c, env, tq);
        // C1-a: pinned on the beat (a small settle on twos as the pin bites), its attribution slip under it
        if (placedC) {
          const settle = (1 - sm((tq - (pin0 + 0.45 * pinDur)) / 0.25)) * 0.035;
          attributionSlip(c, env, lightC);
          drawCard(c, { ...C1A }, { x: CARD_C.x, y: CARD_C.y, k: B.k, light: lightC, rot: settle }, env);
        }
        // Q1: the first open-question card drops onto the cord and sways on a damped swing (≈4°, 2–3 cycles)
        if (cardHung) {
          const tp = tq - runEnd;
          const drop = (1 - sm(tp / 0.1)) * -14 * B.k;
          // ~3° decaying over ~1.5 s
          const sway = 0.052 * Math.exp(-tp * 2.1) * Math.sin((tp / 0.62) * Math.PI * 2 + 0.35) * (tp > 0.05 ? 1 : 0);
          c.save();
          c.translate(Q_CLIP.x, Q_CLIP.y + drop);
          c.rotate(sway);
          c.strokeStyle = cordColor(env);
          c.lineWidth = 1.1 * B.k;
          c.beginPath();
          c.moveTo(0, -2 * B.k);
          c.lineTo(0, 10 * B.k);
          c.stroke();
          // the clip: a small brass loop over the cord
          c.strokeStyle = mixLab(env.mood.halo, env.mood.set, 0.35);
          c.lineWidth = 1.2 * B.k;
          c.beginPath();
          c.arc(0, 0, 2.6 * B.k, Math.PI * 0.9, Math.PI * 2.1);
          c.stroke();
          questionCard(c, 0, (10 + 22) * B.k, lightQ, env);
          c.restore();
        }
        // the hands, in the board's plane while they touch it
        if (pinPose) hands.draw(c, pinPose, env, { heldDraw: heldCard({ id: C1A.id, w: C1A.w, h: C1A.h, icon: 'typed', text: C1A.text }, lightC) });
        if (qPose.right || qPose.left)
          hands.draw(c, qPose, env, {
            // the card hangs from the left hand's pinch at its top edge, 52 units right of centre (over no lettering)
            heldDraw: (cc, at, _h, e) => {
              if (!cardHeld) return;
              questionCard(cc, at.x - 76 * B.k, at.y - 2 * B.k + (Q_DEF.h / 2) * B.k, lightQ, e);
            },
          });
      },
    });
    // the lamp's pool on the board: bright around the card in play, falling off to the right and the edges
    // (screen-locked exposure, not a veil), and a faint low fog sheet
    {
      // an oval pool centred on the card in play (C1-a; in the insert, between Q1 and C1-a), falling to about
      // half brightness at the frame edges: the thread glints only inside it
      const c = f.c;
      const subj = inQ ? { x: (Q_CARD_C.x + CARD_C.x) / 2, y: (Q_CARD_C.y + CARD_C.y) / 2 } : CARD_C;
      const sp = toScreen(LAYERS.L4, cam, subj.x, subj.y);
      // the hot spot: the lamp's beam lands on the card in play (~+20% value there), soft-edged
      c.save();
      c.globalCompositeOperation = 'soft-light';
      c.translate(sp.x, sp.y);
      c.scale(1.3, 1);
      const hs = c.createRadialGradient(0, 0, 0, 0, 0, 300);
      hs.addColorStop(0, withAlpha(f.mood.core, 0.55));
      hs.addColorStop(0.5, withAlpha(f.mood.halo, 0.28));
      hs.addColorStop(1, withAlpha(f.mood.halo, 0));
      c.fillStyle = hs;
      c.fillRect(-320, -320, 640, 640);
      c.globalCompositeOperation = 'lighter';
      const hl = c.createRadialGradient(0, 0, 0, 0, 0, 220);
      hl.addColorStop(0, withAlpha(f.mood.halo, 0.07));
      hl.addColorStop(1, withAlpha(f.mood.halo, 0));
      c.fillStyle = hl;
      c.fillRect(-240, -240, 480, 480);
      c.restore();
      c.save();
      c.translate(sp.x, sp.y);
      c.scale(1.45, 1);
      // ... falling to dark at the frame edges
      const g = c.createRadialGradient(0, 0, 90, 0, 0, 560);
      g.addColorStop(0, withAlpha(f.mood.fg, 0));
      g.addColorStop(0.4, withAlpha(f.mood.fg, 0.2));
      g.addColorStop(0.75, withAlpha(f.mood.fg, 0.56));
      g.addColorStop(1, withAlpha(f.mood.fg, 0.76));
      c.fillStyle = g;
      c.fillRect(-1400, -1400, 2800, 2800);
      c.restore();
      // the read: the margin suspects (left) drop ~40% further into the falloff, so the assumption is the subject
      const dimL = !inQ ? sm((t - readAt) / 1.0) : 0;
      if (dimL > 0.01) {
        c.save();
        const gl = c.createLinearGradient(0, 0, 460, 0);
        gl.addColorStop(0, withAlpha(f.mood.fg, 0.62 * dimL));
        gl.addColorStop(0.7, withAlpha(f.mood.fg, 0.4 * dimL));
        gl.addColorStop(1, withAlpha(f.mood.fg, 0));
        c.fillStyle = gl;
        c.fillRect(0, 0, 460, 720);
        c.restore();
      }
    }
    f.fog({ yCenter: 560, height: 260, alpha: 0.13, drift: 7 });
    // the near plane: a faint haze sheet in the lamp's beam (between the board and the lamp), then the lamp itself,
    // its shade and brass arm soft across the top-right corner, world-fixed per section (true parallax on the push)
    {
      // the lamp hangs at the frame's top-right in each framing and drifts out toward the corner as the camera
      // pushes (a near object leaving faster than the board), growing with its true layer scale (softened)
      const pu = inQ ? sm((t - b.cutQ) / (b.cutFile - b.cutQ)) : clamp01((t - pushAt) / PUSH_DUR);
      const anchor = inQ ? toLayer(NEAR, cam, lerp(1182, 1196, pu), lerp(30, 24, pu)) : toLayer(NEAR, cam, lerp(1150, 1222, ease.move(pu)), lerp(52, 14, ease.move(pu)));
      const kNow = layerXform(NEAR, cam).k;
      const lampK = Math.sqrt(LAMP_KREF / kNow);
      const beamTo = inQ ? { x: (Q_CARD_C.x + CARD_C.x) / 2, y: (Q_CARD_C.y + CARD_C.y) / 2 } : CARD_C;
      f.layer(NEAR, (c, env) => {
        lampBeamHaze(c, env, anchor, toLayer(NEAR, cam, toScreen(LAYERS.L4, cam, beamTo.x, beamTo.y).x, toScreen(LAYERS.L4, cam, beamTo.x, beamTo.y).y), t);
        c.save();
        c.translate(anchor.x, anchor.y);
        c.scale(lampK, lampK);
        f.cached(`ch02-s03/lamp2/${env.mood.id}`, 520, 420, (cc) => {
          cc.translate(170, 170);
          deskLamp(cc, env);
        })(c, -170, -170);
        c.restore();
        // the bulb's glow under the shade (the visible practical)
        const fl = 1 + 0.025 * Math.sin(t * 7.1) + 0.015 * Math.sin(t * 17.3);
        c.save();
        c.globalCompositeOperation = 'lighter';
        const gx = anchor.x - 6 * lampK, gy = anchor.y + 14 * lampK;
        const gg = c.createRadialGradient(gx, gy, 0, gx, gy, 64 * fl * lampK);
        gg.addColorStop(0, withAlpha(env.mood.core, 0.75));
        gg.addColorStop(0.3, withAlpha(env.mood.halo, 0.32));
        gg.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = gg;
        c.fillRect(gx - 70 * lampK, gy - 70 * lampK, 140 * lampK, 140 * lampK);
        c.restore();
      });
    }
    // the desk and the lamp at lower right (only while the camera is far enough back for the near plane)
    // (the shared L6 occluders are off: at this close board camera L6 is scaled ~14x and would black out the pin)
    if (cam.z < 380) studyNear(f, { key: 'ch02-s03', cams: CAMS, file: true, occluders: false });

    void boardStateAt;
  },
});

/** the small lit lantern card (SLOTS.C1's card, unpinned, askew), rocking to rest on twos in the first 0.35 s */
function lanternCard(c: C2, env: PaintEnv, tq: number) {
  const k = B.k;
  const u = sm(tq / 0.35);
  const rock = (1 - u) * 0.16 * Math.cos(tq * 22);
  const drop = (1 - u) * -6 * k;
  const C1 = SLOTS.C1;
  const light = poolAt(BPOOL, C1.x, C1.y);
  c.save();
  // it lies against the board, so a deeper contact shadow than a pinned card's
  c.fillStyle = withAlpha(env.mood.fg, 0.4);
  c.translate(LANTERN_AT.x + 3 * k, LANTERN_AT.y + 5 * k);
  c.rotate(LANTERN_AT.rot + rock);
  c.fillRect((-C1.w / 2) * k, (-C1.h / 2) * k, C1.w * k, C1.h * k);
  c.restore();
  drawCard(c, { ...C1 }, { x: LANTERN_AT.x, y: LANTERN_AT.y + drop, k, light, pin: false, rot: LANTERN_AT.rot + rock, lanternLit: 1 }, env);
  // the wick still burns: a small warm glow over the card's lantern window (the one saturated accent)
  const fl = 1 + 0.06 * Math.sin(tq * 9.1) + 0.04 * Math.sin(tq * 23.3);
  const gx = LANTERN_AT.x + Math.sin(LANTERN_AT.rot) * 8 * k, gy = LANTERN_AT.y + drop - 10 * k;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(gx, gy, 0, gx, gy, 46 * k * fl);
  g.addColorStop(0, withAlpha(env.mood.core, 0.38));
  g.addColorStop(0.35, withAlpha(env.mood.halo, 0.16));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(gx - 50 * k, gy - 50 * k, 100 * k, 100 * k);
  c.restore();
}

/** the attribution: a narrow paper slip tucked under C1-a's bottom edge, set in ink (no plate, no glow) */
function attributionSlip(c: C2, env: PaintEnv, light: number) {
  const k = B.k;
  const ATTR = '— McCulloch & Pitts, 1943';
  // sized through the live camera: at the read push it is raised to the legibility floor (it is part of the quote
  // the viewer reads); in the column medium it stays small, a slip under the card (capped at ATTR_MAX world px)
  const fs = Math.min(ATTR_MAX * k, legibleSize(c, `italic 500 ${ATTR_FS * k}px ${FONT.text}`, ATTR_FS * k, ATTR) * 1.04);
  c.save();
  c.font = `italic 500 ${fs}px ${FONT.text}`;
  const tw = c.measureText(ATTR).width;
  c.restore();
  const w = Math.max(102 * k, tw + 12 * k), h = Math.max(15 * k, fs * 1.55);
  const x = CARD_C.x + 2 * k, y = CARD_C.y + (C1A.h / 2) * k + h / 2 - 0.5 * k;
  const paper = paperTone(env, light * 0.92);
  c.save();
  c.translate(x, y);
  c.rotate(0.012);
  c.fillStyle = withAlpha(env.mood.fg, 0.32);
  c.fillRect(-w / 2 + 1.6 * k, -h / 2 + 2.2 * k, w, h);
  c.fillStyle = paper;
  c.fillRect(-w / 2, -h / 2, w, h);
  c.fillStyle = mixLab(env.mood.ink, paper, 0.04);
  c.font = `italic 500 ${fs}px ${FONT.text}`;
  c.textAlign = 'center';
  // alphabetic baseline, centred on the slip by the cap height (the legibility audit reads 'middle' text short)
  c.textBaseline = 'alphabetic';
  c.fillText(ATTR, 0, 0.6 * k + c.measureText('H').actualBoundingBoxAscent / 2);
  c.restore();
}

/** the lamp's mouth (NEAR layer px) in each section: top-right of the hold framings (the read, the thread insert) */
/** the lamp's drawn size is referenced to the column medium's layer scale (it grows ~sqrt of its true growth) */
const LAMP_KREF = layerXform(NEAR, { ...CAM_COL, z: 342, x: 412, y: 219 }).k;

/** a clamp-on desk lamp over the board, seen from below and in front (origin = the shade's mouth centre): a
 *  dark conical shade tipped toward the board, its lit inner lip, a brass knuckle and arm running off up-right */
function deskLamp(c: C2, env: PaintEnv) {
  const P = env.mood;
  const brass = mixLab(mixLab(P.halo, P.set, 0.45), P.fg, 0.35);
  // the arm: two parallel brass rods up and out of frame, with a lit edge
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = mixLab(brass, P.fg, 0.35);
  c.lineWidth = 9;
  c.beginPath();
  c.moveTo(22, -40);
  c.lineTo(160, -175);
  c.lineTo(340, -190);
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(P.halo, P.rim, 0.4), 0.55);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(18, -46);
  c.lineTo(156, -181);
  c.lineTo(340, -196);
  c.stroke();
  // the knuckle
  c.fillStyle = brass;
  c.beginPath();
  c.arc(22, -40, 9, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // the shade: a cone from the knuckle down to the mouth (tipped ~25° toward the board, lower left)
  c.save();
  c.rotate(0.42);
  c.fillStyle = P.fg;
  c.beginPath();
  c.moveTo(-14, -58);
  c.lineTo(14, -58);
  c.quadraticCurveTo(40, -30, 66, 0);
  c.lineTo(-66, 0);
  c.quadraticCurveTo(-40, -30, -14, -58);
  c.closePath();
  c.fill();
  // the shade's lit back edge (the brass rim catching the bulb)
  c.strokeStyle = withAlpha(mixLab(P.halo, P.rim, 0.5), 0.5);
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(14, -58);
  c.quadraticCurveTo(40, -30, 66, 0);
  c.stroke();
  // the mouth: an ellipse whose inner face glows
  const mouth = c.createLinearGradient(0, -8, 0, 12);
  mouth.addColorStop(0, mixLab(P.halo, P.core, 0.4));
  mouth.addColorStop(1, mixLab(P.halo, P.set, 0.3));
  c.fillStyle = mouth;
  c.beginPath();
  c.ellipse(0, 0, 66, 12, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = P.fg;
  c.lineWidth = 3;
  c.stroke();
  c.restore();
}

/** a faint sheet of haze lit in the lamp's beam, from the shade's mouth toward the subject (screen blend, drifting) */
function lampBeamHaze(c: C2, env: PaintEnv, from: { x: number; y: number }, to: { x: number; y: number }, t: number) {
  const P = env.mood;
  const dx = to.x - from.x, dy = to.y - from.y;
  const L = Math.hypot(dx, dy) || 1;
  c.save();
  c.globalCompositeOperation = 'screen';
  c.translate(from.x, from.y);
  c.rotate(Math.atan2(dy, dx));
  // the cone of the beam, widening toward the board
  const cone = new Path2D();
  cone.moveTo(0, -30);
  cone.lineTo(L * 1.15, -L * 0.42);
  cone.lineTo(L * 1.15, L * 0.42);
  cone.lineTo(0, 30);
  cone.closePath();
  const g = c.createLinearGradient(0, 0, L * 1.15, 0);
  g.addColorStop(0, withAlpha(mixLab(P.haze, P.halo, 0.5), 0.12));
  g.addColorStop(0.6, withAlpha(P.haze, 0.05));
  g.addColorStop(1, withAlpha(P.haze, 0));
  c.fillStyle = g;
  c.fill(cone);
  // slow drifting motes of haze inside it
  for (let i = 0; i < 3; i++) {
    const u = 0.25 + 0.25 * i + 0.04 * Math.sin(t * 0.3 + i * 2.1);
    const x = L * u, y = L * 0.12 * Math.sin(t * 0.22 + i * 1.3);
    const r = L * (0.22 + 0.06 * i);
    const m = c.createRadialGradient(x, y, 0, x, y, r);
    m.addColorStop(0, withAlpha(P.haze, 0.05));
    m.addColorStop(1, withAlpha(P.haze, 0));
    c.fillStyle = m;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  c.restore();
}

/** the inkwell seen from above: a square glass bottle's shoulders, its round mouth, the dip pen rising out of it */
function topInkwell(c: C2, env: PaintEnv) {
  const P = env.mood;
  c.fillStyle = P.fg;
  c.beginPath();
  c.roundRect(-92, -92, 184, 184, 26);
  c.fill();
  // the lamp catches the shoulder nearest it (upper right)
  c.strokeStyle = withAlpha(P.rim, 0.3);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-60, -90);
  c.lineTo(66, -90);
  c.quadraticCurveTo(90, -90, 90, -66);
  c.lineTo(90, 40);
  c.stroke();
  c.fillStyle = mixLab(P.fg, P.ink, 0.6);
  c.beginPath();
  c.arc(0, 0, 40, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = P.fg;
  c.save();
  c.rotate(-0.75);
  c.beginPath();
  c.roundRect(-7, -170, 14, 176, 7);
  c.fill();
  c.restore();
}

/** the banker's lamp shade from above, at the corner nearest the lens: a dark curved hood with a lit inner lip */
function topShade(c: C2, env: PaintEnv) {
  const P = env.mood;
  c.fillStyle = P.fg;
  c.beginPath();
  c.ellipse(0, 0, 230, 120, -0.25, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(P.halo, P.rim, 0.5), 0.45);
  c.lineWidth = 5;
  c.beginPath();
  c.ellipse(0, 0, 226, 116, -0.25, 0.55 * Math.PI, 1.15 * Math.PI);
  c.stroke();
}
