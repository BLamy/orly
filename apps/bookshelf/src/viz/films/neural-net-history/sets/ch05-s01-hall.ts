/**
 * ch05-s01 — THE HALL OF MIRRORS, Versailles, summer 1981 (this shot's own cut of the hall; the shared
 * sets/hallOfMirrors.ts stays untouched for ch15-s01). dawnGold, late afternoon.
 *
 * Paper theatre, seen square-on: the low sun pours through the tall windows BEHIND the camera, so the
 * mirrored arcade opposite is the backlight. Every arched mirror is a bright hole in the wall that repeats
 * the room: a reflected window (the brightest value), a hazed reflected chandelier, and the reflected
 * audience. The real audience sits between us and the easel (backs to us), so a reflected head that was
 * LOOKING at the easel would face us (a frontal oval); every one of them is a profile: turned away, toward
 * the windows, the chandeliers, each other. Nobody, in any mirror, is looking at the easel.
 *
 *   L2   the arcade: vault + cornice + frieze, pilasters with capitals, arched mirrors of small panes
 *        (glass + reflections baked; the reflected crowd baked per mirror so it can fade mirror by mirror)
 *   L3   the parquet floor in the low sun, girandoles (tall candelabra stands) before the pilasters,
 *        god rays slanting in from the windows behind us, dust in the beams
 *   L4   the shot's own action (easel, speaker) + two rows of the real audience, backs to us
 *   L5   two chandeliers as black filigree, swinging very slightly
 *
 *   hall5(f, { key, cams, crowd(i) → 0..1, reflection?, action })
 *   HALL5            geometry; HALL5.arch(i) → { cx, w, spring, sill, top }
 *   bust5(...)       a seated bust (profile / back of head), for reflections and the audience
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, toLayer, type Rect } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';
import { dustMotes, godRays, type Beam } from '../../../film/silhouette/atmosphere';

type C = CanvasRenderingContext2D;

export const HALL5 = {
  /** mirror arches (L2 world) */
  x0: -480,
  pitch: 232,
  count: 14,
  archW: 172,
  spring: 252,
  sill: 578,
  cornice: 128,
  /** the parquet's top edge (L3 world) */
  floorY: 590,
  /** audience rows (L4 world): the y of each row's chair line */
  rows: [640, 694],
  arch(i: number) {
    const cx = this.x0 + i * this.pitch;
    return { cx, w: this.archW, spring: this.spring, sill: this.sill, top: this.spring - this.archW / 2 };
  },
};

const bake = (f: Frame, c: C, key: string, r: Rect, paint: (cc: C) => void) =>
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

/** the old glass's slight warp: draw in horizontal bands, each nudged sideways by a ~2.5 px sine */
export function warped(c: C, r: Rect, i: number, draw: (c: C) => void, bands = 22, amp = 2.6, overlap = 0.35) {
  const h = r.h / bands;
  for (let k = 0; k < bands; k++) {
    const y0 = r.y + k * h;
    const dx = amp * Math.sin((y0 + h / 2) * 0.052 + i * 1.7);
    c.save();
    c.beginPath();
    c.rect(r.x - 12, y0 - overlap, r.w + 24, h + overlap * 2);
    c.clip();
    c.translate(dx, 0);
    draw(c);
    c.restore();
  }
}

export function archPath(p: Path2D, cx: number, w: number, spring: number, sill: number) {
  p.moveTo(cx - w / 2, sill);
  p.lineTo(cx - w / 2, spring);
  p.arc(cx, spring, w / 2, Math.PI, 0);
  p.lineTo(cx + w / 2, sill);
  p.closePath();
}

/**
 * A seated bust. facing: +1 / -1 a profile looking right / left; 0 = the back of the head (to us);
 * 2 = frontal (a face toward us: attentive). tilt: radians, + = chin up (looking up at a chandelier).
 */
export function bust5(c: C, x: number, y: number, s: number, facing: number, ink: string, tilt = 0, hair = 0) {
  c.fillStyle = ink;
  c.beginPath();
  // shoulders and upper arms: a soft trapezoid with a collar notch
  c.moveTo(x - 24 * s, y);
  c.quadraticCurveTo(x - 24 * s, y - 32 * s, x - 11 * s, y - 39 * s);
  c.lineTo(x - 4 * s, y - 41 * s);
  c.lineTo(x + 4 * s, y - 41 * s);
  c.lineTo(x + 11 * s, y - 39 * s);
  c.quadraticCurveTo(x + 24 * s, y - 32 * s, x + 24 * s, y);
  c.closePath();
  c.fill();
  c.fillRect(x - 4.5 * s, y - 51 * s, 9 * s, 13 * s);
  c.save();
  c.translate(x, y - 52 * s);
  c.rotate(-tilt * (facing === 0 || facing === 2 ? 0 : facing));
  c.beginPath();
  if (facing === 0 || facing === 2) {
    c.ellipse(0, -9 * s, 10.5 * s, 12.5 * s, 0, 0, Math.PI * 2);
    if (hair > 0.5) c.ellipse(0, -16 * s, 12 * s, 8 * s, 0, 0, Math.PI * 2);
  } else {
    // a clear profile: crown, forehead, brow, a nose that stands out, the notch under it, lips, chin notch,
    // chin, jaw back to the nape (reads at 18-24 px)
    const F = facing;
    const p = (dx: number, dy: number) => [F * dx * s, dy * s] as const;
    c.moveTo(...p(-6, 4));
    c.lineTo(...p(-9.5, -3));
    c.quadraticCurveTo(...p(-13.5, -15), ...p(-5, -22.5));
    c.quadraticCurveTo(...p(5, -25), ...p(9, -16));
    c.lineTo(...p(9.5, -13.5));
    c.lineTo(...p(8.6, -12.2));
    c.lineTo(...p(15.5, -6.2));
    c.lineTo(...p(10.2, -5.2));
    c.lineTo(...p(11, -3.6));
    c.lineTo(...p(9.6, -2.6));
    c.lineTo(...p(10.6, -1.4));
    c.lineTo(...p(8.6, 0.4));
    c.quadraticCurveTo(...p(11, 2.2), ...p(9, 4.2));
    c.quadraticCurveTo(...p(5, 5.4), ...p(3, 6.5));
    c.lineTo(...p(2.5, 10));
    c.lineTo(...p(-6, 10));
    c.closePath();
    if (hair > 0.5) {
      // a fuller head of hair / a chignon at the back (variety in the crowd)
      c.moveTo(...p(-8, -12));
      c.ellipse(F * -10.5 * s, -11 * s, 6 * s, 7 * s, 0, 0, Math.PI * 2);
    }
  }
  c.fill();
  c.restore();
}

/** one chandelier (local: the ceiling rod's attachment at 0,0; hangs downward ~260) */
function chandelier(c: C, env: PaintEnv, s: number, drops = true) {
  const ink = env.fill('fg');
  c.fillStyle = ink;
  c.strokeStyle = ink;
  c.lineCap = 'round';
  // rod and crown
  c.fillRect(-2.2 * s, 0, 4.4 * s, 110 * s);
  c.beginPath();
  c.ellipse(0, 112 * s, 16 * s, 7 * s, 0, 0, Math.PI * 2);
  c.fill();
  // the baluster stem: stacked bulbs
  for (const [yy, rx, ry] of [[132, 9, 14], [160, 13, 10], [186, 8, 12], [212, 18, 9]] as const) {
    c.beginPath();
    c.ellipse(0, yy * s, rx * s, ry * s, 0, 0, Math.PI * 2);
    c.fill();
  }
  // two tiers of S-curved arms, candle cups and unlit candles
  for (const [ty, span, n, drop] of [[170, 70, 3, 26], [214, 112, 4, 30]] as const) {
    c.lineWidth = 3.2 * s;
    for (let j = -n; j <= n; j++) {
      if (j === 0) continue;
      const ex = (j / n) * span * s;
      c.beginPath();
      c.moveTo(0, ty * s);
      c.bezierCurveTo(ex * 0.3, (ty + drop) * s, ex * 0.8, (ty + drop * 1.2) * s, ex, (ty - 4) * s);
      c.stroke();
      // cup, candle
      c.beginPath();
      c.ellipse(ex, (ty - 5) * s, 6 * s, 2.4 * s, 0, 0, Math.PI * 2);
      c.fill();
      c.fillRect(ex - 2 * s, (ty - 24) * s, 4 * s, 19 * s);
      // a crystal drop under each arm (pierced: a ring)
      if (drops) {
        c.lineWidth = 1.4 * s;
        c.beginPath();
        c.ellipse(ex * 0.62, (ty + drop * 1.05) * s + 8 * s, 2.6 * s, 4.2 * s, 0, 0, Math.PI * 2);
        c.stroke();
      }
      c.lineWidth = 3.2 * s;
    }
  }
  // swags of crystal chains between the lower cups
  c.lineWidth = 1.3 * s;
  for (let j = -4; j < 4; j++) {
    const a = (j / 4) * 112 * s, b = ((j + 1) / 4) * 112 * s;
    c.beginPath();
    c.moveTo(a, 206 * s);
    c.quadraticCurveTo((a + b) / 2, 238 * s, b, 206 * s);
    c.stroke();
  }
  // finial drop
  c.beginPath();
  c.moveTo(-6 * s, 222 * s);
  c.quadraticCurveTo(0, 268 * s, 6 * s, 222 * s);
  c.fill();
}

/** a girandole: a tall gilded candelabrum on a carved guéridon stand (unlit by day) */
function girandole(c: C, x: number, y: number, s: number, ink: string) {
  c.fillStyle = ink;
  c.strokeStyle = ink;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  // the guéridon: three scrolled feet, a fluted baluster, a round top
  c.lineWidth = 6 * s;
  for (const dx of [-1, 1]) {
    c.beginPath();
    c.moveTo(x, y - 40 * s);
    c.bezierCurveTo(x + dx * 8 * s, y - 14 * s, x + dx * 26 * s, y - 16 * s, x + dx * 30 * s, y - 4 * s);
    c.stroke();
    c.beginPath();
    c.arc(x + dx * 30 * s, y - 6 * s, 5 * s, 0, Math.PI * 2);
    c.fill();
  }
  c.beginPath();
  c.moveTo(x - 7 * s, y - 40 * s);
  c.bezierCurveTo(x - 16 * s, y - 70 * s, x - 6 * s, y - 100 * s, x - 5 * s, y - 120 * s);
  c.lineTo(x + 5 * s, y - 120 * s);
  c.bezierCurveTo(x + 6 * s, y - 100 * s, x + 16 * s, y - 70 * s, x + 7 * s, y - 40 * s);
  c.closePath();
  c.fill();
  c.fillRect(x - 20 * s, y - 128 * s, 40 * s, 8 * s);
  // the candelabrum: a central stem, two tiers of curving arms, candles in a pyramid
  c.fillRect(x - 3 * s, y - 190 * s, 6 * s, 64 * s);
  c.beginPath();
  c.ellipse(x, y - 150 * s, 8 * s, 6 * s, 0, 0, Math.PI * 2);
  c.fill();
  c.lineWidth = 3 * s;
  for (const [ty, span] of [[150, 34], [176, 20]] as const) {
    for (const dx of [-1, 1]) {
      const ex = x + dx * span * s;
      c.beginPath();
      c.moveTo(x, y - (ty - 6) * s);
      c.bezierCurveTo(x + dx * span * 0.4 * s, y - (ty - 26) * s, ex, y - (ty - 20) * s, ex, y - (ty + 6) * s);
      c.stroke();
      c.beginPath();
      c.ellipse(ex, y - (ty + 6) * s, 5 * s, 2 * s, 0, 0, Math.PI * 2);
      c.fill();
      c.fillRect(ex - 1.8 * s, y - (ty + 22) * s, 3.6 * s, 16 * s);
    }
  }
  c.fillRect(x - 1.8 * s, y - 214 * s, 3.6 * s, 24 * s);
}

export interface Hall5Opts {
  key: string;
  cams: Camera3[];
  /** 0..1 how much of mirror i's reflected crowd is still there */
  crowd: (i: number) => number;
  /** draw inside mirror i (clipped to its arch, after its crowd, before the frame) */
  inMirror?: (c: C, env: PaintEnv, i: number) => void;
  /** the shot's L4 action (easel, speaker), drawn before the audience rows */
  action?: (c: C, env: PaintEnv) => void;
  /** after the audience on L4 (light wrap, chalk glows) */
  actionTop?: (c: C, env: PaintEnv) => void;
  /** rim direction */
  rimDir?: { x: number; y: number };
  /** god-ray strength multiplier */
  rays?: number;
  /** reflected heads turn their noses AWAY from this L2-world x (the easel); default: seeded mixed profiles */
  awayFromX?: number;
  /** fog sheet A alpha (default 0.17) */
  fogA?: number;
  /** L5 chandeliers: [world x, s, hang y] (default two, high at the frame corners) */
  chandeliers?: [number, number, number][];
  /** darker piers/wall (value structure: the arches read as light holes) */
  darkWall?: boolean;
}

/** the audience in the mirrors, ch05-s01 cut: two rows of LARGE clear profiles (heads ~45-55 px), every nose
 *  pointing away from the easel (x < awayX → facing left, else right), barely hazed so they read sharp on the glass */
function reflectedCrowdAway(c: C, env: PaintEnv, i: number, awayX: number) {
  const a = HALL5.arch(i);
  const F = a.cx < awayX ? -1 : 1;
  for (let row = 1; row >= 0; row--) {
    const n = row === 1 ? 3 : 2;
    const s = row === 1 ? 1.32 : 1.6;
    const y = a.sill + 6 - row * 62;
    const ink = mixLab(env.mood.ink, env.mood.haze, row === 1 ? 0.2 : 0.06);
    for (let k = 0; k < n; k++) {
      const id = i * 97 + row * 13 + k;
      const x = a.cx + (row === 1 ? [-56, -2, 52][k] : [-36, 38][k]) * (k === 0 && F > 0 ? 1.05 : 1) + hash1(id, 5) * 5;
      // a few lift their chins to the chandeliers; most simply look off toward the windows, away from the easel
      const tilt = hash1(id, 33) > 0.45 ? 0.22 : 0.02;
      bust5(c, x, y + hash1(id, 7) * 3, s * (1 + hash1(id, 11) * 0.04), F, ink, tilt, hash1(id, 41) > 0.35 ? 1 : 0);
    }
  }
}

/** the audience in the mirrors: seeded profiles, never frontal (nobody is looking at the easel) */
function reflectedCrowd(c: C, env: PaintEnv, i: number) {
  const a = HALL5.arch(i);
  for (let row = 2; row >= 0; row--) {
    const n = row === 2 ? 4 : 3;
    const s = 1.22 - row * 0.17;
    const y = a.sill + 8 - row * 40;
    const ink = mixLab(env.mood.ink, env.mood.haze, row * 0.1);
    for (let k = 0; k < n; k++) {
      const id = i * 97 + row * 13 + k;
      const x = a.cx - a.w / 2 + 18 + ((k + 0.5) * (a.w - 36)) / n + hash1(id, 5) * 5 + (row % 2) * 8;
      // turned away: toward the windows (both sides), each other (pairs), or up at the chandeliers
      const h = hash1(id, 9);
      let facing = h > 0 ? 1 : -1;
      if (k % 2 === 1 && hash1(id, 21) > 0.2) facing = -1;
      if (k % 2 === 0 && hash1(id + 1, 21) > 0.2) facing = 1;
      // a good share lift their chins to the chandeliers
      const tilt = hash1(id, 33) > 0.25 ? 0.42 + 0.12 * hash1(id, 35) : hash1(id, 34) > 0.5 ? -0.1 : 0.05;
      bust5(c, x, y + hash1(id, 7) * 2, s * (1 + hash1(id, 11) * 0.05), facing, ink, tilt, hash1(id, 41) > 0.45 ? 1 : 0);
    }
  }
}

export function hall5(f: Frame, o: Hall5Opts) {
  f.backlight({ sunX: 640, sunY: 380, sunRadius: 760, intensity: 1.15 });

  // ---------------------------------------------------------------- L2: the mirrored arcade
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 60);
    const m = env.mood;
    // glass + the reflected room (baked): DARK silvered glass (a mirror, not a window): the windows behind the
    // camera arrive only as soft reflected light low in each panel (behind the reflected heads), no mullions;
    // a reflected chandelier hangs high in the glass, and a soft diagonal sheen crosses every panel
    bake(f, c, `${o.key}/h5/glass2/${m.id}/${rk(r)}`, r, (cc) => {
      const glass = new Path2D();
      for (let i = 0; i < HALL5.count; i++) {
        const a = HALL5.arch(i);
        archPath(glass, a.cx, a.w, a.spring, a.sill);
      }
      cc.save();
      cc.clip(glass);
      const base = o.darkWall ? mixLab(m.haze, m.sky[3], 0.3) : mixLab(m.set, m.haze, 0.5);
      const g = cc.createLinearGradient(0, 160, 0, HALL5.sill);
      g.addColorStop(0, mixLab(base, m.ink, 0.28));
      g.addColorStop(0.55, base);
      g.addColorStop(1, mixLab(base, m.ink, 0.12));
      cc.fillStyle = g;
      cc.fillRect(r.x, 100, r.w, HALL5.sill);
      for (let i = 0; i < HALL5.count; i++) {
        const a = HALL5.arch(i);
        // the reflected light of the windows behind us: a soft warm bloom low in the glass, behind the heads
        const lx = a.cx + 10 * Math.sin(i * 1.9);
        const ly = a.sill - 70;
        cc.save();
        cc.translate(lx, ly);
        cc.scale(1, 1.9);
        const lg = cc.createRadialGradient(0, 0, 4, 0, 0, a.w * 0.42);
        lg.addColorStop(0, withAlpha(mixLab(m.sky[3], m.rim, 0.45), 0.78));
        lg.addColorStop(0.55, withAlpha(mixLab(m.sky[3], m.halo, 0.4), 0.36));
        lg.addColorStop(1, withAlpha(m.sky[3], 0));
        cc.fillStyle = lg;
        cc.fillRect(-a.w, -a.w, a.w * 2, a.w * 2);
        cc.restore();
        // aged silvering: a few soft darker clouds
        for (let k = 0; k < 5; k++) {
          const px = a.cx + hash1(i * 17 + k, 3) * a.w * 0.45;
          const py = a.spring + (0.2 + 0.5 * hash1(i * 17 + k, 4)) * (a.sill - a.spring);
          const rr = 18 + 22 * (0.5 + 0.5 * hash1(i * 17 + k, 5));
          const sg = cc.createRadialGradient(px, py, 0, px, py, rr);
          sg.addColorStop(0, withAlpha(m.ink, 0.16));
          sg.addColorStop(1, withAlpha(m.ink, 0));
          cc.fillStyle = sg;
          cc.fillRect(px - rr, py - rr, rr * 2, rr * 2);
        }
        cc.save();
        const ap = new Path2D();
        archPath(ap, a.cx, a.w, a.spring, a.sill);
        cc.clip(ap);
        // the sheen: one broad soft diagonal and a thin bright one beside it
        const sh = cc.createLinearGradient(a.cx - a.w / 2, a.top, a.cx + a.w / 2, a.top + a.w * 1.1);
        sh.addColorStop(0.18, withAlpha(m.rim, 0));
        sh.addColorStop(0.32, withAlpha(m.rim, 0.13));
        sh.addColorStop(0.4, withAlpha(m.rim, 0.03));
        sh.addColorStop(0.46, withAlpha(m.core, 0.16));
        sh.addColorStop(0.5, withAlpha(m.rim, 0));
        cc.fillStyle = sh;
        cc.fillRect(a.cx - a.w / 2, a.top, a.w, a.sill - a.top);
        // the edges of the glass fall darker (the frame's shadow on the silvering)
        const eg = cc.createLinearGradient(a.cx - a.w / 2, 0, a.cx + a.w / 2, 0);
        eg.addColorStop(0, withAlpha(m.ink, 0.38));
        eg.addColorStop(0.14, withAlpha(m.ink, 0));
        eg.addColorStop(0.86, withAlpha(m.ink, 0));
        eg.addColorStop(1, withAlpha(m.ink, 0.38));
        cc.fillStyle = eg;
        cc.fillRect(a.cx - a.w / 2, a.top, a.w, a.sill - a.top);
        cc.restore();
        // the reflected chandelier, small and hazed, high in the glass
        cc.save();
        cc.translate(a.cx - 36 + 72 * (i % 2), a.top - 4);
        cc.scale(0.22, 0.22);
        chandelier(cc, { ...env, fill: () => withAlpha(mixLab(m.ink, m.haze, 0.35), 0.85) } as PaintEnv, 1);
        cc.restore();
      }
      cc.restore();
    });
    // the reflected crowd, mirror by mirror (cached each; faded by the shot)
    for (let i = 0; i < HALL5.count; i++) {
      const a = HALL5.arch(i);
      const k = o.crowd(i);
      const rr = { x: a.cx - a.w / 2 - 4, y: a.top - 4, w: a.w + 8, h: a.sill - a.top + 8 };
      if (k > 0.003) {
        c.save();
        c.globalAlpha *= k;
        bake(f, c, `${o.key}/h5/crowd4-${i}/${o.awayFromX ?? 'mix'}/${m.id}`, rr, (cc) => {
          const p = new Path2D();
          archPath(p, a.cx, a.w, a.spring, a.sill);
          cc.clip(p);
          if (o.awayFromX !== undefined) warped(cc, rr, i, (c2) => reflectedCrowdAway(c2, env, i, o.awayFromX!), 14, 4.2, 0.5);
          else warped(cc, rr, i, (c2) => reflectedCrowd(c2, env, i));
        });
        c.restore();
      }
      if (o.inMirror) {
        c.save();
        const p = new Path2D();
        archPath(p, a.cx, a.w, a.spring, a.sill);
        c.clip(p);
        o.inMirror(c, env, i);
        c.restore();
      }
    }
    // the glass's own surface: a broad faint diagonal sheen and a thin bright streak laid OVER the reflections
    // (they are behind the glass), so each panel reads as a mirror and not as an opening
    if (o.darkWall)
      bake(f, c, `${o.key}/h5/sheen1/${m.id}/${rk(r)}`, r, (cc) => {
        for (let i = 0; i < HALL5.count; i++) {
          const a = HALL5.arch(i);
          cc.save();
          const ap = new Path2D();
          archPath(ap, a.cx, a.w, a.spring, a.sill);
          cc.clip(ap);
          const off = 0.06 * Math.sin(i * 2.3);
          const sh = cc.createLinearGradient(a.cx - a.w / 2, a.top, a.cx + a.w / 2, a.top + a.w * 1.25);
          sh.addColorStop(0.12 + off, withAlpha(m.rim, 0));
          sh.addColorStop(0.24 + off, withAlpha(m.rim, 0.12));
          sh.addColorStop(0.34 + off, withAlpha(m.rim, 0.02));
          sh.addColorStop(0.4 + off, withAlpha(m.core, 0.2));
          sh.addColorStop(0.43 + off, withAlpha(m.rim, 0));
          sh.addColorStop(0.62 + off, withAlpha(m.rim, 0));
          sh.addColorStop(0.68 + off, withAlpha(m.rim, 0.07));
          sh.addColorStop(0.76 + off, withAlpha(m.rim, 0));
          cc.fillStyle = sh;
          cc.fillRect(a.cx - a.w / 2, a.top, a.w, a.sill - a.top);
          cc.restore();
        }
      });
    // the arcade itself: wall with arched holes, panes, frames, pilasters, cornice, vault (baked)
    bake(f, c, `${o.key}/h5/frame3/${o.darkWall ? 'd' : 'n'}/${m.id}/${rk(r)}`, r, (cc) => {
      const wallC = o.darkWall ? mixLab(env.fill('set'), m.ink, 0.12) : mixLab(env.fill('set'), m.fg, 0.34);
      const wall = new Path2D();
      wall.rect(r.x, r.y, r.w, r.h);
      for (let i = 0; i < HALL5.count; i++) {
        const a = HALL5.arch(i);
        archPath(wall, a.cx, a.w, a.spring, a.sill);
      }
      cc.fillStyle = wallC;
      cc.fill(wall, 'evenodd');
      // the low sun warms the wall from below the cornice to the floor (a soft band)
      const wg = cc.createLinearGradient(0, HALL5.cornice, 0, HALL5.sill + 60);
      wg.addColorStop(0, withAlpha(m.halo, 0));
      wg.addColorStop(0.6, withAlpha(m.halo, o.darkWall ? 0.03 : 0.07));
      wg.addColorStop(1, withAlpha(m.halo, 0.02));
      cc.save();
      cc.clip(wall, 'evenodd');
      cc.fillStyle = wg;
      cc.fillRect(r.x, HALL5.cornice, r.w, HALL5.sill);
      cc.restore();
      for (let i = 0; i < HALL5.count; i++) {
        const a = HALL5.arch(i);
        // the gilt bevelled frame: a broad dark-gold moulding, a lit bevel on its top/left (the low sun),
        // a thin inner bevel line on the glass (no panes: the glass reads as one silvered sheet)
        const fr = new Path2D();
        archPath(fr, a.cx, a.w + 10, a.spring, a.sill + 3);
        cc.strokeStyle = mixLab(m.halo, m.set, 0.62);
        cc.lineWidth = 7;
        cc.stroke(fr);
        cc.strokeStyle = withAlpha(m.rim, 0.42);
        cc.lineWidth = 1.4;
        const fo = new Path2D();
        archPath(fo, a.cx, a.w + 16, a.spring, a.sill + 5);
        cc.stroke(fo);
        cc.strokeStyle = withAlpha(m.ink, 0.6);
        cc.lineWidth = 1.2;
        const fi = new Path2D();
        archPath(fi, a.cx, a.w + 3, a.spring, a.sill + 1);
        cc.stroke(fi);
        cc.strokeStyle = withAlpha(m.rim, o.darkWall ? 0.5 : 0.16);
        cc.lineWidth = o.darkWall ? 1.3 : 0.9;
        const fb = new Path2D();
        archPath(fb, a.cx, a.w - 9, a.spring, a.sill - 4);
        cc.stroke(fb);
        cc.fillStyle = env.fill('ink');
        cc.beginPath();
        cc.moveTo(a.cx - 13, a.top - 4);
        cc.lineTo(a.cx + 13, a.top - 4);
        cc.lineTo(a.cx + 8, a.top + 18);
        cc.lineTo(a.cx - 8, a.top + 18);
        cc.closePath();
        cc.fill();
        cc.beginPath();
        cc.arc(a.cx, a.top - 10, 9, 0, Math.PI * 2);
        cc.fill();
        // the pilaster between this mirror and the next
        const px = a.cx + HALL5.pitch / 2;
        cc.fillStyle = o.darkWall ? mixLab(env.fill('set'), m.ink, 0.22) : mixLab(env.fill('set'), m.fg, 0.32);
        cc.fillRect(px - 24, HALL5.cornice + 30, 48, HALL5.sill - HALL5.cornice - 30);
        cc.strokeStyle = withAlpha(m.rim, 0.16);
        cc.lineWidth = 1.3;
        cc.strokeRect(px - 16, HALL5.cornice + 62, 32, HALL5.sill - HALL5.cornice - 92);
        // capital: a flared block with two volutes
        cc.fillStyle = env.fill('ink');
        cc.beginPath();
        cc.moveTo(px - 24, HALL5.cornice + 60);
        cc.lineTo(px - 32, HALL5.cornice + 30);
        cc.lineTo(px + 32, HALL5.cornice + 30);
        cc.lineTo(px + 24, HALL5.cornice + 60);
        cc.closePath();
        cc.fill();
        for (const dx of [-1, 1]) {
          cc.beginPath();
          cc.arc(px + dx * 26, HALL5.cornice + 38, 7, 0, Math.PI * 2);
          cc.fill();
        }
        cc.fillRect(px - 28, HALL5.sill - 18, 56, 18);
        // a trophy medallion high on the pilaster (a pierced ring: the backlight cannot reach it, so a rim)
        cc.strokeStyle = withAlpha(m.rim, 0.22);
        cc.lineWidth = 1.6;
        cc.beginPath();
        cc.ellipse(px, HALL5.cornice + 100, 11, 14, 0, 0, Math.PI * 2);
        cc.stroke();
      }
      // cornice, frieze with modillions, the vault above (dark, with coffer cut-lines)
      cc.fillStyle = env.fill('ink');
      cc.fillRect(r.x, HALL5.cornice, r.w, 14);
      cc.fillRect(r.x, HALL5.cornice + 22, r.w, 6);
      for (let x = Math.floor(r.x / 24) * 24; x < r.x + r.w; x += 24) cc.fillRect(x, HALL5.cornice + 14, 10, 8);
      cc.fillStyle = withAlpha(m.rim, 0.22);
      cc.fillRect(r.x, HALL5.cornice + 13, r.w, 1.2);
      cc.fillStyle = mixLab(env.fill('set'), m.fg, o.darkWall ? 0.7 : 0.45);
      cc.fillRect(r.x, r.y, r.w, HALL5.cornice - r.y);
      cc.strokeStyle = withAlpha(m.rim, 0.1);
      cc.lineWidth = 1.4;
      for (let i = 0; i < HALL5.count; i++) {
        const a = HALL5.arch(i);
        cc.strokeRect(a.cx - 70, HALL5.cornice - 92, 140, 70);
        cc.beginPath();
        cc.ellipse(a.cx, HALL5.cornice - 57, 40, 22, 0, 0, Math.PI * 2);
        cc.stroke();
      }
      // the dado below the mirrors
      cc.fillStyle = mixLab(env.fill('set'), m.fg, 0.4);
      cc.fillRect(r.x, HALL5.sill + 4, r.w, r.y + r.h - HALL5.sill);
      cc.fillStyle = env.fill('ink');
      cc.fillRect(r.x, HALL5.sill, r.w, 8);
    });
  });
  f.fog({ yCenter: 0.6 * 720, height: 0.42 * 720, alpha: o.fogA ?? 0.17, drift: 5 });

  // ---------------------------------------------------------------- L3: floor, girandoles, rays
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, o.cams, 60);
    const m = env.mood;
    bake(f, c, `${o.key}/h5/L3c/${o.darkWall ? 'd' : 'n'}/${m.id}/${rk(r)}`, r, (cc) => {
      // parquet: lit by the low sun (a warm sheen), with the de Versailles lattice as faint cut-lines
      const fg = cc.createLinearGradient(0, HALL5.floorY, 0, HALL5.floorY + 200);
      fg.addColorStop(0, mixLab(env.fill('set'), o.darkWall ? m.ink : m.halo, o.darkWall ? 0.15 : 0.1));
      fg.addColorStop(0.35, mixLab(env.fill('set'), m.ink, o.darkWall ? 0.6 : 0.3));
      fg.addColorStop(1, mixLab(env.fill('set'), m.ink, o.darkWall ? 0.85 : 0.62));
      cc.fillStyle = fg;
      cc.fillRect(r.x, HALL5.floorY, r.w, r.y + r.h - HALL5.floorY);
      cc.strokeStyle = withAlpha(m.fg, 0.28);
      cc.lineWidth = 1;
      for (let i = -40; i < 60; i++) {
        const x = i * 70;
        cc.beginPath();
        cc.moveTo(x, HALL5.floorY);
        cc.lineTo(x + 140, HALL5.floorY + 220);
        cc.moveTo(x, HALL5.floorY);
        cc.lineTo(x - 140, HALL5.floorY + 220);
        cc.stroke();
      }
      cc.fillStyle = withAlpha(m.rim, 0.2);
      cc.fillRect(r.x, HALL5.floorY, r.w, 1.4);
      // girandoles before every other pilaster (unlit by day)
      const gInk = env.fill('ink');
      for (let i = -2; i < HALL5.count; i += 2) {
        const a = HALL5.arch(i);
        const px = (a.cx + HALL5.pitch / 2) * 0.78 + 140;
        girandole(cc, px, HALL5.floorY + 10, 1.15, gInk);
      }
    });
    // god rays from the windows behind us: long shafts slanting down from the upper left
    const beams: Beam[] = [-260, 160, 600, 1040, 1480].map((x0, i) => ({ x0, y0: -40, w0: 120 + 30 * (i % 2), x1: x0 + 460, y1: 760, w1: 220 + 40 * (i % 3) }));
    godRays(c, { beams, intensity: 0.32 * (o.rays ?? 1), streaks: 5, mullions: 3, softness: 22, salt: 51 }, env);
    dustMotes(c, { area: { x: -200, y: 60, w: 1800, h: 560 }, count: 110, beam: beams[2], drift: { x: 2.5, y: -1 }, size: 1.0, brightness: 0.8, salt: 9 }, env);
  });
  f.fog({ yCenter: 0.74 * 720, height: 0.2 * 720, alpha: 0.1, drift: 8 });

  // ---------------------------------------------------------------- L4: action + the real audience
  f.layer('L4', (c, env) => {
    o.action?.(c, env);
    const ink = env.fill('ink');
    HALL5.rows.forEach((ry, row) => {
      for (let k = -9; k < 18; k++) {
        const id = row * 100 + k + 50;
        const x = k * 96 + (row % 2) * 48 + hash1(id, 3) * 22;
        const s = 1.2 + row * 0.14 + hash1(id, 6) * 0.1;
        const by = ry + hash1(id, 4) * 6;
        bust5(c, x, by, s, 0, ink, 0, hash1(id, 8) > 0.2 ? 1 : 0);
        // the gilt chair's back between us and them: two uprights and a top rail, finials standing proud
        if (hash1(id, 12) > -0.35) {
          const cw = 25 * s;
          c.fillRect(x - cw - 2.5 * s, by - 34 * s, 5 * s, 60 * s);
          c.fillRect(x + cw - 2.5 * s, by - 34 * s, 5 * s, 60 * s);
          c.fillRect(x - cw, by - 26 * s, cw * 2, 4.5 * s);
          for (const sx of [-1, 1]) {
            c.beginPath();
            c.arc(x + sx * cw, by - 37 * s, 4.2 * s, 0, Math.PI * 2);
            c.fill();
            c.beginPath();
            c.moveTo(x + sx * cw - 1.6 * s, by - 40 * s);
            c.lineTo(x + sx * cw, by - 47 * s);
            c.lineTo(x + sx * cw + 1.6 * s, by - 40 * s);
            c.fill();
          }
        }
      }
    });
    o.actionTop?.(c, env);
  });
  f.rim(o.rimDir ?? { x: 0.2, y: -1 });

  // ---------------------------------------------------------------- L5: chandeliers
  f.layer('L5', (c, env) => {
    const sw = 0.018 * Math.sin(env.t * 0.75) + 0.008 * Math.sin(env.t * 1.9 + 1);
    const chs: [number, number, number][] = o.chandeliers ?? [[150, 1.25, -150], [1150, 1.15, -150]];
    chs.forEach(([cx, s, hy], k) => {
      c.save();
      c.translate(cx, hy);
      c.rotate(sw * (k % 2 ? -0.8 : 1));
      chandelier(c, env, s, !o.darkWall);
      c.restore();
    });
    // the near floor: a dark checkered band at the frame's foot (the reference's floor), so the bright glass
    // has black to sit against; held at the frame's bottom edge, sliding with L5's parallax in x
    const top = toLayer(LAYERS.L5, f.cam, 0, o.darkWall ? 678 : 690).y;
    const L = toLayer(LAYERS.L5, f.cam, -40, 0).x;
    const R = toLayer(LAYERS.L5, f.cam, 1320, 0).x;
    const bot = toLayer(LAYERS.L5, f.cam, 0, 760).y;
    const hh = bot - top;
    const m = env.mood;
    c.fillStyle = env.fill('ink');
    c.fillRect(L, top, R - L, hh + 40);
    const tw = 96;
    c.fillStyle = mixLab(env.fill('ink'), m.set, o.darkWall ? 0.3 : 0.55);
    for (let k = Math.floor(L / tw) - 1; k * tw < R + tw; k++) {
      for (let row = 0; row < 2; row++) {
        if ((k + row) % 2 !== 0) continue;
        const y0 = top + row * hh * 0.42;
        const y1 = top + (row + 1) * hh * 0.42;
        const sk = (row + 0.5) * 18;
        c.beginPath();
        c.moveTo(k * tw - sk * 0.5, y0);
        c.lineTo((k + 1) * tw - sk * 0.5, y0);
        c.lineTo((k + 1) * tw - sk, y1);
        c.lineTo(k * tw - sk, y1);
        c.closePath();
        c.fill();
      }
    }
    c.fillStyle = withAlpha(m.rim, 0.18);
    c.fillRect(L, top, R - L, 1.2);
  });
}
