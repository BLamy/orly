// The five-station progress ring — the book's throughline object. Chapter 1
// plants it, chapters 2–4 light one more station each, and chapter 5's
// centerpiece is the full ring closed into an ouroboros. Not a scene module:
// nothing here is registered in a manifest, it's shared vocabulary for the
// chapter files in this directory.
import { colors } from '../../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

export const RING = { cx: 640, cy: 320, r: 200 } as const;
export const STATIONS = ['issue', 'scenes', 'voice', 'verify', 'publish'];
export const stationAngle = (i: number) => -Math.PI / 2 + (i / STATIONS.length) * Math.PI * 2;

export function ProgressRing({ ringU, lit, litU }: { ringU: number; lit: number; litU: number }) {
  const rv = clamp01(ringU);
  if (rv <= 0) return null;
  return (
    <g>
      <g transform={`rotate(-90 ${RING.cx} ${RING.cy})`}>
        <circle
          cx={RING.cx}
          cy={RING.cy}
          r={RING.r}
          fill="none"
          stroke={colors.GRID}
          strokeWidth={2}
          pathLength={1}
          strokeDasharray={`${rv} 1`}
        />
      </g>
      {STATIONS.map((label, i) => {
        const su = clamp01(rv * (STATIONS.length + 2) - (i + 2));
        if (su <= 0) return null;
        const a = stationAngle(i);
        const sx = RING.cx + RING.r * Math.cos(a);
        const sy = RING.cy + RING.r * Math.sin(a);
        const lx = RING.cx + (RING.r + 34) * Math.cos(a);
        const ly = RING.cy + (RING.r + 34) * Math.sin(a);
        const isLit = i < lit ? clamp01(litU) : 0;
        return (
          <g key={label} opacity={su}>
            {isLit > 0 && <circle cx={sx} cy={sy} r={16} fill={colors.ACCENT} opacity={0.25 * isLit} />}
            <circle cx={sx} cy={sy} r={7} fill={colors.BG} stroke={isLit > 0.3 ? colors.ACCENT : colors.GRID} strokeWidth={2} />
            <text
              x={lx}
              y={ly + 5}
              textAnchor="middle"
              fill={isLit > 0.3 ? colors.TEXT : colors.MUTED}
              fontSize={15}
              fontFamily={MONO}
              fontWeight={isLit > 0.3 ? 700 : 400}
            >
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
}
