import { useEffect, useMemo, useRef, useState } from 'react';
import { ChapterPlayer, PORTRAIT_MQ } from './ChapterPlayer';

const ASSET_BASE =
  (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

/** Manifest v3: each chapter is one authored viz scene + one narration MP3. */
export interface ChapterV3 {
  number: number;
  title: string;
  blurb?: string;
  /** slug in the src/viz scene registry, e.g. 'books/replay-qa/chapter-1' */
  scene: string;
  /** MP3 path relative to the book dir, e.g. 'audio/chapter-1.mp3' */
  audio?: string;
  /** caption start times (s) in the MP3, one per caption */
  cues?: number[];
  /** total length (s) */
  duration?: number;
}

export interface ManifestV3 {
  format: number;
  slug: string;
  title: string;
  subtitle?: string;
  animal?: string;
  accent?: string;
  chapters: ChapterV3[];
}

/** The subset of library.json's BookMeta this player needs for series nav. */
interface SeriesBookMeta {
  slug: string;
  title: string;
  animal?: string;
  href: string;
  series?: string;
  seriesOrder?: number;
}

/** One book's worth of chapters, flattened into the cross-book sidebar. */
interface SeriesGroup {
  book: SeriesBookMeta;
  chapters: ChapterV3[];
}

/** Format seconds as m:ss (blank for missing/zero). */
export function fmtDur(s?: number): string {
  if (!s || s < 1) return '';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function chapterFromUrl(count: number): number | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('chapter');
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= count ? n - 1 : null;
}

/** `?ep=N` — the Nth video overall across a series, spanning book boundaries. */
function episodeFromUrl(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('ep');
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

/**
 * The v3 book player: one full-bleed scene per chapter, autoplaying straight
 * off the shelf, with the ElevenLabs narration MP3 as the playback clock.
 * There is no separate "chapters" page — the sidebar (and, in a series, the
 * whole series) is always visible alongside the player, and the back arrow
 * always returns to the shelf.
 */
export function BookPlayer({ slug }: { slug: string }) {
  const base = `${ASSET_BASE}generated/${slug}/`;
  const [manifest, setManifest] = useState<ManifestV3 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [seriesGroups, setSeriesGroups] = useState<SeriesGroup[] | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`${base}manifest.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((m: ManifestV3) => {
        if (!alive) return;
        if (m.format !== 3) throw new Error(`unsupported manifest format ${m.format}`);
        setManifest(m);
        setCurrent(chapterFromUrl(m.chapters.length) ?? 0);
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [base]);

  // If this book belongs to a series, fetch the other books' manifests too,
  // so the sidebar can show the entire series (grouped by book cover) instead
  // of just this book's chapters — and resolve a cross-book `?ep=` deep link.
  useEffect(() => {
    if (!manifest) return;
    let alive = true;
    fetch(`${ASSET_BASE}generated/library.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(async (d: { books?: SeriesBookMeta[] }) => {
        if (!alive) return;
        const books = d.books || [];
        const self = books.find((b) => b.slug === slug);
        if (!self?.series) return;
        const peers = books
          .filter((b) => b.series === self.series)
          .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
        const groups = await Promise.all(
          peers.map(async (b): Promise<SeriesGroup> => {
            if (b.slug === slug) return { book: b, chapters: manifest.chapters };
            try {
              const r = await fetch(`${ASSET_BASE}generated/${b.slug}/manifest.json`);
              const m: ManifestV3 = await r.json();
              return { book: b, chapters: m.chapters };
            } catch {
              return { book: b, chapters: [] };
            }
          })
        );
        if (alive) setSeriesGroups(groups);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [manifest, slug]);

  // Resolve `?ep=N` (a position across the whole series) once the series is
  // known: jump to the right book (full navigation) or the right chapter
  // (local state) as needed.
  useEffect(() => {
    if (!seriesGroups) return;
    const ep = episodeFromUrl();
    if (!ep) return;
    let remaining = ep;
    for (const g of seriesGroups) {
      if (remaining <= g.chapters.length) {
        if (g.book.slug !== slug) {
          window.location.href = `${ASSET_BASE}?bundle=${g.book.slug}&chapter=${remaining}`;
        } else if (remaining - 1 !== current) {
          setCurrent(remaining - 1);
        }
        return;
      }
      remaining -= g.chapters.length;
    }
  }, [seriesGroups, slug]);

  const sideListRef = useRef<HTMLUListElement | null>(null);
  useEffect(() => {
    // In mobile portrait the sidebar flows below the player and shares the
    // page scroll — auto-scrolling to the active item would yank the page
    // away from the video, so skip it there.
    if (window.matchMedia(PORTRAIT_MQ).matches) return;
    const el = sideListRef.current?.querySelector('.active');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [current, manifest, seriesGroups]);

  // Keep the URL in sync with the chapter being watched, so it's shareable
  // and the browser back/forward buttons step through chapters. Skip the
  // very first sync after load — the URL is already correct (it's what
  // `current`'s initial value came from).
  const skipNextUrlSyncRef = useRef(true);
  useEffect(() => {
    if (!manifest) return;
    if (skipNextUrlSyncRef.current) {
      skipNextUrlSyncRef.current = false;
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('bundle', slug);
    url.searchParams.set('chapter', String(current + 1));
    url.searchParams.delete('ep');
    window.history.pushState(null, '', url);
  }, [current, manifest, slug]);

  // Back/forward should step between chapters too.
  useEffect(() => {
    if (!manifest) return;
    const onPopState = () => setCurrent(chapterFromUrl(manifest.chapters.length) ?? 0);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [manifest]);

  const goHome = () => {
    window.location.href = ASSET_BASE;
  };

  const goToChapter = (group: SeriesGroup, i: number) => {
    if (group.book.slug === slug) {
      setCurrent(i);
    } else {
      window.location.href = `${ASSET_BASE}?bundle=${group.book.slug}&chapter=${i + 1}`;
    }
  };

  const flatGroups = useMemo(
    () => seriesGroups ?? (manifest ? [{ book: { slug, title: manifest.title, animal: manifest.animal, href: '' }, chapters: manifest.chapters }] : []),
    [seriesGroups, manifest, slug]
  );

  if (error) return <div className="bp-loading">Couldn’t load “{slug}”: {error}</div>;
  if (!manifest) return <div className="bp-loading">Loading the book…</div>;

  const accent = manifest.accent ?? '#38bdf8';
  const chapter = manifest.chapters[current];

  return (
    <div className="bp" style={{ ['--accent' as string]: accent }}>
      <div className="bp-layout">
        <div className="bp-main">
          <ChapterPlayer
            key={`${slug}/${chapter.number}`}
            base={base}
            chapter={chapter}
            bookTitle={manifest.title}
            index={current}
            count={manifest.chapters.length}
            nextTitle={manifest.chapters[current + 1]?.title}
            onPrev={current > 0 ? () => setCurrent(current - 1) : undefined}
            onNext={current < manifest.chapters.length - 1 ? () => setCurrent(current + 1) : undefined}
            onExit={goHome}
          />
        </div>
        <aside className="bp-side" aria-label="Chapters">
          <ul className="bp-side-list" ref={sideListRef}>
            {flatGroups.map((g) => (
              <li className="bp-side-group" key={g.book.slug}>
                {flatGroups.length > 1 && (
                  <div className="bp-side-cover">
                    {g.book.animal && (
                      <img
                        src={`${ASSET_BASE}generated/${g.book.slug}/${g.book.animal}`}
                        alt=""
                        loading="lazy"
                        onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                      />
                    )}
                    <span className="bp-side-cover-text">
                      {g.book.seriesOrder != null && (
                        <span className="bp-side-cover-num">Book {g.book.seriesOrder}</span>
                      )}
                      <span className="bp-side-cover-title">{g.book.title}</span>
                    </span>
                  </div>
                )}
                <ul className="bp-side-list">
                  {g.chapters.map((c, i) => {
                    const active = g.book.slug === slug && i === current;
                    return (
                      <li key={c.number}>
                        <button
                          className={`bp-side-item${active ? ' active' : ''}`}
                          onClick={() => goToChapter(g, i)}
                          aria-current={active ? 'true' : undefined}
                        >
                          <span className="bp-side-thumb">
                            <img
                              src={`${ASSET_BASE}generated/${g.book.slug}/previews/chapter-${c.number}.png`}
                              alt=""
                              loading="lazy"
                              onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
                            />
                            <span className="bp-side-num">{String(c.number).padStart(2, '0')}</span>
                          </span>
                          <span className="bp-side-text">
                            <span className="bp-side-ctitle">{c.title}</span>
                            {fmtDur(c.duration) && <span className="bp-side-dur">{fmtDur(c.duration)}</span>}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
