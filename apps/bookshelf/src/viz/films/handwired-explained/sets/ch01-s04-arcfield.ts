/**
 * handwired-explained — ch01-s04: the HandwiredOS wallpaper staged in depth, a cathedral of arcs (one per weight).
 *
 * DATA (style bible §6, script ch01-s04): every arc comes from the compiled HandwiredOS circuit export (sets/circuit.ts,
 * chenglou/handwired@257856e, CIRCUIT.arcs: [value read, operation that reads it, sign]). The 9,909 arcs are dealt
 * round-robin onto ARC_PLANES (arc i on plane i mod 6), so every arc is drawn exactly once and none is invented; each
 * plane draws its share in the SAME rest-screen rect, laid out as src/handwiredos/wiring.ts lays the wallpaper (value
 * x from valueX, the upper half of an ellipse standing on the base line, copper for +1 adding, indigo for -1
 * subtracting). At the camera's rest position the planes coincide into one flat wallpaper; a dolly separates them in
 * depth (near planes grow faster), so the far arcs haze toward the backlight and the near ones part to either side.
 *
 *   arcPlane(f, c, env, p, o)   bake + draw plane p's arcs (call inside f.layer(ARC_PLANES[p], ...)); o.res = the
 *                               largest rest scale the shot's camera reaches on that plane (keeps hairlines crisp)
 *   pickArc(p, sign, cx, rad)   the real arc on plane p whose rest-screen centre / radius are nearest (cx, rad)
 *   arcGeom(i)                  rest-screen centre, radius and height of arc i (for highlighting it live)
 */
import type { Frame, LayerSpec, PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { CIRCUIT, OS_COLORS, valueX } from './circuit';

/** far → near; plane 4 is the sharp action plane (z = ZA) */
export const ARC_PLANES: LayerSpec[] = [
  { id: 'arcs-far', z: 3600, haze: 0.6, blur: 2.4 },
  { id: 'arcs-back', z: 2500, haze: 0.44, blur: 1.6 },
  { id: 'arcs-mid', z: 1800, haze: 0.3, blur: 1.0 },
  { id: 'arcs-near-mid', z: 1350, haze: 0.16, blur: 0.5 },
  { id: 'L4', z: 1000, haze: 0.03, blur: 0 },
  { id: 'arcs-lens', z: 780, haze: 0, blur: 3.5 },
];
export const NP = ARC_PLANES.length;
/** the wallpaper rect every plane shares (rest-screen px): arcs stand on y + h */
export const FIELD = { x: -70, y: 70, w: 1420, h: 600 } as const;
const HPR = Math.min(FIELD.h / (FIELD.w / 2), 1.25);

/** per plane: line width (rest px), per-arc alpha, and 'card' = drawn as dark foil card (the lens plane) */
const STYLE = [
  { lw: 0.5, a: 0.09, card: false },
  { lw: 0.6, a: 0.12, card: false },
  { lw: 0.7, a: 0.16, card: false },
  { lw: 0.8, a: 0.22, card: false },
  { lw: 1.0, a: 0.5, card: false },
  { lw: 2.8, a: 0.78, card: true },
];

export function arcGeom(i: number) {
  const a = CIRCUIT.arcs[i];
  const x0 = FIELD.x + valueX(a[0]) * FIELD.w;
  const x1 = FIELD.x + valueX(a[1]) * FIELD.w;
  const rad = (x1 - x0) / 2;
  return { cx: x0 + rad, rad, h: rad * HPR, base: FIELD.y + FIELD.h, sign: a[2] };
}

export function pickArc(p: number, sign: number, cx: number, rad: number): number {
  let best = -1, score = Infinity;
  for (let i = p; i < CIRCUIT.arcs.length; i += NP) {
    if (CIRCUIT.arcs[i][2] !== sign) continue;
    const g = arcGeom(i);
    if (g.rad <= 0) continue;
    const sc = Math.abs(g.cx - cx) + 1.2 * Math.abs(g.rad - rad);
    if (sc < score) {
      score = sc;
      best = i;
    }
  }
  return best;
}

/** the two inks for a plane: the stylesheet's copper and indigo, lifted toward the lamp and hazed with depth */
export function arcInks(env: PaintEnv) {
  const h = env.layer.haze;
  const copper = mixLab(mixLab(OS_COLORS.copper, env.mood.core, 0.3), env.mood.haze, h * 0.9);
  const indigo = mixLab(mixLab(OS_COLORS.indigo, '#b9c4da', 0.3), env.mood.haze, h * 0.9);
  return { copper, indigo };
}
/** the lens plane's dark foil card: near-black, a breath of the arc's colour */
export function cardInks(env: PaintEnv) {
  // review r1: the nearest plane is the cathedral's value anchor: set ink, silhouettes against the backlight glow
  const ink = mixLab(env.mood.ink, '#000000', 0.35);
  return { copper: mixLab(ink, OS_COLORS.copper, 0.12), indigo: mixLab(ink, OS_COLORS.indigo, 0.16) };
}
/** review r1: on the sharp planes (3, 4) the subtracting arcs separate from the copper: cooler, lighter, +20 % alpha */
const INDIGO_SEP = [0, 0, 0, 0.35, 0.35, 0];

export function arcPlane(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, p: number, o: { res?: number; key?: string } = {}) {
  const pad = 40;
  const W = FIELD.w + 2 * pad, H = FIELD.h + 2 * pad;
  // res: supersample the bake for the push (Frame.cached's runtime accepts it; contracts type only names blur)
  const opts: { blur?: number; res?: number } = { res: o.res ?? 1 };
  const draw = f.cached(`ch01-s04/arcs/r1/${o.key ?? ''}/${p}/${env.mood.id}`, W, H, (cc) => {
    cc.translate(-FIELD.x + pad, -FIELD.y + pad);
    const st = STYLE[p];
    const inks = st.card ? cardInks(env) : arcInks(env);
    const copper = inks.copper;
    const indigo = INDIGO_SEP[p] > 0 ? mixLab(inks.indigo, '#c4d4f4', INDIGO_SEP[p]) : inks.indigo;
    const rim = mixLab(env.mood.rim, env.mood.core, 0.4);
    const base = FIELD.y + FIELD.h;
    cc.lineWidth = st.lw;
    // subtracts first, then adds over them (wiring.ts order); one stroke per arc so overlaps build into bands
    for (const sign of [-1, 1]) {
      cc.strokeStyle = withAlpha(sign > 0 ? copper : indigo, sign < 0 && INDIGO_SEP[p] > 0 ? Math.min(1, st.a * 1.2) : st.a);
      for (let i = p; i < CIRCUIT.arcs.length; i += NP) {
        const a = CIRCUIT.arcs[i];
        if (a[2] !== sign) continue;
        const x0 = FIELD.x + valueX(a[0]) * FIELD.w;
        const x1 = FIELD.x + valueX(a[1]) * FIELD.w;
        const rad = (x1 - x0) / 2;
        if (rad <= 0) continue;
        cc.beginPath();
        cc.ellipse(x0 + rad, base, rad, rad * HPR, 0, Math.PI, 2 * Math.PI);
        cc.stroke();
      }
    }
    // the rim on each arc's upper edge (foil-thin card catching the backlight): nearer planes only
    if (p === 3 || p === 4) {
      cc.lineWidth = st.lw * 0.6;
      cc.strokeStyle = withAlpha(rim, p === 4 ? 0.22 : 0.08);
      cc.beginPath();
      for (let i = p; i < CIRCUIT.arcs.length; i += NP) {
        const a = CIRCUIT.arcs[i];
        const x0 = FIELD.x + valueX(a[0]) * FIELD.w;
        const x1 = FIELD.x + valueX(a[1]) * FIELD.w;
        const rad = (x1 - x0) / 2;
        if (rad < 6) continue;
        const ry = rad * HPR;
        cc.moveTo(x0 + 0.3, base - 0.9);
        cc.ellipse(x0 + rad, base - 0.9, rad - 0.3, ry, 0, Math.PI, 2 * Math.PI);
      }
      cc.stroke();
    }
  }, opts);
  draw(c, FIELD.x - pad, FIELD.y - pad);
  return draw;
}
