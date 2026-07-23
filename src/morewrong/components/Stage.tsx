import type { ReactNode } from 'react';
import { colors } from '../../viz/core';

export const STAGE_W = 1280;
export const STAGE_H = 720;

/** Responsive 1280×720 SVG stage on the dark viz background. */
export function Stage({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="mw-stage"
      role="img"
    >
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      {children}
    </svg>
  );
}
