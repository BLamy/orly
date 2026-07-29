// Source: aes_mobius_bridge.pdf, sections 2 and 3.
// Persistent object: a 256-message delta set is peeled toward the four-round core.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Arrow, Chip, Panel, ResearchTitle, clamp01, mono } from '../../book-components/research';

const CORE = { x: 470, y: 190, w: 340, h: 300 };
const GUESSES = ['k−1[0]', 'k−1[5]', 'k−1[10]', 'k−1[15]', 'u6[0]', 'u6[7]', 'u6[10]', 'u6[13]', 'u5[0]'];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const roundsU = tl.channel('roundsU', 0);
  const setU = tl.channel('setU', 0);
  const peelU = tl.channel('peelU', 0);
  const tableU = tl.channel('tableU', 0);
  const guessesN = tl.channel('guessesN', 0);
  const eraseU = tl.channel('eraseU', 0);
  const collisionU = tl.channel('collisionU', 0);
  let t = 0.4;
  t = tl.caption({ at: t, dur: 5.6, text: 'Full Advanced Encryption Standard still stands. This paper attacks seven reduced rounds, where structure is visible but the search is still enormous.' });
  tl.tween(roundsU, 1, { at: 0.8, dur: 1.5, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 340, k: 1.08 }, { at: 1.0, dur: 1.3, ease: ease.move });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.8, text: 'Begin with two hundred fifty-six chosen plaintexts. One byte takes every possible value while the other fifteen stay fixed.' });
  tl.tween(setU, 1, { at: t - 5.3, dur: 1.3, ease: ease.enter });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.8, text: 'Peel one round from the top and one from the bottom. What remains is a four-round core with a restricted family of possible byte sequences.' });
  tl.tween(peelU, 1, { at: t - 5.2, dur: 2.0, ease: ease.move });
  tl.tween(tableU, 1, { at: t - 2.8, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.5, text: 'The attack precomputes that family, then runs candidate keys from both directions and asks whether their fingerprints meet in the table.' });
  tl.tween(collisionU, 0.55, { at: t - 4.8, dur: 1.4, ease: ease.linear });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.7, text: 'Derbez, Fouque, and Jean need nine guessed bytes around the core. Each byte multiplies the candidate space by two hundred fifty-six.' });
  tl.tween(guessesN, 9, { at: t - 5.2, dur: 2.0, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 360, k: 1.18 }, { at: t - 5.0, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.4);
  t = tl.caption({ at: t, dur: 5.8, text: 'An older multiset trick already erases one input-side byte, because reordering two hundred fifty-six values cannot change their frequency table.' });
  tl.tween(eraseU, 1, { at: t - 5.0, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 6.0, text: 'The paper asks for the matching trick below the table. If one more byte can vanish, the raw key-guessing work drops by another factor of two hundred fifty-six.' });
  tl.tween(collisionU, 1, { at: t - 5.4, dur: 2.0, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: t - 2.0, dur: 1.3, ease: ease.move });
  return { tl, cam, roundsU, setU, peelU, tableU, guessesN, eraseU, collisionU };
}
const scene = buildScene();

function RoundRail({ u, peel }: { u: number; peel: number }) {
  const labels = ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6'];
  return (
    <g opacity={clamp01(u)}>
      {labels.map((label, i) => {
        const x = 120 + i * 170;
        const outer = i === 0 || i === 6;
        return (
          <g key={label} transform={`translate(${x},135)`} opacity={outer ? 1 - 0.8 * peel : 1}>
            <rect x={-42} y={-22} width={84} height={44} rx={10} fill={outer ? colors.WARM : colors.PANEL} fillOpacity={0.16} stroke={outer ? colors.WARM : colors.GRID} />
            <text textAnchor="middle" y={5} fill={colors.TEXT} fontSize={13} fontFamily={mono}>{label}</text>
          </g>
        );
      })}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const peel = s.get(scene.peelU);
  const n = s.get(scene.guessesN);
  const erase = s.get(scene.eraseU);
  const meet = s.get(scene.collisionU);
  return (
    <Camera {...s.get(scene.cam)}>
      <ResearchTitle kicker="The Möbius Bridge · 1" title="Nine guesses at the middle" />
      <RoundRail u={s.get(scene.roundsU)} peel={peel} />
      <Panel x={CORE.x} y={CORE.y} w={CORE.w} h={CORE.h} opacity={peel} accent={colors.ACCENT}>
        <text x={640} y={225} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontFamily={mono}>four-round core</text>
        {Array.from({ length: 16 }, (_, i) => {
          const x = 535 + (i % 4) * 70;
          const y = 270 + Math.floor(i / 4) * 48;
          return <rect key={i} x={x} y={y} width={46} height={30} rx={5} fill={colors.ACCENT} opacity={0.08 + 0.34 * ((i % 5) / 4)} />;
        })}
        <text x={640} y={470} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={mono}>precomputed family T</text>
      </Panel>
      <g opacity={s.get(scene.setU)}>
        {Array.from({ length: 32 }, (_, i) => {
          const a = (i / 32) * Math.PI * 2;
          return <circle key={i} cx={250 + Math.cos(a) * 82} cy={340 + Math.sin(a) * 82} r={4} fill={colors.SECONDARY} />;
        })}
        <text x={250} y={344} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={mono}>256 texts</text>
      </g>
      <Arrow x1={340} y1={340} x2={470} y2={340} reveal={peel} color={colors.SECONDARY} />
      <Arrow x1={1010} y1={340} x2={810} y2={340} reveal={peel} color={colors.WARM} />
      <circle cx={340 + (470 - 340) * meet} cy={340} r={7} fill={colors.SECONDARY} opacity={peel} />
      <circle cx={1010 + (810 - 1010) * meet} cy={340} r={7} fill={colors.WARM} opacity={peel} />
      <g>
        {GUESSES.map((g, i) => {
          const u = clamp01(n - i);
          const gone = i === 0 ? erase : 0;
          const x = 160 + i * 118;
          return (
            <g key={g} opacity={u * (1 - gone)} transform={`translate(0,${gone * -24})`}>
              <Chip x={x} y={555} text={g} color={i < 4 ? colors.SECONDARY : colors.WARM} />
              {i === 0 && <line x1={x - 35} y1={540} x2={x + 35} y2={570} stroke={colors.NEGATIVE} strokeWidth={3} opacity={erase} />}
            </g>
          );
        })}
      </g>
    </Camera>
  );
}
export const vizScene = () => scene;
