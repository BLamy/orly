/**
 * typeSlugs / nextToken — tokens as printer's type, prediction as a typesetter's case.
 *
 *   typeSlugs(c, {x, y, tokens, size?, reveal?, highlight?, ghost?}, env) -> SlugLayout
 *       a composing stick holding one cast slug (logotype) per token; a token's leading
 *       space is a small dot on the slug's shoulder. y = the stick's floor.
 *       reveal 0..1 drops the slugs in one by one; highlight = token index to light;
 *       ghost = an empty, faintly lit slot of that width at the end (where the next sort goes)
 *
 *   nextToken(c, {x?, y?, w?, context?, candidates?, temperature?, reveal?, slide?, choose?, chosen?,
 *                 numbers?, caption?, candle?}, env)
 *       a full-stage composition (1280 wide from x): the context set in a composing stick,
 *       and below it a typesetter's case (cornice, broken pediment, a lit candle on top)
 *       with one drawer per candidate, labelled by a card on the case. Each drawer slides
 *       out by its REAL softmax probability p = softmax(logits / T) (slide distance <- p;
 *       the drawer's lit lip is the bar, its sort stands inside), then the chosen sort
 *       (default: the most probable) rises out and is set at the end of the line.
 *       reveal 0..1 line then case · slide 0..1 drawers open · choose 0..1 the sort travels
 *       temperature T (try 0.5 / 1 / 2.5) · caption: "p = softmax(z / T)" + T readout
 *
 *   NEXT_TOKEN_DEMO: the default context and ILLUSTRATIVE logits (not from a real model;
 *   say "for example" on screen). GPT2_SPLIT: a GPT-2-style split of the opening words.
 */
import type { PaintEnv } from '../../contracts';
import { mixLab, withAlpha } from '../palette';
import { MFONT, PARCH, candle, glow, label, ramp, smooth, softmax } from './kit';

/** GPT-2-style tokens (leading spaces belong to the token; "didn't" -> " didn" + "'t"). */
export const GPT2_SPLIT = ['The', ' animal', ' didn', "'t", ' cross', ' the', ' street'];
export const NEXT_TOKEN_DEMO = {
  context: ['The', ' animal', ' didn', "'t", ' cross', ' the', ' street', ' because', ' it', ' was', ' too'],
  /** illustrative logits, chosen by hand to look plausible; NOT model output */
  candidates: [
    { tok: ' tired', logit: 4.2 },
    { tok: ' wide', logit: 3.0 },
    { tok: ' busy', logit: 2.7 },
    { tok: ' scared', logit: 2.3 },
    { tok: ' slow', logit: 1.6 },
    { tok: ' dark', logit: 1.1 },
  ],
};

export interface SlugLayout {
  x0: number;
  x1: number;
  slots: { x: number; w: number }[];
  /** where the next slug would go */
  nextX: number;
  height: number;
}

function slugFont(size: number) {
  return `500 ${size}px ${MFONT.serif}`;
}

/** A single type slug, top-left at (x, y), width w, height h, carrying text. */
export function drawSlug(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string, size: number, lit: number, env: PaintEnv): void {
  const m = env.mood;
  const ink = env.fill('ink');
  const space = text.startsWith(' ');
  const body = text.replace(/^ /, '');
  // body: dark type metal, shoulder highlight, nick groove, and the face on top
  c.fillStyle = mixLab(ink, m.set, 0.35);
  c.fillRect(x, y, w, h);
  c.fillStyle = ink;
  c.fillRect(x, y + h * 0.72, w, h * 0.28);
  c.fillStyle = withAlpha(m.rim, 0.35 + 0.3 * lit);
  c.fillRect(x, y, w, 1.6);
  c.fillStyle = withAlpha(m.rim, 0.18);
  c.fillRect(x, y + h * 0.8, w, 1.2); // the nick
  c.fillStyle = withAlpha(m.ink, 0.6);
  c.fillRect(x + w - 1.2, y, 1.2, h);
  if (lit > 0) glow(c, x + w / 2, y + h * 0.36, Math.max(w, h) * 0.9, m.halo, 0.3 * lit);
  label(c, body, x + w / 2 + (space ? size * 0.12 : 0), y + h * 0.36 + size * 0.34, { size, font: MFONT.serif, weight: 500, color: mixLab(m.rim, m.core, lit), align: 'center' });
  if (space) {
    c.fillStyle = withAlpha(m.rim, 0.55);
    c.beginPath();
    c.arc(x + size * 0.32, y + h * 0.36 + size * 0.05, size * 0.07, 0, Math.PI * 2);
    c.fill();
  }
}

export function slugWidth(c: CanvasRenderingContext2D, tok: string, size: number): number {
  c.save();
  c.font = slugFont(size);
  const w = c.measureText(tok.replace(/^ /, '')).width;
  c.restore();
  return w + size * (tok.startsWith(' ') ? 1.05 : 0.7);
}

export interface TypeSlugsOpts {
  x: number;
  y: number;
  tokens: string[];
  size?: number;
  reveal?: number;
  highlight?: number;
  /** width of an empty lit slot at the end (0 = none) */
  ghost?: number;
  /** draw the stick (tray) under the slugs (default true) */
  stick?: boolean;
}

export function typeSlugs(c: CanvasRenderingContext2D, o: TypeSlugsOpts, env: PaintEnv): SlugLayout {
  const size = o.size ?? 28;
  const h = size * 1.9;
  const reveal = o.reveal ?? 1;
  const n = o.tokens.length;
  const ink = env.fill('ink');
  const m = env.mood;
  let x = o.x + 14;
  const slots = o.tokens.map((t) => {
    const w = slugWidth(c, t, size);
    const s = { x, w };
    x += w + 2;
    return s;
  });
  const lay: SlugLayout = { x0: o.x, x1: x + (o.ghost ?? 0) + 18, slots, nextX: x, height: h };
  // the composing stick: a long tray with a knee at the left
  if (o.stick !== false) {
    const sa = smooth(ramp(reveal, 0, 0.15));
    c.save();
    c.globalAlpha *= sa;
    c.fillStyle = ink;
    c.fillRect(o.x, o.y, lay.x1 - o.x, 10);
    c.fillRect(o.x, o.y - h - 6, 12, h + 16);
    c.fillRect(o.x - 6, o.y - h - 12, 24, 8);
    c.fillStyle = withAlpha(m.rim, 0.3);
    c.fillRect(o.x + 12, o.y, lay.x1 - o.x - 12, 1.2);
    c.restore();
  }
  o.tokens.forEach((t, i) => {
    const a = smooth(ramp(reveal, 0.1 + (i / n) * 0.8, 0.1 + ((i + 1) / n) * 0.8));
    if (a <= 0) return;
    const drop = (1 - a) * -40;
    c.save();
    c.globalAlpha *= Math.min(1, a * 1.5);
    drawSlug(c, slots[i].x, o.y - h + drop, slots[i].w, h, t, size, o.highlight === i ? 1 : 0, env);
    c.restore();
  });
  if (o.ghost && o.ghost > 0) {
    c.save();
    c.strokeStyle = withAlpha(m.core, 0.5);
    c.setLineDash([4, 4]);
    c.lineWidth = 1.2;
    c.strokeRect(x + 2, o.y - h, o.ghost, h);
    c.restore();
    glow(c, x + 2 + o.ghost / 2, o.y - h / 2, h, m.halo, 0.2);
  }
  return lay;
}

export interface NextTokenOpts {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  context?: string[];
  candidates?: { tok: string; logit: number }[];
  temperature?: number;
  reveal?: number;
  slide?: number;
  choose?: number;
  chosen?: number;
  /** print p beside each drawer (default true) */
  numbers?: boolean;
  /** the formula / temperature caption at the lower right (default true) */
  caption?: boolean;
  /** the candle on the cabinet (default true): the shot's motivated light */
  candle?: boolean;
}

const CABINETS = new Map<string, Path2D>();
/** The typesetter's case in side elevation: cornice, broken-pediment crest, plinth, bracket feet. */
function cabinetPath(cx: number, cy: number, dw: number, bodyH: number): Path2D {
  const key = `${cx}|${cy}|${dw}|${bodyH}`;
  let p = CABINETS.get(key);
  if (p) return p;
  p = new Path2D();
  const r = cx + dw;
  const b = cy + bodyH;
  p.rect(cx, cy, dw, bodyH);
  // cornice: bead, cove, top slab
  p.rect(cx - 6, cy - 7, dw + 12, 7);
  p.moveTo(cx - 6, cy - 7);
  p.quadraticCurveTo(cx - 8, cy - 15, cx - 18, cy - 17);
  p.lineTo(r + 18, cy - 17);
  p.quadraticCurveTo(r + 8, cy - 15, r + 6, cy - 7);
  p.closePath();
  p.rect(cx - 20, cy - 24, dw + 40, 7);
  // broken pediment: two scrolls rising to a gap, an urn finial between
  const mid = cx + dw / 2;
  const top = cy - 24;
  for (const sgn of [-1, 1]) {
    const x0 = mid + sgn * (dw / 2 + 14);
    const x1 = mid + sgn * 16;
    p.moveTo(x0, top);
    p.quadraticCurveTo(mid + sgn * (dw * 0.28), top - 10, x1, top - 34);
    p.arc(x1 + sgn * -5, top - 36, 6, sgn > 0 ? 0 : Math.PI, sgn > 0 ? Math.PI * 1.6 : -Math.PI * 0.6, sgn < 0);
    p.lineTo(x1 - sgn * 2, top - 26);
    p.quadraticCurveTo(mid + sgn * (dw * 0.27), top - 4, x0 - sgn * 10, top);
    p.closePath();
  }
  p.moveTo(mid - 7, top);
  p.lineTo(mid - 4, top - 10);
  p.bezierCurveTo(mid - 13, top - 16, mid - 10, top - 30, mid - 3, top - 32);
  p.lineTo(mid - 2, top - 40);
  p.arc(mid, top - 43, 3.4, Math.PI * 0.6, Math.PI * 2.4);
  p.lineTo(mid + 3, top - 32);
  p.bezierCurveTo(mid + 10, top - 30, mid + 13, top - 16, mid + 4, top - 10);
  p.lineTo(mid + 7, top);
  p.closePath();
  // plinth and bracket feet (ogee brackets)
  p.rect(cx - 10, b, dw + 20, 6);
  p.rect(cx - 14, b + 6, dw + 28, 9);
  for (const fx of [cx - 14, r + 14]) {
    const sgn = fx < mid ? 1 : -1;
    p.moveTo(fx, b + 15);
    p.lineTo(fx, b + 44);
    p.lineTo(fx + sgn * 9, b + 44);
    p.bezierCurveTo(fx + sgn * 10, b + 30, fx + sgn * 30, b + 26, fx + sgn * 34, b + 15);
    p.closePath();
  }
  CABINETS.set(key, p);
  return p;
}

export function nextToken(c: CanvasRenderingContext2D, o: NextTokenOpts, env: PaintEnv): void {
  const X = o.x ?? 0;
  const Y = o.y ?? 0;
  const W = o.w ?? 1280;
  const m = env.mood;
  const ink = env.fill('ink');
  const ctx = o.context ?? NEXT_TOKEN_DEMO.context;
  const cands = o.candidates ?? NEXT_TOKEN_DEMO.candidates;
  const T = o.temperature ?? 1;
  const p = softmax(cands.map((k) => k.logit), T);
  const pMax = Math.max(...p);
  const reveal = o.reveal ?? 1;
  const slide = smooth(o.slide ?? 0);
  const choose = o.choose ?? 0;
  const chosen = o.chosen ?? p.indexOf(pMax);
  const n = cands.length;
  const size = 30;
  const slugH = size * 1.9;

  // --- the line so far, with an empty lit slot waiting -----------------------
  const chosenW = slugWidth(c, cands[chosen].tok, size);
  const lineW = ctx.reduce((a, t) => a + slugWidth(c, t, size) + 2, 0) + chosenW + 46;
  const stickX = X + Math.max(40, (W - lineW) / 2);
  const stickY = Y + 140;
  const lay = typeSlugs(c, { x: stickX, y: stickY, tokens: ctx, size, reveal: ramp(reveal, 0, 0.5), ghost: chosenW }, env);

  // --- the case ---------------------------------------------------------------
  const caseA = smooth(ramp(reveal, 0.4, 0.8));
  if (caseA <= 0) return;
  const dh = 56;
  const dw = 200;
  const cx = X + 150;
  const cy = Y + 262;
  const bodyH = n * dh;
  const face = cx + dw;
  const maxSlide = W - (face - X) - 170;
  c.save();
  c.globalAlpha *= caseA;
  c.fillStyle = ink;
  c.fill(cabinetPath(cx, cy, dw, bodyH));
  // inner cut-lines: a stile down the face, a rail between drawers, a bead under the cornice
  c.strokeStyle = withAlpha(m.rim, 0.16);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(cx + 8, cy + 6);
  c.lineTo(cx + 8, cy + bodyH - 6);
  c.moveTo(face - 8, cy + 6);
  c.lineTo(face - 8, cy + bodyH - 6);
  for (let i = 1; i < n; i++) {
    c.moveTo(cx + 8, cy + i * dh);
    c.lineTo(face - 8, cy + i * dh);
  }
  c.moveTo(cx - 14, cy - 18.5);
  c.lineTo(face + 14, cy - 18.5);
  c.stroke();
  c.restore();
  if (o.candle !== false) candle(c, face - 30, cy - 24, env, { h: 24, seed: 7, k: caseA });

  const out = (i: number) => p[i] * maxSlide * slide;
  const cardW = dw - 56;
  const lift = smooth(ramp(choose, 0, 1));
  let flying: { x: number; y: number; w: number } | null = null;
  cands.forEach((k, i) => {
    const ry = cy + i * dh;
    const o_ = out(i);
    const rel = p[i] / pMax;
    const boxTop = ry + dh * 0.34;
    const boxBot = ry + dh - 7;
    const fx = face + o_;
    const sw = slugWidth(c, k.tok, 20);
    c.save();
    c.globalAlpha *= caseA;
    if (o_ > 0.5) {
      // light spilling up out of the open drawer (the bar is the lit lip)
      const g = c.createLinearGradient(0, boxTop - dh * 0.5, 0, boxTop);
      g.addColorStop(0, withAlpha(m.halo, 0));
      g.addColorStop(1, withAlpha(m.halo, (0.12 + 0.3 * rel) * slide));
      c.fillStyle = g;
      c.fillRect(face, boxTop - dh * 0.5, o_, dh * 0.5);
      // the sort standing in the drawer, just behind the front (clipped to the drawer)
      const showSlug = smooth(ramp(o_, sw + 16, sw + 34));
      if (!(i === chosen && lift > 0) && showSlug > 0) {
        c.save();
        c.globalAlpha *= showSlug;
        c.beginPath();
        c.rect(face, ry - dh, o_, dh * 2);
        c.clip();
        drawSlug(c, fx - sw - 6, boxTop - 26, sw, 38, k.tok, 20, 0.25 + 0.75 * rel * slide, env);
        c.restore();
      }
      // box side with a lit lip and grain lines
      c.fillStyle = mixLab(ink, m.set, 0.28);
      c.fillRect(face, boxTop, o_, boxBot - boxTop);
      const lip = c.createLinearGradient(face, 0, fx, 0);
      lip.addColorStop(0, withAlpha(m.halo, 0.25));
      lip.addColorStop(1, withAlpha(mixLab(m.halo, m.core, rel), 0.55 + 0.45 * rel));
      c.fillStyle = lip;
      c.fillRect(face, boxTop - 1, o_, 2.4);
      c.strokeStyle = withAlpha(m.rim, 0.08);
      c.beginPath();
      c.moveTo(face, boxTop + 9);
      c.lineTo(fx, boxTop + 9);
      c.moveTo(face, boxBot - 7);
      c.lineTo(fx, boxBot - 7);
      c.stroke();
    }
    // drawer front plate and brass ring pull
    c.fillStyle = ink;
    c.fillRect(fx, ry + 5, 11, dh - 10);
    c.strokeStyle = withAlpha(m.rim, 0.5);
    c.lineWidth = 1.4;
    c.beginPath();
    c.arc(fx + 17, ry + dh / 2 + 3, 5, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = withAlpha(m.rim, 0.55);
    c.fillRect(fx + 11, ry + dh / 2 - 4, 6, 3);
    // the card in its brass holder on the case
    const cardX = cx + 28;
    const cardY = ry + dh / 2 - 14;
    c.fillStyle = withAlpha(m.rim, 0.35);
    c.fillRect(cardX - 3, cardY - 3, cardW + 6, 34);
    const lit = i === chosen ? Math.max(rel * slide, lift) : rel * slide;
    c.fillStyle = mixLab(mixLab(PARCH.sky[2], m.halo, 0.45), ink, 0.35 - 0.3 * lit);
    c.fillRect(cardX, cardY, cardW, 28);
    c.restore();
    label(c, k.tok.replace(/^ /, ''), cardX + cardW / 2, cardY + 21, { size: 22, color: PARCH.ink, align: 'center', alpha: caseA, font: MFONT.serif, weight: 500 });
    if (o.numbers !== false && slide > 0.05)
      label(c, `${(p[i] * 100).toFixed(p[i] < 0.1 ? 1 : 0)}%`, fx + 32, ry + dh / 2 + 9, {
        size: 24,
        italic: true,
        color: rel > 0.6 ? m.core : m.rim,
        alpha: caseA * smooth(ramp(slide, 0.3, 1)) * (0.6 + 0.4 * rel),
      });
    if (i === chosen && lift > 0) flying = { x: fx - sw - 6, y: boxTop - 26, w: sw };
  });

  // --- the chosen sort rises out of its drawer and is set at the end of the line
  if (flying) {
    const f = flying as { x: number; y: number; w: number };
    const tx = lay.nextX;
    const ty = stickY - slugH;
    const hy = ty - size * 2.4;
    const u = lift;
    const scale = 1 + (size / 20 - 1) * smooth(ramp(u, 0.2, 0.75));
    const sx = f.x + (tx - f.x) * smooth(ramp(u, 0.3, 0.75));
    const sy = u < 0.75 ? f.y + (hy - f.y) * smooth(ramp(u, 0, 0.4)) : hy + (ty - hy) * smooth(ramp(u, 0.75, 1));
    const tok = cands[chosen].tok;
    const sz = 20 * scale;
    glow(c, sx + f.w * scale * 0.5, sy + sz, 60 * scale, m.halo, 0.25 * (1 - smooth(ramp(u, 0.85, 1))));
    drawSlug(c, sx, sy, slugWidth(c, tok, sz), sz * 1.9, tok, sz, 1, env);
  }

  if (o.caption !== false) {
    const ca = caseA * smooth(ramp(slide, 0, 0.5));
    const rx = X + W - 60;
    label(c, 'p = softmax(z / T)', rx, cy + bodyH - 34, { size: 24, italic: true, color: m.rim, align: 'right', alpha: ca });
    label(c, `temperature T = ${T.toFixed(T < 1 ? 2 : 1)}`, rx, cy + bodyH - 4, { size: 20, font: MFONT.sc, weight: 600, tracking: 1.5, color: m.rim, align: 'right', alpha: ca * 0.85 });
    label(c, 'illustrative scores', rx, cy + bodyH + 22, { size: 17.5, italic: true, color: m.rim, align: 'right', alpha: ca * 0.5 });
  }
}
