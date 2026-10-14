/**
 * ch05-s05 — The misty hills: each tug of the messenger is a step downhill toward less error, in fog.
 *
 * Teaching machine: mistyHills (the front ridge IS the loss curve; height is error; every stride is one
 * real gradient step x ← x − lr·f′(x), lr = MISTY_LR.timid = 0.2, from x0 = −5.3).
 *   0.2         a thread of light runs along the ridge from the high left slope down to the deep valley
 *               floor and fades (unlettered: height means error)
 *   'downhill'  the timid traveller starts down: one step per twos tick, a cairn at each; the lit tangent
 *               and the step arrow show the only thing he can know, the slope at his feet
 *   'fog'       he stops in the hollow (x ≈ −2.91); the fog closes round him; his lantern lifts, nothing below
 *   line end    the camera rises, lifting the fog for the viewer only: the true valley floor far to the
 *               right (x ≈ 1.96), much deeper; label 'timid steps can stall · rare in the 1986 tests'
 *   end         a wisp of fog drifts across the final frame (the plant for chapter 6)
 */
import { Timeline } from '../../../core';
import type { Camera3, ShotScene } from '../../../film';
import { LAYERS, MISTY_LR, MISTY_MINIMA, defineShot, descentPath, glow, lossDf, lossF, mistyHills, mixLab, overscan, withAlpha } from '../../../film';
import { camKeys, clamp01, lerp, sm, textPlateLabel, tq12, win } from '../sets/ch05-s01-kit';

const ID = 'ch05-s05';
/** the landscape's box (L4 world); the kit maps x ∈ [−6.4, 6.4] across it */
const BOX = { x: -60, y: -30, w: 1400, h: 790 };
const sx = (v: number) => BOX.x + ((v + 6.4) / 12.8) * BOX.w;
const sy = (f: number) => BOX.y + BOX.h * 0.9 - (f / 3.6) * BOX.h * 0.48;
const LR = MISTY_LR.timid;
const PATH = descentPath(LR, -5.3, 60);
/** steps until he is (practically) in the hollow */
const N_WALK = 22;

interface Scene extends ShotScene {
  D: number;
  walk: number;
  fog: number;
  trapped: number;
  cam: (t: number) => Camera3;
  CAMS: Camera3[];
}

export default defineShot<Scene>({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const walk = T.beat('walk');
    const fog = T.beat('fog');
    const trapped = T.beat('trapped');
    const cam = camKeys([
      [0, 604, 350, 0],
      [walk, 592, 366, 30],
      [fog, 566, 390, 60],
      [trapped + 0.2, 566, 388, 60],
      [trapped + 2.4, 642, 396, -44],
      [D, 648, 405, -50],
    ]);
    tl.hold(0, D);
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 10; i++) CAMS.push(cam((D * i) / 10));
    return { tl, D, walk, fog, trapped, cam, CAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const tq = tq12(t);
    const cam = sc.cam(t);
    f.camera(cam);
    // the walk: one gradient step per twos tick from 'downhill', the last ones landing on 'fog'; then a
    // few tiny shuffles in the hollow (the steps shrink with the slope)
    const span = sc.fog - sc.walk;
    let step = 0;
    if (tq >= sc.walk) {
      const u = clamp01((tq - sc.walk) / span);
      step = u * N_WALK;
      if (tq > sc.fog) step = N_WALK + Math.min(3, (tq - sc.fog) * 4);
    }
    const xNow = (() => {
      const k = Math.floor(step);
      const fr = step - k;
      return lerp(PATH[k], PATH[Math.min(PATH.length - 1, k + 1)], sm(fr));
    })();
    const lifted = win(t, sc.trapped, sc.trapped + 1.8);

    f.backlight({ sunX: 900, sunY: 470, sunRadius: 780, intensity: 0.85 });
    f.layer('L4', (c, env) => {
      const m = env.mood;
      // the ground beyond the box edges (the camera's overscan): the ridge simply continues
      c.fillStyle = env.fill('ink');
      const r = overscan(LAYERS.L4, sc.CAMS, 40);
      c.fillRect(r.x, sy(lossF(-6.4)) + 2, BOX.x - r.x + 2, r.y + r.h - sy(lossF(-6.4)));
      c.fillRect(BOX.x + BOX.w - 2, sy(lossF(6.4)) + 2, r.x + r.w - BOX.x - BOX.w + 2, r.y + r.h - sy(lossF(6.4)));
      c.fillRect(r.x, BOX.y + BOX.h - 4, r.w, r.y + r.h - BOX.y - BOX.h + 4);
      // the kit's own fog is off: this shot lays its fog BEHIND the front ridge (clipped above the curve), so
      // the loss curve stays a sharp near-ink silhouette, and closes a light veil round the traveller
      const ridge = new Path2D();
      ridge.moveTo(sx(-6.4), BOX.y - 400);
      for (let k = 0; k <= 200; k++) {
        const v = -6.4 + (12.8 * k) / 200;
        ridge.lineTo(sx(v), sy(lossF(v)) - 1);
      }
      ridge.lineTo(sx(6.4), BOX.y - 400);
      ridge.closePath();
      // an opaque ground under the kit's ridge (its paper is slightly translucent: the backlight's bands
      // would show through the ridge's body once the camera rises)
      {
        const under = new Path2D();
        under.rect(r.x, r.y, r.w, r.h);
        under.addPath(ridge);
        c.save();
        c.fillStyle = mixLab(env.fill('ink'), m.set, 0.12);
        c.fill(under, 'evenodd');
        c.restore();
      }
      mistyHills(c, { ...BOX, lr: LR, x0: -5.3, step, fog: 0, tangent: 0, trail: true, labels: false, reveal: 1 }, env);
      {
        const mistB = mixLab(m.haze, m.sky[3], 0.4);
        c.save();
        c.clip(ridge);
        // fog lying low in the valleys BEHIND the ridge: thick at the ridge line, thin up toward the crests
        const vg = c.createLinearGradient(0, BOX.y + BOX.h * 0.38, 0, BOX.y + BOX.h);
        const fa = 0.75 - 0.4 * lifted;
        vg.addColorStop(0, withAlpha(mistB, 0));
        vg.addColorStop(0.35, withAlpha(mistB, 0.5 * fa));
        vg.addColorStop(0.75, withAlpha(mistB, 0.85 * fa));
        vg.addColorStop(1, withAlpha(mistB, 0.85 * fa));
        c.fillStyle = vg;
        c.fillRect(BOX.x - 400, BOX.y, BOX.w + 800, BOX.h + 200);
        c.restore();
      }
      // the thread of light along the ridge: from the high left slope to the deep valley floor (height = error)
      const th = win(t, 0.15, 0.4) * (1 - win(t, 1.7, 2.6));
      const reach = clamp01((t - 0.2) / 1.3);
      if (th > 0.01) {
        const v0 = -6.0, v1 = 1.96;
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.lineCap = 'round';
        for (const [w, a] of [[9, 0.08], [3.5, 0.28], [1.4, 0.85]] as const) {
          c.strokeStyle = withAlpha(mixLab(m.core, m.halo, 0.2), a * th);
          c.lineWidth = w;
          c.beginPath();
          for (let k = 0; k <= 160; k++) {
            const v = lerp(v0, v1, (k / 160) * reach);
            const p = { x: sx(v), y: sy(lossF(v)) - 3 };
            if (k === 0) c.moveTo(p.x, p.y);
            else c.lineTo(p.x, p.y);
          }
          c.stroke();
        }
        // the spark at its head
        const hv = lerp(v0, v1, reach);
        glow(c, sx(hv), sy(lossF(hv)) - 3, 26, m.core, 0.5 * th * (reach < 1 ? 1 : 0.5));
        c.restore();
      }
      // the lit tangent and the step arrow at his feet: the only thing the traveller can know (no numbers)
      const tg = win(t, sc.walk - 0.4, sc.walk) * (1 - win(t, sc.fog - 0.1, sc.fog + 0.4));
      if (tg > 0.01) {
        const x = xNow;
        const d = lossDf(x);
        const px = sx(x), py = sy(lossF(x));
        const slope = (-(BOX.h * 0.48) / 3.6) / (BOX.w / 12.8);
        const ang = Math.atan(d * slope);
        const L = 74;
        c.save();
        c.globalAlpha *= tg;
        c.strokeStyle = withAlpha(m.core, 0.85);
        c.lineWidth = 1.8;
        c.setLineDash([6, 4]);
        c.beginPath();
        c.moveTo(px - Math.cos(ang) * L, py - Math.sin(ang) * L - 2);
        c.lineTo(px + Math.cos(ang) * L, py + Math.sin(ang) * L - 2);
        c.stroke();
        c.setLineDash([]);
        // the step: −lr · f′(x), drawn along the ground just ahead (scaled up 4× to be seen)
        const ax = sx(x - LR * d * 4);
        const ay = py + 18;
        c.strokeStyle = withAlpha(m.rim, 0.9);
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(px, ay);
        c.lineTo(ax, ay);
        c.stroke();
        const dir = Math.sign(ax - px) || 1;
        c.fillStyle = withAlpha(m.rim, 0.9);
        c.beginPath();
        c.moveTo(ax + dir * 2, ay);
        c.lineTo(ax - dir * 7, ay - 4.5);
        c.lineTo(ax - dir * 7, ay + 4.5);
        c.closePath();
        c.fill();
        c.restore();
      }
      // blend the kit's art into the ground below its box (no seam where the box ends)
      {
        // a long darkening down the ridge's body (below the curve only), so it meets the plain ground with
        // no band
        const y0 = BOX.y + BOX.h - 240;
        const y1 = BOX.y + BOX.h + 6;
        const g = c.createLinearGradient(0, y0, 0, y1);
        g.addColorStop(0, withAlpha(env.fill('ink'), 0));
        g.addColorStop(0.45, withAlpha(env.fill('ink'), 0.35));
        g.addColorStop(0.8, withAlpha(env.fill('ink'), 0.8));
        g.addColorStop(1, env.fill('ink'));
        const below = new Path2D();
        below.rect(r.x, r.y, r.w, r.h);
        below.addPath(ridge);
        c.save();
        c.clip(below, 'evenodd');
        c.fillStyle = g;
        c.fillRect(r.x, y0, r.w, y1 - y0);
        c.restore();
      }
      // the valley fog the traveller cannot see through: a soft bank over the deep valley until the camera
      // rises (lifted for the viewer only: ≤ 0.1 once risen, so the drop reads)
      const mist = mixLab(m.haze, m.sky[3], 0.45);
      const hide = 0.78 * (1 - 0.88 * lifted);
      {
        const cx = sx(1.9), cy = sy(0.3) + 10;
        c.save();
        c.translate(cx, cy);
        c.scale(1.7, 1);
        const R = 260;
        const g = c.createRadialGradient(0, 0, 10, 0, 0, R);
        g.addColorStop(0, withAlpha(mist, hide));
        g.addColorStop(0.55, withAlpha(mist, hide * 0.8));
        g.addColorStop(1, withAlpha(mist, 0));
        c.fillStyle = g;
        c.fillRect(-R, -R, 2 * R, 2 * R);
        c.restore();
      }
      // the front ridge's top edge: a thin rim line along the whole loss curve (the 'height' line)
      {
        const ra = 0.3 + 0.25 * lifted;
        c.save();
        c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.2), ra);
        c.lineWidth = 1.3;
        c.beginPath();
        for (let k = 0; k <= 200; k++) {
          const v = -6.4 + (12.8 * k) / 200;
          const p = { x: sx(v), y: sy(lossF(v)) - 0.5 };
          if (k === 0) c.moveTo(p.x, p.y);
          else c.lineTo(p.x, p.y);
        }
        c.stroke();
        c.restore();
      }
      // feather the kit's cloud bands where they begin (soft puffs over their left ends)
      for (const [cy, rr] of [[0.2, 70], [0.27, 56]] as const) {
        const px = BOX.x + BOX.w * 0.35, py = BOX.y + BOX.h * cy;
        c.save();
        c.translate(px, py);
        c.scale(3, 1);
        const g = c.createRadialGradient(0, 0, 4, 0, 0, rr * 1.4);
        g.addColorStop(0, withAlpha(m.sky[1], 0.9));
        g.addColorStop(0.6, withAlpha(m.sky[1], 0.55));
        g.addColorStop(1, withAlpha(m.sky[1], 0));
        c.fillStyle = g;
        c.fillRect(-rr * 1.4, -rr * 1.4, rr * 2.8, rr * 2.8);
        c.restore();
      }
      // the fog closing round him: a LIGHT haze veil tightening on his lantern's pool, the pool shrinking
      // to his feet (no dark hole: the clear air is lit by the lantern)
      const close = win(t, sc.fog - 0.25, sc.fog + 0.45) * (1 - 0.55 * lifted);
      if (close > 0.01) {
        const px = sx(xNow), py = sy(lossF(xNow)) - 30;
        const pool = lerp(130, 46, win(t, sc.fog - 0.2, sc.fog + 0.6));
        const veil = mixLab(m.haze, m.halo, 0.25);
        const R = 360;
        const g = c.createRadialGradient(px, py, pool * 0.6, px, py, R);
        g.addColorStop(0, withAlpha(veil, 0));
        g.addColorStop(Math.min(0.9, pool / R + 0.12), withAlpha(veil, 0.42 * close));
        g.addColorStop(0.7, withAlpha(veil, 0.3 * close));
        g.addColorStop(1, withAlpha(veil, 0));
        c.save();
        c.clip(ridge); // the veil hangs in the air over the ground, never as a dark hole on the slope
        c.fillStyle = g;
        c.fillRect(px - R, py - R, 2 * R, 2 * R);
        c.restore();
        const lift = Math.sin(Math.PI * clamp01((t - sc.fog - 0.1) / 1.1));
        glow(c, px + 18, py - 30, 50 + 20 * lift, m.halo, 0.2 + 0.12 * lift);
      }
      // the depth comparison, unlettered: a faint dashed level at the hollow's height carried across to the
      // deep valley, and the drop below it
      const lvl = win(t, sc.trapped + 1.4, sc.trapped + 2.4);
      if (lvl > 0.01) {
        const xh = PATH[N_WALK + 3];
        const yh = sy(lossF(xh));
        const x1 = sx(MISTY_MINIMA.valley);
        const y1 = sy(lossF(MISTY_MINIMA.valley));
        c.save();
        c.globalAlpha *= lvl;
        c.strokeStyle = withAlpha(mixLab(m.core, m.rim, 0.4), 0.7);
        c.lineWidth = 1.5;
        c.setLineDash([7, 6]);
        const reachX = lerp(sx(xh) + 14, x1 + 40, clamp01((t - sc.trapped - 1.4) / 1.2));
        c.beginPath();
        c.moveTo(sx(xh) + 14, yh);
        c.lineTo(reachX, yh);
        c.stroke();
        const dropA = win(t, sc.trapped + 2.6, sc.trapped + 3.3);
        if (dropA > 0) {
          c.globalAlpha *= dropA;
          c.beginPath();
          c.moveTo(x1, yh + 4);
          c.lineTo(x1, lerp(yh + 4, y1 - 10, dropA));
          c.stroke();
        }
        c.setLineDash([]);
        c.restore();
      }
    });
    f.rim({ x: 0.4, y: -1 });

    // L5: grass and stones along the near edge (blurred), parallax for the camera's rise
    f.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, sc.CAMS, 40);
      f.cached(`${ID}/L5/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), 260, (cc) => {
        cc.translate(-r.x, -700);
        cc.fillStyle = env.fill('fg');
        cc.beginPath();
        cc.moveTo(r.x, 960);
        for (let x = r.x; x <= r.x + r.w; x += 10) {
          const h = 770 + 26 * Math.sin(x * 0.011) + 12 * Math.sin(x * 0.037);
          cc.lineTo(x, h);
        }
        cc.lineTo(r.x + r.w, 960);
        cc.closePath();
        cc.fill();
        for (let k = 0; k < 90; k++) {
          const x = r.x + ((k * 97.13) % r.w);
          const base = 770 + 26 * Math.sin(x * 0.011) + 12 * Math.sin(x * 0.037);
          const L = 18 + ((k * 37) % 30);
          const a = (((k * 53) % 21) - 10) * 0.035;
          cc.beginPath();
          cc.moveTo(x - 2, base + 2);
          cc.lineTo(x + Math.sin(a) * L, base - Math.cos(a) * L);
          cc.lineTo(x + 2, base + 2);
          cc.fill();
        }
        // a boulder at the right
        cc.beginPath();
        cc.ellipse(1180, 790, 120, 70, -0.1, Math.PI, 0);
        cc.fill();
      })(c, r.x, 700);
    });
    // L6: a bare branch reaching in at the top left (soft)
    f.layer('L6', (c, env) => {
      c.strokeStyle = env.fill('fg');
      c.lineCap = 'round';
      const br = (x: number, y: number, a: number, L: number, w: number, d: number) => {
        const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L;
        c.lineWidth = w;
        c.beginPath();
        c.moveTo(x, y);
        c.lineTo(x2, y2);
        c.stroke();
        if (d > 0) {
          br(x2, y2, a - 0.45 + 0.08 * d, L * 0.68, w * 0.62, d - 1);
          br(x2, y2, a + 0.38, L * 0.6, w * 0.6, d - 1);
        }
      };
      br(-120, -60, 0.42, 190, 18, 4);
    });

    // the sky's top pulled toward the film's warm grade (≤ 20% of its violet left); luminance kept
    {
      const c = f.c;
      const g = c.createLinearGradient(0, 0, 0, 420);
      const neutral = mixLab(f.mood.set, f.mood.haze, 0.5);
      g.addColorStop(0, withAlpha(neutral, 0.85));
      g.addColorStop(0.6, withAlpha(neutral, 0.5));
      g.addColorStop(1, withAlpha(neutral, 0));
      c.save();
      c.globalCompositeOperation = 'color';
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 420);
      c.restore();
    }
    // the fog left drifting across the final frame (a wisp, the plant for chapter 6)
    const wisp = win(t, sc.trapped + 1.2, sc.trapped + 3.2);
    if (wisp > 0.01) {
      // soft drifting wisps (feathered ellipses, no sheet edges)
      const c = f.c;
      const col = mixLab(f.mood.haze, f.mood.sky[3], 0.4);
      for (const [x0, y, rx, ry, sp, a] of [[180, 470, 360, 46, 16, 0.22], [760, 430, 420, 40, 11, 0.18], [1180, 500, 300, 36, 20, 0.16]] as const) {
        const x = x0 + sp * t;
        c.save();
        c.translate(x, y);
        c.scale(rx / ry, 1);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, ry);
        g.addColorStop(0, withAlpha(col, a * wisp));
        g.addColorStop(0.6, withAlpha(col, a * 0.45 * wisp));
        g.addColorStop(1, withAlpha(col, 0));
        c.fillStyle = g;
        c.fillRect(-ry, -ry, 2 * ry, 2 * ry);
        c.restore();
      }
    }

    // the label, held to the end (right of and below the reel's glossary tag, top-left, which shows to ~6 s)
    const la = win(t, sc.trapped, sc.trapped + 0.5);
    textPlateLabel(f.c, 'timid steps can stall · rare in the 1986 tests', 704, 158, { mood: f.mood, alpha: la, size: 34, plate: 0.5 });
  },
});
