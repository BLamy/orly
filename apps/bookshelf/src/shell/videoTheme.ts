/** The video accent — the color the explainer scenes and the player's own
 *  controls are keyed to. Separate from the shelf finish (see theme.ts): the
 *  shelf is furniture, the video accent is the ink the diagrams are drawn in,
 *  and people want them chosen independently.
 *
 *  Stored as an id rather than a hex so the palette can be retuned later
 *  without stranding whatever people already picked. */
export type VideoColor =
  | 'charcoal'
  | 'indigo'
  | 'sky'
  | 'violet'
  | 'emerald'
  | 'amber'
  | 'rose';

/** A whole video palette, not just a tint: `hex` is the accent the diagrams
 *  are drawn in, and bg/panel/glow/line are the surface the video itself sits
 *  on. Picking a color repaints the stage, which is the point — an accent
 *  swap alone barely reads on a backdrop that stayed the same.
 *
 *  These deliberately override the --bp-* tokens the wood themes set (see
 *  src/index.css): the shelf finish still owns the shelf and the chrome around
 *  it, but the video's own surface is now the video color's business. */
export const VIDEO_COLORS: {
  id: VideoColor;
  label: string;
  hex: string;
  bg: string;
  panel: string;
  glow: string;
  line: string;
}[] = [
  {
    id: 'charcoal',
    label: 'Charcoal',
    // A neutral, near-black stage drawn on in cool light grey. The accent
    // stays bright rather than charcoal-on-charcoal — it has to carry the
    // diagrams — while the other categorical roles keep their own hues, so
    // this reads as a monochrome stage with colour used sparingly.
    hex: '#cbd5e1',
    bg: '#0e0f11',
    panel: 'rgba(24, 26, 29, 0.92)',
    glow: '#26292e',
    line: 'rgba(160, 168, 178, 0.16)',
  },
  {
    id: 'indigo',
    label: 'Indigo',
    hex: '#4c6ef5',
    bg: '#0a0e1a',
    panel: 'rgba(13, 19, 33, 0.92)',
    glow: '#1d2b52',
    line: 'rgba(148, 163, 184, 0.16)',
  },
  {
    id: 'sky',
    label: 'Sky',
    hex: '#38bdf8',
    bg: '#061119',
    panel: 'rgba(10, 27, 38, 0.92)',
    glow: '#103a52',
    line: 'rgba(148, 190, 210, 0.16)',
  },
  {
    id: 'violet',
    label: 'Violet',
    hex: '#a78bfa',
    bg: '#100c1b',
    panel: 'rgba(26, 20, 46, 0.92)',
    glow: '#2f2160',
    line: 'rgba(170, 155, 210, 0.16)',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    hex: '#34d399',
    bg: '#05130e',
    panel: 'rgba(10, 31, 24, 0.92)',
    glow: '#0f4230',
    line: 'rgba(148, 200, 175, 0.16)',
  },
  {
    id: 'amber',
    label: 'Amber',
    hex: '#fbbf24',
    bg: '#140e04',
    panel: 'rgba(36, 26, 9, 0.92)',
    glow: '#4a3410',
    line: 'rgba(214, 185, 130, 0.16)',
  },
  {
    id: 'rose',
    label: 'Rose',
    hex: '#fb7185',
    bg: '#15080c',
    panel: 'rgba(37, 15, 22, 0.92)',
    glow: '#4d1a29',
    line: 'rgba(214, 150, 165, 0.16)',
  },
];

/** The house look: a charcoal stage, paired with the mahogany shelf (see
 *  DEFAULT_THEME in theme.ts). */
export const DEFAULT_VIDEO_COLOR: VideoColor = 'charcoal';

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

/** Publishes the choice on <html>: the accent as --video-accent (the scene
 *  palette reads it from there at load — src/viz/engine/core/colors.ts — which
 *  is why this has to run before any scene module is imported, see main.tsx),
 *  and the surface as the --bp-* tokens.
 *
 *  Set inline so they win over the wood theme's own --bp-* block in
 *  index.css. Only the video is affected: nothing on the shelf reads --bp-*. */
export function applyVideoColor(color: VideoColor = getVideoColor()) {
  const c = BY_ID.get(color) ?? BY_ID.get(DEFAULT_VIDEO_COLOR)!;
  const s = document.documentElement.style;
  s.setProperty('--video-accent', c.hex);
  s.setProperty('--bp-bg', c.bg);
  s.setProperty('--bp-panel', c.panel);
  s.setProperty('--bp-glow', c.glow);
  s.setProperty('--bp-line', c.line);
  // Legible on every one of these surfaces, and the same pairing the scene
  // palette validates its contrast against.
  s.setProperty('--bp-text', '#e6edf6');
  s.setProperty('--bp-muted', '#8da2be');
}

export function setVideoColor(color: VideoColor) {
  window.localStorage.setItem(KEY, color);
  applyVideoColor(color);
  window.dispatchEvent(new CustomEvent('orly-video-color-change', { detail: color }));
}

export function initVideoColor() {
  applyVideoColor();
}
