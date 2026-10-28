/**
 * ch01-s02 — the HandwiredOS desk is revealed as a paper toy theatre, and a dragged window glides and settles.
 *
 * The camera pulls back and up from the dock of ch01-s01 (it opens with the dock tiles where s01 left them, at the
 * same scale) to a wide on the toy theatre: the desk flat at L3 (paper, dot grid, the real 9,909-arc wallpaper, the
 * dock over the one copper wire), three paper windows hung on fine threads at L4 in front of it, a black card
 * proscenium a hair nearer whose marquee board carries the title (HandwiredOS) and the label (one of Handwired's
 * three live demos), the stage floor under the desk, and the workshop's paned window wall far behind at L2.
 *   'windows' (L0101 'windows'): Monitor, Notes, Photos each get a brief rim kick in turn; the label inks.
 *   'dock' ('dock'): the three tiles lift a hair and settle.
 *   'photos' ('photographs'): Photos' twelve cells catch the light in reading order, one tick each, on twos.
 *   'drag' (L0102 'Drag'): a small paper cursor presses Photos' title bar and drags it left and down, accelerating.
 *   'glides' ('glides'): release; the window carries on alone along the same path, slowing (its momentum).
 *   'settles' ('settles'): it eases to rest; its threads swing once and still.
 * After the settle the camera starts to drift toward Monitor, the subject of ch01-s03 (crossfade).
 */
import { Timeline, ease } from '../../../core';
import { CAMERA3_HOME, cam3Interp, defineShot, windowWall } from '../../../film';
import type { Camera3, PaintEnv } from '../../../film';
import { handwiredDesk } from '../sets/handwiredDesk';
import { PROSCENIUM, THEATRE, WIN, cursorArrow, paperWindow, proscenium, stageFloor, windowThreads, type WinState } from '../sets/ch01-s02-theatre';

/** opening camera: the dock where ch01-s01 left it (desk tiles 44 px wide, the wire's centre at (606, 418));
 *  L3 rest scale k = s·z/1000 = 1.2865 → s = 0.9896 → z = 289.5 */
const START: Camera3 = { x: 674.4, y: 601, z: 289.5, lens: 1 };
/** after the settle: drifting toward Monitor (ch01-s03 opens closer still) */
const DRIFT: Camera3 = { x: 540, y: 330, z: 190, lens: 1 };
const THREAD_TOP = 112;
const DIR = { x: -0.948, y: 0.318 };
const D1 = 62; // the drag (ease-in: the hand speeds up)
const DRAG_V_END = 2; // d/ds of s^2 at s = 1
const PAD = 320;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
/** a quick kick that decays (0 before t0) */
const kick = (t: number, t0: number, decay = 3) => (t < t0 ? 0 : smooth((t - t0) / 0.08) * Math.exp(-(t - t0) * decay));

export default defineShot({
  id: 'ch01-s02',
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    const cam = tl.channel<Camera3>('cam', START, cam3Interp);
    tl.tween(cam, CAMERA3_HOME, { at: 0, dur: 2.7, ease: ease.move });
    const settles = T.beat('settles');
    tl.tween(cam, DRIFT, { at: settles + 0.2, dur: 3.2, ease: ease.move });
    tl.hold(0, T.duration);
    const drag = T.beat('drag');
    const glides = T.beat('glides');
    return {
      tl,
      cam,
      reveal: T.beat('reveal'),
      windows: T.beat('windows'),
      dock: T.beat('dock'),
      photos: T.beat('photos'),
      drag,
      glides,
      settles,
      dragDur: glides - drag,
      glideDur: 1.0,
    };
  },
  paint(f, s, scene) {
    const t = f.t;
    const tq = f.tq;
    f.camera(s.get(scene.cam));

    // ---- Photos' path (cut paper: on twos)
    const D2 = ((D1 * DRAG_V_END) / scene.dragDur) * (scene.glideDur / 3);
    let along = 0;
    let speed = 0; // 0..1 of the release speed
    if (tq >= scene.drag && tq < scene.glides) {
      const u = (tq - scene.drag) / scene.dragDur;
      along = D1 * u * u;
      speed = u;
    } else if (tq >= scene.glides) {
      const u = clamp01((tq - scene.glides) / scene.glideDur);
      along = D1 + D2 * (1 - Math.pow(1 - u, 3));
      speed = Math.pow(1 - u, 2);
    }
    const rest = tq - scene.settles;
    const swingFree = rest > 0 ? 0.032 * Math.exp(-rest * 3.2) * Math.sin((rest * Math.PI * 2) / 0.85) : 0;
    const photosSt: WinState = {
      dx: DIR.x * along,
      dy: DIR.y * along,
      swing: DIR.x * 0.04 * speed * (rest > 0 ? Math.max(0, 1 - rest * 4) : 1) + swingFree,
      rim: kick(t, scene.windows + 0.44),
    };
    const monSt: WinState = { rim: kick(t, scene.windows) };
    const notesSt: WinState = { rim: kick(t, scene.windows + 0.22) };
    const lit = tq >= scene.photos ? Math.min(12, Math.floor((tq - scene.photos) * 12 + 1e-6) + 1) : 0;
    const lift = t < scene.dock ? 0 : smooth((t - scene.dock) / 0.15) * (1 - smooth((t - scene.dock - 0.5) / 0.5));

    f.backlight({ sunX: 640, intensity: 0.8 });

    // L2: the workshop's tall paned window wall, far behind the theatre (the same wall as ch01-s05's workshop)
    f.layer('L2', (c, env) => {
      f.cached(`ch01-s02/L2/${env.mood.id}`, 1280 + 2 * PAD, 720 + PAD, (cc) => {
        cc.translate(PAD, PAD / 2);
        windowWall(cc, {
          x: -PAD, y: -60, w: 1280 + 2 * PAD, h: 760, centers: [-80, 250, 640, 1030, 1360], winW: 230, apex: 40, sill: 560,
          shape: 'flat', lights: 3, panes: { cols: 1, rows: 7 }, transoms: [], tracery: 'none', spandrel: 'none', pilasters: true, cornice: 60, wainscot: 0, glass: 0.6, seed: 23,
        }, env);
      })(c, -PAD, -PAD / 2);
    });
    f.fog('A');

    // L3: the desk flat (its windows are hung in front, at L4)
    f.layer('L3', (c, env) => {
      stageFloor(c, env);
      handwiredDesk(f, c, env, {
        ...THEATRE.desk,
        proscenium: false,
        windows: { monitor: { alpha: 0 }, notes: { alpha: 0 }, photos: { alpha: 0 } },
        dockLift: lift,
        wire: 0.45 + 0.25 * lift,
        key: 'ch01-s02',
      });
    });
    f.fog({ yCenter: 600, height: 110, alpha: 0.1, drift: 6 });

    // L4: the hanging windows (Monitor, Notes, then Photos on top: the focused one), threads, the cursor
    f.layer('L4', (c, env) => {
      windowThreads(c, env, WIN.monitor, monSt, THREAD_TOP);
      windowThreads(c, env, WIN.notes, notesSt, THREAD_TOP);
      windowThreads(c, env, WIN.photos, photosSt, THREAD_TOP);
      paperWindow(c, env, 'monitor', WIN.monitor, monSt, { rowsTick: tq });
      paperWindow(c, env, 'notes', WIN.notes, notesSt, {});
      paperWindow(c, env, 'photos', WIN.photos, photosSt, { focused: true, photosLit: lit });
      paintCursor(c, env, tq, scene, along);
    });
    f.rim({ x: 0, y: -1 });

    // the proscenium: black card, valance and the marquee (title from the reveal, the label on 'windows')
    f.layer(PROSCENIUM, (c, env) => {
      proscenium(c, env, {
        title: 'HandwiredOS',
        titleA: smooth((t - scene.reveal - 0.7) / 0.8),
        label: "one of Handwired's three live demos",
        labelA: smooth((t - scene.windows) / 0.45),
      });
    });

  },
});

/** the paper cursor: comes in from the lower right, presses Photos' title bar, drags, lets go, fades */
function paintCursor(c: CanvasRenderingContext2D, env: PaintEnv, tq: number, sc: { drag: number; glides: number; settles: number }, along: number) {
  const r = WIN.photos;
  const grab = { x: r.x + r.w * 0.62, y: r.y + 9 };
  const tIn = sc.drag - 0.7;
  if (tq < tIn) return;
  let x: number, y: number, press = 0;
  if (tq < sc.drag - 0.06) {
    const u = smooth((tq - tIn) / 0.6);
    x = grab.x + 150 * (1 - u);
    y = grab.y + 120 * (1 - u) - Math.sin(u * Math.PI) * 18;
  } else {
    press = tq < sc.glides ? smooth((tq - sc.drag + 0.06) / 0.08) : 1 - smooth((tq - sc.glides) / 0.1);
    // the cursor travels with the bar until the release, then stays where it let go
    const dragOnly = Math.min(along, D1);
    x = grab.x + DIR.x * dragOnly;
    y = grab.y + DIR.y * dragOnly;
  }
  const a = smooth((tq - tIn) / 0.25) * (1 - smooth((tq - sc.settles - 0.1) / 0.5));
  cursorArrow(c, env, x, y, press, a);
}

