/**
 * ch13-s03 / ch13-s04 — the Statement on AI Risk strip on the worry candle's stage: unrolls across the backdrop as the
 * flame push lands (ch13-s03), carries the opening clause word for word and the pen-written signatures (Hinton first,
 * Bengio second, then Demis Hassabis, Sam Altman, Dario Amodei), and rolls up into the flies as ch13-s04 pulls back.
 */
import type { PaintEnv } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, drawTracked } from '../../../film/silhouette/type';
import { capSize, penLine, sm, win } from './ch13-s01-kit';

type C = CanvasRenderingContext2D;
export const STRIP13 = { x0: 168, x1: 1112, y0: 46, y1: 296 };
export interface StripTimes {
  stageT: number;
  sig1: number;
  sig2: number;
  labs: number;
}
/** the strip as it stands at the end of ch13-s03 (every line written) */
export const STRIP_DONE: StripTimes = { stageT: -100, sig1: -100, sig2: -100, labs: -100 };

/** the parchment strip: unrolls across the backdrop as the push lands (done just after 'extinction'); the clause,
 *  the attribution, the pen-written signatures */
export function drawStrip(c: C, env: PaintEnv, t: number, b: StripTimes, o: { rise?: number; roll?: number; alpha?: number } = {}) {
  const u = sm((t - b.stageT) / 1.0);
  if (u <= 0.002) return;
  const { x0, x1 } = STRIP13;
  // rolling up into the flies (ch13-s04's opening): the strip rises and its bottom rolls up toward its top rod
  const y0 = STRIP13.y0 - (o.rise ?? 0);
  const y1 = y0 + (STRIP13.y1 - STRIP13.y0) * (1 - 0.85 * (o.roll ?? 0));
  const cx = (x0 + x1) / 2;
  const half = ((x1 - x0) / 2) * u;
  const P = MOODS.parchment;
  const m = env.mood;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  // shadow, paper, the two rolled ends
  c.fillStyle = withAlpha(m.fg, 0.45);
  c.fillRect(cx - half + 6, y0 + 8, half * 2, y1 - y0);
  const paper = mixLab(P.sky[2], m.halo, 0.22);
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, mixLab(paper, m.set, 0.32));
  g.addColorStop(0.55, paper);
  g.addColorStop(1, mixLab(paper, m.core, 0.12));
  c.fillStyle = g;
  c.fillRect(cx - half, y0, half * 2, y1 - y0);
  for (const s of [-1, 1]) {
    const ex = cx + s * half;
    const rg = c.createLinearGradient(ex - 9, 0, ex + 9, 0);
    rg.addColorStop(0, mixLab(paper, m.fg, 0.45));
    rg.addColorStop(0.5, mixLab(paper, m.rim, 0.25));
    rg.addColorStop(1, mixLab(paper, m.fg, 0.45));
    c.fillStyle = rg;
    c.fillRect(ex - 9, y0 - 6, 18, y1 - y0 + 12);
  }
  // the threads it hangs by
  c.strokeStyle = withAlpha(m.rim, 0.25);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(cx - half + 30, y0);
  c.lineTo(cx - half + 60, -400);
  c.moveTo(cx + half - 30, y0);
  c.lineTo(cx + half - 60, -400);
  c.stroke();
  // the clause (word for word, not narrated)
  const ink = mixLab(P.ink, m.fg, 0.1);
  c.beginPath();
  c.rect(cx - half + 12, y0, half * 2 - 24, y1 - y0);
  c.clip();
  const A = win(t, b.stageT + 0.4, b.stageT + 1.0);
  c.globalAlpha *= A;
  c.fillStyle = ink;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  c.font = `italic 400 37px ${FONT.text}`;
  c.fillText('“Mitigating the risk of extinction from AI', cx, y0 + 62);
  c.fillText('should be a global priority…”', cx, y0 + 108);
  c.fillStyle = withAlpha(ink, 0.85);
  // the attribution, set in full small-cap capitals at the legibility floor (23 px cap at 1080p under the camera)
  const aSize = capSize(c, `500 18px ${FONT.sc}`, 23, env.pxScale || 1.5);
  drawTracked(c, '— STATEMENT ON AI RISK', cx, y0 + 146, { font: `500 ${aSize}px ${FONT.sc}`, size: aSize, tracking: 0.14, align: 'center' });
  c.fillStyle = withAlpha(ink, 0.25);
  c.fillRect(cx - 300, y0 + 160, 600, 0.8);
  c.restore();
  // the signatures in the pen hand, one after another
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.beginPath();
  c.rect(x0 - 20, y0, x1 - x0 + 40, y1 - y0);
  c.clip();
  const pen = withAlpha(mixLab(P.ink, '#1a2a44', 0.35), 0.9);
  const sy1 = y0 + 194, sy2 = y0 + 232;
  // Hinton's line is written as his name is said, finished on 'first'
  penLine(c, 'Geoffrey Hinton', cx - 130, sy1, 27, b.sig1 - 0.8, 0.75, t, pen, 'center');
  penLine(c, 'Yoshua Bengio', cx + 130, sy1, 27, b.sig2 - 0.05, 0.6, t, pen, 'center');
  penLine(c, 'Demis Hassabis', cx - 260, sy2, 23, b.labs - 0.05, 0.55, t, pen, 'center');
  penLine(c, 'Sam Altman', cx, sy2, 23, b.labs + 0.35, 0.45, t, pen, 'center');
  penLine(c, 'Dario Amodei', cx + 260, sy2, 23, b.labs + 0.7, 0.5, t, pen, 'center');
  c.restore();
}

