/**
 * ch06-s01 (formerly the cut ch05-s05): the developer ↔ critic agent pair, drawn locally (the kit's agentPair look and timing, at the same scale),
 * with three changes the review asked for that the kit has no options for:
 *   - the '▶ replay recording' chip never parks on the critic's eye: it arcs across the rail and slides UNDER the
 *     critic card (the cards draw over it), as if handed in, then comes back out;
 *   - the verdicts are big, legible pills of their own (21 stage px type), coral '✕ not yet' and green '✓ good',
 *     drawn unscaled in stage px under the critic card;
 *   - once '✓ good' lands, the critic card's border turns green within 0.2 s (it never sits red-pink beside a green
 *     verdict).
 * Pure function of t. Kit need, reported: agentPair options for chip stop / verdict size / ok-border colour.
 */
import { PROMO, blurText, easeOut, font, hexA, measure } from '../../../film/promo';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

export const CARD_W = 230, CARD_H = 92, GAP = 210;
export const CRIT_X = CARD_W + GAP;
/** verdict pill type size in STAGE px */
export const VERDICT_PX = 21;
/** the verdict pill's top, below the cards (local units) */
const PILL_TOP = CARD_H + 14;

export interface Exchange {
  at: number;
  verdict: string;
  ok: boolean;
}

function mixHex(a: string, b: string, u: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return `#${A.map((v, i) => Math.round(v + (B[i] - v) * clamp(u)).toString(16).padStart(2, '0')).join('')}`;
}

/** the verdict pill's centre in stage px (the ✓ chip that drifts off in ch05-s05 starts here) */
export function pillCentre(o: { x: number; y: number; scale: number }) {
  const h = VERDICT_PX * 1.8;
  return { x: o.x + (CRIT_X + CARD_W / 2) * o.scale, y: o.y + PILL_TOP * o.scale + h / 2 };
}

export function pair(
  c: CanvasRenderingContext2D,
  o: { t: number; x: number; y: number; scale: number; exchanges: Exchange[]; u: number; chip?: string },
) {
  const u = o.u;
  if (u <= 0) return;
  const k = o.scale;
  const t = o.t;
  let live = -1;
  for (let i = 0; i < o.exchanges.length; i++) if (t >= o.exchanges[i].at) live = i;
  const ex = live >= 0 ? o.exchanges[live] : null;
  const lt = ex ? t - ex.at : 0;
  // the critic turns green once a ✓ verdict lands (and stays green)
  const okEx = o.exchanges.find((e) => e.ok);
  const green = okEx ? clamp((t - okEx.at - 0.8) / 0.2) : 0;

  c.save();
  c.globalAlpha *= easeOut(u);
  c.translate(o.x, o.y);
  c.scale(k, k);

  // ---- the rail
  c.strokeStyle = PROMO.faint;
  c.setLineDash([3, 6]);
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(CARD_W + 12, CARD_H / 2);
  c.lineTo(CRIT_X - 12, CARD_H / 2);
  c.stroke();
  c.setLineDash([]);

  // ---- the chip (under the cards): out of the developer, over the rail, under the critic; back after the verdict
  // (only while it travels: parked under a card it would show through as the pair fades)
  if (ex && lt < 1.9) {
    const label = o.chip ?? '▶ replay recording';
    const w = measure(c, label, 12, 600, true) + 22;
    const go = clamp(lt / 0.75);
    const back = clamp((lt - 1.3) / 0.6);
    const p = back > 0 ? 1 - back : go;
    const ep = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    const x0 = CARD_W - w / 2 - 6; // tucked fully under the developer's right edge
    const x1 = CRIT_X + w / 2 + 6; // fully under the critic card
    const cx = x0 + (x1 - x0) * ep;
    const cy = CARD_H / 2 - Math.sin(Math.PI * ep) * 30;
    c.save();
    c.fillStyle = PROMO.ink;
    c.beginPath();
    c.roundRect(cx - w / 2, cy - 13, w, 26, 13);
    c.fill();
    c.fillStyle = '#fff';
    c.font = font(600, 12, true);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(label, cx, cy + 1);
    c.restore();
  }

  // ---- the cards (over the chip)
  const card = (x: number, label: string, glyph: 'code' | 'eye', active: number, border: string) => {
    c.save();
    c.shadowColor = 'rgba(40,10,60,.18)';
    c.shadowBlur = 24;
    c.shadowOffsetY = 8;
    c.fillStyle = '#fff';
    c.beginPath();
    c.roundRect(x, 0, CARD_W, CARD_H, 16);
    c.fill();
    c.restore();
    c.strokeStyle = hexA(border, 0.2 + 0.6 * active);
    c.lineWidth = 1.5 + 0.6 * active * (border === PROMO.green ? 1 : 0);
    c.beginPath();
    c.roundRect(x + 0.5, 0.5, CARD_W - 1, CARD_H - 1, 16);
    c.stroke();
    c.fillStyle = glyph === 'code' ? hexA(PROMO.violet, 0.18) : hexA(PROMO.orange, 0.18);
    c.beginPath();
    c.arc(x + 40, CARD_H / 2, 22, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = glyph === 'code' ? PROMO.violet : PROMO.orange;
    c.lineWidth = 2.2;
    c.lineCap = 'round';
    c.beginPath();
    if (glyph === 'code') {
      c.moveTo(x + 33, CARD_H / 2 - 7); c.lineTo(x + 26, CARD_H / 2); c.lineTo(x + 33, CARD_H / 2 + 7);
      c.moveTo(x + 47, CARD_H / 2 - 7); c.lineTo(x + 54, CARD_H / 2); c.lineTo(x + 47, CARD_H / 2 + 7);
    } else {
      c.ellipse(x + 40, CARD_H / 2, 11, 7, 0, 0, Math.PI * 2);
      c.moveTo(x + 43, CARD_H / 2); c.arc(x + 40, CARD_H / 2, 3, 0, Math.PI * 2);
    }
    c.stroke();
    c.fillStyle = PROMO.ink;
    c.font = font(600, 17);
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    c.fillText(label, x + 74, CARD_H / 2 - 4);
    c.fillStyle = PROMO.mute;
    c.font = font(400, 13, true);
    c.fillText('agent', x + 74, CARD_H / 2 + 16);
  };
  card(0, 'developer', 'code', ex ? Math.max(0, 1 - lt / 0.6) : 0, PROMO.brand);
  const critActive = ex ? clamp((lt - 0.7) / 0.3) : 0;
  card(CRIT_X, 'critic', 'eye', Math.max(critActive, green), green > 0 ? mixHex(PROMO.brand, PROMO.green, green) : PROMO.brand);
  c.restore();

  // ---- the verdict pills, in stage px (unscaled): on at lt 0.8 (the 'notyet' / 'good' beats), the not-yet one
  //      clears as the fresh chip goes across
  o.exchanges.forEach((e, i) => {
    const vu = clamp((t - e.at - 0.8) / 0.25);
    const next = o.exchanges[i + 1];
    const vout = next ? clamp((t - next.at) / 0.25) : 0;
    const a = vu * (1 - vout) * easeOut(u);
    if (a <= 0) return;
    const col = e.ok ? PROMO.green : PROMO.coral;
    const text = `${e.ok ? '✓' : '✕'}  ${e.verdict}`;
    const size = VERDICT_PX;
    const pc = pillCentre(o);
    const w = measure(c, text, size, 600) + size * 1.4;
    const h = size * 1.8;
    c.save();
    c.globalAlpha *= a;
    c.fillStyle = hexA(col, 0.13);
    c.strokeStyle = hexA(col, 0.45);
    c.lineWidth = 1.2;
    c.beginPath();
    c.roundRect(pc.x - w / 2, pc.y - h / 2, w, h, h / 2);
    c.fill();
    c.stroke();
    c.restore();
    blurText(c, text, pc.x, pc.y + size * 0.36, { size, weight: 600, u: vu * (1 - vout) * easeOut(u), color: col, align: 'center', rise: 4 });
  });
}
