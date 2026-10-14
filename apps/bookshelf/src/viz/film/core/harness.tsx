/**
 * Render harness: /?film-render=<slug>[&w=1920&h=1080][&t=0][&finish=0][&weave=0]
 *
 * Mounts the reel at full output resolution with no chrome. DOM stack:
 *   scene <canvas> (reel + finish pass) · overlay <svg viewBox 0 0 1280 720> (shot.overlay()) · finish <canvas>
 * and exposes window.__film (FilmHandle):
 *   { slug, fps, duration, width, height, ready, seek(t), shots, frameInfo(), bench(...) }
 * seek(t) resolves after: fonts ready, scene painted, overlay committed (flushSync) and a double rAF.
 *
 * Also exports useFilm(slug, w, h) (shared loader for the studio) and FilmStack (the DOM stack).
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type MutableRefObject } from 'react';
import { flushSync } from 'react-dom';
import { FILM_H, FILM_W } from '../contracts';
import { frameCacheStats, lastFrameDepth } from './frame';
import { fontSpecs } from './registry';
import { filmFontsReady } from '../setup';
import { createReel, type Reel, type ReelOverlay, type ReelRenderInfo } from './reel';
import { loadShotModules, loadTimeline } from './shot';

export interface FilmFrameInfo {
  t: number;
  frame: number;
  /** last paint (ms, CPU side) */
  ms: number;
  shots: { id: string; local: number }[];
  u?: number;
  kind?: string;
  placeholder: boolean;
  cache: ReturnType<typeof frameCacheStats>;
  /** depth planes the last painted frame used (QA: generator/film/depth.mjs) */
  depth?: ReturnType<typeof lastFrameDepth>;
}

export interface FilmHandle {
  slug: string;
  fps: number;
  duration: number;
  width: number;
  height: number;
  ready: Promise<void>;
  seek(t: number): Promise<void>;
  shots: { id: string; start: number; end: number; authored: boolean; transitionIn?: string }[];
  frameInfo(): FilmFrameInfo | null;
  /** paint frames t0..t1 step dt; mode 'gpu' (default) waits for the GPU raster per frame, 'cpu' times JS recording only */
  bench(t0?: number, t1?: number, dt?: number, mode?: 'gpu' | 'cpu'): Promise<{ frames: number; mean: number; p95: number; max: number }>;
  error?: string;
}

declare global {
  interface Window {
    __film?: FilmHandle;
  }
}

const qnum = (q: URLSearchParams, k: string, d: number) => {
  const v = q.get(k);
  return v == null || v === '' || Number.isNaN(Number(v)) ? d : Number(v);
};

async function preloadFonts() {
  await filmFontsReady; // injects the film @font-face stylesheet (kit type.ts)
  for (const spec of fontSpecs()) {
    try {
      await document.fonts.load(spec);
    } catch {
      /* missing font: fallback renders */
    }
  }
  await document.fonts.ready;
}

export interface FilmState {
  reel: Reel | null;
  error: string | null;
  loadErrors: Record<string, string>;
}

/** Load a film's timeline + shot modules + fonts and build the reel. */
export function useFilm(slug: string, width: number, height: number, opts?: { finish?: boolean; weave?: number }): FilmState {
  const [st, setSt] = useState<FilmState>({ reel: null, error: null, loadErrors: {} });
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const [data, mods] = await Promise.all([loadTimeline(slug), loadShotModules(slug)]);
        await preloadFonts();
        const reel = createReel({ data, modules: mods.modules, errors: mods.errors, width, height, finish: opts?.finish, weave: opts?.weave });
        if (!dead) setSt({ reel, error: null, loadErrors: mods.errors });
      } catch (e) {
        if (!dead) setSt({ reel: null, error: String((e as Error)?.stack ?? e), loadErrors: {} });
      }
    })();
    return () => {
      dead = true;
    };
  }, [slug, width, height, opts?.finish, opts?.weave]);
  return st;
}

/** scene canvas + SVG overlay + finish canvas, absolutely stacked at `width`×`height` device px, CSS-scaled by `display`. */
export function FilmStack(props: {
  width: number;
  height: number;
  overlays: ReelOverlay[];
  sceneRef: MutableRefObject<HTMLCanvasElement | null>;
  finishRef: MutableRefObject<HTMLCanvasElement | null>;
  style?: CSSProperties;
}) {
  const { width, height, overlays } = props;
  const abs: CSSProperties = { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'block' };
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', background: '#000', ...props.style }}>
      <canvas ref={props.sceneRef} width={width} height={height} style={abs} />
      <svg viewBox={`0 0 ${FILM_W} ${FILM_H}`} style={{ ...abs, pointerEvents: 'none' }}>
        {overlays.map((o) => (
          <g key={o.id} opacity={o.opacity}>
            {o.node}
          </g>
        ))}
      </svg>
      <canvas ref={props.finishRef} width={width} height={height} style={{ ...abs, pointerEvents: 'none' }} />
    </div>
  );
}

let syncGl: WebGLRenderingContext | null = null;
const syncPx = new Uint8Array(4);
/** block until the 2D canvas has been rasterised (GPU→GPU texture upload + 1 px readback) */
function gpuSync(cv: HTMLCanvasElement) {
  if (!syncGl) {
    syncGl = document.createElement('canvas').getContext('webgl');
    if (!syncGl) return;
    const tex = syncGl.createTexture();
    syncGl.bindTexture(syncGl.TEXTURE_2D, tex);
    const fb = syncGl.createFramebuffer();
    syncGl.bindFramebuffer(syncGl.FRAMEBUFFER, fb);
    syncGl.texImage2D(syncGl.TEXTURE_2D, 0, syncGl.RGBA, syncGl.RGBA, syncGl.UNSIGNED_BYTE, cv);
    syncGl.framebufferTexture2D(syncGl.FRAMEBUFFER, syncGl.COLOR_ATTACHMENT0, syncGl.TEXTURE_2D, tex, 0);
  }
  const gl = syncGl;
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, syncPx);
}

const raf2 = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

export function FilmHarness({ slug }: { slug: string }) {
  const q = useMemo(() => new URLSearchParams(window.location.search), []);
  const width = qnum(q, 'w', 1920);
  const height = qnum(q, 'h', Math.round((width * FILM_H) / FILM_W));
  const finish = q.get('finish') !== '0';
  const weave = qnum(q, 'weave', 1);
  const { reel, error } = useFilm(slug, width, height, { finish, weave });
  const sceneRef = useRef<HTMLCanvasElement | null>(null);
  const finishRef = useRef<HTMLCanvasElement | null>(null);
  const [overlays, setOverlays] = useState<ReelOverlay[]>([]);
  const last = useRef<ReelRenderInfo | null>(null);
  const readyRef = useRef<{ resolve: () => void; promise: Promise<void> } | null>(null);

  // the handle exists from the first render so callers can await ready
  if (!readyRef.current) {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => (resolve = r));
    readyRef.current = { resolve, promise };
  }

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.background = '#000';
    document.body.style.overflow = 'hidden';
    document.title = `film: ${slug}`;
  }, [slug]);

  useEffect(() => {
    const rd = readyRef.current!;
    const paint = (t: number) => {
      const sc = sceneRef.current?.getContext('2d');
      if (!reel || !sc) return null;
      const info = reel.render(t, sc, finishRef.current?.getContext('2d'));
      last.current = info;
      return info;
    };
    const handle: FilmHandle = {
      slug,
      fps: reel?.fps ?? 24,
      duration: reel?.duration ?? 0,
      width,
      height,
      ready: rd.promise,
      shots: (reel?.shots ?? []).map((s) => ({ id: s.id, start: s.start, end: s.end, authored: !!s.mod, transitionIn: s.trans.kind })),
      async seek(t: number) {
        await rd.promise;
        await document.fonts.ready;
        const info = paint(t);
        flushSync(() => setOverlays(info?.overlays ?? []));
        await raf2();
      },
      frameInfo() {
        const i = last.current;
        return i ? { t: i.t, frame: i.frame, ms: +i.ms.toFixed(2), shots: i.shots, u: i.u, kind: i.kind, placeholder: i.placeholder, cache: frameCacheStats(), depth: lastFrameDepth() } : null;
      },
      async bench(t0 = 0, t1 = reel?.duration ?? 0, dt = 1 / (reel?.fps ?? 24), mode = 'gpu') {
        await rd.promise;
        const cv = sceneRef.current;
        const ms: number[] = [];
        for (let t = t0; t <= t1 + 1e-9; t += dt) {
          const a = performance.now();
          paint(t);
          // 'gpu': upload the canvas into a WebGL texture and read 1 px back, which waits for the 2D raster
          // to finish on the GPU without de-accelerating the canvas (repeated getImageData would); 'cpu': recording only
          if (mode === 'gpu' && cv) gpuSync(cv);
          ms.push(performance.now() - a);
        }
        ms.sort((x, y) => x - y);
        const mean = ms.reduce((s, x) => s + x, 0) / Math.max(1, ms.length);
        return { frames: ms.length, mean: +mean.toFixed(2), p95: +(ms[Math.floor(ms.length * 0.95)] ?? 0).toFixed(2), max: +(ms[ms.length - 1] ?? 0).toFixed(2) };
      },
    };
    if (error) handle.error = error;
    window.__film = handle;
    if (reel || error) {
      if (reel) {
        const info = paint(qnum(q, 't', 0));
        setOverlays(info?.overlays ?? []);
      }
      raf2().then(() => rd.resolve());
    }
  }, [reel, error, slug, width, height, q]);

  if (error) {
    return <pre style={{ color: '#f88', font: '14px ui-monospace, monospace', padding: 20, whiteSpace: 'pre-wrap' }}>{error}</pre>;
  }
  return (
    <div style={{ position: 'fixed', left: 0, top: 0, zIndex: 2147483000 }}>
      <FilmStack width={width} height={height} overlays={overlays} sceneRef={sceneRef} finishRef={finishRef} />
    </div>
  );
}

export default FilmHarness;
