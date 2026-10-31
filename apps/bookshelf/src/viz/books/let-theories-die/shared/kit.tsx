// Let Theories Die — shared scene kit. Small, pure render helpers and the caption clock used by all five
// chapters. Lives in shared/ so the books/*/*.tsx glob never registers it as a scene.
import { colors } from '../../../core';
import type { Timeline } from '../../../core';

export const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
/** progress of a sub-window [a, b] inside a 0..1 (or any) channel value */
export const win = (u: number, a: number, b: number): number => clamp01((u - a) / (b - a));
export const smooth = (u: number): number => u * u * (3 - 2 * u);

/** Book accent (the cover colour) and a few roles shared across chapters. */
export const ACCENT = '#c2410c';
export const GOAL = colors.POSITIVE; // the real goal (breathing, a faster program)
export const SCORE = colors.WARM; // the proxy / the score
export const DEAD = '#64748b';

/**
 * The caption clock: spoken-line pace max(5.4, words × 0.4 + 1.1) s and a 0.7 s gap, as the Already Clean
 * chapters use. Each caption holds until the next one starts, so the CC pill never blinks off between lines.
 */
export function captionClock(caps: string[], start = 0.5, gap = 0.7) {
  const DUR = caps.map((c) => Math.max(5.4, c.trim().split(/\s+/).length * 0.4 + 1.1));
  const T: number[] = [];
  let t = start;
  for (const d of DUR) {
    T.push(t);
    t += d + gap;
  }
  const END = T[T.length - 1] + DUR[DUR.length - 1] + 0.6;
  return { T, DUR, END };
}

export function addCaptions(tl: Timeline, caps: string[], T: number[], DUR: number[]) {
  caps.forEach((text, i) => tl.caption({ at: T[i], dur: i < caps.length - 1 ? T[i + 1] - T[i] : DUR[i], text }));
}

export function Txt({
  x,
  y,
  text,
  size = 20,
  color = colors.TEXT,
  u = 1,
  anchor = 'start',
  weight,
  italic,
  mono,
}: {
  x: number;
  y: number;
  text: string;
  size?: number;
  color?: string;
  u?: number;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  italic?: boolean;
  mono?: boolean;
}) {
  if (u <= 0.005) return null;
  return (
    <text
      x={x}
      y={y + (1 - u) * 6}
      fontSize={size}
      fill={color}
      opacity={u}
      textAnchor={anchor}
      fontWeight={weight}
      fontStyle={italic ? 'italic' : undefined}
      fontFamily={mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : undefined}
    >
      {text}
    </text>
  );
}

export function Panel({ x, y, w, h, u = 1, stroke = colors.GRID, r = 12, opaque }: { x: number; y: number; w: number; h: number; u?: number; stroke?: string; r?: number; opaque?: boolean }) {
  if (u <= 0.005) return null;
  return (
    <g opacity={u}>
      {opaque && <rect x={x} y={y} width={w} height={h} rx={r} fill={colors.BG} />}
      <rect x={x} y={y} width={w} height={h} rx={r} fill={colors.PANEL} stroke={stroke} strokeWidth={1.5} />
    </g>
  );
}

/** A horizontal gauge: label left, track, filled to `value` (0..1). */
export function Meter({ x, y, w, label, value, color, u = 1, note }: { x: number; y: number; w: number; label: string; value: number; color: string; u?: number; note?: string }) {
  if (u <= 0.005) return null;
  return (
    <g opacity={u}>
      <text x={x} y={y - 10} fontSize={17} fill={colors.TEXT}>
        {label}
      </text>
      {note && (
        <text x={x + w} y={y - 10} fontSize={15} fill={colors.MUTED} textAnchor="end" fontStyle="italic">
          {note}
        </text>
      )}
      <rect x={x} y={y} width={w} height={14} rx={7} fill={colors.GRID} opacity={0.6} />
      <rect x={x} y={y} width={Math.max(0, w * clamp01(value))} height={14} rx={7} fill={color} />
    </g>
  );
}

/** Screen-space status chip, top left: one per phase, cross-faded by a float index channel. */
export function Chips({ texts, k, inU }: { texts: string[]; k: number; inU: number }) {
  return (
    <>
      {texts.map((text, i) => {
        const u = inU * clamp01(1 - Math.abs(k - i) * 2);
        if (u <= 0.01) return null;
        const w = text.length * 8.6 + 30;
        return (
          <g key={i} opacity={u}>
            <rect x={36} y={26} width={w} height={38} rx={9} fill={colors.PANEL} stroke={ACCENT} strokeOpacity={0.7} strokeWidth={1.4} />
            <text x={51} y={51} fontSize={17} fill={colors.TEXT}>
              {text}
            </text>
          </g>
        );
      })}
    </>
  );
}

/** The closing line on an opaque panel, in screen space above the CC strip. */
export function Closing({ text, u, sub }: { text: string; u: number; sub?: string }) {
  if (u <= 0.01) return null;
  const h = sub ? 92 : 64;
  return (
    <g opacity={u}>
      <rect x={210} y={600 - h} width={860} height={h} rx={14} fill={colors.BG} />
      <rect x={210} y={600 - h} width={860} height={h} rx={14} fill={colors.PANEL} stroke={ACCENT} strokeWidth={1.6} />
      <text x={640} y={600 - h + 41} textAnchor="middle" fontSize={26} fontWeight={650} fill={colors.TEXT}>
        {text}
      </text>
      {sub && (
        <text x={640} y={600 - h + 74} textAnchor="middle" fontSize={18} fill={colors.MUTED} fontStyle="italic">
          {sub}
        </text>
      )}
    </g>
  );
}

/** A full-stage veil: fades everything under it to a whisper before a closing beat. */
export function Veil({ u, to = 0.86 }: { u: number; to?: number }) {
  if (u <= 0.005) return null;
  return <rect x={-2000} y={-2000} width={6000} height={6000} fill={colors.BG} opacity={u * to} />;
}
