import { colors } from '../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

export interface ContextSegment {
  label: string;
  /** token count — sample it from a channel to animate growth/compaction */
  value: number;
  color: string;
}

const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/**
 * The context window as a budget bar: a fixed-capacity track that stacked
 * segments (system prompt, transcript, tool results…) fill left-to-right.
 * Segment `value`s are plain props — animate growth by tweening the
 * channels a scene samples them from, and animate *compaction* by tweening
 * old segments down while a "summary" segment grows. `warn` pulses the
 * track edge as the budget runs out.
 */
export function ContextBar({
  x,
  y,
  w,
  h = 26,
  capacity,
  segments,
  reveal = 1,
  warn = 0,
  title = 'context window',
  showValues = true,
  dim = 0,
}: {
  /** top-left, stage coordinates */
  x: number;
  y: number;
  w: number;
  h?: number;
  /** token capacity the full width represents */
  capacity: number;
  segments: ContextSegment[];
  /** 0..1 draws the track */
  reveal?: number;
  /** 0..1 over-budget pulse */
  warn?: number;
  title?: string;
  showValues?: boolean;
  dim?: number;
}) {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const alpha = rv * (1 - 0.6 * clamp01(dim));
  const total = segments.reduce((n, s) => n + Math.max(0, s.value), 0);
  const wn = clamp01(warn);

  let cursor = 0;
  const drawn = segments.map((seg, i) => {
    const segW = (Math.max(0, seg.value) / capacity) * w;
    const sx = cursor;
    cursor += segW;
    if (segW <= 0.5) return null;
    return (
      <g key={i}>
        <rect x={sx} width={Math.max(0, Math.min(segW, w - sx))} height={h} fill={seg.color} opacity={0.55} />
        {segW > 52 && (
          <text x={sx + 8} y={h / 2 + 4} fill={colors.TEXT} fontSize={11.5} fontFamily={mono}>
            {seg.label}
          </text>
        )}
      </g>
    );
  });

  return (
    <g transform={`translate(${x}, ${y})`} opacity={alpha}>
      <text y={-8} fill={colors.MUTED} fontSize={12}>
        {title}
      </text>
      {showValues && (
        <text x={w} y={-8} textAnchor="end" fill={total > capacity ? colors.NEGATIVE : colors.MUTED} fontSize={12} fontFamily={mono}>
          {Math.round(total).toLocaleString()} / {capacity.toLocaleString()} tokens
        </text>
      )}
      <rect
        width={w * rv}
        height={h}
        rx={6}
        fill={colors.PANEL}
        stroke={wn > 0.01 ? colors.NEGATIVE : colors.GRID}
        strokeWidth={wn > 0.01 ? 1.5 + wn : 1.5}
        strokeOpacity={wn > 0.01 ? 0.4 + 0.6 * wn : 1}
      />
      <g clipPath={undefined}>{drawn}</g>
      {/* quarter ticks */}
      {[0.25, 0.5, 0.75].map((q) => (
        <line key={q} x1={w * q} y1={0} x2={w * q} y2={h} stroke={colors.BG} strokeWidth={1} opacity={0.8} />
      ))}
    </g>
  );
}
