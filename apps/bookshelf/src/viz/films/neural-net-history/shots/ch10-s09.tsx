/**
 * ch10-s09 — a clock face for every place (serverCyan hall; 13.5 s; cut in). The same banner as ch10-s08 (shared set
 * sets/ch10-s08-banner: same slips with their mirrors and notes, same cord and posts, same near plane, same camera).
 *
 *   0            exactly ch10-s08's last frame (four heads, nine lanterns, web, cups, caption, glow)
 *   0.15 → 0.55  s08's extras clear before 'Shuffle', leaving bank's own head (hand-set weights), river's 0.58 riding
 *                with river's slip
 *   'Shuffle'    the slips are tossed into a heap: the threads go with their words and look the same; the heap holds
 *                through 'the scores come out the same' (attention alone cannot tell order)
 *   L1020 end    the slips rehang in order
 *   'clock'      from -0.25 s each slip gets a paper-cut clock face pinned just ABOVE its top-right corner (clear of the
 *                lettering), 25 ms apart, each with a small pendulum swing; the label sets in on a dark plate
 *   'set'…'place' the hands turn to their settings as the camera (close, ≈ 1.2×) tracks a short way along the row; frame
 *                edges fall in gaps, so slips are whole at both ends. Hands: FAST long and thin with an oxblood dot tip,
 *                SLOWER medium with a diamond tip, SLOWEST a short wide stub with a square tip. Below, each hand's height
 *                (cos of its angle: up = the crest) is traced as a wave whose dots carry the same tip mark
 *   'fast' / 'slow'  the fast hands and fast wave brighten, then the slow stubs and slowest wave
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { MOODS, defineShot, mixLab, withAlpha } from '../../../film';
import { hash1 } from '../../../film/silhouette/atmosphere';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { legibleSize, softPlate } from '../../../film/silhouette/type';
import { arcPts, clamp01, glassCup, hallBackdrop, ink, lerp, qLantern, sm, tq12, win, wordSlip } from '../sets/ch10-s06-kit';
import { MARKS, OMEGA, clockFace, handMark } from '../sets/ch10-s09-clock';
import { BANK, CUP_H, CUP_W, CUP_Y, H1, HEADS, HEAD_Q, N, RIVER_SHARE_Y, S08_END, SIZE, SLIPS, SLIP_H, WORDS, X1, hallBloom, hallNear, headCols, illustrativeTag, lanternOf, postsAndCord, slipTokens } from '../sets/ch10-s08-banner';

type C = CanvasRenderingContext2D;
const ID = 'ch10-s09';
const CY = MOODS.serverCyan;
const LIGHT = mixLab(CY.halo, CY.core, 0.35);
const CORE = mixLab(CY.core, '#ffffff', 0.3);

const CLOCK_R = 34;
/** clock centre x per slip: pinned just above the slip's top-right corner, clear of its lettering */
const CX = SLIPS.map((s) => s.cx + s.w / 2 - 16);
/** clock centre y above a slip whose top is at `top` */
const clockY = (top: number) => top - CLOCK_R - 6;
const HOME = SLIPS.map((s) => ({ cx: s.cx, top: s.top, rot: 0 }));
/** the heap: a fixed toss (shuffled order, bunched, tilted) */
const ORDER = [6, 2, 8, 0, 4, 7, 1, 5, 3];
const HEAP = WORDS.map((_, i) => {
  const k = ORDER.indexOf(i);
  return { cx: 640 + (k - 4) * 74 + (hash1(i, 91) - 0.5) * 30, top: 330 + (hash1(i, 92) - 0.5) * 70 + Math.abs(k - 4) * 9, rot: (hash1(i, 93) - 0.5) * 0.9 };
});
const STRIP = { y: 456, amp: 15, dy: 52 };
/** place index at world x along the strip: piecewise-linear through the clock x's (so each dot sits under its clock) */
function placeAt(x: number): number {
  if (x <= CX[0]) return (x - CX[0]) / (CX[1] - CX[0]);
  for (let i = 1; i < N; i++) if (x <= CX[i]) return i - 1 + (x - CX[i - 1]) / (CX[i] - CX[i - 1]);
  return N - 1 + (x - CX[N - 1]) / (CX[N - 1] - CX[N - 2]);
}

interface B {
  D: number;
  loses: number;
  rehang: number;
  clock: number;
  set: number;
  place: number;
  fast: number;
  slow: number;
}
/** A = s08's end framing · H = leaning in on the heap · L/R = in on the row's left / right end (the track) ·
 *  C = the whole row, every clock and slip whole */
const CAM_A: Camera3 = S08_END;
const CAM_H: Camera3 = { x: 640, y: 318, z: 150, lens: 1 };
/** close on the slips (≈ 1.2×) for the clock beats; a short track whose frame edges fall in the gaps between slips at
 *  both ends (left end: 'the' whole at the right edge, 'river' out; right end: 'I' out, 'arrived' whole at the left) */
const CAM_L: Camera3 = { x: 512, y: 380, z: 160, lens: 1 };
const CAM_R: Camera3 = { x: 728, y: 380, z: 160, lens: 1 };
const CAM_C: Camera3 = { x: 660, y: 362, z: 30, lens: 1 };
const CAMS = [CAM_A, CAM_H, CAM_L, CAM_R, CAM_C];
/** the hands' turn to their settings: slip i starts at set + i × STEP and takes TURN s */
const STEP = 0.1;
const TURN = 0.75;
const mixCam = (a: Camera3, b: Camera3, u: number): Camera3 => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), lens: 1 });

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    const clock = T.beat('clock');
    const b: B = {
      D: T.duration,
      loses: T.beat('shuffle'),
      // the heap holds through the whole of L1020 ('the scores come out the same'); the slips rehang in the pause
      rehang: Math.min(clock - 0.95, T.line('L1020').end + 0.1),
      clock,
      set: T.word('L1020b', 'set'),
      place: T.beat('place'),
      fast: T.beat('hands'),
      slow: T.word('L1020b', 'slow'),
    };
    tl.hold(0, b.D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    let cam = mixCam(CAM_A, CAM_H, sm((t - b.loses - 0.6) / 3.2));
    cam = mixCam(cam, CAM_L, sm((t - b.rehang) / (b.set - b.rehang)));
    cam = mixCam(cam, CAM_R, sm((t - b.set) / (b.slow - b.set)));
    cam = mixCam(cam, CAM_C, sm((t - b.slow - 0.2) / Math.max(1.2, b.D - 0.4 - b.slow - 0.2)));
    f.camera(cam);
    // frame 0 IS ch10-s08's last frame; its extra heads, lanterns, cups and caption clear over 0.4 s before 'Shuffle'
    const s08 = 1 - sm(win(t, b.loses - 0.45, b.loses - 0.05));
    f.backlight({ sunX: 640, sunY: 420, sunRadius: 640, intensity: 0.45 + 0.125 * s08 });
    hallBackdrop(f, ID, CAMS, { beamY: 70, dim: 0.32 });
    f.layer('L4', (c, env) => row(c, t, b, env, s08));
    f.rim({ x: 0, y: -1 });
    hallNear(f, ID, CAMS);
    const c = f.c;
    // s08's caption + legend, clearing with the extra heads
    if (s08 > 0.003) {
      softPlate(c, 640, 86, 1120, 160, CY.fg, 0.62 * s08);
      ink(c, '8 heads × 64 numbers each  (4 shown)', 640, 66, { size: 28, align: 'center', color: mixLab('#efe3cf', CY.core, 0.2), alpha: s08 });
      const hues = headCols(f.mood);
      const LS = legibleSize(c, 'italic 500 22px "EB Garamond"', 22);
      c.save();
      c.font = `italic 500 ${LS}px "EB Garamond"`;
      const ws = HEAD_Q.map((q) => c.measureText(q).width);
      c.restore();
      let x = 640 - (ws.reduce((p, q) => p + q + 58, 0) - 30) / 2;
      HEAD_Q.forEach((q, h) => {
        const a = h === 0 ? s08 : s08 * s08;
        c.save();
        c.globalAlpha *= a;
        c.strokeStyle = hues[h];
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(x, 100);
        c.lineTo(x + 22, 100);
        c.stroke();
        c.restore();
        ink(c, q, x + 28, 107, { italic: true, size: LS, color: mixLab(hues[h], '#ffffff', 0.15), alpha: a * 0.8 });
        x += 28 + ws[h] + 30;
      });
    }
    const la = win(t, b.clock, b.clock + 0.5);
    if (la > 0) {
      // a soft dark plate under the label (it sits over the hall's hanging slips)
      c.save();
      c.globalAlpha *= la;
      c.shadowColor = withAlpha(CY.fg, 0.6);
      c.shadowBlur = 24;
      c.fillStyle = withAlpha(CY.fg, 0.5);
      c.beginPath();
      c.roundRect(640 - 330, 50, 660, 50, 25);
      c.fill();
      c.restore();
      ink(c, 'position = sines and cosines, fast to slow', 640, 84, { size: 29, align: 'center', color: mixLab('#efe3cf', CY.core, 0.2), alpha: la });
    }
  },
});

function row(c: C, t: number, b: B, env: PaintEnv, s08: number) {
  const tq = tq12(t);
  const ink0 = env.fill('ink');
  const hues = headCols(env.mood);
  const rim = env.mood.rim;
  // where each slip is: home → heap ('loses') → home (rehang), on twos
  const toss = sm(clamp01((tq - b.loses + 0.05) / 0.45));
  const back = sm(clamp01((tq - b.rehang) / 0.7));
  const k = toss * (1 - back);
  const pos = HOME.map((h, i) => ({ cx: lerp(h.cx, HEAP[i].cx, k), top: lerp(h.top, HEAP[i].top, k) - 40 * Math.sin(Math.PI * clamp01((tq - b.loses) / 0.45)) * (1 - back), rot: lerp(0, HEAP[i].rot, k) }));

  postsAndCord(c, ink0);
  hallBloom(c, env, 0.55 * s08);

  // ---------------------------------------------------------------- the wave strip (behind), from 'clock'
  const sA = win(t, b.place - 0.2, b.place + 0.5);
  // 'fast': the fast hands and wave brighten; 'slow': the slow stubs and the slowest wave
  const litFast = win(t, b.fast - 0.1, b.fast + 0.3) * (1 - win(t, b.slow - 0.2, b.slow + 0.4));
  const litSlow = win(t, b.slow - 0.1, b.slow + 0.3) * (1 - 0.5 * win(t, b.slow + 1.2, b.D - 0.3));
  const litW = [litFast, 0, litSlow];
  if (sA > 0) {
    c.save();
    c.globalAlpha *= sA;
    // ticks: each clock tied to its three wave dots
    c.strokeStyle = withAlpha(rim, 0.28);
    c.lineWidth = 1;
    c.setLineDash([3, 4]);
    for (let i = 0; i < N; i++) {
      c.beginPath();
      c.moveTo(CX[i], SLIPS[i].top + SLIP_H + 40);
      c.lineTo(CX[i], STRIP.y + 2 * STRIP.dy + STRIP.amp + 4);
      c.stroke();
    }
    c.setLineDash([]);
    OMEGA.forEach((w, h) => {
      const y0 = STRIP.y + h * STRIP.dy;
      const lw = litW[h];
      c.strokeStyle = withAlpha(mixLab(rim, '#ffffff', 0.35 * lw), (h === 0 ? 0.85 : 0.6) + 0.15 * lw);
      c.lineWidth = (h === 0 ? 1.8 : 1.6) + 1.4 * lw;
      c.beginPath();
      const xa = CX[0] - 40;
      const xb = CX[N - 1] + 26;
      for (let x = xa; x <= xb; x += 5) {
        const y = y0 - STRIP.amp * Math.cos(placeAt(x) * w);
        if (x === xa) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
      // each dot = its clock's hand height (cos of the hand's angle: a hand pointing up sits on the crest), carrying
      // that hand's own tip mark
      const markCol = h === 0 ? mixLab('#7a2a26', '#d0473c', 0.5 + 0.3 * lw) : withAlpha(mixLab(env.mood.core, '#ffffff', 0.2 * lw), 0.9);
      for (let i = 0; i < N; i++) {
        const y = y0 - STRIP.amp * Math.cos(i * w);
        handMark(c, CX[i], y, MARKS[h], 3.6, markCol);
      }
      // named at the row's right end, where the camera is when the narration says 'fast' and 'slow'
      handMark(c, CX[N - 1] + 26, y0, MARKS[h], 3.6, markCol);
      ink(c, ['fast', 'slower', 'slowest'][h], CX[N - 1] + 36, y0 + 8, { italic: true, size: 24, weight: lw > 0.3 ? 600 : 500, align: 'left', color: mixLab(rim, '#ffffff', 0.2 + 0.4 * lw), alpha: 0.95, legible: true });
    });
    c.restore();
  }

  // ---------------------------------------------------------------- s08's extra heads and web, clearing
  if (s08 > 0.003) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    // the faint web of every pair
    for (let i = 0; i < N; i++)
      for (let j = i + 1; j < N; j++) {
        const a = SLIPS[i];
        const bb = SLIPS[j];
        const pts = arcPts(a.cx, a.top - 40, bb.cx, bb.top - 40, -(50 + (bb.cx - a.cx) * 0.34), 1, 20);
        const path = new Path2D();
        pts.forEach((p, n) => (n ? path.lineTo(p.x, p.y) : path.moveTo(p.x, p.y)));
        c.strokeStyle = withAlpha(hues[(i + j) % 4], 0.12 * s08);
        c.lineWidth = 1;
        c.stroke(path);
      }
    // heads 2-4 from bank
    const L = lanternOf(BANK);
    for (let h = 1; h < 4; h++)
      for (let j = 0; j < N; j++) {
        if (j === BANK) continue;
        const w = HEADS[h][j];
        const s = SLIPS[j];
        const dist = Math.abs(s.cx - L.x);
        const pts = arcPts(L.x, L.y - 6, s.cx, s.top - 12, -(96 + dist * 0.4) + (h - 1.5) * 30 - h * 12, 1, 30);
        const path = new Path2D();
        pts.forEach((p, n) => (n ? path.lineTo(p.x, p.y) : path.moveTo(p.x, p.y)));
        const a = Math.min(1, 0.16 + w * 1.8) * 0.7 * s08;
        c.strokeStyle = withAlpha(hues[h], a * 0.3);
        c.lineWidth = 2 + w * 20;
        c.stroke(path);
        c.strokeStyle = withAlpha(hues[h], a);
        c.lineWidth = 0.8 + w * 6;
        c.stroke(path);
      }
    c.restore();
    // the cups beneath (bank's shares, head 1)
    for (let j = 0; j < N; j++) {
      const s = SLIPS[j];
      glassCup(c, { x: s.cx, y: CUP_Y, w: CUP_W, h: CUP_H, level: H1[j] / 0.62, light: LIGHT, core: CORE, alpha: 0.55 * s08, ink: ink0, glowK: 1.5 });
      if (j === 8) ink(c, '0.58', s.cx, RIVER_SHARE_Y, { font: 'mono', size: 25, weight: 600, align: 'center', color: mixLab(rim, CORE, 0.4), alpha: 0.6 * s08, legible: true });
    }
    illustrativeTag(c, X1 + 6, SLIPS[N - 1].top + SLIP_H + 66, mixLab(rim, '#ffffff', 0.2), s08);
  }

  // ---------------------------------------------------------------- bank's threads, head 1 (follow their words)
  const thrA = 1 - win(t, b.clock - 0.2, b.clock + 0.5);
  if (thrA > 0) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const q = pos[BANK];
    const col = hues[0];
    for (let j = 0; j < N; j++) {
      if (j === BANK) continue;
      const s = pos[j];
      const dist = Math.abs(s.cx - q.cx);
      const pts = arcPts(q.cx, q.top - 46, s.cx, s.top - 12, -(96 + dist * 0.4) - 45 * s08, 1, 28);
      const path = new Path2D();
      pts.forEach((p, n) => (n ? path.lineTo(p.x, p.y) : path.moveTo(p.x, p.y)));
      const a = Math.min(1, 0.16 + H1[j] * 1.8) * thrA * (1 - 0.3 * s08);
      c.strokeStyle = withAlpha(col, a * 0.3);
      c.lineWidth = 2 + H1[j] * 20;
      c.stroke(path);
      c.strokeStyle = withAlpha(col, a);
      c.lineWidth = 0.8 + H1[j] * 6;
      c.stroke(path);
      if (H1[j] > 0.2) glow(c, s.cx, s.top - 12, 30 + H1[j] * 60, col, 0.35 * H1[j] * thrA);
    }
    c.restore();
    // river's share rides with its slip: the same 0.58 before the toss and in the heap (the scores come out the same)
    const rv = pos[8];
    // (it takes over from the cup's 0.58 as s08's cups clear, so frame 0 carries only s08's own label)
    const rA = thrA * (1 - s08) * (1 - 0.6 * win(t, b.rehang - 0.1, b.rehang + 0.4));
    ink(c, '0.58', rv.cx + SLIPS[8].w / 2 + 8, rv.top - 16, { font: 'mono', size: 25, weight: 600, align: 'left', color: mixLab(col, '#ffffff', 0.45), alpha: rA, legible: true });
  }

  // ---------------------------------------------------------------- slips, lanterns and their clocks
  const drawOrder = k > 0.01 ? [...ORDER] : WORDS.map((_, i) => i);
  for (const i of drawOrder) {
    const p = pos[i];
    const sway = 0.015 * Math.sin(tq * 1.4 + i);
    const cord = (1 - k) * (p.top - SLIPS[i].top + 16);
    wordSlip(c, { x: p.cx, y: p.top, w: SLIPS[i].w, h: SLIP_H, text: WORDS[i], size: SIZE, rot: p.rot + sway, cord: cord > 1 ? cord : 0, lit: 0.35 * s08 + (i === BANK ? 0.4 * s08 : 0) });
    // s05's mirror and sealed note stay on every slip (in the heap too)
    slipTokens(c, env, i, p.cx, p.top, p.rot + sway, 1);
    if (i === BANK) {
      // bank's lantern: its question is done once the clocks come (it steps back so the clock can be read)
      const la = 1 - 0.85 * win(t, b.clock - 0.4, b.clock);
      c.save();
      c.translate(p.cx, p.top);
      c.rotate(p.rot);
      qLantern(c, 0, -40, (0.5 * thrA + 0.3 * s08 + 0.2) * la, env, 1.25, la);
      c.restore();
    } else if (s08 > 0.003) {
      const L = lanternOf(i);
      qLantern(c, L.x, L.y, 0.75 * s08, env, 1.0, s08);
    }
    // clocks pop on with the word 'clock' itself, left to right
    // clocks pin on from 'clock' - 0.25 s, 25 ms apart left to right, each with a small pendulum swing about its pin
    const c0 = b.clock - 0.25 + i * 0.025;
    const ca = win(tq, c0, c0 + 0.18);
    if (ca > 0) {
      // the wedge the fast hand swept from its left neighbour's setting, lit as the hand arrives
      const f0 = b.set + i * STEP + TURN * 0.8;
      const flash = i > 0 ? win(t, f0, f0 + 0.2) * (1 - win(t, f0 + 1.0, f0 + 1.8)) : 0;
      // hands rest at twelve until 'set', then turn to the slip's place (fast hands whirl, the stub barely moves)
      const turn = sm(clamp01((t - b.set - i * STEP) / TURN));
      const u = Math.max(0, tq - c0);
      const swing = 0.32 * Math.exp(-u * 3.2) * Math.sin(u * 13) * (i % 2 ? 1 : -1);
      const R = CLOCK_R * (0.75 + 0.25 * ca);
      const px = CX[i] + (p.cx - HOME[i].cx);
      const py = clockY(p.top) - R;
      c.save();
      c.translate(px, py);
      c.rotate(swing);
      clockFace(c, 0, R, R, i * turn, ca, rim, flash * turn, litFast, litSlow);
      c.restore();
    }
  }
}
