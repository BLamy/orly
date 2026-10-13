/**
 * ch12-s01 — the CHAPTER INDEX TAB set on TWO lines (critic round 1: the one-line 48-character title measured
 * 17.5 px cap at 1080p). Same device as sets/ch03-s01-indexTab.ts (a manila file-divider tab drops from the top
 * edge at top-left, holds, slides back up; motion on twos), but the title is broken into lines and its size is
 * computed from the face's LIVE cap height (measured each call, never cached before the webfont has loaded), so
 * the cap lands at `cap` px on a 1080p frame (default 26).
 *
 *   indexTab2(f.c, { lines: ['The Last Accomplice,', 'and the Return to the Scene'], at: 0.1, hold: 2.5 }, { t, mood })
 */
import type { Palette } from '../../../film/contracts';
import { MOODS, mixLab, withAlpha } from '../../../film/silhouette/palette';
import { FONT } from '../../../film/silhouette/type';

export interface IndexTab2Opts {
  lines: string[];
  at?: number;
  hold?: number;
  x?: number;
  /** cap height at 1080p (screen-locked: 1 stage px = 1.5 px at 1080p) */
  cap?: number;
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const easeOut = (u: number) => 1 - (1 - u) * (1 - u);

/** cap-height / font-size for the typewriter face, measured now */
function capRatio(c: CanvasRenderingContext2D): number {
  c.save();
  c.font = `400 100px ${FONT.typewriter}`;
  const m = c.measureText('H');
  c.restore();
  return m.actualBoundingBoxAscent > 1 ? m.actualBoundingBoxAscent / 100 : 0.6;
}

export function indexTab2(c: CanvasRenderingContext2D, o: IndexTab2Opts, env: { t: number; mood: Palette }) {
  const at = o.at ?? 0;
  const hold = o.hold ?? 2.5;
  const tq = Math.floor(env.t * 12) / 12 - at;
  if (tq < 0 || tq > hold + 1.0) return;
  const r = capRatio(c);
  const capStage = (o.cap ?? 26) / 1.5;
  const size = Math.ceil((capStage / r) * 10) / 10;
  const lead = Math.round(size * 1.22);
  const x = o.x ?? 48;
  c.save();
  c.font = `400 ${size}px ${FONT.typewriter}`;
  let tw = 0;
  for (const l of o.lines) tw = Math.max(tw, c.measureText(l).width);
  c.restore();
  const padX = 30;
  const first = 26 + Math.round(capStage); // first baseline below the tab's top edge
  const W = Math.round(tw + padX * 2 + 24);
  const H = first + lead * (o.lines.length - 1) + 22;
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
  c.arc(x + W - 22, top + 16, 4, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = withAlpha(ink, 0.9);
  c.font = `400 ${size}px ${FONT.typewriter}`;
  c.textBaseline = 'alphabetic';
  o.lines.forEach((l, i) => c.fillText(l, x + padX + (i > 0 ? 14 : 0), top + first + i * lead));
  c.restore();
}
