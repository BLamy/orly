// The Geometry of Coexistence - chapter 1: One Model, Four Moving Capabilities.
//
// Grounded in arXiv:2608.03573 Table 1 and Section 2.2, plus
// configs/experiment_matrix.yaml, scripts/train/run_stage_sequence.sh, and
// results/paper_summary.csv in GaryStack/Parallel-RL.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const TASKS = ['Math', 'Science', 'Logic', 'Code'] as const;
const BASE = [83.1, 34.9, 31.0, 15.0];
const SFT = [78.2, 31.1, 9.0, 14.3];
const RL = [86.6, 49.3, 43.0, 17.3];
const TASK_COLORS = [colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE];
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const railsU = tl.channel('railsU', 0);
  const stageCursor = tl.channel('stageCursor', 0);
  const sftU = tl.channel('sftU', 0);
  const resetU = tl.channel('resetU', 0);
  const rlU = tl.channel('rlU', 0);
  const sftFocus = tl.channel('sftFocus', 0);
  const rlFocus = tl.channel('rlFocus', 0);
  const compareU = tl.channel('compareU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 6.5, text: 'Begin with one model and four reasoning abilities: math, science, logic, and code.' });
  tl.tween(railsU, 1, { at: 0.9, dur: 1.4, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 342, k: 1.06 }, { at: 2.0, dur: 1.3, ease: ease.move });
  tl.hold(7.0, 0.8);

  tl.caption({ at: 7.8, dur: 6.4, text: 'Multi-stage training sends the same checkpoint through one task after another.' });
  tl.tween(stageCursor, 4, { at: 8.4, dur: 4.8, ease: ease.linear });
  tl.hold(14.2, 0.7);

  tl.caption({ at: 14.9, dur: 6.8, text: 'With supervised fine-tuning, the final profile sinks. Logic falls from thirty-one percent to nine.' });
  tl.tween(sftU, 1, { at: 15.5, dur: 2.2, ease: ease.move });
  tl.tween(sftFocus, 1, { at: 18.0, dur: 0.6, ease: ease.pop });
  tl.tween(cam, { x: 690, y: 386, k: 1.18 }, { at: 18.1, dur: 1.3, ease: ease.move });
  tl.hold(21.7, 0.8);

  tl.caption({ at: 22.5, dur: 6.5, text: 'The paper calls this conflict: learning the current task can overwrite abilities the model already had.' });
  tl.hold(29.0, 0.8);

  tl.caption({ at: 29.8, dur: 6.2, text: 'Reset to the same base model and run the same four stages with reinforcement learning.' });
  tl.tween(resetU, 1, { at: 30.3, dur: 1.3, ease: ease.move });
  tl.set(stageCursor, 0, 31.8);
  tl.tween(stageCursor, 4, { at: 32.0, dur: 4.2, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 33.0, dur: 1.3, ease: ease.move });
  tl.hold(36.2, 0.7);

  tl.caption({ at: 36.9, dur: 6.8, text: 'Now every measured capability finishes above its baseline. The stages accumulate instead of collapsing.' });
  tl.tween(rlU, 1, { at: 37.4, dur: 2.2, ease: ease.move });
  tl.tween(rlFocus, 1, { at: 40.0, dur: 0.6, ease: ease.pop });
  tl.hold(43.7, 0.8);

  tl.caption({ at: 44.5, dur: 6.4, text: 'Across these four tasks, multi-stage reinforcement learning gains while multi-stage supervision loses ground.' });
  tl.tween(compareU, 1, { at: 45.1, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 340, k: 0.95 }, { at: 46.0, dur: 1.3, ease: ease.move });
  tl.hold(50.9, 0.8);

  tl.caption({ at: 51.7, dur: 6.8, text: 'That behavioral split is the mystery. What changes inside the weights when the learning rule changes?' });
  tl.hold(58.5, 0.8);

  tl.caption({ at: 59.3, dur: 7.0, text: 'The rest of the story follows one task update from collision, through geometry, into a parallel merge.' });
  tl.tween(dimU, 1, { at: 59.9, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 60.8, dur: 0.7, ease: ease.enter });
  tl.hold(66.3, 1.0);

  return { tl, cam, railsU, stageCursor, sftU, resetU, rlU, sftFocus, rlFocus, compareU, dimU, endU };
}

const scene = buildScene();

function Rail({ task, index, value, baseline, opacity, focus }: { task: string; index: number; value: number; baseline: number; opacity: number; focus: number }) {
  const y = 208 + index * 92;
  const x0 = 250;
  const x1 = 1010;
  const scale = (v: number) => x0 + (v / 100) * (x1 - x0);
  const color = TASK_COLORS[index];
  return <g opacity={opacity}>
    <text x={210} y={y + 6} textAnchor="end" fill={color} fontSize={18} fontWeight={750}>{task}</text>
    <line x1={x0} y1={y} x2={x1} y2={y} stroke={colors.GRID} strokeWidth={8} strokeLinecap="round" />
    <line x1={x0} y1={y} x2={scale(value)} y2={y} stroke={color} strokeWidth={10} strokeLinecap="round" />
    <line x1={scale(baseline)} y1={y - 18} x2={scale(baseline)} y2={y + 18} stroke={colors.TEXT} strokeWidth={2} opacity={0.7} />
    <circle cx={scale(value)} cy={y} r={10 + focus * 5} fill={color} />
    <text x={scale(value)} y={y - 23} textAnchor="middle" fill={color} fontSize={14} fontFamily={MONO}>{value.toFixed(1)}</text>
    <text x={scale(baseline)} y={y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>base {baseline.toFixed(1)}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const sft = s.get(scene.sftU) * (1 - s.get(scene.resetU));
  const rl = s.get(scene.rlU);
  const values = BASE.map((v, i) => lerp(lerp(v, SFT[i], sft), RL[i], rl));
  const dim = 1 - 0.9 * s.get(scene.dimU);
  const cursor = clamp01(s.get(scene.stageCursor) / 4);
  const cursorX = 250 + cursor * 760;
  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={dim}>
      <text x={640} y={54} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={850}>One checkpoint, four capabilities</text>
      <text x={640} y={82} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>Table 1 · DeepSeek-R1-Distill-Qwen-1.5B</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={dim * s.get(scene.railsU)}>
        <line x1={250} y1={142} x2={1010} y2={142} stroke={colors.GRID} strokeWidth={3} />
        {TASKS.map((task, i) => <text key={task} x={250 + (i + 0.5) * 190} y={130} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>stage {i + 1} · {task.toLowerCase()}</text>)}
        <path d={`M${cursorX} 135 V565`} stroke={colors.TEXT} strokeWidth={2} opacity={cursor > 0 && cursor < 1 ? 0.65 : 0} strokeDasharray="6 8" />
        {TASKS.map((task, i) => <Rail key={task} task={task} index={i} value={values[i]} baseline={BASE[i]} opacity={1} focus={i === 2 ? s.get(scene.sftFocus) : s.get(scene.rlFocus) * 0.35} />)}
        <g opacity={s.get(scene.compareU)}>
          <rect x={258} y={574} width={354} height={42} rx={12} fill={colors.NEGATIVE} opacity={0.13} />
          <text x={435} y={600} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontFamily={MONO}>multi-stage SFT · average −23.1%</text>
          <rect x={668} y={574} width={354} height={42} rx={12} fill={colors.POSITIVE} opacity={0.13} />
          <text x={845} y={600} textAnchor="middle" fill={colors.POSITIVE} fontSize={15} fontFamily={MONO}>multi-stage RL · average +24.9%</text>
        </g>
      </g>
    </Camera>
    <g opacity={s.get(scene.endU)}>
      <rect x={180} y={220} width={920} height={224} rx={28} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2.5} />
      <text x={640} y={292} textAnchor="middle" fill={colors.TEXT} fontSize={36} fontWeight={850}>Same tasks. Different geometry.</text>
      <text x={640} y={346} textAnchor="middle" fill={colors.NEGATIVE} fontSize={20}>supervision collides</text>
      <text x={640} y={384} textAnchor="middle" fill={colors.POSITIVE} fontSize={20}>reinforcement learning coexists</text>
    </g>
  </>;
}

export const vizScene = () => scene;
