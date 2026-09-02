// Grounding: arXiv:2608.31046 Sections 1–3; README.md; slime/backends/megatron_utils/opsa.py.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const PROBS = [0.19, 0.14, 0.115, 0.09, 0.075, 0.063, 0.052, 0.044, 0.037, 0.031, 0.026, 0.021, 0.017, 0.013, 0.009, 0.006];
const TEACHER = [0.16, 0.18, 0.08, 0.13, 0.04, 0.09, 0.03, 0.07, 0.02, 0.06, 0.012, 0.045, 0.008, 0.035, 0.004, 0.025];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const ribbonU = tl.channel('student token ribbon', 0);
  const teacherU = tl.channel('teacher distribution', 0);
  const mismatchU = tl.channel('teacher mismatch', 0);
  const noiseU = tl.channel('noisy supervision', 0);
  const insensitiveU = tl.channel('student insensitive', 0);
  const removeU = tl.channel('remove teacher', 0);
  const tailU = tl.channel('low probability tail', 0);
  const fixedU = tl.channel('fixed negative control', 0);
  const selfU = tl.channel('self adaptation', 0);
  const closeU = tl.channel('teacher free close', 0);

  tl.caption({ at: 0.4, dur: 5.8, text: 'On-policy distillation sounds simple: let a stronger teacher score the tokens sampled by a smaller student.' });
  tl.tween(ribbonU, 1, { at: 0.9, dur: 1.2, ease: ease.draw });
  tl.tween(teacherU, 1, { at: 2.5, dur: 1.1, ease: ease.enter });

  tl.caption({ at: 6.5, dur: 5.8, text: 'But those trajectories are on-policy for the student and off-policy for the teacher, so their token scores can disagree.' });
  tl.tween(cam, { x: 700, y: 320, k: 1.08 }, { at: 7.1, dur: 1.3, ease: ease.move });
  tl.tween(mismatchU, 1, { at: 8.4, dur: 1.4, ease: ease.draw });
  tl.tween(noiseU, 1, { at: 10.0, dur: 1.0, ease: ease.pop });

  tl.caption({ at: 12.6, dur: 5.8, text: 'The paper measures substantial teacher noise, and that noise grows more common as the teacher grows.' });
  tl.tween(noiseU, 2.2, { at: 13.2, dur: 3.2, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 16.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 18.7, dur: 5.8, text: 'Surprisingly, filtering noisy supervision barely changes where the student converges.' });
  tl.tween(insensitiveU, 1, { at: 19.3, dur: 1.0, ease: ease.enter });

  tl.caption({ at: 24.8, dur: 5.8, text: 'That shifts the question: perhaps the useful signal is not the teacher score at all.' });
  tl.tween(removeU, 1, { at: 25.4, dur: 1.4, ease: ease.move });
  tl.tween(cam, { x: 700, y: 360, k: 1.08 }, { at: 27.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 30.9, dur: 5.8, text: 'Learning concentrates on the student tokens it considered least likely while sampling its own response.' });
  tl.tween(tailU, 1, { at: 31.5, dur: 2.0, ease: ease.draw });

  tl.caption({ at: 37.0, dur: 5.8, text: 'Give those same low-probability tokens one fixed negative advantage, and the teacher is no longer needed.' });
  tl.tween(fixedU, 1, { at: 37.6, dur: 1.1, ease: ease.pop });

  tl.caption({ at: 43.1, dur: 5.8, text: 'On-Policy Self-Adaptation keeps that clue, then uses the student policy’s own entropy to vary the pressure.' });
  tl.tween(selfU, 1, { at: 43.7, dur: 1.4, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 46.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 49.2, dur: 6.2, text: 'No teacher model, no reward model, no reference forward pass: the policy becomes its own training signal.' });
  tl.tween(closeU, 1, { at: 50.0, dur: 1.2, ease: ease.move });
  tl.hold(55.4, 1.2);

  return { tl, cam, ribbonU, teacherU, mismatchU, noiseU, insensitiveU, removeU, tailU, fixedU, selfU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const remove = s.get(scene.removeU);
  const tail = s.get(scene.tailU);
  const close = s.get(scene.closeU);
  const noise = s.get(scene.noiseU);
  return <><text x="640" y="76" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850" opacity={1 - close}>what if the teacher is not the lesson?</text><Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <g opacity={(1 - remove) * s.get(scene.teacherU)}>
        <text x="112" y="146" fill={colors.SECONDARY} fontSize="15" fontFamily={colors.font.mono}>teacher scores student trajectory</text>
        {TEACHER.map((p, i) => {
          const h = p * 920;
          return <rect key={i} x={128 + i * 64} y={270 - h} width="34" height={h} rx="8" fill={colors.SECONDARY} opacity={0.35 + 0.25 * Math.sin(noise * 3 + i)} />;
        })}
      </g>
      <g opacity={s.get(scene.ribbonU)}>
        <text x="112" y="326" fill={colors.ACCENT} fontSize="15" fontFamily={colors.font.mono}>current actor sampled-token probabilities</text>
        {PROBS.map((p, i) => {
          const h = p * 920;
          const selected = i >= 13;
          return <g key={i}>
            <rect x={128 + i * 64} y={542 - h} width="34" height={h} rx="8" fill={selected ? colors.NEGATIVE : colors.ACCENT} opacity={selected ? 0.55 + 0.45 * tail : 0.82 - tail * 0.58} stroke={selected && tail ? colors.WARM : 'none'} strokeWidth="3" />
            <text x={145 + i * 64} y="568" textAnchor="middle" fill={selected && tail ? colors.WARM : colors.MUTED} fontSize="10" fontFamily={colors.font.mono}>{`y${i + 1}`}</text>
          </g>;
        })}
      </g>
      <g opacity={s.get(scene.mismatchU) * (1 - remove)}>
        {[2, 3, 5, 7, 9, 11, 13, 15].map((i) => <line key={i} x1={145 + i * 64} y1={280 - TEACHER[i] * 920} x2={145 + i * 64} y2={532 - PROBS[i] * 920} stroke={colors.NEGATIVE} strokeWidth="2" strokeDasharray="7 6" />)}
        <rect x="842" y="214" width="250" height="46" rx="18" fill="#321925" stroke={colors.NEGATIVE} />
        <text x="967" y="243" textAnchor="middle" fill={colors.NEGATIVE} fontSize="14" fontFamily={colors.font.mono}>off-policy teacher noise</text>
      </g>
      <g opacity={s.get(scene.insensitiveU) * (1 - remove)} transform="translate(176 596)">
        <path d="M0 0 C140 -48 240 -10 350 -34 S570 -16 730 -32" fill="none" stroke={colors.MUTED} strokeWidth="4" />
        <path d="M0 0 C140 -42 240 -8 350 -31 S570 -13 730 -30" fill="none" stroke={colors.POSITIVE} strokeWidth="4" />
        <text x="760" y="-26" fill={colors.POSITIVE} fontSize="13">similar convergence</text>
      </g>
      <g opacity={s.get(scene.fixedU)} transform="translate(826 164)">
        <rect x="-116" y="-32" width="232" height="64" rx="20" fill="#2d2117" stroke={colors.WARM} strokeWidth="3" />
        <text y="-4" textAnchor="middle" fill={colors.WARM} fontSize="15" fontFamily={colors.font.mono}>fixed-negative</text>
        <text y="20" textAnchor="middle" fill={colors.TEXT} fontSize="13">same lowest tokens</text>
      </g>
      <g opacity={s.get(scene.selfU)} transform="translate(438 164)">
        <rect x="-150" y="-34" width="300" height="68" rx="22" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="3" />
        <text y="-5" textAnchor="middle" fill={colors.POSITIVE} fontSize="16" fontFamily={colors.font.mono}>On-Policy Self-Adaptation</text>
        <text y="20" textAnchor="middle" fill={colors.TEXT} fontSize="13">actor logp + actor entropy</text>
      </g>
    </g>
    <g opacity={close}>
      <rect x="182" y="118" width="916" height="442" rx="46" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="194" textAnchor="middle" fill={colors.TEXT} fontSize="40" fontWeight="850">the policy supplies its own signal</text>
      {['teacher model', 'reward model', 'reference forward pass'].map((label, i) => <g key={label} transform={`translate(${320 + i * 320} 336)`}>
        <circle r="72" fill="#241824" stroke={colors.NEGATIVE} strokeWidth="3" />
        <text y="5" textAnchor="middle" fill={colors.MUTED} fontSize="14">{label}</text>
        <line x1="-52" y1="-52" x2="52" y2="52" stroke={colors.NEGATIVE} strokeWidth="7" />
      </g>)}
      <text x="640" y="502" textAnchor="middle" fill={colors.POSITIVE} fontSize="18" fontFamily={colors.font.mono}>current actor → selected tail → self-adaptation</text>
    </g>
  </Camera></>;
}

export const vizScene = () => scene;
