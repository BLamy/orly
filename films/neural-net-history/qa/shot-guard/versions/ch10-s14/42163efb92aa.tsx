/**
 * ch10-s14 — the writing half (serverCyan; 23.6 s; crossfade in from the study shelf).
 *
 * The loom of light in the hall, now shown as the whole original translator: two looms side by side. Each half's
 * attention loom is a frame: its words hang on slips along the top beam (the words being looked at) and down the
 * left cord (the words doing the looking); at every crossing a lantern-glass cup holds that pair's share of the
 * jug (a real softmax of seeded toy scores: illustrative weights, real arithmetic). Ghost frames stacked behind each
 * loom stand for its other blocks.
 *   reading half (left)   English: the cat sat on the mat. Every word looks both ways (no mask).
 *   writing half (right)  German: die Katze saß auf der … . The ORIGINAL decoder was already masked: its forward
 *                         crossings are empty ghost glasses from frame 0 and its cups hold the masked softmax.
 *   threads of light run from the reading half into the writing half, drawn as ch10-s10's ribbons (halo, core, a bead);
 *   ghost frames stacked behind each loom (its other blocks) carry s10's "× 6".
 *   'halves'   a faint vertical seam of light between the looms (where the blade will fall); on 'read' the reading half
 *              is outlined in light, on 'wrote' the writing half.
 *   'kept'     a paper blade drops along the seam and cuts the bridge; the reading half drifts back into the haze; a
 *              screen-locked chip: "decoder only" · Liu et al., Google · Jan 2018 · OpenAI GPT · June 2018 ("GPT"
 *              brightening on 'G P T'), while the camera starts a slow ~6 s push onto the writing half.
 *   'curtain'  the triangular black card is flown in from above on two cords (0.6 s), landing ~15.0 s, translucent.
 *   'back'     the fourth word's cord lights and its light runs back along its row to the words before it.
 *   'ahead'    the curtain makes the existing rule explicit: each slack forward ghost thread whips back and breaks
 *              (0.15 s) and its ghost glass goes dark (0.3 s); only then does the card go opaque.
 *   'next'     a teaser only: one blank type sort rises into a ghost slot at the end of the top row and hangs there,
 *              unset, through the hold, in a soft cyan halo (the frame's one accent) while the cups dim ~30% and the
 *              camera drifts ~40 px toward it. The shot ends on it (the X-ray beat and the clue card open ch11-s01).
 */
import { Timeline, gaussian, mulberry32 } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { LAYERS, defineShot, mixLab, withAlpha } from '../../../film';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { FONT, legibleSize } from '../../../film/silhouette/type';
import { camKeys } from '../sets/ch03-s06-kit';
import { screenPass } from '../sets/ch06-s01-kit';
import { CY, clamp01, glassCup, hallBackdrop, ink, lerp, sm, tq12, win, wordSlip } from '../sets/ch10-s06-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch10-s14';

// ------------------------------------------------------------------------------------------------ the two looms
const CELL = 58;
const Y0 = 236;
const BEAM_Y = 158;
const KEY_TOP = 176;
const EN = ['the', 'cat', 'sat', 'on', 'the', 'mat'];
const DE = ['die', 'Katze', 'saß', 'auf', 'der'];
interface LoomGeo {
  x0: number;
  n: number;
  qx: number;
  words: string[];
}
const RD: LoomGeo = { x0: 240, n: 6, qx: 196, words: EN };
const WR: LoomGeo = { x0: 754, n: 5, qx: 710, words: DE };
const cx = (g: LoomGeo, j: number) => g.x0 + (j + 0.5) * CELL;
const cy = (i: number) => Y0 + (i + 0.5) * CELL;
const x1 = (g: LoomGeo) => g.x0 + g.n * CELL;
const y1 = (g: LoomGeo) => Y0 + g.n * CELL;
const GHOST = { x: cx(WR, 5) + 8, y: KEY_TOP };

/** real softmax attention over seeded toy query/key vectors (d = 8), with and without the causal mask */
function attention(n: number, seed: number, causal: boolean): number[][] {
  const g = gaussian(mulberry32(seed));
  const d = 8;
  const Q = Array.from({ length: n }, () => Array.from({ length: d }, () => g()));
  const K = Array.from({ length: n }, () => Array.from({ length: d }, () => g()));
  return Q.map((q, i) => {
    const s = K.map((k, j) => (causal && j > i ? -Infinity : (1.7 * k.reduce((a, v, e) => a + v * q[e], 0)) / Math.sqrt(d)));
    const m = Math.max(...s);
    const e = s.map((v) => (v === -Infinity ? 0 : Math.exp(v - m)));
    const z = e.reduce((a, b) => a + b, 0);
    return e.map((v) => v / z);
  });
}
const A_RD = attention(6, 2017, false);
const A_WR_MASK = attention(5, 2018, true);

// the curtain: a stepped triangle over every crossing with j > i (writing loom)
// it hangs just above its seat, inside the loom's span (behind the key slips: it never hides a word)
const CURTAIN_HANG = { dx: 0, dy: -40 };
function curtainPath(): Path2D {
  const p = new Path2D();
  const x0 = WR.x0, n = WR.n, pad = 3;
  p.moveTo(x0 + CELL - pad, Y0 - pad - 10);
  p.lineTo(x0 + n * CELL + pad + 4, Y0 - pad - 10);
  p.lineTo(x0 + n * CELL + pad + 4, Y0 + (n - 1) * CELL + pad);
  for (let k = n - 1; k >= 1; k--) {
    p.lineTo(x0 + k * CELL - pad, Y0 + k * CELL + pad);
    p.lineTo(x0 + k * CELL - pad, Y0 + (k - 1) * CELL + pad);
  }
  p.closePath();
  return p;
}
const CURTAIN = curtainPath();
const CURTAIN_DIAG = {
  x0: WR.x0 + CELL - 3,
  y0: Y0 - 13,
  x1: WR.x0 + WR.n * CELL + 7,
  y1: Y0 + (WR.n - 1) * CELL + 3,
};
/** the stepped (hypotenuse) edge of the curtain, as an open path */
function curtainStepPath(): Path2D {
  const p = new Path2D();
  const x0 = WR.x0, n = WR.n, pad = 3;
  p.moveTo(x0 + n * CELL + pad + 4, Y0 + (n - 1) * CELL + pad);
  for (let k = n - 1; k >= 1; k--) {
    p.lineTo(x0 + k * CELL - pad, Y0 + k * CELL + pad);
    p.lineTo(x0 + k * CELL - pad, Y0 + (k - 1) * CELL + pad);
  }
  p.lineTo(x0 + CELL - pad, Y0 - pad - 10);
  return p;
}
const CURTAIN_STEPS = curtainStepPath();

interface B {
  D: number;
  halves: number;
  wrote: number;
  cut: number;
  openai: number;
  gpt: number;
  curtain: number;
  back: number;
  masked: number;
  next: number;
  cam: (t: number) => Camera3;
  cams: Camera3[];
}

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      halves: T.beat('halves'),
      wrote: T.word('L1032', 'wrote'),
      cut: T.beat('cut'),
      openai: T.word('L1032', 'Open'),
      gpt: T.word('L1032', 'G'),
      curtain: T.beat('curtainKept'),
      back: T.word('L1033', 'back'),
      masked: T.beat('masked'),
      next: T.beat('ghostSlot'),
      cam: () => ({ x: 640, y: 360, z: 0, lens: 1 }),
      cams: [],
    };
    // (round-2) after the cut a slow ~6 s push onto the writing half (truck ~3%) keeps the camera moving under the
    // chip, so it is already travelling when 'curtain' arrives; from 21 s a 40 px drift toward the ghost slot
    b.cam = camKeys([
      [0, 642, 392, 22],
      [b.cut, 652, 388, 44],
      [b.cut + 1.0, 690, 382, 64],
      [b.curtain - 0.2, 800, 364, 170],
      [b.curtain + 0.8, 930, 350, 300],
      [b.masked + 0.6, 926, 350, 316],
      [Math.max(b.masked + 1.2, b.next - 0.2), 932, 342, 322],
      [D, 962, 326, 352],
    ]);
    for (let i = 0; i <= 30; i++) b.cams.push(b.cam((D * i) / 30));
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    const cam = b.cam(t);
    f.camera(cam);
    f.backlight({ sunX: 700, sunY: 430, sunRadius: 520, intensity: 0.8 });
    hallBackdrop(f, ID, b.cams, { dim: 0.12 });

    const drift = sm((t - b.cut - 0.25) / 1.7);
    // ---- ghost frames behind each loom: its other blocks, in the haze
    f.layer('L3', (c, env) => {
      ghostFrames(c, env, RD, 1 - 0.85 * drift, -150 * drift);
      ghostFrames(c, env, WR, 1 - 0.85 * win(t, b.curtain - 1.6, b.curtain), 0);
    });
    // ---- the looms
    const dimK = 0.3 * win(t, b.next - 0.1, b.next + 1.4); // the cups dim over the hold: the slot is the last thing seen
    f.layer('L4', (c, env) => {
      seam(c, env, t, b);
      // the word slips' type, raised to the legibility floor at this camera (computed once, outside the drift)
      const slipSize = Math.min(26, legibleSize(c, `500 20px ${FONT.text}`, 20, 'Katze'));
      // the reading half (drifts back into the haze after the cut)
      if (drift < 0.995) {
        c.save();
        const k = 1 - 0.12 * drift;
        const ox = (RD.x0 + x1(RD)) / 2;
        c.translate(ox - 190 * drift, 380 - 14 * drift);
        c.scale(k, k);
        c.translate(-ox, -380);
        c.globalAlpha *= 1 - 0.9 * drift;
        loom(c, env, t, b, RD, (i, j) => A_RD[i][j], () => 1, () => 0, -1, 0, undefined, slipSize, 0);
        c.restore();
      }
      bridge(c, env, t, b);
      // the writing half. (round-2 science) the ORIGINAL decoder was already masked: its forward crossings are true
      // empty ghost glasses from frame 0 (level exactly 0), and its backward cups hold the masked softmax throughout.
      // On 'ahead' the curtain makes that existing rule explicit: each slack forward ghost thread whips back and
      // breaks (0.15 s) and its ghost glass goes dark (0.3 s).
      const snapAt = (i: number) => b.masked - 0.06 + i * 0.05;
      const level = (i: number, j: number) => (j > i ? 0 : A_WR_MASK[i][j]);
      const fwdA = (i: number, j: number) => (j > i ? 0.55 * (1 - 0.5 * sm((t - snapAt(i)) / 0.3)) : 1);
      const snapU = (i: number, j: number) => (j > i ? clamp01((t - snapAt(i)) / 0.3) : 0);
      const rowLit = win(t, b.back - 0.25, b.back + 0.2) * (1 - win(t, b.masked + 1.4, b.masked + 2.4));
      loom(c, env, t, b, WR, level, fwdA, snapU, rowLit > 0.01 ? 3 : -1, rowLit, () => curtain(c, env, t, b), slipSize, dimK);
      ghostSlot(c, env, t, b);
      outlines(c, env, t, b, drift);
      blade(c, env, t, b);
    });
    f.rim({ x: 0.1, y: -1 });
    // the decoder-only chip, screen-locked in the emptied left half (it carries the shot's date)
    screenPass(f, (c) => decoderChip(c, f, t, b));
  },
});

// =====================================================================================================
function ghostFrames(c: C, env: PaintEnv, g: LoomGeo, a: number, dx: number) {
  if (a <= 0.01) return;
  const set = env.fill('set');
  c.save();
  c.globalAlpha *= a;
  // (round-2, s10's "× 6") the stacked blocks read clearly: five ghost frames behind the loom, labelled × 6
  for (let k = 5; k >= 1; k--) {
    const ox = dx + k * 16, oy = -k * 12;
    c.strokeStyle = withAlpha(mixLab(set, env.mood.rim, 0.4), 0.8 - k * 0.09);
    c.lineWidth = 6;
    c.strokeRect(g.x0 - 10 + ox, BEAM_Y + oy, g.n * CELL + 20, y1(g) - BEAM_Y + 22);
    c.lineWidth = 1;
    c.strokeStyle = withAlpha(env.mood.rim, 0.07);
    for (let j = 0; j < g.n; j++) {
      c.beginPath();
      c.moveTo(cx(g, j) + ox, BEAM_Y + oy + 8);
      c.lineTo(cx(g, j) + ox, y1(g) + oy + 16);
      c.stroke();
    }
  }
  // the count, on the back frame's top-right corner (as in ch10-s10: attention → feed-forward, × 6)
  ink(c, '× 6', x1(g) + 10 + dx + 5 * 16 + 4, BEAM_Y - 5 * 12 - 10, { size: 22, font: 'text', italic: true, align: 'right', color: mixLab(env.mood.rim, env.mood.core, 0.4), alpha: 0.9, legible: true });
  c.restore();
}

/** one attention loom: frame, warp/weft, key slips on the beam, query slips on the cord, a cup per crossing */
function loom(
  c: C,
  env: PaintEnv,
  t: number,
  b: B,
  g: LoomGeo,
  level: (i: number, j: number) => number,
  fwdA: (i: number, j: number) => number,
  snapU: (i: number, j: number) => number,
  litRow = -1,
  litK = 0,
  beforeSlips?: () => void,
  slipSize = 22,
  dimK = 0,
) {
  const m = env.mood;
  const ink0 = env.fill('ink');
  const X1 = x1(g), Y1 = y1(g);
  // frame: two uprights with finials, the top beam and the breast beam
  c.fillStyle = ink0;
  for (const px of [g.x0 - 12, X1 + 12]) {
    c.fillRect(px - 5, BEAM_Y - 26, 10, Y1 - BEAM_Y + 96);
    c.beginPath();
    c.arc(px, BEAM_Y - 32, 8, 0, Math.PI * 2);
    c.fill();
  }
  c.fillRect(g.x0 - 22, BEAM_Y - 8, X1 - g.x0 + 44, 14);
  c.fillRect(g.x0 - 22, Y1 + 12, X1 - g.x0 + 44, 10);
  // the query cord down the left
  c.fillRect(g.qx - 1, BEAM_Y, 2, Y1 - BEAM_Y);
  // warp and weft (faint)
  c.lineWidth = 1;
  c.strokeStyle = withAlpha(m.rim, 0.16);
  c.beginPath();
  for (let j = 0; j < g.n; j++) {
    c.moveTo(cx(g, j), BEAM_Y + 6);
    c.lineTo(cx(g, j), Y1 + 12);
  }
  for (let i = 0; i < g.n; i++) {
    c.moveTo(g.qx + 26, cy(i) - 6);
    c.lineTo(X1 + 8, cy(i) - 6);
  }
  c.stroke();
  // the threads of light at each crossing (alpha ∝ that pair's weight), snapping where masked
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < g.n; i++)
    for (let j = 0; j < g.n; j++) {
      const w = level(i, j);
      const a = fwdA(i, j);
      const su = snapU(i, j);
      const x = cx(g, j), ytop = cy(i) - CELL / 2 + 3, ybot = cy(i) - 2;
      const col = mixLab(m.halo, m.core, 0.4);
      const dk = 1 - dimK;
      if (su <= 0) {
        c.strokeStyle = withAlpha(col, (0.12 + 1.6 * w) * a * dk);
        c.lineWidth = 1 + 4 * w;
        c.beginPath();
        c.moveTo(x, ytop);
        c.lineTo(x, ybot);
        c.stroke();
      } else if (su < 1) {
        // the snap: the slack ghost thread pulls taut (a flash), whips back and parts in 0.15 s, then its ends fade
        const whip = clamp01(su / 0.5);
        const fade = 1 - clamp01((su - 0.5) / 0.5);
        const mid = (ytop + ybot) / 2;
        const curl = 14 * Math.sqrt(whip);
        c.strokeStyle = withAlpha(mixLab(col, '#ffffff', 0.3), 0.75 * fade);
        c.lineWidth = 1.6;
        c.beginPath();
        c.moveTo(x, ytop);
        c.quadraticCurveTo(x - curl * 0.5, mid - 4 - whip * 8, x - curl, mid - 2 - whip * 14);
        c.moveTo(x, ybot);
        c.quadraticCurveTo(x + curl * 0.5, mid + 4 + whip * 4, x + curl, mid + 2 + whip * 8);
        c.stroke();
        glow(c, x, mid, 18 * (1 - whip * 0.6), m.core, 0.9 * fade * (1 - 0.5 * whip));
      }
    }
  // the looking row's light (row litRow): from its slip along the weft to each word it may see
  if (litRow >= 0 && litK > 0.01) {
    const y = cy(litRow) - 6;
    const reach = cx(g, litRow) + CELL * 0.35;
    const gr = c.createLinearGradient(g.qx, 0, reach + 40, 0);
    gr.addColorStop(0, withAlpha(m.core, 0.75 * litK));
    gr.addColorStop(0.85, withAlpha(m.core, 0.5 * litK));
    gr.addColorStop(1, withAlpha(m.core, 0));
    c.strokeStyle = gr;
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(g.qx + 24, y);
    c.lineTo(reach + 40, y);
    c.stroke();
  }
  c.restore();
  // cups
  for (let i = 0; i < g.n; i++)
    for (let j = 0; j < g.n; j++) {
      const w = level(i, j);
      const a = fwdA(i, j);
      glassCup(c, { x: cx(g, j), y: cy(i) + CELL / 2 - 6, w: 30, h: 28, level: w, light: m.halo, core: m.core, ink: mixLab(ink0, m.rim, 0.18), alpha: a, glowK: 0.8 * (1 - dimK) });
    }
  beforeSlips?.();
  // key slips on the beam (the words looked at)
  for (let j = 0; j < g.n; j++) wordSlip(c, { x: cx(g, j), y: KEY_TOP, w: 56, h: 38, size: slipSize, text: g.words[j], lit: 0.25 });
  // query slips on the cord (the words looking)
  for (let i = 0; i < g.n; i++) {
    const lit = i === litRow ? 0.25 + 0.75 * litK : 0.25;
    wordSlip(c, { x: g.qx, y: cy(i) - 18, w: 60, h: 36, size: slipSize, text: g.words[i], lit });
    if (i === litRow && litK > 0.01) glow(c, g.qx, cy(i), 40, m.core, 0.35 * litK);
  }
  void t;
  void b;
}

/** threads of light from the reading half into the writing half (the original's bridge); cut on 'kept' */
function bridge(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const cutX = (x1(RD) + WR.qx) / 2;
  const su = clamp01((tq12(t) - b.cut + 0.02) / 0.7);
  const fade = 1 - su;
  if (fade <= 0.01) return;
  const on = win(t, 0.2, 1.4);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    const xa = x1(RD) + 14, ya = cy(i) - 6;
    const xb = WR.qx - 30, yb = BEAM_Y + 30 + i * 6;
    const pulse = 0.75 + 0.25 * Math.sin(t * 2.2 - i * 0.7);
    if (su <= 0) {
      // (round-2) drawn as ch10-s10's ribbons: a soft halo band, a bright core, and a lantern bead riding each
      const path = () => {
        c.beginPath();
        c.moveTo(xa, ya);
        c.bezierCurveTo(xa + 60, ya, xb - 70, yb, xb, yb);
      };
      path();
      c.strokeStyle = withAlpha(m.halo, 0.16 * on * pulse);
      c.lineWidth = 9;
      c.stroke();
      c.strokeStyle = withAlpha(mixLab(m.halo, m.core, 0.3), 0.55 * on * pulse);
      c.lineWidth = 3;
      c.stroke();
      c.strokeStyle = withAlpha(mixLab(m.core, '#ffffff', 0.3), 0.6 * on);
      c.lineWidth = 1.1;
      c.stroke();
      const u = (t * 0.35 + i * 0.17) % 1;
      const v = 1 - u;
      const px = v * v * v * xa + 3 * v * v * u * (xa + 60) + 3 * v * u * u * (xb - 70) + u * u * u * xb;
      const py = v * v * v * ya + 3 * v * v * u * ya + 3 * v * u * u * yb + u * u * u * yb;
      glow(c, px, py, 10, m.core, 0.5 * on);
      continue;
    }
    c.strokeStyle = withAlpha(mixLab(m.halo, m.core, 0.3), 0.6 * on * fade * pulse);
    c.lineWidth = 2.2;
    c.beginPath();
    {
      // two recoiling halves
      const pull = 40 * Math.sqrt(su);
      c.moveTo(xa, ya);
      c.bezierCurveTo(xa + 30, ya, cutX - 30 - pull, (ya + yb) / 2 + 20 * su, cutX - 6 - pull, (ya + yb) / 2 + 30 * su);
      c.moveTo(xb, yb);
      c.bezierCurveTo(xb - 30, yb, cutX + 30 + pull, (ya + yb) / 2 - 10 * su, cutX + 6 + pull, (ya + yb) / 2 + 10 * su);
    }
    c.stroke();
  }
  c.restore();
}

/** the paper blade: a long paper-knife silhouette that slices down between the halves on 'kept' (on twos), its
 *  edge catching the cyan; it holds in frame half a second after the cut, then lifts away */
function blade(c: C, env: PaintEnv, t: number, b: B) {
  const u = clamp01((tq12(t) - (b.cut - 0.3)) / 0.36);
  const out = win(t, b.cut + 0.75, b.cut + 1.1);
  if (u <= 0 || out >= 1) return;
  const x = (x1(RD) + WR.qx) / 2;
  const L = 560;
  const tip = lerp(-120, 640, sm(u)) - 140 * out;
  const hiltY = tip - L * 0.8;
  const m = env.mood;
  c.save();
  c.globalAlpha *= 1 - out;
  // the edge's glow first (a cold line of light along the cutting edge)
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = withAlpha(m.halo, 0.45);
  c.lineWidth = 7;
  c.beginPath();
  c.moveTo(x - 1, tip);
  c.lineTo(x - 11, hiltY);
  c.stroke();
  c.restore();
  // the blade: a long tapering sliver 22 px wide at the hilt, a spine, then guard and grip
  c.fillStyle = mixLab(env.fill('ink'), '#000000', 0.3);
  c.beginPath();
  c.moveTo(x, tip);
  c.quadraticCurveTo(x + 9, tip - L * 0.4, x + 11, hiltY);
  c.lineTo(x - 11, hiltY);
  c.quadraticCurveTo(x - 9, tip - L * 0.45, x, tip);
  c.closePath();
  c.fill();
  c.fillRect(x - 28, hiltY - 9, 56, 9);
  c.beginPath();
  c.roundRect(x - 8, tip - L, 16, L * 0.2 - 9, 5);
  c.fill();
  c.beginPath();
  c.arc(x, tip - L - 4, 8, 0, Math.PI * 2);
  c.fill();
  // the edge catching the cyan rim, and a fold line down the spine (paper)
  c.strokeStyle = withAlpha(mixLab(m.core, '#ffffff', 0.25), 0.95);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x, tip);
  c.quadraticCurveTo(x - 9, tip - L * 0.45, x - 11, hiltY);
  c.stroke();
  c.strokeStyle = withAlpha(m.rim, 0.35);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x + 1, tip - 30);
  c.lineTo(x + 2, hiltY);
  c.stroke();
  c.restore();
  // the cut's flash where it passes the bridge
  const by = BEAM_Y + 160;
  if (tip > by - 40 && tip < by + 220 && out <= 0) glow(c, x, by + 40, 70, m.core, 0.5 * (1 - clamp01((t - b.cut) / 0.6)));
}

/** the halves outlined in light, in turn */
function outlines(c: C, env: PaintEnv, t: number, b: B, drift: number) {
  const gone = 1 - win(t, b.cut - 0.4, b.cut);
  if (gone <= 0.01) return;
  const box = (g: LoomGeo) => ({ x: g.qx - 44, y: BEAM_Y - 58, w: x1(g) + 34 - (g.qx - 44), h: y1(g) + 40 - (BEAM_Y - 58) });
  const draw = (g: LoomGeo, at: number) => {
    const u = sm(clamp01((t - at) / 0.75));
    if (u <= 0) return;
    const r = box(g);
    const per = 2 * (r.w + r.h);
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(env.mood.core, 0.7 * gone * (1 - drift));
    c.lineWidth = 2;
    c.setLineDash([per * u, per]);
    c.beginPath();
    c.roundRect(r.x, r.y, r.w, r.h, 10);
    c.stroke();
    c.restore();
  };
  draw(RD, b.halves - 0.1);
  draw(WR, b.wrote - 0.3);
}

/** the triangular curtain of black card. (round-2) It is FLOWN IN from above on two cords over 0.6 s on 'curtain',
 *  landing in its seat at ~15.0 s with a small bob, translucent (~60%) so the cups read beneath it. On 'ahead' the
 *  forward ghost threads snap through it; only then (masked + 0.35 → + 0.7) does the card go opaque. */
function curtain(c: C, env: PaintEnv, t: number, b: B) {
  const tq = tq12(t);
  const t0 = b.curtain - 0.3;
  const drop = clamp01((tq - t0) / 0.6);
  if (drop <= 0) return;
  // a fall that decelerates into its seat, then a damped bob on the cords
  const fall = 1 - Math.pow(1 - drop, 2.6);
  const bob = drop >= 1 ? Math.sin((t - t0 - 0.6) * 7) * 5 * Math.exp(-Math.max(0, t - t0 - 0.6) * 3.2) : 0;
  const dy = lerp(-620, 0, fall) + bob;
  const m = env.mood;
  const opaque = 0.68 + 0.32 * win(t, b.masked + 0.35, b.masked + 0.7);
  // the cords from the beam to the card's top edge (between the key slips)
  c.save();
  c.fillStyle = env.fill('ink');
  for (const cxk of [WR.x0 + 2 * CELL, WR.x0 + WR.n * CELL - 2]) {
    const top = BEAM_Y + 6, bot = CURTAIN_DIAG.y0 + dy;
    if (bot > top) c.fillRect(cxk - 1, top, 2, bot - top);
    c.fillRect(cxk - 4, bot - 2, 8, 5);
  }
  c.restore();
  c.save();
  c.translate(0, dy);
  c.save();
  c.globalAlpha *= opaque;
  c.fillStyle = mixLab(env.fill('ink'), '#000000', 0.45);
  c.fill(CURTAIN);
  c.restore();
  c.strokeStyle = withAlpha(m.rim, 0.5);
  c.lineWidth = 1.2;
  c.stroke(CURTAIN);
  // the hypotenuse made plain: a 2 px rim on the stepped edge and a straight diagonal score line along it
  c.strokeStyle = withAlpha(mixLab(m.core, '#ffffff', 0.2), 0.85);
  c.lineWidth = 2;
  c.lineJoin = 'miter';
  c.stroke(CURTAIN_STEPS);
  c.strokeStyle = withAlpha(m.core, 0.4);
  c.lineWidth = 1.4;
  c.setLineDash([10, 6]);
  c.beginPath();
  c.moveTo(CURTAIN_DIAG.x0, CURTAIN_DIAG.y0);
  c.lineTo(CURTAIN_DIAG.x1, CURTAIN_DIAG.y1);
  c.stroke();
  c.setLineDash([]);
  c.restore();
  // once opaque: the masked crossings, empty glasses outlined on the black card
  const a = win(t, b.masked + 0.6, b.masked + 1.0) * 0.55;
  if (a > 0.01)
    for (let i = 0; i < WR.n; i++)
      for (let j = i + 1; j < WR.n; j++) {
        c.save();
        c.globalAlpha *= a;
        const x = cx(WR, j), y = cy(i) + CELL / 2 - 6;
        c.strokeStyle = withAlpha(m.rim, 0.7);
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(x - 16, y - 28);
        c.lineTo(x - 5.4, y);
        c.lineTo(x + 5.4, y);
        c.lineTo(x + 16, y - 28);
        c.stroke();
        c.restore();
      }
}

/** 'halves': a faint vertical seam of light between the two looms (where the blade will fall on 'kept') */
function seam(c: C, env: PaintEnv, t: number, b: B) {
  const a = win(t, b.halves - 0.1, b.halves + 0.5) * (1 - win(t, b.cut - 0.05, b.cut + 0.3));
  if (a <= 0.01) return;
  const x = (x1(RD) + WR.qx) / 2;
  const m = env.mood;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, BEAM_Y - 80, 0, y1(RD) + 80);
  g.addColorStop(0, withAlpha(m.core, 0));
  g.addColorStop(0.3, withAlpha(m.core, 0.35 * a));
  g.addColorStop(0.7, withAlpha(m.core, 0.35 * a));
  g.addColorStop(1, withAlpha(m.core, 0));
  c.fillStyle = g;
  c.fillRect(x - 1, BEAM_Y - 80, 2, y1(RD) - BEAM_Y + 160);
  const h = c.createLinearGradient(x - 16, 0, x + 16, 0);
  h.addColorStop(0, withAlpha(m.halo, 0));
  h.addColorStop(0.5, withAlpha(m.halo, 0.12 * a));
  h.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = h;
  c.fillRect(x - 16, BEAM_Y - 60, 32, y1(RD) - BEAM_Y + 120);
  c.restore();
}

/** the teaser: one blank type sort rises into a ghost slot at the end of the top row and hangs, unset */
function ghostSlot(c: C, env: PaintEnv, t: number, b: B) {
  const a = win(t, b.next - 0.5, b.next);
  if (a <= 0.01) return;
  const m = env.mood;
  const { x, y } = GHOST;
  // the ghost slot: a dashed outline where the next slip would hang
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = withAlpha(m.core, 0.65);
  c.lineWidth = 1.4;
  c.setLineDash([5, 4]);
  c.strokeRect(x - 27, y, 54, 36);
  c.setLineDash([]);
  c.fillStyle = env.fill('ink');
  c.fillRect(x - 3, y - 12, 6, 14);
  c.restore();
  // (round-2) the frame's single accent at the end: a soft cyan halo around the slot and its blank sort
  const halo = a * (0.3 + 0.35 * win(t, b.next + 0.4, b.next + 1.6));
  glow(c, x, y + 18, 110, m.halo, halo);
  // the sort rises from below the loom (on twos), then hangs, bobbing a hair
  const u = clamp01((tq12(t) - b.next) / 0.95);
  const e = 1 - Math.pow(1 - u, 3);
  const sy = lerp(y1(WR) + 60, y + 2, e) + (u >= 1 ? Math.sin((t - b.next) * 2.1) * 1.5 : 0);
  const sw = 26, sh = 36;
  c.save();
  c.globalAlpha *= win(t, b.next - 0.05, b.next + 0.2);
  const metal = mixLab(m.setHaze, m.rim, 0.35);
  c.fillStyle = metal;
  c.fillRect(x - sw / 2, sy, sw, sh);
  // the nick and the blank face (no letter)
  c.fillStyle = withAlpha(env.fill('ink'), 0.6);
  c.fillRect(x - sw / 2, sy + sh * 0.68, sw, 2.5);
  c.strokeStyle = withAlpha(m.core, 0.7);
  c.lineWidth = 1;
  c.strokeRect(x - sw / 2 + 3, sy + 3, sw - 6, sh * 0.5);
  c.restore();
  glow(c, x, sy + 14, 44, m.core, (0.35 + 0.25 * win(t, b.next + 0.6, b.next + 1.6)) * a);
}

/** the chip: "decoder only" over two dated citations, typed on their words; clears before the curtain */
function decoderChip(c: C, f: Frame, t: number, b: B) {
  // review round 4 (ghost-text audit: the chip rose over the encoder column's word tags, 'the / cat / sat', which
  // were still leaving at cut + 0.3 to + 0.9): it now waits for the column to clear and lands on 'half'
  const IN = 0.95;
  const A = win(t, b.cut + IN, b.cut + IN + 0.45) * (1 - win(t, b.curtain - 0.85, b.curtain - 0.2));
  if (A <= 0.01) return;
  const m = f.mood;
  const X = 56, Y = 232, W = 400, H = 170;
  const rise = (1 - win(t, b.cut + IN, b.cut + IN + 0.6)) * 14;
  c.save();
  c.translate(0, rise);
  // a soft ink plate (the hall is busy behind): feathered dark card with a cut-paper rim on its top edge
  c.globalAlpha = A;
  const g = c.createLinearGradient(X, 0, X + W + 30, 0);
  g.addColorStop(0, withAlpha(m.ink, 0.8));
  g.addColorStop(0.85, withAlpha(m.ink, 0.66));
  g.addColorStop(1, withAlpha(m.ink, 0));
  c.fillStyle = g;
  c.beginPath();
  c.roundRect(X - 18, Y, W + 48, H, 6);
  c.fill();
  c.fillStyle = withAlpha(m.rim, 0.45);
  c.fillRect(X - 18, Y, W, 1.2);
  const pale = mixLab(m.core, '#ffffff', 0.35);
  const dim = mixLab(m.halo, '#ffffff', 0.25);
  // title
  const tFont = (sz: number) => `italic 500 ${sz}px ${FONT.text}`;
  const tSize = legibleSize(c, tFont(36), 36, 'decoder only');
  c.font = tFont(tSize);
  c.fillStyle = pale;
  c.textBaseline = 'alphabetic';
  c.fillText('decoder only', X + 4, Y + 50);
  c.fillStyle = withAlpha(pale, 0.5);
  c.fillRect(X + 4, Y + 64, 140 * win(t, b.cut + IN + 0.2, b.cut + IN + 0.9), 1);
  // the two citations, typed on (mono, after 1990)
  const mFont = (sz: number) => `500 ${sz}px ${FONT.mono}`;
  const mSize = legibleSize(c, mFont(21), 21, 'Liu');
  c.font = mFont(mSize);
  const type = (text: string, at: number, y: number, col: string) => {
    const n = Math.floor(clamp01((t - at) / 0.9) * text.length);
    if (n <= 0) return;
    c.fillStyle = col;
    c.fillText(text.slice(0, n), X + 4, y);
  };
  type('Liu et al., Google · Jan 2018', b.cut + IN + 0.25, Y + 106, dim);
  const l2 = 'OpenAI GPT · June 2018';
  type(l2, b.openai - 0.1, Y + 144, dim);
  // "GPT" brightens on its name
  const gk = win(t, b.gpt - 0.1, b.gpt + 0.3);
  if (gk > 0.01 && t > b.openai + 0.8) {
    const x0 = X + 4 + c.measureText('OpenAI ').width;
    const wG = c.measureText('GPT').width;
    c.save();
    c.globalCompositeOperation = 'lighter';
    glow(c, x0 + wG / 2, Y + 137, 46, m.core, 0.35 * gk);
    c.restore();
    c.fillStyle = withAlpha(pale, gk);
    c.fillText('GPT', x0, Y + 144);
    c.fillStyle = withAlpha(pale, 0.8 * gk);
    c.fillRect(x0, Y + 151, wG * gk, 1.4);
  }
  c.restore();
}
void LAYERS;
