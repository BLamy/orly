import { PANEL, TEXT, MUTED, ACCENT, SECONDARY, POSITIVE, WARM, NEGATIVE, TEAL } from '../core/colors';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

export type ServiceKind =
  | 'client'
  | 'browser'
  | 'mobile'
  | 'server'
  | 'gateway'
  | 'lb'
  | 'fn'
  | 'db'
  | 'cache'
  | 'queue'
  | 'storage'
  | 'search'
  | 'cdn'
  | 'external';

export const SERVICE_COLOR: Record<ServiceKind, string> = {
  client: ACCENT,
  browser: ACCENT,
  mobile: ACCENT,
  server: POSITIVE,
  gateway: TEAL,
  lb: SECONDARY,
  fn: TEAL,
  db: WARM,
  cache: '#f472b6',
  queue: '#fb923c',
  storage: WARM,
  search: SECONDARY,
  cdn: '#22d3ee',
  external: MUTED,
};

/** Tiny stroke glyphs, 16×16 box, drawn at the node's left edge. */
function Glyph({ kind, color }: { kind: ServiceKind; color: string }) {
  const p = { stroke: color, strokeWidth: 1.6, fill: 'none' as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (kind) {
    case 'client':
    case 'browser':
      return (
        <g {...p}>
          <rect x={1.5} y={2.5} width={13} height={10} rx={1.5} />
          <path d="M1.5 5.5h13" />
        </g>
      );
    case 'mobile':
      return (
        <g {...p}>
          <rect x={4.5} y={1.5} width={7} height={13} rx={1.5} />
          <path d="M7 12.5h2" />
        </g>
      );
    case 'server':
      return (
        <g {...p}>
          <rect x={2.5} y={2} width={11} height={5} rx={1.2} />
          <rect x={2.5} y={9} width={11} height={5} rx={1.2} />
          <path d="M5 4.5h.01M5 11.5h.01" strokeWidth={2} />
        </g>
      );
    case 'gateway':
      return (
        <g {...p}>
          <path d="M3 8h10M9.5 4.5 13 8l-3.5 3.5M6.5 4.5 3 8l3.5 3.5" />
        </g>
      );
    case 'lb':
      return (
        <g {...p}>
          <circle cx={8} cy={3.5} r={2} />
          <path d="M8 5.5v3M8 8.5 3.5 12M8 8.5 12.5 12M8 8.5v4" />
        </g>
      );
    case 'fn':
      return (
        <g {...p}>
          <path d="M4 13.5 8 2.5l1.6 4.2M6.4 9h5" />
        </g>
      );
    case 'db':
      return (
        <g {...p}>
          <ellipse cx={8} cy={3.6} rx={5.5} ry={2.1} />
          <path d="M2.5 3.6v8.8c0 1.15 2.46 2.1 5.5 2.1s5.5-.95 5.5-2.1V3.6M2.5 8c0 1.15 2.46 2.1 5.5 2.1S13.5 9.15 13.5 8" />
        </g>
      );
    case 'cache':
      return (
        <g {...p}>
          <path d="M9.5 1.5 4 9h3.5L6.5 14.5 12 7H8.5Z" />
        </g>
      );
    case 'queue':
      return (
        <g {...p}>
          <path d="M2.5 4.5h11M2.5 8h8M2.5 11.5h5" />
          <path d="M12 10l2 1.5-2 1.5" />
        </g>
      );
    case 'storage':
      return (
        <g {...p}>
          <path d="M2.5 5.5 4 13h8l1.5-7.5" />
          <ellipse cx={8} cy={4.5} rx={5.5} ry={1.9} />
        </g>
      );
    case 'search':
      return (
        <g {...p}>
          <circle cx={7} cy={7} r={4.2} />
          <path d="M10.2 10.2 14 14" />
        </g>
      );
    case 'cdn':
      return (
        <g {...p}>
          <circle cx={8} cy={8} r={5.8} />
          <path d="M2.2 8h11.6M8 2.2c2 1.9 2 9.7 0 11.6M8 2.2c-2 1.9-2 9.7 0 11.6" />
        </g>
      );
    case 'external':
      return (
        <g {...p} strokeDasharray="2.5 2.5">
          <path d="M4.5 11.5a3 3 0 0 1 .3-6 4 4 0 0 1 7.7 1 2.5 2.5 0 0 1-.7 5Z" />
        </g>
      );
  }
}

/**
 * A typed architecture node — the workhorse of infra diagrams. Kind gives
 * it a color + glyph (database cylinder, cache bolt, queue lanes, λ, CDN
 * globe, dashed external cloud…). `replicas` shows an ×N chip (auto-scaling
 * stories), `status` tints the border (ok/warn/down), `glow` pulses focus.
 */
export function ServiceNode({
  x,
  y,
  kind,
  label,
  sublabel,
  w = 168,
  h = 56,
  u = 1,
  glow = 0,
  dim = 0,
  replicas,
  status,
  labelSize = 15,
}: {
  /** center, stage coordinates */
  x: number;
  y: number;
  kind: ServiceKind;
  label: string;
  sublabel?: string;
  w?: number;
  h?: number;
  u?: number;
  glow?: number;
  dim?: number;
  /** shows an ×N chip at the top-right corner */
  replicas?: number;
  status?: 'ok' | 'warn' | 'down';
  labelSize?: number;
}) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const color = SERVICE_COLOR[kind];
  const border = status === 'down' ? NEGATIVE : status === 'warn' ? WARM : color;
  const s = 0.84 + 0.16 * uu;
  const alpha = uu * (1 - 0.62 * clamp01(dim));
  const textX = -w / 2 + 46;

  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`} opacity={alpha}>
      {glow > 0 && (
        <rect
          x={-w / 2 - 6}
          y={-h / 2 - 6}
          width={w + 12}
          height={h + 12}
          rx={14}
          fill="none"
          stroke={border}
          strokeWidth={2}
          opacity={0.55 * clamp01(glow)}
        />
      )}
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={11}
        fill={PANEL}
        stroke={border}
        strokeWidth={1.8}
        strokeDasharray={kind === 'external' ? '6 5' : undefined}
      />
      <g transform={`translate(${-w / 2 + 14}, ${-8})`}>
        <Glyph kind={kind} color={color} />
      </g>
      <text x={textX} y={sublabel ? -2 : labelSize / 3} textAnchor="start" fill={TEXT} fontSize={labelSize} fontWeight={600}>
        {label}
      </text>
      {sublabel && (
        <text x={textX} y={labelSize} textAnchor="start" fill={MUTED} fontSize={labelSize - 4}>
          {sublabel}
        </text>
      )}
      {replicas !== undefined && replicas > 1 && (
        <g transform={`translate(${w / 2 - 4}, ${-h / 2 + 4})`}>
          <rect x={-26} y={-10} width={30} height={17} rx={8} fill={PANEL} stroke={color} strokeWidth={1.2} />
          <text x={-11} y={3} textAnchor="middle" fill={color} fontSize={11} fontWeight={700}>
            ×{replicas}
          </text>
        </g>
      )}
    </g>
  );
}
