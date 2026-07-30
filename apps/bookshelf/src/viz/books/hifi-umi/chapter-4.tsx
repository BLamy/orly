// Teach Without the Robot — chapter 4: Remove the Robot Anchor.
//
// Grounded in arXiv:2607.25895, sec/04_experiments.tex "Can UMI-Only
// Post-Training Match Teleoperation-Based Post-Training?" and "Does
// Large-Scale UMI Pre-Training Yield a Better Base Model?", plus
// sec/05_discussion.tex. Reported aggregate UMI-minus-teleoperation gaps are
// -2.5, +3.1, and -0.6 points; 4,000-hour pre-training cuts mean OOD action
// error by 41% and raises downstream aggregate success by 18.1 points.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Figure } from '../../primitives';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const RESULTS = [
  { name: 'StarVLA-QwenPI', umi: 51.3, tele: 53.8, diff: '−2.5' },
  { name: 'OpenPI-π0.5', umi: 77.5, tele: 74.4, diff: '+3.1' },
  { name: 'LingBot-VA', umi: 56.9, tele: 57.5, diff: '−0.6' },
];
const CURVE = Array.from({ length: 48 }, (_, i) => {
  const t = i / 47;
  return { x: 190 + t * 480, y: 515 - (1 - Math.exp(-3.2 * t)) * 180 };
});

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const premiseU = tl.channel('premiseU', 0);
  const anchorU = tl.channel('anchorU', 1);
  const controlledU = tl.channel('controlledU', 0);
  const barsU = tl.channel('barsU', 0);
  const parityU = tl.channel('parityU', 0);
  const figureU = tl.channel('figureU', 0);
  const curveU = tl.channel('curveU', 0);
  const transferU = tl.channel('transferU', 0);
  const limitsU = tl.channel('limitsU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.9, text: 'Robot-free demonstrations usually seed a policy, but deployment still keeps a small real-robot teleoperation anchor at the end.' });
  tl.tween(premiseU, 1, { at: 0.9, dur: 1.4, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 350, k: 1.05 }, { at: 1.2, dur: 1.3, ease: ease.move });
  tl.hold(6.4, 0.6);

  tl.caption({ at: 7.0, dur: 5.7, text: 'The high fidelity U M I experiment removes target-task teleoperation from post-training and asks whether fidelity can replace that anchor.' });
  tl.tween(anchorU, 0, { at: 7.5, dur: 1.5, ease: ease.move });
  tl.hold(12.7, 0.6);

  tl.caption({ at: 13.3, dur: 6.1, text: 'Within each backbone, architecture, initialization, optimization, action representation, and deployment stay fixed. Only the task data source changes.' });
  tl.tween(controlledU, 1, { at: 13.8, dur: 1.5, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 14.4, dur: 1.3, ease: ease.move });
  tl.hold(19.4, 0.6);

  tl.caption({ at: 20.0, dur: 5.4, text: 'On Star V L A Qwen P I, U M I post-training is two point five percentage points lower in aggregate success.' });
  tl.tween(barsU, 1, { at: 20.5, dur: 1.4, ease: ease.enter });
  tl.hold(25.4, 0.6);

  tl.caption({ at: 26.0, dur: 5.4, text: 'On Open P I, U M I is three point one points higher.' });
  tl.tween(barsU, 2, { at: 26.5, dur: 1.4, ease: ease.enter });
  tl.hold(31.4, 0.6);

  tl.caption({ at: 32.0, dur: 5.4, text: 'On Ling Bot V A, U M I is zero point six points lower.' });
  tl.tween(barsU, 3, { at: 32.5, dur: 1.4, ease: ease.enter });
  tl.hold(37.4, 0.6);

  tl.caption({ at: 38.0, dur: 6.0, text: 'The direction changes across models, so the paper calls this approximate aggregate parity, not superiority and not a pooled architecture comparison.' });
  tl.tween(parityU, 1, { at: 38.5, dur: 1.0, ease: ease.pop });
  tl.tween(figureU, 1, { at: 39.0, dur: 0.8, ease: ease.enter });
  tl.hold(44.0, 0.6);

  tl.caption({ at: 44.6, dur: 6.0, text: 'Separately, four thousand hours of U M I pre-training reduce mean action error on ten unseen tasks by forty-one percent.' });
  tl.tween(figureU, 0.12, { at: 45.1, dur: 0.8, ease: ease.move });
  tl.tween(curveU, 1, { at: 45.4, dur: 2.0, ease: ease.draw });
  tl.tween(cam, { x: 435, y: 390, k: 1.16 }, { at: 45.7, dur: 1.3, ease: ease.move });
  tl.hold(50.6, 0.6);

  tl.caption({ at: 51.2, dur: 5.9, text: 'With the post-training recipe held fixed, that initialization raises aggregate real-robot success by eighteen point one percentage points.' });
  tl.tween(transferU, 1, { at: 51.7, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 52.2, dur: 1.3, ease: ease.move });
  tl.hold(57.1, 0.6);

  tl.caption({ at: 57.7, dur: 7.1, text: 'The boundary matters: four tabletop tasks, forty rollouts per task-policy pair, unequal sample counts, and no ablation of each fidelity component.' });
  tl.tween(limitsU, 1, { at: 58.2, dur: 1.4, ease: ease.enter });
  tl.tween(dimU, 1, { at: 59.6, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 60.4, dur: 0.7, ease: ease.enter });
  tl.hold(64.8, 1.0);

  return { tl, cam, premiseU, anchorU, controlledU, barsU, parityU, figureU, curveU, transferU, limitsU, dimU, endU };
}

const scene = buildScene();

function Balance({ u, anchorU }: { u: number; anchorU: number }) {
  return (
    <g opacity={u} transform="translate(150 125)">
      <line x1={0} y1={80} x2={330} y2={80 + (anchorU - 0.5) * 20} stroke={colors.TEXT} strokeWidth={5} strokeLinecap="round" />
      <line x1={165} y1={80} x2={165} y2={190} stroke={colors.MUTED} strokeWidth={5} />
      <path d="M110 205 L220 205 L165 155 Z" fill={colors.PANEL} stroke={colors.MUTED} />
      <circle cx={45} cy={62} r={31} fill={colors.ACCENT} opacity={0.75} />
      <text x={45} y={67} textAnchor="middle" fill={colors.BG} fontSize={11} fontWeight={800}>UMI</text>
      <g opacity={anchorU} transform={`translate(285 ${92 + (1 - anchorU) * 85})`}>
        <path d="M0 -32 C28 -32 28 8 0 8 C-28 8 -28 -32 0 -32 Z M0 8 L0 42" fill="none" stroke={colors.NEGATIVE} strokeWidth={12} strokeLinecap="round" />
        <text y={67} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10} fontFamily={MONO}>teleop anchor</text>
      </g>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const barsU = s.get(scene.barsU);
  const curveU = s.get(scene.curveU);
  const transferU = s.get(scene.transferU);
  const mainOpacity = 1 - 0.88 * s.get(scene.dimU);
  const shown = Math.ceil(barsU);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOpacity}>
        <text x={640} y={54} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={750}>Remove the robot anchor</text>
        <text x={640} y={80} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>within-backbone comparisons · UMI-only task post-training · real-robot deployment</text>
      </g>
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <Balance u={s.get(scene.premiseU) * (1 - clamp01(barsU))} anchorU={s.get(scene.anchorU)} />

          {s.get(scene.controlledU) > 0 && barsU < 0.1 && (
            <g opacity={s.get(scene.controlledU)} transform="translate(570 155)">
              {['architecture', 'initialization', 'optimization', 'actions', 'deployment'].map((label, i) => (
                <g key={label} transform={`translate(0 ${i * 54})`}>
                  <rect width={310} height={38} rx={19} fill={colors.PANEL} stroke={colors.POSITIVE} />
                  <circle cx={20} cy={19} r={7} fill={colors.POSITIVE} />
                  <text x={40} y={24} fill={colors.TEXT} fontSize={11} fontFamily={MONO}>{label} · held fixed</text>
                </g>
              ))}
              <path d="M340 12 L500 12 L500 230 L340 230" fill="none" stroke={colors.ACCENT} strokeWidth={3} />
              <text x={420} y={258} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily={MONO}>only data source changes</text>
            </g>
          )}

          {barsU > 0 && (
            <g transform="translate(120 130)">
              <line x1={0} y1={380} x2={720} y2={380} stroke={colors.GRID} />
              {RESULTS.map((r, i) => {
                const u = clamp01(barsU - i);
                const x = i * 235 + 55;
                const hUmi = r.umi * 3.6 * u;
                const hTele = r.tele * 3.6 * u;
                return (
                  <g key={r.name} opacity={u}>
                    <rect x={x} y={380 - hUmi} width={58} height={hUmi} rx={7} fill={colors.ACCENT} opacity={0.78} />
                    <rect x={x + 68} y={380 - hTele} width={58} height={hTele} rx={7} fill={colors.NEGATIVE} opacity={0.62} />
                    <text x={x + 29} y={370 - hUmi} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily={MONO}>{r.umi}%</text>
                    <text x={x + 97} y={370 - hTele} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontFamily={MONO}>{r.tele}%</text>
                    <text x={x + 63} y={405} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily={MONO}>{r.name}</text>
                    <text x={x + 63} y={430} textAnchor="middle" fill={Math.abs(Number(r.diff.replace('−', '-'))) < 3.2 ? colors.POSITIVE : colors.WARM} fontSize={15} fontWeight={800}>{r.diff} pts</text>
                  </g>
                );
              })}
              <rect x={535} y={-8} width={170} height={34} rx={17} fill={colors.PANEL} stroke={colors.POSITIVE} opacity={s.get(scene.parityU)} />
              <text x={620} y={14} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontFamily={MONO} opacity={s.get(scene.parityU)}>approximate parity</text>
            </g>
          )}

          <Figure
            src="/generated/hifi-umi/figures/fig-15.png"
            x={890}
            y={135}
            w={280}
            h={230}
            reveal={s.get(scene.figureU)}
            opacity={s.get(scene.figureU)}
            caption="Paper Fig. 9 · VLA results"
            accent={colors.ACCENT}
          />

          {curveU > 0 && (
            <g opacity={curveU}>
              <rect x={120} y={270} width={600} height={300} rx={18} fill={colors.PANEL} stroke={colors.GRID} />
              <line x1={190} y1={535} x2={675} y2={535} stroke={colors.MUTED} />
              <line x1={190} y1={320} x2={190} y2={535} stroke={colors.MUTED} />
              <polyline
                points={CURVE.slice(0, Math.max(2, Math.floor(curveU * CURVE.length))).map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={colors.POSITIVE}
                strokeWidth={4}
              />
              <text x={430} y={562} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>pre-training exposure · 4,000 h mixture</text>
              <text x={150} y={300} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>mean OOD action error</text>
              <text x={608} y={355} fill={colors.POSITIVE} fontSize={26} fontWeight={800}>−41%</text>
              {transferU > 0 && (
                <g opacity={transferU} transform="translate(790 400)">
                  <rect width={360} height={136} rx={19} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
                  <rect x={34} y={78} width={118} height={22} rx={11} fill={colors.MUTED} opacity={0.42} />
                  <rect x={34} y={48} width={118 + 118 * transferU} height={22} rx={11} fill={colors.WARM} opacity={0.82} />
                  <text x={178} y={65} fill={colors.WARM} fontSize={25} fontWeight={850}>+18.1 pts</text>
                  <text x={178} y={94} fill={colors.MUTED} fontSize={10} fontFamily={MONO}>aggregate real-robot success</text>
                </g>
              )}
            </g>
          )}

          {s.get(scene.limitsU) > 0 && (
            <g opacity={s.get(scene.limitsU)} transform="translate(250 180)">
              <rect width={780} height={310} rx={22} fill={colors.BG} stroke={colors.WARM} strokeWidth={2} />
              <text x={390} y={48} textAnchor="middle" fill={colors.WARM} fontSize={19} fontWeight={750}>What the paper does not establish</text>
              {[
                '4 tabletop bimanual tasks · 3 backbones',
                '40 rollouts per task-policy pair · 2.5 points per success',
                '3,200 UMI trajectories vs 300 teleoperation trajectories per VLA task',
                'fidelity validated jointly · no component-by-component ablation',
              ].map((label, i) => (
                <g key={label} transform={`translate(70 ${88 + i * 52})`}>
                  <circle cx={8} cy={-4} r={5} fill={colors.WARM} />
                  <text x={28} y={0} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>{label}</text>
                </g>
              ))}
            </g>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={225} y={234} width={830} height={196} rx={22} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
          <text x={640} y={294} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={760}>Fidelity can carry post-training to deployment</text>
          <text x={640} y={339} textAnchor="middle" fill={colors.MUTED} fontSize={16}>six aligned views · shared-frame motion · simulated replay</text>
          <text x={640} y={376} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>evidence within this benchmark · not a universal guarantee</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
