// arXiv:2607.09711 — "EvoClawBench: Can Agents Learn Reusable Skills from
// Their Own Runs?" (July 2026). Chapter 1: the question and the benchmark.
// Operational definition of a skill: a lightweight procedural document in
// SKILL.md format (plus optional scripts/references), injected into context —
// no retraining. Immutability enforced by before/after hashing. Suite: 100
// tasks, 502 sub-problems (coding, data, office, security, ops, documents).
// Three modes: Baseline (skills forbidden), PreSkill (author skills first,
// fresh workspace executes with only those skills), PostSkill (solve, get
// compact first-run evidence, write skills, re-run fresh).
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

// the SKILL.md card
const SKILL_LINES = [
  '# SKILL.md',
  'name: csv-normalize',
  'when: columns drift or delimiters vary',
  'steps:',
  '  1. sniff delimiter before parsing',
  '  2. validate row width, log rejects',
  'scripts: normalize.py',
];

const MODES = [
  { name: 'Baseline', desc: 'solve directly — skill creation forbidden', c: colors.MUTED },
  { name: 'PreSkill', desc: 'author skills first, then a fresh workspace runs with only them', c: colors.SECONDARY },
  { name: 'PostSkill', desc: 'solve once, read the run evidence, write skills, re-run fresh', c: colors.ACCENT },
];

const CARD_X = 120;
const CARD_Y = 170;
const CARD_W = 400;
const LINE_H = 30;

const MODE_X = 620;
const MODE_Y = 170;
const MODE_W = 560;
const MODE_H = 92;

const CAM_SKILL: CameraState = { x: CARD_X + CARD_W / 2, y: 300, k: 1.4 };
const CAM_MODES: CameraState = { x: MODE_X + MODE_W / 2, y: 320, k: 1.2 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  hookU: ChannelRef<number>;
  skillU: ChannelRef<number>;
  hashU: ChannelRef<number>;
  modesU: ChannelRef<number>;
  suiteU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const hookU = tl.channel('hookU', 0);
  const skillU = tl.channel('skillU', 0);
  const hashU = tl.channel('hashU', 0);
  const modesU = tl.channel('modesU', 0);
  const suiteU = tl.channel('suiteU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the seductive idea
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'Here is the most seductive idea in agent engineering right now. An agent finishes a task, looks back at its own run, and writes down what it learned — so the next run starts smarter. Compounding, for free.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(hookU, 1, { at: 1.4, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 6.5,
    dur: 4.6,
    text: 'This benchmark asks the cold version of the question: does that actually work? Not in principle. Measured.',
  });
  tl.hold(11.1, 0.7);

  // Beat 2 — what a skill operationally is
  tl.caption({
    at: 11.8,
    dur: 5.8,
    text: 'First it pins down what a skill even is. Operationally: a small procedural document — a name, a trigger, numbered steps, maybe a helper script. Injected into context. No retraining anywhere.',
  });
  tl.tween(cam, CAM_SKILL, { at: 12.1, dur: 1.4, ease: ease.move });
  tl.tween(skillU, 1, { at: 12.9, dur: 3.0, ease: ease.linear });
  tl.caption({
    at: 17.9,
    dur: 4.8,
    text: 'And skills are frozen during reuse — the harness hashes each file before and after, so an agent cannot quietly rewrite its skills while solving. What you wrote is what you run with.',
  });
  tl.tween(hashU, 1, { at: 19.2, dur: 0.8, ease: ease.enter });
  tl.hold(22.7, 0.7);

  // Beat 3 — the three modes
  tl.caption({
    at: 23.4,
    dur: 5.6,
    text: 'Then it isolates the loop with three modes. Baseline: just solve, no skills allowed. Pre skill: write your skills first, from the task description alone, and hand them to a fresh copy of yourself.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 23.6, dur: 1.3, ease: ease.move });
  tl.tween(cam, CAM_MODES, { at: 25.1, dur: 1.2, ease: ease.move });
  tl.tween(modesU, 0.67, { at: 24.4, dur: 2.6, ease: ease.linear });
  tl.caption({
    at: 29.5,
    dur: 5.4,
    text: 'And post skill — the compounding dream itself. Solve the task once, receive compact evidence of your own run, write skills from it, and execute again in a fresh workspace.',
  });
  tl.tween(modesU, 1, { at: 30.3, dur: 1.2, ease: ease.enter });
  tl.hold(34.9, 0.7);

  // Beat 4 — the suite
  tl.caption({
    at: 35.6,
    dur: 5.4,
    text: 'The arena is broad on purpose: one hundred tasks, five hundred two graded sub problems — coding, data transformation, office workflows, security review, operations, document extraction.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 35.8, dur: 1.3, ease: ease.move });
  tl.tween(suiteU, 1, { at: 36.8, dur: 1.2, ease: ease.enter });
  tl.hold(41.0, 0.7);

  // Beat 5 — close
  tl.caption({
    at: 41.7,
    dur: 5.2,
    text: 'Same tasks, same models, the only variable is the skill loop. If learning from your own runs works, it has nowhere to hide. And if it fails, we get to see exactly how.',
  });
  tl.tween(dimU, 1, { at: 42.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 42.9, dur: 1.0, ease: ease.enter });
  tl.hold(46.9, 1.2);

  return { tl, cam, titleU, hookU, skillU, hashU, modesU, suiteU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/evoclaw-question/overrides.json',
  slug: 'evoclaw-question',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const hookU = s.get(scene.hookU);
  const skillU = s.get(scene.skillU);
  const hashU = s.get(scene.hashU);
  const modesU = s.get(scene.modesU);
  const suiteU = s.get(scene.suiteU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the loop hook */}
          {hookU > 0 && (
            <g opacity={hookU * (1 - 0.75 * skillU)}>
              {['run the task', 'read the run', 'write a skill', 'run smarter'].map((t, i) => {
                const cx = 640 + 220 * Math.cos((i / 4) * Math.PI * 2 - Math.PI / 2);
                const cy = 330 + 140 * Math.sin((i / 4) * Math.PI * 2 - Math.PI / 2);
                return (
                  <g key={t}>
                    <rect x={cx - 78} y={cy - 22} width={156} height={44} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} />
                    <text x={cx} y={cy + 5} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
                      {t}
                    </text>
                  </g>
                );
              })}
              <text x={640} y={336} textAnchor="middle" fill={colors.WARM} fontSize={17} fontWeight={600}>
                does this loop compound?
              </text>
            </g>
          )}

          {/* SKILL.md card */}
          {skillU > 0 && (
            <g opacity={skillU}>
              <rect x={CARD_X} y={CARD_Y} width={CARD_W} height={44 + SKILL_LINES.length * LINE_H} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              {SKILL_LINES.map((l, i) => {
                const u = clamp01(skillU * SKILL_LINES.length - i);
                if (u <= 0) return null;
                return (
                  <text key={i} x={CARD_X + 22} y={CARD_Y + 40 + i * LINE_H} fill={i === 0 ? colors.ACCENT : colors.TEXT} fontSize={14} fontFamily={MONO} opacity={u}>
                    {l}
                  </text>
                );
              })}
              {hashU > 0 && (
                <g opacity={hashU}>
                  <rect x={CARD_X + 8} y={CARD_Y - 38} width={310} height={28} rx={8} fill={colors.SECONDARY} opacity={0.14} />
                  <text x={CARD_X + 20} y={CARD_Y - 19} fill={colors.SECONDARY} fontSize={13} fontFamily={MONO}>
                    sha256 before == sha256 after · immutable
                  </text>
                </g>
              )}
            </g>
          )}

          {/* modes */}
          {MODES.map((m, i) => {
            const u = clamp01(modesU * MODES.length - i);
            if (u <= 0) return null;
            const y = MODE_Y + i * (MODE_H + 22);
            return (
              <g key={m.name} opacity={u}>
                <rect x={MODE_X} y={y} width={MODE_W} height={MODE_H} rx={12} fill={colors.PANEL} stroke={m.c} />
                <text x={MODE_X + 22} y={y + 34} fill={m.c} fontSize={16} fontWeight={600}>
                  {m.name}
                </text>
                <text x={MODE_X + 22} y={y + 62} fill={colors.TEXT} fontSize={13}>
                  {m.desc}
                </text>
              </g>
            );
          })}

          {/* suite chip */}
          {suiteU > 0 && (
            <g opacity={suiteU}>
              <rect x={330} y={560} width={620} height={44} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={640} y={588} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
                100 tasks · 502 sub-problems · 2 runtimes · 5 models
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Skills from their own runs
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2607.09711
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            The compounding dream, made measurable
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            a skill is a frozen procedural file; the loop is isolated in
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            three modes — solve, author-first, or learn from your own evidence
          </text>
          <text x={640} y={400} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="monospace">
            EvoClawBench · arXiv:2607.09711
          </text>
        </g>
      )}
    </>
  );
}

export function EvoclawQuestion() {
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
