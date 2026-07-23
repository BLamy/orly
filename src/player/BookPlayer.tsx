import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Drawer } from 'vaul';
import { ChapterPlayer } from './ChapterPlayer';
import { BlogPanel } from './BlogPanel';
import { registerAnimalPool, resolveAnimal } from '../library/shared';

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
}

export interface ManifestV3 {
  format: number;
  slug: string;
  title: string;
  subtitle?: string;
  animal?: string;
  accent?: string;
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

/** Reactively track a CSS media query (SSR-safe). Mirrors ChapterPlayer's private copy. */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

/**
 * "Compact" layout — the video is sized by its own aspect ratio (not
 * stretched to fill the viewport) and chapters/blog live in a bottom drawer
 * instead of a side column. Covers BOTH small-portrait phones and
 * small-landscape phones with the SAME query, so there is no gap between
 * "sidebar disappears" and "drawer appears" — the two used to be decided by
 * different conditions (React checked portrait-only; a separate CSS rule
 * hid the sidebar in landscape too), which left landscape phones with
 * neither.
 */
const COMPACT_MQ =
  '(max-width: 720px) and (orientation: portrait), (max-width: 1000px) and (orientation: landscape) and (max-height: 520px)';

// The drawer itself is portrait-only — in landscape there isn't enough
// vertical room for a bottom sheet without it swallowing the video, so
// landscape just shows the video with no way to reach chapters/blog.
const PORTRAIT_COMPACT_MQ = '(max-width: 720px) and (orientation: portrait)';

// The drawer's resting (peek) height is computed from the actual rendered
// video block so it always ends exactly where the video does — see the
// videoH/viewportH tracking below. This is only the pre-measurement guess
// used for the very first frame.
const FALLBACK_PEEK_PX = 280;
const MIN_PEEK_PX = 120;

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
  const drawerable = useMediaQuery(PORTRAIT_COMPACT_MQ);
  const [hasBlog, setHasBlog] = useState(false);
  const [tab, setTab] = useState<'chapters' | 'blog'>('chapters');

  // Measure the actual rendered video block (topbar + aspect-ratio stage +
  // controls) so the drawer's resting position lands exactly at its bottom
  // edge — never covering the video, never leaving a gap under it.
  const mainRef = useRef<HTMLDivElement | null>(null);
  const [videoH, setVideoH] = useState(0);
  useEffect(() => {
    if (!drawerable) return;
    const el = mainRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setVideoH(entries[0].contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
    // `.bp-main` doesn't exist until `manifest` has loaded (there's an early
    // `if (!manifest) return <loading/>` before this JSX) — depending on
    // `drawerable` alone meant this ran once against a null ref on the very
    // first render and never again, since `drawerable` doesn't change when
    // manifest arrives a moment later. Re-run once the real element exists.
  }, [drawerable, manifest]);
  const [viewportH, setViewportH] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  useEffect(() => {
    const onResize = () => setViewportH(window.innerHeight);
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  const drawerPeekPx = Math.round(
    Math.max(videoH ? viewportH - videoH : FALLBACK_PEEK_PX, MIN_PEEK_PX)
  );
  const drawerSnapPoints = useMemo<(number | string)[]>(
    () => [`${drawerPeekPx}px`, 1],
    [drawerPeekPx]
  );
  const [drawerSnap, setDrawerSnap] = useState<number | string | null>(`${drawerPeekPx}px`);
  // Keep the resting snap point glued to "just below the video" as that
  // height changes (resize, orientation change) — but leave the user's
  // choice alone if they've dragged it open to fullscreen.
  useEffect(() => {
    setDrawerSnap((cur) => (cur === 1 ? cur : `${drawerPeekPx}px`));
  }, [drawerPeekPx]);

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
        const peers = books
          .filter((b) => b.series === self.series)
          .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
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
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  const accent = manifest.accent ?? '#38bdf8';
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
          {!compact && hasBlog && (
            <div className="bp-below-video">
              <BlogPanel base={base} onAvailable={setHasBlog} />
            </div>
          )}
        </div>
        {!compact && (
          <aside className="bp-side" aria-label="Chapters">
            <ChapterList
              listRef={sideListRef}
              flatGroups={flatGroups}
              slug={slug}
              current={current}
              goToChapter={goToChapter}
            />
          </aside>
        )}
      </div>

      {/* Don't mount the drawer until we have a REAL measured video height —
          vaul bakes its snap-point offset in at first mount and doesn't
          reliably re-snap just because `snapPoints`/`activeSnapPoint` change
          later, so mounting early with the FALLBACK_PEEK_PX guess left it
          stuck too low forever (confirmed: only an orientation change, which
          fully remounts the Drawer via the `drawerable` flip, ever fixed it). */}
      {drawerable && videoH > 0 && (
        <Drawer.Root
          open
          modal={false}
          dismissible={false}
          snapPoints={drawerSnapPoints}
          activeSnapPoint={drawerSnap}
          setActiveSnapPoint={setDrawerSnap}
        >
          <Drawer.Portal>
            <Drawer.Content className="bp-drawer" aria-label="Chapters and blog post">
              <Drawer.Handle className="bp-drawer-handle" />
              <TabBar tab={tab} setTab={setTab} hasBlog={hasBlog} />
              <div className="bp-drawer-scroll">
                {tab === 'chapters' ? (
                  <ChapterList
                    listRef={drawerListRef}
                    flatGroups={flatGroups}
                    slug={slug}
                    current={current}
                    goToChapter={goToChapter}
                  />
                ) : (
                  <div className="bp-side-blog">
                    <BlogPanel base={base} onAvailable={setHasBlog} />
                  </div>
                )}
              </div>
            </Drawer.Content>
          </Drawer.Portal>
        </Drawer.Root>
      )}
    </div>
  );
}

/** Chapters/Blog toggle — mobile drawer only; desktop shows both at once
 * (chapters in the sidebar, blog below the video), so it needs no tabs. */
function TabBar({
  tab,
  setTab,
  hasBlog,
}: {
  tab: 'chapters' | 'blog';
  setTab: (t: 'chapters' | 'blog') => void;
  hasBlog: boolean;
}) {
  if (!hasBlog) return null;
  return (
    <div className="bp-tabbar" role="tablist">
      <button
        className={`bp-tab${tab === 'chapters' ? ' active' : ''}`}
        role="tab"
        aria-selected={tab === 'chapters'}
        onClick={() => setTab('chapters')}
      >
        Chapters
      </button>
      <button
        className={`bp-tab${tab === 'blog' ? ' active' : ''}`}
        role="tab"
        aria-selected={tab === 'blog'}
        onClick={() => setTab('blog')}
      >
        Blog
      </button>
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
