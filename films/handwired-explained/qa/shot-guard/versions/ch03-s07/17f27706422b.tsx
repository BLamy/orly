/**
 * ch03-s07 — X-ray desk beat 1 of 5 (Device 3), silent: inside the translucent HandwiredOS desk the source table's
 * 234 pigeonholes light, left to right.
 *
 * Crossfade in from ch03-s06's Notes window out to the whole toy theatre exactly as ch01-s02 framed it (the same
 * sets/ch01-s02-theatre: the workshop's paned window wall far behind at L2, the desk flat at L3, the three paper
 * windows hung on threads at L4, the black card proscenium with its marquee a hair nearer, the bench edge soft at
 * L5). The camera holds still; only the haze drifts.
 *   Now the paper is thin, as if held to the lamp (sets/handwiredDesk translucency): the desk darkens like a plate on
 *   a light box and the three windows hang a little translucent, the backlight warming through them.
 *   'xray' (0.8 s): the source table, the desk's real 234 cells (OS02; TOTALS.sourceCells from the circuit export,
 *     the shared painter's three rows of 78), lights column by column from left to right in warm amber, running
 *     behind Monitor, Notes and Photos: its glow shows through each sheet. A small label sets in on the marquee
 *     board, under the title: 'source table · 234 cells' (script onScreenText; the only new text).
 *   'clack' (3.2 s): the last pigeonhole lights; the whole strip gives one small warm kick (the relay clack), then
 *     holds lit. No narration; the ink-bleed into Deep Dive I starts under the last 0.7 s.
 * Text: the marquee title (prop lettering, read in ch01-s02) and the label. One accent: the amber strip.
 */
import { Timeline } from '../../../core';
import { CAMERA3_HOME, PUPPET_NEAR_BLACK, defineShot, mixLab, withAlpha } from '../../../film';
import type { PaintEnv } from '../../../film';
import { handwiredDesk } from '../sets/handwiredDesk';
import { DESK_G, PROSCENIUM, THEATRE, WIN, paperWindow, proscenium, stageFloor, theatreWall, windowThreads, type WinState } from '../sets/ch01-s02-theatre';
import { deskDockGlyphs } from '../sets/ch01-s01-dock';
import { OS_COLORS, TOTALS } from '../sets/circuit';

const ID = 'ch03-s07';
const THREAD_TOP = 112;
/** the X-ray's paper thinness (ch03: .2 per sets/handwiredDesk), eased up a hair as the strip lights */
const TR0 = 0.2;
const TR1 = 0.5;
/** the window sheets' opacity once backlit through (a little translucent) */
const WIN_A = 0.62;

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
    tl.hold(0, T.duration);
    return { tl, xray: T.beat('xray'), clack: T.beat('clack'), D: T.duration };
  },
  paint(f, _s, sc) {
    const t = f.t;
    f.camera(CAMERA3_HOME);
    // light: the table lights on ones (it is light, not cut paper)
    const u = clamp01((t - sc.xray) / (sc.clack - sc.xray));
    const kick = t < sc.clack ? 0 : smooth((t - sc.clack) / 0.06) * Math.exp(-(t - sc.clack) * 3.2);
    const tr = TR0 + (TR1 - TR0) * smooth((t - 0.1) / (sc.xray + 0.5));
    const labelA = smooth((t - sc.xray - 0.25) / 0.5);

    f.backlight({ sunX: 640, intensity: 0.85 });

    // L2: the workshop's window wall far behind the theatre (as ch01-s02)
    f.layer('L2', (c, env) => theatreWall(f, c, env));
    f.fog('A');

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
        xray: { table: u },
        key: ID,
      });
      deskDockGlyphs(c, DESK_G.tiles, 0, OS_COLORS.ink, 0.6);
      stripFront(c, env, u, kick);
    });
    f.fog({ yCenter: 610, height: 120, alpha: 0.1, drift: 8 });

    // L4: the three windows hung on their threads, now thin enough that the backlight and the strip show through
    f.layer('L4', (c, env) => {
      const st: Record<'monitor' | 'notes' | 'photos', WinState> = {
        monitor: { alpha: WIN_A, swing: 0.004 * Math.sin(f.tq * 1.3) },
        notes: { alpha: WIN_A, swing: 0.005 * Math.sin(f.tq * 1.1 + 1.2) },
        photos: { alpha: WIN_A, swing: 0.004 * Math.sin(f.tq * 1.2 + 2.1) },
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

/** the lighting front: a soft amber bloom riding the column being lit (L3), and the strip's kick on the clack */
function stripFront(c: CanvasRenderingContext2D, env: PaintEnv, u: number, kick: number) {
  if (u <= 0) return;
  const warm = mixLab(env.mood.core, '#ffd9a0', 0.25);
  c.save();
  c.globalCompositeOperation = 'lighter';
  if (u < 1) {
    const col = Math.min(PER - 1, Math.floor((u * N) / 3));
    const fx = SX0 + (col + 0.45) * CW;
    const fy = SY0 + SH / 2;
    const g = c.createRadialGradient(fx, fy, 0, fx, fy, 34);
    g.addColorStop(0, withAlpha(warm, 0.45));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(fx - 34, fy - 34, 68, 68);
  }
  if (kick > 0.01) {
    const g = c.createLinearGradient(0, SY0 - 14, 0, SY0 + SH + 14);
    g.addColorStop(0, withAlpha(env.mood.halo, 0));
    g.addColorStop(0.5, withAlpha(warm, 0.3 * kick));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(SX0 - 8, SY0 - 14, SW + 16, SH + 28);
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

/** the lit strip seen THROUGH the translucent windows (L4, additive, clipped to the sheets): a soft band per lit
 *  stretch, so the source table reads as running behind Monitor, Notes and Photos */
function throughPaper(c: CanvasRenderingContext2D, env: PaintEnv, u: number, kick: number) {
  if (u <= 0) return;
  const lit = SX0 + SW * Math.min(1, u);
  const warm = mixLab(env.mood.core, '#ffd9a0', 0.2);
  c.save();
  c.beginPath();
  for (const id of ['monitor', 'notes', 'photos'] as const) {
    const r = WIN[id];
    c.rect(r.x, r.y, r.w, r.h);
  }
  c.clip();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, SY0 - 10, 0, SY0 + SH + 10);
  g.addColorStop(0, withAlpha(env.mood.halo, 0));
  g.addColorStop(0.5, withAlpha(warm, 0.11 + 0.12 * kick));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(SX0, SY0 - 10, lit - SX0, SH + 20);
  // the cells themselves, ghosted through the paper (column blocks, not every hole: the paper diffuses them)
  c.fillStyle = withAlpha(warm, 0.09 + 0.08 * kick);
  const cols = Math.floor((Math.min(1, u) * N) / 3);
  for (let i = 0; i < cols; i++) {
    const x = SX0 + i * CW;
    c.fillRect(x + CW * 0.12, SY0 + CW * 0.12, CW * 0.62, SH - CW * 0.3);
  }
  c.restore();
}
