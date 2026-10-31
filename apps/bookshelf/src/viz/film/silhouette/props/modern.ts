/**
 * Modern hardware (generic, no marks). Real size at s = 1 — small parts are tiny next to a
 * puppet, so hero shots scale them up (s = 4–12). y = the surface the part rests on.
 *
 *   gpuCard({ x, y, fans?: 1|2|3, spin?: rev/s (0.7), lit?: 0..1, bracket?: true, seed? })
 *       fan side up, PCIe fingers at y. anchors: fan0, fan1, fan2, led, bracket       (27 × 12 cm)
 *   desktopTower({ x, y, gpus?: 0|1|2, lit?: 0..1, window?: true, seed? })
 *       side view, window on the side panel. anchors: gpu0, gpu1, power, window      (48 × 47 cm)
 *   laptop({ x, y, open?: 0..1, on?: true, view?: 'front'|'side', seed? })
 *       anchors: screen, screenTL, screenBR, keys                                     (34 cm wide)
 *   serverRack({ x, y, activity?: 0..1, seed?, warm?: 0..1 (fraction of amber LEDs), door?: 0..1 })
 *       42U front view; LEDs blink by env.t. anchors: top, centre, led (brightest row) (60 × 200 cm)
 *   chip({ x, y, kind?: 'package'|'wafer'|'die', lit?: 0..1, progress?: 0..1, seed? })
 *       top views: an accelerator package with HBM stacks, a wafer with a die grid (dies light up
 *       by progress), a die drawn as a city plan. y = centre for chips. anchors: centre, die
 *   smartphone({ x, y, on?: true, view?: 'front'|'side', seed? })    y = bottom edge. anchors: screen
 */
import type { PaintEnv } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import {
  type PropAt,
  blink,
  circle,
  cut,
  defineProp,
  ellipse,
  hash,
  inkLift,
  lamp,
  memo,
  poly,
  rect,
  rrect,
} from './_kit';

// ---------------------------------------------------------------------------
// GPU card
// ---------------------------------------------------------------------------
export interface GpuOpts extends PropAt {
  fans?: 1 | 2 | 3;
  spin?: number;
  lit?: number;
  bracket?: boolean;
  seed?: number;
}

const GPU = { L: 27, H: 11.4, fanR: 4.75 };
const fanR = (n: number) => (n >= 3 ? 3.55 : GPU.fanR);

function fanCentres(n: number): number[] {
  const span = GPU.L - 4.6;
  if (n === 1) return [GPU.L / 2 - 7.5];
  return Array.from({ length: n }, (_, i) => -GPU.L / 2 + 2.6 + (span * (i + 0.5)) / n + 0.4);
}

function gpuBody(n: number, bracket: boolean) {
  return memo(`gpu:${n}:${bracket}`, () => {
    const L = GPU.L;
    const H = GPU.H;
    const p = new Path2D();
    // PCB + PCIe fingers with the key notch
    rect(p, -L / 2, -H + 0.6, L, H - 0.6);
    rect(p, -L / 2 + 5.2, 0, 3.0, 0.75);
    rect(p, -L / 2 + 8.6, 0, 7.0, 0.75);
    // shroud with angular facets, slightly proud of the PCB outline
    const sh = new Path2D();
    sh.moveTo(-L / 2 + 0.6, -H + 0.2);
    sh.lineTo(L / 2 - 2.4, -H + 0.2);
    sh.lineTo(L / 2 + 0.2, -H + 2.6);
    sh.lineTo(L / 2 + 0.2, -1.4);
    sh.lineTo(L / 2 - 1.0, -0.6);
    sh.lineTo(-L / 2 + 0.6, -0.6);
    sh.closePath();
    p.addPath(sh);
    // power connectors on the top edge (two 8-pin blocks)
    rrect(p, L / 2 - 8.6, -H - 0.9, 2.4, 1.2, 0.2);
    rrect(p, L / 2 - 5.8, -H - 0.9, 2.4, 1.2, 0.2);
    // bridge fingers top-left
    rect(p, -L / 2 + 4, -H - 0.35, 3.2, 0.5);
    const fans = fanCentres(n);
    const holes = new Path2D();
    const rims = new Path2D();
    const R = fanR(n);
    for (const fx of fans) {
      circle(holes, fx, -H / 2, R);
      circle(rims, fx, -H / 2, R + 0.35);
    }
    const cl = new Path2D();
    // facet lines on the shroud
    cl.moveTo(-L / 2 + 1.2, -H + 1.2);
    cl.lineTo(fans[0] - R - 0.8, -H + 1.2);
    cl.moveTo(-L / 2 + 1.2, -1.6);
    cl.lineTo(fans[0] - R - 0.8, -1.6);
    cl.moveTo(fans[fans.length - 1] + R + 0.8, -H + 1.2);
    cl.lineTo(L / 2 - 2.6, -H + 1.2);
    cl.lineTo(L / 2 - 0.8, -H + 3);
    cl.moveTo(fans[fans.length - 1] + R + 0.8, -1.6);
    cl.lineTo(L / 2 - 1.2, -1.6);
    for (let i = 0; i < fans.length - 1; i++) {
      const mx = (fans[i] + fans[i + 1]) / 2;
      cl.moveTo(mx - 1.4, -H + 0.9);
      cl.lineTo(mx, -H + 1.7);
      cl.lineTo(mx + 1.4, -H + 0.9);
      cl.moveTo(mx - 1.4, -0.9);
      cl.lineTo(mx, -1.7);
      cl.lineTo(mx + 1.4, -0.9);
    }
    // heat-pipe U-bends peeking out of the top edge, and the backplate lip
    const pipes = new Path2D();
    for (let k = 0; k < 3; k++) {
      const x = 5.6 + k * 0.62;
      const top = -H - 1.0 - k * 0.32;
      const w = 2.6 - k * 0.6;
      pipes.moveTo(x, -H + 0.3);
      pipes.lineTo(x, top + 0.5);
      pipes.quadraticCurveTo(x, top, x + 0.5, top);
      pipes.lineTo(x + w - 0.5, top);
      pipes.quadraticCurveTo(x + w, top, x + w, top + 0.5);
      pipes.lineTo(x + w, -H + 0.3);
    }
    rect(p, -L / 2 + 0.4, -H - 0.15, L - 3, 0.4);
    // the bracket: tall plate with a bent tab, vent slots and port holes (pierced)
    const br = new Path2D();
    if (bracket) {
      const bx = -L / 2 - 1.1;
      rect(br, bx, -H - 1.6, 0.9, H + 3.8);
      rect(br, bx - 1.6, -H - 1.6, 2.5, 0.6);
      poly(br, [bx, 2.2, bx + 0.9, 2.2, bx + 0.6, 3.6, bx + 0.3, 3.6]);
      // vent slots and port openings punched through the plate
      for (let k = 0; k < 7; k++) rrect(br, bx + 0.22, -H + 0.2 + k * 0.75, 0.46, 0.5, 0.2);
      for (const [y, h] of [[-5.6, 1.5], [-3.6, 1.1], [-2.0, 1.1]]) rrect(br, bx + 0.18, y, 0.54, h, 0.15);
    }
    // fins visible through the fan apertures
    const fins = new Path2D();
    for (let x = -L / 2 + 1; x < L / 2; x += 0.55) {
      fins.moveTo(x, -H + 1);
      fins.lineTo(x, -1);
    }
    return { p, holes, rims, cl, br, fins, fans, pipes };
  });
}

function fanBlades(R: number, n = 9) {
  return memo(`gpu:blades:${R}:${n}`, () => {
    const p = new Path2D();
    const r0 = R * 0.33;
    const r1 = R - 0.22;
    const pt = (r: number, ang: number) => ({ x: Math.cos(ang) * r, y: Math.sin(ang) * r });
    for (let i = 0; i < n; i++) {
      const a = (i * Math.PI * 2) / n;
      const sweep = 0.55;
      // a swept blade: narrow at the hub, broad and curved at the tip
      const h0 = a - 0.14;
      const h1 = a + 0.2;
      const t0 = a + sweep - 0.02;
      const t1 = a + sweep + 0.4;
      const A = pt(r0, h0);
      const M1 = pt((r0 + r1) * 0.55, a + sweep * 0.28);
      const C = pt(r0, h1);
      const M2 = pt((r0 + r1) * 0.55, a + sweep * 0.62 + 0.36);
      p.moveTo(A.x, A.y);
      p.quadraticCurveTo(M1.x, M1.y, Math.cos(t0) * r1, Math.sin(t0) * r1);
      p.arc(0, 0, r1, t0, t1);
      p.quadraticCurveTo(M2.x, M2.y, C.x, C.y);
      p.arc(0, 0, r0, h1, h0, true);
      p.closePath();
    }
    circle(p, 0, 0, r0 + 0.04);
    const hub = new Path2D();
    circle(hub, 0, 0, r0 * 0.62);
    return { p, hub };
  });
}

function drawGpu(c: CanvasRenderingContext2D, o: GpuOpts, env: PaintEnv) {
  const n = o.fans ?? 2;
  const G = gpuBody(n, o.bracket !== false);
  const ink = env.fill('ink');
  const lit = o.lit ?? 0.8;
  const H = GPU.H;
  const R = fanR(n);
  // aperture interior: dark fin stack (not a hole: the heatsink is behind)
  c.save();
  c.clip(G.holes);
  // the fin stack behind the blades sits a value step up from ink so the blades read
  c.fillStyle = mixLab(env.fill('ink'), env.mood.haze, 0.5);
  c.fillRect(-GPU.L / 2, -H, GPU.L, H);
  c.strokeStyle = withAlpha(env.fill('ink'), 0.55);
  c.lineWidth = 0.16;
  c.stroke(G.fins);
  if (lit > 0) {
    // underglow from the fan LEDs onto the fins
    for (const fx of G.fans) {
      const g = c.createRadialGradient(fx, -H / 2, 0, fx, -H / 2, R);
      g.addColorStop(0, lamp(env, 0.6, 0.22 * lit));
      g.addColorStop(0.7, lamp(env, 0.6, 0.35 * lit));
      g.addColorStop(1, lamp(env, 0.95, 0.75 * lit));
      c.fillStyle = g;
      c.fillRect(fx - R, -H / 2 - R, R * 2, R * 2);
    }
  }
  c.restore();
  // body minus the fan apertures (clip with an evenodd mask so overlapping parts stay solid)
  const mask = memo(`gpu:mask:${n}`, () => {
    const m = new Path2D();
    rect(m, -GPU.L, -GPU.H * 2, GPU.L * 2, GPU.H * 4);
    m.addPath(G.holes);
    return m;
  });
  c.save();
  c.clip(mask, 'evenodd');
  c.fillStyle = ink;
  c.fill(G.p);
  c.restore();
  c.fillStyle = ink;
  c.fill(G.br, 'evenodd');
  // fans: rotating blades; above ~1.6 rev/s add a smear so it reads as motion at 24 fps
  const spin = o.spin ?? 0.7;
  const B = fanBlades(R, 9);
  G.fans.forEach((fx, i) => {
    const a = env.t * spin * Math.PI * 2 * (i % 2 ? 1.04 : 1) + i * 0.7;
    c.save();
    c.translate(fx, -H / 2);
    if (Math.abs(spin) > 1.6) {
      c.globalAlpha = 0.35;
      for (let k = 1; k <= 3; k++) {
        c.save();
        c.rotate(a - k * 0.09 * Math.sign(spin));
        c.fill(B.p);
        c.restore();
      }
      c.globalAlpha = 1;
    }
    c.rotate(a);
    c.fillStyle = ink;
    c.fill(B.p);
    c.restore();
  });
  // aperture rims: lit LED rings or plain cut-lines
  if (lit > 0) {
    c.save();
    c.strokeStyle = lamp(env, 0.85, 0.85 * lit);
    c.lineWidth = 0.22;
    c.beginPath();
    for (const fx of G.fans) {
      c.moveTo(fx + R + 0.1, -H / 2);
      c.arc(fx, -H / 2, R + 0.1, 0, Math.PI * 2);
    }
    c.stroke();
    // hub caps glow faintly
    for (const fx of G.fans) {
      const p = new Path2D();
      circle(p, fx, -H / 2, 0.75);
      c.fillStyle = lamp(env, 0.5, 0.35 * lit);
      c.fill(p);
    }
    // LED edge strip along the top of the shroud
    c.fillStyle = lamp(env, 0.95, 0.9 * lit);
    c.fillRect(-GPU.L / 2 + 8, -H + 0.25, 10, 0.3);
    c.restore();
  } else {
    cut(c, env, G.rims, 0.3, 1);
  }
  cut(c, env, G.cl, 0.32, 1.1);
}

export const gpuCard = defineProp<GpuOpts, 'fan0' | 'fan1' | 'fan2' | 'led' | 'bracket'>(
  drawGpu,
  (o) => {
    const f = fanCentres(o.fans ?? 2);
    return {
      fan0: { x: f[0], y: -GPU.H / 2 },
      fan1: { x: f[1] ?? f[0], y: -GPU.H / 2 },
      fan2: { x: f[2] ?? f[f.length - 1], y: -GPU.H / 2 },
      led: { x: -GPU.L / 2 + 13, y: -GPU.H },
      bracket: { x: -GPU.L / 2 - 0.7, y: -GPU.H / 2 },
    };
  },
  () => ({ x: -GPU.L / 2 - 2.7, y: -GPU.H - 1.6, w: GPU.L + 3, h: GPU.H + 5.2 }),
);

// ---------------------------------------------------------------------------
// Desktop tower (side view through the window)
// ---------------------------------------------------------------------------
export interface TowerOpts extends PropAt {
  gpus?: 0 | 1 | 2;
  lit?: number;
  window?: boolean;
  seed?: number;
}

const TW = { w: 48, h: 47 };

export const desktopTower = defineProp<TowerOpts, 'gpu0' | 'gpu1' | 'power' | 'window'>(
  (c, o, env) => {
    const ink = env.fill('ink');
    const lit = o.lit ?? 0.8;
    const win = o.window !== false;
    const G = memo(`tower:${win}`, () => {
      const p = new Path2D();
      // case side panel, feet, front bezel (right)
      rrect(p, -TW.w / 2, -TW.h, TW.w, TW.h - 1.6, 1);
      rrect(p, TW.w / 2 - 3.2, -TW.h - 0.4, 3.8, TW.h - 1.2, 1);
      for (const x of [-TW.w / 2 + 3, TW.w / 2 - 6]) rrect(p, x, -1.8, 4, 1.8, 0.6);
      const hole = new Path2D();
      if (win) rrect(hole, -TW.w / 2 + 3.4, -TW.h + 4.4, TW.w - 10, TW.h - 12, 1.6);
      const cl = new Path2D();
      for (let k = 0; k < 9; k++) {
        cl.moveTo(-TW.w / 2 + 6 + k * 3.6, -TW.h + 1.6);
        cl.lineTo(-TW.w / 2 + 8 + k * 3.6, -TW.h + 1.6);
      }
      for (let k = 0; k < 5; k++) rect(cl, TW.w / 2 - 2.6, -TW.h + 4 + k * 2.4, 2.4, 1.6);
      cl.moveTo(TW.w / 2 - 3.2, -TW.h + 18);
      cl.lineTo(TW.w / 2 - 3.2, -3);
      // interior: motherboard tray, CPU tower cooler, PSU shroud
      const inside = new Path2D();
      rect(inside, -TW.w / 2 + 6, -TW.h + 7, 24, 27);
      const parts = new Path2D();
      rect(parts, -TW.w / 2 + 3.4, -12, TW.w - 10, 4.4); // PSU shroud
      rect(parts, -TW.w / 2 + 12, -TW.h + 10, 7, 10); // cooler fins block
      rect(parts, -TW.w / 2 + 19, -TW.h + 10.4, 1.4, 9.2); // cooler fan
      for (let k = 0; k < 4; k++) rect(parts, -TW.w / 2 + 24.5 + k * 1.2, -TW.h + 9, 0.6, 9); // RAM sticks
      const fins = new Path2D();
      for (let y = -TW.h + 10.6; y < -TW.h + 19.6; y += 0.7) {
        fins.moveTo(-TW.w / 2 + 12.2, y);
        fins.lineTo(-TW.w / 2 + 18.8, y);
      }
      // rear exhaust fan (seen edge-on) and cables
      rect(parts, -TW.w / 2 + 3.4, -TW.h + 8, 2.2, 10);
      return { p, hole, cl, inside, parts, fins };
    });
    const body = new Path2D();
    body.addPath(G.p);
    body.addPath(G.hole);
    if (win) {
      // dark interior behind the glass
      c.fillStyle = inkLift(env, 0.3);
      c.fill(G.hole);
      c.fillStyle = mixLab(ink, env.mood.set, 0.12);
      c.fill(G.inside);
      c.fillStyle = ink;
      c.fill(G.parts);
      cut(c, env, G.fins, 0.15, 0.8);
      // GPUs lie horizontal: we see the shroud edge, LED strip on top, fan glow spilling downward
      const gpus = o.gpus ?? 2;
      for (let i = 0; i < gpus; i++) {
        const y = -TW.h + 25 + i * 6.2;
        const x0 = -TW.w / 2 + 3.4;
        if (lit > 0) {
          const g = c.createLinearGradient(0, y + 2.6, 0, y + 6);
          g.addColorStop(0, lamp(env, 0.8, 0.5 * lit));
          g.addColorStop(1, lamp(env, 0.4, 0));
          c.fillStyle = g;
          c.fillRect(x0 + 2, y + 2.6, 26, 3.4);
        }
        c.fillStyle = ink;
        c.fillRect(x0, y, 29, 2.6);
        c.fillRect(x0, y - 0.6, 1.6, 4);
        if (lit > 0) {
          c.fillStyle = lamp(env, 0.95, 0.9 * lit);
          c.fillRect(x0 + 9, y + 0.5, 12, 0.35);
        }
      }
      // glass sheen
      const sh = new Path2D();
      poly(sh, [-TW.w / 2 + 8, -TW.h + 4.4, -TW.w / 2 + 14, -TW.h + 4.4, -TW.w / 2 + 3.4, -TW.h + 20, -TW.w / 2 + 3.4, -TW.h + 12]);
      c.fillStyle = withAlpha(env.mood.rim, 0.05);
      c.fill(sh);
    }
    c.fillStyle = ink;
    c.fill(body, 'evenodd');
    cut(c, env, G.cl, 0.28, 1);
    const pw = new Path2D();
    circle(pw, TW.w / 2 - 1.3, -TW.h + 2.2, 0.55);
    c.fillStyle = lamp(env, 0.9, lit > 0 ? 1 : 0.2);
    c.fill(pw);
  },
  () => ({ gpu0: { x: -TW.w / 2 + 18, y: -TW.h + 26 }, gpu1: { x: -TW.w / 2 + 18, y: -TW.h + 32 }, power: { x: TW.w / 2 - 1.3, y: -TW.h + 2.2 }, window: { x: -2, y: -TW.h / 2 - 2 } }),
  () => ({ x: -TW.w / 2, y: -TW.h - 0.4, w: TW.w + 0.6, h: TW.h + 0.4 }),
);

// ---------------------------------------------------------------------------
// Laptop
// ---------------------------------------------------------------------------
export interface LaptopOpts extends PropAt {
  open?: number;
  on?: boolean;
  view?: 'front' | 'side';
  seed?: number;
}

function laptopGeom(o: LaptopOpts) {
  const open = Math.max(0, Math.min(1, o.open ?? 1));
  const ang = open * (Math.PI * 0.6); // 0 closed .. 108°
  return { open, ang, lidH: 22 * Math.sin(Math.min(ang, Math.PI / 2)) * (ang > Math.PI / 2 ? 0.97 : 1) };
}

export const laptop = defineProp<LaptopOpts, 'screen' | 'screenTL' | 'screenBR' | 'keys'>(
  (c, o, env) => {
    const ink = env.fill('ink');
    const G = laptopGeom(o);
    const on = o.on !== false && G.open > 0.3;
    if (o.view === 'side') {
      const p = new Path2D();
      rrect(p, -12, -1.6, 24, 1.6, 0.6);
      c.fillStyle = ink;
      c.fill(p);
      c.save();
      c.translate(-11.6, -1.4);
      c.rotate(-G.ang);
      const lid = new Path2D();
      rrect(lid, 0, -0.5, 23, 0.7, 0.3);
      c.fill(lid);
      c.restore();
      if (on) {
        // screen light falls toward the user (+x)
        c.save();
        c.globalCompositeOperation = 'lighter';
        const cx = -11.6 + Math.cos(G.ang) * 11;
        const cy = -1.4 - Math.sin(G.ang) * 11;
        const g = c.createRadialGradient(cx, cy, 0, cx, cy, 22);
        g.addColorStop(0, lamp(env, 0.6, 0.22));
        g.addColorStop(1, lamp(env, 0.3, 0));
        c.fillStyle = g;
        c.fillRect(cx - 22, cy - 22, 44, 44);
        c.restore();
      }
      return;
    }
    // front view: lid face above a perspective base
    const base = new Path2D();
    poly(base, [-17, 0, 17, 0, 15.2, -2.6, -15.2, -2.6]);
    c.fillStyle = ink;
    c.fill(base);
    const deck = new Path2D();
    poly(deck, [-15.4, -0.9, 15.4, -0.9, 14.6, -2.2, -14.6, -2.2]);
    c.fillStyle = inkLift(env, 0.25);
    c.fill(deck);
    if (G.lidH > 0.3) {
      const lid = new Path2D();
      rrect(lid, -15.2, -2.6 - G.lidH, 30.4, G.lidH, Math.min(0.8, G.lidH / 2));
      c.fillStyle = ink;
      c.fill(lid);
      const sTop = -2.6 - G.lidH + 1.1 * (G.lidH / 22);
      const sH = G.lidH - 2.2 * (G.lidH / 22);
      const scr = new Path2D();
      rect(scr, -14, sTop, 28, sH);
      if (on) {
        const g = c.createLinearGradient(0, sTop, 0, sTop + sH);
        g.addColorStop(0, lamp(env, 0.75, 0.75));
        g.addColorStop(1, lamp(env, 0.45, 0.6));
        c.fillStyle = g;
        c.fill(scr);
        // a window or two on the desktop
        c.fillStyle = withAlpha(env.fill('ink'), 0.28);
        c.fillRect(-11, sTop + sH * 0.15, 14, sH * 0.5);
        c.fillRect(5, sTop + sH * 0.3, 7, sH * 0.45);
      } else {
        c.fillStyle = inkLift(env, 0.2);
        c.fill(scr);
      }
    }
  },
  (o) => {
    const G = laptopGeom(o);
    const sTop = -2.6 - G.lidH + 1.1 * (G.lidH / 22);
    const sH = G.lidH - 2.2 * (G.lidH / 22);
    return { screen: { x: 0, y: sTop + sH / 2 }, screenTL: { x: -14, y: sTop }, screenBR: { x: 14, y: sTop + sH }, keys: { x: 0, y: -1.6 } };
  },
  (o) => {
    const G = laptopGeom(o);
    return { x: -17, y: -2.6 - G.lidH, w: 34, h: 2.6 + G.lidH };
  },
);

// ---------------------------------------------------------------------------
// Server rack (42U)
// ---------------------------------------------------------------------------
export interface ServerRackOpts extends PropAt {
  activity?: number;
  seed?: number;
  warm?: number;
  door?: number;
}

const SR = { w: 60, h: 200, u: 4.445 };

function rackLayout(seed: number) {
  return memo(`srv:${seed}`, () => {
    const p = new Path2D();
    const hw = SR.w / 2;
    // cabinet: posts, top, plinth with casters
    rect(p, -hw, -SR.h, 4, SR.h - 3);
    rect(p, hw - 4, -SR.h, 4, SR.h - 3);
    rect(p, -hw, -SR.h, SR.w, 6);
    rect(p, -hw, -9, SR.w, 6);
    for (const x of [-hw + 4, hw - 4]) circle(p, x, -1.8, 1.8);
    // units, stacked from the bottom: mix of 1U/2U/4U with gaps (blanking panels)
    const units: Array<{ y: number; h: number; kind: number }> = [];
    let y = -9;
    const top = -SR.h + 6;
    let i = 0;
    while (y - SR.u > top) {
      const r = hash(i, seed);
      const h = r < 0.5 ? 1 : r < 0.8 ? 2 : r < 0.92 ? 4 : 1;
      const kind = r > 0.92 ? 3 : hash(i, seed + 2) < 0.12 ? 2 : h === 1 ? 0 : 1;
      if (y - h * SR.u < top) break;
      units.push({ y: y - h * SR.u, h: h * SR.u, kind });
      y -= h * SR.u;
      i++;
    }
    const face = new Path2D();
    const cl = new Path2D();
    const perf = new Path2D();
    const leds: Array<{ x: number; y: number }> = [];
    const ux = -hw + 4.6;
    const uw = SR.w - 9.2;
    units.forEach((u) => {
      rect(face, ux, u.y + 0.15, uw, u.h - 0.3);
      if (u.kind === 3) return; // blanking panel: plain
      // ears with handles
      rect(cl, ux + 0.6, u.y + 0.8, 1.2, u.h - 1.6);
      rect(cl, ux + uw - 1.8, u.y + 0.8, 1.2, u.h - 1.6);
      if (u.kind === 1 || u.kind === 2) {
        // drive bays
        const n = u.kind === 2 ? 12 : 8;
        const bw = (uw - 16) / n;
        for (let b = 0; b < n; b++) rect(cl, ux + 3 + b * bw, u.y + 0.9, bw - 0.4, u.h - 1.8);
        for (let b = 0; b < n; b++) leds.push({ x: ux + 3 + b * bw + bw - 1.2, y: u.y + u.h - 1.6 });
      } else {
        // 1U: perforated bezel + status LEDs at right
        for (let px2 = ux + 3; px2 < ux + uw - 12; px2 += 1.1) for (let py = u.y + 1.0; py < u.y + u.h - 0.8; py += 1.1) circle(perf, px2 + ((py * 10) % 2 ? 0.55 : 0), py, 0.28);
        for (let b = 0; b < 4; b++) leds.push({ x: ux + uw - 10 + b * 2, y: u.y + u.h / 2 });
      }
    });
    return { p, face, cl, perf, leds, units };
  });
}

export const serverRack = defineProp<ServerRackOpts, 'top' | 'centre' | 'led'>(
  (c, o, env) => {
    const seed = o.seed ?? 11;
    const L = rackLayout(seed);
    const ink = env.fill('ink');
    c.fillStyle = ink;
    c.fill(L.p);
    c.fillStyle = mixLab(ink, env.mood.set, 0.1);
    c.fill(L.face);
    c.fillStyle = withAlpha(env.fill('ink'), 0.9);
    c.fill(L.perf);
    cut(c, env, L.cl, 0.2, 0.9);
    // LEDs: steady greens/cyans, a few warm, blinking activity
    const act = o.activity ?? 0.55;
    const warm = o.warm ?? 0.06;
    const cool = new Path2D();
    const amber = new Path2D();
    const dim = new Path2D();
    L.leds.forEach((q, i) => {
      const isWarm = hash(i, seed + 5) < warm;
      const on = blink(i, env.t, seed, act, 6);
      const target = on ? (isWarm ? amber : cool) : dim;
      rect(target, q.x - 0.35, q.y - 0.3, 0.7, 0.6);
    });
    c.fillStyle = inkLift(env, 0.35);
    c.fill(dim);
    c.fillStyle = lamp(env, 1);
    c.fill(cool);
    c.fillStyle = withAlpha(mixLab(env.mood.core, '#ff9a5a', 0.6), 1);
    c.fill(amber);
    // soft LED bloom
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = lamp(env, 0.4, 0.22);
    c.lineWidth = 1.2;
    c.stroke(cool);
    c.restore();
    // perforated glass door (optional)
    const d = o.door ?? 0;
    if (d > 0) {
      c.fillStyle = withAlpha(env.fill('ink'), 0.45 * d);
      c.fillRect(-SR.w / 2 + 3, -SR.h + 5, SR.w - 6, SR.h - 13);
    }
  },
  () => ({ top: { x: 0, y: -SR.h }, centre: { x: 0, y: -SR.h / 2 }, led: { x: 18, y: -SR.h / 2 } }),
  () => ({ x: -SR.w / 2, y: -SR.h, w: SR.w, h: SR.h }),
);

// ---------------------------------------------------------------------------
// Chips: package / wafer / die (top views)
// ---------------------------------------------------------------------------
export interface ChipOpts extends PropAt {
  kind?: 'package' | 'wafer' | 'die';
  lit?: number;
  progress?: number;
  seed?: number;
}

function dieCity(seed: number) {
  return memo(`die:${seed}`, () => {
    // a 10 × 7 cm die drawn as a city plan: core blocks, cache strips, I/O ring, streets
    const W = 10;
    const H = 7;
    const p = new Path2D();
    rect(p, -W / 2, -H / 2, W, H);
    const blocks = new Path2D();
    const cols = 12;
    const rows = 7;
    const gx = 0.14;
    const bx = (W - 1.6) / cols;
    const by = (H - 2.4) / rows;
    for (let r = 0; r < rows; r++)
      for (let k = 0; k < cols; k++) {
        const x = -W / 2 + 0.8 + k * bx;
        const y = -H / 2 + 0.8 + r * by + (r >= rows / 2 ? 0.8 : 0);
        rect(blocks, x + gx, y + gx, bx - gx * 2, by - gx * 2);
      }
    // L2 cache band across the middle
    rect(blocks, -W / 2 + 0.9, -0.35, W - 1.8, 0.7);
    // I/O pads ring
    const pads = new Path2D();
    for (let x = -W / 2 + 0.3; x < W / 2 - 0.2; x += 0.35) {
      rect(pads, x, -H / 2 + 0.12, 0.2, 0.3);
      rect(pads, x, H / 2 - 0.42, 0.2, 0.3);
    }
    for (let y = -H / 2 + 0.6; y < H / 2 - 0.5; y += 0.35) {
      rect(pads, -W / 2 + 0.12, y, 0.3, 0.2);
      rect(pads, W / 2 - 0.42, y, 0.3, 0.2);
    }
    return { p, blocks, pads, W, H };
  });
}

function waferGeom() {
  return memo('wafer', () => {
    const R = 15;
    const p = new Path2D();
    circle(p, 0, 0, R);
    const dies: Array<{ x: number; y: number }> = [];
    const d = 1.9;
    const g = 0.18;
    const all = new Path2D();
    for (let y = -R; y < R; y += d)
      for (let x = -R; x < R; x += d) {
        const cs = [[x, y], [x + d, y], [x, y + d], [x + d, y + d]];
        if (cs.every(([a, b]) => a * a + b * b < (R - 0.6) * (R - 0.6))) {
          dies.push({ x: x + d / 2, y: y + d / 2 });
          rect(all, x + g / 2, y + g / 2, d - g, d - g);
        }
      }
    // notch at the bottom
    const notch = new Path2D();
    circle(notch, 0, R, 0.5);
    return { p, dies, all, notch, R, d, g };
  });
}

export const chip = defineProp<ChipOpts, 'centre' | 'die'>(
  (c, o, env) => {
    const kind = o.kind ?? 'package';
    const ink = env.fill('ink');
    const lit = o.lit ?? 0.6;
    if (kind === 'wafer') {
      const W = waferGeom();
      const prog = o.progress ?? 1;
      // the wafer face: mirror-dark with a sheen, die grid, streets glow when lit
      c.fillStyle = ink;
      c.fill(W.p);
      if (lit > 0) {
        c.save();
        c.clip(W.p);
        c.fillStyle = lamp(env, 0.6, 0.55 * lit);
        c.fillRect(-W.R, -W.R, W.R * 2, W.R * 2);
        c.restore();
      }
      c.fillStyle = mixLab(ink, env.mood.set, 0.18);
      c.fill(W.all);
      // dies light up in a seeded order up to `progress`
      const on = new Path2D();
      W.dies.forEach((q, i) => {
        if (hash(i, o.seed ?? 4) < prog * 0.35) rect(on, q.x - W.d / 2 + W.g, q.y - W.d / 2 + W.g, W.d - W.g * 2, W.d - W.g * 2);
      });
      c.fillStyle = lamp(env, 0.85, 0.5 * lit);
      c.fill(on);
      const sheen = new Path2D();
      ellipse(sheen, -5, -6, 9, 2.6, -0.6);
      c.fillStyle = withAlpha(env.mood.rim, 0.06);
      c.fill(sheen);
      c.save();
      c.globalCompositeOperation = 'destination-out';
      c.fill(W.notch);
      c.restore();
      const rim = new Path2D();
      circle(rim, 0, 0, W.R - 0.1);
      cut(c, env, rim, 0.4, 1.2);
      return;
    }
    if (kind === 'die') {
      const D = dieCity(o.seed ?? 1);
      c.fillStyle = lit > 0 ? lamp(env, 0.6, 0.85 * lit) : inkLift(env, 0.4);
      c.fill(D.p);
      c.fillStyle = ink;
      c.fill(D.blocks);
      c.fillStyle = mixLab(ink, env.mood.set, 0.25);
      c.fill(D.pads);
      return;
    }
    // package: substrate, SMD caps, central die and four HBM stacks
    const P = memo('pkg', () => {
      const s = new Path2D();
      rrect(s, -5.5, -5.5, 11, 11, 0.3);
      const caps = new Path2D();
      for (let i = 0; i < 18; i++) {
        const u = -4.8 + (i % 9) * 1.2;
        const v = i < 9 ? -5.1 : 4.8;
        rect(caps, u, v, 0.5, 0.25);
      }
      const die = new Path2D();
      rect(die, -2.2, -2.6, 4.4, 5.2);
      const hbm = new Path2D();
      for (const [x, y] of [[-4.1, -2.6], [-4.1, 0.15], [2.5, -2.6], [2.5, 0.15]]) rect(hbm, x, y, 1.6, 2.45);
      const cl = new Path2D();
      rect(cl, -2.0, -2.4, 4.0, 4.8);
      cl.moveTo(-1.6, -1.8);
      cl.lineTo(0.4, -2.2);
      return { s, caps, die, hbm, cl };
    });
    c.fillStyle = ink;
    c.fill(P.s);
    c.fillStyle = mixLab(ink, env.mood.set, 0.3);
    c.fill(P.caps);
    c.fillStyle = lit > 0 ? mixLab(inkLift(env, 0.4), env.mood.halo, 0.25 * lit) : inkLift(env, 0.4);
    c.fill(P.die);
    c.fillStyle = inkLift(env, 0.3);
    c.fill(P.hbm);
    cut(c, env, P.cl, 0.35, 1.1);
  },
  (o) => (o.kind === 'wafer' ? { centre: { x: 0, y: 0 }, die: { x: 0, y: 0 } } : { centre: { x: 0, y: 0 }, die: { x: 0, y: 0 } }),
  (o) => {
    const r = o.kind === 'wafer' ? 15 : o.kind === 'die' ? 5 : 5.5;
    return { x: -r, y: -(o.kind === 'die' ? 3.5 : r), w: r * 2, h: o.kind === 'die' ? 7 : r * 2 };
  },
);

// ---------------------------------------------------------------------------
// Smartphone
// ---------------------------------------------------------------------------
export interface PhoneOpts extends PropAt {
  on?: boolean;
  view?: 'front' | 'side';
  seed?: number;
}

export const smartphone = defineProp<PhoneOpts, 'screen'>(
  (c, o, env) => {
    const ink = env.fill('ink');
    if (o.view === 'side') {
      const p = new Path2D();
      rrect(p, -0.42, -15, 0.84, 15, 0.4);
      rect(p, 0.42, -12, 0.12, 1.4);
      c.fillStyle = ink;
      c.fill(p);
      return;
    }
    const p = new Path2D();
    rrect(p, -3.6, -15, 7.2, 15, 0.95);
    c.fillStyle = ink;
    c.fill(p);
    const s = new Path2D();
    rrect(s, -3.25, -14.65, 6.5, 14.3, 0.7);
    if (o.on !== false) {
      const g = c.createLinearGradient(0, -14.6, 0, -0.4);
      g.addColorStop(0, lamp(env, 0.85, 0.85));
      g.addColorStop(1, lamp(env, 0.5, 0.7));
      c.fillStyle = g;
      c.fill(s);
      // app grid
      c.fillStyle = withAlpha(env.fill('ink'), 0.3);
      for (let r = 0; r < 5; r++) for (let k = 0; k < 4; k++) c.fillRect(-2.7 + k * 1.45, -12.4 + r * 1.9, 0.95, 0.95);
    } else {
      c.fillStyle = inkLift(env, 0.25);
      c.fill(s);
    }
    const cam = new Path2D();
    circle(cam, 0, -14.0, 0.22);
    c.fillStyle = ink;
    c.fill(cam);
  },
  (o) => ({ screen: { x: 0, y: o.view === 'side' ? -7.5 : -7.5 } }),
  (o) => (o.view === 'side' ? { x: -0.5, y: -15, w: 1.1, h: 15 } : { x: -3.6, y: -15, w: 7.2, h: 15 }),
);
