/**
 * ch01-s03 — we push into Monitor and read the program's own numbers in its sidebar.
 *
 * The toy theatre of ch01-s02, closer: Monitor hangs at L4 in front of the dimmed desk flat (L3), haze between, the
 * proscenium's dark wing sliding out at frame left, Photos (settled where the drag left it) at the right edge. The
 * camera is ONE continuous push shared with ch01-s02 and ch01-s04's gauze (sets/ch01-s02-push.ts): it enters at full
 * speed from the s02 wide, lands on Monitor at about z 400 by the 'sidebar' beat, then creeps on (still moving at the
 * cut). The lamp warms parchment → candleAmber (in 16 steps so the baked desk re-bakes only 16 times), a soft pool of
 * light settles on Monitor's sidebar, and everything else (Notes, Photos' edge, the desk, the proscenium wing) sinks
 * by about a third, so Monitor is the only bright plane by about 4 s.
 *   'sidebar' (0.9 s): THIS PROGRAM · State 234 · Operations 4,646 · Outputs 493 (reading size from here on).
 *   'footer' (L0103 'neural'): the footer strip slides up into view: 130 layers · 9,909 weights (only these two).
 *   'network' ('network'): the three sidebar figures get a brief warm kick.
 *   rows: the list's values tick on twos (the network's live state, not a picture of it).
 *   'live' ('live'): the ticking values get one warm value lift together, decaying over about 0.6 s.
 * Review r1: shared camera (registers with s02's cut and s04's gauze), light pool + vignette + near-black wing, the
 * 'live' lift, the dock glyphs and the darker far wall carried over from s02.
 */
import { Timeline } from '../../../core';
import { CAMERA3_HOME, LAYERS, cam3Interp, defineShot, mixLab, toScreen, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { handwiredDesk } from '../sets/handwiredDesk';
import { DESK_G, PRO, PROSCENIUM, THEATRE, WIN, paperWindow, proscenium, stageFloor, theatreWall, windowThreads, type WinState } from '../sets/ch01-s02-theatre';
import { deskDockGlyphs } from '../sets/ch01-s01-dock';
import { pushCam } from '../sets/ch01-s02-push';
import { OS_COLORS } from '../sets/circuit';

/** where ch01-s02's drag left Photos (62 dragged + 26.2 glided along (-0.948, 0.318)) */
const PHOTOS_OFF = { dx: -0.948 * 88.2, dy: 0.318 * 88.2 };
const THREAD_TOP = 112;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const bump = (t: number, t0: number, rise = 0.15, decay = 1.4) => (t < t0 ? 0 : smooth((t - t0) / rise) * Math.exp(-Math.max(0, t - t0 - rise) * decay));

export default defineShot({
  id: 'ch01-s03',
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    // the camera is sampled from the shared push (pushCam) in paint; the channel only spans the shot
    const cam = tl.channel<Camera3>('cam', CAMERA3_HOME, cam3Interp);
    tl.hold(0, T.duration);
    return {
      tl,
      cam,
      push: T.beat('push'),
      sidebar: T.beat('sidebar'),
      footer: T.beat('footer'),
      network: T.beat('network'),
      live: T.beat('live'),
    };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const tq = f.tq;
    const cam = pushCam(t);
    f.camera(cam);
    // the lamp warms: parchment → candleAmber, quantised so cached art re-bakes in steps, not every frame
    const warm = Math.round(smooth((t - scene.push) / 4.6) * 16) / 16;
    f.setMood('candleAmber', { from: 'parchment', u: warm });
    // the backlight eases from ch01-s02's (centre, 0.8) to the lamp side
    const bl = smooth(t / 2.5);
    f.backlight({ sunX: 640 - 80 * bl, intensity: 0.8 + 0.1 * bl });

    f.layer('L2', (c, env) => theatreWall(f, c, env));
    f.fog('A');

    // L3: the desk flat, dimming a little as the lamp narrows onto Monitor
    f.layer('L3', (c, env) => {
      stageFloor(c, env);
      handwiredDesk(f, c, env, {
        ...THEATRE.desk,
        proscenium: false,
        windows: { monitor: { alpha: 0 }, notes: { alpha: 0 }, photos: { alpha: 0 } },
        wire: 0.45,
        lamp: 1 - 0.35 * smooth((t - 1) / 4),
        key: 'ch01-s03',
      });
      deskDockGlyphs(c, DESK_G.tiles, 0, OS_COLORS.ink, 0.82);
    });
    f.fog('B');
    // the lamp: off frame upper left, over the theatre (painted before L4 so its halo never washes the windows)
    f.practical({ x: 250, y: 60, kind: 'lamp', seed: 17, intensity: 0.35 + 0.45 * warm, radius: 120, layer: 'L3' });

    // L4: the windows. Photos at the frame's right edge with the last of its swing; Monitor the subject.
    const residual = 0.012 * Math.exp(-tq * 1.6) * Math.sin(tq * 7.4 + 0.8);
    const photosSt: WinState = { ...PHOTOS_OFF, swing: residual };
    const monSt: WinState = {};
    const footerU = smooth((tq - scene.footer + 0.05) / 0.5);
    const M = WIN.monitor;
    f.layer('L4', (c, env) => {
      windowThreads(c, env, WIN.monitor, monSt, THREAD_TOP);
      windowThreads(c, env, WIN.notes, {}, THREAD_TOP);
      windowThreads(c, env, WIN.photos, photosSt, THREAD_TOP);
      paperWindow(c, env, 'notes', WIN.notes, {}, {});
      paperWindow(c, env, 'photos', WIN.photos, photosSt, { photosClock: 99, photosRate: 12 });
      paperWindow(c, env, 'monitor', M, monSt, {
        subject: true,
        focused: true,
        rowsTick: tq,
        sidebarKick: bump(t, scene.network - 0.1, 0.15, 1.3),
        livePulse: bump(t, scene.live - 0.1, 0.12, 1.6),
        footer: footerU,
      });
      // the pool of lamp light settling on the sidebar as the lamp warms
      const pool = 0.16 * warm;
      if (pool > 0.005) {
        const px = M.x + M.w * 0.27, py = M.y + M.h * 0.38;
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.translate(px, py);
        c.scale(1, 1.25);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, M.w * 0.42);
        g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.5), pool));
        g.addColorStop(0.6, withAlpha(env.mood.halo, pool * 0.45));
        g.addColorStop(1, withAlpha(env.mood.halo, 0));
        c.fillStyle = g;
        c.fillRect(-M.w * 0.42, -M.w * 0.42, M.w * 0.84, M.w * 0.84);
        c.restore();
      }
    });
    f.rim({ x: 0, y: -1 });

    f.layer(PROSCENIUM, (c, env) => {
      proscenium(c, env, { title: 'HandwiredOS', titleA: 1, label: "one of Handwired's three live demos", labelA: 1 });
    });

    // the rest of the frame sinks as the light narrows: an elliptical vignette round Monitor (about a third down by
    // ~4 s) and the proscenium wing taken toward near-black ink
    const vig = smooth((t - 0.6) / 3.4);
    if (vig > 0.005) {
      const c = f.c;
      const a = toScreen(LAYERS.L4, cam, M.x, M.y);
      const b = toScreen(LAYERS.L4, cam, M.x + M.w, M.y + M.h);
      const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      const rx = (b.x - a.x) * 0.66, ry = (b.y - a.y) * 0.66;
      const dark = mixLab('#120b06', f.mood.ink, 0.3);
      c.save();
      c.translate(cx, cy);
      c.scale(1, ry / rx);
      const g = c.createRadialGradient(0, 0, rx * 0.72, 0, 0, rx * 1.35);
      g.addColorStop(0, withAlpha(dark, 0));
      g.addColorStop(0.45, withAlpha(dark, 0.3 * vig));
      g.addColorStop(1, withAlpha(dark, 0.36 * vig));
      c.fillStyle = g;
      c.fillRect(-4000, -4000, 8000, 8000);
      c.restore();
      // the wing: from the frame's left edge to the proscenium opening's inner edge
      const wingX = toScreen(PROSCENIUM, cam, DESK_G.desk.x - PRO.side + 12, 0).x;
      if (wingX > 0) {
        const wg = c.createLinearGradient(0, 0, wingX, 0);
        wg.addColorStop(0, withAlpha(dark, 0.72 * vig));
        wg.addColorStop(0.85, withAlpha(dark, 0.6 * vig));
        wg.addColorStop(1, withAlpha(dark, 0));
        c.fillStyle = wg;
        c.fillRect(0, 0, wingX, 720);
      }
    }
  },
});
