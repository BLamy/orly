/**
 * perceptron-short — ch01-s01 / ch01-s02: the Cornell lab at night, re-lit for silhouette value.
 *
 * Same geometry as sets/lab.ts (LAB constants: windows, wall, floor, fixtures), but lit like the
 * reference: bright glass against dark panelling, near-ink floor, blind-slat spill on the floor,
 * and a visibly drifting fog bank in front of the windows.
 *
 *   nightLab(f, { key, cams, light?, sunX?, hot?, tubesLit?, fog?, blinds? })
 *       backlight (hot horizon band behind the middle window) · L1 treeline + bright glass glow ·
 *       L2 wall/ceiling darkened (glass holes untouched) · floor darkened + slatted spill · fog A
 *       (drifting bank) · air() (e.g. labHaze: the haze plane) · L3 fixtures (tubes unlit until
 *       tubesLit > 0) · mid() · fog B
 *   nightDesk(f, { key, x, w?, top? }) -> { bulb }   near-black desk end (z 600, 3 px blur so the
 *       silhouette stays crisp): slab with a rim on its top edge, books, a jointed gooseneck lamp whose
 *       shade mouth (`bulb`, L5 world) takes the shot's dim practical
 *   nightVignette(f, k?)           screen-locked soft vignette (call before type)
 *   NIGHT_LOOK                     the shared night exposure (s01's end = s02's opening = s03's bookend)
 *   hungTube(c, env, { x, y, lit, len? })   L3 world: a fluorescent fixture hung low on two rods
 *   tubeLevel(t, { at?, seed })    0..1 a tube's light: a fluorescent strike (stutter) from `at`, then a
 *                                  faint seeded flicker (slow drift + rare one-frame dips), deterministic
 *
 * Static art is cached per (shot key, mood, overscan rect).
 */
import type { Camera3, Frame, LayerSpec } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, type Rect } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { ceilingGrid, checkerFloor, labWall } from '../../../film/silhouette/architecture';
import { forestBand } from '../../../film/silhouette/nature';
import { fogBank, hash1, vnoise } from '../../../film/silhouette/atmosphere';
import { LAB, LAB_FLOOR, nearBlack } from './lab';

type C = CanvasRenderingContext2D;
const bake = (f: Frame, c: C, key: string, r: Rect, paint: (cc: C) => void, blur?: number) =>
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  }, blur === undefined ? undefined : { blur })(c, r.x, r.y);
const rk = (r: Rect) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;

function centres(x0: number, x1: number, phase: number): number[] {
  const out: number[] = [];
  const k0 = Math.floor((x0 - 640 - phase) / LAB.pitch) - 1;
  const k1 = Math.ceil((x1 - 640 - phase) / LAB.pitch) + 1;
  for (let k = k0; k <= k1; k++) out.push(640 + phase + k * LAB.pitch);
  return out;
}

export interface NightLabOpts {
  key: string;
  cams: Camera3[];
  /** backlight fade-up 0..1 (default 1) */
  light?: number;
  /** backlight sun centre, screen stage px (default 640 = the middle window) */
  sunX?: number;
  /** hot horizon band behind the window at this L1 world x (default 640) */
  hot?: number;
  /** 0..1: fluorescent tubes lit (0 = dark glass tubes) */
  tubesLit?: number;
  /** fog multiplier (default 1) */
  fog?: number;
  blinds?: number;
  raise?: number;
  /** 0..1 concentrate the night glow on the window at `hot` (outer glass ~25% dimmer, hotter centre, brighter floor spill) */
  focus?: number;
  /** backlight radius (default 620) */
  sunRadius?: number;
  /** extra mid-plane (L3) painting, called before the last fog sheet */
  mid?: () => void;
  /** the air between the window wall and the machine (e.g. labHaze), painted after fog A, before L3 */
  air?: () => void;
  /** 0..1 multiplier on the far glass glow (L1): night-dark windows (default 1) */
  glass?: number;
  /** 0..1 extra darkening of the floor under the slat spill (baked; default 0) */
  floorDark?: number;
  /** 0..1 extra darkening of the wall, piers and ceiling (never the glass; baked; default 0) */
  wall?: number;
}

/**
 * The night exposure ch01-s01 ends on, ch01-s02 holds and ch01-s03's bookend returns to: one graded
 * backlight (a hot centre low behind the middle window, falling off toward the top of the glass), the
 * glass at 85%, the wall a little deeper than the kit lab. Sharing it makes the s01 → s02 crossfade a
 * true match-dissolve (no exposure step at the cut).
 */
export const NIGHT_LOOK = { light: 0.98, glass: 0.85, hot: 640, focus: 1, sunRadius: 470, blinds: 0.82, fog: 0.55, floorDark: 0.75, wall: 0.15 } as const;

export function nightLab(f: Frame, o: NightLabOpts) {
  const blinds = o.blinds ?? 0.8;
  const raise = o.raise ?? 0.36;
  const L = o.light ?? 1;
  const hot = o.hot ?? 640;
  const focus = o.focus ?? 0;
  f.backlight({ sunX: o.sunX ?? 640, sunY: 410, sunRadius: o.sunRadius ?? 620, intensity: 1.9 * L * (1 + 0.25 * focus) });
  const glass = o.glass ?? 1;
  if (glass < 1 || focus > 0) {
    // night-dark glass: pull the backlight down, graded: the top of the glass darkest, the hot band low
    // behind the sills least (the sky ramp shows through every window hole)
    const c = f.c;
    const d = 1 - glass;
    c.save();
    const g = c.createLinearGradient(0, 0, 0, 720);
    g.addColorStop(0, withAlpha(f.mood.fg, Math.min(1, d + 0.42 * focus)));
    g.addColorStop(0.28, withAlpha(f.mood.fg, Math.min(1, d + 0.2 * focus)));
    g.addColorStop(0.58, withAlpha(f.mood.fg, d * 0.55));
    g.addColorStop(1, withAlpha(f.mood.fg, d));
    c.fillStyle = g;
    c.fillRect(-40, -40, 1360, 800);
    c.restore();
  }

  // L1 — night glow outside: bright glass, a hot sodium horizon band behind the middle window
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, o.cams, 60);
    c.globalAlpha = Math.min(1, glass + 0.1);
    bake(f, c, `${o.key}/night/L1/${env.mood.id}/${rk(r)}/${hot}/${focus}`, r, (cc) => {
      const fo = 1 - 0.25 * focus;
      const gl = cc.createLinearGradient(0, LAB.winTop - 40, 0, LAB.winTop + LAB.winH + 20);
      gl.addColorStop(0, withAlpha(env.mood.halo, 0.25 * fo));
      gl.addColorStop(0.7, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.5), 0.8 * fo));
      gl.addColorStop(1, withAlpha(env.mood.halo, 0.6 * fo));
      cc.fillStyle = gl;
      cc.fillRect(r.x, LAB.winTop - 40, r.w, LAB.winH + 60);
      // the hot band: a wide flat ellipse of core light low behind the middle window
      cc.save();
      cc.translate(hot, 432);
      cc.scale(1, 0.2);
      const hb = cc.createRadialGradient(0, 0, 0, 0, 0, 420);
      hb.addColorStop(0, withAlpha(env.mood.core, 0.95));
      hb.addColorStop(0.35, withAlpha(env.mood.core, 0.55));
      hb.addColorStop(1, withAlpha(env.mood.core, 0));
      cc.fillStyle = hb;
      cc.fillRect(-420, -420, 840, 840);
      cc.restore();
      if (focus > 0) {
        // a tall soft bloom filling the whole hot window: the room's one destination
        cc.save();
        cc.translate(hot, LAB.winTop + LAB.winH * 0.55);
        cc.scale(0.62, 1);
        const fb = cc.createRadialGradient(0, 0, 0, 0, 0, 300);
        fb.addColorStop(0, withAlpha(env.mood.core, 0.7 * focus));
        fb.addColorStop(0.5, withAlpha(mixLab(env.mood.core, env.mood.halo, 0.5), 0.35 * focus));
        fb.addColorStop(1, withAlpha(env.mood.halo, 0));
        cc.fillStyle = fb;
        cc.fillRect(-300, -300, 600, 600);
        cc.restore();
      }
      forestBand(cc, { x0: r.x, x1: r.x + r.w, y: 452, h: 40, kind: 'mixed', density: 2.6, seed: 58, ground: 300 }, env);
    });
    c.globalAlpha = 1;
  });

  // L2 — ceiling + wall with blind windows; then the wall (not the glass) is pushed toward ink
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 48);
    const wins = centres(r.x, r.x + r.w, 0);
    const wall = o.wall ?? 0;
    bake(f, c, `${o.key}/night/L2/${env.mood.id}/${rk(r)}/${blinds}/${raise}/${wall}`, r, (cc) => {
      const yTop = Math.min(r.y, -40);
      ceilingGrid(cc, { x0: r.x, x1: r.x + r.w, yTop, yBack: LAB.wallTop, horizon: LAB.horizon, vpX: 640, tile: 110 }, env);
      labWall(cc, {
        x: r.x,
        y: LAB.wallTop,
        w: r.w,
        h: LAB.wallFoot - LAB.wallTop,
        windows: wins,
        winW: LAB.winW,
        winTop: LAB.winTop,
        winH: LAB.winH,
        blinds,
        tileTop: LAB.tileTop,
        tile: 15,
      }, env);
      const rh = LAB.winH * raise;
      const deep = mixLab(env.fill('set'), env.mood.fg, 0.55);
      cc.save();
      cc.globalCompositeOperation = 'destination-out';
      for (const x of wins) cc.fillRect(x - LAB.winW / 2, LAB.winTop, LAB.winW, rh);
      cc.restore();
      cc.fillStyle = env.fill('set');
      for (const x of wins) {
        const x0 = x - LAB.winW / 2;
        cc.fillRect(x0 + LAB.winW * 0.25 - 1.5, LAB.winTop, 3, rh);
        cc.fillRect(x0 + LAB.winW * 0.75 - 1.5, LAB.winTop, 3, rh);
        cc.fillRect(x0, LAB.winTop + rh * 0.5 - 1.5, LAB.winW, 3);
        cc.fillStyle = deep;
        cc.fillRect(x0 + 2, LAB.winTop + rh - 4, LAB.winW - 4, 16);
        cc.fillStyle = env.fill('set');
      }
      cc.fillStyle = deep;
      for (const x of wins) {
        const x0 = x - LAB.winW / 2;
        cc.fillRect(x0 - 10, LAB.winTop - 10, LAB.winW + 20, 10);
        cc.fillRect(x0 - 10, LAB.winTop, 10, LAB.winH);
        cc.fillRect(x0 + LAB.winW, LAB.winTop, 10, LAB.winH);
        cc.fillRect(x0 - 16, LAB.winTop + LAB.winH, LAB.winW + 32, 9);
        cc.fillRect(x - 3, LAB.winTop, 6, LAB.winH);
        cc.fillRect(x0, LAB.winTop + LAB.winH * 0.5 - 3, LAB.winW, 6);
      }
      cc.fillRect(r.x, LAB.wallFoot - 12, r.w, 12);
      // value pass: darken everything already painted (wall, piers, ceiling, slats), never the glass
      cc.save();
      cc.globalCompositeOperation = 'source-atop';
      const dv = cc.createLinearGradient(0, yTop, 0, LAB.wallFoot);
      const dk = (a: number) => withAlpha(env.mood.fg, Math.min(0.97, a + (1 - a) * wall));
      dv.addColorStop(0, dk(0.8)); // ceiling: near ink
      dv.addColorStop((LAB.wallTop - yTop) / (LAB.wallFoot - yTop), dk(0.62));
      dv.addColorStop((LAB.winTop + LAB.winH - yTop) / (LAB.wallFoot - yTop), dk(0.5));
      dv.addColorStop(1, dk(0.7)); // below the sills: dark dado
      cc.fillStyle = dv;
      cc.fillRect(r.x, yTop, r.w, LAB.wallFoot - yTop + 4);
      cc.restore();
      // sill rims catch the glass light
      cc.fillStyle = withAlpha(env.mood.rim, 0.22);
      for (const x of wins) cc.fillRect(x - LAB.winW / 2 - 16, LAB.winTop + LAB.winH, LAB.winW + 32, 1.4);
    });
  });

  // floor — darkened linoleum (near ink), with the blinds' slatted spill lying across it
  f.layer(LAB_FLOOR, (c, env) => {
    const r = overscan(LAB_FLOOR, o.cams, 60);
    const y0 = LAB.wallFoot - 2;
    const fr: Rect = { x: r.x, y: y0, w: r.w, h: Math.max(160, r.y + r.h - y0) };
    const wins = centres(fr.x, fr.x + fr.w, 0);
    const fd = o.floorDark ?? 0;
    bake(f, c, `${o.key}/night/floor/${env.mood.id}/${rk(fr)}/${fd}`, fr, (cc) => {
      checkerFloor(cc, { x0: fr.x, x1: fr.x + fr.w, yBack: y0, yFront: fr.y + fr.h, horizon: LAB.horizon, vpX: 640, tile: 64, contrast: 0.18 }, env);
      cc.save();
      cc.globalCompositeOperation = 'source-atop';
      const dv = cc.createLinearGradient(0, y0, 0, y0 + 160);
      dv.addColorStop(0, withAlpha(env.mood.fg, 0.55 + 0.35 * fd));
      dv.addColorStop(1, withAlpha(env.mood.fg, 0.86 + 0.12 * fd));
      cc.fillStyle = dv;
      cc.fillRect(fr.x, y0, fr.w, fr.h);
      cc.restore();
    });
    // slatted spill: each window throws a striped trapezoid toward the camera (moon/sodium night)
    bake(f, c, `${o.key}/night/slats/${env.mood.id}/${rk(fr)}/${hot}/${focus}`, fr, (cc) => {
      cc.globalCompositeOperation = 'lighter';
      const col = mixLab(env.mood.halo, env.mood.rim, 0.4);
      const yb = y0 + 4;
      const yf = fr.y + fr.h;
      const N = 9;
      for (const wx of wins) {
        for (let i = 0; i < N; i++) {
          const u0 = Math.pow(i / N, 1.5);
          const u1 = Math.pow((i + 0.5) / N, 1.5);
          const ya = yb + (yf - yb) * u0;
          const yc = yb + (yf - yb) * u1;
          const half = (u: number) => LAB.winW * (0.42 + 0.55 * u);
          const sk = (u: number) => -110 * u; // light falls slightly leftward toward the camera
          const hk = Math.abs(wx - hot) < LAB.pitch / 2 ? 1 + 1.6 * focus : 1 - 0.25 * focus;
          const a = 0.2 * hk * (1 - 0.65 * (i / N));
          cc.fillStyle = withAlpha(col, a);
          cc.beginPath();
          cc.moveTo(wx + sk(u0) - half(u0), ya);
          cc.lineTo(wx + sk(u0) + half(u0), ya);
          cc.lineTo(wx + sk(u1) + half(u1), yc);
          cc.lineTo(wx + sk(u1) - half(u1), yc);
          cc.closePath();
          cc.fill();
        }
      }
    }, 3);
  });

  // fog A: a sheet and a slowly drifting bank in front of the windows
  const fog = o.fog ?? 1;
  f.fog({ yCenter: 470, height: 260, alpha: 0.2 * fog, drift: 14 });

  o.air?.();

  // L3 — hanging fluorescent fixtures; tubes dark until struck
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, o.cams, 40);
    const tubes = centres(r.x, r.x + r.w, LAB.pitch / 2);
    fogBank(c, { y: 500, height: 150, speed: 12, density: 0.3 * fog, x0: r.x - 40, x1: r.x + r.w + 40, color: env.mood.haze, salt: 7 }, env);
    bake(f, c, `${o.key}/night/L3/${env.mood.id}/${rk(r)}`, r, (cc) => {
      cc.fillStyle = env.fill('ink');
      const Lt = LAB.tubeLen;
      for (const x of tubes) {
        cc.fillRect(x - Lt * 0.36 - 0.8, r.y, 1.6, LAB.tubeY - r.y);
        cc.fillRect(x + Lt * 0.36 - 0.8, r.y, 1.6, LAB.tubeY - r.y);
        cc.fillRect(x - Lt / 2, LAB.tubeY, Lt, 7);
        cc.beginPath();
        cc.moveTo(x - Lt / 2 - 6, LAB.tubeY + 7);
        cc.lineTo(x + Lt / 2 + 6, LAB.tubeY + 7);
        cc.lineTo(x + Lt / 2 - 2, LAB.tubeY + 13);
        cc.lineTo(x - Lt / 2 + 2, LAB.tubeY + 13);
        cc.closePath();
        cc.fill();
      }
    });
    const lit = Math.max(0, Math.min(1, o.tubesLit ?? 1));
    c.fillStyle = mixLab(mixLab(env.fill('set'), env.mood.fg, 0.3), env.mood.core, lit);
    for (const x of tubes) c.fillRect(x - LAB.tubeLen / 2 + 5, LAB.tubeY + 13, LAB.tubeLen - 10, 3.4);
  });

  o.mid?.();
  f.fog({ yCenter: 720 * 0.72, height: 720 * 0.22, alpha: 0.1 * fog, drift: 9 });
}

/** the near desk plane: L5's depth, but only lightly blurred so the lamp reads as a cut-out, not a smudge */
/** the desk's near plane: a little closer than L5 (faster parallax) and softer, filled near-black (review round 2) */
const NEAR_DESK: LayerSpec = { id: 'nearDesk', z: 600, haze: 0, blur: 3.0 };

/**
 * Near desk end (L5 world): slab and apron, two books, a jointed gooseneck lamp standing at the
 * desk's left end (weighted base, two arm segments with knuckles, a conical shade angled down at the
 * books). `lamp` = { x: base x, h: height of the shade knuckle above the top }. Returns the shade mouth
 * in L5 world so the shot can hang a dim lamp practical there (the one warm accent).
 */
export interface DeskOpts {
  key: string;
  x: number;
  w?: number;
  top?: number;
  lamp?: { x: number; h: number };
}
/** the desk lamp's geometry (L5 world): base, knuckles, shade axis and the bulb inside the mouth */
export function deskLamp(o: DeskOpts) {
  const top = o.top ?? 640;
  const lx = o.lamp?.x ?? o.x + 60;
  const lh = o.lamp?.h ?? 110;
  const ang = 0.9; // shade axis, rad below horizontal: down and right, at the books
  const ax = Math.cos(ang);
  const ay = Math.sin(ang);
  const head = { x: lx - lh * 0.5, y: top - lh };
  const L = lh * 0.42;
  return {
    top, lx, lh, ax, ay, head, L,
    knee: { x: lx - lh * 0.12, y: top - lh * 0.74 },
    R: lh * 0.22,
    bulb: { x: head.x + ax * (L - 4), y: head.y + ay * (L - 4) },
  };
}

export function nightDesk(f: Frame, o: DeskOpts) {
  const w = o.w ?? 560;
  const { top, lx, lh, ax, ay, head, L, knee, R, bulb } = deskLamp(o);
  const nx = -ay;
  const ny = ax;
  f.layer(NEAR_DESK, (c, env) => {
    const r: Rect = { x: Math.min(o.x, head.x - L) - 30, y: head.y - 40, w: w + L + 90, h: top - head.y + 400 };
    bake(f, c, `${o.key}/night/desk4/${env.mood.id}/${o.x}/${w}/${top}/${lx}/${lh}`, r, (cc) => {
      const ink = nearBlack(env.fill('fg'));
      cc.fillStyle = ink;
      cc.fillRect(o.x, top, w, 12);
      cc.fillRect(o.x + 8, top + 12, w - 16, 300);
      // books: a flat stack and one leaning on it
      const bx = o.x + w * 0.42;
      cc.fillRect(bx, top - 13, 108, 13);
      cc.fillRect(bx + 8, top - 24, 92, 11);
      cc.save();
      cc.translate(bx + 122, top);
      cc.rotate(-0.24);
      cc.fillRect(0, -72, 18, 72);
      cc.restore();
      // lamp: weighted base, two arm segments with round knuckles, a spring line
      cc.beginPath();
      cc.ellipse(lx, top - 4, lh * 0.2, lh * 0.06, 0, Math.PI, 0);
      cc.lineTo(lx + lh * 0.2, top);
      cc.lineTo(lx - lh * 0.2, top);
      cc.closePath();
      cc.fill();
      cc.fillRect(lx - 4, top - lh * 0.14, 8, lh * 0.12);
      cc.strokeStyle = ink;
      cc.lineCap = 'round';
      cc.lineJoin = 'round';
      cc.lineWidth = 4.5;
      cc.beginPath();
      cc.moveTo(lx, top - lh * 0.12);
      cc.lineTo(knee.x, knee.y);
      cc.lineTo(head.x, head.y);
      cc.stroke();
      cc.lineWidth = 1.5;
      cc.beginPath();
      cc.moveTo(lx + 5, top - lh * 0.2);
      cc.lineTo(knee.x + 6, knee.y + lh * 0.08);
      cc.stroke();
      cc.beginPath();
      cc.arc(knee.x, knee.y, 5.5, 0, Math.PI * 2);
      cc.moveTo(head.x + 5, head.y);
      cc.arc(head.x, head.y, 5, 0, Math.PI * 2);
      cc.fill();
      // conical shade: narrow at the knuckle, flaring to a rolled lip at the mouth
      const p = (u: number, v: number) => [head.x + ax * u + nx * v, head.y + ay * u + ny * v] as const;
      cc.beginPath();
      cc.moveTo(...p(-4, -6));
      cc.lineTo(...p(L * 0.3, -R * 0.36));
      cc.quadraticCurveTo(...p(L * 0.72, -R * 0.55), ...p(L, -R));
      cc.lineTo(...p(L + 3, -R - 1.5));
      cc.lineTo(...p(L + 3, R + 1.5));
      cc.lineTo(...p(L, R));
      cc.quadraticCurveTo(...p(L * 0.72, R * 0.55), ...p(L * 0.3, R * 0.36));
      cc.lineTo(...p(-4, 6));
      cc.closePath();
      cc.fill();
      // rims: the slab edge, the book tops, the arm and the shade's back catch the window light
      cc.fillStyle = withAlpha(env.mood.rim, 0.3);
      cc.fillRect(o.x, top - 1, w, 2);
      cc.fillRect(bx + 8, top - 25, 92, 1.5);
      cc.strokeStyle = withAlpha(env.mood.rim, 0.32);
      cc.lineWidth = 1.3;
      cc.beginPath();
      cc.moveTo(lx + 2, top - lh * 0.14);
      cc.lineTo(knee.x + 2, knee.y);
      cc.lineTo(head.x + 1, head.y - 3);
      cc.stroke();
      cc.beginPath();
      cc.moveTo(...p(L * 0.3, -R * 0.36 - 0.8));
      cc.quadraticCurveTo(...p(L * 0.72, -R * 0.55 - 0.8), ...p(L, -R - 0.8));
      cc.stroke();
    });
  });
  return { bulb };
}

/** soft screen-locked vignette (ink), strength k (default 1) */
export function nightVignette(f: Frame, k = 1) {
  const c = f.c;
  c.save();
  const g = c.createRadialGradient(640, 380, 260, 640, 380, 820);
  g.addColorStop(0, withAlpha(f.mood.fg, 0));
  g.addColorStop(0.6, withAlpha(f.mood.fg, 0.28 * k));
  g.addColorStop(1, withAlpha(f.mood.fg, 0.7 * k));
  c.fillStyle = g;
  c.fillRect(-20, -20, 1320, 760);
  c.restore();
}

/** a fluorescent fixture hung low on two rods (L3 world): housing, reflector lip and the tube strip; `lit` 0..1 */
export function hungTube(c: CanvasRenderingContext2D, env: { fill: (r: 'ink' | 'set') => string; mood: { core: string; rim: string } }, o: { x: number; y: number; lit: number; len?: number }) {
  const L = o.len ?? LAB.tubeLen;
  const ink = env.fill('ink');
  c.save();
  c.fillStyle = ink;
  c.fillRect(o.x - L * 0.36 - 1, o.y - 900, 2, 900);
  c.fillRect(o.x + L * 0.36 - 1, o.y - 900, 2, 900);
  c.fillRect(o.x - L / 2, o.y - 7, L, 8);
  c.beginPath();
  c.moveTo(o.x - L / 2 - 6, o.y + 1);
  c.lineTo(o.x + L / 2 + 6, o.y + 1);
  c.lineTo(o.x + L / 2 - 2, o.y + 7);
  c.lineTo(o.x - L / 2 + 2, o.y + 7);
  c.closePath();
  c.fill();
  // the reflector's top edge catches the window
  c.fillStyle = withAlpha(env.mood.rim, 0.3);
  c.fillRect(o.x - L / 2, o.y - 7.5, L, 1);
  c.fillStyle = mixLab(mixLab(env.fill('set'), ink, 0.4), env.mood.core, Math.max(0, Math.min(1, o.lit)));
  c.fillRect(o.x - L / 2 + 5, o.y + 7, L - 10, 3.4);
  c.restore();
}

/** a tube's light 0..1: off before `at`; a fluorescent strike (three stutters over ≈0.8 s, on the frame);
 * then a faint seeded flicker (slow drift, rare one-frame dips). Pure in t. */
export function tubeLevel(t: number, o: { at?: number; seed: number }) {
  const at = o.at ?? -1e9;
  if (t < at) return 0;
  const fr = Math.floor(t * 24);
  const u = t - at;
  if (u < 0.8) {
    // stutter: brief flashes whose odds and strength grow through the strike
    const on = hash1(fr, o.seed + 3) < 0.25 + 0.7 * (u / 0.8);
    return on ? 0.45 + 0.45 * (u / 0.8) : 0.04;
  }
  const drift = 0.88 + 0.12 * vnoise(t * 0.5, o.seed + 13);
  const dip = hash1(fr, o.seed + 7) > 0.965 ? 0.7 : 1;
  return Math.min(1, drift * dip * Math.min(1, 0.9 + (u - 0.8) * 0.5));
}
