import { Suspense, lazy, useEffect, useState } from 'react';
import { Library, MOBILE_MQ } from './library/Library';
import { InstallBanner } from './shell/InstallBanner';

// The book player (and its scene/katex machinery) loads only for ?bundle=…;
// the standalone written post has its own lazy entry for ?blog=….
const BookPlayer = lazy(() =>
  import('./player/BookPlayer').then((m) => ({ default: m.BookPlayer }))
);
const BlogOnly = lazy(() =>
  import('./player/BlogOnly').then((m) => ({ default: m.BlogOnly }))
);
// films: frame-exact render harness (?film-render=<slug>) and review studio (?film-studio=<slug>)
const FilmHarness = lazy(() => import('./viz/film/core/harness'));
const FilmStudio = lazy(() => import('./viz/film/core/studio'));
// films on the shelf are VHS tapes; ?film=<slug> is the tape playing in the VCR, pushed onto the shelf's
// navigation stack (Library, shell/nav.tsx) so it has a back button to the shelf even from a shared link
// the film editor (?film-edit=<slug>, docs/film/EDITOR.md) and its frame-exact export harness (?film-edit-render=<slug>)
const FilmEditor = lazy(() => import('./editor/ui/Editor'));
const EditRenderHarness = lazy(() => import('./editor/render/EditRenderHarness'));

function param(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const fromQs = new URLSearchParams(window.location.search).get(name);
  if (fromQs) return fromQs;
  const hash = window.location.hash.replace(/^#/, '');
  const q = hash.indexOf('?');
  if (q >= 0) return new URLSearchParams(hash.slice(q + 1)).get(name);
  return null;
}

export function App() {
  const bundleSlug = param('bundle');
  const blogSlug = param('blog');
  // On mobile a book is a PUSHED screen on its tab's navigation stack
  // (MobileShelf, shell/nav.tsx: slide transition, back-swipe), not a hard
  // navigation — so the shelf mounts even when `?bundle=` is present and
  // reads it from the URL. Desktop keeps the plain full-page player.
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_MQ).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const filmRender = param('film-render');
  const filmStudio = param('film-studio');
  const filmEdit = param('film-edit');
  const filmEditRender = param('film-edit-render');
  if (filmEdit || filmEditRender) {
    return (
      <Suspense fallback={null}>
        {filmEditRender ? <EditRenderHarness slug={filmEditRender} /> : <FilmEditor key={filmEdit} slug={filmEdit!} />}
      </Suspense>
    );
  }
  if (filmRender || filmStudio) {
    return (
      <Suspense fallback={null}>
        {filmRender ? <FilmHarness slug={filmRender} /> : <FilmStudio slug={filmStudio!} />}
      </Suspense>
    );
  }

  // A blog link is intentionally a reader-only surface: no chapter video,
  // chapter sidebar, mobile shelf, or autoplaying normal player is mounted.
  if (blogSlug) {
    return (
      <Suspense fallback={<div className="bp-loading">Loading the post…</div>}>
        <BlogOnly key={blogSlug} slug={blogSlug} />
      </Suspense>
    );
  }

  // a generated book on desktop (?bundle=<slug>) — full-page player
  if (bundleSlug && !mobile) {
    return (
      <Suspense fallback={<div className="bp-loading">Loading the book…</div>}>
        <BookPlayer key={bundleSlug} slug={bundleSlug} />
        <InstallBanner />
      </Suspense>
    );
  }

  // default: the bookshelf (a film, or on mobile a series or book, named in
  // the URL is pushed onto its navigation stack)
  return (
    <>
      <Library />
      <InstallBanner />
    </>
  );
}
