/**
 * Timeline — colours, metrics and pointer cursors.
 *
 *   TL.lane, TL.cursor, …          canvas colour tokens (the same dark, low-glare Vegas chrome as the shell)
 *   M.ruler, M.edgeGrab, …         metrics in CSS px (the canvas is DPR-scaled, so these stay crisp)
 *   RULER_H                        height of the fixed band above the lanes (loop bar + ruler + marker bar)
 *   CURSORS.fadeIn, …              Vegas-like pointer cursors (inline SVG with a keyword fallback)
 *   eventColor(media)              body colour of an event by media kind / audio role
 *
 * Pure module (no React, no DOM access at import time).
 */
import type { Media } from '../../model/types';

/** canvas colour tokens */
export const TL = {
  bg: '#16171a',
  lane: '#1c1e22',
  laneAlt: '#1f2126',
  laneFocus: '#262a31',
  laneLocked: 'rgba(255,255,255,0.025)',
  laneEdge: '#2b2e34',
  empty: '#141518',
  rulerBg: '#1e2024',
  rulerBand: '#191b1f',
  rulerText: '#a9afb8',
  tickMajor: '#6b717b',
  tickMinor: '#3d4148',
  gridMajor: 'rgba(255,255,255,0.045)',
  cursor: '#f2f4f7',
  playhead: '#f0a53a',
  loopOn: '#5b84c4',
  loopOff: '#4a4f58',
  loopShade: 'rgba(120,160,230,0.07)',
  marker: '#e8c547',
  region: '#5aa7a0',
  regionShade: 'rgba(90,167,160,0.06)',
  snap: '#5ce1e6',
  select: '#f0b429',
  marqueeFill: 'rgba(91,132,196,0.15)',
  marqueeStroke: 'rgba(140,175,230,0.9)',
  text: '#e6e8ec',
  textDim: '#9aa0aa',
  fadeShade: 'rgba(0,0,0,0.42)',
  fadeLine: 'rgba(255,255,255,0.85)',
  levelLine: 'rgba(130,190,255,0.95)',
  /** the event volume line above 0 dB */
  levelBoost: '#ff9f43',
  /** A/V sync-offset badge */
  syncBad: '#d93f3f',
  /** track envelopes (Vegas draws them across the lane) */
  envTrack: '#7dd87d',
  envVolume: '#4fa3ff',
  envPan: '#ff6b6b',
  envOpacity: '#4fa3ff',
  xfade: 'rgba(255,255,255,0.9)',
  handle: '#ffffff',
  badgeBg: 'rgba(12,13,15,0.92)',
  badgeText: '#f2f4f7',
  muteHatch: 'rgba(0,0,0,0.38)',
  waveform: 'rgba(205,240,215,0.82)',
  waveformMid: 'rgba(205,240,215,0.25)',
} as const;

/** metrics (CSS px) */
export const M = {
  /** loop bar (top), time ruler, marker/region bar (bottom of the band) */
  loopBar: 10,
  ruler: 26,
  markerBar: 18,
  /** event title strip */
  eventHeader: 14,
  /** event height below which the title strip is dropped */
  headerMinH: 30,
  /** grab distances */
  edgeGrab: 6,
  fadeGrab: 8,
  levelGrab: 4,
  envGrab: 5,
  /** pointer travel before a press becomes a drag */
  dragSlop: 3,
  /** snapping radius */
  snapPx: 8,
  /** autoscroll band at the canvas edges while dragging */
  autoScrollPx: 28,
  /** track heights */
  minTrackH: 26,
  maxTrackH: 320,
  /** track header column */
  headerW: 236,
  /** scrollbar thickness */
  scrollbar: 14,
  /** extra empty space below the last track */
  tailPad: 60,
  /** label font */
  font: '11px system-ui, -apple-system, "Segoe UI", sans-serif',
  fontSmall: '10px system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
} as const;

export const RULER_H = M.loopBar + M.ruler + M.markerBar;

/** body / title colours of an event by its media */
export function eventColor(media: Media | undefined): { body: string; head: string } {
  if (!media) return { body: '#3a3d44', head: '#4a4e57' };
  switch (media.kind) {
    case 'shot':
      return { body: '#2c3b55', head: '#4d6fa8' };
    case 'video':
      return { body: '#24434a', head: '#3f8fa0' };
    case 'image':
      return { body: '#3a2f52', head: '#7a5aa8' };
    case 'text':
      return { body: '#4a3b26', head: '#a8834d' };
    case 'color':
      return { body: '#383b41', head: '#8a8f99' };
    case 'audio':
      switch (media.role) {
        case 'narration':
          return { body: '#26402e', head: '#4b8a5e' };
        case 'music':
          return { body: '#3e3622', head: '#a08a45' };
        case 'sfx':
          return { body: '#3f2d3f', head: '#8f5a8f' };
        default:
          return { body: '#2c3a3a', head: '#5a8a88' };
      }
  }
}

// ---------------------------------------------------------------------------
// Cursors: small inline SVGs (Vegas draws a curve for fades, a hand for the level line, brackets for
// slip, a spring for stretch). Every one carries a keyword fallback.
// ---------------------------------------------------------------------------
function svgCursor(body: string, hx: number, hy: number, fallback: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hx} ${hy}, ${fallback}`;
}
const outline = (d: string) => `<path d="${d}" stroke="#000" stroke-width="3.5"/><path d="${d}" stroke="#fff" stroke-width="1.6"/>`;

export const CURSORS = {
  fadeIn: svgCursor(outline('M3 20 C 9 20, 13 6, 21 4') + outline('M16 12h6M19 9l3 3-3 3'), 3, 20, 'nesw-resize'),
  fadeOut: svgCursor(outline('M3 4 C 11 6, 15 20, 21 20') + outline('M2 12h6M5 9l-3 3 3 3'), 21, 20, 'nwse-resize'),
  trim: 'ew-resize',
  stretch: svgCursor(outline('M12 3v18') + outline('M3 12l2-3 2 6 2-6 2 3M13 12l2-3 2 6 2-6 2 3'), 12, 12, 'col-resize'),
  slip: svgCursor(outline('M7 5H4v14h3M17 5h3v14h-3') + outline('M9 12h6M11 10l-2 2 2 2M13 10l2 2-2 2'), 12, 12, 'ew-resize'),
  level: svgCursor(outline('M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4') + outline('M4 12h16'), 12, 12, 'ns-resize'),
  envAdd: svgCursor(outline('M3 16 L 10 9 L 21 13') + outline('M16 3v6M13 6h6'), 10, 9, 'copy'),
  envPoint: 'move',
  move: 'default',
  grabbing: 'grabbing',
  marquee: 'crosshair',
  ruler: 'default',
  loop: 'ew-resize',
} as const;
