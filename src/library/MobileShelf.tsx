// The touch-first browse UI for phones: one vertical alphabetized list (series
// as a single boxed-set row, standalone books as cover rows), an iOS-style
// alphabet index rail on the right edge, and an iOS-style pushed second page
// for a series' books (back chevron, edge-swipe back, browser back all pop it).
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { composeCover, drawSpine, type BookMeta } from './cover';
import { assetUrl, FEATURED_SERIES, openBook, resolveAnimal, searchBooks, useLazyVisible } from './shared';
import { DownloadButton, DownloadSeriesButton } from './DownloadButton';
import { SubscribeButton } from './SubscribeButton';
import { scrollShelfToTop, useScrollChrome } from '../shell/useScrollChrome';
import { ThemeToggle } from '../shell/ThemeToggle';

const BookPlayer = lazy(() =>
  import('../player/BookPlayer').then((m) => ({ default: m.BookPlayer }))
);

const COVER_W = 600;
const COVER_H = 800;
// iOS push feel: ease-out-ish curve, entrance ~350ms, exit slightly faster.
const PUSH_MS = 350;
const POP_MS = 320;

const reducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function seriesParam(): string | null {
  return new URLSearchParams(window.location.search).get('series');
}
function bundleParam(): string | null {
  return new URLSearchParams(window.location.search).get('bundle');
}

// The single pushed screen on top of the shelf — a series' book list, or (on
// mobile) a book itself, so opening a video feels like a native part of the
// same navigation-controller stack instead of a hard page reload.
type Screen = { kind: 'series'; name: string } | { kind: 'book'; slug: string };

// Alphabetize ignoring leading articles ("The Explainers" files under E).
function sortKey(name: string): string {
  return name.replace(/^(the|a|an)\s+/i, '').trim() || name;
}
function letterOf(name: string): string {
  const c = sortKey(name).charAt(0).toUpperCase();
  return c >= 'A' && c <= 'Z' ? c : '#';
}

const LETTERS = ['#', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'];

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
    arr.sort((a, c) => (a.seriesOrder ?? 0) - (c.seriesOrder ?? 0));
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
  return (
    <button ref={rootRef} className="libm-row" onClick={onOpen ?? (() => openBook(book))} aria-label={`Open ${book.title}`}>
      <span className="libm-row-thumb">
        <canvas ref={canvasRef} className="libm-row-canvas" />
      </span>
      <span className="libm-row-text">
        <span className="libm-row-title">{book.title}</span>
        <span className="libm-row-sub">
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
      drawSpine(ctx, sw, sh, b, b.seriesOrder ?? i + 1);
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

// The iOS Contacts-style alphabet rail: tap or drag to jump; a floating letter
// bubble tracks the finger; drags jump instantly (no smooth scroll fighting).
function AlphaRail({ active, onJump }: { active: Set<string>; onJump: (letter: string) => void }) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [bubble, setBubble] = useState<{ letter: string; y: number } | null>(null);

  const pick = (clientY: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const rect = rail.getBoundingClientRect();
    const i = Math.max(0, Math.min(LETTERS.length - 1, Math.floor(((clientY - rect.top) / rect.height) * LETTERS.length)));
    const letter = LETTERS[i];
    setBubble({ letter, y: rect.top + ((i + 0.5) / LETTERS.length) * rect.height });
    // Nearest live section at-or-after the letter (iOS skips over empty ones).
    let j = i;
    while (j < LETTERS.length && !active.has(LETTERS[j])) j++;
    if (j >= LETTERS.length) for (j = i; j >= 0 && !active.has(LETTERS[j]); j--);
    if (j >= 0 && j < LETTERS.length && active.has(LETTERS[j])) onJump(LETTERS[j]);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pick(e.clientY);
  };

  return (
    <>
      <div
        ref={railRef}
        className="libm-rail"
        role="scrollbar"
        aria-label="Alphabet index"
        aria-orientation="vertical"
        aria-valuenow={0}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => e.buttons > 0 && pick(e.clientY)}
        onPointerUp={() => setBubble(null)}
        onPointerCancel={() => setBubble(null)}
      >
        {LETTERS.map((l) => (
          <span key={l} className={`libm-rail-letter${active.has(l) ? '' : ' is-dim'}`}>
            {l}
          </span>
        ))}
      </div>
      {bubble && (
        <div className="libm-rail-bubble" style={{ top: bubble.y }}>
          {bubble.letter}
        </div>
      )}
    </>
  );
}

// A large series (>6 books) as a grid buries most of it below the fold and
// loses any way to jump around — past that size the push page becomes its
// OWN second A-Z indexed list (same sticky letter heads + alphabet rail as
// the main shelf) instead of the small-series grid of cover cards.
const SERIES_GRID_MAX = 6;

// The pushed second page: one series' books — a grid of cover cards when
// small enough to face you all at once, else its own indexed list.
function SeriesPage({
  name,
  books,
  phase,
  detailRef,
  onOpenBook,
}: {
  name: string;
  books: BookMeta[];
  phase: 'push' | 'pop' | 'idle';
  detailRef: React.MutableRefObject<HTMLDivElement | null>;
  onOpenBook: (slug: string) => void;
}) {
  const asGrid = books.length <= SERIES_GRID_MAX;
  const headerRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    if (asGrid) return;
    const el = headerRef.current;
    const list = listRef.current;
    if (!el || !list) return;
    const setH = () => list.style.setProperty('--libm-top-h', `${el.getBoundingClientRect().height}px`);
    setH();
    const ro = new ResizeObserver(setH);
    ro.observe(el);
    return () => ro.disconnect();
  }, [asGrid]);

  const byLetter = useMemo(() => {
    if (asGrid) return null;
    const map = new Map<string, BookMeta[]>();
    for (const b of [...books].sort((a, c) => sortKey(a.title).localeCompare(sortKey(c.title)))) {
      const l = letterOf(b.title);
      if (!map.has(l)) map.set(l, []);
      map.get(l)!.push(b);
    }
    return [...map.entries()].sort(([a], [c]) => LETTERS.indexOf(a) - LETTERS.indexOf(c));
  }, [asGrid, books]);

  const jumpTo = (letter: string) => {
    const el = sectionRefs.current.get(letter);
    const scroller = detailRef.current;
    if (!el || !scroller) return;
    const headH = headerRef.current?.getBoundingClientRect().height ?? 0;
    // .libm-detail is its own fixed+scrolling layer (the pushed page), not
    // the window — unlike the main shelf's jumpTo, this scrolls it directly.
    const scrollerTop = scroller.getBoundingClientRect().top;
    scroller.scrollTo({ top: el.getBoundingClientRect().top - scrollerTop + scroller.scrollTop - headH - 4 });
  };

  return (
    <div
      ref={detailRef}
      className={`libm-detail${phase === 'push' ? ' is-push' : phase === 'pop' ? ' is-pop' : ''}`}
    >
      <div ref={listRef} className={asGrid ? undefined : 'libm-list'}>
        <header ref={headerRef} className="libm-detail-top">
          <button className="libm-back" onClick={() => window.history.back()} aria-label="Back to the library">
            <svg viewBox="0 0 12 20" width="12" height="20" aria-hidden="true">
              <path d="M10.5 1.5 2 10l8.5 8.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Library</span>
          </button>
          <h1 className="libm-detail-name">{name}</h1>
          <div className="libm-detail-meta-row">
            <span className="libm-detail-meta">
              {books.length} books {asGrid ? '· read in order' : ''}
            </span>
            <SubscribeButton series={name} />
            <DownloadSeriesButton slugs={books.map((b) => b.slug)} />
          </div>
        </header>
        {asGrid ? (
          <div className="libm-detail-grid">
            {books.map((b, i) => (
              <DetailCard key={b.slug} book={b} index={b.seriesOrder ?? i + 1} onOpen={() => onOpenBook(b.slug)} />
            ))}
          </div>
        ) : (
          <>
            <div className="libm-rows">
              {byLetter!.map(([l, arr]) => (
                <section
                  key={l}
                  className="libm-letter-section"
                  ref={(el) => {
                    if (el) sectionRefs.current.set(l, el);
                    else sectionRefs.current.delete(l);
                  }}
                >
                  <h2 className="libm-letter-head">{l}</h2>
                  {arr.map((b) => (
                    <BookRow key={b.slug} book={b} onOpen={() => onOpenBook(b.slug)} />
                  ))}
                </section>
              ))}
            </div>
            {/* .libm-detail (this page's own scrolling layer) has its own
                `transform` for the push/pop slide — that makes it the
                containing block for any `position: fixed` descendant,
                which would drag the rail along as THIS page scrolls instead
                of holding it pinned to the viewport like the main shelf's
                rail. Escape that via a portal straight to <body>. */}
            {createPortal(
              <AlphaRail active={new Set(byLetter!.map(([l]) => l))} onJump={jumpTo} />,
              document.body
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DetailCard({ book, index, onOpen }: { book: BookMeta; index: number; onOpen?: () => void }) {
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
        <b className="libm-card-num">№{index} </b>
        {book.title}
      </span>
    </button>
  );
}

// A book, pushed as its own screen — same sliding "page" as SeriesPage, but
// its content is the real BookPlayer instead of a list. `onHome` is wired to
// `history.back()` so the player's own "← Home" chip pops like any other
// pushed screen instead of hard-navigating away from the SPA.
function BookScreen({
  slug,
  phase,
  detailRef,
}: {
  slug: string;
  phase: 'push' | 'pop' | 'idle';
  detailRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={detailRef}
      className={`libm-detail libm-detail-book${phase === 'push' ? ' is-push' : phase === 'pop' ? ' is-pop' : ''}`}
    >
      <Suspense fallback={<div className="bp-loading">Loading the book…</div>}>
        <BookPlayer
          key={slug}
          slug={slug}
          onHome={() => {
            // A native nav-controller pop stops playback immediately, not
            // after the slide-out finishes — otherwise narration keeps
            // going (audibly) while the screen is already sliding away.
            for (const a of document.querySelectorAll('audio')) a.pause();
            window.history.back();
          }}
        />
      </Suspense>
    </div>
  );
}

export function MobileShelf({
  books,
  error,
  initialBundle,
  emptyMessage,
  onScreenOpenChange,
}: {
  books: BookMeta[] | null;
  error: string | null;
  /** `?bundle=<slug>` resolved by App.tsx — pushed as a book screen instead
   *  of App.tsx rendering BookPlayer full-page, so it slides in like any
   *  other pushed screen rather than a hard navigation. */
  initialBundle?: string;
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
  const [screen, setScreen] = useState<Screen | null>(() => {
    const s = seriesParam();
    if (s) return { kind: 'series', name: s };
    if (initialBundle) return { kind: 'book', slug: initialBundle };
    return null;
  });
  const series = screen?.kind === 'series' ? screen.name : null;
  const [phase, setPhase] = useState<'push' | 'pop' | 'idle'>('idle');
  const headerRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const dimRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const phaseTimer = useRef<number | undefined>(undefined);
  const swipedRef = useRef(false);
  const screenRef = useRef(screen);
  screenRef.current = screen;

  const entries = useMemo(() => (books && books.length ? buildEntries(books) : null), [books]);

  const { hidden: chromeHidden, scrolled: chromeScrolled } = useScrollChrome();

  // Expose the sticky top header's real height as a CSS var, so the A-Z
  // letter section heads (iOS Contacts-style) can stick right below it
  // instead of a hardcoded offset that would drift if the header's content
  // (search box, brand row) ever changes height. While the header is
  // scrolled off (chromeHidden), the letter heads should stick to the very
  // top of the screen instead of the header's now-vacated space.
  useEffect(() => {
    const el = headerRef.current;
    const list = listRef.current; // shared ancestor of the header AND the rows below it
    if (!el || !list) return;
    const setH = () =>
      list.style.setProperty('--libm-top-h', chromeHidden ? '0px' : `${el.getBoundingClientRect().height}px`);
    setH();
    if (chromeHidden) return;
    const ro = new ResizeObserver(setH);
    ro.observe(el);
    return () => ro.disconnect();
  }, [chromeHidden]);

  // The featured series is pinned above the alphabetized list (its own
  // showcase section) rather than filed under its letter — keeping the A-Z
  // rail's jump targets clean. Search still finds it like any other entry.
  const featured = useMemo(
    () => entries?.find((e): e is Extract<Entry, { kind: 'series' }> => e.kind === 'series' && e.name === FEATURED_SERIES) ?? null,
    [entries],
  );

  // Letter → entries sections for the vertical list + rail.
  const sections = useMemo(() => {
    if (!entries) return null;
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      if (e.kind === 'series' && e.name === FEATURED_SERIES) continue; // pinned above
      const l = letterOf(e.name);
      if (!map.has(l)) map.set(l, []);
      map.get(l)!.push(e);
    }
    return map;
  }, [entries]);
  const activeLetters = useMemo(() => new Set(sections ? [...sections.keys()] : []), [sections]);

  const q = query.trim();
  // Search filters the vertical list: a series row stays when the series name
  // matches or it contains a matching book/chapter; standalone rows on match.
  const filtered = useMemo(() => {
    if (!entries || !books || !q) return null;
    const hits = new Set(searchBooks(books, q).map((b) => b.slug));
    const terms = q.toLowerCase();
    return entries.filter((e) =>
      e.kind === 'book'
        ? hits.has(e.book.slug)
        : e.name.toLowerCase().includes(terms) || e.books.some((b) => hits.has(b.slug)),
    );
  }, [entries, books, q]);

  const seriesBooks = useMemo(() => {
    if (!series || !entries) return null;
    const e = entries.find((x) => x.kind === 'series' && x.name === series);
    return e && e.kind === 'series' ? e.books : null;
  }, [series, entries]);

  const settlePhase = (ms: number, after?: () => void) => {
    window.clearTimeout(phaseTimer.current);
    phaseTimer.current = window.setTimeout(() => {
      setPhase('idle');
      after?.();
    }, reducedMotion() ? 0 : ms);
  };
  useEffect(() => () => window.clearTimeout(phaseTimer.current), []);

  const pushScreen = (next: Screen) => {
    const url = new URL(window.location.href);
    if (next.kind === 'series') {
      url.searchParams.set('series', next.name);
      url.searchParams.delete('bundle');
    } else {
      url.searchParams.set('bundle', next.slug);
      url.searchParams.delete('series');
    }
    window.history.pushState(null, '', url);
    setScreen(next);
    setPhase(reducedMotion() ? 'idle' : 'push');
    if (!reducedMotion()) settlePhase(PUSH_MS);
  };
  const pushSeries = (name: string) => pushScreen({ kind: 'series', name });
  const pushBook = (slug: string) => pushScreen({ kind: 'book', slug });

  // Browser/hardware back-forward keeps the pushed page coherent.
  useEffect(() => {
    const onPopState = () => {
      const s = seriesParam();
      const b = bundleParam();
      const next: Screen | null = s ? { kind: 'series', name: s } : b ? { kind: 'book', slug: b } : null;
      const cur = screenRef.current;
      const same =
        (next === null && cur === null) ||
        (next?.kind === 'series' && cur?.kind === 'series' && next.name === cur.name) ||
        (next?.kind === 'book' && cur?.kind === 'book' && next.slug === cur.slug);
      if (same) return;
      if (next) {
        // forward into a screen (series or book)
        setScreen(next);
        setPhase(reducedMotion() ? 'idle' : 'push');
        if (!reducedMotion()) settlePhase(PUSH_MS);
        return;
      }
      // popping back to the list
      if (swipedRef.current || reducedMotion()) {
        swipedRef.current = false;
        setPhase('idle');
        setScreen(null);
        return;
      }
      setPhase('pop');
      settlePhase(POP_MS, () => setScreen(null));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // iOS edge-swipe back: drag from the left edge tracks the finger, committing
  // past a threshold animates out and pops history. Style writes go straight to
  // the DOM (refs) so no re-render happens per frame.
  useEffect(() => {
    const el = detailRef.current;
    if (!el || !screen || phase !== 'idle') return;
    let startX = 0;
    let startY = 0;
    let dragging = false;
    let dx = 0;
    const listEl = listRef.current;
    const dimEl = dimRef.current;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t.clientX > 28) return;
      startX = t.clientX;
      startY = t.clientY;
      dragging = true;
      dx = 0;
      el.style.transition = 'none';
      if (listEl) listEl.style.transition = 'none';
      if (dimEl) dimEl.style.transition = 'none';
    };
    const onMove = (e: TouchEvent) => {
      if (!dragging) return;
      const t = e.touches[0];
      dx = Math.max(0, t.clientX - startX);
      if (dx > 8 && Math.abs(t.clientY - startY) < dx * 1.5) e.preventDefault();
      const f = dx / window.innerWidth;
      el.style.transform = `translate3d(${dx}px, 0, 0)`;
      if (listEl) listEl.style.transform = `translate3d(${-30 + f * 30}%, 0, 0)`;
      if (dimEl) dimEl.style.opacity = String(Math.max(0, 1 - f));
    };
    const finish = (commit: boolean) => {
      dragging = false;
      const ease = 'cubic-bezier(0.32, 0.72, 0, 1)';
      el.style.transition = `transform ${POP_MS}ms ${ease}`;
      if (listEl) listEl.style.transition = `transform ${POP_MS}ms ${ease}`;
      if (dimEl) dimEl.style.transition = `opacity ${POP_MS}ms ${ease}`;
      if (commit) {
        el.style.transform = 'translate3d(100%, 0, 0)';
        if (listEl) listEl.style.transform = 'translate3d(0, 0, 0)';
        if (dimEl) dimEl.style.opacity = '0';
        swipedRef.current = true;
        window.setTimeout(() => window.history.back(), POP_MS);
      } else {
        el.style.transform = 'translate3d(0, 0, 0)';
        if (listEl) listEl.style.transform = 'translate3d(-30%, 0, 0)';
        if (dimEl) dimEl.style.opacity = '1';
      }
    };
    const onEnd = () => {
      if (!dragging) return;
      finish(dx > window.innerWidth * 0.28 || dx > 110);
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd);
    el.addEventListener('touchcancel', onEnd);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
      // clear inline overrides so class-driven transforms win again
      el.style.transition = '';
      el.style.transform = '';
      if (listEl) {
        listEl.style.transition = '';
        listEl.style.transform = '';
      }
      if (dimEl) {
        dimEl.style.transition = '';
        dimEl.style.opacity = '';
      }
    };
  }, [screen, phase]);

  const jumpTo = (letter: string) => {
    const el = sectionRefs.current.get(letter);
    if (!el) return;
    const headH = headerRef.current?.getBoundingClientRect().height ?? 0;
    // instant jump — smooth scrolling would fight the dragging finger
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - headH - 4 });
  };

  const renderEntry = (e: Entry) =>
    e.kind === 'book' ? (
      <BookRow key={`b:${e.book.slug}`} book={e.book} onOpen={() => pushBook(e.book.slug)} />
    ) : (
      <SeriesRow key={`s:${e.name}`} name={e.name} books={e.books} onOpen={() => pushSeries(e.name)} />
    );

  const bookOpen = screen?.kind === 'book' ? screen.slug : null;
  const seriesOpen = series !== null && seriesBooks !== null;
  const screenOpen = seriesOpen || bookOpen !== null;
  const listUnder = screenOpen && phase !== 'pop';

  useEffect(() => {
    onScreenOpenChange?.(screenOpen);
  }, [screenOpen, onScreenOpenChange]);

  return (
    <div className="libm">
      <div ref={listRef} className={`libm-list${listUnder ? ' is-under' : ''}`}>
        <header
          ref={headerRef}
          className={`libm-top${chromeScrolled ? ' is-scrolled' : ''}${chromeHidden ? ' is-hidden' : ''}`}
          onClick={(e) => {
            // Tapping the top bar itself (not its search input/clear button)
            // smooth-scrolls the list back to the top, like Twitter's app.
            const target = e.target as HTMLElement;
            if (!target.closest('.theme-picker') && (target === e.currentTarget || target.closest('.libm-brand'))) {
              scrollShelfToTop();
            }
          }}
        >
          <div className="libm-brand">
            <span className="libm-brand-mark">O’RLY?</span>
            <span className="libm-brand-name">The Bookshelf</span>
            <ThemeToggle />
          </div>
          {books && books.length > 0 && (
            <div className="libm-search">
              <input
                className="libm-search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${books.length} books…`}
                aria-label="Search the bookshelf"
              />
              {query && (
                <button className="libm-search-clear" onClick={() => setQuery('')} aria-label="Clear search">
                  ×
                </button>
              )}
            </div>
          )}
        </header>

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
          <div className="libm-rows">
            {featured && (
              <section className="libm-letter-section libm-featured">
                <h2 className="libm-letter-head">Featured</h2>
                <SeriesRow
                  name={featured.name}
                  books={featured.books}
                  onOpen={() => pushSeries(featured.name)}
                />
              </section>
            )}
            {LETTERS.filter((l) => sections.has(l)).map((l) => (
              <section
                key={l}
                className="libm-letter-section"
                ref={(el) => {
                  if (el) sectionRefs.current.set(l, el);
                  else sectionRefs.current.delete(l);
                }}
              >
                <h2 className="libm-letter-head">{l}</h2>
                {sections.get(l)!.map(renderEntry)}
              </section>
            ))}
          </div>
        )}

        <footer className="libm-foot">by Brett Lamy · an “O’RLY?” parody</footer>
      </div>

      {!q && !screenOpen && entries && entries.length > 0 && (
        <AlphaRail active={activeLetters} onJump={jumpTo} />
      )}

      <div ref={dimRef} className={`libm-dim${listUnder ? ' is-on' : ''}`} aria-hidden="true" />

      {seriesOpen && (
        <SeriesPage
          name={series}
          books={seriesBooks}
          phase={phase}
          detailRef={detailRef}
          onOpenBook={pushBook}
        />
      )}
      {bookOpen && (
        <BookScreen slug={bookOpen} phase={phase} detailRef={detailRef} />
      )}
    </div>
  );
}
