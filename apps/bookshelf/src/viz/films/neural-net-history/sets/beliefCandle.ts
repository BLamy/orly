/**
 * neural-net-history — the CANDLE-CLOCK (staging.candleClock) and the long study shelf.
 *
 * CANDLE-CLOCK RULE: every belief candle is cut to the same lit height, 45 scored rings at 6 px per ring
 * (270 px at scale 1), its flame on the top ring and a small tag at its base giving the year it was lit.
 * It burns down one ring per year the belief is held. The burned wax stays above the stub as a ghost
 * paper SLEEVE (ring-scored, translucent in the haze), so sleeve + stub is always the full lit height and
 * the sleeve's length is the years. Live: a flame where sleeve meets stub. Out: the sleeve stays, dark,
 * with a thread of smoke. Guttered: a frayed rim at the join.
 *
 *   beliefCandle(c, { x, y, view, s?, burn?, flame?, ghost?, letters? }, env)
 *        x, y = base centre on the shelf (layer px); view = a CandleView from studyState (state, rings…)
 *        burn: extra rings (fractional) burned during the shot, for a candle burning down on screen
 *        flame: 0..1 flame strength override (lighting, guttering); ghost: 0..1 the ch01-s05 ghost look
 *   candleFlame(o)        → the flame's world point (attach f.practical({ kind: 'candle' }) there)
 *   candleShelf(c, { x, y, views, s?, pitch?, ... }, env)   the shelf plank + every candle in its slot
 *   shelfSlotX(o, slot)   → the x of a shelf slot (for hands targets / camera framing)
 *
 * Lettering: the belief in its era's typeface (Special Elite to the 1970s, VT323 for the 1980s, IBM Plex
 * Mono from 1989), small caps, rising up the candle; a paraphrase, never in quotation marks. It is a
 * texture at shelf distance; the shot's own label card is what the viewer reads.
 *
 * NAMING RULE (review round 1): when the narration names a candle (studyState CANDLE_CUES: the shot, line and
 * word), its label turns HORIZONTAL and large beside the flame for about 2 s, with its date range
 * ("lit 1969 · out 1986 · 17 years"), at or over the kit's legibility floor (22 px cap height at 1080p, under
 * whatever camera is on the shelf), and its neighbours dim. candleShelf applies it by itself: it reads the
 * painting shot (core/paintContext) and the narration clock. Pass `named: {}` to switch it off, or your own
 * { candleId: 0..1 } to drive it. A lone beliefCandle takes `named` (0..1) directly.
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, capPx1080, legibleSize } from '../../../film/silhouette/type';
import { isBaking, paintContext, queueOverlay } from '../../../film/core/paintContext';
import { filigreeCorner } from './occluders';
import { hash1 } from '../../../film/core/frame';
import { flame as flameShape } from '../../../film/silhouette/props/_kit';
import { LIT_HEIGHT, RING_PX, RINGS, candleDates, candleNamingAt, type CandleView } from './studyState';

export interface CandleDraw {
  x: number;
  y: number;
  view: CandleView;
  /** scale (1 = the rule's 6 px rings) */
  s?: number;
  /** extra rings burned during the shot (fractional allowed) */
  burn?: number;
  /** flame strength override 0..1 (lighting, guttering); default 1 when live */
  flame?: number;
  /** ghost look (ch01-s05): 0 = solid … 1 = a pale paper outline */
  ghost?: number;
  /** lettering alpha (0 hides it); default .6 */
  letters?: number;
  /** smoke thread strength override 0..1 */
  smoke?: number;
  /** seed for flicker/smoke */
  seed?: number;
  /** draw the flame shape here (default true); pass false when the shot adds f.practical({ kind: 'candle' }) at candleFlame(o), which draws its own flame */
  drawFlame?: boolean;
  /** 0..1: the narration is naming this candle (horizontal enlarged label + date range; vertical lettering fades) */
  named?: number;
}

const WIDTH: Record<string, number> = { candle: 30, taper: 13, blank: 30, match: 4 };
export const fontForYear = (y: number) => (y < 1980 ? FONT.typewriter : y < 1989 ? FONT.phosphor : FONT.mono);

/** rings burned (stub top) for a draw call */
function burned(o: CandleDraw) {
  const v = o.view;
  const max = v.years ?? RINGS;
  return Math.max(0, Math.min(RINGS, Math.min(max, v.rings + (o.burn ?? 0))));
}

/** the flame point (world): where sleeve meets stub, plus the flame's height */
export function candleFlame(o: CandleDraw): { x: number; y: number } {
  const s = o.s ?? 1;
  const r = burned(o);
  return { x: o.x, y: o.y - (LIT_HEIGHT - r * RING_PX) * s - 2 * s };
}

function ringScores(c: CanvasRenderingContext2D, x0: number, x1: number, yTop: number, yBot: number, s: number) {
  c.beginPath();
  for (let i = 1; i < RINGS; i++) {
    const yy = yBot - i * RING_PX * s;
    if (yy < yTop - 0.1 || yy > yBot + 0.1) continue;
    const major = i % 5 === 0;
    const inset = major ? 0 : (x1 - x0) * 0.18;
    c.moveTo(x0 + inset, yy);
    c.lineTo(x1 - inset, yy);
  }
  c.stroke();
}

export function beliefCandle(c: CanvasRenderingContext2D, o: CandleDraw, env: PaintEnv) {
  const v = o.view;
  if (o.named === undefined && !isBaking()) {
    // the naming rule, by itself: the painting shot's narration names this candle now
    const pc = paintContext();
    const k = pc ? candleNamingAt(pc.shotId, pc.timing, env.t)[v.id] ?? 0 : 0;
    if (k > 0) o = { ...o, named: k };
  }
  const s = o.s ?? 1;
  const seed = o.seed ?? v.slot * 13 + 5;
  const ghost = Math.max(0, Math.min(1, o.ghost ?? (v.ghost ? 1 : 0)));
  const ink = env.fill('ink');
  const rim = env.mood.rim;
  const haze = env.mood.haze;
  c.save();
  c.globalAlpha *= 1 - ghost * 0.55;

  if (v.kind === 'match') {
    // the struck match: lying flat on the shelf, blackened head, a small tag
    const L = 64 * s;
    c.fillStyle = mixLab(ink, env.mood.set, 0.4);
    c.fillRect(o.x - L / 2, o.y - 3.2 * s, L, 3.2 * s);
    c.fillStyle = ink;
    c.beginPath();
    c.ellipse(o.x + L / 2, o.y - 2.4 * s, 4.6 * s, 3.4 * s, 0, 0, Math.PI * 2);
    c.fill();
    // char line along the first third
    c.fillStyle = withAlpha(env.mood.fg, 0.9);
    c.fillRect(o.x + L * 0.15, o.y - 3.2 * s, L * 0.35, 3.2 * s);
    tag(c, o.x - L * 0.3, o.y, v.tag, s, env, ghost);
    c.restore();
    return;
  }

  const w = WIDTH[v.kind] * s;
  const H = LIT_HEIGHT * s;
  const r = burned(o);
  const stubTop = o.y - H + r * RING_PX * s;
  const top = o.y - H;
  const x0 = o.x - w / 2, x1 = o.x + w / 2;
  const live = v.state === 'live' || (o.flame !== undefined && o.flame > 0);
  const frayed = v.state === 'guttered' || (v.frayed && v.state === 'out');

  // the GHOST SLEEVE (burned years): translucent ring-scored paper; dark once the candle is out
  if (r > 0 && v.kind !== 'blank') {
    const out = v.state === 'out' || v.state === 'guttered';
    c.fillStyle = out ? withAlpha(mixLab(ink, env.mood.set, 0.35), 0.62 + 0.2 * (1 - ghost)) : withAlpha(mixLab(haze, env.mood.halo, 0.45), 0.34);
    c.fillRect(x0, top, w, stubTop - top);
    c.strokeStyle = withAlpha(rim, out ? 0.22 : 0.38);
    c.lineWidth = Math.max(0.6, 0.9 * s);
    ringScores(c, x0 + 1.5 * s, x1 - 1.5 * s, top, o.y, s);
    c.strokeStyle = withAlpha(rim, out ? 0.28 : 0.45);
    c.lineWidth = Math.max(0.7, 1.1 * s);
    c.strokeRect(x0, top, w, stubTop - top);
    // the sleeve's top lip (the lit height, never lost)
    c.fillStyle = withAlpha(rim, out ? 0.3 : 0.5);
    c.fillRect(x0 - 1 * s, top - 1.2 * s, w + 2 * s, 1.6 * s);
  }

  // the STUB (unburned wax): an ink paper-cut taper, ring-scored, rim-lit on the flame side
  const stub = new Path2D();
  if (frayed && r > 0) {
    // a frayed rim: a ragged, melted top
    stub.moveTo(x0, o.y);
    stub.lineTo(x0, stubTop + 3 * s);
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const xx = x0 + (w * i) / n;
      const yy = stubTop + (2.5 + 3.5 * (hash1(i, seed + 3) * 0.5 + 0.5)) * s * (i % 2 ? 1 : 0.2);
      stub.lineTo(xx, yy);
    }
    stub.lineTo(x1, o.y);
    stub.closePath();
    // a drip down one side
    stub.moveTo(x1 - 2 * s, stubTop + 4 * s);
    stub.quadraticCurveTo(x1 + 3 * s, stubTop + 14 * s, x1 + 1.5 * s, stubTop + 24 * s);
    stub.lineTo(x1 - 1 * s, stubTop + 24 * s);
    stub.closePath();
  } else {
    stub.rect(x0, stubTop, w, o.y - stubTop);
    if (live) {
      // the melt-cup at the flame: a slight concave lip
      stub.moveTo(x0, stubTop);
      stub.quadraticCurveTo(o.x, stubTop + 3.5 * s, x1, stubTop);
    }
  }
  c.fillStyle = ink;
  c.fill(stub, 'nonzero');
  if (ghost > 0) {
    c.strokeStyle = withAlpha(rim, 0.5 * ghost);
    c.lineWidth = Math.max(0.7, 1.2 * s);
    c.stroke(stub);
  }
  // ring scores on the stub (cut-lines in rim)
  if (v.kind !== 'blank') {
    c.strokeStyle = withAlpha(rim, 0.2);
    c.lineWidth = Math.max(0.6, 0.8 * s);
    ringScores(c, x0 + 1.5 * s, x1 - 1.5 * s, stubTop + 2 * s, o.y, s);
  }
  // rim on the stub's flame-facing top edge
  const fk = live ? (o.flame ?? 1) : 0;
  if (fk > 0) {
    const g = c.createLinearGradient(0, stubTop, 0, stubTop + 60 * s);
    g.addColorStop(0, withAlpha(env.mood.core, 0.5 * fk));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = g;
    c.fillRect(x0, stubTop, w, 60 * s);
  }

  // LETTERING: the belief rising up the candle, in its era's face, wrapped into up to two columns
  const la = (o.letters ?? 0.6) * (1 - ghost) * (1 - (o.named ?? 0));
  if (v.text && la > 0 && v.kind === 'candle') {
    c.save();
    c.translate(o.x, o.y - 8 * s);
    c.rotate(-Math.PI / 2);
    const face = fontForYear(v.litYear);
    const size = (face === FONT.phosphor ? 11 : 8.4) * s;
    c.font = `400 ${size}px ${face}`;
    const maxLen = H - 24 * s;
    const words = v.text.split(' ');
    const lines: string[] = [];
    let line = '';
    for (const wd of words) {
      const t = line ? `${line} ${wd}` : wd;
      if (c.measureText(t).width > maxLen && line) {
        lines.push(line);
        line = wd;
      } else line = t;
    }
    if (line) lines.push(line);
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    const lh = size * 1.12;
    lines.slice(0, 2).forEach((l, i) => {
      const yy = (i - (Math.min(2, lines.length) - 1) / 2) * lh;
      // letters on wax read light (cut into the ink); letters on the ghost sleeve read through it
      c.fillStyle = withAlpha(rim, la);
      c.fillText(l, 0, yy);
    });
    c.restore();
  }

  // the FLAME (on the top ring for a new candle; at the join as it burns)
  if (live && fk > 0 && o.drawFlame === false) {
    // the shot's f.practical draws the flame and its light; leave the wick
    const f = candleFlame(o);
    c.fillStyle = ink;
    c.fillRect(f.x - 0.7 * s, f.y - 1 * s, 1.4 * s, 4 * s);
  } else if (live && fk > 0) {
    const f = candleFlame(o);
    c.save();
    c.translate(f.x, f.y + 2 * s);
    c.scale(s * 1.8, s * 1.8);
    flameShape(c, env, 0, 0, 9 * Math.max(0.25, fk), seed, 0.85 + 0.25 * fk);
    c.restore();
    // wick
    c.fillStyle = ink;
    c.fillRect(f.x - 0.7 * s, f.y - 1 * s, 1.4 * s, 4 * s);
  } else if ((v.state === 'out' || v.state === 'guttered') && v.kind !== 'blank') {
    // a dead wick; guttered ones keep a dull ember
    c.fillStyle = ink;
    c.fillRect(o.x - 0.8 * s, stubTop - 5 * s, 1.6 * s, 6 * s);
    if (v.state === 'guttered') {
      c.fillStyle = withAlpha(env.mood.halo, 0.55);
      c.beginPath();
      c.arc(o.x, stubTop - 5 * s, 1.4 * s, 0, Math.PI * 2);
      c.fill();
    }
  }
  // SMOKE: a thin wavering thread from a put-out wick (drawn on ones from env.t)
  const sm = o.smoke ?? (v.smoke ? 1 : 0);
  if (sm > 0 && !live) {
    c.save();
    c.strokeStyle = withAlpha(mixLab(haze, rim, 0.3), 0.32 * sm);
    c.lineWidth = Math.max(0.8, 1.4 * s);
    c.lineCap = 'round';
    c.beginPath();
    const base = { x: o.x, y: stubTop - 5 * s };
    c.moveTo(base.x, base.y);
    const t = env.t;
    for (let i = 1; i <= 24; i++) {
      const u = i / 24;
      const yy = base.y - u * 150 * s;
      const xx = base.x + Math.sin(u * 7 - t * 1.3 + seed) * (2 + 14 * u) * s + Math.sin(u * 3.1 - t * 0.6 + seed * 2) * 6 * u * s;
      c.lineTo(xx, yy);
    }
    c.stroke();
    c.restore();
  }

  tag(c, o.x + w / 2 + 3 * s, o.y, v.tag, s, env, ghost);
  c.restore();
  if ((o.named ?? 0) > 0) namedLabel(c, o, env);
}

/**
 * The named candle's label: horizontal, beside the flame, the belief in its era's face over its date range, both
 * at or over the legibility floor under the current camera; a fine leader to the flame. Flips to the candle's left
 * when the candle sits in the right third of the frame.
 */
export function namedLabel(c: CanvasRenderingContext2D, o: CandleDraw, env: PaintEnv): void {
  const k = Math.max(0, Math.min(1, o.named ?? 0));
  const v = o.view;
  if (k <= 0 || (!v.text && v.kind !== 'match')) return;
  const s = o.s ?? 1;
  const f = v.kind === 'match' ? { x: o.x, y: o.y - 8 * s } : candleFlame(o);
  // where the flame is on screen, in stage px (the label is drawn screen-locked, above fog and near layers)
  const m = c.getTransform();
  const px = env.pxScale || 1.5;
  const sx = (m.a * f.x + m.c * f.y + m.e) / px;
  const sy = (m.b * f.x + m.d * f.y + m.f) / px;
  const wax = Math.hypot(m.a, m.b) / px; // stage px per candle unit (how big the candle is on screen)
  if (sx < -200 || sx > 1480 || sy < -200 || sy > 920) return;
  queueOverlay((cc) => drawNamedCard(cc, { sx, sy, k, v, gapX: Math.max(14, 16 * s * wax) }, env));
}

function drawNamedCard(c: CanvasRenderingContext2D, o: { sx: number; sy: number; k: number; v: CandleView; gapX: number }, env: PaintEnv) {
  const { v, k } = o;
  const face = fontForYear(v.litYear);
  // 26 px cap height on a 1080p frame (the floor is 22)
  const size = Math.max(legibleSize(c, `400 18px ${face}`, 18), (18 * 26) / Math.max(1e-3, capPx1080(c, `400 18px ${face}`)));
  const dSize = legibleSize(c, `italic 400 18px ${FONT.text}`, 18);
  const tFont = `400 ${size}px ${face}`;
  const dFont = `italic 400 ${dSize}px ${FONT.text}`;
  const words = (v.text || '').split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const wd of words) {
    const nx = cur ? `${cur} ${wd}` : wd;
    if (cur && nx.length > 22) {
      lines.push(cur);
      cur = wd;
    } else cur = nx;
  }
  if (cur) lines.push(cur);
  const dates = candleDates(v);
  c.save();
  c.font = tFont;
  const tw = Math.max(...lines.map((l) => c.measureText(l).width), 0);
  c.font = dFont;
  const dw = c.measureText(dates).width;
  const pad = 14;
  const lh = size * 1.2;
  const w = Math.max(tw, dw) + pad * 2;
  const h = lines.length * lh + dSize * 1.45 + pad * 1.7;
  const left = o.sx > 1280 * 0.62;
  let x0 = left ? o.sx - o.gapX - w : o.sx + o.gapX;
  x0 = Math.max(40, Math.min(1240 - w, x0));
  let y0 = o.sy - h * 0.4;
  y0 = Math.max(36, Math.min(720 * 0.86 - h, y0));
  const grow = 0.94 + 0.06 * k;
  c.globalAlpha = Math.min(1, k * 1.15);
  c.translate(x0 + w / 2, y0 + h / 2);
  c.scale(grow, grow);
  c.translate(-w / 2, -h / 2);
  // leader to the flame
  const lx = left ? w : 0;
  c.strokeStyle = withAlpha(env.mood.rim, 0.75);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(lx, h * 0.4);
  c.lineTo(o.sx - (x0 + w / 2) + w / 2, o.sy - (y0 + h / 2) + h / 2);
  c.stroke();
  // warm paper card with a cut-card shadow
  const paper = mixLab(env.mood.halo, '#efe4cc', 0.6);
  c.shadowColor = withAlpha('#000000', 0.45);
  c.shadowBlur = 10;
  c.shadowOffsetY = 4;
  c.fillStyle = paper;
  c.fillRect(0, 0, w, h);
  c.shadowColor = 'rgba(0,0,0,0)';
  c.shadowBlur = 0;
  c.shadowOffsetY = 0;
  c.strokeStyle = withAlpha(env.mood.ink, 0.35);
  c.lineWidth = 0.8;
  c.strokeRect(5, 5, w - 10, h - 10);
  const inkC = mixLab(env.mood.ink, '#1d160f', 0.5);
  c.fillStyle = inkC;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.font = tFont;
  lines.forEach((l, i) => c.fillText(l, pad, pad + size * 0.95 + i * lh));
  c.fillStyle = withAlpha(inkC, 0.85);
  c.font = dFont;
  c.fillText(dates, pad, pad + lines.length * lh + dSize * 1.05);
  c.restore();
}

/** the small paper tag at the base: hangs from a string, the year lit */
function tag(c: CanvasRenderingContext2D, x: number, y: number, text: string, s: number, env: PaintEnv, ghost: number) {
  if (!text) return;
  c.save();
  const tw = Math.max(26, text.length * 6.2) * s;
  const th = 12 * s;
  c.translate(x, y - 22 * s);
  c.rotate(0.12);
  c.strokeStyle = withAlpha(env.mood.rim, 0.4);
  c.lineWidth = Math.max(0.6, 0.8 * s);
  c.beginPath();
  c.moveTo(-3 * s, -6 * s);
  c.lineTo(2 * s, 0);
  c.stroke();
  const paper = mixLab(env.mood.setHaze, env.mood.halo, 0.55 * (1 - ghost * 0.5));
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(2 * s, 0);
  c.lineTo(2 * s + tw, 0);
  c.lineTo(2 * s + tw, th);
  c.lineTo(2 * s, th);
  c.lineTo(-2 * s, th / 2);
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(env.mood.ink, paper, 0.15);
  c.font = `400 ${9 * s}px ${FONT.typewriter}`;
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  c.fillText(text, 4 * s, th / 2 + 0.5 * s);
  c.restore();
}

// ---------------------------------------------------------------- the shelf
export interface ShelfDraw {
  /** left end of the shelf plank, its top surface y (layer px) */
  x: number;
  y: number;
  views: CandleView[];
  s?: number;
  /** spacing between candle slots (layer px at s = 1); default 92 */
  pitch?: number;
  /** extra gap before the window group (the China-race candles) */
  windowGap?: number;
  /** total plank length; default fits all slots */
  length?: number;
  /** per-candle overrides by id (burn, flame, ghost, smoke) */
  over?: Record<string, Partial<CandleDraw>>;
  /** draw only these candle ids (others skipped; the plank still drawn) */
  only?: string[];
  /** global ghost look (ch01-s05) */
  ghost?: number;
  /** skip unlit candles (default true: a candle stands on the shelf only once lit) */
  hideUnlit?: boolean;
  /** draw flame shapes (default true; false when practicals draw them) */
  drawFlames?: boolean;
  /** { candleId: 0..1 } candles being named (default: from the painting shot's narration, studyState CANDLE_CUES); {} = off */
  named?: Record<string, number>;
}

/** world x of a shelf slot's candle centre */
export function shelfSlotX(o: Pick<ShelfDraw, 'x' | 's' | 'pitch' | 'windowGap' | 'views'>, slot: number): number {
  const s = o.s ?? 1;
  const pitch = (o.pitch ?? 92) * s;
  const win = o.views.findIndex((v) => v.group === 'window');
  const gap = win >= 0 && slot >= win ? (o.windowGap ?? 70) * s : 0;
  const endGap = o.views[slot]?.group === 'end' ? 30 * s : 0;
  return o.x + 60 * s + slot * pitch + gap + endGap;
}

export function candleShelf(c: CanvasRenderingContext2D, o: ShelfDraw, env: PaintEnv) {
  const s = o.s ?? 1;
  const n = o.views.length;
  const L = o.length ?? shelfSlotX(o, n - 1) - o.x + 80 * s;
  // plank: a thick paper-cut shelf with a scalloped apron and brackets
  const ink = env.fill('ink');
  c.fillStyle = ink;
  c.fillRect(o.x, o.y, L, 12 * s);
  const ap = new Path2D();
  ap.moveTo(o.x, o.y + 12 * s);
  for (let xx = 0; xx <= L; xx += 24 * s) {
    ap.lineTo(o.x + xx, o.y + 12 * s);
    ap.quadraticCurveTo(o.x + xx + 12 * s, o.y + 22 * s, o.x + Math.min(L, xx + 24 * s), o.y + 12 * s);
  }
  ap.lineTo(o.x + L, o.y + 12 * s);
  ap.closePath();
  c.fill(ap);
  for (const bx of [o.x + 40 * s, o.x + L * 0.5, o.x + L - 40 * s]) {
    c.beginPath();
    c.moveTo(bx - 4 * s, o.y + 12 * s);
    c.lineTo(bx + 4 * s, o.y + 12 * s);
    c.lineTo(bx + 4 * s, o.y + 60 * s);
    c.quadraticCurveTo(bx - 2 * s, o.y + 30 * s, bx - 30 * s, o.y + 14 * s);
    c.closePath();
    c.fill();
    // a pierced cut-paper scroll in each bracket's angle (review round 1: filigree on the shelf)
    filigreeCorner(c, { x: bx + 4 * s, y: o.y + 12 * s, size: 44 * s, rot: Math.PI / 2 }, env);
  }
  // rim on the plank's top edge (the lamp side)
  c.fillStyle = withAlpha(env.mood.rim, 0.4);
  c.fillRect(o.x, o.y - 0.6 * s, L, 1.2 * s);
  // candles (the naming rule: the named candle's label comes forward, its neighbours dim)
  const only = o.only ? new Set(o.only) : null;
  const pc = paintContext();
  const named = o.named ?? (pc ? candleNamingAt(pc.shotId, pc.timing, env.t) : {});
  const shown = o.views.filter((v) => (!only || only.has(v.id)) && !((o.hideUnlit ?? true) && v.state === 'unlit' && !((o.over?.[v.id]?.flame ?? 0) > 0)));
  const kMax = Math.max(0, ...shown.map((v) => named[v.id] ?? 0));
  const labels: CandleDraw[] = [];
  for (const v of shown) {
    const ov = o.over?.[v.id];
    const nk = named[v.id] ?? 0;
    const d: CandleDraw = { x: shelfSlotX(o, v.slot), y: o.y, view: v, s, ghost: o.ghost, drawFlame: o.drawFlames, ...ov, named: 0 };
    c.save();
    if (kMax > 0 && nk <= 0) c.globalAlpha *= 1 - 0.55 * kMax;
    beliefCandle(c, d, env);
    c.restore();
    if (nk > 0) labels.push({ ...d, named: nk });
  }
  for (const d of labels) namedLabel(c, d, env); // on top of every candle
}

/** flame points of every live candle on a shelf (for f.practical) */
export function shelfFlames(o: ShelfDraw): { id: string; x: number; y: number; seed: number }[] {
  const out: { id: string; x: number; y: number; seed: number }[] = [];
  for (const v of o.views) {
    const ov = o.over?.[v.id];
    const live = v.state === 'live' || (ov?.flame ?? 0) > 0;
    if (!live || v.kind === 'match') continue;
    if (o.only && !o.only.includes(v.id)) continue;
    const p = candleFlame({ x: shelfSlotX(o, v.slot), y: o.y, view: v, s: o.s, ...ov });
    out.push({ id: v.id, x: p.x, y: p.y - 6 * (o.s ?? 1), seed: 300 + v.slot * 7 });
  }
  return out;
}
