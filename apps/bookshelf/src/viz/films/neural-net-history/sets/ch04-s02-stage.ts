/**
 * ch04-s02 — the paper stage for the PERCEPTRONS monolith and the third candle (a variant of sets/candleStage
 * that the shot can steer: a back wall of tall windows cut as HOLES, and a candle-naming card in LIGHTING mode).
 *
 *   windowBack(f, c, env, key, cams)   L2: the reference back wall, pointed windows cut as evenodd holes with
 *                                      tracery, panes and a wainscot (haze stays the L2 default, 0.18), so the
 *                                      backlight's glass reads at L* 55–62 behind the figures
 *   flameWash(c, env, x, y, fk)         L2: the new flame's warm wash on the wall (dynamic)
 *   floorPool(c, env, o)               L4: the stage floor, its receding seams, and the flame's round pool
 *   litCard(c, o, env)                 screen-locked: the candle's name at the moment it is LIT (the belief in its
 *                                      era's face over "lit <year>" only; the kit's naming rule prints the full
 *                                      date range, which would give away later chapters at a lighting)
 */
import type { Camera3, Frame, PaintEnv } from '../../../film/contracts';
import { LAYERS } from '../../../film/contracts';
import { overscan } from '../../../film/core/multiplane';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { windowWall } from '../../../film/silhouette/architecture';
import { FONT, capPx1080, legibleSize } from '../../../film/silhouette/type';
import { fontForYear } from './beliefCandle';

type C = CanvasRenderingContext2D;

/** window centres on the back wall (rest-screen px at L2): one bay behind each figure, one behind the book */
export const WIN_CENTERS = [-230, 150, 520, 890, 1260, 1630];

export function windowBack(f: Frame, c: C, env: PaintEnv, key: string, cams: Camera3[]) {
  const r = overscan(LAYERS.L2, cams, 80);
  f.cached(`${key}/winBack/${env.mood.id}/${Math.round(r.x)},${Math.round(r.w)}`, Math.ceil(r.w), Math.ceil(720 + 40 - r.y), (cc) => {
    cc.translate(-r.x, -r.y);
    windowWall(
      cc,
      {
        x: r.x,
        y: r.y,
        w: r.w,
        h: 720 + 40 - r.y,
        centers: WIN_CENTERS.filter((x) => x > r.x - 150 && x < r.x + r.w + 150),
        winW: 236,
        apex: 34,
        sill: 560,
        shape: 'pointed',
        lights: 2,
        panes: { cols: 2, rows: 9 },
        transoms: [0.34],
        tracery: 'quatrefoil',
        spandrel: 'trefoil',
        cornice: 0,
        wainscot: 120,
        shade: 0.35,
      },
      env,
    );
  })(c, r.x, r.y);
}

/** the flame's warm wash on the back wall (additive, so it lifts the wall and the glass around the flame) */
export function flameWash(c: C, env: PaintEnv, x: number, y: number, fk: number) {
  if (fk <= 0.002) return;
  const R = 520;
  c.save();
  c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 10, x, y, R);
  g.addColorStop(0, withAlpha(env.mood.halo, 0.2 * fk));
  g.addColorStop(0.45, withAlpha(env.mood.halo, 0.07 * fk));
  g.addColorStop(1, withAlpha(env.mood.halo, 0));
  c.fillStyle = g;
  c.fillRect(x - R, y - R, 2 * R, 2 * R);
  c.restore();
}

export function floorPool(c: C, env: PaintEnv, o: { floorY: number; poolX: number; poolY: number; rx: number; ry: number; fk: number; cams: Camera3[] }) {
  const r = overscan(LAYERS.L4, o.cams, 40);
  const fy = o.floorY;
  // the floor: dark boards, a faint warm sheen from the windows at the back edge
  c.fillStyle = mixLab(env.mood.fg, env.mood.set, 0.35);
  c.fillRect(r.x, fy - 6, r.w, r.y + r.h - fy + 6);
  const sheen = c.createLinearGradient(0, fy - 6, 0, fy + 40);
  sheen.addColorStop(0, withAlpha(mixLab(env.mood.set, env.mood.halo, 0.35), 0.55));
  sheen.addColorStop(1, withAlpha(env.mood.set, 0));
  c.fillStyle = sheen;
  c.fillRect(r.x, fy - 6, r.w, 46);
  // the pool
  if (o.fk > 0.002) {
    c.save();
    c.translate(o.poolX, o.poolY);
    c.scale(1, o.ry / Math.max(1, o.rx));
    const pg = c.createRadialGradient(0, 0, 10, 0, 0, o.rx);
    pg.addColorStop(0, withAlpha(mixLab(env.mood.halo, env.mood.core, 0.25), 0.9 * o.fk));
    pg.addColorStop(0.55, withAlpha(env.mood.halo, 0.5 * o.fk));
    pg.addColorStop(0.86, withAlpha(mixLab(env.mood.setHaze, env.mood.halo, 0.3), 0.22 * o.fk));
    pg.addColorStop(1, withAlpha(env.mood.set, 0));
    c.fillStyle = pg;
    c.beginPath();
    c.arc(0, 0, o.rx, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  // floorboard seams converging toward the back
  c.strokeStyle = withAlpha(env.mood.fg, 0.35);
  c.lineWidth = 1;
  for (let i = -16; i <= 16; i++) {
    c.beginPath();
    c.moveTo(o.poolX + i * 60, fy);
    c.lineTo(o.poolX + i * 110, r.y + r.h);
    c.stroke();
  }
}

export interface LitCardOpts {
  /** the belief, as lettered on the candle */
  text: string;
  /** the year it is lit */
  year: number;
  /** screen point (stage px) the leader runs to: the flame */
  sx: number;
  sy: number;
  /** the card's right edge and bottom edge (stage px, screen-locked) */
  right: number;
  bottom: number;
  k: number;
  /** type scale on top of the computed floor size (the audit measures Special Elite's caps ~30% under the kit's
   *  estimate, so the belief lines take 1.3 to clear 23 px) */
  scale?: number;
}

/** the candle's name in lighting mode: the belief over "lit <year>", house card style (warm paper, cut shadow) */
export function litCard(c: C, o: LitCardOpts, env: { mood: PaintEnv['mood'] }) {
  const k = Math.max(0, Math.min(1, o.k));
  if (k <= 0.003) return;
  const face = fontForYear(o.year);
  // 26 px cap height on a 1080p frame (the floor is 22)
  const size = (o.scale ?? 1) * Math.max(legibleSize(c, `400 18px ${face}`, 18), (18 * 26) / Math.max(1e-3, capPx1080(c, `400 18px ${face}`)));
  const dSize = legibleSize(c, `italic 400 18px ${FONT.text}`, 18);
  const tFont = `400 ${size}px ${face}`;
  const dFont = `italic 400 ${dSize}px ${FONT.text}`;
  const words = o.text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const wd of words) {
    const nx = cur ? `${cur} ${wd}` : wd;
    if (cur && nx.length > 22) {
      lines.push(cur);
      cur = wd;
    } else cur = nx;
  }
  if (cur) lines.push(cur);
  const dates = `lit ${o.year}`;
  c.save();
  c.font = tFont;
  const tw = Math.max(...lines.map((l) => c.measureText(l).width), 0);
  c.font = dFont;
  const dw = c.measureText(dates).width;
  const pad = 14;
  const lh = size * 1.2;
  const w = Math.max(tw, dw) + pad * 2;
  const h = lines.length * lh + dSize * 1.45 + pad * 1.7;
  const x0 = Math.max(40, o.right - w);
  const y0 = Math.max(36, o.bottom - h);
  const grow = 0.94 + 0.06 * k;
  c.globalAlpha = Math.min(1, k * 1.15);
  // leader to the flame (from the card's lower-right corner)
  c.strokeStyle = withAlpha(env.mood.rim, 0.7);
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x0 + w - 6, y0 + h);
  c.lineTo(o.sx - 6, o.sy - 10);
  c.stroke();
  c.translate(x0 + w / 2, y0 + h / 2);
  c.scale(grow, grow);
  c.translate(-w / 2, -h / 2);
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
  c.fillText(dates, pad, pad + lines.length * lh + dSize * 1.05);
  c.restore();
}
