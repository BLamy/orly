// Lining up without snapping
//
// Learned Gallery — chapter 2. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT)
//   lab/learned-gallery/README.md:13 (Cheng's request and verdict; the Oct 13 straightening; "Since October 14
//     nothing straightens the sketch"; px on a stage of 538 by 430 px)
//   lab/learned-gallery/README.md:15 (the loss in two parts; the penalty reads only the photos; pull = 5 × gap, at
//     most reach − gap; ÷ edges on the lines; ordinary code counts the lines each frame)
//   lab/learned-gallery/README.md:16 (the multipliers: a tenth of the gap per step; not part of the shown loss)
//   lab/learned-gallery/README.md:17 (the slider: off to 8%, starts at 4%, reach is half of it)
//   lab/learned-gallery/README.md:18 (a photo joins at half the distance it leaves; the 14 px drag)
//   lab/learned-gallery/README.md:19 (photos meet in the middle: 12 px drag, 9 px above, others 3 px down)
//   lab/learned-gallery/README.md:20 (the seeded pile; penalty off until 1e-6, at most 1,000 steps, then 200 steps;
//     presets 150 to 180 steps)
//   lab/learned-gallery/README.md table row 1 (372 single edits of 5 and 11 px: 0.04, 0.52 px vs 0.01, 0.16 px)
//   lab/learned-gallery/README.md:60 (alignRectangles: every sketch edge within 3% of a line onto it)
//   src/learned-gallery/trainable-geometry.ts:90 (penaltyStiffness = 5), :100 (penaltyStrength = 2),
//     :114-116 (penaltyOnsetDistance, penaltyOnsetSteps, penaltyRiseSteps), :124 (lineGap = 1/8), :132
//     (multiplierGrowth = 0.02), :138-141 (pairPull), :148-156 (pairCost), :603-607 (lineCount), :613 (startFrame),
//     :646 (the multiplier update)
//   src/learned-gallery/learned-gallery.ts:243 (defaultHoldDistance = 0.04), :436/:657 (reach = holdDistance / 2)
//   assets/learned-gallery.html:68 (slider min 0, max 8, step 0.5, value 4)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). pairPull and pairCost below are line-for-line ports of the source and the curve is drawn from
// them; the three plotted points, the reach and the px conversions are computed (and asserted) at module scope.
// SCHEMATIC, labelled on screen: the row's crooked sketch offsets, the seeded pile, the path the photos take while
// they close (the sliver and the multiplier's growth over it), and the onset step on the strength ramp.
// One change to the plan: beat 7's "equal bars" for a row of four and a row of two are dropped. The code divides a
// pair's charge by the edges on its lines (÷ 4 and ÷ 2, shown); "holds as far" is the lab's measured outcome, not a
// pull of equal size, so no bar heights are drawn for it.
import type { ReactNode } from 'react';
import 'katex/dist/katex.min.css';
import { scaleLinear } from 'd3';
import { CAMERA_HOME, Camera, MathLabel, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { FunctionPlot } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;

// ---------------------------------------------------------------------------
// The source's penalty (trainable-geometry.ts:90, :138-156), exact
// ---------------------------------------------------------------------------

const penaltyStiffness = 5;
const penaltyStrength = 2;
const multiplierGrowth = 0.02;
const penaltyRiseSteps = 200;

function pairPull(gap: number, multiplier: number, reach: number) {
  const limit = Math.max(0, reach - Math.abs(gap));
  return Math.max(-limit, Math.min(limit, multiplier + penaltyStiffness * gap));
}
function pairCost(gap: number, multiplier: number, reach: number) {
  const end = Math.min(Math.abs(gap), reach);
  const signedMultiplier = gap < 0 ? -multiplier : multiplier;
  const rise = Math.min(end, (reach - signedMultiplier) / (penaltyStiffness + 1));
  return signedMultiplier * rise + 0.5 * penaltyStiffness * rise * rise + reach * (end - rise) - 0.5 * (end * end - rise * rise);
}

// the slider (assets/learned-gallery.html:68) and its reach (learned-gallery.ts:436): reach = slider% / 2
const STAGE_PX = 538; // the lab's stage width for every px in this chapter
const SLIDER_DEFAULT = 4;
const reachOf = (sliderPct: number): number => sliderPct / 100 / penaltyStrength;
const REACH = reachOf(SLIDER_DEFAULT); // 0.02
const REACH_PX = REACH * STAGE_PX; // 10.76
const LEAVE_PX = (SLIDER_DEFAULT / 100) * STAGE_PX; // 21.52, two reaches
const PER_STEP = multiplierGrowth * penaltyStiffness; // 0.1 of the gap per step
const PULL_PTS: Array<[number, number]> = [0.005, 0.01, 0.02].map((g) => [g, pairPull(g, 0, REACH)]);
{
  const near = (a: number, b: number) => Math.abs(a - b) < 1e-12;
  if (!near(REACH, 0.02) || !near(PULL_PTS[0][1], 0.015) || !near(PULL_PTS[1][1], 0.01) || PULL_PTS[2][1] !== 0) {
    throw new Error('pairPull values disagree with the review');
  }
  if (REACH_PX.toFixed(1) !== '10.8' || LEAVE_PX.toFixed(1) !== '21.5' || !near(PER_STEP, 0.1)) throw new Error('reach');
}
const COST_MAX = pairCost(REACH, 0, REACH);
const px = (frac: number): number => frac * STAGE_PX;
const frac = (p: number): number => p / STAGE_PX;

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 stays empty for the CC pill)
// ---------------------------------------------------------------------------

// the row: four photos over a ruler; Z screen px per stage px, vertically
const Z = 8;
const LINE_Y = 222;
const PHOTO_W = 100;
const PHOTO_H = 84;
const photoX = (i: number) => 150 + i * 140;
const RULER_X = 112;
const topY = (off: number) => LINE_Y + Z * off;

// the sketch's tops, px from the line (SCHEMATIC, mean 0), and the pair A·B the plot follows
const SK = [-1.5, 2, -2.5, 2];
const A = 1;
const B = 2;
const GAP_AB_PX = SK[A] - SK[B]; // 4.5 px
const SNAP_TO = SK[0]; // alignRectangles: oldest rectangle's line first
const SLIVER = 0.15; // share of each gap that the pull alone leaves (schematic)
// the seeded pile (schematic): every photo in one place, tops within ~2 px
const PILE = [
  { x: 262, off: 5.5 },
  { x: 284, off: 6.5 },
  { x: 274, off: 4.8 },
  { x: 294, off: 6 },
];

// the multiplier over the closing steps (schematic path, exact rule: m += 0.1 · gap per step, within the limit)
const CLOSE_STEPS = 60;
const CLOSE = (() => {
  const out: Array<{ g: number; m: number }> = [];
  let m = 0;
  for (let k = 0; k <= CLOSE_STEPS; k++) {
    const u = k / CLOSE_STEPS;
    const g = frac(GAP_AB_PX * SLIVER) * (1 - u * u * (3 - 2 * u));
    out.push({ g, m });
    const limit = Math.max(0, REACH - Math.abs(g));
    m = Math.max(-limit, Math.min(limit, m + PER_STEP * g));
  }
  return out;
})();
const M_MAX = CLOSE[CLOSE_STEPS].m;

// the plot: pairPull against gap (share of the stage's width)
const PX = scaleLinear([-0.03, 0.03], [780, 1190]);
const PY = scaleLinear([-0.022, 0.022], [404, 136]);
const PY0 = PY(0);
const CY = scaleLinear([0, COST_MAX * 1.1], [PY0, 150]);

// the slider / gauge (lower right) and the lower-left band
const SL = { x0: 820, x1: 1160, y: 528 };
const slX = (pct: number) => lerp(SL.x0, SL.x1, pct / 8);

const HOME: CameraState = CAMERA_HOME;
const CAM_ROW: CameraState = { x: 620, y: 300, k: 1.1 };
const CAM_PLOT: CameraState = { x: 975, y: 300, k: 1.22 };
const CAM_MEET: CameraState = { x: 420, y: 300, k: 1.15 };
const CAM_BARS: CameraState = { x: 960, y: 250, k: 1.2 };

// the narration contract, verbatim (book.json chapters[1].captions)
const CAPTIONS = [
  'Hand-drawn sketches are crooked, so a row of photos has tops a few pixels apart. Cheng asked for a bigger or adjustable penalty for a grid that was unaligned.',
  "The first answer was ordinary code that straightened the sketch before training. Cheng's verdict: snapping to alignment is just a simple thought, and the gallery should learn something.",
  'So since October fourteenth nothing straightens the sketch. The loss gets a second part, a misalignment penalty, and photos line up only because training lowers it.',
  'The penalty never reads the sketch, only the photos. For every two photo edges of one kind, say two tops, it charges for the gap between them.',
  "The pull on a pair is five times the gap, capped at the reach minus the gap. So it's strongest between nearly aligned edges, and gone once the gap reaches one reach.",
  "Reach is half the slider's number. The slider runs from off to eight percent of the stage width and starts at four, so reach is two percent: about eleven pixels on a stage 538 pixels wide.",
  "A pair's charge is divided by how many edges share the line, so a row of four holds a photo no harder than a row of two. Ordinary code counts those lines at the start of each frame.",
  'A pull alone stalls with a sliver of gap left. So ordinary code keeps one extra number per pair, a multiplier, and grows it by a tenth of the gap each step until the gap closes.',
  "The multipliers aren't part of the loss the page shows. And the penalty waits, because the seeded pile has every edge within reach of every other. It switches on near the sketch, then ramps up over two hundred steps.",
  'After 372 small edits at four percent, a line of photos ends one hundredth of a pixel apart at the median and sixteen hundredths at worst. Straightening gave four hundredths and fifty-two hundredths.',
  'Photos meet in the middle. Drag one rectangle of a row of four twelve pixels down, and its photo stays in the row, nine pixels above the rectangle, while the other three move three pixels down.',
  'A photo joins a line at half the distance at which it leaves one. A rectangle dragged fourteen pixels out of its row keeps its photo there, yet with the slider off and back on, the photo sits on its rectangle.',
];
/** ~150 words a minute; a spoken number costs a few words more than it reads */
const speakDur = (text: string): number => {
  const words = text.split(/\s+/).length;
  const numbers = (text.match(/\d+/g) ?? []).length;
  return (words + 1.5 * numbers) / 2.5 + 0.3;
};
const HOLD = 0.8;

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', HOME, cameraInterp);
  // the row
  const rowU = tl.channel('rowU', 0);
  const rowOp = tl.channel('rowOp', 1);
  const crookU = tl.channel('crookGlow', 0);
  const snapU = tl.channel('snapU', 0);
  const gapGrow = tl.channel('gapGrow', 1);
  const pairU = tl.channel('pairU', 0);
  const reachBand = tl.channel('reachBand', 0);
  const alignU = tl.channel('alignU', 0);
  const closeK = tl.channel('closeK', 0);
  const lineChip = tl.channel('lineChip', 0);
  const pileU = tl.channel('pileU', 0);
  const pileLbl = tl.channel('pileLbl', 0);
  const levelU = tl.channel('levelU', 0);
  const rectDrag = tl.channel('rectDrag', 0);
  const rowShift = tl.channel('rowShift', 0);
  const photoC = tl.channel('photoC', 0);
  const meetLbl = tl.channel('meetLbl', 0);
  const hystLbl = tl.channel('hystLbl', 0);
  // the right side: quotes, the code box, the plot, the bars
  const quote1 = tl.channel('quote1', 0);
  const codeU = tl.channel('codeU', 0);
  const stampU = tl.channel('stampU', 0);
  const quote2 = tl.channel('quote2', 0);
  const axesU = tl.channel('axesU', 0);
  const plotOp = tl.channel('plotOp', 1);
  const costU = tl.channel('costU', 0);
  const costOp = tl.channel('costOp', 1);
  const pullU = tl.channel('pullU', 0);
  const texU = tl.channel('texU', 0);
  const guideU = tl.channel('guideU', 0);
  const ptsU = tl.channel('ptsU', 0);
  const probe = tl.channel('probeGap', 0);
  const probeU = tl.channel('probeU', 0);
  const probeMode = tl.channel('probeMode', 0);
  const slider = tl.channel('slider', SLIDER_DEFAULT);
  const sliderU = tl.channel('sliderU', 0);
  const gaugeU = tl.channel('gaugeU', 0);
  const notLossU = tl.channel('notLossU', 0);
  const barsU = tl.channel('barsU', 0);
  // the lower-left band
  const lossU = tl.channel('lossU', 0);
  const cutU = tl.channel('cutU', 0);
  const lossOp = tl.channel('lossOp', 1);
  const countU = tl.channel('countU', 0);
  const lampU = tl.channel('lampU', 0);
  const lampOn = tl.channel('lampOn', 0);
  const rampU = tl.channel('rampU', 0);
  const stripU = tl.channel('stripU', 0);

  const fade = (chs: Array<ChannelRef<number>>, to: number, at: number, dur = 0.6) =>
    chs.forEach((ch) => tl.tween(ch, to, { at, dur, ease: ease.move }));
  let t = 0.4;
  const say = (i: number): [number, number] => {
    const at = t;
    const dur = speakDur(CAPTIONS[i]);
    tl.caption({ at, dur, text: CAPTIONS[i] });
    t = tl.hold(at + dur, HOLD);
    return [at, at + dur];
  };

  // — B1 · crooked tops; Cheng's request —
  let [c, e] = say(0);
  tl.tween(rowU, 1, { at: c + 0.2, dur: 1.4, ease: ease.enter });
  tl.tween(cam, CAM_ROW, { at: c + 1.0, dur: 1.4, ease: ease.move });
  tl.tween(crookU, 1, { at: c + 2.2, dur: 0.7, ease: ease.enter });
  tl.tween(quote1, 1, { at: c + 5.6, dur: 0.8, ease: ease.enter });
  tl.tween(crookU, 0, { at: e - 0.4, dur: 0.6, ease: ease.move });

  // — B2 · alignRectangles: snapped, then not kept —
  [c, e] = say(1);
  tl.tween(cam, HOME, { at: c, dur: 1.2, ease: ease.move });
  tl.tween(quote1, 0, { at: c, dur: 0.6, ease: ease.move });
  tl.tween(codeU, 1, { at: c + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(snapU, 1, { at: c + 1.8, dur: 1.1, ease: ease.move });
  tl.tween(stampU, 1, { at: c + 5.0, dur: 0.5, ease: ease.pop });
  tl.tween(quote2, 1, { at: c + 5.6, dur: 0.8, ease: ease.enter });

  // — B3 · nothing straightens the sketch; the loss in two parts —
  [c, e] = say(2);
  fade([codeU, stampU, quote2], 0, c);
  tl.tween(snapU, 0, { at: c + 0.6, dur: 1.2, ease: ease.move });
  tl.tween(lossU, 1, { at: c + 3.0, dur: 1.0, ease: ease.enter });
  tl.tween(cutU, 1, { at: c + 7.0, dur: 0.6, ease: ease.pop });

  // — B4 · the pair A·B and its charge —
  [c, e] = say(3);
  fade([lossOp], 0, c + 2.2);
  tl.tween(pairU, 1, { at: c + 3.2, dur: 0.6, ease: ease.enter });
  tl.tween(axesU, 1, { at: c + 3.6, dur: 1.2, ease: ease.draw });
  tl.tween(gapGrow, 0, { at: c + 4.0, dur: 0.7, ease: ease.move });
  tl.tween(probeU, 1, { at: c + 4.6, dur: 0.4, ease: ease.enter });
  tl.tween(gapGrow, 1, { at: c + 5.2, dur: 2.2, ease: ease.move });
  tl.tween(costU, 1, { at: c + 5.2, dur: 2.2, ease: ease.draw });

  // — B5 · the pull: 5 × gap, capped at reach − gap —
  [c, e] = say(4);
  tl.tween(cam, CAM_PLOT, { at: c, dur: 1.3, ease: ease.move });
  tl.tween(rowOp, 0, { at: c, dur: 0.8, ease: ease.move });
  tl.tween(costOp, 0.12, { at: c + 0.4, dur: 0.8, ease: ease.move });
  tl.tween(texU, 1, { at: c + 0.8, dur: 0.6, ease: ease.enter });
  tl.tween(pullU, 1, { at: c + 1.2, dur: 1.5, ease: ease.draw });
  tl.tween(guideU, 1, { at: c + 2.6, dur: 0.8, ease: ease.enter });
  tl.set(probe, 0, c + 3.2);
  tl.set(probeMode, 1, c + 3.2);
  tl.tween(probe, REACH * 1.25, { at: c + 3.4, dur: 5.6, ease: ease.linear });
  tl.tween(ptsU, 1, { at: c + 4.0, dur: 3.0, ease: ease.linear });
  tl.tween(guideU, 0.3, { at: e - 0.8, dur: 0.6, ease: ease.move });

  // — B6 · the slider; reach = half its number —
  [c, e] = say(5);
  tl.tween(cam, HOME, { at: c, dur: 1.2, ease: ease.move });
  tl.tween(rowOp, 1, { at: c + 0.4, dur: 0.8, ease: ease.move });
  tl.tween(probeU, 0, { at: c, dur: 0.5, ease: ease.move });
  tl.set(probeMode, 0, c + 0.6);
  tl.tween(ptsU, 0, { at: c, dur: 0.5, ease: ease.move });
  tl.tween(guideU, 0, { at: c, dur: 0.5, ease: ease.move });
  tl.tween(texU, 0.3, { at: c, dur: 0.5, ease: ease.move });
  tl.tween(pairU, 0, { at: c, dur: 0.5, ease: ease.move });
  tl.tween(sliderU, 1, { at: c + 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(slider, 8, { at: c + 2.4, dur: 1.3, ease: ease.move });
  tl.tween(slider, 0, { at: c + 4.0, dur: 1.6, ease: ease.move });
  tl.tween(slider, SLIDER_DEFAULT, { at: c + 5.9, dur: 1.2, ease: ease.move });
  tl.tween(reachBand, 1, { at: c + 8.0, dur: 0.8, ease: ease.enter });

  // — B7 · photos come together; line counts —
  [c, e] = say(6);
  fade([sliderU, reachBand], 0, c);
  tl.tween(texU, 0, { at: c, dur: 0.5, ease: ease.move });
  tl.tween(alignU, 1, { at: c + 0.3, dur: 2.4, ease: ease.move });
  tl.tween(lineChip, 1, { at: c + 2.8, dur: 0.6, ease: ease.enter });
  tl.tween(countU, 1, { at: c + 4.4, dur: 0.8, ease: ease.enter });

  // — B8 · the sliver and the multiplier —
  [c, e] = say(7);
  fade([lineChip, countU], 0, c);
  tl.tween(pairU, 1, { at: c + 0.3, dur: 0.5, ease: ease.enter });
  tl.tween(probeU, 1, { at: c + 0.5, dur: 0.5, ease: ease.enter });
  tl.tween(gaugeU, 1, { at: c + 3.6, dur: 0.7, ease: ease.enter });
  tl.tween(closeK, CLOSE_STEPS, { at: c + 6.5, dur: 6.0, ease: ease.linear });

  // — B9 · not in the shown loss; the pile waits, then the ramp —
  [c, e] = say(8);
  tl.tween(notLossU, 1, { at: c + 0.3, dur: 0.6, ease: ease.enter });
  fade([pairU, probeU], 0, c + 3.6);
  fade([gaugeU, notLossU], 0, c + 3.8);
  tl.tween(pileU, 1, { at: c + 4.0, dur: 1.4, ease: ease.move });
  tl.tween(lampU, 1, { at: c + 4.4, dur: 0.6, ease: ease.enter });
  tl.tween(pileLbl, 1, { at: c + 5.0, dur: 0.6, ease: ease.enter });
  tl.set(alignU, 0, c + 5.6);
  tl.set(closeK, 0, c + 5.6);
  tl.tween(pileLbl, 0, { at: c + 8.2, dur: 0.5, ease: ease.move });
  tl.tween(pileU, 0, { at: c + 8.4, dur: 1.6, ease: ease.move });
  tl.tween(lampOn, 1, { at: c + 10.3, dur: 0.4, ease: ease.pop });
  tl.tween(rampU, 1, { at: c + 10.6, dur: 2.6, ease: ease.linear });
  tl.tween(alignU, 1, { at: c + 10.8, dur: 2.4, ease: ease.move });
  tl.tween(closeK, CLOSE_STEPS, { at: c + 12.4, dur: 1.6, ease: ease.move });

  // — B10 · the table: penalty against straightening —
  [c, e] = say(9);
  fade([lampU, rowOp], 0, c);
  fade([plotOp], 0, c, 0.8);
  tl.tween(cam, CAM_BARS, { at: c + 0.2, dur: 1.3, ease: ease.move });
  tl.tween(barsU, 1, { at: c + 0.8, dur: 3.0, ease: ease.linear });

  // — B11 · photos meet in the middle —
  [c, e] = say(10);
  tl.set(levelU, 1, c);
  tl.tween(barsU, 0, { at: c, dur: 0.6, ease: ease.move });
  tl.tween(rowOp, 1, { at: c + 0.4, dur: 0.8, ease: ease.move });
  tl.tween(cam, CAM_MEET, { at: c + 0.4, dur: 1.3, ease: ease.move });
  tl.tween(rectDrag, 12, { at: c + 3.6, dur: 1.3, ease: ease.move });
  tl.tween(photoC, 3, { at: c + 4.4, dur: 1.4, ease: ease.move });
  tl.tween(rowShift, 3, { at: c + 4.4, dur: 1.4, ease: ease.move });
  tl.tween(meetLbl, 1, { at: c + 6.0, dur: 0.7, ease: ease.enter });

  // — B12 · joins at half the distance it leaves —
  [c, e] = say(11);
  tl.tween(cam, HOME, { at: c, dur: 1.3, ease: ease.move });
  tl.tween(meetLbl, 0, { at: c, dur: 0.5, ease: ease.move });
  tl.tween(stripU, 1, { at: c + 0.6, dur: 1.0, ease: ease.draw });
  tl.tween(hystLbl, 1, { at: c + 1.4, dur: 0.6, ease: ease.enter });
  tl.tween(rectDrag, 14, { at: c + 4.4, dur: 1.0, ease: ease.move });
  tl.tween(rowShift, 3.5, { at: c + 4.4, dur: 1.0, ease: ease.move });
  tl.tween(photoC, 3.5, { at: c + 4.4, dur: 1.0, ease: ease.move });
  tl.tween(plotOp, 1, { at: c + 6.6, dur: 0.6, ease: ease.move });
  tl.tween(texU, 0, { at: c + 6.6, dur: 0.1, ease: ease.move });
  tl.tween(sliderU, 1, { at: c + 6.6, dur: 0.6, ease: ease.enter });
  tl.tween(slider, 0, { at: c + 8.6, dur: 0.8, ease: ease.move });
  tl.tween(rowShift, 0, { at: c + 9.2, dur: 1.2, ease: ease.move });
  tl.tween(photoC, 14, { at: c + 9.2, dur: 1.2, ease: ease.move });
  tl.tween(slider, SLIDER_DEFAULT, { at: c + 11.6, dur: 0.8, ease: ease.move });
  // the closing frame: the row and the two thresholds; the slider and the plot whisper
  fade([sliderU, plotOp], 0.12, e - 0.4, 0.8);
  tl.hold(t, 2.0);

  return {
    tl, cam, rowU, rowOp, crookU, snapU, gapGrow, pairU, reachBand, alignU, closeK, lineChip, pileU, pileLbl,
    levelU, rectDrag, rowShift, photoC, meetLbl, hystLbl, quote1, codeU, stampU, quote2, axesU, plotOp,
    costU, costOp, pullU, texU, guideU, ptsU, probe, probeU, probeMode, slider, sliderU, gaugeU, notLossU, barsU,
    lossU, cutU, lossOp, countU, lampU, lampOn, rampU, stripU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Local pieces
// ---------------------------------------------------------------------------

function Txt({ x, y, children, size = 14, color = colors.TEXT, anchor = 'start', mono = false, weight, opacity = 1, italic = false }: {
  x: number; y: number; children: ReactNode; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end';
  mono?: boolean; weight?: number; opacity?: number; italic?: boolean;
}) {
  if (opacity <= 0.01) return null;
  return (
    <text x={x} y={y} fontSize={size} fill={color} textAnchor={anchor} fontFamily={mono ? MONO : UI} fontWeight={weight}
      fontStyle={italic ? 'italic' : undefined} opacity={opacity} xmlSpace="preserve">
      {children}
    </text>
  );
}

/** A vertical measure: a bracket between two y's with a label. */
function Measure({ x, y1, y2, label, color, side = 'right', opacity }: {
  x: number; y1: number; y2: number; label: string; color: string; side?: 'left' | 'right'; opacity: number;
}) {
  if (opacity <= 0.01 || Math.abs(y2 - y1) < 1) return null;
  const d = side === 'right' ? 6 : -6;
  return (
    <g opacity={opacity}>
      <path d={`M ${x - d} ${y1} L ${x} ${y1} L ${x} ${y2} L ${x - d} ${y2}`} fill="none" stroke={color} strokeWidth={1.8} />
      <text x={x + (side === 'right' ? 8 : -8)} y={(y1 + y2) / 2 + 5} fontSize={14} fontFamily={MONO} fill={color}
        stroke={colors.BG} strokeWidth={3} paintOrder="stroke"
        textAnchor={side === 'right' ? 'start' : 'end'}>
        {label}
      </text>
    </g>
  );
}

function Card({ x, y, w, h, stroke, opacity, children }: {
  x: number; y: number; w: number; h: number; stroke: string; opacity: number; children: ReactNode;
}) {
  if (opacity <= 0.01) return null;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={8} fill={colors.PANEL} fillOpacity={0.95} stroke={stroke} strokeWidth={1.5} />
      <rect x={x} y={y} width={4} height={h} rx={2} fill={stroke} />
      {children}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  const rowOp = v(scene.rowOp) * v(scene.rowU);
  const snap = v(scene.snapU);
  const align = v(scene.alignU);
  const k = Math.max(0, Math.min(CLOSE_STEPS, v(scene.closeK)));
  const k0 = Math.floor(k);
  const kf = k - k0;
  const cl = {
    g: lerp(CLOSE[k0].g, CLOSE[Math.min(CLOSE_STEPS, k0 + 1)].g, kf),
    m: lerp(CLOSE[k0].m, CLOSE[Math.min(CLOSE_STEPS, k0 + 1)].m, kf),
  };
  const closeU = 1 - cl.g / frac(GAP_AB_PX * SLIVER);
  const pile = v(scene.pileU);
  const level = v(scene.levelU) > 0.5;
  const gapGrow = v(scene.gapGrow);
  const sliderPct = v(scene.slider);
  const reach = reachOf(sliderPct);

  // where each sketch rectangle's top and each photo's top sit (px from the line), and each photo's x
  const rectOff = SK.map((sk, i) => (level ? (i === B ? v(scene.rectDrag) : 0) : lerp(sk, SNAP_TO, snap)));
  const fitShare = 1 - (1 - SLIVER) * align - SLIVER * (align >= 0.999 ? closeU : 0);
  const photoOff = SK.map((_, i) => {
    if (level) return i === B ? v(scene.photoC) : v(scene.rowShift);
    let off = rectOff[i] * fitShare;
    if (i === A) off = lerp(rectOff[B] * fitShare, off, gapGrow);
    return lerp(off, PILE[i].off, pile);
  });
  const pX = (i: number) => lerp(photoX(i), PILE[i].x, pile);
  const gapAB = frac(photoOff[A] - photoOff[B]);
  const m = align >= 0.999 && !level ? cl.m : 0;

  const crook = v(scene.crookU);
  const pairU = v(scene.pairU);
  const plotOp = v(scene.plotOp) * v(scene.axesU);
  const probeU = v(scene.probeU) * v(scene.plotOp);
  const dotG = v(scene.probeMode) > 0.5 ? v(scene.probe) : gapAB;
  const dotPull = pairPull(dotG, m, reach);
  const costU = v(scene.costU);

  const lossOp = v(scene.lossU) * v(scene.lossOp);
  const barsU = v(scene.barsU);
  const lampOp = v(scene.lampU);
  const lampOn = v(scene.lampOn);
  const stripU = v(scene.stripU);
  const sliderOp = v(scene.sliderU);
  const gaugeOp = v(scene.gaugeU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <defs>
        <clipPath id="lg2-plot-clip">
          <rect x={PX(-0.03) - 2} y={PY(0.022)} width={PX(0.03) - PX(-0.03) + 4} height={PY(-0.022) - PY(0.022)} />
        </clipPath>
      </defs>
      <Camera {...cam}>
        {/* ================= the row: four photos over a ruler ================= */}
        {rowOp > 0.005 && (
          <g opacity={rowOp}>
            <Txt x={RULER_X - 10} y={92} size={15} color={colors.MUTED}>
              {level ? 'a row of four, drawn level' : 'a row of four photos · their tops'}
            </Txt>
            <Txt x={RULER_X - 10} y={112} size={13} color={colors.MUTED} opacity={0.8}>
              px on a 538 px stage, drawn ×8 tall{level ? '' : ' · sketch offsets schematic'}
            </Txt>
            {/* ruler */}
            <line x1={RULER_X} y1={topY(-4)} x2={RULER_X} y2={topY(16)} stroke={colors.MUTED} strokeWidth={1.2} opacity={0.6} />
            {[-4, -2, 0, 2, 4, 6, 8, 10, 12, 14, 16].map((p) => (
              <g key={p}>
                <line x1={RULER_X - (p % 4 === 0 ? 7 : 4)} y1={topY(p)} x2={RULER_X} y2={topY(p)} stroke={colors.MUTED} strokeWidth={1} opacity={0.7} />
                {p % 4 === 0 && (
                  <Txt x={RULER_X - 11} y={topY(p) + 4.5} size={12} mono anchor="end" color={colors.MUTED}>
                    {p === 0 ? '0' : `${p}`}
                  </Txt>
                )}
              </g>
            ))}
            {/* the line (where the tops would meet) */}
            <line x1={RULER_X} y1={topY(level ? v(scene.rowShift) : 0)} x2={680} y2={topY(level ? v(scene.rowShift) : 0)}
              stroke={colors.WARM} strokeWidth={1.2} strokeDasharray="5 6" opacity={0.45 + 0.4 * crook} />
            {/* reach band (B6) */}
            {v(scene.reachBand) > 0.01 && (
              <g opacity={v(scene.reachBand)}>
                <rect x={RULER_X} y={topY(-REACH_PX)} width={568} height={Z * 2 * REACH_PX} fill={colors.WARM} opacity={0.06} />
                <line x1={RULER_X} y1={topY(-REACH_PX)} x2={680} y2={topY(-REACH_PX)} stroke={colors.WARM} strokeWidth={1} strokeDasharray="2 5" />
                <line x1={RULER_X} y1={topY(REACH_PX)} x2={680} y2={topY(REACH_PX)} stroke={colors.WARM} strokeWidth={1} strokeDasharray="2 5" />
                <Txt x={688} y={topY(-REACH_PX) + 5} size={13} mono color={colors.WARM}>− reach</Txt>
                <Txt x={688} y={topY(REACH_PX) + 5} size={13} mono color={colors.WARM}>+ reach</Txt>
                <Txt x={688} y={topY(0) + 5} size={13} mono color={colors.WARM}>10.8 px</Txt>
              </g>
            )}
            {/* sketch rectangles (dashed) */}
            {SK.map((_, i) => (
              <rect key={`r${i}`} x={photoX(i) - 5} y={topY(rectOff[i]) - 5} width={PHOTO_W + 10} height={PHOTO_H + 10} rx={4}
                fill="none" stroke={colors.MUTED} strokeWidth={1.4} strokeDasharray="5 4" opacity={0.75 * (1 - pile * 0.6)} />
            ))}
            {/* photos */}
            {SK.map((_, i) => {
              const inPair = (i === A || i === B) && pairU > 0.01;
              const x = pX(i);
              const y = topY(photoOff[i]);
              return (
                <g key={`p${i}`}>
                  <rect x={x} y={y} width={PHOTO_W} height={PHOTO_H} rx={3} fill={colors.ACCENT} fillOpacity={0.16 + 0.04 * i}
                    stroke={colors.ACCENT} strokeWidth={1.4} />
                  <path d={`M ${x + 14} ${y + PHOTO_H - 12} l 22 -26 l 16 16 l 12 -10 l 22 20 Z`} fill={colors.ACCENT} opacity={0.22} />
                  <line x1={x} y1={y} x2={x + PHOTO_W} y2={y} stroke={inPair ? colors.WARM : colors.ACCENT}
                    strokeWidth={2 + 2 * Math.max(crook, inPair ? pairU : 0)} strokeLinecap="round" />
                </g>
              );
            })}
            {/* B1: the crooked tops, each measured from the line */}
            {crook > 0.01 && SK.map((sk, i) => (
              <Measure key={`m${i}`} x={photoX(i) + PHOTO_W + 12} y1={topY(0)} y2={topY(sk)} label={`${Math.abs(sk)}`} color={colors.WARM} opacity={crook} />
            ))}
            {/* pair labels + gap bracket */}
            {pairU > 0.01 && !level && pile < 0.05 && (
              <g opacity={pairU}>
                <Txt x={pX(A) + PHOTO_W / 2} y={topY(photoOff[A]) + 24} size={18} weight={700} anchor="middle" color={colors.WARM}>A</Txt>
                <Txt x={pX(B) + PHOTO_W / 2} y={topY(photoOff[B]) + 24} size={18} weight={700} anchor="middle" color={colors.WARM}>B</Txt>
                <line x1={pX(A) + PHOTO_W} y1={topY(photoOff[A])} x2={pX(B) + 18} y2={topY(photoOff[A])} stroke={colors.WARM} strokeWidth={1} strokeDasharray="2 3" />
                <Measure x={pX(B) + 14} y1={topY(photoOff[B])} y2={topY(photoOff[A])} label="" color={colors.WARM} side="right" opacity={1} />
                <Txt x={pX(B) + PHOTO_W / 2} y={topY(Math.min(photoOff[A], photoOff[B])) - 12} size={14} mono anchor="middle" color={colors.WARM}>
                  {Math.abs(px(gapAB)) >= 0.05 ? `gap ${px(gapAB).toFixed(px(gapAB) < 1 ? 2 : 1)} px` : 'gap 0'}
                </Txt>
              </g>
            )}
            {/* B7: one counted line */}
            {v(scene.lineChip) > 0.01 && (
              <g opacity={v(scene.lineChip)}>
                <Txt x={photoX(0)} y={topY(0) - 32} size={14} mono color={colors.POSITIVE}>
                  lineCount: 4 edges on this line · each pair ÷ 4
                </Txt>
                <Txt x={photoX(0)} y={topY(0) - 52} size={13} mono color={colors.MUTED}>
                  within lineGap = reach / 8 counts as one line
                </Txt>
              </g>
            )}
            {/* B8: the sliver */}
            {/* B9: the pile */}
            {v(scene.pileLbl) > 0.01 && (
              <g opacity={v(scene.pileLbl)}>
                <Txt x={420} y={topY(6) + 30} size={14} color={colors.TEXT}>the seeded pile (schematic)</Txt>
                <Txt x={420} y={topY(6) + 50} size={14} color={colors.MUTED}>every edge within reach of every other</Txt>
              </g>
            )}
            {/* B11: meet in the middle */}
            {v(scene.meetLbl) > 0.01 && level && (
              <g opacity={v(scene.meetLbl)}>
                <Measure x={photoX(B) - 13} y1={topY(0)} y2={topY(v(scene.rectDrag)) - 5} label="12" color={colors.TEXT} side="left" opacity={1} />
                <Measure x={photoX(B) + PHOTO_W + 12} y1={topY(v(scene.photoC))} y2={topY(v(scene.rectDrag)) - 5} label="9" color={colors.WARM} opacity={1} />
                {[0, 1, 3].map((i) => (
                  <Txt key={i} x={photoX(i) + PHOTO_W / 2} y={topY(0) - 14} size={14} mono anchor="middle" color={colors.POSITIVE}>
                    ↓ 3 px
                  </Txt>
                ))}
                <Txt x={RULER_X - 10} y={446} size={14} color={colors.TEXT}>
                  rectangle dragged 12 px down · its photo 9 px above it · the other three 3 px down
                </Txt>
                <Txt x={RULER_X - 10} y={468} size={13} color={colors.MUTED}>
                  the line rests at the mean of where its rectangles are drawn
                </Txt>
              </g>
            )}
            {/* B12: the photo in the row vs on its rectangle */}
            {v(scene.hystLbl) > 0.01 && level && v(scene.rectDrag) > 12.5 && (
              <Measure x={photoX(B) - 13} y1={topY(0)} y2={topY(v(scene.rectDrag)) - 5} label="14" color={colors.TEXT} side="left" opacity={v(scene.hystLbl)} />
            )}
          </g>
        )}

        {/* ================= right side: quotes and the code box (B1–B2) ================= */}
        <Card x={700} y={150} w={490} h={118} stroke={colors.SECONDARY} opacity={v(scene.quote1)}>
          <Txt x={722} y={184} size={18} italic>“a bigger penalty or adjustable one for learned</Txt>
          <Txt x={722} y={210} size={18} italic>gallery for grid being unaligned”</Txt>
          <Txt x={722} y={246} size={14} color={colors.MUTED}>— Cheng's request</Txt>
        </Card>
        <Card x={700} y={132} w={490} h={118} stroke={colors.MUTED} opacity={v(scene.codeU) * (1 - 0.55 * v(scene.stampU))}>
          <Txt x={722} y={162} size={13} mono color={colors.MUTED}>// October 13 · ordinary code, before training</Txt>
          <Txt x={722} y={192} size={16} mono weight={700}>alignRectangles(sketch)</Txt>
          <Txt x={722} y={218} size={13} mono color={colors.MUTED}>// every sketch edge within 3% of a line</Txt>
          <Txt x={722} y={236} size={13} mono color={colors.MUTED}>// moves onto that line</Txt>
        </Card>
        {v(scene.stampU) > 0.01 && (
          <g opacity={v(scene.stampU) * v(scene.codeU)} transform={`rotate(-6 1097 124)`}>
            <rect x={1012} y={105} width={170} height={38} rx={6} fill={colors.BG} fillOpacity={0.9} stroke={colors.NEGATIVE} strokeWidth={2.2} />
            <Txt x={1097} y={131} size={18} weight={700} anchor="middle" color={colors.NEGATIVE}>tried, not kept</Txt>
          </g>
        )}
        <Card x={700} y={300} w={490} h={96} stroke={colors.SECONDARY} opacity={v(scene.quote2)}>
          <Txt x={722} y={336} size={17} italic>“Snapping to some alignemtn is just a simple thought.”</Txt>
          <Txt x={722} y={372} size={14} color={colors.MUTED}>— Cheng (sic) · “the spirit of the gallery is to learn something”</Txt>
        </Card>

        {/* ================= the plot: pairPull against gap ================= */}
        {plotOp > 0.005 && (
          <g opacity={plotOp}>
            <line x1={PX(-0.03)} y1={PY0} x2={PX(0.03)} y2={PY0} stroke={colors.MUTED} strokeWidth={1.5} />
            <line x1={PX(0)} y1={PY(-0.022)} x2={PX(0)} y2={PY(0.022)} stroke={colors.MUTED} strokeWidth={1} opacity={0.6} />
            {[-0.02, -0.01, 0.01, 0.02].map((g) => (
              <g key={g}>
                <line x1={PX(g)} y1={PY(-0.022)} x2={PX(g)} y2={PY(0.022)} stroke={colors.GRID} strokeWidth={1} />
                <Txt x={PX(g)} y={424} size={12} mono anchor="middle" color={colors.MUTED}>{g > 0 ? `${g}` : `−${-g}`}</Txt>
              </g>
            ))}
            <Txt x={PX(0)} y={424} size={12} mono anchor="middle" color={colors.MUTED}>0</Txt>
            <Txt x={PX(0.03)} y={446} size={13} anchor="end" color={colors.MUTED}>gap = A − B, share of the stage's width</Txt>
            {v(scene.pullU) > 0.01 && [-0.02, -0.01, 0.01, 0.02].map((p) => (
              <Txt key={p} x={PX(-0.03) - 6} y={PY(p) + 4} size={12} mono anchor="end" color={colors.MUTED} opacity={v(scene.pullU)}>
                {p > 0 ? `${p}` : `−${-p}`}
              </Txt>
            ))}
            {/* the charge (B4): pairCost, its own vertical scale */}
            {costU > 0.005 && (
              <g opacity={v(scene.costOp)}>
                <FunctionPlot x={PX} y={CY} f={(g) => pairCost(g, 0, REACH)} domain={[0, 0.03]} samples={150} reveal={costU} color={colors.TEAL} width={2.5}
                  area={{ sweep: costU, opacity: 0.12 }} />
                <FunctionPlot x={PX} y={CY} f={(g) => pairCost(g, 0, REACH)} domain={[-0.03, 0]} samples={150} reveal={costU} color={colors.TEAL} width={2.5} opacity={0.6} />
                {v(scene.costOp) > 0.5 && (
                  <>
                    <Txt x={PX(-0.029)} y={152} size={14} mono color={colors.TEAL}>charge · pairCost</Txt>
                    <Txt x={PX(-0.029)} y={170} size={12} color={colors.MUTED}>(own vertical scale)</Txt>
                  </>
                )}
              </g>
            )}
            {/* reach markers */}
            {v(scene.pullU) > 0.01 && reach > 0.0005 && (
              <g opacity={v(scene.pullU)}>
                {[-1, 1].filter(() => reach < 0.03).map((sg) => (
                  <line key={sg} x1={PX(sg * reach)} y1={PY(0.0215)} x2={PX(sg * reach)} y2={PY(-0.0215)} stroke={colors.WARM} strokeWidth={1} strokeDasharray="3 5" opacity={0.6} />
                ))}
                {sliderOp > 0.01 && reach < 0.026 && (
                  <Txt x={PX(reach) + 6} y={PY(-0.019)} size={13} mono color={colors.WARM} opacity={sliderOp}>reach</Txt>
                )}
              </g>
            )}
            {/* the pull */}
            <g clipPath="url(#lg2-plot-clip)">
              <FunctionPlot x={PX} y={PY} f={(g) => pairPull(g, m, reach)} samples={480} reveal={v(scene.pullU)} color={colors.WARM} width={3} />
            </g>
            {/* guides: 5 × gap, reach − gap */}
            {v(scene.guideU) > 0.01 && (
              <g opacity={v(scene.guideU)}>
                <line x1={PX(0)} y1={PY0} x2={PX(0.0042)} y2={PY(0.021)} stroke={colors.TEXT} strokeWidth={1.2} strokeDasharray="4 4" />
                <line x1={PX(0)} y1={PY(REACH)} x2={PX(REACH)} y2={PY0} stroke={colors.TEXT} strokeWidth={1.2} strokeDasharray="4 4" />
                <Txt x={PX(0.0042) - 8} y={PY(0.021) + 2} size={14} mono anchor="end" color={colors.TEXT}>5 × gap</Txt>
                <Txt x={PX(0.0165) + 10} y={PY(0.0035) - 8} size={14} mono color={colors.TEXT}>reach − gap</Txt>
              </g>
            )}
            {/* the three computed points */}
            {PULL_PTS.map(([g, p], i) => {
              const u = clamp01(v(scene.ptsU) * 3 - i);
              if (u <= 0.01) return null;
              const label = i === 2 ? '0 at one reach (0.02)' : `${p} at ${g}`;
              return (
                <g key={i} opacity={u}>
                  <circle cx={PX(g)} cy={PY(p)} r={5} fill={colors.BG} stroke={colors.WARM} strokeWidth={2} />
                  <Txt x={PX(g) + 12} y={PY(p) + (i === 2 ? 24 : -12)} size={13} mono color={colors.WARM}>{label}</Txt>
                </g>
              );
            })}
            {/* the riding dot */}
            {probeU > 0.01 && (
              <g opacity={probeU}>
                <line x1={PX(dotG)} y1={PY0} x2={PX(dotG)} y2={PY(dotPull)} stroke={colors.WARM} strokeWidth={1} strokeDasharray="2 3" opacity={0.7} />
                <circle cx={PX(dotG)} cy={v(scene.pullU) > 0.5 ? PY(dotPull) : PY0} r={14} fill={colors.WARM} opacity={0.2} />
                <circle cx={PX(dotG)} cy={v(scene.pullU) > 0.5 ? PY(dotPull) : PY0} r={6.5} fill="#ffffff" />
                {costU > 0.5 && v(scene.pullU) < 0.05 && (
                  <circle cx={PX(dotG)} cy={CY(pairCost(dotG, 0, REACH))} r={5} fill={colors.TEAL} />
                )}
              </g>
            )}
          </g>
        )}
        {v(scene.texU) > 0.01 && plotOp > 0.01 && (
          <MathLabel tex={'\\mathtt{pairPull} = \\operatorname{clamp}\\big(m + 5\\cdot\\text{gap},\\ \\pm\\max(0,\\ \\text{reach}-|\\text{gap}|)\\big)'}
            x={985} y={100} fontSize={17} boxWidth={560} color={colors.TEXT} opacity={v(scene.texU) * v(scene.plotOp)} />
        )}
        {v(scene.texU) > 0.01 && plotOp > 0.01 && (
          <Txt x={PX(-0.029)} y={PY(0.0215) + 14} size={13} mono color={colors.MUTED} opacity={v(scene.texU) * v(scene.plotOp)}>
            penaltyStiffness = 5
          </Txt>
        )}

        {/* ================= the slider (B6, B12) ================= */}
        {sliderOp > 0.01 && (
          <g opacity={sliderOp}>
            <Txt x={SL.x0} y={SL.y - 22} size={15} color={colors.TEXT}>Misalignment penalty</Txt>
            <Txt x={SL.x1} y={SL.y - 22} size={15} mono anchor="end" color={colors.WARM}>
              {Math.round(sliderPct * 2) === 0 ? 'off' : `${Math.round(sliderPct * 2) / 2}%`}
            </Txt>
            <line x1={SL.x0} y1={SL.y} x2={SL.x1} y2={SL.y} stroke={colors.MUTED} strokeWidth={3} strokeLinecap="round" opacity={0.5} />
            <line x1={SL.x0} y1={SL.y} x2={slX(sliderPct)} y2={SL.y} stroke={colors.WARM} strokeWidth={3} strokeLinecap="round" />
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
              <line key={p} x1={slX(p)} y1={SL.y + 7} x2={slX(p)} y2={SL.y + 12} stroke={colors.MUTED} strokeWidth={1} />
            ))}
            <circle cx={slX(sliderPct)} cy={SL.y} r={9} fill={colors.TEXT} stroke={colors.WARM} strokeWidth={2} />
            <Txt x={slX(0)} y={SL.y + 28} size={12} mono anchor="middle" color={colors.MUTED}>off</Txt>
            <Txt x={slX(4)} y={SL.y + 28} size={12} mono anchor="middle" color={colors.MUTED}>4</Txt>
            <Txt x={slX(8)} y={SL.y + 28} size={12} mono anchor="middle" color={colors.MUTED}>8%</Txt>
            <Txt x={SL.x0} y={SL.y + 60} size={14} mono color={colors.TEXT}>
              {(() => {
                const shown = Math.round(sliderPct * 2) / 2;
                const r = reachOf(shown);
                if (shown === 0) return 'off: the loss is its first part alone';
                return `reach = ${shown}% ÷ 2 = ${+(r * 100).toFixed(2)}% → ${px(r).toFixed(1)} px on 538 px`;
              })()}
            </Txt>
          </g>
        )}

        {/* ================= the multiplier gauge (B8, B9) ================= */}
        {gaugeOp > 0.01 && (
          <g opacity={gaugeOp}>
            <Txt x={SL.x0} y={482} size={15} color={colors.TEXT}>multiplier m, pair A·B</Txt>
            <Txt x={SL.x1} y={482} size={14} mono anchor="end" color={colors.POSITIVE}>{`step ${Math.round(k)}`}</Txt>
            <rect x={SL.x0} y={496} width={SL.x1 - SL.x0} height={16} rx={4} fill="none" stroke={colors.MUTED} strokeOpacity={0.5} />
            <rect x={SL.x0} y={496} width={(SL.x1 - SL.x0) * clamp01(m / M_MAX)} height={16} rx={4} fill={colors.POSITIVE} opacity={0.8} />
            <Txt x={SL.x0} y={536} size={14} mono color={colors.TEXT}>m ← m + 0.02 · steps · 5 · gap</Txt>
            <Txt x={SL.x0} y={556} size={13} color={colors.MUTED}>a tenth of the gap per step · path schematic</Txt>
          </g>
        )}
        {v(scene.notLossU) * gaugeOp > 0.01 && (
          <g opacity={v(scene.notLossU) * gaugeOp}>
            <rect x={SL.x0 - 8} y={572} width={356} height={30} rx={15} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.2} />
            <Txt x={SL.x0 + 170} y={592} size={14} anchor="middle" color={colors.POSITIVE}>multipliers are not in the displayed loss</Txt>
          </g>
        )}
        {/* the sliver, measured beside the pair while the multiplier works */}
        {gaugeOp > 0.01 && pairU > 0.01 && rowOp > 0.01 && (
          <Txt x={pX(A)} y={topY(0) + PHOTO_H + 34} size={14} color={colors.TEXT} opacity={gaugeOp * pairU}>
            {k < 0.5 ? 'the sliver a pull alone leaves' : 'the multiplier closes it'}
          </Txt>
        )}

        {/* ================= the table (B10) ================= */}
        {barsU > 0.01 && (
          <g opacity={clamp01(barsU * 3)}>
            <Txt x={760} y={130} size={17} color={colors.TEXT} weight={600}>How far apart a line of photos ends</Txt>
            <Txt x={760} y={152} size={13} color={colors.MUTED}>372 single edits of 5 and 11 px · slider 4% · 538 px stage</Txt>
            {[
              { name: 'Straightening, October 13', vals: [0.04, 0.52], color: colors.MUTED, y: 196 },
              { name: 'Penalty, October 14', vals: [0.01, 0.16], color: colors.WARM, y: 296 },
            ].map((grp, gi) => (
              <g key={gi}>
                <Txt x={760} y={grp.y} size={15} color={grp.color} weight={600}>{grp.name}</Txt>
                {grp.vals.map((val, j) => {
                  const u = clamp01(barsU * 2.4 - gi * 0.6 - j * 0.3);
                  const yy = grp.y + 14 + j * 34;
                  return (
                    <g key={j}>
                      <Txt x={840} y={yy + 17} size={13} anchor="end" color={colors.MUTED}>{j === 0 ? 'median' : 'largest'}</Txt>
                      <rect x={850} y={yy} width={Math.max(2, 600 * val * u)} height={22} rx={3} fill={grp.color} opacity={0.85} />
                      <Txt x={850 + Math.max(2, 600 * val * u) + 8} y={yy + 16} size={14} mono color={colors.TEXT} opacity={u}>{`${val} px`}</Txt>
                    </g>
                  );
                })}
              </g>
            ))}
          </g>
        )}

        {/* ================= lower-left band ================= */}
        {/* B3: the loss in two parts */}
        {lossOp > 0.01 && (
          <g opacity={lossOp}>
            <Txt x={RULER_X - 10} y={505} size={16} mono color={colors.TEXT}>loss =</Txt>
            <rect x={180} y={482} width={240} height={36} rx={5} fill={colors.ACCENT} fillOpacity={0.22} stroke={colors.ACCENT} />
            <Txt x={300} y={505} size={14} anchor="middle" color={colors.TEXT}>distance from the sketch</Txt>
            <Txt x={428} y={505} size={16} mono anchor="start" color={colors.TEXT}>+</Txt>
            <rect x={446} y={482} width={210} height={36} rx={5} fill={colors.WARM} fillOpacity={0.22 * clamp01(v(scene.lossU) * 2 - 1) + 0.05} stroke={colors.WARM} />
            <Txt x={551} y={505} size={14} anchor="middle" color={colors.TEXT}>misalignment penalty</Txt>
            <Txt x={180} y={540} size={13} color={colors.MUTED}>Huber, each photo edge vs its rectangle</Txt>
            <Txt x={446} y={540} size={13} color={colors.MUTED}>reads only the photos</Txt>
            {/* the link from the sketch to the penalty, cut */}
            <line x1={575} y1={topY(SK[3]) + PHOTO_H + 6} x2={560} y2={480} stroke={colors.MUTED} strokeWidth={1.4} strokeDasharray="4 4" opacity={1 - 0.6 * v(scene.cutU)} />
            {v(scene.cutU) > 0.01 && (
              <g opacity={v(scene.cutU)}>
                <line x1={556} y1={404} x2={580} y2={428} stroke={colors.NEGATIVE} strokeWidth={3} strokeLinecap="round" />
                <line x1={580} y1={404} x2={556} y2={428} stroke={colors.NEGATIVE} strokeWidth={3} strokeLinecap="round" />
                <Txt x={592} y={421} size={13} color={colors.NEGATIVE}>no sketch</Txt>
              </g>
            )}
            <Txt x={RULER_X - 10} y={576} size={13} color={colors.MUTED}>since October 14 · nothing straightens the sketch</Txt>
          </g>
        )}
        {/* B7: a row of two, divided by two; the count each frame */}
        {v(scene.countU) > 0.01 && (
          <g opacity={v(scene.countU)}>
            {[0, 1].map((i) => (
              <g key={i}>
                <rect x={130 + i * 70} y={478} width={58} height={44} rx={3} fill={colors.ACCENT} fillOpacity={0.18} stroke={colors.ACCENT} strokeWidth={1.2} />
                <line x1={130 + i * 70} y1={478} x2={188 + i * 70} y2={478} stroke={colors.ACCENT} strokeWidth={3} />
              </g>
            ))}
            <Txt x={130} y={546} size={14} mono color={colors.POSITIVE}>a row of two: the pair ÷ 2</Txt>
            <Txt x={360} y={490} size={14} mono color={colors.TEXT}>startFrame()</Txt>
            <Txt x={360} y={510} size={13} color={colors.MUTED}>ordinary code, at the start of each frame:</Txt>
            <Txt x={360} y={530} size={13} color={colors.MUTED}>counts the lines from the photos' edges</Txt>
          </g>
        )}
        {/* B9: the lamp and the strength ramp */}
        {lampOp > 0.01 && (
          <g opacity={lampOp}>
            <circle cx={128} cy={512} r={16} fill={lampOn > 0.5 ? colors.WARM : colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
            {lampOn > 0.01 && <circle cx={128} cy={512} r={26} fill={colors.WARM} opacity={0.18 * lampOn} />}
            <Txt x={128} y={552} size={13} anchor="middle" color={colors.WARM}>{lampOn > 0.5 ? 'penalty on' : 'penalty off'}</Txt>
            {/* penaltyStrength against step */}
            {(() => {
              const x0 = 200, x1 = 640, yb = 560, yt = 476;
              const on = x0 + 120; // onset: schematic place on this axis
              const rise = 200; // px for 200 steps
              const sx = (stepFromOnset: number) => on + (stepFromOnset / penaltyRiseSteps) * rise;
              const now = v(scene.rampU) * penaltyRiseSteps;
              const strength = (st: number) => penaltyStrength * Math.min(1, Math.max(0, st) / penaltyRiseSteps);
              const sy = (sv: number) => lerp(yb, yt, sv / penaltyStrength);
              const pts = [`M ${x0} ${yb}`, `L ${on} ${yb}`];
              if (v(scene.rampU) > 0) pts.push(`L ${sx(Math.min(now, penaltyRiseSteps))} ${sy(strength(now))}`);
              if (v(scene.rampU) >= 1) pts.push(`L ${x1} ${yt}`);
              return (
                <g>
                  <line x1={x0} y1={yb} x2={x1} y2={yb} stroke={colors.MUTED} strokeWidth={1.2} />
                  <line x1={x0} y1={yb} x2={x0} y2={yt - 6} stroke={colors.MUTED} strokeWidth={1.2} />
                  <Txt x={x0 - 6} y={yt + 4} size={12} mono anchor="end" color={colors.MUTED}>2</Txt>
                  <Txt x={x0 - 6} y={yb + 4} size={12} mono anchor="end" color={colors.MUTED}>0</Txt>
                  <Txt x={x0 + 8} y={yt - 4} size={13} mono color={colors.MUTED}>penaltyStrength</Txt>
                  <path d={pts.join(' ')} fill="none" stroke={colors.WARM} strokeWidth={2.5} opacity={lampOn > 0.01 ? 1 : 0.4} />
                  <line x1={on} y1={yb + 4} x2={on} y2={yt} stroke={colors.TEXT} strokeWidth={1} strokeDasharray="2 4" opacity={0.5} />
                  <Txt x={on} y={yb + 20} size={12} anchor="middle" color={colors.MUTED}>near the sketch</Txt>
                  {v(scene.rampU) > 0.05 && (
                    <g opacity={clamp01(v(scene.rampU) * 2)}>
                      <line x1={on} y1={yb + 30} x2={on + rise} y2={yb + 30} stroke={colors.WARM} strokeWidth={1.2} />
                      <Txt x={on + rise / 2} y={yb + 46} size={13} mono anchor="middle" color={colors.WARM}>200 steps</Txt>
                    </g>
                  )}
                  <Txt x={x1} y={yt + 34} size={12} mono anchor="end" color={colors.MUTED}>distance &lt; 1e-6, or 1,000 steps</Txt>
                  <Txt x={x1} y={yt + 52} size={12} anchor="end" color={colors.MUTED}>presets: on after 150–180 steps</Txt>
                </g>
              );
            })()}
          </g>
        )}
        {/* B12: two thresholds on one line of distances */}
        {stripU > 0.01 && (() => {
          const x0 = 140, x1 = 620, sx = (p: number) => lerp(x0, x1, p / 24);
          const y = 520;
          const u = clamp01(stripU);
          return (
            <g opacity={clamp01(u * 2)}>
              <Txt x={x0 - 30} y={470} size={14} color={colors.TEXT}>a rectangle's distance from its row, px (538 px stage)</Txt>
              <line x1={x0} y1={y} x2={lerp(x0, x1, u)} y2={y} stroke={colors.MUTED} strokeWidth={1.5} />
              {[0, 4, 8, 12, 16, 20, 24].map((p) => (
                <g key={p} opacity={clamp01(u * 1.4 - p / 24)}>
                  <line x1={sx(p)} y1={y} x2={sx(p)} y2={y + 6} stroke={colors.MUTED} strokeWidth={1} />
                  <Txt x={sx(p)} y={y + 22} size={12} mono anchor="middle" color={colors.MUTED}>{p}</Txt>
                </g>
              ))}
              {/* lane bars: on the row it holds to 21.5; on its rectangle it joins below 10.8 */}
              <rect x={x0} y={y - 32} width={(sx(LEAVE_PX) - x0) * u} height={10} rx={3} fill={colors.WARM} opacity={0.7} />
              <rect x={x0} y={y - 18} width={(sx(REACH_PX) - x0) * u} height={10} rx={3} fill={colors.ACCENT} opacity={0.8} />
              {v(scene.hystLbl) > 0.01 && (
                <g opacity={v(scene.hystLbl)}>
                  <Txt x={sx(LEAVE_PX) + 6} y={y - 23} size={12} mono color={colors.WARM}>lets go at 21.5</Txt>
                  <Txt x={sx(REACH_PX) + 6} y={y - 9} size={12} mono color={colors.ACCENT}>joins under 10.8</Txt>
                  <line x1={sx(14)} y1={y - 38} x2={sx(14)} y2={y - 21} stroke={colors.TEXT} strokeWidth={2} />
                  <line x1={sx(14)} y1={y - 5} x2={sx(14)} y2={y + 7} stroke={colors.TEXT} strokeWidth={2} />
                  <Txt x={sx(14)} y={y + 22} size={13} mono weight={700} anchor="middle" color={colors.TEXT}>14</Txt>
                  <Txt x={x0 - 30} y={570} size={15} color={colors.TEXT} weight={600}>joins at half the distance it leaves</Txt>
                  <Txt x={x0 - 30} y={592} size={13} color={colors.MUTED}>same sketch, two layouts: it depends on what came before</Txt>
                </g>
              )}
            </g>
          );
        })()}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
