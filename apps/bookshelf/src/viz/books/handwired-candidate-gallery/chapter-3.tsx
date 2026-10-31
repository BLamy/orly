// Everyone Reads the Winner
//
// Three Layouts (handwired-candidate-gallery) — chapter 3. Source pin:
// chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT), lab/candidate-gallery/
//   candidate-gallery.ts:155-163 (bottleneck: the worst gauge), 165-206 (Contact; emptyHero, heroPresent: zero),
//     208-264 (Cinema: rail, hero, cinemaRailLeft = 14 + 1078 + 14 = 1106), 266-322 (Story), 324-332 (emitArgmax),
//     334-365 (selectValue: emitMultiply(winner.selected[i], values[i]) summed by circuit.affine; selectGeometry;
//     heroPresent), 367-385 (thumbnailHits, emitFirstActive, nextFocus), 402-414 (the seven hand-written scales),
//     466-488 (emitRectangleHit: min of four edge distances, relu(d) − relu(d − 1), circuit.boolean)
//   candidate-gallery.test.ts:31-43 (984×730 → Contact, 610×830 → Story)
//   gather-lowering.test.ts:53-67 (26 reads, 1 group, 1 slot; the logged storedWeights=848, dense 940)
//   comparison.test.ts:12 (14 boolean atoms) · src/runtime/numeric-ui-core.ts:385-392 (roundingPoints),
//     449-453 (boolean), 72-73 ((score + K) − K rounds to a bit), 2710-2762 (pairwise argmax: 2 comparisons,
//     ties go left; assumeOneHot), 2781-2811 (emitFirstActive)
//   lab/candidate-gallery/README.md:5 (moved from the repo root on September 17, 2026; lab/runtime-cost measures
//     it) · lab/status.md:228 (940 → 848), 289 · README.md:3 (no training) · review.md (bun test: 8 pass)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed narration
// contract (verbatim). Every geometry number on screen is computed below by a line-for-line port of the lab's
// layout formulas, evaluated live at the stage size on screen; the module throws if the three presets ever
// disagree with a probe of the pinned clone (thumbnail 0 and 7, hero, scores, winner). The click lane is the
// lab's emitRectangleHit, also evaluated live from the pointer position; the "one pixel inside hits, a quarter
// pixel misses" result is that probe's (no repo test covers it). The bit's slide between presets is an eased
// interpolation of the one-hot (the real program flips it in one frame).
import { CAMERA_HOME, Camera, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const relu = (v: number): number => (v > 0 ? v : 0);
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH14 = 8.43; // mono advance at 14 px
const CH13 = 7.83; // mono advance at 13 px
const GAL = '#3fb6a8'; // the book's accent: the winner
const r2 = (v: number): number => Math.round(v * 100) / 100 + 0;
const fmt = (v: number): string => `${r2(v)}`;

// ---------------------------------------------------------------------------
// The lab's layout formulas (candidate-gallery.ts:165-332), evaluated at a stage size
// ---------------------------------------------------------------------------

type Rect = { left: number; top: number; width: number; height: number };
type Cand = { thumbs: Rect[]; hero: Rect; heroPresent: number; score: number };
const GAP = 14;
const PHOTOS = 12;
const NAMES = ['Cinema', 'Contact', 'Story'] as const;
const PHOTO_NAMES = [
  'Misty Lake', 'Desert Light', 'Pacific Edge', 'Midnight City', 'Forest Path', 'Alpine Dawn',
  'Amalfi Morning', 'North Falls', 'Lavender Hour', 'Concrete Curve', 'Blue Lagoon', 'Autumn Road',
];
const q = (v: number): number => Math.min(1, v); // clampQuality
const FIELDS = ['left', 'top', 'width', 'height'] as const;

function candidates(W: number, H: number): Cand[] {
  const g = GAP;
  // Contact (165-206)
  const cw = relu(W - 5 * g) / 4;
  const chh = relu(H - 4 * g) / 3;
  const contact: Cand = {
    thumbs: Array.from({ length: PHOTOS }, (_, i) => {
      const c = i % 4;
      const r = Math.floor(i / 4);
      return { left: g * (1 + c) + cw * c, top: g * (1 + r) + chh * r, width: cw, height: chh };
    }),
    hero: { left: 0, top: 0, width: 0, height: 0 },
    heroPresent: 0,
    score: Math.min(q(cw / 240), q(chh / 240)),
  };
  // Cinema (208-264)
  const rail = Math.min(280, 0.28 * W);
  const hw = relu(W - rail - 3 * g);
  const hh = relu(H - 2 * g);
  const tw = relu(0.5 * rail - 0.5 * g);
  const th = relu(H / 6 - (7 / 6) * g);
  const railLeft = g + hw + g;
  const cinema: Cand = {
    thumbs: Array.from({ length: PHOTOS }, (_, i) => {
      const c = i % 2;
      const r = Math.floor(i / 2);
      return { left: railLeft + tw * c + g * c, top: g * (1 + r) + th * r, width: tw, height: th };
    }),
    hero: { left: g, top: g, width: hw, height: hh },
    heroPresent: 1,
    score: Math.min(q(hw / 900), q(hh / 560), q(tw / 90), q(th / 90)),
  };
  // Story (266-322)
  const shh = Math.min(0.72 * W, 0.58 * H);
  const sw = relu(W - 2 * g);
  const regionTop = shh + 2 * g;
  const stw = relu(W / 3 - (4 / 3) * g);
  const sth = relu(H / 4 - shh / 4 - (6 / 4) * g);
  const story: Cand = {
    thumbs: Array.from({ length: PHOTOS }, (_, i) => {
      const c = i % 3;
      const r = Math.floor(i / 3);
      return { left: g * (1 + c) + stw * c, top: regionTop + g * r + sth * r, width: stw, height: sth };
    }),
    hero: { left: g, top: g, width: sw, height: shh },
    heroPresent: 1,
    score: Math.min(q(sw / 560), q(shh / 440), q(stw / 60), q(sth / 60)),
  };
  return [cinema, contact, story];
}

/** emitArgmax over three: Cinema vs Contact, then the survivor vs Story; ties go left. */
function argmax(scores: number[]): number[] {
  const a = scores[0] >= scores[1] ? 0 : 1;
  const w = scores[a] >= scores[2] ? a : 2;
  return [0, 1, 2].map((i) => (i === w ? 1 : 0));
}

/** selectValue: Σ selected[i] × values[i] (candidate-gallery.ts:334-347). */
const select = (sel: number[], vals: number[]): number => sel[0] * vals[0] + sel[1] * vals[1] + sel[2] * vals[2];
const selectRect = (sel: number[], rs: Rect[]): Rect => ({
  left: select(sel, rs.map((r) => r.left)),
  top: select(sel, rs.map((r) => r.top)),
  width: select(sel, rs.map((r) => r.width)),
  height: select(sel, rs.map((r) => r.height)),
});

/** emitRectangleHit (466-488): distance from the nearest edge → relu(d) − relu(d − 1) → rounds to a bit. */
function edgeDistances(x: number, y: number, r: Rect): number[] {
  return [x - r.left, r.left + r.width - x, y - r.top, r.top + r.height - y];
}
const hitScore = (d: number): number => relu(d) - relu(d - 1);
const hitBit = (s: number): number => (s > 0.5 ? 1 : 0); // (score + K) − K in FP32: nearest bit, 0.5 ties to 0

// the three presets, checked against a probe of the pinned clone (bun, candidate-gallery.ts createCandidateGalleryMachine)
const PRESETS = [
  { W: 1400, H: 680 },
  { W: 984, H: 730 },
  { W: 610, H: 830 },
];
const PRESET = PRESETS.map(({ W, H }) => {
  const cs = candidates(W, H);
  const sel = argmax(cs.map((c) => c.score));
  return {
    W, H, cs, sel,
    thumbs: Array.from({ length: PHOTOS }, (_, i) => selectRect(sel, cs.map((c) => c.thumbs[i]))),
    hero: selectRect(sel, cs.map((c) => c.hero)),
    heroPresent: select(sel, cs.map((c) => c.heroPresent)),
  };
});
const PROBE = [
  { sel: [1, 0, 0], scores: [1, 0.8667, 0.84], t0: [1106, 14, 133, 97], t7: [1253, 347, 133, 97], hero: [14, 14, 1078, 652], hp: 1 },
  { sel: [0, 1, 0], scores: [0.7405, 0.9361, 0.9275], t0: [14, 14, 228.5, 224.6667], t7: [741.5, 252.6667, 228.5, 224.6667], hero: [0, 0, 0, 0], hp: 0 },
  { sel: [0, 0, 1], scores: [0.4413, 0.5625, 0.9982], t0: [14, 467.2, 184.6667, 76.7], t7: [212.6667, 648.6, 184.6667, 76.7], hero: [14, 14, 582, 439.2], hp: 1 },
];
const near = (a: number, b: number): boolean => Math.abs(a - b) < 6e-4;
const asArr = (r: Rect): number[] => [r.left, r.top, r.width, r.height];
PRESET.forEach((p, k) => {
  const e = PROBE[k];
  const ok =
    p.sel.every((v, i) => v === e.sel[i]) &&
    p.cs.every((c, i) => near(Math.round(c.score * 1e4) / 1e4, e.scores[i])) &&
    asArr(p.thumbs[0]).every((v, i) => near(v, e.t0[i])) &&
    asArr(p.thumbs[7]).every((v, i) => near(v, e.t7[i])) &&
    asArr(p.hero).every((v, i) => near(v, e.hero[i])) &&
    p.heroPresent === e.hp;
  if (!ok) throw new Error(`candidate-gallery ch3: the layout port disagrees with the probe at ${p.W}×${p.H}`);
});

// the three clicks on thumbnail 7 at 1400 × 680 (centre; left + 1; left + 0.25), checked across all 12 thumbnails
const T7 = PRESET[0].thumbs[7];
const CLICKS = [
  { x: T7.left + T7.width / 2, y: T7.top + T7.height / 2 },
  { x: T7.left + 1, y: T7.top + T7.height / 2 },
  { x: T7.left + 0.25, y: T7.top + T7.height / 2 },
];
const CLICK_HITS = CLICKS.map((c) => PRESET[0].thumbs.map((r) => hitBit(hitScore(Math.min(...edgeDistances(c.x, c.y, r))))));
const WANT_HITS = [7, 7, -1];
CLICK_HITS.forEach((h, k) => {
  if (h.indexOf(1) !== WANT_HITS[k] || h.filter((b) => b === 1).length !== (WANT_HITS[k] < 0 ? 0 : 1)) {
    throw new Error(`candidate-gallery ch3: click ${k} hit the wrong thumbnails`);
  }
});

// gather lowering (gather-lowering.test.ts:53-67, as logged by the test run)
const GATHER_READS = 26;
const DENSE_WEIGHTS = 940;
const LOWERED_WEIGHTS = 848;
const BOOLEAN_ATOMS = 14; // comparison.test.ts:12
const HIT_ATOMS = PHOTOS; // one circuit.boolean per thumbnail hit (488)
const ARGMAX_ATOMS = NAMES.length - 1; // a pairwise tournament over three scores
if (HIT_ATOMS + ARGMAX_ATOMS !== BOOLEAN_ATOMS) throw new Error('candidate-gallery ch3: rounding points do not add up');
const SCALES = ['1/240', '1/900', '1/560', '1/90', '1/560', '1/440', '1/60']; // candidate-gallery.ts:407-413

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const HEADER_H = 58;
// left zone: the one-hot and the selector rack
const LX = [180, 320, 460];
const NAME_Y = 112;
const SCORE_Y = 131;
const BIT_Y = 158;
const VAL_Y = 214;
const GATE_Y = 276;
const PROD_Y = 334;
const SUM = { x: 320, y: 404 };
const OUT_Y = 462;
const CHIP_W = 92;
const CHIP_H = 28;
const RACK_C = { x: 320, y: 330 }; // rack centre for the shrink into its grid cell

// the grid of sums (12 thumbnails × 4, the hero × 4, heroPresent)
const GX = [215, 310, 405, 500];
const GW = 88;
const GH = 22;
const RY = (r: number): number => 222 + r * 27;
const ROWS = [...Array.from({ length: PHOTOS }, (_, i) => `thumb ${i}`), 'hero', 'heroPresent'];

// right zone: the page at 0.4 scale
const SX = 660;
const SY = 110;
const SC = 0.4;
const READ_Y = 490;

// click lane
const PX = (d: number): number => 120 + (d + 0.75) * 140;
const PY = (s: number): number => 372 - s * 96;
const D_MAX = 2.25;
const HX = (i: number): number => 80 + i * 40;
const HITS_Y = 462;
const FOCUS_Y = 538;

const photoHue = (i: number): string => `hsl(${(i * 31 + 8) % 360}, 38%, 44%)`;

const CAM_START: CameraState = { x: 640, y: 352, k: 1.02 };
const CAM_RACK: CameraState = { x: 330, y: 300, k: 1.15 };
const CAM_GRID: CameraState = { x: 330, y: 366, k: 1.1 };
const CAM_GATHER: CameraState = { x: 330, y: 340, k: 1.1 };
const CAM_CLICK: CameraState = { x: 640, y: 360, k: 1 };
const CAM_PLOT: CameraState = { x: 330, y: 386, k: 1.3 };
const CAM_END: CameraState = { x: 640, y: 350, k: 0.97 };

const CODE_SELECT = [
  'terms.push([emitMultiply(circuit,',
  '  winner.selected[candidateIndex]!,',
  '  values[candidateIndex]!), 1])',
  'return circuit.affine(terms)',
];

// ---------------------------------------------------------------------------
// Timeline — eleven fixed captions, each paced at ~150 words per minute
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'The winner is just a 1 and two 0s. Twelve thumbnails and a hero still need rectangles, and they get them by multiplication, not an if.',
  'Take thumbnail zero\'s left edge. Each layout offers a value; multiply each by its own bit and add. Two of the three products are multiplied by zero.',
  "On the 1,400 by 680 stage, the sum is Cinema's rectangle: left 1,106, top 14, 133 wide, 97 tall. The other two layouts were computed too, then erased by zero.",
  'Every thumbnail and the hero run the same four sums. The Contact sheet has no hero, so its hero flag is zero.',
  'At 984 by 730 the bit moves to Contact and thumbnail zero flies to the corner. At 610 by 830 it moves to Story and drops below the hero.',
  'Declared a one-hot, these products lower to gather reads: 26 in one group, and the stored weights fall from 940 to 848.',
  "A click uses the same rectangles. Each thumbnail turns the click's distance from its nearest edge into a bit, and the first hit sets that photo's focus cell to 1.",
  'At 1,400 by 680, a click one pixel inside thumbnail seven hits it. A quarter pixel inside misses, and focus stays put.',
  'The tests count exactly 14 rounding points: twelve thumbnail hit tests and two argmax comparisons. The rest is plain arithmetic.',
  'The status is plain: a working demo, moved into the lab folder on September 17, 2026, and a subject of runtime cost measurements. Nothing is learned; the scales are written by hand.',
  'So the program never branches. It builds every layout, scores each by its worst gauge, and multiplies the losers by zero, every frame.',
];
const WPS = 2.5; // 150 words per minute
const HOLD = 0.6;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_START, cameraInterp);
  const stageW = tl.channel('stageW', 1400);
  const stageH = tl.channel('stageH', 680);
  const sel = tl.channel<number[]>('sel', [1, 0, 0]);
  const bitsU = tl.channel('bitsU', 0);
  const bitsOp = tl.channel('bitsOp', 1);
  const stageU = tl.channel('stageU', 0);
  const stageOp = tl.channel('stageOp', 1);
  const codeU = tl.channel('codeU', 0);
  // the rack
  const rackOp = tl.channel('rackOp', 1);
  const rackDim = tl.channel('rackDim', 1); // everything but the output chip
  const laneU = tl.channel('laneU', 0);
  const gateU = tl.channel('gateU', 0);
  const prodU = tl.channel('prodU', 0);
  const drainU = tl.channel('drainU', 0);
  const sumU = tl.channel('sumU', 0);
  const outU = tl.channel('outU', 0);
  const zeroU = tl.channel('zeroU', 0); // the "× 0" stamps
  const arrowU = tl.channel('arrowU', 0);
  const readU = tl.channel('readU', 0);
  const ghostU = tl.channel('ghostU', 0);
  const ghostOutU = tl.channel('ghostOutU', 0);
  const shrinkU = tl.channel('shrinkU', 0);
  // the grid
  const gridU = tl.channel('gridU', 0);
  const gridOp = tl.channel('gridOp', 1);
  const heroSpot = tl.channel('heroSpot', 0);
  const flagU = tl.channel('flagU', 0);
  // the gather
  const groupU = tl.channel('groupU', 0);
  const gatherU = tl.channel('gatherU', 0);
  const countU = tl.channel('countU', 0);
  const fallU = tl.channel('fallU', 0);
  // the click
  const hitU = tl.channel('hitU', 0);
  const plotOp = tl.channel('plotOp', 1);
  const ptrU = tl.channel('ptrU', 0);
  const ptrX = tl.channel('ptrX', 1000);
  const ptrY = tl.channel('ptrY', 560);
  const distU = tl.channel('distU', 0);
  const plotU = tl.channel('plotU', 0);
  const dotU = tl.channel('dotU', 0);
  const focusMove = tl.channel('focusMove', 0);
  const hitOkU = tl.channel('hitOkU', 0);
  const missU = tl.channel('missU', 0);
  const focusOp = tl.channel('focusOp', 1);
  // rounding points, status, recap
  const roundU = tl.channel('roundU', 0);
  const atomsU = tl.channel('atomsU', 0);
  const cardU = tl.channel('cardU', 0);
  const cardLines = tl.channel('cardLines', 0);
  const miniU = tl.channel('miniU', 0);
  const chainU = tl.channel('chainU', 0);
  const loseU = tl.channel('loseU', 0);

  const caps: { at: number; dur: number }[] = [];
  let at = 0.4;
  for (const text of CAPTIONS) {
    const dur = Math.round((text.split(/\s+/).length / WPS) * 10) / 10;
    caps.push({ at, dur });
    at += dur + HOLD;
  }
  const T = (i: number, dt: number): number => caps[i].at + dt;
  const cap = (i: number) => {
    tl.caption({ ...caps[i], text: CAPTIONS[i] });
    tl.hold(caps[i].at + caps[i].dur, HOLD);
  };

  // — B0 · the winner is a 1 and two 0s; everything else still needs rectangles —
  cap(0);
  tl.tween(bitsU, 1, { at: T(0, 0.3), dur: 0.8, ease: ease.enter });
  tl.tween(stageU, 1, { at: T(0, 2.6), dur: 1.6, ease: ease.linear });
  tl.tween(codeU, 1, { at: T(0, 6.2), dur: 0.6, ease: ease.enter });

  // — B1 · thumbnail 0's left edge: three values, three bits, three products, one sum —
  cap(1);
  tl.tween(cam, CAM_RACK, { at: T(1, 0), dur: 1.3, ease: ease.move });
  tl.tween(codeU, 0, { at: T(1, 0), dur: 0.5, ease: ease.move });
  tl.tween(stageOp, 0.1, { at: T(1, 0), dur: 0.6, ease: ease.move });
  tl.tween(laneU, 1, { at: T(1, 1.0), dur: 1.0, ease: ease.linear });
  tl.tween(gateU, 1, { at: T(1, 2.6), dur: 0.7, ease: ease.enter });
  tl.tween(prodU, 1, { at: T(1, 3.6), dur: 0.8, ease: ease.move });
  tl.tween(drainU, 1, { at: T(1, 4.8), dur: 1.2, ease: ease.move });
  tl.tween(sumU, 1, { at: T(1, 6.4), dur: 0.8, ease: ease.draw });
  tl.tween(outU, 1, { at: T(1, 7.2), dur: 0.6, ease: ease.pop });
  tl.tween(zeroU, 1, { at: T(1, 8.3), dur: 0.6, ease: ease.pop });

  // — B2 · the sum is Cinema's rectangle; the other two were computed, then erased —
  cap(2);
  tl.tween(cam, CAMERA_HOME, { at: T(2, 0), dur: 1.4, ease: ease.move });
  tl.tween(stageOp, 1, { at: T(2, 0), dur: 0.8, ease: ease.move });
  tl.tween(rackDim, 0.12, { at: T(2, 0.8), dur: 0.6, ease: ease.move });
  tl.tween(zeroU, 0, { at: T(2, 0.4), dur: 0.5, ease: ease.move });
  tl.tween(arrowU, 1, { at: T(2, 1.2), dur: 1.2, ease: ease.draw });
  tl.tween(readU, 1, { at: T(2, 2.6), dur: 0.7, ease: ease.enter });
  tl.tween(ghostU, 1, { at: T(2, 6.4), dur: 0.7, ease: ease.enter });
  tl.tween(ghostOutU, 1, { at: T(2, 9.0), dur: 1.0, ease: ease.move });

  // — B3 · the rack replicates: 12 thumbnails × 4, the hero × 4, heroPresent —
  cap(3);
  tl.tween(cam, CAM_GRID, { at: T(3, 0), dur: 1.3, ease: ease.move });
  tl.tween(stageOp, 0.1, { at: T(3, 0), dur: 0.6, ease: ease.move });
  tl.tween(arrowU, 0, { at: T(3, 0), dur: 0.5, ease: ease.move });
  tl.tween(readU, 0, { at: T(3, 0), dur: 0.5, ease: ease.move });
  tl.tween(rackDim, 1, { at: T(3, 0), dur: 0.4, ease: ease.move });
  tl.tween(shrinkU, 1, { at: T(3, 0.3), dur: 1.0, ease: ease.move });
  tl.tween(gridU, 1, { at: T(3, 1.0), dur: 1.6, ease: ease.linear });
  tl.tween(heroSpot, 1, { at: T(3, 3.6), dur: 0.6, ease: ease.move });
  tl.tween(flagU, 1, { at: T(3, 4.2), dur: 0.7, ease: ease.enter });

  // — B4 · drag the stage: the bit moves to Contact, then to Story —
  cap(4);
  tl.tween(cam, CAMERA_HOME, { at: T(4, 0), dur: 1.3, ease: ease.move });
  tl.tween(stageOp, 1, { at: T(4, 0), dur: 0.6, ease: ease.move });
  tl.tween(heroSpot, 0, { at: T(4, 0), dur: 0.5, ease: ease.move });
  tl.tween(flagU, 0, { at: T(4, 0), dur: 0.5, ease: ease.move });
  tl.tween(gridOp, 0.12, { at: T(4, 0), dur: 0.6, ease: ease.move });
  tl.tween(readU, 1, { at: T(4, 0.6), dur: 0.6, ease: ease.enter });
  tl.tween(stageW, 984, { at: T(4, 1.6), dur: 1.4, ease: ease.move });
  tl.tween(stageH, 730, { at: T(4, 1.6), dur: 1.4, ease: ease.move });
  tl.tween(sel, [0, 1, 0], { at: T(4, 1.6), dur: 1.4, ease: ease.move });
  tl.tween(stageW, 610, { at: T(4, 6.3), dur: 1.4, ease: ease.move });
  tl.tween(stageH, 830, { at: T(4, 6.3), dur: 1.4, ease: ease.move });
  tl.tween(sel, [0, 0, 1], { at: T(4, 6.3), dur: 1.4, ease: ease.move });

  // — B5 · declared one-hot: each sum becomes one gather read —
  cap(5);
  tl.tween(cam, CAM_GATHER, { at: T(5, 0), dur: 1.3, ease: ease.move });
  tl.tween(stageOp, 0.1, { at: T(5, 0), dur: 0.6, ease: ease.move });
  tl.tween(readU, 0, { at: T(5, 0), dur: 0.5, ease: ease.move });
  tl.tween(gridOp, 0, { at: T(5, 0), dur: 0.5, ease: ease.move });
  tl.tween(shrinkU, 0, { at: T(5, 0.2), dur: 1.0, ease: ease.move });
  tl.tween(groupU, 1, { at: T(5, 1.4), dur: 0.6, ease: ease.enter });
  tl.tween(gatherU, 1, { at: T(5, 2.4), dur: 1.2, ease: ease.move });
  tl.tween(countU, 1, { at: T(5, 3.4), dur: 0.7, ease: ease.enter });
  tl.tween(fallU, 1, { at: T(5, 4.2), dur: 1.0, ease: ease.move });

  // — B6 · a click: four edge distances → a bit per thumbnail → the first hit sets focus —
  cap(6);
  tl.tween(cam, CAM_CLICK, { at: T(6, 0), dur: 1.3, ease: ease.move });
  tl.tween(rackOp, 0, { at: T(6, 0), dur: 0.6, ease: ease.move });
  tl.tween(groupU, 0, { at: T(6, 0), dur: 0.6, ease: ease.move });
  tl.tween(countU, 0, { at: T(6, 0), dur: 0.6, ease: ease.move });
  tl.tween(bitsOp, 0.12, { at: T(6, 0), dur: 0.6, ease: ease.move });
  tl.tween(stageOp, 1, { at: T(6, 0), dur: 0.6, ease: ease.move });
  tl.tween(stageW, 1400, { at: T(6, 0.2), dur: 1.2, ease: ease.move });
  tl.tween(stageH, 680, { at: T(6, 0.2), dur: 1.2, ease: ease.move });
  tl.tween(sel, [1, 0, 0], { at: T(6, 0.2), dur: 1.2, ease: ease.move });
  tl.tween(hitU, 1, { at: T(6, 1.4), dur: 0.8, ease: ease.enter });
  tl.tween(ptrU, 1, { at: T(6, 2.4), dur: 0.5, ease: ease.enter });
  tl.tween(ptrX, CLICKS[0].x, { at: T(6, 2.4), dur: 0.9, ease: ease.move });
  tl.tween(ptrY, CLICKS[0].y, { at: T(6, 2.4), dur: 0.9, ease: ease.move });
  tl.tween(distU, 1, { at: T(6, 3.5), dur: 0.8, ease: ease.draw });
  tl.tween(plotU, 1, { at: T(6, 4.6), dur: 1.2, ease: ease.draw });
  tl.tween(dotU, 1, { at: T(6, 6.0), dur: 0.5, ease: ease.pop });
  tl.tween(focusMove, 1, { at: T(6, 8.6), dur: 0.8, ease: ease.move });

  // — B7 · one pixel inside hits; a quarter pixel inside misses —
  cap(7);
  tl.tween(cam, CAM_PLOT, { at: T(7, 0), dur: 1.3, ease: ease.move });
  tl.tween(stageOp, 0.1, { at: T(7, 0), dur: 0.6, ease: ease.move });
  tl.tween(distU, 0, { at: T(7, 0), dur: 0.5, ease: ease.move });
  tl.tween(ptrX, CLICKS[1].x, { at: T(7, 1.2), dur: 1.2, ease: ease.move });
  tl.tween(hitOkU, 1, { at: T(7, 2.5), dur: 0.5, ease: ease.pop });
  tl.tween(hitOkU, 0, { at: T(7, 4.4), dur: 0.4, ease: ease.move });
  tl.tween(ptrX, CLICKS[2].x, { at: T(7, 4.6), dur: 1.2, ease: ease.move });
  tl.tween(missU, 1, { at: T(7, 6.0), dur: 0.5, ease: ease.pop });

  // — B8 · fourteen rounding points: 12 hit tests + 2 argmax comparisons —
  cap(8);
  tl.tween(cam, CAMERA_HOME, { at: T(8, 0), dur: 1.3, ease: ease.move });
  tl.tween(plotOp, 0, { at: T(8, 0), dur: 0.6, ease: ease.move });
  tl.tween(missU, 0, { at: T(8, 0), dur: 0.5, ease: ease.move });
  tl.tween(ptrU, 0, { at: T(8, 0), dur: 0.5, ease: ease.move });
  tl.tween(focusOp, 0.12, { at: T(8, 0), dur: 0.6, ease: ease.move });
  tl.tween(bitsOp, 1, { at: T(8, 0.3), dur: 0.6, ease: ease.move });
  tl.tween(stageOp, 0.12, { at: T(8, 0), dur: 0.6, ease: ease.move });
  tl.tween(roundU, 1, { at: T(8, 1.0), dur: 1.4, ease: ease.linear });
  tl.tween(atomsU, 1, { at: T(8, 3.0), dur: 0.7, ease: ease.enter });

  // — B9 · the status card —
  cap(9);
  tl.tween(bitsOp, 0.1, { at: T(9, 0), dur: 0.6, ease: ease.move });
  tl.tween(hitU, 0, { at: T(9, 0), dur: 0.6, ease: ease.move });
  tl.tween(atomsU, 0, { at: T(9, 0), dur: 0.6, ease: ease.move });
  tl.tween(roundU, 0, { at: T(9, 0), dur: 0.6, ease: ease.move });
  tl.tween(stageOp, 0.08, { at: T(9, 0), dur: 0.6, ease: ease.move });
  tl.tween(cardU, 1, { at: T(9, 0.4), dur: 0.8, ease: ease.enter });
  tl.tween(cardLines, 5, { at: T(9, 0.8), dur: 8.8, ease: ease.linear });

  // — B10 · pull back: every layout built, scored by its worst gauge, losers × 0 —
  cap(10);
  tl.tween(cardU, 0, { at: T(10, 0), dur: 0.7, ease: ease.move });
  tl.tween(cam, CAM_END, { at: T(10, 0), dur: 1.5, ease: ease.move });
  tl.tween(stageOp, 1, { at: T(10, 0.3), dur: 0.8, ease: ease.move });
  tl.tween(bitsOp, 1, { at: T(10, 0.3), dur: 0.8, ease: ease.move });
  tl.tween(miniU, 1, { at: T(10, 0.9), dur: 1.0, ease: ease.enter });
  tl.tween(chainU, 4, { at: T(10, 2.4), dur: 4.0, ease: ease.linear });
  tl.tween(loseU, 1, { at: T(10, 6.6), dur: 0.6, ease: ease.pop });
  tl.hold(T(10, caps[10].dur + HOLD), 2.4);

  return {
    tl, cam, stageW, stageH, sel, bitsU, bitsOp, stageU, stageOp, codeU,
    rackOp, rackDim, laneU, gateU, prodU, drainU, sumU, outU, zeroU, arrowU, readU, ghostU, ghostOutU, shrinkU,
    gridU, gridOp, heroSpot, flagU,
    groupU, gatherU, countU, fallU,
    hitU, plotOp, ptrU, ptrX, ptrY, distU, plotU, dotU, focusMove, hitOkU, missU, focusOp,
    roundU, atomsU, cardU, cardLines, miniU, chainU, loseU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (local copies)
// ---------------------------------------------------------------------------

function BitDisc({ x, y, b, r = 14, opacity = 1, color = GAL }: { x: number; y: number; b: number; r?: number; opacity?: number; color?: string }) {
  if (opacity <= 0.005) return null;
  const on = clamp01(b);
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={color} fillOpacity={on} stroke={color} strokeWidth={2} />
      <text x={x} y={y + 5} textAnchor="middle" fill={on > 0.5 ? '#0a0e1a' : color} fontSize={r >= 13 ? 15 : 13} fontFamily={MONO} fontWeight={700}>
        {Math.round(on)}
      </text>
    </g>
  );
}

function ValChip({ x, y, text, color = colors.TEXT, stroke = colors.GRID, w = CHIP_W, opacity = 1, fs = 14 }: {
  x: number; y: number; text: string; color?: string; stroke?: string; w?: number; opacity?: number; fs?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - CHIP_H / 2} width={w} height={CHIP_H} rx={6} fill={colors.PANEL} stroke={stroke} strokeWidth={1.3} />
      <text x={x} y={y + 5} textAnchor="middle" fill={color} fontSize={fs} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

function CodeChip({ x, y, lines, stripe = GAL, opacity = 1, fs = 14 }: { x: number; y: number; lines: string[]; stripe?: string; opacity?: number; fs?: number }) {
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

function Chip({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start', mono = false }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean;
}) {
  if (opacity <= 0.005) return null;
  const w = chipW(text, fs, mono);
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  return (
    <g opacity={opacity}>
      <rect x={x0} y={y - fs - 4} width={w} height={fs + 12} rx={7} fill={colors.PANEL} stroke={color} strokeWidth={1.2} />
      <text x={x0 + w / 2} y={y} textAnchor="middle" fill={color} fontSize={fs} fontFamily={mono ? MONO : UI}>
        {text}
      </text>
    </g>
  );
}
const chipW = (text: string, fs: number, mono: boolean): number => text.length * (mono ? (fs === 14 ? CH14 : CH13) : fs * 0.56) + 20;

function Pointer({ x, y, opacity }: { x: number; y: number; opacity: number }) {
  if (opacity <= 0.005) return null;
  const s = 1.1;
  return (
    <path d={`M ${x} ${y} l 0 ${18 * s} l ${4.5 * s} ${-4.2 * s} l ${3.4 * s} ${7.6 * s} l ${3 * s} ${-1.4 * s} l ${-3.4 * s} ${-7.4 * s} l ${6.2 * s} 0 Z`}
      fill={colors.TEXT} stroke="#0a0e1a" strokeWidth={1.2} opacity={opacity} />
  );
}

function Tick({ x, y, s = 1, opacity = 1 }: { x: number; y: number; s?: number; opacity?: number }) {
  return (
    <path d={`M ${x - 7 * s} ${y} L ${x - 2 * s} ${y + 5 * s} L ${x + 8 * s} ${y - 6 * s}`} stroke={colors.POSITIVE} strokeWidth={3} fill="none"
      strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
  );
}

const Diamond = ({ x, y, r = 7, color = colors.SECONDARY, opacity = 1 }: { x: number; y: number; r?: number; color?: string; opacity?: number }) => (
  <polygon points={`${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`} fill={color} opacity={opacity} />
);

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const W = s.get(scene.stageW);
  const H = s.get(scene.stageH);
  const sel = s.get(scene.sel);
  const cs = candidates(W, H);
  const scores = cs.map((c) => c.score);
  const thumbs = Array.from({ length: PHOTOS }, (_, i) => selectRect(sel, cs.map((c) => c.thumbs[i])));
  const hero = selectRect(sel, cs.map((c) => c.hero));
  const heroPresent = select(sel, cs.map((c) => c.heroPresent));
  const lead = sel.indexOf(Math.max(...sel));

  const bitsU = s.get(scene.bitsU);
  const bitsOp = s.get(scene.bitsOp);
  const stageU = s.get(scene.stageU);
  const stageOp = s.get(scene.stageOp);
  const codeU = s.get(scene.codeU);
  const rackOp = s.get(scene.rackOp);
  const rackDim = s.get(scene.rackDim);
  const laneU = s.get(scene.laneU);
  const gateU = s.get(scene.gateU);
  const prodU = s.get(scene.prodU);
  const drainU = s.get(scene.drainU);
  const sumU = s.get(scene.sumU);
  const outU = s.get(scene.outU);
  const zeroU = s.get(scene.zeroU);
  const arrowU = s.get(scene.arrowU);
  const readU = s.get(scene.readU);
  const ghostU = s.get(scene.ghostU);
  const ghostOutU = s.get(scene.ghostOutU);
  const shrinkU = s.get(scene.shrinkU);
  const gridU = s.get(scene.gridU);
  const gridOp = s.get(scene.gridOp);
  const heroSpot = s.get(scene.heroSpot);
  const flagU = s.get(scene.flagU);
  const groupU = s.get(scene.groupU);
  const gatherU = s.get(scene.gatherU);
  const countU = s.get(scene.countU);
  const fallU = s.get(scene.fallU);
  const hitU = s.get(scene.hitU);
  const plotOp = s.get(scene.plotOp);
  const ptrU = s.get(scene.ptrU);
  const pX = s.get(scene.ptrX);
  const pY = s.get(scene.ptrY);
  const distU = s.get(scene.distU);
  const plotU = s.get(scene.plotU);
  const dotU = s.get(scene.dotU);
  const focusMove = s.get(scene.focusMove);
  const hitOkU = s.get(scene.hitOkU);
  const missU = s.get(scene.missU);
  const focusOp = s.get(scene.focusOp);
  const roundU = s.get(scene.roundU);
  const atomsU = s.get(scene.atomsU);
  const cardU = s.get(scene.cardU);
  const cardLines = s.get(scene.cardLines);
  const miniU = s.get(scene.miniU);
  const chainU = s.get(scene.chainU);
  const loseU = s.get(scene.loseU);

  // ---- the page (stage) ----
  const toX = (px: number): number => SX + px * SC;
  const toY = (py: number): number => SY + py * SC;
  const focusIdx = focusMove > 0.5 ? 7 : 0;

  // ---- the click on thumbnail 7: live from the pointer (all 12 hit tests) ----
  const hitsLive = thumbs.map((r) => hitBit(hitScore(Math.min(...edgeDistances(pX, pY, r)))));
  const d7 = edgeDistances(pX, pY, thumbs[7]);
  const dist7 = Math.min(...d7);
  const score7 = hitScore(dist7);
  const clicked = dotU > 0.5;
  const hits = clicked ? hitsLive : hitsLive.map(() => 0);

  // ---- rack geometry: full ↔ shrunk into the grid cell (thumb 0, left) ----
  const rk = lerp(1, 0.14, shrinkU);
  const rcx = lerp(RACK_C.x, GX[0], shrinkU);
  const rcy = lerp(RACK_C.y, RY(0), shrinkU);
  const rackFade = rackOp * clamp01((0.8 - shrinkU) / 0.4);
  const laneVals = cs.map((c) => c.thumbs[0].left);
  const leftOut = select(sel, laneVals);

  // ---- grid ----
  const gridVals: number[][] = [
    ...thumbs.map((r) => FIELDS.map((f) => r[f])),
    FIELDS.map((f) => hero[f]),
    [heroPresent],
  ];
  const cellU = (r: number, c: number): number => clamp01(gridU * 18 - (r + c * 0.6) * 0.95);
  const rowOp = (r: number): number => (r >= PHOTOS ? 1 : lerp(1, 0.15, heroSpot));

  const sheetOp = gridOp * clamp01((shrinkU - 0.55) / 0.3);
  const chain = ['build every layout', 'score each by its worst gauge', 'argmax: 1, 0, 0', 'multiply the losers by zero'];

  return (
    <>
      <rect width={STAGE_W} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== the one-hot: names, scores, bits ======================== */}
        {bitsU > 0.01 && (
          <g opacity={bitsU * bitsOp}>
            {NAMES.map((n, i) => {
              const on = sel[i];
              const col = on > 0.5 ? GAL : colors.MUTED;
              return (
                <g key={n} opacity={clamp01(bitsU * 3 - i * 0.6)}>
                  <text x={LX[i]} y={NAME_Y} textAnchor="middle" fill={col} fontSize={15} fontFamily={UI} fontWeight={on > 0.5 ? 600 : 400}>
                    {n}
                  </text>
                  <text x={LX[i]} y={SCORE_Y} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    {scores[i] >= 1 ? '1' : scores[i].toFixed(4)}
                  </text>
                  <BitDisc x={LX[i]} y={BIT_Y} b={on} />
                </g>
              );
            })}
            <text x={LX[2] + 30} y={BIT_Y + 5} fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={1 - groupU}>
              winner.selected
            </text>
            {/* B5: declared one-hot */}
            {groupU > 0.01 && (
              <g opacity={groupU}>
                <path d={`M ${LX[0] - 22} ${BIT_Y + 22} v 6 H ${LX[2] + 22} v -6`} fill="none" stroke={GAL} strokeWidth={1.5} />
                <Chip x={LX[2] + 30} y={BIT_Y + 5} text="circuit.assumeOneHot(selected)" color={GAL} mono />
              </g>
            )}
            {/* B8: the argmax tournament's two comparisons */}
            {roundU > 0.01 && (
              <g opacity={clamp01(roundU * 2 - 1)}>
                <path d={`M ${LX[0]} ${BIT_Y + 16} V 206 H ${LX[1]} V ${BIT_Y + 16}`} fill="none" stroke={colors.SECONDARY} strokeWidth={1.5} />
                <path d={`M 250 206 V 244 H ${LX[2]} V ${BIT_Y + 16}`} fill="none" stroke={colors.SECONDARY} strokeWidth={1.5} />
                <Diamond x={250} y={206} />
                <Diamond x={355} y={244} />
                <text x={LX[2] + 30} y={249} fill={colors.SECONDARY} fontSize={13} fontFamily={UI}>
                  2 argmax comparisons
                </text>
              </g>
            )}
          </g>
        )}

        {/* ======================== the selector rack (thumbnail 0's left) ======================== */}
        {rackFade > 0.005 && laneU > 0.01 && (
          <g opacity={rackFade} transform={`translate(${rcx} ${rcy}) scale(${rk}) translate(${-RACK_C.x} ${-RACK_C.y})`}>
            <g opacity={rackDim}>
              <text x={60} y={VAL_Y + 5} fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={laneU}>
                left
              </text>
              {NAMES.map((n, i) => {
                const u = clamp01(laneU * 3 - i);
                if (u <= 0) return null;
                const bit = sel[i];
                const win = bit > 0.5;
                const val = laneVals[i];
                const prod = drainU < 0.5 ? val : bit * val; // the zeroed lanes swap their number at mid-drain
                const swap = 1 - 0.85 * Math.sin(Math.PI * clamp01(drainU)) * (win ? 0 : 1);
                const laneCol = win ? GAL : colors.MUTED;
                const g = clamp01(gateU);
                const pu = clamp01(prodU);
                const keep = 1 - gatherU;
                return (
                  <g key={n} opacity={u}>
                    <ValChip x={LX[i]} y={VAL_Y} text={fmt(val)} stroke={win && gatherU > 0.5 ? GAL : colors.GRID}
                      color={win || gatherU < 0.5 ? colors.TEXT : colors.MUTED} />
                    {/* the bit's wire into the gate */}
                    <g opacity={g * keep}>
                      <path d={`M ${LX[i] + 14} ${BIT_Y} H ${LX[i] + 56} V ${GATE_Y} H ${LX[i] + 16}`} fill="none" stroke={GAL}
                        strokeOpacity={0.35 + 0.65 * bit} strokeWidth={1.5} strokeDasharray="4 3" />
                      <line x1={LX[i]} y1={VAL_Y + CHIP_H / 2} x2={LX[i]} y2={GATE_Y - 15} stroke={colors.GRID} strokeWidth={1.5} />
                      <circle cx={LX[i]} cy={GATE_Y} r={15} fill={colors.PANEL} stroke={laneCol} strokeWidth={1.8} />
                      <text x={LX[i]} y={GATE_Y + 6} textAnchor="middle" fill={laneCol} fontSize={17} fontFamily={MONO}>
                        ×
                      </text>
                      <line x1={LX[i]} y1={GATE_Y + 15} x2={LX[i]} y2={PROD_Y - CHIP_H / 2} stroke={colors.GRID} strokeWidth={1.5} opacity={pu} />
                    </g>
                    {pu > 0.01 && (
                      <g opacity={keep}>
                        <ValChip x={LX[i]} y={lerp(GATE_Y, PROD_Y, pu)} text={fmt(prod)} opacity={pu * swap}
                          color={win ? colors.TEXT : drainU > 0.5 ? colors.NEGATIVE : colors.TEXT}
                          stroke={win ? GAL : colors.GRID} />
                        {zeroU > 0.01 && !win && (
                          <text x={LX[i] + CHIP_W / 2 + 8} y={PROD_Y + 5} fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO} opacity={zeroU}>
                            × 0
                          </text>
                        )}
                      </g>
                    )}
                    {/* products into Σ */}
                    {sumU > 0.01 && (
                      <line x1={LX[i]} y1={PROD_Y + CHIP_H / 2} x2={lerp(LX[i], SUM.x, sumU)} y2={lerp(PROD_Y + CHIP_H / 2, SUM.y - 14, sumU)}
                        stroke={win ? GAL : colors.GRID} strokeWidth={1.6} opacity={keep} />
                    )}
                    {/* B5: one gather read straight from the winner's value */}
                    {gatherU > 0.01 && win && (
                      <path d={`M ${LX[i]} ${VAL_Y + CHIP_H / 2} V ${OUT_Y - 40} L ${SUM.x + 30} ${OUT_Y - CHIP_H / 2}`} fill="none"
                        stroke={GAL} strokeWidth={2.4} strokeDasharray={`${gatherU * 400} 400`} />
                    )}
                  </g>
                );
              })}
              {sumU > 0.01 && (
                <g opacity={sumU * (1 - gatherU)}>
                  <circle cx={SUM.x} cy={SUM.y} r={20} fill={colors.PANEL} stroke={GAL} strokeWidth={1.8} />
                  <text x={SUM.x} y={SUM.y + 7} textAnchor="middle" fill={GAL} fontSize={20} fontFamily={UI}>
                    Σ
                  </text>
                  <text x={SUM.x + 30} y={SUM.y + 5} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    circuit.affine
                  </text>
                  <line x1={SUM.x} y1={SUM.y + 20} x2={SUM.x} y2={OUT_Y - CHIP_H / 2} stroke={GAL} strokeWidth={1.6} opacity={outU} />
                </g>
              )}
              {gatherU > 0.01 && (
                <text x={LX[2] + 12} y={PROD_Y + 5} fill={GAL} fontSize={13} fontFamily={UI} opacity={gatherU}>
                  one gather read
                </text>
              )}
            </g>
            <ValChip x={SUM.x} y={OUT_Y} w={176} text={`left = ${fmt(leftOut)}`} color={GAL} stroke={GAL} opacity={outU} />
          </g>
        )}

        {/* B5: the gather counters */}
        {countU > 0.01 && (
          <g opacity={countU * rackOp}>
            <text x={60} y={522} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
              {`gatherReads=${GATHER_READS} slots=1 · one-hot groups: 1`}
            </text>
            <text x={60} y={548} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              stored weights
            </text>
            <rect x={170} y={536} width={DENSE_WEIGHTS * 0.36} height={16} rx={3} fill={colors.MUTED} opacity={0.25 + 0.15 * (1 - fallU)} />
            <rect x={170} y={536} width={lerp(DENSE_WEIGHTS, LOWERED_WEIGHTS, fallU) * 0.36} height={16} rx={3} fill={GAL} opacity={0.85} />
            <text x={170 + DENSE_WEIGHTS * 0.36 + 10} y={549} fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
              {Math.round(lerp(DENSE_WEIGHTS, LOWERED_WEIGHTS, fallU))}
            </text>
            <text x={170} y={576} fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={fallU}>
              {`dense compile of the same roots: ${DENSE_WEIGHTS}`}
            </text>
          </g>
        )}

        {/* ======================== the grid of sums ======================== */}
        {gridU > 0.01 && sheetOp > 0.005 && (
          <g opacity={sheetOp}>
            {FIELDS.map((f, c) => (
              <text key={f} x={GX[c]} y={RY(0) - 22} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={clamp01(gridU * 4)}>
                {f}
              </text>
            ))}
            {ROWS.map((label, r) => (
              <g key={label} opacity={rowOp(r)}>
                <text x={60} y={RY(r) + 5} fill={r >= PHOTOS ? GAL : colors.MUTED} fontSize={13} fontFamily={MONO} opacity={cellU(r, 0)}>
                  {label}
                </text>
                {gridVals[r].map((v, c) => {
                  const u = cellU(r, c);
                  if (u <= 0.01) return null;
                  return (
                    <g key={c} opacity={u}>
                      <rect x={GX[c] - GW / 2} y={RY(r) - GH / 2} width={GW} height={GH} rx={4} fill={colors.PANEL} stroke={r === 0 && c === 0 ? GAL : colors.GRID} />
                      <text x={GX[c]} y={RY(r) + 5} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                        {fmt(v)}
                      </text>
                    </g>
                  );
                })}
              </g>
            ))}
            {flagU > 0.01 && (
              <text x={GX[1] - GW / 2 + 6} y={RY(13) + 5} fill={colors.TEXT} fontSize={13} fontFamily={MONO} opacity={flagU}>
                <tspan>= 1×1 + </tspan>
                <tspan fill={colors.NEGATIVE}>0×0</tspan>
                <tspan> + 0×1</tspan>
                <tspan fill={colors.MUTED}>{'  Contact: zero'}</tspan>
              </text>
            )}
          </g>
        )}

        {/* ======================== the click lane ======================== */}
        {hitU > 0.01 && (
          <g opacity={hitU}>
            <g opacity={plotOp}>
              <text x={60} y={196} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
                emitRectangleHit · thumbnail 7
              </text>
              <text x={60} y={224} fill={colors.TEXT} fontSize={14} fontFamily={MONO} opacity={clamp01(distU * 3) > 0 || dotU > 0 ? 1 : 0}>
                {`distance = min(${d7.map(fmt).join(', ')}) = ${fmt(dist7)}`}
              </text>
              {/* the clamp: relu(d) − relu(d − 1), then the nearest bit */}
              <rect x={PX(0)} y={PY(1) - 6} width={PX(D_MAX) - PX(0)} height={PY(0) - PY(1) + 6} fill={GAL} opacity={0.07} />
              <line x1={PX(-0.75)} y1={PY(0)} x2={PX(D_MAX)} y2={PY(0)} stroke={colors.MUTED} strokeWidth={1.3} />
              {[0, 1, 2].map((d) => (
                <g key={d}>
                  <line x1={PX(d)} y1={PY(0) - 4} x2={PX(d)} y2={PY(0) + 4} stroke={colors.MUTED} strokeWidth={1.3} />
                  <text x={PX(d)} y={PY(0) + 18} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    {d}
                  </text>
                  <text x={PX(d)} y={PY(0) + 34} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                    {T7.left + d}
                  </text>
                </g>
              ))}
              <text x={PX(-0.75) - 6} y={PY(0) + 18} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                d
              </text>
              <text x={PX(-0.75) - 6} y={PY(0) + 34} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                x
              </text>
              <text x={PX(-0.7)} y={PY(0) - 30} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
                outside
              </text>
              <text x={PX(0) + 8} y={PY(0) - 30} fill={GAL} fontSize={13} fontFamily={UI}>
                inside
              </text>
              <line x1={PX(-0.75)} y1={PY(0.5)} x2={PX(D_MAX)} y2={PY(0.5)} stroke={colors.MUTED} strokeWidth={1} strokeDasharray="4 4" opacity={plotU} />
              <text x={PX(D_MAX)} y={PY(0.5) + 17} textAnchor="end" fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={plotU}>
                rounds to the nearest bit
              </text>
              {plotU > 0.01 && (
                <path d={`M ${PX(-0.75)} ${PY(0)} H ${PX(0)} L ${PX(1)} ${PY(1)} H ${PX(D_MAX)}`} fill="none" stroke={GAL} strokeWidth={2.6}
                  strokeDasharray={`${plotU * 700} 700`} />
              )}
              <text x={PX(-0.75)} y={PY(1) - 12} fill={GAL} fontSize={13} fontFamily={MONO} opacity={plotU}>
                relu(d) − relu(d − 1)
              </text>
              {dotU > 0.01 && (
                <g opacity={dotU}>
                  <circle cx={PX(Math.min(dist7, D_MAX))} cy={PY(score7)} r={7 * (0.6 + 0.4 * dotU)} fill={hitBit(score7) ? colors.POSITIVE : colors.NEGATIVE} />
                  {dist7 > D_MAX && (
                    <path d={`M ${PX(D_MAX) + 10} ${PY(1)} l 10 0 m -5 -5 l 5 5 l -5 5`} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
                  )}
                  <text x={PX(D_MAX)} y={PY(1) - 12} textAnchor="end" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
                    {`d = ${fmt(dist7)} · score ${fmt(score7)} · bit ${hitBit(score7)}`}
                  </text>
                </g>
              )}
            </g>
            {/* thumbnailHits: twelve bits */}
            <text x={60} y={HITS_Y - 26} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
              thumbnailHits
            </text>
            {hits.map((b, i) => (
              <g key={i}>
                <BitDisc x={HX(i)} y={HITS_Y} b={b} r={11} color={i === 7 ? GAL : colors.MUTED} />
                <text x={HX(i)} y={HITS_Y + 28} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                  {i}
                </text>
                {roundU > 0.01 && (
                  <circle cx={HX(i)} cy={HITS_Y} r={16} fill="none" stroke={colors.SECONDARY} strokeWidth={1.6} opacity={clamp01(roundU * 2.2 - i * 0.09)} />
                )}
              </g>
            ))}
            {roundU > 0.01 && (
              <text x={HX(11) + 24} y={HITS_Y + 5} fill={colors.SECONDARY} fontSize={13} fontFamily={UI} opacity={clamp01(roundU * 2 - 1)}>
                12 hit tests
              </text>
            )}
            {hitOkU > 0.01 && (
              <g opacity={hitOkU}>
                <Tick x={HX(7)} y={HITS_Y - 30} s={1.1} />
                <text x={HX(7) + 14} y={HITS_Y - 26} fill={colors.POSITIVE} fontSize={13} fontFamily={UI}>
                  one pixel inside: hit
                </text>
              </g>
            )}
            {missU > 0.01 && (
              <text x={HX(7) - 12} y={HITS_Y - 26} fill={colors.NEGATIVE} fontSize={13} fontFamily={UI} opacity={missU}>
                a quarter pixel inside: no hit
              </text>
            )}
            {/* focus: the first hit sets its cell to 1 */}
            <g opacity={focusOp}>
              <text x={60} y={FOCUS_Y - 18} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
                focus
              </text>
              <Chip x={118} y={FOCUS_Y - 18} text="emitFirstActive(clickActive, thumbnailHits)" color={colors.MUTED} mono />
              {Array.from({ length: PHOTOS }, (_, i) => {
                const v = i === 7 ? focusMove : i === 0 ? 1 - focusMove : 0;
                return (
                  <g key={i}>
                    <rect x={HX(i) - 15} y={FOCUS_Y} width={30} height={24} rx={4} fill={GAL} fillOpacity={0.12 + 0.6 * v} stroke={v > 0.5 ? GAL : colors.GRID} />
                    <text x={HX(i)} y={FOCUS_Y + 17} textAnchor="middle" fill={v > 0.5 ? '#0a0e1a' : colors.TEXT} fontSize={13} fontFamily={MONO}>
                      {Math.round(v)}
                    </text>
                  </g>
                );
              })}
              {missU > 0.01 && (
                <g opacity={missU}>
                  <rect x={HX(0) - 20} y={FOCUS_Y - 5} width={HX(11) - HX(0) + 40} height={34} rx={6} fill="none" stroke={colors.POSITIVE} strokeWidth={1.5} />
                  <text x={HX(11) + 24} y={FOCUS_Y + 17} fill={colors.POSITIVE} fontSize={13} fontFamily={UI}>
                    stays put
                  </text>
                </g>
              )}
            </g>
          </g>
        )}

        {/* B8: the count */}
        {atomsU > 0.01 && (
          <g opacity={atomsU}>
            <text x={60} y={318} fill={colors.TEXT} fontSize={24} fontFamily={UI} fontWeight={600}>
              {`${BOOLEAN_ATOMS} boolean atoms`}
            </text>
            <text x={60} y={344} fill={colors.MUTED} fontSize={14} fontFamily={UI}>
              {`= ${HIT_ATOMS} thumbnail hit tests + ${ARGMAX_ATOMS} argmax comparisons · the rest is arithmetic`}
            </text>
            <Chip x={60} y={384} text={`expect(booleanWires.length).toBe(${BOOLEAN_ATOMS})`} color={colors.SECONDARY} mono />
          </g>
        )}

        {/* B10: every layout, built — the losers × 0 */}
        {miniU > 0.01 && (
          <g opacity={miniU}>
            {PRESET[0].cs.map((c, k) => {
              const ms = 0.085;
              const x0 = LX[k] - (1400 * ms) / 2;
              const y0 = 196;
              const loser = PRESET[0].sel[k] === 0;
              const op = loser ? lerp(1, 0.3, loseU) : 1;
              return (
                <g key={k}>
                  <g opacity={op}>
                    <rect x={x0} y={y0} width={1400 * ms} height={680 * ms} rx={2} fill={colors.PANEL} stroke={loser ? colors.GRID : GAL} strokeWidth={1.3} />
                    {c.heroPresent > 0 && (
                      <rect x={x0 + c.hero.left * ms} y={y0 + c.hero.top * ms} width={c.hero.width * ms} height={c.hero.height * ms} fill={photoHue(7)} opacity={0.8} />
                    )}
                    {c.thumbs.map((r, i) => (
                      <rect key={i} x={x0 + r.left * ms} y={y0 + r.top * ms} width={Math.max(0.5, r.width * ms)} height={Math.max(0.5, r.height * ms)} fill={photoHue(i)} />
                    ))}
                  </g>
                  <text x={LX[k]} y={y0 + 680 * ms + 20} textAnchor="middle" fill={loser ? colors.NEGATIVE : GAL} fontSize={13} fontFamily={MONO} opacity={loser ? loseU : 1}>
                    {loser ? '× 0' : '× 1'}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        {chainU > 0.01 && (
          <g>
            {(() => {
              const widths = chain.map((t) => chipW(t, 14, false));
              const total = widths.reduce((a, b) => a + b, 0) + 3 * 44;
              let x = 640 - total / 2;
              return chain.map((t, i) => {
                const x0 = x;
                x += widths[i] + 44;
                const u = clamp01(chainU - i);
                return (
                  <g key={t} opacity={u}>
                    <Chip x={x0} y={452} text={t} color={i === 3 ? GAL : colors.TEXT} fs={14} />
                    {i < 3 && <path d={`M ${x0 + widths[i] + 10} 447 h 24 m -6 -5 l 6 5 l -6 5`} fill="none" stroke={colors.MUTED} strokeWidth={1.5} />}
                  </g>
                );
              });
            })()}
          </g>
        )}

        {/* ======================== the page ======================== */}
        {stageU > 0.01 && (
          <g opacity={stageOp}>
            <text x={SX} y={SY - 12} fill={colors.MUTED} fontSize={13} fontFamily={UI} opacity={clamp01(stageU * 3)}>
              the page
            </text>
            <rect x={SX} y={SY} width={W * SC} height={H * SC} rx={4} fill={colors.PANEL} stroke={colors.MUTED} strokeOpacity={0.5} strokeWidth={1.3}
              opacity={clamp01(stageU * 3)} />
            {/* the hero: its opacity is heroPresent, like the page's hero layer */}
            {heroPresent > 0.01 && hero.width > 1 && (
              <g opacity={heroPresent * clamp01(stageU * 3 - 1)}>
                <rect x={toX(hero.left)} y={toY(hero.top)} width={hero.width * SC} height={hero.height * SC} rx={3} fill={photoHue(focusIdx)} opacity={0.85} />
                {hero.width * SC > 150 && (
                  <text x={toX(hero.left) + 10} y={toY(hero.top) + 22} fill={colors.TEXT} fontSize={13} fontFamily={UI}>
                    {`hero · ${PHOTO_NAMES[focusIdx]}`}
                  </text>
                )}
              </g>
            )}
            {thumbs.map((r, i) => {
              const u = clamp01(stageU * 14 - 2 - i * 0.8);
              if (u <= 0) return null;
              const spot = i === 0 && (arrowU > 0.01 || readU > 0.01);
              const focused = i === focusIdx && hitU > 0.01;
              return (
                <g key={i} opacity={u}>
                  <rect x={toX(r.left)} y={toY(r.top)} width={r.width * SC} height={r.height * SC} rx={2} fill={photoHue(i)}
                    stroke={spot ? GAL : focused ? colors.TEXT : 'none'} strokeWidth={spot ? 2.5 : 2} />
                  {r.width * SC > 18 && r.height * SC > 16 && (
                    <text x={toX(r.left) + 5} y={toY(r.top) + 15} fill={colors.TEXT} fontSize={12} fontFamily={MONO}>
                      {i}
                    </text>
                  )}
                </g>
              );
            })}
            {/* B2: the two erased candidates for thumbnail 0 */}
            {ghostU > 0.01 &&
              [1, 2].map((k) => {
                const r = cs[k].thumbs[0];
                const op = ghostU * (1 - ghostOutU);
                if (op <= 0.005) return null;
                return (
                  <g key={k} opacity={op}>
                    <rect x={toX(r.left)} y={toY(r.top)} width={r.width * SC} height={r.height * SC} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.6} strokeDasharray="5 4" />
                    <text x={toX(r.left) + r.width * SC - 6} y={toY(r.top + r.height) + (k === 1 ? -8 : 17)} textAnchor="end" fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO}>
                      {`${NAMES[k]}'s thumbnail 0 × 0`}
                    </text>
                  </g>
                );
              })}
            {/* B6: the four edge distances of the click */}
            {distU > 0.01 && (
              <g opacity={distU} stroke={colors.WARM} strokeWidth={1.6}>
                <line x1={toX(pX)} y1={toY(pY)} x2={lerp(toX(pX), toX(T7.left), distU)} y2={toY(pY)} />
                <line x1={toX(pX)} y1={toY(pY)} x2={lerp(toX(pX), toX(T7.left + T7.width), distU)} y2={toY(pY)} />
                <line x1={toX(pX)} y1={toY(pY)} x2={toX(pX)} y2={lerp(toY(pY), toY(T7.top), distU)} />
                <line x1={toX(pX)} y1={toY(pY)} x2={toX(pX)} y2={lerp(toY(pY), toY(T7.top + T7.height), distU)} />
              </g>
            )}
            {ptrU > 0.01 && <Pointer x={toX(pX)} y={toY(pY)} opacity={ptrU} />}
            {/* the stage size and its drag handle */}
            <g opacity={clamp01(stageU * 3)}>
              <rect x={SX + W * SC - 7} y={SY + H * SC - 7} width={10} height={10} rx={2} fill={colors.MUTED} />
              <text x={SX + W * SC} y={SY + H * SC + 22} textAnchor="end" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>
                {`${Math.round(W)} × ${Math.round(H)}`}
              </text>
              <text x={SX + W * SC - 96} y={SY + H * SC + 22} textAnchor="end" fill={GAL} fontSize={14} fontFamily={UI} opacity={stageU > 0.99 ? 1 : 0}>
                {NAMES[lead]}
              </text>
            </g>
          </g>
        )}
        {/* B2/B4: thumbnail 0's rectangle, read out */}
        {readU > 0.01 && (
          <g opacity={readU * clamp01((Math.max(...sel) - 0.92) * 12.5)}>
            <text x={SX} y={READ_Y} fill={colors.MUTED} fontSize={13} fontFamily={UI}>
              thumbnail 0
            </text>
            <text x={SX} y={READ_Y + 24} fill={colors.TEXT} fontSize={15} fontFamily={MONO}>
              {`{left: ${fmt(thumbs[0].left)}, top: ${fmt(thumbs[0].top)}, width: ${fmt(thumbs[0].width)}, height: ${fmt(thumbs[0].height)}}`}
            </text>
          </g>
        )}
        {/* B2: the sum drives the tile */}
        {arrowU > 0.01 && (
          <path
            d={`M ${SUM.x + 90} ${OUT_Y} C ${700} ${OUT_Y}, ${toX(thumbs[0].left) - 80} ${toY(thumbs[0].top) + 80}, ${toX(thumbs[0].left) - 4} ${toY(thumbs[0].top) + (thumbs[0].height * SC) / 2}`}
            fill="none" stroke={GAL} strokeWidth={2} strokeDasharray={`${arrowU * 1100} 1100`} />
        )}

        {/* B9: the status card */}
        {cardU > 0.01 && (
          <g opacity={cardU}>
            <rect x={200} y={140} width={880} height={350} rx={14} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.3} />
            <text x={240} y={184} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
              lab/candidate-gallery · status
            </text>
            {[
              <text key="a" x={240} y={228} fill={colors.TEXT} fontSize={26} fontFamily={UI} fontWeight={600}>
                a working demo
              </text>,
              <text key="b" x={240} y={276} fill={colors.TEXT} fontSize={17} fontFamily={UI}>
                moved into lab/ from the repo root on September 17, 2026
              </text>,
              <text key="c" x={240} y={314} fill={colors.TEXT} fontSize={17} fontFamily={UI}>
                measured by lab/runtime-cost
              </text>,
              <text key="d" x={240} y={362} fill={colors.TEXT} fontSize={17} fontFamily={UI}>
                nothing is learned: the seven quality scales are written by hand
              </text>,
              <g key="e">
                {SCALES.map((sc, i) => (
                  <Chip key={i} x={240 + i * 92} y={414} text={sc} color={GAL} mono fs={14} />
                ))}
              </g>,
            ].map((el, i) => (
              <g key={i} opacity={clamp01((cardLines - i * (i < 3 ? 1 : 0.9)) * 2)}>
                {el}
              </g>
            ))}
            <text x={240} y={462} fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={clamp01(cardLines * 2)}>
              bun test ./lab/candidate-gallery → 8 pass
            </text>
          </g>
        )}
      </Camera>

      {/* ======================== screen-space: code chip, title ======================== */}
      {codeU > 0.01 && <CodeChip x={60} y={500} lines={CODE_SELECT} opacity={codeU} />}
      <rect x={0} y={0} width={STAGE_W} height={HEADER_H} fill={colors.BG} opacity={0.9} />
      <text x={40} y={36} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        3 · Everyone Reads the Winner
      </text>
    </>
  );
}

export const vizScene = () => scene;
