// Monday: Paste a Link
//
// Setup is one action: you hand it your app's address and go back to work.
// While you do, an agent wanders your app like a curious first-time visitor.
// Centerpiece: the app as a dark field of unexplored moments (a particle
// cloud) that lights up trail by trail, while a small "you" card stays busy
// at its own desk. The camera drifts between your desk and the field; by
// night the field is glowing.
// Illustrative: the grid, the walks and the night trails are seeded synthetic
// data, not a measured crawl of any real app. The HUD counts this synthetic
// field (416 moments, 6 day trails, 8 overnight trails).
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { ParticleCloud } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// The field of moments — a jittered grid over the right ~60% of the stage.
// Every dot is a moment someone could visit. All data is precomputed with a
// seeded PRNG; playback derives everything from two channels (day / night).
// ---------------------------------------------------------------------------

const FIELD = { x0: 500, y0: 84, x1: 1236, y1: 596 } as const;
const COLS = 26;
const ROWS = 16;

interface Moment {
  x: number;
  y: number;
  /** first index along the concatenated day path, or Infinity */
  dayAt: number;
  /** night activation order, 0..1 */
  nightAt: number;
}

const rand = mulberry32(20260713);

const GRID: { x: number; y: number }[] = (() => {
  const out: { x: number; y: number }[] = [];
  const dx = (FIELD.x1 - FIELD.x0) / (COLS - 1);
  const dy = (FIELD.y1 - FIELD.y0) / (ROWS - 1);
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      out.push({
        x: FIELD.x0 + i * dx + (rand() - 0.5) * dx * 0.55,
        y: FIELD.y0 + j * dy + (rand() - 0.5) * dy * 0.55,
      });
    }
  }
  return out;
})();

const idx = (i: number, j: number): number => j * COLS + i;

/** A random walk across the grid — one explored trail. */
function walk(si: number, sj: number, len: number): number[] {
  let i = si;
  let j = sj;
  const path = [idx(i, j)];
  for (let k = 0; k < len; k++) {
    const di = Math.floor(rand() * 3) - 1;
    const dj = Math.floor(rand() * 3) - 1;
    i = Math.max(0, Math.min(COLS - 1, i + (di === 0 && dj === 0 ? 1 : di)));
    j = Math.max(0, Math.min(ROWS - 1, j + dj));
    path.push(idx(i, j));
  }
  return path;
}

/** Six daytime trails, concatenated — the agent walks these in order. */
const DAY_TRAILS: number[][] = [
  walk(2, 8, 15),
  walk(6, 2, 14),
  walk(12, 12, 16),
  walk(18, 4, 15),
  walk(9, 7, 14),
  walk(22, 10, 16),
];
const DAY_PATH: number[] = DAY_TRAILS.flat();
/** index into DAY_PATH where each day trail begins */
const DAY_STARTS: number[] = DAY_TRAILS.map((_, i) => DAY_TRAILS.slice(0, i).reduce((a, p) => a + p.length, 0));

/** Eight more trails that arrive overnight. */
const NIGHT_TRAILS: number[][] = Array.from({ length: 8 }, () =>
  walk(Math.floor(rand() * COLS), Math.floor(rand() * ROWS), 18),
);

const MOMENTS: Moment[] = GRID.map((p, k) => {
  const first = DAY_PATH.indexOf(k);
  return {
    x: p.x,
    y: p.y,
    dayAt: first >= 0 ? first : Infinity,
    nightAt: rand(),
  };
});

/** Position along the day path at progress u (fractional lerp). */
function agentPos(u: number): { x: number; y: number } {
  const f = clamp01(u) * (DAY_PATH.length - 1);
  const i = Math.floor(f);
  const a = GRID[DAY_PATH[Math.min(i, DAY_PATH.length - 1)]];
  const b = GRID[DAY_PATH[Math.min(i + 1, DAY_PATH.length - 1)]];
  const t = f - i;
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Polyline `d` for a trail, revealed 0..1. */
function trailD(path: number[], u: number): string {
  if (u <= 0) return '';
  const n = 1 + clamp01(u) * (path.length - 1);
  const ni = Math.floor(n);
  const parts = [`M${GRID[path[0]].x.toFixed(1)} ${GRID[path[0]].y.toFixed(1)}`];
  for (let i = 1; i < ni && i < path.length; i++) {
    parts.push(`L${GRID[path[i]].x.toFixed(1)} ${GRID[path[i]].y.toFixed(1)}`);
  }
  if (ni < path.length && n > ni) {
    const t = n - ni;
    const a = GRID[path[ni - 1]];
    const b = GRID[path[ni]];
    parts.push(`L${(a.x + (b.x - a.x) * t).toFixed(1)} ${(a.y + (b.y - a.y) * t).toFixed(1)}`);
  }
  return parts.join('');
}

// ---------------------------------------------------------------------------
// The desk — a small panel where "you" stay busy all day.
// ---------------------------------------------------------------------------

const DESK = { x: 64, y: 210, w: 330, h: 250 } as const;
// deterministic "typing" line widths, a pure function of work progress
const deskLineW = (row: number, work: number): number =>
  0.25 + 0.7 * Math.abs(Math.sin(work * 9 + row * 1.7));

// camera marks
const CAM_DESK: CameraState = { x: 650, y: 330, k: 1.05 };
const CAM_FIELD: CameraState = { x: 830, y: 330, k: 1.25 };
const CAM_WIDE: CameraState = CAMERA_HOME;

/** 0 when the camera is on the desk, 1 when it is on the field. */
const cameraToField = (cam: CameraState): number => clamp01((cam.x - CAM_DESK.x) / (CAM_FIELD.x - CAM_DESK.x));

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  linkU: ChannelRef<number>;
  deskU: ChannelRef<number>;
  deskOp: ChannelRef<number>;
  work: ChannelRef<number>;
  fieldU: ChannelRef<number>;
  day: ChannelRef<number>;
  agentU: ChannelRef<number>;
  night: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const linkU = tl.channel('linkU', 0);
  const deskU = tl.channel('deskU', 0);
  const deskOp = tl.channel('deskOp', 1);
  const work = tl.channel('work', 0);
  const fieldU = tl.channel('fieldU', 0);
  const day = tl.channel('day', 0);
  const agentU = tl.channel('agentU', 0);
  const night = tl.channel('night', 0);

  // — Beat 1 · one action —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: "Monday morning. Setting this up is one action: you paste your app's address, and that's it.",
  });
  tl.tween(deskU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_DESK, { at: 0.6, dur: 1.4, ease: ease.move });
  tl.tween(linkU, 1, { at: 2.2, dur: 1.6, ease: ease.move });

  // — Beat 2 · back to work —
  tl.caption({
    at: 7.5,
    dur: 5.5,
    text: 'Then you go back to your real work. No scripts to write, no tests to record.',
  });
  tl.tween(linkU, 0, { at: 8.0, dur: 0.8, ease: ease.move });
  tl.tween(work, 1, { at: 8.0, dur: 66, ease: ease.linear });
  tl.hold(13.0, 0.6);

  // — Beat 3 · the dark field —
  tl.caption({
    at: 13.6,
    dur: 7,
    text: 'Think of your app as a dark field. Every dot is a moment someone could visit — a page, a button, a form.',
  });
  tl.tween(cam, CAM_FIELD, { at: 13.8, dur: 1.6, ease: ease.move });
  tl.tween(fieldU, 1, { at: 14.4, dur: 2.4, ease: ease.draw });
  tl.hold(20.6, 0.8);

  // — Beat 4 · the agent arrives —
  tl.caption({
    at: 21.4,
    dur: 6,
    text: 'While you work, an agent opens your app in a real browser and starts to wander.',
  });
  tl.tween(agentU, 1, { at: 22.0, dur: 0.7, ease: ease.pop });
  tl.tween(day, 0.34, { at: 22.6, dur: 9, ease: ease.linear });

  // — Beat 5 · curious first-time visitor —
  tl.caption({
    at: 27.8,
    dur: 6.5,
    text: 'It behaves like a curious first-time visitor. It clicks around, fills in forms, tries to check out.',
  });
  tl.tween(day, 0.62, { at: 31.6, dur: 8, ease: ease.linear });

  // — Beat 6 · trails —
  tl.caption({
    at: 34.8,
    dur: 5.5,
    text: 'Every path it walks lights up a trail across the field.',
  });
  tl.tween(day, 1, { at: 39.6, dur: 10, ease: ease.linear });

  // — Beat 7 · glance back at the desk —
  tl.caption({
    at: 41.0,
    dur: 5.5,
    text: "You haven't looked up once. Your afternoon is still your own.",
  });
  tl.tween(cam, CAM_DESK, { at: 41.2, dur: 1.4, ease: ease.move });
  tl.hold(46.5, 0.6);

  // — Beat 8 · it keeps going —
  tl.caption({
    at: 47.1,
    dur: 6,
    text: "By the time you leave, it's still exploring. It doesn't get bored, and it doesn't go home.",
  });
  tl.tween(cam, CAM_WIDE, { at: 47.3, dur: 1.6, ease: ease.move });
  tl.tween(deskOp, 0.12, { at: 49.6, dur: 1.4, ease: ease.move });

  // — Beat 9 · overnight —
  tl.caption({
    at: 53.6,
    dur: 7,
    text: 'Overnight, the trails keep coming. Come back tomorrow — the whole field will be glowing.',
  });
  tl.tween(deskOp, 0, { at: 53.8, dur: 1.2, ease: ease.move }); // no ghost sliver in the night frame
  tl.tween(cam, CAM_FIELD, { at: 54.0, dur: 2.0, ease: ease.move });
  tl.tween(night, 1, { at: 54.4, dur: 6.6, ease: ease.linear });
  tl.hold(61.0, 1.4);

  return { tl, cam, linkU, deskU, deskOp, work, fieldU, day, agentU, night };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function computeParticles(s: SceneState) {
  const fieldU = s.get(scene.fieldU);
  const day = s.get(scene.day);
  const night = s.get(scene.night);
  const dayIdx = day * (DAY_PATH.length - 1);
  return MOMENTS.map((m, k) => {
    const appear = clamp01(fieldU * 1.5 - (k / MOMENTS.length) * 0.5);
    const dayLit = m.dayAt === Infinity ? 0 : clamp01((dayIdx - m.dayAt) * 0.5);
    const nightLit = clamp01((night - m.nightAt) * 5);
    const lit = Math.max(dayLit, nightLit * 0.9);
    return {
      x: m.x,
      y: m.y,
      r: 2 + 2.4 * lit,
      // unlit moments stay visible enough to read as a field, not as dust
      alpha: appear * (0.34 + 0.66 * lit),
      color: lit > 0.02 ? colors.ACCENT : colors.MUTED,
    };
  });
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const deskU = s.get(scene.deskU);
  const deskOp = s.get(scene.deskOp);
  const linkU = s.get(scene.linkU);
  const work = s.get(scene.work);
  const fieldU = s.get(scene.fieldU);
  const day = s.get(scene.day);
  const agentU = s.get(scene.agentU);
  const night = s.get(scene.night);

  const ap = agentPos(day);
  const dayIdx = day * (DAY_PATH.length - 1);
  const particles = computeParticles(s);
  const reached = particles.filter((p) => p.color === colors.ACCENT).length;
  const dayWalked = DAY_STARTS.filter((st) => dayIdx > st).length;
  const nightWalked = NIGHT_TRAILS.filter((_, i) => night * (NIGHT_TRAILS.length + 2) - i > 0).length;
  // the desk leaves the frame as the camera moves from the desk to the field
  const deskVis = deskU * deskOp * (1 - cameraToField(cam));
  // the moon rises with the night trails
  const moonU = clamp01(night * 4);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the field of moments */}
        <g opacity={fieldU}>
          <text x={FIELD.x0} y={FIELD.y0 - 22} textAnchor="start" fill={colors.MUTED} fontSize={15} fontStyle="italic">
            your app — every dot, a moment
          </text>
        </g>
        {/* soft halo under every lit moment, so the night field reads as glowing */}
        {particles.map((p, k) =>
          p.color === colors.ACCENT ? <circle key={`g${k}`} cx={p.x} cy={p.y} r={10} fill={colors.ACCENT} opacity={0.14 * p.alpha} /> : null,
        )}
        <ParticleCloud state={s} compute={computeParticles} />

        {/* day trails, revealed as the agent covers them */}
        {DAY_TRAILS.map((t, i) => {
          const start = DAY_STARTS[i];
          const u = clamp01((dayIdx - start) / (t.length - 1));
          return u > 0 ? (
            <path key={`d${i}`} d={trailD(t, u)} fill="none" stroke={colors.ACCENT} strokeWidth={1.8} strokeLinejoin="round" opacity={0.5} />
          ) : null;
        })}
        {/* night trails */}
        {NIGHT_TRAILS.map((t, i) => {
          const u = clamp01(night * (NIGHT_TRAILS.length + 2) - i);
          return u > 0 ? (
            <path key={`n${i}`} d={trailD(t, u)} fill="none" stroke={colors.TEAL} strokeWidth={1.6} strokeLinejoin="round" opacity={0.3} />
          ) : null;
        })}

        {/* the agent — a small browser dot walking the field */}
        {agentU > 0 && day < 1 && (
          <g opacity={agentU * cameraToField(cam)}>
            <circle cx={ap.x} cy={ap.y} r={18} fill={colors.WARM} opacity={0.2} />
            <circle cx={ap.x} cy={ap.y} r={9} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.5} />
            <text x={ap.x} y={ap.y - 18} textAnchor="middle" fill={colors.WARM} fontSize={14}>
              agent
            </text>
          </g>
        )}

        {/* your desk */}
        {deskVis > 0.01 && (
          <g opacity={deskVis}>
            <rect x={DESK.x} y={DESK.y} width={DESK.w} height={DESK.h} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={DESK.x + 24} y={DESK.y + 38} fill={colors.TEXT} fontSize={17}>
              you
            </text>
            <text x={DESK.x + 24} y={DESK.y + 60} fill={colors.MUTED} fontSize={14} fontStyle="italic">
              your actual work
            </text>
            {[0, 1, 2, 3, 4].map((row) => (
              <rect
                key={row}
                x={DESK.x + 24}
                y={DESK.y + 86 + row * 28}
                width={(DESK.w - 48) * deskLineW(row, work)}
                height={10}
                rx={5}
                fill={colors.MUTED}
                opacity={0.45}
              />
            ))}
            {/* the pasted link — one action, then gone */}
            <g opacity={linkU}>
              <rect x={DESK.x + 20} y={DESK.y - 54} width={DESK.w - 40} height={40} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
              <rect x={DESK.x + 34} y={DESK.y - 40} width={(DESK.w - 96) * linkU} height={12} rx={6} fill={colors.ACCENT} opacity={0.8} />
              <text x={DESK.x + DESK.w - 34} y={DESK.y - 30} textAnchor="end" fill={colors.ACCENT} fontSize={14}>
                ⏎
              </text>
            </g>
          </g>
        )}
      </Camera>

      {/* the moon — screen-anchored so the camera never crops it */}
      <g opacity={moonU}>
        <circle cx={1196} cy={56} r={16} fill={colors.TEXT} opacity={0.85} />
        <circle cx={1204} cy={48} r={14} fill={colors.BG} />
      </g>

      {/* running tally of the field, in screen space: concrete numbers for the night */}
      {fieldU > 0.01 && (
        <>
          <g opacity={fieldU} fontSize={14} fill={colors.MUTED}>
            <text x={24} y={30}>
              moments reached {reached} / {MOMENTS.length}
            </text>
            <text x={24} y={50}>
              day trails {dayWalked} / {DAY_TRAILS.length} · night {nightWalked} / {NIGHT_TRAILS.length}
            </text>
          </g>
          {/* what the picture means, bottom-left where the field never reaches; says the field is illustrative */}
          <g opacity={fieldU} fontSize={14} fill={colors.MUTED}>
            <text x={16} y={552}>dot: a moment you could visit</text>
            <text x={16} y={572}>line: a recorded walk</text>
            <text x={16} y={592}>a re-walk replays one line</text>
            <text x={16} y={612} fontStyle="italic">illustrative: synthetic data</text>
          </g>
        </>
      )}
    </>
  );
}

export const vizScene = () => scene;
