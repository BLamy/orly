/**
 * ch15-s01 — Case Status: Open. A phone lights in an empty hotel room at 2 a.m.; its glow becomes a Nobel medallion;
 * the medallion's rim match-cuts into an arch of the Hall of Mirrors (chapter 5), where the mirrored figures that
 * once looked away turn at last toward the physicist; a critic's card; a second medallion folds a protein.
 * (candleAmber → the hall's gold; 44.5 s; in: fadeBlack.) Review round 4: re-fit to the longer L1502 take (the
 * Versailles callback): every hall beat rides T.word ('Hopfield' the match cut, 'Versailles' the mirrored figures
 * begin to turn toward him, 'memories' a slow push onto the medallion, 'Boltzmann' the ease back to the wide hall).
 *
 *   0.1        the CHAPTER INDEX TAB 'Case Status: Open' drops at top-left, holds 2.5 s, slides up
 *   0 → 5.3    fade up on the dark room (bed edge, bedside table, a sash window, net drapes, a car-park light);
 *              a slow push toward the face-down phone. Nobody is shown.
 *   'phone'    the phone lights and buzzes (two short pulses, on twos); a small cold rectangle on the ceiling;
 *              CALIFORNIA · 8 OCTOBER 2024
 *   b2         the second buzz; GEOFFREY HINTON's name card beside it (the phone is his)
 *   'Nobel'    the glow warms and blooms into a gold medallion that rises and turns edge-on → face-on; a paper
 *              ribbon unrolls beneath it with the physics citation
 *   'Hopfield' MATCH CUT: the medallion's rim settles into the round head of a mirror arch in the Hall of Mirrors;
 *              the physicist at a lectern; his name card JOHN HOPFIELD
 *   'Versailles' the mirrored figures begin to turn toward him, one by one (profile → facing out of the glass): the
 *              hall that once did not look now looks; the crowd behind them ripples round through the rest of the shot
 *   'memories' a slow push onto the medallion; on 'downhill' an engraved hollow on its blank face, a paper ball rolls
 *              in and settles (the 1982 memory)
 *   'Boltzmann' the camera eases back out to the wide hall
 *   'cools'    the haze around the medallion cools to pale and warms back (a net that settles as it cools)
 *   'cheered'  the ribbon's lettering fades; Dame Wendy Hall's card; one mirrored figure at the hall's rim stays
 *              turned away
 *   'chemistry's' the card fades; in the next arch a second gold medallion turns face-on; the DeepMind name card
 *   'proteins' a thin paper ribbon on its face folds itself into a small knotted protein and settles
 *   end        the two medallions side by side; the figures finish turning; one stays turned away
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv, Palette, Pose } from '../../../film';
import {
  CAMERA3_HOME, LAYERS, MOODS, PUPPET_NEAR_BLACK, POSES, defineShot, mixLab, nameCard, overscan, placeStamp, podium, quoteCard,
  toScreen, withAlpha, withLife,
} from '../../../film';
import { hash1 } from '../../../film/core/frame';
import { SPECS, cast } from '../cast';
import { createPuppet } from '../../../film/silhouette/puppet';
import { CHANDELIERS, HALL5, archPath, hall15 } from '../sets/ch15-s01-hall';
import { indexTab } from '../sets/indexTab';
import { figure15 } from '../sets/ch15-s01-figures';
import { compositeSub, monotone, subFrame } from '../sets/ch02-s05b-util';
import { clamp01, goldMedallion, lerp, pulse, ribbonBanner, screen, sm, tq12, win } from '../sets/ch15-s01-kit';
import { godRays } from '../../../film/silhouette/atmosphere';
import { FONT, cardProbe, legibleSize, softPlate, textProbe, textSwapIn } from '../../../film/silhouette/type';

const ID = 'ch15-s01';
type C = CanvasRenderingContext2D;

// ===================================================================================================== camera math
/** a camera that puts layer point p at screen point s with relative layer scale k (dolly only, lens 1) */
function frameOnLayer(L: Pick<LayerSpec, 'z'>, p: { x: number; y: number }, s: { x: number; y: number }, k: number): Camera3 {
  const z = L.z - L.z / k;
  const sa = (1000 * k) / L.z;
  return { x: 640 + (640 + (p.x - 640) * k - s.x) / sa, y: 360 + (360 + (p.y - 360) * k - s.y) / sa, z, lens: 1 };
}
type Key = [t: number, px: number, py: number, sx: number, sy: number, k: number];
function camPath(L: Pick<LayerSpec, 'z'>, keys: Key[]) {
  const ch = [1, 2, 3, 4].map((j) => monotone(keys.map((q) => [q[0], q[j]] as [number, number])));
  const fk = monotone(keys.map((q) => [q[0], Math.log(q[5])] as [number, number]));
  return (t: number) => frameOnLayer(L, { x: ch[0](t), y: ch[1](t) }, { x: ch[2](t), y: ch[3](t) }, Math.exp(fk(t)));
}

// ===================================================================================================== the room
const ROOM = {
  window: { x: 168, y: 194, w: 270, h: 278 },
  floorY: 600,
  ceilY: 172,
  table: { x: 610, w: 210, top: 520 },
  phone: { x: 690, y: 520, w: 78, h: 9 },
  lamp: { x: 776 },
  post: { x: 318, y: 214 },
};
const PHONE_C = { x: ROOM.phone.x, y: ROOM.phone.y - ROOM.phone.h / 2 };
/** the medallion's screen pose at the match cut (it continues in the hall's arch at exactly this pose) */
const CUT_M = { x: 640, y: 200, r: 70 };

// ===================================================================================================== the hall
const A1 = HALL5.arch(4);
const A2 = HALL5.arch(5);
/** the medallion hangs in the arch's round head (L2 world); radius in L2 units */
const MED1 = { x: A1.cx, y: A1.spring - 4, r: 62 };
const MED2 = { x: A2.cx, y: A2.spring - 4, r: 62 };
/** Hopfield at a lectern on the action plane, under the gap between the two arches (lands at screen x ≈ 980
 *  at the match cut, fully in frame) */
const HOP = { x: 505, floor: 652 };
const LECT = { x: 438 };
/** Hopfield's position seen in the mirrors' plane (L2 x of his screen x in the wide): the heroes turn toward it */
const HOP_L2X = 634;
/** the crisp mirrored figures the shot turns (L2 world): nearest to the physicist turn first; the one at the
 *  far-left rim (arch 2) never turns */
interface Hero { arch: number; dx: number; s: number; hold?: boolean; hair?: number }
const HEROES: Hero[] = [
  { arch: 2, dx: 6, s: 2.2, hold: true, hair: 0 },
  { arch: 3, dx: -42, s: 2.0, hair: 0 },
  { arch: 3, dx: 42, s: 2.1, hair: 0 },
  { arch: 4, dx: -20, s: 2.2, hair: 0 },
  { arch: 5, dx: 18, s: 2.15, hair: 0 },
  { arch: 6, dx: -42, s: 2.1, hair: 0 },
  { arch: 6, dx: 40, s: 2.0, hair: 0 },
  { arch: 7, dx: 0, s: 2.2, hair: 0 },
];
/** turn order: by distance from the physicist (0.4 s apart, on twos) */
const HERO_ORDER: number[] = (() => {
  const idx = HEROES.map((h, i) => ({ i, d: Math.abs(HALL5.arch(h.arch).cx + h.dx - HOP_L2X) })).filter((q) => !HEROES[q.i].hold);
  idx.sort((a, b) => a.d - b.d);
  const ord = HEROES.map(() => -1);
  idx.forEach((q, k) => (ord[q.i] = k));
  return ord;
})();

interface B {
  D: number;
  phone: number;
  rings: number;
  october: number;
  buzz2: number;
  nobel: number;
  cut: number;
  hop: number;
  memories: number;
  downhill: number;
  boltz: number;
  cools: number;
  turn0: number;
  cheered: number;
  chem: number;
  fold: number;
  turned: number;
  network: number;
}
interface Scene {
  tl: Timeline;
  b: B;
  room: (t: number) => Camera3;
  hall: (t: number) => Camera3;
  RCAMS: Camera3[];
  HCAMS: Camera3[];
  [k: string]: unknown;
}

export default defineShot<Scene>({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      // review round 5: the handset lights cool white ON 'phone' and shivers on 'rings' (the sleeper wakes)
      phone: T.word('L1501', 'phone'),
      rings: T.word('L1501', 'rings'),
      october: T.word('L1501', 'October'),
      buzz2: T.beat('b2'),
      nobel: T.beat('b3'),
      cut: T.word('L1502', 'Hopfield') - 0.12,
      hop: T.word('L1502', 'Hopfield'),
      memories: T.word('L1502', 'memories'),
      downhill: T.word('L1502', 'downhill'),
      boltz: T.word('L1502', 'Boltzmann'),
      cools: T.word('L1502', 'cools'),
      // review round 4: the mirrored figures begin to turn toward Hopfield on 'Versailles' (the Versailles callback)
      turn0: T.word('L1502', 'Versailles'),
      cheered: T.beat('b6'),
      chem: T.beat('chem'),
      fold: T.beat('fold'),
      turned: T.beat('turned'),
      network: T.word('L1529', 'network'),
    };
    // the room: a held wide, then from 1.8 s a real dolly onto the bedside table (1.72x by 10.5 s: the phone
    // ~135 px wide, low in frame so the ceiling patch stays in), then a small tilt up with the medallion
    const roomPhone = frameOnLayer(LAYERS.L4, PHONE_C, { x: 512, y: 548 }, 1.72);
    const room = (t: number): Camera3 => {
      const u = sm((t - 1.8) / (10.5 - 1.8));
      const base: Camera3 = { x: lerp(620, roomPhone.x, u), y: lerp(372, roomPhone.y, u), z: lerp(0, roomPhone.z, u), lens: 1 };
      const up = win(t, b.nobel, b.cut);
      return { ...base, y: base.y - 46 * up, z: base.z + 30 * up };
    };
    const RCAMS: Camera3[] = [];
    for (let i = 0; i <= 24; i++) RCAMS.push(room(((b.cut + 0.6) * i) / 24));
    // the hall: land on the arch head at the cut, a small push for the downhill, the long pull back to the hall,
    // a hold while the figures turn, a drift right to take in the second arch, a slow push to the end
    const mid = { x: (A1.cx + A2.cx) / 2, y: 330 };
    const memories = T.word('L1502', 'memories');
    const boltz = T.word('L1502', 'Boltzmann');
    const network = T.word('L1529', 'network');
    const kCut = CUT_M.r / MED1.r;
    // the cut lands Hopfield fully in frame (x ≈ 980); a hold; on 'memories' a push in until the medallion is
    // ~220 px across (the hollow and the ball read), held through 'downhill', eased back out from 'Boltzmann';
    // the long pull back to the hall for the turning; on 'network' the same push on the second medallion
    // (~200 px: the protein reads), then an ease back to the two medallions side by side
    // camera grammar (round-1 notes): from the cut a near-hold (a 1.1x drift toward the medallion, so the hollow
    // and the ball read and the physicist stays whole in frame while his card reads), ONE slow pull back to the wide
    // hall by the turning; a held wide while the figures turn; then one long slow push onto the two medallions
    // from just before 'chemistry's' that settles after 'proteins' and holds
    // review round 4 (the longer L1502): a near-hold from the cut while the figures begin to turn on 'Versailles';
    // on 'memories' a slow push onto the medallion (the hollow and the ball read on 'downhill'); held to 'Boltzmann',
    // then the ease back out to the wide hall, landing before 'cools' so the cooling haze reads in the hall
    // reviser r1: the medallion TEACHES 'memories that roll downhill' and 'a net that settles as it cools', so from
    // 'memories' -0.2 the camera pushes ~1.4x onto it (the ball reads rolling into the dip on 'downhill', the
    // Boltzmann dots settle into it as the face cools), holds to 'cools' +0.6, then pulls back out for
    // 'Not everyone cheered'
    void network;
    void boltz;
    const meds = (MED1.x + MED2.x) / 2;
    // review round 5 (reviser r1): 1.25x more push between 'roll' and 'downhill' so the ball and, later, the settling
    // cluster read large (the hollow ~20 % of frame height)
    const kPush = kCut * 1.04 * 1.4 * 1.25;
    const keys: Key[] = [
      [b.cut, MED1.x, MED1.y, CUT_M.x, CUT_M.y, kCut],
      [memories - 0.2, MED1.x, MED1.y, 614, 211, kCut * 1.04],
      [b.downhill + 0.25, MED1.x, MED1.y, 640, 292, kPush],
      [b.cools + 0.6, MED1.x, MED1.y, 640, 300, kPush * 1.02],
      [T.word('L1528', 'cheered') + 0.9, mid.x - 30, mid.y, 640, 322, 0.8],
      [b.chem - 0.6, mid.x - 24, mid.y, 640, 324, 0.8],
      [b.fold + 0.4, meds, MED1.y, 640, 232, 1.13],
      [D, meds, MED1.y, 640, 230, 1.14],
    ];
    const hall = camPath(LAYERS.L2, keys);
    const HCAMS: Camera3[] = [];
    for (let i = 0; i <= 80; i++) HCAMS.push(hall(b.cut + ((D - b.cut) * i) / 80));
    tl.hold(0, D);
    return { tl, b, room, hall, RCAMS, HCAMS };
  },
  paint(f, _s, sc) {
    const t = f.t;
    const b = sc.b;
    // the match cut: the room dissolves into the hall over 0.3 s while the medallion holds its screen pose
    const dis = win(t, b.cut - 0.12, b.cut + 0.2);
    if (dis < 1) {
      paintRoom(f, sc, t);
      if (dis > 0) compositeSub(f, subFrame(f, `${ID}/hall`, 'candleAmber', (g) => paintHall(g, sc, t)), dis);
    } else paintHall(f, sc, t);
    const med = medallionPose(sc, t);
    screen(f, (c) => {
      const env = { t, mood: f.mood } as unknown as PaintEnv;
      // the medallion's own warm bloom while it rises out of the phone's glow
      const bl = pulse(t, b.nobel - 0.05, 0.45, 1.6);
      if (bl > 0.01) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(med.x, med.y, 0, med.x, med.y, med.r * 3.2);
        g.addColorStop(0, withAlpha(f.mood.core, 0.42 * bl));
        g.addColorStop(0.4, withAlpha(f.mood.halo, 0.16 * bl));
        g.addColorStop(1, withAlpha(f.mood.halo, 0));
        c.fillStyle = g;
        c.fillRect(med.x - med.r * 3.2, med.y - med.r * 3.2, med.r * 6.4, med.r * 6.4);
        c.restore();
      }
      // the cooling: a pale cool haze breathes round the medallion and goes again
      const cool = pulse(t, b.cools - 0.45, 0.6, 1.3);
      if (cool > 0.01) coolHaze(c, med.x, med.y, med.r, cool);
      if (med.a > 0.003) {
        goldMedallion(c, {
          x: med.x,
          y: med.y,
          r: med.r,
          turn: med.turn,
          alpha: med.a,
          hollow: win(t, b.downhill - 0.5, b.downhill + 0.05),
          ball: t > b.downhill - 0.1 ? clamp01((tq12(t) - (b.downhill - 0.1)) / 1.3) : -1,
          cool: cool * 0.9,
          cord: t > b.cut ? 1 : 0,
        }, env);
        // reviser r1: on 'Boltzmann' a scatter of jittering dots (the net's units, hot) settles into the dip as
        // the face cools (they rest in the basin from 'cools')
        if (t > b.boltz - 0.05) boltzDots(c, med, t, b, f.mood);
        // review round 5: the two prize ideas named on small paper tags tied to the medallion's rim, one at a time
        prizeTags(c, med, t, b, f.mood);
      }
      // reviser r1: from 'chem' the key light leaves the physicist and finds the second medallion (the protein)
      const key2 = win(t, b.chem - 0.1, b.chem + 1.0);
      const m2k = medallion2Pose(sc, t);
      if (key2 > 0.01 && m2k.a > 0.01) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        const g = c.createRadialGradient(m2k.x, m2k.y, m2k.r * 0.6, m2k.x, m2k.y, m2k.r * 3.4);
        g.addColorStop(0, withAlpha(f.mood.core, 0.26 * key2));
        g.addColorStop(0.45, withAlpha(f.mood.halo, 0.1 * key2));
        g.addColorStop(1, withAlpha(f.mood.halo, 0));
        c.fillStyle = g;
        c.fillRect(m2k.x - m2k.r * 3.4, m2k.y - m2k.r * 3.4, m2k.r * 6.8, m2k.r * 6.8);
        // a soft shaft of key light falling onto it from above
        const sh = c.createLinearGradient(0, m2k.y - 360, 0, m2k.y + m2k.r);
        sh.addColorStop(0, withAlpha(f.mood.halo, 0));
        sh.addColorStop(1, withAlpha(f.mood.halo, 0.09 * key2));
        c.fillStyle = sh;
        c.beginPath();
        c.moveTo(m2k.x - m2k.r * 0.7, m2k.y - 360);
        c.lineTo(m2k.x + m2k.r * 0.7, m2k.y - 360);
        c.lineTo(m2k.x + m2k.r * 1.5, m2k.y + m2k.r);
        c.lineTo(m2k.x - m2k.r * 1.5, m2k.y + m2k.r);
        c.closePath();
        c.fill();
        c.restore();
      }
      // the second medallion (chemistry), in the next arch
      const m2 = medallion2Pose(sc, t);
      if (m2.a > 0.003) {
        goldMedallion(c, {
          x: m2.x,
          y: m2.y,
          r: m2.r,
          turn: m2.turn,
          alpha: m2.a,
          fold: t > b.chem + 1.0 ? clamp01((tq12(t) - (b.fold - 1.05)) / 1.5) : -1,
          cord: 1,
        }, env);
      }
      // the citation ribbon beneath the first medallion: unrolls on 'Nobel', its lettering fades on 'cheered'
      const open = win(t, b.nobel + 0.55, b.nobel + 1.6);
      // the whole ribbon goes with its lettering (no empty plate left over the audience)
      // reviser r1: once JOHN HOPFIELD's card is up the ribbon steps back to ~55 % so the Versailles turn has the frame
      // review round 5: the ribbon is opaque paper, never a double exposure: full value until the medallion push
      // starts ('memories' - 0.2), then gone in 0.4 s (no intermediate alpha is held)
      const rA = 1 - win(t, b.memories - 0.2, b.memories + 0.2);
      if (open > 0 && rA > 0) {
        ribbonBanner(c, {
          text: 'for foundational discoveries and inventions that enable machine learning with artificial neural networks',
          attrib: 'Nobel Prize in Physics, 2024',
          x: 360,
          y: 540,
          width: 580,
          open,
          letters: win(t, b.nobel + 1.0, b.nobel + 1.8),
          alpha: rA,
          size: 20,
        }, { t, mood: f.mood });
      }
      const te = { t, mood: f.mood };
      // the index tab at 1.2x (its title and number well over the legibility floor)
      c.save();
      c.translate(48, 0);
      c.scale(1.2, 1.2);
      c.translate(-48, 0);
      indexTab(c, { title: 'Case Status: Open', at: 0.1, hold: 2.5 }, te);
      c.restore();
      // the date leaves before the ribbon rises (no two text items share the lower frame); on its own dark plate
      // so the cream type holds full contrast over the grey-brown floor
      {
        const at = b.phone + 0.1, dur = b.nobel + 0.35 - (b.phone + 0.1);
        const A = win(t, at, at + 0.4) * (1 - win(t, at + dur - 0.4, at + dur));
        if (A > 0.003) softPlate(c, 48 + 230, 664, 640, 120, PUPPET_NEAR_BLACK, 0.78 * A);
        placeStamp(c, { place: 'California', date: '8 October 2024', year: 2024, at, dur, cps: 0, fade: 0.4, plate: false }, te);
      }
      nameCard(c, { name: 'Geoffrey Hinton', role: '', at: b.buzz2, dur: b.cut - b.buzz2 - 0.1, align: 'right', x: 1196, y: 604 }, te);
      // Hopfield's card beside him on the open (right) side, anchored to him (it rides the slow push with him)
      // and held inside the safe area
      {
        // screen-locked just behind his head on the open (right) side; the push pivots near him so he holds still
        // review round 4: the name leads (JOHN HOPFIELD over the caption), held through 'Versailles'
        nameCard(c, { name: 'JOHN HOPFIELD', role: 'physicist · aged 91', at: b.hop + 0.1, dur: Math.max(2.4, b.turn0 + 1.4 - b.hop), align: 'left', x: 960, y: 318 }, te);
      }
      // Dame Wendy Hall's card: on the clear wall band at top centre-right (the term corner stays free), on its
      // own dark plate, from 'cheered'
      const qa = clamp01(Math.min((t - (b.cheered + 0.18)) / 0.6, (b.chem - 0.2 - t) / 0.6));
      if (qa > 0) softPlate(c, 905, 168, 680, 250, PUPPET_NEAR_BLACK, 0.7 * qa);
      quoteCard(c, {
        quote: '…it does seem a bit of a stretch.',
        speaker: 'Dame Wendy Hall',
        source: '2024',
        x: 905,
        y: 168,
        width: 350,
        size: 32,
        at: b.cheered + 0.18,
        dur: b.chem - b.cheered - 0.3,
        stagger: 0.35,
        plate: false,
      }, te);
      // the chemistry laureates' card: the same kit name card as Hinton's and Hopfield's, lower right
      nameCard(c, { name: 'Demis Hassabis · John Jumper', role: 'DeepMind', at: b.chem + 0.35, dur: Math.min(5.6, b.network - 0.6 - b.chem), align: 'right', x: 1210, y: 586 }, te);
    });
  },
});

// ===================================================================================================== medallion poses
function medallionPose(sc: Scene, t: number): { x: number; y: number; r: number; turn: number; a: number } {
  const b = sc.b;
  if (t < b.cut) {
    // rises out of the phone's light: from the phone (screen) up to the cut pose, turning edge-on → face-on
    const cam = sc.room(t);
    const ph = toScreen(LAYERS.L4, cam, PHONE_C.x, PHONE_C.y);
    const u = sm((tq12(t) - b.nobel) / 1.15);
    const settle = win(t, b.nobel + 1.2, b.cut);
    const r = lerp(lerp(10, 96, u), CUT_M.r, settle);
    return {
      x: lerp(ph.x, CUT_M.x, u),
      y: lerp(ph.y - 6, CUT_M.y, u),
      r,
      turn: sm((tq12(t) - (b.nobel + 0.3)) / 1.25),
      a: win(t, b.nobel - 0.05, b.nobel + 0.35),
    };
  }
  const cam = sc.hall(t);
  const p = toScreen(LAYERS.L2, cam, MED1.x, MED1.y);
  return { x: p.x, y: p.y, r: MED1.r * p.k, turn: 1, a: 1 };
}
function medallion2Pose(sc: Scene, t: number): { x: number; y: number; r: number; turn: number; a: number } {
  const b = sc.b;
  if (t < b.chem - 0.1) return { x: 0, y: 0, r: 0, turn: 0, a: 0 };
  const cam = sc.hall(t);
  const p = toScreen(LAYERS.L2, cam, MED2.x, MED2.y);
  return { x: p.x, y: p.y, r: MED2.r * p.k, turn: sm((tq12(t) - b.chem) / 1.3), a: win(t, b.chem - 0.1, b.chem + 0.35) };
}

/** review round 5: the two prize ideas, named on a small manila tag tied to the medallion's rim (lower right) by a
 *  thread: HOPFIELD NET on 'downhill', then BOLTZMANN MACHINE on 'cools'; gone before 'cheered'. Cap height on the
 *  22 px floor; ink at ~80 % (a label, not a headline).
 *  Reviser r1 (round 5): ONE opaque paper plate carries both names (never two translucent plates stacked, which read
 *  as a half-wiped tag): the Hopfield text lifts off first, the plate re-cuts to the longer width over 2 frames, then
 *  the Boltzmann text inks on 'cools' (never two texts at value together). */
function prizeTags(c: C, med: { x: number; y: number; r: number; a: number }, t: number, b: B, mood: Palette) {
  const gone = 1 - win(t, b.cheered - 0.5, b.cheered - 0.1);
  const plateA = textSwapIn(t, b.downhill, 0.35) * gone * med.a;
  if (plateA <= 0.003) return;
  // (the new name inks from 0.14 s before 'cools', so it is up on the word itself)
  const hopOut = 1 - win(t, b.cools - 0.34, b.cools - 0.22);
  const grow = win(t, b.cools - 0.22, b.cools - 0.22 + 2 / 24);
  const bolIn = textSwapIn(t, b.cools - 0.14, 0.2);
  const tags = [
    { id: `${ID}/tag-hopfield`, text: 'HOPFIELD NET · 1982', a: hopOut },
    { id: `${ID}/tag-boltzmann`, text: 'BOLTZMANN MACHINE · 1983–85', a: bolIn },
  ];
  const ang = (52 * Math.PI) / 180;
  const ax = med.x + Math.cos(ang) * med.r * 0.98, ay = med.y + Math.sin(ang) * med.r * 0.98;
  const paper = mixLab(mixLab(MOODS.parchment.sky[1], mood.halo, 0.22), '#efe2c4', 0.3);
  const edge = mixLab(paper, mood.set, 0.4);
  c.save();
  const size = legibleSize(c, `500 19px ${FONT.mono}`, 19, tags[1].text);
  c.font = `500 ${size}px ${FONT.mono}`;
  const tw0 = c.measureText(tags[0].text).width, tw1 = c.measureText(tags[1].text).width;
  const w = lerp(tw0, tw1, grow) + 34, h = size * 1.55;
  // a small swing on twos as it is hung
  const sway = 0.035 * Math.sin(tq12(t) * 2.1) * (1 - win(t, b.downhill, b.downhill + 2));
  const hx = ax + 14, hy = ay + 30;
  c.globalAlpha = plateA;
  // the thread from the rim to the tag's eyelet
  c.strokeStyle = withAlpha(mixLab(mood.halo, '#e8d9b0', 0.5), 0.8);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(ax, ay);
  c.quadraticCurveTo(ax + 4, ay + 18, hx + 4, hy + h / 2);
  c.stroke();
  c.translate(hx, hy);
  c.rotate(sway);
  // manila tag: clipped corners at the eyelet end
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(12, 0);
  c.lineTo(w, 0);
  c.lineTo(w, h);
  c.lineTo(12, h);
  c.lineTo(0, h - 10);
  c.lineTo(0, 10);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(edge, 0.7);
  c.lineWidth = 1;
  c.stroke();
  c.fillStyle = withAlpha(edge, 0.9);
  c.beginPath();
  c.arc(9, h / 2, 3, 0, Math.PI * 2);
  c.fill();
  // the plate's first line (Hopfield) inks with the paper; the card probe sees whichever name is up
  cardProbe(c, `${ID}/tag`, 0, 0, w, h, plateA, plateA * Math.max(hopOut, bolIn));
  c.textBaseline = 'middle';
  for (const g of tags) {
    if (g.a <= 0.003) continue;
    c.fillStyle = withAlpha('#2a1d0e', 0.82 * g.a);
    c.fillText(g.text, 22, h / 2 + 1);
    textProbe(c, g.id, 22, 0, g === tags[0] ? tw0 : tw1, h, plateA * g.a);
  }
  c.restore();
}

/** the Boltzmann dots (reviser r1): 7 small beads on the medallion's face (its own geometry: the kit's basin, W = 0.7r,
 *  D = 0.36r, y0 = -0.04r). Hot on 'Boltzmann' (scattered over the face, jittering on twos), cooling to rest in the
 *  dip by 'cools'; the jitter amplitude is the temperature */
function boltzDots(c: C, med: { x: number; y: number; r: number; a: number }, t: number, b: B, mood: Palette) {
  const r = med.r;
  const W = r * 0.7, D = r * 0.36, y0 = -r * 0.04;
  const basinY = (u: number) => { const q = Math.max(0, 1 - u * u); return y0 + q * q * D; };
  const heat = 1 - sm((t - b.boltz - 0.2) / (b.cools + 0.25 - b.boltz - 0.2));
  const fade = win(t, b.boltz - 0.05, b.boltz + 0.3) * med.a;
  if (fade <= 0.003) return;
  const tq = tq12(t);
  const step = Math.floor(tq * 12);
  const br = Math.max(2, r * 0.045);
  c.save();
  c.globalAlpha *= fade;
  for (let i = 0; i < 7; i++) {
    // hot home: spread over the face (above the basin line); cold home: a tight cluster in the dip
    const uHot = -0.85 + (1.7 * i) / 6 + 0.08 * hash1(i, 31);
    const liftHot = r * (0.12 + 0.4 * (0.5 + 0.5 * hash1(i, 32)));
    const uCold = (i - 3) * 0.085;
    const u = lerp(uCold, uHot, heat) + heat * 0.09 * hash1(i * 31 + step, 33);
    const lift = lerp(br * 0.95 + (i % 2) * br * 1.6 * (Math.abs(i - 3) < 2 ? 1 : 0), liftHot, heat) + heat * r * 0.06 * hash1(i * 17 + step, 34);
    const x = med.x + u * W;
    const y = med.y + Math.min(basinY(Math.max(-1, Math.min(1, u))) - br * 0.95, basinY(Math.max(-1, Math.min(1, u))) - lift);
    c.fillStyle = mixLab('#f3ead6', mood.halo, 0.2);
    c.beginPath();
    c.arc(x, y, br, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha('#5a3c12', 0.75);
    c.lineWidth = Math.max(0.8, br * 0.22);
    c.stroke();
  }
  c.restore();
}

function coolHaze(c: C, x: number, y: number, r: number, k: number) {
  const cool = mixLab(MOODS.winterBlue.rim, '#e9eef0', 0.35);
  c.save();
  const g = c.createRadialGradient(x, y, r * 0.8, x, y, r * 3.4);
  g.addColorStop(0, withAlpha(cool, 0.32 * k));
  g.addColorStop(0.5, withAlpha(cool, 0.12 * k));
  g.addColorStop(1, withAlpha(cool, 0));
  c.fillStyle = g;
  c.fillRect(x - r * 3.4, y - r * 3.4, r * 6.8, r * 6.8);
  // a few pale motes settling in the cold air
  c.fillStyle = withAlpha('#f4f6f6', 0.5 * k);
  for (let i = 0; i < 26; i++) {
    const a = hash1(i, 5) * Math.PI;
    const d = r * (1.25 + 1.6 * (0.5 + 0.5 * hash1(i, 6)));
    c.beginPath();
    c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8 + (1 - k) * 8, 1.1 + 0.6 * (0.5 + 0.5 * hash1(i, 7)), 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ===================================================================================================== ROOM painter
const rk = (r: { x: number; y: number; w: number; h: number }) => `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`;
function bake(f: Frame, c: C, key: string, r: { x: number; y: number; w: number; h: number }, paint: (cc: C) => void) {
  f.cached(key, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
    cc.translate(-r.x, -r.y);
    paint(cc);
  })(c, r.x, r.y);
}

function paintRoom(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const cam = sc.room(t);
  f.camera(cam);
  const W = ROOM.window;
  // the phone: buzz pulses (on twos), its leak of cold light, then warming on 'Nobel'
  const tq = tq12(t);
  // review round 5: the handset lights cool white ON 'phone' (a 3-frame snap) and holds steady; on 'rings' (and the
  // second ring) it SHIVERS: a mechanical 2-frame jitter, no glow bloom
  const lit = win(t, b.phone - 0.06, b.phone + 0.06);
  const warm = win(t, b.nobel - 0.15, b.nobel + 0.5);
  const buzzing = (t >= b.rings && t < b.rings + 0.5) || (t >= b.buzz2 && t < b.buzz2 + 0.42);
  const jx = buzzing ? (Math.floor(tq * 12) % 2 ? 1.8 : -1.8) : 0;
  f.backlight({ sunX: W.x + W.w / 2, sunY: 300, sunRadius: 420, intensity: 0.42 });

  // L1: the night outside: a dim sky, a low roofline, the car-park lamp on its post
  f.layer('L1', (c, env) => {
    const r = overscan(LAYERS.L1, sc.RCAMS, 60);
    bake(f, c, `${ID}/room/L1/${env.mood.id}/${rk(r)}`, r, (cc) => {
      const m = env.mood;
      const g = cc.createLinearGradient(0, r.y, 0, 520);
      g.addColorStop(0, mixLab(m.sky[0], m.fg, 0.35));
      g.addColorStop(1, mixLab(m.sky[1], m.sky[0], 0.4));
      cc.fillStyle = g;
      cc.fillRect(r.x, r.y, r.w, r.h);
      cc.fillStyle = env.fill('set');
      // a low motel wing and parked car roofs
      cc.fillRect(r.x, 404, r.w, 400);
      for (let i = 0; i < 9; i++) {
        const x = r.x + 40 + i * 120 + hash1(i, 3) * 20;
        cc.beginPath();
        cc.moveTo(x, 404);
        cc.quadraticCurveTo(x + 14, 376, x + 46, 374);
        cc.quadraticCurveTo(x + 80, 376, x + 92, 404);
        cc.fill();
      }
      // the lamp post
      cc.fillRect(ROOM.post.x - 3, ROOM.post.y, 6, 404 - ROOM.post.y);
      cc.fillRect(ROOM.post.x - 3, ROOM.post.y - 4, 42, 6);
      cc.beginPath();
      cc.moveTo(ROOM.post.x + 26, ROOM.post.y + 2);
      cc.lineTo(ROOM.post.x + 50, ROOM.post.y + 2);
      cc.lineTo(ROOM.post.x + 44, ROOM.post.y + 10);
      cc.lineTo(ROOM.post.x + 32, ROOM.post.y + 10);
      cc.closePath();
      cc.fill();
    });
  });
  f.practical({ x: ROOM.post.x + 38, y: ROOM.post.y + 12, kind: 'lamp', seed: 151, intensity: 0.45, radius: 46, layer: 'L1' });

  // L2: the hotel wall (plain), the sash window as a HOLE with thin net drapes, heavy side curtains, a print, the ceiling
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, sc.RCAMS, 60);
    bake(f, c, `${ID}/room/L2c/${env.mood.id}/${rk(r)}`, r, (cc) => {
      const m = env.mood;
      // reviser r1 (round 5): the wall drops ~15 % so the window and the phone are the room's only practicals
      const wall = mixLab(mixLab(env.fill('set'), m.fg, 0.56), PUPPET_NEAR_BLACK, 0.15);
      const p = new Path2D();
      p.rect(r.x, r.y, r.w, r.h);
      p.rect(W.x, W.y, W.w, W.h);
      cc.fillStyle = wall;
      cc.fill(p, 'evenodd');
      // the car-park light washing the wall beside the window
      cc.save();
      cc.clip(p, 'evenodd');
      const wg = cc.createRadialGradient(W.x + W.w / 2, W.y + W.h * 0.45, 30, W.x + W.w / 2, W.y + W.h * 0.45, 620);
      wg.addColorStop(0, withAlpha(mixLab(m.setHaze, m.halo, 0.2), 0.36));
      wg.addColorStop(1, withAlpha(wall, 0));
      cc.fillStyle = wg;
      cc.fillRect(r.x, r.y, r.w, r.h);
      cc.restore();
      // the ceiling plane and its cornice line
      cc.fillStyle = mixLab(wall, m.fg, 0.4);
      cc.fillRect(r.x, r.y, r.w, ROOM.ceilY - r.y);
      cc.fillStyle = withAlpha(m.rim, 0.12);
      cc.fillRect(r.x, ROOM.ceilY, r.w, 1.2);
      // skirting and floor
      cc.fillStyle = mixLab(wall, m.fg, 0.5);
      cc.fillRect(r.x, ROOM.floorY - 14, r.w, 14);
      cc.fillStyle = mixLab(env.fill('set'), m.fg, 0.62);
      cc.fillRect(r.x, ROOM.floorY, r.w, r.y + r.h - ROOM.floorY);
      // the sash: frame, meeting rail, glazing bars
      cc.fillStyle = env.fill('ink');
      cc.fillRect(W.x - 12, W.y - 12, W.w + 24, 12);
      cc.fillRect(W.x - 12, W.y, 12, W.h);
      cc.fillRect(W.x + W.w, W.y, 12, W.h);
      cc.fillRect(W.x - 22, W.y + W.h, W.w + 44, 14);
      cc.fillRect(W.x, W.y + W.h / 2 - 5, W.w, 10);
      cc.fillRect(W.x + W.w / 2 - 3, W.y, 6, W.h);
      // thin net drapes across the glass: a translucent veil with soft vertical folds
      cc.save();
      cc.beginPath();
      cc.rect(W.x, W.y, W.w, W.h);
      cc.clip();
      cc.fillStyle = withAlpha(mixLab(m.rim, m.haze, 0.5), 0.2);
      cc.fillRect(W.x, W.y, W.w, W.h);
      for (let i = 0; i < 18; i++) {
        const x = W.x + (i + 0.5) * (W.w / 18) + hash1(i, 9) * 3;
        const fg = cc.createLinearGradient(x - 8, 0, x + 8, 0);
        fg.addColorStop(0, withAlpha(m.fg, 0));
        fg.addColorStop(0.5, withAlpha(m.fg, 0.16));
        fg.addColorStop(1, withAlpha(m.fg, 0));
        cc.fillStyle = fg;
        cc.fillRect(x - 8, W.y, 16, W.h);
      }
      cc.restore();
      // heavy side curtains (ink, folded), gathered on a rail
      cc.fillStyle = env.fill('ink');
      cc.fillRect(W.x - 70, W.y - 34, W.w + 140, 8);
      for (const side of [-1, 1]) {
        const x0 = side < 0 ? W.x - 66 : W.x + W.w + 6;
        cc.beginPath();
        cc.moveTo(x0, W.y - 26);
        cc.lineTo(x0 + 60, W.y - 26);
        cc.bezierCurveTo(x0 + 60 - side * 10, W.y + 160, x0 + 60 + side * 6, W.y + 330, x0 + 60 - side * 4, ROOM.floorY - 12);
        cc.lineTo(x0, ROOM.floorY - 12);
        cc.closePath();
        cc.fill();
        cc.strokeStyle = withAlpha(m.rim, 0.1);
        cc.lineWidth = 1.2;
        for (let k = 1; k < 4; k++) {
          cc.beginPath();
          cc.moveTo(x0 + k * 15, W.y - 20);
          cc.bezierCurveTo(x0 + k * 15 + 4, W.y + 200, x0 + k * 15 - 4, W.y + 360, x0 + k * 15, ROOM.floorY - 14);
          cc.stroke();
        }
      }
      // a generic framed print above the table (no image: a pale mount, a dark field)
      cc.fillStyle = mixLab(wall, m.fg, 0.5);
      cc.fillRect(880, 190, 200, 140);
      cc.strokeStyle = withAlpha(m.rim, 0.16);
      cc.lineWidth = 1.4;
      cc.strokeRect(880, 190, 200, 140);
      cc.strokeRect(898, 208, 164, 104);
    });
    // the phone's cold rectangle thrown up onto the CEILING (dynamic): a skewed trapezoid just above the cornice
    if (lit > 0.01) {
      const cool = mixLab(MOODS.winterBlue.rim, '#eef3f6', 0.6);
      const hot = mixLab(env.mood.core, env.mood.halo, 0.3);
      const col = mixLab(cool, hot, warm);
      const k = lit * (1 - 0.6 * win(t, b.nobel + 0.2, b.cut));
      const cx = PHONE_C.x - 6 + jx * 0.6;
      const y0 = ROOM.ceilY - 28, y1 = ROOM.ceilY - 3;
      c.save();
      c.beginPath();
      c.rect(-4000, -4000, 9000, 4000 + ROOM.ceilY);
      c.clip();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(cx, (y0 + y1) / 2, 6, cx, (y0 + y1) / 2, 130);
      g.addColorStop(0, withAlpha(col, 0.34 * k));
      g.addColorStop(1, withAlpha(col, 0));
      c.fillStyle = g;
      c.fillRect(cx - 140, y0 - 60, 280, 120);
      // the ceiling round the patch falls darker first, so the cold shape has an edge to sit against
      c.globalCompositeOperation = 'source-over';
      const dk = c.createRadialGradient(cx, (y0 + y1) / 2, 40, cx, (y0 + y1) / 2, 220);
      dk.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0));
      dk.addColorStop(0.5, withAlpha(PUPPET_NEAR_BLACK, 0.3 * k));
      dk.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0));
      c.fillStyle = dk;
      c.fillRect(cx - 230, y0 - 120, 460, 240);
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = withAlpha(col, 0.62 * k);
      c.beginPath();
      c.moveTo(cx - 44, y0);
      c.lineTo(cx + 58, y0);
      c.lineTo(cx + 92, y1);
      c.lineTo(cx - 70, y1);
      c.closePath();
      c.fill();
      c.restore();
    }
  });
  f.fog({ yCenter: 0.62 * 720, height: 0.42 * 720, alpha: 0.1, drift: 5 });

  // L3: an armchair in the corner by the window (empty)
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, sc.RCAMS, 40);
    bake(f, c, `${ID}/room/L3/${env.mood.id}/${rk(r)}`, r, (cc) => {
      cc.fillStyle = env.fill('ink');
      const x = 470, y = 604;
      cc.beginPath();
      cc.moveTo(x, y);
      cc.lineTo(x, y - 70);
      cc.quadraticCurveTo(x - 4, y - 180, x + 30, y - 196);
      cc.lineTo(x + 92, y - 196);
      cc.quadraticCurveTo(x + 118, y - 180, x + 112, y - 96);
      cc.lineTo(x + 140, y - 104);
      cc.quadraticCurveTo(x + 160, y - 100, x + 158, y - 70);
      cc.lineTo(x + 158, y);
      cc.lineTo(x + 146, y);
      cc.lineTo(x + 146, y - 30);
      cc.lineTo(x + 12, y - 30);
      cc.lineTo(x + 12, y);
      cc.closePath();
      cc.fill();
    });
    // the car-park light cut into soft shafts by the net drapes, slanting down across the room
    const W0 = ROOM.window;
    godRays(c, {
      beams: [{ x0: W0.x + 40, y0: W0.y + 20, w0: W0.w * 0.62, x1: W0.x + 360, y1: 720, w1: 380 }],
      intensity: 0.34,
      streaks: 6,
      mullions: 2,
      softness: 18,
      salt: 151,
    }, env);
  });
  // a faint haze band at the sill (screen y of the sill)
  {
    const sill = toScreen(LAYERS.L2, cam, 0, ROOM.window.y + ROOM.window.h).y;
    f.fog({ yCenter: sill + 10, height: 120, alpha: 0.16, drift: 6 });
  }

  // L4: the bedside table, an unlit lamp, the face-down phone
  f.layer('L4', (c, env) => {
    const m = env.mood;
    const T0 = ROOM.table;
    bake(f, c, `${ID}/room/L4b/${m.id}`, { x: T0.x - 40, y: 300, w: T0.w + 80, h: 320 }, (cc) => {
      cc.fillStyle = PUPPET_NEAR_BLACK;
      cc.fillRect(T0.x, T0.top, T0.w, 12);
      cc.fillRect(T0.x + 8, T0.top + 12, T0.w - 16, 58);
      for (const lx of [T0.x + 12, T0.x + T0.w - 22]) cc.fillRect(lx, T0.top + 70, 10, ROOM.floorY - T0.top - 70);
      cc.fillStyle = withAlpha(m.rim, 0.14);
      cc.fillRect(T0.x + 20, T0.top + 22, T0.w - 40, 1);
      cc.beginPath();
      cc.arc(T0.x + T0.w / 2, T0.top + 42, 3, 0, Math.PI * 2);
      cc.fill();
      cc.fillStyle = withAlpha(m.rim, 0.3);
      cc.fillRect(T0.x, T0.top - 0.6, T0.w, 1.2);
      // the unlit lamp: a drum shade on a slim stem
      cc.fillStyle = PUPPET_NEAR_BLACK;
      const L = ROOM.lamp.x;
      cc.fillRect(L - 16, T0.top - 6, 32, 6);
      cc.fillRect(L - 3, T0.top - 92, 6, 88);
      cc.beginPath();
      cc.moveTo(L - 30, T0.top - 92);
      cc.lineTo(L + 30, T0.top - 92);
      cc.lineTo(L + 22, T0.top - 150);
      cc.lineTo(L - 22, T0.top - 150);
      cc.closePath();
      cc.fill();
      cc.fillStyle = withAlpha(m.rim, 0.12);
      cc.fillRect(L - 22, T0.top - 150, 44, 1);
    });
    // the light pooling round the face-down phone (cold, then warming)
    if (lit > 0.01) {
      const cool = mixLab(MOODS.winterBlue.rim, '#eef3f6', 0.6);
      const col = mixLab(cool, mixLab(m.core, m.halo, 0.2), warm);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const k = lit;
      const g = c.createRadialGradient(PHONE_C.x, T0.top, 2, PHONE_C.x, T0.top, 74);
      g.addColorStop(0, withAlpha(col, 0.55 * k));
      g.addColorStop(1, withAlpha(col, 0));
      c.save();
      c.translate(0, T0.top);
      c.scale(1, 0.22);
      c.translate(0, -T0.top);
      c.fillStyle = g;
      c.fillRect(PHONE_C.x - 80, T0.top - 80, 160, 160);
      c.restore();
      c.fillStyle = withAlpha(col, 0.85 * k);
      c.fillRect(ROOM.phone.x - ROOM.phone.w / 2 + 2 + jx, T0.top - 1.2, ROOM.phone.w - 4, 1.4);
      c.restore();
    }
    // the phone itself (face down: a dark slab, its edge catching the leak)
    c.fillStyle = PUPPET_NEAR_BLACK;
    const px = ROOM.phone.x - ROOM.phone.w / 2 + jx;
    c.beginPath();
    c.roundRect(px, T0.top - ROOM.phone.h - 1, ROOM.phone.w, ROOM.phone.h, 2);
    c.fill();
    c.fillStyle = withAlpha(m.rim, 0.35 + 0.3 * lit);
    c.fillRect(px + 2, T0.top - ROOM.phone.h - 1, ROOM.phone.w - 4, 0.9);
  });
  f.rim({ x: -0.4, y: -1 });
  if (lit > 0.01) f.practical({ x: PHONE_C.x + jx, y: ROOM.table.top - 2, kind: 'screen', seed: 152, intensity: 0.38 * lit * (1 + 0.6 * warm), radius: 26 });

  // L5: the bed in the right foreground (blurred): the mattress, a pale pillow, and HINTON asleep under the turned-back
  // blanket (review round 5: the call reaches a sleeping man, not an empty room). His head lifts on 'rings'.
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, sc.RCAMS, 40);
    bake(f, c, `${ID}/room/L5d/${env.mood.id}/${rk(r)}`, r, (cc) => paintBed(cc, env, r));
    paintSleeper(c, env, t, b);
    bake(f, c, `${ID}/room/L5near/${env.mood.id}/${rk(r)}`, r, (cc) => paintNearDrape(cc, env, r));
  });
}

/** the bed (L5 world): its pillow end sits just right of the bedside table, so the push onto the phone keeps the
 *  sleeper's head in frame */
const BED = { x0: 846, top: 534, pillow: { x: 856, w: 150, top: 500 } };
const SLEEP = { headX: 878, y: 512, s: 0.86 };
function paintBed(cc: C, env: PaintEnv, r: { x: number; y: number; w: number; h: number }) {
  const m = env.mood;
  const paperRim = mixLab('#eadfc4', m.rim, 0.3);
  // reviser r1 (round 5): a low headboard behind the pillow (so the shape reads as a BED, not a sofa back): a slim
  // upright with a rounded cap, its top catching the window light with a 1.5 px paper-tone rim
  {
    const hx0 = BED.x0 - 8, hx1 = BED.x0 + 10, top = BED.pillow.top - 30;
    cc.fillStyle = mixLab(PUPPET_NEAR_BLACK, m.set, 0.08);
    cc.beginPath();
    cc.moveTo(hx0, r.y + r.h);
    cc.lineTo(hx0, top + 8);
    cc.quadraticCurveTo(hx0, top - 3, (hx0 + hx1) / 2, top - 3);
    cc.quadraticCurveTo(hx1, top - 3, hx1, top + 8);
    cc.lineTo(hx1, r.y + r.h);
    cc.closePath();
    cc.fill();
    // a turned finial ball on the post
    cc.beginPath();
    cc.arc((hx0 + hx1) / 2, top - 9, 7, 0, Math.PI * 2);
    cc.fill();
    cc.strokeStyle = withAlpha(paperRim, 0.7);
    cc.lineWidth = 1.5;
    cc.beginPath();
    cc.arc((hx0 + hx1) / 2, top - 9, 7, Math.PI * 1.05, Math.PI * 1.75);
    cc.stroke();
    cc.beginPath();
    cc.moveTo(hx0 + 0.7, top + 30);
    cc.lineTo(hx0 + 0.7, top + 6);
    cc.quadraticCurveTo(hx0 + 0.7, top - 2, (hx0 + hx1) / 2, top - 2);
    cc.stroke();
  }
  // the mattress and its front face
  cc.fillStyle = mixLab(PUPPET_NEAR_BLACK, m.set, 0.16);
  cc.beginPath();
  cc.moveTo(BED.x0 - 6, r.y + r.h);
  cc.lineTo(BED.x0 - 6, BED.top + 26);
  cc.quadraticCurveTo(BED.x0 - 6, BED.top, BED.x0 + 20, BED.top);
  cc.lineTo(r.x + r.w, BED.top - 6);
  cc.lineTo(r.x + r.w, r.y + r.h);
  cc.closePath();
  cc.fill();
  // the sheet's edge catching the window light
  cc.strokeStyle = withAlpha(m.rim, 0.22);
  cc.lineWidth = 2;
  cc.beginPath();
  cc.moveTo(BED.x0 - 5, BED.top + 26);
  cc.quadraticCurveTo(BED.x0 - 5, BED.top + 1, BED.x0 + 20, BED.top + 1);
  cc.lineTo(r.x + r.w, BED.top - 5);
  cc.stroke();
  // the pillow: pale linen in the dark room (the sleeper's profile reads against it)
  const P = BED.pillow;
  const pg = cc.createLinearGradient(0, P.top, 0, BED.top);
  pg.addColorStop(0, mixLab(mixLab(m.setHaze, m.haze, 0.5), m.rim, 0.22));
  pg.addColorStop(1, mixLab(m.set, m.setHaze, 0.6));
  cc.fillStyle = pg;
  cc.beginPath();
  cc.moveTo(P.x, BED.top + 2);
  cc.bezierCurveTo(P.x - 10, P.top + 18, P.x + 6, P.top - 2, P.x + 36, P.top + 2);
  cc.bezierCurveTo(P.x + 80, P.top + 8, P.x + 120, P.top - 2, P.x + P.w - 6, P.top + 6);
  cc.bezierCurveTo(P.x + P.w + 8, P.top + 16, P.x + P.w + 2, BED.top - 4, P.x + P.w - 10, BED.top + 2);
  cc.closePath();
  cc.fill();
  cc.strokeStyle = withAlpha(m.rim, 0.3);
  cc.lineWidth = 1.6;
  cc.beginPath();
  cc.moveTo(P.x + 4, P.top + 14);
  cc.bezierCurveTo(P.x + 10, P.top + 1, P.x + 40, P.top + 1, P.x + 70, P.top + 5);
  cc.stroke();
}

/** Geoffrey Hinton (cast.ts 'hinton': sweptBack hair) lying on his back, head on the pillow, face to the ceiling,
 *  drawn as the cast puppet laid on its side (local up -> stage left); no face detail. Only his head and collar are
 *  drawn (clipped at the blanket's edge). Breathes on twos; on 'rings' his head and shoulders lift off the pillow
 *  toward the phone. */
function paintSleeper(c: C, env: PaintEnv, t: number, b: B) {
  const P = cast.hinton;
  const s = SLEEP.s;
  const H = P.spec.height * s;
  const tq = tq12(t);
  const breath = Math.sin((tq * Math.PI * 2) / 4.6);
  // reviser r1 (round 5): a READABLE lift on 'rings': ~12 deg about the neck (the head rises ~14 px at 1080p toward
  // the table), on twos (tq), starting on the word and landing by ~10.1
  const lift = sm((tq - b.rings) / 0.4);
  const ox = SLEEP.headX + H, oy = SLEEP.y;
  const bx = SLEEP.headX + H * 0.15;
  const pivot = { x: SLEEP.headX + 40, y: oy + 4 };
  const pose: Pose = {
    ...POSES.rest,
    angles: { ...POSES.rest.angles, torso: 0, neck: -4, head: -4, shoulderF: -4, elbowF: 8, shoulderB: -4, elbowB: 8 },
  };
  c.save();
  // only what is above the bedclothes: the head and the collar
  c.beginPath();
  c.rect(SLEEP.headX - 400, oy - 400, bx + 26 - (SLEEP.headX - 400), 800);
  c.clip();
  c.translate(pivot.x - 1.5 * lift, pivot.y);
  c.rotate(0.21 * lift);
  c.translate(-pivot.x, -pivot.y);
  c.translate(ox, oy - breath * 0.5);
  c.rotate(-Math.PI / 2);
  // edge rim toward the phone and the window (stage up-left = local (0.6, -1) after the quarter turn)
  P.draw(c, { x: 0, y: 0, facing: 'right', pose, scale: s, ink: PUPPET_NEAR_BLACK, edgeRim: { x: 0.6, y: -1, px: 2.25, alpha: 0.85 } }, env);
  c.restore();
  // the blanket, turned back below the chin: a soft rounded hump over the shoulder and chest (it stays on the bed
  // while he lifts); breathing lifts it a pixel
  // reviser r1 (round 5): the blanket sits LOW (below the face line), a body's contour under it (chest, a dip at the
  // waist, the hip, the legs running off), so it reads as a man asleep under a blanket, not a sofa back; its turned-
  // back edge carries a 1.5 px paper-tone rim and a pale band of sheet
  const m = env.mood;
  const top = oy - 2 - breath * 1.1;
  const blanket = new Path2D();
  blanket.moveTo(bx - 14, BED.top + 6);
  blanket.bezierCurveTo(bx - 18, top + 18, bx - 8, top + 2, bx + 22, top - 1);
  blanket.bezierCurveTo(bx + 60, top - 5, bx + 100, top - 4, bx + 140, top + 4);
  blanket.bezierCurveTo(bx + 175, top + 10, bx + 205, top + 6, bx + 240, top + 1);
  blanket.bezierCurveTo(bx + 290, top - 4, bx + 330, top + 10, bx + 420, top + 16);
  blanket.lineTo(bx + 600, top + 20);
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, m.set, 0.12);
  const body = new Path2D(blanket);
  body.lineTo(bx + 600, BED.top + 220);
  body.lineTo(bx - 14, BED.top + 220);
  body.closePath();
  c.fill(body);
  c.strokeStyle = withAlpha(mixLab('#eadfc4', m.rim, 0.3), 0.75);
  c.lineWidth = 1.5;
  c.stroke(blanket);
  // the turned-back fold: a paler band of sheet just under the edge, over the chest
  c.strokeStyle = withAlpha(mixLab(mixLab(m.setHaze, m.haze, 0.35), '#eadfc4', 0.25), 0.55);
  c.lineWidth = 3.5;
  c.beginPath();
  c.moveTo(bx - 9, top + 15);
  c.bezierCurveTo(bx - 3, top + 6, bx + 20, top + 4, bx + 40, top + 3);
  c.bezierCurveTo(bx + 80, top + 1, bx + 110, top + 3, bx + 132, top + 8);
  c.stroke();
}

/** reviser r1 (round 5): the near plane: the edge of a heavy drape at the right frame edge (L5, blurred), its inner
 *  edge rimmed by the window light; it slides against the wall and the table through the push (three planes) and
 *  stays partly in frame at the end of the push */
function paintNearDrape(cc: C, env: PaintEnv, r: { x: number; y: number; w: number; h: number }) {
  const m = env.mood;
  const x0 = 1018;
  const ink = mixLab(PUPPET_NEAR_BLACK, m.set, 0.05);
  cc.fillStyle = ink;
  cc.beginPath();
  cc.moveTo(x0 + 26, r.y);
  cc.bezierCurveTo(x0 + 6, 300, x0 + 18, 470, x0, r.y + r.h);
  cc.lineTo(r.x + r.w, r.y + r.h);
  cc.lineTo(r.x + r.w, r.y);
  cc.closePath();
  cc.fill();
  // fold shadows / lit ridges
  cc.strokeStyle = withAlpha(m.rim, 0.08);
  cc.lineWidth = 2;
  for (let k = 1; k < 4; k++) {
    cc.beginPath();
    cc.moveTo(x0 + 26 + k * 34, r.y);
    cc.bezierCurveTo(x0 + 10 + k * 34, 320, x0 + 22 + k * 34, 480, x0 + 6 + k * 34, r.y + r.h);
    cc.stroke();
  }
  cc.strokeStyle = withAlpha(mixLab('#eadfc4', m.halo, 0.35), 0.5);
  cc.lineWidth = 1.5;
  cc.beginPath();
  cc.moveTo(x0 + 26, r.y);
  cc.bezierCurveTo(x0 + 6, 300, x0 + 18, 470, x0, r.y + r.h);
  cc.stroke();
}

// ===================================================================================================== HALL painter
/** the reflected crowd behind the heroes (rows 1-2, smaller, hazed): backs of heads to us that ripple round to
 *  profiles facing the physicist once the heroes have turned (the far-left rim arch never turns) */
function backCrowd(c: C, env: PaintEnv, i: number, turn: number) {
  const a = HALL5.arch(i);
  for (let row = 2; row >= 1; row--) {
    const n = row === 2 ? 4 : 3;
    const s = 1.22 - row * 0.17;
    const y = a.sill + 8 - row * 40;
    const ink = mixLab(env.mood.ink, env.mood.haze, 0.18 + row * 0.1);
    for (let k = 0; k < n; k++) {
      const id = i * 97 + row * 13 + k;
      const x = a.cx - a.w / 2 + 18 + ((k + 0.5) * (a.w - 36)) / n + hash1(id, 5) * 5 + (row % 2) * 8;
      const toward = x < HOP_L2X ? 1 : -1;
      const dist = Math.min(1, Math.abs(x - HOP_L2X) / 900);
      const order = 0.35 + 0.4 * dist + 0.2 * (0.5 + 0.5 * hash1(id, 77));
      const turned = i !== 2 && turn > order;
      const type = Math.floor((0.5 + 0.5 * hash1(id, 41)) * 6);
      figure15(c, x, y + hash1(id, 7) * 2, s * (1 + hash1(id, 11) * 0.05), turned ? toward : 0, ink, type, turned ? 0.05 : 0);
    }
  }
}

/** the crisp mirrored figures (L2 world, drawn in the hall's crisp L2 pass): each starts with its back to us and
 *  turns, on twos, through one three-quarter drawing to a profile facing the physicist; the turned face catches
 *  the chandeliers' warmth. The holdout at the rim turns the other way on 'cheered', with a faint rim. */
function heroFigures(c: C, env: PaintEnv, t: number, b: B) {
  const m = env.mood;
  const tq = tq12(t);
  const ink = mixLab(PUPPET_NEAR_BLACK, m.haze, 0.06);
  const warmRim = mixLab(m.halo, m.core, 0.45);
  HEROES.forEach((h, i) => {
    const a = HALL5.arch(h.arch);
    const x = a.cx + h.dx;
    const y = a.sill - 40;
    const toward = x < HOP_L2X ? 1 : -1;
    let view = 0;
    let lit = 0;
    const at = h.hold ? b.cheered : b.turn0 + 0.4 * HERO_ORDER[i];
    const to = h.hold ? -toward : toward;
    if (tq >= at + 1 / 6) {
      view = to;
      lit = clamp01((tq - at) / 0.5);
    } else if (tq >= at) view = 0.5 * to;
    const type = HERO_TYPES[i % HERO_TYPES.length];
    // a small settle as the head comes round (on twos)
    const bob = tq >= at && tq < at + 0.34 ? -2 * h.s * (1 - (tq - at) / 0.34) : 0;
    c.save();
    const p = new Path2D();
    archPath(p, a.cx, a.w - 6, a.spring, a.sill);
    c.clip(p);
    // a hairline rim on every figure so the shape (and its turn) reads against the bright glass
    const rimCol = h.hold ? warmRim : m.rim;
    const rimA = h.hold ? 0.3 + 0.55 * lit : 0.26 + 0.3 * lit;
    c.save();
    c.globalAlpha = rimA;
    figure15(c, x - 1.6 * (view > 0 ? -1 : 1), y - 1.6 + bob, h.s, view, rimCol, type, view === to && !h.hold ? 0.04 : 0);
    if (h.hold) figure15(c, x + 1.6 * (view > 0 ? -1 : 1), y - 1.6 + bob, h.s, view, rimCol, type, 0);
    c.restore();
    figure15(c, x, y + bob, h.s, view, ink, type, view === to && !h.hold ? 0.04 : 0);
    c.restore();
  });
}
const HERO_TYPES = [5, 0, 1, 4, 3, 2, 1, 0];

/** reviser r1: the 2024 physicist (aged 91) wears the bald crown, not the 1982 receding cut: the receding style's
 *  hairline cut ran parallel to the back of the skull and read as a second head behind his profile */
const HOP_P = createPuppet({ ...SPECS.hopfield, hair: 'bald' });
void cast;
function paintHall(f: Frame, sc: Scene, t: number) {
  const b = sc.b;
  const cam = sc.hall(t);
  f.camera(cam);
  f.setMood('dawnGold', { from: 'candleAmber', u: 0.62 });
  const turn = sm((t - b.turn0 - 1.2) / (b.turned - b.turn0 - 1.2));
  const tq = tq12(t);
  hall15(f, {
    key: ID,
    cams: sc.HCAMS,
    rays: 0.7,
    candles: 1,
    inMirror: (c, env, i) => {
      // cull mirrors off screen
      const s = toScreen(LAYERS.L2, cam, HALL5.arch(i).cx, 400);
      if (s.x < -200 || s.x > 1480) return;
      backCrowd(c, env, i, turn);
    },
    hero: (c, env) => heroFigures(c, env, t, b),
    // the near chandeliers swing out of the way while the camera is pushed in on a medallion
    near: 1 - win(toScreen(LAYERS.L2, cam, 0, 0).k, 1.18, 1.45),
    action: (c, env) => {
      // the physicist at a lectern, facing the first medallion's arch
      const pz: Pose = withLife({ ...POSES.stand, angles: { ...POSES.stand.angles, head: -2, neck: 6 } }, tq, 1982, 0.8);
      podium(c, { x: LECT.x, y: HOP.floor, s: 1.05 }, env);
      const hopO = { x: HOP.x, y: HOP.floor, facing: 'left' as const, pose: pz, ink: PUPPET_NEAR_BLACK, light: { x: -0.5, y: -1, floor: 0.2 } };
      HOP_P.draw(c, { ...hopO, edgeRim: { x: -0.4, y: -1, px: 1.4, alpha: 0.55 } }, env);
      // reviser r1: on 'chem' his rim light dims to ~40 % (the same figure laid over it without a rim): the key light
      // moves to the second medallion while the voice moves to the chemistry prize
      const dim = 0.6 * win(t, b.chem - 0.1, b.chem + 1.0);
      if (dim > 0.01) {
        c.save();
        c.globalAlpha *= dim;
        HOP_P.draw(c, { ...hopO, edgeRim: { x: -0.4, y: -1, alpha: 0 } }, env);
        c.restore();
      }
    },
  });
  void CAMERA3_HOME;
  void CHANDELIERS;
}
