import { Suspense, lazy } from 'react';
import { Library } from './library/Library';
import { InstallBanner } from './shell/InstallBanner';

// The book player (and its scene/katex machinery) loads only for ?bundle=…,
// so the default shelf stays a small bundle.
const BookPlayer = lazy(() =>
  import('./player/BookPlayer').then((m) => ({ default: m.BookPlayer }))
);

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

  // a generated book (?bundle=<slug>)
  if (bundleSlug) {
    return (
      <Suspense fallback={<div className="bp-loading">Loading the book…</div>}>
        <BookPlayer key={bundleSlug} slug={bundleSlug} />
        <InstallBanner />
      </Suspense>
    );
  }

  // default: the bookshelf
  return (
    <>
      <Library />
      <InstallBanner />
    </>
  );
}
