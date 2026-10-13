/**
 * Glossary tags — the trade term for a metaphor, named once (review round 1, teacher: "after a metaphor's first
 * use, name the real term with a synced on-screen label"). Script onScreenText kind 'term' ({text, gloss, beat})
 * becomes timeline shot.terms [{text, gloss, at, until}] (generator/film/lib/timing.mjs); the reel paints them over
 * the shot, after the transition and before the finish pass, so every term in the film looks the same and no shot
 * has to draw it.
 *
 * The tag: a small cut-card label hung on a thread from the top-left of the frame (inside the title-safe area),
 * the term in tracked IBM Plex Mono capitals, the metaphor it names in italic EB Garamond beneath, both at or over
 * the kit's legibility floor (22 px cap height at 1080p). It drops in on twos with a little swing, holds, and lifts
 * out. Stage px (1280x720), screen-locked.
 */
import type { Palette } from '../contracts';
import { FONT, drawTracked, legibleSize, measureTracked } from '../silhouette/type';
import { mixLab, withAlpha } from '../silhouette/palette';

export interface TermTag {
  text: string;
  gloss?: string;
  /** shot-local seconds */
  at: number;
  until: number;
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
const CARD = '#efe4cc';
const INK = '#241c14';

/** c: the scene canvas at stage scale (setTransform(pxScale…) already applied); local: shot-local seconds */
export function paintTerms(c: CanvasRenderingContext2D, terms: TermTag[] | undefined, local: number, mood: Palette): void {
  if (!terms?.length) return;
  for (const term of terms) {
    if (local < term.at - 0.05 || local > term.until + 0.6) continue;
    const tq = Math.floor(local * 12) / 12; // the tag moves on twos, like the puppets
    const inK = smooth((tq - term.at) / 0.5);
    const outK = smooth((term.until + 0.5 - tq) / 0.5);
    const k = Math.min(inK, outK);
    if (k <= 0) continue;
    const label = term.text.toUpperCase();
    const tSize = legibleSize(c, `500 21px ${FONT.mono}`, 21);
    const tFont = `500 ${tSize}px ${FONT.mono}`;
    const gSize = legibleSize(c, `italic 400 22px ${FONT.text}`, 22);
    const gFont = `italic 400 ${gSize}px ${FONT.text}`;
    const tw = measureTracked(c, label, { font: tFont, size: tSize, tracking: 0.14 });
    c.save();
    c.font = gFont;
    const gw = term.gloss ? c.measureText(term.gloss).width : 0;
    c.restore();
    const padX = 22;
    const w = Math.max(tw, gw) + padX * 2;
    const h = tSize * 1.25 + (term.gloss ? gSize * 1.5 : 0) + 30;
    const x0 = 72;
    const yHang = 34; // the thread's top, under the frame edge
    const drop = (1 - k) * -(h + 60);
    const swing = Math.sin(local * 2.1 + term.at) * 0.012 * (1 - smooth((tq - term.at - 0.5) / 2.5)) + (1 - inK) * 0.05;
    const card = mixLab(CARD, mood.core, 0.08);
    c.save();
    c.globalAlpha = Math.min(1, k * 1.2);
    c.translate(x0 + 34, yHang + drop);
    c.rotate(swing);
    // thread from above the frame to the card's punched hole
    c.strokeStyle = withAlpha(mixLab(card, INK, 0.55), 0.85);
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(0, -80);
    c.lineTo(0, 26);
    c.stroke();
    // the card: cut-paper, soft lift shadow, a slightly torn top corner
    c.translate(-34, 26);
    c.shadowColor = withAlpha('#000000', 0.45);
    c.shadowBlur = 10;
    c.shadowOffsetY = 4;
    c.fillStyle = card;
    c.beginPath();
    c.moveTo(0, 6);
    c.lineTo(6, 0);
    c.lineTo(w, 0);
    c.lineTo(w, h);
    c.lineTo(0, h);
    c.closePath();
    c.fill();
    c.shadowColor = 'rgba(0,0,0,0)';
    c.shadowBlur = 0;
    c.shadowOffsetY = 0;
    // inner rule, punched hole with a reinforcing ring
    c.strokeStyle = withAlpha(INK, 0.35);
    c.lineWidth = 0.8;
    c.strokeRect(6, 6, w - 12, h - 12);
    c.fillStyle = withAlpha(INK, 0.85);
    c.beginPath();
    c.arc(34, 0, 3.2, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(INK, 0.35);
    c.beginPath();
    c.arc(34, 0, 6, 0, Math.PI * 2);
    c.stroke();
    // the term, then the metaphor it names
    c.fillStyle = INK;
    c.textBaseline = 'alphabetic';
    drawTracked(c, label, padX, 14 + tSize * 1.02, { font: tFont, size: tSize, tracking: 0.14, align: 'left' });
    if (term.gloss) {
      c.fillStyle = withAlpha(INK, 0.82);
      c.font = gFont;
      c.textAlign = 'left';
      c.fillText(term.gloss, padX, 14 + tSize * 1.25 + gSize * 1.2);
    }
    c.restore();
  }
}
