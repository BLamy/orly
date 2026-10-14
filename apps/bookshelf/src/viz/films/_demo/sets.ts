/**
 * Demo-film set pieces (puppet-free stand-ins until the silhouette kit lands).
 * Each painter draws in layer coordinates with env fills; static ones are meant
 * to be wrapped in f.cached(). Geometry is built once (module scope / memo).
 */
import type { PaintEnv } from '../../film/contracts';
import { mixLab, withAlpha } from '../../film/silhouette/palette';
import { mulberry32 } from '../../core';

export type Ctx = CanvasRenderingContext2D;

// ---------------------------------------------------------------- lathe (turned profiles)
/** symmetric turned shape around x=0 from [y, r] pairs (top → bottom), smoothed */
export function lathe(profile: [number, number][]): Path2D {
  const p = new Path2D();
  const side = (sgn: number, pts: [number, number][]) => {
    for (let i = 1; i < pts.length; i++) {
      const [y0, r0] = pts[i - 1];
      const [y1, r1] = pts[i];
      p.quadraticCurveTo(sgn * r0, (y0 + y1) / 2, sgn * (r0 + r1) / 2, (y0 + y1) / 2);
      if (i === pts.length - 1) p.lineTo(sgn * r1, y1);
    }
  };
  p.moveTo(-profile[0][1], profile[0][0]);
  side(-1, profile);
  const rev = [...profile].reverse();
  p.lineTo(rev[0][1], rev[0][0]);
  side(1, rev);
  p.closePath();
  return p;
}

// ---------------------------------------------------------------- gothic window wall
/** a window opening (outer) path: pointed head, straight jambs */
function windowOutline(x: number, y: number, w: number, h: number): Path2D {
  const p = new Path2D();
  const spring = y + w * 0.62;
  p.moveTo(x, y + h);
  p.lineTo(x, spring);
  p.quadraticCurveTo(x, y + w * 0.12, x + w / 2, y);
  p.quadraticCurveTo(x + w, y + w * 0.12, x + w, spring);
  p.lineTo(x + w, y + h);
  p.closePath();
  return p;
}

export interface WallSpec {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  windows: { x: number; y: number; w: number; h: number }[];
}

/** back wall with window holes (evenodd), mullions, transoms, tracery, panels and cut-lines */
export function backWall(c: Ctx, env: PaintEnv, s: WallSpec) {
  const set = env.fill('set');
  const cut = withAlpha(env.mood.rim, 0.16);
  const deep = mixLab(set, env.mood.ink, 0.35);
  const wall = new Path2D();
  wall.rect(s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0);
  for (const w of s.windows) wall.addPath(windowOutline(w.x, w.y, w.w, w.h));
  c.fillStyle = set;
  c.fill(wall, 'evenodd');

  for (const w of s.windows) {
    const spring = w.y + w.w * 0.62;
    // reveal (the window's inner frame) as a darker band
    c.save();
    c.clip(windowOutline(w.x, w.y, w.w, w.h));
    c.strokeStyle = deep;
    c.lineWidth = 9;
    c.stroke(windowOutline(w.x, w.y, w.w, w.h));
    // lancets: 3 lights separated by mullions
    c.fillStyle = set;
    const mw = 5;
    for (let i = 1; i < 3; i++) c.fillRect(w.x + (w.w * i) / 3 - mw / 2, w.y, mw, w.h);
    // transoms + glazing bars
    for (let yy = spring + 46; yy < w.y + w.h - 10; yy += 46) c.fillRect(w.x, yy - 2, w.w, 4);
    c.fillStyle = withAlpha(set, 0.95);
    for (let yy = spring + 23; yy < w.y + w.h; yy += 46) c.fillRect(w.x, yy - 0.75, w.w, 1.5);
    for (let i = 0; i < 3; i++) c.fillRect(w.x + (w.w * (i + 0.5)) / 3 - 0.75, spring, 1.5, w.h);
    // tracery head: solid with trefoil holes + lancet heads
    const head = new Path2D();
    head.rect(w.x - 2, w.y - 2, w.w + 4, spring - w.y + 8);
    const lw = w.w / 3;
    for (let i = 0; i < 3; i++) {
      const lx = w.x + i * lw + 3;
      const lancet = new Path2D();
      lancet.moveTo(lx, spring + 10);
      lancet.lineTo(lx, spring - 6);
      lancet.quadraticCurveTo(lx, spring - lw * 0.55, lx + (lw - 6) / 2, spring - lw * 0.75);
      lancet.quadraticCurveTo(lx + lw - 6, spring - lw * 0.55, lx + lw - 6, spring - 6);
      lancet.lineTo(lx + lw - 6, spring + 10);
      lancet.closePath();
      head.addPath(lancet);
    }
    // trefoil in the apex
    const tcx = w.x + w.w / 2, tcy = w.y + (spring - w.y) * 0.42, tr = w.w * 0.075;
    for (let k = 0; k < 3; k++) {
      const a = -Math.PI / 2 + (k * Math.PI * 2) / 3;
      head.moveTo(tcx + Math.cos(a) * tr * 1.05 + tr, tcy + Math.sin(a) * tr * 1.05);
      head.arc(tcx + Math.cos(a) * tr * 1.05, tcy + Math.sin(a) * tr * 1.05, tr, 0, Math.PI * 2);
    }
    c.fillStyle = set;
    c.fill(head, 'evenodd');
    c.restore();
    // sill + hood mould
    c.fillStyle = deep;
    c.fillRect(w.x - 14, w.y + w.h, w.w + 28, 8);
    c.strokeStyle = cut;
    c.lineWidth = 1;
    c.stroke(windowOutline(w.x - 9, w.y - 9, w.w + 18, w.h + 9));
  }
  // cornice band with dentils
  c.fillStyle = deep;
  c.fillRect(s.x0, s.y0, s.x1 - s.x0, 30);
  c.fillStyle = set;
  for (let x = s.x0; x < s.x1; x += 14) c.fillRect(x, s.y0 + 30, 8, 7);
  c.fillStyle = deep;
  c.fillRect(s.x0, s.y0 + 37, s.x1 - s.x0, 3);
  // wainscot rail + panels
  const wy = s.windows[0] ? s.windows[0].y + s.windows[0].h + 8 : s.y1 - 120;
  c.fillRect(s.x0, wy, s.x1 - s.x0, 6);
  c.strokeStyle = cut;
  c.lineWidth = 1;
  for (let x = s.x0 + 20; x < s.x1 - 60; x += 92) c.strokeRect(x, wy + 18, 72, s.y1 - wy - 34);
  // tall panels between windows
  const ws = [...s.windows].sort((a, b) => a.x - b.x);
  for (let i = 0; i < ws.length - 1; i++) {
    const a = ws[i].x + ws[i].w + 30, b = ws[i + 1].x - 30;
    if (b - a < 60) continue;
    const pw = Math.min(150, b - a), px = (a + b) / 2 - pw / 2;
    c.strokeRect(px, ws[i].y + 30, pw, ws[i].h - 90);
    c.strokeRect(px + 10, ws[i].y + 40, pw - 20, ws[i].h * 0.42);
    c.strokeRect(px + 10, ws[i].y + 60 + ws[i].h * 0.42, pw - 20, ws[i].h * 0.42 - 80);
  }
  // pilasters with fluting cut-lines
  for (const w of ws) {
    for (const px of [w.x - 46, w.x + w.w + 26]) {
      c.fillStyle = deep;
      c.fillRect(px, s.y0 + 40, 20, wy - s.y0 - 40);
      c.strokeStyle = cut;
      for (let k = 0; k < 3; k++) {
        c.beginPath();
        c.moveTo(px + 5 + k * 5, s.y0 + 64);
        c.lineTo(px + 5 + k * 5, wy - 18);
        c.stroke();
      }
    }
  }
}

// ---------------------------------------------------------------- far skyline (L1)
export function skyline(c: Ctx, env: PaintEnv, x0: number, x1: number, base: number, seed: number) {
  const r = mulberry32(seed);
  c.fillStyle = env.fill('set');
  c.beginPath();
  c.moveTo(x0, 720 + 200);
  let x = x0;
  while (x < x1) {
    const w = 30 + r() * 70;
    const h = 30 + r() * 90;
    const kind = r();
    c.lineTo(x, base - h);
    if (kind < 0.22) {
      // spire
      c.lineTo(x + w * 0.4, base - h);
      c.lineTo(x + w * 0.5, base - h - 70 - r() * 60);
      c.lineTo(x + w * 0.6, base - h);
    } else if (kind < 0.4) {
      // dome
      c.quadraticCurveTo(x + w / 2, base - h - w * 0.8, x + w, base - h);
    } else {
      c.lineTo(x + w * 0.3, base - h - 14);
      c.lineTo(x + w * 0.7, base - h - 14);
    }
    c.lineTo(x + w, base - h);
    x += w;
  }
  c.lineTo(x1, 720 + 200);
  c.closePath();
  c.fill();
}

// ---------------------------------------------------------------- furniture (L3)
const chairSplat = (() => {
  // pierced splat in a high-backed chair, local coords: seat front at (0,0), back top at y -230
  const p = new Path2D();
  // stiles
  p.rect(-46, -215, 9, 215);
  p.rect(37, -215, 9, 215);
  // crest rail (scroll)
  p.moveTo(-54, -205);
  p.bezierCurveTo(-50, -245, -18, -232, 0, -248);
  p.bezierCurveTo(18, -232, 50, -245, 54, -205);
  p.lineTo(54, -196);
  p.lineTo(-54, -196);
  p.closePath();
  // finials
  for (const fx of [-41.5, 41.5]) {
    p.moveTo(fx + 6, -218);
    p.arc(fx, -224, 7, 0, Math.PI * 2);
  }
  // solid back panel (pierced below with gothic fretwork)
  p.rect(-37, -198, 74, 140);
  // seat rail
  p.rect(-50, -64, 100, 10);
  return p;
})();
const chairHoles = (() => {
  const h = new Path2D();
  // three lancets side by side
  for (const cx of [-22, 0, 22]) {
    h.moveTo(cx - 7, -76);
    h.lineTo(cx - 7, -142);
    h.quadraticCurveTo(cx - 7, -156, cx, -164);
    h.quadraticCurveTo(cx + 7, -156, cx + 7, -142);
    h.lineTo(cx + 7, -76);
    h.closePath();
  }
  // quatrefoil above
  for (const [dx, dy] of [[0, -6], [6, 0], [0, 6], [-6, 0]]) {
    h.moveTo(dx + 5.5, -182 + dy);
    h.arc(dx, -182 + dy, 5.5, 0, Math.PI * 2);
  }
  return h;
})();
const chairBars = (() => {
  // glazing-like bars across the lancets
  const b = new Path2D();
  b.rect(-34, -112, 68, 3);
  return b;
})();

export function chair(c: Ctx, env: PaintEnv, x: number, y: number, s = 1) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = env.fill('ink');
  c.fill(chairSplat);
  // knock out piercings so the backlight shows through
  c.globalCompositeOperation = 'destination-out';
  c.fill(chairHoles, 'nonzero');
  c.globalCompositeOperation = 'source-over';
  c.fill(chairBars);
  c.restore();
}

export function table(c: Ctx, env: PaintEnv, x0: number, x1: number, top: number, floor: number) {
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.fillRect(x0 - 8, top, x1 - x0 + 16, 10);
  // cloth drop
  c.fillRect(x0, top + 10, x1 - x0, 40);
  // tassel fringe
  for (let x = x0 + 4; x < x1 - 2; x += 8) {
    c.beginPath();
    c.moveTo(x - 1, top + 50);
    c.lineTo(x + 1, top + 50);
    c.lineTo(x + 2.4, top + 61);
    c.quadraticCurveTo(x, top + 64, x - 2.4, top + 61);
    c.closePath();
    c.fill();
  }
  c.strokeStyle = withAlpha(env.mood.rim, 0.14);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x0, top + 46);
  c.lineTo(x1, top + 46);
  c.stroke();
  // turned legs
  const leg = lathe([[0, 6], [10, 8], [22, 4], [40, 9], [52, 4], [70, 3.5], [floor - top - 60 - 4, 5], [floor - top - 60, 7]]);
  for (const lx of [x0 + 24, x0 + (x1 - x0) * 0.36, x0 + (x1 - x0) * 0.64, x1 - 24]) {
    c.save();
    c.translate(lx, top + 60);
    c.fill(leg);
    c.restore();
  }
  // stretcher
  c.fillRect(x0 + 24, floor - 22, x1 - x0 - 48, 4);
}

// ---------------------------------------------------------------- checker floor (perspective)
export function checkerFloor(c: Ctx, env: PaintEnv, x0: number, x1: number, yTop: number, yBot: number, horizon: number) {
  const light = mixLab(env.fill('set'), env.mood.fg, 0.12);
  const dark = mixLab(env.fill('set'), env.mood.fg, 0.62);
  c.fillStyle = dark;
  c.fillRect(x0, yTop, x1 - x0, yBot - yTop);
  // rows in depth: y = horizon + K / z
  const K = (yTop - horizon) * 9;
  const rows: number[] = [];
  for (let z = 9; ; z *= 0.82) {
    const y = horizon + K / z;
    rows.push(Math.min(y, yBot));
    if (y >= yBot) break;
  }
  const vx = 640;
  const tile = 70; // world tile width at y where (y - horizon) = 1 unit... scaled below
  c.fillStyle = light;
  for (let i = 0; i < rows.length - 1; i++) {
    const ya = rows[i], yb = rows[i + 1];
    const sa = (ya - horizon) / (yTop - horizon), sb = (yb - horizon) / (yTop - horizon);
    for (let col = -40; col < 40; col++) {
      if ((col + i) % 2 !== 0) continue;
      const xa0 = vx + col * tile * sa, xa1 = vx + (col + 1) * tile * sa;
      const xb0 = vx + col * tile * sb, xb1 = vx + (col + 1) * tile * sb;
      if (Math.max(xa1, xb1) < x0 || Math.min(xa0, xb0) > x1) continue;
      c.beginPath();
      c.moveTo(xa0, ya);
      c.lineTo(xa1, ya);
      c.lineTo(xb1, yb);
      c.lineTo(xb0, yb);
      c.closePath();
      c.fill();
    }
  }
  // depth darkening toward the viewer
  const g = c.createLinearGradient(0, yTop, 0, yBot);
  g.addColorStop(0, withAlpha(env.mood.fg, 0));
  g.addColorStop(1, withAlpha(env.mood.fg, 0.55));
  c.fillStyle = g;
  c.fillRect(x0, yTop, x1 - x0, yBot - yTop);
}

// ---------------------------------------------------------------- figures (L4)
/** a standing gentleman in profile (feet at 0,0, facing -x), ~310 tall; returns body + cut-lines */
export const gentleman = (() => {
  // separate parts filled one by one (no winding surprises between overlapping parts)
  const parts: Path2D[] = [];
  const part = () => {
    const p = new Path2D();
    parts.push(p);
    return p;
  };
  // legs (stockings) + buckled shoes
  let p = part();
  p.moveTo(-18, -98); p.lineTo(-3, -98); p.bezierCurveTo(-2, -70, -7, -40, -7, -14); p.lineTo(-5, -3); p.lineTo(-28, -1); p.quadraticCurveTo(-31, 2, -27, 3); p.lineTo(-3, 3); p.lineTo(-2, -14); p.bezierCurveTo(-1, -30, -18, -56, -18, -98); p.closePath();
  p = part();
  p.moveTo(1, -98); p.lineTo(16, -98); p.bezierCurveTo(15, -60, 10, -40, 10, -12); p.lineTo(12, 3); p.lineTo(-8, 3); p.quadraticCurveTo(-10, 0, -6, -1); p.lineTo(3, -5); p.bezierCurveTo(3, -40, 1, -70, 1, -98); p.closePath();
  // coat with flared skirts
  p = part();
  p.moveTo(-9, -242);
  p.bezierCurveTo(-24, -232, -27, -205, -25, -176);
  p.bezierCurveTo(-28, -150, -36, -108, -48, -66);
  p.bezierCurveTo(-18, -60, 16, -58, 42, -64);
  p.bezierCurveTo(32, -110, 27, -150, 24, -180);
  p.bezierCurveTo(23, -208, 20, -232, 8, -244);
  p.closePath();
  // neck + head
  p = part();
  p.moveTo(-8, -246); p.lineTo(4, -246); p.lineTo(3, -260); p.lineTo(-7, -260); p.closePath();
  p = part();
  p.moveTo(-6, -292);
  p.bezierCurveTo(-16, -292, -20, -281, -19, -273);
  p.lineTo(-26, -263);
  p.lineTo(-19, -260);
  p.bezierCurveTo(-20, -256, -17, -253, -17, -251);
  p.bezierCurveTo(-17, -247, -13, -244, -8, -245);
  p.lineTo(6, -250);
  p.bezierCurveTo(12, -262, 10, -290, -6, -292);
  p.closePath();
  // front arm holding a book
  p = part();
  p.moveTo(-6, -232);
  p.bezierCurveTo(-18, -215, -20, -190, -14, -170);
  p.lineTo(-40, -178); p.lineTo(-46, -166); p.lineTo(-49, -168); p.lineTo(-50, -158); p.lineTo(-12, -151);
  p.bezierCurveTo(-2, -160, 4, -200, 6, -230);
  p.closePath();
  p = part();
  p.moveTo(-62, -188); p.lineTo(-38, -184); p.lineTo(-40, -167); p.lineTo(-64, -171); p.closePath();
  // full-bottomed periwig: crown + cascading curls behind the face to the chest
  const r = mulberry32(17);
  p = part();
  p.moveTo(-14, -286);
  p.bezierCurveTo(-14, -306, 18, -310, 20, -284);
  p.bezierCurveTo(24, -262, 26, -236, 20, -214);
  p.lineTo(2, -222);
  p.bezierCurveTo(4, -250, 0, -270, -14, -286);
  p.closePath();
  for (let i = 0; i < 34; i++) {
    const u = i / 33;
    const x = 2 + 11 * Math.sin(u * 2.6) + r() * 9;
    const y = -300 + u * 92 + r() * 6;
    const rr = 5 + r() * 4.5 - u * 1.5;
    p.moveTo(x + rr, y);
    p.arc(x, y, rr, 0, Math.PI * 2);
  }
  for (let i = 0; i < 6; i++) {
    const x = -12 + i * 5, y = -296 - Math.sin((i / 5) * Math.PI) * 6;
    p.moveTo(x + 7, y);
    p.arc(x, y, 7, 0, Math.PI * 2);
  }
  const body = parts;
  const cuts = new Path2D();
  // buttons down the coat front
  for (let k = 0; k < 7; k++) {
    const y = -226 + k * 18;
    cuts.moveTo(-22 - k * 0.9 + 1.5, y);
    cuts.arc(-22 - k * 0.9, y, 1.5, 0, Math.PI * 2);
  }
  const lines = new Path2D();
  lines.moveTo(-30, -124); lines.lineTo(-12, -122); // pocket flap
  lines.moveTo(-42, -78); lines.bezierCurveTo(-14, -72, 12, -71, 36, -76); // hem
  lines.moveTo(-40, -177); lines.lineTo(-37, -163); // cuff
  lines.moveTo(6, -170); lines.bezierCurveTo(10, -140, 15, -100, 19, -68); // back vent
  const lace = new Path2D();
  lace.moveTo(-15, -244); lace.lineTo(-9, -246); lace.lineTo(-8, -214); lace.lineTo(-13, -210); lace.lineTo(-18, -216); lace.closePath();
  return { body, cuts, lines, lace };
})();

export function drawGentleman(c: Ctx, env: PaintEnv, x: number, y: number, s = 1, facing: 'left' | 'right' = 'left', breathe = 0) {
  c.save();
  c.translate(x, y);
  c.scale(facing === 'left' ? s : -s, s * (1 + breathe * 0.004));
  c.fillStyle = env.fill('ink');
  for (const part of gentleman.body) c.fill(part, 'nonzero');
  c.fillStyle = withAlpha(env.mood.rim, 0.5);
  c.fill(gentleman.cuts);
  c.strokeStyle = withAlpha(env.mood.rim, 0.45);
  c.lineWidth = 1.2;
  c.stroke(gentleman.lines);
  c.fillStyle = withAlpha(env.mood.rim, 0.26);
  c.fill(gentleman.lace);
  c.restore();
}

/** a tall turned candle stand; candle wick tip at (x, y - height) */
const standPath = lathe([
  [-232, 10], [-226, 22], [-221, 22], [-217, 6], [-205, 5], [-196, 10], [-188, 5],
  [-150, 4], [-120, 6], [-112, 11], [-104, 6], [-60, 4.5], [-40, 8], [-30, 13], [-22, 8], [-14, 20], [-6, 30], [0, 32],
]);
export function candleStand(c: Ctx, env: PaintEnv, x: number, y: number) {
  c.save();
  c.translate(x, y);
  c.fillStyle = env.fill('ink');
  c.fill(standPath);
  // tripod feet
  c.beginPath();
  c.moveTo(-32, 0); c.quadraticCurveTo(-46, -2, -52, 6); c.lineTo(-30, 4);
  c.moveTo(32, 0); c.quadraticCurveTo(46, -2, 52, 6); c.lineTo(30, 4);
  c.fill();
  // the candle (pale wax), lit from its own flame
  const g = c.createLinearGradient(0, -268, 0, -232);
  g.addColorStop(0, mixLab(env.mood.core, env.mood.halo, 0.25));
  g.addColorStop(1, mixLab(env.mood.halo, env.mood.ink, 0.45));
  c.fillStyle = g;
  c.fillRect(-4.5, -268, 9, 37);
  c.restore();
}

// ---------------------------------------------------------------- frame pieces (L5/L6)
export function pillar(c: Ctx, env: PaintEnv, x: number, w: number) {
  const fg = env.fill('fg');
  c.fillStyle = fg;
  c.fillRect(x, -100, w, 1000);
  // capital & base mouldings stick out
  c.fillRect(x - 18, 40, w + 36, 26);
  c.fillRect(x - 10, 66, w + 20, 12);
  c.fillRect(x - 24, 600, w + 48, 30);
  c.strokeStyle = withAlpha(env.mood.rim, 0.07);
  c.lineWidth = 2;
  for (let k = 1; k < 5; k++) {
    c.beginPath();
    c.moveTo(x + (w * k) / 5, 90);
    c.lineTo(x + (w * k) / 5, 590);
    c.stroke();
  }
}

export function nearChair(c: Ctx, env: PaintEnv, x: number, y: number, s: number) {
  chair(c, { ...env, fill: () => env.fill('fg') }, x, y, s);
}

// ---------------------------------------------------------------- exterior (shot 2)
export function townhouses(c: Ctx, env: PaintEnv, x0: number, x1: number, base: number, seed: number) {
  const r = mulberry32(seed);
  const set = env.fill('set');
  const lit = mixLab(env.mood.halo, set, 0.25);
  const dark = mixLab(set, env.mood.ink, 0.2);
  let x = x0;
  while (x < x1) {
    const w = 120 + r() * 80;
    const h = 170 + r() * 110;
    const top = base - h;
    c.fillStyle = set;
    c.beginPath();
    c.moveTo(x, base);
    c.lineTo(x, top);
    if (r() < 0.55) {
      c.lineTo(x + w / 2, top - 46 - r() * 30); // gable
    } else {
      c.lineTo(x + 6, top - 12);
      c.lineTo(x + w - 6, top - 12);
    }
    c.lineTo(x + w, top);
    c.lineTo(x + w, base);
    c.closePath();
    c.fill();
    // chimneys
    const ch = 1 + Math.floor(r() * 2);
    for (let k = 0; k < ch; k++) {
      const cx = x + 18 + r() * (w - 46);
      c.fillRect(cx, top - 58 - r() * 20, 12, 60);
      c.fillRect(cx - 2, top - 62 - 10, 16, 6);
    }
    // windows: some lit
    const cols = Math.max(2, Math.floor(w / 46));
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < cols; col++) {
        const wx = x + 16 + col * ((w - 32) / cols) + 6;
        const wy = top + 26 + row * 52;
        if (wy + 34 > base - 20) continue;
        const on = r() < 0.38;
        c.fillStyle = on ? lit : dark;
        c.fillRect(wx, wy, 16, 30);
        if (on) {
          c.fillStyle = set;
          c.fillRect(wx + 7, wy, 2, 30);
          c.fillRect(wx, wy + 14, 16, 2);
        }
      }
    }
    x += w + 4 + r() * 14;
  }
}

/** a bare tree, branching recursively (seeded, built once per seed) */
const treeCache = new Map<number, Path2D>();
export function bareTree(seed: number): Path2D {
  let p = treeCache.get(seed);
  if (p) return p;
  p = new Path2D();
  const r = mulberry32(seed);
  const path = p;
  const branch = (x: number, y: number, a: number, len: number, w: number, depth: number) => {
    const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
    const nx = -Math.sin(a), ny = Math.cos(a);
    const w2 = w * 0.68;
    const bend = (r() - 0.5) * len * 0.25;
    path.moveTo(x + nx * w, y + ny * w);
    path.quadraticCurveTo((x + x2) / 2 + nx * bend, (y + y2) / 2 + ny * bend, x2 + nx * w2, y2 + ny * w2);
    path.lineTo(x2 - nx * w2, y2 - ny * w2);
    path.quadraticCurveTo((x + x2) / 2 + nx * bend, (y + y2) / 2 + ny * bend, x - nx * w, y - ny * w);
    path.closePath();
    if (depth <= 0 || w2 < 0.45) return;
    const n = 2 + (r() < 0.35 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const da = (i - (n - 1) / 2) * (0.5 + r() * 0.3) + (r() - 0.5) * 0.25;
      branch(x2, y2, a + da, len * (0.66 + r() * 0.16), w2, depth - 1);
    }
  };
  branch(0, 0, -Math.PI / 2, 90, 7, 7);
  treeCache.set(seed, p);
  return p;
}

/** an ornate gas lamp post; lantern centre at (x, y - 236) */
const postPath = lathe([
  [-214, 3], [-206, 6], [-196, 3.5], [-120, 3.5], [-60, 4.5], [-40, 8], [-30, 5], [-16, 10], [-6, 14], [0, 15],
]);
export function lampPost(c: Ctx, env: PaintEnv, x: number, y: number) {
  c.save();
  c.translate(x, y);
  c.fillStyle = env.fill('ink');
  c.fill(postPath);
  // cross-bar
  c.fillRect(-18, -212, 36, 3);
  // lantern: tapered glass box with roof and finial
  c.beginPath();
  c.moveTo(-12, -218); c.lineTo(12, -218); c.lineTo(15, -252); c.lineTo(-15, -252); c.closePath();
  c.fill();
  c.beginPath();
  c.moveTo(-20, -252); c.lineTo(20, -252); c.lineTo(0, -270); c.closePath();
  c.fill();
  c.beginPath();
  c.arc(0, -273, 3.4, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
/** glazing of a lantern (lit amount 0..1), drawn after the post */
export function lanternGlass(c: Ctx, env: PaintEnv, x: number, y: number, lit: number) {
  c.save();
  c.translate(x, y);
  c.fillStyle = mixLab(mixLab(env.mood.ink, env.mood.set, 0.6), env.mood.core, lit);
  c.beginPath();
  c.moveTo(-9, -221); c.lineTo(9, -221); c.lineTo(11.5, -249); c.lineTo(-11.5, -249); c.closePath();
  c.fill();
  c.fillStyle = env.fill('ink');
  c.fillRect(-0.8, -249, 1.6, 28);
  c.restore();
}

/** deterministic snow: flakes advance with t (on ones); draws in the current layer */
export function snow(c: Ctx, env: PaintEnv, n: number, seed: number, size: number, speed: number, alpha: number, t: number) {
  const r = mulberry32(seed);
  c.fillStyle = withAlpha(mixLab(env.mood.rim, '#ffffff', 0.3), alpha);
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const x0 = r() * 1700 - 210, y0 = r() * 900, ph = r() * 6.28, sp = speed * (0.7 + r() * 0.6), sz = size * (0.6 + r() * 0.8);
    const y = ((y0 + sp * t) % 900) - 90;
    const x = x0 + Math.sin(t * 0.9 + ph) * 9 - t * sp * 0.15;
    c.moveTo(x + sz, y);
    c.arc(x, y, sz, 0, Math.PI * 2);
  }
  c.fill();
}

/** a heavy theatre drape gathered by a tasselled tie-back (frame piece, L5/L6) */
export function curtain(c: Ctx, env: PaintEnv, x: number, w: number, tieY: number, floorY: number) {
  const fg = env.fill('fg');
  const tx = x + w * 0.42;
  c.fillStyle = fg;
  c.beginPath();
  c.moveTo(x - 60, -60);
  c.lineTo(x + w, -60);
  c.bezierCurveTo(x + w * 0.95, tieY * 0.45, x + w * 0.5, tieY - 40, tx, tieY);
  c.bezierCurveTo(x + w * 0.5, tieY + 110, x + w * 0.74, floorY - 90, x + w * 0.8, floorY + 60);
  c.lineTo(x - 60, floorY + 60);
  c.closePath();
  c.fill();
  // folds
  c.strokeStyle = withAlpha(env.mood.rim, 0.07);
  c.lineWidth = 2;
  for (let k = 1; k < 6; k++) {
    const u = k / 6;
    c.beginPath();
    c.moveTo(x - 40 + (w + 30) * u, -60);
    c.quadraticCurveTo(x + w * 0.2 * u + 10, tieY * 0.6, tx - 8 + 6 * u, tieY - 6);
    c.moveTo(tx - 6 + 6 * u, tieY + 8);
    c.quadraticCurveTo(x + w * (0.1 + 0.55 * u), tieY + 160, x - 40 + (w * 0.8 + 40) * u, floorY + 50);
    c.stroke();
  }
  // tie-back rope and tassel
  c.fillStyle = fg;
  c.beginPath();
  c.ellipse(tx, tieY, 16, 7, -0.2, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(tx + 6, tieY + 4);
  c.lineTo(tx + 12, tieY + 30);
  c.bezierCurveTo(tx + 26, tieY + 36, tx + 26, tieY + 70, tx + 22, tieY + 82);
  c.lineTo(tx + 2, tieY + 82);
  c.bezierCurveTo(tx - 2, tieY + 70, tx - 2, tieY + 36, tx + 12, tieY + 30);
  c.fill();
}
