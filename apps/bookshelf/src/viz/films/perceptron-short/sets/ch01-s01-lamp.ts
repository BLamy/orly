/**
 * perceptron-short — ch01-s01 / ch01-s02: the near desk's gooseneck lamp, lit dim (round-1 critic: one motivated
 * warm-neutral practical anchoring the near plane of the night lab, inside labGreen).
 *
 *   DESK_LAMP                         the lamp's level (0..1)
 *   deskLampGlow(f, cam, bulb, I)     the kit practical at the bulb (call right after nightDesk)
 *   deskLampPool(f, cam, bulb, I)     the lit shade mouth and the pool on the desk top, painted on the
 *                                     composited frame (call after the near layers / vignette, before type)
 * `bulb` is nightDesk(...).bulb (near-desk world, z 600). s01 and s02 share it, so the match-dissolve holds.
 */
import type { Camera3, Frame } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { toLayer, toScreen } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { LAB_DESK } from './ch01-s02-machine';

export const DESK_LAMP = 0.5;

/** the near desk's lamp as a dim practical: its bulb (near-desk world, z 600) mapped to the action plane */
export function deskLampGlow(f: Frame, cam: Camera3, bulb: { x: number; y: number }, I: number) {
  if (I <= 0.002) return;
  const s = toScreen(DESK_PLANE, cam, bulb.x, bulb.y);
  const p = toLayer(LAYERS.L4, cam, s.x, s.y);
  f.practical({ x: p.x, y: p.y, kind: 'lamp', seed: 7, intensity: I, radius: 34, layer: 'L4' });
}
/** the pool the desk lamp throws on the desk top along the shade's axis (down and right, onto the books);
 * painted on the composited frame (after the near layers have been laid down) */
export function deskLampPool(f: Frame, cam: Camera3, bulb: { x: number; y: number }, I: number) {
  if (I <= 0.002) return;
  const c = f.c;
  // a warm-neutral tint of the palette's core (still inside labGreen): the one lamp in the night lab
  const warm = mixLab(f.mood.core, '#e9dcb8', 0.35);
  c.save();
  c.globalCompositeOperation = 'lighter';
  // the pool on the desk top (a flat ellipse along the shade's axis)
  {
    const q = toScreen(DESK_PLANE, cam, bulb.x + 58, LAB_DESK.top);
    c.save();
    c.translate(q.x, q.y);
    c.scale(1, 0.16);
    const R = 78 * q.k;
    const g = c.createRadialGradient(0, 0, 0, 0, 0, R);
    g.addColorStop(0, withAlpha(warm, 0.9 * I));
    g.addColorStop(0.5, withAlpha(warm, 0.24 * I));
    g.addColorStop(1, withAlpha(warm, 0));
    c.fillStyle = g;
    c.fillRect(-R, -R, 2 * R, 2 * R);
    c.restore();
  }
  // the lit mouth of the shade (the bulb seen up into the cone) and a small halo around it
  {
    const q = toScreen(DESK_PLANE, cam, bulb.x, bulb.y);
    for (const [r, a] of [[30, 0.22], [9, 1]] as const) {
      const R = r * q.k;
      const g = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, R);
      g.addColorStop(0, withAlpha(warm, a * I));
      g.addColorStop(0.5, withAlpha(warm, a * 0.35 * I));
      g.addColorStop(1, withAlpha(warm, 0));
      c.fillStyle = g;
      c.fillRect(q.x - R, q.y - R, 2 * R, 2 * R);
    }
  }
  c.restore();
}
const DESK_PLANE = { z: 600 };

