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
const chartY = (value: number) => 500 - value * 4.2;
// Quadratic Bézier point, used to ride the learner dot along the frontier curve.
const quad = (t: number, a: number, b: number, c: number) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;

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

  tl.caption({ at: 14.0, dur: 6.4, text: 'The web benchmark rises from thirty-eight point five to forty-one point six under the same policy and extraction protocol.' });
  tl.tween(benchmarkP, 2, { at: 14.6, dur: 1.2, ease: ease.enter });

  tl.caption({ at: 20.8, dur: 6.7, text: 'Software tasks improve twice: success reaches fifty-two point five eight, while average steps fall from fifty-five point zero one to forty-nine point six one.' });
  tl.tween(benchmarkP, 3, { at: 21.4, dur: 1.2, ease: ease.enter });
  tl.tween(stepsU, 1, { at: 22.6, dur: 1.0, ease: ease.enter });

  tl.caption({ at: 27.9, dur: 6.6, text: 'Office question answering and spreadsheet work also move upward, so the interface survives very different domains.' });
  tl.tween(benchmarkP, 5, { at: 28.5, dur: 2.0, ease: ease.enter });

  tl.caption({ at: 34.9, dur: 6.5, text: 'The reshaped worlds are a real optimization signal too. Reinforcement learning lifts ALFWorld in-distribution success from eighty-one point four to eighty-seven point nine.' });
  tl.tween(rlU, 1, { at: 35.5, dur: 1.0, ease: ease.enter });

  tl.caption({ at: 41.8, dur: 6.7, text: 'At three hundred training environments, co-evolution reaches fifty-four point seven nine, ahead of both original and generated worlds.' });
  tl.tween(scaleU, 1, { at: 42.4, dur: 1.2, ease: ease.draw });
  tl.tween(learnerU, 1, { at: 43.3, dur: 3.8, ease: ease.move });

  tl.caption({ at: 48.9, dur: 6.8, text: "Each accepted lesson moves the learner's boundary, so the next diagnosis can expose a weakness that was invisible before." });
  tl.tween(recapP, 5, { at: 49.5, dur: 2.6, ease: ease.enter });

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
  // Panels clear out in the first half of the recap so the recap row never sits on half-faded charts.
  const panelQuiet = 1 - clamp01(s.get(scene.recapP) * 2);
  const benchmarkP = s.get(scene.benchmarkP);
  const learner = s.get(scene.learnerU);
  const dotX = quad(learner, 680, 900, 1170);
  const dotY = quad(learner, 400, 400, 190);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={quiet}>
      <text x="640" y="70" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="700">The lesson moves with the learner</text>
      <g opacity={panelQuiet}>
      <g opacity={chartQuiet}>
      <g opacity={s.get(scene.heldoutU)}>
        <rect x="70" y="118" width="1140" height="442" rx="28" fill="#0d1525" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="110" y="150" fill={colors.ACCENT} fontSize="17" fontWeight="700">untouched held-out evaluation</text>
      </g>
      <g opacity={s.get(scene.axesU)}>
        <path d="M130 500 H1180 M130 170 V500" stroke={colors.MUTED} strokeWidth="2" />
        {[0, 20, 40, 60].map(v => <g key={v}><path d={`M130 ${chartY(v)} H1180`} stroke={colors.GRID} /><text x="116" y={chartY(v) + 5} textAnchor="end" fill={colors.MUTED} fontSize="14">{v}</text></g>)}
        <rect x="880" y="136" width="16" height="16" fill={colors.MUTED} /><text x="904" y="150" fill={colors.MUTED} fontSize="14">Original Envs</text>
        <rect x="1040" y="136" width="16" height="16" fill={colors.POSITIVE} /><text x="1064" y="150" fill={colors.MUTED} fontSize="14">EnvHarness Envs</text>
      </g>

      {BENCHMARKS.map((b, i) => {
        const u = clamp01(benchmarkP - i);
        const active = clamp01(1 - Math.abs(benchmarkP - (i + 1)));
        const cx = 235 + i * 210;
        const yo = chartY(b.original), yh = chartY(b.harness);
        return <g key={b.label}>
          <rect x={cx - 82} y="170" width="164" height="382" rx="18" fill={colors.ACCENT} opacity={0.12 * active * u} />
          <g opacity={u}>
            <rect x={cx - 42} y={yo} width="36" height={500 - yo} rx="6" fill={colors.MUTED} opacity="0.7" />
            <rect x={cx + 6} y={yh} width="36" height={500 - yh} rx="6" fill={colors.POSITIVE} />
            <text x={cx - 24} y={yo - 8} textAnchor="middle" fill={colors.MUTED} fontSize="14">{b.original}</text>
            <text x={cx + 24} y={yh - 8} textAnchor="middle" fill={colors.POSITIVE} fontSize="14" fontWeight="700">{b.harness}</text>
            <text x={cx} y="524" textAnchor="middle" fill={colors.TEXT} fontSize="15">{b.label}</text>
            <text x={cx} y="546" textAnchor="middle" fill={colors.WARM} fontSize="14" fontWeight="700">{b.note}</text>
          </g>
        </g>;
      })}

      <g opacity={s.get(scene.stepsU)}>
        <rect x="550" y="182" width="210" height="60" rx="20" fill="#211a12" stroke={colors.WARM} strokeWidth="3" />
        <text x="655" y="208" textAnchor="middle" fill={colors.WARM} fontSize="15" fontWeight="700">SWE average steps ↓</text>
        <text x="655" y="232" textAnchor="middle" fill={colors.TEXT} fontSize="20">55.01 → 49.61</text>
      </g>
      </g>

      <g opacity={s.get(scene.rlU)}>
        <rect x="70" y="118" width="540" height="442" rx="28" fill="#111827" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="100" y="150" fill={colors.SECONDARY} fontSize="17" fontWeight="700">reinforcement learning</text>
        <rect x="170" y="193" width="120" height="277" rx="6" fill={colors.MUTED} opacity="0.7" />
        <rect x="370" y="171" width="120" height="299" rx="6" fill={colors.POSITIVE} />
        <text x="230" y="183" textAnchor="middle" fill={colors.MUTED} fontSize="22" fontWeight="700">81.4</text>
        <text x="430" y="161" textAnchor="middle" fill={colors.POSITIVE} fontSize="22" fontWeight="700">87.9</text>
        <text x="230" y="492" textAnchor="middle" fill={colors.MUTED} fontSize="15">base</text>
        <text x="430" y="492" textAnchor="middle" fill={colors.TEXT} fontSize="15">after RL</text>
        <text x="330" y="524" textAnchor="middle" fill={colors.MUTED} fontSize="15">ALFWorld · in-distribution success</text>
      </g>

      <g opacity={s.get(scene.scaleU)}>
        <rect x="630" y="118" width="580" height="442" rx="28" fill="#111827" stroke={colors.TEAL} strokeWidth="3" />
        <text x="660" y="150" fill={colors.TEAL} fontSize="17" fontWeight="700">at 300 environments</text>
        <path d="M680 400 Q900 400 1170 190" fill="none" stroke={colors.POSITIVE} strokeWidth="5" strokeLinecap="round" pathLength="1" strokeDasharray={`${Math.max(0.001, learner)} 1`} />
        <circle cx={dotX} cy={dotY} r="11" fill={colors.POSITIVE} />
        <text x="680" y="445" fill={colors.POSITIVE} fontSize="20" fontWeight="700">EnvHarness 54.79</text>
        <text x="680" y="480" fill={colors.MUTED} fontSize="17">Original 52.13</text>
        <text x="680" y="515" fill={colors.NEGATIVE} fontSize="17">Generated 50.37</text>
      </g>
      </g>

      <g>
        {RECAP.map((label, i) => {
          const u = clamp01(s.get(scene.recapP) - i);
          const x = 140 + i * 250;
          return <g key={label} opacity={u}>
            {i < 4 && <path d={`M${x + 55} 350 H${x + 195}`} stroke={colors.ACCENT} strokeWidth="4" />}
            <circle cx={x} cy="350" r="31" fill="#111827" stroke={i === 4 ? colors.POSITIVE : colors.ACCENT} strokeWidth="3" />
            <text x={x} y="355" textAnchor="middle" fill={colors.TEXT} fontSize="14">{i + 1}</text>
            <text x={x} y="407" textAnchor="middle" fill={colors.MUTED} fontSize="14">{label}</text>
          </g>;
        })}
      </g>
    </g>

    <g opacity={close}>
      <rect x="205" y="140" width="870" height="390" rx="38" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <path d="M300 430 C410 400 470 340 570 350 C670 360 700 290 810 300 C880 306 925 268 980 262" fill="none" stroke={colors.POSITIVE} strokeWidth="8" strokeLinecap="round" />
      <circle cx="570" cy="350" r="16" fill={colors.WARM} />
      <circle cx="810" cy="300" r="16" fill={colors.WARM} />
      <circle cx="980" cy="262" r="18" fill={colors.POSITIVE} />
      <text x="640" y="205" textAnchor="middle" fill={colors.TEXT} fontSize="31" fontWeight="800">Move the lesson to the learner's boundary</text>
      <text x="640" y="478" textAnchor="middle" fill={colors.MUTED} fontSize="23">diagnose · reshape · validate · learn · repeat</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
