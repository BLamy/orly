/**
 * ch01-s03 — we push into Monitor and read the program's own numbers in its sidebar.
 *
 * The toy theatre of ch01-s02, closer: Monitor hangs at L4 in front of the dimmed desk flat (L3), haze between, the
 * proscenium's dark wing sliding out at frame left, Photos (settled where the drag left it) at the right edge. A
 * continuous dolly (z 385 → about 585, still moving at the cut) carries Monitor from about half the frame to two
 * thirds, while the lamp warms parchment → candleAmber (in 16 steps so the baked desk re-bakes only 16 times).
 *   'sidebar' (0.9 s): THIS PROGRAM · State 234 · Operations 4,646 · Outputs 493 (sized to be read from the
 *     first frame of the push: cap height >= 22 px @1080p at z 420).
 *   'footer' (L0103 'neural'): the footer strip slides up into view: 130 layers · 9,909 weights (only these two).
 *   'network' ('network'): the three sidebar figures get a brief warm kick.
 *   rows: the list's values tick on twos (the network's live state, not a picture of it).
 *   'live' ('live'): the ticking values pulse once together.
 */
import { Timeline, ease } from '../../../core';
import { cam3Interp, defineShot, windowWall } from '../../../film';
import type { Camera3 } from '../../../film';
import { handwiredDesk } from '../sets/handwiredDesk';
import { PROSCENIUM, THEATRE, WIN, paperWindow, proscenium, stageFloor, windowThreads, type WinState } from '../sets/ch01-s02-theatre';

const START: Camera3 = { x: 472, y: 336, z: 385, lens: 1 };
const END: Camera3 = { x: 466, y: 334, z: 600, lens: 1 };
/** where ch01-s02's drag left Photos (62 dragged + 26.2 glided along (-0.948, 0.318)) */
const PHOTOS_OFF = { dx: -0.948 * 88.2, dy: 0.318 * 88.2 };
const THREAD_TOP = 112;
const PAD = 320;

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
    const cam = tl.channel<Camera3>('cam', START, cam3Interp);
    // one long ease that is still moving at the cut (it carries into ch01-s04)
    tl.tween(cam, END, { at: 0, dur: T.duration + 1.6, ease: ease.move });
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
  paint(f, s, scene) {
    const t = f.t;
    const tq = f.tq;
    f.camera(s.get(scene.cam));
    // the lamp warms: parchment → candleAmber, quantised so cached art re-bakes in steps, not every frame
    const warm = Math.round(smooth((t - scene.push) / 4.6) * 16) / 16;
    f.setMood('candleAmber', { from: 'parchment', u: warm });
    f.backlight({ sunX: 560, intensity: 0.9 });

    f.layer('L2', (c, env) => {
      f.cached(`ch01-s03/L2/${env.mood.id}`, 1280 + 2 * PAD, 720 + PAD, (cc) => {
        cc.translate(PAD, PAD / 2);
        windowWall(cc, {
          x: -PAD, y: -60, w: 1280 + 2 * PAD, h: 760, centers: [-80, 250, 640, 1030, 1360], winW: 230, apex: 40, sill: 560,
          shape: 'flat', lights: 3, panes: { cols: 1, rows: 7 }, transoms: [], tracery: 'none', spandrel: 'none', pilasters: true, cornice: 60, wainscot: 0, glass: 0.6, seed: 23,
        }, env);
      })(c, -PAD, -PAD / 2);
    });
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
    });
    f.fog('B');
    // the lamp: off frame upper left, over the theatre (painted before L4 so its halo never washes the windows)
    f.practical({ x: 250, y: 60, kind: 'lamp', seed: 17, intensity: 0.35 + 0.45 * warm, radius: 120, layer: 'L3' });

    // L4: the windows. Photos at the frame's right edge with the last of its swing; Monitor the subject.
    const residual = 0.012 * Math.exp(-tq * 1.6) * Math.sin(tq * 7.4 + 0.8);
    const photosSt: WinState = { ...PHOTOS_OFF, swing: residual };
    const monSt: WinState = {};
    const footerU = smooth((tq - scene.footer + 0.05) / 0.5);
    f.layer('L4', (c, env) => {
      windowThreads(c, env, WIN.monitor, monSt, THREAD_TOP);
      windowThreads(c, env, WIN.notes, {}, THREAD_TOP);
      windowThreads(c, env, WIN.photos, photosSt, THREAD_TOP);
      paperWindow(c, env, 'notes', WIN.notes, {}, {});
      paperWindow(c, env, 'photos', WIN.photos, photosSt, { photosLit: 12 });
      paperWindow(c, env, 'monitor', WIN.monitor, monSt, {
        subject: true,
        focused: true,
        rowsTick: tq,
        sidebarKick: bump(t, scene.network - 0.1, 0.15, 1.3),
        livePulse: bump(t, scene.live - 0.1, 0.12, 1.6),
        footer: footerU,
      });
    });
    f.rim({ x: 0, y: -1 });

    f.layer(PROSCENIUM, (c, env) => {
      proscenium(c, env, { title: 'HandwiredOS', titleA: 1, label: "one of Handwired's three live demos", labelA: 1 });
    });
  },
});
