/**
 * handwired-explained — ch11-s01b / ch11-s02: the narrator's hands drawn with the round-3 WARM EDGE RIM and a PALE
 * CUFF BAND (review r1: "fingers read as blobby sausages"; "the arm silhouette has no warm edge rim").
 *
 *   drawRimmedHands(c, pose, env, o?)   inside f.layer('L4' | 'L5', …), in place of hands.draw(c, pose, env)
 *
 * The rig (sets/narratorHands.ts) cuts its rim on cuffs and knuckle lines only. Here the whole hand-and-sleeve
 * silhouette is painted into a scratch canvas and composited with a warm drop-shadow offset toward the key light
 * (up and to the left: the bench lamp and the window behind), so its light-facing contour carries a solid warm edge
 * 2.6 px wide at 1080p, 85 % opaque, ~65 % warm. The once-rolled linen sleeve's roll gets a pale band, so the cuff
 * reads as cloth against the near-black arm. Pure: the scratch canvas is a reused buffer, nothing depends on time.
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { narratorHands, HAND_LEN, type ArmPose, type HandsPose, type HeldDraw } from './narratorHands';

type C = CanvasRenderingContext2D;
let scratch: HTMLCanvasElement | null = null;
function buffer(w: number, h: number): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!scratch) scratch = document.createElement('canvas');
  if (scratch.width !== w || scratch.height !== h) {
    scratch.width = w;
    scratch.height = h;
  }
  return scratch.getContext('2d');
}

/** the pale band on the linen roll (hand-local: the roll spans x -1.42..-1.08, y ±0.31) */
function paleCuff(c: C, a: ArmPose, len: number, env: PaintEnv) {
  if ((a.sleeve ?? 'linen') !== 'linen') return;
  const fy = (Math.cos(a.angle) < 0 ? -1 : 1) * (a.palmUp ? -1 : 1);
  c.save();
  c.translate(a.wrist.x, a.wrist.y);
  c.rotate(a.angle);
  c.scale(len, len * fy);
  c.fillStyle = withAlpha(mixLab('#cfc6b0', env.mood.set, 0.4), 0.8);
  c.beginPath();
  c.moveTo(-1.13, -0.28);
  c.quadraticCurveTo(-1.08, 0, -1.13, 0.28);
  c.lineTo(-1.33, 0.3);
  c.quadraticCurveTo(-1.38, 0, -1.33, -0.3);
  c.closePath();
  c.fill();
  c.restore();
}

export interface RimOpts extends HeldDraw {
  /** direction toward the key light (unit-ish, screen), default up-left */
  key?: { x: number; y: number };
  /** rim width in px at 1080p, default 2.6 (floored to 2.25-3) */
  px?: number;
}

/** the narrator's hands with the warm edge rim and the pale cuff band */
export function drawRimmedHands(c: C, p: HandsPose, env: PaintEnv, o: RimOpts = {}) {
  const len = HAND_LEN * (p.scale ?? 1);
  const cv = c.canvas;
  const b = buffer(cv.width, cv.height);
  const m = c.getTransform();
  const paint = (k: C) => {
    narratorHands.draw(k, p, env, o);
    if (p.left) paleCuff(k, p.left, len, env);
    if (p.right) paleCuff(k, p.right, len, env);
  };
  if (!b) {
    paint(c);
    return;
  }
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.clearRect(0, 0, cv.width, cv.height);
  b.setTransform(m);
  paint(b);
  // device px per 1080p px: the frame's device height over 1080
  const dev = cv.height / 1080;
  const w = Math.max(2.25, Math.min(3, o.px ?? 2.6)) * dev;
  const key = o.key ?? { x: -0.62, y: -0.78 };
  const kl = Math.hypot(key.x, key.y) || 1;
  const warm = withAlpha(mixLab('#f0b070', env.mood.rim, 0.35), 0.85);
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.filter = `drop-shadow(${((key.x / kl) * w).toFixed(2)}px ${((key.y / kl) * w).toFixed(2)}px 0px ${warm})`;
  // (the drop-shadow filter paints the hands themselves over their own rim)
  c.drawImage(b.canvas, 0, 0);
  c.filter = 'none';
  c.restore();
}
