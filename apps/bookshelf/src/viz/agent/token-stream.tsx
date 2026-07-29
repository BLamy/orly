import { colors, mulberry32 } from '../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/**
 * A stream of token dots flying along a gentle arc — the visual for a model
 * response streaming in (`content_block_delta` after `message_start`). One
 * linear 0..1 channel `u` drives the whole flight: the head token leads and
 * `count` followers trail it, each with a seeded size/wobble so the stream
 * reads as tokens, not a bead chain. Tokens fade in at the source and are
 * absorbed at the destination.
 */
export function TokenStream({
  from,
  to,
  u,
  count = 10,
  color = colors.ACCENT,
  size = 4,
  bend = 0.14,
  tail = 0.6,
  seed = 7,
  opacity = 1,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** 0..1 — drives the whole stream (tween linearly) */
  u: number;
  count?: number;
  color?: string;
  size?: number;
  /** arc height as a fraction of the distance (sign flips the side) */
  bend?: number;
  /** how much of the journey the last token trails the first, in u units */
  tail?: number;
  seed?: number;
  opacity?: number;
}) {
  if (opacity <= 0 || u <= 0) return null;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  // control point: midpoint pushed perpendicular
  const mx = (from.x + to.x) / 2 - (dy / dist) * dist * bend;
  const my = (from.y + to.y) / 2 + (dx / dist) * dist * bend;
  const rand = mulberry32(seed);
  const jitter = Array.from({ length: count }, () => ({
    r: 0.7 + rand() * 0.7,
    wob: (rand() - 0.5) * 10,
  }));

  const dots = [];
  for (let i = 0; i < count; i++) {
    const p = clamp01((clamp01(u) * (1 + tail) - (i / count) * tail) / 1);
    if (p <= 0 || p >= 1) continue;
    const q = 1 - p;
    // quadratic bezier
    const bx = q * q * from.x + 2 * q * p * mx + p * p * to.x;
    const by = q * q * from.y + 2 * q * p * my + p * p * to.y;
    // perpendicular wobble, strongest mid-flight
    const wob = jitter[i].wob * Math.sin(p * Math.PI);
    const px = bx - (dy / dist) * wob;
    const py = by + (dx / dist) * wob;
    const fade = Math.min(1, p / 0.12, (1 - p) / 0.12);
    dots.push(
      <circle key={i} cx={px} cy={py} r={size * jitter[i].r} fill={color} opacity={opacity * fade * 0.95} />,
    );
  }
  return <g>{dots}</g>;
}
