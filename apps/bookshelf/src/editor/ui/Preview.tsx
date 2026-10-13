/**
 * Video Preview (Vegas): the composited frame at the cursor, with the transport under it.
 *
 *   <Preview compositor={c} cmds={commands} seek={seek} shuttle={rate} />
 *
 * Painting is imperative: the panel subscribes to the store outside React and repaints on the next animation
 * frame whenever the cursor, the project or the quality changes, or the compositor reports that async media became
 * ready or its project changed (a timeline drag pushes its draft there: moves, trims and slips are seen live; a trim
 * shows its edge frame through ui.previewT). While playing, the editor's transport loop moves the cursor every
 * frame, so this is also the playback painter. React only re-renders for overlay
 * changes and chrome. The DOM stack mirrors the film's FilmStack:
 *   <canvas> composite (project size × ui.previewScale) · <svg 1280×720> shot overlays · <svg> guides
 * so what you see is what the exporter captures.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { FILM_H, FILM_W } from '../../viz/film/contracts';
import type { EditorCompositor } from '../engine/compositor';
import type { CompositorFrame } from '../model/types';
import { editor, useEditor } from '../state/store';
import type { Commands } from './shortcuts';
import { keyLabel } from './shortcuts';
import { QUALITY, parseTimecode, qualityOf, timecode } from './theme';

type Overlay = CompositorFrame['overlays'][number];

const LS_KEY = 'fe.preview.v1';
interface Toggles {
  overlays: boolean;
  safe: boolean;
  grid: boolean;
}
function loadToggles(): Toggles {
  try {
    const v = JSON.parse(localStorage.getItem(LS_KEY) ?? 'null') as Partial<Toggles> | null;
    return { overlays: v?.overlays ?? true, safe: v?.safe ?? false, grid: v?.grid ?? false };
  } catch {
    return { overlays: true, safe: false, grid: false };
  }
}

export interface PreviewProps {
  compositor: EditorCompositor | null;
  cmds: Commands;
  /** the Stop button: stop and return to where playback started (nothing when already stopped) */
  stop: () => void;
  /** move the cursor (stops playback, snaps nothing) */
  seek: (t: number) => void;
  /** current shuttle rate (J/K/L), 1 when playing normally */
  shuttle: number;
}

export default function Preview({ compositor, cmds, stop, seek, shuttle }: PreviewProps) {
  const width = useEditor((s) => s.project?.width ?? 1920);
  const height = useEditor((s) => s.project?.height ?? 1080);
  const fps = useEditor((s) => s.project?.fps ?? 24);
  const scale = useEditor((s) => s.ui.previewScale);
  const playing = useEditor((s) => s.ui.playing);
  const looping = useEditor((s) => s.ui.looping);
  const [toggles, setToggles] = useState<Toggles>(loadToggles);
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [fit, setFit] = useState({ w: 320, h: 180 });
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const showOverlays = toggles.overlays;

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(toggles));
    } catch {
      /* storage unavailable: toggles just don't persist */
    }
  }, [toggles]);

  // fit the output aspect into the stage box
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      const pad = document.fullscreenElement === el ? 0 : 12;
      const s = Math.max(0.01, Math.min((r.width - pad) / width, (r.height - pad) / height));
      setFit({ w: Math.floor(width * s), h: Math.floor(height * s) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  // the painter: store-driven, coalesced to one paint per animation frame
  useEffect(() => {
    const cv = canvasRef.current;
    if (!compositor || !cv) return;
    const ctx = cv.getContext('2d', { alpha: false });
    if (!ctx) return;
    let raf = 0;
    let last: { t: number; project: unknown; scale: number } | null = null;
    let lastOverlayKey = '';
    const paint = () => {
      raf = 0;
      const s = editor.getState();
      if (!s.project) return;
      const w = Math.max(2, Math.round(s.project.width * s.ui.previewScale));
      const h = Math.max(2, Math.round(s.project.height * s.ui.previewScale));
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }
      let fr: CompositorFrame;
      try {
        fr = compositor.render(s.ui.previewT ?? s.ui.cursor, ctx);
      } catch (e) {
        // a broken event must not take the preview down; show the error on the frame
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#200c0a';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#ffb4ab';
        ctx.font = `${Math.max(10, Math.round(h / 30))}px ui-monospace, Menlo, monospace`;
        ctx.fillText(`render error: ${(e as Error).message}`, 12, 24);
        console.error('[editor] compositor.render failed', e);
        return;
      }
      if (infoRef.current) infoRef.current.textContent = `${w}×${h} · ${fr.ms.toFixed(1)} ms · ${fr.events.length} ev`;
      // shots rebuild their overlay nodes every frame, so re-render while any are showing; most frames have none,
      // and then React is skipped entirely once the (empty) set has been committed
      const key = fr.overlays.map((o) => `${o.id}:${o.opacity.toFixed(3)}:${o.transform ?? ''}`).join('|');
      if (key !== lastOverlayKey || fr.overlays.length) {
        lastOverlayKey = key;
        setOverlays(fr.overlays);
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const unsub = editor.subscribe(() => {
      const s = editor.getState();
      const t = s.ui.previewT ?? s.ui.cursor;
      if (!last || t !== last.t || s.project !== last.project || s.ui.previewScale !== last.scale) {
        last = { t, project: s.project, scale: s.ui.previewScale };
        schedule();
      }
    });
    // async media became ready (a shot source, an image decode, a video seek, fonts): paint again
    const unInvalidate = compositor.onInvalidate(schedule);
    schedule();
    return () => {
      unsub();
      unInvalidate();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [compositor]);

  const toggle = (k: keyof Toggles) => setToggles((t) => ({ ...t, [k]: !t[k] }));
  const fullscreen = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);
  const q = qualityOf(scale);

  return (
    <section className="fe-panel" aria-label="Video preview">
      <div className="fe-preview-bar">
        <label className="fe-dim" htmlFor="fe-quality" style={{ padding: '0 4px' }}>
          Quality
        </label>
        <select
          id="fe-quality"
          className="fe-select"
          style={{ width: 'auto' }}
          value={q.id}
          onChange={(e) => {
            editor.set({ previewScale: QUALITY.find((x) => x.id === e.target.value)?.scale ?? 0.5 });
            e.currentTarget.blur(); // hand the keyboard back to the transport
          }}
        >
          {QUALITY.map((x) => (
            <option key={x.id} value={x.id}>
              {x.label} ({Math.round(width * x.scale)}×{Math.round(height * x.scale)})
            </option>
          ))}
        </select>
        <span className="fe-spacer" />
        <button className={`fe-icon-btn${showOverlays ? ' is-on' : ''}`} aria-pressed={showOverlays} onClick={() => toggle('overlays')} title="Show shot overlays (plates, equations)">
          Overlays
        </button>
        <button className={`fe-icon-btn${toggles.safe ? ' is-on' : ''}`} aria-pressed={toggles.safe} onClick={() => toggle('safe')} title="Safe areas (action 90%, title 80%)">
          Safe
        </button>
        <button className={`fe-icon-btn${toggles.grid ? ' is-on' : ''}`} aria-pressed={toggles.grid} onClick={() => toggle('grid')} title="Rule-of-thirds grid">
          Grid
        </button>
        <button className="fe-icon-btn" onClick={fullscreen} title="Full screen preview">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
            <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
          </svg>
        </button>
      </div>

      <div ref={stageRef} className="fe-preview-stage" onDoubleClick={fullscreen}>
        <div className="fe-preview-frame" style={{ width: fit.w, height: fit.h }}>
          <canvas ref={canvasRef} width={Math.round(width * scale)} height={Math.round(height * scale)} />
          {showOverlays && overlays.length > 0 && (
            <svg viewBox={`0 0 ${FILM_W} ${FILM_H}`} preserveAspectRatio="none">
              {overlays.map((o) => (
                <g key={o.id} opacity={o.opacity} transform={o.transform}>
                  {o.node as ReactNode}
                </g>
              ))}
            </svg>
          )}
          {(toggles.safe || toggles.grid) && <Guides safe={toggles.safe} grid={toggles.grid} />}
        </div>
        <div ref={infoRef} className="fe-preview-info" />
      </div>

      <Transport cmds={cmds} stop={stop} seek={seek} fps={fps} playing={playing} looping={looping} shuttle={shuttle} />
    </section>
  );
}

function Guides({ safe, grid }: { safe: boolean; grid: boolean }) {
  const W = 1000;
  const H = 1000;
  const rect = (k: number, color: string) => <rect x={(W * (1 - k)) / 2} y={(H * (1 - k)) / 2} width={W * k} height={H * k} fill="none" stroke={color} strokeWidth={1} vectorEffect="non-scaling-stroke" />;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
      {safe && rect(0.9, 'rgba(255,255,255,0.55)')}
      {safe && rect(0.8, 'rgba(240,165,58,0.75)')}
      {grid &&
        [1, 2].map((i) => (
          <g key={i} stroke="rgba(255,255,255,0.35)" strokeWidth={1} vectorEffect="non-scaling-stroke">
            <line x1={(W * i) / 3} y1={0} x2={(W * i) / 3} y2={H} vectorEffect="non-scaling-stroke" />
            <line x1={0} y1={(H * i) / 3} x2={W} y2={(H * i) / 3} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
      {grid && <path d={`M${W / 2 - 12} ${H / 2}h24M${W / 2} ${H / 2 - 20}v40`} stroke="rgba(255,255,255,0.5)" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// transport
// ---------------------------------------------------------------------------
const I = {
  start: 'M3 3v10M13 3L6 8l7 5z',
  prev: 'M3 3v10M10 3L4 8l6 5zM14 3L8 8l6 5z',
  play: 'M4 2.5l10 5.5-10 5.5z',
  pause: 'M4 3h3v10H4zM9 3h3v10H9z',
  stop: 'M3.5 3.5h9v9h-9z',
  next: 'M13 3v10M6 3l6 5-6 5zM2 3l6 5-6 5z',
  end: 'M13 3v10M3 3l7 5-7 5z',
  loop: 'M3 6a3 3 0 0 1 3-3h6l-2-2M13 10a3 3 0 0 1-3 3H4l2 2',
};
function Icon({ d, fill = true }: { d: string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" fill={fill ? 'currentColor' : 'none'} stroke={fill ? 'none' : 'currentColor'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function Transport(props: { cmds: Commands; stop: () => void; seek: (t: number) => void; fps: number; playing: boolean; looping: boolean; shuttle: number }) {
  const { cmds, fps, playing, looping, shuttle } = props;
  const btn = (label: string, id: keyof Commands, d: string, extra?: { on?: boolean; fill?: boolean }) => {
    const k = keyLabel(id);
    return (
      <button className={`fe-icon-btn${extra?.on ? ' is-on' : ''}`} onClick={() => cmds[id]()} title={k ? `${label} (${k})` : label} aria-label={label} aria-pressed={extra?.on}>
        <Icon d={d} fill={extra?.fill ?? true} />
      </button>
    );
  };
  return (
    <div className="fe-transport" role="toolbar" aria-label="Transport">
      {btn('Loop playback', 'toggleLoop', I.loop, { on: looping, fill: false })}
      <span className="fe-tb-sep" />
      {btn('Go to start', 'gotoStart', I.start)}
      {btn('Previous edit point', 'prevEdit', I.prev)}
      {playing ? btn('Pause', 'playPause', I.pause) : btn('Play', 'playPause', I.play)}
      <button className="fe-icon-btn" onClick={props.stop} disabled={!playing} title={`Stop and return to the play start (${keyLabel('playStop')})`} aria-label="Stop">
        <Icon d={I.stop} />
      </button>
      {btn('Next edit point', 'nextEdit', I.next)}
      {btn('Go to end', 'gotoEnd', I.end)}
      <TimecodeField fps={fps} seek={props.seek} />
      {shuttle !== 1 && playing && <span className="fe-rate-badge">{shuttle > 0 ? `▶ ${shuttle}×` : `◀ ${-shuttle}×`}</span>}
      <DurationLabel fps={fps} />
    </div>
  );
}

/** the cursor timecode; click to type a time (HH:MM:SS:FF, seconds, or frames 'NNNf'), Enter to go */
function TimecodeField({ fps, seek }: { fps: number; seek: (t: number) => void }) {
  const cursor = useEditor((s) => s.ui.cursor);
  const [draft, setDraft] = useState<string | null>(null);
  const bad = draft != null && parseTimecode(draft, fps) == null;
  const commit = () => {
    if (draft == null) return;
    const t = parseTimecode(draft, fps);
    if (t != null) seek(Math.max(0, t));
    setDraft(null);
  };
  return (
    <input
      className={`fe-tc${bad ? ' is-bad' : ''}`}
      aria-label="Cursor timecode"
      title="Cursor position — type a timecode (HH:MM:SS:FF), seconds or frames (e.g. 1200f) and press Enter"
      value={draft ?? timecode(cursor, fps)}
      spellCheck={false}
      onFocus={(e) => {
        setDraft(timecode(cursor, fps));
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit();
          e.currentTarget.blur();
        } else if (e.key === 'Escape') {
          setDraft(null);
          e.currentTarget.blur();
        }
      }}
    />
  );
}

function DurationLabel({ fps }: { fps: number }) {
  // the project end only changes on edits; derive it from the tracks reference (stable between edits)
  const tracks = useEditor((s) => s.project?.tracks);
  let end = 0;
  for (const tr of tracks ?? []) for (const e of tr.events) end = Math.max(end, e.start + e.length);
  return (
    <span className="fe-tc-total" title="Project length">
      / {timecode(end, fps)}
    </span>
  );
}
