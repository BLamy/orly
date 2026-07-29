// Source: hawk_key_recovery.pdf, sections 2 through 4.
// Persistent object: the public Gram matrix is reflected by tau until its hidden cocycle appears as a public shortest vector.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Arrow, Chip, Panel, ResearchTitle, clamp01, mono } from '../../book-components/research';

const LATTICE = Array.from({ length: 81 }, (_, i) => ({ x: i % 9 - 4, y: Math.floor(i / 9) - 4 }));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gramU = tl.channel('gramU', 0);
  const secretU = tl.channel('secretU', 0);
  const tauU = tl.channel('tauU', 0);
  const cocycleU = tl.channel('cocycleU', 0);
  const constraintsU = tl.channel('constraintsU', 0);
  const latticeU = tl.channel('latticeU', 0);
  const shortestU = tl.channel('shortestU', 0);
  let t = 0.4;
  t = tl.caption({ at: t, dur: 6.2, text: 'The signature scheme publishes a Gram matrix made from a short secret basis. Recover any equivalent basis, and you can sign.' });
  tl.tween(gramU, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.tween(secretU, 1, { at: 1.6, dur: 1.0, ease: ease.draw });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.3, text: 'The power-of-two cyclotomic field has a second involution: send zeta to minus zeta, distinct from complex conjugation.' });
  tl.tween(tauU, 1, { at: t - 5.2, dur: 1.3, ease: ease.move });
  tl.tween(cam, { x: 720, y: 330, k: 1.06 }, { at: t - 5.0, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.3, text: 'Compare the secret basis with its reflected copy. Their ratio is a cocycle: a hidden automorphism built from the secret.' });
  tl.tween(cocycleU, 1, { at: t - 5.2, dur: 1.0, ease: ease.pop });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.4, text: 'Although the cocycle contains the secret, it satisfies two linear relations involving only the public Gram matrix and its reflected copy.' });
  tl.tween(constraintsU, 1, { at: t - 5.3, dur: 1.2, ease: ease.draw });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.3, text: 'The integer solutions form a public lattice of rank n. The true cocycle is guaranteed to lie inside it.' });
  tl.tween(latticeU, 1, { at: t - 5.2, dur: 1.6, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: t - 5.0, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 6.3, text: 'Its determinant is one, so the public quadratic form gives it the minimum possible length, exactly n divided by four.' });
  tl.tween(shortestU, 1, { at: t - 5.2, dur: 1.0, ease: ease.pop });
  t = tl.hold(t, 0);
  t = tl.caption({ at: t, dur: 5.8, text: 'Key recovery has become a shortest-vector search in a public rank-n lattice. The remaining question is why that search needs only half the dimension.' });
  tl.tween(cam, CAMERA_HOME, { at: t - 5.0, dur: 1.2, ease: ease.move });
  return { tl, cam, gramU, secretU, tauU, cocycleU, constraintsU, latticeU, shortestU };
}
const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const tau = s.get(scene.tauU);
  const lat = s.get(scene.latticeU);
  return (
    <Camera {...s.get(scene.cam)}>
      <ResearchTitle kicker="The Hidden Involution · 1" title="A symmetry inside the public key" />
      <Panel x={70} y={145} w={520} h={390} opacity={s.get(scene.gramU)} accent={colors.ACCENT}>
        <text x={330} y={185} textAnchor="middle" fill={colors.MUTED} fontFamily={mono} fontSize={12}>public key</text>
        <MathLabel tex={'Q=B^{*}B'} x={390} y={260} opacity={1} />
        <g opacity={s.get(scene.secretU)}>
          <path d="M 180 400 L 300 310 L 420 400" fill="none" stroke={colors.SECONDARY} strokeWidth={5} />
          <text x={300} y={440} textAnchor="middle" fill={colors.SECONDARY} fontFamily={mono} fontSize={12}>short secret basis B</text>
        </g>
        <g opacity={tau}>
          <path d="M 180 400 L 300 490 L 420 400" fill="none" stroke={colors.WARM} strokeWidth={5} />
          <text x={300} y={510} textAnchor="middle" fill={colors.WARM} fontFamily={mono} fontSize={12}>τ(B) · ζ ↦ −ζ</text>
        </g>
      </Panel>
      <Arrow x1={590} y1={340} x2={690} y2={340} reveal={s.get(scene.cocycleU)} color={colors.POSITIVE} />
      <Chip x={640} y={290} text="Vτ = B−1τ(B)" opacity={s.get(scene.cocycleU)} color={colors.POSITIVE} width={150} />
      <Panel x={700} y={145} w={510} h={390} opacity={Math.max(0.1, lat)} accent={colors.POSITIVE}>
        <g opacity={lat}>
          {LATTICE.map((p, i) => <circle key={i} cx={955 + p.x * 45} cy={340 + p.y * 38} r={3.5} fill={colors.MUTED} />)}
        </g>
        <g opacity={s.get(scene.constraintsU)}>
          <MathLabel tex={'Y\\tau(Y)=I'} x={835} y={205} opacity={1} />
          <MathLabel tex={'Y^{*}Q\\,Y=\\tau(Q)'} x={1060} y={205} opacity={1} />
        </g>
        <g opacity={s.get(scene.shortestU)}>
          <circle cx={955} cy={340} r={18} fill={colors.POSITIVE} fillOpacity={0.25} stroke={colors.POSITIVE} strokeWidth={3} />
          <text x={955} y={390} textAnchor="middle" fill={colors.POSITIVE} fontFamily={mono} fontSize={12}>Vτ · min n/4</text>
        </g>
      </Panel>
    </Camera>
  );
}
export const vizScene = () => scene;
