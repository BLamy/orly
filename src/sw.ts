/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

// The app shell (JS/CSS/HTML) — small, precached at install time by Workbox
// from the build manifest injected here.
precacheAndRoute(self.__WB_MANIFEST);

// Without this, a prior version's precached entries (old-hash HTML/icons)
// linger in Cache Storage forever across deploys instead of being replaced —
// harmless for storage size here (the precache list is tiny) but it's the
// correct hygiene move alongside registerType: 'autoUpdate' (vite.config.ts),
// which is the actual fix for the "installed PWA kept running a stale build"
// incident: cleaning up outdated caches here, paired with the new SW being
// told to activate + the page reloading, is what makes an update land fully.
cleanupOutdatedCaches();

// Scene chunks are content-hashed and lazy-loaded per book (src/viz/scenes.ts) —
// there's no build-time list of "this book's chunks" to precache. Instead, cache
// any JS/CSS opportunistically the first time it's actually requested (normal
// playback, or the explicit warm-up in src/offline/downloads.ts). CacheFirst so
// a chunk fetched once is never re-fetched, even offline.
registerRoute(
  ({ request, url }) =>
    url.origin === self.location.origin &&
    (request.destination === 'script' || request.destination === 'style'),
  new CacheFirst({ cacheName: 'app-assets' })
);

// Book content (public/generated/**): serve from cache ONLY if a book's own
// download already put it there (see BOOK_CACHE_PREFIX + downloads.ts) —
// merely browsing the Library must stay network-only, or every page view
// would silently grow storage. This is why it's a plain fetch handler
// instead of a Workbox CacheFirst route (which would cache on first read).
const BOOK_CACHE_PREFIX = 'book-';

self.addEventListener('fetch', (event: FetchEvent) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/generated/')) return;
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      return fetch(event.request);
    })()
  );
});

self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const data = event.data as
    | { type: 'CACHE_BOOK'; slug: string; urls: string[] }
    | { type: 'DELETE_BOOK'; slug: string }
    | undefined;
  if (!data) return;

  if (data.type === 'CACHE_BOOK') {
    event.waitUntil(
      (async () => {
        const cache = await caches.open(BOOK_CACHE_PREFIX + data.slug);
        await Promise.allSettled(
          data.urls.map(async (url) => {
            try {
              const res = await fetch(url, { cache: 'no-store' });
              if (res.ok) await cache.put(url, res.clone());
            } catch {
              /* asset unreachable — downloads.ts reports overall status */
            }
          })
        );
        const client = event.source as Client | null;
        client?.postMessage({ type: 'BOOK_CACHED', slug: data.slug });
      })()
    );
  }

  if (data.type === 'DELETE_BOOK') {
    event.waitUntil(caches.delete(BOOK_CACHE_PREFIX + data.slug));
  }
});

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
