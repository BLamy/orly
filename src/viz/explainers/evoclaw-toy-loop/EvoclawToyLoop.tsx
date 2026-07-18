// arXiv:2607.09711 — "EvoClawBench" — Chapter 2: the measurement, recreated
// on a toy agent we actually simulate here (seeded, module scope).
// The benchmark's PostSkill pipeline: solve → compact first-run evidence
// (prompt, grading summary, output previews, transcript) → write skills →
// re-run in a FRESH workspace with the frozen skills.
// Toy sim (seed 5, 100 tasks each, verified in node):
//   baseline success 74/100 · with a GENERAL skill (encodes the check that
//   actually failed) 95/100 · with an OVER-SPECIFIED skill (bakes in fixture
//   assumptions that hold only ~60% of the time in the fresh workspace)
//   64/100 — WORSE than baseline. The paper's central failure mechanism,
//   reproduced at toy scale.
import {
  CAMERA_HOME,
  Camera,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Toy simulation (seed 5 — verified: 74 / 95 / 64)
// ---------------------------------------------------------------------------

const rand = mulberry32(5);
const N = 100;
const BASE: boolean[] = [];
const GOOD: boolean[] = [];
const OVER: boolean[] = [];
for (let i = 0; i < N; i++) {
  BASE.push(rand() < 0.7);
  GOOD.push(rand() < 0.9);
  const same = rand() < 0.6;
  OVER.push(rand() < (same ? 0.92 : 0.3));
}
const BASE_N = BASE.filter(Boolean).length; // 74
const GOOD_N = GOOD.filter(Boolean).length; // 95
const OVER_N = OVER.filter(Boolean).length; // 64

// the two candidate skills the toy agent might write from the same evidence
const GOOD_SKILL = [
  '# skill: robust-parse',
  'when: input format may drift',
  'step: sniff the delimiter first,',
  'then validate every row width',
];
const OVER_SKILL = [
  '# skill: parse-fixture-a',
  'the file is semicolon-separated,',
  'has 14 columns, header on line 3,',
  'and dates are day-first',
];

// evidence card
const EVIDENCE = [
  'first-run evidence (compact)',
  'grading: 3/5 sub-problems pass',
  'failure: row 812 width mismatch',
  'output preview + transcript tail',
];

const GRID_COLS = 25;
const CELL = 13;

const CAM_EVID: CameraState = { x: 320, y: 260, k: 1.35 };
const CAM_GRIDS: CameraState = { x: 860, y: 340, k: 1.15 };

function gridCell(gx: number, gy: number, i: number): { x: number; y: number } {
  return { x: gx + (i % GRID_COLS) * CELL, y: gy + Math.floor(i / GRID_COLS) * CELL };
}

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  evidU: ChannelRef<number>;
  forkU: ChannelRef<number>;
  baseU: ChannelRef<number>;
  goodU: ChannelRef<number>;
  overU: ChannelRef<number>;
  numsU: ChannelRef<number>;
  lessonU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const evidU = tl.channel('evidU', 0);
  const forkU = tl.channel('forkU', 0);
  const baseU = tl.channel('baseU', 0);
  const goodU = tl.channel('goodU', 0);
  const overU = tl.channel('overU', 0);
  const numsU = tl.channel('numsU', 0);
  const lessonU = tl.channel('lessonU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the evidence
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Watch the loop run on a toy agent we can fully simulate. It solves a parsing task, passes three of five checks, and gets back a compact evidence bundle: the grade, the failing row, a slice of its own transcript.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(cam, CAM_EVID, { at: 0.9, dur: 1.4, ease: ease.move });
  tl.tween(evidU, 1, { at: 1.7, dur: 2.6, ease: ease.linear });
  tl.hold(6.1, 0.7);

  // Beat 2 — the fork
  tl.caption({
    at: 6.8,
    dur: 5.8,
    text: 'From the same evidence, two very different skills can be written. One extracts the general lesson: sniff the format before parsing, validate every row. The other memorizes the fixture: fourteen columns, semicolons, header on line three.',
  });
  tl.tween(forkU, 1, { at: 7.8, dur: 1.6, ease: ease.enter });
  tl.caption({
    at: 12.9,
    dur: 4.4,
    text: 'Both look like learning. Both would pass a glance at the skill file. Only one survives a fresh workspace.',
  });
  tl.hold(17.3, 0.7);

  // Beat 3 — run the arms
  tl.caption({
    at: 18.0,
    dur: 5.6,
    text: 'So run all three arms, one hundred seeded toy tasks each. Baseline, no skill: seventy four succeed. With the general skill: ninety five. The loop can genuinely compound.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 18.2, dur: 1.3, ease: ease.move });
  tl.tween(cam, CAM_GRIDS, { at: 19.7, dur: 1.2, ease: ease.move });
  tl.tween(baseU, 1, { at: 19.0, dur: 2.2, ease: ease.linear });
  tl.tween(goodU, 1, { at: 21.4, dur: 2.2, ease: ease.linear });
  tl.caption({
    at: 24.2,
    dur: 5.8,
    text: 'Now the over specified skill — the one that memorized the fixture. In the fresh workspace its assumptions hold only some of the time, and when they break, the skill actively misleads. Sixty four. Worse than no skill at all.',
  });
  tl.tween(overU, 1, { at: 25.4, dur: 2.2, ease: ease.linear });
  tl.tween(numsU, 1, { at: 28.0, dur: 1.0, ease: ease.move });
  tl.hold(30.6, 0.7);

  // Beat 4 — the lesson
  tl.caption({
    at: 31.3,
    dur: 5.8,
    text: 'That is the benchmark measurement in miniature. Skill quality is invisible in the file and only shows up under transfer — which is exactly why the paper runs every skill in a fresh workspace and freezes it there.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 31.5, dur: 1.3, ease: ease.move });
  tl.tween(lessonU, 1, { at: 32.6, dur: 0.9, ease: ease.enter });
  tl.hold(36.7, 0.7);

  // Beat 5 — close
  tl.caption({
    at: 37.4,
    dur: 4.8,
    text: 'Our toy shows both endings are possible. The real question is which one frontier agents actually pick when they write their own skills. Next chapter: the measured answer.',
  });
  tl.tween(dimU, 1, { at: 37.7, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 38.6, dur: 1.0, ease: ease.enter });
  tl.hold(42.2, 1.2);

  return { tl, cam, titleU, evidU, forkU, baseU, goodU, overU, numsU, lessonU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/evoclaw-toy-loop/overrides.json',
  slug: 'evoclaw-toy-loop',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const evidU = s.get(scene.evidU);
  const forkU = s.get(scene.forkU);
  const baseU = s.get(scene.baseU);
  const goodU = s.get(scene.goodU);
  const overU = s.get(scene.overU);
  const numsU = s.get(scene.numsU);
  const lessonU = s.get(scene.lessonU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  const grids: Array<{ label: string; data: boolean[]; u: number; n: number; gy: number; c: string }> = [
    { label: 'baseline — no skill', data: BASE, u: baseU, n: BASE_N, gy: 150, c: colors.MUTED },
    { label: 'general skill', data: GOOD, u: goodU, n: GOOD_N, gy: 310, c: colors.POSITIVE },
    { label: 'over-specified skill', data: OVER, u: overU, n: OVER_N, gy: 470, c: colors.NEGATIVE },
  ];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* evidence card */}
          {evidU > 0 && (
            <g opacity={evidU * (1 - 0.6 * lessonU)}>
              <rect x={120} y={150} width={380} height={150} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} />
              {EVIDENCE.map((l, i) => {
                const u = clamp01(evidU * EVIDENCE.length - i);
                if (u <= 0) return null;
                return (
                  <text key={i} x={142} y={182 + i * 30} fill={i === 0 ? colors.ACCENT : colors.TEXT} fontSize={13} fontFamily={MONO} opacity={u}>
                    {l}
                  </text>
                );
              })}
            </g>
          )}

          {/* fork: the two skills */}
          {forkU > 0 && (
            <g opacity={forkU * (1 - 0.6 * lessonU)}>
              <line x1={310} y1={300} x2={220} y2={360} stroke={colors.GRID} strokeWidth={1.5} />
              <line x1={310} y1={300} x2={430} y2={360} stroke={colors.GRID} strokeWidth={1.5} />
              <rect x={90} y={366} width={260} height={124} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} />
              {GOOD_SKILL.map((l, i) => (
                <text key={i} x={106} y={394 + i * 24} fill={i === 0 ? colors.POSITIVE : colors.TEXT} fontSize={12} fontFamily={MONO}>
                  {l}
                </text>
              ))}
              <rect x={370} y={366} width={260} height={124} rx={10} fill={colors.PANEL} stroke={colors.NEGATIVE} />
              {OVER_SKILL.map((l, i) => (
                <text key={i} x={386} y={394 + i * 24} fill={i === 0 ? colors.NEGATIVE : colors.TEXT} fontSize={12} fontFamily={MONO}>
                  {l}
                </text>
              ))}
            </g>
          )}

          {/* the three arm grids */}
          {grids.map((g) =>
            g.u > 0 ? (
              <g key={g.label} opacity={1}>
                <text x={700} y={g.gy - 12} fill={colors.TEXT} fontSize={13} opacity={g.u}>
                  {g.label}
                </text>
                {g.data.map((win, i) => {
                  const u = clamp01(g.u * N - i);
                  if (u <= 0) return null;
                  const p = gridCell(700, g.gy, i);
                  return (
                    <rect key={i} x={p.x} y={p.y} width={CELL - 3} height={CELL - 3} rx={2}
                      fill={win ? colors.POSITIVE : colors.NEGATIVE}
                      opacity={win ? 0.75 : 0.55} />
                  );
                })}
                {numsU > 0 && (
                  <text x={1050} y={g.gy + 34} fill={g.c} fontSize={22} fontFamily={MONO} opacity={numsU}>
                    {g.n}/100
                  </text>
                )}
              </g>
            ) : null
          )}
          {baseU > 0 && (
            <text x={700} y={120} fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={baseU}>
              toy agent, seeded — ours, not the paper's models
            </text>
          )}

          {/* lesson chip */}
          {lessonU > 0 && (
            <g opacity={lessonU}>
              <rect x={110} y={540} width={520} height={64} rx={12} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={130} y={567} fill={colors.WARM} fontSize={14} fontWeight={600}>
                skill quality is invisible in the file
              </text>
              <text x={130} y={589} fill={colors.TEXT} fontSize={13}>
                it only shows up under transfer to a fresh workspace
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The loop, on a toy agent
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.09711 · PostSkill pipeline
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Both endings are possible
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            the general lesson compounds; the memorized fixture
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            drags below baseline — same evidence, opposite outcomes
          </text>
        </g>
      )}
    </>
  );
}

export function EvoclawToyLoop() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
