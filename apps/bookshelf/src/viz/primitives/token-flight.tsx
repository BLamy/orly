// TokenFlight — a value in transit between two representations.
//
// The core morph idiom: a JSON value (anchored via JsonLayout.anchor) lifts
// out of the document along a gentle arc, scales, and lands where another
// visualization takes over — and the same component runs the return trip by
// swapping from/to. Position is a pure function of ONE `u` channel, so a
// scene can stagger any number of flights off a single tween
// (`u_i = clamp01(flightU * n - i)`).
import { colors } from '../core';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

export interface FlightPoint {
  x: number;
  y: number;
}

/** Quadratic-bezier arc between two stage points; `lift` raises the apex. */
export function flightPos(from: FlightPoint, to: FlightPoint, u: number, lift = 70): FlightPoint {
  const t = clamp01(u);
  const a = 1 - t;
  const mx = (from.x + to.x) / 2;
  const my = Math.min(from.y, to.y) - lift;
  return {
    x: a * a * from.x + 2 * a * t * mx + t * t * to.x,
    y: a * a * from.y + 2 * a * t * my + t * t * to.y,
  };
}

export interface TokenFlightProps {
  from: FlightPoint;
  to: FlightPoint;
  /** 0 = resting at `from` (renders nothing), 1 = landed at `to` */
  u: number;
  text: string;
  fill?: string;
  fontSize?: number;
  /** scale at the destination relative to takeoff (grow into a title, shrink into a chip) */
  toScale?: number;
  /** arc apex height */
  lift?: number;
  /** fade out on approach, for when the landing visualization takes over */
  fadeOut?: boolean;
  /** keep rendering after landing (default true; set false when a target element replaces it) */
  holdAtEnd?: boolean;
  opacity?: number;
}

export function TokenFlight({
  from,
  to,
  u,
  text,
  fill = colors.TEXT,
  fontSize = 14,
  toScale = 1,
  lift = 70,
  fadeOut = false,
  holdAtEnd = true,
  opacity = 1,
}: TokenFlightProps) {
  const t = clamp01(u);
  if (t <= 0 || opacity <= 0) return null;
  if (t >= 1 && !holdAtEnd) return null;
  const p = flightPos(from, to, t, lift);
  const s = 1 + (toScale - 1) * t;
  const op = opacity * (fadeOut ? 1 - clamp01((t - 0.72) / 0.28) : 1);
  if (op <= 0) return null;
  return (
    <text
      x={p.x}
      y={p.y}
      textAnchor="middle"
      fill={fill}
      fontSize={fontSize * s}
      fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
      opacity={op}
    >
      {text}
    </text>
  );
}
