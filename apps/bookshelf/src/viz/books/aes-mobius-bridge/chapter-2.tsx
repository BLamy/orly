// Source: aes_mobius_bridge.pdf, sections 4.1 and 4.2.
// Persistent object: one multiset orbit moves under an unknown affine action while its fingerprint stays fixed.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Arrow, Chip, Panel, ResearchTitle, clamp01, mono } from '../../book-components/research';

const POINTS = Array.from({ length: 24 }, (_, i) => ({
  x: 215 + ((i * 73) % 250),
  y: 210 + ((i * i * 29) % 280),
}));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const pointsU = tl.channel('pointsU', 0);
  const invertU = tl.channel('invertU', 0);
  const affineU = tl.channel('affineU', 0);
  const keyU = tl.channel('keyU', 0);
  const ratioU = tl.channel('ratioU', 0);
  const frameU = tl.channel('frameU', 0);
  const compareU = tl.channel('compareU', 0);
  const cancelU = tl.channel('cancelU', 0);
  let t = 0.4;
  t = tl.caption({ at: t, dur: 5.5, text: 'The obstacle is the Advanced Encryption Standard substitution box. It is not a random table; each byte is inverted in a finite field, then transformed affinely.' });
  tl.tween(pointsU, 1, { at: 0.8, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 390, y: 350, k: 1.18 }, { at: 1.0, dur: 1.3, ease: ease.move });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.5, text: 'Below the table, the unknown key byte passes backward through that inversion. On the other side it becomes one shared affine action on every value.' });
  tl.tween(invertU, 1, { at: t - 5.0, dur: 1.5, ease: ease.move });
  tl.tween(affineU, 1, { at: t - 3.0, dur: 1.4, ease: ease.move });
  tl.tween(keyU, 1, { at: t - 4.4, dur: 0.7, ease: ease.pop });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.8, text: 'That action has only two unknowns: a nonzero scale and a shift. The whole multiset moves together, instead of changing arbitrarily.' });
  tl.tween(cam, { x: 640, y: 350, k: 1.1 }, { at: t - 5.2, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 6.0, text: 'The first fingerprint takes ratios of power sums. Translation terms vanish, scale factors divide out, and the remaining number is identical on both sides.' });
  tl.tween(ratioU, 1, { at: t - 5.4, dur: 0.8, ease: ease.enter });
  tl.tween(compareU, 0.5, { at: t - 3.8, dur: 1.4, ease: ease.linear });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.8, text: 'A second fingerprint uses a moving frame. It chooses a canonical scale and shift for the orbit, so every affine copy lands on the same representative.' });
  tl.tween(frameU, 1, { at: t - 5.2, dur: 1.5, ease: ease.draw });
  tl.tween(compareU, 1, { at: t - 3.2, dur: 1.4, ease: ease.linear });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.7, text: 'The online and offline values now compare directly. Neither side ever learns the hidden scale or shift, because neither one needs to.' });
  tl.tween(cam, { x: 870, y: 350, k: 1.2 }, { at: t - 5.0, dur: 1.2, ease: ease.move });
  t = tl.hold(t, 0.5);
  t = tl.caption({ at: t, dur: 5.7, text: 'So the ninth guessed byte is crossed out. Algebra has built a bridge across the substitution box, saving a factor of two hundred fifty-six guesses.' });
  tl.tween(cancelU, 1, { at: t - 5.0, dur: 1.0, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: t - 2.0, dur: 1.2, ease: ease.move });
  return { tl, cam, pointsU, invertU, affineU, keyU, ratioU, frameU, compareU, cancelU };
}
const scene = buildScene();

function Cloud({ x, u, invert, affine, color }: { x: number; u: number; invert: number; affine: number; color: string }) {
  return (
    <g opacity={u}>
      {POINTS.map((p, i) => {
        const dx = p.x - 340;
        const dy = p.y - 350;
        const r2 = Math.max(900, dx * dx + dy * dy);
        const ix = 340 + (dx / r2) * 14000;
        const iy = 350 - (dy / r2) * 14000;
        const mx = p.x + (ix - p.x) * invert;
        const my = p.y + (iy - p.y) * invert;
        const ax = 340 + (mx - 340) * (1 + 0.35 * affine) + 36 * affine;
        const ay = 350 + (my - 350) * (1 + 0.35 * affine) - 22 * affine;
        return <circle key={i} cx={x + ax - 340} cy={ay} r={5} fill={color} opacity={0.45 + (i % 4) * 0.15} />;
      })}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const u = s.get(scene.pointsU);
  const inv = s.get(scene.invertU);
  const aff = s.get(scene.affineU);
  const frame = s.get(scene.frameU);
  const cancel = s.get(scene.cancelU);
  return (
    <Camera {...s.get(scene.cam)}>
      <ResearchTitle kicker="The Möbius Bridge · 2" title="The byte that cancels" />
      <defs>
        <clipPath id="amb2-left"><rect x={82} y={122} width={466} height={426} rx={14} /></clipPath>
        <clipPath id="amb2-right"><rect x={732} y={122} width={466} height={426} rx={14} /></clipPath>
      </defs>
      <Panel x={80} y={120} w={470} h={430} opacity={u} accent={colors.SECONDARY}>
        <text x={315} y={155} textAnchor="middle" fill={colors.SECONDARY} fontFamily={mono} fontSize={12}>offline multiset D</text>
        <g clipPath="url(#amb2-left)"><Cloud x={315} u={u} invert={inv} affine={0} color={colors.SECONDARY} /></g>
      </Panel>
      <Panel x={730} y={120} w={470} h={430} opacity={u} accent={colors.WARM}>
        <text x={965} y={155} textAnchor="middle" fill={colors.WARM} fontFamily={mono} fontSize={12}>online multiset G</text>
        <g clipPath="url(#amb2-right)"><Cloud x={965} u={u} invert={inv} affine={aff} color={colors.WARM} /></g>
      </Panel>
      <Arrow x1={550} y1={350} x2={730} y2={350} reveal={s.get(scene.compareU)} color={colors.ACCENT} />
      <Chip x={640} y={300} text="S−1(x ⊕ s)" opacity={s.get(scene.keyU)} color={colors.NEGATIVE} width={110} />
      <MathLabel tex={'G=\\alpha D+\\beta'} x={640} y={405} opacity={s.get(scene.ratioU)} />
      <g opacity={frame}>
        <rect x={785} y={185} width={360} height={300} rx={12} fill="none" stroke={colors.POSITIVE} strokeDasharray="7 6" strokeWidth={2} />
        <text x={965} y={510} textAnchor="middle" fill={colors.POSITIVE} fontFamily={mono} fontSize={12}>χ⋆ · canonical orbit frame</text>
      </g>
      <g opacity={cancel}>
        <Chip x={640} y={520} text="unknown key byte" color={colors.NEGATIVE} width={160} />
        <line x1={550} y1={500} x2={730} y2={540} stroke={colors.POSITIVE} strokeWidth={5} />
        <text x={640} y={580} textAnchor="middle" fill={colors.POSITIVE} fontWeight={800} fontSize={18}>× 1 / 256 guesses</text>
      </g>
    </Camera>
  );
}
export const vizScene = () => scene;
