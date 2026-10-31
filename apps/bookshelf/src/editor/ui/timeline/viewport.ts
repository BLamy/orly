/**
 * Timeline viewport + shell hooks — zoom/scroll helpers other panels can call, and the commands the
 * timeline asks the shell to carry out (dialogs it does not own).
 *
 *   zoomTimeline(factor, anchorT?)     zoom around anchorT (default: the edit cursor), keeping it under x
 *   zoomToFit()                        whole project in view
 *   revealTime(t)                      scroll so t is visible (no-op if it already is)
 *   setLaneWidth(px)                   the Timeline reports its lane width here on resize
 *
 *   window.addEventListener(TIMELINE_COMMAND, (e) => {               // shell side
 *     const cmd = (e as CustomEvent<TimelineCommand>).detail; … })
 *
 * All state goes through the store (ui.pxPerSec / ui.scrollT); the only module state is the last known
 * lane width, which the zoom maths needs.
 */
import { editor } from '../../state/store';
import { projectDuration } from '../../model/types';
import { zoomAround, zoomLimits } from './geometry.ts';

let laneWidth = 900;
/** has a mounted Timeline measured its lanes yet; and is a fit waiting for that first measurement */
let measured = false;
let fitPending = false;

/** called by the Timeline whenever its lane canvas is resized */
export function setLaneWidth(px: number): void {
  if (!(px > 0)) return;
  laneWidth = px;
  measured = true;
  if (fitPending) {
    fitPending = false;
    zoomToFit();
  }
}

/** zoom to fit as soon as the (lazily loaded) timeline knows its width: now if it has measured, else on its
 *  first measurement, so a load-time fit never runs against the placeholder width or overrides a later zoom */
export function fitWhenMeasured(): void {
  if (measured) zoomToFit();
  else fitPending = true;
}
export const getLaneWidth = (): number => laneWidth;

function limits() {
  const s = editor.getState();
  const p = s.project;
  return zoomLimits(p ? projectDuration(p) : 60, laneWidth, p?.fps ?? 24);
}

export function zoomTimeline(factor: number, anchorT?: number): void {
  const { ui } = editor.getState();
  const anchor = anchorT ?? ui.cursor;
  const view = { scrollT: ui.scrollT, pxPerSec: ui.pxPerSec, width: laneWidth };
  // keep an off-screen anchor from yanking the view: zoom around the view centre instead
  const ax = (anchor - ui.scrollT) * ui.pxPerSec;
  const a = ax >= 0 && ax <= laneWidth ? anchor : ui.scrollT + laneWidth / 2 / ui.pxPerSec;
  editor.set(zoomAround(view, factor, a, limits()));
}

export function zoomToFit(): void {
  const s = editor.getState();
  const d = s.project ? projectDuration(s.project) : 60;
  const lim = limits();
  const pxPerSec = Math.max(lim.min, Math.min(lim.max, (laneWidth - 24) / Math.max(1, d)));
  editor.set({ pxPerSec, scrollT: 0 });
}

export function revealTime(t: number, margin = 0.1): void {
  const { ui } = editor.getState();
  const visible = laneWidth / ui.pxPerSec;
  if (t >= ui.scrollT && t <= ui.scrollT + visible) return;
  editor.set({ scrollT: Math.max(0, t - visible * margin) });
}

// ---------------------------------------------------------------------------
// Commands for the shell (it owns the Inspector, Pan/Crop and FX dialogs)
// ---------------------------------------------------------------------------
export const TIMELINE_COMMAND = 'film-editor:timeline-command';

export type TimelineCommand =
  | { kind: 'eventProperties'; eventId: string }
  | { kind: 'panCrop'; eventId: string }
  | { kind: 'eventFx'; eventId: string }
  | { kind: 'trackFx'; trackId: string }
  | { kind: 'trackProperties'; trackId: string }
  /** the shell's clipboard commands (they own the system clipboard mirror) */
  | { kind: 'clipboard'; op: 'cut' | 'copy' | 'paste' };

export function emitTimelineCommand(cmd: TimelineCommand): void {
  window.dispatchEvent(new CustomEvent<TimelineCommand>(TIMELINE_COMMAND, { detail: cmd }));
}
