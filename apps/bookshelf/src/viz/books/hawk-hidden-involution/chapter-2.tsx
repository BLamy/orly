// Source: hawk_key_recovery.pdf, Proposition 4.5 and Theorem 5.1.
// Persistent object: the public cocycle lattice morphs into its near-hypercubic isometry class.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Chip, Panel, ResearchTitle, clamp01, mono } from '../../book-components/research';

const PTS = Array.from({ length: 121 }, (_, i) => ({ x: i % 11 - 5, y: Math.floor(i / 11) - 5 }));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const latticeU = tl.channel('latticeU', 0);
  const secretMapU = tl.channel('secretMapU', 0);
  const cubeU = tl.channel('cubeU', 0);
  const blocksU = tl.channel('blocksU', 0);
  const shortU = tl.channel('shortU', 0);
  const reduceU = tl.channel('reduceU', 0);
  const dimensionU = tl.channel('dimensionU', 0);
  let t = 0.4;
  t = tl.caption({ at: t, dur: 6.2, text: 'A generic rank-n lattice would still be hard. This one belongs to a special isometry class that the public key hides but the proof reveals.' });
  tl.tween(latticeU, 1, { at: 0.8, dur: 1.4, ease: ease.enter });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.3, text: "A secret change of variables carries every key's cocycle lattice to the trivial-key lattice without changing lengths." });
  tl.tween(secretMapU, 1, { at: t - 5.2, dur: 1.6, ease: ease.move });
  tl.tween(cam, { x: 640, y: 350, k: 1.03 }, { at: t - 5.0, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.4, text: 'In the power basis, that lattice is near-hypercubic: one block has dimension n over two plus one, and the other n over two minus one.' });
  tl.tween(cubeU, 1, { at: t - 5.3, dur: 1.5, ease: ease.move });
  tl.tween(blocksU, 1, { at: t - 3.5, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.3, text: 'The first block is scaled by the square root of n over four. The second is longer by a square root of two.' });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.3, text: 'Exactly two times n over two plus one shortest vectors live in the shorter block, including plus and minus the secret cocycle.' });
  tl.tween(shortU, 1, { at: t - 5.2, dur: 1.0, ease: ease.pop });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.4, text: 'Ducas block reduction recovers all of them using calls to an exact shortest-vector oracle only as wide as the short block.' });
  tl.tween(reduceU, 1, { at: t - 5.3, dur: 1.8, ease: ease.draw });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 5.8, text: 'So a rank-n key problem exposes its decisive vectors through dimension n over two plus one. The involution has cut the expensive dimension nearly in half.' });
  tl.tween(dimensionU, 1, { at: t - 5.2, dur: 1.0, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: t - 2.0, dur: 1.2, ease: ease.move });
  return { tl, cam, latticeU, secretMapU, cubeU, blocksU, shortU, reduceU, dimensionU };
}
const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const map = s.get(scene.secretMapU);
  const cube = s.get(scene.cubeU);
  const short = s.get(scene.shortU);
  return (
    <Camera {...s.get(scene.cam)}>
      <ResearchTitle kicker="The Hidden Involution · 2" title="The near-hypercube" />
      <defs><clipPath id="hhi2-lattice"><rect x={72} y={137} width={766} height={436} rx={14} /></clipPath></defs>
      <Panel x={70} y={135} w={770} h={440} opacity={s.get(scene.latticeU)} accent={colors.SECONDARY}>
        <g clipPath="url(#hhi2-lattice)">
          {PTS.map((p, i) => {
            const x0 = 410 + p.x * 62 + p.y * 8;
            const y0 = 350 + p.y * 46;
            const x1 = 410 + p.x * 52;
            const y1 = 350 + p.y * (46 + 18 * cube);
            return <circle key={i} cx={x0 + (x1 - x0) * map} cy={y0 + (y1 - y0) * map} r={3.5} fill={Math.abs(p.y) <= 1 ? colors.ACCENT : colors.TEXT} opacity={0.4 + 0.5 * s.get(scene.latticeU)} />;
          })}
        </g>
        <g opacity={s.get(scene.blocksU)}>
          <rect x={110} y={285} width={600} height={130} rx={16} fill={colors.ACCENT} fillOpacity={0.06} stroke={colors.ACCENT} />
          <text x={730} y={355} fill={colors.ACCENT} fontFamily={mono} fontSize={14}>p = n/2 + 1</text>
          <text x={730} y={485} fill={colors.TEXT} fontFamily={mono} fontSize={14}>q = n/2 − 1</text>
        </g>
        <g opacity={short}>
          {[-2, -1, 0, 1, 2].map((x) => <circle key={x} cx={410 + x * 52} cy={350} r={14} fill={colors.POSITIVE} fillOpacity={0.25} stroke={colors.POSITIVE} />)}
        </g>
      </Panel>
      <Panel x={875} y={135} w={335} h={440} opacity={0.35 + 0.65 * Math.max(s.get(scene.blocksU), s.get(scene.reduceU))} accent={colors.WARM}>
        <text x={1042} y={180} textAnchor="middle" fill={colors.TEXT} fontFamily={mono} fontSize={14}>scaled basis</text>
        <text x={1042} y={230} textAnchor="middle" fill={colors.TEXT} fontFamily={mono} fontSize={20} opacity={s.get(scene.blocksU)}>√(n/4) · ℤ^(n/2+1)</text>
        <text x={1042} y={268} textAnchor="middle" fill={colors.ACCENT} fontFamily={mono} fontSize={14} opacity={s.get(scene.blocksU)}>p-block</text>
        <text x={1042} y={305} textAnchor="middle" fill={colors.TEXT} fontFamily={mono} fontSize={20} opacity={s.get(scene.blocksU)}>⊕ √(n/2) · ℤ^(n/2−1)</text>
        <text x={1042} y={343} textAnchor="middle" fill={colors.TEXT} fontFamily={mono} fontSize={14} opacity={s.get(scene.blocksU)}>q-block, √2 longer</text>
        <Chip x={1042} y={400} text="scale = √(n/4)" color={colors.ACCENT} width={210} opacity={s.get(scene.blocksU) * (1 - s.get(scene.reduceU))} />
        <g opacity={s.get(scene.reduceU)}>
          {Array.from({ length: 6 }, (_, i) => <rect key={i} x={930 + i * 34} y={490 - (44 + i * 16)} width={26} height={44 + i * 16} rx={6} fill={colors.WARM} opacity={0.25 + i * 0.1} />)}
          <Chip x={1040} y={510} text="exact SVP · dim p" color={colors.POSITIVE} width={190} />
        </g>
      </Panel>
      <g opacity={s.get(scene.dimensionU)}>
        <text x={640} y={600}textAnchor="middle" fill={colors.POSITIVE} fontSize={24} fontWeight={800}>rank n → oracle dimension n/2 + 1</text>
      </g>
    </Camera>
  );
}
export const vizScene = () => scene;
