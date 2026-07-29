import { useMemo } from 'react';
import type { ScaleLinear } from 'd3';
import { contours as d3contours, geoPath, geoTransform, extent } from 'd3';
import { ACCENT } from '../core/colors';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/**
 * Iso-contours of a scalar field f(x, y) — the loss-landscape renderer.
 * The grid and paths are computed once (they're static); only reveal and
 * opacity animate. Contours stagger in from the outermost level inward.
 */
export function ContourField({
  f,
  x,
  y,
  thresholds = 14,
  gridN = 90,
  reveal = 1,
  color = ACCENT,
  width = 1.6,
  opacity = 1,
  // bands stack (outer contours cover the whole domain), so keep fills faint
  fillOpacity = 0.02,
}: {
  f: (x: number, y: number) => number;
  x: ScaleLinear<number, number>;
  y: ScaleLinear<number, number>;
  thresholds?: number;
  gridN?: number;
  reveal?: number;
  color?: string | ((level: number, i: number) => string);
  width?: number;
  opacity?: number;
  fillOpacity?: number;
}) {
  const shapes = useMemo(() => {
    const [xd0, xd1] = x.domain();
    const [yd0, yd1] = y.domain();
    const values = new Float64Array(gridN * gridN);
    for (let j = 0; j < gridN; j++) {
      for (let i = 0; i < gridN; i++) {
        const xv = xd0 + ((xd1 - xd0) * i) / (gridN - 1);
        const yv = yd0 + ((yd1 - yd0) * j) / (gridN - 1);
        values[j * gridN + i] = f(xv, yv);
      }
    }
    const [lo, hi] = extent(values) as [number, number];
    const levels = Array.from(
      { length: thresholds },
      (_, k) => lo + ((hi - lo) * (k + 1)) / (thresholds + 1),
    );
    const gen = d3contours().size([gridN, gridN]).thresholds(levels);
    // grid index space → stage space
    const transform = geoTransform({
      point(gx, gy) {
        this.stream.point(
          x(xd0 + ((xd1 - xd0) * gx) / (gridN - 1)),
          y(yd0 + ((yd1 - yd0) * gy) / (gridN - 1)),
        );
      },
    });
    const path = geoPath(transform);
    return gen(Array.from(values)).map((c, i) => ({ d: path(c) ?? '', value: c.value, i }));
  }, [f, x, y, thresholds, gridN]);

  if (opacity <= 0 || reveal <= 0) return null;

  const n = shapes.length;
  return (
    <g opacity={opacity}>
      {shapes.map((s) => {
        const u = clamp01(reveal * (n + 2) - s.i - 1);
        if (u <= 0) return null;
        const stroke = typeof color === 'function' ? color(s.value, s.i) : color;
        return (
          <path
            key={s.i}
            d={s.d}
            fill={stroke}
            fillOpacity={fillOpacity * u}
            stroke={stroke}
            strokeWidth={width}
            strokeOpacity={0.85 * u}
          />
        );
      })}
    </g>
  );
}
