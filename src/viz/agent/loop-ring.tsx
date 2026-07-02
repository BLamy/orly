import { colors } from '../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const TAU = Math.PI * 2;

/**
 * The agent loop as a ring: labeled stops around a circle (prompt → model →
 * events → tools → append…), an orbiting packet whose `u` is measured in
 * laps (fractional laps fine — u=1.5 is halfway round the second turn), and
 * a proximity glow on whichever stop the packet is passing. "Call a tool,
 * feed the result back, continue — until no more tool calls."
 */
export function LoopRing({
  cx,
  cy,
  r,
  stops,
  u = 0,
  reveal = 1,
  color = colors.ACCENT,
  dim = 0,
  labelSize = 14,
}: {
  cx: number;
  cy: number;
  r: number;
  stops: { label: string; color?: string }[];
  /** orbit progress in laps; the packet hides when u <= 0 */
  u?: number;
  /** 0..1 draws the ring clockwise from 12 o'clock, then staggers stops in */
  reveal?: number;
  /** orbiting packet color */
  color?: string;
  dim?: number;
  labelSize?: number;
}) {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const alpha = 1 - 0.6 * clamp01(dim);
  const n = stops.length;
  const frac = ((u % 1) + 1) % 1;
  const angle = (f: number) => -Math.PI / 2 + f * TAU;
  const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

  return (
    <g opacity={alpha}>
      {/* ring, drawn on via pathLength dash from 12 o'clock */}
      <g transform={`rotate(-90 ${cx} ${cy})`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={colors.GRID}
          strokeWidth={2}
          pathLength={1}
          strokeDasharray={`${rv} 1`}
        />
      </g>
      {/* direction hint */}
      {rv >= 0.999 && (
        <path
          d={`M ${cx + r - 6} ${cy - 10} l 6 10 l -10 4`}
          fill="none"
          stroke={colors.GRID}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0}
        />
      )}
      {/* stops */}
      {stops.map((stop, i) => {
        const su = clamp01(rv * (n + 2) - (i + 2));
        if (su <= 0) return null;
        const a = angle(i / n);
        const sx = cx + r * Math.cos(a);
        const sy = cy + r * Math.sin(a);
        const scolor = stop.color ?? colors.MUTED;
        // proximity glow from the orbiter
        const dRaw = Math.abs(frac - i / n);
        const d = Math.min(dRaw, 1 - dRaw);
        const glow = u > 0 ? clamp01(1 - d / (0.6 / n)) : 0;
        const lx = cx + (r + 26) * Math.cos(a);
        const ly = cy + (r + 26) * Math.sin(a);
        const anchor = Math.abs(Math.cos(a)) < 0.35 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
        return (
          <g key={i} opacity={su}>
            {glow > 0 && <circle cx={sx} cy={sy} r={13} fill={color} opacity={0.22 * glow} />}
            <circle cx={sx} cy={sy} r={6} fill={colors.BG} stroke={glow > 0.4 ? color : scolor} strokeWidth={2} />
            <text
              x={lx}
              y={ly + labelSize / 3}
              textAnchor={anchor}
              fill={glow > 0.4 ? colors.TEXT : colors.MUTED}
              fontSize={labelSize}
              fontFamily={mono}
              fontWeight={glow > 0.4 ? 700 : 400}
            >
              {stop.label}
            </text>
          </g>
        );
      })}
      {/* orbiting packet + comet trail */}
      {u > 0.001 && rv >= 0.999 && (
        <g>
          {[0.045, 0.03, 0.015, 0].map((back, i) => {
            const a = angle(((frac - back) % 1 + 1) % 1);
            const px = cx + r * Math.cos(a);
            const py = cy + r * Math.sin(a);
            const main = back === 0;
            return (
              <circle
                key={i}
                cx={px}
                cy={py}
                r={main ? 7 : 5 - i}
                fill={color}
                opacity={main ? 1 : 0.14 + i * 0.1}
              />
            );
          })}
        </g>
      )}
    </g>
  );
}
