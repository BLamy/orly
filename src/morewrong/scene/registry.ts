// Per-book art-direction registry. Each book's visuals live in one file,
// `scene/book-NN.tsx`, exporting `scene(props) => ReactNode | null`. This glob
// auto-discovers them by number, so books can be art-directed in parallel with
// no shared-file edits — a missing or null-returning book falls back to
// GenericScene. Book number is parsed from the filename.
import type { ReactNode } from 'react';

export type BookScene = (props: {
  nodeId: string;
  controlGap: number;
  /** the player's live flags — used by Book 20's ledger; other books ignore it */
  flags?: Record<string, number | boolean>;
}) => ReactNode | null;

const mods = import.meta.glob('./book-*.tsx', { eager: true }) as Record<
  string,
  { scene?: BookScene }
>;

const registry: Record<number, BookScene> = {};
for (const [path, mod] of Object.entries(mods)) {
  const m = path.match(/book-(\d+)\.tsx$/);
  if (m && typeof mod.scene === 'function') registry[Number(m[1])] = mod.scene;
}

/** The art-directed scene renderer for a book, or undefined to use GenericScene. */
export function bookScene(bn: number): BookScene | undefined {
  return registry[bn];
}
