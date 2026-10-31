/**
 * Render As… (Vegas): pick a range, size and frame rate, then export through the dev server.
 *
 *   <RenderDialog slug fps duration loop regions getProject dirty onClose />
 *   useRenderJob()            the current export (server RenderStatus + client state) — StatusBar reads it
 *
 * Flow (docs/film/EDITOR.md "Server"):
 *   POST   /__editor/render/<slug>          RenderRequest {from, to, width, height, fps, preset, name, project?}
 *   GET    /__editor/render/<slug>/status   RenderStatus, polled every second until done / error / cancelled
 *   DELETE /__editor/render/<slug>          cancel
 * When the project has unsaved edits the in-memory project rides along in the request, so the export is always
 * what the preview shows; otherwise the exporter renders the saved films/<slug>/edit/project.json.
 * The job lives in a module-level store, so closing the dialog keeps polling and the status bar keeps showing
 * progress; reopening the dialog shows the same job.
 */
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { Project, Region, RenderPreset, RenderRequest, RenderStatus } from '../model/types';
import { shortTime, timecode } from './theme';

export interface RenderJob {
  /** 'starting' = POST in flight (client side); otherwise the server's state */
  state: RenderStatus['state'] | 'starting';
  /** last status from the server */
  status: RenderStatus | null;
  /** a client-side failure (POST rejected, network) */
  error?: string;
  slug?: string;
}

export const SIZE_PRESETS = [
  { id: '1080p', label: '1080p (1920×1080)', width: 1920, height: 1080, preset: 'final' },
  { id: '720p', label: '720p (1280×720)', width: 1280, height: 720, preset: 'final' },
  { id: '540p', label: '540p preview (960×540, fast)', width: 960, height: 540, preset: 'preview' },
] as const satisfies readonly { id: string; label: string; width: number; height: number; preset: RenderPreset }[];
export type SizePresetId = (typeof SIZE_PRESETS)[number]['id'];

// ---------------------------------------------------------------------------
// job store (module level: survives the dialog)
// ---------------------------------------------------------------------------
let job: RenderJob = { state: 'idle', status: null };
const subs = new Set<() => void>();
let poll: ReturnType<typeof setInterval> | null = null;

function setJob(next: RenderJob): void {
  job = next;
  subs.forEach((f) => f());
}

export function useRenderJob(): RenderJob {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => job,
  );
}

export const renderBusy = (j: RenderJob): boolean => j.state === 'starting' || j.state === 'running';

/** an error response body is {error}; anything else is shown as text */
async function errorText(r: Response): Promise<string> {
  const text = await r.text();
  try {
    const b = JSON.parse(text) as { error?: unknown };
    if (typeof b.error === 'string') return b.error;
  } catch {
    /* not JSON */
  }
  return text || `HTTP ${r.status}`;
}

function stopPolling(): void {
  if (poll) clearInterval(poll);
  poll = null;
}

function startPolling(slug: string): void {
  stopPolling();
  let inFlight = false;
  poll = setInterval(async () => {
    if (inFlight) return;
    inFlight = true;
    try {
      const r = await fetch(`/__editor/render/${encodeURIComponent(slug)}/status`, { cache: 'no-store' });
      if (!r.ok) throw new Error(await errorText(r));
      const status = (await r.json()) as RenderStatus;
      setJob({ state: status.state, status, slug });
      if (status.state !== 'running') stopPolling();
    } catch (e) {
      // one failed poll is not a failed render (the dev server may be busy); keep polling
      if (job.status) setJob({ ...job, status: { ...job.status, message: `waiting for status… (${(e as Error).message})` } });
    } finally {
      inFlight = false;
    }
  }, 1000);
}

export async function startRender(slug: string, req: RenderRequest): Promise<void> {
  setJob({ state: 'starting', status: null, slug });
  try {
    const r = await fetch(`/__editor/render/${encodeURIComponent(slug)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req),
    });
    if (!r.ok) throw new Error(await errorText(r));
    const status = (await r.json()) as RenderStatus;
    setJob({ state: status.state === 'idle' ? 'running' : status.state, status, slug });
    startPolling(slug);
  } catch (e) {
    setJob({ state: 'error', status: null, error: (e as Error).message, slug });
  }
}

export async function cancelRender(slug: string): Promise<void> {
  try {
    const r = await fetch(`/__editor/render/${encodeURIComponent(slug)}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(await errorText(r));
    // keep polling: the server reports 'cancelled' once the job's processes have exited
  } catch (e) {
    setJob({ ...job, error: (e as Error).message });
  }
}

// ---------------------------------------------------------------------------
// dialog
// ---------------------------------------------------------------------------
type RangeKind = 'all' | 'loop' | 'region';

export interface RenderDialogProps {
  slug: string;
  fps: number;
  duration: number;
  loop: { start: number; end: number } | null;
  regions: Region[];
  /** the current in-memory project (sent with the request when it has unsaved edits) */
  getProject: () => Project | null;
  dirty: boolean;
  onClose: () => void;
}

export default function RenderDialog(props: RenderDialogProps) {
  const { slug, fps, duration, loop, regions, onClose } = props;
  const j = useRenderJob();
  const busy = renderBusy(j);
  const st = j.status;
  const progress = j.state === 'done' ? 1 : Math.max(0, Math.min(1, st?.progress ?? 0));
  const [range, setRange] = useState<RangeKind>(loop ? 'loop' : 'all');
  const [regionId, setRegionId] = useState(regions[0]?.id ?? '');
  const [size, setSize] = useState<SizePresetId>('1080p');
  const [outFps, setOutFps] = useState(fps);
  const [name, setName] = useState(`${slug}-edit`);

  const span = useMemo(() => {
    if (range === 'loop' && loop) return { from: loop.start, to: loop.end };
    if (range === 'region') {
      const r = regions.find((x) => x.id === regionId);
      if (r) return { from: r.start, to: r.end };
    }
    return { from: 0, to: duration };
  }, [range, loop, regions, regionId, duration]);
  const frames = Math.round((span.to - span.from) * outFps);
  const safeName = name.trim().replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || `${slug}-edit`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const start = () => {
    const p = SIZE_PRESETS.find((x) => x.id === size)!;
    const project = props.dirty ? props.getProject() : null;
    void startRender(slug, {
      from: span.from,
      to: span.to,
      width: p.width,
      height: p.height,
      fps: outFps,
      preset: p.preset,
      name: safeName,
      ...(project ? { project } : {}),
    });
  };
  const phaseText =
    j.state === 'starting' ? 'Starting the exporter…'
    : j.state === 'done' ? 'Finished'
    : j.state === 'error' ? 'Failed'
    : j.state === 'cancelled' ? 'Cancelled'
    : [st?.phase, st?.message].filter(Boolean).join(' · ') || 'Rendering…';
  const failure = j.error ?? (j.state === 'error' ? st?.message : undefined);

  return (
    <div className="fe-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fe-dialog" role="dialog" aria-modal="true" aria-labelledby="fe-render-title" style={{ width: 520 }}>
        <div className="fe-dialog-head">
          <span id="fe-render-title">Render As</span>
          <button className="fe-icon-btn" onClick={onClose} aria-label="Close" title="Close (Esc)">
            ✕
          </button>
        </div>
        <div className="fe-dialog-body">
          <div className="fe-row">
            <label className="fe-label" htmlFor="fe-r-name">
              File name
            </label>
            <div className="fe-inline">
              <input id="fe-r-name" className="fe-input" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} autoFocus />
              <span className="fe-dim">.mp4</span>
            </div>
          </div>
          <div className="fe-row">
            <span className="fe-label">Range</span>
            <div className="fe-inline" role="radiogroup" aria-label="Render range">
              <label className="fe-check">
                <input type="radio" checked={range === 'all'} onChange={() => setRange('all')} disabled={busy} /> Whole project
              </label>
              <label className="fe-check" title={loop ? '' : 'Set a loop region first (I / O)'}>
                <input type="radio" checked={range === 'loop'} onChange={() => setRange('loop')} disabled={busy || !loop} /> Loop
              </label>
              <label className="fe-check" title={regions.length ? '' : 'The project has no regions'}>
                <input type="radio" checked={range === 'region'} onChange={() => setRange('region')} disabled={busy || !regions.length} /> Region
              </label>
            </div>
          </div>
          {range === 'region' && (
            <div className="fe-row">
              <label className="fe-label" htmlFor="fe-r-region">
                Region
              </label>
              <select id="fe-r-region" className="fe-select" value={regionId} onChange={(e) => setRegionId(e.target.value)} disabled={busy}>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label || r.id} ({shortTime(r.start)}–{shortTime(r.end)})
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="fe-row">
            <label className="fe-label" htmlFor="fe-r-size">
              Frame size
            </label>
            <select id="fe-r-size" className="fe-select" value={size} onChange={(e) => setSize(e.target.value as SizePresetId)} disabled={busy}>
              {SIZE_PRESETS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="fe-row">
            <label className="fe-label" htmlFor="fe-r-fps">
              Frame rate
            </label>
            <select id="fe-r-fps" className="fe-select" value={outFps} onChange={(e) => setOutFps(Number(e.target.value))} disabled={busy}>
              {[...new Set([fps, 24, 25, 30])].map((f) => (
                <option key={f} value={f}>
                  {f} fps{f === fps ? ' (project)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="fe-row">
            <span className="fe-label">Summary</span>
            <span className="fe-mono fe-dim">
              {timecode(span.from, outFps)} → {timecode(span.to, outFps)} · {shortTime(span.to - span.from)} · {frames.toLocaleString()} frames
            </span>
          </div>
          <div className="fe-hint" style={{ padding: '6px 0 0' }}>
            Output: <span className="fe-mono">films/{slug}/edit/exports/{safeName}.mp4</span>.{' '}
            {props.dirty ? 'Unsaved edits are included (the in-memory project is sent with the request). ' : ''}
            The exporter renders frame-exactly with the film engine and mixes the audio through the same graph as the preview.
          </div>

          {j.state !== 'idle' && (
            <div style={{ marginTop: 12 }} aria-live="polite">
              <div className={`fe-progress${j.state === 'error' ? ' is-error' : j.state === 'done' ? ' is-done' : ''}`}>
                <div style={{ width: `${(progress * 100).toFixed(1)}%` }} />
              </div>
              <div className="fe-inline" style={{ marginTop: 6, justifyContent: 'space-between' }}>
                <span>{phaseText}</span>
                <span className="fe-mono fe-dim">
                  {st?.totalFrames ? `${(st.frames ?? 0).toLocaleString()}/${st.totalFrames.toLocaleString()} f · ` : ''}
                  {st?.fps ? `${st.fps.toFixed(1)} fps · ` : ''}
                  {(progress * 100).toFixed(1)}%{busy && st?.etaSec != null ? ` · ~${shortTime(st.etaSec)} left` : ''}
                </span>
              </div>
              {failure && <div className="fe-error-text" style={{ marginTop: 6 }}>{failure}</div>}
              {j.state === 'error' && st?.log?.length ? (
                <pre className="fe-error-text" style={{ marginTop: 6, maxHeight: 140, overflow: 'auto', color: 'var(--fe-dim)' }}>
                  {st.log.slice(-12).join('\n')}
                </pre>
              ) : null}
              {j.state === 'done' && st?.url && (
                <div style={{ marginTop: 8 }}>
                  <video src={st.url} controls style={{ width: '100%', background: '#000', borderRadius: 3 }} />
                  <a href={st.url} target="_blank" rel="noreferrer" style={{ color: 'var(--fe-focus)' }}>
                    Open {st.out?.split('/').pop() ?? 'output'}
                  </a>
                  {st.checks && (
                    <span className="fe-dim" style={{ marginLeft: 10 }}>
                      checks:{' '}
                      {Object.entries(st.checks)
                        .map(([k, ok]) => `${ok ? '✓' : '✗'} ${k}`)
                        .join('  ')}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="fe-dialog-foot">
          {busy ? (
            <button className="fe-btn is-danger" onClick={() => cancelRender(slug)}>
              Cancel render
            </button>
          ) : (
            <button className="fe-btn is-primary" onClick={start} disabled={span.to - span.from <= 0}>
              Render
            </button>
          )}
          <button className="fe-btn" onClick={onClose}>
            {busy ? 'Hide' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
