import { colors } from '../core';
import type { ReactNode } from 'react';

export const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
export const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export function ResearchTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <g>
      <text x={64} y={54} fill={colors.MUTED} fontSize={12} fontFamily={mono} letterSpacing={2}>
        {kicker.toUpperCase()}
      </text>
      <text x={64} y={88} fill={colors.TEXT} fontSize={28} fontWeight={760}>
        {title}
      </text>
    </g>
  );
}

export function Panel({
  x,
  y,
  w,
  h,
  opacity = 1,
  accent = colors.GRID,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
  accent?: string;
  children?: ReactNode;
}) {
  if (opacity <= 0) return null;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={16} fill={colors.PANEL} stroke={accent} strokeWidth={1.4} />
      {children}
    </g>
  );
}

export function Chip({
  x,
  y,
  text,
  opacity = 1,
  color = colors.ACCENT,
  width,
}: {
  x: number;
  y: number;
  text: string;
  opacity?: number;
  color?: string;
  width?: number;
}) {
  if (opacity <= 0) return null;
  const w = width ?? Math.max(54, text.length * 7.2 + 24);
  return (
    <g transform={`translate(${x},${y})`} opacity={opacity}>
      <rect x={-w / 2} y={-15} width={w} height={30} rx={15} fill={color} fillOpacity={0.13} stroke={color} />
      <text textAnchor="middle" y={4} fill={color} fontSize={12} fontWeight={700} fontFamily={mono}>
        {text}
      </text>
    </g>
  );
}

export function Arrow({
  x1,
  y1,
  x2,
  y2,
  reveal = 1,
  color = colors.MUTED,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  reveal?: number;
  color?: string;
}) {
  const u = clamp01(reveal);
  const x = x1 + (x2 - x1) * u;
  const y = y1 + (y2 - y1) * u;
  const a = Math.atan2(y2 - y1, x2 - x1);
  return (
    <g opacity={u}>
      <line x1={x1} y1={y1} x2={x} y2={y} stroke={color} strokeWidth={2} />
      <path
        d={`M ${x} ${y} l ${-10 * Math.cos(a - 0.55)} ${-10 * Math.sin(a - 0.55)} l ${10 * Math.cos(a + 0.55)} ${10 * Math.sin(a + 0.55)} Z`}
        fill={color}
      />
    </g>
  );
}

export function Meter({
  x,
  y,
  w,
  value,
  max,
  label,
  color = colors.ACCENT,
}: {
  x: number;
  y: number;
  w: number;
  value: number;
  max: number;
  label: string;
  color?: string;
}) {
  const u = clamp01(value / max);
  return (
    <g>
      <text x={x} y={y - 9} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
        {label}
      </text>
      <rect x={x} y={y} width={w} height={12} rx={6} fill={colors.GRID} opacity={0.5} />
      <rect x={x} y={y} width={w * u} height={12} rx={6} fill={color} />
    </g>
  );
}
