import {
  easeBackOut,
  easeCubicInOut,
  easeCubicOut,
  easeLinear,
  easeQuadInOut,
  easeSinInOut,
} from 'd3';

/**
 * The suite's motion language. These are cinematic explainers, so durations
 * run longer than product UI:
 *   enter  — element fades/scales in         0.5–0.8s
 *   move   — on-screen movement or morph     0.8–1.5s
 *   draw   — path/axis draw-on (dashoffset)  1.0–1.6s
 *   linear — constant processes (packets, clocks, sweeps)
 *   pulse  — breathing emphasis loops
 *   pop    — small celebratory overshoot (badges, checkmarks)
 */
export const enter = easeCubicOut;
export const move = easeCubicInOut;
export const draw = easeQuadInOut;
export const linear = easeLinear;
export const pulse = easeSinInOut;
export const pop = easeBackOut;
