/**
 * ch07-s06 — the warm-up candle gutters at an uncertain ring; its tag goes onto the coat hook, the X-ray column's
 * fourth band lights, and the two accomplices' clue cards are pinned (candleAmber throughout, STUDY LOCK; 8.17 s).
 *
 * ONE CONTINUOUS MOVE in three phrases (review ch07 r1: no whip-pans):
 *   0 → 3.3       SHELF MACRO, one slow push onto the 2006 candle and its tag. 'guttered' −.36: the flame shrinks
 *                 at once, a thread of smoke curls up, the sleeve's top is left FRAYED; the hanging tag and the
 *                 shot's own label read c. 2006 – c. 2010–12 (the kit's naming card is switched off here: a single
 *                 year would contradict 'nobody knows exactly when'). ≈ 2.3–3.0 the pen inks PRE-TRAINING on the
 *                 blank tag, the camera held; the hand takes it off the stub
 *   3.3 → 5.0     the hand carries the tag as the camera rises and trucks right to the COAT: coat and hook in the
 *                 right third, the board's edge at left (exactly the framing ch11-s01 opens on); 'coat' +.35 the
 *                 tag is tied to the sleeve and sways (held ≈ 1.2 s)
 *   5.5 → 6.7     the camera eases back to ONE composed frame: the board's C1–C3 columns, the case card, the coat
 *                 and the X-ray box. The box stays dark until ≈ 5.3, glows up (more translucent than last time) and
 *                 lights ONLY its fourth band, slowly; as it fades the hands pin DATA (C3-a) and FIRE (C3-b); two
 *                 threads of light run to the 1986 bead card (above the case card) and the 1989 stencil card
 *                 (below it); the cards' names are called out at the legibility floor; hold to the end
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { LAYERS, MOODS, defineShot, mixLab, toScreen, withAlpha } from '../../../film';
import { hands } from '../cast';
import { HAND_LEN, handsEntry, type Pt } from '../sets/narratorHands';
import { STUDY, candleX, slotWorld, studyCase, studyNear, studyRoom } from '../sets/study';
import { LIT_HEIGHT, SLOTS, shelfStateAt } from '../sets/studyState';
import { candleFlame } from '../sets/beliefCandle';
import { DEFAULT_POOL, drawCard, poolAt } from '../sets/caseBoard';
import { lightThread } from '../sets/ch05-s07-kit';
import { penArmTo } from '../sets/ch07-s01-betSheet';
import { COAT, frockCoat, sleeveTie } from '../sets/ch07-s06-coat';
import { XRAY } from '../sets/xrayColumn';
import { FONT } from '../../../film/silhouette/type';
import { capFont, clamp01, lerp, mixCam, monoCard, paperTag, pulse, sm, tq12, win } from '../sets/ch07-s01-kit';

type C = CanvasRenderingContext2D;
const ID = 'ch07-s06';
const CYAN = MOODS.serverCyan;

// ------------------------------------------------------------------------------------------------ shelf
const V0 = shelfStateAt(ID, 'start');
const V1 = shelfStateAt(ID, 'end');
const WX = candleX(V0, 'warmup');
const SHELF_Y = STUDY.shelf.y;
const W0 = V0.find((v) => v.id === 'warmup')!;
const FLAME = candleFlame({ x: WX, y: SHELF_Y, view: W0, s: STUDY.shelf.s });
const SLEEVE_TOP = SHELF_Y - LIT_HEIGHT * STUDY.shelf.s;
/** the blank tag on the stub (big enough that PRE-TRAINING reads at ≥ 17 px on the coat close) */
const TAG = { x: WX - 34, y: SHELF_Y - 112, w: 84, h: 30, len: 14 };
const TAG_TEXT = 'PRE-TRAINING';
const DATES = 'c. 2006 – c. 2010–12';
const TIE = sleeveTie({});
// ------------------------------------------------------------------------------------------------ cameras
const SH0: Camera3 = { x: WX - 70, y: SHELF_Y - 150, z: 430, lens: 1 };
const SH1: Camera3 = { x: WX - 52, y: SHELF_Y - 146, z: 470, lens: 1 };
const TAGCAM: Camera3 = { x: WX + 24, y: SLEEVE_TOP + 112, z: 600, lens: 1 };
/** the COAT (ch11-s01's opening framing): coat and hook in the right third, the board's edge at left (k ≈ 1.7) */
const COATC: Camera3 = { x: 1030, y: 240, z: 412, lens: 1 };
/** the composed end frame (k = 1.25): from the gap left of C1 to the X-ray box's right edge, the question thread
 *  to the X-ray's foot; nothing cropped mid-word */
const WIDE: Camera3 = { x: 821, y: 362, z: 187, lens: 1 };
const WIDE1: Camera3 = { x: 821, y: 362, z: 190, lens: 1 };
const CAMS = [SH0, SH1, TAGCAM, COATC, WIDE, WIDE1, { x: 1000, y: 620, z: 150, lens: 1 }];
const POOL = { ...DEFAULT_POOL, ...STUDY.pool, cx: STUDY.pool.cx - STUDY.board.x, cy: STUDY.pool.cy - STUDY.board.y };

interface B {
  D: number;
  gutter: number;
  swap: number;
  pen0: number;
  ink0: number;
  ink1: number;
  penAway: number;
  lift: number;
  crane0: number;
  tie: number;
  back0: number;
  back1: number;
  xray: number;
  /** the X-ray box: dark until xr0, glows up over 0.8 s, band 4 lights from band0 over 1.1 s, dims from xrOut */
  xr0: number;
  xrOut: number;
  band0: number;
  pinA: number;
  pinB: number;
  thread0: number;
}
const PIN_DUR = 0.8;

export default defineShot({
  id: ID,
  mood: 'candleAmber',
  build({ timing: T }) {
    const tl = new Timeline();
    const D = T.duration;
    const gutter = T.beat('gutter');
    const ink0 = T.line('L0710').end - 1.35;
    const tie = T.beat('coat') + 0.35;
    const xray = T.beat('xray');
    const clue = T.beat('clue');
    const b: B = {
      D,
      gutter,
      swap: gutter + 0.55,
      pen0: ink0 - 0.28,
      ink0,
      ink1: ink0 + 0.65,
      penAway: ink0 + 0.9,
      lift: ink0 + 0.95,
      crane0: ink0 + 0.97,
      tie,
      back0: tie + 0.3,
      back1: tie + 1.5,
      xray,
      xr0: xray - 0.15,
      xrOut: clue,
      band0: xray + 0.5,
      pinA: clue - 0.32,
      pinB: clue + 0.02,
      thread0: clue + 0.05,
    };
    tl.hold(0, D);
    return { tl, b };
  },
  paint(f, _s, scene) {
    const t = f.t;
    const b = scene.b as B;
    const cam = camAt(t, b);
    f.camera(cam);
    const tq = tq12(t);
    studyRoom(f, { key: ID, cams: CAMS, outside: { mood: 'duskRose', kind: 'city' } });
    // the gutter: the flame drops at once on the beat, then dies to a frayed, smoking top
    const out = t >= b.swap;
    const fk = out ? 0 : 1 - 0.62 * sm((t - b.gutter + 0.08) / 0.28) - 0.25 * sm((t - b.gutter - 0.2) / 0.3);
    const views = (out ? V1 : V0).map((v) => (v.id === 'warmup' ? { ...v, tag: '2006' } : v));
    const entry = handsEntry(cam, 'L4');
    // the X-ray box glows up on its own (no hand near it); band 4 lights 0.2 → 1 over 0.8 s
    // dark until ≈ 5.3, then it glows up over 0.8 s (held lower than before: a practical, not a cyan wall),
    // lights ONLY band 4, slowly; as the clue cards are pinned it fades back
    const xl = 0.72 * win(t, b.xr0, b.xr0 + 0.8) - 0.3 * win(t, b.xrOut, b.xrOut + 0.8);
    const ru = t < b.band0 ? 0 : sm(clamp01((t - b.band0) / 1.1));
    const uA = (tq - (b.pinA - 0.45 * PIN_DUR)) / PIN_DUR;
    const uB = (tq - (b.pinB - 0.45 * PIN_DUR)) / PIN_DUR;
    const thread = clamp01((t - b.thread0) / 0.5);
    studyCase(f, {
      shot: ID,
      when: 'start',
      key: ID,
      flames: false,
      // the kit's naming card is OFF for this candle: its single end year would contradict 'nobody knows exactly
      // when'; the shot's own label carries c. 2006 – c. 2010–12 (see beliefLabelCard)
      shelf: { views, over: { warmup: out ? { smoke: 2.4 } : { flame: fk } }, named: {} },
      xray: { light: Math.max(0, xl), reveal: { band: 4, u: ru }, translucency: 0.72 },
      extra: (c, env) => {
        // ---- the shelf: the dates tag beside the frayed sleeve top, straight; the blank tag on the stub
        if (out) {
          const a = win(t, b.swap, b.swap + 0.4);
          c.save();
          c.globalAlpha *= a;
          c.strokeStyle = env.fill('ink');
          c.lineWidth = 0.9;
          c.beginPath();
          c.moveTo(WX - 9, SLEEVE_TOP + 4);
          c.quadraticCurveTo(WX - 50, SLEEVE_TOP + 12, WX - 100, SLEEVE_TOP + 6);
          c.stroke();
          paperTag(c, env, { x: WX - 100, y: SLEEVE_TOP + 6, w: 164, h: 40, len: 6, rot: 0.02 * Math.sin(t * 1.7), text: DATES, light: 0.7, font: `500 10px ${FONT.mono}` });
          c.restore();
        }
        coatAndTag(c, env, t, tq, b, entry);
        // ---- the board: threads of light from the two new clues to the 1986 bead and the 1989 stencil
        if (thread > 0) {
          // routed round the case card: DATA → the 1986 bead card ABOVE it, FIRE → the 1989 stencil card BELOW it
          lightThread(c, env, slotWorld('C3-a', 'pin'), slotWorld('C2-b', 'pin'), thread, 0.9, -6);
          const via = { x: SLOTS.K.x + STUDY.board.x + SLOTS.K.w / 2 + 12, y: SLOTS.K.y + STUDY.board.y + SLOTS.K.h / 2 + 22 };
          lightThread(c, env, slotWorld('C3-b', 'pin'), via, clamp01(thread * 2), 0.9, 0);
          lightThread(c, env, via, slotWorld('C2-d', 'pin'), clamp01(thread * 2 - 1), 0.9, 8);
          // the case card is laid back over the threads, so they run BEHIND it and never across its type
          const K = SLOTS.K;
          drawCard(c, K, { ...slotWorld('K'), k: STUDY.board.k, light: poolAt(POOL, K.x, K.y) }, env);
        }
        for (const [slot, u] of [['C3-a', uA], ['C3-b', uB]] as const) {
          if (u >= 0.45) clueCard(c, env, slot, slotWorld(slot), 0.3 * thread);
        }
        const act = uB > 0 ? (['C3-b', uB] as const) : uA > 0 ? (['C3-a', uA] as const) : null;
        if (act && act[1] < 1) {
          const [slot, u] = act;
          // the arm enters from below the column (not across the X-ray box at frame right)
          const pinEntry = { R: { x: slotWorld(slot).x + 170, y: entry.R.y + 40 }, L: entry.L };
          const pose = hands.act('pin', u, slotWorld(slot, 'pin'), { held: 'card', scale: 0.62, entry: pinEntry });
          hands.draw(c, pose, env, {
            heldDraw: (cc, at, _h, e) => clueCard(cc, e, slot, { x: at.x, y: at.y + SLOTS[slot].h / 2 - 7 }, 0),
          });
        }
      },
    });
    // the band's shimmer and the other bands dimmed 30 % so the new one reads
    xrayBand4(f, t, b);
    // the flames: the warm-up candle's (with the gutter), the other live candles
    if (fk > 0.02) f.practical({ x: FLAME.x, y: FLAME.y - 4 + 6 * (1 - fk), kind: 'candle', seed: 2006, intensity: 0.95 * fk, radius: 30 + 16 * fk });
    for (const v of V0) {
      if (v.id === 'warmup' || v.state !== 'live') continue;
      const p = candleFlame({ x: candleX(V0, v.id), y: SHELF_Y, view: v, s: STUDY.shelf.s });
      f.practical({ x: p.x, y: p.y - 4, kind: 'candle', seed: 300 + v.slot * 7, intensity: 0.9, radius: 40 });
    }
    studyNear(f, { key: ID, cams: CAMS, file: true });
    // ---- screen-locked type: the guttered belief and its uncertain dates; the clue cards' names called out
    const la = win(t, b.gutter - 0.1, b.gutter + 0.35) * (1 - win(t, b.crane0 - 0.1, b.crane0 + 0.3));
    if (la > 0.01) monoCard(f.c, { x: 952, y: 150, lines: ['DEEP NETS MUST BE WARMED UP', 'LAYER BY LAYER'], attrib: DATES, size: 22, alpha: la, rise: la, seed: 66 }, f.mood);
    for (const [slot, u, name] of [['C3-a', uA, 'DATA'], ['C3-b', uB, 'FIRE']] as const) {
      const a = clamp01((u - 0.45) / 0.35);
      if (a > 0.01) clueCallout(f, cam, slot, name, a);
    }
  },
});

/** a clue card's name called out beside it at the legibility floor (the card itself is small in the wide) */
function clueCallout(f: Frame, cam: Camera3, slot: 'C3-a' | 'C3-b', name: string, a: number) {
  const s = SLOTS[slot];
  const p = toScreen(LAYERS.L4, cam, STUDY.board.x + s.x + s.w / 2, STUDY.board.y + s.y);
  if (p.x < -50 || p.x > 1330) return;
  const c = f.c;
  c.save();
  c.globalAlpha = a;
  c.font = capFont(c, `400 24px ${FONT.typewriter}`, 24);
  const w = c.measureText(name).width;
  const x = p.x + 16, y = p.y;
  // a soft dark plate so the type sits clear of the board's texture; a fine leader to the card
  const g = c.createRadialGradient(x + w / 2, y, 4, x + w / 2, y, w * 0.9);
  g.addColorStop(0, withAlpha(f.mood.ink, 0.55));
  g.addColorStop(1, withAlpha(f.mood.ink, 0));
  c.fillStyle = g;
  c.fillRect(x - w * 0.5, y - w * 0.9, w * 2, w * 1.8);
  c.strokeStyle = withAlpha(f.mood.rim, 0.6);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(p.x + 2, y);
  c.lineTo(x - 4, y);
  c.stroke();
  c.fillStyle = mixLab('#efe3cf', f.mood.core, 0.25);
  c.textAlign = 'left';
  c.textBaseline = 'middle';
  c.fillText(name, x, y + 1);
  c.restore();
}

// ================================================================================================= CAMERA
function camAt(t: number, b: B): Camera3 {
  // 1. the shelf macro: one slow push onto the candle and its tag, then held for the inking
  if (t < b.crane0) return mixCam(SH0, TAGCAM, sm(t / (b.pen0 + 0.1)));
  // 2. rise and truck right with the tag to the coat (pulling back a little through the middle of the move)
  if (t < b.back0) {
    const u = sm((t - b.crane0) / (b.tie - 0.2 - b.crane0));
    const cm = mixCam(TAGCAM, COATC, u);
    return { ...cm, z: cm.z - 260 * Math.sin(Math.PI * u) };
  }
  // 3. ease back to the composed end frame, then a 1 % creep
  if (t < b.back1) return mixCam(COATC, WIDE, sm((t - b.back0) / (b.back1 - b.back0)));
  return mixCam(WIDE, WIDE1, clamp01((t - b.back1) / (b.D - b.back1)));
}

// ================================================================================================= THE TAG
function coatAndTag(c: C, env: PaintEnv, t: number, tq: number, b: B, entry: { R: Pt; L: Pt }) {
  const tied = tq >= b.tie;
  const sway = tied ? 0.03 * Math.exp(-(t - b.tie) * 0.9) * Math.sin((t - b.tie) * 4.2) : 0;
  frockCoat(c, env, { sway, light: poolAt(POOL, COAT.x - STUDY.board.x, COAT.y + 100 - STUDY.board.y) + 0.25 });
  const tieP = sleeveTie({ sway });
  const hs = lerp(0.5, 0.66, sm((t - b.crane0) / (b.tie - b.crane0)));
  const len = HAND_LEN * hs;
  // inking on the stub
  const inkU = clamp01((tq - b.ink0) / (b.ink1 - b.ink0));
  if (tq < b.lift) paperTag(c, env, { ...TAG, rot: 0.04 * Math.sin(t * 1.3), text: TAG_TEXT, ink: inkU, light: 0.8 });
  if (tq >= b.pen0 && tq < b.penAway) {
    hands.draw(c, { right: penArmTo(entry.R, nibAt(tq, b), len), scale: hs }, env, { heldDraw: () => {} });
    return;
  }
  if (tq >= b.lift - 0.25 && !tied) {
    // reach in, pinch, carry the tag up with the crane to the sleeve
    const from = { x: TAG.x, y: TAG.y + 4 };
    if (tq < b.lift) {
      const u = sm((tq - b.lift + 0.25) / 0.25);
      const at = { x: lerp(entry.R.x, from.x, u), y: lerp(entry.R.y, from.y, u) };
      hands.draw(c, { right: hands.reach(entry.R, at, u > 0.8 ? 'pinch' : 'open', len), scale: hs }, env);
      return;
    }
    const u = sm((tq - b.lift) / (b.tie - b.lift));
    const at = { x: lerp(from.x, tieP.x + 2, u), y: lerp(from.y, tieP.y + 2, u) - 60 * Math.sin(Math.PI * u) };
    paperTag(c, env, { x: at.x, y: at.y - 2, w: TAG.w, h: TAG.h, len: 4, rot: 0.1 * Math.sin(Math.PI * u), text: TAG_TEXT, light: 0.8 });
    hands.draw(c, { right: hands.reach(carryEntry(entry, u), at, 'pinch', len), scale: hs }, env);
    return;
  }
  if (tied) {
    const tagSway = 0.28 * Math.exp(-(t - b.tie) * 0.8) * Math.sin((t - b.tie) * 3.4) + 0.04 * Math.sin(t * 1.2);
    paperTag(c, env, { x: tieP.x, y: tieP.y, w: TAG.w, h: TAG.h, len: 12, rot: tagSway, text: TAG_TEXT, light: 0.78 });
    // the press of the tie, then the hand withdraws straight down out of frame (never toward the X-ray box)
    const u = (tq - b.tie) / 0.6;
    if (u < 1) {
      const at = u < 0.35 ? { x: tieP.x + 2, y: tieP.y + 1 } : { x: tieP.x + 2 - 200 * sm((u - 0.35) / 0.65), y: lerp(tieP.y + 1, tieP.y + 420, sm((u - 0.35) / 0.65)) };
      hands.draw(c, { right: hands.reach(carryEntry(entry, 1), at, u < 0.35 ? 'press' : 'rest', len), scale: hs }, env);
    }
  }
}

/** during the carry the arm swings to enter from below-LEFT of the coat, so it never crosses the X-ray box */
function carryEntry(entry: { R: Pt }, u: number): Pt {
  const left = { x: TIE.x - 330, y: entry.R.y + 60 };
  return { x: lerp(entry.R.x, left.x, u), y: lerp(entry.R.y, left.y, u) };
}

/** the nib writing PRE-TRAINING across the tag, then lifting well clear of it */
function nibAt(tq: number, b: B): Pt {
  const y = TAG.y + TAG.len + TAG.h * 0.62;
  const x0 = TAG.x - TAG.w * 0.4, x1 = TAG.x + TAG.w * 0.4;
  if (tq < b.ink0) {
    const u = sm((tq - b.pen0) / (b.ink0 - b.pen0));
    return { x: lerp(x0 + 60, x0, u), y: lerp(y + 70, y, u) };
  }
  if (tq < b.ink1) {
    const u = (tq - b.ink0) / (b.ink1 - b.ink0);
    return { x: lerp(x0, x1, u), y: y - 2 + Math.sin(u * 60) * 2 };
  }
  const u = sm((tq - b.ink1) / (b.penAway - b.ink1));
  return { x: x1 + 110 * u, y: y + 120 * u };
}

// ================================================================================================= X-RAY
/** box-local band rectangle (mirrors sets/xrayColumn) → world */
function bandWorld(i: number) {
  const seam = i >= 4 ? 10 : 0;
  const y1 = -XRAY.pad - (i - 1) * XRAY.band - seam;
  const r = { x: -XRAY.w / 2 + 18, y: y1 - XRAY.band + 6, w: XRAY.w - 36, h: XRAY.band - 8 };
  const s = STUDY.xray.s;
  return { x: STUDY.xray.x + r.x * s, y: STUDY.xray.y + r.y * s, w: r.w * s, h: r.h * s };
}
function xrayBand4(f: Frame, t: number, b: B) {
  // until it is called up the box stands DARK: a veil of cut-card black over its vellum
  const veil = 1 - win(t, b.xr0, b.xr0 + 0.8);
  if (veil > 0.01) {
    f.layer('L4', (c, env) => {
      const s = STUDY.xray.s;
      c.fillStyle = withAlpha(mixLab(env.mood.ink, '#0b0d0b', 0.5), 0.78 * veil);
      c.fillRect(STUDY.xray.x - (XRAY.w / 2) * s, STUDY.xray.y - XRAY.h * s, XRAY.w * s, XRAY.h * s);
    });
  }
  const k = win(t, b.band0 - 0.1, b.band0 + 0.3) * (1 - 0.5 * win(t, b.xrOut, b.xrOut + 0.8));
  if (k <= 0.01) return;
  f.layer('L4', (c) => {
    c.save();
    // the old bands sit back (≈ 30 % dimmer) while the new one lights
    c.fillStyle = withAlpha(CYAN.ink, 0.3 * k);
    for (const i of [1, 2, 3]) {
      const r = bandWorld(i);
      c.fillRect(r.x, r.y, r.w, r.h);
    }
    // band 4's shimmer: a soft bright line travelling across it, twice
    const r = bandWorld(4);
    const u = (t - b.band0) / 1.1;
    c.globalCompositeOperation = 'lighter';
    for (const off of [0, 0.55]) {
      const v = u - off;
      if (v < 0 || v > 1.2) continue;
      const x = r.x - 20 + v * (r.w + 40);
      const g = c.createLinearGradient(x - 24, 0, x + 24, 0);
      g.addColorStop(0, withAlpha(CYAN.core, 0));
      g.addColorStop(0.5, withAlpha(CYAN.core, 0.45 * k));
      g.addColorStop(1, withAlpha(CYAN.core, 0));
      c.fillStyle = g;
      c.fillRect(Math.max(r.x, x - 24), r.y, Math.min(48, r.x + r.w - (x - 24)), r.h);
    }
    const halo = pulse(t, b.band0 + 0.6, 0.2, 0.9);
    c.strokeStyle = withAlpha(CYAN.core, 0.55 * halo * k);
    c.lineWidth = 2;
    c.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
    c.restore();
  });
}

// ================================================================================================= TYPE + CARDS
function clueCard(c: C, env: PaintEnv, slot: 'C3-a' | 'C3-b', p: Pt, glow: number) {
  const s = SLOTS[slot];
  drawCard(c, s, { x: p.x, y: p.y, k: STUDY.board.k, light: poolAt(POOL, s.x, s.y) + glow, lit: glow > 0.05 }, env);
}
