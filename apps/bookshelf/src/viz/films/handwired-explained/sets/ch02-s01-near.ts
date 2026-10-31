/**
 * handwired-explained — the ch02 period rooms' carved NEAR PLANE (review round 1, ch02-s01: "add a carved L5 occluder at
 * a lower corner (a chair back or a newel at lower-left, about 18 % of frame width, blurred)").
 *
 * One carved, pierced silhouette on L5 at a lower frame corner, the darkest plane in frame, rim-caught on its lamp side,
 * sliding with a little parallax under the camera's moves (40 % of its true L5 travel, clamped, so it never wanders into
 * the picture). Adapted from neural-net-history's rimNear (same chair-back and newel cut), owned here so this film's
 * rooms do not depend on another film's sets.
 *
 *   periodNear(f, { kind: 'chair' | 'newel', side?, alpha?, scale?, dx?, dy? })   (call after the L4 layer)
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { toLayer, toScreen } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { addEllipse, addFoil, addRect, at, finial, memoPath, rosette, scroll } from '../../../film/silhouette/ornament';

type C = CanvasRenderingContext2D;
export type PeriodNearKind = 'chair' | 'newel';
export interface PeriodNearOpts {
  kind: PeriodNearKind;
  side?: 'left' | 'right';
  alpha?: number;
  /** size multiplier on the authored screen size (chair ~190 x 330 px at 1) */
  scale?: number;
  /** slide the authored anchor (screen px) */
  dx?: number;
  dy?: number;
  /** the warm edge catch's strength (default 1) */
  rim?: number;
}

const NEAR = 'L5' as const;
const NEAR_SPEC = LAYERS.L5;
const clamp = (v: number, a: number) => Math.max(-a, Math.min(a, v));

/** a carved chair back from behind (base centre at 0,0, up = -y): ~190 wide, ~330 tall */
function chairPath(): Path2D {
  return memoPath('ch02near/chair', () => {
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

/** a carved stair newel with a short rail running inward (base centre at 0,0): shaft ~56 wide, ~360 tall */
function newelPath(dir: 1 | -1): Path2D {
  return memoPath(`ch02near/newel/${dir}`, () => {
    const p = new Path2D();
    addRect(p, -36, -40, 72, 40);
    addRect(p, -28, -300, 56, 262);
    addRect(p, -18, -280, 36, 96, true);
    addRect(p, -18, -170, 36, 112, true);
    addFoil(p, 0, -232, 9, 4, { ccw: true });
    addRect(p, -38, -318, 76, 18);
    addRect(p, -32, -326, 64, 8);
    at(p, finial('urn', 64), 0, -326);
    const run = 250, rise = 104;
    p.moveTo(dir * 24, -286);
    p.lineTo(dir * run, -286 - rise);
    p.lineTo(dir * run, -266 - rise);
    p.lineTo(dir * 24, -266);
    p.closePath();
    for (let i = 1; i <= 3; i++) {
      const x = dir * (24 + i * 58);
      const top = -266 - (i * 58 * rise) / (run - 24);
      addRect(p, x - 4.5, top, 9, -top - 30);
      addEllipse(p, x, top + (-top - 30) * 0.58, 8.5, 15);
      addEllipse(p, x, top + 9, 6.5, 8);
    }
    return p;
  });
}

/** draw the room's carved near plane on L5 (darkest plane, pierced, rim-caught toward the room's light) */
export function periodNear(f: Frame, o: PeriodNearOpts): void {
  const alpha = o.alpha ?? 1;
  if (alpha <= 0.01) return;
  const side = o.side ?? 'left';
  const s = o.scale ?? (o.kind === 'newel' ? 0.78 : 1);
  const anchor = { x: (side === 'left' ? 128 * s : 1280 - 128 * s) + (o.dx ?? 0), y: 742 + (o.dy ?? 0) };
  f.layer(NEAR, (c, env) => {
    const cam = f.cam;
    // parallax: 40 % of the true L5 travel relative to the home camera, clamped
    const home = { x: 640, y: 360, z: 0, lens: 1 };
    const aL = toLayer(NEAR_SPEC, home, anchor.x, anchor.y);
    const sNow = toScreen(NEAR_SPEC, cam, aL.x, aL.y);
    const dx = clamp(0.4 * (sNow.x - anchor.x), 40);
    const dy = clamp(0.4 * (sNow.y - anchor.y), 30);
    const p0 = toLayer(NEAR_SPEC, cam, 0, 0);
    const p1 = toLayer(NEAR_SPEC, cam, 1, 0);
    const k = p1.x - p0.x;
    c.save();
    c.translate(p0.x, p0.y);
    c.scale(k, k);
    c.translate(anchor.x + dx, anchor.y + dy);
    c.globalAlpha *= alpha;
    paint(c, env, o.kind, side, s, o.rim ?? 1);
    c.restore();
  });
}

function paint(c: C, env: PaintEnv, kind: PeriodNearKind, side: 'left' | 'right', s: number, rimK: number) {
  const fg = env.fill('fg');
  const rimCol = mixLab(env.mood.rim, env.mood.core, 0.4);
  const inward = side === 'left' ? 1 : -1;
  c.scale(s, s);
  const p = kind === 'chair' ? chairPath() : newelPath(inward as 1 | -1);
  c.fillStyle = fg;
  c.fill(p, 'evenodd');
  c.save();
  c.clip(p, 'evenodd');
  c.translate(-inward * 2.2, 1.2);
  c.strokeStyle = withAlpha(rimCol, Math.min(1, 0.55 * rimK));
  c.lineWidth = 2.4;
  c.stroke(p);
  c.restore();
}
