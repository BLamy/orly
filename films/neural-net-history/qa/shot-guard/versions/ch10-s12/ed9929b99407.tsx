/**
 * ch10-s12 — why it won, and the catch (serverCyan; 18.7 s; paper wipe in from the loom).
 *
 * A parchment plate hung on visible cords in the hall of word-slips (same mood as the loom, no tint change), raked by
 * the hall's window light from the top-left, swaying slowly; the hall's pews cross its foot (L5) from frame 0.
 *   0 → 5.9     the web group (eight slips, the web of threads, the scribe's lamp) drawn 1.45× about x 420; the rack
 *               of eight dark slabs whole at right. 'No': the lamp hops slip to slip, ticking each ("waiting in
 *               line"); 'all': it is struck away and every thread lights in the same instant.
 *   'multiplication'  the web shrinks and collapses into one 8 × 8 grid; its rows are cut and wired to the rack; at
 *               matrix + 0.4 s ALL EIGHT row-wires, grid bands and slabs fire in the SAME frame, then share one pulse.
 *   'chips'     the slabs are seen for what they are: eight graphics chips (fan, die, gold fingers).
 *   pause       (review round 3) ONE card only: the TIME card rises on 'sundial' (9.66) with "12 hours" inking as the
 *               paper comes up (cards carry their text), its paper sundial's shadow sweeps half a day, and "one
 *               machine, 8 GPUs" inks about 0.4 s after 'sundial'. (Review round 4) the card carries ONE fact and
 *               nothing else: no cost comparison of any kind. Every line at the 22 px cap floor or larger. It holds,
 *               alone, until 'wall' (13.54): the plate is flown out a beat after 'catch', and the card is the last
 *               thing on it to go. (L1024 already carries the result.)
 *   'chips'     (reviser r1) the eight cyan dies cast a soft glow onto the paper around the rack through the hold.
 *   plate       (critic round 1) ~75% of frame height, its foot behind the pews, the hall showing above and beside it;
 *               the window light rakes it harder (a ~15% falloff from the top-left). As it flies out, its contents fade
 *               before they cross the top of frame (nothing is clipped by the frame edge).
 *   'catch'     a beat after it, the plate is flown out on its cords; behind it, in the hall, the sentence's banner
 *               of ten slips.
 *   'twice'     the sentence grows slip by slip to twenty, landing 20 words · 400 pairs on 'four'; the threads
 *               multiply, thicken, and the centre closes into a near-solid sheet of light. (reviser r1) the slips
 *               carry the hall's real words (HALL_WORDS, as in ch10-s04 / s10), and the ten-word web's outline stays
 *               drawn OVER the grown web (a solid warm contour) until 'looking', so the two sizes compare.
 *   'looking'   "cost ∝ n²" inks as its own larger serif mark on a slate tag beside the counter (complete ≈ 16.9 s);
 *               the camera eases toward the wall's brightest knot (it becomes the candle's flame in ch10-s13b).
 * Grid shading is illustrative (seeded scores); the counts (n words → n² pairs) are exact.
 * CAMERA: a gentle push toward the web (the rack kept whole), a settle back for the grid and the chips, low for the
 * pause, then the hall.
 * Legibility: every label the viewer reads is sized with legibleSize (22 px cap height at 1080p floor).
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { defineShot, mixLab, withAlpha } from '../../../film';
import { glow, parchmentPlate } from '../../../film/silhouette/metaphors/kit';
import { hash1 } from '../../../film/silhouette/atmosphere';
import { FONT, cardInkAlpha, cardPaperAlpha, cardProbe, legibleSize } from '../../../film/silhouette/type';
import { camKeys } from '../sets/ch03-s06-kit';
import { CY, INK, OXBLOOD, P, clamp01, ink, lerp, plateCords, platePool, sm, tq12, win, wordSlip } from '../sets/ch10-s06-kit';
import type { InkOpts } from '../sets/ch10-s06-kit';
import { hallBackdropDark, pewBacks } from '../sets/ch10-s12-hall';
import { HALL_WORDS } from '../sets/ch10-s01-hall';

type C = CanvasRenderingContext2D;
const ID = 'ch10-s12';

// ------------------------------------------------------------------------------------------------ plate layout
// (round-2 revision) the plate hangs lower on visible cords (the hall shows above it and the pews cross its foot);
// the web group (slips, web, the scribe's lamp) is drawn at WEB_K× about the grid's top centre (x 420) until
// 'multiplication', then shrinks onto the 8 × 8 grid it collapses into; the rack sits whole at right from frame 0.
const PL = { x: 96, y: 52, w: 1088, h: 610 };
/** (critic round 1) the plate is drawn at PK about its foot (PPIV): ~75% of frame height, the hall around it */
const PK = 0.88;
const PPIV = { x: 640, y: 662 };
/** and lifted so its lowest lettering clears the pews' finials (its foot still passes behind them) */
const PLIFT = -22;
const NS = 8;
const G = { x: 260, y: 206, cell: 38 };
const gx = (j: number) => G.x + (j + 0.5) * G.cell;
const gy = (i: number) => G.y + (i + 0.5) * G.cell;
const slipX = (i: number) => gx(i);
const SLIP_W = 32;
const SLIP_TOP = 144;
const SLIP_BOT = 192;
const webLift = (d: number) => 26 + d * 50;
const GRID_R = G.x + NS * G.cell;
const GRID_B = G.y + NS * G.cell;
/** the web group's pivot and its scale before the collapse */
const PIV = { x: G.x + (NS * G.cell) / 2, y: SLIP_TOP };
const WEB_K = 1.45;
const RACK = { x0: 732, x1: 1140, y0: 206, y1: 498 };
const SLAB = { w: 36, y0: 240, y1: 472 };
const slabX = (k: number) => 768 + k * 48;
const DIE_Y = 358;
const SLAB_FILL = '#1f2a2d';
/** the TIME card: one pinned card, centred under the grid and the rack, holding the sundial, "12 hours" and "one
 *  machine, 8 GPUs" (one fact) */
const TCARD = { x: 376, y: 520, w: 528, h: 132 };
const DIAL = { x: 478, y: 594, rx: 74, ry: 20 };

/** row r of the grid is computed by chip 7 − r (a nested ribbon: no wire crosses another or a slab) */
const chipOf = (r: number) => NS - 1 - r;
interface Wire {
  pts: { x: number; y: number }[];
  cum: number[];
  len: number;
}
function roundedPath(corners: { x: number; y: number }[], rad: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [corners[0]];
  for (let i = 1; i < corners.length - 1; i++) {
    const p = corners[i - 1], q = corners[i], n = corners[i + 1];
    const d0 = Math.hypot(q.x - p.x, q.y - p.y), d1 = Math.hypot(n.x - q.x, n.y - q.y);
    const r = Math.min(rad, d0 / 2, d1 / 2);
    const a = { x: q.x + ((p.x - q.x) / d0) * r, y: q.y + ((p.y - q.y) / d0) * r };
    const b = { x: q.x + ((n.x - q.x) / d1) * r, y: q.y + ((n.y - q.y) / d1) * r };
    for (let s = 0; s <= 6; s++) {
      const u = s / 6, v = 1 - u;
      out.push({ x: v * v * a.x + 2 * v * u * q.x + u * u * b.x, y: v * v * a.y + 2 * v * u * q.y + u * u * b.y });
    }
  }
  out.push(corners[corners.length - 1]);
  return out;
}
const WIRES: Wire[] = Array.from({ length: NS }, (_, r) => {
  const lane = GRID_R + 22 + r * 13;
  const bus = 112 + r * 10;
  const xEnd = slabX(chipOf(r)) - SLAB.w / 2 + 7; // down the chip's left edge
  const pts = roundedPath(
    [
      { x: GRID_R + 3, y: gy(r) },
      { x: lane, y: gy(r) },
      { x: lane, y: bus },
      { x: xEnd, y: bus },
      { x: xEnd, y: SLAB.y0 - 12 },
    ],
    9,
  );
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, cum, len: cum[cum.length - 1] };
});
function wireAt(w: Wire, u: number): { x: number; y: number } {
  const L = clamp01(u) * w.len;
  let i = 1;
  while (i < w.cum.length - 1 && w.cum[i] < L) i++;
  const s = (L - w.cum[i - 1]) / Math.max(1e-6, w.cum[i] - w.cum[i - 1]);
  return { x: lerp(w.pts[i - 1].x, w.pts[i].x, s), y: lerp(w.pts[i - 1].y, w.pts[i].y, s) };
}
function wirePath(c: C, w: Wire, u: number) {
  const L = clamp01(u) * w.len;
  c.beginPath();
  c.moveTo(w.pts[0].x, w.pts[0].y);
  for (let i = 1; i < w.pts.length; i++) {
    if (w.cum[i] <= L) c.lineTo(w.pts[i].x, w.pts[i].y);
    else {
      const p = wireAt(w, u);
      c.lineTo(p.x, p.y);
      break;
    }
  }
}

/** illustrative attention-style grid: one softmax row per word (seeded scores) */
const WGT: number[][] = Array.from({ length: NS }, (_, i) => {
  const s = Array.from({ length: NS }, (_, j) => 2.4 * (hash1(i * 31 + j, 1012) - 0.5) * 2 + (i === j ? 1.4 : 0) - 0.18 * Math.abs(i - j));
  const m = Math.max(...s);
  const e = s.map((v) => Math.exp(v - m));
  const z = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / z);
});
const WMAX = Math.max(...WGT.flat());

// ------------------------------------------------------------------------------------------------ the hall banner
const BX0 = 380;
const BP = 56;
const bx = (i: number) => BX0 + i * BP;
const BEAM_Y = 190;
const HSLIP_TOP = 214;
const HSLIP_H = 58;
const HSLIP_BOT = HSLIP_TOP + HSLIP_H;
const arcLift = (d: number) => 46 + d * 30; // control-point offset; depth = lift / 2
const KNOT = { x: (bx(0) + bx(19)) / 2, y: HSLIP_BOT + arcLift(10) * 0.5 };

interface B {
  D: number;
  noWait: number;
  once: number;
  matrix: number;
  chips: number;
  sundial: number;
  /** the TIME card rises with "12 hours" inking on it; its dial sweeps sweep0 → sweep1; "one machine, 8 GPUs" at gpus */
  card0: number;
  sweep0: number;
  sweep1: number;
  gpus: number;
  /** the plate flies out (a beat after 'catch'); the TIME card on it holds until 'wall' */
  fly: number;
  wall: number;
  /** 'four': the sentence has reached twenty words (400 pairs) */
  four: number;
  /** seconds between arriving slips (10 → 20 between 'twice' and 'four') */
  pace: number;
  /** 'looking': the cost mark starts inking */
  looking: number;
  costEq: number;
  cam: (t: number) => Camera3;
}

export default defineShot({
  id: ID,
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      noWait: T.word('L1025', 'No'),
      once: T.word('L1025', 'all'),
      matrix: T.beat('matrix'),
      chips: T.beat('chips'),
      sundial: T.beat('sundial'),
      card0: 0,
      sweep0: 0,
      sweep1: 0,
      gpus: 0,
      // a beat after 'catch' (the line's own pause), so the TIME card still reads until 'wall'
      fly: Math.max(T.word('L1027', 'catch') + 0.3, T.beat('wall') - 0.3),
      wall: T.beat('wall'),
      four: T.word('L1027', 'four'),
      pace: 0.12,
      looking: T.word('L1027', 'looking'),
      costEq: T.beat('costEq'),
      cam: () => ({ x: 640, y: 360, z: 0, lens: 1 }),
    };
    // the tenth..twentieth slips arrive evenly so the counter lands 20 · 400 on 'four' and holds through 'looking'
    b.pace = Math.max(0.09, (b.four - 0.1 - b.wall) / 9);
    // (review round 3) the one card rises on 'sundial' with its first line inking as the paper comes up; the dial's
    // shadow sweeps half a day (≈ 1.4 s), then "one machine, 8 GPUs"; it holds alone until 'wall'
    b.card0 = b.sundial - 0.45;
    b.sweep0 = b.sundial + 0.1;
    b.sweep1 = b.sweep0 + 1.4;
    // (review round 4) the machine line inks about 0.4 s after 'sundial', while the shadow sweeps
    b.gpus = b.sundial + 0.4;
    const PCY = PL.y + PL.h / 2;
    b.cam = camKeys([
      [0, 640, PCY - 10, 0],
      // a gentle push toward the web while the lamp hops (the rack stays whole in frame)
      [b.once - 0.15, 606, PCY - 18, 46],
      [b.matrix + 0.7, 640, PCY - 6, 22],
      [b.chips + 0.4, 652, PCY - 4, 30],
      // the pause: the TIME card is the subject, so the camera pushes in on it (slowly), then lifts with the fly
      // centred on the one card (dial + time), so all of it stays in frame
      [b.card0 + 0.9, 640, PCY + 74, 60],
      [b.fly - 0.25, 640, PCY + 90, 78],
      [b.fly + 0.2, 630, PCY + 50, 70],
      [b.wall + 0.35, 632, 352, 70],
      [b.wall + 3.1, 900, 372, -96],
      [b.costEq + 0.3, 912, 382, -100],
      // (reviser r1) the last move eases the knot up to frame y ≈ 313 (470 at 1080p), x ≈ 653: where ch10-s13b's
      // opening flame burns, so the crossfade is a true match-cut
      [D, KNOT.x - 14, KNOT.y + 44, -30],
    ]);
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    const cam = b.cam(t);
    f.camera(cam);
    const cams = [b.cam(0), b.cam(b.once), b.cam(b.chips + 0.6), b.cam(b.fly - 0.25), b.cam(b.wall + 3.1), b.cam(b.D)];
    f.backlight({ sunX: 760, sunY: 420, sunRadius: 520, intensity: 0.85 });
    hallBackdropDark(f, ID, cams, { stone: 0.38, dim: 0.12 });

    const flyU = sm((t - b.fly) / 0.95);
    const plateOn = flyU < 0.999;
    // ---------------------------------------------------------------- the hall banner (behind the plate)
    f.layer('L4', (c, env) => banner(c, env, t, b));
    f.rim({ x: 0.2, y: -1 });
    // ---------------------------------------------------------------- the plate (a cut card hung in the hall)
    // a slow sway on its cords (pivot at the beam far above), damped as it is flown out
    const sway = 0.0042 * Math.sin(t * 0.52 + 0.6) + 0.0018 * Math.sin(t * 0.83 + 2.1);
    const SWAY_PIV = { x: PL.x + PL.w / 2, y: -900 };
    if (plateOn) {
      const dy = -900 * flyU * flyU;
      f.layer('L4', (c, env) => {
        c.save();
        c.translate(0, dy);
        c.translate(SWAY_PIV.x, SWAY_PIV.y);
        c.rotate(sway);
        c.translate(-SWAY_PIV.x, -SWAY_PIV.y);
        c.translate(PPIV.x, PPIV.y + PLIFT);
        c.scale(PK, PK);
        c.translate(-PPIV.x, -PPIV.y);
        plateCords(c, PL, env, -1100);
        // its cast shadow on the hazed hall behind: a soft offset card (down-right, away from the windows' key)
        const sh = f.cached(`${ID}/plateShadow/${env.mood.id}/${PL.w}x${PL.h}`, PL.w, PL.h, (cc) => {
          cc.fillStyle = withAlpha(env.mood.fg, 0.85);
          cc.fillRect(0, 0, PL.w, PL.h);
        }, { blur: 10 });
        sh(c, PL.x + 20, PL.y + 22);
        parchmentPlate(c, { ...PL, seed: 1012 }, env);
        platePool(c, PL, 640, 40, { halo: P.halo, ink: P.ink });
        windowRake(c, t);
        // as the plate flies, its contents fade before they reach the top of frame (never clipped by the edge)
        const contentA = 1 - sm((flyU - 0.04) / 0.24);
        if (contentA > 0.003) {
          c.save();
          c.globalAlpha *= contentA;
          plate(c, env, t, b);
          c.restore();
        }
        // the TIME card is the last thing on the plate to go: it reads until 'wall', then fades well inside the frame
        const cardA = 1 - sm((flyU - 0.3) / 0.28);
        if (cardA > 0.003) {
          c.save();
          c.globalAlpha *= cardA;
          sundial(c, t, b);
          c.restore();
        }
        c.restore();
      });
      // the chips' own light (the one accent): eight dies lit together, in the same frame
      const chipK = fireK(t, b) * (0.75 + 0.25 * win(t, b.chips - 0.1, b.chips + 0.5)) * (1 - 0.3 * win(t, b.card0, b.card0 + 0.5));
      if (chipK > 0.01)
        for (let k = 0; k < 8; k++) {
          const p = swayPt(PPIV.x + (slabX(k) - PPIV.x) * PK, PPIV.y + PLIFT + (DIE_Y - PPIV.y) * PK, sway, SWAY_PIV);
          f.practical({ x: p.x, y: p.y + dy, kind: 'screen', seed: 120 + k, intensity: 0.42 * chipK * (1 - sm(flyU / 0.26)), radius: 46 * PK });
        }
    }
    // the wall's knot as a practical: only once the threads have grown and converge there (n ≥ 14)
    const knot = knotK(t, b);
    if (knot > 0.01) f.practical({ x: KNOT.x, y: KNOT.y, kind: 'lamp', seed: 1027, intensity: 0.6 * knot + 0.25 * win(t, b.costEq, b.D), radius: 100 + 60 * knot });
    // the hall's near-black foreground: pew backs along the bottom of frame, from the first frame (the plate is a
    // physical card hung in the hall, seen past the pews)
    pewBacks(f, ID, cams, 1);
  },
});

/** the instant every row-wire, slab and grid band fires (all eight in the SAME frame): 'multiplication' + 0.4 s */
function fireK(t: number, b: B): number {
  return win(t, b.matrix + 0.38, b.matrix + 0.46);
}
function swayPt(x: number, y: number, a: number, piv: { x: number; y: number }): { x: number; y: number } {
  const dx = x - piv.x, dy = y - piv.y;
  return { x: piv.x + dx * Math.cos(a) - dy * Math.sin(a), y: piv.y + dx * Math.sin(a) + dy * Math.cos(a) };
}
/** the hall's window light raking the plate from the top-left: a warm-white wash, two soft mullion-shadowed shafts
 *  drifting slowly, and a falloff toward the bottom-right corner */
function windowRake(c: C, t: number) {
  c.save();
  c.beginPath();
  c.rect(PL.x, PL.y, PL.w, PL.h);
  c.clip();
  const g = c.createLinearGradient(PL.x, PL.y, PL.x + PL.w * 0.8, PL.y + PL.h * 1.1);
  // (critic round 1) a harder rake: lit top-left, darker toward the bottom-right, cooled by the hall
  const shade = mixLab(INK, CY.fg, 0.45);
  // (reviser r1) the paper itself one step down (~15 %): the plate is no longer the brightest value in frame;
  // (critic r1, round 4) a further ~10 %, so the chips' cyan on 'chips' is the brightest value on the plate
  c.fillStyle = withAlpha(mixLab(shade, CY.haze, 0.35), 0.26);
  c.fillRect(PL.x, PL.y, PL.w, PL.h);
  g.addColorStop(0, withAlpha('#fffaf0', 0.2));
  g.addColorStop(0.3, withAlpha('#fffaf0', 0.03));
  g.addColorStop(0.6, withAlpha(shade, 0.14));
  g.addColorStop(1, withAlpha(shade, 0.36));
  c.fillStyle = g;
  c.fillRect(PL.x, PL.y, PL.w, PL.h);
  // (reviser r1) the right third falls into shade: the window's light stops at the jamb
  const sx = PL.x + PL.w * 0.62;
  const sg0 = c.createLinearGradient(sx, 0, PL.x + PL.w, 0);
  sg0.addColorStop(0, withAlpha(shade, 0));
  sg0.addColorStop(0.35, withAlpha(shade, 0.16));
  sg0.addColorStop(1, withAlpha(shade, 0.3));
  c.fillStyle = sg0;
  c.fillRect(sx, PL.y, PL.x + PL.w - sx, PL.h);
  // two shafts of window light falling diagonally across the card (a slow drift as the plate sways)
  const drift = 10 * Math.sin(t * 0.31);
  c.globalCompositeOperation = 'lighter';
  for (const [x0, w, a] of [[PL.x - 60, 150, 0.07], [PL.x + 170, 90, 0.05]] as const) {
    c.save();
    c.translate(x0 + drift, PL.y);
    c.transform(1, 0, 300 / PL.h, 1, 0, 0); // sheared: the shaft falls down and to the right
    const sg = c.createLinearGradient(0, 0, w, 0);
    sg.addColorStop(0, withAlpha('#fff3da', 0));
    sg.addColorStop(0.5, withAlpha('#fff3da', a));
    sg.addColorStop(1, withAlpha('#fff3da', 0));
    c.fillStyle = sg;
    c.fillRect(0, 0, w, PL.h);
    c.restore();
  }
  c.restore();
}

// =====================================================================================================
// THE PLATE
// =====================================================================================================
function plate(c: C, env: PaintEnv, t: number, b: B) {
  const tq = tq12(t);
  // ---- the web group: drawn at WEB_K× about the grid's top centre, shrinking onto the grid as the web collapses
  const shrink = win(t, b.matrix - 0.35, b.matrix + 0.25);
  const k = lerp(WEB_K, 1, shrink);
  const morph = sm((t - b.matrix + 0.1) / 0.45);
  const allLit = win(t, b.once - 0.05, b.once + 0.25);
  const webA = 1 - win(t, b.matrix - 0.1, b.matrix + 0.25);
  c.save();
  c.translate(PIV.x, PIV.y);
  c.scale(k, k);
  c.translate(-PIV.x, -PIV.y);
  // the ruled line the slips hang from
  c.strokeStyle = withAlpha(INK, 0.7);
  c.lineWidth = 1.4 / k;
  c.beginPath();
  c.moveTo(slipX(0) - 30, SLIP_TOP - 12);
  c.lineTo(slipX(NS - 1) + 30, SLIP_TOP - 12);
  c.stroke();
  if (webA > 0.01) {
    for (let i = 0; i < NS; i++)
      for (let j = i + 1; j < NS; j++) {
        const d = j - i;
        const x0 = slipX(i), x1 = slipX(j);
        c.strokeStyle = withAlpha(INK, (0.24 + 0.22 * allLit) * webA);
        c.lineWidth = 1.3 / k;
        c.beginPath();
        c.moveTo(x0, SLIP_BOT + 2);
        c.quadraticCurveTo((x0 + x1) / 2, SLIP_BOT + 2 + webLift(d), x1, SLIP_BOT + 2);
        c.stroke();
      }
    // all at once: every thread lit in the same instant (cyan light over the ink)
    if (allLit > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const flash = 1 + 1.4 * Math.exp(-Math.max(0, t - b.once) * 3);
      for (let i = 0; i < NS; i++)
        for (let j = i + 1; j < NS; j++) {
          const d = j - i;
          const x0 = slipX(i), x1 = slipX(j);
          c.strokeStyle = withAlpha(CY.halo, 0.34 * allLit * webA * flash);
          c.lineWidth = 2.6 / k;
          c.beginPath();
          c.moveTo(x0, SLIP_BOT + 2);
          c.quadraticCurveTo((x0 + x1) / 2, SLIP_BOT + 2 + webLift(d), x1, SLIP_BOT + 2);
          c.stroke();
        }
      c.restore();
    }
  }
  // the slips (scribbled lettering: any sentence), one over each column of the grid
  for (let i = 0; i < NS; i++) {
    const lit = allLit * webA;
    wordSlip(c, { x: slipX(i), y: SLIP_TOP, w: SLIP_W, h: SLIP_BOT - SLIP_TOP, text: '', lit });
    scribble(c, slipX(i), SLIP_TOP + 18, 21, i * 7 + 1, withAlpha(INK, 0.75));
    scribble(c, slipX(i), SLIP_TOP + 31, 15, i * 7 + 2, withAlpha(INK, 0.6));
  }
  // the ghost of the scribe's lamp, one slip at a time (no waiting in line → struck away on 'all')
  ghostLamp(c, env, t, tq, b);
  // grid cells flying in from their threads
  if (morph > 0.001) {
    for (let i = 0; i < NS; i++)
      for (let j = 0; j < NS; j++) {
        const a = Math.min(i, j), z = Math.max(i, j);
        const d = z - a;
        const mid = a === z ? { x: slipX(a), y: SLIP_BOT + 6 } : { x: (slipX(a) + slipX(z)) / 2, y: SLIP_BOT + 2 + webLift(d) / 2 };
        const stag = clamp01(morph * 1.25 - hash1(i * 10 + j, 9) * 0.25);
        const e = sm(stag);
        const x = lerp(mid.x, gx(j), e);
        const y = lerp(mid.y, gy(i), e);
        const s = lerp(4, G.cell - 3, e);
        const w = WGT[i][j] / WMAX;
        c.fillStyle = withAlpha(INK, (0.12 + 0.72 * Math.sqrt(w)) * morph);
        c.fillRect(x - s / 2, y - s / 2, s, s);
      }
    c.strokeStyle = withAlpha(INK, 0.75 * morph);
    c.lineWidth = 1.5;
    c.strokeRect(G.x, G.y, NS * G.cell, GRID_B - G.y);
  }
  c.restore();

  // ---- the eight rows: cut-lines on the cell boundaries, and the row-wires drawn out to their chips (ink) while
  // the grid lands; then at 'multiplication' + 0.4 s every wire, slab band and chip fires in the SAME frame
  const bandU = win(t, b.matrix + 0.1, b.matrix + 0.38);
  const drawU = win(t, b.matrix + 0.12, b.matrix + 0.4);
  const fire = fireK(t, b);
  if (bandU > 0.01) {
    c.strokeStyle = withAlpha(OXBLOOD, 0.85 * bandU);
    c.lineWidth = 1.3;
    c.setLineDash([5, 3]);
    for (let q = 1; q < NS; q++) {
      const y = G.y + q * G.cell;
      c.beginPath();
      c.moveTo(G.x - 8, y);
      c.lineTo(G.x - 8 + (NS * G.cell + 16) * bandU, y);
      c.stroke();
    }
    c.setLineDash([]);
  }
  // ---- (reviser r1) the dies' own light on the paper around the rack: from 'chips' through the hold, eased down
  // as the TIME card comes up (the one accent, motivated by the eight lit dies)
  const spill = win(t, b.chips - 0.1, b.chips + 0.6) * (1 - 0.55 * win(t, b.card0, b.card0 + 1));
  if (spill > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const cx = (RACK.x0 + RACK.x1) / 2, cy = DIE_Y;
    const sg = c.createRadialGradient(cx, cy, 40, cx, cy, 330);
    sg.addColorStop(0, withAlpha(CY.halo, 0.2 * spill));
    sg.addColorStop(0.5, withAlpha(CY.halo, 0.08 * spill));
    sg.addColorStop(1, withAlpha(CY.halo, 0));
    c.fillStyle = sg;
    c.fillRect(cx - 340, cy - 300, 680, 600);
    c.restore();
  }
  // ---- the rack of eight slabs → eight graphics chips
  rack(c, env, t, b, fire);
  if (drawU > 0.001) {
    // one shared pulse for all eight (never a travelling front: no queue)
    const flash = fire * (1 + 1.2 * Math.exp(-Math.max(0, t - b.matrix - 0.42) * 4));
    const pulse = fire * (0.82 + 0.18 * Math.sin((t - b.matrix) * 3.1));
    c.save();
    c.lineJoin = 'round';
    for (let r = 0; r < NS; r++) {
      const w = WIRES[r];
      wirePath(c, w, drawU);
      c.strokeStyle = withAlpha(mixLab(CY.halo, INK, 0.55), 0.9);
      c.lineWidth = 2.2;
      c.stroke();
      if (fire > 0.01) {
        c.globalCompositeOperation = 'lighter';
        c.strokeStyle = withAlpha(CY.halo, 0.36 * pulse * Math.min(1.8, flash / Math.max(fire, 1e-3)));
        c.lineWidth = 4.4;
        c.stroke();
        c.strokeStyle = withAlpha(CY.core, 0.5 * pulse);
        c.lineWidth = 1.4;
        c.stroke();
        c.globalCompositeOperation = 'source-over';
      }
      // where it enters the chip: a small socket on the bracket
      if (drawU > 0.98) {
        const e = w.pts[w.pts.length - 1];
        c.fillStyle = INK;
        c.fillRect(e.x - 4, e.y - 2, 8, 5);
      }
      // the row's band on the grid, lit by the same pulse
      if (fire > 0.01) {
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = withAlpha(CY.halo, 0.16 * pulse);
        c.fillRect(G.x, G.y + r * G.cell + 1.5, NS * G.cell, G.cell - 3);
        c.globalCompositeOperation = 'source-over';
      }
    }
    c.restore();
  }

  // ---- the pause: ONE fact, on the TIME card (drawn by the caller, so it can outlast the plate's other contents)
}

/** ink() with its size raised to the legibility floor under the current transform (camera + layer scale) */
function rink(c: C, text: string, x: number, y: number, o: InkOpts & { size: number }): number {
  const fam = { text: FONT.text, sc: FONT.sc, mono: FONT.mono, display: FONT.display, type: FONT.typewriter }[o.font ?? 'text'];
  const size = legibleSize(c, `${o.italic ? 'italic ' : ''}${o.weight ?? 500} ${o.size}px ${fam}`, o.size, text);
  return ink(c, text, x, y, { ...o, size });
}

function scribble(c: C, x: number, y: number, w: number, seed: number, col: string) {
  c.strokeStyle = col;
  c.lineWidth = 1.1;
  c.beginPath();
  const n = 7;
  for (let k = 0; k <= n; k++) {
    const px = x - w / 2 + (w * k) / n;
    const py = y + (hash1(seed, k) - 0.5) * 4;
    if (k === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.stroke();
}

function ghostLamp(c: C, env: PaintEnv, t: number, tq: number, b: B) {
  const t0 = b.noWait - 0.1;
  const hop = 0.36;
  const end = b.once;
  const a = win(t, t0 - 0.2, t0 + 0.1) * (1 - win(t, end - 0.05, end + 0.3));
  if (a <= 0.01) return;
  const u = Math.max(0, (tq - t0) / hop);
  const k = Math.min(NS - 1, Math.floor(u));
  const fr = u - Math.floor(u);
  const x = lerp(slipX(k), slipX(Math.min(NS - 1, k + 1)), sm(clamp01((fr - 0.55) / 0.45)));
  // (critic round 4) the lamp drawn twice as large (×3) and its ticks 1.5×, so the queue reads on the full plate
  const y = SLIP_TOP - 54 - 12 * Math.sin(Math.PI * sm(clamp01((fr - 0.55) / 0.45)));
  // the slips it has already read, ticked
  for (let i = 0; i < k; i++) {
    const tx = slipX(i), ty = SLIP_TOP - 22;
    c.strokeStyle = withAlpha(INK, 0.7 * a);
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(tx - 7.5, ty);
    c.lineTo(tx - 1.5, ty + 6);
    c.lineTo(tx + 9, ty - 7.5);
    c.stroke();
  }
  c.save();
  c.translate(x, y);
  c.scale(3, 3);
  c.translate(-x, -y);
  c.save();
  c.globalAlpha *= a * 0.85;
  c.fillStyle = INK;
  c.beginPath();
  c.ellipse(x, y + 8, 9, 4.5, 0, 0, Math.PI * 2);
  c.fill();
  c.fillRect(x - 2, y + 2, 4, 5);
  c.lineWidth = 1.6;
  c.strokeStyle = INK;
  c.beginPath();
  c.arc(x + 11, y + 8, 4, 0, Math.PI * 2);
  c.stroke();
  c.restore();
  glow(c, x, y - 1, 16, CY.core, 0.6 * a);
  // (×3 about the lamp: the glow above is in the scaled frame too)
  c.fillStyle = withAlpha(mixLab(CY.core, '#ffffff', 0.3), a);
  c.beginPath();
  c.moveTo(x, y - 8);
  c.quadraticCurveTo(x + 3, y - 1, x, y + 1);
  c.quadraticCurveTo(x - 3, y - 1, x, y - 8);
  c.fill();
  c.restore();
  void env;
}

function rack(c: C, env: PaintEnv, t: number, b: B, lightK: number) {
  const chipU = win(t, b.chips - 0.15, b.chips + 0.45);
  c.fillStyle = INK;
  c.fillRect(RACK.x0, RACK.y0, 14, RACK.y1 - RACK.y0);
  c.fillRect(RACK.x1 - 14, RACK.y0, 14, RACK.y1 - RACK.y0);
  c.fillRect(RACK.x0, RACK.y0, RACK.x1 - RACK.x0, 16);
  c.fillRect(RACK.x0, RACK.y1 - 22, RACK.x1 - RACK.x0, 22);
  c.fillRect(RACK.x0 + 8, RACK.y1, 20, 10);
  c.fillRect(RACK.x1 - 28, RACK.y1, 20, 10);
  // vents on the top rail, kept inside the rack's frame
  c.fillStyle = withAlpha(P.haze, 0.55);
  const v0 = RACK.x0 + 26, v1 = RACK.x1 - 26;
  const nv = Math.floor((v1 - v0 - 7) / 14.6) + 1;
  const vOff = (v1 - v0 - ((nv - 1) * 14.6 + 7)) / 2;
  for (let k = 0; k < nv; k++) c.fillRect(v0 + vOff + k * 14.6, RACK.y0 + 5, 7, 6);
  for (let k = 0; k < 8; k++) {
    const x = slabX(k);
    const x0 = x - SLAB.w / 2;
    const h = SLAB.y1 - SLAB.y0;
    const row = NS - 1 - k;
    c.fillStyle = SLAB_FILL;
    c.fillRect(x0, SLAB.y0, SLAB.w, h);
    c.fillStyle = withAlpha(P.haze, 0.35);
    c.fillRect(x0, SLAB.y0, 1.2, h);
    if (lightK > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = withAlpha(CY.core, (0.55 + 0.35 * Math.exp(-Math.max(0, t - b.matrix - 0.42) * 4)) * lightK * (1 - 0.5 * chipU));
      c.fillRect(x - 1.5, SLAB.y0 + 10, 3, h - 20);
      c.restore();
    }
    if (chipU > 0.01) {
      c.save();
      c.globalAlpha *= chipU;
      c.fillStyle = INK;
      c.fillRect(x0 + 4, SLAB.y0 - 10, SLAB.w - 8, 10);
      const fy = SLAB.y0 + 42;
      const fr = 14;
      c.fillStyle = withAlpha(mixLab(CY.halo, P.haze, 0.3), 0.85 * Math.max(0.3, lightK));
      c.beginPath();
      c.arc(x, fy, fr, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = SLAB_FILL;
      const rot = (t * 1.8 + k * 0.7) % (Math.PI * 2);
      for (let q = 0; q < 5; q++) {
        const a0 = rot + (q * Math.PI * 2) / 5;
        c.beginPath();
        c.moveTo(x, fy);
        c.arc(x, fy, fr - 1, a0, a0 + 0.62);
        c.closePath();
        c.fill();
      }
      c.beginPath();
      c.arc(x, fy, 4.5, 0, Math.PI * 2);
      c.fill();
      // the die: its row of the grid glowing in it (two lines of four cells)
      const dy = DIE_Y;
      const ds = 26;
      c.fillStyle = withAlpha(mixLab(CY.halo, P.haze, 0.25), 0.9);
      c.fillRect(x - ds / 2, dy - ds / 2, ds, ds);
      const cw = ds / 4;
      for (let r = 0; r < 2; r++)
        for (let q = 0; q < 4; q++) {
          const w = WGT[row][r * 4 + q] / WMAX;
          c.fillStyle = withAlpha(INK, 0.15 + 0.6 * Math.sqrt(w));
          c.fillRect(x - ds / 2 + q * cw + 0.6, dy - cw + r * cw + 0.6, cw - 1.2, cw - 1.2);
        }
      c.strokeStyle = INK;
      c.lineWidth = 1.4;
      c.strokeRect(x - ds / 2, dy - ds / 2, ds, ds);
      c.fillStyle = withAlpha(P.haze, 0.5);
      for (const [ox, oy] of [[-14, -21], [8, -21], [-14, 17], [8, 17]]) c.fillRect(x + ox, dy + oy, 6, 4);
      c.fillStyle = mixLab(P.halo, '#c9a24a', 0.5);
      for (let q = 0; q < 5; q++) c.fillRect(x0 + 4.5 + q * 5.9, SLAB.y1 - 9, 3.4, 9);
      c.restore();
    }
  }
  void env;
}

/** the TIME card: one small pinned card (lift shadow, two pins) holding a paper sundial whose cast shadow sweeps half a
 *  day, with "12 hours" and "one machine, 8 GPUs" inked beside it: one fact, one card */
function sundial(c: C, t: number, b: B) {
  // cards carry their text: "12 hours" inks as the paper passes 30 % (type kit cardPaperAlpha / cardInkAlpha)
  const h0 = b.card0 + 0.18;
  const a = cardPaperAlpha(t, h0, 0.3);
  if (a <= 0.01) return;
  const { x, y, rx, ry } = DIAL;
  const rim = (th: number, k = 1) => ({ x: x + Math.cos(th) * rx * k, y: y + Math.sin(th) * ry * k });
  c.save();
  c.globalAlpha *= a;
  c.translate(0, (1 - a) * 10);
  // the card
  const K = TCARD;
  c.fillStyle = withAlpha(INK, 0.22);
  c.fillRect(K.x + 5, K.y + 7, K.w, K.h);
  c.fillStyle = mixLab(P.sky[1], '#fff6e0', 0.38);
  c.fillRect(K.x, K.y, K.w, K.h);
  c.strokeStyle = withAlpha(INK, 0.45);
  c.lineWidth = 1;
  c.strokeRect(K.x + 6, K.y + 6, K.w - 12, K.h - 12);
  c.fillStyle = OXBLOOD;
  for (const px of [K.x + 18, K.x + K.w - 18]) {
    c.beginPath();
    c.arc(px, K.y + 12, 3, 0, Math.PI * 2);
    c.fill();
  }
  // the disc's thickness (a darker card edge) and a soft contact shadow
  c.fillStyle = withAlpha(INK, 0.16);
  c.beginPath();
  c.ellipse(x + 5, y + 9, rx + 3, ry + 3, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(INK, P.sky[1], 0.35);
  c.beginPath();
  c.ellipse(x, y + 5, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
  // the face
  c.fillStyle = mixLab(P.sky[1], '#fff6e0', 0.6);
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = INK;
  c.lineWidth = 1.5;
  c.stroke();
  // an inner chapter ring and the hour lines across the far half of the dial (dawn → dusk)
  c.strokeStyle = withAlpha(INK, 0.45);
  c.lineWidth = 1;
  c.beginPath();
  c.ellipse(x, y, rx * 0.8, ry * 0.8, 0, Math.PI, Math.PI * 2);
  c.stroke();
  for (let h = 0; h <= 12; h++) {
    const th = Math.PI + (h / 12) * Math.PI;
    const p0 = rim(th, h % 3 === 0 ? 0.62 : 0.8);
    const p1 = rim(th, 0.95);
    c.lineWidth = h % 6 === 0 ? 1.5 : 0.9;
    c.beginPath();
    c.moveTo(p0.x, p0.y);
    c.lineTo(p1.x, p1.y);
    c.stroke();
  }
  // the CAST shadow of the gnomon sweeps 180° (half a day)
  const u = sm(clamp01((t - b.sweep0) / (b.sweep1 - b.sweep0)));
  const th = Math.PI + u * Math.PI;
  if (u > 0.01) {
    c.fillStyle = withAlpha(INK, 0.1);
    c.beginPath();
    c.moveTo(x, y);
    c.ellipse(x, y, rx * 0.78, ry * 0.78, 0, Math.PI, th);
    c.closePath();
    c.fill();
  }
  const tip = rim(th, 0.94);
  const nx = -Math.sin(th) * ry, ny = Math.cos(th) * rx;
  const nl = Math.hypot(nx, ny) || 1;
  const hw = 4.5;
  c.fillStyle = withAlpha(INK, 0.62);
  c.beginPath();
  c.moveTo(x + (nx / nl) * hw, y + (ny / nl) * hw * 0.4);
  c.lineTo(tip.x, tip.y);
  c.lineTo(x - (nx / nl) * hw, y - (ny / nl) * hw * 0.4);
  c.closePath();
  c.fill();
  // the gnomon: a triangular card on the noon line
  const back = rim(Math.PI * 1.5 + 0.5, 0.8);
  const top = { x: back.x, y: back.y - 30 };
  c.fillStyle = INK;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(back.x + 1.5, back.y);
  c.lineTo(top.x + 1.5, top.y);
  c.lineTo(top.x - 1.5, top.y);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(P.halo, 0.65);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(top.x - 1.5, top.y);
  c.stroke();
  // the fact, on the same card: "12 hours" inks with the paper (the shadow then sweeps those twelve hours), then
  // what it ran on as the sweep finishes; both lines at the 22 px cap floor or larger (rink)
  const tx = x + rx + 26;
  const hA = cardInkAlpha(t, h0, 0.16);
  rink(c, '12 hours', tx, K.y + 56, { size: 46, italic: true, weight: 600, align: 'left', alpha: hA });
  const g0 = b.gpus;
  const gA = win(t, g0 - 0.05, g0 + 0.1);
  rink(c, 'one machine, 8 GPUs', tx, K.y + 104, { size: 32, italic: true, align: 'left', draw: clamp01((t - g0) / 0.45), alpha: gA });
  cardProbe(c, 'timeCard', K.x, K.y, K.w, K.h, a, Math.max(hA, gA * 0.5));
  c.restore();
}

// =====================================================================================================
// THE HALL: the sentence's banner grows; the wall of light
// =====================================================================================================
function slipsAt(t: number, b: B): number {
  if (t < b.wall) return 10;
  return Math.min(20, 10 + Math.floor((tq12(t) - b.wall) / b.pace) + 1);
}
/** the knot (where the long threads converge) exists only once the sentence has grown: 0 until n ≥ 14 */
function knotK(t: number, b: B): number {
  if (t < b.wall) return 0;
  const nC = Math.min(20, 10 + (t - b.wall) / b.pace + 1);
  return sm(clamp01((nC - 14) / 4));
}
function banner(c: C, env: PaintEnv, t: number, b: B) {
  if (t < b.fly - 0.2) return;
  const tq = tq12(t);
  const m = env.mood;
  const n = slipsAt(t, b);
  const arrive = (i: number) => (i < 10 ? 1 : sm(clamp01((tq - (b.wall + (i - 10) * b.pace)) / 0.22)));
  const lastX = bx(n - 1);
  // ---- the beam: a dark rail growing with the sentence
  const beamL = bx(0) - 70;
  const beamR = lastX + 60;
  c.fillStyle = env.fill('ink');
  c.fillRect(beamL, BEAM_Y - 14, beamR - beamL, 28);
  c.fillStyle = withAlpha(m.rim, 0.35);
  c.fillRect(beamL, BEAM_Y - 14, beamR - beamL, 1.2);
  for (const x of [bx(0) - 40, beamR - 30]) c.fillRect(x - 1, BEAM_Y - 600, 2, 586);
  // ---- the threads between every pair: they thicken AND brighten with n² (a lattice at 10, a sheet at 20)
  const grow = clamp01((n * n - 100) / 300);
  const lw = 1.0 + 2.0 * grow;
  const al = 0.11 + 0.39 * grow;
  // the central threads (short-to-mid spans crossing the middle) close into a sheet: 1.5× density and alpha
  const midX = (bx(0) + bx(n - 1)) / 2;
  const on = win(t, b.fly + 0.3, b.fly + 0.9);
  c.save();
  c.globalCompositeOperation = 'lighter';
  if (grow > 0.01) {
    const x0 = bx(0), x1 = bx(n - 1);
    const lift = arcLift(n - 1);
    const g = c.createLinearGradient(0, HSLIP_BOT, 0, HSLIP_BOT + lift / 2);
    g.addColorStop(0, withAlpha(m.halo, 0.42 * grow * on));
    g.addColorStop(1, withAlpha(m.halo, 0.16 * grow * on));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x0, HSLIP_BOT);
    c.quadraticCurveTo((x0 + x1) / 2, HSLIP_BOT + lift, x1, HSLIP_BOT);
    c.closePath();
    c.fill();
    // the middle closes into a near-solid sheet: a second, central fill under the bowl's crossing threads
    const sheet = c.createRadialGradient(midX, HSLIP_BOT + lift * 0.3, 10, midX, HSLIP_BOT + lift * 0.3, (x1 - x0) * 0.42);
    sheet.addColorStop(0, withAlpha(m.halo, 0.42 * grow * grow * on));
    sheet.addColorStop(0.6, withAlpha(m.halo, 0.2 * grow * grow * on));
    sheet.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = sheet;
    c.beginPath();
    c.moveTo(x0, HSLIP_BOT);
    c.quadraticCurveTo((x0 + x1) / 2, HSLIP_BOT + lift, x1, HSLIP_BOT);
    c.closePath();
    c.fill();
  }
  for (let i = 0; i < n; i++) {
    const ai = arrive(i);
    for (let j = i + 1; j < n; j++) {
      const aj = arrive(j);
      const d = j - i;
      const x0 = bx(i), x1 = bx(j);
      const yj = HSLIP_BOT - (1 - aj) * 120;
      // threads whose midpoint lies near the middle of the banner are the central weave: 1.5× when grown
      const central = 1 + 0.5 * grow * Math.max(0, 1 - Math.abs((x0 + x1) / 2 - midX) / (BP * 5));
      c.strokeStyle = withAlpha(mixLab(m.halo, m.core, 0.25), Math.min(0.95, al * central) * on * Math.min(ai, aj));
      c.lineWidth = lw * (0.6 + 0.4 * central);
      c.beginPath();
      c.moveTo(x0, HSLIP_BOT);
      c.quadraticCurveTo((x0 + x1) / 2, HSLIP_BOT + arcLift(d), x1, yj);
      c.stroke();
    }
  }
  // the knot: where the long threads cross (only once they have grown there)
  const kk = knotK(t, b);
  glow(c, KNOT.x, KNOT.y, 120 + 120 * grow, m.halo, 0.26 * on * kk);
  glow(c, KNOT.x, KNOT.y, 34 + 20 * grow, m.core, 0.42 * on * kk + 0.25 * win(t, b.costEq, b.D));
  c.restore();
  // ---- (reviser r1) the ten-word web's outline, drawn OVER the grown threads as one full solid arc from the first
  // slip to the tenth (a dark keyline under warm paper, so it reads against the light), held until 'looking'
  const ghost = win(t, b.wall - 0.1, b.wall + 0.3) * (1 - win(t, b.looking, b.looking + 0.45)) * on;
  if (ghost > 0.01) {
    const x0 = bx(0), x1 = bx(9);
    c.save();
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x0, HSLIP_BOT);
    c.quadraticCurveTo((x0 + x1) / 2, HSLIP_BOT + arcLift(9), x1, HSLIP_BOT);
    c.strokeStyle = withAlpha(env.fill('ink'), 0.5 * ghost);
    c.lineWidth = 5;
    c.stroke();
    c.strokeStyle = withAlpha(SLIP_PAPER_GHOST, 0.6 * ghost);
    c.lineWidth = 2.4;
    c.stroke();
    c.restore();
  }
  // ---- the slips, each with its word (the hall's sentence, as in ch10-s04 / s10)
  for (let i = 0; i < n; i++) {
    const a = arrive(i);
    const y = HSLIP_TOP - (1 - a) * 120;
    c.save();
    c.globalAlpha *= Math.min(1, a * 1.6);
    wordSlip(c, { x: bx(i), y, w: 50, h: HSLIP_H, text: '', lit: 0.25 + 0.5 * grow, cord: HSLIP_TOP - BEAM_Y - 22 });
    const word = HALL_WORDS[i % HALL_WORDS.length];
    c.font = `600 15px ${FONT.text}`;
    const fs = Math.min(15, (15 * 42) / Math.max(1, c.measureText(word).width));
    c.font = `600 ${fs.toFixed(1)}px ${FONT.text}`;
    c.fillStyle = INK;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillText(word, bx(i), y + HSLIP_H * 0.56);
    c.restore();
  }
  // ---- the counter on the beam, centred over the slips; the cost law as its own larger serif mark beside it
  const col = mixLab(m.core, '#ffffff', 0.2);
  const label = `${n} words · ${n * n} pairs`;
  const sCount = legibleSize(c, `500 22px ${FONT.mono}`, 22, label);
  const EQ = 'cost ∝ n²';
  const sCost = legibleSize(c, `italic 600 ${Math.round(sCount * 1.6)}px ${FONT.text}`, Math.round(sCount * 1.6), EQ);
  const wCount = measure(c, label, sCount, 'mono', 500);
  const wCost = ink(c, EQ, 0, 0, { size: sCost, font: 'text', italic: true, weight: 600, alpha: 0 });
  const gap = 40;
  const mid = (bx(0) + bx(n - 1)) / 2;
  const left = mid - (wCount + gap + wCost) / 2;
  ink(c, label, left, BEAM_Y + 8, { size: sCount, font: 'mono', color: col, alpha: on });
  // (critic round 4) the starting count, frozen as growth starts: a dimmed '10 words · 100 pairs' on a slate tag hung
  // above the beam's left end, over the ten-word ghost arc's first slips, held until 'looking'. On 'four' the beam
  // reads 10 · 100 beside 20 · 400.
  const refA = win(t, b.wall - 0.1, b.wall + 0.3) * (1 - win(t, b.looking, b.looking + 0.45)) * on;
  if (refA > 0.01) {
    const REF = '10 words · 100 pairs';
    const wRef = measure(c, REF, sCount, 'mono', 500);
    const rx = bx(0) - 46, ry = BEAM_Y - 26;
    c.save();
    c.globalAlpha *= refA;
    c.fillStyle = withAlpha(env.fill('ink'), 0.9);
    c.beginPath();
    c.roundRect(rx - 12, ry - sCount * 1.02, wRef + 24, sCount * 1.42, 4);
    c.fill();
    c.strokeStyle = withAlpha(m.rim, 0.3);
    c.lineWidth = 1;
    c.stroke();
    c.restore();
    ink(c, REF, rx, ry, { size: sCount, font: 'mono', color: col, alpha: 0.6 * refA });
  }
  // inks on 'looking' and is complete by costEq + 0.6 (≈ 16.9 s), then holds to the cut
  const eq = clamp01((t - b.looking + 0.05) / Math.max(0.4, b.costEq + 0.6 - b.looking));
  if (eq > 0) {
    const ex = left + wCount + gap;
    // a dark slate tag hung from the beam behind the mark (legible over the bright windows)
    c.save();
    c.globalAlpha *= win(t, b.looking - 0.15, b.looking + 0.1);
    c.fillStyle = withAlpha(env.fill('ink'), 0.92);
    const padX = 14, top = BEAM_Y - sCost * 0.95, h = sCost * 1.45;
    c.beginPath();
    c.roundRect(ex - padX, top, wCost + padX * 2, h, 4);
    c.fill();
    c.strokeStyle = withAlpha(m.rim, 0.35);
    c.lineWidth = 1;
    c.stroke();
    c.restore();
    ink(c, EQ, ex, BEAM_Y + sCost * 0.32, { size: sCost, font: 'text', italic: true, weight: 600, color: mixLab(m.core, '#ffffff', 0.35), draw: eq });
  }
}

const SLIP_PAPER_GHOST = '#f3ead2';
function measure(c: C, text: string, size: number, font: 'mono', weight: number): number {
  return ink(c, text, 0, 0, { size, font, weight, alpha: 0 });
}
