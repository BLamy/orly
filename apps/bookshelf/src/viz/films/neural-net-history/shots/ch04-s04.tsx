/**
 * ch04-s04 — two windows in the snow: Pitts and McCulloch, May and September 1969 (winterBlue, crossfade in,
 * 10.50 s). Restraint: no figure, no interior detail, no dramatisation.
 *
 *   'window' (0.2)   a single paper-cut window in a dark clapboard wall, seen from outside at night, snow drifting
 *                    slowly past. On the sill inside, a small lamp burns: the same small lamp-shape as the 1943 wick
 *                    card (a squared paper barrel with a window on its wick). Label: Walter Pitts · 1923–1969.
 *   'later' (5.47)   farther down the street, a second, more distant window, also with a lamp on its sill, softly
 *                    goes dark. Label: Warren McCulloch · 1898–1969.
 *   hold (3.6 s)     the near lamp stays lit; snow keeps falling; nothing else moves.
 * Camera: an almost imperceptible push-in (2% over the shot). Fog sheet between the two planes.
 */
import { Timeline } from '../../../core';
import { FONT, LAYERS, defineShot, legibleSize, mixLab, overscan, softPlate, textColor, withAlpha } from '../../../film';
import { toScreen } from '../../../film/core/multiplane';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { hash1 } from '../../../film/core/frame';
import { mixCam, sm, snowfall, tq12, win } from '../sets/ch04-s01-kit';

const ID = 'ch04-s04';
type C = CanvasRenderingContext2D;

// the near house (L4): wall to x = CORNER; the window, its sill and the lamp
const CORNER = 792;
const WIN = { x: 318, y: 196, w: 236, h: 300 };
const SILL_Y = WIN.y + WIN.h;
const LAMP = { x: WIN.x + WIN.w / 2 + 34, y: SILL_Y - 8, s: 0.62 };
// McCulloch's house (L2), farther down the street than its neighbours: smaller, higher base, paler, seen in the
// gap between the near rank of gables; its one lit window
const FAR_HOUSE = { cx: 1062, base: 494, s: 0.72 };
const FAR = { x: FAR_HOUSE.cx - 15, y: 410, w: 29, h: 39 };
const STREET_Y = 600;

const C0: Camera3 = { x: 620, y: 352, z: 0, lens: 1 };
const C1: Camera3 = { x: 640, y: 349, z: 22, lens: 1 };
const CAMS = [C0, C1];

interface Beats {
  D: number;
  window: number;
  later: number;
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    const b: Beats = { D: T.duration, window: T.beat('window'), later: T.beat('second') };
    tl.hold(0, b.D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as Beats;
    const cam = mixCam(C0, C1, sm(t / b.D));
    f.camera(cam);
    f.backlight({ sunX: 1080, sunY: 300, sunRadius: 420, intensity: 0.42 });
    // the far lamp goes softly dark on 'later' over 1.2 s (a slow dim, not a snuff), with one last small
    // flicker on twos near the end of the fade
    const far = farLamp(t, b.later);

    // L1: a pale moon behind thin cloud, high right, and a far rank of rooftops beyond the street
    f.layer('L1', (c, env) => {
      farRoofs(f, c, env);
      const g = c.createRadialGradient(1080, 150, 4, 1080, 150, 130);
      g.addColorStop(0, withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.85));
      g.addColorStop(0.18, withAlpha(env.mood.rim, 0.4));
      g.addColorStop(1, withAlpha(env.mood.rim, 0));
      c.fillStyle = g;
      c.fillRect(940, 10, 280, 280);
      const r = overscan(LAYERS.L1, CAMS, 40);
      snowfall(c, { x: r.x, y: -40, w: r.w, h: 640, t: t + 30, n: 160, start: 0, ramp: 0.01, r0: 0.9, r1: 1.6, fall: 14, wind: 4, seed: 41, color: mixLab(env.mood.rim, env.mood.core, 0.4), alpha: 0.7 });
    });
    // L2: the street's far houses (clapboard gables), one window lit with a lamp on its sill
    f.layer('L2', (c, env) => {
      mccullochHouse(f, c, env);
      farWindow(c, env, far);
      nearRank(f, c, env);
    });
    if (far > 0.01) f.practical({ x: FAR.x + FAR.w / 2, y: FAR.y + FAR.h - 9, kind: 'candle', seed: 1898, intensity: 0.4 * far, radius: 17, layer: 'L2' });
    f.fog({ yCenter: 470, height: 300, alpha: 0.22, drift: 4 });
    // a low fog sheet lying between the houses and the near fence
    f.fog({ yCenter: 522, height: 96, alpha: 0.3, drift: 6 });
    // L3: the snowy street receding; medium snow
    f.layer('L3', (c, env) => {
      street(f, c, env);
      snowfall(c, { x: -200, y: -60, w: 1700, h: 820, t: t + 30, n: 110, start: 0, ramp: 0.01, r0: 1.6, r1: 3.0, fall: 24, wind: 6, seed: 42, color: mixLab(env.mood.rim, env.mood.core, 0.5), alpha: 0.85 });
    });
    f.fog('B');
    // L4: the near clapboard wall with its one window; the lamp on the sill inside
    f.layer('L4', (c, env) => {
      nearWall(f, c, env);
      downpipe(f, c, env);
      sillLamp(c, env, LAMP.x, LAMP.y, LAMP.s, 1);
    });
    f.rim({ x: 1, y: -0.3 });
    f.practical({ x: LAMP.x, y: LAMP.y - 31 * LAMP.s, kind: 'candle', seed: 1923, intensity: 0.8, radius: 50 });
    // the lamp's warmth on the glass (the shot's one warm accent), breathing with the flame
    warmGlow(f, LAMP.x, LAMP.y - 22, t);
    // L5: large slow flakes passing the lens
    f.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, CAMS, 60);
      snowfall(c, { x: r.x, y: -80, w: r.w, h: 900, t: t + 30, n: 22, start: 0, ramp: 0.01, r0: 5, r1: 10, fall: 34, wind: 9, seed: 43, color: mixLab(env.mood.rim, env.mood.core, 0.55), alpha: 0.6 });
      // a few big, out-of-focus flakes drifting across the near window (they read against its warm glass)
      snowfall(c, { x: 180, y: -120, w: 560, h: 940, t: t + 12, n: 9, start: 0, ramp: 0.01, r0: 10, r1: 17, fall: 30, wind: 7, seed: 44, color: mixLab(env.mood.rim, env.mood.core, 0.6), alpha: 0.75, hardness: 0 });
      eave(f, c, env);
    });
    // L6: a snow-laden branch crossing the top-right corner, very near and soft: it ties the two halves of the frame
    f.layer('L6', (c, env) => branch(f, c, env));

    // ------------------------------------------------------------------ the two labels (typed, memorial)
    memorial(f, 'Walter Pitts · 1923–1969', WIN.x + WIN.w / 2, 600, t, b.window + 0.4);
    // McCulloch's line sits just below his house's base line, centred on his window (as Pitts's sits under his),
    // fading in on 'later' while his window dims (the lamp is half down at +0.35 and out at +1.1; the card is
    // fully in at +1.25, as the flame gutters)
    const lp = toScreen(LAYERS.L2, cam, FAR.x + FAR.w / 2, FAR_HOUSE.base + 36);
    memorial(f, 'Warren McCulloch · 1898–1969', lp.x, lp.y, t, b.later + 0.35, { maxRight: 1244, size: 25 });
  },
});

// ================================================================================================= pieces
function warmGlow(f: Frame, x: number, y: number, t: number) {
  f.layer('L4', (c, env) => {
    const k = 1 + 0.04 * Math.sin(Math.floor(t * 12) * 0.9) + 0.03 * Math.sin(Math.floor(t * 12) * 2.3);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(x, y, 2, x, y, 120 * k);
    g.addColorStop(0, withAlpha('#f0b866', 0.32));
    g.addColorStop(0.4, withAlpha('#c98a44', 0.1));
    g.addColorStop(1, withAlpha('#c98a44', 0));
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, 120 * k, 0, Math.PI * 2);
    c.fill();
    c.restore();
    void env;
  });
}

/** the near wall (cached): clapboards with a cut-line under each lap, corner board, the window HOLE with its
 *  casing, sash bars and sill, snow capped on the head trim and banked on the sill; the warm room behind the glass */
function nearWall(f: Frame, c: C, env: PaintEnv) {
  const r = overscan(LAYERS.L4, CAMS, 40);
  f.cached(`${ID}/wall/${env.mood.id}`, CORNER + 60 - Math.floor(r.x), Math.ceil(r.h) + 40, (cc) => {
    const ox = Math.floor(r.x);
    const oy = Math.floor(r.y) - 20;
    cc.translate(-ox, -oy);
    const { x, y, w, h } = WIN;
    // the room behind the glass: warm lamplight, brightest low near the lamp, no detail
    const room = cc.createRadialGradient(LAMP.x, LAMP.y - 24, 8, LAMP.x - 10, LAMP.y - 70, 290);
    room.addColorStop(0, mixLab(env.mood.halo, '#e0ad62', 0.65));
    room.addColorStop(0.35, mixLab(env.mood.setHaze, '#b07a40', 0.5));
    room.addColorStop(0.75, mixLab(env.mood.set, '#6a4628', 0.4));
    room.addColorStop(1, mixLab(env.mood.set, '#3a2818', 0.35));
    cc.fillStyle = room;
    cc.fillRect(x, y, w, h);
    // the wall with the window hole (evenodd)
    const wall = mixLab(env.fill('set'), env.mood.fg, 0.62);
    cc.fillStyle = wall;
    cc.beginPath();
    cc.rect(ox, oy, CORNER - ox, r.h + 60);
    cc.rect(x, y, w, h);
    cc.fill('evenodd');
    // clapboard laps: a faint lit edge over a shadow line, every 24 px
    for (let yy = oy + 8; yy < oy + r.h + 60; yy += 24) {
      if (yy > y - 22 && yy < y + h + 26) {
        lap(cc, env, ox, x - 26, yy);
        lap(cc, env, x + w + 26, CORNER, yy);
      } else lap(cc, env, ox, CORNER, yy);
    }
    // corner board
    cc.fillStyle = mixLab(wall, env.mood.fg, 0.35);
    cc.fillRect(CORNER - 26, oy, 26, r.h + 60);
    cc.fillStyle = withAlpha(env.mood.rim, 0.3);
    cc.fillRect(CORNER - 1, oy, 1.2, r.h + 60);
    // casing: wide trim around the hole
    const ink = env.fill('ink');
    cc.fillStyle = ink;
    cc.fillRect(x - 24, y - 30, w + 48, 30); // head
    cc.fillRect(x - 24, y, 24, h); // jambs
    cc.fillRect(x + w, y, 24, h);
    cc.fillRect(x - 36, y + h, w + 72, 16); // the sill, projecting
    cc.fillRect(x - 26, y + h + 16, w + 52, 10); // apron
    // the sashes: meeting rail and muntins (6 over 6)
    cc.fillRect(x, y + h / 2 - 5, w, 10);
    cc.fillRect(x, y, w, 9);
    cc.fillRect(x, y + h - 9, w, 9);
    cc.fillRect(x, y, 9, h);
    cc.fillRect(x + w - 9, y, 9, h);
    for (const k of [1, 2]) cc.fillRect(x + (w * k) / 3 - 2.5, y, 5, h);
    for (const yy of [y + h / 4, y + (3 * h) / 4]) cc.fillRect(x, yy - 2.5, w, 5);
    // a thin curtain edge at the left of the glass (cut paper, translucent)
    cc.fillStyle = withAlpha(ink, 0.55);
    cc.beginPath();
    cc.moveTo(x + 9, y + 9);
    cc.quadraticCurveTo(x + 38, y + h * 0.45, x + 22, y + h - 9);
    cc.lineTo(x + 9, y + h - 9);
    cc.closePath();
    cc.fill();
    // snow: a cap on the head trim, a bank on the sill (cut paper, catching the moon)
    const snowCol = mixLab(env.mood.setHaze, env.mood.rim, 0.55);
    cc.fillStyle = snowCol;
    cc.beginPath();
    cc.moveTo(x - 28, y - 30);
    for (let i = 0; i <= 16; i++) {
      const xx = x - 28 + ((w + 56) * i) / 16;
      cc.lineTo(xx, y - 30 - 6 - 5 * Math.sin((i / 16) * Math.PI) - 2 * ((hash1(i, 7) + 1) / 2));
    }
    cc.lineTo(x + w + 28, y - 30);
    cc.closePath();
    cc.fill();
    cc.beginPath();
    cc.moveTo(x - 40, y + h + 2);
    for (let i = 0; i <= 18; i++) {
      const xx = x - 40 + ((w + 80) * i) / 18;
      cc.lineTo(xx, y + h - 4 - 7 * Math.sin((i / 18) * Math.PI) - 3 * ((hash1(i, 9) + 1) / 2));
    }
    cc.lineTo(x + w + 40, y + h + 2);
    cc.closePath();
    cc.fill();
    // the window's warm light falls on the sill snow and the trim's inner edges
    // (a true radial falloff, flattened onto the sill: nothing clips it to a box)
    cc.save();
    cc.translate(LAMP.x, y + h);
    cc.scale(1, 0.42);
    const spill = cc.createRadialGradient(0, 0, 4, 0, 0, 170);
    spill.addColorStop(0, withAlpha(mixLab(env.mood.halo, '#d8a45e', 0.5), 0.45));
    spill.addColorStop(0.5, withAlpha(mixLab(env.mood.halo, '#d8a45e', 0.3), 0.14));
    spill.addColorStop(1, withAlpha(env.mood.halo, 0));
    cc.fillStyle = spill;
    cc.beginPath();
    cc.arc(0, 0, 170, 0, Math.PI * 2);
    cc.fill();
    cc.restore();
    // snow on the clapboard laps near the ground, and the ground drift along the wall's foot
    cc.fillStyle = mixLab(snowCol, env.mood.set, 0.25);
    cc.beginPath();
    cc.moveTo(ox, 760);
    for (let xx = ox; xx <= CORNER + 30; xx += 20) cc.lineTo(xx, 668 - 12 * Math.sin(xx * 0.008) - 5 * ((hash1(xx, 3) + 1) / 2));
    cc.lineTo(CORNER + 30, 760);
    cc.closePath();
    cc.fill();
  })(c, Math.floor(r.x), Math.floor(r.y) - 20);
}

function lap(cc: C, env: PaintEnv, x0: number, x1: number, y: number) {
  if (x1 <= x0) return;
  cc.fillStyle = withAlpha(env.mood.fg, 0.5);
  cc.fillRect(x0, y, x1 - x0, 3);
  cc.fillStyle = withAlpha(env.mood.rim, 0.07);
  cc.fillRect(x0, y + 3, x1 - x0, 1);
}

/** the 1943 wick card's lamp, standing on a sill: a squared paper barrel with caps, its window on the wick */
function sillLamp(c: C, env: PaintEnv, x: number, y: number, s: number, lit: number) {
  const h = 33;
  const w = 25;
  const halfW = (yy: number) => {
    const u = Math.min(1, Math.abs(yy) / h);
    return w * Math.pow(Math.max(0, 1 - Math.pow(u, 2.4)), 0.42) + 5 * (1 - u);
  };
  c.save();
  c.translate(x, y - (h + 5) * s);
  c.scale(s, s);
  const ink = env.fill('ink');
  c.fillStyle = ink;
  const P = new Path2D();
  P.rect(-13, -h - 5, 26, 6);
  P.rect(-11, h - 1, 22, 6);
  P.rect(-3, -h - 12, 6, 8);
  const N = 20;
  for (let i = 0; i <= N; i++) {
    const yy = -h + (2 * h * i) / N;
    i ? P.lineTo(halfW(yy), yy) : P.moveTo(halfW(yy), yy);
  }
  for (let i = N; i >= 0; i--) {
    const yy = -h + (2 * h * i) / N;
    P.lineTo(-halfW(yy), yy);
  }
  P.closePath();
  c.fill(P);
  // the window on the flame (the practical adds the light)
  c.fillStyle = withAlpha(mixLab(env.mood.core, '#f3d48c', 0.5), 0.6 + 0.4 * lit);
  c.beginPath();
  c.moveTo(0, -20);
  c.bezierCurveTo(9, -6, 9, 10, 0, 12);
  c.bezierCurveTo(-9, 10, -9, -6, 0, -20);
  c.fill();
  c.fillStyle = ink;
  c.fillRect(-1.6, 6, 3.2, 12);
  c.strokeStyle = withAlpha(env.mood.halo, 0.35);
  c.lineWidth = 1.6;
  for (const ry of [-18, 18]) {
    c.beginPath();
    c.moveTo(-halfW(ry) + 3, ry);
    c.quadraticCurveTo(0, ry + 3, halfW(ry) - 3, ry);
    c.stroke();
  }
  c.restore();
}

interface Gable {
  x: number;
  w: number;
  h: number;
  roof: number;
  base: number;
}
function gable(cc: C, env: PaintEnv, hs: Gable, fill: string, snow: string, panes = true) {
  const { x, w, h, roof, base } = hs;
  cc.fillStyle = fill;
  cc.beginPath();
  cc.moveTo(x, base + 40);
  cc.lineTo(x, base - h);
  cc.lineTo(x + w / 2, base - h - roof);
  cc.lineTo(x + w, base - h);
  cc.lineTo(x + w, base + 40);
  cc.closePath();
  cc.fill();
  cc.fillRect(x + w * 0.7, base - h - roof * 0.7, 14 * (w / 170), 40 * (w / 170));
  if (panes) {
    // dark windows (unlit rooms, no holes): a faint pane edge only
    cc.fillStyle = withAlpha(env.mood.rim, 0.12);
    for (let k = 0; k < 2; k++) {
      const wx = x + 30 * (w / 170) + k * (w - 84 * (w / 170));
      cc.fillRect(wx, base - h + 36 * (h / 150), 24 * (w / 170), 1);
      cc.fillRect(wx, base - h + 92 * (h / 150), 24 * (w / 170), 1);
    }
  }
  cc.strokeStyle = snow;
  cc.lineWidth = 3 * Math.min(1, w / 170);
  cc.beginPath();
  cc.moveTo(x - 2, base - h - 1);
  cc.lineTo(x + w / 2, base - h - roof - 2);
  cc.lineTo(x + w + 2, base - h - 1);
  cc.stroke();
}

/** McCulloch's house (L2, cached): farther down the street than its neighbours — smaller, its base higher up the
 *  receding street, a step paler in the haze — standing in the gap of the near rank */
function mccullochHouse(f: Frame, c: C, env: PaintEnv) {
  const H = FAR_HOUSE;
  const w = 190 * H.s;
  f.cached(`${ID}/mcHouse/${env.mood.id}`, Math.ceil(w + 40), 240, (cc) => {
    cc.translate(-(H.cx - w / 2 - 20), -(H.base - 200));
    const fill = mixLab(mixLab(env.fill('set'), env.mood.fg, 0.2), env.mood.haze, 0.22);
    gable(cc, env, { x: H.cx - w / 2, w, h: 158 * H.s, roof: 78 * H.s, base: H.base }, fill, mixLab(env.mood.setHaze, env.mood.rim, 0.4), false);
  })(c, H.cx - w / 2 - 20, H.base - 200);
}

/** the near rank of the street's gables (L2, cached), all dark, a gap where McCulloch's house stands farther back */
function nearRank(f: Frame, c: C, env: PaintEnv) {
  const r = overscan(LAYERS.L2, CAMS, 40);
  f.cached(`${ID}/rank/${env.mood.id}`, Math.ceil(r.x + r.w) - 760, 380, (cc) => {
    cc.translate(-760, -250);
    const fill = mixLab(env.fill('set'), env.mood.fg, 0.2);
    const snow = mixLab(env.mood.setHaze, env.mood.rim, 0.45);
    const houses: Gable[] = [
      { x: 790, w: 178, h: 154, roof: 74, base: 520 },
      { x: 1150, w: 168, h: 146, roof: 66, base: 520 },
      { x: 1326, w: 150, h: 130, roof: 60, base: 520 },
    ];
    for (const hs of houses) gable(cc, env, hs, fill, snow);
  })(c, 760, 250);
}

/** L1: a far rank of rooftops and chimneys beyond the street (hazed pale by distance) */
function farRoofs(f: Frame, c: C, env: PaintEnv) {
  const r = overscan(LAYERS.L1, CAMS, 40);
  f.cached(`${ID}/farRoofs2/${env.mood.id}`, Math.ceil(r.x + r.w) - 700, 220, (cc) => {
    cc.translate(-700, -300);
    cc.fillStyle = env.fill('set');
    cc.beginPath();
    cc.moveTo(700, 520);
    let x = 700;
    let i = 0;
    while (x < r.x + r.w + 40) {
      const w = 70 + 60 * ((hash1(i, 51) + 1) / 2);
      const h = 44 + 44 * ((hash1(i, 52) + 1) / 2);
      const base = 452;
      cc.lineTo(x, base - h);
      cc.lineTo(x + w / 2, base - h - 26 - 10 * ((hash1(i, 53) + 1) / 2));
      cc.lineTo(x + w, base - h);
      if (hash1(i, 54) > 0) {
        cc.lineTo(x + w + 4, base - h);
        cc.lineTo(x + w + 4, base - h - 22);
        cc.lineTo(x + w + 14, base - h - 22);
        cc.lineTo(x + w + 14, base - h);
      }
      x += w + 16;
      i++;
    }
    cc.lineTo(x, 520);
    cc.closePath();
    cc.fill();
  })(c, 700, 300);
}

/** L6: a snow-laden branch crossing the top-right corner (very near, heavily blurred) */
function branch(f: Frame, c: C, env: PaintEnv) {
  const R = { x: 820, y: -120, w: 680, h: 300 };
  f.cached(
    `${ID}/branchL6b/${env.mood.id}`,
    R.w,
    R.h,
    (cc) => {
      cc.translate(-R.x, -R.y);
      const fg = env.fill('fg');
      const snow = mixLab(env.mood.setHaze, env.mood.rim, 0.5);
      const limb = (x0: number, y0: number, x1: number, y1: number, cx: number, cy: number, w0: number, w1: number) => {
        const N = 16;
        const P = new Path2D();
        const pt = (u: number) => {
          const a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u;
          return [a * x0 + b * cx + d * x1, a * y0 + b * cy + d * y1];
        };
        const top: number[][] = [];
        const bot: number[][] = [];
        for (let i = 0; i <= N; i++) {
          const u = i / N;
          const [px, py] = pt(u);
          const wd = w0 + (w1 - w0) * u;
          top.push([px, py - wd / 2]);
          bot.push([px, py + wd / 2]);
        }
        top.forEach(([px, py], i) => (i ? P.lineTo(px, py) : P.moveTo(px, py)));
        bot.reverse().forEach(([px, py]) => P.lineTo(px, py));
        P.closePath();
        cc.fillStyle = fg;
        cc.fill(P);
        // snow lying along the top of the limb
        cc.strokeStyle = snow;
        cc.lineWidth = Math.max(5, w0 * 0.55);
        cc.lineCap = 'round';
        cc.beginPath();
        top.slice(0, N - 2).forEach(([px, py], i) => (i ? cc.lineTo(px, py - 1) : cc.moveTo(px, py - 1)));
        cc.stroke();
      };
      limb(1500, -20, 880, 66, 1220, 64, 40, 10);
      limb(1240, 58, 1120, -60, 1170, 30, 14, 4);
      limb(1060, 64, 900, 120, 980, 80, 10, 3);
      limb(1400, 18, 1330, -80, 1360, -20, 16, 5);
      limb(980, 70, 960, 150, 975, 110, 7, 2.5);
    },
    { blur: 10 },
  )(c, R.x, R.y);
}

/** the far lamp's strength: lit, then a 1.2 s dim from just before 'later', with one last small flicker (twos) */
function farLamp(t: number, later: number): number {
  const u = (tq12(t) - (later - 0.1)) / 1.2;
  if (u <= 0) return 1;
  if (u >= 1) return 0;
  let k = 1 - sm(u);
  if (u > 0.6 && u < 0.68) k += 0.2; // the flame catches once more…
  else if (u >= 0.68 && u < 0.74) k *= 0.5; // …and gutters
  return Math.max(0, Math.min(1, k));
}

/** the far window: a small hole lit the same warm amber as the near lamp, its lamp on the sill and a small halo;
 *  it dims to dark on 'later' */
function farWindow(c: C, env: PaintEnv, k: number) {
  const { x, y, w, h } = FAR;
  const dark = mixLab(env.fill('set'), env.mood.fg, 0.35);
  const g = c.createRadialGradient(x + w / 2 + 6, y + h - 8, 2, x + w / 2, y + h / 2, w * 0.9);
  g.addColorStop(0, mixLab(dark, '#f2c27a', k));
  g.addColorStop(0.5, mixLab(dark, '#d99a52', k));
  g.addColorStop(1, mixLab(dark, '#8a5a2c', k));
  c.fillStyle = g;
  c.fillRect(x, y, w, h);
  c.fillStyle = env.fill('set');
  c.fillRect(x + w / 2 - 1.5, y, 3, h);
  c.fillRect(x, y + h / 2 - 1.5, w, 3);
  c.fillRect(x - 5, y + h, w + 10, 4);
  // the tiny lamp on its sill
  sillLamp(c, env, x + w / 2 + 6, y + h - 2, 0.15, k);
  // its small warm halo through the glass (the near lamp's colour, at a distance)
  if (k > 0.01) {
    c.save();
    c.globalCompositeOperation = 'lighter';
    const hg = c.createRadialGradient(x + w / 2 + 5, y + h - 8, 1, x + w / 2 + 5, y + h - 8, 24);
    hg.addColorStop(0, withAlpha('#f0b866', 0.4 * k));
    hg.addColorStop(0.45, withAlpha('#c98a44', 0.16 * k));
    hg.addColorStop(1, withAlpha('#c98a44', 0));
    c.fillStyle = hg;
    c.beginPath();
    c.arc(x + w / 2 + 5, y + h - 8, 24, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
}

/** the near house's corner (L4): a downpipe with brackets and a shoe at the foot, rim-lit on its moon side, so
 *  the wall ends in a finished paper-cut edge */
function downpipe(f: Frame, c: C, env: PaintEnv) {
  const r = overscan(LAYERS.L4, CAMS, 40);
  f.cached(`${ID}/pipe/${env.mood.id}`, 60, Math.ceil(r.h) + 60, (cc) => {
    const oy = Math.floor(r.y) - 30;
    cc.translate(-(CORNER - 30), -oy);
    const px = CORNER - 6;
    const ink = env.fill('ink');
    cc.fillStyle = ink;
    // the corner board, proud of the wall
    cc.fillRect(CORNER - 30, oy, 30, r.h + 60);
    // the pipe, standing off the corner by its brackets, with a shoe kicking out at the foot
    cc.fillRect(px, oy, 13, 690 - oy);
    cc.beginPath();
    cc.moveTo(px, 690);
    cc.quadraticCurveTo(px + 2, 712, px + 26, 714);
    cc.lineTo(px + 26, 727);
    cc.quadraticCurveTo(px - 10, 724, px, 690);
    cc.closePath();
    cc.fill();
    for (let yy = oy + 120; yy < 690; yy += 170) cc.fillRect(px - 8, yy, 24, 6);
    // the moon catches the pipe's right edge and the corner board's lip
    cc.fillStyle = withAlpha(env.mood.rim, 0.42);
    cc.fillRect(px + 11.5, oy, 1.5, 690 - oy);
    cc.fillStyle = withAlpha(env.mood.rim, 0.22);
    cc.fillRect(CORNER - 31, oy, 1.2, r.h + 60);
  })(c, CORNER - 30, Math.floor(r.y) - 30);
}

/** the near eave (L5, blurred): the roof edge across the top-left with a fringe of icicles, close to the lens */
function eave(f: Frame, c: C, env: PaintEnv) {
  const r = overscan(LAYERS.L5, CAMS, 60);
  f.cached(
    `${ID}/eave/${env.mood.id}`,
    1020 - Math.floor(r.x),
    200,
    (cc) => {
      cc.translate(-Math.floor(r.x), -Math.floor(r.y) + 10);
      const fg = env.fill('fg');
      cc.fillStyle = fg;
      const y0 = Math.floor(r.y) - 10;
      cc.beginPath();
      cc.moveTo(Math.floor(r.x), y0);
      cc.lineTo(960, y0);
      cc.lineTo(900, 50);
      cc.lineTo(Math.floor(r.x), 78);
      cc.closePath();
      cc.fill();
      // icicles: tapering teeth of varied length along the eave's underside
      for (let i = 0; i < 48; i++) {
        const x = Math.floor(r.x) + 20 + i * 19 + 6 * hash1(i, 21);
        if (x > 890) break;
        const base = 78 - ((x - Math.floor(r.x)) / (900 - Math.floor(r.x))) * 28;
        const len = 10 + 60 * Math.pow((hash1(i, 22) + 1) / 2, 2);
        cc.beginPath();
        cc.moveTo(x - 4, base - 1);
        cc.lineTo(x + 0.5, base + len);
        cc.lineTo(x + 4, base - 1);
        cc.closePath();
        cc.fill();
      }
      // snow along the eave's top, catching the moon
      cc.fillStyle = withAlpha(mixLab(env.mood.setHaze, env.mood.rim, 0.5), 0.6);
      cc.fillRect(Math.floor(r.x), y0, 960 - Math.floor(r.x), 6);
    },
    { blur: 6 },
  )(c, Math.floor(r.x), Math.floor(r.y) - 10);
}

/** the snowy street (L3, cached): a pale ground receding to the right, a fence line, wheel ruts */
function street(f: Frame, c: C, env: PaintEnv) {
  const r = overscan(LAYERS.L3, CAMS, 60);
  f.cached(`${ID}/street/${env.mood.id}`, Math.ceil(r.w), 780 - 470, (cc) => {
    cc.translate(-r.x, -470);
    const g = cc.createLinearGradient(0, 520, 0, 780);
    g.addColorStop(0, mixLab(env.mood.setHaze, env.mood.haze, 0.5));
    g.addColorStop(1, mixLab(env.mood.set, env.mood.setHaze, 0.5));
    cc.fillStyle = g;
    cc.beginPath();
    cc.moveTo(r.x, 780);
    cc.lineTo(r.x, STREET_Y - 30);
    cc.lineTo(r.x + r.w, 528);
    cc.lineTo(r.x + r.w, 780);
    cc.closePath();
    cc.fill();
    // ruts converging down the street
    cc.strokeStyle = withAlpha(env.mood.fg, 0.2);
    cc.lineWidth = 2;
    for (const k of [0, 1]) {
      cc.beginPath();
      cc.moveTo(700, 760 - k * 40);
      cc.quadraticCurveTo(1000, 600 - k * 14, 1500, 548 - k * 6);
      cc.stroke();
    }
    // a picket fence along the far side, in silhouette
    cc.fillStyle = mixLab(env.fill('set'), env.mood.fg, 0.3);
    for (let x = 820; x < r.x + r.w; x += 16) {
      const u = (x - 820) / 700;
      const top = 540 - 26 * (1 - u * 0.5);
      cc.fillRect(x, top, 4, 556 - top);
    }
    cc.fillRect(820, 530, r.x + r.w - 820, 3);
  })(c, r.x, 470);
}

/** a typed memorial line on a soft plate (Special Elite, the 1969 stamp face), fading in and holding */
function memorial(f: Frame, text: string, x0: number, y: number, t: number, at: number, o: { maxRight?: number; size?: number } = {}) {
  const a = win(t, at, at + 0.9);
  if (a <= 0.01) return;
  const c = f.c;
  c.save();
  c.globalAlpha = a;
  c.textBaseline = 'alphabetic';
  // sized at the type kit's floor (22 px cap height at 1080p) or the requested size, whichever is larger
  const size = legibleSize(c, `400 ${o.size ?? 25}px ${FONT.typewriter}`, o.size ?? 25);
  c.font = `400 ${size}px ${FONT.typewriter}`;
  const w = c.measureText(text).width;
  const x = o.maxRight !== undefined ? Math.min(x0, o.maxRight - w / 2) : x0;
  softPlate(c, x, y - 8, w + 150, 84, f.mood.ink, 0.55);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillStyle = textColor(f.mood);
  c.fillText(text, x, y);
  c.restore();
}
