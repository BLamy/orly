// Smooth-zoom interpolation for CameraState channels.
//
// The default channel interpolator lerps {x, y, k} independently, which makes
// a combined pan+zoom "swerve": screen position is cx + k·(p − x), so linear k
// and linear x compose into a curved, wobbly path for the very point the
// camera is chasing. d3.interpolateZoom solves the classic smooth-zoom
// variational problem (van Wijk & Nuij) in view space — the subject tracks a
// straight, eased path and long zooms arc out naturally.
//
// Use it as the channel interpolator for every camera:
//   const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
import { interpolateZoom } from 'd3-interpolate';
import type { CameraState } from '../engine/core';

const STAGE_W = 1280;

/** Channel interpolator: CameraState → CameraState via d3.interpolateZoom. */
export function cameraInterp(a: CameraState, b: CameraState): (t: number) => CameraState {
  // interpolateZoom works on [centerX, centerY, viewWidth]; width = STAGE_W / k.
  const zoom = interpolateZoom([a.x, a.y, STAGE_W / a.k], [b.x, b.y, STAGE_W / b.k]);
  return (t) => {
    const [x, y, w] = zoom(Math.max(0, Math.min(1, t)));
    return { x, y, k: STAGE_W / w };
  };
}
