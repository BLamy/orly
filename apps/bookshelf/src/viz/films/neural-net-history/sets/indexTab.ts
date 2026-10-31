/**
 * neural-net-history — the CHAPTER INDEX TAB (the film's chapter-card device for clue chapters):
 * at a shot's first frame a manila file-divider tab, typed in Special Elite with the chapter title,
 * drops down from the frame's top edge at TOP-LEFT, holds (default 2.5 s) over the picture, and slides
 * back up. Top-left, so it never shares the bottom-left corner with a place or date stamp.
 * Screen-locked: call it last in paint(), after every layer.
 *
 *   indexTab(f.c, { title: 'Clue Three: The Messenger Who Runs Backward', at: 0, hold: 2.5 }, { t, mood })
 *
 * Motion on twos (a paper tab drops; it does not glide): drop 0.5 s with a small settle, slide up 0.5 s.
 */
import type { Palette } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT, legibleSize } from '../../../film/silhouette/type';

export interface IndexTabOpts {
  title: string;
  /** chapter number shown on the tab's ear (optional) */
  number?: number;
  at?: number;
  hold?: number;
  x?: number;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (u: number) => 1 - (1 - u) * (1 - u);

export function indexTab(c: CanvasRenderingContext2D, o: IndexTabOpts, env: { t: number; mood: Palette }) {
  const at = o.at ?? 0;
  const hold = o.hold ?? 2.5;
  const tq = Math.floor(env.t * 12) / 12 - at;
  if (tq < 0 || tq > hold + 1.0) return;
  // drop (0–.5 s, overshoot and settle), hold, slide up (last .5 s)
  let y: number;
  if (tq < 0.5) {
    const u = easeOut(clamp01(tq / 0.42));
    y = -1 + u * 1.06 - (tq > 0.42 ? 0.06 * clamp01((tq - 0.42) / 0.08) : 0);
  } else if (tq < 0.5 + hold) y = 0;
  else y = -easeOut(clamp01((tq - 0.5 - hold) / 0.5));
  const x = o.x ?? 48;
  // the title at the kit's legibility floor (22 px cap height at 1080p): the tab widens to fit it
  const size = legibleSize(c, `400 26px ${FONT.typewriter}`, 26);
  c.save();
  c.font = `400 ${size}px ${FONT.typewriter}`;
  const tw = c.measureText(o.title).width;
  c.restore();
  const W = Math.max(560, Math.min(1180 - x, tw + 64)), H = Math.max(84, size * 3.1);
  const top = y * (H + 40);
  const manila = mixLab(MOODS.parchment.sky[2], '#b08a52', 0.45);
  const ink = MOODS.parchment.ink;
  c.save();
  // soft shadow, the tab body with a rounded ear, a punched hole
  c.fillStyle = withAlpha(env.mood.fg, 0.4);
  c.fillRect(x + 5, top + 6, W, H);
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
  // fibres: a faint darker edge band
  c.fillStyle = withAlpha(ink, 0.08);
  c.fillRect(x, top + H - 10, W, 4);
  // the typed title (Special Elite; struck type, slightly uneven)
  c.fillStyle = withAlpha(ink, 0.88);
  c.font = `400 ${size}px ${FONT.typewriter}`;
  c.textBaseline = 'middle';
  c.fillText(o.title, x + 26, top + H / 2 + 2);
  if (o.number !== undefined) {
    c.font = `400 ${legibleSize(c, `400 16px ${FONT.typewriter}`, 16)}px ${FONT.typewriter}`;
    c.fillStyle = withAlpha(ink, 0.6);
    c.textAlign = 'right';
    c.fillText(String(o.number).padStart(2, '0'), x + W - 16, top + size * 0.7);
  }
  c.restore();
}
