/**
 * ch09-s08 — THE GO-AHEAD, AND THE REPOSITORY GOES PUBLIC (card; emberRed cooling toward candleAmber; lampChange in
 * from the copper line; 14.13 s).
 *   L0918 "On the fourteenth, Cheng gave the go-ahead: “Do it quick plz, then publish.”"
 *   L0919 "That evening it went public: “My dear friends, I’d like to show you my latest toy project”."
 *
 * THE DESK AT EVENING (the lamplit desk language of ch08-s07, seen from the other side so the lamp stands at the right
 * and the window at the left): the lamp lit, the laptop open (no logos), the author's hands absent. Through the window,
 * small and hazy, the Window Calendar (sets/windowCalendar, canonical grid, exact counts) with its October tower: the
 * 13 and 14 October day-columns lit, 15 and 16 still dark card (they have not happened yet).
 *
 * Planes: L0 the evening sky, CAL (z 3000) the calendar building, its neighbours and the street, L2 the room's back
 * wall with the window (a hole), a shelf, fog, L3 the anglepoise lamp and a stack of books on the desk's back edge (+
 * the lamp's practical, before L4), L4 the desk and the laptop (sets/ch08-s07-desk, mirrored) and the two cards,
 * L5 the desk's near edge.
 *
 * TEACHES, word by word:
 *   3.20 go-ahead  a small lowercase commit card slides in under the lamp; its words are soft lines of ink (the voice
 *                  reads them); the attribution 'Cheng Lou · commit 0237d40' sets in beneath (on screen only).
 *   7.24 public    in the calendar building beyond the window a ground-floor shutter rolls up and the street in front
 *                  fills with light: the repository open to anyone. The date stamp 14 OCTOBER 2026 · EVENING.
 *   8.96 friends   a second, plain white card (no platform, no logo) lands beside the commit card, its type soft too;
 *                  the post's attribution replaces the commit's.
 *   hold           the two cards under the lamp, the lit street beyond; the palette cools toward candleAmber.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { FONT, LAYERS, PUPPET_NEAR_BLACK, cardProbe, defineShot, drawTracked, hash1, legibleSize, measureTracked, mixLab, placeStamp, softPlate, textProbe, textRole, textSwap, toScreen, withAlpha } from '../../../film';
import { deskFront, deskNear } from '../sets/ch08-s07-desk';
import { COMMITS, windowCalendar } from '../sets/windowCalendar';
import { lerp, seg, sm, smr, twos } from '../sets/ch02-s01-period';

type C2 = CanvasRenderingContext2D;
const ID = 'ch09-s08';

/** the desk is ch08-s07's, mirrored about x = MIRROR / 2 (the lamp's pool lands at the right, under our lamp) */
const MIRROR = 1340;
/** the desk's transform: x' = a - k x, y' = b + k y (the desk's top edge stays at y 518) */
const DESK_T = { a: 1285, b: 520 - 0.82 * 520, k: 0.82 } as const;
/** the window hole in the back wall (L2 rest px), at the left */
const WIN = { x0: 70, x1: 540, y0: 20, y1: 420 } as const;
/** the calendar's layer and placement (its base centre, scale) */
const CAL_L: LayerSpec = { id: 'cal', z: 3000, haze: 0.3, blur: 1.2 };
// review r1: small and hazy THROUGH the window: ~60 % of its old size, standing back on its street behind the glazing
// bars (the mullion and the lower transom cross in front of it)
const CAL_AT = { x: 318, y: 340, s: 0.3 } as const;
/** the dome lamp (s02's dome silhouette, seen from the front): its arm's knuckle, the shade's tilt (mouth toward the
 *  cards), its size, and the bulb just inside the mouth (L3 rest px) */
const LAMP = { jx: 1090, jy: 318, phi: 0.62, r: 40 } as const;
const BULB = { x: LAMP.jx - 0.85 * LAMP.r * Math.sin(LAMP.phi) - 6 * Math.sin(LAMP.phi), y: LAMP.jy + 0.85 * LAMP.r * Math.cos(LAMP.phi) + 6 * Math.cos(LAMP.phi) } as const;
/** the two cards on the desk (L4 rest px: centres), ~60 px left of before so they sit inside the lamp's pool */
const CARD1 = { x: 830, y: 578, w: 150, h: 62, rot: -0.05 } as const;
const CARD2 = { x: 992, y: 584, w: 138, h: 76, rot: 0.07 } as const;
/** the lamp's pool on the desk, centred on the cards */
const POOL = { x: 905, y: 588, r: 290 } as const;
/** 13 and 14 October lit, in day order (exact counts) */
const TOWER_LIT = (COMMITS.d13 + COMMITS.d14) / (COMMITS.d13 + COMMITS.d14 + COMMITS.d15 + COMMITS.d16);

interface Beats {
  D: number;
  commit: number;
  pub: number;
  post: number;
}

const CAM0: Camera3 = { x: 680, y: 420, z: 70, lens: 1 };
const CAM1: Camera3 = { x: 716, y: 428, z: 150, lens: 1 };
/** review r1: across the hold, a slow ~5 % push in toward the two cards */
const CAM2: Camera3 = { x: 768, y: 444, z: 192, lens: 1 };
function camAt(t: number, b: Beats): Camera3 {
  const mix = (a: Camera3, z: Camera3, u: number): Camera3 => ({ x: lerp(a.x, z.x, u), y: lerp(a.y, z.y, u), z: lerp(a.z, z.z, u), lens: 1 });
  const t1 = b.post + 0.4;
  if (t < t1) return mix(CAM0, CAM1, sm(t / t1));
  return mix(CAM1, CAM2, sm((t - t1) / Math.max(0.1, b.D - t1)));
}

export default defineShot({
  id: ID,
  mood: 'emberRed',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = { D: T.duration, commit: T.beat('commitCard'), pub: T.beat('public'), post: T.beat('post') };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    f.camera(camAt(t, b));
    // the palette cools from emberRed toward candleAmber across the shot (quantised so baked layers are reused)
    const cool = Math.round(0.8 * sm((t - 1.5) / (b.D - 1.5)) * 25) / 25;
    if (cool > 0) f.setMood('candleAmber', { from: 'emberRed', u: cool });
    f.backlight({ sunX: 300, sunY: 330, intensity: 0.9 });
    // 'public': the ground-floor shutter (a dark band) rolls up over 0.6 s on twos, then the street in front fills
    const shutter = smr((tq - b.pub + 0.08) / 0.6);
    const street = seg(t, b.pub + 0.25, b.pub + 1.4);
    f.layer(CAL_L, (c, env) => {
      neighbours(f, c, env);
      c.save();
      c.translate(CAL_AT.x, CAL_AT.y);
      c.scale(CAL_AT.s, CAL_AT.s);
      windowCalendar(f, c, env, { x: 0, y: 0, fill: { jun: 1, jul: 1, aug: 0, sep: 1, oct: 1 }, tower: TOWER_LIT, snow: true, warm: 0.9, key: ID });
      c.restore();
      groundFloor(c, env, shutter);
      // ~40 % atmospheric haze between the room and the town (the light of 'public' is laid over it, so it reads)
      c.fillStyle = withAlpha(env.mood.haze, 0.4);
      c.fillRect(-300, -200, 1400, 900);
      streetLight(c, env, shutter, street);
    });
    f.layer('L2', (c, env) => {
      f.cached(`${ID}/L2/${env.mood.id}`, 1900, 1100, (cc) => {
        cc.translate(320, 200);
        backWall(cc, env);
      })(c, -320, -200);
    });
    windowBloom(f, street);
    f.fog({ yCenter: 300, height: 420, alpha: 0.18, drift: 4 });
    f.fog({ yCenter: 440, height: 240, alpha: 0.1, drift: 6 });
    f.layer('L3', (c, env) => {
      f.cached(`${ID}/L3v2/${env.mood.id}`, 1700, 500, (cc) => {
        cc.translate(200, -160);
        backEdge(cc, env);
      })(c, -200, 160);
    });
    f.practical({ x: BULB.x, y: BULB.y, kind: 'lamp', seed: 981, intensity: 0.62, radius: 130, layer: 'L3' });
    f.layer('L4', (c, env) => {
      // mirrored (lamp side to the right) and a little smaller and to the right, so the window keeps the left half
      c.save();
      c.translate(DESK_T.a, DESK_T.b);
      c.scale(-DESK_T.k, DESK_T.k);
      // the author's hands are absent: they lie far outside the frame
      const away = { x: -2400, y: 2400 };
      // review r1: the screen ~35 % dimmer, so the two cards under the lamp are the subject
      deskFront(c, env, { tq, hands: { rest: 1, typing: false, restAt: { L: away, R: away, A: away } }, screen: 0.25, page: { from: -40, to: -0.5 } });
      c.restore();
      lampPool(c, env);
      cards(c, env, t, tq, b);
    });
    f.rim({ x: -0.3, y: -1 });
    deskNear(f, { y: 716 });
    // L5: a mug at the desk's near left corner, out of focus (frames the composition; the near plane)
    f.layer('L5', (c, env) => {
      f.cached(`${ID}/L5mug/${env.mood.id}`, 260, 360, (cc) => {
        cc.translate(-200, -540);
        mug(cc, env);
      })(c, 200, 540);
    });
    placeStamp(f.c, { place: '14 October 2026', date: 'evening', style: 'mono', x: 250, y: 612, at: b.pub + 0.15, fade: 0.5 }, { t, mood: f.mood, seed: 983 });
    attribution(f, t, b);
  },
});

// ---------------------------------------------------------------- the town through the window (CAL layer)
/** low neighbouring roofs either side of the calendar building, a street line, a far lamp post or two */
function neighbours(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/nb2/${env.mood.id}`, 900, 420, (cc) => {
    cc.translate(150, -60);
    const ink = mixLab(env.fill('set'), env.mood.haze, 0.25);
    cc.fillStyle = ink;
    const roofs: [number, number, number][] = [[-150, 262, 170], [30, 292, 80], [410, 296, 110], [530, 256, 210], [740, 276, 160]];
    for (const [x, y, w] of roofs) {
      cc.fillRect(x, y, w, 420 - y + 20);
      if (hash1(x, 5) > 0) {
        cc.beginPath();
        cc.moveTo(x, y);
        cc.lineTo(x + w / 2, y - 26);
        cc.lineTo(x + w, y);
        cc.closePath();
        cc.fill();
      }
    }
    // a few lit windows in the neighbours (warm, small)
    for (let k = 0; k < 14; k++) {
      const x = -130 + k * 66 + 20 * hash1(k, 9);
      if (x > 120 && x < 470) continue;
      cc.fillStyle = withAlpha(mixLab(env.mood.core, env.mood.halo, 0.4), 0.35 + 0.25 * (0.5 + 0.5 * hash1(k, 11)));
      cc.fillRect(x, 310 + 30 * (0.5 + 0.5 * hash1(k, 13)), 5, 7);
    }
    // the street: a band in front of everything
    cc.fillStyle = mixLab(ink, PUPPET_NEAR_BLACK, 0.35);
    cc.fillRect(-150, CAL_AT.y + 22, 900, 140);
  })(c, -150, 60);
}

/**
 * The calendar building's ground floor (under its main block, in CAL rest px): a storefront whose shutter, a dark
 * slatted band, rolls UP into its box on 'public' (shutter 0..1), uncovering the lit front.
 */
const GF = (() => {
  const half = 190 * CAL_AT.s;
  const y0 = CAL_AT.y, y1 = CAL_AT.y + 22;
  return { x0: CAL_AT.x - half, x1: CAL_AT.x + half, y0, y1, ox0: CAL_AT.x - half + 9, ox1: CAL_AT.x + half - 9, oy0: y0 + 5, oy1: y1 };
})();
const shopLight = (env: PaintEnv) => mixLab(env.mood.core, mixLab(env.mood.halo, '#ffd9a0', 0.3), 0.35);
function groundFloor(c: C2, env: PaintEnv, shutter: number) {
  const g = GF;
  c.fillStyle = env.fill('ink');
  c.fillRect(g.x0, g.y0, g.x1 - g.x0, g.y1 - g.y0);
  // the street in front: a pale cobbled plane receding from the building's foot toward us
  c.fillStyle = mixLab(env.fill('set'), env.mood.haze, 0.2);
  c.beginPath();
  c.moveTo(g.x0 - 30, g.y1);
  c.lineTo(g.x1 + 30, g.y1);
  c.lineTo(g.x1 + 120, g.y1 + 44);
  c.lineTo(g.x0 - 120, g.y1 + 44);
  c.closePath();
  c.fill();
  if (shutter > 0) {
    c.fillStyle = shopLight(env);
    c.fillRect(g.ox0, g.oy0, g.ox1 - g.ox0, g.oy1 - g.oy0);
  }
  // the shutter: a dark slatted band, retracting upward into its box
  const sh = (g.oy1 - g.oy0) * (1 - shutter);
  c.fillStyle = mixLab(env.fill('ink'), env.fill('set'), 0.25);
  c.fillRect(g.ox0, g.oy0, g.ox1 - g.ox0, sh);
  c.strokeStyle = withAlpha(mixLab(env.fill('set'), env.mood.haze, 0.3), 0.7);
  c.lineWidth = 0.7;
  c.beginPath();
  for (let y = g.oy0 + 2.5; y < g.oy0 + sh; y += 2.5) {
    c.moveTo(g.ox0, y);
    c.lineTo(g.ox1, y);
  }
  c.stroke();
  c.fillStyle = env.fill('ink');
  c.fillRect(g.ox0 - 3, g.oy0 - 4, g.ox1 - g.ox0 + 6, 5);
}
/** the light of 'public', laid over the haze: the open front glowing, and its spill fanning across the street */
function streetLight(c: C2, env: PaintEnv, shutter: number, street: number) {
  const g = GF;
  if (shutter <= 0.01) return;
  const warm = shopLight(env);
  c.save();
  c.globalCompositeOperation = 'lighter';
  // the open front (the part the shutter has uncovered)
  const open = (g.oy1 - g.oy0) * shutter;
  c.fillStyle = withAlpha(warm, 0.55);
  c.fillRect(g.ox0, g.oy1 - open, g.ox1 - g.ox0, open);
  if (street > 0.01) {
    // the spill: a warm fan across the street plane, widening toward us
    const sp = c.createLinearGradient(0, g.y1, 0, g.y1 + 44);
    sp.addColorStop(0, withAlpha(warm, 0.6 * street));
    sp.addColorStop(1, withAlpha(env.mood.halo, 0.05 * street));
    c.fillStyle = sp;
    const w = 0.25 + 0.75 * street;
    c.beginPath();
    c.moveTo(g.ox0, g.y1);
    c.lineTo(g.ox1, g.y1);
    c.lineTo(lerp(g.ox1, g.ox1 + 100, w), g.y1 + 44);
    c.lineTo(lerp(g.ox0, g.ox0 - 100, w), g.y1 + 44);
    c.closePath();
    c.fill();
    // the glow lifting off the street and the building's foot
    const cx = CAL_AT.x, cy = g.y1 + 10;
    c.translate(cx, cy);
    c.scale(1, 0.3);
    const r = 60 + 180 * street;
    const rg = c.createRadialGradient(0, 0, 4, 0, 0, r);
    rg.addColorStop(0, withAlpha(warm, 0.35 * street));
    rg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = rg;
    c.fillRect(-r, -r, 2 * r, 2 * r);
  }
  c.restore();
}

/** the window's soft bloom on the wall around it (screen space, additive), stronger once the street is lit */
function windowBloom(f: Frame, street: number) {
  const c = f.c;
  const a = toScreen(LAYERS.L2, f.cam, WIN.x0, WIN.y0);
  const z = toScreen(LAYERS.L2, f.cam, WIN.x1, WIN.y1);
  const cx = (a.x + z.x) / 2, cy = (a.y + z.y) / 2;
  const r = Math.max(z.x - a.x, z.y - a.y) * 0.9;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(cx, cy, r * 0.25, cx, cy, r);
  g.addColorStop(0, withAlpha(f.mood.halo, 0.1 + 0.06 * street));
  g.addColorStop(1, withAlpha(f.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  c.restore();
}

/** L2: the back wall with the window hole (evenodd), mullions, sill; a shelf of books at the right */
function backWall(c: C2, env: PaintEnv) {
  const wall = mixLab(env.fill('set'), PUPPET_NEAR_BLACK, 0.25);
  c.fillStyle = wall;
  c.beginPath();
  c.rect(-320, -200, 1900, 1100);
  c.rect(WIN.x0, WIN.y0, WIN.x1 - WIN.x0, WIN.y1 - WIN.y0);
  c.fill('evenodd');
  const ink = mixLab(wall, env.mood.ink, 0.55);
  c.fillStyle = ink;
  const mx = (WIN.x0 + WIN.x1) / 2;
  c.fillRect(mx - 4, WIN.y0, 8, WIN.y1 - WIN.y0);
  for (const fy of [0.36, 0.7]) c.fillRect(WIN.x0, WIN.y0 + (WIN.y1 - WIN.y0) * fy - 3, WIN.x1 - WIN.x0, 6);
  c.fillRect(WIN.x0 - 14, WIN.y1, WIN.x1 - WIN.x0 + 28, 12);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.55);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(WIN.x0 - 14, WIN.y1 + 0.5);
  c.lineTo(WIN.x1 + 14, WIN.y1 + 0.5);
  c.stroke();
  // a shelf of books on the right wall
  const sx0 = 820, sx1 = 1260, sy = 196;
  c.fillStyle = ink;
  c.fillRect(sx0, sy, sx1 - sx0, 7);
  let x = sx0 + 10;
  let i = 0;
  while (x < sx1 - 20) {
    const w = 9 + 9 * (0.5 + 0.5 * hash1(i, 61));
    const h = 44 + 30 * (0.5 + 0.5 * hash1(i, 63));
    if (hash1(i, 65) > 0.85) {
      c.save();
      c.translate(x, sy);
      c.rotate(-0.28);
      c.fillRect(0, -h, w, h);
      c.restore();
      x += w + 16;
    } else {
      c.fillRect(x, sy - h, w, h);
      x += w + 1.5;
    }
    i++;
  }
  c.fillRect(sx0 + 30, sy + 6, 6, 26);
  c.fillRect(sx1 - 40, sy + 6, 6, 26);
}

/** L3: the anglepoise lamp at the right (base on the desk's back edge) and a small stack of books under the window */
function backEdge(c: C2, env: PaintEnv) {
  const ink = env.fill('ink');
  const X = (x: number) => MIRROR - x;
  c.fillStyle = ink;
  c.strokeStyle = ink;
  c.beginPath();
  c.ellipse(X(220), 506, 46, 10, 0, Math.PI, 0);
  c.fill();
  c.lineCap = 'round';
  c.lineWidth = 7;
  c.beginPath();
  c.moveTo(X(220), 500);
  c.lineTo(X(190), 400);
  c.lineTo(LAMP.jx, LAMP.jy);
  c.stroke();
  // the spring knuckle (as s02's arm)
  c.beginPath();
  c.arc(LAMP.jx, LAMP.jy, 9, 0, Math.PI * 2);
  c.fill();
  // the dome shade, s02's round dome seen from the front: a bell, its mouth turned down-left toward the cards
  c.save();
  c.translate(LAMP.jx - 0.85 * LAMP.r * Math.sin(LAMP.phi), LAMP.jy + 0.85 * LAMP.r * Math.cos(LAMP.phi));
  c.rotate(LAMP.phi);
  const R = LAMP.r;
  c.beginPath();
  c.moveTo(-R, 0);
  c.bezierCurveTo(-R, -R * 1.15, R, -R * 1.15, R, 0);
  c.closePath();
  c.fill();
  // the mouth: the lit inner lip (as s02's), seen nearly edge-on
  const lip = c.createRadialGradient(0, 2, 0, 0, 2, R * 0.9);
  lip.addColorStop(0, withAlpha(mixLab(env.mood.core, '#fff3d6', 0.4), 0.95));
  lip.addColorStop(0.6, withAlpha(env.mood.halo, 0.5));
  lip.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = lip;
  c.beginPath();
  c.ellipse(0, 1, R * 0.92, R * 0.18, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.6);
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(0, 1, R * 0.92, R * 0.18, 0, 0, Math.PI * 2);
  c.stroke();
  c.restore();
  c.fillStyle = ink;
  c.strokeStyle = withAlpha(env.mood.rim, 0.35);
  c.lineWidth = 1.2;
  c.beginPath();
  for (let k = 0; k <= 10; k++) {
    const u = k / 10;
    const x = X(lerp(214, 196, u) + (k % 2 ? 5 : -5));
    const y = lerp(486, 420, u);
    if (k === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  // books under the window
  c.fillStyle = ink;
  const stack: [number, number, number][] = [[150, 168, 22], [162, 150, 18], [146, 176, 20]];
  let y = 508;
  for (const [x, w, h] of stack) {
    y -= h;
    c.fillRect(x, y, w, h - 1.5);
  }
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.5);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(146, y + 0.5);
  c.lineTo(322, y + 0.5);
  c.stroke();
}

/** the lamp's warm pool on the desk round the cards (additive, low) */
function lampPool(c: C2, env: PaintEnv) {
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.translate(POOL.x, POOL.y);
  c.scale(1, 0.36);
  const g = c.createRadialGradient(0, 0, 6, 0, 0, POOL.r);
  g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.4), 0.34));
  g.addColorStop(0.55, withAlpha(env.mood.halo, 0.12));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(-POOL.r, -POOL.r, 2 * POOL.r, 2 * POOL.r);
  c.restore();
}

/** L5: a mug at the near left corner of the desk (cut paper, a handle toward the window, a rim catching the lamp) */
function mug(c: C2, env: PaintEnv) {
  c.fillStyle = PUPPET_NEAR_BLACK;
  // body (it runs out of frame at the bottom)
  c.beginPath();
  c.moveTo(232, 560);
  c.lineTo(372, 560);
  c.lineTo(366, 900);
  c.lineTo(238, 900);
  c.closePath();
  c.fill();
  // the handle (a ring, pierced)
  const h = new Path2D();
  h.ellipse(232, 640, 34, 44, 0, 0, Math.PI * 2);
  h.ellipse(232, 640, 20, 30, 0, 0, Math.PI * 2);
  c.fill(h, 'evenodd');
  // the rim's lip, lit from the lamp side (right)
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.55);
  c.lineWidth = 3;
  c.beginPath();
  c.ellipse(302, 560, 70, 9, 0, Math.PI * 1.05, Math.PI * 1.95);
  c.stroke();
  c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.3);
  c.fillRect(368, 566, 3, 330);
}

// ---------------------------------------------------------------- the cards
/** soft lines of ink (the words, read by the voice, never set as type): seeded word-lengths on each line */
function softLines(c: C2, x0: number, y0: number, w: number, rows: number, lh: number, ink: string, salt: number, h = 3) {
  c.fillStyle = ink;
  for (let r = 0; r < rows; r++) {
    let x = x0;
    const end = x0 + w * (r === rows - 1 ? 0.55 : 1);
    let k = 0;
    while (x < end) {
      const len = 7 + 16 * (0.5 + 0.5 * hash1(k + r * 17, salt));
      const ww = Math.min(len, end - x);
      if (ww > 3) {
        c.beginPath();
        c.roundRect(x, y0 + r * lh, ww, h, h / 2);
        c.fill();
      }
      x += len + 5;
      k++;
    }
  }
}
function card(c: C2, env: PaintEnv, k: { x: number; y: number; w: number; h: number; rot: number }, dx: number, dy: number, rot: number, paper: string, rows: number, salt: number, a: number, id: string, ruled = false) {
  if (a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  c.translate(k.x + dx, k.y + dy);
  c.rotate(k.rot + rot);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.35);
  c.fillRect(-k.w / 2 + 3, -k.h / 2 + 4, k.w, k.h);
  c.fillStyle = paper;
  c.fillRect(-k.w / 2, -k.h / 2, k.w, k.h);
  c.strokeStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.3), 0.5);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(-k.w / 2, -k.h / 2 + 0.5);
  c.lineTo(k.w / 2, -k.h / 2 + 0.5);
  c.stroke();
  if (ruled) {
    // s02's index card: one red-brown head rule and faint blue-grey ruling
    c.strokeStyle = withAlpha('#9a5b48', 0.45);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-k.w / 2, -k.h / 2 + 11);
    c.lineTo(k.w / 2, -k.h / 2 + 11);
    c.stroke();
    c.strokeStyle = withAlpha('#7d8a90', 0.2);
    c.lineWidth = 0.8;
    c.beginPath();
    for (let y = -k.h / 2 + 11 + 13; y < k.h / 2 - 4; y += 13) {
      c.moveTo(-k.w / 2 + 4, y + 2);
      c.lineTo(k.w / 2 - 4, y + 2);
    }
    c.stroke();
  }
  softLines(c, -k.w / 2 + 14, -k.h / 2 + 16, k.w - 28, rows, 13, withAlpha(mixLab('#2a1d14', env.mood.ink, 0.25), 0.38), salt);
  c.restore();
  // the paper carries its (soft) words from the moment it shows
  cardProbe(c, id, k.x + dx - k.w / 2, k.y + dy - k.h / 2, k.w, k.h, a, a);
}
function cards(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  // the commit card: lowercase, small; slides in from the right under the lamp, on 'go-ahead'
  const u1 = smr((tq - (b.commit - 0.3)) / 0.5);
  // s02's cream index-card stock and ruling, so this reads as the same desk
  const commitPaper = mixLab('#f3ead6', env.mood.core, 0.25);
  card(c, env, CARD1, (1 - u1) * 360, 0, (1 - u1) * 0.12, commitPaper, 3, 101, u1 > 0 ? 1 : 0, `${ID}-commit`, true);
  // the launch post: a plain white card, lands beside it on 'friends' (drops from above and settles)
  const u2 = smr((tq - (b.post - 0.35)) / 0.45);
  const postPaper = mixLab('#f4f1ea', env.mood.halo, 0.12);
  const settle = u2 >= 1 ? 0.02 * Math.exp(-(t - b.post - 0.1) * 4) * Math.sin((t - b.post) * 18) : 0;
  card(c, env, CARD2, 0, -70 * (1 - u2), 0.2 * (1 - u2) + settle, postPaper, 4, 103, seg(tq, b.post - 0.35, b.post - 0.15), `${ID}-post`);
}

/** 'Cheng Lou · commit 0237d40' (go-ahead -> friends), then 'Cheng Lou · launch post' (friends ->), beneath the cards */
function attribution(f: Frame, t: number, b: Beats) {
  const sw = textSwap(t, b.post + 0.05, 0.35);
  const a1 = seg(t, b.commit + 0.05, b.commit + 0.4) * sw.out;
  const a2 = sw.in;
  const at = toScreen(LAYERS.L4, f.cam, (CARD1.x + CARD2.x) / 2, Math.max(CARD1.y + CARD1.h / 2, CARD2.y + CARD2.h / 2));
  const one = (text: string, a: number, id: string) => {
    if (a <= 0.01) return;
    const c = f.c;
    textRole(c, 'subject', () => {
      c.save();
      const size = legibleSize(c, `italic 500 24px ${FONT.text}`, 24);
      const o = { font: `italic 500 ${size}px ${FONT.text}`, size, tracking: 0.015, align: 'left' as const };
      const w = measureTracked(c, text, o);
      const y = Math.min(626, at.y + size + 14);
      const x = Math.min(1216 - w, at.x - w / 2);
      c.globalAlpha = a;
      softPlate(c, x + w / 2, y - size * 0.35, w + 110, size + 46, f.mood.ink, 0.55);
      c.fillStyle = mixLab('#f1e6d2', f.mood.core, 0.25);
      drawTracked(c, text, x, y, o);
      textProbe(c, id, x, y - size, w, size * 1.2, a);
      c.restore();
    });
  };
  one('Cheng Lou · commit 0237d40', a1, `${ID}-attr-commit`);
  one('Cheng Lou · launch post', a2, `${ID}-attr-post`);
}

