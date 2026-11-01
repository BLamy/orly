/**
 * ch04-s02 — Kenton Varda's desk, screen-left, October 2026; then both desks in one frame (duskRose, cut in).
 *
 * The two-desk stage (sets/ch04-s01-study.ts): Kenton Varda's flat at the LEFT with its small window, Ryan Dahl's
 * flat at the RIGHT, the dark harbour hill and the far town between them at L1. L3 a shelf edge; L4 the desks and
 * figures; L5 the near floor lip. Close on Kenton Varda's desk, then the pull back and truck right (≈ 240 px over
 * 4 s) that brings both lamps into one frame.
 *
 *   name       4.57  name card: Kenton Varda · Cloudflare (upper left)
 *   gap        7.01  label 'Varda: workerd's one gap, Durable Objects' (upper right)
 *   single    10.63  a paper lantern under a glass bell jar on the desk: one room, one instance; on 'scale' it
 *                    lifts against the glass and settles (unable to leave its jar)
 *   delighted 24.48  his lamp brightens one step: the only response we give him
 *   pull      26.98  'frame': pull back and truck right until both desks share the frame
 *   braid     29.23  the two lamp ropes swing in and cross once over the hill
 * The figures stay at their desks; nobody's hands touch the ropes. Text in the upper half; nothing below y 634.
 */
import { Timeline } from '../../../core';
import { bookshelfWall, defineShot, nameCard, withAlpha } from '../../../film';
import type { Camera3 } from '../../../film';
import { camAt, label, lerp, pulse, seg, sm, twos, type CamKey } from '../sets/common';
import { desk, deskAnchors, deskFigure, lampStep } from '../sets/historyDesk';
import { STAGE, bellJar, lampHook, twoDeskBack, twoRopes } from '../sets/ch04-s01-study';

const ID = 'ch04-s02';
const K = STAGE.kenton;
const R = STAGE.ryan;
const TOP_Y = 600 - 76 * (320 / 175) * 1.05;
const JAR = { x: 336, y: TOP_Y };
const CLOSE: Camera3 = { x: 372, y: 392, z: 330, lens: 1 };
const WIDE: Camera3 = { x: 670, y: 374, z: 0, lens: 1 };

export default defineShot({
  id: ID,
  mood: 'duskRose',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      name: T.beat('name'),
      gap: T.beat('gap'),
      single: T.beat('single'),
      scale: T.word('L0408', 'scale'),
      delighted: T.beat('delighted'),
      pull: T.beat('pull'),
      braid: T.beat('braid'),
    };
    const cams: CamKey[] = [
      { t: 0, cam: CLOSE },
      { t: b.pull - 0.4, cam: { ...CLOSE, x: CLOSE.x + 14, z: CLOSE.z + 24 } },
      { t: Math.min(b.D - 0.1, b.pull + 3.7), cam: WIDE },
    ];
    return { tl, b, cams };
  },
  paint(f, _s, sc) {
    const { b, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    const all = cams.map((k) => k.cam);
    void all;
    f.camera(cam);
    const ka = deskAnchors(K);
    const ra = deskAnchors(R);
    const kLamp = lampStep(t, b.delighted - 0.1, 0.78, 1);
    f.backlight({ sunX: 670, sunY: 420, intensity: 0.5 });
    twoDeskBack(f, { lamps: 0.55, key: ID });
    f.fog({ yCenter: 470, height: 200, alpha: 0.1, drift: 5 });
    f.layer('L3', (c, env) => {
      const r = { x: -360, y: 80, w: 420, h: 560 };
      f.cached(`dou/${ID}/shelf/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        bookshelfWall(cc, { x: -330, y: 110, w: 360, h: 520, bays: 2, shelves: 5, seed: 402, backTone: 0.2 }, env);
      })(c, r.x, r.y);
    });
    f.layer('L4', (c, env) => {
      desk(c, env, { ...K, lamp: 1, screen: 0.75 });
      desk(c, env, { ...R, lamp: 1, screen: 0.75 });
      // the bell jar: one room, one instance; on 'scale' the lantern lifts against the glass and settles
      const jarIn = seg(t, b.single - 0.2, b.single + 0.35);
      const bump = pulse(t, b.scale - 0.05, 0.25, 0.1, 0.5);
      bellJar(c, env, { x: JAR.x, y: JAR.y - 2 * bump, lit: 0.55 + 0.25 * kLamp, alpha: jarIn, tq });
      deskFigure(c, env, { ...K, tq, think: 0.85 });
      deskFigure(c, env, { ...R, tq, think: 0 });
      // the two ropes from the lamp arms; on 'braid' they swing in and cross once over the hill
      const sw = sm((tq - (b.braid - 0.25)) / 1.6);
      twoRopes(c, env, { a: lampHook(ka.bulb, ka.ropeHook), b: lampHook(ra.bulb, ra.ropeHook), swing: sw, tq });
    });
    f.rim({ x: 0, y: -1 });
    f.practical({ x: ka.bulb.x, y: ka.bulb.y, kind: 'lamp', seed: 21, intensity: 0.9 * kLamp, radius: 60, layer: 'L4' });
    f.practical({ x: ra.bulb.x, y: ra.bulb.y, kind: 'lamp', seed: 22, intensity: 0.85, radius: 60, layer: 'L4' });
    f.layer('L5', (c, env) => {
      const r = { x: -400, y: 640, w: 2200, h: 200 };
      f.cached(`dou/${ID}/lip/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.fillStyle = env.fill('fg');
        cc.fillRect(0, 18, r.w, r.h - 18);
        cc.fillStyle = withAlpha(env.mood.rim, 0.22);
        cc.fillRect(0, 18, r.w, 1.5);
      })(c, r.x, r.y);
    });
    // ------------------------------------------------ type (upper half)
    const te = { t, mood: f.mood };
    nameCard(f.c, { name: 'Kenton Varda', role: 'Cloudflare', at: b.name - 0.12, dur: 3.9, fade: 0.35, x: 64, y: 92 }, te);
    const gA = seg(t, b.gap - 0.2, b.gap + 0.25) * (1 - seg(t, b.pull - 1.2, b.pull - 0.5));
    label(f.c, f.mood, { id: `${ID}-gap`, text: "Varda: workerd's one gap, Durable Objects", x: 1216, y: 92, align: 'right', alpha: gA });
    void lerp;
  },
});
