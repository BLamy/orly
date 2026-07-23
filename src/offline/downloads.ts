// Offline downloads — "save this book for My Shelf." A book's real assets
// (manifest.json, audio, previews, animal cover, blog post + its images) are
// same-origin HTTP requests already, so caching them via the Cache Storage
// API (through the service worker, src/sw.ts) is enough: BookPlayer/
// ChapterPlayer need no changes at all to play a downloaded book offline.
import { useEffect, useState } from 'react';
import { VIZ_SCENES } from '../viz/scenes';

const ASSET_BASE =
  (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';

export type DownloadStatus = 'downloading' | 'downloaded' | 'error';

const KEY = 'orly-downloads';
const CHANGE_EVENT = 'orly-downloads-changed';

interface ManifestV3Like {
  format: number;
  animal?: string;
  chapters: { number: number; audio?: string; scene: string }[];
}

function readAll(): Record<string, DownloadStatus> {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, DownloadStatus>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* private mode — downloads just won't persist across reloads */
  }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function getDownloadStatus(slug: string): DownloadStatus | null {
  return readAll()[slug] ?? null;
}

export function getDownloadedSlugs(): string[] {
  const all = readAll();
  return Object.keys(all).filter((s) => all[s] === 'downloaded');
}

/** Re-renders whenever any download's status changes — React components use
 * this instead of polling localStorage. */
export function onDownloadsChanged(cb: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, cb);
  return () => window.removeEventListener(CHANGE_EVENT, cb);
}

function setStatus(slug: string, status: DownloadStatus) {
  const all = readAll();
  all[slug] = status;
  writeAll(all);
}

async function collectAssetUrls(slug: string, base: string): Promise<{ manifest: ManifestV3Like; urls: string[] }> {
  const manifestUrl = `${base}manifest.json`;
  const manifest: ManifestV3Like = await fetch(manifestUrl).then((r) => {
    if (!r.ok) throw new Error(`manifest ${slug}: HTTP ${r.status}`);
    return r.json();
  });

  const urls = new Set<string>([manifestUrl]);
  if (manifest.animal) urls.add(`${base}${manifest.animal}`);
  for (const ch of manifest.chapters) {
    if (ch.audio) urls.add(`${base}${ch.audio}`);
    urls.add(`${base}previews/chapter-${ch.number}.png`);
  }

  // The blog post (optional) — its own images are whatever it actually
  // references, not a fixed naming scheme, so read them out of the markdown
  // rather than guessing filenames.
  try {
    const blogRes = await fetch(`${base}blog.md`);
    if (blogRes.ok) {
      const md = await blogRes.text();
      urls.add(`${base}blog.md`);
      for (const m of md.matchAll(/<img[^>]+src="([^"]+)"/g)) {
        const src = m[1];
        urls.add(src.startsWith('/') ? `${ASSET_BASE}${src.replace(/^\//, '')}` : `${base}${src}`);
      }
    }
  } catch {
    /* no blog post for this book — fine */
  }

  return { manifest, urls: [...urls] };
}

/** Fetch every asset for `slug` and hand the URL list to the service worker
 * to cache (see the CACHE_BOOK handler in src/sw.ts), then warm each
 * chapter's scene JS chunk by calling its existing lazy import once — the
 * SW's generic CacheFirst rule for JS/CSS then keeps it forever. */
export async function downloadBook(slug: string): Promise<void> {
  const base = `${ASSET_BASE}generated/${slug}/`;
  setStatus(slug, 'downloading');
  try {
    const { manifest, urls } = await collectAssetUrls(slug, base);

    const sw = await navigator.serviceWorker?.ready;
    if (sw?.active) {
      sw.active.postMessage({ type: 'CACHE_BOOK', slug, urls });
    } else {
      // No SW (unsupported browser, or dev mode) — fall back to warming the
      // plain HTTP cache directly so at least *this session* has it hot.
      await Promise.allSettled(urls.map((u) => fetch(u)));
    }

    await Promise.allSettled(
      manifest.chapters.map((ch) => VIZ_SCENES[ch.scene]?.() ?? Promise.resolve())
    );

    setStatus(slug, 'downloaded');
  } catch (e) {
    console.warn(`[offline] failed to download "${slug}":`, e);
    setStatus(slug, 'error');
  }
}

// React hook: re-renders whenever ANY book's download status changes (not
// just this slug) — cheap enough given how rarely downloads change, and
// avoids a bespoke per-slug event scheme.
export function useDownloadStatus(slug: string): DownloadStatus | null {
  const [status, setStatus] = useState(() => getDownloadStatus(slug));
  useEffect(() => {
    setStatus(getDownloadStatus(slug));
    return onDownloadsChanged(() => setStatus(getDownloadStatus(slug)));
  }, [slug]);
  return status;
}

export async function removeBook(slug: string): Promise<void> {
  const sw = await navigator.serviceWorker?.ready;
  sw?.active?.postMessage({ type: 'DELETE_BOOK', slug });
  const all = readAll();
  delete all[slug];
  writeAll(all);
}

/** Download (or remove) every book in a series at once — a series page's
 * "Download series" button. Each book still downloads independently (its
 * own status, its own cache), this just fires all of them together. */
export function downloadSeries(slugs: string[]): void {
  for (const slug of slugs) void downloadBook(slug);
}
export function removeSeries(slugs: string[]): void {
  for (const slug of slugs) void removeBook(slug);
}

export type SeriesDownloadStatus = 'none' | 'partial' | 'downloading' | 'downloaded';

/** Aggregate status across a whole series, for the "Download series" button:
 * all downloaded → downloaded, any still downloading → downloading, some
 * (but not all) downloaded → partial, none → none. */
export function useSeriesDownloadStatus(slugs: string[]): SeriesDownloadStatus {
  const [, force] = useState(0);
  useEffect(() => onDownloadsChanged(() => force((n) => n + 1)), []);
  const all = readAll();
  const statuses = slugs.map((s) => all[s] ?? null);
  if (statuses.some((s) => s === 'downloading')) return 'downloading';
  if (statuses.every((s) => s === 'downloaded')) return 'downloaded';
  if (statuses.some((s) => s === 'downloaded')) return 'partial';
  return 'none';
}
