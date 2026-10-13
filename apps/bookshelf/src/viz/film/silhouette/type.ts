/**
 * Film typography (style bible §7). Self-hosted Google Fonts (public/fonts/film/fonts.css).
 * Canvas painters in STAGE px (1280x720, screen-locked: paint after the layers). Every card
 * has its own envelope: `at` (start, shot-local s), `dur` (on-screen time incl. fades;
 * default: stays), `fade` (s). Sizes respect the 26 px @1080p floor (≥ 17.4 stage px).
 *
 *   await loadFilmFonts()                       inject fonts.css (if missing) + document.fonts.load(FILM_FONTS)
 *   FILM_FONTS / FONT                           preload specs / family names
 *   titleCard(c, { title, subtitle?, kicker?, backlit? }, env)       film title: Cormorant 600 + fleuron rule
 *   chapterCard(c, { number, title, dates?, label? }, env)           "CHAPTER III" + rules + title
 *   placeStamp(c, { place, date, year?, style? }, env)               era-adaptive type-on stamp, bottom-left
 *        style auto from year: < 1970 typewriter (Special Elite) · < 1990 phosphor (VT323) · else mono (Plex)
 *   nameCard(c, { name, role, years? }, env)                         lower third, 3.5 s default
 *   quoteCard(c, { quote, speaker, source? }, env)                   verbatim quote, ≤ 42 chars/line
 *   annotation(c, { text, x, y, tx, ty, sub?, onParchment? }, env)   label + leader line to (x,y)
 *   rule(c, x, y, w, { ornament, color, grow }) · fleuron(c, x, y, size, color) · roman(n)
 *   envelope(t, at, dur, fade) -> 0..1 · drawTracked(c, text, x, y, { font, size, tracking, align })
 * env: anything with { t, mood } (a PaintEnv works). Colours come from the mood: titles in
 * `core`, body in warm parchment, ink on parchment plates.
 *
 * LEGIBILITY FLOOR (review round 1, kit-wide): any text the viewer must read has a CAP HEIGHT of at least
 * MIN_CAP_1080 = 22 px on a 1080p frame (measured on the glyphs, so small caps count at their small-cap height).
 *   legibleSize(c, font, size, text?) -> the font size (current user units) that meets the floor under the current
 *                                        transform (camera/layer scale included); every card below uses it
 *   capPx1080(c, font, text?)         -> the cap height that font would have on a 1080p frame (for checks)
 * Shot code that sets its own fonts for readable text should size them with legibleSize (or push in until the
 * card is the subject); decorative texture text (newspaper columns, ledger scribble) is exempt.
 * `generator/film/legibility.mjs` audits every fillText in a shot and lists text under the floor.
 *
 * CARD ENTRY CARRIES ITS TEXT (review round 3: paper cards showed blank for 0.5-2 s before their text inked, which
 * read as placeholder frames). A card's first line is inked within CARD_INK_FRAMES (3) frames of the paper passing
 * CARD_PAPER_LIMIT (30 %) opacity, or card and text fade together. Every paper card a shot paints goes through:
 *   cardPaperAlpha(t, inkAt, fade?)  -> 0..1  the paper's opacity for a card whose first line inks at `inkAt`
 *                                             (passes 30 % two frames before it; fades in over `fade`, default 0.35)
 *   cardFirstInkAt(paperStart, fade?) -> s   the latest time the first line may start inking for a paper fade that
 *                                             starts at paperStart (for cards whose paper timing is fixed)
 *   cardInkAlpha(t, inkAt, dur?)     -> 0..1  the first line's ink, fully up CARD_INK_FRAMES after inkAt
 *   cardProbe(c, id, x, y, w, h, paper, ink)  report the card to the QA (no-op outside the audit): rect in current
 *                                             user units, paper and ink opacity before globalAlpha
 * `generator/film/cards.mjs` flags any card whose paper is over 50 % opaque while its text is under 20 % for more than
 * 0.3 s (QA sheets.cards): probed cards FAIL, unprobed light paper rects found by its recorder WARN.
 *
 * NO GHOST TEXT (review round 4: crossfades left two text layers readable on top of each other: ch15-s10 8.50 and
 * 14.58, ch15-s06 2.67, ch14-s07 8.8-12.8). When one text card REPLACES another, the outgoing text is at 0 within
 * TEXT_SWAP_FRAMES (4) frames of the incoming text passing 30 %:
 *   textSwapIn(t, inAt, fade?)    -> 0..1  the incoming text (smoothstep over `fade`, default 0.35 s, from inAt)
 *   textSwapOut(t, inAt, fade?)   -> 0..1  the outgoing text: 1 until inAt, 0 four frames after the incoming passes 30 %
 *   textSwap(t, inAt, fade?)      -> { in, out }
 *   textProbe(c, id, x, y, w, h, alpha)   report a text layer to the ghost audit (no-op outside it; cardProbe reports
 *                                         its card's ink as a text layer too)
 *   ghostOk(c, fn)                 text drawn inside fn may overlap other text on purpose (a rubber stamp struck
 *                                  across a card); the audit skips it
 * `generator/film/cards.mjs` also records every non-texture text line (fillText/strokeText, merged per line) and every
 * textProbe, and FAILS (QA sheets.ghostText) two different text layers whose boxes overlap (>= 20 % of the smaller)
 * while both are above GHOST_TEXT_ALPHA (25 %) for more than 0.25 s.
 */
import type { Palette } from '../contracts';
import { hash1 } from './atmosphere';
import { mixLab, withAlpha } from './palette';

export interface TypeEnv {
  t: number;
  mood: Palette;
  seed?: number;
}

export const FONT = {
  display: '"Cormorant Garamond"',
  sc: '"Cormorant SC"',
  text: '"EB Garamond"',
  typewriter: '"Special Elite"',
  phosphor: '"VT323"',
  mono: '"IBM Plex Mono"',
  fell: '"IM Fell English"',
  fellSC: '"IM Fell English SC"',
} as const;

/** exact weight/style specs to preload (canvas fillText does not wait for webfonts) */
export const FILM_FONTS: string[] = [
  `600 64px ${FONT.display}`,
  `700 64px ${FONT.display}`,
  `italic 500 32px ${FONT.display}`,
  `italic 600 32px ${FONT.display}`,
  `500 24px ${FONT.sc}`,
  `600 24px ${FONT.sc}`,
  `400 24px ${FONT.text}`,
  `500 24px ${FONT.text}`,
  `italic 400 24px ${FONT.text}`,
  `400 24px ${FONT.typewriter}`,
  `400 24px ${FONT.phosphor}`,
  `400 24px ${FONT.mono}`,
  `500 24px ${FONT.mono}`,
  `400 24px ${FONT.fell}`,
  `italic 400 24px ${FONT.fell}`,
  `400 24px ${FONT.fellSC}`,
];

const BASE = (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
let fontsPromise: Promise<void> | null = null;
/** Inject the stylesheet if needed and load every face (latin + latin-ext). Idempotent. */
export function loadFilmFonts(base = BASE): Promise<void> {
  if (fontsPromise) return fontsPromise;
  fontsPromise = (async () => {
    if (typeof document === 'undefined') return;
    const href = `${base.replace(/\/?$/, '/')}fonts/film/fonts.css`;
    const has = [...document.querySelectorAll('link[rel="stylesheet"]')].some((l) => (l as HTMLLinkElement).href.includes('fonts/film/fonts.css'));
    if (!has) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      await new Promise<void>((res) => {
        link.onload = () => res();
        link.onerror = () => res();
        document.head.appendChild(link);
      });
    }
    await Promise.all(FILM_FONTS.flatMap((s) => [document.fonts.load(s), document.fonts.load(s, 'ĄŁŐŞ')]));
    await document.fonts.ready;
  })();
  return fontsPromise;
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const smooth = (x: number) => {
  const u = clamp01(x);
  return u * u * (3 - 2 * u);
};
/** 0..1 visibility of a card shown from `at` for `dur` seconds with `fade` in/out */
export function envelope(t: number, at = 0, dur = Infinity, fade = 0.5): number {
  if (t < at) return 0;
  const fi = fade > 0 ? smooth((t - at) / fade) : 1;
  const fo = Number.isFinite(dur) && fade > 0 ? smooth((at + dur - t) / fade) : t <= at + dur ? 1 : 0;
  return Math.min(fi, fo);
}
// ---------------------------------------------------------------------------
// card entry (review round 3): the paper never shows without its first line
// ---------------------------------------------------------------------------
export const CARD_INK_FRAMES = 3;
export const CARD_PAPER_LIMIT = 0.3;
const FILM_FPS = 24;
/** smoothstep u where it crosses CARD_PAPER_LIMIT (0.3): u^2 (3 - 2u) = 0.3 */
const U30 = 0.37353;
/** the paper's opacity for a card whose first line starts inking at `inkAt`: it passes 30 % two frames before */
export function cardPaperAlpha(t: number, inkAt: number, fade = 0.35): number {
  const start = inkAt - 2 / FILM_FPS - U30 * fade;
  return smooth((t - start) / Math.max(1e-3, fade));
}
/** the latest start of the first line's ink for a paper fade that starts at `paperStart` and lasts `fade` */
export function cardFirstInkAt(paperStart: number, fade = 0.35): number {
  return paperStart + U30 * fade + (CARD_INK_FRAMES - 1) / FILM_FPS;
}
/** the first line's ink: up over CARD_INK_FRAMES frames (or `dur`) from `inkAt` */
export function cardInkAlpha(t: number, inkAt: number, dur = CARD_INK_FRAMES / FILM_FPS): number {
  return smooth((t - inkAt) / Math.max(1e-3, dur));
}
type CardRec = { id: string; x: number; y: number; w: number; h: number; paper: number; ink: number };
/** report a paper card to the card audit (generator/film/cards.mjs sets globalThis.__cardRec while it records) */
export function cardProbe(c: CanvasRenderingContext2D, id: string, x: number, y: number, w: number, h: number, paper: number, ink: number): void {
  const rec = (globalThis as unknown as { __cardRec?: CardRec[] | null }).__cardRec;
  if (!rec) return;
  const m = c.getTransform();
  const pts = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const ga = c.globalAlpha;
  rec.push({ id, x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys), paper: paper * ga, ink: ink * ga });
}
// ---------------------------------------------------------------------------
// text swaps (review round 4): no ghost text
// ---------------------------------------------------------------------------
export const TEXT_SWAP_FRAMES = 4;
export const GHOST_TEXT_ALPHA = 0.25;
/** the incoming text of a swap: up over `fade` from inAt */
export function textSwapIn(t: number, inAt: number, fade = 0.35): number {
  return smooth((t - inAt) / Math.max(1e-3, fade));
}
/** the outgoing text of a swap: 1 until inAt, 0 TEXT_SWAP_FRAMES frames after the incoming text passes 30 % */
export function textSwapOut(t: number, inAt: number, fade = 0.35): number {
  const span = U30 * Math.max(1e-3, fade) + TEXT_SWAP_FRAMES / FILM_FPS;
  return 1 - smooth((t - inAt) / span);
}
export function textSwap(t: number, inAt: number, fade = 0.35): { in: number; out: number } {
  return { in: textSwapIn(t, inAt, fade), out: textSwapOut(t, inAt, fade) };
}
type TextRec = { id: string; x: number; y: number; w: number; h: number; alpha: number };
/** report a text layer (rect in current user units, alpha before globalAlpha) to the ghost-text audit */
export function textProbe(c: CanvasRenderingContext2D, id: string, x: number, y: number, w: number, h: number, alpha: number): void {
  const rec = (globalThis as unknown as { __textRec?: TextRec[] | null }).__textRec;
  if (!rec) return;
  const m = c.getTransform();
  const pts = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ].map(([px, py]) => [m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  rec.push({ id, x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys), alpha: alpha * c.globalAlpha });
}
/** text drawn inside fn overlaps other text on purpose (a stamp struck across a card): the ghost audit skips it */
export function ghostOk<T>(c: CanvasRenderingContext2D, fn: () => T): T {
  const cc = c as CanvasRenderingContext2D & { __ghostOk?: boolean };
  const prev = cc.__ghostOk;
  cc.__ghostOk = true;
  try {
    return fn();
  } finally {
    cc.__ghostOk = prev;
  }
}
/** local progress of a sub-step [a, b] seconds after `at` */
const step = (t: number, at: number, a: number, b: number) => smooth((t - at - a) / (b - a));
function devScale(c: CanvasRenderingContext2D) {
  const m = c.getTransform();
  return Math.max(0.25, Math.hypot(m.a, m.b));
}

// ---------------------------------------------------------------------------
// legibility floor
// ---------------------------------------------------------------------------
export const MIN_CAP_1080 = 22;
// ---------------------------------------------------------------------------
// TEXT ROLES (review round 2): every piece of text is 'subject' (named in the narration, or meant to be read: it
// must reach MIN_CAP_1080 while it is the subject) or 'texture' (shelf sleeves, ledger scribble, newspaper columns:
// read as pattern, exempt). The legibility audit (generator/film/legibility.mjs) reads the role a draw was made under;
// with no explicit role it classifies the text itself (script onScreenText, or words the narrator says while it is
// visible). The kit's cards are 'subject'. Wrap texture in textRole(c, 'texture', () => ...), and wrap a shot's own
// subject text in textRole(c, 'subject', ...) so the audit fails it when it is small.
export type TextRole = 'subject' | 'texture';
export function textRole<T>(c: CanvasRenderingContext2D, role: TextRole, fn: () => T): T {
  const cc = c as CanvasRenderingContext2D & { __textRole?: TextRole };
  const prev = cc.__textRole;
  cc.__textRole = role;
  try {
    return fn();
  } finally {
    cc.__textRole = prev;
  }
}
let FRAME_PX = 1.5; // device px per stage px of the frame being painted (the reel sets it; 1.5 = 1920x1080)
/** the reel tells the type kit how big the output frame is (device px per stage px) */
export function setTypeFrameScale(pxScale: number): void {
  if (pxScale > 0) FRAME_PX = pxScale;
}
const capCache = new Map<string, number>();
const isSmallCaps = (font: string, text: string) => /\bSC"|SC\b/.test(font) && /[a-z]/.test(text);
/** cap height / font size for this face (small-cap height when an SC face sets lower-case text) */
function capRatio(c: CanvasRenderingContext2D, font: string, text: string): number {
  const sample = isSmallCaps(font, text) ? 'h' : 'H';
  const f100 = font.replace(/\d+(\.\d+)?px/, '100px');
  const key = `${f100}|${sample}`;
  let r = capCache.get(key);
  if (r == null) {
    c.save();
    c.font = f100;
    // measured on the alphabetic baseline: actualBoundingBoxAscent is relative to the CURRENT textBaseline, so a
    // context left at 'top' or 'middle' by the caller cached a wrong ratio for the whole film (review round 2:
    // index tabs drawn at 19 px cap after ch01-s04 measured the typewriter face under another baseline)
    c.textBaseline = 'alphabetic';
    const m = c.measureText(sample);
    c.restore();
    r = m.actualBoundingBoxAscent > 1 ? m.actualBoundingBoxAscent / 100 : 0.68;
    // cache only once the face itself is available: before a web font is first requested, fonts.status is
    // 'loaded' and measureText runs on the FALLBACK face (a taller cap ratio), which pinned titles under the floor
    // (review round 2 legibility audit: Special Elite index tabs at 19 px cap)
    let ready = true;
    if (typeof document !== 'undefined' && document.fonts) {
      try {
        ready = document.fonts.status !== 'loading' && document.fonts.check(f100);
        if (!ready) void document.fonts.load(f100).catch(() => undefined);
      } catch {
        ready = true;
      }
    }
    if (ready) capCache.set(key, r);
  }
  return r;
}
/** 1080p pixels per current user unit (camera and layer transforms included) */
const px1080 = (c: CanvasRenderingContext2D) => (devScale(c) * 1.5) / FRAME_PX;
const fontSize = (font: string) => Number(/(\d+(?:\.\d+)?)px/.exec(font)?.[1] ?? 16);
export function capPx1080(c: CanvasRenderingContext2D, font: string, text = 'H'): number {
  return fontSize(font) * capRatio(c, font, text) * px1080(c);
}
export function legibleSize(c: CanvasRenderingContext2D, font: string, size: number, text = 'H'): number {
  const need = MIN_CAP_1080 / (capRatio(c, font, text) * px1080(c));
  return Math.max(size, Math.ceil(need * 10) / 10);
}
/** `font` with its px size raised to the legibility floor: [font, size] */
export function legibleFont(c: CanvasRenderingContext2D, font: string, text = 'H'): [string, number] {
  const sz = legibleSize(c, font, fontSize(font), text);
  return [font.replace(/\d+(\.\d+)?px/, `${sz}px`), sz];
}
export const roman = (n: number): string => {
  const R: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let s = '';
  for (const [v, r] of R) while (n >= v) (s += r), (n -= v);
  return s;
};

export interface TrackedOpts {
  font: string;
  /** letter-spacing in em */
  tracking?: number;
  size: number;
  align?: 'left' | 'center' | 'right';
}
/** width of tracked text (without the trailing letter-space) */
export function measureTracked(c: CanvasRenderingContext2D, text: string, o: TrackedOpts): number {
  c.save();
  c.font = o.font;
  const ls = (o.tracking ?? 0) * o.size;
  c.letterSpacing = `${ls}px`;
  const w = c.measureText(text).width - (text.length ? ls : 0);
  c.restore();
  return w;
}
/** fillText with tracking and correct centring; returns the drawn width */
export function drawTracked(c: CanvasRenderingContext2D, text: string, x: number, y: number, o: TrackedOpts): number {
  const ls = (o.tracking ?? 0) * o.size;
  c.font = o.font;
  c.letterSpacing = `${ls}px`;
  const w = c.measureText(text).width - (text.length ? ls : 0);
  const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  c.textAlign = 'left';
  c.fillText(text, x0, y);
  c.letterSpacing = '0px';
  return w;
}
/** greedy wrap by measured width and an optional character cap per line */
export function wrapLines(c: CanvasRenderingContext2D, text: string, font: string, maxW: number, maxChars = 999): string[] {
  c.save();
  c.font = font;
  c.letterSpacing = '0px';
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? cur + ' ' + w : w;
    if (cur && (c.measureText(next).width > maxW || next.length > maxChars)) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  c.restore();
  // avoid a lone widow word on the last line
  if (lines.length > 1 && !lines[lines.length - 1].includes(' ')) {
    const prev = lines[lines.length - 2].split(' ');
    if (prev.length > 2) {
      lines[lines.length - 1] = prev.pop() + ' ' + lines[lines.length - 1];
      lines[lines.length - 2] = prev.join(' ');
    }
  }
  return lines;
}
/** cut-paper lift: soft ink shadow 0/3/6 px @1080p, α 0.5 */
function lift(c: CanvasRenderingContext2D, mood: Palette, a = 0.5) {
  const ds = devScale(c) / 1.5;
  c.shadowColor = withAlpha(mood.ink, a);
  c.shadowOffsetX = 0;
  c.shadowOffsetY = 3 * ds;
  c.shadowBlur = 6 * ds;
}
function noShadow(c: CanvasRenderingContext2D) {
  c.shadowColor = 'rgba(0,0,0,0)';
  c.shadowBlur = 0;
  c.shadowOffsetY = 0;
}
const PARCHMENT_TEXT = '#efe3cf';
/**
 * A feathered ink plate behind text (bible §7: text sits on the L0 gradient or a 0.55 α ink
 * plate). Elliptical falloff on every side, so it never reads as a box.
 */
export function softPlate(c: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, ink: string, alpha = 0.55): void {
  c.save();
  c.translate(cx, cy);
  c.scale(w / h, 1);
  const r = h / 2;
  const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, withAlpha(ink, alpha));
  g.addColorStop(0.45, withAlpha(ink, alpha * 0.82));
  g.addColorStop(0.75, withAlpha(ink, alpha * 0.35));
  g.addColorStop(1, withAlpha(ink, 0));
  c.fillStyle = g;
  c.fillRect(-r, -r, r * 2, r * 2);
  c.restore();
}
const isPlate = (m: Palette) => m.id.startsWith('parchment');
/** body text colour for a mood: warm parchment on dark, ink on parchment plates */
export const textColor = (m: Palette) => (isPlate(m) ? m.ink : mixLab(PARCHMENT_TEXT, m.core, 0.2));
/** accent (titles, names): `core` on dark, deep ink on plates */
export const titleColor = (m: Palette) => (isPlate(m) ? m.ink : m.core);

// ---------------------------------------------------------------------------
// ornaments
// ---------------------------------------------------------------------------
/**
 * An engraved hedera leaf (aldus fleuron) at x,y pointing along +x (dir 1) or -x (dir -1);
 * size ≈ leaf length in px. The stem curls back from the notch; a fine vein is cut through it.
 */
export function fleuron(c: CanvasRenderingContext2D, x: number, y: number, size: number, col: string, dir: 1 | -1 = 1): void {
  const s = size / 20;
  c.save();
  c.translate(x, y);
  c.scale(s * dir, s);
  c.fillStyle = col;
  c.beginPath();
  // heart: notch at x=-6, tip at x=+11, lobes swell to |y| ≈ 7
  c.moveTo(-6, 0);
  c.bezierCurveTo(-10.5, -3.5, -9, -9.5, -3, -8.2);
  c.bezierCurveTo(2.5, -7, 7, -3.4, 11, 0);
  c.bezierCurveTo(7, 3.4, 2.5, 7, -3, 8.2);
  c.bezierCurveTo(-9, 9.5, -10.5, 3.5, -6, 0);
  c.closePath();
  // vein: a tapering cut from the notch toward the tip
  c.moveTo(-4.6, -0.5);
  c.quadraticCurveTo(2, -0.9, 8, 0);
  c.quadraticCurveTo(2, 0.4, -4.6, 0.5);
  c.closePath();
  c.fill('evenodd');
  // stem curling back toward the centre
  c.strokeStyle = col;
  c.lineWidth = 1.2;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(-6, 0);
  c.bezierCurveTo(-9, 0.5, -12, 3.5, -10.5, 6);
  c.bezierCurveTo(-9.5, 7.6, -7.4, 7, -7.6, 5.4);
  c.stroke();
  c.restore();
}
export interface RuleOpts {
  color: string;
  ornament?: 'fleuron' | 'diamond' | 'none';
  /** 0..1: the rule draws outward from the centre */
  grow?: number;
  /** hairline weight at the centre, stage px (default 1.1) */
  weight?: number;
  alpha?: number;
}
/** tapered engraved hairline centred on x, total width w, with a central ornament */
export function rule(c: CanvasRenderingContext2D, x: number, y: number, w: number, o: RuleOpts): void {
  const g = clamp01(o.grow ?? 1);
  if (g <= 0) return;
  const orn = o.ornament ?? 'diamond';
  const gap = orn === 'none' ? 0 : orn === 'fleuron' ? 30 : 13;
  const half = (w / 2) * g;
  const wt = o.weight ?? 1.1;
  c.save();
  c.globalAlpha *= o.alpha ?? 1;
  c.fillStyle = o.color;
  if (half > gap) {
    for (const d of [-1, 1]) {
      // lens-shaped taper: thick near the ornament, vanishing at the tip
      const x0 = x + d * gap;
      const x1 = x + d * half;
      c.beginPath();
      c.moveTo(x0, y - wt / 2);
      c.quadraticCurveTo((x0 + x1) / 2, y - wt * 0.35, x1, y);
      c.quadraticCurveTo((x0 + x1) / 2, y + wt * 0.35, x0, y + wt / 2);
      c.closePath();
      c.fill();
      // small terminal dots
      if (g > 0.95) {
        c.beginPath();
        c.arc(x + d * (half + 5), y, 1.1, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
  const oa = smooth((g - 0.15) / 0.4);
  if (oa > 0) {
    c.globalAlpha *= oa;
    if (orn === 'diamond') {
      c.beginPath();
      c.moveTo(x, y - 4.2);
      c.lineTo(x + 4.2, y);
      c.lineTo(x, y + 4.2);
      c.lineTo(x - 4.2, y);
      c.closePath();
      c.fill();
      for (const d of [-1, 1]) {
        c.beginPath();
        c.arc(x + d * 8, y, 1.3, 0, Math.PI * 2);
        c.fill();
      }
    } else if (orn === 'fleuron') {
      // two hedera leaves back to back, stems meeting at a centre dot
      fleuron(c, x - 14, y, 18, o.color, -1);
      fleuron(c, x + 14, y, 18, o.color, 1);
      c.beginPath();
      c.arc(x, y, 1.6, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// title card
// ---------------------------------------------------------------------------
export interface TitleCardOpts {
  title: string;
  subtitle?: string;
  /** small-caps line above the title (e.g. "a film in six chapters") */
  kicker?: string;
  x?: number;
  y?: number;
  /** title size, stage px (default 68 ≈ 102 px @1080p) */
  size?: number;
  at?: number;
  dur?: number;
  fade?: number;
  /** letters cut out of an ink card covering the frame: the scene's backlight shows through */
  backlit?: boolean;
  /** max title width before wrapping (default 1000) */
  maxWidth?: number;
}
const backlitCache = new Map<string, HTMLCanvasElement>();
function titleCardPaint(c: CanvasRenderingContext2D, o: TitleCardOpts, env: TypeEnv): void {
  const at = o.at ?? 0;
  const A = envelope(env.t, at, o.dur, o.fade ?? 0.8);
  if (A <= 0) return;
  const x = o.x ?? 640;
  const y = o.y ?? 340;
  const size = o.size ?? 68;
  const m = env.mood;
  const tFont = `600 ${size}px ${FONT.display}`;
  const lines = wrapLines(c, o.title, tFont, o.maxWidth ?? 1000);
  const lh = size * 1.02;
  const top = y - ((lines.length - 1) * lh) / 2;
  if (o.backlit) {
    backlitTitle(c, o, env, lines, top, lh, A);
    return;
  }
  const tc = titleColor(m);
  c.save();
  if (o.kicker) {
    c.globalAlpha = A * 0.8 * step(env.t, at, 0, 0.8);
    c.fillStyle = textColor(m);
    drawTracked(c, o.kicker.toLowerCase(), x, top - size * 0.95, { font: `500 ${Math.max(20, size * 0.32)}px ${FONT.sc}`, size: Math.max(20, size * 0.32), tracking: 0.3, align: 'center' });
  }
  const k = step(env.t, at, 0.2, 1.2);
  c.globalAlpha = A * k;
  c.fillStyle = tc;
  lift(c, m);
  lines.forEach((ln, i) => drawTracked(c, ln, x, top + i * lh + (1 - k) * 6, { font: tFont, size, tracking: 2 / size, align: 'center' }));
  noShadow(c);
  const ry = top + (lines.length - 1) * lh + size * 0.48;
  c.globalAlpha = A;
  rule(c, x, ry, Math.min(560, size * 7), { color: tc, ornament: 'fleuron', grow: step(env.t, at, 0.7, 1.7), alpha: 0.85 });
  if (o.subtitle) {
    const ss = Math.max(22, size * 0.42);
    c.globalAlpha = A * step(env.t, at, 1.1, 1.9);
    c.fillStyle = textColor(m);
    lift(c, m, 0.4);
    drawTracked(c, o.subtitle, x, ry + ss * 1.75, { font: `italic 500 ${ss}px ${FONT.display}`, size: ss, tracking: 0.02, align: 'center' });
    noShadow(c);
  }
  c.restore();
}
function backlitTitle(c: CanvasRenderingContext2D, o: TitleCardOpts, env: TypeEnv, lines: string[], top: number, lh: number, A: number) {
  const ds = devScale(c);
  const size = o.size ?? 68;
  const x = o.x ?? 640;
  const key = `${lines.join('|')}|${o.subtitle ?? ''}|${size}|${x}|${top}|${ds.toFixed(2)}|${env.mood.ink}`;
  let cv = backlitCache.get(key);
  if (!cv) {
    cv = document.createElement('canvas');
    cv.width = Math.ceil(1280 * ds);
    cv.height = Math.ceil(720 * ds);
    const g = cv.getContext('2d')!;
    g.setTransform(ds, 0, 0, ds, 0, 0);
    g.fillStyle = env.mood.ink;
    g.fillRect(0, 0, 1280, 720);
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000';
    const tFont = `700 ${size * 1.15}px ${FONT.display}`;
    lines.forEach((ln, i) => drawTracked(g, ln, x, top + i * lh * 1.12, { font: tFont, size: size * 1.15, tracking: 3 / size, align: 'center' }));
    const ry = top + (lines.length - 1) * lh * 1.12 + size * 0.55;
    rule(g, x, ry, Math.min(620, size * 7.5), { color: '#000', ornament: 'fleuron', weight: 2 });
    if (o.subtitle) {
      const ss = Math.max(24, size * 0.44);
      drawTracked(g, o.subtitle, x, ry + ss * 1.8, { font: `italic 600 ${ss}px ${FONT.display}`, size: ss, tracking: 0.03, align: 'center' });
    }
    backlitCache.set(key, cv);
    if (backlitCache.size > 8) backlitCache.delete(backlitCache.keys().next().value!);
  }
  c.save();
  c.globalAlpha = A;
  c.drawImage(cv, 0, 0, 1280, 720);
  c.restore();
}

// ---------------------------------------------------------------------------
// chapter card
// ---------------------------------------------------------------------------
export interface ChapterCardOpts {
  number: number;
  title: string;
  /** small caps under the title, e.g. "1943 – 1958" */
  dates?: string;
  /** default "Chapter" */
  label?: string;
  x?: number;
  y?: number;
  size?: number;
  at?: number;
  dur?: number;
  fade?: number;
}
function chapterCardPaint(c: CanvasRenderingContext2D, o: ChapterCardOpts, env: TypeEnv): void {
  const at = o.at ?? 0;
  const A = envelope(env.t, at, o.dur, o.fade ?? 0.8);
  if (A <= 0) return;
  const m = env.mood;
  const x = o.x ?? 640;
  const y = o.y ?? 360;
  const size = o.size ?? 60;
  const tc = titleColor(m);
  const lab = `${o.label ?? 'Chapter'} ${roman(o.number)}`.toLowerCase(); // all small caps
  const labSize = legibleSize(c, `500 23px ${FONT.sc}`, 23, lab);
  c.save();
  // label
  c.globalAlpha = A * 0.82 * step(env.t, at, 0, 0.9);
  c.fillStyle = textColor(m);
  drawTracked(c, lab, x, y - size * 1.05, { font: `500 ${labSize}px ${FONT.sc}`, size: labSize, tracking: 0.25, align: 'center' });
  // upper rule
  c.globalAlpha = A;
  rule(c, x, y - size * 0.72, 300, { color: tc, ornament: 'diamond', grow: step(env.t, at, 0.4, 1.4), alpha: 0.75 });
  // title
  const tFont = `600 ${size}px ${FONT.display}`;
  const lines = wrapLines(c, o.title, tFont, 980);
  const k = step(env.t, at, 0.6, 1.6);
  c.globalAlpha = A * k;
  c.fillStyle = tc;
  lift(c, m);
  lines.forEach((ln, i) => drawTracked(c, ln, x, y + size * 0.15 + i * size * 1.05 + (1 - k) * 6, { font: tFont, size, tracking: 1.5 / size, align: 'center' }));
  noShadow(c);
  const below = y + size * 0.15 + (lines.length - 1) * size * 1.05;
  c.globalAlpha = A;
  rule(c, x, below + size * 0.5, 180, { color: tc, ornament: 'none', grow: step(env.t, at, 1.0, 1.9), alpha: 0.6 });
  if (o.dates) {
    c.globalAlpha = A * 0.8 * step(env.t, at, 1.3, 2.1);
    c.fillStyle = textColor(m);
    drawTracked(c, o.dates.toLowerCase(), x, below + size * 0.5 + 34, { font: `500 ${labSize}px ${FONT.sc}`, size: labSize, tracking: 0.2, align: 'center' });
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// place / date stamp
// ---------------------------------------------------------------------------
export type StampStyle = 'typewriter' | 'phosphor' | 'mono';
export interface PlaceStampOpts {
  place: string;
  date: string;
  /** chooses the era typeface when style is omitted */
  year?: number;
  style?: StampStyle;
  x?: number;
  y?: number;
  align?: 'left' | 'right';
  at?: number;
  dur?: number;
  fade?: number;
  /** characters per second for the type-on (default 16; 0 = no type-on) */
  cps?: number;
  /** feathered ink plate behind the stamp (default true) */
  plate?: boolean;
}
export const stampStyleFor = (year?: number): StampStyle => (year === undefined || year < 1970 ? 'typewriter' : year < 1990 ? 'phosphor' : 'mono');
function placeStampPaint(c: CanvasRenderingContext2D, o: PlaceStampOpts, env: TypeEnv): void {
  const at = o.at ?? 0;
  const A = envelope(env.t, at, o.dur, o.fade ?? 0.5);
  if (A <= 0) return;
  const style = o.style ?? stampStyleFor(o.year);
  const m = env.mood;
  const text = `${o.place} · ${o.date}`.toUpperCase();
  const x = o.x ?? 48;
  const y = o.y ?? 672;
  const cps = o.cps ?? 16;
  const tq = Math.floor(env.t * 12) / 12; // type on the twos
  const shown = cps > 0 ? Math.max(0, Math.min(text.length, Math.floor((tq - at) * cps + 1e-6))) : text.length;
  const seed = env.seed ?? 1;
  c.save();
  c.textBaseline = 'alphabetic';
  if (o.plate !== false && !isPlate(m)) {
    const sz = style === 'phosphor' ? legibleSize(c, `400 26px ${FONT.phosphor}`, 26) : style === 'typewriter' ? legibleSize(c, `400 21px ${FONT.typewriter}`, 21) : legibleSize(c, `500 18.5px ${FONT.mono}`, 18.5);
    const estW = text.length * sz * (style === 'mono' ? 0.68 : 0.62);
    c.globalAlpha = A;
    softPlate(c, o.align === 'right' ? x - estW / 2 : x + estW / 2, y - sz * 0.35, estW + 160, sz + 70, m.ink, 0.5);
  }
  if (style === 'typewriter') {
    const size = legibleSize(c, `400 21px ${FONT.typewriter}`, 21);
    c.font = `400 ${size}px ${FONT.typewriter}`;
    c.letterSpacing = '0px';
    const adv = c.measureText('M').width * 1.02; // Special Elite is monospaced
    const total = adv * text.length;
    const x0 = o.align === 'right' ? x - total : x;
    const col = textColor(m);
    for (let i = 0; i < shown; i++) {
      const ch = text[i];
      if (ch === ' ') continue;
      // struck type: each key lands a little differently (seeded, static)
      const ink = 0.72 + 0.28 * hash1(i, seed + 41);
      const dy = (hash1(i, seed + 42) - 0.5) * 1.2;
      const rot = (hash1(i, seed + 43) - 0.5) * 0.025;
      const strike = i === shown - 1 && cps > 0 && tq - at < text.length / cps + 0.1 ? 1.15 : 1; // fresh strike is darker
      c.save();
      c.translate(x0 + i * adv + adv / 2, y + dy);
      c.rotate(rot);
      c.globalAlpha = A * 0.88 * Math.min(1, ink * strike);
      c.fillStyle = col;
      c.textAlign = 'center';
      c.fillText(ch, 0, 0);
      c.restore();
    }
  } else if (style === 'phosphor') {
    const size = legibleSize(c, `400 26px ${FONT.phosphor}`, 26);
    const P = '#dee0a5'; // labGreen core: the phosphor is its own light source
    const font = `400 ${size}px ${FONT.phosphor}`;
    c.font = font;
    const adv = c.measureText('M').width;
    const x0 = o.align === 'right' ? x - adv * text.length : x;
    c.globalAlpha = A * 0.95;
    c.fillStyle = P;
    c.shadowColor = withAlpha(P, 0.8);
    c.shadowBlur = 1.5 * devScale(c);
    c.fillText(text.slice(0, shown), x0, y);
    noShadow(c);
    const typing = shown < text.length;
    const blinkOn = Math.floor(env.t * 2.2) % 2 === 0;
    if (typing || (blinkOn && env.t - at < text.length / Math.max(1, cps) + 2.5)) {
      c.globalAlpha = A * 0.85;
      c.fillRect(x0 + shown * adv + 2, y - size * 0.62, adv * 0.75, size * 0.72);
    }
  } else {
    const size = legibleSize(c, `500 18.5px ${FONT.mono}`, 18.5);
    const k = step(env.t, at, 0, 0.6);
    c.globalAlpha = A * k;
    c.fillStyle = textColor(m);
    const w = drawTracked(c, text, x + (o.align === 'right' ? 0 : (1 - k) * -10), y, { font: `500 ${size}px ${FONT.mono}`, size, tracking: 0.08, align: o.align === 'right' ? 'right' : 'left' });
    // a thin index rule with a tick, like a caption bar
    const rx = o.align === 'right' ? x - w : x;
    c.globalAlpha = A * 0.6;
    c.fillRect(rx, y - size - 10, w * step(env.t, at, 0.2, 0.9), 0.8);
    c.fillRect(rx, y - size - 14, 0.8, 8);
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// name card (lower third)
// ---------------------------------------------------------------------------
export interface NameCardOpts {
  name: string;
  role: string;
  years?: string;
  x?: number;
  y?: number;
  align?: 'left' | 'right';
  at?: number;
  /** default 3.5 s (first appearance only) */
  dur?: number;
  fade?: number;
  /** soft ink plate for legibility (default true) */
  plate?: boolean;
}
function nameCardPaint(c: CanvasRenderingContext2D, o: NameCardOpts, env: TypeEnv): void {
  const at = o.at ?? 0;
  const A = envelope(env.t, at, o.dur ?? 3.5, o.fade ?? 0.4);
  if (A <= 0) return;
  const m = env.mood;
  const right = o.align === 'right';
  const x = o.x ?? (right ? 1232 : 56);
  const y = o.y ?? 610;
  const nSize = legibleSize(c, `600 26px ${FONT.sc}`, 26, o.name.toLowerCase());
  const rSize = legibleSize(c, `italic 400 19px ${FONT.text}`, 19);
  const nFont = `600 ${nSize}px ${FONT.sc}`;
  const rFont = `italic 400 ${rSize}px ${FONT.text}`;
  const nameW = measureTracked(c, o.name.toLowerCase(), { font: nFont, size: nSize, tracking: 0.1 });
  const roleText = o.years ? `${o.role}  ·  ${o.years}` : o.role;
  c.save();
  c.font = rFont;
  const roleW = c.measureText(roleText).width;
  const w = Math.max(nameW, roleW) + 24;
  if (o.plate !== false && !isPlate(m)) {
    c.globalAlpha = A;
    const bw = w + 150;
    softPlate(c, right ? x - w / 2 + 10 : x + w / 2 - 10, y + 6, bw, nSize + rSize + 110, m.ink, 0.6);
  }
  const k = step(env.t, at, 0, 0.5);
  const dx = (1 - k) * (right ? 8 : -8);
  c.globalAlpha = A * k;
  c.fillStyle = titleColor(m);
  drawTracked(c, o.name.toLowerCase(), x + dx, y, { font: nFont, size: nSize, tracking: 0.1, align: right ? 'right' : 'left' });
  // rule with a lozenge at the leading end
  const g2 = step(env.t, at, 0.15, 0.8);
  const rl = Math.max(nameW, roleW) * g2;
  c.globalAlpha = A * 0.8;
  const ry = y + 11;
  const sx = right ? x - rl : x;
  c.fillRect(sx, ry - 0.45, rl, 0.9);
  c.beginPath();
  const lx = right ? x + 8 : x - 8;
  c.moveTo(lx, ry - 3);
  c.lineTo(lx + 3, ry);
  c.lineTo(lx, ry + 3);
  c.lineTo(lx - 3, ry);
  c.closePath();
  c.fill();
  c.globalAlpha = A * 0.92 * step(env.t, at, 0.3, 0.9);
  c.fillStyle = textColor(m);
  c.font = rFont;
  c.textAlign = right ? 'right' : 'left';
  c.fillText(roleText, x + dx, ry + rSize + 9);
  c.restore();
}

// ---------------------------------------------------------------------------
// quote card
// ---------------------------------------------------------------------------
export interface QuoteCardOpts {
  /** verbatim (from research/quotes.json) */
  quote: string;
  speaker: string;
  /** "Letter to …, 1958" / "The Perceptron, Psychological Review 65 (1958)" */
  source?: string;
  x?: number;
  y?: number;
  /** text block width (default 760) */
  width?: number;
  /** characters per line cap (default 42) */
  maxChars?: number;
  size?: number;
  align?: 'center' | 'left';
  at?: number;
  dur?: number;
  fade?: number;
  /** seconds between line reveals (default 0.35) */
  stagger?: number;
  plate?: boolean;
}
function quoteCardPaint(c: CanvasRenderingContext2D, o: QuoteCardOpts, env: TypeEnv): void {
  const at = o.at ?? 0;
  const A = envelope(env.t, at, o.dur, o.fade ?? 0.6);
  if (A <= 0) return;
  const m = env.mood;
  const size = legibleSize(c, `italic 400 ${o.size ?? 28}px ${FONT.text}`, o.size ?? 28);
  const font = `italic 400 ${size}px ${FONT.text}`;
  const width = Math.max(o.width ?? 760, (o.width ?? 760) * (size / (o.size ?? 28)));
  const lines = wrapLines(c, o.quote, font, width, o.maxChars ?? 42);
  const lh = size * 1.38;
  const x = o.x ?? 640;
  const yc = o.y ?? 340;
  const blockH = lines.length * lh + 70 + (o.source ? 28 : 0);
  const top = yc - blockH / 2 + size;
  const center = (o.align ?? 'center') === 'center';
  const stagger = o.stagger ?? 0.35;
  const col = isPlate(m) ? m.ink : PARCHMENT_TEXT;
  c.save();
  if (o.plate !== false && !isPlate(m)) {
    c.globalAlpha = A;
    softPlate(c, x, yc, width + 420, blockH + 200, m.ink, 0.5);
  }
  // hanging open-quote mark
  c.globalAlpha = A * 0.4 * step(env.t, at, 0, 0.6);
  c.fillStyle = titleColor(m);
  c.font = `600 ${size * 3.4}px ${FONT.display}`;
  c.textAlign = 'center';
  c.letterSpacing = '0px';
  c.save();
  c.font = font;
  const firstW = c.measureText(lines[0] ?? '').width;
  c.restore();
  const qx = center ? x - firstW / 2 - size * 0.75 : x - size * 0.75;
  c.fillText('“', qx, top + size * 1.05);
  c.font = font;
  c.textAlign = center ? 'center' : 'left';
  c.fillStyle = col;
  lines.forEach((ln, i) => {
    const k = step(env.t, at, 0.25 + i * stagger, 0.95 + i * stagger);
    if (k <= 0) return;
    c.globalAlpha = A * k;
    const txt = i === lines.length - 1 ? ln + '”' : ln;
    c.fillText(txt, x, top + i * lh + (1 - k) * 4);
  });
  const endT = 0.95 + lines.length * stagger;
  const ay = top + (lines.length - 1) * lh + 52;
  c.globalAlpha = A * 0.9 * step(env.t, at, endT, endT + 0.6);
  c.fillStyle = titleColor(m);
  const aSize = legibleSize(c, `500 19px ${FONT.sc}`, 19, o.speaker.toLowerCase());
  const aw = drawTracked(c, o.speaker.toLowerCase(), center ? x + 14 : x + 28, ay, { font: `500 ${aSize}px ${FONT.sc}`, size: aSize, tracking: 0.15, align: center ? 'center' : 'left' });
  // em-rule before the name
  const ax = center ? x + 14 - aw / 2 - 30 : x;
  c.fillRect(ax, ay - aSize * 0.32, 20, 0.9);
  if (o.source) {
    c.globalAlpha = A * 0.72 * step(env.t, at, endT + 0.3, endT + 0.9);
    c.fillStyle = col;
    const sSize = legibleSize(c, `italic 400 18px ${FONT.text}`, 18);
    c.font = `italic 400 ${sSize}px ${FONT.text}`;
    c.textAlign = center ? 'center' : 'left';
    c.fillText(o.source, center ? x : x + 28, ay + 10 + sSize);
  }
  c.restore();
}

// ---------------------------------------------------------------------------
// annotation label with leader line
// ---------------------------------------------------------------------------
export interface AnnotationOpts {
  text: string;
  /** small italic second line */
  sub?: string;
  /** the thing being labelled (stage px) */
  x: number;
  y: number;
  /** where the text sits; the leader runs target -> elbow -> text */
  tx: number;
  ty: number;
  at?: number;
  dur?: number;
  fade?: number;
  /** ink-on-parchment colouring (auto for the parchment mood) */
  onParchment?: boolean;
  size?: number;
  color?: string;
}
function annotationPaint(c: CanvasRenderingContext2D, o: AnnotationOpts, env: TypeEnv): void {
  const at = o.at ?? 0;
  const A = envelope(env.t, at, o.dur, o.fade ?? 0.4);
  if (A <= 0) return;
  const m = env.mood;
  const plate = o.onParchment ?? isPlate(m);
  const col = o.color ?? (plate ? m.ink : mixLab(m.rim, PARCHMENT_TEXT, 0.5));
  const size = legibleSize(c, `500 ${o.size ?? 20}px ${FONT.text}`, o.size ?? 20);
  const leftward = o.tx < o.x;
  // elbow: leave the target diagonally, then run level into the text
  const ex = o.tx + (leftward ? 14 : -14);
  const ey = o.ty - size * 0.32;
  const L1 = Math.hypot(ex - o.x, ey - o.y);
  const L2 = Math.abs(o.tx - ex);
  const g = step(env.t, at, 0.1, 0.7);
  c.save();
  c.globalAlpha = A;
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineWidth = plate ? 1 : 0.9;
  // target: dot + fine ring
  const pop = step(env.t, at, 0, 0.25);
  c.beginPath();
  c.arc(o.x, o.y, 2.2 * pop, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(o.x, o.y, 6 * pop, 0, Math.PI * 2);
  c.globalAlpha = A * 0.6;
  c.stroke();
  c.globalAlpha = A;
  // leader, drawn progressively
  const d = g * (L1 + L2);
  c.beginPath();
  const ux = (ex - o.x) / (L1 || 1);
  const uy = (ey - o.y) / (L1 || 1);
  const sx = o.x + ux * 7;
  const sy = o.y + uy * 7;
  c.moveTo(sx, sy);
  if (d <= L1) c.lineTo(o.x + ux * Math.max(7, d), o.y + uy * Math.max(7, d));
  else {
    c.lineTo(ex, ey);
    c.lineTo(ex + (leftward ? -1 : 1) * (d - L1), ey);
  }
  c.stroke();
  const k = step(env.t, at, 0.5, 0.9);
  c.globalAlpha = A * k;
  c.font = `500 ${size}px ${FONT.text}`;
  c.letterSpacing = '0.3px';
  c.textAlign = leftward ? 'right' : 'left';
  const tx = o.tx + (leftward ? -4 : 4);
  if (!plate) {
    c.shadowColor = withAlpha(m.ink, 0.7);
    c.shadowBlur = 4 * (devScale(c) / 1.5);
  }
  c.fillText(o.text, tx, o.ty);
  if (o.sub) {
    c.font = `italic 400 ${legibleSize(c, `italic 400 ${Math.max(18, size * 0.9)}px ${FONT.text}`, Math.max(18, size * 0.9))}px ${FONT.text}`;
    c.globalAlpha = A * k * 0.8;
    c.fillText(o.sub, tx, o.ty + size * 1.15);
  }
  c.restore();
}

// the kit's cards are always the subject of their moment (legibility audit: fail under MIN_CAP_1080)
export const titleCard = (c: CanvasRenderingContext2D, o: TitleCardOpts, env: TypeEnv): void => textRole(c, 'subject', () => titleCardPaint(c, o, env));
export const chapterCard = (c: CanvasRenderingContext2D, o: ChapterCardOpts, env: TypeEnv): void => textRole(c, 'subject', () => chapterCardPaint(c, o, env));
export const placeStamp = (c: CanvasRenderingContext2D, o: PlaceStampOpts, env: TypeEnv): void => textRole(c, 'subject', () => placeStampPaint(c, o, env));
export const nameCard = (c: CanvasRenderingContext2D, o: NameCardOpts, env: TypeEnv): void => textRole(c, 'subject', () => nameCardPaint(c, o, env));
export const quoteCard = (c: CanvasRenderingContext2D, o: QuoteCardOpts, env: TypeEnv): void => textRole(c, 'subject', () => quoteCardPaint(c, o, env));
export const annotation = (c: CanvasRenderingContext2D, o: AnnotationOpts, env: TypeEnv): void => textRole(c, 'subject', () => annotationPaint(c, o, env));
