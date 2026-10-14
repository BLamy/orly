/**
 * ch01-s03 — the pull-back: out of the screen, up over the night city, to the earth's night limb dusted with
 * lit windows; on "rulebook" everything holds and the home window pulses once (serverCyan, 11.04 s, cut in).
 *
 * THREE camera moves chained by occluders (no single multiplane move crosses these scales; each join is a
 * hidden cut). Moves 1 and 2 are wordless, inside the 2.2 s lead-in:
 *  MOVE 1 (0 → ~0.85 s): from ch01-s02's close framing the camera slides backwards out of the screen,
 *    past the person's dark profile, the room opening up; three glazing bars race past the lens (~0.15 s
 *    each, motion-blurred, a rim hairline of screen light on each), then the stile fills the frame with ink
 *    for a few frames: the first hidden cut.
 *  MOVE 2 (~0.85 → ~1.9 s): out of the occluder, the megacity rises out of the fog on four planes as the
 *    camera lifts (towers with thousands of small cyan-lit windows, fog between them), and climbs into a
 *    cloud bank that thickens until it fills the frame: the second hidden cut, a dissolve through cloud.
 *  MOVE 3 (~1.9 s →): the cloud thins to reveal the NIGHT LIMB (sets/ch01-s03-nightLimb), dark and unlit as
 *    L0104 begins; from "seven hundred million" the window lights spread across the dark continents in
 *    ragged waves, like windows lit at dusk, none labelled; the camera rises and settles very slowly.
 *  On "rulebook" the camera stops, the lights stop spreading, and the home window near centre frame (the
 *    one we came from) pulses once. Hold in the silence after it.
 * Through the hold, a faint twinkling star field in the upper sky (L1) and a thin dark cloud strip drifting
 * along the lower edge (L5) keep three planes alive; both freeze with everything else on "rulebook".
 * The earth is the one sharp plane (L2's depth, blur 0): a crisp limb, continents at the set value against a
 * near-ink sea, lit windows as 4-5 px rectangles coming on in visible waves (about 10% on "seven" to about 80%
 * by "week"); only cloud stays soft. The home window's pulse is a soft bloom (40 → 120 px and back), no ring.
 * Type: date stamp "2026" (IBM Plex Mono, bottom left, on a faint rectangle) from `rise`; the hedged count
 * (>= 28 px cap height) with its source from `earth`, in the sky at upper centre-left, faded before the freeze.
 */
import { Timeline, ease } from '../../../core';
import { FONT, LAYERS, capPx1080, defineShot, overscan, fbm2, legibleSize, makeCanvas, mixLab, softPlate, stars, toLayer, toScreen, withAlpha } from '../../../film';
import type { Camera3, Frame, LayerSpec } from '../../../film';
import { BENCH_CAMS, BENCH_FINAL, bench } from '../sets/ch01-s02-bench';
import { LIMB, limbHome, nightLimb } from '../sets/ch01-s03-nightLimb';
import { city2026 } from '../sets/ch01-s03-city';

/** MOVE 1: ch01-s02's end framing, pulling back out of the screen (accelerating) */
const A0: Camera3 = { ...BENCH_CAMS.end };
const A1: Camera3 = { x: 700, y: 330, z: -900, lens: 1 };
/** MOVE 2: the city, rising */
const B0: Camera3 = { x: 620, y: 620, z: 40, lens: 1 };
const B1: Camera3 = { x: 700, y: 60, z: -220, lens: 1 };
/** MOVE 3: the limb, a slow rise and settle that stops dead on "rulebook" */
const C0: Camera3 = { x: 650, y: 380, z: -150, lens: 1 };
/** settled out of the cloud by MOVE3_AT; then one slow travel (a 60 px truck right and a +60 dolly, easing in
 *  and then steady) that stops dead on "rulebook", so the stillness is seen as a stop */
const CM: Camera3 = { x: 580, y: 332, z: -60, lens: 1 };
/** (the travel ends on the previous final framing, so the home window still sits where ch01-s04's lamp lip
 *  takes over in the lamp change) */
const C1: Camera3 = { x: 640, y: 322, z: 0, lens: 1 };
const MOVE3_AT = 2.5;
/** 0..1 travel: velocity ramps up over the first 30%, then constant until it stops dead at 1 */
const travel = (u: number) => {
  const a = 0.3, v = 1 / (1 - a / 2);
  u = clamp01(u);
  return u < a ? (v * u * u) / (2 * a) : v * (u - a / 2);
};

/** the earth's plane: L2's depth (so the home window keeps its place for the lamp change) but blur 0 and light
 *  haze: the limb edge and the lit windows are the shot's one sharp plane; only cloud stays soft */
const LIMB_PLANE: LayerSpec = { id: 'limbSharp', z: LAYERS.L2.z, haze: 0.08, blur: 0 };

const T_OCC = 0.86; // hidden cut 1 (behind the stile)
const T_CLOUD = 1.92; // hidden cut 2 (inside the cloud)

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const sm = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const lerpCam = (a: Camera3, b: Camera3, u: number): Camera3 => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, z: a.z + (b.z - a.z) * u, lens: a.lens + (b.lens - a.lens) * u });

// ---------------------------------------------------------------- a baked cloud sheet (seeded fbm alpha)
let CLOUD: HTMLCanvasElement | null = null;
function cloudSheet(): HTMLCanvasElement {
  if (CLOUD) return CLOUD;
  const W = 320, H = 360;
  const cv = makeCanvas(W, H);
  const g = cv.getContext('2d')!;
  const img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // tile vertically: blend the noise with its copy one period up
      const v = y / H;
      const n = (1 - v) * fbm2(x * 0.018, y * 0.018, 5, 5) + v * fbm2(x * 0.018, (y - H) * 0.018, 5, 5);
      const a = clamp01((n - 0.3) / 0.45);
      const i = (y * W + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(255 * a);
    }
  }
  g.putImageData(img, 0, 0);
  CLOUD = cv;
  return cv;
}
/** screen-locked cloud passing DOWN the frame as the camera climbs (two sheets at different rates) */
function clouds(f: Frame, density: number, t: number) {
  if (density <= 0.002) return;
  const c = f.c;
  const sheet = cloudSheet();
  const tint = makeTint(f, sheet);
  c.save();
  for (const [k, speed, a] of [[0, 520, 0.85], [1, 820, 1]] as const) {
    const H = 760 * (1.2 + 0.25 * k);
    const off = ((t * speed + k * 300) % H + H) % H;
    c.globalAlpha = clamp01(density * a);
    for (let r = -1; r <= 0; r++) c.drawImage(tint, -40 - k * 60, off + r * H, 1400 + k * 120, H);
  }
  // a full veil once the bank is thick (the cloud fills the frame), but never a flat field: darker billows
  // and lit crests keep rolling through it (fbm structure at >= 15% contrast at full density)
  const veil = clamp01((density - 0.55) / 0.45);
  c.globalAlpha = veil * 0.92;
  c.fillStyle = mixLab(f.mood.haze, f.mood.sky[2], 0.3);
  c.fillRect(-20, -20, 1320, 760);
  if (veil > 0) {
    const dark = makeTint(f, sheet, mixLab(mixLab(f.mood.haze, f.mood.sky[2], 0.3), f.mood.fg, 0.55));
    const lite = makeTint(f, sheet, mixLab(f.mood.haze, f.mood.core, 0.25));
    const H = 760 * 1.35;
    const off = ((t * 640 + 170) % H + H) % H;
    c.globalAlpha = veil * 0.7;
    for (let r = -1; r <= 0; r++) c.drawImage(dark, -120, off + r * H, 1560, H);
    const off2 = ((t * 900 + 520) % H + H) % H;
    c.globalAlpha = veil * 0.45;
    for (let r = -1; r <= 0; r++) c.drawImage(lite, 90, off2 + r * H, 1500, H);
  }
  c.restore();
}
const tintCache = new Map<string, HTMLCanvasElement>();
function makeTint(f: Frame, sheet: HTMLCanvasElement, tintCol?: string) {
  const col = tintCol ?? mixLab(f.mood.haze, f.mood.sky[2], 0.3);
  let cv = tintCache.get(col);
  if (cv) return cv;
  cv = makeCanvas(sheet.width, sheet.height);
  const g = cv.getContext('2d')!;
  g.drawImage(sheet, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = col;
  g.fillRect(0, 0, sheet.width, sheet.height);
  tintCache.set(col, cv);
  return cv;
}

/** the window's mullions racing past the lens as the camera pulls back through it: three near (L1-distance)
 *  glazing bars, each crossing the frame in ~0.15 s right to left, motion-blurred (soft leading and trailing
 *  smear) with a rim hairline of the screen's light on the edge facing it; growing as they come nearer. Then the
 *  stile sweeps in and fills the frame with ink for the last few frames before the hidden cut. */
const MULLIONS: { at: number; w: number; soft: number }[] = [
  { at: 0.3, w: 70, soft: 34 },
  { at: 0.44, w: 120, soft: 46 },
  { at: 0.57, w: 190, soft: 60 },
];
const MULL_DUR = 0.15;
function occluder(f: Frame, t: number) {
  const c = f.c;
  const ink = f.mood.fg;
  const rimC = mixLab(f.mood.rim, f.mood.halo, 0.35);
  const bar = (cx: number, w: number, soft: number, rimA: number) => {
    const g = c.createLinearGradient(cx - w / 2 - soft, 0, cx + w / 2 + soft, 0);
    const a = soft / (w + 2 * soft);
    g.addColorStop(0, withAlpha(ink, 0));
    g.addColorStop(a, withAlpha(ink, 1));
    g.addColorStop(1 - a, withAlpha(ink, 1));
    g.addColorStop(1, withAlpha(ink, 0));
    c.fillStyle = g;
    c.fillRect(cx - w / 2 - soft, -20, w + 2 * soft, 760);
    if (rimA > 0) {
      // the rim hairline on the bar's right edge (toward the lit screen we are leaving), smeared by the motion
      const ex = cx + w / 2;
      const rg = c.createLinearGradient(ex - soft * 0.5, 0, ex + soft * 0.35, 0);
      rg.addColorStop(0, withAlpha(rimC, 0));
      rg.addColorStop(0.55, withAlpha(rimC, 0.55 * rimA));
      rg.addColorStop(1, withAlpha(rimC, 0));
      c.fillStyle = rg;
      c.fillRect(ex - soft * 0.5, -20, soft * 0.85, 760);
    }
  };
  c.save();
  for (const M of MULLIONS) {
    const u = (t - M.at) / MULL_DUR;
    if (u <= 0 || u >= 1) continue;
    // enters past the right edge, exits past the left: the screen-px speed of a bar close to the lens
    const span = 1280 + M.w + 2 * M.soft;
    const cx = 1280 + M.w / 2 + M.soft - span * u;
    bar(cx, M.w, M.soft, 1);
  }
  // the stile: sweeps in from the right and widens until it covers everything (~4 frames of full ink at the cut)
  const u2 = (t - 0.66) / (T_OCC - 0.06 - 0.66);
  if (u2 > 0) {
    const k = Math.min(1, u2);
    const cx = 1750 - 1110 * k;
    const w = 220 + 1700 * Math.pow(k, 1.5);
    bar(cx, w, 30, 1 - k);
  }
  c.restore();
}

export default defineShot({
  id: 'ch01-s03',
  mood: 'serverCyan',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const earth = T.beat('earth');
    const still = T.beat('still');
    // the lights: none until "seven hundred million", then waves across the continents; the last few
    // fronts still creeping until "rulebook", where they stop dead
    const lit = tl.channel('lit', 0);
    const seven = T.word('L0104', 'seven');
    const hundred = T.word('L0104', 'hundred');
    const million = T.wordEnd('L0104', 'million');
    const week = T.word('L0104', 'week');
    const use = T.word('L0104', 'use');
    const every = T.word('L0104', 'every');
    // visible WAVES with breaths between them, from about 10% of the scatter lit on "seven" to about 80% by
    // "week" (the fraction lit is nonlinear in `lit`: 0.21 ≈ 10%, 0.36 ≈ 30%, 0.47 ≈ 50%, 0.56 ≈ 65%,
    // 0.64 ≈ 80%, 0.70 ≈ 88%; each front sweeps from the left with a seeded jitter)
    tl.tween(lit, 0.21, { at: seven - 0.15, dur: 0.35, ease: ease.move });
    tl.tween(lit, 0.36, { at: hundred, dur: 0.35, ease: ease.move });
    tl.tween(lit, 0.47, { at: million - 0.1, dur: 0.45, ease: ease.move });
    tl.tween(lit, 0.56, { at: use, dur: 0.45, ease: ease.move });
    tl.tween(lit, 0.64, { at: every, dur: week - every + 0.25, ease: ease.move });
    // a last slow creep at the edges right up to "rulebook", where it stops on the same frame as the camera
    tl.tween(lit, 0.7, { at: week + 0.3, dur: still - week - 0.3, ease: ease.linear });
    // the home window's single pulse on "rulebook": a flare, a soft bloom swelling and settling (0.8 s), and a
    // dip in the others
    const home = tl.channel('home', 0);
    tl.tween(home, 1, { at: still, dur: 0.3, ease: ease.enter });
    tl.tween(home, 0, { at: still + 0.3, dur: 0.9, ease: ease.move });
    const ring = tl.channel('ring', 0);
    tl.tween(ring, 1, { at: still, dur: 0.8, ease: ease.linear });
    const dip = tl.channel('dip', 0);
    tl.tween(dip, 1, { at: still - 0.05, dur: 0.12, ease: ease.move });
    tl.tween(dip, 0, { at: still + 0.4, dur: 0.25, ease: ease.move });
    tl.hold(0, D);
    // the hand-off: in the last ~1.3 s everything but the home window sinks toward ink, so the last cyan
    // point alive is the window we came from when the lamp change takes the frame (it becomes the lamp)
    const sink = tl.channel('sink', 0);
    tl.tween(sink, 1, { at: D - 1.35, dur: 0.95, ease: ease.move });
    const homeLast = tl.channel('homeLast', 0);
    tl.tween(homeLast, 1, { at: D - 1.1, dur: 0.6, ease: ease.enter });
    return { tl, lit, home, ring, dip, sink, homeLast, cam1: C1, D, still, rise: T.beat('rise'), earth, labelOut: still - 0.55, lineAt: T.line('L0104').start };
  },
  paint(f, s, scene) {
    const t = f.t;
    if (t < T_OCC) {
      // ---------------- MOVE 1: the room, backwards out of the screen (accelerating)
      const u = clamp01(t / T_OCC);
      const e = u * u * (1.6 - 0.6 * u);
      const cam = lerpCam(A0, A1, e);
      f.camera(cam);
      // we exit the screen: the set type still on it (ch01-s02's last state), dimming as we pass the window
      bench(f, { key: 'ch01-s03', cams: [A0, A1], state: { ...BENCH_FINAL, t: 6.9 + t }, glow: 1 - 0.55 * sm(t / T_OCC) });
      occluder(f, t);
      return;
    }
    if (t < T_CLOUD) {
      // ---------------- MOVE 2: the city rising out of the fog, then into the cloud
      const u = clamp01((t - T_OCC) / (T_CLOUD - T_OCC + 0.25));
      const cam = lerpCam(B0, B1, sm(u * 0.85 + 0.15 * u * u));
      f.camera(cam);
      const cams = [B0, B1];
      f.backlight({ sunX: 700, sunY: 560, sunRadius: 760, intensity: 0.7 });
      const city = (id: 'L1' | 'L2' | 'L3' | 'L4', ground: number, height: number, seed: number, lit: number) =>
        f.layer(id, (c, env) => {
          const r = overscan(LAYERS[id], cams, 40);
          f.cached(`ch01-s03/city/${id}/${env.mood.id}/${seed}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
            cc.translate(-r.x, -r.y);
            city2026(cc, { x0: r.x - 60, x1: r.x + r.w + 60, y: ground, height, seed, lit, ground: Math.max(0, r.y + r.h - ground + 20) }, env);
          })(c, r.x, r.y);
        });
      // four tower planes, each separated from the next by its own fog sheet from the first frame, so the
      // climb reads as depth at once (fog sheets tall enough to reach the tops of the near towers)
      city('L1', 560, 420, 11, 0.32);
      f.fog({ yCenter: 420, height: 640, alpha: 0.34, drift: -10 });
      f.fog({ yCenter: 560, height: 260, alpha: 0.26, drift: -6 });
      city('L2', 820, 640, 23, 0.36);
      f.fog({ yCenter: 470, height: 620, alpha: 0.3, drift: -8 });
      f.fog({ yCenter: 640, height: 240, alpha: 0.28, drift: -11 });
      city('L3', 1060, 880, 37, 0.4);
      f.fog({ yCenter: 560, height: 560, alpha: 0.24, drift: -14 });
      f.fog({ yCenter: 700, height: 200, alpha: 0.24, drift: -16 });
      city('L4', 1360, 1180, 53, 0.42);
      f.rim({ x: 0.3, y: -1 });
      // the NEAR band (L5): a few tower crowns close to the lens, ink and blurred, that the rise drops out of
      // frame fast (≈1.5x the action plane's slide) while the hazed far bands barely move
      nearTowers(f);
      // the second, nearer fog the camera climbs out of, then the cloud bank
      const dens = sm((t - 1.3) / (T_CLOUD - 1.3)) * 1.05;
      clouds(f, dens, t);
      // out of the stile: the first frames are still ink
      const ink = 1 - sm((t - T_OCC) / 0.09);
      if (ink > 0) {
        f.c.save();
        f.c.globalAlpha = ink;
        f.c.fillStyle = f.mood.fg;
        f.c.fillRect(-20, -20, 1320, 760);
        f.c.restore();
      }
      typeLayer(f, scene, t);
      return;
    }
    // ---------------- MOVE 3: the night limb
    let cam: Camera3;
    if (t < MOVE3_AT) cam = lerpCam(C0, CM, 1 - Math.pow(1 - clamp01((t - T_CLOUD) / (MOVE3_AT - T_CLOUD)), 2));
    else cam = lerpCam(CM, C1, travel((t - MOVE3_AT) / (scene.still - MOVE3_AT)));
    f.camera(cam);
    nightLimb(f, { key: 'ch01-s03', cams: [C0, CM, C1], layer: LIMB_PLANE, lit: s.get(scene.lit), home: s.get(scene.home), homeOn: 1, ring: s.get(scene.ring), dip: s.get(scene.dip) });
    // a faint haze band lying over the far limb (between the earth and the cirrus): the horizon recedes
    // behind air, so the limb holds three planes (far haze, the lit land, the near wisp)
    {
      const hz = toScreen(LIMB_PLANE, cam, 640, LIMB.cy - LIMB.r);
      f.fog({ yCenter: hz.y + 34, height: 110, alpha: 0.16, drift: -4 });
    }
    // a faint blurred wisp of cloud on the near plane drifting slowly across the lower left corner, so the
    // long hold stays layered theatre
    wisp(f, Math.min(t, scene.still));
    // still-frame depth once the camera settles: a faint twinkling star field in the upper sky (L1, behind the
    // earth) and a thin dark cloud strip on L5 drifting very slowly along the lower edge (both hold on "rulebook")
    holdDepth(f, Math.min(t, scene.still));
    // the cloud thinning off the limb
    const dens = 1 - sm((t - T_CLOUD) / 0.85);
    clouds(f, dens * 1.05, t);
    typeLayer(f, scene, t);
    // the hand-off: the frame sinks to ink around the home window, which stays lit (and brightens a step)
    const sink = s.get(scene.sink);
    if (sink > 0) {
      const c = f.c;
      const H = limbHome();
      const p = toScreen(LAYERS.L2, cam, H.x, H.y);
      c.save();
      c.globalAlpha = 0.9 * sink;
      c.fillStyle = f.mood.fg;
      c.fillRect(-20, -20, 1320, 760);
      c.restore();
      const hl = s.get(scene.homeLast);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const R = 26 + 30 * hl;
      const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
      g.addColorStop(0, withAlpha(mixLab(f.mood.core, '#ffffff', 0.4 * hl), (0.55 + 0.45 * hl) * sink));
      g.addColorStop(0.3, withAlpha(f.mood.halo, (0.18 + 0.2 * hl) * sink));
      g.addColorStop(1, withAlpha(f.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(p.x - R, p.y - R, 2 * R, 2 * R);
      c.restore();
      c.save();
      c.globalAlpha = sink;
      // a near-white core, so it is the last point to survive the lamp change's dimmer
      c.fillStyle = mixLab(mixLab(f.mood.halo, f.mood.core, 0.7 + 0.3 * hl), '#ffffff', 0.55 * hl);
      c.fillRect(p.x - (2.5 + 0.8 * hl) * p.k, p.y - (3.5 + 1 * hl) * p.k, (5 + 1.6 * hl) * p.k, (7 + 2 * hl) * p.k);
      c.restore();
    }
  },
});

/** the near band of towers (L5, ink, blurred by the layer), authored in screen px at MOVE 2's first camera */
const NEAR_TOWERS: [number, number, number][] = [
  // [x0, x1, top] at B0
  [-60, 120, 470],
  [150, 236, 548],
  [1010, 1140, 430],
  [1150, 1214, 506],
  [1226, 1360, 452],
];
function nearTowers(f: Frame) {
  f.layer('L5', (c, env) => {
    const ink = mixLab(env.fill('ink'), env.mood.fg, 0.5);
    for (const [x0, x1, top] of NEAR_TOWERS) {
      const a = toLayer(LAYERS.L5, B0, x0, top), b = toLayer(LAYERS.L5, B0, x1, 1400);
      c.fillStyle = ink;
      c.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
      // a flat crown with a plant room and a mast on the widest
      if (x1 - x0 > 120) {
        const m0 = toLayer(LAYERS.L5, B0, x0 + (x1 - x0) * 0.3, top - 22);
        c.fillRect(m0.x, m0.y, (b.x - a.x) * 0.3, a.y - m0.y + 1);
      }
      c.fillStyle = withAlpha(env.mood.rim, 0.28);
      c.fillRect(a.x, a.y, b.x - a.x, 1.5);
    }
  });
}

/** a faint cloud wisp on the near plane (L5, blurred by the layer), drifting slowly across the lower left:
 *  the cloud texture under a feathered elliptical mask, so it has no edges */
const wispCache = new Map<string, HTMLCanvasElement>();
function wispSprite(f: Frame): HTMLCanvasElement {
  const key = f.mood.id;
  let cv = wispCache.get(key);
  if (cv) return cv;
  const tint = makeTint(f, cloudSheet());
  cv = makeCanvas(640, 260);
  const g = cv.getContext('2d')!;
  g.drawImage(tint, 0, 0, 640, 260);
  g.drawImage(tint, 160, 40, 480, 220);
  g.globalCompositeOperation = 'destination-in';
  g.save();
  g.translate(320, 130);
  g.scale(1, 0.4);
  const r = g.createRadialGradient(0, 0, 40, 0, 0, 320);
  r.addColorStop(0, 'rgba(0,0,0,1)');
  r.addColorStop(0.6, 'rgba(0,0,0,0.55)');
  r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r;
  g.fillRect(-320, -330, 640, 660);
  g.restore();
  wispCache.set(key, cv);
  return cv;
}
function wisp(f: Frame, t: number) {
  const sp = wispSprite(f);
  // a far cirrus veil (L3) lying over the night side between the stars and us, catching the airglow: with the
  // near wisp (L5) and the earth (L2) it gives the slow rise three planes from the first frame out of the cloud
  f.layer('L3', (c) => {
    c.save();
    c.globalAlpha = 0.22 * (1 - 0.35 * sm((t - T_CLOUD) / 3));
    c.drawImage(sp, 260 - 3 * t, 300, 1100, 150);
    c.globalAlpha *= 0.7;
    c.drawImage(sp, -260 - 2 * t, 372, 760, 110);
    c.restore();
  });
  // the near wisp: dense as we leave the cloud bank, settling to a faint drift over the lower left
  const a = 0.5 + 0.35 * (1 - sm((t - T_CLOUD) / 1.4));
  f.layer('L5', (c) => {
    c.save();
    c.globalAlpha = a;
    c.drawImage(sp, -300 + 7 * t, 520, 900, 340);
    c.globalAlpha = a * 0.6;
    c.drawImage(sp, 60 + 4 * t, 610, 600, 220);
    c.restore();
  });
  // a far, faint wisp low on the left (a third moving plane through the hold): drifts right across the lower
  // left during the slow camera, alpha <= 0.22; the caller freezes t on "rulebook" with everything else
  f.layer('L3', (c) => {
    c.save();
    c.globalAlpha = 0.22 * sm((t - T_CLOUD - 0.6) / 1.5);
    c.filter = `blur(${(6 * f.pxScale).toFixed(1)}px)`;
    c.drawImage(sp, -420 + 26 * (t - T_CLOUD), 560, 820, 170);
    c.restore();
  });
}

/** the hold's extra planes: twinkling stars in the upper 45% (L1, per frame, a second seeded field) and a dark
 *  cloud strip lying along the bottom edge on L5 (the cloud texture tinted toward ink), drifting ~5 px/s */
function holdDepth(f: Frame, t: number) {
  const k = sm((t - T_CLOUD - 0.4) / 1.2);
  if (k <= 0) return;
  f.layer('L1', (c, env) => {
    c.save();
    c.globalAlpha = k;
    stars(c, { x: -200, y: -120, w: 1700, h: 444, count: 240, seed: 731, twinkle: 0.85 }, { ...env, t });
    c.restore();
  });
  const dark = makeTint(f, cloudSheet(), mixLab(f.mood.fg, f.mood.ink, 0.5));
  f.layer('L5', (c) => {
    c.save();
    c.globalAlpha = 0.78 * k;
    const x = -380 + 5 * (t - T_CLOUD);
    c.drawImage(dark, x, 664, 1900, 120);
    c.globalAlpha = 0.5 * k;
    c.drawImage(dark, x + 640, 690, 1500, 90);
    c.restore();
  });
}

/** screen-locked type: the date stamp and the hedged count with its source */
function typeLayer(f: Frame, scene: { rise: number; earth: number; labelOut: number }, t: number) {
  const c = f.c;
  const m = f.mood;
  const ls = c as CanvasRenderingContext2D & { letterSpacing: string };
  // date stamp: "2026", typed on (on twos), bottom left, at full rim value on a feathered ink plate
  const dA = sm((t - scene.rise - 0.05) / 0.3) * (1 - sm((t - (scene.earth - 0.5)) / 0.5));
  if (dA > 0) {
    const n = Math.min(4, Math.floor((Math.floor(t * 12) / 12 - scene.rise) * 12));
    c.save();
    c.globalAlpha = dA;
    // a faint rectangle, not an oval smudge: just enough ground over the towers, invisible over the fog
    c.fillStyle = withAlpha(m.ink, 0.28);
    c.fillRect(52, 566, 136, 54);
    c.font = `500 28px ${FONT.mono}`;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillStyle = mixLab(m.rim, m.core, 0.5);
    ls.letterSpacing = '4px';
    c.fillText('2026'.slice(0, Math.max(0, n)), 64, 606);
    c.globalAlpha = dA * 0.6;
    c.fillRect(64, 574, 108 * Math.min(1, (t - scene.rise) / 0.6), 1);
    c.fillRect(64, 570, 1, 8);
    c.restore();
  }
  // the count, hedged, and where it comes from: in the clean sky above the limb
  // in on "seven" (the earth beat), 0.2 s ahead of the word
  const lA = sm((t - (scene.earth - 0.2)) / 0.4) * (1 - sm((t - scene.labelOut) / 0.5));
  if (lA > 0) {
    c.save();
    c.globalAlpha = lA;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    // the count at >= 28 px cap height on a 1080p frame, set high in the clean sky at upper centre-left (~0.15H)
    const COUNT = 'at least 700 million weekly users';
    const f35 = `600 35px ${FONT.sc}`;
    const k35 = capPx1080(c, f35, COUNT) / 35;
    const cSize = Math.max(legibleSize(c, f35, 35, COUNT), Math.ceil((28.5 / Math.max(0.01, k35)) * 10) / 10);
    c.font = `600 ${cSize}px ${FONT.sc}`;
    ls.letterSpacing = '1px';
    const cw = c.measureText(COUNT).width;
    const X0 = 250;
    softPlate(c, X0 + cw / 2, 106, cw + 220, 150, m.ink, 0.55);
    c.fillStyle = mixLab(m.rim, m.core, 0.45);
    c.fillText(COUNT, X0, 110);
    const SRC = 'International AI Safety Report, 2026';
    // the source at >= 24 px cap height at 1080 (a margin over the 22 px floor)
    const fS = `italic 400 31px ${FONT.text}`;
    const kS = capPx1080(c, fS, SRC) / 31;
    const sSize = Math.max(legibleSize(c, fS, 31, SRC), Math.ceil((24.5 / Math.max(0.01, kS)) * 10) / 10);
    c.font = `italic 400 ${sSize}px ${FONT.text}`;
    ls.letterSpacing = '0px';
    c.globalAlpha = lA;
    c.fillStyle = mixLab(m.rim, m.core, 0.12);
    c.fillText(SRC, X0 + 2, 154);
    c.restore();
  }
}
