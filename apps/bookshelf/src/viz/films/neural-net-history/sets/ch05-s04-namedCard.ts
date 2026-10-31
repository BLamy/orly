/**
 * ch05-s04 — the sterile candle's naming card, with its date line STAGED (review r1 sync): while the candle still
 * burns the line reads only 'lit 1969'; on 'seventeen' the rest ('· out 1986 · 17 years') inks in left → right.
 * Same card as the kit's namedLabel (sets/beliefCandle.ts): warm paper, the belief in the era face, a leader to the
 * flame, screen-locked above fog and near layers via queueOverlay. The card is sized to the FULL date line from
 * the start so it never grows when the ending inks in.
 */
import type { PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, capPx1080, legibleSize } from '../../../film/silhouette/type';
import { queueOverlay } from '../../../film/core/paintContext';
import { candleFlame, fontForYear, type CandleDraw } from './beliefCandle';

/**
 * side: which side of the candle the card hangs ('auto' = right unless the flame is in the right part of the frame);
 * clear: screen px kept free either side of the flame (the sleeve and its smoke; review r4: the card sits LEFT of
 * the candle so the dark 17-ring sleeve stays unobstructed); wrap: characters per line of the belief.
 */
export function namedLabelStaged(c: CanvasRenderingContext2D, o: CandleDraw & { named: number; ending: number; side?: 'left' | 'right' | 'auto'; clear?: number; wrap?: number }, env: PaintEnv): void {
  const k = Math.max(0, Math.min(1, o.named));
  const v = o.view;
  if (k <= 0 || !v.text) return;
  const s = o.s ?? 1;
  const f = candleFlame(o);
  const m = c.getTransform();
  const px = env.pxScale || 1.5;
  const sx = (m.a * f.x + m.c * f.y + m.e) / px;
  const sy = (m.b * f.x + m.d * f.y + m.f) / px;
  const wax = Math.hypot(m.a, m.b) / px;
  if (sx < -200 || sx > 1480 || sy < -200 || sy > 920) return;
  const end = Math.max(0, Math.min(1, o.ending));
  queueOverlay((cc) => drawCard(cc, { sx, sy, k, end, gapX: Math.max(14, 16 * s * wax, o.clear ?? 0), text: v.text, year: v.litYear, tag: v.tag, years: v.years ?? 0, side: o.side ?? 'auto', wrap: o.wrap ?? 22 }, env));
}

function drawCard(c: CanvasRenderingContext2D, o: { sx: number; sy: number; k: number; end: number; gapX: number; text: string; year: number; tag: string; years: number; side: 'left' | 'right' | 'auto'; wrap: number }, env: PaintEnv) {
  const face = fontForYear(o.year);
  const size = Math.max(legibleSize(c, `400 18px ${face}`, 18), (18 * 26) / Math.max(1e-3, capPx1080(c, `400 18px ${face}`)));
  const dSize = legibleSize(c, `italic 400 18px ${FONT.text}`, 18);
  const tFont = `400 ${size}px ${face}`;
  const dFont = `italic 400 ${dSize}px ${FONT.text}`;
  const lines: string[] = [];
  let cur = '';
  for (const wd of o.text.split(' ')) {
    const nx = cur ? `${cur} ${wd}` : wd;
    if (cur && nx.length > o.wrap) {
      lines.push(cur);
      cur = wd;
    } else cur = nx;
  }
  if (cur) lines.push(cur);
  const head = `lit ${o.tag}`;
  const tail = ` · out ${o.year + o.years} · ${o.years} years`;
  c.save();
  c.font = tFont;
  const tw = Math.max(...lines.map((l) => c.measureText(l).width), 0);
  c.font = dFont;
  const hw = c.measureText(head).width;
  const dw = c.measureText(head + tail).width;
  const pad = 14;
  const lh = size * 1.2;
  const w = Math.max(tw, dw) + pad * 2;
  const h = lines.length * lh + dSize * 1.45 + pad * 1.7;
  const left = o.side === 'auto' ? o.sx > 1280 * 0.62 : o.side === 'left';
  let x0 = left ? o.sx - o.gapX - w : o.sx + o.gapX;
  x0 = Math.max(40, Math.min(1240 - w, x0));
  let y0 = o.sy - h * 0.4;
  y0 = Math.max(36, Math.min(720 * 0.86 - h, y0));
  const grow = 0.94 + 0.06 * o.k;
  c.globalAlpha = Math.min(1, o.k * 1.15);
  c.translate(x0 + w / 2, y0 + h / 2);
  c.scale(grow, grow);
  c.translate(-w / 2, -h / 2);
  const lx = left ? w : 0;
  c.strokeStyle = withAlpha(env.mood.rim, 0.75);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(lx, h * 0.4);
  c.lineTo(o.sx - (x0 + w / 2) + w / 2, o.sy - (y0 + h / 2) + h / 2);
  c.stroke();
  const paper = mixLab(env.mood.halo, '#efe4cc', 0.6);
  c.shadowColor = withAlpha('#000000', 0.45);
  c.shadowBlur = 10;
  c.shadowOffsetY = 4;
  c.fillStyle = paper;
  c.fillRect(0, 0, w, h);
  c.shadowColor = 'rgba(0,0,0,0)';
  c.shadowBlur = 0;
  c.shadowOffsetY = 0;
  c.strokeStyle = withAlpha(env.mood.ink, 0.35);
  c.lineWidth = 0.8;
  c.strokeRect(5, 5, w - 10, h - 10);
  const inkC = mixLab(env.mood.ink, '#1d160f', 0.5);
  c.fillStyle = inkC;
  c.textAlign = 'left';
  c.textBaseline = 'alphabetic';
  c.font = tFont;
  lines.forEach((l, i) => c.fillText(l, pad, pad + size * 0.95 + i * lh));
  c.fillStyle = withAlpha(inkC, 0.85);
  c.font = dFont;
  const by = pad + lines.length * lh + dSize * 1.05;
  c.fillText(head, pad, by);
  if (o.end > 0.001) {
    // the ending inks in left → right (a clip that sweeps across the tail)
    c.save();
    c.beginPath();
    c.rect(pad + hw - 1, by - dSize * 1.2, (dw - hw) * o.end + 2, dSize * 1.8);
    c.clip();
    c.fillText(head + tail, pad, by);
    c.restore();
  }
  c.restore();
}
