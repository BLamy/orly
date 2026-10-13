/**
 * ch04-s01 — the XOR plate, staged for "The Cold Case" (a shot-specific variant of the kit's xorPlate, every
 * mark still bound to the real trained XOR_221 network of metaphors/mlp).
 *
 *   xorCase(c, state, env)   paints the parchment plate and its diagram (layer px = stage px, camera locked)
 *
 * What it shows (state channels, all 0..1 unless noted):
 *   chip / chipLit / chipBoth   the truth-table chip (top right): rows type in; 01 and 10 light; 11 stays dark
 *   reveal                      axes, then the four lanterns at the corners of the square (two lit, opposite)
 *   diag                        a dotted line joining the two lit, opposite corners
 *   sweep (u) / sweepA          ONE straight scissor cut sweeping through many angles and positions; the side it
 *                               calls "lit" washes faintly; a ring marks every lantern on the wrong side, counted
 *                               for real (best labelling, never fewer than 1): 1, 2, 1, 2, 1 over the sweep
 *   solve                       the two hidden units' own cut lines (w·x + b = 0) and the net's lit band (ŷ > ½)
 *   fold                        the SLIDE into hidden space: with both cuts still on the paper, each lantern travels
 *                               a short dotted path to its true hidden coordinates (ease.move) — the two lit
 *                               lanterns land on one point (the trained hidden layer maps both to h ≈ (0.98, 0.05))
 *   settle                      then the axis labels swap x₁/x₂ → h₁/h₂ (0.3 s crossfade, never both at once)
 *   outCut                      the output unit's ONE straight cut (from W¹, b¹) separates lit from dark
 *   crease / cellPulse          the in-between row of cells (lamp-lit beads on a faint crease), pulsed once
 *   paths                       the dotted slide paths;  axesEarly: the empty axes inked on 'puzzle'
 *   counterA                    the margin counter: "on the wrong side:" n
 *   lift                        the scissors lift off the plate and hang still above it
 *   labelXor, labelAmari        the two typeset labels
 */
import type { PaintEnv } from '../../../film/contracts';
import { makeEnv, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { MFONT, PARCH, glow, label, paperLantern, parchmentPlate } from '../../../film/silhouette/metaphors/kit';
import { XOR_221, XOR_DATA, forward, netAt } from '../../../film/silhouette/metaphors/mlp';
import { ease } from '../../../core';
import { clamp01, sm } from './ch04-s01-kit';

// ------------------------------------------------------------------------------------------------ layout
export const PLATE = { x: 150, y: 38, w: 980, h: 574 };
const LO = -0.32;
const HI = 1.32;
const S = 446;
const PX = 272;
const PY = 96;
export const X = (v: number) => PX + ((v - LO) / (HI - LO)) * S;
export const Y = (v: number) => PY + S - ((v - LO) / (HI - LO)) * S;
const CHIP = { x: 935, y: 205, w: 250, h: 196 };
const COUNTER = { x: 935, y: 410 };
const LANTERN_R = 27;

// ------------------------------------------------------------------------------------------------ the net
const NET = netAt(XOR_221, XOR_221.epochs);
const HID = XOR_DATA.map((p) => forward(NET, p.x).a[1]);
const OUT_W = NET.W[1][0];
const OUT_B = NET.b[1][0];

/** the single cut's keyframes: [normal angle (deg), offset from the centre's projection]. Searched so the
 *  real wrong-side count runs 1, 2, 1, 2, 1 with no blips, sweeping 220° of angle and many positions. */
const SWEEP_KEYS: [number, number][] = [
  [135, 0.36],
  [160, 0.15],
  [190, 0.45],
  [265, 0.15],
  [355, 0.5],
];
export function singleCut(u: number) {
  const s = clamp01(u) * (SWEEP_KEYS.length - 1);
  const i = Math.min(SWEEP_KEYS.length - 2, Math.floor(s));
  const f = sm(s - i);
  const phi = ((SWEEP_KEYS[i][0] + (SWEEP_KEYS[i + 1][0] - SWEEP_KEYS[i][0]) * f) * Math.PI) / 180;
  const off = SWEEP_KEYS[i][1] + (SWEEP_KEYS[i + 1][1] - SWEEP_KEYS[i][1]) * f;
  const nx = Math.cos(phi);
  const ny = Math.sin(phi);
  const d = nx * 0.5 + ny * 0.5 + off;
  let a = 0;
  let b = 0;
  for (const p of XOR_DATA) {
    const side = nx * p.x[0] + ny * p.x[1] - d > 0;
    if (side === (p.y[0] === 1)) a++;
    else b++;
  }
  const flip = a < b; // the better of the two labellings
  const wrong = XOR_DATA.map((p) => {
    const side = nx * p.x[0] + ny * p.x[1] - d > 0;
    return flip ? side === (p.y[0] === 1) : side !== (p.y[0] === 1);
  });
  return { nx, ny, d, litSign: flip ? -1 : 1, wrong, nWrong: wrong.filter(Boolean).length };
}

// ------------------------------------------------------------------------------------------------ geometry
function clipLine(nx: number, ny: number, d: number): [number, number, number, number] | null {
  // endpoints of nx·x + ny·y = d inside the plot square, ordered along t = (-ny, nx)
  const pts: [number, number][] = [];
  const add = (x: number, y: number) => {
    if (x >= LO - 1e-9 && x <= HI + 1e-9 && y >= LO - 1e-9 && y <= HI + 1e-9) pts.push([x, y]);
  };
  if (Math.abs(ny) > 1e-9) {
    add(LO, (d - nx * LO) / ny);
    add(HI, (d - nx * HI) / ny);
  }
  if (Math.abs(nx) > 1e-9) {
    add((d - ny * LO) / nx, LO);
    add((d - ny * HI) / nx, HI);
  }
  if (pts.length < 2) return null;
  const tp = (p: [number, number]) => -ny * p[0] + nx * p[1];
  pts.sort((p, q) => tp(p) - tp(q));
  const a = pts[0];
  const b = pts[pts.length - 1];
  return [a[0], a[1], b[0], b[1]];
}

const scissorPaths = new Map<number, Path2D>();
/** tailor's shears pointing +x, pivot at the origin (fill nonzero; the bows are holes); `open` widens the
 *  blades (radians per blade beyond the resting 0.11) */
function scissors(open = 0): Path2D {
  const key = Math.round(open * 200);
  const hit = scissorPaths.get(key);
  if (hit) return hit;
  const p = new Path2D();
  const rot = (x: number, y: number, a: number): [number, number] => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
  for (const s of [-1, 1]) {
    const a = s * (0.11 + key / 200);
    const blade: [number, number][] = [
      [-1, s * 2.6],
      [10, s * 3.2],
      [24, s * 2.0],
      [33, s * 0.25],
      [20, s * -0.2],
      [0, s * -0.6],
    ];
    blade.forEach(([x, y], i) => {
      const [rx, ry] = rot(x, y, a);
      if (i === 0) p.moveTo(rx, ry);
      else p.lineTo(rx, ry);
    });
    p.closePath();
    const shank: [number, number][] = [
      [1, s * -0.6],
      [-7, s * 3.2],
      [-10, s * 6.5],
      [-8, s * 7.4],
      [-4, s * 4.6],
      [1, s * 2.6],
    ];
    shank.forEach(([x, y], i) => {
      const [rx, ry] = rot(x, y, -a * 0.6);
      if (i === 0) p.moveTo(rx, ry);
      else p.lineTo(rx, ry);
    });
    p.closePath();
    const [bx, by] = rot(-15, s * 10, -a * 0.6);
    p.moveTo(bx + 8, by);
    p.ellipse(bx, by, 8, 5.6, s * 0.35, 0, Math.PI * 2);
    p.moveTo(bx + 5.6, by);
    p.ellipse(bx, by, 5.4, 3.2, s * 0.35, 0, Math.PI * 2, true);
  }
  scissorPaths.set(key, p);
  return p;
}

// decision regions (network output over the plot), baked once per space
const REGION = new Map<string, HTMLCanvasElement>();
function region(space: 'input' | 'hidden'): HTMLCanvasElement {
  const hit = REGION.get(space);
  if (hit) return hit;
  const N = 128;
  const cv = document.createElement('canvas');
  cv.width = N;
  cv.height = N;
  const g = cv.getContext('2d')!;
  const img = g.createImageData(N, N);
  const hc = [0xf2, 0xc4, 0x6e];
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const x = LO + ((i + 0.5) / N) * (HI - LO);
      const y = HI - ((j + 0.5) / N) * (HI - LO);
      const yh = space === 'input' ? forward(NET, [x, y]).a[2][0] : 1 / (1 + Math.exp(-(OUT_W[0] * x + OUT_W[1] * y + OUT_B)));
      const k = (j * N + i) * 4;
      const v = sm((yh - 0.35) / 0.3);
      img.data[k] = hc[0];
      img.data[k + 1] = hc[1];
      img.data[k + 2] = hc[2];
      img.data[k + 3] = Math.round(v * 150);
    }
  g.putImageData(img, 0, 0);
  REGION.set(space, cv);
  return cv;
}

// ------------------------------------------------------------------------------------------------ state
export interface XorCaseState {
  /** the empty truth-table slip (frame only) pasted in on 'puzzle', before its rows type in */
  chipFrame: number;
  chip: number;
  /** 0 = presented large at the plate's centre, 1 = tucked into its corner */
  chipMove: number;
  chipLit: number;
  chipBoth: number;
  reveal: number;
  diag: number;
  sweep: number;
  sweepA: number;
  solve: number;
  /** the slide of every lantern to its hidden-space position (0..1, raw; eased with ease.move) */
  fold: number;
  /** the axis-label swap x₁/x₂ → h₁/h₂ (0..1 over 0.3 s; the two sets never show together) */
  settle: number;
  outCut: number;
  crease: number;
  /** a one-shot pulse 0..1 on the hidden cells ('between') */
  cellPulse: number;
  /** the dotted slide paths, data → hidden (alpha) */
  paths: number;
  /** the empty axes, inked on 'puzzle' before any lantern (alpha) */
  axesEarly: number;
  counterA: number;
  /** count shown after the sweep (0 once the net's cuts are in) */
  solvedCount: number;
  lift: number;
  labelXor: number;
  labelAmari: number;
  /** a tiny counter "tick" bump 0..1 (the numeral just changed) */
  tick: number;
}

const PENV = makeEnv({ mood: 'parchment' });
const ink = PARCH.ink;
/** the two corner labels: full ink at weight 500, so they hold their value after bloom at the plate's dim floor */
const LABEL_INK = mixLab(PARCH.ink, '#000000', 0.15);

/** unlit lanterns ~25% darker than the kit's default paper, so lit vs dark reads at a glance */
const PENV_DARK: PaintEnv = { ...PENV, fill: (role) => (role === 'set' ? mixLab(PENV.fill('set'), PARCH.ink, 0.3) : PENV.fill(role)) };
/** the lit lanterns: halo radius doubled (0.55 → 1.1) and its alpha ×1.5 (flare 0.85) */
const LIT_HALO = 1.1;
const LIT_FLARE = 0.85;
function lantern(c: CanvasRenderingContext2D, x: number, y: number, r: number, on: boolean, alpha: number, penv: PaintEnv) {
  if (on) paperLantern(c, { x, y, r, act: 1, flare: LIT_FLARE, alpha, halo: LIT_HALO }, penv);
  else paperLantern(c, { x, y, r, act: 0, alpha, halo: 0.4 }, { ...PENV_DARK, t: penv.t, tq: penv.tq, frame: penv.frame, pxScale: penv.pxScale });
}

/** where a lantern sits (data space) at slide u: a straight move from its input corner to its true hidden
 *  coordinates (the trained hidden layer maps the two lit cases to the same place, h ≈ (0.98, 0.05)) */
function lanternPos(i: number, u: number): [number, number] {
  const p = XOR_DATA[i].x;
  const h = HID[i];
  return [p[0] + (h[0] - p[0]) * u, p[1] + (h[1] - p[1]) * u];
}

export function xorCase(c: CanvasRenderingContext2D, o: XorCaseState, env: PaintEnv) {
  const penv: PaintEnv = { ...PENV, t: env.t, tq: env.tq, frame: env.frame, pxScale: env.pxScale };
  parchmentPlate(c, { x: PLATE.x, y: PLATE.y, w: PLATE.w, h: PLATE.h, seed: 41 }, env);
  plateFalloff(c, env);
  // the slide into hidden space: each lantern travels its own short dotted path (ease.move)
  const slide = ease.move(clamp01(o.fold));

  // ---------------------------------------------------------------- the plot
  plotInk(c, o, penv, slide);

  // ---------------------------------------------------------------- the slide paths (dotted, data → hidden)
  if (o.paths > 0.01) {
    c.save();
    c.setLineDash([2, 6]);
    c.lineCap = 'round';
    c.strokeStyle = withAlpha(mixLab(ink, '#8a5a1c', 0.4), 0.7 * o.paths);
    c.lineWidth = 1.7;
    XOR_DATA.forEach((_, i) => {
      const [ax, ay] = lanternPos(i, 0);
      const [bx, by] = lanternPos(i, 1);
      if (Math.hypot(X(bx) - X(ax), Y(by) - Y(ay)) < 8) return;
      c.beginPath();
      c.moveTo(X(ax), Y(ay));
      c.lineTo(X(bx), Y(by));
      c.stroke();
      // the destination: a small open ink ring where the lantern will land
      c.setLineDash([]);
      c.beginPath();
      c.arc(X(bx), Y(by), 4, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([2, 6]);
    });
    c.restore();
  }

  // ---------------------------------------------------------------- lanterns
  const lA = sm((o.reveal - 0.3) / 0.7);
  const single = o.sweepA > 0.001 ? singleCut(o.sweep) : null;
  const drawLantern = (i: number) => {
    const p = XOR_DATA[i];
    const [vx, vy] = lanternPos(i, slide);
    const cx = X(vx);
    const cy = Y(vy);
    const on = p.y[0] === 1;
    if (single && single.wrong[i]) {
      c.save();
      c.globalAlpha *= o.sweepA;
      c.strokeStyle = ink;
      c.lineWidth = 1.8;
      c.setLineDash([4, 3]);
      c.beginPath();
      c.arc(cx, cy, 42, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);
      c.restore();
    }
    const a = lA * sm((o.reveal - 0.3 - i * 0.1) / 0.35);
    lantern(c, cx, cy, LANTERN_R, on, a, penv);
    const labA = a * 0.8 * (1 - sm(clamp01(o.fold) * 6));
    if (labA > 0.01)
      label(c, `(${p.x[0]}, ${p.x[1]})`, cx + (p.x[0] ? 38 : -38), cy + (p.x[1] ? -30 : 50), { size: 23, color: ink, align: p.x[0] ? 'left' : 'right', alpha: labA });
  };
  [1, 0, 3, 2].forEach(drawLantern);
  // '×2': the two lit cases landed on one point
  const twoA = sm((slide - 0.85) / 0.15);
  if (twoA > 0.01) {
    const [vx, vy] = lanternPos(2, slide);
    label(c, '×2', X(vx) + 34, Y(vy) - 26, { size: 24, italic: true, weight: 500, color: ink, align: 'left', alpha: twoA });
  }

  // ---------------------------------------------------------------- the hidden cells ('between')
  // the row of cells between input and answer: lamp-lit beads strung on a faint crease, a different glyph from
  // the data lanterns, so hidden space never reads as six data points
  if (o.crease > 0.01) {
    const g = o.crease;
    const pulse = o.cellPulse;
    const [a0, a1] = CELLS;
    const r = 14.5 * (1 + 0.22 * pulse);
    c.save();
    glow(c, X((a0 + a1) / 2), Y((a0 + a1) / 2), 80, PARCH.halo, (0.22 + 0.3 * pulse) * g);
    c.lineCap = 'round';
    // the faint crease the cells sit on
    c.strokeStyle = withAlpha(mixLab(ink, '#8a5a1c', 0.45), 0.32 * g);
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(X(a0 - 0.2), Y(a0 - 0.2));
    c.lineTo(X(a1 + 0.2), Y(a1 + 0.2));
    c.stroke();
    for (const v of CELLS) {
      c.fillStyle = withAlpha(PARCH.halo, 0.6 * g);
      c.strokeStyle = withAlpha(ink, 0.7 * g);
      c.lineWidth = 1.6;
      c.beginPath();
      c.arc(X(v), Y(v), r, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    }
    c.restore();
  }

  // ---------------------------------------------------------------- the output cut (hidden space)
  if (o.outCut > 0.001) {
    const k = sm(o.outCut);
    drawCut(c, OUT_W[0], OUT_W[1], -OUT_B, k, 2.2);
  }

  // ---------------------------------------------------------------- the scissors
  drawScissors(c, o, single, slide);

  // ---------------------------------------------------------------- the truth-table chip
  if (o.chip > 0.01 || o.chipFrame > 0.01) chip(c, o, penv);

  // ---------------------------------------------------------------- the margin counter
  if (o.counterA > 0.01) {
    const n = single && o.solve <= 0.001 ? single.nWrong : o.solvedCount;
    c.save();
    c.globalAlpha *= o.counterA;
    label(c, 'on the wrong side:', COUNTER.x, COUNTER.y, { size: 23, italic: true, color: ink, align: 'center' });
    const bump = o.tick;
    label(c, String(n), COUNTER.x, COUNTER.y + 80 - bump * 6, { size: 70, font: MFONT.type, color: ink, align: 'center', alpha: 0.82 + 0.18 * bump });
    c.fillStyle = withAlpha(ink, 0.4);
    c.fillRect(COUNTER.x - 40, COUNTER.y + 98, 80, 1);
    c.restore();
  }

  // ---------------------------------------------------------------- labels
  if (o.labelXor > 0.01)
    label(c, 'XOR (exclusive or): lit when exactly one input is on', X(0.5), PLATE.y + PLATE.h - 40, { size: 24, italic: true, weight: 500, color: LABEL_INK, align: 'center', alpha: sm(o.labelXor) });
  if (o.labelAmari > 0.01) {
    const a = sm(o.labelAmari);
    label(c, 'in Japan, Amari had a method', COUNTER.x, PLATE.y + PLATE.h - 40 + (1 - a) * 6, { size: 24, italic: true, weight: 500, color: LABEL_INK, align: 'center', alpha: a });
  }
}
/** the two hidden cells' places along the diagonal (data units on x₁ = x₂), clear of the settled lanterns */
const CELLS = [0.34, 0.6];

// ------------------------------------------------------------------------------------------------ pieces
/** the light pool on the paper: brightest a little left of centre (over the plot), the corners ~35% darker */
function plateFalloff(c: CanvasRenderingContext2D, env: PaintEnv) {
  c.save();
  c.beginPath();
  c.rect(PLATE.x, PLATE.y, PLATE.w, PLATE.h);
  c.clip();
  // warm the paper ~8% toward ochre (aged plate under a tube light, not a white slide)
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = withAlpha('#c99a4a', 0.16);
  c.fillRect(PLATE.x, PLATE.y, PLATE.w, PLATE.h);
  // the whole sheet ~10% lower in value (the lit lanterns, not the paper, are the brightest things in frame)
  c.fillStyle = '#e4e4e4';
  c.fillRect(PLATE.x, PLATE.y, PLATE.w, PLATE.h);
  c.globalCompositeOperation = 'source-over';
  // the desk lamp hangs off the upper right: its pool falls across the plate from there (brightest over the
  // chip and the plot's upper right), falling off toward the lower left
  const shade = mixLab(PARCH.ink, env.mood.set, 0.5);
  const g = c.createRadialGradient(980, 40, 120, 900, 120, 1050);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.3, withAlpha(shade, 0.06));
  g.addColorStop(0.6, withAlpha(shade, 0.25));
  g.addColorStop(1, withAlpha(shade, 0.6));
  c.fillStyle = g;
  c.fillRect(PLATE.x, PLATE.y, PLATE.w, PLATE.h);
  // the plate's left edge, farthest from the lamp, a step darker
  const v = c.createLinearGradient(PLATE.x, 0, PLATE.x + 230, 0);
  v.addColorStop(0, withAlpha(shade, 0.34));
  v.addColorStop(1, withAlpha(shade, 0));
  c.fillStyle = v;
  c.fillRect(PLATE.x, PLATE.y, 230, PLATE.h);
  // the warm pool itself (additive, low)
  c.globalCompositeOperation = 'lighter';
  const w = c.createRadialGradient(1010, 70, 0, 1010, 70, 760);
  w.addColorStop(0, withAlpha(PARCH.halo, 0.16));
  w.addColorStop(0.5, withAlpha(PARCH.halo, 0.05));
  w.addColorStop(1, withAlpha(PARCH.halo, 0));
  c.fillStyle = w;
  c.fillRect(PLATE.x, PLATE.y, PLATE.w, PLATE.h);
  c.restore();
}

function plotInk(c: CanvasRenderingContext2D, o: XorCaseState, penv: PaintEnv, slide: number) {
  const axA = Math.max(sm(o.reveal / 0.45), 0.75 * o.axesEarly);
  // the lit band and the two hidden cuts belong to INPUT space: the band washes off as the slide begins (the hidden
  // wash comes only with the output cut, after the lanterns land); the cuts stay through the slide and fade with the
  // axis swap
  const slideOn = sm(clamp01(o.fold) / 0.25);
  // decision region: input space (the band) → hidden space (the wedge)
  const solA = sm((o.solve - 0.35) / 0.45);
  if (solA > 0.001) {
    c.save();
    c.beginPath();
    c.rect(X(LO), Y(HI), S, S);
    c.clip();
    c.imageSmoothingEnabled = true;
    const inA = solA * (1 - slideOn);
    if (inA > 0.001) {
      c.globalAlpha = inA;
      c.drawImage(region('input'), X(LO), Y(HI), S, S);
    }
    const hA = solA * sm((o.outCut - 0.2) / 0.8);
    if (hA > 0.001) {
      c.globalAlpha = hA;
      c.drawImage(region('hidden'), X(LO), Y(HI), S, S);
    }
    c.restore();
  }
  // the single cut's "lit" side, washed faintly so the cut reads as a decision
  if (o.sweepA > 0.001) {
    const s = singleCut(o.sweep);
    c.save();
    c.beginPath();
    c.rect(X(LO), Y(HI), S, S);
    c.clip();
    const tx = -s.ny;
    const ty = s.nx;
    const bx = s.nx * s.d;
    const by = s.ny * s.d;
    const L = 4;
    const sx = s.nx * s.litSign;
    const sy = s.ny * s.litSign;
    c.beginPath();
    c.moveTo(X(bx + tx * L), Y(by + ty * L));
    c.lineTo(X(bx - tx * L), Y(by - ty * L));
    c.lineTo(X(bx - tx * L + sx * L), Y(by - ty * L + sy * L));
    c.lineTo(X(bx + tx * L + sx * L), Y(by + ty * L + sy * L));
    c.closePath();
    c.fillStyle = withAlpha('#f2c46e', 0.2 * o.sweepA);
    c.fill();
    c.restore();
    c.save();
    c.globalAlpha *= o.sweepA;
    drawCut(c, s.nx, s.ny, s.d, 1, 2);
    c.restore();
  }
  // axes
  if (axA > 0.001) {
    c.save();
    c.globalAlpha *= axA;
    c.strokeStyle = withAlpha(ink, 0.8);
    c.lineWidth = 1.3;
    const grow = Math.max(sm(o.reveal / 0.35), sm(o.axesEarly / 0.8));
    c.beginPath();
    c.moveTo(X(LO + 0.06), Y(0));
    c.lineTo(X(LO + 0.06 + (HI - 0.1 - LO) * grow), Y(0));
    c.moveTo(X(0), Y(LO + 0.06));
    c.lineTo(X(0), Y(LO + 0.06 + (HI - 0.1 - LO) * grow));
    c.stroke();
    c.fillStyle = withAlpha(ink, 0.8);
    if (grow > 0.98) {
      c.beginPath();
      c.moveTo(X(HI - 0.02), Y(0));
      c.lineTo(X(HI - 0.07), Y(0) - 4);
      c.lineTo(X(HI - 0.07), Y(0) + 4);
      c.closePath();
      c.moveTo(X(0), Y(HI - 0.02));
      c.lineTo(X(0) - 4, Y(HI - 0.07));
      c.lineTo(X(0) + 4, Y(HI - 0.07));
      c.closePath();
      c.fill();
    }
    // the unit square, dotted (the "square" the narration draws)
    c.setLineDash([3, 4]);
    c.strokeStyle = withAlpha(ink, 0.3);
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(X(1), Y(0));
    c.lineTo(X(1), Y(1));
    c.lineTo(X(0), Y(1));
    c.stroke();
    c.setLineDash([]);
    c.restore();
    // the 0.3 s swap: x labels out over the first half, h labels in over the second (never together)
    const xA = 1 - sm(o.settle / 0.5);
    const hLab = sm((o.settle - 0.5) / 0.5);
    for (const [txt, A] of [['x', xA], ['h', hLab]] as [string, number][]) {
      if (A <= 0.001) continue;
      label(c, `${txt}₁`, X(HI - 0.02), Y(0) - 12, { size: 24, italic: true, color: ink, align: 'right', alpha: axA * A });
      label(c, `${txt}₂`, X(0) - 14, Y(HI - 0.06), { size: 24, italic: true, color: ink, align: 'right', alpha: axA * A });
    }
  }
  // the dotted diagonal joining the two lit, opposite corners
  if (o.diag > 0.001) {
    c.save();
    c.globalAlpha *= o.diag;
    c.strokeStyle = withAlpha(mixLab(ink, '#8a5a1c', 0.5), 0.75);
    c.lineWidth = 1.6;
    c.setLineDash([5, 6]);
    const k = sm(o.diag * 1.5);
    c.beginPath();
    c.moveTo(X(0.08), Y(0.92));
    c.lineTo(X(0.08 + 0.84 * k), Y(0.92 - 0.84 * k));
    c.stroke();
    c.setLineDash([]);
    c.restore();
  }
  // the two hidden-unit cuts, drawn by the scissors one after the other, labelled h₁ h₂
  const hA = (o.solve > 0.001 ? 1 : 0) * (1 - sm(o.settle));
  if (hA > 0.001) {
    for (let j = 0; j < 2; j++) {
      const w = NET.W[0][j];
      const b = NET.b[0][j];
      const k = cutK(o.solve, j);
      c.save();
      c.globalAlpha *= hA;
      drawCut(c, w[0], w[1], -b, k, 1.9);
      c.restore();
      if (k > 0.98) {
        const seg = clipLine(w[0], w[1], -b);
        // labelled at the cut's MIDDLE, set off on the side away from the lit band (the scissors finish at the far
        // end, so they never sit on the label; the plate's bottom caption stays clear)
        if (seg) {
          const mx = (X(seg[0]) + X(seg[2])) / 2;
          const my = (Y(seg[1]) + Y(seg[3])) / 2;
          // the band lies between the cuts, toward the plot's centre: offset away from it
          const cx0 = X(0.5);
          const cy0 = Y(0.5);
          const nxs = w[0];
          const nys = -w[1];
          const nl = Math.hypot(nxs, nys) || 1;
          const sgn = (mx - cx0) * nxs + (my - cy0) * nys > 0 ? 1 : -1;
          const ox = (sgn * nxs) / nl;
          const oy = (sgn * nys) / nl;
          label(c, `h${'₁₂'[j]}`, mx + ox * 22, my + oy * 22 + 8, { size: 22, italic: true, color: ink, align: ox < 0 ? 'right' : 'left', alpha: hA * (1 - slideOn) });
        }
      }
    }
  }
  void penv;
  void slide;
}
/** progress of hidden cut j (0, 1) at solve u: the first cut over the first half, the second over the second */
const cutK = (u: number, j: number) => sm((u - j * 0.5) / 0.5);

function drawCut(c: CanvasRenderingContext2D, nx: number, ny: number, d: number, k: number, lw: number) {
  const seg = clipLine(nx, ny, d);
  if (!seg || k <= 0) return;
  const [x0, y0, x1, y1] = seg;
  const ex = x0 + (x1 - x0) * k;
  const ey = y0 + (y1 - y0) * k;
  c.save();
  c.strokeStyle = ink;
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(X(x0), Y(y0));
  c.lineTo(X(ex), Y(ey));
  c.stroke();
  // the kerf's lifted, light-catching lip
  c.strokeStyle = withAlpha(PARCH.rim, 0.8);
  c.lineWidth = 0.9;
  c.translate(lw * 0.8, -lw * 0.8);
  c.stroke();
  c.restore();
  if (k < 0.999) {
    c.save();
    c.globalAlpha *= 0.35;
    c.strokeStyle = ink;
    c.lineWidth = 1.1;
    c.setLineDash([7, 6]);
    c.beginPath();
    c.moveTo(X(ex), Y(ey));
    c.lineTo(X(x1), Y(y1));
    c.stroke();
    c.restore();
  }
}

/** where the scissors are, and which way they point (screen px / radians) */
function scissorsAt(o: XorCaseState, single: ReturnType<typeof singleCut> | null, slide: number): { x: number; y: number; ang: number; a: number } | null {
  const tip = (nx: number, ny: number, d: number, k: number) => {
    const seg = clipLine(nx, ny, d);
    if (!seg) return null;
    const [x0, y0, x1, y1] = seg;
    const ex = x0 + (x1 - x0) * k;
    const ey = y0 + (y1 - y0) * k;
    return { x: X(ex), y: Y(ey), ang: Math.atan2(Y(y1) - Y(y0), X(x1) - X(x0)) };
  };
  if (o.outCut > 0.001) {
    const p = tip(OUT_W[0], OUT_W[1], -OUT_B, sm(o.outCut));
    // the scissors enter a little way up the cut, clear of the plate's bottom caption
    return p ? { ...p, a: sm((o.outCut - 0.16) / 0.12) } : null;
  }
  if (o.solve > 0.001) {
    const j = o.solve < 0.5 ? 0 : 1;
    const w = NET.W[0][j];
    const p = tip(w[0], w[1], -NET.b[0][j], cutK(o.solve, j));
    // the scissors step aside as the lanterns begin to slide
    // (they arrive a little way up the first cut, clear of the plate's bottom caption)
    return p ? { ...p, a: sm((o.solve - 0.1) / 0.1) * (1 - sm(clamp01(o.fold) * 4)) } : null;
  }
  if (single) {
    const p = tip(single.nx, single.ny, single.d, 1);
    return p ? { ...p, a: o.sweepA } : null;
  }
  void slide;
  return null;
}

function drawScissors(c: CanvasRenderingContext2D, o: XorCaseState, single: ReturnType<typeof singleCut> | null, slide: number) {
  const at = scissorsAt(o, single, slide);
  if (!at || at.a <= 0.01) return;
  const lift = sm(o.lift);
  const sc = 1.75 * (1 + 0.1 * lift);
  // lifted: off the cut's end, up and to the right of the dark (1,1) lantern, hanging clear over empty parchment,
  // turned 10° and opened 10°, then perfectly still
  const [lx, ly] = lanternPos(3, 1);
  const angH = at.ang - 0.17;
  // the shape's visual centre sits ~19 units behind the pivot (the bows trail the blades): hang by the CENTRE
  const tx = X(lx) + LIFT_OFF.x + Math.cos(angH) * 19 * sc;
  const ty = Y(ly) + LIFT_OFF.y + Math.sin(angH) * 19 * sc;
  const hx = at.x + (tx - at.x) * lift;
  const hy = at.y + (ty - at.y) * lift;
  const ang = at.ang - 0.17 * lift;
  const open = 0.087 * lift;
  c.save();
  // the soft drop shadow: crisp (2-3 px) while the blades lie on the paper, ~6 px offset and softer once hung
  c.save();
  c.globalAlpha *= at.a * (0.42 - 0.12 * lift);
  c.translate(hx - 2.5 - 1.5 * lift, hy + 2.5 + 3 * lift);
  c.rotate(ang);
  c.scale(sc, sc);
  c.translate(-24, 0);
  c.filter = `blur(${(1.2 + 2.6 * lift).toFixed(1)}px)`;
  c.fillStyle = '#2a211b';
  c.fill(scissors(open), 'nonzero');
  c.restore();
  c.globalAlpha *= at.a;
  c.translate(hx, hy);
  c.rotate(ang);
  c.scale(sc, sc);
  c.translate(-24, 0);
  c.fillStyle = ink;
  c.fill(scissors(open), 'nonzero');
  c.restore();
}
/** where the scissors hang after 'train', relative to the dark (1,1) lantern in hidden space (screen px) */
const LIFT_OFF = { x: 92, y: -78 };

function chip(c: CanvasRenderingContext2D, o: XorCaseState, penv: PaintEnv) {
  const a = Math.max(sm(o.chipFrame), sm(o.chip / 0.25));
  const headA = sm(o.chip / 0.25);
  const x0 = CHIP.x - CHIP.w / 2;
  const y0 = CHIP.y - CHIP.h / 2;
  const mv = sm(o.chipMove);
  const sc = 1.6 + (1 - 1.6) * mv;
  c.save();
  c.globalAlpha *= a;
  c.translate(640 + (CHIP.x - 640) * mv, 318 + (CHIP.y - 318) * mv);
  c.scale(sc, sc);
  c.translate(-CHIP.x, -CHIP.y);
  // a pasted-in paper chip: a lighter slip with a thin rule border
  c.fillStyle = withAlpha('#2a211b', 0.12);
  c.fillRect(x0 + 3, y0 + 4, CHIP.w, CHIP.h);
  c.fillStyle = mixLab(PARCH.sky[0], '#fffaf0', 0.35);
  c.fillRect(x0, y0, CHIP.w, CHIP.h);
  c.strokeStyle = withAlpha(ink, 0.5);
  c.lineWidth = 1;
  c.strokeRect(x0 + 6, y0 + 6, CHIP.w - 12, CHIP.h - 12);
  const colX = [x0 + 62, x0 + 112, x0 + 190];
  const rowY = (r: number) => y0 + 50 + r * 36;
  label(c, 'x₁', colX[0], y0 + 34, { size: 22, italic: true, color: ink, align: 'center', alpha: headA });
  label(c, 'x₂', colX[1], y0 + 34, { size: 22, italic: true, color: ink, align: 'center', alpha: headA });
  label(c, 'lit?', colX[2], y0 + 34, { size: 21, italic: true, color: ink, align: 'center', alpha: headA });
  // the ruled frame is on the slip from the start (the empty table of the 'puzzle'); the rules draw in with it
  c.fillStyle = withAlpha(ink, 0.55);
  c.fillRect(x0 + 30, y0 + 44, (CHIP.w - 60) * a, 1);
  c.fillRect(x0 + 150, y0 + 16, 1, (CHIP.h - 32) * a);
  const rows: [number, number, number][] = [
    [0, 0, 0],
    [0, 1, 1],
    [1, 0, 1],
    [1, 1, 0],
  ];
  rows.forEach(([a1, a2, out], r) => {
    const ra = sm((o.chip - 0.2 - r * 0.15) / 0.25);
    if (ra <= 0.01) return;
    const y = rowY(r) + 22;
    label(c, String(a1), colX[0], y, { size: 22, color: ink, align: 'center', alpha: ra, font: MFONT.serif });
    label(c, String(a2), colX[1], y, { size: 22, color: ink, align: 'center', alpha: ra, font: MFONT.serif });
    const litK = out ? sm(o.chipLit) : 0;
    paperLantern(c, { x: colX[2], y: y - 7, r: 10, act: litK, alpha: ra, halo: 0.35 }, penv);
    // "not both": the 11 row gets a firm ink stroke under it as the narration says it
    if (r === 3 && o.chipBoth > 0.01) {
      c.save();
      c.strokeStyle = withAlpha(ink, 0.75);
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(colX[0] - 18, y + 7);
      c.lineTo(colX[0] - 18 + (colX[1] - colX[0] + 36) * sm(o.chipBoth), y + 7);
      c.stroke();
      c.restore();
    }
  });
  c.restore();
}
