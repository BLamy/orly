import { Suspense, lazy, useEffect, useState } from 'react';
import { Library, MOBILE_MQ } from './library/Library';
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
  // On mobile a book is a PUSHED screen inside MobileShelf's own nav-
  // controller stack (slide transition, back-swipe), not a hard navigation —
  // so MobileShelf needs to mount even when `?bundle=` is present. Desktop
  // keeps the plain full-page player.
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_MQ).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // a generated book on desktop (?bundle=<slug>) — full-page player
  if (bundleSlug && !mobile) {
    return (
      <Suspense fallback={<div className="bp-loading">Loading the book…</div>}>
        <BookPlayer key={bundleSlug} slug={bundleSlug} />
        <InstallBanner />
      </Suspense>
    );
  }

  // default: the bookshelf (mobile passes bundleSlug through so MobileShelf
  // can push it as a screen instead of navigating away from)
  return (
    <>
      <Library initialBundle={mobile ? (bundleSlug ?? undefined) : undefined} />
      <InstallBanner />
    </>
  );
}
