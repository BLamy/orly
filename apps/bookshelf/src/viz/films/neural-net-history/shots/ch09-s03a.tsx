/**
 * ch09-s03a — on the Wall of Forecasts the Go programmer's 'maybe ten years' slip comes into focus, and a small Go
 * candle is lit on the shelf below (candleAmber, STUDY LOCK; 8.08 s; in: crossfade = a palette change serverCyan →
 * candleAmber, not a signature transition).
 *
 *   0           WALL: the lamp end of the Wall (W3, W4 in the pool), the palette warming out of the hotel's cyan; a
 *               slow lateral truck outward to slot 5, where a new slip hangs soft, out of focus
 *   'gave'-.46  the Coulom slip (W5, May 2014, DUE 2024) racks into focus; the quote card sets in (the one legible
 *               text: “I think maybe ten years” — Rémi Coulom, to Wired, May 2014)
 *   'years'     SHELF insert (low macro at candle height): the hands strike a match and light the small candle
 *               lettered A GO MACHINE IS A DECADE AWAY, tag 2014, beside the nets' own candle (2012); the belief begins
 *               The lit flame is held on screen 1.3 s after it catches, so the viewer sees the belief begin.
 *   back        WALL again (≈ 5.9 s): one slow eased push begins (≈ 2.2 s), so the slip fills the frame by 'two'
 *   'two'       the slip's typed due date, 2024, catches the lamp: a warm specular sweep across DUE 2024 (0.35 s),
 *               then a soft afterglow to the cut
 *   line end    the same push carries on into the slip's paper grain; the shot ends inside it (ch09-s03
 *               paper-wipes out of the grain to Seoul)
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec } from '../../../film';
import { LAYERS, defineShot, dustMotes, mixLab, quoteCard, toLayer, toScreen, withAlpha } from '../../../film';
import { hands } from '../cast';
import { STUDY, studyCase, studyRoom } from '../sets/study';
import { beliefCandle, shelfFlames } from '../sets/beliefCandle';
import { shelfStateAt } from '../sets/studyState';
import { paperTone } from '../sets/caseBoard';
import { W5C, W5DUE, W5GRAIN, GO, coulomSlip, frameOn, goView, kOf, mixFrame, paperGrain, wallPool } from '../sets/ch09-s03a-kit';
import { clamp01, lerp, sm, tq12, win } from '../sets/ch02-s05b-util';

const ID = 'ch09-s03a';
const mixAlpha = (col: string, a: number) => withAlpha(col, a);

// ------------------------------------------------------------------------------------------------ cameras
/** round 1: the lamp end of the Wall (the lamp's shade at frame left, near and soft), then a slow lateral truck
 *  outward (≈ 150 px on the Wall) so that on 'gave' W5 sits on the right third, W3–W5 whole, W6's shadow slot beside
 *  it and the quote card in the clear air to its right */
const K_WALL = 2.1;
const W5_AT = { x: 742, y: 226 };
const WALL0 = frameOn(W5C, { x: W5_AT.x + 150, y: W5_AT.y + 6 }, K_WALL);
const WALL1 = frameOn(W5C, W5_AT, K_WALL);
const WALL2 = frameOn(W5C, { x: 760, y: 250 }, 2.3);
/** the push: the slip fills the frame by 'two' (k ≈ 9, centred on the slip), then the grain (k 16) by the end */
const K_SLIP = 9;
const K_GRAIN = 16;
const GRAIN = frameOn(W5GRAIN, { x: 640, y: 360 }, K_GRAIN);
/** the shelf insert (low macro at candle height): the Go candle a little right of centre and low enough that the
 *  working hand comes up from the frame's bottom edge with a short forearm; the nets' candle beside it */
const SHELF0 = frameOn(GO.flame, { x: 610, y: 270 }, 1.36);
const SHELF1 = frameOn(GO.flame, { x: 614, y: 274 }, 1.44);
const CAMS = [WALL0, WALL1, WALL2, SHELF0, SHELF1, frameOn(W5GRAIN, { x: 640, y: 360 }, 3)];
/** the near plane on the Wall (L5, soft): the green-shaded lamp's shade at frame left, and the shelf plank's edge
 *  along the bottom 8%; fixed L5 world points, so they slide ~4× faster than the Wall as the camera trucks */
const L5S = { ...LAYERS.L5, id: 'L5s03a', z: 800, blur: 6 };
const K5 = toScreen(L5S, WALL0, 0, 0).k;
const SHADE = toLayer(L5S, WALL0, -60, 452);
const PLANK_Y = toLayer(L5S, WALL1, 0, 662).y;

/** the W5 slip's own plane (same depth as the Wall): soft until 'gave' */
const slipLayer = (blur: number): LayerSpec => ({ ...LAYERS.L4, id: 'L4w5', blur });

interface B {
  D: number;
  focus: number;
  quote: number;
  ins0: number;
  ins1: number;
  strike0: number;
  strikeDur: number;
  years: number;
  two: number;
  push0: number;
  end: number;
  quoteOut: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const years = T.beat('goCandleLit');
    const strikeDur = 2.0;
    const b: B = {
      D,
      focus: T.beat('slip'),
      quote: T.beat('slip') + 0.15,
      ins0: years - 0.72,
      // hold the lit Go flame at least 0.6 s after it catches (it catches at 'years'): the belief begins on screen
      ins1: years + 1.3,
      strike0: years - 0.6 * strikeDur,
      strikeDur,
      years,
      two: T.beat('dueGlint'),
      // the push begins as soon as we are back on the Wall (≈ 5.9 s) and eases over ≈ 2.2 s to the end
      push0: years + 1.3,
      end: D,
      // the quote leaves as the push begins, so it never sits over the slip's own typing
      quoteOut: years + 1.3,
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    // the palette comes home from the hotel's cyan (a mood change under the reel's crossfade)
    const mu = sm(t / 1.3);
    if (mu < 1) f.setMood('candleAmber', { from: 'serverCyan', u: mu });
    else f.setMood('candleAmber');
    if (t >= b.ins0 && t < b.ins1) paintShelf(f, b, t);
    else paintWall(f, b, t);
    // the quote card: from 'gave' until the push begins (kept through the brief insert, low in frame)
    // (round 1: beside the slip, in the clear air right of W5, over its own soft plate; same size)
    quoteCard(f.c, { quote: 'I think maybe ten years', speaker: 'Rémi Coulom', source: 'to Wired, May 2014', x: 1088, y: 250, width: 500, maxChars: 26, size: 30, at: b.quote, dur: b.quoteOut - b.quote, fade: 0.35, stagger: 0.2 }, { t, mood: f.mood });
  },
});

// ================================================================================================ WALL
function wallCam(b: B, t: number): Camera3 {
  if (t < b.ins0) return mixFrame(WALL0, WALL1, sm(t / (b.focus + 0.3)));
  if (t < b.push0) return WALL2;
  // ONE slow eased push (log scale): the slip fills the frame by 'two', the paper grain fills it by the end. The aim
  // stays on the slip's centre until 'two' (so DUE 2024 is in frame for its glint), then drifts to the blank grain.
  const u = clamp01((t - b.push0) / (b.end - b.push0));
  const uTwo = clamp01((b.two - b.push0) / (b.end - b.push0));
  const e = Math.pow(sm(u), 0.8);
  const eTwo = Math.pow(sm(uTwo), 0.8);
  const k0 = kOf(WALL2);
  // piecewise in log k: WALL2 → K_SLIP at 'two' → K_GRAIN at the end, joined smoothly by the one ease
  const lk = e <= eTwo ? Math.log(k0) + (Math.log(K_SLIP) - Math.log(k0)) * (e / eTwo) : Math.log(K_SLIP) + (Math.log(K_GRAIN) - Math.log(K_SLIP)) * ((e - eTwo) / (1 - eTwo));
  const k = Math.exp(lk);
  const a = sm(clamp01((t - b.two) / (b.end - b.two)));
  const p = { x: lerp(W5C.x, W5GRAIN.x, a), y: lerp(W5C.y, W5GRAIN.y, a) };
  // screen anchor: from WALL2's (slip at 410,300) to frame centre by 'two'
  const w2 = { x: 640 - (W5C.x - WALL2.x) * k0, y: 360 - (W5C.y - WALL2.y) * k0 };
  const sa = sm(clamp01((t - b.push0) / (b.two - b.push0)));
  return frameOn(p, { x: lerp(w2.x, 640, sa), y: lerp(w2.y, 360, sa) }, k);
}

function paintWall(f: Frame, b: B, t: number) {
  const cam = wallCam(b, t);
  f.camera(cam);
  studyRoom(f, { key: ID, cams: CAMS, outside: { mood: 'duskRose', kind: 'night' } });
  f.fog('B');
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    flames: false,
    board: false,
    shelf: false,
    // (round 1: the X-ray column sits behind the near lamp's shade at frame left in this framing; it is left out of
    // the Wall section so the lamp's soft silhouette and its light carry that corner)
    xray: false,
    wall: { hide: ['W5'] },
  });
  // the W5 slip in its own plane, racking into focus on 'gave'
  const fu = win(t, b.focus - 0.35, b.focus + 0.25);
  const blur = lerp(3.6, 0, fu);
  // 'two': a 0.35 s warm specular sweep across DUE 2024, then a soft afterglow held to the cut
  const sw0 = b.two - 0.08;
  const due = win(t, sw0 - 0.05, sw0 + 0.12) * (0.6 + 0.4 * Math.exp(-Math.max(0, t - sw0 - 0.35) * 2.5));
  const sweep = (t - sw0) / 0.35;
  const draw = (c: CanvasRenderingContext2D, env: Parameters<typeof coulomSlip>[1]) => coulomSlip(c, env, { dueGlint: due, dueSweep: sweep, light: 0.72 + 0.15 * fu });
  if (blur > 0.25) f.layer(slipLayer(blur), draw);
  else f.layer('L4', draw);
  f.rim({ x: -0.4, y: -0.9 });
  f.layer('L4', (c, env) => dustMotes(c, { area: { x: W5C.x - 360, y: W5C.y - 220, w: 760, h: 460 }, count: 34, drift: { x: -3, y: -2 }, brightness: 0.5, salt: 905 }, env));
  // the lamp's pool: it starts at the lamp end (frame left, motivated by the shade) and follows the truck to W5
  const pu = sm(clamp01(t / (b.focus + 0.3)));
  wallPool(f, cam, { x: lerp(W5C.x - 230, W5C.x - 40, pu), y: W5C.y + 10 }, lerp(420, 380, pu), 1 + 0.25 * fu, 0.85);
  // the Wall's far end falls off into the dark: a vignette anchored to the panel's own right edge (never an
  // unpainted layer edge), so W6's shadow slot and the air beside W5 stay readable
  {
    const c = f.c;
    const kk = kOf(cam);
    const v = 1 - clamp01((Math.log(kk) - Math.log(2.6)) / (Math.log(5) - Math.log(2.6)));
    const ex = toScreen(LAYERS.L4, cam, STUDY.wall.x + 620 * STUDY.wall.k, 0).x;
    if (v > 0.01 && ex < 1500) {
      const g = c.createLinearGradient(ex - 260, 0, ex + 40, 0);
      g.addColorStop(0, mixAlpha(f.mood.fg, 0));
      g.addColorStop(0.6, mixAlpha(f.mood.fg, 0.7 * v));
      g.addColorStop(1, mixAlpha(f.mood.fg, 0.94 * v));
      c.fillStyle = g;
      c.fillRect(ex - 260, 0, 1280, 720);
    }
  }
  wallNear(f, b, t, cam);
  // inside the push the paper's own grain fills the frame
  const k = kOf(cam);
  const g = clamp01((Math.log(k) - Math.log(K_SLIP * 1.08)) / (Math.log(K_GRAIN * 0.92) - Math.log(K_SLIP * 1.08)));
  paperGrain(f, sm(g), mixLab(paperTone({ mood: f.mood } as never, 0.8), f.mood.rim, 0.35), 905);
}

/** the Wall's near plane (L5, soft): the green-shaded lamp's shade at frame left (its lit underside and its light
 *  motivating the pool), and the shelf plank's edge along the bottom 8% with a pierced bracket. Both are fixed L5
 *  world points: the truck slides them across the frame several times faster than the Wall (the room's depth). */
function wallNear(f: Frame, b: B, t: number, cam: Camera3) {
  if (cam.z > 600) return;
  void b;
  void t;
  const sh = toScreen(L5S, cam, SHADE.x, SHADE.y);
  const lampOn = sh.x > -200;
  if (lampOn) {
    const bulb = toLayer(LAYERS.L4, cam, sh.x - 60, sh.y + 40);
    f.practical({ x: bulb.x, y: bulb.y, kind: 'lamp', seed: 905, intensity: 0.6, radius: 150 / kOf(cam) });
  }
  f.layer(L5S, (c, env) => {
    const m = env.mood;
    const u = 1 / K5; // screen px → L5 world units at the truck's scale
    // the plank: a dark band across the bottom with a moulded top edge catching the lamp
    c.fillStyle = env.fill('fg');
    c.fillRect(SHADE.x - 3000 * u, PLANK_Y, 9000 * u, 400 * u);
    c.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.4), 0.35);
    c.fillRect(SHADE.x - 3000 * u, PLANK_Y - 1.5 * u, 9000 * u, 3 * u);
    c.fillStyle = withAlpha(m.fg, 0.9);
    c.fillRect(SHADE.x - 3000 * u, PLANK_Y + 8 * u, 9000 * u, 2 * u);
    // a pierced bracket under the plank (paper filigree), every ~520 px
    c.fillStyle = env.fill('fg');
    for (let i = -2; i < 6; i++) {
      const bx = SHADE.x + (240 + i * 520) * u;
      c.beginPath();
      c.moveTo(bx - 40 * u, PLANK_Y);
      c.lineTo(bx + 40 * u, PLANK_Y);
      c.quadraticCurveTo(bx + 6 * u, PLANK_Y + 10 * u, bx, PLANK_Y + 60 * u);
      c.quadraticCurveTo(bx - 6 * u, PLANK_Y + 10 * u, bx - 40 * u, PLANK_Y);
      c.fill();
    }
    if (!lampOn) return;
    // the lamp's shade (we see its right end: ~180 px of rim): a dark green cut-paper half-cylinder on a brass stem
    c.save();
    c.translate(SHADE.x, SHADE.y);
    c.scale(1.35 * u, 1.35 * u);
    const shade = new Path2D();
    shade.moveTo(-420, -54);
    shade.lineTo(110, -54);
    shade.quadraticCurveTo(150, -52, 168, -14);
    shade.lineTo(184, 28);
    shade.lineTo(-420, 28);
    shade.closePath();
    c.fillStyle = mixLab(env.fill('fg'), '#24382c', 0.42);
    c.fill(shade);
    // its top catches a little room light; the ribbing as faint cut-lines
    c.fillStyle = withAlpha(mixLab(m.rim, '#7fa88a', 0.4), 0.3);
    c.fillRect(-420, -55, 530, 2);
    c.strokeStyle = withAlpha('#7fa88a', 0.12);
    c.lineWidth = 1.5;
    for (const x of [-300, -180, -60, 50]) {
      c.beginPath();
      c.moveTo(x, -52);
      c.lineTo(x + 10, 26);
      c.stroke();
    }
    // the glowing underside lip (the bulb's light leaking under the shade)
    const lip = c.createLinearGradient(0, 22, 0, 40);
    lip.addColorStop(0, withAlpha(mixLab(m.core, '#fff2d0', 0.4), 0.9));
    lip.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = lip;
    c.fillRect(-420, 26, 600, 14);
    // the stem and the arm down to the desk (out of frame)
    c.fillStyle = env.fill('fg');
    c.fillRect(-150, 36, 18, 260);
    c.restore();
  });
}

// ================================================================================================ SHELF insert
function paintShelf(f: Frame, b: B, t: number) {
  const cam = mixFrame(SHELF0, SHELF1, sm((t - b.ins0) / (b.ins1 - b.ins0)));
  f.camera(cam);
  studyRoom(f, { key: ID, cams: CAMS, outside: { mood: 'duskRose', kind: 'night' } });
  const tq = tq12(t);
  const u = clamp01((tq - b.strike0) / b.strikeDur);
  const caught = tq >= b.years;
  const flameK = caught ? Math.min(1, 0.5 + 0.5 * sm((tq - b.years) / 0.3)) : 0;
  // the working hand comes up from the frame's bottom edge, lamp side: a short forearm (≤ 200 px in frame), the
  // wrist bent, the match flame the sharp point; the matchbox hand stays low at the right
  const tgt = toScreen(LAYERS.L4, cam, GO.flame.x, GO.flame.y);
  const entry = {
    R: toLayer(LAYERS.L4, cam, tgt.x + 230, 900),
    L: toLayer(LAYERS.L4, cam, tgt.x + 470, 960),
  };
  const strikeAt = toLayer(LAYERS.L4, cam, tgt.x + 250, 560);
  const hp = u > 0 && u < 1 ? hands.act('strikeLight', u, GO.flame, { entry, scale: 0.95, strikeAt }) : null;
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    flames: false,
    board: false,
    wall: false,
    xray: false,
    shelf: { drawFlames: false },
    extra: (c, env) => {
      beliefCandle(c, { x: GO.x, y: GO.y, view: goView('lit'), s: STUDY.shelf.s, flame: flameK, letters: 0.85, drawFlame: false }, env);
      if (hp) hands.draw(c, hp, env);
    },
  });
  // the shelf's live flames (the nets' candle beside it, the old taper further along), then the new one
  for (const fl of liveFlames()) f.practical({ x: fl.x, y: fl.y, kind: 'candle', seed: fl.seed, intensity: 0.85, radius: 36 });
  const fl = hp ? hands.flameAt(hp) : null;
  if (fl) f.practical({ x: fl.x, y: fl.y, kind: 'candle', seed: 2014, intensity: 0.9, radius: 30 });
  if (flameK > 0) f.practical({ x: GO.flame.x, y: GO.flame.y + 2, kind: 'candle', seed: 2015, intensity: 0.9 * flameK, radius: 34 + 8 * flameK });
  // the near plane at candle height: no table-end slab, only a soft dark haze along the bottom 14% (L5, out of focus)
  {
    const c = f.c;
    const g = c.createLinearGradient(0, 600, 0, 720);
    g.addColorStop(0, withAlpha(f.mood.fg, 0));
    g.addColorStop(0.6, withAlpha(f.mood.fg, 0.5));
    g.addColorStop(1, withAlpha(f.mood.fg, 0.78));
    c.fillStyle = g;
    c.fillRect(0, 600, 1280, 120);
  }
}

const SHELF_START = shelfStateAt(ID, 'start');
function liveFlames() {
  return shelfFlames({ ...STUDY.shelf, views: SHELF_START });
}
