/**
 * ch14-s05 — over the strait at dusk, seen through the study window: a parchment plate of a hundred paper scholars;
 * threads of light run first to where they first studied (most to the right shore), then re-route to where they
 * work (the largest bundle to the left); open-weight lanterns drift across the water below (duskRose; 10.96 s; in:
 * crossfade from the shelf's reflection in ch14-s04b).
 *
 *   plate     'Nearly'    the plate rises over the water between the shores: 100 identical paper figures, each with
 *                         a book under one arm, in ten neat rows (a hundred-dot chart made of people; no flags)
 *   studied   'China'     threads run from the figures to where they first studied: 47 to the right shore, 18 to the
 *                         left, the rest to small far shores at the frame's edges (MacroPolo, NeurIPS 2022 authors)
 *   work      'America'   the threads lift and re-route to where the figures work: the largest single bundle now runs
 *                         to the left shore, others still to the right shore and beyond (the bible gives only that
 *                         the US was the leading place they worked, so the left bundle is shown largest, uncounted)
 *   lanterns  'employed'  the camera tilts down to the water: small paper lanterns set out from the right shore drift
 *                         across, some reaching the left (open weights crossing the water; generic, no logos)
 *
 * WINDOW RULE (ch14): the strait is always seen THROUGH the study window (its frame faint at the edges); no shelf, no
 * hands. Both skylines lit with exactly equal warmth; the plate's figures and both shores equally lit throughout.
 * TEXT RULE: two text items (the plate's caption, the Qwen label).
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { FONT, LAYERS, MOODS, defineShot, hash1, mixLab, softSprite, toLayer, toScreen, withAlpha } from '../../../film';
import { monotone } from '../sets/ch02-s05b-util';
import {
  HZ, LANTERN, SHORE, across, boardStones, clamp01, floatLantern, jetty, lerp, monoLabel, nearWater, sm, straitBack,
  tq12, win, windowFrame, type P,
} from '../sets/ch14-s05-strait';

const ID = 'ch14-s05';
type C = CanvasRenderingContext2D;

// ------------------------------------------------------------------------------------------------ the plate (L4)
const PLATE = { cx: 640, cy: 186, w: 460, h: 292 };
const PX0 = PLATE.cx - PLATE.w / 2, PY0 = PLATE.cy - PLATE.h / 2;
const PY1 = PY0 + PLATE.h;
/** a gutter between the destination blocks, so the blocks read as groups */
const GUT = 18;
const DX = 28;

type Dest = 'farL' | 'L' | 'R' | 'farR';
const ORDER: Dest[] = ['farL', 'L', 'R', 'farR'];
// first degree (MacroPolo Global AI Talent Tracker 2.0, NeurIPS 2022): China 47 %, US 18 %, the rest elsewhere. The
// plate is grouped BY DESTINATION, left to right, each group a solid block of columns (ten figures to a column,
// filled from the bottom): the far-left shores (17), the left shore (18), the right shore (47), the far-right (18)
const STUDIED: Dest[] = Array.from({ length: 100 }, (_, i) => (i < 17 ? 'farL' : i < 35 ? 'L' : i < 82 ? 'R' : 'farR'));
const G_START: Record<Dest, number> = { farL: 0, L: 17, R: 35, farR: 82 };
const G_COL: Record<Dest, number> = { farL: 0, L: 2, R: 4, farR: 9 };
const N_COLS = 11;
const GRID = { x0: PLATE.cx - ((N_COLS - 1) * DX + 3 * GUT) / 2, y0: PY0 + 64, dy: 19.2 };
/** figure i: its block, its column in the block, its row (bottom-up, so a part column is open at the top) */
const fig = (i: number): P => {
  const d = STUDIED[i];
  const j = i - G_START[d];
  return { x: GRID.x0 + (G_COL[d] + Math.floor(j / 10)) * DX + GUT * ORDER.indexOf(d), y: GRID.y0 + (9 - (j % 10)) * GRID.dy };
};
// where they work: the left (US) bundle the largest (illustrative split; only "the US leads" is claimed)
const WORK: Dest[] = STUDIED.map((d, i) => {
  if (d === 'L') return i === 20 ? 'farL' : 'L';
  if (d === 'R') {
    const k = i - 35;
    return k % 2 === 0 && k < 46 ? 'L' : k === 45 || k === 46 ? 'farR' : 'R';
  }
  if (d === 'farL') return i < 2 ? 'L' : i < 5 ? 'R' : 'farL';
  return i >= 97 ? 'R' : 'farR';
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
/** a few already on the water by the right shore; then, from the 'lanterns' beat, one set out from the right shore
 *  every 0.25 s, drifting left (the first few fastest, so three or four cross the centre line by the cut).
 *  x0 is screen px at the set-out, v the depth on the water (0 = far, 1 = near) */
const EARLY = [
  { x0: 1104, v: 0.16, speed: 7, seed: 3, at: -1 },
  { x0: 1182, v: 0.3, speed: 9, seed: 10, at: -1 },
];
const SETOUT = Array.from({ length: 14 }, (_, k) => {
  const lead = k < 4;
  const v = lead ? [0.4, 0.58, 0.28, 0.7][k] : 0.1 + 0.62 * ((k * 0.618 + 0.21) % 1);
  return {
    k,
    x0: lead ? 840 + 34 * k : 880 + 330 * ((k * 0.382 + 0.1) % 1),
    v,
    speed: lead ? 64 - 3 * k : 18 + 26 * v,
    seed: 17 + k * 7,
  };
});

interface B {
  D: number;
  plate: number;
  studied: number;
  work: number;
  lanterns: number;
  setOut: number;
  end: number;
}
interface Scene {
  tl: Timeline;
  b: B;
  cam: (t: number) => Camera3;
  [k: string]: unknown;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      plate: T.beat('plate'),
      studied: T.beat('studied'),
      work: T.beat('work'),
      lanterns: T.beat('lanterns'),
      setOut: T.beat('lanterns') - 0.15,
      end: T.line('L1416').end,
    };
    // a slow push toward the plate while it fills; then, in the music, an easing back and down: the plate stays whole
    // at the top of frame while more of the water (and the lanterns crossing it) comes into view
    const keys: [number, number, number][] = [
      [0, 336, 0],
      [b.lanterns - 0.2, 340, 30],
      [D, 374, -44],
    ];
    const fy = monotone(keys.map((k) => [k[0], k[1]]));
    const fz = monotone(keys.map((k) => [k[0], k[2]]));
    const cam = (t: number): Camera3 => ({ x: 640, y: fy(t), z: fz(t), lens: 1 });
    tl.hold(0, D);
    return { tl, b, cam };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const tq = tq12(t);
    const b = sc.b;
    const cam = sc.cam(t);
    f.camera(cam);

    straitBack(f, { key: 'dusk', fence: 0.35, sunX: 640, sun: 1 });
    f.fog({ yCenter: HZ + 6, height: 70, alpha: 0.16, drift: 5 });
    f.layer('L3', (c, env) => {
      nearWater(c, env, -400, 1700, 450, 1200);
      lanterns(c, env, t, b, cam, 0, 0.5, LAYERS.L3);
    });
    f.fog('B');
    f.layer('L4', (c, env) => {
      jetty(c, env, { lantern: 0.8, onBoard: (cc, e2) => boardStones(cc, e2) });
      lanterns(c, env, t, b, cam, 0.5, 1.01, LAYERS.L4);
      plate(f, c, env, t, tq, b, cam);
    });
    f.rim({ x: 0, y: -1 });
    f.practical({ x: LANTERN.x, y: LANTERN.y, kind: 'lamp', seed: 1405, intensity: 0.45, radius: 26 });
    // the near plane: a dark swell along the bottom of the frame and a mooring pile at right, soft (L5)
    f.layer('L5', (c, env) => nearPlane(c, env, t));

    windowFrame(f);
    const c = f.c;
    c.save();
    c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
    const la = win(t, b.lanterns, b.lanterns + 0.6);
    if (la > 0.01) {
      // over open water right of the jetty, on its own soft ink plate (the lanterns pass under it, never through it)
      const g = c.createRadialGradient(930, 584, 10, 930, 584, 330);
      g.addColorStop(0, withAlpha(f.mood.ink, 0.5 * la));
      g.addColorStop(0.55, withAlpha(f.mood.ink, 0.32 * la));
      g.addColorStop(1, withAlpha(f.mood.ink, 0));
      c.save();
      c.translate(930, 584);
      c.scale(1, 0.32);
      c.translate(-930, -584);
      c.fillStyle = g;
      c.fillRect(930 - 340, 584 - 340, 680, 680);
      c.restore();
      monoLabel(c, { text: 'OCT 2025 · OPEN QWEN PASSES LLAMA IN DOWNLOADS', x: 1158, y: 590, a: la, size: 18, align: 'right' }, f.mood);
    }
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
    const t0 = b.setOut + 0.25 * L.k;
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

/** the parchment plate, its hundred paper scholars (grouped by destination), and the threads of light to the shores */
function plate(f: Frame, c: C, env: PaintEnv, t: number, tq: number, b: B, cam: Camera3) {
  const up = sm((tq - (b.plate - 0.15)) / 1.1);
  if (up <= 0.001) return;
  const dy = (1 - up) * 70;
  const m = env.mood;
  const PM = MOODS.parchment;
  c.save();
  c.globalAlpha *= Math.min(1, up * 1.6);
  c.translate(0, dy);
  // the plate, baked: parchment with a deckled edge, a printed rule, the heading
  f.cached(`ch14-s05/plate2/${m.id}`, PLATE.w + 40, PLATE.h + 40, (cc) => {
    cc.translate(-(PX0 - 20), -(PY0 - 20));
    plateArt(cc, env);
  })(c, PX0 - 20, PY0 - 20);
  c.restore();

  // threads: run out at 'China' (each from its own figure's feet), re-route at 'America'
  // the threads run out fast (all landed ~0.6 s after 'China'), so the 47 / 18 state is held before 'America'
  const run = (tq - b.studied + 0.25) / 0.8;
  const rr = (tq - b.work - 0.05) / 1.5;
  const startOf = (i: number) => 0.3 * ((i * 37) % 100) / 100;
  // the figures: identical paper scholars; each lights as its thread leaves (the far-shore ones a little less)
  const paper = mixLab(PM.sky[1], m.rim, 0.18);
  const figCol = mixLab(PM.set, m.set, 0.42);
  const litCol = mixLab(m.halo, PM.ink, 0.5);
  const wash = mixLab(m.halo, m.core, 0.3);
  const farCol = mixLab(figCol, paper, 0.6);
  const bookCol = mixLab(PM.set, m.set, 0.62);
  c.save();
  c.globalAlpha *= Math.min(1, up * 1.6);
  for (let i = 0; i < 100; i++) {
    const g = fig(i);
    const since = (run - startOf(i)) * 0.8;
    const lk = sm(since / 0.3);
    // as its thread leaves, a figure bound for one of the two shores lights (a warm wash, a deeper ink); one bound
    // for a far shore pales: the plate itself then shows the two blocks, 47 and 18
    const far = STUDIED[i].startsWith('far');
    const col = far ? mixLab(figCol, farCol, lk) : mixLab(figCol, litCol, lk);
    const x = g.x, y = g.y + dy;
    if (!far && lk > 0.01) {
      c.save();
      c.globalAlpha *= 0.5 * lk;
      c.drawImage(softSprite(wash, 0.35), x - 13, y - 14, 26, 28);
      c.restore();
    }
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y - 4.6, 2.3, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(x - 3, y - 2);
    c.lineTo(x + 3, y - 2);
    c.lineTo(x + 3.5, y + 7.5);
    c.lineTo(x - 3.5, y + 7.5);
    c.closePath();
    c.fill();
    c.fillStyle = far ? mixLab(bookCol, farCol, lk) : mixLab(bookCol, litCol, 0.5 * lk);
    c.save();
    c.translate(x + 4, y + 1.6);
    c.rotate(0.18);
    c.fillRect(-1.2, -2.8, 2.4, 5.8);
    c.restore();
  }
  // caption line types on at 'China'
  const cap = 'FIRST DEGREE: CHINA 47% · US 18%';
  const n = Math.max(0, Math.min(cap.length, Math.floor((tq - b.studied + 0.1) * 26)));
  if (n > 0) {
    c.fillStyle = mixLab(PM.ink, PM.set, 0.15);
    c.font = `600 17.5px ${FONT.mono}`;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    const full = c.measureText(cap).width;
    c.fillText(cap.slice(0, n), PLATE.cx - full / 2, PY1 - 20 + dy);
  }
  c.restore();
  if (run <= 0) return;

  const pts: P[] = new Array(25);
  const toL4 = (p: P) => across(LAYERS.L1, LAYERS.L4, cam, p);
  const col = mixLab(m.rim, m.core, 0.45);
  const strand = mixLab(m.halo, PM.ink, 0.35);
  const weight: Record<Dest, number> = { farL: 0, L: 0, R: 0, farR: 0 };
  c.save();
  c.lineCap = 'round';
  for (let i = 0; i < 100; i++) {
    const g = fig(i);
    const st = startOf(i);
    const r = clamp01((run - st) / 0.75);
    if (r <= 0) continue;
    const ui = sm(clamp01((rr - 0.25 * (((i * 53) % 100) / 100)) / 0.75));
    const a0 = D_STUDY[i], a1 = D_WORK[i];
    const d = toL4({ x: lerp(a0.x, a1.x, ui), y: lerp(a0.y, a1.y, ui) });
    // the strand down the plate from the figure's feet to the plate's lower edge, just right of its column
    const row = i % 10;
    const sx = g.x + 6.5 + row * 0.5;
    const sy0 = g.y + 8 + dy, sy1 = PY1 - 3 + dy;
    const rv = clamp01(r / 0.22);
    const far = lerp(STUDIED[i].startsWith('far') ? 1 : 0, WORK[i].startsWith('far') ? 1 : 0, ui);
    c.globalCompositeOperation = 'source-over';
    c.strokeStyle = withAlpha(strand, lerp(0.42, 0.2, far));
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(sx, sy0);
    c.lineTo(sx, lerp(sy0, sy1, rv));
    c.stroke();
    if (r > 0.22) {
      // then a sagging run of light out over the water to its shore
      const q1 = (r - 0.22) / 0.78;
      const e = { x: sx, y: sy1 };
      const lift = Math.sin(Math.PI * ui) * 70;
      const cx = (e.x + d.x) / 2, cy = Math.max(e.y, d.y) + 14 - lift;
      for (let k = 0; k <= 24; k++) {
        const q = (k / 24) * q1;
        const u1 = 1 - q;
        pts[k] = { x: u1 * u1 * e.x + 2 * u1 * q * cx + q * q * d.x, y: u1 * u1 * e.y + 2 * u1 * q * cy + q * q * d.y };
      }
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = withAlpha(col, lerp(0.46, 0.2, far));
      c.lineWidth = lerp(1.15, 0.8, far);
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
  // where the bundles land: a glow on each shore whose size is linear in the number of threads arriving there
  c.globalCompositeOperation = 'lighter';
  const spr = softSprite(mixLab(m.halo, m.core, 0.5), 0.2);
  for (const d of ORDER) {
    const k = weight[d];
    if (k < 0.2) continue;
    const p = toL4(LAND[d]);
    const rad = 6 + 0.9 * k;
    c.globalAlpha = Math.min(1, 0.45 + 0.012 * k);
    c.drawImage(spr, p.x - rad * 1.5, p.y - rad * 0.7, rad * 3, rad * 1.4);
    c.globalAlpha = Math.min(1, 0.55 + 0.01 * k);
    c.drawImage(spr, p.x - rad * 0.7, p.y - rad * 0.3, rad * 1.4, rad * 0.6);
  }
  c.restore();
}

/** parchment with a deckled edge, a printed double rule and the heading (the figures are drawn live, on top) */
function plateArt(c: C, env: PaintEnv) {
  const P = MOODS.parchment;
  const m = env.mood;
  const paper = mixLab(P.sky[1], m.rim, 0.18);
  // shadow, then the sheet with a softly deckled edge
  c.fillStyle = withAlpha(m.ink, 0.35);
  c.fillRect(PX0 + 6, PY0 + 8, PLATE.w, PLATE.h);
  c.fillStyle = paper;
  c.beginPath();
  const n = 60;
  for (let i = 0; i <= n; i++) c.lineTo(PX0 + (PLATE.w * i) / n, PY0 + 1.6 * hash1(i, 1));
  for (let i = 0; i <= 20; i++) c.lineTo(PX0 + PLATE.w + 1.6 * hash1(i, 2), PY0 + (PLATE.h * i) / 20);
  for (let i = n; i >= 0; i--) c.lineTo(PX0 + (PLATE.w * i) / n, PY1 + 1.6 * hash1(i, 3));
  for (let i = 20; i >= 0; i--) c.lineTo(PX0 + 1.6 * hash1(i, 4), PY0 + (PLATE.h * i) / 20);
  c.closePath();
  c.fill();
  // a printed double rule inside the edge
  c.strokeStyle = withAlpha(P.ink, 0.35);
  c.lineWidth = 0.8;
  c.strokeRect(PX0 + 12, PY0 + 12, PLATE.w - 24, PLATE.h - 24);
  c.strokeRect(PX0 + 15.5, PY0 + 15.5, PLATE.w - 31, PLATE.h - 31);
  // heading
  c.fillStyle = mixLab(P.ink, P.set, 0.15);
  c.font = `600 17.5px ${FONT.mono}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillText('NEURIPS 2022 TOP AUTHORS', PLATE.cx, PY0 + 40);
}
