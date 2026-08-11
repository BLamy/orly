// The Geometry of Coexistence - chapter 2: Measure the Update Geometry.
//
// Grounded in arXiv:2608.03573 Figure 2 and Section 3, plus
// src/parallel_rl/analyze_lora.py, analyze_full.py, and merge_lora.py.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Vec } from '../../primitives';

const TASKS = ['Math', 'Science', 'Logic', 'Code'];
const C = [colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE];
const SFT_NORMS = [6.5, 7.5, 8.9, 6.6];
const RL_NORMS = [0.020, 0.011, 0.087, 0.011];
const SFT_COS = [[1, .968, .953, -.973], [.968, 1, .950, .968], [.953, .950, 1, -.953], [-.973, .968, -.953, 1]];
const RL_COS = [[1, -.000392, .000003, .000023], [-.000392, 1, .000007, .000449], [.000003, .000007, 1, -.000483], [.000023, .000449, -.000483, 1]];
const SFT_ANGLES = [-0.18, -0.08, 0.05, Math.PI - 0.14];
const RL_ANGLES = [-1.45, -0.10, 1.48, 3.02];
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const originU = tl.channel('originU', 0);
  const deltaU = tl.channel('deltaU', 0);
  const loraU = tl.channel('loraU', 0);
  const vectorU = tl.channel('vectorU', 0);
  const matrixU = tl.channel('matrixU', 0);
  const collisionU = tl.channel('collisionU', 0);
  const morph = tl.channel('morph', 0);
  const normalizeU = tl.channel('normalizeU', 0);
  const sparseU = tl.channel('sparseU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 6.5, text: 'For each task, subtract the same base checkpoint. What remains is that task’s update vector.' });
  tl.tween(originU, 1, { at: 0.9, dur: 0.7, ease: ease.enter });
  tl.tween(deltaU, 1, { at: 1.6, dur: 1.4, ease: ease.draw });
  tl.tween(cam, { x: 430, y: 350, k: 1.12 }, { at: 2.1, dur: 1.3, ease: ease.move });
  tl.hold(7.0, 0.8);

  tl.caption({ at: 7.8, dur: 6.8, text: 'For a low-rank adapter, the repository rebuilds that update by multiplying its two factors and applying the adapter scale.' });
  tl.tween(loraU, 1, { at: 8.4, dur: 1.2, ease: ease.enter });
  tl.hold(14.6, 0.8);

  tl.caption({ at: 15.4, dur: 6.5, text: 'Do this for all four supervised tasks and the arrows are large, dense, and strongly aligned.' });
  tl.tween(vectorU, 1, { at: 16.0, dur: 1.6, ease: ease.draw });
  tl.tween(matrixU, 1, { at: 17.0, dur: 1.4, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 18.0, dur: 1.3, ease: ease.move });
  tl.hold(21.9, 0.8);

  tl.caption({ at: 22.7, dur: 6.8, text: 'Math and code even point in opposite directions. Their cosine is about negative zero point nine seven.' });
  tl.tween(collisionU, 1, { at: 23.3, dur: 0.6, ease: ease.pop });
  tl.tween(cam, { x: 520, y: 350, k: 1.06 }, { at: 24.0, dur: 1.3, ease: ease.move });
  tl.hold(29.5, 0.8);

  tl.caption({ at: 30.3, dur: 6.8, text: 'Switch to reinforcement learning and the same compass contracts by more than two orders of magnitude.' });
  tl.tween(morph, 1, { at: 30.9, dur: 2.0, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 32.4, dur: 1.3, ease: ease.move });
  tl.hold(37.1, 0.8);

  tl.caption({ at: 37.9, dur: 6.8, text: 'Only about one fifth of its parameters exceed the paper’s threshold, compared with ninety-three percent under supervision.' });
  tl.tween(sparseU, 1, { at: 38.5, dur: 1.6, ease: ease.enter });
  tl.hold(44.7, 0.8);

  tl.caption({ at: 45.5, dur: 6.6, text: 'Normalize the tiny arrows just to inspect direction, and they separate into nearly orthogonal task axes.' });
  tl.tween(normalizeU, 1, { at: 46.1, dur: 1.8, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 47.4, dur: 1.3, ease: ease.move });
  tl.hold(52.1, 0.8);

  tl.caption({ at: 52.9, dur: 6.8, text: 'The analysis utilities record exactly these two tests: update norm and pairwise cosine similarity.' });
  tl.hold(59.7, 0.8);

  tl.caption({ at: 60.5, dur: 7.0, text: 'Small, sparse, and nearly orthogonal updates have room to coexist. The next question is why reinforcement learning makes them that way.' });
  tl.tween(dimU, 1, { at: 61.1, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 62.0, dur: 0.7, ease: ease.enter });
  tl.hold(67.5, 1.0);

  return { tl, cam, originU, deltaU, loraU, vectorU, matrixU, collisionU, morph, normalizeU, sparseU, dimU, endU };
}

const scene = buildScene();

function CosineMatrix({ x, y, morph, opacity, collision }: { x: number; y: number; morph: number; opacity: number; collision: number }) {
  const cell = 54;
  return <g opacity={opacity}>
    <text x={x + 108} y={y - 42} textAnchor="middle" fill={colors.TEXT} fontSize={16} fontWeight={750}>pairwise cosine</text>
    {TASKS.map((t, i) => <text key={`c${t}`} x={x + i * cell + cell / 2} y={y - 14} textAnchor="middle" fill={C[i]} fontSize={10} fontFamily={MONO}>{t.slice(0, 1)}</text>)}
    {TASKS.map((t, i) => <text key={`r${t}`} x={x - 12} y={y + i * cell + 34} textAnchor="end" fill={C[i]} fontSize={10} fontFamily={MONO}>{t.slice(0, 1)}</text>)}
    {SFT_COS.map((row, i) => row.map((_, j) => {
      const v = lerp(SFT_COS[i][j], RL_COS[i][j], morph);
      const mag = Math.abs(v);
      const hot = 0.1 + mag * 0.82;
      const hit = collision * ((i === 0 && j === 3) || (i === 3 && j === 0) ? 1 : 0);
      return <g key={`${i}-${j}`}>
        <rect x={x + j * cell} y={y + i * cell} width={cell - 5} height={cell - 5} rx={7} fill={v < 0 ? colors.NEGATIVE : colors.ACCENT} opacity={i === j ? 0.32 : hot} stroke={hit ? colors.WARM : 'none'} strokeWidth={hit ? 4 : 0} />
        <text x={x + j * cell + (cell - 5) / 2} y={y + i * cell + 30} textAnchor="middle" fill={colors.TEXT} fontSize={9} fontFamily={MONO}>{i === j ? '—' : (Math.abs(v) < .001 ? v.toExponential(0) : v.toFixed(2))}</text>
      </g>;
    }))}
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const morph = clamp01(s.get(scene.morph));
  const normU = clamp01(s.get(scene.normalizeU));
  const dim = 1 - 0.9 * s.get(scene.dimU);
  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={dim}>
      <text x={640} y={50} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={850}>A compass made from weight updates</text>
      <text x={640} y={78} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>analyze_lora.py · analyze_full.py</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={dim}>
        <g opacity={s.get(scene.originU)}>
          <circle cx={390} cy={350} r={8} fill={colors.TEXT} />
          <text x={390} y={382} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>W_base</text>
        </g>
        <g opacity={s.get(scene.loraU)}>
          <rect x={168} y={104} width={444} height={54} rx={14} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={390} y={138} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontFamily={MONO}>ΔW = (lora_alpha / r) · B @ A</text>
        </g>
        {TASKS.map((task, i) => {
          const angle = lerp(SFT_ANGLES[i], RL_ANGLES[i], morph);
          const rawLen = lerp(44 + SFT_NORMS[i] * 26, 18 + RL_NORMS[i] * 360, morph);
          const len = lerp(rawLen, 190, normU);
          return <Vec key={task} x1={390} y1={350} x2={390 + Math.cos(angle) * len} y2={350 + Math.sin(angle) * len} grow={s.get(scene.vectorU) * s.get(scene.deltaU)} color={C[i]} width={4} label={task} labelAt="tip" opacity={1} />;
        })}
        <circle cx={390} cy={350} r={250} fill="none" stroke={colors.GRID} opacity={0.28 * normU} strokeDasharray="5 10" />
        <text x={390} y={616} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO} opacity={normU}>direction-only view · vectors normalized</text>
        <CosineMatrix x={820} y={212} morph={morph} opacity={s.get(scene.matrixU)} collision={s.get(scene.collisionU)} />
        <g opacity={s.get(scene.sparseU)}>
          <rect x={784} y={474} width={298} height={106} rx={18} fill={colors.PANEL} stroke={colors.POSITIVE} />
          <text x={933} y={508} textAnchor="middle" fill={colors.POSITIVE} fontSize={16} fontWeight={800}>parameters above 10⁻⁵</text>
          <text x={855} y={550} textAnchor="middle" fill={colors.NEGATIVE} fontSize={27} fontFamily={MONO}>93%</text>
          <text x={1010} y={550} textAnchor="middle" fill={colors.POSITIVE} fontSize={27} fontFamily={MONO}>20%</text>
          <text x={855} y={568} textAnchor="middle" fill={colors.MUTED} fontSize={10}>SFT</text>
          <text x={1010} y={568} textAnchor="middle" fill={colors.MUTED} fontSize={10}>RL</text>
        </g>
        <MathLabel tex={'\\Delta W_i = W_i - W_{base}'} x={390} y={132} fontSize={22} opacity={s.get(scene.deltaU) * (1 - s.get(scene.loraU))} />
      </g>
    </Camera>
    <g opacity={s.get(scene.endU)}>
      <rect x={170} y={226} width={940} height={212} rx={28} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
      <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={38} fontWeight={850}>Room between the updates</text>
      <text x={640} y={350} textAnchor="middle" fill={colors.POSITIVE} fontSize={22}>small · sparse · nearly orthogonal</text>
      <text x={640} y={392} textAnchor="middle" fill={colors.MUTED} fontSize={15}>the paper’s measured geometry</text>
    </g>
  </>;
}

export const vizScene = () => scene;
