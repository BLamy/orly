// Grounding: EnvHarness paper Tables 2–5 and Figure 5; README.md results;
// experiments/*/reasoning_bank_eval.py (arXiv:2608.19880).
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const BENCHMARKS = [
  { label: 'ALFWorld avg', original: 62.4, harness: 68.3, note: 'OOD +9.0' },
  { label: 'WebArena avg', original: 38.5, harness: 41.6, note: '+3.1' },
  { label: 'SWE SR', original: 49.88, harness: 52.58, note: '+2.70' },
  { label: 'OfficeQA EM', original: 54.4, harness: 56.2, note: '+1.80' },
  { label: 'Sheet Pass@1', original: 45.88, harness: 49.15, note: '+3.27' },
];
const RECAP = ['frozen world', 'interface layer', 'written component', 'fresh rollouts', 'carried skill'];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const chartY = (value: number) => 440 - value * 3.8;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const heldoutU = tl.channel('held out boundary', 0);
  const axesU = tl.channel('benchmark axes', 0);
  const benchmarkP = tl.channel('benchmark gains', 0);
  const stepsU = tl.channel('step efficiency', 0);
  const rlU = tl.channel('reinforcement learning', 0);
  const scaleU = tl.channel('environment scaling', 0);
  const learnerU = tl.channel('learner frontier', 0);
  const recapP = tl.channel('journey recap', 0);
  const close = tl.channel('moving boundary close', 0);

  tl.caption({ at: 0.4, dur: 6.3, text: 'The test stays untouched. Skills learned in reshaped worlds must earn their result on held-out tasks.' });
  tl.tween(heldoutU, 1, { at: 0.8, dur: 1.1, ease: ease.draw });
  tl.tween(axesU, 1, { at: 1.8, dur: 1.3, ease: ease.draw });

  tl.caption({ at: 7.1, dur: 6.5, text: 'On ALFWorld, the average rises from sixty-two point four to sixty-eight point three, with a nine-point held-out gain.' });
  tl.tween(benchmarkP, 1, { at: 7.7, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 400, y: 360, k: 1.08 }, { at: 8.8, dur: 1.2, ease: ease.move });

  tl.caption({ at: 14.0, dur: 6.4, text: 'The web benchmark rises from thirty-eight point five to forty-one point six under the same policy and extraction protocol.' });
  tl.tween(benchmarkP, 2, { at: 14.6, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 500, y: 360, k: 1.08 }, { at: 15.5, dur: 1.2, ease: ease.move });

  tl.caption({ at: 20.8, dur: 6.7, text: 'Software tasks improve twice: success reaches fifty-two point five eight, while average steps fall from fifty-five point zero one to forty-nine point six one.' });
  tl.tween(benchmarkP, 3, { at: 21.4, dur: 1.2, ease: ease.enter });
  tl.tween(stepsU, 1, { at: 22.6, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 660, y: 360, k: 1.08 }, { at: 22.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 27.9, dur: 6.6, text: 'Office question answering and spreadsheet work also move upward, so the interface survives very different domains.' });
  tl.tween(benchmarkP, 5, { at: 28.5, dur: 2.0, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 31.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 34.9, dur: 6.5, text: 'The reshaped worlds are a real optimization signal too. Reinforcement learning lifts ALFWorld in-distribution success from eighty-one point four to eighty-seven point nine.' });
  tl.tween(rlU, 1, { at: 35.5, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 880, y: 360, k: 1.08 }, { at: 36.8, dur: 1.2, ease: ease.move });

  tl.caption({ at: 41.8, dur: 6.7, text: 'At three hundred training environments, co-evolution reaches fifty-four point seven nine, ahead of both original and generated worlds.' });
  tl.tween(scaleU, 1, { at: 42.4, dur: 1.2, ease: ease.draw });
  tl.tween(learnerU, 1, { at: 43.3, dur: 3.8, ease: ease.move });
  tl.tween(cam, { x: 900, y: 360, k: 1.08 }, { at: 44.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 48.9, dur: 6.8, text: "Each accepted lesson moves the learner's boundary, so the next diagnosis can expose a weakness that was invisible before." });
  tl.tween(recapP, 5, { at: 49.5, dur: 2.6, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 52.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 56.1, dur: 7.1, text: 'Freeze the benchmark, reshape its interface, validate the lesson, and keep moving the boundary with the learner.' });
  tl.tween(close, 1, { at: 59.8, dur: 1.0, ease: ease.move });
  tl.hold(63.2, 1.0);
  return { tl, cam, heldoutU, axesU, benchmarkP, stepsU, rlU, scaleU, learnerU, recapP, close };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const quiet = 1 - close;
  const chartQuiet = 1 - clamp01(s.get(scene.rlU));
  return <Camera {...s.get(scene.cam)}>
    <g opacity={quiet}>
      <text x="640" y="70" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="700">The lesson moves with the learner</text>
      <g opacity={1 - clamp01(s.get(scene.recapP))}>
      <g opacity={chartQuiet}>
      <g opacity={s.get(scene.heldoutU)}>
        <rect x="70" y="118" width="790" height="410" rx="28" fill="#0d1525" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="465" y="151" textAnchor="middle" fill={colors.ACCENT} fontSize="17" fontWeight="700">untouched held-out evaluation</text>
      </g>
      <g opacity={s.get(scene.axesU)}>
        <path d="M110 440 H825 M110 165 V440" stroke={colors.MUTED} strokeWidth="2" />
        {[40, 50, 60, 70].map(v => <g key={v}><path d={`M105 ${chartY(v)} H825`} stroke={colors.GRID} /><text x="96" y={chartY(v) + 5} textAnchor="end" fill={colors.MUTED} fontSize="13">{v}</text></g>)}
        <rect x="145" y="166" width="16" height="16" fill={colors.MUTED} /><text x="170" y="180" fill={colors.MUTED} fontSize="13">Original Envs</text>
        <rect x="285" y="166" width="16" height="16" fill={colors.POSITIVE} /><text x="310" y="180" fill={colors.MUTED} fontSize="13">EnvHarness Envs</text>
      </g>

      {BENCHMARKS.map((b, i) => {
        const u = clamp01(s.get(scene.benchmarkP) - i);
        const x = 170 + i * 145;
        const yo = chartY(b.original), yh = chartY(b.harness);
        return <g key={b.label} opacity={u}>
          <rect x={x - 29} y={yo} width="25" height={440 - yo} rx="6" fill={colors.MUTED} opacity="0.7" />
          <rect x={x + 5} y={yh} width="25" height={440 - yh} rx="6" fill={colors.POSITIVE} />
          <path d={`M${x - 17} ${yo - 12} Q${x} ${yh - 34} ${x + 17} ${yh - 12}`} fill="none" stroke={colors.WARM} strokeWidth="2" />
          <text x={x} y="462" textAnchor="middle" fill={colors.TEXT} fontSize="12">{b.label}</text>
          <text x={x} y={Math.min(yo, yh) - 18} textAnchor="middle" fill={colors.WARM} fontSize="13" fontWeight="700">{b.note}</text>
        </g>;
      })}

      <g opacity={s.get(scene.stepsU)}>
        <rect x="470" y="210" width="300" height="72" rx="20" fill="#211a12" stroke={colors.WARM} strokeWidth="3" />
        <text x="620" y="239" textAnchor="middle" fill={colors.WARM} fontSize="15" fontWeight="700">SWE average steps ↓</text>
        <text x="620" y="267" textAnchor="middle" fill={colors.TEXT} fontSize="20">55.01 → 49.61</text>
      </g>
      </g>

      <g opacity={s.get(scene.rlU)}>
        <rect x="890" y="120" width="320" height="180" rx="28" fill="#111827" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="1050" y="154" textAnchor="middle" fill={colors.SECONDARY} fontSize="17" fontWeight="700">reinforcement learning</text>
        <path d="M950 254 V205 M1040 254 V187" stroke={colors.MUTED} strokeWidth="42" />
        <path d="M1130 254 V169" stroke={colors.POSITIVE} strokeWidth="42" />
        <text x="950" y="279" textAnchor="middle" fill={colors.MUTED} fontSize="13">base</text>
        <text x="1040" y="279" textAnchor="middle" fill={colors.MUTED} fontSize="13">81.4</text>
        <text x="1130" y="279" textAnchor="middle" fill={colors.POSITIVE} fontSize="13">87.9</text>
      </g>

      <g opacity={s.get(scene.scaleU)}>
        <rect x="890" y="318" width="320" height="210" rx="28" fill="#111827" stroke={colors.TEAL} strokeWidth="3" />
        <text x="1050" y="350" textAnchor="middle" fill={colors.TEAL} fontSize="17" fontWeight="700">at 300 environments</text>
        <path d="M930 482 C975 478 1015 452 1055 425 C1095 398 1130 382 1170 370" fill="none" stroke={colors.POSITIVE} strokeWidth="5" strokeDasharray={`${Math.max(1, s.get(scene.learnerU) * 330)} 350`} />
        <circle cx={930 + 240 * s.get(scene.learnerU)} cy={482 - 112 * s.get(scene.learnerU)} r="11" fill={colors.POSITIVE} />
        <text x="1168" y="392" textAnchor="end" fill={colors.POSITIVE} fontSize="15" fontWeight="700">EnvHarness 54.79</text>
        <text x="1168" y="455" textAnchor="end" fill={colors.MUTED} fontSize="14">Original 52.13</text>
        <text x="1168" y="492" textAnchor="end" fill={colors.NEGATIVE} fontSize="14">Generated 50.37</text>
      </g>
      </g>

      <g>
        {RECAP.map((label, i) => {
          const u = clamp01(s.get(scene.recapP) - i);
          const x = 120 + i * 250;
          return <g key={label} opacity={u}>
            {i < 4 && <path d={`M${x + 55} 350 H${x + 195}`} stroke={colors.ACCENT} strokeWidth="4" />}
            <circle cx={x} cy="350" r="31" fill="#111827" stroke={i === 4 ? colors.POSITIVE : colors.ACCENT} strokeWidth="3" />
            <text x={x} y="355" textAnchor="middle" fill={colors.TEXT} fontSize="14">{i + 1}</text>
            <text x={x} y="407" textAnchor="middle" fill={colors.MUTED} fontSize="13">{label}</text>
          </g>;
        })}
      </g>
    </g>

    <g opacity={close}>
      <rect x="205" y="140" width="870" height="390" rx="38" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <path d="M300 430 C410 390 470 300 570 320 C670 340 700 230 810 260 C880 278 925 220 980 190" fill="none" stroke={colors.POSITIVE} strokeWidth="8" strokeLinecap="round" />
      <circle cx="570" cy="320" r="16" fill={colors.WARM} />
      <circle cx="810" cy="260" r="16" fill={colors.WARM} />
      <circle cx="980" cy="190" r="18" fill={colors.POSITIVE} />
      <text x="640" y="205" textAnchor="middle" fill={colors.TEXT} fontSize="31" fontWeight="800">Move the lesson to the learner's boundary</text>
      <text x="640" y="478" textAnchor="middle" fill={colors.MUTED} fontSize="23">diagnose · reshape · validate · learn · repeat</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
