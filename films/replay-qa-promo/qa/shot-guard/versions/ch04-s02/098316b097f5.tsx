// ch04-s02 — second of the triplet: "Against staging, a preview, even localhost."
// The product's own 'Add environment' row (take 'schedule', frozen at add-env 11458) floats in at the top, tilted, and
// settles flat. Three of its words lift off the grey line as outlined pills (staging · preview · local), braces snap
// round the row on 'Against', and each pill fills Replay red-pink as it is said ('local' with a small pop).
// Same studio paper and drifting hairlines as ch04-s01 (same seed, time offset by its length).
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, RrwebScreen, easeInOut, easeOut } from '../../../film/promo';
import { braceBox, driftLines, underline } from '../sets/brand';
import { MARKS, SLUG } from '../sets/takes';
import { SvgPill, pillW } from '../sets/ch04-s02-svg';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ---- the strip: 'Add environment' + its grey line, MEASURED IN THE FILM HARNESS (single seek to add-env 11458; the
// sheet scroller sits at scrollTop 700 there, so the row is 93 px higher than on the rr-sheet frames, cf. ch04-s01).
// DOM probe: 'Add environment' 310..423 × 180..197; grey line 310.. × 204..219 (ellipsized 'or local co…' ≈ 655);
// the Production URL ends at y ≈ 152 (Delete environment button) and 'Chat' starts at x 1183: both outside the crop.
const CROP = { x: 296, y: 168, w: 376, h: 62 };
const BOX = { x: 140, y: 120, w: 1000 };
const K = BOX.w / CROP.w;
const sx = (x: number) => BOX.x + (x - CROP.x) * K;
const sy = (y: number) => BOX.y + (y - CROP.y) * K;
/** the three words in the grey line (recording px, harness probe) */
const SRC = [
  { text: 'staging', x0: 404, x1: 446 },
  { text: 'preview', x0: 533, x1: 576 },
  { text: 'local', x0: 598, x1: 625 },
].map((w) => ({ ...w, cx: sx((w.x0 + w.x1) / 2), cy: sy(211.5) }));

// ---- the pill row
const ROW_Y = 476;
const PILL_SIZE = 42;
/** the grey line's type on screen is ≈ 34.6 px (13 px × K): a pill leaves the line at that size (the word, lifted) */
const LIFT_SCALE = 34.6 / PILL_SIZE;
const GAP = 34;
const widths = () => SRC.map((w) => pillW(w.text, PILL_SIZE));
function rowLayout() {
  const ws = widths();
  const total = ws.reduce((a, b) => a + b, 0) + GAP * (ws.length - 1);
  let x = 640 - total / 2;
  const xs = ws.map((w) => {
    const c = x + w / 2;
    x += w + GAP;
    return c;
  });
  return { xs, ws, x0: 640 - total / 2, x1: 640 + total / 2 };
}

export default defineShot({
  id: 'ch04-s02',
  mood: 'parchment',
  build({ timing: T }) {
    const tl = new Timeline();
    tl.hold(0, T.duration);
    return {
      tl,
      bRow: T.beat('b-row'),
      bLift: T.beat('b-lift'),
      bBrace: T.beat('b-brace'),
      fills: [T.beat('b-staging'), T.beat('b-preview'), T.beat('b-local')],
    };
  },
  paint(f, _s, sc) {
    const c = f.c;
    const t = f.t;
    c.fillStyle = PROMO.paper;
    c.fillRect(0, 0, 1280, 720);
    // ch04-s01's hairlines carried across the cut (its offset 9.79 + its 4.833 s)
    driftLines(c, t + 14.623, { n: 2, color: '#a9a4ae', alpha: 0.32, speed: 1.4, seed: 3, y0: 60, y1: 680 });

    const row = rowLayout();
    // braces snap round the pill row on 'Against' (the downbeat); corner dots
    braceBox(c, { x0: row.x0, x1: row.x1, y: ROW_Y, size: 104, u: clamp((t - sc.bBrace + 0.06) / 0.32), color: PROMO.ink, pad: 20 });
    // the red-pink underline runs under 'staging' as it fills
    const s0 = row.xs[0], w0 = row.ws[0];
    underline(c, { x0: s0 - w0 / 2 + 10, x1: s0 + w0 / 2 - 10, y: ROW_Y + PILL_SIZE * 0.925 + 16, u: clamp((t - sc.fills[0] - 0.04) / 0.32), width: 3.5 });
  },
  overlay(s, sc) {
    const t = s.t;
    const row = rowLayout();
    return (
      <g>
        {SRC.map((w, i) => {
          // a faint red-pink mark stays on the source word in the product line (above the DOM strip)
          const hu = easeOut(clamp((t - sc.bLift - i * 0.08) / 0.3));
          const fu = easeOut(clamp((t - sc.fills[i] + 0.06) / 0.2));
          const hx0 = sx(w.x0) - 4, hx1 = sx(w.x1) + 4;
          return hu > 0 ? (
            <rect key={`h${i}`} x={hx0} y={w.cy - 22} width={hx1 - hx0} height={44} rx={8} fill={PROMO.brand} opacity={0.1 * hu + 0.06 * fu} />
          ) : null;
        })}
        {SRC.map((w, i) => {
          // lift: from the word in the line to its place in the row
          const at = sc.bLift + i * 0.08;
          const u = clamp((t - at) / 0.55);
          if (u <= 0) return null;
          const e = easeInOut(u);
          const x = lerp(w.cx, row.xs[i], e);
          const y = lerp(w.cy, ROW_Y, e) - Math.sin(Math.PI * e) * 16;
          const fill = easeOut(clamp((t - sc.fills[i] + 0.06) / 0.14));
          // 'local' pops on 'localhost'
          const pu = clamp((t - sc.fills[i] + 0.06) / 0.34);
          const pop = i === 2 && pu > 0 && pu < 1 ? Math.sin(Math.PI * pu) * 0.12 : 0;
          return (
            <SvgPill
              key={w.text}
              x={x}
              y={y}
              text={w.text}
              size={PILL_SIZE}
              u={easeOut(clamp(u / 0.3))}
              fill={fill}
              scale={lerp(LIFT_SCALE, 1, e) + pop}
              blur={(1 - easeOut(clamp(u / 0.4))) * 4}
            />
          );
        })}
      </g>
    );
  },
  dom(s) {
    const t = s.t;
    const u = clamp((t - 0.05) / 0.5);
    const e = easeOut(u);
    const a = easeOut(clamp((t - 0.02) / 0.28));
    return (
      <RrwebScreen
        slug={SLUG}
        take="schedule"
        at={MARKS.schedule.addEnv}
        crop={CROP}
        box={{ x: BOX.x, y: BOX.y + (1 - e) * 22, w: BOX.w }}
        chrome="none"
        radius={10}
        opacity={a}
        tilt={{ x: 6 * (1 - e), y: -10 * (1 - e) }}
        style={{
          filter: a < 0.98 ? `blur(${((1 - a) * 8).toFixed(2)}px)` : undefined,
          boxShadow: '0 26px 60px -22px rgba(40,10,60,.34), 0 6px 16px -8px rgba(40,10,60,.18), 0 0 0 1px rgba(20,18,22,.05)',
        }}
      />
    );
  },
});
