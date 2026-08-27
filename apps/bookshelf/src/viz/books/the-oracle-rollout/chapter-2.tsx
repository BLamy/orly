// Grounding: paper equations 6–10; orarl/algorithm/advantages.py;
// tests/test_algorithm_advantages.py.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const POLICY = [0.0, 0.2, 0.4, 0.6];
const ORACLE_REWARD = 1.0;
const MU_OP = POLICY.reduce((a, b) => a + b, 0) / POLICY.length;
const MU_AUG = (POLICY.reduce((a, b) => a + b, 0) + ORACLE_REWARD) / (POLICY.length + 1);
const sx = (v: number) => 142 + v * 996;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const axisU = tl.channel('reward ruler', 0);
  const policyP = tl.channel('policy rewards', 0);
  const policyMeanU = tl.channel('policy mean', 0);
  const oracleU = tl.channel('oracle reward', 0);
  const meanShift = tl.channel('mixed mean shift', 0);
  const inversionU = tl.channel('advantage inversion', 0);
  const restoreU = tl.channel('oracle excluded baseline', 0);
  const gainU = tl.channel('directional gain', 0);
  const recenterU = tl.channel('policy recenter', 0);
  const anchorU = tl.channel('detached oracle anchor', 0);
  const close = tl.channel('separate channels', 0);

  tl.caption({ at: 0.4, dur: 6.0, text: 'Four sampled rewards define the policy’s own comparison: zero, zero point two, zero point four, and zero point six.' });
  tl.tween(axisU, 1, { at: 0.8, dur: 1.4, ease: ease.draw });
  tl.tween(policyP, 4, { at: 1.8, dur: 2.4, ease: ease.enter });

  tl.caption({ at: 6.8, dur: 6.1, text: 'Their mean is zero point three. The rollout at zero point four is usefully above average.' });
  tl.tween(policyMeanU, 1, { at: 7.5, dur: 0.7, ease: ease.enter });
  tl.tween(cam, { x: sx(0.35), y: 330, k: 1.1 }, { at: 9.4, dur: 1.3, ease: ease.move });

  tl.caption({ at: 13.3, dur: 6.2, text: 'Now mix in the perfect oracle before normalizing. The baseline slides from zero point three to zero point four four.' });
  tl.tween(oracleU, 1, { at: 14.0, dur: 0.7, ease: ease.pop });
  tl.tween(meanShift, 1, { at: 15.2, dur: 1.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 17.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 19.9, dur: 6.2, text: 'That zero point four rollout still beats the policy mean, yet the mixed baseline assigns it a negative advantage.' });
  tl.tween(inversionU, 1, { at: 20.6, dur: 0.6, ease: ease.pop });
  tl.tween(cam, { x: sx(0.4), y: 330, k: 1.15 }, { at: 22.1, dur: 1.3, ease: ease.move });

  tl.caption({ at: 26.5, dur: 6.2, text: 'This is advantage inversion. The better the oracle is, the wider that misleading interval becomes.' });
  tl.tween(inversionU, 2, { at: 27.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 33.1, dur: 6.2, text: 'The method restores the policy-only baseline, so every rollout above the policy mean keeps a positive sign.' });
  tl.tween(restoreU, 1, { at: 33.8, dur: 1.2, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 36.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 39.7, dur: 6.2, text: 'A bounded directional gain then strengthens only the above-mean policy rollouts, using the oracle’s distance without moving the baseline.' });
  tl.tween(gainU, 1, { at: 40.4, dur: 1.4, ease: ease.move });

  tl.caption({ at: 46.3, dur: 6.1, text: 'The transformed policy advantages are recentered to zero, preserving a clean relative comparison.' });
  tl.tween(recenterU, 1, { at: 47.0, dur: 1.2, ease: ease.move });
  tl.tween(cam, { x: 610, y: 478, k: 1.12 }, { at: 49.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 52.8, dur: 6.3, text: 'The oracle gets its own detached positive anchor, capped against the strongest useful policy signal.' });
  tl.tween(anchorU, 1, { at: 53.5, dur: 0.8, ease: ease.pop });

  tl.caption({ at: 59.5, dur: 6.5, text: 'Policy comparison and oracle guidance travel on separate channels, so neither can corrupt the other.' });
  tl.tween(cam, CAMERA_HOME, { at: 59.2, dur: 1.0, ease: ease.move });
  tl.tween(close, 1, { at: 60.2, dur: 1.1, ease: ease.move });
  tl.hold(66.2, 1.0);

  return { tl, cam, axisU, policyP, policyMeanU, oracleU, meanShift, inversionU, restoreU, gainU, recenterU, anchorU, close };
}

const scene = buildScene();

function Tick({ value, reveal }: { value: number; reveal: number }) {
  return <g opacity={reveal}>
    <line x1={sx(value)} y1="310" x2={sx(value)} y2="332" stroke={colors.GRID} strokeWidth="2" />
    <text x={sx(value)} y="356" textAnchor="middle" fill={colors.MUTED} fontSize="13" fontFamily={colors.font.mono}>{value.toFixed(1)}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const quiet = 1 - close;
  const restore = s.get(scene.restoreU);
  const shift = s.get(scene.meanShift) * (1 - restore);
  const mean = MU_OP + (MU_AUG - MU_OP) * shift;
  const inversion = s.get(scene.inversionU) * (1 - restore);
  const gain = s.get(scene.gainU);
  const recenter = s.get(scene.recenterU);
  const anchor = s.get(scene.anchorU);

  return <Camera {...s.get(scene.cam)}>
    <g opacity={quiet}>
      <text x="640" y="62" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">A perfect answer can move the wrong line</text>
      <g opacity={s.get(scene.axisU)}>
        <line x1="142" y1="320" x2="1138" y2="320" stroke={colors.GRID} strokeWidth="6" strokeLinecap="round" />
        {Array.from({ length: 11 }, (_, i) => <Tick key={i} value={i / 10} reveal={s.get(scene.axisU)} />)}
        <text x="640" y="390" textAnchor="middle" fill={colors.MUTED} fontSize="15">reward</text>
      </g>

      {POLICY.map((value, i) => {
        const u = clamp01(s.get(scene.policyP) - i);
        const positive = value > mean;
        const flipped = value === 0.4 && inversion > 0;
        const boost = value > MU_OP ? gain : 0;
        const y = 282 - boost * (18 + value * 18) + recenter * (i % 2 ? 4 : -4);
        const color = flipped ? colors.NEGATIVE : positive ? colors.POSITIVE : colors.ACCENT;
        return <g key={value} opacity={u} transform={`translate(${sx(value)} ${y}) scale(${0.82 + u * 0.18})`}>
          <circle r={flipped ? 23 : 18 + boost * 5} fill={color} stroke="#07101d" strokeWidth="3" />
          <text y="5" textAnchor="middle" fill="#07101d" fontSize="12" fontWeight="900">o{i + 1}</text>
          <text y="-34" textAnchor="middle" fill={color} fontSize="13" fontFamily={colors.font.mono}>r={value.toFixed(1)}</text>
          {flipped && <text y="54" textAnchor="middle" fill={colors.NEGATIVE} fontSize="13" fontWeight="800">sign flipped</text>}
        </g>;
      })}

      <g opacity={s.get(scene.oracleU)} transform={`translate(${sx(ORACLE_REWARD)} 254) scale(${0.84 + s.get(scene.oracleU) * 0.16})`}>
        <circle r={22 + anchor * 8} fill={colors.WARM} stroke="#07101d" strokeWidth="3" />
        <text y="5" textAnchor="middle" fill="#171000" fontSize="12" fontWeight="900">GT</text>
        <text y="-39" textAnchor="middle" fill={colors.WARM} fontSize="13" fontFamily={colors.font.mono}>rgt=1.0</text>
        <text y="54" textAnchor="middle" fill={colors.WARM} fontSize="13" fontWeight="800" opacity={anchor}>Agt=0.24</text>
      </g>

      <g opacity={s.get(scene.policyMeanU)}>
        {inversion > 0 && <rect x={sx(MU_OP)} y="208" width={sx(MU_AUG) - sx(MU_OP)} height="184" fill={colors.NEGATIVE} opacity={0.08 + inversion * 0.12} />}
        <line x1={sx(mean)} y1="178" x2={sx(mean)} y2="420" stroke={restore ? colors.POSITIVE : shift > 0 ? colors.NEGATIVE : colors.ACCENT} strokeWidth="4" strokeDasharray="9 8" />
        <rect x={sx(mean) - 92} y="138" width="184" height="34" rx="17" fill="#0d1526" stroke={restore ? colors.POSITIVE : shift > 0 ? colors.NEGATIVE : colors.ACCENT} />
        <text x={sx(mean)} y="160" textAnchor="middle" fill={restore ? colors.POSITIVE : shift > 0 ? colors.NEGATIVE : colors.ACCENT} fontSize="13" fontFamily={colors.font.mono}>
          {restore ? 'μop = 0.30' : shift > 0 ? `μaug = ${mean.toFixed(2)}` : 'μop = 0.30'}
        </text>
      </g>

      <g opacity={clamp01(inversion)}>
        <path d={`M${sx(MU_OP)} 432 H${sx(MU_AUG)}`} stroke={colors.NEGATIVE} strokeWidth="6" strokeLinecap="round" />
        <text x={(sx(MU_OP) + sx(MU_AUG)) / 2} y="462" textAnchor="middle" fill={colors.NEGATIVE} fontSize="14" fontWeight="750">inversion band</text>
      </g>

      <g opacity={gain}>
        <MathLabel tex={'g_q=\\operatorname{clip}[(\\sigma_{aug}/(\\sigma_{op}+\\epsilon))^{1/4},1,4]'} x={640} y={500} fontSize={22} opacity={gain} />
        <text x="640" y="548" textAnchor="middle" fill={colors.POSITIVE} fontSize="15">positive policy advantages stretch · negative ones do not</text>
      </g>
      <g opacity={recenter}>
        <text x="640" y="588" textAnchor="middle" fill={colors.SECONDARY} fontSize="15" fontFamily={colors.font.mono}>Aop ← U − mean(U) · Σ Aop = 0</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="202" y="136" width="876" height="404" rx="40" fill={colors.BG} stroke={colors.ACCENT} strokeWidth="4" />
      <text x="640" y="210" textAnchor="middle" fill={colors.TEXT} fontSize="36" fontWeight="850">two signals, two channels</text>
      <g transform="translate(406 350)">
        <circle r="92" fill="#10263a" stroke={colors.ACCENT} strokeWidth="4" />
        <text y="-10" textAnchor="middle" fill={colors.ACCENT} fontSize="25" fontWeight="850">policy mean</text>
        <text y="26" textAnchor="middle" fill={colors.MUTED} fontSize="16">relative comparison</text>
      </g>
      <path d="M504 350 H776" stroke={colors.GRID} strokeWidth="5" strokeDasharray="10 10" />
      <g transform="translate(874 350)">
        <circle r="92" fill="#2b240d" stroke={colors.WARM} strokeWidth="4" />
        <text y="-10" textAnchor="middle" fill={colors.WARM} fontSize="25" fontWeight="850">oracle anchor</text>
        <text y="26" textAnchor="middle" fill={colors.MUTED} fontSize="16">detached guidance</text>
      </g>
      <text x="640" y="492" textAnchor="middle" fill={colors.POSITIVE} fontSize="22" fontWeight="750">the anchor never moves the baseline</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
