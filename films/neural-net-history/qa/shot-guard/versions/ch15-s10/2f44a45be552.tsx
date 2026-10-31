/**
 * ch15-s10 — the silent end cards (parchment; 28.88 s; in: fadeBlack from the new candle's flame).
 *
 * A lightbox in a dark room: one sheet of parchment lit softly from BEHIND, and the light behind it is the new
 * candle from ch15-s09: its flame shows faintly through the paper (a warm hot spot low on the sheet, the candle's
 * shadow under it), so the last image of the film is still the new flame. Three sheets, card to card:
 *   0 → b2 (10.3)    Turing's closing sentence, already inked as the fade from black opens (no grey first frame)
 *   b2               crossfade, text to text (the new sheet arrives with its words; no blank stock between)
 *                    the credits disclosure in IBM Plex Mono at reading size
 *   sources (21.5)   crossfade to the SOURCES sheet: the real address of the published sources page (from the
 *                    manifest's film.sourcesUrl) and the two files it is built from, claims.json · quotes.json, all at
 *                    28 px cap or larger, held ~6 s
 *   b3 (28.08)       the sheet fades and the flame it hid is left alone in the dark; then black
 * Silence under all of it (no final cadence). No logos, no product imagery.
 */
import { Timeline } from '../../../core';
import type { PaintEnv, ShotScene } from '../../../film';
import { CAMERA3_HOME, FONT, MOODS, capPx1080, defineShot, drawTracked, hash1, mixLab, textRole, withAlpha, wrapLines } from '../../../film';

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
/** the published sources page (manifest film.sourcesUrl, generator/film/publish.mjs), split at the path for the card */
const SOURCES_HOST = 'orly.brett-lamy.workers.dev';
const SOURCES_PATH = '/generated/neural-net-history/sources';
const SOURCES_FILES = 'claims.json · quotes.json';
const DISCLOSURE = 'Written with Claude Opus 5.5, made by Anthropic, a lab in this story, and held to the same sources and standard as every other.';

/** the three sheets (stage px, centred on the glass) */
const SHEETS = {
  turing: { w: 1010, h: 520, seed: 11 },
  disclosure: { w: 840, h: 330, seed: 23 },
  sources: { w: 900, h: 400, seed: 37 },
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

/** a font size whose cap height is at least `cap` px on a 1080p frame (camera and layer scale included) */
function capSize(c: C, weight: string, family: string, base: number, cap: number): number {
  const got = capPx1080(c, `${weight} ${base}px ${family}`);
  return got >= cap ? base : Math.ceil(((base * cap) / got) * 10) / 10;
}
/** the words on each sheet, fully inked (sheets crossfade with their words; nothing sets in over blank stock) */
function words(c: C, id: SheetId) {
  const ink = P.ink;
  const A0 = c.globalAlpha;
  c.save();
  c.textBaseline = 'alphabetic';
  c.fillStyle = ink;
  if (id === 'turing') {
    const size = 38;
    const font = `400 ${size}px ${FONT.text}`;
    const lines = wrapLines(c, TURING, font, 820, 46);
    const lh = size * 1.42;
    const top = -((lines.length - 1) * lh + 74) / 2 + size * 0.3 - 40;
    c.font = font;
    c.textAlign = 'center';
    c.globalAlpha = A0 * 0.92;
    lines.forEach((ln, i) => c.fillText(ln, 0, top + i * lh));
    const ay = top + (lines.length - 1) * lh + 74;
    c.globalAlpha = A0 * 0.5;
    c.fillRect(-26, ay - 34, 52, 0.9);
    c.globalAlpha = A0 * 0.8;
    c.font = `italic 400 ${capSize(c, 'italic 400', FONT.text, 24, 22)}px ${FONT.text}`;
    c.fillText(TURING_BY, 0, ay);
  } else if (id === 'disclosure') {
    const size = capSize(c, '400', FONT.mono, 24, 22);
    const font = `400 ${size}px ${FONT.mono}`;
    const lines = wrapLines(c, DISCLOSURE, font, 720, 50);
    const lh = size * 1.6;
    const top = -((lines.length - 1) * lh) / 2 + size * 0.32 - 30;
    c.font = font;
    c.textAlign = 'center';
    c.globalAlpha = A0 * 0.9;
    lines.forEach((ln, i) => c.fillText(ln, 0, top + i * lh));
  } else {
    // SOURCES in tracked capitals over the real address and the two files, every line at >= 28 px cap (round-2 note)
    textRole(c, 'subject', () => {
      const tSize = capSize(c, '500', FONT.mono, 28, 30);
      c.globalAlpha = A0 * 0.92;
      drawTracked(c, 'SOURCES', 0, -96, { font: `500 ${tSize}px ${FONT.mono}`, size: tSize, tracking: 0.22, align: 'center' });
      c.globalAlpha = A0 * 0.4;
      c.fillRect(-170, -76, 340, 1);
      const size = capSize(c, '400', FONT.mono, 26, 28);
      c.font = `400 ${size}px ${FONT.mono}`;
      c.textAlign = 'center';
      c.globalAlpha = A0 * 0.92;
      c.fillText(SOURCES_HOST, 0, -22);
      c.fillText(SOURCES_PATH, 0, -22 + size * 1.35);
      c.globalAlpha = A0 * 0.8;
      c.fillText(SOURCES_FILES, 0, -22 + size * 1.35 * 2 + 22);
    });
  }
  c.restore();
}

/** the new candle behind the glass (from ch15-s09): its shadow on the paper and its flame showing through */
const FLAME = { x: 640, y: 486 };
function candleBehind(c: C, t: number, through: number, clipTo: SheetId[]) {
  if (through <= 0.003 || !clipTo.length) return;
  const fl = 1 + 0.05 * Math.sin(t * 7.3) + 0.03 * Math.sin(t * 13.1 + 1);
  c.save();
  // seen only through the paper
  c.beginPath();
  for (const id of clipTo) c.rect(640 - SHEETS[id].w / 2, 360 - SHEETS[id].h / 2, SHEETS[id].w, SHEETS[id].h);
  c.clip();
  // the candle's soft shadow (the stick below the flame) where the paper is lit around it
  c.filter = 'blur(6px)';
  c.fillStyle = withAlpha(P.set, 0.16 * through);
  c.fillRect(FLAME.x - 9, FLAME.y + 14, 18, 200);
  c.filter = 'none';
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(FLAME.x, FLAME.y, 0, FLAME.x, FLAME.y, 120 * fl);
  g.addColorStop(0, withAlpha(P.core, 0.32 * through));
  g.addColorStop(0.3, withAlpha(P.halo, 0.12 * through));
  g.addColorStop(1, withAlpha(P.halo, 0));
  c.fillStyle = g;
  c.fillRect(FLAME.x - 130, FLAME.y - 130, 260, 260);
  // the flame's own shape, diffused by the paper
  c.filter = 'blur(3px)';
  c.fillStyle = withAlpha(mixLab(P.core, '#ffffff', 0.3), 0.45 * through);
  c.beginPath();
  c.ellipse(FLAME.x, FLAME.y - 6 * fl, 5, 14 * fl, 0, 0, Math.PI * 2);
  c.fill();
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
    // card to card: each crossfade is 1.0 s centred on its beat, the new sheet arriving WITH its words; the Turing
    // sheet is fully inked from frame 0 (the fadeBlack transition opens on it)
    const xf = (at: number) => win(t, at - 0.5, at + 0.5);
    const aT = 1 - xf(sc.b2);
    const aD = xf(sc.b2) * (1 - xf(sc.src));
    // the last sheet goes at b3 - 0.75 → b3, leaving the flame it hid alone; the flame goes out by the end
    const aS = xf(sc.src) * (1 - win(t, sc.b3 - 0.75, sc.b3));
    const paper = Math.max(aT, aD, aS);
    const flameAlone = win(t, sc.b3 - 0.75, sc.b3) * (1 - win(t, sc.b3 + 0.15, sc.D - 0.05));
    f.layer('L4', (c: C, env: PaintEnv) => {
      // the lightbox room: present while a sheet is on the glass, gone with the last one
      c.save();
      c.globalAlpha = paper;
      f.cached(`${ID}/surround/${env.mood.id}`, 1680, 1120, (cc) => {
        cc.translate(200, 200);
        surround(cc);
      })(c, -200, -200);
      const hx = 640 + 6 * Math.sin(t * 0.21), hy = 352 + 4 * Math.sin(t * 0.17 + 1);
      const g = c.createRadialGradient(hx, hy, 20, hx, hy, 560);
      g.addColorStop(0, withAlpha(P.halo, 0.1));
      g.addColorStop(1, withAlpha(P.halo, 0));
      c.fillStyle = g;
      c.fillRect(0, 0, 1280, 720);
      c.restore();
      if (paper < 1) {
        c.save();
        c.fillStyle = `rgba(0,0,0,${(1 - paper).toFixed(3)})`;
        c.fillRect(-200, -200, 1680, 1120);
        c.restore();
      }
      for (const [id, a] of [['turing', aT], ['disclosure', aD], ['sources', aS]] as const) {
        if (a <= 0.003) continue;
        const S = SHEETS[id];
        c.save();
        c.globalAlpha = a;
        const pad = 40;
        f.cached(`${ID}/sheet/${id}`, S.w + 2 * pad, S.h + 2 * pad, (cc) => {
          cc.translate(S.w / 2 + pad, S.h / 2 + pad);
          sheet(cc, id);
        })(c, 640 - S.w / 2 - pad, 360 - S.h / 2 - pad);
        c.restore();
      }
      // the flame behind the glass (through whichever sheet is down; the sheets share the one light)
      candleBehind(c, t, 0.85 * paper, ([['turing', aT], ['disclosure', aD], ['sources', aS]] as const).filter((q) => q[1] > 0.02).map((q) => q[0]));
      // the words cross over a short overlap (old out, new in), so there is never bare stock and never a muddle
      const wOut = (at: number) => 1 - win(t, at - 0.5, at + 0.1);
      const wIn = (at: number) => win(t, at - 0.1, at + 0.5);
      const wT = wOut(sc.b2);
      const wD = wIn(sc.b2) * wOut(sc.src);
      const wS = wIn(sc.src) * (1 - win(t, sc.b3 - 0.75, sc.b3));
      for (const [id, a] of [['turing', wT], ['disclosure', wD], ['sources', wS]] as const) {
        if (a <= 0.003) continue;
        c.save();
        c.globalAlpha = a;
        c.translate(640, 360);
        words(c, id);
        c.restore();
      }
    });
    // the new flame alone in the dark: the last image
    if (flameAlone > 0.003) {
      f.practical({ x: FLAME.x, y: FLAME.y - 4, kind: 'candle', seed: 2027, intensity: 0.95 * flameAlone, radius: 60 });
    }
  },
});
