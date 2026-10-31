// What Held, What Narrowed
//
// UI Exploration — chapter 3. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/ui-exploration/drag-knobs/README.md:5-9 (one backward pass, five knobs, 256 candidates as instances),
//     :26 (solveFrame: up to 3 projected minimal-norm steps; the step rule), :66-80 (500 drags × 6 frames, 2,999 of
//     3,000 moving; strategy B 63.6% by 1 gradient step; 24.6% gradient 0 for every unlocked knob), :207 (candidate
//     gallery B: 37.6% of 1,500), :233 (inside a decision region the frozen-boolean gradient is the true slope)
//   lab/ui-exploration/drag-knobs/app-shell.ts:3-7, 55-64 (authored knobs and ranges), 120-160 (the shell's tree)
//   lab/ui-exploration/drag-knobs/reference.ts:235-241 (grid columns are a count of fitting candidates; cellWidth)
//   lab/ui-exploration/drag-knobs/report-results.json (appDrags B row, galleryDrags B row)
//   lab/ui-exploration/README.md:21 (most of the UI logic the prototypes ported became a circuit), :39 (19,854 /
//     18,027 vs 5,253), :108 (lists at 100 cards: 7 of 20 runs flipped, up to 21 px), :110 (chenguini's demos: 157 px
//     apart between 30 and 120 fps), :220 ("0 mismatches" means over the traces named)
//   lab/ui-exploration/learned-bits/README.md:101 (no base run learned any rung exactly), :129 (trained on every case,
//     counting units learned first-active-8 exactly); lab/status.md:204 (0 of 48)
//   lab/status.md:12 (advanceFrame steps springs to each event's timestamp), :181-190 (open decisions 4-8),
//     :290 (the record of the exploration; its measurements describe the code as it was then)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
//
// Every layout number on screen is computed at module scope from a port of reference.ts's grid rule at the
// authored knobs (a 1,280 px viewport, so the grid's inner width is 1,028 px; the port reproduces the README's own
// example, "drops to 3 columns if minCardWidth reaches 248 px", and the module throws if it ever stops doing so).
// The drag step uses solveFrame's rule. Gradients are central differences of that same function. The waffles show
// counts, one dot per frame, sorted by outcome (dot positions carry no meaning). The spring curves on the timing card
// are schematic; the 157 px is the README's measurement. Changes from the plan, per review.md: the timing claim is
// labelled as chenguini's demo semantics, with the runtime's fix beside it; the status stamp reads "record", not
// "historical". The 256-candidate search is drawn as one sweep over a single unlocked knob (illustrative).
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import type { ReactNode } from 'react';
import 'katex/dist/katex.min.css';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const fmtInt = (v: number): string => v.toLocaleString('en-US');

// ---------------------------------------------------------------------------
// The app shell's grid rule (reference.ts:235-241) at the authored knobs (app-shell.ts:55)
// ---------------------------------------------------------------------------

type Knobs = { cardPadding: number; gap: number; minCardWidth: number; sidebarOpenWidth: number; titleScale: number };
const KNOB_NAMES = ['cardPadding', 'gap', 'minCardWidth', 'sidebarOpenWidth', 'titleScale'] as const;
const AUTHORED: Knobs = { cardPadding: 12, gap: 12, minCardWidth: 220, sidebarOpenWidth: 220, titleScale: 1 };
const RANGE: Record<keyof Knobs, [number, number]> = {
  cardPadding: [0, 48], gap: [0, 48], minCardWidth: [120, 480], sidebarOpenWidth: [120, 480], titleScale: [0.5, 1.5],
};
const FLOOR: Record<keyof Knobs, number> = { cardPadding: 1, gap: 1, minCardWidth: 1, sidebarOpenWidth: 1, titleScale: 0.05 };
const VIEW_W = 1280;
const MAIN_PAD = 16;
const MAX_COLUMNS = 5;
const FIT_EPS = 1 / 64;

/** The first card's right edge, in page px, and the grid's column count. */
function firstCard(k: Knobs): { c: number; w: number; edge: number } {
  const inner = VIEW_W - k.sidebarOpenWidth - 2 * MAIN_PAD;
  let c = 1;
  for (let cand = 2; cand <= MAX_COLUMNS; cand++) if (inner + FIT_EPS >= cand * k.minCardWidth + (cand - 1) * k.gap) c++;
  const w = (inner - (c - 1) * k.gap) / c;
  return { c, w, edge: k.sidebarOpenWidth + MAIN_PAD + w };
}

const START = firstCard(AUTHORED); // 4 columns, 248 px cards, edge at 484
const DRAG_PX = 24;
const TARGET = START.edge + DRAG_PX;
// gradients of the edge per knob: central differences of firstCard (cardPadding and titleScale never reach a width)
const GRAD = KNOB_NAMES.map((n) => {
  const h = 1e-4;
  return (firstCard({ ...AUTHORED, [n]: AUTHORED[n] + h }).edge - firstCard({ ...AUTHORED, [n]: AUTHORED[n] - h }).edge) / (2 * h);
});
// solveFrame's step: knob_k += error × g_k × scale_k² / Σ_j (g_j × scale_j)², scale_k = max(|knob_k|, floor_k)
const SCALE = KNOB_NAMES.map((n) => Math.max(Math.abs(AUTHORED[n]), FLOOR[n]));
const DENOM = GRAD.reduce((acc, g, i) => acc + (g * SCALE[i]) ** 2, 0);
const STEPPED: Knobs = { ...AUTHORED };
KNOB_NAMES.forEach((n, i) => {
  STEPPED[n] = AUTHORED[n] + (DRAG_PX * GRAD[i] * SCALE[i] ** 2) / DENOM;
});
const AFTER = firstCard(STEPPED);
if (START.c !== 4 || START.edge !== 484) throw new Error('ui-exploration ch3: the authored shell should give 4 columns and an edge at 484 px');
if (Math.abs(AFTER.edge - TARGET) > 0.01 || AFTER.c !== START.c) throw new Error('ui-exploration ch3: one step should land the drag');

// The plot: the same edge against sidebarOpenWidth (a true slope, then a jump) and against minCardWidth (flat steps).
const N_PLOT = 361;
const XS = Array.from({ length: N_PLOT }, (_, i) => 120 + i);
const CURVE_A = XS.map((s) => firstCard({ ...AUTHORED, sidebarOpenWidth: s }));
const CURVE_B = XS.map((m) => firstCard({ ...AUTHORED, minCardWidth: m }));
function bisect(f: (x: number) => number, lo: number, hi: number): number {
  const c0 = f(lo);
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) === c0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
const JUMP_S = bisect((s) => firstCard({ ...AUTHORED, sidebarOpenWidth: s }).c, 120, 480);
const JUMP_LO = firstCard({ ...AUTHORED, sidebarOpenWidth: JUMP_S - 1e-6 }).edge;
const JUMP_HI = firstCard({ ...AUTHORED, sidebarOpenWidth: JUMP_S + 1e-6 }).edge;
const JUMP_PX = Math.round(JUMP_HI - JUMP_LO);
const SLOPE_A = GRAD[KNOB_NAMES.indexOf('sidebarOpenWidth')];
const FLIP_M = bisect((m) => firstCard({ ...AUTHORED, minCardWidth: m }).c, 220, 300);
if (Math.round(FLIP_M) !== 248) throw new Error('ui-exploration ch3: the port should reproduce the README’s 248 px flip');
const STEPS_B = [...new Set(CURVE_B.map((p) => p.edge))];

// The search: 256 candidates over minCardWidth's range, the closest valid one wins (only by ≥ 0.01 px).
const SEARCH_TARGET = 571;
const CANDS = Array.from({ length: 256 }, (_, i) => {
  const m = RANGE.minCardWidth[0] + (i * (RANGE.minCardWidth[1] - RANGE.minCardWidth[0])) / 255;
  return { m, ...firstCard({ ...AUTHORED, minCardWidth: m }) };
});
let WIN = -1;
CANDS.forEach((cand, i) => {
  if (WIN < 0 || Math.abs(cand.edge - SEARCH_TARGET) < Math.abs(CANDS[WIN].edge - SEARCH_TARGET) - 0.01) WIN = i;
});
const WIN_ERR = Math.abs(CANDS[WIN].edge - SEARCH_TARGET);
if (WIN_ERR >= 0.5) throw new Error('ui-exploration ch3: the search should solve the illustrative drag');

// Waffles (drag-knobs/README.md:80, :207; report-results.json, strategy B rows)
const APP_N = 3000;
const APP_MOVING = 2999;
const APP_G = Math.round(0.636 * APP_MOVING);
const APP_Z = Math.round(0.246 * APP_MOVING);
const GAL_N = 1500;
const GAL_G = Math.round(0.376 * GAL_N);
const W_COLS = 60;
const W_P = 4.4;
const W_S = 3.4;
const APP_W = { x: 60, y: 378 };
const GAL_W = { x: 356, y: 378 };
const dotRect = (o: { x: number; y: number }, i: number): string =>
  `M${(o.x + (i % W_COLS) * W_P).toFixed(1)} ${(o.y + Math.floor(i / W_COLS) * W_P).toFixed(1)}h${W_S}v${W_S}h-${W_S}z`;
const APP_D = Array.from({ length: APP_N }, (_, i) => dotRect(APP_W, i));
const GAL_D = Array.from({ length: GAL_N }, (_, i) => dotRect(GAL_W, i));
const wPos = (o: { x: number; y: number }, i: number) => ({ x: o.x + (i % W_COLS) * W_P + W_S / 2, y: o.y + Math.floor(i / W_COLS) * W_P + W_S / 2 });

// The ledger (README.md:39, :108, :110; learned-bits/README.md:101, :129; status.md:204, :290)
const OPS = [
  { v: 19854, label: 'with word springs' },
  { v: 18027, label: 'without word springs' },
  { v: 5253, label: 'before: the original' },
];
const PORTED = ['lists', 'springs', 'layout', 'the gallery', 'a comment thread'];
const LIST_RUNS = 20;
const LIST_FLIPS = 7;
const LEARN_RUNS = 48;

// Schematic spring curves for the timing card: the destination changes mid-animation. At 120 fps it applies almost
// at the event; at 30 fps it applies before catch-up steps that simulate time from before the event. The lead is
// exaggerated so the two curves separate at card size; only the 157 px on the card is measured.
function springCurve(lead: number): [number, number][] {
  const dt = 0.002;
  const tEvent = 0.24;
  let x = 0;
  let v = 0;
  const pts: [number, number][] = [];
  for (let t = 0; t <= 0.7 + 1e-9; t += dt) {
    const dest = t >= tEvent - lead ? -0.35 : 1;
    v += (-160 * (x - dest) - 14 * v) * dt;
    x += v * dt;
    pts.push([t, x]);
  }
  return pts;
}
const SPRING_30 = springCurve(0.09);
const SPRING_120 = springCurve(0);

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const SHELL = { x: 44, y: 106, s: 360 / VIEW_W, h: 192 };
const shellX = (px: number): number => SHELL.x + px * SHELL.s;
const PANEL_X0 = 412;
const PANEL_X1 = 652;
const knobRowY = (i: number): number => 124 + i * 36;
const knobFrac = (n: keyof Knobs, v: number): number => (v - RANGE[n][0]) / (RANGE[n][1] - RANGE[n][0]);
const TRACK_X0 = PANEL_X0;
const TRACK_X1 = PANEL_X1;

// plot (top region)
const PL = { x0: 96, x1: 612, y0: 300, y1: 112 };
const plx = (v: number): number => PL.x0 + ((v - 120) / 360) * (PL.x1 - PL.x0);
const ply = (e: number): number => PL.y0 + ((e - 380) / 400) * (PL.y1 - PL.y0);

// ledger
const LED_X = 668;
const LED_W = 580;
const COL_W = 285;
const CARD_H = 144;
const cardXY = (i: number): { x: number; y: number } => ({ x: LED_X + (i % 2) * (COL_W + 10), y: 178 + Math.floor(i / 2) * (CARD_H + 6) });
const STATUS = { x: LED_X, y: 84, w: LED_W, h: 88 };

const CAM_SHELL: CameraState = { x: 348, y: 214, k: 1.7 };
const CAM_WAF: CameraState = { x: 345, y: 468, k: 1.55 };
const CAM_PLOT: CameraState = { x: 354, y: 210, k: 1.6 };
const CAM_LEFT: CameraState = { x: 345, y: 364, k: 1.0 };
const camCard = (i: number): CameraState => {
  const p = cardXY(i);
  return { x: p.x + COL_W / 2, y: p.y + CARD_H / 2 + 8, k: 1.6 };
};
const CAM_STATUS: CameraState = { x: 958, y: 258, k: 1.32 };

// caption durations (~150 wpm) — each caption is followed by a 0.5 s hold
const DURS = [14.8, 8.8, 8.8, 7.2, 16.0, 11.2, 9.2, 11.2, 11.2, 13.2, 14.0, 12.4, 12.0];
const KICKERS = [
  'drag-knobs · the app shell', 'drag-knobs · 500 scripted drags', 'drag-knobs · strategy B', 'drag-knobs · candidate gallery',
  'drag-knobs · decisions', 'drag-knobs · search', 'the ledger', 'the ledger', 'the ledger', 'the ledger', 'the ledger', 'status', 'what held',
];

// ---------------------------------------------------------------------------
// Timeline — 159 s, thirteen fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_SHELL, cameraInterp);
  const beat = tl.channel('beat', 0);

  const topOp = tl.channel('topOp', 1);
  const wafOp = tl.channel('wafOp', 1);
  const plotOp = tl.channel('plotOp', 1);
  // B1
  const shellU = tl.channel('shellU', 0);
  const knobsU = tl.channel('knobsU', 0);
  const dragU = tl.channel('dragU', 0);
  const backU = tl.channel('backU', 0);
  const gradU = tl.channel('gradU', 0);
  const fmlU = tl.channel('fmlU', 0);
  const stepU = tl.channel('stepU', 0);
  // B2–B4
  const stripU = tl.channel('stripU', 0);
  const waffleU = tl.channel('waffleU', 0);
  const movingU = tl.channel('movingU', 0);
  const cntOp = tl.channel('cntOp', 1);
  const stratU = tl.channel('stratU', 0);
  const greenU = tl.channel('greenU', 0);
  const onlyU = tl.channel('onlyU', 0);
  const galU = tl.channel('galU', 0);
  const galGreenU = tl.channel('galGreenU', 0);
  // B5–B6
  const plotU = tl.channel('plotU', 0);
  const curveU = tl.channel('curveU', 0);
  const tanU = tl.channel('tanU', 0);
  const jumpU = tl.channel('jumpU', 0);
  const morphU = tl.channel('morphU', 0);
  const zeroU = tl.channel('zeroU', 0);
  const roseU = tl.channel('roseU', 0);
  const targetU = tl.channel('targetU', 0);
  const candU = tl.channel('candU', 0);
  const winU = tl.channel('winU', 0);
  // ledger
  const ledU = tl.channel('ledU', 0);
  const cardOp = [0, 1, 2, 3, 4, 5].map((i) => tl.channel(`card${i + 1}Op`, i < 2 ? 1 : 0.12));
  const bodyU = [0, 1, 2, 3, 4, 5].map((i) => tl.channel(`body${i + 1}U`, 0));
  const stampU = [0, 1, 2, 3, 4, 5].map((i) => tl.channel(`stamp${i + 1}U`, 0));
  const extraU = [0, 1, 2, 3, 4, 5].map((i) => tl.channel(`extra${i + 1}U`, 0));
  const statusU = tl.channel('statusU', 0);
  const statusStampU = tl.channel('statusStampU', 0);
  const statusLineU = tl.channel('statusLineU', 0);
  const landedU = tl.channel('landedU', 0);
  const openU = tl.channel('openU', 0);
  const takeU = tl.channel('takeU', 0);

  const caps: { at: number; dur: number }[] = [];
  let cur = 0.4;
  for (const d of DURS) {
    caps.push({ at: cur, dur: d });
    cur = +(cur + d + 0.5).toFixed(2);
  }
  caps.forEach((c, i) => tl.set(beat, i, Math.max(0, c.at - 0.1)));
  const at = (i: number, dt: number): number => caps[i].at + dt;

  // — B1 · a drag, one backward pass, five knobs, a step —
  tl.caption({ ...caps[0], text: "A designer drags a card's edge in the app shell. One backward pass asks which of five design numbers should move, padding, gap, minimum card width, sidebar width or title scale, and takes a gradient step." });
  tl.tween(shellU, 1, { at: at(0, 0.1), dur: 0.8, ease: ease.enter });
  tl.tween(dragU, 1, { at: at(0, 1.8), dur: 1.2, ease: ease.move });
  tl.tween(backU, 1, { at: at(0, 3.6), dur: 1.3, ease: ease.draw });
  tl.tween(knobsU, 5, { at: at(0, 4.6), dur: 4.4, ease: ease.linear });
  tl.tween(gradU, 1, { at: at(0, 9.4), dur: 0.6, ease: ease.pop });
  tl.tween(fmlU, 1, { at: at(0, 10.6), dur: 0.7, ease: ease.enter });
  tl.tween(stepU, 1, { at: at(0, 12.0), dur: 1.4, ease: ease.move });
  tl.hold(at(0, DURS[0]), 0.5);

  // — B2 · 500 drags × 6 frames —
  tl.caption({ ...caps[1], text: 'The test is five hundred scripted drags of six frames each. Of those, two thousand nine hundred ninety-nine frames actually move.' });
  tl.tween(cam, CAM_WAF, { at: at(1, 0), dur: 1.4, ease: ease.move });
  tl.tween(fmlU, 0, { at: at(1, 0), dur: 0.5, ease: ease.move });
  tl.tween(topOp, 0.12, { at: at(1, 0.2), dur: 0.8, ease: ease.move });
  tl.tween(stripU, 1, { at: at(1, 0.4), dur: 0.7, ease: ease.enter });
  tl.tween(stripU, 2, { at: at(1, 1.6), dur: 1.0, ease: ease.move });
  tl.tween(waffleU, 1, { at: at(1, 2.4), dur: 3.0, ease: ease.linear });
  tl.tween(movingU, 1, { at: at(1, 5.8), dur: 0.7, ease: ease.enter });
  tl.hold(at(1, DURS[1]), 0.5);

  // — B3 · strategy B: 63.6% by one gradient step —
  tl.caption({ ...caps[2], text: 'With booleans frozen, one gradient step solved sixty-three point six percent of those moving frames. That is the app shell only.' });
  tl.tween(stratU, 1, { at: at(2, 0.3), dur: 0.7, ease: ease.enter });
  tl.tween(greenU, 1, { at: at(2, 1.2), dur: 2.4, ease: ease.linear });
  tl.tween(onlyU, 1, { at: at(2, 5.6), dur: 0.6, ease: ease.pop });
  tl.hold(at(2, DURS[2]), 0.5);

  // — B4 · the candidate gallery: 37.6% of 1,500 —
  tl.caption({ ...caps[3], text: 'The same strategy on the candidate gallery solved thirty-seven point six percent of fifteen hundred moving frames.' });
  tl.tween(cntOp, 0, { at: at(3, 0), dur: 0.5, ease: ease.move });
  tl.tween(galU, 1, { at: at(3, 0.4), dur: 1.6, ease: ease.linear });
  tl.tween(galGreenU, 1, { at: at(3, 2.4), dur: 1.8, ease: ease.linear });
  tl.hold(at(3, DURS[3]), 0.5);

  // — B5 · decisions: a true slope inside, zero or misleading across —
  tl.caption({ ...caps[4], text: 'Decisions are why. Inside a decision region the gradient is the true slope; across one it is zero or misleading. At the start, every unlocked knob had a zero gradient in twenty-four point six percent of app shell frames.' });
  tl.tween(cam, CAM_PLOT, { at: at(4, 0), dur: 1.4, ease: ease.move });
  tl.tween(topOp, 0, { at: at(4, 0), dur: 0.6, ease: ease.move });
  tl.tween(wafOp, 0.12, { at: at(4, 0.2), dur: 0.8, ease: ease.move });
  tl.tween(plotU, 1, { at: at(4, 0.6), dur: 1.1, ease: ease.draw });
  tl.tween(curveU, 1, { at: at(4, 1.5), dur: 1.4, ease: ease.draw });
  tl.tween(tanU, 1, { at: at(4, 3.4), dur: 0.8, ease: ease.enter });
  tl.tween(jumpU, 1, { at: at(4, 5.6), dur: 0.8, ease: ease.enter });
  tl.tween(tanU, 0, { at: at(4, 7.6), dur: 0.5, ease: ease.move });
  tl.tween(jumpU, 0, { at: at(4, 7.6), dur: 0.5, ease: ease.move });
  tl.tween(morphU, 1, { at: at(4, 7.8), dur: 1.4, ease: ease.move });
  tl.tween(zeroU, 1, { at: at(4, 9.2), dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_LEFT, { at: at(4, 10.6), dur: 1.4, ease: ease.move });
  tl.tween(wafOp, 1, { at: at(4, 10.6), dur: 0.8, ease: ease.move });
  tl.tween(plotOp, 0.15, { at: at(4, 10.8), dur: 0.8, ease: ease.move });
  tl.tween(roseU, 1, { at: at(4, 11.8), dur: 1.6, ease: ease.linear });
  tl.hold(at(4, DURS[4]), 0.5);

  // — B6 · search takes over: 256 candidates as instances —
  tl.caption({ ...caps[5], text: 'Then search takes over: two hundred fifty-six candidate knob settings run as instances of the same circuit, and the closest valid one wins. The instance axis again.' });
  tl.tween(cam, CAM_PLOT, { at: at(5, 0), dur: 1.4, ease: ease.move });
  tl.tween(plotOp, 1, { at: at(5, 0), dur: 0.7, ease: ease.move });
  tl.tween(wafOp, 0.12, { at: at(5, 0), dur: 0.7, ease: ease.move });
  tl.tween(targetU, 1, { at: at(5, 0.8), dur: 0.8, ease: ease.enter });
  tl.tween(candU, 1, { at: at(5, 2.6), dur: 3.0, ease: ease.linear });
  tl.tween(winU, 1, { at: at(5, 6.6), dur: 0.6, ease: ease.pop });
  tl.hold(at(5, DURS[5]), 0.5);

  // — B7 · zoom out: the ledger; most ported UI logic became a circuit —
  tl.caption({ ...caps[6], text: 'Zoom out. Most of the user interface logic the prototypes ported became a circuit: lists, springs, layout, the gallery, a comment thread.' });
  tl.tween(cam, CAMERA_HOME, { at: at(6, 0), dur: 1.6, ease: ease.move });
  tl.tween(plotOp, 0.12, { at: at(6, 0.2), dur: 0.8, ease: ease.move });
  tl.tween(wafOp, 0.12, { at: at(6, 0.2), dur: 0.8, ease: ease.move });
  tl.tween(ledU, 1, { at: at(6, 0.6), dur: 0.8, ease: ease.enter });
  tl.tween(bodyU[0], 1, { at: at(6, 0.9), dur: 0.8, ease: ease.enter });
  tl.tween(stampU[0], 1, { at: at(6, 1.8), dur: 0.5, ease: ease.pop });
  tl.tween(cardOp[0], 0.12, { at: at(6, 3.0), dur: 0.6, ease: ease.move });
  tl.tween(bodyU[1], PORTED.length, { at: at(6, 3.4), dur: 4.0, ease: ease.linear });
  tl.tween(stampU[1], 1, { at: at(6, 7.8), dur: 0.5, ease: ease.pop });
  tl.hold(at(6, DURS[6]), 0.5);

  // — B8 · combining the wins: richer, not cheaper —
  tl.caption({ ...caps[7], text: 'Combining the wins was richer, not cheaper: nineteen thousand eight hundred fifty-four operations with word springs, eighteen thousand twenty-seven without, versus five thousand two hundred fifty-three before.' });
  tl.tween(cam, camCard(2), { at: at(7, 0), dur: 1.3, ease: ease.move });
  tl.tween(cardOp[1], 0.12, { at: at(7, 0), dur: 0.6, ease: ease.move });
  tl.tween(cardOp[2], 1, { at: at(7, 0.3), dur: 0.6, ease: ease.move });
  tl.tween(bodyU[2], 3, { at: at(7, 1.6), dur: 6.6, ease: ease.linear });
  tl.tween(stampU[2], 1, { at: at(7, 9.0), dur: 0.5, ease: ease.pop });
  tl.hold(at(7, DURS[7]), 0.5);

  // — B9 · learning was weak —
  tl.caption({ ...caps[8], text: 'Learning was weak. None of forty-eight runs learned a task exactly at base settings, though counting units did learn one rung exactly when trained on every case.' });
  tl.tween(cam, camCard(3), { at: at(8, 0), dur: 1.3, ease: ease.move });
  tl.tween(cardOp[2], 0.12, { at: at(8, 0), dur: 0.6, ease: ease.move });
  tl.tween(cardOp[3], 1, { at: at(8, 0.3), dur: 0.6, ease: ease.move });
  tl.tween(bodyU[3], 1, { at: at(8, 1.4), dur: 1.4, ease: ease.linear });
  tl.tween(stampU[3], 1, { at: at(8, 4.2), dur: 0.5, ease: ease.pop });
  tl.tween(extraU[3], 1, { at: at(8, 6.0), dur: 0.7, ease: ease.enter });
  tl.hold(at(8, DURS[8]), 0.5);

  // — B10 · timing: chenguini's demos; the runtime now steps to event time —
  tl.caption({ ...caps[9], text: "In chenguini's demos, a new spring destination mid-animation lands one hundred fifty-seven pixels apart between thirty and one hundred twenty frames per second. The runtime now steps springs to each event's time." });
  tl.tween(cam, camCard(4), { at: at(9, 0), dur: 1.3, ease: ease.move });
  tl.tween(cardOp[3], 0.12, { at: at(9, 0), dur: 0.6, ease: ease.move });
  tl.tween(cardOp[4], 1, { at: at(9, 0.3), dur: 0.6, ease: ease.move });
  tl.tween(bodyU[4], 1, { at: at(9, 1.2), dur: 1.6, ease: ease.draw });
  tl.tween(stampU[4], 1, { at: at(9, 5.2), dur: 0.5, ease: ease.pop });
  tl.tween(extraU[4], 1, { at: at(9, 8.4), dur: 0.7, ease: ease.enter });
  tl.hold(at(9, DURS[9]), 0.5);

  // — B11 · zero mismatches is scoped to the traces named —
  tl.caption({ ...caps[10], text: 'And zero mismatches always means over the traces named, not a proof. In lists at one hundred cards, seven of twenty runs flipped a settle decision, and positions differed by up to twenty-one pixels.' });
  tl.tween(cam, camCard(5), { at: at(10, 0), dur: 1.3, ease: ease.move });
  tl.tween(cardOp[4], 0.12, { at: at(10, 0), dur: 0.6, ease: ease.move });
  tl.tween(cardOp[5], 1, { at: at(10, 0.3), dur: 0.6, ease: ease.move });
  tl.tween(bodyU[5], 1, { at: at(10, 1.0), dur: 0.7, ease: ease.enter });
  tl.tween(stampU[5], 1, { at: at(10, 3.6), dur: 0.5, ease: ease.pop });
  tl.tween(extraU[5], 1, { at: at(10, 5.4), dur: 2.0, ease: ease.linear });
  tl.hold(at(10, DURS[10]), 0.5);

  // — B12 · the status page: the record of that exploration —
  tl.caption({ ...caps[11], text: 'The status page calls this folder the record of that exploration: its measurements describe the code as it was then. Index reads landed; what agents build apps from stays open.' });
  tl.tween(cam, CAM_STATUS, { at: at(11, 0), dur: 1.4, ease: ease.move });
  tl.tween(cardOp[5], 0.12, { at: at(11, 0), dur: 0.6, ease: ease.move });
  tl.tween(statusU, 1, { at: at(11, 0.5), dur: 0.7, ease: ease.enter });
  tl.tween(statusStampU, 1, { at: at(11, 1.6), dur: 0.5, ease: ease.pop });
  tl.tween(statusLineU, 1, { at: at(11, 3.4), dur: 0.7, ease: ease.enter });
  tl.tween(landedU, 1, { at: at(11, 7.0), dur: 0.6, ease: ease.pop });
  tl.tween(openU, 1, { at: at(11, 8.8), dur: 0.6, ease: ease.pop });
  tl.hold(at(11, DURS[11]), 0.5);

  // — B13 · the payoff: pull back on the whole ledger —
  tl.caption({ ...caps[12], text: 'So: a fixed circuit can write much of a user interface, by counting, instancing and matrix powers. It is richer, not cheaper, and learning it is still mostly open.' });
  tl.tween(cam, CAMERA_HOME, { at: at(12, 0), dur: 1.6, ease: ease.move });
  tl.tween(plotOp, 0, { at: at(12, 0), dur: 0.6, ease: ease.move });
  tl.tween(wafOp, 0.5, { at: at(12, 0.2), dur: 0.8, ease: ease.move });
  cardOp.forEach((ch) => tl.tween(ch, 1, { at: at(12, 0.4), dur: 0.8, ease: ease.move }));
  tl.tween(takeU, 4, { at: at(12, 1.0), dur: 8.4, ease: ease.linear });
  tl.hold(at(12, DURS[12]), 2.6);

  return {
    tl, cam, beat, topOp, wafOp, plotOp,
    shellU, knobsU, dragU, backU, gradU, fmlU, stepU,
    stripU, waffleU, movingU, cntOp, stratU, greenU, onlyU, galU, galGreenU,
    plotU, curveU, tanU, jumpU, morphU, zeroU, roseU, targetU, candU, winU,
    ledU, cardOp, bodyU, stampU, extraU, statusU, statusStampU, statusLineU, landedU, openU, takeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local glyphs
// ---------------------------------------------------------------------------

function Stamp({ x, y, text, color, u, anchor = 'end' }: { x: number; y: number; text: string; color: string; u: number; anchor?: 'end' | 'start' }) {
  if (u <= 0.005) return null;
  const w = text.length * 8.6 + 16;
  const x0 = anchor === 'end' ? x - w : x;
  const k = 1.5 - 0.5 * clamp01(u);
  const cx = x0 + w / 2;
  return (
    <g opacity={clamp01(u * 1.6)} transform={`translate(${cx} ${y}) rotate(-6) scale(${k}) translate(${-cx} ${-y})`}>
      <rect x={x0} y={y - 12} width={w} height={24} rx={4} fill="none" stroke={color} strokeWidth={2} />
      <text x={cx} y={y + 4.5} textAnchor="middle" fill={color} fontSize={13} fontFamily={MONO} fontWeight={700} letterSpacing={1.2}>
        {text}
      </text>
    </g>
  );
}

function Card({ i, title, stamp, stampColor, stampU, op, ledU, children }: {
  i: number; title: string; stamp: string; stampColor: string; stampU: number; op: number; ledU: number; children?: ReactNode;
}) {
  if (ledU <= 0.005 || op <= 0.005) return null;
  const { x, y } = cardXY(i);
  const dy = (1 - ledU) * 14;
  return (
    <g opacity={op * ledU} transform={`translate(0 ${dy})`}>
      <rect x={x} y={y} width={COL_W} height={CARD_H} rx={8} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
      <text x={x + 14} y={y + 26} fill={colors.TEXT} fontSize={15} fontFamily={UI} fontWeight={600}>
        {title}
      </text>
      <Stamp x={x + COL_W - 14} y={y + 22} text={stamp} color={stampColor} u={stampU} />
      {children}
    </g>
  );
}

function Bar({ x, y, w, frac, color, label, value, op = 1 }: { x: number; y: number; w: number; frac: number; color: string; label: string; value: string; op?: number }) {
  if (op <= 0.005) return null;
  return (
    <g opacity={op}>
      <text x={x} y={y - 6} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
        {label}
      </text>
      <text x={x + w} y={y - 6} textAnchor="end" fill={color} fontSize={13} fontFamily={MONO}>
        {value}
      </text>
      <rect x={x} y={y} width={w} height={9} rx={2} fill={colors.GRID} />
      <rect x={x} y={y} width={Math.max(0, w * frac)} height={9} rx={2} fill={color} />
    </g>
  );
}

function Pill({ x, y, text, color, op = 1, fs = 13, anchor = 'start' }: { x: number; y: number; text: string; color: string; op?: number; fs?: number; anchor?: 'start' | 'middle' }) {
  if (op <= 0.005) return null;
  const w = text.length * fs * 0.56 + 18;
  const x0 = anchor === 'middle' ? x - w / 2 : x;
  return (
    <g opacity={op}>
      <rect x={x0} y={y - fs - 2} width={w} height={fs + 10} rx={(fs + 10) / 2} fill={colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text x={x0 + w / 2} y={y + 1} textAnchor="middle" fill={color} fontSize={fs} fontFamily={UI}>
        {text}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const beat = Math.max(0, Math.min(KICKERS.length - 1, Math.round(s.get(scene.beat))));
  const topOp = s.get(scene.topOp);
  const wafOp = s.get(scene.wafOp);
  const plotOp = s.get(scene.plotOp);

  const shellU = s.get(scene.shellU);
  const knobsU = s.get(scene.knobsU);
  const dragU = s.get(scene.dragU);
  const backU = s.get(scene.backU);
  const gradU = s.get(scene.gradU);
  const fmlU = s.get(scene.fmlU);
  const stepU = s.get(scene.stepU);

  const stripU = s.get(scene.stripU);
  const waffleU = s.get(scene.waffleU);
  const movingU = s.get(scene.movingU);
  const cntOp = s.get(scene.cntOp);
  const stratU = s.get(scene.stratU);
  const greenU = s.get(scene.greenU);
  const onlyU = s.get(scene.onlyU);
  const galU = s.get(scene.galU);
  const galGreenU = s.get(scene.galGreenU);

  const plotU = s.get(scene.plotU);
  const curveU = s.get(scene.curveU);
  const tanU = s.get(scene.tanU);
  const jumpU = s.get(scene.jumpU);
  const morphU = s.get(scene.morphU);
  const zeroU = s.get(scene.zeroU);
  const roseU = s.get(scene.roseU);
  const targetU = s.get(scene.targetU);
  const candU = s.get(scene.candU);
  const winU = s.get(scene.winU);

  const ledU = s.get(scene.ledU);
  const cardOp = scene.cardOp.map((c) => s.get(c));
  const bodyU = scene.bodyU.map((c) => s.get(c));
  const stampU = scene.stampU.map((c) => s.get(c));
  const extraU = scene.extraU.map((c) => s.get(c));
  const statusU = s.get(scene.statusU);
  const statusStampU = s.get(scene.statusStampU);
  const statusLineU = s.get(scene.statusLineU);
  const landedU = s.get(scene.landedU);
  const openU = s.get(scene.openU);
  const takeU = s.get(scene.takeU);

  // ---- the shell's live knobs (authored → stepped) ----
  const knobs: Knobs = { ...AUTHORED };
  KNOB_NAMES.forEach((n) => {
    knobs[n] = lerp(AUTHORED[n], STEPPED[n], stepU);
  });
  const fc = firstCard(knobs);
  const targetEdge = lerp(START.edge, TARGET, dragU);

  // ---- waffle paths (sorted counts: green from the start, rose from the end of the moving frames) ----
  const appShown = Math.round(waffleU * APP_N);
  const appGreen = Math.round(greenU * APP_G);
  const appRose = Math.round(roseU * APP_Z);
  const appCls: string[][] = [[], [], [], []]; // gray, green, rose, still
  for (let i = 0; i < appShown; i++) {
    const k = i >= APP_MOVING ? 3 : i < appGreen ? 1 : i >= APP_MOVING - appRose ? 2 : 0;
    appCls[k].push(APP_D[i]);
  }
  const galShown = Math.round(clamp01(galU) * GAL_N);
  const galGreen = Math.round(galGreenU * GAL_G);
  const galCls: string[][] = [[], []];
  for (let i = 0; i < galShown; i++) galCls[i < galGreen ? 1 : 0].push(GAL_D[i]);

  // ---- the plot: morph A (vs sidebarOpenWidth) → B (vs minCardWidth) ----
  const nDraw = Math.max(2, Math.round(curveU * N_PLOT));
  const breaks = morphU < 0.5 ? CURVE_A : CURVE_B;
  let curvePath = '';
  for (let i = 0; i < nDraw; i++) {
    const y = ply(lerp(CURVE_A[i].edge, CURVE_B[i].edge, morphU));
    const brk = i === 0 || breaks[i].c !== breaks[i - 1].c;
    curvePath += `${brk ? 'M' : 'L'}${plx(XS[i]).toFixed(1)} ${y.toFixed(1)}`;
  }
  const nCand = Math.round(candU * CANDS.length);

  // ---- card timeline helpers ----
  const chipsShown = bodyU[1];
  const opsU = bodyU[2];

  const kicker = KICKERS[beat];

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== top-left: the app shell and its five knobs ======================== */}
        {topOp > 0.005 && shellU > 0.005 && (
          <g opacity={topOp}>
            <g opacity={shellU}>
              <text x={SHELL.x} y={SHELL.y - 10} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                app shell, 1,280 px · widths to scale
              </text>
              <rect x={SHELL.x} y={SHELL.y} width={VIEW_W * SHELL.s} height={SHELL.h} rx={5} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={SHELL.x} y={SHELL.y} width={VIEW_W * SHELL.s} height={16} rx={5} fill={colors.GRID} />
              <rect x={SHELL.x} y={SHELL.y + 16} width={knobs.sidebarOpenWidth * SHELL.s} height={SHELL.h - 16} fill={colors.GRID} opacity={0.6} />
              <text x={SHELL.x + 6} y={SHELL.y + 34} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                sidebar
              </text>
              {[0, 1].map((row) =>
                Array.from({ length: fc.c }, (_, j) => {
                  const x = shellX(knobs.sidebarOpenWidth + MAIN_PAD + j * (fc.w + knobs.gap));
                  const y = SHELL.y + 30 + row * 76;
                  const first = row === 0 && j === 0;
                  return (
                    <rect key={`${row}-${j}`} x={x} y={y} width={fc.w * SHELL.s} height={66} rx={3}
                      fill={first ? colors.TEAL : colors.MUTED} fillOpacity={first ? 0.16 : 0.12}
                      stroke={first ? colors.TEAL : colors.GRID} strokeWidth={first ? 1.6 : 1} />
                  );
                }),
              )}
              {/* the dragged edge */}
              <line x1={shellX(fc.edge)} y1={SHELL.y + 26} x2={shellX(fc.edge)} y2={SHELL.y + 100} stroke={colors.TEAL} strokeWidth={2.6} />
              {dragU > 0.01 && (
                <g>
                  <line x1={shellX(targetEdge)} y1={SHELL.y + 22} x2={shellX(targetEdge)} y2={SHELL.y + 104} stroke={colors.WARM} strokeWidth={1.6} strokeDasharray="4 3" />
                  <circle cx={shellX(targetEdge)} cy={SHELL.y + 63} r={5} fill={colors.WARM} />
                </g>
              )}
              <text x={SHELL.x} y={SHELL.y + SHELL.h + 18} fill={colors.TEAL} fontSize={13} fontFamily={MONO}>
                {`first card's right edge ${fc.edge.toFixed(0)} px`}
              </text>
              {dragU > 0.01 && (
                <text x={SHELL.x + VIEW_W * SHELL.s} y={SHELL.y + SHELL.h + 18} textAnchor="end" fill={colors.WARM} fontSize={13} fontFamily={MONO} opacity={clamp01(dragU * 2)}>
                  {`drag +${DRAG_PX} → ${TARGET} px`}
                </text>
              )}
            </g>

            {/* the backward pass */}
            {backU > 0.01 && (
              <g>
                <path d={`M ${shellX(fc.edge)} ${SHELL.y + 24} C ${shellX(fc.edge) + 10} ${SHELL.y + 2}, ${PANEL_X0 - 70} ${SHELL.y + 2}, ${PANEL_X0 - 10} ${knobRowY(0) + 8}`}
                  fill="none" stroke={colors.TEAL} strokeWidth={2} strokeDasharray="6 4" pathLength={1}
                  style={{ strokeDasharray: `${backU} 1` }} />
                <text x={PANEL_X0} y={SHELL.y - 10} textAnchor="start" fill={colors.TEAL} fontSize={13} fontFamily={UI} opacity={clamp01(backU * 2 - 0.6)}>
                  one backward pass → a gradient per knob
                </text>
              </g>
            )}

            {/* five knobs */}
            {KNOB_NAMES.map((n, i) => {
              const u = clamp01(knobsU - i);
              if (u <= 0.01) return null;
              const y = knobRowY(i);
              const v = knobs[n];
              const tx = lerp(TRACK_X0, TRACK_X1, knobFrac(n, v));
              const g = GRAD[i];
              const live = Math.abs(g) > 1e-9;
              return (
                <g key={n} opacity={u}>
                  <text x={PANEL_X0} y={y} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                    {n}
                  </text>
                  <text x={PANEL_X1} y={y} textAnchor="end" fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>
                    {n === 'titleScale' ? v.toFixed(2) : v.toFixed(stepU > 0.01 && live ? 1 : 0)}
                  </text>
                  {gradU > 0.01 && (
                    <text x={PANEL_X0 + 148} y={y} fill={live ? colors.TEAL : colors.MUTED} fontSize={13} fontFamily={MONO} opacity={gradU}>
                      {`g ${g < 0 ? '−' : ''}${Math.abs(g).toFixed(2)}`}
                    </text>
                  )}
                  <line x1={TRACK_X0} y1={y + 12} x2={TRACK_X1} y2={y + 12} stroke={colors.GRID} strokeWidth={3} strokeLinecap="round" />
                  <circle cx={tx} cy={y + 12} r={5.5} fill={colors.ACCENT} />
                </g>
              );
            })}
            {fmlU > 0.01 && (
              <g opacity={fmlU}>
                <MathLabel tex={'k_i \\mathrel{+}= e\\,\\frac{g_i\\, s_i^{2}}{\\sum_j (g_j\\, s_j)^{2}}'} x={PANEL_X0} y={318} fontSize={17} anchor="start" boxWidth={240} opacity={fmlU} />
                <text x={PANEL_X1} y={312} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={UI}>
                  {`e = ${DRAG_PX} px`}
                </text>
                <text x={PANEL_X1} y={328} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={UI}>
                  s = max(|k|, floor)
                </text>
              </g>
            )}
            {stepU > 0.5 && (
              <text x={SHELL.x} y={SHELL.y + SHELL.h + 38} fill={colors.POSITIVE} fontSize={13} fontFamily={UI} opacity={clamp01(stepU * 2 - 1)}>
                {`one step: sidebar → ${STEPPED.sidebarOpenWidth.toFixed(1)}, gap → ${STEPPED.gap.toFixed(2)}`}
              </text>
            )}
          </g>
        )}

        {/* ======================== top-left: the decision plot ======================== */}
        {plotU > 0.005 && plotOp > 0.005 && (
          <g opacity={plotOp}>
            <line x1={PL.x0} y1={PL.y0} x2={lerp(PL.x0, PL.x1, plotU)} y2={PL.y0} stroke={colors.MUTED} strokeWidth={1.4} />
            <line x1={PL.x0} y1={PL.y0} x2={PL.x0} y2={lerp(PL.y0, PL.y1, plotU)} stroke={colors.MUTED} strokeWidth={1.4} />
            <g opacity={clamp01(plotU * 2 - 1)}>
              {[400, 500, 600, 700].map((e) => (
                <g key={e}>
                  <line x1={PL.x0} y1={ply(e)} x2={PL.x1} y2={ply(e)} stroke={colors.GRID} />
                  <text x={PL.x0 - 8} y={ply(e) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                    {e}
                  </text>
                </g>
              ))}
              {[120, 240, 360, 480].map((v) => (
                <text key={v} x={plx(v)} y={PL.y0 + 18} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                  {v}
                </text>
              ))}
              <text x={PL.x0} y={PL.y1 - 10} fill={colors.TEAL} fontSize={13} fontFamily={UI}>
                first card's right edge (px)
              </text>
              <text x={PL.x1} y={PL.y0 + 36} textAnchor="end" fill={colors.ACCENT} fontSize={13} fontFamily={MONO} opacity={1 - morphU}>
                sidebarOpenWidth (px)
              </text>
              <text x={PL.x1} y={PL.y0 + 36} textAnchor="end" fill={colors.ACCENT} fontSize={13} fontFamily={MONO} opacity={morphU}>
                minCardWidth (px)
              </text>
              <text x={PL.x0} y={PL.y0 + 36} fill={colors.MUTED} fontSize={12} fontFamily={UI}>
                other knobs authored · computed from reference.ts
              </text>
            </g>
            {curveU > 0.01 && <path d={curvePath} fill="none" stroke={colors.TEXT} strokeWidth={2.6} strokeLinejoin="round" />}
            {curveU > 0.99 && (
              <circle cx={plx(220)} cy={ply(START.edge)} r={5.5} fill={colors.ACCENT} stroke={colors.BG} strokeWidth={1.5} />
            )}
            {/* inside: the true slope */}
            {tanU > 0.01 && (
              <g opacity={tanU}>
                <line x1={plx(150)} y1={ply(START.edge - SLOPE_A * 70)} x2={plx(300)} y2={ply(START.edge + SLOPE_A * 80)} stroke={colors.POSITIVE} strokeWidth={4} opacity={0.5} />
                <text x={plx(132)} y={ply(640)} fill={colors.POSITIVE} fontSize={14} fontFamily={UI}>
                  {`inside: slope ${SLOPE_A.toFixed(2)}, the true slope`}
                </text>
              </g>
            )}
            {/* across: misleading */}
            {jumpU > 0.01 && (
              <g opacity={jumpU}>
                <line x1={plx(JUMP_S)} y1={ply(JUMP_LO)} x2={plx(420)} y2={ply(JUMP_LO + SLOPE_A * (420 - JUMP_S))} stroke={colors.NEGATIVE} strokeWidth={1.8} strokeDasharray="5 4" />
                <line x1={plx(JUMP_S) + 8} y1={ply(JUMP_LO)} x2={plx(JUMP_S) + 8} y2={ply(JUMP_HI)} stroke={colors.NEGATIVE} strokeWidth={1.6} />
                <text x={plx(JUMP_S) + 12} y={ply(JUMP_LO) + 24} fill={colors.NEGATIVE} fontSize={14} fontFamily={UI}>
                  {`across: 4 → 3 columns, a ${JUMP_PX} px jump`}
                </text>
                <text x={plx(JUMP_S) + 12} y={ply(JUMP_LO) + 42} fill={colors.NEGATIVE} fontSize={13} fontFamily={UI}>
                  the gradient can't see
                </text>
              </g>
            )}
            {/* B: zero */}
            {zeroU > 0.01 && (
              <g opacity={zeroU * (1 - targetU)}>
                <text x={plx(124)} y={ply(STEPS_B[0]) - 8} fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO}>
                  g = 0
                </text>
                <text x={plx(476)} y={ply(STEPS_B[STEPS_B.length - 1]) - 8} textAnchor="end" fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO}>
                  g = 0
                </text>
                <text x={plx(FLIP_M) + 8} y={ply(645)} fill={colors.NEGATIVE} fontSize={14} fontFamily={UI}>
                  flat: the gradient is zero
                </text>
                <text x={plx(FLIP_M) + 8} y={ply(645) + 18} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  {`3 columns once minCardWidth reaches ${Math.round(FLIP_M)}`}
                </text>
              </g>
            )}
            {/* B6: search */}
            {targetU > 0.01 && (
              <g opacity={targetU}>
                <line x1={PL.x0} y1={ply(SEARCH_TARGET)} x2={PL.x1} y2={ply(SEARCH_TARGET)} stroke={colors.WARM} strokeWidth={1.6} strokeDasharray="6 4" />
                <text x={PL.x0 + 6} y={ply(SEARCH_TARGET) - 8} fill={colors.WARM} fontSize={13} fontFamily={MONO}>
                  {`drag the edge to ${SEARCH_TARGET}`}
                </text>
                <text x={PL.x1} y={ply(SEARCH_TARGET) + 18} textAnchor="end" fill={colors.MUTED} fontSize={12} fontFamily={UI}>
                  minCardWidth alone unlocked (illustrative)
                </text>
                <text x={plx(220) + 10} y={ply(START.edge) + 20} fill={colors.NEGATIVE} fontSize={13} fontFamily={UI}>
                  g = 0: no step
                </text>
              </g>
            )}
            {nCand > 0 && (
              <g>
                {CANDS.slice(0, nCand).map((cand, i) => (
                  <g key={i}>
                    <line x1={plx(cand.m)} y1={PL.y0 + 2} x2={plx(cand.m)} y2={PL.y0 + 8} stroke={colors.WARM} strokeWidth={1} opacity={0.7} />
                    <circle cx={plx(cand.m)} cy={ply(cand.edge)} r={2} fill={colors.WARM} opacity={winU > 0.01 && i !== WIN ? 0.45 : 0.9} />
                  </g>
                ))}
                <text x={PL.x0 + 6} y={150} fill={colors.WARM} fontSize={14} fontFamily={UI}>
                  {`${nCand} candidates, instances of one circuit`}
                </text>
              </g>
            )}
            {winU > 0.01 && (
              <g opacity={clamp01(winU * 1.5)}>
                <circle cx={plx(CANDS[WIN].m)} cy={ply(CANDS[WIN].edge)} r={9 * (0.6 + 0.4 * winU)} fill="none" stroke={colors.POSITIVE} strokeWidth={2.4} />
                <text x={PL.x0 + 6} y={168} fill={colors.POSITIVE} fontSize={14} fontFamily={UI}>
                  {`closest valid: minCardWidth ${CANDS[WIN].m.toFixed(1)}`}
                </text>
                <text x={PL.x0 + 6} y={185} fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
                  {`${CANDS[WIN].c} columns · error ${WIN_ERR.toFixed(2)} px`}
                </text>
              </g>
            )}
          </g>
        )}

        {/* ======================== bottom-left: the frame waffles ======================== */}
        {(stripU > 0.005 || waffleU > 0.005) && wafOp > 0.005 && (
          <g opacity={wafOp}>
            {/* one drag = 6 frames: a strip that drops into the first row */}
            {stripU > 0.01 && stripU < 1.999 && (
              <g opacity={clamp01(stripU) * clamp01((2 - stripU) * 3)}>
                {Array.from({ length: 6 }, (_, i) => {
                  const fly = clamp01(stripU - 1);
                  const p0 = { x: 140 + i * 22, y: 352 };
                  const p1 = wPos(APP_W, i);
                  return <circle key={i} cx={lerp(p0.x, p1.x, fly)} cy={lerp(p0.y, p1.y, fly)} r={lerp(6, 1.8, fly)} fill={colors.MUTED} />;
                })}
                <text x={140 + 6 * 22 + 6} y={357} fill={colors.TEXT} fontSize={13} fontFamily={UI} opacity={1 - clamp01((stripU - 1) * 3)}>
                  one drag = 6 frames
                </text>
              </g>
            )}
            {/* app shell waffle */}
            <text x={APP_W.x} y={APP_W.y - 12} fill={onlyU > 0.01 ? colors.WARM : colors.MUTED} fontSize={13} fontFamily={UI} opacity={clamp01(waffleU * 4)}>
              {onlyU > 0.5 ? 'app shell only' : 'app shell'}
              {stratU > 0.01 && <tspan fill={colors.MUTED} opacity={stratU}> · strategy B, frozen booleans</tspan>}
            </text>
            {greenU > 0.01 && (
              <text x={APP_W.x + W_COLS * W_P} y={APP_W.y + 50 * W_P + 18} textAnchor="end" fill={colors.POSITIVE} fontSize={18} fontFamily={MONO} fontWeight={700}>
                {`${((appGreen / APP_MOVING) * 100).toFixed(1)}%`}
              </text>
            )}
            {roseU > 0.01 && (
              <text x={APP_W.x} y={APP_W.y + 50 * W_P + 18} fill={colors.NEGATIVE} fontSize={18} fontFamily={MONO} fontWeight={700}>
                {`${((appRose / APP_MOVING) * 100).toFixed(1)}%`}
              </text>
            )}
            <path d={appCls[0].join('')} fill={colors.MUTED} opacity={0.4} />
            <path d={appCls[1].join('')} fill={colors.POSITIVE} />
            <path d={appCls[2].join('')} fill={colors.NEGATIVE} />
            <path d={appCls[3].join('')} fill="none" stroke={colors.MUTED} strokeWidth={0.8} />

            {/* counters (B2–B3), replaced by the gallery waffle in B4 */}
            {cntOp > 0.01 && waffleU > 0.01 && (
              <g opacity={cntOp}>
                <text x={GAL_W.x} y={APP_W.y + 18} fill={colors.TEXT} fontSize={15} fontFamily={UI}>
                  500 drags × 6 frames
                </text>
                <text x={GAL_W.x} y={APP_W.y + 46} fill={colors.TEXT} fontSize={22} fontFamily={MONO} fontWeight={700}>
                  {`${fmtInt(appShown)} frames`}
                </text>
                {movingU > 0.01 && (
                  <g opacity={movingU}>
                    <text x={GAL_W.x} y={APP_W.y + 82} fill={colors.TEXT} fontSize={22} fontFamily={MONO} fontWeight={700}>
                      {`${fmtInt(APP_MOVING)} move`}
                    </text>
                    <text x={GAL_W.x} y={APP_W.y + 102} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                      target more than 0.5 px from the edge
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* candidate gallery waffle */}
            {galU > 0.01 && (
              <g>
                <text x={GAL_W.x} y={GAL_W.y - 12} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={clamp01(galU * 4)}>
                  candidate gallery · 250 drags × 6
                </text>
                <path d={galCls[0].join('')} fill={colors.MUTED} opacity={0.4} />
                <path d={galCls[1].join('')} fill={colors.POSITIVE} />
                {galGreenU > 0.01 && (
                  <text x={GAL_W.x + W_COLS * W_P} y={GAL_W.y + 25 * W_P + 20} textAnchor="end" fill={colors.POSITIVE} fontSize={18} fontFamily={MONO} fontWeight={700}>
                    {`${((galGreen / GAL_N) * 100).toFixed(1)}%`}
                  </text>
                )}
                <text x={GAL_W.x} y={GAL_W.y + 25 * W_P + 20} fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={clamp01(galU * 3 - 1)}>
                  {`${fmtInt(GAL_N)} moving`}
                </text>
              </g>
            )}

            {/* legend */}
            {greenU > 0.01 && (
              <g opacity={clamp01(greenU * 3)}>
                {[
                  { c: colors.POSITIVE, t: 'solved by 1 gradient step', on: 1 },
                  { c: colors.NEGATIVE, t: 'gradient 0 for every unlocked knob', on: roseU },
                  { c: colors.MUTED, t: 'other moving frames', on: 1, o: 0.4 },
                ].map((r, i) => (
                  <g key={i} opacity={clamp01(r.on * 3)}>
                    <rect x={GAL_W.x} y={530 + i * 20} width={10} height={10} fill={r.c} opacity={r.o ?? 1} />
                    <text x={GAL_W.x + 18} y={539 + i * 20} fill={colors.TEXT} fontSize={13} fontFamily={UI}>
                      {r.t}
                    </text>
                  </g>
                ))}
                <text x={GAL_W.x} y={603} fill={colors.MUTED} fontSize={12} fontFamily={UI}>
                  one dot per frame, sorted by outcome
                </text>
              </g>
            )}
          </g>
        )}

        {/* ======================== top-left: the takeaway (B13) ======================== */}
        {takeU > 0.01 && (
          <g>
            <text x={60} y={130} fill={colors.TEXT} fontSize={22} fontFamily={UI} fontWeight={600} opacity={clamp01(takeU * 2)}>
              A fixed circuit can write much of a UI
            </text>
            {[
              { t: 'by counting · instancing · matrix powers', c: colors.POSITIVE },
              { t: 'richer, not cheaper', c: colors.WARM },
              { t: 'learning it: still mostly open', c: colors.NEGATIVE },
            ].map((r, i) => (
              <Pill key={i} x={60} y={182 + i * 44} text={r.t} color={r.c} fs={15} op={clamp01((takeU - 1 - i) * 2)} />
            ))}
          </g>
        )}

        {/* ======================== right: the ledger ======================== */}
        <Card i={0} title="drag solver" stamp="NARROWED" stampColor={colors.WARM} stampU={stampU[0]} op={cardOp[0]} ledU={ledU}>
          {(() => {
            const { x, y } = cardXY(0);
            const u = bodyU[0];
            return (
              <g opacity={u}>
                <Bar x={x + 14} y={y + 62} w={COL_W - 28} frac={0.636 * clamp01(u)} color={colors.POSITIVE} label="app shell, 1 step" value="63.6% of 2,999" />
                <Bar x={x + 14} y={y + 100} w={COL_W - 28} frac={0.376 * clamp01(u)} color={colors.POSITIVE} label="candidate gallery" value="37.6% of 1,500" />
                <text x={x + 14} y={y + 134} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                  then search: 256 candidates as instances
                </text>
              </g>
            );
          })()}
        </Card>
        <Card i={1} title="ported UI logic" stamp="HELD" stampColor={colors.POSITIVE} stampU={stampU[1]} op={cardOp[1]} ledU={ledU}>
          {(() => {
            const { x, y } = cardXY(1);
            const pos = [
              { x: 14, y: 70 }, { x: 70, y: 70 }, { x: 146, y: 70 },
              { x: 14, y: 102 }, { x: 116, y: 102 },
            ];
            return (
              <g>
                <text x={x + 14} y={y + 46} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={clamp01(chipsShown * 2)}>
                  most of it became a circuit:
                </text>
                {PORTED.map((t, i) => (
                  <Pill key={t} x={x + pos[i].x} y={y + pos[i].y} text={t} color={colors.POSITIVE} op={clamp01((chipsShown - i) * 1.6)} />
                ))}
                <text x={x + 14} y={y + 134} fill={colors.MUTED} fontSize={12} fontFamily={UI} opacity={stampU[1]}>
                  each checked on its traces against a reference
                </text>
              </g>
            );
          })()}
        </Card>
        <Card i={2} title="combined wins" stamp="NARROWED" stampColor={colors.WARM} stampU={stampU[2]} op={cardOp[2]} ledU={ledU}>
          {(() => {
            const { x, y } = cardXY(2);
            const w = COL_W - 28;
            return (
              <g>
                {OPS.map((o, i) => {
                  const u = clamp01((opsU - i) * 1.4);
                  return (
                    <Bar key={i} x={x + 14} y={y + 56 + i * 29} w={w} frac={(o.v / OPS[0].v) * u} op={clamp01(u * 3)}
                      color={i === 2 ? colors.ACCENT : colors.WARM} label={o.label} value={`${fmtInt(o.v)} ops`} />
                  );
                })}
                <text x={x + 14} y={y + 135} fill={colors.WARM} fontSize={13} fontFamily={UI} opacity={stampU[2]}>
                  HandwiredOS · richer, not cheaper
                </text>
              </g>
            );
          })()}
        </Card>
        <Card i={3} title="learned bits" stamp="OPEN" stampColor={colors.NEGATIVE} stampU={stampU[3]} op={cardOp[3]} ledU={ledU}>
          {(() => {
            const { x, y } = cardXY(3);
            const u = bodyU[3];
            const n = Math.round(u * LEARN_RUNS);
            return (
              <g>
                {Array.from({ length: n }, (_, i) => (
                  <circle key={i} cx={x + 20 + (i % 16) * 11.6} cy={y + 52 + Math.floor(i / 16) * 13} r={4} fill="none" stroke={colors.MUTED} strokeWidth={1.4} />
                ))}
                <text x={x + COL_W - 14} y={y + 72} textAnchor="end" fill={colors.NEGATIVE} fontSize={22} fontFamily={MONO} fontWeight={700} opacity={clamp01(u * 2 - 1)}>
                  0/48
                </text>
                <text x={x + 14} y={y + 102} fill={colors.TEXT} fontSize={13} fontFamily={UI} opacity={clamp01(u * 2 - 1)}>
                  runs learned a task exactly, base settings
                </text>
                {extraU[3] > 0.01 && (
                  <g opacity={extraU[3]}>
                    <circle cx={x + 20} cy={y + 128} r={4} fill={colors.POSITIVE} />
                    <text x={x + 32} y={y + 132} fill={colors.POSITIVE} fontSize={13} fontFamily={UI}>
                      counting units, every case: one rung
                    </text>
                  </g>
                )}
              </g>
            );
          })()}
        </Card>
        <Card i={4} title="spring timing" stamp="NARROWED" stampColor={colors.WARM} stampU={stampU[4]} op={cardOp[4]} ledU={ledU}>
          {(() => {
            const { x, y } = cardXY(4);
            const u = bodyU[4];
            const gx = (t: number) => x + 14 + (t / 0.7) * 146;
            const gy = (v: number) => y + 86 - v * 24;
            const n = Math.max(2, Math.round(u * SPRING_30.length));
            const path = (pts: [number, number][]) => pts.slice(0, n).map(([t, v], i) => `${i ? 'L' : 'M'}${gx(t).toFixed(1)} ${gy(v).toFixed(1)}`).join('');
            const labU = clamp01(u * 2 - 1);
            return (
              <g>
                <text x={x + 14} y={y + 46} fill={colors.MUTED} fontSize={12} fontFamily={UI} opacity={clamp01(u * 3)}>
                  chenguini's demos · curves schematic
                </text>
                {u > 0.01 && (
                  <g>
                    <line x1={gx(0.24)} y1={y + 54} x2={gx(0.24)} y2={y + 110} stroke={colors.MUTED} strokeDasharray="3 3" />
                    <path d={path(SPRING_120)} fill="none" stroke={colors.ACCENT} strokeWidth={2} />
                    <path d={path(SPRING_30)} fill="none" stroke={colors.WARM} strokeWidth={2} />
                    <text x={gx(0.24) + 4} y={y + 120} fill={colors.MUTED} fontSize={12} fontFamily={UI} opacity={labU}>
                      new destination
                    </text>
                    <text x={x + COL_W - 14} y={y + 64} textAnchor="end" fill={colors.WARM} fontSize={12} fontFamily={MONO} opacity={labU}>
                      30 fps
                    </text>
                    <text x={x + COL_W - 14} y={y + 80} textAnchor="end" fill={colors.ACCENT} fontSize={12} fontFamily={MONO} opacity={labU}>
                      120 fps
                    </text>
                    <text x={x + COL_W - 14} y={y + 104} textAnchor="end" fill={colors.TEXT} fontSize={15} fontFamily={MONO} fontWeight={700} opacity={labU}>
                      157 px apart
                    </text>
                  </g>
                )}
                {extraU[4] > 0.01 && (
                  <text x={x + 14} y={y + 136} fill={colors.POSITIVE} fontSize={13} fontFamily={UI} opacity={extraU[4]}>
                    runtime now: steps to each event's time
                  </text>
                )}
              </g>
            );
          })()}
        </Card>
        <Card i={5} title="0 mismatches" stamp="NARROWED" stampColor={colors.WARM} stampU={stampU[5]} op={cardOp[5]} ledU={ledU}>
          {(() => {
            const { x, y } = cardXY(5);
            const u = bodyU[5];
            const e = extraU[5];
            const flips = Math.round(clamp01(e * 1.6) * LIST_FLIPS);
            return (
              <g opacity={u}>
                <text x={x + 14} y={y + 50} fill={colors.TEXT} fontSize={13} fontFamily={UI}>
                  means over the traces named, not a proof
                </text>
                {e > 0.01 && (
                  <g>
                    <text x={x + 14} y={y + 76} fill={colors.MUTED} fontSize={12} fontFamily={UI}>
                      lists, 100 cards · 20 runs
                    </text>
                    {Array.from({ length: LIST_RUNS }, (_, i) => (
                      <circle key={i} cx={x + 20 + i * 12.9} cy={y + 92} r={4.5} fill={i < flips ? colors.NEGATIVE : 'none'}
                        stroke={i < flips ? colors.NEGATIVE : colors.MUTED} strokeWidth={1.4} />
                    ))}
                    <text x={x + 14} y={y + 116} fill={colors.NEGATIVE} fontSize={13} fontFamily={UI} opacity={clamp01(e * 2 - 0.6)}>
                      {`${LIST_FLIPS} of ${LIST_RUNS} flipped a settle decision`}
                    </text>
                    <text x={x + 14} y={y + 135} fill={colors.NEGATIVE} fontSize={13} fontFamily={UI} opacity={clamp01(e * 2 - 1)}>
                      positions then up to 21 px apart
                    </text>
                  </g>
                )}
              </g>
            );
          })()}
        </Card>

        {/* status strip */}
        {statusU > 0.01 && (
          <g opacity={statusU}>
            <rect x={STATUS.x} y={STATUS.y} width={STATUS.w} height={STATUS.h} rx={8} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.2} strokeOpacity={0.6} />
            <Stamp x={STATUS.x + 14} y={STATUS.y + STATUS.h / 2} text="RECORD" color={colors.TEAL} u={statusStampU} anchor="start" />
            <text x={STATUS.x + 112} y={STATUS.y + 26} fill={colors.TEXT} fontSize={14} fontFamily={UI}>
              lab/status.md: the record of that exploration
            </text>
            <text x={STATUS.x + 112} y={STATUS.y + 46} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={statusLineU}>
              its measurements describe the code as it was then
            </text>
            <Pill x={STATUS.x + 112} y={STATUS.y + 74} text="index reads: landed" color={colors.POSITIVE} fs={12} op={landedU} />
            <Pill x={STATUS.x + 268} y={STATUS.y + 74} text="what agents build apps from: open" color={colors.NEGATIVE} fs={12} op={openU} />
          </g>
        )}
      </Camera>

      {/* ======================== screen-space: title band ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={76} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        3 · What Held, What Narrowed
      </text>
      <text x={40} y={58} fill={colors.TEAL} fontSize={13} fontFamily={MONO}>
        {kicker}
      </text>
      <rect x={0} y={STAGE_H - 1} width={1} height={1} fill="none" />
    </>
  );
}

export const vizScene = () => scene;
