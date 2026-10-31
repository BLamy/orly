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
/** the paper windows hang IN FRONT of the lit lattice at ~70 % (the gates glow behind the panes, never through them) */
const WIN_A_XRAY = 0.7;
/** the lattice's ceiling (it is light inside the plate, not print on it) */
const LATTICE_MAX = 0.55;
/** the proscenium's black card, thinned ~15 % with the desk (the desk is a little more translucent than in ch03-s07) */
const FRAME_A = 0.85;
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
      gateField(c, env, sweep, kick, smooth((t - 0.2) / (sc.gates - 0.1)));
      // the source table stays faintly lit on top of the lattice
      sourceTableFaint(c, env);
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
    // a fog band drifting across the lower third, in front of the desk
    f.fog({ yCenter: 600, height: 150, alpha: 0.13, drift: 26 });
    f.layer(DUST_L, (c, env) => {
      dustMotes(c, { area: { x: 220, y: 150, w: 840, h: 460 }, count: 24, size: 1.6, brightness: 0.26 * (0.4 + 0.6 * bloom), drift: { x: 3, y: -1.6 }, salt: 416 }, env);
    });
    f.layer(PROSCENIUM, (c, env) => {
      c.save();
      c.globalAlpha *= FRAME_A;
      proscenium(c, env, { title: 'HandwiredOS', titleA: 1, label: '2,776 ReGLU gates · 59 boolean atoms', labelA });
      c.restore();
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
      // a chair back at the lower right (blurred, near-black): the third plane against the backlit desk
      f.cached(`${ID}/chair/${env.mood.id}`, 260, 300, (cc) => {
        cc.fillStyle = PUPPET_NEAR_BLACK;
        cc.beginPath();
        cc.roundRect(40, 40, 200, 26, 12);
        cc.rect(56, 60, 20, 260);
        cc.rect(204, 60, 20, 260);
        cc.rect(70, 120, 140, 14);
        cc.rect(70, 176, 140, 14);
        cc.fill();
        cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.35);
        cc.lineWidth = 2.5;
        cc.beginPath();
        cc.moveTo(52, 41);
        cc.lineTo(228, 41);
        cc.stroke();
      }, { blur: 9 })(c, 1080, 470);
    });
  },
});

/** the copper of a lit gate (the film's adding colour, warmed by the lamp inside the plate) */
const gateCol = (env: PaintEnv, k = 0) => mixLab(mixLab(copperOf(env, 0.85), '#e7a15c', 0.35), '#fff0d6', k);
/** how lit gate layer li is at sweep u (the light runs left to right through the layers, in dependency order) */
const litOf = (li: number, u: number) => clamp01(u * (NL + 8) - li * ((NL + 8) / NL) * 0.92);

/** the gate field (L3, over the thinned desk): every ReGLU a tiny paper ramp (flat, then rising) with its shutter
 *  beside it, every boolean atom a small toothed detent wheel with one glint; dark pockets until lit. The settled
 *  lattice is a desaturated amber capped at LATTICE_MAX; only the moving wave front and the detent glints are copper. */
function gateField(c: CanvasRenderingContext2D, env: PaintEnv, u: number, kick: number, reveal: number) {
  if (reveal <= 0) return;
  const g = CELL;
  c.save();
  // the plate held to the lamp: a dark ground inside the desk so the light reads as light, not as print
  c.fillStyle = withAlpha(mixLab(PUPPET_NEAR_BLACK, env.mood.set, 0.35), 0.4 * reveal);
  c.fillRect(FX0 - 8, FY0 - 8, FW + 16, FH + 16);
  // the unlit glyphs: faint recessed shapes in the set's ink
  c.fillStyle = withAlpha(env.fill('set'), 0.16 * reveal);
  const unlit = new Path2D();
  for (const p of GATES) glyph(unlit, p.x, p.y, g);
  c.fill(unlit);
  c.restore();
  if (u <= 0) return;
  c.save();
  // settled (fully lit) glyphs in amber, the wave front (still lighting) in copper
  const settled = new Path2D();
  const front: Path2D[] = [new Path2D(), new Path2D(), new Path2D()];
  for (const p of GATES) {
    const l = litOf(p.layer, u);
    if (l <= 0) continue;
    if (l >= 1) glyph(settled, p.x, p.y, g);
    else glyph(front[Math.min(2, Math.floor(l * 3))], p.x, p.y, g);
  }
  const amber = mixLab(mixLab(gateCol(env, 0.1 + 0.25 * kick), env.mood.halo, 0.3), env.mood.set, 0.12);
  c.fillStyle = withAlpha(amber, LATTICE_MAX * (0.85 + 0.15 * kick));
  c.fill(settled);
  front.forEach((pth, i) => {
    c.fillStyle = withAlpha(mixLab('#c4682c', env.mood.core, 0.1 + 0.2 * kick), 0.45 + 0.2 * i);
    c.fill(pth);
  });
  // the sweep's front glows a little into the paper
  if (u < 1) {
    c.globalCompositeOperation = 'lighter';
    const fx = FX0 + FW * clamp01(u * 1.04);
    const gr = c.createLinearGradient(fx - 80, 0, fx + 20, 0);
    gr.addColorStop(0, withAlpha(gateCol(env), 0));
    gr.addColorStop(0.8, withAlpha(gateCol(env, 0.2), 0.16));
    gr.addColorStop(1, withAlpha(gateCol(env), 0));
    c.fillStyle = gr;
    c.fillRect(fx - 80, FY0 - 6, 100, FH + 12);
    c.globalCompositeOperation = 'source-over';
  }
  // the 59 detent wheels: a small toothed wheel silhouette (8 teeth, ~10 px) in copper, with one glint on its rim
  for (const d of DETENTS) {
    const l = litOf(d.layer, u);
    if (l <= 0) continue;
    const r = Math.max(5, g * 0.62);
    const cx = d.x, cy = d.y + g * 0.5;
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.7 * l);
    c.beginPath();
    c.arc(cx, cy, r * 1.2, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(mixLab('#c4682c', env.mood.core, 0.15 + 0.25 * kick), 0.95 * l);
    wheel(c, cx, cy, r);
    // its hub
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.85 * l);
    c.beginPath();
    c.arc(cx, cy, r * 0.28, 0, Math.PI * 2);
    c.fill();
    // one glint, at a seeded place on the rim (it flares on the clack)
    const ga = (d.x * 0.37 + d.y * 0.11) % (Math.PI * 2);
    const gx = cx + Math.cos(ga) * r * 0.8, gy = cy + Math.sin(ga) * r * 0.8;
    const sp = c.createRadialGradient(gx, gy, 0, gx, gy, r * 1.4);
    sp.addColorStop(0, withAlpha(gateCol(env, 0.7), (0.75 + 0.25 * kick) * l));
    sp.addColorStop(1, withAlpha(gateCol(env), 0));
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = sp;
    c.fillRect(gx - r * 1.4, gy - r * 1.4, r * 2.8, r * 2.8);
    c.globalCompositeOperation = 'source-over';
  }
  c.restore();
}
/** a toothed wheel (8 teeth) filled at (cx, cy), outer radius r */
function wheel(c: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  c.beginPath();
  const n = 8;
  for (let k = 0; k < n * 2; k++) {
    const a0 = (k / (n * 2)) * Math.PI * 2;
    const a1 = ((k + 1) / (n * 2)) * Math.PI * 2;
    const rr = k % 2 === 0 ? r : r * 0.74;
    if (k === 0) c.moveTo(cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr);
    else c.lineTo(cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr);
    c.lineTo(cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr);
  }
  c.closePath();
  c.fill();
}
/** one gate glyph, filled: the ReGLU ramp (a flat foot, then a rising wedge) and its shutter, a small upright plate */
function glyph(p: Path2D, x: number, y: number, g: number) {
  p.moveTo(x + g * 0.06, y + g * 0.84);
  p.lineTo(x + g * 0.62, y + g * 0.84);
  p.lineTo(x + g * 0.62, y + g * 0.18);
  p.lineTo(x + g * 0.34, y + g * 0.68);
  p.lineTo(x + g * 0.06, y + g * 0.68);
  p.closePath();
  p.rect(x + g * 0.72, y + g * 0.14, g * 0.16, g * 0.7);
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
  c.fillStyle = withAlpha(mixLab('#e3a04e', env.mood.core, 0.22), 0.2);
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
  // the panes are paper in front of the lattice: only a soft trace of it shows through
  c.strokeStyle = withAlpha(mixLab('#b8642c', env.mood.halo, 0.3), 0.1 + 0.05 * kick);
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
