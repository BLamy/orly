/**
 * neural-net-history — shared drawing for ch10-s06 … ch10-s10 (one animator's group: the attention deep dive in
 * the serverCyan hall of word-slips). One vocabulary so a viewer can follow the same objects shot to shot:
 *
 *   hallBackdrop(f, id, cams, o?)   the long high hall: L2 lancet-window wall (serverCyan backlight), fog A, L3 a
 *                                   long beam with a receding line of word-slips in haze, fog B. Cached per mood.
 *   wordSlip(c, o)                  a parchment word-slip on a peg; `tint` 0..1 turns it gold → water-blue
 *   qLantern(c, x, y, k, env, s?)   the QUESTION (query): a small paper lantern (kit paperLantern)
 *   kMirror(c, x, y, k, s?, alpha?) the LABEL (key): a small hand mirror; k = glint
 *   vNote(c, x, y, s?, alpha?, word?) the MESSAGE (value): a sealed paper note with a wax seal
 *   glassCup(c, o)                  a lantern-glass cup; level 0..1 of light, share etched on the glass
 *   jug(c, x, y, tilt, s, env, glowK) the jug of light (ink silhouette, light at its lip)
 *   lightStream(c, pts, w, col, a)  a ribbon of poured light along a polyline
 *   ink(c, text, x, y, o)           ink lettering on a plate (EB Garamond / Cormorant SC / Plex Mono)
 *   softmax / sm / win / lerp / clamp01 / tq12
 * All pure; static art cached by the caller through f.cached.
 */
import type { Camera3, Frame, PaintEnv } from '../../../film';
import { LAYERS, MOODS, mixLab, overscan, withAlpha, windowWall } from '../../../film';
import { glow, paperLantern } from '../../../film/silhouette/metaphors/kit';
import { FONT, legibleSize } from '../../../film/silhouette/type';
import { hash1 } from '../../../film/silhouette/atmosphere';

export { clamp01, sm, lerp, win, tq12, monotone } from './ch02-s05b-util';
import { lerp } from './ch02-s05b-util';

type C = CanvasRenderingContext2D;
export const P = MOODS.parchment;
export const CY = MOODS.serverCyan;
export const INK = P.ink;
/** the plate's faint ink (rules, headers) */
export const INK_FAINT = withAlpha(P.ink, 0.5);
/** the film's oxblood thread (gradient arrows, the pen's strike) */
export const OXBLOOD = '#7a2a26';
/** water-blue: what 'bank' tints to when it takes in river's message */
export const WATER = '#9cc7d3';
export const SLIP_PAPER = mixLab(P.sky[1], P.halo, 0.18);

export function softmax(xs: number[]): number[] {
  const m = Math.max(...xs);
  const e = xs.map((x) => Math.exp(x - m));
  const z = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / z);
}

// ================================================================================================ the hall
export interface HallOpts {
  /** y of the long beam in L3 world px (default 70) */
  beamY?: number;
  /** distant slips hanging from the L3 beam (default true) */
  slips?: boolean;
  /** extra darkening of the wall (0..1) behind a bright plate */
  dim?: number;
}
/** The long high hall of word-slips (serverCyan): call right after f.camera + f.backlight. Paints L2, fog A, L3, fog B. */
export function hallBackdrop(f: Frame, id: string, cams: Camera3[], o: HallOpts = {}): void {
  const beamY = o.beamY ?? 70;
  const dim = o.dim ?? 0;
  f.layer('L2', (c, env) => {
    const r = overscan(LAYERS.L2, cams, 60);
    const x0 = Math.floor(r.x / 300) * 300 - 150;
    const centers: number[] = [];
    for (let x = x0; x < r.x + r.w + 300; x += 300) centers.push(x);
    f.cached(`ch10-hall/L2/${env.mood.id}/${Math.round(r.x)}/${Math.round(r.w)}/${dim}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      windowWall(
        cc,
        {
          x: r.x,
          y: r.y,
          w: r.w,
          h: r.h,
          centers,
          winW: 150,
          apex: -40,
          sill: 520,
          shape: 'pointed',
          lights: 2,
          panes: { cols: 2, rows: 11 },
          transoms: [0.42],
          tracery: 'trefoil',
          spandrel: 'trefoil',
          cornice: 0,
          wainscot: 120,
          shade: 0.5,
          seed: 1017,
        },
        env,
      );
      if (dim > 0) {
        cc.fillStyle = withAlpha(env.mood.fg, dim);
        cc.fillRect(r.x, r.y, r.w, r.h);
      }
    })(c, r.x, r.y);
  });
  f.fog('A');
  f.layer('L3', (c, env) => {
    const r = overscan(LAYERS.L3, cams, 60);
    f.cached(`ch10-hall/L3/${env.mood.id}/${Math.round(r.x)}/${Math.round(r.w)}/${beamY}/${o.slips !== false}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      const set = env.fill('set');
      // the floor of the hall (dark boards falling into haze)
      const fl = cc.createLinearGradient(0, 600, 0, r.y + r.h);
      fl.addColorStop(0, mixLab(set, env.mood.haze, 0.25));
      fl.addColorStop(1, mixLab(set, env.mood.fg, 0.5));
      cc.fillStyle = fl;
      cc.fillRect(r.x, 600, r.w, r.y + r.h - 600);
      // the long beam, with corbels every 300 px
      cc.fillStyle = set;
      cc.fillRect(r.x, beamY - 9, r.w, 18);
      for (let x = Math.floor(r.x / 300) * 300; x < r.x + r.w; x += 300) {
        cc.beginPath();
        cc.moveTo(x - 16, beamY + 9);
        cc.lineTo(x + 16, beamY + 9);
        cc.lineTo(x + 6, beamY + 40);
        cc.lineTo(x - 6, beamY + 40);
        cc.closePath();
        cc.fill();
      }
      cc.strokeStyle = withAlpha(env.mood.rim, 0.25);
      cc.lineWidth = 1;
      cc.beginPath();
      cc.moveTo(r.x, beamY - 9.5);
      cc.lineTo(r.x + r.w, beamY - 9.5);
      cc.stroke();
      if (o.slips !== false) {
        // a line of word-slips hanging from the beam (blank, hazed: the rest of the hall)
        for (let x = Math.floor(r.x / 64) * 64, k = 0; x < r.x + r.w; x += 64, k++) {
          const h = 46 + 18 * hash1(k, 77);
          const len = 30 + 26 * hash1(k, 78);
          const w = 26 + 14 * hash1(k, 79);
          cc.strokeStyle = set;
          cc.lineWidth = 1.2;
          cc.beginPath();
          cc.moveTo(x, beamY + 9);
          cc.lineTo(x, beamY + 9 + len);
          cc.stroke();
          cc.fillStyle = mixLab(set, env.mood.haze, 0.2);
          const y = beamY + 9 + len;
          cc.beginPath();
          cc.moveTo(x - w / 2, y);
          cc.lineTo(x + w / 2, y);
          cc.lineTo(x + w / 2, y + h - 3);
          cc.lineTo(x, y + h);
          cc.lineTo(x - w / 2, y + h - 2);
          cc.closePath();
          cc.fill();
        }
      }
    })(c, r.x, r.y);
  });
  f.fog('B');
}

// ================================================================================================ slips
export interface SlipOpts {
  x: number;
  /** top of the paper (the peg sits above it) */
  y: number;
  w?: number;
  h?: number;
  text: string;
  size?: number;
  /** 0..1 gold → water-blue */
  tint?: number;
  /** 0..1 lit from within (the hall's 'all at once') */
  lit?: number;
  alpha?: number;
  /** rotation (radians) about the peg */
  rot?: number;
  /** cord length above the peg (0 = none) */
  cord?: number;
  /** 0..1 how much of the lettering is inked (left to right) */
  inked?: number;
  font?: string;
}
export function slipWidth(text: string, size = 26): number {
  return Math.max(48, 26 + text.length * size * 0.5);
}
export function wordSlip(c: C, o: SlipOpts): void {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  const size = o.size ?? 26;
  const w = o.w ?? slipWidth(o.text, size);
  const h = o.h ?? Math.round(size * 2.05);
  const lit = o.lit ?? 0;
  c.save();
  c.globalAlpha *= a;
  c.translate(o.x, o.y);
  if (o.rot) c.rotate(o.rot);
  if (o.cord) {
    c.strokeStyle = INK;
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(0, -8);
    c.lineTo(0, -8 - o.cord);
    c.stroke();
  }
  // peg
  c.fillStyle = INK;
  c.fillRect(-3, -12, 6, 16);
  // paper with a slightly ragged bottom
  let paper = mixLab(SLIP_PAPER, WATER, 0.75 * (o.tint ?? 0));
  if (lit > 0) paper = mixLab(paper, '#fff8e8', 0.35 * lit);
  c.fillStyle = paper;
  c.beginPath();
  c.moveTo(-w / 2, 0);
  c.lineTo(w / 2, 0);
  c.lineTo(w / 2, h - 3);
  c.lineTo(w / 4, h);
  c.lineTo(0, h - 4);
  c.lineTo(-w / 4, h);
  c.lineTo(-w / 2, h - 2);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(INK, 0.3);
  c.lineWidth = 0.8;
  c.stroke();
  const inked = o.inked ?? 1;
  if (inked > 0) {
    c.save();
    if (inked < 1) {
      c.beginPath();
      c.rect(-w / 2, 0, w * inked, h);
      c.clip();
    }
    c.fillStyle = INK;
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    c.font = `500 ${size}px ${o.font ?? FONT.text}`;
    c.fillText(o.text, 0, h * 0.64);
    c.restore();
  }
  c.restore();
}

// ================================================================================================ the three cards
/** QUESTION: a small paper lantern (query). k = its light. s = scale (1 → body r 13). */
export function qLantern(c: C, x: number, y: number, k: number, env: PaintEnv, s = 1, alpha = 1): void {
  paperLantern(c, { x, y, r: 13 * s, act: k, alpha, hang: 10 * s, tassel: true, halo: 0.55 }, env);
}
/**
 * LABEL: ch10-s05's hand mirror with its paper tag (key), hanging by its handle's loop, glass down: the same object
 * drawn the same everywhere from s05 on. (x, y) = the centre of the glass; k = glint 0..1; s = 1 → oval 19 × 25.
 * The loop's top sits at y - mirrorLoop(s) (hang a cord to it).
 */
export function kMirror(c: C, x: number, y: number, k: number, s = 1, alpha = 1, _ink = INK, env?: PaintEnv): void {
  if (alpha <= 0.003) return;
  const m = env?.mood ?? CY;
  const ink = mixLab(m.ink, m.set, 0.1);
  const u = 0.5 * s;
  c.save();
  c.globalAlpha *= alpha;
  c.translate(x, y - 54 * u);
  c.scale(u, u);
  c.strokeStyle = ink;
  c.lineWidth = 1.6;
  c.beginPath();
  c.arc(0, 3, 3.5, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(-3.2, 6);
  c.lineTo(3.2, 6);
  c.lineTo(4.5, 30);
  c.lineTo(-4.5, 30);
  c.closePath();
  c.fill();
  c.beginPath();
  c.ellipse(0, 54, 19, 25, 0, 0, Math.PI * 2);
  c.fill();
  const sh = Math.max(0, Math.min(1, k));
  const gl = c.createLinearGradient(-14, 32, 14, 78);
  gl.addColorStop(0, mixLab(m.setHaze, m.rim, 0.55 + 0.4 * sh));
  gl.addColorStop(0.45, mixLab(mixLab(m.set, m.haze, 0.6), '#ffffff', 0.3 * sh));
  gl.addColorStop(0.55, mixLab(m.setHaze, m.rim, 0.35 + 0.5 * sh));
  gl.addColorStop(1, mixLab(m.set, m.haze, 0.45));
  c.fillStyle = gl;
  c.beginPath();
  c.ellipse(0, 54, 14.5, 20.5, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(m.rim, 0.5);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(-7, 42);
  c.lineTo(5, 36);
  c.stroke();
  // the tag, tied at the handle
  c.strokeStyle = ink;
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(3.6, 18);
  c.lineTo(17, 24);
  c.stroke();
  c.fillStyle = mixLab(P.sky[1], m.haze, 0.4);
  c.beginPath();
  c.moveTo(15, 20);
  c.lineTo(33, 20);
  c.lineTo(33, 32);
  c.lineTo(15, 32);
  c.lineTo(11, 26);
  c.closePath();
  c.fill();
  c.fillStyle = ink;
  c.beginPath();
  c.arc(15.5, 26, 1.3, 0, Math.PI * 2);
  c.fill();
  c.restore();
  if (k > 0.01) glow(c, x, y, 30 * s, m.core, 0.55 * k * alpha);
}
/** distance from a kMirror's glass centre up to the top of its hanging loop */
export const mirrorLoop = (s = 1): number => 54 * 0.5 * s;
/**
 * MESSAGE: ch10-s05's sealed note (value): parchment, folded flap, wax seal and a few lines of writing at the fold.
 * (x, y) = the centre of the note; s = 1 → 46 × 34 (s05's size).
 */
export function vNote(c: C, x: number, y: number, s = 1, alpha = 1, rot = 0, env?: PaintEnv): void {
  if (alpha <= 0.003) return;
  const m = env?.mood ?? CY;
  const ink = mixLab(m.ink, m.set, 0.1);
  c.save();
  c.globalAlpha *= alpha;
  c.translate(x, y);
  c.rotate(rot + 0.04);
  c.scale(s, s);
  const w = 46;
  const h = 34;
  c.fillStyle = withAlpha(m.fg, 0.3);
  c.fillRect(-w / 2 + 2, -h / 2 + 2, w, h);
  c.fillStyle = mixLab(P.sky[1], m.haze, 0.3);
  c.fillRect(-w / 2, -h / 2, w, h);
  c.strokeStyle = ink;
  c.lineWidth = 1.2;
  c.strokeRect(-w / 2, -h / 2, w, h);
  c.beginPath();
  c.moveTo(-w / 2, -h / 2);
  c.lineTo(0, 0);
  c.lineTo(w / 2, -h / 2);
  c.stroke();
  c.fillStyle = mixLab(ink, '#5d2a26', 0.5);
  c.beginPath();
  c.arc(0, 0, 5.2, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(ink, 0.35);
  c.lineWidth = 0.8;
  for (let k = 0; k < 3; k++) {
    c.beginPath();
    c.moveTo(-w / 2 + 6, -h / 2 + h * 0.66 + k * 4);
    c.lineTo(w / 2 - 6 - k * 6, -h / 2 + h * 0.66 + k * 4);
    c.stroke();
  }
  c.restore();
}

// ================================================================================================ cups & jug
export interface CupOpts {
  x: number;
  /** bottom of the cup */
  y: number;
  w?: number;
  h?: number;
  /** 0..1 fill (fraction of the cup's height) */
  level: number;
  /** text etched on the glass */
  etch?: string;
  etchAlpha?: number;
  alpha?: number;
  /** light colour of the liquid */
  light: string;
  core: string;
  /** frost at the rim 0..1 */
  frost?: number;
  ink?: string;
  /** brightness of the light inside 0..1 */
  glowK?: number;
  /** etch font size (default 19) and baseline height as a fraction of the cup (default: the glass middle) */
  etchSize?: number;
  etchY?: number;
  /** raise the etch to the legibility floor */
  etchLegible?: boolean;
  /** a faint blue-white tint over the glass (frozen) 0..1 */
  chill?: number;
}
export function glassCup(c: C, o: CupOpts): void {
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  const w = o.w ?? 46;
  const h = o.h ?? 96;
  const ink = o.ink ?? INK;
  const lvl = Math.max(0, Math.min(1, o.level));
  const topW = w / 2;
  const botW = w * 0.36;
  const hw = (yy: number) => botW + (topW - botW) * ((o.y - yy) / h);
  c.save();
  c.globalAlpha *= a;
  // glass body (faint)
  c.fillStyle = withAlpha(ink, 0.1);
  c.beginPath();
  c.moveTo(o.x - topW, o.y - h);
  c.lineTo(o.x - botW, o.y);
  c.lineTo(o.x + botW, o.y);
  c.lineTo(o.x + topW, o.y - h);
  c.closePath();
  c.fill();
  // the light inside
  if (lvl > 0.002) {
    const top = o.y - h * lvl;
    const g = c.createLinearGradient(0, top, 0, o.y);
    g.addColorStop(0, o.core);
    g.addColorStop(1, o.light);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(o.x - hw(top), top);
    c.lineTo(o.x - botW, o.y);
    c.lineTo(o.x + botW, o.y);
    c.lineTo(o.x + hw(top), top);
    c.closePath();
    c.fill();
    // meniscus
    c.strokeStyle = withAlpha('#ffffff', 0.7);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(o.x - hw(top) + 1, top);
    c.lineTo(o.x + hw(top) - 1, top);
    c.stroke();
    glow(c, o.x, top + (o.y - top) * 0.4, 24 + 50 * lvl, o.light, 0.35 * (o.glowK ?? 1) * Math.min(1, lvl * 3));
  }
  // rim and foot (ink)
  c.strokeStyle = ink;
  c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(o.x - topW - 2, o.y - h);
  c.lineTo(o.x - botW, o.y);
  c.lineTo(o.x + botW, o.y);
  c.lineTo(o.x + topW + 2, o.y - h);
  c.stroke();
  c.fillStyle = ink;
  c.fillRect(o.x - botW - 5, o.y, botW * 2 + 10, 5);
  // glass ribs (lantern glass)
  c.strokeStyle = withAlpha(ink, 0.22);
  c.lineWidth = 0.8;
  for (const f of [0.33, 0.66]) {
    const yy = o.y - h * f;
    c.beginPath();
    c.moveTo(o.x - hw(yy), yy);
    c.lineTo(o.x + hw(yy), yy);
    c.stroke();
  }
  // a blue-white chill over the glass (frozen)
  if ((o.chill ?? 0) > 0.01) {
    c.fillStyle = withAlpha('#dcecf4', 0.32 * (o.chill ?? 0));
    c.beginPath();
    c.moveTo(o.x - topW, o.y - h);
    c.lineTo(o.x - botW, o.y);
    c.lineTo(o.x + botW, o.y);
    c.lineTo(o.x + topW, o.y - h);
    c.closePath();
    c.fill();
  }
  // frost at the rim: a white crust over the top of the glass with icicle teeth below it
  if ((o.frost ?? 0) > 0.01) {
    const fr = o.frost ?? 0;
    const crust = h * 0.15 * fr;
    c.fillStyle = withAlpha('#f4fafc', 0.92 * fr);
    c.beginPath();
    c.moveTo(o.x - topW - 3, o.y - h - 4);
    c.lineTo(o.x + topW + 3, o.y - h - 4);
    c.lineTo(o.x + hw(o.y - h + crust) + 1, o.y - h + crust);
    const n = 9;
    for (let k = n; k >= 0; k--) {
      const u = k / n;
      const yy = o.y - h + crust;
      const xx = o.x - hw(yy) + u * 2 * hw(yy);
      const tooth = (2 + 6 * hash1(k, 31)) * fr;
      c.lineTo(xx, yy + (k % 2 ? tooth : 0));
    }
    c.closePath();
    c.fill();
    c.strokeStyle = withAlpha('#ffffff', 0.9 * fr);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(o.x - topW - 3, o.y - h - 4);
    c.lineTo(o.x + topW + 3, o.y - h - 4);
    c.stroke();
  }
  // etched share
  if (o.etch && (o.etchAlpha ?? 1) > 0.01) {
    c.globalAlpha *= o.etchAlpha ?? 1;
    c.textBaseline = 'alphabetic';
    const es0 = o.etchSize ?? 19;
    const es = o.etchLegible ? legibleSize(c, `600 ${es0}px ${FONT.mono}`, es0, o.etch) : es0;
    c.font = `600 ${es}px ${FONT.mono}`;
    c.textAlign = 'center';
    const ty = o.etchY !== undefined ? o.y - h * o.etchY + es * 0.35 : o.y - h * 0.5 + 7;
    c.fillStyle = withAlpha('#ffffff', 0.55);
    c.fillText(o.etch, o.x + 0.8, ty + 0.8);
    c.fillStyle = ink;
    c.fillText(o.etch, o.x, ty);
  }
  c.restore();
}

/** The jug of light: an ink silhouette with its lip glowing. (x, y) = the pivot near its base; tilt in radians (+ = pours to the left). */
export function jug(c: C, x: number, y: number, tilt: number, s: number, light: string, core: string, glowK: number, alpha = 1, ink = INK): { lipX: number; lipY: number } {
  const lipLocal = { x: -30, y: -66 };
  const ct = Math.cos(-tilt);
  const st = Math.sin(-tilt);
  const lipX = x + (lipLocal.x * ct - lipLocal.y * st) * s;
  const lipY = y + (lipLocal.x * st + lipLocal.y * ct) * s;
  if (alpha <= 0.003) return { lipX, lipY };
  c.save();
  c.globalAlpha *= alpha;
  c.translate(x, y);
  c.rotate(-tilt);
  c.scale(s, s);
  // body: a round-bellied pitcher, spout to the left, handle to the right
  const p = new Path2D();
  p.moveTo(-14, 0);
  p.bezierCurveTo(-34, -4, -38, -34, -24, -50);
  p.bezierCurveTo(-20, -55, -22, -60, -32, -67);
  p.lineTo(-24, -70);
  p.lineTo(18, -70);
  p.bezierCurveTo(16, -60, 14, -55, 20, -50);
  p.bezierCurveTo(36, -34, 32, -4, 14, 0);
  p.closePath();
  c.fillStyle = ink;
  c.fill(p);
  // handle (pierced loop)
  c.strokeStyle = ink;
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(18, -62);
  c.bezierCurveTo(44, -64, 44, -26, 24, -20);
  c.stroke();
  // a band of light seen through a pierced band on the belly (the light inside)
  c.fillStyle = withAlpha(mixLab(light, core, 0.5), 0.85 * glowK);
  for (let k = 0; k < 7; k++) {
    c.beginPath();
    c.arc(-18 + k * 6, -32, 1.7, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  if (glowK > 0.01) glow(c, lipX, lipY, 30 * s, core, 0.6 * glowK * alpha);
  return { lipX, lipY };
}

/** A ribbon of poured light along a polyline (additive core over a soft halo). */
export function lightStream(c: C, pts: { x: number; y: number }[], w: number, light: string, core: string, a: number): void {
  if (a <= 0.003 || pts.length < 2 || w <= 0.05) return;
  c.save();
  c.lineCap = 'round';
  c.lineJoin = 'round';
  const path = new Path2D();
  pts.forEach((p, i) => (i ? path.lineTo(p.x, p.y) : path.moveTo(p.x, p.y)));
  c.globalCompositeOperation = 'lighter';
  c.strokeStyle = withAlpha(light, 0.25 * a);
  c.lineWidth = w * 2.6 + 4;
  c.stroke(path);
  c.globalCompositeOperation = 'source-over';
  c.strokeStyle = withAlpha(mixLab(light, core, 0.5), 0.9 * a);
  c.lineWidth = w;
  c.stroke(path);
  c.strokeStyle = withAlpha('#ffffff', 0.5 * a);
  c.lineWidth = Math.max(0.6, w * 0.3);
  c.stroke(path);
  c.restore();
}

/** points along a quadratic curve from p0 to p1 bulging by `lift` (negative = up), first fraction d only */
export function arcPts(x0: number, y0: number, x1: number, y1: number, lift: number, d = 1, n = 28): { x: number; y: number }[] {
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2 + lift;
  const out: { x: number; y: number }[] = [];
  const m = Math.max(1, Math.ceil(n * d));
  for (let k = 0; k <= m; k++) {
    const u = Math.min(d, k / n);
    const v = 1 - u;
    out.push({ x: v * v * x0 + 2 * v * u * cx + u * u * x1, y: v * v * y0 + 2 * v * u * cy + u * u * y1 });
  }
  return out;
}

// ================================================================================================ ink lettering
export interface InkOpts {
  size?: number;
  font?: 'text' | 'sc' | 'mono' | 'display' | 'type';
  weight?: number;
  italic?: boolean;
  align?: CanvasTextAlign;
  color?: string;
  alpha?: number;
  tracking?: number;
  /** 0..1 inked left → right (a pen writing it) */
  draw?: number;
  /** raise the size to the film's legibility floor (22 px cap height at 1080p, camera and layer scale included) */
  legible?: boolean;
}
export function ink(c: C, text: string, x: number, y: number, o: InkOpts = {}): number {
  const a = o.alpha ?? 1;
  const fam = { text: FONT.text, sc: FONT.sc, mono: FONT.mono, display: FONT.display, type: FONT.typewriter }[o.font ?? 'text'];
  c.save();
  // explicit: a baseline left on a shared context by another painter must not move (or mis-measure) this text
  c.textBaseline = 'alphabetic';
  const pre = `${o.italic ? 'italic ' : ''}${o.weight ?? 500} `;
  const size = o.legible ? legibleSize(c, `${pre}${o.size ?? 22}px ${fam}`, o.size ?? 22, text) : o.size ?? 22;
  c.font = `${pre}${size}px ${fam}`;
  if (o.tracking) (c as C & { letterSpacing: string }).letterSpacing = `${o.tracking}px`;
  const w = c.measureText(text).width;
  if (a > 0.003) {
    c.globalAlpha *= a;
    c.textAlign = o.align ?? 'left';
    c.fillStyle = o.color ?? INK;
    const d = o.draw ?? 1;
    if (d < 1) {
      const left = (o.align ?? 'left') === 'center' ? x - w / 2 : (o.align ?? 'left') === 'right' ? x - w : x;
      c.beginPath();
      c.rect(left - 4, y - size * 1.2, (w + 8) * Math.max(0, d), size * 1.6);
      c.clip();
    }
    c.fillText(text, x, y);
  }
  c.restore();
  return w;
}

/** A hand-drawn ink circle (for circling √d_k): drawn progressively by d. */
export function inkCircle(c: C, x: number, y: number, rx: number, ry: number, d: number, col = OXBLOOD, lw = 2): void {
  if (d <= 0.003) return;
  c.save();
  c.strokeStyle = col;
  c.lineWidth = lw;
  c.lineCap = 'round';
  c.beginPath();
  const n = 48;
  const end = Math.ceil(n * 1.12 * d);
  for (let k = 0; k <= end; k++) {
    const u = (k / n) * Math.PI * 2 - 2.2;
    const wob = 1 + 0.05 * Math.sin(k * 0.9) + 0.06 * (k / n);
    const px = x + Math.cos(u) * rx * wob;
    const py = y + Math.sin(u) * ry * wob;
    if (k === 0) c.moveTo(px, py);
    else c.lineTo(px, py);
  }
  c.stroke();
  c.restore();
}

/** A hanging plate lamp's pool + edge falloff over a plate rect (call after parchmentPlate). */
export function platePool(c: C, r: { x: number; y: number; w: number; h: number }, lx: number, ly: number, mood: { halo: string; ink: string }, warm = 0): void {
  c.save();
  c.beginPath();
  c.rect(r.x, r.y, r.w, r.h);
  c.clip();
  if (warm > 0) {
    // the lamp's warm halo falling on the top of the plate (a soft ellipse spilling down from the shade)
    const wg = c.createRadialGradient(lx, r.y - 20, 10, lx, r.y + 40, r.w * 0.42);
    wg.addColorStop(0, withAlpha('#ffd9a0', 0.42 * warm));
    wg.addColorStop(0.45, withAlpha('#f6c98a', 0.16 * warm));
    wg.addColorStop(1, withAlpha('#f6c98a', 0));
    c.fillStyle = wg;
    c.fillRect(r.x, r.y, r.w, r.h);
  }
  const pool = c.createRadialGradient(lx, ly, 40, lx, ly + 200, Math.max(r.w, r.h) * 0.75);
  pool.addColorStop(0, withAlpha(P.halo, 0.22));
  pool.addColorStop(0.5, withAlpha(P.halo, 0.05));
  pool.addColorStop(1, withAlpha(P.halo, 0));
  c.fillStyle = pool;
  c.fillRect(r.x, r.y, r.w, r.h);
  const edge = c.createRadialGradient(r.x + r.w / 2, r.y + r.h * 0.45, Math.min(r.w, r.h) * 0.42, r.x + r.w / 2, r.y + r.h * 0.5, Math.max(r.w, r.h) * 0.66);
  edge.addColorStop(0, withAlpha(mood.ink, 0));
  edge.addColorStop(0.6, withAlpha(mood.ink, 0.1));
  edge.addColorStop(1, withAlpha(mood.ink, 0.32));
  c.fillStyle = edge;
  c.fillRect(r.x, r.y, r.w, r.h);
  c.restore();
}

/** Two cords from the beam above holding a plate (L4, ink). */
export function plateCords(c: C, r: { x: number; y: number; w: number }, env: PaintEnv, top = -200): void {
  c.save();
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 2;
  for (const x of [r.x + 90, r.x + r.w - 90]) {
    c.beginPath();
    c.moveTo(x, top);
    c.lineTo(x, r.y + 6);
    c.stroke();
    c.fillStyle = env.fill('ink');
    c.fillRect(x - 6, r.y - 2, 12, 9);
  }
  c.restore();
}

/** L5: a plate lamp's shade hanging into the top of frame (blurred nearest plane) above (x, y). */
export function lampShade(f: Frame, id: string, cams: Camera3[], x = 640, y = 12): void {
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, cams, 30);
    f.cached(`${id}/L5shade/${env.mood.id}/${x}/${y}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      cc.fillStyle = env.fill('fg');
      cc.fillRect(x - 3, r.y, 6, y - 20 - r.y);
      cc.beginPath();
      cc.moveTo(x - 42, y);
      cc.quadraticCurveTo(x - 38, y - 24, x - 14, y - 28);
      cc.lineTo(x + 14, y - 28);
      cc.quadraticCurveTo(x + 38, y - 24, x + 42, y);
      cc.closePath();
      cc.fill();
      cc.fillStyle = withAlpha(env.mood.core, 0.5);
      cc.beginPath();
      cc.ellipse(x, y + 1, 40, 3.5, 0, 0, Math.PI * 2);
      cc.fill();
    })(c, r.x, r.y);
  });
}

/**
 * L5: a near timber post (with a bracket arm and a hanging cord) standing at world x `x` of the L5 plane, blurred by
 * the layer: the nearest plane of a plate hung in the hall. `side` = which way its bracket reaches (-1 left, +1 right).
 */
export function nearPost(f: Frame, id: string, cams: Camera3[], x: number, side: -1 | 1 = -1, w = 34, arm = 54, cord = 120): void {
  f.layer('L5', (c, env) => {
    const r = overscan(LAYERS.L5, cams, 40);
    f.cached(`${id}/L5post/${env.mood.id}/${x}/${side}/${Math.round(r.x)}/${Math.round(r.w)}`, Math.ceil(r.w), Math.ceil(r.h), (cc) => {
      cc.translate(-r.x, -r.y);
      const fg = env.fill('fg');
      cc.fillStyle = fg;
      cc.fillRect(x - w / 2, r.y, w, r.h);
      // a capital block and a chamfered base
      cc.fillRect(x - w / 2 - 8, 30, w + 16, 22);
      cc.fillRect(x - w / 2 - 6, 610, w + 12, 30);
      // a bracket arm reaching toward the plate
      cc.beginPath();
      cc.moveTo(x, 52);
      cc.lineTo(x + side * arm, 52);
      cc.lineTo(x + side * arm, 62);
      cc.lineTo(x + side * 30, 62);
      cc.quadraticCurveTo(x + side * 10, 72, x + side * (w / 2), 110);
      cc.lineTo(x, 110);
      cc.closePath();
      cc.fill();
      // a cord hanging from the arm's end
      cc.strokeStyle = fg;
      cc.lineWidth = 3;
      cc.beginPath();
      cc.moveTo(x + side * (arm - 8), 62);
      cc.lineTo(x + side * (arm - 8), 62 + cord);
      cc.stroke();
      cc.beginPath();
      cc.arc(x + side * (arm - 8), 68 + cord, 6, 0, Math.PI * 2);
      cc.fill();
      // a sliver of rim light on the post's inner edge
      cc.fillStyle = withAlpha(env.mood.rim, 0.25);
      cc.fillRect(side < 0 ? x - w / 2 : x + w / 2 - 1.5, r.y, 1.5, r.h);
    })(c, r.x, r.y);
  });
}

/** A thin oxblood gradient arrow (learning signal) at (x, y), length len (signed: + up), alpha a. */
export function gradArrow(c: C, x: number, y: number, len: number, a: number, col = OXBLOOD, k = 1): void {
  if (a <= 0.003 || Math.abs(len) < 0.5) return;
  c.save();
  c.globalAlpha *= a;
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineWidth = 1.8 * k;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x, y - len);
  c.stroke();
  const dir = Math.sign(len);
  const hy = y - len;
  c.beginPath();
  c.moveTo(x, hy - dir * 2 * k);
  c.lineTo(x - 4.5 * k, hy + dir * 6 * k);
  c.lineTo(x + 4.5 * k, hy + dir * 6 * k);
  c.closePath();
  c.fill();
  c.restore();
}

/** ch10-s06's meter on its soft parchment card: "bank now means" and three bars (shares); `settle` 0..1 grows them */
export function bankMeter(c: C, x: number, y: number, a: number, settle: number, rows: [string, number][]): void {
  if (a <= 0.003) return;
  c.save();
  c.globalAlpha *= a;
  c.fillStyle = withAlpha(mixLab(P.sky[1], '#fff6e4', 0.5), 0.75);
  c.shadowColor = withAlpha(INK, 0.18);
  c.shadowBlur = 12;
  c.beginPath();
  c.roundRect(x - 18, y - 36, 196, 196, 8);
  c.fill();
  c.restore();
  ink(c, 'bank now means', x, y, { italic: true, size: 26, color: mixLab(INK, P.sky[1], 0.25), alpha: a, legible: true });
  const BW = 160;
  rows.forEach(([w, v], k) => {
    const yy = y + 38 + k * 46;
    const bw = BW * lerp(0.33, v / 0.6, settle);
    c.save();
    c.globalAlpha *= a;
    c.fillStyle = withAlpha(INK, 0.1);
    c.fillRect(x, yy - 14, BW, 13);
    c.fillStyle = k === 0 ? mixLab(WATER, INK, 0.3) : withAlpha(INK, 0.5);
    c.fillRect(x, yy - 14, bw, 13);
    c.restore();
    ink(c, `${w}  ${v.toFixed(2)}`, x, yy + 21, { size: 24, color: INK, alpha: a * (k === 0 ? 1 : 0.8), weight: k === 0 ? 600 : 500, legible: true });
  });
}

/**
 * The hall's hanging lamp falling on a plate: a warm pool centred under the lamp at (lx, top of plate) and a cool,
 * dark vignette at the plate's corners (call after parchmentPlate, before the plate's content). k scales both.
 */
export function lampWash(c: C, r: { x: number; y: number; w: number; h: number }, lx: number, k = 1): void {
  c.save();
  c.beginPath();
  c.rect(r.x, r.y, r.w, r.h);
  c.clip();
  const wg = c.createRadialGradient(lx, r.y + r.h * 0.18, 20, lx, r.y + r.h * 0.3, r.w * 0.62);
  wg.addColorStop(0, withAlpha('#ffdcaa', 0.38 * k));
  wg.addColorStop(0.4, withAlpha('#f3c890', 0.16 * k));
  wg.addColorStop(1, withAlpha('#f3c890', 0));
  c.fillStyle = wg;
  c.fillRect(r.x, r.y, r.w, r.h);
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h * 0.4;
  const R = Math.hypot(r.w / 2, r.h * 0.6);
  const vg = c.createRadialGradient(cx, cy, R * 0.5, cx, cy, R);
  vg.addColorStop(0, withAlpha(CY.fg, 0));
  vg.addColorStop(0.55, withAlpha(mixLab(CY.fg, P.ink, 0.5), 0.12 * k));
  vg.addColorStop(1, withAlpha(mixLab(CY.fg, P.ink, 0.5), 0.42 * k));
  c.fillStyle = vg;
  c.fillRect(r.x, r.y, r.w, r.h);
  c.restore();
}
