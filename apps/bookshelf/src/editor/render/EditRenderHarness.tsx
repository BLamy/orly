/**
 * Edit render harness: /?film-edit-render=<slug>[&project=<url>][&w=1920&h=1080][&t=0]
 *
 * The export page for an editor project (generator/film/edit-render.mjs drives it, as render.mjs drives the film
 * harness). Mounts the editor's compositor at the output size with no chrome. DOM stack (top-left, 0,0):
 *   composite <canvas> (compositor.render: tracks, transitions, FX, master finish) · overlay <svg viewBox 0 0 1280 720>
 * and exposes window.__edit (EditHandle):
 *   { slug, fps, duration, width, height, sampleRate, channels, ready, error?, seek(t), renderAudio(from, to),
 *     frameInfo(), bench(...) }
 *   seek(t)              resolves after: media at t prepared (image decode, exact video frame, text fonts), the
 *                        composite painted, overlays committed (flushSync) and a double rAF
 *   renderAudio(f, t)    the audio engine's renderOffline over [f, t) (the preview's own graph) → base64 of
 *                        interleaved stereo s16le PCM at `sampleRate`
 *
 * The project comes from `project` (default /__editor/project/<slug>, the saved project.json). JSON carries no
 * Infinity, so a media `duration` of null is read back as Infinity. Output size defaults to the project's; `w`
 * alone keeps the project's aspect. Shots of other films (ShotMedia.film) load their own shot sources.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { FILM_H, FILM_W } from '../../viz/film/contracts';
import { createAudioEngine } from '../engine/audio';
import { pcm16Base64 } from '../engine/wav';
import { createCompositor, loadShotSource, type CompositorStats, type EditorCompositor } from '../engine/compositor';
import type { AudioEngine, CompositorFrame, Media, Project } from '../model/types';
import { projectDuration } from '../model/types';

type Overlay = CompositorFrame['overlays'][number];

export interface EditFrameInfo {
  t: number;
  /** last paint (ms, CPU side) */
  ms: number;
  events: string[];
  overlays: number;
  stats: CompositorStats;
}

export interface EditHandle {
  slug: string;
  fps: number;
  duration: number;
  width: number;
  height: number;
  sampleRate: number;
  channels: 2;
  ready: Promise<void>;
  error?: string;
  seek(t: number): Promise<void>;
  renderAudio(from: number, to: number): Promise<string>;
  frameInfo(): EditFrameInfo | null;
  /** paint frames t0..t1 step dt (each waits for the GPU raster, see gpuSync) */
  bench(t0?: number, t1?: number, dt?: number): Promise<{ frames: number; mean: number; p95: number; max: number }>;
}

declare global {
  interface Window {
    __edit?: EditHandle;
  }
}

const qnum = (q: URLSearchParams, k: string): number | null => {
  const v = q.get(k);
  return v == null || v === '' || !Number.isFinite(Number(v)) ? null : Number(v);
};

let syncGl: WebGLRenderingContext | null = null;
const syncPx = new Uint8Array(4);
/** block until a 2D canvas has been rasterised: upload it into a WebGL texture and read 1 px back. Repeated
 *  getImageData on the canvas itself would make Chrome de-accelerate it (the film harness does the same). */
function gpuSync(cv: HTMLCanvasElement): void {
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
  syncGl.texImage2D(syncGl.TEXTURE_2D, 0, syncGl.RGBA, syncGl.RGBA, syncGl.UNSIGNED_BYTE, cv);
  syncGl.readPixels(0, 0, 1, 1, syncGl.RGBA, syncGl.UNSIGNED_BYTE, syncPx);
}

const raf2 = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/** a fetched project.json → Project (null media durations back to Infinity) */
function reviveProject(raw: unknown): Project {
  let v = raw;
  if (v && typeof v === 'object' && !('tracks' in v) && 'project' in v) v = (v as { project: unknown }).project;
  if (!v || typeof v !== 'object' || !Array.isArray((v as Partial<Project>).tracks) || typeof (v as Partial<Project>).media !== 'object') {
    throw new Error('not an editor project (expected { media, tracks, … })');
  }
  const p = v as Project;
  const media: Record<string, Media> = {};
  for (const [id, m] of Object.entries(p.media)) media[id] = m.duration == null ? { ...m, duration: Infinity } : m;
  return { ...p, media };
}

interface Loaded {
  project: Project;
  comp: EditorCompositor;
  width: number;
  height: number;
}

export default function EditRenderHarness({ slug }: { slug: string }) {
  const q = useMemo(() => new URLSearchParams(window.location.search), []);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const last = useRef<CompositorFrame | null>(null);
  /** the loaded state for handle methods (a stale handle object still reaches the live compositor) */
  const loadedRef = useRef<Loaded | null>(null);
  loadedRef.current = loaded;
  const audioRef = useRef<AudioEngine | null>(null);
  const readyRef = useRef<{ resolve: () => void; reject: (e: Error) => void; promise: Promise<void> } | null>(null);

  // the handle exists from the first render so the exporter can await ready (or read error)
  if (!readyRef.current) {
    let resolve!: () => void;
    let reject!: (e: Error) => void;
    const promise = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    promise.catch(() => undefined); // awaited by the exporter; never an unhandled rejection in the page
    readyRef.current = { resolve, reject, promise };
  }

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.background = '#000';
    document.body.style.overflow = 'hidden';
    document.title = `edit render: ${slug}`;
  }, [slug]);

  // load: project → shot sources (own film + any other films the project uses) → compositor
  useEffect(() => {
    let dead = false;
    let comp: EditorCompositor | null = null;
    (async () => {
      const url = q.get('project') || `/__editor/project/${encodeURIComponent(slug)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`project ${url}: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      const project = reviveProject(await res.json());
      const qw = qnum(q, 'w'), qh = qnum(q, 'h');
      const width = Math.round(qw ?? project.width);
      const height = Math.round(qh ?? (qw ? (qw * project.height) / project.width : project.height));
      const films = new Set<string>([slug]);
      for (const m of Object.values(project.media)) if (m.kind === 'shot') films.add(m.film);
      const sources = await Promise.all([...films].map(async (f) => [f, await loadShotSource(f, { width })] as const));
      comp = createCompositor({ project, shots: sources.find(([f]) => f === slug)?.[1] ?? null });
      for (const [f, src] of sources) if (f !== slug) comp.setShotSource(src, f);
      if (dead) comp.dispose();
      else setLoaded({ project, comp, width, height });
    })().catch((e: unknown) => {
      if (!dead) setError(String((e as Error)?.stack ?? e));
    });
    return () => {
      dead = true;
      comp?.dispose();
      audioRef.current?.dispose();
      audioRef.current = null;
    };
  }, [slug, q]);

  // publish the handle (and resolve ready once the first frame is up)
  useEffect(() => {
    const rd = readyRef.current!;
    const project = loaded?.project;
    const paint = (t: number): CompositorFrame | null => {
      const ctx = canvasRef.current?.getContext('2d');
      const L = loadedRef.current;
      if (!L || !ctx) return null;
      const f = L.comp.render(t, ctx);
      last.current = f;
      return f;
    };
    const handle: EditHandle = {
      slug,
      fps: project?.fps ?? 24,
      duration: project ? projectDuration(project) : 0,
      width: loaded?.width ?? 0,
      height: loaded?.height ?? 0,
      sampleRate: project?.sampleRate ?? 48000,
      channels: 2,
      ready: rd.promise,
      async seek(t: number) {
        await rd.promise;
        await loadedRef.current?.comp.prepare(t);
        await document.fonts.ready;
        const f = paint(t);
        flushSync(() => setOverlays(f?.overlays ?? []));
        await raf2();
      },
      async renderAudio(from: number, to: number) {
        await rd.promise;
        const L = loadedRef.current;
        if (!L) throw new Error('edit harness: no project loaded');
        if (!audioRef.current) audioRef.current = createAudioEngine(L.project);
        const r = await audioRef.current.renderOffline(from, to);
        if (r.sampleRate !== L.project.sampleRate) throw new Error(`renderOffline returned ${r.sampleRate} Hz, project is ${L.project.sampleRate} Hz`);
        return pcm16Base64([r.channels[0], r.channels[1]]); // engine/wav.ts: the one PCM encoder (symmetric scaling)
      },
      frameInfo() {
        const f = last.current;
        const L = loadedRef.current;
        return f && L ? { t: f.t, ms: +f.ms.toFixed(2), events: f.events, overlays: f.overlays.length, stats: L.comp.stats() } : null;
      },
      async bench(t0 = 0, t1 = handle.duration, dt = 1 / handle.fps) {
        await rd.promise;
        const cv = canvasRef.current;
        const ms: number[] = [];
        for (let t = t0; t <= t1 + 1e-9; t += dt) {
          const a = performance.now();
          paint(t);
          if (cv) gpuSync(cv); // wait for the GPU raster
          ms.push(performance.now() - a);
        }
        ms.sort((x, y) => x - y);
        const mean = ms.reduce((s, x) => s + x, 0) / Math.max(1, ms.length);
        return { frames: ms.length, mean: +mean.toFixed(2), p95: +(ms[Math.floor(ms.length * 0.95)] ?? 0).toFixed(2), max: +(ms[ms.length - 1] ?? 0).toFixed(2) };
      },
    };
    if (error) handle.error = error;
    window.__edit = handle;
    if (error) {
      rd.reject(new Error(error));
      return;
    }
    if (!loaded) return;
    // repaint when async media lands (only matters before the first seek; seek prepares explicitly)
    const off = loaded.comp.onInvalidate(() => {
      if (last.current) {
        const f = paint(last.current.t);
        setOverlays(f?.overlays ?? []);
      }
    });
    const t = qnum(q, 't') ?? 0;
    loaded.comp
      .prepare(t)
      .then(() => {
        const f = paint(t);
        setOverlays(f?.overlays ?? []);
        return raf2();
      })
      .then(() => rd.resolve(), (e: unknown) => rd.reject(e instanceof Error ? e : new Error(String(e))));
    return off;
  }, [loaded, error, slug, q]);

  if (error) {
    return <pre style={{ color: '#f88', font: '14px ui-monospace, monospace', padding: 20, whiteSpace: 'pre-wrap' }}>{error}</pre>;
  }
  if (!loaded) return null;
  const { width, height } = loaded;
  const abs: CSSProperties = { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', display: 'block' };
  return (
    <div style={{ position: 'fixed', left: 0, top: 0, zIndex: 2147483000 }}>
      <div style={{ position: 'relative', width, height, overflow: 'hidden', background: '#000' }}>
        <canvas ref={canvasRef} width={width} height={height} style={abs} />
        <svg viewBox={`0 0 ${FILM_W} ${FILM_H}`} style={{ ...abs, pointerEvents: 'none' }}>
          {overlays.map((o) => (
            <g key={o.id} opacity={o.opacity} transform={o.transform}>
              {o.node as ReactNode}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
