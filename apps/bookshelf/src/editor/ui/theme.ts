/**
 * Film editor: theme tokens and the small formatting helpers every shell panel shares.
 *
 *   C.accent, C.video, …          colour tokens (mirrored as CSS variables on .fe-root in editor.css)
 *   timecode(t, fps)              -> 'HH:MM:SS:FF' (';' at drop-frame rates; frames floor, never round up a second)
 *   parseTimecode('1:02;12', 24)  -> seconds | null   (also '83.5', '83.5s', '2003f', 'MM:SS', 'SS;FF')
 *   snapToFrame(t, fps)           nearest frame boundary
 *   fmtDb(-3.2) -> '-3.2 dB' · dbToGain / gainToDb
 *   QUALITY                       preview quality presets (ui.previewScale)
 *
 * Pure module (no React, no DOM): safe to import from anywhere in the editor.
 */

/** colour tokens: a dark, low-glare Vegas-like chrome with one warm accent for "live" things */
export const C = {
  bg: '#16171a',
  panel: '#1e2024',
  panel2: '#25282d',
  raised: '#2d3036',
  line: '#34383f',
  lineHi: '#454a53',
  text: '#d8dbe0',
  dim: '#8c929c',
  faint: '#5f656e',
  accent: '#f0a53a',
  select: '#3b82d6',
  focus: '#6aa8ff',
  video: '#4d6fa8',
  audio: '#4b8a5e',
  marker: '#e8c547',
  region: '#5aa7a0',
  loop: '#8aa0c8',
  danger: '#e25c4f',
  ok: '#5cbf7a',
} as const;

/** event/track colours for the media kinds (timeline + media pool share these) */
export const KIND_COLOR: Record<'shot' | 'audio' | 'image' | 'video' | 'text' | 'color', string> = {
  shot: '#4d6fa8',
  audio: '#4b8a5e',
  image: '#7a5aa8',
  video: '#3f8fa0',
  text: '#a8834d',
  color: '#8a8f99',
};

/** preview quality presets → ui.previewScale (output scale factor) */
export const QUALITY = [
  { id: 'draft', label: 'Draft', scale: 0.25 },
  { id: 'preview', label: 'Preview', scale: 0.5 },
  { id: 'good', label: 'Good', scale: 0.75 },
  { id: 'best', label: 'Best (Full)', scale: 1 },
] as const;
export type QualityId = (typeof QUALITY)[number]['id'];

/** the preset whose scale is closest to `scale` */
export function qualityOf(scale: number): (typeof QUALITY)[number] {
  let best: (typeof QUALITY)[number] = QUALITY[0];
  for (const q of QUALITY) if (Math.abs(q.scale - scale) < Math.abs(best.scale - scale)) best = q;
  return best;
}

const pad = (n: number, w = 2) => String(n).padStart(w, '0');

/** 'HH:MM:SS:FF' (';' before the frames only at drop-frame rates, 29.97 / 59.94) — the timeline's own formatter,
 *  so the preview, status bar and timeline always read the same */
export { timecode } from './timeline/geometry';

/** compact 'M:SS.s' for durations in lists */
export function shortTime(t: number): string {
  const s = Math.max(0, t);
  if (!Number.isFinite(s)) return '∞';
  const m = Math.floor(s / 60);
  return `${m}:${(s - m * 60).toFixed(1).padStart(4, '0')}`;
}

/**
 * Parse a user-typed time. Accepts:
 *   HH:MM:SS;FF · MM:SS;FF · SS;FF   (Vegas style, ';' before frames)
 *   HH:MM:SS:FF                       (SMPTE non-drop)
 *   HH:MM:SS · MM:SS                  (seconds may carry decimals)
 *   83.5 · 83.5s                      (seconds)
 *   2003f                             (frames)
 * Returns null when the text is not a time.
 */
export function parseTimecode(text: string, fps: number): number | null {
  const s = text.trim().replace(/\s+/g, '');
  if (!s) return null;
  const neg = s.startsWith('-');
  const body = neg ? s.slice(1) : s;
  let v: number | null = null;
  let m: RegExpMatchArray | null;
  if ((m = body.match(/^(\d+)f$/i))) v = Number(m[1]) / fps;
  else if ((m = body.match(/^(\d+(?:\.\d+)?)s?$/i))) v = Number(m[1]);
  else if ((m = body.match(/^(?:(\d+):)?(?:(\d+):)?(\d+)[;](\d+)$/))) {
    // frames form: [[HH:]MM:]SS;FF
    const parts = [m[1], m[2]].filter((x): x is string => x != null).map(Number);
    const [h, mm] = parts.length === 2 ? parts : [0, parts[0] ?? 0];
    v = h * 3600 + mm * 60 + Number(m[3]) + Number(m[4]) / fps;
  } else if ((m = body.match(/^(\d+):(\d+):(\d+):(\d+)$/))) {
    // HH:MM:SS:FF (non-drop SMPTE)
    v = Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / fps;
  } else if ((m = body.match(/^(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)$/))) {
    v = Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
  }
  if (v == null || !Number.isFinite(v)) return null;
  return neg ? -v : v;
}

/** nearest frame boundary */
export const snapToFrame = (t: number, fps: number): number => Math.round(t * fps) / fps;

export const dbToGain = (db: number): number => (db <= -120 ? 0 : 10 ** (db / 20));
export const gainToDb = (g: number): number => (g <= 1e-6 ? -120 : 20 * Math.log10(g));

export function fmtDb(db: number | undefined, digits = 1): string {
  const v = db ?? 0;
  if (v <= -120) return '-inf dB';
  return `${v > 0 ? '+' : ''}${v.toFixed(digits)} dB`;
}

export const fmtPct = (v: number | undefined): string => `${Math.round((v ?? 1) * 100)}%`;

export const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));

