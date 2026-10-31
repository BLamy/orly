/**
 * ch08-s08 — DECISIONS MADE, THE LIGHTS COME BACK ON, AND TAG 8 HANGS STRUCK. dawnGold morning, crossfade in from
 * ch08-s07's desk; 6.33 s on the locked clock (L0813 "In mid-September, he settled three questions." 0.80 → 2.92).
 *
 * A. THE DESK, CLOSE (sets/ch08-s07-desk; the hands resting on the desk, as s07 left them)
 *   desk      (0.20)  the date "14 SEPTEMBER 2026" sets top-left; a paper slip on the desk inks the three decisions'
 *                     label: "an index read · one comparison helper · JS writes springs"
 *   cards     (2.12)  three paper question cards slide in from the left, under Cheng's left hand, and come to rest in
 *                     a row FLANKED by his two hands (fingertips at the row's outer corners). Each card carries its '?'
 *                     and, under it, its own question's answer from the label (the slip dims to 50 % as they land)
 *   stamp     (2.39)  the small stamp (ch08-s06's: a plain ring-and-tick, no words) presses each card in turn, one
 *                     snappy 14 px hop every 0.15 s, beside its '?': the option the review had recommended (shown,
 *                     never said). The stamped desk is carried through the first 0.4 s of the dissolve
 * B. THE THAWING WINDOW (staging tagLine variant 'ch08-late'), DISSOLVED IN from 2.86 (the calendar already showing
 *    by 3.05): the workshop in morning dawnGold, frost crusted along every pane's edges and thawing about 30 % back
 *    toward them by the end, the Window Calendar (sets/windowCalendar, canonical grid, exact counts) seen through the
 *    clearing glass; the copper line at 52 % of frame height with the canonical tags; its right post in frame, the
 *    frost on it melted to beads.
 *   relight   (3.13)  the first September pane lights ON the beat and the column ripples up bottom-first to 58 panes by
 *                     3.9, in full view (June 72, July 6, August dark with snow on its sill, October not yet); the
 *                     date swaps to "SEPTEMBER 2026 · 58"; then the camera settles down onto the line
 *   strike    (4.33)  the red-pencil hand enters from frame RIGHT and strikes tag 8's front through once
 *   rule      (4.93)  the framing has already come up so the Lifespan Rule is whole; tag 8's thread, dropped in s03 to
 *                     about eight weeks, glints once along its run, the ONE highlight (the rule's other open tips dim
 *                     to 25 % for it)
 *   (to 6.33)         hold. Ends into ch09-s01's lampChange (its dimmer starts at D − 0.6 by the locked clock).
 *
 * Review r1 framing rules: rule labels show only when wholly inside x 64-1216 / y ≤ 684 (stage px), else not at all;
 * tag 7's knot card hangs 18 px lower so it clears tag 6's; the nanoGPT question card hangs wholly behind tag 10.
 */
import { Timeline } from '../../../core';
import type { Camera3, Frame, LayerSpec, PaintEnv } from '../../../film';
import { FONT, cam3Interp, cardPaperAlpha, cardProbe, defineShot, hash1, legibleSize, mixLab, softPlate, textProbe, textRole, textSwap, withAlpha } from '../../../film';
import { LAYERS } from '../../../film/contracts';
import { toScreen } from '../../../film/core/multiplane';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hands } from '../cast';
import { deskBack, deskFront, deskNear, DESK } from '../sets/ch08-s07-desk';
import { paneRect, windowCalendar } from '../sets/windowCalendar';
import { LINE, RULE, SLOT_X, TAGS, TICKS, drawLine, drawRule, drawTags, drawThread, lifeX, tagAnchors, tagStrike, tagsAt, type TagState } from '../sets/tagLine';

type C2 = CanvasRenderingContext2D;
const ID = 'ch08-s08';

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const smr = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const seg = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

interface Beats {
  D: number;
  desk: number;
  cards: number;
  stamp: number;
  relight: number;
  strike: number;
  rule: number;
}

/** the dissolve desk → workshop (the stamped desk carried through its first 0.4 s) */
const X0 = 2.86;
const X1 = 3.3;
const workshopA = (t: number) => Math.pow(sm((t - X0) / (X1 - X0)), 0.7);

// ---------------------------------------------------------------- A. the desk
const CAM_A0: Camera3 = { x: 646, y: 566, z: 340, lens: 1 };
const CAM_A1: Camera3 = { x: 646, y: 560, z: 360, lens: 1 };
const LABEL_SEGS = ['an index read', 'one comparison helper', 'JS writes springs'];
const SEP = '  ·  ';
const SLIP_Y = 676; // baseline of the slip's text (L4 rest)
const CARD = { top: 566, h: 70, gap: 16, minW: 150 } as const;
const STAMP_STEP = 0.15;

// ---------------------------------------------------------------- B. the workshop
const CAL_L: LayerSpec = { id: 'cal', z: 2600, haze: 0.2, blur: 1 };
/** the calendar's base centre (CAL_L rest px) and its scale (one canonical grid, drawn twice the size: we are near) */
const CAL_AT = { x: 586, y: 474, s: 2 } as const;
/** the workshop's window holes (L2 rest px) and their panes */
const WINS = [300, 720, 1140].map((cx) => ({ x0: cx - 165, x1: cx + 165, y0: -120, y1: 500 }));
const PANE_COLS = 2, PANE_ROWS = 6;
/** the line at 52 % (the ch08 variant): everything on the line is drawn with the canonical geometry, shifted up */
const DY = 720 * 0.52 - LINE.y;
/** the calendar, the frost and the right post with its beads (a slow rising push through the relight) */
const CAM_B0: Camera3 = { x: 880, y: 300, z: 420, lens: 1 };
const CAM_B0b: Camera3 = { x: 866, y: 312, z: 448, lens: 1 };
/** down onto the line for the strike */
const CAM_B1: Camera3 = { x: 800, y: 440, z: 500, lens: 1 };
/** after the strike: up and back so the Lifespan Rule is whole for the glint */
const CAM_B2: Camera3 = { x: 790, y: 470, z: 436, lens: 1 };
const CAM_B3: Camera3 = { x: 786, y: 474, z: 424, lens: 1 };
const STRIKE_D = 1.1;

/** tag 8's lane on the rule's face (drawTags stacks thread runs in tag order) */
const T8_LANE = (() => {
  let lane = 0;
  for (const st of tagsAt(ID, 'start')) {
    const def = TAGS[st.id];
    if (def.slack || def.kind === 'question' || def.kind === 'card') continue;
    if (!def.strands || st.drop === undefined) continue;
    if (st.id === '8') return lane;
    lane += def.strands.length;
  }
  return lane;
})();

export default defineShot({
  id: ID,
  mood: 'dawnGold',
  build({ timing: T }) {
    const tl = new Timeline();
    const beats: Beats = {
      D: T.duration,
      desk: T.beat('desk'),
      cards: T.beat('cards'),
      stamp: T.beat('stamp'),
      relight: T.beat('relight'),
      strike: T.beat('strike'),
      rule: T.beat('rule'),
    };
    tl.hold(0, T.duration);
    return { tl, beats };
  },
  paint(f, _s, scene) {
    const b = scene.beats as Beats;
    const t = f.t;
    const w = workshopA(t);
    if (w >= 1) paintWorkshop(f, t, b);
    else if (w <= 0) paintDesk(f, t, b, 1);
    else {
      // a true dissolve: paint the workshop, keep it, paint the desk, lay the workshop back over it at w
      paintWorkshop(f, t, b);
      const snap = snapshot(f.c.canvas as HTMLCanvasElement | OffscreenCanvas);
      paintDesk(f, t, b, 1 - w);
      const c = f.c;
      c.save();
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalAlpha = w;
      c.globalCompositeOperation = 'source-over';
      c.drawImage(snap, 0, 0);
      c.restore();
    }
    dates(f, t, b);
  },
});

/** the workshop frame kept for the dissolve (device px, reused; the shot stays a pure function of t) */
let SNAP: OffscreenCanvas | null = null;
function snapshot(src: HTMLCanvasElement | OffscreenCanvas) {
  if (!SNAP || SNAP.width !== src.width || SNAP.height !== src.height) SNAP = new OffscreenCanvas(src.width, src.height);
  const s = SNAP.getContext('2d')!;
  s.setTransform(1, 0, 0, 1, 0, 0);
  s.globalAlpha = 1;
  s.globalCompositeOperation = 'copy';
  s.drawImage(src, 0, 0);
  s.globalCompositeOperation = 'source-over';
  return SNAP;
}

// ================================================================ A. the desk
function paintDesk(f: Frame, t: number, b: Beats, vis: number) {
  const tq = f.tq;
  const base = cam3Interp(CAM_A0, CAM_A1)(sm(t / 3.2));
  // a small rising push as the dissolve begins
  const rise = seg(t, X0 - 0.2, X1 + 0.1);
  const cam: Camera3 = { ...base, y: base.y - 26 * rise, z: base.z + 14 * rise };
  f.camera(cam);
  deskBack(f, { key: ID, lamp: 0.5 });
  const L = cardLayout(f.c);
  const restAt = {
    L: { x: L.x[0] - L.w[0] / 2 - 14, y: CARD.top + CARD.h - 6 },
    R: { x: L.x[2] + L.w[2] / 2 + 14, y: CARD.top + CARD.h - 6 },
    A: { x: DESK.x + DESK.w * 1.05, y: 612 },
  };
  f.layer('L4', (c, env) =>
    deskFront(c, env, {
      tq,
      hands: { rest: 1, agentRim: 1, typing: false, restAt },
      screen: 0.52,
      page: { from: -14.7, to: 0 },
      under: (cc, e) => {
        slip(cc, e, t, b, vis);
        cards(cc, e, t, tq, b, vis);
      },
      over: (cc, e) => stampTool(cc, e, tq, b),
    }),
  );
  // the desk's near edge (L5, near-black): just the lower frame edge at this close framing
  deskNear(f, { y: 812 });
}

/** card widths and centres (L4 rest px): each card wide enough for its phrase */
function phraseFont(c: C2) {
  const size = legibleSize(c, `500 15px ${FONT.text}`, 15);
  return { size, font: `500 ${size}px ${FONT.text}` };
}
function cardLayout(c: C2) {
  const { font } = phraseFont(c);
  c.save();
  c.font = font;
  const w = LABEL_SEGS.map((s) => Math.max(CARD.minW, c.measureText(s).width + 26));
  c.restore();
  const total = w[0] + w[1] + w[2] + 2 * CARD.gap;
  const x0 = DESK.x - total / 2;
  const x = [x0 + w[0] / 2, x0 + w[0] + CARD.gap + w[1] / 2, x0 + w[0] + w[1] + 2 * CARD.gap + w[2] / 2];
  return { w, x };
}

/** the slip's segment layout (L4 rest x), measured in the slip's own font */
function slipLayout(c: C2) {
  const size = legibleSize(c, `500 16px ${FONT.text}`, 16);
  const font = `500 ${size}px ${FONT.text}`;
  c.save();
  c.font = font;
  const ws = LABEL_SEGS.map((s) => c.measureText(s).width);
  const sw = c.measureText(SEP).width;
  c.restore();
  const total = ws.reduce((a, w) => a + w, 0) + 2 * sw;
  return { size, font, ws, sw, total, x0: DESK.x - total / 2 };
}

/** the paper slip on the desk: the three decisions' label, inked left to right as the shot opens; it dims to 50 %
 *  as the cards (which carry the same three answers) land */
function slip(c: C2, env: PaintEnv, t: number, b: Beats, vis: number) {
  const L = slipLayout(c);
  const inkAt = b.desk + 0.1;
  const dim = 1 - 0.5 * seg(t, b.cards - 0.1, b.cards + 0.35);
  const paper = cardPaperAlpha(t, inkAt, 0.3) * vis;
  if (paper <= 0.01) return;
  const ink = seg(t, inkAt, inkAt + 1.1);
  const x0 = L.x0 - 22, x1 = L.x0 + L.total + 22;
  const y0 = SLIP_Y - L.size * 1.05, y1 = SLIP_Y + L.size * 0.55;
  c.save();
  c.globalAlpha = paper * (0.55 + 0.45 * dim);
  c.fillStyle = withAlpha('#000000', 0.25);
  c.fillRect(x0 + 3, y0 + 4, x1 - x0, y1 - y0);
  c.fillStyle = mixLab(mixLab('#e6d4ab', env.mood.halo, 0.25), env.mood.ink, 0.12);
  c.beginPath();
  c.moveTo(x0 + 6, y0);
  c.lineTo(x1, y0 + 1.5);
  c.lineTo(x1 - 4, y1);
  c.lineTo(x0, y1 - 1);
  c.closePath();
  c.fill();
  c.restore();
  cardProbe(c, `${ID}-slip`, x0, y0, x1 - x0, y1 - y0, paper, ink > 0 ? dim : 0);
  textRole(c, 'subject', () => {
    c.save();
    c.globalAlpha = paper * dim;
    c.font = L.font;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.beginPath();
    c.rect(L.x0 - 4, y0 - 6, (L.total + 8) * ink, y1 - y0 + 12);
    c.clip();
    c.fillStyle = mixLab('#20160e', env.mood.ink, 0.2);
    let x = L.x0;
    LABEL_SEGS.forEach((s, i) => {
      c.fillText(s, x, SLIP_Y);
      x += L.ws[i];
      if (i < 2) {
        c.fillText(SEP, x, SLIP_Y);
        x += L.sw;
      }
    });
    c.restore();
    textProbe(c, `${ID}-label`, L.x0, SLIP_Y - L.size * 0.8, L.total, L.size, paper * dim * (ink > 0.3 ? 1 : ink));
  });
}

/** card k's centre x and slide (from under the left hand) at time t */
function cardPos(c: C2, k: number, t: number, b: Beats) {
  const L = cardLayout(c);
  const to = L.x[k];
  const t0 = b.cards - 0.3 + k * 0.07;
  const u = smr((t - t0) / 0.42);
  const from = to - 460;
  return { x: lerp(from, to, u), on: t >= t0, u, w: L.w[k] };
}
function cardStampAt(b: Beats, k: number) {
  return b.stamp + k * STAMP_STEP;
}
/** where the stamp's mark sits on card k (beside its '?') */
function markAt(cx: number, w: number) {
  return { x: cx + Math.min(46, w * 0.28), y: CARD.top + 20 };
}

/** three paper question cards lying on the desk, each with its '?' and its answer under it */
function cards(c: C2, env: PaintEnv, t: number, tq: number, b: Beats, vis: number) {
  const { size, font } = phraseFont(c);
  for (let k = 0; k < 3; k++) {
    const p = cardPos(c, k, tq, b);
    if (!p.on) continue;
    const cx = p.x;
    const yT = CARD.top, yB = CARD.top + CARD.h;
    const wT = p.w * 0.95, wB = p.w;
    c.save();
    c.globalAlpha = vis;
    c.fillStyle = withAlpha('#000000', 0.32);
    c.beginPath();
    c.moveTo(cx - wT / 2 + 3, yT + 4);
    c.lineTo(cx + wT / 2 + 3, yT + 4);
    c.lineTo(cx + wB / 2 + 3, yB + 4);
    c.lineTo(cx - wB / 2 + 3, yB + 4);
    c.closePath();
    c.fill();
    c.fillStyle = mixLab(mixLab('#efe2c2', env.mood.halo, 0.2), env.mood.ink, 0.06);
    c.beginPath();
    c.moveTo(cx - wT / 2, yT);
    c.lineTo(cx + wT / 2, yT);
    c.lineTo(cx + wB / 2, yB);
    c.lineTo(cx - wB / 2, yB);
    c.closePath();
    c.fill();
    c.restore();
    cardProbe(c, `${ID}-card${k}`, cx - wB / 2, yT, wB, CARD.h, vis, vis);
    textRole(c, 'subject', () => {
      c.save();
      c.globalAlpha = vis;
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      // the question mark, then the answer under it
      const qs = legibleSize(c, `600 22px ${FONT.display}`, 22);
      c.font = `600 ${qs}px ${FONT.display}`;
      c.fillStyle = withAlpha('#2a1d14', 0.85);
      c.fillText('?', cx, yT + 26);
      c.font = font;
      c.fillStyle = mixLab('#20160e', env.mood.ink, 0.15);
      const py = yB - 14;
      c.fillText(LABEL_SEGS[k], cx, py);
      const tw = c.measureText(LABEL_SEGS[k]).width;
      textProbe(c, `${ID}-card${k}-q`, cx - qs * 0.3, yT + 26 - qs * 0.75, qs * 0.6, qs * 0.8, vis);
      textProbe(c, `${ID}-card${k}-a`, cx - tw / 2, py - size * 0.8, tw, size, vis);
      c.restore();
    });
    // the stamp's mark (dark ink, the same mark on each card), from its press on: beside the '?'
    const at = cardStampAt(b, k);
    if (tq >= at) {
      const a = 0.85 * seg(tq, at, at + 0.04) * vis;
      const m = markAt(cx, p.w);
      ringTick(c, m.x, m.y, 13, withAlpha(mixLab('#21170f', '#3a2a40', 0.25), a));
    }
  }
}

/** the stamp's impression: a ring and a tick (no words) */
function ringTick(c: C2, x: number, y: number, r: number, col: string) {
  c.save();
  c.translate(x, y);
  c.rotate(-0.1);
  c.strokeStyle = col;
  c.lineWidth = r * 0.16;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = r * 0.2;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  c.moveTo(-r * 0.42, r * 0.05);
  c.lineTo(-r * 0.12, r * 0.38);
  c.lineTo(r * 0.48, -r * 0.38);
  c.stroke();
  c.restore();
}

/** the small stamp (ch08-s06's): comes down from above onto card 1, then three snappy presses, each a 14 px hop and
 *  0.15 s apart, then lifts away up (during the dissolve) */
function stampTool(c: C2, env: PaintEnv, tq: number, b: Beats) {
  const s0 = cardStampAt(b, 0), s2 = cardStampAt(b, 2);
  const enter = s0 - 0.28;
  const gone = s2 + 0.5;
  if (tq < enter || tq > gone) return;
  const mk = (k: number) => {
    const p = cardPos(c, k, tq, b);
    return markAt(p.x, p.w);
  };
  let h: number;
  let x: number;
  let y: number;
  if (tq < s0) {
    const m = mk(0);
    h = 320 * Math.pow(1 - sm((tq - enter) / (s0 - enter)), 1.4);
    x = m.x;
    y = m.y;
  } else if (tq < s2) {
    const k = Math.min(1, Math.floor((tq - s0) / STAMP_STEP));
    const u = (tq - cardStampAt(b, k)) / STAMP_STEP;
    const a = mk(k), bb = mk(k + 1);
    const mv = sm((u - 0.3) / 0.6);
    x = lerp(a.x, bb.x, mv);
    y = lerp(a.y, bb.y, mv);
    // held on the paper two frames, then a 14 px hop to the next card
    h = u < 0.28 ? 0 : 14 * Math.sin(Math.PI * clamp01((u - 0.28) / 0.72));
  } else {
    const m = mk(2);
    x = m.x;
    y = m.y;
    h = tq < s2 + 0.08 ? 0 : 420 * sm((tq - s2 - 0.08) / 0.42);
  }
  c.save();
  c.translate(x, y + 6 - h);
  c.scale(0.8, 0.8);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(-22, -8, 44, 8);
  c.fillRect(-19, -22, 38, 14);
  c.beginPath();
  c.moveTo(-9, -22);
  c.quadraticCurveTo(-4, -42, -7, -60);
  c.lineTo(7, -60);
  c.quadraticCurveTo(4, -42, 9, -22);
  c.closePath();
  c.fill();
  c.beginPath();
  c.ellipse(0, -72, 14, 13, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.8);
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(0, -72, 13, Math.PI * 1.15, Math.PI * 1.85);
  c.moveTo(-19, -22);
  c.lineTo(19, -22);
  c.stroke();
  c.restore();
}

// ================================================================ B. the workshop, the calendar, the line
function camB(t: number, b: Beats): Camera3 {
  const tA = 3.85;
  const tB = b.strike - 0.02;
  const tC = b.strike + 0.15;
  const tD = b.rule - 0.03;
  if (t < tA) return cam3Interp(CAM_B0, CAM_B0b)(sm((t - X0) / (tA - X0)) * 0.6 + clamp01((t - X0) / (tA - X0)) * 0.4);
  if (t < tB) return cam3Interp(CAM_B0b, CAM_B1)(smr((t - tA) / (tB - tA)));
  if (t < tC) return CAM_B1;
  if (t < tD) return cam3Interp(CAM_B1, CAM_B2)(sm((t - tC) / (tD - tC)));
  return cam3Interp(CAM_B2, CAM_B3)(sm((t - tD) / (b.D - tD)));
}

function paintWorkshop(f: Frame, t: number, b: Beats) {
  const tq = f.tq;
  const cam = camB(t, b);
  f.camera(cam);
  f.backlight({ sunX: 760, sunY: 330, intensity: 1 });
  // the Window Calendar beyond the glass: September relights bottom-up, the first pane ON the beat, 58 by ~3.9
  const sepU = clamp01((t - b.relight + 0.02) / 0.78);
  f.layer(CAL_L, (c, env) => {
    c.save();
    c.translate(CAL_AT.x, CAL_AT.y);
    c.scale(CAL_AT.s, CAL_AT.s);
    windowCalendar(f, c, env, { x: 0, y: 0, fill: { jun: 1, jul: 1, aug: 0, sep: sepU, oct: 0 }, snow: true, warm: 0.85, key: ID });
    c.restore();
    // the ripple: a soft warm bloom riding the newest pane up the column
    const lit = Math.floor(58 * sepU);
    if (lit > 0 && sepU < 1.05 && t < b.relight + 1.1) {
      const pr = paneRect('sep', lit - 1, { x: 0, y: 0 });
      const px = CAL_AT.x + (pr.x + pr.w / 2) * CAL_AT.s, py = CAL_AT.y + (pr.y + pr.h / 2) * CAL_AT.s;
      const fade = 1 - seg(t, b.relight + 0.7, b.relight + 1.05);
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(px, py, 3, px, py, 70);
      g.addColorStop(0, withAlpha(env.mood.core, 0.32 * fade));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(px - 70, py - 70, 140, 140);
      c.restore();
    }
  });
  // the workshop's window wall (holes), its frost crusted on every pane's edges and thawing back toward them
  f.layer('L2', (c, env) => {
    f.cached(`${ID}/L2/${env.mood.id}`, 1900, 1200, (cc) => {
      cc.translate(330, 300);
      workshopWall(cc, env);
    })(c, -330, -300);
    frost(c, env, clamp01((t - X0) / (b.D - X0)));
  });
  f.fog({ yCenter: 470, height: 260, alpha: 0.16, drift: 6 });
  f.layer('L3', (c, env) => {
    f.cached(`${ID}/L3/${env.mood.id}`, 1900, 420, (cc) => {
      cc.translate(330, -440);
      bench(cc, env);
    })(c, -330, 440);
  });
  f.fog('B');
  // the line, the rule, the tags; the pencil's strike and the thread's glint
  const strikeU = clamp01((tq - (b.strike - 0.35 * STRIKE_D)) / STRIKE_D);
  const sk = tagStrike({ id: '8' } as TagState);
  const pp = strikeU > 0 && strikeU < 1 ? hands.pencil('strike', strikeU, sk.centre, { strikeW: sk.w, strikeAngle: sk.angle, scale: 1.05, entry: entryLocal(cam) }) : null;
  const stroke = strikeU >= 0.47 ? 1 : pp?.stroke ?? 0;
  const kick = t > b.strike ? 0.06 * Math.exp(-(t - b.strike) * 2.4) * Math.sin((t - b.strike) * 8) : 0;
  const states = tagsAt(ID, 'start').map((st): TagState => {
    if (st.id === '8') return { ...st, strike: stroke, swing: 0.022 + kick, phase: 0.4 };
    // tag 7's knot card is drawn by this shot, 18 px lower, so it clears tag 6's
    if (st.id === '7') return { ...st, knot: [] };
    // the nanoGPT question hangs wholly behind tag 10 in this framing
    if (st.id === 'nano') return { ...st, x: SLOT_X['10'], swing: 0.01 };
    return st;
  });
  // the rule's ambient lights (the open tips) dim to 25 % for the glint: tag 8's bead is the one highlight
  const amb = 1 - 0.75 * seg(t, b.rule - 0.25, b.rule);
  f.layer('L4', (c, env) => {
    c.save();
    c.translate(0, DY);
    drawLine(c, env, { glow: 0.6 - 0.25 * (1 - amb) });
    drawRule(c, env, { labels: 0 });
    ruleLabels(c, env, cam);
    threads(c, env, states, amb);
    drawTags(c, env, states.map((st) => ({ ...st, drop: undefined })), { tq });
    knot7(c, env, states.find((s) => s.id === '7'));
    beads(c, env, t, b);
    glint(c, env, t, b);
    if (pp) hands.draw(c, pp, env);
    c.restore();
  });
  f.rim({ x: 0, y: -1 });
}

/** every thread to the rule, as drawTags would lay them (same lanes), with the open tips' glow under our control */
function threads(c: C2, env: PaintEnv, states: TagState[], glow: number) {
  let lane = 0;
  for (const st of states) {
    const def = TAGS[st.id];
    if (def.slack || def.kind === 'question' || def.kind === 'card') continue;
    if (!def.strands || st.drop === undefined) continue;
    const an = tagAnchors(st);
    def.strands.forEach((sd, i) => {
      const u = Array.isArray(st.drop) ? st.drop[i] ?? 0 : st.drop ?? 0;
      const from = def.strands!.length > 1 ? { x: an.bottom.x + (i === 0 ? -8 : 8), y: an.bottom.y } : an.bottom;
      drawThread(c, env, from, lifeX(sd.days), sd.tip, u, { lane: lane++, glow });
    });
  }
}

/** tag 7's knot card ("HandwiredOS's own design"), drawn as drawTag draws knot cards but 18 px lower */
function knot7(c: C2, env: PaintEnv, st: TagState | undefined) {
  if (!st) return;
  const label = TAGS['7'].knot[0];
  const eye = tagAnchors(st).eye;
  const s = 1;
  textRole(c, 'texture', () => {
    c.save();
    const fs = 6.6 * s;
    c.font = `600 ${fs.toFixed(2)}px ${FONT.sc}`;
    const tw = c.measureText(label).width;
    const cw = tw + 8 * s, ch = fs + 6 * s;
    const kx = eye.x - cw - 6 * s, ky = eye.y - ch * 0.4 + 18;
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
    c.fillRect(kx + 1.5 * s, ky + 2 * s, cw, ch);
    c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.2), env.mood.haze, env.layer.haze * 0.6);
    c.fillRect(kx, ky, cw, ch);
    c.strokeStyle = withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, env.layer.haze * 0.6), 0.85);
    c.lineWidth = 0.9 / (Math.hypot(c.getTransform().a, c.getTransform().b) || 1);
    c.beginPath();
    c.moveTo(kx + cw, ky + ch * 0.5);
    c.lineTo(eye.x, eye.y + 7 * s);
    c.stroke();
    c.fillStyle = mixLab('#1d140d', env.mood.ink, 0.3);
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.fillText(label, kx + 4 * s, ky + ch * 0.55);
    c.restore();
  });
}

/** the rule's tick labels, each shown only when it lies wholly inside the safe frame (else not at all) */
function ruleLabels(c: C2, env: PaintEnv, cam: Camera3) {
  textRole(c, 'texture', () => {
    c.save();
    c.font = `italic 15px ${FONT.display}`;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    const y = RULE.y + RULE.h + 6;
    for (const tk of TICKS) {
      if (!tk.label) continue;
      const x = lifeX(tk.days);
      const w = c.measureText(tk.label).width;
      const a0 = toScreen(LAYERS.L4, cam, x - w / 2, y + DY);
      const a1 = toScreen(LAYERS.L4, cam, x + w / 2, y + DY + 17);
      const margin = Math.min(a0.x - 64, 1216 - a1.x, 684 - a1.y);
      const a = clamp01(margin / 24);
      if (a <= 0.01) continue;
      c.fillStyle = withAlpha(mixLab(env.mood.core, env.mood.rim, 0.3), 0.92 * a);
      c.fillText(tk.label, x, y);
    }
    c.restore();
  });
}

/** the pencil's entry (frame lower right) in the line's shifted L4 coordinates */
function entryLocal(cam: Camera3) {
  const e = hands.entry(cam, 'L4').pencil;
  return { x: e.x, y: e.y - DY };
}

/** L2: the workshop wall, three tall flat-headed windows (holes) with mullions and deep sills */
function workshopWall(c: C2, env: PaintEnv) {
  const wall = env.fill('set');
  c.fillStyle = wall;
  c.beginPath();
  c.rect(-330, -300, 1900, 1200);
  for (const w of WINS) c.rect(w.x0, w.y0, w.x1 - w.x0, w.y1 - w.y0);
  c.fill('evenodd');
  const ink = mixLab(wall, env.mood.ink, 0.5);
  c.fillStyle = ink;
  for (const w of WINS) {
    for (let i = 1; i < PANE_COLS; i++) c.fillRect(lerp(w.x0, w.x1, i / PANE_COLS) - 4, w.y0, 8, w.y1 - w.y0);
    for (let j = 1; j < PANE_ROWS; j++) c.fillRect(w.x0, lerp(w.y0, w.y1, j / PANE_ROWS) - 3, w.x1 - w.x0, 6);
    c.fillRect(w.x0 - 4, w.y0, 8, w.y1 - w.y0);
    c.fillRect(w.x1 - 4, w.y0, 8, w.y1 - w.y0);
    c.fillRect(w.x0 - 18, w.y1, w.x1 - w.x0 + 36, 14);
  }
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.6);
  c.lineWidth = 1.5;
  c.beginPath();
  for (const w of WINS) {
    c.moveTo(w.x0 - 18, w.y1 + 0.5);
    c.lineTo(w.x1 + 18, w.y1 + 0.5);
  }
  c.stroke();
  for (const w of WINS) {
    const g = c.createLinearGradient(w.x1, 0, w.x1 + 90, 0);
    g.addColorStop(0, withAlpha(env.mood.halo, 0.14));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(w.x1 + 4, w.y0, 90, w.y1 - w.y0);
  }
}

/** frost on the glass (L2): a pale crust along every pane's edges with feathered crystal fronds, thawing back toward
 *  the edges as the morning warms (u 0 → 1: the band about 30 % thinner by the end) */
function frost(c: C2, env: PaintEnv, u: number) {
  const th = 30 * (1 - 0.3 * sm(u));
  const pale = mixLab('#eef3f5', env.mood.core, 0.22);
  c.save();
  for (const w of WINS) {
    const pw = (w.x1 - w.x0) / PANE_COLS, ph = (w.y1 - w.y0) / PANE_ROWS;
    for (let i = 0; i < PANE_COLS; i++) {
      for (let j = 0; j < PANE_ROWS; j++) {
        const x0 = w.x0 + i * pw + 4, y0 = w.y0 + j * ph + 3, x1 = x0 + pw - 8, y1 = y0 + ph - 6;
        c.save();
        c.beginPath();
        c.rect(x0, y0, x1 - x0, y1 - y0);
        c.clip();
        // the crust: heavier along the bottom (where the cold pools), lighter at the top
        const edges: [number, number, number, number, number, number][] = [
          [x0, y1, x0, y1 - th * 1.25, 0.5, 0],
          [x0, y0, x0, y0 + th * 0.7, 0.32, 1],
          [x0, y0, x0 + th, y0, 0.4, 2],
          [x1, y0, x1 - th, y0, 0.4, 3],
        ];
        for (const [ax, ay, bx, by, a] of edges) {
          const g = c.createLinearGradient(ax, ay, bx, by);
          g.addColorStop(0, withAlpha(pale, a));
          g.addColorStop(0.55, withAlpha(pale, a * 0.35));
          g.addColorStop(1, withAlpha(pale, 0));
          c.fillStyle = g;
          if (ax === bx) c.fillRect(x0, Math.min(ay, by), x1 - x0, Math.abs(by - ay));
          else c.fillRect(Math.min(ax, bx), y0, Math.abs(bx - ax), y1 - y0);
        }
        // fronds: short feathered strokes growing in from the lower edge and the corners
        c.strokeStyle = withAlpha(pale, 0.55);
        c.lineWidth = 1.1;
        c.beginPath();
        const seed = (Math.round(w.x0) + i * 7 + j * 13) | 0;
        for (let k = 0; k < 9; k++) {
          const fx = x0 + (k + 0.5 + 0.4 * hash1(k, seed)) * ((x1 - x0) / 9);
          const len = th * (0.7 + 0.5 * (hash1(k, seed + 5) + 1) * 0.5);
          const ang = -Math.PI / 2 + 0.5 * hash1(k, seed + 9);
          const ex = fx + Math.cos(ang) * len, ey = y1 + Math.sin(ang) * len;
          c.moveTo(fx, y1);
          c.lineTo(ex, ey);
          for (let q = 1; q <= 3; q++) {
            const mx = lerp(fx, ex, q / 4), my = lerp(y1, ey, q / 4);
            const bl = len * 0.22 * (1 - q / 5);
            c.moveTo(mx, my);
            c.lineTo(mx + Math.cos(ang - 0.7) * bl, my + Math.sin(ang - 0.7) * bl);
            c.moveTo(mx, my);
            c.lineTo(mx + Math.cos(ang + 0.7) * bl, my + Math.sin(ang + 0.7) * bl);
          }
        }
        c.stroke();
        c.restore();
      }
    }
    // beads of melt along the lowest bar
    c.fillStyle = withAlpha(pale, 0.6 * (0.4 + 0.6 * sm(u)));
    for (let i = 0; i < 9; i++) {
      const bx = w.x0 + 18 + i * ((w.x1 - w.x0 - 36) / 8) + 6 * hash1(i, 3);
      c.beginPath();
      c.arc(bx, w.y1 - 8, 2 + 0.8 * hash1(i, 5), 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

/** L3: the workbench with its parchment plates pinned along the back edge (the canonical workshop's bench) */
function bench(c: C2, env: PaintEnv) {
  const ink = env.fill('set');
  const plates = [[40, 484, 120, 80], [210, 498, 96, 64], [900, 488, 110, 74], [1060, 478, 130, 88]];
  for (const [x, y, w, h] of plates) {
    c.fillStyle = mixLab(mixLab('#e2cfa4', env.mood.halo, 0.4), env.mood.haze, 0.35);
    c.fillRect(x, y, w, h);
    c.fillStyle = withAlpha(env.mood.ink, 0.22);
    for (let i = 0; i < 4; i++) c.fillRect(x + w * 0.12, y + h * (0.22 + i * 0.17), w * (0.7 - (i % 2) * 0.2), 1.6);
  }
  c.fillStyle = ink;
  c.fillRect(-330, 560, 1900, 14);
  c.fillStyle = mixLab(ink, env.mood.fg, 0.35);
  c.fillRect(-330, 574, 1900, 300);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.55);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(-330, 560);
  c.lineTo(1570, 560);
  c.stroke();
}

/** the right post's frost: a pale crust on the finial's top melting to beads that creep down the collar and shaft */
function beads(c: C2, env: PaintEnv, t: number, b: Beats) {
  const px = LINE.x1;
  const y = LINE.y;
  const u = clamp01((t - X0) / (b.D - X0));
  const pale = mixLab('#eef3f5', env.mood.core, 0.3);
  // the crust on the finial's top (shrinking as it melts)
  const crust = 1 - 0.6 * sm(u);
  c.fillStyle = withAlpha(pale, 0.8);
  c.beginPath();
  c.ellipse(px, y - 27, 6.5 * crust + 1, 3.2 * crust + 0.6, 0, Math.PI, 0);
  c.fill();
  const pts: [number, number, number][] = [[-6, -24, 2.9], [5.5, -19, 2.5], [-8, -9, 2.7], [8, -8, 2.3], [-5, 2, 3.1], [5, 10, 2.6], [-4, 24, 2.8], [4.5, 34, 2.4]];
  pts.forEach(([dx, dy, r], i) => {
    const drip = sm(u * 1.3 - i * 0.08) * 7;
    const g = c.createRadialGradient(px + dx - r * 0.35, y + dy + drip - r * 0.35, r * 0.1, px + dx, y + dy + drip, r);
    g.addColorStop(0, withAlpha('#ffffff', 0.95));
    g.addColorStop(0.45, withAlpha(pale, 0.8));
    g.addColorStop(1, withAlpha(pale, 0.35));
    c.fillStyle = g;
    c.beginPath();
    c.arc(px + dx, y + dy + drip, r, 0, Math.PI * 2);
    c.fill();
  });
}

/** tag 8's thread glints once: a bead of light runs along its run on the rule to the cut tip at about eight weeks */
function glint(c: C2, env: PaintEnv, t: number, b: Beats) {
  const u = (t - b.rule) / 0.45;
  if (u < -0.05 || u > 1.6) return;
  const an = tagAnchors({ id: '8' } as TagState);
  const ry = RULE.y + 5 + T8_LANE * 2.6;
  const lx = lifeX(TAGS['8'].strands![0].days);
  const R = 10;
  const drop = ry - R - an.bottom.y;
  const run = an.bottom.x - R - lx;
  const total = drop + (Math.PI / 2) * R + run;
  const at = (s: number) => {
    if (s <= drop) return { x: an.bottom.x, y: an.bottom.y + s };
    s -= drop;
    const corner = (Math.PI / 2) * R;
    if (s <= corner) {
      const a = s / R;
      return { x: an.bottom.x - R + R * Math.cos(a), y: ry - R + R * Math.sin(a) };
    }
    s -= corner;
    return { x: an.bottom.x - R - Math.min(s, run), y: ry };
  };
  c.save();
  c.globalCompositeOperation = 'lighter';
  if (u <= 1) {
    const p = at(sm(u) * total);
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 24);
    g.addColorStop(0, withAlpha(env.mood.core, 1));
    g.addColorStop(0.25, withAlpha(env.mood.halo, 0.5));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - 24, p.y - 24, 48, 48);
  }
  const fl = u > 0.85 ? Math.exp(-(u - 0.98) * (u - 0.98) * 30) : 0;
  if (fl > 0.01) {
    const g = c.createRadialGradient(lx, ry, 0, lx, ry, 34);
    g.addColorStop(0, withAlpha(env.mood.core, 0.95 * fl));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(lx - 34, ry - 34, 68, 68);
  }
  c.restore();
}

// ================================================================ screen-locked: the dates
/** "14 SEPTEMBER 2026" on the desk, swapping to "SEPTEMBER 2026 · 58" with the relight (never both at once) */
function dates(f: Frame, t: number, b: Beats) {
  const c = f.c;
  const sw = textSwap(t, b.relight + 0.1, 0.35);
  const a1 = seg(t, b.desk - 0.05, b.desk + 0.35) * sw.out;
  const a2 = sw.in;
  const one = (txt: string, a: number, id: string) => {
    if (a <= 0.01) return;
    c.save();
    textRole(c, 'subject', () => {
      const size = legibleSize(c, `500 21px ${FONT.mono}`, 21);
      const font = `500 ${size}px ${FONT.mono}`;
      c.font = font;
      c.letterSpacing = '2px';
      const w = c.measureText(txt).width;
      c.globalAlpha = a;
      softPlate(c, 72 + w / 2, 62, w + 140, size + 56, f.mood.ink, 0.5);
      c.fillStyle = mixLab('#efe6d2', f.mood.core, 0.25);
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      c.fillText(txt, 72, 70);
      textProbe(c, id, 72, 70 - size, w, size * 1.2, a);
    });
    c.restore();
  };
  one('14 SEPTEMBER 2026', a1, `${ID}-date1`);
  one('SEPTEMBER 2026 · 58', a2, `${ID}-date2`);
}
