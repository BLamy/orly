import { TEXT } from '../core/colors';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/**
 * A vector/arrow in stage coordinates (callers apply their own scales).
 * `grow` extends it from tail to tip; the head rides the tip and shrinks
 * as the shaft gets very short, so tiny vectors still read.
 */
export function Vec({
  x1,
  y1,
  x2,
  y2,
  grow = 1,
  color = TEXT,
  width = 3,
  head = 11,
  label,
  labelAt = 'tip',
  labelSize = 17,
  opacity = 1,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  grow?: number;
  color?: string;
  width?: number;
  head?: number;
  label?: string;
  labelAt?: 'tip' | 'mid';
  labelSize?: number;
  opacity?: number;
}) {
  const u = clamp01(grow);
  if (opacity <= 0 || u <= 0) return null;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) * u;
  if (len < 0.5) return null;
  const a = Math.atan2(dy, dx);
  const tipX = x1 + Math.cos(a) * len;
  const tipY = y1 + Math.sin(a) * len;
  const h = Math.min(head, len * 0.6);
  const baseX = tipX - Math.cos(a) * h;
  const baseY = tipY - Math.sin(a) * h;
  const px = -Math.sin(a);
  const py = Math.cos(a);

  const lx = labelAt === 'tip' ? tipX + Math.cos(a) * 14 + px * 6 : (x1 + tipX) / 2 + px * 16;
  const ly = labelAt === 'tip' ? tipY + Math.sin(a) * 14 + py * 6 : (y1 + tipY) / 2 + py * 16;

  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={baseX} y2={baseY} stroke={color} strokeWidth={width} strokeLinecap="round" />
      <polygon
        points={`${tipX},${tipY} ${baseX + px * h * 0.42},${baseY + py * h * 0.42} ${baseX - px * h * 0.42},${baseY - py * h * 0.42}`}
        fill={color}
      />
      {label && (
        <text x={lx} y={ly + labelSize / 3} textAnchor="middle" fill={color} fontSize={labelSize} fontStyle="italic">
          {label}
        </text>
      )}
    </g>
  );
}
