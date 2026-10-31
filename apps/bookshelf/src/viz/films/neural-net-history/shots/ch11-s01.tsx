/**
 * ch11-s01 — Read Everything (wordless; candleAmber STUDY → serverCyan library; 14.0 s; paper wipe in, a chapter
 * break, from ch10-s14's hanging ghost slot).
 *
 * CAMERA: X-RAY (square-on, framed by the study: the coat's hem above it, the lamp's haze over its edges) → BOARD
 * (an ease left to C3, 2.55 → 3.4) → COAT (a slow rise and push on the re-cut tag) → the coat is carried toward the
 * lens and wipes the frame (no whip: the coat leads, the camera only drifts) → the study WINDOW → a push through
 * the glass into the LIBRARY (dissolve, serverCyan).
 *   0.1        the manila index tab 'Read Everything' drops at TOP-LEFT, holds 2.5 s, slides up
 *   'xray5'    the translucent chat box: band 5 (threads of attention) lights beside bands 1–4; held
 *   'pinC3d'   the ease to the board lands by 3.4; the hand (from the bottom edge, below the board) holds the
 *              thread-of-light card in frame 3.0 → 3.7, pins it into C3-d, and a faint thread of light is drawn
 *              from it to the filter-tile card in C3-c over 0.6 s (3.75 → 4.35) before the camera leaves
 *   'liftCoat' a hand from above (only hand and cuff in frame; never over the Wall or the X-ray box) lifts the
 *              dusty frock coat (tag PRE-TRAINING) off its brass hook and shakes it out
 *   'recut'    the re-cut on twos, three drawings 4.55 → 4.9: the new outline traced in light; the tails shear
 *              off and the hem drops; the long modern overcoat with notch lapels. The new tag turns in with a
 *              0.15 s stamp flash: PRE-TRAINING / READ EVERYTHING FIRST (held, legible, until the wipe)
 *   7.4        the camera drifts right (≤ 6% frame width per second) as the hand carries the coat ahead of it,
 *              toward the lens: the dark coat wipes the frame (8.45) and clears right onto the study window
 *   'library'  the push through the glass (candleAmber → serverCyan, 1.2 s, no dip) into a canyon of unlabelled
 *              shelves to the horizon; 2018 types bottom-left
 *   'machines' GPT (left) steps forward on twos, setting one new slug in the floor line every 0.6 s, its beam
 *              pointing only right; BERT (right) stands still, twin beams from left and right converging on one
 *              blanked slug, which fills in (then a second). One shared caption line, each name under its machine.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { defineShot, mixLab, toLayer, toScreen, withAlpha, LAYERS } from '../../../film';
import { hands } from '../cast';
import { HAND_LEN, type Pt } from '../sets/narratorHands';
import { STUDY, slotWorld, studyCase, studyNear } from '../sets/study';
import { SLOTS } from '../sets/studyState';
import { DEFAULT_POOL, drawCard, poolAt } from '../sets/caseBoard';
import { indexTab } from '../sets/indexTab';
import { screenPass } from '../sets/ch06-s01-kit';
import { FONT, legibleSize } from '../../../film/silhouette/type';
import { bankersLamp } from '../../../film/silhouette/props';
import { vellumBox, vellumHalo, type BandRect } from '../sets/ch11-s01-vellum';
import { xrayBandsAt } from '../sets/studyState';
import type { LayerSpec } from '../../../film';
import {
  HOOK,
  NEW_HEM,
  OLD_SKIRT,
  WINDOW_CAM,
  bentArm,
  bigTag,
  camPath,
  clamp01,
  coatAt,
  coatHook,
  compositeSub,
  lanternMachine,
  lerp,
  libraryRoom,
  miniSlug,
  monoDate,
  paintLibrary,
  sm,
  softPlate,
  subFrame,
  tq12,
  win,
} from '../sets/ch11-s01-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch11-s01';
const POOL = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };

// ------------------------------------------------------------------------------------------------ cameras
// the X-ray opening is framed right of the index tab: the hook and the frock coat's shoulders sit in clear wall beside
// it (the 'coat from chapter 7' is established before the lift), then a slow push onto band 5
const XR0: Camera3 = { x: 1172, y: 350, z: 70, lens: 1 };
const XR1: Camera3 = { x: 1200, y: 432, z: 250, lens: 1 };
const PIN: Camera3 = { x: 1030, y: 362, z: 150, lens: 1 };
const COAT1: Camera3 = { x: 1160, y: 168, z: 290, lens: 1 };
const COAT2: Camera3 = { x: 1172, y: 166, z: 306, lens: 1 };
const COAT3: Camera3 = { x: 1226, y: 170, z: 306, lens: 1 };
const WIN0: Camera3 = { ...WINDOW_CAM, x: WINDOW_CAM.x - 110, y: 474, z: 210 };
const WIN0b: Camera3 = { ...WINDOW_CAM, y: 476, z: 262 };
const WIN1: Camera3 = { ...WINDOW_CAM, y: 486, z: 590 };
const STUDY_CAMS = [XR0, XR1, PIN, COAT1, COAT2, COAT3, WIN0, WIN0b, { ...WINDOW_CAM, z: 330 }];
const LIB0: Camera3 = { x: 640, y: 384, z: -300, lens: 1 };
const LIB1: Camera3 = { x: 640, y: 376, z: -40, lens: 1 };
const LIB2: Camera3 = { x: 676, y: 378, z: 18, lens: 1 };
const LIB_CAMS = [LIB0, LIB1, LIB2];

interface B {
  D: number;
  xray: number;
  pin0: number;
  thread0: number;
  coat0: number;
  lift: number;
  recut0: number;
  carry: number;
  near0: number;
  wipe: number;
  near1: number;
  lib: number;
  machines: number;
}
const PIN_DUR = 1.5;

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const lib = T.beat('library');
    const pinB = T.beat('pinC3d');
    const b: B = {
      D,
      xray: T.beat('xray5'),
      pin0: pinB + 0.2,
      thread0: pinB + 0.95,
      coat0: T.beat('liftCoat') - 0.3,
      lift: T.beat('liftCoat'),
      recut0: T.beat('recut') - 0.15,
      // the coat is carried right and swung past the lens EARLY (a 0.3 s wipe), so the window and its library glow
      // hold the frame from ~7.4 s, the banker's lamp sliding past in the near plane, before the push at 'library'
      carry: lib - 2.7,
      near0: lib - 2.35,
      wipe: lib - 2.0,
      near1: lib - 1.7,
      lib,
      machines: T.beat('machines'),
    };
    tl.hold(0, D);
    const cam = camPath([
      [0, XR0],
      [pinB - 0.25, XR1],
      [pinB + 0.6, PIN],
      [b.thread0 + 0.6, PIN],
      [b.recut0 + 1.2, COAT1],
      [b.carry, COAT2],
      [b.wipe, COAT3, (u) => u],
    ]);
    const winCam = camPath([
      [b.wipe, WIN0],
      [lib, WIN0b, (u) => u],
      [lib + 0.85, WIN1, (u) => u * u],
    ]);
    const libCam = camPath([
      [lib, LIB0],
      [b.machines, LIB1, (u) => 1 - (1 - u) * (1 - u)],
      [D, LIB2],
    ]);
    return { tl, b, cam, winCam, libCam };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    const camAt = (q: number) => (q < b.wipe ? (scene.cam as (t: number) => Camera3)(q) : (scene.winCam as (t: number) => Camera3)(q));
    const libCamAt = scene.libCam as (t: number) => Camera3;
    const dis = win(t, b.lib + 0.1, b.lib + 0.8);
    let envL4: PaintEnv | null = null;
    if (dis < 1) {
      envL4 = paintStudy(f, t, b, camAt(t));
      if (dis > 0) {
        const cv = subFrame(f, `${ID}/lib`, 'serverCyan', (g) => library(g, t, b, libCamAt(t)));
        compositeSub(f, cv, dis);
      }
    } else {
      f.setMood('serverCyan');
      library(f, t, b, libCamAt(t));
    }
    // ---- the coat carried toward the lens: it wipes the frame (screen space, growing blur)
    if (envL4 && t >= b.near0 && t < b.near1 + 0.15) nearCoat(f, envL4, t, b, scene.cam as (t: number) => Camera3);
    // ---- screen-locked type
    screenPass(f, (c) => {
      indexTab(c, { title: 'Read Everything', number: 11, at: 0.1, hold: 2.5 }, { t, mood: f.mood });
      monoDate(c, f.mood, t, b.lib + 0.05, '2018');
    });
  },
});

// ================================================================================================= STUDY
function paintStudy(f: Frame, t: number, b: B, cam: Camera3): PaintEnv | null {
  f.camera(cam);
  const mu = win(t, b.lib - 0.1, b.lib + 1.1);
  if (mu > 0) f.setMood('serverCyan', { from: 'candleAmber', u: mu });
  // the window wall is kept at the board's exposure (+25 % ambient as the coat clears): no fade to black
  libraryRoom(f, { key: ID, cams: STUDY_CAMS, windowGlow: 0.4 + 0.8 * win(t, b.wipe - 0.2, b.lib + 0.6), ambient: win(t, b.near0, b.wipe + 0.2) });
  const tq = tq12(t);
  // band 5 (threads of attention): its lamp warms over 0.6 s, then 6 threads stroke on one by one, 0.4 → 1.6 s;
  // held at 1.6 × the lit bands below for the full hold
  const bandGlow = t < b.xray - 0.1 ? 0 : sm((t - b.xray + 0.1) / 0.6);
  const threadsU = clamp01((tq - b.xray) / 1.2);
  const xl = 0.75 + 0.25 * win(t, b.xray - 0.2, b.xray + 0.5);
  const uPin = (tq - b.pin0) / PIN_DUR;
  const thread = clamp01((t - b.thread0) / 0.6);
  let out: PaintEnv | null = null;
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    xray: false,
    extra: (c, env) => {
      out = env;
      // the X-ray as backlit vellum (round-1 global restyle), band 5 the shot's own beat
      vellumBox(c, env, { ...STUDY.xray, state: xrayBandsAt(ID, 'start'), light: xl, own: { band: 5, u: threadsU, glow: bandGlow, glyph: attentionThreads } });
      vellumHalo(c, STUDY.xray, xl * (0.7 + 0.3 * bandGlow));
      // the room's amber haze laid over the X-ray box's edges, so the glass sits IN the study
      boxHaze(c, env);
      // ---- the pin at C3-d and its thread of light to the filter-tile card (C3-c)
      if (uPin >= 0.45) clueCard(c, env, slotWorld('C3-d'), 0.35 * thread);
      if (thread > 0) threadArc(c, env, cardEdge('C3-d'), cardEdge('C3-c'), thread);
      if (uPin > 0 && uPin < 1) {
        // the arm enters from the bottom edge, below the board (a short forearm, never across the X-ray glass)
        const E = toLayer(LAYERS.L4, cam, 560, 840);
        const pose = hands.act('pin', uPin, slotWorld('C3-d', 'pin'), { held: 'card', scale: 0.62, entry: { R: E, L: E } });
        hands.draw(c, pose, env, { heldDraw: (cc, at, _h, e) => clueCard(cc, e, { x: at.x, y: at.y + SLOTS['C3-d'].h / 2 - 7 }, 0) });
      }
      // ---- the coat on its hook, lifted, re-cut, held (in L4 until it swings toward the lens)
      coatHook(c, env, 0.6);
      if (t < b.near0) {
        const p = coatPos(tq, b);
        drawCoat(c, env, p, tq, b, coatHand(tq, b, p));
      }
    },
  });
  // the shared near plane: drape and chair back only (the pelmet's 400 px band covers the whole frame when the camera
  // rises to the coat hook at the top of the wall)
  const atWindow = t >= b.wipe;
  if (cam.z < 420) studyNear(f, { key: ID, cams: STUDY_CAMS.filter((q) => q.z < 420), file: true, desk: !atWindow, occluders: { valance: false } });
  // the banker's lamp: the camera follows the coat past it. A sharp near-black silhouette in the near plane, lit,
  // sliding across the frame (screen x 1000 → 200 over 7.0 → 9.0 s) as the camera trucks to the window
  if (atWindow && t < b.lib + 0.9) nearLamp(f, t, b, cam);
  return out;
}

/** the near lamp's own plane: L5's depth, but sharp (the critic's note: a crisp silhouette, not a blur) */
const LAMP_PLANE: LayerSpec = { id: 'nearLamp', z: 650, haze: 0, blur: 0.4 };
const LAMP_S = 6.4;
function nearLamp(f: Frame, t: number, b: B, cam: Camera3) {
  const u = sm((t - (b.wipe - 0.25)) / 2.0);
  // past x 200 at 9.0 s it keeps going: the push carries the camera past it and out of the near plane
  const sx = lerp(1000, 200, u) - 520 * clamp01((t - (b.wipe + 1.75)) / 0.85) ** 2;
  // the lamp's foot on the desk edge just below frame; its shade at about a third of the frame height
  const k = toScreen(LAMP_PLANE, cam, 0, 0).k;
  const at = toLayer(LAMP_PLANE, cam, sx, 742);
  const sc = LAMP_S / k;
  const bulb = bankersLamp.anchors({ x: at.x, y: at.y, s: sc }).bulb;
  f.layer(LAMP_PLANE, (c, env) => {
    const ink = mixLab(env.mood.ink, '#000000', 0.35);
    const nearEnv = { ...env, fill: (r: Parameters<PaintEnv['fill']>[0]) => (r === 'ink' || r === 'fg' ? ink : env.fill(r)) } as PaintEnv;
    // the desk edge it stands on (a dark slab across the bottom, rim-lit along its top)
    const d = toLayer(LAMP_PLANE, cam, -40, 700);
    const d1 = toLayer(LAMP_PLANE, cam, 1320, 760);
    c.fillStyle = ink;
    c.fillRect(d.x, d.y + (at.y - d.y) * 0.55, d1.x - d.x, d1.y - d.y + 200);
    c.fillStyle = withAlpha(env.mood.rim, 0.3);
    c.fillRect(d.x, d.y + (at.y - d.y) * 0.55, d1.x - d.x, 1.5 / k);
    bankersLamp(c, { x: at.x, y: at.y, s: sc, lit: true, seed: 41 }, nearEnv);
  });
  f.practical({ x: bulb.x, y: bulb.y + 6 / k, kind: 'lamp', seed: 41, intensity: 1, radius: 120 / k, layer: 'L5' });
}

/** band 5's glyph: word-slug ticks across the band's full width, 6 curved threads of light stroking on one by one */
const SLUGS5 = 7;
const THREADS5: [number, number][] = [[0, 3], [1, 5], [2, 4], [3, 6], [0, 6], [4, 5]];
function attentionThreads(c: C, r: BandRect, u: number) {
  const xs = Array.from({ length: SLUGS5 }, (_, j) => r.x + 12 + (j * (r.w - 24)) / (SLUGS5 - 1));
  const base = r.y + r.h - 9;
  c.save();
  c.lineCap = 'round';
  THREADS5.forEach(([a, b2], i) => {
    const v = clamp01(u * THREADS5.length - i);
    if (v <= 0) return;
    const x0 = xs[a], x1 = xs[b2];
    const top = base - Math.min(r.h - 12, 10 + (x1 - x0) * 0.32);
    // the stroke on: sample the quadratic up to v (on twos via u's quantised clock)
    const n = 24;
    const pts: Pt[] = [];
    for (let q = 0; q <= n * v; q++) {
      const w = q / n, w1 = 1 - w;
      pts.push({ x: w1 * w1 * x0 + 2 * w1 * w * ((x0 + x1) / 2) + w * w * x1, y: w1 * w1 * base + 2 * w1 * w * (2 * top - base) * 1 + w * w * base });
    }
    for (const [lw, col] of [[8, 'rgba(255,244,214,0.18)'], [4, 'rgba(255,246,222,0.35)'], [2.2, 'rgba(255,252,240,1)']] as const) {
      c.strokeStyle = col;
      c.lineWidth = lw;
      c.beginPath();
      pts.forEach((p, j) => (j ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
      c.stroke();
    }
    if (v < 1 && pts.length) {
      const h = pts[pts.length - 1];
      c.fillStyle = 'rgba(255,252,240,0.95)';
      c.beginPath();
      c.arc(h.x, h.y, 3.4, 0, Math.PI * 2);
      c.fill();
    }
  });
  // the word slugs: black cut-outs the threads land on
  c.fillStyle = '#0d0f0e';
  for (const x of xs) c.fillRect(x - 7, base, 14, 7);
  c.restore();
}

/** soft amber haze over the X-ray box's edges (L4, after the box) */
function boxHaze(c: C, env: PaintEnv) {
  const s = STUDY.xray.s;
  const w = 230 * s, h = 420 * s;
  const x0 = STUDY.xray.x - w / 2, y0 = STUDY.xray.y - h;
  const hz = mixLab(env.mood.haze, env.mood.halo, 0.25);
  const band = (gx0: number, gy0: number, gx1: number, gy1: number, rx: number, ry: number, rw: number, rh: number) => {
    const g = c.createLinearGradient(gx0, gy0, gx1, gy1);
    g.addColorStop(0, withAlpha(hz, 0.42));
    g.addColorStop(1, withAlpha(hz, 0));
    c.fillStyle = g;
    c.fillRect(rx, ry, rw, rh);
  };
  band(x0 - 6, 0, x0 + 34, 0, x0 - 6, y0 - 6, 40, h + 6);
  band(x0 + w + 6, 0, x0 + w - 34, 0, x0 + w - 34, y0 - 6, 40, h + 6);
  band(0, y0 - 6, 0, y0 + 40, x0 - 6, y0 - 6, w + 12, 46);
}

/** right-hand edge midpoint of a slot's card (world) */
function cardEdge(id: 'C3-c' | 'C3-d'): Pt {
  const s = SLOTS[id];
  return { x: STUDY.board.x + s.x + s.w / 2 - 2, y: STUDY.board.y + s.y + 4 };
}
/** a faint thread of light bowed out to the right of the column, drawn from a → b as u goes 0 → 1 */
function threadArc(c: C, env: PaintEnv, a: Pt, b2: Pt, u: number) {
  const ctrl = { x: Math.max(a.x, b2.x) + 46, y: (a.y + b2.y) / 2 };
  c.save();
  c.globalCompositeOperation = 'lighter';
  const n = 32;
  for (const [lw, al] of [[7, 0.08], [2.6, 0.26], [1.1, 0.7]] as const) {
    c.strokeStyle = withAlpha(env.mood.core, al);
    c.lineWidth = lw;
    c.beginPath();
    c.moveTo(a.x, a.y);
    for (let i = 1; i <= n * u; i++) {
      const v = i / n, w = 1 - v;
      c.lineTo(w * w * a.x + 2 * w * v * ctrl.x + v * v * b2.x, w * w * a.y + 2 * w * v * ctrl.y + v * v * b2.y);
    }
    c.stroke();
  }
  // the travelling bead of light at the thread's head
  if (u < 1) {
    const v = u, w = 1 - v;
    const hx = w * w * a.x + 2 * w * v * ctrl.x + v * v * b2.x, hy = w * w * a.y + 2 * w * v * ctrl.y + v * v * b2.y;
    const g = c.createRadialGradient(hx, hy, 0, hx, hy, 14);
    g.addColorStop(0, withAlpha(env.mood.core, 0.8));
    g.addColorStop(1, withAlpha(env.mood.core, 0));
    c.fillStyle = g;
    c.fillRect(hx - 14, hy - 14, 28, 28);
  }
  c.restore();
}

function clueCard(c: C, env: PaintEnv, p: Pt, glow: number) {
  const s = SLOTS['C3-d'];
  drawCard(c, s, { x: p.x, y: p.y, k: STUDY.board.k, light: poolAt(POOL, s.x, s.y) + glow, lit: glow > 0.05 }, env);
}

// ------------------------------------------------------------------------------------------------ the coat
const HELD = { x: HOOK.x - 40, y: HOOK.y - 40 };
/** the coat's hang point (its loop) over time, world L4 (on twos) */
function coatPos(tq: number, b: B): Pt {
  const hung = { x: HOOK.x, y: HOOK.y + 2 };
  if (tq < b.lift) return hung;
  const u = sm((tq - b.lift) / 0.35);
  const p = { x: lerp(hung.x, HELD.x, u), y: lerp(hung.y, HELD.y, u) + 4 * Math.sin(tq * 1.7) * u };
  // the carry: the coat leads the camera right
  const k = sm((tq - b.carry) / (b.near0 - b.carry + 0.5));
  return { x: p.x + 150 * k, y: p.y + 10 * k };
}
/** the coat hand (from above, only the hand and cuff in frame) */
function coatHand(tq: number, b: B, p: Pt): { at: Pt; shape: 'open' | 'grip'; show: boolean } {
  const grip = { x: p.x + 3, y: p.y - 6 };
  if (tq < b.coat0) return { at: grip, shape: 'open', show: false };
  if (tq < b.lift) {
    const u = sm((tq - b.coat0) / (b.lift - b.coat0));
    return { at: { x: lerp(grip.x + 70, grip.x, u), y: lerp(grip.y - 120, grip.y, u) }, shape: u > 0.8 ? 'grip' : 'open', show: true };
  }
  return { at: grip, shape: 'grip', show: true };
}
/** draw the coat and its hand with the loop at p (any space where the coat is drawn at L4 world scale) */
function drawCoat(c: C, env: PaintEnv, p: Pt, tq: number, b: B, hand: { at: Pt; shape: 'open' | 'grip'; show: boolean }) {
  // the re-cut on twos: three drawings over 4.55 → 4.9 (frock → between → overcoat)
  const r = tq - b.recut0;
  const m = r < 0.17 ? 0 : r < 0.33 ? 0.5 : 1;
  // sway: still on the hook; a shake after the lift; a breath while held; a lean into the carry
  let sway = 0;
  if (tq >= b.lift) {
    const d = tq - b.lift - 0.2;
    sway = d > 0 ? 0.14 * Math.exp(-d * 2.2) * Math.sin(d * 13) : 0;
    sway += 0.012 * Math.sin(tq * 1.9);
    sway += -0.07 * win(tq, b.carry, b.carry + 0.5);
  }
  const light = poolAt(POOL, p.x - STUDY.board.x, p.y + 100 - STUDY.board.y) + 0.3;
  const cuff = coatAt(c, env, { x: p.x, y: p.y, sway, m, trace: 0, light, dust: 1 - win(tq, b.recut0, b.recut0 + 0.4) });
  // the scissor-line: a short bright cut edge travelling down the new outline (left waist → hem → right waist) on
  // twos, its fresh edge cooling behind it
  // first across the waist seam (cutting the old skirt free), then down the new skirt's edge and round its hem
  const snip1 = (r + 0.15) / 0.3;
  if (snip1 > 0 && snip1 < 1) scissorLine(c, env, p, sway, WAIST, snip1);
  const snip2 = (r - 0.33) / 0.42;
  if (snip2 > 0 && snip2 < 1) scissorLine(c, env, p, sway, NEW_HEM, snip2);
  // the old frock skirt, cut free at the waist seam, falls away as one separate cut piece (drawings 2 on)
  if (r >= 0.17 && r < 1.4) {
    const d = r - 0.17;
    c.save();
    c.translate(p.x, p.y);
    c.rotate(sway);
    c.translate(-70 * d, 104 + 640 * d * d);
    c.rotate(-1.3 * d * d - 0.2 * d);
    c.globalAlpha *= 1 - clamp01((d - 0.7) / 0.3);
    const sk = new Path2D();
    OLD_SKIRT.forEach(([x, y], i) => (i ? sk.lineTo(x, y - 104) : sk.moveTo(x, y - 104)));
    sk.closePath();
    c.fillStyle = mixLab(env.fill('ink'), env.mood.set, 0.18);
    c.fill(sk);
    // its cut top edge catches the lamp
    c.strokeStyle = withAlpha(env.mood.core, 0.75);
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(OLD_SKIRT[0][0], 0);
    c.lineTo(OLD_SKIRT[OLD_SKIRT.length - 1][0], 0);
    c.stroke();
    c.strokeStyle = withAlpha(env.mood.rim, 0.35);
    c.lineWidth = 1;
    c.stroke(sk);
    c.restore();
  }
  // the tag on the cuff: the old PRE-TRAINING tag until the overcoat lands, then the new one turns in, stamped
  const tagRot = 0.06 * Math.sin(tq * 2.1) + sway * 0.8;
  const flipT = r - 0.33;
  if (flipT < 0) {
    bigTag(c, env, { x: cuff.x, y: cuff.y, w: 76, h: 28, len: 12, rot: tagRot, lines: ['PRE-TRAINING'], size: 10, light: 0.8 });
  } else {
    const fresh = 1 - clamp01((flipT - 0.15) / 0.8);
    bigTag(c, env, { x: cuff.x, y: cuff.y, w: 196, h: 66, len: 14, rot: tagRot * 0.6, lines: ['PRE-TRAINING', 'READ EVERYTHING FIRST'], size: 14.5, light: 0.95, flip: 0.5 + 0.5 * clamp01(flipT / 0.08), fresh });
    if (flipT < 0.15) {
      // the stamp's press: a 0.15 s warm flash on the fresh ink
      c.save();
      c.globalCompositeOperation = 'lighter';
      const a = Math.sin((flipT / 0.15) * Math.PI);
      const g = c.createRadialGradient(cuff.x, cuff.y + 46, 6, cuff.x, cuff.y + 46, 130);
      g.addColorStop(0, `rgba(255,236,190,${0.55 * a})`);
      g.addColorStop(1, 'rgba(255,236,190,0)');
      c.fillStyle = g;
      c.fillRect(cuff.x - 130, cuff.y - 84, 260, 260);
      c.restore();
    }
  }
  if (hand.show) {
    const len = HAND_LEN * 0.56;
    // shoulder and elbow above the frame: only the hand and its cuff come down into the picture
    bentArm(c, env, {
      shoulder: { x: hand.at.x + 40, y: hand.at.y - 520 },
      elbow: { x: hand.at.x + 46, y: hand.at.y - 112 },
      at: hand.at,
      shape: hand.shape,
      len,
      side: 'left',
    });
  }
}

/** the snip: a bright cut edge travelling along the overcoat's new skirt line (u 0..1 of its length), a cooling
 *  bright edge behind it (fade), a small blade glint at its head */
const WAIST: [number, number][] = [[-46, 103], [42, 103]];
function scissorLine(c: C, env: PaintEnv, p: Pt, sway: number, path: [number, number][], u: number) {
  const pts = path.map(([x, y]) => ({ x, y }));
  const seg = pts.slice(1).map((q, i) => Math.hypot(q.x - pts[i].x, q.y - pts[i].y));
  const total = seg.reduce((a, v) => a + v, 0);
  const at = (L: number) => {
    let acc = 0;
    for (let i = 0; i < seg.length; i++) {
      if (acc + seg[i] >= L) {
        const v = (L - acc) / seg[i];
        return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * v, y: pts[i].y + (pts[i + 1].y - pts[i].y) * v };
      }
      acc += seg[i];
    }
    return pts[pts.length - 1];
  };
  const head = u * total;
  c.save();
  c.translate(p.x, p.y);
  c.rotate(sway);
  c.globalCompositeOperation = 'lighter';
  c.lineCap = 'round';
  if (u < 1) {
    // the hot edge: the last 34 px
    c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.5), 0.95);
    c.lineWidth = 2.2;
    c.beginPath();
    for (let L = Math.max(0, head - 34); L <= head; L += 3) {
      const q = at(L);
      if (L <= Math.max(0, head - 34)) c.moveTo(q.x, q.y);
      else c.lineTo(q.x, q.y);
    }
    c.stroke();
    const h = at(head);
    const g = c.createRadialGradient(h.x, h.y, 0, h.x, h.y, 16);
    g.addColorStop(0, withAlpha(mixLab(env.mood.core, '#ffffff', 0.6), 0.9));
    g.addColorStop(1, withAlpha(env.mood.core, 0));
    c.fillStyle = g;
    c.fillRect(h.x - 16, h.y - 16, 32, 32);
  }
  c.restore();
}

/** the coat swung toward the lens: drawn in screen space over the whole study, growing and blurring; it wipes
 *  the frame at b.wipe (the camera changes under it) and clears to the right onto the window */
function nearCoat(f: Frame, env: PaintEnv, t: number, b: B, camA: (t: number) => Camera3) {
  const tq = tq12(t);
  const p0 = coatPos(b.near0, b);
  const cam0 = camA(b.near0);
  const s0 = toScreen(LAYERS.L4, cam0, p0.x, p0.y);
  const u = clamp01((t - b.near0) / (b.near1 + 0.15 - b.near0));
  const uw = (b.wipe - b.near0) / (b.near1 + 0.15 - b.near0);
  // scale: grows to cover the frame at the wipe, keeps growing as it clears
  const S = s0.k * (u < uw ? Math.exp(Math.log(8.6) * sm(u / uw) ** 1.4) : 8.6 + 3 * (u - uw) / (1 - uw));
  // anchor (the coat's body centre, local (0, 140)) in screen
  const A0 = { x: s0.x, y: s0.y + 140 * s0.k };
  const A1 = { x: 660, y: 380 };
  const A2 = { x: 2600, y: 420 };
  const A = u < uw ? { x: lerp(A0.x, A1.x, sm(u / uw)), y: lerp(A0.y, A1.y, sm(u / uw)) } : { x: lerp(A1.x, A2.x, sm((u - uw) / (1 - uw))), y: lerp(A1.y, A2.y, sm((u - uw) / (1 - uw))) };
  const blur = 22 * sm(u / uw);
  const nearEnv = { ...env, fill: (r: Parameters<PaintEnv['fill']>[0]) => (r === 'ink' ? mixLab(env.mood.ink, '#000000', 0.25) : env.fill(r)) } as PaintEnv;
  screenPass(f, (c) => {
    c.save();
    if (blur > 0.3) c.filter = `blur(${(blur * f.pxScale).toFixed(1)}px)`;
    c.translate(A.x, A.y);
    c.scale(S, S);
    c.translate(-p0.x, -(p0.y + 140));
    drawCoat(c, nearEnv, p0, tq, b, coatHand(tq, b, p0));
    c.restore();
    // the darkest moment: a short ink veil so no study edge peeks past the coat's blurred hem
    const v = Math.max(0, 1 - Math.abs(t - b.wipe) / 0.12);
    if (v > 0) {
      c.fillStyle = withAlpha(mixLab(env.mood.ink, '#000000', 0.3), 0.75 * sm(v));
      c.fillRect(-4, -4, 1288, 728);
    }
  });
}

// ================================================================================================= LIBRARY
const PITCH = 25;
const SLUG = { w: 21, h: 28 };
const LEDGE = 606;
const STEP = 0.8;
const GPT = { x0: 318, line0: 60, steps: 7 };
/** GPT's label sits under the middle of its walk */
const GPT_LABEL_X = GPT.x0 + (GPT.steps * PITCH) / 2 + 20;
const BERT = { x: 960 };
/** BERT's line of context, left and right of it; the blanks fill in turn */
const BERT_LINE = Array.from({ length: 17 }, (_, i) => 760 + i * PITCH);
/** the blanks BERT fills: one in the middle of its row first (just left of its feet, clear of its legs), then one more */
const BERT_BLANKS = [6, 11];

/** an empty slot: a dashed outline of light with a faint glow inside */
function dashedBlank(c: C, env: PaintEnv, x: number, y: number, a: number) {
  c.save();
  c.fillStyle = withAlpha(env.mood.halo, 0.16 * a);
  c.fillRect(x, y, SLUG.w, SLUG.h);
  c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.25), 0.35 + 0.6 * a);
  c.setLineDash([4, 3]);
  c.lineWidth = 1.6;
  c.strokeRect(x + 0.8, y + 0.8, SLUG.w - 1.6, SLUG.h - 1.6);
  c.restore();
}
/** a short flash where a slug is set (u 0..1 over the flash) */
function stampFlash(c: C, env: PaintEnv, x: number, y: number, u: number, a: number) {
  if (u <= 0 || u >= 1) return;
  const k = Math.sin(u * Math.PI) * a;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 1, x, y, 34);
  g.addColorStop(0, withAlpha(mixLab(env.mood.core, '#ffffff', 0.4), 0.85 * k));
  g.addColorStop(1, withAlpha(env.mood.core, 0));
  c.fillStyle = g;
  c.fillRect(x - 34, y - 34, 68, 68);
  c.restore();
}

function library(g: Frame, t: number, b: B, cam: Camera3) {
  const tq = tq12(t);
  const lit = 0.25 + 0.75 * win(t, b.machines - 0.6, b.machines);
  const lanterns: { x: number; y: number }[] = [];
  // GPT: every STEP s it sets one slug in the ghost slot ahead (0 → 0.17 s), then steps forward one pitch (on twos)
  const k = Math.max(0, (tq - b.machines) / STEP);
  const n = Math.min(GPT.steps, Math.floor(k));
  const ph = k - Math.floor(k);
  const stepping = k > 0 && n < GPT.steps ? sm((ph - 0.35) / 0.4) : 0;
  const gx = GPT.x0 + (n + stepping) * PITCH;
  const setU = k > 0 && n < GPT.steps ? clamp01(ph / 0.17) : 0;
  paintLibrary(g, {
    key: ID,
    cam,
    cams: LIB_CAMS,
    t,
    near: false,
    edgeX: 96,
    action: (c, env) => {
      const ink = mixLab(env.fill('ink'), '#000000', 0.2);
      lanterns.push(lanternMachine(c, env, { x: gx, y: LEDGE, facing: 1, tq, walk: stepping > 0 && stepping < 1 ? 1 : 0.25, stride: STEP, lit, beams: 'forward', reach: 120, s: 1.4, ink, variant: 'writer' }));
      // ---- GPT's line: everything before it set; the slug ahead of its stylus drops in, then it steps on
      const head = GPT.x0 + 34 + n * PITCH; // the ghost slot just ahead of the stylus
      for (let x = GPT.line0, i = 0; x < head; x += PITCH, i++) {
        const age = (head - x) / PITCH;
        miniSlug(c, env, x, LEDGE - SLUG.h, SLUG.w, SLUG.h, Math.max(0, 1 - age / 5) * lit, false, i);
      }
      if (setU > 0 && setU < 1) miniSlug(c, env, head, LEDGE - SLUG.h - (1 - setU) * 16, SLUG.w, SLUG.h, lit, false, 90 + n);
      else if (setU >= 1) miniSlug(c, env, head, LEDGE - SLUG.h, SLUG.w, SLUG.h, lit, false, 90 + n);
      // each stamp lands with a small flash of the stylus on fresh type
      if (k > 0) stampFlash(c, env, head + SLUG.w / 2, LEDGE - SLUG.h / 2, (ph * STEP - 0.12) / 0.45, lit);
      // the next ghost slot glows in its beam
      const ghost = setU >= 1 ? head + PITCH : head;
      dashedBlank(c, env, ghost, LEDGE - SLUG.h, 0.7 * lit);
      // ---- BERT's line: its twin beams converge on one blank, which fills; then the next
      const fills = BERT_BLANKS.map((_, j) => b.machines + 0.7 + j * 1.6);
      const active = fills.findIndex((tf) => tq < tf + 0.6);
      const bertLine = (cc: C, e: PaintEnv) =>
        BERT_LINE.forEach((x, i) => {
          const j = BERT_BLANKS.indexOf(i);
          if (j >= 0) {
            const u = clamp01((tq - fills[j]) / 0.17);
            if (u <= 0) dashedBlank(cc, e, x, LEDGE - SLUG.h, lit * (j === active ? 1 : 0.6));
            else {
              miniSlug(cc, e, x, LEDGE - SLUG.h - (1 - u) * 14, SLUG.w, SLUG.h, Math.max(0.35, 1 - clamp01((tq - fills[j] - 0.4) / 0.8)) * lit, false, i + 40);
              stampFlash(cc, e, x + SLUG.w / 2, LEDGE - SLUG.h / 2, (tq - fills[j]) / 0.5, lit);
            }
          } else miniSlug(cc, e, x, LEDGE - SLUG.h, SLUG.w, SLUG.h, 0.3 * lit, false, i + 40);
        });
      // the converging light: two pulses run along the line from both sides into the active blank
      const beams: { x: number; y: number; a?: number }[] = [];
      if (active >= 0 && tq > b.machines) {
        const bi = BERT_BLANKS[active];
        const bx = BERT_LINE[bi] + SLUG.w / 2;
        const t0 = fills[active] - 0.9;
        const w = clamp01((tq - t0) / 0.9);
        const a = (1 - clamp01((tq - fills[active] - 0.1) / 0.4)) * lit;
        const L0 = BERT_LINE[0] + SLUG.w / 2, R0 = BERT_LINE[BERT_LINE.length - 1] + SLUG.w / 2;
        const lx = lerp(L0, bx - 14, sm(w)), rx = lerp(R0, bx + 14, sm(w));
        beams.push({ x: lx, y: LEDGE - SLUG.h / 2, a }, { x: rx, y: LEDGE - SLUG.h / 2, a });
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (const [x0, x1] of [[L0, lx], [R0, rx]] as const) {
          const gr = c.createLinearGradient(x0, 0, x1, 0);
          gr.addColorStop(0, withAlpha(env.mood.halo, 0));
          gr.addColorStop(1, withAlpha(env.mood.core, 0.5 * a));
          c.fillStyle = gr;
          c.fillRect(Math.min(x0, x1), LEDGE - SLUG.h - 3, Math.abs(x1 - x0), SLUG.h + 6);
        }
        // the blank itself brightens as the two lights meet on it
        const m = a * sm((w - 0.6) / 0.4);
        if (m > 0) {
          const rg = c.createRadialGradient(bx, LEDGE - SLUG.h / 2, 2, bx, LEDGE - SLUG.h / 2, 30);
          rg.addColorStop(0, withAlpha(env.mood.core, 0.7 * m));
          rg.addColorStop(1, withAlpha(env.mood.core, 0));
          c.fillStyle = rg;
          c.fillRect(bx - 30, LEDGE - SLUG.h / 2 - 30, 60, 60);
        }
        c.restore();
      }
      lanterns.push(lanternMachine(c, env, { x: BERT.x, y: LEDGE, facing: -1, tq: 0, walk: 0, lit, beams: 'none', beamTo: beams, s: 1.4, ink, variant: 'reader' }));
      bertLine(c, env);
      // ---- one shared caption line, each name under its machine (on the dark ledge, a soft plate)
      const ca = win(t, b.machines + 0.5, b.machines + 1.1);
      if (ca > 0) {
        const y = LEDGE + 26;
        c.save();
        // at the legibility floor (22 px cap height at 1080p) under this camera, plus a margin
        const size = legibleSize(c, `500 20px ${FONT.mono}`, 20) + 1;
        c.font = `500 ${size}px ${FONT.mono}`;
        (c as C & { letterSpacing: string }).letterSpacing = '1px';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        for (const [x, txt] of [[GPT_LABEL_X, 'GPT · OpenAI'], [BERT.x, 'BERT · Google']] as const) {
          softPlate(c, x, y, c.measureText(txt).width + 70, size * 2.4, env.mood.ink, 0.7 * ca);
          c.globalAlpha = ca;
          c.fillStyle = mixLab(env.mood.core, '#ffffff', 0.3);
          c.fillText(txt, x, y);
          c.globalAlpha = 1;
        }
        c.restore();
      }
    },
    lights: (gg) => {
      lanterns.forEach((p, i) => gg.practical({ x: p.x, y: p.y + 2, kind: 'lamp', seed: 70 + i, intensity: 0.6 * lit, radius: 34 }));
    },
  });
}
