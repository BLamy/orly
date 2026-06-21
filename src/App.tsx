import { useEffect, useState } from 'react';
import { LearnPage } from './LearnPage';
import { Library } from './library/Library';
import { chapters as staticChapters, type Chapter } from './stories';

const ASSET_BASE =
  (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

function param(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const fromQs = new URLSearchParams(window.location.search).get(name);
  if (fromQs) return fromQs;
  const hash = window.location.hash.replace(/^#/, '');
  const q = hash.indexOf('?');
  if (q >= 0) return new URLSearchParams(hash.slice(q + 1)).get(name);
  return null;
}

type Bundle = { chapters: Chapter[]; title?: string; tagline?: string };

export function App() {
  const bundleSlug = param('bundle');
  const book = param('book');

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bundleSlug) return;
    let alive = true;
    fetch(`${ASSET_BASE}generated/${bundleSlug}/manifest.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((m) => {
        if (alive) setBundle({ chapters: m.chapters as Chapter[], title: m.title, tagline: m.subtitle ?? m.throughline });
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [bundleSlug]);

  // a generated book (?bundle=<slug>)
  if (bundleSlug) {
    if (error) return <div className="learn-loading">Couldn’t load “{bundleSlug}”: {error}</div>;
    if (!bundle) return <div className="learn-loading">Loading explainer…</div>;
    return <LearnPage key={bundleSlug} chapters={bundle.chapters} title={bundle.title} tagline={bundle.tagline} />;
  }

  // the built-in book (?book=almostnode → the static chapters)
  if (book === 'almostnode') {
    return <LearnPage key="almostnode" chapters={staticChapters} />;
  }

  // default: the bookshelf
  return <Library />;
}
