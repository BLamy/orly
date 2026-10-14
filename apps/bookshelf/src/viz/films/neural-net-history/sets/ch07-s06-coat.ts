/**
 * neural-net-history — THE COAT HOOK (kitWork: "coat hook with a frock coat that re-cuts into an overcoat",
 * ch07-s06, ch11-s01): a brass hook beside the Case Board's right edge, outside the grid, and a dusty paper-cut
 * frock coat hanging from it by its loop. ch07-s06 ties the PRE-TRAINING tag to its sleeve; ch11-s01 opens on
 * exactly this framing (coat and hook in the right third, the board's edge at left).
 *
 *   COAT                       hook position (study L4 world) and size
 *   frockCoat(c, env, o)       the hook + coat; o.sway (radians) swings the coat a hair about the hook;
 *                              o.overcoat (0..1) re-cuts the tails into a plain overcoat (for ch11-s01)
 *   sleeveTie(o)               the world point on the near sleeve where a tag is tied (follows the sway)
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';

type C = CanvasRenderingContext2D;
/** (hook raised to y 96 so the coat's hem clears the X-ray box's top: coat and box read as two things) */
export const COAT = { x: 1206, y: 96, s: 1 } as const;

export interface CoatDraw {
  sway?: number;
  overcoat?: number;
  /** lamp light on the coat 0..1 (it hangs at the edge of the pool) */
  light?: number;
}

const rot = (p: { x: number; y: number }, a: number) => ({
  x: COAT.x + (p.x - COAT.x) * Math.cos(a) - (p.y - COAT.y) * Math.sin(a),
  y: COAT.y + (p.x - COAT.x) * Math.sin(a) + (p.y - COAT.y) * Math.cos(a),
});
/** the sleeve's cuff (near side), where the tag is tied */
export function sleeveTie(o: CoatDraw = {}) {
  return rot({ x: COAT.x - 30, y: COAT.y + 168 }, o.sway ?? 0);
}

export function frockCoat(c: C, env: PaintEnv, o: CoatDraw = {}) {
  const m = env.mood;
  const ink = env.fill('ink');
  const light = o.light ?? 0.5;
  const oc = Math.max(0, Math.min(1, o.overcoat ?? 0));
  // the brass hook on its plate (screwed to the panelling)
  c.fillStyle = mixLab(m.halo, m.set, 0.35);
  c.fillRect(COAT.x - 5, COAT.y - 24, 10, 22);
  c.strokeStyle = mixLab(m.halo, m.set, 0.25);
  c.lineWidth = 3.2;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(COAT.x, COAT.y - 8);
  c.quadraticCurveTo(COAT.x + 2, COAT.y + 6, COAT.x + 9, COAT.y + 2);
  c.stroke();
  c.fillStyle = withAlpha(m.core, 0.35 * light);
  c.fillRect(COAT.x - 4, COAT.y - 22, 2, 18);
  c.save();
  c.translate(COAT.x, COAT.y);
  c.rotate(o.sway ?? 0);
  c.translate(-COAT.x, -COAT.y);
  const x = COAT.x, y = COAT.y;
  // the coat: hanging loop, sloped shoulders, a fitted waist, and the frock's skirt / tails
  const p = new Path2D();
  p.moveTo(x - 4, y + 2);
  p.lineTo(x - 14, y + 12); // collar
  p.quadraticCurveTo(x - 40, y + 16, x - 46, y + 30); // near shoulder
  p.lineTo(x - 44, y + 96);
  p.lineTo(x - 36, y + 104); // waist
  const tail = 1 - oc;
  p.lineTo(x - 46 - 6 * tail, y + 210 - 8 * oc); // skirt flaring
  p.lineTo(x - 8, y + 214 - 10 * oc);
  if (tail > 0.05) {
    // the frock's back vent between the tails
    p.lineTo(x - 2, y + 186);
    p.lineTo(x + 4, y + 214);
  } else p.lineTo(x + 4, y + 204);
  p.lineTo(x + 40 + 6 * tail, y + 208 - 8 * oc);
  p.lineTo(x + 32, y + 104);
  p.lineTo(x + 38, y + 96);
  p.lineTo(x + 40, y + 30);
  p.quadraticCurveTo(x + 34, y + 16, x + 10, y + 12);
  p.closePath();
  c.fillStyle = ink;
  c.fill(p);
  // the near sleeve hanging in front, its cuff
  const sl = new Path2D();
  sl.moveTo(x - 46, y + 30);
  sl.quadraticCurveTo(x - 54, y + 80, x - 40, y + 168);
  sl.lineTo(x - 22, y + 170);
  sl.quadraticCurveTo(x - 30, y + 100, x - 30, y + 44);
  sl.closePath();
  c.fillStyle = mixLab(ink, m.set, 0.12);
  c.fill(sl);
  // cut-lines: lapel, buttons, the cuff, the waist seam (rim, sparse: ≤ 8)
  c.strokeStyle = withAlpha(m.rim, 0.32 + 0.2 * light);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(x - 10, y + 14);
  c.lineTo(x - 2, y + 70);
  c.moveTo(x - 36, y + 104);
  c.lineTo(x + 32, y + 104);
  c.moveTo(x - 41, y + 160);
  c.lineTo(x - 23, y + 162);
  c.moveTo(x - 46, y + 30);
  c.quadraticCurveTo(x - 54, y + 80, x - 40, y + 168);
  c.stroke();
  c.fillStyle = withAlpha(m.rim, 0.4 * (0.5 + light));
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.arc(x + 2, y + 60 + i * 15, 1.6, 0, Math.PI * 2);
    c.fill();
  }
  // dust: a faint pale bloom on the shoulders (it has hung here a while)
  c.fillStyle = withAlpha(m.haze, 0.22);
  for (let i = 0; i < 26; i++) {
    const px = x - 40 + (0.5 + 0.5 * hash1(i, 3)) * 78;
    const py = y + 16 + (0.5 + 0.5 * hash1(i, 4)) * 22;
    c.fillRect(px, py, 1.4, 1.4);
  }
  c.restore();
}
