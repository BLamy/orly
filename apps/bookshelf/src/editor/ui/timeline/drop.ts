/**
 * Drops from the Explorer onto the timeline (the contract is in ../dnd.ts). Pure: given the project, the decoded
 * payload and where it landed, returns the edit to commit (one undo step) or a status message saying why not.
 *
 *   media / generator   inserted on the track under the pointer (or the nearest track that can host it) at the
 *                       drop time, snapped like a move (cursor, edges, markers, words; else the frame grid);
 *                       a generator joins the pool with the event
 *   transition          applied to the cut nearest the drop on that video track: an existing overlap keeps its
 *                       length and takes the kind; a butt cut becomes an overlap of the transition's default length
 *   video FX            onto a video event: event FX (with its group / the selection it belongs to); onto an empty
 *                       part of a video lane or its header: track FX
 */
import { TRANSITIONS_UI } from '../../engine/transitions';
import { newId } from '../../model/id';
import { addVideoFx, canHost, expandGroups, findEvent, insertMedia, previousNeighbour, setOverlapAtCut, VIDEO_FX_DEFAULT, type RippleMode } from '../../model/ops';
import { buildSnapIndex, snapToFrame } from '../../model/snap';
import type { Media, Project, Track, TransitionKind, VideoFxKind } from '../../model/types';
import { eventEnd } from '../../model/types';
import type { DropPayload } from '../dnd';

/** where a drop landed: timeline time, and the track / event under the pointer (null when none) */
export interface DropTarget {
  t: number;
  trackId: string | null;
  eventId: string | null;
}

export interface DropContext {
  /** current selection (an FX dropped on a selected event goes to the whole selection) */
  selection: readonly string[];
  cursor: number;
  loop: { start: number; end: number } | null;
  snapping: boolean;
  ripple: RippleMode;
  pxPerSec: number;
}

export type DropResult =
  | { ok: true; label: string; apply: (p: Project) => Project; select?: string[]; track?: string }
  | { ok: false; status: string };

const isTransition = (k: string): k is TransitionKind => TRANSITIONS_UI.some((t) => t.kind === k);
const isVideoFx = (k: string): k is VideoFxKind => Object.prototype.hasOwnProperty.call(VIDEO_FX_DEFAULT, k);

/** the track a medium lands on: the one under the pointer when it can host it, else the nearest that can */
function hostTrack(p: Project, m: Media, trackId: string | null): Track | null {
  const i = p.tracks.findIndex((t) => t.id === trackId);
  const ok = (t: Track) => !t.lock && canHost(t.kind, m);
  if (i >= 0 && ok(p.tracks[i])) return p.tracks[i];
  // search outward from the pointer row (top first on ties)
  const from = i < 0 ? 0 : i;
  for (let d = 1; d < p.tracks.length; d++) {
    const up = p.tracks[from - d];
    if (up && ok(up)) return up;
    const down = p.tracks[from + d];
    if (down && ok(down)) return down;
  }
  return i < 0 ? (p.tracks.find(ok) ?? null) : null;
}

/** the event after the cut nearest `t` on a track (it carries the transition), or null when the track has no cuts */
export function nearestCut(track: Track, t: number): string | null {
  let best: { id: string; d: number } | null = null;
  for (const e of track.events) {
    const left = previousNeighbour(track, e);
    if (!left) continue;
    const cut = (e.start + Math.min(eventEnd(left), eventEnd(e))) / 2;
    const d = Math.abs(cut - t);
    if (!best || d < best.d) best = { id: e.id, d };
  }
  return best?.id ?? null;
}

export function planDrop(p: Project, payload: DropPayload, at: DropTarget, ctx: DropContext): DropResult {
  switch (payload.kind) {
    case 'media':
    case 'generator': {
      const m = payload.kind === 'media' ? p.media[payload.mediaId] : payload.media;
      if (!m) return { ok: false, status: 'That medium is no longer in the pool' };
      const track = hostTrack(p, m, at.trackId);
      if (!track) return { ok: false, status: `No unlocked ${m.kind === 'audio' ? 'audio' : 'video'} track for ${m.label}` };
      let t = Math.max(0, at.t);
      // a picture lands on a frame even when it snaps to a narration word (Quantize to frames)
      if (ctx.snapping) t = buildSnapIndex(p, { cursor: ctx.cursor, loop: ctx.loop, quantize: track.kind === 'video' }).snap(t, ctx.pxPerSec).t;
      else t = snapToFrame(t, p.fps);
      const id = newId('e');
      return {
        ok: true,
        label: `Insert ${m.label}`,
        apply: (q) => insertMedia(q, track.id, m, Math.max(0, t), { id, ripple: ctx.ripple }),
        select: [id],
        track: track.id,
      };
    }
    case 'transition': {
      const kind = payload.transition;
      if (!isTransition(kind)) return { ok: false, status: `Unknown transition "${kind}"` };
      const track = p.tracks.find((tr) => tr.id === at.trackId);
      if (!track || track.kind !== 'video') return { ok: false, status: 'Drop a transition on a cut or overlap of a video track' };
      if (track.lock) return { ok: false, status: `${track.name} is locked` };
      const rightId = nearestCut(track, at.t);
      if (!rightId) return { ok: false, status: `${track.name} has no cuts to put a transition on` };
      const info = TRANSITIONS_UI.find((x) => x.kind === kind);
      return {
        ok: true,
        label: `Transition: ${info?.label ?? kind}`,
        apply: (q) => {
          const ref = findEvent(q, rightId);
          const left = ref && previousNeighbour(ref.track, ref.event);
          if (!ref || !left) return q;
          const overlap = eventEnd(left) - ref.event.start;
          // keep an existing overlap's length; a butt cut gets the transition's default length
          return setOverlapAtCut(q, rightId, overlap > 1e-6 ? overlap : (info?.dur ?? 1), kind);
        },
        select: [rightId],
        track: track.id,
      };
    }
    case 'videoFx': {
      const kind = payload.fx;
      if (!isVideoFx(kind)) return { ok: false, status: `Unknown effect "${kind}"` };
      const track = p.tracks.find((tr) => tr.id === at.trackId);
      if (!track || track.kind !== 'video') return { ok: false, status: 'Drop a video effect on a video event or track' };
      if (at.eventId) {
        // a selected event shares the drop with the rest of the selection (Vegas applies FX to the selection)
        const ids = ctx.selection.includes(at.eventId) ? expandGroups(p, ctx.selection) : [at.eventId];
        const video = ids.filter((id) => findEvent(p, id)?.track.kind === 'video');
        return {
          ok: true,
          label: `Add ${kind}${video.length > 1 ? ` to ${video.length} events` : ''}`,
          apply: (q) => video.reduce((acc, id) => addVideoFx(acc, { scope: 'event', id }, kind), q),
          select: video,
          track: track.id,
        };
      }
      return { ok: true, label: `Add ${kind} to ${track.name}`, apply: (q) => addVideoFx(q, { scope: 'track', id: track.id }, kind), track: track.id };
    }
  }
}
