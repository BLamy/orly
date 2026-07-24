import { useLayoutEffect, useRef } from 'react';
import type { SceneState } from './timeline';
import { STAGE_W, STAGE_H } from './stage';

const SUPERSAMPLE = 2;

/**
 * A canvas embedded in the SVG stage via <foreignObject>, drawing in stage
 * coordinates (1280×720). Fixed 2× backing resolution — the responsive SVG
 * scales it, so no resize observers are needed. Use for dense marks
 * (particle clouds ≥ ~500 points); everything else stays SVG.
 */
export function CanvasLayer({
  state,
  draw,
  x = 0,
  y = 0,
  width = STAGE_W,
  height = STAGE_H,
}: {
  state: SceneState;
  draw: (ctx: CanvasRenderingContext2D, state: SceneState) => void;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(SUPERSAMPLE, 0, 0, SUPERSAMPLE, 0, 0);
    ctx.clearRect(0, 0, width, height);
    draw(ctx, state);
  }, [state, draw, width, height]);

  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <canvas
        ref={ref}
        width={width * SUPERSAMPLE}
        height={height * SUPERSAMPLE}
        style={{ width: `${width}px`, height: `${height}px`, display: 'block' }}
      />
    </foreignObject>
  );
}
