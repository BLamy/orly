/**
 * Film studio: /?film-studio=<slug>[&w=1280&h=720][&t=…]
 *
 * The reel (same renderer as the harness) with a scrubber (shot boundaries ticked),
 * play/pause, a shot list (authored / placeholder, transition into each shot), the current
 * narration line with the spoken word marked, and paint ms. Keys: space play/pause,
 * ←/→ one frame (shift: 1 s), [ / ] previous/next shot, Home start. rAF is used here only.
 * Also sets window.__film like the harness (snap.mjs works on the studio too).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { FILM_H, FILM_W } from '../contracts';
import { FilmStack, useFilm } from './harness';
import type { ReelOverlay } from './reel';
import { lineAt, wordIndexAt } from './timing';

const tc = (s: number, fps = 24) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s - m * 60);
  const fr = Math.floor((s - Math.floor(s)) * fps + 1e-6);
  return `${m}:${String(sec).padStart(2, '0')}:${String(fr).padStart(2, '0')}`;
};

const C = {
  bg: '#14100e',
  panel: '#1d1714',
  line: '#3a2e27',
  text: '#e9dcc3',
  dim: '#9c8a78',
  accent: '#f5d998',
  warn: '#d8ac93',
};

export function FilmStudio({ slug }: { slug: string }) {
  const q = useMemo(() => new URLSearchParams(window.location.search), []);
  const width = Number(q.get('w') ?? 1280);
  const height = Number(q.get('h') ?? Math.round((width * FILM_H) / FILM_W));
  const { reel, error, loadErrors } = useFilm(slug, width, height);
  const sceneRef = useRef<HTMLCanvasElement | null>(null);
  const finishRef = useRef<HTMLCanvasElement | null>(null);
  const [t, setT] = useState(() => Number(q.get('t') ?? 0) || 0);
  const [playing, setPlaying] = useState(false);
  const [overlays, setOverlays] = useState<ReelOverlay[]>([]);
  const [ms, setMs] = useState(0);
  const [scale, setScale] = useState(0.6);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = `studio: ${slug}`;
    document.body.style.margin = '0';
    document.body.style.background = C.bg;
  }, [slug]);

  // fit the stage into the available area
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setScale(Math.min((r.width - 24) / width, ((r.height || 1e9) - 24) / height, 1));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height, reel]);

  // paint whenever t changes
  useEffect(() => {
    const sc = sceneRef.current?.getContext('2d');
    if (!reel || !sc) return;
    const info = reel.render(t, sc, finishRef.current?.getContext('2d'));
    setOverlays(info.overlays);
    setMs(info.ms);
  }, [reel, t]);

  // playback
  useEffect(() => {
    if (!playing || !reel) return;
    let raf = 0;
    let prev = performance.now();
    const step = (now: number) => {
      const dt = (now - prev) / 1000;
      prev = now;
      setT((x) => {
        const n = x + dt;
        if (n >= reel.duration) {
          setPlaying(false);
          return reel.duration;
        }
        return n;
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, reel]);

  // remember position when paused
  useEffect(() => {
    if (playing) return;
    const u = new URL(window.location.href);
    u.searchParams.set('t', t.toFixed(3));
    window.history.replaceState(null, '', u);
  }, [t, playing]);

  // window.__film for snap.mjs (same shape as the harness)
  useEffect(() => {
    if (!reel) return;
    const raf2 = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    let lastInfo: ReturnType<typeof reel.render> | null = null;
    window.__film = {
      slug,
      fps: reel.fps,
      duration: reel.duration,
      width,
      height,
      ready: raf2(),
      shots: reel.shots.map((s) => ({ id: s.id, start: s.start, end: s.end, authored: !!s.mod, transitionIn: s.trans.kind })),
      async seek(tt: number) {
        await document.fonts.ready;
        setPlaying(false);
        const sc = sceneRef.current?.getContext('2d');
        if (sc) lastInfo = reel.render(tt, sc, finishRef.current?.getContext('2d'));
        flushSync(() => {
          setT(tt);
          setOverlays(lastInfo?.overlays ?? []);
        });
        await raf2();
      },
      frameInfo: () => null,
      bench: async () => ({ frames: 0, mean: 0, p95: 0, max: 0 }),
    };
  }, [reel, slug, width, height]);

  const fps = reel?.fps ?? 24;
  const seekShot = useCallback(
    (dir: 1 | -1) => {
      if (!reel) return;
      const i = reel.shots.findIndex((s) => t >= s.start && t < s.end);
      const j = Math.max(0, Math.min(reel.shots.length - 1, (i < 0 ? 0 : i) + dir));
      setT(reel.shots[j].start);
    },
    [reel, t],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!reel) return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT' && e.key !== ' ') return;
      const clamp = (x: number) => Math.max(0, Math.min(reel.duration, x));
      if (e.key === ' ') {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === 'ArrowRight') setT((x) => clamp(Math.round(x * fps) / fps + (e.shiftKey ? 1 : 1 / fps)));
      else if (e.key === 'ArrowLeft') setT((x) => clamp(Math.round(x * fps) / fps - (e.shiftKey ? 1 : 1 / fps)));
      else if (e.key === ']') seekShot(1);
      else if (e.key === '[') seekShot(-1);
      else if (e.key === 'Home') setT(0);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reel, fps, seekShot]);

  if (error) return <pre style={{ color: '#f88', font: '14px ui-monospace, monospace', padding: 20, whiteSpace: 'pre-wrap' }}>{error}</pre>;
  if (!reel) return <div style={{ color: C.dim, font: '16px Georgia, serif', padding: 40 }}>Loading {slug}…</div>;

  const A = reel.at(t);
  const cur = A.b && (A.u ?? 0) >= 0.5 ? A.b : A.a;
  const local = cur === A.a ? A.la : A.lb!;
  const line = lineAt(cur.timing, local);
  const wi = line ? wordIndexAt(line, local) : -1;
  const chapter = reel.data.chapters.find((c) => t >= c.start && t < c.end) ?? reel.data.chapters[reel.data.chapters.length - 1];

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', gridTemplateColumns: '1fr 300px', gridTemplateRows: '44px 1fr auto', background: C.bg, color: C.text, font: '14px Georgia, serif' }}>
      <header style={{ gridColumn: '1 / 3', display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px', borderBottom: `1px solid ${C.line}` }}>
        <strong style={{ color: C.accent, letterSpacing: '0.08em' }}>FILM STUDIO</strong>
        <span>{slug}</span>
        {chapter && <span style={{ color: C.dim }}>ch {chapter.number} · {chapter.title}</span>}
        <span style={{ marginLeft: 'auto', fontFamily: 'ui-monospace, monospace', color: C.dim }}>
          {tc(t, fps)} / {tc(reel.duration, fps)} · f{Math.round(t * fps)} · {ms.toFixed(1)} ms · {width}×{height}
        </span>
      </header>
      <div ref={wrapRef} style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
        <div style={{ width: width * scale, height: height * scale, boxShadow: '0 10px 40px rgba(0,0,0,.6)' }}>
          <FilmStack width={width} height={height} overlays={overlays} sceneRef={sceneRef} finishRef={finishRef} style={{ transform: `scale(${scale})`, transformOrigin: '0 0' }} />
        </div>
      </div>
      <aside style={{ gridRow: '2 / 4', gridColumn: 2, borderLeft: `1px solid ${C.line}`, overflowY: 'auto', background: C.panel }}>
        {reel.shots.map((s) => {
          const on = s === cur;
          return (
            <button
              key={s.id}
              onClick={() => setT(s.start + 1e-4)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 0, borderBottom: `1px solid ${C.line}`, background: on ? '#2c231e' : 'transparent', color: C.text, cursor: 'pointer', font: 'inherit' }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: on ? C.accent : C.text }}>{s.id}</span>
                <span style={{ marginLeft: 'auto', fontFamily: 'ui-monospace, monospace', fontSize: 11, color: C.dim }}>{tc(s.start, fps)}</span>
              </div>
              <div style={{ fontSize: 12, color: s.mod ? C.dim : C.warn }}>
                {s.mod ? s.mod.mood : loadErrors[s.id] ? 'load error' : 'placeholder'} · {(s.end - s.start).toFixed(1)} s
                {s.trans.kind !== 'cut' ? ` · ${s.trans.kind} ${s.trans.dur.toFixed(1)} s` : ''}
              </div>
            </button>
          );
        })}
      </aside>
      <footer style={{ gridColumn: 1, padding: '8px 16px 14px', borderTop: `1px solid ${C.line}` }}>
        <div style={{ minHeight: 48, textAlign: 'center', fontSize: 19, fontStyle: 'italic', lineHeight: 1.35, padding: '4px 40px 8px' }}>
          {line
            ? line.words.length
              ? line.words.map((w, i) => (
                  <span key={i} style={{ color: local > line.end || i <= wi ? C.text : C.dim, textDecoration: i === wi && local <= line.end ? 'underline' : 'none', textUnderlineOffset: 4 }}>
                    {w.w}{' '}
                  </span>
                ))
              : line.text
            : <span style={{ color: C.dim }}>—</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setPlaying((p) => !p)} style={{ width: 72, padding: '6px 0', background: C.panel, color: C.accent, border: `1px solid ${C.line}`, borderRadius: 4, cursor: 'pointer', font: 'inherit' }}>
            {playing ? 'Pause' : 'Play'}
          </button>
          <div style={{ position: 'relative', flex: 1, height: 28 }}>
            {reel.shots.map((s) => (
              <div key={s.id} title={s.id} style={{ position: 'absolute', left: `${(s.start / reel.duration) * 100}%`, top: 0, width: 1, height: 8, background: s.mod ? C.dim : C.warn }} />
            ))}
            {reel.data.chapters.map((c) => (
              <div key={c.id} title={c.title} style={{ position: 'absolute', left: `${(c.start / reel.duration) * 100}%`, top: 0, width: 2, height: 12, background: C.accent }} />
            ))}
            <input
              type="range"
              min={0}
              max={reel.duration}
              step={1 / fps}
              value={t}
              onChange={(e) => {
                setPlaying(false);
                setT(Number(e.target.value));
              }}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', accentColor: C.accent }}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default FilmStudio;
