// The Geometry of Coexistence - chapter 4: Train Apart, Merge Once.
//
// Grounded in arXiv:2608.03573 Section 5 and Tables 4-5, plus
// scripts/train/run_parallel_tasks.sh, src/parallel_rl/merge_full.py,
// src/parallel_rl/merge_lora.py, scripts/eval/evaluate_task.sh, and
// docs/reproducibility_map.md.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { MatrixGrid, Vec } from '../../primitives';

const TASKS = ['math', 'science', 'logic', 'code'];
const C = [colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE];
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const CELLS: Array<Array<[number, number]>> = [
  [[0, 1], [1, 4], [3, 2], [6, 6], [7, 0]],
  [[0, 6], [2, 3], [4, 7], [5, 1], [7, 5]],
  [[1, 1], [2, 6], [4, 3], [6, 0], [7, 7]],
  [[0, 3], [3, 6], [5, 4], [6, 2], [7, 4]],
];
const BASE = Array.from({ length: 8 }, (_, i) => Array.from({ length: 8 }, (_, j) => 0.14 + ((i * 7 + j * 3) % 9) / 70));
const DELTAS = TASKS.map((_, task) => BASE.map((row, i) => row.map((__, j) => CELLS[task].some(([r, c]) => r === i && c === j) ? 0.92 : 0.04)));
const MERGED = BASE.map((row, i) => row.map((v, j) => Math.min(1, v + DELTAS.reduce((sum, d) => sum + d[i][j] * 0.18, 0))));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const baseU = tl.channel('baseU', 0);
  const forkU = tl.channel('forkU', 0);
  const trainU = tl.channel('trainU', 0);
  const mergeU = tl.channel('mergeU', 0);
  const method = tl.channel('method', 0);
  const retentionU = tl.channel('retentionU', 0);
  const tiesU = tl.channel('tiesU', 0);
  const adaptU = tl.channel('adaptU', 0);
  const ablateU = tl.channel('ablateU', 0);
  const evalU = tl.channel('evalU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 6.5, text: 'Parallel reinforcement learning begins by copying the same base model into independent task jobs.' });
  tl.tween(baseU, 1, { at: 0.9, dur: 0.7, ease: ease.enter });
  tl.tween(forkU, 1, { at: 1.7, dur: 1.8, ease: ease.draw });
  tl.tween(cam, { x: 440, y: 330, k: 1.05 }, { at: 2.3, dur: 1.3, ease: ease.move });
  tl.hold(7.0, 0.8);

  tl.caption({ at: 7.8, dur: 6.8, text: 'Math, science, logic, and code train at the same time, each producing a sparse task update.' });
  tl.tween(trainU, 1, { at: 8.4, dur: 2.0, ease: ease.enter });
  tl.hold(14.6, 0.8);

  tl.caption({ at: 15.4, dur: 6.6, text: 'The final checkpoint adds a merge of those updates back onto the shared base weights.' });
  tl.tween(mergeU, 1, { at: 16.0, dur: 2.0, ease: ease.move });
  tl.tween(cam, { x: 700, y: 350, k: 1.03 }, { at: 17.2, dur: 1.3, ease: ease.move });
  tl.hold(22.0, 0.8);

  tl.caption({ at: 22.8, dur: 6.8, text: 'The repository implements sum, mean, sign-aware trimming, and low-rank projection as explicit merge choices.' });
  tl.tween(method, 3, { at: 23.4, dur: 3.2, ease: ease.move });
  tl.hold(29.6, 0.8);

  tl.caption({ at: 30.4, dur: 6.7, text: 'A simple sum keeps ninety-four point two percent of the corresponding single-task performance in the paper’s smaller model.' });
  tl.tween(retentionU, 0.942, { at: 31.0, dur: 1.6, ease: ease.move });
  tl.hold(37.1, 0.8);

  tl.caption({ at: 37.9, dur: 6.7, text: 'Sign-aware trimming raises that retention to ninety-seven point four percent by keeping agreement and dropping conflict.' });
  tl.tween(tiesU, 1, { at: 38.5, dur: 1.2, ease: ease.enter });
  tl.tween(retentionU, 0.974, { at: 39.2, dur: 1.0, ease: ease.move });
  tl.hold(44.6, 0.8);

  tl.caption({ at: 45.4, dur: 6.8, text: 'A light post-merge adaptation using five percent of the training samples reaches one hundred three point two percent retention in that result row.' });
  tl.tween(adaptU, 1, { at: 46.0, dur: 1.2, ease: ease.pop });
  tl.tween(retentionU, 1.032, { at: 46.8, dur: 1.1, ease: ease.move });
  tl.hold(52.2, 0.8);

  tl.caption({ at: 53.0, dur: 6.8, text: 'Remove one task update and its own score falls sharply while the other tasks stay roughly steady.' });
  tl.tween(ablateU, 1, { at: 53.6, dur: 1.4, ease: ease.move });
  tl.hold(59.8, 0.8);

  tl.caption({ at: 60.6, dur: 6.8, text: 'The public release supplies runnable analysis and merge tools, while datasets, checkpoints, and evaluator installs remain external.' });
  tl.tween(evalU, 1, { at: 61.2, dur: 1.0, ease: ease.enter });
  tl.hold(67.4, 0.8);

  tl.caption({ at: 68.2, dur: 7.2, text: 'Fork, train, measure, merge, evaluate. Parallelism works here because the task updates first learned how not to collide.' });
  tl.tween(dimU, 1, { at: 68.8, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 69.7, dur: 0.7, ease: ease.enter });
  tl.hold(75.4, 1.0);

  return { tl, cam, baseU, forkU, trainU, mergeU, method, retentionU, tiesU, adaptU, ablateU, evalU, dimU, endU };
}

const scene = buildScene();

function TaskGrid({ x, y, task, index, u, removed }: { x: number; y: number; task: string; index: number; u: number; removed: number }) {
  return <g opacity={u * (1 - removed * (index === 2 ? 0.88 : 0))}>
    <text x={x + 68} y={y - 14} textAnchor="middle" fill={C[index]} fontSize={12} fontFamily={MONO}>{task} ΔW</text>
    <MatrixGrid x={x} y={y} values={DELTAS[index]} cell={15} gap={2} cellU={(i, j) => clamp01(u * 4 - (i * 8 + j) / 22)} fill={(v) => v > .5 ? C[index] : colors.GRID} opacity={1} />
    {removed > 0 && index === 2 && <path d={`M${x} ${y} L${x + 134} ${y + 134} M${x + 134} ${y} L${x} ${y + 134}`} stroke={colors.NEGATIVE} strokeWidth={7} opacity={removed} />}
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const dim = 1 - 0.9 * s.get(scene.dimU);
  const fork = s.get(scene.forkU);
  const train = s.get(scene.trainU);
  const merge = s.get(scene.mergeU);
  const methodIndex = Math.min(3, Math.floor(s.get(scene.method) + 0.001));
  const methods = ['sum', 'mean', 'ties', 'svd'];
  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={dim}>
      <text x={640} y={48} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={850}>Train apart, merge once</text>
      <text x={640} y={76} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>run_parallel_tasks.sh · merge_full.py · evaluate_task.sh</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={dim}>
        <g opacity={s.get(scene.baseU)}>
          <text x={116} y={198} fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>W_base</text>
          <MatrixGrid x={82} y={216} values={BASE} cell={15} gap={2} cellU={() => 1} opacity={1} />
        </g>
        {TASKS.map((task, i) => {
          const tx = 290 + (i % 2) * 194;
          const ty = 154 + Math.floor(i / 2) * 220;
          return <g key={task}>
            <Vec x1={220} y1={282} x2={tx - 16} y2={ty + 68} grow={fork} color={C[i]} width={3} opacity={0.7} />
            <TaskGrid x={tx} y={ty} task={task} index={i} u={train} removed={s.get(scene.ablateU)} />
            <Vec x1={tx + 144} y1={ty + 68} x2={742} y2={350} grow={merge} color={C[i]} width={3} opacity={0.7} />
          </g>;
        })}
        <g opacity={merge}>
          <rect x={722} y={228} width={224} height={246} rx={24} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={834} y={262} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontWeight={800}>merge plate</text>
          <MatrixGrid x={766} y={284} values={MERGED} cell={15} gap={2} cellU={(i, j) => clamp01(merge * 3 - (i * 8 + j) / 28)} opacity={1} />
          <MathLabel tex={'W_{final}=W_{base}+\\mathcal{M}(\\Delta W_1,\\ldots,\\Delta W_N)'} x={834} y={448} fontSize={15} boxWidth={210} />
        </g>
        <g opacity={merge}>
          {methods.map((m, i) => <g key={m} opacity={methodIndex === i ? 1 : 0.28}>
            <rect x={984} y={168 + i * 48} width={188} height={36} rx={10} fill={methodIndex === i ? C[i] : colors.PANEL} opacity={methodIndex === i ? 0.26 : 1} stroke={methodIndex === i ? C[i] : colors.GRID} />
            <text x={1078} y={191 + i * 48} textAnchor="middle" fill={methodIndex === i ? C[i] : colors.MUTED} fontSize={13} fontFamily={MONO}>{m}</text>
          </g>)}
        </g>
        <g opacity={s.get(scene.retentionU) > 0 ? 1 : 0}>
          <text x={982} y={404} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>single-task retention</text>
          <rect x={982} y={422} width={190} height={20} rx={10} fill={colors.GRID} />
          <rect x={982} y={422} width={Math.min(190, 190 * s.get(scene.retentionU))} height={20} rx={10} fill={s.get(scene.retentionU) >= 1 ? colors.POSITIVE : colors.ACCENT} />
          <text x={1077} y={474} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontFamily={MONO}>{(s.get(scene.retentionU) * 100).toFixed(1)}%</text>
        </g>
        <g opacity={s.get(scene.adaptU)}>
          <rect x={982} y={496} width={190} height={46} rx={13} fill={colors.POSITIVE} opacity={0.14} />
          <text x={1077} y={525} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>adapted · 5% samples</text>
        </g>
        <g opacity={s.get(scene.evalU)}>
          <rect x={78} y={548} width={1094} height={62} rx={16} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={625} y={573} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>MATH500 · AIME2025 · MMLU · GPQA · Knights-and-Knaves · LiveCodeBench</text>
          <text x={625} y={596} textAnchor="middle" fill={colors.TEXT} fontSize={13}>external checkpoints, datasets, and official evaluators required</text>
        </g>
      </g>
    </Camera>
    <g opacity={s.get(scene.endU)}>
      <rect x={158} y={212} width={964} height={242} rx={30} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
      <text x={640} y={280} textAnchor="middle" fill={colors.TEXT} fontSize={38} fontWeight={850}>Parallel-RL</text>
      <text x={640} y={334} textAnchor="middle" fill={colors.ACCENT} fontSize={19}>fork · train · measure · merge · evaluate</text>
      <text x={640} y={384} textAnchor="middle" fill={colors.POSITIVE} fontSize={22} fontWeight={750}>coexistence becomes a training architecture</text>
      <text x={640} y={420} textAnchor="middle" fill={colors.MUTED} fontSize={13}>arXiv:2608.03573 · GaryStack/Parallel-RL</text>
    </g>
  </>;
}

export const vizScene = () => scene;
