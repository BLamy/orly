/**
 * ch01-s04 — the camera passes through Monitor into a cathedral of arcs, one per weight.
 *
 * The push of ch01-s03 continues straight through Monitor's paper: at 'through' (0.3 s) the sheet thins against
 * the light behind it and parts down the middle like a stage gauze. Behind it, the desktop's wallpaper staged in
 * depth: all 9,909 arcs of the real compiled HandwiredOS circuit (sets/ch01-s04-arcfield.ts: dealt across six depth
 * planes, every arc drawn once, none invented; copper where the weight adds, indigo where it subtracts), standing on
 * one base line. The dolly drifts forward (z 0 → 520, decelerating into the hold): the far arcs haze toward the
 * backlight, the near ones part to either side and pass the lens. Fog sheet A drifts slowly left.
 *   'arcs' (L0104 'wallpaper'): the field opens in depth (near planes first, the far ones last).
 *   'colours' ('arc'): one copper arc, then one indigo arc, on the sharp plane, brighten in turn;
 *     the label inks: copper adds · indigo subtracts.
 *   'count' ('thousand'): the whole field brightens once, far to near, then settles; the label swaps to
 *     9,909 arcs · one per weight.
 * Nothing in the arcs moves except by camera and haze: they are a picture of the program, drawn from its wiring.
 */
import { Timeline, ease } from '../../../core';
import { CAMERA3_HOME, FONT, cam3Interp, defineShot, mixLab, softPlate, textProbe, textSwapIn, textSwapOut, withAlpha } from '../../../film';
import type { Camera3, LayerSpec, PaintEnv } from '../../../film';
import { ARC_PLANES, NP, arcGeom, arcPlane, pickArc } from '../sets/ch01-s04-arcfield';
import { OS_COLORS, TOTALS } from '../sets/circuit';
import { paperWindow } from '../sets/ch01-s02-theatre';

const END: Camera3 = { x: 626, y: 352, z: 520, lens: 1 };
/** the largest rest scale each plane reaches (z / (z - 520)): bake resolution */
const RES = ARC_PLANES.map((L, i) => (i === NP - 1 ? 1.2 : Math.min(2.2, L.z / (L.z - END.z))));
/** Monitor's paper, where ch01-s03's push left it on screen, as the gauze the camera passes through */
const GAUZE: LayerSpec = { id: 'gauze', z: 700, haze: 0, blur: 0 };
const GAUZE_R = { x: 235, y: 11, w: 769, h: 687 };
/** the two highlighted arcs: real arcs on the sharp plane, large and central */
/** (two big domes from the export: an adding arc left of centre, a subtracting arc right of it) */
const HI_COPPER = pickArc(4, 1, 347, 417);
const HI_INDIGO = pickArc(4, -1, 900, 383);

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const bump = (t: number, t0: number, rise: number, hold: number, decay: number) =>
  t < t0 ? 0 : smooth((t - t0) / rise) * (t < t0 + rise + hold ? 1 : Math.exp(-(t - t0 - rise - hold) * decay));

/** one real arc drawn live, bright, with a soft additive glow (the highlight) */
function hiArc(c: CanvasRenderingContext2D, env: PaintEnv, i: number, k: number, col: string) {
  if (k <= 0.01 || i < 0) return;
  const g = arcGeom(i);
  const dev = Math.hypot(c.getTransform().a, c.getTransform().b) || 1;
  c.save();
  c.beginPath();
  c.ellipse(g.cx, g.base, g.rad, g.h, 0, Math.PI, 2 * Math.PI);
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = withAlpha(col, 0.28 * k);
  c.lineWidth = 12 / dev;
  c.stroke();
  c.strokeStyle = withAlpha(col, 0.4 * k);
  c.lineWidth = 5 / dev;
  c.stroke();
  c.globalCompositeOperation = 'source-over';
  c.strokeStyle = withAlpha(col, k);
  c.lineWidth = 3 / dev;
  c.stroke();
  // the foil's lit upper edge
  c.beginPath();
  c.ellipse(g.cx, g.base - 1.6 / dev, g.rad, g.h, 0, Math.PI, 2 * Math.PI);
  c.strokeStyle = withAlpha(mixLab(col, '#fff4e0', 0.6), 0.85 * k);
  c.lineWidth = 1.1 / dev;
  c.stroke();
  c.restore();
}

/** a line of coloured runs, centred at (x, y) */
function runs(c: CanvasRenderingContext2D, parts: [string, string][], x: number, y: number, font: string) {
  c.font = font;
  const w = parts.reduce((n, [s]) => n + c.measureText(s).width, 0);
  let cx = x - w / 2;
  for (const [s, col] of parts) {
    c.fillStyle = col;
    c.fillText(s, cx, y);
    cx += c.measureText(s).width;
  }
  return w;
}

export default defineShot({
  id: 'ch01-s04',
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const cam = tl.channel<Camera3>('cam', CAMERA3_HOME, cam3Interp);
    // carries ch01-s03's push in at speed, then decelerates into the held number
    tl.tween(cam, END, { at: 0, dur: T.duration, ease: ease.enter });
    tl.hold(0, T.duration);
    return {
      tl,
      cam,
      through: T.beat('through'),
      arcs: T.beat('arcs'),
      colours: T.beat('colours'),
      count: T.beat('count'),
      dur: T.duration,
    };
  },
  paint(f, s, scene) {
    const t = f.t;
    f.camera(s.get(scene.cam));
    f.backlight({ sunX: 640, intensity: 1 });
    // the nave: dark round the edges, the backlight gathered into a glow low in the middle (the arcs' horizon)
    f.layer('L1', (c, env) => {
      f.cached(`ch01-s04/nave/${env.mood.id}`, 2200, 1500, (cc) => {
        const g = cc.createRadialGradient(1100, 820, 60, 1100, 800, 900);
        const dark = mixLab(env.mood.ink, env.mood.set, 0.25);
        g.addColorStop(0, withAlpha(dark, 0));
        g.addColorStop(0.35, withAlpha(dark, 0.35));
        g.addColorStop(1, withAlpha(dark, 0.86));
        cc.fillStyle = g;
        cc.fillRect(0, 0, 2200, 1500);
      })(c, -460, -390);
    });

    const open = (p: number) => smooth((t - (scene.arcs - 0.75) - (NP - 1 - p) * 0.12) / 0.7);
    const pulse = (p: number) => bump(t, scene.count - 0.05 + p * 0.1, 0.14, 0.1, 2.4);
    const plane = (p: number) =>
      f.layer(ARC_PLANES[p], (c, env) => {
        const a = open(p);
        if (a <= 0) return;
        c.globalAlpha = a;
        const draw = arcPlane(f, c, env, p, { res: RES[p], key: 'ch01-s04' });
        const k = pulse(p);
        if (k > 0.01) {
          c.globalAlpha = a * 0.9 * k;
          draw(c, -110, 30);
        }
        c.globalAlpha = 1;
        if (p === 4) {
          hiArc(c, env, HI_COPPER, bump(t, scene.colours - 0.12, 0.2, 0.75, 1.6), mixLab(OS_COLORS.copper, '#f0a060', 0.45));
          hiArc(c, env, HI_INDIGO, bump(t, scene.colours + 0.38, 0.2, 0.75, 1.6), mixLab(OS_COLORS.indigo, '#a9bde6', 0.45));
        }
      });

    plane(0);
    plane(1);
    f.fog({ yCenter: 0.62 * 720, height: 0.42 * 720, alpha: 0.22, drift: -9 });
    plane(2);
    plane(3);
    f.fog({ yCenter: 0.74 * 720, height: 0.2 * 720, alpha: 0.1, drift: -5 });
    plane(4);
    plane(5);

    // the gauze: Monitor's paper thins against the light and parts down the middle
    const part = smooth((t - scene.through) / 0.9);
    const gA = 1 - smooth((t - scene.through - 0.1) / 0.8);
    if (gA > 0.005) {
      f.layer(GAUZE, (c, env) => {
        const thin = smooth((t - scene.through + 0.15) / 0.55);
        const mid = GAUZE_R.x + GAUZE_R.w / 2;
        for (const side of [-1, 1]) {
          c.save();
          c.beginPath();
          if (side < 0) c.rect(-2000, -2000, mid + 2000, 5000);
          else c.rect(mid, -2000, 5000, 5000);
          c.clip();
          c.translate(side * part * 460, 0);
          paperWindow(c, env, 'monitor', GAUZE_R, { alpha: gA }, { focused: true, footer: 1, rowsTick: f.tq, gauze: thin });
          c.restore();
        }
      });
    }

    // labels (screen-locked, top centre over a soft plate): the colour key on 'arc', the count on 'thousand'
    const c = f.c;
    const m = f.mood;
    const swapAt = scene.count - 0.1;
    const aKey = textSwapIn(t, scene.colours - 0.1) * textSwapOut(t, swapAt);
    const aCount = textSwapIn(t, swapAt) * (1 - smooth((t - (scene.dur - 0.85)) / 0.5));
    const parch = mixLab('#efe3cf', m.core, 0.15);
    const copperTxt = mixLab(mixLab(OS_COLORS.copper, m.core, 0.5), '#ffffff', 0.08);
    const indigoTxt = mixLab(mixLab(OS_COLORS.indigo, '#dfe6f2', 0.55), m.haze, 0.1);
    const Y = 104;
    const font = `500 31px ${FONT.text}`;
    if (aKey > 0.005 || aCount > 0.005) {
      c.save();
      c.textBaseline = 'alphabetic';
      c.textAlign = 'left';
      const plate = Math.max(aKey, aCount);
      softPlate(c, 640, Y - 10, 600, 80, mixLab(m.ink, '#000000', 0.3), 0.6 * plate);
      if (aKey > 0.005) {
        c.globalAlpha = aKey;
        const w = runs(c, [['copper adds', copperTxt], ['  ·  ', parch], ['indigo subtracts', indigoTxt]], 640, Y, font);
        textProbe(c, 'ch01-s04/key', 640 - w / 2, Y - 24, w, 30, aKey);
      }
      if (aCount > 0.005) {
        c.globalAlpha = aCount;
        const w = runs(c, [[TOTALS.storedWeights.toLocaleString('en-US'), copperTxt], [' arcs  ·  one per weight', parch]], 640, Y, font);
        textProbe(c, 'ch01-s04/count', 640 - w / 2, Y - 24, w, 30, aCount);
      }
      c.restore();
    }
  },
});
