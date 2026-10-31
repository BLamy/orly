/**
 * ch04-s02 / s03 / s05 — THE PERCEPTRONS BOOK, one design for every shot it appears in (review round 1:
 * "agree one book design: proportions, title type, page-edge side").
 *
 *   BOOK_ASPECT, BOOK_DEPTH        w = BOOK_ASPECT × h; the page block's visible depth = BOOK_DEPTH × w
 *   bookGeom(x, base, h)           → { x, y (base), w, h, depth, top, titleY, titleSize, titleX }
 *   bookBody(f, c, g, env, key)    the upright book (cached): dark cloth front board, a ruled lighter page block
 *                                  receding on the RIGHT (the fore-edge side), the head's board overhang, a raised
 *                                  bevel rule inset on the front board, a spine edge on the left
 *   bookTitle(c, g, env, k)        the one word cut THROUGH the cover in light: PERCEPTRONS, Cormorant SC 600, sized
 *                                  0.11 × w with tracking w / 330, centred, a quarter of the way down the board.
 *                                  k (0..1) = how hot the light behind it is.
 *   TITLE_FONT(size)               the title face, for shots that set the title on another view of the book
 *
 * Every view of the book uses these numbers, so the viewer always reads the same object: in s02 a monolith on the
 * paper stage, in s03 the same monolith at the left edge of the field, in s05 table-sized under a candle.
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { FONT } from '../../../film/silhouette/type';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';

type C = CanvasRenderingContext2D;

export const BOOK_ASPECT = 0.77;
export const BOOK_DEPTH = 0.12;
export const TITLE = 'PERCEPTRONS';
export const TITLE_FONT = (size: number) => `600 ${size}px ${FONT.sc}`;
/** title size and tracking as fractions of the board width */
export const TITLE_K = 0.11;
export const TRACK_K = 1 / 330;
/** title baseline-centre as a fraction of the board height from the top */
export const TITLE_Y = 0.25;

export interface BookGeom {
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
  top: number;
  titleX: number;
  titleY: number;
  titleSize: number;
}

export function bookGeom(x: number, base: number, h: number): BookGeom {
  const w = h * BOOK_ASPECT;
  const top = base - h;
  return { x, y: base, w, h, depth: w * BOOK_DEPTH, top, titleX: x + w / 2, titleY: top + h * TITLE_Y, titleSize: w * TITLE_K };
}

/** the upright book's body (boards, page block, head, bevel), cached per geometry and mood */
export function bookBody(f: Frame, c: C, g: BookGeom, env: PaintEnv, key: string, o: { ink?: string; rim?: number; spine?: number } = {}) {
  const { x, y, w, h, depth, top } = g;
  const pad = 12;
  const rimA = o.rim ?? 1;
  const spineA = o.spine ?? 0;
  f.cached(
    `${key}/perceptronsBook/${env.mood.id}/${Math.round(w)}x${Math.round(h)}x${Math.round(depth)}/${o.ink ?? ''}/${rimA}/${spineA}`,
    Math.ceil(w + depth + pad * 2),
    Math.ceil(h + pad * 2 + depth * 0.3),
    (cc) => {
      cc.translate(-x + pad, -top + pad + depth * 0.3);
      const ink = o.ink ?? env.fill('ink');
      const k = w / 330;
      // page block on the right (the fore-edge), receding: a lighter, finely ruled sliver
      cc.fillStyle = mixLab(env.fill('set'), env.mood.halo, 0.4);
      cc.beginPath();
      cc.moveTo(x + w - 4 * k, top + 8 * k);
      cc.lineTo(x + w + depth - 6 * k, top - 6 * k);
      cc.lineTo(x + w + depth - 6 * k, y - 12 * k);
      cc.lineTo(x + w - 4 * k, y - 2 * k);
      cc.closePath();
      cc.fill();
      cc.strokeStyle = withAlpha(env.mood.fg, 0.3);
      cc.lineWidth = 0.7;
      for (let i = 1; i < 9; i++) {
        const u = i / 9;
        cc.beginPath();
        cc.moveTo(x + w - 4 * k + (depth - 2 * k) * u, top + 8 * k - 14 * k * u);
        cc.lineTo(x + w - 4 * k + (depth - 2 * k) * u, y - 2 * k - 10 * k * u);
        cc.stroke();
      }
      // back board edge and the head's overhang (seen just from below)
      cc.fillStyle = ink;
      cc.fillRect(x + w + depth - 8 * k, top - 8 * k, 6 * k, h - 2 * k);
      cc.beginPath();
      cc.moveTo(x, top);
      cc.lineTo(x + 10 * k, top - 7 * k);
      cc.lineTo(x + w + depth - 2 * k, top - 8 * k);
      cc.lineTo(x + w - 2 * k, top + 1);
      cc.closePath();
      cc.fill();
      // the front board
      cc.fillStyle = ink;
      cc.fillRect(x, top, w, h);
      // spine edge (left) and the cut-paper bevel rule inset on the board
      cc.strokeStyle = withAlpha(env.mood.rim, 0.22 * rimA);
      cc.lineWidth = 2;
      cc.beginPath();
      cc.moveTo(x + 5 * k, top + 6 * k);
      cc.lineTo(x + 5 * k, y - 6 * k);
      cc.stroke();
      cc.strokeStyle = withAlpha(env.mood.rim, 0.28 * rimA);
      cc.lineWidth = 1.4;
      cc.strokeRect(x + 16 * k, top + 16 * k, w - 32 * k, h - 32 * k);
      cc.strokeStyle = withAlpha(env.mood.rim, 0.5 * rimA);
      cc.lineWidth = 1.2;
      cc.beginPath();
      cc.moveTo(x + 1, top + 1);
      cc.lineTo(x + w - 1, top + 1);
      cc.stroke();
      // optional bound-book spine: a 2-3 px bevelled highlight on the rounded spine edge, a dark hinge groove
      // inside it, and head/tail caps, so the board reads as a bound book, not a cabinet door
      if (spineA > 0) {
        const sw = Math.max(2.5, 2.6 * k);
        const sg = cc.createLinearGradient(x, 0, x + sw * 2.2, 0);
        sg.addColorStop(0, withAlpha(env.mood.rim, 0.15 * spineA));
        sg.addColorStop(0.35, withAlpha(mixLab(env.mood.rim, '#fff3d6', 0.3), 0.75 * spineA));
        sg.addColorStop(1, withAlpha(env.mood.rim, 0));
        cc.fillStyle = sg;
        cc.fillRect(x, top + 3 * k, sw * 2.2, h - 6 * k);
        cc.strokeStyle = withAlpha(env.mood.fg, 0.7 * spineA);
        cc.lineWidth = 2 * k;
        cc.beginPath();
        cc.moveTo(x + 11 * k, top + 4 * k);
        cc.lineTo(x + 11 * k, y - 4 * k);
        cc.stroke();
        cc.strokeStyle = withAlpha(env.mood.rim, 0.32 * spineA);
        cc.lineWidth = 1;
        cc.beginPath();
        cc.moveTo(x + 13 * k, top + 4 * k);
        cc.lineTo(x + 13 * k, y - 4 * k);
        cc.stroke();
        for (const yy of [top + 26 * k, y - 26 * k]) {
          cc.strokeStyle = withAlpha(env.mood.rim, 0.4 * spineA);
          cc.lineWidth = 1.4;
          cc.beginPath();
          cc.moveTo(x + 1, yy);
          cc.lineTo(x + 9 * k, yy);
          cc.stroke();
        }
      }
    },
  )(c, x - pad, top - pad - depth * 0.3);
}

/** the word cut through the cover in light (warm core, soft bloom); k = 0..1 brightness of the light behind */
export function bookTitle(c: C, g: BookGeom, env: PaintEnv, k = 1, o: { leak?: number } = {}) {
  if (k <= 0.002) return;
  c.save();
  c.font = TITLE_FONT(g.titleSize);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  (c as C & { letterSpacing: string }).letterSpacing = `${(g.w * TRACK_K).toFixed(2)}px`;
  const col = mixLab(env.mood.halo, env.mood.core, 0.6);
  c.shadowColor = withAlpha(env.mood.core, 0.7 * k);
  c.shadowBlur = 14 * env.pxScale * (g.w / 330);
  c.fillStyle = withAlpha(col, 0.92 * k);
  c.fillText(TITLE, g.titleX, g.titleY);
  c.shadowBlur = 0;
  c.fillStyle = withAlpha(mixLab(env.mood.core, '#fff3d6', 0.4), 0.85 * k);
  c.fillText(TITLE, g.titleX, g.titleY);
  c.restore();
  // the light leaking from the cut word down the board
  const leak = (o.leak ?? 0.16) * k;
  if (leak > 0.002) {
    const R = 220 * (g.w / 330);
    c.save();
    c.globalCompositeOperation = 'lighter';
    const gr = c.createRadialGradient(g.titleX, g.titleY, 10, g.titleX, g.titleY, R);
    gr.addColorStop(0, withAlpha(env.mood.halo, leak));
    gr.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.fillStyle = gr;
    c.fillRect(g.titleX - R, g.titleY - R, 2 * R, 2 * R);
    c.restore();
  }
}

// ------------------------------------------------------------------------------------------------ the s02 → s03 match
/** s02's monolith on its stage (L4 world px) and s02's final camera: s03 opens on exactly this framing of the book */
export const S02_BOOK = bookGeom(250, 640, 480);
/** s02's (and s03's matching) monolith with a thicker page block (×1.5) so it reads as a bound book */
export const S02_BOOK_BOUND: BookGeom = { ...S02_BOOK, depth: S02_BOOK.depth * 1.5 };
export const S02_END_CAM = { x: 600, y: 346, z: 80, lens: 1 };
/** where s02's book sits on screen at its last frame (stage px): x, top, w, h */
export function s02BookOnScreen() {
  const k = 1000 / (1000 - S02_END_CAM.z);
  const g = S02_BOOK;
  return { x: 640 + (g.x - S02_END_CAM.x) * k, top: 360 + (g.top - S02_END_CAM.y) * k, w: g.w * k, h: g.h * k, base: 360 + (g.y - S02_END_CAM.y) * k };
}
