/**
 * ch14-s05 — over the strait at dusk, seen through the study window: a parchment plate of a hundred paper scholars;
 * threads of light run first to where they first studied (most to the right shore), then lift and swing to where they
 * work (the clearly largest bundle to the left shore); open-weight lanterns drift on the water in the music hold
 * (duskRose; 10.63 s; in: crossfade from the shelf's reflection in ch14-s04b).
 *
 * L1416 (re-recorded round 2): "Nearly half the top researchers first studied in China. But America employed the
 * most of them."
 *   plate     0.3 s       the plate rises over the water between the shores: 100 identical paper figures, each with
 *                         a book under one arm (a hundred-dot chart made of people; no flags); its heading reads
 *   studied   'first'..'studied'   threads run from the figures to where they first studied: 47 to the right shore
 *                         (China), 18 to the left (US), the rest to small far shores at the frame's edges; the stat
 *                         card's first line sets in on 'studied' (MacroPolo, NeurIPS 2022 authors)
 *   work      'America'   the threads LIFT off the shores (arcing up over the water)…
 *   lanterns  'employed'  …and swing down to where they work: the left shore (America) now holds the clearly largest
 *                         bundle (uncounted: the bible gives only that the US was the leading place they worked), its
 *                         landing lights brighten while the right's dim; the card's second line sets in (both held
 *                         together to the end, > 4 s)
 *   (hold)                the camera eases back and down: small paper lanterns set out from the right shore drift
 *                         across the far water, some reaching the left (open weights crossing; generic, no logos)
 *
 * WINDOW RULE (ch14): the strait is always seen THROUGH the study window (its frame and jambs faint at the edges); no
 * shelf, no hands. Both skylines lit with exactly equal warmth (only the threads' landing lights differ).
 * TEXT RULE: two text items (the plate, its heading and its two block captions; the two-line stat card); the Qwen tag
 * is cut (review round 2). The card's second line is MacroPolo's (confirmed claim e13-talent, routed by the round-2
 * verdict); script.json's onScreenText should carry it too (story).
 *
 * Review r1: the plate is narrower (≈ 31 % of the frame) and higher, a paper cut floating with depth (a soft shadow on
 * the haze, a 0.5° sway on twos, fog lapping its bottom edge), so both skylines read whole either side; its two lit
 * blocks are captioned US 18% / CHINA 47%; the two thread states are distinct (studied: the right bundle bright, the
 * rest at 35 %, its landing 2.5× the left's; employed: inverted over 0.8 s, and the figures that now work on the left
 * shore re-tint a warm step lighter on the plate); from 6.9 s the camera tilts down ~60 px (L4) over 3 s while the
 * open lanterns set out from the right shore, three or four crossing the centre line by 10 s; the window's jambs sit
 * at the frame edges and slide a little in the tilt.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import {
  FONT, LAYERS, MOODS, defineShot, hash1, legibleSize, mixLab, softPlate, softSprite, textRole, toLayer, toScreen, withAlpha,
} from '../../../film';
import {
  HZ, LANTERN, SHORE, WARM, across, boardStones, clamp01, floatLantern, jetty, lerp, nearWater, railLampPoint, sm,
  straitBack, tq12, win, windowFrame, type P,
} from '../sets/ch14-s05-strait';

const ID = 'ch14-s05';
type C = CanvasRenderingContext2D;

// ------------------------------------------------------------------------------------------------ the plate (L4)
/** narrow and high (review r1): ≈ 31 % of the frame wide, its foot just over the inner towers' tops at the open, clear
 *  of them once the camera tilts down */
const PLATE = { cx: 640, cy: 152, w: 392, h: 252 };
const PX0 = PLATE.cx - PLATE.w / 2, PY0 = PLATE.cy - PLATE.h / 2;
const PY1 = PY0 + PLATE.h;
const DX = 24;
const ROW = 15.5;

type Dest = 'farL' | 'L' | 'R' | 'farR';
const ORDER: Dest[] = ['farL', 'L', 'R', 'farR'];
// first degree (MacroPolo Global AI Talent Tracker 2.0, NeurIPS 2022): China 47 %, US 18 %, the rest elsewhere. The
// plate is grouped BY DESTINATION, left to right, each group a solid block of columns (ten figures to a column,
// filled from the bottom): the far-left shores (17), the left shore (18), the right shore (47), the far-right (18)
const STUDIED: Dest[] = Array.from({ length: 100 }, (_, i) => (i < 17 ? 'farL' : i < 35 ? 'L' : i < 82 ? 'R' : 'farR'));
const G_START: Record<Dest, number> = { farL: 0, L: 17, R: 35, farR: 82 };
const G_COL: Record<Dest, number> = { farL: 0, L: 2, R: 4, farR: 9 };
/** gutters before each block: the widest between the two captioned blocks */
const G_GUT: Record<Dest, number> = { farL: 0, L: 14, R: 44, farR: 58 };
const GX0 = PLATE.cx - (10 * DX + 58) / 2;
const GY0 = PY0 + 58;
/** figure i: its block, its column in the block, its row (bottom-up, so a part column is open at the top) */
const fig = (i: number): P => {
  const d = STUDIED[i];
  const j = i - G_START[d];
  return { x: GX0 + (G_COL[d] + Math.floor(j / 10)) * DX + G_GUT[d], y: GY0 + (9 - (j % 10)) * ROW };
};
/** a block's centre x on the plate (for its caption) */
const blockCx = (d: Dest, cols: number) => GX0 + (G_COL[d] + (cols - 1) / 2) * DX + G_GUT[d];
const CAPTIONS: { d: Dest; text: string; x: number }[] = [
  { d: 'L', text: 'US 18%', x: blockCx('L', 2) },
  { d: 'R', text: 'CHINA 47%', x: blockCx('R', 5) },
];
const CAP_Y = PY1 - 23;
// where they work: the left (US) bundle clearly the largest (illustrative split; only "the US leads" is claimed, so
// the bundle is never counted on screen): most of the right-shore students and a few far-shore ones swing left
const WORK: Dest[] = STUDIED.map((d, i) => {
  if (d === 'L') return i === 20 ? 'farL' : 'L';
  if (d === 'R') {
    const k = i - 35;
    return k === 45 || k === 46 ? 'farR' : k % 3 === 2 ? 'R' : 'L';
  }
  if (d === 'farL') return i < 4 ? 'L' : i < 6 ? 'R' : 'farL';
  return i >= 95 ? 'L' : 'farR';
});

/** a destination point (L1 world) for the k-th of n threads in a bundle */
function destL1(d: Dest, k: number, n: number, i: number): P {
  const q = n > 1 ? k / (n - 1) - 0.5 : 0;
  const jy = 6 * hash1(i, 77);
  switch (d) {
    case 'L':
      return { x: SHORE.L.cx + 40 + q * 70, y: HZ - 16 + jy * 0.6 };
    case 'R':
      return { x: SHORE.R.cx - 40 + q * 70, y: HZ - 16 + jy * 0.6 };
    case 'farL':
      return { x: 44 + q * 30, y: HZ - 10 + jy * 0.5 };
    case 'farR':
      return { x: 1236 + q * 30, y: HZ - 10 + jy * 0.5 };
  }
}
function bundle(list: Dest[]): P[] {
  const counts: Record<Dest, number> = { farL: 0, L: 0, R: 0, farR: 0 };
  list.forEach((d) => counts[d]++);
  const seen: Record<Dest, number> = { farL: 0, L: 0, R: 0, farR: 0 };
  return list.map((d, i) => destL1(d, seen[d]++, counts[d], i));
}
const D_STUDY = bundle(STUDIED);
const D_WORK = bundle(WORK);
/** each bundle's landing (L1): the centre of its threads' ends */
const LAND: Record<Dest, P> = { L: { x: SHORE.L.cx + 40, y: HZ - 13 }, R: { x: SHORE.R.cx - 40, y: HZ - 13 }, farL: { x: 44, y: HZ - 8 }, farR: { x: 1236, y: HZ - 8 } };

// ------------------------------------------------------------------------------------------------ the lanterns
/** two already on the water by the right shore; then, from 6.9 s (the tilt), one set out from the right shore's inner
 *  end every 0.25 s, drifting left: the first four quickest, so they cross the centre line by 10 s.
 *  x0 is screen px at the set-out, v the depth on the water (0 = far, 1 = near) */
const EARLY = [
  { x0: 1104, v: 0.12, speed: 7, seed: 3, at: -1 },
  { x0: 1182, v: 0.26, speed: 9, seed: 10, at: -1 },
];
const SETOUT = Array.from({ length: 14 }, (_, k) => {
  const lead = k < 4;
  // the lead four ride the near-middle water, below the landing, so their crossing of the centre line is seen
  const v = lead ? [0.46, 0.56, 0.4, 0.52][k] : 0.06 + 0.4 * ((k * 0.618 + 0.21) % 1);
  return {
    k,
    x0: lead ? [786, 800, 794, 780][k] : 880 + 330 * ((k * 0.382 + 0.1) % 1),
    v,
    speed: lead ? [76, 66, 84, 86][k] : 16 + 22 * v,
    /** set-out delay after the tilt begins */
    at: lead ? 0.18 * k : 0.72 + 0.25 * (k - 4),
    seed: 17 + k * 7,
  };
});

interface B {
  D: number;
  plate: number;
  /** 'first' (the threads leave), 'studied' (they have landed; card line 1, the captions) */
  first: number;
  studied: number;
  /** 'But': the studied emphasis lets go as the threads are about to lift */
  but: number;
  /** 'America': the threads lift */
  work: number;
  /** 'employed': they swing down onto where they work; the emphasis inverts; card line 2 */
  lanterns: number;
  /** the tilt down to the water and the lanterns' set-out */
  tilt: number;
  end: number;
}
interface Scene {
  tl: Timeline;
  b: B;
  cam: (t: number) => Camera3;
  tiltU: (t: number) => number;
  [k: string]: unknown;
}

const TILT_DUR = 3;
/** the tilt: ~60 px at L4 (the camera's y; the plate floats down a little against it, so it stays in frame) */
const TILT_Y = 54;

export default defineShot<Scene>({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      plate: T.beat('plate'),
      first: T.word('L1416', 'first'),
      studied: T.beat('studied'),
      but: T.word('L1416', 'But'),
      work: T.beat('work'),
      lanterns: T.beat('lanterns'),
      tilt: 6.9,
      end: T.line('L1416').end,
    };
    // a slow push toward the plate while it fills and the threads swing; then, in the music, the tilt down to the
    // water (ease.move over 3 s) as the camera eases back a little: the plate rides up, the strait fills the lower half
    const tiltU = (t: number) => ease.move(clamp01((t - b.tilt) / TILT_DUR));
    const push = (t: number) => sm(t / b.tilt);
    const cam = (t: number): Camera3 => {
      const u = tiltU(t);
      return { x: 640, y: 336 + 4 * push(t) + TILT_Y * u, z: 30 * push(t) - 24 * u, lens: 1 };
    };
    tl.hold(0, D);
    return { tl, b, cam, tiltU };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const tq = tq12(t);
    const b = sc.b;
    const cam = sc.cam(t);
    const tilt = sc.tiltU(t);
    f.camera(cam);

    straitBack(f, { key: 'dusk', fence: 0.35, sunX: 640, sun: 1 });
    f.fog({ yCenter: HZ + 6, height: 70, alpha: 0.16, drift: 5 });
    f.layer('L3', (c, env) => {
      nearWater(c, env, -400, 1700, 450, 1200);
      lanterns(c, env, t, b, cam, 0, 0.5, LAYERS.L3);
    });
    f.fog('B');
    f.layer('L4', (c, env) => {
      jetty(c, env, { lantern: 0.8, railLamp: 0.8, onBoard: (cc, e2) => boardStones(cc, e2) });
      lanterns(c, env, t, b, cam, 0.5, 1.01, LAYERS.L4);
      plate(f, c, env, t, tq, b, cam, tilt);
    });
    f.rim({ x: 0, y: -1 });
    f.practical({ x: LANTERN.x, y: LANTERN.y, kind: 'lamp', seed: 1405, intensity: 0.45, radius: 26 });
    const rl = railLampPoint();
    f.practical({ x: rl.x, y: rl.y, kind: 'lamp', seed: 1408, intensity: 0.4, radius: 20 });
    // the near plane: a dark swell along the bottom of the frame and a mooring pile at right, soft (L5)
    f.layer('L5', (c, env) => nearPlane(c, env, t));

    // the study window: its jambs at the frame edges; the nearest plane, it slides furthest in the tilt
    windowFrame(f, { dy: -20 * tilt });
    // the stat card (screen-locked, lower third over the water, on a feathered ink plate): line 1 sets in on
    // 'studied', line 2 on 'employed'; both held together to the cut (MacroPolo Global AI Talent Tracker 2.0)
    const c = f.c;
    c.save();
    c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
    statCard(c, f, t, b);
    c.restore();
  },
});

/** lanterns on the water (the depth band [d0, d1) is drawn in this layer): placed in screen px on the water plane, then
 *  re-expressed in the layer, so they always sit on the water whatever the camera does */
function lanterns(c: C, env: PaintEnv, t: number, b: B, cam: Camera3, d0: number, d1: number, layer: typeof LAYERS.L3) {
  const hz = toScreen(LAYERS.L1, cam, 0, HZ).y;
  const kL = toScreen(layer, cam, 0, 0).k;
  const one = (x: number, v: number, seed: number, a: number) => {
    if (v < d0 || v >= d1 || a <= 0.01) return;
    if (x < -60 || x > 1340) return;
    const y = hz + 22 + 280 * Math.pow(v, 1.35);
    const s = lerp(0.62, 1.9, v);
    const p = toLayer(layer, cam, x, y);
    c.save();
    c.globalAlpha *= a;
    floatLantern(c, { x: p.x, y: p.y, s: s / kL, t, seed, glow: 0.9 }, env);
    c.restore();
  };
  for (const L of EARLY) one(L.x0 - L.speed * t, L.v, L.seed, 1);
  for (const L of SETOUT) {
    const t0 = b.tilt + L.at;
    const dt = t - t0;
    if (dt <= 0) continue;
    // set out: it appears at the shore's edge of the water and settles (a small drop and its light coming up)
    const a = sm(dt / 0.45);
    one(L.x0 - L.speed * dt * (0.5 + 0.5 * sm(dt / 1.2)), L.v + 0.04 * sm(dt / 3), L.seed, a);
  }
}

/** the near plane (L5, blurred): a dark swell band along the frame's bottom with a few rim-lit crests, and a mooring
 *  pile standing out of the water at right, its top caught by the dusk */
function nearPlane(c: C, env: PaintEnv, t: number) {
  const m = env.mood;
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-200, 800);
  for (let i = 0; i <= 48; i++) {
    const x = -200 + i * 36;
    c.lineTo(x, 640 + 7 * Math.sin(i * 0.9 + t * 0.6) + 4 * Math.sin(i * 2.3 - t * 0.4));
  }
  c.lineTo(1540, 800);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(m.rim, 0.32);
  c.lineWidth = 1.6;
  c.beginPath();
  for (let i = 0; i <= 48; i++) {
    const x = -200 + i * 36;
    const y = 640 + 7 * Math.sin(i * 0.9 + t * 0.6) + 4 * Math.sin(i * 2.3 - t * 0.4);
    if (i === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  // the pile
  c.fillStyle = ink;
  c.fillRect(1146, 470, 26, 330);
  c.fillRect(1140, 466, 38, 8);
  c.fillStyle = withAlpha(m.rim, 0.45);
  c.fillRect(1140, 465, 38, 1.6);
  c.fillStyle = withAlpha(m.rim, 0.18);
  c.fillRect(1146, 474, 1.4, 170);
}

/** the parchment plate, its hundred paper scholars (grouped by destination, the two shores' blocks captioned), and the
 *  threads of light to the shores. The plate is a paper cut floating over the water: a soft shadow on the haze behind
 *  it, a 0.5° sway on twos about its centre, fog lapping its bottom edge */
function plate(f: Frame, c: C, env: PaintEnv, t: number, tq: number, b: B, cam: Camera3, tilt: number) {
  const up = sm((tq - (b.plate - 0.15)) / 1.1);
  if (up <= 0.001) return;
  // rising into place; then, in the tilt, it floats down a little against the camera (so it rides up ~40 px, whole)
  const dy = (1 - up) * 70 + 30 * tilt + 1.2 * Math.sin(tq * 0.9);
  const ang = ((0.5 * Math.PI) / 180) * Math.sin(tq * 0.85 + 0.6);
  const m = env.mood;
  const PM = MOODS.parchment;
  const pivot = { x: PLATE.cx, y: PLATE.cy + dy };
  const ca = Math.cos(ang), sa = Math.sin(ang);
  /** a plate-local point (before the sway and drift) to the layer */
  const xf = (x: number, y: number): P => {
    const ox = x - PLATE.cx, oy = y + dy - pivot.y;
    return { x: pivot.x + ox * ca - oy * sa, y: pivot.y + ox * sa + oy * ca };
  };
  const alpha = Math.min(1, up * 1.6);
  c.save();
  c.globalAlpha *= alpha;
  c.translate(pivot.x, pivot.y);
  c.rotate(ang);
  c.translate(-PLATE.cx, -PLATE.cy);
  // the plate, baked: its shadow on the haze, parchment with a deckled edge, a printed rule
  const PAD = 50;
  f.cached(`ch14-s05/plate6/${m.id}`, PLATE.w + PAD * 2, PLATE.h + PAD * 2, (cc) => {
    cc.translate(-(PX0 - PAD), -(PY0 - PAD));
    plateArt(cc, env, f.pxScale);
  })(c, PX0 - PAD, PY0 - PAD);

  // threads: run out from 'first' and have all landed just after 'studied' (the 47 / 18 state then holds); on
  // 'America' they lift off the shores, arcing up over the water, and swing down onto where they work by 'employed'
  const run = (tq - (b.first - 0.15)) / 0.72;
  const rr = tq - (b.work - 0.08);
  const RR_STAG = 0.2;
  const RR_DUR = Math.max(0.7, b.lanterns + 0.35 - b.work - RR_STAG);
  const startOf = (i: number) => (0.3 * ((i * 37) % 100)) / 100;
  const swingOf = (i: number) => sm(clamp01((rr - RR_STAG * (((i * 53) % 100) / 100)) / RR_DUR));
  // the two thread states, made distinct (review r1): from 'studied' to 'But' the right-shore bundle is bright and
  // every other strand at 35 %; from 'employed' (over 0.8 s) the left-shore (work) bundle is bright and the rest at 35 %
  const dimA = win(tq, b.studied - 0.1, b.studied + 0.4) * (1 - win(tq, b.but, b.but + 0.35));
  const dimC = win(t, b.lanterns, b.lanterns + 0.8);
  const emphOf = (i: number) => 1 - 0.65 * dimA * (STUDIED[i] === 'R' ? 0 : 1) - 0.65 * dimC * (WORK[i] === 'L' ? 0 : 1);
  // the figures: identical paper scholars; each lights as its thread leaves (the far-shore ones pale); as a thread
  // swings to the left shore its figure re-tints a warm step lighter (the same people, now working in America)
  const paper = mixLab(PM.sky[1], m.rim, 0.18);
  const figCol = mixLab(PM.set, m.set, 0.42);
  const litCol = mixLab(m.halo, PM.ink, 0.5);
  // where they work: the left-shore figures turn a warm gold a step lighter than the lit ink; once the swing has landed
  // ('employed') every other figure pales toward the paper (their strands are at 35 % then)
  const workCol = mixLab(litCol, WARM, 0.78);
  const wash = mixLab(m.halo, m.core, 0.3);
  const farCol = mixLab(figCol, paper, 0.6);
  const bookCol = mixLab(PM.set, m.set, 0.62);
  for (let i = 0; i < 100; i++) {
    const g = fig(i);
    const since = (run - startOf(i)) * 0.8;
    const lk = sm(since / 0.3);
    const far = STUDIED[i].startsWith('far');
    const wk = WORK[i] === 'L' ? swingOf(i) : 0;
    let col = far ? mixLab(figCol, farCol, lk) : mixLab(figCol, litCol, lk);
    col = mixLab(col, workCol, wk);
    if (WORK[i] !== 'L') col = mixLab(col, farCol, 0.8 * dimC);
    const x = g.x, y = g.y;
    if (!far && lk > 0.01) {
      c.save();
      c.globalAlpha *= 0.5 * lk * (0.55 + 0.45 * emphOf(i));
      c.drawImage(softSprite(wash, 0.35), x - 12, y - 13, 24, 26);
      c.restore();
    }
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y - 4.4, 2.2, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(x - 2.9, y - 2);
    c.lineTo(x + 2.9, y - 2);
    c.lineTo(x + 3.3, y + 7);
    c.lineTo(x - 3.3, y + 7);
    c.closePath();
    c.fill();
    c.fillStyle = far ? mixLab(bookCol, farCol, lk) : mixLab(mixLab(bookCol, litCol, 0.5 * lk), workCol, 0.6 * wk);
    c.save();
    c.translate(x + 3.8, y + 1.5);
    c.rotate(0.18);
    c.fillRect(-1.1, -2.7, 2.2, 5.5);
    c.restore();
  }
  // the strands down the plate, from each figure's feet to the plate's lower edge (just right of its column)
  const rOf = (i: number) => clamp01((run - startOf(i)) / 0.75);
  const strand = mixLab(m.halo, PM.ink, 0.35);
  if (run > 0) {
    c.lineCap = 'round';
    for (let i = 0; i < 100; i++) {
      const r = rOf(i);
      if (r <= 0) continue;
      const g = fig(i);
      const ui = swingOf(i);
      const far = lerp(STUDIED[i].startsWith('far') ? 1 : 0, WORK[i].startsWith('far') ? 1 : 0, ui);
      const sx = g.x + 6.2 + (i % 10) * 0.45;
      const sy0 = g.y + 7.5, sy1 = PY1 - 3;
      c.strokeStyle = withAlpha(strand, lerp(0.4, 0.18, far) * (0.4 + 0.6 * emphOf(i)));
      c.lineWidth = 0.7;
      c.beginPath();
      c.moveTo(sx, sy0);
      c.lineTo(sx, lerp(sy0, sy1, clamp01(r / 0.22)));
      c.stroke();
    }
  }
  // the heading and the block captions: drawn live so they hold the 22 px cap floor whatever the camera does
  // (script onScreenText: NEURIPS 2022 TOP AUTHORS · FIRST DEGREE: CHINA 47% · US 18%)
  const capA = win(tq, b.studied - 0.15, b.studied + 0.35);
  textRole(c, 'subject', () => {
    const fam = `${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = mixLab(PM.ink, PM.set, 0.12);
    const sz = legibleSize(c, `600 20px ${fam}`, 20);
    c.font = `600 ${sz}px ${fam}`;
    c.letterSpacing = '0.4px';
    c.fillText('NEURIPS 2022 TOP AUTHORS', PLATE.cx, PY0 + 36);
    if (capA > 0.01) {
      for (const cp of CAPTIONS) {
        const w = c.measureText(cp.text).width;
        // a paper knock-out behind the caption (the strands pass under it), then a short rule over it
        c.save();
        c.globalAlpha *= capA;
        c.fillStyle = paper;
        c.fillRect(cp.x - w / 2 - 6, CAP_Y - sz * 0.82, w + 12, sz * 0.98);
        c.fillStyle = mixLab(PM.ink, PM.set, 0.08);
        c.fillText(cp.text, cp.x, CAP_Y + (1 - capA) * 3);
        c.fillRect(cp.x - w / 2, CAP_Y - sz * 0.86, w, 0.8);
        c.restore();
      }
    }
    c.letterSpacing = '0px';
  });
  c.restore();

  // fog A lapping the plate's bottom edge: a few slow haze wisps along it (over the strands' exits)
  {
    const hz = mixLab(m.haze, m.sky[2], 0.3);
    const spr = softSprite(hz, 0.15);
    c.save();
    for (let k = 0; k < 6; k++) {
      const ph = ((t * (5 + 2 * k)) / PLATE.w + k * 0.37) % 1;
      const p = xf(PX0 - 40 + ph * (PLATE.w + 80), PY1 + 7 + 3 * Math.sin(t * 0.5 + k));
      const w = 120 + 40 * Math.sin(k * 1.7);
      c.globalAlpha = alpha * (0.32 + 0.12 * Math.sin(t * 0.7 + k * 2.1)) * Math.sin(Math.PI * ph);
      c.drawImage(spr, p.x - w / 2, p.y - 12, w, 24);
    }
    c.restore();
  }
  if (run <= 0) return;

  // threads of light out over the water, from each strand's exit at the plate's foot to its shore
  const pts: P[] = new Array(25);
  const toL4 = (p: P) => across(LAYERS.L1, LAYERS.L4, cam, p);
  const col = mixLab(m.rim, m.core, 0.45);
  const weight: Record<Dest, number> = { farL: 0, L: 0, R: 0, farR: 0 };
  c.save();
  c.lineCap = 'round';
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 100; i++) {
    const r = rOf(i);
    if (r <= 0) continue;
    const g = fig(i);
    const ui = swingOf(i);
    const a0 = D_STUDY[i], a1 = D_WORK[i];
    const d = toL4({ x: lerp(a0.x, a1.x, ui), y: lerp(a0.y, a1.y, ui) });
    const far = lerp(STUDIED[i].startsWith('far') ? 1 : 0, WORK[i].startsWith('far') ? 1 : 0, ui);
    if (r > 0.22) {
      const q1 = (r - 0.22) / 0.78;
      const e = xf(g.x + 6.2 + (i % 10) * 0.45, PY1 - 3);
      // the lift: a visible arc up over the water mid-swing (a thread that keeps its shore lifts less)
      const moved = STUDIED[i] === WORK[i] ? 0.35 : 1;
      const lift = Math.sin(Math.PI * ui) * 130 * moved;
      const cx = (e.x + d.x) / 2, cy = Math.max(e.y, d.y) + 14 - lift;
      for (let k = 0; k <= 24; k++) {
        const q = (k / 24) * q1;
        const u1 = 1 - q;
        pts[k] = { x: u1 * u1 * e.x + 2 * u1 * q * cx + q * q * d.x, y: u1 * u1 * e.y + 2 * u1 * q * cy + q * q * d.y };
      }
      const em = emphOf(i);
      c.globalAlpha = alpha;
      c.strokeStyle = withAlpha(col, lerp(0.5, 0.22, far) * em);
      c.lineWidth = lerp(1.15, 0.8, far) * (0.75 + 0.25 * em);
      c.beginPath();
      c.moveTo(pts[0].x, pts[0].y);
      for (let k = 1; k <= 24; k++) c.lineTo(pts[k].x, pts[k].y);
      c.stroke();
    }
    // landing weight: arrived threads count for their old shore as they leave it and for the new one as they land
    const arrived = clamp01((r - 0.85) / 0.15);
    weight[STUDIED[i]] += arrived * (1 - ui);
    weight[WORK[i]] += arrived * ui;
  }
  // where the bundles land: a glow on each shore sized by the threads arriving there. The bright state's shore gets
  // a glow ~2.5× the other's radius, at full strength; the other shores' glows sit at 40 % (the skylines themselves
  // keep exactly equal warmth: only these landing lights differ)
  const spr = softSprite(mixLab(m.halo, m.core, 0.5), 0.2);
  const focus: Record<Dest, number> = {
    R: 1 + 0.12 * dimA - 0.6 * dimC,
    L: 1 - 0.6 * dimA + 0.12 * dimC,
    farL: 1 - 0.6 * Math.max(dimA, dimC),
    farR: 1 - 0.6 * Math.max(dimA, dimC),
  };
  const rScale: Record<Dest, number> = { R: 1 + 0.1 * dimA - 0.15 * dimC, L: 1 - 0.15 * dimA + 0.1 * dimC, farL: 1, farR: 1 };
  for (const d of ORDER) {
    const k = weight[d];
    if (k < 0.2) continue;
    const p = toL4(LAND[d]);
    const rad = (6 + 0.9 * k) * rScale[d];
    const em = Math.max(0, focus[d]);
    c.globalAlpha = Math.min(1, (0.42 + 0.01 * k) * em);
    c.drawImage(spr, p.x - rad * 1.5, p.y - rad * 0.7, rad * 3, rad * 1.4);
    c.globalAlpha = Math.min(1, (0.5 + 0.01 * k) * em);
    c.drawImage(spr, p.x - rad * 0.7, p.y - rad * 0.3, rad * 1.4, rad * 0.6);
    if (d === 'L' || d === 'R') {
      // the landing's small lights along the waterline (the bundle's lanterns)
      for (let j = 0; j < 5; j++) {
        const lx = p.x + (j - 2) * 15 + 3 * hash1(j, d === 'L' ? 11 : 12);
        c.globalAlpha = Math.min(1, (0.22 + 0.01 * k) * em);
        c.drawImage(spr, lx - 5, p.y - 4, 10, 8);
      }
    }
  }
  c.restore();
}

/** the plate's baked art: its soft shadow on the haze behind it, parchment with a softly deckled edge, a printed
 *  double rule (the heading, figures and captions are drawn live, on top) */
function plateArt(c: C, env: PaintEnv, px: number) {
  const P = MOODS.parchment;
  const m = env.mood;
  const paper = mixLab(P.sky[1], m.rim, 0.18);
  // the card edge under the sheet (paper-cut thickness), casting a soft shadow down-right onto the haze behind
  c.save();
  c.shadowColor = withAlpha(mixLab(m.ink, m.set, 0.2), 0.6);
  c.shadowBlur = 16 * px;
  c.shadowOffsetX = 14 * px;
  c.shadowOffsetY = 20 * px;
  c.fillStyle = mixLab(paper, m.set, 0.45);
  c.fillRect(PX0 + 2, PY0 + 2.5, PLATE.w, PLATE.h);
  c.restore();
  c.fillStyle = paper;
  c.beginPath();
  const n = 56;
  for (let i = 0; i <= n; i++) c.lineTo(PX0 + (PLATE.w * i) / n, PY0 + 1.5 * hash1(i, 1));
  for (let i = 0; i <= 18; i++) c.lineTo(PX0 + PLATE.w + 1.5 * hash1(i, 2), PY0 + (PLATE.h * i) / 18);
  for (let i = n; i >= 0; i--) c.lineTo(PX0 + (PLATE.w * i) / n, PY1 + 1.5 * hash1(i, 3));
  for (let i = 18; i >= 0; i--) c.lineTo(PX0 + 1.5 * hash1(i, 4), PY0 + (PLATE.h * i) / 18);
  c.closePath();
  c.fill();
  // the dusk on its upper edge
  c.fillStyle = withAlpha(m.rim, 0.5);
  c.fillRect(PX0 + 2, PY0 - 0.4, PLATE.w - 4, 1.2);
  // a printed double rule inside the edge
  c.strokeStyle = withAlpha(P.ink, 0.32);
  c.lineWidth = 0.8;
  c.strokeRect(PX0 + 10, PY0 + 10, PLATE.w - 20, PLATE.h - 20);
  c.strokeRect(PX0 + 13.5, PY0 + 13.5, PLATE.w - 27, PLATE.h - 27);
}

/** the two-line stat card, screen-locked over the water (lower third, clear of the bottom 12 %): IBM Plex Mono at
 *  the 22 px cap floor or above, warm parchment text on a feathered ink plate. Line 1 names what the plate's blocks
 *  count (its captions carry the numbers); line 2 is where they work */
const CARD = [
  'FIRST DEGREE (NeurIPS 2022)',
  'WHERE THEY WORK: US FIRST · ~60% OF TOP AI INSTITUTIONS (MacroPolo)',
];
function statCard(c: C, f: Frame, t: number, b: B) {
  const out = 1 - win(t, b.D - 0.45, b.D);
  const a1 = win(t, b.studied - 0.1, b.studied + 0.45) * out;
  const a2 = win(t, b.lanterns - 0.05, b.lanterns + 0.5) * out;
  if (a1 <= 0.01) return;
  const m = f.mood;
  const cx = 640, y1 = 572, y2 = 608;
  textRole(c, 'subject', () => {
    const fam = `${FONT.mono}`;
    const sz = legibleSize(c, `500 22px ${fam}`, 22);
    c.save();
    c.font = `500 ${sz}px ${fam}`;
    c.letterSpacing = '0.5px';
    const w2 = c.measureText(CARD[1]).width;
    // the plate grows from line 1's width to both lines' as line 2 arrives
    c.globalAlpha = Math.max(a1, a2);
    softPlate(c, cx, (y1 + y2) / 2 - 8, w2 + 190, 150, m.ink, 0.62);
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    const text = mixLab('#f1e6cf', m.core, 0.18);
    c.fillStyle = text;
    c.globalAlpha = a1;
    c.font = `600 ${sz}px ${fam}`;
    c.fillText(CARD[0], cx, y1);
    // a hairline rule between the two lines
    c.globalAlpha = 0.45 * a2;
    c.fillRect(cx - w2 / 2, y1 + 11, w2, 0.8);
    c.globalAlpha = a2;
    c.font = `500 ${sz}px ${fam}`;
    c.fillText(CARD[1], cx, y2 + (1 - a2) * 6);
    c.restore();
  });
}
