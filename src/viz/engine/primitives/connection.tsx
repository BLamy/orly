import { useMemo } from 'react';
import { MUTED, PANEL, TEXT } from '../core/colors';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

export interface Pt {
  x: number;
  y: number;
}

/** Build the point list: from → via… → to, with optional elbow routing. */
function routePoints(from: Pt, to: Pt, via: Pt[] | undefined, elbow: 'none' | 'h' | 'v'): Pt[] {
  if (via && via.length) return [from, ...via, to];
  if (elbow === 'h') return [from, { x: to.x, y: from.y }, to];
  if (elbow === 'v') return [from, { x: from.x, y: to.y }, to];
  return [from, to];
}

export function polylineLength(pts: Pt[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return len;
}

export function pointAlong(pts: Pt[], u: number): { x: number; y: number; angle: number } {
  const total = polylineLength(pts);
  let target = clamp01(u) * total;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (target <= seg || i === pts.length - 1) {
      const f = seg === 0 ? 0 : target / seg;
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * f,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * f,
        angle: Math.atan2(pts[i].y - pts[i - 1].y, pts[i].x - pts[i - 1].x),
      };
    }
    target -= seg;
  }
  const last = pts[pts.length - 1];
  return { x: last.x, y: last.y, angle: 0 };
}

/**
 * An architecture edge: client→server, server→db, service→queue. Supports
 * elbow routing or explicit waypoints, a draw-on reveal, a protocol label
 * chip, and an animated dash "traffic" flow — drive `flow` with a linearly
 * tweened channel and the dashes stream along the edge, scrub-safe.
 */
export function Connection({
  from,
  to,
  via,
  elbow = 'none',
  u = 1,
  flow = 0,
  label,
  color = MUTED,
  width = 1.8,
  dashed = false,
  arrow = true,
  dim = 0,
  labelSize = 12,
}: {
  from: Pt;
  to: Pt;
  via?: Pt[];
  /** 'h': horizontal-first elbow · 'v': vertical-first */
  elbow?: 'none' | 'h' | 'v';
  u?: number;
  /** animated traffic phase — tween linearly, dashes stream toward `to` */
  flow?: number;
  label?: string;
  color?: string;
  width?: number;
  dashed?: boolean;
  arrow?: boolean;
  dim?: number;
  labelSize?: number;
}) {
  const uu = clamp01(u);
  // key via by value, not identity — inline `via={[...]}` arrays are common
  const viaKey = via ? via.map((p) => `${p.x},${p.y}`).join(';') : '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pts = useMemo(() => routePoints(from, to, via, elbow), [from.x, from.y, to.x, to.y, viaKey, elbow]);
  const total = useMemo(() => polylineLength(pts), [pts]);
  if (uu <= 0 || total < 1) return null;

  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const alpha = 1 - 0.65 * clamp01(dim);
  const tip = pointAlong(pts, 1);
  const headU = 9;
  const mid = pointAlong(pts, 0.5);

  return (
    <g opacity={alpha}>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? '7 6' : total}
        strokeDashoffset={dashed ? 0 : total * (1 - uu)}
        opacity={dashed ? uu : 0.85}
      />
      {flow > 0 && uu >= 0.98 && (
        <path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={width + 1.4}
          strokeLinecap="round"
          strokeDasharray="3 15"
          strokeDashoffset={-flow * 36}
          opacity={0.9}
        />
      )}
      {arrow && uu >= 0.98 && (
        <polygon
          points={`0,0 ${-headU},${headU * 0.45} ${-headU},${-headU * 0.45}`}
          transform={`translate(${tip.x}, ${tip.y}) rotate(${(tip.angle * 180) / Math.PI})`}
          fill={color}
        />
      )}
      {label && uu >= 0.7 && (
        <g transform={`translate(${mid.x}, ${mid.y})`} opacity={clamp01(uu * 3 - 2)}>
          <rect
            x={-label.length * labelSize * 0.31 - 7}
            y={-labelSize * 0.85}
            width={label.length * labelSize * 0.62 + 14}
            height={labelSize * 1.7}
            rx={labelSize * 0.85}
            fill={PANEL}
            stroke={color}
            strokeWidth={0.8}
            opacity={0.92}
          />
          <text y={labelSize * 0.36} textAnchor="middle" fill={TEXT} fontSize={labelSize} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
            {label}
          </text>
        </g>
      )}
    </g>
  );
}
