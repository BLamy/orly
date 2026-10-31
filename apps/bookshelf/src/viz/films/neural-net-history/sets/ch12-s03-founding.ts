/**
 * neural-net-history — the FOUNDING GRAMMAR objects shared by ch12-s03 (Anthropic, F2) and ch12-s07 (the board as
 * it stands): the small warm and cold hand-lanterns that hang from a founding card's nail, and F1 (OpenAI's
 * 11 December 2015 announcement) lettered exactly as ch09-s04 pinned it, its two spoken phrases lit.
 *
 *   handLantern(c, env, top, angle, 'warm' | 'cold', on)     one lantern hanging from `top`
 *   restPair(nail) / lanternPair(c, env, nail, on)           a pair at rest on one nail (warm left, cold right)
 *   openaiCard(c, env, x, y, dim?, light?)                   the F1 card (L4 world centre); dim < 1 recedes its
 *                                                            lettering to texture (ch12-s03, where F2 is the subject);
 *                                                            light = the paper's lamp light (default 0.8). Every line
 *                                                            is fitted to end inside the card's right edge.
 */
import type { PaintEnv } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';
import { paperTone } from './caseBoard';
import { SLOTS } from './studyState';

type C = CanvasRenderingContext2D;
const F1 = SLOTS.F1;
export const CORD = 40;
/** rest angles: the two lanterns lean apart against each other */
export const REST_A = 0.45;
export const WARM = MOODS.candleAmber;
export const COLD = MOODS.winterBlue;

/** F1, OpenAI's 11 December 2015 announcement, lettered exactly as ch09-s04 pins it (its spoken phrases lit) */
export function openaiCard(c: C, env: PaintEnv, x: number, y: number, dim = 1, light = 0.8) {
  const w = F1.w, h = F1.h;
  const m = env.mood;
  const paper = paperTone(env, light);
  c.save();
  c.translate(x, y);
  c.rotate(-0.012);
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.fillRect(-w / 2 + 2.5, -h / 2 + 3.5, w, h);
  c.fillStyle = paper;
  c.fillRect(-w / 2, -h / 2, w, h);
  const ink = mixLab(m.ink, paper, 0.1);
  c.fillStyle = withAlpha(ink, dim < 1 ? 0.26 : 1);
  c.font = `400 7.4px ${FONT.typewriter}`;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.fillText('OPENAI · 11 DEC 2015', -w / 2 + 6, -h / 2 + 11);
  c.fillRect(-w / 2 + 6, -h / 2 + 14, w - 12, 0.6);
  const small = (text: string, yy: number) => {
    // fitted so the faint line ends at least 6 px (≈ 12 px at 1080p in the insert) inside the card's right edge
    let size = 4.6;
    c.font = `400 ${size}px ${FONT.typewriter}`;
    const tw = c.measureText(text).width;
    if (tw > w - 12) {
      size *= (w - 12) / tw;
      c.font = `400 ${size}px ${FONT.typewriter}`;
    }
    c.fillStyle = withAlpha(ink, 0.24);
    c.fillText(text, -w / 2 + 6, yy);
  };
  const big = (text: string, yy: number) => {
    let size = 8.6;
    c.font = `400 ${size}px ${FONT.typewriter}`;
    const tw = c.measureText(text).width;
    if (tw > w - 10) {
      size *= (w - 10) / tw;
      c.font = `400 ${size}px ${FONT.typewriter}`;
    }
    c.fillStyle = withAlpha(ink, 0.9 * dim);
    c.fillText(text, -w / 2 + 5, yy);
  };
  small("It's hard to fathom how much human-level AI", -h / 2 + 21);
  big('could benefit society,', -h / 2 + 31);
  small("and it's equally hard to imagine how much it could", -h / 2 + 38.5);
  big('damage society if built', -h / 2 + 48);
  big('or used incorrectly.', -h / 2 + 57.5);
  c.restore();
}

/** a small hand-lantern: ring, cap, four-pane glass body lit from within, base (paper-cut; panes are holes) */
export function handLantern(c: C, env: PaintEnv, top: { x: number; y: number }, a: number, which: 'warm' | 'cold', on: number) {
  const P = which === 'warm' ? WARM : { ...COLD, halo: COLD.halo, core: mixLab(COLD.rim, '#eef6fb', 0.35) };
  c.save();
  c.translate(top.x, top.y);
  c.rotate(-a * 0.6);
  const ink = env.fill('ink');
  c.strokeStyle = ink;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 6, 6, Math.PI * 1.05, Math.PI * 1.95);
  c.stroke();
  c.fillStyle = ink;
  // cap
  c.beginPath();
  c.moveTo(-5, 6);
  c.lineTo(5, 6);
  c.lineTo(13, 16);
  c.lineTo(-13, 16);
  c.closePath();
  c.fill();
  // glass: lit panes in the lantern's own light
  const g = c.createLinearGradient(0, 16, 0, 48);
  g.addColorStop(0, mixLab(mixLab(env.mood.set, P.halo, 0.6), P.core, 0.4 * on));
  g.addColorStop(1, mixLab(mixLab(env.mood.set, P.halo, 0.45), P.core, 0.25 * on));
  c.fillStyle = on > 0.02 ? g : mixLab(env.mood.set, env.mood.fg, 0.3);
  c.fillRect(-10, 16, 20, 32);
  // frame bars
  c.fillStyle = ink;
  c.fillRect(-11, 16, 2.2, 32);
  c.fillRect(8.8, 16, 2.2, 32);
  c.fillRect(-1, 16, 2, 32);
  c.fillRect(-13, 47, 26, 6);
  c.fillRect(-9, 53, 18, 3);
  // the flame inside
  if (on > 0.05) {
    c.fillStyle = withAlpha(P.core, 0.95 * on);
    c.beginPath();
    c.moveTo(-0.0, 26);
    c.quadraticCurveTo(4, 34, 0, 40);
    c.quadraticCurveTo(-4, 34, 0, 26);
    c.fill();
  }
  c.restore();
}
/** a pair at rest on a nail (warm left, cold right), both lit at `on` (OpenAI's, from ch09-s04) */
export function restPair(nail: { x: number; y: number }) {
  return (['warm', 'cold'] as const).map((which) => {
    const a = which === 'warm' ? -REST_A : REST_A;
    const len = CORD + (which === 'warm' ? 0 : 6);
    return { which, a, end: { x: nail.x + Math.sin(a) * len, y: nail.y + Math.cos(a) * len } };
  });
}
export function lanternPair(c: C, env: PaintEnv, nail: { x: number; y: number }, on: number) {
  for (const L of restPair(nail)) {
    c.strokeStyle = withAlpha(mixLab(env.mood.ink, env.mood.set, 0.3), 0.9);
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(nail.x, nail.y);
    c.lineTo(L.end.x, L.end.y);
    c.stroke();
    handLantern(c, env, L.end, L.a, L.which, on);
  }
  c.fillStyle = mixLab(env.mood.halo, '#8a6a2a', 0.45);
  c.beginPath();
  c.arc(nail.x, nail.y, 2.6, 0, Math.PI * 2);
  c.fill();
}
