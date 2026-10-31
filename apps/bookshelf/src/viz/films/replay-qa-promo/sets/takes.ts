/**
 * replay-qa-promo shared: the cleaned product takes, their marks and the crops verified on rr-sheet frames.
 * Use these constants instead of retyping numbers, so recurring framings (the bug-page title strips, the runs table,
 * the schedule chip) are identical from shot to shot.
 *
 * Every crop is in RECORDING px (viewport 1440 x 900). Each one was checked on .orly-work/promo/sheets/<take>/<ms>.png:
 * no chat column (x < 500), no owner sidebar / login line, no header URL, no 'Loading replay…' player.
 */
export const SLUG = 'replay-qa-promo';

/** marks (ms) exactly as in public/generated/replay-qa-promo/rr/<take>.json */
export const MARKS = {
  'new-project': { typing: 1100, typed: 2966, hoverStart: 4737, end: 5537 },
  runs: { list: 3668, scrolled: 5923, end: 6573 },
  schedule: { polish: 2226, schedule: 8808, addEnv: 11458, end: 12961 },
  explore: { play: 2821, end: 11751 },
  insights: { stats: 2926, severity: 6905, end: 7555 },
  /** report 3032 is NEVER shown (half-loaded): use the safe window 3040–3200; the player turns white after ≈ 3217 */
  'bug-react': { report: 3032, safeFrom: 3040, safeTo: 3200, still: 3150, actual: 8723, rootcause: 12008, end: 13692 },
  'bug-sync': { report: 1603, actual: 5402, rootcause: 8154, end: 8804 },
} as const;

export type Crop = { x: number; y: number; w: number; h: number };

export const CROPS = {
  /** bug-react @ 3150: chips row (Open · Medium · React Rendering · Project default) + the 3-line title (the back arrow sits at the left of the chips row); no player */
  reactChipsTitle: { x: 528, y: 74, w: 880, h: 150 },
  /** bug-react: the script's page crop for ch05-s02/s03 (the dark player inside must be covered by our plate) */
  reactPage: { x: 500, y: 80, w: 940, h: 680 },
  /** bug-react: the dark player rect inside reactPage (cover it: it reads 'Loading replay…') */
  reactPlayer: { x: 558, y: 315, w: 820, h: 445 },
  /** bug-sync @ 1603: chips row (Fixed · Medium · Network Performance · Local) + the 2-line title */
  syncChipsTitle: { x: 528, y: 74, w: 880, h: 116 },
  /** bug-sync: the 2-line title only (no chips: used while the agent pair is on screen) */
  syncTitle: { x: 520, y: 110, w: 900, h: 90 },
  /** bug-sync: ch05-s04's top strip (chips + title) */
  syncTop: { x: 520, y: 80, w: 900, h: 120 },
  /** runs @ list 3668: the Test Runs heading + eight rows (no chat column, no tab strip) */
  runsTable: { x: 500, y: 112, w: 940, h: 458 },
  /** runs @ list 3668: the top of the same table (ch06-s01 tile B) */
  runsTableTop: { x: 500, y: 112, w: 940, h: 280 },
  /** schedule @ add-env 11458: the green 'Tue at 3:00 AM · America/New_York' chip alone */
  scheduleChip: { x: 1050, y: 166, w: 245, h: 32 },
  /** schedule @ add-env 11458: 'Add environment' + its grey line */
  scheduleAddEnv: { x: 300, y: 266, w: 420, h: 54 },
  /** insights @ stats 2926: the five stat tiles */
  insightsStats: { x: 330, y: 160, w: 860, h: 100 },
  /** new-project: the chat input row */
  newProjectInput: { x: 500, y: 290, w: 680, h: 80 },
  /** new-project: eyebrow, heading, sub-copy, input, Start setup, callout */
  newProjectCard: { x: 470, y: 70, w: 760, h: 420 },
} as const satisfies Record<string, Crop>;

/** stage-px height a crop takes when shown `w` stage px wide */
export const cropH = (crop: Crop, w: number) => (crop.h * w) / crop.w;

/** stage px of a recording-px point inside a crop shown at box {x, y, w} (zoom 1, no tilt) */
export function recToStage(crop: Crop, box: { x: number; y: number; w: number }, p: { x: number; y: number }) {
  const k = box.w / crop.w;
  return { x: box.x + (p.x - crop.x) * k, y: box.y + (p.y - crop.y) * k };
}

/** title-safe area of the 1280 x 720 stage (keep type inside) */
export const SAFE = { x0: 64, y0: 36, x1: 1216, y1: 684 } as const;
