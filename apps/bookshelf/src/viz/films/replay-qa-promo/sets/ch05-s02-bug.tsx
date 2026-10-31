/**
 * ch05-s02 / ch05-s03 shared: the bug-react page framing, the player plate, the 16.7 ms frame-slot ribbon and the
 * 67 ms bar (so ch05-s03 picks the bar up exactly where ch05-s02 leaves it), plus the struck-through cursor glyph that
 * ch05-s02 and ch05-s04 share.
 *
 * Every recording-px number below was MEASURED IN THE FILM HARNESS with the take's Inter forced (TakeInter below): text
 * ranges read from the replay iframe's DOM (getBoundingClientRect of the words), plus a full-page grid probe:
 *   bug-react @ 3150: 'Open' chip text 582..613 × 84.5..99.5 · '67ms' x 537.2..603.1, glyph box 117..148 (baseline
 *     ≈ 142.2, cap top ≈ 123.3) · the title wraps to FOUR lines in Inter (… 'components' 214.5..245.5) · 'Replay'
 *     heading 308..328 · the dark player 557.5..1374.2 × 347..806.5 (top corners r ≈ 8), 'Loading replay…' at
 *     915..1005 × 569..585
 *   bug-react @ 11300: 'ROOT CAUSE' x 556..633 × 106..116 · first body line glyph box 132.3..148.3:
 *     backtick from ≈ 914.6 ('and' ends ≈ 911) · 'SidebarProjectList` trees' 919.5..1070.6 · 'are not memoized'
 *     1074.3..1184.7 · '(' from ≈ 1186.5
 */
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { trackPending } from '../../../film/core/pending';
import { rrSrc } from '../../../film/promo';
import TIMELINE from '../timeline.json';
import { SLUG } from './takes';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

// ---------------------------------------------------------------- the take's Inter, made deterministic
/**
 * The product's @font-face (Inter, inside the takes' captured styles) says `font-display: optional`: each replay iframe
 * decides on its own whether the woff2 arrived inside the browser's ~100 ms window, and if not it keeps the system-ui
 * fallback FOR ITS LIFETIME. Measured in the harness: two iframes of the same take in the same frame came out in
 * different fonts (bug-react's title on three lines in one, four in the other; the Root Cause clause shifted 7 rec px),
 * so overlays anchored to words landed off them at random. TakeInter wraps RrwebScreens and, after every render, adds
 * one more Inter face with `font-display: block` to each replay document (the last matching face wins), and holds the
 * frame (core/pending) until it is loaded: every iframe of these shots lays out in Inter, the product's own font.
 * (Kit need, reported: RrwebScreen / rr-clean should rewrite `font-display: optional` itself.)
 */
const INTER_URL = rrSrc(SLUG, 'assets/0d087c697d30ed02.woff2').replace(/\.json$/, '');
const INTER_RANGE =
  'U+0-FF, U+131, U+152-153, U+2BB-2BC, U+2C6, U+2DA, U+2DC, U+304, U+308, U+329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
if (typeof document !== 'undefined' && typeof FontFace !== 'undefined') {
  trackPending(new FontFace('ReplayTakeInter', `url(${INTER_URL})`, { weight: '300 700' }).load().catch(() => null));
}

function ensureInter(d: Document) {
  if (!d.documentElement || d.getElementById('c5-inter')) return;
  const st = d.createElement('style');
  st.id = 'c5-inter';
  st.textContent = `@font-face { font-family: Inter; font-style: normal; font-weight: 300 700; font-display: block; src: url("${INTER_URL}") format("woff2"); unicode-range: ${INTER_RANGE}; }`;
  (d.head ?? d.documentElement).appendChild(st);
  trackPending(Promise.all([d.fonts.load('400 16px Inter'), d.fonts.load('700 16px Inter')]).then(() => d.fonts.ready).catch(() => null));
}

/** inject into every replay document under `root` now, and whenever one appears or is rebuilt (rrweb builds the
 *  iframe and casts its snapshot inside RrwebScreen's own effects, which do not re-render this wrapper) */
function watchInter(root: HTMLElement, seen: WeakSet<Document>) {
  for (const f of root.querySelectorAll('iframe')) {
    const d = f.contentDocument;
    if (!d) continue;
    ensureInter(d);
    if (!seen.has(d)) {
      seen.add(d);
      new MutationObserver(() => ensureInter(d)).observe(d, { childList: true, subtree: true });
    }
  }
}

export function TakeInter(p: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const seen = useRef(new WeakSet<Document>());
  // on mount: watch for iframes added later (a take that finishes loading builds its replayer without re-rendering us)
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mo = new MutationObserver(() => watchInter(root, seen.current));
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  // and after every render (a seek can rebuild a replay document)
  useLayoutEffect(() => {
    if (ref.current) watchInter(ref.current, seen.current);
  });
  return (
    <div ref={ref} style={{ position: 'absolute', left: 0, top: 0, width: 1280, height: 720 }}>
      {p.children}
    </div>
  );
}

// ---------------------------------------------------------------- the page (ch05-s02, ch05-s03 before the match cut)
/** the right panel only: no chat column (its divider sits at x ≈ 501), no header, no idle cursor (≈ 830, 828) */
export const PAGE_CROP = { x: 506, y: 72, w: 914, h: 660 } as const;
export const PAGE_BOX = { x: 150, y: 42, w: 880 } as const;
export const PAGE_K = PAGE_BOX.w / PAGE_CROP.w;
export const PAGE_H = PAGE_CROP.h * PAGE_K;
export const pageX = (rx: number) => PAGE_BOX.x + (rx - PAGE_CROP.x) * PAGE_K;
export const pageY = (ry: number) => PAGE_BOX.y + (ry - PAGE_CROP.y) * PAGE_K;

/** the dark player rect in stage px (bottom clipped by the crop) */
export const PLATE = {
  x: pageX(557.5),
  y: pageY(347),
  w: (1374.2 - 557.5) * PAGE_K,
  h: PAGE_BOX.y + PAGE_H - pageY(347),
  r: 8 * PAGE_K,
} as const;
export const PLATE_CX = PLATE.x + PLATE.w / 2;
export const PLATE_FILL = '#121218';

/** '67ms' in the title (stage px) */
export const MS67 = { x0: pageX(537.2), x1: pageX(603.1), yTop: pageY(123.3), base: pageY(142.2) } as const;

// ---------------------------------------------------------------- the 16.7 ms slot ribbon (ch05-s02 clock)
export const RIB = {
  pitch: 40,
  slotW: 32,
  slotH: 46,
  /** slot row centre (the plate spans ≈ 307..677) */
  y: 490,
  /** first slot's left edge at offset 0 */
  x0: 200,
  /** average px per second while advancing (one slot per half-second beat at 120 BPM: a clack per slot; see gate) */
  v: 80,
  /** the 67 ms bar: covers slots K0 … K0 + 3 */
  k0: 14,
  barH: 24,
  barGap: 10,
} as const;

type W = { w: string; start: number; end: number };
type L = { id: string; words: W[] };
type S = { id: string; start: number; end: number; lines: L[] };
const SHOTS = (TIMELINE as unknown as { shots: S[] }).shots;
const S02 = SHOTS.find((s) => s.id === 'ch05-s02')!;
const word = (line: string, w: string) => S02.lines.find((l) => l.id === line)!.words.find((x) => x.w.toLowerCase() === w.toLowerCase())!.start;

/** ch05-s02's anchors (shot-local s), straight from the locked clock */
export const S02_AT = {
  own: word('L0502', 'own'),
  update: word('L0503', 'update'),
  sixty: word('L0503', 'Sixty-seven'),
  four: word('L0503', 'Four'),
  dropped: word('L0503', 'dropped'),
  frames: word('L0503', 'frames'),
  lineEnd: S02.lines.find((l) => l.id === 'L0503')!.words.slice(-1)[0].end,
  no: word('L0504', 'No'),
  background: word('L0504', 'background'),
  dur: S02.end - S02.start,
};
/** the four slots go hollow one per beat of the silence: on 'dropped', 'frames', the line's end, and half a beat on */
export const HOLLOW_AT = [S02_AT.dropped, S02_AT.frames, S02_AT.lineEnd, S02_AT.lineEnd + 0.43];

/** a film-gate advance: one slot (RIB.pitch) per half-second beat from `a`, each step a quick 0.18 s ease-out then a
 *  hold (the clack), `n` steps at most. The ribbon visibly ticks on every beat instead of creeping. */
function gate(t: number, a: number, n = Infinity) {
  const tt = t - a;
  if (tt <= 0) return 0;
  const beat = 0.5, step = 0.18;
  const k = Math.min(Math.floor(tt / beat), n - 1);
  const frac = clamp((tt - k * beat) / step);
  return RIB.pitch * (k + 1 - Math.pow(1 - frac, 3));
}

/** ribbon offset (px slid left) at ch05-s02 local time t; ch05-s03 passes S02_AT.dur (+ its own t, frozen).
 *  'Sixty-seven': three gate steps (the last lands well before 'Four', so the bar drops on a still ribbon);
 *  'No click.': the gate resumes, a slot per beat, and keeps going into ch05-s03. */
export function ribbonOffset(t: number) {
  return gate(t, S02_AT.sixty, 3) + gate(t, S02_AT.no);
}

/** left edge of slot k at ch05-s02 time t */
export const slotX = (k: number, t: number) => RIB.x0 + k * RIB.pitch - ribbonOffset(t);

/** the 67 ms bar rect at ch05-s02 time t (it rides the ribbon) */
export function barRect(t: number) {
  const x = slotX(RIB.k0, t);
  return { x, y: RIB.y - RIB.slotH / 2 - RIB.barGap - RIB.barH, w: RIB.pitch * 3 + RIB.slotW, h: RIB.barH };
}
/** where ch05-s02 leaves the bar (ch05-s03 shatters it from here) */
export const BAR_END = barRect(S02_AT.dur);

/** the ribbon mask's visible x range (inside the plate, faded at both ends) */
export const RIB_X = { x0: PLATE.x + 14, x1: PLATE.x + PLATE.w - 14 };

/** SVG: the ribbon's edge-fade mask (one per shot; pass a unique id) */
export function RibbonMask(p: { id: string }) {
  const w = RIB_X.x1 - RIB_X.x0;
  return (
    <defs>
      <linearGradient id={`${p.id}-g`} x1={RIB_X.x0} x2={RIB_X.x1} y1={0} y2={0} gradientUnits="userSpaceOnUse">
        <stop offset={0} stopColor="#fff" stopOpacity={0} />
        <stop offset={70 / w} stopColor="#fff" stopOpacity={1} />
        <stop offset={1 - 70 / w} stopColor="#fff" stopOpacity={1} />
        <stop offset={1} stopColor="#fff" stopOpacity={0} />
      </linearGradient>
      <mask id={p.id} maskUnits="userSpaceOnUse" x={0} y={0} width={1280} height={720}>
        <rect x={RIB_X.x0} y={PLATE.y} width={w} height={PLATE.h} fill={`url(#${p.id}-g)`} />
      </mask>
    </defs>
  );
}

/**
 * SVG: the bracket magnifier on '67ms' in the title. The gap between '67ms' and 'React' is ≈ 7 stage px, so '{ }'
 * glyphs would cover the 'R': the bracket is drawn as four hairline corner brackets snapping in from 1.5× onto the
 * word's box (no corner dots: the title lines sit 15 px apart and the dots would touch the next line).
 */
export function SvgWordBracket(p: { x0: number; x1: number; yTop: number; base: number; u: number; out?: number; color?: string }) {
  const u = clamp(p.u);
  const out = clamp(p.out ?? 0);
  if (u <= 0 || out >= 1) return null;
  const e = 1 - Math.pow(1 - u, 3);
  const col = p.color ?? '#141216';
  const padX = 5, padT = 6, padB = 7;
  const bx0 = p.x0 - padX, bx1 = p.x1 + padX, by0 = p.yTop - padT, by1 = p.base + padB;
  const cx = (bx0 + bx1) / 2, cy = (by0 + by1) / 2;
  const k = 1 + 0.5 * (1 - e);
  const X = (x: number) => cx + (x - cx) * k;
  const Y = (y: number) => cy + (y - cy) * k;
  const arm = 7;
  const d = [
    `M${X(bx0)} ${Y(by0) + arm} V${Y(by0)} H${X(bx0) + arm}`,
    `M${X(bx1) - arm} ${Y(by0)} H${X(bx1)} V${Y(by0) + arm}`,
    `M${X(bx1)} ${Y(by1) - arm} V${Y(by1)} H${X(bx1) - arm}`,
    `M${X(bx0) + arm} ${Y(by1)} H${X(bx0)} V${Y(by1) - arm}`,
  ].join(' ');
  return (
    <g opacity={e * (1 - out)}>
      <path d={d} fill="none" stroke={col} strokeWidth={1.6} strokeLinecap="square" />
    </g>
  );
}

// ---------------------------------------------------------------- the struck-through cursor (ch05-s02, ch05-s04)
/** the arrow (RrwebScreen's drawn cursor, so it reads as 'the pointer'), 17.5 × 26 units, tip at 0,0 */
export const CURSOR_PATH = 'M0 0 L0 22 L6 16.5 L10.5 26 L14 24.4 L9.6 15.2 L17.5 15.2 Z';

/** SVG: the greyed pointer, struck through with a red-pink hairline (strike 0..1 draws the line) */
export function SvgStruckCursor(p: { x: number; y: number; scale?: number; u: number; strike: number }) {
  const u = clamp(p.u);
  if (u <= 0) return null;
  const k = p.scale ?? 2.4;
  const e = 1 - Math.pow(1 - u, 3);
  const s = 1 - Math.pow(1 - clamp(p.strike), 3);
  // strike: from upper-left past the tip to lower-right past the tail
  const ax = -6, ay = -4, bx = 24, by = 32;
  return (
    <g transform={`translate(${p.x.toFixed(2)} ${(p.y + (1 - e) * 8).toFixed(2)})`} opacity={e} style={e < 0.98 ? { filter: `blur(${((1 - e) * 4).toFixed(2)}px)` } : undefined}>
      <g transform={`scale(${k})`}>
        <path d={CURSOR_PATH} fill="rgba(255,255,255,.16)" stroke="rgba(255,255,255,.62)" strokeWidth={1.2 / k * 1.6} strokeLinejoin="round" />
      </g>
      {s > 0 && (
        <line x1={ax * k} y1={ay * k} x2={(ax + (bx - ax) * s) * k} y2={(ay + (by - ay) * s) * k} stroke="#f41c52" strokeWidth={2.4} strokeLinecap="round" />
      )}
    </g>
  );
}

/** canvas twin of SvgStruckCursor (ch05-s04 / ch05-s05 paint it on the haze) */
export function struckCursor(c: CanvasRenderingContext2D, o: { x: number; y: number; scale?: number; u: number; strike: number }) {
  const u = clamp(o.u);
  if (u <= 0) return;
  const k = o.scale ?? 2.4;
  const e = 1 - Math.pow(1 - u, 3);
  const s = 1 - Math.pow(1 - clamp(o.strike), 3);
  c.save();
  c.globalAlpha *= e;
  if (e < 0.98) c.filter = `blur(${((1 - e) * 4).toFixed(2)}px)`;
  c.translate(o.x, o.y + (1 - e) * 8);
  c.save();
  c.scale(k, k);
  const p = new Path2D(CURSOR_PATH);
  c.fillStyle = 'rgba(255,255,255,.16)';
  c.fill(p);
  c.strokeStyle = 'rgba(255,255,255,.62)';
  c.lineWidth = (1.2 / k) * 1.6;
  c.lineJoin = 'round';
  c.stroke(p);
  c.restore();
  if (s > 0) {
    const ax = -6, ay = -4, bx = 24, by = 32;
    c.strokeStyle = '#f41c52';
    c.lineWidth = 2.4;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(ax * k, ay * k);
    c.lineTo((ax + (bx - ax) * s) * k, (ay + (by - ay) * s) * k);
    c.stroke();
  }
  c.restore();
}

// ---------------------------------------------------------------- the Root Cause card (ch05-s03 after the match cut)
/** bug-react frozen at 11300 (never run on: the page scrolls from ≈ 11400) */
export const RC_AT = 11300;
export const RC_K = 3.4;
export const RC_EYEBROW = { x: 550, y: 101, w: 90, h: 20 } as const;
/** '`SidebarProjectList` trees' (912.5..1072.5: clear of 'and' and of 'are') */
export const RC_A = { x: 912.5, y: 129, w: 160, h: 22 } as const;
/** 'are not memoized' (1072.5..1185.5: clear of 'trees' and of '(') */
export const RC_B = { x: 1072.5, y: 129, w: 113, h: 22 } as const;
