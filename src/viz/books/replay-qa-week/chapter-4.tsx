// Book scene — replay-qa-week, chapter 4: "A Month Later"
//
// The long view. Every day the agent walks more paths, and it never forgets
// one it has learned — so what it has proven compounds week over week. The
// centerpiece is the coverage field: your app as a dark field of moments
// (ParticleCloud) lighting up in waves, with a four-week calendar strip
// keeping time above it. A re-walk shimmer shows old paths being walked
// again on fresh movies; one honest zoom says what a lit dot does and does
// not mean; Friday stops being scary; then everything falls away for the
// book's last line on a clean stage.
import { CAMERA_HOME, Camera, Timeline, colors, ease, cameraInterp, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { ParticleCloud } from '../../primitives';
import type { ParticlePoint } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
/** Stage 1280×720; the bottom strip (y ≳ 630) stays clear for captions. */
const FIELD = { x: 170, y: 210, w: 940, h: 380 };
const CAL = { x: 340, y: 96, w: 600 };

/* ------------------------------------------------------------------ data */
/**
 * The app as a field of moments: seeded clusters (its screens) with organic
 * spread. Each particle gets an `ord` in 0..4-ish — the week-fraction at
 * which the agent first reaches it. Weeks explore outward: early clusters
 * light first, stragglers later, and a few corners stay dark all month.
 */
const N = 760;
const CLUSTERS: Array<{ cx: number; cy: number; sx: number; sy: number; wk: number }> = [
  { cx: 0.2, cy: 0.3, sx: 0.09, sy: 0.13, wk: 0.1 }, // home + sign in
  { cx: 0.42, cy: 0.55, sx: 0.1, sy: 0.14, wk: 0.5 }, // browse + search
  { cx: 0.62, cy: 0.28, sx: 0.09, sy: 0.12, wk: 1.1 }, // cart + checkout
  { cx: 0.8, cy: 0.6, sx: 0.08, sy: 0.12, wk: 1.9 }, // account + orders
  { cx: 0.33, cy: 0.82, sx: 0.11, sy: 0.08, wk: 2.6 }, // settings, edge pages
  { cx: 0.88, cy: 0.2, sx: 0.06, sy: 0.09, wk: 3.3 }, // the weird corners
];

type Dot = { x: number; y: number; ord: number };
const DOTS: Dot[] = (() => {
  const rand = mulberry32(41);
  const out: Dot[] = [];
  for (let i = 0; i < N; i++) {
    const c = CLUSTERS[i % CLUSTERS.length];
    // box-muller-ish spread from two uniforms — deterministic, module scope
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-6)));
    const px = c.cx + Math.cos(a) * d * c.sx;
    const py = c.cy + Math.sin(a) * d * c.sy;
    // reached: cluster's week, plus how far out this dot sits, plus noise
    const ord = c.wk + d * 0.85 + rand() * 0.9;
    out.push({
      x: FIELD.x + clamp01(px) * FIELD.w,
      y: FIELD.y + clamp01(py) * FIELD.h,
      ord,
    });
  }
  return out;
})();

/** The dot the honest-note beat zooms into (a mid-field, week-one moment). */
const SPOT = DOTS.reduce((best, d) =>
  Math.abs(d.x - 640) + Math.abs(d.y - 380) + d.ord * 60 <
  Math.abs(best.x - 640) + Math.abs(best.y - 380) + best.ord * 60
    ? d
    : best,
);

const WEEK_LABELS = ['week one', 'week two', 'week three', 'week four'];
const DAYS_PER_WEEK = 5;

/* -------------------------------------------------------------- cameras */
const CAM_FIELD: CameraState = { x: 640, y: 390, k: 1.1 };
const CAM_DRIFT: CameraState = { x: 700, y: 360, k: 1.22 };
const CAM_SPOT: CameraState = { x: SPOT.x, y: SPOT.y, k: 1.9 };
const CAM_WIDE: CameraState = { x: 640, y: 370, k: 0.98 };

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();

  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const fieldU = tl.channel('fieldU', 0); // the dark field itself fades in
  const weekU = tl.channel('weekU', 0.35); // 0..4 — how much month has passed
  const calU = tl.channel('calendar', 0); // calendar strip reveal
  const rewalkU = tl.channel('rewalk', 0); // shimmer: old paths walked again
  const spotU = tl.channel('spotU', 0); // the honest-note ring on one dot
  const fridayU = tl.channel('fridayU', 0); // the Friday cell glows
  const dimU = tl.channel('dimU', 0); // everything falls away
  const closeU = tl.channel('closeU', 0); // the last line

  /* — beat 1 · a month in ————————————————————————————————————————————— */
  let t = 0.5;
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'A month in, your mornings all look the same. You do your work. It does its walking.',
  });
  tl.tween(fieldU, 1, { at: t - 5.0, dur: 1.8, ease: ease.draw });
  tl.tween(calU, 1, { at: t - 3.6, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAM_FIELD, { at: t - 4.6, dur: 1.6, ease: ease.move });
  t = tl.hold(t, 0.6);

  /* — beat 2 · a few more paths every day ———————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Every day it takes a few more paths through your app. Signing in. Searching. Paying. The weird back button dance that nobody ever tests.',
  });
  tl.tween(weekU, 1, { at: t - 5.6, dur: 5.2, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 3 · it never forgets ——————————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.8,
    text: 'And here is the quiet part: it never forgets a path it has learned. What it walked last week, it walks again this week, on fresh movies.',
  });
  tl.tween(rewalkU, 1, { at: t - 5.2, dur: 4.4, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 4 · the map compounds —————————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'So the map never resets. It compounds. Week two starts where week one ended.',
  });
  tl.tween(weekU, 2, { at: t - 5.0, dur: 4.4, ease: ease.linear });
  t = tl.hold(t, 0.5);

  /* — beat 5 · week three ————————————————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'By week three, the dark corners are the exception instead of the rule.',
  });
  tl.tween(weekU, 3, { at: t - 4.8, dur: 4.2, ease: ease.linear });
  tl.tween(cam, CAM_DRIFT, { at: t - 4.6, dur: 2.4, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 6 · the honest note (zoom to one dot) ————————————————————— */
  t = tl.caption({
    at: t,
    dur: 6.8,
    text: 'One honest note. A lit dot doesn’t mean nothing there can ever break. It means the last walk through it worked, and there’s a movie of that walk.',
  });
  tl.tween(cam, CAM_SPOT, { at: t - 6.4, dur: 1.7, ease: ease.move });
  tl.tween(spotU, 1, { at: t - 4.8, dur: 0.8, ease: ease.enter });
  t = tl.hold(t, 0.7);

  /* — beat 7 · Friday ————————————————————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'Then it’s Friday afternoon, and you’re about to ship. That used to take a little courage.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 5.2, dur: 1.7, ease: ease.move });
  tl.tween(spotU, 0, { at: t - 5.2, dur: 0.8, ease: ease.move });
  tl.tween(weekU, 4, { at: t - 4.6, dur: 3.4, ease: ease.linear });
  tl.tween(fridayU, 1, { at: t - 1.6, dur: 0.6, ease: ease.pop });
  t = tl.hold(t, 0.6);

  /* — beat 8 · you could open any of them ———————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Because now, behind every lit dot on this map, there’s a movie you could open. You almost never will. Knowing you could is the whole point.',
  });
  t = tl.hold(t, 0.6);

  /* — beat 9 · everything falls away —————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 4.6,
    text: 'A month ago, all you did was paste a link.',
  });
  tl.tween(dimU, 1, { at: t - 4.0, dur: 2.2, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 10 · the last line ————————————————————————————————————————— */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'You didn’t hire a tester. You hired a witness.',
  });
  tl.tween(closeU, 1, { at: t - 4.8, dur: 1.4, ease: ease.enter });
  tl.hold(t, 1.6);

  return { tl, cam, fieldU, weekU, calU, rewalkU, spotU, fridayU, dimU, closeU };
}

const scene = buildScene();

/* ------------------------------------------------------- the field cloud */
const DARK = '#25314a';

function computeField(s: SceneState): ParticlePoint[] {
  const base = clamp01(s.get(scene.fieldU));
  const wk = s.get(scene.weekU);
  const rw = clamp01(s.get(scene.rewalkU));
  const dim = clamp01(s.get(scene.dimU));
  if (base <= 0.002) return [];
  const keep = 1 - 0.92 * dim; // the close: the field becomes a whisper
  return DOTS.map((d) => {
    const lit = clamp01((wk - d.ord) * 2.2); // 0 → dark, 1 → fully proven
    // recency glow: freshly lit dots run warm, then settle to teal
    const fresh = lit > 0 ? clamp01(1 - (wk - d.ord) / 0.8) : 0;
    // the re-walk shimmer sweeps by ord: old dots pulse warm briefly
    const sweep = rw > 0 ? clamp01(1 - Math.abs(rw * 1.4 - d.ord / 3) * 6) : 0;
    const warm = Math.max(fresh, sweep * 0.9);
    const color = lit <= 0 ? DARK : warm > 0.45 ? colors.WARM : colors.TEAL;
    const alpha = (lit <= 0 ? 0.28 : 0.45 + 0.5 * lit) * base * keep;
    return { x: d.x, y: d.y, r: lit <= 0 ? 1.6 : 2.1 + 0.9 * lit + 1.1 * warm, color, alpha };
  });
}

/* -------------------------------------------------- local subcomponents */

/** Four weeks of five day-cells, filling as `week` advances. */
function CalendarStrip({ u, week, friday, fade }: { u: number; week: number; friday: number; fade: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const cellW = 22;
  const gap = 6;
  const weekW = DAYS_PER_WEEK * (cellW + gap) + 18;
  return (
    <g transform={`translate(${CAL.x}, ${CAL.y})`} opacity={uu * (0.15 + 0.85 * fade)}>
      {WEEK_LABELS.map((wl, wi) => {
        const wx = wi * weekW;
        return (
          <g key={wi} transform={`translate(${wx}, 0)`}>
            <text y={-10} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
              {wl}
            </text>
            {Array.from({ length: DAYS_PER_WEEK }, (_, di) => {
              const done = clamp01((week - (wi + di / DAYS_PER_WEEK)) * DAYS_PER_WEEK);
              const isFriday = wi === 3 && di === 4;
              const glow = isFriday ? clamp01(friday) : 0;
              return (
                <g key={di}>
                  {glow > 0 && (
                    <rect x={di * (cellW + gap) - 3} y={-3} width={cellW + 6} height={cellW + 6} rx={7} fill="none" stroke={colors.WARM} strokeWidth={1.6} opacity={glow} />
                  )}
                  <rect
                    x={di * (cellW + gap)}
                    y={0}
                    width={cellW}
                    height={cellW}
                    rx={5}
                    fill={done > 0 ? colors.TEAL : colors.PANEL}
                    opacity={done > 0 ? 0.25 + 0.55 * done : 0.5}
                    stroke={colors.GRID}
                    strokeWidth={1}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

/** The honest-note ring: what one lit dot actually claims. */
function SpotNote({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g opacity={uu}>
      <circle cx={SPOT.x} cy={SPOT.y} r={10 + 5 * uu} fill="none" stroke={colors.WARM} strokeWidth={1.6} />
      <line x1={SPOT.x + 14} y1={SPOT.y - 8} x2={SPOT.x + 44} y2={SPOT.y - 30} stroke={colors.WARM} strokeWidth={1.2} opacity={0.7} />
      <g transform={`translate(${SPOT.x + 48}, ${SPOT.y - 74})`}>
        <rect width={230} height={52} rx={9} fill={colors.BG} opacity={0.92} />
        <rect width={230} height={52} rx={9} fill="none" stroke={colors.WARM} strokeWidth={1.2} />
        <text x={12} y={21} fill={colors.TEXT} fontSize={11.5} fontFamily={mono}>
          last walk: passed
        </text>
        <text x={12} y={40} fill={colors.MUTED} fontSize={11} fontFamily={mono}>
          movie saved, open any time
        </text>
      </g>
    </g>
  );
}

/** The book's last image: one line, clean stage. */
function CloseLine({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g opacity={uu}>
      <rect x={0} y={0} width={1280} height={720} fill={colors.BG} opacity={0.72 * uu} />
      <text x={640} y={352 + (1 - uu) * 10} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={700}>
        You didn’t hire a tester.
      </text>
      <text x={640} y={400 + (1 - uu) * 14} textAnchor="middle" fill={colors.WARM} fontSize={30} fontWeight={700}>
        You hired a witness.
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
export function Render({ s }: { s: SceneState }) {
  const dim = clamp01(s.get(scene.dimU));
  const fade = 1 - 0.9 * dim;
  return (
    <>
      <Camera {...s.get(scene.cam)}>
        <ParticleCloud state={s} compute={computeField} />
        {/* hide the field label while the camera is zoomed into the spot note —
            half-clipped text at the frame edge reads as a bug */}
        <g opacity={(0.15 + 0.85 * fade) * (1 - clamp01(s.get(scene.spotU)))}>
          <text x={FIELD.x} y={FIELD.y - 16} fill={colors.MUTED} fontSize={12}>
            your app — every dot a moment it can reach
          </text>
        </g>
        <CalendarStrip u={s.get(scene.calU)} week={s.get(scene.weekU)} friday={s.get(scene.fridayU)} fade={fade} />
        <SpotNote u={s.get(scene.spotU)} />
      </Camera>
      <CloseLine u={s.get(scene.closeU)} />
    </>
  );
}
export const vizScene = () => scene;
