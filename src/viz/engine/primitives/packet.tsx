import { ACCENT } from '../core/colors';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/**
 * A message packet traveling between two points — the viz-suite cousin of
 * the engine's firePackets, but position is a pure function of `u`.
 * Fades in over the first 10% of travel and out over the last 10%.
 */
export function Packet({
  from,
  to,
  u,
  r = 7,
  color = ACCENT,
  label,
  labelSize = 14,
  opacity = 1,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** 0..1 travel progress; outside [0,1] renders nothing */
  u: number;
  r?: number;
  color?: string;
  label?: string;
  labelSize?: number;
  opacity?: number;
}) {
  if (u <= 0 || u >= 1 || opacity <= 0) return null;
  const x = from.x + (to.x - from.x) * u;
  const y = from.y + (to.y - from.y) * u;
  const fade = clamp01(Math.min(u / 0.1, (1 - u) / 0.1));
  return (
    <g opacity={opacity * fade}>
      <circle cx={x} cy={y} r={r * 2.2} fill={color} opacity={0.18} />
      <circle cx={x} cy={y} r={r} fill={color} />
      {label && (
        <text x={x} y={y - r - 7} textAnchor="middle" fill={color} fontSize={labelSize}>
          {label}
        </text>
      )}
    </g>
  );
}
