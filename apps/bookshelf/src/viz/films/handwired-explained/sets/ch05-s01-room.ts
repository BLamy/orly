/**
 * handwired-explained — ch05-s01..s03, s05: THE LOOM'S WORKSHOP (owned by the ch05-s01..s05 author).
 *
 * "A dark workshop of light": a far wall of tall paned workshop windows (the serverCyan night sky through their
 * holes, z 5600, well behind the loom's last frame), a dark plank floor in true perspective under the loom (drawn
 * with the loom's own projection, so the frames stand on it at every camera), and a few hanging fluorescent tubes
 * over the loom's length (practicals, painted before the loom so the frames occlude them).
 *
 *   loomRoom(f, cam, { key, cams })      backlight + far wall + floor + tubes (call first, then loom3(...))
 *   ROOM_FAR                             the wall's layer spec
 */
import type { Camera3, Frame, LayerSpec } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, toLayer } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { windowWall } from '../../../film/silhouette/architecture';
import { LOOM, frameX, frameZ, project, screenSpace, scaleAt } from './ch05-s01-loom3d';

export const ROOM_FAR: LayerSpec = { id: 'loom-wall', z: 5600, haze: 0.42, blur: 3 };
const FLOOR: LayerSpec = { id: 'loom-floor', z: 2400, haze: 0.3, blur: 0 };

export interface RoomOpts {
  key: string;
  /** every camera of the shot's move (the wall is baked wide enough for all of them) */
  cams: Camera3[];
  sunX?: number;
  /** tubes' intensity (0 = off) */
  tubes?: number;
  /** backlight intensity */
  light?: number;
  /** 0..1 how much darker the wall and floor are than the mood's set colour (review r1: 0.25, so the backlit
   *  lattices glow against shadow as the windows do in the reference) */
  dim?: number;
  /** 0..1 an extra (unbaked) shadow over the far wall: a camera deep inside the loom sees the windows large, so this
   *  keeps the wall at the value it has in ch05-s01 */
  veil?: number;
}

export function loomRoom(f: Frame, cam: Camera3, o: RoomOpts) {
  const dim = o.dim ?? 0.25;
  const SHADOW = '#020304';
  f.backlight({ sunX: o.sunX ?? 1060, intensity: o.light ?? 0.8 });
  f.layer(ROOM_FAR, (c, env) => {
    const r = overscan(ROOM_FAR, o.cams, 40);
    const x0 = Math.floor(r.x / 100) * 100 - 100, w = Math.ceil((r.w + 200) / 100) * 100 + 100;
    const y0 = Math.min(-80, Math.floor(r.y)), h = Math.max(900, Math.ceil(r.y + r.h) - y0 + 40);
    f.cached(`${o.key}/loom-wall/${env.mood.id}/${dim}/${x0},${w},${y0},${h}`, w, h, (cc) => {
      cc.translate(-x0, -y0);
      const centers: number[] = [];
      for (let cx = x0 + 60; cx < x0 + w; cx += 300) centers.push(cx);
      windowWall(cc, {
        x: x0, y: y0, w, h, centers, winW: 170, apex: 70, sill: 520, shape: 'flat', lights: 2, panes: { cols: 2, rows: 9 },
        transoms: [], tracery: 'none', spandrel: 'none', pilasters: true, cornice: 50, wainscot: 0, glass: 0.55, seed: 51,
      }, env);
      // the wall below the sills, down past the floor line
      cc.fillStyle = env.fill('set');
      cc.fillRect(x0, 520, w, y0 + h - 520);
      // the wall in shadow: darken what is painted (the window holes stay open to the backlight)
      if (dim > 0) {
        cc.globalCompositeOperation = 'source-atop';
        cc.fillStyle = withAlpha(SHADOW, dim);
        cc.fillRect(x0, y0, w, h);
        cc.globalCompositeOperation = 'source-over';
      }
    })(c, x0, y0);
    if ((o.veil ?? 0) > 0.002) {
      c.fillStyle = withAlpha(SHADOW, o.veil!);
      c.fillRect(x0, y0, w, h);
    }
  });
  // the floor: dark planks in perspective, from just in front of the post to the far wall
  f.layer(FLOOR, (c, env) => {
    c.save();
    screenSpace(c, FLOOR, cam);
    const zNear = Math.max(cam.z + 120, 700), zFar = ROOM_FAR.z;
    const yNear = 360 + (LOOM.floor - cam.y) * scaleAt(zNear, cam);
    const yFar = 360 + (LOOM.floor - cam.y) * scaleAt(zFar, cam);
    const g = c.createLinearGradient(0, yFar, 0, Math.max(yNear, 720));
    g.addColorStop(0, mixLab(mixLab(env.mood.set, env.mood.haze, 0.45), SHADOW, dim * 0.8));
    g.addColorStop(0.2, mixLab(mixLab(env.mood.set, env.mood.fg, 0.2), SHADOW, dim));
    g.addColorStop(1, mixLab(mixLab(env.mood.fg, env.mood.set, 0.2), SHADOW, dim));
    c.fillStyle = g;
    c.fillRect(-20, yFar, 1320, 760 - yFar);
    // plank seams running into depth (constant world x), and a few cross seams
    c.strokeStyle = withAlpha(env.mood.fg, 0.35);
    c.lineWidth = 0.8;
    c.beginPath();
    for (let X = -2400; X <= 6000; X += 90) {
      const a = project({ x: X, y: LOOM.floor, z: zNear }, cam);
      const b = project({ x: X, y: LOOM.floor, z: zFar }, cam);
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
    }
    c.stroke();
    // the window light lying on the boards (a soft sheen toward the far wall)
    c.globalCompositeOperation = 'lighter';
    const sh = c.createLinearGradient(0, yFar, 0, yFar + 90);
    sh.addColorStop(0, withAlpha(env.mood.halo, 0.16));
    sh.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = sh;
    c.fillRect(-20, yFar, 1320, 90);
    c.restore();
  });
  // tube lamps hanging over the loom (behind the near frames: painted before the loom)
  const I = o.tubes ?? 0.8;
  if (I > 0) {
    [24, 62, 104].forEach((l, i) => {
      const p = project({ x: frameX(l) + 40, y: -40, z: frameZ(l) }, cam);
      if (p.x < -200 || p.x > 1480) return;
      const q = toLayer(LAYERS.L4, cam, p.x, p.y);
      f.practical({ x: q.x, y: q.y, kind: 'tube', seed: 71 + i * 13, intensity: I * (0.55 + 0.25 * (1 - i / 3)), radius: 40 * Math.min(1.4, p.s + 0.3), layer: 'L4' });
    });
  }
}
