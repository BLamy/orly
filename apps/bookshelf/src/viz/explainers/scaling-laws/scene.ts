import { scaleLinear } from 'd3';
import type { ScaleLinear } from 'd3';
import { CAMERA_HOME, STAGE_H, STAGE_W, Timeline, cameraInterp, ease } from '../../core';
import type { CameraState, ChannelRef } from '../../core';

/**
 * Scaling Laws — the straight line on the log-log plot.
 *
 * Grounded in a REAL published result: Kaplan and coworkers, 2020, reported
 * that test loss falls as a power law in training compute over many orders of
 * magnitude, L(C) = (C_c / C)^alpha with alpha_C about 0.050. That power law
 * is what we draw and annotate; it is labeled on screen as the published fit,
 * not as our own measurement. A power law is exactly a straight line once both
 * axes are logarithmic, and its slope is the exponent.
 *
 * All plotted values are computed at module scope from that published form;
 * the "measurement" markers are sampled points ON the published fit at round
 * compute scales, shown to make the line legible — labeled honestly as such.
 */

// Kaplan et al. 2020 compute power law (petaflop/s-days form), published:
export const ALPHA_C = 0.05;
const LOG10_CC = 3.0; // ~10^3 pf-days for L(C)=1 (illustrative anchor on the published slope)
/** Published power-law loss as a function of compute C (in pf-days). */
export const lossOfLogC = (log10C: number): number => Math.pow(10, ALPHA_C * (LOG10_CC - log10C));

/** Sampled points on the published fit, at round compute scales. */
export const POINTS: { log10C: number; loss: number }[] = [-2, -1, 0, 1, 2, 3, 4, 5, 6].map((log10C) => ({
  log10C,
  loss: lossOfLogC(log10C),
}));

export const LOGC_MIN = -2.5;
export const LOGC_MAX = 6.5;

// ---------------------------------------------------------------------------
// Two panels: LEFT linear axes (curve bends), RIGHT log-log axes (line straight)
// ---------------------------------------------------------------------------

// LEFT — linear compute vs loss (only shows the low-compute elbow legibly)
export const linX: ScaleLinear<number, number> = scaleLinear().domain([0, 1000]).range([110, 560]);
export const linY: ScaleLinear<number, number> = scaleLinear().domain([0.5, 1.5]).range([600, 120]);
/** Linear-panel curve: loss vs raw compute over a small window. */
export const linLoss = (c: number): number => Math.pow(10, ALPHA_C * (LOG10_CC - Math.log10(Math.max(1e-3, c))));

// RIGHT — log10 compute vs log10 loss (the straight line)
export const logX: ScaleLinear<number, number> = scaleLinear().domain([LOGC_MIN, LOGC_MAX]).range([720, 1200]);
export const logY: ScaleLinear<number, number> = scaleLinear()
  .domain([Math.log10(lossOfLogC(LOGC_MAX)) - 0.02, Math.log10(lossOfLogC(LOGC_MIN)) + 0.02])
  .range([600, 120]);

export const CAM_LEFT: CameraState = { x: 360, y: 340, k: 1.28 };
export const CAM_RIGHT: CameraState = { x: 950, y: 340, k: 1.24 };
export const CAM_WIDE: CameraState = CAMERA_HOME;

// ---------------------------------------------------------------------------
// The timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  linU: ChannelRef<number>;
  linCurveU: ChannelRef<number>;
  logU: ChannelRef<number>;
  lineU: ChannelRef<number>;
  ptsU: ChannelRef<number>;
  slopeU: ChannelRef<number>;
  texU: ChannelRef<number>;
  extendU: ChannelRef<number>; // extrapolation dashed segment
  dimU: ChannelRef<number>;
  endU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const linU = tl.channel('linU', 0);
  const linCurveU = tl.channel('linCurveU', 0);
  const logU = tl.channel('logU', 0);
  const lineU = tl.channel('lineU', 0);
  const ptsU = tl.channel('ptsU', 0);
  const slopeU = tl.channel('slopeU', 0);
  const texU = tl.channel('texU', 0);
  const extendU = tl.channel('extendU', 0);
  const dimU = tl.channel('dimU', 1);
  const endU = tl.channel('endU', 0);

  // — Beat 1 · the question ————————————————————————————————————————————————
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'If next-token prediction is compression, the natural question is: how much better does it get as you spend more? More compute, more data, more parameters. Does it plateau, or keep paying?',
  });
  tl.tween(cam, CAM_LEFT, { at: 0.6, dur: 1.6, ease: ease.move });
  tl.tween(linU, 1, { at: 0.8, dur: 1.4, ease: ease.draw });
  tl.caption({
    at: 6.4,
    dur: 5.2,
    text: 'Plot test loss against training compute the ordinary way, and you get a discouraging elbow: fast gains that seem to flatten. It looks like diminishing returns hitting a wall.',
  });
  tl.tween(linCurveU, 1, { at: 6.8, dur: 1.8, ease: ease.draw });
  tl.hold(11.9, 0.6);

  // — Beat 2 · change the axes ——————————————————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 12.5, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 12.7,
    dur: 6.0,
    text: 'But redraw it with logarithmic axes, stretching each factor of ten to equal width. The same discouraging curve becomes something remarkable: a straight line, holding across many orders of magnitude.',
  });
  tl.tween(logU, 1, { at: 13.4, dur: 1.4, ease: ease.draw });
  tl.tween(lineU, 1, { at: 15.0, dur: 2.0, ease: ease.draw });
  tl.tween(ptsU, 1, { at: 16.6, dur: 1.6, ease: ease.enter });
  tl.hold(18.9, 0.6);

  // — Beat 3 · what the line means —————————————————————————————————————————
  tl.tween(cam, CAM_RIGHT, { at: 19.5, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 19.7,
    dur: 6.2,
    text: 'A straight line on a log-log plot means a power law: loss falls as compute raised to a small negative exponent. This is a real published finding, from Kaplan and coworkers in twenty twenty, over more than six orders of magnitude.',
    tex: 'L(C) = \\left(\\tfrac{C_c}{C}\\right)^{\\alpha},\\quad \\alpha \\approx 0.05',
  });
  tl.tween(texU, 1, { at: 20.6, dur: 0.8, ease: ease.enter });
  tl.tween(slopeU, 1, { at: 22.4, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 26.1,
    dur: 5.4,
    text: 'The slope is the exponent, about minus point zero five. Shallow, but it never turns over. Every tenfold increase in compute buys the same fixed drop in loss, again and again.',
  });
  tl.hold(31.7, 0.6);

  // — Beat 4 · extrapolation ————————————————————————————————————————————————
  tl.tween(cam, CAM_WIDE, { at: 32.3, dur: 1.5, ease: ease.move });
  tl.caption({
    at: 32.5,
    dur: 6.0,
    text: 'This is why the field bet so heavily on scale. A straight line is a prediction: extend it, and you can forecast the loss of a model far bigger than any yet built, before spending a cent on training it.',
  });
  tl.tween(extendU, 1, { at: 33.2, dur: 2.4, ease: ease.draw });
  tl.caption({
    at: 39.1,
    dur: 5.4,
    text: 'The honest caveats matter. It measures loss, not wisdom. It assumes data and model grow together. And every real curve eventually bends. But within its range, it has held with unsettling precision.',
  });
  tl.hold(44.9, 0.6);

  // — Beat 5 · recap ————————————————————————————————————————————————————————
  tl.tween(dimU, 0.15, { at: 45.5, dur: 1.2, ease: ease.move });
  tl.tween(texU, 0, { at: 45.5, dur: 0.8, ease: ease.move });
  tl.tween(slopeU, 0, { at: 45.5, dur: 0.8, ease: ease.move });
  tl.tween(endU, 1, { at: 46.7, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 46.7,
    dur: 5.8,
    text: 'Scaling laws turned a vague hope into a straight line you could plan around: predictable, smooth improvement from raw scale. That line, more than any single idea, is why the models kept getting bigger.',
  });
  tl.caption({
    at: 52.9,
    dur: 5.2,
    text: 'And somewhere along that line, the models began doing something no one trained them to do: learning a brand new task from the prompt alone. That is next.',
  });
  tl.hold(58.5, 1.2);

  return { tl, cam, linU, linCurveU, logU, lineU, ptsU, slopeU, texU, extendU, dimU, endU };
}

export { STAGE_W, STAGE_H };
