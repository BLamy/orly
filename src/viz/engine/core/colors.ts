import { interpolateRgb } from 'd3';

/**
 * The suite's palette — self-contained (no host imports), except for the four
 * structural tokens below (BG/PANEL/TEXT/GRID), which resolve at paint time
 * against the SAME --bp-* CSS custom properties the surrounding player chrome
 * uses (src/index.css) — so every scene's backdrop/panels/labels follow the
 * walnut/pine theme switch automatically, with no per-scene changes. Each has
 * a literal fallback (the original dark-theme hex) for any context where
 * those custom properties aren't defined (e.g. an isolated render in the
 * generator's validate/QA pipeline). MUTED and the categorical role tokens
 * (ACCENT/SECONDARY/…) stay fixed hex — real values, not var() strings, are
 * required wherever a scene feeds them through d3's `interpolateRgb`/`d3.color`
 * (which can't parse a CSS var() function), and both read acceptably against
 * either theme's backdrop as-is.
 */
export const BG = 'var(--bp-bg, #0a0e1a)';
export const PANEL = 'var(--bp-panel, #0d1321)';
export const TEXT = 'var(--bp-text, #e6edf6)';
export const MUTED = '#8da2be';
export const GRID = 'var(--bp-line, rgba(148, 163, 184, 0.16))';

/** The video accent, chosen in Settings (src/shell/videoTheme.ts) and
 *  published as --video-accent on <html>.
 *
 *  Resolved to a literal hex ONCE at module load rather than left as a
 *  `var()` string like the structural tokens above: scenes feed ACCENT through
 *  d3's `interpolateRgb`/`d3.color`, which cannot parse a CSS var() function.
 *  Reading it at load is why main.tsx applies the setting before render — and
 *  it means a change takes effect on the next scene load, not mid-scene. */
function resolveAccent(): string {
  if (typeof document === 'undefined') return '#4c6ef5'; // node/generator render
  const v = getComputedStyle(document.documentElement).getPropertyValue('--video-accent').trim();
  return v || '#4c6ef5';
}

export const ACCENT = resolveAccent();
export const SECONDARY = '#a78bfa'; // violet
export const POSITIVE = '#34d399'; // emerald
export const WARM = '#fbbf24'; // amber
export const NEGATIVE = '#fb7185'; // rose
export const TEAL = '#2dd4bf';

/** Sequential ramp for heatmaps: panel-dark → accent. Deliberately built from
 *  the literal dark-theme hex, not the (possibly var()-based) PANEL export
 *  above — d3's interpolateRgb parses real color values once at module load,
 *  not CSS custom properties, so this always uses the fixed hue regardless of
 *  the active theme. */
export const heat = interpolateRgb('#0d1321', ACCENT);

/** Emphasis color for maxima (e.g. the sharpest attention weight). */
export const HEAT_MAX = WARM;

/** The stage background the palette is validated against. */
export const surface = BG;

/** Fixed categorical order — assign by entity, never cycle. */
export const categorical = [ACCENT, WARM, POSITIVE, SECONDARY, NEGATIVE, TEAL] as const;

/** Text/line hierarchy for labels, grids, and axes. */
export const ink = {
  primary: TEXT,
  secondary: MUTED,
  muted: '#5c6478',
  faint: '#39415a',
  grid: GRID,
  axis: 'rgba(148, 163, 184, 0.38)',
} as const;

export const font = {
  ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  math: 'Georgia, "Times New Roman", STIXGeneral, serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
} as const;
