// Grounding: envharness/harnesses/link.py; tests/test_link_envagnostic.py;
// EnvHarness paper Section 2.2 and Table 5.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const circumference = 2 * Math.PI * 112;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const reelA = tl.channel('environment A reel', 0);
  const reelB = tl.channel('environment B reel', 0);
  const linkU = tl.channel('link splice', 0);
  const aProgress = tl.channel('stage A progress', 0);
  const aVerify = tl.channel('stage A verdict', 0);
  const handoff = tl.channel('lazy handoff', 0);
  const contextU = tl.channel('context splice', 0);
  const bProgress = tl.channel('stage B progress', 0);
  const bVerify = tl.channel('stage B verdict', 0);
  const resultU = tl.channel('combined verdict', 0);
  const evidenceU = tl.channel('chain evidence', 0);
  const evidenceStageU = tl.channel('chain evidence stage', 0);
  const close = tl.channel('long horizon close', 0);

  tl.caption({ at: 0.4, dur: 6.3, text: 'A short task can teach the wrong reflex: stop celebrating as soon as one goal turns green.' });
  tl.tween(reelA, 1, { at: 0.8, dur: 1.0, ease: ease.enter });
  tl.tween(aProgress, 0.35, { at: 1.8, dur: 4.2, ease: ease.linear });

  tl.caption({ at: 7.1, dur: 6.4, text: 'Link splices any two actionable environments into one longer episode.' });
  tl.tween(reelB, 1, { at: 7.7, dur: 1.0, ease: ease.enter });
  tl.tween(linkU, 1, { at: 8.8, dur: 1.5, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 335, k: 1.13 }, { at: 10.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 13.9, dur: 6.5, text: "It never opens either world's internals. It routes only reset, step, observe, evaluate, state, and close." });
  tl.tween(cam, CAMERA_HOME, { at: 17.5, dur: 1.2, ease: ease.move });

  tl.caption({ at: 20.8, dur: 6.4, text: 'At the beginning, only environment A resets. Environment B stays cold until the splice is reached.' });
  tl.tween(aProgress, 1, { at: 21.5, dur: 4.4, ease: ease.linear });

  tl.caption({ at: 27.6, dur: 6.5, text: 'When A finishes, Link records its verdict and masks that local ending from the composite episode.' });
  tl.tween(aVerify, 1, { at: 28.2, dur: 0.6, ease: ease.pop });
  tl.tween(handoff, 0.45, { at: 29.0, dur: 2.8, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 360, k: 1.08 }, { at: 29.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 34.5, dur: 6.5, text: 'Now B resets. Its first observation may receive a bounded tail from A, announcing the new task without exposing hidden state.' });
  tl.tween(contextU, 1, { at: 35.1, dur: 0.8, ease: ease.enter });
  tl.tween(handoff, 1, { at: 36.0, dur: 2.4, ease: ease.linear });
  tl.tween(cam, { x: 840, y: 335, k: 1.15 }, { at: 37.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 41.4, dur: 6.4, text: 'The same policy keeps acting while the second reel lengthens the goal it must remember.' });
  tl.tween(bProgress, 1, { at: 42.0, dur: 4.8, ease: ease.linear });

  tl.caption({ at: 48.2, dur: 6.5, text: 'Final success needs both original verifiers. Passing the first half can never erase failure in the second.' });
  tl.tween(cam, CAMERA_HOME, { at: 47.4, dur: 1.2, ease: ease.move });
  tl.tween(bVerify, 1, { at: 48.8, dur: 0.6, ease: ease.pop });
  tl.tween(resultU, 1, { at: 49.8, dur: 1.2, ease: ease.enter });

  tl.caption({ at: 55.1, dur: 7.0, text: 'Combined with the other components, Chain skills reached a fifty-four point three success rate in forty-three point one two average steps.' });
  tl.tween(evidenceStageU, 1, { at: 54.7, dur: 0.9, ease: ease.move });
  tl.tween(evidenceU, 1, { at: 55.7, dur: 0.9, ease: ease.enter });
  tl.tween(close, 1, { at: 60.4, dur: 1.0, ease: ease.move });
  tl.hold(62.4, 1.0);
  return { tl, cam, reelA, reelB, linkU, aProgress, aVerify, handoff, contextU, bProgress, bVerify, resultU, evidenceU, evidenceStageU, close };
}

const scene = buildScene();

function Reel({ x, label, sublabel, reveal, progress, color }: { x: number; label: string; sublabel: string; reveal: number; progress: number; color: string }) {
  return <g opacity={reveal}>
    <circle cx={x} cy="330" r="112" fill="#111827" stroke={colors.MUTED} strokeWidth="5" />
    <circle cx={x} cy="330" r="72" fill="none" stroke={colors.GRID} strokeWidth="30" strokeDasharray="8 12" />
    <circle cx={x} cy="330" r="112" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${circumference * progress} ${circumference}`} transform={`rotate(-90 ${x} 330)`} />
    <circle cx={x} cy="330" r="26" fill={color} opacity="0.22" />
    <text x={x} y="323" textAnchor="middle" fill={colors.TEXT} fontSize="28" fontWeight="800">{label}</text>
    <text x={x} y="354" textAnchor="middle" fill={color} fontSize="16">{sublabel}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const quiet = 1 - close;
  const evidenceStage = s.get(scene.evidenceStageU);
  const h = s.get(scene.handoff);
  const hx = 452 + 376 * h;
  return <Camera {...s.get(scene.cam)}>
    <g opacity={quiet}>
      <text x="640" y="70" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="700">Link stitches one longer goal</text>
      <g opacity={1 - evidenceStage}>
      <Reel x={330} label="A" sublabel="env_a : ActionableEnv" reveal={s.get(scene.reelA)} progress={s.get(scene.aProgress)} color={colors.ACCENT} />
      <Reel x={950} label="B" sublabel="env_b : ActionableEnv" reveal={s.get(scene.reelB)} progress={s.get(scene.bProgress)} color={colors.SECONDARY} />

      <path d={`M442 330 C ${500 + 90 * s.get(scene.linkU)} 330 ${690 - 90 * s.get(scene.linkU)} 330 838 330`} fill="none" stroke={colors.WARM} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${Math.max(1, s.get(scene.linkU) * 520)} 540`} />
      <circle cx={hx} cy="330" r="13" fill={colors.WARM} opacity={s.get(scene.linkU)} />
      <text x="640" y="292" textAnchor="middle" fill={colors.WARM} fontSize="18" fontWeight="700" opacity={s.get(scene.linkU)}>Link.step()</text>

      <g opacity={s.get(scene.aVerify)}>
        <circle cx="330" cy="425" r="27" fill="#0b211c" stroke={colors.POSITIVE} strokeWidth="4" />
        <text x="330" y="435" textAnchor="middle" fill={colors.POSITIVE} fontSize="26">✓</text>
        <text x="330" y="469" textAnchor="middle" fill={colors.MUTED} fontSize="14">a.evaluate().success</text>
        <rect x="228" y="150" width="204" height="52" rx="16" fill="#111827" stroke={colors.ACCENT} />
        <text x="330" y="182" textAnchor="middle" fill={colors.TEXT} fontSize="15">termination masked</text>
      </g>

      <g opacity={s.get(scene.contextU) * (1 - s.get(scene.bVerify))}>
        <rect x="505" y="380" width="270" height="104" rx="20" fill="#211a38" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="640" y="410" textAnchor="middle" fill={colors.SECONDARY} fontSize="16" fontWeight="700">[switched to new task]</text>
        <text x="640" y="439" textAnchor="middle" fill={colors.TEXT} fontSize="14">tail of A's last observation</text>
        <text x="640" y="467" textAnchor="middle" fill={colors.MUTED} fontSize="13" fontFamily={colors.font.mono}>carry_chars = 1500</text>
      </g>

      <g opacity={s.get(scene.bVerify)}>
        <circle cx="950" cy="425" r="27" fill="#0b211c" stroke={colors.POSITIVE} strokeWidth="4" />
        <text x="950" y="435" textAnchor="middle" fill={colors.POSITIVE} fontSize="26">✓</text>
        <text x="950" y="469" textAnchor="middle" fill={colors.MUTED} fontSize="14">b.evaluate().success</text>
      </g>

      <g opacity={s.get(scene.resultU)}>
        <rect x="520" y="110" width="240" height="86" rx="24" fill="#0b211c" stroke={colors.POSITIVE} strokeWidth="4" />
        <text x="640" y="145" textAnchor="middle" fill={colors.POSITIVE} fontSize="20" fontWeight="800">combined = A AND B</text>
        <text x="640" y="177" textAnchor="middle" fill={colors.TEXT} fontSize="15">two original verifiers</text>
      </g>

      <g opacity={Math.min(s.get(scene.reelA), s.get(scene.reelB))}>
        <text x="330" y="470" textAnchor="middle" fill={colors.MUTED} fontSize="13" opacity={1 - s.get(scene.aVerify)}>reset now</text>
        <text x="950" y="470" textAnchor="middle" fill={colors.MUTED} fontSize="13" opacity={1 - s.get(scene.bVerify)}>lazy reset at handoff</text>
      </g>
      </g>

      <g opacity={s.get(scene.evidenceU)}>
        <rect x="310" y="175" width="660" height="260" rx="34" fill="#111827" stroke={colors.WARM} strokeWidth="4" />
        <text x="640" y="235" textAnchor="middle" fill={colors.WARM} fontSize="23" fontWeight="700">Stage + Contract + Chain skills</text>
        <text x="500" y="325" textAnchor="middle" fill={colors.POSITIVE} fontSize="42" fontWeight="800">54.30%</text>
        <text x="500" y="362" textAnchor="middle" fill={colors.MUTED} fontSize="16">success rate</text>
        <path d="M640 275 V385" stroke={colors.GRID} strokeWidth="3" />
        <text x="780" y="325" textAnchor="middle" fill={colors.ACCENT} fontSize="42" fontWeight="800">43.12</text>
        <text x="780" y="362" textAnchor="middle" fill={colors.MUTED} fontSize="16">average steps</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="220" y="145" width="840" height="370" rx="36" fill={colors.BG} stroke={colors.WARM} strokeWidth="4" />
      <path d="M350 325 H930" stroke={colors.WARM} strokeWidth="14" strokeLinecap="round" />
      <circle cx="390" cy="325" r="74" fill="#111827" stroke={colors.ACCENT} strokeWidth="4" />
      <circle cx="890" cy="325" r="74" fill="#111827" stroke={colors.SECONDARY} strokeWidth="4" />
      <text x="390" y="335" textAnchor="middle" fill={colors.ACCENT} fontSize="34" fontWeight="800">A ✓</text>
      <text x="890" y="335" textAnchor="middle" fill={colors.SECONDARY} fontSize="34" fontWeight="800">B ✓</text>
      <rect x="548" y="270" width="184" height="110" rx="26" fill="#0b211c" stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="318" textAnchor="middle" fill={colors.POSITIVE} fontSize="26" fontWeight="800">Link</text>
      <text x="640" y="351" textAnchor="middle" fill={colors.TEXT} fontSize="18">one long goal</text>
      <text x="640" y="446" textAnchor="middle" fill={colors.MUTED} fontSize="23">success survives only when both keys turn</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
