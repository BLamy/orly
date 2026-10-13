/**
 * ch03-s05 — the "if" (labGreen plate → the case board in candleAmber, paper wipe in, 12.63 s).
 *
 * PLATE: a parchment sheet on the dark desk, inked.
 *   rule (0.5)            the learning rule sets in ink, left → right: w ← w + η t x, with three small ink labels
 *                         under its terms (weight · step · right answer × input)
 *   'dividing' (line)     a square plot below: a scatter of ink circles (one kind) and crosses (the other),
 *                         separable. A straight ink line starts at a bad angle and, with each MISTAKE, jumps (on
 *                         twos) to a new angle — the point it got wrong is ringed as it jumps. These are the real
 *                         perceptron updates on this scatter (computed at module scope, rule applied only on
 *                         mistakes); after a handful it settles cleanly between the two kinds and stops.
 *   'If' (if)             in the margin, IF is written and circled in ink; the line is frozen
 * TILT (music-only hold): the camera tilts up off the plate to the case board; as it reaches the board the tint
 *   crossfades labGreen → candleAmber (1.2 s, no dip; STUDY LOCK).
 * BOARD (Q1, the far-left end of the oxblood thread):
 *   unpin (+1.3)          the hands unpin the ch02 card HOW COULD A NET REWIRE ITSELF? (answered: a knob that turns)
 *                         and let it drop into the lamp's pool below
 *   newcard (+2.2)        they pin the new card in the same slot, Q1: AND IF NO STRAIGHT LINE EXISTS? — it sways a
 *                         little and holds, music only, long enough to read.
 */
import { Timeline } from '../../../core';
import { FONT, LAYERS, MOODS, defineShot, legibleSize, mixLab, softPlate, toLayer, toScreen, withAlpha } from '../../../film';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { hands } from '../cast';
import { STUDY, studyCase, studyNear, studyRoom } from '../sets/study';
import { BOARD, boardStateAt } from '../sets/studyState';
import { DEFAULT_POOL, drawCard, oxblood, paperTone, poolAt } from '../sets/caseBoard';
import { clamp01, easeIO, lerp, mixCam, sm, tq12, win, h01 } from '../sets/ch03-s01-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch03-s05';

// =============================================================================== the plot: real perceptron updates
interface Pt2 {
  x: number;
  y: number;
  c: 1 | -1;
}
interface Upd {
  w: [number, number, number]; // line w0*x + w1*y + b = 0, AFTER this update
  wrong: number; // index of the point it got wrong
}
function makePlot(): { pts: Pt2[]; w0: [number, number, number]; ups: Upd[] } {
  let best: { pts: Pt2[]; w0: [number, number, number]; ups: Upd[] } | null = null;
  for (let seed = 1; seed < 600; seed++) {
    const r = (k: number) => h01(k, 5800 + seed);
    // a true separating line through the square, a margin of 0.14 around it
    const ang = 0.5 + 0.5 * r(1);
    const n: [number, number] = [Math.sin(ang), -Math.cos(ang)];
    const off = (r(2) - 0.5) * 0.3;
    const pts: Pt2[] = [];
    for (let i = 0; pts.length < 26 && i < 400; i++) {
      const x = r(10 + i * 2) * 1.8 - 0.9;
      const y = r(11 + i * 2) * 1.8 - 0.9;
      const d = n[0] * x + n[1] * y - off;
      if (Math.abs(d) < 0.14) continue;
      pts.push({ x, y, c: d > 0 ? 1 : -1 });
    }
    const ones = pts.filter((p) => p.c === 1).length;
    if (ones < 9 || ones > 17) continue;
    // a bad start: nearly perpendicular to the answer
    const w: [number, number, number] = [-n[1] * 0.8 + 0.15 * n[0], n[0] * 0.8 + 0.15 * n[1], 0.3];
    const w0 = [...w] as [number, number, number];
    const ups: Upd[] = [];
    const eta = 0.6;
    for (let epoch = 0; epoch < 40; epoch++) {
      let clean = true;
      for (let k = 0; k < pts.length; k++) {
        const i = (k * 7 + epoch * 3) % pts.length;
        const p = pts[i];
        const out = w[0] * p.x + w[1] * p.y + w[2] > 0 ? 1 : -1;
        if (out !== p.c) {
          clean = false;
          w[0] += eta * p.c * p.x;
          w[1] += eta * p.c * p.y;
          w[2] += eta * p.c;
          ups.push({ w: [...w] as [number, number, number], wrong: i });
        }
      }
      if (clean) break;
    }
    const ok = pts.every((p) => (w[0] * p.x + w[1] * p.y + w[2] > 0 ? 1 : -1) === p.c);
    if (!ok || ups.length < 3) continue;
    // the final line must settle CLEANLY: every dot clears it by >= 0.12 plot units (~22 stage px)
    const norm = Math.hypot(w[0], w[1]) || 1;
    const margin = Math.min(...pts.map((p) => Math.abs(w[0] * p.x + w[1] * p.y + w[2]) / norm));
    if (margin < 0.12) continue;
    const cand = { pts, w0, ups };
    if (ups.length >= 5 && ups.length <= 7) return cand;
    if (!best || Math.abs(ups.length - 6) < Math.abs(best.ups.length - 6)) best = cand;
  }
  // (never throw at module scope: a fallback keeps the reel alive)
  return best ?? { pts: [], w0: [1, 0, 0], ups: [] };
}
const PLOT = makePlot();
const SQ = { x: 560, y: 422, r: 186 }; // plot centre and half-size (screen px on the plate): the equation + plot
// block is centred on the sheet; the IF note sits in the right margin ~60 px off the plot
const RULE_X = 498;
const NOTE = { x: SQ.x + SQ.r + 60 + 82, y: 430 };
/** where the IF leader touches the SETTLED line (plot units, then plate px) */
const FINAL = PLOT.ups.length ? PLOT.ups[PLOT.ups.length - 1].w : PLOT.w0;
const LEAD_AT = (() => {
  const [a0, a1, bb] = FINAL;
  let px = 0.78, py = Math.abs(a1) > 1e-6 ? -(a0 * px + bb) / a1 : 0;
  if (py > 0.85 || py < -0.85) {
    py = Math.max(-0.85, Math.min(0.85, py));
    px = Math.abs(a0) > 1e-6 ? -(a1 * py + bb) / a0 : 0.78;
  }
  return { x: SQ.x + px * SQ.r, y: SQ.y - py * SQ.r };
})();

// =============================================================================== the board
const B = STUDY.board;
const sagAt = (bx: number) => B.y + BOARD.threadY * B.k + Math.sin(((bx - 40) / 920) * Math.PI) * 10 * B.k;
const Q1X = 270;
const Q_CLIP = { x: B.x + Q1X * B.k, y: sagAt(Q1X) };
const Q_W = 168, Q_H = 44;
const Q_C = { x: Q_CLIP.x, y: Q_CLIP.y + (10 + 22) * B.k };
const GRIP_IN = { x: 9, y: 5 };
const Q_GRIP = { x: Q_C.x + (Q_W / 2 - GRIP_IN.x) * B.k, y: Q_C.y - (Q_H / 2) * B.k + GRIP_IN.y * B.k };
/** the NEW card is clipped straight onto the thread (no drop string): it hangs 12 world px higher than the old one,
 *  leaving a clear gap above the 1943 lantern card (C1) and its pin */
const NEW_DROP = -2;
const Q_C_NEW = { x: Q_CLIP.x, y: Q_CLIP.y + (NEW_DROP + 22) * B.k };
const Q_GRIP_NEW = { x: Q_C_NEW.x + (Q_W / 2 - GRIP_IN.x) * B.k, y: Q_C_NEW.y - (Q_H / 2) * B.k + GRIP_IN.y * B.k };
const OLD = 'How could a net rewire itself?';
const NEW = 'AND IF NO STRAIGHT LINE EXISTS?';
// raised ~48 world px (≈130 stage px) so slot K and the suspect cards below are wholly out of the insert
// round 1 (legibility): pushed in ~1.2x so the Q1 cards (the subject of the insert) clear the 22 px cap floor
// round 1: a hair left so the RULES suspect card at frame left is wholly IN the insert (it was cut by the edge)
// round 1 (BOARD MAP): Q1 is the far-left slot: the insert holds it in the frame's left third with the oxblood
// thread running from it rightward off frame, the 1943 card (C1) whole beneath it and the bottom 12% clear (C1-a
// below is out of the insert)
const CAM_Q: Camera3 = { x: 476, y: 119, z: 609, lens: 1.25 };
const CAM_Q1: Camera3 = { x: 478, y: 120, z: 616, lens: 1.25 };
const Q_SCALE = (1000 * CAM_Q.lens) / (1000 - CAM_Q.z);
/** one frame-height below the insert: where the tilt starts (the plate lies on the desk below the board) */
const CAM_LOW: Camera3 = { ...CAM_Q, y: CAM_Q.y + 760 / Q_SCALE };
const CAMS = [CAM_LOW, CAM_Q, CAM_Q1];
const POOL_B = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - B.x, cy: STUDY.pool.cy - B.y, k: 1 };

export default defineShot({
  id: ID,
  mood: 'labGreen',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const ifAt = T.beat('if');
    const lineAt = T.beat('line');
    const unpin = T.beat('unpin');
    const newcard = T.beat('newcard');
    const lineEnd = T.line('L0311').end;
    // the jumps: from 'dividing', one per mistake, the last a beat before 'If'
    // each jump is preceded by its mistake ringed in ink (so 'only on mistakes' is visible)
    const n = PLOT.ups.length;
    const j0 = lineAt + 0.1;
    const gap = Math.min(0.34, (ifAt - 0.25 - j0) / n);
    const jumps = PLOT.ups.map((_, i) => j0 + (i + 1) * gap);
    tl.hold(0, D);
    return {
      tl,
      b: {
        D,
        rule: T.beat('rule'),
        lineAt,
        ifAt,
        unpin,
        newcard,
        lineEnd,
        // a slow tilt (1.55 s, ease in-out) from the moment the IF circle closes, landing before the unpin
        tilt0: Math.max(lineEnd - 0.4, unpin - 1.7),
        tilt1: unpin - 0.15,
        jumps,
      },
    };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = tq12(t);
    const b = scene.b;
    const tilt = easeIO(clamp01((t - b.tilt0) / (b.tilt1 - b.tilt0)));
    const tint = win(t, b.tilt0 + 0.15, b.tilt0 + 1.35);
    if (tint > 0) f.setMood('candleAmber', { from: 'labGreen', u: tint });

    if (tilt <= 0) {
      // ------------------------------------------------------------- the plate on the desk (held, a hair of push)
      f.camera({ x: 640, y: 360, z: 12 * sm(t / b.tilt0), lens: 1 });
      f.backlight({ intensity: 0.22 });
      f.layer('L4', (c, env) => desk(c, env));
      plate(f, t, tq, b, 0);
      return;
    }
    // ------------------------------------------------------------- the board (tilting up into it, then the insert)
    const settle = win(t, b.tilt1, b.D);
    const cam = t < b.tilt1 ? mixCam(CAM_LOW, CAM_Q, tilt) : mixCam(CAM_Q, CAM_Q1, settle);
    f.camera(cam);
    studyRoom(f, { key: ID, cams: CAMS, outside: { mood: 'labGreen', kind: 'dawn' } });
    // the hands come in from the top-right, ALONG the oxblood thread (75% of the first cut's size)
    const qs = toScreen(LAYERS.L4, cam, Q_CLIP.x, Q_CLIP.y);
    // (far enough off frame that the withdrawing hand never reaches its own entry: no degenerate forearm)
    const entry = { R: toLayer(LAYERS.L4, cam, 2700, qs.y - 230), L: toLayer(LAYERS.L4, cam, 2800, qs.y - 120) };
    // unpin: released (u = .62) on the beat; the pin: placed (u = .45) on its beat, after the first hand is gone
    const uDur = 1.0;
    const u0 = b.unpin - 0.62 * uDur;
    const uU = clamp01((tq - u0) / uDur);
    const pDur = 1.0;
    // the thumb's press (u .45-.6) is centred on 'newcard'
    const p0 = Math.max(u0 + uDur, b.newcard - 0.52 * pDur);
    const pU = clamp01((tq - p0) / pDur);
    // (round 1: the insert is pushed in, so the hand lets go higher, mid-frame, and the card tumbles out of the bottom)
    // the hand draws the card off to the RIGHT, clear of the 1943 card below the slot, before it lets go
    const drop = { x: Q_GRIP.x + 40, y: Q_GRIP.y + 12 };
    const unPose = uU > 0 && uU < 1 ? hands.act('unpinDrop', uU, Q_GRIP, { held: 'card', entry, scale: 0.56, dropAt: drop }) : null;
    const pinPose = pU > 0 && pU < 0.92 ? hands.act('pin', pU, Q_GRIP_NEW, { held: 'card', entry, scale: 0.56 }) : null;
    const lightQ = poolAt(POOL_B, Q1X, BOARD.threadY + 40);
    const st = boardStateAt(ID, 'start');
    const noQ1 = { ...st, questions: st.questions.filter((q) => q.slot !== 'Q1') };
    const oldHung = uU < 0.42;
    const released = uU >= 0.62;
    const newPlaced = pU >= 0.45;
    const tPlaced = p0 + 0.45 * pDur;
    studyCase(f, {
      shot: ID,
      when: 'start',
      key: ID,
      board: { state: noQ1 },
      extra: (c, env) => {
        // the old card hangs until the fingers lift it off its clip
        if (oldHung) hangCard(c, env, OLD, lightQ, 0, 10, true);
        if (newPlaced) {
          const tp = tq - tPlaced;
          hangCard(c, env, NEW, lightQ, 0.07 * Math.exp(-tp * 1.5) * Math.sin(tp * 5.0), NEW_DROP);
        } else clip(c, env);
        // the old card falling into the lamp's pool after it is let go (on twos, a slow tumble)
        if (released) {
          const ft = tq - (u0 + 0.62 * uDur);
          if (ft < 1.2) {
            // round 1: it drops DOWN into the lamp's pool below the board (catching more light as it falls), a slow
            // tumble on twos, never tossed off the frame's bottom-right edge
            const y = drop.y - 20 * ft + 0.5 * 900 * ft * ft;
            const x = drop.x - (Q_W / 2 - GRIP_IN.x) * B.k + 26 * sm(ft / 0.6);
            oldCard(c, env, x, y + (Q_H / 2) * B.k, Math.min(1, lightQ * (1 + 0.5 * ft)), 0.55 * ft);
          }
        }
        const held = (text: string) => (cc: C, at: { x: number; y: number }, _h: unknown, e: PaintEnv) =>
          text === OLD
            ? oldCard(cc, e, at.x - (Q_W / 2 - GRIP_IN.x) * B.k, at.y + (Q_H / 2 - GRIP_IN.y) * B.k, lightQ, 0)
            : drawCard(cc, { id: 'Q-held', w: Q_W, h: Q_H, icon: 'question', text }, { x: at.x - (Q_W / 2 - GRIP_IN.x) * B.k, y: at.y + (Q_H / 2 - GRIP_IN.y) * B.k, k: B.k, light: lightQ, pin: false }, e);
        if (unPose) hands.draw(c, unPose, env, { heldDraw: held(OLD) });
        if (pinPose) hands.draw(c, pinPose, env, { heldDraw: held(NEW) });
      },
    });
    // the lamp's pool on the insert: bright around Q1, falling off (exposure, not a veil)
    {
      const c = f.c;
      c.save();
      c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
      const g = c.createRadialGradient(640, 300, 160, 760, 330, 1000);
      g.addColorStop(0, withAlpha(f.mood.fg, 0));
      g.addColorStop(0.55, withAlpha(f.mood.fg, 0.22));
      g.addColorStop(1, withAlpha(f.mood.fg, 0.6));
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
      c.restore();
    }
    f.fog({ yCenter: 560, height: 260, alpha: 0.12, drift: 7 });
    if (cam.z < 380) studyNear(f, { key: ID, cams: CAMS, file: true });
    // the plate, carried down out of frame by the tilt
    if (tilt < 1) plate(f, t, tq, b, tilt);
  },
});

type Beats = { D: number; rule: number; lineAt: number; ifAt: number; unpin: number; newcard: number; lineEnd: number; tilt0: number; tilt1: number; jumps: number[] };

/** the dark desk under the plate (labGreen lamp pool) */
function desk(c: C, env: PaintEnv) {
  const P = env.mood;
  c.fillStyle = mixLab(P.fg, P.set, 0.3);
  c.fillRect(-200, -200, 1680, 1120);
  const g = c.createRadialGradient(620, 340, 60, 620, 340, 820);
  g.addColorStop(0, withAlpha(mixLab(P.set, P.halo, 0.25), 0.9));
  g.addColorStop(1, withAlpha(P.set, 0));
  c.fillStyle = g;
  c.fillRect(-200, -200, 1680, 1120);
}

// =============================================================================== the plate
const PAPER = MOODS.parchment.sky[0];
const PAPER2 = MOODS.parchment.sky[3];
const INK = MOODS.parchment.ink;
function plate(f: Frame, t: number, tq: number, b: Beats, tilt: number) {
  const c = f.c;
  c.save();
  c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
  // the tilt carries the desk + plate down; a dark band of desk shows above it as the board arrives
  const dy = tilt * 780;
  c.translate(0, dy);
  if (tilt > 0) {
    // the TILT's middle state, one continuous move in the study: the plate's top edge, the lamp-lit desk beyond
    // it, then the desk's back LIP passing as a near, soft-edged occluder, then the board above
    const P = f.mood;
    c.fillStyle = mixLab(P.fg, P.set, 0.32);
    c.fillRect(0, -150, 1280, 950);
    const sheen = c.createRadialGradient(640, -40, 40, 640, -40, 700);
    sheen.addColorStop(0, withAlpha(mixLab(P.set, P.halo, 0.4), 0.55));
    sheen.addColorStop(1, withAlpha(P.set, 0));
    c.fillStyle = sheen;
    c.fillRect(0, -150, 1280, 400);
    // the lip: a thick dark edge with a lamp-lit top, blurred (near the lens)
    c.save();
    c.filter = `blur(${(3 * f.pxScale).toFixed(1)}px)`;
    c.fillStyle = P.ink;
    c.fillRect(-20, -190, 1320, 46);
    c.fillStyle = withAlpha(P.rim, 0.55);
    c.fillRect(-20, -192, 1320, 3);
    c.restore();
    const gg = c.createLinearGradient(0, -260, 0, -190);
    gg.addColorStop(0, withAlpha(P.fg, 0));
    gg.addColorStop(1, withAlpha(P.fg, 0.75));
    c.fillStyle = gg;
    c.fillRect(0, -260, 1280, 70);
  }
  // the sheet (baked once): deckled, grained, lamp-lit from the top left, ~12% darker in the corners
  f.cached(`${ID}/sheet3`, 1280, 720, (cc) => sheet(cc, f.mood.fg))(c, 0, 0);

  // ---- the rule, inked BY TERMS (never a half-glyph): 'w ←', then 'w +', then 'η t x'
  const ruleY = 128;
  const gA = [win(t, b.rule, b.rule + 0.18), win(t, b.rule + 0.3, b.rule + 0.48), win(t, b.rule + 0.6, b.rule + 0.78)];
  c.save();
  c.fillStyle = INK;
  c.textBaseline = 'alphabetic';
  c.textAlign = 'left';
  const it = `italic 400 66px ${FONT.text}`;
  const up = `400 66px ${FONT.text}`;
  let x = RULE_X;
  let group = 0;
  const put = (s2: string, font: string, gapAfter = 10) => {
    c.font = font;
    c.globalAlpha = gA[group];
    if (gA[group] > 0.005) c.fillText(s2, x, ruleY);
    const w = c.measureText(s2).width;
    const cx = x + w / 2;
    x += w + gapAfter;
    return cx;
  };
  const wx = put('w', it, 18);
  // the arrow ←, drawn
  c.globalAlpha = gA[0];
  c.strokeStyle = INK;
  c.lineWidth = 2.6;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x + 54, ruleY - 18);
  c.lineTo(x + 4, ruleY - 18);
  c.moveTo(x + 18, ruleY - 30);
  c.lineTo(x + 4, ruleY - 18);
  c.lineTo(x + 18, ruleY - 6);
  if (gA[0] > 0.005) c.stroke();
  x += 74;
  group = 1;
  put('w', it, 14);
  put('+', up, 16);
  group = 2;
  const etaX = put('η', it, 10);
  const tX0 = x;
  put('t', it, 10);
  put('x', it, 0);
  const txX = (tX0 + x) / 2;
  c.restore();
  // the three small ink labels
  const lab = win(t, b.rule + 0.7, b.rule + 1.3);
  if (lab > 0.01) {
    c.save();
    c.globalAlpha = lab;
    c.fillStyle = withAlpha(INK, 0.8);
    // round 1: ~25% larger and sized by the legibility floor (cap ≥ 22 px at 1080p); the t·x label set back
    // inside the plate's text column
    const ls = Math.max(30, legibleSize(c, `italic 400 30px ${FONT.text}`, 30));
    c.font = `italic 400 ${ls}px ${FONT.text}`;
    c.textAlign = 'center';
    c.fillText('weight', wx, ruleY + 52);
    c.fillText('step', etaX, ruleY + 52);
    c.textAlign = 'left';
    c.fillText('right answer × input', txX + 16, ruleY + 92);
    c.strokeStyle = withAlpha(INK, 0.5);
    c.lineWidth = 1;
    c.beginPath();
    for (const xx of [wx, etaX]) {
      c.moveTo(xx, ruleY + 14);
      c.lineTo(xx, ruleY + 24);
    }
    // the t·x leader: down, then right to its label
    c.moveTo(txX, ruleY + 14);
    c.lineTo(txX, ruleY + 66);
    c.stroke();
    c.restore();
  }

  // ---- the plot
  const plotA = win(t, b.rule + 0.6, b.lineAt - 0.3);
  if (plotA > 0.01) {
    c.save();
    c.globalAlpha = plotA;
    c.strokeStyle = withAlpha(INK, 0.7);
    c.lineWidth = 1.4;
    c.strokeRect(SQ.x - SQ.r, SQ.y - SQ.r, SQ.r * 2, SQ.r * 2);
    // tick marks
    for (let k = -2; k <= 2; k++) {
      const v = (k / 2) * SQ.r * 0.9;
      c.beginPath();
      c.moveTo(SQ.x + v, SQ.y + SQ.r);
      c.lineTo(SQ.x + v, SQ.y + SQ.r + 6);
      c.moveTo(SQ.x - SQ.r, SQ.y - v);
      c.lineTo(SQ.x - SQ.r - 6, SQ.y - v);
      c.stroke();
    }
    // which update is in force (the line jumps on twos at each mistake)
    let k = -1;
    for (let i = 0; i < b.jumps.length; i++) if (tq >= b.jumps[i]) k = i;
    const w = k < 0 ? PLOT.w0 : PLOT.ups[k].w;
    const lineA = win(t, b.lineAt - 0.45, b.lineAt - 0.15);
    // the points
    PLOT.pts.forEach((p, i) => {
      const px = SQ.x + p.x * SQ.r, py = SQ.y - p.y * SQ.r;
      c.strokeStyle = INK;
      c.fillStyle = INK;
      c.lineWidth = 1.9 + 1.0 * h01(i, 77);
      if (p.c > 0) {
        c.beginPath();
        c.arc(px, py, 7, 0, Math.PI * 2);
        c.stroke();
      } else {
        c.beginPath();
        c.moveTo(px - 6.5, py - 6.5);
        c.lineTo(px + 6.5, py + 6.5);
        c.moveTo(px + 6.5, py - 6.5);
        c.lineTo(px - 6.5, py + 6.5);
        c.stroke();
      }
      // round 1: the MISTAKE that causes each jump is ringed in heavy ink (and a pale wash behind it) for ~3 frames
      // while the old line still stands, and the ring lingers one twos step after the snap, fading
      const nx = k + 1;
      const pre = nx < PLOT.ups.length && PLOT.ups[nx].wrong === i && tq >= b.jumps[nx] - 0.13;
      const post = k >= 0 && PLOT.ups[k].wrong === i && tq < b.jumps[k] + 1 / 12;
      if (pre || post) {
        c.globalAlpha = plotA * (pre ? 1 : 0.5);
        c.fillStyle = withAlpha('#fff6dc', 0.7);
        c.beginPath();
        c.arc(px, py, 17, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = INK;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(px, py, 19, 0, Math.PI * 2);
        c.stroke();
        // redraw the mark over the wash
        c.lineWidth = 2.4;
        c.beginPath();
        if (p.c > 0) c.arc(px, py, 7, 0, Math.PI * 2);
        else {
          c.moveTo(px - 6.5, py - 6.5);
          c.lineTo(px + 6.5, py + 6.5);
          c.moveTo(px + 6.5, py - 6.5);
          c.lineTo(px - 6.5, py + 6.5);
        }
        c.stroke();
        c.globalAlpha = plotA;
      }
    });
    // the dividing line, clipped to the square: INKED (a tapered stroke, heavier mid-line), and each jump lands
    // with a 2-3 degree overshoot that settles back on the next twos step, and a brief ink bleed
    if (lineA > 0.01) {
      c.save();
      c.beginPath();
      c.rect(SQ.x - SQ.r, SQ.y - SQ.r, SQ.r * 2, SQ.r * 2);
      c.clip();
      c.globalAlpha = plotA * lineA;
      const [a0, a1, bb] = w;
      // a0 x + a1 y + b = 0, in plot units; draw across the square
      const pts: [number, number][] = [];
      if (Math.abs(a1) > Math.abs(a0)) {
        for (const xx of [-1.2, 1.2]) pts.push([xx, -(a0 * xx + bb) / a1]);
      } else {
        for (const yy of [-1.2, 1.2]) pts.push([-(a1 * yy + bb) / a0, yy]);
      }
      let A = { x: SQ.x + pts[0][0] * SQ.r, y: SQ.y - pts[0][1] * SQ.r };
      let Bp = { x: SQ.x + pts[1][0] * SQ.r, y: SQ.y - pts[1][1] * SQ.r };
      const since = k >= 0 ? tq - b.jumps[k] : 99;
      if (since < 1 / 12 - 1e-6) {
        // the overshoot: rotate about the line's point nearest the square's centre, past the new angle
        const prev = k > 0 ? PLOT.ups[k - 1].w : PLOT.w0;
        const angOf = (ww: number[]) => Math.atan2(ww[0], ww[1]);
        let dA = angOf(w) - angOf(prev);
        while (dA > Math.PI) dA -= Math.PI * 2;
        while (dA < -Math.PI) dA += Math.PI * 2;
        const over = Math.sign(dA) * 0.045;
        const mx = (A.x + Bp.x) / 2, my = (A.y + Bp.y) / 2;
        const rot = (p: { x: number; y: number }) => ({ x: mx + (p.x - mx) * Math.cos(over) - (p.y - my) * Math.sin(over), y: my + (p.x - mx) * Math.sin(over) + (p.y - my) * Math.cos(over) });
        A = rot(A);
        Bp = rot(Bp);
      }
      inkLine(c, A, Bp, 3.4, 40 + k);
      if (since < 0.18) {
        // the ink bleeds a moment as the nib lands
        c.globalAlpha = plotA * lineA * 0.22 * (1 - since / 0.18);
        c.strokeStyle = INK;
        c.lineWidth = 9;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(A.x, A.y);
        c.lineTo(Bp.x, Bp.y);
        c.stroke();
      }
      c.restore();
    }
    // a small count of the jumps under the plot (ink tally, no caption)
    c.restore();
  }

  // ---- the margin note: IF, written then circled
  const ifA = win(t, b.ifAt - 0.1, b.ifAt + 0.2);
  if (ifA > 0.01) {
    const NX = NOTE.x, NY = NOTE.y;
    c.save();
    c.globalAlpha = ifA;
    c.fillStyle = INK;
    c.font = `italic 500 78px ${FONT.text}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('IF', NX, NY);
    // the circle, drawn round on twos (a hand-drawn loop that overshoots its start)
    const cu = sm((tq - (b.ifAt + 0.1)) / 0.55);
    if (cu > 0) {
      c.strokeStyle = INK;
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.beginPath();
      const a0 = -2.4;
      const steps = 40;
      for (let i = 0; i <= steps * cu; i++) {
        const a = a0 + (i / steps) * Math.PI * 2.2;
        const rr = 1 + 0.06 * Math.sin(a * 3 + 1);
        const px = NX + Math.cos(a) * 82 * rr, py = NY + 4 + Math.sin(a) * 58 * rr;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.stroke();
    }
    // a short ink leader from the circle to the SETTLED line (the "if" is about that line), and a tiny gloss
    const lu = sm((tq - (b.ifAt + 0.7)) / 0.42);
    if (lu > 0) {
      const S0 = { x: NX - 86, y: NY + 14 };
      const E0 = LEAD_AT;
      const C0 = { x: (S0.x + E0.x) / 2, y: Math.max(S0.y, E0.y) + 46 };
      c.strokeStyle = INK;
      c.lineWidth = 2;
      c.lineCap = 'round';
      c.beginPath();
      const n = 24;
      for (let i = 0; i <= n * lu; i++) {
        const u = i / n;
        const px = (1 - u) * (1 - u) * S0.x + 2 * (1 - u) * u * C0.x + u * u * E0.x;
        const py = (1 - u) * (1 - u) * S0.y + 2 * (1 - u) * u * C0.y + u * u * E0.y;
        if (i === 0) c.moveTo(px, py);
        else c.lineTo(px, py);
      }
      c.stroke();
      if (lu > 0.98) {
        c.beginPath();
        c.arc(E0.x, E0.y, 4, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
  }
  c.restore();
}

/** a nib-inked straight line: a tapered polygon, heavier through the middle, with a faint seeded wobble */
function inkLine(c: C, A: { x: number; y: number }, B2: { x: number; y: number }, w: number, seed: number) {
  const dx = B2.x - A.x, dy = B2.y - A.y;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const n = 16;
  const side = (s2: number) => {
    const out: { x: number; y: number }[] = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      const ww = (w / 2) * (0.62 + 0.55 * Math.sin(Math.PI * u)) * (0.92 + 0.16 * h01(i, seed));
      out.push({ x: A.x + dx * u + nx * ww * s2, y: A.y + dy * u + ny * ww * s2 });
    }
    return out;
  };
  const l = side(1), r = side(-1).reverse();
  c.fillStyle = INK;
  c.beginPath();
  [...l, ...r].forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.closePath();
  c.fill();
}

/** the parchment sheet on its desk shadow, at screen scale (baked): deckle, grain and fibres, deckle shading,
 *  the lamp's falloff (brighter top-left), corners ~12% darker */
function sheet(c: C, fg: string) {
  softPlate(c, 640, 360, 1300, 760, fg, 0.5);
  const PX = 80, PY = 44, PW = 1120, PH = 616;
  // round 1: a second sheet under the plate (paper-theatre depth): offset a few px, turned a hair, a step darker,
  // its edge softened, and the top sheet's shadow on it
  c.save();
  c.filter = 'blur(2px)';
  c.translate(640 + 12, 360 + 9);
  c.rotate(0.011);
  c.fillStyle = mixLab(PAPER2, '#5a4630', 0.38);
  c.fillRect(-PW / 2, -PH / 2, PW, PH);
  c.restore();
  c.save();
  c.filter = 'blur(5px)';
  c.fillStyle = 'rgba(40,28,14,0.28)';
  c.fillRect(PX + 5, PY + 6, PW, PH);
  c.restore();
  const g = c.createRadialGradient(560, 300, 80, 600, 330, 760);
  g.addColorStop(0, PAPER);
  g.addColorStop(1, PAPER2);
  c.fillStyle = g;
  c.beginPath();
  const N = 50;
  for (let i = 0; i <= N; i++) c.lineTo(PX + (PW * i) / N, PY + (h01(i, 1) - 0.5) * 3);
  for (let i = 0; i <= 25; i++) c.lineTo(PX + PW + (h01(i, 2) - 0.5) * 3, PY + (PH * i) / 25);
  for (let i = N; i >= 0; i--) c.lineTo(PX + (PW * i) / N, PY + PH + (h01(i, 3) - 0.5) * 3);
  for (let i = 25; i >= 0; i--) c.lineTo(PX + (h01(i, 4) - 0.5) * 3, PY + (PH * i) / 25);
  c.closePath();
  c.fill();
  c.save();
  c.clip();
  for (let i = 0; i < 2200; i++) {
    const x = PX + h01(i, 91) * PW, y = PY + h01(i, 92) * PH;
    const d = h01(i, 93);
    c.fillStyle = d > 0.5 ? withAlpha('#6e5a3e', 0.04 + 0.07 * d) : withAlpha('#fff8e4', 0.05 + 0.08 * d);
    if (i % 6 === 0) c.fillRect(x, y, 3 + 10 * h01(i, 94), 0.7);
    else c.fillRect(x, y, 1.1, 1.1);
  }
  // the lamp: brighter top-left, falling off; the corners about 12% darker
  const lamp = c.createRadialGradient(380, 170, 30, 380, 170, 760);
  lamp.addColorStop(0, 'rgba(255,248,226,0.16)');
  lamp.addColorStop(1, 'rgba(255,248,226,0)');
  c.fillStyle = lamp;
  c.fillRect(PX, PY, PW, PH);
  const vg = c.createRadialGradient(560, 320, 300, 640, 360, 760);
  vg.addColorStop(0, 'rgba(50,34,18,0)');
  vg.addColorStop(1, 'rgba(50,34,18,0.12)');
  c.fillStyle = vg;
  c.fillRect(PX, PY, PW, PH);
  // deckle shading: a narrow warm-dark band inside every edge
  const e = 16;
  const bands: [number, number, number, number, number, number, number, number][] = [
    [PX, PY, PW, e, 0, PY, 0, PY + e],
    [PX, PY + PH - e, PW, e, 0, PY + PH, 0, PY + PH - e],
    [PX, PY, e, PH, PX, 0, PX + e, 0],
    [PX + PW - e, PY, e, PH, PX + PW, 0, PX + PW - e, 0],
  ];
  for (const [x, y, w, h, x0, y0, x1, y1] of bands) {
    const lg = c.createLinearGradient(x0, y0, x1, y1);
    lg.addColorStop(0, 'rgba(96,68,36,0.16)');
    lg.addColorStop(1, 'rgba(96,68,36,0)');
    c.fillStyle = lg;
    c.fillRect(x, y, w, h);
  }
  c.restore();
}

/** a question card hanging from the oxblood thread at Q1 (as caseBoard draws them), swaying by `sway` rad */
function hangCard(c: C, env: PaintEnv, text: string, light: number, sway: number, drop = 10, old = false) {
  c.save();
  c.translate(Q_CLIP.x, Q_CLIP.y);
  c.rotate(sway);
  if (drop > 0) {
    c.strokeStyle = oxblood(env);
    c.lineWidth = 1.2 * B.k;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, drop * B.k);
    c.stroke();
  }
  if (old) oldCard(c, env, 0, (drop + 22) * B.k, light, 0);
  else drawCard(c, { id: 'Q-Q1', w: Q_W, h: Q_H, icon: 'question', text }, { x: 0, y: (drop + 22) * B.k, k: B.k, light, pin: false }, env);
  if (drop <= 0) {
    // a small bulldog clip biting the card's top edge onto the thread
    c.fillStyle = env.fill('ink');
    c.fillRect(-4 * B.k, (drop - 3) * B.k, 8 * B.k, 7 * B.k);
    c.fillStyle = withAlpha(env.mood.rim, 0.5);
    c.fillRect(-4 * B.k, (drop - 3) * B.k, 8 * B.k, 1);
  }
  c.restore();
}
/** the ch02-s03 card EXACTLY as it was pinned there: the same stock, the question in two lines of a fountain-pen
 *  italic hand (mixed case, not typed): How could a net / rewire itself? */
const OLD_LINES = ['How could a net', 'rewire itself?'];
function oldCard(c: C, env: PaintEnv, x: number, y: number, light: number, rot: number) {
  const k = B.k;
  drawCard(c, { id: 'Q-Q1', w: Q_W, h: Q_H, icon: 'question', text: '' }, { x, y, k, light, pin: false, rot }, env);
  const paper = paperTone(env, light);
  c.save();
  c.translate(x, y);
  c.rotate(rot + 0.012);
  c.fillStyle = mixLab(env.mood.ink, paper, 0.05);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const fs = Math.min(19.5 * k, legibleSize(c, `italic 500 ${15.5 * k}px ${FONT.text}`, 15.5 * k) * 1.05);
  c.font = `italic 500 ${fs}px ${FONT.text}`;
  OLD_LINES.forEach((l, i) => {
    c.save();
    c.translate((i === 0 ? -3 : 4) * k, (i - 0.5) * fs * 1.04 + 1 * k);
    c.rotate(i === 0 ? -0.018 : 0.01);
    c.fillText(l, 0, 0);
    c.restore();
  });
  c.restore();
}

/** the bare clip on the thread while the slot is empty */
function clip(c: C, env: PaintEnv) {
  c.strokeStyle = oxblood(env);
  c.lineWidth = 1.2 * B.k;
  c.beginPath();
  c.moveTo(Q_CLIP.x, Q_CLIP.y);
  c.lineTo(Q_CLIP.x, Q_CLIP.y + 8 * B.k);
  c.stroke();
  void lerp;
}
