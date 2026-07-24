import type { ScaleLinear } from 'd3';
import { MUTED, TEXT } from '../core/colors';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** A horizontal number line at stage-y with draw-on + staggered ticks. */
export function NumberLine({
  scale,
  y,
  reveal = 1,
  ticks = 10,
  tickFormat,
  color = MUTED,
  opacity = 1,
  fontSize = 15,
  label,
}: {
  scale: ScaleLinear<number, number>;
  y: number;
  reveal?: number;
  ticks?: number;
  tickFormat?: (v: number) => string;
  color?: string;
  opacity?: number;
  fontSize?: number;
  label?: string;
}) {
  if (opacity <= 0 || reveal <= 0) return null;
  const [d0, d1] = scale.domain();
  const [r0, r1] = [scale(d0), scale(d1)];
  const tv = scale.ticks(ticks);
  const fmt = tickFormat ?? scale.tickFormat(ticks);
  const tickU = (i: number) => clamp01(reveal * (tv.length + 2) - i - 1);

  return (
    <g opacity={opacity}>
      <line x1={r0} y1={y} x2={r0 + (r1 - r0) * clamp01(reveal * 1.3)} y2={y} stroke={color} strokeWidth={2} />
      {tv.map((v, i) => (
        <g key={v} opacity={tickU(i)}>
          <line x1={scale(v)} y1={y - 5} x2={scale(v)} y2={y + 5} stroke={color} strokeWidth={1.5} />
          <text x={scale(v)} y={y + 24} textAnchor="middle" fill={color} fontSize={fontSize}>
            {fmt(v)}
          </text>
        </g>
      ))}
      {label && (
        <text x={r1 + 12} y={y + fontSize / 3} fill={color} fontSize={fontSize + 1} opacity={clamp01(reveal * 2 - 1)}>
          {label}
        </text>
      )}
    </g>
  );
}

/** A curly brace spanning [x0, x1] at stage-y, with an optional label. */
export function Brace({
  x0,
  x1,
  y,
  below = true,
  depth = 14,
  u = 1,
  color = TEXT,
  label,
  fontSize = 16,
  opacity = 1,
}: {
  x0: number;
  x1: number;
  y: number;
  below?: boolean;
  depth?: number;
  /** 0..1 — the brace grows outward from its center */
  u?: number;
  color?: string;
  label?: string;
  fontSize?: number;
  opacity?: number;
}) {
  const uu = clamp01(u);
  if (opacity <= 0 || uu <= 0) return null;
  const cx = (x0 + x1) / 2;
  const half = ((x1 - x0) / 2) * uu;
  const s = below ? 1 : -1;
  const d = depth * s;
  const a = cx - half;
  const b = cx + half;
  const path = [
    `M ${a} ${y}`,
    `C ${a} ${y + d * 0.6}, ${a + 6} ${y + d * 0.8}, ${a + 10} ${y + d * 0.8}`,
    `L ${cx - 10} ${y + d * 0.8}`,
    `C ${cx - 4} ${y + d * 0.8}, ${cx} ${y + d}, ${cx} ${y + d * 1.3}`,
    `C ${cx} ${y + d}, ${cx + 4} ${y + d * 0.8}, ${cx + 10} ${y + d * 0.8}`,
    `L ${b - 10} ${y + d * 0.8}`,
    `C ${b - 6} ${y + d * 0.8}, ${b} ${y + d * 0.6}, ${b} ${y}`,
  ].join(' ');
  return (
    <g opacity={opacity * uu}>
      <path d={path} fill="none" stroke={color} strokeWidth={2} />
      {label && (
        <text
          x={cx}
          y={y + d * 1.3 + (below ? fontSize + 4 : -8)}
          textAnchor="middle"
          fill={color}
          fontSize={fontSize}
        >
          {label}
        </text>
      )}
    </g>
  );
}
