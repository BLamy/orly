/**
 * handwired-explained — KLEENE'S FINITE DIAL (ch02-s03): a brass clock dial with a fixed ring of eight stops and a
 * single pointer that can only step from stop to stop, once per tick; a punched paper strip feeds through its slot;
 * and a separate crank on its own stand, OUTSIDE the dial's frame (the tick comes from outside). The figure returns
 * in ch06 as the host clockwork.
 *
 * The machine is REAL (a finite automaton, Kleene 1951's reading of a nerve net): eight states; each tick reads one
 * column of the strip: a hole moves the pointer three stops on, no hole moves it one on. dialRun(bits, s0) returns
 * the states it visits, so every glow the shot draws is computed, never typed.
 *
 *   import { DIAL, dialRun, finiteDial, crank } from '../sets/ch02-s03-dial';
 *   finiteDial(c, env, { x, y, r, lit, pointer, glow, strip: { feed, bits } });
 *   crank(c, env, { x, y, angle });
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';

export const STOPS = 8;
export const step = (s: number, bit: number) => (s + (bit ? 3 : 1)) % STOPS;
/** the states visited reading `bits` from s0 (index 0 = s0) */
export function dialRun(bits: number[], s0: number): number[] {
  const out = [s0];
  for (const b of bits) out.push(step(out[out.length - 1], b));
  return out;
}

const brassOf = (env: PaintEnv, k = 0) => mixLab(mixLab('#a9874a', env.mood.halo, 0.3), '#f2d98e', 0.55 * k);
const lw = (c: CanvasRenderingContext2D, dev: number) => dev / (Math.hypot(c.getTransform().a, c.getTransform().b) || 1);
/** stop i's angle (stop 0 at the top, clockwise) */
export const stopAngle = (i: number) => -Math.PI / 2 + (i / STOPS) * Math.PI * 2;

export interface DialOpts {
  x: number;
  y: number;
  r: number;
  /** 0..1 the dial lit from inside (its practical) */
  lit: number;
  /** the pointer's position in stops (fractional while it steps) */
  pointer: number;
  /** per-stop glow 0..1 */
  glow?: number[];
  /** 0..1 a glint running round the eight studs (the finger counting them): the stud at index floor(count) */
  count?: number;
  /** the punched strip: feed = columns advanced past the reader (continuous); bits = the columns */
  strip?: { feed: number; bits: number[]; alpha?: number };
}

/** the dial in its square brass housing (draw in L4). Housing ±r·1.32 around (x, y). */
export function finiteDial(c: CanvasRenderingContext2D, env: PaintEnv, o: DialOpts) {
  const { x, y, r } = o;
  const H = r * 1.32;
  const ink = env.layer.haze > 0.05 ? env.fill('ink') : mixLab(PUPPET_NEAR_BLACK, env.fill('set'), 0.3);
  const lit = Math.max(0, Math.min(1, o.lit));
  c.save();
  // the housing: a square frame with a round window (the face shows through), corner screws, a slot below
  const p = new Path2D();
  p.rect(x - H, y - H, 2 * H, 2 * H);
  p.moveTo(x + r * 1.04, y);
  p.arc(x, y, r * 1.04, 0, Math.PI * 2, true);
  c.fillStyle = ink;
  c.fill(p, 'evenodd');
  // the face (paper-white enamel, cold until lit)
  const face = c.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r * 1.05);
  face.addColorStop(0, mixLab(mixLab(env.mood.haze, env.mood.rim, 0.5), '#f4e3b2', 0.5 * lit));
  face.addColorStop(1, mixLab(mixLab(env.mood.set, env.mood.haze, 0.6), env.mood.halo, 0.45 * lit));
  c.fillStyle = face;
  c.beginPath();
  c.arc(x, y, r * 1.04, 0, Math.PI * 2);
  c.fill();
  // the brass bezel
  c.strokeStyle = brassOf(env, lit * 0.6);
  c.lineWidth = Math.max(lw(c, 3), r * 0.05);
  c.stroke();
  // corner screws
  c.fillStyle = withAlpha(brassOf(env, 0.2), 0.8);
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    c.beginPath();
    c.arc(x + sx * H * 0.84, y + sy * H * 0.84, r * 0.045, 0, Math.PI * 2);
    c.fill();
  }
  // the ring of eight stops: brass studs on a ring, each a small socket that can glow
  const R = r * 0.78;
  c.strokeStyle = withAlpha(mixLab(env.mood.ink, env.mood.set, 0.3), 0.55);
  c.lineWidth = lw(c, 1.4);
  c.beginPath();
  c.arc(x, y, R, 0, Math.PI * 2);
  c.stroke();
  for (let i = 0; i < STOPS; i++) {
    const a = stopAngle(i);
    const sx = x + Math.cos(a) * R, sy = y + Math.sin(a) * R;
    const g = Math.max(0, Math.min(1, o.glow?.[i] ?? 0));
    const cnt = o.count !== undefined && Math.floor(o.count) === i ? 1 - (o.count - i) : 0;
    const k = Math.max(g, cnt);
    if (k > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const gg = c.createRadialGradient(sx, sy, 0, sx, sy, r * 0.3);
      gg.addColorStop(0, withAlpha(env.mood.core, 0.75 * k));
      gg.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = gg;
      c.fillRect(sx - r * 0.3, sy - r * 0.3, r * 0.6, r * 0.6);
      c.restore();
    }
    c.fillStyle = mixLab(brassOf(env, lit * 0.5), '#fff2c8', k * 0.7);
    c.beginPath();
    c.arc(sx, sy, r * 0.085, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(ink, 0.8);
    c.beginPath();
    c.arc(sx, sy, r * 0.035, 0, Math.PI * 2);
    c.fill();
  }
  // the pointer: one arm from the arbor to the ring (a counterweighted hand), stepping stop to stop
  const pa = stopAngle(o.pointer);
  c.save();
  c.translate(x, y);
  c.rotate(pa + Math.PI / 2);
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-r * 0.035, r * 0.22);
  c.lineTo(-r * 0.05, -R * 0.62);
  c.lineTo(0, -R * 0.9);
  c.lineTo(r * 0.05, -R * 0.62);
  c.lineTo(r * 0.035, r * 0.22);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(0, r * 0.24, r * 0.07, 0, Math.PI * 2);
  c.fill();
  c.restore();
  c.fillStyle = brassOf(env, lit);
  c.beginPath();
  c.arc(x, y, r * 0.06, 0, Math.PI * 2);
  c.fill();
  // the slot under the face, where the strip feeds through, and the reader's mark
  const sy0 = y + r * 1.13;
  c.fillStyle = withAlpha(env.mood.fg, 0.9);
  c.fillRect(x - H, sy0 - r * 0.08, 2 * H, r * 0.16);
  c.fillStyle = brassOf(env, lit * 0.5);
  c.beginPath();
  c.moveTo(x - r * 0.06, sy0 - r * 0.19);
  c.lineTo(x + r * 0.06, sy0 - r * 0.19);
  c.lineTo(x, sy0 - r * 0.1);
  c.closePath();
  c.fill();
  if (o.strip && (o.strip.alpha ?? 1) > 0.01) punchedStrip(c, env, x, sy0, r, H, o.strip);
  c.restore();
}

/** the punched paper strip running through the slot left → right; the column at the reader (x) is the one read */
function punchedStrip(c: CanvasRenderingContext2D, env: PaintEnv, x: number, y: number, r: number, H: number, s: { feed: number; bits: number[]; alpha?: number }) {
  const pitch = r * 0.36;
  const h = r * 0.15;
  const x0 = x - H - r * 1.4;
  const x1 = x + H + r * 1.4;
  c.save();
  c.globalAlpha *= s.alpha ?? 1;
  c.beginPath();
  c.rect(x0, y - h, x1 - x0, 2 * h);
  c.clip();
  const paper = mixLab(mixLab('#e9dcbc', env.mood.haze, 0.25), env.mood.halo, 0.15);
  c.fillStyle = paper;
  c.fillRect(x0, y - h * 0.8, x1 - x0, h * 1.6);
  // columns: column j sits at the reader when feed = j; earlier columns have passed to the right
  for (let j = 0; j < s.bits.length; j++) {
    const cx = x + (s.feed - j) * pitch;
    if (cx < x0 - pitch || cx > x1 + pitch) continue;
    // sprocket dots and the data hole
    c.fillStyle = withAlpha(env.mood.ink, 0.45);
    c.beginPath();
    c.arc(cx, y - h * 0.55, h * 0.12, 0, Math.PI * 2);
    c.fill();
    if (s.bits[j]) {
      c.fillStyle = withAlpha(env.mood.fg, 0.95);
      c.beginPath();
      c.arc(cx, y + h * 0.12, h * 0.34, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

/** the separate crank on its own small stand (draw in L4): angle in radians (one turn = 2π) */
export function crank(c: CanvasRenderingContext2D, env: PaintEnv, o: { x: number; y: number; angle: number; s?: number; hs?: number; glow?: number }) {
  const s = o.s ?? 1;
  // review r1 (ch02-s03): the handle and arm are scaled on their own (hs, default 1) so the crank reads as a separate
  // machine part; it carries its own cool rim and a lit brass hub
  const hs = o.hs ?? 1;
  const ink = mixLab(PUPPET_NEAR_BLACK, env.fill('set'), 0.3);
  const cool = withAlpha(mixLab(env.mood.rim, '#d6e6ff', 0.35), 0.85);
  c.save();
  c.translate(o.x, o.y);
  // the stand: a turned pillar on a foot
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-22 * s, 140 * s);
  c.lineTo(22 * s, 140 * s);
  c.lineTo(14 * s, 128 * s);
  c.lineTo(6 * s, 10 * s);
  c.lineTo(-6 * s, 10 * s);
  c.lineTo(-14 * s, 128 * s);
  c.closePath();
  c.fill();
  // its own cool rim down the pillar's lit side and across the foot
  c.strokeStyle = cool;
  c.lineWidth = lw(c, 2);
  c.beginPath();
  c.moveTo(-6 * s, 12 * s);
  c.lineTo(-14 * s, 128 * s);
  c.lineTo(-22 * s, 140 * s);
  c.stroke();
  // the hub's light (a small brass glow, warmer as it turns)
  const hubK = 0.55 + 0.45 * (o.glow ?? 0);
  c.save();
  c.globalCompositeOperation = 'lighter';
  const hg = c.createRadialGradient(0, 0, 0, 0, 0, 26 * s * hs);
  hg.addColorStop(0, withAlpha(brassOf(env, 1), 0.45 * hubK));
  hg.addColorStop(1, withAlpha(brassOf(env, 1), 0));
  c.fillStyle = hg;
  c.fillRect(-26 * s * hs, -26 * s * hs, 52 * s * hs, 52 * s * hs);
  c.restore();
  // the arm and its handle
  const L = 40 * s * hs;
  const hx = Math.cos(o.angle) * L, hy = Math.sin(o.angle) * L;
  c.strokeStyle = ink;
  c.lineCap = 'round';
  c.lineWidth = 7 * s * Math.sqrt(hs);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(hx, hy);
  c.stroke();
  // the handle: a turned grip standing off the arm's end
  c.fillStyle = ink;
  c.beginPath();
  c.ellipse(hx, hy, 6 * s * hs, 9 * s * hs, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = cool;
  c.lineWidth = lw(c, 2);
  c.beginPath();
  c.ellipse(hx, hy, 6 * s * hs, 9 * s * hs, 0, Math.PI * 1.05, Math.PI * 1.75);
  c.stroke();
  // the axle boss (lit brass)
  c.fillStyle = brassOf(env, Math.min(1, 0.5 + (o.glow ?? 0)));
  c.beginPath();
  c.arc(0, 0, 9 * s * Math.sqrt(hs), 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#f2d98e', 0.4), 0.8);
  c.lineWidth = lw(c, 2);
  c.beginPath();
  c.arc(0, 0, 9 * s * Math.sqrt(hs), Math.PI * 1.1, Math.PI * 1.9);
  c.stroke();
  c.restore();
}
/** the crank handle's world point at an angle */
export const crankHandle = (o: { x: number; y: number; angle: number; s?: number; hs?: number }) => ({ x: o.x + Math.cos(o.angle) * 40 * (o.s ?? 1) * (o.hs ?? 1), y: o.y + Math.sin(o.angle) * 40 * (o.s ?? 1) * (o.hs ?? 1) });
