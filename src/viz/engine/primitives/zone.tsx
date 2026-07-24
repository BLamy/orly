import { MUTED, TEXT, ACCENT } from '../core/colors';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

export type ZoneKind = 'provider' | 'region' | 'az' | 'vpc' | 'subnet' | 'group';

const ZONE_STYLE: Record<ZoneKind, { dash?: string; width: number; color: string; fill: string }> = {
  provider: { width: 2, color: MUTED, fill: 'rgba(148, 163, 184, 0.03)' },
  region: { width: 1.6, color: MUTED, fill: 'rgba(148, 163, 184, 0.025)' },
  az: { dash: '8 6', width: 1.4, color: MUTED, fill: 'rgba(148, 163, 184, 0.02)' },
  vpc: { width: 1.6, color: ACCENT, fill: 'rgba(56, 189, 248, 0.03)' },
  subnet: { dash: '2 5', width: 1.3, color: MUTED, fill: 'rgba(148, 163, 184, 0.02)' },
  group: { dash: '5 5', width: 1.3, color: MUTED, fill: 'none' },
};

/**
 * A labeled boundary container for architecture diagrams — cloud provider,
 * region, availability zone, VPC, subnet, or a plain grouping. Nest them by
 * drawing outer zones first; coordinates are plain stage coords (layout is
 * the scene's concern). `u` draws the border on and fades the label chip in.
 */
export function Zone({
  x,
  y,
  w,
  h,
  label,
  kind = 'group',
  u = 1,
  dim = 0,
  color,
  labelSize = 13,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
  kind?: ZoneKind;
  u?: number;
  /** 0..1 fades the zone (e.g. the un-focused half of a diagram) */
  dim?: number;
  color?: string;
  labelSize?: number;
  children?: React.ReactNode;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const s = ZONE_STYLE[kind];
  const stroke = color ?? s.color;
  const perimeter = 2 * (w + h);
  const alpha = 1 - 0.65 * clamp01(dim);

  return (
    <g opacity={alpha}>
      <rect x={x} y={y} width={w} height={h} rx={14} fill={s.fill} opacity={uu} />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={14}
        fill="none"
        stroke={stroke}
        strokeWidth={s.width}
        strokeDasharray={s.dash ?? perimeter}
        strokeDashoffset={s.dash ? 0 : perimeter * (1 - uu)}
        opacity={s.dash ? uu : 0.9}
      />
      {label && (
        <g opacity={clamp01(uu * 2 - 1)}>
          <text
            x={x + 14}
            y={y + labelSize + 8}
            fill={stroke === MUTED ? TEXT : stroke}
            fontSize={labelSize}
            fontWeight={600}
            letterSpacing="0.08em"
            opacity={0.8}
          >
            {label.toUpperCase()}
          </text>
        </g>
      )}
      {children}
    </g>
  );
}
