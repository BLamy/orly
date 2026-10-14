/**
 * ch15-s01 — the shot's own cut of the Hall of Mirrors (forked from sets/ch05-s01-hall.ts, which stays untouched).
 * Same geometry (HALL5, bust5 are re-used from the ch05 set) with a deeper value ladder for the 2024 return:
 *   - the near audience and the chandeliers go to near-black (the frame's dark anchor, as in the reference);
 *   - the chandelier candles are LIT (the warm practical, the hall's only light source on the action side);
 *   - lighter fog and rays so the mirror glass stays the one luminous plane;
 *   - a crisp `hero` pass (L2 depth, blur 1 px, painted after fog A) for the mirrored figures the shot turns.
 *
 *   hall15(f, { key, cams, inMirror?, hero?, action?, rays?, candles? })
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, toLayer, type Rect } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';
import { dustMotes, godRays, type Beam } from '../../../film/silhouette/atmosphere';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { HALL5, bust5, archPath } from './ch05-s01-hall';
import { BUST_VARIANTS, audienceBust } from './ch15-s01-figures';

export { HALL5, bust5, archPath };

type C = CanvasRenderingContext2D;

const bake = (f: Frame, c: C, key: string, r: Rect, paint: (cc: C) => void) =>
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

/** one chandelier (local: the ceiling rod's attachment at 0,0; hangs downward ~260) */
function chandelier(c: C, env: PaintEnv, s: number) {
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
      c.lineWidth = 1.4 * s;
      c.beginPath();
      c.ellipse(ex * 0.62, (ty + drop * 1.05) * s + 8 * s, 2.6 * s, 4.2 * s, 0, 0, Math.PI * 2);
      c.stroke();
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

/** a Louis XVI medallion chair back (L4, the near row), centred on the sitter at x; by = the chair line */
function ornateChair(c: C, x: number, by: number, s: number) {
  c.save();
  c.lineCap = 'round';
  c.strokeStyle = c.fillStyle as string;
  // fluted uprights with turned finials
  for (const sx of [-1, 1]) {
    const ux = x + sx * 25 * s;
    c.fillRect(ux - 2.6 * s, by - 30 * s, 5.2 * s, 60 * s);
    c.beginPath();
    c.ellipse(ux, by - 33 * s, 4 * s, 3 * s, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(ux - 1.8 * s, by - 35 * s);
    c.quadraticCurveTo(ux, by - 46 * s, ux + 1.8 * s, by - 35 * s);
    c.fill();
  }
  // the oval medallion back (a ring: the sitter's back shows through it)
  c.lineWidth = 4.6 * s;
  c.beginPath();
  c.ellipse(x, by - 10 * s, 19 * s, 24 * s, 0, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = 1.4 * s;
  c.beginPath();
  c.ellipse(x, by - 10 * s, 14.5 * s, 19.5 * s, 0, 0, Math.PI * 2);
  c.stroke();
  // the ties from ring to uprights
  c.lineWidth = 3 * s;
  c.beginPath();
  c.moveTo(x - 25 * s, by - 12 * s);
  c.lineTo(x - 19 * s, by - 12 * s);
  c.moveTo(x + 19 * s, by - 12 * s);
  c.lineTo(x + 25 * s, by - 12 * s);
  c.stroke();
  // the ribbon-bow crest on top of the ring
  c.beginPath();
  c.ellipse(x - 6 * s, by - 36 * s, 6 * s, 3.4 * s, -0.3, 0, Math.PI * 2);
  c.ellipse(x + 6 * s, by - 36 * s, 6 * s, 3.4 * s, 0.3, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(x, by - 35 * s, 2.6 * s, 0, Math.PI * 2);
  c.fill();
  c.lineWidth = 1.6 * s;
  c.beginPath();
  c.moveTo(x - 2 * s, by - 34 * s);
  c.quadraticCurveTo(x - 7 * s, by - 28 * s, x - 9 * s, by - 24 * s);
  c.moveTo(x + 2 * s, by - 34 * s);
  c.quadraticCurveTo(x + 7 * s, by - 28 * s, x + 9 * s, by - 24 * s);
  c.stroke();
  c.restore();
}

export interface Hall15Opts {
  key: string;
  cams: Camera3[];
  /** draw inside mirror i (clipped to its arch, before the frame; L2 depth blur) */
  inMirror?: (c: C, env: PaintEnv, i: number) => void;
  /** the crisp mirrored figures: L2 depth, 1 px blur, painted after fog A (draw clipped to arches yourself) */
  hero?: (c: C, env: PaintEnv) => void;
  /** the shot's L4 action (lectern, speaker), drawn before the audience rows */
  action?: (c: C, env: PaintEnv) => void;
  /** rim direction */
  rimDir?: { x: number; y: number };
  /** god-ray strength multiplier */
  rays?: number;
  /** chandelier candle light 0..1 */
  candles?: number;
  /** 0..1 the near chandeliers' presence (fade them when a push-in would swell them across the frame) */
  near?: number;
}

/** the L2 plane drawn crisper (heroes in the glass): same depth as L2, less haze, 1 px blur */
export const L2_CRISP = { id: 'L2' as const, z: LAYERS.L2.z, haze: 0.06, blur: 1.0 };

/** chandelier hangers (L5 world): x, sway sign, scale */
export const CHANDELIERS: [number, number, number][] = [[150, 1, 1.25], [1150, -0.8, 1.15]];
const CANDLE_TIERS = [[170, 70, 3], [214, 112, 4]] as const;
/** the chandelier's sway at time t (radians, before the per-chandelier sign) */
export const chandSway = (t: number) => 0.018 * Math.sin(t * 0.75) + 0.008 * Math.sin(t * 1.9 + 1);
/** candle-tip points of chandelier j in L5 world */
export function chandCandles(j: number, t: number): { x: number; y: number }[] {
  const [cx, sgn, s] = CHANDELIERS[j];
  const a = chandSway(t) * sgn;
  const ca = Math.cos(a), sa = Math.sin(a);
  const out: { x: number; y: number }[] = [];
  for (const [ty, span, n] of CANDLE_TIERS) {
    for (let k = -n; k <= n; k++) {
      if (k === 0) continue;
      const lx = (k / n) * span * s, ly = (ty - 27) * s;
      out.push({ x: cx + lx * ca - ly * sa, y: -150 + lx * sa + ly * ca });
    }
  }
  return out;
}

export function hall15(f: Frame, o: Hall15Opts) {
  f.backlight({ sunX: 640, sunY: 380, sunRadius: 760, intensity: 1.15 });

  // ---------------------------------------------------------------- L2: the mirrored arcade
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 60);
    const m = env.mood;
    // glass + the reflected room (baked): DARK silvered glass (a mirror, not a window): the windows behind the
    // camera arrive only as soft reflected light low in each panel (behind the reflected heads), no mullions;
    // a reflected chandelier hangs high in the glass, and a soft diagonal sheen crosses every panel
    bake(f, c, `${o.key}/h15/glass/${m.id}/${rk(r)}`, r, (cc) => {
      const glass = new Path2D();
      for (let i = 0; i < HALL5.count; i++) {
        const a = HALL5.arch(i);
        archPath(glass, a.cx, a.w, a.spring, a.sill);
      }
      cc.save();
      cc.clip(glass);
      const base = mixLab(m.set, m.haze, 0.5);
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
    for (let i = 0; i < HALL5.count; i++) {
      const a = HALL5.arch(i);
      if (o.inMirror) {
        c.save();
        const p = new Path2D();
        archPath(p, a.cx, a.w, a.spring, a.sill);
        c.clip(p);
        o.inMirror(c, env, i);
        c.restore();
      }
    }
    // the arcade itself: wall with arched holes, panes, frames, pilasters, cornice, vault (baked)
    bake(f, c, `${o.key}/h15/frame/${m.id}/${rk(r)}`, r, (cc) => {
      const wallC = mixLab(env.fill('set'), m.fg, 0.52);
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
      wg.addColorStop(0.6, withAlpha(m.halo, 0.07));
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
        cc.strokeStyle = withAlpha(m.rim, 0.16);
        cc.lineWidth = 0.9;
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
        cc.fillStyle = mixLab(env.fill('set'), m.fg, 0.5);
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
      cc.fillStyle = mixLab(env.fill('set'), m.fg, 0.66);
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
      cc.fillStyle = mixLab(env.fill('set'), m.fg, 0.62);
      cc.fillRect(r.x, HALL5.sill + 4, r.w, r.y + r.h - HALL5.sill);
      cc.fillStyle = env.fill('ink');
      cc.fillRect(r.x, HALL5.sill, r.w, 8);
    });
  });
  f.fog({ yCenter: 0.6 * 720, height: 0.42 * 720, alpha: 0.11, drift: 5 });
  if (o.hero) f.layer(L2_CRISP, (c, env) => o.hero!(c, env));

  // ---------------------------------------------------------------- L3: floor, girandoles, rays
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, o.cams, 60);
    const m = env.mood;
    bake(f, c, `${o.key}/h15/L3/${m.id}/${rk(r)}`, r, (cc) => {
      // parquet: lit by the low sun (a warm sheen), with the de Versailles lattice as faint cut-lines
      const fg = cc.createLinearGradient(0, HALL5.floorY, 0, HALL5.floorY + 200);
      fg.addColorStop(0, mixLab(env.fill('set'), m.halo, 0.1));
      fg.addColorStop(0.35, mixLab(env.fill('set'), m.ink, 0.3));
      fg.addColorStop(1, mixLab(env.fill('set'), m.ink, 0.62));
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
    godRays(c, { beams, intensity: 0.24 * (o.rays ?? 1), streaks: 5, mullions: 3, softness: 22, salt: 51 }, env);
    dustMotes(c, { area: { x: -200, y: 60, w: 1800, h: 560 }, count: 110, beam: beams[2], drift: { x: 2.5, y: -1 }, size: 1.0, brightness: 0.8, salt: 9 }, env);
  });
  f.fog({ yCenter: 0.74 * 720, height: 0.2 * 720, alpha: 0.07, drift: 8 });

  // ---------------------------------------------------------------- L4: action + the real audience
  f.layer('L4', (c, env) => {
    o.action?.(c, env);
    const ink = PUPPET_NEAR_BLACK;
    // review round 5: the warm chandelier/window light catches each listener's upper-left edge (1 device px)
    const warmRim = mixLab(env.mood.halo, env.mood.core, 0.45);
    HALL5.rows.forEach((ry, row) => {
      for (let k = -9; k < 18; k++) {
        const id = row * 100 + k + 50;
        const x = k * 96 + (row % 2) * 48 + hash1(id, 3) * 22;
        // about ±6 % scale between neighbours (plus the row's perspective step), and ±8 % in build
        const s = (1.2 + row * 0.14) * (1 + 0.06 * hash1(id, 6));
        const by = ry + hash1(id, 4) * 6;
        // four head/hair variants (bald, parted, bun, grey wave) seen from behind, shuffled so no two neighbours in a
        // row repeat; a jacket collar with a lapel notch, or a raised shirt collar; a few lean to a neighbour
        const v = BUST_VARIANTS[(k + 9 + row * 2 + (hash1(id, 8) > 0.6 ? 2 : 0)) % 4];
        const lean = hash1(id, 21) > 0.55 ? 0.05 * Math.sign(hash1(id, 22)) : 0;
        c.save();
        c.translate(x, by);
        c.rotate(lean);
        audienceBust(c, 0, 0, s, v, ink, { collar: hash1(id, 31) > -0.35 ? 'notch' : 'points', rim: warmRim, rimAlpha: 0.7, build: 1 + 0.08 * hash1(id, 33) });
        c.restore();
        if (row === 0) {
          // the far row: plain gilt chair backs (two uprights, a top rail, finials)
          const cw = 25 * s;
          c.fillRect(x - cw - 2.5 * s, by - 34 * s, 5 * s, 60 * s);
          c.fillRect(x + cw - 2.5 * s, by - 34 * s, 5 * s, 60 * s);
          c.fillRect(x - cw, by - 26 * s, cw * 2, 4.5 * s);
          for (const sx of [-1, 1]) {
            c.beginPath();
            c.arc(x + sx * cw, by - 37 * s, 4.2 * s, 0, Math.PI * 2);
            c.fill();
          }
        } else if (hash1(id, 12) > -0.6) {
          // the near row: Louis XVI medallion chairs: an oval back ring on carved uprights, a ribbon-bow crest,
          // pierced so the sitter's back shows through
          ornateChair(c, x, by, s * 1.05);
        }
      }
    });
  });
  f.rim(o.rimDir ?? { x: 0.2, y: -1 });

  // ---------------------------------------------------------------- the chandelier candles (the warm practical)
  const near = o.near ?? 1;
  const cl = (o.candles ?? 1) * near;
  if (cl > 0.01) {
    for (let j = 0; j < CHANDELIERS.length; j++) {
      const pts = chandCandles(j, f.t);
      const lo = pts[pts.length - 1];
      // one soft room glow per chandelier (centred on the lower tier) + small halos on a few candles
      const cx = (pts[6].x + pts[13].x) / 2;
      f.practical({ x: cx, y: lo.y + 6, kind: 'lamp', seed: 171 + j, intensity: 0.5 * cl, radius: 110, layer: 'L5' });
    }
  }
  // ---------------------------------------------------------------- L5: chandeliers
  f.layer('L5', (c, env) => {
    const sw = chandSway(env.t);
    const blackEnv = { ...env, fill: () => PUPPET_NEAR_BLACK } as PaintEnv;
    for (const [cx, sgn, s] of CHANDELIERS) {
      if (near < 0.01) break;
      c.save();
      c.globalAlpha *= near;
      c.translate(cx, -150);
      c.rotate(sw * sgn);
      chandelier(c, blackEnv, s);
      c.restore();
    }
    if (cl > 0.01) {
      // the flames: small paper tongues on every candle, flickering on twos
      const m = env.mood;
      const tq = Math.floor(env.t * 12) / 12;
      for (let j = 0; j < CHANDELIERS.length; j++) {
        chandCandles(j, env.t).forEach((p, k) => {
          const fl = 1 + 0.12 * hash1(Math.floor(tq * 12) + k * 7 + j * 31, 5);
          const h = 9 * fl, w = 3.2;
          c.fillStyle = withAlpha(m.halo, 0.35 * cl);
          c.beginPath();
          c.ellipse(p.x, p.y - h * 0.45, w * 3, h * 1.3, 0, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = withAlpha(mixLab(m.core, '#fff4d8', 0.3), 0.95 * cl);
          c.beginPath();
          c.moveTo(p.x - w, p.y);
          c.quadraticCurveTo(p.x - w, p.y - h * 0.6, p.x, p.y - h);
          c.quadraticCurveTo(p.x + w, p.y - h * 0.6, p.x + w, p.y);
          c.closePath();
          c.fill();
        });
      }
    }
    // the near floor: a dark checkered band at the frame's foot (the reference's floor), so the bright glass
    // has black to sit against; held at the frame's bottom edge, sliding with L5's parallax in x
    const top = toLayer(LAYERS.L5, f.cam, 0, 690).y;
    const L = toLayer(LAYERS.L5, f.cam, -40, 0).x;
    const R = toLayer(LAYERS.L5, f.cam, 1320, 0).x;
    const bot = toLayer(LAYERS.L5, f.cam, 0, 760).y;
    const hh = bot - top;
    const m = env.mood;
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.fillRect(L, top, R - L, hh + 40);
    const tw = 96;
    c.fillStyle = mixLab(env.fill('ink'), m.set, 0.55);
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
