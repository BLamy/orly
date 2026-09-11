// Grounding: arXiv:2608.12564 Sections 1, 3.1, and Table 1;
// official WMRL files ml_research/configs/wmrl_9b.yaml,
// ml_research/agent/loop.py, and ml_research/agent/grader.py.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const DOTS = Array.from({ length: 64 }, (_, i) => ({
  group: Math.floor(i / 8),
  member: i % 8,
  x: 180 + (i % 8) * 48,
  y: 154 + Math.floor(i / 8) * 43,
  delay: i / 64,
}));
const GROUP_COLORS = [colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const questionU = tl.channel('research question', 0);
  const fieldU = tl.channel('trajectory field', 0);
  const batchU = tl.channel('generation wave', 0);
  const wallU = tl.channel('execution wall', 0);
  const crossU = tl.channel('move to execution', 0);
  const timerU = tl.channel('isolated timers', 0);
  const queueU = tl.channel('execution queue', 0);
  const configU = tl.channel('training configuration', 0);
  const compareU = tl.channel('compute comparison', 0);
  const closeU = tl.channel('closing claim', 0);
  const pulse = tl.channel('batch pulse', 0);
  tl.tween(pulse, 1, { at: 0, dur: 63, ease: ease.linear });

  tl.caption({ at: 0.4, dur: 5.6, text: 'An automatic research agent does not propose one solution. It explores a whole family of experiments.' });
  tl.tween(questionU, 1, { at: 0.8, dur: 0.7, ease: ease.enter });
  tl.tween(cam, { x: 330, y: 300, k: 1.08 }, { at: 2.2, dur: 1.3, ease: ease.move });

  tl.caption({ at: 6.4, dur: 5.6, text: 'The released nine-billion-parameter recipe samples eight groups of eight trajectories on every training step.' });
  tl.tween(fieldU, 1, { at: 6.8, dur: 2.6, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 9.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.4, dur: 5.6, text: 'Model generation shares compute across that field. One batched wave advances many trajectories together.' });
  tl.tween(batchU, 1, { at: 13.0, dur: 3.8, ease: ease.linear });

  tl.caption({ at: 18.4, dur: 5.6, text: 'Each trajectory can take four turns, refining code after every observation, while generation stays parallel.' });
  tl.tween(configU, 0.42, { at: 19.0, dur: 0.7, ease: ease.enter });
  tl.tween(cam, { x: 390, y: 340, k: 1.10 }, { at: 20.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 24.4, dur: 5.6, text: 'Then grading changes the physics. Every final solution enters its own sandbox and consumes real machine time.' });
  tl.tween(questionU, 0, { at: 24.3, dur: 0.7, ease: ease.move });
  tl.tween(wallU, 1, { at: 24.8, dur: 1.3, ease: ease.draw });
  tl.tween(crossU, 1, { at: 25.5, dur: 3.0, ease: ease.move });
  tl.tween(cam, { x: 825, y: 330, k: 1.08 }, { at: 26.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 30.4, dur: 5.6, text: 'Unlike token generation, sixty-four separate executions cannot collapse into one shared forward pass.' });
  tl.tween(timerU, 1, { at: 30.8, dur: 2.8, ease: ease.linear });

  tl.caption({ at: 36.4, dur: 5.6, text: 'The queue grows behind a fixed pool of graphics processors. More trajectories now mean more isolated clocks.' });
  tl.tween(queueU, 1, { at: 36.8, dur: 3.4, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 35.6, dur: 1.2, ease: ease.move });

  tl.caption({ at: 42.4, dur: 5.6, text: 'That imbalance makes environment execution, not agent generation, the scaling ceiling.' });
  tl.tween(configU, 1, { at: 44.0, dur: 0.7, ease: ease.enter });

  tl.caption({ at: 48.4, dur: 5.6, text: 'For the nine-billion-parameter agent, real-execution training consumed one thousand one hundred seventy-four graphics processor hours.' });
  tl.tween(compareU, 1, { at: 49.0, dur: 1.5, ease: ease.draw });

  tl.caption({ at: 54.4, dur: 6.4, text: 'The central question is simple: can most experiments be graded without running them, while a small trusted stream keeps the learning honest?' });
  tl.tween(closeU, 1, { at: 55.2, dur: 1.3, ease: ease.move });
  tl.hold(61.0, 1.2);

  return { tl, cam, questionU, fieldU, batchU, wallU, crossU, timerU, queueU, configU, compareU, closeU, pulse };
}

const scene = buildScene();

function Hourglass({ x, y, u, i }: { x: number; y: number; u: number; i: number }) {
  const p = clamp01(u * 12 - (i % 12));
  if (p <= 0) return null;
  return <g transform={`translate(${x} ${y})`} opacity={p}>
    <path d="M-8 -11 H8 L-6 11 H6 L-8 -11" fill="none" stroke={colors.WARM} strokeWidth="1.7" />
    <circle cy={-5 + 10 * p} r="2.2" fill={colors.WARM} />
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const cross = s.get(scene.crossU);
  const queue = s.get(scene.queueU);
  const pulse = s.get(scene.pulse);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="72" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">the execution wall</text>
      <g opacity={s.get(scene.questionU)}>
        <rect x="70" y="102" width="430" height="58" rx="20" fill="#10243a" stroke={colors.ACCENT} strokeWidth="2.5" />
        <text x="285" y="137" textAnchor="middle" fill={colors.ACCENT} fontSize="15" fontFamily={colors.font.mono}>research question → 8 groups × 8 trajectories</text>
      </g>
      <rect x="92" y="178" width="470" height="366" rx="30" fill="#101827" stroke={colors.GRID} strokeWidth="2" opacity={s.get(scene.fieldU)} />
      <text x="327" y="520" textAnchor="middle" fill={colors.MUTED} fontSize="12" opacity={s.get(scene.fieldU)}>batched model generation</text>
      {DOTS.map((d, i) => {
        const u = clamp01(s.get(scene.fieldU) * 1.7 - d.delay * 0.7);
        const targetX = 750 + d.member * 44;
        const targetY = 150 + d.group * 52;
        const x = d.x + (targetX - d.x) * cross;
        const y = d.y + (targetY - d.y) * cross;
        const wave = Math.abs(s.get(scene.batchU) - d.delay) < 0.10 ? 1 : 0;
        return <g key={i} transform={`translate(${x} ${y})`} opacity={u}>
          <circle r={6 + wave * 3} fill={GROUP_COLORS[d.group % 4]} opacity={0.72 + wave * 0.28} />
          {cross > 0.96 && <Hourglass x={0} y={0} u={s.get(scene.timerU)} i={i} />}
        </g>;
      })}
      {s.get(scene.batchU) > 0 && <line x1={120 + 420 * s.get(scene.batchU)} y1="190" x2={120 + 420 * s.get(scene.batchU)} y2="505" stroke={colors.ACCENT} strokeWidth="12" opacity={0.10 + 0.08 * Math.sin(pulse * Math.PI * 12)} />}
      <g opacity={s.get(scene.wallU)}>
        <rect x="690" y="118" width="500" height="445" rx="32" fill="#221b13" stroke={colors.WARM} strokeWidth="3" />
        <text x="940" y="102" textAnchor="middle" fill={colors.WARM} fontSize="13" fontFamily={colors.font.mono}>isolated sandbox execution</text>
        {[0, 1, 2].map((i) => <rect key={i} x={1128} y={165 + i * 105} width="36" height="72" rx="9" fill="#463619" stroke={colors.WARM} />)}
        <text x="1146" y="494" textAnchor="middle" fill={colors.MUTED} fontSize="11">fixed slots</text>
      </g>
      <g opacity={queue}>
        <path d="M760 448 H1110" stroke={colors.NEGATIVE} strokeWidth="5" strokeDasharray="11 8" />
        <text x="935" y="475" textAnchor="middle" fill={colors.NEGATIVE} fontSize="13">queue length rises with isolated runs</text>
      </g>
      <g opacity={s.get(scene.configU)}>
        <rect x="88" y="455" width="475" height="42" rx="16" fill="#151f31" stroke={colors.SECONDARY} />
        <text x="326" y="474" textAnchor="middle" fill={colors.SECONDARY} fontSize="12" fontFamily={colors.font.mono}>group_size: 8 · train_batch_size: 8 · max_turns: 4</text>
        <text x="326" y="490" textAnchor="middle" fill={colors.MUTED} fontSize="10">wmrl_9b.yaml</text>
      </g>
      <g opacity={s.get(scene.compareU)}>
        <rect x="738" y="455" width="404" height="22" rx="11" fill="#321822" />
        <rect x="738" y="455" width={404 * s.get(scene.compareU)} height="22" rx="11" fill={colors.NEGATIVE} />
        <text x="940" y="445" textAnchor="middle" fill={colors.TEXT} fontSize="12">real execution · 1,174 GPU-hours</text>
      </g>
    </g>
    <g opacity={close}>
      <rect x="205" y="145" width="870" height="390" rx="48" fill={colors.BG} stroke={colors.ACCENT} strokeWidth="4" />
      <text x="640" y="260" textAnchor="middle" fill={colors.TEXT} fontSize="44" fontWeight="850">can the experiment be imagined?</text>
      <g transform="translate(365 365)"><circle r="48" fill="#10243a" stroke={colors.ACCENT} strokeWidth="4" /><text y="6" textAnchor="middle" fill={colors.ACCENT} fontSize="14">generate</text></g>
      <path d="M420 365 H560" stroke={colors.MUTED} strokeWidth="5" />
      <g transform="translate(640 365)"><circle r="62" fill="#251d34" stroke={colors.SECONDARY} strokeWidth="4" /><text y="6" textAnchor="middle" fill={colors.SECONDARY} fontSize="16">predict?</text></g>
      <path d="M705 365 H855" stroke={colors.MUTED} strokeWidth="5" />
      <g transform="translate(915 365)"><circle r="48" fill="#2c2111" stroke={colors.WARM} strokeWidth="4" /><text y="6" textAnchor="middle" fill={colors.WARM} fontSize="14">execute</text></g>
      <text x="640" y="474" textAnchor="middle" fill={colors.MUTED} fontSize="17">keep a thin trusted stream of real outcomes</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
