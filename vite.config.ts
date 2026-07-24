import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Served from the domain root everywhere (Cloudflare Workers prod + PR previews,
// and locally), so all asset paths resolve relative to BASE_URL = '/'.
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      // 'autoUpdate' (not the default 'prompt') is the fix for a real incident:
      // a PWA installed on a phone kept running a stale build after a deploy,
      // because the default injected register script just calls
      // `navigator.serviceWorker.register(...)` and never does anything with a
      // waiting new-version worker — nothing ever tells it to activate. With
      // autoUpdate, the injected script (workbox-window under the hood) detects
      // a waiting SW, messages it to skipWaiting, and reloads the page once it
      // takes control — so the next time the installed app is opened (a fresh
      // navigation, since standalone PWAs don't keep tabs open in the
      // background like a browser) it self-heals onto the new build instead of
      // silently running mismatched old JS against new server assets.
      registerType: 'autoUpdate',
      // Hand-written service worker (src/sw.ts) — `generateSW` would auto-precache
      // everything under public/generated (every book's MP3s) for every visitor,
      // which is exactly what we don't want. Books are cached on-demand instead
      // (see src/offline/downloads.ts).
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        // Deliberately NOT precaching dist/assets/*.js here — that tree includes
        // every book's scene chunk plus heavyweight vendor code (mermaid, etc,
        // pulled in by docstream), and eagerly precaching all of it for every
        // visitor would defeat the point of "books are cached on-demand." The
        // runtime CacheFirst route in src/sw.ts catches JS/CSS the first time
        // it's actually requested instead. Precache only what installability
        // needs: the HTML shell and the icons/manifest.
        globPatterns: ['*.html', 'icons/**/*.png', '*.webmanifest'],
        globIgnores: ['generated/**', 'storybook/**'],
      },
      manifest: {
        name: "The Secret Lives of Data — O'RLY Bookshelf",
        short_name: "O'RLY",
        description: 'Narrated, animated explainers of real codebases, bound as O\'RLY-parody books.',
        theme_color: '#0a0e1a',
        background_color: '#0a0e1a',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
