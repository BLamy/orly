/**
 * ch05-s04 — THE WALLPAPER IS THE LOOM (scene, candleAmber; lampChange in from the serverCyan tag line; 9.42 s).
 *   L0506 "Step back. The wallpaper draws these same threads: one arc per weight."
 *
 * The camera dollies back out of the loom's far end (sets/ch05-s01-loom3d, the real circuit) while the lamp warms from
 * serverCyan to candleAmber. Seen from further away the loom's threads resolve, ONE BY ONE, into the HandwiredOS
 * wallpaper of ch01-s04 (sets/circuit drawWallpaper: the upper half of an ellipse standing on the base line, from the
 * value a weight reads to the operation that reads it, laid out as src/handwiredos/wiring.ts lays it out): the morph
 * (loomToWallpaper) moves each of the 9,909 threads into its own arc, so the dissolve is literal. The frames fade; the
 * desk's paper comes up behind the arcs (sets/handwiredDesk, the same toy theatre as ch01-s02), and the three paper
 * windows (Monitor, Notes, Photos) and the dock slide into place in front on their threads; the copper wire under the
 * dock catches the light.
 *
 * TEACHES, word by word:
 *   back (0.60)       the dolly back starts; the lamp change runs
 *   wallpaper (2.55)  the threads have become the arcs; the windows slide in; the figures ink along the bottom in the
 *                     site's plain type, one at a time: 4,646 live operations · 130 layers · 9,909 weights
 *   threads (4.09)    a small card slides out from under Monitor: site check fails if 9,909 or 130 drift
 *   (hold)            the arcs breathe faintly; nothing on the desk moves
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { FONT, LAYERS, cam3Interp, cardInkAlpha, cardPaperAlpha, cardProbe, defineShot, legibleSize, mixLab, textProbe, textRole, toScreen, withAlpha } from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { TOTALS } from '../sets/circuit';
import { deskGeom, handwiredDesk } from '../sets/handwiredDesk';
import { loom3, loomToWallpaper, screenSpace } from '../sets/ch05-s01-loom3d';
import { loomRoom } from '../sets/ch05-s01-room';

type C2 = CanvasRenderingContext2D;
const ID = 'ch05-s04';
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const smr = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const seg = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));

/** the desk (L4 rest px); the wallpaper's rect exactly as sets/handwiredDesk lays it */
const DESK = { x: 230, y: 40, w: 820 };
const G = deskGeom(DESK);
const R = G.desk;
const WALL = { x: R.x + R.w * 0.02, y: R.y + R.h * 0.07, w: R.w * 0.96, h: R.h * 0.895 };
const WALL_ALPHA = Math.min(1, 2600 / TOTALS.storedWeights) * 0.5;
const C = (x: number, y: number, z: number): Camera3 => ({ x, y, z, lens: 1 });

interface Beats {
  D: number;
  back: number;
  wall: number;
  draws: number;
  same: number;
  check: number;
  m0: number;
  m1: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      back: T.beat('back'),
      wall: T.beat('wall'),
      draws: T.word('L0506', 'draws'),
      same: T.word('L0506', 'same'),
      check: T.beat('check'),
      m0: T.beat('back') + 0.15,
      m1: T.beat('wall') + 0.15,
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    // the lamp: serverCyan warming to candleAmber over the dolly back
    const warm = smr((t - 0.1) / 2.4);
    if (warm < 1) f.setMood('candleAmber', { from: 'serverCyan', u: warm });
    // the desk camera: a long dolly back with a slow turn (truck), then held
    const cam = cam3Interp(C(700, 330, 230), C(640, 352, -20))(smr((t - b.back + 0.4) / 3.6));
    f.camera(cam);
    // the loom's own camera: out of its far end, pulling back
    const lc = cam3Interp(C(760, 334, 120), C(700, 330, -900))(smr((t - b.back + 0.4) / 2.6));
    const morph = smr((t - b.m0) / (b.m1 - b.m0));
    const frames = 1 - seg(t, b.m0 + 0.2, b.m0 + 1.3);
    const desk = seg(t, b.wall - 0.5, b.wall + 0.4);
    const arcsOut = seg(t, b.wall + 0.25, b.wall + 0.75);
    const win = seg(t, b.wall - 0.15, b.wall + 0.75);
    const room = 1 - seg(t, b.wall - 0.6, b.wall + 0.3);

    if (room > 0.01) loomRoom(f, lc, { key: ID, cams: [lc, C(700, 330, -900), C(760, 334, 120)], sunX: 900, tubes: 0.6 * room, light: 0.8 });
    else f.backlight({ sunX: 640, intensity: 0.6 });
    if (frames > 0.01) loom3(f, { cam: lc, threads: 0, frameAlpha: () => frames, minBlur: 1.2, dof: 2, focusZ: 900, fog: false });

    // the desk comes up behind the arcs; then its windows slide in on their threads
    f.layer('L4', (c, env) => {
      if (desk > 0.01) {
        c.save();
        c.globalAlpha = desk;
        handwiredDesk(f, c, env, {
          ...DESK,
          key: ID,
          lamp: 0.92,
          wire: 0.25 + 0.5 * seg(t, b.wall + 0.4, b.wall + 1.2),
          windows: {
            monitor: { dy: -90 * (1 - win), alpha: win },
            notes: { dy: -110 * (1 - seg(t, b.wall, b.wall + 0.85)), alpha: seg(t, b.wall, b.wall + 0.85) },
            photos: { dy: -100 * (1 - seg(t, b.wall + 0.1, b.wall + 0.95)), alpha: seg(t, b.wall + 0.1, b.wall + 0.95) },
          },
          dockLift: 0.3 * (1 - seg(t, b.wall + 0.3, b.wall + 1.1)),
        });
        c.restore();
      }
      // the morph: every thread into its own arc (screen space; the target is the wallpaper's rect under this camera)
      if (arcsOut < 1) {
        const a = toScreen(LAYERS.L4, cam, WALL.x, WALL.y), z = toScreen(LAYERS.L4, cam, WALL.x + WALL.w, WALL.y + WALL.h);
        c.save();
        screenSpace(c, LAYERS.L4, cam);
        loomToWallpaper(c, env, lc, morph, { x: a.x, y: a.y, w: z.x - a.x, h: z.y - a.y }, {
          alpha: (WALL_ALPHA + (1 - morph) * 0.1) * (1 - arcsOut) * (0.6 + 0.4 * (1 - desk) + 0.4 * desk),
          lineWidth: Math.max(0.35, ((z.x - a.x) / 1232) * 0.5) * (1 + (1 - morph) * 0.6),
        });
        c.restore();
      }
      // the card from under Monitor, then the figures (the figures sit above the card in paint order)
      checkCard(c, env, t, b);
    });
    f.rim({ x: 0, y: -1 });
    figures(f.c, f.mood, t, b);
  },
});

/** the three figures along the bottom of the frame, in the site's plain type, one at a time */
function figures(c: C2, mood: PaintEnv['mood'], t: number, b: Beats) {
  const parts = ['4,646 live operations', '130 layers', '9,909 weights'];
  const at = [b.wall + 0.05, b.draws + 0.05, b.same + 0.05];
  c.save();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `400 22px ${FONT.mono}`, 22, parts.join(' · '));
    c.font = `400 ${size.toFixed(2)}px ${FONT.mono}`;
    const sep = '  ·  ';
    const ws = parts.map((p) => c.measureText(p).width);
    const sw = c.measureText(sep).width;
    const total = ws.reduce((a, w) => a + w, 0) + 2 * sw;
    let x = 640 - total / 2;
    const y = 618;
    const a0 = seg(t, at[0] - 0.05, at[0] + 0.3);
    if (a0 > 0) {
      c.fillStyle = withAlpha(mixLab(mood.ink, mood.fg, 0.4), 0.55 * a0);
      c.beginPath();
      c.roundRect(640 - total / 2 - 20, y - size * 1.05, total + 40, size * 1.55, 5);
      c.fill();
    }
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    parts.forEach((p, i) => {
      const a = seg(t, at[i] - 0.05, at[i] + 0.3);
      c.fillStyle = withAlpha(mixLab(mood.core, '#fff4dc', 0.2), a);
      c.fillText(p, x, y);
      textProbe(c, `${ID}-fig${i}`, x, y - size, ws[i], size * 1.2, a);
      x += ws[i];
      if (i < 2) {
        c.fillStyle = withAlpha(mixLab(mood.core, '#fff4dc', 0.2), 0.7 * seg(t, at[i + 1] - 0.05, at[i + 1] + 0.3));
        c.fillText(sep, x, y);
        x += sw;
      }
    });
  });
  c.restore();
}

/** a small card slides out from under Monitor's bottom edge on 'threads' (paper and ink together) */
function checkCard(c: C2, env: PaintEnv, t: number, b: Beats) {
  const mon = G.win.monitor;
  const slide = smr((t - b.check + 0.1) / 0.7);
  const inkAt = b.check + 0.05;
  const ink = cardInkAlpha(t, inkAt);
  const paper = Math.min(cardPaperAlpha(t, inkAt), 1);
  if (paper <= 0.01) return;
  const w = 268, h = 40;
  const x = mon.x + mon.w * 0.12;
  const y = mon.y + mon.h - h + (h + 6) * slide;
  c.save();
  // the card is tucked UNDER Monitor: clip away what is still behind the window's sheet
  c.beginPath();
  c.rect(x - 10, mon.y + mon.h, w + 20, h + 40);
  c.clip();
  c.globalAlpha = paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.22);
  c.fillRect(x + 2, y + 3, w, h);
  c.fillStyle = mixLab(mixLab('#fffdf8', env.mood.halo, 0.2), env.mood.haze, 0.05);
  c.fillRect(x, y, w, h);
  c.strokeStyle = withAlpha('#1e1a16', 0.3);
  c.lineWidth = 0.7;
  c.strokeRect(x, y, w, h);
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `italic 400 15px ${FONT.text}`, 15, 'site check fails if 9,909 or 130 drift');
    c.font = `italic 400 ${size.toFixed(2)}px ${FONT.text}`;
    c.fillStyle = withAlpha(mixLab('#1e1a16', env.mood.ink, 0.25), ink);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('site check fails if 9,909 or 130 drift', x + w / 2, y + h / 2 + 1);
    textProbe(c, `${ID}-check`, x + 6, y + 4, w - 12, h - 8, ink);
  });
  cardProbe(c, `${ID}-check-card`, x, y, w, h, paper, ink);
  c.restore();
}
