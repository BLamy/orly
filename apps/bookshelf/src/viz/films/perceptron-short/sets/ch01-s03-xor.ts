/**
 * perceptron-short — ch01-s03: the limit, SHOWN (claim limit-linear). A separate two-cell mini machine
 * — two cells, two dials, a bias, a threshold tick, a tiny needle and a lantern pip — trained for real
 * with Rosenblatt's rule on the four XOR cases ("YES when exactly one cell is lit").
 *
 * This is deliberately NOT the main board: the main board's 64 random association units could make
 * XOR learnable, so a failure there would be false. A single threshold unit on two inputs cannot
 * separate XOR (no line puts (1,0),(0,1) on one side and (0,0),(1,1) on the other), so the rule never
 * settles. trainXor() (film/silhouette/metaphors/xorRule.ts, unit-tested) runs the real rule; XOR_RUN is checked at module load: if any try ever left the
 * unit answering all four cases correctly, the module throws, so a failing animation can never ship
 * unless the run really fails.
 *
 *   XOR_RUN                        the record the shot shows (zero dials, η = 1)
 *   xorMini(c, m, o)               screen-locked plate: o = { x, y, a, step (fractional try), s?, settle? }
 *   xorBest(step)                  the best "cases right at once" the run has reached by this try (live tally)
 *
 * Review round 4 (teacher, story, art): drawn at scale `s` (the shot sets it to ≈40% of the frame width); a
 * second caption line, 'one layer of dials' (claim limit-linear: ONE layer of adjustable weights); every try box
 * carries the case it showed as two dots (○○ ●○ ○● ●●) before its ✓ / ✗, as the main row carries its shape;
 * Round-1 critic (ch01-s03 revision): the plate carries NO caption lines and no bottom line, only the word
 * 'XOR' in its band (the old 'best: n of 4' would read as the unit's ceiling, which is false: a single threshold
 * unit with a bias gets 3 of 4 XOR cases); `settle` is ignored.
 */
import type { Palette } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';
import { trainXor } from '../../../film/silhouette/metaphors/perceptronMath';

export const XOR_RUN = trainXor(200);
// the guarantee (limit-linear): the rule never settles on XOR. Never animate a failure the run does not show.
if (XOR_RUN.steps.some((s) => s.score === 4)) throw new Error('ch01-s03-xor: the single-layer XOR run converged; the "never settles" plate would be false');

const sm = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const cl = (u: number) => Math.max(0, Math.min(1, u));
const cream = (m: Palette) => mixLab(m.core, '#f4ead4', 0.55);

/** plate width / height (local px; the shot scales it) */
export const XOR_W = 340;
export const XOR_H = 292;
const CAP_H = 60;
const ROW = 8;
/** needle angle from the threshold (rad, + = YES side) */
const needleAng = (sum: number) => Math.sign(sum) * 1.05 * Math.min(1, Math.abs(sum) / 2.2 + (sum === 0 ? 0 : 0.25));

/** the best number of the four cases the unit has answered correctly at once, over the tries finished by `done` */
export function xorBest(done: number): number {
  let best = 0;
  for (let i = 0; i < Math.min(done, XOR_RUN.steps.length); i++) best = Math.max(best, XOR_RUN.steps[i].score);
  return best;
}

/**
 * The mini machine, centred on (x, y). `step` is a fractional try index into XOR_RUN: within try k,
 * u = step − k: .00–.25 the case's cells light · .25–.55 the needle swings to the total · .55 verdict (✗ /
 * ✓ into the row; the pip gutters cold on ✗) · .62–.92 dials turn (mistakes only). `settle` 0..1 brings in the
 * bottom line ('never settles · best: n of 4').
 */
export function xorMini(c: CanvasRenderingContext2D, m: Palette, o: { x: number; y: number; a: number; step: number; s?: number; settle?: number }) {
  if (o.a <= 0.003) return;
  const k = Math.max(0, Math.min(XOR_RUN.steps.length - 1, Math.floor(o.step)));
  const u = o.step < 0 ? 0 : o.step - k;
  const st = XOR_RUN.steps[k];
  const shown = o.step >= 0;
  const lightU = shown ? sm(cl(u / 0.2)) : 0;
  const swing = shown ? sm(cl((u - 0.25) / 0.3)) : 0;
  const verdict = shown ? sm(cl((u - 0.55) / 0.08)) : 0;
  const turn = shown && st.error ? sm(cl((u - 0.62) / 0.3)) : 0;
  const w = [0, 1, 2].map((i) => st.wBefore[i] + (st.wAfter[i] - st.wBefore[i]) * turn);
  const S = o.s ?? 1;
  const brass = mixLab(m.rim, m.core, 0.3);
  const ink = mixLab(m.ink, '#000000', 0.15);
  c.save();
  c.translate(o.x, o.y);
  c.scale(S, S);
  const X = -XOR_W / 2;
  const Y = -XOR_H / 2;
  c.globalAlpha = o.a;
  // a soft dark surround, so the dimmed stage behind never crowds the plate's edge
  {
    const g = c.createRadialGradient(0, 0, XOR_W * 0.45, 0, 0, XOR_W * 0.85);
    g.addColorStop(0, withAlpha(m.ink, 0.7));
    g.addColorStop(1, withAlpha(m.ink, 0));
    c.fillStyle = g;
    c.fillRect(-XOR_W, -XOR_H, XOR_W * 2, XOR_H * 2);
  }
  // the caption band: what it is being asked, and what it has to answer with
  c.fillStyle = withAlpha(m.ink, 0.94);
  c.fillRect(X, Y, XOR_W, CAP_H - 2);
  // the brass-rimmed plate
  c.fillStyle = mixLab(m.ink, m.set, 0.3);
  c.fillRect(X, Y + CAP_H, XOR_W, XOR_H - CAP_H);
  c.strokeStyle = withAlpha(m.rim, 0.65);
  c.lineWidth = 1.4;
  c.strokeRect(X + 0.5, Y + CAP_H + 0.5, XOR_W - 1, XOR_H - CAP_H - 1);
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  // round-1 critic (overload): no caption lines on the plate, only its name, in the era typewriter; the cells,
  // the needle flicking back and forth and the ✓ ✗ row carry the rest while the narration says it
  c.font = `400 30px ${FONT.typewriter}`;
  (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '6px';
  c.fillStyle = cream(m);
  c.fillText('XOR', 3, Y + 40);
  (c as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = '0px';

  // the two cells (stacked), lit by the case shown
  const cellX = X + 44;
  const cy = [Y + CAP_H + 44, Y + CAP_H + 94];
  const dialX = X + 112;
  const hub = { x: X + 206, y: Y + CAP_H + 84 };
  for (let i = 0; i < 2; i++) {
    const on = st.x[i] ? lightU : 0;
    const prevOn = k > 0 && shown && XOR_RUN.steps[k - 1].x[i] ? 1 - sm(cl(u / 0.08)) : 0;
    const lit = Math.max(on, prevOn * 0.6);
    c.strokeStyle = withAlpha(mixLab(m.rim, m.core, 0.4), 0.25 + 0.6 * lit);
    c.lineWidth = 1 + 0.8 * lit;
    c.beginPath();
    c.moveTo(cellX + 15, cy[i]);
    c.lineTo(dialX - 13, cy[i]);
    c.moveTo(dialX + 13, cy[i]);
    c.quadraticCurveTo(hub.x - 30, cy[i], hub.x, hub.y);
    c.stroke();
    c.fillStyle = ink;
    c.fillRect(cellX - 16, cy[i] - 16, 32, 32);
    c.strokeStyle = withAlpha(brass, 0.7);
    c.lineWidth = 1.2;
    c.strokeRect(cellX - 15.5, cy[i] - 15.5, 31, 31);
    if (lit > 0.01) {
      const g = c.createRadialGradient(cellX, cy[i], 2, cellX, cy[i], 34);
      g.addColorStop(0, withAlpha(m.halo, 0.55 * lit));
      g.addColorStop(1, withAlpha(m.halo, 0));
      c.fillStyle = g;
      c.fillRect(cellX - 36, cy[i] - 36, 72, 72);
    }
    c.fillStyle = mixLab(mixLab(m.ink, m.core, 0.15), m.core, lit);
    c.beginPath();
    c.arc(cellX, cy[i], 11, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = ink;
    c.beginPath();
    c.arc(dialX, cy[i], 13, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = withAlpha(m.rim, 0.45);
    c.lineWidth = 1;
    c.stroke();
    const ang = -Math.PI / 2 + Math.max(-2.4, Math.min(2.4, w[i] * 0.75));
    const moving = st.error && st.x[i] && turn > 0 && turn < 1;
    c.strokeStyle = moving ? m.core : mixLab(m.rim, m.core, 0.35);
    c.lineWidth = moving ? 3.4 : 2.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(dialX, cy[i]);
    c.lineTo(dialX + Math.cos(ang) * 11, cy[i] + Math.sin(ang) * 11);
    c.stroke();
  }

  // the tiny response meter: a half-face, threshold tick at 12 o'clock, NO left / YES right
  const mx = X + 264;
  const my = Y + CAP_H + 98;
  const R = 46;
  c.fillStyle = ink;
  c.beginPath();
  c.arc(mx, my, R + 5, Math.PI, 0);
  c.closePath();
  c.fill();
  c.fillStyle = mixLab(m.set, m.core, 0.18);
  c.beginPath();
  c.arc(mx, my, R, Math.PI, 0);
  c.closePath();
  c.fill();
  c.strokeStyle = withAlpha(cream(m), 0.85);
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(mx, my - R);
  c.lineTo(mx, my - R + 12);
  c.stroke();
  const na = -Math.PI / 2 + needleAng(st.sum) * swing + (st.error ? Math.sin(u * 90) * 0.06 * verdict * (1 - sm(cl((u - 0.7) / 0.1))) : 0);
  c.strokeStyle = cream(m);
  c.lineWidth = 2.2;
  c.beginPath();
  c.moveTo(mx, my);
  c.lineTo(mx + Math.cos(na) * (R - 6), my + Math.sin(na) * (R - 6));
  c.stroke();
  c.fillStyle = cream(m);
  c.beginPath();
  c.arc(mx, my, 3.5, 0, Math.PI * 2);
  c.fill();

  // the lantern pip: it never flares; on a ✗ its wick gutters out (cold), on a ✓ it only smoulders
  const px = X + 318;
  const py = Y + CAP_H + 30;
  const warm = shown ? verdict * (st.error ? 0 : 0.35) : 0;
  const gutter = shown && st.error ? verdict * (1 - sm(cl((u - 0.85) / 0.15)) * 0.4) : 0;
  c.strokeStyle = withAlpha(m.rim, 0.5);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(px, Y + CAP_H);
  c.lineTo(px, py - 11);
  c.stroke();
  c.fillStyle = mixLab(mixLab(m.ink, m.set, 0.5), m.core, warm * 0.6);
  c.beginPath();
  c.ellipse(px, py, 8, 11, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(m.rim, 0.55 - 0.25 * gutter);
  c.stroke();
  if (warm > 0.01) {
    const g = c.createRadialGradient(px, py, 1, px, py, 22);
    g.addColorStop(0, withAlpha(m.halo, 0.45 * warm));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(px - 22, py - 22, 44, 44);
  }

  // the try row: the last eight tries, ticking along, each box the case it showed (two dots: lit ● / dark ○)
  // then its verdict (✓ warm, ✗ cold), in the main row's style (shape first, then the mark)
  const done = shown ? k + (verdict > 0.5 ? 1 : 0) : 0;
  const first = Math.max(0, done - ROW);
  const BW = 34;
  const BH = 24;
  const GAP = 4;
  const rx0 = -(ROW * BW + (ROW - 1) * GAP) / 2;
  const ry = Y + XOR_H - 66;
  for (let j = 0; j < ROW; j++) {
    const i = first + j;
    const bx = rx0 + j * (BW + GAP);
    c.fillStyle = mixLab(m.ink, m.set, 0.2);
    c.fillRect(bx, ry, BW, BH);
    const live = i === k && shown && verdict < 0.5;
    c.strokeStyle = withAlpha(m.rim, live ? 0.85 : 0.35);
    c.lineWidth = 1;
    c.strokeRect(bx + 0.5, ry + 0.5, BW - 1, BH - 1);
    const seenCase = i < done || (live && lightU > 0.5);
    if (!seenCase) continue;
    const s = XOR_RUN.steps[i];
    const dy = ry + BH / 2;
    for (let d = 0; d < 2; d++) {
      const dx = bx + 6.5 + d * 7;
      c.beginPath();
      c.arc(dx, dy, 2.7, 0, Math.PI * 2);
      if (s.x[d]) {
        c.fillStyle = mixLab(m.core, m.halo, 0.2);
        c.fill();
      } else {
        c.strokeStyle = withAlpha(m.rim, 0.75);
        c.lineWidth = 1;
        c.stroke();
      }
    }
    if (i >= done) continue;
    const cx = bx + BW - 9.5;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.lineWidth = 2.2;
    if (!s.error) {
      c.strokeStyle = mixLab(m.core, m.rim, 0.3);
      c.beginPath();
      c.moveTo(cx - 4.5, dy);
      c.lineTo(cx - 1.5, dy + 3.5);
      c.lineTo(cx + 4.5, dy - 4);
      c.stroke();
    } else {
      c.strokeStyle = mixLab(m.rim, m.ink, 0.25);
      c.beginPath();
      c.moveTo(cx - 4, dy - 4);
      c.lineTo(cx + 4, dy + 4);
      c.moveTo(cx + 4, dy - 4);
      c.lineTo(cx - 4, dy + 4);
      c.stroke();
    }
  }
  // round-1 critic (accuracy): no bottom line. 'best: n of 4' read as the single unit's ceiling, which is false
  // (one threshold unit with a bias gets 3 of 4 XOR cases); the unbroken ✓ ✗ row shows that it never settles
  void o.settle;
  c.restore();
}
