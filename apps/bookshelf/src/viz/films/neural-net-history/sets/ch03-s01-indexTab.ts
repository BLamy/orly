/**
 * ch03-s01 — the CHAPTER INDEX TAB at chapter-title size (critic round 1: the shared tab's title sat ~55 px
 * from the top edge at a small size). Same device as sets/indexTab.ts (a manila file-divider tab drops from
 * the top edge at TOP-LEFT, holds, slides back up; motion on twos), but the tab hangs lower and its title
 * is set larger: the title's BASELINE rests at `baseline` stage px (default 58 → 87 px at 1080p) and its cap
 * height is `cap` px at 1080p (default 29).
 *
 *   indexTabLg(f.c, { title, at: 0, hold: 2.5 }, { t, mood })
 */
import type { Palette } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, capPx1080 } from '../../../film/silhouette/type';

export interface IndexTabLgOpts {
  title: string;
  at?: number;
  hold?: number;
  x?: number;
  /** the title's baseline at rest (stage px from the top edge) */
  baseline?: number;
  /** cap height at 1080p */
  cap?: number;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (u: number) => 1 - (1 - u) * (1 - u);

export function indexTabLg(c: CanvasRenderingContext2D, o: IndexTabLgOpts, env: { t: number; mood: Palette }) {
  const at = o.at ?? 0;
  const hold = o.hold ?? 2.5;
  const tq = Math.floor(env.t * 12) / 12 - at;
  if (tq < 0 || tq > hold + 1.0) return;
  // the title size that gives the requested cap height at 1080p (includes the frame scale)
  const ref = capPx1080(c, `400 26px ${FONT.typewriter}`);
  const size = Math.round((26 * (o.cap ?? 29)) / Math.max(1, ref));
  const base = o.baseline ?? 58;
  const H = base + Math.round(size * 0.85);
  c.save();
  c.font = `400 ${size}px ${FONT.typewriter}`;
  const tw = c.measureText(o.title).width;
  c.restore();
  const x = o.x ?? 48;
  const W = Math.max(560, Math.min(1180 - x, tw + 72));
  // drop (0–.5 s, overshoot and settle), hold, slide up (last .5 s)
  let y: number;
  if (tq < 0.5) {
    const u = easeOut(clamp01(tq / 0.42));
    y = -1 + u * 1.06 - (tq > 0.42 ? 0.06 * clamp01((tq - 0.42) / 0.08) : 0);
  } else if (tq < 0.5 + hold) y = 0;
  else y = -easeOut(clamp01((tq - 0.5 - hold) / 0.5));
  const top = y * (H + 40);
  const manila = mixLab(MOODS.parchment.sky[2], '#b08a52', 0.45);
  const ink = MOODS.parchment.ink;
  c.save();
  // soft shadow, the tab body with rounded lower corners, a faint fibre band, a punched hole
  c.fillStyle = withAlpha(env.mood.fg, 0.45);
  c.fillRect(x + 6, top + 7, W, H);
  c.fillStyle = manila;
  c.beginPath();
  c.moveTo(x, top - 20);
  c.lineTo(x + W, top - 20);
  c.lineTo(x + W, top + H - 14);
  c.quadraticCurveTo(x + W, top + H, x + W - 14, top + H);
  c.lineTo(x + 14, top + H);
  c.quadraticCurveTo(x, top + H, x, top + H - 14);
  c.closePath();
  c.fill();
  c.fillStyle = withAlpha(ink, 0.08);
  c.fillRect(x, top + H - 10, W, 4);
  c.fillStyle = withAlpha(ink, 0.5);
  c.beginPath();
  c.arc(x + W - 22, top + 14, 4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(ink, 0.9);
  c.font = `400 ${size}px ${FONT.typewriter}`;
  c.textBaseline = 'alphabetic';
  c.fillText(o.title, x + 30, top + base);
  c.restore();
}
