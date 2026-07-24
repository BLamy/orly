import { useEffect, useMemo, useRef, useState } from 'react';
import { composeCover, drawSpine, type BookMeta } from './cover';
import {
  assetUrl,
  buildShelves,
  groupMatches,
  openBook,
  registerAnimalPool,
  resolveAnimal,
  searchBooks,
  useLazyVisible,
} from './shared';
import { MobileShelf } from './MobileShelf';
import { BrowseFeed } from './BrowseFeed';
import { SettingsPanel } from './SettingsPanel';
import { DownloadButton, DownloadSeriesButton } from './DownloadButton';
import { SubscribeButton } from './SubscribeButton';
import { getDownloadedSlugs, onDownloadsChanged } from '../offline/downloads';
import { checkSubscriptions } from '../offline/subscriptions';
import { useOnline } from '../offline/useOnline';
import { TabBar, type ShelfTab } from '../shell/TabBar';
import { useScrollChrome } from '../shell/useScrollChrome';
import { ThemeToggle } from '../shell/ThemeToggle';
import { OfflineBanner } from '../shell/OfflineBanner';
import { Pothos } from '../shelf-decor/Pothos';
import './library.css';

const TAB_KEY = 'orly-tab';
function tabParam(): ShelfTab {
  const t = new URLSearchParams(window.location.search).get('tab');
  return t === 'shelf' ? 'shelf' : 'library';
}
// Re-check subscribed series against library.json every 20 minutes while the
// tab is open — there's no push infra for a static site, so "auto-download
// as new chapters come out" means "the next time this poll runs."
const SUBSCRIPTION_POLL_MS = 20 * 60 * 1000;

const COVER_W = 600;
const COVER_H = 800;
// Desktop spine-shelf geometry (CSS pixels; canvases render at 2×).
const BOOK_H = 288;
const FACE_W = 216; // cover face (0.75 ratio)
const SPINE_W = 48;

const REPO_URL = 'https://github.com/BLamy/orly';
const WORKFLOWS_URL = 'https://github.com/BLamy/orly/blob/main/generator/prompts/storyboard.txt';

// The mobile browse UI takes over on small screens and touch-first devices
// (landscape phones included); desktop keeps the spine shelf.
export const MOBILE_MQ = '(max-width: 820px), ((hover: none) and (pointer: coarse) and (max-width: 1180px))';

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

// One book standing front-cover-out (used when a whole group fits its row):
// no turning, just a subtle hover lift.
function FrontBook({ book }: { book: BookMeta }) {
  const rootRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visible = useLazyVisible(rootRef);

  useEffect(() => {
    if (!visible) return;
    let dead = false;
    composeCover(book, COVER_W, COVER_H, resolveAnimal(book) ? assetUrl(resolveAnimal(book)!) : null).then(
      (cov) => {
        if (dead) return;
        const face = canvasRef.current;
        if (!face) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        face.width = FACE_W * dpr;
        face.height = BOOK_H * dpr;
        const ctx = face.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.drawImage(cov, 0, 0, FACE_W, BOOK_H);
      },
    );
    return () => {
      dead = true;
    };
  }, [visible, book]);

  return (
    <button
      ref={rootRef}
      className="lib-front"
      onClick={() => openBook(book)}
      aria-label={`Open ${book.title}`}
      title={book.subtitle ? `${book.title} — ${book.subtitle}` : book.title}
    >
      <canvas ref={canvasRef} className="lib-front-canvas" style={{ width: FACE_W, height: BOOK_H }} />
      <DownloadButton slug={book.slug} />
    </button>
  );
}

// One book standing spine-out; hovering (or focusing) turns it to show the
// cover. Two canvas-textured CSS-3D planes rotate as one assembly via a single
// eased `transform` transition — GPU-only, no per-frame canvas repaints and no
// layout properties animated, so neighbors never move.
function SpineBook({ book, seriesIndex }: { book: BookMeta; seriesIndex?: number }) {
  const rootRef = useRef<HTMLButtonElement | null>(null);
  const coverRef = useRef<HTMLCanvasElement | null>(null);
  const spineRef = useRef<HTMLCanvasElement | null>(null);
  const visible = useLazyVisible(rootRef);
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!visible) return;
    let dead = false;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const spine = spineRef.current;
    if (spine) {
      spine.width = SPINE_W * dpr;
      spine.height = BOOK_H * dpr;
      const ctx = spine.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawSpine(ctx, SPINE_W, BOOK_H, book, seriesIndex);
      }
    }

    composeCover(book, COVER_W, COVER_H, resolveAnimal(book) ? assetUrl(resolveAnimal(book)!) : null).then(
      (cov) => {
        if (dead) return;
        const face = coverRef.current;
        if (!face) return;
        face.width = FACE_W * dpr;
        face.height = BOOK_H * dpr;
        const ctx = face.getContext('2d');
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.drawImage(cov, 0, 0, FACE_W, BOOK_H);
      },
    );
    return () => {
      dead = true;
    };
  }, [visible, book, seriesIndex]);

  // Hover intent: a short enter delay so sweeping the pointer across a shelf
  // of spines doesn't ripple every book; leaving cancels/closes immediately
  // (the CSS return transition is the slower, eased part).
  const enter = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), 90);
  };
  const leave = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <button
      ref={rootRef}
      className={`lib-book${open ? ' is-open' : ''}`}
      onClick={() => openBook(book)}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onFocus={() => setOpen(true)}
      onBlur={leave}
      aria-label={`Open ${book.title}`}
      title={book.subtitle ? `${book.title} — ${book.subtitle}` : book.title}
    >
      <span className="lib-stage">
        <span className="lib-turn">
          <canvas
            ref={coverRef}
            className="lib-face lib-face-cover"
            style={{ width: FACE_W, height: BOOK_H }}
          />
          <canvas
            ref={spineRef}
            className="lib-face lib-face-spine"
            style={{ width: SPINE_W, height: BOOK_H }}
          />
        </span>
      </span>
      <DownloadButton slug={book.slug} />
    </button>
  );
}

// A series standing together as one boxed set on the shelf. `front` shows the
// whole set cover-out (it fits); otherwise spines with the hover-turn.
function BoxedSet({ name, books, front }: { name: string; books: BookMeta[]; front: boolean }) {
  return (
    <div className="lib-set">
      <span className="lib-set-plaque">{name}</span>
      <div className="lib-set-dl">
        <SubscribeButton series={name} />
        <DownloadSeriesButton slugs={books.map((b) => b.slug)} />
      </div>
      <div className="lib-set-books">
        {books.map((b, i) =>
          front ? (
            <FrontBook key={b.slug} book={b} />
          ) : (
            <SpineBook key={b.slug} book={b} seriesIndex={b.seriesOrder ?? i + 1} />
          ),
        )}
      </div>
    </div>
  );
}

function ShelfRow({
  title,
  meta,
  front,
  plantSlot,
  plantSeed,
  children,
}: {
  title: string;
  meta: string;
  front: boolean;
  /** Leftover shelf-board width (px) after this row's books, or 0/undefined
   *  for "no room" — see leftoverPlantWidth() below. A decorative Pothos
   *  fills real empty space instead of leaving a bare stretch of board. */
  plantSlot?: number;
  plantSeed?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="lib-series">
      <div className="lib-series-head">
        <h2 className="lib-series-name">{title}</h2>
        <span className="lib-series-meta">{meta}</span>
      </div>
      <div className={`lib-series-row ${front ? 'is-fronts' : 'is-spines'}`}>
        {children}
        {!!plantSlot && (
          <div className="lib-row-plant">
            <Pothos width={plantSlot} height={BOOK_H} seed={plantSeed ?? 0} />
          </div>
        )}
      </div>
    </section>
  );
}

// Desktop-only decoration (see Pothos.tsx) — only worth it on a plain
// (non-boxed-set) spine row, where books don't stretch to fill the row width,
// so there's often real bare shelf board after the last spine. Skipped for
// front-cover rows (those are sized to fit exactly, by definition) and boxed
// sets (their own fixed-width layout).
const SPINE_SLOT = SPINE_W + 10; // spine width + row gap
const ROW_CHROME = 40; // row padding
const MIN_PLANT_W = 90;
const MAX_PLANT_W = 170;
function leftoverPlantWidth(n: number, rowWidth: number, front: boolean): number {
  if (front || rowWidth <= 0) return 0;
  const used = n * SPINE_SLOT + ROW_CHROME;
  const leftover = rowWidth - used;
  if (leftover < MIN_PLANT_W) return 0;
  return Math.min(leftover - 20, MAX_PLANT_W);
}

// Adaptive presentation: a group whose books all fit front-cover-first in the
// row width shows fronts; longer groups collapse to spines. Recomputed on
// resize (debounced via a ResizeObserver on a probe sized like the rows).
const FRONT_SLOT = FACE_W + 10; // cover width + row gap
const GROUP_CHROME = 70; // boxed-set plaque/padding + row padding headroom

function useRowWidth(): [number, React.RefObject<HTMLDivElement>] {
  const probeRef = useRef<HTMLDivElement>(null!);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = probeRef.current;
    if (!el) return;
    let t: number | undefined;
    const measure = () => setWidth(el.getBoundingClientRect().width);
    measure();
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(measure, 120);
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, []);
  return [width, probeRef];
}

const fitsFront = (n: number, rowWidth: number) =>
  rowWidth > 0 && n * FRONT_SLOT + GROUP_CHROME <= rowWidth;

export function DesktopShelf({
  books,
  error,
  emptyMessage,
}: {
  books: BookMeta[] | null;
  error: string | null;
  emptyMessage?: string;
}) {
  const [query, setQuery] = useState('');
  const [rowWidth, probeRef] = useRowWidth();

  const shelves = useMemo(() => (books && books.length ? buildShelves(books) : null), [books]);

  const q = query.trim();
  const matches = useMemo(() => {
    if (!books || !q) return null;
    return groupMatches(searchBooks(books, q));
  }, [books, q]);
  const matchCount = matches
    ? matches.singles.length + matches.sets.reduce((n, [, a]) => n + a.length, 0)
    : 0;

  return (
    <div className="lib">
      <div className="lib-corner">
        <ThemeToggle />
        <a
          className="lib-gh"
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View the source on GitHub"
          title="View the source on GitHub"
        >
          <GitHubMark />
        </a>
      </div>

      <header className="lib-head">
        <div className="lib-eyebrow">The Secret Lives of Data</div>
        <h1 className="lib-title">The O’RLY Bookshelf</h1>
        <p className="lib-sub">
          Pick any codebase, get a narrated, animated explainer — bound as an “O’RLY?” parody book.
          Hover a spine to turn it; click to read.
        </p>
        {books && books.length > 0 && (
          <div className="lib-search">
            <input
              className="lib-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${books.length} books — titles, series, chapters…`}
              aria-label="Search the bookshelf"
            />
            {query && (
              <button className="lib-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                ×
              </button>
            )}
          </div>
        )}
      </header>

      {error && <div className="lib-empty">Couldn’t load the library: {error}</div>}
      {!books && !error && <div className="lib-empty">Loading the shelf…</div>}
      {books && books.length === 0 && (
        <div className="lib-empty">
          {emptyMessage ?? (
            <>No books yet — generate one with <code>npm run explain</code>.</>
          )}
        </div>
      )}

      {/* invisible probe sized like a shelf row, for the fronts-vs-spines fit test */}
      <div ref={probeRef as unknown as React.LegacyRef<HTMLDivElement>} className="lib-row-probe" aria-hidden="true" />

      {matches &&
        (matchCount === 0 ? (
          <div className="lib-empty">
            No books match “{q}”. Try a title, a series name, or a chapter title.
          </div>
        ) : (
          <>
            <div className="lib-result-count">
              {matchCount} {matchCount === 1 ? 'book matches' : 'books match'} “{q}”
            </div>
            <div className="lib-results">
              {matches.sets.map(([name, arr]) => (
                <BoxedSet key={name} name={name} books={arr} front={fitsFront(arr.length, rowWidth)} />
              ))}
              {matches.singles.map((b) => (
                <FrontBook key={b.slug} book={b} />
              ))}
            </div>
          </>
        ))}

      {!matches && shelves && (() => {
        const recentFront = fitsFront(shelves.recent.length, rowWidth);
        const loopsFront = fitsFront(shelves.loops.length, rowWidth);
        const moreFront = fitsFront(shelves.more.length, rowWidth);
        const featuredFront = shelves.featured ? fitsFront(shelves.featured[1].length, rowWidth) : false;
        return (
          <>
            {shelves.featured && (
              <ShelfRow
                title={shelves.featured[0]}
                meta={`a ${shelves.featured[1].length}-book series · read in order →`}
                front={featuredFront}
              >
                <BoxedSet name={shelves.featured[0]} books={shelves.featured[1]} front={featuredFront} />
              </ShelfRow>
            )}
            <ShelfRow
              title="Recently Added"
              meta="hot off the press →"
              front={recentFront}
              plantSlot={leftoverPlantWidth(shelves.recent.length, rowWidth, recentFront)}
              plantSeed={1}
            >
              {shelves.recent.map((b) =>
                recentFront ? (
                  <FrontBook key={b.slug} book={b} />
                ) : (
                  <SpineBook key={b.slug} book={b} seriesIndex={b.seriesOrder} />
                ),
              )}
            </ShelfRow>
            {shelves.seriesRows.map(([name, arr]) => {
              const front = fitsFront(arr.length, rowWidth);
              return (
                <ShelfRow key={name} title={name} meta={`a ${arr.length}-book series · read in order →`} front={front}>
                  <BoxedSet name={name} books={arr} front={front} />
                </ShelfRow>
              );
            })}
            {shelves.loops.length > 0 && (
              <ShelfRow
                title="Agent Loops"
                meta={`${shelves.loops.length} standalone builds →`}
                front={loopsFront}
                plantSlot={leftoverPlantWidth(shelves.loops.length, rowWidth, loopsFront)}
                plantSeed={2}
              >
                {shelves.loops.map((b) =>
                  loopsFront ? <FrontBook key={b.slug} book={b} /> : <SpineBook key={b.slug} book={b} />,
                )}
              </ShelfRow>
            )}
            {shelves.more.length > 0 && (
              <ShelfRow
                title="More from the Shelf"
                meta={`${shelves.more.length} one-offs →`}
                front={moreFront}
                plantSlot={leftoverPlantWidth(shelves.more.length, rowWidth, moreFront)}
                plantSeed={3}
              >
                {shelves.more.map((b) =>
                  moreFront ? <FrontBook key={b.slug} book={b} /> : <SpineBook key={b.slug} book={b} />,
                )}
              </ShelfRow>
            )}
          </>
        );
      })()}

      <footer className="lib-foot">
        by Brett Lamy · an “O’RLY?” parody · icons via the Noun Project (CC BY) · made with Claude Code using{' '}
        <a href={WORKFLOWS_URL} target="_blank" rel="noopener noreferrer">
          workflows
        </a>
      </footer>
    </div>
  );
}

export function Library({ initialBundle }: { initialBundle?: string } = {}) {
  const [books, setBooks] = useState<BookMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_MQ).matches);
  const online = useOnline();
  const isTab = (v: unknown): v is ShelfTab =>
    v === 'browse' || v === 'library' || v === 'shelf' || v === 'settings';
  const [tab, setTabState] = useState<ShelfTab>(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('tab');
    if (isTab(fromUrl)) return fromUrl;
    try {
      const saved = localStorage.getItem(TAB_KEY);
      if (isTab(saved)) return saved;
    } catch { /* private mode */ }
    return 'library';
  });
  const setTab = (t: ShelfTab) => {
    setTabState(t);
    try {
      localStorage.setItem(TAB_KEY, t);
    } catch { /* private mode — session-only */ }
    const url = new URL(window.location.href);
    url.searchParams.set('tab', t);
    window.history.replaceState(null, '', url);
  };
  // Offline can't browse the full catalog (nothing to fetch) — force the
  // visible set to what's downloaded regardless of which tab is selected,
  // but leave the user's actual tab choice alone so it resumes once online.
  const visibleTab: ShelfTab = online ? tab : 'shelf';

  const [downloadedSlugs, setDownloadedSlugs] = useState<string[]>(() => getDownloadedSlugs());
  useEffect(() => onDownloadsChanged(() => setDownloadedSlugs(getDownloadedSlugs())), []);

  // The tab bar belongs to each tab's ROOT page (like a real
  // UITabBarController) — hidden once you've drilled into a series or a
  // book on whichever tab is currently visible. Each MobileShelf instance
  // reports its own pushed/popped state independently since both stay
  // mounted at once (see the dual-mount note below).
  const [shelfScreenOpen, setShelfScreenOpen] = useState(false);
  const [libraryScreenOpen, setLibraryScreenOpen] = useState(false);
  const activeScreenOpen =
    visibleTab === 'shelf' ? shelfScreenOpen : visibleTab === 'library' ? libraryScreenOpen : false;

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    fetch(assetUrl('generated/library.json'))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        registerAnimalPool(d.books || []);
        setBooks(d.books || []);
        void checkSubscriptions(d.books || []);
      })
      .catch((e) => setError(e.message));
    const iv = window.setInterval(() => {
      fetch(assetUrl('generated/library.json'))
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((d) => void checkSubscriptions(d.books || []))
        .catch(() => {});
    }, SUBSCRIPTION_POLL_MS);
    return () => window.clearInterval(iv);
  }, []);

  const shelfBooks = useMemo(
    () => (books ? books.filter((b) => downloadedSlugs.includes(b.slug)) : null),
    [books, downloadedSlugs]
  );
  const libraryBooks = online ? books : shelfBooks;
  const { hidden: chromeHidden } = useScrollChrome();

  return (
    <>
      <OfflineBanner />
      {/* desktop: a normal-flow top nav row, so it must come BEFORE the
          shelf content in the DOM; mobile's fixed bottom bar doesn't care
          about DOM order, so sharing this one placement is fine either way. */}
      {!mobile && <TabBar tab={visibleTab} onChange={setTab} mobile={mobile} />}
      {visibleTab === 'settings' ? (
        <SettingsPanel />
      ) : visibleTab === 'browse' ? (
        <BrowseFeed books={online ? books : shelfBooks} active />
      ) : mobile ? (
        // Both tabs stay mounted always (display:none, not unmounted) so
        // each keeps its OWN drill-down navigation position — switching
        // tabs and back returns you to exactly where you left off, like a
        // real UITabBarController hosting two UINavigationControllers.
        <>
          <div style={{ display: visibleTab === 'shelf' ? 'contents' : 'none' }}>
            <MobileShelf
              books={shelfBooks}
              error={books ? null : error}
              emptyMessage="Nothing downloaded yet — browse the Library."
              onScreenOpenChange={setShelfScreenOpen}
            />
          </div>
          <div style={{ display: visibleTab === 'library' ? 'contents' : 'none' }}>
            <MobileShelf
              books={libraryBooks}
              error={error}
              initialBundle={initialBundle}
              onScreenOpenChange={setLibraryScreenOpen}
            />
          </div>
        </>
      ) : (
        <DesktopShelf
          books={visibleTab === 'shelf' ? shelfBooks : libraryBooks}
          error={visibleTab === 'shelf' ? (books ? null : error) : error}
          emptyMessage={
            visibleTab === 'shelf' ? 'Nothing downloaded yet — browse the Library.' : undefined
          }
        />
      )}
      {mobile && !activeScreenOpen && (
        <TabBar tab={visibleTab} onChange={setTab} mobile={mobile} hidden={chromeHidden} />
      )}
    </>
  );
}
