import type { CSSProperties, ReactNode } from 'react';

export const STAGE_W = 1280;
export const STAGE_H = 720;

/** Responsive 16:9 SVG stage; all scene coordinates live in 1280×720. */
export function Stage({
  children,
  width = STAGE_W,
  height = STAGE_H,
  style,
}: {
  children: ReactNode;
  width?: number;
  height?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', display: 'block', ...style }}
    >
      {children}
    </svg>
  );
}

export interface CameraState {
  /** stage point the camera looks at */
  x: number;
  y: number;
  /** zoom factor (1 = full stage) */
  k: number;
}

export const CAMERA_HOME: CameraState = { x: STAGE_W / 2, y: STAGE_H / 2, k: 1 };

/**
 * A camera is just a <g> transform driven by a {x,y,k} channel — sampled,
 * never transitioned, like everything else here.
 */
export function Camera({ x, y, k, children }: CameraState & { children: ReactNode }) {
  const cx = STAGE_W / 2;
  const cy = STAGE_H / 2;
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${k}) translate(${-x}, ${-y})`}>{children}</g>
  );
}
