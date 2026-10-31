/**
 * ch07-s03 — accomplice one, DATA (dawnGold, 23.88 s): Fei-Fei Li's desk calendar flips nineteen years of
 * hand-labelling; then a dark paper globe lights window by window as a crowd labels her pictures.
 *
 *   0 → 'crowd'   Princeton, a late office at night, paper-cut: bookshelves, a desk lamp, a flat monitor whose
 *                 screen is a grid of tiny thumbnails. Li in profile at the desk, clicking through them
 *   'Colleagues'  name card (Li, with Kai Li) + PRINCETON · 2007; Li looks up; two generic colleague silhouettes
 *                 are revealed at the rim of the lamp's light, half in shadow, FACING OUT, their long shadows
 *                 thrown away from her lamp; Li's own recollection rises beside them on a parchment card
 *                 (Plex Mono, attributed to Li; it holds until 'crowd')
 *   'Labelling'   Li turns back to the grid; the colleagues stay at the rim
 *   'nineteen'    the camera has drifted to the desk: a paper block calendar flips nineteen pages in a blur
 *   'crowd'       the camera pulls straight back out through the office window and keeps going: the office
 *                 becomes one lit window on a dark paper globe turning against the dawnGold rim
 *   'fifty'       windows light across the globe, one by one, then by the hundred; inside a few (magnified
 *                 vignettes), generic crowd workers at home desks click through grids of thumbnails; a small
 *                 market-stall awning cut-out sits at the globe's base
 *   L0705 end     the thumbnails stream off the globe like sparks and settle onto a parchment plate
 *   'ImageNet'    they snap into a grid of a thousand tiles (one per category); the one label is pinned beneath
 * TEXT: date stamp + name card, the quote card (until 'crowd'), the ImageNet label. Nothing else.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv, Pose, PuppetSpec } from '../../../film';
import { LAYERS, POSES, blendPose, defineShot, mixLab, nameCard, overscan, placeStamp, pose, withAlpha, withLife } from '../../../film';
import { SPECS } from '../cast';
import { createPuppet } from '../../../film/silhouette/puppet';
import { anglepoiseLamp } from '../../../film/silhouette/props';
import { bookshelfWall, skyline } from '../../../film/silhouette/architecture';
import { stars } from '../../../film/silhouette/nature';
import { dustMotes } from '../../../film/silhouette/atmosphere';
import { hash1 } from '../../../film/core/frame';
import { FONT } from '../../../film/silhouette/type';
import { MOODS } from '../../../film/silhouette/palette';
import { glow, parchmentPlate } from '../../../film/silhouette/metaphors/kit';
import { filingCabinet, officeStool, simpleDesk } from '../sets/ch05-s07-kit';
import { compositeSub, subFrame } from '../sets/ch02-s05b-util';
import { OFFICE_W, marketAwning, officeWindowAt, paperGlobe, globeWindows, type GlobeDraw } from '../sets/ch07-s03-globe';
import { brassPin, capFont, clamp01, lerp, mixCam, monoCard, sm, tq12, win } from '../sets/ch07-s01-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch07-s03';
const PARCH = MOODS.parchment;

// ------------------------------------------------------------------------------------------------ the office
const FY = 640;
const LI = createPuppet({ ...SPECS.li, prop: 'none' });
const LI_X = 548;
const TYPE: Pose = POSES.type;
const LOOK: Pose = { ...POSES.type, angles: { ...POSES.type.angles, torso: 0, neck: -3, head: -8, shoulderF: 10, elbowF: 70 } };
const LI_HAND = LI.anchor({ x: LI_X, y: FY, facing: 'right', pose: TYPE }, 'handF');
const DESK_Y = Math.round(LI_HAND.y + 9);
const DESK = { x0: LI_X + 40, x1: LI_X + 510 };
const MON = { x: LI_X + 168, w: 132, h: 86 }; // front-view flat monitor on the desk
const CAL = { x: LI_X + 274, w: 62, h: 58 };
const LAMP = { x: LI_X + 474, y: DESK_Y, s: 1.8 };
const LAMP_BULB = anglepoiseLamp.anchors({ x: LAMP.x, y: LAMP.y, s: LAMP.s, reach: 0.35, flip: true }).bulb;
const WINDOW = { x: 1000, y: 110, w: 250, h: 300 };
const generic = (id: string, over: Partial<PuppetSpec>): PuppetSpec => ({ ...SPECS.reporter, id, era: '2000s', hat: 'none', prop: 'none', details: [], ...over });
const COLL = [
  { p: createPuppet(generic('colleague-a', { wardrobe: 'blazer', hair: 'receding', height: 326, build: 'average', glasses: 'rectangular' })), x: 372 },
  { p: createPuppet(generic('colleague-b', { wardrobe: 'suit', hair: 'sidePart', height: 318, build: 'slight', profile: { nose: 0.45, brow: 0.55, chin: 0.52, jaw: 0.5 } })), x: 452 },
];
const COLL_POSE: Pose = POSES.clasp;
const OFF_CAMS: Camera3[] = [
  { x: 676, y: 380, z: 100, lens: 1 },
  { x: 690, y: 392, z: 150, lens: 1 },
  // the calendar push: the pad fills ≈ 25 % of the frame height (k ≈ 3.05) for 'nineteen years'
  { x: CAL.x + 4, y: DESK_Y - CAL.h / 2 - 6, z: 672, lens: 1 },
  // after the hold: back out to the office, the pull-back through the window continuing from here
  { x: 700, y: 396, z: 170, lens: 1 },
];

// ------------------------------------------------------------------------------------------------ the globe
const G_R0 = 250;
const G: GlobeDraw = { x: 640, y: 392, R: G_R0, rot: 0, lit: 0 };
const G_END = { x: 340, y: 380, R: 210 };
const WIN_W = OFFICE_W * (G_R0 / 260); // the office window on the globe (landscape, final size)
// the plate (screen px) and its thousand tiles
const PLATE = { x: 668, y: 92, w: 540, h: 440 };
const COLS = 40, ROWS = 25, PITCH = 11, TILE = 9;
const GRID = { x: PLATE.x + (PLATE.w - COLS * PITCH) / 2, y: PLATE.y + 34 };
const TILES = Array.from({ length: COLS * ROWS }, (_, i) => ({
  gx: GRID.x + (i % COLS) * PITCH,
  gy: GRID.y + Math.floor(i / COLS) * PITCH,
  sx: PLATE.x + 40 + (0.5 + 0.5 * hash1(i, 11)) * (PLATE.w - 80),
  sy: PLATE.y + 40 + Math.pow(0.5 + 0.5 * hash1(i, 12), 0.7) * (ROWS * PITCH - 10),
  tone: 0.5 + 0.5 * hash1(i, 13),
  shape: Math.floor((0.5 + 0.5 * hash1(i, 14)) * 4),
  launch: 0.5 + 0.5 * hash1(i, 15),
  win: Math.floor((0.5 + 0.5 * hash1(i, 16)) * 400),
}));

// crowd vignettes: magnified windows on the globe (screen px), each a worker at a home desk
const VIGS = [
  { x: -300, y: -150, r: 66, spec: { ...SPECS['crowd-worker'], id: 'cw-a' } as PuppetSpec, at: 0.0 },
  { x: 292, y: -150, r: 62, spec: generic('cw-b', { wardrobe: 'hoodie', hair: 'bob', height: 300, build: 'slight' }), at: 0.3 },
  { x: 272, y: 176, r: 58, spec: generic('cw-c', { wardrobe: 'tshirt', hair: 'curly', height: 310, build: 'average', glasses: 'round' }), at: 0.6 },
].map((v) => ({ ...v, p: createPuppet(v.spec) }));

interface B {
  D: number;
  li: number;
  name: number;
  tenure: number;
  years: number;
  crowd: number;
  /** the office camera: push onto the calendar, land on 19, hold, ease back out */
  calIn0: number;
  calIn1: number;
  calOut0: number;
  pull0: number;
  pull1: number;
  windows: number;
  /** the first windows light ≈ 0.5 s after 'crowd'; hundreds by 'people' */
  lights0: number;
  people: number;
  l05end: number;
  move0: number;
  move1: number;
  imagenet: number;
  thousand: number;
}

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const crowd = T.beat('crowd');
    const b: B = {
      D,
      li: T.beat('li'),
      name: T.word('L0704', 'Fei-Fei') - 0.15,
      tenure: T.beat('tenure'),
      years: T.beat('years'),
      crowd,
      calIn0: T.beat('years') - 1.3,
      calIn1: T.beat('years') - 0.05,
      calOut0: T.word('L0704', 'years') + 0.6,
      pull0: crowd - 0.45,
      pull1: crowd + 1.2,
      windows: T.beat('windows'),
      lights0: crowd + 0.5,
      people: T.word('L0705', 'people'),
      l05end: T.line('L0705').end,
      move0: T.line('L0705').end - 0.35,
      move1: T.line('L0705').end + 0.7,
      imagenet: T.beat('imagenet'),
      thousand: T.word('L0712', 'thousand'),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    const pullStart = b.pull0;
    if (t < pullStart) {
      office(f, t, b);
    } else if (t < b.pull1) {
      // the office, painted offscreen, shrinks into one window on the globe (a continuous zoom out)
      const cv = subFrame(f, `${ID}/office`, 'dawnGold', (g) => office(g, t, b));
      globeScene(f, t, b, cv);
    } else globeScene(f, t, b, null);
    type_(f, t, b);
  },
});

// ================================================================================================= OFFICE
function officeCam(t: number, b: B): Camera3 {
  const [A, B1, Cc] = OFF_CAMS;
  const D2 = OFF_CAMS[3];
  if (t < b.calIn0) return mixCam(A, B1, sm(t / b.calIn0));
  if (t < b.calOut0) return mixCam(B1, Cc, sm((t - b.calIn0) / (b.calIn1 - b.calIn0)));
  return mixCam(Cc, D2, sm((t - b.calOut0) / (b.crowd + 0.1 - b.calOut0)));
}

function office(f: Frame, t: number, b: B) {
  const cam = officeCam(t, b);
  f.camera(cam);
  const tq = tq12(t);
  const reveal = win(t, b.li - 0.2, b.li + 0.6);
  // the lamp lives on the desk; the room falls into the dark toward the edges
  f.backlight({ sunX: WINDOW.x + WINDOW.w / 2, sunY: 360, sunRadius: 380, intensity: 0.4 });
  // L1: the night outside the window: a dark campus roofline, a few lit windows, stars
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, OFF_CAMS, 60);
    f.cached(`${ID}/L1/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      const P = env.mood;
      const sky = cc.createLinearGradient(0, r.y, 0, r.y + r.h);
      sky.addColorStop(0, mixLab(P.sky[0], P.fg, 0.5));
      sky.addColorStop(0.6, P.sky[1]);
      sky.addColorStop(1, P.sky[2]);
      cc.fillStyle = sky;
      cc.fillRect(r.x, r.y, r.w, r.h);
      stars(cc, { x: r.x, y: r.y, w: r.w, h: r.h * 0.45, count: 70, seed: 17, twinkle: 0 }, env);
      // a collegiate roofline: towers and gables (ink, hazed)
      cc.fillStyle = mixLab(env.fill('set'), P.haze, 0.25);
      cc.beginPath();
      cc.moveTo(r.x, 520);
      let x = r.x;
      let k = 0;
      while (x < r.x + r.w) {
        const w = 60 + 80 * (0.5 + 0.5 * hash1(k, 5));
        const h = 330 + 120 * (0.5 + 0.5 * hash1(k, 6));
        cc.lineTo(x, h);
        if (k % 3 === 1) {
          cc.lineTo(x + w * 0.2, h);
          cc.lineTo(x + w * 0.2, h - 90);
          cc.lineTo(x + w * 0.35, h - 130);
          cc.lineTo(x + w * 0.5, h - 90);
          cc.lineTo(x + w * 0.5, h);
        } else cc.lineTo(x + w * 0.5, h - 40);
        cc.lineTo(x + w, h);
        x += w;
        k++;
      }
      cc.lineTo(r.x + r.w, 900);
      cc.lineTo(r.x, 900);
      cc.closePath();
      cc.fill();
      cc.fillStyle = withAlpha(P.halo, 0.6);
      for (let i = 0; i < 26; i++) cc.fillRect(r.x + (0.5 + 0.5 * hash1(i, 8)) * r.w, 420 + (0.5 + 0.5 * hash1(i, 9)) * 120, 4, 6);
    })(c, r.x, r.y);
  });
  // L2: the back wall with the window HOLE, bookshelves at left, the lamp's warmth
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, OFF_CAMS, 60);
    f.cached(`${ID}/L2/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      const wall = mixLab(env.fill('set'), env.mood.fg, 0.2);
      cc.fillStyle = wall;
      cc.beginPath();
      cc.rect(r.x, r.y, r.w, r.h);
      cc.rect(WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h);
      cc.fill('evenodd');
      const pool = cc.createRadialGradient(LAMP_BULB.x, LAMP_BULB.y + 60, 30, LAMP_BULB.x, LAMP_BULB.y + 60, 900);
      pool.addColorStop(0, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.3), 0.85));
      pool.addColorStop(0.55, withAlpha(mixLab(env.mood.set, env.mood.halo, 0.1), 0.4));
      pool.addColorStop(1, withAlpha(wall, 0));
      cc.save();
      cc.beginPath();
      cc.rect(r.x, r.y, r.w, r.h);
      cc.rect(WINDOW.x, WINDOW.y, WINDOW.w, WINDOW.h);
      cc.clip('evenodd');
      cc.fillStyle = pool;
      cc.fillRect(r.x, r.y, r.w, r.h);
      cc.restore();
      // the window frame: sash bars and sill
      cc.fillStyle = env.fill('ink');
      cc.fillRect(WINDOW.x - 12, WINDOW.y - 12, WINDOW.w + 24, 12);
      cc.fillRect(WINDOW.x - 12, WINDOW.y, 12, WINDOW.h);
      cc.fillRect(WINDOW.x + WINDOW.w, WINDOW.y, 12, WINDOW.h);
      cc.fillRect(WINDOW.x - 22, WINDOW.y + WINDOW.h, WINDOW.w + 44, 14);
      cc.fillRect(WINDOW.x + WINDOW.w / 2 - 4, WINDOW.y, 8, WINDOW.h);
      cc.fillRect(WINDOW.x, WINDOW.y + WINDOW.h * 0.45 - 4, WINDOW.w, 8);
      bookshelfWall(cc, { x: -120, y: 60, w: 640, h: 600, bays: 3, seed: 207, gaps: 0.2, objects: true, backTone: 0.2 }, env);
    })(c, r.x, r.y);
  });
  f.fog({ yCenter: 0.62 * 720, height: 0.4 * 720, alpha: 0.18, drift: 6 });
  f.layer('L3', (c, env) => {
    filingCabinet(c, 1180, FY, 1.25, env);
    dustMotes(c, { area: { x: LAMP_BULB.x - 420, y: 220, w: 700, h: 400 }, count: 50, drift: { x: 2, y: -5 }, size: 1.1, brightness: 0.45, salt: 31 }, env);
  });
  f.fog('B');
  const looking = tq < b.li - 0.1 ? 0 : tq < b.tenure - 0.1 ? sm((tq - b.li + 0.1) / 0.5) : 1 - sm((tq - b.tenure + 0.1) / 0.5);
  const liP = withLife(blendPose(clickLoop(tq), LOOK, looking), tq, 2007, 0.6);
  f.layer('L4', (c, env) => {
    const m = env.mood;
    // the floor and the lamp's pool on it
    c.fillStyle = mixLab(m.fg, m.set, 0.3);
    c.fillRect(-300, FY - 4, 2200, 400);
    const pg = c.createRadialGradient(LAMP.x - 120, FY, 10, LAMP.x - 120, FY, 640);
    pg.addColorStop(0, withAlpha(mixLab(m.halo, m.set, 0.3), 0.55));
    pg.addColorStop(1, withAlpha(m.set, 0));
    c.save();
    c.translate(0, FY);
    c.scale(1, 0.18);
    c.translate(0, -FY);
    c.fillStyle = pg;
    c.fillRect(LAMP.x - 800, FY - 640, 1600, 1280);
    c.restore();
    // the colleagues at the rim of the light, facing OUT, their long shadows thrown left (away from the lamp)
    if (reveal > 0.01) {
      // drawn whole into a scratch layer, then laid in at the reveal's alpha (a puppet drawn piecewise at
      // partial alpha shows seams where its parts overlap)
      withLayerAlpha(c, reveal, (cc) => {
        for (const col of COLL) {
          const p = withLife(COLL_POSE, tq, col.x, 0.5);
          // the long shadow, thrown left along the floor, away from her lamp (≈ 1.5 × their height)
          cc.save();
          cc.globalAlpha *= 0.7;
          cc.translate(col.x, FY + 2);
          cc.transform(0, 0.12, 1.5, -0.1, 0, 0);
          col.p.draw(cc, { x: 0, y: 0, facing: 'left', pose: p }, env);
          cc.restore();
        }
        for (const col of COLL) {
          const p = withLife(COLL_POSE, tq, col.x, 0.5);
          col.p.draw(cc, { x: col.x, y: FY, facing: 'left', pose: p, cutLines: true, light: { x: 1, y: -0.3, floor: 0.05 } }, env);
        }
      });
    }
    // Li, her chair, the desk, the monitor's grid, the calendar, the lamp
    officeStool(c, LI_X - 8, FY - 118, FY, 'right', env);
    LI.draw(c, { x: LI_X, y: FY, facing: 'right', pose: liP, cutLines: true, light: { x: 1, y: -0.4, floor: 0.15 } }, env);
    simpleDesk(c, DESK.x0, DESK.x1, DESK_Y, FY, env);
    monitor(c, env, t);
    calendar(c, env, t, b);
    anglepoiseLamp(c, { x: LAMP.x, y: LAMP.y, s: LAMP.s, reach: 0.35, lit: true, flip: true, seed: 7 }, env);
  });
  f.rim({ x: 0.9, y: -0.4 });
  f.practical({ x: LAMP_BULB.x, y: LAMP_BULB.y, kind: 'lamp', seed: 2007, intensity: 0.85, radius: 60 });
  f.practical({ x: MON.x, y: DESK_Y - 60, kind: 'screen', seed: 2008, intensity: 0.45, radius: 50 });
  // near plane: the end of a bookcase at left, blurred
  if (cam.z < 440)
    f.layer('L5', (c, env) => {
      c.fillStyle = env.fill('fg');
      c.fillRect(-520, -200, 260, 1200);
      c.fillRect(-300, FY + 70, 2400, 400);
    });
}

/** clicking through thumbnails: the near hand taps on the twos */
function clickLoop(tq: number): Pose {
  const k = Math.floor(tq * 12) % 9;
  const tap = k === 0 || k === 4 ? 1 : 0;
  return { ...TYPE, angles: { ...TYPE.angles, wristF: (TYPE.angles.wristF ?? 0) + 6 * tap, head: (TYPE.angles.head ?? 0) + (Math.floor(tq * 0.8) % 2) * 2 } };
}

function monitor(c: C, env: PaintEnv, t: number) {
  const m = env.mood;
  const ink = env.fill('ink');
  const x0 = MON.x - MON.w / 2, y0 = DESK_Y - 14 - MON.h;
  c.fillStyle = ink;
  c.fillRect(MON.x - 4, DESK_Y - 16, 8, 16);
  c.fillRect(MON.x - 26, DESK_Y - 3, 52, 3);
  c.fillRect(x0 - 5, y0 - 5, MON.w + 10, MON.h + 10);
  // the screen: a grid of tiny thumbnails, a cursor box hopping from one to the next
  c.fillStyle = mixLab(m.set, m.halo, 0.3);
  c.fillRect(x0, y0, MON.w, MON.h);
  const cols = 10, rows = 6, pw = MON.w / cols, ph = MON.h / rows;
  for (let i = 0; i < cols * rows; i++) {
    const tone = 0.5 + 0.5 * hash1(i, 41);
    c.fillStyle = mixLab(mixLab(m.halo, m.core, 0.4), m.set, 0.15 + 0.5 * tone);
    c.fillRect(x0 + (i % cols) * pw + 1.2, y0 + Math.floor(i / cols) * ph + 1.2, pw - 2.4, ph - 2.4);
  }
  const cur = Math.floor(t * 1.6) % (cols * rows);
  c.strokeStyle = withAlpha(m.core, 0.9);
  c.lineWidth = 1.2;
  c.strokeRect(x0 + (cur % cols) * pw + 0.6, y0 + Math.floor(cur / cols) * ph + 0.6, pw - 1.2, ph - 1.2);
}

/** a paper block calendar on the desk; on 'nineteen' nineteen pages flip in a blur */
function calendar(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const x0 = CAL.x - CAL.w / 2, y0 = DESK_Y - CAL.h;
  const u = clamp01((t - b.years + 0.03) / 0.62);
  const page = Math.min(19, Math.floor(u * 19) + (u > 0 ? 1 : 0));
  const paper = mixLab(mixLab(m.setHaze, m.halo, 0.45), m.rim, 0.15);
  // the stand: a dark wedge with a dark edge round the pad
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.moveTo(x0 - 6, DESK_Y);
  c.lineTo(x0 + 2, y0 - 2);
  c.lineTo(x0 + CAL.w - 2, y0 - 2);
  c.lineTo(x0 + CAL.w + 6, DESK_Y);
  c.closePath();
  c.fill();
  c.fillStyle = paper;
  c.fillRect(x0 + 2, y0 + 6, CAL.w - 4, CAL.h - 12);
  c.strokeStyle = withAlpha(m.fg, 0.7);
  c.lineWidth = 1.5;
  c.strokeRect(x0 + 2, y0 + 6, CAL.w - 4, CAL.h - 12);
  // before the flip: a blank month grid (ruled squares, no text) so the pad reads as a calendar
  if (page === 0) {
    c.strokeStyle = withAlpha(m.fg, 0.35);
    c.lineWidth = 0.8;
    const gx = x0 + 7, gy = y0 + 17, gw = CAL.w - 14, gh = CAL.h - 28;
    for (let i = 0; i <= 7; i++) {
      c.beginPath();
      c.moveTo(gx + (gw * i) / 7, gy);
      c.lineTo(gx + (gw * i) / 7, gy + gh);
      c.stroke();
    }
    for (let j = 0; j <= 5; j++) {
      c.beginPath();
      c.moveTo(gx, gy + (gh * j) / 5);
      c.lineTo(gx + gw, gy + (gh * j) / 5);
      c.stroke();
    }
    c.fillStyle = withAlpha(m.fg, 0.4);
    c.fillRect(gx, y0 + 9, gw, 4);
  }
  // binder rings over the top edge
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 2.2;
  for (const rx of [x0 + CAL.w * 0.3, x0 + CAL.w * 0.7]) {
    c.beginPath();
    c.ellipse(rx, y0 + 6, 3.2, 6, 0, Math.PI * 0.95, Math.PI * 2.05);
    c.stroke();
  }
  // the numeral (only numerals: no other text)
  if (page > 0) {
    c.fillStyle = mixLab(m.ink, paper, 0.1);
    c.font = `600 38px ${FONT.display}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(page), CAL.x, y0 + 6 + (CAL.h - 12) / 2 + 2);
  }
  // pages flipping over the top (a blur of 2–3 leaves in flight while it runs)
  if (u > 0 && u < 1) {
    for (let k = 0; k < 3; k++) {
      const ph = (u * 19 + k / 3) % 1;
      const ang = ph * Math.PI;
      const h = (CAL.h - 10) * Math.cos(ang);
      c.fillStyle = withAlpha(mixLab(paper, m.fg, 0.2 + 0.5 * ph), 0.7);
      c.fillRect(x0, y0 + 4 - Math.max(0, -h), CAL.w, Math.abs(h));
    }
  }
}

// ================================================================================================= GLOBE
function globeAt(t: number, b: B): GlobeDraw {
  const u = sm((t - b.move0) / (b.move1 - b.move0));
  const litU = clamp01((t - b.lights0) / (b.people + 0.15 - b.lights0));
  // one by one (a few), then by the hundred
  // one by one (a window every ≈ 0.1 s), then by the hundred, the density riding the number ('fifty thousand')
  const lit = t < b.lights0 ? 0 : litU < 0.3 ? (1 + Math.floor(litU / 0.03)) / 760 : 0.016 + 0.84 * Math.pow((litU - 0.3) / 0.7, 1.35);
  return { x: lerp(G.x, G_END.x, u), y: lerp(G.y, G_END.y, u), R: lerp(G.R, G_END.R, u), rot: -0.06 * (t - b.crowd), lit: Math.min(0.9, lit), rim: 1, office: 1 };
}

function globeScene(f: Frame, t: number, b: B, office: HTMLCanvasElement | null) {
  f.camera({ x: 640, y: 360, z: 0, lens: 1 });
  const tq = tq12(t);
  const g0 = globeAt(t, b);
  // the zoom out: Z from "the window fills the frame" to 1 (exponential, eased)
  const Z0 = 1280 / WIN_W;
  // front-loaded in log-zoom (the office camera's own ease-back gives the soft start): the globe's limb and its
  // dark neighbouring windows are in frame by ≈ 0.2 s after 'crowd', the office one lit window on the curve
  const zl = office ? clamp01((t - b.pull0) / (b.pull1 - b.pull0)) : 1;
  const zu = 1 - Math.pow(1 - zl, 3);
  const Z = Math.exp(Math.log(Z0) * (1 - zu));
  const W = officeWindowAt(g0);
  // the fixed zoom centre P (window ↔ frame centre at Z0)
  const P = { x: (640 - W.x * Z0) / (1 - Z0), y: (360 - W.y * Z0) / (1 - Z0) };
  const zg: GlobeDraw = { ...g0, x: P.x + (g0.x - P.x) * Z, y: P.y + (g0.y - P.y) * Z, R: g0.R * Z };
  f.backlight({ sunX: zg.x - zg.R * 0.5, sunY: zg.y - zg.R * 0.4, sunRadius: 520, intensity: 0.75 });
  f.layer('L1', (c, env) => {
    const k = clamp01((zu - 0.6) / 0.4);
    if (k > 0) {
      c.globalAlpha = k;
      stars(c, { x: -100, y: -60, w: 1480, h: 840, count: 140, seed: 70, twinkle: 0.2 }, env);
      c.globalAlpha = 1;
    }
  });
  // L2: a far city skyline hazed into the dawn, between the globe and the near rooftops (one more depth plane)
  const sk = clamp01((zu - 0.55) / 0.45);
  if (sk > 0.01)
    f.layer('L2', (c, env) => {
      c.globalAlpha = sk;
      skyline(c, { style: 'bayArea', x0: -260, x1: 1560, y: 650, height: 150, seed: 2007, lit: 0.12, ground: 120 }, env);
      c.globalAlpha = 1;
    });
  f.fog({ yCenter: 0.75 * 720, height: 0.3 * 720, alpha: 0.12, drift: 4 });
  f.layer('L4', (c, env) => {
    // the desk-globe's cut-paper stand and meridian ring, the market awning at its base
    const gs = zg.R / G.R;
    const baseY = zg.y + zg.R * 1.27;
    if (zg.R < 900) {
      globeStand(c, zg, env);
      marketAwning(c, zg.x + 96 * gs, baseY + 2, 0.9 * gs, env);
    }
    paperGlobe(c, zg, env);
    if (zg.R < 900) meridianRing(c, zg, env);
    if (!office) {
      crowdVignettes(c, env, t, tq, b, zg);
      sparks(c, env, t, b, zg);
    }
  });
  f.rim({ x: -0.7, y: -0.6 });
  // a warm rim of dawn spilling round the globe's upper-left limb (the backlight's side)
  {
    const c = f.c;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const gx = zg.x - zg.R * 0.55, gy = zg.y - zg.R * 0.5;
    const gr = c.createRadialGradient(gx, gy, zg.R * 0.5, gx, gy, zg.R * 1.35);
    gr.addColorStop(0, withAlpha(f.mood.halo, 0));
    gr.addColorStop(0.62, withAlpha(mixLab(f.mood.halo, f.mood.core, 0.3), 0.16));
    gr.addColorStop(1, withAlpha(f.mood.halo, 0));
    c.fillStyle = gr;
    c.fillRect(gx - zg.R * 1.4, gy - zg.R * 1.4, zg.R * 2.8, zg.R * 2.8);
    c.restore();
  }
  // the office window: the office itself, shrinking into its frame
  if (office) {
    const ww = WIN_W * Z, hh = (WIN_W * Z * 9) / 16;
    const cx = P.x + (W.x - P.x) * Z, cy = P.y + (W.y - P.y) * Z;
    const c = f.c;
    c.save();
    c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
    c.beginPath();
    c.rect(cx - ww / 2, cy - hh / 2, ww, hh);
    c.clip();
    c.setTransform(1, 0, 0, 1, 0, 0);
    const s = f.pxScale;
    c.drawImage(office, (cx - ww / 2) * s, (cy - hh / 2) * s, ww * s, hh * s);
    c.restore();
    // the paper window frame round it (sash bars at the edges), and its glow on the globe
    c.save();
    c.setTransform(f.pxScale, 0, 0, f.pxScale, 0, 0);
    {
      // the one LIT window on the dark curve: its lamplight spills onto the paper round it
      c.save();
      c.globalCompositeOperation = 'lighter';
      const rr = Math.max(ww, hh) * 1.15;
      const gl = c.createRadialGradient(cx, cy, Math.min(ww, hh) * 0.4, cx, cy, rr);
      gl.addColorStop(0, withAlpha(f.mood.halo, 0.35));
      gl.addColorStop(1, withAlpha(f.mood.halo, 0));
      c.fillStyle = gl;
      c.fillRect(cx - rr, cy - rr, 2 * rr, 2 * rr);
      c.restore();
    }
    const bw = Math.max(1, ww * 0.04);
    c.strokeStyle = f.mood.ink;
    c.lineWidth = bw;
    c.strokeRect(cx - ww / 2 - bw / 2, cy - hh / 2 - bw / 2, ww + bw, hh + bw);
    c.restore();
    void compositeSub;
  }
  // the glow of lit windows lifts the frame a little as the crowd works
  if (g0.lit > 0.05) f.practical({ x: zg.x, y: zg.y, kind: 'lamp', seed: 2009, intensity: 0.25 * g0.lit, radius: zg.R * 0.9 });
  // the office window alone, a beat, before the others light: a small bright pulse round it
  if (!office) {
    const ow = officeWindowAt(zg);
    const k = 1 - win(t, b.lights0 + 0.2, b.lights0 + 1.1);
    if (k > 0.01) f.practical({ x: ow.x, y: ow.y, kind: 'lamp', seed: 2010, intensity: 0.55 * k, radius: 26 });
  }
  // haze across the lower third, then the near roofline (L5, blurred), risen into frame as we leave the office
  const hz = f.c.createLinearGradient(0, 470, 0, 720);
  hz.addColorStop(0, withAlpha(f.mood.setHaze, 0));
  hz.addColorStop(0.6, withAlpha(f.mood.setHaze, 0.22));
  hz.addColorStop(1, withAlpha(f.mood.setHaze, 0.3));
  f.c.fillStyle = hz;
  f.c.fillRect(0, 470, 1280, 250);
  roofline(f, zu);
}

/** three magnified windows: generic crowd workers at home desks clicking through thumbnail grids */
function crowdVignettes(c: C, env: PaintEnv, t: number, tq: number, b: B, g: GlobeDraw) {
  let vis = globeWindows(g).filter((w) => w.lit && w.z > 0.5);
  if (!vis.length) {
    const ow = officeWindowAt(g);
    vis = [{ x: ow.x, y: ow.y, z: ow.z, lit: true, i: -1 }];
  }
  // they open as the first windows light and hold ≈ 2.5 s, until the tiles snap onto the plate
  const out = win(t, b.imagenet + 0.1, b.imagenet + 0.5);
  VIGS.forEach((v0, k) => {
    const a = win(t, b.windows + 0.12 + 0.6 * v0.at, b.windows + 0.42 + 0.6 * v0.at) * (1 - out);
    if (a <= 0.01) return;
    const w = vis[(k * 37 + 11) % vis.length];
    const m = env.mood;
    const gs = g.R / G.R;
    const v = { ...v0, x: g.x + v0.x * gs * 1.08, y: g.y + v0.y * gs * 1.08, r: 1.3 * v0.r * Math.max(0.85, gs) };
    c.save();
    c.globalAlpha *= a;
    // the leader: a thin rim line from the window to the vignette
    c.strokeStyle = withAlpha(m.rim, 0.35);
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(w.x, w.y);
    c.lineTo(v.x + (w.x - v.x) * (v.r / Math.hypot(w.x - v.x, w.y - v.y)), v.y + (w.y - v.y) * (v.r / Math.hypot(w.x - v.x, w.y - v.y)));
    c.stroke();
    // the vignette: a round window, a lamp-lit room inside
    c.beginPath();
    c.arc(v.x, v.y, v.r, 0, Math.PI * 2);
    c.save();
    c.clip();
    const bg = c.createRadialGradient(v.x + v.r * 0.3, v.y - v.r * 0.1, 4, v.x, v.y, v.r * 1.2);
    bg.addColorStop(0, mixLab(m.halo, m.setHaze, 0.35));
    bg.addColorStop(1, mixLab(m.set, m.fg, 0.4));
    c.fillStyle = bg;
    c.fillRect(v.x - v.r, v.y - v.r, 2 * v.r, 2 * v.r);
    const s = 0.34 * 1.3 * (v.r / (1.3 * v0.r));
    const floorY = v.y + v.r * 0.72;
    const px = v.x - v.r * 0.42;
    const hand = v.p.anchor({ x: px, y: floorY, facing: 'right', pose: TYPE, scale: s }, 'handF');
    const deskY = hand.y + 3;
    c.fillStyle = env.fill('ink');
    c.fillRect(px + 10, deskY, v.r * 1.2, 3);
    c.fillRect(px + v.r * 1.05, deskY, 3, floorY - deskY);
    // the home screen: a tiny grid of thumbnails
    const sx = px + v.r * 0.72, sw = 30, sh = 21, sy = deskY - 5 - sh; // (the home screen keeps its size)
    c.fillRect(sx - 2, sy - 2, sw + 4, sh + 4);
    c.fillRect(sx + sw / 2 - 1.5, sy + sh, 3, 5);
    c.fillStyle = mixLab(m.halo, m.core, 0.4);
    for (let i = 0; i < 20; i++) c.fillRect(sx + (i % 5) * 6 + 0.8, sy + Math.floor(i / 5) * 5.2 + 0.8, 4.4, 3.6);
    c.strokeStyle = withAlpha(m.core, 0.95);
    c.lineWidth = 0.8;
    const cur = Math.floor(tq * 2 + k * 3) % 20;
    c.strokeRect(sx + (cur % 5) * 6 + 0.4, sy + Math.floor(cur / 5) * 5.2 + 0.4, 5.2, 4.4);
    v.p.draw(c, { x: px, y: floorY, facing: 'right', pose: clickLoop(tq + k * 0.3), scale: s }, env);
    glow(c, sx + sw / 2, sy + sh / 2, 26, m.halo, 0.35);
    c.restore();
    c.strokeStyle = env.fill('ink');
    c.lineWidth = 3;
    c.beginPath();
    c.arc(v.x, v.y, v.r, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = withAlpha(m.rim, 0.45);
    c.lineWidth = 1;
    c.beginPath();
    c.arc(v.x, v.y, v.r + 1.5, Math.PI * 1.05, Math.PI * 1.6);
    c.stroke();
    c.restore();
  });
}

/** the thumbnails leave the globe like sparks and settle on the plate (screen px == L4 world at home) */
function sparks(c: C, env: PaintEnv, t: number, b: B, g: GlobeDraw) {
  const s0 = b.l05end - 0.35, s1 = b.imagenet - 0.12;
  if (t < s0) return;
  const pa = win(t, b.move0 + 0.2, b.move1);
  if (pa <= 0.01) return;
  const snap = win(t, b.imagenet, b.imagenet + 0.36);
  const m = env.mood;
  // the plate
  // the plate sits back in the haze (≈ −10 L*): it must not punch a hole in the picture
  c.save();
  c.filter = 'brightness(0.84) sepia(0.25)';
  parchmentPlate(c, { x: PLATE.x, y: PLATE.y, w: PLATE.w, h: PLATE.h, seed: 73, ornament: false, alpha: pa }, env);
  c.restore();
  if (snap >= 1) {
    // the finished grid (cached), a shimmer across it on 'thousand … categories'
    const draw = gridBitmap(env);
    draw(c, GRID.x - 2, GRID.y - 2);
    const sh = win(t, b.thousand - 0.2, b.thousand + 1.6);
    if (sh > 0 && sh < 1) {
      const x = GRID.x - 80 + sh * (COLS * PITCH + 160);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const gr = c.createLinearGradient(x - 60, 0, x + 60, 0);
      gr.addColorStop(0, withAlpha(m.core, 0));
      gr.addColorStop(0.5, withAlpha(m.core, 0.22));
      gr.addColorStop(1, withAlpha(m.core, 0));
      c.fillStyle = gr;
      c.fillRect(GRID.x, GRID.y, COLS * PITCH, ROWS * PITCH);
      c.restore();
    }
    return;
  }
  const wins = globeWindows(g).filter((w) => w.lit);
  for (let i = 0; i < TILES.length; i++) {
    const T = TILES[i];
    const tl = lerp(s0, s1 - 0.35, T.launch);
    const fu = clamp01((t - tl) / 0.55);
    if (fu <= 0 && snap <= 0) continue;
    let x: number, y: number, a = 1;
    if (snap > 0) {
      x = lerp(fu > 0 ? T.sx : PLATE.x + PLATE.w / 2, T.gx, snap);
      y = lerp(fu > 0 ? T.sy : PLATE.y + PLATE.h / 2, T.gy, snap);
      a = fu > 0 ? 1 : snap;
    } else {
      // in flight from a lit window (an arc), shrinking to a tile as it lands
      const w = wins.length ? wins[T.win % wins.length] : { x: g.x, y: g.y };
      const e = sm(fu);
      x = lerp(w.x, T.sx, e);
      y = lerp(w.y, T.sy, e) - Math.sin(Math.PI * e) * 70;
    }
    tile(c, x, y, T.tone, T.shape, m, fu < 1 && snap <= 0 ? 0.6 + 0.4 * fu : 1, a);
  }
}

function tile(c: C, x: number, y: number, tone: number, shape: number, m: PaintEnv['mood'], s: number, a: number) {
  const sz = TILE * s;
  c.globalAlpha = a;
  c.fillStyle = mixLab(mixLab(PARCH.sky[3], m.halo, 0.25), PARCH.ink, 0.15 + 0.55 * tone);
  c.fillRect(x, y, sz, sz);
  c.globalAlpha = 1;
  void shape;
}

let GRID_KEY = '';
let gridDraw: ((c: C, x: number, y: number) => void) | null = null;
function gridBitmap(env: PaintEnv): (c: C, x: number, y: number) => void {
  const key = `${env.mood.id}/${env.pxScale}`;
  if (gridDraw && GRID_KEY === key) return gridDraw;
  const W = COLS * PITCH + 4, H = ROWS * PITCH + 4;
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(W * env.pxScale);
  cv.height = Math.ceil(H * env.pxScale);
  const g = cv.getContext('2d')!;
  g.scale(env.pxScale, env.pxScale);
  const m = env.mood;
  for (let i = 0; i < TILES.length; i++) {
    const T = TILES[i];
    const x = 2 + (i % COLS) * PITCH, y = 2 + Math.floor(i / COLS) * PITCH;
    const base = mixLab(mixLab(PARCH.sky[3], m.halo, 0.25), PARCH.ink, 0.15 + 0.55 * T.tone);
    g.fillStyle = base;
    g.fillRect(x, y, TILE, TILE);
    // a tiny paper-cut picture in each tile (an object silhouette: no two neighbours alike)
    g.fillStyle = withAlpha(PARCH.ink, 0.55);
    g.beginPath();
    if (T.shape === 0) g.arc(x + TILE / 2, y + TILE * 0.55, TILE * 0.28, 0, Math.PI * 2);
    else if (T.shape === 1) {
      g.moveTo(x + 1.5, y + TILE - 1.5);
      g.lineTo(x + TILE / 2, y + 1.8);
      g.lineTo(x + TILE - 1.5, y + TILE - 1.5);
    } else if (T.shape === 2) g.rect(x + 2, y + 3.5, TILE - 4, TILE - 5);
    else g.ellipse(x + TILE / 2, y + TILE * 0.6, TILE * 0.36, TILE * 0.2, 0, 0, Math.PI * 2);
    g.fill();
  }
  gridDraw = (c, x, y) => c.drawImage(cv, x, y, W, H);
  GRID_KEY = key;
  return gridDraw;
}

// ================================================================================================= TYPE
function type_(f: Frame, t: number, b: B) {
  const c = f.c;
  const tenv = { t, mood: f.mood, seed: 73 };
  if (t < b.crowd) {
    nameCard(c, { name: 'Fei-Fei Li', role: 'with Kai Li · Princeton', y: 584, at: b.name, dur: 4.2 }, tenv);
    placeStamp(c, { place: 'Princeton', date: '2007', style: 'mono', at: b.name, dur: b.crowd - b.name - 0.3 }, tenv);
  }
  // Li's own recollection, beside the colleagues (her words; never put in their mouths)
  const qa = win(t, b.li + 0.1, b.li + 0.6) * (1 - win(t, b.crowd - 0.1, b.crowd + 0.25));
  if (qa > 0.01) monoCard(c, { x: 330, y: 122, lines: ['…do something more useful', 'for my tenure…'], attrib: 'Fei-Fei Li, TED 2015', size: 22, alpha: qa, rise: qa, seed: 74 }, f.mood);
  // the one ImageNet label, pinned beneath the grid
  const la = win(t, b.imagenet + 0.3, b.imagenet + 0.8);
  if (la > 0.01) {
    c.save();
    c.globalAlpha = la;
    const cx = PLATE.x + PLATE.w / 2, y0 = PLATE.y + PLATE.h - 112;
    c.fillStyle = PARCH.ink;
    c.textAlign = 'center';
    c.font = `600 32px ${FONT.sc}`;
    (c as C & { letterSpacing: string }).letterSpacing = '3px';
    c.fillText('ImageNet', cx, y0 + 30);
    (c as C & { letterSpacing: string }).letterSpacing = '0px';
    c.fillStyle = withAlpha(PARCH.ink, 0.5);
    c.fillRect(cx - 40, y0 + 42, 80, 1);
    c.fillStyle = PARCH.ink;
    c.font = capFont(c, `italic 400 22px ${FONT.text}`);
    c.fillText('≈ 50,000 workers · 167 countries', cx, y0 + 70);
    c.fillText('contest: 1,000 categories', cx, y0 + 98);
    c.restore();
    brassPin(c, { mood: f.mood } as PaintEnv, cx, PLATE.y + 14, 0.9, 0, 4.5);
  }
}

/** draw into a scratch canvas with the same transform, then lay it in at alpha a (no seams) */
let SCRATCH: HTMLCanvasElement | null = null;
function withLayerAlpha(c: C, a: number, draw: (cc: C) => void) {
  if (a >= 0.999) {
    draw(c);
    return;
  }
  const W = c.canvas.width, H = c.canvas.height;
  if (!SCRATCH || SCRATCH.width !== W || SCRATCH.height !== H) {
    SCRATCH = document.createElement('canvas');
    SCRATCH.width = W;
    SCRATCH.height = H;
  }
  const g = SCRATCH.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, W, H);
  g.setTransform(c.getTransform());
  draw(g);
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = a;
  c.drawImage(SCRATCH, 0, 0);
  c.restore();
}

/** a near roofline (chimneys, a gable, a water tank), out of focus, rising into the frame's foot */
/** the axis tilt of the desk globe (radians, clockwise from vertical) */
const TILT = 0.27;
/** a turned paper stand under the globe: neck from the meridian ring's foot down to a stepped base */
function globeStand(c: C, g: GlobeDraw, env: PaintEnv) {
  const R = g.R;
  const ink = env.fill('ink');
  const top = g.y + R * 1.07;
  const foot = g.y + R * 1.27;
  c.save();
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(g.x - R * 0.025, top);
  c.lineTo(g.x + R * 0.025, top);
  c.bezierCurveTo(g.x + R * 0.02, top + R * 0.06, g.x + R * 0.09, top + R * 0.09, g.x + R * 0.06, foot - R * 0.06);
  c.lineTo(g.x + R * 0.26, foot - R * 0.02);
  c.lineTo(g.x + R * 0.27, foot);
  c.lineTo(g.x - R * 0.27, foot);
  c.lineTo(g.x - R * 0.26, foot - R * 0.02);
  c.lineTo(g.x - R * 0.06, foot - R * 0.06);
  c.bezierCurveTo(g.x - R * 0.09, top + R * 0.09, g.x - R * 0.02, top + R * 0.06, g.x - R * 0.025, top);
  c.closePath();
  c.fill();
  // the dawn catching the base's upper-left edge
  c.strokeStyle = withAlpha(env.mood.rim, 0.45);
  c.lineWidth = Math.max(0.8, R * 0.006);
  c.beginPath();
  c.moveTo(g.x - R * 0.26, foot - R * 0.02);
  c.lineTo(g.x - R * 0.06, foot - R * 0.06);
  c.stroke();
  c.restore();
}
/** the brass meridian half-ring (cut paper, in front of the globe on its night side) and its two axis pins */
function meridianRing(c: C, g: GlobeDraw, env: PaintEnv) {
  const R = g.R;
  const ink = env.fill('ink');
  const a0 = -Math.PI / 2 + TILT, a1 = Math.PI / 2 + TILT;
  const r0 = R * 1.035, r1 = R * 1.085;
  c.save();
  c.fillStyle = ink;
  c.beginPath();
  c.arc(g.x, g.y, r1, a0, a1);
  c.arc(g.x, g.y, r0, a1, a0, true);
  c.closePath();
  c.fill();
  // degree ticks cut into it, and a thin rim on its outer edge
  c.strokeStyle = withAlpha(env.mood.rim, 0.22);
  c.lineWidth = Math.max(0.6, R * 0.004);
  for (let k = 1; k < 18; k++) {
    const a = a0 + ((a1 - a0) * k) / 18;
    c.beginPath();
    c.moveTo(g.x + Math.cos(a) * (r1 - R * 0.012), g.y + Math.sin(a) * (r1 - R * 0.012));
    c.lineTo(g.x + Math.cos(a) * (r1 - R * 0.03), g.y + Math.sin(a) * (r1 - R * 0.03));
    c.stroke();
  }
  // the axis pins where the ring meets the poles
  for (const a of [a0, a1]) {
    const px = g.x + Math.cos(a) * R * 1.06, py = g.y + Math.sin(a) * R * 1.06;
    c.fillStyle = ink;
    c.beginPath();
    c.arc(px, py, R * 0.035, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(env.mood.rim, 0.5);
    c.beginPath();
    c.arc(px - R * 0.01, py - R * 0.01, R * 0.012, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

function roofline(f: Frame, zu: number) {
  const rise = sm((zu - 0.55) / 0.45);
  if (rise <= 0.01) return;
  const draw = f.cached(`${ID}/roofline/${f.mood.id}`, 1400, 200, (cc) => {
    cc.fillStyle = f.mood.fg;
    cc.beginPath();
    cc.moveTo(0, 200);
    const pts: [number, number][] = [[0, 120], [150, 120], [150, 96], [176, 96], [176, 120], [330, 118], [520, 120], [690, 124], [690, 102], [702, 102], [702, 124], [860, 128], [880, 126], [880, 74], [930, 74], [930, 60], [946, 60], [946, 126], [1120, 122], [1180, 96], [1240, 122], [1400, 118]];
    for (const [x, y] of pts) cc.lineTo(x, y + 40);
    cc.lineTo(1400, 200);
    cc.closePath();
    cc.fill();
    cc.strokeStyle = withAlpha(f.mood.rim, 0.4);
    cc.lineWidth = 2;
    cc.beginPath();
    pts.forEach(([x, y], i) => (i ? cc.lineTo(x, y + 40) : cc.moveTo(x, y + 40)));
    cc.stroke();
  }, { blur: 5 });
  draw(f.c, -60, 720 - 190 * rise + 30 * (1 - rise));
}
