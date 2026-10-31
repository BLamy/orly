/**
 * ch05-s07 — X-ray desk beat 3 of 5 (Device 3), silent: inside the translucent HandwiredOS desk the matmul loom's
 * 130 thin frames light, with one relay clack.
 *
 * The same toy theatre and the same locked-off wide as ch03-s07 (sets/ch01-s02-theatre: the workshop's paned window
 * wall far behind at L2, the desk flat at L3, the three paper windows hung on threads at L4, the black card
 * proscenium a hair nearer, the bench edge soft at L5), now in low candleAmber and a little more translucent than
 * the end of ch04 (paper .72, sheets .24). The components already lit still glow faintly inside it:
 *   the source table (ch03-s07): the real 234 pigeonholes, three rows of 78 (sets/handwiredDesk xrayLayer geometry);
 *   the gates (ch04): 2,776 ReGLU ramps and 59 boolean shutters (the same shared geometry), copper and faint.
 * 'light' (1.0 s): one relay clack (a single warm kick) and the third component lights: the loom's 130 thin frames,
 *   each as tall as its layer's operation count (sets/matmulLoom loomGeom, from the real export sets/circuit), stacked
 *   inside the desk left to right in dependency order, with the loom's own threads between them, one per stored
 *   weight, copper for adding and indigo for subtracting: the same export as the wallpaper's arcs (ch05-s01 DATA
 *   BINDING), so the lattice lines up with the faint arcs on the desk paper. The frames catch left to right in a
 *   0.4 s ripple (the relay closing), then hold. The older components settle a step down so the new one leads.
 * No new text, no narration, no index drawer (HandwiredOS has no index reads). The camera holds; only the haze and the
 * dust in the backlight drift. The reel's ink-bleed into Deep Dive II runs under the last 0.7 s.
 */
import { Timeline } from '../../../core';
import { CAMERA3_HOME, PUPPET_NEAR_BLACK, defineShot, dustMotes, mixLab, withAlpha } from '../../../film';
import type { Frame, LayerSpec, PaintEnv } from '../../../film';
import { handwiredDesk } from '../sets/handwiredDesk';
import { DESK_G, PROSCENIUM, THEATRE, WIN, paperWindow, proscenium, stageFloor, theatreWall, windowThreads, type WinState } from '../sets/ch01-s02-theatre';
import { deskDockGlyphs } from '../sets/ch01-s01-dock';
import { CIRCUIT, OS_COLORS, TOTALS } from '../sets/circuit';
import { loomGeom, matmulLoom } from '../sets/matmulLoom';

const ID = 'ch05-s07';
const THREAD_TOP = 112;
/** the X-ray's paper thinness: a step past ch03-s07's .62 and ch04's beat */
const TR = 0.72;
/** the hanging sheets, thinner again so the inside reads through them */
const WIN_A = 0.15;
/** the dust's plane: just in front of the hanging windows, behind the proscenium */
const DUST_L: LayerSpec = { id: `${ID}-dust`, z: 970, haze: 0, blur: 0.5 };

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
    // the relay closes: frames catch left to right in a 0.4 s ripple from just before the beat; one warm kick
    const ripple = clamp01((t - (sc.light - 0.04)) / 0.4);
    const kick = t < sc.light ? 0 : smooth((t - sc.light) / 0.05) * Math.exp(-(t - sc.light) * 3.4);
    const threads = smooth((t - sc.light) / 0.7);
    // the older components settle a step down once the loom leads
    const older = 1 - 0.38 * smooth((t - sc.light) / 0.9);

    f.backlight({ sunX: 640, intensity: 0.8 });

    // L2: the workshop's window wall far behind the theatre (as ch01-s02 and ch03-s07)
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
        // the plate with nothing of the shared painter lit: this shot draws the inside itself (same geometry)
        xray: {},
        key: ID,
      });
      deskWarmth(c, env, 0.7 + 0.3 * ripple);
      deskDockGlyphs(c, DESK_G.tiles, 0, OS_COLORS.ink, 0.5);
      // the two components already lit, faint (one baked bitmap: they do not change)
      c.save();
      c.globalAlpha = older * (1 + 0.25 * kick);
      insideFaint(f, c, env);
      c.restore();
      // the third: the loom's threads, then its frames
      if (threads > 0) {
        c.save();
        c.beginPath();
        c.rect(D.x, D.y, D.w, D.h);
        c.clip();
        c.globalCompositeOperation = 'lighter';
        matmulLoom(f, c, env, { ...LOOM, frames: 0, threads: 0.85 * threads * (1 + 0.3 * kick), gates: false, key: ID });
        c.restore();
      }
      loomFrames(c, env, ripple, kick);
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
      throughPaper(c, env, ripple, kick);
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
  c.fillStyle = withAlpha(mixLab(env.mood.ink, env.mood.set, 0.45), 0.5);
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
 * The loom's 130 frames inside the desk (loomGeom: each as tall as its layer's operation count, log-scaled): thin
 * lit uprights with a head and a foot rail, catching left to right as the relay closes (ripple 0..1), the frame the
 * ripple is passing a little hotter. Live (130 small strokes).
 */
function loomFrames(c: CanvasRenderingContext2D, env: PaintEnv, ripple: number, kick: number) {
  if (ripple <= 0) return;
  const pitch = LOOM.w / (NL + 1);
  const fw = Math.max(0.9, pitch * 0.2);
  const front = ripple * (NL + 2) - 1;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (let l = -1; l < NL; l++) {
    const on = clamp01(front - l);
    if (on <= 0) break;
    const hot = Math.max(0, 1 - Math.abs(front - l - 0.5) / 6) * (ripple < 1 ? 1 : 0);
    const x = LG.frameX(l), h = LG.frameH(l);
    const top = LG.cy - h / 2 - 4, bot = LG.cy + h / 2 + 4;
    const a = on * (0.55 + 0.35 * hot + 0.3 * kick);
    c.fillStyle = withAlpha(copperLit(env, 0.15 + 0.3 * hot + 0.3 * kick), a);
    c.fillRect(x - pitch * 0.32, top, fw, bot - top);
    c.fillRect(x + pitch * 0.32 - fw, top, fw, bot - top);
    c.fillStyle = withAlpha(amber(env, 0.2 + 0.3 * kick), a * 0.8);
    c.fillRect(x - pitch * 0.42, top - 1.2, pitch * 0.84, 1.4);
    c.fillRect(x - pitch * 0.42, bot - 0.2, pitch * 0.84, 1.4);
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
