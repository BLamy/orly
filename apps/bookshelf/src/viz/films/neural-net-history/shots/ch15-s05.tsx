/**
 * ch15-s05 — the labs, under the same light: a long shelf of identical oil lamps in the study, each with a luggage
 * tag 'as of October 2026'. The shot opens wide on the row (the study window's rose dusk at left, hazed bookcases
 * behind), trucks in to one lamp, then on to the next; at each stop the tag flips to a dated stamp and a small paper
 * vignette rises in the lamp's light. (candleAmber; the dusk only in the window; 38.9 s; in: cut.)
 *
 *   0 → 1.6     the wide: six identical lamps along the shelf ('The labs, under the same light')
 *   1.6 → 4.6   the truck in to the second lamp; 'Anthropic': its tag flips: FEB–SEP 2026
 *   'surveillance' a paper seal on the lamp's plinth: an eye over a crowd, barred      (the first limit; no text)
 *   'weapons'   beside it a second seal: an unmanned aircraft, barred                  (the second limit)
 *   'Pentagon'  a plain flat-roofed office block (a bare flagpole, no columns, no insignia) rises; its thread tugs
 *               at the seals; they hold
 *   'risk'      the thread is cut and drawn back with the building, away from the lamp (the designation)
 *   'courts'    two columned courthouses rise on paper stalks either side of the lamp, gavels falling opposite ways;
 *               each court's finding sets in beneath its own courthouse (same face, same size)
 *   b4 (wordless) the courthouses go down; a stack of books tied with string and an open ledger rise; the tag flips
 *               again: APPROVED JULY 2026; the settlement label above the stack
 *   'test'      the truck on to the next lamp; its tag flips: JULY 2026; a glass terrarium on a base with one pipe
 *               into a neighbouring paper building
 *   'lowered'   the valve wheel on the pipe turns a quarter turn open (safeguards deliberately lowered, for the test)
 *   'broke'     the valve's handle glints; the paper agents leave the case through the pipe; the building's windows
 *               light one by one; a small answer sheet inside is pulled toward the pipe
 *   OpenAI #2   the 'warning shot' card on the wall above the building (right third), on its own plate
 *   hold        music only; in the last second the camera tilts up and the Wall's lower edge enters
 * FAIRNESS: every lamp is the same lamp in the same light; every vignette is built to one bounding height (~90 L4
 * units: seals, office block, courthouses, books, terrarium, building); the type is one face and one size at both stops.
 */
import { Timeline } from '../../../core';
import type { Camera3, LayerSpec, PaintEnv } from '../../../film';
import { LAYERS, PUPPET_NEAR_BLACK, defineShot, mixLab, oilLamp, overscan, quoteCard, toLayer, toScreen, withAlpha } from '../../../film';
import { hash1 } from '../../../film/core/frame';
import { FONT, softPlate } from '../../../film/silhouette/type';
import { bookshelfWall } from '../../../film/silhouette/architecture';
import { STUDY, studyRoom } from '../sets/study';
import { monotone } from '../sets/ch02-s05b-util';
import { clamp01, lerp, pulse, screen, sm, tq12, win } from '../sets/ch15-s01-kit';
import { TAG_W, lampTag } from '../sets/ch15-s05-tag';

const ID = 'ch15-s05';
type C = CanvasRenderingContext2D;

// ===================================================================================================== staging (L4)
const SHELF_Y = 560;
const PLINTH = { w: 170, h: 64 };
const PITCH = 480;
const SHELF_START = STUDY.window.x + STUDY.window.w + 34;
const LAMPS = Array.from({ length: 6 }, (_, i) => SHELF_START + 110 + i * PITCH);
const ANT = 1; // the Anthropic lamp
const OAI = 2; // the OpenAI lamp
const AX = LAMPS[ANT];
const OX = LAMPS[OAI];
const LAMP_S = 1.95;
const BASE_Y = SHELF_Y - PLINTH.h;
const FLAME = oilLamp.anchors({ x: 0, y: BASE_Y, s: LAMP_S }).flame;
/** the two seals on the Anthropic lamp's plinth face (r in L4 units) */
const SEAL = { y: BASE_Y + PLINTH.h / 2, dx: 44, r: 30 };
/** the one vignette height (L4 units) every lab's paper pieces are built to */
const VH = 90;
/** world text: one face, one size, both stops (≥ 22 px cap at the stop framing) */
const TXT = { size: 18.5, lh: 24 };
/** tag hang point (shelf's front edge) */
const TAG_Y = SHELF_Y + 14;

interface B {
  D: number;
  ant: number;
  eye: number;
  drone: number;
  pent: number;
  risk: number;
  courts: number;
  courtsOut: number;
  booksIn: number;
  books: number;
  test: number;
  lowered: number;
  broke: number;
  warn: number;
  tilt: number;
}
interface Scene {
  tl: Timeline;
  b: B;
  cam: (t: number) => Camera3;
  CAMS: Camera3[];
  OCC: number[];
  [k: string]: unknown;
}

function frameOnLayer(L: Pick<LayerSpec, 'z'>, p: { x: number; y: number }, s: { x: number; y: number }, k: number): Camera3 {
  const z = L.z - L.z / k;
  const sa = (1000 * k) / L.z;
  return { x: 640 + (640 + (p.x - 640) * k - s.x) / sa, y: 360 + (360 + (p.y - 360) * k - s.y) / sa, z, lens: 1 };
}

export default defineShot<Scene>({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      ant: T.beat('b2'),
      eye: T.beat('sealEye'),
      drone: T.beat('sealDrone'),
      pent: T.beat('b2b'),
      risk: T.beat('risk'),
      courts: T.beat('b3'),
      courtsOut: T.beat('b4') - 0.75,
      booksIn: T.beat('b4') - 0.35,
      books: T.beat('b4'),
      test: T.beat('b5'),
      lowered: T.beat('b5b'),
      broke: T.beat('b7'),
      warn: T.beat('b6'),
      tilt: D - 1.05,
    };
    // P: world (x, shelf) at screen (640, sy), L4 scale k
    const P = (x: number, k: number, sy = 455) => frameOnLayer(LAYERS.L4, { x, y: SHELF_Y }, { x: 640, y: sy }, k);
    const STOP = 1.7;
    const keys: [number, Camera3][] = [
      // the wide on the row of identical lamps (the window's dusk at left), a slow drift
      [0, P(LAMPS[2] - 170, 0.55, 470)],
      [1.6, P(LAMPS[2] - 120, 0.6, 468)],
      // the truck in to the Anthropic lamp, settling just after its name
      [b.ant + 1.5, P(AX + 30, STOP)],
      [b.pent - 0.2, P(AX + 50, STOP)],
      [b.risk + 0.5, P(AX + 64, STOP)],
      [b.courts - 0.3, P(AX + 4, STOP * 0.98)],
      [b.courtsOut, P(AX + 4, STOP * 0.98)],
      [b.books + 0.6, P(AX + 104, STOP)],
      [b.books + 1.9, P(AX + 110, STOP)],
      // on to the next lamp (pulled back a little in passing)
      [(b.books + 1.9 + b.test + 0.9) / 2, P((AX + OX) / 2 + 140, 1.32, 462)],
      [b.test + 0.9, P(OX + 168, STOP)],
      [b.warn, P(OX + 172, STOP * 1.01)],
      [b.tilt, P(OX + 176, STOP * 1.012)],
      // the tilt up toward the Wall: the picture slides down 64 px (the Wall's lower edge enters at the top)
      [D, P(OX + 176, STOP * 1.012, 519)],
    ];
    const ch = (sel: (c: Camera3) => number) => monotone(keys.map(([t, c]) => [t, sel(c)] as [number, number]));
    const fx = ch((c) => c.x), fy = ch((c) => c.y), fz = ch((c) => c.z);
    const cam = (t: number): Camera3 => ({ x: fx(t), y: fy(t), z: fz(t), lens: 1 });
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 60; i++) CAMS.push(cam((D * i) / 60));
    // the L5 near occluders (blurred book-ends on the desk edge), placed where they slide across the frame during
    // the two trucks and sit at the frame's edges at the stops
    const OCC = [
      toLayer(LAYERS.L5, cam(b.ant + 1.5), -30, 0).x,
      toLayer(LAYERS.L5, cam((b.books + 1.9 + b.test + 0.9) / 2), 640, 0).x,
    ];
    tl.hold(0, D);
    return { tl, b, cam, CAMS, OCC };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    const cam = sc.cam(t);
    f.camera(cam);
    // STUDY LOCK: the study's own wall and its one window (the dusk enters only there)
    studyRoom(f, { key: ID, cams: sc.CAMS, outside: { mood: 'duskRose', kind: 'dusk' }, fog: 0.9 });

    // L3: the far plane: tall hazed bookcases along the study wall behind the shelf (they slide against the lamps)
    f.layer('L3', (c, env) => {
      const r = overscan(LAYERS.L3, sc.CAMS, 60);
      const key = `${ID}/L3/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;
      f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
        cc.translate(-r.x, -r.y);
        // bookcases between the lamps' places, standing on a low dado; the window's bay is left clear
        for (let k = 0; k < 9; k++) {
          const x = SHELF_START + 40 + k * 430 + 40 * hash1(k, 2);
          if (x > r.x + r.w) break;
          bookshelfWall(cc, { x, y: -420, w: 300, h: 1000, bays: 2, seed: 70 + k, gaps: 0.2, objects: k % 2 === 0, backTone: 0.35 }, env);
        }
        // the lamplight's haze over the far cases: they stay a quiet texture behind the paper vignettes
        cc.fillStyle = withAlpha(mixLab(env.mood.set, env.mood.haze, 0.5), 0.5);
        cc.fillRect(r.x, r.y, r.w, r.h);
      })(c, r.x, r.y);
    });
    f.fog({ yCenter: toScreen(LAYERS.L4, cam, 0, BASE_Y - 140).y, height: 260, alpha: 0.14, drift: 5 });

    f.layer('L4', (c, env) => {
      const m = env.mood;
      // the Wall's lower edge, high above the OpenAI lamp, only for the closing tilt (off-frame until then)
      if (t > b.test + 1.5) wallEdge(c, env);
      // the shelf: a long plank with a moulded apron and brackets, rim-lit on its top edge
      const r = overscan(LAYERS.L4, sc.CAMS, 40);
      const x0 = SHELF_START, x1 = r.x + r.w;
      c.fillStyle = env.fill('ink');
      c.fillRect(x0, SHELF_Y, x1 - x0, 18);
      c.fillStyle = mixLab(m.fg, m.ink, 0.4);
      c.fillRect(x0, SHELF_Y + 18, x1 - x0, 10);
      for (let bx = x0 + 80; bx < x1; bx += 330) {
        c.beginPath();
        c.moveTo(bx - 8, SHELF_Y + 28);
        c.lineTo(bx + 8, SHELF_Y + 28);
        c.lineTo(bx + 2, SHELF_Y + 96);
        c.closePath();
        c.fill();
      }
      c.fillStyle = withAlpha(m.rim, 0.4);
      c.fillRect(x0, SHELF_Y - 0.6, x1 - x0, 1.2);
      // vignettes that rise from behind the plank
      anthropicBack(c, env, t, b);
      openaiBack(c, env, t, b);
      // the lamps on their plinths, identical
      for (let i = 0; i < LAMPS.length; i++) {
        const x = LAMPS[i];
        const s = toScreen(LAYERS.L4, cam, x, 400);
        if (s.x < -300 || s.x > 1580) continue;
        c.fillStyle = PUPPET_NEAR_BLACK;
        c.fillRect(x - PLINTH.w / 2, BASE_Y, PLINTH.w, PLINTH.h);
        c.fillStyle = withAlpha(m.rim, 0.3);
        c.fillRect(x - PLINTH.w / 2, BASE_Y, PLINTH.w, 1);
        oilLamp(c, { x, y: BASE_Y, s: LAMP_S, lit: true, seed: 40 + i }, env);
      }
      anthropicFront(c, env, t, b);
      openaiFront(c, env, t, b);
      // the luggage tags, hanging from the shelf's front edge under each lamp
      for (let i = 0; i < LAMPS.length; i++) {
        const x = LAMPS[i];
        let front = 'as of|October 2026', back = 'as of|October 2026', flip = 0;
        if (i === ANT) {
          const u1 = sm(clamp01((tq12(t) - b.ant) / 0.5));
          const u2 = sm(clamp01((tq12(t) - (b.books - 0.2)) / 0.5));
          if (t < b.books - 0.2) {
            back = 'FEB–SEP 2026';
            flip = u1;
          } else {
            front = 'APPROVED|JULY 2026';
            back = 'FEB–SEP 2026';
            flip = 1 - u2;
          }
        } else if (i === OAI) {
          back = 'JULY 2026';
          flip = sm(clamp01((tq12(t) - b.test) / 0.5));
        }
        const sw = 0.04 * Math.sin(t * 0.9 + i * 1.7) + (flip > 0 && flip < 1 ? 0.06 * Math.sin(flip * Math.PI) : 0);
        lampTag(c, { x: x + 34, y: TAG_Y, w: TAG_W, front, back, flip, swing: sw, light: 0.95, size: 19 }, env);
      }
      // world labels (one face, one size): the two courts beneath their courthouses; the settlement above the books
      courtLabels(c, env, t, b);
      settlementLabel(c, env, t, b);
    });
    f.rim({ x: 0, y: -1 });
    // every lamp's flame: the same light (only the ones on screen)
    for (let i = 0; i < LAMPS.length; i++) {
      const s = toScreen(LAYERS.L4, cam, LAMPS[i], 400);
      if (s.x < -300 || s.x > 1580) continue;
      f.practical({ x: LAMPS[i] + FLAME.x, y: FLAME.y + 4, kind: 'candle', seed: 520 + i * 11, intensity: 0.85, radius: 64 });
    }
    // a low haze band at the shelf (fog B, in front of the action plane's foot)
    f.fog({ yCenter: toScreen(LAYERS.L4, cam, 0, SHELF_Y + 60).y, height: 150, alpha: 0.12, drift: 8 });

    // L5: the near desk edge and blurred book-ends standing on it, sliding past during the trucks
    f.layer('L5', (c, env) => {
      const r = overscan(LAYERS.L5, sc.CAMS, 40);
      const deskY = toLayer(LAYERS.L5, cam, 0, 706).y;
      const topY = toLayer(LAYERS.L5, cam, 0, 600).y;
      c.fillStyle = env.fill('fg');
      c.fillRect(r.x, deskY, r.w, r.y + r.h - deskY + 40);
      c.fillStyle = withAlpha(env.mood.rim, 0.16);
      c.fillRect(r.x, deskY, r.w, 1.5);
      c.fillStyle = PUPPET_NEAR_BLACK;
      sc.OCC.forEach((ox, i) => bookEnd(c, ox, deskY, deskY - topY, i));
    });

    screen(f, (c) => {
      const te = { t, mood: f.mood };
      // the 'warning shot' card on the clear wall above the building (right third), on its own plate
      const qa = clamp01((t - (b.warn - 0.1)) / 0.5);
      if (qa > 0) softPlate(c, 880, 150, 600, 250, PUPPET_NEAR_BLACK, 0.62 * qa);
      quoteCard(c, { quote: "…a 'warning shot' for us and for the world", speaker: 'OpenAI', source: 'August 2026', x: 880, y: 150, width: 400, size: 31, at: b.warn - 0.1, stagger: 0.3, plate: false }, te);
    });
  },
});

// ===================================================================================================== pieces
const paperCol = (env: PaintEnv) => mixLab(mixLab('#e3d2ad', env.mood.halo, 0.25), env.mood.set, 0.15);
const vigInk = (env: PaintEnv) => mixLab(env.fill('ink'), env.mood.haze, 0.12);
/** rise from behind the shelf plank: u 0..1 → y offset */
const rise = (u: number, h: number) => (1 - sm(u)) * (h + 14);

/** a blurred book-end on the desk edge (L5): a tall dark slab with a curled top (local x, desk y, height) */
function bookEnd(c: C, x: number, deskY: number, h: number, i: number) {
  const w = 70 + 16 * hash1(i, 3);
  c.beginPath();
  c.moveTo(x - w / 2, deskY + 2);
  c.lineTo(x - w / 2, deskY - h * 0.72);
  c.quadraticCurveTo(x - w / 2, deskY - h, x - w / 2 + w * 0.42, deskY - h);
  c.quadraticCurveTo(x + w / 2, deskY - h, x + w / 2, deskY - h * 0.66);
  c.lineTo(x + w / 2, deskY + 2);
  c.closePath();
  c.fill();
  // the books it holds, leaning (two spines)
  c.fillRect(x + w / 2 + 2, deskY - h * 0.5, 26, h * 0.5 + 2);
  c.save();
  c.translate(x + w / 2 + 30, deskY);
  c.rotate(0.12);
  c.fillRect(0, -h * 0.46, 24, h * 0.46);
  c.restore();
}

/** the Wall of Forecasts' lower edge above the OpenAI lamp: the frame's bottom rail and the tails of pinned slips */
function wallEdge(c: C, env: PaintEnv) {
  const m = env.mood;
  const y = SHELF_Y - 290;
  const x0 = OX - 420, x1 = OX + 720;
  c.fillStyle = mixLab(env.fill('ink'), m.set, 0.2);
  for (let k = 0; k < 9; k++) {
    const sx = x0 + 60 + k * 128 + 18 * hash1(k, 4);
    const sh = 34 + 16 * (0.5 + 0.5 * hash1(k, 5));
    c.fillStyle = mixLab(paperCol(env), m.set, 0.35);
    c.save();
    c.translate(sx, y - 8);
    c.rotate(0.03 * hash1(k, 6));
    c.fillRect(-36, -sh, 72, sh);
    c.restore();
  }
  c.fillStyle = env.fill('ink');
  c.fillRect(x0, y - 8, x1 - x0, 12);
  c.fillStyle = withAlpha(m.rim, 0.3);
  c.fillRect(x0, y - 8, x1 - x0, 1);
}

/** a plain government office block: flat roof with a parapet, rows of windows, a door, a bare flagpole (no flag,
 *  no columns, no insignia). (x, base) = the centre of its foot. */
function officeBlock(c: C, x: number, base: number, env: PaintEnv) {
  const m = env.mood;
  const ink = vigInk(env);
  const w = 100, h = VH - 16;
  c.fillStyle = ink;
  c.fillRect(x - w / 2, base - h, w, h);
  c.fillRect(x - w / 2 - 4, base - h - 6, w + 8, 6); // the parapet
  c.fillRect(x - w / 2 - 6, base - 4, w + 12, 4); // the plinth course
  // the bare flagpole on the roof
  c.fillRect(x + w / 2 - 16, base - h - 6 - 22, 2.2, 22);
  c.beginPath();
  c.arc(x + w / 2 - 15, base - h - 29, 2.2, 0, Math.PI * 2);
  c.fill();
  // windows: four rows of five, dim
  c.fillStyle = withAlpha(m.rim, 0.22);
  for (let row = 0; row < 4; row++) for (let col = 0; col < 5; col++) c.fillRect(x - w / 2 + 9 + col * 18.5, base - h + 9 + row * 14, 9, 8);
  // the door
  c.fillStyle = withAlpha(m.rim, 0.3);
  c.fillRect(x - 6, base - 15, 12, 11);
  c.fillStyle = withAlpha(m.rim, 0.45);
  c.fillRect(x - w / 2 - 4, base - h - 6, w + 8, 1);
}

/** a small columned courthouse (x, base = foot centre) */
function courthouse(c: C, x: number, base: number, env: PaintEnv) {
  const m = env.mood;
  const ink = vigInk(env);
  const w = 92, h = 54;
  c.fillStyle = ink;
  for (let k = 0; k < 2; k++) c.fillRect(x - w / 2 - 8 + k * 4, base - 4 * (k + 1), w + 16 - k * 8, 4);
  c.fillRect(x - w / 2, base - 8 - h, w, h);
  c.fillRect(x - w / 2 - 6, base - 8 - h - 8, w + 12, 8);
  c.beginPath();
  c.moveTo(x - w / 2 - 8, base - 8 - h - 7);
  c.lineTo(x, base - 8 - h - 30);
  c.lineTo(x + w / 2 + 8, base - 8 - h - 7);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(m.rim, 0.36);
  for (let k = 0; k < 5; k++) c.fillRect(x - w / 2 + 10 + k * ((w - 20) / 4) - 1.5, base - 8 - h + 6, 3, h - 10);
  c.fillStyle = withAlpha(m.rim, 0.45);
  c.fillRect(x - w / 2 - 6, base - 8 - h - 8, w + 12, 1);
}
function gavel(c: C, x: number, y: number, ang: number, ink: string) {
  c.save();
  c.translate(x, y);
  c.rotate(ang);
  c.fillStyle = ink;
  c.fillRect(-2.2, -46, 4.4, 46);
  c.fillRect(-14, -58, 28, 13);
  c.restore();
}

function seal(c: C, env: PaintEnv, x: number, y: number, kind: 'eye' | 'drone', a: number, rot: number) {
  if (a <= 0.01) return;
  const r = SEAL.r;
  const ink = '#241a12';
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y + (1 - a) * 10);
  c.rotate(rot);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.4);
  c.beginPath();
  c.arc(2, 3, r, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = paperCol(env);
  c.beginPath();
  for (let k = 0; k < 24; k++) {
    const ang = (k / 24) * Math.PI * 2;
    const rr = r + (k % 2 ? 2.4 : 0);
    if (k === 0) c.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
    else c.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
  }
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(ink, 0.35);
  c.lineWidth = 1;
  c.beginPath();
  c.arc(0, 0, r - 4, 0, Math.PI * 2);
  c.stroke();
  c.scale(r / 16, r / 16);
  c.fillStyle = ink;
  c.strokeStyle = ink;
  if (kind === 'eye') {
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-9, -5);
    c.quadraticCurveTo(0, -13, 9, -5);
    c.quadraticCurveTo(0, 3, -9, -5);
    c.stroke();
    c.beginPath();
    c.arc(0, -5, 2.6, 0, Math.PI * 2);
    c.fill();
    for (let k = -2; k <= 2; k++) {
      c.beginPath();
      c.arc(k * 4.4, 5.5, 1.8, 0, Math.PI * 2);
      c.fill();
      c.fillRect(k * 4.4 - 2, 7, 4, 3.5);
    }
  } else {
    c.beginPath();
    c.moveTo(-11, 0);
    c.quadraticCurveTo(-11, -5, -5, -4.5);
    c.lineTo(8, -1.6);
    c.lineTo(8, 1.4);
    c.lineTo(-5, 2.6);
    c.quadraticCurveTo(-11, 3, -11, 0);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(4, -1.4);
    c.lineTo(9.5, -8);
    c.lineTo(11, -8);
    c.lineTo(8, -1);
    c.closePath();
    c.fill();
    c.fillRect(-3, 1, 9, 1.8);
    c.fillRect(9.2, -4, 1.4, 8);
  }
  c.strokeStyle = withAlpha('#5a1e14', 0.88);
  c.lineWidth = 2.6;
  c.beginPath();
  c.moveTo(-12, 12);
  c.lineTo(12, -12);
  c.stroke();
  c.restore();
}

/** world text block (one face, one size for every label in the shot), on a soft plate */
function worldText(c: C, env: PaintEnv, lines: string[], x: number, y: number, a: number) {
  if (a <= 0.003) return;
  c.save();
  c.font = `500 ${TXT.size}px ${FONT.mono}`;
  (c as C & { letterSpacing: string }).letterSpacing = '0.6px';
  const w = Math.max(...lines.map((l) => c.measureText(l).width));
  const h = lines.length * TXT.lh;
  softPlate(c, x, y + h / 2 - TXT.size * 0.8, w + 90, h + 60, PUPPET_NEAR_BLACK, 0.6 * a);
  c.globalAlpha *= a;
  c.fillStyle = mixLab(env.mood.core, '#ffffff', 0.3);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  lines.forEach((l, i) => c.fillText(l, x, y + i * TXT.lh));
  c.restore();
}

// ===================================================================================================== Anthropic stop
const COURT = { dx: 238, base: SHELF_Y - 150 };
const BOOKS = { dx: 222 };
function courtsUp(t: number, b: B) {
  const tq = tq12(t);
  return clamp01((tq - b.courts + 0.1) / 0.6) * (1 - clamp01((tq - b.courtsOut) / 0.6));
}
function courtLabels(c: C, env: PaintEnv, t: number, b: B) {
  const a = win(t, b.courts + 0.45, b.courts + 0.95) * (1 - win(t, b.courtsOut - 0.35, b.courtsOut + 0.05));
  worldText(c, env, ['AUG: UNLAWFUL', 'RETALIATION', '(N.D. CAL.)'], AX - COURT.dx, COURT.base + 26, a);
  worldText(c, env, ['SEP: UPHELD 2–1', '(D.C. CIR.)'], AX + COURT.dx, COURT.base + 26, win(t, b.courts + 0.75, b.courts + 1.25) * (1 - win(t, b.courtsOut - 0.35, b.courtsOut + 0.05)));
}
function settlementLabel(c: C, env: PaintEnv, t: number, b: B) {
  const a = win(t, b.books + 0.1, b.books + 0.6) * (1 - win(t, b.test - 0.45, b.test + 0.05));
  worldText(c, env, ['$1.5B SETTLEMENT', 'PIRATED BOOKS'], AX + BOOKS.dx + 4, SHELF_Y - VH - 74, a);
}

function anthropicBack(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const ink = vigInk(env);
  const tq = tq12(t);
  c.save();
  c.beginPath();
  c.rect(AX - 420, 0, 840, SHELF_Y);
  c.clip();
  // the government office block: up on 'Pentagon', back and down after 'risk'
  const up = clamp01((tq - b.pent + 0.1) / 0.6);
  const away = sm(clamp01((tq - b.risk - 0.25) / 0.9));
  if (up > 0 && away < 1) officeBlock(c, AX + 214 + away * 110, SHELF_Y + rise(up, VH) + away * 140, env);
  // the two courthouses on paper stalks either side of the lamp, gavels falling opposite ways
  const cu = courtsUp(t, b);
  if (cu > 0) {
    const off = rise(cu, SHELF_Y - COURT.base + VH);
    for (const sx of [-1, 1]) {
      const x = AX + sx * COURT.dx;
      const base = COURT.base + off;
      c.fillStyle = ink;
      c.fillRect(x - 2, base, 4, SHELF_Y - base);
      courthouse(c, x, base, env);
      const g = sm(clamp01((tq - b.courts - (sx < 0 ? 0.55 : 1.05)) / 0.25));
      gavel(c, x + sx * 64, base - 66, sx * (0.2 + 1.1 * g), ink);
    }
  }
  // the books: a stack tied with string, an open ledger on top (VH tall)
  const bu = clamp01((tq - b.booksIn) / 0.8);
  if (bu > 0) {
    const off = rise(bu, VH + 12);
    const bx = AX + BOOKS.dx;
    let y = SHELF_Y + off;
    for (let k = 0; k < 7; k++) {
      const h = 10 + 2.6 * (0.5 + 0.5 * hash1(k, 3));
      const w = 84 + 14 * hash1(k, 4);
      const dx = 5 * hash1(k, 5);
      c.fillStyle = k % 2 ? ink : mixLab(ink, m.set, 0.25);
      c.fillRect(bx - w / 2 + dx, y - h, w, h);
      c.fillStyle = withAlpha(m.rim, 0.25);
      c.fillRect(bx - w / 2 + dx, y - h, w, 1);
      y -= h;
    }
    c.strokeStyle = withAlpha(paperCol(env), 0.7);
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(bx + 6, SHELF_Y + off);
    c.lineTo(bx + 6, y);
    c.moveTo(bx - 46, y + 18);
    c.lineTo(bx + 50, y + 18);
    c.stroke();
    c.fillStyle = paperCol(env);
    c.beginPath();
    c.moveTo(bx - 50, y - 2);
    c.quadraticCurveTo(bx - 24, y - 14, bx, y - 4);
    c.quadraticCurveTo(bx + 24, y - 14, bx + 50, y - 2);
    c.lineTo(bx + 50, y + 1);
    c.lineTo(bx - 50, y + 1);
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha('#3a2a1a', 0.5);
    c.lineWidth = 0.9;
    for (let k = 0; k < 3; k++) {
      c.beginPath();
      c.moveTo(bx - 44, y - 4 - k * 2.6);
      c.lineTo(bx - 8, y - 6 - k * 2.6);
      c.moveTo(bx + 8, y - 6 - k * 2.6);
      c.lineTo(bx + 44, y - 4 - k * 2.6);
      c.stroke();
    }
  }
  c.restore();
}

function anthropicFront(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const tq = tq12(t);
  const tug = tq > b.pent + 0.5 && tq < b.risk ? Math.sin((tq - b.pent) * 9) * 0.06 * (0.5 + 0.5 * Math.sin((tq - b.pent) * 1.3)) : 0;
  const ea = win(t, b.eye - 0.1, b.eye + 0.3);
  const da = win(t, b.drone - 0.1, b.drone + 0.3);
  const s1 = { x: AX - SEAL.dx, y: SEAL.y };
  const s2 = { x: AX + SEAL.dx, y: SEAL.y };
  const up = clamp01((tq - b.pent - 0.4) / 0.5);
  const cut = clamp01((tq - b.risk) / 0.7);
  if (up > 0 && cut < 1) {
    const anchor = { x: AX + 166 + sm(cut) * 110, y: SHELF_Y - 40 + sm(cut) * 60 };
    c.strokeStyle = withAlpha(paperCol(env), 0.85);
    c.lineWidth = 1.5;
    const mid = { x: (anchor.x + s2.x) / 2 + 10, y: SHELF_Y - 8 };
    for (const s of [s1, s2]) {
      c.beginPath();
      if (cut <= 0) {
        c.moveTo(anchor.x, anchor.y);
        c.quadraticCurveTo(mid.x, mid.y + Math.abs(tug) * 30, s.x + 14, s.y - 14 + tug * 30);
      } else {
        const u = sm(cut);
        c.moveTo(anchor.x, anchor.y);
        c.lineTo(lerp(mid.x, anchor.x, u), lerp(mid.y + 10, anchor.y, u));
        c.moveTo(s.x + 14, s.y - 14);
        c.lineTo(s.x + 22, s.y - 16 + u * 4);
      }
      c.stroke();
    }
    const sn = pulse(t, b.risk - 0.05, 0.08, 0.4);
    if (sn > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = withAlpha(m.core, 0.7 * sn);
      c.beginPath();
      c.arc(mid.x, mid.y + 8, 5, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }
  }
  seal(c, env, s1.x, s1.y, 'eye', ea, tug * 0.8);
  seal(c, env, s2.x, s2.y, 'drone', da, -tug);
}

// ===================================================================================================== OpenAI stop
const TERR = { x: OX + 168, w: 112, h: 52, dome: 22, base: 10 };
const BLD = { x: OX + 352, w: 84, h: VH };
const PIPE_Y = SHELF_Y - TERR.base - 18;
const VALVE = { x: OX + 268, r: 11 };
function openaiUp(t: number, b: B) {
  return clamp01((tq12(t) - b.test + 0.05) / 0.6);
}
/** agent k's departure progress (0 inside … 1 arrived); all hold in the case until 'broke' */
function agentGo(t: number, b: B, k: number) {
  return clamp01((tq12(t) - (b.broke - 0.12) - k * 0.34) / 1.3);
}
function openaiBack(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const ink = vigInk(env);
  const tq = tq12(t);
  const up = openaiUp(t, b);
  if (up <= 0) return;
  c.save();
  c.beginPath();
  c.rect(OX - 120, 0, 640, SHELF_Y);
  c.clip();
  // the neighbouring paper building, its windows lighting one by one after 'broke'
  const by = SHELF_Y + rise(up, BLD.h);
  c.fillStyle = ink;
  c.fillRect(BLD.x - BLD.w / 2, by - BLD.h, BLD.w, BLD.h);
  c.fillRect(BLD.x - BLD.w / 2 - 4, by - BLD.h - 6, BLD.w + 8, 6);
  for (let k = 0; k < 12; k++) {
    const col = k % 3, row = Math.floor(k / 3);
    const wx = BLD.x - BLD.w / 2 + 12 + col * 22, wy = by - BLD.h + 12 + row * 19;
    const on = sm(clamp01((tq - b.broke - 0.3 - k * 0.16) / 0.12));
    c.fillStyle = on > 0 ? mixLab(mixLab(m.set, m.fg, 0.2), m.core, 0.75 * on) : mixLab(m.set, m.fg, 0.2);
    c.fillRect(wx, wy, 14, 12);
  }
  // the answer sheet inside (seen through the lowest window), pulled toward the pipe
  const pull = sm(clamp01((tq - b.broke - 1.2) / 1.6));
  if (tq > b.broke + 0.6) {
    c.fillStyle = paperCol(env);
    c.fillRect(BLD.x - 4 - pull * 28, by - 26, 16, 20);
    c.strokeStyle = withAlpha('#3a2a1a', 0.6);
    c.lineWidth = 0.7;
    for (let k = 0; k < 4; k++) {
      c.beginPath();
      c.moveTo(BLD.x - 1 - pull * 28, by - 22 + k * 4);
      c.lineTo(BLD.x + 9 - pull * 28, by - 22 + k * 4);
      c.stroke();
    }
  }
  c.restore();
}

/** a small paper agent: a cut-out figure (round head, a trapezoid body, little arms), ~17 units tall */
function agent(c: C, env: PaintEnv, x: number, y: number, step: number) {
  const col = paperCol(env);
  c.fillStyle = col;
  c.beginPath();
  c.arc(x, y - 13.5, 3.6, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.moveTo(x - 3.2, y - 9.5);
  c.lineTo(x + 3.2, y - 9.5);
  c.lineTo(x + 4.6, y - 3);
  c.lineTo(x - 4.6, y - 3);
  c.closePath();
  c.fill();
  const sw = step ? 2 : -2;
  c.fillRect(x - 3.4 + sw * 0.4, y - 3, 2, 3);
  c.fillRect(x + 1.4 - sw * 0.4, y - 3, 2, 3);
  c.save();
  c.strokeStyle = col;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(x - 3, y - 8.5);
  c.lineTo(x - 6.4, y - 4.5 + sw * 0.5);
  c.moveTo(x + 3, y - 8.5);
  c.lineTo(x + 6.4, y - 4.5 - sw * 0.5);
  c.stroke();
  c.restore();
  c.strokeStyle = withAlpha('#3a2a1a', 0.55);
  c.lineWidth = 0.7;
  c.beginPath();
  c.arc(x, y - 13.5, 3.6, 0, Math.PI * 2);
  c.stroke();
}

function openaiFront(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const tq = tq12(t);
  const up = openaiUp(t, b);
  if (up <= 0) return;
  const a = sm(up);
  const by = SHELF_Y;
  const tx0 = TERR.x - TERR.w / 2, tx1 = TERR.x + TERR.w / 2;
  const gy1 = by - TERR.base, gy0 = gy1 - TERR.h;
  c.save();
  c.globalAlpha *= a;
  c.translate(0, (1 - a) * 12);
  // the base: a moulded dark plinth
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(tx0 - 9, gy1, TERR.w + 18, TERR.base);
  c.fillRect(tx0 - 5, gy1 - 3, TERR.w + 10, 3);
  // the glass: a case with a domed lid (bevelled edges, three glints)
  const glass = new Path2D();
  glass.moveTo(tx0, gy1);
  glass.lineTo(tx0, gy0);
  glass.quadraticCurveTo(tx0, gy0 - TERR.dome, TERR.x, gy0 - TERR.dome);
  glass.quadraticCurveTo(tx1, gy0 - TERR.dome, tx1, gy0);
  glass.lineTo(tx1, gy1);
  glass.closePath();
  c.fillStyle = withAlpha(mixLab(m.rim, m.haze, 0.45), 0.14);
  c.fill(glass);
  // the agents inside (all hold until 'broke', then walk to the pipe's mouth and are gone)
  for (let k = 0; k < 3; k++) {
    const g = agentGo(t, b, k);
    if (g >= 0.5) continue;
    const home = tx0 + 24 + k * 30;
    const bob = g <= 0 ? Math.sin(tq * 3 + k * 2) * 3 : 0;
    const x = lerp(home + bob, tx1 - 8, sm(g / 0.5));
    agent(c, env, x, gy1, Math.floor(tq * 6 + k) % 2);
  }
  c.strokeStyle = withAlpha(m.rim, 0.6);
  c.lineWidth = 1.4;
  c.stroke(glass);
  c.strokeStyle = withAlpha(m.rim, 0.22);
  c.lineWidth = 1;
  c.strokeRect(tx0 + 4, gy0 + 3, TERR.w - 8, TERR.h - 6);
  c.beginPath();
  c.moveTo(tx0, gy0);
  c.lineTo(tx1, gy0);
  c.stroke();
  // the lid's knob
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(TERR.x, gy0 - TERR.dome - 3, 4, 0, Math.PI * 2);
  c.fill();
  // glints: a long diagonal on the front, a short one beside it, a curved one on the dome
  c.save();
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = withAlpha(mixLab(m.core, '#ffffff', 0.3), 0.5);
  c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(tx0 + 12, gy0 + 6);
  c.lineTo(tx0 + 32, gy1 - 8);
  c.stroke();
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(tx0 + 22, gy0 + 6);
  c.lineTo(tx0 + 30, gy0 + 22);
  c.stroke();
  c.beginPath();
  c.arc(TERR.x, gy0 + 6, TERR.w * 0.42, Math.PI * 1.15, Math.PI * 1.42);
  c.stroke();
  c.restore();
  // the pipe from the case's side to the building
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(tx1, PIPE_Y - 4, BLD.x - BLD.w / 2 - tx1, 8);
  c.fillRect(tx1 - 2, PIPE_Y - 7, 6, 14);
  c.fillStyle = withAlpha(m.rim, 0.4);
  c.fillRect(tx1, PIPE_Y - 4, BLD.x - BLD.w / 2 - tx1, 1);
  // the valve: a wheel on a stem, turned a quarter turn open on 'lowered' (on twos)
  const vo = sm(clamp01((tq - (b.lowered - 0.19)) / 0.6));
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(VALVE.x - 7, PIPE_Y - 9, 14, 14);
  c.fillRect(VALVE.x - 1.6, PIPE_Y - 22, 3.2, 14);
  c.save();
  c.translate(VALVE.x, PIPE_Y - 22 - VALVE.r);
  c.rotate(vo * Math.PI * 0.5 + Math.PI / 4);
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = 3;
  c.beginPath();
  c.arc(0, 0, VALVE.r, 0, Math.PI * 2);
  for (let k = 0; k < 4; k++) {
    c.moveTo(0, 0);
    c.lineTo(Math.cos((k * Math.PI) / 2) * VALVE.r, Math.sin((k * Math.PI) / 2) * VALVE.r);
  }
  c.stroke();
  // the handle knob on the rim (shows the quarter turn)
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.arc(VALVE.r, 0, 3.4, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(m.rim, 0.45);
  c.lineWidth = 1;
  c.beginPath();
  c.arc(0, 0, VALVE.r + 1.5, -2.4, -0.9);
  c.stroke();
  c.restore();
  // the glint on the handle ('broke')
  const gl = pulse(t, b.broke - 0.05, 0.1, 0.6);
  if (gl > 0.01) {
    const hx = VALVE.x + Math.cos(Math.PI * 0.75) * VALVE.r, hy = PIPE_Y - 22 - VALVE.r + Math.sin(Math.PI * 0.75) * VALVE.r;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(hx, hy, 0, hx, hy, 18);
    g.addColorStop(0, withAlpha(m.core, 0.9 * gl));
    g.addColorStop(1, withAlpha(m.core, 0));
    c.fillStyle = g;
    c.fillRect(hx - 18, hy - 18, 36, 36);
    c.restore();
  }
  // the agents travelling the pipe (small sparks of light) after they leave the case
  for (let k = 0; k < 3; k++) {
    const g = agentGo(t, b, k);
    if (g <= 0.5 || g >= 1) continue;
    const u = (g - 0.5) / 0.5;
    const x = lerp(tx1, BLD.x - BLD.w / 2, u);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const gg = c.createRadialGradient(x, PIPE_Y, 0, x, PIPE_Y, 11);
    gg.addColorStop(0, withAlpha(m.core, 0.85));
    gg.addColorStop(1, withAlpha(m.core, 0));
    c.fillStyle = gg;
    c.fillRect(x - 11, PIPE_Y - 11, 22, 22);
    c.restore();
  }
  c.restore();
}
