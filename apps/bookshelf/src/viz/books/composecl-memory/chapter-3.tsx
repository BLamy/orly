// Grounding: arXiv:2609.06986 Section 3; official source train.py lines
// implementing --merge_lora_per_task and experiments/methods.py.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const CELL = 42;
const MX = 472;
const MY = 154;
const TASK_COLORS = [colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const matrixU = tl.channel('base weight matrix', 0);
  const sharedU = tl.channel('shared adapter', 0);
  const sharedP = tl.channel('shared overwrite', 0);
  const factorU = tl.channel('low rank factors', 0);
  const multiplyU = tl.channel('factor product', 0);
  const merge1U = tl.channel('first merge', 0);
  const fresh1U = tl.channel('first fresh adapter', 0);
  const merge2U = tl.channel('second merge', 0);
  const fresh2U = tl.channel('second fresh adapter', 0);
  const merge3U = tl.channel('third merge', 0);
  const constantU = tl.channel('constant learner state', 0);
  const codeU = tl.channel('implementation handoff', 0);
  const memoryU = tl.channel('anchored memory survives', 0);
  const closeU = tl.channel('closing fold loop', 0);

  tl.caption({ at: 0.4, dur: 5.5, text: 'Low-rank adaptation learns a small pair of factors instead of moving every base-model weight directly.' });
  tl.tween(matrixU, 1, { at: 0.8, dur: 1.5, ease: ease.draw });
  tl.tween(factorU, 1, { at: 2.0, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 338, k: 1.08 }, { at: 2.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 6.4, dur: 5.5, text: 'With one shared adapter, every task writes into the same narrow slot. Later gradients can repaint the path that earlier tasks used.' });
  tl.tween(sharedU, 1, { at: 6.9, dur: 1.0, ease: ease.enter });
  tl.tween(sharedP, 3, { at: 7.9, dur: 3.0, ease: ease.linear });
  tl.tween(cam, { x: 400, y: 350, k: 1.08 }, { at: 7.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.4, dur: 5.5, text: 'Merged low-rank adaptation changes the boundary. Train one rank-thirty-two update, then multiply its two factors into a weight delta.' });
  tl.tween(sharedU, 0, { at: 12.7, dur: 0.6, ease: ease.enter });
  tl.tween(multiplyU, 1, { at: 13.0, dur: 2.0, ease: ease.move });
  tl.tween(cam, { x: 640, y: 330, k: 1.08 }, { at: 13.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 18.4, dur: 5.5, text: 'At the task boundary, the training code merges that delta into the base model and unloads the adapter.' });
  tl.tween(merge1U, 1, { at: 18.9, dur: 2.0, ease: ease.move });
  tl.tween(factorU, 0, { at: 20.4, dur: 0.7, ease: ease.enter });

  tl.caption({ at: 24.4, dur: 5.5, text: 'Then it wraps the merged model with a fresh low-rank adapter. The next task starts with an empty slot.' });
  tl.tween(fresh1U, 1, { at: 24.9, dur: 0.8, ease: ease.pop });
  tl.tween(factorU, 1, { at: 25.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 27.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 30.4, dur: 5.5, text: 'The second task learns in that fresh slot, folds into the same base matrix, and clears the slot again.' });
  tl.tween(multiplyU, 2, { at: 30.9, dur: 1.6, ease: ease.linear });
  tl.tween(merge2U, 1, { at: 32.2, dur: 1.6, ease: ease.move });
  tl.tween(fresh2U, 1, { at: 34.0, dur: 0.7, ease: ease.pop });

  tl.caption({ at: 36.4, dur: 5.5, text: 'The third task repeats the same rhythm. Learn a delta, merge it, unload it, and make room.' });
  tl.tween(multiplyU, 3, { at: 36.9, dur: 1.6, ease: ease.linear });
  tl.tween(merge3U, 1, { at: 38.2, dur: 1.6, ease: ease.move });
  tl.tween(cam, { x: 640, y: 330, k: 1.08 }, { at: 38.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 42.4, dur: 5.5, text: 'Unlike methods whose retained adapters grow with the task count, this merged learner keeps one fixed-size active adapter.' });
  tl.tween(constantU, 1, { at: 42.9, dur: 1.3, ease: ease.enter });

  tl.caption({ at: 48.4, dur: 5.5, text: 'The released loop makes the handoff explicit: merge and unload, save the merged checkpoint, then create the next adapter.' });
  tl.tween(codeU, 1, { at: 49.0, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 360, k: 1.08 }, { at: 49.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 54.4, dur: 5.5, text: 'The anchors still constrain the update while it trains. Merging only decides where that protected update is retained.' });
  tl.tween(memoryU, 1, { at: 55.0, dur: 1.0, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: 56.5, dur: 1.2, ease: ease.move });

  tl.caption({ at: 60.4, dur: 5.5, text: 'What to preserve and where to store it are separate design dimensions. The experiment tests both together.' });
  tl.tween(constantU, 1.7, { at: 61.0, dur: 1.5, ease: ease.move });

  tl.caption({ at: 66.4, dur: 5.8, text: 'Fold the update. Clear the slot. Keep the memory. Then measure whether the composition lasts.' });
  tl.tween(closeU, 1, { at: 67.0, dur: 1.3, ease: ease.move });
  tl.hold(72.2, 1.0);

  return { tl, cam, matrixU, sharedU, sharedP, factorU, multiplyU, merge1U, fresh1U, merge2U, fresh2U, merge3U, constantU, codeU, memoryU, closeU };
}

const scene = buildScene();

function WeightMatrix({ u, merges }: { u: number; merges: number[] }) {
  return <g opacity={u}>
    <text x={MX + CELL * 4} y={MY - 24} textAnchor="middle" fill={colors.MUTED} fontSize="13" fontFamily={colors.font.mono}>base model weights W</text>
    {Array.from({ length: 8 }, (_, row) => Array.from({ length: 8 }, (_, col) => {
      const idx = row * 8 + col;
      const reveal = clamp01(u * 64 - idx);
      const hits = merges.map((m, k) => ({ m, k })).filter(({ m, k }) => m > 0 && (row + col + k * 2) % 5 === 0);
      const hit = hits[hits.length - 1];
      return <rect key={`${row}-${col}`} x={MX + col * CELL} y={MY + row * CELL} width={CELL - 6} height={CELL - 6} rx="7" fill={hit ? TASK_COLORS[hit.k] : '#152238'} opacity={reveal * (hit ? 0.35 + 0.55 * hit.m : 0.54)} stroke={hit ? TASK_COLORS[hit.k] : colors.GRID} strokeWidth={hit ? 2 : 0.7} />;
    }))}
  </g>;
}

function Factors({ u, task }: { u: number; task: number }) {
  const color = TASK_COLORS[Math.min(2, task)];
  return <g opacity={u}>
    <rect x="862" y="214" width="74" height="228" rx="18" fill="#101827" stroke={color} strokeWidth="3" />
    <rect x="966" y="274" width="190" height="74" rx="18" fill="#101827" stroke={color} strokeWidth="3" />
    {Array.from({ length: 6 }, (_, i) => <line key={i} x1={878 + i * 9} y1="238" x2={878 + i * 9} y2="418" stroke={color} strokeWidth="4" opacity={0.25 + i * 0.1} />)}
    {Array.from({ length: 6 }, (_, i) => <line key={i} x1="990" y1={290 + i * 7} x2="1132" y2={290 + i * 7} stroke={color} strokeWidth="3" opacity={0.25 + i * 0.1} />)}
    <MathLabel tex={'B_tA_t=\Delta W_t'} x={1008} y={482} fontSize={22} opacity={u} />
    <text x="1008" y="512" textAnchor="middle" fill={color} fontSize="12">rank 32 · task {task + 1}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const merges = [s.get(scene.merge1U), s.get(scene.merge2U), s.get(scene.merge3U)];
  const mult = s.get(scene.multiplyU);
  const task = Math.min(2, Math.floor(mult));
  const shared = s.get(scene.sharedU);
  const sharedP = s.get(scene.sharedP);
  const factorU = s.get(scene.factorU);
  const constant = s.get(scene.constantU);
  const mechanismOpacity = 1 - clamp01(constant);

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="58" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">fold, then make room</text>
      <g opacity={mechanismOpacity}>
        <WeightMatrix u={s.get(scene.matrixU)} merges={merges} />

      <g opacity={shared}>
        <rect x="92" y="174" width="292" height="334" rx="34" fill="#101827" stroke={colors.NEGATIVE} strokeWidth="3" />
        <text x="238" y="214" textAnchor="middle" fill={colors.NEGATIVE} fontSize="16" fontWeight="800">one shared adapter</text>
        <rect x="175" y="252" width="126" height="176" rx="22" fill="#1d1725" stroke={TASK_COLORS[Math.min(2, Math.floor(sharedP))]} strokeWidth="4" />
        {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M194 ${276 + i * 18} C228 ${258 + ((i + Math.floor(sharedP)) % 4) * 32}, 250 ${312 + (i % 3) * 28}, 282 ${278 + i * 17}`} fill="none" stroke={TASK_COLORS[Math.min(2, Math.floor(sharedP))]} strokeWidth="4" opacity="0.65" />)}
        <text x="238" y="468" textAnchor="middle" fill={colors.MUTED} fontSize="12">task one → task two → task three</text>
        <text x="238" y="490" textAnchor="middle" fill={colors.NEGATIVE} fontSize="12">same low-rank coordinates</text>
      </g>

        <Factors u={factorU * (1 - Math.max(...merges) * 0.35)} task={task} />
        {merges.map((m, i) => m > 0 && <g key={i} opacity={m}>
          <path d={`M850 ${250 + i * 72} C790 ${250 + i * 72}, 790 ${245 + i * 45}, 808 ${245 + i * 45}`} fill="none" stroke={TASK_COLORS[i]} strokeWidth="5" strokeDasharray="12 9" />
          <circle cx={808 - 220 * m} cy={245 + i * 45} r="11" fill={TASK_COLORS[i]} />
        </g>)}
      </g>

      <g opacity={constant}>
        <rect x="176" y="330" width="928" height="84" rx="28" fill="#12291f" stroke={colors.POSITIVE} strokeWidth="3" />
        <text x="324" y="378" textAnchor="middle" fill={colors.POSITIVE} fontSize="14" fontWeight="800">ACTIVE LEARNER STATE</text>
        {Array.from({ length: 8 }, (_, i) => <rect key={i} x={448 + i * 52} y="352" width="38" height="36" rx="8" fill={i < 4 ? colors.ACCENT : colors.SECONDARY} opacity="0.75" />)}
        <text x="962" y="378" textAnchor="middle" fill={colors.TEXT} fontSize="14">constant across tasks</text>
      </g>

      <g opacity={s.get(scene.codeU)}>
        <rect x="210" y="444" width="860" height="44" rx="16" fill="#151f31" stroke={colors.ACCENT} />
        <text x="640" y="472" textAnchor="middle" fill={colors.ACCENT} fontSize="12" fontFamily={colors.font.mono}>model.merge_and_unload() → get_peft_model(merged, lora_cfg)</text>
      </g>
      <g opacity={s.get(scene.memoryU)} transform="translate(312 112)">
        <rect width="656" height="48" rx="18" fill="#2b2513" stroke={colors.POSITIVE} strokeWidth="2.5" />
        <text x="328" y="30" textAnchor="middle" fill={colors.POSITIVE} fontSize="14" fontFamily={colors.font.mono}>anchored memory survives inside merged W</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="176" y="116" width="928" height="452" rx="56" fill={colors.BG} stroke={colors.ACCENT} strokeWidth="4" />
      <text x="640" y="205" textAnchor="middle" fill={colors.TEXT} fontSize="48" fontWeight="880">learn · merge · reset</text>
      {[{ x: 350, l: 'rank-32 update', c: colors.ACCENT }, { x: 640, l: 'fold into W', c: colors.WARM }, { x: 930, l: 'fresh slot', c: colors.POSITIVE }].map((a, i) => <g key={a.l} transform={`translate(${a.x} 360)`}>
        <circle r="74" fill="#101827" stroke={a.c} strokeWidth="4" />
        <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="14">{a.l}</text>
        {i < 2 && <path d="M84 0 H182" stroke={colors.MUTED} strokeWidth="4" strokeDasharray="10 8" />}
      </g>)}
      <text x="640" y="500" textAnchor="middle" fill={colors.MUTED} fontSize="16">one fixed-size learner · a cumulative base model</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
