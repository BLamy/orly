import type { ScaleLinear } from 'd3';
import { GRID, MUTED } from '../core/colors';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/**
 * Coordinate axes + optional grid in stage space. `reveal` draws the axis
 * lines on and staggers ticks/grid in — a pure function of the value handed
 * in, like every primitive here.
 */
export function Axes({
  x,
  y,
  reveal = 1,
  grid = true,
  xTicks = 8,
  yTicks = 6,
  xLabel,
  yLabel,
  color = MUTED,
  opacity = 1,
  fontSize = 15,
}: {
  x: ScaleLinear<number, number>;
  y: ScaleLinear<number, number>;
  reveal?: number;
  grid?: boolean;
  xTicks?: number;
  yTicks?: number;
  xLabel?: string;
  yLabel?: string;
  color?: string;
  opacity?: number;
  fontSize?: number;
}) {
  if (opacity <= 0 || reveal <= 0) return null;

  const [xd0, xd1] = x.domain();
  const [yd0, yd1] = y.domain();
  const [xr0, xr1] = [x(xd0), x(xd1)];
  const [yr0, yr1] = [y(yd0), y(yd1)];

  // axes cross at the origin when it's in view, else hug the domain edge
  const axisY = yd0 <= 0 && 0 <= yd1 ? y(0) : yr0;
  const axisX = xd0 <= 0 && 0 <= xd1 ? x(0) : xr0;

  const xt = x.ticks(xTicks).filter((v) => v !== 0 || axisX !== x(0));
  const yt = y.ticks(yTicks).filter((v) => v !== 0 || axisY !== y(0));
  const xFmt = x.tickFormat(xTicks);
  const yFmt = y.tickFormat(yTicks);

  // ticks/grid stagger in behind the axis draw-on
  const tickU = (i: number, n: number) => clamp01(reveal * (n + 2) - i - 1);

  return (
    <g opacity={opacity}>
      {grid &&
        xt.map((v, i) => (
          <line
            key={`gx${v}`}
            x1={x(v)}
            y1={yr0}
            x2={x(v)}
            y2={yr1}
            stroke={GRID}
            strokeWidth={1}
            opacity={tickU(i, xt.length)}
          />
        ))}
      {grid &&
        yt.map((v, i) => (
          <line
            key={`gy${v}`}
            x1={xr0}
            y1={y(v)}
            x2={xr1}
            y2={y(v)}
            stroke={GRID}
            strokeWidth={1}
            opacity={tickU(i, yt.length)}
          />
        ))}
      <line
        x1={xr0}
        y1={axisY}
        x2={xr0 + (xr1 - xr0) * clamp01(reveal * 1.4)}
        y2={axisY}
        stroke={color}
        strokeWidth={2}
      />
      <line
        x1={axisX}
        y1={yr0}
        x2={axisX}
        y2={yr0 + (yr1 - yr0) * clamp01(reveal * 1.4)}
        stroke={color}
        strokeWidth={2}
      />
      {xt.map((v, i) => (
        <g key={`tx${v}`} opacity={tickU(i, xt.length)}>
          <line x1={x(v)} y1={axisY} x2={x(v)} y2={axisY + 6} stroke={color} strokeWidth={1.5} />
          <text x={x(v)} y={axisY + 22} textAnchor="middle" fill={color} fontSize={fontSize}>
            {xFmt(v)}
          </text>
        </g>
      ))}
      {yt.map((v, i) => (
        <g key={`ty${v}`} opacity={tickU(i, yt.length)}>
          <line x1={axisX - 6} y1={y(v)} x2={axisX} y2={y(v)} stroke={color} strokeWidth={1.5} />
          <text x={axisX - 11} y={y(v) + fontSize / 3} textAnchor="end" fill={color} fontSize={fontSize}>
            {yFmt(v)}
          </text>
        </g>
      ))}
      {xLabel && (
        <text x={xr1 - 4} y={axisY - 10} textAnchor="end" fill={color} fontSize={fontSize + 2} opacity={clamp01(reveal * 2 - 1)}>
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text x={axisX + 12} y={yr1 + 16} textAnchor="start" fill={color} fontSize={fontSize + 2} opacity={clamp01(reveal * 2 - 1)}>
          {yLabel}
        </text>
      )}
    </g>
  );
}
