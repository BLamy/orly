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

export function openBook(b: BookMeta) {
  window.location.href = ASSET_BASE + String(b.href).replace(/^\//, '');
}

export interface Shelves {
  recent: BookMeta[];
  seriesRows: [string, BookMeta[]][]; // each series in seriesOrder ascending
  loops: BookMeta[];
  more: BookMeta[];
}

export function buildShelves(books: BookMeta[]): Shelves {
  const byRecency = [...books].sort((a, c) => (c.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  const recent = byRecency.slice(0, RECENT_COUNT);

  const seriesMap = new Map<string, BookMeta[]>();
  for (const b of books) {
    if (!b.series) continue;
    if (!seriesMap.has(b.series)) seriesMap.set(b.series, []);
    seriesMap.get(b.series)!.push(b);
  }
  for (const arr of seriesMap.values())
    arr.sort((a, c) => (a.seriesOrder ?? 0) - (c.seriesOrder ?? 0));

  // The lead series first; other series follow by most-recent addition.
  const seriesRows = [...seriesMap.entries()].sort(([na, a], [nb, c]) => {
    if (na === LEAD_SERIES) return -1;
    if (nb === LEAD_SERIES) return 1;
    const la = a.reduce((m, b) => (b.createdAt && b.createdAt > m ? b.createdAt : m), '');
    const lb = c.reduce((m, b) => (b.createdAt && b.createdAt > m ? b.createdAt : m), '');
    return lb.localeCompare(la);
  });

  const standalone = books.filter((b) => !b.series);
  const loops = standalone
    .filter((b) => /loop/.test(b.slug))
    .sort((a, c) => (a.slug === PINNED_SLUG ? -1 : c.slug === PINNED_SLUG ? 1 : 0));
  const more = standalone.filter((b) => !/loop/.test(b.slug));

  return { recent, seriesRows, loops, more };
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

// Group search matches so series books always appear together, in seriesOrder.
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
  for (const arr of sets.values())
    arr.sort((a, c) => (a.seriesOrder ?? 0) - (c.seriesOrder ?? 0));
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
