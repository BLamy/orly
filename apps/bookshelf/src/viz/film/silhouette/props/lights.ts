/**
 * Light-giving props. Each is a Painter (c, opts, env) + .anchors(o) + .bounds(o).
 * Place with { x, y } = base centre on the table/floor (world px), s = scale, flip.
 * Real size at s = 1 (cm → CM px). Attach Frame.practical() at the returned anchor.
 *
 *   candlestick({ x, y, variant?: 'table'|'tall'|'chamber', lit?: true, burn?: 0..1, seed? })
 *       anchors: flame, wick, grip                 (table ≈ 38 cm, tall ≈ 62 cm)
 *   oilLamp({ x, y, lit?, wick?: 0..1, seed? })   anchors: flame, chimneyTop      (≈ 46 cm)
 *   bankersLamp({ x, y, lit?, seed? })            anchors: bulb, pool, chain        (≈ 40 cm)
 *   anglepoiseLamp({ x, y, lit?, reach?: 0..1, aim?: rad, seed? })
 *       anchors: bulb, pivot, beamDir (a point 1 m along the beam)               (≈ 60–75 cm)
 *
 * Flames sway/flicker deterministically from env.t and seed (style bible §2.5).
 * Lit lamps paint their own emissive parts (flame, bulb, light pool); the room
 * glow is Frame.practical()'s job (or propGlow() in galleries).
 */
import {
  type PropAt,
  bar,
  beam,
  circle,
  cut,
  defineProp,
  ellipse,
  fillInk,
  flame,
  flicker,
  lamp,
  lathe,
  memo,
  poly,
  rrect,
  sway,
  veil,
} from './_kit';

// ---------------------------------------------------------------------------
// Candlestick
// ---------------------------------------------------------------------------
export interface CandlestickOpts extends PropAt {
  variant?: 'table' | 'tall' | 'chamber';
  lit?: boolean;
  /** 0 = new candle, 1 = burnt to the socket */
  burn?: number;
  seed?: number;
}

type Prof = Array<[number, number] | [number, number, number]>;
const CANDLE_PROF: Record<NonNullable<CandlestickOpts['variant']>, { stick: Prof; socket: number; pan: number; candle: number }> = {
  table: {
    stick: [
      [7.4, 0, 1], [7.4, -0.7, 1], [6.9, -1.2], [5.6, -1.9], [4.7, -2.4, 1], [4.7, -2.9, 1], [3.4, -3.3],
      [2.1, -4.3], [1.4, -5.6], [1.25, -6.6], [2.3, -7.4, 1], [2.3, -8.0, 1], [1.1, -8.7], [0.95, -10.4],
      [1.5, -12.4], [2.05, -14.2], [1.8, -15.6], [1.05, -16.7], [0.85, -17.6], [1.7, -18.3, 1], [1.7, -18.9, 1],
      [0.95, -19.5], [0.8, -21.2], [1.15, -22.0, 1], [1.15, -22.6, 1],
    ],
    pan: -22.6,
    socket: -25.2,
    candle: 15,
  },
  tall: {
    stick: [
      [10.5, 0, 1], [10.5, -1.0, 1], [9.6, -1.8], [7.2, -3.0], [6.2, -3.6, 1], [6.2, -4.3, 1], [4.0, -5.0],
      [2.4, -6.6], [1.6, -8.6], [1.45, -10.2], [2.8, -11.2, 1], [2.8, -12.0, 1], [1.3, -13.0], [1.1, -16],
      [1.7, -20.5], [2.6, -24.0], [2.4, -26.6], [1.3, -28.6], [1.0, -30.0], [2.1, -31.0, 1], [2.1, -31.8, 1],
      [1.1, -32.6], [0.95, -36.0], [1.3, -38.5], [1.6, -40.2], [1.2, -41.6], [0.9, -42.6], [1.6, -43.4, 1],
      [1.6, -44.1, 1], [0.9, -44.8], [0.85, -46.0], [1.2, -46.6, 1], [1.2, -47.2, 1],
    ],
    pan: -47.2,
    socket: -49.8,
    candle: 13,
  },
  chamber: {
    stick: [[1.6, -1.2, 1], [1.6, -1.8, 1], [1.0, -2.4], [0.9, -3.6], [1.3, -4.4, 1], [1.3, -4.9, 1]],
    pan: -4.9,
    socket: -7.2,
    candle: 10,
  },
};

function candlePath(v: NonNullable<CandlestickOpts['variant']>): Path2D {
  return memo(`candle:${v}`, () => {
    const P = CANDLE_PROF[v];
    const p = new Path2D();
    lathe(P.stick, 0, p);
    // drip pan (bobeche) with a rolled lip
    const pr = v === 'tall' ? 5.2 : v === 'chamber' ? 2.6 : 4.2;
    lathe([[pr, P.pan + 0.2, 1], [pr + 0.35, P.pan - 0.5], [pr * 0.82, P.pan - 0.85], [1.3, P.pan - 1.0, 1]], 0, p);
    // socket cup with a moulded rim
    lathe([[1.25, P.pan - 0.8, 1], [1.45, P.pan - 1.6], [1.4, P.socket + 0.7], [1.75, P.socket + 0.35, 1], [1.75, P.socket, 1]], 0, p);
    if (v === 'chamber') {
      // saucer and finger ring
      lathe([[8.2, 0, 1], [8.6, -0.5], [8.4, -1.2, 1], [6.6, -1.0], [1.6, -1.3, 1]], 0, p);
      const ring = new Path2D();
      circle(ring, 9.0, -3.1, 2.1);
      circle(ring, 9.0, -3.1, 1.25, true);
      p.addPath(ring);
      poly(p, [7.6, -1.2, 8.6, -1.2, 8.1, -2.2]);
    }
    return p;
  });
}

function candleBody(len: number, seed: number): Path2D {
  const L = Math.round(len * 4) / 4;
  return memo(`candleBody:${L}:${seed % 7}`, () => {
    const p = new Path2D();
    const r = 1.05;
    // a tapered candle with a softened, melted crown and two wax drips
    p.moveTo(-r, 0);
    p.lineTo(-r * 0.97, -L + 0.5);
    p.quadraticCurveTo(-r * 0.9, -L - 0.05, -0.35, -L + 0.15);
    p.lineTo(0.35, -L + 0.15);
    p.quadraticCurveTo(r * 0.9, -L - 0.05, r * 0.97, -L + 0.5);
    p.lineTo(r, 0);
    p.closePath();
    const s = (seed % 7) / 7;
    const drip = (side: number, len2: number, w: number) => {
      const x = side * r * 0.98;
      const y0 = -L + 0.6;
      p.moveTo(x, y0);
      p.quadraticCurveTo(x + side * w, y0 + len2 * 0.5, x + side * w * 0.6, y0 + len2);
      p.arc(x + side * w * 0.35, y0 + len2, w * 0.36, 0, Math.PI, side < 0);
      p.lineTo(x, y0 + len2 * 0.4);
      p.closePath();
    };
    drip(1, Math.min(L * 0.5, 2.2 + s * 2.4), 0.42);
    drip(-1, Math.min(L * 0.35, 1.2 + s * 1.3), 0.32);
    return p;
  });
}

function candleGeom(o: CandlestickOpts) {
  const v = o.variant ?? 'table';
  const P = CANDLE_PROF[v];
  const len = Math.max(0.6, P.candle * (1 - Math.min(1, Math.max(0, o.burn ?? 0.15))));
  const wickY = P.socket - len - 0.1;
  return { v, P, len, wickY };
}

export const candlestick = defineProp<CandlestickOpts, 'flame' | 'wick' | 'grip'>(
  (c, o, env) => {
    const { v, P, len, wickY } = candleGeom(o);
    const seed = o.seed ?? 3;
    fillInk(c, env, candlePath(v), 'evenodd');
    c.save();
    c.translate(0, P.socket);
    fillInk(c, env, candleBody(len, seed));
    c.restore();
    // highlights: a hairline on the pan lip and the knops catch the light
    const hl = memo(`candleHL:${v}`, () => {
      const p = new Path2D();
      const pr = v === 'tall' ? 5.2 : v === 'chamber' ? 2.6 : 4.2;
      p.moveTo(-pr * 0.7, P.pan - 0.75);
      p.lineTo(pr * 0.7, P.pan - 0.75);
      for (const q of P.stick) if (q[2] === 1 && q[0] > 1.5 && q[1] < -1) {
        p.moveTo(-q[0] * 0.7, q[1] - 0.3);
        p.lineTo(q[0] * 0.7, q[1] - 0.3);
      }
      return p;
    });
    cut(c, env, hl, 0.32, 1.1);
    // wick
    c.strokeStyle = env.fill('ink');
    c.lineWidth = 0.18;
    c.beginPath();
    c.moveTo(0, wickY + 0.2);
    c.quadraticCurveTo(0.1, wickY - 0.4, sway(env.t, seed) * 0.25, wickY - 0.75);
    c.stroke();
    if (o.lit !== false) {
      const k = flicker(env.t, seed);
      // warm the candle crown where the flame melts it
      const g = c.createRadialGradient(0, wickY, 0, 0, wickY, 2.2);
      g.addColorStop(0, lamp(env, 0.6, 0.55 * k));
      g.addColorStop(1, lamp(env, 0, 0));
      c.fillStyle = g;
      c.fillRect(-2.2, wickY - 2.2, 4.4, 3.4);
      flame(c, env, 0, wickY - 0.1, 3.3 * (v === 'chamber' ? 0.9 : 1), seed, k);
    }
  },
  (o) => {
    const { wickY } = candleGeom(o);
    return {
      flame: { x: 0, y: wickY - 1.6 },
      wick: { x: 0, y: wickY },
      grip: { x: o.variant === 'chamber' ? 9 : 0, y: o.variant === 'chamber' ? -3.1 : CANDLE_PROF[o.variant ?? 'table'].pan * 0.45 },
    };
  },
  (o) => {
    const { v, wickY } = candleGeom(o);
    const w = v === 'tall' ? 10.5 : v === 'chamber' ? 11.2 : 7.4;
    return { x: -w, y: wickY - 4, w: w * 2, h: -wickY + 4 };
  },
);

// ---------------------------------------------------------------------------
// Oil lamp (hurricane / Argand-style table lamp)
// ---------------------------------------------------------------------------
export interface OilLampOpts extends PropAt {
  lit?: boolean;
  /** wick height 0..1 (flame size) */
  wick?: number;
  seed?: number;
}

const OIL_BODY = () =>
  memo('oil:body', () => {
    const p = new Path2D();
    lathe(
      [
        [7.2, 0, 1], [7.2, -0.8, 1], [6.2, -1.6], [4.2, -2.4], [3.2, -3.0, 1], [3.2, -3.6, 1], [1.8, -4.6], [1.5, -7.0],
        [2.4, -8.0, 1], [2.4, -8.6, 1], [4.6, -9.8], [7.6, -12.0], [8.6, -14.4], [8.0, -16.8], [5.6, -18.8],
        [3.0, -19.6, 1], [3.0, -20.4, 1], [4.6, -20.9, 1], [4.6, -21.7, 1], [3.6, -22.1, 1], [3.6, -23.3, 1],
      ],
      0,
      p,
    );
    // burner gallery prongs
    for (const x of [-3.4, -1.2, 1.2, 3.4]) poly(p, [x - 0.3, -23.2, x + 0.3, -23.2, x * 1.08 + 0.15, -25.4, x * 1.08 - 0.15, -25.4]);
    // wick thumbwheel
    circle(p, 5.1, -21.9, 1.25);
    poly(p, [3.5, -21.6, 5.1, -22.3, 5.1, -21.4]);
    return p;
  });

const OIL_CHIMNEY = () =>
  memo('oil:chimney', () => {
    const outer: Array<[number, number] | [number, number, number]> = [
      [3.3, -23.3, 1], [3.6, -24.6], [5.6, -27.2], [6.2, -30.4], [5.0, -33.6], [2.6, -36.6], [2.2, -40.6], [2.4, -45.2, 1],
    ];
    const p = new Path2D();
    lathe(outer, 0, p);
    const edge = new Path2D();
    lathe(outer, 0, edge);
    // a thin bright sliver along the right side of the glass
    const sheen = new Path2D();
    sheen.moveTo(4.1, -26.6);
    sheen.quadraticCurveTo(5.6, -30.2, 4.2, -33.4);
    return { p, edge, sheen };
  });

export const oilLamp = defineProp<OilLampOpts, 'flame' | 'chimneyTop'>(
  (c, o, env) => {
    const seed = o.seed ?? 5;
    const ch = OIL_CHIMNEY();
    const lit = o.lit !== false;
    const k = flicker(env.t, seed);
    // glass: translucent veil, warmed from inside when lit
    veil(c, env, ch.p, 0.14);
    if (lit) {
      const g = c.createRadialGradient(0, -27.5, 0, 0, -28, 7);
      g.addColorStop(0, lamp(env, 0.7, 0.55 * k));
      g.addColorStop(1, lamp(env, 0, 0.04));
      c.fillStyle = g;
      c.fill(ch.p);
    }
    cut(c, env, ch.edge, 0.55, 1.3);
    cut(c, env, ch.sheen, 0.6, 1.6);
    fillInk(c, env, OIL_BODY(), 'evenodd');
    // font highlights
    const hl = memo('oil:hl', () => {
      const p = new Path2D();
      p.moveTo(-6.6, -12.6);
      p.quadraticCurveTo(0, -11.6, 6.6, -12.6);
      p.moveTo(-2.6, -20.8);
      p.lineTo(2.6, -20.8);
      return p;
    });
    cut(c, env, hl, 0.35, 1.1);
    if (lit) {
      // a broad flat-wick flame
      const w = o.wick ?? 0.6;
      const h = 2.4 + 3.6 * w;
      flame(c, env, 0, -24.0, h, seed, k);
      flame(c, env, -0.55, -24.0, h * 0.8, seed + 9, k);
      flame(c, env, 0.55, -24.0, h * 0.8, seed + 13, k);
    }
  },
  (o) => ({ flame: { x: 0, y: -26 - 2 * (o.wick ?? 0.6) }, chimneyTop: { x: 0, y: -45.2 } }),
  () => ({ x: -8.6, y: -45.5, w: 17.2, h: 45.5 }),
);

// ---------------------------------------------------------------------------
// Banker's lamp (green-glass shade, brass harp)
// ---------------------------------------------------------------------------
export interface BankersLampOpts extends PropAt {
  lit?: boolean;
  seed?: number;
}

const BANKER = () =>
  memo('banker', () => {
    const p = new Path2D();
    // stepped oval base, front view
    lathe([[11.5, 0, 1], [11.5, -0.9, 1], [10.6, -1.5], [8.2, -2.2, 1], [8.2, -2.8, 1], [3.0, -3.4], [1.6, -4.6], [1.5, -5.6, 1]], 0, p);
    // stem with knops
    lathe([[1.6, -5.5, 1], [1.1, -6.5], [0.9, -14], [1.6, -15, 1], [1.6, -15.8, 1], [0.85, -16.8], [0.8, -27.5, 1]], 0, p);
    // harp: a yoke rising to hold the shade
    bar(p, 0, -27, -6.6, -31.2, 0.9);
    bar(p, 0, -27, 6.6, -31.2, 0.9);
    // shade: a half-cylinder seen from the front: long rounded top, straight lower edge, rolled ends
    const s = new Path2D();
    s.moveTo(-13.6, -31.2);
    s.lineTo(-13.2, -33.0);
    s.bezierCurveTo(-12.6, -38.6, -7.0, -40.4, 0, -40.4);
    s.bezierCurveTo(7.0, -40.4, 12.6, -38.6, 13.2, -33.0);
    s.lineTo(13.6, -31.2);
    s.quadraticCurveTo(0, -30.4, -13.6, -31.2);
    s.closePath();
    p.addPath(s);
    // finial
    lathe([[0.5, -40.2, 1], [0.7, -41.0], [0.4, -41.8], [0.6, -42.2, 1]], 0, p);
    // switch / pull chain with a bead
    const chain = new Path2D();
    chain.moveTo(6.2, -31.0);
    chain.lineTo(6.2, -24.4);
    const beadP = new Path2D();
    lathe([[0.15, -24.6, 1], [0.6, -23.6], [0.35, -22.6], [0.1, -22.4, 1]], 6.2, beadP);
    const ribs = new Path2D();
    ribs.moveTo(-11.6, -36.4);
    ribs.bezierCurveTo(-8.6, -38.6, 8.6, -38.6, 11.6, -36.4);
    const lip = new Path2D();
    lip.moveTo(-13.4, -32.2);
    lip.quadraticCurveTo(0, -31.4, 13.4, -32.2);
    return { p, chain, beadP, ribs, lip };
  });

export const bankersLamp = defineProp<BankersLampOpts, 'bulb' | 'pool' | 'chain'>(
  (c, o, env) => {
    const B = BANKER();
    const lit = o.lit !== false;
    const k = flicker(env.t, o.seed ?? 7) * 0.4 + 0.6;
    if (lit) beam(c, env, 0, -30.6, Math.PI / 2, 34, 2.3, 0.22 * k);
    fillInk(c, env, B.p);
    c.save();
    c.strokeStyle = env.fill('ink');
    c.lineWidth = 0.18;
    c.stroke(B.chain);
    c.restore();
    fillInk(c, env, B.beadP);
    cut(c, env, B.ribs, 0.28, 1.1);
    cut(c, env, B.lip, 0.4, 1.2);
    if (lit) {
      // glowing underside of the shade
      const p = new Path2D();
      ellipse(p, 0, -30.9, 12.6, 0.75);
      c.fillStyle = lamp(env, 0.85, 0.95);
      c.fill(p);
      // faint glow through the green glass at the top edge
      const g = c.createLinearGradient(0, -40.4, 0, -31);
      g.addColorStop(0, lamp(env, 0.2, 0));
      g.addColorStop(1, lamp(env, 0.3, 0.16 * k));
      c.fillStyle = g;
      c.fill(memo('banker:shade', () => {
        const s = new Path2D();
        s.moveTo(-13.2, -31.4);
        s.bezierCurveTo(-12.6, -38.6, -7, -40.2, 0, -40.2);
        s.bezierCurveTo(7, -40.2, 12.6, -38.6, 13.2, -31.4);
        s.closePath();
        return s;
      }));
    }
  },
  () => ({ bulb: { x: 0, y: -32.5 }, pool: { x: 0, y: 0 }, chain: { x: 6.2, y: -22.4 } }),
  () => ({ x: -13.6, y: -42.2, w: 27.2, h: 42.2 }),
);

// ---------------------------------------------------------------------------
// Anglepoise (balanced-arm) lamp
// ---------------------------------------------------------------------------
export interface AnglepoiseOpts extends PropAt {
  lit?: boolean;
  /** 0 = folded upright, 1 = reaching forward */
  reach?: number;
  /** extra shade tilt (radians, + = pointing further down) */
  aim?: number;
  seed?: number;
}

function anglepoiseGeom(o: AnglepoiseOpts) {
  const r = Math.max(0, Math.min(1, o.reach ?? 0.55));
  const pivot = { x: 0, y: -6.5 };
  const a1 = (-74 + 32 * r) * (Math.PI / 180); // lower arm, from +x axis (negative = up)
  const L1 = 33;
  const elbow = { x: pivot.x + Math.cos(a1) * L1, y: pivot.y + Math.sin(a1) * L1 };
  const a2 = (34 - 30 * r) * (Math.PI / 180);
  const L2 = 31;
  const head = { x: elbow.x + Math.cos(a2) * L2, y: elbow.y + Math.sin(a2) * L2 };
  const shadeAng = (84 - 22 * r) * (Math.PI / 180) + (o.aim ?? 0); // shade axis, pointing down-forward
  const mouth = { x: head.x + Math.cos(shadeAng) * 11, y: head.y + Math.sin(shadeAng) * 11 };
  return { pivot, elbow, head, shadeAng, mouth, a1, a2 };
}

export const anglepoiseLamp = defineProp<AnglepoiseOpts, 'bulb' | 'pivot' | 'beamDir'>(
  (c, o, env) => {
    const G = anglepoiseGeom(o);
    const lit = o.lit !== false;
    const ink = env.fill('ink');
    // stepped base
    const base = memo('angle:base', () => {
      const p = new Path2D();
      lathe([[11, 0, 1], [11, -1.2, 1], [10, -2.0, 1], [7.8, -2.6, 1], [7.8, -4.2, 1], [2.2, -4.8, 1], [1.6, -6.0], [1.4, -6.6, 1]], 0, p);
      return p;
    });
    fillInk(c, env, base);
    if (lit) beam(c, env, G.mouth.x, G.mouth.y, G.shadeAng, 70, 0.95, 0.2);
    // arms: twin parallel rods with springs
    const arms = new Path2D();
    const off = 1.1;
    const n1 = { x: -Math.sin(G.a1) * off, y: Math.cos(G.a1) * off };
    bar(arms, G.pivot.x + n1.x, G.pivot.y + n1.y, G.elbow.x + n1.x, G.elbow.y + n1.y, 0.7);
    bar(arms, G.pivot.x - n1.x, G.pivot.y - n1.y, G.elbow.x - n1.x, G.elbow.y - n1.y, 0.7);
    bar(arms, G.elbow.x, G.elbow.y, G.head.x, G.head.y, 0.75);
    const n2 = { x: -Math.sin(G.a2) * off, y: Math.cos(G.a2) * off };
    bar(arms, G.elbow.x + n2.x, G.elbow.y + n2.y, G.head.x + n2.x, G.head.y + n2.y, 0.55);
    circle(arms, G.pivot.x, G.pivot.y, 1.9);
    circle(arms, G.elbow.x, G.elbow.y, 1.6);
    circle(arms, G.head.x, G.head.y, 1.2);
    // counter-lever behind the elbow
    bar(arms, G.elbow.x, G.elbow.y, G.elbow.x - Math.cos(G.a2) * 6, G.elbow.y - Math.sin(G.a2) * 6, 0.8);
    c.fillStyle = ink;
    c.fill(arms);
    // springs: zigzags from the base yoke up the lower arm
    c.save();
    c.strokeStyle = ink;
    c.lineWidth = 0.32;
    c.beginPath();
    for (const side of [-1, 1]) {
      const sx = G.pivot.x + side * 2.6;
      const sy = G.pivot.y + 0.5;
      const ex = G.pivot.x + (G.elbow.x - G.pivot.x) * 0.42 + side * 1.6;
      const ey = G.pivot.y + (G.elbow.y - G.pivot.y) * 0.42;
      const L = Math.hypot(ex - sx, ey - sy);
      const ux = (ex - sx) / L;
      const uy = (ey - sy) / L;
      const turns = 15;
      c.moveTo(sx, sy);
      for (let i = 1; i <= turns; i++) {
        const u = i / turns;
        const w = i % 2 ? 0.8 : -0.8;
        c.lineTo(sx + ux * L * u - uy * w, sy + uy * L * u + ux * w);
      }
    }
    c.stroke();
    c.restore();
    // shade: a cone with a rolled rim, rotated to shadeAng
    c.save();
    c.translate(G.head.x, G.head.y);
    c.rotate(G.shadeAng - Math.PI / 2);
    const shade = memo('angle:shade', () => {
      const p = new Path2D();
      p.moveTo(-1.6, -1.2);
      p.lineTo(1.6, -1.2);
      p.quadraticCurveTo(2.4, 2.0, 3.0, 3.6);
      p.bezierCurveTo(6.2, 6.0, 8.0, 9.0, 8.4, 11.4);
      p.lineTo(-8.4, 11.4);
      p.bezierCurveTo(-8.0, 9.0, -6.2, 6.0, -3.0, 3.6);
      p.quadraticCurveTo(-2.4, 2.0, -1.6, -1.2);
      p.closePath();
      return p;
    });
    fillInk(c, env, shade);
    const rimL = memo('angle:rim', () => {
      const p = new Path2D();
      p.moveTo(-7.4, 9.0);
      p.quadraticCurveTo(0, 8.2, 7.4, 9.0);
      return p;
    });
    cut(c, env, rimL, 0.35, 1.1);
    if (lit) {
      const m = new Path2D();
      ellipse(m, 0, 11.4, 8.0, 0.9);
      c.fillStyle = lamp(env, 0.9, 1);
      c.fill(m);
    }
    c.restore();
  },
  (o) => {
    const G = anglepoiseGeom(o);
    return {
      bulb: { x: (G.head.x + G.mouth.x) / 2, y: (G.head.y + G.mouth.y) / 2 },
      pivot: G.pivot,
      beamDir: { x: G.mouth.x + Math.cos(G.shadeAng) * 100, y: G.mouth.y + Math.sin(G.shadeAng) * 100 },
    };
  },
  (o) => {
    const G = anglepoiseGeom(o);
    const minY = Math.min(G.elbow.y, G.head.y) - 3;
    const maxX = Math.max(11, G.mouth.x + 9, G.elbow.x + 3);
    return { x: -11, y: minY, w: maxX + 11, h: -minY };
  },
);

