import { useCallback, useEffect, useRef, useState } from 'react';
import { Presentation } from './engine/Presentation';
import { ChevronLeft, ChevronRight } from './engine/icons';
import { chapters as staticChapters, type Chapter } from './stories';

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

// The /learn page. Desktop (≥1024px): a fixed left sidebar of chapters next to
// the player. Tablet and smaller: a top toolbar whose hamburger opens the same
// list as a drawer. First view doesn't auto-play (a play overlay waits for a
// click); once started, every following chapter auto-plays. A `chapter` URL
// param deep-links to a chapter (without auto-playing).
export function LearnPage({
  embedded = false,
  chapters = staticChapters,
  title = 'almostnode, explained',
  tagline = 'How a browser-native dev environment actually works.',
}: {
  embedded?: boolean;
  chapters?: Chapter[];
  title?: string;
  tagline?: string;
}) {
  const [selectedId, setSelectedId] = useState(() => chapterFromUrl(chapters) ?? chapters[0].id);
  const [started, setStarted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selectedIndex = chapters.findIndex((c) => c.id === selectedId);
  const chapter = chapters[selectedIndex] ?? chapters[0];
  const nextChapter = chapters[selectedIndex + 1];
  const prevChapter = chapters[selectedIndex - 1];

  const onStart = useCallback(() => setStarted(true), []);
  const select = (id: string) => {
    setSelectedId(id);
    setMenuOpen(false);
  };

  // Deep-link: select the chapter named in the URL, and (when embedded on a
  // larger page) scroll the Learn section into view. Never auto-plays.
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
          <span className="learn-bar-brand">{title}</span>
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

        {/* static sidebar on desktop; slide-in drawer on tablet/mobile */}
        <nav className={`learn-nav${menuOpen ? ' open' : ''}`} aria-label="Chapters">
          <div className="learn-nav-head">
            <div className="learn-eyebrow">The Secret Lives of Data</div>
            <h1 className="learn-h1">{title}</h1>
            <p className="learn-tagline">{tagline}</p>
          </div>
          <ol className="learn-chapters">
            {chapters.map((c) => (
              <li key={c.id}>
                <button
                  className={`learn-chapter${c.id === selectedId ? ' active' : ''}`}
                  style={{ ['--accent']: c.accent } as React.CSSProperties}
                  onClick={() => select(c.id)}
                >
                  <span className="learn-num">{String(c.number).padStart(2, '0')}</span>
                  <span className="learn-ctext">
                    <span className="learn-ctitle">{c.title}</span>
                    <span className="learn-cblurb">{c.blurb}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <main className="learn-player">
          <Presentation
            key={chapter.id}
            story={chapter.story}
            audioUrl={chapter.audio}
            transcript={chapter.transcript}
            audioEnd={chapter.audioEnd}
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
