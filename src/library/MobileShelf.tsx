// The touch-first browse UI for phones (portrait and landscape): sticky search,
// a recently-added strip, and one swipeable section of large cover cards per
// series (always in series order). Completely separate from the desktop spine
// shelf — front covers only, since hover doesn't exist on touch.
import { useEffect, useMemo, useRef, useState } from 'react';
import { composeCover, type BookMeta } from './cover';
import {
  assetUrl,
  buildShelves,
  groupMatches,
  openBook,
  searchBooks,
  useLazyVisible,
} from './shared';

const COVER_W = 600;
const COVER_H = 800;

function CoverCard({
  book,
  seriesIndex,
  small,
}: {
  book: BookMeta;
  seriesIndex?: number;
  small?: boolean;
}) {
  const rootRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const visible = useLazyVisible(rootRef);

  useEffect(() => {
    if (!visible) return;
    let dead = false;
    composeCover(book, COVER_W, COVER_H, book.animal ? assetUrl(book.animal) : null).then(
      (cov) => {
        if (dead) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        // Render at the canvas's CSS size (set by the stylesheet) at 2×.
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
      },
    );
    return () => {
      dead = true;
    };
  }, [visible, book]);

  return (
    <button
      ref={rootRef}
      className={`libm-card${small ? ' libm-card-sm' : ''}`}
      onClick={() => openBook(book)}
      aria-label={`Open ${book.title}`}
    >
      <span className="libm-card-cover">
        <canvas ref={canvasRef} className="libm-card-canvas" />
      </span>
      <span className="libm-card-title">
        {seriesIndex ? <b className="libm-card-num">№{seriesIndex} </b> : null}
        {book.title}
      </span>
    </button>
  );
}

function Section({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="libm-section">
      <div className="libm-section-head">
        <h2 className="libm-section-name">{title}</h2>
        {meta && <span className="libm-section-meta">{meta}</span>}
      </div>
      <div className="libm-strip">{children}</div>
    </section>
  );
}

export function MobileShelf({ books, error }: { books: BookMeta[] | null; error: string | null }) {
  const [query, setQuery] = useState('');

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
    <div className="libm">
      <header className="libm-top">
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

      {matches &&
        (matchCount === 0 ? (
          <div className="libm-empty">No books match “{q}”.</div>
        ) : (
          <div className="libm-results">
            <div className="libm-result-count">
              {matchCount} {matchCount === 1 ? 'match' : 'matches'}
            </div>
            {matches.sets.map(([name, arr]) => (
              <Section key={name} title={name} meta={`${arr.length} in series`}>
                {arr.map((b, i) => (
                  <CoverCard key={b.slug} book={b} seriesIndex={b.seriesOrder ?? i + 1} />
                ))}
              </Section>
            ))}
            {matches.singles.length > 0 && (
              <Section title="Books">
                {matches.singles.map((b) => (
                  <CoverCard key={b.slug} book={b} />
                ))}
              </Section>
            )}
          </div>
        ))}

      {!matches && shelves && (
        <>
          <Section title="Recently added">
            {shelves.recent.map((b) => (
              <CoverCard key={b.slug} book={b} small />
            ))}
          </Section>
          {shelves.seriesRows.map(([name, arr]) => (
            <Section key={name} title={name} meta={`${arr.length}-book series`}>
              {arr.map((b, i) => (
                <CoverCard key={b.slug} book={b} seriesIndex={b.seriesOrder ?? i + 1} />
              ))}
            </Section>
          ))}
          {shelves.loops.length > 0 && (
            <Section title="Agent Loops" meta="standalone builds">
              {shelves.loops.map((b) => (
                <CoverCard key={b.slug} book={b} />
              ))}
            </Section>
          )}
          {shelves.more.length > 0 && (
            <Section title="More from the shelf" meta="one-offs">
              {shelves.more.map((b) => (
                <CoverCard key={b.slug} book={b} />
              ))}
            </Section>
          )}
        </>
      )}

      <footer className="libm-foot">by Brett Lamy · an “O’RLY?” parody</footer>
    </div>
  );
}
