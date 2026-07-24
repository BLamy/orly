import type { CaptionInfo, ChannelInfo, NarrationLine, TimelineOverrides } from '../core/timeline';

/**
 * The Motion addon's channel protocol. The preview iframe owns the live
 * Timeline; the manager panel is a remote control — everything crossing the
 * channel is plain serializable data.
 */
export const EVT_DOC = 'viz-motion/doc';
export const EVT_TIME = 'viz-motion/time';
export const EVT_OP = 'viz-motion/op';

/**
 * Default URL the panel's "save to source" button POSTs to. Wire the other
 * end with `motionSaveEndpointPlugin()` in your Storybook viteFinal; override
 * via `registerMotionAddon({ saveEndpoint })` or `setMotionSaveEndpoint()`.
 */
export const DEFAULT_SAVE_ENDPOINT = '/__motion/save';

/** preview → panel: full document snapshot (on story change + after edits) */
export interface MotionDoc {
  channels: ChannelInfo[];
  captions: CaptionInfo[];
  duration: number;
  /** repo-relative overrides file the save endpoint writes (null = unsaveable) */
  file: string | null;
  slug: string;
  overrides: TimelineOverrides;
  narration: NarrationLine[];
}

/** preview → panel: playhead stream (~30 Hz while playing) */
export interface MotionTime {
  t: number;
  playing: boolean;
  looping: boolean;
}

/** panel → preview: edit + transport commands */
export type MotionOp =
  | { op: 'kf'; id: number; patch: { at?: number; dur?: number } }
  | { op: 'cap'; id: number; patch: { at?: number; dur?: number; text?: string } }
  | { op: 'seek'; t: number }
  | { op: 'toggle' }
  | { op: 'loop'; on: boolean }
  | { op: 'voice'; on: boolean }
  | { op: 'reset' };
