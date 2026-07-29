// Source: aes_mobius_bridge_cot.pdf, sections 1 and 2.1.
// Persistent object: candidate tracked objects orbit the six-round research target and are tested against the brief.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Chip, Panel, ResearchTitle, clamp01, mono } from '../../book-components/research';

const KNOWN = ['differences', 'linear masks', 'integrals', 'meet in middle', 'equation solving'];
const CANDIDATES = ['group orbits', 'metrics', 'information', 'spectra', 'graphs', 'codes', 'representations', 'moments', 'proof gaps'];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const targetU = tl.channel('targetU', 0);
  const knownN = tl.channel('knownN', 0);
  const candidateN = tl.channel('candidateN', 0);
  const rejectN = tl.channel('rejectN', 0);
  const surveyU = tl.channel('surveyU', 0);
  const objectU = tl.channel('objectU', 0);
  const focusU = tl.channel('focusU', 0);
  let t = 0.4;
  t = tl.caption({ at: t, dur: 5.8, text: 'The run begins with an unreasonable brief: invent a new family of cryptanalysis against six-round Advanced Encryption Standard.' });
  tl.tween(targetU, 1, { at: 0.8, dur: 1.0, ease: ease.pop });
  tl.tween(cam, { x: 640, y: 350, k: 1.12 }, { at: 1.0, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 6.0, text: 'Five established lenses are declared off limits: differences, linear correlations, structured sums, meet-in-the-middle tables, and direct equation solving.' });
  tl.tween(knownN, 5, { at: t - 5.4, dur: 2.0, ease: ease.enter });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.8, text: 'The agent reframes every historical breakthrough as a change in the object being tracked through the rounds.' });
  tl.tween(objectU, 1, { at: t - 5.2, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 6.0, text: 'Nine candidates enter: group orbits, distances, information, spectra, graphs, codes, representations, moments, and gaps in a proof.' });
  tl.tween(candidateN, 9, { at: t - 5.4, dur: 2.4, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: t - 5.0, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.8, text: 'Before choosing, it reads the real cipher, the oracle, the prior research board, confirmed lemmas, and the state-of-the-art table.' });
  tl.tween(surveyU, 1, { at: t - 5.2, dur: 1.4, ease: ease.draw });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 6.0, text: 'Most candidates fail a concrete test: the object vanishes too early, needs hidden state, or survives without depending on the key.' });
  tl.tween(rejectN, 8, { at: t - 5.4, dur: 2.4, ease: ease.move });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.8, text: 'One object remains because it is transparent to both translation and inversion: the cross-ratio of four field elements.' });
  tl.tween(focusU, 1, { at: t - 5.2, dur: 1.0, ease: ease.pop });
  tl.tween(cam, { x: 640, y: 380, k: 1.22 }, { at: t - 4.8, dur: 1.2, ease: ease.move });
  return { tl, cam, targetU, knownN, candidateN, rejectN, surveyU, objectU, focusU };
}
const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const kn = s.get(scene.knownN);
  const cn = s.get(scene.candidateN);
  const rn = s.get(scene.rejectN);
  const focus = s.get(scene.focusU);
  return (
    <Camera {...s.get(scene.cam)}>
      <ResearchTitle kicker="Finding the Bridge · 1" title="Invent a new object" />
      <Panel x={470} y={170} w={340} h={300} opacity={s.get(scene.targetU)} accent={colors.WARM}>
        <circle cx={640} cy={320} r={94} fill={colors.WARM} fillOpacity={0.08} stroke={colors.WARM} strokeWidth={2} />
        <text x={640} y={305} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontWeight={750}>6-round AES</text>
        <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={mono}>find family F</text>
      </Panel>
      {KNOWN.map((k, i) => {
        const u = clamp01(kn - i);
        return <Chip key={k} x={160 + i * 240} y={520} text={k} opacity={u * (1 - 0.8 * s.get(scene.objectU))} color={colors.NEGATIVE} width={180} />;
      })}
      {CANDIDATES.map((c, i) => {
        const a = (i / CANDIDATES.length) * Math.PI * 2 - Math.PI / 2;
        const x = 640 + Math.cos(a) * 430;
        const y = 330 + Math.sin(a) * 205;
        const u = clamp01(cn - i);
        const rejected = clamp01(rn - i);
        const chosen = i === 0 ? focus : 0;
        return (
          <g key={c} opacity={u * (1 - 0.82 * rejected) + chosen * 0.82}>
            <circle cx={x} cy={y} r={26 + chosen * 10} fill={chosen ? colors.POSITIVE : colors.SECONDARY} fillOpacity={0.15} stroke={chosen ? colors.POSITIVE : colors.SECONDARY} />
            <text x={x} y={y + 45} textAnchor="middle" fill={chosen ? colors.POSITIVE : colors.MUTED} fontSize={11} fontFamily={mono}>{i === 0 && chosen ? 'cross-ratio' : c}</text>
            {rejected > 0 && i > 0 && <line x1={x - 22} y1={y - 22} x2={x + 22} y2={y + 22} stroke={colors.NEGATIVE} strokeWidth={3} opacity={rejected} />}
          </g>
        );
      })}
      <g opacity={s.get(scene.surveyU)}>
        {['aes128.c', 'oracle.c', 'table.md', 'confirmed-lemmas.md'].map((f, i) => (
          <text key={f} x={490} y={590 + i * 18} fill={colors.ACCENT} fontSize={10.5} fontFamily={mono}>{f}</text>
        ))}
      </g>
    </Camera>
  );
}
export const vizScene = () => scene;
