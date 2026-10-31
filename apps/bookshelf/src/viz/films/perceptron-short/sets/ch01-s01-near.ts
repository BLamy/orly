/**
 * perceptron-short — ch01-s01 / ch01-s02: the near (L5) chair back in the lower-right corner of the night lab.
 *
 *   nearChairBack(f, { key, alpha? })
 *
 * The edge of a lab chair's back (two splayed posts, a curved crest rail, a slotted splat), near black and
 * out of focus on the L5 plane, so the opening frames carry the reference's near / far stack (blurred near
 * silhouette, sharp eye, hazed racks, backlit glass). It is authored in the screen space of MATCH_CAM (the
 * shared cut framing), where it stands about 15% of the frame height in the lower-right corner; s01's dolly
 * grows it into that position and s02 opens on it (same world position, so the crossfade stays a
 * match-dissolve), then its push carries it out of the corner.
 */
import type { Frame } from '../../../film/contracts';
import { toLayer } from '../../../film/core/multiplane';
import { LAYERS } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { MATCH_CAM } from './ch01-s02-machine';

const PLANE = LAYERS.L5;
/** world transform of the chair's authoring space (screen px at MATCH_CAM) on the L5 plane */
const O = toLayer(PLANE, MATCH_CAM, 0, 0);
/** world px per authoring px (the layer's own rest-normalised scale at MATCH_CAM, inverted) */
const U = toLayer(PLANE, MATCH_CAM, 1, 0).x - O.x;

/** horizontal placement of the authored chair (MATCH_CAM screen px) */
const SHIFT = -250;
/** the chair back in MATCH_CAM screen px: posts rising from below the frame edge to a crest at y ≈ 606 */
const BACK = (() => {
  const p = new Path2D();
  // left post (slightly splayed outward toward the floor)
  p.moveTo(1138, 640);
  p.lineTo(1152, 636);
  p.lineTo(1146, 790);
  p.lineTo(1128, 790);
  p.closePath();
  // right post
  p.moveTo(1254, 628);
  p.lineTo(1268, 630);
  p.lineTo(1286, 790);
  p.lineTo(1268, 790);
  p.closePath();
  // crest rail: a shallow arch, thicker in the middle
  p.moveTo(1126, 636);
  p.bezierCurveTo(1160, 608, 1230, 598, 1280, 616);
  p.lineTo(1281, 634);
  p.bezierCurveTo(1232, 620, 1166, 628, 1130, 652);
  p.closePath();
  // the splat: a waisted vertical board with a cut slot
  p.moveTo(1188, 624);
  p.lineTo(1224, 620);
  p.bezierCurveTo(1216, 660, 1218, 700, 1228, 790);
  p.lineTo(1186, 790);
  p.bezierCurveTo(1196, 700, 1198, 660, 1188, 624);
  p.closePath();
  // the cut slot in the splat, wound against it so the nonzero fill leaves it open (the room shows through)
  p.moveTo(1211.5, 668);
  p.ellipse(1207, 668, 4.5, 20, 0, 0, Math.PI * 2, true);
  p.closePath();
  return p;
})();

export function nearChairBack(f: Frame, o: { key: string; alpha?: number }) {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  f.layer(PLANE, (c, env) => {
    c.save();
    c.globalAlpha = a;
    c.translate(O.x, O.y);
    c.scale(U, U);
    // authored at the corner, set into the lit gap between the eye's stand and the first rack (lower right),
    // where its cut edge reads against the blind-slatted floor light instead of vanishing into a rack
    c.translate(SHIFT, 0);
    const ink = mixLab(env.fill('fg'), '#000000', 0.62);
    c.fillStyle = ink;
    c.fill(BACK, 'nonzero');
    // a faint window rim along the top of the crest (the windows are up and behind)
    c.strokeStyle = withAlpha(env.mood.rim, 0.22);
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(1128, 634);
    c.bezierCurveTo(1162, 606, 1230, 596, 1280, 614);
    c.stroke();
    c.restore();
  });
}
