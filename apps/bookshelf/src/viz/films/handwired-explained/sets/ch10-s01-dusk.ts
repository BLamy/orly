/**
 * handwired-explained — ch10 "Strangers with Pencils": the copper line OUT OF DOORS (staging.tagLine, ch10 variant).
 * Shared by ch10-s01 … ch10-s04 so the valley, the hill town, the strangers' threads and their cards never drift.
 *
 * GEOGRAPHY (rest-screen stage px per layer):
 *   L0  duskRose backlight, the sun low in the valley between the two hills (sunX ≈ 470).
 *   L1  two far misty ridges, pale, seen only through the valley.
 *   L2  the hill town (skyline style 'bayArea' built by hand so its windows are addressable: gabled row houses with
 *       bay windows on terraces, no landmarks, no lettering): a low hill at the left, a steep hill climbing to the top
 *       of frame at the right; about 35 % of the windows lit. FOUR stranger windows (STRANGERS[*].win), one per card.
 *   fog A, L3 the near meadow ridge with a far fence line (and, ch10-s04 only, the lab's closed ledger on a table).
 *   fog B, L4 the copper line at 48 % (LINE_DY from the canonical 58 %) between two fence stakes, the Lifespan Rule
 *       laid on the fence's top rail, the tags (sets/tagLine), the strangers' threads and their plain white cards.
 *   L5  tall grass at the lower corners (soft). L6 (optional) a near fence stake at the right edge.
 *
 * THE STRANGERS: nobody from Hacker News is drawn. Each card comes down a thin thread paid out from one window of the
 * town and docks ABOVE the line near the tag it is about; the thread then runs on to the line and knots there, and it
 * stays strung for the rest of the chapter. The thread is a straight line from the window (L2, parallax) to its knot on
 * the line (L4); the card's hook rides it at a fixed fraction, so it stays on the thread through every camera move.
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { cam3Interp, toLayer, toScreen } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, cardProbe, textProbe, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { mulberry32 } from '../../../core';
import { LINE, RULE, SLOT_X, TAG, TAGS, drawTag, drawThread, lifeX, lineYAt, lineYFor, tagAnchors, type TagState } from './tagLine';
import { copperOf } from './narratorHands';

type C2 = CanvasRenderingContext2D;
export type Pt = { x: number; y: number };

// ---------------------------------------------------------------- helpers
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const sm = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
export const smr = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
export const seg = (t: number, a: number, b: number) => sm((t - a) / (b - a));
export const segr = (t: number, a: number, b: number) => smr((t - a) / (b - a));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const lerpP = (a: Pt, b: Pt, u: number): Pt => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
export const twos = (t: number) => Math.floor(t * 12 + 1e-6) / 12;
/** a damped swing (radians) released at t0 with amplitude a0, settling to a breath of 0.02 */
export function swingAfter(t: number, t0: number, a0: number, phase = 0) {
  const dt = Math.max(0, t - t0);
  return (0.02 + (a0 - 0.02) * Math.exp(-dt * 1.3)) * Math.sin(dt * 3.1 + phase);
}

/** action-plane scale k centred on (x, y): dolly to k 1.2, lens beyond (a pull back below 1 dollies out) */
export function camK(x: number, y: number, k: number): Camera3 {
  const kd = Math.min(k, 1.2);
  const z = 1000 - 1000 / kd;
  return { x, y, z, lens: Math.max(1, (k * (1000 - z)) / 1000) };
}
export interface CamKey {
  t: number;
  cam: Camera3;
}
/** the camera along keys, smootherstep between each pair, held outside */
export function camAlong(keys: CamKey[], t: number): Camera3 {
  if (t <= keys[0].t) return keys[0].cam;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t < b.t) return cam3Interp(a.cam, b.cam)(smr((t - a.t) / (b.t - a.t)));
  }
  return keys[keys.length - 1].cam;
}

// ---------------------------------------------------------------- the line at 48 %
export const LINE_Y = lineYFor('ch10-s01');
/** offset of the ch10 line from the canonical 58 % line: draw sets/tagLine painters inside c.translate(0, LINE_DY) */
export const LINE_DY = LINE_Y - LINE.y;
export const RULE_Y = RULE.y + LINE_DY;
/** the line's y at x (world, L4) */
export const lineY10 = (x: number) => lineYAt(x) + LINE_DY;
/** a tag's anchors in ch10 world coordinates */
export function anchors10(st: TagState) {
  const a = tagAnchors(st);
  const d = (p: Pt) => ({ x: p.x, y: p.y + LINE_DY });
  return { knot: d(a.knot), eye: d(a.eye), bottom: d(a.bottom), centre: d(a.centre), corner: d(a.corner) };
}
/** where ch10-s01 lays the red pencil down: beside tag 4, its point between tags 3 and 4, leaning up on tag 4's LEFT
 *  edge (ch10-s02 and s03 still show it there) */
export const PENCIL4_REST = (() => {
  const a = anchors10({ id: '4' });
  return { at: { x: a.eye.x - TAG.w * 0.5 - 15, y: a.bottom.y - 4 }, angle: Math.PI * 0.5 + 0.27 };
})();
/** the fence's top rail (the Lifespan Rule lies on it) */
export const RAIL = { x0: 40, x1: 1240, y: RULE_Y + RULE.h + 1, h: 9 } as const;

// ---------------------------------------------------------------- the hill town (L2)
/** the town's ridge in L2 rest px: a low rolling hill at the left, the valley at ~520, a broad hill rising right */
export function ridgeY(x: number): number {
  const left = 204 + 242 * sm((x - 210) / 340);
  const right = 446 - 300 * sm((x - 470) / 560);
  const k = sm((x - 470) / 110);
  const base = left * (1 - k) + right * k;
  return base + 9 * Math.sin(x * 0.0071 + 1.2) + 5 * Math.sin(x * 0.0193 + 0.4) + 2 * Math.sin(x * 0.061 + 2.2);
}
/** the second, farther ridge of the town (more haze, fewer and dimmer lights): it peeks over the near hill's
 *  shoulders and leaves the valley open to the low sun */
export function backRidgeY(x: number): number {
  const bell = (u: number) => Math.exp(-u * u);
  return ridgeY(x) - 74 * bell((x - 700) / 140) - 50 * bell((x - 320) / 120) - 18 + 6 * Math.sin(x * 0.031 + 0.8);
}
const TOWN = { x0: -520, x1: 1820, bottom: 640 } as const;

interface Win {
  x: number;
  y: number;
  w: number;
  h: number;
  row: number;
  g: number;
  back: boolean;
}
interface Town {
  hill: Path2D;
  roofs: Path2D;
  backHill: Path2D;
  backRoofs: Path2D;
  cuts: Path2D;
  wins: Win[];
}
let townMemo: Town | null = null;
/** a crest of houses, trees and the odd taller block along a ridge function (true silhouettes against the sky) */
function crest(p: Path2D, R: () => number, ridge: (x: number) => number, x0: number, x1: number, wins: Win[], back: boolean) {
  let x = x0 + R() * 10;
  while (x < x1) {
    const w = 8 + R() * 7;
    const gy = ridge(x + w / 2) + 3;
    const slope = Math.abs(ridge(x + w) - ridge(x)) / w;
    // neighbourhoods come and go along the crest; steep pitches carry trees, not houses
    const dens = 0.55 + 0.45 * Math.sin(x * 0.0093 + (back ? 2.1 : 0.7));
    const roll = R();
    if (slope > 0.55 || roll > dens) {
      if (R() < 0.45) {
        const r = 4 + R() * 5;
        p.moveTo(x + r * 2, gy - r * 0.9);
        p.arc(x + r, gy - r * 0.9, r, 0, Math.PI * 2);
        p.rect(x + r - 0.7, gy - r * 0.3, 1.4, r * 0.6);
      }
      x += w * (0.7 + R() * 0.9);
      continue;
    }
    const hh = 9 + R() * 7 + (R() < 0.07 ? 12 + R() * 10 : 0);
    const gy2 = Math.max(ridge(x), ridge(x + w)) + 3;
    if (R() < 0.62) {
      p.moveTo(x, gy2 + 2);
      p.lineTo(x, gy - hh);
      p.lineTo(x + w / 2, gy - hh - w * 0.5);
      p.lineTo(x + w, gy - hh);
      p.lineTo(x + w, gy2 + 2);
      p.closePath();
    } else {
      p.rect(x, gy - hh, w, gy2 - gy + hh + 2);
      p.rect(x - 0.7, gy - hh - 1.4, w + 1.4, 1.6);
    }
    if (R() < 0.42) wins.push({ x: x + w * 0.28, y: gy - hh * 0.62, w: w * 0.44, h: 2.4, row: 0, g: Math.floor(R() * 8), back });
    x += w + (R() < 0.15 ? 2 + R() * 5 : 0.5);
  }
}
function town(): Town {
  if (townMemo) return townMemo;
  const R = mulberry32(1043);
  const hillPath = (ridge: (x: number) => number) => {
    const h = new Path2D();
    h.moveTo(TOWN.x0, 900);
    for (let x = TOWN.x0; x <= TOWN.x1; x += 5) h.lineTo(x, ridge(x) + 4);
    h.lineTo(TOWN.x1, 900);
    h.closePath();
    return h;
  };
  const hill = hillPath(ridgeY);
  const backHill = hillPath(backRidgeY);
  const roofs = new Path2D();
  const backRoofs = new Path2D();
  const cuts = new Path2D();
  const wins: Win[] = [];
  crest(roofs, R, ridgeY, TOWN.x0, TOWN.x1, wins, false);
  crest(backRoofs, R, backRidgeY, TOWN.x0, TOWN.x1, wins, true);
  const strangerPts = Object.values(STRANGERS).map((s) => s.win);
  // the houses down the slopes (review r1: 'bayArea' row houses, not noise): level STREETS across the hill, each a
  // run of gabled houses in neighbourhoods that come and go; a lit house shows its bay window as a pair of panes
  // UNDER its gable, so the lights read in rows under roofs. About half the old density; the hill stays one mass.
  const streets = (ridge: (x: number) => number, back: boolean, gap: number, litP: number) => {
    for (let sy = 150 + R() * 6; sy < TOWN.bottom; sy += gap + R() * 5) {
      let x = TOWN.x0 + R() * 20;
      const ph = R() * 6.3;
      while (x < TOWN.x1) {
        const hw = 9 + R() * 5;
        const depth = sy - ridge(x + hw / 2);
        // a neighbourhood: houses cluster along the street, then a gap of gardens and trees
        const hood = Math.sin(x * 0.0105 + ph) + 0.6 * Math.sin(x * 0.031 + ph * 1.7);
        if (depth < 16 || hood < 0.15 || strangerPts.some((p) => Math.abs(p.x - x) < 16 && Math.abs(p.y - sy) < 12)) {
          x += hw + 2 + R() * 6;
          continue;
        }
        const row = Math.floor(depth / 26) + 1;
        const gy = sy + (R() - 0.5) * 1.5;
        if (!back) {
          // every house cuts its gable (a faint rim line); the street reads as a terrace of roofs
          cuts.moveTo(x, gy + 1.5);
          cuts.lineTo(x + hw / 2, gy - 3.5);
          cuts.lineTo(x + hw, gy + 1.5);
        }
        if (R() < litP) {
          const g = Math.floor(R() * 8);
          const pw = 2.3 + R() * 0.8;
          wins.push({ x: x + hw / 2 - pw - 0.6, y: gy + 3, w: pw, h: 2.6, row, g, back });
          if (R() < 0.6) wins.push({ x: x + hw / 2 + 0.6, y: gy + 3, w: pw, h: 2.6, row, g, back });
        }
        x += hw + 0.8 + (R() < 0.12 ? 3 + R() * 6 : 0);
      }
    }
  };
  streets(backRidgeY, true, 30, 0.2);
  streets(ridgeY, false, 23, 0.34);
  // the four stranger windows: a house each (its gable cut), its bay window a touch larger (strangerWindows)
  for (const p of strangerPts) {
    cuts.moveTo(p.x - 8, p.y - 5);
    cuts.lineTo(p.x, p.y - 11);
    cuts.lineTo(p.x + 8, p.y - 5);
  }
  townMemo = { hill, roofs, backHill, backRoofs, cuts, wins };
  return townMemo;
}

// ---------------------------------------------------------------- the strangers
export type StrangerId = 'hn1' | 'hn2' | 'hn3' | 'hn4';
export interface StrangerDef {
  id: StrangerId;
  /** the window (L2 rest px) */
  win: Pt;
  /** where the thread knots onto the line (L4 world x) */
  attach: number;
  /** the hook's rest-screen y when docked */
  hookY: number;
  /** an explicit dock (L4 world) when the card hangs off the window → knot straight line (the card's weight pulls
   *  the thread into a V); default: on that line at hookY */
  dock?: Pt;
  w: number;
  h: number;
  /** text size (world px at the card's docked scale) */
  fs: number;
  lines: string[];
}
export const STRANGERS: Record<StrangerId, StrangerDef> = {
  // the first commenter (L1001): high on the right hill; its thread knots onto the line just right of tag 4
  hn1: { id: 'hn1', win: { x: 960, y: 212 }, attach: 522, hookY: 252, dock: { x: 850, y: 252 }, w: 166, h: 48, fs: 14.3, lines: ['a Hacker News commenter', '22 Oct 2026'] },
  // the other reader (L1002 "Another saw a compiler"): a smaller blank card from the left hill, knotting just left of
  // tag 4, in the same light
  hn2: { id: 'hn2', win: { x: 300, y: 262 }, attach: 466, hookY: 306, w: 100, h: 30, fs: 0, lines: [] },
  // the stranger who tried four and a half (ch10-s02): it docks just right of tag 6, under the first card, and its
  // thread knots on beside tag 6 (review r1: it was docked far off at the top right)
  hn3: { id: 'hn3', win: { x: 1004, y: 214 }, attach: 690, hookY: 288, dock: { x: 684, y: 288 }, w: 180, h: 52, fs: 13.6, lines: ['a Hacker News commenter', '23 Oct 2026'] },
  // the one who asked why (ch10-s03): docks low beside the blank tag (review r1), its thread knotting on between the
  // blank tag and the stake
  hn4: { id: 'hn4', win: { x: 1336, y: 196 }, attach: 1150, hookY: 290, dock: { x: 1166, y: 290 }, w: 156, h: 46, fs: 13.6, lines: ['a Hacker News commenter', '22 Oct 2026'] },
};
/** the hook's fraction along the thread when docked (window 0 → knot 1), at rest */
export function dockQ(id: StrangerId): number {
  const s = STRANGERS[id];
  const ay = lineY10(s.attach);
  return clamp01((s.hookY - s.win.y) / (ay - s.win.y));
}
/** the window as seen in L4 world coordinates under a camera (parallax) */
export function winInL4(id: StrangerId, cam: Camera3): Pt {
  const s = STRANGERS[id];
  const sc = toScreen(LAYERS.L2, cam, s.win.x, s.win.y);
  return toLayer(LAYERS.L4, cam, sc.x, sc.y);
}
/** the knot on the line (L4 world) */
export const knotOf = (id: StrangerId): Pt => ({ x: STRANGERS[id].attach, y: lineY10(STRANGERS[id].attach) });

export interface StrangerState {
  id: StrangerId;
  /** 0..1 the card's ride from the window to its dock */
  ride: number;
  /** 0..1 the thread's last run from the dock to its knot on the line */
  tail: number;
  /** the time the card docked (for its settling swing); undefined = still riding */
  dockedAt?: number;
  /** 0..1 thread brightness (the s04 'faintly lit') */
  glow?: number;
  /** 0..1 presence of the card and its thread */
  alpha?: number;
  /** 'texture' when the card is too far to be read (the ch10-s04 wide); default: subject once docked */
  role?: 'subject' | 'texture';
  /** 0..1 the card stepped back (not the subject): its paper and ink sink toward the set, its thread fades */
  dim?: number;
  /** 0..1 the thread alone (the copper thread's moment in ch10-s01); default 1 */
  threadA?: number;
  /** 0..1 the card's text (a crossfade's text swap: no ghost text); default 1 */
  textA?: number;
  /** extra card-local drawing (ch10-s02's marble-and-ramp miniature) */
  extra?: (c: C2, w: number, h: number, env: PaintEnv) => void;
}
export interface CardGeom {
  hook: Pt;
  /** the card's corners after its swing (world, L4) */
  tl: Pt;
  tr: Pt;
  bl: Pt;
  br: Pt;
  scale: number;
  angle: number;
}
/** where a docked card hangs (L4 world, fixed in the action plane): on the thread's rest-camera line */
export function dockOf(id: StrangerId): Pt {
  const s = STRANGERS[id];
  return s.dock ?? lerpP(s.win, knotOf(id), dockQ(id));
}
/** the hook (L4 world) at a ride fraction: from the window (parallaxed) to the fixed dock */
export function hookAt(st: StrangerState, cam: Camera3): Pt {
  return lerpP(winInL4(st.id, cam), dockOf(st.id), smr(clamp01(st.ride)));
}
/** where a stranger's card is (L4 world) at time t under cam */
export function cardGeom(st: StrangerState, cam: Camera3, t: number): CardGeom {
  const s = STRANGERS[st.id];
  const hook = hookAt(st, cam);
  const scale = lerp(0.42, 1, smr(st.ride));
  // riding: the card trails back a little; docked: a settling swing
  const angle = st.dockedAt !== undefined && t >= st.dockedAt ? swingAfter(twos(t), st.dockedAt, 0.16, st.id.length) : 0.1 * Math.sin(Math.PI * clamp01(st.ride));
  const top = 7 * scale;
  const rot = (p: Pt): Pt => ({ x: hook.x + p.x * Math.cos(angle) - p.y * Math.sin(angle), y: hook.y + p.x * Math.sin(angle) + p.y * Math.cos(angle) });
  const w = s.w * scale, h = s.h * scale;
  return { hook, tl: rot({ x: -w / 2, y: top }), tr: rot({ x: w / 2, y: top }), bl: rot({ x: -w / 2, y: top + h }), br: rot({ x: w / 2, y: top + h }), scale, angle };
}

const threadInk = (env: PaintEnv) => mixLab(mixLab('#e6d6b8', env.mood.rim, 0.45), env.mood.core, 0.1);
export const cardPaper = (env: PaintEnv) => mixLab('#f2ede3', env.mood.core, 0.12);
export const cardInk = (env: PaintEnv) => mixLab('#211813', env.mood.ink, 0.25);

/** a stranger's thread (window → hook → knot) — draw in L4, untranslated */
export function drawStrangerThread(c: C2, env: PaintEnv, st: StrangerState, cam: Camera3) {
  const a = clamp01(st.alpha ?? 1) * clamp01(st.threadA ?? 1) * (1 - 0.45 * clamp01(st.dim ?? 0));
  if (a <= 0 || st.ride <= 0) return;
  const W = winInL4(st.id, cam);
  const A = knotOf(st.id);
  // the card's weight pulls the thread into a shallow V: window → hook, then hook → its knot on the line
  const H = hookAt(st, cam);
  const E = lerpP(H, A, clamp01(st.tail));
  const m = c.getTransform();
  const px = 1 / (Math.hypot(m.a, m.b) || 1);
  const col = threadInk(env);
  const gl = st.glow ?? 0;
  const g = c.createLinearGradient(W.x, W.y, A.x, A.y);
  g.addColorStop(0, withAlpha(col, 0.3 * a));
  g.addColorStop(0.45, withAlpha(col, (0.42 + 0.2 * gl) * a));
  g.addColorStop(1, withAlpha(col, (0.8 + 0.15 * gl) * a));
  c.save();
  c.strokeStyle = g;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.lineWidth = 1.25 * px;
  c.beginPath();
  c.moveTo(W.x, W.y);
  c.lineTo(H.x, H.y);
  if (st.tail > 0) c.lineTo(E.x, E.y);
  c.stroke();
  if (gl > 0) {
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(env.mood.halo, 0.1 * gl * a);
    c.lineWidth = 4 * px;
    c.beginPath();
    c.moveTo(lerp(W.x, H.x, 0.3), lerp(W.y, H.y, 0.3));
    c.lineTo(H.x, H.y);
    if (st.tail > 0) c.lineTo(E.x, E.y);
    c.stroke();
    c.globalCompositeOperation = 'source-over';
  }
  // the knot on the line
  if (st.tail >= 1) {
    c.strokeStyle = withAlpha(col, 0.9 * a);
    c.lineWidth = 1.2 * px;
    c.beginPath();
    c.ellipse(A.x, A.y, 3, 2.2, 0, 0, Math.PI * 2);
    c.stroke();
  }
  c.restore();
}

/** a stranger's plain white card on its hook (attribution only, no site branding) — draw in L4, untranslated */
export function drawStrangerCard(c: C2, env: PaintEnv, st: StrangerState, cam: Camera3, t: number) {
  const a = clamp01(st.alpha ?? 1);
  if (a <= 0 || st.ride <= 0) return;
  const s = STRANGERS[st.id];
  const G = cardGeom(st, cam, t);
  const m = c.getTransform();
  const px = 1 / (Math.hypot(m.a, m.b) || 1);
  const w = s.w, h = s.h;
  // the far end of the ride is in the haze; a card that has stepped back sinks toward the set
  const haze = 0.45 * (1 - smr(st.ride));
  const dim = clamp01(st.dim ?? 0);
  const paper = mixLab(mixLab(cardPaper(env), env.mood.haze, haze), mixLab(env.mood.set, env.mood.haze, 0.45), 0.5 * dim);
  const tA = clamp01(st.textA ?? 1) * (1 - 0.4 * dim);
  c.save();
  c.globalAlpha *= a;
  c.translate(G.hook.x, G.hook.y);
  c.rotate(G.angle);
  c.scale(G.scale, G.scale);
  // the hook: a small brass ring over the thread
  c.strokeStyle = mixLab('#b08d4a', env.mood.halo, 0.35);
  c.lineWidth = 1.6 * px / G.scale;
  c.beginPath();
  c.arc(0, 1.5, 3.4, Math.PI * 1.05, Math.PI * 2.95);
  c.moveTo(0, 4.9);
  c.lineTo(0, 7.5);
  c.stroke();
  // paper: a soft shadow on the haze, the card, its lit top edge
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
  c.fillRect(-w / 2 + 2.5, 7 + 3.5, w, h);
  const g = c.createLinearGradient(0, 7, 0, 7 + h);
  g.addColorStop(0, mixLab(paper, '#ffffff', 0.12));
  g.addColorStop(1, mixLab(paper, env.mood.set, 0.1));
  c.fillStyle = g;
  c.fillRect(-w / 2, 7, w, h);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.75);
  c.lineWidth = 1.4 * px / G.scale;
  c.beginPath();
  c.moveTo(-w / 2, 7);
  c.lineTo(w / 2, 7);
  c.stroke();
  const docked = st.ride >= 0.995;
  if (s.lines.length) {
    const fs = s.fs;
    const ink = 1;
    textRole(c, st.role ?? (docked ? 'subject' : 'texture'), () => {
      if (tA <= 0.001) return;
      c.fillStyle = withAlpha(cardInk(env), 0.92 * tA);
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.font = `italic 500 ${fs}px ${FONT.text}`;
      c.fillText(s.lines[0], st.extra ? -14 : 0, 7 + h * 0.43);
      c.font = `500 ${fs}px ${FONT.text}`;
      c.fillStyle = withAlpha(cardInk(env), 0.78 * tA);
      c.fillText(s.lines[1], st.extra ? -14 : 0, 7 + h * 0.43 + fs * 1.18);
    });
    textProbe(c, `ch10-${st.id}-text`, -w / 2, 7, w, h, tA);
    cardProbe(c, `ch10-${st.id}`, -w / 2, 7, w, h, a * (st.textA === undefined ? 1 : tA), a * ink * tA);
  } else {
    // a blank card still reads as paper: a soft crease where it was folded to travel
    c.strokeStyle = withAlpha(mixLab(paper, env.mood.set, 0.35), 0.5);
    c.lineWidth = 1 * px / G.scale;
    c.beginPath();
    c.moveTo(-w / 2 + 3, 7 + h * 0.52);
    c.lineTo(w / 2 - 3, 7 + h * 0.5);
    c.stroke();
  }
  st.extra?.(c, w, h, env);
  c.restore();
}

/** the window glows for the strangers (draw in L2 after duskTown) */
export function strangerWindows(c: C2, env: PaintEnv, lit: Partial<Record<StrangerId, number>>, onAll: number | Partial<Record<StrangerId, number>> = 1) {
  for (const id of Object.keys(STRANGERS) as StrangerId[]) {
    const on = typeof onAll === 'number' ? onAll : onAll[id] ?? 1;
    const k = (lit[id] ?? 0) * clamp01(on);
    const p = STRANGERS[id].win;
    // every stranger's window is a lit window of the town; k brightens it; on puts it out (ch10-s04)
    c.fillStyle = withAlpha(mixLab(env.mood.core, env.mood.halo, 0.35), (0.55 + 0.45 * clamp01(k)) * clamp01(on));
    c.fillRect(p.x - 3.2, p.y - 2.4, 6.4, 4.8);
    if (k > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const r = 10 + 14 * k;
      const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      g.addColorStop(0, withAlpha(env.mood.core, 0.55 * k));
      g.addColorStop(0.35, withAlpha(env.mood.halo, 0.25 * k));
      g.addColorStop(1, withAlpha(env.mood.halo, 0));
      c.fillStyle = g;
      c.fillRect(p.x - r, p.y - r, 2 * r, 2 * r);
      c.restore();
    }
  }
}

// ---------------------------------------------------------------- the copper thread (docs → the first commenter)
/** the copper thread's own colour: saturated copper (the frame's one accent), a touch lit by the sun at `glow` */
export const copperBright = (env: PaintEnv, glow = 0) => mixLab(mixLab('#c2622a', env.mood.halo, 0.1), env.mood.core, 0.25 * glow);
/**
 * A copper thread from a to b, drawn up to u (0..1): 2.75 px at 1080p, saturated copper (review r1: it read as one
 * more pale stranger's thread). While it runs, a glowing bead travels at its running end; once it arrives it ends in
 * a small copper bead (its knot) at b. Draw in L4.
 */
export function copperThread(c: C2, env: PaintEnv, a: Pt, b: Pt, u: number, glow = 0.6, alpha = 1) {
  const U = clamp01(u);
  if (U <= 0 || alpha <= 0) return;
  const m = c.getTransform();
  // device px per user unit at a 1080p frame (the reel paints 1.5 device px per stage px at 1080p)
  const px = 1 / (Math.hypot(m.a, m.b) || 1);
  // it lifts off the tag at once and arcs up to the card, over the neighbouring tags' faces (not across them)
  const mid = { x: lerp(a.x, b.x, 0.45), y: Math.min(a.y, b.y) - 20 };
  const at = (k: number): Pt => ({ x: (1 - k) * (1 - k) * a.x + 2 * (1 - k) * k * mid.x + k * k * b.x, y: (1 - k) * (1 - k) * a.y + 2 * (1 - k) * k * mid.y + k * k * b.y });
  const path = () => {
    c.beginPath();
    for (let i = 0; i <= 32; i++) {
      const p = at((i / 32) * U);
      if (i === 0) c.moveTo(p.x, p.y);
      else c.lineTo(p.x, p.y);
    }
  };
  c.save();
  c.globalAlpha *= alpha;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  // a soft warm halo under it (the sun on copper)
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = withAlpha(env.mood.halo, 0.12 * (0.4 + glow));
  c.lineWidth = 7 * px;
  path();
  c.stroke();
  c.globalCompositeOperation = 'source-over';
  // a hair of shadow, then the copper itself
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.35);
  c.lineWidth = 3.6 * px;
  path();
  c.stroke();
  c.strokeStyle = copperBright(env, glow);
  c.lineWidth = 2.75 * px;
  path();
  c.stroke();
  // its lit top edge
  c.strokeStyle = withAlpha(mixLab('#f2b27c', env.mood.core, 0.3), 0.55 * (0.3 + 0.7 * glow));
  c.lineWidth = 0.9 * px;
  c.save();
  c.translate(0, -0.9 * px);
  path();
  c.stroke();
  c.restore();
  if (U < 1) {
    // the travelling bead of light at the running end
    const p = at(U);
    c.globalCompositeOperation = 'lighter';
    const r = 16 * px * 1.5;
    const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g.addColorStop(0, withAlpha(env.mood.core, 0.95));
    g.addColorStop(0.3, withAlpha(mixLab('#e08a4a', env.mood.core, 0.4), 0.55));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(p.x - r, p.y - r, 2 * r, 2 * r);
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = mixLab(copperBright(env, 1), '#fff2dc', 0.4);
    c.beginPath();
    c.arc(p.x, p.y, 2.6 * px * 1.5, 0, Math.PI * 2);
    c.fill();
  } else {
    // the knot: a small copper bead at the card's corner
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.4);
    c.beginPath();
    c.arc(b.x + 0.6 * px, b.y + 0.9 * px, 3.4 * px * 1.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = copperBright(env, glow);
    c.beginPath();
    c.arc(b.x, b.y, 3.2 * px * 1.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha(mixLab('#ffd9b0', env.mood.core, 0.4), 0.85);
    c.beginPath();
    c.arc(b.x - 1 * px, b.y - 1.1 * px, 1.1 * px * 1.5, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ---------------------------------------------------------------- the valley (L0 → fog B)
export interface DuskOpts {
  /** cache key salt (shot id) */
  key: string;
  /** stranger window brightness 0..1 */
  lit?: Partial<Record<StrangerId, number>>;
  /** the town's lit windows by group (0..7), 0..1: ch10-s04 puts them out one by one */
  winOn?: (g: number, row: number) => number;
  /** backlight intensity (default 1) */
  sun?: number;
  sunX?: number;
  /** ch10-s04: the lab's ledger on its far table, focus 0..1 (undefined = not drawn) */
  ledger?: number;
  /** the strangers' own windows, 0..1 (ch10-s04 puts them out last), all or per stranger */
  strangersOn?: number | Partial<Record<StrangerId, number>>;
}

/** backlight, L1 far ridges, L2 the hill town, fog A, L3 the meadow ridge, fog B */
export function duskBack(f: Frame, o: DuskOpts) {
  f.backlight({ sunX: o.sunX ?? 470, sunY: 452, intensity: o.sun ?? 1 });
  f.layer('L1', (c, env) => {
    f.cached(`ch10/L1/${env.mood.id}`, 3200, 760, (cc) => {
      cc.translate(960, 40);
      const ridge = (y: number, amp: number, ph: number, col: string) => {
        cc.fillStyle = col;
        cc.beginPath();
        cc.moveTo(-960, 700);
        for (let x = -960; x <= 2240; x += 16) cc.lineTo(x, y + amp * Math.sin(x * 0.005 + ph) + amp * 0.4 * Math.sin(x * 0.017 + ph * 2));
        cc.lineTo(2240, 700);
        cc.closePath();
        cc.fill();
      };
      // long thin cloud bands, cut paper, their undersides catching the low sun
      const R = mulberry32(1031);
      for (const [cy, x0, x1, th] of [[96, -700, 900, 9], [142, 300, 2100, 7], [196, -500, 700, 5], [214, 1100, 2200, 6]] as const) {
        const body = new Path2D();
        for (let x = x0; x < x1; x += 22 + R() * 30) {
          const rx = 30 + R() * 60, ry = th * (0.6 + R() * 0.7);
          body.ellipse(x, cy + (R() - 0.5) * th, rx, ry, 0, 0, Math.PI * 2);
        }
        cc.fillStyle = mixLab(env.mood.sky[1], env.mood.sky[0], 0.35);
        cc.fill(body);
        cc.save();
        cc.clip(body);
        cc.fillStyle = withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.5), 0.35);
        cc.translate(0, -3);
        cc.fill(body);
        cc.restore();
        cc.fillStyle = mixLab(env.mood.sky[1], env.mood.sky[0], 0.35);
        cc.save();
        cc.translate(0, -4.5);
        cc.fill(body);
        cc.restore();
      }
      ridge(400, 16, 0.7, mixLab(env.mood.setHaze, env.mood.sky[3], 0.45));
      ridge(428, 12, 2.4, mixLab(env.mood.setHaze, env.mood.haze, 0.35));
    })(c, -960, -40);
    // the valley gap: the backlight's core lifted ~15 % where the sun sits between the hills (review r1)
    const sunK = o.sun ?? 1;
    const vx = o.sunX ?? 470;
    c.save();
    c.globalCompositeOperation = 'lighter';
    const vg = c.createRadialGradient(vx, 430, 0, vx, 430, 300);
    vg.addColorStop(0, withAlpha(env.mood.core, 0.16 * sunK));
    vg.addColorStop(0.45, withAlpha(env.mood.halo, 0.07 * sunK));
    vg.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = vg;
    c.fillRect(vx - 300, 130, 600, 600);
    c.restore();
  });
  f.layer('L2', (c, env) => {
    const T = town();
    const W = TOWN.x1 - TOWN.x0;
    f.cached(`ch10/L2v2/${env.mood.id}`, W, 1000, (cc) => {
      cc.translate(-TOWN.x0, 0);
      // VALUE STRUCTURE (review r1): the hills are cut-paper silhouettes against the valley glow, ~38 % toward ink;
      // the far ridge one step lighter (aerial perspective)
      const ink = env.fill('ink');
      // the far ridge of the town, in the haze
      cc.fillStyle = mixLab(mixLab(env.mood.set, env.mood.haze, 0.5), ink, 0.16);
      cc.fill(T.backHill);
      cc.fill(T.backRoofs);
      // a mist sheet between the two ridges
      const gm = cc.createLinearGradient(0, 150, 0, 460);
      gm.addColorStop(0, withAlpha(env.mood.haze, 0));
      gm.addColorStop(0.7, withAlpha(env.mood.haze, 0.24));
      gm.addColorStop(1, withAlpha(env.mood.haze, 0.36));
      cc.fillStyle = gm;
      cc.fillRect(TOWN.x0, 150, W, 400);
      const hillCol = mixLab(mixLab(env.mood.set, env.mood.haze, 0.3), ink, 0.4);
      cc.fillStyle = hillCol;
      cc.fill(T.hill);
      cc.fill(T.roofs);
      // valley mist rising up the near hill: only toward the foot, so the hill holds its silhouette
      const g = cc.createLinearGradient(0, 200, 0, 640);
      g.addColorStop(0, withAlpha(env.mood.haze, 0));
      g.addColorStop(0.6, withAlpha(env.mood.haze, 0.1));
      g.addColorStop(1, withAlpha(env.mood.haze, 0.36));
      cc.save();
      cc.clip(T.hill);
      cc.fillStyle = g;
      cc.fillRect(TOWN.x0, 0, W, 1000);
      cc.restore();
      cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.haze, 0.3), 0.13);
      cc.lineWidth = 0.8;
      cc.stroke(T.cuts);
      // the crest catches the last light
      cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.4), 0.24);
      cc.lineWidth = 1.1;
      cc.beginPath();
      for (let x = TOWN.x0; x <= TOWN.x1; x += 5) {
        const y = ridgeY(x) + 4;
        if (x === TOWN.x0) cc.moveTo(x, y);
        else cc.lineTo(x, y);
      }
      cc.stroke();
    })(c, TOWN.x0, 0);
    // the lit windows (dynamic so ch10-s04 can put them out); the far ridge's are dimmer
    const lightCol = mixLab(env.mood.core, env.mood.halo, 0.45);
    const on = o.winOn;
    for (const w of T.wins) {
      const k = on ? on(w.g, w.row) : 1;
      if (k <= 0.01) continue;
      const depthFade = (1 - Math.min(0.6, w.row * 0.05)) * (w.back ? 0.5 : 1);
      c.fillStyle = withAlpha(lightCol, (0.4 + (w.g % 3) * 0.13) * depthFade * k);
      c.fillRect(w.x, w.y, w.w, w.h);
    }
    strangerWindows(c, env, o.lit ?? {}, o.strangersOn ?? 1);
  });
  f.fog('A');
  f.layer('L3', (c, env) => {
    f.cached(`ch10/L3v2/${env.mood.id}`, 2600, 420, (cc) => {
      cc.translate(660, -420);
      meadow(cc, env);
    })(c, -660, 420);
    if (o.ledger !== undefined) ledgerTable(f, c, env, o.ledger);
  });
  f.fog('B');
}

/** L3: the near meadow ridge with a far fence line and a few shrubs */
function meadow(c: C2, env: PaintEnv) {
  const y0 = (x: number) => 548 + 14 * Math.sin(x * 0.0045 + 2.1) + 5 * Math.sin(x * 0.019);
  // VALUE STRUCTURE (review r1): the near meadow ridge is a dark cut-paper band (~40 % toward ink)
  const ridgeCol = mixLab(env.fill('set'), env.fill('ink'), 0.42);
  c.fillStyle = ridgeCol;
  c.beginPath();
  c.moveTo(-660, 900);
  for (let x = -660; x <= 1940; x += 10) c.lineTo(x, y0(x));
  c.lineTo(1940, 900);
  c.closePath();
  c.fill();
  // grass tufts along the crest (pierced: the light shows between blades)
  const R = mulberry32(1071);
  c.beginPath();
  for (let x = -640; x < 1920; x += 7 + R() * 9) {
    const y = y0(x) + 1;
    const n = 2 + Math.floor(R() * 3);
    for (let k = 0; k < n; k++) {
      const hgt = 5 + R() * 9;
      const lean = (R() - 0.5) * 5;
      c.moveTo(x + k * 1.6 - 0.8, y);
      c.lineTo(x + k * 1.6 + lean, y - hgt);
      c.lineTo(x + k * 1.6 + 0.8, y);
    }
  }
  c.fill();
  // a far fence line running along the meadow
  c.strokeStyle = ridgeCol;
  c.lineWidth = 1.4;
  c.beginPath();
  for (let x = -600; x < 1900; x += 58) {
    const y = y0(x) - 2;
    c.moveTo(x, y);
    c.lineTo(x, y - 17);
  }
  for (const dy of [14, 7]) {
    for (let x = -600; x < 1900; x += 10) {
      const y = y0(x) - 2 - dy;
      if (x === -600) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
  }
  c.stroke();
  // two shrubs
  for (const [x, r] of [[-180, 26], [1500, 32]] as const) {
    const y = y0(x);
    c.beginPath();
    c.arc(x, y - r * 0.5, r, Math.PI, 0);
    c.arc(x + r * 0.9, y - r * 0.3, r * 0.6, Math.PI, 0);
    c.lineTo(x + r * 1.6, y + 2);
    c.lineTo(x - r, y + 2);
    c.fill();
  }
}

/**
 * ch10-s04: the lab's ledger, closed and dark, on a small table in the meadow BEYOND the left stake, outside the
 * line's span (L3), so no tag's thread falls anywhere near it. A recognisable closed book (review r1): the cover slab
 * lying flat, a darker spine band toward us, a slightly lighter page-block edge, a ribbon tail hanging from the
 * pages, and a faint COOL rim on its top edge only: dark, unlit, alone. focus 0..1 racks it from soft to sharp.
 */
export const LEDGER_AT = { x: 14, y: 560 } as const;
function ledgerTable(f: Frame, c: C2, env: PaintEnv, focus: number) {
  const draw = (cc: C2) => {
    const tableCol = mixLab(env.fill('set'), PUPPET_NEAR_BLACK, 0.62);
    cc.fillStyle = tableCol;
    // a plain small table: top, apron, two legs (feet into the grass)
    cc.fillRect(-60, -50, 120, 6);
    cc.fillRect(-54, -44, 108, 7);
    cc.fillRect(-51, -37, 5, 42);
    cc.fillRect(46, -37, 5, 42);
    // the ledger: a thick closed book lying flat, its spine toward us (drawn about twice the old size)
    const cover = mixLab(env.fill('set'), PUPPET_NEAR_BLACK, 0.86);
    const L = -46, R = 42, top = -74, base = -50;
    // the back board (under the pages), a hair proud
    cc.fillStyle = cover;
    cc.beginPath();
    cc.moveTo(L - 1, base);
    cc.lineTo(L + 5, base - 6);
    cc.lineTo(R + 4, base - 6);
    cc.lineTo(R + 2, base);
    cc.closePath();
    cc.fill();
    // the page block: a slightly lighter band (closed pages, no light on them)
    cc.fillStyle = mixLab(cover, env.mood.setHaze, 0.32);
    cc.beginPath();
    cc.moveTo(L + 4, base - 5);
    cc.lineTo(L + 9, top + 9);
    cc.lineTo(R + 1, top + 9);
    cc.lineTo(R + 2, base - 5);
    cc.closePath();
    cc.fill();
    // page lines along the block
    cc.strokeStyle = withAlpha(mixLab(cover, env.mood.setHaze, 0.55), 0.6);
    cc.lineWidth = 0.6;
    cc.beginPath();
    for (let k = 1; k <= 4; k++) {
      const y = base - 5 + ((top + 9 - (base - 5)) * k) / 5;
      cc.moveTo(L + 6 + k * 0.6, y);
      cc.lineTo(R + 1.5, y);
    }
    cc.stroke();
    // the top board: the cover slab, seen a little from above
    cc.fillStyle = cover;
    cc.beginPath();
    cc.moveTo(L + 6, top + 10);
    cc.lineTo(L + 14, top);
    cc.lineTo(R + 6, top);
    cc.lineTo(R + 3, top + 10);
    cc.closePath();
    cc.fill();
    // the spine band toward us, darker, with two raised bands
    cc.fillStyle = mixLab(cover, PUPPET_NEAR_BLACK, 0.7);
    cc.beginPath();
    cc.moveTo(L - 2, base + 0.5);
    cc.quadraticCurveTo(L - 7, (base + top) / 2 + 4, L + 6, top + 10);
    cc.lineTo(L + 12, top + 10);
    cc.quadraticCurveTo(L + 2, (base + top) / 2 + 4, L + 6, base + 0.5);
    cc.closePath();
    cc.fill();
    cc.strokeStyle = withAlpha(mixLab(cover, env.mood.setHaze, 0.4), 0.7);
    cc.lineWidth = 0.9;
    cc.beginPath();
    cc.moveTo(L - 3.5, base - 8);
    cc.lineTo(L + 3.5, base - 8);
    cc.moveTo(L - 3, top + 18);
    cc.lineTo(L + 5, top + 18);
    cc.stroke();
    // the ribbon tail, hanging from the pages over the table's edge
    cc.strokeStyle = mixLab(cover, PUPPET_NEAR_BLACK, 0.3);
    cc.lineWidth = 2.2;
    cc.lineCap = 'round';
    cc.beginPath();
    cc.moveTo(R - 12, base - 6);
    cc.quadraticCurveTo(R - 8, base + 2, R - 10, base + 14);
    cc.stroke();
    cc.beginPath();
    cc.moveTo(R - 10, base + 14);
    cc.lineTo(R - 13, base + 18);
    cc.moveTo(R - 10, base + 14);
    cc.lineTo(R - 7, base + 18);
    cc.lineWidth = 1.4;
    cc.stroke();
    // a faint COOL rim on the top board's far edge only: the sky, not the sun, touches it
    cc.strokeStyle = withAlpha(mixLab('#9fb0c8', env.mood.haze, 0.35), 0.5);
    cc.lineWidth = 1.1;
    cc.beginPath();
    cc.moveTo(L + 14, top - 0.4);
    cc.lineTo(R + 6, top - 0.4);
    cc.stroke();
  };
  const sharp = f.cached(`ch10/ledger3/${env.mood.id}`, 180, 120, (cc) => {
    cc.translate(90, 96);
    draw(cc);
  });
  const soft = f.cached(`ch10/ledger3-soft/${env.mood.id}`, 180, 120, (cc) => {
    cc.translate(90, 96);
    draw(cc);
  }, { blur: 8 });
  const u = clamp01(focus);
  c.save();
  c.globalAlpha *= 1 - u;
  soft(c, LEDGER_AT.x - 90, LEDGER_AT.y - 96);
  c.globalAlpha = u;
  sharp(c, LEDGER_AT.x - 90, LEDGER_AT.y - 96);
  c.restore();
}

// ---------------------------------------------------------------- the fence (L4, untranslated world)
/** the fence's top rail (the rule lies on it), a lower rail, and two short posts between the stakes */
export function fence(c: C2, env: PaintEnv) {
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(RAIL.x0, RAIL.y, RAIL.x1 - RAIL.x0, RAIL.h);
  c.fillRect(RAIL.x0, RAIL.y + 66, RAIL.x1 - RAIL.x0, 8);
  for (const x of [452, 838]) c.fillRect(x - 5, RAIL.y + RAIL.h, 10, 220);
  const m = c.getTransform();
  const px = 1 / (Math.hypot(m.a, m.b) || 1);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.55);
  c.lineWidth = 1.3 * px;
  c.beginPath();
  c.moveTo(RAIL.x0, RAIL.y + 66);
  c.lineTo(RAIL.x1, RAIL.y + 66);
  c.stroke();
}

/** tag 6's copper rivet, drawn a touch larger than the shared painter's so it reads; k = the last sun on it (0..1) */
export function rivetGlint(c: C2, env: PaintEnv, swing: number, k = 0.5) {
  const a = anchors10({ id: '6' });
  const rx = a.eye.x + Math.cos(swing) * (-TAG.w * 0.3) - Math.sin(swing) * 16;
  const ry = a.eye.y + Math.sin(swing) * (-TAG.w * 0.3) + Math.cos(swing) * 16;
  c.save();
  // copper, not pale: the last sun only lifts it a little
  c.fillStyle = copperBright(env, 0.15 + 0.45 * k);
  c.beginPath();
  c.arc(rx, ry, 4.6, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.45);
  c.lineWidth = 0.8;
  c.stroke();
  c.fillStyle = withAlpha(env.mood.core, 0.85);
  c.beginPath();
  c.arc(rx - 1.3, ry - 1.4, 1.4, 0, Math.PI * 2);
  c.fill();
  if (k > 0) {
    c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(rx, ry, 0, rx, ry, 14);
    g.addColorStop(0, withAlpha(env.mood.core, 0.4 * k));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(rx - 14, ry - 14, 28, 28);
  }
  c.restore();
}

// ---------------------------------------------------------------- the near planes
/** L5 tall grass at the lower corners (soft); L6 a near stake at the right edge (optional); `occluder` (L5 world:
 *  the top of a near fence stake) adds a dark blurred stake with tall grass at its foot, a lower-corner occluder that
 *  slides against the line and the hills on every camera move (review r1: no dark near plane) */
export function duskNear(f: Frame, o: { key: string; stake?: boolean; occluder?: Pt }) {
  f.layer('L5', (c, env) => {
    if (o.occluder) {
      f.cached(`ch10/L5occ2/${env.mood.id}`, 260, 700, (cc) => {
        cc.translate(90, 30);
        cc.fillStyle = PUPPET_NEAR_BLACK;
        // the stake: split timber, a slanted cut top, one wire staple
        cc.beginPath();
        cc.moveTo(-17, 18);
        cc.lineTo(16, 4);
        cc.lineTo(19, 700);
        cc.lineTo(-21, 700);
        cc.closePath();
        cc.fill();
        cc.fillRect(14, 70, 60, 4);
        // tall grass round its foot, leaning out of the light
        const R = mulberry32(1103);
        cc.beginPath();
        for (let x = -88; x < 150; x += 3 + R() * 4) {
          const base = 120;
          const h = 30 + R() * 120 * (1 - Math.abs(x - 10) / 190);
          const lean = (R() - 0.3) * 40;
          cc.moveTo(x - 2.4, base);
          cc.quadraticCurveTo(x + lean * 0.3, base - h * 0.6, x + lean, base - h);
          cc.quadraticCurveTo(x + lean * 0.3 + 1.8, base - h * 0.6, x + 2.4, base);
        }
        cc.fill();
        cc.fillRect(-90, 112, 250, 600);
        // the stake's lit edge: a thin warm rim on its top cut, toward the sun
        cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.5);
        cc.lineWidth = 2;
        cc.beginPath();
        cc.moveTo(-16, 17);
        cc.lineTo(15, 4.5);
        cc.stroke();
      }, { blur: 6 })(c, o.occluder.x - 90, o.occluder.y - 30);
    }
    f.cached(`ch10/L5/${env.mood.id}`, 2400, 520, (cc) => {
      cc.translate(560, -400);
      const R = mulberry32(1091);
      cc.fillStyle = env.fill('fg');
      const tuft = (x0: number, x1: number, base: number, tall: number) => {
        cc.beginPath();
        for (let x = x0; x < x1; x += 3 + R() * 5) {
          const h = tall * (0.45 + R() * 0.55);
          const lean = (R() - 0.35) * 26;
          cc.moveTo(x - 2.2, base);
          cc.quadraticCurveTo(x + lean * 0.3, base - h * 0.6, x + lean, base - h);
          cc.quadraticCurveTo(x + lean * 0.3 + 1.6, base - h * 0.6, x + 2.2, base);
        }
        cc.fill();
        cc.fillRect(x0 - 10, base - 4, x1 - x0 + 20, 140);
      };
      tuft(-560, 210, 760, 118);
      tuft(1080, 1840, 768, 104);
      // a few seed heads (pierced ovals)
      for (let i = 0; i < 9; i++) {
        const x = i < 5 ? -420 + i * 120 + R() * 40 : 1120 + (i - 5) * 150 + R() * 40;
        const y = 652 - R() * 46;
        cc.beginPath();
        cc.ellipse(x, y, 3.2, 8, 0.2, 0, Math.PI * 2);
        cc.fill();
        cc.fillRect(x - 0.7, y + 6, 1.4, 120);
      }
    })(c, -560, 400);
  });
  if (o.stake) {
    f.layer('L6', (c, env) => {
      f.cached(`ch10/L6/${env.mood.id}`, 200, 1000, (cc) => {
        cc.translate(-1150, -60);
        cc.fillStyle = env.fill('fg');
        cc.beginPath();
        cc.moveTo(1196, 500);
        cc.lineTo(1222, 470);
        cc.lineTo(1248, 500);
        cc.lineTo(1254, 1060);
        cc.lineTo(1190, 1060);
        cc.closePath();
        cc.fill();
      })(c, 1150, 60);
    });
  }
}

/** tag x positions used by ch10 (the canonical slots) and a tag's body rect (world) for framing */
export function tagBox(st: TagState) {
  const a = anchors10(st);
  return { x: a.eye.x - TAG.w / 2, y: a.eye.y, w: TAG.w, h: TAG.h };
}

// ---------------------------------------------------------------- the row of tags, ch10 dressing
/**
 * drawTags for ch10 (same threads, lanes and tags as sets/tagLine drawTags with pencil 'none'), with two pieces of
 * dressing so the row reads clean in every ch10 frame (review r1 clutter note):
 *  - a long knot card ('HandwiredOS's own design', 'the README's tagline', …) is set on TWO lines, so it no longer runs
 *    over its left neighbour's card;
 *  - the nanoGPT? question card hangs a little right of tag 10 instead of behind it (it peeked out as a cut-off 'T?').
 * Draw inside c.translate(0, LINE_DY), in L4, exactly where drawTags was called.
 */
export const NANO_X = SLOT_X['10'] + 54;
const KNOT_WRAP = 14;
export function prepTag10(st: TagState): { st: TagState; wrapped?: string[][] } {
  let out: TagState = st;
  if (st.id === 'nano' && st.x === undefined) out = { ...out, x: NANO_X };
  const kn = st.knot ?? TAGS[st.id].knot;
  if (!kn.some((l) => l.length > KNOT_WRAP)) return { st: out };
  const wrapped = kn.map((l) => {
    if (l.length <= KNOT_WRAP) return [l];
    const words = l.split(' ');
    let best = 1, bestD = Infinity;
    for (let i = 1; i < words.length; i++) {
      const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
  });
  return { st: { ...out, knot: [] }, wrapped };
}
export function drawTags10(c: C2, env: PaintEnv, states: TagState[], o: { tq: number }) {
  const prep = states.map(prepTag10);
  let lane = 0;
  for (const { st } of prep) {
    const def = TAGS[st.id];
    const an = tagAnchors(st);
    const a = clamp01(st.alpha ?? 1);
    if (a <= 0) continue;
    c.save();
    c.globalAlpha = a;
    if (def.slack || def.kind === 'question' || def.kind === 'card') {
      if (def.slack) {
        c.strokeStyle = tagThreadCol(env);
        c.lineWidth = Math.max(lwOf(c, 1.2), 0.8);
        c.beginPath();
        c.moveTo(an.bottom.x, an.bottom.y);
        c.bezierCurveTo(an.bottom.x - 6, an.bottom.y + 22, an.bottom.x + 12, an.bottom.y + 26, an.bottom.x + 4, an.bottom.y + 38);
        c.stroke();
      }
    } else if (def.strands && st.drop !== undefined) {
      def.strands.forEach((sd, i) => {
        const u = Array.isArray(st.drop) ? st.drop[i] ?? 0 : st.drop ?? 0;
        const from = def.strands!.length > 1 ? { x: an.bottom.x + (i === 0 ? -8 : 8), y: an.bottom.y } : an.bottom;
        drawThread(c, env, from, lifeX(sd.days, RULE), sd.tip, u, { lane: lane++ });
      });
    }
    c.restore();
  }
  for (const { st, wrapped } of prep) {
    drawTag(c, env, st, { tq: o.tq });
    if (wrapped) knotCards2(c, env, st, wrapped);
  }
}
const lwOf = (c: C2, dev: number) => dev / (Math.hypot(c.getTransform().a, c.getTransform().b) || 1);
const tagThreadCol = (env: PaintEnv) => withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, env.layer.haze * 0.6), 0.85);
/** a knot card set on two lines (sets/tagLine's knot card look: small caps on cream, a thread to the eyelet) */
function knotCards2(c: C2, env: PaintEnv, st: TagState, cards: string[][]) {
  const a = clamp01(st.alpha ?? 1) * clamp01(st.knotIn ?? 1);
  if (a <= 0) return;
  const s = st.scale ?? 1;
  const eye = tagAnchors(st).eye;
  const kin = clamp01(st.knotIn ?? 1);
  c.save();
  c.globalAlpha = a;
  let yAcc = 0;
  cards.forEach((lines, i) => {
    textRole(c, st.subject ? 'subject' : 'texture', () => {
      const fs = 6.6 * s;
      c.font = `600 ${fs.toFixed(2)}px ${FONT.sc}`;
      const tw = Math.max(...lines.map((l) => c.measureText(l).width));
      const lh = fs * 1.12;
      const cw = tw + 8 * s, ch = lh * lines.length + 5 * s;
      const kx = eye.x - cw - 6 * s - i * 4 * s;
      const ky = eye.y - ch * 0.32 + yAcc + (1 - kin) * -8 * s;
      yAcc += ch + 2 * s;
      c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.2);
      c.fillRect(kx + 1.5 * s, ky + 2 * s, cw, ch);
      c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.2), env.mood.haze, env.layer.haze * 0.6);
      c.fillRect(kx, ky, cw, ch);
      c.strokeStyle = tagThreadCol(env);
      c.lineWidth = lwOf(c, 0.9);
      c.beginPath();
      c.moveTo(kx + cw, ky + ch * 0.4);
      c.lineTo(eye.x, eye.y + 7 * s);
      c.stroke();
      c.fillStyle = mixLab('#1d140d', env.mood.ink, 0.3);
      c.textBaseline = 'middle';
      c.textAlign = 'left';
      lines.forEach((l, k) => c.fillText(l, kx + 4 * s, ky + 2.5 * s + lh * (k + 0.55)));
    });
  });
  c.restore();
}
