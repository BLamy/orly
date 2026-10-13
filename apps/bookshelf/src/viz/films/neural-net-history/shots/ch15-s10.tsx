/**
 * ch15-s10 — the silent end cards (parchment; 28.83 s; in: fadeBlack from the new candle's flame).
 *
 * A lightbox in a dark room: one sheet of parchment lit softly from BEHIND (a warm hot spot under its centre,
 * the paper's fibres and laid lines showing through, the deckled edge darker where the light thins). Three
 * sheets in turn, each laid on the same glass, nothing else on screen:
 *   b1 (0.5)        Turing's closing sentence sets in, EB Garamond, centred; its attribution in small italic.
 *   b2 (11.3)       crossfade to a second, smaller sheet: the credits disclosure in IBM Plex Mono, reading size.
 *   sources (23.5)  crossfade to one static sheet: SOURCES · published with the film.
 *   b3 (28)         fade to black.
 * Silence under all of it (no final cadence). The camera breathes a slow push on the glass; nothing else moves
 * except the faint drift of the lightbox's hot spot. No logos, no product imagery.
 */
import { Timeline } from '../../../core';
import type { PaintEnv, ShotScene } from '../../../film';
import { CAMERA3_HOME, FONT, MOODS, defineShot, drawTracked, hash1, measureTracked, mixLab, withAlpha, wrapLines } from '../../../film';

const ID = 'ch15-s10';
type C = CanvasRenderingContext2D;
const clamp01 = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u);
const sm = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const win = (t: number, a: number, b: number) => sm((t - a) / Math.max(1e-6, b - a));

const P = MOODS.parchment;
const TURING = 'We can only see a short distance ahead, but we can see plenty there that needs to be done.';
const TURING_BY = 'Alan Turing, 1950';
const DISCLOSURE = 'Written with Claude Opus 5.5, made by Anthropic, a lab in this story, and held to the same sources and standard as every other.';

/** the three sheets (stage px, centred on the glass) */
const SHEETS = {
  turing: { w: 1010, h: 520, seed: 11 },
  disclosure: { w: 840, h: 330, seed: 23 },
  sources: { w: 700, h: 230, seed: 37 },
} as const;
type SheetId = keyof typeof SHEETS;

interface Scene extends ShotScene {
  D: number;
  b1: number;
  b2: number;
  src: number;
  b3: number;
}

/** the lightbox surround: a dark warm room, the glass a little lighter under the sheet */
function surround(c: C) {
  c.fillStyle = mixLab(P.fg, '#000000', 0.55);
  c.fillRect(-200, -200, 1680, 1120);
  const g = c.createRadialGradient(640, 360, 60, 640, 360, 820);
  g.addColorStop(0, withAlpha(mixLab(P.set, P.fg, 0.55), 0.85));
  g.addColorStop(0.55, withAlpha(mixLab(P.set, P.fg, 0.8), 0.45));
  g.addColorStop(1, withAlpha(P.fg, 0));
  c.fillStyle = g;
  c.fillRect(-200, -200, 1680, 1120);
}

/** one sheet of parchment, backlit: baked once (fibres, laid lines, deckle, the light's falloff toward the edge) */
function sheet(c: C, id: SheetId) {
  const S = SHEETS[id];
  const { w, h, seed } = S;
  const x0 = -w / 2, y0 = -h / 2;
  // the deckled outline: a slightly irregular edge, each side its own seeded wobble
  const edge = new Path2D();
  const n = 60;
  const wob = (i: number, k: number) => 1.6 * hash1(i, seed + k) + 0.8 * hash1(i * 3, seed + k + 9);
  edge.moveTo(x0, y0);
  for (let i = 1; i <= n; i++) edge.lineTo(x0 + (w * i) / n, y0 + wob(i, 1));
  for (let i = 1; i <= n / 2; i++) edge.lineTo(x0 + w + wob(i, 2), y0 + (h * i) / (n / 2));
  for (let i = 1; i <= n; i++) edge.lineTo(x0 + w - (w * i) / n, y0 + h + wob(i, 3));
  for (let i = 1; i <= n / 2; i++) edge.lineTo(x0 + wob(i, 4), y0 + h - (h * i) / (n / 2));
  edge.closePath();
  // a soft contact shadow on the glass
  c.save();
  c.filter = 'blur(10px)';
  c.fillStyle = withAlpha(P.fg, 0.55);
  c.translate(4, 7);
  c.fill(edge);
  c.restore();
  c.save();
  c.clip(edge);
  // the paper, lit from behind: warm and bright under its centre, deeper toward the edges
  const base = c.createRadialGradient(0, -h * 0.05, 10, 0, 0, Math.hypot(w, h) * 0.62);
  base.addColorStop(0, mixLab(P.core, P.sky[0], 0.35));
  base.addColorStop(0.45, P.sky[0]);
  base.addColorStop(0.8, P.sky[2]);
  base.addColorStop(1, mixLab(P.sky[3], P.set, 0.45));
  c.fillStyle = base;
  c.fillRect(x0 - 4, y0 - 4, w + 8, h + 8);
  // laid lines and chain lines (the mould's wires, seen only because the light comes through)
  c.strokeStyle = withAlpha(P.set, 0.07);
  c.lineWidth = 0.7;
  for (let y = y0 + 3; y < y0 + h; y += 3.2) {
    c.beginPath();
    c.moveTo(x0, y);
    c.lineTo(x0 + w, y + 0.6);
    c.stroke();
  }
  c.strokeStyle = withAlpha(P.set, 0.1);
  c.lineWidth = 1.4;
  for (let x = x0 + 18; x < x0 + w; x += 62) {
    c.beginPath();
    c.moveTo(x, y0);
    c.lineTo(x + 1.5, y0 + h);
    c.stroke();
  }
  // fibres: short seeded hairs, a few darker inclusions
  for (let i = 0; i < Math.round((w * h) / 520); i++) {
    const fx = x0 + (hash1(i, seed + 21) * 0.5 + 0.5) * w;
    const fy = y0 + (hash1(i, seed + 22) * 0.5 + 0.5) * h;
    const a = hash1(i, seed + 23) * Math.PI;
    const L = 3 + 9 * (hash1(i, seed + 24) * 0.5 + 0.5);
    c.strokeStyle = withAlpha(hash1(i, seed + 25) > 0.55 ? P.set : P.rim, 0.1 + 0.08 * (hash1(i, seed + 26) * 0.5 + 0.5));
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(fx, fy);
    c.quadraticCurveTo(fx + Math.cos(a) * L * 0.5 + 2, fy + Math.sin(a) * L * 0.5 - 1, fx + Math.cos(a) * L, fy + Math.sin(a) * L);
    c.stroke();
  }
  // cloudy formation (thicker and thinner pulp), the way backlit paper mottles
  for (let i = 0; i < 26; i++) {
    const cx = x0 + (hash1(i, seed + 31) * 0.5 + 0.5) * w;
    const cy = y0 + (hash1(i, seed + 32) * 0.5 + 0.5) * h;
    const r = 30 + 70 * (hash1(i, seed + 33) * 0.5 + 0.5);
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, r);
    const thick = hash1(i, seed + 34) > 0;
    g.addColorStop(0, withAlpha(thick ? P.sky[3] : P.core, 0.09));
    g.addColorStop(1, withAlpha(thick ? P.sky[3] : P.core, 0));
    c.fillStyle = g;
    c.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  }
  // the deckle: the edge darkens a little where the paper thins and curls
  const e = 22;
  for (const [gx0, gy0, gx1, gy1, rx, ry, rw, rh] of [
    [0, y0, 0, y0 + e, x0, y0, w, e],
    [0, y0 + h, 0, y0 + h - e, x0, y0 + h - e, w, e],
    [x0, 0, x0 + e, 0, x0, y0, e, h],
    [x0 + w, 0, x0 + w - e, 0, x0 + w - e, y0, e, h],
  ] as const) {
    const g = c.createLinearGradient(gx0, gy0, gx1, gy1);
    g.addColorStop(0, withAlpha(P.set, 0.32));
    g.addColorStop(1, withAlpha(P.set, 0));
    c.fillStyle = g;
    c.fillRect(rx, ry, rw, rh);
  }
  c.restore();
}

/** the words on each sheet (drawn live so they can set in line by line) */
function words(c: C, id: SheetId, t: number, at: number) {
  const ink = P.ink;
  const A0 = c.globalAlpha;
  c.save();
  c.textBaseline = 'alphabetic';
  if (id === 'turing') {
    const size = 38;
    const font = `400 ${size}px ${FONT.text}`;
    const lines = wrapLines(c, TURING, font, 820, 46);
    const lh = size * 1.42;
    const top = -((lines.length - 1) * lh + 74) / 2 + size * 0.3;
    c.font = font;
    c.textAlign = 'center';
    lines.forEach((ln, i) => {
      const k = win(t, at + 0.2 + i * 0.55, at + 1.6 + i * 0.55);
      c.globalAlpha = A0 * 0.92 * k;
      c.fillStyle = ink;
      c.fillText(ln, 0, top + i * lh + (1 - k) * 3);
    });
    const endT = at + 1.6 + lines.length * 0.55;
    const ay = top + (lines.length - 1) * lh + 74;
    const k = win(t, endT, endT + 1.0);
    // a short rule, then the attribution in small italic
    c.globalAlpha = A0 * 0.5 * k;
    c.fillRect(-26, ay - 34, 52, 0.9);
    c.globalAlpha = A0 * 0.8 * k;
    c.font = `italic 400 24px ${FONT.text}`;
    c.fillText(TURING_BY, 0, ay);
  } else if (id === 'disclosure') {
    const size = 24;
    const font = `400 ${size}px ${FONT.mono}`;
    const lines = wrapLines(c, DISCLOSURE, font, 720, 50);
    const lh = size * 1.6;
    const top = -((lines.length - 1) * lh) / 2 + size * 0.32;
    c.font = font;
    c.textAlign = 'center';
    lines.forEach((ln, i) => {
      const k = win(t, at + 0.35 + i * 0.4, at + 1.4 + i * 0.4);
      c.globalAlpha = A0 * 0.9 * k;
      c.fillStyle = ink;
      c.fillText(ln, 0, top + i * lh);
    });
  } else {
    const k = win(t, at + 0.3, at + 1.3);
    c.globalAlpha = A0 * 0.92 * k;
    c.fillStyle = ink;
    // SOURCES · published with the film (one line: the label in tracked capitals, the rest in lower case)
    const a = 'SOURCES';
    const b = ' · published with the film';
    const wa = measureTracked(c, a, { font: `500 26px ${FONT.mono}`, size: 26, tracking: 0.18 }) + 4;
    c.font = `400 24px ${FONT.mono}`;
    const wb = c.measureText(b).width;
    const x0 = -(wa + wb) / 2;
    drawTracked(c, a, x0, 9, { font: `500 26px ${FONT.mono}`, size: 26, tracking: 0.18, align: 'left' });
    c.font = `400 24px ${FONT.mono}`;
    c.textAlign = 'left';
    c.fillText(b, x0 + wa, 9);
    c.globalAlpha = A0 * 0.45 * k;
    c.fillRect(x0, 34, wa + wb, 0.9);
  }
  c.restore();
}

export default defineShot<Scene>({
  id: ID,
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    return { tl, D: T.duration, b1: T.beat('b1'), b2: T.beat('b2'), src: T.beat('sources'), b3: T.beat('b3') };
  },
  paint(f, _s, sc) {
    const t = f.t;
    // the slow breath of a camera on the glass: a 2% push over the whole shot (every layer the same plane)
    const z = 22 * sm(t / sc.D);
    f.camera({ ...CAMERA3_HOME, z });
    f.setMood('parchment');
    // sheet changes: the old sheet's words leave first; the new sheet is laid on top of the old one; then the old
    // sheet is drawn away from under it (paper never turns to grey glass in between); then the new words set in
    const lay = (at: number) => win(t, at - 0.35, at + 0.3);
    const lift = (at: number) => 1 - win(t, at + 0.3, at + 1.0);
    const aT = win(t, sc.b1 - 0.4, sc.b1 + 0.6) * lift(sc.b2);
    const aD = lay(sc.b2) * lift(sc.src);
    const aS = lay(sc.src);
    const wT = 1 - win(t, sc.b2 - 1.0, sc.b2 - 0.4);
    const wD = 1 - win(t, sc.src - 1.0, sc.src - 0.4);
    // the lightbox's light: on with the first sheet, out at the end (fade to black)
    const light = win(t, 0, 0.9) * (1 - win(t, sc.b3, sc.D - 0.08));
    f.layer('L4', (c: C, env: PaintEnv) => {
      f.cached(`${ID}/surround/${env.mood.id}`, 1680, 1120, (cc) => {
        cc.translate(200, 200);
        surround(cc);
      })(c, -200, -200);
      // the hot spot drifts a hair (the lamp under the glass is not quite still)
      const hx = 640 + 6 * Math.sin(t * 0.21), hy = 352 + 4 * Math.sin(t * 0.17 + 1);
      const g = c.createRadialGradient(hx, hy, 20, hx, hy, 560);
      g.addColorStop(0, withAlpha(P.halo, 0.1));
      g.addColorStop(1, withAlpha(P.halo, 0));
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
      for (const [id, a, at, wa] of [['turing', aT, sc.b1, wT], ['disclosure', aD, sc.b2 + 0.6, wD], ['sources', aS, sc.src + 0.6, 1]] as const) {
        if (a <= 0.003) continue;
        const S = SHEETS[id];
        c.save();
        c.globalAlpha = a;
        const pad = 40;
        f.cached(`${ID}/sheet/${id}`, S.w + 2 * pad, S.h + 2 * pad, (cc) => {
          cc.translate(S.w / 2 + pad, S.h / 2 + pad);
          sheet(cc, id);
        })(c, 640 - S.w / 2 - pad, 360 - S.h / 2 - pad);
        c.translate(640, 360);
        c.globalAlpha = a * wa;
        if (wa > 0.003) words(c, id, t, at);
        c.restore();
      }
    });
    // the room goes dark around the light: open from black, close to black
    const dark = 1 - light;
    if (dark > 0.002) {
      f.c.save();
      f.c.fillStyle = `rgba(0,0,0,${dark.toFixed(3)})`;
      f.c.fillRect(-20, -20, 1320, 760);
      f.c.restore();
    }
  },
});
