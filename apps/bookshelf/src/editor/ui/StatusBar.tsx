/**
 * Status bar: last action, cursor timecode, selection span, timeline zoom, save state, preload and render progress.
 *
 *   <StatusBar fps={24} loadProgress={0.4} onOpenRender={…} />
 *
 * Every field comes from the store with primitive selectors (store rule: never build objects in a selector).
 */
import { useEditor } from '../state/store';
import { eventEnd, type Track } from '../model/types';
import { renderBusy, useRenderJob } from './RenderDialog';
import { timecode } from './theme';

/** span of the selected events (first start → last end), 0 when nothing is selected */
function selectionSpan(sel: readonly string[], tracks: readonly Track[] | undefined): number {
  if (!sel.length || !tracks) return 0;
  const ids = new Set(sel);
  let a = Infinity;
  let b = -Infinity;
  for (const tr of tracks) {
    for (const e of tr.events) {
      if (!ids.has(e.id)) continue;
      a = Math.min(a, e.start);
      b = Math.max(b, eventEnd(e));
    }
  }
  return Number.isFinite(a) ? b - a : 0;
}

export default function StatusBar(props: { fps: number; loadProgress: number | null; onOpenRender: () => void }) {
  const { fps } = props;
  const status = useEditor((s) => s.ui.status);
  const cursor = useEditor((s) => s.ui.cursor);
  const selection = useEditor((s) => s.ui.selection);
  const tracks = useEditor((s) => s.project?.tracks);
  const pxPerSec = useEditor((s) => s.ui.pxPerSec);
  const dirty = useEditor((s) => s.dirty);
  const savedAt = useEditor((s) => s.savedAt);
  const ripple = useEditor((s) => s.ui.ripple);
  const snapping = useEditor((s) => s.ui.snapping);
  const job = useRenderJob();
  const span = selectionSpan(selection, tracks);
  const busy = renderBusy(job);
  const pct = job.state === 'done' ? 100 : (job.status?.progress ?? 0) * 100;

  return (
    <div className="fe-status" role="status">
      <div className="fe-status-cell is-grow" title={status}>
        {status || 'Ready'}
      </div>
      {props.loadProgress != null && props.loadProgress < 1 && (
        <div className="fe-status-cell" title="Decoding audio media">
          Loading audio
          <div className="fe-progress">
            <div style={{ width: `${(props.loadProgress * 100).toFixed(0)}%` }} />
          </div>
        </div>
      )}
      {job.state !== 'idle' && (
        <button className="fe-status-cell" style={{ border: 0, borderRight: '1px solid var(--fe-line)', background: 'transparent', cursor: 'pointer' }} onClick={props.onOpenRender} title="Show the render">
          {busy ? `Rendering${job.status?.phase ? ` (${job.status.phase})` : ''}` : job.state === 'done' ? 'Render done' : job.state === 'error' ? 'Render failed' : 'Render cancelled'}
          {busy && (
            <div className="fe-progress">
              <div style={{ width: `${pct.toFixed(1)}%` }} />
            </div>
          )}
          {busy && <span className="fe-mono">{pct.toFixed(0)}%</span>}
        </button>
      )}
      <div className="fe-status-cell">
        {snapping ? 'Snap' : 'No snap'} · Ripple {ripple === 'off' ? 'off' : ripple === 'tracks' ? 'tracks' : 'all'}
      </div>
      <div className="fe-status-cell" title="Selection length">
        Sel <span className="fe-mono">{selection.length ? `${selection.length} · ${timecode(span, fps)}` : '—'}</span>
      </div>
      <div className="fe-status-cell" title="Timeline zoom">
        <span className="fe-mono">{pxPerSec >= 10 ? pxPerSec.toFixed(0) : pxPerSec.toFixed(2)} px/s</span>
      </div>
      <div className="fe-status-cell" title="Cursor">
        <span className="fe-mono" style={{ color: 'var(--fe-text)' }}>
          {timecode(cursor, fps)}
        </span>
      </div>
      <div className={`fe-status-cell${dirty ? ' is-dirty' : ''}`} title={savedAt ? `Last saved ${new Date(savedAt).toLocaleString()}` : 'Not saved yet'}>
        {dirty ? '● Modified' : savedAt ? `Saved ${shortClock(savedAt)}` : 'Saved'}
      </div>
    </div>
  );
}

const shortClock = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
