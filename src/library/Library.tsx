import { useEffect, useRef, useState } from 'react';
import { drawCover, type BookMeta } from './cover';
import { drawBook3D } from './book3d';
import './library.css';

const ASSET_BASE =
  (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
const assetUrl = (p: string) => ASSET_BASE + String(p).replace(/^\//, '');

const COVER_W = 600;
const COVER_H = 800;
const BOOK_W = 230; // logical canvas size
const BOOK_H = 340;

const REPO_URL = 'https://github.com/BLamy/orly';
const WORKFLOWS_URL = 'https://github.com/BLamy/orly/blob/main/generator/prompts/storyboard.txt';

// The self-explaining "ORLY Loop" book always leads the shelf, regardless of the
// createdAt order the generator writes into library.json.
const PINNED_SLUG = 'the-orly-loop';

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function ShelfBook({ book, seriesIndex }: { book: BookMeta; seriesIndex?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const coverRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);
  const [hover, setHover] = useState(false);

  // compose the O'Reilly cover once (after the animal loads)
  useEffect(() => {
    const cover = document.createElement('canvas');
    cover.width = COVER_W;
    cover.height = COVER_H;
    const cctx = cover.getContext('2d');
    if (!cctx) return;
    const finish = (img: HTMLImageElement | null) => {
      drawCover(cctx, COVER_W, COVER_H, book, img);
      coverRef.current = cover;
      setReady(true);
    };
    if (!book.animal) return finish(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => finish(img);
    img.onerror = () => finish(null);
    img.src = assetUrl(book.animal);
  }, [book]);

  // draw the 3-D book
  useEffect(() => {
    const canvas = canvasRef.current;
    const cover = coverRef.current;
    if (!canvas || !cover) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = BOOK_W * dpr;
    canvas.height = BOOK_H * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, BOOK_W, BOOK_H);
    const T = BOOK_W * 0.05;
    const margin = T + 8;
    const bw = BOOK_W - margin - 14;
    const bh = Math.min(BOOK_H - 40, bw / 0.75);
    const bx = margin;
    const by = (BOOK_H - bh) / 2 + 4;
    drawBook3D(ctx, bx, by, bw, bh, cover, { lift: hover ? 10 : 0 });
  }, [ready, hover]);

  const open = () => {
    window.location.href = ASSET_BASE + String(book.href).replace(/^\//, '');
  };

  return (
    <button
      className="lib-book"
      onClick={open}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label={`Open ${book.title}`}
    >
      <canvas ref={canvasRef} className="lib-book-canvas" style={{ width: BOOK_W, height: BOOK_H }} />
      <span className="lib-book-cap">
        <span className="lib-book-cap-title">{book.title}</span>
        <span className="lib-book-cap-sub">
          {seriesIndex ? <b className="lib-book-num">№{seriesIndex} · </b> : null}
          {book.subtitle}
        </span>
      </span>
    </button>
  );
}

export function Library() {
  const [books, setBooks] = useState<BookMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(assetUrl('generated/library.json'))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setBooks(d.books || []))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="lib">
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

      <header className="lib-head">
        <div className="lib-eyebrow">The Secret Lives of Data</div>
        <h1 className="lib-title">The O’RLY Bookshelf</h1>
        <p className="lib-sub">
          Pick any codebase, get a narrated, animated explainer — bound as an “O’RLY?” parody book.
          Tap a spine to read it.
        </p>
      </header>

      {error && <div className="lib-empty">Couldn’t load the library: {error}</div>}
      {!books && !error && <div className="lib-empty">Loading the shelf…</div>}
      {books && books.length === 0 && (
        <div className="lib-empty">No books yet — generate one with <code>npm run explain</code>.</div>
      )}

      {books && books.length > 0 && (() => {
        const standalone = books
          .filter((b) => !b.series)
          .sort((a, c) => (a.slug === PINNED_SLUG ? -1 : c.slug === PINNED_SLUG ? 1 : 0));
        const seriesMap = new Map<string, BookMeta[]>();
        for (const b of books) {
          if (!b.series) continue;
          if (!seriesMap.has(b.series)) seriesMap.set(b.series, []);
          seriesMap.get(b.series)!.push(b);
        }
        for (const arr of seriesMap.values()) arr.sort((a, c) => (a.seriesOrder ?? 0) - (c.seriesOrder ?? 0));
        return (
          <>
            {standalone.length > 0 && (
              <div className="lib-grid">
                {standalone.map((b) => (
                  <ShelfBook key={b.slug} book={b} />
                ))}
              </div>
            )}
            {[...seriesMap.entries()].map(([name, arr]) => (
              <section className="lib-series" key={name}>
                <div className="lib-series-head">
                  <h2 className="lib-series-name">{name}</h2>
                  <span className="lib-series-meta">a {arr.length}-book series · read in order →</span>
                </div>
                <div className="lib-series-row">
                  {arr.map((b, i) => (
                    <ShelfBook key={b.slug} book={b} seriesIndex={b.seriesOrder ?? i + 1} />
                  ))}
                </div>
              </section>
            ))}
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
