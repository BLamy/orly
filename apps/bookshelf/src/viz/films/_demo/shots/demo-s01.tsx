/**
 * Demo shot 1 — a panelled reading room at dusk (duskRose). Exercises every Frame
 * feature: L0 backlight, L1 far skyline through window holes, L2 tracery wall,
 * floor pass, fog A/B, L3 pierced chairs + fringed table, L4 scholar + candle stand
 * with rim, a candle practical, L5 drape, L6 pillar; truck + push-in camera.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film/contracts';
import { CAMERA3_HOME, LAYERS } from '../../../film/contracts';
import { defineShot } from '../../../film/core/shot';
import { cam3Interp, camMove, overscan, type Rect } from '../../../film/core/multiplane';
import { backWall, candleStand, chair, checkerFloor, curtain, drawGentleman, pillar, skyline, table } from '../sets';

const FLOOR: LayerSpec = { id: 'floor', z: 1300, haze: 0.1, blur: 0 };
const END = camMove(80, 110);
const ext = (l: LayerSpec, pad = 24) => overscan(l, [CAMERA3_HOME, END], pad);

/** bake static art covering `r` (layer coords) once, then place it */
function bake(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, key: string, r: Rect, paint: (c: CanvasRenderingContext2D) => void) {
  f.cached(`demo-s01/${key}/${env.mood.id}`, r.w, r.h, (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
}

const CANDLE = { x: 452, y: 662 };

export default defineShot({
  id: 'demo-s01',
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    const cam = tl.channel<Camera3>('cam', CAMERA3_HOME, cam3Interp);
    tl.tween(cam, END, { at: 0, dur: T.duration, ease: ease.move });
    const glow = tl.channel('glow', 0.82);
    tl.tween(glow, 1.0, { at: T.beat('candle') - 0.4, dur: 1.2, ease: ease.move });
    tl.hold(0, T.duration);
    return { tl, cam, glow };
  },
  paint(f, s, scene) {
    f.camera(s.get(scene.cam));
    f.backlight({ sunX: 600 });
    f.layer('L1', (c, env) => {
      const r = ext(LAYERS.L1);
      bake(f, c, env, 'sky', r, (cc) => skyline(cc, env, r.x, r.x + r.w, 520, 7));
    });
    f.layer('L2', (c, env) => {
      const r = ext(LAYERS.L2, 40);
      bake(f, c, env, 'wall', r, (cc) =>
        backWall(cc, env, {
          x0: r.x,
          x1: r.x + r.w,
          y0: r.y,
          y1: 700,
          windows: [
            { x: 236, y: 92, w: 196, h: 388 },
            { x: 852, y: 92, w: 196, h: 388 },
            ...(r.x < -120 ? [{ x: -380, y: 92, w: 196, h: 388 }] : []),
            ...(r.x + r.w > 1500 ? [{ x: 1468, y: 92, w: 196, h: 388 }] : []),
          ],
        }),
      );
    });
    f.layer(FLOOR, (c, env) => {
      const r = ext(FLOOR, 40);
      bake(f, c, env, 'floor', { x: r.x, y: 560, w: r.w, h: r.y + r.h - 560 }, (cc) => checkerFloor(cc, env, r.x, r.x + r.w, 572, r.y + r.h, 432));
    });
    f.fog('A');
    f.layer('L3', (c, env) => {
      bake(f, c, env, 'furniture', { x: 250, y: 330, w: 800, h: 330 }, (cc) => {
        chair(cc, env, 548, 590, 1);
        chair(cc, env, 742, 590, 1);
        table(cc, env, 330, 970, 520, 650);
      });
    });
    f.fog('B');
    f.layer('L4', (c, env) => {
      candleStand(c, env, CANDLE.x, CANDLE.y);
      drawGentleman(c, env, 820, 668, 1.24, 'left', Math.sin(env.tq * 1.7));
    });
    f.rim();
    f.practical({ x: CANDLE.x, y: CANDLE.y - 268, kind: 'candle', seed: 11, intensity: s.get(scene.glow), radius: 86 });
    f.layer('L5', (c, env) => {
      bake(f, c, env, 'curtain', { x: -200, y: -120, w: 420, h: 960 }, (cc) => curtain(cc, env, -120, 260, 420, 760));
    });
    f.layer('L6', (c, env) => {
      bake(f, c, env, 'pillar', { x: 1120, y: -120, w: 360, h: 980 }, (cc) => pillar(cc, env, 1214, 104));
    });
  },
});
