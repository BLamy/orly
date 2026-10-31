/**
 * ch08-s03 — TEN CERTAINTIES RETIRED; THE REFRAIN ANSWERED (scene, winterBlue at a grey dawn; lampChange in; 17.17 s).
 *   L0805 "On the third of September, an AI agent's review retired ten earlier claims, that one among them. Its
 *          narrower replacement: a defined numeric subset can be compiled."
 *   L0806 "It held about eight weeks."
 *
 * THE COLD WINDOW (sets/ch08-s02-cold), the same mid-shot on tag 8 that s02 ended on, but the window behind the line has
 * gone from night blue to the pale cold grey before dawn (the first light since July); the desk under it is empty now,
 * the lamp out. Tag 8 hangs with its knot card (tied on by: unnamed participants · not attributable to Cheng).
 *
 * TEACHES, word by word:
 *   dawn (0.30)       the window lightens; the date stamp 3 SEPTEMBER 2026 sets top-left
 *   review (3.33)     the narrator's hand (lower left) flips tag 8 (the paper snap); the red-pencil hand comes in from frame
 *                     right and writes the dissenter on its back: the September reassessment. The card top-left names it:
 *                     doubted by: the September reassessment, an agent-run review
 *   retired (4.14)    the knot card slides up its thread and a thin ledger strip pins itself under it, carrying the
 *                     reassessment's own words (Q118, verbatim, credited to the reassessment)
 *   ten (4.63)        the pencil writes ten short red strokes, one per retired earlier claim, each a dry scratch, paced to
 *                     finish as the refrain begins; on 'that one' the third stroke (the dead-end example among them) glows;
 *                     the label sets lower left: 10 earlier claims retired, then on 'narrower': dead end → a defined
 *                     numeric subset
 *   refrain (14.06)   the camera pulls back to the whole tag over the Lifespan Rule; the knot card catches the light
 *   held (14.25)      the thread's end drops onto the rule at its measured lifespan, about eight weeks (57 days): past the
 *                     unlabelled month tick, well short of 'a year', ending in a cut tip; its dates ink beside the drop:
 *                     8 July → 3 September. The front is NOT struck (that is s08).
 */
import { Timeline } from '../../../core';
import type { Camera3, PaintEnv, Palette } from '../../../film';
import {
  FONT,
  LAYERS,
  cardPaperAlpha,
  cardProbe,
  defineShot,
  drawTracked,
  legibleSize,
  mixLab,
  softPlate,
  textProbe,
  textRole,
  textSwap,
  toLayer,
  toScreen,
  withAlpha,
} from '../../../film';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { HAND_LEN, pencilRed, type HandsPose } from '../sets/narratorHands';
import { RULE, TAG, drawLine, drawRule, drawTags, lifeX, tagAnchors, tagsAt, type TagState } from '../sets/tagLine';
import { COLD_DY, KNOT_K_REF, coldNear, coldRoom, frostPosts, heldSize, knotCard } from '../sets/ch08-s02-cold';

const ID = 'ch08-s03';
type C2 = CanvasRenderingContext2D;
type Pt = { x: number; y: number };
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ---------------------------------------------------------------- tag 8 (canonical slot; L4 drawn translated by COLD_DY)
const AN = tagAnchors({ id: '8' });
const HS = 0.6;
const FLIP_D = 1.1;
const FLIP_AT = { x: AN.eye.x + 4, y: AN.eye.y + TAG.h * 0.78 - HAND_LEN * HS * 0.25 };
/** the back, in red pencil: the dissenter (two rows), then the ten strokes in two rows of five (tag-local px) */
const BACK_ROWS = ['the September', 'reassessment'];
const BACK_TOP = 15;
const STROKE_ROWS = [57, 71];
const strokeAt = (i: number) => ({ x: -20 + (i % 5) * 10, y: STROKE_ROWS[Math.floor(i / 5)] });
const STROKE_H = 5.2;
/** tag 8's measured lifespan on the rule (8 July → 3 September 2026: 57 days, about eight weeks) */
const LIFE_DAYS = 57;
const QUOTE = '“passes yesterday\'s interpretation to tomorrow\'s agents as a constraint”';
const QUOTE_BY = '— the reassessment';
const DOUBT = ['doubted by:', 'the September reassessment,', 'an agent-run review'];
const LABEL = ['10 earlier claims retired', 'dead end → a defined numeric subset'];

type Key = [number, number, number];
function hk(keys: Key[], t: number): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0, m0] = keys[i], [t1, v1, m1] = keys[i + 1];
    if (t <= t1) {
      const h = t1 - t0, u = (t - t0) / h, u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * h * m0 + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * h * m1;
    }
  }
  return keys[keys.length - 1][1];
}

interface Beats {
  D: number;
  dawn: number;
  flip: number;
  ledger: number;
  strokes: number;
  thatOne: number;
  narrower: number;
  refrain: number;
  held: number;
}

/** the camera: s02's mid-shot, a hair in for the back; the pull back to the rule on the refrain */
function camAt(t: number, b: Beats): Camera3 {
  const pb = b.refrain - 0.15;
  const x = hk([[0, 796, 0], [3.4, 803, 1.5], [pb, 806, 0], [pb + 2.4, 734, -3], [b.D, 727, 0]], t);
  const y = hk([[0, 404, 0], [3.4, 399, -0.5], [pb, 397, 0], [pb + 2.4, 466, 2], [b.D, 470, 0]], t);
  const lens = hk([[0, 2.5, 0], [3.4, 2.44, -0.006], [pb, 2.38, 0], [pb + 2.4, 1.24, -0.015], [b.D, 1.2, 0]], t);
  return { x, y, z: 165, lens };
}

/** the pencil's lead, tag-local, and what it has laid down, as one function of time (on twos) */
interface PencilState {
  /** 'in' while it draws (tip given), 'enter'/'leave' with u of the move */
  phase: 'off' | 'enter' | 'in' | 'leave';
  u: number;
  tip: Pt;
  /** characters of each back row written */
  rows: number[];
  /** strokes complete, and the current stroke's progress */
  strokes: number;
  cur: number;
}
function pencilAt(tq: number, b: Beats): PencilState {
  const W0 = b.flip + 0.35;
  const ENTER = 0.4;
  const ROW_D = 0.42;
  const rowX = (i: number, u: number) => lerp(-23, 23 - (i === 1 ? 1 : 6), u);
  const rowY = (i: number) => BACK_TOP + 9 * (0.95 + i * 1.18);
  const SP = (b.refrain - 0.2 - b.strokes) / 10;
  const st: PencilState = { phase: 'off', u: 0, tip: { x: -23, y: rowY(0) }, rows: [0, 0], strokes: 0, cur: 0 };
  if (tq < W0) return st;
  if (tq < W0 + ENTER) return { ...st, phase: 'enter', u: (tq - W0) / ENTER };
  // the dissenter, two rows of small letter loops
  for (let i = 0; i < 2; i++) {
    const a = W0 + ENTER + i * (ROW_D + 0.06);
    if (tq < a + ROW_D) {
      const u = clamp01((tq - a) / ROW_D);
      const ph = u * Math.PI * 2 * 6;
      const rows = [i === 0 ? Math.ceil(BACK_ROWS[0].length * u) : BACK_ROWS[0].length, i === 1 ? Math.ceil(BACK_ROWS[1].length * u) : 0];
      return { ...st, phase: 'in', tip: { x: rowX(i, u) + Math.cos(ph) * 0.9, y: rowY(i) - 2 + Math.sin(ph) * 1.6 }, rows };
    }
  }
  const full = [BACK_ROWS[0].length, BACK_ROWS[1].length];
  // between the back and the first stroke: carry the lead down to the first stroke's start
  if (tq < b.strokes) {
    const a = W0 + ENTER + 2 * (ROW_D + 0.06) - 0.06;
    const u = sm((tq - a) / Math.max(0.05, b.strokes - a));
    const s0 = strokeAt(0);
    return { ...st, phase: 'in', tip: { x: lerp(rowX(1, 1), s0.x - 2.6, u), y: lerp(rowY(1), s0.y + STROKE_H - 4, u) }, rows: full };
  }
  // ten strokes, one per slot: touch down, ONE firm stroke (the dry scratch), lift, carry to the next
  const i = Math.min(9, Math.floor((tq - b.strokes) / SP));
  const v = (tq - b.strokes - i * SP) / SP;
  const p = strokeAt(i);
  const lo = { x: p.x - 2.6, y: p.y + STROKE_H }, hi = { x: p.x + 2.6, y: p.y - STROKE_H };
  if (i === 9 && v > 0.45) {
    const u = clamp01((v - 0.45) / 0.55);
    return { ...st, phase: 'leave', u, tip: hi, rows: full, strokes: 10, cur: 0 };
  }
  let tip: Pt;
  let cur = 0;
  if (v < 0.12) tip = { x: lo.x, y: lerp(lo.y - 4, lo.y, v / 0.12) };
  else if (v < 0.3) {
    cur = (v - 0.12) / 0.18;
    tip = { x: lerp(lo.x, hi.x, cur), y: lerp(lo.y, hi.y, cur) };
  } else {
    cur = 1;
    const n = strokeAt(Math.min(9, i + 1));
    const u = sm((v - 0.3) / 0.7);
    tip = { x: lerp(hi.x, n.x - 2.6, u), y: lerp(hi.y - 2, n.y + STROKE_H - 4, u) - 3 * Math.sin(Math.PI * u) };
  }
  return { ...st, phase: 'in', tip, rows: full, strokes: i, cur };
}

export default defineShot({
  id: ID,
  mood: 'winterBlue',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    const b: Beats = {
      D: T.duration,
      dawn: T.beat('dawn'),
      flip: T.beat('flip'),
      ledger: T.beat('ledger'),
      strokes: T.beat('strokes'),
      thatOne: T.word('L0805', 'that'),
      narrower: T.word('L0805', 'narrower'),
      refrain: T.beat('refrain'),
      held: T.beat('held'),
    };
    return { tl, b };
  },
  paint(f, _s, sc) {
    const b = sc.b as Beats;
    const t = f.t;
    const tq = q2(t);
    const cam = camAt(t, b);
    f.camera(cam);
    const k4 = toScreen(LAYERS.L4, cam, 0, 0).k;
    const legible = k4 >= KNOT_K_REF * 0.98;

    // the grey dawn: the window lightens from night blue to a pale cold grey; the desk is empty, the lamp out
    const dawn = 0.35 + 0.65 * win(t, b.dawn - 0.3, b.dawn + 3.4);
    coldRoom(f, { key: ID, dawn, lamp: 0, desk: { tq, hands: false, screen: 0.06 } });

    // ---- tag 8: flip, back, strokes, drop
    const flip0 = b.flip - 0.5 * FLIP_D;
    const flipU = clamp01((tq - flip0) / FLIP_D);
    const flip = flipU <= 0.38 ? 0 : flipU >= 0.62 ? 1 : (flipU - 0.38) / 0.24;
    const kick = (t0: number) => (t > t0 ? 0.07 * Math.exp(-(t - t0) * 2.4) * Math.sin((t - t0) * 9) : 0);
    // the strokes press on the paper: a damped nudge per stroke (small; it keeps the marks where the lead put them)
    const swing = 0.016 + kick(b.flip) * 1.2 + kick(b.held) * 0.5;
    const sw = swing * Math.sin(tq * 1.7);
    const drop = 0.25 + 0.75 * win(t, b.held - 0.05, b.held + 1.35);
    const P = pencilAt(tq, b);

    const tags = tagsAt(ID, 'start').filter((s) => s.id !== '8');
    tags.push({ id: '8', ink: 1, knot: [], flip, back: [], swing, phase: 0, drop, subject: legible && flip < 0.5 });
    tags.sort((p, q) => ORDER.indexOf(p.id) - ORDER.indexOf(q.id));
    const lift = (p: Pt) => ({ x: p.x, y: p.y - COLD_DY });
    const E = { R: lift(toLayer(LAYERS.L4, cam, -170, 760)), pencil: lift(toLayer(LAYERS.L4, cam, 1420, 860)) };

    f.layer('L4', (c, env) => {
      c.save();
      c.translate(0, COLD_DY);
      drawLine(c, env, { glow: 0.3 + 0.2 * dawn });
      frostPosts(c, env);
      drawRule(c, env, { alpha: 0.9, labels: 1 });
      drawTags(c, env, tags, { tq });
      // the back of tag 8: the dissenter and the ten strokes, upright in the tag's own (swung) frame
      if (flip > 0.5) backMarks(c, env, flip, sw, P, t, b, legible, k4);
      // the knot card (from s02), lifted up its thread as the ledger strip pins under it
      const up = 20 * win(t, b.ledger - 0.4, b.ledger - 0.02);
      const glint = clamp01((t - b.refrain - 0.2) / 1.1);
      const card = knotCard(c, env, { knot: AN.knot, a: 1, paper: 1, ink1: 1, ink2: 1, sway: 10 * sw, legible, id: `${ID}-knot`, k: k4, lift: up, glint: glint > 0 && glint < 1 ? glint : 0 });
      ledgerStrip(c, env, t, b, card, k4, legible);
      // the dates, beside the drop
      dropLabel(c, env, t, b);
      // the narrator's hand flips the tag
      if (flipU > 0 && flipU < 1) {
        const pose: HandsPose = hands.act('flip', flipU, FLIP_AT, { scale: HS, entry: { R: E.R } });
        hands.draw(c, pose, env);
      }
      // the red pencil, from frame right
      if (P.phase !== 'off' && !(P.phase === 'leave' && P.u >= 1)) {
        const w = tagToWorld(P.tip, flip, sw);
        const len = HAND_LEN * HS;
        const target = { x: w.x - 0.126 * len, y: w.y + 0.04 * len };
        const U = P.phase === 'enter' ? 0.35 * P.u : P.phase === 'leave' ? 0.75 + 0.25 * P.u : 0.5;
        hands.draw(c, hands.pencil('hover', U, target, { scale: HS, entry: E.pencil }), env);
      }
      c.restore();
    });
    f.rim({ x: 0, y: -1 });
    coldNear(f, ID);

    // ---- type (screen-locked)
    const swapAt = b.flip + 0.1;
    const sw2 = textSwap(t, swapAt, 0.35);
    const outA = win(t, b.refrain - 0.45, b.refrain - 0.05);
    stamp(f.c, f.mood, t, b.dawn, sw2.out);
    doubtCard(f.c, f.mood, sw2.in * (1 - outA));
    labelCard(f.c, f.mood, win(t, b.strokes - 0.05, b.strokes + 0.35) * (1 - outA), win(t, b.narrower - 0.05, b.narrower + 0.4) * (1 - outA));
  },
});

const ORDER = ['1', 'qK', '2', 'lineage', '3', '4', '5', '6', '7', '8', '9', '10', 'nano', '11', 'why'];

/** a tag-local point on tag 8's (flipped, swung) paper → tag-line world */
function tagToWorld(p: Pt, flip: number, sw: number): Pt {
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * flip)));
  const x = p.x * sx, y = p.y;
  return { x: AN.eye.x + Math.cos(sw) * x - Math.sin(sw) * y, y: AN.eye.y + Math.sin(sw) * x + Math.cos(sw) * y };
}

/** the red pencil's marks on the back: the dissenter (as written so far) and the strokes (each as drawn so far) */
function backMarks(c: C2, env: PaintEnv, flip: number, sw: number, P: PencilState, t: number, b: Beats, legible: boolean, k: number) {
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * flip)));
  c.save();
  c.translate(AN.eye.x, AN.eye.y);
  c.rotate(sw);
  c.scale(sx, 1);
  textRole(c, legible ? 'subject' : 'texture', () => {
    const base = `italic 400 9px ${FONT.fell}`;
    let fs = heldSize(c, base, 8, BACK_ROWS[1], k);
    c.font = `italic 400 ${fs}px ${FONT.fell}`;
    const widest = Math.max(...BACK_ROWS.map((r) => c.measureText(r).width));
    if (widest > TAG.w * 0.86) {
      fs *= (TAG.w * 0.86) / widest;
      c.font = `italic 400 ${fs}px ${FONT.fell}`;
    }
    c.fillStyle = pencilRed(env, 0.95);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    BACK_ROWS.forEach((row, i) => {
      const n = P.rows[i];
      if (n <= 0) return;
      const tw = c.measureText(row).width;
      c.fillText(row.slice(0, n), -tw / 2, BACK_TOP + fs * (0.95 + i * 1.18));
    });
    const tw = Math.max(...BACK_ROWS.map((r) => c.measureText(r).width));
    textProbe(c, `${ID}-back`, -tw / 2, BACK_TOP, tw, fs * 2.4, P.rows[0] > 0 ? 1 : 0);
  });
  // the strokes: firm, slightly uneven, the lead's grain along each
  const done = P.strokes + (P.cur >= 1 ? 1 : 0);
  c.lineCap = 'round';
  for (let i = 0; i < 10; i++) {
    const u = i < done ? 1 : i === P.strokes ? P.cur : 0;
    if (u <= 0) continue;
    const p = strokeAt(i);
    const x0 = p.x - 2.6, y0 = p.y + STROKE_H;
    const x1 = lerp(x0, p.x + 2.6, u), y1 = lerp(y0, p.y - STROKE_H, u);
    c.strokeStyle = pencilRed(env, 0.95);
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1 + 0.3 * Math.sin(i * 2.1), y1);
    c.stroke();
  }
  // 'that one among them': the third stroke (the dead-end example) glows for a moment
  const g = Math.exp(-Math.pow((t - (b.thatOne + 0.35)) / 0.55, 2));
  if (g > 0.02 && done > 2) {
    const p = strokeAt(2);
    c.globalCompositeOperation = 'lighter';
    const gr = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 11);
    gr.addColorStop(0, withAlpha(mixLab('#e0704e', env.mood.core, 0.35), 0.55 * g));
    gr.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = gr;
    c.fillRect(p.x - 11, p.y - 11, 22, 22);
    c.globalCompositeOperation = 'source-over';
  }
  c.restore();
}

/**
 * The ledger strip: a thin paper strip pinned under the knot card, carrying the reassessment's own words (Q118,
 * verbatim) and its credit. It unrolls from its pin, left to right; the text is under the paper from the first frame.
 */
function ledgerStrip(c: C2, env: PaintEnv, t: number, b: Beats, card: { x: number; y: number; w: number; h: number }, k: number, legible: boolean) {
  const u = win(t, b.ledger - 0.02, b.ledger + 0.55);
  if (u <= 0.003) return;
  c.save();
  const fq = heldSize(c, `italic 400 7.6px ${FONT.text}`, 5.6, QUOTE, k);
  const fb = heldSize(c, `600 7px ${FONT.sc}`, 5.2, QUOTE_BY, k);
  c.font = `italic 400 ${fq}px ${FONT.text}`;
  const wq = c.measureText(QUOTE).width;
  const sw = wq + 16, sh = fq * 1.25 + fb * 1.2 + 7;
  const x0 = AN.knot.x - sw / 2, y0 = card.y + card.h + 2.5;
  const paper = cardPaperAlpha(t, b.ledger + 0.04, 0.12);
  // unroll from the pin at the left end
  c.beginPath();
  c.rect(x0 - 4, y0 - 4, (sw + 8) * u, sh + 8);
  c.clip();
  c.globalAlpha = paper;
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
  c.fillRect(x0 + 1.2, y0 + 1.6, sw, sh);
  c.fillStyle = mixLab(mixLab('#e9dcc0', env.mood.halo, 0.2), env.mood.core, 0.1);
  c.fillRect(x0, y0, sw, sh);
  // ledger rules (faint)
  c.strokeStyle = withAlpha('#7d8a92', 0.28);
  c.lineWidth = 0.4;
  c.beginPath();
  c.moveTo(x0 + 4, y0 + fq * 1.25 + 2.4);
  c.lineTo(x0 + sw - 4, y0 + fq * 1.25 + 2.4);
  c.stroke();
  // the pin
  c.fillStyle = mixLab('#a07a3c', env.mood.halo, 0.25);
  c.beginPath();
  c.arc(x0 + 4, y0 + sh / 2, 1.6, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
  const ink = clamp01((t - (b.ledger + 0.04)) / 0.12);
  textRole(c, legible ? 'subject' : 'texture', () => {
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    c.fillStyle = withAlpha(mixLab('#241a12', env.mood.ink, 0.2), ink);
    c.font = `italic 400 ${fq}px ${FONT.text}`;
    c.fillText(QUOTE, x0 + 9, y0 + 3 + fq);
    c.textAlign = 'right';
    c.font = `600 ${fb}px ${FONT.sc}`;
    c.fillStyle = withAlpha(mixLab('#4a3626', env.mood.ink, 0.2), ink * 0.9);
    c.fillText(QUOTE_BY, x0 + sw - 6, y0 + 3 + fq * 1.25 + fb * 1.05);
  });
  cardProbe(c, `${ID}-ledger`, x0, y0, sw * u, sh, paper, ink);
  c.restore();
}

/** the dates beside the drop on the rule: 8 July → 3 September (ink as the thread lands) */
function dropLabel(c: C2, env: PaintEnv, t: number, b: Beats) {
  const a = win(t, b.held + 1.0, b.held + 1.5);
  if (a <= 0.003) return;
  const text = '8 July → 3 September';
  const lx = lifeX(LIFE_DAYS, RULE);
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 12px ${FONT.mono}`, 9, text);
    c.save();
    c.globalAlpha = a;
    const y = RULE.y + RULE.h + 34;
    const w = drawTracked(c, text, lx, y, { font: `500 ${size}px ${FONT.mono}`, size, tracking: 0.04, align: 'center' });
    // a fine leader up to the thread's cut tip
    c.fillStyle = withAlpha(mixLab('#3a2414', env.mood.ink, 0.3), 0.7);
    c.fillRect(lx - 0.4, RULE.y + RULE.h * 0.3, 0.8, y - size - 2 - (RULE.y + RULE.h * 0.3));
    textProbe(c, `${ID}-dates`, lx - w / 2, y - size, w, size * 1.1, a);
    c.restore();
  });
}

// ---------------------------------------------------------------- screen-locked type
const PARCH = '#efe5d2';
/** the date stamp (mono, top-left), as the kit's mono place stamp: a thin index rule, tracked caps */
function stamp(c: C2, m: Palette, t: number, at: number, out: number) {
  const a = win(t, at, at + 0.6) * out;
  if (a <= 0.003) return;
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `500 18.5px ${FONT.mono}`, 18.5);
    c.save();
    c.globalAlpha = a;
    softPlate(c, 190, 64, 480, size + 70, m.ink, 0.5);
    c.fillStyle = mixLab(PARCH, m.core, 0.2);
    const w = drawTracked(c, '3 SEPTEMBER 2026', 52 + (1 - win(t, at, at + 0.6)) * -10, 72, { font: `500 ${size}px ${FONT.mono}`, size, tracking: 0.08, align: 'left' });
    c.globalAlpha = a * 0.6;
    c.fillRect(52, 72 - size - 10, w * win(t, at + 0.1, at + 0.8), 0.8);
    c.fillRect(52, 72 - size - 14, 0.8, 8);
    textProbe(c, `${ID}-stamp`, 52, 72 - size, w, size * 1.1, a);
    c.restore();
  });
}
/** the doubter's card, top-left where the stamp was: doubted by: the September reassessment, an agent-run review */
function doubtCard(c: C2, m: Palette, a: number) {
  if (a <= 0.003) return;
  textRole(c, 'subject', () => {
    c.save();
    const s1 = legibleSize(c, `italic 400 18px ${FONT.text}`, 18);
    const s2 = legibleSize(c, `600 22px ${FONT.sc}`, 22, DOUBT[1]);
    const x = 52, y = 66;
    c.globalAlpha = a;
    softPlate(c, 230, y + 26, 560, 150, m.ink, 0.55);
    c.fillStyle = mixLab(PARCH, m.core, 0.2);
    c.font = `italic 400 ${s1}px ${FONT.text}`;
    c.fillText(DOUBT[0], x, y);
    c.fillStyle = mixLab(m.core, '#ffffff', 0.1);
    const w = drawTracked(c, DOUBT[1], x, y + s2 * 1.25, { font: `600 ${s2}px ${FONT.sc}`, size: s2, tracking: 0.04, align: 'left' });
    // a short red-pencil underline under the name: the doubter's colour
    c.strokeStyle = withAlpha('#a4402e', 0.85);
    c.lineWidth = 1.6;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x, y + s2 * 1.25 + 6);
    c.lineTo(x + w * 0.62, y + s2 * 1.25 + 5);
    c.stroke();
    c.fillStyle = mixLab(PARCH, m.core, 0.2);
    c.font = `italic 400 ${s1}px ${FONT.text}`;
    c.fillText(DOUBT[2], x, y + s2 * 1.25 + s1 * 1.55);
    textProbe(c, `${ID}-doubt`, x, y - s1, Math.max(w, 260), s2 * 1.25 + s1 * 2.6, a);
    c.restore();
  });
}
/** the label, lower left: 10 earlier claims retired · then, on 'narrower', dead end → a defined numeric subset */
function labelCard(c: C2, m: Palette, a1: number, a2: number) {
  if (a1 <= 0.003) return;
  textRole(c, 'subject', () => {
    c.save();
    const s1 = legibleSize(c, `600 21px ${FONT.sc}`, 21, LABEL[0]);
    const s2 = legibleSize(c, `italic 400 19px ${FONT.text}`, 19);
    const x = 56, y = 588;
    c.globalAlpha = a1;
    softPlate(c, 250, y - 4, 620, 140, m.ink, 0.6);
    c.fillStyle = mixLab(m.core, '#ffffff', 0.1);
    const w = drawTracked(c, LABEL[0], x, y, { font: `600 ${s1}px ${FONT.sc}`, size: s1, tracking: 0.05, align: 'left' });
    textProbe(c, `${ID}-label1`, x, y - s1, w, s1 * 1.1, a1);
    if (a2 > 0.003) {
      c.globalAlpha = a1 * a2;
      c.fillStyle = mixLab(PARCH, m.core, 0.2);
      c.font = `italic 400 ${s2}px ${FONT.text}`;
      c.fillText(LABEL[1], x, y + s2 * 1.45);
      textProbe(c, `${ID}-label2`, x, y + s2 * 0.45, c.measureText(LABEL[1]).width, s2 * 1.1, a1 * a2);
    }
    c.restore();
  });
}
