// Grounding: arXiv:2608.31046 Section 4; slime/backends/megatron_utils/opsa.py; examples/opsa/README.md.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ENTROPY = [0.3, 0.6, 1.1, 1.7];
const ERANGE = Math.max(...ENTROPY) - Math.min(...ENTROPY);
const RANK = ENTROPY.map((h) => (h - Math.min(...ENTROPY)) / ERANGE);
const ADV = RANK.map((r) => -0.5 + (-1.0 + 0.5) * r);
const P0 = [0.22, 0.18, 0.14, 0.10, 0.08, 0.07, 0.05, 0.04, 0.035, 0.025, 0.02, 0.01];
const P1 = [0.235, 0.195, 0.155, 0.115, 0.09, 0.075, 0.045, 0.035, 0.025, 0.015, 0.01, 0.005];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const selectedU = tl.channel('selected tokens', 0);
  const entropyU = tl.channel('actor entropy', 0);
  const rankU = tl.channel('min max entropy rank', 0);
  const advantageU = tl.channel('negative advantages', 0);
  const pressureU = tl.channel('pressure arrows', 0);
  const massU = tl.channel('probability mass shift', 0);
  const equalU = tl.channel('equal entropy edge case', 0);
  const maskU = tl.channel('unselected zeroed', 0);
  const closeU = tl.channel('entropy close', 0);

  tl.caption({ at: 0.4, dur: 5.8, text: 'The lowest fifth tells the method where to learn. Entropy tells it how hard to push each selected token.' });
  tl.tween(selectedU, 1, { at: 0.9, dur: 1.3, ease: ease.enter });

  tl.caption({ at: 6.5, dur: 5.8, text: 'The current actor computes entropy at every response position during the same forward pass as log probability.' });
  tl.tween(entropyU, 1, { at: 7.1, dur: 1.4, ease: ease.draw });

  tl.caption({ at: 12.6, dur: 5.8, text: 'Within the selected tokens, the smallest entropy becomes rank zero and the largest becomes rank one.' });
  tl.tween(rankU, 1, { at: 13.2, dur: 1.6, ease: ease.move });
  tl.tween(cam, { x: 520, y: 330, k: 1.08 }, { at: 15.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 18.7, dur: 5.8, text: 'That rank maps linearly from a negative half to negative one, so higher entropy receives the stronger negative advantage.' });
  tl.tween(advantageU, 1, { at: 19.3, dur: 1.6, ease: ease.draw });
  tl.tween(pressureU, 1, { at: 21.2, dur: 1.0, ease: ease.pop });

  tl.caption({ at: 24.8, dur: 6.1, text: 'A negative advantage suppresses the sampled tail token instead of rewarding it.' });
  tl.tween(cam, { x: 720, y: 360, k: 1.08 }, { at: 25.4, dur: 1.2, ease: ease.move });
  tl.tween(massU, 1, { at: 26.8, dur: 2.2, ease: ease.move });

  tl.caption({ at: 30.9, dur: 5.8, text: 'As tail probability shrinks, the distribution renormalizes and probability returns to the head tokens.' });
  tl.tween(massU, 2, { at: 31.5, dur: 2.8, ease: ease.move });

  tl.caption({ at: 37.0, dur: 5.8, text: 'If every selected entropy is equal, the implementation assigns the strongest value, negative one, to all of them.' });
  tl.tween(equalU, 1, { at: 37.6, dur: 1.1, ease: ease.pop });

  tl.caption({ at: 43.1, dur: 5.8, text: 'Unselected tokens get zero advantage and zero in the new loss mask, so they do not dilute the denominator.' });
  tl.tween(maskU, 1, { at: 43.7, dur: 1.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 46.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 49.2, dur: 6.2, text: 'The whole signal comes from the actor: low sampled probability chooses the tail, and entropy grades the pressure.' });
  tl.tween(closeU, 1, { at: 50.0, dur: 1.2, ease: ease.move });
  tl.hold(55.4, 1.2);

  return { tl, cam, selectedU, entropyU, rankU, advantageU, pressureU, massU, equalU, maskU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const mass = clamp01(s.get(scene.massU));
  const rank = s.get(scene.rankU);
  const mask = s.get(scene.maskU);
  return <><text x="640" y="76" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850" opacity={1 - close}>entropy sets the pressure</text><Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <g transform="translate(92 128)" opacity={s.get(scene.selectedU)}>
        <rect width="560" height="420" rx="30" fill="#101a2b" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="280" y="42" textAnchor="middle" fill={colors.ACCENT} fontSize="15" fontFamily={colors.font.mono}>selected lowest-logp tokens</text>
        {ENTROPY.map((h, i) => {
          const r = RANK[i] * rank;
          const adv = -0.5 + (-0.5 * r);
          const y = 105 + i * 72;
          return <g key={i} transform={`translate(28 ${y})`} opacity={1 - mask * (i === 1 ? 0.75 : 0)}>
            <rect width="504" height="52" rx="16" fill="#15243a" stroke={colors.SECONDARY} />
            <text x="22" y="32" fill={colors.TEXT} fontSize="13" fontFamily={colors.font.mono}>{`y${i + 1}`}</text>
            <rect x="78" y="15" width={h * 130 * s.get(scene.entropyU)} height="20" rx="10" fill={colors.SECONDARY} />
            <text x="316" y="32" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>{`H=${h.toFixed(1)} · r=${r.toFixed(2)}`}</text>
            <rect x="414" y="10" width="74" height="32" rx="14" fill="#351923" stroke={colors.NEGATIVE} opacity={s.get(scene.advantageU)} />
            <text x="451" y="31" textAnchor="middle" fill={colors.NEGATIVE} fontSize="11" fontFamily={colors.font.mono} opacity={s.get(scene.advantageU)}>{adv.toFixed(2)}</text>
            <path d="M458 50 V68" stroke={colors.NEGATIVE} strokeWidth={3 + Math.abs(ADV[i]) * 3} opacity={s.get(scene.pressureU)} />
          </g>;
        })}
        <MathLabel tex={'A=A_{\\max}+(A_{\\min}-A_{\\max})r'} x={280} y={388} fontSize={26} opacity={s.get(scene.advantageU)} />
      </g>
      <g transform="translate(700 130)" opacity={s.get(scene.entropyU)}>
        <rect width="490" height="418" rx="30" fill="#111a2c" stroke={colors.WARM} strokeWidth="3" />
        <text x="245" y="42" textAnchor="middle" fill={colors.WARM} fontSize="15" fontFamily={colors.font.mono}>illustrative policy slice</text>
        <line x1="42" y1="342" x2="452" y2="342" stroke={colors.GRID} strokeWidth="3" />
        {P0.map((p, i) => {
          const value = p + (P1[i] - p) * mass;
          const h = value * 920;
          const tail = i >= 8;
          return <g key={i}>
            <rect x={50 + i * 33} y={342 - h} width="22" height={h} rx="7" fill={tail ? colors.NEGATIVE : colors.POSITIVE} opacity={tail ? 0.75 : 0.85} />
            <text x={61 + i * 33} y="365" textAnchor="middle" fill={tail ? colors.NEGATIVE : colors.MUTED} fontSize="9">{i + 1}</text>
          </g>;
        })}
        <path d={`M372 ${184 + mass * 72} C340 ${170 + mass * 40} 310 ${160 + mass * 18} 270 ${158 + mass * 10}`} fill="none" stroke={colors.WARM} strokeWidth="5" opacity={mass} />
        <polygon points="268,158 288,147 287,170" fill={colors.WARM} opacity={mass} />
        <text x="245" y="398" textAnchor="middle" fill={colors.MUTED} fontSize="13">tail suppression → renormalized head</text>
      </g>
      <g opacity={s.get(scene.equalU)} transform="translate(640 588)">
        <rect x="-250" y="-28" width="500" height="56" rx="20" fill="#2d2117" stroke={colors.WARM} strokeWidth="2" />
        <text y="7" textAnchor="middle" fill={colors.WARM} fontSize="14" fontFamily={colors.font.mono}>equal entropy range → rank 1 → advantage -1.0</text>
      </g>
    </g>
    <g opacity={close}>
      <rect x="174" y="118" width="932" height="442" rx="46" fill={colors.BG} stroke={colors.SECONDARY} strokeWidth="4" />
      <text x="640" y="194" textAnchor="middle" fill={colors.TEXT} fontSize="40" fontWeight="850">two actor measurements, one signal</text>
      <g transform="translate(338 344)"><circle r="98" fill="#14243a" stroke={colors.ACCENT} strokeWidth="4" /><text y="-8" textAnchor="middle" fill={colors.ACCENT} fontSize="21">low log probability</text><text y="23" textAnchor="middle" fill={colors.MUTED} fontSize="15">selects the token</text></g>
      <path d="M440 344 H560" stroke={colors.WARM} strokeWidth="7" /><polygon points="560,344 536,330 536,358" fill={colors.WARM} />
      <g transform="translate(730 344)"><circle r="98" fill="#241d38" stroke={colors.SECONDARY} strokeWidth="4" /><text y="-8" textAnchor="middle" fill={colors.SECONDARY} fontSize="21">entropy rank</text><text y="23" textAnchor="middle" fill={colors.MUTED} fontSize="15">sets the pressure</text></g>
      <text x="640" y="510" textAnchor="middle" fill={colors.POSITIVE} fontSize="18" fontFamily={colors.font.mono}>no external supervision</text>
    </g>
  </Camera></>;
}

export const vizScene = () => scene;
