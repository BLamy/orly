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

function ShelfBook({ book }: { book: BookMeta }) {
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
        <span className="lib-book-cap-sub">{book.subtitle}</span>
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

      {books && books.length > 0 && (
        <div className="lib-grid">
          {books.map((b) => (
            <ShelfBook key={b.slug} book={b} />
          ))}
        </div>
      )}

      <footer className="lib-foot">
        by Brett Lamy · an “O’RLY?” parody · icons via the Noun Project (CC BY) · made with Claude Code
      </footer>
    </div>
  );
}
