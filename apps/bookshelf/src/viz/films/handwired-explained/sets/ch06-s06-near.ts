/**
 * handwired-explained — ch06-s06 .. ch06-s09 near plane and window veil (review round 1, owned by their reviser).
 *
 * The patterns run's four companion machines all sit in front of the clock room's bright round window; the critic
 * asked each for a dark cut-paper NEAR PLANE at a lower corner (sliding under the push) and for the window to be
 * hazed darker behind the action so the paper machines are the brightest values.
 *
 *   ch06Near(f, { key, side, cam, kind })   one carved, pierced L5 silhouette at a lower frame corner: the clockwork's
 *                                           cast bracket and a quarter gear ('bracket') or the bench's moulded edge
 *                                           with a pierced apron ('bench'). `cam` is a reference camera (mid-shot):
 *                                           the art is anchored to the frame corner there and slides with the push.
 *   windowVeil(c, env, o)                   a soft dark haze ellipse (L3) over the window behind the action plane
 *
 * Colours come from env (fg / ink / rim); art is baked once per mood and side.
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS, toLayer } from '../../../film';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';

type C2 = CanvasRenderingContext2D;

export interface NearOpts {
  key: string;
  side: 'left' | 'right';
  /** reference camera: the art meets the frame corner under this camera */
  cam: Camera3;
  kind?: 'bracket' | 'bench';
  /** screen size scale (1 = about 380 x 250 screen px) */
  size?: number;
  /** screen-px nudge of the corner anchor (positive = into frame) */
  inset?: { x: number; y: number };
  /** 'bracket': draw the cast S-scroll rising beside the gear (default true); off where a card sits above */
  scroll?: boolean;
}

const W = 420;
const H = 290;

/** the art in a W x H box, drawn for the RIGHT corner (its bottom-right is the frame corner) */
function bracketArt(cc: C2, env: PaintEnv, kind: 'bracket' | 'bench', scroll = true) {
  const ink = mixLab(env.mood.fg, PUPPET_NEAR_BLACK, 0.55);
  const rim = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.45), 0.5);
  const p = new Path2D();
  if (kind === 'bracket') {
    // a quarter gear centred off the corner: teeth on its rim, six pierced lightening holes in its web
    const gx = W - 20, gy = H + 30, R = 210, n = 44;
    for (let k = 0; k <= n; k++) {
      const a0 = Math.PI + (k / n) * (Math.PI / 2) * 1.1 - 0.05;
      const a1 = a0 + ((Math.PI / 2) * 1.1) / n;
      const am = (a0 + a1) / 2;
      const r0 = R, r1 = R + 14;
      if (k === 0) p.moveTo(gx + Math.cos(a0) * r0, gy + Math.sin(a0) * r0);
      p.lineTo(gx + Math.cos(a0 + (a1 - a0) * 0.2) * r1, gy + Math.sin(a0 + (a1 - a0) * 0.2) * r1);
      p.lineTo(gx + Math.cos(am) * r1, gy + Math.sin(am) * r1);
      p.lineTo(gx + Math.cos(a1 - (a1 - a0) * 0.2) * r0, gy + Math.sin(a1 - (a1 - a0) * 0.2) * r0);
      p.lineTo(gx + Math.cos(a1) * r0, gy + Math.sin(a1) * r0);
    }
    p.lineTo(W + 40, gy);
    p.lineTo(W + 40, H + 60);
    p.lineTo(gx - R - 20, H + 60);
    p.closePath();
    for (let k = 0; k < 4; k++) {
      const a = Math.PI + 0.22 + k * 0.42;
      const hole = new Path2D();
      hole.arc(gx + Math.cos(a) * R * 0.62, gy + Math.sin(a) * R * 0.62, R * 0.17, 0, Math.PI * 2);
      p.addPath(hole);
    }
    const hub = new Path2D();
    hub.arc(gx, gy, 34, 0, Math.PI * 2);
    p.addPath(hub);
  }
  if (kind === 'bracket' && scroll) {
    // the cast bracket rising from the bench at the left of the gear: an S-scroll with a pierced roundel
    const br = new Path2D();
    br.moveTo(40, H + 40);
    br.lineTo(40, H - 34);
    br.bezierCurveTo(40, H - 120, 110, H - 160, 150, H - 210);
    br.bezierCurveTo(168, H - 232, 196, H - 236, 206, H - 220);
    br.bezierCurveTo(214, H - 206, 200, H - 192, 186, H - 198);
    br.bezierCurveTo(150, H - 160, 78, H - 110, 72, H - 34);
    br.lineTo(72, H + 40);
    br.closePath();
    const ring = new Path2D();
    ring.arc(112, H - 128, 22, 0, Math.PI * 2);
    ring.arc(112, H - 128, 13, 0, Math.PI * 2, true);
    cc.fillStyle = ink;
    cc.fill(br);
    cc.fill(ring);
    cc.strokeStyle = rim;
    cc.lineWidth = 1.6;
    cc.beginPath();
    cc.moveTo(40, H - 34);
    cc.bezierCurveTo(40, H - 120, 110, H - 160, 150, H - 210);
    cc.bezierCurveTo(168, H - 232, 196, H - 236, 206, H - 220);
    cc.stroke();
  }
  // the bench's moulded edge across the bottom, with a pierced apron (quatrefoil-ish holes)
  const by = kind === 'bench' ? H - 92 : H - 34;
  if (kind === 'bench') {
    // the bench's inner end is carved: the top runs out to a rounded nose and a scrolled bracket under it
    p.moveTo(-40, by + 8);
    p.lineTo(W - 46, by + 0.5);
    p.bezierCurveTo(W - 20, by, W - 12, by + 14, W - 22, by + 22);
    p.lineTo(W - 40, by + 24);
    p.bezierCurveTo(W - 44, by + 60, W - 70, by + 80, W - 60, by + 120);
    p.lineTo(W - 60, H + 60);
    p.lineTo(-40, H + 60);
    p.closePath();
  } else {
    p.moveTo(-40, by + 8);
    p.lineTo(W + 40, by - 2);
    p.lineTo(W + 40, H + 60);
    p.lineTo(-40, H + 60);
    p.closePath();
  }
  if (kind === 'bench') {
    for (let k = 0; k < 5; k++) {
      const cx = 30 + k * 66, cy = by + 46;
      for (const [dx, dy] of [[-8, 0], [8, 0], [0, -8], [0, 8]]) {
        const h = new Path2D();
        h.arc(cx + dx, cy + dy, 7.5, 0, Math.PI * 2);
        p.addPath(h);
      }
    }
  }
  cc.fillStyle = ink;
  cc.fill(p, 'evenodd');
  // the lit top edge of the bench (the window is above and behind)
  cc.strokeStyle = rim;
  cc.lineWidth = 1.8;
  cc.beginPath();
  cc.moveTo(-40, by + 8.5);
  if (kind === 'bench') {
    cc.lineTo(W - 46, by + 1);
    cc.bezierCurveTo(W - 20, by + 0.5, W - 12, by + 14, W - 22, by + 22);
  } else cc.lineTo(W + 40, by - 1.5);
  cc.stroke();
  // a moulding line under the edge
  cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.5), 0.18);
  cc.lineWidth = 1.2;
  cc.beginPath();
  cc.moveTo(-40, by + 18);
  cc.lineTo(kind === 'bench' ? W - 44 : W + 40, kind === 'bench' ? by + 11 : by + 8);
  cc.stroke();
}

export function ch06Near(f: Frame, o: NearOpts) {
  const kind = o.kind ?? 'bracket';
  const s = o.size ?? 1;
  const ins = o.inset ?? { x: 0, y: 0 };
  f.layer('L5', (c, env) => {
    // the frame corner under the reference camera, in L5 layer px, and the layer px per screen px there
    const right = o.side === 'right';
    const corner = toLayer(LAYERS.L5, o.cam, right ? 1280 - ins.x : ins.x, 720 - ins.y);
    const p1 = toLayer(LAYERS.L5, o.cam, 100, 0), p0 = toLayer(LAYERS.L5, o.cam, 0, 0);
    const k = ((p1.x - p0.x) / 100) * s;
    const scroll = o.scroll ?? true;
    const draw = f.cached(`ch06near/${o.key}/${kind}/${scroll ? 's' : 'n'}/${env.mood.id}`, W + 80, H + 80, (cc) => {
      cc.translate(40, 20);
      bracketArt(cc, env, kind, scroll);
    }, { blur: 1.2 });
    c.save();
    c.translate(corner.x, corner.y);
    c.scale(right ? k : -k, k);
    draw(c, -W - 40, -H - 20);
    c.restore();
  });
}

/** a soft dark haze over the bright window behind the action plane (draw in L3, before L4) */
export function windowVeil(c: C2, env: PaintEnv, o: { x: number; y: number; rx: number; ry: number; alpha?: number }) {
  const a = o.alpha ?? 0.25;
  c.save();
  c.translate(o.x, o.y);
  c.scale(1, o.ry / o.rx);
  const g = c.createRadialGradient(0, 0, 0, 0, 0, o.rx);
  const col = mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.45);
  g.addColorStop(0, withAlpha(col, a));
  g.addColorStop(0.7, withAlpha(col, a * 0.85));
  g.addColorStop(1, withAlpha(col, 0));
  c.fillStyle = g;
  c.fillRect(-o.rx, -o.rx, o.rx * 2, o.rx * 2);
  c.restore();
}
