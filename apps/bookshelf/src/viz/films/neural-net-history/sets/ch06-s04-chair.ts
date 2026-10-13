/**
 * ch06-s04 — the rim room's near plane, in INK (review r1 art: "the blurred foreground chair back at bottom-left is
 * mid-grey and translucent from 8 s to the end and reads as an unidentifiable blob: make it near-ink, or move it 120 px
 * left so only its edge shows"). Both: the same carved chair back as the kit's rimNear('chair') (sets/rimNear.ts: turned
 * stiles, scrolled crest, a pierced vase splat), cut in the layer's INK instead of its fg grey, a warm candle catch on
 * its inward (lamp-side) edges, and set 120 px further left than the kit's anchor, so only its right stile, the crest's
 * ear and half of the pierced splat enter the frame at the lower-left corner. Parallax as the kit's: 40 % of its true
 * L5 travel against `ref` (the shot's last camera), clamped to ±40 / ±30 px, so it never wanders into the picture.
 *
 *   inkChairNear(f, { ref, scale?, shiftX? })     call after the stage's own layers (it paints over the action)
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { toLayer, toScreen } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { addEllipse, addFoil, addRect, at, memoPath, rosette, scroll } from '../../../film/silhouette/ornament';

type C = CanvasRenderingContext2D;
const clamp = (v: number, a: number) => Math.max(-a, Math.min(a, v));

/** the kit's chair back from behind (screen px, base centre at 0,0, up = -y): ~190 wide, ~330 tall */
function chairPath(): Path2D {
  return memoPath('ch06-s04/inkChair', () => {
    const p = new Path2D();
    p.moveTo(-96, 0);
    p.lineTo(-90, -250);
    p.quadraticCurveTo(-96, -282, -78, -300);
    p.lineTo(-66, -300);
    p.lineTo(-70, 0);
    p.closePath();
    p.moveTo(70, 0);
    p.lineTo(66, -300);
    p.lineTo(78, -300);
    p.quadraticCurveTo(96, -282, 90, -250);
    p.lineTo(96, 0);
    p.closePath();
    addRect(p, -96, -36, 192, 22);
    p.moveTo(-84, -276);
    p.quadraticCurveTo(-40, -318, 0, -312);
    p.quadraticCurveTo(40, -318, 84, -276);
    p.lineTo(84, -258);
    p.quadraticCurveTo(40, -290, 0, -284);
    p.quadraticCurveTo(-40, -290, -84, -258);
    p.closePath();
    at(p, scroll({ w: 34, h: 16, kind: 'C', thick: 7 }), -116, -276, 1, 1, -0.5);
    at(p, scroll({ w: 34, h: 16, kind: 'C', thick: 7 }), 116, -276, -1, 1, 0.5);
    p.moveTo(-14, -40);
    p.bezierCurveTo(-46, -90, -10, -130, -30, -180);
    p.bezierCurveTo(-48, -230, -20, -270, 0, -282);
    p.bezierCurveTo(20, -270, 48, -230, 30, -180);
    p.bezierCurveTo(10, -130, 46, -90, 14, -40);
    p.closePath();
    addFoil(p, 0, -226, 15, 4, { rot: Math.PI / 4, ccw: true });
    addEllipse(p, -12, -160, 5, 13, 0.25, true);
    addEllipse(p, 12, -160, 5, 13, -0.25, true);
    at(p, rosette(10, 8), 0, -110);
    return p;
  });
}

export function inkChairNear(f: Frame, o: { ref: Camera3; scale?: number; shiftX?: number; alpha?: number }): void {
  const alpha = o.alpha ?? 1;
  if (alpha <= 0.01) return;
  const s = o.scale ?? 0.75;
  // the kit's left-corner anchor (128·s, 742), moved left so only the chair's edge shows
  const anchor = { x: 128 * s - (o.shiftX ?? 120), y: 742 };
  f.layer('L5', (c, env) => {
    const cam = f.cam;
    const aL = toLayer(LAYERS.L5, o.ref, anchor.x, anchor.y);
    const sNow = toScreen(LAYERS.L5, cam, aL.x, aL.y);
    const dx = clamp(0.4 * (sNow.x - anchor.x), 40);
    const dy = clamp(0.4 * (sNow.y - anchor.y), 30);
    const p0 = toLayer(LAYERS.L5, cam, 0, 0);
    const p1 = toLayer(LAYERS.L5, cam, 1, 0);
    const k = p1.x - p0.x;
    c.save();
    c.translate(p0.x, p0.y);
    c.scale(k, k);
    c.translate(anchor.x + dx, anchor.y + dy);
    c.globalAlpha *= alpha;
    paint(c, env, s);
    c.restore();
  });
}

function paint(c: C, env: PaintEnv, s: number) {
  const p = chairPath();
  c.scale(s, s);
  // near-ink: the darkest plane in the frame, one step under the figures' near-black
  c.fillStyle = mixLab(env.fill('ink'), '#000000', 0.25);
  c.fill(p, 'evenodd');
  // the candle's warm catch on its inward (right, lamp-side) edges: an offset copy, clipped to the shape
  c.save();
  c.clip(p, 'evenodd');
  c.translate(-2.4, 1.2);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.45), 0.7);
  c.lineWidth = 2.6;
  c.stroke(p);
  c.restore();
}
