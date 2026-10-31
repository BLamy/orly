// Many At Once
//
// Knuth-Plass — chapter 3. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/knuth-plass/README.md:250-254 (one evaluation: one command buffer; each level one dispatch across every
//     paragraph), :258-262 (the full and dense-rows kernels; rows r ≥ B only move costs B places down)
//   lab/knuth-plass/README.md:296 (gpuPlan: a power of two n ≥ 4 has 2·log2 n − 2 levels → 14 at n = 256)
//   lab/knuth-plass/README.md:301-302 (check runs: 24,823,200 and 705,743,280 values, 0 mismatched; 270,532)
//   lab/knuth-plass/README.md:307 (Apple M5 Max, headless Chrome through Metal, September 17, 2026)
//   lab/knuth-plass/README.md:337-355 (many paragraphs of 256 break points, W = 32: every point on the chart)
//   lab/knuth-plass/README.md:382-383 (one paragraph: 0.3 to 0.6 ms, mostly the round trip; 27.3× fewer sums)
//   lab/knuth-plass/README.md:409 (2.3× and 4.0× at 1,000 paragraphs), :414 (0.51 ms against 303 µs at 4,096)
//   lab/knuth-plass/README.md:418, :446, :450 (the repeat: 0.54 against 0.90 ms at 100; the six-session ranges;
//     "aren't a stable result"), :453-457 (the answer to Cheng; positions or widths; line costs never win)
//   lab/knuth-plass/README.md:460-470 (GPU not done: the page, mixed-length batches, only Brent-Kung's network,
//     only Apple's GPU through Metal in headless Chrome 153), :225-226 (the demo's justified cost)
//   lab/knuth-plass/README.md:167-168 (chain 10,232 against tree 230 layers at n = 1,024 and W = 32)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
//
// Every plotted point is a median from the README table at :352-355, drawn on a log-log chart; the ratios, growth
// factors, level count, W³ and the check total are computed below from those figures and the module throws if
// they drift from the README's own rounded statements. Changes to the plan: the six per-session crossover ticks are
// dropped (the README gives only the per-loop range, not six W = 32 counts), and the "breathing" band is the one
// session-dependent point the README does give, 0.90 ms (first runs) against 0.54 ms (a repeat) at 100 paragraphs.
// The dense-rows tile uses B = 8 as a labelled example block.
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { ReactElement } from 'react';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const BG_HEX = '#0a0e1a';

// book palette (plan.md): dusk-blue accent, greedy red, brick sand; amber for the line-costs upload
const BLUE = '#5b8bd6';
const BLUE_HI = '#8fb3ea';
const RED = '#c0504d';
const RED_HI = '#e07a76';
const SAND = '#d8c39a';
const AMBER = colors.WARM;
const OK = colors.POSITIVE;

const fmtInt = (v: number): string => Math.round(v).toLocaleString('en-US');
const sig2 = (v: number): number => {
  const p = 10 ** (Math.floor(Math.log10(v)) - 1);
  return Math.round(v / p) * p;
};

// ---------------------------------------------------------------------------
// The measurements (README.md:352-355, W = 32, paragraphs of 256 break points, ms per evaluation)
// ---------------------------------------------------------------------------

const P = [1, 10, 100, 1000];
type Key = 'plain' | 'typed' | 'chip' | 'full' | 'line';
type Series = { key: Key; name: string; v: number[]; color: string; ink: string; dash?: string };
const SERIES: Series[] = [
  { key: 'plain', name: 'knuthPlass', v: [0.016, 0.18, 1.9, 18.2], color: SAND, ink: SAND },
  { key: 'typed', name: 'knuthPlassTyped', v: [0.008, 0.1, 1.01, 10.4], color: SAND, ink: SAND, dash: '7 5' },
  { key: 'chip', name: 'dense-rows · positions', v: [0.39, 0.68, 0.9, 4.5], color: BLUE, ink: BLUE_HI },
  { key: 'full', name: 'full kernel', v: [0.57, 0.75, 3.43, 42.3], color: RED, ink: RED_HI },
  { key: 'line', name: 'dense-rows · line costs', v: [0.42, 0.88, 4.61, 23.4], color: AMBER, ink: AMBER },
];
const S = Object.fromEntries(SERIES.map((s) => [s.key, s])) as Record<Key, Series>;
const REPEAT_100 = 0.54; // README.md:446, the repeat session at 100 paragraphs and W = 32
const ONE_4096 = { chipMs: 0.51, plainUs: 303 }; // README.md:414

const W = 32;
const N_BREAKS = 256;
const LEVELS = 2 * Math.log2(N_BREAKS) - 2; // README.md:296
const W3 = W ** 3;
const B_EXAMPLE = 8;
const CHECK_1 = 24_823_200;
const CHECK_2 = 705_743_280;
const CHECK_TOTAL = CHECK_1 + CHECK_2;
const LARGEST = 270_532; // largestGpuBreakCount

const R_TYPED = S.typed.v[3] / S.chip.v[3];
const R_PLAIN = S.plain.v[3] / S.chip.v[3];
const GAP_1 = S.chip.v[0] / S.plain.v[0];
const GROW = { chip: sig2(S.chip.v[3] / S.chip.v[0]), plain: sig2(S.plain.v[3] / S.plain.v[0]), typed: sig2(S.typed.v[3] / S.typed.v[0]) };
if (R_TYPED.toFixed(1) !== '2.3' || R_PLAIN.toFixed(1) !== '4.0') throw new Error('knuth-plass ch3: ratios drifted from README.md:409');
if (CHECK_TOTAL !== 730_566_480) throw new Error('knuth-plass ch3: check total drifted');
if (LEVELS !== 14) throw new Error('knuth-plass ch3: level count drifted');
// The README's "about" crossovers interpolate linearly between measured counts (README.md:391): about 40 and 86.
const crossAt = (a: number[], b: number[]): number => {
  const d0 = a[1] - b[1];
  const d1 = a[2] - b[2];
  return 10 + (90 * d0) / (d0 - d1);
};
if (Math.round(crossAt(S.chip.v, S.plain.v)) !== 40 || Math.round(crossAt(S.chip.v, S.typed.v)) !== 86) {
  throw new Error('knuth-plass ch3: crossover interpolation disagrees with README.md:406');
}

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const HEADER_H = 76;
const CX0 = 430;
const CX1 = 1000;
const CY0 = 540; // y of the bottom of the plot
const CY1 = 128; // y of the top
const LX = [-0.22, 3.12];
const LY = [-2.3, 1.8];
const fx = (p: number): number => CX0 + ((Math.log10(p) - LX[0]) / (LX[1] - LX[0])) * (CX1 - CX0);
const fy = (v: number): number => CY0 - ((Math.log10(v) - LY[0]) / (LY[1] - LY[0])) * (CY0 - CY1);
const X_TICKS = [1, 10, 100, 1000];
const Y_TICKS = [0.01, 0.1, 1, 10];
const END_X = fx(1000);
const LABEL_X = END_X + 26;

// end labels: relax so neighbours sit ≥ 18 px apart
const END_Y: Record<Key, number> = (() => {
  const order = [...SERIES].sort((a, b) => fy(a.v[3]) - fy(b.v[3]));
  const out = {} as Record<Key, number>;
  let prev = -Infinity;
  for (const s of order) {
    const y = Math.max(fy(s.v[3]), prev + 18);
    out[s.key] = y;
    prev = y;
  }
  return out;
})();

// the rack: 1,000 paragraph strips, 40 × 25
const RACK = { x: 56, y: 150, cols: 40, rows: 25, pw: 6.4, ph: 6.6 };
const LEVEL_Y0 = 368;
const LEVEL_PITCH = 11;
// one W × W product tile
const TILE = { x: 56, y: 372, cell: 5.4 };
const TILE_SIZE = W * TILE.cell;
// round-trip floor (one paragraph, 0.3 to 0.6 ms)
const FLOOR = { y0: fy(0.6), y1: fy(0.3) };
const UNSTABLE = { y: 394, w: 260 };

const CAM_GATE: CameraState = { x: 330, y: 330, k: 1.22 };
const CAM_X1: CameraState = { x: 560, y: 392, k: 1.3 };
const CAM_1000: CameraState = { x: 1000, y: 230, k: 1.5 };
const CAM_CMP: CameraState = { x: 900, y: 300, k: 1.28 };
const CAM_100: CameraState = { x: 790, y: 392, k: 1.38 };

// ---------------------------------------------------------------------------
// The narration (book.json chapters[2].captions, verbatim) and its pacing (~150 words per minute)
// ---------------------------------------------------------------------------

const CAPTIONS = [
  "Back to the question: do many paragraphs at once run faster on the graphics chip? Here the tree runs one level per dispatch, with every paragraph's matrices going through together.",
  'For one paragraph, no. Up to four thousand ninety-six break points, one evaluation takes three tenths to six tenths of a millisecond, mostly the round trip, and a plain loop takes less.',
  'At two hundred fifty-six break points and thirty-two boxes, the plain loop needs sixteen microseconds. The chip needs about three hundred ninety. Only a big batch can hide that fixed trip.',
  "The first kernel computes every entry of every product. At a thousand paragraphs it takes forty-two milliseconds, losing to the typed-array loop's ten and the plain loop's eighteen. That is too much work.",
  'Most rows of those tiles only slide old costs down. The dense-rows kernel multiplies just the rows that hold costs. Same thousand paragraphs, with break positions uploaded: four and a half milliseconds.',
  "That beats both loops, by two point three times for the typed-array loop and four times for the plain loop. The chip's time grows far more slowly than the loops' time as paragraphs are added.",
  'What gets uploaded matters. Send the positions and the chip computes line costs itself, and it wins. Compute line costs in plain code and upload them, and it loses: twenty-three milliseconds against ten.',
  'Where does the win start? Across six Chrome sessions, with positions uploaded: from below thirty to about one hundred five paragraphs against the plain loop, and thirty-eight to one eighty-eight against the typed one.',
  'The lab itself says those counts are not a stable result. Near a hundred paragraphs the time is mostly the round trip, and the round trip changed about two times between sessions.',
  "The answers are exact. In Chrome, the chip's totals and breaks matched the reference with zero mismatches across two check runs, over seven hundred thirty million values, up to two hundred seventy thousand break points.",
  "The lab's answer to Cheng: for many paragraphs, yes; for one paragraph, no. The yes holds for one kernel, with positions or widths uploaded, on one Apple chip through Metal in headless Chrome.",
  "Still open, by the notes: Sklansky's prefix network, a graphics mode for the page, batches of different lengths, and the demo's own justified cost. None of them was done.",
  'So: optimal breaks are a running minimum. As matrix products they form a tree, ten thousand layers shrinking to two hundred thirty. One paragraph loses. Many can win, within a range that shifts.',
];
const GAP = 0.9;
const CAPS = (() => {
  let at = 0.4;
  return CAPTIONS.map((text) => {
    const dur = Math.round((text.split(/\s+/).length / 2.5 + 0.5) * 10) / 10;
    const c = { at, dur, text };
    at = Math.round((at + dur + GAP) * 10) / 10;
    return c;
  });
})();

// ---------------------------------------------------------------------------
// Timeline — thirteen fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_GATE, cameraInterp);

  // the chart (the persistent machine)
  const axesU = tl.channel('axesU', 0);
  const chartOp = tl.channel('chartOp', 1);
  const draw = Object.fromEntries(SERIES.map((s) => [s.key, tl.channel(`draw_${s.key}`, 0)])) as Record<Key, ReturnType<typeof tl.channel<number>>>;
  const op = Object.fromEntries(SERIES.map((s) => [s.key, tl.channel(`op_${s.key}`, 1)])) as Record<Key, ReturnType<typeof tl.channel<number>>>;
  const endU = Object.fromEntries(SERIES.map((s) => [s.key, tl.channel(`end_${s.key}`, 0)])) as Record<Key, ReturnType<typeof tl.channel<number>>>;
  const ptsU = tl.channel('ptsU', 0); // x = 1 points of the chip and both loops
  const floorU = tl.channel('floorU', 0);
  const tagOneU = tl.channel('tagOneU', 0);
  const gapU = tl.channel('gapU', 0); // the 16 µs vs 390 µs bracket
  const cmpU = tl.channel('cmpU', 0); // the three-way bracket at 1,000
  const growU = tl.channel('growU', 0);
  const bandA = tl.channel('bandA', 0);
  const bandB = tl.channel('bandB', 0);
  const unstableU = tl.channel('unstableU', 0);
  const wob = tl.channel('wob', 0); // 0: 0.90 ms (first runs) · 1: 0.54 ms (a repeat)
  const tripU = tl.channel('tripU', 0);

  // the left panel: rack, dispatch levels, tile, uploads
  const leftOp = tl.channel('leftOp', 1);
  const rackU = tl.channel('rackU', 0);
  const rackLog = tl.channel('rackLog', 0);
  const rackOp = tl.channel('rackOp', 1);
  const gateU = tl.channel('gateU', 0);
  const levelU = tl.channel('levelU', -1);
  const tileU = tl.channel('tileU', 0);
  const fullU = tl.channel('fullU', 0);
  const denseU = tl.channel('denseU', 0);
  const upA = tl.channel('upA', 0);
  const upB = tl.channel('upB', 0);

  // the closing cards
  const checkU = tl.channel('checkU', 0);
  const countU = tl.channel('countU', 0);
  const largestU = tl.channel('largestU', 0);
  const scopeU = tl.channel('scopeU', 0);
  const scopeOp = tl.channel('scopeOp', 1);
  const openU = tl.channel('openU', 0);
  const recapU = tl.channel('recapU', 0);

  const caption = (i: number) => {
    tl.caption(CAPS[i]);
    tl.hold(CAPS[i].at + CAPS[i].dur, GAP);
    return CAPS[i].at;
  };

  // — B1 · one level per dispatch, every paragraph together —
  let o = caption(0);
  tl.tween(axesU, 1, { at: o + 0.3, dur: 1.4, ease: ease.draw });
  tl.tween(rackU, 1, { at: o + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(gateU, 1, { at: o + 1.6, dur: 0.8, ease: ease.enter });
  tl.tween(rackLog, 1, { at: o + 3.4, dur: 1.4, ease: ease.move });
  tl.set(levelU, 0, o + 5.6);
  tl.tween(levelU, LEVELS, { at: o + 5.6, dur: 4.2, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: o + 9.8, dur: 1.4, ease: ease.move });

  // — B2 · one paragraph: the round trip —
  o = caption(1);
  tl.tween(rackLog, 0, { at: o, dur: 0.9, ease: ease.move });
  tl.set(levelU, -1, o);
  tl.tween(cam, CAM_X1, { at: o + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(ptsU, 1, { at: o + 1.0, dur: 0.7, ease: ease.enter });
  tl.tween(floorU, 1, { at: o + 4.6, dur: 1.2, ease: ease.draw });
  tl.tween(tagOneU, 1, { at: o + 7.0, dur: 0.7, ease: ease.enter });

  // — B3 · 16 µs against 390 µs; a batch shares the trip —
  o = caption(2);
  tl.tween(tagOneU, 0, { at: o, dur: 0.5, ease: ease.move });
  tl.tween(gapU, 1, { at: o + 0.5, dur: 1.0, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: o + 7.4, dur: 1.4, ease: ease.move });
  tl.tween(rackLog, 3, { at: o + 7.8, dur: 2.6, ease: ease.move });
  tl.set(levelU, 0, o + 9.4);
  tl.tween(levelU, LEVELS, { at: o + 9.4, dur: 2.8, ease: ease.linear });

  // — B4 · the full kernel: every entry of every product —
  o = caption(3);
  tl.tween(gapU, 0, { at: o, dur: 0.5, ease: ease.move });
  tl.tween(ptsU, 0, { at: o, dur: 0.5, ease: ease.move });
  tl.set(levelU, -1, o);
  tl.tween(draw.plain, 1, { at: o + 0.3, dur: 1.4, ease: ease.draw });
  tl.tween(draw.typed, 1, { at: o + 0.5, dur: 1.4, ease: ease.draw });
  tl.tween(draw.chip, 0.001, { at: o + 0.3, dur: 0.1, ease: ease.linear }); // keep its x = 1 dot
  tl.tween(draw.full, 1, { at: o + 1.6, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_1000, { at: o + 3.0, dur: 1.4, ease: ease.move });
  tl.tween(endU.full, 1, { at: o + 3.6, dur: 0.6, ease: ease.pop });
  tl.tween(endU.typed, 1, { at: o + 6.0, dur: 0.6, ease: ease.pop });
  tl.tween(endU.plain, 1, { at: o + 7.2, dur: 0.6, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: o + 9.0, dur: 1.4, ease: ease.move });
  tl.tween(rackOp, 0.12, { at: o + 9.0, dur: 0.8, ease: ease.move });
  tl.tween(gateU, 0, { at: o + 9.0, dur: 0.6, ease: ease.move });
  tl.tween(tileU, 1, { at: o + 9.6, dur: 0.7, ease: ease.enter });
  tl.tween(fullU, 1, { at: o + 10.2, dur: 1.4, ease: ease.linear });

  // — B5 · dense-rows: only the rows that hold costs —
  o = caption(4);
  tl.tween(op.full, 0.15, { at: o, dur: 0.8, ease: ease.move });
  tl.tween(denseU, 1, { at: o + 0.6, dur: 1.4, ease: ease.move });
  tl.tween(draw.chip, 1, { at: o + 6.0, dur: 1.6, ease: ease.draw });
  tl.tween(endU.chip, 1, { at: o + 9.4, dur: 0.6, ease: ease.pop });

  // — B6 · 2.3× and 4.0×; the chip's line is flatter —
  o = caption(5);
  tl.tween(cam, CAM_CMP, { at: o, dur: 1.3, ease: ease.move });
  tl.tween(tileU, 0.12, { at: o, dur: 0.8, ease: ease.move });
  tl.tween(cmpU, 1, { at: o + 0.8, dur: 0.7, ease: ease.pop });
  tl.tween(growU, 1, { at: o + 7.0, dur: 0.8, ease: ease.enter });

  // — B7 · what gets uploaded —
  o = caption(6);
  tl.tween(cmpU, 0, { at: o, dur: 0.5, ease: ease.move });
  tl.tween(growU, 0, { at: o, dur: 0.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: o, dur: 1.3, ease: ease.move });
  tl.tween(tileU, 0, { at: o, dur: 0.6, ease: ease.move });
  tl.tween(upA, 1, { at: o + 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(draw.line, 1, { at: o + 5.6, dur: 1.6, ease: ease.draw });
  tl.tween(upB, 1, { at: o + 5.2, dur: 0.7, ease: ease.enter });
  tl.tween(endU.line, 1, { at: o + 8.6, dur: 0.6, ease: ease.pop });

  // — B8 · where the win starts: a range, six sessions —
  o = caption(7);
  tl.tween(cam, CAM_100, { at: o, dur: 1.4, ease: ease.move });
  tl.tween(op.full, 0.1, { at: o, dur: 0.8, ease: ease.move });
  tl.tween(op.line, 0.1, { at: o, dur: 0.8, ease: ease.move });
  tl.tween(leftOp, 0, { at: o, dur: 0.8, ease: ease.move });
  tl.tween(bandA, 1, { at: o + 5.2, dur: 1.2, ease: ease.draw });
  tl.tween(bandB, 1, { at: o + 9.6, dur: 1.2, ease: ease.draw });

  // — B9 · not a stable result: the round trip moved —
  o = caption(8);
  tl.tween(unstableU, 1, { at: o + 0.6, dur: 0.6, ease: ease.pop });
  tl.tween(tripU, 1, { at: o + 4.4, dur: 0.7, ease: ease.enter });
  tl.tween(wob, 1, { at: o + 5.2, dur: 1.2, ease: ease.move });
  tl.tween(wob, 0, { at: o + 7.4, dur: 1.2, ease: ease.move });
  tl.tween(wob, 1, { at: o + 9.6, dur: 1.2, ease: ease.move });
  tl.tween(wob, 0, { at: o + 11.8, dur: 1.2, ease: ease.move });

  // — B10 · the answers are exact —
  o = caption(9);
  tl.tween(cam, CAMERA_HOME, { at: o, dur: 1.4, ease: ease.move });
  tl.tween(chartOp, 0.12, { at: o, dur: 0.9, ease: ease.move });
  tl.tween(checkU, 1, { at: o + 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(countU, 1, { at: o + 2.0, dur: 5.0, ease: ease.move });
  tl.tween(largestU, 1, { at: o + 10.0, dur: 0.6, ease: ease.pop });

  // — B11 · the lab's answer, and its scope —
  o = caption(10);
  tl.tween(checkU, 0, { at: o, dur: 0.6, ease: ease.move });
  tl.tween(chartOp, 0.06, { at: o, dur: 0.6, ease: ease.move });
  tl.tween(scopeU, 1, { at: o + 0.5, dur: 0.8, ease: ease.enter });

  // — B12 · still open —
  o = caption(11);
  tl.tween(scopeOp, 0.15, { at: o, dur: 0.8, ease: ease.move });
  tl.tween(openU, 4, { at: o + 0.8, dur: 7.6, ease: ease.linear });

  // — B13 · recap —
  o = caption(12);
  tl.tween(scopeU, 0, { at: o, dur: 0.7, ease: ease.move });
  tl.tween(openU, 0, { at: o, dur: 0.7, ease: ease.move });
  tl.tween(chartOp, 0, { at: o, dur: 0.7, ease: ease.move });
  tl.tween(recapU, 5, { at: o + 0.8, dur: 10.5, ease: ease.linear });
  tl.hold(CAPS[12].at + CAPS[12].dur + GAP, 2.0);

  return {
    tl, cam, axesU, chartOp, draw, op, endU, ptsU, floorU, tagOneU, gapU, cmpU, growU, bandA, bandB, unstableU, wob, tripU,
    leftOp, rackU, rackLog, rackOp, gateU, levelU, tileU, fullU, denseU, upA, upB,
    checkU, countU, largestU, scopeU, scopeOp, openU, recapU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

type TxtProps = {
  x: number; y: number; children: string; fs?: number; fill?: string; mono?: boolean; anchor?: 'start' | 'middle' | 'end';
  weight?: number; opacity?: number;
};

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  // world labels a camera push would carry off the stage, under the header or into the caption band fade out whole
  const sx = (x: number) => (x - cam.x) * cam.k + STAGE_W / 2;
  const sy = (y: number) => (y - cam.y) * cam.k + STAGE_H / 2;
  const fit = (x0: number, x1: number, y0: number, y1: number): number => {
    const r = 8;
    return clamp01((sx(x0) - 4) / r) * clamp01((STAGE_W - 4 - sx(x1)) / r) * clamp01((sy(y0) - HEADER_H - 4) / r) * clamp01((628 - sy(y1)) / r);
  };
  const T = ({ x, y, children, fs = 13, fill = colors.TEXT, mono = false, anchor = 'start', weight, opacity = 1 }: TxtProps) => {
    const w = children.length * fs * (mono ? 0.602 : 0.54);
    const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
    const o = opacity * fit(x0, x0 + w, y - fs * 0.85, y + fs * 0.25);
    if (o <= 0.01) return null;
    return (
      <text x={x} y={y} textAnchor={anchor} fill={fill} fontSize={fs} fontFamily={mono ? MONO : UI} fontWeight={weight} opacity={o}>
        {children}
      </text>
    );
  };

  const axesU = s.get(scene.axesU);
  const chartOp = s.get(scene.chartOp);
  const ptsU = s.get(scene.ptsU);
  const floorU = s.get(scene.floorU);
  const tagOneU = s.get(scene.tagOneU);
  const gapU = s.get(scene.gapU);
  const cmpU = s.get(scene.cmpU);
  const growU = s.get(scene.growU);
  const bandA = s.get(scene.bandA);
  const bandB = s.get(scene.bandB);
  const unstableU = s.get(scene.unstableU);
  const wob = s.get(scene.wob);
  const tripU = s.get(scene.tripU);
  const leftOp = s.get(scene.leftOp);
  const rackU = s.get(scene.rackU);
  const rackN = Math.max(1, Math.min(1000, Math.round(10 ** s.get(scene.rackLog))));
  const rackOp = s.get(scene.rackOp);
  const gateU = s.get(scene.gateU);
  const levelU = s.get(scene.levelU);
  const tileU = s.get(scene.tileU);
  const fullU = s.get(scene.fullU);
  const denseU = s.get(scene.denseU);
  const upA = s.get(scene.upA);
  const upB = s.get(scene.upB);
  const checkU = s.get(scene.checkU);
  const countU = s.get(scene.countU);
  const largestU = s.get(scene.largestU);
  const scopeU = s.get(scene.scopeU);
  const scopeOp = s.get(scene.scopeOp);
  const openU = s.get(scene.openU);
  const recapU = s.get(scene.recapU);

  // the chip's 100-paragraph point: first runs (0.90) or the repeat session (0.54), interpolated in log space
  const chip100 = 10 ** lerp(Math.log10(S.chip.v[2]), Math.log10(REPEAT_100), wob);
  const valuesOf = (sr: Series): number[] => (sr.key === 'chip' ? [sr.v[0], sr.v[1], chip100, sr.v[3]] : sr.v);
  const pulsing = levelU >= 0 && levelU < LEVELS;

  // ---------------- the chart ----------------
  const plotOp = chartOp;
  const seriesEls = SERIES.map((sr) => {
    const u = s.get(scene.draw[sr.key]);
    const o = s.get(scene.op[sr.key]);
    if (u <= 0.0005) return null;
    const pts = valuesOf(sr).map((v, i) => [fx(P[i]), fy(v)] as const);
    const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
    const L = segs.reduce((a, b) => a + b, 0);
    let acc = 0;
    const at = [0, ...segs.map((d) => (acc += d) / L)];
    const d = pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
    return (
      <g key={sr.key} opacity={o}>
        {u > 0.002 && (
          <path d={d} fill="none" stroke={sr.color} strokeWidth={sr.key === 'chip' ? 3.4 : 2.6} strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={sr.dash ? undefined : `${L} ${L}`} strokeDashoffset={sr.dash ? undefined : L * (1 - u)}
            style={sr.dash ? { strokeDasharray: sr.dash } : undefined}
            clipPath={sr.dash ? `url(#kp3-clip-${sr.key})` : undefined} />
        )}
        {sr.dash && (
          <defs>
            <clipPath id={`kp3-clip-${sr.key}`}>
              <rect x={CX0 - 10} y={0} width={(END_X - CX0 + 20) * u + 0.1} height={720} />
            </clipPath>
          </defs>
        )}
        {pts.map((p, i) => (u >= at[i] - 0.001 ? <circle key={i} cx={p[0]} cy={p[1]} r={sr.key === 'chip' ? 5.5 : 4.5} fill={sr.color} stroke={BG_HEX} strokeWidth={1.5} /> : null))}
      </g>
    );
  });

  // x = 1 dots before any line is drawn (beat 2)
  const x1Dots = ptsU > 0.01 && (
    <g opacity={ptsU}>
      {(['chip', 'plain', 'typed'] as Key[]).map((k) => (
        <circle key={k} cx={fx(1)} cy={fy(S[k].v[0])} r={6 * (0.6 + 0.4 * ptsU)} fill={S[k].color} stroke={BG_HEX} strokeWidth={1.5} />
      ))}
      <T x={fx(1) + 16} y={fy(S.chip.v[0]) - 14} fill={BLUE_HI} mono>chip · dense-rows · 0.39 ms</T>
      <T x={fx(1) + 16} y={fy(S.plain.v[0]) + 5} fill={SAND} mono>knuthPlass · 0.016 ms</T>
      <T x={fx(1) + 16} y={fy(S.typed.v[0]) + 7} fill={SAND} mono>knuthPlassTyped · 0.008 ms</T>
      <T x={fx(1) + 16} y={fy(S.chip.v[0]) - 34} fill={colors.MUTED}>one paragraph of 256 break points, W = 32</T>
    </g>
  );

  const chart = (
    <g opacity={plotOp}>
      {/* axes */}
      {axesU > 0.01 && (
        <g opacity={clamp01(axesU * 1.4)}>
          {Y_TICKS.map((v, i) => (
            <g key={v} opacity={clamp01(axesU * 4 - i * 0.5)}>
              <line x1={CX0} x2={CX0 + (CX1 - CX0 + 10) * axesU} y1={fy(v)} y2={fy(v)} stroke={colors.GRID} />
              <T x={CX0 - 10} y={fy(v) + 4} anchor="end" fill={colors.MUTED} mono>{v < 1 ? `${v}` : fmtInt(v)}</T>
            </g>
          ))}
          {X_TICKS.map((p, i) => (
            <g key={p} opacity={clamp01(axesU * 4 - i * 0.5)}>
              <line x1={fx(p)} x2={fx(p)} y1={CY0} y2={CY0 - (CY0 - CY1) * axesU} stroke={colors.GRID} />
              <T x={fx(p)} y={CY0 + 20} anchor="middle" fill={colors.MUTED} mono>{fmtInt(p)}</T>
            </g>
          ))}
          <line x1={CX0} x2={CX0} y1={CY0} y2={CY0 - (CY0 - CY1 + 6) * axesU} stroke={colors.MUTED} strokeOpacity={0.6} />
          <line x1={CX0} x2={CX0 + (CX1 - CX0 + 14) * axesU} y1={CY0} y2={CY0} stroke={colors.MUTED} strokeOpacity={0.6} />
          <T x={CX0} y={CY1 - 16} fill={colors.TEXT} fs={14}>ms per evaluation (W = 32)</T>
          <T x={CX0 + 196} y={CY1 - 16} fill={colors.MUTED}>log scale · medians of 3 runs</T>
          <T x={(CX0 + CX1) / 2} y={CY0 + 44} anchor="middle" fill={colors.TEXT} fs={14}>paragraphs of 256 break points</T>
        </g>
      )}

      {/* the round-trip floor */}
      {floorU > 0.01 && (
        <g>
          <rect x={CX0} y={FLOOR.y0} width={(CX1 - CX0) * floorU} height={FLOOR.y1 - FLOOR.y0} fill={BLUE} fillOpacity={0.13}
            stroke={BLUE} strokeOpacity={0.35} strokeDasharray="4 4" />
          <T x={CX1 - 112} y={FLOOR.y1 - 9} anchor="end" fill={BLUE_HI} opacity={clamp01(floorU * 2 - 1)} fs={13}>round trip</T>
          <T x={CX1 - 6} y={FLOOR.y1 - 9} anchor="end" fill={colors.MUTED} opacity={clamp01(floorU * 2 - 1)} mono>0.3 to 0.6 ms</T>
        </g>
      )}

      {seriesEls}
      {x1Dots}

      {/* one paragraph, up to 4,096 break points */}
      {tagOneU > 0.01 && (
        <g opacity={tagOneU * fit(fx(1) + 60, fx(1) + 400, FLOOR.y0 - 96, FLOOR.y0 - 30)}>
          <rect x={fx(1) + 60} y={FLOOR.y0 - 96} width={340} height={64} rx={8} fill={colors.PANEL} stroke={BLUE} strokeOpacity={0.5} />
          <text x={fx(1) + 74} y={FLOOR.y0 - 72} fill={colors.TEXT} fontSize={14} fontFamily={UI}>one paragraph, up to 4,096 break points</text>
          <text x={fx(1) + 74} y={FLOOR.y0 - 50} fill={BLUE_HI} fontSize={13} fontFamily={MONO}>
            {`chip ${ONE_4096.chipMs} ms · knuthPlass ${ONE_4096.plainUs / 1000} ms`}
          </text>
        </g>
      )}

      {/* the gap at x = 1: 16 µs against 390 µs */}
      {gapU > 0.01 && (
        <g>
          <path d={`M ${fx(1) - 14} ${fy(S.chip.v[0])} h -8 V ${lerp(fy(S.chip.v[0]), fy(S.plain.v[0]), gapU)} h 8`} fill="none" stroke={colors.TEXT} strokeWidth={1.6} />
          <g opacity={clamp01(gapU * 2 - 1)}>
            <rect x={fx(1) + 150} y={fy(0.08) - 30} width={232} height={58} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={fx(1) + 164} y={fy(0.08) - 8} fill={SAND} fontSize={14} fontFamily={MONO}>knuthPlass   16 µs</text>
            <text x={fx(1) + 164} y={fy(0.08) + 14} fill={BLUE_HI} fontSize={14} fontFamily={MONO}>{`chip        390 µs  ≈ ${Math.round(GAP_1)}×`}</text>
          </g>
        </g>
      )}

      {/* end labels */}
      {SERIES.map((sr) => {
        const u = s.get(scene.endU[sr.key]);
        if (u <= 0.01) return null;
        const y0 = fy(sr.v[3]);
        const y1 = END_Y[sr.key];
        const o = s.get(scene.op[sr.key]) < 0.5 ? s.get(scene.op[sr.key]) : 1;
        return (
          <g key={sr.key} opacity={clamp01(u) * o}>
            <path d={`M ${END_X + 7} ${y0} L ${LABEL_X - 6} ${y1}`} stroke={sr.color} strokeOpacity={0.6} fill="none" />
            <T x={LABEL_X} y={y1 + 4} fill={sr.ink} mono>{`${sr.name}  ${sr.v[3] < 10 ? sr.v[3].toFixed(2) : sr.v[3].toFixed(1)}`}</T>
          </g>
        );
      })}

      {/* 2.3× and 4.0× at 1,000 paragraphs */}
      {cmpU > 0.01 && (
        <g opacity={cmpU}>
          <path d={`M ${END_X - 12} ${fy(S.chip.v[3])} h -8 V ${fy(S.plain.v[3])} h 8`} fill="none" stroke={colors.TEXT} strokeWidth={1.6} />
          <path d={`M ${END_X - 12} ${fy(S.typed.v[3])} h -8`} fill="none" stroke={colors.TEXT} strokeWidth={1.6} />
          <rect x={END_X - 236} y={FLOOR.y1 + 22} width={226} height={growU > 0.01 ? 128 : 60} rx={8} fill={colors.PANEL} stroke={BLUE} strokeOpacity={0.5} />
          <text x={END_X - 222} y={FLOOR.y1 + 46} fill={BLUE_HI} fontSize={14} fontFamily={MONO}>{`${R_TYPED.toFixed(1)}× vs knuthPlassTyped`}</text>
          <text x={END_X - 222} y={FLOOR.y1 + 68} fill={BLUE_HI} fontSize={14} fontFamily={MONO}>{`${R_PLAIN.toFixed(1)}× vs knuthPlass`}</text>
          {growU > 0.01 && (
            <g opacity={growU}>
              <text x={END_X - 222} y={FLOOR.y1 + 96} fill={colors.MUTED} fontSize={13} fontFamily={UI}>from 1 to 1,000 paragraphs</text>
              <text x={END_X - 222} y={FLOOR.y1 + 116} fill={BLUE_HI} fontSize={13} fontFamily={MONO}>{`chip        ×${fmtInt(GROW.chip)}`}</text>
              <text x={END_X - 222} y={FLOOR.y1 + 136} fill={SAND} fontSize={13} fontFamily={MONO}>{`loops ×${fmtInt(GROW.plain)}, ×${fmtInt(GROW.typed)}`}</text>
            </g>
          )}
        </g>
      )}

      {/* the crossover ranges across six sessions */}
      {(bandA > 0.01 || bandB > 0.01) && (
        <g>
          {[
            { u: bandA, lo: 30, hi: 105, y: 490, color: SAND, a: 'vs knuthPlass', b: 'below 30 to about 105' },
            { u: bandB, lo: 38, hi: 188, y: 520, color: SAND, a: 'vs knuthPlassTyped', b: 'about 38 to 188' },
          ].map((b, i) => {
            if (b.u <= 0.01) return null;
            const x0 = fx(b.lo) - (i === 0 ? 22 : 0);
            const x1 = lerp(x0, fx(b.hi), b.u);
            return (
              <g key={i}>
                {i === 0 && <path d={`M ${x0 + 1} ${b.y} l 8 -7 v 14 z`} fill={BLUE} opacity={b.u} />}
                <rect x={x0} y={b.y - 9} width={x1 - x0} height={18} rx={9} fill={BLUE} fillOpacity={0.28} stroke={BLUE} strokeOpacity={0.8} />
                <T x={fx(b.hi) + 12} y={b.y - 1} fill={colors.TEXT} opacity={clamp01(b.u * 2 - 1)}>{b.a}</T>
                <T x={fx(b.hi) + 12} y={b.y + 14} fill={BLUE_HI} opacity={clamp01(b.u * 2 - 1)} mono>{b.b}</T>
              </g>
            );
          })}
          <T x={fx(30) - 22} y={466} fill={colors.MUTED} opacity={bandA}>where the chip wins, six Chrome sessions · positions</T>
        </g>
      )}

      {/* not a stable result: the 100-paragraph point moves with the session */}
      {unstableU > 0.01 && (
        <g opacity={unstableU}>
          <circle cx={fx(100)} cy={fy(chip100)} r={11} fill="none" stroke={AMBER} strokeWidth={1.5} />
          <path d={`M ${fx(100)} ${fy(chip100) + 11} V ${UNSTABLE.y}`} stroke={AMBER} strokeOpacity={0.6} strokeDasharray="3 3" />
          <rect x={fx(100) - UNSTABLE.w / 2} y={UNSTABLE.y} width={UNSTABLE.w} height={tripU > 0.01 ? 54 : 30} rx={6} fill={BG_HEX} stroke={AMBER} strokeWidth={1.5} />
          <text x={fx(100)} y={UNSTABLE.y + 20} textAnchor="middle" fill={AMBER} fontSize={15} fontFamily={MONO}>not a stable result</text>
          {tripU > 0.01 && (
            <text x={fx(100)} y={UNSTABLE.y + 42} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO} opacity={tripU}>
              {`chip, 100 paragraphs: ${(wob < 0.5 ? S.chip.v[2] : REPEAT_100).toFixed(2)} ms`}
            </text>
          )}
        </g>
      )}
      {tripU > 0.01 && (
        <g opacity={tripU}>
          <T x={CX1 - 6} y={FLOOR.y1 + 18} anchor="end" fill={BLUE_HI}>the round trip changed about 2× between sessions</T>
          <T x={fx(100) + UNSTABLE.w / 2 + 10} y={UNSTABLE.y + 42} fill={colors.MUTED}>{wob < 0.5 ? 'first 3 runs' : 'a repeat session'}</T>
        </g>
      )}
    </g>
  );

  // ---------------- the left panel ----------------
  const strips: ReactElement[] = [];
  if (rackU > 0.01) {
    for (let i = 0; i < 1000; i++) {
      const c = i % RACK.cols;
      const r = Math.floor(i / RACK.cols);
      const on = i < rackN;
      strips.push(
        <rect key={i} x={RACK.x + c * RACK.pw} y={RACK.y + r * RACK.ph} width={RACK.pw - 1.6} height={RACK.ph - 2.2} rx={1}
          fill={on ? (pulsing ? BLUE_HI : SAND) : colors.GRID} opacity={on ? 0.95 : 0.35} />,
      );
    }
  }
  const leftPanel = (
    <g opacity={leftOp}>
      {rackU > 0.01 && (
        <g opacity={rackU * rackOp}>
          <T x={RACK.x} y={RACK.y - 30} fill={colors.TEXT} fs={14}>{`P = ${fmtInt(rackN)} ${rackN === 1 ? 'paragraph' : 'paragraphs'}`}</T>
          <T x={RACK.x} y={RACK.y - 12} fill={colors.MUTED}>each a strip of 256 break points</T>
          {strips}
        </g>
      )}
      {gateU > 0.01 && (
        <g opacity={gateU}>
          <T x={RACK.x} y={LEVEL_Y0 - 14} fill={BLUE_HI} fs={14}>each level: one dispatch, all paragraphs</T>
          {Array.from({ length: LEVELS }, (_, k) => {
            const lit = pulsing ? clamp01(1 - Math.abs(levelU - k - 0.5)) : 0;
            const done = pulsing && levelU > k + 1;
            const wL = 256 * (1 - k / (LEVELS + 4));
            return (
              <rect key={k} x={RACK.x + (256 - wL) / 2} y={LEVEL_Y0 + k * LEVEL_PITCH} width={wL} height={LEVEL_PITCH - 4} rx={2}
                fill={lit > 0.02 ? BLUE_HI : done ? BLUE : colors.GRID} opacity={lit > 0.02 ? 0.4 + 0.6 * lit : done ? 0.55 : 0.8} />
            );
          })}
          <T x={RACK.x} y={LEVEL_Y0 + LEVELS * LEVEL_PITCH + 18} fill={colors.MUTED} mono>{`n = 256 → 2·log2(n) − 2 = ${LEVELS} levels`}</T>
        </g>
      )}
      {tileU > 0.01 && (
        <g opacity={tileU}>
          <T x={TILE.x - 26} y={TILE.y - 14} fill={colors.TEXT} fs={14}>{`one product tile, W × W = ${W} × ${W}`}</T>
          {Array.from({ length: W }, (_, r) => {
            const rowFill = clamp01(fullU * W - r);
            const holds = r < B_EXAMPLE;
            const pale = denseU * (holds ? 0 : 1);
            return (
              <g key={r}>
                {Array.from({ length: W }, (_, c) => {
                  const fill = rowFill * (1 - pale);
                  return (
                    <rect key={c} x={TILE.x + c * TILE.cell} y={TILE.y + r * TILE.cell} width={TILE.cell - 1} height={TILE.cell - 1}
                      fill={fill > 0.02 ? (holds && denseU > 0.5 ? BLUE : RED) : colors.GRID} opacity={fill > 0.02 ? 0.35 + 0.6 * fill : 0.55} />
                  );
                })}
                {denseU > 0.02 && !holds && (
                  <rect x={TILE.x + (r - B_EXAMPLE) * TILE.cell} y={TILE.y + r * TILE.cell} width={TILE.cell - 1} height={TILE.cell - 1}
                    fill={BLUE_HI} opacity={denseU * 0.9} />
                )}
              </g>
            );
          })}
          <g opacity={clamp01(fullU * 3) * (1 - denseU)}>
            <T x={TILE.x - 26} y={TILE.y + TILE_SIZE + 22} fill={RED_HI} mono>{`full: every entry, W³ = ${fmtInt(W3)} sums`}</T>
          </g>
          <g opacity={denseU}>
            <path d={`M ${TILE.x + TILE_SIZE + 6} ${TILE.y} h 5 v ${B_EXAMPLE * TILE.cell - 1} h -5`} fill="none" stroke={BLUE_HI} />
            <T x={TILE.x + TILE_SIZE + 16} y={TILE.y + 18} fill={BLUE_HI}>{`B = ${B_EXAMPLE} rows`}</T>
            <T x={TILE.x + TILE_SIZE + 16} y={TILE.y + 34} fill={BLUE_HI}>hold costs</T>
            <T x={TILE.x + TILE_SIZE + 16} y={TILE.y + 120} fill={colors.MUTED}>the rest</T>
            <T x={TILE.x + TILE_SIZE + 16} y={TILE.y + 136} fill={colors.MUTED}>{`shift costs ${B_EXAMPLE} down`}</T>
            <T x={TILE.x - 26} y={TILE.y + TILE_SIZE + 22} fill={BLUE_HI} mono>{`kernel: 'dense-rows' · e.g. B = ${B_EXAMPLE}`}</T>
            <T x={TILE.x - 26} y={TILE.y + TILE_SIZE + 40} fill={colors.MUTED}>the plan counts 27.3× fewer sums</T>
          </g>
        </g>
      )}
      {upA > 0.01 && (
        <g>
          {[
            { u: upA, y: 360, color: BLUE, ink: BLUE_HI, a: 'upload positions', b: '2n integers per paragraph;', c: 'the chip computes line costs', d: '4.50 ms · wins', good: true },
            { u: upB, y: 482, color: AMBER, ink: AMBER, a: 'upload line costs', b: 'computed in plain JavaScript,', c: 'then sent to the chip', d: '23.4 ms vs knuthPlassTyped 10.4', good: false },
          ].map((cd, i) =>
            cd.u > 0.01 ? (
              <g key={i} opacity={cd.u} transform={`translate(${(1 - cd.u) * -16} 0)`}>
                <rect x={44} y={cd.y} width={300} height={106} rx={10} fill={colors.PANEL} stroke={cd.color} strokeOpacity={0.7} />
                <rect x={44} y={cd.y} width={4} height={106} rx={2} fill={cd.color} />
                <text x={60} y={cd.y + 26} fill={cd.ink} fontSize={15} fontFamily={UI} fontWeight={600}>{cd.a}</text>
                <text x={60} y={cd.y + 48} fill={colors.TEXT} fontSize={13} fontFamily={UI}>{cd.b}</text>
                <text x={60} y={cd.y + 66} fill={colors.TEXT} fontSize={13} fontFamily={UI}>{cd.c}</text>
                <text x={60} y={cd.y + 90} fill={cd.good ? BLUE_HI : AMBER} fontSize={13} fontFamily={MONO}>{`${cd.good ? '✓' : '✗'} ${cd.d}`}</text>
              </g>
            ) : null,
          )}
        </g>
      )}
    </g>
  );

  // ---------------- closing cards (screen space) ----------------
  const counted = Math.round(CHECK_TOTAL * countU);
  const check = checkU > 0.01 && (
    <g opacity={checkU} transform={`translate(0 ${(1 - checkU) * 14})`}>
      <rect x={250} y={170} width={780} height={330} rx={14} fill={colors.PANEL} stroke={OK} strokeOpacity={0.5} />
      <text x={640} y={222} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontFamily={UI}>the chip against knuthPlass, in Chrome: two check runs</text>
      <text x={640} y={290} textAnchor="middle" fill={OK} fontSize={44} fontFamily={MONO} fontWeight={700}>0 mismatched</text>
      <text x={640} y={322} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={UI}>values and breaks</text>
      {(() => {
        const bx = 300;
        const bw = 680;
        const w1 = (bw * CHECK_1) / CHECK_TOTAL;
        const fillW = bw * countU;
        return (
          <g>
            <rect x={bx} y={350} width={bw} height={20} rx={4} fill={colors.GRID} />
            <rect x={bx} y={350} width={Math.min(fillW, w1)} height={20} rx={2} fill={OK} opacity={0.95} />
            {fillW > w1 && <rect x={bx + w1 + 1} y={350} width={fillW - w1 - 1} height={20} rx={2} fill={OK} opacity={0.6} />}
            <text x={bx} y={394} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>{`run 1: ${fmtInt(CHECK_1)}`}</text>
            <text x={bx + bw} y={394} textAnchor="end" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>{`run 2: ${fmtInt(CHECK_2)}`}</text>
            <text x={640} y={436} textAnchor="middle" fill={OK} fontSize={22} fontFamily={MONO}>{`${fmtInt(counted)} values`}</text>
          </g>
        );
      })()}
      <g opacity={largestU}>
        <text x={640} y={476} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>{`up to largestGpuBreakCount = ${fmtInt(LARGEST)} break points`}</text>
      </g>
    </g>
  );

  const scope = scopeU > 0.01 && (
    <g opacity={scopeU * scopeOp} transform={`translate(0 ${(1 - scopeU) * 14})`}>
      <rect x={200} y={112} width={880} height={196} rx={14} fill={colors.PANEL} stroke={BLUE} strokeOpacity={0.55} />
      <text x={240} y={150} fill={colors.MUTED} fontSize={15} fontFamily={UI}>{"the lab's answer to Cheng"}</text>
      <text x={240} y={196} fill={BLUE_HI} fontSize={30} fontFamily={UI} fontWeight={600}>for many paragraphs, yes</text>
      <text x={640} y={196} fill={colors.MUTED} fontSize={30} fontFamily={UI}>·</text>
      <text x={672} y={196} fill={RED_HI} fontSize={30} fontFamily={UI} fontWeight={600}>for one paragraph, no</text>
      <text x={240} y={238} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>{"kernel: 'dense-rows' · positions or widths uploaded"}</text>
      <text x={240} y={272} fill={colors.MUTED} fontSize={15} fontFamily={MONO}>Apple M5 Max · Metal · headless Chrome 153</text>
    </g>
  );

  const OPEN = ["Sklansky's prefix network", 'a GPU mode for the page', 'batches of different lengths', "the demo's justified cost"];
  const open = openU > 0.005 && (
    <g>
      <text x={240} y={360} fill={colors.TEXT} fontSize={17} fontFamily={UI} opacity={clamp01(openU * 3)}>still open, by the notes</text>
      {OPEN.map((label, i) => {
        const u = clamp01(openU - i);
        if (u <= 0.01) return null;
        const shown = label.slice(0, Math.ceil(label.length * clamp01(u * 1.6)));
        return (
          <g key={i} opacity={clamp01(u * 3)}>
            <circle cx={250} cy={400 + i * 50 - 5} r={4} fill={colors.MUTED} />
            <text x={268} y={400 + i * 50} fill={colors.TEXT} fontSize={18} fontFamily={MONO}>{shown}</text>
            <g opacity={clamp01(u * 2 - 1)}>
              <rect x={640} y={400 + i * 50 - 18} width={84} height={24} rx={12} fill="none" stroke={colors.MUTED} />
              <text x={682} y={400 + i * 50 - 1} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={UI}>not done</text>
            </g>
          </g>
        );
      })}
    </g>
  );

  // recap: five steps, left to right
  const RECAP = [
    { a: 'running minimum', b: 'cost[to] = min over from' },
    { a: 'min-plus matrices', b: `W × W tiles` },
    { a: 'a tree of products', b: '10,232 → 230 layers' },
    { a: 'one paragraph', b: 'loses to the round trip' },
    { a: 'many paragraphs', b: 'can win, in a range that shifts' },
  ];
  const RX = (i: number) => 156 + i * 242;
  const RY = 300;
  const recap = recapU > 0.005 && (
    <g>
      {RECAP.map((r, i) => {
        const u = clamp01((recapU - i) * 1.4);
        if (u <= 0.01) return null;
        const x = RX(i);
        return (
          <g key={i} opacity={u} transform={`translate(0 ${(1 - u) * 10})`}>
            {i > 0 && <path d={`M ${RX(i - 1) + 62} ${RY} H ${x - 62}`} stroke={colors.MUTED} strokeWidth={1.5} markerEnd="url(#kp3-arrow)" />}
            <RecapIcon i={i} x={x} y={RY} />
            <text x={x} y={RY + 84} textAnchor="middle" fill={i === 4 ? BLUE_HI : i === 3 ? RED_HI : colors.TEXT} fontSize={16} fontFamily={UI} fontWeight={600}>{r.a}</text>
            <text x={x} y={RY + 106} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={i === 0 || i === 2 ? MONO : UI}>{r.b}</text>
          </g>
        );
      })}
      <text x={RX(2)} y={RY + 126} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={clamp01((recapU - 2) * 1.4)}>n = 1,024 · W = 32</text>
    </g>
  );

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <marker id="kp3-arrow" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={7} markerHeight={7} orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={colors.MUTED} />
        </marker>
      </defs>
      <Camera {...cam}>
        {leftPanel}
        {chart}
      </Camera>
      {check}
      {scope}
      {open}
      {recap}
      <rect x={0} y={0} width={STAGE_W} height={HEADER_H} fill={colors.BG} opacity={0.92} />
      <text x={40} y={40} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        3 · Many At Once
      </text>
    </>
  );
}

/** Small glyphs for the recap strip: the break ladder, a tile, a tree, one strip, a crossing chart. */
function RecapIcon({ i, x, y }: { i: number; x: number; y: number }) {
  if (i === 0) {
    // the break ladder: costs [0, 9, 0, 10, 10] as rungs (chapter 1)
    const costs = [0, 9, 0, 10, 10];
    return (
      <g>
        <line x1={x - 40} x2={x - 40} y1={y - 38} y2={y + 38} stroke={colors.MUTED} />
        <line x1={x + 40} x2={x + 40} y1={y - 38} y2={y + 38} stroke={colors.MUTED} />
        {costs.map((c, k) => (
          <g key={k}>
            <line x1={x - 40} x2={x - 40 + 8 + c * 7} y1={y + 32 - k * 16} y2={y + 32 - k * 16} stroke={SAND} strokeWidth={3} />
          </g>
        ))}
      </g>
    );
  }
  if (i === 1) {
    const n = 6;
    const c = 12;
    return (
      <g>
        {Array.from({ length: n * n }, (_, k) => {
          const r = Math.floor(k / n);
          const cc = k % n;
          const holds = r < 2;
          return <rect key={k} x={x - (n * c) / 2 + cc * c} y={y - (n * c) / 2 + r * c} width={c - 2} height={c - 2}
            fill={holds ? BLUE : r - 2 === cc ? BLUE_HI : colors.GRID} opacity={holds ? 0.9 : r - 2 === cc ? 0.8 : 0.8} />;
        })}
      </g>
    );
  }
  if (i === 2) {
    const leaves = [-42, -30, -18, -6, 6, 18, 30, 42];
    const lvl = (xs: number[]) => xs.filter((_, k) => k % 2 === 0).map((v, k) => (v + xs[2 * k + 1]) / 2);
    const l1 = lvl(leaves);
    const l2 = lvl(l1);
    const l3 = lvl(l2);
    const rows = [leaves, l1, l2, l3];
    return (
      <g stroke={BLUE} strokeWidth={1.8} fill="none">
        {rows.slice(1).map((row, ri) =>
          row.map((v, k) => (
            <g key={`${ri}-${k}`}>
              <line x1={x + rows[ri][2 * k]} y1={y + 34 - ri * 22} x2={x + v} y2={y + 34 - (ri + 1) * 22} />
              <line x1={x + rows[ri][2 * k + 1]} y1={y + 34 - ri * 22} x2={x + v} y2={y + 34 - (ri + 1) * 22} />
            </g>
          )),
        )}
        {leaves.map((v, k) => <circle key={k} cx={x + v} cy={y + 34} r={3} fill={BLUE} stroke="none" />)}
      </g>
    );
  }
  if (i === 3) {
    return (
      <g>
        <rect x={x - 46} y={y - 6} width={92} height={22} rx={4} fill={BLUE} fillOpacity={0.15} stroke={BLUE} strokeOpacity={0.4} strokeDasharray="3 3" />
        <rect x={x - 30} y={y - 30} width={60} height={8} rx={2} fill={SAND} />
        <circle cx={x} cy={y + 5} r={6} fill={RED} />
      </g>
    );
  }
  // a crossing: the loop climbs steeply, the chip's line stays flatter, and a band marks where it crosses
  return (
    <g fill="none" strokeWidth={2.4} strokeLinecap="round">
      <rect x={x + 5} y={y - 40} width={24} height={80} fill={BLUE} fillOpacity={0.16} stroke="none" />
      <path d={`M ${x - 48} ${y + 34} L ${x + 48} ${y - 34}`} stroke={SAND} />
      <path d={`M ${x - 48} ${y - 4} L ${x + 48} ${y - 16}`} stroke={BLUE} />
    </g>
  );
}

export const vizScene = () => scene;
