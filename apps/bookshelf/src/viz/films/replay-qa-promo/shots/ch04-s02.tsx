// ch04-s02 — second of the triplet: "Against staging, a preview, even localhost."
// All drawn (director's note 2026-10-14: no product footage here). An abstract browser bar floats in at the top; its
// address rolls staging → a PR preview → localhost on each word. Three outlined pills (staging · preview · local) drop
// out of it into a row, braces part round the row on 'Against', and each pill fills Replay red-pink as it is said
// ('local' with a small pop).
// Same studio paper and drifting hairlines as ch04-s01 (same seed, time offset by its length).
import { Timeline } from '../../../core';
import { defineShot } from '../../../film/core/shot';
import { PROMO, easeInOut, easeOut } from '../../../film/promo';
import { braceBox, driftLines } from '../sets/brand';
import { addressBar } from '../sets/abstract';
import { SvgPill, pillW } from '../sets/ch04-s02-svg';

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

// ---- the address bar (drawn, no product footage: director's note 2026-10-14): one abstract browser bar whose address
// rolls staging → preview → localhost on each word; the three words lift out of it as pills
const BAR = { cx: 640, y: 150, w: 900, size: 34 };
const BAR_CY = BAR.y + (BAR.size * 2.3) / 2;
const ADDR = ['https://staging.your-app.dev', 'https://pr-42.preview.your-app.dev', 'http://localhost:3000'];
const SRC = [{ text: 'staging' }, { text: 'preview' }, { text: 'local' }].map((w) => ({ ...w, cx: 640, cy: BAR_CY + 40 }));

// ---- the pill row
const ROW_Y = 476;
const PILL_SIZE = 42;
const LIFT_SCALE = 0.6;
const GAP = 34;
// the lift: starts once the strip is sharp (it settles by ~0.3 s), quick and low so the row has formed by ~0.68 s,
// before 'staging' fills (0.62)
const LIFT_AT = 0.18;
const LIFT_DUR = 0.38;
const LIFT_STAGGER = 0.06;
const LIFT_ARC = 10;
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
      bLift: Math.max(T.beat('b-lift'), LIFT_AT),
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

    addressBar(c, { cx: BAR.cx, y: BAR.y, w: BAR.w, size: BAR.size, u: clamp((t - 0.02) / 0.3), t, values: ADDR, ats: [0, sc.fills[1] - 0.12, sc.fills[2] - 0.12], roll: 0.24 });

    const row = rowLayout();
    // braces appear on 'Against' (the downbeat) at the row's centre and PART as the words arrive (≈ 0.3 → 0.75 s);
    // corner dots follow them out
    const open = easeOut(clamp((t - sc.bBrace) / 0.45));
    braceBox(c, {
      x0: lerp(640, row.x0, open),
      x1: lerp(640, row.x1, open),
      y: ROW_Y,
      size: 104,
      u: clamp((t - sc.bBrace + 0.06) / 0.32),
      color: PROMO.ink,
      pad: 20,
    });
  },
  overlay(s, sc) {
    const t = s.t;
    const row = rowLayout();
    return (
      <g>
        {SRC.map((w, i) => {
          // lift: from the word in the line to its place in the row
          // each pill drops out of the bar on its own word (lands just before it fills), so no two are ever in flight together
          const at = i === 0 ? sc.bLift : Math.max(sc.bLift + i * LIFT_STAGGER, sc.fills[i] - LIFT_DUR - 0.04);
          const u = clamp((t - at) / LIFT_DUR);
          if (u <= 0) return null;
          const e = easeInOut(u);
          const x = lerp(w.cx, row.xs[i], e);
          const y = lerp(w.cy, ROW_Y, e) - Math.sin(Math.PI * e) * LIFT_ARC;
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
});
