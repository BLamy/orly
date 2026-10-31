/**
 * ch12-s03 — among the runners, a step back to 2021: Anthropic's announcement pinned bare in the founding row (F2,
 * beneath C4), the same warm and cold hand-lanterns on one nail, then the plain ledger for the money on the desk
 * under the lamp, and the four early-2023 runners set down beside it as chips (candleAmber, STUDY LOCK; 28.79 s
 * locked, narration re-recorded in round 3: every beat rides T.word / T.beat on the new clock; in: a plain cut from the stampede's study close (ch12-s08), no lamp change). Staged object for object from
 * OpenAI's founding (ch09-s04):
 *
 *   BOARD  0         frontal on the board's lower right under the lamp, pushing in to the founding row: OpenAI's 2015
 *                    announcement in F1 with its two lanterns (its lettering receded to texture here), F2 empty;
 *                    the green-shaded lamp's shade edge (near, soft, brass-lipped) holds the top-right corner and the
 *                    desk's front edge the bottom, under a dark vignette: the card pair is the one sharp, lit plane
 *          'Open'    OpenAI's card warms a quarter stop (the researchers it names are leaving it)
 *          'Daniela' (review r1) the hands come up from the lower edge carrying a typewritten announcement (≈ 2.2 s)
 *          'founded' they pin it into F2 (same height and size as F1); the date stamp sets in:
 *                    FOUNDED JAN 2021 · ANNOUNCED 28 MAY 2021 (founding and announcement kept apart)
 *          names     the pin stays bare (no name cards: the founders are named only in the narration); it settles;
 *                    the camera keeps pushing until the card is the subject (its phrase at the 22 px floor)
 *          'safety'  the spoken phrase 'an AI safety and research company' (resting at 35 % ink since the pin) lights; the COLD hand-lantern (the
 *                    danger the name answers) swings into light on the nail
 *          'research' the WARM one (the promise) swings in beside it. Nothing resolves.
 *   DESK   cut 14.86 a brief ledger INSERT in the silence after L1207, framed as ch09-s04 frames it (round 3 critic):
 *                    the whole open book lying on the desk, spine, both pages and the page edges in frame, ≈ 60 % of
 *                    the frame's width; the lamp's pool on the right page's working rows falling off ≈ 1.3 stops to
 *                    the page corners; the desk's dark front edge (L5) along the bottom. On 'ledger' the leaf turns
 *                    over (0.5 s), then the pen writes '$500M · FTX'; the left hand pastes a typed errata slip beneath
 *                    it, '(later exposed as fraud; Anthropic not implicated)' (a later annotation); for 'bigTech' the
 *                    pen writes 'billions · Amazon, Google' 16.3 → 16.92, done before 'Google announced' (17.14).
 *                    Even light: nothing comments on any entry.
 *          'bigTech'+0.15 the camera eases back and right to the race over ≥ 2 s (round 3: the re-recorded silence is
 *                    shorter, so the move starts while 'billions' is still being written and ends just after 'Bard'), the book kept whole at the left and the desk beside it
 *                    at the right, the pool widened over the entries and the chip block:
 *          'Bard'    the left hand sets BARD (6 FEB 2023) beside the ledger
 *          'Meta'    LLaMA (24 FEB 2023) slides in under the right hand's flat fingers, landing on 'Llama'
 *          'leaked'  the right hand ties a tag to it: WEIGHTS LEAKED / 3 MAR 2023
 *          'G'       (round 3 critic: fairness) both hands carry GPT-4 and CLAUDE in together, FACE DOWN, side by
 *                    side, to a poise over their slots (neither name is shown before the other; round 4: their
 *                    backs are printed: dark crosshatch, the ledger's red border rule, the date mirrored through)
 *          'Claude'  both turn face up together (the word CLAUDE is never on screen before it is said)
 *          'same'    both struck down together, the same instant (14 MAR 2023 on both), with ONE shared glint that
 *                    peaks on 'March'. The chips lie on the ledger's desk plane, contact shadows thrown away from
 *                    the lamp. NOTE: the script's beat 'sameDayChips' is on 'Claude' (the turn).
 *                    Holds lit into ch13's lamp change.
 *
 * TEXT RULE: the date stamp, the ledger entries, the errata slip, the chips and the leak tag (the announcement's lettering is prop type: only its
 * spoken phrase is typed large). Every dollar figure is on the ledger and nowhere else. One accent: the cold lantern.
 */
import { Timeline, ease } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { CAMERA3_HOME, FONT, LAYERS, PUPPET_NEAR_BLACK, cardProbe, defineShot, drawTracked, dustMotes, hash1, legibleSize, mixLab, softPlate, toLayer, toScreen, withAlpha } from '../../../film';
import { glow } from '../../../film/silhouette/metaphors/kit';
import { hands } from '../cast';
import { HAND_LEN, type ArmPose, type HandsPose } from '../sets/narratorHands';
import { slotWorld, studyCase, studyRoom } from '../sets/study';
import { SLOTS } from '../sets/studyState';
import { paperTone } from '../sets/caseBoard';
import { COLD, CORD, REST_A, WARM, handLantern, lanternPair, openaiCard, restPair } from '../sets/ch12-s03-founding';
import { frameOn, mixFrame } from '../sets/ch09-s03a-kit';
import { clamp01, lerp, sm, tq12, win } from '../sets/ch02-s05b-util';
import { SLIP, TAG, errataSlip, leakTag } from '../sets/ch12-s03-race';

type C = CanvasRenderingContext2D;
type Pt = { x: number; y: number };
const ID = 'ch12-s03';

// ------------------------------------------------------------------------------------------------ board geometry
const F2 = SLOTS.F2;
const F1C = slotWorld('F1');
const F2C = slotWorld('F2');
const F2PIN = slotWorld('F2', 'pin');
/** both lanterns hang from ONE brass nail beneath F2 (hope and fear on one nail) */
const NAIL = { x: F2C.x, y: F2C.y + F2.h / 2 + 6 };
/** OpenAI's pair, hung in ch09-s04, still on F1's nail */
const NAIL1 = { x: F1C.x, y: F1C.y + SLOTS.F1.h / 2 + 6 };

// ------------------------------------------------------------------------------------------------ board cameras
/** BOARD: frontal on the board's lower right (C3/C4 above the founding row) */
const BOARD0 = frameOn({ x: F2C.x - 70, y: 420 }, { x: 640, y: 360 }, 1.1);
/** INSERT on F2 (the pin): the founding row in the upper half, both nails' lanterns clear of the date stamp below,
 *  so the hands carry the card up from the lower edge, from under F1 across to F2 */
const INS0 = frameOn(F2C, { x: 690, y: 262 }, 2.15);
const INS1 = frameOn(F2C, { x: 684, y: 256 }, 2.24);
/** SAFE: the card is the subject (its spoken phrase at the 22 px floor) with the nail and both lanterns beneath it,
 *  OpenAI's card at frame left for the parallel */
const SAFE0 = frameOn(F2C, { x: 712, y: 176 }, 2.72);
const SAFE1 = frameOn(F2C, { x: 712, y: 164 }, 2.82);
const PUSH_END = 4.5;

// ------------------------------------------------------------------------------------------------ desk geometry
/** the desk (L4 world): its back edge meets the board wall; the ledger lies open at a slight angle, the chips beside */
const DESK_BACK = 118;
/** (round 3 critic: continuity with ch09-s04) the whole book is in frame in every desk framing (≈ 60 % of the frame's
 *  width at k ≈ 0.86–0.9): two 440 px pages, so the type is set larger to stay at the floor */
const BOOK = { spine: 470, top: 196, bottom: 590, pageW: 440 };
const BOOK_ROT = -0.022;
const BOOK_C = { x: BOOK.spine, y: (BOOK.top + BOOK.bottom) / 2 };
const RULE0 = BOOK.top + 72;
const PITCH = 48;
const baseY = (i: number) => RULE0 + i * PITCH - 8;
/** the ledger's Plex Mono: at the 22 px floor in EVERY desk framing (k ≥ 0.86: 26 × 0.86 × 0.70 × 1.5 ≈ 23.5 px) */
const LSIZE = 26;
const ADV = 0.6 * LSIZE;
const COL0 = BOOK.spine + 40;
/** the errata slip's top-left (book-local): pasted under the FTX row, its two lines on rows 1 and 2 */
const SLIP_P = { x: COL0 - SLIP.pad, y: baseY(0) + 12 };
const CHIP = { w: 200, h: 98 };
/** the chips lie on the desk beside the book (its right board ends at x ≈ 918) */
const CHIPS = [
  { id: 'bard', label: 'BARD', date: '6 FEB 2023', x: 1040, y: 262 },
  { id: 'llama', label: 'LLaMA', date: '24 FEB 2023', x: 1250, y: 262 },
  { id: 'gpt4', label: 'GPT-4', date: '14 MAR 2023', x: 1040, y: 448 },
  { id: 'claude', label: 'CLAUDE', date: '14 MAR 2023', x: 1250, y: 448 },
] as const;
/** the leak tag's punched corner, tied to LLaMA's lower right, hanging in the gap above CLAUDE's slot */
const TAG_AT = { x: 1138, y: 314 };
const TAG_ROT = 0.035;
type ChipId = (typeof CHIPS)[number]['id'];

// ------------------------------------------------------------------------------------------------ desk cameras
/** (round 3 critic) the whole open book centred, as ch09-s04 shows it: spine, both pages and the page edges, the
 *  desk's back edge and the board's foot above; a slow push of 2 % while the pen writes */
const DESK_A0 = frameOn({ x: 470, y: 393 }, { x: 640, y: 356 }, 0.88);
const DESK_A1 = frameOn({ x: 476, y: 392 }, { x: 640, y: 356 }, 0.9);
/** eased right: the whole book at the left (≈ 60 % of the width), the chips' square on the desk beside it */
const DESK_B = frameOn({ x: 704, y: 384 }, { x: 640, y: 354 }, 0.86);
/** the hold: a breath further in; the inkwell near at lower right */
const DESK_C = frameOn({ x: 707, y: 386 }, { x: 640, y: 352 }, 0.87);
const CAMS = [BOARD0, INS0, INS1, SAFE0, SAFE1, CAMERA3_HOME];

interface Cell {
  text: string;
  x0: number;
  y: number;
  t0: number;
  t1: number;
}
interface B {
  D: number;
  /** 'former': the hands come up from the lower edge under F1 with the new card */
  former: number;
  /** 'Open' … 'researchers': OpenAI's card lifts a quarter stop */
  open: number;
  openEnd: number;
  /** the ledger's leaf turns over, landing on 'million' */
  turn0: number;
  turn1: number;
  led: number;
  founded: number;
  names: number;
  /** the push from the insert to the card-as-subject */
  safe0: number;
  safe1: number;
  cold: number;
  warm: number;
  cut: number;
  cells: Cell[];
  pull0: number;
  pull1: number;
  /** the errata slip: carried in by the left hand, pressed down at slip1 */
  slip0: number;
  slip1: number;
  bard: number;
  /** LLaMA slides in from 'Meta' (llama0), landing on 'Llama'; its tag is tied on 'leaked' */
  llama0: number;
  llama: number;
  leak: number;
  /** GPT-4 and CLAUDE carried in together, face down, from 'G' (chips0 → chips1, the end of 'four'); both turned face
   *  up on 'Claude' (poise); both struck down together on 'same' */
  chips0: number;
  chips1: number;
  poise: number;
  strike: number;
  march: number;
}

const left = (text: string, x: number, i: number, t0: number, t1: number): Cell => ({ text, x0: x, y: baseY(i), t0, t1 });

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const founded = T.beat('pin');
    const w = (line: string, word: string) => T.word(line, word);
    const cold = T.beat('selfDescription');
    const warm = T.beat('largeSystems');
    // (round 2: L1208 was cut) the desk insert opens just after 'company'; the ledger's rows are card text in the
    // silence (beats 'ledger' and 'bigTech'), then the camera eases back to the race under L1219b
    const cut = T.line('L1207').end + 0.12;
    const mil = T.beat('ledger');
    const big = T.beat('bigTech');
    // (round 3 critic) the leaf turns over ON 'ledger' (0.5 s), then the pen writes; the bigTech row is written
    // 16.3 → 16.92 so it is finished before 'Google announced' (17.14): the two Googles never overlap
    const cells: Cell[] = [
      left('$500M · FTX', COL0, 0, mil + 0.32, mil + 0.72),
      left('billions · Amazon, Google', COL0, 3, big - 0.24, big + 0.38),
    ];
    const bard = T.beat('bard');
    const b: B = {
      D,
      // (review r1) the carry starts on 'Daniela', rising ≈ 2.2 s to the press on 'founded'
      former: w('L1206', 'Daniela'),
      open: w('L1206', 'Open'),
      openEnd: T.wordEnd('L1206', 'researchers'),
      turn0: mil - 0.25,
      turn1: mil + 0.25,
      led: w('L1206', 'led'),
      founded,
      names: T.beat('names'),
      safe0: founded + 0.9,
      safe1: cold - 0.2,
      cold,
      warm,
      cut,
      cells,
      // the pull-back as the last row finishes: the ledger stays in frame (and legible) beside the chips. (round 3
      // re-record: 'bigTech' → 'Bard' is only 1.4 s now, so the move starts as 'billions' is being written and runs
      // a slow ≥ 2 s ease that settles just after BARD lands, instead of a 0.9 s lurch)
      pull0: big + 0.15,
      pull1: Math.max(bard + 0.24, big + 0.15 + 2.0),
      slip0: mil + 0.5,
      slip1: mil + 0.98,
      bard,
      llama0: w('L1219b', 'Meta'),
      llama: w('L1219b', 'Llama'),
      leak: T.beat('llama'),
      chips0: w('L1219b', 'G') - 0.05,
      chips1: T.wordEnd('L1219b', 'four'),
      poise: T.beat('sameDayChips'),
      strike: w('L1219b', 'same'),
      march: w('L1219b', 'March'),
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const b = scene.b as B;
    const t = f.t;
    f.setMood('candleAmber');
    if (t < b.cut) {
      let cam: Camera3;
      if (t < PUSH_END) cam = mixFrame(BOARD0, INS0, ease.move(clamp01((t - 0.6) / (PUSH_END - 0.6))));
      else if (t < b.safe0) cam = mixFrame(INS0, INS1, sm((t - PUSH_END) / (b.safe0 - PUSH_END)));
      else if (t < b.safe1) cam = mixFrame(INS1, SAFE0, ease.move(clamp01((t - b.safe0) / (b.safe1 - b.safe0))));
      else cam = mixFrame(SAFE0, SAFE1, sm((t - b.safe1) / (b.cut - b.safe1)));
      boardView(f, b, t, cam);
      // the date: with the pin, to the cut (a step back in time the eye can read)
      dateStamp(f, t, b.founded - 0.35, b.cut + 0.3);
    } else deskView(f, b, t);
  },
});

// ================================================================================================ BOARD
function boardView(f: Frame, b: B, t: number, cam: Camera3) {
  f.camera(cam);
  studyRoom(f, { key: ID, cams: CAMS, outside: { mood: 'duskRose', kind: 'night' } });
  const tq = tq12(t);
  const u = pinPhase(b, tq);
  const placed = u >= 0.45;
  const settle = (t0: number, a: number) => (t > t0 ? a * Math.exp(-(t - t0) * 2.6) * Math.sin((t - t0) * 8) : 0);
  const sway = settle(b.founded, 0.05) + settle(b.names, 0.02);
  // (round 3 critic) the spoken phrase is held at low contrast until 'safety', then lifts to full over 0.3 s on it
  const lit = win(t, b.cold - 0.05, b.cold + 0.25);
  // OpenAI's card lifts a quarter stop on 'Open' (the researchers it names are leaving it), easing back after
  const openLift = win(t, b.open - 0.15, b.open + 0.35) * (1 - win(t, b.openEnd + 0.3, b.openEnd + 1.3));
  // the X-ray box's cyan steps down from 'safety' (the cold lantern is the shot's one accent)
  const xr = 1 - 0.35 * win(t, b.cold - 0.4, b.cold + 0.5);
  studyCase(f, {
    shot: ID,
    when: 'start',
    key: ID,
    shelf: false,
    board: { hide: ['F1'] },
    xray: { light: xr },
    flames: false,
    extra: (c, env) => {
      // the board's paper a step down (≈ 9 %) so the lit card and the lanterns carry the frame
      c.fillStyle = withAlpha(env.mood.fg, 0.11);
      c.fillRect(-1500, -1500, 5000, 4000);
      // F1 as ch09-s04 left it, its lettering receded to texture (F2 is the subject here)
      openaiCard(c, env, F1C.x, F1C.y, 0.3, 0.8 + 0.13 * openLift);
      lanterns(c, env, b, t);
      lanternPair(c, env, NAIL1, 0.55);
      if (placed) announcement(c, env, { x: F2C.x, y: F2C.y, rot: sway, lit, light: 0.86 });
      if (u > 0 && u < 1) {
        const hp = pinHand(u, cam);
        hands.draw(c, hp, env, { heldDraw: (cc, at, _h, e) => announcement(cc, e, { x: at.x, y: at.y + F2.h / 2 - 7, rot: 0, lit: 0, light: 0.8 }) });
      }
    },
  });
  lanternLight(f, b, t);
  f.layer('L4', (c, env) => dustMotes(c, { area: { x: F2C.x - 420, y: F2C.y - 360, w: 840, h: 560 }, count: 30, drift: { x: -3, y: -2 }, brightness: 0.4, salt: 904 }, env));
  boardVignette(f, cam);
  lampShade(f);
  boardNear(f, cam);
}

/** the near plane over the board (the camera dollies past L5/L6 here, so it is screen space with its own parallax):
 *  the desk's front edge along the bottom, a stack of two books on it at right, blurred, in near-black. It slides
 *  ~1.2× the action plane's own screen motion (clamped), so the push in reads against a black foreground plane. */
const F2_INS = toScreen(LAYERS.L4, INS0, F2C.x, F2C.y);
function boardNear(f: Frame, cam: Camera3) {
  const p = toScreen(LAYERS.L4, cam, F2C.x, F2C.y);
  const dx = Math.max(-24, Math.min(24, 0.2 * (p.x - F2_INS.x)));
  const dy = Math.max(-12, Math.min(24, 0.12 * (p.y - F2_INS.y)));
  const draw = f.cached(`${ID}/boardNear/${f.mood.id}`, 1440, 170, (cc) => {
    const m = f.mood;
    // the desk's front edge (canvas x = screen x + 80), sloping a touch down to the right
    cc.fillStyle = PUPPET_NEAR_BLACK;
    cc.beginPath();
    cc.moveTo(0, 54);
    cc.lineTo(1440, 64);
    cc.lineTo(1440, 170);
    cc.lineTo(0, 170);
    cc.closePath();
    cc.fill();
    // two books lying on it at right, and a pencil
    cc.fillRect(1010, 32, 250, 32);
    cc.fillRect(1040, 10, 198, 24);
    cc.fillRect(780, 55, 140, 5);
    // the lamp side (upper left) catches the top edges only
    cc.fillStyle = withAlpha(mixLab(m.rim, m.core, 0.3), 0.38);
    cc.beginPath();
    cc.moveTo(0, 54);
    cc.lineTo(1010, 61);
    cc.lineTo(1010, 62.4);
    cc.lineTo(0, 55.4);
    cc.fill();
    cc.fillRect(1040, 10, 198, 1.4);
    cc.fillRect(1010, 32, 30, 1.2);
    // the books' page edges between their boards (a faint warm band on each front face)
    cc.fillStyle = withAlpha(mixLab(m.set, m.core, 0.3), 0.22);
    cc.fillRect(1018, 40, 236, 16);
    cc.fillRect(1046, 15, 186, 13);
  }, { blur: 3 });
  draw(f.c, -80 + dx, 606 + dy);
}

/** the pin's phase u (0–.35 carry, .35–.45 settle, .45–.6 press, .6–1 withdraw): the carry runs from 'former' (the
 *  hands come up from the lower edge under F1) to just before 'founded' (the pin) */
function pinPhase(b: B, tq: number): number {
  const F = b.founded;
  if (tq < b.former - 0.1) return -1;
  if (tq < F - 0.25) return 0.35 * clamp01((tq - (b.former - 0.1)) / (F - 0.25 - (b.former - 0.1)));
  if (tq < F) return 0.35 + 0.1 * ((tq - (F - 0.25)) / 0.25);
  if (tq < F + 0.3) return 0.45 + 0.15 * ((tq - F) / 0.3);
  return Math.min(1.01, 0.6 + 0.4 * ((tq - F - 0.3) / 0.8));
}

/** the carry (world points: where the card's pin hole is): up from below the frame under F1, a rest low between the
 *  two slots while the narrator names OpenAI, then a slow rise across to F2 */
const CARRY0 = { x: F1C.x - 20, y: 812 };
const CARRY1 = { x: F1C.x + 76, y: 668 };
function carryAt(v: number, near: Pt): Pt {
  const lp = (a: Pt, z: Pt, k: number) => ({ x: lerp(a.x, z.x, k), y: lerp(a.y, z.y, k) });
  if (v < 0.3) return lp(CARRY0, CARRY1, 1 - Math.pow(1 - v / 0.3, 2.2));
  const k = sm((v - 0.3) / 0.7);
  // a gentle arc: over the quadratic's control point a little below the straight line
  const ctl = { x: lerp(CARRY1.x, near.x, 0.55), y: Math.max(CARRY1.y, near.y) + 10 };
  const a = lp(CARRY1, ctl, k), z = lp(ctl, near, k);
  return lp(a, z, k);
}

/** the pin: the forearm comes up from the frame's lower edge, the card pinched; it settles, presses, withdraws */
function pinHand(u: number, cam: Camera3): HandsPose {
  const scale = 0.7;
  const len = HAND_LEN * scale;
  const target = F2PIN;
  const near = { x: target.x + len * 0.12, y: target.y + len * 0.1 };
  const U = clamp01(u);
  // the forearm's entry slides along the lower edge with the carry, from under F1 to under F2
  const ex = lerp(470, 960, sm(clamp01(U / 0.35)));
  const E = toLayer(LAYERS.L4, cam, ex, 1060);
  const off = { x: lerp(E.x, target.x, 0.45), y: lerp(E.y, target.y, 0.45) };
  const lp = (a: Pt, z: Pt, k: number) => ({ x: lerp(a.x, z.x, k), y: lerp(a.y, z.y, k) });
  let at = target;
  let shape: 'pinch' | 'press' | 'rest' = 'pinch';
  let held: 'card' | 'none' = 'card';
  if (U < 0.35) at = carryAt(U / 0.35, near);
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

/** (review r1) the green-shaded banker's lamp's shade, near and soft, holding the frame's top-right corner (≈ 25 % of
 *  the corner): a dark green-black shade whose curved lower lip catches its own bulb in brass, with the bulb's warm
 *  light spilling under the lip. It motivates the key on the founding row (screen space; near-plane blur) */
function lampShade(f: Frame) {
  const c = f.c;
  const m = f.mood;
  const brass = mixLab(m.core, '#c89a4a', 0.5);
  // (round 3 critic) cropped ≈ 40 % smaller (scaled about the frame's top-right corner), with a lit inner lip and a
  // sharp brass rim on its lower edge, so it reads as a shade, not a dark ellipse
  c.save();
  c.translate(1300, -30);
  c.scale(0.77, 0.77);
  c.translate(-1300, 30);
  const shade = new Path2D();
  shade.moveTo(985, -30);
  shade.lineTo(1310, -30);
  shade.lineTo(1310, 150);
  // the lip: a shallow elliptical curve (the shade's open underside seen a little from below)
  shade.bezierCurveTo(1215, 142, 1090, 102, 1018, 50);
  shade.lineTo(1000, 22);
  shade.closePath();
  c.save();
  c.filter = `blur(${(4 * f.pxScale) / 1.5}px)`;
  // the bulb's spill under the lip (warm, additive)
  c.save();
  c.globalCompositeOperation = 'lighter';
  const sp = c.createRadialGradient(1180, 140, 6, 1180, 140, 240);
  sp.addColorStop(0, withAlpha(m.core, 0.34));
  sp.addColorStop(0.4, withAlpha(m.halo, 0.12));
  sp.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = sp;
  c.fillRect(900, 0, 420, 440);
  c.restore();
  c.fillStyle = mixLab(PUPPET_NEAR_BLACK, '#1c3324', 0.22);
  c.fill(shade);
  // a faint highlight down the shade's glass (the green reads), then the lit brass lip along the curve
  const gl = c.createLinearGradient(960, 0, 1310, 120);
  gl.addColorStop(0, withAlpha('#3d6a4a', 0));
  gl.addColorStop(0.5, withAlpha('#3d6a4a', 0.14));
  gl.addColorStop(1, withAlpha('#3d6a4a', 0));
  c.fillStyle = gl;
  c.fill(shade);
  c.strokeStyle = withAlpha(brass, 0.35);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(1000, 22);
  c.lineTo(985, -30);
  c.stroke();
  c.restore();
  // the lit inner lip: the shade's underside seen a little from below, warm from the bulb (barely blurred)
  c.save();
  c.filter = `blur(${(1.2 * f.pxScale) / 1.5}px)`;
  const lip = new Path2D();
  lip.moveTo(1310, 150);
  lip.bezierCurveTo(1215, 142, 1090, 102, 1018, 50);
  lip.bezierCurveTo(1086, 86, 1206, 124, 1310, 128);
  lip.closePath();
  const lg = c.createLinearGradient(1018, 50, 1310, 150);
  lg.addColorStop(0, withAlpha(mixLab(m.core, '#fff0c8', 0.3), 0.25));
  lg.addColorStop(0.6, withAlpha(mixLab(m.core, '#fff0c8', 0.3), 0.62));
  lg.addColorStop(1, withAlpha(m.core, 0.4));
  c.fillStyle = lg;
  c.fill(lip);
  c.strokeStyle = withAlpha(mixLab(brass, '#ffe2a8', 0.3), 0.95);
  c.lineWidth = 3.4;
  c.beginPath();
  c.moveTo(1310, 150);
  c.bezierCurveTo(1215, 142, 1090, 102, 1018, 50);
  c.stroke();
  c.restore();
  c.restore();
}

/** (review r1) a dark vignette on the board close, centred on the founding row, so the lit card pair is the one plane */
function boardVignette(f: Frame, cam: Camera3) {
  const c = f.c;
  const p = toScreen(LAYERS.L4, cam, (F1C.x + F2C.x) / 2, F2C.y + 30);
  c.save();
  c.translate(p.x, p.y);
  c.scale(1.3, 1);
  const g = c.createRadialGradient(0, 0, 120, 0, 0, 720);
  g.addColorStop(0, 'rgba(8,6,4,0)');
  g.addColorStop(0.45, 'rgba(8,6,4,0.34)');
  g.addColorStop(0.8, 'rgba(8,6,4,0.6)');
  g.addColorStop(1, 'rgba(8,6,4,0.72)');
  c.fillStyle = g;
  c.fillRect(-1500, -1200, 3000, 2400);
  c.restore();
}

/** the announcement's spoken self-description, typed large on the card in three short lines */
const PHRASE = 'an AI safety and research company';
const PHRASE_LINES = [PHRASE.slice(0, 12), PHRASE.slice(13, 25), PHRASE.slice(26)];
/** the phrase's resting ink before 'safety' (round 4: 0.17 read as blank paper) */
const PHRASE_REST = 0.35;
interface AnnOpts {
  x: number;
  y: number;
  rot: number;
  lit: number;
  light: number;
}
/** the typewritten announcement: a faint header and body; the SPOKEN phrase typed large on three short lines (at the
 *  22 px floor once the camera is in on the card), dim until the narrator says it, then struck dark and lit */
function announcement(c: C, env: PaintEnv, o: AnnOpts) {
  const w = F2.w, h = F2.h;
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
  // header: prop type (texture; the date stamp carries the dates)
  c.fillStyle = withAlpha(ink, 0.26);
  c.font = `400 7.4px ${FONT.typewriter}`;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillText('ANTHROPIC · 28 MAY 2021', -w / 2 + 6, -h / 2 + 11);
  c.fillRect(-w / 2 + 6, -h / 2 + 14, w - 12, 0.6);
  // the unspoken words: faint typewritten texture in the same tone and size as OpenAI's faint body in F1 (verbatim
  // from the announcement, research/quotes.json q11; its figure stays off the card: dollars live on the ledger)
  const faint = (text: string, y: number) => {
    c.font = `400 4.6px ${FONT.typewriter}`;
    c.fillStyle = withAlpha(ink, 0.24);
    c.fillText(text, -w / 2 + 6, y);
  };
  // (review round 4: at 17 % the resting phrase read as a blank card from the pin to 'safety') it rests at 35 % ink,
  // legible as typewriting, and still lifts to full on 'safety'
  const inkA = PHRASE_REST + (1 - PHRASE_REST - 0.02) * o.lit;
  const big = (text: string, y: number) => {
    const size = 11.2;
    c.font = `400 ${size}px ${FONT.typewriter}`;
    c.fillStyle = withAlpha(ink, inkA);
    c.fillText(text, -w / 2 + 6, y);
  };
  faint('Anthropic,', -h / 2 + 21);
  PHRASE_LINES.forEach((ln, i) => big(ln, -h / 2 + 33 + i * 13));
  // report the card to the card audit (paper fully opaque, the phrase's ink as drawn)
  cardProbe(c, 'ch12-anthropicCard', -w / 2, -h / 2, w, h, 1, inkA);
  // the lit phrase catches the lamp: a warm wash under it (the card's one glow)
  if (o.lit > 0.01) {
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(-8, 8, 0, -8, 8, w * 0.7);
    g.addColorStop(0, withAlpha(m.halo, 0.1 * o.lit));
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
  const a = from * Math.exp(-d * 1.6) * Math.cos(d * 4.2);
  return { a, on: sm(d / 0.4) };
}
function lanternAt(which: 'warm' | 'cold', b: B, tq: number) {
  const s = which === 'warm' ? swing(tq, b.warm, -0.9) : swing(tq, b.cold, 0.9);
  const len = CORD + (which === 'warm' ? 0 : 6);
  return { pivot: NAIL, a: s.a + (which === 'warm' ? -REST_A : REST_A) * s.on, on: s.on, len };
}
function lanterns(c: C, env: PaintEnv, b: B, t: number) {
  const tq = tq12(t);
  for (const which of ['warm', 'cold'] as const) {
    if (tq < (which === 'warm' ? b.warm : b.cold) - 0.35) continue;
    const L = lanternAt(which, b, tq);
    const end = { x: L.pivot.x + Math.sin(L.a) * L.len, y: L.pivot.y + Math.cos(L.a) * L.len };
    c.strokeStyle = withAlpha(mixLab(env.mood.ink, env.mood.set, 0.3), 0.9);
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(L.pivot.x, L.pivot.y);
    c.lineTo(end.x, end.y);
    c.stroke();
    handLantern(c, env, end, L.a, which, L.on);
  }
  if (tq >= Math.min(b.warm, b.cold) - 0.35) {
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
const COLD_CORE = mixLab(COLD.rim, '#eef6fb', 0.35);
function lanternLight(f: Frame, b: B, t: number) {
  const tq = tq12(t);
  f.layer('L4', (c) => {
    for (const L of restPair(NAIL1)) {
      const P = L.which === 'warm' ? WARM : { halo: COLD.halo, core: COLD_CORE };
      glow(c, L.end.x, L.end.y + 34, 120, P.halo, 0.1);
      glow(c, L.end.x, L.end.y + 34, 28, P.core, 0.25);
    }
    for (const which of ['warm', 'cold'] as const) {
      const L = lanternAt(which, b, tq);
      if (L.on <= 0.01) continue;
      const P = which === 'warm' ? WARM : { halo: COLD.halo, core: COLD_CORE };
      const end = { x: L.pivot.x + Math.sin(L.a) * L.len, y: L.pivot.y + Math.cos(L.a) * L.len };
      const flick = 1 + 0.05 * Math.sin(tq * 19 + (which === 'warm' ? 0 : 2));
      const k = which === 'warm' ? 1.45 : 1;
      glow(c, end.x, end.y + 34, 150, P.halo, 0.2 * k * L.on * flick);
      glow(c, end.x, end.y + 34, 34, P.core, 0.45 * k * L.on * flick);
    }
  });
}

// ================================================================================================ DESK
function deskCam(b: B, t: number): Camera3 {
  if (t < b.pull0) return mixFrame(DESK_A0, DESK_A1, sm((t - b.cut) / (b.pull0 - b.cut)));
  if (t < b.pull1) return mixFrame(DESK_A1, DESK_B, ease.move(clamp01((t - b.pull0) / (b.pull1 - b.pull0))));
  return mixFrame(DESK_B, DESK_C, sm((t - b.pull1) / (b.D - 1 - b.pull1)));
}

function deskView(f: Frame, b: B, t: number) {
  const cam = deskCam(b, t);
  const tq = tq12(t);
  f.camera(cam);
  f.backlight({ intensity: 0.08 });
  // far (L2): the Case Board's lower edge beyond the desk's back edge, the founding row's lanterns hanging there
  f.layer('L2', (c, env) => boardEdge(f, c, env, tq));
  f.layer('L4', (c, env) => {
    desk(f, c, env);
    // the lamp's spill on the wall just above the desk's back edge (flat, even; review r1: no runners here)
    c.save();
    c.globalCompositeOperation = 'lighter';
    const sg = c.createLinearGradient(0, DESK_BACK - 110, 0, DESK_BACK + 4);
    sg.addColorStop(0, withAlpha(env.mood.halo, 0));
    sg.addColorStop(0.55, withAlpha(env.mood.halo, 0.08));
    sg.addColorStop(1, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.3), 0.14));
    c.fillStyle = sg;
    c.fillRect(-800, DESK_BACK - 110, 3000, 114);
    c.restore();
    c.save();
    c.translate(BOOK_C.x, BOOK_C.y);
    c.rotate(BOOK_ROT);
    c.translate(-BOOK_C.x, -BOOK_C.y);
    ledgerBook(c, env, b, tq);
    entries(c, env, b, tq);
    const sp = slipPose(b, tq);
    if (sp && tq >= b.slip1) errataSlip(c, env, sp.p, 0, 0);
    c.restore();
    chipsAndHands(c, env, b, tq, t, cam, f.pxScale);
  });
  // the lamp's pool (the lamp stands near at upper left): a tight elliptical heart on the right page's working rows
  // and the chips, falling off ≈ 1.5 stops to the page corners, the left page and the desk beyond
  // (re-lit per setup: on the page's working rows for the close, widened over ledger and chips for the hold)
  const ph = sm((t - b.pull0) / (b.pull1 - b.pull0));
  // (review r1) for the hold the pool lies on the entries and the chip block and falls off down the empty lower page
  // (round 3 critic) a stop down and falling off to the page corners as in ch09-s04: the heart on the right page's
  // working rows (widened over the chips for the hold), ≈ 1.3 stops down at the outer page corners
  const pc = toScreen(LAYERS.L4, cam, lerp(690, 830, ph), lerp(326, 340, ph));
  const c = f.c;
  c.save();
  c.translate(pc.x, pc.y);
  c.scale(lerp(1.35, 1.75, ph), lerp(0.85, 0.72, ph));
  const R = lerp(470, 560, ph) * pc.k;
  const g = c.createRadialGradient(0, 0, 0, 0, 0, R);
  g.addColorStop(0, withAlpha(f.mood.fg, 0.08));
  g.addColorStop(0.3, withAlpha(f.mood.fg, 0.16));
  g.addColorStop(0.55, withAlpha(f.mood.fg, 0.4));
  g.addColorStop(0.8, withAlpha(f.mood.fg, 0.64));
  g.addColorStop(1, withAlpha(f.mood.fg, 0.82));
  c.fillStyle = g;
  c.fillRect(-1400, -1400, 2800, 2800);
  c.restore();
  glow(c, pc.x, pc.y - 20 * pc.k, 340 * pc.k, f.mood.halo, 0.07);
  // the last beat: the room settles a touch darker for the chapter's lamp change
  const endDim = win(t, b.D - 1.6, b.D);
  if (endDim > 0) {
    c.fillStyle = withAlpha(f.mood.fg, 0.12 * endDim);
    c.fillRect(0, 0, 1280, 720);
  }
  // near (L5): the desk's dark front edge along the bottom (round 3 critic: a near plane), the green-shaded lamp's
  // shade over the top-left corner, an inkwell at lower right
  f.layer('L5', (cc, env) => {
    deskEdge(cc, env);
    nearDesk(f, cc, env);
  });
}

// ---------------------------------------------------------------- far: the board's lower edge (L2, baked)
/** L2 point that lands at DESK_B's screen origin: the band is authored in DESK_B screen px */
const BAND0 = toLayer(LAYERS.L2, DESK_B, 0, 0);
/** the band sits this much higher than authored, so in the wide hold the founding cards are out of frame above and
 *  only their lanterns hang into it (no sliced card bottoms along the top edge) */
const BAND_LIFT = 54;
const BAND_CARDS = [
  { x: 470, nail: 44 },
  { x: 700, nail: 44 },
];
function boardEdge(f: Frame, c: C, env: PaintEnv, tq: number) {
  const draw = f.cached(`${ID}/band/${env.mood.id}`, 2600, 820, (cc) => {
    cc.translate(700, 520);
    const m = env.mood;
    // the study wall below the board (dark), the cork above, the board's moulded bottom rail
    cc.fillStyle = mixLab(m.set, m.fg, 0.55);
    cc.fillRect(-700, -520, 2600, 820);
    cc.fillStyle = mixLab(m.set, m.halo, 0.12);
    cc.fillRect(-700, -520, 2600, 680);
    cc.fillStyle = withAlpha(m.fg, 0.22);
    for (let i = 0; i < 900; i++) {
      const x = -700 + hash1(i, 21) * 0.5 * 2600 + 1300;
      const y = -520 + (hash1(i, 22) * 0.5 + 0.5) * 680;
      cc.fillRect(x, y, 1.6, 1.6);
    }
    cc.fillStyle = env.fill('ink');
    cc.fillRect(-700, 156, 2600, 26);
    cc.fillStyle = withAlpha(m.rim, 0.45);
    cc.fillRect(-700, 156, 2600, 1.6);
    // the founding row's cards (their lower halves), lettering as texture, each with its pair of lanterns
    BAND_CARDS.forEach((k, i) => {
      cc.fillStyle = withAlpha(m.fg, 0.4);
      cc.fillRect(k.x - 54, -60, 112, 100);
      cc.fillStyle = paperTone(env, 0.7);
      cc.fillRect(k.x - 56, -64, 112, 100);
      cc.fillStyle = withAlpha(m.ink, 0.22);
      for (let j = 0; j < 4; j++) cc.fillRect(k.x - 48, -40 + j * 14, 96 * (0.5 + 0.4 * (hash1(i * 7 + j, 23) * 0.5 + 0.5)), 3);
      lanternPair(cc, env, { x: k.x, y: k.nail }, 0.7);
    });
  });
  draw(c, BAND0.x - 700, BAND0.y - 520 - BAND_LIFT);
  // the lanterns' own light, low and desaturated (the room's accents stay at the board)
  BAND_CARDS.forEach((k, i) => {
    for (const L of restPair({ x: k.x, y: k.nail })) {
      const col = L.which === 'warm' ? WARM.halo : mixLab(COLD.halo, env.mood.halo, 0.35);
      const fl = 1 + 0.05 * Math.sin(tq * 17 + i * 2 + (L.which === 'warm' ? 0 : 1));
      glow(c, BAND0.x + L.end.x, BAND0.y - BAND_LIFT + L.end.y + 30, 70, col, 0.16 * fl);
    }
  });
}

// ---------------------------------------------------------------- the desk top (L4, baked)
function desk(f: Frame, c: C, env: PaintEnv) {
  const draw = f.cached(`${ID}/desk4/${env.mood.id}`, 3000, 1500, (cc) => {
    cc.translate(800, -DESK_BACK);
    const m = env.mood;
    cc.fillStyle = mixLab(m.set, m.fg, 0.45);
    cc.fillRect(-800, DESK_BACK, 3000, 1500);
    const g = cc.createRadialGradient(780, 350, 60, 780, 350, 900);
    g.addColorStop(0, withAlpha(mixLab(m.setHaze, m.halo, 0.45), 0.8));
    g.addColorStop(0.6, withAlpha(mixLab(m.set, m.halo, 0.2), 0.35));
    g.addColorStop(1, withAlpha(m.set, 0));
    cc.fillStyle = g;
    cc.fillRect(-800, DESK_BACK, 3000, 1500);
    cc.strokeStyle = withAlpha(m.fg, 0.25);
    cc.lineWidth = 1;
    for (let i = 0; i < 48; i++) {
      const y = DESK_BACK + 14 + i * 26 + hash1(i, 3) * 6;
      cc.beginPath();
      cc.moveTo(-800, y);
      cc.bezierCurveTo(300, y + hash1(i, 4) * 14, 1200, y - hash1(i, 5) * 14, 2200, y);
      cc.stroke();
    }
    // the back edge: a lit lip where the desk meets the wall, a shadow just in front of it
    const sh = cc.createLinearGradient(0, DESK_BACK, 0, DESK_BACK + 46);
    sh.addColorStop(0, withAlpha(m.fg, 0.55));
    sh.addColorStop(1, withAlpha(m.fg, 0));
    cc.fillStyle = sh;
    cc.fillRect(-800, DESK_BACK, 3000, 46);
    cc.fillStyle = withAlpha(m.rim, 0.42);
    cc.fillRect(-800, DESK_BACK, 3000, 1.8);
  });
  draw(c, -800, DESK_BACK);
}

// ---------------------------------------------------------------- the ledger (book-local coordinates)
function ledgerBook(c: C, env: PaintEnv, b: B, tq: number) {
  const m = env.mood;
  // (round 3 critic: blown out) the paper a stop down; the pool (deskView) does the rest
  const paper = mixLab(paperTone(env, 0.64), m.rim, 0.1);
  const { spine, top, bottom, pageW } = BOOK;
  const H = bottom - top;
  c.fillStyle = withAlpha(m.fg, 0.55);
  c.fillRect(spine - pageW + 14, top + 16, pageW * 2, H);
  c.fillStyle = env.fill('ink');
  c.fillRect(spine - pageW - 8, top - 8, pageW * 2 + 16, H + 16);
  // the book has a body (as in ch09-s04): stacked page edges showing under each page's outer and lower edge
  for (let i = 4; i >= 1; i--) {
    c.fillStyle = mixLab(paper, m.set, 0.25 + i * 0.08);
    c.fillRect(spine - pageW - i * 1.6, top + i * 2.2, pageW * 2 + i * 3.2, H);
    c.fillStyle = withAlpha(m.fg, 0.35);
    c.fillRect(spine - pageW - i * 1.6, top + H + i * 2.2 - 0.6, pageW * 2 + i * 3.2, 0.8);
  }
  const page = (x0: number, w: number, tone: string, old = false) => {
    c.fillStyle = tone;
    c.fillRect(x0, top, w, H);
    c.fillStyle = withAlpha(mixLab(m.ink, tone, 0.6), 0.35);
    for (let y = RULE0; y < bottom - 20; y += PITCH) c.fillRect(x0 + 18, y, w - 36, 1);
    c.fillStyle = withAlpha(mixLab('#6a2a26', tone, 0.4), 0.45);
    c.fillRect(x0 + 30, top + 20, 1.2, H - 40);
    c.fillRect(x0 + Math.min(w - 20, 150), top + 20, 1, H - 40);
    c.fillRect(x0 + Math.max(20, w - 150), top + 20, 1, H - 40);
    if (old) {
      // older entries on the left page: ink scribbles, texture only
      c.fillStyle = withAlpha(mixLab(m.ink, tone, 0.45), 0.35);
      for (let i = 0; i < 9; i++) {
        const y = RULE0 - 8 + i * PITCH;
        c.fillRect(x0 + w * 0.08, y, w * (0.35 + 0.45 * (hash1(i, 9) * 0.5 + 0.5)), 2.2);
      }
    }
  };
  page(spine - pageW, pageW, mixLab(paper, m.set, 0.08), true);
  page(spine, pageW, paper);
  // (review r1) the lamp's falloff down the page: the empty lower rows sink ≈ a stop below the entries
  const gd = c.createLinearGradient(0, RULE0 + 3 * PITCH + 10, 0, bottom);
  gd.addColorStop(0, withAlpha(m.fg, 0));
  gd.addColorStop(1, withAlpha(m.fg, 0.5));
  c.fillStyle = gd;
  c.fillRect(spine - pageW, RULE0 + 3 * PITCH + 10, pageW * 2, bottom - (RULE0 + 3 * PITCH + 10));
  // the left page lies out of the lamp's heart: it falls off toward its outer edge (≈ 1.5 stops at the corner)
  const gl = c.createLinearGradient(spine - pageW, 0, spine, 0);
  gl.addColorStop(0, withAlpha(m.fg, 0.55));
  gl.addColorStop(1, withAlpha(m.fg, 0.12));
  c.fillStyle = gl;
  c.fillRect(spine - pageW, top, pageW, H);
  // the pages curl down into the spine (the desk shows in the notch at top and bottom) and a deep gutter shadow
  c.fillStyle = env.fill('ink');
  for (const [y0, dir] of [[top, 1], [bottom, -1]] as const) {
    c.beginPath();
    c.moveTo(spine - 60, y0 - dir * 0.5);
    c.quadraticCurveTo(spine - 12, y0, spine, y0 + dir * 6);
    c.quadraticCurveTo(spine + 12, y0, spine + 60, y0 - dir * 0.5);
    c.lineTo(spine + 60, y0 - dir * 9);
    c.lineTo(spine - 60, y0 - dir * 9);
    c.closePath();
    c.fill();
  }
  const gs = c.createLinearGradient(spine - 60, 0, spine + 60, 0);
  gs.addColorStop(0, withAlpha(m.fg, 0));
  gs.addColorStop(0.42, withAlpha(m.fg, 0.32));
  gs.addColorStop(0.5, withAlpha(m.fg, 0.6));
  gs.addColorStop(0.56, withAlpha(m.fg, 0.4));
  gs.addColorStop(1, withAlpha(m.fg, 0));
  c.fillStyle = gs;
  c.fillRect(spine - 60, top + 4, 120, H - 8);
  c.fillStyle = withAlpha(m.halo, 0.12);
  c.fillRect(spine + 14, top + 8, 8, H - 16);
  // the shot cuts in on the previous spread (the right page full of older entries); the leaf turns over to the left
  // ON 'ledger' (0.5 s), and the fresh page beneath takes the first figure
  const u = clamp01((tq - b.turn0) / (b.turn1 - b.turn0));
  if (u < 1) {
    const cx = Math.cos(Math.PI * sm(u));
    const w = pageW * Math.abs(cx);
    const x0 = cx >= 0 ? spine : spine - w;
    const tone = cx >= 0 ? mixLab(paper, m.halo, 0.12 * Math.sin(Math.PI * u)) : mixLab(paper, m.set, 0.18);
    // the lifted leaf's soft shadow on the page it uncovers, fading away from its edge
    const se = cx >= 0 ? spine + w : spine - w;
    const sd = cx >= 0 ? 1 : -1;
    const sg = c.createLinearGradient(se, 0, se + sd * 60, 0);
    sg.addColorStop(0, withAlpha(m.fg, 0.4 * Math.sin(Math.PI * u)));
    sg.addColorStop(1, withAlpha(m.fg, 0));
    c.fillStyle = sg;
    c.fillRect(Math.min(se, se + sd * 60), top + 4, 60, H);
    page(x0, w, tone, true);
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

/** the entries, each written on its word in Plex Mono (the same plain ledger as every lab's money) */
function entries(c: C, env: PaintEnv, b: B, tq: number) {
  c.save();
  c.fillStyle = mixLab(env.mood.ink, '#2a1d14', 0.3);
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  // ≥ 22 px cap height while the camera is in on the page (k ≥ 1.28); a fixed size, so the right-hand column
  // stays aligned and the nib tracks the letters (Plex Mono advance = 0.6 em)
  const size = LSIZE;
  const font = `500 ${size}px ${FONT.mono}`;
  for (const cl of b.cells) {
    if (tq < cl.t0) continue;
    const n = Math.min(cl.text.length, Math.floor(((tq - cl.t0) / (cl.t1 - cl.t0)) * cl.text.length + 0.999));
    if (n <= 0) continue;
    drawTracked(c, cl.text.slice(0, n), cl.x0, cl.y, { font, size, tracking: 0 });
  }
  c.restore();
}

/** book-local → desk world */
function bookPt(p: Pt): Pt {
  const dx = p.x - BOOK_C.x, dy = p.y - BOOK_C.y;
  const cs = Math.cos(BOOK_ROT), sn = Math.sin(BOOK_ROT);
  return { x: BOOK_C.x + dx * cs - dy * sn, y: BOOK_C.y + dx * sn + dy * cs };
}

/** the pen's nib (book-local) and how high it is lifted (0 on the page … 1), or null when the pen is out */
function nibAt(b: B, tq: number): { p: Pt; lift: number } | null {
  const C = b.cells;
  const OFF = { x: BOOK.spine + BOOK.pageW + 260, y: BOOK.bottom + 260 };
  const s0 = (cl: Cell) => ({ x: cl.x0, y: cl.y - 3 });
  const s1 = (cl: Cell) => ({ x: cl.x0 + cl.text.length * ADV, y: cl.y - 3 });
  const lp = (a: Pt, z: Pt, k: number) => ({ x: lerp(a.x, z.x, k), y: lerp(a.y, z.y, k) });
  const in0 = b.turn1 - 0.25;
  if (tq < in0) return null;
  if (tq < C[0].t0) {
    const u = sm((tq - in0) / (C[0].t0 - in0));
    return { p: lp(OFF, s0(C[0]), u), lift: 1 - 0.85 * u };
  }
  for (let i = 0; i < C.length; i++) {
    const cl = C[i];
    if (tq > cl.t1) continue;
    if (tq >= cl.t0) {
      const k = (tq - cl.t0) / (cl.t1 - cl.t0);
      const p = lp(s0(cl), s1(cl), k);
      return { p: { x: p.x, y: p.y + Math.sin(tq * 47) * 2.2 }, lift: 0.04 + 0.04 * Math.abs(Math.sin(tq * 31)) };
    }
    const prev = C[i - 1];
    const u = sm((tq - prev.t1) / (cl.t0 - prev.t1));
    const d = Math.hypot(s0(cl).x - s1(prev).x, s0(cl).y - s1(prev).y);
    return { p: lp(s1(prev), s0(cl), u), lift: 0.08 + Math.sin(Math.PI * u) * Math.min(1, d / 220) * 0.7 };
  }
  const last = C[C.length - 1];
  const u = sm((tq - last.t1) / 0.5);
  if (u >= 1) return null;
  return { p: lp(s1(last), OFF, u), lift: 0.1 + 0.9 * u };
}

/** a pen arm whose nib lands on `nib` (the grip holds the pen at a writing angle) */
function penArm(entry: Pt, nib: Pt, len: number): ArmPose {
  let sock = nib;
  let arm = hands.reach(entry, sock, 'grip', len, { held: 'pen', bend: 0.1 });
  for (let i = 0; i < 3; i++) {
    const ang = arm.angle + (arm.bend ?? 0) + 0.5;
    sock = { x: nib.x - Math.cos(ang) * 0.55 * len, y: nib.y - Math.sin(ang) * 0.55 * len };
    arm = hands.reach(entry, sock, 'grip', len, { held: 'pen', bend: 0.1 });
  }
  return arm;
}

// ---------------------------------------------------------------- the chips and the hands
const HSCALE = 1.25;
/** the pen hand a touch smaller than the chip hands (≈ 0.85×), so its jointing reads as paper-cut, not armour */
const PEN_SCALE = 1.06;
/** the lamp is at top left: shadows fall down and to the right */
const SH = { x: 0.8, y: 1 };

function chip(c: C, env: PaintEnv, cx: number, cy: number, ch: (typeof CHIPS)[number], lift: number, glint: number, sweep = 0.5, flip = 1) {
  const m = env.mood;
  const w = CHIP.w, h = CHIP.h;
  const k = 1 + 0.035 * lift;
  c.save();
  c.translate(cx, cy);
  c.scale(k * Math.max(0.04, Math.abs(flip)), k);
  const paper = mixLab(paperTone(env, 0.86), m.rim, 0.12);
  const ink = mixLab(m.ink, '#2a1d14', 0.3);
  if (flip < 0) {
    chipBack(c, env, paper, ink);
    c.restore();
    return;
  }
  c.fillStyle = paper;
  c.fillRect(-w / 2, -h / 2, w, h);
  // a thin printed border inset (a plain card chip, no logos)
  c.strokeStyle = withAlpha(ink, 0.55);
  c.lineWidth = 1.2;
  c.strokeRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12);
  c.fillStyle = withAlpha(m.fg, 0.12);
  c.fillRect(-w / 2, h / 2 - 3, w, 3);
  c.fillStyle = ink;
  c.textBaseline = 'alphabetic';
  drawTracked(c, ch.label, 0, -2, { font: `600 29px ${FONT.mono}`, size: 29, tracking: 0.06, align: 'center' });
  c.fillStyle = withAlpha(ink, 0.88);
  drawTracked(c, ch.date, 0, 32, { font: `500 26px ${FONT.mono}`, size: 26, tracking: 0.02, align: 'center' });
  if (glint > 0.01) {
    // the lamp catches the date line: a warm lift (≈ +18 %) along it with a glint travelling across, peaking on
    // 'March', identical on both 14 MAR 2023 chips
    c.globalCompositeOperation = 'lighter';
    c.save();
    c.beginPath();
    c.rect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14);
    c.clip();
    c.translate(0, 22);
    c.scale(3.2, 1);
    const lift = c.createRadialGradient(0, 0, 0, 0, 0, 30);
    lift.addColorStop(0, withAlpha(mixLab(m.halo, m.core, 0.5), 0.26 * glint));
    lift.addColorStop(0.6, withAlpha(mixLab(m.halo, m.core, 0.5), 0.14 * glint));
    lift.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = lift;
    c.fillRect(-40, -30, 80, 60);
    c.restore();
    const gx = (sweep - 0.5) * w * 1.1;
    const g = c.createRadialGradient(gx, 22, 0, gx, 22, 34);
    g.addColorStop(0, withAlpha(m.core, 0.32 * glint));
    g.addColorStop(1, withAlpha(m.core, 0));
    c.fillStyle = g;
    c.fillRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14);
  }
  c.restore();
}
/** (review round 4: the face-down chips read as blank pale rectangles) the chip's printed back, so they are objects in
 *  the hand: a dark card under a fine dark crosshatch, the ledger's red border rule inset (the same rule as its page
 *  margins), and the face's date showing through the stock mirrored ('MAR 2023' read backwards, faint). Both backs are
 *  identical, so neither chip is named before 'Claude'. Drawn in the chip's own space (centre origin). */
function chipBack(c: C, env: PaintEnv, paper: string, ink: string) {
  const m = env.mood;
  const w = CHIP.w, h = CHIP.h;
  const stock = mixLab(paper, m.ink, 0.5);
  c.fillStyle = stock;
  c.fillRect(-w / 2, -h / 2, w, h);
  c.save();
  c.beginPath();
  c.rect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6);
  c.clip();
  // the bleed-through: the face's date, mirrored, a ghost in the stock (under the hatch)
  c.save();
  c.scale(-1, 1);
  c.fillStyle = withAlpha(mixLab(paper, stock, 0.35), 0.3);
  c.textBaseline = 'alphabetic';
  drawTracked(c, BACK_BLEED, 0, 32, { font: `500 26px ${FONT.mono}`, size: 26, tracking: 0.02, align: 'center' });
  c.restore();
  // the dark crosshatch (two diagonal sets)
  c.strokeStyle = withAlpha(mixLab(m.ink, '#120c08', 0.5), 0.55);
  c.lineWidth = 1;
  c.beginPath();
  for (let x = -w / 2 - h; x < w / 2 + h; x += 7) {
    c.moveTo(x, -h / 2);
    c.lineTo(x + h, h / 2);
    c.moveTo(x + h, -h / 2);
    c.lineTo(x, h / 2);
  }
  c.stroke();
  c.restore();
  // the ledger's border rule: a red double rule inset, as on the ledger's page margins
  const rule = mixLab('#6a2a26', paper, 0.3);
  c.strokeStyle = withAlpha(rule, 0.9);
  c.lineWidth = 1.6;
  c.strokeRect(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12);
  c.lineWidth = 0.8;
  c.strokeRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20);
  // a lamp-lit top edge so the card reads as stock, not a hole
  c.fillStyle = withAlpha(m.rim, 0.35);
  c.fillRect(-w / 2, -h / 2, w, 1.4);
  c.strokeStyle = withAlpha(ink, 0.5);
  c.lineWidth = 1;
  c.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);
}
/** the mirrored date bleeding through both backs (both chips are dated the same March day) */
const BACK_BLEED = 'MAR 2023';

/** (round 3 critic: the chips sat on no plane) the lamp's shadow on the desk, thrown down-right away from the lamp: a
 *  soft penumbra and a tight contact line at the chip's lower and right edges */
function chipShadow(c: C, env: PaintEnv, cx: number, cy: number, lift: number, flip = 1) {
  const d = 5 + 20 * lift;
  const w = CHIP.w * Math.max(0.04, Math.abs(flip));
  c.fillStyle = withAlpha(env.mood.fg, 0.24 - 0.08 * lift);
  c.fillRect(cx - w / 2 + SH.x * (d + 6), cy - CHIP.h / 2 + SH.y * (d + 6), w + 4, CHIP.h + 4);
  c.fillStyle = withAlpha(env.mood.fg, 0.5 - 0.2 * lift);
  c.fillRect(cx - w / 2 + SH.x * d, cy - CHIP.h / 2 + SH.y * d, w, CHIP.h);
}

interface ChipPose {
  /** centre (desk world) */
  p: Pt;
  lift: number;
  /** the chip is in a hand (drawn by the hand's heldDraw) */
  held: boolean;
  /** face-up turn: 1 face up, −1 face down (the x scale is |flip|) */
  flip?: number;
}
/** where each chip is at tq (null = not yet in frame) */
function chipAt(b: B, id: ChipId, tq: number): ChipPose | null {
  const ch = CHIPS.find((q) => q.id === id)!;
  const T = { x: ch.x, y: ch.y };
  const lp = (a: Pt, z: Pt, k: number) => ({ x: lerp(a.x, z.x, k), y: lerp(a.y, z.y, k) });
  if (id === 'bard') {
    const t1 = b.bard, dur = 0.85, from = { x: T.x - 120, y: T.y + 470 };
    if (tq < t1 - dur) return null;
    if (tq >= t1) return { p: T, lift: 0, held: false };
    const u = (tq - (t1 - dur)) / dur;
    return { p: lp(from, T, sm(u / 0.85)), lift: 1 - sm((u - 0.8) / 0.2), held: true };
  }
  if (id === 'gpt4' || id === 'claude') {
    // (round 3 critic: fairness) both carried in together from 'G', FACE DOWN, side by side, to a poise just above
    // their slots; both turned face up together on 'Claude'; both struck down together, the same instant, on 'same'
    const from = id === 'gpt4' ? { x: T.x - 170, y: T.y + 430 } : { x: T.x + 150, y: T.y + 430 };
    const H = { x: T.x, y: T.y - 16 };
    const a0 = b.chips0;
    const a1 = b.chips1;
    const s0 = b.strike - 0.17;
    const flip = Math.cos(Math.PI * (1 - sm((tq - (b.poise - 0.14)) / 0.28)));
    if (tq < a0) return null;
    if (tq >= b.strike) return { p: T, lift: 0, held: false, flip: 1 };
    if (tq < a1) return { p: lp(from, H, sm((tq - a0) / (a1 - a0))), lift: 1, held: true, flip };
    if (tq < s0) return { p: { x: H.x, y: H.y - 3 * Math.sin((tq - a1) * 3.2) }, lift: 1, held: true, flip };
    const k = (tq - s0) / (b.strike - s0);
    return { p: { x: T.x, y: lerp(H.y, T.y, k * k) }, lift: 1 - k, held: true, flip: 1 };
  }
  // LLaMA: slid along the desk under the right hand's flat fingers, in from the right, from 'Meta' into place on 'Llama'
  const t1 = b.llama, dur = Math.max(0.4, b.llama - b.llama0);
  if (tq < b.llama0 - 0.1) return null;
  const u = clamp01((tq - b.llama0) / dur);
  const k = 1 - Math.pow(1 - u, 2.4);
  return { p: { x: lerp(T.x + 250, T.x, k), y: lerp(T.y + 190, T.y, k) }, lift: 0, held: false };
}

/** the errata slip (book-local top-left), or null before it comes in */
function slipPose(b: B, tq: number): { p: Pt; lift: number; held: boolean } | null {
  const from = { x: SLIP_P.x - 300, y: SLIP_P.y + 470 };
  const a0 = b.slip0 - 0.05;
  if (tq < a0) return null;
  if (tq >= b.slip1) return { p: SLIP_P, lift: 0, held: tq < b.slip1 + 0.16 };
  const u = (tq - a0) / (b.slip1 - a0);
  return { p: { x: lerp(from.x, SLIP_P.x, sm(u / 0.85)), y: lerp(from.y, SLIP_P.y, sm(u / 0.85)) }, lift: 1 - sm((u - 0.78) / 0.22), held: true };
}

/** the leak tag (desk world, its punched corner), or null before it comes in */
function tagPose(b: B, tq: number): { p: Pt; lift: number; held: boolean } | null {
  const from = { x: TAG_AT.x + 260, y: TAG_AT.y + 460 };
  const a0 = b.leak - 0.7;
  if (tq < a0) return null;
  if (tq >= b.leak) return { p: TAG_AT, lift: 0, held: tq < b.leak + 0.14 };
  const u = (tq - a0) / (b.leak - a0);
  return { p: { x: lerp(from.x, TAG_AT.x, sm(u / 0.85)), y: lerp(from.y, TAG_AT.y, sm(u / 0.85)) }, lift: 1 - sm((u - 0.78) / 0.22), held: true };
}

function chipsAndHands(c: C, env: PaintEnv, b: B, tq: number, t: number, cam: Camera3, px: number) {
  const len = HAND_LEN * HSCALE;
  const ER = toLayer(LAYERS.L4, cam, 1330, 900);
  const EL = toLayer(LAYERS.L4, cam, 560, 960);
  // light is on ones: ONE shared glint from the strike, the two dates lifting together over ~0.6 s, peaking on 'March'
  const glintU = (t - b.strike) / 0.6;
  const glint = glintU > 0 && glintU < 1 ? Math.sin(Math.PI * glintU) : 0;
  // placed / sliding chips (with their shadows), then the carried ones' shadows
  const poses = CHIPS.map((ch) => ({ ch, pose: chipAt(b, ch.id, tq) }));
  for (const { ch, pose } of poses) {
    if (!pose || pose.held) continue;
    chipShadow(c, env, pose.p.x, pose.p.y, pose.lift);
    chip(c, env, pose.p.x, pose.p.y, ch, pose.lift, ch.date.startsWith('14') ? glint : 0, clamp01(glintU));
  }
  for (const { pose } of poses) if (pose && pose.held) chipShadow(c, env, pose.p.x, pose.p.y, pose.lift, pose.flip ?? 1);

  // the pen hand (right): its shadow on the page first (the lamp's), then the hand
  const nib = nibAt(b, tq);
  if (nib) {
    const nw = bookPt(nib.p);
    const plen = HAND_LEN * PEN_SCALE;
    const arm = penArm(ER, nw, plen);
    const ang = arm.angle + (arm.bend ?? 0) + 0.5;
    const sock = { x: nw.x - Math.cos(ang) * 0.55 * plen, y: nw.y - Math.sin(ang) * 0.55 * plen };
    const butt = { x: sock.x - Math.cos(ang) * 0.35 * plen, y: sock.y - Math.sin(ang) * 0.35 * plen };
    const d0 = 1.5 + 18 * nib.lift, d1 = 26 + 18 * nib.lift;
    c.save();
    c.lineCap = 'round';
    c.strokeStyle = withAlpha(env.mood.fg, 0.42);
    c.lineWidth = 0.06 * plen;
    c.beginPath();
    c.moveTo(nw.x + SH.x * d0, nw.y + SH.y * d0);
    c.lineTo(butt.x + SH.x * d1, butt.y + SH.y * d1);
    c.stroke();
    c.restore();
    armShadow(c, env, { right: arm, scale: PEN_SCALE }, 30 + 16 * nib.lift, px);
    hands.draw(c, { right: arm, scale: PEN_SCALE }, env);
  }

  // the leak tag: tied to LLaMA's lower right by a thread once it is down
  const tg = tagPose(b, tq);
  if (tg && tq >= b.leak) {
    const llama = CHIPS[1];
    const hole = { x: TAG_AT.x + 12 * Math.cos(TAG_ROT) - (TAG.h / 2) * Math.sin(TAG_ROT), y: TAG_AT.y + 12 * Math.sin(TAG_ROT) + (TAG.h / 2) * Math.cos(TAG_ROT) };
    c.strokeStyle = withAlpha(mixLab(env.mood.ink, '#2a1d14', 0.3), 0.75);
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(llama.x - CHIP.w / 2 + 34, llama.y + CHIP.h / 2 - 4);
    c.quadraticCurveTo(hole.x - 10, hole.y - 22, hole.x, hole.y);
    c.stroke();
    leakTag(c, env, tg.p, TAG_ROT, 0);
  }

  // the hands that carry
  const drawChipIn = (id: ChipId) => (cc: C, at: Pt, _h: unknown, e: PaintEnv) => {
    const ch = CHIPS.find((q) => q.id === id)!;
    const pose = chipAt(b, id, tq);
    chip(cc, e, at.x, at.y - CHIP.h / 2 + 8, ch, pose ? pose.lift : 0, 0, 0.5, pose?.flip ?? 1);
  };
  /** grip points: the slip pinched at its lower-left, the tag at its right end */
  const SLIP_G = { x: 34, y: SLIP.h - 8 };
  const TAG_G = { x: TAG.w - 26, y: TAG.h - 8 };
  const drawSlipIn = (cc: C, at: Pt, _h: unknown, e: PaintEnv) => {
    const sp = slipPose(b, tq);
    errataSlip(cc, e, { x: at.x - SLIP_G.x, y: at.y - SLIP_G.y }, BOOK_ROT, sp ? sp.lift : 0);
  };
  const drawTagIn = (cc: C, at: Pt, _h: unknown, e: PaintEnv) => {
    const tp = tagPose(b, tq);
    leakTag(cc, e, { x: at.x - TAG_G.x, y: at.y - TAG_G.y }, TAG_ROT, tp ? tp.lift : 0);
  };
  const sockOf = (p: Pt) => ({ x: p.x, y: p.y + CHIP.h / 2 - 8 });
  const away = (E: Pt, p: Pt, u: number) => ({ x: lerp(p.x, lerp(E.x, p.x, 0.12), u), y: lerp(p.y, lerp(E.y, p.y, 0.12), u) });
  type Held = (cc: C, at: Pt, h: unknown, e: PaintEnv) => void;
  /** a hand that carries something to sock S (while `held`), lets go at t1 and withdraws */
  const carry = (E: Pt, S: Pt, held: boolean, t1: number): ArmPose | null => {
    if (held) return hands.reach(E, S, tq >= t1 ? 'press' : 'pinch', len, { held: tq >= t1 ? 'none' : 'card', bend: 0.22 });
    const u = sm((tq - t1 - 0.18) / 0.7);
    // (review r1) gone once the wrist is out of frame (near the entry the reach would fold the sleeve back in)
    if (u >= 0.8) return null;
    return hands.reach(E, away(E, S, u), tq < t1 + 0.12 ? 'open' : 'rest', len, { bend: 0.22 });
  };
  const arms: { arm: ArmPose; side: 'left' | 'right'; held?: Held }[] = [];
  // the slip (left hand, during the ledger insert)
  const sp = slipPose(b, tq);
  if (sp) {
    const S = bookPt({ x: sp.p.x + SLIP_G.x, y: sp.p.y + SLIP_G.y });
    const a = carry(EL, S, sp.held, b.slip1);
    if (a) arms.push({ arm: a, side: 'left', held: sp.held && tq < b.slip1 ? drawSlipIn : undefined });
  }
  // BARD (left hand)
  const bp = chipAt(b, 'bard', tq);
  if (bp) {
    const a = carry(EL, sockOf(bp.p), bp.held, b.bard);
    if (a) arms.push({ arm: a, side: 'left', held: bp.held ? drawChipIn('bard') : undefined });
  }
  // LLaMA: the right hand's flat fingertips at the chip's lower right corner, pushing it in; then it lifts away
  const ll = chipAt(b, 'llama', tq);
  if (ll) {
    const S = { x: ll.p.x + CHIP.w / 2 - 26, y: ll.p.y + CHIP.h / 2 + 2 };
    const inU = sm((tq - (b.llama0 - 0.3)) / 0.3);
    const u = tq < b.llama ? 1 - inU : sm((tq - b.llama - 0.15) / 0.7);
    if (u < 0.75) arms.push({ arm: hands.reach(ER, away(ER, S, u), 'flat', len, { bend: 0.12 }), side: 'right' });
  }
  // the leak tag (right hand)
  if (tg) {
    const a = carry(ER, { x: tg.p.x + TAG_G.x, y: tg.p.y + TAG_G.y }, tg.held, b.leak);
    if (a) arms.push({ arm: a, side: 'right', held: tg.held && tq < b.leak ? drawTagIn : undefined });
  }
  // GPT-4 (left) and CLAUDE (right), struck down together. (round 3) their arms enter from further out, below the
  // frame's lower corners: from the shared entries the chips start too close to the shoulder and the reach folded
  // the sleeve back up across the ledger on 'G P T'
  const EL2 = toLayer(LAYERS.L4, cam, 400, 1200);
  const ER2 = toLayer(LAYERS.L4, cam, 1520, 1160);
  for (const [id, side, E] of [['gpt4', 'left', EL2], ['claude', 'right', ER2]] as const) {
    const cp = chipAt(b, id, tq);
    if (!cp) continue;
    const a = carry(E, sockOf(cp.p), cp.held, b.strike);
    if (a) arms.push({ arm: a, side, held: cp.held ? drawChipIn(id) : undefined });
  }
  const all = arms.map((q) => ({ ...q, pose: (q.side === 'left' ? { left: q.arm, scale: HSCALE } : { right: q.arm, scale: HSCALE }) as HandsPose }));
  for (const q of all) armShadow(c, env, q.pose, 34, px);
  for (const q of all) hands.draw(c, q.pose, env, q.held ? { heldDraw: q.held } : undefined);
}

/** the lamp's shadow of an arm on the desk: the same paper silhouette, blacked out, soft, offset away from the lamp */
function armShadow(c: C, env: PaintEnv, pose: HandsPose, d: number, px: number) {
  c.save();
  c.translate(SH.x * d, SH.y * d);
  c.globalAlpha = 0.26;
  c.filter = `brightness(0) blur(${(2.5 * px) / 1.5}px)`;
  hands.draw(c, pose, env);
  c.restore();
}

// ---------------------------------------------------------------- near: the banker's lamp and an inkwell (L5, baked)
/** L5 art authored in the screen px of one framing (so it lands exactly there), then left to true parallax: the lamp
 *  is composed for the writing close (DESK_A1) and slides out left as the camera pulls back; the inkwell is composed
 *  for the hold (DESK_C) and slides in from the right */
function bakedAt(cam: Camera3, x0: number, y0: number) {
  const O = toLayer(LAYERS.L5, cam, x0, y0);
  const k = toScreen(LAYERS.L5, cam, 0, 0).k;
  return { O, k };
}
const LAMP_BOX = { x0: -280, y0: -120, w: 760, h: 1000 };
const LAMP_AT = bakedAt(DESK_A1, LAMP_BOX.x0, LAMP_BOX.y0);
const INK_BOX = { x0: 1020, y0: 440, w: 360, h: 380 };
const INK_AT = bakedAt(DESK_C, INK_BOX.x0, INK_BOX.y0);

/** (round 3 critic) the desk's front edge along the frame's bottom (L5, near, dark): a moulded lip catching the lamp,
 *  composed for DESK_B (screen y ≈ 664) and left to true parallax */
const EDGE = (() => {
  const p = toLayer(LAYERS.L5, DESK_B, 0, 664);
  const k = toScreen(LAYERS.L5, DESK_B, 0, 0).k;
  return { y: p.y, k };
})();
function deskEdge(c: C, env: PaintEnv) {
  const u = 1 / EDGE.k;
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(-4000 * u, EDGE.y, 12000 * u, 400 * u);
  c.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.4), 0.42);
  c.fillRect(-4000 * u, EDGE.y - 2 * u, 12000 * u, 3 * u);
  c.fillStyle = withAlpha(env.mood.set, 0.5);
  c.fillRect(-4000 * u, EDGE.y + 16 * u, 12000 * u, 2 * u);
}

function nearDesk(f: Frame, c: C, env: PaintEnv) {
  const m = env.mood;
  const brass = mixLab(m.core, '#c89a4a', 0.55);
  const lamp = f.cached(`${ID}/nearLamp/${m.id}`, LAMP_BOX.w / LAMP_AT.k, LAMP_BOX.h / LAMP_AT.k, (cc) => {
    cc.scale(1 / LAMP_AT.k, 1 / LAMP_AT.k);
    cc.translate(-LAMP_BOX.x0, -LAMP_BOX.y0);
    // (authored in DESK_A1 screen px) the green-shaded banker's lamp: a straight-edged trapezoid shade over the
    // top-left corner, its brass lip catching the bulb, a pull chain, the stem down the frame's left edge to the base
    const ink = PUPPET_NEAR_BLACK;
    const shadeInk = mixLab(ink, '#1c3324', 0.4);
    cc.fillStyle = shadeInk;
    cc.beginPath();
    cc.moveTo(-260, -110);
    cc.lineTo(250, -110);
    cc.lineTo(380, 92);
    cc.lineTo(-260, 92);
    cc.closePath();
    cc.fill();
    // the shade's top-edge bead and the lip, a darker band
    cc.fillStyle = ink;
    cc.fillRect(-260, 80, 645, 12);
    // the bulb's light spilling under the lip
    const gl = cc.createLinearGradient(0, 92, 0, 150);
    gl.addColorStop(0, withAlpha(m.core, 0.32));
    gl.addColorStop(1, withAlpha(m.core, 0));
    cc.fillStyle = gl;
    cc.beginPath();
    cc.moveTo(-260, 92);
    cc.lineTo(384, 92);
    cc.lineTo(430, 150);
    cc.lineTo(-260, 150);
    cc.closePath();
    cc.fill();
    // brass rims: the lip (2 px) and a hairline up the slanted side, on the lamp-lit edges
    cc.fillStyle = withAlpha(brass, 0.95);
    cc.fillRect(-260, 90.5, 646, 2.2);
    cc.strokeStyle = withAlpha(brass, 0.55);
    cc.lineWidth = 1.4;
    cc.beginPath();
    cc.moveTo(250, -110);
    cc.lineTo(380, 92);
    cc.stroke();
    // the pull chain: a beaded line and its brass pull
    cc.fillStyle = ink;
    for (let y = 98; y < 196; y += 6) {
      cc.beginPath();
      cc.arc(318, y, 2.6, 0, Math.PI * 2);
      cc.fill();
    }
    cc.beginPath();
    cc.moveTo(318, 194);
    cc.quadraticCurveTo(331, 212, 318, 228);
    cc.quadraticCurveTo(305, 212, 318, 194);
    cc.fill();
    cc.fillStyle = withAlpha(brass, 0.8);
    cc.fillRect(313.5, 200, 1.6, 18);
    // the stem down the left edge, and the base's dome at the bottom-left corner
    cc.fillStyle = ink;
    cc.fillRect(40, 92, 22, 640);
    cc.beginPath();
    cc.ellipse(51, 770, 130, 80, 0, Math.PI, Math.PI * 2);
    cc.fill();
    cc.fillRect(-79, 770, 260, 120);
    cc.strokeStyle = withAlpha(brass, 0.5);
    cc.lineWidth = 2;
    cc.beginPath();
    cc.ellipse(51, 770, 128, 78, 0, Math.PI * 1.25, Math.PI * 1.62);
    cc.stroke();
    cc.fillStyle = withAlpha(brass, 0.4);
    cc.fillRect(62, 92, 1.4, 600);
  }, { blur: 2 });
  lamp(c, LAMP_AT.O.x, LAMP_AT.O.y);
  const ink = f.cached(`${ID}/nearInk/${m.id}`, INK_BOX.w / INK_AT.k, INK_BOX.h / INK_AT.k, (cc) => {
    cc.scale(1 / INK_AT.k, 1 / INK_AT.k);
    cc.translate(-INK_BOX.x0, -INK_BOX.y0);
    // (authored in DESK_C screen px) a squat glass inkwell, near, at the lower right: a domed body, neck, brass
    // collar catching the lamp from the upper left, a dip pen standing in it
    const K = PUPPET_NEAR_BLACK;
    cc.strokeStyle = K;
    cc.lineWidth = 5;
    cc.lineCap = 'round';
    cc.beginPath();
    cc.moveTo(1196, 610);
    cc.lineTo(1262, 486);
    cc.stroke();
    cc.lineWidth = 2;
    cc.beginPath();
    cc.moveTo(1262, 486);
    cc.lineTo(1272, 466);
    cc.stroke();
    cc.fillStyle = K;
    cc.beginPath();
    cc.moveTo(1092, 820);
    cc.lineTo(1100, 676);
    cc.quadraticCurveTo(1104, 628, 1160, 622);
    cc.lineTo(1164, 600);
    cc.lineTo(1232, 600);
    cc.lineTo(1236, 622);
    cc.quadraticCurveTo(1292, 628, 1296, 676);
    cc.lineTo(1304, 820);
    cc.closePath();
    cc.fill();
    cc.strokeStyle = withAlpha(brass, 0.85);
    cc.lineWidth = 2;
    cc.beginPath();
    cc.moveTo(1162, 604);
    cc.lineTo(1234, 604);
    cc.stroke();
    cc.strokeStyle = withAlpha(m.rim, 0.45);
    cc.lineWidth = 1.6;
    cc.beginPath();
    cc.moveTo(1101, 690);
    cc.quadraticCurveTo(1104, 630, 1158, 624);
    cc.stroke();
    cc.strokeStyle = withAlpha(m.rim, 0.3);
    cc.lineWidth = 1.2;
    cc.beginPath();
    cc.moveTo(1205, 594);
    cc.lineTo(1262, 488);
    cc.stroke();
  }, { blur: 2.5 });
  ink(c, INK_AT.O.x, INK_AT.O.y);
}

// ================================================================================================ type
function dateStamp(f: Frame, t: number, at: number, until: number) {
  const a = win(t, at - 0.05, at + 0.4) * (1 - win(t, until - 0.25, until));
  if (a <= 0) return;
  const c = f.c;
  const m = f.mood;
  const text = 'FOUNDED JAN 2021 · ANNOUNCED 28 MAY 2021';
  c.save();
  c.globalAlpha = a;
  const size = legibleSize(c, `500 18.5px ${FONT.mono}`, 18.5) * 1.03;
  const wTxt = text.length * size * 0.6 * 1.08;
  // baseline 596 of 720 (≈ 894 at 1080p): above the bottom 12 %, on a soft plate; the board framings keep every
  // lantern above it
  const Y = 596;
  softPlate(c, 48 + wTxt / 2, Y - size * 0.4, wTxt + 120, size * 4.2, m.ink, 0.6);
  c.fillStyle = mixLab('#efe3cf', m.core, 0.2);
  drawTracked(c, text, 48 + (1 - a) * -8, Y, { font: `500 ${size}px ${FONT.mono}`, size, tracking: 0.08 });
  c.globalAlpha = a * 0.6;
  c.fillRect(48, Y - size * 1.55, 500 * a, 0.8);
  c.fillRect(48, Y - size * 1.75, 0.8, 8);
  c.restore();
}
