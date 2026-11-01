/**
 * ch05-s03 — a real scar in the code: why four seconds, not two (winterBlue, paper-fold in from the ruler).
 *
 * House A's sill in close-up (sets/ch05-s03-sill.ts): L1 the sea past A's corner, L2 the terrace with the other
 * houses' lamps, IN (a plane a little deeper than the wall) A's keeper reading a page of the code at a desk inside,
 * L4 A's wall, its window HOLE, the long stone sill with the candle (workerd's band and renewal notch marked) and
 * small brass hourglasses, L5 a drainpipe at the left edge. The camera racks focus between the sill and the page.
 * Illustrative re-enactment; no numbers on screen beyond the label.
 *
 *   scar     5.17  rack focus to the page: one ink line is underlined in red (a comment, illegible as text)
 *   stall   10.39  'five': rack back to the sill; label 'R2 stalls ~5.5 s every 5 minutes'; a gust bends the flame
 *                  low and holds it; a long hourglass (the stall) runs
 *   snuff   14.70  'limit': a shorter hourglass (a two-second bound) empties first; a snuffer drops over the flame
 *                  and along the terrace every house lamp gutters out together
 *   retry   18.73  'retried': rewind. The same gust; a 4 s hourglass (the attempt's bound) RUNS OUT mid-gust; a
 *                  1 s retry hook; the retry lands just after the gust, well above the 12,000 ms notch, and relights
 *                  the candle; the terrace lamps stay lit
 * Bottom 12% clear.
 */
import { Timeline } from '../../../core';
import { LAYERS, POSES, PUPPET_NEAR_BLACK, blendPose, defineShot, mixLab, withAlpha } from '../../../film';
import type { Camera3, LayerSpec } from '../../../film';
import { cast } from '../cast';
import { seaAndShore } from '../sets/harbourTown';
import { camAt, clamp01, glowDot, label, lerp, pulse, seg, sm, tone, twos, type CamKey } from '../sets/common';
import { candleFlamePt, leaseCandle } from '../sets/leaseCandle';
import { SILL, aWall, codePage, gust, hourglass, interiorRoom, terraceLamps, terraceStatic } from '../sets/ch05-s03-sill';

const ID = 'ch05-s03';
const C0: Camera3 = { x: 560, y: 320, z: 110, lens: 1 };
const PAGE: Camera3 = { x: 410, y: 292, z: 330, lens: 1 };
const SILLC: Camera3 = { x: 700, y: 352, z: 230, lens: 1 };
const CANDLE_S = 1.25;
/** case 2: story seconds -> screen seconds */
const K2 = 0.62;
const STALL = 5.5;

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b = {
      D: T.duration,
      scar: T.beat('scar'),
      stall: T.beat('stall'),
      twoSec: T.word('L0514', 'two-second'),
      snuff: T.beat('snuff'),
      retry: T.beat('retry'),
    };
    const t0 = b.retry + 0.22;
    const c2 = {
      t0,
      gustEnd: t0 + STALL * K2,
      attemptOut: t0 + 4 * K2,
      retryAt: t0 + 5 * K2,
      land: t0 + 5 * K2 + 0.4,
    };
    const cams: CamKey[] = [
      { t: 0, cam: C0 },
      { t: b.scar - 0.3, cam: { ...C0, x: C0.x - 15, z: C0.z + 20 } },
      { t: b.scar + 1.3, cam: PAGE },
      { t: b.stall - 1.4, cam: { ...PAGE, x: PAGE.x - 5, z: PAGE.z + 15 } },
      { t: b.stall + 0.3, cam: SILLC },
      { t: b.D, cam: { ...SILLC, x: SILLC.x + 12, z: SILLC.z + 30 } },
    ];
    return { tl, b, c2, cams };
  },
  paint(f, _s, sc) {
    const { b, c2, cams } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(cams, t);
    f.camera(cam);
    const all = cams.map((k) => k.cam);
    void all;
    // ------------------------------------------------ state
    const rack = seg(t, b.scar - 0.2, b.scar + 0.9) * (1 - seg(t, b.stall - 1.2, b.stall - 0.1));
    const case2 = t >= b.retry - 0.05;
    // case 1: the stall with a two-second bound
    const g1 = seg(t, b.stall - 0.1, b.stall + 0.4) * (1 - seg(t, b.stall + STALL * 0.95, b.stall + STALL * 0.95 + 0.6));
    const shortStart = b.twoSec - 0.45;
    const snuff1 = seg(t, b.snuff, b.snuff + 0.35);
    // case 2: the same gust; the 4 s bound runs out mid-gust; a 1 s retry; the retry lands after the gust
    const g2 = seg(t, c2.t0 - 0.1, c2.t0 + 0.3) * (1 - seg(t, c2.gustEnd - 0.1, c2.gustEnd + 0.35));
    const gustK = case2 ? g2 : g1;
    const landed = case2 && t >= c2.land;
    const relight = case2 ? pulse(t, c2.land, 0.12, 0.15, 0.7) : 0;
    let nowMs = 3000;
    if (!case2 && t > b.stall) nowMs = 3000 + ((Math.min(t, b.snuff) - b.stall) / 0.9) * 1000;
    if (case2) nowMs = landed ? lerp(3000 + ((c2.land - c2.t0) / K2) * 1000, 0, sm((t - c2.land) / 0.35)) : 3000 + (Math.max(0, t - c2.t0) / K2) * 1000;
    const snuff = case2 ? 0 : snuff1;
    const lampsBehind = case2 ? seg(t, b.retry - 0.05, b.retry + 0.3) : 1 - seg(t, b.snuff + 0.3, b.snuff + 1.3);
    const rewindPulse = pulse(t, b.retry - 0.2, 0.15, 0.1, 0.35);
    // ------------------------------------------------ paint
    f.backlight({ sunX: 160, sunY: 300, intensity: 0.9 });
    f.layer('L1', (c, env) => {
      seaAndShore(f, c, env, { x: 300, y: 60, w: 1700, h: 760 }, { lamps: 0.6, moon: 1, key: ID });
    });
    f.layer('L2', (c, env) => {
      const r = { x: 600, y: 180, w: 1100, h: 700 };
      f.cached(`dou/${ID}/terrace/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        terraceStatic(cc, env);
      })(c, r.x, r.y);
      terraceLamps(c, env, { lamps: lampsBehind, tq });
    });
    f.fog('A');
    // the room inside (a plane a little deeper than the wall): in focus when the camera racks to the page
    const IN: LayerSpec = { id: 'IN', z: 1150, haze: 0.06, blur: 2.4 * (1 - rack) };
    f.layer(IN, (c, env) => {
      const r = { x: 80, y: 20, w: 620, h: 640 };
      f.cached(`dou/${ID}/room/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        interiorRoom(cc, env);
      })(c, r.x, r.y);
      glowDot(c, 560, 360, 160, tone(env, '#f2b45e', 0.1), 0.35);
      const pose = blendPose(POSES.sit, POSES.point, 0.5);
      const o = { x: 300, y: 520, facing: 'right' as const, pose, scale: 0.72, ink: PUPPET_NEAR_BLACK, light: { x: 0.8, y: -0.4, floor: 0.15 }, edgeRim: { x: 0.8, y: -0.5, px: 2.5, alpha: 0.85, warm: 0.65 } };
      cast['keeper-a'].draw(c, o, env);
      const h = cast['keeper-a'].anchor(o, 'handF');
      codePage(c, env, { x: h.x + 26, y: h.y - 30, w: 84, h: 108, rot: -0.08, under: seg(t, b.scar + 0.2, b.scar + 1.2) });
    });
    // the wall, the sill, the candle and the hourglasses: sharp, except while the camera racks to the page
    const wallSpec: LayerSpec = rack > 0.03 ? { id: 'L4w', z: 1000, haze: 0.03, blur: 2.6 * rack } : LAYERS.L4;
    const cOpts = { x: SILL.candle.x, y: SILL.candle.y, s: CANDLE_S, nowMs, band: 1, notch: 1, flame: 1, bend: gustK, snuff, relight, seed: 7 };
    f.layer(wallSpec, (c, env) => {
      const r = { x: -420, y: -320, w: 1340, h: 1240 };
      f.cached(`dou/${ID}/wall/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        aWall(cc, env);
      })(c, r.x, r.y);
      leaseCandle(c, env, cOpts);
      // the hourglasses on the sill
      const G = SILL.glass;
      if (!case2) {
        const longU = clamp01((t - b.stall) / (STALL * 0.95));
        const longA = seg(t, b.stall - 0.3, b.stall);
        hourglass(c, env, { x: G[0].x, y: G[0].y, s: 1.35, u: longU, alpha: longA });
        const shortU = clamp01((t - shortStart) / (b.snuff - shortStart));
        hourglass(c, env, { x: G[1].x, y: G[1].y, s: 0.85, u: shortU, alpha: seg(t, shortStart - 0.3, shortStart), glint: pulse(t, b.snuff, 0.1, 0.2, 0.6) });
      } else {
        const fade = seg(t, b.retry - 0.05, b.retry + 0.25);
        hourglass(c, env, { x: G[0].x, y: G[0].y, s: 1.35, u: clamp01((t - c2.t0) / (STALL * K2)), alpha: fade });
        // the 4 s bound: runs out mid-gust (the flame is still bent), then flips for the retry
        const flipBack = seg(t, c2.retryAt - 0.1, c2.retryAt + 0.15);
        const att = t < c2.retryAt ? clamp01((t - c2.t0) / (4 * K2)) : clamp01((t - c2.retryAt) / (4 * K2));
        hourglass(c, env, { x: G[1].x, y: G[1].y, s: 1.1, u: t < c2.retryAt - 0.1 ? att : t < c2.retryAt + 0.15 ? 1 : att, flip: t < c2.retryAt + 0.15 && t > c2.retryAt - 0.1 ? flipBack : 0, alpha: fade, glint: pulse(t, c2.attemptOut, 0.1, 0.2, 0.5) });
        // the 1 s retry hook
        const hookA = seg(t, c2.attemptOut - 0.1, c2.attemptOut + 0.1) * (1 - seg(t, c2.land + 0.3, c2.land + 0.8));
        hourglass(c, env, { x: G[2].x, y: G[2].y, s: 0.6, u: clamp01((t - c2.attemptOut) / K2), alpha: hookA });
      }
      gust(c, env, { k: gustK, t, x0: SILL.candle.x - 220, x1: SILL.candle.x + 300, y0: SILL.candle.y - 200, y1: SILL.candle.y - 20 });
    });
    f.rim({ x: 0, y: -1 });
    const fp = candleFlamePt(cOpts);
    const flameOn = 1 - snuff;
    if (flameOn > 0.02) f.practical({ x: fp.x, y: fp.y, kind: 'candle', seed: 9, intensity: 0.75 * flameOn * (1 - 0.35 * gustK), radius: 36, layer: 'L4' });
    f.layer('L5', (c, env) => {
      const r = { x: -200, y: -120, w: 300, h: 960 };
      f.cached(`dou/${ID}/pipe/${env.mood.id}`, r.w, r.h, (cc) => {
        cc.translate(-r.x, -r.y);
        cc.fillStyle = env.fill('fg');
        cc.fillRect(0, -120, 26, 960);
        for (let y = -60; y < 800; y += 170) cc.fillRect(-30, y, 70, 10);
        cc.fillStyle = withAlpha(env.mood.rim, 0.2);
        cc.fillRect(0, -120, 3, 960);
      })(c, r.x, r.y);
    });
    // the rewind: a breath of dark as the scene resets
    if (rewindPulse > 0.01) {
      f.c.save();
      f.c.fillStyle = withAlpha(mixLab(f.mood.fg, '#000000', 0.3), 0.45 * rewindPulse);
      f.c.fillRect(0, 0, 1280, 720);
      f.c.restore();
    }
    // ------------------------------------------------ type
    const lA = seg(t, b.stall - 0.15, b.stall + 0.3) * (1 - seg(t, b.retry - 0.6, b.retry - 0.1));
    label(f.c, f.mood, { id: `${ID}-stall`, text: 'R2 stalls ~5.5 s every 5 minutes', x: 1216, y: 86, align: 'right', alpha: lA });
  },
});
