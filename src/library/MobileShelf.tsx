// The touch-first browse UI for phones: one vertical alphabetized list (series
// as a single boxed-set row, standalone books as cover rows), an iOS-style
// alphabet index rail on the right edge, and an iOS-style pushed second page
// for a series' books (back chevron, edge-swipe back, browser back all pop it).
import { useEffect, useMemo, useRef, useState } from 'react';
import { composeCover, drawSpine, type BookMeta } from './cover';
import { assetUrl, openBook, searchBooks, useLazyVisible } from './shared';

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
    entries.push({ kind: 'series', name, books: arr });
  }
  entries.sort((a, c) => sortKey(a.name).localeCompare(sortKey(c.name)));
  return entries;
}

// A standalone book row: cover thumbnail + title/subtitle.
function BookRow({ book }: { book: BookMeta }) {
  const rootRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visible = useLazyVisible(rootRef);

  useEffect(() => {
    if (!visible) return;
    let dead = false;
    composeCover(book, COVER_W, COVER_H, book.animal ? assetUrl(book.animal) : null).then((cov) => {
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
    <button ref={rootRef} className="libm-row" onClick={() => openBook(book)} aria-label={`Open ${book.title}`}>
      <span className="libm-row-thumb">
        <canvas ref={canvasRef} className="libm-row-canvas" />
      </span>
      <span className="libm-row-text">
        <span className="libm-row-title">{book.title}</span>
        <span className="libm-row-sub">
          {chapters ? `${chapters} chapter${chapters === 1 ? '' : 's'}` : book.subtitle}
        </span>
      </span>
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

// The pushed second page: one series' books in order, large cover cards.
function SeriesPage({
  name,
  books,
  phase,
  detailRef,
}: {
  name: string;
  books: BookMeta[];
  phase: 'push' | 'pop' | 'idle';
  detailRef: React.MutableRefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={detailRef}
      className={`libm-detail${phase === 'push' ? ' is-push' : phase === 'pop' ? ' is-pop' : ''}`}
    >
      <header className="libm-detail-top">
        <button className="libm-back" onClick={() => window.history.back()} aria-label="Back to the library">
          <svg viewBox="0 0 12 20" width="12" height="20" aria-hidden="true">
            <path d="M10.5 1.5 2 10l8.5 8.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Library</span>
        </button>
        <h1 className="libm-detail-name">{name}</h1>
        <span className="libm-detail-meta">{books.length} books · read in order</span>
      </header>
      <div className="libm-detail-grid">
        {books.map((b, i) => (
          <DetailCard key={b.slug} book={b} index={b.seriesOrder ?? i + 1} />
        ))}
      </div>
    </div>
  );
}

function DetailCard({ book, index }: { book: BookMeta; index: number }) {
  const rootRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visible = useLazyVisible(rootRef);

  useEffect(() => {
    if (!visible) return;
    let dead = false;
    composeCover(book, COVER_W, COVER_H, book.animal ? assetUrl(book.animal) : null).then((cov) => {
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
    <button ref={rootRef} className="libm-card" onClick={() => openBook(book)} aria-label={`Open ${book.title}`}>
      <span className="libm-card-cover">
        <canvas ref={canvasRef} className="libm-card-canvas" />
      </span>
      <span className="libm-card-title">
        <b className="libm-card-num">№{index} </b>
        {book.title}
      </span>
    </button>
  );
}

export function MobileShelf({ books, error }: { books: BookMeta[] | null; error: string | null }) {
  const [query, setQuery] = useState('');
  const [series, setSeries] = useState<string | null>(() => seriesParam());
  const [phase, setPhase] = useState<'push' | 'pop' | 'idle'>('idle');
  const headerRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const dimRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());
  const phaseTimer = useRef<number | undefined>(undefined);
  const swipedRef = useRef(false);
  const seriesRef = useRef(series);
  seriesRef.current = series;

  const entries = useMemo(() => (books && books.length ? buildEntries(books) : null), [books]);

  // Letter → entries sections for the vertical list + rail.
  const sections = useMemo(() => {
    if (!entries) return null;
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
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

  const pushSeries = (name: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('series', name);
    window.history.pushState(null, '', url);
    setSeries(name);
    setPhase(reducedMotion() ? 'idle' : 'push');
    if (!reducedMotion()) settlePhase(PUSH_MS);
  };

  // Browser/hardware back-forward keeps the pushed page coherent.
  useEffect(() => {
    const onPopState = () => {
      const s = seriesParam();
      const cur = seriesRef.current;
      if (s === cur) return;
      if (s) {
        // forward into a series page
        setSeries(s);
        setPhase(reducedMotion() ? 'idle' : 'push');
        if (!reducedMotion()) settlePhase(PUSH_MS);
        return;
      }
      // popping back to the list
      if (swipedRef.current || reducedMotion()) {
        swipedRef.current = false;
        setPhase('idle');
        setSeries(null);
        return;
      }
      setPhase('pop');
      settlePhase(POP_MS, () => setSeries(null));
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // iOS edge-swipe back: drag from the left edge tracks the finger, committing
  // past a threshold animates out and pops history. Style writes go straight to
  // the DOM (refs) so no re-render happens per frame.
  useEffect(() => {
    const el = detailRef.current;
    if (!el || !series || phase !== 'idle') return;
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
  }, [series, phase]);

  const jumpTo = (letter: string) => {
    const el = sectionRefs.current.get(letter);
    if (!el) return;
    const headH = headerRef.current?.getBoundingClientRect().height ?? 0;
    // instant jump — smooth scrolling would fight the dragging finger
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - headH - 4 });
  };

  const renderEntry = (e: Entry) =>
    e.kind === 'book' ? (
      <BookRow key={`b:${e.book.slug}`} book={e.book} />
    ) : (
      <SeriesRow key={`s:${e.name}`} name={e.name} books={e.books} onOpen={() => pushSeries(e.name)} />
    );

  const seriesOpen = series !== null && seriesBooks !== null;
  const listUnder = seriesOpen && phase !== 'pop';

  return (
    <div className="libm">
      <div ref={listRef} className={`libm-list${listUnder ? ' is-under' : ''}`}>
        <header ref={headerRef} className="libm-top">
          <div className="libm-brand">
            <span className="libm-brand-mark">O’RLY?</span>
            <span className="libm-brand-name">The Bookshelf</span>
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
        {books && books.length === 0 && <div className="libm-empty">No books yet.</div>}

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

      {!q && !seriesOpen && entries && entries.length > 0 && (
        <AlphaRail active={activeLetters} onJump={jumpTo} />
      )}

      <div ref={dimRef} className={`libm-dim${listUnder ? ' is-on' : ''}`} aria-hidden="true" />

      {seriesOpen && (
        <SeriesPage name={series} books={seriesBooks} phase={phase} detailRef={detailRef} />
      )}
    </div>
  );
}
