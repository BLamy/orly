/**
 * handwired-explained — ch04-s06 / ch04-s07: DEEP DIVE I's backlit workbench, under the lamp (s06) and on its one cold
 * excursion (s07). One room so the two shots cut together:
 *
 *   benchRoom(f, { key, from?, to, u, pad?, wallEnd?, far?, lamp? })
 *        backlight · (L1 far ridge) · L2 the tall window bay (flat-headed paned windows, holes in the wall) · fog A ·
 *        L3 the long bench, edge-on, an anglepoise lamp at its left, plates pinned on its back edge · fog B.
 *        `from → to` at `u` is a TINT crossfade: every cached layer is baked once per mood and the two bakes are
 *        blended, so a 3 s crossfade costs two bitmaps, not seventy-two. wallEnd: the bay's right jamb (L2 rest px);
 *        past it the room is open to the backlight (s07: the cold).
 *   nearPost(f, key, o)          L6: the black turned post framing the frame's right edge (where the card is clipped)
 *   postCard(c, env, o)          the small formula card clipped to the post: paper + ink lines, carried in and out
 *                                together (cards rule), every line probed for the ghost-text audit
 *   leverGauge(c, env, o)        the lever that reads board one minus board two: arc 0..1, stop pegs at both ends,
 *                                a half tick; value > 1 swings past the stop and BENDS the 1 peg (s07)
 *   marble(c, env, x, y, r)      the brass marble
 *   shutter(c, env, o)           a paper shutter on a belt: frame + sliding panel; open fraction = what it passes
 *   dimmerKnob(c, env, o)        the shutter redrawn as a dimmer knob turned to `open` (s06 'dimmer')
 *   tray(c, env, x, y, w)        the black output tray
 *
 * Geometry is rest-screen stage px; draw the L4 pieces in f.layer('L4', …). Colour roles come from env (never hex,
 * except the paper / ink of the tiles and cards, which match sets/rampBench).
 */
import type { Frame, MoodId, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { makeEnv, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { windowWall } from '../../../film/silhouette/architecture';
import { FONT, cardProbe, textProbe, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { hash1 } from '../../../film/core/frame';
import { copperOf } from './narratorHands';

type C = CanvasRenderingContext2D;
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

export const PAPER = '#e9dcbf';
export const PAPER_INK = '#1d140d';

// ---------------------------------------------------------------- the room
export interface RoomOpts {
  /** cache key salt (shot id) */
  key: string;
  /** tint crossfade from → to at u (0 = from); omit from for a single mood */
  from?: MoodId;
  to: MoodId;
  u: number;
  /** art margin each side (L2/L3 rest px), default 240 */
  pad?: number;
  /** extra width on the right for a long pan (L3 rest px; L2 gets 0.72 of it) */
  extraR?: number;
  /** L2 x where the window bay ends (a jamb); default: the bay runs the whole width */
  wallEnd?: number;
  /** paint an L1 far ridge (only seen where the bay is open) */
  far?: boolean;
  /** backlight sun x */
  sunX?: number;
  /** backlight intensity */
  intensity?: number;
  /** (ch04-s07) past the jamb the bay runs on to this L2 x as a receding row of tall cold windows (holes) */
  coldBay?: number;
}

/** bake a layer's static art once per mood and blend the two bakes by u (a tint crossfade) */
function blend2(f: Frame, c: C, key: string, layer: 'L1' | 'L2' | 'L3' | 'L5' | 'L6', o: RoomOpts, x: number, y: number, w: number, h: number, draw: (cc: C, env: PaintEnv) => void) {
  const bake = (m: MoodId) =>
    f.cached(`${key}/${m}`, w, h, (cc) => {
      cc.translate(-x, -y);
      draw(cc, makeEnv({ mood: m, layer: LAYERS[layer] }));
    });
  const u = o.from ? clamp01(o.u) : 1;
  if (o.from && u < 1) bake(o.from)(c, x, y);
  if (u > 0) {
    c.save();
    c.globalAlpha *= o.from ? u : 1;
    bake(o.to)(c, x, y);
    c.restore();
  }
}

export function benchRoom(f: Frame, o: RoomOpts) {
  const pad = o.pad ?? 240;
  const extra = o.extraR ?? 0;
  const k = `ch04bench/${o.key}`;
  f.backlight({ sunX: o.sunX ?? 600, intensity: o.intensity ?? 1 });
  if (o.far) {
    f.layer('L1', (c) => {
      const x0 = -pad, w = 1280 + 2 * pad + extra * 0.3;
      blend2(f, c, `${k}/L1`, 'L1', o, x0, 300, w, 460, (cc, env) => farRidge(cc, env, x0, w));
    });
  }
  f.layer('L2', (c) => {
    const x0 = -pad;
    const wEnd = o.wallEnd ?? 1280 + pad + extra * 0.72;
    const w = Math.max(wEnd, o.coldBay ?? 0) - x0 + 60;
    blend2(f, c, `${k}/L2`, 'L2', o, x0, -240, w, 1200, (cc, env) => {
      if (o.coldBay !== undefined) coldBayWall(cc, env, wEnd, o.coldBay);
      bayWall(cc, env, x0, wEnd, o.wallEnd !== undefined);
    });
  });
  f.fog('A');
  f.layer('L3', (c) => {
    const x0 = -pad, w = 1280 + 2 * pad + extra;
    blend2(f, c, `${k}/L3`, 'L3', o, x0, 420, w, 360, (cc, env) => benchBack(cc, env, x0, x0 + w));
    blend2(f, c, `${k}/L3lamp`, 'L3', o, 170, -300, 130, 470, (cc, env) => hangingLamp(cc, env));
  });
  f.fog('B');
}

/** L1: a low far ridge and a frosted field (s07, through the open end of the bay) */
function farRidge(c: C, env: PaintEnv, x0: number, w: number) {
  const ridge = (y: number, amp: number, seed: number, col: string) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(x0, 760);
    for (let x = x0; x <= x0 + w; x += 16) c.lineTo(x, y + amp * Math.sin(x * 0.004 + seed) + amp * 0.45 * Math.sin(x * 0.013 + seed * 2.3));
    c.lineTo(x0 + w, 760);
    c.closePath();
    c.fill();
  };
  ridge(452, 16, 1.3, mixLab(env.mood.set, env.mood.haze, 0.62));
  ridge(492, 10, 4.1, mixLab(env.mood.set, env.mood.haze, 0.42));
}

/**
 * L2: the window bay of ch04-s02 .. s05 (sets/ch04-s02-workbench, replicated so the tint crossfade can bake it per
 * mood): a dark wall with three tall round-headed lights (2 × 8 leaded panes, a two-pane head), holes in the wall;
 * an optional right jamb where the bay ends (ch04-s07's whip runs out past it into the open).
 */
function bayWall(c: C, env: PaintEnv, x0: number, wEnd: number, jamb: boolean) {
  const wall = mixLab(mixLab('#4b3828', env.mood.set, 0.12), PUPPET_NEAR_BLACK, 0.18);
  const p = new Path2D();
  p.rect(x0, -240, wEnd - x0, 1200);
  const lights = [{ cx: 330, w: 236 }, { cx: 640, w: 252 }, { cx: 950, w: 236 }];
  const top = 40, sill = 600, bar = 4.5;
  for (const L of lights) {
    const r = L.w / 2;
    const lx = L.cx - r;
    const spring = top + r;
    const mull = 14;
    const pw = (L.w - mull) / 2;
    const rows = 8;
    const ph = (sill - spring - bar * (rows - 1)) / rows;
    for (let i = 0; i < 2; i++) {
      const px = lx + i * (pw + mull);
      for (let j = 0; j < rows; j++) p.rect(px, spring + 6 + j * (ph + bar), pw, ph - 2);
    }
    for (let i = 0; i < 2; i++) {
      const sub = new Path2D();
      const a0 = i === 0 ? Math.PI : Math.PI * 1.5 + 0.06;
      const a1 = i === 0 ? Math.PI * 1.5 - 0.06 : Math.PI * 2;
      const cx = L.cx + (i === 0 ? -mull / 2 : mull / 2);
      sub.moveTo(cx, spring);
      sub.arc(L.cx, spring, r - 2, a0, a1);
      sub.closePath();
      p.addPath(sub);
    }
  }
  c.fillStyle = wall;
  c.fill(p, 'evenodd');
  for (const L of lights) {
    for (let j = 0; j < 9; j++) {
      const k = (hash1(j + L.cx, 7) + 1) / 2;
      c.fillStyle = withAlpha(k > 0.5 ? '#fff3dc' : '#8a6a44', 0.04 + 0.05 * k);
      c.fillRect(L.cx - L.w / 2, top + L.w / 2 + j * 62, L.w, 58);
    }
  }
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.16);
  c.lineWidth = 1.2;
  c.beginPath();
  for (const L of lights) {
    const r = L.w / 2 + 12;
    c.moveTo(L.cx - r, sill);
    c.lineTo(L.cx - r, top + r - 12);
    c.arc(L.cx, top + r - 12, r, Math.PI, Math.PI * 2);
    c.lineTo(L.cx + r, sill);
  }
  c.moveTo(x0, 8);
  c.lineTo(wEnd, 8);
  c.moveTo(x0, 16);
  c.lineTo(wEnd, 16);
  c.stroke();
  const g = c.createLinearGradient(0, -240, 0, 300);
  g.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0.45));
  g.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0));
  c.save();
  c.fillStyle = g;
  c.fill(p, 'evenodd');
  c.restore();
  if (jamb) {
    c.fillStyle = mixLab(wall, env.mood.fg, 0.3);
    c.fillRect(wEnd - 70, -240, 90, 1000);
    c.fillRect(wEnd - 84, 520, 118, 240);
    c.strokeStyle = withAlpha(env.mood.rim, 0.22);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(wEnd - 70, -240);
    c.lineTo(wEnd - 70, 520);
    c.stroke();
  }
}

/**
 * L2 (ch04-s07): past the bay's jamb the wall runs on with a row of tall flat-headed windows that narrow and close up
 * as they recede (holes: the cold backlight and the far ridge show through), mullions and transoms cut in the wall.
 */
function coldBayWall(c: C, env: PaintEnv, x0: number, x1: number) {
  const wall = mixLab(mixLab('#3a3f4a', env.mood.set, 0.3), PUPPET_NEAR_BLACK, 0.3);
  const p = new Path2D();
  p.rect(x0, -240, x1 - x0, 1200);
  const sill = 600;
  let x = x0 + 60;
  let i = 0;
  const lights: { x: number; w: number; top: number }[] = [];
  while (x < x1 - 60) {
    const u = (x - x0) / Math.max(1, x1 - x0);
    const w = 190 - 70 * u;
    const top = -40 + 70 * u;
    lights.push({ x, w, top });
    const mull = 10 - 3 * u;
    const cols = 3;
    const pw = (w - mull * (cols - 1)) / cols;
    const rows = 7;
    const bar = 5 - 1.5 * u;
    const ph = (sill - top - bar * (rows - 1)) / rows;
    for (let cI = 0; cI < cols; cI++) for (let r = 0; r < rows; r++) p.rect(x + cI * (pw + mull), top + r * (ph + bar), pw, ph);
    x += w + 120 - 50 * u;
    i++;
  }
  c.fillStyle = wall;
  c.fill(p, 'evenodd');
  // frost on the panes (pale bands, seeded), and the reveal's cold rim on each light's near jamb
  for (const L of lights) {
    for (let j = 0; j < 6; j++) {
      const k = (hash1(j + Math.round(L.x), 11) + 1) / 2;
      c.fillStyle = withAlpha(k > 0.55 ? '#eef4ff' : '#5d6b80', 0.05 + 0.06 * k);
      c.fillRect(L.x, L.top + j * 100, L.w, 80);
    }
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.3);
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(L.x - 3, sill);
    c.lineTo(L.x - 3, L.top - 3);
    c.lineTo(L.x + L.w + 3, L.top - 3);
    c.stroke();
  }
  const g = c.createLinearGradient(0, -240, 0, 260);
  g.addColorStop(0, withAlpha(PUPPET_NEAR_BLACK, 0.5));
  g.addColorStop(1, withAlpha(PUPPET_NEAR_BLACK, 0));
  c.fillStyle = g;
  c.fill(p, 'evenodd');
  void i;
}

/** L3: the hanging enamel lamp over the bench's left end (ch04-s02 .. s05's lamp; its light: LAMP below) */
function hangingLamp(c: C, env: PaintEnv) {
  c.fillStyle = mixLab(env.fill('set'), PUPPET_NEAR_BLACK, 0.35);
  c.fillRect(234, -300, 3, 432);
  c.beginPath();
  c.moveTo(220, 128);
  c.lineTo(252, 128);
  c.lineTo(254, 138);
  c.lineTo(292, 158);
  c.lineTo(180, 158);
  c.lineTo(218, 138);
  c.closePath();
  c.fill();
}
/** where the hanging lamp's light sits (an L3 practical, painted before L4) */
export const LAMP = { x: 236, y: 156, seed: 47, radius: 120 } as const;

/** L3: the long bench edge-on, its lamp at left, a few plates pinned along its back edge */
function benchBack(c: C, env: PaintEnv, x0: number, x1: number) {
  const ink = env.fill('set');
  const plates = [[96, 470, 120, 84], [470, 486, 96, 66], [880, 478, 110, 76]];
  for (const [x, y, w, h] of plates) {
    if (x > x1) continue;
    c.fillStyle = mixLab(mixLab('#e2cfa4', env.mood.halo, 0.4), env.mood.haze, 0.38);
    c.fillRect(x, y, w, h);
    c.fillStyle = withAlpha(env.mood.ink, 0.2);
    for (let i = 0; i < 4; i++) c.fillRect(x + w * 0.12, y + h * (0.22 + i * 0.17), w * (0.7 - (i % 2) * 0.2), 1.6);
  }
  // a coil of copper wire on the bench (the dive's emblem: a bit of the line, bent)
  c.strokeStyle = withAlpha(mixLab('#9c5a31', env.mood.haze, 0.35), 0.8);
  c.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    c.beginPath();
    c.ellipse(1060 + i * 3, 548, 22 - i * 2, 7 - i * 0.6, 0, 0, Math.PI * 2);
    c.stroke();
  }
  // the bench top and body, running the whole way
  c.fillStyle = ink;
  c.fillRect(x0, 556, x1 - x0, 14);
  c.fillStyle = mixLab(ink, env.mood.fg, 0.35);
  c.fillRect(x0, 570, x1 - x0, 210);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.5);
  c.lineWidth = 1.4;
  c.beginPath();
  c.moveTo(x0, 556);
  c.lineTo(x1, 556);
  c.stroke();
  c.strokeStyle = withAlpha(env.mood.rim, 0.1);
  for (let x = x0 + 40; x < x1; x += 210) c.strokeRect(x, 584, 170, 46);
  // trestle legs, every 700 px
  c.fillStyle = mixLab(ink, env.mood.fg, 0.5);
  for (let x = x0 + 160; x < x1; x += 700) c.fillRect(x, 640, 22, 140);
}

// ---------------------------------------------------------------- near planes
/** L5: the near bench edge across the foot of the frame (blurred), spanning [x0, x1] */
export function nearEdge(f: Frame, key: string, o: RoomOpts, x0 = -260, x1 = 1560) {
  f.layer('L5', (c) => {
    blend2(f, c, `ch04bench/${key}/L5`, 'L5', o, x0, 620, x1 - x0, 420, (cc, env) => {
      cc.fillStyle = mixLab(env.mood.fg, env.mood.ink, 0.5);
      cc.beginPath();
      cc.moveTo(x0, 664);
      cc.lineTo(x1, 656);
      cc.lineTo(x1, 1040);
      cc.lineTo(x0, 1040);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.5);
      cc.lineWidth = 2;
      cc.beginPath();
      cc.moveTo(x0, 664);
      cc.lineTo(x1, 656);
      cc.stroke();
    });
  });
}

/** L6: the black turned post at the frame's right edge (x 1218 rest), with the card's clip wire */
export function nearPost(f: Frame, key: string, o: RoomOpts, x = 1218) {
  f.layer('L6', (c) => {
    blend2(f, c, `ch04bench/${key}/L6`, 'L6', o, x - 90, -40, 180, 900, (cc, env) => {
      cc.fillStyle = env.fill('fg');
      cc.beginPath();
      cc.ellipse(x, 40, 26, 18, 0, 0, Math.PI * 2);
      cc.rect(x - 28, 50, 56, 14);
      cc.rect(x - 20, 64, 40, 800);
      cc.rect(x - 32, 600, 64, 16);
      cc.rect(x - 30, 300, 60, 10);
      cc.fill();
    });
  });
}

// ---------------------------------------------------------------- the card clipped to the post
export interface CardLine {
  text: string;
  /** 0..1 the line's ink (before the card's own alpha) */
  ink: number;
  /** a warm emphasis 0..1 (copper ink) */
  hot?: number;
  /** the line inked term by term (each segment its own ink); text is then the whole line (for the probe) */
  segs?: { text: string; ink: number; hot?: number }[];
}
export interface PostCardOpts {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** paper opacity 0..1 (use cardPaperAlpha) */
  paper: number;
  lines: CardLine[];
  /** px between baselines */
  lead?: number;
  size?: number;
  /** a small swing on twos (radians) */
  swing?: number;
  /** where the clip wire runs to (the post) */
  clipTo?: { x: number; y: number };
  /** text only (a second set of lines inked onto a card another call already drew) */
  bare?: boolean;
}
export function postCard(c: C, env: PaintEnv, o: PostCardOpts) {
  if (o.paper <= 0.001 && o.lines.every((l) => l.ink <= 0.001)) return;
  const size = o.size ?? 22;
  const lead = o.lead ?? size * 1.45;
  c.save();
  // the clip wire from the post to the clip
  if (o.clipTo && !o.bare) {
    c.strokeStyle = withAlpha(PUPPET_NEAR_BLACK, 0.9 * clamp01(o.paper * 1.5));
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(o.clipTo.x, o.clipTo.y);
    c.quadraticCurveTo((o.clipTo.x + o.x + o.w * 0.5) / 2, o.y - 26, o.x + o.w * 0.5, o.y - 6);
    c.stroke();
  }
  c.translate(o.x + o.w / 2, o.y);
  c.rotate(o.swing ?? 0);
  c.translate(-o.w / 2, 0);
  c.globalAlpha *= clamp01(o.paper);
  if (!o.bare) paperAndClip(c, env, o);
  c.globalAlpha = 1;
  const paperA = clamp01(o.paper);
  if (!o.bare) cardProbe(c, o.id, 0, 0, o.w, o.h, paperA, Math.max(...o.lines.map((l) => l.ink)) * paperA);
  inkLines(c, o, size, lead, paperA);
  c.restore();
}
function paperAndClip(c: C, env: PaintEnv, o: PostCardOpts) {
  // paper with a soft shadow and a deckled hint
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.28);
  c.fillRect(3, 4, o.w, o.h);
  c.fillStyle = mixLab(mixLab(PAPER, env.mood.halo, 0.22), env.mood.core, 0.1);
  c.fillRect(0, 0, o.w, o.h);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, PAPER_INK, 0.4), 0.45);
  c.lineWidth = 1;
  c.strokeRect(0.5, 0.5, o.w - 1, o.h - 1);
  // the bulldog clip
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.rect(o.w / 2 - 15, -8, 30, 14);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.6);
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(o.w / 2 - 15, -8);
  c.lineTo(o.w / 2 + 15, -8);
  c.stroke();
}
function inkLines(c: C, o: PostCardOpts, size: number, lead: number, paperA: number) {
  textRole(c, 'subject', () => {
    c.font = `500 ${size}px ${FONT.mono}`;
    c.textBaseline = 'alphabetic';
    c.textAlign = 'left';
    o.lines.forEach((l, i) => {
      if (l.ink <= 0.001) return;
      const y = 16 + size * 0.8 + i * lead;
      if (l.segs) {
        let x = 18;
        for (const sg of l.segs) {
          if (sg.ink > 0.001) {
            c.fillStyle = withAlpha(mixLab(PAPER_INK, '#8a4421', clamp01(sg.hot ?? 0) * 0.8), clamp01(sg.ink) * clamp01(l.ink) * paperA);
            c.fillText(sg.text, x, y);
          }
          x += c.measureText(sg.text).width;
        }
      } else {
        c.fillStyle = withAlpha(mixLab(PAPER_INK, '#8a4421', clamp01(l.hot ?? 0) * 0.8), clamp01(l.ink) * paperA);
        c.fillText(l.text, 18, y);
      }
      textProbe(c, `${o.id}/${i}`, 18, y - size * 0.8, c.measureText(l.text).width, size, clamp01(l.ink) * paperA);
    });
  });
}

// ---------------------------------------------------------------- the lever
export interface LeverOpts {
  x: number;
  y: number;
  /** needle length (stage px), default 64 */
  r?: number;
  /** what it reads: 0..1 on the arc; > 1 swings past the stop (s07) */
  value: number;
  /** stand height below the hub (to the floor rule) */
  stand?: number;
  /** 0..1 the 1-stop bent over by a value past it */
  bend?: number;
  /** 0..1 the half tick's emphasis (s06 'reads a half') */
  halfGlow?: number;
  /** a faint pencil arc past the stop out to `beyond` (s07: to 2) */
  beyond?: number;
}
const LEVER_A0 = -Math.PI * 0.75;
const LEVER_SPAN = Math.PI * 0.5;
export const leverAngle = (v: number) => LEVER_A0 + v * LEVER_SPAN;
export function leverGauge(c: C, env: PaintEnv, o: LeverOpts) {
  const R = o.r ?? 64;
  const { x, y } = o;
  const rimC = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.75);
  // the stand
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(x - 5, y, 10, o.stand ?? 90);
  c.fillRect(x - 22, y + (o.stand ?? 90) - 6, 44, 8);
  // the gauge arc (0..1) and its ticks: 0, a half, 1
  c.strokeStyle = rimC;
  c.lineWidth = 1.8;
  c.beginPath();
  c.arc(x, y, R * 0.86, LEVER_A0, LEVER_A0 + LEVER_SPAN);
  c.stroke();
  for (const v of [0, 0.5, 1]) {
    const a = leverAngle(v);
    const long = v === 0.5 ? 0.1 : 0.16;
    c.strokeStyle = v === 0.5 ? withAlpha(mixLab(env.mood.rim, env.mood.core, 0.7), 0.6 + 0.4 * clamp01(o.halfGlow ?? 0)) : rimC;
    c.lineWidth = v === 0.5 ? 1.6 + 1.4 * clamp01(o.halfGlow ?? 0) : 2;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * R * (0.86 - long * 0.5), y + Math.sin(a) * R * (0.86 - long * 0.5));
    c.lineTo(x + Math.cos(a) * R * (0.86 + long), y + Math.sin(a) * R * (0.86 + long));
    c.stroke();
  }
  // a faint pencil arc past the stop (where a reading of 2 lands)
  if ((o.beyond ?? 0) > 1) {
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.haze, 0.3), 0.35);
    c.setLineDash([3, 4]);
    c.lineWidth = 1.2;
    c.beginPath();
    c.arc(x, y, R * 0.86, LEVER_A0 + LEVER_SPAN, leverAngle(o.beyond ?? 1));
    c.stroke();
    c.setLineDash([]);
  }
  // stop pegs just outside 0 and 1; the 1 peg bends over when the needle is forced past it
  const peg = (v: number, bend: number) => {
    const a = leverAngle(v);
    const px = x + Math.cos(a) * R * 1.02, py = y + Math.sin(a) * R * 1.02;
    c.save();
    c.translate(px, py);
    c.rotate(a + Math.PI / 2 + bend * 1.1);
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.fillRect(-2.6, -2, 5.2, 16);
    c.fillStyle = copperOf(env, 0.3);
    c.beginPath();
    c.arc(0, 0, 3.6, 0, Math.PI * 2);
    c.fill();
    c.restore();
  };
  peg(-0.07, 0);
  peg(1.07, clamp01(o.bend ?? 0));
  // the needle
  const a = leverAngle(o.value);
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.moveTo(x + Math.cos(a + Math.PI / 2) * 4.5, y + Math.sin(a + Math.PI / 2) * 4.5);
  c.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R);
  c.lineTo(x + Math.cos(a - Math.PI / 2) * 4.5, y + Math.sin(a - Math.PI / 2) * 4.5);
  c.lineTo(x - Math.cos(a) * 12, y - Math.sin(a) * 12);
  c.closePath();
  c.fill();
  c.beginPath();
  c.arc(x, y, 10, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = copperOf(env, 0.35);
  c.beginPath();
  c.arc(x, y, 3.6, 0, Math.PI * 2);
  c.fill();
}

/** an underdamped settle from v0 to v1 starting at t0 (on twos: pass tq) */
export function settle(tq: number, t0: number, v0: number, v1: number, o: { k?: number; w?: number } = {}) {
  if (tq <= t0) return v0;
  const tau = tq - t0;
  const k = o.k ?? 4.2;
  const w = o.w ?? 11;
  return v1 + (v0 - v1) * Math.exp(-k * tau) * Math.cos(w * tau);
}

// ---------------------------------------------------------------- the marble
export function marble(c: C, env: PaintEnv, x: number, y: number, r: number, roll = 0) {
  const gr = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  gr.addColorStop(0, mixLab(env.mood.core, '#ffffff', 0.25));
  gr.addColorStop(0.45, mixLab('#b8893e', env.mood.halo, 0.3));
  gr.addColorStop(1, mixLab('#5b3f18', PUPPET_NEAR_BLACK, 0.4));
  c.fillStyle = gr;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha('#3b2a12', 0.5);
  c.lineWidth = 1.1;
  c.beginPath();
  c.ellipse(x, y, r * 0.92, r * 0.32, roll, 0, Math.PI);
  c.stroke();
}

// ---------------------------------------------------------------- shutters, knob, tray
export interface ShutterOpts {
  /** the shutter's x (centre) and the belt's top surface y */
  x: number;
  y: number;
  /** frame height above the belt */
  h?: number;
  /** open fraction 0..1 (what it passes); values > 1 bulge the frame (s07 'over-open'), < 0 invert the panel */
  open: number;
  /** horizontal squash 0..1 (the paper-flip into a knob) */
  sx?: number;
}
export function shutter(c: C, env: PaintEnv, o: ShutterOpts) {
  const h = o.h ?? 64;
  const sx = o.sx ?? 1;
  if (sx <= 0.01) return;
  const open = o.open;
  c.save();
  c.translate(o.x, 0);
  c.scale(sx, 1);
  // the frame (two black posts and a lintel) standing over the belt
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.fillRect(-14, o.y - h - 8, 28, 8);
  c.fillRect(-14, o.y - h, 5, h + 10);
  c.fillRect(9, o.y - h, 5, h + 10);
  // the paper panel: hangs from the lintel, covers (1 − open) of the gap
  const cover = Math.max(0, Math.min(1, 1 - open));
  if (cover > 0) {
    c.fillStyle = mixLab(mixLab(PAPER, env.mood.halo, 0.25), env.mood.set, 0.3);
    c.fillRect(-9, o.y - h, 18, h * cover);
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.75);
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-9, o.y - h + h * cover);
    c.lineTo(9, o.y - h + h * cover);
    c.stroke();
    // paper fibre cut-lines on the panel
    c.strokeStyle = withAlpha(PAPER_INK, 0.12);
    c.lineWidth = 0.8;
    for (let i = 1; i < 4; i++) {
      const yy = o.y - h + h * cover * (i / 4);
      c.beginPath();
      c.moveTo(-7, yy);
      c.lineTo(7, yy);
      c.stroke();
    }
  }
  // the rim on the lintel's top (lamp side)
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.7);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(-14, o.y - h - 8);
  c.lineTo(14, o.y - h - 8);
  c.stroke();
  c.restore();
}

/** the shutter redrawn as a dimmer knob turned to `open` (0 = off at the left stop, 1 = full at the right) */
export function dimmerKnob(c: C, env: PaintEnv, o: { x: number; y: number; r?: number; open: number; sx?: number }) {
  const r = o.r ?? 26;
  const sx = o.sx ?? 1;
  if (sx <= 0.01) return;
  c.save();
  c.translate(o.x, o.y);
  c.scale(sx, 1);
  const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
  // the scale: a ring of ticks from off to full, the lit arc up to the setting
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.3), 0.6);
  c.lineWidth = 1.4;
  c.beginPath();
  for (let i = 0; i <= 10; i++) {
    const a = a0 + (a1 - a0) * (i / 10);
    c.moveTo(Math.cos(a) * (r + 4), Math.sin(a) * (r + 4));
    c.lineTo(Math.cos(a) * (r + (i % 5 === 0 ? 11 : 8)), Math.sin(a) * (r + (i % 5 === 0 ? 11 : 8)));
  }
  c.stroke();
  c.strokeStyle = withAlpha(mixLab(env.mood.halo, env.mood.core, 0.5), 0.9);
  c.lineWidth = 3;
  c.beginPath();
  c.arc(0, 0, r + 4, a0, a0 + (a1 - a0) * clamp01(o.open));
  c.stroke();
  // the knob: a black disc with knurled edge and a pointer
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rr = i % 2 ? r : r - 2.2;
    if (i === 0) c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
  const pa = a0 + (a1 - a0) * clamp01(o.open);
  c.strokeStyle = mixLab(PAPER, env.mood.core, 0.3);
  c.lineWidth = 3;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(Math.cos(pa) * r * 0.25, Math.sin(pa) * r * 0.25);
  c.lineTo(Math.cos(pa) * r * 0.82, Math.sin(pa) * r * 0.82);
  c.stroke();
  c.lineCap = 'butt';
  c.restore();
}

/** the feeder cabinet at the belts' start: the tiles come out of its two slots (x = its right face) */
export function feeder(c: C, env: PaintEnv, x: number, yTop: number, yBot: number, slots: number[]) {
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.rect(x - 66, yTop, 66, yBot - yTop);
  // slot mouths (holes: the backlight shows through above each belt)
  for (const y of slots) c.rect(x - 10, y - 48, 10, 44);
  c.fill('evenodd');
  c.fillRect(x - 74, yTop - 8, 82, 10);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.65);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(x - 74, yTop - 8);
  c.lineTo(x + 8, yTop - 8);
  c.stroke();
  // it hangs from the beam above on two rods
  c.fillRect(x - 58, -40, 5, yTop + 32);
  c.fillRect(x - 18, -40, 5, yTop + 32);
}

/** the black output tray, top-centre (x, y) = the tray floor's centre; stand = a post down to that y */
export function tray(c: C, env: PaintEnv, x: number, y: number, w: number, d = 30, stand?: number) {
  const ink = PUPPET_NEAR_BLACK;
  if (stand !== undefined) {
    c.fillStyle = ink;
    c.fillRect(x - 4, y, 8, stand - y);
    c.fillRect(x - 24, stand - 6, 48, 8);
  }
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(x - w / 2 - 6, y - d);
  c.lineTo(x - w / 2, y);
  c.lineTo(x + w / 2, y);
  c.lineTo(x + w / 2 + 6, y - d);
  c.lineTo(x + w / 2, y - d);
  c.lineTo(x + w / 2 - 4, y - 5);
  c.lineTo(x - w / 2 + 4, y - 5);
  c.lineTo(x - w / 2, y - d);
  c.closePath();
  c.fill();
  c.fillRect(x - 8, y, 16, 14);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.6), 0.8);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x - w / 2 - 6, y - d);
  c.lineTo(x - w / 2, y - d);
  c.moveTo(x + w / 2, y - d);
  c.lineTo(x + w / 2 + 6, y - d);
  c.stroke();
}

/** a soft low haze lying at board height (screen-locked band, seeded drift) */
export function boardHaze(c: C, env: PaintEnv, t: number, y: number, h: number, alpha: number) {
  const drift = (t * 7) % 400;
  for (let i = 0; i < 3; i++) {
    const cx = ((i * 520 + drift + hash1(i, 9) * 80) % 1800) - 260;
    const g = c.createRadialGradient(cx, y, 10, cx, y, 520);
    g.addColorStop(0, withAlpha(env.mood.haze, alpha));
    g.addColorStop(1, withAlpha(env.mood.haze, 0));
    c.save();
    c.translate(0, y);
    c.scale(1, h / 520);
    c.translate(0, -y);
    c.fillStyle = g;
    c.fillRect(cx - 520, y - 520, 1040, 1040);
    c.restore();
  }
}

// ---------------------------------------------------------------- the s06 machine's geometry (s07 starts on it)
/**
 * The ramps (sets/rampBench: a = 4.5 at BX on the floor rule BY, scale S), the lever between the boards and the
 * belts, the two belts across the upper middle (the 10 above, the 12 below) through one shutter frame at SX, and
 * the tray they throw their tiles into. Rest-screen L4 px.
 */
export const M6 = {
  BX: 400,
  BY: 596,
  S: 1.5,
  DOMAIN: [3.2, 5.8] as [number, number],
  MARBLE_R: 13,
  /** the lever hub, needle length */
  LX: 712,
  LY: 466,
  LR: 78,
  /** belts: start, shutter, ends (the 10 runs a little longer so its tile clears the 12's roller) */
  BELT_X0: 250,
  SX: 660,
  END10: 742,
  END12: 718,
  Y10: 170,
  Y12: 246,
  /** the tray floor centre and its two landing slots (12 lands left, 10 lands right) */
  TX: 900,
  TY: 404,
  TW: 150,
  SLOT12: 870,
  SLOT10: 932,
  /** tiles */
  TILE_S: 1.6,
} as const;
export const xOfA = (a: number) => M6.BX + (a - 4.5) * 110 * M6.S;
/** s06's camera at its last frame: s07's whip pan starts here */
export const CAM6_END = { x: 700, y: 342, z: 110, lens: 1 } as const;

/** one belt: the band and its two rollers, from x0 to x1 at top surface y */
export function beltBand(c: C, env: PaintEnv, x0: number, x1: number, y: number, spin = 0) {
  c.fillStyle = PUPPET_NEAR_BLACK;
  c.beginPath();
  c.roundRect(x0, y, x1 - x0, 9, 4.5);
  c.fill();
  for (const rx of [x0 + 4.5, x1 - 4.5]) {
    c.beginPath();
    c.arc(rx, y + 4.5, 8, 0, Math.PI * 2);
    c.fill();
    // a spoke on each roller, turning with the belt (on ones: the machine, not a puppet)
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.45);
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(rx, y + 4.5);
    c.lineTo(rx + Math.cos(spin) * 6, y + 4.5 + Math.sin(spin) * 6);
    c.stroke();
  }
  // the band's lit top edge
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.55);
  c.lineWidth = 1.3;
  c.beginPath();
  c.moveTo(x0 + 4, y + 0.5);
  c.lineTo(x1 - 4, y + 0.5);
  c.stroke();
}

export interface TileOpts {
  /** scale (1 = 34 × 26 px) */
  s?: number;
  /** warm glow behind (the fused answer catching the lamp) */
  glow?: number;
  /** a thin sliver (a value scaled to nothing) */
  sliver?: boolean;
  /** paper tint: copper (adds) or indigo (subtracts), the film's code */
  tint?: 'copper' | 'indigo';
  /** label alpha (the re-lettering crossfade) */
  label?: number;
  role?: 'subject' | 'texture';
}
/** a paper tile with a numeral, bottom-centre at (x, y) */
export function heroTile(c: C, env: PaintEnv, x: number, y: number, text: string, o: TileOpts = {}) {
  const s = o.s ?? 1;
  const w = 34 * s, h = (o.sliver ? 9 : 26) * s;
  if ((o.glow ?? 0) > 0) {
    const g = c.createRadialGradient(x, y - h / 2, 4, x, y - h / 2, 70 * s);
    g.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.5), 0.55 * (o.glow ?? 0)));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(x - 80 * s, y - h / 2 - 80 * s, 160 * s, 160 * s);
  }
  c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.3);
  c.fillRect(x - w / 2 + 2 * s, y - h + 2 * s, w, h);
  let paper = mixLab(mixLab('#e6d3a8', env.mood.halo, 0.3), env.mood.core, (o.glow ?? 0) * 0.4);
  if (o.tint === 'copper') paper = mixLab(paper, '#b9673a', 0.55);
  if (o.tint === 'indigo') paper = mixLab(paper, '#3a5296', 0.62);
  c.fillStyle = paper;
  c.fillRect(x - w / 2, y - h, w, h);
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.5), 0.6 + 0.4 * (o.glow ?? 0));
  c.lineWidth = 1.4;
  c.strokeRect(x - w / 2, y - h, w, h);
  const la = o.label ?? 1;
  if (la <= 0.001) return;
  textRole(c, o.role ?? 'subject', () => {
    const fs = o.sliver ? 13.5 * s : 15 * s;
    c.font = `${fs.toFixed(1)}px ${FONT.typewriter}`;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.fillStyle = withAlpha(o.tint === 'indigo' ? '#f1ead8' : PAPER_INK, la);
    const by = o.sliver ? y - h - 2 * s : y - h / 2 + fs * 0.36;
    c.fillText(text, x, by);
    c.textAlign = 'left';
  });
}
