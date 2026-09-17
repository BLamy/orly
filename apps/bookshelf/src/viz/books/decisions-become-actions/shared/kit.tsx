// Book 3 "Decisions Become Actions" — small shared helpers. NOT a scene module
// (it lives in shared/ so the books/*/*.tsx scene glob skips it).
// Pure functions of their props: no clocks, no randomness.
import { MONO } from '../../next-useful-action/shared/profile-page';

export const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
/** Triangular weight: 1 at p === k, 0 one unit away. */
export const tri = (p: number, k: number): number => Math.max(0, 1 - Math.abs(p - k));

/** Estimated width of a mono chip; text widths are calculated, not measured. */
export const chipW = (text: string, size = 12.5): number => text.length * size * 0.62 + 22;

/** A one-line labelled chip. Colour is always paired with the text/glyph inside it. */
export function Chip({ x, y, text, color, fill = '#0b1324', u, size = 12.5, dashed }: { x: number; y: number; text: string; color: string; fill?: string; u: number; size?: number; dashed?: boolean }) {
  const o = clamp01(u);
  if (o <= 0.002) return null;
  const h = size + 12;
  return (
    <g transform={`translate(${x} ${y + (1 - o) * 5})`} opacity={o}>
      <rect width={chipW(text, size)} height={h} rx={6} fill={fill} stroke={color} strokeWidth={1.3} strokeDasharray={dashed ? '5 4' : undefined} />
      <text x={11} y={h / 2 + size * 0.36} fill={color} fontSize={size} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

/** Corner brackets around a rectangle — "chosen, still to be checked". */
export function corners(x: number, y: number, w: number, h: number, l = 13): string {
  return (
    `M${x} ${y + l}V${y}H${x + l}M${x + w - l} ${y}H${x + w}V${y + l}` +
    `M${x + w} ${y + h - l}V${y + h}H${x + w - l}M${x + l} ${y + h}H${x}V${y + h - l}`
  );
}
