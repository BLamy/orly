/**
 * ch15-s04 — the carpenter's folding ruler nailed to the study wall beside the Wall of Forecasts (L4 world).
 * It stands in the empty band above the candle shelf, between the CHOKEPOINT and BEHIND candles, and climbs up
 * the Wall's empty lower-left corner (W2 is a bare pin) to just under W1's slip. Once unfolded in ch15-s04 it
 * stays there: later study shots that frame this corner of the Wall draw it fully open (`unfold: () => 1`).
 *
 *   drawFoldingRuler(c, env, { t, unfold, signAt })    inside f.layer('L4') / studyCase extra
 *
 * Lettering is prop lettering on the wall, all on the ruler's RIGHT (the X-ray box stands to its left):
 * MINUTES at the foot, 1 HOUR · MAR 2025 (brass pin), 4 HOURS, 16 HOURS · MAY 2026 (brass pin); one '≈7 mo'
 * bracket beside the first unfolded section only; the sign UNRELIABLE ABOVE HERE hangs to the left of the top
 * section, over the empty wall above the X-ray box.
 */
import type { PaintEnv } from '../../../film/contracts';
import { PUPPET_NEAR_BLACK } from '../../../film/silhouette/puppet';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, textRole } from '../../../film/silhouette/type';
import { clamp01, win } from './ch15-s01-kit';

type C = CanvasRenderingContext2D;

export const RULER = { x: 1412, base: 680, sec: 46, w: 28, n: 9 };
/** sections: 0 = MINUTES at the foot; each hinge above is one doubling (log scale) */
const TICKS: Record<number, string> = { 0: 'MINUTES', 4: '1 HOUR · MAR 2025', 6: '4 HOURS', 8: '16 HOURS · MAY 2026' };
const PINNED = new Set([4, 8]);

export interface RulerDraw {
  t: number;
  /** 0..1 per section index (section 0 is always open) */
  unfold: (i: number) => number;
  /** when the sign drops and swings (shot-local s); omit for a sign already hanging still */
  signAt?: number;
  /** 0..1 the foot's MINUTES lettering (it is set in when the ruler is first measured; default 1) */
  foot?: number;
  /** 0..1 how much light the wall lettering catches (the lamp shade's shadow dims it; default 1) */
  lit?: number;
}

export function drawFoldingRuler(c: C, env: PaintEnv, o: RulerDraw) {
  const m = env.mood;
  const R = RULER;
  const t = o.t;
  const unfold = o.unfold;
  const card = PUPPET_NEAR_BLACK;
  const lit = o.lit ?? 1;
  const tickCol = mixLab(mixLab(m.rim, '#f3e2bd', 0.35), m.fg, 0.85 * (1 - lit));
  const brass = mixLab(m.halo, '#e8cf8f', 0.35);
  // the nail at the foot
  c.fillStyle = mixLab(m.halo, m.set, 0.35);
  c.beginPath();
  c.arc(R.x, R.base - 6, 3.5, 0, Math.PI * 2);
  c.fill();
  // review round 1: each ×2 joint is a real hinge: a round brass joint plate across the ruler's width, a dark rivet at
  // its centre and a lit rim on its top edge, and a cut line across the joint, so the ruler reads as a carpenter's
  // folding rule (sections swinging up about their rivets), not a tick strip
  const hingeDot = (x: number, y: number) => {
    c.fillStyle = mixLab(brass, m.set, 0.35);
    c.beginPath();
    c.arc(x, y, 5.6, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha('#fff1cf', 0.55);
    c.lineWidth = 1;
    c.beginPath();
    c.arc(x, y, 5, Math.PI * 1.08, Math.PI * 1.92);
    c.stroke();
    c.fillStyle = withAlpha(card, 0.9);
    c.beginPath();
    c.arc(x, y, 1.8, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = withAlpha('#fff6dc', 0.55);
    c.beginPath();
    c.arc(x - 0.8, y - 0.8, 0.9, 0, Math.PI * 2);
    c.fill();
  };
  // stacked sections: each swings up about its hinge at the top of the one below, in the wall's plane, like a
  // carpenter's folding ruler opening (folded = hanging back down over the section below; alternate sides)
  let topY = R.base;
  for (let i = 0; i < R.n; i++) {
    const u = unfold(i);
    if (u <= 0) break;
    const hingeY = topY;
    const side = i % 2 ? 1 : -1;
    const ang = side * (1 - u) * Math.PI; // 0 = straight up; ±π = folded back down
    c.save();
    c.translate(R.x, hingeY);
    c.rotate(ang);
    c.fillStyle = card;
    c.fillRect(-R.w / 2, -R.sec, R.w, R.sec + 0.5);
    // paper-tone ticks along the right edge: ten minor, a major at the section's foot
    c.fillStyle = withAlpha(tickCol, 0.8);
    for (let k = 0; k < 10; k++) {
      const yy = -(k / 10) * R.sec;
      const w = k === 0 ? R.w * 0.62 : k === 5 ? R.w * 0.42 : R.w * 0.24;
      c.fillRect(R.w / 2 - w, yy - 0.6, w, 1.2);
    }
    if (i > 0) {
      c.font = `600 10px ${FONT.mono}`;
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillStyle = withAlpha(tickCol, 0.65);
      textRole(c, 'texture', () => c.fillText('×2', -R.w / 2 + 3, -R.sec * 0.5));
    }
    // the joint's cut across the ruler and the brass tip at the section's free end
    c.fillStyle = withAlpha(m.ink, 0.9);
    c.fillRect(-R.w / 2, -R.sec - 0.6, R.w, 1.2);
    if (i > 0) hingeDot(0, 0);
    c.restore();
    topY = hingeY - R.sec * Math.cos(ang);
    if (u < 1) break;
  }
  // the brass tip capping the open end
  c.fillStyle = mixLab(brass, m.set, 0.3);
  if (unfold(R.n - 1) >= 1) c.fillRect(R.x - R.w / 2, topY - 1, R.w, 4);
  const lx = R.x + R.w / 2 + 16;
  // one '≈7 mo' bracket, beside the first section to unfold (the rate is the label's; the pins give the dates)
  {
    const a = clamp01((unfold(1) - 0.9) * 10);
    if (a > 0) {
      const y0 = R.base - R.sec, y1 = R.base - 2 * R.sec;
      c.save();
      c.globalAlpha *= a;
      c.strokeStyle = withAlpha(tickCol, 0.75);
      c.lineWidth = 1.2;
      c.beginPath();
      c.moveTo(lx - 6, y0 - 1);
      c.lineTo(lx, y0 - 1);
      c.lineTo(lx, y1 + 1);
      c.lineTo(lx - 6, y1 + 1);
      c.stroke();
      c.font = `500 17px ${FONT.mono}`;
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillStyle = withAlpha(tickCol, 0.9);
      textRole(c, 'subject', () => c.fillText('≈7 mo', lx + 7, (y0 + y1) / 2));
      c.restore();
    }
  }
  // tick lettering and the two brass pins (prop lettering on the wall, right of the ruler)
  for (const [k, txt] of Object.entries(TICKS)) {
    const i = Number(k);
    const a = i === 0 ? (o.foot ?? 1) : clamp01((unfold(i) - 0.9) * 10);
    if (a <= 0.003) continue;
    const y = R.base - i * R.sec;
    // the top pin's lettering sits a little above its tick (clear of the W4 slip below it)
    const ty = i === 8 ? y - 9 : y;
    c.save();
    c.globalAlpha *= a;
    const pin = PINNED.has(i);
    if (pin) {
      // the brass pin pushed into the ruler's edge at the measured point
      c.fillStyle = mixLab(m.halo, m.core, 0.3);
      c.beginPath();
      c.arc(R.x + R.w / 2 - 2, y, 4.6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = withAlpha('#ffffff', 0.5);
      c.beginPath();
      c.arc(R.x + R.w / 2 - 3.2, y - 1.3, 1.6, 0, Math.PI * 2);
      c.fill();
    }
    c.fillStyle = withAlpha(tickCol, 0.9);
    c.fillRect(R.x + R.w / 2 + 2, y - 0.6, pin ? 34 : 10, 1.2);
    c.font = `500 17px ${FONT.mono}`;
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    textRole(c, 'subject', () => c.fillText(txt, lx + (pin ? 24 : 0), ty));
    c.restore();
  }
  // the last section runs past 16 HOURS; the hand-lettered sign hangs to its left and swings once
  const last = unfold(R.n - 1);
  const sa = o.signAt === undefined ? (last >= 1 ? 1 : 0) : win(t, o.signAt - 0.15, o.signAt + 0.15) * (last >= 0.95 ? 1 : 0);
  if (sa > 0.01) {
    const yTop = R.base - R.n * R.sec;
    const tt = o.signAt === undefined ? 99 : t - o.signAt;
    // review round 1: a small decaying swing as it is hung: ±4°, settling over ~1.5 s
    const sw = tt > 0 ? 0.07 * Math.cos(tt * 9) * Math.exp(-tt * 2.4) : 0.07;
    c.save();
    c.globalAlpha *= sa;
    // the nail near the top of the last section, the string, the card
    c.translate(R.x - R.w / 2 + 2, yTop + 10);
    c.rotate(sw);
    c.strokeStyle = withAlpha(tickCol, 0.6);
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(-26, 22);
    c.moveTo(0, 0);
    c.lineTo(-128, 22);
    c.stroke();
    c.translate(-152, 8);
    const paper = mixLab('#d9c39a', m.halo, 0.3);
    c.fillStyle = withAlpha('#000000', 0.25);
    c.fillRect(-10, 18, 152, 46);
    c.fillStyle = paper;
    c.fillRect(-14, 14, 152, 46);
    c.fillStyle = withAlpha('#2a211b', 0.85);
    c.font = `italic 400 17px ${FONT.fell}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    textRole(c, 'subject', () => {
      c.fillText('UNRELIABLE', 62, 28);
      c.fillText('ABOVE HERE', 62, 47);
    });
    c.restore();
  }
}
