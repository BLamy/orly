// Training T-Rex — chapter 4: Let the Solver Keep Score.
//
// Grounded in or_benchmark_eval/scripts/run_eval.sh,
// evaluation/bench4opt/run_evaluation_solver.py,
// evaluation/optibench/run_evaluation_solver.py, or_benchmark_eval/README.md,
// and the repository README's reported comparison. The default runner targets
// NL4OPT, OptiBench, B40 feasible, and B40 ORGEval; solver paths execute or
// validate Gurobi-compatible Python. The README reports 71.81% average
// zero-shot Pass@1, +3.98 points over GPT-5.4-Mini and +11.27 over base
// DeepSeek-V4-Flash.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const BENCHES = ['NL4OPT', 'OptiBench', 'B40 feasible', 'B40 ORGEval'];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const problemU = tl.channel('problemU', 0);
  const codeU = tl.channel('codeU', 0);
  const planeU = tl.channel('planeU', 0);
  const candidate = tl.channel('candidate', 0);
  const rejectU = tl.channel('rejectU', 0);
  const validU = tl.channel('validU', 0);
  const benchesU = tl.channel('benchesU', 0);
  const configU = tl.channel('configU', 0);
  const scoreU = tl.channel('scoreU', 0);
  const recapU = tl.channel('recapU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.5, text: 'The final test starts with a natural-language optimization problem: variables, an objective, and constraints hidden in prose.' });
  tl.tween(problemU, 1, { at: 0.9, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 410, y: 330, k: 1.18 }, { at: 1.2, dur: 1.4, ease: ease.move });
  tl.hold(6.0, 0.5);

  tl.caption({ at: 6.5, dur: 5.2, text: 'The benchmark prompts ask the model for executable Python compatible with Gurobi, not a persuasive paragraph.' });
  tl.tween(codeU, 1, { at: 7.1, dur: 1.3, ease: ease.move });
  tl.hold(11.7, 0.5);

  tl.caption({ at: 12.2, dur: 5.3, text: 'Picture the constraints as a feasible region. A plausible answer can still land outside it.' });
  tl.tween(cam, { x: 725, y: 355, k: 1.2 }, { at: 12.4, dur: 1.4, ease: ease.move });
  tl.tween(planeU, 1, { at: 12.8, dur: 1.5, ease: ease.draw });
  tl.tween(candidate, 1, { at: 14.1, dur: 1.0, ease: ease.move });
  tl.hold(17.5, 0.5);

  tl.caption({ at: 18.0, dur: 5.1, text: 'Text similarity might applaud. Solver execution does not: infeasible variables and a wrong objective produce a red verdict.' });
  tl.tween(rejectU, 1, { at: 18.6, dur: 0.7, ease: ease.pop });
  tl.hold(23.1, 0.5);

  tl.caption({ at: 23.6, dur: 5.3, text: 'A valid formulation satisfies the constraints and reaches the reference objective. The point lands inside the region.' });
  tl.tween(candidate, 2, { at: 24.2, dur: 1.5, ease: ease.move });
  tl.tween(rejectU, 0, { at: 24.3, dur: 0.7, ease: ease.move });
  tl.tween(validU, 1, { at: 25.4, dur: 0.6, ease: ease.pop });
  tl.hold(28.9, 0.5);

  tl.caption({ at: 29.4, dur: 5.7, text: 'The same gate runs across four default targets: N-L-four-Opt, Opti Bench, B-forty feasible, and B-forty O-R-G-Eval.' });
  tl.tween(cam, CAMERA_HOME, { at: 29.7, dur: 1.4, ease: ease.move });
  tl.tween(benchesU, 1, { at: 30.2, dur: 2.0, ease: ease.enter });
  tl.hold(35.1, 0.5);

  tl.caption({ at: 35.6, dur: 5.1, text: 'The runner fixes the random seed at forty-two and exposes temperature, sampling, concurrency, and few-shot controls.' });
  tl.tween(configU, 1, { at: 36.2, dur: 1.0, ease: ease.enter });
  tl.hold(40.7, 0.5);

  tl.caption({ at: 41.2, dur: 5.0, text: 'What survives becomes Pass at one: did the first generated formulation actually solve the task?' });
  tl.tween(scoreU, 0.4, { at: 41.8, dur: 1.3, ease: ease.draw });
  tl.hold(46.2, 0.5);

  tl.caption({ at: 46.7, dur: 5.7, text: 'The report records seventy-one point eight one percent average zero-shot Pass at one across those four benchmarks.' });
  tl.tween(scoreU, 1, { at: 47.3, dur: 1.6, ease: ease.move });
  tl.hold(52.4, 0.5);

  tl.caption({ at: 52.9, dur: 7.2, text: 'A structured example becomes training data, crosses the sharded machine, shares one shuffle, and finally meets a solver. The verdict closes the loop.' });
  tl.tween(recapU, 1, { at: 53.4, dur: 2.2, ease: ease.linear });
  tl.tween(dimU, 1, { at: 56.0, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 56.8, dur: 0.8, ease: ease.enter });
  tl.hold(60.1, 1.0);

  return { tl, cam, problemU, codeU, planeU, candidate, rejectU, validU, benchesU, configU, scoreU, recapU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const problemU = s.get(scene.problemU);
  const codeU = s.get(scene.codeU);
  const planeU = s.get(scene.planeU);
  const candidate = s.get(scene.candidate);
  const benchesU = s.get(scene.benchesU);
  const scoreU = s.get(scene.scoreU);
  const recapU = s.get(scene.recapU);
  const mainOpacity = 1 - 0.86 * s.get(scene.dimU);
  const p0 = { x: 1008, y: 220 };
  const p1 = { x: 920, y: 390 };
  const p2 = { x: 790, y: 465 };
  const c = candidate < 1 ? { x: 760 + (p0.x - 760) * candidate, y: 500 + (p0.y - 500) * candidate } : { x: p0.x + (p1.x - p0.x) * (candidate - 1), y: p0.y + (p1.y - p0.y) * (candidate - 1) };

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <text x={640} y={70} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={700}>The solver is the critic</text>
          <text x={640} y={96} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>or_benchmark_eval/scripts/run_eval.sh</text>

          {problemU > 0 && (
            <g opacity={problemU}>
              <rect x={90} y={155} width={390} height={270} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={115} y={192} fill={colors.ACCENT} fontSize={14} fontWeight={700}>Capital budgeting problem</text>
              <text x={115} y={228} fill={colors.TEXT} fontSize={12}>maximize net present value</text>
              <text x={115} y={256} fill={colors.TEXT} fontSize={12}>subject to budget and risk limits</text>
              <text x={115} y={284} fill={colors.TEXT} fontSize={12}>respect project dependencies</text>
              <text x={115} y={327} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>BENCH4OPT_4</text>
              <path d="M 480 292 C 530 292 545 292 585 292" fill="none" stroke={colors.GRID} strokeWidth={2} />
            </g>
          )}

          {codeU > 0 && (
            <g opacity={codeU}>
              <rect x={510} y={165} width={245} height={245} rx={14} fill="#0d1324" stroke={colors.SECONDARY} />
              {[
                'import gurobipy as gp',
                'x = model.addVars(...)',
                'model.setObjective(...)',
                'model.addConstr(...)',
                'model.optimize()',
              ].map((line, i) => <text key={line} x={532} y={208 + i * 38} fill={i === 4 ? colors.POSITIVE : colors.TEXT} fontSize={10.5} fontFamily={MONO}>{line}</text>)}
            </g>
          )}

          {planeU > 0 && (
            <g opacity={planeU}>
              <line x1={770} y1={500} x2={1130} y2={500} stroke={colors.GRID} strokeWidth={2} />
              <line x1={770} y1={500} x2={770} y2={150} stroke={colors.GRID} strokeWidth={2} />
              <text x={1128} y={522} textAnchor="end" fill={colors.MUTED} fontSize={10}>budget →</text>
              <text x={750} y={165} fill={colors.MUTED} fontSize={10}>risk</text>
              <polygon points="790,465 835,250 1040,310 1080,465" fill={colors.POSITIVE} fillOpacity={0.13} stroke={colors.POSITIVE} strokeWidth={2} />
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1={790} y1={460 - i * 42} x2={1080 - i * 28} y2={340 - i * 42} stroke={colors.WARM} strokeOpacity={0.16} />
              ))}
              <text x={930} y={445} textAnchor="middle" fill={colors.POSITIVE} fontSize={11}>feasible region</text>
              {candidate > 0 && (
                <g transform={`translate(${c.x} ${c.y})`}>
                  <circle r={12} fill={candidate < 1.5 ? colors.NEGATIVE : colors.POSITIVE} />
                  <circle r={24} fill="none" stroke={candidate < 1.5 ? colors.NEGATIVE : colors.POSITIVE} opacity={0.35} />
                </g>
              )}
              {s.get(scene.rejectU) > 0 && <text x={1008} y={188} textAnchor="middle" fill={colors.NEGATIVE} opacity={s.get(scene.rejectU)} fontSize={16} fontWeight={700}>infeasible ✕</text>}
              {s.get(scene.validU) > 0 && <text x={920} y={365} textAnchor="middle" fill={colors.POSITIVE} opacity={s.get(scene.validU)} fontSize={16} fontWeight={700}>objective verified ✓</text>}
            </g>
          )}

          {benchesU > 0 && (
            <g opacity={benchesU}>
              {BENCHES.map((name, i) => {
                const x = 155 + i * 250;
                const u = clamp01(benchesU * 5 - i);
                return (
                  <g key={name} opacity={u}>
                    <rect x={x} y={475} width={205} height={70} rx={12} fill={colors.PANEL} stroke={i % 2 ? colors.SECONDARY : colors.ACCENT} />
                    <text x={x + 102} y={505} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontWeight={700}>{name}</text>
                    <text x={x + 102} y={528} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>solver gate</text>
                  </g>
                );
              })}
            </g>
          )}

          {s.get(scene.configU) > 0 && (
            <text x={640} y={580} textAnchor="middle" fill={colors.MUTED} opacity={s.get(scene.configU)} fontSize={11} fontFamily={MONO}>SEED=42 · TEMPERATURE=0.6 · ACC_SAMPLES=1 · workers configurable</text>
          )}

          {scoreU > 0 && (
            <g opacity={clamp01(scoreU * 2)}>
              <rect x={245} y={605} width={790} height={24} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <rect x={245} y={605} width={790 * 0.7181 * scoreU} height={24} rx={12} fill={colors.POSITIVE} opacity={0.75} />
              <text x={640} y={623} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontWeight={700}>reported average zero-shot Pass@1 · 71.81%</text>
            </g>
          )}

          {recapU > 0 && (
            <g opacity={recapU}>
              {['structured OR seed', '128-NPU training', 'shared index map', 'solver verdict'].map((label, i) => {
                const x = 225 + i * 275;
                const u = clamp01(recapU * 5 - i);
                return (
                  <g key={label} opacity={u}>
                    <circle cx={x} cy={135} r={18} fill={i === 3 ? colors.POSITIVE : colors.ACCENT} opacity={0.22} stroke={i === 3 ? colors.POSITIVE : colors.ACCENT} />
                    <text x={x} y={175} textAnchor="middle" fill={colors.TEXT} fontSize={10.5}>{label}</text>
                    {i < 3 && <path d={`M ${x + 25} 135 L ${x + 245} 135`} stroke={colors.GRID} strokeWidth={2} />}
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={220} y={235} width={840} height={190} rx={18} fill={colors.PANEL} stroke={colors.POSITIVE} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={700}>Plausible is not feasible</text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={16}>the solver checks constraints, execution, and objective value</text>
          <text x={640} y={378} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontWeight={700}>71.81% average zero-shot Pass@1</text>
          <text x={640} y={403} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>reported comparison: +3.98 points vs GPT-5.4-Mini · +11.27 vs base DeepSeek-V4-Flash</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
