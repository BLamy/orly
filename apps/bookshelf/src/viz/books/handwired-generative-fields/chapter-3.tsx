// The Path Between
//
// Generative Fields — chapter 3. Source pin: chenglou/handwired@4ea7fcb27ebe93acf49b9f29a93e162b975bad46 (MIT).
//   lab/generative-fields/README.md:5-9 (September corrections: July tables are not promises; the historical validBit
//     permits hiding, a wrap allowance and 0.5 px slack; 1,408 of 4,154 July repairs hid items, one 16 → 6; samples do
//     not establish smooth motion), 84-98 (the study table and the hero migration), 135-139 (next steps)
//   lab/generative-fields/fields.ts:102-108 (defaultContext), 163-170 (interpolateFields), 226-236 (uniformSlots),
//     239-293 (grid and list families), 301-312 (heroMigrationPair)
//   lab/generative-fields/oracle.ts:41-198 (the float64 flow layout and validity checks, ported below)
//   lab/generative-fields/interpolation.ts:32-80 (walkPath), lab/generative-fields/experiments.ts:35-73 (studyConfig,
//     buildStudyPairs: 10 authored-authored pairs + 50 seeded pairs, 101 samples, projection 40 / 0.02 / 0.05)
//   lab/generative-fields/interpolation.test.ts:11-78 (1906 valid, 4154 repaired, 0 failed, 6060; categories 0/4154/0;
//     hero areas and the midpoint row tops 111.52 and 413.92)
//   lab/generative-fields/optimize.ts:212-248 (projectToValidity: stop at validBit == 1, proximal pull)
//   lab/generative-fields/content-audit.ts:4-29 (auditContent: requiredContentRetained, strictlyContained)
//   lab/status.md:201 (no status tag; the limit quoted on the ledger)
//
// Authored by Claude Opus 5.5 (claude-opus-5-5) from the Sonnet 5.5 visual plan.
//
// Computed here, at module scope: the hero migration (21 frames) and the naive grid → list path (101 points) are a
// line-for-line port of oracle.ts over the lab's own field vectors, rounded to FP32 like buildSource; the module
// throws if the port disagrees with the printed run (areas 129,064 / 66,443 / 24,191, row tops 111.52 / 413.92) or
// with the study's validity row for this pair.
// Embedded from a scratch run of the pinned code (.orly-work/hw-books/handwired-generative-fields/ch3/dump*.ts, which
// calls walkPath, projectToValidity and auditContent unchanged): the 60 × 101 naive validity wall (it sums to the
// tested 1906 and has the one fully valid path), the four-step projection of the grid → list point at t = 0.20, and
// the repaired layouts at t = 0.40 … 0.47. Only the July figures (1,408; one 16 → 6) are quoted from the README;
// the 16 → 6 repair drawn on screen is today's code on this one path, and is labelled so.
// Plan changes: the 21 mini viewports of beat 1 became one viewport stepping through the 21 frames beside an area
// chart computed from the oracle; the plan's single "fails both" tick does not occur on this path, so the audit
// shows two real repaired points that each fail one report (the caption's "can fail both" stays the README's claim).
// The scratch recount (1,406) is omitted, as the review asks.
import { CAMERA_HOME, Camera, STAGE_W, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
const MONO = colors.font.mono;
const UI = colors.font.ui;
const CH13 = 7.83; // mono advance at 13 px
const CH14 = 8.43; // mono advance at 14 px
const fmtInt = (v: number): string => Math.round(v).toLocaleString('en-US');
const f32 = Math.fround;

// ---------------------------------------------------------------------------
// The lab's fields and its float64 oracle (fields.ts, oracle.ts), at module scope
// ---------------------------------------------------------------------------

const SLOTS = 16;
const CTX = { viewportWidth: 1280, viewportHeight: 800, wrapSlack: f32(0.004), minVisibleWidth: 48, minVisibleHeight: 32 };
type SlotIn = { importance: number; orderKey: number; visibility: number; heightPreference: number };
type FieldVec = {
  paddingX: number; paddingY: number; gapX: number; gapY: number;
  baseSpan: number; spanFromImportance: number; baseHeight: number; heightFromImportance: number;
  slots: SlotIn[];
};
/** fields.ts:226-236 */
const uniformSlots = (per: (slot: number) => Partial<SlotIn>): SlotIn[] =>
  Array.from({ length: SLOTS }, (_, slot) => ({
    importance: per(slot).importance ?? 0.2,
    orderKey: (slot + 0.5) / SLOTS,
    visibility: per(slot).visibility ?? 1,
    heightPreference: per(slot).heightPreference ?? 0.5,
  }));
const GRID: FieldVec = {
  paddingX: 24, paddingY: 24, gapX: 0.015, gapY: 14,
  baseSpan: 0.235, spanFromImportance: 0, baseHeight: 177, heightFromImportance: 0,
  slots: uniformSlots(() => ({})),
};
const LIST: FieldVec = {
  paddingX: 40, paddingY: 24, gapX: 0.01, gapY: 12,
  baseSpan: 1, spanFromImportance: 0, baseHeight: 110, heightFromImportance: 0,
  slots: uniformSlots((slot) => ({ importance: 0.3, visibility: slot < 6 ? 1 : 0 })),
};
const withHero = (heroSlot: number): FieldVec => ({
  paddingX: 24, paddingY: 24, gapX: 0.015, gapY: 12,
  baseSpan: 0.2, spanFromImportance: 0.5, baseHeight: 64, heightFromImportance: 96,
  slots: uniformSlots((slot) => ({ importance: slot === heroSlot ? 0.95 : 0.12 })),
});
const HERO_A = withHero(2);
const HERO_B = withHero(11);

/** interpolateFields, then buildSource's Float32 store */
function mix(a: FieldVec, b: FieldVec, t: number): FieldVec {
  const m = (x: number, y: number) => f32(x + (y - x) * t);
  return {
    paddingX: m(a.paddingX, b.paddingX), paddingY: m(a.paddingY, b.paddingY), gapX: m(a.gapX, b.gapX), gapY: m(a.gapY, b.gapY),
    baseSpan: m(a.baseSpan, b.baseSpan), spanFromImportance: m(a.spanFromImportance, b.spanFromImportance),
    baseHeight: m(a.baseHeight, b.baseHeight), heightFromImportance: m(a.heightFromImportance, b.heightFromImportance),
    slots: a.slots.map((s, i) => ({
      importance: m(s.importance, b.slots[i].importance),
      orderKey: m(s.orderKey, b.slots[i].orderKey),
      visibility: m(s.visibility, b.slots[i].visibility),
      heightPreference: m(s.heightPreference, b.slots[i].heightPreference),
    })),
  };
}

type Box = [x: number, y: number, w: number, h: number] | null; // null = hidden
type Layout = { geo: Box[]; valid: boolean; depth: number; bottom: number; paddingY: number; contain: number; overlap: number; size: number };

/** oracle.ts:41-198, float64 */
function oracle(f: FieldVec): Layout {
  const visible = f.slots.map((s) => s.visibility >= 0.5);
  const spans = f.slots.map((s) => Math.min(1, f.baseSpan + f.spanFromImportance * s.importance));
  const heights = f.slots.map((s) => (f.baseHeight + f.heightFromImportance * s.importance) * (0.5 + s.heightPreference));
  const ranks = f.slots.map((s, slot) => {
    let rank = 0;
    for (let other = 0; other < SLOTS; other++) {
      if (other === slot || !visible[other]) continue;
      const k = f.slots[other].orderKey;
      if (other < slot ? k <= s.orderKey : k < s.orderKey) rank++;
    }
    return rank;
  });
  const at = Array<number>(SLOTS).fill(-1);
  ranks.forEach((r, slot) => { if (visible[slot]) at[r] = slot; });
  const geo: Box[] = Array.from({ length: SLOTS }, () => null);
  const innerWidth = Math.max(0, CTX.viewportWidth - 2 * f.paddingX);
  let cursor = 0;
  let rowTop = f.paddingY;
  let rowBottom = f.paddingY;
  for (let p = 0; p < SLOTS; p++) {
    const slot = at[p];
    if (slot < 0) break;
    const wrap = cursor + spans[slot] >= 1 + CTX.wrapSlack;
    const x = wrap ? 0 : cursor;
    const top = wrap ? rowBottom + f.gapY : rowTop;
    const bc = top + heights[slot];
    rowBottom = wrap ? bc : Math.max(rowBottom, bc);
    rowTop = top;
    geo[slot] = [f.paddingX + innerWidth * x, top, innerWidth * spans[slot], heights[slot]];
    cursor = x + spans[slot] + f.gapX;
  }
  const slack = 0.5;
  let depth = 0;
  let overlap = 0;
  let contain = 0;
  let size = 0;
  const check = (d: number) => { depth += d; return d >= slack; };
  for (let i = 0; i < SLOTS; i++) for (let j = i + 1; j < SLOTS; j++) {
    const a = geo[i];
    const b = geo[j];
    const d = a && b ? Math.max(0, Math.min(Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]), Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]))) : 0;
    if (check(d)) overlap++;
  }
  const bottomLimit = CTX.viewportHeight - f.paddingY;
  const rightLimit = f.paddingX + innerWidth + innerWidth * CTX.wrapSlack;
  geo.forEach((g) => {
    if (check(g ? Math.max(0, g[1] + g[3] - bottomLimit) : 0)) contain++;
    if (check(g ? Math.max(0, g[0] + g[2] - rightLimit) : 0)) contain++;
  });
  geo.forEach((g, slot) => {
    if (check(g ? Math.max(0, CTX.minVisibleWidth - innerWidth * spans[slot]) : 0)) size++;
    if (check(g ? Math.max(0, CTX.minVisibleHeight - heights[slot]) : 0)) size++;
  });
  const bottom = Math.max(0, ...geo.map((g) => (g ? g[1] + g[3] : 0)));
  return { geo, valid: overlap + contain + size === 0, depth, bottom, paddingY: f.paddingY, contain, overlap, size };
}

const area = (b: Box): number => (b ? b[2] * b[3] : 0);
const HERO = Array.from({ length: 21 }, (_, i) => oracle(mix(HERO_A, HERO_B, i / 20)));
const HERO_A2 = HERO.map((l) => area(l.geo[2]));
const HERO_A11 = HERO.map((l) => area(l.geo[11]));
const PATH = Array.from({ length: 101 }, (_, k) => oracle(mix(GRID, LIST, k / 100)));

// ---------------------------------------------------------------------------
// Embedded from the pinned code (scratch run; see the header)
// ---------------------------------------------------------------------------

/** naive validity of the study's 60 paths × 101 points, run-length (+ valid, − invalid); row 2 is grid → list */
const WALL_RLE = [
  '+6-74+21', '+30-45+26', '+1-92+8', '+1-99+1', '+101', '+7-44+50', '+3-97+1', '+4-47+50', '+2-98+1', '+2-98+1',
  '+70-19+12', '+1-99+1', '+17-82+2', '+23-72+6', '+9-47+2-6+6-30+1', '+13-4+6-27+7-1+16-21+6', '+2-96+3',
  '+8-11+23-45+14', '+5-8+22-1+39-21+5', '+5-31+2-62+1', '+2-2+30-2+23-7+1-22+12', '+49-6+26-14+6', '+2-84+15',
  '+3-92+6', '+4-24+4-12+6-12+20-12+7', '+42-14+4-2+39', '+1-92+8', '+5-8+22-1+39-21+5', '+3-1+45-6+4-25+17',
  '+7-34+8-51+1', '+6-4+3-50+6-31+1', '+2-96+3', '+5-31+2-62+1', '+7-12+20-12+6-12+4-24+4', '+9-77+2-7+6',
  '+3-95+3', '+7-43+3-40+8', '+77-8+16', '+24-65+2-9+1', '+2-5+72-20+2', '+3-74+24', '+4-95+2', '+24-20+5-40+12',
  '+2-96+3', '+6-49+6-5+4-5+7-17+2', '+2-94+5', '+1-99+1', '+1-98+2', '+3-96+2', '+13-37+21-26+4', '+13-42+21-9+16',
  '+5-95+1', '+1-30+1-64+5', '+8-56+2-23+12', '+18-52+4-5+7-13+2', '+1-99+1', '+1-46+3-5+2-17+27', '+2-90+9',
  '+2-10+76-3+10', '+49-6+26-14+6',
];
type Run = { from: number; len: number; ok: boolean };
const WALL: Run[][] = WALL_RLE.map((r) => {
  let at = 0;
  return (r.match(/[+-]\d+/g) ?? []).map((tok) => {
    const run = { from: at, len: Number(tok.slice(1)), ok: tok[0] === '+' };
    at += run.len;
    return run;
  });
});
const ROW_GL = 2; // grid → list
const ROW_FULL = 4; // heroRail → mosaic, the one fully valid naive path
const parseGeo = (s: string): Box[] =>
  s.split(' ').map((g) => (g === '-' ? null : (g.split(',').map(Number) as [number, number, number, number])));
/** projectToValidity at t = 0.20 with maxSteps 0…4: [step, violationDepth, contentBottom, paddingY, layout] */
const TRAJ: { step: number; depth: number; bottom: number; paddingY: number; geo: Box[] }[] = ([
  [0, 3089.6, 1428, 24, '27,24,476,164 520,24,476,164 27,201,476,164 520,201,476,164 27,378,476,164 520,378,476,164 27,556,476,164 520,556,476,164 27,733,476,164 520,733,476,164 27,910,476,164 520,910,476,164 27,1087,476,164 520,1087,476,164 27,1264,476,164 520,1264,476,164'],
  [1, 2214.7, 1293.9, 21.6, '27,22,452,150 495,22,452,147 27,184,452,150 495,184,452,147 27,346,452,150 495,346,452,147 27,508,452,150 495,508,452,147 27,670,452,147 495,670,452,147 27,829,452,147 495,829,452,147 27,988,452,147 495,988,452,147 27,1147,452,147 495,1147,452,147'],
  [2, 1389.6, 1153.9, 19.2, '27,19,429,134 470,19,429,131 27,164,429,134 470,164,429,131 27,309,429,134 470,309,429,131 27,454,429,134 470,454,429,131 27,599,429,130 470,599,429,130 27,741,429,130 470,741,429,130 27,882,429,130 470,882,429,130 27,1024,429,130 470,1024,429,130'],
  [3, 694.5, 1019.2, 16.84, '27,17,406,118 446,17,406,117 27,145,406,118 446,145,406,117 27,273,406,118 446,273,406,117 27,401,406,118 446,401,406,117 27,530,406,115 446,530,406,115 27,655,406,115 446,655,406,115 27,780,406,115 446,780,406,115 27,904,406,115 446,904,406,115'],
  [4, 0, 670.3, 14.58, '27,15,385,104 424,15,385,103 821,15,385,104 27,127,385,103 424,127,385,104 821,127,385,103 27,239,385,104 424,239,385,103 821,239,385,101 27,352,385,101 424,352,385,101 821,352,385,100 27,461,385,100 424,461,385,100 821,461,385,100 27,570,385,100'],
] as const).map(([step, depth, bottom, paddingY, g]) => ({ step, depth, bottom, paddingY, geo: parseGeo(g) }));
/** repaired layouts at t = 0.40 … 0.47 (projectToValidity, then auditContent against the naive visible set) */
const REPAIRED: Record<number, { steps: number; bottom: number; paddingY: number; geo: Box[] }> = Object.fromEntries(([
  [40, 4, 785.56, 14.64, '30,15,568,89 609,15,568,89 30,112,568,89 609,112,568,89 30,210,568,89 609,210,568,89 30,307,568,89 609,307,568,89 30,405,568,89 609,405,568,89 30,502,568,89 609,502,568,89 30,600,568,89 609,600,568,89 30,697,568,89 609,697,568,89'],
  [41, 4, 780.47, 14.64, '31,15,577,88 618,15,577,88 31,112,577,88 618,112,577,88 31,208,577,88 618,208,577,88 31,305,577,88 618,305,577,88 31,402,577,88 618,402,577,88 31,499,577,88 618,499,577,88 31,596,577,88 618,596,577,88 31,692,577,88 618,692,577,88'],
  [42, 4, 761.82, 14.47, '31,14,585,86 625,14,585,86 31,109,585,86 625,109,585,86 31,204,585,86 625,204,585,86 31,298,585,86 625,298,585,86 31,392,585,86 625,392,585,86 31,487,585,86 625,487,585,86 31,581,585,86 625,581,585,86 31,676,585,86 625,676,585,86'],
  [43, 4, 287.77, 14.47, '31,14,594,86 635,14,594,86 31,108,594,86 635,108,594,86 31,202,594,86 635,202,594,85 - - - - - - - - - -'],
  [44, 4, 285.88, 14.47, '31,14,603,85 644,14,603,85 31,108,603,85 644,108,603,85 31,201,603,85 644,201,603,85 - - - - - - - - - -'],
  [45, 3, 658.11, 16.83, '31,17,635,99 31,125,635,99 31,234,635,99 31,342,635,99 31,451,635,99 31,559,635,99 - - - - - - - - - -'],
  [46, 3, 654.23, 16.83, '31,17,644,98 31,125,644,98 31,232,644,98 31,340,644,98 31,448,644,98 31,556,644,98 - - - - - - - - - -'],
  [47, 2, 750.57, 19.21, '32,19,676,113 32,143,676,113 32,267,676,113 32,390,676,113 32,514,676,113 32,638,676,113 - - - - - - - - - -'],
] as const).map(([k, steps, bottom, paddingY, g]) => [k, { steps, bottom, paddingY, geo: parseGeo(g) }]));
// repaired visible count along the whole grid → list path (16 through t = 0.42, then 6)
const REP_VISIBLE = Array.from({ length: 101 }, (_, k) => (k <= 42 ? 16 : 6));

// --- checks: the port must reproduce the printed run and the study row ---
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;
if (!near(HERO_A2[0], 129064, 1) || !near(HERO_A11[0], 24191, 1) || !near(HERO_A2[10], 66443, 1) || !near(HERO_A11[10], 66443, 1) || !near(HERO_A2[20], 24191, 1)) {
  throw new Error('generative-fields ch3: hero migration areas disagree with the printed run');
}
if (!HERO.every((l) => l.valid)) throw new Error('generative-fields ch3: every hero frame must be valid');
if (!near(HERO[10].geo[2]![1], 111.52, 0.01) || !near(HERO[10].geo[11]![1], 413.92, 0.01)) throw new Error('generative-fields ch3: midpoint row tops');
const PATH_BITS = PATH.map((l) => l.valid);
WALL[ROW_GL].forEach((r) => {
  for (let k = r.from; k < r.from + r.len; k++) if (PATH_BITS[k] !== r.ok) throw new Error(`generative-fields ch3: oracle disagrees with the study at t = ${k / 100}`);
});
const WALL_VALID = WALL.reduce((n, row) => n + row.filter((r) => r.ok).reduce((m, r) => m + r.len, 0), 0);
const WALL_FULL = WALL.filter((row) => row.length === 1 && row[0].ok).length;
if (WALL_VALID !== 1906 || WALL_FULL !== 1 || WALL.some((row) => row.reduce((n, r) => n + r.len, 0) !== 101)) {
  throw new Error('generative-fields ch3: the validity wall does not match interpolation.test.ts');
}
if (!near(PATH[20].bottom, TRAJ[0].bottom, 1) || PATH.some((l) => l.overlap > 0 || l.size > 0)) throw new Error('generative-fields ch3: path categories');
const TOTAL = 60 * 101;
const INVALID = TOTAL - WALL_VALID; // 4154

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is the caption band)
// ---------------------------------------------------------------------------

const SC = 0.3; // viewport scale: 1280 × 800 → 384 × 240
const VP = { x: 150, y: 124, w: 1280 * SC, h: 800 * SC };
const OVF_H = 92; // overflow strip drawn below the frame
const RIB = { x0: 90, x1: 1190, y: 504, h: 28 };
const tickX = (i: number, n: number): number => RIB.x0 + ((RIB.x1 - RIB.x0) * i) / (n - 1);
const CHART = { x0: 660, x1: 1170, y0: 404, y1: 150, max: 140000 };
const chX = (t: number): number => lerp(CHART.x0, CHART.x1, t);
const chY = (a: number): number => lerp(CHART.y0, CHART.y1, a / CHART.max);
const WALL_BOX = { x: 624, y: 132, cw: 5.9, rh: 4.4 };
const RIGHT_X = 624;
const FILM = { x0: 72, pitch: 142, y: 172, sc: 0.105 };

const CAM_VP: CameraState = { x: 420, y: 300, k: 1.22 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.0 };
const CAM_CHART: CameraState = { x: 660, y: 310, k: 1.03 };
const CAM_WALL: CameraState = { x: 660, y: 336, k: 1.04 };
const CAM_OVF: CameraState = { x: 645, y: 330, k: 1.05 };
const CAM_PROJ: CameraState = { x: 660, y: 320, k: 1.04 };
const CAM_HIDE: CameraState = { x: 640, y: 316, k: 1.08 };
const CAM_FILM: CameraState = { x: 640, y: 340, k: 1.0 };
const CAM_LEDGER: CameraState = { x: 640, y: 320, k: 1.08 };

const CAPTIONS = [
  'Moving between layouts is what an interface does all the time, so the layouts in between should be valid too. Start with one careful case.',
  'In the hero migration, importance slides from slot two to slot eleven over twenty-one frames. Slot two falls from about one hundred twenty-nine thousand square pixels to twenty-four thousand; slot eleven rises.',
  'They cross at sixty-six thousand four hundred forty-three square pixels each, and all twenty-one frames are valid. But that is one chosen pair, and it says nothing about layouts in general.',
  'Now more pairs. The study walks sixty pairs of layouts, ten among the authored families and fifty random ones, each a straight line of a hundred and one points: six thousand sixty points in all.',
  'Straight lines mostly fail. Only nineteen hundred six points are valid, thirty-one percent, and just one of the sixty paths is valid from end to end.',
  'Every one of the four thousand one hundred fifty-four invalid points is the same kind: the layout spills past the bottom of the viewport. No point has overlapping slots.',
  'The repair is a projection. Take small steps downhill on violation depth, with a gentle pull back toward where the point started, and stop the moment the validity bit reads one.',
  'It works. On average it takes one point nine steps, out of forty allowed, and all six thousand sixty points end valid. Not one repair fails.',
  'But the validity bit never asked for content to stay. The July study counted fourteen hundred eight of those repairs hiding visible slots, and one cut sixteen visible slots to six.',
  'The September audit adds separate reports: required content retained, and strict containment with no slack. A layout can pass the old validity bit and fail both.',
  'And valid points still do not make smooth motion. Sorting, visibility and wrapping can jump between neighbors, so the readme says the samples do not establish smooth motion.',
  'The status table gives this lab no tag, only its limits. A fair reading is historical and narrowed: the July counts reproduce, but the readme calls them not promises about the corrected optimizer.',
  'Still open are a sixty-hertz transition driven by the projection, a second flow region, and learned fitness weights. Today: one program, many layouts, repaired to valid, not yet proven smooth.',
];

// ---------------------------------------------------------------------------
// Timeline — one caption per beat, paced at ~150 words per minute
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', { x: 420, y: 290, k: 1.3 }, cameraInterp);

  // the persistent machine: viewport + ribbon
  const vpU = tl.channel('vpU', 0);
  const vpOp = tl.channel('vpOp', 1);
  const pathMode = tl.channel('pathMode', 0); // 0 hero migration · 1 grid → list
  const heroK = tl.channel('heroK', 0); // 0..20
  const chartK = tl.channel('chartK', 0); // how far the area lines are drawn (never retracts)
  const pathK = tl.channel('pathK', 0); // 0..100
  const ribU = tl.channel('ribU', 0);
  const ribOp = tl.channel('ribOp', 1);
  const t21U = tl.channel('t21U', 0);
  const t21Green = tl.channel('t21Green', 0);
  const t101U = tl.channel('t101U', 0); // 21 → 101 ticks
  const colorU = tl.channel('colorU', 0); // ticks coloured valid / broken
  const flipU = tl.channel('flipU', 0); // broken ticks flip green after repair
  const focusTick = tl.channel('focusTick', 0);
  // hero chart
  const chartU = tl.channel('chartU', 0);
  const chartOp = tl.channel('chartOp', 1);
  const crossU = tl.channel('crossU', 0);
  const rowTopsU = tl.channel('rowTopsU', 0);
  const caveatU = tl.channel('caveatU', 0);
  // the study
  const pairsU = tl.channel('pairsU', 0);
  const flyU = tl.channel('flyU', 0);
  const wallU = tl.channel('wallU', 0);
  const wallOp = tl.channel('wallOp', 1);
  const fullRowU = tl.channel('fullRowU', 0);
  const countU = tl.channel('countU', 0);
  const catU = tl.channel('catU', 0);
  const ovfU = tl.channel('ovfU', 0);
  // projection
  const projU = tl.channel('projU', 0);
  const projStep = tl.channel('projStep', -1); // -1 naive view; 0..4 the projection steps at t = 0.20
  const anchorU = tl.channel('anchorU', 0);
  const wallFlipU = tl.channel('wallFlipU', 0);
  const repCountU = tl.channel('repCountU', 0);
  // hiding, audit, jumps
  const repView = tl.channel('repView', 0); // naive → repaired at the playhead
  const hideU = tl.channel('hideU', 0);
  const julyU = tl.channel('julyU', 0);
  const auditU = tl.channel('auditU', 0);
  const audit2U = tl.channel('audit2U', 0);
  const filmU = tl.channel('filmU', 0);
  const jumpU = tl.channel('jumpU', 0);
  const visLineU = tl.channel('visLineU', 0);
  // ledger
  const ledgerU = tl.channel('ledgerU', 0);
  const openU = tl.channel('openU', 0); // 0..3
  const recapU = tl.channel('recapU', 0);

  const caps: { at: number; dur: number }[] = [];
  let cursor = 0.4;
  for (const text of CAPTIONS) {
    const words = text.split(/\s+/).length;
    const dur = Math.round((words / 2.5 + 0.6) * 10) / 10;
    caps.push({ at: cursor, dur });
    cursor = Math.round((cursor + dur + 0.6) * 10) / 10;
  }
  const end = (i: number) => caps[i].at + caps[i].dur;
  const move = (ch: ChannelRef<number>, to: number, at: number, dur = 0.6) => tl.tween(ch, to, { at, dur, ease: ease.move });

  // — B0 · the in-between layouts should be valid too —
  let a = caps[0].at;
  tl.caption({ ...caps[0], text: CAPTIONS[0] });
  tl.tween(vpU, 1, { at: a + 0.2, dur: 1.2, ease: ease.draw });
  tl.tween(cam, CAM_WIDE, { at: a + 2.2, dur: 1.5, ease: ease.move });
  tl.tween(ribU, 1, { at: a + 3.4, dur: 1.3, ease: ease.draw });
  tl.tween(t21U, 1, { at: a + 6.4, dur: 1.2, ease: ease.enter });
  tl.hold(end(0), 0.6);

  // — B1 · the hero migration, 21 frames —
  a = caps[1].at;
  tl.caption({ ...caps[1], text: CAPTIONS[1] });
  tl.tween(chartU, 1, { at: a + 0.3, dur: 1.2, ease: ease.draw });
  tl.tween(heroK, 20, { at: a + 1.8, dur: 8.4, ease: ease.linear });
  tl.tween(chartK, 20, { at: a + 1.8, dur: 8.4, ease: ease.linear });
  tl.hold(end(1), 0.6);

  // — B2 · they cross at t = 0.5; all 21 valid; one chosen pair —
  a = caps[2].at;
  tl.caption({ ...caps[2], text: CAPTIONS[2] });
  tl.tween(heroK, 10, { at: a, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAM_CHART, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(crossU, 1, { at: a + 1.0, dur: 0.6, ease: ease.pop });
  tl.tween(rowTopsU, 1, { at: a + 2.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_WIDE, { at: a + 4.6, dur: 1.3, ease: ease.move });
  tl.tween(t21Green, 1, { at: a + 5.0, dur: 1.0, ease: ease.linear });
  tl.tween(caveatU, 1, { at: a + 7.4, dur: 0.6, ease: ease.enter });
  tl.hold(end(2), 0.6);

  // — B3 · sixty pairs × 101 points —
  a = caps[3].at;
  tl.caption({ ...caps[3], text: CAPTIONS[3] });
  move(chartOp, 0, a, 0.7);
  move(caveatU, 0, a, 0.5);
  move(rowTopsU, 0, a, 0.5);
  tl.tween(cam, CAMERA_HOME, { at: a, dur: 1.3, ease: ease.move });
  tl.set(pathMode, 1, a + 0.7);
  tl.set(heroK, 0, a + 0.7);
  tl.tween(t101U, 1, { at: a + 0.7, dur: 1.2, ease: ease.move });
  tl.tween(pairsU, 1, { at: a + 1.4, dur: 0.8, ease: ease.enter });
  tl.tween(pathK, 100, { at: a + 6.0, dur: 7.0, ease: ease.linear });
  tl.hold(end(3), 0.6);

  // — B4 · straight lines mostly fail: the ribbon joins a wall of sixty —
  a = caps[4].at;
  tl.caption({ ...caps[4], text: CAPTIONS[4] });
  tl.tween(colorU, 1, { at: a, dur: 1.4, ease: ease.linear });
  move(pairsU, 0, a, 0.5);
  tl.tween(cam, CAM_WALL, { at: a + 1.6, dur: 1.4, ease: ease.move });
  move(vpOp, 0.12, a + 1.6, 0.8);
  tl.tween(flyU, 1, { at: a + 1.8, dur: 1.2, ease: ease.move });
  tl.tween(wallU, 1, { at: a + 2.8, dur: 1.6, ease: ease.linear });
  tl.tween(countU, 1, { at: a + 4.6, dur: 0.6, ease: ease.enter });
  tl.tween(fullRowU, 1, { at: a + 7.6, dur: 0.6, ease: ease.pop });
  tl.hold(end(4), 0.6);

  // — B5 · every invalid point spills past the bottom —
  a = caps[5].at;
  tl.caption({ ...caps[5], text: CAPTIONS[5] });
  move(fullRowU, 0, a, 0.5);
  move(wallOp, 0.14, a, 0.8);
  move(countU, 0, a, 0.5);
  tl.tween(cam, CAM_OVF, { at: a, dur: 1.4, ease: ease.move });
  move(vpOp, 1, a + 0.2, 0.8);
  tl.tween(pathK, 20, { at: a + 0.2, dur: 1.2, ease: ease.move });
  tl.tween(ovfU, 1, { at: a + 1.6, dur: 0.8, ease: ease.enter });
  tl.tween(catU, 1, { at: a + 4.8, dur: 0.7, ease: ease.enter });
  tl.hold(end(5), 0.6);

  // — B6 · the projection at t = 0.20 —
  a = caps[6].at;
  tl.caption({ ...caps[6], text: CAPTIONS[6] });
  move(catU, 0, a, 0.5);
  move(wallOp, 0, a, 0.6);
  tl.tween(cam, CAM_PROJ, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(focusTick, 1, { at: a + 0.3, dur: 0.6, ease: ease.pop });
  tl.tween(projU, 1, { at: a + 0.8, dur: 0.7, ease: ease.enter });
  tl.set(projStep, 0, a + 1.0);
  tl.tween(anchorU, 1, { at: a + 4.6, dur: 0.8, ease: ease.enter });
  tl.tween(projStep, 4, { at: a + 6.0, dur: 4.4, ease: ease.linear });
  tl.hold(end(6), 0.6);

  // — B7 · 1.9 steps on average; 6060 / 6060; 0 failed —
  a = caps[7].at;
  tl.caption({ ...caps[7], text: CAPTIONS[7] });
  move(anchorU, 0, a, 0.5);
  move(ovfU, 0, a, 0.5);
  move(projU, 0, a, 0.6);
  move(focusTick, 0, a, 0.6);
  tl.tween(cam, CAM_WALL, { at: a, dur: 1.3, ease: ease.move });
  move(vpOp, 0.12, a, 0.8);
  move(wallOp, 1, a + 0.4, 0.8);
  tl.tween(flipU, 1, { at: a + 1.0, dur: 1.6, ease: ease.linear });
  tl.tween(wallFlipU, 1, { at: a + 1.4, dur: 2.0, ease: ease.linear });
  tl.tween(repCountU, 1, { at: a + 3.2, dur: 0.7, ease: ease.enter });
  tl.hold(end(7), 0.6);

  // — B8 · repairs that hid content —
  a = caps[8].at;
  tl.caption({ ...caps[8], text: CAPTIONS[8] });
  move(wallOp, 0, a, 0.7);
  move(repCountU, 0, a, 0.6);
  tl.set(projStep, -1, a + 0.4);
  move(vpOp, 1, a + 0.2, 0.8);
  tl.tween(cam, CAM_HIDE, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(pathK, 45, { at: a + 0.5, dur: 1.2, ease: ease.move });
  tl.tween(repView, 1, { at: a + 3.0, dur: 1.0, ease: ease.move });
  tl.tween(hideU, 1, { at: a + 3.4, dur: 0.8, ease: ease.pop });
  tl.tween(julyU, 1, { at: a + 5.6, dur: 0.7, ease: ease.enter });
  tl.hold(end(8), 0.6);

  // — B9 · the September audit —
  a = caps[9].at;
  tl.caption({ ...caps[9], text: CAPTIONS[9] });
  move(julyU, 0, a, 0.5);
  move(hideU, 0, a, 0.5);
  tl.tween(auditU, 1, { at: a + 0.5, dur: 0.8, ease: ease.enter });
  tl.tween(pathK, 40, { at: a + 6.0, dur: 1.0, ease: ease.move });
  tl.tween(audit2U, 1, { at: a + 6.6, dur: 0.8, ease: ease.enter });
  tl.hold(end(9), 0.6);

  // — B10 · neighbours jump —
  a = caps[10].at;
  tl.caption({ ...caps[10], text: CAPTIONS[10] });
  move(auditU, 0, a, 0.5);
  move(audit2U, 0, a, 0.5);
  tl.tween(cam, CAM_FILM, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(filmU, 1, { at: a + 0.3, dur: 1.6, ease: ease.move });
  tl.tween(pathK, 47, { at: a + 2.0, dur: 3.2, ease: ease.linear });
  tl.tween(jumpU, 1, { at: a + 3.0, dur: 0.8, ease: ease.pop });
  tl.tween(visLineU, 1, { at: a + 4.6, dur: 1.2, ease: ease.draw });
  tl.hold(end(10), 0.6);

  // — B11 · the ledger —
  a = caps[11].at;
  tl.caption({ ...caps[11], text: CAPTIONS[11] });
  move(filmU, 0, a, 0.7);
  move(jumpU, 0, a, 0.5);
  move(visLineU, 0, a, 0.5);
  tl.set(vpOp, 0, a); // already folded into the filmstrip
  move(ribOp, 0.12, a, 0.8);
  tl.tween(cam, CAM_LEDGER, { at: a, dur: 1.3, ease: ease.move });
  tl.tween(ledgerU, 1, { at: a + 0.6, dur: 0.8, ease: ease.enter });
  tl.hold(end(11), 0.6);

  // — B12 · still open; pull back for the recap —
  a = caps[12].at;
  tl.caption({ ...caps[12], text: CAPTIONS[12] });
  move(ribOp, 0, a, 0.8);
  tl.tween(cam, CAMERA_HOME, { at: a, dur: 1.6, ease: ease.move });
  tl.tween(openU, 3, { at: a + 0.6, dur: 3.6, ease: ease.linear });
  tl.tween(recapU, 1, { at: a + 7.0, dur: 0.9, ease: ease.enter });
  tl.hold(end(12), 2.5);

  return {
    tl, cam, vpU, vpOp, pathMode, heroK, chartK, pathK, ribU, ribOp, t21U, t21Green, t101U, colorU, flipU, focusTick,
    chartU, chartOp, crossU, rowTopsU, caveatU, pairsU, flyU, wallU, wallOp, fullRowU, countU, catU, ovfU,
    projU, projStep, anchorU, wallFlipU, repCountU, repView, hideU, julyU, auditU, audit2U, filmU, jumpU, visLineU,
    ledgerU, openU, recapU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Glyph kit (local)
// ---------------------------------------------------------------------------

function Txt({ x, y, text, fill = colors.TEXT, fs = 13, mono = false, anchor = 'start', opacity = 1, weight }: {
  x: number; y: number; text: string; fill?: string; fs?: number; mono?: boolean; anchor?: 'start' | 'middle' | 'end'; opacity?: number; weight?: number;
}) {
  if (opacity <= 0.005) return null;
  return (
    <text x={x} y={y} fill={fill} fontSize={fs} fontFamily={mono ? MONO : UI} textAnchor={anchor} opacity={opacity} fontWeight={weight}>
      {text}
    </text>
  );
}

function Chip({ x, y, text, color, opacity = 1, fs = 13, anchor = 'start', mono = true }: {
  x: number; y: number; text: string; color: string; opacity?: number; fs?: number; anchor?: 'start' | 'middle' | 'end'; mono?: boolean;
}) {
  if (opacity <= 0.005) return null;
  const w = text.length * (mono ? (fs === 14 ? CH14 : CH13) : fs * 0.56) + 20;
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

/** a 0/1 light: green filled for 1, red ring for 0 */
function Light({ x, y, b, r = 10, opacity = 1 }: { x: number; y: number; b: number; r?: number; opacity?: number }) {
  if (opacity <= 0.005) return null;
  const c = b >= 1 ? colors.POSITIVE : colors.NEGATIVE;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y} r={r} fill={b >= 1 ? c : 'none'} stroke={c} strokeWidth={2} />
      <text x={x} y={y + 4.5} textAnchor="middle" fill={b >= 1 ? '#0a0e1a' : c} fontSize={13} fontFamily={MONO} fontWeight={700}>
        {b}
      </text>
    </g>
  );
}

const SLOT_TINT: Record<number, string> = { 2: colors.WARM, 11: colors.ACCENT };

/** a 1280 × 800 viewport at scale sc: cards inside the frame, red cards in the overflow strip below it */
function Screen({ id, x, y, sc, geo, opacity = 1, ovf = 0, tint = false, frame = 1, limitY, dashed = false, labels = false }: {
  id: string; x: number; y: number; sc: number; geo: Box[]; opacity?: number; ovf?: number; tint?: boolean; frame?: number;
  limitY?: number; dashed?: boolean; labels?: boolean;
}) {
  if (opacity <= 0.005) return null;
  const w = 1280 * sc;
  const h = 800 * sc;
  const card = (g: Box, slot: number, inFrame: boolean) => {
    if (!g) return null;
    const c = tint && SLOT_TINT[slot] ? SLOT_TINT[slot] : inFrame ? colors.MUTED : colors.NEGATIVE;
    return (
      <rect key={slot} x={x + g[0] * sc} y={y + g[1] * sc} width={Math.max(1, g[2] * sc)} height={Math.max(1, g[3] * sc)} rx={Math.min(3, 30 * sc)}
        fill={c} fillOpacity={dashed ? 0 : tint && SLOT_TINT[slot] ? 0.32 : 0.14} stroke={c} strokeWidth={1.2}
        strokeDasharray={dashed ? '3 3' : undefined} />
    );
  };
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={`${id}-in`}><rect x={x} y={y} width={w} height={h} /></clipPath>
        <clipPath id={`${id}-out`}><rect x={x - 2} y={y + h} width={w + 4} height={ovf} /></clipPath>
      </defs>
      {frame > 0.01 && <rect x={x} y={y} width={w} height={h} rx={4} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} opacity={frame} />}
      <g clipPath={`url(#${id}-in)`}>{geo.map((g, i) => card(g, i, true))}</g>
      {ovf > 1 && <g clipPath={`url(#${id}-out)`}>{geo.map((g, i) => card(g, i, false))}</g>}
      {limitY !== undefined && <line x1={x} y1={y + limitY * sc} x2={x + w} y2={y + limitY * sc} stroke={colors.NEGATIVE} strokeWidth={1.2} strokeDasharray="5 4" opacity={0.8} />}
      {labels && geo.map((g, slot) => g && SLOT_TINT[slot] && (
        <text key={`l${slot}`} x={x + (g[0] + g[2] / 2) * sc} y={y + (g[1] + g[3] / 2) * sc + 5} textAnchor="middle" fill={SLOT_TINT[slot]} fontSize={13} fontFamily={MONO}>
          {slot}
        </text>
      ))}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const g = (ch: ChannelRef<number>): number => s.get(ch);
  const cam = s.get(scene.cam);
  const vpU = g(scene.vpU);
  const vpOp = g(scene.vpOp);
  const pathMode = g(scene.pathMode) >= 0.5;
  const heroI = Math.max(0, Math.min(20, Math.round(g(scene.heroK))));
  const k = Math.max(0, Math.min(100, Math.round(g(scene.pathK))));
  const ribU = g(scene.ribU);
  const ribOp = g(scene.ribOp);
  const t21U = g(scene.t21U);
  const t21Green = g(scene.t21Green);
  const t101U = g(scene.t101U);
  const colorU = g(scene.colorU);
  const flipU = g(scene.flipU);
  const focusTick = g(scene.focusTick);
  const chartU = g(scene.chartU) * g(scene.chartOp);
  const crossU = g(scene.crossU) * g(scene.chartOp);
  const rowTopsU = g(scene.rowTopsU);
  const caveatU = g(scene.caveatU);
  const pairsU = g(scene.pairsU);
  const flyU = g(scene.flyU);
  const wallU = g(scene.wallU);
  const wallOp = g(scene.wallOp);
  const fullRowU = g(scene.fullRowU);
  const countU = g(scene.countU);
  const catU = g(scene.catU);
  const ovfU = g(scene.ovfU);
  const projU = g(scene.projU);
  const projStepRaw = g(scene.projStep);
  const projStep = projStepRaw < -0.5 ? -1 : Math.max(0, Math.min(4, Math.floor(projStepRaw + 0.001)));
  const anchorU = g(scene.anchorU);
  const wallFlipU = g(scene.wallFlipU);
  const repCountU = g(scene.repCountU);
  const repView = g(scene.repView);
  const hideU = g(scene.hideU);
  const julyU = g(scene.julyU);
  const auditU = g(scene.auditU);
  const audit2U = g(scene.audit2U);
  const filmU = g(scene.filmU);
  const jumpU = g(scene.jumpU);
  const visLineU = g(scene.visLineU);
  const ledgerU = g(scene.ledgerU);
  const openU = g(scene.openU);
  const recapU = g(scene.recapU);

  // --- what the viewport shows ---
  const naive: Layout = pathMode ? PATH[k] : HERO[heroI];
  const traj = projStep >= 0 ? TRAJ[projStep] : null;
  const rep = REPAIRED[k];
  const showRep = rep && repView > 0.5;
  const shownGeo = traj ? traj.geo : showRep ? rep.geo : naive.geo;
  const shownValid = traj ? traj.depth === 0 : showRep ? true : naive.valid;
  const shownBottom = traj ? traj.bottom : showRep ? rep.bottom : naive.bottom;
  const shownPadY = traj ? traj.paddingY : showRep ? rep.paddingY : naive.paddingY;
  const shownVisible = shownGeo.filter(Boolean).length;
  const tLabel = pathMode ? (k / 100).toFixed(2) : (heroI / 20).toFixed(2);
  const ovfStrip = OVF_H * Math.max(ovfU, pathMode && !shownValid ? 0.75 : 0);
  // the viewport flies into the first filmstrip frame in B10
  const vx = lerp(VP.x, FILM.x0, filmU);
  const vy = lerp(VP.y, FILM.y, filmU);
  const vsc = lerp(SC, FILM.sc, filmU);
  const machineOp = vpOp * vpU * (1 - clamp01((filmU - 0.95) * 20));

  // --- ribbon ticks ---
  const ribbonTicks = () => {
    const out: JSX.Element[] = [];
    const op21 = t21U * (1 - t101U);
    if (op21 > 0.01) {
      for (let i = 0; i < 21; i++) {
        const u = clamp01(t21U * 21 - i);
        const cur = !pathMode && i === heroI;
        const fill = t21Green > i / 21 ? colors.POSITIVE : colors.MUTED;
        out.push(<rect key={`h${i}`} x={tickX(i, 21) - 5} y={RIB.y + (1 - u) * 10} width={10} height={RIB.h * u} rx={2} fill={fill} opacity={op21 * (cur ? 1 : 0.6)} />);
      }
    }
    if (t101U > 0.01) {
      for (let i = 0; i < 101; i++) {
        const ok = PATH_BITS[i];
        const coloured = colorU * 101 > i;
        const flipped = flipU * 101 > i;
        const fill = !coloured ? colors.MUTED : ok || flipped ? colors.POSITIVE : colors.NEGATIVE;
        const isFocus = i === 20 && focusTick > 0.01;
        const grow = isFocus ? 1 + 0.6 * focusTick : 1;
        const fx = tickX(i, 101);
        out.push(
          <rect key={`p${i}`} x={fx - 3.2 * grow} y={RIB.y - (grow - 1) * RIB.h * 0.5} width={6.4 * grow} height={RIB.h * grow} rx={1.5} fill={fill}
            opacity={t101U * (coloured ? 0.9 : 0.45) * (focusTick > 0.01 && !isFocus ? 1 - 0.6 * focusTick : 1)} />,
        );
      }
    }
    return out;
  };
  const headX = pathMode ? tickX(k, 101) : tickX(heroI, 21);
  const headOp = pathMode ? t101U : t21U;

  // --- wall (60 × 101) ---
  const wallRows = () =>
    WALL.map((row, r) => {
      const u = clamp01(wallU * 1.4 * 60 - r * 1.4 * 0.6) * (r === ROW_GL ? clamp01((flyU - 0.98) * 50) : 1);
      if (u <= 0.01) return null;
      const y = WALL_BOX.y + r * WALL_BOX.rh;
      return (
        <g key={r} opacity={u}>
          {row.map((run, j) => {
            const xa = WALL_BOX.x + run.from * WALL_BOX.cw;
            const flipCols = wallFlipU * 101;
            if (run.ok) return <rect key={j} x={xa} y={y} width={run.len * WALL_BOX.cw - 0.6} height={WALL_BOX.rh - 0.8} fill={colors.POSITIVE} opacity={0.85} />;
            const split = Math.max(run.from, Math.min(run.from + run.len, flipCols));
            const xs = WALL_BOX.x + split * WALL_BOX.cw;
            return (
              <g key={j}>
                {split > run.from && <rect x={xa} y={y} width={xs - xa} height={WALL_BOX.rh - 0.8} fill={colors.POSITIVE} opacity={0.85} />}
                {split < run.from + run.len && (
                  <rect x={xs} y={y} width={xa + run.len * WALL_BOX.cw - xs - 0.6} height={WALL_BOX.rh - 0.8} fill={colors.NEGATIVE} opacity={0.75} />
                )}
              </g>
            );
          })}
        </g>
      );
    });
  // the ribbon's ghost flies into wall row 2
  const fly = flyU > 0.01 && flyU < 0.995;
  const flyX0 = lerp(RIB.x0 - 3.2, WALL_BOX.x, flyU);
  const flyW = lerp(RIB.x1 - RIB.x0 + 6.4, 101 * WALL_BOX.cw, flyU);
  const flyY = lerp(RIB.y, WALL_BOX.y + ROW_GL * WALL_BOX.rh, flyU);
  const flyH = lerp(RIB.h, WALL_BOX.rh - 0.8, flyU);

  // --- B6 projection bars ---
  const bar = (i: number) => TRAJ[i].depth;
  const BAR = { x: RIGHT_X + 10, base: 404, w: 64, pitch: 112, max: 3089.6, h: 120 };

  const filmFrames = [40, 41, 42, 43, 44, 45, 46, 47];

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...cam}>
        {/* ======================== hero chart (B1–B2) ======================== */}
        {chartU > 0.01 && (
          <g>
            <g opacity={clamp01(chartU * 1.5)}>
              <Txt x={CHART.x0} y={CHART.y1 - 26} text="slot area along the path, px²" fill={colors.TEXT} fs={14} />
              <line x1={CHART.x0} y1={CHART.y0} x2={lerp(CHART.x0, CHART.x1, chartU)} y2={CHART.y0} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={CHART.x0} y1={CHART.y0} x2={CHART.x0} y2={lerp(CHART.y0, CHART.y1, chartU)} stroke={colors.GRID} strokeWidth={1.5} />
              {[0, 0.5, 1].map((t) => (
                <Txt key={t} x={chX(t)} y={CHART.y0 + 20} text={`t = ${t}`} fill={colors.MUTED} anchor="middle" mono />
              ))}
            </g>
            {[{ a: HERO_A2, c: colors.WARM }, { a: HERO_A11, c: colors.ACCENT }].map(({ a, c }, li) => {
              const upto = Math.floor(g(scene.chartK) + 0.001);
              const pts = a.slice(0, upto + 1).map((v, i) => `${chX(i / 20)},${chY(v)}`).join(' ');
              return (
                <g key={li} opacity={chartU}>
                  <polyline points={pts} fill="none" stroke={c} strokeWidth={2.5} />
                  {a.slice(0, upto + 1).map((v, i) => <circle key={i} cx={chX(i / 20)} cy={chY(v)} r={2.6} fill={c} />)}
                </g>
              );
            })}
            <g opacity={chartU}>
              <Txt x={CHART.x0 + 8} y={chY(HERO_A2[0]) - 12} text={`slot 2: ${fmtInt(HERO_A2[0])} → ${fmtInt(HERO_A2[20])} px²`} fill={colors.WARM} mono />
              <Txt x={CHART.x1} y={chY(HERO_A11[20]) - 12} text={`slot 11: ${fmtInt(HERO_A11[0])} → ${fmtInt(HERO_A11[20])} px²`} fill={colors.ACCENT} mono anchor="end"
                opacity={clamp01(g(scene.chartK) - 17)} />
            </g>
            {crossU > 0.01 && (
              <g opacity={crossU}>
                <circle cx={chX(0.5)} cy={chY(HERO_A2[10])} r={9 * (0.6 + 0.4 * crossU)} fill="none" stroke={colors.TEXT} strokeWidth={2} />
                <line x1={chX(0.5)} y1={chY(HERO_A2[10]) + 10} x2={chX(0.5)} y2={CHART.y0} stroke={colors.TEXT} strokeWidth={1} strokeDasharray="3 3" />
                <Chip x={chX(0.5) + 18} y={chY(HERO_A2[10]) + 40} text={`t = 0.5: ${fmtInt(HERO_A2[10])} each`} color={colors.TEXT} />
              </g>
            )}
          </g>
        )}

        {/* ======================== study card (B3) ======================== */}
        {pairsU > 0.01 && (
          <g opacity={pairsU}>
            <Txt x={RIGHT_X} y={170} text="the interpolation study" fill={colors.TEXT} fs={15} />
            <Chip x={RIGHT_X} y={214} text="60 pairs × 101 points = 6060" color={colors.TEXT} fs={14} />
            {/* 60 pair cells: 10 authored-authored, 50 seeded */}
            {Array.from({ length: 60 }, (_, i) => {
              const u = clamp01(pairsU * 60 - i * 0.6);
              const col = i % 20;
              const row = Math.floor(i / 20);
              return <rect key={i} x={RIGHT_X + col * 26} y={246 + row * 26} width={20} height={20} rx={3} fill={i < 10 ? colors.SECONDARY : colors.MUTED} opacity={0.75 * u} />;
            })}
            <Txt x={RIGHT_X} y={346} text="10 among the five authored families" fill={colors.SECONDARY} />
            <Txt x={RIGHT_X} y={368} text="50 seeded pairs from the families + top 15 searched layouts" fill={colors.MUTED} />
            <Txt x={RIGHT_X} y={400} text="studyConfig: samplesPerPath 101 · randomPairCount 50" fill={colors.MUTED} mono />
          </g>
        )}

        {/* ======================== the wall (B4, B7) ======================== */}
        {(wallU > 0.01 || fly) && wallOp > 0.005 && (
          <g opacity={wallOp}>
            <Txt x={WALL_BOX.x} y={WALL_BOX.y - 12} text="60 paths × 101 points, naive" fill={colors.TEXT} fs={14} opacity={clamp01(wallU * 3)} />
            {wallRows()}
            <polygon points={`${WALL_BOX.x - 12},${WALL_BOX.y + ROW_GL * WALL_BOX.rh - 3} ${WALL_BOX.x - 4},${WALL_BOX.y + (ROW_GL + 0.5) * WALL_BOX.rh} ${WALL_BOX.x - 12},${WALL_BOX.y + (ROW_GL + 1) * WALL_BOX.rh + 3}`}
              fill={colors.TEXT} opacity={clamp01(wallU * 3)} />
            {fullRowU > 0.01 && (
              <g opacity={fullRowU}>
                <rect x={WALL_BOX.x - 3} y={WALL_BOX.y + ROW_FULL * WALL_BOX.rh - 3} width={101 * WALL_BOX.cw + 6} height={WALL_BOX.rh + 5} fill="none" stroke={colors.POSITIVE} strokeWidth={2} rx={2} />
                <Txt x={WALL_BOX.x + 101 * WALL_BOX.cw} y={WALL_BOX.y - 12} text="heroRail → mosaic: valid end to end" fill={colors.POSITIVE} anchor="end" />
              </g>
            )}
            <g opacity={countU * (1 - repCountU)}>
              <Txt x={WALL_BOX.x} y={428} text={`valid before ${WALL_VALID}/${TOTAL} (${((100 * WALL_VALID) / TOTAL).toFixed(1)}%)`} fill={colors.TEXT} fs={14} mono />
              <Txt x={WALL_BOX.x} y={452} text={`fully valid naive paths ${WALL_FULL}/60`} fill={fullRowU > 0.5 ? colors.POSITIVE : colors.MUTED} fs={14} mono />
            </g>
            <g opacity={repCountU}>
              <Txt x={WALL_BOX.x} y={428} text={`valid after ${TOTAL}/${TOTAL} · repaired ${INVALID}, failed 0`} fill={colors.POSITIVE} fs={14} mono />
              <Txt x={WALL_BOX.x} y={452} text="mean 1.9 steps of maxSteps 40" fill={colors.TEXT} fs={14} mono />
              {Array.from({ length: 40 }, (_, i) => (
                <rect key={i} x={WALL_BOX.x + 280 + i * 7.6} y={441} width={5.6} height={12} rx={1}
                  fill={i < 2 ? colors.POSITIVE : colors.GRID} opacity={i === 1 ? 0.9 : 1} />
              ))}
            </g>
          </g>
        )}
        {fly && (
          <g>
            {Array.from({ length: 101 }, (_, i) => (
              <rect key={i} x={flyX0 + (flyW * i) / 101} y={flyY} width={Math.max(0.8, flyW / 101 - 0.6)} height={flyH}
                fill={PATH_BITS[i] ? colors.POSITIVE : colors.NEGATIVE} opacity={0.9} />
            ))}
          </g>
        )}
        {catU > 0.01 && (
          <g opacity={catU}>
            <Chip x={RIGHT_X} y={480} text={`containment ${INVALID} · overlap 0 · minimum size 0`} color={colors.NEGATIVE} fs={14} />
          </g>
        )}

        {/* ======================== projection (B6) ======================== */}
        {projU > 0.01 && (
          <g opacity={projU}>
            <Txt x={RIGHT_X} y={150} text="projectToValidity" fill={colors.TEXT} fs={15} mono />
            <Txt x={RIGHT_X} y={172} text="maxSteps 40 · learningRate 0.02 · proximalWeight 0.05" fill={colors.MUTED} mono />
            <Txt x={RIGHT_X} y={198} text="descend violationDepth; stop when validBit == 1" fill={colors.MUTED} mono />
            {TRAJ.map((st, i) => {
              const on = projStep >= i;
              const h = (bar(i) / BAR.max) * BAR.h;
              const x = BAR.x + i * BAR.pitch;
              return (
                <g key={i} opacity={on ? 1 : 0.15}>
                  {h > 0 ? (
                    <rect x={x} y={BAR.base - h} width={BAR.w} height={h} rx={3} fill={colors.NEGATIVE} opacity={0.75} />
                  ) : (
                    <Light x={x + BAR.w / 2} y={BAR.base - 14} b={1} />
                  )}
                  <Txt x={x + BAR.w / 2} y={BAR.base - h - (h > 0 ? 8 : 34)} text={h > 0 ? `${st.depth}` : 'validBit 1'} fill={h > 0 ? colors.NEGATIVE : colors.POSITIVE} anchor="middle" mono />
                  <Txt x={x + BAR.w / 2} y={BAR.base + 20} text={`step ${i}`} fill={colors.MUTED} anchor="middle" mono />
                </g>
              );
            })}
            <Txt x={RIGHT_X} y={224} text="bars: violationDepth in px · grid → list at t = 0.20" fill={colors.MUTED} />
            <g opacity={anchorU}>
              <rect x={RIGHT_X} y={238} width={22} height={13} rx={2} fill="none" stroke={colors.SECONDARY} strokeDasharray="3 3" strokeWidth={1.5} />
              <Txt x={RIGHT_X + 30} y={248} text="anchor: the straight-line point, pulled toward at proximalWeight 0.05" fill={colors.SECONDARY} />
            </g>
          </g>
        )}

        {/* ======================== July tally (B8) ======================== */}
        {julyU > 0.01 && (
          <g opacity={julyU}>
            <rect x={RIGHT_X} y={286} width={560} height={92} rx={8} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.2} />
            <Txt x={RIGHT_X + 18} y={314} text="July study (README)" fill={colors.WARM} fs={14} />
            <Txt x={RIGHT_X + 18} y={340} text="1,408 of 4,154 repairs hid visible items" fill={colors.TEXT} fs={14} mono />
            <Txt x={RIGHT_X + 18} y={364} text="one cut sixteen visible items to six" fill={colors.TEXT} fs={14} mono />
          </g>
        )}
        {hideU > 0.01 && (
          <g opacity={hideU}>
            <Txt x={RIGHT_X} y={170} text="visible slots" fill={colors.MUTED} fs={14} />
            <Txt x={RIGHT_X} y={230} text="16" fill={colors.TEXT} fs={52} mono />
            <Txt x={RIGHT_X + 82} y={226} text="→" fill={colors.MUTED} fs={36} />
            <Txt x={RIGHT_X + 132} y={230} text="6" fill={colors.NEGATIVE} fs={52} mono />
            <Txt x={RIGHT_X} y={262} text="today's code · grid → list at t = 0.45 · validBit 1" fill={colors.MUTED} />
          </g>
        )}

        {/* ======================== audit (B9) ======================== */}
        {auditU > 0.01 && (
          <g opacity={auditU}>
            <Txt x={RIGHT_X} y={150} text="auditContent(snapshot, required)" fill={colors.TEXT} fs={15} mono />
            <Txt x={RIGHT_X + 300} y={190} text="t = 0.45" fill={colors.MUTED} anchor="middle" mono />
            <Txt x={RIGHT_X + 420} y={190} text="t = 0.40" fill={colors.MUTED} anchor="middle" mono opacity={audit2U} />
            {[
              { name: 'validBit (historical)', a: 1, b: 1, c: colors.MUTED },
              { name: 'requiredContentRetained', a: 0, b: 1, c: colors.SECONDARY },
              { name: 'strictlyContained', a: 1, b: 0, c: colors.SECONDARY },
            ].map((row, i) => (
              <g key={i}>
                <Txt x={RIGHT_X} y={230 + i * 44} text={row.name} fill={row.c === colors.MUTED ? colors.TEXT : colors.SECONDARY} fs={14} mono />
                <Light x={RIGHT_X + 300} y={225 + i * 44} b={row.a} />
                <Light x={RIGHT_X + 420} y={225 + i * 44} b={row.b} opacity={audit2U} />
              </g>
            ))}
            <Txt x={RIGHT_X} y={370} text="t = 0.45: ten required slots hidden" fill={colors.TEXT} />
            <Txt x={RIGHT_X} y={394} text="t = 0.40: 0.2 px past the padded bottom, inside the 0.5 px slack" fill={colors.TEXT} opacity={audit2U} />
          </g>
        )}

        {/* ======================== neighbours (B10) ======================== */}
        {filmU > 0.01 && (
          <g>
            {filmFrames.map((fk, i) => {
              const u = clamp01(filmU * 8 - i * 0.9);
              const fx = FILM.x0 + i * FILM.pitch;
              const r = REPAIRED[fk];
              const lit = k === fk;
              return (
                <g key={fk} opacity={i === 0 ? clamp01((filmU - 0.95) * 20) : u}>
                  <Screen id={`film${fk}`} x={fx} y={FILM.y} sc={FILM.sc} geo={r.geo} />
                  {lit && <rect x={fx - 3} y={FILM.y - 3} width={1280 * FILM.sc + 6} height={800 * FILM.sc + 6} rx={5} fill="none" stroke={colors.TEXT} strokeWidth={1.5} />}
                  <Txt x={fx + (1280 * FILM.sc) / 2} y={FILM.y + 800 * FILM.sc + 22} text={`t = ${(fk / 100).toFixed(2)}`} fill={colors.MUTED} anchor="middle" mono />
                  <Txt x={fx + (1280 * FILM.sc) / 2} y={FILM.y + 800 * FILM.sc + 42} text={`visible ${r.geo.filter(Boolean).length}`} fill={r.geo.filter(Boolean).length < 16 ? colors.NEGATIVE : colors.TEXT} anchor="middle" mono />
                  <Txt x={fx + (1280 * FILM.sc) / 2} y={FILM.y + 800 * FILM.sc + 62} text={`bottom ${Math.round(r.bottom)}`} fill={colors.MUTED} anchor="middle" mono />
                </g>
              );
            })}
            <Txt x={FILM.x0} y={FILM.y - 46} text="repaired neighbours on grid → list, all validBit 1" fill={colors.TEXT} fs={15} opacity={filmU} />
            {jumpU > 0.01 && (
              <g opacity={jumpU}>
                {[{ at: 3, text: 'visibility flips' }, { at: 5, text: 'wrap flips' }].map((j) => {
                  const x = FILM.x0 + j.at * FILM.pitch - (FILM.pitch - 1280 * FILM.sc) / 2;
                  return (
                    <g key={j.text}>
                      <line x1={x} y1={FILM.y - 10} x2={x} y2={FILM.y + 800 * FILM.sc + 8} stroke={colors.WARM} strokeWidth={2} strokeDasharray="4 3" />
                      <Txt x={x} y={FILM.y - 16} text={j.text} fill={colors.WARM} anchor="middle" />
                    </g>
                  );
                })}
              </g>
            )}
            <Txt x={FILM.x0} y={FILM.y + 800 * FILM.sc + 104} text="README: the samples do not establish smooth motion — sorting, visibility, and wrapping can jump"
              fill={colors.TEXT} fs={14} opacity={jumpU} />
          </g>
        )}

        {/* ======================== the viewport (persistent) ======================== */}
        {machineOp > 0.005 && (
          <g opacity={machineOp}>
            {/* status row */}
            <g opacity={1 - filmU}>
              <Txt x={VP.x} y={VP.y - 12} text={`t = ${tLabel}`} fill={colors.MUTED} mono />
              <Txt x={VP.x + 86} y={VP.y - 12} text="validBit" fill={colors.MUTED} mono />
              <Light x={VP.x + 166} y={VP.y - 16.5} b={shownValid ? 1 : 0} r={9} />
              <Txt x={VP.x + 190} y={VP.y - 12} text={`visible ${shownVisible}`} fill={shownVisible < 16 && showRep ? colors.NEGATIVE : colors.MUTED} mono />
              <Txt x={VP.x + 1280 * SC} y={VP.y - 12} text={pathMode ? 'grid → list' : 'heroMigrationPair'} fill={colors.TEXT} mono anchor="end" />
            </g>
            {/* anchor ghost during the projection */}
            {anchorU > 0.01 && traj && (
              <Screen id="anchor" x={vx} y={vy} sc={vsc} geo={TRAJ[0].geo} opacity={anchorU * 0.8} dashed ovf={ovfStrip} frame={0} />
            )}
            {/* naive cards fade as the repaired layout replaces them (B8) */}
            {showRep && hideU > 0.01 && (
              <Screen id="ghost" x={vx} y={vy} sc={vsc} geo={naive.geo.map((b, i) => (rep.geo[i] ? null : b))} opacity={0.5 * hideU} dashed frame={0} />
            )}
            <Screen id="vp" x={vx} y={vy} sc={vsc} geo={shownGeo} ovf={filmU > 0.01 ? 0 : ovfStrip} tint={!pathMode} labels={!pathMode && filmU < 0.01}
              limitY={pathMode && filmU < 0.01 && (ovfU > 0.01 || !shownValid) ? 800 - shownPadY : undefined} />
            {/* row tops at the midpoint (B2) */}
            {rowTopsU > 0.01 && !pathMode && heroI === 10 && (
              <g opacity={rowTopsU}>
                {[111.52, 413.92].map((yv) => (
                  <g key={yv}>
                    <line x1={VP.x - 8} y1={VP.y + yv * SC} x2={VP.x + 1280 * SC} y2={VP.y + yv * SC} stroke={colors.TEXT} strokeWidth={1} strokeDasharray="3 3" />
                  </g>
                ))}
                <Txt x={VP.x} y={VP.y + VP.h + 24} text="row tops 111.52 and 413.92" fill={colors.TEXT} mono />
              </g>
            )}
            {caveatU > 0.01 && <Chip x={VP.x} y={VP.y + VP.h + 56} text="one chosen pair" color={colors.WARM} opacity={caveatU} mono={false} fs={14} />}
            {/* overflow annotation (B5, B6) */}
            {ovfU > 0.01 && pathMode && filmU < 0.01 && (
              <g opacity={ovfU}>
                <Txt x={VP.x + VP.w + 12} y={VP.y + (800 - shownPadY) * SC + 4} text={`limit ${Math.round(800 - shownPadY)}`} fill={colors.NEGATIVE} mono />
                <Txt x={VP.x + VP.w + 12} y={VP.y + VP.h + OVF_H - 4} text={`contentBottom ${Math.round(shownBottom)}`} fill={shownValid ? colors.POSITIVE : colors.NEGATIVE} mono />
                {!shownValid && <Txt x={VP.x} y={VP.y + VP.h + OVF_H + 20} text="spills past the bottom: a containment violation" fill={colors.NEGATIVE} />}
              </g>
            )}
            {/* projection: the spring back to the anchor */}
            {anchorU > 0.01 && traj && (
              <g opacity={anchorU}>
                {(() => {
                  const y0 = VP.y + Math.min(VP.h + OVF_H, TRAJ[0].bottom * SC);
                  const y1 = VP.y + Math.min(VP.h + OVF_H, traj.bottom * SC);
                  const x = VP.x - 16;
                  const n = 8;
                  const pts = Array.from({ length: n + 1 }, (_, i) => `${x + (i % 2 ? 6 : -6) * (i > 0 && i < n ? 1 : 0)},${lerp(y1, y0, i / n)}`).join(' ');
                  return y0 - y1 > 4 ? <polyline points={pts} fill="none" stroke={colors.SECONDARY} strokeWidth={1.6} /> : null;
                })()}
              </g>
            )}
          </g>
        )}

        {/* ======================== the ribbon (persistent) ======================== */}
        {ribU > 0.01 && ribOp > 0.005 && (
          <g opacity={ribOp}>
            <line x1={RIB.x0} y1={RIB.y + RIB.h / 2} x2={lerp(RIB.x0, RIB.x1, ribU)} y2={RIB.y + RIB.h / 2} stroke={colors.GRID} strokeWidth={2} />
            <Txt x={RIB.x0 - 14} y={RIB.y + RIB.h / 2 + 5} text={pathMode ? 'grid' : 'A'} fill={colors.TEXT} anchor="end" mono />
            <Txt x={RIB.x1 + 14} y={RIB.y + RIB.h / 2 + 5} text={pathMode ? 'list' : 'B'} fill={colors.TEXT} mono opacity={clamp01(ribU * 4 - 3)} />
            {ribbonTicks()}
            {headOp > 0.01 && filmU < 0.99 && (
              <g opacity={headOp * (1 - filmU)}>
                <polygon points={`${headX - 6},${RIB.y - 14} ${headX + 6},${RIB.y - 14} ${headX},${RIB.y - 5}`} fill={colors.TEXT} />
                <line x1={headX} y1={RIB.y - 5} x2={headX} y2={RIB.y + RIB.h + 4} stroke={colors.TEXT} strokeWidth={1.2} opacity={0.6} />
              </g>
            )}
            <g opacity={headOp}>
              <Txt x={RIB.x0} y={RIB.y + RIB.h + 22} text={pathMode ? `101 points · ${flipU > 0.99 ? 'all 101 valid after repair' : colorU > 0.99 ? `valid ${PATH_BITS.filter(Boolean).length} of 101 before repair` : 'one straight line in 72 numbers'}` : `21 frames${t21Green > 0.99 ? ' · all 21 valid' : ''}`}
                fill={t21Green > 0.99 && !pathMode ? colors.POSITIVE : colors.MUTED} />
            </g>
            {/* B10: repaired visible count along the path */}
            {visLineU > 0.01 && (
              <g opacity={visLineU}>
                <polyline
                  points={REP_VISIBLE.slice(0, Math.max(1, Math.round(visLineU * 101))).map((v, i) => `${tickX(i, 101)},${v === 16 ? 576 : 600}`).join(' ')}
                  fill="none" stroke={colors.WARM} strokeWidth={2} />
                <Txt x={RIB.x1 + 14} y={580} text="16" fill={colors.WARM} mono />
                <Txt x={RIB.x1 + 14} y={604} text="6" fill={colors.WARM} mono />
                <Txt x={tickX(70, 101)} y={590} text="visible after repair" fill={colors.WARM} anchor="middle" />
                <rect x={tickX(40, 101) - 5} y={RIB.y - 4} width={tickX(47, 101) - tickX(40, 101) + 10} height={RIB.h + 8} rx={3} fill="none" stroke={colors.TEXT} strokeWidth={1.5} />
              </g>
            )}
          </g>
        )}

        {/* ======================== ledger (B11–B12) ======================== */}
        {ledgerU > 0.01 && (
          <g opacity={ledgerU}>
            <rect x={200} y={112} width={880} height={286} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
            <Txt x={232} y={150} text="lab/status.md · generative fields: no status tag, only limits" fill={colors.TEXT} fs={16} mono />
            {[
              { mark: '✓', text: 'July counts reproduce: 1906 valid · 4154 repaired · 0 failed · 1.9 steps', c: colors.POSITIVE },
              { mark: '~', text: 'narrowed by the September corrections:', c: colors.WARM },
              { mark: '', text: '"not promises about the corrected optimizer"', c: colors.WARM },
              { mark: '◷', text: 'reading: historical and narrowed', c: colors.TEXT },
            ].map((row, i) => (
              <g key={i} opacity={clamp01(ledgerU * 4 - i * 0.6)}>
                <Txt x={240} y={196 + i * 30} text={row.mark} fill={row.c} fs={15} mono />
                <Txt x={266} y={196 + i * 30} text={row.text} fill={row.c} fs={15} />
              </g>
            ))}
            <line x1={232} y1={326} x2={1048} y2={326} stroke={colors.GRID} />
            <Txt x={232} y={352} text="limit: Historical repair could hide content, and valid samples do not" fill={colors.MUTED} fs={14} />
            <Txt x={232} y={374} text="establish a smooth valid interpolation." fill={colors.MUTED} fs={14} />
          </g>
        )}
        {openU > 0.01 && (
          <g>
            <Txt x={200} y={440} text="still open" fill={colors.MUTED} fs={14} opacity={clamp01(openU)} />
            {['60 Hz transition driven by the projection', 'a second flow region', 'learned fitness weights'].map((t, i) => (
              <Chip key={t} x={[200, 568, 788][i]} y={476} text={t} color={colors.SECONDARY} opacity={clamp01(openU - i)} mono={false} fs={14} />
            ))}
          </g>
        )}
        {recapU > 0.01 && (
          <g opacity={recapU}>
            <Txt x={640} y={552} text="one program · many layouts · repaired to valid · not yet proven smooth" fill={colors.TEXT} fs={18} anchor="middle" />
          </g>
        )}
      </Camera>

      {/* ======================== screen-space title ======================== */}
      <rect x={0} y={0} width={STAGE_W} height={52} fill={colors.BG} opacity={0.9} />
      <text x={40} y={34} fill={colors.MUTED} fontSize={15} fontFamily={UI}>
        3 · The Path Between
      </text>
    </>
  );
}

export const vizScene = () => scene;
