/**
 * ch07-s04 — accomplice two, FIRE (candleAmber, the study desk; 19.0 s, in on a paperWipe).
 * A gaming card held up to the lamp glows like a small furnace, weeks shrink to a day, and a plain stack trains
 * in one pulse with no warm-up.
 *
 *   0 → .6        the night side of the turning paper globe sweeps off frame (the occluder that carried the wipe)
 *                 and leaves the study desk in the banker's lamp's amber pool. The detective's hands hold a long
 *                 double-slot graphics card (generic, two fans, no marks) up to the lamp like a jeweller's stone
 *   'fire'        the fans spin up; the vents breathe an orange glow: a small paper furnace, embers drifting up
 *                 on L5 through haze on L3 (the era colour lives ONLY in this practical, never in the room's lamp);
 *                 stamp GRAPHICS CARDS · 2006–2010
 *   'seventy'     a parchment plate beside it: two paper clocks; the CPU's hand crawls, the card's sweeps once
 *                 round to about a day (Raina, Madhavan & Ng, 2009), the speed-up label beneath
 *   'record'      the clocks slide off; the lantern stack from ch07-s02 stands in their place, ONE image as input:
 *                 a handwritten digit wobbling as if reflected in water (elastic deformation); from random
 *                 weights the rows light all at once; the record label is pinned beneath
 *   'warm-up'     a faint ghost of ch07-s02's bottom-to-top sweep flickers up the loom and is struck through by
 *                 a single all-at-once pulse
 * Camera: a lateral truck across the held card (x ±80) with a 3 % push.
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv } from '../../../film';
import { LAYERS, MOODS, defineShot, mixLab, overscan, placeStamp, toLayer, withAlpha } from '../../../film';
import { hands } from '../cast';
import { HAND_LEN } from '../sets/narratorHands';
import { bankersLamp, gpuCard } from '../../../film/silhouette/props';
import { bookshelfWall } from '../../../film/silhouette/architecture';
import { embers } from '../../../film/silhouette/atmosphere';
import { FONT } from '../../../film/silhouette/type';
import { glow, parchmentPlate } from '../../../film/silhouette/metaphors/kit';
import { deepStack, stackLayout } from '../sets/ch07-s02-stack';
import { brassPin, capFont, clamp01, lerp, monoCard, pulse, sm, tq12, win } from '../sets/ch07-s01-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch07-s04';
const PARCH = MOODS.parchment;
const EMBER = MOODS.emberRed;

// ------------------------------------------------------------------------------------------------ geometry
/** held higher and a touch closer (review ch07 r1): only the hands and cuffs rise above the near desk's lip */
const CARD = { x: 552, y: 368, s: 8, rot: -0.05 };
const CARD_L = 27 * (320 / 175) * CARD.s; // stage px
const CARD_H = 11.4 * (320 / 175) * CARD.s;
const LAMP = { x: 168, y: 600, s: 7.2 };
const BULB = bankersLamp.anchors({ x: LAMP.x, y: LAMP.y, s: LAMP.s }).bulb;
const FANS = (() => {
  const a = gpuCard.anchors({ x: CARD.x, y: CARD.y, s: CARD.s, fans: 2, rot: CARD.rot });
  return [a.fan0, a.fan1];
})();
const PLATE = { x: 808, y: 96, w: 400, h: 380 };
const STACK_BOX = { x: 846, y: 36, w: 310, h: 350 };
const DIGIT = { x: 1001, y: 438 };
/** the input digit's slip, 1.5× (review ch07 r1) */
const DS = 1.5;
/** the near desk's lip (L5, screen y at rest): the forearms are cut here */
const LIP = 574;
/** the hands' entries (screen px): from below the lip, steep, so no forearm crosses the frame */
const ENTRY = { R: { x: 900, y: 1010 }, L: { x: 420, y: 1030 } };
const CAM0: Camera3 = { x: 560, y: 352, z: 0, lens: 1 };
const CAM1: Camera3 = { x: 720, y: 352, z: 30, lens: 1 };
const CAMS = [CAM0, CAM1];

interface B {
  D: number;
  /** 'built … games': the game-controller decal on the backplate */
  games: number;
  /** 'faster': the card's one-day clock completes as ≈ 70× resolves */
  faster: number;
  fire: number;
  seventy: number;
  record: number;
  allLit: number;
  nowarm: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const record = T.beat('record');
    const b: B = {
      D,
      games: T.word('L0706', 'built') - 0.1,
      faster: T.word('L0706', 'faster'),
      fire: T.beat('fire'),
      seventy: T.beat('seventy'),
      record,
      allLit: record + 0.75,
      nowarm: T.beat('nowarm'),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    const tq = tq12(t);
    const cam: Camera3 = { x: lerp(CAM0.x, CAM1.x, sm(t / b.D)), y: CAM0.y, z: lerp(CAM0.z, CAM1.z, sm(t / b.D)), lens: 1 };
    f.camera(cam);
    const heat = win(t, b.fire - 0.22, b.fire + 0.2); // the ramp peaks on 'fire'
    const breathe = heat * (0.82 + 0.18 * Math.sin(t * 2.3) + 0.06 * Math.sin(t * 7.1));
    f.backlight({ sunX: BULB.x + 200, sunY: 300, sunRadius: 520, intensity: 0.35 });
    // L2: the study wall behind the desk: dark panelling and a bookcase, warmed around the lamp (baked)
    f.layer('L2', (c, env) => {
      const r = overscan(LAYERS.L2, CAMS, 60);
      f.cached(`${ID}/L2/${env.mood.id}/${Math.round(r.x)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        const wall = mixLab(env.fill('set'), env.mood.fg, 0.35);
        cc.fillStyle = wall;
        cc.fillRect(r.x, r.y, r.w, r.h);
        bookshelfWall(cc, { x: 640, y: -60, w: 760, h: 760, bays: 4, seed: 404, gaps: 0.25, objects: true, backTone: 0.12 }, env);
        const pool = cc.createRadialGradient(BULB.x + 80, BULB.y + 120, 30, BULB.x + 80, BULB.y + 120, 1000);
        pool.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.3), 0.7));
        pool.addColorStop(0.5, withAlpha(mixLab(env.mood.set, env.mood.halo, 0.1), 0.3));
        pool.addColorStop(1, withAlpha(wall, 0));
        cc.fillStyle = pool;
        cc.fillRect(r.x, r.y, r.w, r.h);
      })(c, r.x, r.y);
    });
    f.fog({ yCenter: 0.6 * 720, height: 0.45 * 720, alpha: 0.2, drift: 7 });
    // L3: the banker's lamp on the desk, the haze that the furnace warms
    f.layer('L3', (c, env) => {
      bankersLamp(c, { x: LAMP.x, y: LAMP.y, s: LAMP.s, lit: true, seed: 41 }, env);
      if (heat > 0.01) {
        // the furnace's warmth caught in the haze around the card (the era colour, from the practical only)
        glow(c, CARD.x, CARD.y - CARD_H / 2, 300, EMBER.halo, 0.12 * breathe);
      }
    });
    f.fog('B');
    const entry = { R: toLayer(LAYERS.L4, cam, ENTRY.R.x, ENTRY.R.y), L: toLayer(LAYERS.L4, cam, ENTRY.L.x, ENTRY.L.y) };
    f.layer('L4', (c, env) => {
      // the desk edge across the bottom of the action plane
      c.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.25);
      c.fillRect(-300, 610, 2200, 300);
      c.fillStyle = withAlpha(env.mood.rim, 0.3);
      c.fillRect(-300, 609, 2200, 1.5);
      // the card held up to the lamp: right hand at its end, left hand under it
      const spin = 0.35 + 5.2 * heat;
      gpuCard(c, { x: CARD.x, y: CARD.y, s: CARD.s, fans: 2, spin, lit: 0, rot: CARD.rot, seed: 3 }, env);
      gameDecal(c, env, win(tq, b.games, b.games + 0.25));
      if (heat > 0.01) furnace(c, env, t, breathe);
      const len = HAND_LEN * 1.32;
      // at 'record' the right hand lets go and withdraws (the left holds the card alone), clearing the stack
      const off = sm((tq - (b.record - 0.35)) / 0.6);
      const grip = { x: CARD.x + CARD_L / 2 - 10, y: CARD.y - CARD_H * 0.42 };
      const away = { x: entry.R.x + 60, y: entry.R.y + 260 };
      const left = hands.reach(entry.L, { x: CARD.x - CARD_L * 0.18, y: CARD.y + 6 }, 'flat', len, { bend: -0.2 });
      if (off < 0.999) {
        const right = hands.reach(entry.R, { x: lerp(grip.x, away.x, off), y: lerp(grip.y, away.y, off) }, off > 0.15 ? 'open' : 'grip', len, { bend: 0.15 });
        hands.draw(c, { right, left, scale: 1.32 }, env);
      } else hands.draw(c, { left, scale: 1.32 }, env);
      // the teaching plate, then the stack
      teaching(c, env, t, b);
    });
    f.rim({ x: -0.75, y: -0.6 });
    f.practical({ x: BULB.x, y: BULB.y + 10, kind: 'lamp', seed: 41, intensity: 0.85, radius: 80, layer: 'L3' });
    // the furnace's glow (additive, emberRed: this shot's one saturated accent)
    if (heat > 0.01) {
      f.layer('L4', (c) => {
        for (const p of FANS) {
          glow(c, p.x, p.y, 120, EMBER.halo, 0.32 * breathe);
          glow(c, p.x, p.y, 36, EMBER.core, 0.5 * breathe);
        }
      });
    }
    // L5: embers rising off the card past the lens, the near desk edge (blurred)
    f.layer('L5', (c, env) => {
      if (heat > 0.01) {
        const e2: PaintEnv = { ...env, mood: { ...env.mood, core: EMBER.core, halo: EMBER.halo, rim: EMBER.rim } };
        embers(c, { x: CARD.x * 0.92, y: CARD.y - CARD_H * 0.6, spread: CARD_L * 0.7, count: 26, rise: 60, life: 3.2, wind: 8, size: 2.2, intensity: 0.9 * heat, salt: 7 }, e2);
      }
      // the near desk's lip: the forearms end here
      c.fillStyle = env.fill('fg');
      c.fillRect(-500, LIP, 2600, 600);
      c.fillStyle = withAlpha(env.mood.rim, 0.35);
      c.fillRect(-500, LIP - 1, 2600, 2);
    });
    // the globe's night side sweeping off (the occluder that carried the wipe)
    const occ = 1 - sm(t / 0.6);
    if (occ > 0.001) {
      f.layer('L6', (c, env) => {
        c.fillStyle = env.fill('fg');
        c.beginPath();
        c.arc(640 - 1500 * (1 - occ) - 300, 360, 1100, 0, Math.PI * 2);
        c.fill();
      });
    }
    // type: the date stamp, the plate labels (screen-locked)
    placeStamp(f.c, { place: 'Graphics cards', date: '2006–2010', style: 'mono', at: b.fire + 0.1, dur: b.seventy - b.fire + 1.0 }, { t, mood: f.mood, seed: 74 });
  },
});

/** the card's vents breathing an orange glow: a small paper furnace */
function furnace(c: C, env: PaintEnv, t: number, k: number) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const p of FANS) {
    const R = CARD_H * 0.36;
    const g = c.createRadialGradient(p.x, p.y, 2, p.x, p.y, R);
    g.addColorStop(0, withAlpha(EMBER.core, 0.85 * k));
    g.addColorStop(0.6, withAlpha(EMBER.halo, 0.55 * k));
    g.addColorStop(1, withAlpha(EMBER.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - R, p.y - R, 2 * R, 2 * R);
  }
  // the vent slots along the shroud's top edge glow too
  c.fillStyle = withAlpha(EMBER.core, 0.5 * k * (0.8 + 0.2 * Math.sin(t * 9)));
  c.save();
  c.translate(CARD.x, CARD.y);
  c.rotate(CARD.rot);
  for (let i = 0; i < 9; i++) c.fillRect(-CARD_L * 0.36 + i * CARD_L * 0.08, -CARD_H + 4, CARD_L * 0.05, 2.5);
  c.restore();
  c.restore();
}

// ================================================================================================= TEACHING
function teaching(c: C, env: PaintEnv, t: number, b: B) {
  const inA = win(t, b.seventy - 0.3, b.seventy - 0.05);
  const outA = win(t, b.record - 0.1, b.record + 0.45);
  // the clocks plate: laid in like a card on 'seventy' (a quick alpha, a 12 px rise, a small settle),
  // slides off left on 'record'
  if (inA > 0.01 && outA < 1) {
    const lay = clamp01((t - b.seventy + 0.3) / 0.25);
    const settle = Math.sin(Math.PI * clamp01((t - b.seventy + 0.05) / 0.22)) * 2.5;
    const dx = -outA * 520, dy = (1 - sm(lay)) * 12 - settle;
    c.save();
    c.globalAlpha *= inA * (1 - outA);
    c.translate(dx, dy);
    parchmentPlate(c, { x: PLATE.x, y: PLATE.y, w: PLATE.w, h: PLATE.h, seed: 75, ornament: false }, env);
    brassPin(c, env, PLATE.x + PLATE.w / 2, PLATE.y + 14, 0.9);
    clocks(c, t, b);
    c.restore();
  }
  // the stack, standing in the dark beside the card (random weights: no warm-up)
  const sa = win(t, b.record + 0.05, b.record + 0.6);
  if (sa > 0.01) {
    const all = win(t, b.allLit - 0.05, b.allLit + 0.25);
    // ONE bright all-at-once flash exactly on 'warm-up' (0.3 s), which wipes the warm-up ghost away
    const flash = t < b.nowarm - 0.06 ? 0 : t < b.nowarm + 0.02 ? sm((t - b.nowarm + 0.06) / 0.08) : t < b.nowarm + 0.1 ? 1 : Math.max(0, 1 - (t - b.nowarm - 0.1) / 0.2);
    const rows = [0, 1, 2, 3].map(() => Math.min(1, 0.85 * all + 0.4 * flash));
    c.save();
    c.globalAlpha *= sa;
    deepStack(c, { ...STACK_BOX, rows, random: true, frame: 0.7 + 0.3 * flash, bloom: flash, alpha: 1 }, env);
    warmupGhost(c, env, t, b);
    digit(c, env, t, b);
    c.restore();
    // the record label, pinned beneath the stack
    const la = win(t, b.record + 0.25, b.record + 0.75);
    if (la > 0.01) {
      monoCard(c, { x: DIGIT.x, y: DIGIT.y + 78, lines: ['0.35% error · no warm-up · IDSIA, 2010'], size: 19, alpha: la, rise: la, seed: 76, pad: 16 }, env.mood);
      brassPin(c, env, DIGIT.x, DIGIT.y + 78 - 22, 0.9);
    }
    // all rows lit together: a horizontal flash across every row on the pulse
    if (flash > 0.01) {
      const L = stackLayout(STACK_BOX);
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (const row of L.rows) {
        const gr = c.createLinearGradient(STACK_BOX.x, 0, STACK_BOX.x + STACK_BOX.w, 0);
        gr.addColorStop(0, withAlpha(env.mood.core, 0));
        gr.addColorStop(0.5, withAlpha(env.mood.core, 0.5 * flash));
        gr.addColorStop(1, withAlpha(env.mood.core, 0));
        c.fillStyle = gr;
        c.fillRect(STACK_BOX.x, row.y - 18, STACK_BOX.w, 36);
      }
      c.restore();
    }
  }
}

/**
 * two paper DAY clocks (one turn = one day). The card's sweeps exactly once, from 'seventy' to 'faster', and stops:
 * the job is done in about a day (one tally mark beneath it). The CPU's keeps turning, day after day, faster and
 * faster, a tally mark per day piling up beneath it in fives until ten weeks (70 days: the ≈ 70×) are counted
 */
function clocks(c: C, t: number, b: B) {
  const t0 = b.seventy + 0.05, t1 = b.faster + 0.05;
  const uCard = sm(clamp01((t - t0) / (t1 - t0)));
  const days = cpuDays(t, b);
  const ink = PARCH.ink;
  const cy = PLATE.y + 118;
  const xs = [PLATE.x + 104, PLATE.x + PLATE.w - 104];
  xs.forEach((cx, i) => {
    const R = 60;
    c.fillStyle = mixLab(PARCH.sky[0], PARCH.haze, 0.5);
    c.beginPath();
    c.arc(cx, cy, R, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = ink;
    c.lineWidth = 2;
    c.stroke();
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      c.lineWidth = k % 3 ? 1 : 2;
      c.beginPath();
      c.moveTo(cx + Math.sin(a) * R * 0.82, cy - Math.cos(a) * R * 0.82);
      c.lineTo(cx + Math.sin(a) * R * 0.93, cy - Math.cos(a) * R * 0.93);
      c.stroke();
    }
    const turn = i === 1 ? uCard : days % 1;
    const a1 = -Math.PI / 2 + turn * Math.PI * 2;
    if (i === 1 && turn > 0.002) {
      c.fillStyle = withAlpha(EMBER.halo, 0.35);
      c.beginPath();
      c.moveTo(cx, cy);
      c.arc(cx, cy, R * 0.8, -Math.PI / 2, a1);
      c.closePath();
      c.fill();
    }
    if (i === 0 && days > 1) {
      // the CPU's hand spinning day after day: a motion wedge trailing it, wider as it speeds up
      const sp = Math.min(1, cpuRate(t, b) / 9);
      c.fillStyle = withAlpha(ink, 0.08 + 0.14 * sp);
      c.beginPath();
      c.moveTo(cx, cy);
      c.arc(cx, cy, R * 0.74, a1 - (0.3 + 2.4 * sp), a1);
      c.closePath();
      c.fill();
    }
    c.strokeStyle = ink;
    c.lineWidth = 3;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(a1) * R * 0.72, cy + Math.sin(a1) * R * 0.72);
    c.stroke();
    c.fillStyle = ink;
    c.beginPath();
    c.arc(cx, cy, 4, 0, Math.PI * 2);
    c.fill();
    // the card's day done: its rim glows once
    if (i === 1 && uCard >= 1) {
      c.strokeStyle = withAlpha(EMBER.halo, 0.8 * (1 - clamp01((t - t1) / 1.2)) + 0.25);
      c.lineWidth = 3;
      c.beginPath();
      c.arc(cx, cy, R + 3, 0, Math.PI * 2);
      c.stroke();
    }
    // pictograms under each clock (no words): a processor chip / a two-fan card
    const py = cy + R + 30;
    if (i === 0) {
      c.strokeStyle = ink;
      c.lineWidth = 1.6;
      c.strokeRect(cx - 14, py - 14, 28, 28);
      c.fillStyle = ink;
      c.fillRect(cx - 7, py - 7, 14, 14);
      for (let k = -1; k <= 1; k++) {
        for (const [dx, dy] of [[k * 8, -20], [k * 8, 14], [-20, k * 8], [14, k * 8]] as const) c.fillRect(cx + dx - 1, py + dy, dx === -20 || dx === 14 ? 6 : 2, dx === -20 || dx === 14 ? 2 : 6);
      }
    } else {
      c.fillStyle = ink;
      c.fillRect(cx - 34, py - 12, 68, 24);
      c.fillStyle = mixLab(PARCH.sky[0], PARCH.haze, 0.5);
      for (const fx of [-16, 16]) {
        c.beginPath();
        c.arc(cx + fx, py, 9, 0, Math.PI * 2);
        c.fill();
      }
      c.fillStyle = ink;
      c.fillRect(cx - 38, py - 14, 4, 30);
    }
    // the day tallies: one per day, in fives (four strokes and a bar), rows of seven fives
    tallies(c, cx, py + 34, i === 1 ? (uCard >= 1 ? 1 : 0) : Math.floor(days + 1e-6), ink);
  });
  // the speed-up label resolves as the card's clock completes
  const la = win(t, b.faster - 0.35, b.faster + 0.15);
  if (la > 0.01) {
    c.save();
    c.globalAlpha *= la;
    c.fillStyle = ink;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.font = capFont(c, `500 22px ${FONT.mono}`);
    c.fillText('up to ≈ 70× faster', PLATE.x + PLATE.w / 2, PLATE.y + PLATE.h - 50);
    c.font = capFont(c, `italic 400 22px ${FONT.text}`);
    c.fillText('weeks → about a day (2009)', PLATE.x + PLATE.w / 2, PLATE.y + PLATE.h - 20);
    c.restore();
  }
}

/** n tally marks centred at (cx, y): groups of five, seven groups to a row (a row = five weeks) */
function tallies(c: C, cx: number, y: number, n: number, ink: string) {
  if (n <= 0) return;
  const gw = 17, mh = 15, rowH = 21, perRow = 7;
  const rowW = perRow * gw - 5;
  c.save();
  c.strokeStyle = ink;
  c.lineWidth = 1.7;
  c.lineCap = 'round';
  for (let d = 0; d < n; d++) {
    const g = Math.floor(d / 5), k = d % 5;
    const row = Math.floor(g / perRow), col = g % perRow;
    const n1 = Math.min(n, 1);
    const x0 = (n <= 1 ? cx - 1 : cx - rowW / 2) + col * gw;
    const yy = y + row * rowH;
    c.beginPath();
    if (k < 4) {
      const x = x0 + k * 3.2 * n1;
      c.moveTo(x, yy);
      c.lineTo(x + 0.6, yy + mh);
    } else {
      c.moveTo(x0 - 2.5, yy + mh * 0.75);
      c.lineTo(x0 + 12, yy + mh * 0.2);
    }
    c.stroke();
  }
  c.restore();
}

/** the CPU's days elapsed: one during the card's day, then on to 70 (ten weeks) before the plate leaves */
function cpuDays(t: number, b: B): number {
  const t0 = b.seventy + 0.05, t1 = b.faster + 0.05, t2 = b.record - 0.55;
  if (t <= t0) return 0;
  if (t <= t1) return sm((t - t0) / (t1 - t0));
  const u = clamp01((t - t1) / (t2 - t1));
  return 1 + 69 * (u * u * (0.35 + 0.65 * u));
}
/** its rate (days per second), for the motion wedge */
function cpuRate(t: number, b: B): number {
  return (cpuDays(t + 0.04, b) - cpuDays(t - 0.04, b)) / 0.08;
}

/** 'built for games': a small paper-cut game-controller decal on the card's shroud */
function gameDecal(c: C, env: PaintEnv, a: number) {
  if (a <= 0.01) return;
  const m = env.mood;
  c.save();
  c.translate(CARD.x, CARD.y);
  c.rotate(CARD.rot);
  c.translate(0, -CARD_H * 0.1);
  c.globalAlpha *= a;
  const s = 1.25;
  c.scale(s, s);
  const paper = mixLab(mixLab(m.halo, m.rim, 0.4), m.set, 0.25);
  c.fillStyle = paper;
  c.beginPath();
  // the body: a rounded bar with two hand grips
  c.moveTo(-15, -6);
  c.bezierCurveTo(-8, -9, 8, -9, 15, -6);
  c.bezierCurveTo(21, -4, 24, 8, 20, 11);
  c.bezierCurveTo(16, 13, 12, 7, 8, 5);
  c.lineTo(-8, 5);
  c.bezierCurveTo(-12, 7, -16, 13, -20, 11);
  c.bezierCurveTo(-24, 8, -21, -4, -15, -6);
  c.closePath();
  c.fill();
  // the d-pad and two buttons, cut out
  c.fillStyle = env.fill('ink');
  c.fillRect(-13.5, -2.6, 7, 2.2);
  c.fillRect(-11.1, -5, 2.2, 7);
  for (const [bx, by] of [[9, -3.4], [13, -0.4]] as const) {
    c.beginPath();
    c.arc(bx, by, 1.6, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** the warm-up ghost (ch07-s02's bottom-to-top sweep): dashed rings shimmer up the loom row by row, until the flash */
function warmupGhost(c: C, env: PaintEnv, t: number, b: B) {
  warmupArrow(c, env, t, b);
  const t0 = b.nowarm - 1.0, t1 = b.nowarm - 0.04;
  if (t < t0 || t >= t1) return;
  const L = stackLayout(STACK_BOX);
  const u = (t - t0) / (t1 - t0);
  c.save();
  c.setLineDash([3, 3]);
  c.lineWidth = 1.6;
  L.rows.forEach((row, l) => {
    const k = clamp01(u * 4 - l) * (0.55 + 0.45 * Math.abs(Math.sin(tq12(t) * 23 + l)));
    if (k <= 0.01) return;
    c.strokeStyle = withAlpha(env.mood.core, 0.75 * k);
    for (const x of row.xs) {
      c.beginPath();
      c.ellipse(x, row.y, L.r * 1.45, L.r * 1.6, 0, 0, Math.PI * 2);
      c.stroke();
      glow(c, x, row.y, L.r * 2.4, env.mood.core, 0.18 * k);
    }
  });
  c.restore();
}

/**
 * the warm-up's ghost beside the stack: a faint dashed arrow sweeping up from the bottom row to the top (ch07-s02's
 * row-by-row warm-up), drawn from ≈ 0.85 s before 'warm-up'; ON 'warm-up' one stroke strikes it through as every
 * row pulses together, and it stays struck, pale
 */
function warmupArrow(c: C, env: PaintEnv, t: number, b: B) {
  const a0 = b.nowarm - 0.87;
  if (t < a0) return;
  const L = stackLayout(STACK_BOX);
  const x = STACK_BOX.x - 30;
  const yB = L.rows[0].y + L.r, yT = L.rows[L.rows.length - 1].y - L.r;
  const grow = sm(clamp01((t - a0) / 0.55));
  const struck = clamp01((t - b.nowarm + 0.02) / 0.14);
  const fade = 1 - 0.55 * win(t, b.nowarm + 0.3, b.nowarm + 1.2);
  const m = env.mood;
  const col = mixLab(m.core, m.halo, 0.3);
  const yH = yB + (yT - yB) * grow;
  c.save();
  c.globalAlpha *= fade;
  c.strokeStyle = withAlpha(col, 0.75);
  c.lineWidth = 2.4;
  c.lineCap = 'round';
  c.setLineDash([7, 6]);
  c.beginPath();
  c.moveTo(x, yB);
  c.lineTo(x, yH);
  c.stroke();
  c.setLineDash([]);
  // the arrowhead rides the sweep
  c.fillStyle = withAlpha(col, 0.8);
  c.beginPath();
  c.moveTo(x, yH - 12);
  c.lineTo(x - 8, yH + 2);
  c.lineTo(x + 8, yH + 2);
  c.closePath();
  c.fill();
  // ticks at each row it passes (the rows it would have warmed, one at a time)
  for (const row of L.rows) {
    if (row.y < yH) continue;
    c.fillRect(x - 6, row.y - 1, 12, 2);
  }
  // the strike: one stroke, drawn fast, on 'warm-up'
  if (struck > 0) {
    const sx0 = x - 22, sy0 = yB - (yB - yT) * 0.18, sx1 = x + 22, sy1 = yT + (yB - yT) * 0.08;
    c.strokeStyle = withAlpha(mixLab(m.core, '#ffffff', 0.2), 0.95);
    c.lineWidth = 3.4;
    c.beginPath();
    c.moveTo(sx0, sy0);
    c.lineTo(lerp(sx0, sx1, struck), lerp(sy0, sy1, struck));
    c.stroke();
  }
  c.restore();
}

/** a handwritten digit on a slip, wobbling as if reflected in water, feeding the bottom row */
function digit(c: C, env: PaintEnv, t: number, b: B) {
  const L = stackLayout(STACK_BOX);
  const bottom = L.rows[0];
  const m = env.mood;
  // the feed lines from the slip up to each input lantern
  const feed = win(t, b.record + 0.3, b.allLit);
  c.strokeStyle = withAlpha(m.rim, 0.35 * feed);
  c.lineWidth = 1;
  for (const x of bottom.xs) {
    c.beginPath();
    c.moveTo(DIGIT.x + (x - DIGIT.x) * 0.15, DIGIT.y - 29 * DS);
    c.lineTo(x, bottom.y + L.r * 1.1);
    c.stroke();
  }
  c.save();
  c.translate(DIGIT.x, DIGIT.y);
  c.scale(DS, DS);
  const w = 62, h = 58;
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.fillRect(-w / 2 + 2, -h / 2 + 3, w, h);
  c.fillStyle = mixLab(PARCH.sky[1], m.halo, 0.25);
  c.fillRect(-w / 2, -h / 2, w, h);
  // a handwritten 3 as a stroke, each point displaced by a travelling ripple (elastic deformation)
  // water lines across the slip, drifting (the reflection)
  const tw = tq12(t);
  c.strokeStyle = withAlpha(PARCH.ink, 0.12);
  c.lineWidth = 1;
  for (let k = 0; k < 4; k++) {
    const yy = -18 + k * 12 + 2 * Math.sin(tw * 2.4 + k);
    c.beginPath();
    for (let x = -26; x <= 26; x += 4) c.lineTo(x, yy + 1.4 * Math.sin(x * 0.35 + tw * 4 + k));
    c.stroke();
  }
  // the 3, subdivided, every point displaced by a travelling ripple (2–3 px), redrawn on twos
  const P: [number, number][] = [[-12, -16], [-4, -21], [7, -19], [10, -11], [3, -4], [-3, -2], [5, 0], [11, 7], [8, 16], [-2, 20], [-12, 15]];
  c.strokeStyle = PARCH.ink;
  c.lineWidth = 3.4;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  for (let i = 0; i < P.length - 1; i++) {
    for (let k = 0; k < 6; k++) {
      const q = k / 6;
      const x = P[i][0] + (P[i + 1][0] - P[i][0]) * q, y = P[i][1] + (P[i + 1][1] - P[i][1]) * q;
      // a ripple travelling down the digit (elastic deformation): ≈ 6 px at 1080p, plainly visible
      const dx = 3.4 * Math.sin(y * 0.36 + tw * 5.2);
      const dy = 1.6 * Math.sin(x * 0.3 + tw * 3.7);
      if (i === 0 && k === 0) c.moveTo(x + dx, y + dy);
      else c.lineTo(x + dx, y + dy);
    }
  }
  const [lx, ly] = P[P.length - 1];
  c.lineTo(lx + 3.4 * Math.sin(ly * 0.36 + tw * 5.2), ly + 1.6 * Math.sin(lx * 0.3 + tw * 3.7));
  c.stroke();
  c.restore();
}
