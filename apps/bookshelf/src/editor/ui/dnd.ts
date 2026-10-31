/**
 * Drag-and-drop contract between the Explorer (drag sources) and the timeline (the drop target).
 *
 *   DND_MEDIA       a media id already in the pool
 *   DND_GENERATOR   a JSON Media (text/colour) NOT yet in the pool; `duration: null` means Infinity (wire convention)
 *   DND_TRANSITION  a TransitionKind
 *   DND_VIDEO_FX    a VideoFxKind
 * Every drag also sets text/plain to a readable label.
 *
 * Kept in its own module so the timeline does not import the Explorer (and the Explorer re-exports these names).
 */
import type { Media, TransitionKind, VideoFxKind } from '../model/types';

export const DND_MEDIA = 'application/x-orly-media';
export const DND_GENERATOR = 'application/x-orly-generator';
export const DND_TRANSITION = 'application/x-orly-transition';
export const DND_VIDEO_FX = 'application/x-orly-video-fx';

export const DND_TYPES: readonly string[] = [DND_MEDIA, DND_GENERATOR, DND_TRANSITION, DND_VIDEO_FX];

/** what a drag carries, decoded */
export type DropPayload =
  | { kind: 'media'; mediaId: string }
  | { kind: 'generator'; media: Media }
  | { kind: 'transition'; transition: TransitionKind }
  | { kind: 'videoFx'; fx: VideoFxKind };

/** does a drag (by its advertised types; payloads are unreadable until drop) carry an editor payload? */
export const isEditorDrag = (types: readonly string[]): boolean => types.some((t) => DND_TYPES.includes(t));

/** the payload kind a drag advertises (during dragover only the types are readable) */
export function dragKind(types: readonly string[]): DropPayload['kind'] | null {
  if (types.includes(DND_MEDIA)) return 'media';
  if (types.includes(DND_GENERATOR)) return 'generator';
  if (types.includes(DND_TRANSITION)) return 'transition';
  if (types.includes(DND_VIDEO_FX)) return 'videoFx';
  return null;
}

/** a Media → its JSON drag payload (Infinity → null, the wire convention) */
export const mediaToWire = (m: Media): string => JSON.stringify({ ...m, duration: Number.isFinite(m.duration) ? m.duration : null });

/** decode a drop; null when the data is missing or malformed */
export function readDrop(get: (type: string) => string): DropPayload | null {
  const id = get(DND_MEDIA);
  if (id) return { kind: 'media', mediaId: id };
  const gen = get(DND_GENERATOR);
  if (gen) {
    try {
      const raw = JSON.parse(gen) as unknown;
      if (!raw || typeof raw !== 'object') return null;
      const m = raw as Media & { duration: number | null };
      if (typeof m.id !== 'string' || (m.kind !== 'text' && m.kind !== 'color')) return null;
      return { kind: 'generator', media: { ...m, duration: m.duration == null ? Infinity : m.duration } as Media };
    } catch {
      return null;
    }
  }
  const tr = get(DND_TRANSITION);
  if (tr) return { kind: 'transition', transition: tr as TransitionKind };
  const fx = get(DND_VIDEO_FX);
  if (fx) return { kind: 'videoFx', fx: fx as VideoFxKind };
  return null;
}
