/**
 * ch05-s07 — the stage's near plane (review r4, art: "add a dark L5 foreground element (desk edge, a card-cabinet
 * corner or a terminal cable) at a lower corner with clamped parallax during the pan from 'never' to 'philosopher'").
 *
 *   cardCabinetNear(f, { ref, alpha })
 *     The corner of a card-catalogue cabinet at the lower LEFT frame edge: two columns of small drawers, each with a
 *     label holder and a cup pull, the inward edges caught by the candle. It stands left of the ward door at the
 *     door framing (`ref`), so it never covers the door, its portholes or the sill. Like the kit's rimNear it slides
 *     with a share of its true L5 travel (45 %), clamped to ±70 px, so it reads as a near plane through the push and
 *     the truck without ever wandering into the picture. Darker than the figures (env 'fg').
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { toLayer, toScreen } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';

type C = CanvasRenderingContext2D;
const SPEC = LAYERS.L5;
const clamp = (v: number, a: number) => Math.max(-a, Math.min(a, v));

/** the authored box at the reference camera, in screen px: the cabinet's inner edge at x = W0, its top at y = TOP */
const W0 = 104;
const TOP = 404;

function cabinet(c: C, env: PaintEnv) {
  const fg = env.fill('fg');
  const rim = mixLab(env.mood.rim, env.mood.core, 0.35);
  const x0 = -60, x1 = W0, y0 = TOP, y1 = 760;
  // the carcass, a top board with a small overhang and a moulding
  const body = new Path2D();
  body.rect(x0, y0 + 11, x1 - x0, y1 - y0 - 11);
  body.rect(x0, y0, x1 - x0 + 8, 11);
  // drawer gaps as cut-through hairlines (holes, evenodd): two columns, rows of 46 px
  const cols = [x0 + 6, (x0 + x1) / 2 + 2];
  const cw = (x1 - x0) / 2 - 10;
  for (let r = 0; r < 7; r++) {
    const yy = y0 + 22 + r * 46;
    for (const cx of cols) {
      body.rect(cx, yy, cw, 1.6);
      body.rect(cx, yy + 40, cw, 1.6);
    }
  }
  c.fillStyle = fg;
  c.fill(body, 'evenodd');
  // label holders and cup pulls, cut-lines catching the candle on the inward (right) side
  c.strokeStyle = withAlpha(rim, 0.42);
  c.lineWidth = 1.4;
  for (let r = 0; r < 7; r++) {
    const yy = y0 + 22 + r * 46;
    for (const cx of cols) {
      const mx = cx + cw / 2;
      c.strokeRect(mx - 11, yy + 9, 22, 11);
      c.beginPath();
      c.arc(mx, yy + 27, 7, 0.15 * Math.PI, 0.85 * Math.PI);
      c.stroke();
    }
  }
  // the inward edge and the top board catch the light
  c.fillStyle = withAlpha(rim, 0.5);
  c.fillRect(x1 - 1.6, y0 + 11, 1.6, y1 - y0);
  c.fillRect(x0, y0, x1 - x0 + 8, 1.4);
}

export function cardCabinetNear(f: Frame, o: { ref: Camera3; alpha?: number }): void {
  const alpha = o.alpha ?? 1;
  if (alpha <= 0.01) return;
  const anchor = { x: 0, y: 0 };
  f.layer('L5', (c, env) => {
    const cam = f.cam;
    const aL = toLayer(SPEC, o.ref, anchor.x, anchor.y);
    const sNow = toScreen(SPEC, cam, aL.x, aL.y);
    const dx = clamp(0.45 * (sNow.x - anchor.x), 70);
    const dy = clamp(0.45 * (sNow.y - anchor.y), 24);
    const p0 = toLayer(SPEC, cam, 0, 0);
    const p1 = toLayer(SPEC, cam, 1, 0);
    const k = p1.x - p0.x;
    c.save();
    c.translate(p0.x, p0.y);
    c.scale(k, k);
    c.translate(anchor.x + dx, anchor.y + dy);
    c.globalAlpha *= alpha;
    cabinet(c, env);
    c.restore();
  });
}
