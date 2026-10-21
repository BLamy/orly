// What held, what didn't
//
// Learned Gallery — chapter 4. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/learned-gallery/README.md:3 (dated October 14, 2026; the scratch scripts aren't in the repo)
//   lab/learned-gallery/README.md:61 (the probe: 24 sessions of 40 small edits, stuck = 0.5 to 8 px; 78%, 47%,
//     21%, 1.8%)
//   lab/learned-gallery/README.md:32-33 (180 edits of 22 px: 151; 0.12 and 2.3 px, 11 of 151 over 1 px),
//     35 (96 sessions: 1.1%, 0.7% to 1.4% by batch of 24; straightening 2.5% and 2.7%),
//     37 (8 sessions of 200 random edits: none of 1,600), 42 (200 variants: widest line 0.15 px, 26 train all
//     2,000 steps), 45 (reviewer: 5 of 1,600; 0.5% of 1,920 mixed edits in 48 sessions, 620 px stage),
//     47 (Story's edge 0.6 px on 538 × 430), 49 (12 of 200 end with an edge 2 to 4 px off, 5 after all 2,000),
//     53 (traced on 620 × 496: gradient 2.3e-6, that edge's error alone 6.7e-5, 29 times as much)
//   lab/status.md:203 ("No held-out test: the network is fitted to one sketch at a time.")
//   src/learned-gallery/trainable-geometry.ts:84-98 (penaltyStiffness = 5, penaltyStrength = 2, the probe's reach
//     of 8 px on 538 × 430), 138-141 (pairPull, ported below)
//   src/learned-gallery/learned-gallery.ts:44-58 (stage margins and gaps), 101-125 (createStoryLayout, ported
//     below), 243 (defaultHoldDistance = 0.04)
//   tests: `bun test ./tests/learned-gallery` → 41 pass (plan.md run)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan; captions are the fixed
// narration contract (verbatim). The persistent machine is one field of cells: the probe's 960 edits
// (24 × 40), whose stuck cells light as share × 960 for each penalty form, reflow into the 200 Story variants.
// Which cells light, which variants are ringed and which drift are SCHEMATIC placements (seeded, labelled on
// screen); every count and share is the lab's. The ledger's axis zooms from 0–80% to 0–3% so the small shares
// read. The Story stage, the pull curve and the hold distance are computed from the code's own constants.
// The one stuck edit drawn in beat 1 is schematic (labelled); the 1-D gradient arrows in beat 9 keep the
// measured ratio of lengths, their directions are schematic.
import { scaleLinear } from 'd3';
import { CAMERA_HOME, Camera, STAGE_H, STAGE_W, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const FAINT = 'rgba(148, 163, 184, 0.14)';
const MAGPIE = '#4f7cc8'; // the book's accent

// ---------------------------------------------------------------------------
// The code's numbers (learned-gallery.ts, trainable-geometry.ts), ported
// ---------------------------------------------------------------------------

const STAGE_PX = { w: 538, h: 430 };
const layoutMarginX = 0.036;
const layoutGapX = 0.02;
const layoutMarginY = (layoutMarginX * 5) / 4;
const layoutGapY = (layoutGapX * 5) / 4;
const layoutWidth = 1 - layoutMarginX * 2;
const layoutHeight = 1 - layoutMarginY * 2;
type R = { left: number; top: number; width: number; height: number };
function createGridCells(left: number, top: number, width: number, height: number, cols: number, rows: number, n: number): R[] {
  const cw = (width - layoutGapX * (cols - 1)) / cols;
  const ch = (height - layoutGapY * (rows - 1)) / rows;
  return Array.from({ length: n }, (_, c) => ({
    left: left + (c % cols) * (cw + layoutGapX),
    top: top + Math.floor(c / cols) * (ch + layoutGapY),
    width: cw,
    height: ch,
  }));
}
const heroWidth = 0.6;
const heroHeight = 0.52;
const STORY: R[] = [
  { left: layoutMarginX, top: layoutMarginY, width: heroWidth, height: heroHeight },
  ...createGridCells(layoutMarginX + heroWidth + layoutGapX, layoutMarginY, layoutWidth - heroWidth - layoutGapX, heroHeight, 1, 2, 2),
  ...createGridCells(layoutMarginX, layoutMarginY + heroHeight + layoutGapY, layoutWidth, layoutHeight - heroHeight - layoutGapY, 4, 2, 7),
];
if (STORY.length !== 10) throw new Error('Story has 10 rectangles');

const penaltyStiffness = 5;
const penaltyStrength = 2;
const defaultHoldDistance = 0.04;
function pairPull(gap: number, multiplier: number, reach: number) {
  const limit = Math.max(0, reach - Math.abs(gap));
  return Math.max(-limit, Math.min(limit, multiplier + penaltyStiffness * gap));
}
const SHIPPED_REACH = defaultHoldDistance / penaltyStrength; // 0.02 of the width
const PROBE_REACH_PCT = (8 / STAGE_PX.w) * 100; // 1.487 → "1.5%"
const HOLD_PX = defaultHoldDistance * STAGE_PX.w; // 21.5 px
if (Math.abs(SHIPPED_REACH - 0.02) > 1e-12 || PROBE_REACH_PCT.toFixed(1) !== '1.5' || HOLD_PX.toFixed(1) !== '21.5') {
  throw new Error('reach arithmetic');
}

// the lab's measurements (README.md lines in the header)
const PROBE_SESSIONS = 24;
const PROBE_EDITS = 40;
const PROBE_N = PROBE_SESSIONS * PROBE_EDITS; // 960
const FORMS = [
  { label: 'fixed pull, no multipliers', pct: 78 },
  { label: 'rounded less', pct: 47 },
  { label: 'multipliers · limit full for first 2 px', pct: 21 },
  { label: 'limit falls from gap 0 (kept)', pct: 1.8 },
];
const LIT = FORMS.map((f) => Math.round((f.pct / 100) * PROBE_N)); // 749 451 202 17
const GRAD_OWN = 6.7e-5;
const GRAD_TOTAL = 2.3e-6;
const GRAD_RATIO = Math.round(GRAD_OWN / GRAD_TOTAL); // 29
if (GRAD_RATIO !== 29) throw new Error('gradient ratio');
const REVIEWER_PCT = (5 / 1600) * 100; // 0.31%
const DRAG_PX = 22;
const DRAG_SHARE = 151 / 180;

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 stays clear for the CC pill)
// ---------------------------------------------------------------------------

const ST = { x: 60, y: 165, w: 360 };
const SPX = ST.w / STAGE_PX.w; // screen px per stage px
const STH = STAGE_PX.h * SPX;
const rx = (r: R) => ST.x + r.left * ST.w;
const ry = (r: R) => ST.y + r.top * STH;
const rw = (r: R) => r.width * ST.w;
const rh = (r: R) => r.height * STH;

// the field: 960 probe cells (24 × 40) that reflow into 200 variants (20 × 10)
const F = { x: 470, y: 182 };
const P_PITCH = 9;
const P_CELL = 7;
const V_COLS = 20;
const V_PITCH = 18;
const V_R = 5.5;
const FIELD_W = PROBE_EDITS * P_PITCH - (P_PITCH - P_CELL);
const rand = mulberry32(0x4f7c);
const ORDER = Array.from({ length: PROBE_N }, (_, i) => i);
for (let i = PROBE_N - 1; i > 0; i--) {
  const j = Math.floor(rand() * (i + 1));
  [ORDER[i], ORDER[j]] = [ORDER[j], ORDER[i]];
}
const RANK = new Array<number>(PROBE_N);
ORDER.forEach((cell, k) => (RANK[cell] = k));
const VARIANTS = 200;
const vRand = mulberry32(2000);
const vPerm = Array.from({ length: VARIANTS }, (_, i) => i);
for (let i = VARIANTS - 1; i > 0; i--) {
  const j = Math.floor(vRand() * (i + 1));
  [vPerm[i], vPerm[j]] = [vPerm[j], vPerm[i]];
}
const RINGED = new Set(vPerm.slice(0, 26)); // 26 train all 2,000 steps
const OFF_LATE = vPerm.slice(0, 5); // 5 of the 12 off-line edges are among them
const OFF_EARLY = vPerm.slice(26, 33);
const OFF = new Set([...OFF_LATE, ...OFF_EARLY]);
if (RINGED.size !== 26 || OFF.size !== 12 || OFF_LATE.filter((v) => RINGED.has(v)).length !== 5) throw new Error('variant sets');
const OFF_LIST = [...OFF_LATE, ...OFF_EARLY];

const probePos = (i: number) => ({ x: F.x + (i % PROBE_EDITS) * P_PITCH + P_CELL / 2, y: F.y + Math.floor(i / PROBE_EDITS) * P_PITCH + P_CELL / 2 });
const varPos = (i: number) => ({ x: F.x + (i % V_COLS) * V_PITCH + V_R, y: F.y + 14 + Math.floor(i / V_COLS) * V_PITCH + V_R });
const OFF_X = 900; // the "off-line edge" column right of the field
const offPos = (k: number) => ({ x: OFF_X, y: F.y + 30 + k * 22 });

// the ledger (right)
const L = { x: 880, y: 150, barW: 230, row: 40 };
const rowY = (i: number) => L.y + 4 + i * L.row + (i >= 4 ? 10 : 0);
const LEDGER_ROWS = [
  ...FORMS.map((f) => ({ label: f.label, values: [f.pct], color: f.pct < 2 ? MAGPIE : colors.NEGATIVE })),
  { label: '96 sessions × 40 · shipped penalty', values: [1.1], color: MAGPIE, whisker: [0.7, 1.4] as [number, number] },
  { label: 'straightening · two batches of 24', values: [2.5, 2.7], color: colors.MUTED },
  { label: '8 sessions × 200 random edits', values: [0], color: MAGPIE, text: '0 of 1,600' },
  { label: 'reviewer · 8 × 200', values: [REVIEWER_PCT], color: colors.WARM, text: '5 of 1,600' },
  { label: 'reviewer · 1,920 mixed (620 px stage)', values: [0.5], color: colors.WARM },
];
const ZOOM_MAX = [80, 3];
const fmtPct = (v: number) => `${v % 1 === 0 ? v : v.toFixed(1)}%`;

// pull plot (beat 3), x in reaches, y in reaches
const PP = { x: 520, y: 452, w: 280, h: 140 };
const ppx = scaleLinear([0, 1.15], [PP.x, PP.x + PP.w]);
const ppy = scaleLinear([0, 1], [PP.y + PP.h, PP.y]);
const curve = (f: (g: number) => number) =>
  Array.from({ length: 116 }, (_, i) => {
    const g = i / 100;
    return `${i ? 'L' : 'M'}${ppx(g).toFixed(1)},${ppy(f(g)).toFixed(1)}`;
  }).join('');
const LIMIT_PATH = curve((g) => Math.max(0, 1 - g));
const PULL0_PATH = curve((g) => pairPull(g, 0, 1));
const PULL5_PATH = curve((g) => pairPull(g, 0.5, 1));
// the dropped form, schematic: the limit stays full for 2 px of the probe's 8 px reach, then falls to 0
const OLD_LIMIT_PATH = curve((g) => (g < 0.25 ? 1 : Math.max(0, 1 - (g - 0.25) / 0.75)));

// the shared weights: 244 cells (2 × (6×10+6) + 2 × (6×6+6) + 4 × (6+1))
const W_N = 2 * (6 * 10 + 6) + 2 * (6 * 6 + 6) + 4 * (6 + 1);
if (W_N !== 244) throw new Error('parameter count');
const WG = { x: 520, y: 440, cols: 20, pitch: 12, cell: 9 };
const wPos = (i: number) => ({ x: WG.x + (i % WG.cols) * WG.pitch, y: WG.y + Math.floor(i / WG.cols) * WG.pitch });
const WG_W = WG.cols * WG.pitch - (WG.pitch - WG.cell);
const WG_H = Math.ceil(W_N / WG.cols) * WG.pitch - (WG.pitch - WG.cell);

// Story's off-line edge: the top of the second photo beside the large one
const EDGE_I = 2;
const EDGE_OFF_PX = 0.6;
const LOUPE = { x: 560, y: 300, r: 74, mag: 24 };
// beat 7's drag: the second rectangle of the first row below, 22 px down
const DRAG_I = 4;

// status / recap boards
const CARD = { x: 300, w: 680 };
const RECAP = [
  { title: '20 slots → 244 weights', sub: '→ rectangles', color: MAGPIE },
  { title: 'a penalty with multipliers', sub: 'lines them up', color: colors.SECONDARY },
  { title: 'undoable frames', sub: 'keep them still', color: colors.TEAL },
  { title: 'open', sub: 'off-line edges · no held-out test', color: colors.WARM },
];
const RC = { y: 250, w: 250, h: 120, gap: 20 };
const rcX = (i: number) => 640 - (RECAP.length * RC.w + (RECAP.length - 1) * RC.gap) / 2 + i * (RC.w + RC.gap);

const HOME: CameraState = CAMERA_HOME;
const CAM_STAGE: CameraState = { x: 250, y: 320, k: 1.5 };
const CAM_PROBE: CameraState = { x: 660, y: 330, k: 1.05 };
const CAM_LEDGER: CameraState = { x: 1010, y: 335, k: 1.3 };
const CAM_FIELD: CameraState = { x: 650, y: 330, k: 1.3 };
const CAM_DRAG: CameraState = { x: 250, y: 385, k: 1.45 };
const CAM_EDGE: CameraState = { x: 600, y: 380, k: 1.12 };

/** spoken duration at ~150 words per minute, with a little air */
const speak = (text: string) => +(text.split(/\s+/).length * 0.4 + 0.6).toFixed(1);

// ---------------------------------------------------------------------------
// Timeline — twelve fixed captions
// ---------------------------------------------------------------------------

const CAPTIONS = [
  'How was the penalty chosen? A probe compared four forms over 24 sessions of 40 small edits, counting edits that end with two photo edges stuck between half a pixel and eight pixels apart.',
  'A fixed pull without multipliers left seventy-eight percent of edits stuck. Rounded less, forty-seven. Multipliers with a limit that stays full for two pixels, twenty-one percent.',
  'Multipliers with a limit that falls from a gap of zero, the form that was kept, got it to one point eight percent. That probe used a reach of about one and a half percent, a little under the shipped two.',
  'At the shipped setting, 96 sessions of 40 small edits ended stuck one point one percent of the time, between 0.7 and 1.4 by batch, against about two and a half percent for straightening.',
  "In 8 sessions of 200 random edits the lab saw none in 1,600. A reviewer's own generator saw five in 1,600, and half a percent of 1,920 mixed edits. So read it as rare, not zero.",
  "Fitting 200 variants of Story's proportions, every line ended within fifteen hundredths of a pixel when training stopped. Twenty-six variants used all 2,000 steps to get there.",
  'Edits of 22 pixels pulled a photo off every line in 151 of 180 cases. Those photos ended a median twelve hundredths of a pixel from their rectangles, and 2.3 pixels at worst.',
  'The open problem is an edge on no line. Twelve of those 200 variants end with one two to four pixels off, five after all 2,000 steps. Edges share 244 weights, and rest where all the slopes balance.',
  "Story shows it: one edge rests six tenths of a pixel from where it's drawn. Its own error pulls 29 times harder than the total gradient, but the other edges pull the shared weights the other way.",
  "Status: current, with that limit open. Forty-one tests pass, but the scripts behind the measurements aren't in the repo, and the numbers describe the page as it was on October fourteenth.",
  "And there's no held-out test. The network is fitted to one sketch at a time, so the lab shows how well it fits a sketch, not how it handles one it never saw.",
  'To recap: twenty slots feed 244 weights that output rectangles, a penalty with multipliers lines them up, and undoable frames keep them still. Alignment is learned and mostly holds; off-line edges remain open.',
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_STAGE, cameraInterp);

  const stageU = tl.channel('stageU', 0);
  const stageOp = tl.channel('stageOp', 1);
  const stuckU = tl.channel('stuckU', 0);
  const probeU = tl.channel('probeU', 0);
  const lit = tl.channel('litCount', 0);
  const fieldOp = tl.channel('fieldOp', 1);
  const ledgerU = tl.channel('ledgerU', 0);
  const ledgerOp = tl.channel('ledgerOp', 1);
  const rowFill = LEDGER_ROWS.map((_, i) => tl.channel(`row${i}Fill`, 0));
  const rowDim = tl.channel('probeRowsDim', 0);
  const zoom = tl.channel('axisZoom', 0);
  const keptGlow = tl.channel('keptGlow', 0);
  const plotU = tl.channel('pullPlotU', 0);
  const reachU = tl.channel('reachNote', 0);
  const rareU = tl.channel('rareStamp', 0);
  const reflow = tl.channel('reflowU', 0);
  const fitU = tl.channel('variantsFit', 0);
  const ringU = tl.channel('ringU', 0);
  const dragU = tl.channel('dragU', 0);
  const dragNoteU = tl.channel('dragNote', 0);
  const offU = tl.channel('offDrift', 0);
  const lateU = tl.channel('lateRing', 0);
  const noLineU = tl.channel('noLineEdge', 0);
  const webU = tl.channel('weightWeb', 0);
  const loupeU = tl.channel('loupeU', 0);
  const arrowsU = tl.channel('gradArrows', 0);
  const statusU = tl.channel('statusU', 0);
  const chipsU = tl.channel('statusChips', 0);
  const heldU = tl.channel('heldOutU', 0);
  const boardsOp = tl.channel('boardsOp', 1);
  const recapU = tl.channel('recapU', 0);
  const recapLit = tl.channel('recapLit', 0);

  const fadeOut = (chs: ChannelRef<number>[], at: number, to = 0) => chs.forEach((ch) => tl.tween(ch, to, { at, dur: 0.7, ease: ease.move }));

  let t = 0.4;
  const beat = (i: number) => {
    const at = t;
    const dur = speak(CAPTIONS[i]);
    t = tl.caption({ at, dur, text: CAPTIONS[i] });
    t = tl.hold(t, 0.8);
    return at;
  };

  // — B1 · the probe: one stuck edit, then 960 of them —
  let c = beat(0);
  tl.tween(stageU, 1, { at: c + 0.2, dur: 1.4, ease: ease.draw });
  tl.tween(stuckU, 1, { at: c + 3.2, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_PROBE, { at: c + 6.4, dur: 1.4, ease: ease.move });
  tl.tween(stageOp, 0.15, { at: c + 7.0, dur: 0.8, ease: ease.move });
  tl.tween(probeU, 1, { at: c + 7.2, dur: 2.2, ease: ease.linear });

  // — B2 · three forms that stuck —
  c = beat(1);
  tl.tween(cam, HOME, { at: c, dur: 1.2, ease: ease.move });
  tl.tween(ledgerU, 1, { at: c + 0.3, dur: 0.7, ease: ease.enter });
  tl.tween(rowFill[0], 1, { at: c + 0.9, dur: 1.2, ease: ease.move });
  tl.tween(lit, LIT[0], { at: c + 0.9, dur: 1.2, ease: ease.move });
  tl.tween(rowFill[1], 1, { at: c + 5.2, dur: 1.0, ease: ease.move });
  tl.tween(lit, LIT[1], { at: c + 5.2, dur: 1.0, ease: ease.move });
  tl.tween(rowFill[2], 1, { at: c + 7.6, dur: 1.0, ease: ease.move });
  tl.tween(lit, LIT[2], { at: c + 7.6, dur: 1.0, ease: ease.move });

  // — B3 · the kept form; the axis zooms in; the pull it uses —
  c = beat(2);
  tl.tween(rowFill[3], 1, { at: c + 0.6, dur: 1.0, ease: ease.move });
  tl.tween(lit, LIT[3], { at: c + 0.6, dur: 1.2, ease: ease.move });
  tl.tween(zoom, 1, { at: c + 2.0, dur: 1.4, ease: ease.move });
  tl.tween(keptGlow, 1, { at: c + 3.0, dur: 0.6, ease: ease.pop });
  tl.tween(plotU, 1, { at: c + 3.6, dur: 1.4, ease: ease.draw });
  tl.tween(reachU, 1, { at: c + 7.6, dur: 0.6, ease: ease.enter });

  // — B4 · the shipped setting —
  c = beat(3);
  tl.tween(cam, CAM_LEDGER, { at: c, dur: 1.3, ease: ease.move });
  fadeOut([plotU, reachU], c);
  tl.tween(fieldOp, 0, { at: c, dur: 0.7, ease: ease.move });
  tl.tween(stageOp, 0, { at: c, dur: 0.7, ease: ease.move });
  tl.tween(stuckU, 0, { at: c, dur: 0.5, ease: ease.move });
  tl.tween(rowDim, 1, { at: c + 0.3, dur: 0.7, ease: ease.move });
  tl.tween(rowFill[4], 1, { at: c + 1.4, dur: 1.0, ease: ease.move });
  tl.tween(rowFill[5], 1, { at: c + 6.4, dur: 1.0, ease: ease.move });

  // — B5 · rare, not zero —
  c = beat(4);
  tl.tween(rowFill[6], 1, { at: c + 0.6, dur: 0.8, ease: ease.move });
  tl.tween(rowFill[7], 1, { at: c + 3.6, dur: 0.8, ease: ease.move });
  tl.tween(rowFill[8], 1, { at: c + 6.0, dur: 0.8, ease: ease.move });
  tl.tween(rareU, 1, { at: c + 8.8, dur: 0.5, ease: ease.pop });

  // — B6 · the field reflows into 200 Story variants —
  c = beat(5);
  tl.tween(cam, CAM_FIELD, { at: c, dur: 1.3, ease: ease.move });
  tl.tween(ledgerOp, 0, { at: c, dur: 0.8, ease: ease.move });
  tl.tween(fieldOp, 1, { at: c + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(lit, 0, { at: c + 0.2, dur: 0.6, ease: ease.move });
  tl.tween(reflow, 1, { at: c + 0.6, dur: 1.5, ease: ease.move });
  tl.tween(fitU, 1, { at: c + 2.6, dur: 1.2, ease: ease.linear });
  tl.tween(ringU, 1, { at: c + 6.4, dur: 0.9, ease: ease.enter });

  // — B7 · a 22 px drag on the Story stage —
  c = beat(6);
  tl.tween(cam, CAM_DRAG, { at: c, dur: 1.3, ease: ease.move });
  tl.tween(fieldOp, 0, { at: c, dur: 0.7, ease: ease.move });
  tl.tween(stageOp, 1, { at: c + 0.2, dur: 0.7, ease: ease.move });
  tl.tween(dragU, 1, { at: c + 1.4, dur: 1.4, ease: ease.move });
  tl.tween(dragNoteU, 1, { at: c + 3.0, dur: 0.7, ease: ease.enter });

  // — B8 · edges on no line —
  c = beat(7);
  tl.tween(cam, HOME, { at: c, dur: 1.3, ease: ease.move });
  tl.tween(dragU, 0, { at: c, dur: 1.0, ease: ease.move });
  tl.tween(dragNoteU, 0, { at: c, dur: 0.6, ease: ease.move });
  tl.tween(fieldOp, 1, { at: c + 0.3, dur: 0.6, ease: ease.move });
  tl.tween(offU, 1, { at: c + 3.6, dur: 1.4, ease: ease.move });
  tl.tween(lateU, 1, { at: c + 6.4, dur: 0.6, ease: ease.enter });
  tl.tween(noLineU, 1, { at: c + 8.6, dur: 0.6, ease: ease.enter });
  tl.tween(webU, 1, { at: c + 9.4, dur: 1.4, ease: ease.draw });

  // — B9 · Story's own edge: the slopes balance —
  c = beat(8);
  tl.tween(cam, CAM_EDGE, { at: c, dur: 1.3, ease: ease.move });
  tl.tween(fieldOp, 0, { at: c, dur: 0.8, ease: ease.move });
  tl.tween(webU, 0.35, { at: c + 0.4, dur: 0.6, ease: ease.move });
  tl.tween(loupeU, 1, { at: c + 0.8, dur: 0.8, ease: ease.enter });
  tl.tween(arrowsU, 1, { at: c + 4.6, dur: 1.4, ease: ease.draw });

  // — B10 · status —
  c = beat(9);
  tl.tween(cam, HOME, { at: c, dur: 1.2, ease: ease.move });
  fadeOut([stageOp, webU, loupeU, arrowsU, noLineU], c);
  tl.tween(statusU, 1, { at: c + 0.6, dur: 0.7, ease: ease.enter });
  tl.tween(chipsU, 3, { at: c + 3.0, dur: 6.0, ease: ease.linear });

  // — B11 · no held-out test —
  c = beat(10);
  tl.tween(heldU, 1, { at: c + 0.3, dur: 0.8, ease: ease.enter });

  // — B12 · recap; end on the four tiles alone —
  c = beat(11);
  tl.tween(boardsOp, 0, { at: c, dur: 0.8, ease: ease.move });
  tl.tween(recapU, 1, { at: c + 0.6, dur: 0.8, ease: ease.enter });
  [1, 2, 3, 4].forEach((n, i) => tl.tween(recapLit, n, { at: c + [1.2, 4.4, 7.4, 10.6][i], dur: 0.5, ease: ease.move }));
  tl.tween(cam, { x: 640, y: 330, k: 1.06 }, { at: c + 0.4, dur: 1.4, ease: ease.move });
  tl.tween(cam, HOME, { at: c + 10.6, dur: 1.6, ease: ease.move });
  tl.hold(t, 1.2);

  return {
    tl, cam, stageU, stageOp, stuckU, probeU, lit, fieldOp, ledgerU, ledgerOp, rowFill, rowDim, zoom, keptGlow,
    plotU, reachU, rareU, reflow, fitU, ringU, dragU, dragNoteU, offU, lateU, noLineU, webU, loupeU, arrowsU,
    statusU, chipsU, heldU, boardsOp, recapU, recapLit,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function Label({ x, y, text, size = 13, color = colors.MUTED, anchor = 'start', mono = false, weight, opacity = 1 }: {
  x: number; y: number; text: string; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; mono?: boolean; weight?: number; opacity?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <text x={x} y={y} fontSize={size} fill={color} textAnchor={anchor} fontFamily={mono ? MONO : undefined} fontWeight={weight} opacity={opacity}>
      {text}
    </text>
  );
}

function Chip({ x, y, text, color, opacity }: { x: number; y: number; text: string; color: string; opacity: number }) {
  if (opacity <= 0.005) return null;
  const w = text.length * 7.9 + 26;
  return (
    <g opacity={opacity}>
      <rect x={x - w / 2} y={y - 15} width={w} height={30} rx={15} fill={colors.PANEL} stroke={color} strokeWidth={1.5} />
      <text x={x} y={y + 4.5} textAnchor="middle" fontSize={13} fontFamily={MONO} fill={color}>
        {text}
      </text>
    </g>
  );
}

function MiniStory({ x, y, w, opacity, photos }: { x: number; y: number; w: number; opacity: number; photos: boolean }) {
  const h = w * 0.8;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={colors.PANEL} stroke={colors.GRID} />
      {STORY.map((r, i) => (
        <g key={i}>
          {photos && <rect x={x + r.left * w} y={y + r.top * h} width={r.width * w} height={r.height * h} rx={1.5} fill={MAGPIE} fillOpacity={0.45} />}
          <rect x={x + r.left * w} y={y + r.top * h} width={r.width * w} height={r.height * h} fill="none" stroke={colors.MUTED} strokeWidth={0.8} strokeDasharray="3 2" />
        </g>
      ))}
    </g>
  );
}

function Arrow({ x1, x2, y, color, width = 3 }: { x1: number; x2: number; y: number; color: string; width?: number }) {
  const dir = Math.sign(x2 - x1) || 1;
  const head = Math.min(9, Math.abs(x2 - x1) * 0.9 + 4);
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - dir * head * 0.6} y2={y} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <path d={`M${x2},${y} L${x2 - dir * head},${y - head * 0.6} L${x2 - dir * head},${y + head * 0.6} Z`} fill={color} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const v = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);

  const stageU = v(scene.stageU);
  const stageOp = v(scene.stageOp);
  const stuckU = v(scene.stuckU);
  const dragU = v(scene.dragU);
  const probeU = v(scene.probeU);
  const lit = v(scene.lit);
  const fieldOp = v(scene.fieldOp);
  const reflow = v(scene.reflow);
  const fitU = v(scene.fitU);
  const ringU = v(scene.ringU);
  const offU = v(scene.offU);
  const lateU = v(scene.lateU);
  const ledgerOp = v(scene.ledgerU) * v(scene.ledgerOp);
  const rowDim = v(scene.rowDim);
  const zoom = v(scene.zoom);
  const max = ZOOM_MAX[0] * Math.pow(ZOOM_MAX[1] / ZOOM_MAX[0], zoom);
  const bx = (pct: number) => L.x + Math.min(1, pct / max) * L.barW;
  const keptGlow = v(scene.keptGlow);
  const plotU = v(scene.plotU);
  const noLineU = v(scene.noLineU);
  const webU = v(scene.webU);
  const loupeU = v(scene.loupeU);
  const arrowsU = v(scene.arrowsU);
  const boardsOp = v(scene.boardsOp);
  const statusU = v(scene.statusU) * boardsOp;
  const chipsU = v(scene.chipsU);
  const heldU = v(scene.heldU) * boardsOp;
  const recapU = v(scene.recapU);
  const recapLit = v(scene.recapLit);

  // the stage's photos: Story as drawn, with the beat-1 stuck edit and the beat-7 drag
  const dragPx = DRAG_PX * dragU;
  const photoLag = clamp01(dragU * 1.25 - 0.25); // the photo follows its rectangle a beat later
  const photoAt = (i: number): R => {
    const r = STORY[i];
    if (i === DRAG_I) {
      const stuck = (6 / STAGE_PX.h) * stuckU; // schematic: 6 px, inside the 0.5–8 px band
      const drag = (DRAG_PX * photoLag) / STAGE_PX.h;
      return { ...r, top: r.top + stuck + drag };
    }
    return r;
  };
  const ghostAt = (i: number): R => (i === DRAG_I ? { ...STORY[i], top: STORY[i].top + dragPx / STAGE_PX.h } : STORY[i]);
  const edgeR = STORY[EDGE_I];
  const edgeY = ry(edgeR);
  const rowTop = ry(STORY[3]);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ================= the Story stage (538 × 430 px) ================= */}
        {stageU > 0.005 && stageOp > 0.005 && (
          <g opacity={stageOp}>
            <rect x={ST.x} y={ST.y} width={ST.w} height={STH} rx={4} fill={colors.PANEL} stroke={colors.GRID} opacity={stageU} />
            <Label x={ST.x} y={ST.y - 12} text="Story · stage 538 × 430 px" opacity={stageU} />
            {STORY.map((_, i) => {
              const u = clamp01(stageU * 1.6 - i * 0.06);
              const p = photoAt(i);
              const g = ghostAt(i);
              return (
                <g key={i} opacity={u}>
                  <rect x={rx(p)} y={ry(p)} width={rw(p)} height={rh(p)} rx={2} fill={MAGPIE} fillOpacity={0.42} stroke={MAGPIE} strokeWidth={1} />
                  <rect x={rx(g)} y={ry(g)} width={rw(g)} height={rh(g)} fill="none" stroke={colors.TEXT} strokeOpacity={0.55} strokeWidth={1} strokeDasharray="4 3" />
                </g>
              );
            })}
            {/* beat 1: one stuck edit — two tops 6 px apart */}
            {stuckU > 0.005 && (
              <g opacity={stuckU}>
                <line x1={rx(STORY[3])} y1={rowTop} x2={rx(STORY[4]) + rw(STORY[4])} y2={rowTop} stroke={colors.NEGATIVE} strokeWidth={1.2} strokeDasharray="3 3" />
                <line x1={rx(STORY[4])} y1={ry(photoAt(4))} x2={rx(STORY[4]) + rw(STORY[4])} y2={ry(photoAt(4))} stroke={colors.NEGATIVE} strokeWidth={2} />
                <line x1={rx(STORY[3])} y1={rowTop} x2={rx(STORY[3]) + rw(STORY[3])} y2={rowTop} stroke={colors.NEGATIVE} strokeWidth={2} />
                <circle cx={rx(STORY[4]) - 4} cy={(rowTop + ry(photoAt(4))) / 2} r={11} fill="none" stroke="#ffffff" strokeWidth={1.5} />
                <Label x={ST.x + 4} y={ST.y + STH + 22} text="stuck: two edges 0.5–8 px apart" size={13} color={colors.NEGATIVE} />
                <Label x={ST.x + 4} y={ST.y + STH + 40} text="one stuck edit, drawn 6 px (schematic)" size={12} />
              </g>
            )}
            {/* beat 7: the 22 px drag */}
            {dragU > 0.005 && (
              <g>
                <line x1={ST.x} y1={rowTop} x2={ST.x + ST.w} y2={rowTop} stroke={colors.WARM} strokeWidth={1} strokeDasharray="5 4" opacity={0.8} />
                <line x1={rx(STORY[DRAG_I]) + rw(STORY[DRAG_I]) + 8} y1={rowTop} x2={rx(STORY[DRAG_I]) + rw(STORY[DRAG_I]) + 8} y2={rowTop + dragPx * SPX} stroke={colors.WARM} strokeWidth={2} />
              </g>
            )}
            <g opacity={v(scene.dragNoteU)}>
              <Label x={ST.x} y={ST.y + STH + 22} text={`drag ${DRAG_PX} px > hold 0.04 × 538 = ${HOLD_PX.toFixed(1)} px`} size={13} color={colors.WARM} mono />
              <rect x={ST.x} y={ST.y + STH + 34} width={ST.w} height={10} rx={3} fill={FAINT} />
              <rect x={ST.x} y={ST.y + STH + 34} width={ST.w * DRAG_SHARE * clamp01(v(scene.dragNoteU) * 1.4 - 0.2)} height={10} rx={3} fill={MAGPIE} />
              <Label x={ST.x} y={ST.y + STH + 64} text="151 of 180 edits (22 px): off every line" size={13} color={colors.TEXT} />
              <Label x={ST.x} y={ST.y + STH + 84} text="median 0.12 px · worst 2.3 px from the rectangle" size={13} color={colors.TEXT} />
            </g>
            {/* beat 8: the edge on no line */}
            {noLineU > 0.005 && (
              <g opacity={noLineU}>
                <line x1={rx(edgeR)} y1={edgeY} x2={rx(edgeR) + rw(edgeR)} y2={edgeY} stroke={colors.WARM} strokeWidth={3} />
                <Label x={rx(edgeR) + rw(edgeR) / 2} y={edgeY - 8} text="on no line" size={12} color={colors.WARM} anchor="middle" />
              </g>
            )}
          </g>
        )}

        {/* ================= the field: 960 probe edits → 200 Story variants ================= */}
        {fieldOp > 0.005 && probeU > 0.005 && (
          <g opacity={fieldOp}>
            <g opacity={clamp01(1 - reflow * 2)}>
              <Label x={F.x} y={F.y - 26} text={`probe · ${PROBE_SESSIONS} sessions × ${PROBE_EDITS} small edits = ${PROBE_N}`} size={14} color={colors.TEXT} />
              <Label x={F.x} y={F.y - 9} text="one cell per edit · lit = stuck · placement schematic" size={12} />
              <Label x={F.x + FIELD_W} y={F.y + PROBE_SESSIONS * P_PITCH + 16} text={`${Math.round(lit)} of ${PROBE_N} lit`} size={13} color={colors.NEGATIVE} anchor="end" mono opacity={clamp01(lit)} />
            </g>
            <g opacity={clamp01(reflow * 2 - 1)}>
              <Label x={F.x} y={F.y - 26} text="200 Story variants · fitted from the seeded weights" size={14} color={colors.TEXT} />
              <Label x={F.x} y={F.y - 9} text="one dot per variant · order schematic" size={12} />
            </g>
            {Array.from({ length: PROBE_N }, (_, i) => {
              const appear = clamp01(probeU * 1.3 - (Math.floor(i / PROBE_EDITS) / PROBE_SESSIONS) * 0.3);
              if (appear <= 0.005) return null;
              const litU = clamp01(lit - RANK[i]);
              const a = probePos(i);
              if (i >= VARIANTS) {
                const op = appear * (1 - clamp01(reflow * 2));
                if (op <= 0.005) return null;
                return <rect key={i} x={a.x - P_CELL / 2} y={a.y - P_CELL / 2} width={P_CELL} height={P_CELL} rx={1} fill={litU > 0.5 ? colors.NEGATIVE : FAINT} opacity={op} />;
              }
              const b = varPos(i);
              const off = OFF.has(i) ? offU : 0;
              const o = offPos(OFF_LIST.indexOf(i));
              const x = lerp(lerp(a.x, b.x, reflow), o.x, off);
              const y = lerp(lerp(a.y, b.y, reflow), o.y, off);
              const size = lerp(P_CELL, V_R * 2, reflow);
              const fitted = clamp01(fitU * 1.2 - (i / VARIANTS) * 0.2);
              const fill = off > 0.5 ? colors.WARM : litU > 0.5 ? colors.NEGATIVE : fitted > 0.5 ? colors.POSITIVE : FAINT;
              const ring = RINGED.has(i) ? ringU * (OFF.has(i) && off > 0.5 ? lateU : 1) : 0;
              return (
                <g key={i} opacity={appear}>
                  <rect x={x - size / 2} y={y - size / 2} width={size} height={size} rx={lerp(1, size / 2, reflow)} fill={fill} />
                  {ring > 0.01 && <circle cx={x} cy={y} r={V_R + 3} fill="none" stroke={colors.TEXT} strokeWidth={1.4} opacity={ring * (off > 0.5 || offU < 0.01 ? 1 : 0.4)} />}
                </g>
              );
            })}
            <g opacity={fitU * reflow * (1 - clamp01(webU * 2))}>
              <Label x={F.x} y={F.y + 14 + 10 * V_PITCH + 18} text="green: every line within 0.15 px when training stops" size={13} color={colors.POSITIVE} />
            </g>
            <g opacity={ringU * reflow * (1 - clamp01(webU * 2))}>
              <Label x={F.x} y={F.y + 14 + 10 * V_PITCH + 36} text="ringed: 26 train all 2,000 steps" size={13} color={colors.TEXT} />
            </g>
            <g opacity={offU}>
              <Label x={OFF_X - 14} y={F.y - 26} text="12 of 200 variants" size={14} color={colors.WARM} />
              <Label x={OFF_X - 14} y={F.y - 9} text="an edge on no line, 2–4 px off" size={13} color={colors.WARM} />
              <Label x={OFF_X + 22} y={F.y + 30 + 2 * 22 + 5} text="ringed: these 5 stop" size={13} color={colors.TEXT} opacity={lateU} />
              <Label x={OFF_X + 22} y={F.y + 30 + 2 * 22 + 23} text="after all 2,000 steps" size={13} color={colors.TEXT} opacity={lateU} />
            </g>
          </g>
        )}

        {/* ================= the ledger: share of edits stuck ================= */}
        {ledgerOp > 0.005 && (
          <g opacity={ledgerOp}>
            <Label x={L.x} y={L.y - 34} text="share of edits stuck (538 px stage)" size={14} color={colors.TEXT} />
            {[[0, 40, 80], [0, 1, 2, 3]].map((ticks, k) => {
              const op = k === 0 ? 1 - zoom : zoom;
              if (op <= 0.01) return null;
              return (
                <g key={k} opacity={op}>
                  {ticks.map((tk) => {
                    if (tk > max * 1.001) return null;
                    const x = bx(tk);
                    return (
                      <g key={tk}>
                        <line x1={x} y1={L.y - 14} x2={x} y2={L.y - 8} stroke={colors.MUTED} />
                        <text x={x} y={L.y - 18} fontSize={12} textAnchor="middle" fill={colors.MUTED} fontFamily={MONO}>{`${tk}%`}</text>
                      </g>
                    );
                  })}
                </g>
              );
            })}
            <line x1={L.x} y1={L.y - 8} x2={L.x + L.barW} y2={L.y - 8} stroke={colors.MUTED} strokeOpacity={0.6} />
            {LEDGER_ROWS.map((row, i) => {
              const fill = v(scene.rowFill[i]);
              if (fill <= 0.005) return null;
              const y = rowY(i);
              const dim = i < 4 ? lerp(1, i === 3 ? 0.4 : 0.15, rowDim) : 1;
              const glow = i === 3 ? keptGlow : 0;
              const top = row.values[row.values.length - 1];
              const over = top > max;
              return (
                <g key={i} opacity={dim * clamp01(fill * 3)}>
                  <text x={L.x} y={y + 9} fontSize={13} fill={i === 3 && glow > 0.5 ? MAGPIE : colors.TEXT} fontWeight={i === 3 ? 650 : 400}>
                    {row.label}
                  </text>
                  {glow > 0.01 && <rect x={L.x - 6} y={y - 6} width={L.barW + 90} height={36} rx={6} fill="none" stroke={MAGPIE} strokeWidth={1.5} opacity={glow} />}
                  {row.values.map((val, k) => {
                    const h = row.values.length > 1 ? 5 : 10;
                    const yy = y + 15 + k * (h + 2);
                    return <rect key={k} x={L.x} y={yy} width={Math.max(val > 0 ? 2 : 0, (bx(val) - L.x) * fill)} height={h} rx={2} fill={row.color} />;
                  })}
                  {row.values[0] === 0 && <circle cx={L.x + 3} cy={y + 20} r={3} fill="none" stroke={row.color} strokeWidth={1.5} />}
                  {'whisker' in row && row.whisker && fill > 0.95 && (
                    <g stroke={colors.TEXT} strokeWidth={1.5}>
                      <line x1={bx(row.whisker[0])} y1={y + 20} x2={bx(row.whisker[1])} y2={y + 20} />
                      <line x1={bx(row.whisker[0])} y1={y + 15} x2={bx(row.whisker[0])} y2={y + 25} />
                      <line x1={bx(row.whisker[1])} y1={y + 15} x2={bx(row.whisker[1])} y2={y + 25} />
                    </g>
                  )}
                  {over && <path d={`M${L.x + L.barW + 2},${y + 14} l7,6 l-7,6 Z`} fill={row.color} />}
                  <text x={over ? L.x + L.barW + 14 : Math.max(bx(top), 'whisker' in row && row.whisker ? bx(row.whisker[1]) : 0) + 8} y={y + 25} fontSize={13} fontFamily={MONO} fill={colors.TEXT} opacity={clamp01(fill * 2 - 1)}>
                    {'text' in row && row.text
                      ? row.text
                      : row.values.length > 1
                        ? row.values.map(fmtPct).join(' · ')
                        : 'whisker' in row && row.whisker
                          ? `${fmtPct(top)} (${row.whisker[0]}–${row.whisker[1]}%)`
                          : fmtPct(top)}
                  </text>
                </g>
              );
            })}
            <g opacity={v(scene.rareU)}>
              <rect x={L.x + 200} y={rowY(7) + 4} width={150} height={30} rx={15} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.5} />
              <text x={L.x + 275} y={rowY(7) + 24} fontSize={14} textAnchor="middle" fill={colors.WARM} fontWeight={650}>
                rare, not zero
              </text>
            </g>
          </g>
        )}

        {/* ================= beat 3: the kept pull, pairPull ================= */}
        {plotU > 0.005 && (
          <g opacity={clamp01(plotU * 2)}>
            <line x1={PP.x} y1={PP.y + PP.h} x2={PP.x + PP.w} y2={PP.y + PP.h} stroke={colors.MUTED} />
            <line x1={PP.x} y1={PP.y + PP.h} x2={PP.x} y2={PP.y - 4} stroke={colors.MUTED} />
            <Label x={PP.x + PP.w + 6} y={PP.y + PP.h + 4} text="gap" size={12} />
            <Label x={ppx(1)} y={PP.y + PP.h + 17} text="1 reach" size={12} anchor="middle" />
            <Label x={PP.x - 8} y={PP.y + 4} text="pull" size={12} anchor="end" />
            <path d={OLD_LIMIT_PATH} fill="none" stroke={colors.MUTED} strokeWidth={1.5} strokeDasharray="2 4" opacity={0.6 * plotU} />
            <path d={LIMIT_PATH} fill="none" stroke={MAGPIE} strokeWidth={2} strokeDasharray="6 4" pathLength={1} strokeDashoffset={0} opacity={plotU} />
            <path d={PULL0_PATH} fill="none" stroke={colors.TEXT} strokeWidth={2.5} pathLength={1} strokeDasharray={`${plotU} 1`} />
            <path d={PULL5_PATH} fill="none" stroke={colors.SECONDARY} strokeWidth={2} pathLength={1} strokeDasharray={`${plotU} 1`} />
            <Label x={PP.x + PP.w + 14} y={PP.y + 10} text="pairPull(gap, m, reach)" size={13} color={colors.TEXT} mono />
            <Label x={PP.x + PP.w + 14} y={PP.y + 30} text="limit = reach − gap" size={13} color={MAGPIE} mono />
            <Label x={PP.x + PP.w + 14} y={PP.y + 50} text="m = 0" size={13} color={colors.TEXT} mono />
            <Label x={PP.x + PP.w + 14} y={PP.y + 70} text="m = 0.5 · reach" size={13} color={colors.SECONDARY} mono />
            <Label x={PP.x + PP.w + 14} y={PP.y + 90} text="old limit (schematic)" size={12} />
          </g>
        )}
        <g opacity={v(scene.reachU)}>
          <Label x={PP.x - 50} y={PP.y - 14} text={`probe reach 8 px / 538 px = ${PROBE_REACH_PCT.toFixed(1)}% · shipped reach ${SHIPPED_REACH * 100}%`} size={13} color={colors.WARM} mono />
        </g>

        {/* ================= beats 8–9: the shared weights ================= */}
        {webU > 0.005 && (
          <g>
            <g opacity={Math.min(1, webU * 1.5) * 0.5}>
              {STORY.map((r, i) => {
                const sx = rx(r) + rw(r) / 2;
                const sy = ry(r) + (i === EDGE_I ? 0 : rh(r) / 2);
                return <line key={i} x1={sx} y1={sy} x2={lerp(sx, WG.x + WG_W / 2, clamp01(webU * 1.3))} y2={lerp(sy, WG.y + WG_H / 2, clamp01(webU * 1.3))} stroke={i === EDGE_I ? colors.WARM : colors.MUTED} strokeWidth={i === EDGE_I ? 2 : 1} />;
              })}
            </g>
            <g opacity={Math.min(1, webU * 1.4)}>
              {Array.from({ length: W_N }, (_, i) => {
                const p = wPos(i);
                return <rect key={i} x={p.x} y={p.y} width={WG.cell} height={WG.cell} rx={1.5} fill={MAGPIE} opacity={0.35 + 0.4 * ((i * 53) % 7) / 7} />;
              })}
              <Label x={WG.x} y={WG.y - 10} text="244 weights · shared by every edge" size={13} color={colors.TEXT} />
            </g>
          </g>
        )}
        {loupeU > 0.005 && (
          <g opacity={loupeU}>
            <line x1={rx(edgeR) + rw(edgeR) * 0.7} y1={edgeY} x2={LOUPE.x - LOUPE.r * 0.7} y2={LOUPE.y + LOUPE.r * 0.7} stroke="#ffffff" strokeWidth={1.2} />
            <circle cx={rx(edgeR) + rw(edgeR) * 0.7} cy={edgeY} r={6} fill="none" stroke="#ffffff" strokeWidth={1.5} />
            <circle cx={LOUPE.x} cy={LOUPE.y} r={LOUPE.r} fill={colors.PANEL} stroke="#ffffff" strokeWidth={2} />
            <line x1={LOUPE.x - LOUPE.r + 12} y1={LOUPE.y - (EDGE_OFF_PX * LOUPE.mag) / 2} x2={LOUPE.x + LOUPE.r - 12} y2={LOUPE.y - (EDGE_OFF_PX * LOUPE.mag) / 2} stroke={colors.TEXT} strokeWidth={1.5} strokeDasharray="5 4" />
            <rect x={LOUPE.x - LOUPE.r + 18} y={LOUPE.y + (EDGE_OFF_PX * LOUPE.mag) / 2} width={LOUPE.r * 2 - 36} height={LOUPE.r * 0.6} fill={MAGPIE} fillOpacity={0.45} />
            <line x1={LOUPE.x - LOUPE.r + 18} y1={LOUPE.y + (EDGE_OFF_PX * LOUPE.mag) / 2} x2={LOUPE.x + LOUPE.r - 18} y2={LOUPE.y + (EDGE_OFF_PX * LOUPE.mag) / 2} stroke={colors.WARM} strokeWidth={2.5} />
            <Label x={LOUPE.x} y={LOUPE.y - 22} text="drawn" size={12} anchor="middle" />
            <Label x={LOUPE.x + LOUPE.r + 12} y={LOUPE.y - 4} text={`rests ${EDGE_OFF_PX} px off`} size={14} color={colors.WARM} weight={650} />
            <Label x={LOUPE.x + LOUPE.r + 12} y={LOUPE.y + 14} text={`538 × 430 stage · ×${LOUPE.mag}`} size={12} />
          </g>
        )}
        {arrowsU > 0.005 && (() => {
          const ax = WG.x + WG_W + 30;
          const len = 210;
          const own = len * clamp01(arrowsU * 1.5);
          const back = len * (1 - GRAD_TOTAL / GRAD_OWN) * clamp01(arrowsU * 1.5 - 0.5);
          const net = (len * GRAD_TOTAL) / GRAD_OWN;
          const yb = WG.y + 20;
          return (
            <g opacity={loupeU}>
              <Arrow x1={ax} x2={ax + own} y={yb} color={colors.WARM} />
              <Label x={ax} y={yb - 12} text={`this edge's error · ${GRAD_OWN.toExponential(1)}`} size={13} color={colors.WARM} mono />
              {back > 1 && <Arrow x1={ax + len} x2={ax + len - back} y={yb + 34} color={colors.MUTED} />}
              <Label x={ax + len} y={yb + 56} text="the other edges" size={13} anchor="end" opacity={clamp01(arrowsU * 2 - 1)} />
              <g opacity={clamp01(arrowsU * 2 - 1)}>
                <Arrow x1={ax} x2={ax + Math.max(net, 4)} y={yb + 82} color={colors.TEXT} width={2.5} />
                <Label x={ax + 16} y={yb + 87} text={`total ${GRAD_TOTAL.toExponential(1)} · ${GRAD_RATIO}× smaller`} size={13} color={colors.TEXT} mono />
                <Label x={ax} y={yb + 110} text="traced on 620 × 496" size={12} />
                <Label x={ax} y={yb + 126} text="lengths to scale · direction schematic" size={12} />
              </g>
            </g>
          );
        })()}

        {/* ================= beats 10–11: the status board ================= */}
        {statusU > 0.005 && (
          <g opacity={statusU}>
            <rect x={CARD.x} y={110} width={CARD.w} height={170} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <rect x={CARD.x} y={110} width={5} height={170} rx={2} fill={MAGPIE} />
            <Label x={CARD.x + 30} y={152} text="Status: current" size={26} color={colors.TEXT} weight={650} />
            <Chip x={CARD.x + 420} y={143} text="current · limits open" color={colors.WARM} opacity={1} />
            <Chip x={CARD.x + 120} y={215} text="41 tests pass" color={colors.POSITIVE} opacity={clamp01(chipsU)} />
            <Chip x={CARD.x + 330} y={215} text="scripts not in repo" color={colors.WARM} opacity={clamp01(chipsU - 1)} />
            <Chip x={CARD.x + 340} y={256} text="describes the page as of Oct 14, 2026" color={colors.MUTED} opacity={clamp01(chipsU - 2)} />
          </g>
        )}
        {heldU > 0.005 && (
          <g opacity={heldU}>
            <rect x={CARD.x} y={300} width={CARD.w} height={300} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <rect x={CARD.x} y={300} width={5} height={300} rx={2} fill={colors.WARM} />
            <Label x={CARD.x + 30} y={340} text="No held-out test" size={24} color={colors.WARM} weight={650} />
            <Label x={CARD.x + 30} y={368} text="lab/status.md:203" size={12} mono />
            <Label x={CARD.x + 30} y={390} text="“No held-out test: the network is fitted to one sketch at a time.”" size={14} color={colors.TEXT} />
            <MiniStory x={CARD.x + 90} y={420} w={170} opacity={1} photos />
            <Label x={CARD.x + 175} y={578} text="fitted: this sketch" size={13} color={colors.TEXT} anchor="middle" />
            <rect x={CARD.x + 420} y={420} width={170} height={136} rx={3} fill="none" stroke={colors.MUTED} strokeDasharray="6 5" />
            <text x={CARD.x + 505} y={503} fontSize={44} textAnchor="middle" fill={colors.MUTED}>
              ?
            </text>
            <Label x={CARD.x + 505} y={578} text="a sketch it never saw" size={13} color={colors.MUTED} anchor="middle" />
          </g>
        )}

        {/* ================= beat 12: the recap strip ================= */}
        {recapU > 0.005 && (
          <g opacity={recapU}>
            <Label x={640} y={RC.y - 40} text="Learned Gallery, in four tiles" size={18} color={colors.TEXT} anchor="middle" weight={650} />
            {RECAP.map((r, i) => {
              const on = clamp01(recapLit - i);
              const x = rcX(i);
              return (
                <g key={i} opacity={lerp(0.15, 1, on)}>
                  <rect x={x} y={RC.y} width={RC.w} height={RC.h} rx={10} fill={colors.PANEL} stroke={r.color} strokeWidth={lerp(1, 2, on)} />
                  <Label x={x + RC.w / 2} y={RC.y + 52} text={r.title} size={16} color={colors.TEXT} anchor="middle" weight={650} />
                  <Label x={x + RC.w / 2} y={RC.y + 78} text={r.sub} size={13} color={r.color} anchor="middle" />
                </g>
              );
            })}
            <g opacity={clamp01(recapLit - 3)}>
              <Label x={640} y={RC.y + RC.h + 50} text="alignment: learned, and mostly holds" size={15} color={MAGPIE} anchor="middle" />
            </g>
            <MiniStory x={565} y={RC.y + RC.h + 76} w={150} opacity={0.15 + 0.35 * clamp01(recapLit - 3)} photos />
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
