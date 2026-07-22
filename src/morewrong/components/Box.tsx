import type { ReactNode } from 'react';
import { colors } from '../../viz/core';
import { METER_MAX } from '../data';

// The thematic anchor: the containment boundary ("the box"). Its wall gets
// visibly thinner and more porous as controlGap rises — the whole series is
// one long answer to the refrain rendered along its base.
const REFRAIN = 'Where is the boundary now, and who can still cross it?';

export interface BoxProps {
  controlGap: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  children?: ReactNode;
  /** hide the refrain for a beat that owns the whole stage (e.g. endings) */
  refrain?: boolean;
  label?: string;
}

/** wall opacity: solid at the starting gap (8), a whisper near the ceiling. */
export function wallOpacity(gap: number): number {
  const u = (gap - 8) / (METER_MAX - 8); // 0 at start → 1 at ceiling
  return Math.max(0.14, 1 - 0.86 * Math.max(0, Math.min(1, u)));
}

export function Box({
  controlGap,
  x = 340,
  y = 150,
  w = 600,
  h = 380,
  children,
  refrain = true,
  label,
}: BoxProps) {
  const op = wallOpacity(controlGap);
  const porosity = 1 - op; // more gaps as the wall thins
  const dash = porosity < 0.05 ? undefined : `${Math.max(6, 40 * (1 - porosity))} ${2 + 26 * porosity}`;
  const stroke = controlGap > 70 ? colors.NEGATIVE : controlGap > 40 ? colors.WARM : colors.ACCENT;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeOpacity={op}
        strokeDasharray={dash}
      />
      {label && (
        <text x={x + 14} y={y - 12} fill={colors.MUTED} fontSize={13} fontFamily="ui-monospace, monospace" opacity={0.8}>
          {label}
        </text>
      )}
      {children}
      {refrain && (
        <text
          x={x + w / 2}
          y={y + h + 30}
          textAnchor="middle"
          fill={colors.MUTED}
          fontSize={14}
          fontStyle="italic"
          opacity={0.5}
        >
          {REFRAIN}
        </text>
      )}
    </g>
  );
}
