/**
 * neural-net-history — THE STUDY'S FULL WIDE as ch01-s05 leaves it (ch01-s05's end; ch01-s06 opens on it).
 *
 * The light and grade of the first reserved wide, shared so ch01-s06's first frames continue ch01-s05's hold
 * exactly (the same near desk, lamp, file, chair, window and grade):
 *   windowWash(f, cam)          the night through the study window, dimmed to about L* 35, a deep night blue
 *   shelfBand(c, env)           the study wall darkened (~10 L*) in a band behind the candle shelf, so the ghost
 *                               candles' pale sleeves and ink stubs read against it (draw before the shelf)
 *   backHaze(f, cam, k)         the amber backlight and haze behind the board area, brightest at about 0.6H, so
 *                               the lamp, the shelf plank and the desk stand as ink against it (before the desk)
 *   wideGrade(f, cam, k, t)     the edges darkened, the bookcase sunk toward ink, the lamp's upward cone onto
 *                               the board and the fog wisps lying along the shelf (after the desk)
 *   lampSpill(f, cam, k)        the banker's lamp's pool on the desk top and its halo on the wall
 *   S05_END_CAM                 ch01-s05's last camera (the held wide, settled in)
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { toScreen } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { STUDY, STUDY_CAMS, STUDY_WALL } from './study';
import { SLOTS } from './studyState';
import { BULB01, DESK01, SHELF_PLANE } from './ch01-s04-nearDesk';

/** ch01-s05's full wide: STUDY_CAMS.full pulled back further and raised, so the candle shelf reads ABOVE the near
 *  desk's edge with the board and the Wall in the same frame */
export const S05_FULL_CAM: Camera3 = { ...STUDY_CAMS.full, y: STUDY_CAMS.full.y - 125, z: STUDY_CAMS.full.z - 95 };
/** ch01-s05's held wide at the cut (the full wide, settled in 8 units); ch01-s06 opens on it */
export const S05_END_CAM: Camera3 = { ...S05_FULL_CAM, z: S05_FULL_CAM.z + 8 };

/** the night through the study window: a deep night blue at about L* 35, below the lamp's pool in value */
export function windowWash(f: Frame, cam: Camera3) {
  const W = STUDY.window;
  const a = toScreen(STUDY_WALL, cam, W.x, W.y);
  const b = toScreen(STUDY_WALL, cam, W.x + W.w, W.y + W.h);
  if (b.x < 0 || a.x > 1280) return;
  const c = f.c;
  c.save();
  c.beginPath();
  c.rect(a.x, a.y, b.x - a.x, b.y - a.y);
  c.clip();
  // take most of the city's cyan out, darken, then lay a deep night blue over the glass
  c.globalCompositeOperation = 'saturation';
  c.fillStyle = withAlpha('#808080', 0.7);
  c.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
  c.globalCompositeOperation = 'source-over';
  c.fillStyle = withAlpha(f.mood.fg, 0.38);
  c.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
  c.fillStyle = withAlpha('#26344f', 0.42);
  c.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
  c.restore();
}

/** the wall band behind the candle shelf, about 10 L* darker (layer px, drawn in the board's layer) */
export function shelfBand(c: CanvasRenderingContext2D, env: PaintEnv) {
  const y1 = STUDY.shelf.y, y0 = y1 - 330;
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, withAlpha(env.mood.fg, 0));
  g.addColorStop(0.3, withAlpha(env.mood.fg, 0.3));
  g.addColorStop(1, withAlpha(env.mood.fg, 0.36));
  c.fillStyle = g;
  c.fillRect(STUDY.shelf.x - 400, y0, 2800, y1 - y0 + 2);
}

/** the amber backlight and haze behind the board area: a warm band brightest at about 0.6H (screen blend) */
export function backHaze(f: Frame, k: number) {
  if (k <= 0.01) return;
  const c = f.c;
  const m = f.mood;
  const warm = mixLab(m.haze, m.halo, 0.45);
  c.save();
  c.globalCompositeOperation = 'screen';
  const g = c.createLinearGradient(0, 0.3 * 720, 0, 0.9 * 720);
  g.addColorStop(0, withAlpha(warm, 0));
  g.addColorStop(0.5, withAlpha(warm, 0.3 * k));
  g.addColorStop(1, withAlpha(warm, 0));
  c.fillStyle = g;
  c.fillRect(-20, 0.3 * 720, 1320, 0.6 * 720);
  c.restore();
}

/** the full wide's grade: the dark falls in from the edges (centred between the lamp and K), the bookcase sinks
 *  toward ink, the lamp throws a soft upward cone onto the board (brightest at K), fog lies along the shelf */
export function wideGrade(f: Frame, cam: Camera3, k: number, t: number) {
  const c = f.c;
  const m = f.mood;
  const K = toScreen(LAYERS.L4, cam, STUDY.board.x + SLOTS.K.x, STUDY.board.y + SLOTS.K.y);
  const b = toScreen(LAYERS.L5, cam, BULB01.x, BULB01.y);
  const cx = (K.x + b.x) / 2, cy = (K.y + b.y) / 2;
  const g = c.createRadialGradient(cx, cy, 120, cx, cy, 900);
  g.addColorStop(0, withAlpha(m.fg, 0));
  g.addColorStop(0.35, withAlpha(m.fg, 0.18 * k));
  g.addColorStop(0.7, withAlpha(m.fg, 0.4 * k));
  g.addColorStop(1, withAlpha(m.fg, 0.62 * k));
  c.save();
  c.fillStyle = g;
  c.fillRect(-20, -20, 1320, 760);
  // the bookcase toward ink (its bays keep a breath of amber between the spines)
  const bc = toScreen(SHELF_PLANE, cam, 100, 0).x;
  if (bc > 0) {
    const bg = c.createLinearGradient(0, 0, bc + 20, 0);
    bg.addColorStop(0, withAlpha(m.fg, 0.5 * k));
    bg.addColorStop(0.85, withAlpha(m.fg, 0.38 * k));
    bg.addColorStop(1, withAlpha(m.fg, 0));
    c.fillStyle = bg;
    c.fillRect(-20, -20, bc + 40, 760);
  }
  c.restore();
  // the upward cone: from the shade's top, widening onto the board, brightest at K
  const warm = mixLab(m.halo, m.core, 0.2);
  c.save();
  c.globalCompositeOperation = 'screen';
  c.filter = `blur(${(22 * f.pxScale).toFixed(1)}px)`;
  const cone = new Path2D();
  cone.moveTo(b.x - 26, b.y - 6);
  cone.lineTo(b.x + 26, b.y - 6);
  cone.lineTo(K.x + 250, K.y - 150);
  cone.lineTo(K.x - 250, K.y - 150);
  cone.closePath();
  const cg = c.createLinearGradient(0, b.y, 0, K.y - 150);
  cg.addColorStop(0, withAlpha(warm, 0.2 * k));
  cg.addColorStop(0.6, withAlpha(warm, 0.12 * k));
  cg.addColorStop(1, withAlpha(warm, 0));
  c.fillStyle = cg;
  c.fill(cone);
  c.filter = 'none';
  const kg = c.createRadialGradient(K.x, K.y, 0, K.x, K.y, 210);
  kg.addColorStop(0, withAlpha(warm, 0.2 * k));
  kg.addColorStop(1, withAlpha(warm, 0));
  c.fillStyle = kg;
  c.fillRect(K.x - 210, K.y - 210, 420, 420);
  c.restore();
  // the fog sheet lying along the shelf: long lit wisps drifting slowly left
  const sy = toScreen(LAYERS.L4, cam, 0, STUDY.shelf.y).y - 18;
  c.save();
  c.globalCompositeOperation = 'screen';
  for (let i = 0; i < 7; i++) {
    const wx = ((i * 230 - t * (8 + 3 * (i % 3)) + 1600) % 1600) - 160;
    const wy = sy + (i % 3 - 1) * 9;
    const rx = 220 + 60 * (i % 2);
    c.save();
    c.translate(wx, wy);
    c.scale(1, 0.12);
    const wg = c.createRadialGradient(0, 0, 0, 0, 0, rx);
    wg.addColorStop(0, withAlpha(mixLab(m.haze, m.halo, 0.4), 0.16 * k));
    wg.addColorStop(1, withAlpha(m.haze, 0));
    c.fillStyle = wg;
    c.fillRect(-rx, -rx, 2 * rx, 2 * rx);
    c.restore();
  }
  c.restore();
}

/** the banker's lamp in the full wide: a soft pool thrown DOWN by the shade onto the desk top (wide, flat) and a
 *  faint halo on the wall around the shade, screen-blended and warm (no new hue) */
export function lampSpill(f: Frame, cam: Camera3, k: number) {
  const c = f.c;
  const b = toScreen(LAYERS.L5, cam, BULB01.x, BULB01.y);
  const d = toScreen(LAYERS.L5, cam, BULB01.x, DESK01.back);
  const sc = Math.abs(d.y - b.y) / Math.max(1, DESK01.back - BULB01.y);
  const warm = mixLab(f.mood.halo, f.mood.core, 0.25);
  c.save();
  c.globalCompositeOperation = 'screen';
  c.translate(d.x, d.y + 4);
  c.scale(1, 0.2);
  const rx = 520 * sc;
  const g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, withAlpha(warm, 0.34 * k));
  g.addColorStop(0.45, withAlpha(warm, 0.12 * k));
  g.addColorStop(1, withAlpha(warm, 0));
  c.fillStyle = g;
  c.fillRect(-rx, -rx, 2 * rx, 2 * rx);
  c.restore();
  c.save();
  c.globalCompositeOperation = 'screen';
  const r = 300 * sc;
  const h = c.createRadialGradient(b.x, b.y + 20 * sc, 0, b.x, b.y + 20 * sc, r);
  h.addColorStop(0, withAlpha(warm, 0.13 * k));
  h.addColorStop(1, withAlpha(warm, 0));
  c.fillStyle = h;
  c.fillRect(b.x - r, b.y + 20 * sc - r, 2 * r, 2 * r);
  c.restore();
}
