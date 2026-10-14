/**
 * ch08-s02 — a Toronto bedroom at night, 2011–2012 (minimal and generic: a desk, a desk lamp, a window onto a
 * dark street, a desktop tower with a side window on the floor). Nothing here is a likeness of a real room.
 *
 * GEOGRAPHY (L4 world = rest-screen px at CAMERA3_HOME; floor y 640):
 *   window (L2 hole)   x 380–640, y 110–520, a street lamp and terraced houses beyond (L1)
 *   desk (L4)          x 660–1010, top y 476; the monitor centred at (800, 372); the anglepoise at x 985
 *   chair + K (L4)     the seated figure seen from behind at x 800 (head ≈ y 392)
 *   tower (L4)         floor-standing at x 1110 (scale 4.6: ≈ 220 px tall), side window facing us
 *   POOL               the anglepoise's circle of light on the tower's side window (the match-cut circle)
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, toLayer, toScreen, type Rect } from '../../../film/core/multiplane';
import type { Camera3 } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';
import { tree } from '../../../film/silhouette/nature';
import { CM, desktopTower, gpuCard } from '../../../film/silhouette/props';
import { glow } from '../../../film/silhouette/metaphors/kit';

type C = CanvasRenderingContext2D;
export const BR = {
  floor: 640,
  window: { x: 400, y: 110, w: 270, h: 410 },
  desk: { x0: 660, x1: 1010, top: 476 },
  monitor: { x: 800, y: 372, w: 210, h: 132 },
  lampX: 985,
  chairX: 800,
  tower: { x: 1096, s: 1.35 },
  /** the sodium street lamp beyond the glass (its own 'street' plane, z 2600): post from y 330 down, head right */
  streetLamp: { x: 545, y: 330 },
} as const;
/** the tower's window rectangle (world), from desktopTower's geometry (48 × 47 units) */
export const TOWER_WIN = (() => {
  const s = BR.tower.s * CM;
  return { x: BR.tower.x + (-24 + 3.4) * s, y: BR.floor + (-47 + 4.4) * s, w: (48 - 10) * s, h: (47 - 12) * s };
})();
/** the lamp's circle on the tower window: its centre is the match-cut point */
export const POOL = { x: TOWER_WIN.x + TOWER_WIN.w * 0.5, y: TOWER_WIN.y + TOWER_WIN.h * 0.52, r: TOWER_WIN.w * 0.44 };

const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;
function bake(f: Frame, c: C, key: string, r: Rect, paint: (g: C) => void) {
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (g) => {
    g.translate(-r.x, -r.y);
    paint(g);
  })(c, r.x, r.y);
}

/** L1 the street, L2 the bedroom wall with the window hole */
const STREET = { id: 'street', z: 2600, haze: 0.42, blur: 2 };
export function bedroomBack(f: Frame, key: string, cams: Camera3[], lampCam?: Camera3) {
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, cams, 80);
    bake(f, c, `${key}/br/L1/${env.mood.id}/${rk(r)}/night2`, r, (g) => {
      // night: an opaque low sky (sky[1] → sky[2], pushed toward black), so the glass is darker than the monitor
      // and the desk lamp, which are the key lights; one far sodium street lamp is the window's only practical
      const sk = g.createLinearGradient(0, 100, 0, 560);
      sk.addColorStop(0, mixLab(env.mood.sky[1], env.mood.fg, 0.72));
      sk.addColorStop(1, mixLab(env.mood.sky[2], env.mood.fg, 0.55));
      g.fillStyle = sk;
      g.fillRect(r.x, r.y, r.w, r.h);
      // terraced houses across the street (darker than the night sky), a few dim lit windows
      g.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.3);
      const p = new Path2D();
      let x = r.x;
      let k = 0;
      p.moveTo(r.x, r.y + r.h);
      while (x < r.x + r.w) {
        const w = 120 + 60 * hash1(k, 21);
        const h = 150 + 60 * hash1(k, 22);
        p.lineTo(x, 560 - h);
        p.lineTo(x + w / 2, 520 - h - 50);
        p.lineTo(x + w, 560 - h);
        x += w;
        k++;
      }
      p.lineTo(r.x + r.w, r.y + r.h);
      p.closePath();
      g.fill(p);
      x = r.x;
      k = 0;
      while (x < r.x + r.w) {
        for (let j = 0; j < 2; j++)
          if (hash1(k * 5 + j, 23) > 0.62) {
            g.fillStyle = withAlpha(env.mood.halo, 0.28);
            g.fillRect(x + 30 + j * 50, 470 - 60 * hash1(k, 24), 16, 22);
          }
        x += 120 + 60 * hash1(k, 21);
        k++;
      }
      tree(g, { x: 700, y: 640, h: 520, kind: 'oak', seed: 2011, detail: 0.8 }, { ...env, fill: (role) => (role === 'set' || role === 'ink' ? mixLab(env.mood.fg, env.mood.set, 0.25) : env.fill(role)) });

    });
  });
  // the street lamp on the near kerb: its own plane between the houses and the wall (so it is not lost in the far haze)
  f.layer(STREET, (c, env) => {
    const L = BR.streetLamp;
    c.fillStyle = env.fill('ink');
    c.fillRect(L.x - 4, L.y, 8, 700 - L.y);
    c.beginPath();
    c.moveTo(L.x - 2, L.y + 2);
    c.quadraticCurveTo(L.x, L.y - 30, L.x + 32, L.y - 22);
    c.lineTo(L.x + 32, L.y - 16);
    c.quadraticCurveTo(L.x + 6, L.y - 22, L.x + 4, L.y + 2);
    c.closePath();
    c.fill();
    c.fillRect(L.x + 20, L.y - 24, 26, 7);
  });
  if (lampCam) {
    // its sodium light, placed where the lamp head lands on screen (seed distinct from the room's lights)
    const p = toScreen(STREET, lampCam, BR.streetLamp.x + 33, BR.streetLamp.y - 14);
    const q = toLayer(LAYERS.L4, lampCam, p.x, p.y);
    f.practical({ x: q.x, y: q.y, kind: 'lamp', seed: 8211, intensity: 0.85, radius: 22 });
  }
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, cams, 60);
    bake(f, c, `${key}/br/L2/${env.mood.id}/${rk(r)}`, r, (g) => {
      const W = BR.window;
      const wall = mixLab(env.fill('set'), env.mood.fg, 0.32);
      const p = new Path2D();
      p.rect(r.x, r.y, r.w, r.h);
      p.rect(W.x, W.y, W.w, W.h);
      g.fillStyle = wall;
      g.fill(p, 'evenodd');
      // the desk lamp's warmth on the wall, low and right
      const pool = g.createRadialGradient(900, 470, 20, 900, 470, 760);
      pool.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.2), 0.75));
      pool.addColorStop(1, withAlpha(wall, 0));
      g.save();
      g.clip(p, 'evenodd');
      g.fillStyle = pool;
      g.fillRect(r.x, r.y, r.w, r.h);
      g.restore();
      // window frame, sash bars, sill; a blind pulled half-way
      g.fillStyle = env.fill('ink');
      g.fillRect(W.x - 14, W.y - 14, W.w + 28, 14);
      g.fillRect(W.x - 14, W.y, 14, W.h);
      g.fillRect(W.x + W.w, W.y, 14, W.h);
      g.fillRect(W.x - 24, W.y + W.h, W.w + 48, 16);
      g.fillRect(W.x, W.y + W.h * 0.48, W.w, 10);
      g.fillRect(W.x + W.w / 2 - 4, W.y, 8, W.h);
      g.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.1);
      g.fillRect(W.x, W.y, W.w, 64);
      for (let y = W.y + 6; y < W.y + 64; y += 7) {
        g.fillStyle = withAlpha(env.mood.rim, 0.1);
        g.fillRect(W.x, y, W.w, 0.8);
      }
      g.fillStyle = env.fill('ink');
      g.fillRect(W.x + W.w / 2 - 1, W.y + 64, 2, 40);
      // a shelf with a few books at right, a poster-less wall
      g.fillRect(1060, 230, 230, 8);
      for (let k = 0; k < 9; k++) g.fillRect(1074 + k * 17, 230 - 40 - 14 * hash1(k, 31), 12, 40 + 14 * hash1(k, 31));
    });
  });
}

/** L4: the desk, the monitor (screen as a lit rectangle with faint lines of code), the chair */
export function deskAndMonitor(c: C, env: PaintEnv, screenK: number) {
  const ink = env.fill('ink');
  const D = BR.desk;
  c.fillStyle = ink;
  c.fillRect(D.x0, D.top, D.x1 - D.x0, 12);
  c.fillRect(D.x0 + 10, D.top + 12, 12, BR.floor - D.top - 12);
  c.fillRect(D.x1 - 22, D.top + 12, 12, BR.floor - D.top - 12);
  c.fillRect(D.x1 - 120, D.top + 12, 98, 60);
  // the monitor: thin bezel, a stand
  const M = BR.monitor;
  c.fillRect(M.x - M.w / 2 - 6, M.y - M.h / 2 - 6, M.w + 12, M.h + 12);
  c.fillRect(M.x - 6, M.y + M.h / 2, 12, D.top - (M.y + M.h / 2));
  c.fillRect(M.x - 34, D.top - 5, 68, 5);
  const scr = mixLab(env.mood.halo, '#cfe6e0', 0.35);
  c.fillStyle = mixLab(env.mood.set, scr, 0.35 + 0.55 * screenK);
  c.fillRect(M.x - M.w / 2, M.y - M.h / 2, M.w, M.h);
  // terminal lines (no words): short dashes of type in rows
  c.fillStyle = withAlpha(env.mood.fg, 0.32 * screenK);
  for (let j = 0; j < 9; j++) {
    let x = M.x - M.w / 2 + 12 + (j % 3 === 0 ? 0 : 14);
    for (let k = 0; k < 6; k++) {
      const w = 8 + 26 * hash1(j * 7 + k, 41);
      if (x + w > M.x + M.w / 2 - 10) break;
      c.fillRect(x, M.y - M.h / 2 + 12 + j * 12.5, w, 4);
      x += w + 6;
    }
  }
}

/**
 * The office chair and the seated figure from behind. The figure sits a little right of the chair's spine and the
 * chair back stops at his shoulder blades (one value step lighter than him), so the head, neck and shoulders stand
 * clear against the lit monitor. The monitor-side rim is cut along his shoulder line and tousled hair; his near
 * (right) forearm reaches the keyboard at the desk's edge, and the hand taps keys on twos (two poses).
 */
export function seatedFromBehind(c: C, env: PaintEnv, ink: string, tq: number, rimCol: string) {
  const x = BR.chairX;
  const fx = x + 30; // the figure sits right of the chair spine
  const seat = BR.floor - 82;
  const chairInk = mixLab(env.fill('ink'), env.mood.set, 0.38);
  // keyboard on the desk's front edge, showing right of his body
  const D = BR.desk;
  c.fillStyle = env.fill('ink');
  c.fillRect(fx - 40, D.top - 5, 150, 5);
  c.fillStyle = withAlpha(rimCol, 0.35);
  c.fillRect(fx - 40, D.top - 5.5, 150, 1);
  // chair: star base, gas lift, seat, and a back that stops at his shoulder blades
  c.fillStyle = chairInk;
  c.fillRect(x - 70, BR.floor - 8, 140, 8);
  for (const s of [-1, 1]) {
    c.beginPath();
    c.arc(x + s * 66, BR.floor - 3, 5, 0, Math.PI * 2);
    c.fill();
  }
  c.fillRect(x - 4, BR.floor - 70, 8, 62);
  c.fillRect(x - 62, seat, 124, 14);
  const k = Math.floor(tq * 12) % 4;
  const bob = [0, 0.8, 0.2, 1.0][k];
  const sy = 456; // shoulder line
  // the figure: torso (a plain sweater), shoulders sloping, elbows out a little
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(fx - 50, seat + 4);
  c.lineTo(fx - 54, sy + 46);
  c.quadraticCurveTo(fx - 62, sy + 18, fx - 54, sy + 2);
  c.quadraticCurveTo(fx - 44, sy - 14, fx - 14, sy - 18);
  c.lineTo(fx + 14, sy - 18);
  c.quadraticCurveTo(fx + 44, sy - 14, fx + 54, sy + 2);
  c.quadraticCurveTo(fx + 62, sy + 18, fx + 56, sy + 46);
  c.lineTo(fx + 50, seat + 4);
  c.closePath();
  c.fill();
  // the near (right) arm: upper arm out to the elbow, forearm forward and up to the keyboard
  const tap = k % 2; // two-pose key tap on twos
  const elbow = { x: fx + 66, y: sy + 46 };
  const hand = { x: fx + 58 + (tap ? 6 : 0), y: D.top - 7 + (tap ? 1.6 : 0) };
  c.strokeStyle = ink;
  c.lineCap = 'round';
  c.lineWidth = 17;
  c.beginPath();
  c.moveTo(fx + 48, sy + 6);
  c.lineTo(elbow.x, elbow.y);
  c.stroke();
  c.lineWidth = 12;
  c.beginPath();
  c.moveTo(elbow.x, elbow.y);
  c.lineTo(hand.x, hand.y + 4);
  c.stroke();
  // the hand on the keys: a flat mitten, fingers down; on the tap the index finger dips
  c.beginPath();
  c.ellipse(hand.x + 4, hand.y + 1, 10, 5, -0.15, 0, Math.PI * 2);
  c.fill();
  c.fillRect(hand.x + (tap ? 9 : 6), hand.y + 2, 3, tap ? 7 : 4.5);
  // the far elbow just showing at left (his left hand is on the keyboard too, hidden by his body)
  c.beginPath();
  c.ellipse(fx - 58, sy + 44, 9, 12, 0.3, 0, Math.PI * 2);
  c.fill();
  // neck and head (from behind), tousled hair, ears just showing
  c.fillRect(fx - 10, sy - 40, 20, 26);
  const hy = sy - 62 + bob * 0.3;
  const hair = new Path2D();
  hair.ellipse(fx, hy, 23, 27, 0, 0, Math.PI * 2);
  // tufts along the crown: small irregular bumps
  // short, cropped hair: a slightly uneven crown (tufts barely break the head's outline)
  const tufts = [[-17, -16, 5], [-8, -23, 5.5], [3, -25, 5.5], [13, -21, 5], [19, -11, 4.5], [21, -2, 3.5], [-21, -5, 3.5]];
  for (const [dx, dy, r] of tufts) {
    hair.moveTo(fx + dx + r, hy + dy);
    hair.arc(fx + dx, hy + dy, r, 0, Math.PI * 2);
  }
  c.fill(hair);
  for (const s of [-1, 1]) {
    c.beginPath();
    c.ellipse(fx + s * 23, hy + 6, 4.5, 8, 0, 0, Math.PI * 2);
    c.fill();
  }
  // the monitor's light cuts a rim along the crown, the shoulder line and the near arm (the screen is ahead and
  // above him), so the head separates from the chair and the dark room
  c.save();
  c.strokeStyle = withAlpha(rimCol, 0.75);
  c.lineWidth = 1.5;
  c.lineCap = 'round';
  c.beginPath();
  for (const [dx, dy, r] of tufts.slice(0, 5)) {
    c.moveTo(fx + dx + r * Math.cos(Math.PI * 1.15), hy + dy + r * Math.sin(Math.PI * 1.15));
    c.arc(fx + dx, hy + dy, r, Math.PI * 1.15, Math.PI * 1.85);
  }
  c.moveTo(fx - 54, sy + 2);
  c.quadraticCurveTo(fx - 44, sy - 14, fx - 14, sy - 18);
  c.moveTo(fx + 14, sy - 18);
  c.quadraticCurveTo(fx + 44, sy - 14, fx + 54, sy + 2);
  c.moveTo(fx + 50, sy + 4);
  c.lineTo(elbow.x - 2, elbow.y - 6);
  c.stroke();
  c.restore();
  // the chair back's top edge catches a little of the screen too (cool, dim)
  c.strokeStyle = withAlpha(rimCol, 0.22);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x - 46, sy + 36);
  c.quadraticCurveTo(x - 30, sy + 26, x - 10, sy + 26);
  c.stroke();
}

/** the chair back (lower: to his shoulder blades), drawn BEHIND the figure */
export function chairBack(c: C, env: PaintEnv) {
  const x = BR.chairX;
  const sy = 456;
  const seat = BR.floor - 82;
  c.fillStyle = mixLab(env.fill('ink'), env.mood.set, 0.38);
  c.beginPath();
  c.moveTo(x - 50, seat + 2);
  c.lineTo(x - 52, sy + 40);
  c.quadraticCurveTo(x - 50, sy + 24, x - 20, sy + 24);
  c.lineTo(x + 20, sy + 24);
  c.quadraticCurveTo(x + 50, sy + 24, x + 52, sy + 40);
  c.lineTo(x + 50, seat + 2);
  c.closePath();
  c.fill();
}

/** spin phase (revolutions) of the fans: idling, then spinning up after `up` over 1.1 s */
export function fanPhase(t: number, up: number): number {
  const s0 = 0.25, s1 = 3.2, d = 1.1;
  if (t < up) return s0 * t;
  if (t < up + d) {
    const u = (t - up) / d;
    return s0 * up + (s0 + (s1 - s0) * u * 0.5) * (t - up);
  }
  return s0 * up + (s0 + s1) * 0.5 * d + s1 * (t - up - d);
}

/** the tower with the two cards drawn into its window (the GTX 580 reference design: one blower fan per card) */
export function towerWithCards(c: C, env: PaintEnv, phase: number, lit: number) {
  const T = BR.tower;
  desktopTower(c, { x: T.x, y: BR.floor, s: T.s, gpus: 0, lit: 0.3, window: true, seed: 5 }, env);
  const W = TOWER_WIN;
  const fenv: PaintEnv = { ...env, t: phase };
  for (let i = 0; i < 2; i++) {
    const y = W.y + W.h * (0.5 + i * 0.4);
    gpuCard(c, { x: W.x + W.w * 0.55, y, s: BR.tower.s * 0.95, fans: 1, spin: 1, lit: 0.5 * lit, bracket: true, seed: 7 + i }, fenv);
  }
}

/** the anglepoise's beam cone and the circle of light on the tower window (k = 0 when the lamp clicks off) */
export function lampPool(c: C, env: PaintEnv, from: { x: number; y: number }, k: number) {
  if (k <= 0) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const P = POOL;
  const g = c.createLinearGradient(from.x, from.y, P.x, P.y);
  g.addColorStop(0, withAlpha(env.mood.halo, 0.2 * k));
  g.addColorStop(1, withAlpha(env.mood.halo, 0.05 * k));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(from.x - 8, from.y);
  c.lineTo(P.x - P.r, P.y + 10);
  c.lineTo(P.x + P.r * 0.9, P.y - 10);
  c.lineTo(from.x + 8, from.y);
  c.closePath();
  c.fill();
  const r = c.createRadialGradient(P.x, P.y, 0, P.x, P.y, P.r);
  r.addColorStop(0, withAlpha(env.mood.core, 0.32 * k));
  r.addColorStop(0.75, withAlpha(env.mood.halo, 0.22 * k));
  r.addColorStop(0.92, withAlpha(env.mood.halo, 0.12 * k));
  r.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = r;
  c.beginPath();
  c.arc(P.x, P.y, P.r, 0, Math.PI * 2);
  c.fill();
  c.restore();
  glow(c, P.x, P.y, P.r * 1.6, env.mood.halo, 0.08 * k);
}
