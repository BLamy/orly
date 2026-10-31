/**
 * handwired-explained — ch01-s01 / ch01-s02 / ch01-s03: the three dock tiles' cut-out glyphs.
 *
 * ch01-s01 folds the three dock tiles up out of the dark over the copper wire; ch01-s02 opens on the same tiles on the
 * desk (handwiredDesk draws them blank) and ch01-s03 still has them at the bottom of frame. So the tiles keep their
 * glyphs through both crossfades, every shot draws them with this one painter:
 *
 *   dockGlyph(c, kind, s, col, lineW?)   kind 0 = the pulse line (Monitor) · 1 = the page (Notes) · 2 = the picture
 *                                        (Photos); drawn in tile-local px (0..s, top-left origin)
 *   deskDockGlyphs(c, tiles, lift, col)  the glyphs on the desk's own dock tiles (deskGeom(...).tiles), riding the
 *                                        same lift the desk applies to each tile
 */
import { withAlpha } from '../../../film/silhouette/palette';
import type { Rect } from './handwiredDesk';

export function dockGlyph(c: CanvasRenderingContext2D, kind: number, s: number, col: string, lineW = s * 0.05) {
  c.save();
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineWidth = lineW;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.beginPath();
  if (kind === 0) {
    // the pulse line (Monitor)
    c.moveTo(s * 0.18, s * 0.55);
    c.lineTo(s * 0.36, s * 0.55);
    c.lineTo(s * 0.45, s * 0.3);
    c.lineTo(s * 0.56, s * 0.74);
    c.lineTo(s * 0.64, s * 0.5);
    c.lineTo(s * 0.82, s * 0.5);
    c.stroke();
  } else if (kind === 1) {
    // the page (Notes): a sheet with a folded corner and three lines
    c.moveTo(s * 0.3, s * 0.2);
    c.lineTo(s * 0.6, s * 0.2);
    c.lineTo(s * 0.72, s * 0.32);
    c.lineTo(s * 0.72, s * 0.8);
    c.lineTo(s * 0.3, s * 0.8);
    c.closePath();
    c.stroke();
    c.lineWidth = lineW * 0.73;
    c.beginPath();
    for (let i = 0; i < 3; i++) {
      c.moveTo(s * 0.38, s * (0.44 + i * 0.11));
      c.lineTo(s * 0.64, s * (0.44 + i * 0.11));
    }
    c.stroke();
  } else {
    // the picture (Photos): a frame, a hill and a sun
    c.rect(s * 0.2, s * 0.26, s * 0.6, s * 0.48);
    c.stroke();
    c.beginPath();
    c.moveTo(s * 0.2, s * 0.74);
    c.lineTo(s * 0.42, s * 0.5);
    c.lineTo(s * 0.56, s * 0.62);
    c.lineTo(s * 0.66, s * 0.54);
    c.lineTo(s * 0.8, s * 0.7);
    c.lineTo(s * 0.8, s * 0.74);
    c.closePath();
    c.fill();
    c.beginPath();
    c.arc(s * 0.66, s * 0.38, s * 0.06, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

/** the glyphs on the desk's dock tiles (draw right after handwiredDesk, in the same layer) */
export function deskDockGlyphs(c: CanvasRenderingContext2D, tiles: Rect[], lift: number, col: string, a = 1) {
  if (a <= 0.005) return;
  tiles.forEach((t, i) => {
    const y = t.y - lift * t.h * 0.12 * (1 - Math.abs(i - 1) * 0.3);
    c.save();
    c.translate(t.x, y);
    dockGlyph(c, i, t.w, withAlpha(col, a), t.w * 0.05);
    c.restore();
  });
}
