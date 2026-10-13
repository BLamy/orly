/**
 * neural-net-history — THE ONE STUDY STATE TABLE (script.json staging: caseBoard, questionThread,
 * candleClock, wallOfForecasts, xrayColumn). No shot author re-derives the study: every study shot
 * renders the board, shelf, Wall and X-ray from these functions and animates only its own beat's
 * change on top.
 *
 *   boardStateAt(shotId, 'start' | 'end')   cards present, lit/flicker states, threads, Q cards, K tilt …
 *   shelfStateAt(shotId, 'start' | 'end')   every candle with rings burned, state, tag (in shelf order)
 *   wallStateAt(shotId, 'start' | 'end')    every Wall slot W1–W8 and its slip state
 *   xrayBandsAt(shotId, 'start' | 'end')    which of the seven bands are lit
 *   FINAL_SHELF                             the shelf as it stands at the end (the ch01-s05 ghost glimpse,
 *                                           the ch15-s08 bar chart in wax), before the viewer's new candle
 *
 * 'start' = before the shot's own events (what the shot opens on); 'end' = after them (what it hands
 * on). A shot that pins/lights/drops something animates from 'start' to 'end' at its beat.
 * Order is the locked clock's shot order (timeline.json), so ch12-s07 precedes ch12-s03 etc.
 */
import timeline from '../timeline.json';

export type Moment = 'start' | 'end';

const ORDER: string[] = (timeline as { shots: { id: string }[] }).shots.map((s) => s.id);
const IDX = new Map(ORDER.map((id, i) => [id, i]));
export function shotIndex(id: string): number {
  const i = IDX.get(id);
  if (i === undefined) throw new Error(`studyState: unknown shot ${id}`);
  return i;
}
/** true when shot `id` (at moment `when`) is at or after the event shot `ev` */
function reached(id: string, when: Moment, ev: string): boolean {
  const a = shotIndex(id), b = shotIndex(ev);
  return when === 'end' ? a >= b : a > b;
}

// =====================================================================================================
// CASE BOARD (BOARD MAP). Board-local units: the cork is 1000 × 620, origin top-left.
// =====================================================================================================
export type SlotId =
  | 'K' | 'S1' | 'S2' | 'S3'
  | 'C1' | 'C1-a' | 'C1-b' | 'C1-c'
  | 'C2-a' | 'C2-h' | 'C2-b' | 'C2-row' | 'C2-d'
  | 'C3-a' | 'C3-b' | 'C3-c' | 'C3-d'
  | 'C4-lineage' | 'C4-a' | 'C4-b'
  | 'F1' | 'F2' | 'O';

/** what a card shows: a paper-cut object icon, typed text, or both */
export type CardIcon =
  | 'question' | 'key-tree' | 'drawer' | 'lantern' | 'threshold-lantern' | 'typed' | 'knob' | 'scissors' | 'bead' | 'stencil-pipe'
  | 'tiles' | 'furnaces' | 'filter' | 'thread' | 'sort' | 'shears' | 'row' | 'announcement' | 'chatbox';

export interface SlotDef {
  id: SlotId;
  /** card centre, board units */
  x: number;
  y: number;
  w: number;
  h: number;
  icon: CardIcon;
  /** typed lettering on the card (Special Elite); kept short */
  text?: string;
  /** the shot that pins it */
  pinned: string;
  /** cards it is tied to by threads of light once pinned */
  ties?: SlotId[];
  note?: string;
}

export const BOARD = { w: 1000, h: 620, threadY: 34 } as const;

export const SLOTS: Record<SlotId, SlotDef> = {
  K: { id: 'K', x: 500, y: 300, w: 170, h: 112, icon: 'typed', text: 'WHO TAUGHT IT?', pinned: 'ch01-s04', note: 'case card; tilted ch12-s08, straightened ch13-s06, drops ch15-s08, stamped STATUS: OPEN ch15-s09' },
  S1: { id: 'S1', x: 80, y: 150, w: 118, h: 96, icon: 'key-tree', text: 'RULES', pinned: 'ch01-s05' },
  S2: { id: 'S2', x: 80, y: 300, w: 118, h: 96, icon: 'drawer', text: 'KNOWLEDGE', pinned: 'ch01-s05' },
  S3: { id: 'S3', x: 80, y: 450, w: 118, h: 96, icon: 'lantern', text: 'LEARNING', pinned: 'ch01-s05' },
  // C1 (1943–1969): the input column
  C1: { id: 'C1', x: 230, y: 130, w: 104, h: 84, icon: 'threshold-lantern', text: '1943', pinned: 'ch02-s08' },
  'C1-a': { id: 'C1-a', x: 230, y: 236, w: 104, h: 70, icon: 'typed', text: 'THE STRUCTURE OF THE NET DOES NOT CHANGE WITH TIME.', pinned: 'ch02-s03', note: "the 1943 paper's fifth assumption (footnote slot)" },
  'C1-b': { id: 'C1-b', x: 230, y: 350, w: 104, h: 84, icon: 'knob', text: '1958', pinned: 'ch03-s09', ties: ['C1'] },
  'C1-c': { id: 'C1-c', x: 230, y: 470, w: 104, h: 76, icon: 'typed', text: 'BACK-PROPAGATING ERROR-CORRECTION EXPERIMENTS · 1961 ?', pinned: 'ch03-s08', note: 'the false clue, tagged with an oxblood question mark; revisited ch05-s06' },
  // C2 (1969–1997)
  'C2-a': { id: 'C2-a', x: 370, y: 130, w: 104, h: 84, icon: 'scissors', text: '1969', pinned: 'ch04-s08', ties: ['C1-b'] },
  'C2-h': { id: 'C2-h', x: 370, y: 222, w: 96, h: 56, icon: 'typed', text: 'HELSINKI · 1970', pinned: 'ch04-s08', note: 'lit ch05-s06' },
  'C2-b': { id: 'C2-b', x: 370, y: 330, w: 104, h: 84, icon: 'bead', text: '1986', pinned: 'ch05-s10', ties: ['C1-b', 'C2-h', 'C2-a'] },
  'C2-row': { id: 'C2-row', x: 370, y: 432, w: 112, h: 56, icon: 'row', text: 'KELLEY 1960 … LE CUN 1985', pinned: 'ch05-s06', note: 'the backpropagation credit cluster, a loose row of small cards' },
  'C2-d': { id: 'C2-d', x: 370, y: 536, w: 104, h: 84, icon: 'stencil-pipe', text: '1989', pinned: 'ch06-s08', ties: ['C2-b'] },
  // C3 (2006–2017)
  // (C3 sits ≈ 38 px lower than C1/C2 and on a 94 px pitch, so C3-a clears the Q3 card on the thread)
  'C3-a': { id: 'C3-a', x: 640, y: 168, w: 104, h: 84, icon: 'tiles', text: 'DATA', pinned: 'ch07-s06' },
  'C3-b': { id: 'C3-b', x: 640, y: 262, w: 104, h: 84, icon: 'furnaces', text: 'FIRE', pinned: 'ch07-s06' },
  'C3-c': { id: 'C3-c', x: 640, y: 356, w: 104, h: 84, icon: 'filter', text: '2012', pinned: 'ch08-s14', ties: ['C2-d', 'C3-a', 'C3-b'] },
  'C3-d': { id: 'C3-d', x: 640, y: 450, w: 104, h: 84, icon: 'thread', text: '2017', pinned: 'ch11-s01', ties: ['C3-c'], note: 'handed on from ch10-s14 to the ch11-s01 lead-in' },
  // C4 (2018–2023)
  'C4-lineage': { id: 'C4-lineage', x: 712, y: 160, w: 60, h: 60, icon: 'typed', text: 'GENERATING WIKIPEDIA · 2018 · GPT', pinned: 'ch11-s02', note: 'small cards hung in the gutter between C3 and C4' },
  'C4-a': { id: 'C4-a', x: 790, y: 250, w: 104, h: 84, icon: 'sort', text: '2018', pinned: 'ch11-s08', ties: ['C3-d', 'C4-lineage'] },
  'C4-b': { id: 'C4-b', x: 790, y: 360, w: 104, h: 84, icon: 'shears', text: '2022', pinned: 'ch12-s07', ties: ['C4-a'] },
  // founding row beneath C3 and C4 (same height and size)
  F1: { id: 'F1', x: 640, y: 545, w: 112, h: 70, icon: 'announcement', text: 'OPENAI · 11 DEC 2015', pinned: 'ch09-s04' },
  F2: { id: 'F2', x: 790, y: 545, w: 112, h: 70, icon: 'announcement', text: 'ANTHROPIC · 28 MAY 2021', pinned: 'ch12-s03' },
  // the output: the glowing chat box at the far right
  O: { id: 'O', x: 925, y: 300, w: 96, h: 150, icon: 'chatbox', pinned: 'ch02-s08', note: 'the chat box (output); also drawn as the X-ray column' },
};

/** the question cards on the oxblood thread along the top edge (x in board units) */
export const Q_SLOTS = { Q1: 270, Q2: 450, Q3: 620, Q4: 500 } as const;
export type QSlot = keyof typeof Q_SLOTS;
interface QEvent { shot: string; slot: QSlot; text: string | null; how?: 'hung' | 'replaced' | 'burnsOut' | 'unpinned' }
const Q_EVENTS: QEvent[] = [
  { shot: 'ch02-s03', slot: 'Q1', text: 'How could a net rewire itself?', how: 'hung' },
  { shot: 'ch03-s05', slot: 'Q1', text: 'AND IF NO STRAIGHT LINE EXISTS?', how: 'replaced' },
  { shot: 'ch04-s08', slot: 'Q1', text: 'THEN HOW DO YOU TRAIN THE HIDDEN LAYER?', how: 'replaced' },
  { shot: 'ch05-s04', slot: 'Q1', text: null, how: 'burnsOut' },
  { shot: 'ch06-s05', slot: 'Q2', text: 'WHO PAID FOR DINNER?', how: 'hung' },
  { shot: 'ch07-s01', slot: 'Q2', text: null, how: 'unpinned' },
  { shot: 'ch06-s08', slot: 'Q3', text: 'WHY WOULD ANYONE CHOOSE THE FOG?', how: 'hung' },
  { shot: 'ch08-s13b', slot: 'Q3', text: null, how: 'unpinned' },
  { shot: 'ch15-s08', slot: 'Q4', text: 'How, exactly, does it reach its answer?', how: 'hung' },
];

export type SuspectLight = 'dark' | 'flicker' | 'lit' | 'glow' | 'grey';
export interface CardState extends SlotDef {
  /** lit from within (S2 KNOWLEDGE from ch05-s07, the Helsinki card from ch05-s06) */
  lit: boolean;
  /** S3's lantern: dark → flicker (ch03-s09, ch05-s10, momentary) → glow (ch15-s08) */
  lantern?: SuspectLight;
  /** this shot pins/changes it (only in the 'start' view: the card the shot itself animates) */
  pending?: boolean;
}
export interface BoardState {
  cards: CardState[];
  /** threads of light between pinned cards */
  threads: [SlotId, SlotId][];
  questions: { slot: QSlot; x: number; text: string }[];
  /** K card tilt, radians (ch12-s08 tilts, ch13-s06 straightens) */
  kTilt: number;
  /** K has dropped from its pin (ch15-s08) */
  kDropped: boolean;
  /** K stamped STATUS: OPEN (ch15-s09) */
  kStamped: boolean;
  /** the board has become a lantern network (ch15-s08 end) */
  network: boolean;
  /** cards this shot pins (for the shot to animate in) */
  pinsThisShot: SlotId[];
}

export function boardStateAt(shotId: string, when: Moment = 'start'): BoardState {
  const cards: CardState[] = [];
  const pinsThisShot: SlotId[] = [];
  for (const def of Object.values(SLOTS)) {
    if (def.pinned === shotId) pinsThisShot.push(def.id);
    if (!reached(shotId, when, def.pinned)) continue;
    const c: CardState = { ...def, lit: false };
    if (def.id === 'S2') c.lit = reached(shotId, when, 'ch05-s07');
    if (def.id === 'C2-h') c.lit = reached(shotId, when, 'ch05-s06');
    if (def.id === 'S3') c.lantern = reached(shotId, when, 'ch15-s08') ? 'glow' : 'dark';
    if (def.id === 'S1' || def.id === 'S2') {
      if (reached(shotId, when, 'ch15-s08')) c.lantern = 'grey';
    }
    cards.push(c);
  }
  const threads: [SlotId, SlotId][] = [];
  for (const c of cards) for (const t of c.ties ?? []) if (cards.some((d) => d.id === t)) threads.push([c.id, t]);
  const qs = new Map<QSlot, string | null>();
  for (const e of Q_EVENTS) if (reached(shotId, when, e.shot)) qs.set(e.slot, e.text);
  const questions = [...qs.entries()].filter(([, t]) => t).map(([slot, text]) => ({ slot, x: Q_SLOTS[slot], text: text as string }));
  let kTilt = 0;
  if (reached(shotId, when, 'ch12-s08')) kTilt = -0.09;
  if (reached(shotId, when, 'ch13-s06')) kTilt = 0;
  return {
    cards,
    threads,
    questions,
    kTilt,
    kDropped: reached(shotId, when, 'ch15-s08'),
    kStamped: reached(shotId, when, 'ch15-s09'),
    network: reached(shotId, when, 'ch15-s08'),
    pinsThisShot,
  };
}

/** the shots in which S3 LEARNING's lantern flickers (momentarily, under the shot's own beat) */
export const S3_FLICKERS = ['ch03-s09', 'ch05-s10'] as const;

// =====================================================================================================
// CANDLE SHELF (CANDLE-CLOCK RULE). Every candle is cut to 45 rings at 6 px per ring at L3 (270 px).
// =====================================================================================================
export const RING_PX = 6;
export const RINGS = 45;
export const LIT_HEIGHT = RING_PX * RINGS; // 270

export type CandleKind = 'candle' | 'taper' | 'match' | 'blank';
export type CandleEnd = 'out' | 'guttered';
export interface CandleDef {
  id: string;
  /** lettering (Special Elite small caps; a paraphrase, never in quotes) */
  text: string;
  /** base tag (year lit) */
  tag: string;
  litYear: number;
  /** rings burned when it ends; null = still burning as of October 2026 */
  years: number | null;
  /** the shot that lights it / ends it */
  lit: string;
  end?: string;
  how?: CandleEnd;
  /** the end date is interpretive: frayed rim, "c." on the tag */
  frayed?: boolean;
  kind: CandleKind;
  /** shelf group: the China-race candles stand at the right end, by the study window */
  group: 'main' | 'window' | 'end';
  /** extra state notes (trimmed wick, contested) */
  note?: string;
}

export const CANDLES: CandleDef[] = [
  { id: 'logic', text: 'THE BRAIN IS A LOGIC MACHINE', tag: '1943', litYear: 1943, years: 16, lit: 'ch02-s04', end: 'ch02-s08', how: 'out', kind: 'candle', group: 'main' },
  { id: 'learns', text: 'A MACHINE THAT LEARNS WILL SOON SEE, TALK AND THINK', tag: '1958', litYear: 1958, years: 7, lit: 'ch03-s03', end: 'ch03-s09', how: 'guttered', frayed: true, kind: 'candle', group: 'main' },
  { id: 'sterile', text: 'MANY-LAYERED NETS ARE A STERILE EXTENSION', tag: '1969', litYear: 1969, years: 17, lit: 'ch04-s02', end: 'ch05-s04', how: 'out', kind: 'candle', group: 'main' },
  { id: 'knowledge', text: 'INTELLIGENCE IS KNOWLEDGE, TYPED IN BY HAND', tag: 'c. 1980', litYear: 1980, years: 7, lit: 'ch05-s07', end: 'ch05-s09b', how: 'guttered', frayed: true, kind: 'candle', group: 'main' },
  { id: 'cyc', text: 'CYC', tag: '1984', litYear: 1984, years: 39, lit: 'ch05-s09b', end: 'ch13-s06', how: 'out', kind: 'taper', group: 'main', note: 'thin taper; goes out wordless in the lead-in of ch13-s06 (Lenat, 2023)' },
  { id: 'fiddly', text: 'NEURAL NETS ARE FIDDLY, AND BEATEN ANYWAY', tag: 'MID-1990s', litYear: 1996, years: 16, lit: 'ch06-s04', end: 'ch08-s13b', how: 'out', frayed: true, kind: 'candle', group: 'main' },
  { id: 'inorder', text: 'LANGUAGE MUST BE READ IN ORDER', tag: '1997', litYear: 1997, years: 20, lit: 'ch10-s01', end: 'ch10-s13b', how: 'out', kind: 'candle', group: 'main' },
  { id: 'experts', text: 'TO SEE, A MACHINE NEEDS FEATURES DESIGNED BY EXPERTS', tag: '1999', litYear: 1999, years: 13, lit: 'ch08-s01', end: 'ch08-s13b', how: 'out', kind: 'candle', group: 'main' },
  { id: 'warmup', text: 'DEEP NETS MUST BE WARMED UP LAYER BY LAYER', tag: '2006', litYear: 2006, years: 5, lit: 'ch07-s02', end: 'ch07-s06', how: 'guttered', frayed: true, kind: 'candle', group: 'main' },
  { id: 'learned', text: 'LEARNED FEATURES, GIVEN DATA AND ARITHMETIC', tag: '2012', litYear: 2012, years: null, lit: 'ch08-s13b', kind: 'candle', group: 'main', note: 'still burning as of October 2026' },
  { id: 'go', text: 'A GO MACHINE IS A DECADE AWAY', tag: '2014', litYear: 2014, years: 2, lit: 'ch09-s03a', end: 'ch09-s03', how: 'out', kind: 'candle', group: 'main' },
  { id: 'scale', text: 'SCALE IS THE MAIN LEVER', tag: '2020', litYear: 2020, years: null, lit: 'ch11-s05', kind: 'candle', group: 'main', note: 'still burning, contested; wick trimmed (not snuffed) in ch15-s04' },
  { id: 'worry', text: 'SMARTER-THAN-HUMAN AI MAY BE YEARS AWAY, AND DANGEROUS', tag: '2023', litYear: 2023, years: null, lit: 'ch13-s03', kind: 'candle', group: 'main', note: 'still burning' },
  { id: 'chokepoint', text: 'COMPUTE IS THE CHOKEPOINT', tag: '2022', litYear: 2022, years: null, lit: 'ch14-s02', kind: 'candle', group: 'window', note: 'still burning, contested' },
  { id: 'behind', text: 'CHINA IS A YEAR OR TWO BEHIND', tag: '2022', litYear: 2022, years: 2, lit: 'ch14-s02', end: 'ch14-s04', how: 'out', frayed: true, kind: 'candle', group: 'window' },
  { id: 'match', text: "COMPUTE DOESN'T MATTER", tag: 'JAN 2025', litYear: 2025, years: 0, lit: 'ch14-s04', end: 'ch14-s04', how: 'out', kind: 'match', group: 'window', note: 'struck and out within a day; lies flat, blackened' },
  { id: 'gap', text: 'THE GAP IS MONTHS, NOT YEARS', tag: '2025', litYear: 2025, years: null, lit: 'ch14-s07', kind: 'candle', group: 'window', note: 'still burning, contested' },
  { id: 'new', text: '', tag: '', litYear: 2026, years: null, lit: 'ch15-s09', kind: 'blank', group: 'end', note: 'unlettered, unscored; lit by a hand from the viewer’s side' },
];

/** the narrative year at the END of each shot (monotone: the clock never un-burns a candle) */
const YEAR_OVERRIDE: Record<string, number> = {
  'ch02-s01': 1941, 'ch02-s02': 1943, 'ch02-s03': 1943, 'ch02-s04': 1950, 'ch02-s05': 1949, 'ch02-s05b': 1950, 'ch02-s07': 1956, 'ch02-s08': 1959,
  'ch03-s01': 1958, 'ch03-s02': 1958, 'ch03-s03': 1958, 'ch03-s04': 1960, 'ch03-s05': 1960, 'ch03-s06': 1958, 'ch03-s08': 1961, 'ch03-s09': 1965,
  'ch04-s01': 1969, 'ch04-s02': 1969, 'ch04-s03': 1969, 'ch04-s04': 1969, 'ch04-s05': 1972, 'ch04-s06': 1973, 'ch04-s07': 1975, 'ch04-s08': 1976,
  'ch05-s01': 1981, 'ch05-s03': 1985, 'ch05-s04': 1986, 'ch05-s05': 1986, 'ch05-s06': 1986, 'ch05-s07': 1980, 'ch05-s08': 1985, 'ch05-s09b': 1987, 'ch05-s10': 1988,
  'ch06-s01': 1989, 'ch06-s02': 1996, 'ch06-s03': 1998, 'ch06-s04': 2004, 'ch06-s05': 1995, 'ch06-s06': 1997, 'ch06-s07': 2000, 'ch06-s08': 2000,
  'ch07-s01': 2006, 'ch07-s02': 2006, 'ch07-s03': 2009, 'ch07-s04': 2011, 'ch07-s06': 2012,
  'ch08-s01': 2011, 'ch08-s13b': 2012, 'ch08-s14': 2012, 'ch09-s01': 2012, 'ch09-s03a': 2014, 'ch09-s03': 2016, 'ch09-s04': 2015, 'ch09-s05': 2017,
  'ch10-s01': 2017, 'ch10-s13b': 2017, 'ch10-s14': 2018, 'ch11-s01': 2018, 'ch11-s02': 2019, 'ch11-s03': 2019, 'ch11-s05': 2020, 'ch11-s08': 2022,
  'ch12-s01': 2022, 'ch12-s02': 2022, 'ch12-s06': 2022, 'ch12-s07': 2022, 'ch12-s03': 2022, 'ch12-s08': 2023,
  'ch13-s01': 2023, 'ch13-s02': 2023, 'ch13-s03': 2023, 'ch13-s04': 2023, 'ch13-s06': 2023,
  'ch14-s01': 2024, 'ch14-s02': 2024, 'ch14-s03': 2024, 'ch14-s04': 2025, 'ch14-s04b': 2025, 'ch14-s05': 2025, 'ch14-s06': 2026, 'ch14-s07': 2026,
  'ch15-s01': 2026, 'ch15-s03': 2026, 'ch15-s04': 2026, 'ch15-s05': 2026, 'ch15-s06': 2026, 'ch15-s07': 2026, 'ch15-s08': 2026, 'ch15-s09': 2026, 'ch15-s10': 2026,
};
const YEAR: number[] = (() => {
  let y = 1941;
  return ORDER.map((id) => {
    if (id.startsWith('ch01')) return 2026; // the prologue is "now"
    const o = YEAR_OVERRIDE[id];
    if (o !== undefined) y = Math.max(y, o);
    return y;
  });
})();
/** narrative year at the end of a shot (the prologue counts as 2026) */
export function yearAt(shotId: string): number {
  return YEAR[shotIndex(shotId)];
}

export type CandleState = 'unlit' | 'live' | 'out' | 'guttered';
export interface CandleView extends CandleDef {
  /** position along the shelf, left → right (0-based; the shelf painter spaces them) */
  slot: number;
  state: CandleState;
  /** rings burned (= ghost sleeve length in rings) */
  rings: number;
  /** a thread of smoke above it (put out recently or still smoking in the haze) */
  smoke: boolean;
  /** this shot lights / ends it (only meaningful in the 'start' view) */
  changesThisShot?: 'lights' | 'ends' | 'lightsAndEnds';
  /** wick trimmed (scale, from ch15-s04) */
  trimmed?: boolean;
  /** drawn as a pale ghost (ch01-s05's glimpse of what the case will build) */
  ghost?: boolean;
}

/** shelf order: by the year on the base tag, the China-race candles at the right end by the window, then the viewer's candle */
export const SHELF_ORDER: string[] = [
  ...CANDLES.filter((c) => c.group === 'main').sort((a, b) => a.litYear - b.litYear || CANDLES.indexOf(a) - CANDLES.indexOf(b)).map((c) => c.id),
  ...CANDLES.filter((c) => c.group === 'window').map((c) => c.id),
  'new',
];

function viewOf(def: CandleDef, shotId: string | null, when: Moment): CandleView {
  const slot = SHELF_ORDER.indexOf(def.id);
  const v: CandleView = { ...def, slot, state: 'unlit', rings: 0, smoke: false };
  if (shotId === null) {
    // FINAL: the shelf as it stands in October 2026, before the viewer's candle
    if (def.id === 'new') return v;
    if (def.years === null) {
      v.state = 'live';
      v.rings = Math.max(0, 2026 - def.litYear);
    } else {
      v.state = def.how === 'guttered' ? 'guttered' : 'out';
      v.rings = def.years;
    }
    v.smoke = v.state !== 'live' && def.kind !== 'match';
    v.trimmed = def.id === 'scale';
    return v;
  }
  if (def.lit === shotId) v.changesThisShot = def.end === shotId ? 'lightsAndEnds' : 'lights';
  else if (def.end === shotId) v.changesThisShot = 'ends';
  if (!reached(shotId, when, def.lit)) return v;
  if (def.end && reached(shotId, when, def.end)) {
    v.state = def.how === 'guttered' ? 'guttered' : 'out';
    v.rings = def.years ?? 0;
    // smoke rises for a while after a candle goes out (the shot that ends it and the next study visits)
    v.smoke = def.kind !== 'match' && shotIndex(shotId) - shotIndex(def.end) <= 6;
    return v;
  }
  v.state = 'live';
  const y = when === 'start' && def.lit !== shotId ? yearAt(ORDER[Math.max(0, shotIndex(shotId) - 1)]) : yearAt(shotId);
  v.rings = def.kind === 'blank' ? 0 : Math.max(0, Math.min(def.years ?? 99, y - def.litYear));
  if (def.lit === shotId) v.rings = 0; // just lit: the flame on the top ring
  v.trimmed = def.id === 'scale' && reached(shotId, when, 'ch15-s04');
  return v;
}

/** every candle in shelf order with its state at the shot (unlit candles are simply not on the shelf yet) */
export function shelfStateAt(shotId: string, when: Moment = 'start'): CandleView[] {
  if (shotId.startsWith('ch01')) return FINAL_SHELF.map((c) => ({ ...c, ghost: true }) as CandleView);
  return SHELF_ORDER.map((id) => viewOf(CANDLES.find((c) => c.id === id)!, shotId, when));
}
/** the shelf in October 2026 (ch01-s05's ghost glimpse; ch15-s08's bar chart in wax) */
export const FINAL_SHELF: CandleView[] = SHELF_ORDER.map((id) => viewOf(CANDLES.find((c) => c.id === id)!, null, 'end'));

// =====================================================================================================
// WALL OF FORECASTS (slots W1–W8, left to right from the lamp outward)
// =====================================================================================================
export type WallSlot = 'W1' | 'W2' | 'W3' | 'W4' | 'W5' | 'W6' | 'W7' | 'W8';
export type SlipState = 'empty' | 'pinned' | 'shadow' | 'yellowed' | 'curled' | 'down' | 'gone';
export interface SlipDef {
  slot: WallSlot;
  who: string;
  /** a short typed line for the slip (on-screen text as the script gives it) */
  text: string;
  due?: string;
  pinned: string;
  events: { shot: string; state?: SlipState; glint?: boolean; stir?: boolean; read?: boolean }[];
}
export const SLIPS: SlipDef[] = [
  { slot: 'W1', who: 'TURING · DUE 2000', text: '3 in 10 fooled', pinned: 'ch02-s05b', events: [{ shot: 'ch06-s07', state: 'curled' }, { shot: 'ch11-s05', stir: true }] },
  { slot: 'W2', who: 'SIMON & NEWELL · 1958', text: 'SIMON & NEWELL · CHESS CHAMPION BY 1968', due: '1968', pinned: 'ch03-s06', events: [{ shot: 'ch04-s08', state: 'yellowed' }, { shot: 'ch06-s07', state: 'down' }] },
  { slot: 'W3', who: 'ROSENBLATT · 1961', text: 'Linguistic capability, related to perceptual experience, is of the essence…', pinned: 'ch03-s08', events: [{ shot: 'ch12-s07', read: true }] },
  { slot: 'W4', who: 'KRIZHEVSKY, SUTSKEVER & HINTON · 2012', text: '…simply by waiting for faster GPUs and bigger datasets…', pinned: 'ch08-s14', events: [{ shot: 'ch11-s05', glint: true }] },
  { slot: 'W5', who: 'COULOM · MAY 2014', text: 'I think maybe ten years', due: '2024', pinned: 'ch09-s03a', events: [{ shot: 'ch09-s03', glint: true }] },
  { slot: 'W6', who: '', text: '30 TO 50 YEARS OR EVEN LONGER', pinned: 'ch01-s04', events: [{ shot: 'ch13-s01', state: 'down' }] },
  { slot: 'W7', who: 'HINTON · SEPT 2017', text: '…some graduate student who is deeply suspicious of everything I have said.', pinned: 'ch09-s05', events: [{ shot: 'ch15-s09', state: 'gone', read: true }] },
  { slot: 'W8', who: 'HASSABIS · 2025', text: 'AGI in 5 to 10 years · about even odds', pinned: 'ch15-s06', events: [] },
];
export interface SlipView extends SlipDef {
  state: SlipState;
  /** the pin glints this shot (came true early / its prophecy arrives) */
  glint: boolean;
  /** stirs this shot (Turing's echo) */
  stir: boolean;
  /** ghost slip (ch01-s05's glimpse only) */
  ghost: boolean;
  changesThisShot: boolean;
}
export function wallStateAt(shotId: string, when: Moment = 'start'): SlipView[] {
  return SLIPS.map((d) => {
    const v: SlipView = { ...d, state: 'empty', glint: false, stir: false, ghost: false, changesThisShot: d.pinned === shotId || d.events.some((e) => e.shot === shotId) };
    if (shotId.startsWith('ch01') && d.slot !== 'W6' && d.slot !== 'W8') {
      v.ghost = true; // pale, unreadable ghost slips in ch01-s05
      v.state = 'pinned';
      return v;
    }
    if (!reached(shotId, when, d.pinned)) return v;
    v.state = d.slot === 'W6' ? 'shadow' : 'pinned';
    if (shotId.startsWith('ch01') && d.slot === 'W6') return v;
    for (const e of d.events) {
      if (reached(shotId, when, e.shot) && e.state) v.state = e.state;
      if (e.shot === shotId && when === 'end') {
        v.glint = !!e.glint;
        v.stir = !!e.stir;
      }
    }
    // a curled or yellowed slip stays so; a slip that came down leaves a bare pin ('down')
    return v;
  });
}

// =====================================================================================================
// X-RAY COLUMN (seven bands, bottom → top; a seam between 3 and 4 that never lights)
// =====================================================================================================
export const XRAY_BANDS = [
  { band: 1, what: 'threshold lanterns', year: 1943, lit: 'ch02-s08' },
  { band: 2, what: 'adjustable knobs', year: 1958, lit: 'ch03-s09' },
  { band: 3, what: 'hidden layers and a backward arrow', year: 1986, lit: 'ch05-s10' },
  { band: 4, what: 'furnaces and a sea of text', year: 2012, lit: 'ch07-s06' },
  { band: 5, what: 'threads', year: 2017, lit: 'ch11-s01' },
  { band: 6, what: 'type sorts', year: 2018, lit: 'ch11-s03' },
  { band: 7, what: 'shears', year: 2022, lit: 'ch12-s07' },
] as const;
export interface XrayState {
  /** lit[i] for band i+1 */
  lit: boolean[];
  /** the band this shot lights (1-based), if any */
  lightsThisShot: number | null;
  /** band 7's dark shears-shaped slot glints (ch12-s01) */
  slotGlint: boolean;
  /** the whole column fully lit (ch12-s07 end onward) */
  complete: boolean;
}
export function xrayBandsAt(shotId: string, when: Moment = 'start'): XrayState {
  const lit = XRAY_BANDS.map((b) => reached(shotId, when, b.lit));
  const own = XRAY_BANDS.find((b) => b.lit === shotId);
  return { lit, lightsThisShot: own ? own.band : null, slotGlint: shotId === 'ch12-s01', complete: lit.every(Boolean) };
}

/** everything at once (the spine-gate contact sheet) */
export function studyStateAt(shotId: string, when: Moment = 'start') {
  return { board: boardStateAt(shotId, when), shelf: shelfStateAt(shotId, when), wall: wallStateAt(shotId, when), xray: xrayBandsAt(shotId, when), year: yearAt(shotId) };
}

// =====================================================================================================
// CANDLE NAMING (review round 1, art + teacher): "whenever narration names a candle, rotate its label
// horizontal and enlarge it beside the flame for about 2 s with its date range, and dim the neighbouring
// candles". The words that name each candle, per shot; the shelf painter (beliefCandle.ts candleShelf) applies
// the rule by itself in every shot that draws the shelf (it reads the painting shot from core/paintContext).
// A shot that draws candles another way can call candleNamingAt(shotId, T, t) and pass `named` itself.
// =====================================================================================================
export interface CandleCue {
  candle: string;
  line: string;
  /** the word that names it (T.word syntax) */
  word: string;
}
export const CANDLE_CUES: Record<string, CandleCue[]> = {
  'ch02-s04': [{ candle: 'logic', line: 'L0209', word: 'brain' }],
  'ch02-s08': [{ candle: 'logic', line: 'L0219', word: 'candle' }],
  'ch03-s03': [{ candle: 'learns', line: 'L0305', word: 'second' }],
  'ch03-s09': [{ candle: 'learns', line: 'L0319', word: 'candle' }],
  'ch04-s02': [{ candle: 'sterile', line: 'L0405', word: 'third' }],
  'ch05-s03': [{ candle: 'sterile', line: 'L0505', word: 'sterile' }],
  'ch05-s04': [{ candle: 'sterile', line: 'L0521', word: 'candle' }],
  'ch05-s07': [{ candle: 'knowledge', line: 'L0513', word: 'candle' }],
  'ch05-s09b': [{ candle: 'knowledge', line: 'L0522', word: 'candle' }],
  'ch06-s04': [{ candle: 'fiddly', line: 'L0608', word: 'candle' }],
  'ch07-s02': [{ candle: 'warmup', line: 'L0702', word: 'candle' }],
  'ch07-s06': [{ candle: 'warmup', line: 'L0710', word: 'candle' }],
  'ch08-s13b': [
    { candle: 'experts', line: 'L0826', word: 'candle' },
    { candle: 'fiddly', line: 'L0831', word: 'candle' },
  ],
  'ch10-s01': [{ candle: 'inorder', line: 'L1002', word: 'candle' }],
  'ch11-s05': [{ candle: 'scale', line: 'L1112', word: 'candle' }],
  'ch13-s03': [{ candle: 'worry', line: 'L1307', word: 'candle' }],
  'ch13-s06': [{ candle: 'cyc', line: 'L1316', word: 'longest' }],
  'ch14-s02': [
    { candle: 'chokepoint', line: 'L1405', word: 'chokepoint' },
    { candle: 'behind', line: 'L1405', word: 'China' },
  ],
  'ch14-s04b': [
    { candle: 'match', line: 'L1410', word: 'match' },
    { candle: 'behind', line: 'L1410b', word: 'China' },
  ],
  'ch14-s07': [
    { candle: 'gap', line: 'L1417', word: 'candle' },
    { candle: 'chokepoint', line: 'L1418', word: 'chokepoint' },
  ],
};
/** how long the named label holds (s) and its fades */
export const NAMING = { lead: 0.15, rise: 0.35, hold: 2.2, fall: 0.5 } as const;
const sm01 = (x: number) => {
  const u = x < 0 ? 0 : x > 1 ? 1 : x;
  return u * u * (3 - 2 * u);
};
/** { candleId: 0..1 } at shot-local t: how strongly each candle is being named right now */
export function candleNamingAt(shotId: string, T: { word(line: string, w: string): number }, t: number): Record<string, number> {
  const out: Record<string, number> = {};
  for (const q of CANDLE_CUES[shotId] ?? []) {
    let at: number;
    try {
      at = T.word(q.line, q.word) - NAMING.lead;
    } catch {
      continue; // the line was rewritten: the cue table needs the new word (the rule simply does not fire)
    }
    const k = Math.min(sm01((t - at) / NAMING.rise), sm01((at + NAMING.rise + NAMING.hold + NAMING.fall - t) / NAMING.fall));
    if (k > 0) out[q.candle] = Math.max(out[q.candle] ?? 0, k);
  }
  return out;
}
/** "lit 1969 · out 1986 · 17 years" / "lit 2012 · still burning" (the date range on a named candle's label) */
export function candleDates(v: CandleDef): string {
  const lit = /^\d{4}$/.test(v.tag) ? v.tag : v.tag || String(v.litYear);
  if (v.kind === 'match') return `struck ${v.tag} · out within a day`;
  if (v.years == null) return `lit ${lit} · still burning`;
  const end = v.litYear + v.years;
  const verb = v.how === 'guttered' ? 'guttered' : 'out';
  return `lit ${lit} · ${verb} ${v.frayed ? 'c. ' : ''}${end} · ${v.years} years`;
}
