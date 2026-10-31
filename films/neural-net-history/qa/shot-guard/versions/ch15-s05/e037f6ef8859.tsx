/**
 * ch15-s05 — the labs, under the same light: a long shelf of identical oil lamps in the study, each with a luggage
 * tag 'as of October 2026'. The shot opens wide on the row (the study window's rose dusk at left, hazed bookcases
 * behind), trucks in to one lamp, then on to the next; at each stop the tag flips to a dated stamp and a small paper
 * vignette rises in the lamp's light. (candleAmber; the dusk only in the window; 38.9 s; in: cut.)
 *
 *   0 → 1.6     the wide: identical lamps along the shelf ('The labs, under the same light'). Review round 4: every
 *               tag in view carries its lab's name on line one (GOOGLE DEEPMIND, ANTHROPIC, OPENAI, META, 18-22 px cap)
 *               over a smaller 'as of October 2026'; the tags hold that size in the wide (they scale with the camera's
 *               pull back) and settle to world size by the stop. The GOOGLE DEEPMIND and META plates are lettered at
 *               16-18 px cap (texture, ~70 %), lit softly from 0.4 s through L1522
 *   1.6 → 4.6   the truck in to the second lamp; 'Anthropic': its tag flips: FEB–SEP 2026
 *   'surveillance' a paper seal on the lamp's plinth: an eye over a crowd, barred      (the first limit; no text)
 *   'weapons'   beside it a second seal: an unmanned aircraft, barred                  (the second limit)
 *   'Pentagon'  a plain flat-roofed office block (a bare flagpole, no columns, no insignia) rises; its thread tugs
 *               at the seals; they hold
 *   'risk'      the thread is cut and drawn back with the building, away from the lamp (the designation)
 *   'courts'    two columned courthouses rise on paper stalks either side of the lamp, gavels falling opposite ways;
 *               each court's finding sets in beneath its own courthouse (same face, same size); while the paired
 *               Lin / Katsas quotes are up the camera pushes in and the quotes grow about 1.3x (QUOTE_PUSH)
 *   b4 (wordless) the courthouses go down; a stack of books tied with string and an open ledger rise; the tag flips
 *               again: APPROVED JULY 2026; the label ANTHROPIC · $1.5B SETTLEMENT · PIRATED BOOKS above the stack
 *   'In'        (review round 3) no pan between the stops: a 0.6 s dissolve from the Anthropic plinth framing to the
 *               OpenAI plinth framing, landing as L1525 begins, every tag whole inside the safe area
 *   'test'      its tag flips: JULY 2026; a glass terrarium on a base with one pipe
 *               into a neighbouring paper building
 *   'lowered'   (review round 1) the valve is a dark cut-paper handwheel ON THE PIPE between the case and the plinth;
 *               it turns a quarter turn open (safeguards deliberately lowered, for the test); the OpenAI plinth stays
 *               plain, as Anthropic's is without its seals (fairness)
 *   'broke'     the valve's handle glints; the paper agents leave the case through the pipe; the building's windows
 *               light one by one; a small answer sheet inside is pulled toward the pipe
 *   OpenAI #2   the 'warning shot' card on the wall above the building (right third), on its own plate
 *   hold        music only (review round 4: the shot ends 1.5 s after L1525): the 'warning shot' card holds through
 *               'warning shot' and clears by +37.95; in the last 1.5 s the camera tilts up and the Wall's lower edge
 *               enters, ready for the crossfade into ch15-s06 at about +38.25
 * STAGING (review round 1): a slow continuous truck (~8-10 px/s) through each stop, never locked off; a blurred
 *   chair finial on L6 sits low at the right edge during the opening track (review round 4: below the shelf line and
 *   the tags, x >= 90 %, it never occludes a lamp or a tag); the seals are pressed paper
 *   seals (halo-toned paper, a cut ink bar, the lamp's rim on their scalloped tops), not modern no-entry signs.
 * FAIRNESS: every lamp is the same lamp in the same light; every vignette is built to one bounding height (~90 L4
 * units: seals, office block, courthouses, books, terrarium, building); the type is one face and one size at both stops.
 */
import { Timeline } from '../../../core';
import type { Camera3, LayerSpec, PaintEnv } from '../../../film';
import type { Frame } from '../../../film';
import { LAYERS, PUPPET_NEAR_BLACK, defineShot, mixLab, oilLamp, overscan, quoteCard, toLayer, toScreen, withAlpha } from '../../../film';
import { hash1 } from '../../../film/core/frame';
import { FONT, cardProbe, legibleSize, textRole } from '../../../film/silhouette/type';
import { bookshelfWall } from '../../../film/silhouette/architecture';
import { STUDY, studyRoom } from '../sets/study';
import { compositeSub, monotone, subFrame } from '../sets/ch02-s05b-util';
import { clamp01, lerp, pulse, screen, sm, tq12, win } from '../sets/ch15-s01-kit';
import { TAG_W, lampTag } from '../sets/ch15-s05-tag';

const ID = 'ch15-s05';
type C = CanvasRenderingContext2D;

// ===================================================================================================== staging (L4)
const SHELF_Y = 560;
/** every plinth is the same: a brass name band across its top (NAME_H), the face below it */
const PLINTH = { w: 170, h: 88 };
const NAME_H = 24;
/** lamps far enough apart that at a stop the neighbours (and their tags) are wholly out of frame (review round 2:
 *  no tag or date cropped at the frame edge) */
const PITCH = 640;
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
const SEAL = { y: BASE_Y + NAME_H + (PLINTH.h - NAME_H) / 2, dx: 44, r: 28 };
/** the one vignette height (L4 units) every lab's paper pieces are built to */
const VH = 90;
/** world text: one face, one size, both stops (≥ 22 px cap at the stop framing) */
const TXT = { size: 18.5, lh: 24 };
/** tag hang point (shelf's front edge) */
const TAG_Y = SHELF_Y + 14;
/** the two other plinths in the opening wide (review round 3): 'the labs' reads as the field; texture, dimmer */
const OTHER_LABS: Record<number, string> = { 0: 'GOOGLE DEEPMIND', 3: 'META' };
/** the paired court quotes grow by this while they are up (the camera's own push is QUOTE_CAM of it) */
const QUOTE_PUSH = 1.3;
const QUOTE_CAM = 1.08;
/** the tags' reference camera scale: below it (the opening wide) a tag is drawn larger, 1/k, up to 2.1x */
const TAG_K = 1.06;
/** reviser r1: the near desk objects' plane (L5 depth, a light blur so their profiles and rims read) */
const NEAR5: LayerSpec = { id: 'ch15s05Near', z: LAYERS.L5.z, haze: 0, blur: 1.6 };

interface B {
  D: number;
  ant: number;
  eye: number;
  drone: number;
  pent: number;
  risk: number;
  courts: number;
  split: number;
  courtsOut: number;
  booksIn: number;
  books: number;
  settleOut: number;
  /** the labs' first mentions (their plinth name bands letter in) */
  oai: number;
  test: number;
  lowered: number;
  broke: number;
  warn: number;
  /** the 'warning shot' card starts to clear (gone 0.4 s later, before the crossfade out) */
  warnOut: number;
  tilt: number;
  /** 'labs' and the end of L1522: the other plinths' names and their soft light */
  labs: number;
  l1522End: number;
  /** the dissolve from the Anthropic stop to the OpenAI stop (replaces the pan; review round 3) */
  dis0: number;
  dis1: number;
  /** reviser r1: 'signed' (the Pentagon's string draws taut toward the OpenAI lamp), 'Open' #1 (its band glints) */
  signed: number;
  /** the camera's push on the bell jar, the valve and the building ('broke' -0.3 → 'systems' +0.5, out by 'called') */
  systems: number;
  called: number;
}
interface Scene {
  tl: Timeline;
  b: B;
  cam: (t: number) => Camera3;
  /** the Anthropic stop's camera (to the dissolve) and the OpenAI stop's (from it) */
  camA: (t: number) => Camera3;
  camB: (t: number) => Camera3;
  CAMS: Camera3[];
  OCC: number[];
  FIN: { x: number; top: number; bot: number; w: number };
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
      split: T.word('L1522c', 'split'),
      // the rulings hold to 'half' (about 5 s to read both), then the books rise on 'billion', under L1522d, and the
      // settlement card clears before L1525 begins (review round 2)
      courtsOut: T.word('L1522d', 'half') - 0.1,
      booksIn: T.word('L1522d', 'half') + 0.05,
      books: T.word('L1522d', 'billion'),
      settleOut: T.line('L1522d').end + 0.05,
      oai: T.word('L1522b', 'Open'),
      test: T.beat('b5'),
      lowered: T.beat('b5b'),
      broke: T.beat('b7'),
      warn: T.beat('b6'),
      warnOut: Math.min(T.duration - 1.2, T.line('L1525').end + 0.3),
      // the closing tilt starts ~1.5 s before the cut so ch15-s06 opens on the Wall it has reached
      tilt: D - 1.47,
      labs: T.word('L1522', 'labs'),
      l1522End: T.line('L1522').end,
      dis0: T.line('L1525').start - 0.6,
      dis1: T.line('L1525').start,
      signed: T.word('L1522b', 'signed'),
      systems: T.word('L1525', 'systems'),
      called: T.word('L1525', 'called'),
    };
    // P: world (x, shelf) at screen (640, sy), L4 scale k
    const P = (x: number, k: number, sy = 488) => frameOnLayer(LAYERS.L4, { x, y: SHELF_Y }, { x: 640, y: sy }, k);
    const STOP = 1.7;
    // the Anthropic stop: the wide, the truck in, the push on the paired quotes, the books; held to the dissolve
    const keysA: [number, Camera3][] = [
      // the wide on the row of identical lamps (the window's dusk at left), a slow drift
      [0, P((AX + OX) / 2 - 40, 0.5, 476)],
      [1.6, P((AX + OX) / 2 - 90, 0.54, 476)],
      // the truck in to the Anthropic lamp, then (review round 1) a slow continuous truck right through the whole
      // stop (~5 world px/s, ~8-10 px/s on screen), never locked off
      [b.ant + 1.5, P(AX - 56, STOP)],
      [b.courts - 0.3, P(AX + 0, STOP * 0.98)],
      // review round 3: push in on the paired Lin / Katsas quotes while they are up (the camera QUOTE_CAM, lowered a
      // little so the courthouses and gavels stay inside the frame; the screen-locked quotes grow 1.3x with it)
      [b.courts + 4.2, P(AX + 14, STOP * 0.98 * QUOTE_CAM, 506)],
      [b.courtsOut, P(AX + 28, STOP * 0.98 * QUOTE_CAM, 506)],
      [b.books + 1.5, P(AX + 46, STOP)],
      // the dissolve is a match on the lamp (the same lamp, the same light; only the name band and the tag change)
      [b.dis1, P(AX + 60, STOP)],
    ];
    // the OpenAI stop: from the dissolve, a slow drift; in the last second the tilt up toward the Wall
    // (review round 1: a slow continuous truck back left through the stop, ~5 world px/s, never locked off)
    // reviser r1: from 'broke' -0.3 a push in (~1.3x: the most that keeps the bell jar, the valve and the building
    // whole in frame) so the escape and the windows lighting up read; held to 'systems' +0.5, eased out by 'called'
    const keysB: [number, Camera3][] = [
      [b.dis0, P(OX + 60, STOP)],
      [b.broke - 0.3, P(OX + 44, STOP * 1.005)],
      [b.broke + 0.55, P(OX + 2, STOP * 1.3, 476)],
      [b.systems + 0.5, P(OX - 2, STOP * 1.31, 476)],
      [b.called, P(OX + 26, STOP * 1.01)],
      [b.tilt, P(OX + 10, STOP * 1.012)],
      // the tilt up toward the Wall: the picture slides down 64 px (the Wall's lower edge enters at the top)
      [D, P(OX + 4, STOP * 1.012, 580)],
    ];
    const path = (keys: [number, Camera3][]) => {
      const ch = (sel: (c: Camera3) => number) => monotone(keys.map(([t, c]) => [t, sel(c)] as [number, number]));
      const fx = ch((c) => c.x), fy = ch((c) => c.y), fz = ch((c) => c.z);
      return (t: number): Camera3 => ({ x: fx(t), y: fy(t), z: fz(t), lens: 1 });
    };
    const camA = path(keysA), camB = path(keysB);
    const mid = (b.dis0 + b.dis1) / 2;
    const cam = (t: number): Camera3 => (t < mid ? camA(t) : camB(t));
    const CAMS: Camera3[] = [];
    for (let i = 0; i <= 60; i++) CAMS.push(cam((D * i) / 60));
    CAMS.push(camA(b.dis1), camB(b.dis0));
    // the L5 near occluders (blurred book-ends on the desk edge): one slides across the frame during the truck in and
    // sits at the frame's left edge at the Anthropic stop; one stands at the right edge of the OpenAI stop
    const OCC = [toLayer(LAYERS.L5, camA(b.ant + 1.5), -30, 0).x, toLayer(LAYERS.L5, camB(b.test + 1.0), 1262, 0).x];
    // review round 1: an L6 chair finial (blurred, near) that crosses the frame during the opening track
    // review round 4: it sits low at the right edge (screen x ~93 %, its ball below the shelf and the tags), and the
    // camera's drift carries it out to the right: it never crosses a lamp or a tag, never reads as a figure
    const fc = camA(1.2);
    const fy = (y: number) => toLayer(LAYERS.L6, fc, 0, y).y;
    const fin = { x: toLayer(LAYERS.L6, fc, 1196, 0).x, top: fy(616), bot: fy(900), w: (fy(900) - fy(250)) * 0.06 };
    tl.hold(0, D);
    return { tl, b, cam, camA, camB, CAMS, OCC, FIN: fin };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    // review round 3: no pan between the stops: a 0.6 s dissolve from the Anthropic plinth framing to the OpenAI one
    const w = win(t, b.dis0, b.dis1);
    if (w <= 0 || w >= 1) paintAll(f, sc, t, sc.cam(t));
    else {
      paintAll(f, sc, t, sc.camA(t));
      compositeSub(f, subFrame(f, `${ID}/dissolve`, 'candleAmber', (g) => paintAll(g, sc, t, sc.camB(t))), w);
    }
  },
});

/** the whole picture through one camera (painted twice, through both stops' cameras, inside the dissolve) */
function paintAll(f: Frame, sc: Scene, t: number, cam: Camera3) {
  const b = sc.b;
  {
    f.camera(cam);
    // STUDY LOCK: the study's own wall and its one window (the dusk enters only there)
    studyRoom(f, { key: ID, cams: sc.CAMS, outside: { mood: 'duskRose', kind: 'dusk' }, fog: 0.9 });

    // L3: the far plane: tall hazed bookcases along the study wall behind the shelf (they slide against the lamps)
    f.layer('L3', (c, env) => {
      const r = overscan(LAYERS.L3, sc.CAMS, 60);
      const key = `${ID}/L3/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;
      f.cached(key + '/d', Math.ceil(r.w), Math.ceil(r.h), (cc) => {
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
        // the wall and its cases sit back in the study's shade (~30% darker): the lamps' own light is the subject
        const x0 = Math.max(r.x, SHELF_START - 30);
        cc.fillStyle = withAlpha(mixLab(env.mood.fg, env.mood.ink, 0.5), 0.42);
        cc.fillRect(x0, r.y, r.x + r.w - x0, r.h);
      })(c, r.x, r.y);
    });
    f.fog({ yCenter: toScreen(LAYERS.L4, cam, 0, BASE_Y - 140).y, height: 260, alpha: 0.14, drift: 5 });

    f.layer('L4', (c, env) => {
      const m = env.mood;
      // the Wall's lower edge, high above the OpenAI lamp, only for the closing tilt (off-frame until then)
      if (t > b.test + 1.5) wallEdge(c, env);
      // THE SAME LIGHT: every lamp throws the same warm pool on the wall behind it and on the plank (one radius,
      // one intensity for all six), drawn before the paper pieces so they stand in it
      for (let i = 0; i < LAMPS.length; i++) {
        const x = LAMPS[i];
        const sx = toScreen(LAYERS.L4, cam, x, 400).x;
        if (sx < -500 || sx > 1780) continue;
        lampPool(c, env, x, t, i);
      }
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
      for (let i = 0; i < LAMPS.length; i++) {
        // the pool's bright lip on the plank's top edge and apron, the same under every lamp
        const x = LAMPS[i];
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.translate(x, SHELF_Y + 6);
        c.scale(1, 0.14);
        const g = c.createRadialGradient(0, 0, 0, 0, 0, 230);
        g.addColorStop(0, withAlpha(m.halo, 0.38));
        g.addColorStop(1, withAlpha(m.halo, 0));
        c.fillStyle = g;
        c.fillRect(-230, -230, 460, 460);
        c.restore();
      }
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
        // reviser r1 ('every lamp is drawn the same'): all four named plinths carry the SAME plate, lettered alike
        // (texture, ~70 %) in the opening wide; the tags carry the names. At its own stop a lab's plate rises to full
        // strength (the subject: ANTHROPIC from 'Anthropic', OPENAI from 'Open')
        const wide = 1 - win(t, b.ant + 0.4, b.ant + 1.4);
        if (i === ANT || i === OAI) {
          const own = i === ANT ? win(t, b.ant - 0.1, b.ant + 0.5) : win(t, b.oai, b.oai + 0.6);
          const soft = win(t, 0.2, 0.6) * wide;
          plinthPlate(c, env, x, i === ANT ? 'ANTHROPIC' : 'OPENAI', Math.max(0.7 * soft, own), wide > 0.5 ? 'texture' : 'subject', wide);
          // 'Open' #1: a short glint along the OPENAI plate (0.2 s)
          if (i === OAI) {
            const gl = pulse(t, b.oai - 0.02, 0.06, 0.2);
            if (gl > 0.01) {
              c.save();
              c.globalCompositeOperation = 'lighter';
              const gg = c.createRadialGradient(x, BASE_Y + 13, 2, x, BASE_Y + 13, 90);
              gg.addColorStop(0, withAlpha(m.core, 0.55 * gl));
              gg.addColorStop(1, withAlpha(m.core, 0));
              c.fillStyle = gg;
              c.fillRect(x - 90, BASE_Y - 77, 180, 180);
              c.restore();
            }
          }
        } else {
          // the other labs on the shelf (review round 3): named on 'labs', dimmer, as texture; lit softly through L1522
          // review round 4: lit softly from 0.4 s (the wide) through L1522
          const soft = win(t, 0.2, 0.6) * (1 - win(t, b.l1522End, b.l1522End + 1.0));
          if (soft > 0.003) {
            c.save();
            c.globalCompositeOperation = 'lighter';
            const g = c.createRadialGradient(x, BASE_Y + 12, 4, x, BASE_Y + 12, 130);
            g.addColorStop(0, withAlpha(m.halo, 0.2 * soft));
            g.addColorStop(1, withAlpha(m.halo, 0));
            c.fillStyle = g;
            c.fillRect(x - 130, BASE_Y - 118, 260, 260);
            c.restore();
          }
          if (OTHER_LABS[i]) plinthPlate(c, env, x, OTHER_LABS[i], 0.7, 'texture');
          else nameBand(c, env, x, '', 0);
        }
        oilLamp(c, { x, y: BASE_Y, s: LAMP_S, lit: true, seed: 40 + i }, env);
      }
      anthropicFront(c, env, t, b);
      openaiFront(c, env, t, b);
      // the luggage tags, hanging from the shelf's front edge under each lamp
      for (let i = 0; i < LAMPS.length; i++) {
        const x = LAMPS[i];
        // review round 4: each tag names its lab on line one, over a smaller 'as of October 2026'
        const lab = i === ANT ? 'ANTHROPIC' : i === OAI ? 'OPENAI' : OTHER_LABS[i];
        let front = lab ? `${lab}|as of October 2026` : 'as of|October 2026', back = front, flip = 0;
        let subFront = lab ? 0.62 : 1;
        if (i === ANT) {
          const u1 = sm(clamp01((tq12(t) - b.ant) / 0.5));
          const u2 = sm(clamp01((tq12(t) - b.booksIn) / 0.5));
          if (t < b.booksIn) {
            back = 'FEB–SEP 2026';
            flip = u1;
          } else {
            front = 'APPROVED|JULY 2026';
            subFront = 1;
            back = 'FEB–SEP 2026';
            flip = 1 - u2;
          }
        } else if (i === OAI) {
          back = 'JULY 2026';
          flip = sm(clamp01((tq12(t) - b.test) / 0.5));
        }
        const sw = 0.04 * Math.sin(t * 0.9 + i * 1.7) + (flip > 0 && flip < 1 ? 0.06 * Math.sin(flip * Math.PI) : 0);
        // review round 1 (clean end): as the tilt carries the tags off the bottom edge, paper and ink fade TOGETHER,
        // gone before the crossfade into ch15-s06 (never a blank tag)
        const endA = 1 - win(t, b.tilt + 0.2, b.D - 0.5);
        if (endA <= 0.003) continue;
        // the tags keep a readable size in the wide: scaled about their hang point while the camera is pulled back
        // (1x at the stops), so the lab names read at 18-22 px cap in the opening
        const G = Math.max(1, Math.min(2.1, TAG_K / toScreen(LAYERS.L4, cam, x, TAG_Y).k));
        // reviser r1 (at most two text items): while the paired court quotes are up the Anthropic tag sits back to ~35 %
        const qDim = i === ANT ? 1 - 0.65 * quotesUp(t, b) : 1;
        c.save();
        c.globalAlpha *= endA * qDim;
        c.translate(x + 34, TAG_Y);
        c.scale(G, G);
        textRole(c, 'subject', () => lampTag(c, { x: 0, y: 0, w: TAG_W, front, back, flip, swing: sw, light: 0.95, size: 19, subFront }, env));
        cardProbe(c, `${ID}-tag${i}`, -TAG_W / 2, 0, TAG_W, 64, 1, 1);
        c.restore();
      }
      // the settlement's label above the books (world text: it rides the truck out)
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
      // the near desk edge rides higher: a dark third plane across the bottom of frame under the shelf
      const deskY = toLayer(LAYERS.L5, cam, 0, 654).y;
      const topY = toLayer(LAYERS.L5, cam, 0, 540).y;
      c.fillStyle = env.fill('fg');
      c.fillRect(r.x, deskY, r.w, r.y + r.h - deskY + 40);
      c.fillStyle = withAlpha(env.mood.rim, 0.16);
      c.fillRect(r.x, deskY, r.w, 1.5);
    });
    // reviser r1: the two near desk objects (an inkwell with its pen, a bookend with leaning books) on a lightly softened
    // L5-depth plane, each with a 2 px warm rim on its lamp-facing edges, so they read as objects, never as figures
    f.layer(NEAR5, (c, env) => {
      const deskY = toLayer(LAYERS.L5, cam, 0, 654).y;
      const topY = toLayer(LAYERS.L5, cam, 0, 540).y;
      const px = 1 / (1.5 * Math.max(0.2, toScreen(LAYERS.L5, cam, 0, 0).k));
      inkwell(c, env, sc.OCC[0], deskY, deskY - topY, px);
      bookEnd(c, env, sc.OCC[1], deskY, deskY - topY, px);
    });
    // L6: the chair's finial, crossing during the opening track (only while it can be in frame)
    if (t < b.ant + 1.6) f.layer('L6', (c, env) => chairFinial(c, env, sc.FIN));

    screen(f, (c) => {
      const te = { t, mood: f.mood };
      courtRulings(c, cam, t, b, te);
      settlementLabel(c, cam, t, b, te);
      // the 'warning shot' card on the clear wall above the building (right third), on its own plate
      // review round 1 (sync): the rise starts just before 'Open A.I.' #2 and is fully up by 'called it a warning shot'
      // review round 4: the card lives inside the 1.5 s tail: up through 'warning shot', cleared by warnOut (before the
      // crossfade into ch15-s06, so it never ghosts over the Wall's slips)
      const qa = clamp01(Math.min((t - (b.warn - 0.25)) / 0.4, (b.warnOut + 0.4 - t) / 0.4));
      if (qa > 0) evenPlate(c, 640, 52, 480, 210, PUPPET_NEAR_BLACK, 0.42 * qa);
      quoteCard(c, { quote: "…a 'warning shot' for us and for the world", speaker: 'OpenAI', source: 'August 2026', x: 880, y: 150, width: 400, size: 31, at: b.warn - 0.2, dur: b.warnOut - (b.warn - 0.2), fade: 0.4, stagger: 0.14, plate: false }, te);
    });
  }
}

// ===================================================================================================== pieces
const paperCol = (env: PaintEnv) => mixLab(mixLab('#e3d2ad', env.mood.halo, 0.25), env.mood.set, 0.15);
const vigInk = (env: PaintEnv) => mixLab(env.fill('ink'), env.mood.haze, 0.12);
/** rise from behind the shelf plank: u 0..1 → y offset */
const rise = (u: number, h: number) => (1 - sm(u)) * (h + 14);

/** reviser r1: an inkwell with a dip pen standing in it (near desk, L5 depth): a squat square bottle, a shoulder, a
 *  short neck and a cap, the pen leaning out of it; a warm rim on the edges that face the lamps (up and right) */
function inkwell(c: C, env: PaintEnv, x: number, deskY: number, h: number, px: number) {
  const w = h * 0.62, bh = h * 0.42;
  const rim = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.45), 0.95);
  const p = new Path2D();
  p.moveTo(x - w / 2, deskY + 2);
  p.lineTo(x - w / 2, deskY - bh * 0.8);
  p.quadraticCurveTo(x - w / 2, deskY - bh, x - w * 0.3, deskY - bh);
  p.lineTo(x - w * 0.16, deskY - bh * 1.12);
  p.lineTo(x - w * 0.16, deskY - bh * 1.32);
  p.lineTo(x + w * 0.16, deskY - bh * 1.32);
  p.lineTo(x + w * 0.16, deskY - bh * 1.12);
  p.lineTo(x + w * 0.3, deskY - bh);
  p.quadraticCurveTo(x + w / 2, deskY - bh, x + w / 2, deskY - bh * 0.8);
  p.lineTo(x + w / 2, deskY + 2);
  p.closePath();
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fill(p);
  // the dip pen: a slim holder leaning right out of the neck, a nib down in the ink
  c.save();
  c.translate(x, deskY - bh * 1.25);
  c.rotate(0.42);
  c.fillRect(-w * 0.035, -h * 0.72, w * 0.07, h * 0.78);
  c.fillRect(-w * 0.05, -h * 0.74, w * 0.1, h * 0.12);
  c.fillStyle = rim;
  c.fillRect(w * 0.035 - 2.2 * px, -h * 0.72, 2.2 * px, h * 0.7);
  c.restore();
  // rims: the shoulder, the cap's top, the bottle's right edge
  c.fillStyle = rim;
  c.fillRect(x - w * 0.16, deskY - bh * 1.32, w * 0.32, 2.2 * px);
  c.fillRect(x + w * 0.3, deskY - bh - 1.1 * px, w * 0.2, 2.2 * px);
  c.fillRect(x - w * 0.5, deskY - bh * 0.8, w * 0.2, 2.2 * px);
  c.fillRect(x + w / 2 - 2.2 * px, deskY - bh * 0.8, 2.2 * px, bh * 0.8);
}

/** reviser r1: a bookend (an L-bracket's upright with a scrolled top) and three books leaning on it, near desk (L5) */
function bookEnd(c: C, env: PaintEnv, x: number, deskY: number, h: number, px: number) {
  const rim = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.45), 0.95);
  const w = h * 0.1, H = h * 0.86;
  c.fillStyle = PUPPET_NEAR_BLACK;
  // the bracket: a thin upright with a scroll at the top, and its foot plate under the books
  c.fillRect(x - w / 2, deskY - H, w, H + 2);
  c.beginPath();
  c.arc(x - w / 2 - H * 0.06, deskY - H, H * 0.09, 0, Math.PI * 2);
  c.arc(x - w / 2 - H * 0.06, deskY - H, H * 0.045, 0, Math.PI * 2, true);
  c.fill('evenodd');
  c.fillRect(x - h * 0.55, deskY - 3 * px, h * 0.55, 3 * px + 2);
  // three books leaning on it from the left, each a spine with two bands
  const books = [
    { w: h * 0.16, hh: H * 0.92, lean: -0.0 },
    { w: h * 0.13, hh: H * 0.8, lean: -0.06 },
    { w: h * 0.18, hh: H * 0.86, lean: -0.16 },
  ];
  let bx = x - w / 2;
  books.forEach((bk) => {
    c.save();
    c.translate(bx, deskY);
    c.rotate(bk.lean);
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.fillRect(-bk.w, -bk.hh, bk.w, bk.hh);
    c.fillStyle = rim;
    c.fillRect(-bk.w, -bk.hh, bk.w, 2.2 * px);
    c.fillStyle = withAlpha(env.mood.rim, 0.35);
    c.fillRect(-bk.w + 2 * px, -bk.hh * 0.82, bk.w - 4 * px, 1.4 * px);
    c.fillRect(-bk.w + 2 * px, -bk.hh * 0.22, bk.w - 4 * px, 1.4 * px);
    c.restore();
    bx -= bk.w * Math.cos(bk.lean) + 1;
  });
  // the bracket's lit edges (the lamps are up and to the left of it in the wide)
  c.fillStyle = rim;
  c.fillRect(x + w / 2 - 2.2 * px, deskY - H, 2.2 * px, H);
  c.fillRect(x - w / 2, deskY - H - 1, w, 2.2 * px);
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
  // review round 1: a PRESSED PAPER SEAL (not a no-entry sign): halo-toned paper, lit from the lamp above (its top
  // light, its foot in shade), a pressed inner ring, the lamp's rim along its scalloped top edge
  const m = env.mood;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.4);
  c.beginPath();
  c.arc(2, 3, r, 0, Math.PI * 2);
  c.fill();
  const scallop = new Path2D();
  for (let k = 0; k < 24; k++) {
    const ang = (k / 24) * Math.PI * 2;
    const rr = r + (k % 2 ? 2.4 : 0);
    if (k === 0) scallop.moveTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
    else scallop.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
  }
  scallop.closePath();
  const paper = mixLab(mixLab(paperCol(env), m.halo, 0.3), m.set, 0.12);
  const pg = c.createLinearGradient(0, -r, 0, r);
  pg.addColorStop(0, mixLab(paper, m.halo, 0.18));
  pg.addColorStop(1, mixLab(paper, m.fg, 0.32));
  c.fillStyle = pg;
  c.fill(scallop);
  c.strokeStyle = withAlpha(ink, 0.3);
  c.lineWidth = 1;
  c.beginPath();
  c.arc(0, 0, r - 4, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(m.core, '#fff3d6', 0.2), 0.32);
  c.beginPath();
  c.arc(0, 0, r - 5.2, Math.PI * 1.1, Math.PI * 1.9);
  c.stroke();
  c.save();
  c.beginPath();
  c.rect(-r - 4, -r - 4, 2 * r + 8, r * 0.75);
  c.clip();
  c.strokeStyle = withAlpha(m.rim, 0.75);
  c.lineWidth = 1.3;
  c.stroke(scallop);
  c.restore();
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
    // a fixed-wing UAV seen from above: slender fuselage (nose up), long straight wings, an inverted-V tail
    c.beginPath();
    c.moveTo(0, -11);
    c.quadraticCurveTo(2.2, -10.2, 2, -6);
    c.lineTo(1.4, 8);
    c.lineTo(-1.4, 8);
    c.lineTo(-2, -6);
    c.quadraticCurveTo(-2.2, -10.2, 0, -11);
    c.closePath();
    c.fill();
    c.beginPath();
    c.moveTo(-12.5, -2.6);
    c.lineTo(12.5, -2.6);
    c.lineTo(12.5, -0.6);
    c.lineTo(1.5, 0.4);
    c.lineTo(-1.5, 0.4);
    c.lineTo(-12.5, -0.6);
    c.closePath();
    c.fill();
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(0, 6.5);
    c.lineTo(-5, 10.5);
    c.moveTo(0, 6.5);
    c.lineTo(5, 10.5);
    c.stroke();
    c.fillRect(-2.6, 8, 5.2, 1.1); // the pusher prop
  }
  // the bar: a cut strip of ink paper laid across the seal (squared ends, a lit top edge), not a red slash
  c.save();
  c.rotate(-Math.PI / 4);
  c.fillStyle = withAlpha('#1c140e', 0.94);
  c.fillRect(-17, -1.6, 34, 3.2);
  c.fillStyle = withAlpha(m.rim, 0.55);
  c.fillRect(-17, -1.6, 34, 0.5);
  c.restore();
  c.restore();
}

/** the L6 chair finial: a turned post with a ball top rising from below frame, near and blurred (world on L6) */
function chairFinial(c: C, env: PaintEnv, F: { x: number; top: number; bot: number; w: number }) {
  const w = F.w;
  const x = F.x;
  // a turned chair-back finial: a ball, a short neck, a bead, a vase that swells and tapers into the post
  const p = new Path2D();
  p.arc(x, F.top + w * 1.2, w * 1.2, 0, Math.PI * 2);
  p.rect(x - w * 0.38, F.top + w * 2.2, w * 0.76, w * 0.8);
  p.ellipse(x, F.top + w * 3.1, w * 0.8, w * 0.32, 0, 0, Math.PI * 2);
  p.moveTo(x - w * 0.5, F.top + w * 3.3);
  p.bezierCurveTo(x - w * 1.2, F.top + w * 4.6, x - w * 0.9, F.top + w * 6, x - w * 0.55, F.top + w * 6.6);
  p.lineTo(x - w * 0.55, F.bot);
  p.lineTo(x + w * 0.55, F.bot);
  p.lineTo(x + w * 0.55, F.top + w * 6.6);
  p.bezierCurveTo(x + w * 0.9, F.top + w * 6, x + w * 1.2, F.top + w * 4.6, x + w * 0.5, F.top + w * 3.3);
  p.closePath();
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fill(p);
  c.strokeStyle = withAlpha(env.mood.rim, 0.25);
  c.lineWidth = w * 0.18;
  c.beginPath();
  c.arc(x, F.top + w * 1.2, w * 1.1, Math.PI * 1.15, Math.PI * 1.75);
  c.stroke();
}

/** an evenly feathered rounded plate (screen px): flat in the middle, soft at every edge (never a radial stain) */
function evenPlate(c: C, x: number, y: number, w: number, h: number, ink: string, alpha: number) {
  if (alpha <= 0.003) return;
  c.save();
  c.filter = "blur(20px)";
  c.fillStyle = withAlpha(ink, alpha);
  c.beginPath();
  c.roundRect(x + 14, y + 14, w - 28, h - 28, 14);
  c.fill();
  c.restore();
}

/** one lamp's light on the study wall behind it: the same radius and warmth for every lamp */
function lampPool(c: C, env: PaintEnv, x: number, t: number, i: number) {
  const m = env.mood;
  const fl = 0.94 + 0.06 * Math.sin(t * 7.3 + i * 2.1) * Math.sin(t * 3.1 + i);
  const cy = FLAME.y + 10;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, cy, 6, x, cy, 300);
  g.addColorStop(0, withAlpha(m.halo, 0.3 * fl));
  g.addColorStop(0.35, withAlpha(m.halo, 0.13 * fl));
  g.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - 300, cy - 300, 600, 600);
  c.restore();
}

// ===================================================================================================== Anthropic stop
const COURT = { dx: 228, base: SHELF_Y - 150 };
const BOOKS = { dx: 222 };
function courtsUp(t: number, b: B) {
  const tq = tq12(t);
  return clamp01((tq - (b.courts - 0.25)) / 0.5) * (1 - clamp01((tq - b.courtsOut) / 0.6));
}
/** the paired court quotes' envelope (0..1): the same timing courtRulings uses */
function quotesUp(t: number, b: B) {
  const until = b.courtsOut + 0.05;
  return Math.min(win(t, b.courts + 0.45, b.courts + 0.95), 1 - win(t, until - 0.4, until));
}
/** the two rulings, paired at one size beneath their courthouses (verbatim, research/quotes.json q14-judge-lin and
 *  q14-katsas); each card's attribution carries its court, month and finding (the script's court label) */
function courtRulings(c: C, cam: Camera3, t: number, b: B, te: { t: number; mood: PaintEnv['mood'] }) {
  const until = b.courtsOut + 0.05;
  // the push on the paired quotes (review round 3): they grow ~1.3x with the camera's push, inside the safe area
  const z = 1 + (QUOTE_PUSH - 1) * win(t, b.courts - 0.3, b.courts + 4.2);
  const cw = 300 * z;
  const base = toScreen(LAYERS.L4, cam, AX, COURT.base).y;
  const y = base + 128 * z;
  const xs = [-1, 1].map((sx) => Math.max(64 + cw / 2, Math.min(1216 - cw / 2, toScreen(LAYERS.L4, cam, AX + sx * COURT.dx, 0).x)));
  const ats = [b.courts + 0.45, b.courts + 0.85];
  const A = Math.min(win(t, ats[0], ats[0] + 0.5), 1 - win(t, until - 0.4, until));
  if (A > 0.003) {
    c.save();
    c.globalAlpha = A;
    for (const x of xs) evenPlate(c, x - 190 * z, y - 60 * z, 380 * z, 200 * z, PUPPET_NEAR_BLACK, 0.26);
    c.restore();
  }
  const cards = [
    { quote: '…not based on any articulable basis to believe that Anthropic would actually sabotage its model.', speaker: 'Judge Lin', source: 'N.D. Cal. · Aug 2026 · unlawful retaliation' },
    { quote: "The Department reasonably feared that Anthropic might manipulate Claude's design", speaker: 'Judge Katsas', source: 'D.C. Cir. · Sep 2026 · upheld 2–1' },
  ];
  cards.forEach((q, i) => {
    quoteCard(c, { ...q, x: xs[i], y, width: cw, maxChars: 34, size: 22 * z, at: ats[i], dur: until - 0.2 - ats[i], fade: 0.4, stagger: 0.18, plate: false }, te);
  });
}
/** the settlement label, in the film's label face at the court label's size, beneath the books (screen-locked to
 *  the stack's foot); the tag above it already carries the date */
function settlementLabel(c: C, cam: Camera3, t: number, b: B, te: { t: number; mood: PaintEnv['mood'] }) {
  const a = win(t, b.books + 0.05, b.books + 0.55) * (1 - win(t, b.settleOut, b.settleOut + 0.45));
  if (a <= 0.003) return;
  const p = toScreen(LAYERS.L4, cam, AX + BOOKS.dx, SHELF_Y - VH - 30);
  // review round 3: the label names the lab again, through legibleSize at the 22 px cap floor, as the subject
  const txt = 'ANTHROPIC · $1.5B SETTLEMENT · PIRATED BOOKS';
  c.save();
  const size = legibleSize(c, `500 22px ${FONT.mono}`, 22, txt);
  c.font = `500 ${size}px ${FONT.mono}`;
  (c as C & { letterSpacing: string }).letterSpacing = '0.6px';
  const w = c.measureText(txt).width;
  const x = Math.min(1216 - w / 2, Math.max(64 + w / 2, p.x));
  evenPlate(c, x - w / 2 - 34, p.y - size - 26, w + 68, size + 52, PUPPET_NEAR_BLACK, 0.4 * a);
  c.globalAlpha = a;
  c.fillStyle = mixLab(te.mood.core, '#ffffff', 0.25);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  textRole(c, 'subject', () => c.fillText(txt, x, p.y));
  c.restore();
}

/** the brass name band across the top of a plinth (every plinth has one); a lab's name letters in on its first
 *  mention and stays to the end (review round 2). One face and size for both labs. */
function nameBand(c: C, env: PaintEnv, x: number, name: string, a: number, role: 'subject' | 'texture' = 'subject') {
  const m = env.mood;
  const brass = mixLab(mixLab(m.halo, '#b08a52', 0.5), m.set, 0.45);
  const w = PLINTH.w - 20;
  c.fillStyle = brass;
  c.fillRect(x - w / 2, BASE_Y + 4, w, NAME_H - 7);
  c.fillStyle = withAlpha(m.rim, 0.5);
  c.fillRect(x - w / 2, BASE_Y + 4, w, 1);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.5);
  for (const sx of [-1, 1]) {
    c.beginPath();
    c.arc(x + sx * (w / 2 - 6), BASE_Y + 4 + (NAME_H - 7) / 2, 1.8, 0, Math.PI * 2);
    c.fill();
  }
  if (!name || a <= 0.01) return;
  c.save();
  c.globalAlpha *= a;
  textRole(c, role, () => {
    c.font = `600 14px ${FONT.mono}`;
    (c as C & { letterSpacing: string }).letterSpacing = name.length > 10 ? '0.3px' : '1.5px';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#20160e';
    c.fillText(name, x, BASE_Y + 4 + (NAME_H - 7) / 2 + 1);
  });
  c.restore();
}

/** review round 4 + reviser r1: ONE plate for every named plinth (GOOGLE DEEPMIND, ANTHROPIC, OPENAI, META): a brass
 *  plaque across the plinth's top, the name at 16-18 px cap in the opening wide (sized through legibleSize, so it holds
 *  its cap at any framing; one line where it fits, else two), never taller than the band above the seals at a stop */
function plinthPlate(c: C, env: PaintEnv, x: number, name: string, a: number, role: 'subject' | 'texture', tall = 1) {
  const m = env.mood;
  const font = (sz: number) => `600 ${sz}px ${FONT.mono}`;
  const w = PLINTH.w - 14;
  const need = legibleSize(c, font(14), 1, name) * (17.5 / 22);
  let sz = Math.max(14, need);
  c.save();
  c.font = font(sz);
  (c as C & { letterSpacing: string }).letterSpacing = '0px';
  const oneLine = c.measureText(name).width <= w - 10 || !name.includes(' ');
  const lines = oneLine ? [name] : name.split(' ');
  while (Math.max(...lines.map((l) => c.measureText(l).width)) > w - 8 && sz > 10) {
    sz -= 0.5;
    c.font = font(sz);
  }
  const lh = sz * 1.12;
  // in the wide every plate is the same two-line plate (one name centred on it), so the four plinths match; at a stop
  // (tall 0) a one-line plate settles to the band above the seals
  const twoH = 2 * lh + 12;
  const h = Math.min(PLINTH.h - 8, Math.max(NAME_H - 7, lines.length * lh + (lines.length > 1 ? 12 : 4), twoH * tall));
  const brass = mixLab(mixLab(m.halo, '#b08a52', 0.5), m.set, 0.45);
  c.fillStyle = brass;
  c.fillRect(x - w / 2, BASE_Y + 4, w, h);
  c.fillStyle = withAlpha(m.rim, 0.5);
  c.fillRect(x - w / 2, BASE_Y + 4, w, 1);
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.5);
  for (const sx of [-1, 1]) {
    c.beginPath();
    c.arc(x + sx * (w / 2 - 5), BASE_Y + 4 + h / 2, 1.8, 0, Math.PI * 2);
    c.fill();
  }
  if (a > 0.01) {
    c.globalAlpha *= a;
    textRole(c, role, () => {
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = '#20160e';
      const y0 = BASE_Y + 4 + h / 2 - ((lines.length - 1) * lh) / 2 + 1;
      lines.forEach((l, i) => c.fillText(l, x, y0 + i * lh));
    });
  }
  c.restore();
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
  // (it does not vanish: drawn back to the right, half sunk, it waits there until the courthouses rise in its
  // place, so the stop never empties between beats)
  const up = clamp01((tq - (b.pent - 0.21)) / 0.5);
  const away = sm(clamp01((tq - b.risk - 0.25) / 0.9));
  const gone = sm(clamp01((tq - b.courts + 0.2) / 0.6));
  if (up > 0 && gone < 1) {
    c.save();
    c.globalAlpha *= 1 - 0.35 * away;
    officeBlock(c, AX + 214 + away * 120, SHELF_Y + rise(up, VH) + away * 34 + gone * (VH + 50), env);
    c.restore();
  }
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
      // both gavels fall on 'split', opposite ways (the right one two drawings later)
      const g = sm(clamp01((tq - (b.split - 0.2 + (sx < 0 ? 0 : 0.17))) / 0.2));
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
  // the tug: two drawings at ~10.3 s the thread snaps taut and the seals lurch toward the building; then they hold
  const tugAt = b.pent + 0.6;
  const tug = tq >= tugAt && tq < tugAt + 0.166 ? 1 : 0;
  const ea = win(t, b.eye - 0.1, b.eye + 0.3);
  const da = win(t, b.drone - 0.1, b.drone + 0.3);
  const s1 = { x: AX - SEAL.dx, y: SEAL.y };
  const s2 = { x: AX + SEAL.dx, y: SEAL.y };
  const up = clamp01((tq - (b.pent + 0.29)) / 0.3);
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
        if (tug) c.lineTo(s.x + 18, s.y - 14);
        else c.quadraticCurveTo(mid.x, mid.y + 14, s.x + 14, s.y - 14);
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
  // reviser r1: on 'signed' the Pentagon's string, cut from the Anthropic plinth, draws taut toward the right of frame
  // (the OpenAI lamp, off frame to the right), a glint running along it; it goes with the office block
  {
    const sg = sm(clamp01((tq - (b.signed - 0.05)) / 0.45));
    const gone = sm(clamp01((tq - b.courts + 0.2) / 0.6));
    if (sg > 0 && gone < 1) {
      const away = sm(clamp01((tq - b.risk - 0.25) / 0.9));
      // it unhooks from the drone seal's hook and is drawn across the frame: its near end slides to the office block's
      // roof, its far end runs out taut past the right edge to the OpenAI plinth
      const hook = { x: s2.x + 22, y: s2.y - 14 };
      const roof = { x: AX + 214 + away * 120 - 46, y: SHELF_Y + away * 34 - (VH - 16) - 6 };
      const to = { x: OX - PLINTH.w / 2 + 6, y: BASE_Y + 12 };
      const from = { x: lerp(hook.x, roof.x, sg), y: lerp(hook.y, roof.y, sg) };
      const end = { x: lerp(hook.x + 30, to.x, sg), y: lerp(hook.y + 8, to.y, sg) };
      c.save();
      c.globalAlpha *= 1 - gone;
      c.strokeStyle = withAlpha(paperCol(env), 0.95);
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(from.x, from.y);
      if (sg < 1) c.quadraticCurveTo((from.x + end.x) / 2, Math.max(from.y, end.y) + 26 * (1 - sg), end.x, end.y);
      else c.lineTo(end.x, end.y);
      c.stroke();
      const run = pulse(t, b.signed + 0.42, 0.05, 0.5);
      if (run > 0.01) {
        const u = clamp01((t - b.signed - 0.42) / 0.5);
        const gx = lerp(from.x, end.x, u), gy = lerp(from.y, end.y, u);
        c.globalCompositeOperation = 'lighter';
        const gg = c.createRadialGradient(gx, gy, 0, gx, gy, 14);
        gg.addColorStop(0, withAlpha(m.core, 0.8 * run));
        gg.addColorStop(1, withAlpha(m.core, 0));
        c.fillStyle = gg;
        c.fillRect(gx - 14, gy - 14, 28, 28);
      }
      c.restore();
    }
  }
  seal(c, env, s1.x + tug * 4, s1.y - tug * 2, 'eye', ea, tug * 0.12);
  seal(c, env, s2.x + tug * 6, s2.y - tug * 2, 'drone', da, tug * 0.16);
}

// ===================================================================================================== OpenAI stop
/** FAIRNESS: the OpenAI vignette mirrors the Anthropic one: the case stands left of the lamp and the building right
 *  (as the office block and courthouses flank the Anthropic lamp); the pipe between them runs BEHIND the plinth (the
 *  plinth stays plain, as Anthropic's is without its seals), and the valve is a dark cut-paper handwheel on the pipe
 *  in the gap between the case and the plinth (review round 1: no roundel, nothing that reads as a third seal) */
const TERR = { x: OX - 200, w: 112, h: 52, dome: 22, base: 10 };
const BLD = { x: OX + 212, w: 84, h: VH };
const PIPE_Y = SEAL.y;
const VALVE = { x: OX - 115, r: 15 };
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
  c.rect(OX - 420, 0, 840, SHELF_Y);
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
  // the pipe from the case's side to the building, passing behind the plinth (a lit top edge)
  {
    const a = sm(up);
    const px0 = TERR.x + TERR.w / 2, px1 = BLD.x - BLD.w / 2;
    const yy = PIPE_Y + (1 - a) * 12;
    c.save();
    c.globalAlpha *= a;
    c.fillStyle = mixLab(PUPPET_NEAR_BLACK, m.set, 0.35);
    c.fillRect(px0, yy - 4, px1 - px0, 8);
    c.fillRect(px1 - 4, yy - 7, 6, 14);
    c.fillStyle = withAlpha(m.rim, 0.5);
    c.fillRect(px0, yy - 4, px1 - px0, 1);
    // the agents travelling the pipe (small sparks of light) after they leave the case (behind the plinth too)
    for (let k = 0; k < 3; k++) {
      const g = agentGo(t, b, k);
      if (g <= 0.5 || g >= 1) continue;
      const x = lerp(px0, px1, (g - 0.5) / 0.5);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const gg = c.createRadialGradient(x, yy, 0, x, yy, 11);
      gg.addColorStop(0, withAlpha(m.core, 0.85));
      gg.addColorStop(1, withAlpha(m.core, 0));
      c.fillStyle = gg;
      c.fillRect(x - 11, yy - 11, 22, 22);
      c.restore();
    }
    c.restore();
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
  // the pipe's mouth at the case's side (the run itself passes behind the plinth: openaiBack)
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, m.set, 0.35);
  c.fillRect(tx1 - 2, PIPE_Y - 7, 6, 14);
  c.fillRect(tx1, PIPE_Y - 4, VALVE.x - tx1 + 2, 8);
  c.fillStyle = withAlpha(m.rim, 0.5);
  c.fillRect(tx1, PIPE_Y - 4, VALVE.x - tx1 + 2, 1);
  // the valve: a dark cut-paper handwheel on its body on the pipe (ink, the lamp's rim along its top), turned a
  // quarter turn open on 'lowered' (on the twos)
  const vo = sm(clamp01((tq - (b.lowered - 0.19)) / 0.6));
  const vink = PUPPET_NEAR_BLACK;
  c.fillStyle = vink;
  c.fillRect(VALVE.x - 5, PIPE_Y - 12, 10, 24); // the valve body round the pipe, behind the wheel
  c.save();
  c.translate(VALVE.x, PIPE_Y);
  const rot = vo * Math.PI * 0.5 + Math.PI / 4;
  c.rotate(rot);
  c.strokeStyle = vink;
  c.lineWidth = 4.2;
  c.beginPath();
  c.arc(0, 0, VALVE.r, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = 2.6;
  c.beginPath();
  for (let k = 0; k < 4; k++) {
    c.moveTo(0, 0);
    c.lineTo(Math.cos((k * Math.PI) / 2) * VALVE.r, Math.sin((k * Math.PI) / 2) * VALVE.r);
  }
  c.stroke();
  c.fillStyle = vink;
  c.beginPath();
  c.arc(0, 0, 4, 0, Math.PI * 2);
  c.fill();
  // the handle knob on the rim (shows the quarter turn)
  c.beginPath();
  c.arc(VALVE.r, 0, 3.6, 0, Math.PI * 2);
  c.fill();
  c.restore();
  // the lamp's rim along the wheel's top (screen-fixed light: it stays on top as the wheel turns)
  c.strokeStyle = withAlpha(m.rim, 0.7);
  c.lineWidth = 1.2;
  c.beginPath();
  c.arc(VALVE.x, PIPE_Y, VALVE.r + 2, Math.PI * 1.15, Math.PI * 1.85);
  c.stroke();
  // the glint on the handle ('broke')
  const gl = pulse(t, b.broke - 0.05, 0.1, 0.6);
  if (gl > 0.01) {
    const hx = VALVE.x + Math.cos(rot) * VALVE.r, hy = PIPE_Y + Math.sin(rot) * VALVE.r;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(hx, hy, 0, hx, hy, 20);
    g.addColorStop(0, withAlpha(m.core, 0.9 * gl));
    g.addColorStop(1, withAlpha(m.core, 0));
    c.fillStyle = g;
    c.fillRect(hx - 20, hy - 20, 40, 40);
    c.restore();
  }
  c.restore();
}
