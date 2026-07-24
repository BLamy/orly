import { useMemo } from 'react';
import type { ScaleLinear } from 'd3';
import { line as d3line, area as d3area, curveLinear } from 'd3';
import { ACCENT } from '../core/colors';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/**
 * An animated function plot. Curves are always sampled at a fixed count so
 * morphing between any two functions is a structure-stable pointwise lerp
 * (the 3b1b trick — no path-topology library needed).
 */
export function FunctionPlot({
  x,
  y,
  f,
  domain,
  samples = 200,
  reveal = 1,
  morph,
  area,
  color = ACCENT,
  width = 3,
  dash = false,
  opacity = 1,
}: {
  x: ScaleLinear<number, number>;
  y: ScaleLinear<number, number>;
  f: (x: number) => number;
  domain?: [number, number];
  samples?: number;
  /** 0..1 draw-on progress (left → right) */
  reveal?: number;
  /** pointwise lerp from another curve: u=0 → from, u=1 → f */
  morph?: { from: (x: number) => number; u: number };
  /** filled region under the curve; sweep 0..1 reveals it left → right */
  area?: { baseline?: number; sweep?: number; opacity?: number };
  color?: string;
  width?: number;
  dash?: boolean;
  opacity?: number;
}) {
  const [d0, d1] = domain ?? (x.domain() as [number, number]);

  const pts = useMemo(() => {
    const out: Array<[number, number]> = [];
    for (let i = 0; i <= samples; i++) {
      const xv = d0 + ((d1 - d0) * i) / samples;
      let yv = f(xv);
      if (morph) yv = morph.from(xv) + (yv - morph.from(xv)) * clamp01(morph.u);
      out.push([x(xv), y(yv)]);
    }
    return out;
  }, [x, y, f, d0, d1, samples, morph?.from, morph?.u]);

  // polyline length computed analytically — no DOM measurement, scrub-safe
  const totalLen = useMemo(() => {
    let len = 0;
    for (let i = 1; i < pts.length; i++)
      len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return len;
  }, [pts]);

  const pathD = useMemo(
    () => d3line().curve(curveLinear)(pts) ?? '',
    [pts],
  );

  const areaD = useMemo(() => {
    if (!area) return '';
    const sweep = clamp01(area.sweep ?? 1);
    const n = Math.max(1, Math.round(pts.length * sweep));
    const base = y(area.baseline ?? 0);
    return (
      d3area<[number, number]>()
        .x((p) => p[0])
        .y0(() => base)
        .y1((p) => p[1])(pts.slice(0, n)) ?? ''
    );
  }, [area?.sweep, area?.baseline, pts, y]);

  if (opacity <= 0) return null;

  return (
    <g opacity={opacity}>
      {area && (area.sweep ?? 1) > 0 && (
        <path d={areaD} fill={color} opacity={area.opacity ?? 0.18} />
      )}
      {reveal > 0 && (
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={width}
          strokeLinecap="round"
          strokeDasharray={dash ? '8 8' : totalLen}
          strokeDashoffset={dash ? 0 : totalLen * (1 - clamp01(reveal))}
          opacity={dash ? clamp01(reveal) : 1}
        />
      )}
    </g>
  );
}
