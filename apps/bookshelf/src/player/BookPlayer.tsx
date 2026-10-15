import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { ChapterPlayer } from './ChapterPlayer';
import { BlogPanel } from './BlogPanel';
import { BookSources } from './BookSources';
import { ScoreCard, useBookScore } from './ScoreCard';
import { PlayerSheet } from './PlayerSheet';
import { COMPACT_MQ, PORTRAIT_COMPACT_MQ, useMediaQuery } from './useMediaQuery';
import { registerAnimalPool, resolveAnimal, sortSeriesBooks } from '../library/shared';
import { useVideoAccent } from '../shell/useVideoAccent';

const ASSET_BASE =
  (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

/** Manifest v3: each chapter is one authored viz scene + one narration MP3. */
export interface ChapterV3 {
  number: number;
  title: string;
  blurb?: string;
  /** slug in the src/viz scene registry, e.g. 'books/replay-qa/chapter-1' */
  scene: string;
  /** MP3 path relative to the book dir, e.g. 'audio/chapter-1.mp3' */
  audio?: string;
  /** caption start times (s) in the MP3, one per caption */
  cues?: number[];
  /** total length (s) */
  duration?: number;
  /** optional Strudel music bed under the narration (generator/book-score.mjs), relative to the book dir */
  music?: { audio: string; /** 0-1 playback gain, default 0.3 */ gain?: number; /** the Strudel source, for the credits */ strudel?: string };
}

export interface ManifestV3 {
  format: number;
  slug: string;
  title: string;
  subtitle?: string;
  animal?: string;
  accent?: string;
  /** the book's sources page data (claims + quotations with links), relative to the book dir: 'sources.json' */
  sources?: string;
  chapters: ChapterV3[];
}

/** The subset of library.json's BookMeta this player needs for series nav. */
interface SeriesBookMeta {
  slug: string;
  title: string;
  animal?: string;
  href: string;
  series?: string;
  seriesOrder?: number;
  createdAt?: string;
}

/** One book's worth of chapters, flattened into the cross-book sidebar. */
interface SeriesGroup {
  book: SeriesBookMeta;
  chapters: ChapterV3[];
}

/** Format seconds as m:ss (blank for missing/zero). */
export function fmtDur(s?: number): string {
  if (!s || s < 1) return '';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}


/**
 * "Compact" layout — the video is sized by its own aspect ratio (not
 * stretched to fill the viewport) and chapters/blog live in a bottom drawer
 * instead of a side column. Covers BOTH small-portrait phones and
 * small-landscape phones with the SAME query, so there is no gap between
 * "sidebar disappears" and "drawer appears" — the two used to be decided by
 * different conditions (React checked portrait-only; a separate CSS rule
 * hid the sidebar in landscape too), which left landscape phones with
 * neither. (COMPACT_MQ, in ./useMediaQuery, shared with FilmPlayer.)
 */
// The drawer itself is portrait-only — in landscape there isn't enough
// vertical room for a bottom sheet without it swallowing the video, so
// landscape just shows the video with no way to reach chapters/blog.


function chapterFromUrl(count: number): number | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('chapter');
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= count ? n - 1 : null;
}

/** `?ep=N` — the Nth video overall across a series, spanning book boundaries. */
function episodeFromUrl(): number | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('ep');
  if (!raw) return null;
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

/**
 * The v3 book player: one full-bleed scene per chapter, autoplaying straight
 * off the shelf, with the ElevenLabs narration MP3 as the playback clock.
 * There is no separate "chapters" page — the sidebar (and, in a series, the
 * whole series) is always visible alongside the player, and the back arrow
 * always returns to the shelf.
 */
export function BookPlayer({
  slug,
  onHome,
}: {
  slug: string;
  /** Defaults to a full navigation back to the shelf. When BookPlayer is
   *  embedded as a pushed screen (MobileShelf's nav-controller feel), the
   *  caller instead passes `() => window.history.back()` so it pops like
   *  any other pushed screen instead of reloading the whole app. */
  onHome?: () => void;
}) {
  const base = `${ASSET_BASE}generated/${slug}/`;
  const [manifest, setManifest] = useState<ManifestV3 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [seriesGroups, setSeriesGroups] = useState<SeriesGroup[] | null>(null);
  const compact = useMediaQuery(COMPACT_MQ);
  const videoAccent = useVideoAccent();
  const drawerable = useMediaQuery(PORTRAIT_COMPACT_MQ);
  const [hasBlog, setHasBlog] = useState(false);
  const [tab, setTab] = useState<Tab>('chapters');
  // desktop: the sidebar card (chapters + the series' other videos) and the book's score share it as tabs
  const [sideTab, setSideTab] = useState<Tab>('chapters');
  const score = useBookScore(slug);
  const hasScore = score !== null;

  // Measure where the rendered video block (topbar + aspect-ratio stage +
  // controls) ends on screen so the drawer's resting position lands exactly at
  // its bottom edge — never covering the video, never leaving a gap under it.
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [videoH, setVideoH] = useState(0);
  useEffect(() => {
    if (!drawerable) return;
    const el = mainRef.current;
    if (!el) return;
    // the video block's BOTTOM edge, not just its height: inside the shelf's navigation stack a bar sits above it
    const ro = new ResizeObserver(() => setVideoH(Math.round(el.getBoundingClientRect().bottom)));
    ro.observe(el);
    return () => ro.disconnect();
    // `.bp-main` doesn't exist until `manifest` has loaded (there's an early
    // `if (!manifest) return <loading/>` before this JSX) — depending on
    // `drawerable` alone meant this ran once against a null ref on the very
    // first render and never again, since `drawerable` doesn't change when
    // manifest arrives a moment later. Re-run once the real element exists.
  }, [drawerable, manifest]);
  // Default to the Blog tab on mobile once we know the post exists — but
  // only the first time, so a manual tab switch sticks.
  const defaultedRef = useRef(false);
  useEffect(() => {
    if (defaultedRef.current || !hasBlog) return;
    if (drawerable) setTab('blog');
    defaultedRef.current = true;
  }, [hasBlog, drawerable]);

  // Check for a blog.md independent of which tab is active — otherwise the
  // Blog tab could never appear (it only mounts BlogPanel, whose fetch is
  // what sets hasBlog, once the tab is already 'blog').
  useEffect(() => {
    let alive = true;
    fetch(`${base}blog.md`, { method: 'HEAD' })
      .then((r) => {
        // Both Vite's dev server and the SPA's own fallback answer 200 with
        // index.html for ANY unmatched path — so a real 200 for blog.md still
        // isn't proof the file exists. Only a text/* content-type is.
        const ok = r.ok && !(r.headers.get('content-type') ?? '').includes('text/html');
        if (alive) setHasBlog(ok);
      })
      .catch(() => alive && setHasBlog(false));
    return () => {
      alive = false;
    };
  }, [base]);

  useEffect(() => {
    let alive = true;
    fetch(`${base}manifest.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((m: ManifestV3) => {
        if (!alive) return;
        if (m.format !== 3) throw new Error(`unsupported manifest format ${m.format}`);
        setManifest(m);
        setCurrent(chapterFromUrl(m.chapters.length) ?? 0);
      })
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [base]);

  // If this book belongs to a series, fetch the other books' manifests too,
  // so the sidebar can show the entire series (grouped by book cover) instead
  // of just this book's chapters — and resolve a cross-book `?ep=` deep link.
  useEffect(() => {
    if (!manifest) return;
    let alive = true;
    fetch(`${ASSET_BASE}generated/library.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(async (d: { books?: SeriesBookMeta[] }) => {
        if (!alive) return;
        const books = d.books || [];
        registerAnimalPool(books);
        const self = books.find((b) => b.slug === slug);
        if (!self?.series) return;
        const peers = sortSeriesBooks(
          self.series,
          books.filter((b) => b.series === self.series),
        );
        const groups = await Promise.all(
          peers.map(async (b): Promise<SeriesGroup> => {
            if (b.slug === slug) return { book: b, chapters: manifest.chapters };
            try {
              const r = await fetch(`${ASSET_BASE}generated/${b.slug}/manifest.json`);
              const m: ManifestV3 = await r.json();
              return { book: b, chapters: m.chapters };
            } catch {
              return { book: b, chapters: [] };
            }
          })
        );
        if (alive) setSeriesGroups(groups);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [manifest, slug]);

  // Resolve `?ep=N` (a position across the whole series) once the series is
  // known: jump to the right book (full navigation) or the right chapter
  // (local state) as needed.
  useEffect(() => {
    if (!seriesGroups) return;
    const ep = episodeFromUrl();
    if (!ep) return;
    let remaining = ep;
    for (const g of seriesGroups) {
      if (remaining <= g.chapters.length) {
        if (g.book.slug !== slug) {
          window.location.href = `${ASSET_BASE}?bundle=${g.book.slug}&chapter=${remaining}`;
        } else if (remaining - 1 !== current) {
          setCurrent(remaining - 1);
        }
        return;
      }
      remaining -= g.chapters.length;
    }
  }, [seriesGroups, slug]);

  // Desktop: the sidebar's own scroll container. Mobile portrait: the
  // drawer's list, which is ALSO its own scroll container (unlike the old
  // layout where the sidebar flowed into page scroll) — so auto-scrolling to
  // the active chapter there no longer yanks the page away from the video.
  const sideListRef = useRef<HTMLUListElement | null>(null);
  const drawerListRef = useRef<HTMLUListElement | null>(null);
  useEffect(() => {
    const el = (drawerable ? drawerListRef.current : sideListRef.current)?.querySelector('.active');
    // scroll only the list's own scroller (scrollIntoView also moves overflow-hidden ancestors, which pushed the
    // bottom sheet's tabs under its handle): top-aligned in the sheet, whose upper part is what shows at rest;
    // centred in the desktop sidebar
    const box = el?.closest('.ps-content, .bp-side') as HTMLElement | null;
    if (el && box) {
      const r = el.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const inSheet = box.classList.contains('ps-content');
      box.scrollTo({ top: box.scrollTop + (r.top - b.top) - (inSheet ? 8 : (b.height - r.height) / 2), behavior: 'smooth' });
    }
  }, [current, manifest, seriesGroups, drawerable]);

  // Keep the URL in sync with the chapter being watched, so it's shareable
  // and the browser back/forward buttons step through chapters. Skip the
  // very first sync after load — the URL is already correct (it's what
  // `current`'s initial value came from).
  const skipNextUrlSyncRef = useRef(true);
  useEffect(() => {
    if (!manifest) return;
    if (skipNextUrlSyncRef.current) {
      skipNextUrlSyncRef.current = false;
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.set('bundle', slug);
    url.searchParams.set('chapter', String(current + 1));
    url.searchParams.delete('ep');
    window.history.pushState(null, '', url);
  }, [current, manifest, slug]);

  // Back/forward should step between chapters too.
  useEffect(() => {
    if (!manifest) return;
    const onPopState = () => setCurrent(chapterFromUrl(manifest.chapters.length) ?? 0);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [manifest]);

  const goHome = onHome ?? (() => { window.location.href = ASSET_BASE; });

  const goToChapter = (group: SeriesGroup, i: number) => {
    if (group.book.slug === slug) {
      setCurrent(i);
    } else {
      window.location.href = `${ASSET_BASE}?bundle=${group.book.slug}&chapter=${i + 1}`;
    }
  };

  const flatGroups = useMemo(
    () => seriesGroups ?? (manifest ? [{ book: { slug, title: manifest.title, animal: manifest.animal, href: '' }, chapters: manifest.chapters }] : []),
    [seriesGroups, manifest, slug]
  );

  if (error) return <div className="bp-loading">Couldn’t load “{slug}”: {error}</div>;
  if (!manifest) return <div className="bp-loading">Loading the book…</div>;

  // The video color from Settings wins over the book's own manifest accent:
  // it's a stated preference for how every video should look, and a per-book
  // brand color quietly overriding it would make the setting look broken.
  const accent = videoAccent;
  const chapter = manifest.chapters[current];

  return (
    <div className="bp" style={{ ['--accent' as string]: accent }}>
      <div className="bp-layout">
        <div className="bp-main" ref={mainRef}>
          <ChapterPlayer
            key={`${slug}/${chapter.number}`}
            base={base}
            chapter={chapter}
            bookTitle={manifest.title}
            index={current}
            count={manifest.chapters.length}
            nextTitle={manifest.chapters[current + 1]?.title}
            onPrev={current > 0 ? () => setCurrent(current - 1) : undefined}
            onNext={current < manifest.chapters.length - 1 ? () => setCurrent(current + 1) : undefined}
            onExit={goHome}
          />
          {!compact && (hasBlog || manifest.sources) && (
            <div className="bp-below-video">
              {hasBlog && <BlogPanel base={base} onAvailable={setHasBlog} />}
              {manifest.sources && <BookSources url={`${base}${manifest.sources}`} currentChapter={chapter.number} onChapter={(n) => setCurrent(n - 1)} />}
            </div>
          )}
        </div>
        {!compact && (
          <aside className="bp-side" aria-label="Chapters and score">
            {hasScore && <TabBar tab={sideTab} setTab={setSideTab} hasBlog={false} hasScore />}
            {sideTab === 'score' && score ? (
              <ScoreCard score={score} />
            ) : (
              <ChapterList
                listRef={sideListRef}
                flatGroups={flatGroups}
                slug={slug}
                current={current}
                goToChapter={goToChapter}
              />
            )}
          </aside>
        )}
      </div>

      {/* the mobile bottom sheet (FloatingSheet), resting at the video's measured bottom edge */}
      {drawerable && videoH > 0 && (
        <PlayerSheet
          label="Chapters, blog post and score"
          top={videoH}
          tab={tab}
          onTab={(t) => setTab(t as Tab)}
          tabs={[
            {
              id: 'chapters',
              label: 'Chapters',
              content: (
                <ChapterList
                  listRef={drawerListRef}
                  flatGroups={flatGroups}
                  slug={slug}
                  current={current}
                  goToChapter={goToChapter}
                />
              ),
            },
            ...(hasBlog
              ? [
                  {
                    id: 'blog',
                    label: 'Blog',
                    content: (
                      <div className="bp-side-blog">
                        <BlogPanel base={base} onAvailable={setHasBlog} />
                        {manifest?.sources && <BookSources url={`${base}${manifest.sources}`} currentChapter={chapter?.number} onChapter={(n) => setCurrent(n - 1)} />}
                      </div>
                    ),
                  },
                ]
              : []),
            ...(score ? [{ id: 'score', label: 'Score', content: <ScoreCard score={score} /> }] : []),
          ]}
        />
      )}
    </div>
  );
}

type Tab = 'chapters' | 'blog' | 'score';

/** The card's tabs: Chapters (with the series' other videos), Blog and Score. The mobile drawer shows all three;
 * desktop shows the blog below the video, so its sidebar card has Chapters and Score. */
function TabBar({
  tab,
  setTab,
  hasBlog,
  hasScore,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  hasBlog: boolean;
  hasScore: boolean;
}) {
  if (!hasBlog && !hasScore) return null;
  const tabs: [Tab, string][] = [['chapters', 'Chapters'], ...(hasBlog ? ([['blog', 'Blog']] as [Tab, string][]) : []), ...(hasScore ? ([['score', 'Score']] as [Tab, string][]) : [])];
  return (
    <div className="bp-tabbar" role="tablist">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          className={`bp-tab${tab === id ? ' active' : ''}`}
          role="tab"
          aria-selected={tab === id}
          onClick={() => setTab(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ChapterList({
  listRef,
  flatGroups,
  slug,
  current,
  goToChapter,
}: {
  listRef: RefObject<HTMLUListElement>;
  flatGroups: SeriesGroup[];
  slug: string;
  current: number;
  goToChapter: (group: SeriesGroup, i: number) => void;
}) {
  return (
    <ul className="bp-side-list" ref={listRef}>
      {flatGroups.map((g) => (
        <li className="bp-side-group" key={g.book.slug}>
          {flatGroups.length > 1 && (
            <div className="bp-side-cover">
              {resolveAnimal(g.book) && (
                <img
                  // library.json's `animal` is already a full relative path
                  // (generated/<slug>/animal.webp) — no extra prefix needed.
                  src={`${ASSET_BASE}${resolveAnimal(g.book)}`}
                  alt=""
                  loading="lazy"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              )}
              <span className="bp-side-cover-text">
                {g.book.seriesOrder != null && (
                  <span className="bp-side-cover-num">Book {g.book.seriesOrder}</span>
                )}
                <span className="bp-side-cover-title">{g.book.title}</span>
              </span>
            </div>
          )}
          <ul className="bp-side-list">
            {g.chapters.map((c, i) => {
              const active = g.book.slug === slug && i === current;
              return (
                <li key={c.number}>
                  <button
                    className={`bp-side-item${active ? ' active' : ''}`}
                    onClick={() => goToChapter(g, i)}
                    aria-current={active ? 'true' : undefined}
                  >
                    <span className="bp-side-thumb">
                      <img
                        src={`${ASSET_BASE}generated/${g.book.slug}/previews/chapter-${c.number}.png`}
                        alt=""
                        loading="lazy"
                        onError={(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')}
                      />
                      <span className="bp-side-num">{String(c.number).padStart(2, '0')}</span>
                    </span>
                    <span className="bp-side-text">
                      <span className="bp-side-ctitle">{c.title}</span>
                      {fmtDur(c.duration) && <span className="bp-side-dur">{fmtDur(c.duration)}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </li>
      ))}
    </ul>
  );
}
