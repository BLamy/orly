// Grounding: envharness/harnesses/setup.py; envharness/harnesses/rules.py;
// envharness/core/code_loader.py; paper Section 2.2 and Appendix A.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const ACTIONS = ['take mug', 'open drawer', 'put mug', 'close drawer'];
const GATES = [
  { x: 590, key: 'A', fn: 'filter_action' },
  { x: 790, key: 'T', fn: 'modify_transition' },
  { x: 990, key: 'O', fn: 'filter_observation' },
];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const tapeU = tl.channel('episode tape', 0);
  const setupU = tl.channel('setup spool', 0);
  const replayP = tl.channel('replay actions', 0);
  const policyU = tl.channel('policy starts', 0);
  const gatesP = tl.channel('rules gates', 0);
  const packet = tl.channel('step packet', 0);
  const blockU = tl.channel('blocked action', 0);
  const postU = tl.channel('post state refresh', 0);
  const verifierU = tl.channel('reward verifier bypass', 0);
  const codeU = tl.channel('compiled subclass', 0);
  const close = tl.channel('clean gate recap', 0);

  tl.caption({ at: 0.4, dur: 6.2, text: 'The first lever changes where the lesson begins, not what success means.' });
  tl.tween(tapeU, 1, { at: 0.8, dur: 1.5, ease: ease.draw });
  tl.tween(setupU, 1, { at: 2.0, dur: 0.8, ease: ease.enter });

  tl.caption({ at: 7.0, dur: 6.5, text: 'The paper calls it a Stage. The released code calls it Setup: a deterministic action list after reset.' });
  tl.tween(replayP, 4, { at: 7.7, dur: 4.6, ease: ease.linear });
  tl.tween(cam, { x: 480, y: 360, k: 1.12 }, { at: 9.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 13.9, dur: 6.3, text: 'Those actions replay before the policy sees anything, landing the same task in a new starting state.' });
  tl.tween(policyU, 1, { at: 14.6, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 17.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 20.6, dur: 6.5, text: 'The second lever rewrites the interaction. The paper calls it a Contract; the code implements Rules.' });
  tl.tween(gatesP, 3, { at: 21.2, dur: 2.1, ease: ease.enter });
  tl.tween(codeU, 0.35, { at: 23.2, dur: 0.7, ease: ease.enter });

  tl.caption({ at: 27.5, dur: 6.4, text: 'At the action gate, a move can pass, change shape, or bounce back as blocked.' });
  tl.tween(packet, 0.42, { at: 28.1, dur: 1.7, ease: ease.linear });
  tl.tween(blockU, 1, { at: 29.5, dur: 0.5, ease: ease.pop });
  tl.tween(blockU, 0.15, { at: 31.2, dur: 0.8, ease: ease.move });
  tl.tween(cam, { x: 640, y: 360, k: 1.1 }, { at: 28.8, dur: 1.2, ease: ease.move });

  tl.caption({ at: 34.3, dur: 6.5, text: 'A blocked move leaves the world untouched and returns the current observation with a reason.' });
  tl.tween(packet, 0.12, { at: 34.9, dur: 1.2, ease: ease.move });
  tl.tween(postU, 0.25, { at: 36.0, dur: 0.6, ease: ease.enter });

  tl.caption({ at: 41.2, dur: 6.6, text: 'For a real step, Rules fetches the new state, then transforms the transition and the observation in order.' });
  tl.tween(blockU, 0, { at: 41.7, dur: 0.5, ease: ease.move });
  tl.tween(packet, 1, { at: 42.0, dur: 4.2, ease: ease.linear });
  tl.tween(postU, 1, { at: 43.5, dur: 1.8, ease: ease.move });
  tl.tween(cam, { x: 760, y: 360, k: 1.1 }, { at: 43.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 48.2, dur: 6.4, text: 'Reward and terminal evaluation bypass all three gates. The trusted verifier keeps the final word.' });
  tl.tween(verifierU, 1, { at: 48.8, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 51.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 55.0, dur: 7.0, text: 'The designer writes a Rules subclass, the loader compiles it, and one episode tape now teaches a different behavior.' });
  tl.tween(codeU, 1, { at: 55.6, dur: 1.0, ease: ease.move });
  tl.tween(close, 1, { at: 60.0, dur: 1.0, ease: ease.move });
  tl.hold(62.2, 0.9);

  return { tl, cam, tapeU, setupU, replayP, policyU, gatesP, packet, blockU, postU, verifierU, codeU, close };
}

const scene = buildScene();

function Tape({ reveal, opacity = 1 }: { reveal: number; opacity?: number }) {
  return <g opacity={opacity}>
    <path d={`M 120 350 H ${120 + 1040 * reveal}`} stroke={colors.ACCENT} strokeWidth="10" strokeLinecap="round" />
    {Array.from({ length: 18 }, (_, i) => {
      const u = clamp01(reveal * 18 - i);
      return <rect key={i} x={126 + i * 56} y={329} width="38" height="42" rx="8" fill={i < 5 ? '#172554' : '#111827'} stroke={i < 5 ? colors.SECONDARY : colors.MUTED} opacity={u} />;
    })}
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const quiet = 1 - close;
  const replayP = s.get(scene.replayP);
  const packet = s.get(scene.packet);
  const px = 310 + packet * 760;
  return <Camera {...s.get(scene.cam)}>
    <g opacity={quiet}>
      <text x="640" y="70" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="700">One episode tape, four interface levers</text>
      <Tape reveal={s.get(scene.tapeU)} />

      <g opacity={s.get(scene.setupU)}>
        <circle cx="160" cy="245" r="62" fill="#111827" stroke={colors.SECONDARY} strokeWidth="4" />
        <circle cx="160" cy="245" r="22" fill="none" stroke={colors.SECONDARY} strokeWidth="4" />
        <text x="160" y="228" textAnchor="middle" fill={colors.TEXT} fontSize="19" fontWeight="700">Stage</text>
        <text x="160" y="258" textAnchor="middle" fill={colors.SECONDARY} fontSize="17">Setup</text>
        <path d="M160 307 V350" stroke={colors.SECONDARY} strokeWidth="4" />
      </g>

      {ACTIONS.map((a, i) => {
        const u = clamp01(replayP - i);
        const x = 248 + i * 72;
        return <g key={a} opacity={u} transform={`translate(${x} 248) scale(${0.76 + 0.24 * u})`}>
          <circle r="25" fill="#221b38" stroke={colors.WARM} strokeWidth="2" />
          <text y="5" textAnchor="middle" fill={colors.WARM} fontSize="12">a{i + 1}</text>
          <text y="45" textAnchor="middle" fill={colors.MUTED} fontSize="12">{a}</text>
          <path d="M0 25 V70" stroke={colors.WARM} strokeWidth="2" strokeDasharray="5 5" />
        </g>;
      })}

      <g opacity={s.get(scene.policyU)}>
        <rect x="260" y="405" width="210" height="70" rx="20" fill="#111827" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="365" y="435" textAnchor="middle" fill={colors.TEXT} fontSize="18" fontWeight="700">policy starts here</text>
        <text x="365" y="461" textAnchor="middle" fill={colors.ACCENT} fontSize="14">post-replay observation</text>
        <path d="M365 405 V373" stroke={colors.ACCENT} strokeWidth="3" />
      </g>

      {GATES.map((g, i) => {
        const u = clamp01(s.get(scene.gatesP) - i);
        const active = clamp01(packet * 3.2 - i);
        return <g key={g.key} opacity={u}>
          <rect x={g.x - 58} y="282" width="116" height="136" rx="24" fill="#0f172a" stroke={i === 0 ? colors.WARM : i === 1 ? colors.SECONDARY : colors.TEAL} strokeWidth={3 + active * 2} />
          <text x={g.x} y="320" textAnchor="middle" fill={colors.TEXT} fontSize="30" fontWeight="800">{g.key}</text>
          <text x={g.x} y="396" textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>{g.fn}</text>
        </g>;
      })}

      <g opacity={s.get(scene.gatesP) > 0 ? 1 : 0}>
        <circle cx={px} cy="350" r="13" fill={colors.WARM} stroke={colors.TEXT} strokeWidth="2" />
        <text x={px} y="326" textAnchor="middle" fill={colors.WARM} fontSize="13">step</text>
      </g>
      <g opacity={s.get(scene.blockU)}>
        <path d="M548 265 l84 84 M632 265 l-84 84" stroke={colors.NEGATIVE} strokeWidth="8" strokeLinecap="round" />
        <rect x="474" y="175" width="232" height="58" rx="18" fill="#351421" stroke={colors.NEGATIVE} />
        <text x="590" y="210" textAnchor="middle" fill={colors.NEGATIVE} fontSize="18" fontWeight="700">Blocked + current Observation</text>
      </g>

      <g opacity={s.get(scene.postU)}>
        <path d="M708 450 H 1055" stroke={colors.TEAL} strokeWidth="3" strokeDasharray="7 7" />
        <text x="880" y="479" textAnchor="middle" fill={colors.TEAL} fontSize="15">post_state = inner.get_env_state()</text>
      </g>

      <g opacity={s.get(scene.verifierU)}>
        <path d="M520 525 H 1088" stroke={colors.POSITIVE} strokeWidth="5" />
        <path d="M1068 514 l20 11 -20 11" fill="none" stroke={colors.POSITIVE} strokeWidth="5" />
        <rect x="880" y="500" width="235" height="70" rx="20" fill="#0b211c" stroke={colors.POSITIVE} strokeWidth="3" />
        <text x="997" y="530" textAnchor="middle" fill={colors.POSITIVE} fontSize="17" fontWeight="700">reward + evaluate()</text>
        <text x="997" y="554" textAnchor="middle" fill={colors.TEXT} fontSize="14">unchanged</text>
      </g>

      <g opacity={s.get(scene.codeU)}>
        <rect x="925" y="110" width="286" height="120" rx="20" fill="#111827" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="1068" y="142" textAnchor="middle" fill={colors.SECONDARY} fontSize="14" fontFamily={colors.font.mono}>load_rules_subclass(code)</text>
        <text x="1068" y="178" textAnchor="middle" fill={colors.TEXT} fontSize="19" fontFamily={colors.font.mono}>class _Rules(Rules)</text>
        <text x="1068" y="207" textAnchor="middle" fill={colors.MUTED} fontSize="14">generated Python · one layer</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="230" y="150" width="820" height="350" rx="34" fill={colors.BG} stroke={colors.ACCENT} strokeWidth="4" />
      <text x="640" y="220" textAnchor="middle" fill={colors.MUTED} fontSize="22">paper → released code</text>
      <text x="430" y="292" textAnchor="middle" fill={colors.SECONDARY} fontSize="30" fontWeight="700">Stage → Setup</text>
      <text x="850" y="292" textAnchor="middle" fill={colors.WARM} fontSize="30" fontWeight="700">Contract → Rules</text>
      <path d="M350 350 H930" stroke={colors.ACCENT} strokeWidth="10" strokeLinecap="round" />
      {['S₀', 'A', 'T', 'O'].map((v, i) => <g key={v}><circle cx={400 + i * 160} cy="350" r="31" fill="#111827" stroke={i ? colors.WARM : colors.SECONDARY} strokeWidth="3" /><text x={400 + i * 160} y="359" textAnchor="middle" fill={colors.TEXT} fontSize="23" fontWeight="700">{v}</text></g>)}
      <text x="640" y="433" textAnchor="middle" fill={colors.TEXT} fontSize="24">one task · one verifier · a deliberately different lesson</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
