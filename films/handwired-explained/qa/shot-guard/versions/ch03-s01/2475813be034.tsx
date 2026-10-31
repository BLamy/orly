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
  ghostOk,
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
  withAlpha,
} from '../../../film';
import { hands } from '../cast';
import { CAL, paneRect, windowCalendar, type CalendarOpts } from '../sets/windowCalendar';
import { HAND_LEN } from '../sets/narratorHands';

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
/**
 * The camera: the keyed path, except the closing glimpse push (from 'Handwired' + 0.4 to the end), where the frame
 * re-centres on the first pane AHEAD of the zoom (position leads, log-uniform zoom follows) and rides a little high,
 * so the plaque slides out under the frame instead of swelling across the middle of it.
 */
function shotCam(keys: CamKey[], b: Beats, t: number): Camera3 {
  const n = keys.length;
  const a = keys[n - 2], z = keys[n - 1];
  if (t <= a.t) return camAt(keys, t);
  const u = clamp01((t - a.t) / (z.t - a.t));
  const uk = smr(u);
  const up = smr(Math.min(1, u * 1.75));
  const k = Math.exp(lerp(Math.log(GLIDE.k0), Math.log(GLIMPSE_K), uk));
  const x = lerp(GLIDE.x0, P0C.x + 0.4, up);
  const y = lerp(GLIDE.y0, P0C.y - 0.2, up) - 26 * Math.sin(Math.PI * up) * (1 - uk);
  return camK(x, y, k);
}

/** the wide: the building's lower half, its plinth and plaque, a band of night sky */
const WIDE = { x: 640, y: 634, k: 1.75 };
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
/** the plaque + June column framing (June's 12 storeys, the plaque and its date chips, all inside the safe area) */
const JUNE_PLAQUE = { x: 572, y: 668 };
/** the glimpse lands with the first pane at ~35% of the frame height */
const GLIMPSE_K = (0.35 * 720) / CAL.pane;
/** where the glimpse push starts: the plaque + June framing, a touch tighter (WIDE.k * 1.15) */
const GLIDE = { x0: JUNE_PLAQUE.x + 2, y0: JUNE_PLAQUE.y + 2, k0: WIDE.k * 1.15 };
/** the honest cut through the pane, on 'Cheng' (the name card lands with it) */
const cutAt = (b: Beats) => b.cheng - 0.08;
function cams(b: Beats): CamKey[] {
  return [
    // the wide: a slow ~6% multiplane push toward the first pane (no zoom-through: the shot CUTS in on 'Cheng')
    { t: 0, cam: camK(WIDE.x - 20, WIDE.y + 4, WIDE.k * 0.94) },
    { t: cutAt(b) - 1e-3, cam: camK(lerp(WIDE.x, P0C.x, 0.18), lerp(WIDE.y, P0C.y, 0.18), WIDE.k * 1.0) },
    // the macro: straight through the glass, drifting in a hair while he types
    { t: cutAt(b), cam: camK(P0C.x - 0.1, P0C.y + 0.05, MACRO_K) },
    { t: b.pane2, cam: camK(P0C.x + 0.15, P0C.y - 0.05, MACRO_K * 1.06) },
    // pull back out of the window from pane2: the mid key frames June's column with the plaque inside the safe area
    { t: 9.8, cam: camK(JUNE_PLAQUE.x, JUNE_PLAQUE.y, 1.95) },
    // as 'Handwired' letters, the plaque and the June column together a little tighter (WIDE.k * 1.15)
    { t: b.handwired + 0.4, cam: camK(GLIDE.x0, GLIDE.y0, GLIDE.k0) },
    // the glimpse: ~3.5 s settle back in on the first pane, landing with it at ~35% of the frame height
    { t: b.D - 0.3, cam: camK(P0C.x + 0.4, P0C.y - 0.2, GLIMPSE_K) },
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
    const cam = shotCam(sc.keys, b, t);
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
      plaqueEngrave(c, env, plateStage, calOpts.nameplatePaint ?? 1);
      dateChips(c, env, t, b, k);
      // newly lit panes flash hot for a beat (one relay clack each)
      hotPanes(c, env, t, b, nLit);
      // the first pane: a warm amber lit window (not a white star), with a tight amber bloom
      if (nLit > 0) amberPane(c, env, seg(t, b.pane1 - 0.05, b.pane1 + 0.35) * (1 - zoomed));
      // up close, the cached bitmap is soft: redraw the panes around the first one as crisp vector
      if (paneScreen > 40) crispNeighbours(c, env, nLit, t, b);
    });
    f.rim({ x: 0.35, y: -1 });

    // ---------------- the portal: through the first pane, the desk (drawn inside the pane's own rect)
    const see = sm((paneScreen - 26) / 110);
    if (nLit > 0 && see > 0.003) portal(f, t, tq, b, see, cam);

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
  const p = toLayer(LAYERS.L5, CAM_WIDE, 1000, 372);
  return { x: Math.round(p.x), y: Math.round(p.y) };
})();
const BRANCH = (() => {
  const p = toLayer(LAYERS.L6, CAM_WIDE, -40, -50);
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

/**
 * The plaque's current name, cut deeper: the set letters it straight onto the brass (copper on brass reads faint at
 * the wide), so the same letters are re-set exactly over it with an engraved shadow and a brighter face.
 */
function plaqueEngrave(c: C2, env: PaintEnv, stage: string, paint: number) {
  const names = ['Numeric UI Atom Lab', 'Indirect', 'Handwired'];
  const i = names.indexOf(stage);
  if (i < 0 || paint <= 0.01) return;
  const y = PLATE_Y + 6 + PLATE_LH * (i + 0.5);
  ghostOk(c, () =>
    textRole(c, 'subject', () => {
      c.save();
      c.font = `600 15px ${FONT.sc}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = withAlpha('#120c07', 0.55 * paint);
      c.fillText(names[i], PLATE_X + 0.45, y + 0.6);
      // Handwired: a dark, saturated copper cut into the brass (barely any core mix), so the payoff reads as copper
      c.fillStyle = i === 2 ? withAlpha(mixLab('#b8642c', env.mood.core, 0.1), paint) : withAlpha('#1a110a', 0.95 * paint);
      c.fillText(names[i], PLATE_X, y);
      c.restore();
    }),
  );
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

/** the first pane at the wide: an amber window (lamp-tinted core, faint mullion shadow) and a small amber bloom */
function amberPane(c: C2, env: PaintEnv, u: number) {
  if (u <= 0.01) return;
  const r = P0;
  const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
  c.save();
  c.globalAlpha = u;
  c.fillStyle = mixLab(mixLab(AMBER, '#ffe2b0', 0.25), env.mood.core, 0.08);
  c.fillRect(r.x, r.y, r.w, r.h);
  // the lamp sits at the pane's left: its corner glows a touch hotter, the right side falls off
  const inner = c.createLinearGradient(r.x, 0, r.x + r.w, 0);
  inner.addColorStop(0, withAlpha('#ffe9c4', 0.45));
  inner.addColorStop(1, withAlpha(mixLab(AMBER, env.mood.ink, 0.35), 0.4));
  c.fillStyle = inner;
  c.fillRect(r.x, r.y, r.w, r.h);
  c.globalAlpha = 1;
  // the bloom, ~40% of the set's old radius, amber not white (additive)
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(cx, cy, r.w * 0.4, cx, cy, 24);
  g.addColorStop(0, withAlpha(AMBER, 0.32 * u));
  g.addColorStop(0.45, withAlpha(mixLab(AMBER, env.mood.halo, 0.4), 0.1 * u));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(cx - 24, cy - 24, 48, 48);
  c.restore();
}

/** each pane flashes hot for a beat when it lights */
function hotPanes(c: C2, env: PaintEnv, t: number, b: Beats, nLit: number) {
  const hot = mixLab('#ffe7b8', env.mood.core, 0.3);
  for (let i = 1; i < nLit; i++) {
    const dt = t - litAt(i, b);
    if (dt < 0 || dt > 0.25) continue;
    const r = paneRect('jun', i, BASE);
    c.fillStyle = withAlpha(hot, 0.85 * (1 - dt / 0.25));
    c.fillRect(r.x, r.y, r.w, r.h);
  }
}

/** a lit neighbour pane seen close: another evening's window, its blind drawn and lit from behind (warm, a step under
 *  the first pane's room so the eye stays there), slats as faint cut-lines, a thin sill */
function litPane(c: C2, env: PaintEnv, r: { x: number; y: number; w: number; h: number }, lit: string) {
  const blind = mixLab(lit, env.mood.set, 0.4);
  const g = c.createRadialGradient(r.x + r.w * 0.35, r.y + r.h * 0.6, r.w * 0.05, r.x + r.w * 0.45, r.y + r.h * 0.5, r.w * 0.8);
  g.addColorStop(0, mixLab(blind, '#fff1cf', 0.18));
  g.addColorStop(0.7, blind);
  g.addColorStop(1, mixLab(blind, env.mood.ink, 0.35));
  c.fillStyle = g;
  c.fillRect(r.x, r.y, r.w, r.h);
  c.strokeStyle = withAlpha(env.mood.ink, 0.12);
  c.lineWidth = r.h * 0.012;
  c.beginPath();
  for (let k = 1; k < 9; k++) {
    const y = r.y + (r.h * 0.9 * k) / 9;
    c.moveTo(r.x, y);
    c.lineTo(r.x + r.w, y);
  }
  c.stroke();
  c.fillStyle = withAlpha(env.fill('ink'), 0.85);
  c.fillRect(r.x, r.y + r.h * 0.9, r.w, r.h * 0.1);
}

/** crisp vector panes around the first one (the set's cached bitmap softens under a deep push) */
function crispNeighbours(c: C2, env: PaintEnv, nLit: number, t: number, b: Beats) {
  const unlit = mixLab(env.fill('ink'), env.mood.set, 0.35);
  const lit = mixLab(mixLab(mixLab(env.mood.rim, '#f2c27a', 0.8), env.mood.core, 0.3), '#fff1cf', 0.1);
  c.save();
  for (let i = 0; i < 18; i++) {
    if (i === 0) continue;
    const r = paneRect('jun', i, BASE);
    if (i < nLit) litPane(c, env, r, lit);
    else {
      c.fillStyle = unlit;
      c.fillRect(r.x, r.y, r.w, r.h);
    }
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
 * Through the first pane: a lamp-lit room behind the glass, in true depth (pane-local units, 0..100 across the
 * 7.2-px pane): the back wall with its shelf and print (ROOM_WALL, z 1015), the desk, lamp, laptop and hands
 * (ROOM_DESK, z 1007), the glass's cold sheen (GLASS, z 1000) and the window's projecting frame and sill (SILL,
 * z 992). Each room plane is clipped to the pane's SCREEN rect, so the room slides behind the opening as the camera
 * pushes. `see` 0..1 crossfades from the plain lit pane to the room as the pane grows on screen.
 */
const ROOM_WALL: LayerSpec = { id: 'room-wall', z: 1015, haze: 0, blur: 0 };
const ROOM_DESK: LayerSpec = { id: 'room-desk', z: 1007, haze: 0, blur: 0 };
const GLASS: LayerSpec = { id: 'glass', z: 1000, haze: 0, blur: 0 };
const SILL: LayerSpec = { id: 'sill', z: 992, haze: 0, blur: 0 };
/** the near window's own mullion and sill, out of focus between us and the glass (we look THROUGH a window) */
const FRONT: LayerSpec = { id: 'front', z: 978, haze: 0, blur: 0 };
const AMBER = '#e9a95a';

/** clip to the pane's hole as it sits on screen (the building's plane), expressed in `layer`'s coordinates */
function clipToPane(c: C2, layer: LayerSpec, cam: Camera3) {
  const a = toScreen(CALL, cam, P0.x, P0.y);
  const z = toScreen(CALL, cam, P0.x + P0.w, P0.y + P0.h);
  const A = toLayer(layer, cam, a.x, a.y);
  const B = toLayer(layer, cam, z.x, z.y);
  c.beginPath();
  c.rect(A.x, A.y, B.x - A.x, B.y - A.y);
  c.clip();
}
/**
 * Enter pane-local units (0..100 across the pane) on `layer`. Rest-screen coordinates place a deeper plane by its
 * projection from the HOME camera, so each room plane is anchored where it registers exactly behind the pane under
 * the macro camera (the shot's own "looking straight in"); away from that framing it slides by true parallax.
 */
const ANCHOR_CACHE = new Map<string, { x: number; y: number; s: number }>();
function paneLocal(c: C2, layer: LayerSpec) {
  let a = ANCHOR_CACHE.get(layer.id);
  if (!a) {
    const cm = camK(P0C.x, P0C.y, MACRO_K);
    const s0 = toScreen(CALL, cm, P0.x, P0.y);
    const s1 = toScreen(CALL, cm, P0.x + P0.w, P0.y);
    const q0 = toLayer(layer, cm, s0.x, s0.y);
    const q1 = toLayer(layer, cm, s1.x, s1.y);
    a = { x: q0.x, y: q0.y, s: (q1.x - q0.x) / 100 };
    ANCHOR_CACHE.set(layer.id, a);
  }
  c.translate(a.x, a.y);
  c.scale(a.s, a.s);
}

function portal(f: Frame, t: number, tq: number, b: Beats, see: number, cam: Camera3) {
  f.layer(ROOM_WALL, (c, env) => {
    c.save();
    clipToPane(c, ROOM_WALL, cam);
    c.globalAlpha = see;
    paneLocal(c, ROOM_WALL);
    roomWall(c, env);
    c.restore();
  });
  f.layer(ROOM_DESK, (c, env) => {
    c.save();
    clipToPane(c, ROOM_DESK, cam);
    c.globalAlpha = see;
    paneLocal(c, ROOM_DESK);
    roomDesk(c, env, t, tq, b);
    c.restore();
  });
  f.layer(GLASS, (c, env) => {
    c.save();
    clipToPane(c, GLASS, cam);
    c.globalAlpha = see;
    paneLocal(c, GLASS);
    // the glass: a faint cold sheen across the pane (we are outside, looking in)
    const sheen = c.createLinearGradient(0, 0, 100, 100);
    sheen.addColorStop(0.3, withAlpha(env.mood.rim, 0));
    sheen.addColorStop(0.42, withAlpha(env.mood.rim, 0.07));
    sheen.addColorStop(0.5, withAlpha(env.mood.rim, 0));
    c.fillStyle = sheen;
    c.fillRect(0, 0, 100, 100);
    c.restore();
  });
  f.layer(SILL, (c, env) => {
    c.save();
    c.globalAlpha = see;
    paneLocal(c, SILL);
    // the window's frame standing a little proud of the wall, and its sill catching the moon on the top edge
    const ink = env.fill('ink');
    c.strokeStyle = mixLab(ink, AMBER, 0.03);
    c.lineWidth = 3.2;
    c.strokeRect(-0.6, -0.6, 101.2, 101.2);
    c.fillStyle = ink;
    c.fillRect(-6, 100, 112, 5);
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.6);
    c.lineWidth = 0.7;
    c.beginPath();
    c.moveTo(-6, 100.3);
    c.lineTo(106, 100.3);
    c.stroke();
    c.restore();
  });
  f.layer(FRONT, (c, env) => {
    c.save();
    c.globalAlpha = see;
    paneLocal(c, FRONT);
    softMullion(c, env);
    c.restore();
  });
}

/** soft-focus near plane (pane-local units): a vertical mullion at the left and a sill bar along the bottom, edges
 *  feathered by gradients (a defocused occluder, cheap), with a faint cold moon edge */
function softMullion(c: C2, env: PaintEnv) {
  const ink = mixLab(env.fill('ink'), env.mood.set, 0.12);
  const clear = withAlpha(ink, 0);
  // the mullion: a bar from x -34 to -20, feathered 6 units each side
  const gx = c.createLinearGradient(-40, 0, -14, 0);
  gx.addColorStop(0, clear);
  gx.addColorStop(0.23, withAlpha(ink, 0.96));
  gx.addColorStop(0.77, withAlpha(ink, 0.96));
  gx.addColorStop(1, clear);
  c.fillStyle = gx;
  c.fillRect(-40, -80, 26, 260);
  // the moon catching its right edge, softly
  const rimG = c.createLinearGradient(-19, 0, -13, 0);
  rimG.addColorStop(0, withAlpha(env.mood.rim, 0));
  rimG.addColorStop(0.5, withAlpha(env.mood.rim, 0.16));
  rimG.addColorStop(1, withAlpha(env.mood.rim, 0));
  c.fillStyle = rimG;
  c.fillRect(-19, -80, 6, 260);
  // the sill: a broad bar across the bottom, feathered on its top edge
  const gy = c.createLinearGradient(0, 104, 0, 124);
  gy.addColorStop(0, clear);
  gy.addColorStop(0.35, withAlpha(ink, 0.97));
  gy.addColorStop(1, withAlpha(ink, 0.97));
  c.fillStyle = gy;
  c.fillRect(-120, 104, 360, 60);
  const sillRim = c.createLinearGradient(0, 107, 0, 113);
  sillRim.addColorStop(0, withAlpha(env.mood.rim, 0));
  sillRim.addColorStop(0.5, withAlpha(env.mood.rim, 0.14));
  sillRim.addColorStop(1, withAlpha(env.mood.rim, 0));
  c.fillStyle = sillRim;
  c.fillRect(-120, 107, 360, 6);
}

function roomWall(c: C2, env: PaintEnv) {
  // the back wall: warm lamplight from the left, falling off to the right (overfilled for the parallax)
  const wall = c.createRadialGradient(22, 46, 4, 30, 50, 120);
  wall.addColorStop(0, mixLab(AMBER, '#fff0d0', 0.45));
  wall.addColorStop(0.35, mixLab(AMBER, env.mood.set, 0.25));
  wall.addColorStop(1, mixLab(mixLab(AMBER, env.mood.set, 0.8), env.mood.ink, 0.3));
  c.fillStyle = wall;
  c.fillRect(-20, -20, 140, 140);
  // a shelf with a few books, upper right
  const backInk = mixLab(env.mood.ink, AMBER, 0.18);
  c.fillStyle = backInk;
  c.fillRect(60, 24, 50, 1.6);
  const books: [number, number, number][] = [[63, 9, 2.6], [66, 11, 2.2], [68.6, 8, 3], [72, 10, 2.4], [74.8, 7, 2], [80, 10.5, 2.6], [83, 9.5, 2.2]];
  for (const [x, h, w] of books) c.fillRect(x, 24 - h, w, h);
  c.save();
  c.translate(86.5, 24);
  c.rotate(0.32);
  c.fillRect(0, -9, 2.4, 9);
  c.restore();
  // a framed print, left of the shelf (its glass catches the lamp)
  c.fillRect(38, 12, 14, 17);
  c.fillStyle = withAlpha(mixLab(AMBER, '#fff0d0', 0.4), 0.35);
  c.fillRect(39.4, 13.4, 11.2, 14.2);
}

function roomDesk(c: C2, env: PaintEnv, t: number, tq: number, b: Beats) {
  // the desk: top edge and front, near black
  const deskY = 80;
  c.fillStyle = mixLab(env.mood.ink, AMBER, 0.05);
  c.fillRect(-20, deskY, 140, 40);
  c.strokeStyle = withAlpha(mixLab(AMBER, '#fff0d0', 0.5), 0.7);
  c.lineWidth = 0.35;
  c.beginPath();
  c.moveTo(-20, deskY + 0.2);
  c.lineTo(120, deskY + 0.2);
  c.stroke();
  // the desk lamp at left: weighted base, two arms, a shade tipped toward the keyboard
  c.fillStyle = mixLab(env.mood.ink, AMBER, 0.04);
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
  pool.addColorStop(0, withAlpha(mixLab(AMBER, '#fff0d0', 0.4), 0.42 * flick));
  pool.addColorStop(1, withAlpha(AMBER, 0));
  c.fillStyle = pool;
  c.fillRect(0, deskY - 34, 70, 40);
  const bulb = c.createRadialGradient(26.6, 46.2, 0.2, 26.6, 46.2, 9);
  bulb.addColorStop(0, withAlpha('#fff3d6', 0.95));
  bulb.addColorStop(0.35, withAlpha(AMBER, 0.35 * flick));
  bulb.addColorStop(1, withAlpha(AMBER, 0));
  c.fillStyle = bulb;
  c.fillRect(16, 36, 22, 22);
  c.restore();
  // the laptop and the hands: author typing (on twos), the agent's paler hand resting beside them
  const commitU = seg(t, b.name - 0.15, b.name + 0.75);
  // the author keeps typing on twos to the end; the agent's hand never moves
  const author: 'type' | 'pause' = t < b.name - 0.15 ? 'type' : t < b.june + 1.2 ? 'pause' : 'type';
  const screenPulse = 1 + 0.12 * Math.exp(-Math.max(0, t - b.name) * 3) * (t >= b.name ? 1 : 0);
  const desk = { x: 62, y: deskY + 0.5, w: 46 };
  hands.deskHands(c, { ...desk, tq, author, pauseU: author === 'pause' ? commitU : 0, agent: 'off', screen: 0.82 * screenPulse }, env);
  agentHand(c, env, desk);
}

/**
 * The agent's hand, drawn as deskHands draws it at rest (same tip, entry, shape and paleness), perfectly still, and set
 * apart from the author's two hands by a fine cool rim on its upper-left contour (a moonlit edge, ~1.5 device px):
 * pass 1 throws the hand's silhouette as an offset cool shadow, pass 2 lays the paper hand over it.
 */
function agentHand(c: C2, env: PaintEnv, d: { x: number; y: number; w: number }) {
  const k = d.w / 300;
  const tip = { x: d.x + d.w * 0.27, y: d.y - d.w * 0.13 };
  const entry = { x: d.x + d.w * 0.7, y: d.y + d.w * 1.1 };
  const arm = hands.reach(entry, tip, 'rest', HAND_LEN * 0.9 * k, { sleeve: 'bare', pale: 0.35, noArmRim: true });
  const pose = { right: arm, scale: 0.9 * k };
  const m = c.getTransform();
  const sx = Math.hypot(m.a, m.b) || 1;
  const OFF = 8000;
  c.save();
  c.shadowColor = withAlpha(mixLab(env.mood.rim, '#cfe2f2', 0.5), 0.95);
  c.shadowBlur = 0.6;
  c.shadowOffsetX = OFF - 2;
  c.shadowOffsetY = -2;
  c.translate(-OFF / sx, 0);
  hands.draw(c, pose, env);
  c.restore();
  hands.draw(c, pose, env);
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
  const x0 = BRANCH.x0 + 60, y0 = BRANCH.y0 + 60;
  c.fillStyle = env.fill('fg');
  c.strokeStyle = env.fill('fg');
  c.lineCap = 'round';
  // one slender bough from the top-left corner, two side twigs, leaves in small hanging clusters
  const bough: [number, number][] = [[x0 - 40, y0 + 20], [x0 + 70, y0 + 60], [x0 + 150, y0 + 84], [x0 + 230, y0 + 92]];
  c.lineWidth = 9;
  c.beginPath();
  c.moveTo(bough[0][0], bough[0][1]);
  c.bezierCurveTo(bough[1][0], bough[1][1], bough[2][0], bough[2][1], bough[3][0], bough[3][1]);
  c.stroke();
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(x0 + 90, y0 + 68);
  c.quadraticCurveTo(x0 + 110, y0 + 120, x0 + 104, y0 + 150);
  c.moveTo(x0 + 170, y0 + 88);
  c.quadraticCurveTo(x0 + 200, y0 + 70, x0 + 236, y0 + 58);
  c.stroke();
  const leaf = (x: number, y: number, a: number, s: number) => {
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(s * 0.45, -s * 0.28, s, 0);
    c.quadraticCurveTo(s * 0.45, s * 0.28, 0, 0);
    c.fill();
    c.restore();
  };
  for (let i = 0; i < 34; i++) {
    const u = i / 33;
    const bx = x0 - 20 + u * 250 + Math.sin(i * 2.7) * 14;
    const by = y0 + 30 + u * 60 + Math.cos(i * 1.9) * 16;
    leaf(bx, by, 0.9 + Math.sin(i * 1.3) * 0.9, 22 + (i % 4) * 4);
  }
  for (let i = 0; i < 8; i++) leaf(x0 + 96 + Math.sin(i) * 8, y0 + 96 + i * 7, 1.2 + Math.sin(i * 2) * 0.5, 20);
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
        // the superseded names step back as the next arrives; 'Handwired' is the strongest word, full copper
        const past = i < 2 ? 1 - 0.42 * seg(t, parts[i + 1][1] - 0.05, parts[i + 1][1] + 0.4) : 1;
        c.globalAlpha = A * a * past;
        c.font = i === 2 ? `600 ${size}px ${FONT.display}` : font;
        c.fillStyle = i === 2 ? COPPER_CAPTION : mixLab('#efe6d2', mood.core, 0.2);
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
/** the caption's copper: saturated, full opacity, no core mix (the one copper accent in the type) */
const COPPER_CAPTION = '#d9834a';
