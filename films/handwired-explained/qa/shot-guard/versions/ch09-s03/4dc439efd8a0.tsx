/**
 * ch09-s03 — THE JSON SEARCH MAP gets its machine time (serverCyan, lampChange in; 16.63 s).
 *   L0906 "A hundred thousand JSON documents, small text records, one per GPU lane, all running one small step."
 *   L0907 "So what is a GPU for? The demo's answer: “It is for many documents”."
 *
 * Machine: sets/ch09-s03-searchMap (real data from the repo's own generator: document 1's code points, and the
 * documents whose text contains 'error'). Planes: L2 the search hall's tall window wall (cyan backlight), fog A, L3 the
 * cold furnace from ch05-s06 at frame left (half in haze), L4 the map (the one sharp plane), L5 a hall pillar at the
 * right edge (soft).
 *
 * TEACHES, word by word:
 *   0 -> 7.45     OPEN CLOSE: one document enlarged across the frame, its strip of 512 code-point slots plus one length
 *                 slot (folded 27 to a row): 123 '{', 34 '"', 105 'i', 100 'd' ... -1 past the text's end, 353 in the
 *                 brass length slot. Its GPU thread, a copper bead, steps one slot at a time through a fixed cut-brass
 *                 plate (the step), on twos.
 *   5.74 lane     the bead brightens as it is named.
 *   7.45 step     PULL BACK (3.6 s, log zoom ~550x): the strip shrinks to one fine row of its cell, the cell to one among
 *                 100,000 in the documents' order, row after row; every cell's bead steps in unison through its own
 *                 identical plate, until the far rows are a shimmering grain.
 *   9.08 GPU      the furnace's grate lights serverCyan; fine threads run from it into every row at once.
 *   11.35 demo's  the README's attribution sits small in the upper band (until the sweep); the pattern 'error' is
 *                 typed into the small field above the map.
 *   14.0 onePass  one sweep of light crosses the whole map: the matches light copper, each mark larger than its cell;
 *                 the count '10,559 match' sets in at lower right (the field still reads 'error'). Hold: every bead
 *                 still stepping, the furnace glowing.
 * One accent: copper (bead, matches); the furnace's light is the mood's own cyan practical.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import {
  FONT,
  LAYERS,
  defineShot,
  drawTracked,
  legibleSize,
  measureTracked,
  mixLab,
  softPlate,
  textProbe,
  textRole,
  toLayer,
  toScreen,
  windowWall,
  withAlpha,
} from '../../../film';
import { MAP, HERO, SLOT_H, cellOrigin, copper, drawSearchMap, kiln, kilnMouth, mapView, patternField, slotCentre, toW, zoomForSlot, KILN_L3 } from '../sets/ch09-s03-searchMap';
import { clamp01, lerp, seg, sm, smr, twos } from '../sets/ch02-s01-period';

type C2 = CanvasRenderingContext2D;
const ID = 'ch09-s03';

interface Beats {
  D: number;
  /** the word "demo's" (the attribution sets in 0.15 s before it) */
  demos: number;
  lane: number;
  pull: number;
  gpu: number;
  answer: number;
  pass: number;
}

// ---------------------------------------------------------------- the map's framing (map units -> L4 world)
const Z_CLOSE = zoomForSlot(52);
const SW = (MAP.cw - MAP.gap) / MAP.sc;
/** the hero's first row across the frame at y 318, its first slot near the left edge; a slow truck along the row
 *  (five slots over the close-up) keeps the bead in frame to the row's end */
const HERO_U0 = 1 * MAP.cw + MAP.gap / 2;
const F_CLOSE0 = { u: HERO_U0 + (600 - 20) / Z_CLOSE, v: MAP.gap / 2 + (MAP.ch - MAP.gap) / MAP.sr / 2 + 42 / Z_CLOSE };
const F_CLOSE1 = { u: F_CLOSE0.u + 5.2 * SW, v: F_CLOSE0.v };
/** the whole map: 880 px wide, its centre at (735, 372) */
const Z_FAR = 880 / (MAP.cols * MAP.cw);
const F_FAR = { u: (MAP.cols * MAP.cw) / 2 - 95 / Z_FAR, v: (MAP.rows * MAP.ch) / 2 - 12 / Z_FAR };
const PULL_DUR = 3.6;
/** the map view at t: still on the hero, then a log-uniform pull out whose fixed point travels in a straight line */
function viewAt(t: number, b: Beats) {
  const tr = smr(t / (b.pull + 0.4));
  const F_CLOSE = { u: lerp(F_CLOSE0.u, F_CLOSE1.u, tr), v: F_CLOSE0.v };
  const u = smr((t - b.pull) / PULL_DUR);
  const Z = Math.exp(lerp(Math.log(Z_CLOSE), Math.log(Z_FAR), u));
  const f = (1 / Z_CLOSE - 1 / Z) / (1 / Z_CLOSE - 1 / Z_FAR);
  return { v: mapView(Z, lerp(F_CLOSE.u, F_FAR.u, f), lerp(F_CLOSE.v, F_FAR.v, f)), u };
}
/** the bead's slot and the slide between slots (4 slots a second: one detent every third twos tick) */
const STEP0 = 0.9;
const STEP_HZ = 4;
function stepAt(t: number) {
  const x = Math.max(0, (twos(t) - STEP0) * STEP_HZ);
  const slot = Math.min(511, Math.floor(x + 1e-6));
  const ph = x - Math.floor(x + 1e-6);
  return { slot, u: ph < 0.5 ? 0 : sm((ph - 0.5) * 2), ph };
}

// ---------------------------------------------------------------- the engine camera (multiplane parallax only)
const CAM_CLOSE: Camera3 = { x: 646, y: 356, z: 60, lens: 1 };
const CAM_CLOSE2: Camera3 = { x: 640, y: 358, z: 76, lens: 1 };
const CAM_FAR: Camera3 = { x: 628, y: 360, z: 0, lens: 1 };
function camAt(t: number, b: Beats): Camera3 {
  if (t < b.pull) {
    const u = smr(t / b.pull);
    return { x: lerp(CAM_CLOSE.x, CAM_CLOSE2.x, u), y: lerp(CAM_CLOSE.y, CAM_CLOSE2.y, u), z: lerp(CAM_CLOSE.z, CAM_CLOSE2.z, u), lens: 1 };
  }
  // the engine dolly (the near and far planes' parallax) runs ahead of the map's own pull, so the furnace at the
  // left slides into frame by ~9.3 s, just after 'GPU' lights its grate
  const u = smr((t - b.pull) / 1.95);
  return { x: lerp(CAM_CLOSE2.x, CAM_FAR.x, u), y: lerp(CAM_CLOSE2.y, CAM_FAR.y, u), z: lerp(CAM_CLOSE2.z, CAM_FAR.z, u), lens: 1 };
}

const SWEEP_DUR = 0.95;

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, demos: T.word('L0907', "demo's"), lane: T.beat('oneThread'), pull: T.beat('pullBack'), gpu: T.beat('furnace'), answer: T.beat('answer'), pass: T.beat('onePass') };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const cam = camAt(t, b);
    f.camera(cam);
    f.backlight({ sunX: 760, sunY: 380, intensity: 0.85 });
    const { v, u: pullU } = viewAt(t, b);
    const st = stepAt(t);
    const heat = seg(t, b.gpu - 0.12, b.gpu + 0.45);

    // ---------------- L2: the search hall's window wall (the cyan backlight through tall panes)
    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, 1800, 900, (cc) => {
        cc.translate(260, 100);
        hallWall(cc, env);
      })(c, -260, -100);
    });
    f.fog('A');
    // ---------------- L3: the furnace (cold until 'GPU'), its light painted before the action plane
    f.layer('L3', (c, env) => {
      kiln(f, c, env, heat, t);
      kilnFloor(c, env);
    });
    if (heat > 0.01) {
      const m = kilnMouth();
      f.practical({ x: m.x, y: m.y + 10, kind: 'screen', seed: 931, intensity: 0.85 * heat, radius: 120, layer: 'L3' });
    }
    f.fog('B');

    // ---------------- L4: the map, the threads, the field
    // the bead: 1 at rest; on 'lane' it flares to 2.5 for 0.6 s, then settles at 1.5 (and fades into the grain on the pull)
    const glow = (1 + 1.5 * seg(t, b.lane - 0.12, b.lane + 0.08) - 1.0 * seg(t, b.lane + 0.6, b.lane + 1.0)) * (1 - 0.5 * seg(t, b.pull + 0.2, b.pull + 1.2));
    const heroDissolve = seg(t, b.pull + 0.25, b.pull + 1.05);
    // the lockstep at map scale: every cell's tick one device px further on each twos tick (moiré of identical motion)
    const lock = { phase: Math.floor(twos(t) * 12 + 1e-6), alpha: 0.35 * seg(t, b.pull + 1.4, b.pull + 2.4) };
    const sweepX = t >= b.pass ? lerp(toW(v, 0, 0).x - 20, toW(v, MAP.cols * MAP.cw, 0).x + 20, clamp01((t - b.pass) / SWEEP_DUR)) : undefined;
    f.layer('L4', (c, env) => {
      drawSearchMap(f, c, env, v, {
        slot: st.slot,
        stepU: st.u,
        pulse: 1 - st.ph,
        beadGlow: glow,
        sweepX,
        matches: sweepX === undefined ? 0 : 1,
        key: ID,
        heroNumbers: 1 - seg(pullU, 0.15, 0.35),
        heroDissolve,
        lockstep: lock,
      });
      // up close the strip's folded rows sink into shadow; the shade lifts at once on the pull, so the block reads as
      // one cell among its neighbours (same scale, same paper) as it shrinks into its own place on the map
      foldShade(c, env, v, 1 - seg(t, b.pull - 0.1, b.pull + 0.45));
      heroRow(c, env, v, t, b);
      nearRow(c, env, t, b, st);
      if (heat > 0.01) threads(c, env, cam, v, t, b);
      if (sweepX !== undefined) sweepBand(c, env, v, sweepX, t, b);
      const fieldA = seg(t, b.answer - 0.35, b.answer + 0.15);
      const top = toW(v, 0, 0).y;
      patternField(c, env, { x: 735, y: top - 40, w: 230, text: 'error', shown: (twos(t) - (b.answer - 0.25)) * 9, alpha: fieldA, size: legibleSize(c, `500 20px ${FONT.mono}`, 20), t, key: ID, caret: t < b.pass + 0.4 });
    });
    f.rim({ x: 0.1, y: -1 });
    // on 'lane' the named bead is a practical light for 0.6 s (an LED-hard point), then settles
    {
      const ledA = seg(t, b.lane - 0.12, b.lane + 0.08) * (1 - 0.6 * seg(t, b.lane + 0.6, b.lane + 1.0)) * (1 - seg(t, b.pull, b.pull + 0.6));
      if (ledA > 0.01) {
        const sc0 = slotCentre(HERO.col, HERO.row, st.slot), sc1 = slotCentre(HERO.col, HERO.row, Math.min(512, st.slot + 1));
        const p0 = toW(v, sc0.u, sc0.v), p1 = toW(v, sc1.u, sc1.v);
        const same = Math.floor(st.slot / MAP.sc) === Math.floor((st.slot + 1) / MAP.sc);
        const bx = same ? lerp(p0.x, p1.x, st.u) : p0.x;
        const by = p0.y + SLOT_H * v.Z * 0.47;
        f.practical({ x: bx, y: by, kind: 'led', seed: 937, intensity: 0.9 * ledA, radius: 38, layer: 'L4' });
      }
    }

    // ---------------- L5: a hall pillar at the right edge (soft)
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/L5/${env.mood.id}`, 260, 1100, (cc) => {
        cc.translate(-1180, 150);
        pillar(cc, env);
      })(c, 1180, -150);
    });

    // ---------------- type (screen-locked): the README's attribution (answer -> pass), the count (pass ->)
    readmeLabel(f, t, b);
    countLabel(f, t, b);
  },
});

// ---------------------------------------------------------------- painters
/** L2: the hall's tall window wall: flat-headed panes the cyan backlight shows through (L2 world px) */
function hallWall(c: C2, env: PaintEnv) {
  windowWall(c, {
    x: -260, y: -100, w: 1800, h: 900, centers: [-120, 200, 520, 840, 1160, 1480], winW: 200, apex: 30, sill: 560,
    shape: 'flat', lights: 3, panes: { cols: 1, rows: 8 }, transoms: [], tracery: 'none', spandrel: 'none', pilasters: true, cornice: 50, wainscot: 0, glass: 0.4, seed: 93,
  }, env);
  c.fillStyle = env.fill('set');
  c.fillRect(-260, 690, 1800, 210);
}

/** L3: the floor line the furnace stands on (rest px of L3) */
function kilnFloor(c: C2, env: PaintEnv) {
  c.fillStyle = env.fill('ink');
  c.fillRect(-200, KILN_L3.y + 30, 700, 200);
}

/** the furnace's threads: fine cyan lines from its mouth into every row of the map, drawn out at once on 'GPU' */
function threads(c: C2, env: PaintEnv, cam: Camera3, v: ReturnType<typeof mapView>, t: number, b: Beats) {
  const m = kilnMouth();
  const s = toScreen(LAYERS.L3, cam, m.x, m.y);
  const from = toLayer(LAYERS.L4, cam, s.x, s.y);
  const left = toW(v, 0, 0);
  const H = MAP.rows * MAP.ch * v.Z;
  const u = seg(t, b.gpu - 0.05, b.gpu + 0.7);
  // one pulse down every thread as the sweep crosses the map (the furnace answers the pass)
  const pulse = Math.max(0, Math.sin(Math.PI * Math.min(1, Math.max(0, (t - b.pass + 0.1) / (SWEEP_DUR + 0.3)))));
  const N = 44;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.lineWidth = 1.1;
  for (let i = 0; i < N; i++) {
    const y = left.y + ((i + 0.5) / N) * H;
    const x1 = left.x + 2;
    const cx = lerp(from.x, x1, 0.55), cy = lerp(from.y, y, 0.2);
    // draw the fraction u of the quadratic from the mouth
    const qx = lerp(from.x, cx, u), qy = lerp(from.y, cy, u);
    const ex = (1 - u) * (1 - u) * from.x + 2 * (1 - u) * u * cx + u * u * x1;
    const ey = (1 - u) * (1 - u) * from.y + 2 * (1 - u) * u * cy + u * u * y;
    c.strokeStyle = withAlpha(mixLab(mixLab(env.mood.core, env.mood.halo, 0.3), '#ffffff', 0.35 * pulse), Math.min(0.95, 0.4 + 0.12 * Math.sin(i * 1.7 + t * 3) + 0.45 * pulse));
    c.lineWidth = 1.1 + 0.9 * pulse;
    c.beginPath();
    c.moveTo(from.x, from.y);
    c.quadraticCurveTo(qx, qy, ex, ey);
    c.stroke();
  }
  c.restore();
}

/** up close the strip reads as ONE strip: its folded rows below the first sink into shadow (lifting on the pull) */
function foldShade(c: C2, env: PaintEnv, v: ReturnType<typeof mapView>, a: number) {
  if (a <= 0.01) return;
  const o = toW(v, HERO_U0, MAP.gap / 2 + (MAP.ch - MAP.gap) / MAP.sr);
  const w = (MAP.cw - MAP.gap) * v.Z, h = (MAP.ch - MAP.gap) * v.Z;
  c.save();
  const g = c.createLinearGradient(0, o.y, 0, o.y + Math.min(h, 160));
  g.addColorStop(0, withAlpha(env.mood.ink, 0.82 * a));
  g.addColorStop(0.35, withAlpha(env.mood.ink, 0.95 * a));
  g.addColorStop(1, withAlpha(env.mood.ink, 0.97 * a));
  c.fillStyle = g;
  c.fillRect(o.x - 4, o.y, w + 8, h);
  // the fold: a crisp shadow line under the first row
  c.fillStyle = withAlpha(env.mood.ink, 0.7 * a);
  c.fillRect(o.x - 4, o.y - 1, w + 8, 3);
  c.restore();
}

/** the one pass: a vertical band of light crossing the map (additive), gone once it has crossed */
function sweepBand(c: C2, env: PaintEnv, v: ReturnType<typeof mapView>, x: number, t: number, b: Beats) {
  const k = 1 - seg(t, b.pass + SWEEP_DUR - 0.1, b.pass + SWEEP_DUR + 0.35);
  if (k <= 0) return;
  const top = toW(v, 0, 0).y, H = MAP.rows * MAP.ch * v.Z;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(x - 60, 0, x + 8, 0);
  g.addColorStop(0, withAlpha(env.mood.halo, 0));
  g.addColorStop(0.85, withAlpha(mixLab(env.mood.core, '#ffffff', 0.3), 0.5 * k));
  g.addColorStop(1, withAlpha(env.mood.core, 0));
  c.fillStyle = g;
  c.fillRect(x - 60, top - 10, 68, H + 20);
  c.restore();
}

/**
 * L5: a slim hall pillar at the right edge, its whole profile in frame at the wide (capital, fluted shaft, base on a
 * plinth standing on the floor), one value step lighter than the near-black (L5 world px)
 */
function pillar(c: C2, env: PaintEnv) {
  c.fillStyle = mixLab(env.fill('fg'), env.fill('set'), 0.32);
  const x0 = 1196, x1 = 1244;
  // the shaft
  c.fillRect(x0, 40, x1 - x0, 640);
  // the capital: an abacus slab, an echinus swell, a necking ring
  c.fillRect(x0 - 14, 8, x1 - x0 + 28, 14);
  c.beginPath();
  c.moveTo(x0 - 10, 22);
  c.quadraticCurveTo(x0 - 2, 40, x0, 44);
  c.lineTo(x1, 44);
  c.quadraticCurveTo(x1 + 2, 40, x1 + 10, 22);
  c.closePath();
  c.fill();
  c.fillRect(x0 - 3, 50, x1 - x0 + 6, 5);
  // the base: a torus over a square plinth standing on the floor (bottom edge of the frame)
  c.fillRect(x0 - 4, 660, x1 - x0 + 8, 8);
  c.beginPath();
  c.ellipse((x0 + x1) / 2, 674, (x1 - x0) / 2 + 9, 7, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(x0 - 13, 680, x1 - x0 + 26, 80);
  // flutes (darker hairlines) and a top-only rim on the capital and plinth
  c.strokeStyle = withAlpha(env.mood.ink, 0.35);
  c.lineWidth = 1.5;
  c.beginPath();
  for (const fx of [x0 + 12, x0 + 25, x0 + 38]) {
    c.moveTo(fx, 60);
    c.lineTo(fx, 655);
  }
  c.stroke();
  c.strokeStyle = withAlpha(env.mood.rim, 0.22);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(x0 - 14, 8);
  c.lineTo(x1 + 14, 8);
  c.moveTo(x0 - 13, 680);
  c.lineTo(x1 + 13, 680);
  c.stroke();
}

/**
 * THE NEAR ROW (the lockstep made legible): as the pull-back settles, one row of cells hangs in front of the map,
 * nearer the lens and in the light: a dozen documents side by side, each with its own identical cut-brass plate and
 * copper bead, every plate standing over the same slot and stepping on the same twos tick. It holds about two
 * seconds after the pull, then sinks back into the grain before the field is typed into.
 */
function nearRow(c: C2, env: PaintEnv, t: number, b: Beats, st: { slot: number; u: number }) {
  const a = seg(t, b.pull + 1.7, b.pull + 2.3) * (1 - seg(t, b.pull + 4.7, b.pull + 5.3));
  if (a <= 0.01) return;
  const N = 13, cw = 70, chh = 46, gap = 9;
  const x0 = 300 - 22 * (1 - a), y0 = 512 + 14 * (1 - a);
  const paper = mixLab(mixLab(env.mood.setHaze, env.mood.rim, 0.32), '#e4ece8', 0.18);
  const ink = withAlpha(mixLab('#18211f', env.mood.ink, 0.3), 0.32);
  const brassC = mixLab('#b08d4a', env.mood.halo, 0.2);
  const k = st.slot % 9;
  const pos = (k + (k < 8 ? st.u : 0)) / 9;
  c.save();
  c.globalAlpha *= a;
  // the row's shadow on the map behind (it floats nearer the lens)
  c.fillStyle = withAlpha(env.mood.ink, 0.35);
  c.fillRect(x0 - 10, y0 + 10, N * (cw + gap) + 10, chh + 6);
  // a brass rail the row hangs from
  c.fillStyle = brassC;
  c.fillRect(x0 - 14, y0 - 16, N * (cw + gap) + 20, 2.5);
  for (let i = 0; i < N; i++) {
    const x = x0 + i * (cw + gap), y = y0;
    c.fillStyle = paper;
    c.fillRect(x, y, cw, chh);
    // its folded strip as faint dashes (the numbers, as texture at this size)
    c.fillStyle = ink;
    for (let r = 0; r < 5; r++) for (let j = 0; j < 9; j++) c.fillRect(x + 4 + j * 7.2 + 1.6, y + 6 + r * 8.2, 3.6, 1.4);
    // the plate: the same cut, over the same slot of every cell; the bead in its cut
    const px = x + 4 + pos * (cw - 8 - 7.2) + 3.6;
    const plate = new Path2D();
    plate.rect(px - 5.5, y - 12, 11, 20);
    plate.rect(px - 1.2, y - 15, 2.4, 3.5);
    plate.rect(px - 3.4, y + 1.5, 6.8, 5.5);
    plate.moveTo(px - 1.6, y - 8);
    plate.arc(px - 2.6, y - 8, 1, 0, Math.PI * 2);
    plate.moveTo(px + 3.6, y - 8);
    plate.arc(px + 2.6, y - 8, 1, 0, Math.PI * 2);
    c.fillStyle = brassC;
    c.fill(plate, 'evenodd');
    c.fillStyle = copper(env, 0.8);
    c.beginPath();
    c.arc(px, y + 6, 2.2, 0, Math.PI * 2);
    c.fill();
    // a top-edge catch of light on the cell
    c.fillStyle = withAlpha(env.mood.rim, 0.35);
    c.fillRect(x, y, cw, 1);
  }
  c.restore();
}

/**
 * The near row: for ~2 s after the pull-back, the hero's row stays picked out in front of the grain: brass hairlines
 * above and below it, every cell's bead a bright copper tick at the same place (the lockstep, legible), and the
 * row's brass plate at its left end (one plate per row: the same cut for every cell).
 */
function heroRow(c: C2, env: PaintEnv, v: ReturnType<typeof mapView>, t: number, b: Beats) {
  const a = seg(t, b.pull + 2.1, b.pull + 2.8) * (1 - seg(t, b.pull + 5.0, b.pull + 5.8));
  if (a <= 0.01) return;
  const row = HERO.row;
  const o0 = cellOrigin(0, row);
  const tl = toW(v, o0.u - MAP.gap / 2, o0.v - MAP.gap / 2);
  const W = MAP.cols * MAP.cw * v.Z, h = MAP.ch * v.Z;
  c.save();
  c.globalAlpha *= a;
  // the row lifted a shade (it is nearer, in the light)
  c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.2);
  c.fillRect(tl.x, tl.y, W, h);
  c.strokeStyle = withAlpha(mixLab('#b08d4a', env.mood.halo, 0.25), 0.85);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(tl.x - 8, tl.y);
  c.lineTo(tl.x + W, tl.y);
  c.moveTo(tl.x - 8, tl.y + h);
  c.lineTo(tl.x + W, tl.y + h);
  c.stroke();
  // every cell's bead: the same slot, the same place, a tick per cell (on twos with the grain)
  const ph = (Math.floor(twos(t) * 12 + 1e-6) % 6) / 6;
  c.fillStyle = copper(env, 1);
  for (let k = 0; k < MAP.cols; k++) {
    const o = cellOrigin(k, row);
    const p = toW(v, o.u + (MAP.cw - MAP.gap) * (0.15 + 0.7 * ph), o.v);
    c.fillRect(p.x, p.y + h * 0.15, Math.max(0.6, v.Z * 0.18), h * 0.6);
  }
  // the row's plate, at its left end in the margin: the same cut brass stencil, small
  const px = tl.x - 13, py = tl.y + h / 2;
  const pw = 9, phh = 12;
  const plate = new Path2D();
  plate.rect(px - pw / 2, py - phh / 2, pw, phh);
  plate.rect(px - 2.2, py - 1, 4.4, 4.4);
  plate.moveTo(px - 1.5, py - 3.6);
  plate.arc(px - 2.5, py - 3.6, 1, 0, Math.PI * 2);
  plate.moveTo(px + 3.5, py - 3.6);
  plate.arc(px + 2.5, py - 3.6, 1, 0, Math.PI * 2);
  c.fillStyle = mixLab('#b08d4a', env.mood.halo, 0.25);
  c.fill(plate, 'evenodd');
  c.restore();
}

/** the README's attribution, small, in the upper band (the voice reads the quotation; it is never set on screen) */
function readmeLabel(f: Frame, t: number, b: Beats) {
  const a = seg(t, b.demos - 0.15, b.demos + 0.2) * (1 - seg(t, b.pass - 0.1, b.pass + 0.35));
  if (a <= 0) return;
  const c = f.c;
  textRole(c, 'subject', () => {
    c.save();
    const size = legibleSize(c, `italic 500 22px ${FONT.text}`, 22);
    const o = { font: `italic 500 ${size}px ${FONT.text}`, size, tracking: 0.02, align: 'left' as const };
    const text = "the demo's README";
    const w = measureTracked(c, text, o);
    c.globalAlpha = a;
    softPlate(c, 52 + w / 2, 58, w + 120, size + 50, f.mood.ink, 0.45);
    c.fillStyle = mixLab('#e6eeea', f.mood.core, 0.2);
    drawTracked(c, text, 52, 66, o);
    textProbe(c, `${ID}-readme`, 52, 66 - size, w, size * 1.2, a);
    c.restore();
  });
}

/** the count, lower right, set in on the sweep */
function countLabel(f: Frame, t: number, b: Beats) {
  const a = seg(t, b.pass + 0.35, b.pass + 0.9);
  if (a <= 0) return;
  const c = f.c;
  textRole(c, 'subject', () => {
    c.save();
    const size = legibleSize(c, `500 21px ${FONT.mono}`, 21);
    const o = { font: `500 ${size}px ${FONT.mono}`, size, tracking: 0.06, align: 'right' as const };
    const text = '10,559 match';
    const w = measureTracked(c, text, o);
    c.globalAlpha = a;
    const R = 1140; // right edge, clear of the pillar
    softPlate(c, R - w / 2, 616, w + 150, size + 60, f.mood.ink, 0.5);
    // a copper mark beside it: the key to the map's marks
    c.fillStyle = mixLab(mixLab('#c27a43', f.mood.halo, 0.12), '#ffd9a8', 0.3);
    c.beginPath();
    c.arc(R - w - 16, 622 - size * 0.35, 5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = mixLab('#e6eeea', f.mood.core, 0.2);
    drawTracked(c, text, R + (1 - sm(a)) * 10, 622, o);
    textProbe(c, `${ID}-count`, R - w, 622 - size, w, size * 1.2, a);
    c.restore();
  });
}
