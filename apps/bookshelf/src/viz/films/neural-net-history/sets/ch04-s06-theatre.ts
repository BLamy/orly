/**
 * ch04-s06 — the steeply raked horseshoe lecture theatre (Royal Institution, 1973), as paper-cut flats.
 *
 *   theatreBack(c, r, env)     L2: the back wall with a row of tall arched HIGH WINDOWS (holes, evenodd), a
 *                               cornice, and the horseshoe's back tiers rising beneath it as curved bands of
 *                               benches with a hazed audience as texture. Bake it (static).
 *   theatreArms(c, r, env)     L3: the horseshoe's two arms, nearer tiers stepping down at the frame edges.
 *   tvCamera(c, o, env)        L5: a generic 1970s studio camera on a pedestal (no logo), lens to the left;
 *                               returns the tally lamp's world point (draw the ember glow there).
 *   lecternDesk / dais          L4 geometry constants (rest-screen px) used by the shot.
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';

type C = CanvasRenderingContext2D;
type R = { x: number; y: number; w: number; h: number };

/** the high windows (L2 world): pointed (equilateral) arches; centres, width, apex and sill */
export const HIGH_WINDOWS = { xs: [150, 395, 640, 885, 1130], w: 116, top: 8, sill: 236 } as const;

/** an equilateral pointed arch: two arcs of radius w struck from the opposite springing points */
function pointedArch(p: Path2D, cx: number, w: number, top: number, sill: number) {
  const spring = top + w * 0.866;
  p.moveTo(cx - w / 2, sill);
  p.lineTo(cx - w / 2, spring);
  p.arc(cx + w / 2, spring, w, Math.PI, (4 * Math.PI) / 3);
  p.arc(cx - w / 2, spring, w, -Math.PI / 3, 0);
  p.lineTo(cx + w / 2, sill);
  p.closePath();
}

/** the paper-cut tracery of one window: a thick frame, a central mullion, two sub-lancets, an oculus with a
 *  fan of spokes in the head, and three transoms (all ink, cut from one sheet) */
function tracery(c: C, cx: number, w: number, top: number, sill: number, ink: string) {
  const spring = top + w * 0.866;
  c.save();
  c.strokeStyle = ink;
  c.fillStyle = ink;
  c.lineJoin = 'miter';
  // the frame round the opening
  const outline = new Path2D();
  pointedArch(outline, cx, w, top, sill);
  c.lineWidth = 9;
  c.stroke(outline);
  c.save();
  c.clip(outline);
  // central mullion (thick), from the sill up into the head
  c.fillRect(cx - 5, spring - w * 0.12, 10, sill - spring + w * 0.12);
  // two sub-lancet heads (pointed arches of half width)
  const hw = w / 2;
  c.lineWidth = 6;
  for (const sx of [cx - hw / 2, cx + hw / 2]) {
    const sp = new Path2D();
    const s2 = spring + 6;
    sp.moveTo(sx - hw / 2, s2 + 40);
    sp.lineTo(sx - hw / 2, s2);
    sp.arc(sx + hw / 2, s2, hw, Math.PI, (4 * Math.PI) / 3);
    sp.arc(sx - hw / 2, s2, hw, -Math.PI / 3, 0);
    sp.lineTo(sx + hw / 2, s2 + 40);
    c.stroke(sp);
    // a thin glazing bar down each light
    c.fillRect(sx - 1.6, s2 - hw * 0.6, 3.2, sill - s2 + hw * 0.6);
  }
  // the oculus in the head: a ring with a fan of eight spokes and a hub
  const oy = spring - w * 0.47, orr = w * 0.19;
  c.lineWidth = 6;
  c.beginPath();
  c.arc(cx, oy, orr, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = 3;
  c.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    c.moveTo(cx, oy);
    c.lineTo(cx + Math.cos(a) * orr, oy + Math.sin(a) * orr);
  }
  c.stroke();
  c.beginPath();
  c.arc(cx, oy, 4.5, 0, Math.PI * 2);
  c.fill();
  // cusps where the ring meets the sub-arches
  c.beginPath();
  c.arc(cx - orr * 0.9, oy + orr * 0.9, 5, 0, Math.PI * 2);
  c.arc(cx + orr * 0.9, oy + orr * 0.9, 5, 0, Math.PI * 2);
  c.fill();
  // transoms
  for (let k = 1; k <= 3; k++) c.fillRect(cx - w / 2, spring + 20 + ((sill - spring - 20) * k) / 4 - 3.5, w, 7);
  c.restore();
  // the sill
  c.fillRect(cx - w / 2 - 12, sill, w + 24, 10);
  c.restore();
}

/** y of tier i's front edge at world x (the horseshoe: the sides rise toward the frame edges) */
export function tierY(i: number, x: number): number {
  const u = (x - 640) / 760;
  return 292 + i * 40 - (70 - i * 4) * u * u;
}

export function theatreBack(c: C, r: R, env: PaintEnv) {
  const m = env.mood;
  const wall = env.fill('set');
  // the wall with its window holes
  const p = new Path2D();
  p.rect(r.x, r.y, r.w, r.h);
  for (const x of HIGH_WINDOWS.xs) pointedArch(p, x, HIGH_WINDOWS.w, HIGH_WINDOWS.top, HIGH_WINDOWS.sill);
  c.fillStyle = wall;
  c.fill(p, 'evenodd');
  // paper-cut tracery in each window (near-ink against the night)
  const bar = mixLab(env.fill('ink'), wall, 0.12);
  for (const x of HIGH_WINDOWS.xs) tracery(c, x, HIGH_WINDOWS.w, HIGH_WINDOWS.top, HIGH_WINDOWS.sill, bar);
  // pilasters between windows, and the cornice beneath them
  c.fillStyle = mixLab(wall, m.fg, 0.25);
  for (let i = 0; i < HIGH_WINDOWS.xs.length - 1; i++) {
    const x = (HIGH_WINDOWS.xs[i] + HIGH_WINDOWS.xs[i + 1]) / 2;
    c.fillRect(x - 14, r.y, 28, 262 - r.y);
  }
  c.fillStyle = mixLab(wall, m.fg, 0.35);
  c.fillRect(r.x, 248, r.w, 16);
  c.fillStyle = withAlpha(m.rim, 0.16);
  c.fillRect(r.x, 248, r.w, 1.4);
  // dentils under the cornice
  c.fillStyle = mixLab(wall, m.fg, 0.3);
  for (let x = Math.floor(r.x / 18) * 18; x < r.x + r.w; x += 18) c.fillRect(x, 264, 9, 6);

  // the back tiers: curved bands, each a riser (darker) and a bench top (lighter edge), audience as texture
  const x0 = r.x - 20, x1 = r.x + r.w + 20;
  const N = 10;
  for (let i = 0; i < N; i++) {
    const riser = mixLab(wall, m.fg, 0.2 + 0.055 * i);
    const top = mixLab(wall, m.setHaze, 0.55 - 0.03 * i);
    c.fillStyle = riser;
    c.beginPath();
    c.moveTo(x0, tierY(i, x0));
    for (let x = x0; x <= x1; x += 16) c.lineTo(x, tierY(i, x));
    c.lineTo(x1, r.y + r.h);
    c.lineTo(x0, r.y + r.h);
    c.closePath();
    c.fill();
    // the bench top's lit edge
    c.strokeStyle = withAlpha(top, 0.9);
    c.lineWidth = 3;
    c.beginPath();
    for (let x = x0; x <= x1; x += 16) (x === x0 ? c.moveTo(x, tierY(i, x)) : c.lineTo(x, tierY(i, x)));
    c.stroke();
    c.strokeStyle = withAlpha(m.rim, 0.07);
    c.lineWidth = 1;
    c.beginPath();
    for (let x = x0; x <= x1; x += 16) (x === x0 ? c.moveTo(x, tierY(i, x) - 1.5) : c.lineTo(x, tierY(i, x) - 1.5));
    c.stroke();
    // the audience on this tier: seated heads and shoulders, seeded gaps (texture, not characters)
    if (i < N - 1) {
      const aud = mixLab(env.fill('ink'), wall, 0.42);
      c.fillStyle = aud;
      const pitch = 25 + i * 1.2;
      for (let x = x0 + hash1(i, 5) * pitch; x < x1; x += pitch) {
        const h = hash1(Math.round(x * 3) + i * 97, 11);
        if (h < -0.35) continue; // an empty seat
        const yb = tierY(i + 1, x) - 3;
        const s = 0.92 + 0.1 * hash1(Math.round(x) + i, 12);
        const lean = hash1(Math.round(x) + i * 7, 13) * 2.5;
        c.beginPath();
        c.ellipse(x + lean, yb - 18 * s, 6.6 * s, 7.6 * s, 0, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.moveTo(x - 11 * s, yb + 2);
        c.quadraticCurveTo(x - 11 * s, yb - 12 * s, x, yb - 11 * s);
        c.quadraticCurveTo(x + 11 * s, yb - 12 * s, x + 11 * s, yb + 2);
        c.closePath();
        c.fill();
      }
    }
  }
  // the upper benches fall away into haze; the lower ones sink toward ink
  const hz = c.createLinearGradient(0, 268, 0, 470);
  hz.addColorStop(0, withAlpha(m.setHaze, 0.55));
  hz.addColorStop(0.45, withAlpha(m.setHaze, 0.22));
  hz.addColorStop(1, withAlpha(m.setHaze, 0));
  c.fillStyle = hz;
  c.fillRect(r.x, 266, r.w, 210);
  const dk = c.createLinearGradient(0, 420, 0, 640);
  dk.addColorStop(0, withAlpha(m.fg, 0));
  dk.addColorStop(1, withAlpha(m.fg, 0.55));
  c.fillStyle = dk;
  c.fillRect(r.x, 420, r.w, Math.max(0, r.y + r.h - 420));
}

/** L3: the horseshoe's arms, nearer tiers stepping down at the frame edges (both sides) */
export function theatreArms(c: C, r: R, env: PaintEnv) {
  const m = env.mood;
  const base = env.fill('set');
  for (const side of [-1, 1] as const) {
    for (let i = 0; i < 7; i++) {
      const inner = side < 0 ? -40 + i * 26 : 1320 - i * 26;
      const outer = side < 0 ? r.x - 40 : r.x + r.w + 40;
      const y = 250 + i * 52;
      c.fillStyle = mixLab(base, m.fg, 0.25 + 0.05 * i);
      c.beginPath();
      c.moveTo(outer, y - 30);
      c.lineTo(inner, y);
      c.lineTo(inner, r.y + r.h);
      c.lineTo(outer, r.y + r.h);
      c.closePath();
      c.fill();
      c.strokeStyle = withAlpha(m.rim, 0.1);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(outer, y - 30);
      c.lineTo(inner, y);
      c.stroke();
      // a rail post at the inner end of each tier
      c.fillStyle = mixLab(base, m.fg, 0.5);
      c.fillRect(inner - (side < 0 ? 4 : 0), y - 22, 4, 22);
    }
  }
}

export interface TvCameraOpts {
  x: number;
  y: number;
  s?: number;
}
/** a generic 1970s studio camera on a pedestal, lens to the left (no logo). x,y = the body's front-top corner */
export function tvCamera(c: C, o: TvCameraOpts, env: PaintEnv): { tally: { x: number; y: number } } {
  const s = o.s ?? 1;
  const ink = env.fill('ink');
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  c.fillStyle = ink;
  // the body: a long box, rounded at the back
  c.beginPath();
  c.roundRect(0, 0, 220, 104, [4, 18, 18, 4]);
  c.fill();
  // the lens turret and hood, pointing left
  c.fillRect(-46, 22, 50, 58);
  c.beginPath();
  c.moveTo(-46, 16);
  c.lineTo(-92, 4);
  c.lineTo(-92, 98);
  c.lineTo(-46, 86);
  c.closePath();
  c.fill();
  // the viewfinder hood on top, at the back
  c.beginPath();
  c.roundRect(108, -46, 104, 50, 6);
  c.fill();
  c.fillRect(196, -54, 28, 64);
  // the pan bars: two handles reaching back and down
  c.lineWidth = 9;
  c.strokeStyle = ink;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(210, 90);
  c.lineTo(300, 168);
  c.moveTo(200, 70);
  c.lineTo(296, 120);
  c.stroke();
  // the pan-and-tilt head and the pedestal column, ring and base
  c.fillRect(70, 104, 90, 22);
  c.fillRect(98, 126, 34, 300);
  c.beginPath();
  c.ellipse(115, 232, 74, 12, 0, 0, Math.PI * 2);
  c.fill();
  c.lineWidth = 3;
  c.beginPath();
  c.ellipse(115, 232, 68, 10, 0, 0, Math.PI * 2);
  c.stroke();
  // cut-lines: the body's seam, the lens rings, the viewfinder face
  c.strokeStyle = withAlpha(env.mood.rim, 0.22);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(6, 34);
  c.lineTo(214, 34);
  c.moveTo(-60, 10);
  c.lineTo(-60, 92);
  c.moveTo(-76, 7);
  c.lineTo(-76, 95);
  c.stroke();
  // the tally lamp housing on the front top
  c.fillStyle = ink;
  c.fillRect(14, -14, 22, 16);
  c.restore();
  return { tally: { x: o.x + 25 * s, y: o.y - 8 * s } };
}
