/**
 * handwired-explained — DEEP DIVE II, THE PATTERNS RUN (ch06-s05b .. ch06-s09; owned by their author).
 *
 * Small shared pieces for the four companion machines that hang off the host clockwork's arms (the counting rail,
 * the prefix loom, the two grouping plates, the card cabinet), all in the chapter's clock room (sets/ch06-s01-clockroom,
 * re-lit labGreen from ch06-s06 on). One material language: brass arms and collars, manila paper, plate ink, copper
 * threads with knots of light, fluorescent tubes as the room's practicals.
 *
 *   camAt(keys, t) / camK(x, y, k)                         keyed camera with a push expressed as screen zoom k
 *   armBar(c, env, pts, o)                                 a clockwork arm: a brass bar along a polyline, collars
 *   tubeFixture(c, env, x, y, w)                           a hanging fluorescent fixture (attach f.practical 'tube')
 *   paperTab(c, env, o)                                    a manila tab / card with a centred number (legible)
 *   knotLight(c, env, x, y, u, r)                          a knot of light where two threads join (additive)
 *   copperThread(c, env, a, b, u, o)                       a copper thread drawn from a to b (sagging), u = 0..1 drawn
 *   counterDrum(c, env, o)                                 an odometer counter (rolling brass digits) with a label
 *
 * Geometry is rest-screen stage px of the layer you draw in. Colour roles come from env.
 */
import type { Camera3, PaintEnv } from '../../../film/contracts';
import { cam3Interp } from '../../../film';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { FONT, cardProbe, legibleSize, textProbe, textRole } from '../../../film/silhouette/type';
import { brassOf, cardPaper, clamp01, inkCol, lw, shadowCol } from './ch06-s01-clockroom';
import { copperOf } from './narratorHands';

type C2 = CanvasRenderingContext2D;
export type Pt = { x: number; y: number };

// ---------------------------------------------------------------- camera
const smr = (x: number) => {
  const u = clamp01(x);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
/** a camera that frames (x, y) at screen zoom k: dolly up to 1.2, the rest as lens */
export function camK(x: number, y: number, k: number): Camera3 {
  const kd = Math.min(k, 1.2);
  const z = 1000 - 1000 / kd;
  return { x, y, z, lens: Math.max(1, (k * (1000 - z)) / 1000) };
}
export interface CamKey {
  t: number;
  cam: Camera3;
}
/** smootherstep between keys (slow ins and outs), held before the first and after the last */
export function camAt(keys: CamKey[], t: number): Camera3 {
  if (t <= keys[0].t) return keys[0].cam;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t < b.t) return cam3Interp(a.cam, b.cam)(smr((t - a.t) / (b.t - a.t)));
  }
  return keys[keys.length - 1].cam;
}

// ---------------------------------------------------------------- the clockwork arm
/** a clockwork arm: a dark bar with a brass top edge along a polyline, a collar at each joint, a clamp at the end */
export function armBar(c: C2, env: PaintEnv, pts: Pt[], o: { w?: number; lit?: number } = {}) {
  const w = o.w ?? 9;
  const lit = clamp01(o.lit ?? 0);
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = PUPPET_NEAR_BLACK;
  c.lineWidth = w;
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)));
  c.stroke();
  // the brass top edge (toward the window above)
  c.strokeStyle = withAlpha(brassOf(env, 0.25 + lit * 0.6), 0.85);
  c.lineWidth = lw(c, 2.2);
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p.x, p.y - w * 0.42) : c.moveTo(p.x, p.y - w * 0.42)));
  c.stroke();
  // collars at the joints and a clamp at the end
  pts.forEach((p, i) => {
    if (i === 0) return;
    const r = i === pts.length - 1 ? w * 1.25 : w * 0.95;
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.beginPath();
    c.arc(p.x, p.y, r, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(brassOf(env, 0.3 + lit * 0.6), 0.9);
    c.lineWidth = lw(c, 2);
    c.beginPath();
    c.arc(p.x, p.y, r * 0.78, Math.PI * 1.05, Math.PI * 1.95);
    c.stroke();
  });
  c.restore();
}

/** a hanging fluorescent fixture (two drop rods, a dark housing, the tube's underside lit) */
export function tubeFixture(c: C2, env: PaintEnv, x: number, y: number, w: number, on = 1) {
  c.save();
  c.fillStyle = env.fill('ink');
  c.fillRect(x - w * 0.36, y - 160, 2.5, 160);
  c.fillRect(x + w * 0.36, y - 160, 2.5, 160);
  c.beginPath();
  c.moveTo(x - w / 2, y);
  c.lineTo(x - w / 2 + 10, y - 12);
  c.lineTo(x + w / 2 - 10, y - 12);
  c.lineTo(x + w / 2, y);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(mixLab(env.mood.core, '#ffffff', 0.25), 0.85 * on);
  c.fillRect(x - w / 2 + 6, y, w - 12, 3.2);
  c.restore();
}

// ---------------------------------------------------------------- paper
export interface TabOpts {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  /** 0..1 paper presence */
  paper?: number;
  /** 0..1 ink */
  ink?: number;
  size?: number;
  font?: 'num' | 'mono' | 'sc' | 'italic';
  /** a warm lift of the paper (lit) */
  lift?: number;
  /** a probe id (text / card audits); omit for texture */
  id?: string;
  /** ink colour override (copper for a lit result) */
  inkColor?: string;
  tilt?: number;
  /** subject text (legibility floor), default true */
  subject?: boolean;
  /** a pin at the top centre */
  pin?: boolean;
}
export function tabFont(o: Pick<TabOpts, 'font'>, size: number) {
  return o.font === 'mono' ? `500 ${size}px ${FONT.mono}` : o.font === 'sc' ? `600 ${size}px ${FONT.sc}` : o.font === 'italic' ? `italic 500 ${size}px ${FONT.text}` : `600 ${size}px ${FONT.display}`;
}
export function paperTab(c: C2, env: PaintEnv, o: TabOpts) {
  const paper = clamp01(o.paper ?? 1);
  if (paper <= 0.002) return;
  const ink = clamp01(o.ink ?? 1);
  const { x, y, w, h } = o;
  c.save();
  c.translate(x, y);
  if (o.tilt) c.rotate(o.tilt);
  c.globalAlpha *= paper;
  c.fillStyle = withAlpha(shadowCol, 0.35);
  c.fillRect(-w / 2 + 2.5, 3.5, w, h);
  c.fillStyle = mixLab(cardPaper(env), env.mood.core, clamp01(o.lift ?? 0) * 0.35);
  c.fillRect(-w / 2, 0, w, h);
  c.strokeStyle = withAlpha(inkCol(env), 0.32);
  c.lineWidth = lw(c, 1.1);
  c.strokeRect(-w / 2 + 0.5, 0.5, w - 1, h - 1);
  if (o.pin) {
    c.fillStyle = brassOf(env, 0.4);
    c.beginPath();
    c.arc(0, 5, 3, 0, Math.PI * 2);
    c.fill();
  }
  if (o.id) cardProbe(c, `${o.id}-card`, -w / 2, 0, w, h, paper, ink * paper);
  if (ink > 0.002 && o.text) {
    textRole(c, o.subject === false ? 'texture' : 'subject', () => {
      const base = o.size ?? 22;
      const size = o.subject === false ? base : legibleSize(c, tabFont(o, base), base, o.text);
      c.font = tabFont(o, size);
      c.fillStyle = o.inkColor ?? inkCol(env);
      c.globalAlpha = paper * ink;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(o.text, 0, h / 2 + size * 0.04);
      if (o.id) {
        const tw = c.measureText(o.text).width;
        textProbe(c, o.id, -tw / 2, h / 2 - size * 0.55, tw, size * 1.1, paper * ink);
      }
    });
  }
  c.restore();
}

// ---------------------------------------------------------------- threads and knots
/** a copper thread from a to b with a gentle sag, drawn to u (0..1); ghost = pale, dashed */
export function copperThread(c: C2, env: PaintEnv, a: Pt, b: Pt, u: number, o: { glow?: number; ghost?: number; sag?: number; w?: number; paper?: boolean } = {}) {
  const U = clamp01(u);
  if (U <= 0) return;
  const sag = o.sag ?? 6;
  const ghost = clamp01(o.ghost ?? 0);
  const N = 18;
  const pt = (k: number) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k + sag * 4 * k * (1 - k) });
  c.save();
  c.lineCap = 'round';
  const path = () => {
    c.beginPath();
    for (let n = 0; n <= N; n++) {
      const p = pt((n / N) * U);
      if (n === 0) c.moveTo(p.x, p.y);
      else c.lineTo(p.x, p.y);
    }
  };
  if (o.paper) {
    // on parchment: a dark copper ink line (no additive glow: it would vanish on paper)
    c.strokeStyle = mixLab('#7a3a14', inkCol(env), 0.2);
    c.lineWidth = Math.max(lw(c, o.w ?? 2.2), 1.3);
    path();
    c.stroke();
  } else if (ghost > 0) {
    c.setLineDash([lw(c, 6), lw(c, 4)]);
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#ffffff', 0.15), 0.8 * ghost);
    c.lineWidth = Math.max(lw(c, 2), 1.2);
    path();
    c.stroke();
    c.setLineDash([]);
  } else {
    const glow = clamp01(o.glow ?? 0.4);
    c.globalCompositeOperation = 'lighter';
    c.strokeStyle = withAlpha(env.mood.halo, 0.16 * glow);
    c.lineWidth = lw(c, 7);
    path();
    c.stroke();
    c.globalCompositeOperation = 'source-over';
    c.strokeStyle = copperOf(env, glow);
    c.lineWidth = Math.max(lw(c, o.w ?? 2.4), 1.4);
    path();
    c.stroke();
  }
  c.restore();
  return pt(U);
}
/** a knot of light (additive halo + a small bright bead) */
export function knotLight(c: C2, env: PaintEnv, x: number, y: number, u: number, r = 7, o: { ghost?: boolean; paper?: boolean } = {}) {
  const U = clamp01(u);
  if (U <= 0) return;
  c.save();
  if (o.paper) {
    // on parchment: a brass bead with a dark rim, a warm highlight as it lands
    c.fillStyle = mixLab('#3a2210', inkCol(env), 0.3);
    c.beginPath();
    c.arc(x, y, r * 0.8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = mixLab(brassOf(env, 0.6), '#fff3d0', 0.3 * clamp01(U - 0.6) * 2.5);
    c.beginPath();
    c.arc(x - r * 0.12, y - r * 0.12, r * 0.52, 0, Math.PI * 2);
    c.fill();
    c.restore();
    return;
  }
  if (o.ghost) {
    c.strokeStyle = withAlpha(mixLab(env.mood.rim, '#ffffff', 0.2), 0.85 * U);
    c.lineWidth = lw(c, 2);
    c.beginPath();
    c.arc(x, y, r * 0.8, 0, Math.PI * 2);
    c.stroke();
    c.restore();
    return;
  }
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r * 3.2);
  g.addColorStop(0, withAlpha(env.mood.core, 0.55 * U));
  g.addColorStop(0.4, withAlpha(env.mood.halo, 0.2 * U));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = mixLab(copperOf(env, 0.8), env.mood.core, 0.35 * U);
  c.beginPath();
  c.arc(x, y, r * 0.62 * (0.6 + 0.4 * U), 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ---------------------------------------------------------------- the counter drum (odometer)
export interface DrumOpts {
  x: number;
  y: number;
  /** the value shown; fractional values roll the last wheel (and carries) */
  value: number;
  digits: number;
  /** digit cell size (stage px at the layer) */
  cell?: number;
  /** thousands separator gaps */
  commas?: boolean;
  /** 0..1 presence */
  alpha?: number;
  /** a warm flare on the numerals (the click) */
  flash?: number;
  id?: string;
  /** hide leading zeros */
  blankLead?: boolean;
}
/** an odometer of brass-rimmed wheels; each wheel rolls with the value (the last one continuously) */
export function counterDrum(c: C2, env: PaintEnv, o: DrumOpts) {
  const a = clamp01(o.alpha ?? 1);
  if (a <= 0.002) return;
  const cell0 = o.cell ?? 30;
  const v = Math.max(0, o.value);
  c.save();
  c.globalAlpha *= a;
  textRole(c, 'subject', () => {
    const size = legibleSize(c, `600 ${cell0 * 0.82}px ${FONT.mono}`, cell0 * 0.82, '0');
    const cell = Math.max(cell0, size / 0.82);
    const gap = o.commas ? cell * 0.36 : 0;
    const groups = o.commas ? Math.floor((o.digits - 1) / 3) : 0;
    const W = o.digits * cell + groups * gap + cell * 0.4;
    const H = cell * 1.32;
    const x0 = o.x - W / 2, y0 = o.y - H / 2;
    // the housing
    c.fillStyle = PUPPET_NEAR_BLACK;
    c.beginPath();
    c.roundRect(x0 - 6, y0 - 6, W + 12, H + 12, 6);
    c.fill();
    c.strokeStyle = withAlpha(brassOf(env, 0.5), 0.9);
    c.lineWidth = lw(c, 1.8);
    c.beginPath();
    c.roundRect(x0 - 3, y0 - 3, W + 6, H + 6, 4);
    c.stroke();
    c.font = `600 ${size}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    let x = x0 + cell * 0.2;
    const lead = Math.floor(v).toString().length;
    for (let i = 0; i < o.digits; i++) {
      const place = o.digits - 1 - i;
      const pw = Math.pow(10, place);
      // wheel position: the digit plus a roll in the last 0..1 of its carry
      const q = v / pw;
      const d = Math.floor(q) % 10;
      const frac = place === 0 ? q - Math.floor(q) : clamp01((v % pw) / pw - (pw - 1) / pw) * pw;
      const roll = clamp01(frac);
      const blank = o.blankLead && place >= lead && place > 0;
      c.save();
      c.beginPath();
      c.rect(x, y0, cell * 0.92, H);
      c.clip();
      const wheel = c.createLinearGradient(0, y0, 0, y0 + H);
      wheel.addColorStop(0, mixLab(cardPaper(env), '#000000', 0.55));
      wheel.addColorStop(0.5, cardPaper(env));
      wheel.addColorStop(1, mixLab(cardPaper(env), '#000000', 0.55));
      c.fillStyle = wheel;
      c.fillRect(x, y0, cell * 0.92, H);
      if (!blank) {
        c.fillStyle = mixLab(inkCol(env), '#8a3d14', clamp01(o.flash ?? 0) * 0.6);
        const cy = o.y - roll * H * 0.85;
        c.fillText(String(d), x + cell * 0.46, cy);
        c.fillText(String((d + 1) % 10), x + cell * 0.46, cy + H * 0.85);
      }
      c.restore();
      x += cell;
      if (o.commas && place > 0 && place % 3 === 0) {
        // a thousands COMMA with its tail (review r1: a low dot alone read as a decimal point, '30.002')
        const cx = x + gap * 0.45, cy = y0 + H * 0.7, r = cell * 0.085;
        c.fillStyle = brassOf(env, 0.75);
        c.beginPath();
        c.arc(cx, cy, r, 0, Math.PI * 2);
        c.fill();
        c.beginPath();
        c.moveTo(cx + r * 0.95, cy + r * 0.1);
        c.quadraticCurveTo(cx + r * 1.1, cy + r * 2.4, cx - r * 1.1, cy + r * 3.4);
        c.quadraticCurveTo(cx + r * 0.1, cy + r * 2.1, cx - r * 0.2, cy + r * 0.8);
        c.closePath();
        c.fill();
        x += gap;
      }
    }
    if (o.id) textProbe(c, o.id, x0, y0, W, H, a);
    if ((o.flash ?? 0) > 0.01) {
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = withAlpha(env.mood.halo, 0.22 * clamp01(o.flash ?? 0));
      c.fillRect(x0 - 6, y0 - 6, W + 12, H + 12);
    }
  });
  c.restore();
}
