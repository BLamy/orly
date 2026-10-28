/**
 * handwired-explained — ch11-s02 / ch11-s03 / ch11-s04: TAG 11, THE BORDER TAG, drawn on top of the tagLine set's own
 * tag (sets/tagLine drawTag: paper, eyelet, perforation, rivet, TOML strike) so the film keeps one tag language.
 *
 *   borderTag(c, env, st, o)     the tag via drawTag (front cleared), then in the tag's own frame (eyelet, swing, turn):
 *                                the front inked in the house tag type and fitted to the paper; the halves lettered
 *                                JSON (left) and TOML (right) along the foot; a light on one half (shade the other);
 *                                the third, thinner thread hanging from the lower edge, lettered bison
 *   knotCards11(c, env, eye, cards, s, subject)   the knot's typeset cards, threaded on the eyelet and hanging to
 *                                its RIGHT (tag 10 hangs close on the left), each card on its own short thread
 *   tagFrame(st, o)              the tag's eyelet, swing, body size (to attach strands, rivets, cards, a pencil)
 *   tagLocal(st, o, x, y)        a point in the tag's frame (unturned) -> world
 *
 * The front is a paraphrase, never in quotation marks: "Gradient descent can fill a parser's unused entries".
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, legibleSize, textProbe, textRole } from '../../../film/silhouette/type';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { SLOT_X, TAG, drawTag, lineYAt, type TagState } from './tagLine';

type C = CanvasRenderingContext2D;
export type Pt = { x: number; y: number };
const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);

export const FRONT11 = "Gradient descent can fill a parser's unused entries";
export const KNOT_A = 'the recovery experiment';
export const KNOT_B = 'the rule for failure, fixed beforehand';

export interface FrameOpts {
  /** the knot point on the line (default: straight above the slot on the canonical line) */
  knotAt?: Pt;
  tq?: number;
}
/** the tag's frame as drawTag computes it */
export function tagFrame(st: TagState, o: FrameOpts = {}) {
  const s = st.scale ?? 1;
  const x = st.x ?? SLOT_X[st.id];
  const knot = o.knotAt ?? { x, y: lineYAt(x) };
  const eye = { x, y: st.y ?? knot.y + TAG.string * s };
  const tq = o.tq ?? 0;
  const swing = (st.swing ?? 0.025) * Math.sin(tq * 1.7 + (st.phase ?? SLOT_X[st.id] * 0.013));
  const sx = Math.max(0.04, Math.abs(Math.cos(Math.PI * clamp01(st.flip ?? 0))));
  return { s, x, knot, eye, swing, sx, w: TAG.w * s, h: TAG.h * s };
}
export function tagLocal(st: TagState, o: FrameOpts, lx: number, ly: number): Pt {
  const fr = tagFrame(st, o);
  const cs = Math.cos(fr.swing), sn = Math.sin(fr.swing);
  const x = lx * fr.sx;
  return { x: fr.eye.x + x * cs - ly * sn, y: fr.eye.y + x * sn + ly * cs };
}

export interface BorderOpts extends FrameOpts {
  /** 0..1 how much of the front is inked */
  ink?: number;
  /** subject: the front must reach the legibility floor (s02's push-in) */
  subject?: boolean;
  /** shade one half (the light falls on the other): which half, how much */
  shade?: { half: 'json' | 'toml'; u: number };
  /** the bison thread: 0..1 presence, and its length (stage px at scale 1) */
  bison?: number;
  bisonLen?: number;
  /** 0..1 the JSON / TOML lettering */
  halves?: number;
  /** whether to letter 'bison' beside its thread */
  bisonLabel?: boolean;
}

/** tag 11 in full (draw in the action layer). Pass st with knot: [] when the shot draws its own knot cards. */
export function borderTag(c: C, env: PaintEnv, st: TagState, o: BorderOpts = {}) {
  const a = clamp01(st.alpha ?? 1);
  if (a <= 0.001) return;
  const fr = tagFrame(st, o);
  const tq = o.tq ?? env.tq;
  // the bison thread first (behind the paper): from the lower edge, right of the perforation, thinner than a strand
  const bi = clamp01(o.bison ?? 1);
  if (bi > 0.001) {
    const top = tagLocal(st, o, fr.w * 0.3, fr.h - 1);
    const len = (o.bisonLen ?? 30) * fr.s * bi;
    const sway = Math.sin(tq * 1.3 + 0.7) * 1.2 * fr.s;
    c.save();
    c.globalAlpha = a * bi;
    c.strokeStyle = withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, env.layer.haze * 0.6), 0.7);
    c.lineWidth = Math.max(0.6, 0.75 * fr.s * 0.6);
    c.beginPath();
    c.moveTo(top.x, top.y);
    c.quadraticCurveTo(top.x + sway, top.y + len * 0.5, top.x + sway * 1.6, top.y + len);
    c.stroke();
    if (o.bisonLabel !== false && bi > 0.6) {
      textRole(c, 'texture', () => {
        const fs = 5.6 * fr.s;
        c.font = `italic ${fs.toFixed(2)}px ${FONT.fell}`;
        c.fillStyle = withAlpha(mixLab(env.mood.rim, '#f3ead6', 0.5), 0.85 * clamp01((bi - 0.6) / 0.4));
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText('bison', top.x + sway + 3.5 * fr.s, top.y + len * 0.62);
      });
    }
    c.restore();
  }
  // the paper, eyelet, perforation, rivet and TOML strike: the set's own drawTag, with the front left blank
  drawTag(c, env, { ...st, front: '', sub: '' }, { tq, knotAt: o.knotAt });
  // then the shot's own marks in the tag's frame
  if (fr.sx < 0.2) return;
  c.save();
  c.globalAlpha = a;
  c.translate(fr.eye.x, fr.eye.y);
  c.rotate(fr.swing);
  c.scale(fr.sx, 1);
  const w = fr.w, h = fr.h, s = fr.s;
  const inkCol = mixLab('#1d140d', env.mood.ink, 0.3);
  // the front, fitted to the paper above the halves' lettering
  const ink = clamp01(o.ink ?? 1);
  if (ink > 0) {
    textRole(c, o.subject ? 'subject' : 'texture', () => {
      const maxW = w * 0.86;
      let fs = 8.2 * s;
      if (o.subject) fs = legibleSize(c, `${fs}px ${FONT.fell}`, fs);
      let lines: string[] = [];
      for (let k = 0; k < 6; k++) {
        c.font = `${fs.toFixed(2)}px ${FONT.fell}`;
        lines = wrap(c, FRONT11, maxW);
        if (lines.length * fs * 1.1 <= h - 32 * s || o.subject) break;
        fs *= 0.92;
      }
      c.font = `${fs.toFixed(2)}px ${FONT.fell}`;
      c.fillStyle = inkCol;
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      const lh = fs * 1.1;
      const top = 17 * s + fs * 0.85;
      const total = lines.reduce((n, l) => n + l.length, 0);
      let budget = Math.ceil(total * ink);
      let wMax = 0;
      lines.forEach((l, i) => {
        const tw = c.measureText(l).width;
        wMax = Math.max(wMax, tw);
        if (budget <= 0) return;
        c.fillText(l.slice(0, budget), -tw / 2, top + i * lh);
        budget -= l.length;
      });
      textProbe(c, 'tag11-front', -wMax / 2, top - fs * 0.8, wMax, lines.length * lh, a * (ink >= 1 ? 1 : 0.5));
    });
  }
  // the halves, lettered along the foot either side of the perforation
  const hv = clamp01(o.halves ?? 1);
  if (hv > 0) {
    textRole(c, 'texture', () => {
      const fs = 6.4 * s;
      c.font = `600 ${fs.toFixed(2)}px ${FONT.sc}`;
      c.textAlign = 'center';
      c.textBaseline = 'alphabetic';
      c.fillStyle = withAlpha(inkCol, 0.78 * hv);
      c.fillText('JSON', -w / 4, h - 5.5 * s);
      c.fillText('TOML', w / 4, h - 5.5 * s);
    });
  }
  // the light on one half: the other in a soft shade (a pool of the plate's lamp)
  const sh = o.shade;
  if (sh && sh.u > 0.001) {
    c.save();
    const k = w * 0.2;
    c.beginPath();
    if (sh.half === 'json') {
      c.moveTo(-w / 2 + k, 0);
      c.lineTo(0, 0);
      c.lineTo(0, h);
      c.lineTo(-w / 2, h);
      c.lineTo(-w / 2, k);
    } else {
      c.moveTo(0, 0);
      c.lineTo(w / 2 - k, 0);
      c.lineTo(w / 2, k);
      c.lineTo(w / 2, h);
      c.lineTo(0, h);
    }
    c.closePath();
    c.fillStyle = withAlpha(mixLab(env.mood.set, PUPPET_NEAR_BLACK, 0.4), 0.42 * sh.u);
    c.fill();
    c.restore();
  }
  c.restore();
}

export interface KnotCard {
  text: string;
  /** 0..1 threaded in */
  kin: number;
  /** offset of the card from its rest place while it is carried (world px) */
  dx?: number;
  dy?: number;
  /** an extra turn (radians) about its thread (a card swinging down, s04) */
  rot?: number;
  /** carried loose in the hand: no thread to the eyelet yet */
  loose?: boolean;
}
/** card geometry at rest: card i hangs to the right of the eyelet, the later card behind and a little lower */
export function cardRect(c: C, eye: Pt, i: number, text: string, s: number, subject: boolean) {
  const lines = cardLines(text);
  const fs = cardFont(c, s, subject);
  c.save();
  c.font = `italic 500 ${fs.toFixed(2)}px ${FONT.text}`;
  const tw = Math.max(...lines.map((l) => c.measureText(l).width));
  c.restore();
  const cw = tw + 7 * s, ch = lines.length * fs * 1.08 + 4.6 * s;
  // the later card hangs just under the first on its own thread (both read whole)
  const x = eye.x + 33 * s + i * 4 * s;
  const y = eye.y - 4 * s + i * (ch + 3 * s);
  return { x, y, w: cw, h: ch, fs, lines };
}
function cardLines(text: string): string[] {
  if (text === KNOT_A) return ['the recovery', 'experiment'];
  if (text === KNOT_B) return ['the rule for failure,', 'fixed beforehand'];
  return [text];
}
/** the cards' type: a fixed size per tag scale (the legibility floor is met wherever a shot pushes in to read them:
 *  7.6 px at s = 1 reaches 22 px cap at 1080p from an action-plane scale of 3) */
export const CARD_FS = 7.6;
function cardFont(_c: C, s: number, _subject: boolean) {
  return CARD_FS * s;
}
/** the knot cards: drawn back to front (the later card slid on behind the first) */
export function knotCards11(c: C, env: PaintEnv, eye: Pt, cards: KnotCard[], s: number, subject: boolean) {
  for (let i = cards.length - 1; i >= 0; i--) {
    const cd = cards[i];
    const kin = clamp01(cd.kin);
    if (kin <= 0.001) continue;
    const r = cardRect(c, eye, i, cd.text, s, subject);
    const ox = cd.dx ?? 0, oy = (cd.dy ?? 0) + (1 - kin) * -6 * s;
    c.save();
    c.globalAlpha *= kin;
    // its thread from the eyelet to the card's top-left corner
    if (!cd.loose) {
      c.strokeStyle = withAlpha(mixLab(mixLab('#d9c7a2', env.mood.rim, 0.4), env.mood.haze, env.layer.haze * 0.6), 0.85);
      c.lineWidth = Math.max(0.7, 0.9 * s * 0.6);
      c.beginPath();
      c.moveTo(eye.x + 1.5 * s, eye.y + 1 * s);
      c.lineTo(r.x + ox + 3 * s, r.y + oy + 2.2 * s);
      c.stroke();
    }
    c.translate(r.x + ox + 3 * s, r.y + oy + 2.2 * s);
    c.rotate((cd.rot ?? 0) + 0.06 * (i ? 1 : -0.4));
    c.translate(-3 * s, -2.2 * s);
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.25);
    c.fillRect(1.4 * s, 1.8 * s, r.w, r.h);
    c.fillStyle = mixLab(mixLab('#efe6d2', env.mood.halo, 0.18), env.mood.haze, env.layer.haze * 0.6);
    c.fillRect(0, 0, r.w, r.h);
    // the punched hole the thread runs through
    c.fillStyle = withAlpha(PUPPET_NEAR_BLACK, 0.7);
    c.beginPath();
    c.arc(3 * s, 2.2 * s, 0.9 * s, 0, Math.PI * 2);
    c.fill();
    textRole(c, subject ? 'subject' : 'texture', () => {
      c.font = `italic 500 ${r.fs.toFixed(2)}px ${FONT.text}`;
      c.fillStyle = mixLab('#1d140d', env.mood.ink, 0.3);
      c.textAlign = 'left';
      c.textBaseline = 'alphabetic';
      r.lines.forEach((l, k) => c.fillText(l, 3.6 * s, 2.4 * s + r.fs * (0.82 + k * 1.08)));
    });
    textProbe(c, `tag11-knot-${i}`, 0, 0, r.w, r.h, c.globalAlpha);
    c.restore();
  }
}

function wrap(c: C, text: string, maxW: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (c.measureText(t).width > maxW && line) {
      out.push(line);
      line = w;
    } else line = t;
  }
  if (line) out.push(line);
  return out;
}
