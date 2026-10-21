// Taking steps back
//
// Learned Gallery — chapter 3. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/learned-gallery/README.md:22 (the training loop: fixed-rate Adam, the 14 px jumps before October 13,
//     trainOrUndo, the followed function, ×1.15, the 1/64 → 1/4096 floor, the 30 px stall)
//   lab/learned-gallery/README.md:23 (2 steps or none; 529 steps · 0.47 px vs 874 steps · 0.03 px on a 500 px
//     stage at 5 ms a step; up to twice the 6 ms, e.g. 10 ms at 5 ms a step)
//   lab/learned-gallery/README.md:24 (no "done" loss value, 1e-5 with a photo 9 px off; 500 / 100 / 0.01% / 2,000)
//   lab/learned-gallery/README.md:56 (238 of the 300 frames after Story's first fit, up to 171 in a row)
//   src/learned-gallery/trainable-geometry.ts:742-767 (Adam: β1 0.9, β2 0.999, ε 1e-8, clamp ±6),
//     864-900 (trainOrUndo: measure before/after, restore weights and both moments, halve / ×1.15 / ×2)
//   src/learned-gallery/learned-gallery.ts:247-259 (trainingStepsAfterChange 500, maximumTrainingStepsAfterChange
//     2000, restSteps 100, restDistance 0.0001), 271-300 (msPerTrainingStep 1000/600, maximumTrainingStepsPerFrame 20,
//     trainingMsPerFrame 6, minimumTrainingStepsPerFrame 2; "about 0.4 ms in Chrome … where 6 ms is 15 steps"),
//     696-704 (stepsHeld, stepsThisFrame)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
//
// The visual machine is one frame belt read through a gate, with a learning-rate ladder beside it. Every rate on
// the ladder is produced at module scope by a line-for-line port of trainOrUndo's rate rule (trainable-geometry.ts
// 877-888) over a scripted keep/undo pattern; the module throws if the rule does not land on the rungs the
// captions name (1/64 after six undos, back to 1 after 30 kept frames, 1/128 on the fifth undo at 1/64, 1/4096
// floor, six doublings back to 1/64). Steps per frame come from a port of the frame planner's stepsHeld
// (learned-gallery.ts:696-704). The keep/undo pattern itself, the weight and moment strip values, the jitter
// before the 14 px jump, the loss curve and the rest-meter curve are schematic and are labelled so on screen;
// the order of the 238 red cells in the closing heat belt is schematic too (only the counts are the lab's, one
// run, per review.md). The climb from 1/64 is ln 64 / ln 1.15 = 29.757…, shown as 29.76 (the plan's 29.75 is the
// truncation); the port reaches 1 on the 30th kept frame.
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';
import type { ReactNode } from 'react';
import 'katex/dist/katex.min.css';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const win = (u: number, a: number, b: number): number => clamp01((u - a) / Math.max(1e-6, b - a));
const smooth = (u: number): number => u * u * (3 - 2 * u);
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH13 = 7.83; // mono advance at 13 px
const CH14 = 8.43; // mono advance at 14 px
const WHISPER = 0.12;

// ---------------------------------------------------------------------------
// The frame planner (learned-gallery.ts:271-300, 696-704)
// ---------------------------------------------------------------------------

const MS_PER_STEP = 1000 / 600;
const MAX_STEPS = 20;
const BUDGET_MS = 6;
const MIN_STEPS = 2;

function stepsThisFrame(stepsLeft: number, measuredMsPerStep: number, owedMs: number, minimum = MIN_STEPS): number {
  const held = Math.min(
    stepsLeft,
    MAX_STEPS,
    Math.max(minimum, Math.floor(BUDGET_MS / measuredMsPerStep)),
    Math.floor(owedMs / MS_PER_STEP),
  );
  return held >= Math.min(minimum, stepsLeft) ? held : 0;
}
const CHROME_MS = 0.4; // learned-gallery.ts:277 "about 0.4 ms in Chrome 155 on an M5 Max … where 6 ms is 15 steps"
const SLOW_MS = 5;
const BUDGET_FAST = Math.floor(BUDGET_MS / CHROME_MS); // 15
const BUDGET_SLOW = Math.floor(BUDGET_MS / SLOW_MS); // 1
const AT_60 = stepsThisFrame(2000, CHROME_MS, 1000 / 60); // 10
const AT_120 = stepsThisFrame(2000, CHROME_MS, 1000 / 120); // 5
const SLOW_NOW = stepsThisFrame(2000, SLOW_MS, 1000 / 60); // 2
const SLOW_OLD = stepsThisFrame(2000, SLOW_MS, 1000 / 60, 1); // 1
const SLOW_FRAME_MS = SLOW_NOW * SLOW_MS; // 10
if (AT_60 !== 10 || AT_120 !== 5 || SLOW_NOW !== 2 || SLOW_OLD !== 1 || BUDGET_FAST !== 15) {
  throw new Error('learned-gallery ch3: frame planner port disagrees with the source comments');
}

// ---------------------------------------------------------------------------
// trainOrUndo's rate rule (trainable-geometry.ts:877-888) over a scripted keep/undo pattern
// ---------------------------------------------------------------------------

type Fr = { steps: number; undone: boolean; neutral: boolean; before: number; after: number; low: number };
const FR: Fr[] = [];
{
  let scale = 1;
  let low = 0;
  const push = (steps: number, undone: boolean, neutral = false) => {
    const before = scale;
    if (!neutral) {
      if (undone) {
        if (scale <= 1 / 64) low++;
        scale = Math.max(low >= 5 ? 1 / 4096 : 1 / 64, scale * 0.5);
      } else {
        scale = Math.min(1, scale * (scale < 1 / 64 ? 2 : 1.15));
        if (scale >= 1 / 64) low = 0;
      }
    }
    FR.push({ steps, undone, neutral, before, after: scale, low });
  };
  const run = (n: number, steps: number, undone: boolean, neutral = false) => {
    for (let i = 0; i < n; i++) push(steps, undone, neutral);
  };
  run(3, AT_60, false, true); // 0-2   beat 2: frames of 10 steps go by
  run(6, AT_60, true); //        3-8   beats 3-4: taken back, 1 → 1/64
  run(30, AT_60, false); //      9-38  beat 5: kept, 1/64 → 1
  run(6, AT_60, true); //        39-44 beat 6: back down to 1/64
  run(5, AT_60, true); //        45-49 five in a row at 1/64
  run(5, AT_60, true); //        50-54 on to 1/4096
  run(6, AT_60, false); //       55-60 kept frames double it back to 1/64
  run(8, SLOW_OLD, true); //     61-68 beat 7: one-step frames, every one taken back
  run(4, SLOW_NOW, false); //    69-72 two-step frames
}
const N_FR = FR.length;
const near = (a: number, b: number) => Math.abs(a - b) < 1e-12;
if (!near(FR[8].after, 1 / 64) || !near(FR[38].after, 1) || !near(FR[37].after, Math.pow(1.15, 29) / 64)) {
  throw new Error('learned-gallery ch3: halving to 1/64 or the ×1.15 climb disagrees');
}
if (!near(FR[48].after, 1 / 64) || !near(FR[49].after, 1 / 128) || FR[49].low !== 5 || !near(FR[54].after, 1 / 4096) || !near(FR[60].after, 1 / 64) || FR[60].low !== 0) {
  throw new Error('learned-gallery ch3: the 1/4096 floor rule disagrees');
}
const CLIMB = Math.log(64) / Math.log(1.15); // 29.757…
const CLIMB_TXT = CLIMB.toFixed(2);
const SEG = { neutral: 0, drop: 3, climb: 9, redrop: 39, atLow: 45, deep: 50, double: 55, one: 61, two: 69 };

// belt geometry: time runs at 8.8 px a step, so a 60 Hz frame (10 steps) is 88 px and a 120 Hz frame 44 px
const PX_STEP = 8.8;
const fw = (steps: number): number => (steps === 1 ? 24 : steps === 2 ? 34 : steps * PX_STEP);
const CUM: number[] = [0];
FR.forEach((f) => CUM.push(CUM[CUM.length - 1] + fw(f.steps)));
const GATE_L = 300;
const BELT_Y = 262;
const BELT_H = 48;
const beltOffset = (fi: number): number => {
  if (fi <= 0) return 0;
  if (fi >= N_FR) return CUM[N_FR];
  const k = Math.floor(fi);
  return CUM[k] + smooth(win(fi - k, 0.7, 1)) * fw(FR[k].steps);
};
const frameX = (i: number, fi: number): number => GATE_L + beltOffset(fi) - CUM[i];

// the rate at belt position fi, in halvings (0 = 1, 12 = 1/4096)
const halvings = (fi: number): number => {
  const k = Math.max(0, Math.min(N_FR - 1, Math.floor(fi)));
  const u = fi - k;
  const f = FR[k];
  const a = -Math.log2(f.before);
  const b = -Math.log2(f.after);
  return lerp(a, b, smooth(win(u, 0.5, 0.7)));
};
const decided = (i: number, fi: number): boolean => fi - i >= 0.6;
const lowNow = (fi: number): number => {
  const k = Math.max(0, Math.min(N_FR - 1, Math.floor(fi)));
  if (decided(k, fi)) return FR[k].low;
  return k > 0 ? FR[k - 1].low : 0;
};
const rateText = (h: number): string => {
  const r = Math.round(h);
  if (Math.abs(h - r) < 0.02) return r === 0 ? '1' : `1/${2 ** r}`;
  return (2 ** -h).toFixed(3);
};

// weight and moment strips: schematic values, restored exactly on an undone frame
const STRIP_N = 24;
type Strips = number[][]; // [weights, m, v]
const STRIP_AFTER: Strips[] = [];
const STRIP_TRIAL: Strips[] = [];
const STRIP_INIT: Strips = [0, 1, 2].map(() => []);
{
  const rand = mulberry32(0x3c3);
  const r = () => rand() * 2 - 1;
  for (let s = 0; s < 3; s++) for (let c = 0; c < STRIP_N; c++) STRIP_INIT[s].push(s === 0 ? r() * 0.7 : s === 1 ? r() * 0.3 : 0.2 + rand() * 0.3);
  let cur = STRIP_INIT.map((row) => row.slice());
  for (const f of FR) {
    const size = 0.12 + 0.3 * Math.sqrt(f.before);
    const g = Array.from({ length: STRIP_N }, () => r());
    const m = cur[1].map((v, c) => 0.9 * v + 0.1 * g[c] * 2.5);
    const v2 = cur[2].map((v, c) => Math.min(1, 0.9 * v + 0.1 * Math.abs(g[c])));
    const w = cur[0].map((v, c) => Math.max(-1, Math.min(1, v - size * m[c])));
    const trial = [w, m, v2];
    STRIP_TRIAL.push(trial);
    if (!f.undone) cur = trial;
    STRIP_AFTER.push(cur.map((row) => row.slice()));
  }
}
const stripValues = (fi: number): Strips => {
  if (fi <= 0) return STRIP_INIT;
  const k = Math.min(N_FR - 1, Math.floor(fi));
  const u = Math.min(1, fi - k);
  const prev = k > 0 ? STRIP_AFTER[k - 1] : STRIP_INIT;
  const trial = STRIP_TRIAL[k];
  const f = FR[k];
  const to = (p: Strips, q: Strips, a: number) => p.map((row, s) => row.map((v, c) => lerp(v, q[s][c], a)));
  if (u < 0.35) return to(prev, trial, smooth(u / 0.35));
  if (!f.undone) return trial;
  return to(trial, prev, smooth(win(u, 0.5, 0.7)));
};

// ---------------------------------------------------------------------------
// Prologue: the page before October 13 (stage 538 × 430, drawn at 0.9)
// ---------------------------------------------------------------------------

const PS = 0.9;
const PX0 = 398;
const PY0 = 104;
const px = (x: number) => PX0 + x * PS;
const py = (y: number) => PY0 + y * PS;
const P_RECTS = [
  { x: 40, y: 50, w: 200, h: 160 },
  { x: 270, y: 50, w: 228, h: 160 },
  { x: 40, y: 240, w: 458, h: 150 },
];
// six drags of the middle rectangle, 2 px each; the photo's error after each drag (schematic, except the last: the
// lab's "up to 14 px")
const DRAG_DX = 2;
const JITTER: [number, number][] = [
  [0, 0],
  [1, -1],
  [-1.5, 1],
  [2.5, 1.5],
  [-3, -2],
  [4.5, 2],
  [14, 0],
];

// ---------------------------------------------------------------------------
// Closing heat belt: the 300 frames after Story's first fit (counts: README.md:56; order schematic)
// ---------------------------------------------------------------------------

const HEAT_N = 300;
const HEAT_RED = 238;
const RUN = 171;
const RUN_START = 92;
const HEAT_COLS = 50;
const HEAT_PITCH = 18;
const HEAT_CELL = 15;
const HEAT_X0 = STAGE_W / 2 - (HEAT_COLS * HEAT_PITCH) / 2;
const HEAT_Y0 = 262;
const HEAT: boolean[] = (() => {
  const red = Array.from({ length: HEAT_N }, (_, i) => i >= RUN_START && i < RUN_START + RUN);
  const others = Array.from({ length: HEAT_N }, (_, i) => i).filter((i) => !red[i] && i !== RUN_START - 1 && i !== RUN_START + RUN);
  const rand = mulberry32(0x238);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  for (let n = 0; n < HEAT_RED - RUN; n++) red[others[n]] = true;
  return red;
})();
{
  const count = HEAT.filter(Boolean).length;
  let longest = 0;
  let cur = 0;
  for (const r of HEAT) {
    cur = r ? cur + 1 : 0;
    longest = Math.max(longest, cur);
  }
  if (count !== HEAT_RED || longest !== RUN) throw new Error(`learned-gallery ch3: heat belt ${count} red, longest run ${longest}`);
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const HEADER_H = 76;
const LAD_X0 = 72;
const LAD_X1 = 150;
const LAD_Y0 = 140;
const LAD_DY = 33;
const ladY = (h: number) => LAD_Y0 + h * LAD_DY;
const STRIP_X0 = GATE_L;
const STRIP_CELL = 18;
const STRIP_Y = [336, 364, 392];
const STRIP_LABELS = ['weights · 24 of 244, schematic', 'first moment m · β1 0.9', 'second moment v · β2 0.999'];
const STRIP_COLORS = [colors.ACCENT, colors.SECONDARY, colors.TEAL];
const GAUGES = [
  { x: 230, title: 'maximumTrainingStepsPerFrame' },
  { x: 476, title: 'trainingMsPerFrame = 6' },
  { x: 722, title: 'owed time ÷ (1000 / 600) ms' },
  { x: 968, title: 'minimumTrainingStepsPerFrame' },
];
const GAUGE_W = 236;
const GAUGE_Y = 92;

const CAM_PRO: CameraState = { x: 640, y: 330, k: 1.12 };
const CAM_GATE: CameraState = { x: 560, y: 250, k: 1.4 };
const CAM_MID: CameraState = { x: 600, y: 350, k: 1.06 };
const CAM_LOW: CameraState = { x: 720, y: 440, k: 1.12 };
const CAM_HEAT: CameraState = { x: 640, y: 340, k: 1.1 };

// ---------------------------------------------------------------------------
// The narration (book.json chapters[2].captions, verbatim) and its pacing (~150 words a minute)
// ---------------------------------------------------------------------------

const CAPS = [
  "Adam at a fixed rate doesn't come to rest once the loss is low. Its steps keep their size while gradients shrink, and before October thirteenth six small drags made photos jump up to fourteen pixels.",
  'Training runs at six hundred steps a second at any frame rate: ten steps a frame at sixty frames a second, five at a hundred twenty. A frame trains at most twenty, and no more than fit in six milliseconds.',
  "Each frame is a bet. The program measures one function before the frame's steps and after them, with the multipliers, line counts and penalty weight frozen for that frame.",
  "If the function went up, the frame is taken back. The weights and both of Adam's running averages are restored, and the learning rate halves, down to a sixty-fourth.",
  'If it went down, the frame is kept and the rate grows by fifteen percent, or doubles below a sixty-fourth. Climbing from a sixty-fourth back to full takes about thirty kept frames.',
  "At the floor there's a trap. After five frames in a row are taken back at the low rate, it keeps halving, to one four-thousand-ninety-sixth, and kept frames double it. Otherwise a photo could stall thirty pixels off.",
  'A frame trains two steps or more, or none. After an undone one-step frame, the restored momentum can make the same step uphill at any rate, and every frame gets taken back while the photos freeze.',
  "On a device taking five milliseconds a step, one-step frames stopped Contact sheet's first fit at 529 steps, with a line nearly half a pixel apart. Two-step frames reached 874 steps and three hundredths of a pixel.",
  "The price is time. Where a step takes over three milliseconds, a frame's training can take up to twice the six millisecond budget, and the lab accepts that.",
  'Stopping is trickier than it sounds. With the penalty on, the loss has no value that means done. It rests where its two parts balance, say at one hundred-thousandth, with a photo held nine pixels from its rectangle.',
  'So the page watches the photos. A change gets at least 500 more steps, and training stops once no edge has moved more than a hundredth of a percent of the stage in 100 steps, or after 2,000.',
  "Once photos rest, most frames are taken back: 238 of the 300 after Story's first fit. Many redo the same ten steps from identical weights, up to 171 in a row, until the multipliers change.",
];
const HOLD = 0.7;
const CAP_AT: number[] = [];
const CAP_DUR: number[] = [];
{
  let t = 0.4;
  for (const c of CAPS) {
    const dur = +(c.split(/\s+/).length / 2.5 + 0.5).toFixed(1);
    CAP_AT.push(+t.toFixed(1));
    CAP_DUR.push(dur);
    t += dur + HOLD;
  }
}

// rest meter (schematic run): the largest edge movement over the last 100 steps, as a fraction of the stage
const REST_DIST = 0.0001;
const REST_STEPS = 100;
const MIN_AFTER = 500;
const MAX_AFTER = 2000;
const restMove = (s: number): number => Math.pow(10, -1.2 - (3.6 * s) / 820);
const REST_STOP = (() => {
  for (let s = 0; s <= MAX_AFTER; s++) if (s >= MIN_AFTER && restMove(s) <= REST_DIST) return s;
  return MAX_AFTER;
})();

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_PRO, cameraInterp);

  // prologue
  const proU = tl.channel('proU', 0);
  const dragU = tl.channel('dragU', 0);
  const lossChipU = tl.channel('lossChipU', 0);
  // the machine
  const fi = tl.channel('fi', 0);
  const beltOp = tl.channel('beltOp', 0);
  const hzRowU = tl.channel('hzRowU', 0);
  const budgetOp = tl.channel('budgetOp', 0);
  const budgetSpot = tl.channel('budgetSpot', 0); // 0 none · 1 cap 20 + 6 ms · 2 the 2-or-none gauge
  const slowDev = tl.channel('slowDev', 0); // 0: 0.4 ms a step · 1: 5 ms a step
  const gaugeOp = tl.channel('gaugeOp', 0);
  const lockU = tl.channel('lockU', 0);
  const lockOp = tl.channel('lockOp', 1);
  const stripsOp = tl.channel('stripsOp', 0);
  const ladderOp = tl.channel('ladderOp', 0);
  const extU = tl.channel('extU', 0);
  // lower panels
  const p4 = tl.channel('p4', 0);
  const p5 = tl.channel('p5', 0);
  const p6 = tl.channel('p6', 0);
  const p7 = tl.channel('p7', 0);
  const twoU = tl.channel('twoU', 0);
  const p8 = tl.channel('p8', 0);
  const barsU = tl.channel('barsU', 0);
  const p9 = tl.channel('p9', 0);
  const timeU = tl.channel('timeU', 0);
  const p10 = tl.channel('p10', 0);
  const lossU = tl.channel('lossU', 0);
  const p11 = tl.channel('p11', 0);
  const restU = tl.channel('restU', 0);
  const heatU = tl.channel('heatU', 0);
  const runU = tl.channel('runU', 0);
  const heatTextU = tl.channel('heatTextU', 0);

  CAPS.forEach((text, i) => {
    tl.caption({ at: CAP_AT[i], dur: CAP_DUR[i], text });
    tl.hold(CAP_AT[i] + CAP_DUR[i], HOLD);
  });
  const B = (i: number) => CAP_AT[i];
  const D = (i: number) => CAP_DUR[i];
  const fiRun = (to: number, at: number, end: number) => tl.tween(fi, to, { at, dur: Math.max(0.1, end - at), ease: ease.linear });

  // — B0 · fixed-rate Adam keeps stepping; six drags, a 14 px jump —
  let b = B(0);
  tl.tween(proU, 1, { at: b + 0.1, dur: 0.8, ease: ease.enter });
  tl.tween(lossChipU, 1, { at: b + 1.4, dur: 0.7, ease: ease.enter });
  tl.tween(dragU, 6, { at: b + 4.0, dur: D(0) - 5.2, ease: ease.linear });

  // — B1 · 600 steps a second; the four limits —
  b = B(1);
  tl.tween(proU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(lossChipU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: b, dur: 1.4, ease: ease.move });
  tl.tween(beltOp, 1, { at: b + 0.6, dur: 0.8, ease: ease.enter });
  fiRun(SEG.drop, b + 1.4, b + 8.4);
  tl.tween(hzRowU, 1, { at: b + 3.4, dur: 0.8, ease: ease.enter });
  tl.tween(budgetOp, 1, { at: b + 7.6, dur: 0.8, ease: ease.enter });
  tl.tween(budgetSpot, 1, { at: b + 10.4, dur: 0.6, ease: ease.enter });

  // — B2 · each frame is a bet: f before, f after, locks —
  b = B(2);
  tl.tween(hzRowU, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(budgetOp, WHISPER, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(budgetSpot, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_GATE, { at: b, dur: 1.4, ease: ease.move });
  tl.tween(gaugeOp, 1, { at: b + 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(stripsOp, 1, { at: b + 1.4, dur: 0.7, ease: ease.enter });
  fiRun(SEG.drop + 0.35, b + 2.4, b + 5.0);
  fiRun(SEG.drop + 0.5, b + 5.8, b + 6.8);
  tl.tween(lockU, 3, { at: b + 7.4, dur: 2.0, ease: ease.linear });

  // — B3 · the function went up: restore, halve, down to 1/64 —
  b = B(3);
  tl.tween(cam, CAM_MID, { at: b, dur: 1.3, ease: ease.move });
  tl.tween(lockOp, WHISPER, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(ladderOp, 1, { at: b + 0.3, dur: 0.8, ease: ease.enter });
  fiRun(SEG.drop + 1, b + 1.6, b + 4.2);
  tl.tween(p4, 1, { at: b + 2.6, dur: 0.7, ease: ease.enter });
  fiRun(SEG.climb, b + 5.0, b + D(3) - 0.4);

  // — B4 · kept: ×1.15, doubling below 1/64; about 30 kept frames —
  b = B(4);
  tl.tween(p4, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: b, dur: 1.2, ease: ease.move });
  tl.tween(p5, 1, { at: b + 0.6, dur: 0.7, ease: ease.enter });
  fiRun(SEG.redrop, b + 1.6, b + D(4) - 0.6);

  // — B5 · the floor trap: five in a row, on to 1/4096, doubling back —
  b = B(5);
  tl.tween(p5, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(p6, 1, { at: b + 0.6, dur: 0.7, ease: ease.enter });
  fiRun(SEG.atLow, b + 0.4, b + 2.6);
  fiRun(SEG.deep, b + 2.8, b + 6.8);
  tl.tween(extU, 1, { at: b + 6.2, dur: 0.8, ease: ease.enter });
  fiRun(SEG.double, b + 7.0, b + 9.6);
  fiRun(SEG.one, b + 10.0, b + D(5) - 0.4);

  // — B6 · two steps or none —
  b = B(6);
  tl.tween(p6, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(budgetOp, 1, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(slowDev, 1, { at: b + 0.4, dur: 0.6, ease: ease.move });
  tl.tween(gaugeOp, WHISPER, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(lockOp, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(p7, 1, { at: b + 0.6, dur: 0.7, ease: ease.enter });
  fiRun(SEG.two, b + 1.4, b + 9.6);
  tl.tween(budgetSpot, 2, { at: b + 10.0, dur: 0.6, ease: ease.enter });
  tl.tween(twoU, 1, { at: b + 10.0, dur: 0.7, ease: ease.enter });
  fiRun(N_FR, b + 10.4, b + D(6) - 0.2);

  // — B7 · 529 steps · 0.47 px vs 874 steps · 0.03 px —
  b = B(7);
  tl.tween(p7, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(budgetSpot, 0, { at: b, dur: 0.6, ease: ease.move });
  for (const ch of [budgetOp, beltOp, stripsOp, ladderOp, gaugeOp]) tl.tween(ch, WHISPER, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_LOW, { at: b, dur: 1.3, ease: ease.move });
  tl.tween(p8, 1, { at: b + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(barsU, 1, { at: b + 1.4, dur: 1.4, ease: ease.draw });

  // — B8 · the price is time —
  b = B(8);
  tl.tween(p8, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(p9, 1, { at: b + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(timeU, 1, { at: b + 1.6, dur: 1.4, ease: ease.draw });

  // — B9 · no loss value means done —
  b = B(9);
  tl.tween(p9, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(p10, 1, { at: b + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(lossU, 1, { at: b + 1.2, dur: 1.6, ease: ease.draw });

  // — B10 · the page watches the photos —
  b = B(10);
  tl.tween(p10, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(p11, 1, { at: b + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(restU, 1, { at: b + 2.0, dur: D(10) - 3.4, ease: ease.linear });

  // — B11 · at rest, most frames are taken back —
  b = B(11);
  tl.tween(p11, 0, { at: b, dur: 0.6, ease: ease.move });
  for (const ch of [budgetOp, beltOp, stripsOp, ladderOp, gaugeOp]) tl.tween(ch, 0, { at: b, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_HEAT, { at: b, dur: 1.3, ease: ease.move });
  tl.tween(heatU, 1, { at: b + 0.6, dur: 2.8, ease: ease.linear });
  tl.tween(heatTextU, 1, { at: b + 3.0, dur: 0.7, ease: ease.enter });
  tl.tween(runU, 1, { at: b + 6.4, dur: 1.2, ease: ease.draw });
  const end = CAP_AT[11] + CAP_DUR[11];
  tl.tween(cam, CAMERA_HOME, { at: end - 2.2, dur: 1.4, ease: ease.move });
  tl.hold(end + HOLD, 1.6);

  return {
    tl, cam, proU, dragU, lossChipU, fi, beltOp, hzRowU, budgetOp, budgetSpot, slowDev, gaugeOp, lockU, lockOp,
    stripsOp, ladderOp, extU, p4, p5, p6, p7, twoU, p8, barsU, p9, timeU, p10, lossU, p11, restU, heatU, runU, heatTextU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (local)
// ---------------------------------------------------------------------------

function CodeChip({ x, y, lines, stripe = colors.TEAL, opacity = 1, fs = 13 }: {
  x: number; y: number; lines: string[]; stripe?: string; opacity?: number; fs?: number;
}) {
  if (opacity <= 0.005) return null;
  const adv = fs === 14 ? CH14 : CH13;
  const lh = fs + 4;
  const w = Math.max(...lines.map((l) => l.length)) * adv + 26;
  const h = lines.length * lh + 12;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={6} fill={colors.PANEL} fillOpacity={0.96} stroke={colors.GRID} />
      <rect x={x} y={y} width={4} height={h} rx={2} fill={stripe} />
      {lines.map((l, i) => (
        <text key={i} x={x + 14} y={y + 6 + lh * (i + 1) - 4} fill={colors.TEXT} fontSize={fs} fontFamily={MONO} style={{ whiteSpace: 'pre' }}>
          {l}
        </text>
      ))}
    </g>
  );
}

function Padlock({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <g>
      <path d={`M ${x + 3} ${y + 7} V ${y + 4} a 5 5 0 0 1 10 0 V ${y + 7}`} fill="none" stroke={color} strokeWidth={1.8} />
      <rect x={x} y={y + 7} width={16} height={11} rx={2} fill={color} />
    </g>
  );
}

function T({ x, y, children, size = 13, color = colors.TEXT, mono = false, anchor = 'start', opacity = 1, weight }: {
  x: number; y: number; children: ReactNode; size?: number; color?: string; mono?: boolean;
  anchor?: 'start' | 'middle' | 'end'; opacity?: number; weight?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <text x={x} y={y} fill={color} fontSize={size} fontFamily={mono ? MONO : UI} textAnchor={anchor} opacity={opacity} fontWeight={weight}>
      {children}
    </text>
  );
}

// one frame block on the belt
function FrameBlock({ i, fiv, y = BELT_Y }: { i: number; fiv: number; y?: number }) {
  const f = FR[i];
  const x = frameX(i, fiv);
  const w = fw(f.steps);
  const edge = clamp01((x - 200) / 40) * clamp01((1250 - (x + w)) / 30);
  if (edge <= 0.01) return null;
  const u = fiv - i;
  const trial = u <= 0 ? 0 : clamp01(u / 0.35);
  const dec = u <= 0 ? 0 : smooth(win(u, 0.5, 0.62));
  const rewind = f.undone ? smooth(win(u, 0.5, 0.7)) : 0;
  const active = u > 0 && u < 1;
  const tone = f.neutral ? colors.TEXT : f.undone ? colors.NEGATIVE : colors.POSITIVE;
  const stroke = dec > 0.5 ? (f.neutral ? colors.MUTED : tone) : active ? colors.WARM : colors.GRID;
  const fillOp = f.neutral ? 0 : dec * (f.undone ? 0.16 : 0.2);
  return (
    <g opacity={edge}>
      <rect x={x + 2} y={y} width={w - 4} height={BELT_H} rx={5} fill={colors.PANEL} stroke={stroke} strokeWidth={active ? 2 : 1.3} />
      {fillOp > 0.01 && <rect x={x + 2} y={y} width={w - 4} height={BELT_H} rx={5} fill={tone} opacity={fillOp} />}
      {Array.from({ length: f.steps }, (_, j) => {
        const tx = f.steps <= 2 ? x + (w * (j + 1)) / (f.steps + 1) : x + PX_STEP * (j + 0.5);
        const lit = trial * f.steps > j + 0.001 && (1 - rewind) * f.steps > j + 0.001;
        const unlit = f.undone && dec > 0.5 && !lit;
        const col = !lit ? (unlit ? colors.NEGATIVE : colors.GRID) : dec > 0.5 ? (f.neutral ? colors.TEXT : tone) : colors.WARM;
        return <line key={j} x1={tx} x2={tx} y1={y + 12} y2={y + BELT_H - 12} stroke={col} strokeWidth={2} opacity={unlit ? 0.5 : 1} strokeLinecap="round" />;
      })}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const fiv = s.get(scene.fi);
  const proU = s.get(scene.proU);
  const beltOp = s.get(scene.beltOp);
  const hzRowU = s.get(scene.hzRowU);
  const budgetOp = s.get(scene.budgetOp);
  const budgetSpot = s.get(scene.budgetSpot);
  const slowDev = s.get(scene.slowDev);
  const gaugeOp = s.get(scene.gaugeOp);
  const lockU = s.get(scene.lockU);
  const lockOp = s.get(scene.lockOp);
  const stripsOp = s.get(scene.stripsOp);
  const ladderOp = s.get(scene.ladderOp);
  const extU = s.get(scene.extU);
  const heatU = s.get(scene.heatU);

  const kNow = Math.max(0, Math.min(N_FR - 1, Math.floor(fiv)));
  const uNow = fiv - kNow;
  const fNow = FR[kNow];
  const h = halvings(fiv);

  // the frames near the gate
  const visible: number[] = [];
  for (let i = 0; i < N_FR; i++) {
    const x = frameX(i, fiv);
    if (x > 150 && x < 1290) visible.push(i);
  }

  // f before / after gauges (schematic heights) for the frame in the gate
  const gateActive = uNow > 0 && uNow < 0.7;
  const afterGrow = smooth(win(uNow, 0.35, 0.5));
  const afterH = fNow.neutral ? 52 : fNow.undone ? 72 : 40;
  const afterCol = fNow.neutral ? colors.MUTED : fNow.undone ? colors.NEGATIVE : colors.POSITIVE;
  const rewindFlash = fNow.undone ? Math.sin(Math.PI * win(uNow, 0.5, 0.75)) : 0;

  const strips = stripValues(fiv);
  const floorH = lowNow(fiv) >= 5 ? 12 : 6;

  // prologue
  const dragU = s.get(scene.dragU);
  const dragK = Math.floor(dragU + 1e-6);
  const dragFrac = dragU - dragK;
  const jit = (k: number) => JITTER[Math.max(0, Math.min(6, k))];
  const jA = jit(dragK);
  const jB = jit(dragK + 1);
  const settle = smooth(win(dragFrac, 0.1, 0.5));
  const jx = dragK >= 6 ? JITTER[6][0] : lerp(jA[0], jB[0], settle);
  const jy = dragK >= 6 ? JITTER[6][1] : lerp(jA[1], jB[1], settle);
  const sketchDx = DRAG_DX * Math.min(6, dragK + smooth(win(dragFrac, 0, 0.3)));
  const jumpU = smooth(win(dragU, 5.6, 6));

  // panel opacities
  const p4 = s.get(scene.p4);
  const p5 = s.get(scene.p5);
  const p6 = s.get(scene.p6);
  const p7 = s.get(scene.p7);
  const twoU = s.get(scene.twoU);
  const p8 = s.get(scene.p8);
  const barsU = s.get(scene.barsU);
  const p9 = s.get(scene.p9);
  const timeU = s.get(scene.timeU);
  const p10 = s.get(scene.p10);
  const lossU = s.get(scene.lossU);
  const p11 = s.get(scene.p11);
  const restU = s.get(scene.restU);

  const keptSinceLow = Math.max(0, Math.min(30, Math.floor(fiv - 0.6) - SEG.climb + 1));
  const lowCount = lowNow(fiv);

  // stall inset: the photo stands still while every frame is taken back, and moves once kept frames double the rate
  const stallMove = smooth(win(fiv, SEG.double, SEG.one));

  // momentum sketch: one-step frames 61-68 repeat the same uphill step; two-step frames go down
  const curveY = (x: number) => 604 - 112 * ((x - 440) / 200) ** 2;
  let ballX = 540;
  let trialX = 540;
  if (kNow >= SEG.one && kNow < SEG.two && fiv < SEG.two) {
    const up = smooth(clamp01(uNow / 0.35)) * (1 - smooth(win(uNow, 0.5, 0.7)));
    trialX = 540 + 34 * up;
  } else if (fiv >= SEG.two) {
    ballX = 540 - 22 * Math.min(4, fiv - SEG.two);
    trialX = ballX;
  }
  const takenBackOne = Math.max(0, Math.min(8, fiv >= SEG.two ? 8 : kNow >= SEG.one ? kNow - SEG.one + (decided(kNow, fiv) ? 1 : 0) : 0));

  // heat belt
  const heatCells = heatU > 0.001 ? HEAT.map((red, i) => {
    const ui = smooth(clamp01((heatU - (0.65 * i) / (HEAT_N - 1)) / 0.35));
    const col = i % HEAT_COLS;
    const row = Math.floor(i / HEAT_COLS);
    return { red, ui, x: HEAT_X0 + col * HEAT_PITCH, y: lerp(BELT_Y + 16, HEAT_Y0 + row * HEAT_PITCH, ui), inRun: i >= RUN_START && i < RUN_START + RUN };
  }) : [];
  const runU = s.get(scene.runU);
  const heatTextU = s.get(scene.heatTextU);
  
  // rest meter scales
  const RX0 = 300;
  const RX1 = 1180;
  const rX = (st: number) => RX0 + ((RX1 - RX0) * st) / MAX_AFTER;
  const rY = (v: number) => 492 + ((-Math.log10(v) - 1) / 4.2) * 104;
  const restS = restU * REST_STOP;
  const restPath = (() => {
    const pts: string[] = [];
    for (let st = 0; st <= restS; st += 10) pts.push(`${pts.length ? 'L' : 'M'} ${rX(st).toFixed(1)} ${rY(restMove(st)).toFixed(1)}`);
    return pts.join(' ');
  })();

  // loss curve (schematic): falls, then rests at 1e-5
  const LX0 = 290;
  const LX1 = 700;
  const lY = (lg: number) => 482 + ((-1 - lg) / 5) * 112;
  const lossPath = (() => {
    const pts: string[] = [];
    const n = Math.round(120 * lossU);
    for (let j = 0; j <= n; j++) {
      const u = j / 120;
      const lg = -5 + 3.6 * Math.exp(-u / 0.16) + 0.08 * Math.sin(u * 40) * Math.exp(-u / 0.3);
      pts.push(`${j ? 'L' : 'M'} ${lerp(LX0, LX1, u).toFixed(1)} ${lY(lg).toFixed(1)}`);
    }
    return pts.join(' ');
  })();

  // time bar
  const MS_X0 = 330;
  const MS_PX = 64;
  const msX = (ms: number) => MS_X0 + ms * MS_PX;

  const gaugeValue = (g: number): { v: number; text: string } => {
    if (g === 0) return { v: MAX_STEPS, text: `${MAX_STEPS} steps` };
    if (g === 1) return slowDev < 0.5
      ? { v: BUDGET_FAST, text: `⌊6 ms ÷ ${CHROME_MS} ms⌋ = ${BUDGET_FAST}` }
      : { v: BUDGET_SLOW, text: `⌊6 ms ÷ ${SLOW_MS} ms⌋ = ${BUDGET_SLOW}` };
    if (g === 2) return { v: AT_60, text: `16.7 ms → ${AT_60} · 8.3 ms → ${AT_120}` };
    return slowDev < 0.5 ? { v: MIN_STEPS, text: `${MIN_STEPS} or none` } : { v: MIN_STEPS, text: `${SLOW_OLD} fits → ${SLOW_NOW} or none` };
  };
  const gaugeSpot = (g: number): number => {
    const a = clamp01(budgetSpot);
    const c = clamp01(budgetSpot - 1);
    if (g === 0 || g === 1) return 1 - 0.65 * c;
    if (g === 3) return 1 - 0.65 * a + 0.65 * c;
    return 1 - 0.65 * Math.max(a - c, c);
  };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== B0 · the prologue: the page before October 13 ======================== */}
        {proU > 0.01 && (
          <g opacity={proU}>
            <rect x={px(0)} y={py(0)} width={538 * PS} height={430 * PS} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
            <T x={px(538)} y={py(0) - 8} anchor="end" color={colors.MUTED} mono>stage 538 × 430 px</T>
            {P_RECTS.map((r, k) => {
              const dx = k === 1 ? sketchDx : 0;
              const ox = k === 1 ? jx : 0;
              const oy = k === 1 ? jy : 0;
              return (
                <g key={k}>
                  <rect x={px(r.x + dx + ox)} y={py(r.y + oy)} width={r.w * PS} height={r.h * PS} rx={4} fill={colors.ACCENT} fillOpacity={0.22} stroke={colors.ACCENT} strokeWidth={1.4} />
                  <rect x={px(r.x + dx)} y={py(r.y)} width={r.w * PS} height={r.h * PS} rx={4} fill="none" stroke={colors.TEXT} strokeDasharray="5 4" strokeWidth={1.2} opacity={0.7} />
                </g>
              );
            })}
            <T x={px(50)} y={py(32)} color={colors.MUTED}>dashed: the sketch · filled: the photos</T>
            {jumpU > 0.01 && (
              <g opacity={jumpU}>
                <line x1={px(270 + 228 + sketchDx)} y1={py(40)} x2={px(270 + 228 + sketchDx + 14)} y2={py(40)} stroke={colors.WARM} strokeWidth={2.5} />
                <line x1={px(270 + 228 + sketchDx + 14)} y1={py(34)} x2={px(270 + 228 + sketchDx + 14)} y2={py(46)} stroke={colors.WARM} strokeWidth={2} />
                <T x={px(270 + 228 + sketchDx) - 6} y={py(40) + 5} anchor="end" color={colors.WARM} mono size={15} weight={700}>photo jumps 14 px</T>
              </g>
            )}
            {/* the ghost timeline of six drags */}
            <T x={px(0)} y={512} color={colors.MUTED} mono>before Oct 13 · Adam at a fixed rate</T>
            <line x1={px(0)} x2={px(538)} y1={540} y2={540} stroke={colors.GRID} strokeWidth={1.5} strokeDasharray="3 4" />
            {Array.from({ length: 6 }, (_, k) => {
              const x = px(120 + k * 72);
              const on = clamp01(dragU - k);
              return (
                <g key={k}>
                  <circle cx={x} cy={540} r={7} fill={on > 0.01 ? (k === 5 ? colors.WARM : colors.ACCENT) : colors.BG} stroke={k === 5 ? colors.WARM : colors.ACCENT} strokeWidth={1.6} />
                  <T x={x} y={566} anchor="middle" color={colors.MUTED} mono opacity={0.5 + 0.5 * on}>{`drag ${k + 1}`}</T>
                </g>
              );
            })}
            <T x={px(538)} y={512} anchor="end" color={colors.MUTED}>earlier jitter schematic</T>
          </g>
        )}
        {s.get(scene.lossChipU) > 0.01 && (
          <g opacity={s.get(scene.lossChipU)}>
            <rect x={906} y={108} width={240} height={96} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
            <T x={920} y={130} color={colors.TEXT}>loss: already low</T>
            <path d="M 922 150 C 960 186, 990 190, 1130 190" fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
            <T x={920} y={222} color={colors.MUTED}>steps keep their size · schematic</T>
          </g>
        )}

        {/* ======================== the budget row: four caps on a frame's steps ======================== */}
        {budgetOp > 0.005 && (
          <g opacity={budgetOp}>
            {GAUGES.map((g, k) => {
              const gv = gaugeValue(k);
              const spot = gaugeSpot(k);
              const hot = (k === 3 && budgetSpot > 1.5) || (k === 1 && slowDev > 0.5);
              return (
                <g key={k} opacity={spot}>
                  <rect x={g.x} y={GAUGE_Y} width={GAUGE_W} height={58} rx={7} fill={colors.PANEL} stroke={hot ? colors.WARM : colors.GRID} strokeWidth={hot ? 1.8 : 1} />
                  <T x={g.x + 8} y={GAUGE_Y + 18} mono color={colors.TEAL}>{g.title}</T>
                  <rect x={g.x + 8} y={GAUGE_Y + 26} width={GAUGE_W - 16} height={7} rx={3} fill={colors.GRID} opacity={0.6} />
                  <rect x={g.x + 8} y={GAUGE_Y + 26} width={((GAUGE_W - 16) * gv.v) / MAX_STEPS} height={7} rx={3} fill={hot ? colors.WARM : colors.ACCENT} />
                  <T x={g.x + 8} y={GAUGE_Y + 50} mono color={colors.TEXT}>{gv.text}</T>
                </g>
              );
            })}
          </g>
        )}

        {/* ======================== the learning-rate ladder ======================== */}
        {ladderOp > 0.005 && (
          <g opacity={ladderOp}>
            <T x={111} y={110} anchor="middle" color={colors.MUTED}>learning-rate scale</T>
            <line x1={LAD_X0} x2={LAD_X0} y1={ladY(0)} y2={ladY(12)} stroke={colors.GRID} strokeWidth={1.5} />
            {Array.from({ length: 13 }, (_, r) => {
              const ext = r > 6;
              const op = ext ? 0.3 + 0.7 * extU : 1;
              const isFloor = r === floorH;
              return (
                <g key={r} opacity={op}>
                  <line x1={LAD_X0} x2={LAD_X1} y1={ladY(r)} y2={ladY(r)} stroke={isFloor ? colors.NEGATIVE : colors.GRID} strokeWidth={isFloor ? 2 : 1.2} strokeDasharray={isFloor ? '5 3' : undefined} />
                  <T x={LAD_X0 - 8} y={ladY(r) + 4.5} anchor="end" mono color={isFloor ? colors.NEGATIVE : colors.MUTED}>{r === 0 ? '1' : `1/${2 ** r}`}</T>
                </g>
              );
            })}
            <path d={`M ${LAD_X1 + 4} ${ladY(h)} l 12 -7 v 14 z`} fill={colors.WARM} />
            <line x1={LAD_X0} x2={LAD_X1} y1={ladY(h)} y2={ladY(h)} stroke={colors.WARM} strokeWidth={3} />
            <T x={LAD_X1 + 20} y={ladY(h) + 4.5} mono color={colors.WARM}>{rateText(h)}</T>
            <T x={30} y={558} color={colors.MUTED} mono>undo ×½ · keep ×1.15</T>
            <T x={30} y={574} color={colors.MUTED} mono>below 1/64: keep ×2</T>
            <T x={30} y={590} color={extU > 0.5 ? colors.NEGATIVE : colors.MUTED} mono>{extU > 0.5 ? 'floor 1/64 → 1/4096' : 'floor 1/64'}</T>
          </g>
        )}

        {/* ======================== f before / f after at the gate ======================== */}
        {gaugeOp > 0.005 && (
          <g opacity={gaugeOp}>
            <rect x={GATE_L - 4} y={BELT_Y - 6} width={96} height={BELT_H + 12} rx={8} fill="none" stroke={colors.WARM} strokeOpacity={0.5} strokeDasharray="4 4" />
            <T x={315} y={172} anchor="middle" color={colors.MUTED}>before</T>
            <T x={373} y={172} anchor="middle" color={colors.MUTED}>after</T>
            <rect x={300} y={248 - 52} width={30} height={52} rx={3} fill={colors.TEXT} opacity={gateActive || uNow === 0 ? 0.8 : 0.35} />
            {gateActive && afterGrow > 0.01 && (
              <rect x={358} y={248 - afterH * afterGrow} width={30} height={afterH * afterGrow} rx={3} fill={afterCol} />
            )}
            <line x1={294} x2={394} y1={248} y2={248} stroke={colors.GRID} strokeWidth={1.2} />
          </g>
        )}
        {lockU > 0.01 && (
          <g opacity={lockOp}>
            <T x={420} y={178} mono size={15} color={colors.TEAL} opacity={clamp01(lockU * 2)}>trainOrUndo(steps)</T>
            <T x={420} y={198} color={colors.TEXT} opacity={clamp01(lockU * 2)}>f = the loss with the multipliers in the pulls</T>
            <T x={420} y={216} color={colors.MUTED} opacity={clamp01(lockU * 2)}>(not the loss the page shows) · frozen for the frame:</T>
            {['multipliers', 'line counts', 'penalty weight'].map((w, k) => {
              const u = clamp01(lockU - k);
              const x = 420 + [0, 146, 292][k];
              return (
                <g key={k} opacity={u}>
                  <rect x={x} y={224} width={w.length * CH13 + 40} height={26} rx={6} fill={colors.PANEL} stroke={colors.WARM} strokeOpacity={0.6} />
                  <Padlock x={x + 8} y={228} color={colors.WARM} />
                  <T x={x + 30} y={242} mono color={colors.TEXT}>{w}</T>
                </g>
              );
            })}
          </g>
        )}

        {/* ======================== the belt ======================== */}
        {beltOp > 0.005 && (
          <g opacity={beltOp}>
            <line x1={210} x2={1250} y1={BELT_Y + BELT_H + 6} y2={BELT_Y + BELT_H + 6} stroke={colors.GRID} strokeWidth={1.2} />
            {visible.map((i) => <FrameBlock key={i} i={i} fiv={fiv} />)}
            {hzRowU > 0.01 && (
              <g opacity={hzRowU}>
                <T x={1240} y={BELT_Y - 10} anchor="end" mono color={colors.TEXT}>{`60 Hz · ${AT_60} steps a frame`}</T>
                {Array.from({ length: 24 }, (_, j) => {
                  const x = GATE_L + beltOffset(fiv) - (j - 4) * fw(AT_120);
                  const edge = clamp01((x - 200) / 40) * clamp01((1250 - (x + fw(AT_120))) / 30) * (x + fw(AT_120) <= frameX(0, fiv) + fw(AT_60) + 0.5 ? 1 : 0);
                  if (edge <= 0.01) return null;
                  return (
                    <g key={j} opacity={edge}>
                      <rect x={x + 2} y={336} width={fw(AT_120) - 4} height={36} rx={4} fill={colors.PANEL} stroke={colors.GRID} />
                      {Array.from({ length: AT_120 }, (_, q) => (
                        <line key={q} x1={x + PX_STEP * (q + 0.5)} x2={x + PX_STEP * (q + 0.5)} y1={346} y2={362} stroke={colors.TEXT} strokeWidth={2} strokeLinecap="round" />
                      ))}
                    </g>
                  );
                })}
                <T x={1240} y={392} anchor="end" mono color={colors.TEXT}>{`120 Hz · ${AT_120} steps a frame`}</T>
                <T x={1240} y={416} anchor="end" mono color={colors.MUTED}>600 steps a second · msPerTrainingStep = 1000 / 600</T>
              </g>
            )}
          </g>
        )}

        {/* ======================== weight and moment strips ======================== */}
        {stripsOp > 0.005 && (
          <g opacity={stripsOp}>
            {strips.map((row, sIdx) => (
              <g key={sIdx}>
                {row.map((v, c) => (
                  <rect key={c} x={STRIP_X0 + c * STRIP_CELL} y={STRIP_Y[sIdx]} width={STRIP_CELL - 2} height={20} rx={2}
                    fill={STRIP_COLORS[sIdx]} opacity={0.12 + 0.8 * Math.min(1, Math.abs(v))} />
                ))}
                <T x={STRIP_X0 + STRIP_N * STRIP_CELL + 12} y={STRIP_Y[sIdx] + 15} mono color={colors.MUTED}>{STRIP_LABELS[sIdx]}</T>
              </g>
            ))}
            {rewindFlash > 0.01 && (
              <g opacity={rewindFlash}>
                <rect x={STRIP_X0 - 6} y={STRIP_Y[0] - 6} width={STRIP_N * STRIP_CELL + 10} height={88} rx={6} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} />
                <T x={STRIP_X0 - 12} y={STRIP_Y[1] + 16} anchor="end" color={colors.NEGATIVE} size={22} weight={700}>↺</T>
              </g>
            )}
          </g>
        )}

        {/* ======================== B3 · restore and halve ======================== */}
        {p4 > 0.01 && (
          <g opacity={p4}>
            <CodeChip x={300} y={452} stripe={colors.NEGATIVE} lines={[
              'if (after.followed > before.followed) {',
              '  source.set(savedSource)',
              '  firstMoment.set(savedFirstMoment)',
              '  secondMoment.set(savedSecondMoment)',
              '  learningRateScale = Math.max(… 1 / 64, learningRateScale * 0.5)',
              '}',
            ]} />
            <T x={900} y={480} color={colors.NEGATIVE} size={16}>taken back</T>
            <T x={900} y={502} color={colors.TEXT}>weights, m and v restored</T>
            <T x={900} y={522} color={colors.TEXT}>{`rate now ${rateText(h)}`}</T>
            <T x={900} y={542} color={colors.MUTED}>keep/undo pattern schematic</T>
          </g>
        )}

        {/* ======================== B4 · kept: ×1.15, about 30 frames ======================== */}
        {p5 > 0.01 && (
          <g opacity={p5}>
            <CodeChip x={240} y={452} stripe={colors.ACCENT} lines={['learningRateScale = Math.min(1, learningRateScale * (learningRateScale < 1 / 64 ? 2 : 1.15))']} />
            <T x={250} y={530} color={colors.MUTED}>kept frames since 1/64</T>
            <T x={250} y={576} mono size={40} color={colors.POSITIVE} weight={700}>{`${keptSinceLow}`}</T>
            <T x={340} y={576} mono size={16} color={colors.MUTED}>{`rate ${rateText(h)}`}</T>
            <MathLabel tex={`\\frac{\\ln 64}{\\ln 1.15} \\approx ${CLIMB_TXT}`} x={860} y={552} fontSize={28} color={colors.TEXT} />
          </g>
        )}

        {/* ======================== B5 · the floor trap ======================== */}
        {p6 > 0.01 && (
          <g opacity={p6}>
            <CodeChip x={230} y={444} stripe={colors.NEGATIVE} lines={['learningRateScale = Math.max(framesTakenBackAtLowRate >= 5 ? 1 / 4096 : 1 / 64, learningRateScale * 0.5)']} />
            <T x={240} y={512} color={colors.MUTED}>taken back in a row at ≤ 1/64</T>
            <T x={240} y={560} mono size={40} weight={700} color={lowCount >= 5 ? colors.NEGATIVE : colors.TEXT}>{`${Math.min(lowCount, 5)}${lowCount >= 5 ? '' : ' / 5'}`}</T>
            <T x={240} y={590} mono color={colors.MUTED}>{lowCount >= 5 ? 'floor drops to 1/4096' : 'floor holds at 1/64'}</T>
            {/* the stall: a photo 30 px from a rectangle just added (drawn ×2) */}
            <rect x={780} y={496} width={450} height={118} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
            <rect x={1110} y={518} width={70} height={56} rx={4} fill="none" stroke={colors.TEXT} strokeDasharray="5 4" />
            <rect x={1110 - 60 * (1 - stallMove)} y={518} width={70} height={56} rx={4} fill={colors.ACCENT} fillOpacity={0.25} stroke={colors.ACCENT} strokeWidth={1.4} />
            {stallMove < 0.95 && (
              <g opacity={1 - stallMove}>
                <line x1={1050} x2={1110} y1={590} y2={590} stroke={colors.WARM} strokeWidth={2} />
                <T x={1080} y={606} anchor="middle" mono color={colors.WARM}>30 px (drawn ×2)</T>
              </g>
            )}
            <T x={796} y={524} color={colors.TEXT}>new rectangle,</T>
            <T x={796} y={542} color={colors.TEXT}>its photo far off</T>
            <T x={796} y={570} color={stallMove > 0.05 ? colors.POSITIVE : colors.NEGATIVE} mono>{stallMove > 0.05 ? 'moving again' : 'stands still'}</T>
          </g>
        )}

        {/* ======================== B6 · two steps or none ======================== */}
        {p7 > 0.01 && (
          <g opacity={p7}>
            <path d={(() => {
              const pts: string[] = [];
              for (let x = 250; x <= 640; x += 6) pts.push(`${pts.length ? 'L' : 'M'} ${x} ${curveY(x).toFixed(1)}`);
              return pts.join(' ');
            })()} fill="none" stroke={colors.GRID} strokeWidth={2} />
            <T x={250} y={466} color={colors.MUTED}>the followed function near the photos (schematic)</T>
            {fiv < SEG.two && (
              <g>
                <line x1={ballX} y1={curveY(ballX) - 14} x2={ballX + 46} y2={curveY(ballX + 46) - 14} stroke={colors.SECONDARY} strokeWidth={2.5} markerEnd="" />
                <path d={`M ${ballX + 46} ${curveY(ballX + 46) - 14} l -9 -1 l 5 8 z`} fill={colors.SECONDARY} />
                <T x={ballX + 54} y={curveY(ballX + 46) - 22} color={colors.SECONDARY} mono>restored momentum m</T>
              </g>
            )}
            {trialX > ballX + 0.5 && <circle cx={trialX} cy={curveY(trialX)} r={7} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="3 2" />}
            <circle cx={ballX} cy={curveY(ballX)} r={7} fill={fiv >= SEG.two ? colors.POSITIVE : colors.TEXT} />
            <T x={250} y={612} mono color={fiv >= SEG.two ? colors.POSITIVE : colors.NEGATIVE}>
              {fiv >= SEG.two ? `two-step frames: kept, photos move` : `one-step frame taken back ×${takenBackOne} · photos frozen`}
            </T>
            {twoU > 0.01 && (
              <g opacity={twoU}>
                <CodeChip x={760} y={470} stripe={colors.WARM} fs={14} lines={['minimumTrainingStepsPerFrame = 2']} />
                <T x={772} y={530} color={colors.TEXT}>a frame trains 2 steps or more, or none</T>
                <T x={772} y={550} color={colors.MUTED}>the second step has more of the slope in its momentum</T>
              </g>
            )}
          </g>
        )}

        {/* ======================== B7 · 529 steps · 0.47 px vs 874 steps · 0.03 px ======================== */}
        {p8 > 0.01 && (
          <g opacity={p8}>
            <T x={250} y={470} color={colors.MUTED}>{`Contact sheet · first fit · ${SLOW_MS} ms a step · stage 500 px`}</T>
            {[
              { label: '1 step / frame', steps: 529, gap: 0.47, col: colors.NEGATIVE, y: 500 },
              { label: '2 steps / frame', steps: 874, gap: 0.03, col: colors.POSITIVE, y: 560 },
            ].map((r, k) => (
              <g key={k}>
                <T x={250} y={r.y + 19} mono color={colors.TEXT}>{r.label}</T>
                <rect x={390} y={r.y + 4} width={(r.steps / 1000) * 460 * barsU} height={20} rx={3} fill={r.col} opacity={0.85} />
                <T x={398 + (r.steps / 1000) * 460 * barsU} y={r.y + 19} mono color={r.col} opacity={barsU}>{`${r.steps} steps`}</T>
                <g opacity={barsU}>
                  <rect x={960} y={r.y} width={56} height={34} rx={3} fill={colors.ACCENT} fillOpacity={0.25} stroke={colors.ACCENT} />
                  <rect x={1022} y={r.y + r.gap * 100 * 0.5} width={56} height={34} rx={3} fill={colors.ACCENT} fillOpacity={0.25} stroke={colors.ACCENT} />
                  <T x={1090} y={r.y + 22} mono color={r.col}>{`${r.gap} px apart`}</T>
                </g>
              </g>
            ))}
            <T x={960} y={616} color={colors.MUTED} opacity={barsU}>photo tops, gap drawn ×50</T>
          </g>
        )}

        {/* ======================== B8 · the price is time ======================== */}
        {p9 > 0.01 && (
          <g opacity={p9}>
            <T x={250} y={466} color={colors.MUTED}>{`a step takes ${SLOW_MS} ms: ⌊6 ÷ ${SLOW_MS}⌋ = ${BUDGET_SLOW} fits, so the frame trains ${SLOW_NOW}`}</T>
            <line x1={msX(0)} x2={msX(12)} y1={580} y2={580} stroke={colors.GRID} strokeWidth={1.5} />
            {[0, 2, 4, 6, 8, 10, 12].map((ms) => (
              <g key={ms}>
                <line x1={msX(ms)} x2={msX(ms)} y1={580} y2={586} stroke={colors.GRID} />
                <T x={msX(ms)} y={604} anchor="middle" mono color={colors.MUTED}>{`${ms} ms`}</T>
              </g>
            ))}
            {[0, 1].map((k) => {
              const u = clamp01(timeU * 2 - k);
              return (
                <g key={k} opacity={u > 0 ? 1 : 0}>
                  <rect x={msX(k * SLOW_MS) + 1} y={528} width={Math.max(0, (SLOW_MS * MS_PX - 2) * u)} height={34} rx={4} fill={k === 0 ? colors.ACCENT : colors.WARM} opacity={0.8} />
                  {u > 0.6 && <T x={msX(k * SLOW_MS + SLOW_MS / 2)} y={550} anchor="middle" mono color={colors.BG} weight={700}>{`step ${k + 1} · ${SLOW_MS} ms`}</T>}
                </g>
              );
            })}
            <line x1={msX(BUDGET_MS)} x2={msX(BUDGET_MS)} y1={496} y2={580} stroke={colors.TEXT} strokeWidth={2} strokeDasharray="5 4" />
            <T x={msX(BUDGET_MS)} y={490} anchor="middle" mono color={colors.TEXT}>trainingMsPerFrame = 6</T>
            <line x1={msX(12)} x2={msX(12)} y1={510} y2={580} stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="2 3" />
            <T x={msX(12)} y={504} anchor="middle" mono color={colors.WARM}>2 × 6 ms</T>
            <T x={msX(SLOW_FRAME_MS) + 8} y={524} mono color={colors.WARM} opacity={win(timeU, 0.9, 1)}>{`${SLOW_FRAME_MS} ms`}</T>
          </g>
        )}

        {/* ======================== B9 · no value means done ======================== */}
        {p10 > 0.01 && (
          <g opacity={p10}>
            <T x={LX0} y={466} color={colors.MUTED}>loss, penalty on (schematic curve)</T>
            {[-1, -3, -5].map((lg) => (
              <g key={lg}>
                <line x1={LX0} x2={LX1} y1={lY(lg)} y2={lY(lg)} stroke={colors.GRID} strokeOpacity={0.5} strokeDasharray="2 4" />
                <T x={LX0 - 8} y={lY(lg) + 4} anchor="end" mono color={colors.MUTED}>{`1e${lg}`}</T>
              </g>
            ))}
            <path d={lossPath} fill="none" stroke={colors.SECONDARY} strokeWidth={2.4} />
            <T x={LX1} y={lY(-5) - 10} anchor="end" mono color={colors.SECONDARY} opacity={win(lossU, 0.85, 1)}>rests ≈ 1e-5, never 0</T>
            <rect x={800} y={470} width={420} height={140} rx={8} fill={colors.PANEL} stroke={colors.GRID} />
            <rect x={1040} y={502} width={100} height={70} rx={4} fill="none" stroke={colors.TEXT} strokeDasharray="5 4" />
            <rect x={1040} y={502 - 36} width={100} height={70} rx={4} fill={colors.ACCENT} fillOpacity={0.25} stroke={colors.ACCENT} opacity={win(lossU, 0.6, 0.9)} />
            <line x1={1152} x2={1152} y1={466} y2={502} stroke={colors.WARM} strokeWidth={2} opacity={win(lossU, 0.6, 0.9)} />
            <T x={1158} y={490} mono color={colors.WARM} opacity={win(lossU, 0.6, 0.9)}>9 px</T>
            <T x={816} y={498} color={colors.TEXT}>held by the pull</T>
            <T x={816} y={518} color={colors.TEXT}>of a line</T>
            <T x={816} y={596} color={colors.MUTED}>drawn ×4 · stage 620 px</T>
          </g>
        )}

        {/* ======================== B10 · the rest meter ======================== */}
        {p11 > 0.01 && (
          <g opacity={p11}>
            <T x={RX0} y={466} mono color={colors.TEXT}>{`restSteps = ${REST_STEPS} · restDistance = ${REST_DIST}`}</T>
            <T x={RX1} y={466} anchor="end" color={colors.MUTED}>largest edge move in 100 steps, schematic run</T>
            <line x1={RX0} x2={RX1} y1={600} y2={600} stroke={colors.GRID} strokeWidth={1.5} />
            <line x1={RX0} x2={RX1} y1={rY(REST_DIST)} y2={rY(REST_DIST)} stroke={colors.POSITIVE} strokeDasharray="5 4" strokeWidth={1.5} />
            <T x={RX0 - 8} y={rY(REST_DIST) + 4} anchor="end" mono color={colors.POSITIVE}>0.01%</T>
            {[0, MIN_AFTER, 1000, 1500, MAX_AFTER].map((st) => (
              <T key={st} x={rX(st)} y={618} anchor="middle" mono color={st === MIN_AFTER || st === MAX_AFTER ? colors.WARM : colors.MUTED}>{st.toLocaleString('en-US')}</T>
            ))}
            <rect x={rX(0)} y={486} width={rX(MIN_AFTER) - rX(0)} height={114} fill={colors.WARM} opacity={0.08} />
            <T x={rX(MIN_AFTER / 2)} y={592} anchor="middle" mono color={colors.WARM}>at least 500</T>
            <line x1={rX(MAX_AFTER)} x2={rX(MAX_AFTER)} y1={486} y2={600} stroke={colors.WARM} strokeDasharray="3 3" />
            <T x={rX(MAX_AFTER) - 6} y={592} anchor="end" mono color={colors.WARM}>at most 2,000</T>
            <path d={restPath} fill="none" stroke={colors.ACCENT} strokeWidth={2.4} />
            {restU > 0.01 && (
              <g>
                <rect x={rX(Math.max(0, restS - REST_STEPS))} y={rY(restMove(restS)) - 10} width={rX(restS) - rX(Math.max(0, restS - REST_STEPS))} height={20} fill={colors.ACCENT} opacity={0.18} />
                <circle cx={rX(restS)} cy={rY(restMove(restS))} r={5} fill={colors.ACCENT} />
              </g>
            )}
            {restU > 0.98 && <T x={rX(REST_STOP) + 12} y={rY(REST_DIST) + 22} mono color={colors.POSITIVE}>at rest → stop</T>}
          </g>
        )}

        {/* ======================== B11 · the heat belt: 300 frames at rest ======================== */}
        {heatU > 0.001 && (
          <g>
            {heatCells.map((c, i) => c.ui > 0.01 && (
              <rect key={i} x={c.x} y={c.y} width={HEAT_CELL} height={HEAT_CELL} rx={2}
                fill={c.red ? colors.NEGATIVE : colors.POSITIVE} opacity={c.ui * (c.red ? 0.85 : 0.7) * (runU > 0.01 && !c.inRun ? 1 - 0.55 * runU : 1)}
                stroke={c.inRun && runU > 0.01 ? colors.WARM : 'none'} strokeWidth={1.4} strokeOpacity={runU} />
            ))}
            <g opacity={heatTextU}>
              <T x={HEAT_X0} y={HEAT_Y0 - 16} color={colors.MUTED}>{`the ${HEAT_N} frames after Story's first fit · one run · order schematic`}</T>
              <T x={HEAT_X0} y={HEAT_Y0 + 6 * HEAT_PITCH + 40} size={24} weight={700} color={colors.NEGATIVE}>{`${HEAT_RED} of ${HEAT_N} taken back`}</T>
              <T x={HEAT_X0 + 300} y={HEAT_Y0 + 6 * HEAT_PITCH + 40} size={15} color={colors.POSITIVE}>{`${HEAT_N - HEAT_RED} kept`}</T>
            </g>
            {runU > 0.01 && (
              <g opacity={runU}>
                <T x={HEAT_X0} y={HEAT_Y0 + 6 * HEAT_PITCH + 72} size={16} color={colors.WARM}>{`${RUN} in a row redo the same ${AT_60} steps from identical weights`}</T>
                <T x={HEAT_X0} y={HEAT_Y0 + 6 * HEAT_PITCH + 96} color={colors.MUTED}>until the multipliers change</T>
                </g>
            )}
          </g>
        )}
      </Camera>

      {/* ======================== screen-space title band ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={HEADER_H} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        3 · Taking steps back
      </text>
      <text x={40} y={58} fill={colors.TEAL} fontSize={13} fontFamily={MONO}>
        {kNow >= SEG.drop && beltOp > 0.5 ? (fNow.neutral ? '' : `frame ${kNow - SEG.drop + 1} · ${fNow.steps} step${fNow.steps > 1 ? 's' : ''} · ${decided(kNow, fiv) ? (fNow.undone ? 'taken back' : 'kept') : 'in the gate'}`) : ''}
      </text>
    </>
  );
}

export const vizScene = () => scene;
