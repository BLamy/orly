import { useEffect, useMemo, useRef, useState } from 'react';
import { composeCover, drawSpine, type BookMeta } from './cover';
import {
  assetUrl,
  buildShelves,
  groupMatches,
  isChronologicalSeries,
  openBook,
  registerAnimalPool,
  resolveAnimal,
  searchBooks,
  useLazyVisible,
  type Shelves,
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
import { useLandscape } from '../shell/useLandscape';
import { ThemeToggle } from '../shell/ThemeToggle';
import { OfflineBanner } from '../shell/OfflineBanner';
import { Pothos } from '../shelf-decor/Pothos';
import { Cactus } from '../shelf-decor/Cactus';
import { SnakePlant } from '../shelf-decor/SnakePlant';
import { StringOfHearts } from '../shelf-decor/StringOfHearts';
import { SpiderPlant } from '../shelf-decor/SpiderPlant';
import { Monstera } from '../shelf-decor/Monstera';
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
  // of spines doesn't ripple every book. Leaving closes on the same short
  // delay rather than instantly — while a neighbour is gliding into place the
  // pointer can cross a seam for a frame or two, and closing on that would
  // read as a flicker. Either timer cancels the other, so a sweep resolves to
  // exactly one open book.
  const enter = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), 55);
  };
  const leave = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), 55);
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
            <SpineBook
              key={b.slug}
              book={b}
              seriesIndex={isChronologicalSeries(name) ? undefined : b.seriesOrder ?? i + 1}
            />
          ),
        )}
      </div>
    </div>
  );
}

type PlantKind = 'pothos' | 'cactus' | 'snake' | 'hearts' | 'spider' | 'monstera';

function PlantSlot({ kind, width, seed }: { kind: PlantKind; width: number; seed: number }) {
  if (kind === 'cactus') return <Cactus width={width} height={BOOK_H} seed={seed} />;
  if (kind === 'snake') return <SnakePlant width={width} height={BOOK_H} seed={seed} />;
  if (kind === 'hearts') return <StringOfHearts width={width} height={BOOK_H} seed={seed} />;
  if (kind === 'spider') return <SpiderPlant width={width} height={BOOK_H} seed={seed} />;
  if (kind === 'monstera') return <Monstera width={width} height={BOOK_H} seed={seed} />;
  return <Pothos width={width} height={BOOK_H} seed={seed} />;
}

// Shelf-board geometry used to pack the continuous wall (see packRows).
const SPINE_SLOT = SPINE_W + 10; // spine width + row gap
const ROW_CHROME = 40; // row padding
/** Must match --lib-push in library.css — how far everything after a turning
 *  book slides so the cover swings into a gap instead of over its neighbour. */
const COVER_PUSH = 180;

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

// ---------------------------------------------------------------------------
// The desktop shelf proper: one continuous run of boards.
//
// It used to be a row per series, each with its own heading and its own board,
// which meant a five-book series got the same full-width shelf as a fifteen-
// book one and left most of the wood bare. Now every book on the site stands
// spine-out in one long run that wraps onto the next board when it fills up,
// and a plant marks where one series ends and the next begins — the way a real
// shelf is organized: by what's standing next to what, not by headings.
// ---------------------------------------------------------------------------

type ShelfItem =
  | { kind: 'book'; book: BookMeta; index?: number }
  | { kind: 'series'; name: string; books: BookMeta[] }
  | { kind: 'plant'; plant: PlantKind; seed: number; width: number };

/** Sleeve chrome: the spine plaque gutter on the left plus the slipcase's own
 *  padding. Books inside a sleeve stand flush — no gap — so the run reads as
 *  one boxed set rather than a series of separate books. */
const SLEEVE_CHROME = 40;
const BOOK_W = 52; // .lib-book's width in library.css

// Ordered so the two big hangers never land next to each other and the
// standing plants break up the trailing ones.
const PLANT_KINDS: PlantKind[] = ['pothos', 'monstera', 'hearts', 'cactus', 'spider', 'snake'];
const DIVIDER_WIDTHS = [110, 140, 125, 160];

/** A block is what packing treats as indivisible: one whole series (or
 *  standalone group), or the plant that separates it from the next one. A
 *  series is never broken across two boards unless it is longer than a board
 *  can hold — books in a series belong shoulder to shoulder. */
type ShelfBlock = { items: ShelfItem[]; width: number; splittable: boolean };

/** Every shelf group as one block, with a plant block between groups.
 *  Kinds/sizes/seeds come from the group index, so a given shelf always grows
 *  the same plants in the same places rather than reshuffling on every render. */
function shelfBlocks(shelves: Shelves): ShelfBlock[] {
  // A named group is a real series and gets a slipcase; the unnamed ones are
  // collections of standalone books, which stand loose on the board.
  const groups: { name: string | null; books: BookMeta[] }[] = [];
  if (shelves.featured) groups.push({ name: shelves.featured[0], books: shelves.featured[1] });
  for (const [name, arr] of shelves.seriesRows) groups.push({ name, books: arr });
  if (shelves.loops.length) groups.push({ name: null, books: shelves.loops });
  if (shelves.more.length) groups.push({ name: null, books: shelves.more });

  const plantBlock = (g: number): ShelfBlock => {
    const width = DIVIDER_WIDTHS[g % DIVIDER_WIDTHS.length];
    return {
      items: [{ kind: 'plant', plant: PLANT_KINDS[g % PLANT_KINDS.length], seed: 40 + g * 3, width }],
      width: width + ITEM_GAP,
      splittable: false,
    };
  };

  const blocks: ShelfBlock[] = [];
  groups.forEach(({ name, books }, g) => {
    // A plant opens the run too, so the first series is bracketed like the
    // rest instead of starting flush against the end of the board.
    blocks.push(plantBlock(g));
    if (name) {
      blocks.push({
        items: [{ kind: 'series', name, books }],
        width: SLEEVE_CHROME + books.length * BOOK_W + ITEM_GAP,
        // A slipcase is one object: it is never broken across boards. If a
        // series is too long for a board it simply gets a board of its own,
        // and the sleeve scrolls within it (see .lib-sleeve).
        splittable: false,
      });
      return;
    }
    blocks.push({
      items: books.map((b) => ({ kind: 'book', book: b, index: b.seriesOrder })),
      width: books.length * SPINE_SLOT,
      // Loose standalone books can wrap wherever they need to.
      splittable: true,
    });
  });
  blocks.push(plantBlock(groups.length));
  return blocks;
}

const ITEM_GAP = 10;

/** Greedy left-to-right packing into boards of `rowWidth`, block by block.
 *  Done in JS rather than with flex-wrap because each wrapped line needs to be
 *  its own element: the board (the wood, its edge, and its shadow) is drawn
 *  per row, and the row also has to reserve the cover-turn headroom below. */
function packRows(blocks: ShelfBlock[], rowWidth: number): ShelfItem[][] {
  // COVER_PUSH is held back at the right of every board: when a spine turns,
  // everything after it — including the next plant — slides over by that much,
  // and this is the room it slides into. Without it the last book's cover
  // would swing off the end of the board.
  const capacity = Math.max(SPINE_SLOT * 4, rowWidth - ROW_CHROME - COVER_PUSH);
  const rows: ShelfItem[][] = [];
  let row: ShelfItem[] = [];
  let used = 0;

  const flush = () => {
    if (row.length) rows.push(row);
    row = [];
    used = 0;
  };

  for (const block of blocks) {
    if (used + block.width > capacity && row.length) flush();
    if (block.width <= capacity || !block.splittable) {
      row.push(...block.items);
      used += block.width;
      continue;
    }
    // Longer than a whole board: lay it out board by board, contiguously.
    for (const item of block.items) {
      if (used + SPINE_SLOT > capacity && row.length) flush();
      row.push(item);
      used += SPINE_SLOT;
    }
  }
  flush();
  return rows;
}

function ContinuousShelves({ shelves, rowWidth }: { shelves: Shelves; rowWidth: number }) {
  const rows = useMemo(() => {
    if (rowWidth <= 0) return [];
    return packRows(shelfBlocks(shelves), rowWidth);
  }, [shelves, rowWidth]);

  return (
    <section className="lib-wall">
      {rows.map((row, i) => (
        <div className="lib-series-row is-spines lib-board" key={i}>
          {groupRow(row).map((group, j) => {
            if (group.kind === 'series') {
              return (
                <div className="lib-sleeve" key={`s${i}-${j}`}>
                  <span className="lib-sleeve-plaque">{group.name}</span>
                  {group.books.map((b) => (
                    <SpineBook
                      key={b.slug}
                      book={b}
                      seriesIndex={isChronologicalSeries(group.name) ? undefined : b.seriesOrder}
                    />
                  ))}
                </div>
              );
            }
            if (group.kind === 'plant') {
              return (
                <div className="lib-row-plant" key={`p${i}-${j}`}>
                  <PlantSlot kind={group.plant} width={group.width} seed={group.seed} />
                </div>
              );
            }
            // A run of standalone books. Wrapped as one element so the board's
            // justification spaces the RUN against its neighbours rather than
            // prising the books apart from each other.
            return (
              <div className="lib-run" key={`r${i}-${j}`}>
                {group.books.map((it) => (
                  <SpineBook key={it.book.slug} book={it.book} seriesIndex={it.index} />
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}

type RowGroup =
  | { kind: 'series'; name: string; books: BookMeta[] }
  | { kind: 'plant'; plant: PlantKind; seed: number; width: number }
  | { kind: 'run'; books: { book: BookMeta; index?: number }[] };

/** Coalesces a packed row into the units the board justifies between: each
 *  sleeve, each plant, and each unbroken run of standalone books. */
function groupRow(row: ShelfItem[]): RowGroup[] {
  const groups: RowGroup[] = [];
  for (const it of row) {
    if (it.kind === 'book') {
      const last = groups[groups.length - 1];
      if (last?.kind === 'run') last.books.push({ book: it.book, index: it.index });
      else groups.push({ kind: 'run', books: [{ book: it.book, index: it.index }] });
      continue;
    }
    groups.push(it);
  }
  return groups;
}

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

      {!matches && shelves && <ContinuousShelves shelves={shelves} rowWidth={rowWidth} />}


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
  const landscape = useLandscape();

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
        <BrowseFeed
          books={online ? books : shelfBooks}
          active
          mobile={mobile}
          fullBleed={mobile && landscape}
        />
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
      {/* Browse held sideways is the one full-bleed screen: the bar is gone and
          the video gets the whole phone. Everywhere else it stays reachable —
          and it comes straight back when you rotate upright. */}
      {mobile && !activeScreenOpen && !(visibleTab === 'browse' && landscape) && (
        <TabBar
          tab={visibleTab}
          onChange={setTab}
          mobile={mobile}
          // The auto-hiding bottom bar only makes sense on the scrollable list
          // tabs; on Browse/Settings there's no scroll to bring it back, so
          // keep it pinned and always reachable.
          hidden={chromeHidden && (visibleTab === 'shelf' || visibleTab === 'library')}
        />
      )}
    </>
  );
}
