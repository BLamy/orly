/**
 * The timeline view in the URL: ?film-edit=<slug>&t=123.45&zoom=40&scroll=100
 *
 * The cursor (t, seconds), zoom (px per second) and horizontal scroll (seconds at the left edge) are mirrored into
 * the query string with history.replaceState (throttled, no history entries), so a hot reload or a refresh comes
 * back to the same place, and a URL can be shared to point at a moment. On load the URL wins over the view saved
 * with the project (which only updates on save).
 */
import { editor, type EditorUi } from '../state/store';

const KEYS = { cursor: 't', pxPerSec: 'zoom', scrollT: 'scroll' } as const;
type UrlView = Partial<Pick<EditorUi, 'cursor' | 'pxPerSec' | 'scrollT'>>;

/** the view encoded in the current URL (only the keys present and valid) */
export function readUrlView(): UrlView {
  const q = new URLSearchParams(window.location.search);
  const out: UrlView = {};
  for (const [field, key] of Object.entries(KEYS) as [keyof UrlView, string][]) {
    const raw = q.get(key);
    if (raw === null || raw === '') continue;
    const v = Number(raw);
    if (!Number.isFinite(v) || v < 0 || (field === 'pxPerSec' && v === 0)) continue;
    out[field] = v;
  }
  return out;
}

const fmt = (field: keyof UrlView, v: number) => (field === 'pxPerSec' ? String(+v.toFixed(3)) : v.toFixed(2));

/** keep the URL in step with the view; returns the unsubscribe */
export function startUrlViewSync(intervalMs = 250): () => void {
  let timer: number | null = null;
  let last = '';
  const write = () => {
    timer = null;
    const { ui } = editor.getState();
    const url = new URL(window.location.href);
    for (const [field, key] of Object.entries(KEYS) as [keyof UrlView, string][]) url.searchParams.set(key, fmt(field, ui[field]));
    const next = url.search;
    if (next === last || next === window.location.search) return;
    last = next;
    window.history.replaceState(window.history.state, '', url.pathname + next + url.hash);
  };
  const unsub = editor.subscribe(() => {
    if (timer === null) timer = window.setTimeout(write, intervalMs);
  });
  // flush on reload/close so the very last position is kept
  const flush = () => {
    if (timer !== null) window.clearTimeout(timer);
    write();
  };
  window.addEventListener('pagehide', flush);
  return () => {
    unsub();
    window.removeEventListener('pagehide', flush);
    if (timer !== null) window.clearTimeout(timer);
  };
}
