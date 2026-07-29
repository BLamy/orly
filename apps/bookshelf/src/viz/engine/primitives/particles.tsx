import { useCallback } from 'react';
import type { SceneState } from '../core/timeline';
import { CanvasLayer } from '../core/canvas-layer';
import { ACCENT } from '../core/colors';

export interface ParticlePoint {
  x: number;
  y: number;
  color?: string;
  r?: number;
  alpha?: number;
}

/**
 * A dense point cloud on canvas (SVG chokes past ~500 nodes). `compute`
 * derives every particle position from the sampled state — typically from
 * one or two channels plus precomputed seeded noise — so the cloud scrubs
 * exactly like everything else.
 */
export function ParticleCloud({
  state,
  compute,
  r = 2.4,
  color = ACCENT,
  alpha = 0.85,
}: {
  state: SceneState;
  compute: (s: SceneState) => ParticlePoint[];
  r?: number;
  color?: string;
  alpha?: number;
}) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, s: SceneState) => {
      const pts = compute(s);
      for (const p of pts) {
        ctx.globalAlpha = (p.alpha ?? 1) * alpha;
        ctx.fillStyle = p.color ?? color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r ?? r, 0, 2 * Math.PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
    [compute, r, color, alpha],
  );

  return <CanvasLayer state={state} draw={draw} />;
}
