import { PANEL, TEXT, MUTED } from '../core/colors';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/**
 * A labeled system node — the viz-suite cousin of the engine's diagram
 * boxes (same rounded-rect + kind-color language), for distributed-systems
 * scenes. `u` is entrance progress; `glow` pulses emphasis.
 */
export function NodeBadge({
  x,
  y,
  w = 150,
  h = 62,
  label,
  sublabel,
  color,
  u = 1,
  glow = 0,
  dashed = false,
  dim = 0,
  labelSize = 17,
}: {
  /** center, stage coordinates */
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  sublabel?: string;
  color: string;
  u?: number;
  /** 0..1 emphasis halo */
  glow?: number;
  dashed?: boolean;
  /** 0..1 fades the node toward the background (e.g. partitioned away) */
  dim?: number;
  labelSize?: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const s = 0.82 + 0.18 * uu;
  const alpha = uu * (1 - 0.62 * clamp01(dim));

  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} opacity={alpha}>
      {glow > 0 && (
        <rect
          x={-w / 2 - 7}
          y={-h / 2 - 7}
          width={w + 14}
          height={h + 14}
          rx={16}
          fill="none"
          stroke={color}
          strokeWidth={2}
          opacity={0.55 * clamp01(glow)}
        />
      )}
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={12}
        fill={PANEL}
        stroke={color}
        strokeWidth={2}
        strokeDasharray={dashed ? '7 5' : undefined}
      />
      <text
        y={sublabel ? -3 : labelSize / 3}
        textAnchor="middle"
        fill={TEXT}
        fontSize={labelSize}
        fontWeight={600}
      >
        {label}
      </text>
      {sublabel && (
        <text y={labelSize} textAnchor="middle" fill={MUTED} fontSize={labelSize - 4}>
          {sublabel}
        </text>
      )}
    </g>
  );
}

/**
 * A circular countdown/progress arc (election timers, clocks). `u` is the
 * remaining fraction; the arc empties clockwise from 12 o'clock.
 */
export function TimerArc({
  cx,
  cy,
  r = 12,
  u,
  color,
  width = 3,
  opacity = 1,
}: {
  cx: number;
  cy: number;
  r?: number;
  u: number;
  color: string;
  width?: number;
  opacity?: number;
}) {
  const uu = clamp01(u);
  if (opacity <= 0) return null;
  if (uu >= 0.999) {
    return <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={width} opacity={opacity} />;
  }
  if (uu <= 0.001) return null;
  const a0 = -Math.PI / 2;
  const a1 = a0 + 2 * Math.PI * uu;
  const large = uu > 0.5 ? 1 : 0;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  return (
    <path
      d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      opacity={opacity}
    />
  );
}
