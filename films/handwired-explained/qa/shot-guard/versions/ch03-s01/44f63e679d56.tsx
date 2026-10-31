/**
 * ch03-s01 — THE PROJECT'S FIRST NIGHT, on the Window Calendar (Device 2). winterBlue night, lampChange in from
 * ch02's lamplit line; 15.25 s on the locked clock.
 *   L0301 "The third of June, twenty twenty-six: Cheng Lou, Handwired's author, makes his first commit."
 *   L0302 "Four months and two renames later: Handwired."
 *
 * The black paper building (sets/windowCalendar, canonical grid and placement, drawn on the sharp action plane) stands
 * against a cold moonlit haze: a far hazed city and the moon (L1), dark unlit neighbours (L2), a leafy June branch
 * crossing the upper left (L6, soft) and a near rooftop with chimney pots at lower right (L5). Only June's column will
 * light; the later months stay black glass, unlabelled, with no snow (August has not happened yet).
 *
 * TEACHES, word by word (one lit pane = one commit, exact; the grid fills bottom-up in commit order):
 *   June (1.80)        the first June pane lights warm amber; the date stamp sets top-left and the commit message is
 *                      typed under it (a fine leader runs to the pane while the camera is wide)
 *   (3.3 → 5.2)        the camera pushes through that pane: the window becomes a portal onto a lamp, a logo-less
 *                      laptop, two paper hands typing (author-hands) and, beside them, a SECOND, paler paper hand
 *                      resting at the same keyboard (agent-hand), still, never explained
 *   Cheng (4.2)        the name card "Cheng Lou · author" sets (it holds through 'commit')
 *   commit (7.64)      the author's right hand lifts off the keys and comes to rest: the first commit is made (the
 *                      screen breathes brighter once); the agent's hand does not move
 *   pane2 (8.37)       the camera begins to ease back out of the window; the second pane lights beside the first
 *   two (9.63)         the camera eases back to the whole building's lower half; June fills pane by pane, exactly 72
 *   renames (9.92)     on the brass plaque at the building's foot, 'Numeric UI Atom Lab' is painted over and
 *                      'Indirect' is lettered beneath (date chips 3 June · 6 June); the caption builds with it
 *   Handwired (11.12)  'Indirect' painted over; 'Handwired' lettered last, in copper (chip: 6 October)
 *   glimpse (12.35)    the camera settles back in on the first pane: the second hand is still there, unmoving
 *
 * Note on the second pane: the script says "beneath"; the canonical grid (sets/windowCalendar, fixed for every
 * appearance) fills each storey left to right from the bottom, so commit 2 is the first pane's right-hand neighbour.
 *
 * Camera: action-plane scale k from 1.75 (the wide) to ~80 (the window fills the frame height) and back. Dolly up to
 * k 1.2, lens beyond (sets of near layers fly out of frame as it pushes); cam3Interp keeps every zoom log-uniform.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import {
  FONT,
  LAYERS,
  cam3Interp,
  defineShot,
  drawTracked,
  legibleSize,
  mixLab,
  moon,
  nameCard,
  placeStamp,
  skyline,
  softPlate,
  stars,
  textProbe,
  textRole,
  toLayer,
  toScreen,
  tree,
  withAlpha,
} from '../../../film';
import { hands } from '../cast';
import { CAL, paneRect, windowCalendar, type CalendarOpts } from '../sets/windowCalendar';
import { copperOf } from '../sets/narratorHands';

type C2 = CanvasRenderingContext2D;
const ID = 'ch03-s01';

// ---------------------------------------------------------------- helpers (pure)
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const smr = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;

// ---------------------------------------------------------------- geometry (L4 rest px)
/** the building's canonical base centre (sets/windowCalendar usage) */
const BASE = { x: 640, y: 690 };
const P0 = paneRect('jun', 0, BASE);
const P0C = { x: P0.x + P0.w / 2, y: P0.y + P0.h / 2 };
const COL_W = CAL.cols * (CAL.pane + CAL.gap) - CAL.gap;
const PLATE_X = (paneRect('jun', 0, BASE).x + paneRect('jul', 0, BASE).x + COL_W) / 2;
const PLATE_Y = BASE.y + 8;
const PLATE_W = 200;
const PLATE_LH = 22;
/** the main block's outer width (windowCalendar layout) */
const MAIN_W = 5 * COL_W + 4 * CAL.pier + 2 * CAL.pier;

/** camera for an action-plane scale k centred on world (x, y): dolly to k 1.2, lens beyond */
function camK(x: number, y: number, k: number): Camera3 {
  const kd = Math.min(k, 1.2);
  const z = 1000 - 1000 / kd;
  return { x, y, z, lens: Math.max(1, (k * (1000 - z)) / 1000) };
}
interface CamKey {
  t: number;
  cam: Camera3;
}
function camAt(keys: CamKey[], t: number): Camera3 {
  if (t <= keys[0].t) return keys[0].cam;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t < b.t) return cam3Interp(a.cam, b.cam)(smr((t - a.t) / (b.t - a.t)));
  }
  return keys[keys.length - 1].cam;
}
/** the wide: the building's lower half, its plinth and plaque, a band of night sky */
const WIDE = { x: 640, y: 652, k: 1.75 };
const MACRO_K = 78;

interface Beats {
  D: number;
  pane1: number;
  cheng: number;
  name: number;
  pane2: number;
  june: number;
  names: number;
  handwired: number;
  glimpse: number;
}
function cams(b: Beats): CamKey[] {
  return [
    { t: 0, cam: camK(WIDE.x - 20, WIDE.y + 4, WIDE.k * 0.94) },
    { t: 3.3, cam: camK(lerp(WIDE.x, P0C.x, 0.35), lerp(WIDE.y, P0C.y, 0.35), WIDE.k * 1.32) },
    { t: 5.25, cam: camK(P0C.x, P0C.y, MACRO_K) },
    { t: b.name + 0.25, cam: camK(P0C.x + 0.15, P0C.y - 0.05, MACRO_K * 1.06) },
    { t: b.june + 1.45, cam: camK(WIDE.x, WIDE.y, WIDE.k) },
    { t: b.glimpse - 0.15, cam: camK(WIDE.x - 4, WIDE.y - 1, WIDE.k * 1.03) },
    { t: b.D + 0.3, cam: camK(P0C.x + 0.6, P0C.y - 0.4, 21) },
  ];
}

/** how many June panes are lit at t: 1 on 'June', 2 at pane2, then all 72 in ~2 s from 'two' (pane by pane) */
function juneLit(t: number, b: Beats): number {
  if (t < b.pane1) return 0;
  if (t < b.pane2) return 1;
  if (t < b.june) return 2;
  const u = clamp01((t - b.june) / 1.95);
  // a relay run: starts brisk, settles at the top
  const e = 1 - Math.pow(1 - u, 1.6);
  return Math.min(72, 2 + Math.floor(e * 70 + 1e-6));
}
/** the time pane i lit (for its hot flash) */
function litAt(i: number, b: Beats): number {
  if (i === 0) return b.pane1;
  if (i === 1) return b.pane2;
  // invert juneLit: e = (i - 1) / 70 → u
  const e = (i - 1) / 70;
  const u = 1 - Math.pow(1 - e, 1 / 1.6);
  return b.june + u * 1.95;
}

const PORTAL: LayerSpec = { id: 'portal', z: 1000, haze: 0, blur: 0 };
const CALL: LayerSpec = { id: 'cal', z: 1000, haze: 0.03, blur: 0 };

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      pane1: T.beat('pane1'),
      cheng: T.word('L0301', 'Cheng'),
      name: T.beat('name'),
      pane2: T.beat('pane2'),
      june: T.beat('june'),
      names: T.beat('names'),
      handwired: T.beat('handwired'),
      glimpse: T.beat('glimpse'),
    };
    return { tl, b, keys: cams(b) };
  },
  paint(f, _s, sc) {
    const { b } = sc;
    const t = f.t;
    const tq = twos(t);
    const cam = camAt(sc.keys, t);
    f.camera(cam);
    const k = toScreen(LAYERS.L4, cam, 0, 0).k;
    const paneScreen = P0.w * k;
    f.backlight({ sunX: 980, sunY: 250, intensity: 0.85 });

    // ---------------- L1: the moon and a far city, deep in the cold haze
    const kL1 = toScreen(LAYERS.L1, cam, 0, 0).k;
    if (kL1 < 9) {
      f.layer('L1', (c, env) => {
        f.cached(`${ID}/L1/${env.mood.id}`, 2400, 1000, (cc) => {
          cc.translate(560, 200);
          stars(cc, { x: -560, y: -200, w: 2400, h: 520, count: 120, seed: 31, twinkle: 0 }, env);
          skyline(cc, { style: 'megacity', x0: -560, x1: 1840, y: 640, height: 150, seed: 603, lit: 0, ground: 200, role: 'set' }, env);
        })(c, -560, -200);
        moon(c, { x: MOON.x, y: MOON.y, r: 17, phase: 0.18, halo: 0.9 }, env);
      });
    }
    // ---------------- L2: dark neighbours, unlit (only one window in the city is awake tonight)
    const kL2 = toScreen(LAYERS.L2, cam, 0, 0).k;
    if (kL2 < 14) {
      f.layer('L2', (c, env) => {
        f.cached(`${ID}/L2/${env.mood.id}`, 1900, 700, (cc) => {
          cc.translate(310, -200);
          neighbours(cc, env);
        })(c, -310, 200);
      });
    }
    f.fog('A');
    f.fog('B');

    // ---------------- the building (the action plane): the canonical Window Calendar
    const nLit = juneLit(t, b);
    const zoomed = sm((paneScreen - 60) / 120);
    const plateStage = t < b.names + 0.3 ? 'Numeric UI Atom Lab' : t < b.handwired + 0.3 ? 'Indirect' : 'Handwired';
    const plateAt = plateStage === 'Indirect' ? b.names + 0.3 : plateStage === 'Handwired' ? b.handwired + 0.3 : -1;
    const calOpts: CalendarOpts = {
      x: BASE.x,
      y: BASE.y,
      fill: { jun: nLit / 72 },
      snow: false,
      glowPane: ['jun', 0, seg(t, b.pane1 - 0.05, b.pane1 + 0.35) * (1 - zoomed) * 0.9],
      nameplate: plateStage,
      nameplatePaint: plateAt < 0 ? 1 : seg(t, plateAt, plateAt + 0.55),
      key: ID,
    };
    f.layer(CALL, (c, env) => {
      groundAndPlinth(f, c, env);
      windowCalendar(f, c, env, calOpts);
      // the paint stroke sweeping across the outgoing name (the set paints it over at once on the next stage)
      for (const [at, row] of [[b.names, 0], [b.handwired, 1]] as const) {
        const u = seg(t, at - 0.02, at + 0.32);
        if (u > 0 && t < at + 0.3) paintSweep(c, env, row, u);
      }
      dateChips(c, env, t, b, k);
      // newly lit panes flash hot for a beat (one relay clack each)
      hotPanes(c, env, t, b, nLit);
      // up close, the cached bitmap is soft: redraw the panes around the first one as crisp vector
      if (paneScreen > 40) crispNeighbours(c, env, nLit, t, b);
    });
    f.rim({ x: 0.35, y: -1 });

    // ---------------- the portal: through the first pane, the desk (drawn inside the pane's own rect)
    const see = sm((paneScreen - 26) / 110);
    if (nLit > 0 && see > 0.003) {
      f.layer(PORTAL, (c, env) => portal(c, env, t, tq, b, see, k));
    }

    // ---------------- near planes: a rooftop with chimney pots (L5) and a June branch (L6), flying out on the push
    const kL5 = toScreen(LAYERS.L5, cam, 0, 0).k;
    if (kL5 < 7) {
      f.layer('L5', (c, env) => {
        f.cached(`${ID}/L5/${env.mood.id}`, 700, 520, (cc) => {
          cc.translate(-ROOF.x, -ROOF.y);
          rooftop(cc, env);
        })(c, ROOF.x, ROOF.y);
      });
    }
    const kL6 = toScreen(LAYERS.L6, cam, 0, 0).k;
    if (kL6 < 7) {
      f.layer('L6', (c, env) => {
        f.cached(`${ID}/L6/${env.mood.id}`, 900, 700, (cc) => {
          cc.translate(-BRANCH.x0, -BRANCH.y0);
          branch(cc, env);
        })(c, BRANCH.x0, BRANCH.y0);
      });
    }

    // ---------------- type (screen-locked)
    const tenv = { t, mood: f.mood, seed: 301 };
    const stampOut = b.cheng + 2.4;
    placeStamp(f.c, { place: '3 June 2026', date: '20:24', style: 'mono', x: 48, y: 64, at: b.pane1 - 0.05, dur: stampOut - (b.pane1 - 0.05), fade: 0.45 }, tenv);
    commitLabel(f, t, b, stampOut, cam);
    nameCard(f.c, { name: 'Cheng Lou', role: 'author', y: 584, at: b.cheng - 0.1, dur: b.pane2 + 0.2 - (b.cheng - 0.1), fade: 0.45 }, tenv);
    renameCaption(f.c, f.mood, t, b);
  },
});

// ---------------------------------------------------------------- placements (world px of each layer, chosen so they
// land where they should on the WIDE frame)
const CAM_WIDE = camK(WIDE.x, WIDE.y, WIDE.k);
const MOON = toLayer(LAYERS.L1, CAM_WIDE, 1085, 62);
const ROOF = (() => {
  const p = toLayer(LAYERS.L5, CAM_WIDE, 1010, 470);
  return { x: Math.round(p.x), y: Math.round(p.y) };
})();
const BRANCH = (() => {
  const p = toLayer(LAYERS.L6, CAM_WIDE, -60, -60);
  return { x0: Math.round(p.x) - 60, y0: Math.round(p.y) - 60 };
})();

// ---------------------------------------------------------------- painters
/** L2: dark neighbouring blocks to either side, unlit, a water tank and a stair tower (world px of L2) */
function neighbours(c: C2, env: PaintEnv) {
  const ink = env.fill('set');
  c.fillStyle = ink;
  const blocks: [number, number, number][] = [
    [-300, 360, 290],
    [-40, 300, 150],
    [100, 380, 120],
    [210, 420, 90],
    [1010, 400, 110],
    [1110, 330, 160],
    [1260, 380, 140],
    [1390, 300, 200],
  ];
  for (const [x, top, w] of blocks) c.fillRect(x, top, w, 900 - top);
  // a water tank on legs and a stair tower: the rooftop rhythm of a city block
  c.fillRect(1150, 290, 60, 40);
  c.beginPath();
  c.moveTo(1146, 290);
  c.lineTo(1180, 268);
  c.lineTo(1214, 290);
  c.closePath();
  c.fill();
  for (const lx of [1156, 1176, 1196]) c.fillRect(lx, 330, 4, 6);
  c.fillRect(-10, 270, 50, 40);
  // parapet rims catching the moon (tops only)
  c.strokeStyle = withAlpha(env.mood.rim, 0.22);
  c.lineWidth = 1.2;
  c.beginPath();
  for (const [x, top, w] of blocks) {
    c.moveTo(x, top + 0.5);
    c.lineTo(x + w, top + 0.5);
  }
  c.stroke();
}

/** the street-level plinth the building stands on, and the dark ground in front of it */
function groundAndPlinth(f: Frame, c: C2, env: PaintEnv) {
  f.cached(`${ID}/plinth/${env.mood.id}`, 1400, 260, (cc) => {
    cc.translate(-(BASE.x - 700), -(BASE.y - 2));
    const ink = env.fill('ink');
    // the plinth: a rusticated base under the main block, a step wider
    cc.fillStyle = ink;
    cc.fillRect(BASE.x - MAIN_W / 2 - 4, BASE.y - 2, MAIN_W + 8, 120);
    // the street beyond, a step lighter so the plinth's top edge reads
    cc.fillStyle = mixLab(ink, env.mood.set, 0.25);
    cc.fillRect(BASE.x - 700, BASE.y + 96, 1400, 160);
    cc.fillStyle = ink;
    cc.fillRect(BASE.x - MAIN_W / 2 - 4, BASE.y + 96, MAIN_W + 8, 160);
    // rustication joints (cut lines)
    cc.strokeStyle = withAlpha(env.mood.rim, 0.07);
    cc.lineWidth = 0.6;
    for (let y = BASE.y + 22; y < BASE.y + 118; y += 18) {
      cc.beginPath();
      cc.moveTo(BASE.x - MAIN_W / 2, y);
      cc.lineTo(BASE.x + MAIN_W / 2, y);
      cc.stroke();
    }
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.35);
    cc.beginPath();
    cc.moveTo(BASE.x - MAIN_W / 2 - 4, BASE.y - 1.5);
    cc.lineTo(BASE.x + MAIN_W / 2 + 4, BASE.y - 1.5);
    cc.stroke();
  })(c, BASE.x - 700, BASE.y - 2);
}

/** the plaque's paint stroke sweeping left to right over name `row` (the set paints the finished bar itself) */
function paintSweep(c: C2, env: PaintEnv, row: number, u: number) {
  const plate = mixLab('#7a5c2e', env.mood.halo, 0.25);
  const y = PLATE_Y + 6 + PLATE_LH * (row + 0.5);
  const x0 = PLATE_X - PLATE_W / 2 + 10;
  c.save();
  c.fillStyle = withAlpha(plate, 0.6);
  c.fillRect(x0, y - 7, (PLATE_W - 20) * u, 14);
  // the brush's leading edge, a touch wetter
  c.fillStyle = withAlpha(mixLab(plate, env.mood.core, 0.2), 0.7);
  c.fillRect(x0 + (PLATE_W - 20) * u - 3, y - 7.5, 3, 15);
  c.restore();
}

/** small paper date chips right of each name on the plaque: 3 June · 6 June · 6 October */
function dateChips(c: C2, env: PaintEnv, t: number, b: Beats, k: number) {
  const rows: [string, number][] = [
    ['3 June', -1],
    ['6 June', b.names + 0.3],
    ['6 October', b.handwired + 0.3],
  ];
  if (k < 1.3) return;
  const paper = mixLab(mixLab('#e8dcc2', env.mood.halo, 0.25), env.mood.core, 0.1);
  const ink = mixLab('#1d140d', env.mood.ink, 0.3);
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `italic 500 11px ${FONT.text}`, 11);
    c.font = `italic 500 ${size}px ${FONT.text}`;
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    rows.forEach(([txt, at], i) => {
      const a = at < 0 ? 1 : seg(t, at, at + 0.4);
      if (a <= 0.01) return;
      const y = PLATE_Y + 6 + PLATE_LH * (i + 0.5);
      const x = PLATE_X + PLATE_W / 2 + 6;
      const w = c.measureText(txt).width + 10;
      c.save();
      c.globalAlpha = a;
      c.fillStyle = paper;
      c.fillRect(x, y - size * 0.62, w, size * 1.24);
      c.fillStyle = ink;
      c.fillText(txt, x + 5, y + 0.5);
      textProbe(c, `${ID}-chip${i}`, x, y - size * 0.62, w, size * 1.24, a);
      c.restore();
    });
  });
}

/** each pane flashes hot for a beat when it lights */
function hotPanes(c: C2, env: PaintEnv, t: number, b: Beats, nLit: number) {
  const hot = mixLab('#ffe7b8', env.mood.core, 0.3);
  for (let i = 0; i < nLit; i++) {
    const dt = t - litAt(i, b);
    if (dt < 0 || dt > 0.25) continue;
    const r = paneRect('jun', i, BASE);
    c.fillStyle = withAlpha(hot, 0.85 * (1 - dt / 0.25));
    c.fillRect(r.x, r.y, r.w, r.h);
  }
}

/** crisp vector panes around the first one (the set's cached bitmap softens under a deep push) */
function crispNeighbours(c: C2, env: PaintEnv, nLit: number, t: number, b: Beats) {
  const unlit = mixLab(env.fill('ink'), env.mood.set, 0.35);
  const lit = mixLab(mixLab(mixLab(env.mood.rim, '#f2c27a', 0.8), env.mood.core, 0.3), '#fff1cf', 0.1);
  c.save();
  for (let i = 0; i < 18; i++) {
    if (i === 0) continue;
    const r = paneRect('jun', i, BASE);
    c.fillStyle = i < nLit ? lit : unlit;
    c.fillRect(r.x, r.y, r.w, r.h);
    if (i === 1 && nLit > 1) {
      const dt = t - b.pane2;
      if (dt >= 0 && dt < 0.3) {
        c.fillStyle = withAlpha('#fff1cf', 0.6 * (1 - dt / 0.3));
        c.fillRect(r.x, r.y, r.w, r.h);
      }
    }
  }
  // July's first panes, black glass
  for (let i = 0; i < 12; i++) {
    const r = paneRect('jul', i, BASE);
    c.fillStyle = unlit;
    c.fillRect(r.x, r.y, r.w, r.h);
  }
  // the first pane's frame: a fine sill and reveal, catching the moon on its top edge
  const r = P0;
  c.fillStyle = env.fill('ink');
  c.fillRect(r.x - 0.25, r.y + r.h - 0.05, r.w + 0.5, 0.45);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.55);
  c.lineWidth = 0.05;
  c.beginPath();
  c.moveTo(r.x - 0.25, r.y + r.h - 0.05);
  c.lineTo(r.x + r.w + 0.25, r.y + r.h - 0.05);
  c.stroke();
  c.restore();
}

/**
 * Through the first pane: a lamp-lit room, a logo-less laptop, the author's two hands and the agent's paler hand,
 * drawn in pane-local units (0..100 across the 7.2-px pane). `see` 0..1 crossfades from the plain lit pane to the
 * room as the pane grows on screen.
 */
function portal(c: C2, env: PaintEnv, t: number, tq: number, b: Beats, see: number, k: number) {
  const r = P0;
  const s = r.w / 100;
  // inner parallax: as the camera pushes, the back wall drifts a little against the desk
  const pz = Math.log(Math.max(1, k)) / Math.log(MACRO_K);
  c.save();
  c.beginPath();
  c.rect(r.x, r.y, r.w, r.h);
  c.clip();
  c.globalAlpha = see;
  c.translate(r.x, r.y);
  c.scale(s, s);
  const amber = '#e9a95a';
  // the back wall: warm lamplight from the left, falling off to the right
  const wall = c.createRadialGradient(22, 46, 4, 30, 50, 120);
  wall.addColorStop(0, mixLab(amber, '#fff0d0', 0.45));
  wall.addColorStop(0.35, mixLab(amber, env.mood.set, 0.25));
  wall.addColorStop(1, mixLab(mixLab(amber, env.mood.set, 0.8), env.mood.ink, 0.3));
  c.fillStyle = wall;
  c.fillRect(-10, -10, 120, 120);
  // a shelf with a few books, upper right (drifts with the wall)
  c.save();
  c.translate(-2.5 * pz, -1.2 * pz);
  const backInk = mixLab(env.mood.ink, amber, 0.18);
  c.fillStyle = backInk;
  c.fillRect(60, 24, 44, 1.6);
  const books: [number, number, number][] = [[63, 9, 2.6], [66, 11, 2.2], [68.6, 8, 3], [72, 10, 2.4], [74.8, 7, 2], [80, 10.5, 2.6], [83, 9.5, 2.2]];
  for (const [x, h, w] of books) c.fillRect(x, 24 - h, w, h);
  c.save();
  c.translate(86.5, 24);
  c.rotate(0.32);
  c.fillRect(0, -9, 2.4, 9);
  c.restore();
  // a framed print, left of the shelf (its glass catches the lamp)
  c.fillRect(38, 12, 14, 17);
  c.fillStyle = withAlpha(mixLab(amber, '#fff0d0', 0.4), 0.35);
  c.fillRect(39.4, 13.4, 11.2, 14.2);
  c.restore();
  // the desk: top edge and front, near black
  const deskY = 80;
  c.fillStyle = mixLab(env.mood.ink, amber, 0.05);
  c.fillRect(-10, deskY, 120, 40);
  c.strokeStyle = withAlpha(mixLab(amber, '#fff0d0', 0.5), 0.7);
  c.lineWidth = 0.35;
  c.beginPath();
  c.moveTo(-10, deskY + 0.2);
  c.lineTo(110, deskY + 0.2);
  c.stroke();
  // the desk lamp at left: weighted base, two arms, a shade tipped toward the keyboard
  c.fillStyle = mixLab(env.mood.ink, amber, 0.04);
  c.beginPath();
  c.ellipse(16, deskY - 0.6, 7, 1.6, 0, Math.PI, 0);
  c.fill();
  c.lineCap = 'round';
  c.strokeStyle = c.fillStyle;
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(16, deskY - 1.5);
  c.lineTo(12, 58);
  c.lineTo(24, 40);
  c.stroke();
  c.save();
  c.translate(24, 40);
  c.rotate(0.62);
  c.beginPath();
  c.moveTo(-3, -2);
  c.lineTo(4, -2.4);
  c.lineTo(9, 7);
  c.lineTo(-7, 7);
  c.closePath();
  c.fill();
  c.restore();
  // the bulb's pool on the desk and its hot core (additive; the one saturated accent)
  c.save();
  c.globalCompositeOperation = 'lighter';
  const flick = 1 + 0.03 * Math.sin(tq * 7.3) * Math.sin(tq * 2.1);
  const pool = c.createRadialGradient(34, deskY, 1, 34, deskY, 34);
  pool.addColorStop(0, withAlpha(mixLab(amber, '#fff0d0', 0.4), 0.42 * flick));
  pool.addColorStop(1, withAlpha(amber, 0));
  c.fillStyle = pool;
  c.fillRect(0, deskY - 34, 70, 40);
  const bulb = c.createRadialGradient(26.6, 46.2, 0.2, 26.6, 46.2, 9);
  bulb.addColorStop(0, withAlpha('#fff3d6', 0.95));
  bulb.addColorStop(0.35, withAlpha(amber, 0.35 * flick));
  bulb.addColorStop(1, withAlpha(amber, 0));
  c.fillStyle = bulb;
  c.fillRect(16, 36, 22, 22);
  c.restore();
  // the laptop and the hands: author typing (on twos), the agent's paler hand resting beside them
  const commitU = seg(t, b.name - 0.15, b.name + 0.75);
  const author: 'type' | 'pause' | 'rest' = t < b.name - 0.15 ? 'type' : t < b.june + 1.2 ? 'pause' : t < b.glimpse - 0.6 ? 'type' : 'rest';
  const screenPulse = 1 + 0.12 * Math.exp(-Math.max(0, t - b.name) * 3) * (t >= b.name ? 1 : 0);
  hands.deskHands(c, { x: 62, y: deskY + 0.5, w: 46, tq, author, pauseU: author === 'pause' ? commitU : 0, agent: 'rest', agentIn: 1, screen: 0.82 * screenPulse }, env);
  // the glass: a faint cold sheen across the pane (we are outside, looking in)
  const sheen = c.createLinearGradient(0, 0, 100, 100);
  sheen.addColorStop(0.3, withAlpha(env.mood.rim, 0));
  sheen.addColorStop(0.42, withAlpha(env.mood.rim, 0.07));
  sheen.addColorStop(0.5, withAlpha(env.mood.rim, 0));
  c.fillStyle = sheen;
  c.fillRect(0, 0, 100, 100);
  // the window's own reveal: a dark inner frame
  c.globalAlpha = see;
  c.strokeStyle = mixLab(env.mood.ink, amber, 0.03);
  c.lineWidth = 3;
  c.strokeRect(1.5, 1.5, 97, 97);
  c.restore();
}

/** L5: a near rooftop edge with chimney pots at the lower right (world px around ROOF) */
function rooftop(c: C2, env: PaintEnv) {
  const x = ROOF.x, y = ROOF.y;
  c.fillStyle = env.fill('fg');
  c.beginPath();
  c.moveTo(x + 40, y + 520);
  c.lineTo(x + 40, y + 150);
  c.lineTo(x + 700, y + 120);
  c.lineTo(x + 700, y + 520);
  c.closePath();
  c.fill();
  // a chimney stack with three pots
  c.fillRect(x + 150, y + 40, 90, 120);
  c.fillRect(x + 142, y + 34, 106, 10);
  for (const px of [160, 188, 216]) {
    c.fillRect(x + px, y + 8, 16, 28);
    c.fillRect(x + px - 2, y + 4, 20, 6);
  }
  // an aerial
  c.fillRect(x + 360, y - 60, 3, 200);
  for (const [dy, w] of [[-40, 60], [-20, 46], [0, 34]] as const) c.fillRect(x + 361 - w / 2, y + dy, w, 2.4);
  c.strokeStyle = withAlpha(env.mood.rim, 0.3);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x + 40, y + 150);
  c.lineTo(x + 700, y + 120);
  c.moveTo(x + 142, y + 34);
  c.lineTo(x + 248, y + 34);
  c.stroke();
}

/** L6: a leafy June branch reaching in from the upper left (world px from BRANCH) */
function branch(c: C2, env: PaintEnv) {
  tree(c, { x: BRANCH.x0 + 60, y: BRANCH.y0 + 720, h: 760, kind: 'elm', seed: 3061, leaves: 0.55, lean: 0.55, detail: 0.7, role: 'fg' }, env);
}

/** the commit message, typed under the date stamp, with a fine leader to the pane while the camera is wide */
function commitLabel(f: Frame, t: number, b: Beats, out: number, cam: Camera3) {
  const at = b.pane1 + 0.35;
  const A = seg(t, at, at + 0.3) * (1 - seg(t, out - 0.45, out));
  if (A <= 0.01) return;
  const c = f.c;
  const txt = 'Create numeric UI atom lab';
  const tqq = twos(t);
  const shown = Math.min(txt.length, Math.max(0, Math.floor((tqq - at) * 26)));
  c.save();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 19px ${FONT.mono}`, 19);
    const font = `500 ${size}px ${FONT.mono}`;
    c.font = font;
    const w = c.measureText(txt).width;
    c.globalAlpha = A;
    softPlate(c, 48 + w / 2, 104, w + 150, size + 60, f.mood.ink, 0.45);
    c.fillStyle = mixLab('#efe6d2', f.mood.core, 0.25);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    drawTracked(c, txt.slice(0, shown), 48, 112, { font, size, tracking: 0.02, align: 'left' });
    textProbe(c, `${ID}-commit`, 48, 112 - size, w, size * 1.2, A);
    // the leader, only while the pane is small on screen
    const p = toScreen(LAYERS.L4, cam, P0.x + P0.w, P0.y);
    const la = A * (1 - sm((p.k - 2.4) / 1.2)) * seg(t, at + 0.6, at + 1.0);
    if (la > 0.01) {
      c.globalAlpha = la * 0.7;
      c.strokeStyle = mixLab('#efe6d2', f.mood.core, 0.25);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(48 + Math.min(w, 220), 122);
      c.quadraticCurveTo(p.x - 40, 150, p.x + 3, p.y - 3);
      c.stroke();
    }
  });
  c.restore();
}

/** the caption builds with the plaque: Numeric UI Atom Lab → Indirect → Handwired */
function renameCaption(c: C2, mood: Frame['mood'], t: number, b: Beats) {
  const parts: [string, number][] = [
    ['Numeric UI Atom Lab', b.june],
    ['  →  Indirect', b.names],
    ['  →  Handwired', b.handwired],
  ];
  const A = seg(t, b.june - 0.05, b.june + 0.3) * (1 - seg(t, b.D - 1.6, b.D - 1.0));
  if (A <= 0.01) return;
  c.save();
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 27px ${FONT.display}`, 27);
    const font = `500 ${size}px ${FONT.display}`;
    c.font = font;
    const full = parts.map((p) => p[0]).join('');
    const w = c.measureText(full).width;
    c.globalAlpha = A;
    softPlate(c, 48 + w / 2, 58, w + 170, size + 66, mood.ink, 0.5);
    let x = 48;
    parts.forEach(([txt, at], i) => {
      const a = seg(t, at - 0.05, at + 0.35);
      const tw = c.measureText(txt).width;
      if (a > 0.01) {
        c.globalAlpha = A * a;
        c.fillStyle = i === 2 ? mixLab(copperOfMood(mood), mood.core, 0.35) : mixLab('#efe6d2', mood.core, 0.2);
        c.textAlign = 'left';
        c.textBaseline = 'alphabetic';
        c.fillText(txt, x, 68);
      }
      x += tw;
    });
    textProbe(c, `${ID}-renames`, 48, 68 - size, w, size * 1.2, A);
  });
  c.restore();
}
const copperOfMood = (mood: Frame['mood']) => copperOf({ mood, layer: LAYERS.L4 } as PaintEnv, 0.6);
