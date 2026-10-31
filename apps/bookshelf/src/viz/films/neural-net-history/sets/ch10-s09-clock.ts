/**
 * neural-net-history — the paper-cut clock face of ch10-s09 (positional encoding), shared with ch10-s10's opening so
 * the cut keeps the clocks faintly pinned on the slips. Hands: FAST long and thin (rim tint), slower medium, slowest a
 * short thick stub; angle = place × OMEGA[k]. `flash` lights the wedge the fast hand swept from the previous place.
 */
import { mixLab, withAlpha } from '../../../film';
import { INK, OXBLOOD, SLIP_PAPER } from './ch10-s06-kit';

type C = CanvasRenderingContext2D;
export const OMEGA = [2.0, 0.5, 0.1];

/** a paper-cut clock face pinned at the slip's top corner; hands set by the slip's place in line */
export function clockFace(c: C, x: number, y: number, r: number, place: number, a: number, rim: string, flash = 0, litFast = 0, litSlow = 0) {
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  c.fillStyle = mixLab(SLIP_PAPER, '#ffffff', 0.2);
  c.strokeStyle = INK;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  // ticks
  c.lineWidth = 1;
  for (let k = 0; k < 12; k++) {
    const an = (k / 12) * Math.PI * 2;
    c.beginPath();
    c.moveTo(Math.sin(an) * r * 0.8, -Math.cos(an) * r * 0.8);
    c.lineTo(Math.sin(an) * r * 0.93, -Math.cos(an) * r * 0.93);
    c.stroke();
  }
  const fastCol = mixLab(rim, INK, 0.4);
  // 'place': the wedge the fast hand swept from the previous slip's setting (it jumps a long way)
  if (flash > 0.01) {
    const a0 = (place - 1) * OMEGA[0] - Math.PI / 2;
    const a1 = place * OMEGA[0] - Math.PI / 2;
    c.fillStyle = withAlpha(rim, 0.38 * flash);
    c.beginPath();
    c.moveTo(0, 0);
    c.arc(0, 0, r * 0.9, a0, a1);
    c.closePath();
    c.fill();
  }
  // hands: FAST long and thin with an oxblood tip, SLOWER medium with a diamond tip, SLOWEST a short wide stub with a
  // square tip (each wave in the strip carries the same tip mark). litFast / litSlow brighten them when named.
  const hands: [number, number, number, string, HandMark][] = [
    [OMEGA[2], 0.4, 6 + 1.2 * litSlow, mixLab(INK, rim, 0.75 * litSlow), 'square'],
    [OMEGA[1], 0.64, 3, INK, 'diamond'],
    [OMEGA[0], 0.95, 1.4 + 1.0 * litFast, mixLab(fastCol, '#ffffff', 0.45 * litFast), 'dot'],
  ];
  c.lineCap = 'round';
  for (const [w, len, lw, col, mark] of hands) {
    const an = place * w;
    const tx = Math.sin(an) * r * len;
    const ty = -Math.cos(an) * r * len;
    c.strokeStyle = col;
    c.lineWidth = lw;
    c.beginPath();
    c.moveTo(-Math.sin(an) * r * 0.12, Math.cos(an) * r * 0.12);
    c.lineTo(tx, ty);
    c.stroke();
    handMark(c, tx, ty, mark, Math.max(2.4, r * 0.085), mark === 'dot' ? mixLab(OXBLOOD, '#d0473c', 0.5 + 0.3 * litFast) : col, an);
  }
  c.fillStyle = INK;
  c.beginPath();
  c.arc(0, 0, 2.6, 0, Math.PI * 2);
  c.fill();
  // the pin
  c.fillStyle = OXBLOOD;
  c.beginPath();
  c.arc(0, -r - 1, 2.2, 0, Math.PI * 2);
  c.fill();
  c.restore();
}


export type HandMark = 'dot' | 'diamond' | 'square';
/** the tip mark of a hand (and of its wave's dots): fast = an oxblood dot, slower = a diamond, slowest = a square */
export function handMark(c: C, x: number, y: number, mark: HandMark, r: number, col: string, an = 0): void {
  c.save();
  c.translate(x, y);
  c.fillStyle = col;
  c.beginPath();
  if (mark === 'dot') c.arc(0, 0, r * 1.05, 0, Math.PI * 2);
  else if (mark === 'diamond') {
    c.rotate(an);
    c.moveTo(0, -r * 1.3);
    c.lineTo(r, 0);
    c.lineTo(0, r * 1.3);
    c.lineTo(-r, 0);
    c.closePath();
  } else {
    c.rotate(an);
    c.rect(-r, -r, r * 2, r * 2);
  }
  c.fill();
  c.restore();
}
/** the marks of the three hands, fast → slowest (index = OMEGA index) */
export const MARKS: HandMark[] = ['dot', 'diamond', 'square'];
