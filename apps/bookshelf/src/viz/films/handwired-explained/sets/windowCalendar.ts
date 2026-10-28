/**
 * handwired-explained — DEVICE 2: the Window Calendar (the project's own time). ch03-s01, ch08-s01..s03, ch08-s08,
 * ch09-s01, ch09-s08, ch12-s01.
 *
 * The repo's commit history as a tall black paper building at night: ONE LIT PANE PER COMMIT, exact counts, never
 * rounded (PJ09). GRID (fixed for every appearance; same scale and placement each time, ch03-s01's direction):
 * each month's column is 6 panes wide, one storey per 6 commits, filled bottom-up in commit order.
 *   June 72 (12 storeys) · July 6 (1) · August 0 (black glass, snow on the sill) · September 58 (9 storeys + 4) ·
 *   October 1-12: 6 (1 storey). The main block is exactly 12 storeys (June's height).
 *   13-16 October are NOT part of the main block: a TOWER ANNEXE of four day-columns rising from its roof over
 *   the July..October columns,
 *   242 / 200 / 113 / 128 commits = 41 / 34 / 19 / 22 storeys (the building grows a tower in four days).
 * No new panes after 16 October (ch12).
 *
 *   import { windowCalendar, CAL, paneRect } from '../sets/windowCalendar';
 *   f.layer('L3', (c, env) => windowCalendar(f, c, env, { x: 640, y: 690, fill: { jun: 1 }, key: 'ch03-s01' }));
 *   paneRect('jun', 0)          // the first pane (3 June 2026, 20:24): push in there, put the deskHands inside
 *
 * fill.<month> is 0..1 of that column's commits lit (lit = floor(u × count): every pane is one commit); tower is
 * 0..1 of the annexe's 683 commits, filled day by day (13 → 16 October) in order. `snow` draws snow on August's sill.
 * The nameplate re-letters Numeric UI Atom Lab → Indirect → Handwired (PJ07): pass its stage and a 0..1 paint.
 */
import type { Frame, PaintEnv } from '../../../film/contracts';
import { mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, ghostOk, textRole } from '../../../film/silhouette/type';

export type Month = 'jun' | 'jul' | 'aug' | 'sep' | 'oct';
export type Day = 'd13' | 'd14' | 'd15' | 'd16';
export const MONTHS: Month[] = ['jun', 'jul', 'aug', 'sep', 'oct'];
export const DAYS: Day[] = ['d13', 'd14', 'd15', 'd16'];
/** exact commit counts (PJ09); oct = 1-12 October only (the other 683 are the tower) */
export const COMMITS: Record<Month | Day, number> = { jun: 72, jul: 6, aug: 0, sep: 58, oct: 6, d13: 242, d14: 200, d15: 113, d16: 128 };
export const MONTH_LABEL: Record<Month, string> = { jun: 'June', jul: 'July', aug: 'August', sep: 'September', oct: 'October' };

/** pane geometry (stage px at the layer, for the building's base centre at x, y) */
export const CAL = {
  pane: 7.2,
  gap: 2.6,
  cols: 6,
  /** gap between month columns (a pier) */
  pier: 12,
  storeys: 12,
  towerStoreys: 41,
} as const;
const P = CAL.pane + CAL.gap;
const COL_W = CAL.cols * P - CAL.gap;
/** the main block: five month columns side by side; the tower sits over October's column, four day-columns wide */
function layout(x: number, y: number) {
  const mainW = MONTHS.length * COL_W + (MONTHS.length - 1) * CAL.pier + 2 * CAL.pier;
  const left = x - mainW / 2 + CAL.pier;
  const colX = {} as Record<Month | Day, number>;
  MONTHS.forEach((m, i) => (colX[m] = left + i * (COL_W + CAL.pier)));
  const mainTop = y - CAL.storeys * P - CAL.pier;
  // the tower annexe: four day-columns rising from the main block's roof, over July..October (right-aligned)
  DAYS.forEach((d, i) => (colX[d] = colX[MONTHS[i + 1]]));
  return { mainW, left, colX, mainTop, base: y - CAL.pier, towerBase: mainTop - CAL.pier * 0.6 };
}

/** the rect of pane i (commit order, bottom-up, left to right) of a month or tower day column */
export function paneRect(col: Month | Day, i: number, at: { x: number; y: number } = { x: 640, y: 690 }) {
  const L = layout(at.x, at.y);
  const isDay = col.startsWith('d');
  const base = isDay ? L.towerBase : L.base;
  const storey = Math.floor(i / CAL.cols);
  const k = i % CAL.cols;
  return { x: L.colX[col] + k * P, y: base - (storey + 1) * P + CAL.gap, w: CAL.pane, h: CAL.pane };
}

export interface CalendarOpts {
  /** base centre of the building (stage px in the layer) */
  x: number;
  y: number;
  /** 0..1 of each month's commits lit; default 0 */
  fill?: Partial<Record<Month, number>>;
  /** 0..1 of the tower's 683 commits lit (in day order); 0 = no tower drawn */
  tower?: number;
  /** draw the tower's black card even before it lights (ch09 grows it storey by storey: tower is the fill) */
  towerShell?: number;
  /** snow on August's sill (and a little on the ledges), default true */
  snow?: boolean;
  /** highlight one pane (the first pane, ch03) with a warm glow: [col, index, 0..1] */
  glowPane?: [Month | Day, number, number];
  /** the nameplate stage: 0 'Numeric UI Atom Lab', 1 'Indirect' over it, 2 'Handwired' last; with paint 0..1 */
  nameplate?: 'Numeric UI Atom Lab' | 'Indirect' | 'Handwired' | false;
  nameplatePaint?: number;
  /** month labels under the columns (0..1); default 0 (the later months are not revealed early) */
  labels?: number;
  /** only these months' labels */
  labelMonths?: Month[];
  /** pane colour warmth (0 = cold window light, 1 = lamp amber); default .8 */
  warm?: number;
  key?: string;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** the black building (cached) + lit panes (live) */
export function windowCalendar(f: Frame, c: CanvasRenderingContext2D, env: PaintEnv, o: CalendarOpts) {
  const L = layout(o.x, o.y);
  const ink = env.fill('ink');
  const towerShell = Math.max(o.towerShell ?? 0, (o.tower ?? 0) > 0 ? 1 : 0);
  // ---- the building (black card), cached per mood
  const bx = o.x - L.mainW / 2 - 30, by = L.towerBase - 46 * P - 60;
  const bw = L.mainW + 60, bh = o.y - by + 4;
  f.cached(`hw-cal/${o.key ?? ''}/${env.mood.id}/${env.layer.id}/${towerShell > 0 ? 't' : 'm'}`, bw, bh, (cc) => {
    cc.translate(-bx, -by);
    cc.fillStyle = ink;
    // main block with a parapet and a cornice line
    cc.fillRect(o.x - L.mainW / 2, L.mainTop - 6, L.mainW, o.y - L.mainTop + 6);
    cc.fillRect(o.x - L.mainW / 2 - 6, L.mainTop - 12, L.mainW + 12, 8);
    // the door at the foot of June / July with a nameplate board above it
    // (the door is a darker recess with a lit transom)
    if (towerShell > 0) {
      DAYS.forEach((d) => {
        const st = Math.ceil(COMMITS[d] / CAL.cols);
        const x0 = L.colX[d] - CAL.pier * 0.5;
        cc.fillRect(x0, L.towerBase - st * P - 8, COL_W + CAL.pier, st * P + 8 + (L.base - L.towerBase));
      });
    }
    // unlit panes (black glass, a step lighter than the card) for every pane slot in the main block
    cc.fillStyle = mixLab(ink, env.mood.set, 0.35);
    MONTHS.forEach((m) => {
      for (let s = 0; s < CAL.storeys; s++) for (let k = 0; k < CAL.cols; k++) cc.fillRect(L.colX[m] + k * P, L.base - (s + 1) * P + CAL.gap, CAL.pane, CAL.pane);
    });
    if (towerShell > 0) {
      DAYS.forEach((d) => {
        const st = Math.ceil(COMMITS[d] / CAL.cols);
        for (let s = 0; s < st; s++) for (let k = 0; k < CAL.cols; k++) cc.fillRect(L.colX[d] + k * P, L.towerBase - (s + 1) * P + CAL.gap, CAL.pane, CAL.pane);
      });
    }
    // rim on the parapet (backlight from above)
    cc.strokeStyle = withAlpha(mixLab(env.mood.rim, env.mood.core, 0.4), 0.6);
    cc.lineWidth = 1.4;
    cc.beginPath();
    cc.moveTo(o.x - L.mainW / 2 - 6, L.mainTop - 12);
    cc.lineTo(o.x + L.mainW / 2 + 6, L.mainTop - 12);
    cc.stroke();
  })(c, bx, by);

  // ---- the lit panes: one per commit, exact
  const warm = o.warm ?? 0.8;
  const lit = mixLab(mixLab(env.mood.rim, '#f2c27a', warm), env.mood.core, 0.3);
  const litHot = mixLab(lit, '#fff1cf', 0.35);
  const paneAt = (col: Month | Day, i: number) => paneRect(col, i, o);
  for (const m of MONTHS) {
    const n = Math.floor(clamp01(o.fill?.[m] ?? 0) * COMMITS[m] + 1e-6);
    for (let i = 0; i < n; i++) {
      const r = paneAt(m, i);
      c.fillStyle = (i * 7 + COMMITS[m]) % 5 === 0 ? litHot : lit;
      c.fillRect(r.x, r.y, r.w, r.h);
    }
  }
  const tw = clamp01(o.tower ?? 0);
  if (tw > 0) {
    let budget = Math.floor(tw * 683 + 1e-6);
    for (const d of DAYS) {
      const n = Math.min(COMMITS[d], budget);
      budget -= n;
      for (let i = 0; i < n; i++) {
        const r = paneAt(d, i);
        c.fillStyle = (i * 11) % 7 === 0 ? litHot : lit;
        c.fillRect(r.x, r.y, r.w, r.h);
      }
    }
  }
  // the glow of a highlighted pane (additive)
  if (o.glowPane) {
    const [col, i, u] = o.glowPane;
    const r = paneAt(col, i);
    const g = c.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, 0, r.x + r.w / 2, r.y + r.h / 2, 40);
    g.addColorStop(0, withAlpha(env.mood.core, 0.55 * u));
    g.addColorStop(1, withAlpha(env.mood.halo, 0));
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = g;
    c.fillRect(r.x - 40, r.y - 40, 80 + r.w, 80 + r.h);
    c.restore();
  }
  // snow on August's sill and the ledges
  if (o.snow !== false) {
    c.fillStyle = withAlpha(mixLab('#eef2f4', env.mood.rim, 0.3), 0.85);
    const ax = L.colX.aug;
    for (let s = 0; s < CAL.storeys; s++) {
      const y = L.base - s * P + 0.2;
      c.beginPath();
      c.moveTo(ax - 2, y);
      for (let k = 0; k <= 12; k++) c.lineTo(ax - 2 + (COL_W + 4) * (k / 12), y - 1.2 - 1.1 * Math.abs(Math.sin(k * 1.3 + s)));
      c.lineTo(ax + COL_W + 2, y);
      c.closePath();
      c.fill();
    }
    c.beginPath();
    c.ellipse(ax + COL_W / 2, L.base + 1, COL_W * 0.6, 2.4, 0, Math.PI, 0);
    c.fill();
  }
  // the brass nameplate at the foot of June/July: each new name is lettered BENEATH the last, the old names painted
  // over and left faintly legible (PJ07). Deliberate overlap of a paint bar on old text: ghostOk.
  if (o.nameplate) {
    const names = ['Numeric UI Atom Lab', 'Indirect', 'Handwired'];
    const stage = names.indexOf(o.nameplate as string);
    const paint = clamp01(o.nameplatePaint ?? 1);
    const nx = (L.colX.jun + L.colX.jul + COL_W) / 2;
    const lh = 22, pw = 200, ph = 12 + lh * (stage + 1);
    const ny = o.y + 8;
    const plate = mixLab('#7a5c2e', env.mood.halo, 0.25);
    c.fillStyle = plate;
    c.fillRect(nx - pw / 2, ny, pw, ph);
    c.strokeStyle = withAlpha(env.mood.core, 0.5);
    c.lineWidth = 1;
    c.strokeRect(nx - pw / 2 + 2, ny + 2, pw - 4, ph - 4);
    ghostOk(c, () =>
      textRole(c, 'subject', () => {
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = `600 15px ${FONT.sc}`;
        for (let i = 0; i <= stage; i++) {
          const y = ny + 6 + lh * (i + 0.5);
          if (i < stage) {
            c.fillStyle = withAlpha('#1d140d', 0.3);
            c.fillText(names[i], nx, y);
            // the paint stroke over the old name (a translucent band of the plate's own colour)
            c.fillStyle = withAlpha(plate, 0.55);
            c.fillRect(nx - pw / 2 + 10, y - 7, pw - 20, 14);
          } else {
            c.fillStyle = i === 2 ? withAlpha(mixLab('#c27a43', env.mood.core, 0.25), paint) : withAlpha('#1d140d', 0.85 * paint);
            c.fillText(names[i], nx, y);
          }
        }
        c.textAlign = 'left';
      }),
    );
  }
  // month labels (only when a shot reveals them)
  const la = clamp01(o.labels ?? 0);
  if (la > 0) {
    textRole(c, 'subject', () => {
      c.font = `italic 15px ${FONT.display}`;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.fillStyle = withAlpha(env.mood.core, 0.9 * la);
      (o.labelMonths ?? MONTHS).forEach((m) => c.fillText(MONTH_LABEL[m], L.colX[m] + COL_W / 2, o.y + 6));
      c.textAlign = 'left';
    });
  }
}
