/**
 * Demo shot 2 — a frozen street at nightfall (winterBlue). Lamps are lit one by one on
 * the 'lamps' beat; snow falls in three depths (dynamic content in sharp and blurred
 * layers); slow truck left with a slight push.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film/contracts';
import { CAMERA3_HOME, LAYERS } from '../../../film/contracts';
import { defineShot } from '../../../film/core/shot';
import { cam3Interp, camMove, overscan, type Rect } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { bareTree, drawGentleman, lampPost, lanternGlass, skyline, snow, townhouses } from '../sets';

const START = camMove(70, 0);
const END = camMove(-70, 90);
const STREET: LayerSpec = { id: 'street', z: 1150, haze: 0.08, blur: 0 };
const ext = (l: LayerSpec, pad = 24) => overscan(l, [START, END], pad);
const LAMPS = [250, 640, 1030];
const BASE = 652;

function bake(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, key: string, r: Rect, paint: (c: CanvasRenderingContext2D) => void) {
  f.cached(`demo-s02/${key}/${env.mood.id}`, r.w, r.h, (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
}

const smooth = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export default defineShot({
  id: 'demo-s02',
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    const cam = tl.channel<Camera3>('cam', START, cam3Interp);
    tl.tween(cam, END, { at: 0, dur: T.duration, ease: ease.move });
    tl.hold(0, T.duration);
    return { tl, cam, lampsAt: T.beat('lamps') };
  },
  paint(f, s, scene) {
    f.camera(s.get(scene.cam));
    f.backlight({ sunX: 760, intensity: 0.9 });
    f.layer('L1', (c, env) => {
      const r = ext(LAYERS.L1);
      bake(f, c, env, 'city', r, (cc) => skyline(cc, env, r.x, r.x + r.w, 540, 23));
    });
    f.layer('L2', (c, env) => {
      const r = ext(LAYERS.L2, 40);
      bake(f, c, env, 'houses', { x: r.x, y: 200, w: r.w, h: 480 }, (cc) => {
        townhouses(cc, env, r.x, r.x + r.w, 610, 9);
        cc.fillStyle = env.fill('set');
        cc.fillRect(r.x, 606, r.w, 80);
      });
    });
    f.fog('A');
    f.layer(STREET, (c, env) => {
      const r = ext(STREET, 40);
      bake(f, c, env, 'street', { x: r.x, y: 590, w: r.w, h: r.y + r.h - 590 }, (cc) => {
        const g = cc.createLinearGradient(0, 600, 0, 760);
        g.addColorStop(0, mixLab(env.mood.haze, env.mood.sky[3], 0.4));
        g.addColorStop(0.3, mixLab(env.mood.haze, env.mood.set, 0.5));
        g.addColorStop(1, mixLab(env.mood.set, env.mood.fg, 0.5));
        cc.fillStyle = g;
        cc.fillRect(r.x, 600, r.w, r.y + r.h - 600);
        // kerb + wheel ruts
        cc.fillStyle = withAlpha(env.mood.fg, 0.35);
        cc.fillRect(r.x, 606, r.w, 3);
        cc.strokeStyle = withAlpha(env.mood.fg, 0.18);
        cc.lineWidth = 2;
        for (const y of [672, 690, 716, 738]) {
          cc.beginPath();
          cc.moveTo(r.x, y);
          cc.lineTo(r.x + r.w, y + 4);
          cc.stroke();
        }
      });
    });
    f.layer('L3', (c, env) => {
      bake(f, c, env, 'trees', { x: -260, y: 120, w: 1800, h: 520 }, (cc) => {
        cc.fillStyle = env.fill('ink');
        for (const [x, sc, seed] of [[60, 1.55, 3], [470, 1.25, 8], [910, 1.45, 12], [1330, 1.3, 4]] as const) {
          cc.save();
          cc.translate(x, 616);
          cc.scale(sc, sc);
          cc.fill(bareTree(seed));
          cc.restore();
        }
        // iron railings
        for (let x = -250; x < 1540; x += 11) cc.fillRect(x, 572, 2, 44);
        cc.fillRect(-250, 578, 1790, 3);
        cc.fillRect(-250, 604, 1790, 3);
      });
    });
    f.fog('B');
    const lit = LAMPS.map((_, i) => smooth((f.t - scene.lampsAt - i * 0.6) / 0.3));
    f.layer('L4', (c, env) => {
      LAMPS.forEach((x, i) => {
        lampPost(c, env, x, BASE);
        lanternGlass(c, env, x, BASE, lit[i]);
      });
      // the lamplighter, his pole raised toward the next lamp
      drawGentleman(c, env, 732, BASE + 6, 1.0, 'left');
      c.strokeStyle = env.fill('ink');
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(732 - 46, BASE - 170);
      c.lineTo(651, BASE - 224);
      c.stroke();
      snow(c, env, 90, 31, 1.3, 38, 0.7, f.t);
    });
    f.rim({ x: 0.45, y: -0.9 });
    LAMPS.forEach((x, i) => {
      if (lit[i] > 0) f.practical({ x, y: BASE - 236, kind: 'lamp', seed: 21 + i, intensity: lit[i], radius: 56 });
    });
    f.layer('L5', (c, env) => snow(c, env, 22, 77, 3.4, 60, 0.55, f.t));
    f.layer('L6', (c, env) => {
      bake(f, c, env, 'branch', { x: -300, y: -260, w: 820, h: 560 }, (cc) => {
        cc.fillStyle = env.fill('fg');
        cc.save();
        cc.translate(-120, -40);
        cc.rotate(1.05);
        cc.scale(2.6, 2.6);
        cc.fill(bareTree(41));
        cc.restore();
      });
    });
  },
});
