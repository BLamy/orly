// The touch-first browse UI for phones: one vertical alphabetized list (series
// as a single boxed-set row, standalone books as cover rows), an iOS-style
// alphabet index rail on the right edge, and pushed screens for a series' books
// and for a book itself, on @brett_lamy/ui's NavigationStack (shell/nav.tsx:
// back button, edge-swipe back and browser back all pop). Films push onto the
// shelf's outer stack (Library) through openBook.
import { Suspense, lazy, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  AlphabetizedList,
  CollapsingHeader,
  alphabetize,
  blockChromeReveal,
  scrollToTop,
  useScrollChrome,
} from '@orly/mobile-ui';
import { composeCover, drawSpine, type BookMeta } from './cover';
import {
  assetUrl,
  isChronologicalSeries,
  isDailyPapersSeries,
  openBook,
  RECENT_COUNT,
  RECENT_SHELF,
  resolveAnimal,
  searchBooks,
  sortSeriesBooks,
  useLazyVisible,
} from './shared';
import { DownloadButton, DownloadSeriesButton } from './DownloadButton';
import { SubscribeButton } from './SubscribeButton';
import { ThemeToggle } from '../shell/ThemeToggle';
import { CoverFlow } from './CoverFlow';
import { useLandscape } from '../shell/useLandscape';
import { ShelfStack, routeKey, screenScroller, useNavRoutes, type Route } from '../shell/nav';

const BookPlayer = lazy(() =>
  import('../player/BookPlayer').then((m) => ({ default: m.BookPlayer }))
);

const COVER_W = 600;
const COVER_H = 800;

// Alphabetize ignoring leading articles ("The Explainers" files under E).
function sortKey(name: string): string {
  return name.replace(/^(the|a|an)\s+/i, '').trim() || name;
}

type Entry =
  | { kind: 'book'; name: string; book: BookMeta }
  | { kind: 'series'; name: string; books: BookMeta[] };

function buildEntries(books: BookMeta[]): Entry[] {
  const seriesMap = new Map<string, BookMeta[]>();
  const entries: Entry[] = [];
  for (const b of books) {
    if (b.series) {
      if (!seriesMap.has(b.series)) seriesMap.set(b.series, []);
      seriesMap.get(b.series)!.push(b);
    } else {
      entries.push({ kind: 'book', name: b.title, book: b });
    }
  }
  for (const [name, arr] of seriesMap) {
    sortSeriesBooks(name, arr);
    // Every series is one boxed-set row on the main shelf, regardless of
    // size — what changes past 6 books is how its OWN push-page presents
    // them (grid vs. a second A-Z indexed list): see SeriesPage below.
    entries.push({ kind: 'series', name, books: arr });
  }
  entries.sort((a, c) => sortKey(a.name).localeCompare(sortKey(c.name)));
  return entries;
}

// A standalone book row: cover thumbnail + title/subtitle.
function BookRow({ book, onOpen }: { book: BookMeta; onOpen?: () => void }) {
  const rootRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visible = useLazyVisible(rootRef);

  useEffect(() => {
    if (!visible) return;
    let dead = false;
    composeCover(book, COVER_W, COVER_H, resolveAnimal(book) ? assetUrl(resolveAnimal(book)!) : null).then((cov) => {
      if (dead) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(cov, 0, 0, w, h);
    });
    return () => {
      dead = true;
    };
  }, [visible, book]);

  const chapters = book.chapters?.length ?? 0;
  const film = book.kind === 'film';
  return (
    <button ref={rootRef} className={`libm-row${film ? ' libm-row-film' : ''}`} onClick={onOpen ?? (() => openBook(book))} aria-label={`${film ? 'Play' : 'Open'} ${book.title}`}>
      <span className="libm-row-thumb">
        <canvas ref={canvasRef} className="libm-row-canvas" />
      </span>
      <span className="libm-row-text">
        <span className="libm-row-title">{book.title}</span>
        <span className="libm-row-sub">
          {film && book.runtime ? `${Math.round(book.runtime / 60)} min · ` : ''}
          {chapters ? `${chapters} chapter${chapters === 1 ? '' : 's'}` : book.subtitle}
        </span>
      </span>
      <DownloadButton slug={book.slug} />
      <span className="libm-row-chev" aria-hidden="true" />
    </button>
  );
}

// A series row: all its spines standing together as a mini boxed set.
function SeriesRow({ name, books, onOpen }: { name: string; books: BookMeta[]; onOpen: () => void }) {
  const rootRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visible = useLazyVisible(rootRef);

  useEffect(() => {
    if (!visible) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    // Fit every spine in a capped box: shrink the per-spine width when the
    // series is large so the whole set always stands together.
    const maxW = 132;
    const sh = 62;
    const gap = books.length > 12 ? 0 : 1;
    const sw = Math.max(4, Math.min(15, Math.floor((maxW + gap) / books.length) - gap));
    const w = books.length * (sw + gap) - gap;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${sh}px`;
    canvas.width = w * dpr;
    canvas.height = sh * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    books.forEach((b, i) => {
      ctx.save();
      ctx.translate(i * (sw + gap), 0);
      drawSpine(ctx, sw, sh, b, isChronologicalSeries(name) ? undefined : b.seriesOrder ?? i + 1);
      ctx.restore();
    });
  }, [visible, books]);

  return (
    <button ref={rootRef} className="libm-row libm-row-series" onClick={onOpen} aria-label={`Open the ${name} series`}>
      <span className="libm-set-box">
        <canvas ref={canvasRef} className="libm-set-canvas" />
      </span>
      <span className="libm-row-text">
        <span className="libm-row-title">{name}</span>
        <span className="libm-row-sub">{books.length}-book series</span>
      </span>
      <SubscribeButton series={name} nested />
      <DownloadSeriesButton slugs={books.map((b) => b.slug)} nested />
      <span className="libm-row-chev" aria-hidden="true" />
    </button>
  );
}

// A large series (>6 books) as a grid buries most of it below the fold and
// loses any way to jump around — past that size the push page becomes its
// OWN second A-Z indexed list (same sticky letter heads + alphabet rail as
// the main shelf) instead of the small-series grid of cover cards.
const SERIES_GRID_MAX = 6;

/** a pushed series screen's subheader under its large title: count, subscribe, download */
function SeriesMeta({ name, books }: { name: string; books: BookMeta[] }) {
  const asGrid = books.length <= SERIES_GRID_MAX;
  const chronological = isChronologicalSeries(name);
  return (
    <div className="libm-detail-meta-row">
      <span className="libm-detail-meta">
        {books.length} books {chronological ? '· newest first' : asGrid ? '· read in order' : ''}
      </span>
      <SubscribeButton series={name} />
      <DownloadSeriesButton slugs={books.map((b) => b.slug)} />
    </div>
  );
}

// The pushed series screen's content: one series' books — a grid of cover
// cards when small enough to face you all at once, else its own indexed list.
function SeriesPage({
  name,
  books,
  active,
  onOpenBook,
}: {
  name: string;
  books: BookMeta[];
  active: boolean;
  onOpenBook: (book: BookMeta) => void;
}) {
  const asGrid = books.length <= SERIES_GRID_MAX;
  const chronological = isChronologicalSeries(name);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  // the A-Z rail jumps within this screen's own scroller
  const scrollerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    scrollerRef.current = screenScroller(anchorRef.current);
  });

  const byLetter = useMemo(() => {
    if (asGrid || chronological) return null;
    return alphabetize(books, (book) => book.title);
  }, [asGrid, books, chronological]);

  // sticky letter heads park under the stack's bar
  const barStyle = { '--libm-top-h': 'var(--screen-bar-h)' } as CSSProperties;

  return (
    <div ref={anchorRef} className="libm-series" style={barStyle}>
      {asGrid ? (
        <div className="libm-detail-grid">
          {books.map((b, i) => (
            <DetailCard
              key={b.slug}
              book={b}
              index={chronological ? undefined : b.seriesOrder ?? i + 1}
              onOpen={() => onOpenBook(b)}
            />
          ))}
        </div>
      ) : chronological ? (
        <div className="libm-rows">
          {books.map((b) => (
            <BookRow key={b.slug} book={b} onOpen={() => onOpenBook(b)} />
          ))}
        </div>
      ) : (
        <AlphabetizedList
          groups={byLetter!}
          renderItem={(book) => (
            <BookRow key={book.slug} book={book} onOpen={() => onOpenBook(book)} />
          )}
          rowsClassName="libm-rows"
          sectionClassName="libm-letter-section"
          headingClassName="libm-letter-head"
          scrollContainerRef={scrollerRef}
          topOffset={() => scrollerRef.current?.parentElement?.children[1]?.getBoundingClientRect().height ?? 0}
          showIndex={active}
          indexPortal={document.body}
        />
      )}
    </div>
  );
}

function DetailCard({ book, index, onOpen }: { book: BookMeta; index?: number; onOpen?: () => void }) {
  const rootRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visible = useLazyVisible(rootRef);

  useEffect(() => {
    if (!visible) return;
    let dead = false;
    composeCover(book, COVER_W, COVER_H, resolveAnimal(book) ? assetUrl(resolveAnimal(book)!) : null).then((cov) => {
      if (dead) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(rect.width));
      const h = Math.max(1, Math.round(rect.height));
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(cov, 0, 0, w, h);
    });
    return () => {
      dead = true;
    };
  }, [visible, book]);

  return (
    <button ref={rootRef} className="libm-card" onClick={onOpen ?? (() => openBook(book))} aria-label={`Open ${book.title}`}>
      <span className="libm-card-cover">
        <canvas ref={canvasRef} className="libm-card-canvas" />
        <DownloadButton slug={book.slug} />
      </span>
      <span className="libm-card-title">
        {index != null && <b className="libm-card-num">№{index} </b>}
        {book.title}
      </span>
    </button>
  );
}

export function MobileShelf({
  books,
  error,
  active = true,
  covered = false,
  emptyMessage,
  onScreenOpenChange,
}: {
  books: BookMeta[] | null;
  error: string | null;
  /** the visible tab: only it follows the URL (?series=, ?bundle=) and the browser's Back; a hidden tab's stack
   *  keeps its own place, like a UITabBarController hosting one navigation controller per tab */
  active?: boolean;
  /** a screen of the shelf's outer stack (a film) is on top: hide what this list portals over the page (the A-Z rail) */
  covered?: boolean;
  /** Shown instead of the generic "No books yet" when `books` is an empty
   *  array (e.g. My Shelf with nothing downloaded) rather than genuinely
   *  no books existing anywhere. */
  emptyMessage?: string;
  /** Fires whenever a series/book screen is pushed or popped — Library.tsx
   *  uses this to hide the tab bar off the root page of the nav stack,
   *  matching a native UITabBarController (the tab bar belongs to the
   *  root, not to what's pushed on top of it). */
  onScreenOpenChange?: (open: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const { routes, push, pop } = useNavRoutes({ kinds: ['series', 'book'], active });
  const listRef = useRef<HTMLDivElement | null>(null);
  // the root screen (the list) scrolls in its own stack screen: chrome and the A-Z rail follow that scroller
  const rootScreenRef = useRef<HTMLElement | null>(null);
  const rootScrollerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    rootScreenRef.current = (listRef.current?.closest('[data-slot="screen"]') as HTMLElement | null) ?? null;
    rootScrollerRef.current = screenScroller(listRef.current);
  });

  const entries = useMemo(() => (books && books.length ? buildEntries(books) : null), [books]);
  const landscape = useLandscape();

  const { hidden: chromeHidden, scrolled: chromeScrolled } = useScrollChrome(rootScreenRef);

  // The featured series is pinned above the alphabetized list (its own
  // showcase section) rather than filed under its letter — keeping the A-Z
  // rail's jump targets clean. Search still finds it like any other entry.
  // Films (VHS tapes) are the featured section when there are any; the newest Daily Papers month is featured
  // otherwise. Featured films leave the A-Z list so they are not shown twice.
  const featuredFilms = useMemo(
    () => (books ?? []).filter((b) => b.kind === 'film').sort((a, c) => (c.createdAt ?? '').localeCompare(a.createdAt ?? '')),
    [books],
  );
  // The newest books lead the page, above the Video Library (they stay in the A-Z list too).
  const recent = useMemo(
    () =>
      (books ?? [])
        .filter((b) => b.kind !== 'film' && !isDailyPapersSeries(b.series))
        .sort((a, c) => (c.createdAt ?? '').localeCompare(a.createdAt ?? ''))
        .slice(0, RECENT_COUNT),
    [books],
  );
  const featured = useMemo(
    () => {
      if (!entries || featuredFilms.length) return null;
      const monthly = entries.filter(
        (e): e is Extract<Entry, { kind: 'series' }> => e.kind === 'series' && isDailyPapersSeries(e.name),
      );
      return [...monthly].sort((a, b) =>
        (b.books[0]?.createdAt ?? '').localeCompare(a.books[0]?.createdAt ?? ''),
      )[0] ?? null;
    },
    [entries, featuredFilms],
  );

  // Alphabetized sections are built by the reusable mobile package.
  const sections = useMemo(() => {
    if (!entries) return null;
    return alphabetize(
      entries.filter(
        (entry) =>
          (entry.kind !== 'series' || !featured || entry.name !== featured.name) &&
          (entry.kind !== 'book' || entry.book.kind !== 'film' || !featuredFilms.length),
      ),
      (entry) => entry.name,
    );
  }, [entries, featured, featuredFilms]);

  const q = query.trim();
  // Search EXPLODES series: instead of collapsing a matching series into one
  // boxed-set row, every matching book (from a series or standalone) becomes
  // its own row, so results are the individual books you can open directly.
  // searchBooks already matches on the series name too, so typing a series
  // surfaces all of its books.
  const filtered = useMemo(() => {
    if (!books || !q) return null;
    return searchBooks(books, q).map(
      (b): Entry => ({ kind: 'book', name: b.title, book: b }),
    );
  }, [books, q]);

  const seriesBooks = (name: string) => {
    const e = entries?.find((x) => x.kind === 'series' && x.name === name);
    return e && e.kind === 'series' ? e.books : null;
  };

  // a book pushes onto this tab's stack; a film goes in the VCR on the shelf's outer stack (openBook)
  const open = (b: BookMeta) => (b.kind === 'film' ? openBook(b) : push({ kind: 'book', slug: b.slug }));
  const pushSeries = (name: string) => push({ kind: 'series', name });
  const pushSlug = (slug: string) => {
    const b = books?.find((x) => x.slug === slug);
    if (b) open(b);
    else push({ kind: 'book', slug });
  };

  const renderEntry = (e: Entry) =>
    e.kind === 'book' ? (
      <BookRow key={`b:${e.book.slug}`} book={e.book} onOpen={() => open(e.book)} />
    ) : (
      <SeriesRow key={`s:${e.name}`} name={e.name} books={e.books} onOpen={() => pushSeries(e.name)} />
    );

  // a series named in the URL that this tab's books don't have (or not loaded yet) shows nothing pushed
  const shown = routes.filter((r) => r.kind !== 'series' || seriesBooks(r.name) !== null);
  const screenOpen = shown.length > 0;

  useEffect(() => {
    onScreenOpenChange?.(screenOpen);
  }, [screenOpen, onScreenOpenChange]);

  // Turned sideways on a phone the list has almost no vertical room left, but
  // it does have room for a rack of covers — so the root screen becomes cover
  // flow. Only the root: a pushed series/book screen keeps its own layout.
  const coverFlow = landscape && !screenOpen && !q && !!books && books.length > 0;

  const screenFor = (r: Route, top: boolean) => {
    if (r.kind === 'series') {
      const sb = seriesBooks(r.name)!;
      return {
        key: routeKey(r),
        title: r.name,
        largeTitle: true,
        subheader: <SeriesMeta name={r.name} books={sb} />,
        content: <SeriesPage name={r.name} books={sb} active={active && top && !covered} onOpenBook={open} />,
        bottomInset: 4,
      };
    }
    const book = books?.find((b) => b.slug === (r as { slug: string }).slug);
    return {
      key: routeKey(r),
      title: book?.title ?? 'Book',
      content: (
        <Suspense fallback={<div className="bp-loading">Loading the book…</div>}>
          <BookPlayer key={(r as { slug: string }).slug} slug={(r as { slug: string }).slug} onHome={pop} />
        </Suspense>
      ),
    };
  };

  const root = (
    <div className="libm">
      {coverFlow && <CoverFlow books={books} onOpen={pushSlug} />}
      <div ref={listRef} className={`libm-list${coverFlow ? ' is-coverflow' : ''}`}>
        <CollapsingHeader
          hidden={chromeHidden}
          scrolled={chromeScrolled}
          scrollRootRef={listRef}
          collapsedHeight="var(--libm-collapsed-h)"
          heightProperty="--libm-top-h"
          className="libm-top"
          onClick={(e) => {
            // Tapping the top bar itself (not its search input/clear button)
            // smooth-scrolls the list back to the top, like Twitter's app.
            const target = e.target as HTMLElement;
            if (!target.closest('.theme-picker') && (target === e.currentTarget || target.closest('.libm-brand'))) {
              scrollToTop(rootScrollerRef.current);
            }
          }}
        >
          <div className="libm-brand">
            <span className="libm-brand-mark">O’RLY?</span>
            <span className="libm-brand-name">The Bookshelf</span>
            {books && books.length > 0 && (
              <button
                className="libm-search-toggle"
                onClick={() => {
                  setSearchOpen((o) => {
                    const next = !o;
                    if (next) window.setTimeout(() => searchInputRef.current?.focus(), 20);
                    else setQuery('');
                    return next;
                  });
                }}
                aria-label={searchOpen ? 'Close search' : 'Search the bookshelf'}
                aria-expanded={searchOpen}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <ThemeToggle />
          </div>
          {books && books.length > 0 && (searchOpen || query) && (
            <div className="libm-search is-open">
              <input
                ref={searchInputRef}
                className="libm-search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${books.length} books…`}
                aria-label="Search the bookshelf"
              />
              <button
                className="libm-search-clear"
                onClick={() => {
                  setQuery('');
                  setSearchOpen(false);
                }}
                aria-label="Clear search"
              >
                ×
              </button>
            </div>
          )}
        </CollapsingHeader>

        {error && <div className="libm-empty">Couldn’t load the library: {error}</div>}
        {!books && !error && <div className="libm-empty">Loading the shelf…</div>}
        {books && books.length === 0 && (
          <div className="libm-empty">{emptyMessage ?? 'No books yet.'}</div>
        )}

        {filtered &&
          (filtered.length === 0 ? (
            <div className="libm-empty">No books match “{q}”.</div>
          ) : (
            <div className="libm-rows">
              <div className="libm-result-count">
                {filtered.length} {filtered.length === 1 ? 'match' : 'matches'}
              </div>
              {filtered.map(renderEntry)}
            </div>
          ))}

        {!filtered && sections && (
          <AlphabetizedList
            groups={sections}
            renderItem={renderEntry}
            rowsClassName="libm-rows"
            sectionClassName="libm-letter-section"
            headingClassName="libm-letter-head"
            scrollContainerRef={rootScrollerRef}
            topOffset={() =>
              chromeHidden
                ? 8
                : (listRef.current?.querySelector('.libm-top')?.getBoundingClientRect().height ?? 0)
            }
            onIndexInteraction={() => blockChromeReveal()}
            showIndex={active && !covered && !q && !screenOpen && !coverFlow && !!entries?.length}
            indexPortal={document.body}
            beforeSections={<>
              {recent.length > 0 && (
                <section className="libm-letter-section libm-featured libm-featured-recent">
                  <h2 className="libm-letter-head">{RECENT_SHELF}</h2>
                  <div className="libm-rows">
                    {recent.map((b) => (
                      <BookRow key={b.slug} book={b} onOpen={() => open(b)} />
                    ))}
                  </div>
                </section>
              )}
              {featuredFilms.length ? (
                <section className="libm-letter-section libm-featured libm-featured-films">
                  <h2 className="libm-letter-head">Featured · Video Library</h2>
                  <div className="libm-rows">
                    {featuredFilms.map((b) => (
                      <BookRow key={b.slug} book={b} onOpen={() => open(b)} />
                    ))}
                  </div>
                </section>
              ) : featured && (
                <section className="libm-letter-section libm-featured">
                  <h2 className="libm-letter-head">Featured</h2>
                  <SeriesRow
                    name={featured.name}
                    books={featured.books}
                    onOpen={() => pushSeries(featured.name)}
                  />
                </section>
              )}
            </>}
          />
        )}

        <footer className="libm-foot">by Brett Lamy · an “O’RLY?” parody</footer>
      </div>
    </div>
  );

  return (
    <ShelfStack
      className="libm-nav"
      root={root}
      screens={shown.map((r, i) => screenFor(r, i === shown.length - 1))}
      onPop={pop}
    />
  );
}
