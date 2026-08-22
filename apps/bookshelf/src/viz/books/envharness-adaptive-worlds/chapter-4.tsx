// Grounding: envharness/orchestration/orchestrator.py; orchestration/runner.py;
// agents/harness_agent.py; core/code_loader.py; paper Section 3.2 and Table 8.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const TRACE_SHAPES = [
  [0.25, 0.38, 0.52, 0.47, 0.18, 0.12, 0.1],
  [0.2, 0.42, 0.56, 0.62, 0.58, 0.28, 0.16],
  [0.18, 0.31, 0.46, 0.41, 0.38, 0.7, 0.84],
  [0.23, 0.48, 0.66, 0.61, 0.24, 0.15, 0.12],
  [0.21, 0.39, 0.58, 0.55, 0.44, 0.72, 0.9],
];
const OUTCOMES = [false, false, true, false, true];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const wheelU = tl.channel('diagnostic wheel', 0);
  const baselineP = tl.channel('five baseline traces', 0);
  const diagnoseU = tl.channel('diagnosis lens', 0);
  const codeU = tl.channel('candidate code', 0);
  const stackU = tl.channel('candidate stack', 0);
  const capsulesP = tl.channel('fresh rollout capsules', 0);
  const errorU = tl.channel('cheap code failure', 0);
  const aggregateU = tl.channel('aggregate evidence', 0);
  const evidenceStageU = tl.channel('evidence stage', 0);
  const decisionStageU = tl.channel('decision stage', 0);
  const decisionP = tl.channel('three decisions', 0);
  const cycleU = tl.channel('revision cycle', 0);
  const acceptedU = tl.channel('accepted lesson', 0);
  const close = tl.channel('rigger recap', 0);

  tl.caption({ at: 0.4, dur: 6.3, text: 'Environment Rigger treats the policy as a black box and begins with five baseline rollouts.' });
  tl.tween(wheelU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.tween(baselineP, 5, { at: 1.6, dur: 3.8, ease: ease.enter });

  tl.caption({ at: 7.1, dur: 6.4, text: 'Successes and failures form a capability fingerprint. One verdict would hide the pattern.' });
  tl.tween(cam, { x: 460, y: 360, k: 1.12 }, { at: 7.8, dur: 1.2, ease: ease.move });
  tl.tween(wheelU, 1.8, { at: 9.0, dur: 3.6, ease: ease.linear });

  tl.caption({ at: 13.9, dur: 6.5, text: 'The diagnosis names a behavior it can target: an action loop, a missed constraint, or an observation too long to parse.' });
  tl.tween(diagnoseU, 1, { at: 14.5, dur: 0.9, ease: ease.enter });
  tl.tween(cam, { x: 690, y: 360, k: 1.08 }, { at: 17.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 20.8, dur: 6.6, text: 'The harness agent writes the layer itself: generated Rules code and, when needed, Setup actions.' });
  tl.tween(codeU, 1, { at: 21.4, dur: 1.0, ease: ease.enter });
  tl.tween(stackU, 1, { at: 23.0, dur: 1.2, ease: ease.draw });

  tl.caption({ at: 27.8, dur: 6.5, text: 'The runner builds Rules around Setup around the base world, then gives each fresh rollout its own process.' });
  tl.tween(capsulesP, 5, { at: 28.4, dur: 3.2, ease: ease.enter });
  tl.tween(cam, { x: 850, y: 360, k: 1.1 }, { at: 29.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 34.7, dur: 6.5, text: 'Malformed generated code becomes an error trace before the expensive benchmark starts. One bad mutation cannot kill the search.' });
  tl.tween(errorU, 1, { at: 35.3, dur: 0.6, ease: ease.pop });
  tl.tween(errorU, 0.35, { at: 38.0, dur: 0.8, ease: ease.move });

  tl.caption({ at: 41.6, dur: 6.4, text: 'Five fresh trajectories are judged together by success rate, failure shape, and timeouts.' });
  tl.tween(evidenceStageU, 1, { at: 41.8, dur: 0.8, ease: ease.move });
  tl.tween(aggregateU, 1, { at: 42.2, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 44.5, dur: 1.2, ease: ease.move });

  tl.caption({ at: 48.4, dur: 6.7, text: 'Accept keeps the candidate. Refine sends these traces back to writing. Reject asks for a different proposal.' });
  tl.tween(decisionStageU, 1, { at: 47.4, dur: 1.0, ease: ease.move });
  tl.tween(decisionP, 3, { at: 49.0, dur: 2.0, ease: ease.enter });
  tl.tween(cycleU, 1, { at: 51.0, dur: 2.8, ease: ease.draw });

  tl.caption({ at: 55.5, dur: 7.1, text: 'After at most five write-and-validate rounds, accepted components become the next lessons the learner must master.' });
  tl.tween(acceptedU, 1, { at: 56.1, dur: 0.8, ease: ease.pop });
  tl.tween(close, 1, { at: 60.5, dur: 1.0, ease: ease.move });
  tl.hold(62.8, 1.0);

  return { tl, cam, wheelU, baselineP, diagnoseU, codeU, stackU, capsulesP, errorU, aggregateU, evidenceStageU, decisionStageU, decisionP, cycleU, acceptedU, close };
}

const scene = buildScene();

function TracePath({ values, index, reveal }: { values: number[]; index: number; reveal: number }) {
  const x0 = 165;
  const y0 = 205 + index * 60;
  const points = values.map((v, i) => `${x0 + i * 48},${y0 + (0.5 - v) * 42}`).join(' ');
  return <g opacity={reveal}>
    <polyline points={points} fill="none" stroke={OUTCOMES[index] ? colors.POSITIVE : colors.NEGATIVE} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={x0 + 6 * 48} cy={y0 + (0.5 - values[6]) * 42} r="9" fill={OUTCOMES[index] ? colors.POSITIVE : colors.NEGATIVE} />
    <text x="130" y={y0 + 6} textAnchor="end" fill={colors.MUTED} fontSize="13">rollout {index + 1}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const quiet = 1 - close;
  const evidenceStage = s.get(scene.evidenceStageU);
  const decisionStage = s.get(scene.decisionStageU);
  const aggregateX = 320 + (466 - 320) * decisionStage;
  const aggregateY = 275 + (150 - 275) * decisionStage;
  const wheelAngle = (s.get(scene.wheelU) - 1) * 80;
  return <Camera {...s.get(scene.cam)}>
    <g opacity={quiet}>
      <text x="640" y="70" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="700">The diagnostic lathe</text>

      <g opacity={1 - evidenceStage}>
      <g transform={`rotate(${wheelAngle} 330 350)`} opacity={clamp01(s.get(scene.wheelU))}>
        <circle cx="330" cy="350" r="188" fill="#0e1628" stroke={colors.ACCENT} strokeWidth="4" />
        <circle cx="330" cy="350" r="154" fill="none" stroke={colors.GRID} strokeWidth="26" strokeDasharray="6 13" />
      </g>
      {TRACE_SHAPES.map((v, i) => <TracePath key={i} values={v} index={i} reveal={clamp01(s.get(scene.baselineP) - i)} />)}
      <text x="330" y="140" textAnchor="middle" fill={colors.ACCENT} fontSize="15" fontWeight="700" opacity={clamp01(s.get(scene.wheelU)) * (1 - clamp01(s.get(scene.capsulesP)))}>K = 5 baseline trajectories</text>

      <g opacity={s.get(scene.diagnoseU)}>
        <circle cx="520" cy="258" r="64" fill="#211a38" stroke={colors.SECONDARY} strokeWidth="4" />
        <circle cx="520" cy="258" r="34" fill="none" stroke={colors.SECONDARY} strokeWidth="6" />
        <path d="M560 306 L610 356" stroke={colors.SECONDARY} strokeWidth="10" strokeLinecap="round" />
        <rect x="430" y="356" width="260" height="82" rx="20" fill="#211a38" stroke={colors.SECONDARY} />
        <text x="560" y="386" textAnchor="middle" fill={colors.SECONDARY} fontSize="16" fontWeight="700">DIAGNOSE</text>
        <text x="560" y="415" textAnchor="middle" fill={colors.TEXT} fontSize="15">repetitive action loop</text>
      </g>

      <g opacity={s.get(scene.codeU)}>
        <rect x="585" y="120" width="292" height="184" rx="24" fill="#111827" stroke={colors.WARM} strokeWidth="3" />
        <text x="731" y="153" textAnchor="middle" fill={colors.WARM} fontSize="16" fontWeight="700">HarnessAgent.propose()</text>
        <text x="610" y="190" fill={colors.TEXT} fontSize="15" fontFamily={colors.font.mono}>rules_code</text>
        <text x="610" y="222" fill={colors.TEXT} fontSize="15" fontFamily={colors.font.mono}>in_env_actions</text>
        <text x="610" y="262" fill={colors.MUTED} fontSize="14">writes Python, not a fixed menu</text>
      </g>

      <g opacity={s.get(scene.stackU)}>
        <path d="M730 304 V360 H820" fill="none" stroke={colors.WARM} strokeWidth="4" strokeDasharray="8 7" />
        {['base env', 'Setup', 'Rules'].map((v, i) => <g key={v} transform={`translate(${770 + i * 42} ${420 - i * 30})`}>
          <rect x="-70" y="-27" width="140" height="54" rx="14" fill="#111827" stroke={i === 0 ? colors.ACCENT : i === 1 ? colors.SECONDARY : colors.WARM} strokeWidth="3" />
          <text y="6" textAnchor="middle" fill={colors.TEXT} fontSize="15">{v}</text>
        </g>)}
      </g>
      </g>

      <g opacity={1 - decisionStage}>
        {Array.from({ length: 5 }, (_, i) => {
          const u = clamp01(s.get(scene.capsulesP) - i);
          const y = 178 + i * 78;
          const failed = i === 1 && s.get(scene.errorU) > 0;
          return <g key={i} opacity={u}>
            <rect x="930" y={y - 26} width="264" height="52" rx="26" fill={failed ? '#351421' : '#102033'} stroke={failed ? colors.NEGATIVE : OUTCOMES[i] ? colors.POSITIVE : colors.ACCENT} strokeWidth="3" />
            <circle cx="964" cy={y} r="12" fill={failed ? colors.NEGATIVE : OUTCOMES[i] ? colors.POSITIVE : colors.ACCENT} />
            <text x="994" y={y + 5} fill={colors.TEXT} fontSize="15">process {i + 1}</text>
            <text x="1178" y={y + 5} textAnchor="end" fill={failed ? colors.NEGATIVE : colors.MUTED} fontSize={failed ? 12 : 13}>{failed ? 'RulesCodeError' : 'fresh rollout'}</text>
          </g>;
        })}
      </g>

      <g opacity={s.get(scene.aggregateU)}>
        <rect x={aggregateX} y={aggregateY} width="348" height="64" rx="20" fill="#111827" stroke={colors.TEAL} strokeWidth="3" />
        <text x={aggregateX + 174} y={aggregateY + 26} textAnchor="middle" fill={colors.TEAL} fontSize="15" fontWeight="700">aggregate all five</text>
        <text x={aggregateX + 174} y={aggregateY + 50} textAnchor="middle" fill={colors.TEXT} fontSize="14">success rate · failures · timeouts</text>
      </g>

      <g>
        {[
          { label: 'ACCEPT', color: colors.POSITIVE, x: 390 },
          { label: 'REFINE', color: colors.WARM, x: 640 },
          { label: 'REJECT', color: colors.NEGATIVE, x: 890 },
        ].map((d, i) => {
          const u = clamp01(s.get(scene.decisionP) - i);
          return <g key={d.label} opacity={u}>
            <rect x={d.x - 90} y="330" width="180" height="64" rx="20" fill="#111827" stroke={d.color} strokeWidth="3" />
            <text x={d.x} y="369" textAnchor="middle" fill={d.color} fontSize="18" fontWeight="800">{d.label}</text>
          </g>;
        })}
        <path d="M640 330 C735 290 735 238 640 214" fill="none" stroke={colors.WARM} strokeWidth="4" strokeDasharray={`${Math.max(1, s.get(scene.cycleU) * 360)} 380`} />
      </g>

      <g opacity={s.get(scene.acceptedU)}>
        <rect x="292" y="322" width="196" height="80" rx="26" fill="none" stroke={colors.POSITIVE} strokeWidth="7" />
        <text x="390" y="438" textAnchor="middle" fill={colors.POSITIVE} fontSize="16" fontWeight="700">persist accepted component</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="210" y="140" width="860" height="390" rx="38" fill={colors.BG} stroke={colors.SECONDARY} strokeWidth="4" />
      <text x="640" y="205" textAnchor="middle" fill={colors.TEXT} fontSize="32" fontWeight="800">Observe → Diagnose → Write → Validate</text>
      <circle cx="355" cy="340" r="78" fill="#111827" stroke={colors.ACCENT} strokeWidth="4" />
      <text x="355" y="334" textAnchor="middle" fill={colors.ACCENT} fontSize="27" fontWeight="800">five</text>
      <text x="355" y="368" textAnchor="middle" fill={colors.TEXT} fontSize="18">baseline rollouts</text>
      <path d="M445 340 H820" stroke={colors.WARM} strokeWidth="8" strokeLinecap="round" />
      <path d="M795 324 l28 16 -28 16" fill="none" stroke={colors.WARM} strokeWidth="8" />
      <circle cx="915" cy="340" r="78" fill="#0b211c" stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="915" y="334" textAnchor="middle" fill={colors.POSITIVE} fontSize="25" fontWeight="800">accepted</text>
      <text x="915" y="368" textAnchor="middle" fill={colors.TEXT} fontSize="18">new lesson</text>
      <text x="640" y="465" textAnchor="middle" fill={colors.MUTED} fontSize="23">fresh evidence decides what survives</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
