// Helpers shared by the desktop spine-shelf and the mobile browse UI.
import { useEffect, useState, type RefObject } from 'react';
import type { BookMeta } from './cover';

export const ASSET_BASE =
  (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
export const assetUrl = (p: string) => ASSET_BASE + String(p).replace(/^\//, '');

// The self-explaining "ORLY Loop" book always leads its shelf, regardless of the
// createdAt order the generator writes into library.json.
export const PINNED_SLUG = 'the-orly-loop';
export const RECENT_COUNT = 8;
export const LEAD_SERIES = 'The Explainers';
// This series is the shelf's showcase: it always leads (its own top row) and
// is excluded from the Recently Added strip.
export const FEATURED_SERIES = 'Daily Papers by Hugging Face';
export const CHRONOLOGICAL_SERIES = new Set([
  FEATURED_SERIES,
  'Fresh from arXiv',
]);

interface SeriesSortable {
  slug: string;
  createdAt?: string;
  seriesOrder?: number;
}

export function isChronologicalSeries(series?: string): boolean {
  return !!series && CHRONOLOGICAL_SERIES.has(series);
}

export function sortSeriesBooks<T extends SeriesSortable>(series: string, books: T[]): T[] {
  return books.sort((a, c) => {
    if (isChronologicalSeries(series)) {
      const byDate = (c.createdAt ?? '').localeCompare(a.createdAt ?? '');
      return byDate || a.slug.localeCompare(c.slug);
    }
    return (a.seriesOrder ?? 0) - (c.seriesOrder ?? 0);
  });
}

export function openBook(b: BookMeta) {
  window.location.href = ASSET_BASE + String(b.href).replace(/^\//, '');
}

// Some books (mostly the Nostr Implementation Possibilities and Buzz —
// non-repo explainers with no natural "animal") were generated without a
// cover engraving. Rather than a blank spine, borrow one already generated
// for another book — deterministic per slug (a hash, not Math.random) so a
// given book always gets the same borrowed animal instead of flickering
// between renders.
// Structural, not BookMeta — the player's own leaner SeriesBookMeta (fetched
// from the same library.json) also needs to resolve a fallback animal.
interface HasAnimal {
  slug: string;
  animal?: string;
}
let animalPool: string[] = [];
export function registerAnimalPool(books: HasAnimal[]) {
  animalPool = [...new Set(books.map((b) => b.animal).filter((a): a is string => !!a))];
}
function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) | 0;
  return Math.abs(h);
}
export function resolveAnimal(book: HasAnimal): string | null {
  if (book.animal) return book.animal;
  if (!animalPool.length) return null;
  return animalPool[hashSlug(book.slug) % animalPool.length];
}

export interface Shelves {
  featured: [string, BookMeta[]] | null; // the showcase series, always the top row
  recent: BookMeta[];
  seriesRows: [string, BookMeta[]][]; // numbered series in order; chronological series newest first
  loops: BookMeta[];
  more: BookMeta[];
}

export function buildShelves(books: BookMeta[]): Shelves {
  const byRecency = [...books]
    .filter((b) => b.series !== FEATURED_SERIES)
    .sort((a, c) => (c.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  const recent = byRecency.slice(0, RECENT_COUNT);

  const seriesMap = new Map<string, BookMeta[]>();
  for (const b of books) {
    if (!b.series) continue;
    if (!seriesMap.has(b.series)) seriesMap.set(b.series, []);
    seriesMap.get(b.series)!.push(b);
  }
  for (const [name, arr] of seriesMap)
    sortSeriesBooks(name, arr);

  // The lead series first; other series follow by most-recent addition.
  const seriesRows = [...seriesMap.entries()].sort(([na, a], [nb, c]) => {
    if (na === LEAD_SERIES) return -1;
    if (nb === LEAD_SERIES) return 1;
    const la = a.reduce((m, b) => (b.createdAt && b.createdAt > m ? b.createdAt : m), '');
    const lb = c.reduce((m, b) => (b.createdAt && b.createdAt > m ? b.createdAt : m), '');
    return lb.localeCompare(la);
  });

  const featured =
    seriesRows.find(([n]) => n === FEATURED_SERIES) ?? null;
  const restRows = seriesRows.filter(([n]) => n !== FEATURED_SERIES);

  const standalone = books.filter((b) => !b.series);
  const loops = standalone
    .filter((b) => /loop/.test(b.slug))
    .sort((a, c) => (a.slug === PINNED_SLUG ? -1 : c.slug === PINNED_SLUG ? 1 : 0));
  const more = standalone.filter((b) => !/loop/.test(b.slug));

  return { featured, recent, seriesRows: restRows, loops, more };
}

// One searchable haystack per book: title, subtitle, series, chapter titles.
function haystack(b: BookMeta): string {
  return [b.title, b.subtitle, b.series ?? '', ...(b.chapters ?? []).map((c) => c.title)]
    .join('\n')
    .toLowerCase();
}

export function searchBooks(books: BookMeta[], q: string): BookMeta[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return books;
  return books.filter((b) => {
    const h = haystack(b);
    return terms.every((t) => h.includes(t));
  });
}

// Group search matches so series books always appear together in shelf order.
export function groupMatches(matches: BookMeta[]): {
  sets: [string, BookMeta[]][];
  singles: BookMeta[];
} {
  const sets = new Map<string, BookMeta[]>();
  const singles: BookMeta[] = [];
  for (const b of matches) {
    if (!b.series) {
      singles.push(b);
      continue;
    }
    if (!sets.has(b.series)) sets.set(b.series, []);
    sets.get(b.series)!.push(b);
  }
  for (const [name, arr] of sets)
    sortSeriesBooks(name, arr);
  return { sets: [...sets.entries()], singles };
}

// Defer expensive canvas work until the element nears the viewport.
export function useLazyVisible(ref: RefObject<Element | null>): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '500px 700px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, visible]);
  return visible;
}
