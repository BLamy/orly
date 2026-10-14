/**
 * ch15-s05 — the lamp shelf's luggage tag: a manila tag on a string that flips about its vertical axis between two
 * faces. A face is one or two lines ('as of|October 2026'), set in IBM Plex Mono at a fixed world size (the tag is
 * world art on L4, so the camera's push sets its screen size; at the stops it reads well over the 22 px floor).
 *
 *   lampTag(c, { x, y, front: 'as of|October 2026', back: 'FEB–SEP 2026', flip, swing, light }, env)
 */
import type { PaintEnv } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';

type C = CanvasRenderingContext2D;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export interface LampTag {
  x: number;
  y: number;
  w?: number;
  /** one face per side; '|' breaks a face into two lines */
  front: string;
  back?: string;
  flip?: number;
  swing?: number;
  light?: number;
  str?: number;
  size?: number;
  /** the lines after the first on the FRONT face set at this fraction of the first (a lab name over a smaller
   *  'as of October 2026'; review round 4) */
  subFront?: number;
}
export const TAG_W = 196;
export const tagH = (face: string, size: number) => (face.includes('|') ? size * 2.9 + 10 : size * 1.9 + 14);

export function lampTag(c: C, o: LampTag, env: PaintEnv) {
  const m = env.mood;
  const w = o.w ?? TAG_W;
  const size = o.size ?? 19;
  const L = o.light ?? 1;
  const str = o.str ?? 14;
  const fl = clamp01(o.flip ?? 0);
  const sx = Math.cos(fl * Math.PI);
  const face = (sx >= 0 ? o.front : o.back ?? '') || '';
  const h = Math.max(tagH(o.front, size), tagH(o.back ?? '', size));
  c.save();
  c.translate(o.x, o.y);
  c.rotate(o.swing ?? 0);
  // the string from the shelf's edge to the eyelet
  c.strokeStyle = withAlpha(mixLab(m.rim, m.set, 0.4), 0.8);
  c.lineWidth = 1.1;
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(3, str * 0.5, (-w / 2 + 15) * Math.abs(sx), str + 15);
  c.stroke();
  c.translate(0, str);
  c.scale(Math.max(0.04, Math.abs(sx)), 1);
  const manila = mixLab(mixLab(MOODS.parchment.sky[2], '#b08a52', 0.45), m.set, 0.55 - 0.45 * L);
  const hw = w / 2;
  // a soft drop shadow on the wall behind, the body with clipped top corners, the eyelet
  c.fillStyle = withAlpha(m.fg, 0.28);
  c.fillRect(-hw + 5, 6, w, h);
  c.fillStyle = sx >= 0 ? manila : mixLab(manila, m.set, 0.18);
  c.beginPath();
  c.moveTo(-hw + 13, 0);
  c.lineTo(hw - 13, 0);
  c.lineTo(hw, 13);
  c.lineTo(hw, h);
  c.lineTo(-hw, h);
  c.lineTo(-hw, 13);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(m.fg, 0.35);
  c.beginPath();
  c.arc(-hw + 15, 15, 4.4, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = withAlpha(mixLab(manila, m.fg, 0.35), 0.8);
  c.lineWidth = 1.4;
  c.beginPath();
  c.arc(-hw + 15, 15, 6.8, 0, Math.PI * 2);
  c.stroke();
  c.fillStyle = withAlpha(m.rim, 0.5 * L);
  c.fillRect(-hw + 13, 0, w - 26, 1);
  if (face && Math.abs(sx) > 0.25) {
    const lines = face.split('|');
    c.fillStyle = withAlpha(MOODS.parchment.ink, 0.9 * Math.min(1, 0.35 + L));
    c.textAlign = 'center';
    c.textBaseline = 'alphabetic';
    (c as C & { letterSpacing: string }).letterSpacing = '0.5px';
    const sub = sx >= 0 ? o.subFront ?? 1 : 1;
    const rel = (i: number) => (i === 0 ? 1 : sub);
    let s2 = size;
    const widest = () =>
      Math.max(
        ...lines.map((l, i) => {
          c.font = `500 ${s2 * rel(i)}px ${FONT.mono}`;
          return c.measureText(l).width;
        }),
      );
    while (widest() > w - 44 && s2 > 12) s2 -= 0.5;
    const hs = lines.map((_, i) => s2 * rel(i) * 1.18);
    const total = hs.reduce((a, b) => a + b, 0) - hs[0];
    let y = h / 2 + 4 + s2 * 0.36 - total / 2;
    lines.forEach((ln, i) => {
      if (i > 0) y += hs[i];
      c.font = `500 ${s2 * rel(i)}px ${FONT.mono}`;
      c.fillText(ln, 12, y);
    });
  }
  c.restore();
}
