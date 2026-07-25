/** The video accent — the color the explainer scenes and the player's own
 *  controls are keyed to. Separate from the shelf finish (see theme.ts): the
 *  shelf is furniture, the video accent is the ink the diagrams are drawn in,
 *  and people want them chosen independently.
 *
 *  Stored as an id rather than a hex so the palette can be retuned later
 *  without stranding whatever people already picked. */
export type VideoColor = 'indigo' | 'sky' | 'violet' | 'emerald' | 'amber' | 'rose';

export const VIDEO_COLORS: { id: VideoColor; label: string; hex: string }[] = [
  { id: 'indigo', label: 'Indigo', hex: '#4c6ef5' },
  { id: 'sky', label: 'Sky', hex: '#38bdf8' },
  { id: 'violet', label: 'Violet', hex: '#a78bfa' },
  { id: 'emerald', label: 'Emerald', hex: '#34d399' },
  { id: 'amber', label: 'Amber', hex: '#fbbf24' },
  { id: 'rose', label: 'Rose', hex: '#fb7185' },
];

/** The house color the explainers have always been drawn in. */
export const DEFAULT_VIDEO_COLOR: VideoColor = 'indigo';

const BY_ID = new Map(VIDEO_COLORS.map((c) => [c.id, c]));
const KEY = 'orly-video-color';

export function getVideoColor(): VideoColor {
  if (typeof window === 'undefined') return DEFAULT_VIDEO_COLOR;
  const v = window.localStorage.getItem(KEY);
  return v && BY_ID.has(v as VideoColor) ? (v as VideoColor) : DEFAULT_VIDEO_COLOR;
}

export function videoHex(color: VideoColor = getVideoColor()): string {
  return (BY_ID.get(color) ?? BY_ID.get(DEFAULT_VIDEO_COLOR)!).hex;
}

/** Publishes the choice as --video-accent on <html>. The scene palette reads
 *  it from there at load (src/viz/engine/core/colors.ts), which is also why
 *  this has to run before any scene module is imported — see main.tsx. */
export function applyVideoColor(color: VideoColor = getVideoColor()) {
  document.documentElement.style.setProperty('--video-accent', videoHex(color));
}

export function setVideoColor(color: VideoColor) {
  window.localStorage.setItem(KEY, color);
  applyVideoColor(color);
  window.dispatchEvent(new CustomEvent('orly-video-color-change', { detail: color }));
}

export function initVideoColor() {
  applyVideoColor();
}
