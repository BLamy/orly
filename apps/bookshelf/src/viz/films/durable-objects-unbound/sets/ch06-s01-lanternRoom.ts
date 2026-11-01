/**
 * durable-objects-unbound — ch06 helpers (owned by author:ch06-ch07; used by ch06-s01, ch06-s02, ch06-s04).
 *
 * INSIDE THE ROOM LANTERN: the lantern's ribbed paper wall seen from inside (L2, glowing from the candle), its
 * bamboo ribs (L3), and the small hand props of the ribbon chapter.
 *
 *   lanternWall(f, c, env, r, o)   L2: the ribbed paper wall from inside (cached per mood + rect)
 *   lanternRibs(f, c, env, r)      L3: dark bamboo ribs and a ring (cached)
 *   parchmentSheet(f, c, env, r)   a pinned parchment plate (ruled border, deckled edge) — cached
 *   foldDraw(c, cx, u, draw)       draw something unfolding from a centre crease (u 0 closed .. 1 open)
 *   quill(c, env, o)               the unseen writer's quill (ink silhouette), nib at (x, y)
 *   scissors(c, env, o)            brass scissors, pivot at (x, y); o.open 0..1
 *   basket(c, env, o)              a wicker basket (front elevation), base centre (x, y); o.lengths rolled lengths
 *   bench(c, env, o)               the workbench (top at y, from x0 to x1)
 *   nearRibs(c, env, o)            L5: two blurred out-of-focus lantern ribs crossing a lower corner
 */
import { mixLab, withAlpha } from '../../../film';
import type { Frame, PaintEnv } from '../../../film';
import { BRASS_HI, bakeRect, brass, clamp01, glowDot, paper, sm, tone, type C2, type Rect } from './common';

// ------------------------------------------------------------------ the lantern's paper wall (from inside)
export function lanternWall(f: Frame, c: C2, env: PaintEnv, r: Rect, o: { key?: string; glowX?: number; glowY?: number } = {}): void {
  const gx = o.glowX ?? 640, gy = o.glowY ?? 300;
  bakeRect(f, c, env, `ch06/wall/${o.key ?? ''}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, r, (cc) => {
    // warm paper lit from the candle (a soft radial bloom); the set colour at the edges
    const g = cc.createRadialGradient(gx, gy, 20, gx, gy, Math.max(r.w, r.h) * 0.62);
    g.addColorStop(0, mixLab(env.mood.core, env.fill('halo'), 0.35));
    g.addColorStop(0.45, mixLab(env.fill('halo'), env.fill('set'), 0.45));
    g.addColorStop(1, mixLab(env.fill('set'), env.mood.fg, 0.35));
    cc.fillStyle = g;
    cc.fillRect(r.x, r.y, r.w, r.h);
    // paper seams: vertical gores that bow outward, and horizontal hoops
    cc.strokeStyle = withAlpha(mixLab(env.fill('set'), env.mood.fg, 0.4), 0.35);
    cc.lineWidth = 2;
    for (let x = Math.floor(r.x / 150) * 150; x < r.x + r.w; x += 150) {
      cc.beginPath();
      cc.moveTo(x, r.y);
      cc.bezierCurveTo(x + 26, r.y + r.h * 0.33, x + 26, r.y + r.h * 0.66, x, r.y + r.h);
      cc.stroke();
    }
    cc.lineWidth = 1;
    for (let y = Math.floor(r.y / 90) * 90; y < r.y + r.h; y += 90) {
      cc.beginPath();
      cc.moveTo(r.x, y);
      cc.lineTo(r.x + r.w, y + 6);
      cc.stroke();
    }
    // paper fibres
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    cc.strokeStyle = withAlpha(env.mood.fg, 0.05);
    for (let i = 0; i < 260; i++) {
      const x = r.x + rnd() * r.w, y = r.y + rnd() * r.h;
      cc.beginPath();
      cc.moveTo(x, y);
      cc.lineTo(x + 6 + rnd() * 14, y + (rnd() - 0.5) * 3);
      cc.stroke();
    }
  });
}
export function lanternRibs(f: Frame, c: C2, env: PaintEnv, r: Rect, o: { key?: string; step?: number } = {}): void {
  const step = o.step ?? 300;
  bakeRect(f, c, env, `ch06/ribs/${o.key ?? ''}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, r, (cc) => {
    const col = mixLab(env.fill('ink'), env.fill('set'), 0.35);
    cc.fillStyle = col;
    for (let x = Math.floor(r.x / step) * step + step * 0.4; x < r.x + r.w; x += step) {
      // a bamboo rib: a long, slightly bowed strip with nodes
      cc.beginPath();
      cc.moveTo(x - 7, r.y);
      cc.bezierCurveTo(x + 30, r.y + r.h * 0.35, x + 30, r.y + r.h * 0.65, x - 7, r.y + r.h);
      cc.lineTo(x + 7, r.y + r.h);
      cc.bezierCurveTo(x + 44, r.y + r.h * 0.65, x + 44, r.y + r.h * 0.35, x + 7, r.y);
      cc.closePath();
      cc.fill();
      for (let y = r.y + 60; y < r.y + r.h; y += 170) {
        const bx = x + 24 * Math.sin(Math.PI * ((y - r.y) / r.h));
        cc.fillRect(bx - 11, y, 22, 5);
      }
    }
    // the top hoop
    cc.fillRect(r.x, r.y + 18, r.w, 10);
    cc.strokeStyle = withAlpha(env.fill('rim'), 0.35);
    cc.lineWidth = 1.2;
    cc.beginPath();
    cc.moveTo(r.x, r.y + 18);
    cc.lineTo(r.x + r.w, r.y + 18);
    cc.stroke();
  });
}

// ------------------------------------------------------------------ parchment plate
/** a pinned parchment sheet covering r (L4): deckled edge, ruled double border, brass pins at the corners */
export function parchmentSheet(f: Frame, c: C2, env: PaintEnv, r: Rect, key = ''): void {
  const pad = 30;
  const rr = { x: r.x - pad, y: r.y - pad, w: r.w + pad * 2, h: r.h + pad * 2 };
  bakeRect(f, c, env, `ch06/sheet/${key}/${r.x},${r.y},${r.w},${r.h}`, rr, (cc) => {
    // a soft shadow under the sheet
    cc.fillStyle = withAlpha(env.mood.fg, 0.22);
    cc.beginPath();
    cc.roundRect(r.x + 8, r.y + 12, r.w, r.h, 6);
    cc.fill();
    // the deckled sheet
    const p = new Path2D();
    let seed = 31;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const N = 60;
    p.moveTo(r.x, r.y);
    for (let i = 1; i <= N; i++) p.lineTo(r.x + (r.w * i) / N, r.y + (rnd() - 0.5) * 3);
    for (let i = 1; i <= N / 2; i++) p.lineTo(r.x + r.w + (rnd() - 0.5) * 3, r.y + (r.h * i) / (N / 2));
    for (let i = N - 1; i >= 0; i--) p.lineTo(r.x + (r.w * i) / N, r.y + r.h + (rnd() - 0.5) * 3);
    for (let i = N / 2 - 1; i >= 1; i--) p.lineTo(r.x + (rnd() - 0.5) * 3, r.y + (r.h * i) / (N / 2));
    p.closePath();
    const g = cc.createRadialGradient(r.x + r.w * 0.45, r.y + r.h * 0.4, 40, r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) * 0.7);
    g.addColorStop(0, mixLab(paper(env), '#fffaf0', 0.25));
    g.addColorStop(0.7, paper(env, 0.04));
    g.addColorStop(1, mixLab(paper(env, 0.1), '#b8996a', 0.35));
    cc.fillStyle = g;
    cc.fill(p);
    // foxing and fibres
    cc.fillStyle = withAlpha('#9a7a4a', 0.06);
    for (let i = 0; i < 40; i++) {
      cc.beginPath();
      cc.arc(r.x + rnd() * r.w, r.y + rnd() * r.h, 3 + rnd() * 16, 0, Math.PI * 2);
      cc.fill();
    }
    // ruled double border
    const inkC = withAlpha(mixLab('#2a2016', env.mood.fg, 0.1), 0.55);
    cc.strokeStyle = inkC;
    cc.lineWidth = 1.6;
    cc.strokeRect(r.x + 18, r.y + 18, r.w - 36, r.h - 36);
    cc.lineWidth = 0.7;
    cc.strokeRect(r.x + 24, r.y + 24, r.w - 48, r.h - 48);
    // brass pins
    for (const [px, py] of [
      [r.x + 10, r.y + 10],
      [r.x + r.w - 10, r.y + 10],
      [r.x + 10, r.y + r.h - 10],
      [r.x + r.w - 10, r.y + r.h - 10],
    ]) {
      cc.fillStyle = brass(env, 0.5);
      cc.beginPath();
      cc.arc(px, py, 5, 0, Math.PI * 2);
      cc.fill();
      cc.fillStyle = withAlpha('#ffffff', 0.4);
      cc.beginPath();
      cc.arc(px - 1.5, py - 1.5, 1.6, 0, Math.PI * 2);
      cc.fill();
    }
  });
}
/** draw something as if unfolding from a vertical centre crease at cx: u 0 (closed) .. 1 (open) */
export function foldDraw(c: C2, cx: number, u: number, y0: number, y1: number, draw: () => void, shade = '#000000'): void {
  const k = clamp01(u);
  if (k <= 0.002) return;
  for (const side of [-1, 1]) {
    c.save();
    c.translate(cx, 0);
    c.scale(Math.max(0.002, k), 1);
    c.translate(-cx, 0);
    c.beginPath();
    if (side < 0) c.rect(cx - 4000, y0 - 200, 4000, y1 - y0 + 400);
    else c.rect(cx, y0 - 200, 4000, y1 - y0 + 400);
    c.clip();
    draw();
    // the halves darken as they turn away from the light
    if (k < 1) {
      c.globalAlpha = (1 - k) * (side < 0 ? 0.5 : 0.3);
      c.fillStyle = shade;
      c.fillRect(side < 0 ? cx - 4000 : cx, y0 - 200, 4000, y1 - y0 + 400);
    }
    c.restore();
  }
}

// ------------------------------------------------------------------ hand props
/** the quill: nib at (x, y), feather trailing up-right (rot adds), s = 1 is a 120 px quill */
export function quill(c: C2, env: PaintEnv, o: { x: number; y: number; s?: number; rot?: number; alpha?: number }): void {
  const a = o.alpha ?? 1;
  if (a <= 0.002) return;
  const s = o.s ?? 1;
  c.save();
  c.globalAlpha *= a;
  c.translate(o.x, o.y);
  c.rotate(-0.85 + (o.rot ?? 0));
  c.scale(s, s);
  const ink = env.fill('ink');
  c.fillStyle = ink;
  // nib
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(10, -2.4);
  c.lineTo(10, 2.4);
  c.closePath();
  c.fill();
  // shaft
  c.fillRect(10, -1.4, 110, 2.8);
  // vane: a long asymmetric feather
  c.beginPath();
  c.moveTo(30, -1);
  c.quadraticCurveTo(70, -22, 124, -12);
  c.quadraticCurveTo(100, -6, 60, -1);
  c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(40, 1);
  c.quadraticCurveTo(80, 12, 122, 4);
  c.quadraticCurveTo(96, 2, 64, 1);
  c.closePath();
  c.fill();
  // barbs: rim-lit hairlines on the top edge
  c.strokeStyle = withAlpha(env.fill('rim'), 0.6);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(32, -2);
  c.quadraticCurveTo(70, -22, 124, -12);
  c.stroke();
  c.restore();
}
/** brass scissors, pivot at (x, y), blades pointing along +x rotated by rot; open 0..1 */
export function scissors(c: C2, env: PaintEnv, o: { x: number; y: number; s?: number; rot?: number; open: number; alpha?: number; glint?: number }): void {
  const a = o.alpha ?? 1;
  if (a <= 0.002) return;
  const s = o.s ?? 1;
  const op = clamp01(o.open) * 0.42;
  c.save();
  c.globalAlpha *= a;
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  c.scale(s, s);
  const blade = (sgn: number, hi: number) => {
    c.save();
    c.rotate(sgn * op);
    const g = c.createLinearGradient(0, -4, 0, 4);
    g.addColorStop(0, brass(env, 0.75 + 0.25 * hi));
    g.addColorStop(1, brass(env, 0.1));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-2, -3 * sgn);
    c.lineTo(40, -0.6 * sgn);
    c.lineTo(40, 0.4 * sgn);
    c.lineTo(-2, 2 * sgn);
    c.closePath();
    c.fill();
    // handle ring
    c.strokeStyle = brass(env, 0.35);
    c.lineWidth = 3.2;
    c.beginPath();
    c.ellipse(-16, 6 * sgn, 9, 6, 0.3 * sgn, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = brass(env, 0.35);
    c.fillRect(-10, -1.5 + 2.5 * sgn, 10, 3);
    c.restore();
  };
  blade(1, 0);
  blade(-1, o.glint ?? 0);
  c.fillStyle = mixLab('#2a1d0e', env.mood.fg, 0.2);
  c.beginPath();
  c.arc(0, 0, 2.2, 0, Math.PI * 2);
  c.fill();
  c.restore();
  if ((o.glint ?? 0) > 0.01) glowDot(c, o.x + 20 * s, o.y, 16 * s, tone(env, BRASS_HI, 0.05), 0.55 * (o.glint ?? 0) * a);
}
/** a wicker basket (front elevation) with base centre (x, y); `lengths` rolled cut lengths showing over the rim */
export function basket(c: C2, env: PaintEnv, o: { x: number; y: number; s?: number; lengths?: number }): void {
  const s = o.s ?? 1;
  const ink = env.fill('ink');
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  // rolled lengths poking over the rim (paper ends), behind the front weave
  const n = Math.max(0, o.lengths ?? 0);
  for (let i = 0; i < Math.ceil(n); i++) {
    const k = sm(clamp01(n - i));
    const x = -26 + i * 15, rot = -0.35 + i * 0.22;
    c.save();
    c.globalAlpha = k;
    c.translate(x, -44 + (1 - k) * -30);
    c.rotate(rot);
    c.fillStyle = mixLab(paper(env, 0.05), '#cdb68c', 0.3);
    c.fillRect(-5, -18, 10, 30);
    c.fillStyle = mixLab(paper(env, 0.2), env.mood.fg, 0.2);
    c.beginPath();
    c.ellipse(0, -18, 5, 2, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  // body
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-46, -44);
  c.lineTo(46, -44);
  c.lineTo(36, 0);
  c.lineTo(-36, 0);
  c.closePath();
  c.fill();
  // weave hairlines
  c.strokeStyle = withAlpha(env.fill('rim'), 0.16);
  c.lineWidth = 1;
  for (let y = -38; y < 0; y += 8) {
    c.beginPath();
    c.moveTo(-45 + (y + 44) * 0.22, y);
    c.lineTo(45 - (y + 44) * 0.22, y);
    c.stroke();
  }
  // rim
  c.fillRect(-49, -48, 98, 6);
  c.strokeStyle = withAlpha(env.fill('rim'), 0.55);
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(-49, -48);
  c.lineTo(49, -48);
  c.stroke();
  c.restore();
}
/** the workbench: top surface at y from x0 to x1, legs down to floorY */
export function bench(c: C2, env: PaintEnv, o: { x0: number; x1: number; y: number; floorY: number }): void {
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.fillRect(o.x0, o.y, o.x1 - o.x0, 16);
  c.fillRect(o.x0 + 18, o.y + 16, 16, o.floorY - o.y - 16);
  c.fillRect(o.x1 - 34, o.y + 16, 16, o.floorY - o.y - 16);
  c.fillRect(o.x0 + 18, o.y + 70, o.x1 - o.x0 - 36, 6);
  c.strokeStyle = withAlpha(env.fill('rim'), 0.5);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(o.x0, o.y);
  c.lineTo(o.x1, o.y);
  c.stroke();
}
/** L5: two blurred, out-of-focus lantern ribs crossing a lower corner (near occluder) */
export function nearRibs(c: C2, env: PaintEnv, o: { side: 'left' | 'right'; x?: number }): void {
  const fg = env.fill('fg');
  c.fillStyle = fg;
  const x = o.x ?? (o.side === 'left' ? 40 : 1240);
  const d = o.side === 'left' ? 1 : -1;
  c.beginPath();
  c.moveTo(x - 30 * d, -200);
  c.bezierCurveTo(x + 70 * d, 200, x + 70 * d, 600, x - 10 * d, 1000);
  c.lineTo(x + 26 * d, 1000);
  c.bezierCurveTo(x + 104 * d, 600, x + 104 * d, 200, x + 6 * d, -200);
  c.closePath();
  c.fill();
}
