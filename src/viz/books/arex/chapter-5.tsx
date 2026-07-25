// The Answer Audits Itself — chapter 5: Reward the Turning Point.
//
// Grounded in AREX paper §§3.2, 4.1, and 4.2 plus the official README's
// model variants and benchmark scope. Teacher trajectories are filtered for
// valid tool use and reconstructable evidence. Mid-training replays key steps;
// reinforcement learning uses hierarchical step-balanced normalization and a
// bounded key-step bonus only for successful trajectories.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const STEPS = Array.from({ length: 24 }, (_, i) => ({
  kind: i % 4 === 0 ? 'search' : i % 4 === 1 ? 'visit' : i % 4 === 2 ? 'reason' : 'verify',
  key: [6, 11, 17, 21].includes(i),
}));
const KEY_LABELS: Record<number, string> = {
  6: 'decisive evidence',
  11: 'contradiction resolved',
  17: 'wrong path repaired',
  21: 'constraint verified',
};

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const trajU = tl.channel('trajU', 0);
  const qcU = tl.channel('qcU', 0);
  const outcomeU = tl.channel('outcomeU', 0);
  const flatU = tl.channel('flatU', 0);
  const keyU = tl.channel('keyU', 0);
  const shapeU = tl.channel('shapeU', 0);
  const normalizeU = tl.channel('normalizeU', 0);
  const modelsU = tl.channel('modelsU', 0);
  const recapU = tl.channel('recapU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.4, dur: 5.7, text: 'Training starts with long teacher trajectories: actions, tool calls, observations, analysis, and a structured answer.' });
  tl.tween(trajU, 1, { at: 0.9, dur: 2.2, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 340, k: 1.08 }, { at: 1.2, dur: 1.4, ease: ease.move });
  tl.hold(6.1, 0.5);

  tl.caption({ at: 6.6, dur: 5.2, text: 'The pipeline removes runs with invalid tools, ignored observations, unsupported claims, or answers that the evidence cannot reconstruct.' });
  tl.tween(qcU, 1, { at: 7.2, dur: 1.6, ease: ease.move });
  tl.hold(11.8, 0.5);

  tl.caption({ at: 12.3, dur: 5.1, text: 'A final outcome reward can tell you whether the whole trajectory worked.' });
  tl.tween(outcomeU, 1, { at: 12.9, dur: 0.7, ease: ease.pop });
  tl.tween(flatU, 1, { at: 13.7, dur: 1.5, ease: ease.draw });
  tl.hold(17.4, 0.5);

  tl.caption({ at: 17.9, dur: 5.3, text: 'But that flat signal cannot say which turn found decisive evidence or corrected a bad direction.' });
  tl.tween(cam, { x: 685, y: 345, k: 1.16 }, { at: 18.3, dur: 1.4, ease: ease.move });
  tl.tween(keyU, 1, { at: 18.6, dur: 1.6, ease: ease.enter });
  tl.hold(23.2, 0.5);

  tl.caption({ at: 23.7, dur: 5.2, text: 'The paper marks a small set of those turning points and replays them during mid-training.' });
  tl.tween(shapeU, 0.45, { at: 24.3, dur: 1.2, ease: ease.move });
  tl.hold(28.9, 0.5);

  tl.caption({ at: 29.4, dur: 5.4, text: 'During reinforcement learning, successful trajectories give those marked steps a bounded auxiliary bonus.' });
  tl.tween(shapeU, 1, { at: 30.0, dur: 1.5, ease: ease.move });
  tl.hold(34.8, 0.5);

  tl.caption({ at: 35.3, dur: 5.1, text: 'Averaging first across steps, then across trajectories, stops longer runs from winning just because they contain more tokens.' });
  tl.tween(normalizeU, 1, { at: 35.9, dur: 1.3, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 36.1, dur: 1.4, ease: ease.move });
  tl.hold(40.4, 0.5);

  tl.caption({ at: 40.9, dur: 5.3, text: 'The recipe trains a dense four-billion-parameter model and a sparse model with ten billion active parameters.' });
  tl.tween(modelsU, 1, { at: 41.5, dur: 1.5, ease: ease.enter });
  tl.hold(46.2, 0.5);

  tl.caption({ at: 46.7, dur: 7.0, text: 'Find a candidate, gather evidence, audit the answer, preserve the state, reward the turns that mattered. That is recursive research as a trainable loop.' });
  tl.tween(recapU, 1, { at: 47.3, dur: 2.4, ease: ease.linear });
  tl.tween(dimU, 1, { at: 49.8, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 50.7, dur: 0.7, ease: ease.enter });
  tl.hold(53.7, 1.0);

  return { tl, cam, trajU, qcU, outcomeU, flatU, keyU, shapeU, normalizeU, modelsU, recapU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const trajU = s.get(scene.trajU);
  const qcU = s.get(scene.qcU);
  const keyU = s.get(scene.keyU);
  const shapeU = s.get(scene.shapeU);
  const mainOpacity = 1 - 0.86 * s.get(scene.dimU);
  const startX = 95;
  const stepW = 42;
  const gap = 5;
  const baseY = 405;

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <text x={640} y={68} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={700}>Credit for a long trajectory</text>
          <text x={640} y={95} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>teacher trajectory → quality control → mid-training → reinforcement learning</text>

          <path d={`M ${startX} ${baseY + 26} L 1185 ${baseY + 26}`} stroke={colors.GRID} strokeWidth={3} />
          {STEPS.map((step, i) => {
            const u = clamp01(trajU * STEPS.length - i);
            const x = startX + i * (stepW + gap);
            const rejected = qcU > 0 && [3, 8, 14, 19].includes(i);
            const bonus = step.key ? shapeU * 92 : 0;
            const color = rejected ? colors.NEGATIVE : step.key && keyU > 0 ? colors.WARM : colors.ACCENT;
            return (
              <g key={i} transform={`translate(${x} ${baseY - bonus})`} opacity={u * (rejected ? 1 - 0.72 * qcU : 1)}>
                <rect width={stepW} height={52 + bonus} y={-bonus} rx={8} fill={color} fillOpacity={0.1 + (step.key ? 0.08 * keyU : 0)} stroke={color} strokeOpacity={0.65} />
                <text x={stepW / 2} y={30} textAnchor="middle" fill={colors.TEXT} fontSize={7.8} fontFamily={MONO}>{step.kind}</text>
                <text x={stepW / 2} y={45} textAnchor="middle" fill={colors.MUTED} fontSize={7.5}>{i + 1}</text>
                {rejected && <text x={stepW / 2} y={-7} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15}>×</text>}
                {step.key && keyU > 0 && (
                  <g opacity={keyU}>
                    <circle cx={stepW / 2} cy={-bonus - 14} r={6} fill={colors.WARM} />
                    <text x={stepW / 2} y={-bonus - 27} textAnchor="middle" fill={colors.WARM} fontSize={7.8}>{KEY_LABELS[i]}</text>
                  </g>
                )}
              </g>
            );
          })}

          {s.get(scene.outcomeU) > 0 && (
            <g opacity={s.get(scene.outcomeU)}>
              <circle cx={1195} cy={baseY + 26} r={34} fill={colors.POSITIVE} opacity={0.16} stroke={colors.POSITIVE} />
              <text x={1195} y={baseY + 30} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontWeight={700}>valid</text>
            </g>
          )}

          {s.get(scene.flatU) > 0 && (
            <g opacity={s.get(scene.flatU)}>
              <path d={`M ${startX} 300 L 1190 300`} stroke={colors.SECONDARY} strokeWidth={4} strokeLinecap="round" />
              <text x={640} y={280} textAnchor="middle" fill={colors.SECONDARY} fontSize={11} fontFamily={MONO}>same outcome advantage across every step</text>
            </g>
          )}

          {shapeU > 0 && (
            <MathLabel tex={'A_{i,j}=A^{out}_i+\\lambda_{key}\\,\\widetilde B_{i,j}'} x={640} y={170} color={colors.WARM} fontSize={26} opacity={shapeU} />
          )}

          {s.get(scene.normalizeU) > 0 && (
            <g opacity={s.get(scene.normalizeU)}>
              <rect x={330} y={510} width={620} height={58} rx={13} fill={colors.PANEL} stroke={colors.ACCENT} />
              <text x={640} y={535} textAnchor="middle" fill={colors.TEXT} fontSize={11}>hierarchical step-balanced normalization</text>
              <text x={640} y={556} textAnchor="middle" fill={colors.ACCENT} fontSize={9.5} fontFamily={MONO}>mean within trajectory → mean across rollout group</text>
            </g>
          )}

          {s.get(scene.modelsU) > 0 && (
            <g opacity={s.get(scene.modelsU)}>
              <rect x={205} y={145} width={340} height={90} rx={15} fill={colors.ACCENT} fillOpacity={0.09} stroke={colors.ACCENT} />
              <text x={375} y={178} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontWeight={700}>AREX-Turbo</text>
              <text x={375} y={205} textAnchor="middle" fill={colors.TEXT} fontSize={11}>dense · 4B parameters</text>
              <rect x={735} y={145} width={340} height={90} rx={15} fill={colors.SECONDARY} fillOpacity={0.09} stroke={colors.SECONDARY} />
              <text x={905} y={178} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontWeight={700}>AREX-Base</text>
              <text x={905} y={205} textAnchor="middle" fill={colors.TEXT} fontSize={11}>122B total · 10B active experts</text>
            </g>
          )}

          {s.get(scene.recapU) > 0 && (
            <g opacity={s.get(scene.recapU)}>
              {['discover', 'tool loop', 'audit', 'compact', 'shape credit'].map((label, i) => {
                const u = clamp01(s.get(scene.recapU) * 6 - i);
                const x = 185 + i * 228;
                return (
                  <g key={label} opacity={u}>
                    <circle cx={x} cy={595} r={18} fill={i === 4 ? colors.WARM : colors.ACCENT} opacity={0.2} stroke={i === 4 ? colors.WARM : colors.ACCENT} />
                    <text x={x} y={625} textAnchor="middle" fill={colors.TEXT} fontSize={10.5}>{label}</text>
                    {i < 4 && <path d={`M ${x + 24} 595 L ${x + 202} 595`} stroke={colors.GRID} strokeWidth={2} />}
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={205} y={225} width={870} height={222} rx={20} fill={colors.PANEL} stroke={colors.WARM} />
          <text x={640} y={286} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={700}>The answer audits itself</text>
          <text x={640} y={333} textAnchor="middle" fill={colors.MUTED} fontSize={16}>discover → gather → verify → preserve → improve</text>
          <text x={640} y={373} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>key-step shaping keeps final correctness primary</text>
          <text x={640} y={405} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>arXiv:2607.21461 · official code: VectorSpaceLab/arex-model</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
