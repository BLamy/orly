// arXiv:2606.30616 — "Scaling the Horizon, Not the Parameters" (Agents-A1).
// Chapter 3: the three-stage training recipe.
// Stage 1: full-domain SFT on ~100K harness trajectories (cross-entropy on
// response tokens). Stage 2: domain-level teachers, trained with SFT + GRPO
// reinforcement learning per domain (search, science, instruction following,
// tool calling). Stage 3: multi-teacher ON-POLICY domain-routed distillation
// with salient vocabulary alignment (SVA) — a truncated reverse KL evaluated
// on teacher-selected token support, with domain-normalized weighting.
// Six domains: long-horizon search, ML engineering, scientific reasoning,
// instruction following, tool calling, general agentic tasks.
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
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

// ---------------------------------------------------------------------------
// Layout — teachers arc above, student below, packets route domain-wise
// ---------------------------------------------------------------------------

const DOMAINS = [
  'long-horizon search',
  'ML engineering',
  'scientific reasoning',
  'instruction following',
  'tool calling',
  'general agentic',
];

const T_Y = 200;
const T_W = 178;
const T_H = 58;
const T_XS = DOMAINS.map((_, i) => 90 + i * 188);

const STUDENT = { x: 640, y: 470 };

const CAM_STAGES: CameraState = { x: 640, y: 160, k: 1.25 };
const CAM_STUDENT: CameraState = { x: 640, y: 420, k: 1.3 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  stage1U: ChannelRef<number>;
  teachersU: ChannelRef<number>;
  grpoU: ChannelRef<number>;
  studentU: ChannelRef<number>;
  flowU: ChannelRef<number>; // distillation packets
  svaU: ChannelRef<number>;
  routeU: ChannelRef<number>; // domain routing highlight
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const stage1U = tl.channel('stage1U', 0);
  const teachersU = tl.channel('teachersU', 0);
  const grpoU = tl.channel('grpoU', 0);
  const studentU = tl.channel('studentU', 0);
  const flowU = tl.channel('flowU', 0);
  const svaU = tl.channel('svaU', 0);
  const routeU = tl.channel('routeU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — stage 1
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'The harness generates the curriculum. Stage one: supervised fine tuning on roughly one hundred thousand of those tree trajectories, spanning research, coding, science, instruction following, and general agent work.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.7, ease: ease.enter });
  tl.tween(stage1U, 1, { at: 1.4, dur: 1.2, ease: ease.enter });
  tl.hold(6.1, 0.7);

  // Beat 2 — teachers
  tl.caption({
    at: 6.8,
    dur: 5.8,
    text: 'One generalist cannot be the best at everything at once, so stage two forks it. Specialist teachers are trained per domain with supervised tuning plus reinforcement learning — each one free to overfit its own craft.',
  });
  tl.tween(cam, CAM_STAGES, { at: 7.1, dur: 1.4, ease: ease.move });
  tl.tween(teachersU, 1, { at: 7.8, dur: 3.0, ease: ease.linear });
  tl.tween(grpoU, 1, { at: 11.0, dur: 0.8, ease: ease.enter });
  tl.hold(12.6, 0.7);

  // Beat 3 — the student and routed distillation
  tl.caption({
    at: 13.3,
    dur: 5.8,
    text: 'Stage three folds the specialists back into one thirty five billion parameter student. As the student practices, each trajectory is routed to the teacher who owns that domain — and the student is graded against that teacher.',
  });
  tl.tween(cam, CAM_STUDENT, { at: 13.6, dur: 1.4, ease: ease.move });
  tl.tween(studentU, 1, { at: 14.4, dur: 0.8, ease: ease.enter });
  tl.tween(flowU, 1, { at: 15.4, dur: 3.2, ease: ease.linear });
  tl.hold(19.1, 0.6);

  // Beat 4 — SVA
  tl.caption({
    at: 19.7,
    dur: 6.0,
    text: 'The grading is the clever part. Instead of matching the teacher everywhere, the loss only looks at the tokens the teacher itself considers salient — a truncated reverse divergence on the teachers chosen support.',
  });
  tl.tween(svaU, 1, { at: 21.0, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 26.1,
    dur: 5.2,
    text: 'That keeps six very different teachers from shouting over each other: each one only pulls the student on the vocabulary that matters for its domain, with the domains weighted evenly.',
  });
  tl.tween(routeU, 1, { at: 27.2, dur: 2.0, ease: ease.move });
  tl.hold(31.3, 0.7);

  // Beat 5 — why this beats just going bigger
  tl.caption({
    at: 32.0,
    dur: 5.6,
    text: 'Notice what was traded. A trillion parameter model stores breadth in weights. This recipe stores breadth in teachers, then compresses the parts that matter back into a model thirty times smaller.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 32.2, dur: 1.4, ease: ease.move });
  tl.hold(37.6, 0.6);

  // Beat 6 — close
  tl.caption({
    at: 38.2,
    dur: 5.2,
    text: 'Harness makes trajectories, trajectories make teachers, teachers make one small student. The next chapter asks the honest question: where does this hold up, and where does it not?',
  });
  tl.tween(dimU, 1, { at: 38.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 39.4, dur: 1.0, ease: ease.enter });
  tl.hold(43.4, 1.2);

  return {
    tl, cam, titleU, stage1U, teachersU, grpoU, studentU,
    flowU, svaU, routeU, dimU, closeU,
  };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/horizon-distillation/overrides.json',
  slug: 'horizon-distillation',
};

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const stage1U = s.get(scene.stage1U);
  const teachersU = s.get(scene.teachersU);
  const grpoU = s.get(scene.grpoU);
  const studentU = s.get(scene.studentU);
  const flowU = s.get(scene.flowU);
  const svaU = s.get(scene.svaU);
  const routeU = s.get(scene.routeU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* stage 1 banner */}
          {stage1U > 0 && (
            <g opacity={stage1U * (1 - 0.5 * teachersU)}>
              <rect x={340} y={92} width={600} height={40} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={640} y={118} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontFamily={MONO}>
                stage 1 · SFT on ~100K harness trajectories
              </text>
            </g>
          )}

          {/* teachers */}
          {DOMAINS.map((d, i) => {
            const u = clamp01(teachersU * DOMAINS.length - i);
            if (u <= 0) return null;
            const x = T_XS[i];
            const hot = routeU > 0 && i === Math.min(5, Math.floor(routeU * 6));
            return (
              <g key={d} opacity={u}>
                <rect x={x} y={T_Y} width={T_W} height={T_H} rx={10}
                  fill={colors.PANEL} stroke={hot ? colors.WARM : colors.SECONDARY}
                  strokeWidth={hot ? 2 : 1} />
                <text x={x + T_W / 2} y={T_Y + 24} textAnchor="middle" fill={colors.TEXT} fontSize={12} fontWeight={600}>
                  teacher {i + 1}
                </text>
                <text x={x + T_W / 2} y={T_Y + 43} textAnchor="middle" fill={colors.MUTED} fontSize={11}>
                  {d}
                </text>
              </g>
            );
          })}
          {grpoU > 0 && (
            <text x={640} y={T_Y - 16} textAnchor="middle" fill={colors.SECONDARY} fontSize={12} fontFamily={MONO} opacity={grpoU}>
              stage 2 · per-domain SFT + GRPO reinforcement learning
            </text>
          )}

          {/* distillation flows */}
          {studentU > 0 &&
            DOMAINS.map((_, i) => {
              const u = clamp01(flowU * DOMAINS.length - i);
              if (u <= 0) return null;
              const x0 = T_XS[i] + T_W / 2;
              const y0 = T_Y + T_H;
              const px = x0 + (STUDENT.x - x0) * u;
              const py = y0 + (STUDENT.y - 40 - y0) * u;
              return (
                <g key={i}>
                  <line x1={x0} y1={y0} x2={px} y2={py} stroke={colors.GRID} strokeWidth={1.2} opacity={0.6} />
                  <circle cx={px} cy={py} r={5} fill={colors.WARM} opacity={u < 1 ? 0.9 : 0} />
                </g>
              );
            })}

          {/* the student */}
          {studentU > 0 && (
            <g opacity={studentU}>
              <circle cx={STUDENT.x} cy={STUDENT.y} r={54} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
              <text x={STUDENT.x} y={STUDENT.y - 4} textAnchor="middle" fill={colors.TEXT} fontSize={15} fontWeight={600}>
                Agents-A1
              </text>
              <text x={STUDENT.x} y={STUDENT.y + 18} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                35B MoE
              </text>
              <text x={STUDENT.x} y={STUDENT.y + 84} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
                stage 3 · multi-teacher domain-routed distillation
              </text>
            </g>
          )}

          {/* SVA math */}
          {svaU > 0 && (
            <g opacity={svaU}>
              <rect x={900} y={400} width={330} height={130} rx={12} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
              <text x={920} y={430} fill={colors.SECONDARY} fontSize={13} fontWeight={600} fontFamily={MONO}>
                salient vocabulary alignment
              </text>
              <MathLabel
                tex={'\\mathcal{L}_{\\mathrm{SVA}} = \\mathrm{KL}_{\\mathrm{rev}}^{\\mathrm{trunc}}\\big(q_{\\theta}\\,\\|\\,p_{T}\\big)\\Big|_{\\mathrm{supp}(p_T)}'}
                x={1060}
                y={470}
                fontSize={15}
                color={colors.TEXT}
              />
              <text x={920} y={512} fill={colors.MUTED} fontSize={11}>
                reverse KL, truncated to teacher-selected tokens
              </text>
            </g>
          )}
        </Camera>
      </g>

      {/* screen-fixed */}
      <g opacity={titleU * mainOp}>
        <text x={40} y={54} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Six teachers, one small student
        </text>
        <text x={40} y={80} fill={colors.MUTED} fontSize={15} fontFamily="monospace">
          arXiv:2606.30616 · training recipe
        </text>
      </g>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={210} y={230} width={860} height={190} rx={14} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={298} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            Breadth lives in teachers, not in weights
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            harness → trajectories → specialist teachers → one 35B student,
          </text>
          <text x={640} y={364} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            each teacher pulling only on the tokens its domain cares about
          </text>
        </g>
      )}
    </>
  );
}

export function HorizonDistillation() {
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
