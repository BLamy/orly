// Source: aes_mobius_bridge_cot.pdf, sections 3 through 7.
// Persistent object: the measured signal trace is repeatedly challenged by controls until only the reusable invariant remains.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Chip, Panel, ResearchTitle, clamp01, mono } from '../../book-components/research';

const SIGNAL = [1, 0.86, 0.18, 0.04, 0.015, 0.008];
const baselineY = 485;
const xAt = (i: number) => 150 + i * 150;
const yAt = (v: number) => baselineY - v * 270;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const chartU = tl.channel('chartU', 0);
  const signalU = tl.channel('signalU', 0);
  const exactU = tl.channel('exactU', 0);
  const defectU = tl.channel('defectU', 0);
  const artifactU = tl.channel('artifactU', 0);
  const controlU = tl.channel('controlU', 0);
  const closeN = tl.channel('closeN', 0);
  const bridgeU = tl.channel('bridgeU', 0);
  let t = 0.4;
  t = tl.caption({ at: t, dur: 5.7, text: 'The agent turns the derivation into a testbed and checks every claim against deterministic reduced-round encryption.' });
  tl.tween(chartU, 1, { at: 0.8, dur: 1.2, ease: ease.draw });
  tl.tween(signalU, 1, { at: 1.6, dur: 1.8, ease: ease.draw });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.8, text: 'The early-round cross-ratio identities hold exactly. At the third round, the measured structure falls where full diffusion begins.' });
  tl.tween(exactU, 1, { at: t - 5.2, dur: 0.8, ease: ease.pop });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.8, text: 'A field-rank experiment reveals a rotation-pattern defect at round three, and the measured drop rate matches the derived probability.' });
  tl.tween(defectU, 1, { at: t - 5.2, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 650, y: 350, k: 1.04 }, { at: t - 5.0, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.8, text: 'Then a correlation appears to persist across later rounds. It looks like the breakthrough the brief demanded.' });
  tl.tween(artifactU, 1, { at: t - 5.2, dur: 1.2, ease: ease.pop });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.8, text: 'A random-permutation control reproduces it. The signal is a counting baseline, not a cipher weakness, and the apparent discovery is withdrawn.' });
  tl.tween(controlU, 1, { at: t - 5.2, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 6.0, text: 'Four final constructions close negatively for specific reasons. The record keeps the failures because each one sharpens what the invariant can and cannot do.' });
  tl.tween(closeN, 4, { at: t - 5.4, dur: 2.0, ease: ease.enter });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 6.0, text: 'The surviving result is narrower and more useful: translation and inversion share a projective invariant that can bridge one hidden byte in a meet-in-the-middle attack.' });
  tl.tween(bridgeU, 1, { at: t - 5.4, dur: 1.2, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: t - 2.2, dur: 1.2, ease: ease.move });
  return { tl, cam, chartU, signalU, exactU, defectU, artifactU, controlU, closeN, bridgeU };
}
const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const reveal = s.get(scene.signalU);
  const pts = SIGNAL.map((v, i) => [xAt(i), yAt(v)] as const);
  const path = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
  return (
    <Camera {...s.get(scene.cam)}>
      <ResearchTitle kicker="Finding the Bridge · 3" title="The honest dead ends" />
      <Panel x={75} y={135} w={930} h={430} opacity={s.get(scene.chartU)} accent={colors.ACCENT}>
        <line x1={120} y1={baselineY} x2={950} y2={baselineY} stroke={colors.GRID} />
        <line x1={120} y1={190} x2={120} y2={baselineY} stroke={colors.GRID} />
        <path d={path} fill="none" stroke={colors.ACCENT} strokeWidth={4} pathLength={1} strokeDasharray={`${clamp01(reveal)} 1`} />
        {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={8} fill={i < 2 ? colors.POSITIVE : colors.ACCENT} opacity={clamp01(reveal * 7 - i)} />)}
        {SIGNAL.map((_, i) => <text key={i} x={xAt(i)} y={525} textAnchor="middle" fill={colors.MUTED} fontFamily={mono} fontSize={11}>r{i + 1}</text>)}
        <Chip x={300} y={190} text="exact" opacity={s.get(scene.exactU)} color={colors.POSITIVE} />
        <Chip x={600} y={365} text="rank defect" opacity={s.get(scene.defectU)} color={colors.WARM} width={120} />
        <g opacity={s.get(scene.artifactU)}>
          <path d="M 720 360 C 780 280 850 280 920 350" fill="none" stroke={colors.NEGATIVE} strokeWidth={4} />
          <text x={835} y={270} textAnchor="middle" fill={colors.NEGATIVE} fontFamily={mono} fontSize={12}>apparent late signal</text>
        </g>
        <g opacity={s.get(scene.controlU)}>
          <path d="M 720 390 C 780 310 850 310 920 380" fill="none" stroke={colors.MUTED} strokeWidth={3} strokeDasharray="7 6" />
          <text x={835} y={420} textAnchor="middle" fill={colors.MUTED} fontFamily={mono} fontSize={12}>random control matches</text>
        </g>
      </Panel>
      <Panel x={1040} y={135} w={180} h={430} opacity={0.2 + 0.8 * s.get(scene.bridgeU)} accent={colors.SECONDARY}>
        {['characters', 'kernels', 'spectral lift', 'adaptive tuple'].map((c, i) => {
          const u = clamp01(s.get(scene.closeN) - i);
          return <g key={c} opacity={u}><text x={1130} y={210 + i * 60} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>{c}</text><line x1={1080} y1={195 + i * 60} x2={1180} y2={225 + i * 60} stroke={colors.NEGATIVE} strokeWidth={2} /></g>;
        })}
        <g opacity={s.get(scene.bridgeU)}>
          <circle cx={1130} cy={475} r={54} fill={colors.POSITIVE} fillOpacity={0.12} stroke={colors.POSITIVE} />
          <text x={1130} y={470} textAnchor="middle" fill={colors.POSITIVE} fontWeight={800} fontSize={13}>Möbius</text>
          <text x={1130} y={490} textAnchor="middle" fill={colors.POSITIVE} fontWeight={800} fontSize={13}>Bridge</text>
        </g>
      </Panel>
    </Camera>
  );
}
export const vizScene = () => scene;
