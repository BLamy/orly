import { colors } from '../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

export type EventKind = 'lifecycle' | 'message' | 'thinking' | 'tool' | 'queue' | 'error';

/** Event family → color (tau's provider-neutral event stream vocabulary). */
export const EVENT_COLOR: Record<EventKind, string> = {
  lifecycle: colors.SECONDARY, // AgentStart / AgentEnd
  message: colors.ACCENT, // MessageStart / Delta / End
  thinking: colors.MUTED, // ThinkingDelta
  tool: colors.WARM, // ToolExecutionStart / Update / End
  queue: colors.TEAL, // QueueUpdate
  error: colors.NEGATIVE, // ErrorEvent
};

export interface LaneEvent {
  label: string;
  kind: EventKind;
  /** departure time in `u` units — chip position = (u - at) / travel */
  at: number;
}

const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/**
 * The event stream made visible: chips travel down a lane from the emitter
 * (the agent loop) to the consumer (a frontend). One monotonically-tweened
 * `u` channel drives every chip — each departs at its `at` and takes
 * `travel` u-units to arrive, so ordering and rhythm are authored data.
 * "Frontends render from these events — never from raw provider chunks."
 */
export function EventLane({
  x1,
  y1,
  x2,
  y2,
  u,
  events,
  travel = 0.3,
  reveal = 1,
  fromLabel,
  toLabel,
  dim = 0,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** advancing clock for the whole lane (tween linearly) */
  u: number;
  events: LaneEvent[];
  /** journey length per chip, in u units */
  travel?: number;
  /** 0..1 draws the lane */
  reveal?: number;
  fromLabel?: string;
  toLabel?: string;
  dim?: number;
}) {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const alpha = 1 - 0.6 * clamp01(dim);
  const dx = x2 - x1;
  const dy = y2 - y1;

  return (
    <g opacity={alpha}>
      <line
        x1={x1}
        y1={y1}
        x2={x1 + dx * rv}
        y2={y1 + dy * rv}
        stroke={colors.GRID}
        strokeWidth={2}
        strokeDasharray="1 7"
        strokeLinecap="round"
      />
      {fromLabel && (
        <text x={x1} y={y1 - 14} textAnchor="middle" fill={colors.MUTED} fontSize={12} opacity={rv}>
          {fromLabel}
        </text>
      )}
      {toLabel && (
        <text x={x2} y={y2 - 14} textAnchor="middle" fill={colors.MUTED} fontSize={12} opacity={rv}>
          {toLabel}
        </text>
      )}
      {events.map((ev, i) => {
        const p = clamp01((u - ev.at) / travel);
        if (p <= 0 || p >= 1) return null;
        const px = x1 + dx * p;
        const py = y1 + dy * p;
        const fade = Math.min(1, p / 0.08, (1 - p) / 0.08);
        const color = EVENT_COLOR[ev.kind];
        const w = ev.label.length * 6.8 + 14;
        return (
          <g key={i} transform={`translate(${px}, ${py})`} opacity={fade}>
            <rect x={-w / 2} y={-11} width={w} height={22} rx={11} fill={colors.PANEL} stroke={color} strokeWidth={1.5} />
            <text y={4} textAnchor="middle" fill={color} fontSize={11.5} fontFamily={mono}>
              {ev.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
