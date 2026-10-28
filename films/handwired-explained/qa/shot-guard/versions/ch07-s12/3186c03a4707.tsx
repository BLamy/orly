/**
 * ch07-s12 — X-ray desk beat 5 of 5 (Device 3), silent: inside the translucent HandwiredOS desk, every component lit so
 * far glows faintly, and the fifth is placed at its centre DARK: a single ReGLU valve, nothing trained (OS01, PJ20).
 *
 * The same toy theatre and locked-off wide as ch03-s07, ch04-s16, ch05-s07 and ch06-s13 (sets/ch01-s02-theatre), now in
 * duskRose and a step more translucent again (paper .8, sheets .08). Inside it, faint: the source table's 234
 * pigeonholes, the 2,776 ReGLU ramps and 59 boolean shutters, the loom's 130 frames with their threads (one per stored
 * weight, copper adding and indigo subtracting), and the host clockwork's 300-tooth ratchet with its crank to the loom.
 *   'valve' (0.6 s)  one relay clack (a single cool kick, no warmth): the fifth component appears at the desk's centre,
 *                    the same valve as this chapter's plates (ch07-s02) drawn DARK: black ink, no rim light, against a
 *                    soft lit pane so its silhouette reads. Its backward channel is unlit.
 *   0.9-2.0          a faint backward glow begins to gather at the valve's tray (right to left, toward the gate)...
 *   'none' (2.0 s)   ...and goes out. Nothing flows back.
 *   'still' (3.0 s)  the camera holds; nothing in the desk moves except the haze. No text, no narration.
 * The reel's fade to black (ch08-s01 'fadeBlack') carries it out.
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

const ID = 'ch07-s12';
const THREAD_TOP = 112;
/** the X-ray's paper thinness: a step past ch06-s13's .76 */
const TR = 0.8;
/** the hanging sheets, thinner again */
const WIN_A = 0.08;
/** how bright the four older components sit: faint, a step under ch06-s13's settled level */
const OLDER = 0.36;
const DUST_L: LayerSpec = { id: `${ID}-dust`, z: 970, haze: 0, blur: 0.5 };
/** the inside of the desk: L3's depth without its blur (baked lattice composites additively on the plate) */
const INSIDE_L: LayerSpec = { id: `${ID}-inside`, z: LAYERS.L3.z, haze: LAYERS.L3.haze, blur: 0 };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};

const D = DESK_G.desk;
const NL = CIRCUIT.layers.length;
const LOOM = { x: D.x + D.w * 0.06, y: D.y + D.h * 0.1, w: D.w * 0.88, h: D.h * 0.7 };
const LG = loomGeom(LOOM);
/** the ratchet beneath the loom (as ch06-s13) */
const RAT = { x: D.x + D.w * 0.5, y: D.y + D.h * 0.76, r: D.h * 0.2 };
/** the dark valve at the desk's centre (its silhouette box is 920 × 420 at s = 1) */
const VALVE = { cx: D.x + D.w * 0.5, cy: D.y + D.h * 0.42, s: 0.3 };

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    return { tl, valve: T.beat('valve', 0.6), none: T.beat('none', 2), still: T.beat('still', 3), D: T.duration };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const tq = f.tq;
    f.camera(CAMERA3_HOME);
    // the relay closes: one cool kick (no warmth: nothing is lit by this component)
    const on = tq >= sc.valve ? 1 : 0;
    const kick = t < sc.valve ? 0 : smooth((t - sc.valve) / 0.04) * Math.exp(-(t - sc.valve) * 5);
    // the backward glow: gathers at the tray from just after the clack, then goes out on 'none'
    const gather = smooth((t - (sc.valve + 0.3)) / (sc.none - sc.valve - 0.3)) * 0.85;
    const out = t < sc.none ? 1 : Math.exp(-(t - sc.none) * 14) * (1 + 0.25 * Math.sin((t - sc.none) * 60));
    const back = Math.max(0, gather * out);

    f.backlight({ sunX: 640, intensity: 0.78 });
    f.layer('L2', (c, env) => theatreWall(f, c, env));
    f.fog('A');
    f.fog({ yCenter: 380, height: 260, alpha: 0.14, drift: 14 });

    f.layer('L3', (c, env) => {
      stageFloor(c, env);
      handwiredDesk(f, c, env, {
        ...THEATRE.desk,
        proscenium: false,
        windows: { monitor: { alpha: 0 }, notes: { alpha: 0 }, photos: { alpha: 0 } },
        translucency: TR,
        lamp: 0.88,
        wire: 0.3,
        xray: {},
        key: ID,
      });
      deskWarmth(c, env, 0.8);
      deskDockGlyphs(c, DESK_G.tiles, 0, OS_COLORS.ink, 0.5);
    });
    f.layer(INSIDE_L, (c, env) => {
      c.save();
      c.beginPath();
      c.rect(D.x, D.y, D.w, D.h);
      c.clip();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = OLDER * (1 - 0.12 * kick);
      insideFaint(f, c, env);
      c.globalAlpha = OLDER * 0.55;
      lattice(f, c, env, 1);
      c.globalCompositeOperation = 'source-over';
      lattice(f, c, env, -1);
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 1;
      loomFrames(c, env, OLDER * 0.5);
      ratchetFaint(f, c, env, OLDER * 1.15);
      c.restore();
      if (on) darkValve(c, env, t - sc.valve, back);
    });
    f.fog({ yCenter: 610, height: 120, alpha: 0.1, drift: 8 });

    f.layer('L4', (c, env) => {
      const st: Record<'monitor' | 'notes' | 'photos', WinState> = {
        monitor: { alpha: WIN_A, swing: 0.004 * Math.sin(f.tq * 1.3) },
        notes: { alpha: WIN_A, swing: 0.005 * Math.sin(f.tq * 1.1 + 1.2) },
        photos: { alpha: WIN_A, swing: 0.004 * Math.sin(f.tq * 1.2 + 2.1) },
      };
      windowThreads(c, env, WIN.monitor, st.monitor, THREAD_TOP, 0.65);
      windowThreads(c, env, WIN.notes, st.notes, THREAD_TOP, 0.65);
      windowThreads(c, env, WIN.photos, st.photos, THREAD_TOP, 0.65);
      paperWindow(c, env, 'monitor', WIN.monitor, st.monitor, { footer: 1 });
      paperWindow(c, env, 'notes', WIN.notes, st.notes, {});
      paperWindow(c, env, 'photos', WIN.photos, st.photos, { photosLit: 12 });
    });
    f.rim({ x: 0, y: -1 });
    f.layer(DUST_L, (c, env) => {
      dustMotes(c, { area: { x: 220, y: 150, w: 840, h: 460 }, count: 24, size: 1.6, brightness: 0.24, drift: { x: 3, y: -1.6 }, salt: 712 }, env);
    });
    f.layer(PROSCENIUM, (c, env) => proscenium(c, env, { title: 'HandwiredOS', titleA: 1 }));
    // L5: the workbench's near edge, dark and soft at the lower left (as ch06-s13)
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

/** the X-ray's lit-component colour (the older components' amber, a touch rosier in duskRose) */
const amber = (env: PaintEnv, k = 0) => mixLab(mixLab('#e3a04e', env.mood.core, 0.22), '#fff1d2', k);
const copperLit = (env: PaintEnv, k = 0) => mixLab(mixLab(OS_COLORS.copper, env.mood.core, 0.5), '#fff1d2', k);

/** the lamp behind the thinned desk: a warm bloom at its centre, darker toward its edges like film on a light box */
function deskWarmth(c: CanvasRenderingContext2D, env: PaintEnv, a: number) {
  c.save();
  c.beginPath();
  c.rect(D.x, D.y, D.w, D.h);
  c.clip();
  c.fillStyle = withAlpha(mixLab(env.mood.ink, env.mood.set, 0.4), 0.64);
  c.fillRect(D.x, D.y, D.w, D.h);
  const v = c.createRadialGradient(D.x + D.w / 2, D.y + D.h * 0.45, D.w * 0.16, D.x + D.w / 2, D.y + D.h * 0.45, D.w * 0.66);
  v.addColorStop(0, withAlpha(env.fill('set'), 0));
  v.addColorStop(1, withAlpha(env.fill('set'), 0.42));
  c.fillStyle = v;
  c.fillRect(D.x, D.y, D.w, D.h);
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(D.x + D.w / 2, D.y + D.h * 0.45, 0, D.x + D.w / 2, D.y + D.h * 0.45, D.w * 0.6);
  g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.4), 0.1 * a));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(D.x, D.y, D.w, D.h);
  c.restore();
}

/** the source table's 234 pigeonholes and the gates (2,776 ramps, 59 shutters), faint; baked once (as ch06-s13) */
function insideFaint(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv) {
  f.cached(`${ID}/inside/${env.mood.id}`, D.w, D.h, (cc) => {
    cc.translate(-D.x, -D.y);
    cc.globalCompositeOperation = 'lighter';
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

/** the loom's threads, one per stored weight (CIRCUIT.arcs), copper adding and indigo subtracting; baked per colour */
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
      const al = (0.5 * fan) / (1 + len / span);
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

/** the loom's 130 frames (each as tall as its layer's operation count), faint uprights with head and foot rails */
function loomFrames(c: CanvasRenderingContext2D, env: PaintEnv, a: number) {
  const pitch = LOOM.w / (NL + 1);
  const fw = Math.max(1, pitch * 0.2);
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let l = -1; l < NL; l++) {
    const x = LG.frameX(l), h = LG.frameH(l);
    const top = LG.cy - h / 2 - 3, bot = LG.cy + h / 2 + 3;
    c.fillStyle = withAlpha(copperLit(env, 0.3), a);
    c.fillRect(x - fw / 2, top, fw, bot - top);
    c.fillStyle = withAlpha(amber(env, 0.3), Math.min(1, a * 1.6));
    c.fillRect(x - pitch * 0.3, top - 0.8, pitch * 0.6, 1.3);
    c.fillRect(x - pitch * 0.3, bot - 0.5, pitch * 0.6, 1.3);
  }
  c.restore();
}

/**
 * The host clockwork's ratchet as it was left at the end of ch06-s13 (three teeth on, the crank back at the top):
 * CLOCK.TEETH teeth as a serrated band, six spokes and the hub, the release pawl, the crank to the loom's first frame.
 * Static and faint now; baked once.
 */
function ratchetFaint(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, a: number) {
  const { x, y, r } = RAT;
  const fx = LG.frameX(-1), fy = LG.cy + LG.frameH(-1) / 2 + 3;
  const x0 = Math.min(x - r * 1.3, fx - 10), y0 = Math.min(y - r * 1.35, fy - 10);
  const w = x + r * 1.3 - x0, h = y + r * 1.1 - y0;
  c.save();
  c.globalAlpha = Math.min(1, a);
  c.globalCompositeOperation = 'lighter';
  f.cached(`${ID}/ratchet/${env.mood.id}`, w, h, (cc) => {
    cc.translate(-x0, -y0);
    const lineCol = withAlpha(amber(env, 0.35), 0.85);
    cc.translate(x, y);
    cc.save();
    cc.rotate((3 / CLOCK.TEETH) * Math.PI * 2);
    cc.strokeStyle = lineCol;
    cc.lineWidth = 2;
    cc.beginPath();
    cc.arc(0, 0, r * 0.16, 0, Math.PI * 2);
    cc.moveTo(r * 0.07, 0);
    cc.arc(0, 0, r * 0.07, 0, Math.PI * 2);
    for (let k = 0; k < 6; k++) {
      const an = (k / 6) * Math.PI * 2 + 0.26;
      cc.moveTo(Math.cos(an) * r * 0.17, Math.sin(an) * r * 0.17);
      cc.lineTo(Math.cos(an) * r * 0.78, Math.sin(an) * r * 0.78);
    }
    cc.stroke();
    cc.beginPath();
    cc.arc(0, 0, r * 0.8, 0, Math.PI * 2);
    cc.stroke();
    const r0 = r - 3.2, r1 = r;
    cc.fillStyle = withAlpha(amber(env, 0.35), 0.9);
    cc.beginPath();
    for (let i = 0; i < CLOCK.TEETH; i++) {
      const a0 = (i / CLOCK.TEETH) * Math.PI * 2;
      const a1 = ((i + 1) / CLOCK.TEETH) * Math.PI * 2;
      if (i === 0) cc.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0);
      cc.lineTo(Math.cos(a0) * r1, Math.sin(a0) * r1);
      cc.lineTo(Math.cos(a1) * r0, Math.sin(a1) * r0);
    }
    cc.closePath();
    cc.moveTo(r0 - 1.6, 0);
    cc.arc(0, 0, r0 - 1.6, 0, Math.PI * 2, true);
    cc.fill('evenodd');
    cc.restore();
    // the release pawl
    const pv = { x: r * 0.62, y: -r * 1.2 };
    const pawl = new Path2D();
    pawl.moveTo(pv.x + r * 0.07, pv.y - r * 0.05);
    pawl.quadraticCurveTo(r * 0.3, -r * 1.24, r * 0.06, -r * 1.06);
    pawl.lineTo(-r * 0.02, -r * 0.985);
    pawl.lineTo(r * 0.1, -r * 1.0);
    pawl.quadraticCurveTo(r * 0.34, -r * 1.12, pv.x - r * 0.02, pv.y + r * 0.07);
    pawl.closePath();
    cc.fillStyle = withAlpha(amber(env, 0.2), 0.42);
    cc.fill(pawl);
    cc.strokeStyle = lineCol;
    cc.lineWidth = 2;
    cc.stroke(pawl);
    cc.beginPath();
    cc.arc(pv.x, pv.y, r * 0.055, 0, Math.PI * 2);
    cc.stroke();
    // the crank (back at the top after its three revolutions) and its rod to the loom's first frame
    const pin = { x: 0, y: -r * 0.45 };
    cc.strokeStyle = withAlpha(copperLit(env, 0.3), 0.95);
    cc.lineWidth = 2.5;
    cc.lineCap = 'round';
    cc.beginPath();
    cc.moveTo(0, 0);
    cc.lineTo(pin.x, pin.y);
    cc.lineTo(fx - x, fy - y);
    cc.stroke();
    cc.fillStyle = withAlpha(amber(env, 0.5), 0.95);
    cc.beginPath();
    cc.arc(pin.x, pin.y, 3.6, 0, Math.PI * 2);
    cc.arc(fx - x, fy - y, 3.6, 0, Math.PI * 2);
    cc.fill();
  })(c, x0, y0);
  c.restore();
}

/**
 * ch07-s02's valve as a flat silhouette (the geometry sets/ch07-s01-gallery uses for the stage's valves): inlet pipe,
 * trough with the collar, the sluice gate standing above it, the hinge-shaped cam and rod, three dials, the tray.
 * Local box x 160..1080, y 140..560.
 */
function valvePath(): Path2D {
  const p = new Path2D();
  p.rect(160, 548, 920, 12);
  p.rect(168, 296, 70, 22);
  p.rect(236, 248, 754, 18);
  p.rect(236, 312, 754, 22);
  p.rect(236, 248, 12, 86);
  p.rect(978, 248, 12, 86);
  p.rect(282, 232, 30, 116);
  p.rect(626, 150, 28, 186);
  p.rect(610, 140, 60, 14);
  p.rect(674, 170, 8, 300);
  p.rect(636, 334, 8, 100);
  p.moveTo(520, 452);
  p.lineTo(640, 452);
  p.lineTo(700, 392);
  p.lineTo(740, 392);
  p.lineTo(740, 470);
  p.lineTo(520, 470);
  p.closePath();
  p.rect(1012, 340, 8, 104);
  p.rect(1072, 340, 8, 104);
  p.rect(1012, 436, 68, 10);
  p.rect(1040, 446, 12, 104);
  for (const dx of [296, 528, 752]) {
    p.moveTo(dx + 28, 510);
    p.arc(dx, 510, 28, 0, Math.PI * 2);
    p.rect(dx - 4, 536, 8, 16);
  }
  return p;
}
const VALVE_PATH = valvePath();

/**
 * The fifth component: the valve, DARK. A soft lit pane behind it (the desk's light, not its own) so the black
 * silhouette reads; black ink, no rim; it settles a hair on the clack (on twos). `back` 0..1: the faint backward glow
 * gathering at the tray, from the outlet back toward the gate, that goes out on 'none'.
 */
function darkValve(c: CanvasRenderingContext2D, env: PaintEnv, since: number, back: number) {
  const { cx, cy, s } = VALVE;
  const settle = since < 0.25 ? Math.round(Math.sin(Math.floor(since * 12) * 1.9) * 1.5) * (1 - since / 0.25) : 0;
  const w = 920 * s;
  c.save();
  // the lit pane behind (clipped to the desk): a rosy-grey wash, so the silhouette is the darkest thing inside the desk
  c.beginPath();
  c.rect(D.x, D.y, D.w, D.h);
  c.clip();
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, w * 0.78);
  g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.25), 0.42));
  g.addColorStop(0.6, withAlpha(mixLab(env.mood.halo, env.mood.set, 0.4), 0.18));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(cx - w, cy - w, 2 * w, 2 * w);
  // the valve, black
  c.translate(cx, cy + settle);
  c.scale(s, s);
  c.translate(-620, -350);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fill(VALVE_PATH);
  // the backward channel: a faint glow that begins at the tray and creeps back along the trough toward the gate
  if (back > 0.003) {
    c.globalCompositeOperation = 'lighter';
    const reach = 1040 - (1040 - 700) * Math.min(1, back * 1.1);
    const hot = mixLab(env.mood.core, '#ffe2c4', 0.3);
    const gl = c.createRadialGradient(1046, 392, 0, 1046, 392, 120);
    gl.addColorStop(0, withAlpha(hot, 0.5 * back));
    gl.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = gl;
    c.fillRect(926, 272, 240, 240);
    const tr = c.createLinearGradient(1000, 0, reach, 0);
    tr.addColorStop(0, withAlpha(hot, 0.42 * back));
    tr.addColorStop(1, withAlpha(hot, 0));
    c.fillStyle = tr;
    c.fillRect(reach, 266, 1000 - reach, 46);
  }
  c.restore();
}
