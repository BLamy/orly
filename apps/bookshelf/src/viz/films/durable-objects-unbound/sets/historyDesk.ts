/**
 * durable-objects-unbound — THE HISTORY DESKS (staging.buildList.historyDesk; geography ch02, ch04, ch08-s03).
 *
 * Kenton Varda's desk is ALWAYS screen-left (he faces right, his lamp on his right, warm); Ryan Dahl's desk is
 * ALWAYS screen-right (he faces left, his lamp on his left). Generic, dignified 2020s silhouettes, no likeness;
 * real people's hands stay at their desks and never touch the town. In the 2026 braid both lamps share one frame
 * and two ropes hang from the lamps' arms (braid()).
 *
 *   DESK.kenton / DESK.ryan    canonical placements (L4 world, rest-screen): desk x/y, chair, lamp, laptop, figure
 *   desk(c, env, o)            desk + chair + laptop + anglepoise lamp (ink silhouettes; lamp lit by o.lamp)
 *   deskFigure(c, env, o)      the seated figure (cast puppet) typing / thinking at the laptop, value-hierarchy rimmed
 *   deskAnchors(o)             { bulb, screen, ropeHook, chairBack } world points (attach f.practical at bulb / screen)
 *   braid(c, env, o)           two ropes from the lamp arms that swing in and cross (o.u 0..1 turns of braid)
 *   emptyChair(c, env, o)      the second, out-of-focus chair beside Ryan Dahl's desk (Bert Belder's name card)
 */
import { POSES, PUPPET_NEAR_BLACK, anglepoiseLamp, blendPose, chair, laptop, mixLab, seatHeight, withAlpha, withLife, writingDesk } from '../../../film';
import type { PaintEnv, Pose } from '../../../film';
import { cast, KENTON_RIM, RYAN_RIM, SPECS } from '../cast';
import { clamp01, glowDot, tone, type C2 } from './common';

export type DeskWho = 'kenton' | 'ryan';
export interface DeskOpts {
  who: DeskWho;
  /** desk front-centre on the floor (world) */
  x: number;
  y: number;
  /** figure + furniture scale (1 = life size next to a 320 px keeper) */
  s?: number;
  /** 0..1 the lamp lit; warmth handled by the mood */
  lamp?: number;
  /** 0..1 the laptop screen glow */
  screen?: number;
  /** era of the laptop lid (purely the lid angle): open 0..1 */
  open?: number;
}
export const DESK = {
  kenton: { who: 'kenton' as const, x: 420, y: 612, s: 1.1 },
  ryan: { who: 'ryan' as const, x: 860, y: 612, s: 1.1 },
};
const DESK_W = 140;
const CMPX = 320 / 175;
function geo(o: DeskOpts) {
  const s = o.s ?? 1;
  const f = o.who === 'kenton' ? 1 : -1; // +1: figure at left facing right (Kenton); -1: mirrored (Ryan)
  const topY = o.y - 76 * CMPX * s; // writingDesk top ≈ 76 cm
  const half = (DESK_W / 2) * CMPX * s;
  // the figure sits in front of the desk's near end, knees under the top, hands on the laptop at the near edge
  const chairAt = { x: o.x - f * (half + 34 * s), y: o.y };
  const lap = { x: o.x - f * (half - 50 * s), y: topY };
  const lampAt = { x: o.x + f * (half - 40 * s), y: topY };
  return { s, f, topY, lap, lampAt, chairAt, half };
}
/** a plain modern desk chair drawn to the figure's own seat height (seat slab, back post, swivel column, star base) */
function deskChair(c: C2, env: PaintEnv, x: number, floor: number, seatY: number, f: number, s: number): void {
  c.save();
  c.fillStyle = env.fill('ink');
  c.fillRect(x - 28 * s, seatY - 2 * s, 56 * s, 8 * s);
  c.fillRect(x - f * 30 * s - 4 * s, seatY - 104 * s, 9 * s, 106 * s);
  c.beginPath();
  c.ellipse(x - f * 28 * s, seatY - 70 * s, 8 * s, 28 * s, -0.08 * f, 0, Math.PI * 2);
  c.fill();
  c.fillRect(x - 3 * s, seatY + 6 * s, 6 * s, floor - seatY - 14 * s);
  c.fillRect(x - 30 * s, floor - 9 * s, 60 * s, 4 * s);
  for (const dx of [-28, 0, 28]) {
    c.beginPath();
    c.arc(x + dx * s, floor - 3 * s, 3 * s, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}
export function deskAnchors(o: DeskOpts) {
  const g = geo(o);
  const la = anglepoiseLamp.anchors({ x: g.lampAt.x, y: g.lampAt.y, s: g.s * 1.1, flip: g.f < 0, reach: 0.7, aim: g.f > 0 ? 2.3 : 0.84 });
  const sc = laptop.anchors({ x: g.lap.x, y: g.lap.y, s: g.s * 1.15, flip: g.f < 0, view: 'side', open: o.open ?? 1 });
  return { bulb: la.bulb, screen: sc.screen, ropeHook: la.pivot ?? la.bulb, chairBack: { x: g.chairAt.x - g.f * 30 * g.s, y: o.y - 200 * g.s } };
}
export function desk(c: C2, env: PaintEnv, o: DeskOpts): void {
  const g = geo(o);
  writingDesk(c, { x: o.x, y: o.y, w: DESK_W, s: g.s }, env);
  const id = o.who === 'kenton' ? 'kenton-varda' : 'ryan-dahl';
  deskChair(c, env, g.chairAt.x, o.y, o.y - seatHeight(SPECS[id], POSES.type) * g.s, g.f, g.s);
  laptop(c, { x: g.lap.x, y: g.lap.y, s: g.s * 1.15, flip: g.f < 0, view: 'side', open: o.open ?? 1, on: (o.screen ?? 1) > 0.05 }, env);
  anglepoiseLamp(c, { x: g.lampAt.x, y: g.lampAt.y, s: g.s * 1.1, flip: g.f < 0, lit: (o.lamp ?? 1) > 0.05, reach: 0.7, aim: g.f > 0 ? 2.3 : 0.84 }, env);
  const a = deskAnchors(o);
  if ((o.screen ?? 1) > 0.01) glowDot(c, a.screen.x, a.screen.y, 34 * g.s, tone(env, '#cfe0ff', 0.4), 0.35 * (o.screen ?? 1));
}
export interface FigureOpts extends DeskOpts {
  /** 0 typing .. 1 thinking (hand toward the chin, back from the keys) */
  think?: number;
  tq: number;
  alpha?: number;
}
export function deskFigure(c: C2, env: PaintEnv, o: FigureOpts): void {
  const g = geo(o);
  const id = o.who === 'kenton' ? 'kenton-varda' : 'ryan-dahl';
  const P = cast[id];
  const spec = SPECS[id];
  const base: Pose = blendPose(POSES.type, POSES.sit, clamp01(o.think ?? 0) * 0.7);
  const pose = withLife(base as Pose & { prev?: Pose }, o.tq, o.who === 'kenton' ? 31 : 37, 0.6);
  const rim = o.who === 'kenton' ? KENTON_RIM : RYAN_RIM;
  void spec;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  // feet on the floor (auto-grounded); the chair (desk()) is cut to this figure's seat height
  P.draw(c, {
    x: g.chairAt.x + g.f * 6 * g.s,
    y: o.y,
    facing: g.f > 0 ? 'right' : 'left',
    pose,
    scale: g.s,
    ink: PUPPET_NEAR_BLACK,
    light: { x: rim.x, y: rim.y, floor: 0.15 },
    edgeRim: rim,
  }, env);
  c.restore();
}
export interface BraidOpts {
  /** the two rope hooks (world) */
  a: { x: number; y: number };
  b: { x: number; y: number };
  /** where the braid runs to (default the midpoint below) */
  to?: { x: number; y: number };
  /** 0..1 the ropes swinging in; 1..3 additional crossings */
  u: number;
  alpha?: number;
  /** tighten into one braid (ch08-s03): 0..1 */
  tight?: number;
}
export function braid(c: C2, env: PaintEnv, o: BraidOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const swing = clamp01(o.u);
  const cross = Math.max(0, o.u - 1) + (swing >= 1 ? 1 : 0);
  const mid = o.to ?? { x: (o.a.x + o.b.x) / 2, y: Math.max(o.a.y, o.b.y) + 120 };
  const ropeA = mixLab(tone(env, '#b98a50', 0.2), env.mood.fg, 0.3);
  const ropeB = mixLab(tone(env, '#8a9aa8', 0.25), env.mood.fg, 0.3);
  c.save();
  c.globalAlpha *= A;
  c.lineCap = 'round';
  const N = 40;
  const tight = clamp01(o.tight ?? 0);
  for (const [i, col] of [[0, ropeA], [1, ropeB]] as const) {
    const from = i === 0 ? o.a : o.b;
    c.strokeStyle = col;
    c.lineWidth = 2.4;
    c.beginPath();
    for (let k = 0; k <= N; k++) {
      const u = k / N;
      // hang straight down when not swung in; otherwise curve toward the braid point and twist around the centre line
      const hx = from.x, hy = from.y + u * 260;
      const cx = from.x + (mid.x - from.x) * u, cy = from.y + (mid.y - from.y) * u + Math.sin(Math.PI * u) * 60;
      let x = hx + (cx - hx) * swing, y = hy + (cy - hy) * swing;
      const tw = Math.max(0, u - 0.45) / 0.55;
      if (tw > 0 && cross > 0) x += Math.sin(tw * Math.PI * Math.max(1, cross) + i * Math.PI) * 10 * (1 - tight * 0.7) * Math.min(1, cross);
      if (k === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  c.restore();
}
export function emptyChair(c: C2, env: PaintEnv, o: { x: number; y: number; s?: number; flip?: boolean }): void {
  chair(c, { x: o.x, y: o.y, s: o.s ?? 1, style: 'swivel', view: 'side', flip: o.flip }, env);
}
/** a desk-lamp warmth step (the lamp brightening one step on a beat) */
export const lampStep = (t: number, at: number, from = 0.75, to = 1) => from + (to - from) * clamp01((t - at) / 0.6);
export { withAlpha };
