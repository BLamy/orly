/**
 * neural-net-history — THE TYPESETTER'S BENCH inside the little lit box (ch01-s02; ch01-s03 opens on it).
 *
 * Close on the laptop's face, over the person's shoulder. We are CLOSE to a laptop, not looking at a panel
 * on the wall: the lid's dark bezel (rounded corners, a hairline of window light on its outer edge) frames
 * the screen, the keyboard deck's edge is a blurred near-plane lip along the bottom, the person's head and
 * shoulder are a dark L5 edge at frame left, and a sliver of the night window shows past the lid at right.
 * The push carries the bezel out past the frame edges until the screen's light fills the frame.
 * Inside the screen, staged as a typesetter's bench rather than an interface (illustrative only):
 *   - the field: a dark ground that glows at the centre and falls to ~40% in the corners;
 *   - the QUESTION stick: illustrative sorts ("Why is the sky blue?") dropping in across L0102, deliberately
 *     soft (out of focus, ~70% alpha) so we feel the act rather than read it; then "sent" a little way up;
 *   - the ANSWER stick below: sorts carrying faint, slightly blurred illustrative words ("Sunlight scatters
 *     in the air."), each rising out of the type case BEHIND the stick's back wall (a softer, lower plane),
 *     showing over the wall's top edge, then dropping into its slot from above (in front), landing exactly on
 *     its word with a 3 px bounce, on twos, and a puff of lamplit dust; the ghost slot waits in the NEXT sort's place, sized to
 *     it, blinking on the cursor's half-second rhythm;
 *   - the type case: a darker, blurred lip of compartments along the bottom of the field.
 *
 *   bench(f, { key, cams, state, ... })      paint everything (backlight → L5); the shot owns the camera
 *   benchTimes(T)                            timing (shot-local) of every sort, from the locked clock
 *   BENCH_FINAL                              the state at the end of ch01-s02 (for ch01-s03's hand-off)
 *   BENCH.screen                             the screen rectangle (L4 world)
 */
import type { Camera3, Frame, PaintEnv, ShotTiming } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan, toLayer } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { slugWidth } from '../../../film/silhouette/metaphors';
import { MFONT } from '../../../film/silhouette/metaphors/kit';
import { dustMotes } from '../../../film/silhouette/atmosphere';
import { hash1 } from '../../../film/silhouette/atmosphere';

type C = CanvasRenderingContext2D;

export const BENCH = {
  screen: { x: 150, y: 46, w: 980, h: 620 },
  /** the lid's bezel (thin, like a real laptop's: continuity with ch01-s01), its corner radius and the
   *  deeper chin above the hinge */
  bezel: 13,
  corner: 9,
  chin: 24,
  /** the question stick: its floor before and after it is "sent" */
  qX: 252,
  qY0: 258,
  qY1: 208,
  qSize: 40,
  /** the answer stick floor */
  aX: 252,
  aY: 434,
  aSize: 42,
} as const;

/** ch01-s02's camera: opens on the lid with its bezel, the shoulder and the window sliver; ends with the
 *  screen overscanning the frame (a 1.35x push over the whole shot, decelerating) */
export const BENCH_CAMS = {
  start: { x: 640, y: 356, z: -300, lens: 1 } as Camera3,
  end: { x: 610, y: 362, z: 250, lens: 1 } as Camera3,
};

/** '?' is cast on the same sort as 'blue' (set tight, no spacer) */
const QUESTION = ['Why', ' is', ' the', ' sky', ' blue?'];
/** the answer, illustrative only: one sort per spoken word from "writes" to the second "word" */
const ANSWER = ['Sunlight', ' scatters', ' in', ' the', ' air.'];

/** the bench lamp (a soft practical just above the sticks, L4 world) */
export const BENCH_LAMP = { x: 600, y: 370 } as const;

export interface BenchState {
  /** 0..1 question sorts dropped */
  qU: number;
  /** 0..1 question stick sent up the field */
  sent: number;
  /** 0..1 answer stick visible */
  aStick: number;
  /** shot-local time of each answer sort's landing */
  lands: number[];
  /** shot-local time (for the sorts' motion) */
  t: number;
  /** 0..1 the question softened further as the answer begins */
  qSoft: number;
  /** 0..1 the s01 input field fading out */
  field: number;
}

/** the answer sorts land on these words (L0103) */
const LAND_WORDS: [string, string][] = [['L0103', 'writes'], ['L0103', 'back'], ['L0103', 'word'], ['L0103', 'by'], ['L0103', 'word#2']];
export function benchTimes(T: ShotTiming) {
  const qAt = T.word('L0102', 'question') - 0.1;
  const qEnd = T.wordEnd('L0102', 'box');
  return { qAt, qEnd, lands: LAND_WORDS.map(([l, w]) => T.word(l, w) + 0.02), answerAt: T.word('L0103', 'writes') };
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const sm = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const q2 = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
/** a sort's flight: up out of the case BEHIND the stick (a lower plane), then a drop into its slot from above */
const RISE_UP = 3 / 12;
const DROP = 2 / 12;
const FLIGHT = RISE_UP + DROP;
const APEX = 56;

/** the state at the end of ch01-s02 (everything set, the ghost slot waiting) */
export const BENCH_FINAL: BenchState = { qU: 1, sent: 1, aStick: 1, lands: [-5, -4, -3, -2, -1], t: 0, qSoft: 1, field: 0 };

/** the keyboard deck's far edge (L5 world): at the opening camera it meets the lid's lower bezel, and the desk's
 *  front edge (DESK_Y) is a rim-lit lip along the frame's bottom; the push carries both down out of frame */
const DECK_Y = 744;
const DESK_Y = 866;

function roundRect(p: Path2D, x: number, y: number, w: number, h: number, r: number) {
  p.moveTo(x + r, y);
  p.arcTo(x + w, y, x + w, y + h, r);
  p.arcTo(x + w, y + h, x, y + h, r);
  p.arcTo(x, y + h, x, y, r);
  p.arcTo(x, y, x + w, y, r);
  p.closePath();
}

/** the stick's back wall (drawn behind the sorts): a low plate of dark, grained wood */
function stickBack(c: C, x: number, y: number, w: number, h: number, env: PaintEnv) {
  const top = y - h * 0.62;
  c.fillStyle = withAlpha(mixLab(env.fill('ink'), env.mood.set, 0.3), 0.8);
  c.fillRect(x + 16, top, w - 16, y - top);
  grain(c, x + 16, top, w - 16, y - top, env, 0.1, 5);
  c.fillStyle = withAlpha(env.mood.rim, 0.22);
  c.fillRect(x + 16, top, w - 16, 1.2);
}
/** faint wood grain: long wavering hairlines a step lighter than the body */
function grain(c: C, x: number, y: number, w: number, h: number, env: PaintEnv, a: number, step: number) {
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.strokeStyle = withAlpha(mixLab(env.mood.set, env.mood.rim, 0.25), a);
  c.lineWidth = 0.8;
  for (let gy = y + 2, i = 0; gy < y + h; gy += step, i++) {
    c.beginPath();
    for (let gx = x; gx <= x + w; gx += 24) {
      const yy = gy + Math.sin(gx * 0.021 + i * 1.7) * 1.1 + (hash1(i * 31 + Math.round(gx), 17) - 0.5) * 0.7;
      if (gx === x) c.moveTo(gx, yy);
      else c.lineTo(gx, yy);
    }
    c.stroke();
  }
  c.restore();
}
function stickRail(c: C, x: number, y: number, w: number, h: number, env: PaintEnv) {
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.fillRect(x, y, w, 13);
  c.fillRect(x, y - h - 10, 16, h + 23);
  c.fillRect(x - 9, y - h - 17, 34, 10);
  c.fillRect(x + w - 7, y - h * 0.42, 7, h * 0.42 + 2);
  grain(c, x, y, w, 13, env, 0.16, 3.2);
  grain(c, x, y - h - 10, 16, h + 23, env, 0.12, 4);
  // rim highlights on the top edges catching the field's light
  c.fillStyle = withAlpha(env.mood.rim, 0.55);
  c.fillRect(x + 16, y, w - 16, 1.4);
  c.fillRect(x - 9, y - h - 17, 34, 1.4);
  c.fillRect(x + w - 7, y - h * 0.42, 7, 1.4);
}

/** the job case as a shallow TYPE TRAY (a back plane, baked and blurred): NINE equal compartments in one regular
 *  grid, each a dark recess between upright dividers whose tops carry a 1 px rim, and in every recess the same
 *  tidy block of sorts seen end-on: uniform small squares on a fixed pitch, two ranks, no gaps. It reads at a
 *  glance as a printer's case of waiting type, never as glyph noise or a barcode. */
function typeCase(c: C, env: PaintEnv, x: number, y: number, w: number, h: number) {
  const m = env.mood;
  const ink = env.fill('ink');
  const railY = y + 34;
  const DEPTH = 28;
  const N = 9;
  const inner = w - 80;
  const cw = inner / N;
  const x0 = x + 40;
  const top = railY - DEPTH;
  // the recesses (a step darker than the field)
  c.fillStyle = withAlpha(mixLab(m.set, ink, 0.82), 0.94);
  c.fillRect(x0 - 6, top - 4, inner + 12, DEPTH + 4);
  // in each recess: the same block of sorts, two ranks of uniform squares on one pitch
  const SQ = 7, GAP = 3;
  const body = mixLab(mixLab(m.set, ink, 0.25), m.rim, 0.08);
  const cap = withAlpha(m.rim, 0.42);
  for (let k = 0; k < N; k++) {
    const cx0 = x0 + k * cw + 9, cx1 = x0 + (k + 1) * cw - 9;
    const cols = Math.floor((cx1 - cx0 + GAP) / (SQ + GAP));
    const ox = cx0 + (cx1 - cx0 - (cols * (SQ + GAP) - GAP)) / 2;
    for (let r = 0; r < 2; r++) {
      const sy = top + 6 + r * (SQ + GAP);
      for (let j = 0; j < cols; j++) {
        const sx = ox + j * (SQ + GAP);
        c.fillStyle = body;
        c.fillRect(sx, sy, SQ, SQ);
        c.fillStyle = cap;
        c.fillRect(sx, sy, SQ, 1);
      }
    }
  }
  // the dividers: upright partitions of one width, their tops lit with a 1 px rim
  for (let k = 0; k <= N; k++) {
    const px = x0 + k * cw - 2;
    c.fillStyle = mixLab(m.set, ink, 0.55);
    c.fillRect(px - 1, top - 8, 5, DEPTH + 8);
    c.fillStyle = withAlpha(m.rim, 0.65);
    c.fillRect(px - 1, top - 8, 5, 1);
  }
  // the tray's front: a lip of light falling to ink
  const lip = mixLab(m.set, m.haze, 0.14);
  const deep = mixLab(m.set, ink, 0.75);
  const bg = c.createLinearGradient(0, railY, 0, y + h);
  bg.addColorStop(0, lip);
  bg.addColorStop(0.3, mixLab(lip, deep, 0.6));
  bg.addColorStop(1, deep);
  c.fillStyle = bg;
  c.fillRect(x, railY, w, y + h - railY);
  c.fillStyle = withAlpha(m.rim, 0.4);
  c.fillRect(x, railY, w, 1.6);
  // the nearer tiers of the case below the rail (the case seen a little from above): two more rows of the same
  // compartments, each a step darker and lower in contrast, so the band below the sticks is the case itself
  for (let tier = 1; tier <= 2; tier++) {
    const ty = railY + 14 + (tier - 1) * 46;
    const fade = tier === 1 ? 0.75 : 0.5;
    c.fillStyle = withAlpha(mixLab(m.set, ink, 0.86), 0.9);
    c.fillRect(x0 - 6, ty, inner + 12, 36);
    for (let k = 0; k < N; k++) {
      const cx0 = x0 + k * cw + 9, cx1 = x0 + (k + 1) * cw - 9;
      const cols = Math.floor((cx1 - cx0 + GAP) / (SQ + GAP));
      const ox = cx0 + (cx1 - cx0 - (cols * (SQ + GAP) - GAP)) / 2;
      for (let r = 0; r < 2; r++)
        for (let j = 0; j < cols; j++) {
          const sx = ox + j * (SQ + GAP), sy = ty + 8 + r * (SQ + GAP);
          c.fillStyle = withAlpha(body, fade);
          c.fillRect(sx, sy, SQ, SQ);
          c.fillStyle = withAlpha(m.rim, 0.3 * fade);
          c.fillRect(sx, sy, SQ, 1);
        }
    }
    for (let k = 0; k <= N; k++) {
      const px = x0 + k * cw - 2;
      c.fillStyle = withAlpha(mixLab(m.set, ink, 0.55), fade);
      c.fillRect(px - 1, ty - 2, 5, 40);
      c.fillStyle = withAlpha(m.rim, 0.45 * fade);
      c.fillRect(px - 1, ty - 2, 5, 1);
    }
    c.fillStyle = withAlpha(m.rim, 0.3 * fade);
    c.fillRect(x0 - 6, ty - 2, inner + 12, 1);
  }
  // the case's back rail, one lit hairline across the top of the dividers
  c.fillStyle = mixLab(m.set, ink, 0.55);
  c.fillRect(x0 - 6, top - 10, inner + 12, 3);
  c.fillStyle = withAlpha(m.rim, 0.45);
  c.fillRect(x0 - 6, top - 10, inner + 12, 1);
}

// ---------------------------------------------------------------- the sorts: cut metal type, not UI chips
const SORT_FONT = (size: number) => `500 ${size}px ${MFONT.serif}`;
/** one cast sort, top-left (x, y), w x h, read as type METAL: a body a step lighter than the stick, a darker
 *  shoulder band under a 1 px lit top rim, a cut nick (a dark groove with a lit lower lip) near the foot, a
 *  dark right flank, the word on its face in serif. No shadow, no halo, no bullet: spaces are spacer slugs. */
function drawSort01(c: C, x: number, y: number, w: number, h: number, text: string, size: number, lit: number, env: PaintEnv) {
  const m = env.mood;
  const ink = env.fill('ink');
  const body = text.replace(/^ /, '');
  const metal = mixLab(mixLab(ink, m.set, 0.55), m.rim, 0.08);
  c.fillStyle = metal;
  c.fillRect(x, y, w, h);
  // a faint vertical sheen on the cast face (left third catches the screen)
  const sh = c.createLinearGradient(x, 0, x + w, 0);
  sh.addColorStop(0, withAlpha(m.rim, 0.1));
  sh.addColorStop(0.4, withAlpha(m.rim, 0.03));
  sh.addColorStop(1, withAlpha(ink, 0.18));
  c.fillStyle = sh;
  c.fillRect(x, y, w, h);
  // the shoulder: a darker band under the top rim
  c.fillStyle = mixLab(ink, m.set, 0.22);
  c.fillRect(x, y + 1, w, h * 0.1);
  c.fillStyle = withAlpha(lit > 0.5 ? mixLab(m.rim, m.core, lit - 0.5) : m.rim, 0.7 + 0.3 * lit);
  c.fillRect(x, y, w, 1);
  // the nick: a dark groove with a lit lower lip, near the foot
  const ny = y + h * 0.72;
  c.fillStyle = ink;
  c.fillRect(x, ny, w, 3);
  c.fillStyle = withAlpha(m.rim, 0.45);
  c.fillRect(x, ny + 3, w, 1);
  // the foot and the dark right flank (the sort's side seen edge-on), a hairline left edge
  c.fillStyle = mixLab(ink, m.set, 0.2);
  c.fillRect(x, y + h * 0.88, w, h * 0.12);
  c.fillStyle = withAlpha(ink, 0.8);
  c.fillRect(x + w - 1.6, y, 1.6, h);
  c.fillStyle = withAlpha(m.rim, 0.22);
  c.fillRect(x, y + 1, 1, h * 0.86);
  // the face's word
  c.save();
  c.font = SORT_FONT(size);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.fillStyle = mixLab(mixLab(m.rim, m.set, 0.1), m.core, Math.min(1, 0.25 + lit));
  c.fillText(body, x + w / 2, y + h * 0.38 + size * 0.34);
  c.restore();
}
/** a spacer (a quad): a thin blank slug, shorter than type height so it never prints, between two words */
const SPACER_W = 9;
function drawSpacer(c: C, x: number, y: number, h: number, env: PaintEnv) {
  const m = env.mood;
  const ink = env.fill('ink');
  const top = y + h * 0.3;
  c.fillStyle = mixLab(ink, m.set, 0.3);
  c.fillRect(x, top, SPACER_W, y + h - top);
  c.fillStyle = withAlpha(m.rim, 0.4);
  c.fillRect(x, top, SPACER_W, 1);
  c.fillStyle = withAlpha(ink, 0.8);
  c.fillRect(x + SPACER_W - 1.2, top, 1.2, y + h - top);
}
/** a line's layout: each word's slot, with a spacer slug before every word that follows a space; punctuation
 *  ('?') is set tight against the word before it */
function layoutLine(c: C, tokens: string[], x0: number, size: number) {
  const out: { x: number; w: number; sp: number | null }[] = [];
  let x = x0;
  tokens.forEach((tok, i) => {
    let sp: number | null = null;
    if (i > 0 && tok.startsWith(' ')) {
      sp = x;
      x += SPACER_W + 1;
    }
    const w = sortW(c, tok.replace(/^ /, ''), size);
    out.push({ x, w, sp });
    x += w + 1;
  });
  return out;
}
/** a sort's width (the kit's measure, so the lines keep their layout) */
const sortW = (c: C, tok: string, size: number) => slugWidth(c, tok, size);
/** the waiting slot: an EMPTY place in the stick that glows faintly from within (no outline), its floor lit */
function glowSlot(c: C, x: number, y: number, w: number, h: number, k: number, env: PaintEnv) {
  if (k <= 0.01) return;
  const m = env.mood;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, y + h, 0, y);
  g.addColorStop(0, withAlpha(mixLab(m.halo, m.core, 0.5), 0.3 * k));
  g.addColorStop(0.5, withAlpha(m.halo, 0.12 * k));
  g.addColorStop(1, withAlpha(m.halo, 0));
  c.fillStyle = g;
  c.fillRect(x + 2, y, w - 4, h);
  c.fillStyle = withAlpha(m.core, 0.6 * k);
  c.fillRect(x + 3, y + h - 1.2, w - 6, 1.2);
  c.restore();
}

// ---------------------------------------------------------------- the person: a head-back and shoulder (L5)
/** the over-the-shoulder edge at frame left, authored in SCREEN px at the lock camera: the back of the head
 *  (messy hair) and the shoulder, about 9% of frame width; no face, so a half-profile is never cropped */
const SHOULDER: [number, number][] = [
  [-60, 720], [-60, 150], [-20, 148], [8, 140], [30, 146], [52, 142], [74, 156], [92, 172], [104, 196], [112, 226],
  [114, 258], [108, 290], [98, 318], [92, 340], [96, 372], [112, 404], [134, 440], [148, 500], [156, 600], [160, 720],
];
function shoulderEdge(f: Frame, lock: Camera3, drift = { x: 0, s: 1 }) {
  f.layer('L5', (c, env) => {
    const m = env.mood;
    const pts = SHOULDER.map(([x, y]) => toLayer(LAYERS.L5, lock, x * drift.s + drift.x, 720 - (720 - y) * drift.s));
    const path = new Path2D();
    pts.forEach((p, i) => (i ? path.lineTo(p.x, p.y) : path.moveTo(p.x, p.y)));
    path.closePath();
    c.save();
    c.filter = `blur(${(3 * f.pxScale).toFixed(1)}px)`;
    c.fillStyle = mixLab(env.fill('ink'), m.fg, 0.4);
    c.fill(path);
    c.restore();
    // the screen's light on the contour facing it: a soft lit edge on the hair and the shoulder line
    c.save();
    c.clip(path);
    c.filter = `blur(${(2.4 * f.pxScale).toFixed(1)}px)`;
    c.strokeStyle = withAlpha(mixLab(m.rim, m.halo, 0.4), 0.45);
    c.lineWidth = 5;
    c.beginPath();
    pts.slice(4, -1).forEach((p, i) => (i ? c.lineTo(p.x + 1.5, p.y) : c.moveTo(p.x + 1.5, p.y)));
    c.stroke();
    c.restore();
  });
}

export interface BenchOpts {
  key: string;
  cams: Camera3[];
  state: BenchState;
  /** person pose loop running (typing) */
  typing?: boolean;
  /** overall brightness of the screen (s03 dims it as it leaves) */
  glow?: number;
  /** draw the near plane (deck lip, person) */
  near?: boolean;
  /** the camera at which the shoulder edge sits at frame left (default the current camera: screen-locked) */
  shoulderLock?: Camera3;
  /** a small screen-px drift of the shoulder edge (negative = out past frame left) and its growth (1 = none) */
  shoulderDrift?: { x: number; s: number };
}

export function bench(f: Frame, o: BenchOpts) {
  const S = BENCH.screen;
  const st = o.state;
  const g = o.glow ?? 1;
  const tq = q2(st.t);
  f.backlight({ sunX: 1240, sunY: 300, sunRadius: 300, intensity: 0.25 });
  // L2: the room's dark wall with a sliver of the night window at frame right (past the lid)
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, o.cams, 60);
    f.cached(`${o.key}/bench2/L2/${env.mood.id}/${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.w)},${Math.round(r.h)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      const m = env.mood;
      // far towers seen through the glass (behind the wall: drawn first, the wall covers them)
      for (let i = 0; i < 12; i++) {
        const x = 1196 + i * 44, h = 150 + hash1(i, 3) * 190;
        cc.fillStyle = mixLab(env.fill('set'), m.sky[1], 0.45);
        cc.fillRect(x, 560 - h, 36, h);
        if (hash1(i, 4) > 0.35) {
          cc.fillStyle = mixLab(m.core, m.halo, 0.3);
          cc.fillRect(x + 8 + hash1(i, 5) * 20, 560 - h + 20 + hash1(i, 6) * 80, 3, 4);
        }
      }
      cc.fillStyle = mixLab(env.fill('set'), m.fg, 0.7);
      cc.beginPath();
      cc.rect(r.x, r.y, r.w, r.h);
      cc.rect(1190, -40, 520, 600);
      cc.fill('evenodd');
      cc.fillStyle = env.fill('ink');
      cc.fillRect(1290, -40, 10, 600);
      cc.fillRect(1190, 160, 520, 10);
      cc.fillRect(1190, 360, 520, 10);
      cc.fillRect(1176, -40, 14, 610);
      cc.fillRect(1170, 560, 560, 14);
      cc.strokeStyle = withAlpha(m.rim, 0.3);
      cc.lineWidth = 1;
      cc.beginPath();
      cc.moveTo(1290, -40);
      cc.lineTo(1290, 560);
      cc.stroke();
      // the desk's far top, either side of the lid: a dark plane with a hairline back edge
      const dt = cc.createLinearGradient(0, 590, 0, 760);
      dt.addColorStop(0, mixLab(env.fill('set'), m.fg, 0.45));
      dt.addColorStop(1, mixLab(env.fill('ink'), m.fg, 0.3));
      cc.fillStyle = dt;
      cc.fillRect(r.x, 590, r.w, r.y + r.h - 590);
      cc.fillStyle = withAlpha(m.rim, 0.22);
      cc.fillRect(r.x, 590, r.w, 1.2);
    })(c, r.x, r.y);
  });
  f.fog({ yCenter: 520, height: 260, alpha: 0.1, drift: -6 });

  // L4: the screen field and the bench inside it
  f.layer('L4', (c, env) => {
    const m = env.mood;
    const pad = 24;
    // the field: a dark ground glowing at the centre, falling to ~40% in the corners (baked)
    const drawField = f.cached(`${o.key}/bench5/field/${m.id}`, S.w + pad * 2, S.h + pad * 2, (cc) => {
      const x0 = pad, y0 = pad;
      const base = cc.createLinearGradient(0, y0, 0, y0 + S.h);
      base.addColorStop(0, mixLab(m.sky[0], m.set, 0.35));
      base.addColorStop(0.55, mixLab(m.sky[1], m.set, 0.25));
      base.addColorStop(1, mixLab(m.sky[0], m.set, 0.45));
      cc.fillStyle = base;
      cc.fillRect(x0, y0, S.w, S.h);
      // the glow sits low-centre (over the sticks), never a hot spot at the top: the field falls off to the
      // corners about 15 L* darker than its centre
      const cx = x0 + S.w * 0.46, cy = y0 + S.h * 0.6;
      const glow = cc.createRadialGradient(cx, cy, 20, cx, cy, S.w * 0.58);
      glow.addColorStop(0, withAlpha(mixLab(m.sky[2], m.halo, 0.3), 0.8));
      glow.addColorStop(0.5, withAlpha(mixLab(m.sky[2], m.haze, 0.4), 0.4));
      glow.addColorStop(1, withAlpha(m.sky[1], 0));
      cc.fillStyle = glow;
      cc.fillRect(x0, y0, S.w, S.h);
      const v = cc.createRadialGradient(cx, cy, S.w * 0.2, cx, cy, S.w * 0.66);
      v.addColorStop(0, withAlpha(m.fg, 0));
      v.addColorStop(0.55, withAlpha(m.fg, 0.3));
      v.addColorStop(0.85, withAlpha(m.fg, 0.62));
      v.addColorStop(1, withAlpha(m.fg, 0.86));
      cc.fillStyle = v;
      cc.fillRect(x0, y0, S.w, S.h);
      // a slow mottle so the field is lit glass, not a flat UI panel
      for (let i = 0; i < 70; i++) {
        const px = x0 + hash1(i, 41) * S.w, py = y0 + hash1(i, 42) * S.h, r = 30 + hash1(i, 43) * 90;
        const gg = cc.createRadialGradient(px, py, 0, px, py, r);
        const dark = hash1(i, 44) > 0.5;
        gg.addColorStop(0, withAlpha(dark ? m.fg : m.haze, 0.05));
        gg.addColorStop(1, withAlpha(dark ? m.fg : m.haze, 0));
        cc.fillStyle = gg;
        cc.fillRect(px - r, py - r, r * 2, r * 2);
      }
      // depth: a vertical haze gradient (dark crown, a band of haze lying behind the sticks, dark again over
      // the case) and the field falling a further ~18% toward the bezel corners
      const vh = cc.createLinearGradient(0, y0, 0, y0 + S.h);
      vh.addColorStop(0, withAlpha(m.fg, 0.34));
      vh.addColorStop(0.3, withAlpha(m.fg, 0.04));
      vh.addColorStop(0.5, withAlpha(m.haze, 0.1));
      vh.addColorStop(0.7, withAlpha(m.haze, 0.06));
      vh.addColorStop(1, withAlpha(m.fg, 0.3));
      cc.fillStyle = vh;
      cc.fillRect(x0, y0, S.w, S.h);
      const cv = cc.createRadialGradient(cx, cy, S.w * 0.26, cx, cy, S.w * 0.7);
      cv.addColorStop(0, withAlpha(m.fg, 0));
      cv.addColorStop(0.5, withAlpha(m.fg, 0.18));
      cv.addColorStop(0.8, withAlpha(m.fg, 0.45));
      cv.addColorStop(1, withAlpha(m.fg, 0.62));
      cc.fillStyle = cv;
      cc.fillRect(x0, y0, S.w, S.h);
      // the bench plane under the answer stick: a darker band (~L* 20) the stick and its sorts stand on, so the
      // cast metal and the lit faces carry contrast against it
      const by0 = y0 + (BENCH.aY - BENCH.aSize * 1.9 - 40 - S.y);
      const by1 = y0 + (BENCH.aY + 60 - S.y);
      const bp = cc.createLinearGradient(0, by0, 0, by1);
      bp.addColorStop(0, withAlpha(m.fg, 0));
      bp.addColorStop(0.35, withAlpha(m.fg, 0.38));
      bp.addColorStop(0.75, withAlpha(m.fg, 0.55));
      bp.addColorStop(1, withAlpha(m.fg, 0.3));
      cc.fillStyle = bp;
      cc.fillRect(x0, by0, S.w, by1 - by0);
    }, { blur: 3 });
    c.save();
    c.globalAlpha *= g;
    drawField(c, S.x - pad, S.y - pad);
    // the bench lamp's falloff: a low-chroma warm pool just above the sticks, cooling toward the field's edges
    const lx = BENCH_LAMP.x, ly = BENCH_LAMP.y;
    const warm = mixLab('#e2c08e', m.set, 0.35);
    const wp = c.createRadialGradient(lx, ly, 10, lx, ly, 460);
    wp.addColorStop(0, withAlpha(warm, 0.11));
    wp.addColorStop(0.35, withAlpha(mixLab(warm, m.halo, 0.5), 0.06));
    wp.addColorStop(1, withAlpha(m.halo, 0));
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = wp;
    c.fillRect(S.x, S.y, S.w, S.h);
    c.restore();
    c.save();
    const clip = new Path2D();
    clip.rect(S.x, S.y, S.w, S.h);
    c.clip(clip);
    // dust hanging in the screen's light (on ones, drifting slowly)
    dustMotes(c, { area: { x: S.x + 20, y: S.y + 30, w: S.w - 40, h: S.h - 120 }, count: 46, drift: { x: -3, y: -1.2 }, size: 1.2, brightness: 0.55 * g, color: m.rim, salt: 23 }, env);
    // the upper field: lamplit haze drifting slowly up and left through the screen's light (two soft billows on
    // a slow loop) and a finer, dimmer dust, so the space above the sticks is air, not an empty fill
    {
      c.save();
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const ph = st.t * (0.035 + 0.012 * i) + i * 0.37;
        const u = ph - Math.floor(ph);
        const hx = S.x + S.w * (0.9 - 0.75 * u), hy = S.y + 70 + 120 * hash1(i, 61) - 40 * u;
        const hr = 150 + 70 * hash1(i, 62);
        const a = 0.07 * Math.sin(Math.PI * u) * g;
        const hg = c.createRadialGradient(hx, hy, 0, hx, hy, hr);
        hg.addColorStop(0, withAlpha(mixLab(m.haze, m.halo, 0.4), a));
        hg.addColorStop(1, withAlpha(m.haze, 0));
        c.fillStyle = hg;
        c.fillRect(hx - hr, hy - hr * 0.6, hr * 2, hr * 1.2);
      }
      c.restore();
      dustMotes(c, { area: { x: S.x + 30, y: S.y + 16, w: S.w - 60, h: 200 }, count: 30, drift: { x: -2, y: -0.8 }, size: 0.9, brightness: 0.4 * g, color: m.rim, salt: 29 }, env);
    }

    // the question line: deliberately soft (out of focus, ~70%), softer still once the answer begins
    const qSlots = layoutLine(c, QUESTION, BENCH.qX + 22, BENCH.qSize);
    const qh = BENCH.qSize * 1.9;
    const qy = BENCH.qY0 + (BENCH.qY1 - BENCH.qY0) * sm(st.sent);
    const qEndX = qSlots[qSlots.length - 1].x + qSlots[qSlots.length - 1].w + 24;
    // the stick is on the bench (empty) from the first frame
    const qStickA = g;
    if (qStickA > 0.01) {
      c.save();
      // soft from its very first sort (about 70%: the act is felt, the words barely read), a little softer on L0103
      c.filter = `blur(${((3.4 + 0.8 * st.qSoft) * f.pxScale).toFixed(2)}px)`;
      c.globalAlpha *= qStickA * (0.66 - 0.12 * st.qSoft);
      stickBack(c, BENCH.qX, qy, qEndX - BENCH.qX, qh, env);
      stickRail(c, BENCH.qX, qy, qEndX - BENCH.qX, qh, env);
      QUESTION.forEach((tok, i) => {
        const n = QUESTION.length;
        const a = sm(clamp01((st.qU - i / n) * n * 1.4));
        if (a <= 0) return;
        c.save();
        c.globalAlpha *= Math.min(1, a * 1.6);
        const yy = qy - qh + (1 - a) * -46;
        if (qSlots[i].sp != null) drawSpacer(c, qSlots[i].sp!, yy, qh, env);
        drawSort01(c, qSlots[i].x, yy, qSlots[i].w, qh, tok, BENCH.qSize, 0, env);
        c.restore();
      });
      // the question's waiting slot: the next sort's place, until the question is set
      const qn = Math.min(QUESTION.length, Math.floor(st.qU * QUESTION.length + 1e-6));
      if (qn < QUESTION.length) {
        const on = Math.floor(st.t * 2 + 1e-6) % 2 === 0 ? 1 : 0.4;
        glowSlot(c, qSlots[qn].x, qy - qh, qSlots[qn].w, qh, on * 1.3, env);
      }
      c.restore();
    }

    // the answer stick: one sort per word, rising from the case beneath, 3 px overshoot, settle
    const ah = BENCH.aSize * 1.9;
    const aSlots = layoutLine(c, ANSWER, BENCH.aX + 22, BENCH.aSize);
    const lastA = aSlots[aSlots.length - 1];
    const fullW = lastA.x + lastA.w + 86 - BENCH.aX;
    // the type case: a darker, blurred paper-cut plane of compartments below and behind the answer stick, a few
    // sorts standing in them (the sorts rise out of it)
    {
      const top = BENCH.aY + 22;
      const drawCase = f.cached(`${o.key}/bench7/case/${m.id}`, S.w + 40, S.y + S.h - top + 30, (cc) => {
        cc.translate(-(S.x - 20), -top);
        typeCase(cc, env, S.x - 20, top, S.w + 40, S.y + S.h - top + 30);
      }, { blur: 2.4 });
      c.save();
      c.globalAlpha *= g;
      drawCase(c, S.x - 20, top);
      c.restore();
    }
    // each sort's flight, from the locked landing time: up out of the case behind the stick, then down into its slot
    const flight = aSlots.map((sl, i) => {
      const land = st.lands[i];
      // on twos, phased to this sort's own landing so the drop completes exactly on its word
      const k = Math.floor((st.t - (land - FLIGHT)) * 12 + 1e-6) / 12;
      return { sl, i, land, k };
    });
    const restY = BENCH.aY - ah;
    const drawSort = (sl: { x: number; w: number; sp: number | null }, i: number, y: number, lit: number, alpha: number, blur: number) => {
      c.save();
      c.globalAlpha *= g * alpha;
      c.filter = `blur(${(blur * f.pxScale).toFixed(2)}px)`;
      if (sl.sp != null) drawSpacer(c, sl.sp, y, ah, env);
      drawSort01(c, sl.x, y, sl.w, ah, ANSWER[i], BENCH.aSize, lit, env);
      c.restore();
    };
    // 1) rising: behind the stick's back wall, out of the case's top edge (a lower, softer plane)
    for (const F of flight) {
      if (F.k < 0 || F.k >= RISE_UP) continue;
      const u = 1 - Math.pow(1 - F.k / RISE_UP, 2);
      const y0 = BENCH.aY + 26;
      const y = y0 + (restY - APEX - y0) * u;
      // emerges over the top edge of the stick's back wall (never cut by the rail)
      c.save();
      c.beginPath();
      const cx0 = (F.sl.sp ?? F.sl.x) - 6;
      c.rect(cx0, S.y, F.sl.x + F.sl.w + 6 - cx0, BENCH.aY - ah * 0.62 - S.y);
      c.clip();
      drawSort(F.sl, F.i, y, 0.2, 0.7, 1.6);
      c.restore();
    }
    let rising = 0;
    for (const F of flight) if (F.k >= 0) rising = F.i + 1;
    if (st.aStick > 0.01) {
      c.save();
      c.globalAlpha *= st.aStick * g;
      stickBack(c, BENCH.aX, BENCH.aY, fullW, ah, env);
      stickRail(c, BENCH.aX, BENCH.aY, fullW, ah, env);
      c.restore();
    }
    // 2) dropping into the slot from above (in front of the stick), then a tiny bounce and settle on twos
    for (const F of flight) {
      if (F.k < RISE_UP) continue;
      let y: number;
      if (F.k < FLIGHT) {
        const u = (F.k - RISE_UP) / DROP;
        y = restY - APEX * (1 - u * u);
      } else {
        const after = F.k - FLIGHT;
        y = restY + (after < 1 / 12 ? -3 : after < 2 / 12 ? -1 : 0);
      }
      const lit = st.t >= F.land ? Math.max(0.25, 1 - (st.t - F.land) / 0.8) : 0.5;
      drawSort(F.sl, F.i, y, lit, 0.92, 0.9);
    }
    // the waiting slot: the NEXT sort's place and width, glowing faintly from within on the cursor's rhythm
    if (st.aStick > 0.01) {
      const nx = rising < aSlots.length ? aSlots[rising] : { x: lastA.x + lastA.w + SPACER_W + 2, w: 52 };
      // blinking on the cursor's rhythm while the answer is being set; once the last sort has seated, the
      // waiting slot holds steady (lit) to the cut
      const set = st.t >= st.lands[st.lands.length - 1] + 2 / 12;
      const on = set ? 1 : Math.floor(st.t * 2 + 1e-6) % 2 === 0 ? 1 : 0.4;
      glowSlot(c, nx.x, BENCH.aY - ah, nx.w, ah, on * st.aStick * g * 1.3, env);
    }
    // a breath of dust as each sort lands: a few soft 2-3 px motes (alpha ~0.4) lifting off the stick's floor
    // either side of the sort, drifting up and fading within 0.4 s
    aSlots.forEach((sl, i) => {
      const pk = st.t - st.lands[i];
      if (pk <= 0 || pk >= 0.4) return;
      const life = 1 - pk / 0.4;
      c.save();
      c.filter = `blur(${(0.9 * f.pxScale).toFixed(2)}px)`;
      for (let p = 0; p < 7; p++) {
        const side = p % 2 ? 1 : -1;
        const sx = side > 0 ? sl.x + sl.w + 2 : (sl.sp ?? sl.x) - 2;
        const px = sx + side * (3 + hash1(p + i * 31, 5) * 16) * (0.4 + pk * 2.2);
        const py = BENCH.aY - 3 - (8 + hash1(p + i * 31, 6) * 22) * pk * 2.4;
        const r = 1 + hash1(p + i * 7, 8) * 0.6; // 2-3 px across at 1080p
        c.fillStyle = withAlpha(mixLab(m.rim, m.halo, 0.4), (0.35 + 0.1 * hash1(p + i, 9)) * life * g);
        c.beginPath();
        c.arc(px, py, r, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    });
    c.restore();
  });
  f.rim({ x: 0.2, y: -1 });
  // the lid: a dark bezel with rounded corners around the screen, a hairline of window light on its outer
  // edge, and the screen's light spilling onto its inner edge
  f.layer('L4', (c, env) => {
    const B = BENCH.bezel;
    const CH = BENCH.chin;
    const m = env.mood;
    const lid = new Path2D();
    roundRect(lid, S.x - B, S.y - B, S.w + 2 * B, S.h + B + CH, BENCH.corner);
    lid.rect(S.x, S.y, S.w, S.h);
    c.fillStyle = env.fill('ink');
    c.fill(lid, 'evenodd');
    const outer = new Path2D();
    roundRect(outer, S.x - B + 0.5, S.y - B + 0.5, S.w + 2 * B - 1, S.h + B + CH - 1, BENCH.corner);
    c.strokeStyle = withAlpha(m.rim, 0.28);
    c.lineWidth = 1.2;
    c.stroke(outer);
    // the hinge: the lid's lower edge meets the deck along a seam, two hinge barrels near the ends
    const hy = S.y + S.h + CH;
    c.fillStyle = mixLab(env.fill('ink'), m.set, 0.2);
    c.fillRect(S.x + 40, hy - 1, S.w - 80, 9);
    c.fillStyle = withAlpha(m.rim, 0.34);
    c.fillRect(S.x + 40, hy - 1, S.w - 80, 1);
    c.fillStyle = env.fill('ink');
    for (const hx of [S.x + 40, S.x + S.w - 40 - 84]) {
      c.fillRect(hx, hy - 3, 84, 12);
      c.fillStyle = withAlpha(m.rim, 0.4);
      c.fillRect(hx, hy - 3, 84, 1.2);
      c.fillStyle = env.fill('ink');
    }
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (let i = 1; i <= 5; i++) {
      c.strokeStyle = withAlpha(m.halo, (0.05 * (6 - i)) / 5 * g);
      c.lineWidth = i * 4;
      c.strokeRect(S.x, S.y, S.w, S.h);
    }
    c.restore();
  });
  if (o.near === false) return;
  // L5: the night window REFLECTED in the screen's glass (a faint, blurred grid of panes over the right third,
  // sliding outward against the type as the push goes on: the third depth plane the whole way through)
  f.layer('L5', (c, env) => {
    const m = env.mood;
    const P = (sx: number, sy: number) => toLayer(LAYERS.L5, BENCH_CAMS.end, sx, sy);
    const a = P(1010, 70), b = P(1250, 560);
    const w = b.x - a.x, h = b.y - a.y;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const ref = mixLab(m.haze, m.sky[2], 0.5);
    const cols = 2, rows = 3, bar = w * 0.035;
    for (let i = 0; i < cols; i++)
      for (let j = 0; j < rows; j++) {
        const px = a.x + (w * i) / cols + bar / 2, py = a.y + (h * j) / rows + bar / 2;
        const pw = w / cols - bar, ph = h / rows - bar;
        const gg = c.createLinearGradient(px, py, px + pw, py + ph);
        gg.addColorStop(0, withAlpha(ref, 0.12 * g));
        gg.addColorStop(1, withAlpha(ref, 0.05 * g));
        c.fillStyle = gg;
        c.fillRect(px, py, pw, ph);
      }
    // the mullions themselves: darker bars in the reflection
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = withAlpha(m.fg, 0.16 * g);
    for (let i = 0; i <= cols; i++) c.fillRect(a.x + (w * i) / cols - bar / 2, a.y, bar, h);
    for (let j = 0; j <= rows; j++) c.fillRect(a.x, a.y + (h * j) / rows - bar / 2, w, bar);
    c.restore();
  });
  // L5: the keyboard deck's edge along the bottom and the person's dark head and shoulder edge at frame left
  f.layer('L5', (c, env) => {
    const m = env.mood;
    const ink = mixLab(env.fill('ink'), m.fg, 0.4);
    // the desk top, catching the screen's spill toward its far edge
    const dg = c.createLinearGradient(0, DECK_Y - 20, 0, DESK_Y);
    dg.addColorStop(0, mixLab(ink, m.set, 0.45));
    dg.addColorStop(1, ink);
    c.fillStyle = dg;
    c.fillRect(-900, DECK_Y - 20, 3200, DESK_Y - DECK_Y + 20);
    // the keyboard deck: a foreshortened plate under the lid, faint key rows lit by the screen
    const deck = new Path2D();
    deck.moveTo(40, DECK_Y);
    deck.lineTo(1240, DECK_Y);
    deck.lineTo(1330, DESK_Y - 14);
    deck.lineTo(-50, DESK_Y - 14);
    deck.closePath();
    c.fillStyle = mixLab(ink, m.fg, 0.3);
    c.fill(deck);
    c.save();
    c.clip(deck);
    for (let r = 0; r < 4; r++) {
      const ky = DECK_Y + 12 + r * 22;
      const sp = (ky - DECK_Y) / (DESK_Y - 14 - DECK_Y);
      const x0 = 40 - 90 * sp + 120, x1 = 1240 + 90 * sp - 120;
      c.fillStyle = withAlpha(m.rim, (0.16 - r * 0.03) * g);
      for (let x = x0; x < x1; x += 46 + 4 * sp) c.fillRect(x, ky, 38 + 4 * sp, 1.2);
    }
    c.restore();
    c.fillStyle = withAlpha(m.rim, 0.4 * g);
    c.fillRect(40, DECK_Y - 1, 1200, 2);
    // the desk's front edge: a rim-lit lip, then the dark below it
    c.fillStyle = mixLab(env.fill('ink'), m.fg, 0.2);
    c.fillRect(-900, DESK_Y, 3200, 900);
    c.fillStyle = withAlpha(m.rim, 0.32 * g);
    c.fillRect(-900, DESK_Y, 3200, 1.6);
  });
  shoulderEdge(f, o.shoulderLock ?? f.cam, o.shoulderDrift);
}
