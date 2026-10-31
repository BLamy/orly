// Real circuits, honest limits
//
// Runtime Cost — chapter 3. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   src/handwiredos/README.md:13 (234 sources, 4,646 live operations, 130 layers)
//   src/runtime/numeric-ui-core.ts:824 (one layer per depth), :751-754, :770-778 (full array vs reusable buffers)
//   lab/runtime-cost/report.ts:12-25 (the select(...) copy loop wraps reference and full array only), :59-70
//     (the coordinate transform: 4 operations), :72-73 (candidate gallery, window manager)
//   lab/runtime-cost/README.md:5 (not events, GPU, compilation or browser frames), :9 (rerun locally; no single
//     ratio is a guarantee), :11 (one process can distort later timings), :13 (about 10 µs per 1,000 layers, M5 Max,
//     load about 4)
//   lab/status.md:160 (the layer probe), :230 (createTensorEvaluator, CPU), :256 (layer scheduling parked)
//   Research note runs (.orly-work/hw-books/inputs/runtime-cost.md): run 2 (report.ts medians, M4 Max, load ≈ 9),
//     run 5 (window manager alone: 47.47 µs, 39.44 to 73.70), run 6 (first and last widths, sum 4,646)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim).
//
// The layer widths are REAL: all 130 (window manager), 60 (candidate gallery) and 3 (coordinate transform) were
// read from compileTensorProgram(...).layers[i].outputSize at the pin by a scratch probe outside the repo
// (.orly-work/hw-books/handwired-runtime-cost/ch3/widths.ts, widths2.ts), and the module checks them against the
// research note (first 8, last 4, sum 4,646, median 26.5) and report.ts's counts (417 live, 60 layers; 4 ops,
// 3 layers). Ratios are computed below from the run-2 medians. Corrections from review.md: the median line reads
// 26.5 (not 27) and the third status stamp reads ONE RUN (not HISTORICAL). The 167 and 143 columns in the middle
// of the skyline are drawn as measured even though the captions only name the 133 near the end.
import { CAMERA_HOME, Camera, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH13 = 7.83; // mono advance at 13 px

// ---------------------------------------------------------------------------
// Real data (module scope, checked)
// ---------------------------------------------------------------------------

const WM_WIDTHS = [
  401, 214, 90, 94, 52, 10, 7, 15, 10, 14, 11, 9, 11, 10, 7, 32, 68, 71, 67, 14, 14, 11, 9, 43, 53, 59, 40, 24, 10, 8,
  4, 4, 3, 7, 3, 6, 3, 4, 6, 18, 18, 26, 44, 51, 48, 44, 40, 51, 31, 18, 11, 21, 45, 46, 45, 32, 35, 30, 38, 24, 24,
  41, 35, 31, 29, 33, 33, 25, 9, 45, 27, 17, 24, 25, 37, 48, 48, 33, 38, 44, 50, 20, 20, 84, 83, 77, 143, 71, 6, 5, 5,
  3, 3, 3, 2, 2, 2, 2, 2, 3, 5, 6, 9, 29, 4, 14, 15, 51, 41, 167, 117, 43, 30, 31, 17, 17, 15, 16, 51, 27, 31, 40, 41,
  28, 29, 50, 25, 26, 133, 72,
];
const GAL_WIDTHS = [
  10, 20, 8, 8, 11, 11, 5, 5, 5, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 2, 1, 1, 1, 3, 3, 21, 8, 66, 20, 20, 20, 12, 12, 12, 24,
  12, 6, 6, 6, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 2, 3, 5, 4, 2, 1, 1, 1, 12, 12,
];
const COORD_WIDTHS = [1, 2, 1];

const N_LAYERS = WM_WIDTHS.length;
const SUM = WM_WIDTHS.reduce((a, b) => a + b, 0);
const SORTED = [...WM_WIDTHS].sort((a, b) => a - b);
const MEDIAN = (SORTED[N_LAYERS / 2 - 1] + SORTED[N_LAYERS / 2]) / 2;
const WM_MAX = SORTED[N_LAYERS - 1];
const PROBE_LAYERS = 16_384; // layers.ts: the tallest of the three probes
{
  const want = (cond: boolean, what: string) => {
    if (!cond) throw new Error(`runtime-cost ch3: ${what}`);
  };
  want(N_LAYERS === 130 && SUM === 4646 && MEDIAN === 26.5, 'window manager shape');
  want(WM_WIDTHS.slice(0, 8).join() === '401,214,90,94,52,10,7,15', 'first 8 widths');
  want(WM_WIDTHS.slice(-4).join() === '25,26,133,72', 'last 4 widths');
  want(GAL_WIDTHS.length === 60 && GAL_WIDTHS.reduce((a, b) => a + b, 0) === 417, 'gallery shape');
  want(COORD_WIDTHS.length === 3 && COORD_WIDTHS.reduce((a, b) => a + b, 0) === 4, 'coordinate shape');
}
const SPIKE = N_LAYERS - 2; // the 133 near the end
const THIN = { from: 88, to: 101 }; // the thinnest stretch: widths 2 to 9

// report.ts medians, research run 2 (µs per evaluation)
type RunnerKey = 'direct' | 'reference' | 'full' | 'reusable';
const RUNNER: Record<RunnerKey, { label: string; color: string }> = {
  direct: { label: 'direct scalar JS', color: colors.TEAL },
  reference: { label: 'reference', color: colors.SECONDARY },
  full: { label: 'full array', color: colors.ACCENT },
  reusable: { label: 'reusable', color: colors.POSITIVE },
};
type Row = { name: string; meta: string; widths: number[]; ns: boolean; t: Partial<Record<RunnerKey, number>> };
const ROWS: Row[] = [
  {
    name: 'coordinate transform', meta: '4 ops · 3 layers', widths: COORD_WIDTHS, ns: true,
    t: { direct: 0.028630409999999957, reference: 0.09305915999999996, full: 0.11955792000000003, reusable: 0.07824124999999996 },
  },
  {
    name: 'candidate gallery', meta: '463 ops · 417 live · 60 layers', widths: GAL_WIDTHS, ns: false,
    t: { reference: 18.96324999999996, full: 4.6469999999999905, reusable: 3.18312499999999 },
  },
  {
    name: 'window manager', meta: '4,646 live ops · 130 layers', widths: WM_WIDTHS, ns: false,
    t: { reference: 149.65083400000003, full: 49.480334000000305, reusable: 42.808915999999954 },
  },
];
const RATIOS = ROWS.map((r) => r.t.full! / r.t.reusable!);
if (RATIOS.map((r) => r.toFixed(2)).join() !== '1.53,1.46,1.16') throw new Error('runtime-cost ch3: ratios');
const fmtT = (row: Row, v: number): string => (row.ns ? `${+(v * 1000).toFixed(1)} ns` : `${v.toFixed(2)} µs`);
// run 5: the window manager alone, reusable roots, median of 7
const ALONE = { median: 47.47, lo: 39.44, hi: 73.7 };
const SHARED = ROWS[2].t.reusable!;

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band; y < 76 is the header)
// ---------------------------------------------------------------------------

type SkyL = { x0: number; pitch: number; colW: number; base: number; sy: number };
const L_FULL: SkyL = { x0: 85, pitch: 8.4, colW: 6, base: 560, sy: 0.9 };
const LX = 90; // row thumbnails
const THUMB_W = 180;
const THUMB_H = 48;
const ROW_Y = [222, 360, 492];
const L_ROW: SkyL = { x0: LX, pitch: (THUMB_W - 1) / (N_LAYERS - 1), colW: 1, base: ROW_Y[2] + 40, sy: THUMB_H / WM_MAX };
const L_TILE: SkyL = { x0: 868, pitch: 300 / (N_LAYERS - 1), colW: 1.5, base: 440, sy: 196 / WM_MAX };
const skyAt = (p: number): SkyL => {
  const [a, b, u] = p <= 1 ? [L_FULL, L_ROW, p] : [L_ROW, L_TILE, p - 1];
  return { x0: lerp(a.x0, b.x0, u), pitch: lerp(a.pitch, b.pitch, u), colW: lerp(a.colW, b.colW, u), base: lerp(a.base, b.base, u), sy: lerp(a.sy, b.sy, u) };
};
const FULL_W = (N_LAYERS - 1) * L_FULL.pitch + L_FULL.colW; // also the 16,384-toll bar
const TICK_H = 22;
const LONG_Y = 440;

// shared log axis: 10 ns … 1 ms
const AX = { x0: 330, x1: 1170, y: 588 };
const DEC = (AX.x1 - AX.x0) / 5;
const lx = (us: number): number => AX.x0 + (Math.log10(us) + 2) * DEC;
const AX_TICKS = [
  { us: 0.01, label: '10 ns' },
  { us: 0.1, label: '100 ns' },
  { us: 1, label: '1 µs' },
  { us: 10, label: '10 µs' },
  { us: 100, label: '100 µs' },
  { us: 1000, label: '1 ms' },
];
const laneOffsets = (row: Row): [RunnerKey, number][] => {
  const keys = (['direct', 'reference', 'full', 'reusable'] as RunnerKey[]).filter((k) => row.t[k] !== undefined);
  const gap = 18;
  return keys.map((k, i) => [k, (i - (keys.length - 1) / 2) * gap]);
};
const RATIO_X = 1196;

// report.ts:12-25 (verbatim; the sample loop between them elided)
const CODE = [
  'const select = (evaluate: Runner): Runner => {',
  '  const output = new Float32Array(roots.length)',
  '  return input => {',
  '    const values = evaluate(input)',
  '    for (let index = 0; index < roots.length; index++) output[index] = values[roots[index]!]!',
  '    return output',
  '  }',
  '}',
  "['reference', select(input => circuit.evaluateReference(input))],",
  "['tensor full array', select(input => circuit.evaluateTensor(input))],",
  "['tensor reusable roots', circuit.createTensorEvaluator(roots)],",
];
const CODE_BOX = { x: 90, y: 168, lh: 18 };
const CODE_W = Math.max(...CODE.map((l) => l.length)) * CH13 + 28;
const CODE_H = CODE.length * CODE_BOX.lh + 16;
const codeY = (i: number): number => CODE_BOX.y + 8 + CODE_BOX.lh * (i + 1) - 4;

// process panel (B8)
const PROC = { x: 150, y: 128, w: 980, h: 300 };
const PAX = { x0: 210, x1: 1070, y: 360, lo: 35, hi: 80 };
const px = (us: number): number => PAX.x0 + ((us - PAX.lo) * (PAX.x1 - PAX.x0)) / (PAX.hi - PAX.lo);

// status board (B9–B10)
const BOARD = { x: 170, y: 108, w: 940, h: 476 };
const STATUS = [
  { id: 'createTensorEvaluator(roots)', what: 'reusable buffers · holds as an interface · CPU only', stamp: 'HOLDS', color: colors.POSITIVE },
  { id: 'layers.ts', what: 'the layer probe · narrowed to a local figure at a stated load', stamp: 'NARROWED', color: colors.WARM },
  { id: 'report.ts', what: 'three-way absolute timings · one run, not a standing result', stamp: 'ONE RUN', color: colors.SECONDARY },
  { id: 'layer scheduling', what: 'latest-legal scheduling increased gathered inputs', stamp: 'PARKED', color: colors.NEGATIVE },
];
const STATUS_Y = (i: number): number => 186 + i * 80;
const NOT_MEASURED = ['events', 'GPU execution', 'compilation', 'browser frames'];

// recap tiles (B11)
const TILES = [
  { x: 90, title: 'a call allocates or reuses' },
  { x: 479, title: 'a layer costs time by itself' },
  { x: 868, title: 'wide · thin · swells near the end' },
];
const TILE = { y: 150, w: 322, h: 330 };

const CAM_LEFT: CameraState = { x: 430, y: 392, k: 1.25 };
const CAM_RIGHT: CameraState = { x: 880, y: 392, k: 1.25 };
const CAM_GAL: CameraState = { x: 650, y: 400, k: 1.08 };
const CAM_COORD: CameraState = { x: 650, y: 362, k: 1.08 };
const CAM_PROC: CameraState = { x: 640, y: 318, k: 1.1 };
const CAM_BOARD: CameraState = { x: 640, y: 346, k: 1.06 };

// ---------------------------------------------------------------------------
// Timeline — eleven fixed captions, each timed at about 150 words per minute
// ---------------------------------------------------------------------------

const speakDur = (text: string): number => +(text.split(/\s+/).length / 2.5 + 0.4).toFixed(1);

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  // the skyline (the persistent machine)
  const baseU = tl.channel('baseU', 0);
  const riseU = tl.channel('riseU', 0); // 0 … 130 columns risen (the cursor)
  const cursorOp = tl.channel('cursorOp', 1);
  const hlFirst = tl.channel('hlFirst', 0);
  const hlSixth = tl.channel('hlSixth', 0);
  const first8U = tl.channel('first8U', 0);
  const hlSpike = tl.channel('hlSpike', 0);
  const last4U = tl.channel('last4U', 0);
  const medU = tl.channel('medU', 0);
  const sumU = tl.channel('sumU', 0); // 0 … 3 summary pieces
  const skyLabelsOp = tl.channel('skyLabelsOp', 1);
  const combU = tl.channel('combU', 0);
  const squeezeU = tl.channel('squeezeU', 0);
  const longU = tl.channel('longU', 0);
  const tollU = tl.channel('tollU', 0);
  const skyPos = tl.channel('skyPos', 0); // 0 full · 1 row thumbnail · 2 recap tile
  const skyOp = tl.channel('skyOp', 1);
  // the timing rows
  const axisU = tl.channel('axisU', 0);
  const legendU = tl.channel('legendU', 0);
  const scopeU = tl.channel('scopeU', 0);
  const rowU = [tl.channel('rowCoordU', 0), tl.channel('rowGalU', 0), tl.channel('rowWmU', 0)];
  const dotsU = [tl.channel('dotsCoordU', 0), tl.channel('dotsGalU', 0), tl.channel('dotsWmU', 0)];
  const rowOp = [tl.channel('opCoord', 1), tl.channel('opGal', 1), tl.channel('opWm', 1)];
  const ratioU = tl.channel('ratioU', 0); // 0 … 3 chips
  const ratiosOp = tl.channel('ratiosOp', 1);
  const rowsOp = tl.channel('rowsOp', 1);
  // B7 harness
  const codeU = tl.channel('codeU', 0);
  const codeHiU = tl.channel('codeHiU', 0);
  const copyU = tl.channel('copyU', 0);
  const gapU = tl.channel('gapU', 0);
  // B8 process
  const procU = tl.channel('procU', 0);
  const procDotsU = tl.channel('procDotsU', 0);
  const noiseU = tl.channel('noiseU', 0);
  const quoteU = tl.channel('quoteU', 0);
  // B9–B10 board
  const boardU = tl.channel('boardU', 0);
  const stampU = tl.channel('stampU', 0); // 0 … 4 rows
  const notU = tl.channel('notU', 0);
  // B11 recap
  const tilesU = tl.channel('tilesU', 0); // 0 … 3
  const recapMarksU = tl.channel('recapMarksU', 0);
  const closeU = tl.channel('closeU', 0);

  let t = 0.4;
  const say = (text: string): number => {
    const at = t;
    const dur = speakDur(text);
    tl.caption({ at, dur, text });
    t = tl.hold(at + dur, 0.7);
    return at;
  };
  const fade = (ch: Parameters<typeof tl.tween>[0], to: number, at: number, dur = 0.6) => tl.tween(ch, to, { at, dur, ease: ease.move });

  // — B1 · the skyline rises; first layer 401, sixth layer 10 —
  let a = say(
    'Back to a real program. The window manager is neither tall nor wide: its first layer holds four hundred one operations, and by the sixth layer it is down to ten.',
  );
  tl.tween(baseU, 1, { at: a + 0.1, dur: 1.0, ease: ease.draw });
  tl.tween(riseU, N_LAYERS, { at: a + 0.6, dur: 4.4, ease: ease.linear });
  fade(cursorOp, 0, a + 5.2);
  tl.tween(cam, CAM_LEFT, { at: a + 5.4, dur: 1.4, ease: ease.move });
  tl.tween(hlFirst, 1, { at: a + 6.4, dur: 0.6, ease: ease.pop });
  tl.tween(first8U, 1, { at: a + 7.4, dur: 0.7, ease: ease.enter });
  tl.tween(hlSixth, 1, { at: a + 9.6, dur: 0.6, ease: ease.pop });

  // — B2 · swells to 133 near the end; median 26.5; total 4,646 —
  a = say(
    'Near the end it swells again to one hundred thirty-three. The median layer holds twenty-six and a half operations, and all the widths add up to four thousand six hundred forty-six.',
  );
  tl.tween(cam, CAM_RIGHT, { at: a, dur: 1.5, ease: ease.move });
  fade(hlFirst, 0, a);
  fade(hlSixth, 0, a);
  fade(first8U, 0, a);
  tl.tween(hlSpike, 1, { at: a + 1.3, dur: 0.6, ease: ease.pop });
  tl.tween(last4U, 1, { at: a + 1.9, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: a + 4.0, dur: 1.4, ease: ease.move });
  fade(last4U, 0, a + 4.0);
  tl.tween(sumU, 1, { at: a + 4.6, dur: 0.5, ease: ease.enter });
  tl.tween(medU, 1, { at: a + 5.4, dur: 1.4, ease: ease.draw });
  tl.tween(sumU, 2, { at: a + 5.8, dur: 0.5, ease: ease.enter });
  tl.tween(sumU, 3, { at: a + 8.6, dur: 0.6, ease: ease.pop });

  // — B3 · 130 layer tolls, not 16,384 —
  a = say(
    'So the layer toll is paid one hundred thirty times here, not sixteen thousand. That may be part of why the real circuit sits so far from the worst case.',
  );
  fade(hlSpike, 0, a);
  fade(medU, 0, a);
  fade(skyLabelsOp, 0, a);
  tl.tween(combU, 1, { at: a + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(tollU, 1, { at: a + 1.0, dur: 0.6, ease: ease.enter });
  tl.tween(longU, 1, { at: a + 2.6, dur: 1.5, ease: ease.draw });
  tl.tween(squeezeU, 1, { at: a + 3.2, dur: 1.5, ease: ease.move });
  tl.tween(tollU, 2, { at: a + 5.0, dur: 0.6, ease: ease.pop });
  tl.tween(tollU, 3, { at: a + 7.6, dur: 0.8, ease: ease.draw });

  // — B4 · the skyline shrinks into its row; the candidate gallery —
  a = say(
    'Two smaller circuits show the same ordering. On the candidate gallery, the reference takes nineteen microseconds, the full array four point six five, and reusable three point one eight.',
  );
  fade(tollU, 0, a, 0.5);
  fade(longU, 0, a, 0.5);
  // the comb flies into the window manager's row, unfolding back into its real widths on the way
  tl.tween(squeezeU, 0, { at: a + 0.3, dur: 1.5, ease: ease.move });
  tl.tween(combU, 0, { at: a + 0.5, dur: 1.5, ease: ease.move });
  tl.tween(skyPos, 1, { at: a + 0.3, dur: 1.5, ease: ease.move });
  tl.tween(rowU[2], 1, { at: a + 1.8, dur: 0.7, ease: ease.enter });
  tl.tween(axisU, 1, { at: a + 2.0, dur: 1.2, ease: ease.draw });
  tl.tween(legendU, 1, { at: a + 2.2, dur: 0.6, ease: ease.enter });
  tl.tween(scopeU, 1, { at: a + 2.2, dur: 0.6, ease: ease.enter });
  tl.tween(dotsU[2], 1, { at: a + 2.8, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_GAL, { at: a + 3.4, dur: 1.3, ease: ease.move });
  fade(rowOp[2], 0.15, a + 4.0);
  tl.tween(rowU[1], 1, { at: a + 4.0, dur: 0.7, ease: ease.enter });
  tl.tween(dotsU[1], 1, { at: a + 5.4, dur: 2.4, ease: ease.linear });

  // — B5 · the coordinate transform; plain scalar code wins —
  a = say(
    'The tiny coordinate transform, four operations in three layers, gains little: ninety-three nanoseconds for the reference, seventy-eight reusable. Plain scalar code beats them all, at twenty-nine.',
  );
  tl.tween(cam, CAM_COORD, { at: a, dur: 1.3, ease: ease.move });
  fade(rowOp[1], 0.15, a + 0.4);
  tl.tween(rowU[0], 1, { at: a + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(dotsU[0], 0.75, { at: a + 2.6, dur: 3.6, ease: ease.linear }); // reference, full, reusable
  tl.tween(dotsU[0], 1, { at: a + 8.2, dur: 0.8, ease: ease.pop }); // the direct scalar line lands last

  // — B6 · three ratio chips, ordered by size —
  a = say(
    'Reusable beats full array by one point five three times there, one point four six on the gallery, and one point one six on the window manager. In this one run, the smallest circuit gains most.',
  );
  tl.tween(cam, CAMERA_HOME, { at: a, dur: 1.3, ease: ease.move });
  fade(rowOp[1], 1, a);
  fade(rowOp[2], 1, a);
  tl.tween(gapU, 1, { at: a + 0.6, dur: 0.8, ease: ease.draw });
  tl.tween(ratioU, 1, { at: a + 1.0, dur: 0.5, ease: ease.pop });
  tl.tween(ratioU, 2, { at: a + 3.4, dur: 0.5, ease: ease.pop });
  tl.tween(ratioU, 3, { at: a + 5.6, dur: 0.5, ease: ease.pop });

  // — B7 · the harness's extra copy loop —
  a = say(
    "One caveat hides in the harness: the reference and full-array runners copy their outputs in an extra loop, and the reusable runner doesn't. Part of the gap is that copy.",
  );
  fade(rowOp[0], 0.06, a);
  fade(rowOp[1], 0.06, a);
  fade(ratiosOp, 0.12, a);
  fade(legendU, 0.1, a);
  tl.tween(codeU, 1, { at: a + 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(codeHiU, 1, { at: a + 1.6, dur: 0.8, ease: ease.enter });
  tl.tween(codeHiU, 2, { at: a + 3.6, dur: 0.8, ease: ease.enter });
  tl.tween(copyU, 1, { at: a + 6.0, dur: 0.7, ease: ease.pop });
  tl.tween(gapU, 2, { at: a + 9.0, dur: 0.6, ease: ease.enter });

  // — B8 · one process vs its own process —
  a = say(
    'The readme warns that timing several programs in one process can distort later timings. A standalone check here landed within noise of the shared run, so we could not confirm it.',
  );
  fade(codeU, 0, a);
  fade(copyU, 0, a);
  fade(gapU, 1, a);
  fade(rowsOp, 0.1, a);
  fade(ratiosOp, 0, a);
  tl.tween(cam, CAM_PROC, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(quoteU, 1, { at: a + 0.5, dur: 0.7, ease: ease.enter });
  tl.tween(procU, 1, { at: a + 3.0, dur: 0.8, ease: ease.enter });
  tl.tween(procDotsU, 1, { at: a + 4.4, dur: 1.4, ease: ease.draw });
  tl.tween(noiseU, 1, { at: a + 7.4, dur: 0.6, ease: ease.pop });
  tl.tween(quoteU, 2, { at: a + 10.0, dur: 0.6, ease: ease.enter });

  // — B9 · the status board —
  a = say(
    'Status, plainly. Reusable buffers hold as an interface, on the CPU only. The layer probe is narrowed to a local figure at a stated load. The three-way absolute timings are one run, not a standing result.',
  );
  fade(procU, 0, a);
  fade(procDotsU, 0, a);
  fade(noiseU, 0, a);
  fade(quoteU, 0, a);
  fade(skyOp, 0.1, a);
  fade(scopeU, 0, a);
  tl.tween(cam, CAM_BOARD, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(boardU, 1, { at: a + 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(stampU, 1, { at: a + 2.0, dur: 0.5, ease: ease.pop });
  tl.tween(stampU, 2, { at: a + 5.6, dur: 0.5, ease: ease.pop });
  tl.tween(stampU, 3, { at: a + 9.6, dur: 0.5, ease: ease.pop });

  // — B10 · not measured; scheduling parked —
  a = say(
    'Not measured: events, graphics processors, compilation, or browser frames. Smarter layer scheduling is parked, because the latest-legal version increased gathered inputs.',
  );
  tl.tween(notU, 1, { at: a + 0.3, dur: 1.4, ease: ease.linear });
  tl.tween(stampU, 4, { at: a + 4.0, dur: 0.5, ease: ease.pop });

  // — B11 · recap on a clean stage; the skyline becomes the third tile —
  a = say(
    'To recap: a call can allocate or reuse, a layer costs about ten microseconds per thousand, and real circuits are wide at first, thin in the middle, and swell near the end. Rerun locally before trusting any one ratio.',
  );
  fade(boardU, 0, a, 0.8);
  fade(rowsOp, 0, a, 0.8);
  fade(axisU, 0, a, 0.8);
  fade(legendU, 0, a, 0.8);
  tl.tween(cam, CAMERA_HOME, { at: a, dur: 1.5, ease: ease.move });
  tl.tween(tilesU, 1, { at: a + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(tilesU, 2, { at: a + 3.0, dur: 0.7, ease: ease.enter });
  tl.tween(skyOp, 1, { at: a + 5.2, dur: 0.6, ease: ease.move });
  tl.tween(tilesU, 3, { at: a + 5.2, dur: 0.7, ease: ease.enter });
  tl.tween(skyPos, 2, { at: a + 5.2, dur: 1.5, ease: ease.move });
  tl.tween(recapMarksU, 1, { at: a + 7.0, dur: 2.0, ease: ease.linear });
  tl.tween(closeU, 1, { at: a + 11.6, dur: 0.8, ease: ease.enter });
  tl.hold(t, 1.8);

  return {
    tl, cam,
    baseU, riseU, cursorOp, hlFirst, hlSixth, first8U, hlSpike, last4U, medU, sumU, skyLabelsOp,
    combU, squeezeU, longU, tollU, skyPos, skyOp,
    axisU, legendU, scopeU, rowU, dotsU, rowOp, ratioU, ratiosOp, rowsOp,
    codeU, codeHiU, copyU, gapU,
    procU, procDotsU, noiseU, quoteU,
    boardU, stampU, notU,
    tilesU, recapMarksU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyphs
// ---------------------------------------------------------------------------

function Chip({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start', mono = false, fill = colors.PANEL }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; fill?: string;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (mono ? (fs * CH13) / 13 : fs * 0.56) + 20;
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - fs - 4} width={w} height={fs + 12} rx={7} fill={fill} stroke={color} strokeWidth={1.2} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fill={color} fontSize={fs} fontFamily={mono ? MONO : UI}>
        {text}
      </text>
    </g>
  );
}

function Stamp({ x, y, text, color, u }: { x: number; y: number; text: string; color: string; u: number }) {
  if (u <= 0.01) return null;
  const k = 1.5 - 0.5 * clamp01(u);
  const w = text.length * 13 + 30;
  return (
    <g opacity={clamp01(u * 1.5)} transform={`translate(${x} ${y}) rotate(-5) scale(${k})`}>
      <rect x={-w / 2} y={-19} width={w} height={38} rx={5} fill={colors.BG} stroke={color} strokeWidth={2.5} />
      <rect x={-w / 2 + 4} y={-15} width={w - 8} height={30} rx={3} fill="none" stroke={color} strokeWidth={1} opacity={0.6} />
      <text x={0} y={7} textAnchor="middle" fill={color} fontSize={19} fontFamily={MONO} fontWeight={700} letterSpacing={2}>
        {text}
      </text>
    </g>
  );
}

function LoopGlyph({ x, y, color, s = 1 }: { x: number; y: number; color: string; s?: number }) {
  const r = 6 * s;
  return (
    <g stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round">
      <path d={`M ${x + r} ${y} A ${r} ${r} 0 1 1 ${x} ${y - r}`} />
      <polygon points={`${x - 1},${y - r - 3.5} ${x + 4},${y - r} ${x - 1},${y - r + 3.5}`} fill={color} stroke="none" />
    </g>
  );
}

/** Columns of one circuit's real layer widths. */
function Columns({ widths, L, color, opacity = 1, heightU, comb = 0, squeeze = 1, hl }: {
  widths: number[]; L: SkyL; color: string; opacity?: number; heightU?: (i: number) => number; comb?: number; squeeze?: number;
  hl?: (i: number) => number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      {widths.map((w, i) => {
        const hu = heightU ? heightU(i) : 1;
        if (hu <= 0.001) return null;
        const h = lerp(w * L.sy, TICK_H, comb) * hu;
        const x = L.x0 + i * L.pitch * squeeze;
        const k = hl ? hl(i) : 0;
        return (
          <rect key={i} x={x} y={L.base - h} width={Math.max(0.6, L.colW * squeeze)} height={h}
            fill={k > 0.01 ? colors.WARM : comb > 0.5 ? colors.TEXT : color} opacity={k > 0.01 ? 1 : lerp(1, 0.85, comb)} />
        );
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);

  const baseU = s.get(scene.baseU);
  const riseU = s.get(scene.riseU);
  const cursorOp = s.get(scene.cursorOp);
  const hlFirst = s.get(scene.hlFirst);
  const hlSixth = s.get(scene.hlSixth);
  const first8U = s.get(scene.first8U);
  const hlSpike = s.get(scene.hlSpike);
  const last4U = s.get(scene.last4U);
  const medU = s.get(scene.medU);
  const sumU = s.get(scene.sumU);
  const skyLabelsOp = s.get(scene.skyLabelsOp);
  const combU = s.get(scene.combU);
  const squeezeU = s.get(scene.squeezeU);
  const longU = s.get(scene.longU);
  const tollU = s.get(scene.tollU);
  const skyPos = s.get(scene.skyPos);
  const skyOp = s.get(scene.skyOp);
  const axisU = s.get(scene.axisU);
  const legendU = s.get(scene.legendU);
  const scopeU = s.get(scene.scopeU);
  const rowU = scene.rowU.map((c) => s.get(c));
  const dotsU = scene.dotsU.map((c) => s.get(c));
  const rowOp = scene.rowOp.map((c) => s.get(c));
  const ratioU = s.get(scene.ratioU);
  const ratiosOp = s.get(scene.ratiosOp);
  const rowsOp = s.get(scene.rowsOp);
  const codeU = s.get(scene.codeU);
  const codeHiU = s.get(scene.codeHiU);
  const copyU = s.get(scene.copyU);
  const gapU = s.get(scene.gapU);
  const procU = s.get(scene.procU);
  const procDotsU = s.get(scene.procDotsU);
  const noiseU = s.get(scene.noiseU);
  const quoteU = s.get(scene.quoteU);
  const boardU = s.get(scene.boardU);
  const stampU = s.get(scene.stampU);
  const notU = s.get(scene.notU);
  const tilesU = s.get(scene.tilesU);
  const recapMarksU = s.get(scene.recapMarksU);
  const closeU = s.get(scene.closeU);

  // ---- the skyline ----
  const L = skyAt(skyPos);
  const fullMode = clamp01(1 - skyPos * 3); // labels that only read at full size
  const squeeze = lerp(1, N_LAYERS / PROBE_LAYERS, squeezeU);
  const cursorX = L.x0 + Math.min(riseU, N_LAYERS) * L.pitch;
  const layerNo = Math.max(1, Math.min(N_LAYERS, Math.ceil(riseU)));
  const colX = (i: number) => L.x0 + i * L.pitch + L.colW / 2;
  const colTop = (i: number) => L.base - WM_WIDTHS[i] * L.sy;
  const labOp = skyLabelsOp * fullMode;
  const medY = L_FULL.base - MEDIAN * L_FULL.sy;

  // ---- the rows ----
  const rowVis = (r: number) => rowU[r] * rowOp[r] * rowsOp;
  const dotU = (r: number, k: RunnerKey, n: number, idx: number): number => {
    // the coordinate row lands its three tensor runners over 0 … 0.75 and the direct line last
    if (r === 0) return k === 'direct' ? clamp01((dotsU[0] - 0.75) * 4) : clamp01((dotsU[0] / 0.75) * 3 - (idx - 1));
    return clamp01(dotsU[r] * n - idx);
  };

  return (
    <>
      <rect width={STAGE_W} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== B3: the 16,384-toll bar (behind the comb) ======================== */}
        {longU > 0.01 && (
          <g opacity={Math.min(1, longU * 3)}>
            <rect x={L_FULL.x0} y={LONG_Y} width={FULL_W * clamp01(longU)} height={TICK_H} fill={colors.NEGATIVE} opacity={0.35} />
            <text x={L_FULL.x0} y={LONG_Y - 12} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
              layers.ts, tallest probe: 16,384 layers, 16,384 layer tolls
            </text>
            <text x={L_FULL.x0 + FULL_W} y={LONG_Y - 12} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              drawn to scale
            </text>
          </g>
        )}
        {tollU > 0.01 && (
          <g>
            <text x={L_FULL.x0} y={L_FULL.base - TICK_H - 12} fill={colors.TEXT} fontSize={15} fontFamily={UI} opacity={clamp01(tollU)}>
              window manager: 130 layers, 130 layer tolls
            </text>
            <text x={640} y={300} textAnchor="middle" fill={colors.WARM} fontSize={28} fontFamily={UI} opacity={clamp01(tollU - 1)}>
              130 vs 16,384 layer tolls
            </text>
            {tollU > 2.01 && (
              <g opacity={clamp01(tollU - 2) * clamp01(longU * 3)}>
                <path d={`M ${L_FULL.x0} ${LONG_Y + TICK_H + 8} v 8 H ${lerp(L_FULL.x0, L_FULL.x0 + FULL_W, clamp01(tollU - 2))} v -8`}
                  fill="none" stroke={colors.NEGATIVE} strokeWidth={1.5} />
                <text x={L_FULL.x0 + FULL_W / 2} y={LONG_Y + TICK_H + 36} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontFamily={UI}>
                  the worst case: one operation per layer
                </text>
              </g>
            )}
          </g>
        )}

        {/* ======================== the skyline ======================== */}
        <g opacity={skyOp * (skyPos > 0.01 && skyPos <= 1 ? lerp(1, rowOp[2] * rowsOp, clamp01(skyPos)) : 1)}>
          {baseU > 0.01 && (
            <line x1={L.x0 - 6} y1={L.base} x2={lerp(L.x0 - 6, L.x0 + (N_LAYERS - 1) * L.pitch * squeeze + L.colW + 6, baseU)} y2={L.base}
              stroke={colors.MUTED} strokeWidth={1.2} opacity={0.7} />
          )}
          <Columns widths={WM_WIDTHS} L={L} color={colors.ACCENT} comb={combU} squeeze={squeeze}
            heightU={(i) => clamp01(riseU - i)}
            hl={(i) => (i === 0 ? hlFirst : i === 5 ? hlSixth : i === SPIKE ? hlSpike : 0)} />
          {squeezeU > 0.75 && (
            <rect x={L.x0 - 1} y={L.base - TICK_H} width={FULL_W * squeeze + 2} height={TICK_H} fill={colors.TEXT} opacity={clamp01((squeezeU - 0.75) * 4)} />
          )}
        </g>

        {/* B1: the rise cursor and its counter */}
        {riseU > 0.01 && cursorOp > 0.01 && (
          <g opacity={cursorOp}>
            <line x1={cursorX} y1={180} x2={cursorX} y2={L.base + 6} stroke={colors.TEAL} strokeWidth={1.5} opacity={0.8} />
            <text x={cursorX + (cursorX > 1060 ? -8 : 8)} y={196} textAnchor={cursorX > 1060 ? 'end' : 'start'} fill={colors.TEAL} fontSize={15} fontFamily={MONO}>
              layer {layerNo} / {N_LAYERS}
            </text>
          </g>
        )}

        {/* B1: first layer 401, sixth layer 10 */}
        {hlFirst > 0.01 && labOp > 0.01 && (
          <g opacity={hlFirst * labOp}>
            <text x={colX(0) + 10} y={colTop(0) + 14} fill={colors.WARM} fontSize={15} fontFamily={UI}>
              layer 1 · 401 operations
            </text>
          </g>
        )}
        {hlSixth > 0.01 && labOp > 0.01 && (
          <g opacity={hlSixth * labOp}>
            <line x1={colX(5)} y1={colTop(5) - 4} x2={colX(5) + 34} y2={444} stroke={colors.WARM} strokeWidth={1.3} />
            <text x={colX(5) + 38} y={440} fill={colors.WARM} fontSize={15} fontFamily={UI}>
              layer 6 · 10 operations
            </text>
          </g>
        )}
        <Chip x={300} y={300} text="first 8 widths: 401 214 90 94 52 10 7 15" color={colors.TEXT} mono fs={14} opacity={first8U * labOp} />

        {/* B2: the swell near the end, the median, the total */}
        {hlSpike > 0.01 && labOp > 0.01 && (
          <g opacity={hlSpike * labOp}>
            <line x1={colX(SPIKE)} y1={colTop(SPIKE) - 4} x2={colX(SPIKE) - 16} y2={338} stroke={colors.WARM} strokeWidth={1.3} />
            <text x={colX(SPIKE) - 20} y={334} textAnchor="end" fill={colors.WARM} fontSize={15} fontFamily={UI}>
              layer 129 · 133 operations
            </text>
          </g>
        )}
        <Chip x={1170} y={262} anchor="end" text="last 4 widths: 25 26 133 72" color={colors.TEXT} mono fs={14} opacity={last4U * labOp} />
        {medU > 0.01 && labOp > 0.01 && (
          <g opacity={labOp}>
            <line x1={L_FULL.x0} y1={medY} x2={lerp(L_FULL.x0, L_FULL.x0 + FULL_W, medU)} y2={medY} stroke={colors.WARM} strokeWidth={1.6} strokeDasharray="6 4" />
            <text x={L_FULL.x0 + FULL_W + 8} y={medY + 5} fill={colors.WARM} fontSize={13} fontFamily={UI} opacity={clamp01(medU * 2 - 1)}>
              median 26.5
            </text>
          </g>
        )}
        {sumU > 0.01 && labOp > 0.01 && (
          <g opacity={labOp}>
            <text x={640} y={140} textAnchor="middle" fontSize={20} fontFamily={UI}>
              <tspan fill={colors.TEXT} opacity={clamp01(sumU)}>{N_LAYERS} layers</tspan>
              <tspan fill={colors.WARM} opacity={clamp01(sumU - 1)}>{'  ·  '}median {MEDIAN}</tspan>
              <tspan fill={colors.ACCENT} opacity={clamp01(sumU - 2)}>{'  ·  '}{SUM.toLocaleString('en-US')} live ops</tspan>
            </text>
          </g>
        )}

        {/* ======================== B4–B8: three circuits on one log axis ======================== */}
        {axisU > 0.01 && (
          <g opacity={rowsOp}>
            <line x1={AX.x0} y1={AX.y} x2={lerp(AX.x0, AX.x1, axisU)} y2={AX.y} stroke={colors.MUTED} strokeWidth={1.2} />
            {AX_TICKS.map((tk, i) => {
              const u = clamp01(axisU * AX_TICKS.length - i);
              if (u <= 0.01) return null;
              const x = lx(tk.us);
              return (
                <g key={tk.us} opacity={u}>
                  <line x1={x} y1={AX.y - 5} x2={x} y2={AX.y + 5} stroke={colors.MUTED} />
                  <line x1={x} y1={170} x2={x} y2={AX.y} stroke={colors.GRID} strokeWidth={1} opacity={0.35} />
                  <text x={x} y={AX.y + 22} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    {tk.label}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        {legendU > 0.01 && (
          <g opacity={legendU * rowsOp}>
            <text x={AX.x0} y={156} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              median time per evaluation · log scale
            </text>
            {(['reference', 'full', 'reusable', 'direct'] as RunnerKey[]).map((k, i) => {
              const x = 640 + i * 136;
              return (
                <g key={k}>
                  <circle cx={x} cy={151} r={5.5} fill={RUNNER[k].color} />
                  <text x={x + 10} y={156} fill={RUNNER[k].color} fontSize={13} fontFamily={UI}>
                    {RUNNER[k].label}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        {ROWS.map((row, r) => {
          const op = rowVis(r);
          if (op <= 0.005) return null;
          const y = ROW_Y[r];
          const lanes = laneOffsets(row);
          const laneY = (k: RunnerKey) => y + lanes.find((l) => l[0] === k)![1];
          const thumbL: SkyL = {
            x0: LX, pitch: (THUMB_W - (r === 0 ? 30 : 2)) / Math.max(1, row.widths.length - 1), colW: r === 0 ? 30 : r === 1 ? 2.2 : 1,
            base: y + 40, sy: THUMB_H / Math.max(...row.widths),
          };
          const gapA = laneY('full');
          const gapB = laneY('reusable');
          return (
            <g key={r} opacity={op}>
              <text x={LX} y={y - 32} fill={colors.TEXT} fontSize={16} fontFamily={UI}>
                {row.name}
              </text>
              <text x={LX} y={y - 13} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                {row.meta}
              </text>
              {r < 2 && <Columns widths={row.widths} L={thumbL} color={colors.ACCENT} />}
              {r < 2 && <line x1={LX - 4} y1={y + 40} x2={LX + THUMB_W + 4} y2={y + 40} stroke={colors.MUTED} opacity={0.6} />}
              {/* the full → reusable gap */}
              {gapU > 0.01 && (
                <g opacity={Math.min(1, gapU)}>
                  <line x1={lx(row.t.full!)} y1={gapA} x2={lx(row.t.reusable!)} y2={gapB} stroke={gapU > 1.01 && r === 2 ? colors.WARM : colors.TEXT}
                    strokeWidth={1.4} strokeDasharray="3 3" />
                </g>
              )}
              {lanes.map(([k], idx) => {
                const u = dotU(r, k, lanes.length, idx);
                if (u <= 0.01) return null;
                const v = row.t[k]!;
                const x = lx(v);
                const ly = laneY(k);
                return (
                  <g key={k} opacity={u}>
                    <line x1={AX.x0} y1={ly} x2={x} y2={ly} stroke={RUNNER[k].color} strokeWidth={1} opacity={0.25} />
                    <circle cx={x} cy={ly} r={6 * (0.6 + 0.4 * u)} fill={RUNNER[k].color} />
                    <text x={x + 12} y={ly + 4.5} fill={RUNNER[k].color} fontSize={13} fontFamily={MONO}>
                      {fmtT(row, v)}
                    </text>
                  </g>
                );
              })}
              {/* ratio chip: full array ÷ reusable */}
              {ratioU > 0.01 && (
                <g opacity={clamp01(ratioU - r) * ratiosOp}>
                  <text x={RATIO_X} y={y + 8} textAnchor="middle" fill={colors.WARM} fontSize={24} fontFamily={MONO} fontWeight={700}
                    transform={`translate(${RATIO_X} ${y}) scale(${0.7 + 0.3 * clamp01(ratioU - r)}) translate(${-RATIO_X} ${-y})`}>
                    {RATIOS[r].toFixed(2)}×
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {ratioU > 0.01 && (
          <text x={RATIO_X} y={182} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={clamp01(ratioU) * ratiosOp * rowsOp}>
            full ÷ reusable
          </text>
        )}

        {/* B7: copy-loop badges on the window manager's reference and full-array dots */}
        {copyU > 0.01 && (
          <g opacity={copyU * rowsOp}>
            {(['reference', 'full'] as RunnerKey[]).map((k) => {
              const ly = ROW_Y[2] + laneOffsets(ROWS[2]).find((l) => l[0] === k)![1];
              const x = lx(ROWS[2].t[k]!) - 14;
              return (
                <g key={k}>
                  <LoopGlyph x={x - 8} y={ly} color={colors.WARM} />
                  <text x={x - 20} y={ly + 4.5} textAnchor="end" fill={colors.WARM} fontSize={13} fontFamily={UI}>
                    + copy loop
                  </text>
                </g>
              );
            })}
          </g>
        )}
        {gapU > 1.01 && (
          <text x={lx(ROWS[2].t.full!) + 4} y={ROW_Y[2] + 52} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={UI}
            opacity={clamp01(gapU - 1) * rowOp[2] * rowsOp * (1 - procU)}>
            part of this gap is the copy
          </text>
        )}

        {/* B7: report.ts, the select(...) wrapper */}
        {codeU > 0.01 && (
          <g opacity={codeU}>
            <rect x={CODE_BOX.x} y={CODE_BOX.y} width={CODE_W} height={CODE_H} rx={7} fill={colors.PANEL} stroke={colors.GRID} />
            <rect x={CODE_BOX.x} y={CODE_BOX.y} width={4} height={CODE_H} rx={2} fill={colors.WARM} />
            {/* the loop line, then select( on the two wrapped runners */}
            <rect x={CODE_BOX.x + 8} y={codeY(4) - 13} width={CODE_W - 16} height={18} rx={3} fill={colors.WARM} opacity={0.16 * clamp01(codeHiU)} />
            {[8, 9].map((i) => {
              const c = CODE[i].indexOf('select(');
              return (
                <rect key={i} x={CODE_BOX.x + 14 + c * CH13 - 2} y={codeY(i) - 13} width={7 * CH13 + 4} height={18} rx={3} fill={colors.WARM}
                  opacity={0.3 * clamp01(codeHiU - 1)} />
              );
            })}
            {CODE.map((l, i) => (
              <text key={i} x={CODE_BOX.x + 14} y={codeY(i)} fill={i === 10 ? colors.POSITIVE : colors.TEXT} fontSize={13} fontFamily={MONO} style={{ whiteSpace: 'pre' }}>
                {l}
              </text>
            ))}
            <text x={CODE_BOX.x + CODE_W - 12} y={CODE_BOX.y + 22} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
              report.ts
            </text>
            <g opacity={clamp01(codeHiU - 1)}>
              <text x={CODE_BOX.x + 14 + CODE[9].length * CH13 + 14} y={codeY(9) - 9} fill={colors.WARM} fontSize={13} fontFamily={UI}>
                ← both wrapped: an extra copy loop
              </text>
              <text x={CODE_BOX.x + 14 + CODE[10].length * CH13 + 14} y={codeY(10)} fill={colors.POSITIVE} fontSize={13} fontFamily={UI}>
                ← not wrapped
              </text>
            </g>
          </g>
        )}

        {/* B8: one shared process vs a process of its own */}
        {(procU > 0.01 || quoteU > 0.01) && (
          <g>
            <rect x={PROC.x} y={PROC.y} width={PROC.w} height={PROC.h} rx={12} fill={colors.PANEL} stroke={colors.GRID}
              opacity={Math.max(clamp01(quoteU), procU)} />
            <g opacity={clamp01(quoteU)}>
              <text x={640} y={PROC.y + 38} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontFamily={UI}>
                “timing several programs in one process can distort later timings”
              </text>
              <text x={640} y={PROC.y + 60} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                the lab's README
              </text>
            </g>
            <g opacity={procU}>
              {[
                { x: 180, title: 'one shared process', sub: 'report.ts times three circuits in turn', color: colors.POSITIVE },
                { x: 670, title: 'a process of its own', sub: 'window manager alone · median of 7', color: colors.TEXT },
              ].map((b, i) => (
                <g key={i}>
                  <rect x={b.x} y={PROC.y + 82} width={430} height={56} rx={9} fill={colors.BG} stroke={b.color} strokeOpacity={0.6} />
                  <text x={b.x + 16} y={PROC.y + 105} fill={b.color} fontSize={15} fontFamily={UI}>
                    {b.title}
                  </text>
                  <text x={b.x + 16} y={PROC.y + 126} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                    {b.sub}
                  </text>
                </g>
              ))}
              <text x={PAX.x0} y={PAX.y - 82} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                window manager, reusable runner
              </text>
              <line x1={PAX.x0} y1={PAX.y} x2={PAX.x1} y2={PAX.y} stroke={colors.MUTED} />
              {[40, 50, 60, 70, 80].map((v) => (
                <g key={v}>
                  <line x1={px(v)} y1={PAX.y - 4} x2={px(v)} y2={PAX.y + 4} stroke={colors.MUTED} />
                  <text x={px(v)} y={PAX.y + 20} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    {v} µs
                  </text>
                </g>
              ))}
            </g>
            {procDotsU > 0.01 && (
              <g opacity={procU}>
                {/* standalone: median and its range */}
                <line x1={px(ALONE.median)} y1={PAX.y - 22} x2={lerp(px(ALONE.median), px(ALONE.hi), clamp01(procDotsU * 1.4 - 0.4))} y2={PAX.y - 22} stroke={colors.TEXT} strokeWidth={2} />
                <line x1={px(ALONE.median)} y1={PAX.y - 22} x2={lerp(px(ALONE.median), px(ALONE.lo), clamp01(procDotsU * 1.4 - 0.4))} y2={PAX.y - 22} stroke={colors.TEXT} strokeWidth={2} />
                {procDotsU > 0.7 && (
                  <g opacity={clamp01((procDotsU - 0.7) * 4)}>
                    <line x1={px(ALONE.lo)} y1={PAX.y - 29} x2={px(ALONE.lo)} y2={PAX.y - 15} stroke={colors.TEXT} strokeWidth={2} />
                    <line x1={px(ALONE.hi)} y1={PAX.y - 29} x2={px(ALONE.hi)} y2={PAX.y - 15} stroke={colors.TEXT} strokeWidth={2} />
                    <text x={px(ALONE.hi) + 10} y={PAX.y - 17} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                      {ALONE.median} µs ({ALONE.lo}–{ALONE.hi.toFixed(2)})
                    </text>
                  </g>
                )}
                <circle cx={px(ALONE.median)} cy={PAX.y - 22} r={6} fill={colors.TEXT} />
                <circle cx={px(SHARED)} cy={PAX.y - 46} r={6} fill={colors.POSITIVE} opacity={clamp01(procDotsU * 3)} />
                <text x={px(SHARED) - 12} y={PAX.y - 41} textAnchor="end" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO} opacity={clamp01(procDotsU * 3)}>
                  {SHARED.toFixed(2)} µs
                </text>
              </g>
            )}
            {noiseU > 0.01 && (
              <g opacity={noiseU * procU}>
                <line x1={px(SHARED)} y1={PAX.y - 40} x2={px(SHARED)} y2={PAX.y - 16} stroke={colors.WARM} strokeWidth={1.3} strokeDasharray="3 3" />
                <text x={px(SHARED) + 14} y={PAX.y - 50} fill={colors.WARM} fontSize={15} fontFamily={UI}>
                  inside the standalone range: within noise
                </text>
              </g>
            )}
            <Chip x={640} y={PROC.y + PROC.h + 34} anchor="middle" text="one run each · could not confirm" color={colors.WARM} fs={14}
              opacity={clamp01(quoteU - 1) * procU} />
          </g>
        )}

        {/* ======================== B9–B10: the status board ======================== */}
        {boardU > 0.01 && (
          <g opacity={boardU}>
            <rect x={BOARD.x} y={BOARD.y} width={BOARD.w} height={BOARD.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <text x={BOARD.x + 30} y={BOARD.y + 36} fill={colors.TEXT} fontSize={18} fontFamily={UI}>
              lab status, plainly
            </text>
            {STATUS.map((row, i) => {
              const u = clamp01(stampU - i);
              const y = STATUS_Y(i);
              const pre = i === 3 ? clamp01(stampU - 3) : clamp01(stampU * 3 - i * 3 + 0.6);
              return (
                <g key={i} opacity={Math.max(pre, 0)}>
                  <line x1={BOARD.x + 24} y1={y - 34} x2={BOARD.x + BOARD.w - 24} y2={y - 34} stroke={colors.GRID} opacity={0.6} />
                  <text x={BOARD.x + 30} y={y - 4} fill={colors.TEXT} fontSize={16} fontFamily={i === 3 ? UI : MONO}>
                    {row.id}
                  </text>
                  <text x={BOARD.x + 30} y={y + 20} fill={colors.MUTED} fontSize={14} fontFamily={UI}>
                    {row.what}
                  </text>
                  <Stamp x={BOARD.x + BOARD.w - 130} y={y} text={row.stamp} color={row.color} u={u} />
                </g>
              );
            })}
            {notU > 0.01 && (
              <g>
                <text x={BOARD.x + 30} y={STATUS_Y(4) - 2} fill={colors.MUTED} fontSize={15} fontFamily={UI} opacity={clamp01(notU * 4)}>
                  not measured
                </text>
                {NOT_MEASURED.map((m, i) => {
                  const u = clamp01(notU * 5 - 1 - i);
                  const x = BOARD.x + 160 + i * 170;
                  const w = m.length * 7.8 + 24;
                  return (
                    <g key={m} opacity={u * 0.85}>
                      <rect x={x} y={STATUS_Y(4) - 22} width={w} height={28} rx={14} fill="none" stroke={colors.MUTED} strokeDasharray="4 3" />
                      <text x={x + w / 2} y={STATUS_Y(4) - 3} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={UI}>
                        {m}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </g>
        )}

        {/* ======================== B11: recap tiles (the skyline settles into the third) ======================== */}
        {tilesU > 0.01 &&
          TILES.map((tile, i) => {
            const u = clamp01(tilesU - i);
            if (u <= 0.01) return null;
            const cx = tile.x + TILE.w / 2;
            return (
              <g key={i} opacity={u}>
                <rect x={tile.x} y={TILE.y} width={TILE.w} height={TILE.h} rx={14} fill={colors.PANEL} fillOpacity={0.6} stroke={colors.GRID} />
                <text x={cx} y={TILE.y + 34} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontFamily={UI}>
                  {tile.title}
                </text>
                {i === 0 && (
                  <g>
                    {[0, 1, 2].map((c) => (
                      <g key={c} opacity={1 - c * 0.25}>
                        <rect x={tile.x + 30 + c * 10} y={TILE.y + 80 + c * 46} width={110} height={34} rx={5} fill="none" stroke={colors.ACCENT} strokeWidth={1.5} />
                        <text x={tile.x + 85 + c * 10} y={TILE.y + 102 + c * 46} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>
                          call {c + 1}: new
                        </text>
                      </g>
                    ))}
                    <text x={tile.x + 30} y={TILE.y + 240} fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>
                      evaluateTensor
                    </text>
                    <text x={tile.x + 30} y={TILE.y + 258} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                      a fresh array per call
                    </text>
                    <rect x={tile.x + 190} y={TILE.y + 126} width={104} height={34} rx={5} fill={colors.POSITIVE} fillOpacity={0.12} stroke={colors.POSITIVE} strokeWidth={1.5} />
                    <text x={tile.x + 242} y={TILE.y + 148} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>
                      one buffer
                    </text>
                    <LoopGlyph x={tile.x + 242} y={TILE.y + 196} color={colors.POSITIVE} s={2} />
                    <text x={tile.x + 300} y={TILE.y + 240} textAnchor="end" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>
                      createTensorEvaluator
                    </text>
                    <text x={tile.x + 300} y={TILE.y + 258} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                      overwritten each call
                    </text>
                  </g>
                )}
                {i === 1 && (
                  <g>
                    {/* schematic tower: thin layers stacked, a clock tick per layer */}
                    {Array.from({ length: 16 }, (_, j) => (
                      <rect key={j} x={cx - 50} y={TILE.y + 250 - j * 11} width={100} height={7} rx={1.5} fill={colors.ACCENT} opacity={0.35 + 0.04 * j} />
                    ))}
                    <text x={cx} y={TILE.y + 286} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                      schematic · README: M5 Max, load ≈ 4
                    </text>
                    <text x={cx} y={TILE.y + 306} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                      layers.ts
                    </text>
                  </g>
                )}
                {i === 2 && (
                  <g opacity={recapMarksU}>
                    <text x={L_TILE.x0} y={L_TILE.base - WM_WIDTHS[0] * L_TILE.sy - 10} fill={colors.WARM} fontSize={13} fontFamily={UI}>
                      wide
                    </text>
                    <line x1={L_TILE.x0 + THIN.from * L_TILE.pitch} y1={L_TILE.base - 16} x2={L_TILE.x0 + THIN.to * L_TILE.pitch} y2={L_TILE.base - 16}
                      stroke={colors.WARM} strokeWidth={1.5} opacity={clamp01(recapMarksU * 3 - 1)} />
                    <text x={L_TILE.x0 + ((THIN.from + THIN.to) / 2) * L_TILE.pitch} y={L_TILE.base - 24} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={UI}
                      opacity={clamp01(recapMarksU * 3 - 1)}>
                      thin
                    </text>
                    <text x={L_TILE.x0 + SPIKE * L_TILE.pitch + 2} y={L_TILE.base - WM_WIDTHS[SPIKE] * L_TILE.sy - 10} textAnchor="end" fill={colors.WARM} fontSize={13} fontFamily={UI}
                      opacity={clamp01(recapMarksU * 3 - 2)}>
                      swells · 133
                    </text>
                    <text x={cx} y={TILE.y + 306} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                      window manager · 130 real layers
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        {tilesU > 1.01 && (
          <g opacity={clamp01(tilesU - 1)}>
            <text x={TILES[1].x + TILE.w / 2} y={TILE.y + 76} textAnchor="middle" fill={colors.WARM} fontSize={22} fontFamily={MONO} fontWeight={700}>
              ≈ 10 µs / 1,000 layers
            </text>
          </g>
        )}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <text x={640} y={TILE.y + TILE.h + 52} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontFamily={UI}>
              rerun locally before trusting any one ratio
            </text>
            <Chip x={640} y={TILE.y + TILE.h + 92} anchor="middle" text="bun lab/runtime-cost/report.ts" color={colors.TEAL} mono fs={15} />
          </g>
        )}
      </Camera>

      {/* ======================== screen-space: title and scope stamp ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={76} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        3 · Real circuits, honest limits
      </text>
      {scopeU > 0.01 && (
        <g opacity={scopeU}>
          <rect x={40} y={48} width={410} height={22} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={50} y={64} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
            one run · M4 Max · load ≈ 9 · Bun · CPU
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
