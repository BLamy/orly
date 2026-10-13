/**
 * Kit gallery: visual self-tests for film kit pieces (dev server only).
 *
 *   /film-gallery.html?g=<name>&t=<seconds>[&w=1920&h=1080]
 *
 * Renders `./<name>.gallery.ts` (default export: GalleryModule) into one canvas
 * scaled from the 1280x720 stage to w x h, waits for webfonts, then sets
 * window.__galleryReady = true. `generator/film/snap.mjs` screenshots it.
 */
export interface GalleryEnv {
  t: number;
  /** shot-style twos-quantised time */
  tq: number;
  frame: number;
  W: number;
  H: number;
  pxScale: number;
}
export interface GalleryModule {
  title: string;
  /** suggested loop length for contact sheets (seconds) */
  duration?: number;
  /** font specs to preload, e.g. ['600 48px "Cormorant Garamond"'] */
  fonts?: string[];
  /** async setup before the first paint (e.g. build offscreen caches) */
  setup?(env: GalleryEnv): Promise<void> | void;
  paint(c: CanvasRenderingContext2D, env: GalleryEnv): void;
}

const modules = import.meta.glob('./*.gallery.ts') as Record<string, () => Promise<{ default: GalleryModule }>>;

declare global {
  interface Window {
    __galleryReady?: boolean;
    __galleryError?: string;
    __galleryList?: string[];
  }
}

async function main() {
  const q = new URLSearchParams(location.search);
  const name = q.get('g') ?? '';
  const t = Number(q.get('t') ?? '0');
  const w = Number(q.get('w') ?? '1920');
  const h = Number(q.get('h') ?? '1080');
  window.__galleryList = Object.keys(modules).map((k) => k.replace('./', '').replace('.gallery.ts', ''));
  const load = modules[`./${name}.gallery.ts`];
  if (!load) throw new Error(`no gallery "${name}". Available: ${window.__galleryList.join(', ')}`);
  const mod = (await load()).default;
  document.title = `gallery: ${mod.title} @ ${t}s`;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  document.body.appendChild(canvas);
  const c = canvas.getContext('2d');
  if (!c) throw new Error('no 2d context');

  for (const spec of mod.fonts ?? []) await document.fonts.load(spec);
  await document.fonts.ready;

  const pxScale = w / 1280;
  const fps = 24;
  const env: GalleryEnv = { t, tq: Math.floor(t * 12 + 1e-9) / 12, frame: Math.round(t * fps), W: 1280, H: 720, pxScale };
  await mod.setup?.(env);
  c.setTransform(pxScale, 0, 0, pxScale, 0, 0);
  c.fillStyle = '#000';
  c.fillRect(0, 0, 1280, 720);
  mod.paint(c, env);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__galleryReady = true;
}

main().catch((e) => {
  window.__galleryError = String(e?.stack || e);
  document.body.innerHTML = `<pre style="color:#f88;font:14px monospace;padding:20px;white-space:pre-wrap">${String(e?.stack || e)}</pre>`;
  window.__galleryReady = true;
});
