import { useMemo } from 'react';
import { ACCENT, POSITIVE } from '../core/colors';
import type { Pt } from './connection';
import { pointAlong } from './connection';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/**
 * A multi-hop request traveling client → lb → server → db and (optionally)
 * the response coming back. Drive `u` 0→1 with one linear tween: the packet
 * moves hop by hop with a small dwell at each waypoint (the "the server is
 * doing something" beat), then — with `roundTrip` — retraces the path in the
 * response color. Position is a pure function of `u`; sequencing several
 * RequestFlows tells a whole distributed story.
 */
export function RequestFlow({
  path,
  u,
  roundTrip = false,
  color = ACCENT,
  responseColor = POSITIVE,
  r = 7,
  label,
  responseLabel,
  dwell = 0.12,
  turnDwell = 0.08,
  hold = false,
  labelSize = 13,
  opacity = 1,
}: {
  /** waypoints in stage coords (usually node centers/edges) */
  path: Pt[];
  /** 0..1 (forward only) or 0..1 covering forward+return when roundTrip */
  u: number;
  roundTrip?: boolean;
  color?: string;
  responseColor?: string;
  r?: number;
  label?: string;
  responseLabel?: string;
  /** fraction of each leg's time spent paused at interior waypoints */
  dwell?: number;
  /** roundTrip only: pause at the far end before the response departs */
  turnDwell?: number;
  /** keep the packet visible at its destination once u reaches 1 */
  hold?: boolean;
  labelSize?: number;
  opacity?: number;
}) {
  const uu = clamp01(u);
  const reversed = useMemo(() => [...path].reverse(), [path]);
  if (opacity <= 0 || uu <= 0 || path.length < 2) return null;
  if (uu >= 1 && !hold) return null;

  // split into forward / turn-pause / return when roundTrip
  let leg = path;
  let legU = Math.min(uu, 1);
  let legColor = color;
  let legLabel = label;
  if (roundTrip) {
    const fwdEnd = 0.5 - turnDwell / 2;
    const backStart = 0.5 + turnDwell / 2;
    if (uu < fwdEnd) {
      legU = uu / fwdEnd;
    } else if (uu < backStart) {
      // dwelling at the far end — "the server is doing something"
      leg = reversed;
      legU = 0;
    } else {
      leg = reversed;
      legU = (uu - backStart) / (1 - backStart);
      legColor = responseColor;
      legLabel = responseLabel ?? label;
    }
    if (legU >= 1 && !hold) return null;
    legU = Math.min(legU, 1);
  }

  // remap legU so the packet pauses at interior waypoints (dwell)
  const hops = leg.length - 1;
  const dwellTotal = dwell * Math.max(0, hops - 1);
  const travelFrac = 1 - dwellTotal;
  let travelled: number; // 0..1 along the polyline by arc length share
  {
    const perHopTravel = travelFrac / hops;
    const slot = perHopTravel + dwell;
    const hopIndex = Math.min(hops - 1, Math.floor(legU / slot));
    const inSlot = legU - hopIndex * slot;
    const inHop = clamp01(inSlot / perHopTravel);
    travelled = (hopIndex + inHop) / hops;
  }

  // convert hop-uniform progress to arc-length position hop by hop
  const hopIdx = Math.min(hops - 1, Math.floor(travelled * hops));
  const hopFrac = travelled * hops - hopIdx;
  const a = leg[hopIdx];
  const b = leg[hopIdx + 1];
  const x = a.x + (b.x - a.x) * hopFrac;
  const y = a.y + (b.y - a.y) * hopFrac;

  const fade = clamp01(Math.min(uu / 0.04, hold ? 1 : (1 - uu) / 0.04));

  return (
    <g opacity={opacity * fade}>
      <circle cx={x} cy={y} r={r * 2.1} fill={legColor} opacity={0.16} />
      <circle cx={x} cy={y} r={r} fill={legColor} />
      {legLabel && (
        <text x={x} y={y - r - 8} textAnchor="middle" fill={legColor} fontSize={labelSize} fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {legLabel}
        </text>
      )}
    </g>
  );
}

export { pointAlong };
