/**
 * ch09-s04 — the founding grammar: OpenAI's 11 December 2015 announcement pinned bare in the founding row, a warm
 * and a cold hand-lantern on one nail, and a plain ledger page for the money (candleAmber, STUDY LOCK; 19.92 s; in: cut).
 *
 *   BOARD   0        frontal medium on the Case Board under the lamp: columns C3 and C4 above, the founding row's
 *                    empty slots beneath them (flat, even light; no office, no faces, no hero framing)
 *   INSERT  'founded' the hands pin a typewritten announcement into F1 (beneath C3): its text faint; the date stamp
 *                    11 DECEMBER 2015 sets in with the pin ('Months before Seoul' is a step back in time)
 *   BOARD   'Musk'   the pin stays bare (no name cards; the founders are named only in the narration); the card
 *                    settles in its slot
 *           (from 'co-chaired' the camera pushes in until the card is the subject: its two spoken phrases, typed in Plex
 *                    Mono, read at the 22 px cap-height floor by 'benefit', the lanterns still whole beneath it)
 *           'benefit' a WARM hand-lantern swings into light from the pin (the promise the lab names); the card's
 *                    phrase 'could benefit society' lights
 *           'damage' a COLD hand-lantern swings in beside it on the same nail (the danger it names); 'damage society
 *                    if built or used incorrectly' lights. Hope and fear share one nail; nothing resolves
 *   LEDGER  'backers' (top-down on the side table) the ledger's page turns under a flat hand and one entry is set in
 *                    IBM Plex Mono: committed $1B · expected to spend a tiny fraction at first (two typed lines, at the
 *                    legibility floor; the camera eases in on it). Nothing comments on it; it holds to the cut.
 *                    Depth: the floor far below the table's edge (L2), the ledger (L4), the lamp's base (L5).
 *
 * TEXT RULE: the date stamp and the ledger entry only (the announcement's lettering is prop type, mostly faint).
 * Anthropic's founding (ch12-s03) is staged object for object from this shot.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { CAMERA3_HOME, FONT, LAYERS, MOODS, defineShot, drawTracked, dustMotes, hash1, legibleSize, mixLab, softPlate, toLayer, toScreen, withAlpha } from '../../../film';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { hands } from '../cast';
import { HAND_LEN, type HandsPose } from '../sets/narratorHands';
import { slotWorld, studyCase, studyRoom } from '../sets/study';
import { SLOTS } from '../sets/studyState';
import { paperTone } from '../sets/caseBoard';
import { frameOn, mixFrame } from '../sets/ch09-s03a-kit';
import { clamp01, lerp, sm, tq12, win } from '../sets/ch02-s05b-util';

type C = CanvasRenderingContext2D;
const ID = 'ch09-s04';

// ------------------------------------------------------------------------------------------------ geometry
const F1 = SLOTS.F1;
const F1C = slotWorld('F1');
const F1PIN = slotWorld('F1', 'pin');
/** both lanterns hang from ONE brass nail beneath F1 (hope and fear on one nail), resting a little apart */
const NAIL = { x: F1C.x, y: F1C.y + F1.h / 2 + 6 };
const CORD = 30;
/** rest angles: the two lanterns lean apart against each other (≈ 60 px apart on screen in the medium) */
const REST_A = 0.45;
const WARM = MOODS.candleAmber;
const COLD = MOODS.winterBlue;
// the announcement's sentence (prop type on the card): "It's hard to fathom how much human-level AI could benefit
// society, and it's equally hard to imagine how much it could damage society if built or used incorrectly." Only the
// two spoken phrases are typed large.

// ------------------------------------------------------------------------------------------------ cameras
/** BOARD: frontal medium on C3/C4 and the founding row */
const BOARD0 = frameOn({ x: F1C.x - 40, y: 430 }, { x: 640, y: 360 }, 1.2);
const BOARD1 = frameOn({ x: F1C.x - 30, y: 440 }, { x: 640, y: 360 }, 1.26);
/** INSERT on F1 (brief): the card a little low and right, so the hand comes up from the frame's lower edge with a
 *  short forearm */
const INS0 = frameOn(F1C, { x: 690, y: 400 }, 2.15);
const INS1 = frameOn(F1C, { x: 686, y: 404 }, 2.24);
/** round 1: the BOARD medium is ~1.6× wider than before, so the founding grammar stays in frame: C3's card above F1,
 *  the founding row with F1 (and the lanterns on its nail beneath it), and F2's EMPTY slot to the right (where 2021's
 *  pin will go); then a gentle ≈ 4% push toward the lit phrases as the lanterns swing */
const F2C = slotWorld('F2');
const MED0 = frameOn({ x: (F1C.x + F2C.x) / 2 - 8, y: F1C.y - 48 }, { x: 640, y: 360 }, 1.9);
const MED1 = frameOn({ x: F1C.x + 52, y: F1C.y - 46 }, { x: 640, y: 344 }, 1.97);
const MED2 = frameOn({ x: F1C.x + 48, y: F1C.y - 46 }, { x: 640, y: 342 }, 1.99);
const F2PIN = slotWorld('F2', 'pin');
/** the LEDGER: pulled back, the open ledger on the side table's dark edge under the lamp's pool */
/** round 1: the ledger is a set, not a slide: the open book lies at a slight angle on the side table, its fresh
 *  right page ≈ half the frame (the left page cropped at frame left), the table running off to the right into the
 *  dark, the green-shaded lamp's shade soft at top-left with its pool on the entry, the table's near edge an L5
 *  silhouette along the bottom */
const LEDGER0: Camera3 = frameOn({ x: 760, y: 300 }, { x: 610, y: 330 }, 0.9);
/** the ledger push: eased in toward the entry as it is typed (gentle: the page stays ≈ half the frame) */
const LEDGER1 = frameOn({ x: 740, y: 280 }, { x: 600, y: 330 }, 0.96);
const CAMS = [BOARD0, BOARD1, INS0, INS1, MED0, MED1, MED2, CAMERA3_HOME];

interface B {
  D: number;
  ins0: number;
  pin0: number;
  pinDur: number;
  founded: number;
  lant: number;
  musk: number;
  benefit: number;
  damage: number;
  ledger: number;
  turn0: number;
  turn1: number;
  type0: number;
  type1: number;
}

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const founded = T.beat('labPinned');
    const pinDur = 1.9;
    const ledger = T.beat('ledger');
    const b: B = {
      D,
      // round 1: a clean CUT from the board wide to the pin insert on 'founded' − 0.2 s (no whip)
      ins0: founded - 0.2,
      pin0: founded - 0.45 * pinDur,
      pinDur,
      founded,
      lant: T.word('L0909', 'co-chaired') + 0.5,
      musk: T.beat('names'),
      benefit: T.beat('warmLantern'),
      damage: T.beat('coldLantern'),
      // cut to the ledger a beat before, so the page is visibly turning on the beat ('backers' − 0.56)
      ledger: ledger - 0.35,
      turn0: ledger - 0.3,
      turn1: ledger + 0.45,
      type0: ledger + 0.75,
      type1: ledger + 2.9,
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    f.setMood('candleAmber');
    if (t < b.ins0) boardView(f, b, t, mixFrame(BOARD0, BOARD1, sm(t / b.ins0)));
    else if (t < b.lant) boardView(f, b, t, mixFrame(INS0, INS1, sm((t - b.ins0) / (b.lant - b.ins0))));
    else if (t < b.ledger) {
      const reach = b.benefit - 0.3;
      const cam = t < reach ? mixFrame(MED0, MED1, sm((t - b.lant) / (reach - b.lant))) : mixFrame(MED1, MED2, sm((t - reach) / (b.ledger - reach)));
      boardView(f, b, t, cam);
    }
    else ledgerView(f, b, t);
    // the date: with the pin, until the ledger insert (a step back in time the eye can read)
    dateStamp(f, t, b.founded, b.ledger);
  },
});

// ================================================================================================ BOARD
function boardView(f: Frame, b: B, t: number, cam: Camera3) {
  f.camera(cam);
  studyRoom(f, { key: ID, cams: CAMS, outside: { mood: 'duskRose', kind: 'night' } });
  const tq = tq12(t);
  const u = (tq - b.pin0) / b.pinDur;
  const placed = u >= 0.45;
  // the card's settle after the press, and again (smaller) on 'Musk'
  const settle = (t0: number, a: number) => (t > t0 ? a * Math.exp(-(t - t0) * 2.6) * Math.sin((t - t0) * 8) : 0);
  const sway = settle(b.founded, 0.05) + settle(b.musk, 0.02);
  const litA = win(t, b.benefit - 0.1, b.benefit + 0.5);
  const litB = win(t, b.damage - 0.1, b.damage + 0.5);
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: false,
    xray: { light: 0.15 },
    flames: false,
    extra: (c, env) => {
      // F2's slot is EMPTY: only its bare brass pin waits beside F1 (Anthropic's 2021 card goes here in ch12-s03)
      barePin(c, env, F2PIN);
      // the lanterns hang behind the card (their cords run up behind it to the pin)
      lanterns(c, env, b, t);
      if (placed) announcement(c, env, { x: F1C.x, y: F1C.y, rot: sway, litA, litB, light: 0.86 });
      if (u > 0 && u < 1) {
        const hp = pinHand(u, cam);
        hands.draw(c, hp, env, { heldDraw: (cc, at, _h, e) => announcement(cc, e, { x: at.x, y: at.y + F1.h / 2 - 7, rot: 0, litA: 0, litB: 0, light: 0.8 }) });
      }
    },
  });
  // the cyan exhibits (the chat-box card in O and the X-ray column) are objects in an amber study, not era light:
  // their faces a stop darker (≈ 40%)
  darkenExhibits(f, cam);
  // the lanterns' own light (after the rim pass): warm on 'benefit', cold on 'damage'
  lanternLight(f, b, t);
  // the lamp's falloff on the board (≈ 20% darker toward the frame's edges), so the field is never dead-even
  {
    const c = f.c;
    const g = c.createRadialGradient(600, 320, 160, 640, 360, 820);
    g.addColorStop(0, withAlpha(f.mood.fg, 0));
    g.addColorStop(1, withAlpha(f.mood.fg, 0.24));
    c.fillStyle = g;
    c.fillRect(0, 0, 1280, 720);
  }
  f.layer('L4', (c, env) => dustMotes(c, { area: { x: F1C.x - 420, y: F1C.y - 360, w: 840, h: 560 }, count: 30, drift: { x: -3, y: -2 }, brightness: 0.4, salt: 904 }, env));
  lampShade(f);
}

/** the pin, as the narrator's hands do it: the forearm comes up from the frame's lower edge (≤ 250 px of it in
 *  frame), the wrist visibly bent, the card pinched; it settles, the thumb presses the pin, the hand withdraws */
function pinHand(u: number, cam: Camera3): HandsPose {
  const scale = 0.7;
  const len = HAND_LEN * scale;
  const E = toLayer(LAYERS.L4, cam, 900, 800);
  const target = F1PIN;
  const near = { x: target.x + len * 0.12, y: target.y + len * 0.1 };
  const off = { x: lerp(E.x, target.x, 0.12), y: lerp(E.y, target.y, 0.12) };
  const U = clamp01(u);
  const lp = (a: { x: number; y: number }, z: { x: number; y: number }, k: number) => ({ x: lerp(a.x, z.x, k), y: lerp(a.y, z.y, k) });
  let at = target;
  let shape: 'pinch' | 'press' | 'rest' = 'pinch';
  let held: 'card' | 'none' = 'card';
  if (U < 0.35) at = lp(off, near, sm(U / 0.35));
  else if (U < 0.45) at = lp(near, target, sm((U - 0.35) / 0.1));
  else if (U < 0.6) {
    shape = 'press';
    held = 'none';
    at = { x: target.x + len * 0.02 * Math.sin(sm((U - 0.45) / 0.15) * Math.PI), y: target.y };
  } else {
    shape = 'rest';
    held = 'none';
    at = lp(target, off, sm((U - 0.6) / 0.4));
  }
  return { right: hands.reach(E, at, shape, len, { held, bend: 0.42 }), scale, placed: U >= 0.45, presence: 1 };
}

function barePin(c: C, env: PaintEnv, p: { x: number; y: number }) {
  c.fillStyle = withAlpha(env.mood.fg, 0.45);
  c.beginPath();
  c.arc(p.x + 1.6, p.y + 2.2, 3.4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = mixLab(env.mood.halo, '#8a6a2a', 0.45);
  c.beginPath();
  c.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(env.mood.core, 0.6);
  c.beginPath();
  c.arc(p.x - 0.9, p.y - 1, 1.1, 0, Math.PI * 2);
  c.fill();
}

function darkenExhibits(f: Frame, cam: Camera3) {
  const c = f.c;
  const rect = (x0: number, y0: number, x1: number, y1: number) => {
    const a = toScreen(LAYERS.L4, cam, x0, y0), z = toScreen(LAYERS.L4, cam, x1, y1);
    if (z.x < 0 || a.x > 1280 || z.y < 0 || a.y > 720) return;
    c.fillRect(a.x, a.y, z.x - a.x, z.y - a.y);
  };
  c.save();
  c.fillStyle = withAlpha(f.mood.fg, 0.42);
  const O = slotWorld('O');
  rect(O.x - 40, O.y - 66, O.x + 40, O.y + 66);
  const X = { x: 1235, y: 650, s: 0.75 };
  rect(X.x - 115 * X.s + 8, X.y - 420 * X.s + 8, X.x + 115 * X.s - 8, X.y - 6);
  c.restore();
}

/** the green-shaded lamp's shade edge at the frame's top right: the frame's darkest shape (near, soft, screen space) */
function lampShade(f: Frame) {
  const c = f.c;
  const m = f.mood;
  c.save();
  c.filter = `blur(${(5 * f.pxScale) / 1.5}px)`;
  c.fillStyle = '#0b0d0b';
  c.beginPath();
  c.moveTo(1020, -20);
  c.lineTo(1300, -20);
  c.lineTo(1300, 92);
  c.quadraticCurveTo(1180, 70, 1060, 40);
  c.closePath();
  c.fill();
  // its lit underside lip (the lamp's light falls from under it)
  c.strokeStyle = withAlpha(mixLab(m.core, '#9fbf8a', 0.25), 0.45);
  c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(1066, 44);
  c.quadraticCurveTo(1180, 72, 1300, 94);
  c.stroke();
  c.restore();
}

interface AnnOpts {
  x: number;
  y: number;
  rot: number;
  litA: number;
  litB: number;
  light: number;
}
/** the typewritten announcement: a header line, the sentence faint, the two spoken phrases lit as they are said */
function announcement(c: C, env: PaintEnv, o: AnnOpts) {
  const w = F1.w, h = F1.h;
  const m = env.mood;
  const paper = paperTone(env, o.light);
  c.save();
  c.translate(o.x, o.y - h / 2 + 7);
  c.rotate(o.rot - 0.012);
  c.translate(0, h / 2 - 7);
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(-w / 2 + 2.5, -h / 2 + 3.5, w, h);
  c.fillStyle = paper;
  c.fillRect(-w / 2, -h / 2, w, h);
  const ink = mixLab(m.ink, paper, 0.1);
  c.fillStyle = ink;
  // 2015: the film's era face is IBM Plex Mono (typewriter faces are for the pre-1970 papers)
  c.font = `500 6.6px ${FONT.mono}`;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillText('OPENAI · 11 DEC 2015', -w / 2 + 6, -h / 2 + 11);
  c.fillRect(-w / 2 + 6, -h / 2 + 14, w - 12, 0.6);
  // the sentence as faint texture (small), with the two SPOKEN phrases typed large (≥ 28 px at 1080p in the medium)
  // on their own lines, dim until the narrator says them, then struck dark and lit
  const small = (text: string, y: number) => {
    c.font = `400 4.4px ${FONT.mono}`;
    c.fillStyle = withAlpha(ink, 0.24);
    c.fillText(text, -w / 2 + 6, y);
  };
  const big = (text: string, y: number, lit: number) => {
    let size = 8.6;
    c.font = `500 ${size}px ${FONT.mono}`;
    const tw = c.measureText(text).width;
    if (tw > w - 10) {
      size *= (w - 10) / tw;
      c.font = `500 ${size}px ${FONT.mono}`;
    }
    c.fillStyle = withAlpha(ink, 0.3 + 0.68 * lit);
    c.fillText(text, -w / 2 + 5, y);
  };
  small("It's hard to fathom how much human-level AI", -h / 2 + 21);
  big('could benefit society,', -h / 2 + 31, o.litA);
  small("and it's equally hard to imagine how much it could", -h / 2 + 38.5);
  big('damage society if built', -h / 2 + 48, o.litB);
  big('or used incorrectly.', -h / 2 + 57.5, o.litB);
  // the lit phrases catch the lamp: a warm wash under them (the card's one glow)
  const lit = Math.max(o.litA, o.litB);
  if (lit > 0.01) {
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(0, 4, 0, 0, 4, w * 0.7);
    g.addColorStop(0, withAlpha(m.halo, 0.1 * lit));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(-w / 2, -h / 2, w, h);
  }
  c.restore();
}

// ------------------------------------------------------------------------------------------------ the lanterns
/** pendulum angle of a lantern swinging in from the side at t0 (radians; damped, on twos) */
function swing(tq: number, t0: number, from: number): { a: number; on: number } {
  if (tq < t0 - 0.35) return { a: from, on: 0 };
  const d = tq - (t0 - 0.35);
  const a = from * Math.exp(-d * 1.1) * Math.cos(d * 4.2);
  return { a, on: sm(d / 0.5) };
}
function lanternAt(which: 'warm' | 'cold', b: B, tq: number) {
  const s = which === 'warm' ? swing(tq, b.benefit, -0.9) : swing(tq, b.damage, 0.9);
  const len = CORD + (which === 'warm' ? 0 : 6);
  // both cords from the one nail; at rest the lanterns lean a little apart (warm left, cold right)
  return { pivot: NAIL, a: s.a + (which === 'warm' ? -REST_A : REST_A) * s.on, on: s.on, len };
}
function lanterns(c: C, env: PaintEnv, b: B, t: number) {
  const tq = tq12(t);
  for (const which of ['warm', 'cold'] as const) {
    const L = lanternAt(which, b, tq);
    if (L.on <= 0.001 && L.a === 0) continue;
    if (tq < (which === 'warm' ? b.benefit : b.damage) - 0.35) continue;
    const end = { x: L.pivot.x + Math.sin(L.a) * L.len, y: L.pivot.y + Math.cos(L.a) * L.len };
    c.strokeStyle = withAlpha(mixLab(env.mood.ink, env.mood.set, 0.3), 0.9);
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(L.pivot.x, L.pivot.y);
    c.lineTo(end.x, end.y);
    c.stroke();
    handLantern(c, env, end, L.a, which, L.on);
  }
  // the brass nail they share
  if (tq >= b.benefit - 0.35) {
    c.fillStyle = mixLab(env.mood.halo, '#8a6a2a', 0.45);
    c.beginPath();
    c.arc(NAIL.x, NAIL.y, 2.6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(env.mood.core, 0.7);
    c.beginPath();
    c.arc(NAIL.x - 0.7, NAIL.y - 0.8, 0.9, 0, Math.PI * 2);
    c.fill();
  }
}
/** a small hand-lantern: ring, cap, four-pane glass body lit from within, base (paper-cut; panes are holes) */
function handLantern(c: C, env: PaintEnv, top: { x: number; y: number }, a: number, which: 'warm' | 'cold', on: number) {
  const P = which === 'warm' ? WARM : { ...COLD, halo: COLD.halo, core: mixLab(COLD.rim, '#eef6fb', 0.35) };
  c.save();
  c.translate(top.x, top.y);
  c.rotate(-a * 0.6);
  const ink = env.fill('ink');
  c.strokeStyle = ink;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 6, 6, Math.PI * 1.05, Math.PI * 1.95);
  c.stroke();
  c.fillStyle = ink;
  // cap
  c.beginPath();
  c.moveTo(-5, 6);
  c.lineTo(5, 6);
  c.lineTo(13, 16);
  c.lineTo(-13, 16);
  c.closePath();
  c.fill();
  // glass: lit panes in the lantern's own light
  const g = c.createLinearGradient(0, 16, 0, 48);
  g.addColorStop(0, mixLab(mixLab(env.mood.set, P.halo, 0.6), P.core, 0.4 * on));
  g.addColorStop(1, mixLab(mixLab(env.mood.set, P.halo, 0.45), P.core, 0.25 * on));
  c.fillStyle = on > 0.02 ? g : mixLab(env.mood.set, env.mood.fg, 0.3);
  c.fillRect(-10, 16, 20, 32);
  // frame bars
  c.fillStyle = ink;
  c.fillRect(-11, 16, 2.2, 32);
  c.fillRect(8.8, 16, 2.2, 32);
  c.fillRect(-1, 16, 2, 32);
  c.fillRect(-13, 47, 26, 6);
  c.fillRect(-9, 53, 18, 3);
  // the flame inside
  if (on > 0.05) {
    c.fillStyle = withAlpha(P.core, 0.95 * on);
    c.beginPath();
    c.moveTo(-0.0, 26);
    c.quadraticCurveTo(4, 34, 0, 40);
    c.quadraticCurveTo(-4, 34, 0, 26);
    c.fill();
  }
  c.restore();
}
function lanternLight(f: Frame, b: B, t: number) {
  const tq = tq12(t);
  f.layer('L4', (c) => {
    for (const which of ['warm', 'cold'] as const) {
      const L = lanternAt(which, b, tq);
      if (L.on <= 0.01) continue;
      const P = which === 'warm' ? WARM : { halo: COLD.halo, core: mixLab(COLD.rim, '#eef6fb', 0.35) };
      const end = { x: L.pivot.x + Math.sin(L.a) * L.len, y: L.pivot.y + Math.cos(L.a) * L.len };
      const flick = 1 + 0.05 * Math.sin(tq * 19 + (which === 'warm' ? 0 : 2));
      glow(c, end.x, end.y + 34, 150, P.halo, 0.2 * L.on * flick);
      glow(c, end.x, end.y + 34, 34, P.core, 0.45 * L.on * flick);
    }
  });
}

// ================================================================================================ LEDGER (top-down)
/** a wide accounting ledger lying open on the side table (world px, the desk camera); the table's edge below it */
const BOOK = { spine: 420, top: 150, bottom: 560, pageW: 660 };
/** the book's slight angle on the table (radians, about its centre) */
const BOOK_ROT = -0.035;
const TABLE_EDGE = 676;
function ledgerView(f: Frame, b: B, t: number) {
  // pulled back: the ledger, the side table's dark edge, the lamp's pool; a slow drift
  const u = sm((t - b.ledger) / (b.D - b.ledger));
  const cam = mixFrame(LEDGER0, LEDGER1, u);
  f.camera(cam);
  f.backlight({ intensity: 0.1 });
  // far plane: the study floor far below the table's edge (dark boards; it slides slower than the table top)
  f.layer('L2', (c, env) => floorBelow(c, env));
  f.layer('L4', (c, env) => {
    desk(f, c, env);
    c.save();
    c.translate(BOOK.spine, (BOOK.top + BOOK.bottom) / 2);
    c.rotate(BOOK_ROT);
    c.translate(-BOOK.spine, -(BOOK.top + BOOK.bottom) / 2);
    ledgerBook(c, env, b, t);
    entry(c, env, b, t);
    // a flat hand turns the page: in from the lamp side (lower right) with a short forearm, and out again
    const tq = tq12(t);
    const k = clamp01((tq - b.turn0 + 0.35) / (0.5 * (b.turn1 - b.turn0) + 0.95));
    if (k > 0 && k < 1) {
      const E = toLayer(LAYERS.L4, cam, 1190, 800);
      const turnU = clamp01((tq - b.turn0) / (b.turn1 - b.turn0));
      const edgeX = BOOK.spine + BOOK.pageW * Math.cos(Math.PI * sm(turnU));
      const right = BOOK.spine + BOOK.pageW - 24;
      // the fingers lift the leaf's edge until it stands up (half-way), then let it fall over and withdraw
      const mid = b.turn0 + 0.33 * (b.turn1 - b.turn0);
      const lift = { x: BOOK.spine + BOOK.pageW * 0.5, y: 500 };
      const at = tq < b.turn0
        ? { x: lerp(E.x - 60, right, sm((tq - b.turn0 + 0.35) / 0.35)), y: 520 }
        : tq < mid
          ? { x: Math.max(lift.x, edgeX - 10), y: lerp(520, 500, turnU * 3) }
          : { x: lerp(lift.x, E.x, sm((tq - mid) / 0.6)), y: lerp(500, E.y, sm((tq - mid) / 0.6)) };
      const arm = hands.reach(E, at, 'flat', HAND_LEN * 1.15, { bend: 0.3 });
      hands.draw(c, { right: arm, scale: 1.15 }, env);
    }
    c.restore();
  });
  // the green-shaded lamp at top-left: its pool falls on the entry (the lit part of the page), the rest of the
  // table a stop down into the dark
  const pc = toScreen(LAYERS.L4, cam, BOOK.spine + 260, BOOK.top + 90);
  {
    const c = f.c;
    const g = c.createRadialGradient(pc.x, pc.y, 120, pc.x, pc.y, 900);
    g.addColorStop(0, withAlpha(f.mood.fg, 0));
    g.addColorStop(0.5, withAlpha(f.mood.fg, 0.25));
    g.addColorStop(1, withAlpha(f.mood.fg, 0.6));
    c.fillStyle = g;
    c.fillRect(0, 0, 1280, 720);
  }
  glow(f.c, pc.x, pc.y, 460, f.mood.halo, 0.16);
  // near (L5): the table's front edge along the bottom, soft and dark
  tableEdge(f);
  ledgerShade(f);
}

/** the table's near edge (L5, soft): a dark moulded lip across the bottom of the ledger frame */
const TE = (() => {
  const p = toLayer(LAYERS.L5, LEDGER0, 0, 642);
  const k = toScreen(LAYERS.L5, LEDGER0, 0, 0).k;
  return { y: p.y, k };
})();
function tableEdge(f: Frame) {
  f.layer('L5', (c, env) => {
    const u = 1 / TE.k;
    c.fillStyle = '#0b0d0b';
    c.fillRect(-4000 * u, TE.y, 12000 * u, 400 * u);
    c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.4), 0.38);
    c.fillRect(-4000 * u, TE.y - 2 * u, 12000 * u, 3 * u);
    c.fillStyle = withAlpha(env.mood.set, 0.5);
    c.fillRect(-4000 * u, TE.y + 14 * u, 12000 * u, 2 * u);
  });
}

/** the green-shaded lamp's shade at the ledger frame's top-left (near, soft, screen space), its lit underside lip */
function ledgerShade(f: Frame) {
  const c = f.c;
  const m = f.mood;
  c.save();
  c.filter = `blur(${(6 * f.pxScale) / 1.5}px)`;
  c.fillStyle = mixLab('#0b0d0b', '#24382c', 0.35);
  c.beginPath();
  c.moveTo(-20, -20);
  c.lineTo(330, -20);
  c.quadraticCurveTo(300, 40, 250, 78);
  c.quadraticCurveTo(120, 112, -20, 124);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(mixLab(m.core, '#fff2d0', 0.4), 0.55);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(-20, 124);
  c.quadraticCurveTo(120, 112, 250, 78);
  c.stroke();
  c.restore();
}

function desk(f: Frame, c: C, env: PaintEnv) {
  const draw = f.cached(`${ID}/desk3/${env.mood.id}`, 2400, 1500, (cc) => {
    cc.translate(500, 300);
    const m = env.mood;
    // the side table's top: dark wood, the lamp's pool warming its middle, grain lines
    cc.fillStyle = mixLab(m.set, m.fg, 0.45);
    cc.fillRect(-500, -300, 2400, TABLE_EDGE + 300);
    const g = cc.createRadialGradient(780, 330, 60, 780, 330, 820);
    g.addColorStop(0, withAlpha(mixLab(m.setHaze, m.halo, 0.45), 0.85));
    g.addColorStop(0.6, withAlpha(mixLab(m.set, m.halo, 0.2), 0.4));
    g.addColorStop(1, withAlpha(m.set, 0));
    cc.fillStyle = g;
    cc.fillRect(-500, -300, 2400, TABLE_EDGE + 300);
    cc.strokeStyle = withAlpha(m.fg, 0.25);
    cc.lineWidth = 1;
    for (let i = 0; i < 34; i++) {
      const y = -280 + i * 28 + hash1(i, 3) * 6;
      if (y > TABLE_EDGE - 4) break;
      cc.beginPath();
      cc.moveTo(-500, y);
      cc.bezierCurveTo(300, y + hash1(i, 4) * 14, 900, y - hash1(i, 5) * 14, 1900, y);
      cc.stroke();
    }
    // the table's edge: a moulded lip catching the lamp, then the dark floor far below
    cc.fillStyle = withAlpha(m.rim, 0.4);
    cc.fillRect(-500, TABLE_EDGE - 2, 2400, 2);
    cc.fillStyle = mixLab(m.ink, m.fg, 0.3);
    cc.fillRect(-500, TABLE_EDGE, 2400, 14);
  });
  draw(c, -500, -300);
}

/** the study floor far below the side table (L2): dark boards with faint seams, a little of the lamp's spill */
function floorBelow(c: C, env: PaintEnv) {
  const m = env.mood;
  c.fillStyle = mixLab('#0d0b09', m.fg, 0.35);
  c.fillRect(-1200, -600, 3800, 2600);
  c.fillStyle = withAlpha(mixLab(m.set, m.fg, 0.5), 0.55);
  for (let i = 0; i < 40; i++) c.fillRect(-1200 + i * 96 + hash1(i, 11) * 10, -600, 2, 2600);
  c.fillStyle = withAlpha(m.rim, 0.06);
  for (let i = 0; i < 40; i++) c.fillRect(-1200 + i * 96 + 3, -600, 1, 2600);
}


/** the open ledger: left page (older entries' ruled lines), right page turning over to a fresh page */
function ledgerBook(c: C, env: PaintEnv, b: B, t: number) {
  const m = env.mood;
  const paper = mixLab(paperTone(env, 0.82), m.rim, 0.15);
  const { spine, top, bottom, pageW } = BOOK;
  const H = bottom - top;
  // the book's shadow and boards
  c.fillStyle = withAlpha(m.fg, 0.55);
  c.fillRect(spine - pageW + 14, top + 16, pageW * 2, H);
  c.fillStyle = env.fill('ink');
  c.fillRect(spine - pageW - 8, top - 8, pageW * 2 + 16, H + 16);
  const page = (x0: number, w: number, tone: string, old = false) => {
    c.fillStyle = tone;
    c.fillRect(x0, top, w, H);
    // ruled lines and a column rule (oxblood-faint), as cut-lines
    c.fillStyle = withAlpha(mixLab(m.ink, tone, 0.6), 0.35);
    for (let y = top + 62; y < bottom - 20; y += 38) c.fillRect(x0 + 18, y, w - 36, 1);
    c.fillStyle = withAlpha(mixLab('#6a2a26', tone, 0.4), 0.45);
    c.fillRect(x0 + Math.max(14, w * 0.05), top + 20, 1.2, H - 40);
    if (old) {
      // older entries on the left page: illegible scribbles of ink, texture only
      c.fillStyle = withAlpha(mixLab(m.ink, tone, 0.45), 0.35);
      for (let i = 0; i < 9; i++) {
        const y = top + 52 + i * 38;
        const L = w * (0.35 + 0.45 * (hash1(i, 9) * 0.5 + 0.5));
        c.fillRect(x0 + w * 0.08, y, L, 2.2);
      }
    }
  };
  page(spine - pageW, pageW, mixLab(paper, m.set, 0.08), true);
  page(spine, pageW, paper);
  const gs = c.createLinearGradient(spine - 40, 0, spine + 40, 0);
  gs.addColorStop(0, withAlpha(m.fg, 0));
  gs.addColorStop(0.5, withAlpha(m.fg, 0.35));
  gs.addColorStop(1, withAlpha(m.fg, 0));
  c.fillStyle = gs;
  c.fillRect(spine - 40, top, 80, H);
  // the turning leaf: from the right page over to the left (foreshortened by cos, on twos), its underside darker
  const tq = tq12(t);
  const u = clamp01((tq - b.turn0) / (b.turn1 - b.turn0));
  if (u > 0 && u < 1) {
    const cx = Math.cos(Math.PI * sm(u));
    const w = pageW * Math.abs(cx);
    const x0 = cx >= 0 ? spine : spine - w;
    const tone = cx >= 0 ? mixLab(paper, m.halo, 0.12) : mixLab(paper, m.set, 0.18);
    // the lifted leaf throws a soft shadow across the page beneath it
    c.fillStyle = withAlpha(m.fg, 0.35 * Math.sin(Math.PI * u));
    c.fillRect(cx >= 0 ? spine : spine - w - 30, top + 6, w + 30, H);
    page(x0, w, tone, cx < 0);
    // shading across the lifted leaf: darker at the spine, lit at its free edge (it reads as a page in the air)
    const lg = c.createLinearGradient(spine, 0, cx >= 0 ? spine + w : spine - w, 0);
    lg.addColorStop(0, withAlpha(m.fg, 0.35));
    lg.addColorStop(0.7, withAlpha(m.fg, 0.05));
    lg.addColorStop(1, withAlpha(m.halo, 0.2));
    c.fillStyle = lg;
    c.fillRect(x0, top, w, H);
    c.fillStyle = withAlpha(m.rim, 0.7);
    c.fillRect(cx >= 0 ? x0 + w - 2 : x0, top, 2, H);
  }
}

/** the entry (the shot's second text item), typed on ONE line of the fresh page in Plex Mono, held to the cut */
function entry(c: C, env: PaintEnv, b: B, t: number) {
  if (t < b.type0) return;
  // one entry on two ruled lines (the ledger's lines are 38 px apart): the figure, then the funders' own words
  const lines = ['committed $1B ·', 'expected to spend a tiny fraction at first'];
  const total = lines[0].length + lines[1].length;
  const cps = total / (b.type1 - b.type0);
  const tq = tq12(t);
  let shown = Math.min(total, Math.floor((tq - b.type0) * cps));
  const x = BOOK.spine + BOOK.pageW * 0.05 + 12;
  const y0 = BOOK.top + 58;
  c.save();
  c.fillStyle = mixLab(env.mood.ink, '#2a1d14', 0.3);
  // at the 22 px cap-height floor under the ledger camera's widest framing (the push only makes it larger)
  const size = Math.max(23, legibleSize(c, `500 20px ${FONT.mono}`, 20));
  lines.forEach((ln, i) => {
    const s = ln.slice(0, Math.max(0, shown));
    shown -= ln.length;
    if (s) drawTracked(c, s, x, y0 + i * 38, { font: `500 ${size}px ${FONT.mono}`, size, tracking: 0 });
  });
  c.restore();
}

// ================================================================================================ type
function dateStamp(f: Frame, t: number, at: number, until: number) {
  const a = win(t, at - 0.05, at + 0.4) * (1 - win(t, until - 0.25, until));
  if (a <= 0) return;
  const c = f.c;
  const m = f.mood;
  const text = '11 DECEMBER 2015';
  c.save();
  c.globalAlpha = a;
  softPlate(c, 48 + 130, 672 - 8, 460, 84, m.ink, 0.5);
  c.fillStyle = mixLab('#efe3cf', m.core, 0.2);
  const size = legibleSize(c, `500 18.5px ${FONT.mono}`, 18.5) * 1.03;
  drawTracked(c, text, 48 + (1 - a) * -8, 672, { font: `500 ${size}px ${FONT.mono}`, size, tracking: 0.08 });
  c.globalAlpha = a * 0.6;
  c.fillRect(48, 672 - size * 1.55, 250 * a, 0.8);
  c.fillRect(48, 672 - size * 1.75, 0.8, 8);
  c.restore();
}
