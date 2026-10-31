/**
 * neural-net-history — ch01-s01 / ch01-s02 additions to the shared DARK ROOM (sets/darkRoom.ts), kept
 * out of the shared set so ch12-s06 is untouched:
 *
 *   roomPlant(f, { key, cams })        a tall rubber-plant silhouette in a pot on the near plane (L5, left),
 *                                      blurred by the layer: the room's foreground depth cue
 *   screenField(c, env, { glow })      the chat box inside the laptop screen: one soft input field near the
 *                                      bottom (where the cursor blinks), nothing readable, no logo
 *   roomVignette(f, k)                 a soft ink vignette (fg) that keeps the corners of the room dark
 *   SCREEN_FIELD                       the field rectangle (L4 world), for the cursor and ch01-s02's sticks
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/silhouette/atmosphere';
import { DARK } from './darkRoom';

const S = DARK.screen;
/** the chat box's input field inside the screen (L4 world) */
export const SCREEN_FIELD = { x: S.x + 12, y: S.y + S.h - 40, w: S.w - 24, h: 28 } as const;
/** the person's seat (feet x): closer to the desk than the shared set's, so the hands reach the keys */
export const PERSON_X = 548;
/** the text cursor, inside the field */
export const SCREEN_CURSOR = { x: S.x + 22, y: S.y + S.h - 32, w: 3.5, h: 12 } as const;

export function screenField(c: CanvasRenderingContext2D, env: PaintEnv, o: { glow?: number; alpha?: number } = {}) {
  const g = o.glow ?? 1;
  const A = o.alpha ?? 1;
  const F = SCREEN_FIELD;
  const m = env.mood;
  c.save();
  c.globalAlpha *= A;
  // the field: a slightly brighter rounded box with a hairline edge
  const r = 6;
  const path = new Path2D();
  path.moveTo(F.x + r, F.y);
  path.arcTo(F.x + F.w, F.y, F.x + F.w, F.y + F.h, r);
  path.arcTo(F.x + F.w, F.y + F.h, F.x, F.y + F.h, r);
  path.arcTo(F.x, F.y + F.h, F.x, F.y, r);
  path.arcTo(F.x, F.y, F.x + F.w, F.y, r);
  path.closePath();
  c.fillStyle = withAlpha(mixLab(m.halo, m.core, 0.55), 0.38 * g);
  c.fill(path);
  c.strokeStyle = withAlpha(m.core, 0.55 * g);
  c.lineWidth = 1;
  c.stroke(path);
  // a send notch at the field's right end (a small square, no glyph)
  c.fillStyle = withAlpha(mixLab(m.set, m.halo, 0.5), 0.55 * g);
  c.fillRect(F.x + F.w - 20, F.y + 7, 13, 14);
  // the screen's own faint top band and side gutter (shape only, unreadable)
  c.fillStyle = withAlpha(mixLab(m.set, m.halo, 0.6), 0.25 * g);
  c.fillRect(S.x, S.y, S.w, 9);
  c.restore();
}

// ---------------------------------------------------------------- the near-plane plant (L5)
function leaf(p: Path2D, x: number, y: number, len: number, ang: number, wid: number) {
  const ca = Math.cos(ang), sa = Math.sin(ang);
  const P = (u: number, v: number): [number, number] => [x + ca * u - sa * v, y + sa * u + ca * v];
  const a = P(0, 0), b1 = P(len * 0.35, -wid), b2 = P(len * 0.85, -wid * 0.7), tip = P(len, 0);
  const c2 = P(len * 0.85, wid * 0.7), c1 = P(len * 0.35, wid);
  p.moveTo(a[0], a[1]);
  p.bezierCurveTo(b1[0], b1[1], b2[0], b2[1], tip[0], tip[1]);
  p.bezierCurveTo(c2[0], c2[1], c1[0], c1[1], a[0], a[1]);
  p.closePath();
}

/** `lift` (default 0) mixes the plant's ink toward the set colour, so a shot can keep its figure the darkest shape */
export function roomPlant(f: Frame, o: { key: string; cams: Camera3[]; x?: number; floor?: number; alpha?: number; lift?: number }) {
  const x0 = o.x ?? 92;
  const floor = o.floor ?? 770;
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, o.cams, 30);
    const bx = Math.min(r.x, x0 - 260), by = 180, bw = 560, bh = floor + 60 - by;
    const lift = o.lift ?? 0;
    f.cached(`${o.key}/plant/${env.mood.id}/${x0},${floor}/${lift}`, bw, bh, (cc) => {
      cc.translate(-bx, -by);
      const ink0 = mixLab(env.fill('ink'), env.mood.fg, 0.5);
      const ink = lift > 0 ? mixLab(ink0, env.mood.set, lift) : ink0;
      cc.fillStyle = ink;
      // the pot: a tapered cylinder with a lip
      cc.beginPath();
      cc.moveTo(x0 - 62, floor - 150);
      cc.lineTo(x0 + 62, floor - 150);
      cc.lineTo(x0 + 48, floor);
      cc.lineTo(x0 - 48, floor);
      cc.closePath();
      cc.fill();
      cc.fillRect(x0 - 68, floor - 162, 136, 14);
      // stems and leaves (a rubber plant: big glossy ovals alternating up three stems)
      const leaves = new Path2D();
      const stems = [
        { dx: -10, h: 400, lean: -0.16 },
        { dx: 8, h: 330, lean: 0.12 },
        { dx: 22, h: 250, lean: 0.32 },
      ];
      cc.strokeStyle = ink;
      cc.lineCap = 'round';
      stems.forEach((st, si) => {
        const sx = x0 + st.dx, sy = floor - 160;
        const tx = sx + Math.sin(st.lean) * st.h, ty = sy - Math.cos(st.lean) * st.h;
        cc.lineWidth = 5 - si;
        cc.beginPath();
        cc.moveTo(sx, sy);
        cc.quadraticCurveTo(sx + (tx - sx) * 0.3, sy - st.h * 0.55, tx, ty);
        cc.stroke();
        const n = 6 - si;
        for (let i = 0; i < n; i++) {
          const u = 0.25 + (i / n) * 0.75;
          const lx = sx + (tx - sx) * u * u, ly = sy + (ty - sy) * u;
          const side = i % 2 === 0 ? 1 : -1;
          const ang = -Math.PI / 2 + side * (0.75 + hash1(i + si * 9, 31) * 0.5) + st.lean;
          leaf(leaves, lx, ly, 84 + hash1(i + si * 7, 32) * 40 - i * 4, ang, 24 + hash1(i, 33 + si) * 8);
        }
        // the top bud leaf, upright
        leaf(leaves, tx, ty, 70, -Math.PI / 2 + st.lean * 1.4, 16);
      });
      cc.fill(leaves);
      // a faint rim on the leaves' window side (the right), from the screen and the city
      cc.save();
      cc.clip(leaves);
      cc.strokeStyle = withAlpha(env.mood.rim, 0.16);
      cc.lineWidth = 2.2;
      cc.translate(-2, 0);
      cc.stroke(leaves);
      cc.restore();
    })(c, bx, by);
  });
}

export function roomVignette(f: Frame, k = 1) {
  const c = f.c;
  c.save();
  const g = c.createRadialGradient(700, 420, 240, 700, 420, 860);
  g.addColorStop(0, withAlpha(f.mood.fg, 0));
  g.addColorStop(0.55, withAlpha(f.mood.fg, 0.22 * k));
  g.addColorStop(1, withAlpha(f.mood.fg, 0.72 * k));
  c.fillStyle = g;
  c.fillRect(-20, -20, 1320, 760);
  c.restore();
}
