/**
 * ch10-s08 — eight heads (serverCyan hall; 10.6 s; cut back to the wide hall). The full-size echo of ch10-s06's toy:
 * the banner of slips reads the example sentence from Google's 2017 announcement of the Transformer:
 *   I · arrived · at · the · bank · after · crossing · the · river            (ILLUSTRATIVE · hand-set weights)
 * Every slip carries ch10-s05's three objects (lantern above; mirror and sealed note hanging below: sets/ch10-s08-banner).
 *
 *   0.3        the banner settles on its cord between two posts; the tag hangs at its end
 *   0.6        'bank' lifts its lantern; threads of light draw out to every slip (width/alpha = HAND-SET weight)
 *              and light runs down into the cups beneath (level = the same weight)
 *   'Transformer'  river's cup fills far above the rest (0.58, set just above its rim)
 *   'eight'#1 → 'question'  a ≈ 7.5% dolly out with a slight crane up: the hall's height opens over the web
 *   'heads'    the one colour splits: four low-chroma hues fan out from 'bank' one head at a time, each from the
 *              HAND-BUILT head table (four of eight shown); head 1 ('what am I?') one step brighter than the base thread
 *              so the legend maps; caption + legend on one soft plate: 8 heads × 64 numbers each (4 shown)
 *   'question' every other lantern lifts from the word -0.2 s, 60 ms apart from bank outward; a web joins every pair;
 *              the window backlight lifts (+15% held, with a swell) and a haze bloom fills the hall
 * The jug: deliberately NOT shown here (the cups carry the pour; the jug stays the toy plates' image).
 * Depth: hazed hall (L2/L3), the banner on its posts (L4), a near post on the left and a big blank hanging slip in the
 * top-right corner (L5, blurred).
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { MOODS, defineShot, mixLab, withAlpha } from '../../../film';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { legibleSize, softPlate } from '../../../film/silhouette/type';
import { arcPts, clamp01, glassCup, hallBackdrop, ink, lerp, lightStream, qLantern, sm, tq12, win, wordSlip } from '../sets/ch10-s06-kit';
import { BANK, CUP_H, CUP_W, CUP_Y, H1, HEADS, HEAD_Q, N, RIVER_SHARE_Y, S08_END, SIZE, SLIPS, SLIP_H, WORDS, X1, hallBloom, hallNear, headCols, illustrativeTag, lanternOf, postsAndCord, slipTokens } from '../sets/ch10-s08-banner';

type C = CanvasRenderingContext2D;
const ID = 'ch10-s08';
const CY = MOODS.serverCyan;
const LIGHT = mixLab(CY.halo, CY.core, 0.35);
const CORE = mixLab(CY.core, '#ffffff', 0.3);



interface B {
  D: number;
  settle: number;
  query: number;
  river: number;
  eight: number;
  heads: number;
  question: number;
}
/**
 * A: the banner a touch tilted down (lanterns to cups fill the frame; the cups near the lower third) · B: the pull back
 * from 'eight'#1 to 'question' (≈ 7.5% dolly out with a slight crane up, the hall's height opening over the web) ·
 * C = S08_END: a slow settle in the music hold (= ch10-s09's opening camera)
 */
const CAM_A: Camera3 = { x: 640, y: 352, z: 28, lens: 1 };
const CAM_B: Camera3 = { x: 642, y: 330, z: -46, lens: 1 };
const CAM_C: Camera3 = S08_END;
const CAMS = [CAM_A, CAM_B, CAM_C];
const mixCam = (a: Camera3, b: Camera3, u: number): Camera3 => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), lens: 1 });

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: B = {
      D: T.duration,
      settle: T.beat('sentence'),
      query: T.beat('bankQuery'),
      river: T.beat('toRiver'),
      eight: T.word('L1019', 'eight'),
      heads: T.beat('heads'),
      question: T.beat('allWords'),
    };
    tl.hold(0, b.D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    let cam = mixCam(CAM_A, CAM_B, sm((t - b.eight) / (b.question - b.eight)));
    cam = mixCam(cam, CAM_C, sm((t - b.question) / Math.max(1, b.D - b.question)));
    f.camera(cam);
    const hallGlow = win(t, b.question - 0.2, b.question + 1.6);
    // the payoff swell: up over 1.2 s on 'question', back down by 9 s; the hall keeps a +15% glow after it
    const swell = win(t, b.question - 0.2, b.question + 1.0) * (1 - win(t, b.question + 1.5, 9.0));
    f.backlight({ sunX: 640, sunY: 420, sunRadius: 640, intensity: 0.45 + 0.125 * hallGlow + 0.42 * swell });
    hallBackdrop(f, ID, CAMS, { beamY: 70, dim: 0.32 });
    f.layer('L4', (c, env) => banner(c, t, b, env, hallGlow, swell));
    f.rim({ x: 0, y: -1 });
    hallNear(f, ID, CAMS);
    // screen-locked caption + legend (one soft plate) once the heads split
    const capA = win(t, b.heads - 0.1, b.heads + 0.5);
    if (capA > 0) {
      const c = f.c;
      softPlate(c, 640, 86, 1120, 160, env0ink(), 0.62 * capA);
      ink(c, '8 heads × 64 numbers each  (4 shown)', 640, 66, { size: 28, align: 'center', color: mixLab('#efe3cf', CY.core, 0.2), alpha: capA });
      const hues = headCols(f.mood);
      // measure the legend so it is centred
      const LS = legibleSize(c, 'italic 500 22px "EB Garamond"', 22);
      c.save();
      c.font = `italic 500 ${LS}px "EB Garamond"`;
      const ws = HEAD_Q.map((q) => c.measureText(q).width);
      c.restore();
      const total = ws.reduce((p, q) => p + q + 28 + 30, 0) - 30;
      let x = 640 - total / 2;
      HEAD_Q.forEach((q, h) => {
        const h0 = headStart(b, h);
        const a = capA * win(t, h0 - 0.05, h0 + 0.25);
        const lit = win(t, h0, h0 + 0.25) * (1 - win(t, h0 + 0.7, h0 + 1.3));
        c.save();
        c.globalAlpha *= a;
        c.strokeStyle = hues[h];
        c.lineWidth = 3 + 2 * lit;
        c.beginPath();
        c.moveTo(x, 100);
        c.lineTo(x + 22, 100);
        c.stroke();
        c.restore();
        ink(c, q, x + 28, 107, { italic: true, size: LS, weight: lit > 0.3 ? 600 : 500, color: mixLab(hues[h], '#ffffff', 0.15 + 0.4 * lit), alpha: a * (0.8 + 0.2 * lit) });
        x += 28 + ws[h] + 30;
      });
    }
  },
});

const env0ink = () => CY.fg;
/** every other word lifts its lantern from 'question' - 0.2 s, 60 ms apart from bank outward (the glow lands on the word) */
const lanternLift = (b: B, i: number) => b.question - 0.2 + (Math.abs(i - BANK) - 1) * 0.06;
/** when head h's arcs start to draw (legend order, 0.25 s apart, from 'heads') */
const headStart = (b: B, h: number) => b.heads - 0.15 + h * 0.25;

// ================================================================================================= the banner
function banner(c: C, t: number, b: B, env: PaintEnv, hallGlow: number, swell: number) {
  const tq = tq12(t);
  const ink0 = env.fill('ink');
  const hues = headCols(env.mood);
  const settle = win(tq, 0, b.settle + 0.5);
  postsAndCord(c, ink0);
  // the hall's haze bloom on 'question' (swells with the backlight, then holds low)
  hallBloom(c, env, 0.55 * hallGlow + 0.45 * swell);

  // ---------------------------------------------------------------- threads (behind the slips)
  const thr = win(t, b.query, b.query + 1.3);
  const split = win(t, b.heads - 0.25, b.heads + 0.45);
  const hs = [0, 1, 2, 3].map((h) => win(t, headStart(b, h), headStart(b, h) + 0.55));
  const L = lanternOf(BANK);
  const lift = win(t, b.query - 0.3, b.query + 0.3);
  const ly = L.y + 20 * (1 - lift);
  if (thr > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const nH = split > 0 ? 4 : 1;
    for (let h = 0; h < nH; h++) {
      if (h > 0 && hs[h] <= 0) continue;
      const ha = h === 0 ? 1 : Math.min(1, hs[h] * 1.5);
      const col = h === 0 ? mixLab(mixLab(CY.halo, CORE, 0.5), hues[0], hs[0]) : hues[h];
      for (let j = 0; j < N; j++) {
        if (j === BANK) continue;
        const w = HEADS[h][j];
        const s = SLIPS[j];
        const dist = Math.abs(s.cx - L.x);
        const reach = h === 0 ? thr : hs[h];
        const d = sm(clamp01((reach - 0.05) / (h === 0 ? 0.35 + 0.6 * (dist / 900) : 0.75)));
        if (d <= 0) continue;
        const fan = (h - 1.5) * 30 * split;
        const pts = arcPts(L.x, ly - 6, s.cx, s.top - 12, -(96 + dist * 0.4) + fan - h * 12 * split, d, 30);
        const a = Math.min(1, 0.16 + w * 1.8) * ha * (1 - 0.3 * hallGlow);
        const path = new Path2D();
        pts.forEach((p, k) => (k ? path.lineTo(p.x, p.y) : path.moveTo(p.x, p.y)));
        c.strokeStyle = withAlpha(col, a * 0.3);
        c.lineWidth = 2 + w * 20;
        c.stroke(path);
        c.strokeStyle = withAlpha(col, a);
        c.lineWidth = 0.8 + w * 6;
        c.stroke(path);
        if (d > 0.98 && w > 0.2) glow(c, s.cx, s.top - 12, 30 + w * 60, col, 0.35 * w * ha);
      }
    }
    c.restore();
  }
  // the web of every word, all at once: faint threads between every pair (no weights implied)
  if (hallGlow > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i++)
      for (let j = i + 1; j < N; j++) {
        const a = SLIPS[i];
        const bb = SLIPS[j];
        const dist = bb.cx - a.cx;
        const col = hues[(i + j) % 4];
        const pts = arcPts(a.cx, a.top - 40, bb.cx, bb.top - 40, -(50 + dist * 0.34), sm(clamp01((hallGlow - 0.05 * (j - i) / N) * 1.4)), 20);
        const path = new Path2D();
        pts.forEach((p, k) => (k ? path.lineTo(p.x, p.y) : path.moveTo(p.x, p.y)));
        c.strokeStyle = withAlpha(col, 0.12 * hallGlow + 0.23 * swell);
        c.lineWidth = 1;
        c.stroke(path);
      }
    c.restore();
  }

  // ---------------------------------------------------------------- slips
  for (let i = 0; i < N; i++) {
    const s = SLIPS[i];
    const swing = (1 - settle) * 0.18 * (i % 2 ? 1 : -1) + 0.02 * Math.sin(tq * 1.3 + i) * (1 - settle * 0.5);
    const lit = i === BANK ? 0.4 * lift : 0;
    wordSlip(c, { x: s.cx, y: s.top, w: s.w, h: SLIP_H, text: WORDS[i], size: SIZE, rot: swing, lit: lit + 0.35 * hallGlow });
    slipTokens(c, env, i, s.cx, s.top, swing, 1);
  }
  // the tag at the banner's end
  illustrativeTag(c, X1 + 6, SLIPS[N - 1].top + SLIP_H + 66, mixLab(env.mood.rim, '#ffffff', 0.2), win(t, b.settle, b.settle + 0.5));

  // ---------------------------------------------------------------- lanterns
  for (let i = 0; i < N; i++) {
    const p = lanternOf(i);
    if (i === BANK) {
      qLantern(c, p.x, ly, 0.35 + 0.65 * lift, env, 1.25, win(t, b.query - 0.45, b.query - 0.1));
    } else {
      const l0 = lanternLift(b, i);
      const a = win(tq, l0, l0 + 0.3);
      if (a > 0) {
        // the payoff: every lantern swells with the hall, then settles
        glow(c, p.x, p.y + 14 * (1 - a), 130, CY.halo, 0.22 * swell * a);
        qLantern(c, p.x, p.y + 14 * (1 - a), (0.75 + 0.25 * swell) * a, env, 1.0, a);
      }
    }
  }

  // ---------------------------------------------------------------- cups beneath: bank's shares (head 1)
  const cupsA = win(t, b.query + 0.2, b.query + 0.7) * (1 - 0.45 * win(t, b.question, b.question + 1));
  const fillU = clamp01((t - b.query - 0.5) / (b.river + 0.15 - b.query - 0.5));
  for (let j = 0; j < N; j++) {
    const s = SLIPS[j];
    const lvl = (H1[j] / 0.62) * sm(fillU);
    const riverPop = j === 8 ? win(t, b.river - 0.1, b.river + 0.4) * (1 - 0.5 * win(t, b.river + 1, b.river + 2)) : 0;
    // light running down from the slip into its cup while filling
    if (fillU > 0 && fillU < 1) lightStream(c, [{ x: s.cx, y: s.top + SLIP_H + 2 }, { x: s.cx, y: CUP_Y - CUP_H * lvl }], 0.6 + 4 * H1[j], LIGHT, CORE, 0.8 * cupsA);
    glassCup(c, { x: s.cx, y: CUP_Y, w: CUP_W, h: CUP_H, level: lvl, light: LIGHT, core: CORE, alpha: cupsA, ink: ink0, glowK: 1 + riverPop });
    if (j === 8) ink(c, '0.58', s.cx, RIVER_SHARE_Y, { font: 'mono', size: 25, weight: 600, align: 'center', color: mixLab(env.mood.rim, CORE, 0.4), alpha: cupsA * riverPop + cupsA * 0.6 * win(t, b.river + 0.4, b.river + 1), legible: true });
  }
}
