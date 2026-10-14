/**
 * neural-net-history — screen-space light & depth passes shared by ch07-s01 … ch07-s06 (one animator's group).
 * All draw on f.c in STAGE px (screen-locked), after the layers and before the type.
 *
 *   lampGrade(f, o)          the banker's lamp's pool as a GRADE: a multiply ramp that is 1.0 at the lamp
 *                            (a screen point, usually off-frame lower right) and falls to `floor` (≈ .45) at
 *                            the far corner, a soft additive warm lift near the lamp, and a vignette
 *   hazeColumn(f, o)         defocus + haze a screen column (text cropped at the frame edge becomes texture)
 *   nearLip(f, o)            a blurred L5 foreground silhouette along the frame's foot: the desk's front edge,
 *                            optionally the green lamp shade's rim rising into the lamp-side corner (baked)
 */
import type { Frame } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { blurRect } from './ch02-s05b-util';

type C = CanvasRenderingContext2D;

export interface LampGradeOpts {
  /** the lamp (screen px); default lower right, just off-frame */
  x?: number;
  y?: number;
  /** multiply level at the farthest corner (0..1) */
  floor?: number;
  /** radius of the fully lit core */
  core?: number;
  /** additive warm lift near the lamp (0..1) */
  warm?: number;
  /** vignette ink alpha at the corners */
  vignette?: number;
  /** overall amount 0..1 (crossfades) */
  amount?: number;
}
export function lampGrade(f: Frame, o: LampGradeOpts = {}) {
  const c = f.c;
  const m = f.mood;
  const x = o.x ?? 1200, y = o.y ?? 780;
  const A = o.amount ?? 1;
  if (A <= 0.003) return;
  const floor = o.floor ?? 0.45;
  const far = Math.max(Math.hypot(x, y), Math.hypot(1280 - x, y), Math.hypot(x, 720 - y), Math.hypot(1280 - x, 720 - y));
  c.save();
  // the pool: multiply, white at the lamp → `floor` grey at the far corner (tinted to the room's shadow)
  c.globalCompositeOperation = 'multiply';
  c.globalAlpha = A;
  const g = c.createRadialGradient(x, y, o.core ?? 160, x, y, far);
  const lo = Math.round(255 * floor);
  const shade = mixLab(`rgb(${lo},${lo},${lo})`, mixLab(m.fg, m.halo, 0.5), 0.12);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.5, mixLab('#ffffff', shade, 0.22));
  g.addColorStop(0.78, mixLab('#ffffff', shade, 0.6));
  g.addColorStop(1, shade);
  c.fillStyle = g;
  c.fillRect(0, 0, 1280, 720);
  // a warm lift near the lamp
  const w = (o.warm ?? 0.1) * A;
  if (w > 0.003) {
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 1;
    const h = c.createRadialGradient(x, y, 20, x, y, far * 0.55);
    h.addColorStop(0, withAlpha(m.halo, w));
    h.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = h;
    c.fillRect(0, 0, 1280, 720);
  }
  // vignette
  const v = (o.vignette ?? 0.32) * A;
  if (v > 0.003) {
    c.globalCompositeOperation = 'source-over';
    c.globalAlpha = 1;
    c.save();
    c.translate(640, 360);
    c.scale(1.5, 1);
    const vg = c.createRadialGradient(0, 0, 250, 0, 0, 520);
    vg.addColorStop(0, withAlpha(m.fg, 0));
    vg.addColorStop(0.6, withAlpha(m.fg, v * 0.45));
    vg.addColorStop(1, withAlpha(m.fg, v));
    c.fillStyle = vg;
    c.fillRect(-430, -362, 860, 724);
    c.restore();
  }
  c.restore();
}

export interface HazeColumnOpts {
  /** the column (screen px) */
  x0: number;
  x1: number;
  /** defocus (stage px) */
  blur?: number;
  /** haze alpha at the outer edge */
  alpha?: number;
  /** which side is the outer edge (default left) */
  side?: 'left' | 'right' | 'bottom';
  y0?: number;
  y1?: number;
}
export function hazeColumn(f: Frame, o: HazeColumnOpts) {
  const c = f.c;
  const m = f.mood;
  const side = o.side ?? 'left';
  const a = o.alpha ?? 0.5;
  if (side === 'bottom') {
    const y0 = o.y0 ?? 600, y1 = o.y1 ?? 720;
    if ((o.blur ?? 3) > 0) blurRect(f, 0, y0 + (y1 - y0) * 0.35, 1280, (y1 - y0) * 0.65 + 2, o.blur ?? 3);
    const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, withAlpha(m.setHaze, 0));
    g.addColorStop(1, withAlpha(mixLab(m.setHaze, m.fg, 0.5), a));
    c.save();
    c.fillStyle = g;
    c.fillRect(0, y0, 1280, y1 - y0);
    c.restore();
    return;
  }
  const w = o.x1 - o.x0;
  const outer = side === 'left' ? o.x0 : o.x1;
  const inner = side === 'left' ? o.x1 : o.x0;
  // defocus the outer two thirds hard, the inner third lightly (no visible seam)
  if ((o.blur ?? 3) > 0) {
    const b = o.blur ?? 3;
    const hard = w * 0.62;
    blurRect(f, side === 'left' ? o.x0 : o.x1 - hard, 0, hard, 720, b);
    blurRect(f, side === 'left' ? o.x0 + hard : o.x0, 0, w - hard, 720, b * 0.45);
  }
  const g = c.createLinearGradient(outer, 0, inner, 0);
  g.addColorStop(0, withAlpha(mixLab(m.setHaze, m.fg, 0.35), a));
  g.addColorStop(0.55, withAlpha(m.setHaze, a * 0.45));
  g.addColorStop(1, withAlpha(m.setHaze, 0));
  c.save();
  c.fillStyle = g;
  c.fillRect(Math.min(outer, inner), 0, Math.abs(inner - outer), 720);
  c.restore();
}

export interface NearLipOpts {
  /** top of the desk lip (screen y) at its highest point */
  top: number;
  /** horizontal parallax offset (screen px) */
  dx?: number;
  /** the lamp shade's rim in the corner: 'right' | 'left' | false */
  shade?: 'right' | 'left' | false;
  /** the glow under the shade (0..1) */
  glow?: number;
  key: string;
}
/** a blurred near-plane silhouette at the frame's foot (desk edge + lamp shade rim); baked once per mood */
export function nearLip(f: Frame, o: NearLipOpts) {
  const c = f.c;
  const m = f.mood;
  const W = 1600, H = 240;
  const draw = f.cached(`ch07/nearLip/${o.key}/${m.id}/${o.shade ?? 'right'}`, W, H, (cc) => {
    // the desk's front edge: a moulded slab, slightly bowed (a long lens on a near plane)
    const top = 40;
    cc.fillStyle = mixLab(m.fg, m.ink, 0.5);
    cc.beginPath();
    cc.moveTo(0, top + 10);
    cc.quadraticCurveTo(W / 2, top - 6, W, top + 10);
    cc.lineTo(W, H);
    cc.lineTo(0, H);
    cc.closePath();
    cc.fill();
    // a rim of lamp light along the moulding
    cc.strokeStyle = withAlpha(m.rim, 0.55);
    cc.lineWidth = 3;
    cc.beginPath();
    cc.moveTo(0, top + 11);
    cc.quadraticCurveTo(W / 2, top - 5, W, top + 11);
    cc.stroke();
    cc.fillStyle = withAlpha(m.ink, 0.6);
    cc.fillRect(0, top + 26, W, 6);
    if (o.shade) {
      // the green-glass shade's rim: a dark curved hood rising into the lamp-side corner
      const sx = o.shade === 'right' ? W - 420 : 420;
      const dir = o.shade === 'right' ? 1 : -1;
      cc.fillStyle = mixLab(m.ink, '#1f3a2c', 0.35);
      cc.beginPath();
      cc.moveTo(sx - dir * 40, H);
      cc.bezierCurveTo(sx + dir * 30, 16, sx + dir * 300, 0, sx + dir * 470, 12);
      cc.lineTo(sx + dir * 470, H);
      cc.closePath();
      cc.fill();
      // its lower lip catches the bulb
      cc.strokeStyle = withAlpha(m.core, 0.55);
      cc.lineWidth = 4;
      cc.beginPath();
      cc.moveTo(sx - dir * 34, H - 20);
      cc.bezierCurveTo(sx + dir * 34, 30, sx + dir * 300, 14, sx + dir * 470, 26);
      cc.stroke();
    }
  }, { blur: 7 });
  c.save();
  // under-shade glow (additive, lamp-side)
  const gl = o.glow ?? 0.6;
  if (o.shade && gl > 0.01) {
    c.globalCompositeOperation = 'lighter';
    const gx = o.shade === 'right' ? 1160 + (o.dx ?? 0) : 120 + (o.dx ?? 0);
    const g = c.createRadialGradient(gx, o.top + 70, 10, gx, o.top + 70, 300);
    g.addColorStop(0, withAlpha(m.halo, 0.22 * gl));
    g.addColorStop(1, withAlpha(m.halo, 0));
    c.fillStyle = g;
    c.fillRect(gx - 300, o.top - 230, 600, 600);
    c.globalCompositeOperation = 'source-over';
  }
  draw(c, -160 + (o.dx ?? 0), o.top - 40);
  c.restore();
}
