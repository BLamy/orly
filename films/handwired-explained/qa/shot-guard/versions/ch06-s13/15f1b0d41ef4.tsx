/**
 * ch06-s13 — X-ray desk beat 4 of 5 (Device 3), silent: beneath the loom, inside the translucent HandwiredOS desk, the
 * host clockwork's 300-tooth RATCHET and its release pawl light, with one relay clack, joined to the loom by a single
 * crank. (Adapted from ch05-s07 so the five X-ray beats are one locked-off picture, one more component each.)
 *
 * The same toy theatre and locked-off wide as ch03-s07 and ch05-s07 (sets/ch01-s02-theatre), in low candleAmber and a
 * little more translucent again (paper .76, sheets .10). The components already lit glow faintly inside it, a step
 * down: the source table's 234 pigeonholes, the 2,776 ReGLU ramps and 59 boolean shutters, and now the loom's 130
 * frames with their threads (one per stored weight, copper adding and indigo subtracting; sets/matmulLoom loomGeom
 * over the real export, sets/circuit).
 * 'light' (1.0 s): one relay clack (a single warm kick) and the fourth component lights beneath the loom: the ratchet's
 *   300 teeth (CLOCK.TEETH, sets/hostClockwork), six spokes and hub, the release pawl at its top, and one crank from its
 *   hub to the foot of the loom's first frame. The escapement then ticks three more times, softly, and stops: each tick
 *   turns the crank once and advances the ratchet one tooth (one 4 ms step).
 * No text, no narration. The camera holds; only haze and dust drift. The reel's crossfade carries it out.
 */
import { Timeline } from '../../../core';
import { CAMERA3_HOME, LAYERS, PUPPET_NEAR_BLACK, defineShot, dustMotes, mixLab, withAlpha } from '../../../film';
import type { Frame, LayerSpec, PaintEnv } from '../../../film';
import { handwiredDesk } from '../sets/handwiredDesk';
import { DESK_G, PROSCENIUM, THEATRE, WIN, paperWindow, proscenium, stageFloor, theatreWall, windowThreads, type WinState } from '../sets/ch01-s02-theatre';
import { deskDockGlyphs } from '../sets/ch01-s01-dock';
import { CIRCUIT, OS_COLORS, TOTALS, layerOf } from '../sets/circuit';
import { loomGeom } from '../sets/matmulLoom';
import { CLOCK } from '../sets/hostClockwork';

const ID = 'ch06-s13';
const THREAD_TOP = 112;
/** the X-ray's paper thinness: a step past ch05-s07's .72 */
const TR = 0.76;
/** the hanging sheets, thinner again so the inside reads through them */
const WIN_A = 0.1;
/** the dust's plane: just in front of the hanging windows, behind the proscenium */
const DUST_L: LayerSpec = { id: `${ID}-dust`, z: 970, haze: 0, blur: 0.5 };
/** the inside of the desk: L3's depth without its blur, so the baked lattice composites additively ON the plate
 *  (inside a blurred layer the kit draws cached bitmaps beneath that layer's live drawing) */
const INSIDE_L: LayerSpec = { id: `${ID}-inside`, z: LAYERS.L3.z, haze: LAYERS.L3.haze, blur: 0 };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};

const D = DESK_G.desk;
const NL = CIRCUIT.layers.length;
/** the loom inside the desk: 6-94 % across (the same margins as the table strip), its frames centred a little above
 *  the desk's middle so the tallest frames clear the dock */
const LOOM = { x: D.x + D.w * 0.06, y: D.y + D.h * 0.1, w: D.w * 0.88, h: D.h * 0.7 };
const LG = loomGeom(LOOM);

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    return { tl, light: T.beat('light'), D: T.duration };
  },
  paint(f, _s, sc) {
    const t = f.t;
    f.camera(CAMERA3_HOME);
    // the relay closes: the ratchet catches from its hub outward in a 0.35 s ripple; one warm kick
    const ripple = clamp01((t - (sc.light - 0.04)) / 0.35);
    const kick = t < sc.light ? 0 : smooth((t - sc.light) / 0.05) * Math.exp(-(t - sc.light) * 3.4);
    // the older components (table, gates, loom) settle a step down once the ratchet leads
    const older = 0.78 - 0.24 * smooth((t - sc.light) / 0.9);

    f.backlight({ sunX: 640, intensity: 0.8 });

    // L2: the workshop's window wall far behind the theatre (as ch01-s02, ch03-s07, ch05-s07)
    f.layer('L2', (c, env) => theatreWall(f, c, env));
    f.fog('A');
    f.fog({ yCenter: 380, height: 260, alpha: 0.14, drift: 14 });

    // L3: the stage floor and the desk flat, thin as paper held to the lamp; the inside lit
    f.layer('L3', (c, env) => {
      stageFloor(c, env);
      handwiredDesk(f, c, env, {
        ...THEATRE.desk,
        proscenium: false,
        windows: { monitor: { alpha: 0 }, notes: { alpha: 0 }, photos: { alpha: 0 } },
        translucency: TR,
        lamp: 0.9,
        wire: 0.35,
        xray: {},
        key: ID,
      });
      deskWarmth(c, env, 0.75 + 0.25 * ripple);
      deskDockGlyphs(c, DESK_G.tiles, 0, OS_COLORS.ink, 0.5);
    });
    // the inside, lit through the plate (additive, clipped to the desk)
    f.layer(INSIDE_L, (c, env) => {
      c.save();
      c.beginPath();
      c.rect(D.x, D.y, D.w, D.h);
      c.clip();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = Math.min(1, older * (1 + 0.25 * kick));
      insideFaint(f, c, env);
      // the loom, lit in ch05, now one of the older components
      c.globalAlpha = Math.min(1, older * 0.85 * (1 + 0.2 * kick));
      lattice(f, c, env, 1);
      c.globalCompositeOperation = 'source-over';
      lattice(f, c, env, -1);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 1;
      c.restore();
      loomFrames(c, env, 1, 0, older * 0.8);
      ratchet(c, env, t, sc.light, ripple, kick);
    });
    f.fog({ yCenter: 610, height: 120, alpha: 0.1, drift: 8 });

    // L4: the three windows hung on their threads, thin enough that the inside shows through
    f.layer('L4', (c, env) => {
      const st: Record<'monitor' | 'notes' | 'photos', WinState> = {
        monitor: { alpha: WIN_A, swing: 0.004 * Math.sin(f.tq * 1.3) },
        notes: { alpha: WIN_A, swing: 0.005 * Math.sin(f.tq * 1.1 + 1.2) },
        photos: { alpha: WIN_A, swing: 0.004 * Math.sin(f.tq * 1.2 + 2.1) },
      };
      windowThreads(c, env, WIN.monitor, st.monitor, THREAD_TOP, 0.7);
      windowThreads(c, env, WIN.notes, st.notes, THREAD_TOP, 0.7);
      windowThreads(c, env, WIN.photos, st.photos, THREAD_TOP, 0.7);
      paperWindow(c, env, 'monitor', WIN.monitor, st.monitor, { footer: 1 });
      paperWindow(c, env, 'notes', WIN.notes, st.notes, {});
      paperWindow(c, env, 'photos', WIN.photos, st.photos, { photosLit: 12 });
      throughPaper(c, env, 1, kick * 0.6);
    });
    f.rim({ x: 0, y: -1 });
    f.layer(DUST_L, (c, env) => {
      dustMotes(c, { area: { x: 220, y: 150, w: 840, h: 460 }, count: 24, size: 1.6, brightness: 0.26, drift: { x: 3, y: -1.6 }, salt: 507 }, env);
    });

    // the proscenium: black card and marquee; the title holds (read in ch01-s02), no new label
    f.layer(PROSCENIUM, (c, env) => proscenium(c, env, { title: 'HandwiredOS', titleA: 1 }));

    // L5: the workbench's near edge, dark and soft at the lower left (as ch01-s02 and ch03-s07)
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/bench/${env.mood.id}`, 460, 220, (cc) => {
        cc.fillStyle = PUPPET_NEAR_BLACK;
        cc.beginPath();
        cc.moveTo(0, 70);
        cc.lineTo(330, 92);
        cc.quadraticCurveTo(352, 94, 360, 112);
        cc.lineTo(392, 220);
        cc.lineTo(0, 220);
        cc.closePath();
        cc.fill();
        cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.4);
        cc.lineWidth = 2.5;
        cc.beginPath();
        cc.moveTo(0, 70);
        cc.lineTo(330, 92);
        cc.quadraticCurveTo(352, 94, 360, 112);
        cc.stroke();
      }, { blur: 8 })(c, -120, 560);
    });
  },
});

/** warm amber of a lit X-ray component */
const amber = (env: PaintEnv, k = 0) => mixLab(mixLab('#e3a04e', env.mood.core, 0.22), '#fff1d2', k);
const copperLit = (env: PaintEnv, k = 0) => mixLab(mixLab(OS_COLORS.copper, env.mood.core, 0.5), '#fff1d2', k);

/** the lamp behind the thinned desk: a warm bloom at its centre, darker toward its edges like film on a light box */
function deskWarmth(c: CanvasRenderingContext2D, env: PaintEnv, a: number) {
  c.save();
  c.beginPath();
  c.rect(D.x, D.y, D.w, D.h);
  c.clip();
  // the plate: thinner than ch03's, so the inside is darker than the paper and its lit parts carry
  c.fillStyle = withAlpha(mixLab(env.mood.ink, env.mood.set, 0.4), 0.62);
  c.fillRect(D.x, D.y, D.w, D.h);
  const v = c.createRadialGradient(D.x + D.w / 2, D.y + D.h * 0.45, D.w * 0.16, D.x + D.w / 2, D.y + D.h * 0.45, D.w * 0.66);
  v.addColorStop(0, withAlpha(env.fill('set'), 0));
  v.addColorStop(1, withAlpha(env.fill('set'), 0.4));
  c.fillStyle = v;
  c.fillRect(D.x, D.y, D.w, D.h);
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(D.x + D.w / 2, D.y + D.h * 0.45, 0, D.x + D.w / 2, D.y + D.h * 0.45, D.w * 0.6);
  g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.4), 0.12 * a));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(D.x, D.y, D.w, D.h);
  c.restore();
}

/**
 * The components lit in earlier chapters, faint, in the shared painter's geometry (sets/handwiredDesk xrayLayer):
 * the source table's 234 pigeonholes (three rows of 78 across 6-94 % at half the desk's height) and the gates, 2,776
 * ReGLU ramps (104 to a row from 18 % down) and 59 boolean shutters under them. Baked once.
 */
function insideFaint(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv) {
  f.cached(`${ID}/inside/${env.mood.id}`, D.w, D.h, (cc) => {
    cc.translate(-D.x, -D.y);
    cc.globalCompositeOperation = 'lighter';
    // the source table
    const n = TOTALS.sourceCells;
    const per = Math.ceil(n / 3);
    const tx0 = D.x + D.w * 0.06, tw = D.w * 0.88;
    const cw = tw / per;
    const ty0 = D.y + D.h * 0.5;
    cc.fillStyle = withAlpha(amber(env), 0.42);
    for (let i = 0; i < n; i++) {
      const col = Math.floor(i / 3), row = i % 3;
      cc.fillRect(tx0 + col * cw + cw * 0.12, ty0 + row * cw * 1.3 + cw * 0.12, cw * 0.62, cw * 0.86);
    }
    // the gates: ramps, then the boolean shutters
    const N = TOTALS.reglu;
    const cols = 104;
    const gw = (D.w * 0.86) / cols;
    const gx0 = D.x + D.w * 0.07, gy0 = D.y + D.h * 0.18;
    cc.strokeStyle = withAlpha(copperLit(env), 0.3);
    cc.lineWidth = Math.max(0.5, gw * 0.16);
    cc.beginPath();
    for (let i = 0; i < N; i++) {
      const cx = gx0 + (i % cols) * gw, cy = gy0 + Math.floor(i / cols) * gw * 1.15;
      cc.moveTo(cx, cy + gw * 0.7);
      cc.lineTo(cx + gw * 0.3, cy + gw * 0.7);
      cc.lineTo(cx + gw * 0.62, cy + gw * 0.1);
      cc.lineTo(cx + gw * 0.85, cy + gw * 0.1);
    }
    cc.stroke();
    const nb = TOTALS.boolean;
    const by = gy0 + Math.ceil(N / cols) * gw * 1.15 + gw;
    cc.fillStyle = withAlpha(amber(env), 0.32);
    for (let i = 0; i < nb; i++) {
      const cx = gx0 + (i % 59) * gw * 1.6 * (104 / 96);
      cc.fillRect(cx + gw * 0.2, by + gw * 0.2, gw * 0.7, gw * 0.7 * ((i * 5) % 2 ? 1 : 0.35));
    }
  })(c, D.x, D.y);
}

/**
 * The loom's threads inside the desk, one per stored weight (9,909, CIRCUIT.arcs, in sets/matmulLoom's loomGeom
 * geometry): copper for adding weights (sign 1) and indigo for subtracting ones (sign -1), each mixed only a quarter
 * toward the room's light so the two-colour binding of the wallpaper (ch05-s01) survives the amber X-ray. One bake per
 * colour, stroked source-over so dense bands converge to their own colour instead of burning to white; the caller
 * lays copper on as light and indigo on as colour, both at the same alpha. Long threads fade with their length, and
 * the dense fan out of the source table (the first column) is held to about half, so the frames are the first read.
 */
function lattice(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, sign: 1 | -1) {
  const pad = 30;
  f.cached(`${ID}/lattice${sign}/${env.mood.id}`, LOOM.w + 2 * pad, LOOM.h + 2 * pad, (cc) => {
    cc.translate(-LOOM.x + pad, -LOOM.y + pad);
    const col = sign > 0 ? mixLab(OS_COLORS.copper, env.mood.core, 0.25) : mixLab(OS_COLORS.indigo, env.mood.core, 0.25);
    cc.lineWidth = 0.9;
    const span = LOOM.w * 0.2;
    const A = CIRCUIT.arcs;
    for (let i = 0; i < A.length; i++) {
      const a = A[i];
      if (a[2] !== sign) continue;
      const p0 = LG.valuePt(a[0]);
      const p1 = LG.valuePt(a[1]);
      const len = Math.abs(p1.x - p0.x);
      const fan = layerOf(a[0]) < 0 ? 0.5 : 1;
      const al = 0.5 * fan / (1 + len / span);
      if (al < 0.008) continue;
      cc.strokeStyle = withAlpha(col, al);
      cc.beginPath();
      cc.moveTo(p0.x, p0.y);
      const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2 + Math.min(18, len * 0.04);
      cc.quadraticCurveTo(mx, my, p1.x, p1.y);
      cc.stroke();
    }
  })(c, LOOM.x - pad, LOOM.y - pad);
}

/**
 * The loom's 130 frames inside the desk (loomGeom: each as tall as its layer's operation count, log-scaled): thin
 * lit uprights with a head and a foot rail, catching left to right as the relay closes (ripple 0..1), the frame the
 * ripple is passing a little hotter. Live (130 small strokes).
 */
function loomFrames(c: CanvasRenderingContext2D, env: PaintEnv, ripple: number, kick: number, scale = 1) {
  if (ripple <= 0) return;
  const pitch = LOOM.w / (NL + 1);
  const fw = Math.max(1, pitch * 0.2);
  const front = ripple * (NL + 2) - 1;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let l = -1; l < NL; l++) {
    const on = clamp01(front - l);
    if (on <= 0) break;
    const hot = Math.max(0, 1 - Math.abs(front - l - 0.5) / 6) * (ripple < 1 ? 1 : 0);
    const x = LG.frameX(l), h = LG.frameH(l);
    const top = LG.cy - h / 2 - 3, bot = LG.cy + h / 2 + 3;
    // after the ripple the frames hold well above the threads (the first read), the passing frame hotter still
    const a = on * Math.min(1, 0.6 + 0.35 * hot + 0.25 * kick) * scale;
    // one thin upright per frame, its head and foot capped with a short bright rail
    c.fillStyle = withAlpha(copperLit(env, 0.3 + 0.3 * hot + 0.3 * kick), a);
    c.fillRect(x - fw / 2, top, fw, bot - top);
    c.fillStyle = withAlpha(amber(env, 0.3 + 0.3 * kick), Math.min(1, a * 1.6));
    c.fillRect(x - pitch * 0.3, top - 0.8, pitch * 0.6, 1.3);
    c.fillRect(x - pitch * 0.3, bot - 0.5, pitch * 0.6, 1.3);
  }
  c.restore();
}

/** the loom's light seen THROUGH the translucent windows (L4, additive, clipped to the sheets) */
function throughPaper(c: CanvasRenderingContext2D, env: PaintEnv, ripple: number, kick: number) {
  if (ripple <= 0) return;
  c.save();
  c.beginPath();
  for (const id of ['monitor', 'notes', 'photos'] as const) {
    const r = WIN[id];
    c.rect(r.x, r.y, r.w, r.h);
  }
  c.clip();
  c.globalCompositeOperation = 'lighter';
  const xe = LOOM.x + LOOM.w * Math.min(1, ripple * 1.02);
  const g = c.createLinearGradient(0, LOOM.y, 0, LOOM.y + LOOM.h);
  g.addColorStop(0, withAlpha(env.mood.halo, 0));
  g.addColorStop(0.5, withAlpha(copperLit(env, 0.2), 0.07 + 0.08 * kick));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(LOOM.x, LOOM.y, xe - LOOM.x, LOOM.h);
  c.restore();
}

/** the ratchet beneath the loom, inside the desk (rest px), and the one crank from its hub to the loom's first frame */
const RAT = { x: D.x + D.w * 0.16, y: D.y + D.h * 0.865, r: D.h * 0.105 };
const TICKS_AFTER = 3;
const TICK_GAP = 0.62;
/**
 * The host clockwork's ratchet as X-ray line light: CLOCK.TEETH (300) fine teeth on the rim, six spokes and the hub,
 * the release pawl resting on the teeth at the top, and the crank: an arm on the hub and one rod up to the foot of the
 * loom's first frame (the source table). It catches hub-first (ripple), the relay's kick warming it; then three soft
 * ticks, each a crank revolution and one tooth of the ratchet, and it stops.
 */
function ratchet(c: CanvasRenderingContext2D, env: PaintEnv, t: number, light: number, ripple: number, kick: number) {
  if (ripple <= 0) return;
  const { x, y, r } = RAT;
  // three soft ticks after the light: a crank turn each, and one tooth each
  let rev = 0, teeth = 0;
  for (let k = 1; k <= TICKS_AFTER; k++) {
    const tk = light + k * TICK_GAP;
    const u = clamp01((t - tk) / 0.42);
    rev += smooth(u);
    teeth += clamp01((t - tk) / 0.06);
  }
  const tickPulse = Array.from({ length: TICKS_AFTER }, (_, k) => {
    const tk = light + (k + 1) * TICK_GAP;
    return t < tk ? 0 : Math.exp(-(t - tk) * 7);
  }).reduce((a, b) => Math.max(a, b), 0);
  const rot = (teeth / CLOCK.TEETH) * Math.PI * 2;
  const hot = Math.min(1, 0.3 * kick + 0.12 * tickPulse);
  const lineCol = withAlpha(amber(env, 0.35 + hot), Math.min(1, 0.82 + 0.18 * kick));
  const ringReach = smooth(ripple * 1.3);
  c.save();
  c.globalCompositeOperation = 'lighter';
  // a soft glow behind it (the component is lit from inside)
  const g = c.createRadialGradient(x, y, r * 0.2, x, y, r * 1.8);
  g.addColorStop(0, withAlpha(amber(env, 0.2), (0.16 + 0.12 * kick) * ripple));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - r * 1.8, y - r * 1.8, r * 3.6, r * 3.6);
  c.translate(x, y);
  c.save();
  c.rotate(rot);
  // hub and spokes (first), then the rim and its 300 teeth (as the ripple reaches them)
  c.strokeStyle = lineCol;
  c.lineWidth = 1.3;
  c.beginPath();
  c.arc(0, 0, r * 0.18, 0, Math.PI * 2);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.26;
    c.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
    c.lineTo(Math.cos(a) * r * 0.84 * ringReach, Math.sin(a) * r * 0.84 * ringReach);
  }
  c.stroke();
  if (ripple > 0.45) {
    const ra = smooth((ripple - 0.45) / 0.55);
    c.globalAlpha = ra;
    c.beginPath();
    c.arc(0, 0, r * 0.86, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 0.7;
    c.beginPath();
    for (let i = 0; i < CLOCK.TEETH; i++) {
      const a = (i / CLOCK.TEETH) * Math.PI * 2;
      c.moveTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9);
      c.lineTo(Math.cos(a + 0.012) * r, Math.sin(a + 0.012) * r);
    }
    c.stroke();
    c.globalAlpha = 1;
  }
  c.restore();
  // the release pawl, resting on the teeth at the top (fixed; it does not turn with the wheel)
  if (ripple > 0.6) {
    c.globalAlpha = smooth((ripple - 0.6) / 0.4);
    c.strokeStyle = lineCol;
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(r * 0.62, -r * 1.12);
    c.lineTo(r * 0.08, -r * 0.985);
    c.lineTo(r * 0.16, -r * 1.07);
    c.lineTo(r * 0.68, -r * 1.2);
    c.closePath();
    c.stroke();
    c.beginPath();
    c.arc(r * 0.66, -r * 1.16, r * 0.06, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 1;
  }
  // the crank: an arm on the hub (one revolution per tick) and one rod to the foot of the loom's first frame
  const ca = -Math.PI / 2 + rev * Math.PI * 2;
  const pin = { x: Math.cos(ca) * r * 0.45, y: Math.sin(ca) * r * 0.45 };
  const fx = LG.frameX(-1) - x, fy = LG.cy + LG.frameH(-1) / 2 + 3 - y;
  c.globalAlpha = smooth((ripple - 0.3) / 0.7);
  c.strokeStyle = withAlpha(copperLit(env, 0.3 + hot), 0.9);
  c.lineWidth = 1.8;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(pin.x, pin.y);
  c.lineTo(fx, fy);
  c.stroke();
  c.fillStyle = withAlpha(amber(env, 0.5 + hot), 0.95);
  c.beginPath();
  c.arc(pin.x, pin.y, 2.4, 0, Math.PI * 2);
  c.arc(fx, fy, 2.4, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
