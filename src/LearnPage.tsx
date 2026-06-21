import { useCallback, useEffect, useRef, useState } from 'react';
import { Presentation } from './engine/Presentation';
import { ChevronLeft, ChevronRight } from './engine/icons';
import { chapters as staticChapters, type Chapter } from './stories';
import { BookCoverThumb } from './library/BookCoverThumb';
import type { BookMeta } from './library/cover';

const ASSET_BASE =
  (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

/** A book in the same series, for the series sidebar. */
export type SeriesBook = BookMeta & {
  chapters: { number: number; title: string; duration?: number }[];
  current?: boolean;
};

/** Format seconds as m:ss (blank for missing/zero). */
function fmtDur(s?: number): string {
  if (!s || s < 1) return '';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// Resolve a `chapter` deep-link from the URL: ?chapter=3 (1-based) or
// ?chapter=tailscale, in the query string *or* tacked onto the hash, e.g.
// `#learn?chapter=3`. Returns a chapter id, or null.
function chapterFromUrl(list: Chapter[]): string | null {
  if (typeof window === 'undefined') return null;
  const fromQs = (qs: string) => new URLSearchParams(qs).get('chapter');
  let raw = fromQs(window.location.search);
  if (!raw) {
    const hash = window.location.hash.replace(/^#/, '');
    const q = hash.indexOf('?');
    if (q >= 0) raw = fromQs(hash.slice(q + 1));
  }
  if (!raw) return null;
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 1 && n <= list.length) return list[n - 1].id;
  return list.some((c) => c.id === raw) ? raw : null;
}

function hashWantsLearn(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.replace(/^#/, '');
  return hash === 'learn' || hash.startsWith('learn?') || hash.startsWith('learn&');
}

// The player. Desktop (≥1024px): a fixed left sidebar next to the player. When
// the book belongs to a series, the sidebar shows the WHOLE series (each book as
// a cover separator with its chapters under it). The active chapter auto-scrolls
// into view as the slideshow advances.
export function LearnPage({
  embedded = false,
  chapters = staticChapters,
  title = 'almostnode, explained',
  tagline = 'How a browser-native dev environment actually works.',
  series,
}: {
  embedded?: boolean;
  chapters?: Chapter[];
  title?: string;
  tagline?: string;
  series?: { name: string; books: SeriesBook[] };
}) {
  const [selectedId, setSelectedId] = useState(() => chapterFromUrl(chapters) ?? chapters[0].id);
  const [started, setStarted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const activeChapterRef = useRef<HTMLButtonElement | null>(null);

  const selectedIndex = chapters.findIndex((c) => c.id === selectedId);
  const chapter = chapters[selectedIndex] ?? chapters[0];
  const nextChapter = chapters[selectedIndex + 1];
  const prevChapter = chapters[selectedIndex - 1];

  const onStart = useCallback(() => setStarted(true), []);
  const select = (id: string) => {
    setSelectedId(id);
    setMenuOpen(false);
  };
  const goBook = (slug: string, chapterNumber?: number) => {
    window.location.href = `${ASSET_BASE}?bundle=${slug}${chapterNumber ? `&chapter=${chapterNumber}` : ''}`;
  };

  // Deep-link: select the chapter named in the URL, and (when embedded) scroll
  // the Learn section into view. Never auto-plays.
  useEffect(() => {
    const apply = () => {
      const id = chapterFromUrl(chapters);
      if (id) {
        setSelectedId(id);
        setMenuOpen(false);
      }
      if (embedded && (id || hashWantsLearn())) {
        const target = (rootRef.current?.closest('#learn') as HTMLElement | null) ?? rootRef.current;
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    apply();
    window.addEventListener('hashchange', apply);
    window.addEventListener('popstate', apply);
    return () => {
      window.removeEventListener('hashchange', apply);
      window.removeEventListener('popstate', apply);
    };
  }, [embedded, chapters]);

  // Auto-scroll the sidebar to the active chapter whenever it changes.
  useEffect(() => {
    activeChapterRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  return (
    <div ref={rootRef} className={`learn${embedded ? ' learn-embedded' : ''}`}>
      {/* toolbar — only shown on tablet and smaller (CSS) */}
      <header className="learn-bar">
        <button
          className="learn-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Chapters"
          aria-expanded={menuOpen}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div className="learn-bar-mid">
          <span className="learn-bar-brand">{series ? series.name : title}</span>
          <span className="learn-bar-chapter">
            <span className="learn-bar-num" style={{ color: chapter.accent }}>
              {String(chapter.number).padStart(2, '0')}
            </span>
            {chapter.title}
          </span>
        </div>
        <div className="learn-bar-nav">
          <button onClick={() => prevChapter && select(prevChapter.id)} disabled={!prevChapter} aria-label="Previous chapter">
            <ChevronLeft />
          </button>
          <button onClick={() => nextChapter && select(nextChapter.id)} disabled={!nextChapter} aria-label="Next chapter">
            <ChevronRight />
          </button>
        </div>
      </header>

      <div className="learn-body">
        {menuOpen && <div className="learn-backdrop" onClick={() => setMenuOpen(false)} />}

        <nav className={`learn-nav${menuOpen ? ' open' : ''}`} aria-label="Chapters">
          {series ? (
            <>
              <div className="learn-nav-head">
                <div className="learn-eyebrow">A book series</div>
                <h1 className="learn-h1 series">{series.name}</h1>
                <p className="learn-tagline">{series.books.length} books · read in order</p>
              </div>
              {series.books.map((b) => (
                <div className="learn-series-section" key={b.slug}>
                  <a
                    className={`learn-series-book${b.current ? ' current' : ''}`}
                    href={b.current ? undefined : `${ASSET_BASE}?bundle=${b.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!b.current) goBook(b.slug);
                    }}
                  >
                    <BookCoverThumb book={b} width={52} />
                    <span className="learn-series-binfo">
                      <span className="learn-series-btitle">{b.title}</span>
                      <span className="learn-series-bsub">{b.subtitle}</span>
                      <span className="learn-series-bmeta">
                        {b.chapters.length} chapters · {fmtDur(b.chapters.reduce((s, c) => s + (c.duration ?? 0), 0))}
                      </span>
                    </span>
                  </a>
                  <ol className="learn-chapters compact">
                    {b.chapters.map((ch) => {
                      const active = !!b.current && chapter.number === ch.number;
                      return (
                        <li key={ch.number}>
                          <button
                            ref={active ? activeChapterRef : undefined}
                            className={`learn-chapter compact${active ? ' active' : ''}`}
                            style={{ ['--accent']: b.color } as React.CSSProperties}
                            onClick={() => {
                              if (b.current) {
                                const loaded = chapters.find((c) => c.number === ch.number);
                                if (loaded) select(loaded.id);
                              } else {
                                goBook(b.slug, ch.number);
                              }
                            }}
                          >
                            <span className="learn-num">{String(ch.number).padStart(2, '0')}</span>
                            <span className="learn-ctext">
                              <span className="learn-ctitle">{ch.title}</span>
                              {fmtDur(ch.duration) && <span className="learn-cdur">{fmtDur(ch.duration)}</span>}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="learn-nav-head">
                <div className="learn-eyebrow">The Secret Lives of Data</div>
                <h1 className="learn-h1">{title}</h1>
                <p className="learn-tagline">{tagline}</p>
              </div>
              <ol className="learn-chapters">
                {chapters.map((c) => (
                  <li key={c.id}>
                    <button
                      ref={c.id === selectedId ? activeChapterRef : undefined}
                      className={`learn-chapter${c.id === selectedId ? ' active' : ''}`}
                      style={{ ['--accent']: c.accent } as React.CSSProperties}
                      onClick={() => select(c.id)}
                    >
                      <span className="learn-num">{String(c.number).padStart(2, '0')}</span>
                      <span className="learn-ctext">
                        <span className="learn-ctitle">{c.title}</span>
                        <span className="learn-cblurb">{c.blurb}</span>
                        {fmtDur(c.audioEnd) && <span className="learn-cdur">{fmtDur(c.audioEnd)}</span>}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </>
          )}
        </nav>

        <main className="learn-player">
          <Presentation
            key={chapter.id}
            story={chapter.story}
            audioUrl={chapter.audio}
            transcript={chapter.transcript}
            audioEnd={chapter.audioEnd}
            coverNote={fmtDur(chapter.audioEnd)}
            autoStart={started}
            onStart={onStart}
            nextChapterTitle={nextChapter?.title}
            onNextChapter={nextChapter ? () => setSelectedId(nextChapter.id) : undefined}
          />
        </main>
      </div>
    </div>
  );
}
