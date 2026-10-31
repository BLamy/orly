/**
 * neural-net-history — the craftsman's WORKSHOP, empty now (ch08-s13's last beat), and the hand-cut tin stencil
 * prop (ch08-s13, ch08-s13b). Paper-cut: a panelled back wall with a small-paned window HOLE at left (the
 * slanting evening light comes through it), a rail of hooks with the hand-cut tin stencils still hanging
 * (gradient arrows, corner marks, edge combs: the hand-designed features of the age, stylised), the unlit
 * hanging lamp, and the bench with the snips lying still.
 *
 *   tinStencil(c, env, { x, y, s, kind, rot?, lit? })   one small pierced tin plate (holes are holes: evenodd)
 *   tinSnips(c, env, { x, y, s, rot?, open? })           the snips (paper-cut, two blades and looped handles)
 *   workshop(f, { key, cams, evening })                  the ch08-s01 workshop, empty (backlight → L5)
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { dustMotes, godRays, windowBeam } from '../../../film/silhouette/atmosphere';
import { hash1 } from '../../../film/core/frame';
import { WS, benchAndLamp, benchWork, leaderboard, lectern, thumbRing, workshopBack } from './ch08-s01-workshop';

type C = CanvasRenderingContext2D;

export type StencilKind = 'arrow' | 'corner' | 'comb' | 'ring' | 'cross' | 'bars';
const STENCIL_KINDS: StencilKind[] = ['arrow', 'corner', 'comb', 'ring', 'cross', 'bars'];

/** the plate (outer) and the pierced pattern (holes), in plate units (−1..1) */
function stencilPath(kind: StencilKind): Path2D {
  const p = new Path2D();
  // the plate with a hanging hole, slightly irregular (hand-cut)
  p.moveTo(-1, -0.94);
  p.lineTo(0.97, -1);
  p.lineTo(1, 0.95);
  p.lineTo(-0.96, 1);
  p.closePath();
  p.moveTo(0.1, -0.8);
  p.arc(0, -0.8, 0.1, 0, Math.PI * 2, true);
  const hole = (pts: [number, number][]) => {
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = pts.length - 1; i > 0; i--) p.lineTo(pts[i][0], pts[i][1]);
    p.closePath();
  };
  switch (kind) {
    case 'arrow':
      hole([[-0.6, 0.05], [0.15, 0.05], [0.15, -0.25], [0.65, 0.2], [0.15, 0.65], [0.15, 0.35], [-0.6, 0.35]]);
      break;
    case 'corner':
      hole([[-0.6, -0.45], [0.55, -0.45], [0.55, -0.25], [-0.4, -0.25], [-0.4, 0.65], [-0.6, 0.65]]);
      hole([[0.0, 0.1], [0.55, 0.1], [0.55, 0.28], [0.18, 0.28], [0.18, 0.65], [0.0, 0.65]]);
      break;
    case 'comb':
      for (let i = 0; i < 5; i++) {
        const x = -0.62 + i * 0.29;
        hole([[x, -0.45], [x + 0.12, -0.45], [x + 0.12, 0.7], [x, 0.7]]);
      }
      break;
    case 'ring':
      p.moveTo(0.6, 0.15);
      p.arc(0, 0.15, 0.6, 0, Math.PI * 2, true);
      p.moveTo(0.36, 0.15);
      p.arc(0, 0.15, 0.36, 0, Math.PI * 2, false);
      break;
    case 'cross':
      hole([[-0.12, -0.5], [0.12, -0.5], [0.12, 0.05], [0.65, 0.05], [0.65, 0.28], [0.12, 0.28], [0.12, 0.75], [-0.12, 0.75], [-0.12, 0.28], [-0.65, 0.28], [-0.65, 0.05], [-0.12, 0.05]]);
      break;
    case 'bars':
      for (let i = 0; i < 4; i++) {
        const y = -0.45 + i * 0.3;
        hole([[-0.65, y], [0.65, y - 0.12], [0.65, y], [-0.65, y + 0.12]]);
      }
      break;
  }
  return p;
}
const STENCIL_CACHE = new Map<StencilKind, Path2D>();
const stencilGeo = (k: StencilKind) => {
  let g = STENCIL_CACHE.get(k);
  if (!g) STENCIL_CACHE.set(k, (g = stencilPath(k)));
  return g;
};

export interface TinStencilOpts {
  x: number;
  y: number;
  /** half-size of the plate in px */
  s: number;
  kind: StencilKind;
  rot?: number;
  /** a glint of tin on its lit edge (0..1) */
  lit?: number;
}
export function tinStencil(c: C, env: PaintEnv, o: TinStencilOpts) {
  c.save();
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  c.scale(o.s, o.s);
  c.fillStyle = mixLab(env.fill('ink'), env.mood.set, 0.15);
  c.fill(stencilGeo(o.kind), 'evenodd');
  const lit = o.lit ?? 0.5;
  if (lit > 0) {
    // tin catches the light along its top edge
    c.strokeStyle = withAlpha(env.mood.rim, 0.5 * lit);
    c.lineWidth = 1.4 / o.s;
    c.beginPath();
    c.moveTo(-1, -0.94);
    c.lineTo(0.97, -1);
    c.stroke();
  }
  c.restore();
}

export interface SnipsOpts {
  x: number;
  y: number;
  s: number;
  rot?: number;
  /** 0 = shut … 1 = open */
  open?: number;
}
/** tin snips lying on their side: two short heavy blades, a pivot, two long looped handles */
export function tinSnips(c: C, env: PaintEnv, o: SnipsOpts) {
  const op = (o.open ?? 0.15) * 0.35;
  c.save();
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  c.scale(o.s, o.s);
  c.fillStyle = env.fill('ink');
  for (const sgn of [-1, 1]) {
    c.save();
    c.rotate(sgn * op);
    c.beginPath();
    // blade (to the left of the pivot)
    c.moveTo(0, -3);
    c.lineTo(-30, -1 * sgn - 1);
    c.quadraticCurveTo(-34, 0, -30, 1 * sgn + 1);
    c.lineTo(0, 3);
    // handle (to the right), ending in a loop
    c.lineTo(46, 4 * sgn + 2);
    c.quadraticCurveTo(58, 6 * sgn, 60, 12 * sgn);
    c.quadraticCurveTo(56, 15 * sgn, 50, 9 * sgn);
    c.lineTo(46, 7 * sgn);
    c.lineTo(4, 1);
    c.closePath();
    c.fill();
    c.restore();
  }
  c.fillStyle = withAlpha(env.mood.rim, 0.55);
  c.beginPath();
  c.arc(0, 0, 2.2, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(env.mood.rim, 0.3);
  c.lineWidth = 0.9 / o.s;
  c.beginPath();
  c.moveTo(-30, -1);
  c.lineTo(0, -3);
  c.stroke();
  c.restore();
}

/** a soft additive pool of light (the beam where it lands on the bench) */
function glow2(c: C, x: number, y: number, r: number, col: string, a: number) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, withAlpha(col, a));
  g.addColorStop(1, withAlpha(col, 0));
  const op = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = g;
  c.fillRect(x - r, y - r, 2 * r, 2 * r);
  c.globalCompositeOperation = op;
}

// ------------------------------------------------------------------------------------------------ the room
export interface WorkshopOpts {
  key: string;
  cams: Camera3[];
  /** 0 = late afternoon slant … 1 = toward evening (the beam lowers, warms and dims) */
  evening: number;
}
/**
 * The SAME workshop as ch08-s01 (sets/ch08-s01-workshop: the tall arched windows with the bare trees beyond, the
 * oculus roundels, the tool rail of stencils on their hooks, the hanging lamp over the bench, the judge's lectern,
 * the lantern leaderboard and the ring of pictures), now empty: the craftsman gone, the lamp out, the snips lying
 * flat on the bench top, dust turning in the slanting window light as it lowers toward evening.
 */
export function workshop(f: Frame, o: WorkshopOpts) {
  const ev = o.evening;
  f.backlight({ sunX: 560, sunY: 430 + 40 * ev, sunRadius: 620, intensity: 0.62 - 0.26 * ev });
  workshopBack(f, `${o.key}/s01ws`, o.cams);
  // the slanting light from the tall left window across the bench, lowering toward evening
  f.layer('L2', (c, env) => {
    const w = WS.windows[0];
    const beam = windowBeam({ x: w.x, y: 70, w: w.w, h: 430 }, { x: 0.8 - 0.2 * ev, y: 0.6 + 0.2 * ev }, 760, 1.45);
    godRays(c, { beams: [beam], intensity: 0.36 * (1 - 0.5 * ev), mullions: 2, streaks: 4, salt: 13 }, env);
    dustMotes(c, { area: { x: 200, y: 120, w: 760, h: 460 }, count: 80, beam, drift: { x: 4, y: -1.2 }, brightness: 0.9 * (1 - 0.5 * ev), salt: 31 }, env);
  });
  f.fog({ yCenter: 0.6 * 720, height: 0.4 * 720, alpha: 0.2, drift: 6 });
  f.layer('L3', (c, env) => {
    const st = { show: 1, glow: [0.18, 0.18] as [number, number], dark: 1 };
    leaderboard(c, env, st);
    thumbRing(c, env, st);
  });
  f.fog('B');
  f.layer('L4', (c, env) => {
    const ink = env.fill('ink');
    benchAndLamp(c, env, ink);
    // the lamp is out: its mouth dark
    c.fillStyle = ink;
    c.beginPath();
    c.ellipse(WS.lamp.x, WS.lamp.y + 1, 27, 4.5, 0, 0, Math.PI * 2);
    c.fill();
    benchWork(c, env, ink, 1);
    lectern(c, env, ink);
    // the snips lying flat on the bench top (seen a little from above: squashed, nothing below the top's edge)
    const B = WS.bench;
    glow2(c, B.x0 + 80, B.top - 4, 90, env.mood.halo, 0.1 * (1 - 0.5 * ev));
    c.save();
    c.translate(B.x0 + 66, B.top - 9.5);
    c.scale(1, 0.5);
    tinSnips(c, env, { x: 0, y: 0, s: 1.3, open: 0.12 });
    c.restore();
    // a finished stencil left on the bench, propped against the vice
    tinStencil(c, env, { x: B.x1 - 62, y: B.top - 13, s: 13, kind: 'corner', rot: -0.18, lit: 0.6 });
  });
  f.rim({ x: -0.6, y: -0.8 });
  f.layer('L5', (c, env) => {
    // the near edge, blurred (as in ch08-s01): the end of a second bench with its vise, and the floor's lip
    c.fillStyle = env.fill('fg');
    c.fillRect(-400, 690, 2400, 200);
    c.fillRect(-400, 560, 520, 26);
    c.fillRect(70, 586, 34, 140);
    c.fillRect(-60, 586, 30, 140);
    c.fillRect(60, 512, 62, 48);
    c.fillRect(48, 500, 86, 16);
    c.fillRect(122, 526, 34, 10);
    c.fillRect(150, 506, 8, 52);
    c.fillRect(1240, 600, 400, 300);
  });
}
