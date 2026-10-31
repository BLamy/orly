/**
 * ch03-s07 — X-ray desk beat 1 of 5 (Device 3), silent: inside the translucent HandwiredOS desk the source table's
 * 234 pigeonholes light, left to right.
 *
 * Crossfade in from ch03-s06's Notes window out to the whole toy theatre exactly as ch01-s02 framed it (the same
 * sets/ch01-s02-theatre: the workshop's paned window wall far behind at L2, the desk flat at L3, the three paper
 * windows hung on threads at L4, the black card proscenium with its marquee a hair nearer, the bench edge soft at
 * L5). The shot OPENS on a framing that puts this theatre's Notes window where ch03-s06's last frame left its Notes
 * window (same screen position and size: OPEN below), so the crossfade lays Notes over Notes; the camera eases out
 * to CAMERA3_HOME by 0.75 s, before 'xray', then holds still; only the haze and the dust in the backlight drift.
 *   Now the paper is thin, as if held to the lamp (sets/handwiredDesk translucency): the desk darkens like a plate on
 *   a light box, the backlight blooms behind it (the window wall's panes and mullions show faintly through the desk
 *   face) and the three windows hang translucent; once the X-ray starts they thin further (WIN_A .55 → .3) so the
 *   strip's cells stay countable through them.
 *   The strip's pockets surface as the paper thins (0.15-0.8 s), still unlit: recessed holes in set ink, not a bar.
 *   'xray' (0.8 s): the source table, the desk's real 234 cells (OS02; TOTALS.sourceCells from the circuit export,
 *     the shared painter's three rows of 78), lights column by column from left to right in warm amber, running
 *     behind Monitor, Notes and Photos: its glow shows through each sheet. A small label sets in on the marquee
 *     board, under the title: 'source table · 234 cells' (script onScreenText; the only new text).
 *   'clack' (3.2 s): the last pigeonhole lights; the whole strip gives one small warm kick (the relay clack), then
 *     holds lit. No narration; the ink-bleed into Deep Dive I starts under the last 0.7 s.
 * Text: the marquee title (prop lettering, read in ch01-s02) and the label. One accent: the amber strip.
 */
import { Timeline, ease } from '../../../core';
import { CAMERA3_HOME, LAYERS, PUPPET_NEAR_BLACK, cam3Interp, defineShot, dustMotes, mixLab, toScreen, withAlpha } from '../../../film';
import type { Camera3, LayerSpec, PaintEnv } from '../../../film';
import { deskGeom, handwiredDesk } from '../sets/handwiredDesk';
import { DESK_G, PROSCENIUM, THEATRE, WIN, paperWindow, proscenium, stageFloor, theatreWall, windowThreads, type WinState } from '../sets/ch01-s02-theatre';
import { deskDockGlyphs } from '../sets/ch01-s01-dock';
import { OS_COLORS, TOTALS } from '../sets/circuit';

const ID = 'ch03-s07';
const THREAD_TOP = 112;
/** the X-ray's paper thinness (ch03: .2 per sets/handwiredDesk), eased up a hair as the strip lights */
const TR0 = 0.2;
const TR1 = 0.62;
/** the window sheets' opacity once backlit through (a little translucent), thinned further as the X-ray runs */
const WIN_A = 0.55;
const WIN_A_XRAY = 0.3;

/**
 * The opening framing: ch03-s06 ends on its camera C6 ({x 760, y 467, action-plane zoom 4.08}) with the workshop
 * bench desk's Notes window (sets/tagLine bench: handwiredDesk at (470, 400), w 300, on L3) on screen. This camera
 * puts the theatre's Notes window (WIN.notes, L4) on that same screen rect, so the 1 s crossfade lays Notes over
 * Notes; then it eases out to CAMERA3_HOME (the whole desk) by 0.75 s.
 */
const OPEN: Camera3 = (() => {
  const s06End: Camera3 = { x: 760, y: 467, z: 1000 - 1000 / 4.08, lens: 1 };
  const bench = deskGeom({ x: 470, y: 400, w: 300 }).win.notes;
  const a = toScreen(LAYERS.L3, s06End, bench.x, bench.y);
  const b = toScreen(LAYERS.L3, s06End, bench.x + bench.w, bench.y + bench.h);
  const n = WIN.notes;
  // at L4 (z 1000) with lens 1 the layer scale k is also the perspective scale s
  const k = (b.x - a.x) / n.w;
  const cx = CAMERA3_HOME.x + (n.x * k + CAMERA3_HOME.x * (1 - k) - a.x) / k;
  const cy = CAMERA3_HOME.y + (n.y * k + CAMERA3_HOME.y * (1 - k) - a.y) / k;
  return { x: cx, y: cy, z: 1000 - 1000 / k, lens: 1 };
})();
const OUT_DUR = 0.75;
/** the dust's plane: just in front of the hanging windows, behind the proscenium */
const DUST_L: LayerSpec = { id: `${ID}-dust`, z: 970, haze: 0, blur: 0.5 };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};

/** the shared painter's strip geometry (sets/handwiredDesk xrayLayer: three rows of 78 from 6 % to 94 % of the desk,
 *  at half its height), for the glow that shows through the hanging windows */
const D = DESK_G.desk;
const N = TOTALS.sourceCells;
const PER = Math.ceil(N / 3);
const SX0 = D.x + D.w * 0.06;
const SW = D.w * 0.88;
const CW = SW / PER;
const SY0 = D.y + D.h * 0.5;
const SH = CW * 1.3 * 2 + CW * 1.1;

export default defineShot({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    // open on the Notes window where ch03-s06 left it, ease out to the whole desk before 'xray', then hold still
    const cam = tl.channel<Camera3>('cam', OPEN, cam3Interp);
    tl.tween(cam, CAMERA3_HOME, { at: 0, dur: OUT_DUR, ease: ease.move });
    tl.hold(0, T.duration);
    return { tl, cam, xray: T.beat('xray'), clack: T.beat('clack'), D: T.duration };
  },
  paint(f, s, sc) {
    const t = f.t;
    f.camera(t <= 0 ? OPEN : s.get(sc.cam));
    // light: the table lights on ones (it is light, not cut paper)
    const u = clamp01((t - sc.xray) / (sc.clack - sc.xray));
    const kick = t < sc.clack ? 0 : smooth((t - sc.clack) / 0.06) * Math.exp(-(t - sc.clack) * 3.2);
    const tr = TR0 + (TR1 - TR0) * smooth((t - 0.1) / (sc.xray + 0.5));
    const labelA = smooth((t - sc.xray - 0.25) / 0.5);
    // the X-ray thins the hanging sheets as it runs, so the strip's cells stay countable through them
    const winA = WIN_A + (WIN_A_XRAY - WIN_A) * smooth((t - sc.xray + 0.1) / 1.1);
    // the backlight behind the desk grows as the paper thins
    const bloom = smooth((t - 0.1) / (sc.xray + 1.2));

    f.backlight({ sunX: 640, intensity: 0.85 });

    // L2: the workshop's window wall far behind the theatre (as ch01-s02)
    f.layer('L2', (c, env) => theatreWall(f, c, env));
    f.fog('A');
    // a slow-drifting haze sheet at mid-frame, so the still hold breathes
    f.fog({ yCenter: 380, height: 260, alpha: 0.15, drift: 14 });

    // L3: the stage floor and the desk flat, thinned; the source table lit inside it
    f.layer('L3', (c, env) => {
      stageFloor(c, env);
      handwiredDesk(f, c, env, {
        ...THEATRE.desk,
        proscenium: false,
        windows: { monitor: { alpha: 0 }, notes: { alpha: 0 }, photos: { alpha: 0 } },
        translucency: tr,
        lamp: 0.95,
        wire: 0.4,
        // the X-ray plate with nothing of the shared painter lit: this shot draws the table itself (same geometry)
        xray: {},
        key: ID,
      });
      backlitDesk(c, env, tr, bloom);
      deskDockGlyphs(c, DESK_G.tiles, 0, OS_COLORS.ink, 0.6);
      sourceTable(c, env, u, kick, smooth((t - 0.15) / (sc.xray - 0.1)));
    });
    f.fog({ yCenter: 610, height: 120, alpha: 0.1, drift: 8 });

    // L4: the three windows hung on their threads, now thin enough that the backlight and the strip show through
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
      // the backlight warming through the thin sheets, then the strip's light where the lit holes sit behind them
      backlitSheets(c, env, tr);
      throughPaper(c, env, u, kick);
    });
    f.rim({ x: 0, y: -1 });
    // dust turning slowly in the backlight in front of the sheets (light, on ones)
    f.layer(DUST_L, (c, env) => {
      dustMotes(c, { area: { x: 220, y: 150, w: 840, h: 460 }, count: 26, size: 1.6, brightness: 0.3 * (0.4 + 0.6 * bloom), drift: { x: 3, y: -1.6 }, salt: 307 }, env);
    });

    // the proscenium: black card and marquee; the title holds (read in ch01-s02), the label sets in on 'xray'
    f.layer(PROSCENIUM, (c, env) => {
      proscenium(c, env, { title: 'HandwiredOS', titleA: 1, label: 'source table · 234 cells', labelA: labelA });
    });

    // L5: the workbench's near edge, dark and soft at the lower left (the same near plane as ch01-s02)
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

/** the warm amber of a lit pigeonhole (the shot's one accent) */
const amber = (env: PaintEnv, k = 0) => mixLab(mixLab('#e3a04e', env.mood.core, 0.22), '#fff1d2', k);

/**
 * The source table inside the plate (L3): the real 234 cells as the shared painter lays them (sets/handwiredDesk
 * xrayLayer: three rows of 78 across 6-94 % of the desk at half its height), every hole a dark pocket until it
 * lights; they light column by column, left to right, in warm amber, a soft bloom riding the lighting front; on the
 * clack the whole strip kicks once.
 */
function sourceTable(c: CanvasRenderingContext2D, env: PaintEnv, u: number, kick: number, reveal: number) {
  const lit = u * N;
  if (reveal <= 0) return;
  c.save();
  c.globalAlpha = reveal;
  // the strip's carrier: a thin rail the holes are cut into, in the set's ink (one step lighter than near-black)
  const setInk = env.fill('set');
  c.fillStyle = withAlpha(setInk, 0.14);
  c.fillRect(SX0 - CW * 0.4, SY0 - CW * 0.35, SW + CW * 0.3, SH + CW * 0.7);
  for (let i = 0; i < N; i++) {
    const col = Math.floor(i / 3), row = i % 3;
    const cx = SX0 + col * CW, cy = SY0 + row * CW * 1.3;
    const on = clamp01(lit - i);
    // an unlit pocket: a recessed hole in the paper, not a black slot
    c.fillStyle = withAlpha(setInk, 0.3 * (1 - 0.6 * on));
    c.fillRect(cx, cy, CW * 0.86, CW * 1.1);
    if (on > 0) {
      c.fillStyle = withAlpha(amber(env, 0.1 + 0.25 * kick), 0.95 * on);
      c.fillRect(cx + CW * 0.1, cy + CW * 0.1, CW * 0.66, CW * 0.9);
    }
  }
  c.restore();
  if (u <= 0) return;
  c.save();
  c.globalCompositeOperation = 'lighter';
  // the lit stretch glows a little into the paper around it
  const xe = SX0 + Math.min(SW, (Math.floor(lit / 3) + 1) * CW);
  const g = c.createLinearGradient(0, SY0 - 16, 0, SY0 + SH + 16);
  g.addColorStop(0, withAlpha(env.mood.halo, 0));
  g.addColorStop(0.5, withAlpha(amber(env), 0.16 + 0.22 * kick));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(SX0 - 6, SY0 - 16, xe - SX0 + 6, SH + 32);
  if (u < 1) {
    const col = Math.min(PER - 1, Math.floor(lit / 3));
    const fx = SX0 + (col + 0.45) * CW;
    const fy = SY0 + SH / 2;
    const r = 30;
    const gf = c.createRadialGradient(fx, fy, 0, fx, fy, r);
    gf.addColorStop(0, withAlpha(amber(env, 0.3), 0.5));
    gf.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = gf;
    c.fillRect(fx - r, fy - r, 2 * r, 2 * r);
  }
  c.restore();
}

/** the sheets held to the lamp: a warm bloom through each window, strongest at its centre (L4, additive) */
function backlitSheets(c: CanvasRenderingContext2D, env: PaintEnv, tr: number) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const id of ['monitor', 'notes', 'photos'] as const) {
    const r = WIN[id];
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(r.w, r.h) * 0.6);
    g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.4), 0.16 * tr));
    g.addColorStop(1, withAlpha(env.mood.halo, 0.03 * tr));
    c.fillStyle = g;
    c.fillRect(r.x, r.y, r.w, r.h);
  }
  c.restore();
}

/** the lit strip seen THROUGH the translucent windows (L4, additive, clipped to the sheets): each lit hole shows
 *  through the paper as its own cell-shaped patch of amber (a little softened), so the source table reads as
 *  running behind Monitor, Notes and Photos and its cells stay countable through them */
function throughPaper(c: CanvasRenderingContext2D, env: PaintEnv, u: number, kick: number) {
  if (u <= 0) return;
  const lit = u * N;
  const warm = amber(env, 0.15 + 0.2 * kick);
  c.save();
  c.beginPath();
  for (const id of ['monitor', 'notes', 'photos'] as const) {
    const r = WIN[id];
    c.rect(r.x, r.y, r.w, r.h);
  }
  c.clip();
  c.globalCompositeOperation = 'lighter';
  // a faint diffusion of the paper round the lit stretch (no uniform band)
  const xe = SX0 + Math.min(SW, (Math.floor(lit / 3) + 1) * CW);
  const g = c.createLinearGradient(0, SY0 - 12, 0, SY0 + SH + 12);
  g.addColorStop(0, withAlpha(env.mood.halo, 0));
  g.addColorStop(0.5, withAlpha(warm, 0.05 + 0.08 * kick));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(SX0, SY0 - 12, xe - SX0, SH + 24);
  // the holes themselves, cell by cell
  for (let i = 0; i < N; i++) {
    const on = clamp01(lit - i);
    if (on <= 0) break;
    const col = Math.floor(i / 3), row = i % 3;
    const cx = SX0 + col * CW, cy = SY0 + row * CW * 1.3;
    c.fillStyle = withAlpha(warm, (0.35 + 0.15 * kick) * on);
    c.fillRect(cx + CW * 0.06, cy + CW * 0.06, CW * 0.74, CW * 0.98);
  }
  c.restore();
}

/**
 * The backlight behind the thinned desk (L3, over the desk, clipped to it): a warm bloom that grows as the paper
 * thins, and the workshop window wall's panes glowing faintly through the desk face with their mullions dark
 * between them (the wall's own geometry: sets/ch01-s02-theatre theatreWall, windows centred at 250, 640 and 1030,
 * 230 wide, three lights, seven pane rows, sill 560; at CAMERA3_HOME the L2 and L3 rest coordinates coincide).
 */
function backlitDesk(c: CanvasRenderingContext2D, env: PaintEnv, tr: number, bloom: number) {
  const R = D;
  const a = bloom * (0.4 + 0.6 * tr);
  if (a <= 0.005) return;
  c.save();
  c.beginPath();
  c.rect(R.x, R.y, R.w, R.h);
  c.clip();
  // the plate darkens toward its edges like film on a light box: the centre is where the lamp is
  const v = c.createRadialGradient(R.x + R.w / 2, R.y + R.h * 0.45, R.w * 0.18, R.x + R.w / 2, R.y + R.h * 0.45, R.w * 0.66);
  v.addColorStop(0, withAlpha(env.fill('set'), 0));
  v.addColorStop(1, withAlpha(env.fill('set'), 0.34 * a));
  c.fillStyle = v;
  c.fillRect(R.x, R.y, R.w, R.h);
  // the window wall's mullions and frames cast through the paper as soft dark bars
  const top = 18, sill = 560;
  const ph = (sill - top) / 7;
  const lw3 = 230 / 3;
  c.fillStyle = withAlpha(env.fill('set'), 0.24 * a);
  for (const wx of [250, 640, 1030]) {
    const x0 = wx - 115;
    for (let li = 0; li <= 3; li++) c.fillRect(x0 + li * lw3 - (li % 3 === 0 ? 7 : 3.5), top, li % 3 === 0 ? 14 : 7, sill - top);
    for (let r = 0; r <= 7; r++) c.fillRect(x0, top + r * ph - 3, 230, 6);
  }
  // and the panes glow warm between them
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(R.x + R.w / 2, R.y + R.h * 0.45, 0, R.x + R.w / 2, R.y + R.h * 0.45, R.w * 0.62);
  g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.45), 0.16 * a));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(R.x, R.y, R.w, R.h);
  c.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.3), 0.06 * a);
  for (const wx of [250, 640, 1030]) {
    const x0 = wx - 115;
    for (let li = 0; li < 3; li++) {
      for (let r = 0; r < 7; r++) c.fillRect(x0 + li * lw3 + 4, top + r * ph + 3, lw3 - 8, ph - 6);
    }
  }
  c.restore();
}
