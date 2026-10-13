/**
 * neural-net-history — the RIM ROOMS' ornamental foreground plane (review round 3, art: "add one ornamental foreground
 * plane per rim room (fretwork, chair-back tracery, a carved newel), as studyNear does, to the ch06/ch11/ch13 rooms").
 * The study has its drape, pelmet and wing chair on L6; the candle stages of the doubters' years (ch06), the crowded
 * rim (ch11) and the three camps (ch13) had only their own action and backdrop. Each now gets ONE carved, pierced
 * near-plane silhouette (L5) at a lower frame corner, darker than the figures, rim-caught on its lamp side, sliding
 * with a little parallax under the camera's moves (40 % of its true L5 travel, clamped to ±60 px, so it never wanders
 * into the picture).
 *
 *   rimNear(f, { kind, side?, ref?, alpha?, scale? })
 *     kind   'chair'  a carved chair back seen from behind: pierced vase splat, scrolled crest, turned stiles (ch06)
 *            'fret'   a tall pierced fretwork screen with a scalloped inner edge at the frame side (ch11)
 *            'newel'  a carved stair newel: panelled shaft, urn finial and a balustered rail running off frame (ch13)
 *     side   'left' | 'right' frame corner (default per kind)
 *     ref    the reference camera the placement is authored at (default: the shot's current camera)
 *     alpha  0..1 (fade it out on a push-in, as nearPlane13 does)
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { toLayer, toScreen } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { addCircle, addEllipse, addFoil, addRect, at, finial, memoPath, rosette, scroll } from '../../../film/silhouette/ornament';

type C = CanvasRenderingContext2D;
export type RimNearKind = 'chair' | 'fret' | 'newel';
export interface RimNearOpts {
  kind: RimNearKind;
  side?: 'left' | 'right';
  ref?: Camera3;
  alpha?: number;
  /** size multiplier on the authored screen size (default 1) */
  scale?: number;
  /** review round 4 (ch15-s06): slide the authored anchor this many screen px (negative = left) */
  dx?: number;
  /** review round 4: the warm edge catch's strength (default 1; > 1 for a darker room) */
  rim?: number;
}

const NEAR = 'L5' as const;
const NEAR_SPEC = LAYERS.L5;
const clamp = (v: number, a: number) => Math.max(-a, Math.min(a, v));

/** a carved chair back from behind (screen px, base centre at 0,0, up = -y): ~190 wide, ~330 tall */
function chairPath(): Path2D {
  return memoPath('rimNear/chair', () => {
    const p = new Path2D();
    // stiles (turned, slightly raked) and the seat rail
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
    // the crest rail: an arched yoke with scrolled ears
    p.moveTo(-84, -276);
    p.quadraticCurveTo(-40, -318, 0, -312);
    p.quadraticCurveTo(40, -318, 84, -276);
    p.lineTo(84, -258);
    p.quadraticCurveTo(40, -290, 0, -284);
    p.quadraticCurveTo(-40, -290, -84, -258);
    p.closePath();
    at(p, scroll({ w: 34, h: 16, kind: 'C', thick: 7 }), -116, -276, 1, 1, -0.5);
    at(p, scroll({ w: 34, h: 16, kind: 'C', thick: 7 }), 116, -276, -1, 1, 0.5);
    // the vase splat, pierced: a quatrefoil eye, two teardrops and a rosette at its waist
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

/** a tall pierced fretwork screen (screen px, inner edge at x = 0, extending +x off frame), 0..720 high */
function fretPath(): Path2D {
  return memoPath('rimNear/fret', () => {
    const p = new Path2D();
    const W = 190;
    // the panel with a scalloped inner edge
    p.moveTo(W + 60, -40);
    p.lineTo(18, -40);
    for (let y = -40; y <= 760; y += 40) {
      p.quadraticCurveTo(-6, y + 20, 18, y + 40);
    }
    p.lineTo(W + 60, 800);
    p.closePath();
    // pierced lattice: quatrefoils in a square grid, alternate rows offset; a border of round eyes
    const pitch = 36;
    for (let r = 0, y = -12; y < 760; y += pitch, r++)
      for (let x = 40 + (r % 2) * (pitch / 2); x < W + 50; x += pitch) addFoil(p, x, y, pitch * 0.34, 4, { rot: Math.PI / 4, ccw: true });
    for (let y = 0; y < 760; y += 40) addCircle(p, 26, y + 20, 4.2, true);
    return p;
  });
}

/** a carved stair newel with its rail (screen px, base centre at 0,0, up = -y): shaft ~56 wide, ~360 tall */
function newelPath(dir: 1 | -1): Path2D {
  return memoPath(`rimNear/newel/${dir}`, () => {
    const p = new Path2D();
    // the plinth and panelled shaft (the panels are holes)
    addRect(p, -36, -40, 72, 40);
    addRect(p, -28, -300, 56, 262);
    addRect(p, -18, -280, 36, 96, true);
    addRect(p, -18, -170, 36, 112, true);
    addFoil(p, 0, -232, 9, 4, { ccw: true });
    // the cap and its moulding
    addRect(p, -38, -318, 76, 18);
    addRect(p, -32, -326, 64, 8);
    // the urn finial
    at(p, finial('urn', 64), 0, -326);
    // the handrail running off frame inward and up (a short flight: it stays in the lower corner), three turned
    // balusters under it and the stair's string below
    const rx = dir * 1;
    const run = 250;
    const rise = 104;
    p.moveTo(rx * 24, -286);
    p.lineTo(rx * run, -286 - rise);
    p.lineTo(rx * run, -266 - rise);
    p.lineTo(rx * 24, -266);
    p.closePath();
    for (let i = 1; i <= 3; i++) {
      const x = rx * (24 + i * 58);
      const top = -266 - (i * 58 * rise) / (run - 24);
      addRect(p, x - 4.5, top, 9, -top - 30);
      addEllipse(p, x, top + (-top - 30) * 0.58, 8.5, 15);
      addEllipse(p, x, top + 9, 6.5, 8);
    }
    p.moveTo(rx * 24, -38);
    p.lineTo(rx * run, -38 - rise);
    p.lineTo(rx * run, -12 - rise);
    p.lineTo(rx * 24, -12);
    p.closePath();
    return p;
  });
}

/** draw the room's ornamental near plane on L5 (darkest plane, pierced, rim-caught toward the stage light) */
export function rimNear(f: Frame, o: RimNearOpts): void {
  const alpha = o.alpha ?? 1;
  if (alpha <= 0.01) return;
  const kind = o.kind;
  const side = o.side ?? (kind === 'fret' ? 'right' : 'left');
  const s = o.scale ?? (kind === 'newel' ? 0.78 : 1);
  // the authored screen anchor (at the reference camera)
  const anchor = kind === 'fret' ? { x: side === 'right' ? 1280 - 118 * s : 118 * s, y: 0 } : { x: side === 'left' ? 128 * s : 1280 - 128 * s, y: 742 };
  anchor.x += o.dx ?? 0;
  // L5 (blur 4), not L6 (blur 10): a carved near plane must keep its piercings legible
  f.layer(NEAR, (c, env) => {
    // the camera the layer is composited with (a shot may set it after calling this)
    const cam = f.cam;
    const ref = o.ref ?? cam;
    const aL = toLayer(NEAR_SPEC, ref, anchor.x, anchor.y);
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
    paint(c, env, kind, side, s);
    c.restore();
  });
}

function paint(c: C, env: PaintEnv, kind: RimNearKind, side: 'left' | 'right', s: number, rimK = 1) {
  const fg = env.fill('fg');
  const rimCol = mixLab(env.mood.rim, env.mood.core, 0.4);
  // the lamp is toward the frame's centre: the ornament's inward edges catch it
  const inward = side === 'left' ? 1 : -1;
  c.scale(s, s);
  if (kind === 'fret') {
    c.scale(side === 'right' ? 1 : -1, 1);
    const p = fretPath();
    c.fillStyle = fg;
    c.fill(p, 'evenodd');
    c.save();
    c.clip(p, 'evenodd');
    c.translate(-2, 0);
    c.strokeStyle = withAlpha(rimCol, 0.5);
    c.lineWidth = 2;
    c.stroke(p);
    c.restore();
    return;
  }
  const p = kind === 'chair' ? chairPath() : newelPath(inward as 1 | -1);
  c.fillStyle = fg;
  c.fill(p, 'evenodd');
  // a warm catch on the inward-facing edges (offset copy, clipped to the shape: a crescent rim, cut-paper style)
  c.save();
  c.clip(p, 'evenodd');
  c.translate(-inward * 2.2, 1.2);
  c.strokeStyle = withAlpha(rimCol, Math.min(1, 0.55 * rimK));
  c.lineWidth = 2.4;
  c.stroke(p);
  c.restore();
}
