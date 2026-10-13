/**
 * neural-net-history — small props and helpers shared by ch05-s07, ch05-s08, ch05-s09b, ch05-s10
 * (one animator's group: the knowledge candle, Cyc, the second winter, the critics at the rim).
 *
 *   clamp01 / sm / lerp / win / tq12 / mixCam / camKeys / pulse / textPlateLabel   (re-exported)
 *   GEN                      generic (unnamed) 1980s figures: knowledge engineers, a clinician, a connectionist
 *                            at the rim, readers in the messenger's pool, Tokyo researchers
 *   terminal80(c, o, env)    a 1980s time-sharing terminal on a desk top (front or side view), its screen a
 *                            phosphor practical; optional screen word (prop lettering, VT323)
 *   simpleDesk(c, …)         a plain office desk slab on two legs (side-on)
 *   officeStool(c, …)        a swivel chair, side-on
 *   cardStack(c, …)          a tall stack of index cards (ink block with paper edges catching the light)
 *   ifThenStrip(c, …)        a paper strip printed IF … THEN (prop lettering)
 *   handLantern(c, …)        the trained 2-2-1 lantern network from ch05-s04, small, held like a hand-lantern
 *   lispCabinet(c, …)        the tall humming cabinet with a big monochrome screen (a Lisp-machine silhouette)
 *   filingCabinet(c, …)      an ordinary four-drawer office filing cabinet (drawer k can stand open)
 *   banknote(c, …)           a paper banknote (no lettering, no emblem): an engraved oval and a border
 *   wordStrip(c, …)          a cut-paper word strip (ch05-s10's JOHN LOVES THE GIRL tiles)
 *   lightThread(c, …)        a thread of light between two board pins (three passes, additive)
 */
import type { Camera3, PaintEnv, Palette } from '../../../film/contracts';
import { createPuppet } from '../../../film/silhouette/puppet';
import { lanternNetwork } from '../../../film/silhouette/metaphors';
import { XOR_221 } from '../../../film/silhouette/metaphors/mlp';
import { FONT, legibleSize } from '../../../film/silhouette/type';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { hash1 } from '../../../film/core/frame';
import { narratorHands, type HandsPose, type HeldDraw } from './narratorHands';

export { clamp01, sm, lerp, win, tq12 } from './ch02-s05b-util';
export { mixCam } from './ch03-s01-kit';
export { camKeys } from './ch03-s06-kit';
export { pulse, textPlateLabel } from './ch05-s01-kit';

type C = CanvasRenderingContext2D;
type P = { x: number; y: number };

// ------------------------------------------------------------------------------------------------ generic figures
/** generic, unnamed figures (never likenesses): varied by wardrobe, hair, build so no two read alike */
export const GEN = {
  engineerA: createPuppet({ id: 'gen-ke-a', height: 312, build: 'average', era: '1980s', wardrobe: 'shortSleeve', hair: 'shaggy', facialHair: 'moustache', glasses: 'heavy', profile: { nose: 0.5, brow: 0.5, chin: 0.48, jaw: 0.5 }, details: ['shirtPocket'] }),
  engineerB: createPuppet({ id: 'gen-ke-b', height: 300, build: 'slight', era: '1980s', wardrobe: 'blouseTrousers', hair: 'perm', facialHair: 'none', glasses: 'none', profile: { nose: 0.45, brow: 0.45, chin: 0.5, jaw: 0.42 } }),
  clinician: createPuppet({ id: 'gen-clin', height: 316, build: 'average', era: '1980s', wardrobe: 'labCoat', hair: 'receding', facialHair: 'none', glasses: 'rectangular', profile: { nose: 0.52, brow: 0.5, chin: 0.5, jaw: 0.5 } }),
  connectionist: createPuppet({ id: 'gen-conn', height: 306, build: 'slight', era: '1980s', wardrobe: 'cardigan', hair: 'messy', facialHair: 'beard', glasses: 'none', profile: { nose: 0.48, brow: 0.5, chin: 0.5, jaw: 0.5 }, details: ['buttons'] }),
  readerA: createPuppet({ id: 'gen-rd-a', height: 308, build: 'average', era: '1980s', wardrobe: 'sweaterVest', hair: 'curly', facialHair: 'none', glasses: 'heavy', profile: { nose: 0.5, brow: 0.5, chin: 0.5, jaw: 0.5 } }),
  readerB: createPuppet({ id: 'gen-rd-b', height: 298, build: 'slight', era: '1980s', wardrobe: 'cardiganF', hair: 'long', facialHair: 'none', glasses: 'none', profile: { nose: 0.44, brow: 0.45, chin: 0.5, jaw: 0.42 } }),
  readerC: createPuppet({ id: 'gen-rd-c', height: 318, build: 'tall', era: '1980s', wardrobe: 'polo', hair: 'crewCut', facialHair: 'moustache', glasses: 'none', profile: { nose: 0.52, brow: 0.5, chin: 0.5, jaw: 0.55 } }),
  readerD: createPuppet({ id: 'gen-rd-d', height: 304, build: 'average', era: '1980s', wardrobe: 'turtleneck', hair: 'bob', facialHair: 'none', glasses: 'rectangular', profile: { nose: 0.46, brow: 0.46, chin: 0.5, jaw: 0.44 } }),
};

// ------------------------------------------------------------------------------------------------ desk furniture
/** a plain desk, side-on: top slab at y (layer px), legs to the floor */
export function simpleDesk(c: C, x0: number, x1: number, y: number, floorY: number, env: PaintEnv) {
  c.fillStyle = env.fill('ink');
  c.fillRect(x0, y, x1 - x0, 7);
  c.fillRect(x0 + 8, y + 7, 7, floorY - y - 7);
  c.fillRect(x1 - 15, y + 7, 7, floorY - y - 7);
  c.fillRect(x0 + 8, y + 7, (x1 - x0) * 0.42, 34); // a drawer pedestal
  c.fillStyle = withAlpha(env.mood.rim, 0.32);
  c.fillRect(x0, y - 0.6, x1 - x0, 1.2);
  c.fillStyle = withAlpha(env.mood.rim, 0.16);
  c.fillRect(x0 + 12, y + 24, (x1 - x0) * 0.42 - 8, 1);
}

/** a swivel office chair, side-on; its seat at seatY, facing (the back is behind the sitter) */
export function officeStool(c: C, x: number, seatY: number, floorY: number, facing: 'left' | 'right', env: PaintEnv) {
  const d = facing === 'right' ? -1 : 1; // the back is on the side away from the facing
  c.fillStyle = env.fill('ink');
  c.fillRect(x - 26, seatY, 52, 7);
  c.fillRect(x - 3, seatY + 7, 6, floorY - seatY - 16);
  c.beginPath();
  c.moveTo(x - 34, floorY);
  c.lineTo(x, floorY - 12);
  c.lineTo(x + 34, floorY);
  c.lineTo(x + 30, floorY);
  c.lineTo(x, floorY - 7);
  c.lineTo(x - 30, floorY);
  c.closePath();
  c.fill();
  // the back: a post and a rounded pad
  c.fillRect(x + d * 22 - 2, seatY - 30, 5, 32);
  c.beginPath();
  c.roundRect(x + d * 22 - 6, seatY - 86, 12, 60, 5);
  c.fill();
}

// ------------------------------------------------------------------------------------------------ terminals
export interface TerminalDraw {
  x: number;
  /** desk-top y the terminal stands on */
  y: number;
  s?: number;
  view: 'front' | 'side';
  /** side view: which way the screen faces */
  facing?: 'left' | 'right';
  /** 0..1 screen brightness (0 = dark, quiet) */
  screen: number;
  /** a word on the screen (front view only; prop lettering) */
  word?: string;
  wordAlpha?: number;
  /** phosphor colour (default: a pale green-amber mixed into the mood, low chroma) */
  phosphor?: string;
  /** typed rows on the screen (front view; 0..1 how many) */
  rows?: number;
  seed?: number;
}
export function phosphorOf(m: Palette) {
  return mixLab(mixLab(m.core, '#b8f0c0', 0.32), m.halo, 0.15);
}
/** a 1980s terminal: a deep CRT with a separate keyboard slab; screen glow is the caller's f.practical */
export function terminal80(c: C, o: TerminalDraw, env: PaintEnv) {
  const s = o.s ?? 1;
  const ink = env.fill('ink');
  const ph = o.phosphor ?? phosphorOf(env.mood);
  c.save();
  c.translate(o.x, o.y);
  c.scale(s, s);
  c.fillStyle = ink;
  if (o.view === 'front') {
    // keyboard slab in front (low), the CRT behind on a short neck
    c.beginPath();
    c.moveTo(-40, 0);
    c.lineTo(40, 0);
    c.lineTo(36, -7);
    c.lineTo(-36, -7);
    c.closePath();
    c.fill();
    c.fillRect(-10, -14, 20, 8);
    c.beginPath();
    c.roundRect(-36, -70, 72, 58, 6);
    c.fill();
    // screen (a lit hole)
    const sw = 54, sh = 40;
    // a dark phosphor field (the glyphs carry the light, so a word on it stays legible)
    c.fillStyle = mixLab(ink, ph, 0.1 + 0.26 * o.screen);
    c.beginPath();
    c.roundRect(-sw / 2, -64, sw, sh, 5);
    c.fill();
    if (o.screen > 0.01) {
      const g = c.createRadialGradient(0, -44, 2, 0, -44, 34);
      g.addColorStop(0, withAlpha(ph, 0.16 * o.screen));
      g.addColorStop(1, withAlpha(ph, 0));
      c.fillStyle = g;
      c.fillRect(-sw / 2, -64, sw, sh);
      // scanned rows of text (bars), and the word
      const rows = Math.round((o.rows ?? 0) * 5);
      c.fillStyle = withAlpha(mixLab(ph, env.mood.core, 0.4), 0.55 * o.screen);
      for (let i = 0; i < Math.min(rows, 2); i++) c.fillRect(-sw / 2 + 5, -60 + i * 5, 14 + 26 * (0.5 + 0.5 * hash1(i, o.seed ?? 3)), 2);
      if (o.word && (o.wordAlpha ?? 1) > 0.01) {
        c.font = `400 ${24}px ${FONT.phosphor}`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        const wa = (o.wordAlpha ?? 1) * Math.min(1, o.screen * 1.4);
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.fillStyle = withAlpha(ph, 0.35 * wa);
        c.fillText(o.word, 0.6, -41.4);
        c.restore();
        c.fillStyle = withAlpha(mixLab(ph, env.mood.core, 0.7), wa);
        c.fillText(o.word, 0, -42);
      }
    }
    c.strokeStyle = withAlpha(env.mood.rim, 0.28);
    c.lineWidth = 1;
    c.beginPath();
    c.roundRect(-36, -70, 72, 58, 6);
    c.stroke();
  } else {
    const d = o.facing === 'left' ? -1 : 1;
    // keyboard toward the facing side
    c.beginPath();
    c.moveTo(d * 10, 0);
    c.lineTo(d * 58, 0);
    c.lineTo(d * 56, -6);
    c.lineTo(d * 12, -4);
    c.closePath();
    c.fill();
    // the deep CRT body: a box tapering to the back
    c.beginPath();
    c.moveTo(d * 18, -10);
    c.lineTo(d * 18, -66);
    c.lineTo(-d * 22, -60);
    c.lineTo(-d * 46, -48);
    c.lineTo(-d * 46, -22);
    c.lineTo(-d * 22, -10);
    c.closePath();
    c.fill();
    c.fillRect(-d * 14, -10, d * 26, 10);
    // the screen's face edge catches its own glow
    if (o.screen > 0.01) {
      c.fillStyle = withAlpha(ph, 0.85 * o.screen);
      c.fillRect(d * 18 - (d > 0 ? 0 : 2.4), -62, 2.4, 48);
    }
    c.strokeStyle = withAlpha(env.mood.rim, 0.25);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(d * 18, -66);
    c.lineTo(-d * 22, -60);
    c.stroke();
  }
  c.restore();
}
/** the screen centre of a terminal (for the glow practical) */
export function terminalScreen(o: Pick<TerminalDraw, 'x' | 'y' | 's' | 'view' | 'facing'>): P {
  const s = o.s ?? 1;
  if (o.view === 'front') return { x: o.x, y: o.y - 44 * s };
  const d = o.facing === 'left' ? -1 : 1;
  return { x: o.x + d * 26 * s, y: o.y - 38 * s };
}

// ------------------------------------------------------------------------------------------------ paper
/** a tall stack of index cards: an ink block, the card edges as faint lit lines, a few cards askew */
export function cardStack(c: C, x: number, y: number, w: number, h: number, env: PaintEnv, seed = 1) {
  const ink = env.fill('ink');
  c.fillStyle = ink;
  const n = Math.max(3, Math.floor(h / 4));
  for (let i = 0; i < n; i++) {
    const off = hash1(i, seed) * 3;
    c.fillRect(x - w / 2 + off, y - (i + 1) * (h / n), w, h / n + 0.5);
  }
  c.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.halo, 0.4), 0.32);
  c.lineWidth = 0.8;
  c.beginPath();
  for (let i = 1; i < n; i += 2) {
    const off = hash1(i, seed) * 3;
    const yy = y - i * (h / n);
    c.moveTo(x - w / 2 + off + 1, yy);
    c.lineTo(x + w / 2 + off - 1, yy);
  }
  c.stroke();
  // the top card, lit by the flame
  c.fillStyle = mixLab(env.mood.halo, env.mood.rim, 0.5);
  c.fillRect(x - w / 2 + hash1(n, seed) * 3, y - h - 2, w, 2.2);
}

/** a paper strip printed IF … THEN (prop lettering): centre (x, y), width ≈ 74·s */
export function ifThenStrip(c: C, x: number, y: number, s: number, rot: number, alpha: number, env: PaintEnv, paper?: string) {
  if (alpha <= 0.01) return;
  const w = 74 * s, h = 17 * s;
  c.save();
  c.globalAlpha *= alpha;
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = withAlpha(env.mood.fg, 0.3);
  c.fillRect(-w / 2 + 1.5 * s, -h / 2 + 2 * s, w, h);
  c.fillStyle = paper ?? mixLab(env.mood.halo, env.mood.rim, 0.55);
  c.fillRect(-w / 2, -h / 2, w, h);
  c.font = `400 ${13 * s}px ${FONT.phosphor}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = withAlpha(env.mood.ink, 0.85);
  c.fillText('IF … THEN', 0, 0.6 * s);
  c.restore();
}

/** a paper banknote: no lettering, no emblem; an engraved oval and a border */
export function banknote(c: C, x: number, y: number, s: number, rot: number, alpha: number, env: PaintEnv) {
  if (alpha <= 0.01) return;
  const w = 46 * s, h = 21 * s;
  c.save();
  c.globalAlpha *= alpha;
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = mixLab(env.mood.setHaze, env.mood.halo, 0.45);
  c.fillRect(-w / 2, -h / 2, w, h);
  c.strokeStyle = withAlpha(env.mood.ink, 0.45);
  c.lineWidth = 0.8 * s;
  c.strokeRect(-w / 2 + 2 * s, -h / 2 + 2 * s, w - 4 * s, h - 4 * s);
  c.beginPath();
  c.ellipse(0, 0, 6.5 * s, 6 * s, 0, 0, Math.PI * 2);
  c.stroke();
  c.restore();
}

/** a cut-paper word strip (a tile): centre (x, y) */
export function wordStrip(c: C, text: string, x: number, y: number, size: number, alpha: number, env: PaintEnv, o: { rot?: number; glow?: number } = {}) {
  if (alpha <= 0.01) return { w: 0, h: 0 };
  c.save();
  c.font = `400 ${size}px ${FONT.typewriter}`;
  const tw = c.measureText(text).width;
  const w = tw + size * 1.4, h = size * 1.6;
  c.globalAlpha *= alpha;
  c.translate(x, y);
  c.rotate(o.rot ?? 0);
  c.fillStyle = withAlpha(env.mood.fg, 0.4);
  c.fillRect(-w / 2 + 3, -h / 2 + 4, w, h);
  c.fillStyle = mixLab(mixLab(env.mood.halo, env.mood.rim, 0.55), env.mood.core, 0.25 * (o.glow ?? 0));
  c.fillRect(-w / 2, -h / 2, w, h);
  c.strokeStyle = withAlpha(env.mood.ink, 0.35);
  c.lineWidth = 1;
  c.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);
  c.fillStyle = withAlpha(env.mood.ink, 0.9);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, 0, size * 0.06);
  c.restore();
  return { w, h };
}

// ------------------------------------------------------------------------------------------------ lantern network
/** the trained 2-2-1 lantern network (ch05-s04), in a small loom frame with a carrying bail; (x, y) = the
 *  bail's top (the hand's grip); w = frame width. Draws its own glows. flicker: which unit flickers (0..1) */
export function handLantern(c: C, x: number, y: number, w: number, env: PaintEnv, o: { light?: number; reveal?: number } = {}) {
  const h = w * 1.05;
  const top = y + w * 0.16;
  c.save();
  // the bail (a wire loop up to the grip)
  c.strokeStyle = env.fill('ink');
  c.lineWidth = Math.max(1.2, w * 0.03);
  c.beginPath();
  c.moveTo(x - w * 0.38, top + 2);
  c.quadraticCurveTo(x, y - w * 0.12, x + w * 0.38, top + 2);
  c.stroke();
  c.globalAlpha *= o.light ?? 1;
  // the network hangs upside-down from our point of view? No: output at the top, inputs below, as on the loom
  lanternNetwork(c, { x: x - w / 2, y: top, w, h, training: XOR_221, epoch: XOR_221.epochs, sample: 1, labels: false, readout: false, reveal: o.reveal ?? 1 }, env);
  c.restore();
}

// ------------------------------------------------------------------------------------------------ machines
/** a Symbolics-style Lisp machine (review r1: it must not read as a kiosk): the tall processor TOWER on the floor at
 *  left, beside it a desk whose top carries the big PORTRAIT CRT console and its low keyboard. Base centre (x, y) is
 *  the floor under the desk's left leg; units scale with s. `deskTop` (local, negative = up; default -74) sets the
 *  desk height so a standing typist's hands meet the keys; `deskX1` how far the desk reaches right (default 104). */
export interface LispOpts {
  rows?: number;
  seed?: number;
  deskTop?: number;
  deskX1?: number;
}
export function lispCabinet(c: C, x: number, y: number, s: number, screen: number, env: PaintEnv, o: LispOpts = {}) {
  const ink = env.fill('ink');
  const ph = phosphorOf(env.mood);
  const dT = o.deskTop ?? -74;
  const dX1 = o.deskX1 ?? 104;
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  // the tower: a tall cabinet with a plinth, vent louvres and a status lamp
  c.fillStyle = ink;
  c.fillRect(-84, -176, 58, 176);
  c.fillRect(-88, -180, 66, 7);
  c.fillRect(-86, -6, 62, 6);
  c.fillStyle = withAlpha(env.mood.rim, 0.18);
  for (let i = 0; i < 11; i++) c.fillRect(-76, -160 + i * 9, 42, 1.4);
  c.fillRect(-84, -62, 58, 1.2);
  c.fillStyle = withAlpha(mixLab(ph, env.mood.core, 0.4), 0.3 + 0.7 * screen);
  c.fillRect(-40, -30, 5, 3);
  // the cable from tower to console, low along the floor
  c.strokeStyle = ink;
  c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(-26, -20);
  c.quadraticCurveTo(-18, -2, -6, -8);
  c.stroke();
  // the desk: a slab top with a modesty panel and two legs
  c.fillStyle = ink;
  c.fillRect(-16, dT, dX1 + 16, 6);
  c.fillRect(-12, dT + 6, 6, -dT - 6);
  c.fillRect(dX1 - 10, dT + 6, 6, -dT - 6);
  c.fillRect(-12, dT + 6, dX1 * 0.55, (-dT - 6) * 0.45);
  c.fillStyle = withAlpha(env.mood.rim, 0.24);
  c.fillRect(-16, dT, dX1 + 16, 1.2);
  // the console: a portrait CRT in a deep case, on a short neck and foot, set back on the desk
  const cx = 30;
  const top = dT - 6 - 104;
  c.fillStyle = ink;
  c.fillRect(cx - 18, dT - 4, 36, 4);
  c.fillRect(cx - 6, dT - 8, 12, 4);
  c.beginPath();
  c.roundRect(cx - 36, top, 72, 104, 7);
  c.fill();
  // (the case's depth: a darker tail behind the screen, CRTs are deep)
  c.fillRect(cx - 44, top + 14, 10, 74);
  const sx = cx - 28, sy = top + 9, sw = 56, sh = 86;
  c.fillStyle = mixLab(ink, ph, 0.1 + 0.62 * screen);
  c.beginPath();
  c.roundRect(sx, sy, sw, sh, 6);
  c.fill();
  if (screen > 0.01) {
    const g = c.createRadialGradient(sx + sw / 2, sy + sh / 2, 4, sx + sw / 2, sy + sh / 2, 62);
    g.addColorStop(0, withAlpha(ph, 0.45 * screen));
    g.addColorStop(1, withAlpha(ph, 0));
    c.fillStyle = g;
    c.fillRect(sx, sy, sw, sh);
    const rows = Math.round((o.rows ?? 0.7) * 11);
    c.fillStyle = withAlpha(mixLab(ph, env.mood.core, 0.4), 0.5 * screen);
    for (let i = 0; i < rows; i++) c.fillRect(sx + 6, sy + 8 + i * 7, 10 + 32 * (0.5 + 0.5 * hash1(i, o.seed ?? 7)), 2);
  }
  c.strokeStyle = withAlpha(env.mood.rim, 0.26);
  c.lineWidth = 1.2;
  c.beginPath();
  c.roundRect(cx - 36, top, 72, 104, 7);
  c.stroke();
  // the keyboard: a low wedge at the desk's front edge, toward the typist
  const kx0 = cx + 22, kx1 = Math.min(dX1 - 4, cx + 70);
  c.fillStyle = ink;
  c.beginPath();
  c.moveTo(kx0, dT);
  c.lineTo(kx1, dT);
  c.lineTo(kx1 - 3, dT - 6);
  c.lineTo(kx0 + 2, dT - 4);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(env.mood.rim, 0.2);
  c.fillRect(kx0 + 2, dT - 5, kx1 - kx0 - 5, 1);
  c.restore();
}
/** where the console's screen centre is (pass the same deskTop as the draw) */
export function lispScreen(x: number, y: number, s: number, deskTop = -74): P {
  return { x: x + 30 * s, y: y + (deskTop - 6 - 104 + 9 + 43) * s };
}

/** an ordinary four-drawer office filing cabinet, base centre (x, y); `open` slides drawer k out (0..1) */
export function filingCabinet(c: C, x: number, y: number, s: number, env: PaintEnv, o: { open?: number; drawer?: number; glow?: number } = {}) {
  const ink = env.fill('ink');
  const W = 60, H = 150;
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = ink;
  c.fillRect(-W / 2, -H, W, H);
  c.fillRect(-W / 2 - 2, -H - 4, W + 4, 5);
  const dh = (H - 8) / 4;
  for (let i = 0; i < 4; i++) {
    const yy = -H + 4 + i * dh;
    const isOpen = o.drawer === i ? o.open ?? 0 : 0;
    const dx = -isOpen * 26; // drawers pull out toward the left (toward the candle)
    if (isOpen > 0.01) {
      // the open drawer's body and the cards standing in it
      c.fillStyle = ink;
      c.fillRect(-W / 2 + dx, yy + 3, -dx + 2, dh - 6);
      c.fillStyle = withAlpha(mixLab(env.mood.halo, env.mood.rim, 0.5), 0.55 + 0.3 * (o.glow ?? 0));
      for (let k = 0; k < 6; k++) c.fillRect(-W / 2 + dx + 3 + k * 4, yy - 1, 1.6, 7);
      c.fillStyle = ink;
    }
    c.strokeStyle = withAlpha(env.mood.rim, 0.3);
    c.lineWidth = 1;
    c.strokeRect(-W / 2 + 3 + dx, yy + 2, W - 6, dh - 4);
    // the handle and a label holder (blank)
    c.fillStyle = withAlpha(env.mood.rim, 0.35);
    c.fillRect(-9 + dx, yy + dh * 0.55, 18, 2);
    c.strokeRect(-7 + dx, yy + dh * 0.22, 14, 7);
  }
  c.restore();
}
/** the mouth of drawer k (where strips slip in), world px */
export function drawerMouth(x: number, y: number, s: number, k: number, open = 1): P {
  const H = 150, dh = (H - 8) / 4;
  return { x: x + (-30 - 26 * open + 6) * s, y: y + (-H + 4 + k * dh) * s };
}

/** the thin Cyc taper as wax: a slim paper-cut candle, warm near its flame, CYC in tiny caps up its side */
export function cycTaper(c: C, env: PaintEnv, x: number, y: number, lit: number, s = 1, rings = 0, o: { widthK?: number; labelPx?: number; labelLight?: number } = {}) {
  const m = env.mood;
  const w = 13 * s * (o.widthK ?? 1), H = (270 - 6 * rings) * s;
  const g = c.createLinearGradient(0, y, 0, y - H);
  g.addColorStop(0, mixLab(env.fill('set'), m.fg, 0.4));
  g.addColorStop(0.75, mixLab(env.fill('set'), m.setHaze, 0.4));
  g.addColorStop(1, mixLab(m.setHaze, m.halo, 0.25 + 0.45 * lit));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - w / 2, y);
  c.lineTo(x - w / 2, y - H + 2 * s);
  c.quadraticCurveTo(x, y - H - 1.5 * s, x + w / 2, y - H + 2 * s);
  c.lineTo(x + w / 2, y);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(m.fg, 0.6);
  c.lineWidth = 1;
  c.stroke();
  c.fillStyle = withAlpha(m.rim, 0.35 + 0.3 * lit);
  c.fillRect(x - w / 2, y - H + 2 * s, 1.2, H - 2 * s);
  // the wick
  c.strokeStyle = env.fill('ink');
  c.lineWidth = 1.3 * s;
  c.beginPath();
  c.moveTo(x, y - H);
  c.quadraticCurveTo(x - 0.6 * s, y - H - 3 * s, x + 0.7 * s, y - H - 5 * s);
  c.stroke();
  c.save();
  c.translate(x, y - 270 * s * 0.62);
  c.rotate(-Math.PI / 2);
  c.font = `400 ${o.labelPx ?? 11 * s}px ${FONT.phosphor}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  // labelLight 0: dark letters cut into the wax; 1: pale letters (legible at stage distance)
  c.fillStyle = (o.labelLight ?? 0) > 0 ? withAlpha(mixLab(m.halo, m.rim, 0.5), 0.9) : withAlpha(mixLab(m.fg, m.ink, 0.5), 0.75);
  c.fillText('CYC', 0, 0.6 * s);
  c.restore();
}

/** FILE (top-down, CAMERA3_HOME, inside L4): the manila case file on the desk in the lamp's pool, open (its
 *  front cover laid out to the left of the spine), the filed slips on the right leaf; `drop` 0..1 lays the new
 *  slip on top; `cover` 0..1 swings the cover over the spine (closed). The tab reads CASE. */
export function caseFile(c: C, env: PaintEnv, o: { x: number; y: number; cover: number; slips: number; drop: number; t: number }) {
  const m = env.mood;
  // desk top: dark wood, the lamp's pool, grain cut-lines
  c.fillStyle = mixLab(m.set, m.fg, 0.35);
  c.fillRect(-200, -200, 1680, 1120);
  const g = c.createRadialGradient(o.x + 40, o.y - 30, 30, o.x + 40, o.y - 30, 760);
  g.addColorStop(0, withAlpha(mixLab(m.setHaze, m.halo, 0.5), 0.95));
  g.addColorStop(0.55, withAlpha(mixLab(m.set, m.halo, 0.2), 0.55));
  g.addColorStop(1, withAlpha(m.set, 0));
  c.fillStyle = g;
  c.fillRect(-200, -200, 1680, 1120);
  c.strokeStyle = withAlpha(m.fg, 0.24);
  c.lineWidth = 1;
  for (let i = 0; i < 26; i++) {
    const yy = -40 + i * 31 + hash1(i, 3) * 6;
    c.beginPath();
    c.moveTo(-200, yy);
    c.bezierCurveTo(300, yy + hash1(i, 4) * 14, 900, yy - hash1(i, 5) * 14, 1480, yy);
    c.stroke();
  }
  const W = 300, H = 380;
  const manila = mixLab(mixLab(m.halo, '#b08a52', 0.35), m.rim, 0.15);
  const spine = o.x;
  // the back leaf (right of the spine) and its tab
  c.fillStyle = withAlpha(m.fg, 0.4);
  c.fillRect(spine + 8, o.y - H / 2 + 10, W, H);
  c.fillStyle = manila;
  c.fillRect(spine, o.y - H / 2, W, H);
  c.fillRect(spine + W - 120, o.y - H / 2 - 30, 104, 32);
  // the tab's lettering at the legibility floor (the refrain's file: the viewer should read CASE)
  c.font = `400 ${legibleSize(c, `400 25px ${FONT.typewriter}`, 25, 'CASE')}px ${FONT.typewriter}`;
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillStyle = withAlpha(m.ink, 0.85);
  c.fillText('CASE', spine + W - 68, o.y - H / 2 - 13);
  // the filed slips, askew, typed lines showing; then the new one
  const slip = (i: number, a: number, dy: number) => {
    const sx = spine + 30 + hash1(i, 21) * 14, sy = o.y - H / 2 + 40 + i * 54 + dy;
    c.save();
    c.globalAlpha *= a;
    c.translate(sx + 120, sy + 30);
    c.rotate(hash1(i, 22) * 0.06);
    c.fillStyle = withAlpha(m.fg, 0.3);
    c.fillRect(-117, -27, 240, 60);
    c.fillStyle = mixLab('#e6d7b8', m.halo, 0.25);
    c.fillRect(-120, -30, 240, 60);
    c.fillStyle = withAlpha(m.ink, 0.42);
    for (let k = 0; k < 3; k++) c.fillRect(-104, -18 + k * 12, 150 + 50 * (0.5 + 0.5 * hash1(i * 5 + k, 23)), 3);
    c.restore();
  };
  for (let i = 0; i < o.slips; i++) slip(i, 1, 0);
  if (o.drop > 0) slip(o.slips, o.drop, -30 * (1 - o.drop));
  // the front cover: open to the left of the spine, swinging over (top-down: its width is cos of the angle)
  const ang = Math.PI * (1 - o.cover); // π = open (laid left), 0 = closed (over the slips)
  const cw = W * Math.cos(ang);
  const under = Math.cos(ang) < 0;
  c.fillStyle = withAlpha(m.fg, 0.35 * (1 - Math.abs(Math.sin(ang)) * 0.5));
  c.fillRect(spine + (cw < 0 ? cw : 0) + 6, o.y - H / 2 + 8, Math.abs(cw), H);
  c.fillStyle = under ? mixLab(manila, m.set, 0.12) : mixLab(manila, m.rim, 0.12 * o.cover);
  c.fillRect(spine + (cw < 0 ? cw : 0), o.y - H / 2, Math.abs(cw), H);
  c.fillStyle = withAlpha(m.fg, 0.5);
  c.fillRect(spine - 1.5, o.y - H / 2, 3, H);
}

// ------------------------------------------------------------------------------------------------ board threads
/** a thread of light between two pins: a sagging curve drawn to u, additive; k = strength */
export function lightThread(c: C, env: PaintEnv, a: P, b: P, u: number, k: number, sag = 26) {
  if (u <= 0.003 || k <= 0.003) return;
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + sag;
  c.save();
  c.globalCompositeOperation = 'lighter';
  for (const [lw, al] of [[6, 0.07], [2.4, 0.22], [1, 0.62]] as const) {
    c.strokeStyle = withAlpha(env.mood.core, Math.min(1, al * k));
    c.lineWidth = lw;
    c.beginPath();
    c.moveTo(a.x, a.y);
    const n = 30;
    for (let i = 1; i <= n * Math.min(1, u); i++) {
      const v = i / n;
      const w = 1 - v;
      c.lineTo(w * w * a.x + 2 * w * v * mx + v * v * b.x, w * w * a.y + 2 * w * v * my + v * v * b.y);
    }
    c.stroke();
  }
  c.restore();
}

/** a camera helper: the camera at a pure fraction between keys (re-exported shape) */
export type Cam = Camera3;

/**
 * The narrator's hands at close range (one scale across ch05-s07/-s08/-s10): the whole arm drawn soft (≈3 px,
 * like L5), then only the hand and what it holds drawn sharp on top (clipped from just behind the cuff forward).
 */
export function softArmHands(c: C, hp: HandsPose, env: PaintEnv, o?: HeldDraw, blurPx = 3) {
  const len = 118 * (hp.scale ?? 1);
  c.save();
  c.filter = `blur(${(blurPx * env.pxScale).toFixed(2)}px)`;
  narratorHands.draw(c, hp, env, o);
  c.restore();
  c.save();
  c.beginPath();
  for (const a of [hp.right, hp.left]) {
    if (!a) continue;
    const ca = Math.cos(a.angle), sa = Math.sin(a.angle);
    const P = (lx: number, ly: number) => [a.wrist.x + (lx * ca - ly * sa) * len, a.wrist.y + (lx * sa + ly * ca) * len] as const;
    const q = [P(-0.12, -1.6), P(2.4, -1.6), P(2.4, 1.6), P(-0.12, 1.6)];
    c.moveTo(q[0][0], q[0][1]);
    for (const v of q.slice(1)) c.lineTo(v[0], v[1]);
    c.closePath();
  }
  c.clip();
  narratorHands.draw(c, hp, env, o);
  c.restore();
}
