// Grounding: arXiv:2609.06986 Sections 1 and 3; official source README.md,
// data/*/manifest.json, evaluate.py, and analysis/summarize.py.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const TASKS = Array.from({ length: 100 }, (_, i) => ({ i, x: 106 + i * 10.7 }));
const DATASETS = [
  { label: 'Symbol-QA', detail: '100 × 100 arbitrary associations', color: colors.ACCENT },
  { label: 'LLM-QA', detail: '100 × 100 fictional facts', color: colors.SECONDARY },
  { label: 'Real-QA', detail: '100 × 50 filtered questions', color: colors.POSITIVE },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const memoryU = tl.channel('first memory', 0);
  const tapeU = tl.channel('hundred task tape', 0);
  const overwriteU = tl.channel('sequential overwrite', 0);
  const datasetsU = tl.channel('three datasets', 0);
  const noIdU = tl.channel('no task identifier', 0);
  const foldU = tl.channel('tape folds into matrix', 0);
  const matrixU = tl.channel('temporal accuracy matrix', 0);
  const diagonalU = tl.channel('immediate acquisition diagonal', 0);
  const finalU = tl.channel('final retention row', 0);
  const metricU = tl.channel('paper metrics', 0);
  const closeU = tl.channel('closing question', 0);

  tl.caption({ at: 0.4, dur: 5.5, text: 'Teach a language model one new answer, then keep teaching. The first memory now has ninety-nine chances to disappear.' });
  tl.tween(memoryU, 1, { at: 0.8, dur: 0.7, ease: ease.pop });
  tl.tween(tapeU, 0.12, { at: 1.6, dur: 1.5, ease: ease.draw });
  tl.tween(cam, { x: 300, y: 300, k: 1.08 }, { at: 2.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 6.4, dur: 5.5, text: 'The paper turns that worry into a one-hundred-task memorization setting, learned in sequence with no old examples kept.' });
  tl.tween(tapeU, 1, { at: 6.9, dur: 4.0, ease: ease.linear });
  tl.tween(overwriteU, 1, { at: 8.0, dur: 3.0, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 9.8, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.4, dur: 5.5, text: 'The model receives only the question at inference. No task label tells it which chapter of its past to search.' });
  tl.tween(noIdU, 1, { at: 12.9, dur: 1.0, ease: ease.enter });

  tl.caption({ at: 18.4, dur: 5.5, text: 'Three streams make the test harder to fake: random symbols, invented facts, and natural questions the base model could not answer.' });
  tl.tween(datasetsU, 3, { at: 18.9, dur: 2.0, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 350, k: 1.06 }, { at: 19.5, dur: 1.2, ease: ease.move });

  tl.caption({ at: 24.4, dur: 5.5, text: 'After every task, evaluation revisits the whole learned stream. The tape folds into a temporal accuracy matrix.' });
  tl.tween(datasetsU, 0, { at: 24.7, dur: 0.6, ease: ease.enter });
  tl.tween(foldU, 1, { at: 25.0, dur: 1.4, ease: ease.move });
  tl.tween(matrixU, 1, { at: 26.1, dur: 2.2, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 350, k: 1.05 }, { at: 26.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 30.4, dur: 5.5, text: 'Each new row asks what the current checkpoint remembers about every task it has already seen.' });
  tl.tween(diagonalU, 1, { at: 31.0, dur: 1.6, ease: ease.enter });

  tl.caption({ at: 36.4, dur: 5.5, text: 'The diagonal measures immediate acquisition. Bright cells there only prove that each answer was learned once.' });
  tl.tween(cam, { x: 600, y: 350, k: 1.08 }, { at: 37.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 42.4, dur: 5.5, text: 'The final row is the expensive claim. Its mean is final retention after the hundredth update.' });
  tl.tween(finalU, 1, { at: 42.9, dur: 1.3, ease: ease.pop });
  tl.tween(cam, { x: 640, y: 360, k: 1.08 }, { at: 43.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 48.4, dur: 5.5, text: 'The same matrix yields forgetting by comparing each task at its best moment with that last row.' });
  tl.tween(metricU, 1, { at: 49.0, dur: 1.5, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 51.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 54.4, dur: 5.5, text: 'Naive sequential fine-tuning leaves almost nothing at this horizon. One mechanism at a time is not enough.' });
  tl.tween(overwriteU, 1.7, { at: 55.0, dur: 1.5, ease: ease.move });

  tl.caption({ at: 60.4, dur: 5.8, text: 'So the paper asks a sharper question: which protections preserve different parts of memory, and what happens when they work together?' });
  tl.tween(closeU, 1, { at: 61.0, dur: 1.3, ease: ease.move });
  tl.hold(66.2, 1.0);

  return { tl, cam, memoryU, tapeU, overwriteU, datasetsU, noIdU, foldU, matrixU, diagonalU, finalU, metricU, closeU };
}

const scene = buildScene();

function MemoryCard({ u, fade }: { u: number; fade: number }) {
  return <g transform={`translate(118 112) scale(${0.86 + 0.14 * u})`} opacity={u}>
    <rect width="262" height="92" rx="24" fill="#151f31" stroke={colors.WARM} strokeWidth="3" />
    <text x="22" y="32" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>Question: oHBvRP</text>
    <text x="22" y="65" fill={colors.WARM} fontSize="18" fontWeight="800" fontFamily={colors.font.mono} opacity={fade}>Answer: OIvG</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const tape = s.get(scene.tapeU);
  const overwrite = s.get(scene.overwriteU);
  const fold = s.get(scene.foldU);
  const matrix = s.get(scene.matrixU);
  const diagonal = s.get(scene.diagonalU);
  const final = s.get(scene.finalU);
  const memoryFade = Math.max(0.08, 1 - 0.82 * clamp01(overwrite));
  const tapeFade = 1 - fold;

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="60" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">the hundred-task horizon</text>
      <g opacity={tapeFade}>
        <MemoryCard u={s.get(scene.memoryU)} fade={memoryFade} />
        <path d="M112 292 H1172" stroke={colors.GRID} strokeWidth="7" strokeLinecap="round" />
        {TASKS.map((task) => {
          const u = clamp01(tape * 100 - task.i);
          const old = task.i === 0;
          return <g key={task.i} opacity={u}>
            <rect x={task.x} y={270} width="7" height={old ? 44 : 28} rx="3.5" fill={old ? colors.WARM : colors.ACCENT} opacity={old ? memoryFade : 0.25 + 0.55 * u} />
            {(task.i === 0 || task.i === 9 || task.i === 49 || task.i === 99) && <text x={task.x + 3.5} y="335" textAnchor="middle" fill={old ? colors.WARM : colors.MUTED} fontSize="10">{task.i + 1}</text>}
          </g>;
        })}
        <g opacity={s.get(scene.noIdU)}>
          <rect x="432" y="158" width="416" height="70" rx="22" fill="#251823" stroke={colors.NEGATIVE} strokeWidth="2.5" />
          <text x="640" y="187" textAnchor="middle" fill={colors.NEGATIVE} fontSize="14" fontWeight="800">NO TASK IDENTIFIER AT INFERENCE</text>
          <text x="640" y="211" textAnchor="middle" fill={colors.MUTED} fontSize="12">one question must identify one answer globally</text>
        </g>
        <g>
          {DATASETS.map((d, i) => {
            const u = clamp01(s.get(scene.datasetsU) - i);
            return <g key={d.label} transform={`translate(${152 + i * 360} 430)`} opacity={u}>
              <rect width="312" height="106" rx="26" fill="#101827" stroke={d.color} strokeWidth="2.5" />
              <circle cx="38" cy="53" r="19" fill={d.color} opacity="0.28" />
              <text x="72" y="44" fill={d.color} fontSize="17" fontWeight="800">{d.label}</text>
              <text x="72" y="70" fill={colors.MUTED} fontSize="12">{d.detail}</text>
            </g>;
          })}
        </g>
      </g>

      <g opacity={matrix} transform={`translate(${fold * 135} ${fold * 8})`}>
        <text x="368" y="116" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>evaluate.py → accuracy_matrix</text>
        {Array.from({ length: 10 }, (_, row) => Array.from({ length: 10 }, (_, col) => {
          if (col > row) return null;
          const idx = row * 10 + col;
          const u = clamp01(matrix * 100 - idx);
          const isDiag = row === col;
          const isFinal = row === 9;
          const x = 338 + col * 48;
          const y = 142 + row * 42;
          const dim = isDiag ? 0.48 + 0.52 * diagonal : isFinal ? 0.24 + 0.76 * final : 0.22;
          const color = isDiag ? colors.ACCENT : isFinal ? colors.WARM : colors.MUTED;
          return <rect key={`${row}-${col}`} x={x} y={y} width="38" height="32" rx="7" fill={color} opacity={u * dim} stroke={color} strokeWidth={isFinal && final > 0 ? 2.5 : 0.5} />;
        }))}
        <text x="590" y="590" textAnchor="middle" fill={colors.WARM} fontSize="13" opacity={final}>final row → mean final retention</text>
        <text x="826" y="340" textAnchor="middle" fill={colors.ACCENT} fontSize="12" transform="rotate(-90 826 340)" opacity={diagonal}>diagonal → immediate acquisition</text>
        <g opacity={s.get(scene.metricU)}>
          <rect x="865" y="190" width="282" height="226" rx="30" fill="#101827" stroke={colors.SECONDARY} strokeWidth="2.5" />
          <text x="1006" y="232" textAnchor="middle" fill={colors.TEXT} fontSize="18" fontWeight="800">the matrix answers</text>
          {['final retention', 'immediate acquisition', 'forgetting', 'forward transfer'].map((label, i) => <g key={label} transform={`translate(902 ${270 + i * 34})`}>
            <circle r="6" fill={[colors.WARM, colors.ACCENT, colors.NEGATIVE, colors.POSITIVE][i]} />
            <text x="18" y="5" fill={colors.MUTED} fontSize="13">{label}</text>
          </g>)}
        </g>
      </g>
    </g>

    <g opacity={close}>
      <rect x="180" y="122" width="920" height="444" rx="54" fill={colors.BG} stroke={colors.WARM} strokeWidth="4" />
      <MemoryCard u={1} fade={0.16} />
      <text x="640" y="252" textAnchor="middle" fill={colors.TEXT} fontSize="46" fontWeight="880">one memory · one hundred updates</text>
      <path d="M286 360 H994" stroke={colors.GRID} strokeWidth="8" strokeLinecap="round" />
      {['data', 'function', 'weight', 'allocation'].map((label, i) => <g key={label} transform={`translate(${330 + i * 205} 360)`}>
        <circle r="42" fill="#101827" stroke={[colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE][i]} strokeWidth="4" />
        <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="12">{label}</text>
      </g>)}
      <text x="640" y="474" textAnchor="middle" fill={colors.MUTED} fontSize="16">which protections compose?</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
