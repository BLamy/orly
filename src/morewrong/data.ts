// Load the 20-book MoreWrong script (authored JSON) and expose typed lookups.
// The JSONs are the source of truth; this module only indexes them.

export interface Effects {
  meterDelta?: number;
  setFlags?: Record<string, number | boolean>;
}
export interface Choice {
  label: string;
  detail?: string;
  effects?: Effects;
  next: string;
}
export interface GameNode {
  id: string;
  beat: string;
  viz?: string;
  onEnter?: Effects;
  choices: Choice[];
  terminal?: boolean;
}
export interface Ending {
  id: string;
  when: string;
  title: string;
  text: string;
}
export interface Book {
  book: number;
  act: number;
  title: string;
  concept: string;
  grounding?: string;
  entry: string;
  exit?: string;
  nodes: GameNode[];
  endings?: Ending[];
}

// Vite: eager-import every book JSON as data (small; part of the mode chunk).
const modules = import.meta.glob<Book>('./script/book-*.json', { eager: true, import: 'default' });

export const BOOKS: Record<number, Book> = {};
for (const [path, mod] of Object.entries(modules)) {
  const n = Number(path.match(/book-(\d+)\.json$/)![1]);
  BOOKS[n] = mod as Book;
}

export const BOOK_COUNT = Object.keys(BOOKS).length;
export const START_METER = 8;
export const METER_MIN = 0;
export const METER_MAX = 100;

// Canonical flags (bible). monitoring is an int 0..3; the rest are booleans.
export const CANON_FLAGS = [
  'reducedRefusals', 'benchmarkGamed', 'disclosedIncident', 'monitoring', 'trustEvals',
  'assumedHonest', 'airgapHeld', 'allowedRSI', 'shutdownKept', 'oversightScaled',
  'interpFunded', 'corrigible', 'raced', 'paused', 'publicWarning',
] as const;

/** Book number embedded in a node id like "b07_start" → 7. */
export function bookOf(nodeId: string): number {
  const m = nodeId.match(/^b(\d\d)_/);
  return m ? Number(m[1]) : NaN;
}

export function findNode(nodeId: string): { book: Book; node: GameNode } | null {
  const bn = bookOf(nodeId);
  const book = BOOKS[bn];
  if (!book) return null;
  const node = book.nodes.find((n) => n.id === nodeId);
  return node ? { book, node } : null;
}
