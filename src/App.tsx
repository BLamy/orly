import { Suspense, lazy } from 'react';
import { Library } from './library/Library';

// The book player (and its scene/katex machinery) loads only for ?bundle=…,
// so the default shelf stays a small bundle.
const BookPlayer = lazy(() =>
  import('./player/BookPlayer').then((m) => ({ default: m.BookPlayer }))
);

// The MoreWrong game (?mode=morewrong) loads as its own chunk so the shelf
// bundle stays small.
const MoreWrong = lazy(() =>
  import('./morewrong/MoreWrong').then((m) => ({ default: m.MoreWrong }))
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
  const mode = param('mode');
  const bundleSlug = param('bundle');

  // the MoreWrong interactive game (?mode=morewrong)
  if (mode === 'morewrong') {
    return (
      <Suspense fallback={<div className="bp-loading">Loading MoreWrong…</div>}>
        <MoreWrong />
      </Suspense>
    );
  }

  // a generated book (?bundle=<slug>)
  if (bundleSlug) {
    return (
      <Suspense fallback={<div className="bp-loading">Loading the book…</div>}>
        <BookPlayer key={bundleSlug} slug={bundleSlug} />
      </Suspense>
    );
  }

  // default: the bookshelf
  return <Library />;
}
