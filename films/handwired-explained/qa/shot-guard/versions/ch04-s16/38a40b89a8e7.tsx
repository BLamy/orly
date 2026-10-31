/**
 * ch04-s16 — X-ray desk beat 2 of 5 (Device 3), silent: the gates light inside the HandwiredOS desk (candleAmber;
 * crossfade in from the parchment plate; 5.3 s).
 *
 * The same toy theatre as ch03-s07 (sets/ch01-s02-theatre: the workshop's window wall at L2, the desk flat at L3, the
 * three paper windows on threads at L4, the black card proscenium and its marquee), now in low amber light and a
 * little MORE translucent than in ch03 (sets/handwiredDesk: ch04 .3 → ~.55 as it thins), the 234-cell source table
 * still faintly lit inside. The camera holds; only the haze and the dust drift.
 *   'gates' (0.8 s): throughout the desk, behind the windows and the dock, the real 2,776 ReGLU gates light in copper,
 *     one tiny ramp-and-shutter glyph each (TOTALS.reglu from the circuit export), packed in layer order (the export's
 *     per-layer counts, column by column), so the light sweeps left to right in dependency order; among them the 59
 *     boolean atoms glint as small detent wheels in their own layers' columns (TOTALS.boolean, layers[i].boolean).
 *     The marquee label sets in: '2,776 ReGLU gates · 59 boolean atoms' (script onScreenText; the only new text).
 *   'clack' (3.0 s): one relay clack: every gate gives one small warm kick, then holds lit. No narration.
 * One accent: the copper of the gates (the film's adding colour), motivated by the light inside the plate.
 */
import { Timeline } from '../../../core';
import { CAMERA3_HOME, PUPPET_NEAR_BLACK, cam3Interp, defineShot, dustMotes, mixLab, withAlpha } from '../../../film';
import type { Camera3, LayerSpec, PaintEnv } from '../../../film';
import { handwiredDesk } from '../sets/handwiredDesk';
import { DESK_G, PROSCENIUM, THEATRE, WIN, paperWindow, proscenium, stageFloor, theatreWall, windowThreads, type WinState } from '../sets/ch01-s02-theatre';
import { deskDockGlyphs } from '../sets/ch01-s01-dock';
import { CIRCUIT, OS_COLORS, TOTALS } from '../sets/circuit';
import { copperOf } from '../sets/narratorHands';

const ID = 'ch04-s16';
const THREAD_TOP = 112;
/** ch04's X-ray thinness (.3 per sets/handwiredDesk), thinning further as the gates light */
const TR0 = 0.3;
const TR1 = 0.7;
const WIN_A = 0.42;
const WIN_A_XRAY = 0.17;
const DUST_L: LayerSpec = { id: `${ID}-dust`, z: 970, haze: 0, blur: 0.5 };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};

// ---------------------------------------------------------------- the gate field (from the real circuit export)
const D = DESK_G.desk;
const NG = TOTALS.reglu; // 2,776
const NB = TOTALS.boolean; // 59
const FX0 = D.x + D.w * 0.05, FW = D.w * 0.9;
const FY0 = D.y + D.h * 0.1, FH = D.h * 0.8;
/** a square cell size that packs all the gates into the field, and the rows per column */
const CELL = Math.sqrt((FW * FH) / NG) * 0.98;
const ROWS = Math.floor(FH / CELL);
const COLS = Math.ceil(NG / ROWS);
const CW = FW / COLS;
/** every gate in layer order (column-major), with its layer; the detents placed in their own layers' columns */
const GATES: { x: number; y: number; layer: number }[] = [];
const DETENTS: { x: number; y: number; layer: number }[] = [];
(() => {
  let i = 0;
  const firstOfLayer: number[] = [];
  CIRCUIT.layers.forEach((l, li) => {
    firstOfLayer[li] = i;
    for (let k = 0; k < l.reglu; k++, i++) {
      const col = Math.floor(i / ROWS), row = i % ROWS;
      GATES.push({ x: FX0 + col * CW, y: FY0 + row * CELL, layer: li });
    }
  });
  // a detent wheel for each boolean atom, scattered (seeded) down its layer's column(s)
  CIRCUIT.layers.forEach((l, li) => {
    for (let k = 0; k < l.boolean; k++) {
      const at = Math.min(NG - 1, firstOfLayer[li] + Math.floor((k + 0.5) * Math.max(1, CIRCUIT.layers[li].reglu) / Math.max(1, l.boolean)));
      const col = Math.floor(at / ROWS);
      const h = Math.sin((li * 31 + k * 17) * 12.9898) * 43758.5453;
      const fr = h - Math.floor(h);
      DETENTS.push({ x: FX0 + col * CW + CW * 0.5, y: FY0 + fr * (FH - CELL), layer: li });
    }
  });
})();
const NL = CIRCUIT.layers.length;

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const cam = tl.channel<Camera3>('cam', CAMERA3_HOME, cam3Interp);
    tl.hold(0, T.duration);
    return { tl, cam, gates: T.beat('gates'), clack: T.beat('clack'), D: T.duration };
  },
  paint(f, s, sc) {
    const t = f.t;
    f.camera(s.get(sc.cam));
    // the lighting sweep in layer order: from 'gates' to just before the clack
    const sweep = clamp01((t - sc.gates) / (sc.clack - 0.35 - sc.gates));
    const kick = t < sc.clack ? 0 : smooth((t - sc.clack) / 0.06) * Math.exp(-(t - sc.clack) * 3.2);
    const tr = TR0 + (TR1 - TR0) * smooth((t - 0.2) / (sc.gates + 0.9));
    const labelA = smooth((t - sc.gates - 0.3) / 0.5);
    const winA = WIN_A + (WIN_A_XRAY - WIN_A) * smooth((t - sc.gates + 0.1) / 1.2);
    const bloom = smooth((t - 0.1) / (sc.gates + 1.4));

    f.backlight({ sunX: 640, intensity: 0.62 });
    f.layer('L2', (c, env) => theatreWall(f, c, env));
    f.fog('A');
    f.fog({ yCenter: 380, height: 260, alpha: 0.13, drift: 14 });

    f.layer('L3', (c, env) => {
      stageFloor(c, env);
      handwiredDesk(f, c, env, {
        ...THEATRE.desk,
        proscenium: false,
        windows: { monitor: { alpha: 0 }, notes: { alpha: 0 }, photos: { alpha: 0 } },
        translucency: tr,
        lamp: 0.72,
        wire: 0.35,
        xray: {},
        key: ID,
      });
      backlit(c, env, tr, bloom);
      deskDockGlyphs(c, DESK_G.tiles, 0, OS_COLORS.ink, 0.5);
      sourceTableFaint(c, env);
      gateField(c, env, sweep, kick, smooth((t - 0.2) / (sc.gates - 0.1)));
    });
    f.fog({ yCenter: 610, height: 120, alpha: 0.1, drift: 8 });

    f.layer('L4', (c, env) => {
      const st: Record<'monitor' | 'notes' | 'photos', WinState> = {
        monitor: { alpha: winA, swing: 0.004 * Math.sin(f.tq * 1.3) },
        notes: { alpha: winA, swing: 0.005 * Math.sin(f.tq * 1.1 + 1.2) },
        photos: { alpha: winA, swing: 0.004 * Math.sin(f.tq * 1.2 + 2.1) },
      };
      windowThreads(c, env, WIN.monitor, st.monitor, THREAD_TOP, 0.8);
      windowThreads(c, env, WIN.notes, st.notes, THREAD_TOP, 0.8);
      windowThreads(c, env, WIN.photos, st.photos, THREAD_TOP, 0.8);
      paperWindow(c, env, 'monitor', WIN.monitor, st.monitor, { footer: 1 });
      paperWindow(c, env, 'notes', WIN.notes, st.notes, {});
      paperWindow(c, env, 'photos', WIN.photos, st.photos, { photosLit: 12 });
      throughPaper(c, env, sweep, kick);
    });
    f.rim({ x: 0, y: -1 });
    f.layer(DUST_L, (c, env) => {
      dustMotes(c, { area: { x: 220, y: 150, w: 840, h: 460 }, count: 24, size: 1.6, brightness: 0.26 * (0.4 + 0.6 * bloom), drift: { x: 3, y: -1.6 }, salt: 416 }, env);
    });
    f.layer(PROSCENIUM, (c, env) => {
      proscenium(c, env, { title: 'HandwiredOS', titleA: 1, label: '2,776 ReGLU gates · 59 boolean atoms', labelA });
    });
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

/** the copper of a lit gate (the film's adding colour, warmed by the lamp inside the plate) */
const gateCol = (env: PaintEnv, k = 0) => mixLab(mixLab(copperOf(env, 0.85), '#e7a15c', 0.35), '#fff0d6', k);
/** how lit gate layer li is at sweep u (the light runs left to right through the layers, in dependency order) */
const litOf = (li: number, u: number) => clamp01(u * (NL + 8) - li * ((NL + 8) / NL) * 0.92);

/** the gate field (L3, over the thinned desk): every ReGLU a tiny ramp with its shutter tick, every boolean atom a
 *  small toothed detent wheel; dark pockets until lit, then copper */
function gateField(c: CanvasRenderingContext2D, env: PaintEnv, u: number, kick: number, reveal: number) {
  if (reveal <= 0) return;
  const g = CELL;
  c.save();
  // the unlit glyphs: recessed marks in the set's ink (the paper is thin enough to show them)
  // the plate held to the lamp: a dark ground inside the desk so the copper reads as light, not as print
  c.fillStyle = withAlpha(mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.35), 0.42 * reveal);
  c.fillRect(FX0 - 8, FY0 - 8, FW + 16, FH + 16);
  c.globalAlpha = reveal * 0.35;
  c.strokeStyle = withAlpha(env.fill('set'), 0.5);
  c.lineWidth = Math.max(0.6, g * 0.11);
  c.beginPath();
  for (const p of GATES) ramp(c, p.x, p.y, g);
  c.stroke();
  c.restore();
  if (u <= 0) return;
  // the lit ones, by layer: copper strokes, then their glow (additive)
  c.save();
  const buckets: Path2D[] = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
  for (const p of GATES) {
    const l = litOf(p.layer, u);
    if (l <= 0) continue;
    const bi = Math.min(3, Math.floor(l * 3.999));
    const pth = buckets[bi];
    pth.moveTo(p.x + g * 0.12, p.y + g * 0.74);
    pth.lineTo(p.x + g * 0.4, p.y + g * 0.74);
    pth.lineTo(p.x + g * 0.72, p.y + g * 0.2);
    // the shutter: a short upright tick after the ramp
    pth.moveTo(p.x + g * 0.86, p.y + g * 0.14);
    pth.lineTo(p.x + g * 0.86, p.y + g * 0.78);
  }
  c.lineCap = 'round';
  c.lineWidth = Math.max(0.9, g * 0.16);
  buckets.forEach((pth, bi) => {
    c.strokeStyle = withAlpha(mixLab('#b8642c', env.mood.core, 0.12 + 0.3 * kick), 0.35 + 0.6 * ((bi + 1) / 4));
    c.stroke(pth);
  });
  c.globalCompositeOperation = 'lighter';
  c.lineWidth = Math.max(1.6, g * 0.34);
  buckets.forEach((pth, bi) => {
    c.strokeStyle = withAlpha(gateCol(env, 0.1 + 0.3 * kick), (0.06 + 0.1 * ((bi + 1) / 4)) * (1 + 0.8 * kick));
    c.stroke(pth);
  });
  // the sweep's front glows a little into the paper
  if (u < 1) {
    const fx = FX0 + FW * clamp01(u * 1.04);
    const gr = c.createLinearGradient(fx - 80, 0, fx + 20, 0);
    gr.addColorStop(0, withAlpha(gateCol(env), 0));
    gr.addColorStop(0.8, withAlpha(gateCol(env, 0.2), 0.16));
    gr.addColorStop(1, withAlpha(gateCol(env), 0));
    c.fillStyle = gr;
    c.fillRect(fx - 80, FY0 - 6, 100, FH + 12);
  }
  // the detent wheels: a small toothed ring, glinting (each its own seeded glint once lit)
  for (const d of DETENTS) {
    const l = litOf(d.layer, u);
    if (l <= 0) continue;
    const r = g * 0.9;
    const glint = 0.55 + 0.45 * Math.max(0, Math.sin(d.x * 0.37 + d.y * 0.11 + kick * 4));
    c.strokeStyle = withAlpha(gateCol(env, 0.45 + 0.3 * kick), 0.9 * l * glint);
    c.lineWidth = Math.max(1, g * 0.16);
    c.beginPath();
    c.arc(d.x, d.y + r, r * 0.62, 0, Math.PI * 2);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      c.moveTo(d.x + Math.cos(a) * r * 0.62, d.y + r + Math.sin(a) * r * 0.62);
      c.lineTo(d.x + Math.cos(a) * r, d.y + r + Math.sin(a) * r);
    }
    c.stroke();
    const sp = c.createRadialGradient(d.x, d.y + r, 0, d.x, d.y + r, r * 2.4);
    sp.addColorStop(0, withAlpha(gateCol(env, 0.6), 0.32 * l * glint));
    sp.addColorStop(1, withAlpha(gateCol(env), 0));
    c.fillStyle = sp;
    c.fillRect(d.x - r * 2.4, d.y + r - r * 2.4, r * 4.8, r * 4.8);
  }
  c.restore();
}
function ramp(c: CanvasRenderingContext2D, x: number, y: number, g: number) {
  c.moveTo(x + g * 0.12, y + g * 0.74);
  c.lineTo(x + g * 0.4, y + g * 0.74);
  c.lineTo(x + g * 0.72, y + g * 0.2);
  c.moveTo(x + g * 0.86, y + g * 0.14);
  c.lineTo(x + g * 0.86, y + g * 0.78);
}

/** ch03-s07's source table, still faintly lit inside (234 cells, three rows of 78 at the desk's half height) */
function sourceTableFaint(c: CanvasRenderingContext2D, env: PaintEnv) {
  const N = TOTALS.sourceCells;
  const per = Math.ceil(N / 3);
  const x0 = D.x + D.w * 0.06, w = D.w * 0.88;
  const cw = w / per;
  const y0 = D.y + D.h * 0.5;
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.fillStyle = withAlpha(mixLab('#e3a04e', env.mood.core, 0.22), 0.16);
  for (let i = 0; i < N; i++) {
    const col = Math.floor(i / 3), row = i % 3;
    c.fillRect(x0 + col * cw + cw * 0.12, y0 + row * cw * 1.3 + cw * 0.12, cw * 0.62, cw * 0.86);
  }
  c.restore();
}

/** the lit gates seen THROUGH the translucent windows (L4, additive, clipped to the sheets), softened */
function throughPaper(c: CanvasRenderingContext2D, env: PaintEnv, u: number, kick: number) {
  if (u <= 0) return;
  c.save();
  c.beginPath();
  for (const id of ['monitor', 'notes', 'photos'] as const) {
    const r = WIN[id];
    c.rect(r.x, r.y, r.w, r.h);
  }
  c.clip();
  const p = new Path2D();
  const g = CELL;
  for (const q of GATES) if (litOf(q.layer, u) > 0.5) ramp(p as unknown as CanvasRenderingContext2D, q.x, q.y, g);
  c.strokeStyle = withAlpha(mixLab('#b8642c', env.mood.core, 0.15 + 0.3 * kick), 0.5 + 0.15 * kick);
  c.lineWidth = Math.max(0.9, g * 0.15);
  c.stroke(p);
  c.restore();
}

/** the backlight blooming through the thinned desk (L3, clipped to it) */
function backlit(c: CanvasRenderingContext2D, env: PaintEnv, tr: number, bloom: number) {
  const a = bloom * (0.4 + 0.6 * tr);
  if (a <= 0.005) return;
  c.save();
  c.beginPath();
  c.rect(D.x, D.y, D.w, D.h);
  c.clip();
  const v = c.createRadialGradient(D.x + D.w / 2, D.y + D.h * 0.45, D.w * 0.18, D.x + D.w / 2, D.y + D.h * 0.45, D.w * 0.66);
  v.addColorStop(0, withAlpha(env.fill('set'), 0));
  v.addColorStop(1, withAlpha(env.fill('set'), 0.4 * a));
  c.fillStyle = v;
  c.fillRect(D.x, D.y, D.w, D.h);
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(D.x + D.w / 2, D.y + D.h * 0.45, 0, D.x + D.w / 2, D.y + D.h * 0.45, D.w * 0.62);
  g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.4), 0.12 * a));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(D.x, D.y, D.w, D.h);
  c.restore();
}
