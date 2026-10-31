/**
 * Timeline public surface (what the shell imports).
 *
 *   import Timeline from './timeline'                                  // the track view
 *   import { zoomTimeline, zoomToFit, revealTime } from './timeline'   // View menu / shortcuts
 *   import { TIMELINE_COMMAND, type TimelineCommand } from './timeline' // dialogs the timeline asks for
 *   import { dragMove, dragTrim, crossfadeFixup } from './timeline'    // gesture edits (plain edits: model/ops.ts)
 */
export { default } from './Timeline';
export type { TimelineProps } from './Timeline';
export { zoomTimeline, zoomToFit, revealTime, TIMELINE_COMMAND, emitTimelineCommand, type TimelineCommand } from './viewport.ts';
export { dragMove, dragTrim, crossfadeFixup, moveRange, trimRange, duplicateTrack } from './edits.ts';
