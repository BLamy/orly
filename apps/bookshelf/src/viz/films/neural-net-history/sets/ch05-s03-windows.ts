/**
 * ch05-s03 — THE WANDERING DESK, built in depth (review round 1: "the set is flat: a plank wall with a
 * rectangular screen inset"). Each stop is layered, not a painted cloth:
 *
 *   L1  the far view through the window (sky ramp, far ridges, rooftops, stacks), cached per stop
 *   L2  the dark stage wall with the stop's WINDOW CUT as an evenodd hole (no plate around it): its frame,
 *       mullions or tracery; the mid-distance pieces (the Pittsburgh bridge, Toronto's snow) sit just behind it
 *       (fog sheet A between L2 and the action plane is the shot's)
 *
 *   winGeoFor(screenRect, cam)      the window's L2-world rect for a stop, from where it should sit on screen
 *   farRectFor(win, cams, pad)      the L1-world rect the far view must cover (seen through that window)
 *   farView(f, c, kind, rect, env, key)            L1 painter
 *   windowWall(f, c, kind, win, wallRect, env, key, o)   L2 painter (wall + hole + frame + behind-glass pieces)
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { toLayer, toScreen, type Rect } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';
import { snow } from '../../../film/silhouette/atmosphere';
import type { ClothKind } from './ch05-s03-desks';

type C = CanvasRenderingContext2D;
export interface WinGeo {
  /** L2-world window opening */
  x: number;
  y: number;
  w: number;
  h: number;
}
const h01 = (i: number, s: number) => 0.5 + 0.5 * hash1(i, s);

/** the L2 rect whose screen image at `cam` is the screen rect r */
export function winGeoFor(r: Rect, cam: Camera3): WinGeo {
  const a = toLayer(LAYERS.L2, cam, r.x, r.y);
  const b = toLayer(LAYERS.L2, cam, r.x + r.w, r.y + r.h);
  return { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
}

/** the L1 rect that covers everything seen through the window across these cameras */
export function farRectFor(g: WinGeo, cams: Camera3[], pad = 90): Rect {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const cam of cams)
    for (const [x, y] of [[g.x, g.y], [g.x + g.w, g.y + g.h]]) {
      const s = toScreen(LAYERS.L2, cam, x, y);
      const l = toLayer(LAYERS.L1, cam, s.x, s.y);
      x0 = Math.min(x0, l.x);
      y0 = Math.min(y0, l.y);
      x1 = Math.max(x1, l.x);
      y1 = Math.max(y1, l.y);
    }
  return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 };
}

// ------------------------------------------------------------------ L1: the far view
function palm(c: C, x: number, base: number, h: number, lean: number, ink: string) {
  c.fillStyle = ink;
  const top = { x: x + lean * h * 0.25, y: base - h };
  c.beginPath();
  c.moveTo(x - 5, base);
  c.quadraticCurveTo(x + lean * h * 0.05 - 3, base - h * 0.5, top.x - 2, top.y);
  c.lineTo(top.x + 2, top.y);
  c.quadraticCurveTo(x + lean * h * 0.05 + 3, base - h * 0.5, x + 5, base);
  c.closePath();
  c.fill();
  for (let k = 0; k < 9; k++) {
    const a = -Math.PI / 2 + (k - 4) * 0.42;
    const L = h * (0.24 + 0.04 * (k % 3));
    const ex = top.x + Math.cos(a) * L * 1.1;
    const ey = top.y + Math.sin(a) * L * 0.35 + L * 0.45 * Math.abs(Math.cos(a));
    c.beginPath();
    c.moveTo(top.x, top.y);
    c.quadraticCurveTo(top.x + Math.cos(a) * L * 0.6, top.y + Math.sin(a) * L * 0.75 - 8, ex, ey);
    c.quadraticCurveTo(top.x + Math.cos(a) * L * 0.5, top.y + Math.sin(a) * L * 0.5 - 2, top.x, top.y + 3);
    c.fill();
  }
}

function paintFar(c: C, kind: ClothKind, r: Rect, env: PaintEnv) {
  const m = env.mood;
  const { x, y, w, h } = r;
  // the sky: a ramp brightest at the horizon (the window is the light source of the set)
  const hz = y + h * 0.66;
  const g = c.createLinearGradient(0, y, 0, y + h);
  const night = kind === 'blank';
  g.addColorStop(0, night ? mixLab(m.sky[0], m.set, 0.4) : m.sky[0]);
  g.addColorStop(0.45, night ? mixLab(m.sky[1], m.set, 0.3) : m.sky[1]);
  g.addColorStop(0.66, night ? mixLab(m.sky[2], m.set, 0.35) : mixLab(m.sky[3], m.core, kind === 'sandiego' ? 0.25 : 0.1));
  g.addColorStop(1, night ? mixLab(m.sky[1], m.set, 0.4) : m.sky[2]);
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  const far = mixLab(m.sky[1], m.set, 0.45);
  const mid = mixLab(m.set, m.sky[0], 0.25);
  const ridge = (yy: number, amp: number, f1: number, col: string) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x, y + h);
    for (let xx = x; xx <= x + w + 20; xx += 18) c.lineTo(xx, yy - amp * Math.sin(xx * f1 + 0.6) - amp * 0.35 * Math.sin(xx * f1 * 3.7));
    c.lineTo(x + w, y + h);
    c.closePath();
    c.fill();
  };
  if (night) {
    // Sussex, where we left him: a winter night, a hedge line, a few stars
    ridge(hz + 30, 6, 0.02, mixLab(m.set, m.fg, 0.3));
    c.fillStyle = withAlpha(m.rim, 0.4);
    for (let k = 0; k < 40; k++) c.fillRect(x + h01(k, 21) * w, y + h01(k, 22) * h * 0.6, 1.6, 1.6);
    return;
  }
  if (kind === 'sandiego') {
    const sg = c.createRadialGradient(x + w * 0.42, hz, 4, x + w * 0.42, hz, 160);
    sg.addColorStop(0, withAlpha(m.core, 0.5));
    sg.addColorStop(1, withAlpha(m.core, 0));
    c.fillStyle = sg;
    c.fillRect(x, y, w, h);
    ridge(hz + 4, 12, 0.012, far);
    // the low campus roofline: long flat blocks
    c.fillStyle = mid;
    c.fillRect(x + w * 0.1, hz + 14, w * 0.42, h);
    c.fillRect(x + w * 0.48, hz + 26, w * 0.46, h);
    c.fillStyle = withAlpha(m.halo, 0.4);
    for (let xx = x + w * 0.12; xx < x + w * 0.5; xx += 16) c.fillRect(xx, hz + 24, 8, 5);
    palm(c, x + w * 0.2, y + h, h * 0.62, -0.2, mixLab(m.ink, m.set, 0.3));
    palm(c, x + w * 0.72, y + h, h * 0.74, 0.25, mixLab(m.ink, m.set, 0.3));
    palm(c, x + w * 0.83, y + h, h * 0.5, 0.1, mixLab(m.ink, m.set, 0.3));
    return;
  }
  if (kind === 'cambridge') {
    // college roofs and a far chapel with pinnacles
    ridge(hz + 30, 4, 0.02, far);
    c.fillStyle = mid;
    c.fillRect(x + w * 0.05, hz - 10, w * 0.9, h);
    for (const px of [0.18, 0.3, 0.62, 0.74]) {
      c.beginPath();
      c.moveTo(x + w * px - 9, hz - 10);
      c.lineTo(x + w * px, hz - 70);
      c.lineTo(x + w * px + 9, hz - 10);
      c.fill();
    }
    c.fillRect(x + w * 0.4, hz - 60, w * 0.16, 60);
    return;
  }
  if (kind === 'pittsburgh') {
    ridge(hz - 10, 26, 0.008, far);
    // the mill across the river: a bulk, four stacks, smoke drifting right
    c.fillStyle = mid;
    const mx = x + w * 0.55;
    c.fillRect(mx, hz - 20, w * 0.3, h);
    for (const [dx, sh] of [[0.02, 150], [0.07, 178], [0.12, 160], [0.24, 128]] as const) {
      const sx = mx + w * dx;
      c.fillRect(sx, hz - 20 - sh, 11, sh);
      for (let k = 0; k < 6; k++) {
        const rr = 10 + k * 6;
        const px = sx + 6 + k * 18, py = hz - 30 - sh - k * 9;
        const sm = c.createRadialGradient(px, py, 0, px, py, rr);
        sm.addColorStop(0, withAlpha(m.haze, 0.36 - k * 0.05));
        sm.addColorStop(1, withAlpha(m.haze, 0));
        c.fillStyle = sm;
        c.fillRect(px - rr, py - rr, rr * 2, rr * 2);
      }
      c.fillStyle = mid;
    }
    c.beginPath();
    c.ellipse(mx + w * 0.2, hz - 22, 20, 36, 0, 0, Math.PI * 2);
    c.fill();
    // the river: a pale band with glints
    c.fillStyle = mixLab(m.sky[2], m.set, 0.25);
    c.fillRect(x, hz + 22, w, 40);
    c.strokeStyle = withAlpha(m.rim, 0.25);
    c.lineWidth = 1;
    for (let k = 0; k < 16; k++) {
      const yy = hz + 28 + (k % 4) * 8, xx = x + h01(k, 9) * w;
      c.beginPath();
      c.moveTo(xx, yy);
      c.lineTo(xx + 26 + h01(k, 10) * 40, yy);
      c.stroke();
    }
    c.fillStyle = mixLab(m.set, m.fg, 0.3);
    c.fillRect(x, hz + 62, w, h);
    return;
  }
  // toronto: a generic skyline in the dusk
  ridge(hz + 30, 3, 0.02, far);
  c.fillStyle = mid;
  let xx = x - 10;
  let i = 0;
  while (xx < x + w) {
    const bw = 28 + h01(i, 71) * 50;
    const bh = 50 + h01(i + 100, 71) * 170;
    c.fillRect(xx, hz + 40 - bh, bw - 4, h);
    xx += bw;
    i++;
  }
  c.fillStyle = withAlpha(m.halo, 0.5);
  for (let k = 0; k < 90; k++) {
    const wx = x + h01(k, 5) * w, wy = hz + 40 - h01(k, 6) * 160;
    if (h01(k, 7) > 0.55) c.fillRect(wx, wy, 4, 5);
  }
}

export function farView(f: Frame, c: C, kind: ClothKind, r: Rect, env: PaintEnv, key: string, alpha = 1) {
  if (alpha <= 0.003) return;
  c.save();
  c.globalAlpha *= alpha;
  f.cached(`${key}/far/${kind}/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paintFar(cc, kind, r, env);
  })(c, r.x, r.y);
  c.restore();
}

// ------------------------------------------------------------------ L2: the wall with the window cut
/** the opening's outline (added to p as a sub-path) */
function hole(p: Path2D, kind: ClothKind, g: WinGeo) {
  const { x, y, w, h } = g;
  if (kind === 'cambridge') {
    // a pointed gothic arch: two arcs meeting at the apex
    const spring = y + w * 0.8;
    const r = w * 0.86;
    p.moveTo(x, y + h);
    p.lineTo(x, spring);
    p.arc(x + r, spring, r, Math.PI, Math.PI + Math.acos((r - w / 2) / r));
    p.arc(x + w - r, spring, r, -Math.acos((r - w / 2) / r), 0);
    p.lineTo(x + w, y + h);
    p.closePath();
    return;
  }
  p.rect(x, y, w, h);
}

/** frame, mullions, tracery, sill: ink paper-cut pieces laid on the hole (bars kept clear of `clearX`) */
function frameBits(c: C, kind: ClothKind, g: WinGeo, env: PaintEnv, clearX: number) {
  const m = env.mood;
  const ink = env.fill('ink');
  const { x, y, w, h } = g;
  c.fillStyle = ink;
  const bar = (bx: number, by: number, bw: number, bh: number) => c.fillRect(bx, by, bw, bh);
  // a vertical bar position nudged out of the head's way
  const vx = (u: number) => {
    let px = x + w * u;
    if (Math.abs(px - clearX) < 70) px = clearX + (px < clearX ? -70 : 70);
    return px;
  };
  if (kind === 'cambridge') {
    const spring = y + w * 0.8;
    for (const u of [0.25, 0.75]) bar(vx(u) - 3.5, spring - 6, 7, y + h - spring + 6);
    bar(x, spring + (y + h - spring) * 0.18, w, 6);
    c.strokeStyle = ink;
    c.lineWidth = 6;
    for (const [qx, qy, qr] of [[x + w / 2, spring - w * 0.3, w * 0.11], [x + w * 0.27, spring - w * 0.08, w * 0.08], [x + w * 0.73, spring - w * 0.08, w * 0.08]] as const) {
      c.beginPath();
      for (let k = 0; k < 4; k++) c.arc(qx + Math.cos((k * Math.PI) / 2) * qr * 0.5, qy + Math.sin((k * Math.PI) / 2) * qr * 0.5, qr * 0.5, 0, Math.PI * 2);
      c.stroke();
    }
    c.lineWidth = 9;
    const p = new Path2D();
    hole(p, kind, g);
    c.stroke(p);
  } else {
    // the frame: a heavy surround, and the bars of each stop's window
    const fw = kind === 'pittsburgh' ? 9 : 11;
    bar(x - fw, y - fw, w + fw * 2, fw);
    bar(x - fw, y - fw, fw, h + fw);
    bar(x + w, y - fw, fw, h + fw);
    if (kind === 'blank') {
      bar(vx(0.5) - 4, y, 8, h);
      bar(x, y + h * 0.5 - 4, w, 8);
    } else if (kind === 'sandiego') {
      for (const u of [0.33, 0.66]) bar(vx(u) - 3, y, 6, h);
      bar(x, y + h * 0.16, w, 5);
    } else if (kind === 'pittsburgh') {
      // a steel factory-office window: thin bars, a transom high, small top lights
      bar(vx(0.8) - 2.5, y, 5, h);
      bar(x, y + h * 0.22, w, 5);
      for (const u of [0.2, 0.4, 0.6]) bar(x + w * u - 2, y, 4, h * 0.22);
    } else {
      // toronto: a study window, a centre bar and two glazing bars
      bar(vx(0.82) - 4, y, 8, h);
      bar(x, y + h * 0.3 - 3, w, 6);
    }
  }
  // the sill: a ledge proud of the wall, catching the window's light along its top
  bar(x - 22, y + h, w + 44, 12);
  c.fillStyle = withAlpha(m.rim, 0.32);
  c.fillRect(x - 22, y + h, w + 44, 1.4);
}

export function windowWall(
  f: Frame,
  c: C,
  kind: ClothKind,
  g: WinGeo,
  wall: Rect,
  env: PaintEnv,
  key: string,
  o: { alpha?: number; clearX: number; t: number; snow?: number },
) {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  const m = env.mood;
  c.save();
  c.globalAlpha *= a;
  // behind the glass, in front of the far view: Toronto's snow
  if (kind === 'toronto' && (o.snow ?? 0) > 0) {
    c.save();
    c.beginPath();
    c.rect(g.x, g.y, g.w, g.h);
    c.clip();
    c.globalAlpha *= o.snow ?? 1;
    snow(c, { area: { x: g.x - 20, y: g.y - 60, w: g.w + 40, h: g.h + 60 }, count: 80, salt: 87, color: m.core }, env);
    c.restore();
  }
  // the wall (baked): a near-black paper stage wall with the window cut out of it
  f.cached(`${key}/wall/${kind}/${m.id}/${Math.round(g.x)},${Math.round(g.y)},${Math.round(g.w)}/${Math.round(wall.x)},${Math.round(wall.w)}`, Math.ceil(wall.w), Math.ceil(wall.h), (cc) => {
    cc.translate(-wall.x, -wall.y);
    const p = new Path2D();
    p.rect(wall.x, wall.y, wall.w, wall.h);
    hole(p, kind, g);
    cc.fillStyle = mixLab(env.fill('set'), m.fg, 0.7);
    cc.fill(p, 'evenodd');
    cc.save();
    cc.clip(p, 'evenodd');
    // the paper's folds, and the window's light thrown on the wall around the opening
    cc.strokeStyle = withAlpha(m.fg, 0.6);
    cc.lineWidth = 3;
    for (let xx = Math.floor(wall.x / 70) * 70; xx < wall.x + wall.w; xx += 70) {
      cc.beginPath();
      cc.moveTo(xx, wall.y);
      cc.bezierCurveTo(xx + 14, wall.y + wall.h * 0.3, xx - 14, wall.y + wall.h * 0.6, xx + 6, wall.y + wall.h);
      cc.stroke();
    }
    const cx = g.x + g.w / 2, cy = g.y + g.h * 0.6;
    const lg = cc.createRadialGradient(cx, cy, g.w * 0.3, cx, cy, g.w * 0.95);
    lg.addColorStop(0, withAlpha(m.setHaze, 0.32));
    lg.addColorStop(1, withAlpha(m.setHaze, 0));
    cc.fillStyle = lg;
    cc.fillRect(cx - g.w, cy - g.w, g.w * 2, g.w * 2);
    cc.restore();
  })(c, wall.x, wall.y);
  // behind the glass but in front of the far view: the Pittsburgh bridge (mid distance, sharper than L1)
  if (kind === 'pittsburgh') {
    c.save();
    const p = new Path2D();
    hole(p, kind, g);
    c.clip(p);
    const ink = mixLab(m.set, m.fg, 0.45);
    c.strokeStyle = ink;
    c.fillStyle = ink;
    // low in the opening and left of his head, so the profile stays on clean window light
    const deck = g.y + g.h * 0.93;
    const x0 = g.x - 60, span = Math.max(g.w * 0.3, o.clearX - 70 - x0);
    c.fillRect(g.x - 20, deck, g.w + 40, 6);
    c.lineWidth = 3.5;
    c.beginPath();
    c.moveTo(x0, deck);
    c.quadraticCurveTo(x0 + span / 2, deck - g.h * 0.42, x0 + span, deck);
    c.stroke();
    c.lineWidth = 1.8;
    for (let k = 1; k < 12; k++) {
      const u = k / 12;
      const xx = x0 + span * u;
      const yy = deck - g.h * 0.42 * 2 * u * (1 - u);
      c.beginPath();
      c.moveTo(xx, deck);
      c.lineTo(xx, yy);
      if (k % 2) c.lineTo(xx + span / 12, deck);
      c.stroke();
    }
    for (const px of [x0, x0 + span]) c.fillRect(px - 6, deck, 12, g.h);
    c.restore();
  }
  frameBits(c, kind, g, env, o.clearX);
  c.restore();
}
