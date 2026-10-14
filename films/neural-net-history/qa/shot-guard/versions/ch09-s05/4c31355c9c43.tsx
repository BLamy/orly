/**
 * ch09-s05 — at the Wall's far rim two exhibits lift into the light (a panda card flipped to gibbon by invisible
 * changes; two rows of faces ticked unequally by commercial software), the nets' candle burns on, and a new slip is
 * carried along the Wall and pinned in W7 in silence (candleAmber, STUDY LOCK; 24.88 s; in: plain cut).
 *
 *   0          WALL wide under the green-shaded lamp: the slips W1 → W8 from the lamp outward; at the RIM of the
 *              pool (the rim is reserved for doubters), on the side table beneath the far end, two paper exhibits
 *              stand half in shadow. Objects only, no figures.
 *   'doubters' the lamp's edge brightens a little to find them; the camera eases in on the side table
 *   'Changes'  the first exhibit lifts into the light (the camera closes on it, so its caption reads at the 22 px
 *              floor): a stencil-card panda, its typed caption 'panda 57.7%'; a dust
 *              of specks drifts over it, so faint the eye barely finds it
 *   'fool'     the caption flips to 'gibbon 99.3%'; the picture does not change (credit typed on the card:
 *              Goodfellow, Shlens & Szegedy, 2014)
 *   'Commercial' the second lifts: a parchment plate, two rows of cut-paper faces (one row darker paper, one lighter);
 *              the Gender Shades label sets in beneath (it states what was measured: gender misread)
 *   'darker-skinned' a stamp of oxblood ticks falls across the darker row; 'lighter-skinned' a single small tick
 *   'candle'   pulled back to the lamp end: at the bottom of frame the nets' candle (LEARNED FEATURES, GIVEN DATA AND
 *              ARITHMETIC, tag 2012) is caught by the lamp: a live flame, its ghost sleeve five rings tall; its status
 *              tag turns to the viewer (the naming card: lit 2012 · still burning) and on 'argued' adds ', still argued';
 *              (round 1: a clean CUT to it on 'candle', the candle ≈ 1.4× at the frame's bottom edge); the camera holds
 *              on it through 'argued over', then cuts back to the Wall
 *   line end   the pool narrows from the rim; the Wall held near-wide (W1–W8 ≈ 70% of the width, a ≈ 4% drift toward
 *              W7): the hands lift a new slip into the light and carry it along the Wall past the earlier slips,
 *              Coulom's pin (a glint), and W6 in deep shadow (only its corner half-lit)
 *   pinned     W7: the truck stops; the hands withdraw; the pool rests on this slip alone (its due-date box blank,
 *              a plain brass pin; its first clause typed large but only half caught by the lamp; no caption);
 *              the exhibits fall back into shadow
 *   draught    the slip's corner lifts once and settles. Silence.
 *
 * Round 3 (critic): NO name card in the tail (the slip is not captioned here; its small typed prop credit 'as quoted by
 * G. Marcus, 2018' is all). The rim is staged with light: the pool bright on the Wall's lamp end, the exhibits at the
 * rim half in shadow (≈ 0.35) until 'doubters', lifted only to ≈ 0.75; the table framed on the right third. The panda
 * is a stencil-card cut. The candle insert is a low macro at the shelf with the Wall's lower slips above it. The slip
 * is carried along the Wall's top margin (never across the slips' faces) while the camera trucks right; W6's lower
 * corner catches the lamp at 'shadowSlip'.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { FONT, MOODS, cardProbe, defineShot, dustMotes, hash1, legibleSize, mixLab, softPlate, toLayer, toScreen, LAYERS, withAlpha } from '../../../film';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { hands } from '../cast';
import { HAND_LEN } from '../sets/narratorHands';
import { STUDY, candleX, studyCase, studyNear, studyRoom, wallSlotWorld } from '../sets/study';
import { shelfStateAt, wallStateAt } from '../sets/studyState';
import { WALL_SLOTS, drawSlip, wallSlotAt } from '../sets/wallOfForecasts';
import { candleFlame } from '../sets/beliefCandle';
import { oxblood, paperTone } from '../sets/caseBoard';
import { frameOn, mixFrame, wallPool } from '../sets/ch09-s03a-kit';
import { clamp01, lerp, sm, tq12, win } from '../sets/ch02-s05b-util';

type C = CanvasRenderingContext2D;
const ID = 'ch09-s05';

// ------------------------------------------------------------------------------------------------ geometry (L4 world)
const WK = STUDY.wall.k;
const W7 = WALL_SLOTS.W7;
const W7C = wallSlotWorld('W7');
const W7PIN = wallSlotAt(STUDY.wall, 'W7');
const W7V = wallStateAt(ID, 'end').find((s) => s.slot === 'W7')!;
const W1C = wallSlotWorld('W1');
const W5PIN = wallSlotAt(STUDY.wall, 'W5');
/** the side table beneath the Wall's far end, at the rim of the lamp's pool */
const TABLE = { x0: 1676, x1: 1990, top: 610 };
const PANDA = { x: 1750, w: 150, h: 122 };
const PLATE = { x: 1914, w: 150, h: 112 };
/** the nets' candle on the shelf below, at the lamp end */
const SHELF_V = shelfStateAt(ID, 'end');
const LEARNED = SHELF_V.find((v) => v.id === 'learned')!;
const LX = candleX(SHELF_V, 'learned');
const LFLAME = candleFlame({ x: LX, y: STUDY.shelf.y, view: LEARNED, s: STUDY.shelf.s });

// ------------------------------------------------------------------------------------------------ cameras
/** round 1: the opening wide is pushed in so the Wall and its rim exhibits fill ≈ 60% of the width (the lamp's pool
 *  and the rim are the composition's subject), with a slow drift */
/** round 3: the side table sits on the frame's RIGHT third, the lamp's pool lit on the Wall to its left: the light
 *  geometry itself says 'at the rim' */
const TABLE_C = (TABLE.x0 + TABLE.x1) / 2;
const WIDE0 = frameOn({ x: TABLE_C, y: 372 }, { x: 860, y: 360 }, 1.3);
const WIDE1 = frameOn({ x: TABLE_C, y: 376 }, { x: 850, y: 360 }, 1.34);
/** 'Changes' → 'fool': close on the panda card (the plate waits, half-lit, at frame right); the table's centre still
 *  right of the frame's centre, the lit Wall at left */
const PANDA0 = frameOn({ x: PANDA.x, y: 512 }, { x: 690, y: 320 }, 1.9);
const PANDA1 = frameOn({ x: PANDA.x, y: 514 }, { x: 686, y: 320 }, 1.98);
/** 'Commercial': both exhibits, the plate the subject at the right third, the label below it */
const EXHIB0 = frameOn({ x: PLATE.x, y: 516 }, { x: 930, y: 300 }, 1.85);
const EXHIB1 = frameOn({ x: PLATE.x, y: 518 }, { x: 926, y: 300 }, 1.9);
/** 'candle' (round 1: a clean CUT, no whip): the nets' candle ≈ 1.4× larger than before, standing at the frame's
 *  bottom edge with its five-ring ghost sleeve whole, the naming card in the air to its right */
/** round 3: a LOW MACRO at the shelf, at the lamp end beneath the Wall: the candle's flame and sleeve at lower left,
 *  its body running down behind the shelf's soft near lip; the Wall's lower slips (W2's bare pin, W4) in the top right */
const CANDLE0 = frameOn(LFLAME, { x: 420, y: 470 }, 1.15);
const CANDLE1 = frameOn(LFLAME, { x: 426, y: 466 }, 1.19);
/** the slip's journey (round 3): the Wall near-wide, framed high enough that the carry runs along its top margin; the
 *  camera TRUCKS right with the hands during the carry (≈ 5% of the frame's width), then holds still on W7 */
const JOUR0 = frameOn({ x: 1640, y: 300 }, { x: 640, y: 360 }, 1.28);
const JOUR1 = frameOn({ x: 1692, y: 298 }, { x: 640, y: 360 }, 1.3);
const CAMS = [WIDE0, WIDE1, PANDA0, PANDA1, EXHIB0, EXHIB1, CANDLE0, CANDLE1, JOUR0, JOUR1];
/** W6 (the 30-to-50-years slip in shadow): its lower corner, the only part that catches the lamp */
const W6C = wallSlotWorld('W6');
const W6CORNER = { x: W6C.x - (WALL_SLOTS.W6.w * WK) / 2 + 8, y: W6C.y + (WALL_SLOTS.W6.h * WK) / 2 - 6 };

/** the Gender Shades label (verbatim), set in short lines so it stays in the frame's lower-right corner, clear of the
 *  narrator's forearm during the truck */
const LABEL = ['gender misread:', 'darker-skinned women up to 34.7% ·', 'lighter-skinned men up to 0.8%', 'Buolamwini & Gebru, 2018'];
/** the shelf's near lip in the candle macro (L5): its top edge ≈ 690 px down the frame */
const LIP = toLayer(LAYERS.L5, CANDLE0, 0, 688);

interface B {
  D: number;
  rim: number;
  panda: number;
  fool: number;
  faces: number;
  darker: number;
  lighter: number;
  cut1: number;
  candle: number;
  argued: number;
  cut2: number;
  carry: number;
  shadow: number;
  pinned: number;
  draught: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const b: B = {
      D,
      rim: T.beat('rimLit'),
      panda: T.beat('panda'),
      fool: T.beat('fooled'),
      faces: T.beat('faces'),
      darker: T.beat('darkerTicks'),
      lighter: T.beat('lighterTick'),
      // a clean cut to the shelf on 'candle' (round 1: replaces the 1.2 s whip); round 4: five frames ahead of the
      // word, so the naming card is already fully inked when 'candle' is spoken
      cut1: T.beat('burnedOn') - 5 / 24,
      candle: T.beat('burnedOn'),
      argued: T.word('L0910', 'argued'),
      // hold on the candle through 'argued over', then cut to the Wall as the hands lift the slip
      cut2: T.beat('slipCarried') - 0.3,
      carry: T.beat('slipCarried'),
      shadow: T.beat('shadowSlip'),
      pinned: T.beat('slipPinned'),
      draught: T.beat('draught'),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    f.setMood('candleAmber');
    const cam = camAt(b, t);
    f.camera(cam);
    studyRoom(f, { key: ID, cams: CAMS, outside: { mood: 'duskRose', kind: 'night' } });
    f.fog('B');
    const tq = tq12(t);
    // the slip's journey: lifted at the lamp end, carried along the Wall between the rows, pinned in W7
    const slipAt = slipPath(b, tq);
    const glint5 = win(t, b.shadow - 0.75, b.shadow - 0.6) * Math.exp(-Math.max(0, t - b.shadow + 0.6) * 3);
    const onCandle = t >= b.cut1 && t < b.cut2;
    studyCase(f, {
      shot: ID,
      when: 'start',
      key: ID,
      flames: false,
      board: false,
      // (the X-ray column is left out of the candle macro: it would hang over the candle as a dark blot)
      xray: onCandle ? false : { light: 0.15 },
      // round 3 (candle clock): September 2017, lit 2012: the sleeve is FIVE rings (one more than in 2016, ch09-s03)
      shelf: { drawFlames: false, only: ['learned'], over: { learned: { burn: 1, letters: 0.4 + 0.45 * win(t, b.cut1, b.candle + 0.3) } } },
      wall: { glint: { W5: glint5 } },
      extra: (c, env) => {
        sideTable(c, env, b, t);
        if (tq >= b.pinned) w7Slip(c, env, b, t, { x: W7C.x, y: W7C.y }, true);
        if (slipAt) {
          // the narrator's hand: the forearm rises steeply from the frame's lower edge just right of the hand (it never
          // spans the frame or crosses the label band), the wrist bent, the slip pinched
          const hs = toScreen(LAYERS.L4, cam, slipAt.hand.x, slipAt.hand.y);
          // round 3: the forearm comes down from the top of frame (lamp side, upper left), so neither the arm nor the
          // carried slip ever passes across the pinned slips' faces
          const E = toLayer(LAYERS.L4, cam, hs.x - 150, -260);
          const arm = hands.reach(E, slipAt.hand, 'pinch', HAND_LEN * 1.05, { held: 'slip', bend: 0.4 });
          hands.draw(c, { right: arm, scale: 1.05 }, env, { heldDraw: (cc, at, _h, e) => w7Slip(cc, e, b, t, { x: at.x, y: at.y + (W7.h / 2 - 6) * WK }, false) });
        }
      },
    });
    // the nets' candle: its flame, caught by the lamp on 'candle'
    const ck = 0.7 + 0.3 * win(t, b.candle - 0.1, b.candle + 0.4);
    f.practical({ x: LFLAME.x, y: LFLAME.y + 4, kind: "candle", seed: 2012, intensity: 0.9 * ck, radius: 34 + 22 * (ck - 0.7) / 0.3 });
    f.layer('L4', (c, env) => dustMotes(c, { area: { x: 1350, y: 120, w: 760, h: 560 }, count: 36, drift: { x: -3, y: -2 }, brightness: 0.45, salt: 905 }, env));
    // the lamp's pool: wide over the Wall, its edge brightening on the exhibits at 'doubters'; after the line it
    // narrows away from the rim, and once the slip is pinned it rests on W7 alone
    pool(f, b, t, cam);
    // W6: as the slip passes above it, its lower corner catches the lamp (a ≈ 22 px lit paper corner, the rest of the
    // slip and its words in deep shadow): the plant reads, the words do not
    const w6 = win(t, b.shadow - 0.45, b.shadow - 0.1) * (1 - win(t, b.pinned + 0.3, b.pinned + 0.8));
    if (w6 > 0.01) {
      const w6x = W6C.x - (WALL_SLOTS.W6.w * WK) / 2, w6y = W6C.y + (WALL_SLOTS.W6.h * WK) / 2;
      const q = toScreen(LAYERS.L4, cam, w6x, w6y);
      const c = f.c;
      const S = 24;
      c.save();
      const g = c.createLinearGradient(q.x, q.y, q.x + S * 0.75, q.y - S * 0.75);
      g.addColorStop(0, withAlpha(mixLab(f.mood.halo, '#e9d6b4', 0.4), 0.85 * w6));
      g.addColorStop(0.55, withAlpha(mixLab(f.mood.halo, '#e9d6b4', 0.2), 0.45 * w6));
      g.addColorStop(1, withAlpha(f.mood.halo, 0));
      c.fillStyle = g;
      c.beginPath();
      c.moveTo(q.x + 1, q.y - 1);
      c.lineTo(q.x + 1, q.y - S);
      c.lineTo(q.x + S * 1.3, q.y - 1);
      c.closePath();
      c.fill();
      c.globalCompositeOperation = 'lighter';
      glow(c, q.x + 6, q.y - 6, 30, f.mood.halo, 0.25 * w6);
      c.restore();
    }
    // the candle macro: the lamp's practical glow from off frame left across the shelf, and the shelf's near lip (L5)
    if (onCandle) {
      const c = f.c;
      c.save();
      c.globalCompositeOperation = 'lighter';
      const lg = c.createRadialGradient(-180, 520, 40, -180, 520, 900);
      lg.addColorStop(0, withAlpha(f.mood.halo, 0.26));
      lg.addColorStop(0.45, withAlpha(f.mood.halo, 0.08));
      lg.addColorStop(1, withAlpha(f.mood.halo, 0));
      c.fillStyle = lg;
      c.fillRect(0, 0, 1280, 720);
      c.restore();
      f.layer('L5', (cc, env) => {
        cc.fillStyle = env.fill('fg');
        cc.fillRect(LIP.x - 2000, LIP.y, 6000, 900);
        cc.fillStyle = withAlpha(env.mood.rim, 0.32);
        cc.fillRect(LIP.x - 2000, LIP.y, 6000, 1.6);
      });
    }
    // the X-ray column is an object in an amber study, not era light: its cyan face ~50% darker and pulled warm
    {
      const X = STUDY.xray;
      const a = toScreen(LAYERS.L4, cam, X.x - 115 * X.s + 6, X.y - 420 * X.s + 6), z = toScreen(LAYERS.L4, cam, X.x + 115 * X.s - 6, X.y - 4);
      if (!onCandle && z.x > 0 && a.x < 1280 && z.y > 0 && a.y < 720) {
        f.c.fillStyle = withAlpha(mixLab(f.mood.fg, f.mood.set, 0.25), onCandle ? 0.8 : 0.55);
        f.c.fillRect(a.x, a.y, z.x - a.x, z.y - a.y);
      }
    }
    // the shared near plane, without the wing-chair back (at the low candle framing it lands mid-frame as a blot)
    // (no desk lamp in the candle macro: there the lamp's light comes from off frame left)
    studyNear(f, { key: ID, cams: CAMS, file: true, desk: !onCandle, occluders: { chair: false } });
    candleStatus(f, b, t, cam);
    label(f, b, t);
    marcusCard(f, t);
  },
});

// ================================================================================================ camera
function camAt(b: B, t: number): Camera3 {
  const e0 = b.rim - 0.3;
  if (t < e0) return mixFrame(WIDE0, WIDE1, sm(t / e0));
  if (t < b.panda) return mixFrame(WIDE1, PANDA0, sm((t - e0) / (b.panda - e0)));
  const ex0 = b.faces - 0.5, ex1 = b.faces + 0.8;
  if (t < ex0) return mixFrame(PANDA0, PANDA1, sm((t - b.panda) / (ex0 - b.panda)));
  if (t < ex1) return mixFrame(PANDA1, EXHIB0, sm((t - ex0) / (ex1 - ex0)));
  if (t < b.cut1) return mixFrame(EXHIB0, EXHIB1, sm((t - ex1) / (b.cut1 - ex1)));
  if (t < b.cut2) return mixFrame(CANDLE0, CANDLE1, sm((t - b.cut1) / (b.cut2 - b.cut1)));
  // the truck rides with the hands from the lift to the pin, then stops and holds
  return mixFrame(JOUR0, JOUR1, sm((t - b.carry) / (b.pinned - b.carry)));
}

// ================================================================================================ the slip
/** hand target (the slip's pin point in its fingers) along the journey; null when the hands are out.
 *  Round 3: the slip rises into the light at the Wall's lamp-end edge (left of W1), then travels along the Wall's TOP
 *  MARGIN, its lower edge ≈ 20 px above the top row of slips (it never passes across a slip's face), pauses above W6 as
 *  that slip's lower corner catches the lamp, and comes down onto W7's pin */
const SLIP_DROP = (W7.h - 6) * WK; // pin point to the carried slip's lower edge
const TOP_ROW = wallSlotWorld('W1').y - (WALL_SLOTS.W1.h * WK) / 2;
function slipPath(b: B, tq: number): { hand: { x: number; y: number } } | null {
  const lift0 = b.carry - 0.25;
  const out = b.pinned + 0.85;
  if (tq < lift0 || tq > out) return null;
  const rowY = TOP_ROW - 16 - SLIP_DROP;
  const startP = { x: W1C.x - (WALL_SLOTS.W1.w * WK) / 2 - 44, y: rowY + 150 };
  const atW6 = { x: W6C.x - 24, y: rowY };
  const p0 = b.shadow - 0.35, p1 = b.shadow + 0.15;
  if (tq < b.carry + 0.2) {
    // lifted into the light at the lamp end (in the clear strip left of W1)
    const u = sm((tq - lift0) / 0.45);
    return { hand: { x: startP.x, y: lerp(startP.y, rowY, u) } };
  }
  if (tq < p0) {
    // along the top margin to above W6
    const u = sm((tq - b.carry - 0.2) / (p0 - b.carry - 0.2));
    return { hand: { x: lerp(startP.x, atW6.x, u), y: rowY - Math.sin(Math.PI * u) * 6 } };
  }
  // a half-second pause above W6: its lower corner catches the lamp
  if (tq < p1) return { hand: atW6 };
  if (tq < b.pinned - 0.05) {
    // on, and down onto W7's pin
    const u = sm((tq - p1) / (b.pinned - 0.05 - p1));
    return { hand: { x: lerp(atW6.x, W7PIN.x, u), y: lerp(rowY, W7PIN.y, u * u) } };
  }
  if (tq < b.pinned + 0.25) return { hand: { x: W7PIN.x, y: W7PIN.y } };
  // withdraw up and out the way the arm came (top of frame, lamp side)
  const u = sm((tq - b.pinned - 0.25) / 0.6);
  return { hand: { x: lerp(W7PIN.x, W7PIN.x - 260, u), y: lerp(W7PIN.y, W7PIN.y - 420, u) } };
}

/** the Hinton slip: the only slip whose due-date box is blank; its first clause typed large (a plant: no caption) */
function w7Slip(c: C, env: PaintEnv, b: B, t: number, at: { x: number; y: number }, pinned: boolean) {
  const m = env.mood;
  // once pinned it is lit ALONE at full lamp value (round 1), until the transition's own fade takes it
  const lit = pinned ? 0.6 + 0.4 * win(t, b.pinned + 0.05, b.pinned + 0.5) : 0.62;
  const w = W7.w * WK, h = W7.h * WK;
  // the draught (round 3: unmistakable, and early enough to read before the next shot's fade begins ≈ 0.8 s before the
  // cut): over ≈ 0.5 s the slip swings ≈ 7° about its pin and its lower corner curls up, then it settles
  const d = t - (b.draught - 0.55);
  const lift = !pinned || d <= 0 ? 0 : d < 0.5 ? Math.sin((d / 0.5) * Math.PI) : -0.2 * Math.exp(-(d - 0.5) * 5) * Math.sin((d - 0.5) * 14);
  const curl = Math.max(0, lift) * 0.95;
  c.save();
  if (pinned) {
    const pin = { x: at.x, y: at.y - h / 2 + 6 * WK };
    c.translate(pin.x, pin.y);
    c.rotate(-0.12 * lift);
    c.translate(-pin.x, -pin.y);
  }
  drawSlip(c, { ...W7V, who: '', text: '', due: undefined }, { x: at.x, y: at.y, k: WK, light: lit, pin: pinned, curl }, env);
  const rot = hash1(6, 23) * 0.04 + curl * 0.05;
  c.save();
  c.translate(at.x, at.y);
  c.rotate(rot);
  const paper = paperTone(env, lit);
  const ink = mixLab(m.ink, paper, 0.12);
  c.fillStyle = ink;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  // the first clause large, the rest small and illegible (saved for ch15)
  c.font = `400 ${8.6 * WK}px ${FONT.typewriter}`;
  c.fillText('The future depends on', -w / 2 + 7 * WK, -h / 2 + 22 * WK);
  c.fillStyle = withAlpha(ink, 0.45);
  for (let i = 0; i < 3; i++) {
    const y = -h / 2 + (38 + i * 9) * WK;
    for (let x = -w / 2 + 7 * WK; x < w / 2 - 16 * WK - i * 12; x += (4 + 2.5 * (hash1(i * 31 + Math.round(x), 4) * 0.5 + 0.5)) * WK) c.fillRect(x, y - 3 * WK, 2.6 * WK, 3.4 * WK);
  }
  // the tail: a tiny typed credit and the blank due-date box
  c.fillStyle = withAlpha(ink, 0.7);
  c.font = `400 ${5.6 * WK}px ${FONT.typewriter}`;
  c.fillText('as quoted by G. Marcus, 2018', -w / 2 + 7 * WK, h / 2 - 7 * WK);
  c.font = `400 ${6.4 * WK}px ${FONT.typewriter}`;
  c.textAlign = 'right';
  c.fillText('DUE', w / 2 - 34 * WK, h / 2 - 7 * WK);
  c.strokeStyle = withAlpha(ink, 0.8);
  c.lineWidth = 0.8 * WK;
  c.strokeRect(w / 2 - 31 * WK, h / 2 - 15 * WK, 24 * WK, 10 * WK);
  // the blank box catches the lamp once pinned
  if (pinned) {
    const g = win(t, b.pinned + 0.4, b.pinned + 1.0);
    c.fillStyle = withAlpha(mixLab(m.halo, m.core, 0.4), 0.28 * g);
    c.fillRect(w / 2 - 31 * WK, h / 2 - 15 * WK, 24 * WK, 10 * WK);
  }
  // only half caught by the lamp: the far half of the slip falls into shadow (its words stay a plant)
  const shK = pinned ? lerp(0.55, 0.12, win(t, b.pinned + 0.05, b.pinned + 0.5)) : 0.55;
  const sh = c.createLinearGradient(-w * 0.1, 0, w / 2, 0);
  sh.addColorStop(0, withAlpha(m.fg, 0));
  sh.addColorStop(1, withAlpha(m.fg, shK));
  c.fillStyle = sh;
  c.fillRect(-w / 2, -h / 2, w, h);
  c.restore();
  c.restore();
}

// ================================================================================================ the exhibits
function sideTable(c: C, env: PaintEnv, b: B, t: number) {
  const m = env.mood;
  const ink = env.fill('ink');
  // the table: top, apron, two legs running out of frame
  c.fillStyle = ink;
  c.fillRect(TABLE.x0, TABLE.top, TABLE.x1 - TABLE.x0, 9);
  c.fillRect(TABLE.x0 + 10, TABLE.top + 9, TABLE.x1 - TABLE.x0 - 20, 22);
  c.fillRect(TABLE.x0 + 16, TABLE.top + 31, 9, 420);
  c.fillRect(TABLE.x1 - 25, TABLE.top + 31, 9, 420);
  c.fillStyle = withAlpha(m.rim, 0.3);
  c.fillRect(TABLE.x0, TABLE.top - 0.6, TABLE.x1 - TABLE.x0, 1.2);
  // light on them: half in shadow at the rim; up when lifted; back to shadow once the slip is pinned
  // round 3: ≈ 0.35 at the rim until 'doubters', a little more as the lamp's edge finds them, ≈ 0.75 when lifted
  const shade = 1 - win(t, b.pinned, b.pinned + 1.0) * 0.6;
  const pk = (0.35 + 0.1 * win(t, b.rim - 0.2, b.rim + 0.5) + 0.3 * win(t, b.panda - 0.1, b.panda + 0.5)) * shade;
  const fk = (0.35 + 0.1 * win(t, b.rim - 0.2, b.rim + 0.5) + 0.3 * win(t, b.faces - 0.1, b.faces + 0.5)) * shade;
  const tq = tq12(t);
  const liftP = 34 * sm((tq - b.panda + 0.1) / 0.45);
  const liftF = 34 * sm((tq - b.faces + 0.1) / 0.45);
  pandaCard(c, env, { x: PANDA.x, y: TABLE.top - liftP }, pk, b, t);
  rimShadow(c, env, PANDA.x, TABLE.top - liftP, PANDA.w, PANDA.h, pk);
  facePlate(c, env, { x: PLATE.x, y: TABLE.top - liftF }, fk, b, t);
  rimShadow(c, env, PLATE.x, TABLE.top - liftF, PLATE.w, PLATE.h, fk);
  // the table and the floor under it, out at the pool's rim: a stop down
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(TABLE.x0 - 30, TABLE.top - 2, TABLE.x1 - TABLE.x0 + 60, 500);
}

/** the rim's shadow over an exhibit (round 3): at ≈ 0.35 lamp value the card sits half in shadow (darker toward the
 *  far side, away from the lamp); lifted to ≈ 0.75 it is almost clear */
function rimShadow(c: C, env: PaintEnv, x: number, base: number, w: number, h: number, light: number) {
  const k = Math.max(0, Math.min(1, (0.9 - light) / 0.55));
  if (k < 0.01) return;
  const g = c.createLinearGradient(x - w / 2 - 10, 0, x + w / 2 + 10, 0);
  g.addColorStop(0, withAlpha(env.mood.fg, 0.42 * k));
  g.addColorStop(1, withAlpha(env.mood.fg, 0.72 * k));
  c.fillStyle = g;
  c.fillRect(x - w / 2 - 10, base - h - 10, w + 26, h + 14);
}

/** an easel-backed card standing on the table: (x, y) = bottom centre */
function easel(c: C, env: PaintEnv, x: number, y: number, h: number) {
  c.fillStyle = env.fill('ink');
  c.beginPath();
  c.moveTo(x - 3, y - h * 0.7);
  c.lineTo(x + 3, y - h * 0.7);
  c.lineTo(x + 22, y + 0);
  c.lineTo(x + 16, y + 0);
  c.closePath();
  c.fill();
}

/** the panda as a STENCIL-CARD cut (round 3): one solid black seated silhouette (ears, head, body, arms and feet a
 *  single cut shape), the white of the face and belly cut OUT of it (the card shows through), the eye patches and nose
 *  left standing inside the face as the stencil's islands. No pupils, no mouth: an exhibit, not a cartoon.
 *  Local units: the picture window spans x ±67, y −37 … 43. */
type Ell = [number, number, number, number, number];
const PANDA_BODY: Ell[] = [
  [-17, -30, 8.5, 8, 0], [17, -30, 8.5, 8, 0], // ears
  [0, -16, 21, 17, 0], // head
  [0, 19, 27, 21, 0], // body
  [-21, 12, 8, 15, 0.5], [21, 12, 8, 15, -0.5], // arms, down the flanks to the paws
  [-23, 36, 12, 6.5, 0.15], [23, 36, 12, 6.5, -0.15], // feet, splayed forward
];
const PANDA_HOLES: Ell[] = [
  [0, -14, 15.5, 12, 0], // the white face
  [0, 14, 10.5, 9.5, 0], // the white belly between the arms (the dark legs close the shape below it)
];
const PANDA_ISLANDS: Ell[] = [
  [-7, -16, 5.2, 3.6, -0.6], [7, -16, 5.2, 3.6, 0.6], // eye patches (tilted teardrops)
  [0, -7.5, 3.4, 2.2, 0], // nose
];
const ell = (c: C, [x, y, rx, ry, r]: Ell) => {
  c.beginPath();
  c.ellipse(x, y, rx, ry, r, 0, Math.PI * 2);
  c.fill();
};

function pandaCard(c: C, env: PaintEnv, at: { x: number; y: number }, light: number, b: B, t: number) {
  const m = env.mood;
  const { w, h } = PANDA;
  easel(c, env, at.x, at.y, h);
  const paper = paperTone(env, light);
  c.save();
  c.translate(at.x, at.y - h / 2);
  c.rotate(-0.015);
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
  c.fillStyle = paper;
  c.fillRect(-w / 2, -h / 2, w, h);
  const ink = mixLab(m.ink, paper, 0.12);
  // the picture (clipped to its window on the card)
  c.save();
  c.beginPath();
  c.rect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 42);
  c.clip();
  c.translate(0, 3);
  // the cut's own shadow on the card (the stencil sits a hair proud of it), then the silhouette, its cut-outs and islands
  c.fillStyle = withAlpha(m.fg, 0.25);
  c.save();
  c.translate(1.2, 1.4);
  PANDA_BODY.forEach((e) => ell(c, e));
  c.restore();
  c.fillStyle = ink;
  PANDA_BODY.forEach((e) => ell(c, e));
  c.fillStyle = paper;
  PANDA_HOLES.forEach((e) => ell(c, e));
  c.fillStyle = ink;
  PANDA_ISLANDS.forEach((e) => ell(c, e));
  c.restore();
  // the invisible changes: a fine dust of ~150 specks drifting over the picture, so faint the eye barely finds it
  const dust = win(t, b.panda - 0.1, b.panda + 0.5);
  if (dust > 0) {
    for (let i = 0; i < 150; i++) {
      const x = -w / 2 + 10 + (hash1(i, 3) * 0.5 + 0.5) * (w - 20) + Math.sin(t * 0.5 + i) * 2.5 + t * 0.6 * hash1(i, 7);
      const y = -h / 2 + 10 + (hash1(i, 4) * 0.5 + 0.5) * (h - 44) + Math.cos(t * 0.4 + i * 1.3) * 2.5;
      c.fillStyle = withAlpha(i % 2 ? m.rim : m.ink, 0.13 * dust);
      c.fillRect(x, y, 1, 1);
    }
  }
  // the caption (typed prop lettering): flips on 'fool'; the picture does not change
  const tq = tq12(t);
  const flipped = tq >= b.fool;
  const flick = tq >= b.fool && tq < b.fool + 1 / 6;
  c.fillStyle = flick ? withAlpha(ink, 0.35) : ink;
  // the caption is what the viewer reads: one fixed size (15.6 px) that clears the 22 px cap-height floor at every
  // framing where it matters (PANDA ≥ 2.2, EXHIB ≥ 1.95); fixed, so it never breathes with the camera
  let cs = 15.6;
  c.font = `400 ${cs}px ${FONT.typewriter}`;
  const cw = Math.max(c.measureText('gibbon 99.3%').width, c.measureText('panda 57.7%').width);
  if (cw > w - 12) cs *= (w - 12) / cw;
  c.font = `400 ${cs}px ${FONT.typewriter}`;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillText(flipped ? 'gibbon 99.3%' : 'panda 57.7%', 0, h / 2 - 17);
  // the credit is prop texture on the card (small and faint), as the script asks
  c.fillStyle = withAlpha(ink, 0.26);
  c.font = `400 4.6px ${FONT.typewriter}`;
  c.fillText('Goodfellow, Shlens & Szegedy, 2014', 0, h / 2 - 5);
  c.restore();
}

/** a respectful profile head-and-shoulders cut-out (feet = bottom centre); hair: 'long' (bun) or 'short' */
function faceCut(c: C, x: number, y: number, s: number, hair: 'long' | 'short', fill: string) {
  c.fillStyle = fill;
  c.beginPath();
  // shoulders
  c.moveTo(x - 8 * s, y);
  c.quadraticCurveTo(x - 8 * s, y - 7 * s, x - 2 * s, y - 8 * s);
  c.lineTo(x - 2 * s, y - 10 * s);
  // head (profile facing right)
  c.bezierCurveTo(x - 6 * s, y - 12 * s, x - 6 * s, y - 21 * s, x, y - 21 * s);
  c.bezierCurveTo(x + 4 * s, y - 21 * s, x + 5 * s, y - 17 * s, x + 5 * s, y - 15 * s);
  c.lineTo(x + 6.4 * s, y - 13 * s);
  c.lineTo(x + 5 * s, y - 12.5 * s);
  c.quadraticCurveTo(x + 4.6 * s, y - 10 * s, x + 2 * s, y - 10 * s);
  c.lineTo(x + 2 * s, y - 8 * s);
  c.quadraticCurveTo(x + 8 * s, y - 7 * s, x + 8 * s, y);
  c.closePath();
  c.fill();
  if (hair === 'long') {
    c.beginPath();
    c.arc(x - 4.6 * s, y - 17.5 * s, 3.2 * s, 0, Math.PI * 2);
    c.fill();
  }
}

/** an oxblood CROSS stamp (a misread: never a check mark), rough-edged like a rubber stamp */
function crossMark(c: C, env: PaintEnv, x: number, y: number, s: number, a: number) {
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = oxblood(env, 0.08);
  c.lineWidth = 2.1 * s;
  c.lineCap = 'butt';
  const r = 4.6 * s;
  c.beginPath();
  c.moveTo(x - r, y - r);
  c.lineTo(x + r, y + r);
  c.moveTo(x + r, y - r * 0.92);
  c.lineTo(x - r * 0.96, y + r);
  c.stroke();
  // the stamp's ink is uneven: a paler second pass offset a hair
  c.globalAlpha *= 0.35;
  c.lineWidth = 1 * s;
  c.beginPath();
  c.moveTo(x - r + 0.8, y - r + 0.3);
  c.lineTo(x + r + 0.8, y + r + 0.3);
  c.stroke();
  c.restore();
}

function facePlate(c: C, env: PaintEnv, at: { x: number; y: number }, light: number, b: B, t: number) {
  const m = env.mood;
  const { w, h } = PLATE;
  easel(c, env, at.x, at.y, h);
  const parch = mixLab(MOODS.parchment.sky[1], paperTone(env, light), 0.55);
  const dim = mixLab(parch, m.set, 0.5 * (1 - light));
  c.save();
  c.translate(at.x, at.y - h / 2);
  c.rotate(0.012);
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
  c.fillStyle = dim;
  c.fillRect(-w / 2, -h / 2, w, h);
  c.strokeStyle = withAlpha(mixLab(m.ink, dim, 0.5), 0.5);
  c.lineWidth = 0.8;
  c.strokeRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8);
  // two rows of nine: darker paper above (women), lighter paper below (men); same cut, same dignity
  const dark = mixLab('#3b2a20', dim, 0.15);
  const pale = mixLab('#d9c3a2', dim, 0.25);
  const N = 9;
  const xs = Array.from({ length: N }, (_, i) => -w / 2 + 15 + i * ((w - 30) / (N - 1)));
  const rowA = -h / 2 + 50, rowB = -h / 2 + 98;
  for (const x of xs) faceCut(c, x, rowA, 1.0, 'long', dark);
  for (const x of xs) faceCut(c, x, rowB, 1.0, 'short', pale);
  c.fillStyle = withAlpha(mixLab(m.ink, dim, 0.4), 0.6);
  c.fillRect(-w / 2 + 8, rowA + 1, w - 16, 0.8);
  c.fillRect(-w / 2 + 8, rowB + 1, w - 16, 0.8);
  // the stamps, on the PAPER just above the marked heads (never over the dark silhouettes):
  // 'darker-skinned' — three of nine (about one in three); 'lighter-skinned' — a single one
  const tq = tq12(t);
  const thump = (t0: number) => 1 + 0.35 * Math.exp(-Math.max(0, t - t0) * 12);
  [1, 4, 7].forEach((i, k) => {
    const t0 = b.darker - 0.12 + k * 0.12;
    if (tq >= t0) crossMark(c, env, xs[i], rowA - 30, 1.45 * thump(t0), 1);
  });
  if (tq >= b.lighter - 0.1) crossMark(c, env, xs[6], rowB - 30, 1.2 * thump(b.lighter - 0.1), 0.95);
  c.restore();
}

// ================================================================================================ light + type
function pool(f: Frame, b: B, t: number, cam: Camera3) {
  // before the pin (round 3): the pool lies bright on the Wall's LAMP END (W1–W4), falling off ≥ 40% toward the side
  // table at the far end, so the exhibits stand at its rim; on the carry it follows the slip, then rests on W7
  const narrow = win(t, b.carry - 0.2, b.carry + 0.8);
  const onW7 = win(t, b.pinned - 0.1, b.pinned + 0.4);
  const wide = { x: 1500, y: 330 };
  const mid = { x: 1640, y: 250 };
  const q0 = { x: lerp(wide.x, mid.x, narrow), y: lerp(wide.y, mid.y, narrow) };
  const p = { x: lerp(q0.x, W7C.x, onW7), y: lerp(q0.y, W7C.y, onW7) };
  const s = toScreen(LAYERS.L4, cam, 0, 0).k;
  const r = lerp(lerp(400, 420, narrow), 170, onW7) * s;
  wallPool(f, cam, p, r, 1.15 + 0.3 * onW7, 1.05 + 0.1 * narrow - 0.15 * onW7);
  // round 1: from slipPinned the pool closes on W7 within 0.5 s and everything else drops to ≤ 0.15 of its value; the
  // slip itself stays at full lamp value until the transition's own fade
  if (onW7 > 0.01) {
    const q = toScreen(LAYERS.L4, cam, W7C.x, W7C.y);
    const R = Math.hypot(W7.w, W7.h) * WK * 0.5 * q.k;
    const c = f.c;
    const g = c.createRadialGradient(q.x, q.y, R * 0.95, q.x, q.y, R * 1.7);
    g.addColorStop(0, withAlpha(f.mood.fg, 0));
    // (round 3: the rest of the Wall holds at ≈ 0.15 of its value, so the slip still sits in a room)
    g.addColorStop(1, withAlpha(f.mood.fg, 0.62 * onW7));
    c.fillStyle = g;
    c.fillRect(0, 0, 1280, 720);
  }
  // the edge of the pool finds the exhibits on 'doubters' (until the pool narrows away)
  const edge = win(t, b.rim - 0.2, b.rim + 0.6) * (1 - narrow);
  if (edge > 0.01) {
    const q = toScreen(LAYERS.L4, cam, (PANDA.x + PLATE.x) / 2, TABLE.top - 70);
    const c = f.c;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const R = 260 * q.k;
    const g = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, R);
    g.addColorStop(0, withAlpha(f.mood.halo, 0.12 * edge));
    g.addColorStop(1, withAlpha(f.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(q.x - R, q.y - R, 2 * R, 2 * R);
    c.restore();
  }
}

/** the nets' candle's status tag (the film's naming card, drawn here so its date line can grow): on 'candle' the
 *  belief and 'lit 2012 · still burning'; on 'argued' ', still argued' is typed on; it follows the flame and leaves
 *  with the crane */
function candleStatus(f: Frame, b: B, t: number, cam: Camera3) {
  // round 4: in with the cut (two frames, paper and ink together), fully inked ≥ 3 frames before 'candle', held until
  // the cut back to the Wall
  const k = t >= b.cut2 ? 0 : win(t, b.cut1, b.cut1 + 2 / 24);
  if (k <= 0) return;
  const c = f.c;
  const m = f.mood;
  const fl = toScreen(LAYERS.L4, cam, LFLAME.x, LFLAME.y);
  const tq = tq12(t);
  const extra = ', still argued';
  const typed = tq < b.argued - 0.05 ? 0 : Math.min(extra.length, Math.floor((tq - b.argued + 0.05) * 30));
  const lines = ['LEARNED FEATURES, GIVEN', 'DATA AND ARITHMETIC'];
  const dates = 'lit 2012 · still burning' + extra.slice(0, typed);
  c.save();
  const size = legibleSize(c, `500 18px ${FONT.mono}`, 18) * 1.08;
  const ds = legibleSize(c, `italic 400 18px ${FONT.text}`, 18) * 1.04;
  c.font = `500 ${size}px ${FONT.mono}`;
  const tw = Math.max(...lines.map((l) => c.measureText(l).width));
  c.font = `italic 400 ${ds}px ${FONT.text}`;
  const dw = c.measureText('lit 2012 · still burning' + extra).width;
  const pad = 14;
  const W = Math.max(tw, dw) + pad * 2;
  const H = lines.length * size * 1.2 + ds * 1.45 + pad * 1.7;
  let x0 = fl.x + 22;
  x0 = Math.max(40, Math.min(1240 - W, x0));
  const y0 = Math.max(36, Math.min(720 * 0.86 - H, fl.y - H * 0.55));
  c.globalAlpha = Math.min(1, k * 1.15);
  // leader to the flame
  c.strokeStyle = withAlpha(m.rim, 0.75);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x0, y0 + H * 0.4);
  c.lineTo(fl.x + 4, fl.y);
  c.stroke();
  const paper = mixLab(m.halo, '#efe4cc', 0.6);
  c.shadowColor = withAlpha('#000000', 0.45);
  c.shadowBlur = 10;
  c.shadowOffsetY = 4;
  c.fillStyle = paper;
  c.fillRect(x0, y0, W, H);
  // paper and its lines share one alpha (the kit card-entry rule's "fade together"); reported to the card audit
  cardProbe(c, 'candleStatus', x0, y0, W, H, 1, 1);
  c.shadowColor = 'rgba(0,0,0,0)';
  c.shadowBlur = 0;
  c.shadowOffsetY = 0;
  c.strokeStyle = withAlpha(m.ink, 0.35);
  c.lineWidth = 0.8;
  c.strokeRect(x0 + 5, y0 + 5, W - 10, H - 10);
  const inkC = mixLab(m.ink, '#1d160f', 0.5);
  c.fillStyle = inkC;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.font = `500 ${size}px ${FONT.mono}`;
  lines.forEach((l, i) => c.fillText(l, x0 + pad, y0 + pad + size * 0.95 + i * size * 1.2));
  c.fillStyle = withAlpha(inkC, 0.85);
  c.font = `italic 400 ${ds}px ${FONT.text}`;
  c.fillText(dates, x0 + pad, y0 + pad + lines.length * size * 1.2 + ds * 1.05);
  c.restore();
}

function label(f: Frame, b: B, t: number) {
  // stays pinned at the frame's edge until the slip is pinned in W7 (script: until slipPinned); round 3: dimmed to half
  // while the candle macro is on screen (the candle's naming card is the text there), and 40 px higher (its credit line
  // clear of the bottom 12%)
  // round 4: the stat block leaves with the cut back to the Wall (the board's return): the tail belongs to the slip
  // and the Marcus card
  const onCandle = t >= b.cut1 && t < b.cut2;
  if (t >= b.cut2) return;
  const a = win(t, b.faces + 0.1, b.faces + 0.6) * (onCandle ? 0.5 : 1);
  if (a <= 0) return;
  const c = f.c;
  const m = f.mood;
  const x = 1232;
  c.save();
  // (on the candle macro it sits higher, in the clear middle right, well away from the candle's naming card)
  if (onCandle) c.translate(0, -190);
  c.globalAlpha = a;
  const ms = legibleSize(c, `500 18.5px ${FONT.mono}`, 18.5) * 1.03;
  const is = legibleSize(c, `italic 400 19px ${FONT.text}`, 19) * 1.03;
  c.font = `500 ${ms}px ${FONT.mono}`;
  const w = Math.max(...LABEL.slice(0, 3).map((l) => c.measureText(l).width));
  const lh = ms * 1.38;
  const y3 = 582, y2 = y3 - is * 1.35, y1 = y2 - lh, y0 = y1 - lh;
  softPlate(c, x - w / 2, (y0 + y3) / 2 - 6, w + 150, y3 - y0 + 96, m.ink, 0.62);
  c.fillStyle = mixLab('#efe3cf', m.core, 0.2);
  c.textAlign = 'right';
  c.textBaseline = 'alphabetic';
  c.fillText(LABEL[0], x, y0);
  c.fillText(LABEL[1], x, y1);
  c.fillText(LABEL[2], x, y2);
  c.font = `italic 400 ${is}px ${FONT.text}`;
  c.fillStyle = withAlpha(mixLab('#efe3cf', m.core, 0.2), 0.85);
  c.fillText(LABEL[3], x, y3);
  c.restore();
}

/** round 4 (historian + teacher + art): the silent tail names whose words the new slip carries. From 21.0 a horizontal
 *  paper card, 'GARY MARCUS · 2018 · Deep Learning: A Critical Appraisal' [e9-marcus], is pinned across the lower
 *  third, clear of the slip's path along the Wall's top margin; fully inked from its first frame (paper and ink share
 *  one alpha), held ≈ 2.6 s, gone before the pool's dim settles (≈ 23.9). It sets up the Marcus card in ch11-s08. */
const MARCUS_LINE = 'GARY MARCUS · 2018 · Deep Learning: A Critical Appraisal';
const [MN, MY, MT] = MARCUS_LINE.split(' · ');
const MARCUS = { name: MN, year: MY, title: MT };
function marcusCard(f: Frame, t: number) {
  const t0 = 21.0 - 2 / 24;
  const k = win(t, t0, 21.0) * (1 - win(t, 23.55, 23.85));
  if (k <= 0) return;
  const c = f.c;
  const m = f.mood;
  c.save();
  const ns = legibleSize(c, `600 22px ${FONT.mono}`, 22, MARCUS.name) * 1.06;
  const ts = legibleSize(c, `italic 400 23px ${FONT.text}`, 23, MARCUS.title) * 1.06;
  const sep = ' · ';
  c.font = `600 ${ns}px ${FONT.mono}`;
  const w1 = c.measureText(MARCUS.name + sep + MARCUS.year + sep).width;
  c.font = `italic 400 ${ts}px ${FONT.text}`;
  const w2 = c.measureText(MARCUS.title).width;
  const padX = 22, H = Math.max(ns, ts) * 1.9;
  const W = w1 + w2 + padX * 2;
  // pinned slightly off-level, left of centre in the lower third (above the bottom 12%)
  const x0 = Math.max(48, 640 - W / 2 - 40), y0 = 720 * 0.86 - H - 18;
  // a settle: it is pinned (drops 6 px into place over its first frames), then holds still
  const drop = 6 * (1 - sm(clamp01((t - t0) / 0.25)));
  c.globalAlpha = k;
  c.translate(x0 + W / 2, y0 + H / 2 - drop);
  c.rotate(-0.008);
  c.translate(-W / 2, -H / 2);
  const paper = mixLab(m.halo, '#efe4cc', 0.62);
  c.shadowColor = withAlpha('#000000', 0.5);
  c.shadowBlur = 12;
  c.shadowOffsetY = 5;
  c.fillStyle = paper;
  c.fillRect(0, 0, W, H);
  cardProbe(c, 'marcusCard', x0, y0, W, H, 1, 1);
  c.shadowColor = 'rgba(0,0,0,0)';
  c.shadowBlur = 0;
  c.shadowOffsetY = 0;
  c.strokeStyle = withAlpha(m.ink, 0.35);
  c.lineWidth = 0.8;
  c.strokeRect(5, 5, W - 10, H - 10);
  // a plain brass pin at its top centre (the slip's own pin, echoed)
  c.fillStyle = mixLab('#b08a4a', m.halo, 0.25);
  c.beginPath();
  c.arc(W / 2, 9, 3.4, 0, Math.PI * 2);
  c.fill();
  const inkC = mixLab(m.ink, '#1d160f', 0.5);
  c.fillStyle = inkC;
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.font = `600 ${ns}px ${FONT.mono}`;
  c.fillText(MARCUS.name + sep + MARCUS.year + sep, padX, H / 2 + 1);
  c.font = `italic 400 ${ts}px ${FONT.text}`;
  c.fillText(MARCUS.title, padX + w1, H / 2 + 1);
  c.restore();
}
