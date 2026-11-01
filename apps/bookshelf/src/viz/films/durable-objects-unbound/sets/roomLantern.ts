/**
 * durable-objects-unbound — THE ROOM LANTERN (staging.buildList.roomLantern): the harbour chat room (illustrative)
 * as a ribbed paper lantern with its members' silhouettes inside and a small paper door with a brass latch.
 * It lives in one house window at a time (lit = serving). The Held Letter rests against its latch (heldLetter.ts).
 *
 *   roomLantern(c, env, o)        x, y = the lantern's BASE centre; s = 1 is 60 x 86 px (in a house window use ~0.5)
 *   lanternPt(o, key)             'flame' (practical anchor) | 'door' (latch centre) | 'top' | 'centre'
 *
 * Options: lit 0..1 (paper glow; 0 = dark paper), members 0..5 (silhouettes inside, fading in by index),
 * memberSway (twos-quantised), door 0..1 (latch lifted), slips [{u, tick}] small slips inside the paper (u =
 * vertical position 0..1), threads 0..1 (threads of light from each member to the centre: broadcast), cutaway
 * (0..1 show the inside as a lit stage: the paper fades to a frame so the shot can draw inside),
 * colour 'amber' (default) | 'green' (celld's town) | 'cold' (ghost).
 */
import { mixLab, withAlpha } from '../../../film';
import type { PaintEnv } from '../../../film';
import { BRASS_HI, brass, clamp01, glowDot, tickMark, tone, type C2 } from './common';

export interface LanternSlip {
  /** horizontal position -1..1 inside */
  x: number;
  /** vertical 0 (base) .. 1 (top) */
  y: number;
  tick?: number;
  alpha?: number;
}
export interface RoomLanternOpts {
  x: number;
  y: number;
  s?: number;
  lit: number;
  members?: number;
  /** quantised time for the members' slight sway */
  tq?: number;
  door?: number;
  slips?: LanternSlip[];
  threads?: number;
  cutaway?: number;
  colour?: 'amber' | 'green' | 'cold';
  alpha?: number;
  /** draw the hanging hook and cord above (default true) */
  hook?: boolean;
}
const W = 60, H = 86;
export function lanternPt(o: { x: number; y: number; s?: number }, key: 'flame' | 'door' | 'top' | 'centre'): { x: number; y: number } {
  const s = o.s ?? 1;
  switch (key) {
    case 'flame': return { x: o.x, y: o.y - H * 0.42 * s };
    case 'door': return { x: o.x, y: o.y - 9 * s };
    case 'top': return { x: o.x, y: o.y - H * s };
    default: return { x: o.x, y: o.y - H * 0.5 * s };
  }
}
const MEMBERS = [
  { x: -0.42, h: 0.5, r: 0.11 },
  { x: 0.4, h: 0.46, r: 0.1 },
  { x: -0.08, h: 0.56, r: 0.115 },
  { x: 0.18, h: 0.42, r: 0.095 },
  { x: -0.25, h: 0.4, r: 0.09 },
];
export function roomLantern(c: C2, env: PaintEnv, o: RoomLanternOpts): void {
  const A = o.alpha ?? 1;
  if (A <= 0.002) return;
  const s = o.s ?? 1;
  const lit = clamp01(o.lit);
  const cut = clamp01(o.cutaway ?? 0);
  c.save();
  c.globalAlpha *= A;
  c.translate(o.x, o.y);
  c.scale(s, s);
  const ink = env.fill('ink');
  const warm = o.colour === 'green' ? '#cfe6a0' : o.colour === 'cold' ? '#b9c8d8' : '#ffc46e';
  const core = tone(env, warm, 0.08);
  const paperDark = mixLab(env.fill('set'), env.mood.fg, 0.2);
  // hook + cord
  if (o.hook !== false) {
    c.strokeStyle = ink;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(0, -H - 4);
    c.lineTo(0, -H - 18);
    c.stroke();
  }
  // body path: a rounded barrel
  const body = new Path2D();
  body.moveTo(-W * 0.32, -H + 8);
  body.bezierCurveTo(-W * 0.62, -H * 0.78, -W * 0.62, -H * 0.2, -W * 0.34, -8);
  body.lineTo(W * 0.34, -8);
  body.bezierCurveTo(W * 0.62, -H * 0.2, W * 0.62, -H * 0.78, W * 0.32, -H + 8);
  body.closePath();
  // paper: glowing gradient (lit) or dull
  const g = c.createRadialGradient(0, -H * 0.45, 2, 0, -H * 0.45, W * 0.62);
  g.addColorStop(0, mixLab(paperDark, mixLab(core, '#fff6e0', 0.35), lit));
  g.addColorStop(0.6, mixLab(paperDark, core, lit * 0.9));
  g.addColorStop(1, mixLab(paperDark, mixLab(core, env.mood.fg, 0.45), lit * 0.8));
  c.globalAlpha = A * (1 - cut * 0.85);
  c.fillStyle = g;
  c.fill(body);
  c.globalAlpha = A;
  // members inside: soft silhouettes behind the paper
  const n = Math.max(0, Math.min(5, o.members ?? 0));
  const sway = o.tq ?? 0;
  c.save();
  c.clip(body);
  for (let i = 0; i < 5; i++) {
    const k = clamp01(n - i);
    if (k <= 0.01) continue;
    const m = MEMBERS[i];
    const mx = m.x * W * 0.5 + Math.sin(sway * 0.9 + i * 1.7) * 0.8;
    const my = -8;
    const hh = m.h * H;
    c.globalAlpha = A * k * (0.35 + 0.45 * Math.max(lit, cut));
    c.fillStyle = mixLab(ink, core, 0.15 * (1 - cut));
    // shoulders + head
    c.beginPath();
    c.moveTo(mx - m.r * W * 1.25, my);
    c.quadraticCurveTo(mx - m.r * W * 1.2, my - hh * 0.55, mx, my - hh * 0.6);
    c.quadraticCurveTo(mx + m.r * W * 1.2, my - hh * 0.55, mx + m.r * W * 1.25, my);
    c.closePath();
    c.fill();
    c.beginPath();
    c.arc(mx, my - hh * 0.6 - m.r * W * 0.62, m.r * W * 0.55, 0, Math.PI * 2);
    c.fill();
  }
  // threads of light from each member to the centre
  const th = clamp01(o.threads ?? 0);
  if (th > 0.01 && lit > 0.1) {
    c.globalAlpha = A * th * 0.8;
    c.strokeStyle = mixLab(core, '#fff4d8', 0.5);
    c.lineWidth = 0.7;
    for (let i = 0; i < n; i++) {
      const m = MEMBERS[i];
      const mx = m.x * W * 0.5, my = -8 - m.h * H * 0.6 - m.r * W * 0.62;
      c.beginPath();
      c.moveTo(mx, my);
      c.lineTo(0, -H * 0.5);
      c.stroke();
    }
  }
  // slips inside
  for (const sl of o.slips ?? []) {
    const a = sl.alpha ?? 1;
    if (a <= 0.01) continue;
    const sx = sl.x * W * 0.32, sy = -10 - sl.y * (H - 24);
    c.globalAlpha = A * a;
    c.fillStyle = mixLab(tone(env, '#f4e8cc', 0.2), core, 0.25);
    c.fillRect(sx - 7, sy - 3, 14, 6);
    if ((sl.tick ?? 0) > 0) tickMark(c, sx + 3.5, sy, 5, sl.tick ?? 0, '#1d1712', 0.2);
  }
  c.restore();
  c.globalAlpha = A;
  // ribs
  c.strokeStyle = withAlpha(mixLab(ink, core, 0.25 * lit), 0.55 + 0.3 * (1 - lit));
  c.lineWidth = 0.9;
  for (const k of [-0.62, -0.3, 0, 0.3, 0.62]) {
    c.beginPath();
    c.moveTo(k * W * 0.52, -H + 9);
    c.bezierCurveTo(k * W * 0.95, -H * 0.72, k * W * 0.95, -H * 0.26, k * W * 0.55, -9);
    c.stroke();
  }
  for (const yy of [0.3, 0.55, 0.78]) {
    c.beginPath();
    c.ellipse(0, -H * yy, W * 0.5 * Math.sin(Math.PI * (0.15 + yy * 0.7)) + 3, 2, 0, 0, Math.PI);
    c.stroke();
  }
  // caps
  c.fillStyle = ink;
  c.fillRect(-W * 0.36, -H + 2, W * 0.72, 8);
  c.fillRect(-W * 0.38, -10, W * 0.76, 10);
  // the door (a small paper door in the base cap) and its brass latch
  const door = clamp01(o.door ?? 0);
  c.fillStyle = mixLab(ink, core, 0.18 * lit);
  c.fillRect(-7, -22, 14, 14);
  c.strokeStyle = withAlpha(mixLab(core, ink, 0.4), 0.7 * lit + 0.2);
  c.lineWidth = 0.8;
  c.strokeRect(-7, -22, 14, 14);
  c.save();
  c.translate(-8, -15);
  c.rotate(-1.2 * door);
  c.fillStyle = brass(env, 0.55);
  c.fillRect(0, -1.6, 17, 3.2);
  c.restore();
  c.restore();
  // halo
  if (lit > 0.02) glowDot(c, o.x, o.y - H * 0.48 * s, W * 0.95 * s, core, lit * 0.55 * A);
  // brass catch-light on the latch
  if (door > 0.05) glowDot(c, o.x - 2 * s, o.y - 17 * s, 6 * s, tone(env, BRASS_HI, 0.1), door * 0.5 * A);
}
