import type { DiagramNode } from '../types';

// The diagram is drawn in a fixed coordinate system and scaled to fit the
// stage via the SVG viewBox. Node positions in the story spec are given in
// 0–100 percentages and mapped into this space.
export const VIEW_W = 1000;
export const VIEW_H = 600;
export const NODE_W = 170;
export const NODE_H = 66;

// viewBox includes margins so nodes near the edges (and their labels) aren't clipped.
export const VIEWBOX = `-100 -40 ${VIEW_W + 200} ${VIEW_H + 80}`;

export interface Pt {
  x: number;
  y: number;
}

export function nodeCenter(n: DiagramNode): Pt {
  return { x: (n.x / 100) * VIEW_W, y: (n.y / 100) * VIEW_H };
}

/** Point on the border of a box centered at `center`, on the ray toward `target`. */
function borderPoint(center: Pt, target: Pt, halfW: number, halfH: number): Pt {
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  if (dx === 0 && dy === 0) return center;
  const sx = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
  const sy = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
  const t = Math.min(sx, sy);
  return { x: center.x + dx * t, y: center.y + dy * t };
}

/** Start/end anchor points for a straight connector between two nodes,
 *  trimmed to each node's border (plus a small gap). */
export function connector(a: DiagramNode, b: DiagramNode, gap = 7) {
  const ca = nodeCenter(a);
  const cb = nodeCenter(b);
  const start = borderPoint(ca, cb, NODE_W / 2 + gap, NODE_H / 2 + gap);
  const end = borderPoint(cb, ca, NODE_W / 2 + gap, NODE_H / 2 + gap);
  return { start, end };
}
