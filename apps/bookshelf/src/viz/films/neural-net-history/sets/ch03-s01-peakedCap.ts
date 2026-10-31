/**
 * ch03-s01 / ch03-s03 — the naval officer's PEAKED service cap in profile (the cast's 1950s 'cap' is a flat cap):
 * drawn over the puppet's own hat at its 'head' anchor, facing right. No insignia.
 *
 *   peakedCap(c, env, puppet.anchor(opts, 'head'), opts.scale, opts.ink)
 */
import type { PaintEnv } from '../../../film/contracts';
import { withAlpha } from '../../../film/silhouette/palette';

/** a naval service cap in PROFILE over the puppet's own cap: a tall flat-topped crown that overhangs the band
 *  front and back, and a short glossy peak dipping forward over the brow (facing right). No insignia. */
export function peakedCap(c: CanvasRenderingContext2D, env: PaintEnv, head: { x: number; y: number }, scale: number, ink: string) {
  const u = 0.13 * 328 * scale; // ≈ one head height in world px
  const hx = head.x, hy = head.y;
  c.save();
  c.translate(hx, hy);
  c.fillStyle = ink;
  // band (sits on the head) and the crown flaring wider to a flat top
  c.beginPath();
  c.moveTo(-0.5 * u, -0.28 * u);
  c.lineTo(0.42 * u, -0.28 * u);
  c.lineTo(0.48 * u, -0.5 * u);
  c.quadraticCurveTo(0.64 * u, -0.62 * u, 0.58 * u, -0.7 * u);
  c.lineTo(-0.72 * u, -0.7 * u);
  c.quadraticCurveTo(-0.78 * u, -0.6 * u, -0.56 * u, -0.5 * u);
  c.closePath();
  c.fill();
  // the peak: a short visor angled down over the brow
  c.beginPath();
  c.moveTo(0.3 * u, -0.3 * u);
  c.lineTo(0.46 * u, -0.32 * u);
  c.quadraticCurveTo(0.7 * u, -0.26 * u, 0.82 * u, -0.12 * u);
  c.quadraticCurveTo(0.6 * u, -0.17 * u, 0.3 * u, -0.2 * u);
  c.closePath();
  c.fill();
  // cut-lines: the band seam and the lit top of the crown (window side, upper left)
  c.strokeStyle = withAlpha(env.mood.rim, 0.5);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-0.52 * u, -0.46 * u);
  c.lineTo(0.47 * u, -0.46 * u);
  c.stroke();
  c.strokeStyle = withAlpha(env.mood.rim, 0.75);
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(-0.72 * u, -0.7 * u);
  c.lineTo(0.5 * u, -0.7 * u);
  c.stroke();
  c.restore();
}
