/**
 * ch15-s10 — the silent end cards (parchment; 28.7 s on the locked clock; in: fadeBlack from the new candle's flame).
 * Round-4 global ghost fix (applied): the WORDS swap on the type kit's textSwap clock (textSwapOut / textSwapIn: the
 * outgoing words are gone at beat - 0.05, the incoming rise from beat - 0.1 over 0.35 s) while the papers crossfade;
 * card layout unchanged (Turing 0.5-8.5, credits 8.5-21.3, sources 21.3-27.9, then the candle-only fade).
 *
 * A lightbox in a dark room: one sheet of parchment lit softly from BEHIND, and the light behind it is the new
 * candle from ch15-s09: its flame shows faintly through the paper (a warm hot spot low on the sheet, the candle's
 * shadow under it), so the last image of the film is still the new flame. Three sheets, card to card, every change
 * on a script beat (T.beat; the clock: b1 0.5, b2 8.5, sources 21.3, b3 27.9):
 *   0 → b2 (~8 s)       Turing's closing sentence, already inked as the fade from black opens (no grey first frame)
 *   b2 → sources (~12.8 s) crossfade, text to text (the new sheet arrives with its words; no blank stock between):
 *                       the CREDITS card in IBM Plex Mono at reading size
 *   sources → b3 (~6.6 s) the SOURCES sheet: the real address of the published sources page (from the manifest's
 *                       film.sourcesUrl) and the two files it is built from, claims.json · quotes.json, all at 28 px
 *                       cap or larger
 *   b3 → end            the sheet fades and the candle glow it hid is left alone in the dark, then fades to black
 *                       (any spare seconds the clock gives belong to this candle-only fade, never to the cards)
 * Silence under all of it (no final cadence). No logos, no product imagery.
 */
import { Timeline } from '../../../core';
import type { PaintEnv, ShotScene } from '../../../film';
import { CAMERA3_HOME, FONT, MOODS, capPx1080, cardProbe, defineShot, drawTracked, hash1, mixLab, textRole, textSwapIn, textSwapOut, withAlpha, wrapLines } from '../../../film';

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
/** the end credits: every model and tool that made the film, generated at publish from the recorded provenance
 *  (generator/film/lib/credits.mjs → ../credits.json; user direction 2026-10-13: not only Claude) */
import CREDITS from '../credits.json';
const CREDIT_ROWS: [string, string][] = (CREDITS.card as string[]).map((l) => {
  const i = l.indexOf(' — ');
  return i < 0 ? ['', l] : [l.slice(0, i), l.slice(i + 3)];
});

/** the three sheets (stage px, centred on the glass) */
const SHEETS = {
  // round-3 shots r1: the Turing sheet cut to 440 (it read top-heavy at 520, the lower 45% empty)
  turing: { w: 1010, h: 440, seed: 11 },
  disclosure: { w: 980, h: 540, seed: 23 },
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
    const top = -((lines.length - 1) * lh + 74) / 2 + size * 0.3;
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
    // CREDITS: tracked heading, then role (dim, right-aligned) | credit (full ink), every row at >= 22 px cap
    textRole(c, 'subject', () => {
      const hSize = capSize(c, '500', FONT.mono, 26, 28);
      c.globalAlpha = A0 * 0.92;
      drawTracked(c, 'CREDITS', 0, -206, { font: `500 ${hSize}px ${FONT.mono}`, size: hSize, tracking: 0.22, align: 'center' });
      c.globalAlpha = A0 * 0.4;
      c.fillRect(-150, -186, 300, 1);
    });
    const size = capSize(c, '400', FONT.mono, 22, 22);
    const lh = size * 1.75;
    const top = -150 + size;
    CREDIT_ROWS.forEach(([role, credit], i) => {
      const y = top + i * lh;
      c.font = `400 ${size}px ${FONT.mono}`;
      c.textAlign = 'right';
      c.globalAlpha = A0 * 0.62;
      c.fillText(role, -24, y);
      c.font = `500 ${size}px ${FONT.mono}`;
      c.textAlign = 'left';
      c.globalAlpha = A0 * 0.94;
      c.fillText(credit, 0, y);
    });
    c.font = `italic 400 ${capSize(c, 'italic 400', FONT.mono, 22, 22)}px ${FONT.mono}`;
    c.textAlign = 'center';
    c.globalAlpha = A0 * 0.7;
    c.fillText(String(CREDITS.footer ?? ''), 0, top + CREDIT_ROWS.length * lh + 26);
  } else {
    // SOURCES in tracked capitals over the real address and the two files, every line at >= 28 px cap (round-2 note)
    textRole(c, 'subject', () => {
      const tSize = capSize(c, '500', FONT.mono, 28, 30);
      c.globalAlpha = A0 * 0.92;
      drawTracked(c, 'SOURCES', 0, -110, { font: `500 ${tSize}px ${FONT.mono}`, size: tSize, tracking: 0.22, align: 'center' });
      c.globalAlpha = A0 * 0.4;
      c.fillRect(-170, -90, 340, 1);
      const size = capSize(c, '400', FONT.mono, 26, 28);
      c.font = `400 ${size}px ${FONT.mono}`;
      c.textAlign = 'center';
      c.globalAlpha = A0 * 0.92;
      c.fillText(SOURCES_HOST, 0, -36);
      c.fillText(SOURCES_PATH, 0, -36 + size * 1.35);
      c.globalAlpha = A0 * 0.8;
      c.fillText(SOURCES_FILES, 0, -36 + size * 1.35 * 2 + 22);
    });
  }
  c.restore();
}

/** the new candle behind the glass (from ch15-s09): its shadow on the paper and its flame showing through */
const FLAME = { x: 640, y: 500 };
function candleBehind(c: C, t: number, through: number, clipTo: SheetId[]) {
  if (through <= 0.003 || !clipTo.length) return;
  const fl = 1 + 0.05 * Math.sin(t * 7.3) + 0.03 * Math.sin(t * 13.1 + 1);
  // while the fadeBlack opens the shot (0 → ~1 s) the hot spot stays warm (P.halo), its paler core only once up
  const hot = sm(through / 0.85) * sm((t - 0.15) / 0.9);
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
  g.addColorStop(0, withAlpha(mixLab(P.halo, P.core, hot), 0.32 * through));
  g.addColorStop(0.3, withAlpha(P.halo, 0.12 * through));
  g.addColorStop(1, withAlpha(P.halo, 0));
  c.fillStyle = g;
  c.fillRect(FLAME.x - 130, FLAME.y - 130, 260, 260);
  // the flame's own shape, diffused by the paper: warm (P.halo) while the paper is still dim, its hot core only as the
  // light comes fully through (round-3 shots r1: it read cool white over grey stock during the fade-up)
  c.filter = 'blur(3px)';
  c.fillStyle = withAlpha(mixLab(mixLab(P.halo, '#d99a3a', 0.35), mixLab(P.core, '#ffffff', 0.3), hot), 0.45 * through * (0.3 + 0.7 * hot));
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
    // card to card (round-3 shots r1): each crossfade is 0.6 s, the incoming sheet a hair ahead of the outgoing one, and
    // every sheet's WORDS ride its own paper (they are one piece of paper), so every frame shows one sheet with its
    // words at >= 50% and there is never blank stock; the Turing sheet is fully inked from frame 0 (the fadeBlack opens
    // on it)
    const xIn = (at: number) => win(t, at - 0.35, at + 0.25);
    const xOut = (at: number) => win(t, at - 0.25, at + 0.35);
    const aT = 1 - xOut(sc.b2);
    const aD = xIn(sc.b2) * (1 - xOut(sc.src));
    // the last sheet goes from b3 (the script's 'fade to black from 21.2'), b3 → b3 + 0.5, leaving the flame it hid
    // alone; the flame goes out by the end
    const aS = xIn(sc.src) * (1 - win(t, sc.b3, sc.b3 + 0.5));
    // what shows of each sheet (a later sheet lies over an earlier one)
    const vT = aT * (1 - aD), vD = aD * (1 - aS), vS = aS;
    const paper = 1 - (1 - aT) * (1 - aD) * (1 - aS);
    // the words ride their own sheets: what shows of each sheet's words is what shows of its paper; an OUTGOING
    // sheet's words go a little ahead of it (squared) so the covered text never ghosts through the new sheet's words.
    // Review round 4 (no ghost text, type kit textSwap): the WORDS swap on their own short clock while the papers
    // crossfade. The outgoing words are gone (at - 0.35 -> at - 0.05) before the incoming words pass 30 % (they rise
    // from at - 0.1 over 0.35 s, 30 % at about at + 0.03), so no frame shows two readable texts on top of each other.
    const wT = textSwapOut(t, sc.b2 - 0.35, 0.36);
    const wD = textSwapIn(t, sc.b2 - 0.1, 0.35) * textSwapOut(t, sc.src - 0.35, 0.36);
    const wS = textSwapIn(t, sc.src - 0.1, 0.35) * (1 - win(t, sc.b3, sc.b3 + 0.5));
    const flameAlone = win(t, sc.b3, sc.b3 + 0.5) * (1 - win(t, sc.b3 + 0.5, sc.D - 0.05));
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
        // round-3 cards rule: the audit sees each sheet with the words it carries (what shows of paper and ink)
        cardProbe(c, `${ID}/${id}`, 640 - S.w / 2, 360 - S.h / 2, S.w, S.h, id === 'turing' ? vT : id === 'disclosure' ? vD : vS, id === 'turing' ? wT : id === 'disclosure' ? wD : wS);
      }
      // the flame behind the glass (through whichever sheet is down; the sheets share the one light)
      candleBehind(c, t, 0.85 * paper, ([['turing', aT], ['disclosure', aD], ['sources', aS]] as const).filter((q) => q[1] > 0.02).map((q) => q[0]));
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
