// Grounding: envharness/core/actionable_env.py; envharness/core/envharness.py;
// EnvHarness paper Sections 1 and 2.1 (arXiv:2608.19880).
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const METHODS = [
  { label: 'reset()', a: -2.35 },
  { label: 'step(action)', a: -1.25 },
  { label: 'observe()', a: -0.15 },
  { label: 'evaluate()', a: 0.95 },
  { label: 'get_env_state()', a: 2.05 },
];
const DOMAINS = ['ALFWorld', 'WebArena', 'SWE-bench', 'OfficeQA', 'SpreadsheetBench'];
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const worldU = tl.channel('frozen world', 0);
  const orbitU = tl.channel('interface membrane', 0);
  const methodP = tl.channel('interface methods', 0);
  const wrapU = tl.channel('harness wrap', 0);
  const flow = tl.channel('action observation flow', 0);
  const stackU = tl.channel('composable layers', 0);
  const freezeU = tl.channel('frozen backend', 0);
  const verifierU = tl.channel('verifier beam', 0);
  const domainsP = tl.channel('benchmark domains', 0);
  const close = tl.channel('closing equation', 0);

  tl.caption({ at: 0.4, dur: 6.2, text: 'An agent can improve only by meeting a world that teaches it something new.' });
  tl.tween(worldU, 1, { at: 0.8, dur: 1.2, ease: ease.enter });
  tl.tween(flow, 0.7, { at: 2.0, dur: 3.8, ease: ease.linear });

  tl.caption({ at: 7.0, dur: 6.4, text: 'But a hand-built benchmark is static. It repeats the same lesson, even after the learner changes.' });
  tl.tween(freezeU, 1, { at: 7.8, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 335, k: 1.18 }, { at: 9.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 13.8, dur: 6.4, text: 'Environment Harness leaves that world in place and wraps a programmable membrane around its interface.' });
  tl.tween(orbitU, 1, { at: 14.4, dur: 1.4, ease: ease.draw });
  tl.tween(wrapU, 1, { at: 15.8, dur: 1.2, ease: ease.enter });

  tl.caption({ at: 20.6, dur: 6.4, text: 'Reset, step, observe, evaluate, and environment state form the shared boundary.' });
  tl.tween(methodP, 5, { at: 21.2, dur: 2.3, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 24.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 27.4, dur: 6.4, text: 'An action crosses inward. A fresh observation comes back. The policy keeps speaking the same language.' });
  tl.tween(flow, 3.1, { at: 28.0, dur: 5.4, ease: ease.linear });

  tl.caption({ at: 34.2, dur: 6.5, text: 'The wrapper is itself an actionable environment, so another layer can wrap it again without changing the agent.' });
  tl.tween(stackU, 1, { at: 34.8, dur: 1.6, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 335, k: 1.12 }, { at: 37.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 41.2, dur: 6.4, text: 'Inside, the benchmark transition logic stays frozen while the membrane reshapes what passes through.' });
  tl.tween(freezeU, 1.6, { at: 41.8, dur: 1.0, ease: ease.pop });
  tl.tween(flow, 4.5, { at: 42.4, dur: 4.2, ease: ease.linear });

  tl.caption({ at: 48.0, dur: 6.5, text: 'Evaluation still reaches the original human-built verifier. The wrapper cannot manufacture success.' });
  tl.tween(verifierU, 1, { at: 48.7, dur: 1.5, ease: ease.draw });
  tl.tween(cam, { x: 785, y: 335, k: 1.18 }, { at: 50.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 54.9, dur: 6.8, text: 'Five very different benchmarks now accept the same layer. One frozen lesson can become a lesson shaped for this learner.' });
  tl.tween(domainsP, 5, { at: 55.4, dur: 2.1, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 57.4, dur: 1.2, ease: ease.move });
  tl.tween(close, 1, { at: 60.2, dur: 1.0, ease: ease.move });
  tl.hold(61.8, 1.0);

  return { tl, cam, worldU, orbitU, methodP, wrapU, flow, stackU, freezeU, verifierU, domainsP, close };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const worldU = s.get(scene.worldU);
  const orbitU = s.get(scene.orbitU);
  const wrapU = s.get(scene.wrapU);
  const stackU = s.get(scene.stackU);
  const close = s.get(scene.close);
  const quiet = 1 - close;
  const flow = s.get(scene.flow);
  const phase = flow % 1;
  const actionX = 165 + 355 * phase;
  const obsX = 520 - 355 * phase;
  return (
    <Camera {...s.get(scene.cam)}>
      <g opacity={quiet}>
        <text x="640" y="70" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="700">A membrane around a frozen world</text>
        <g opacity={worldU}>
          <circle cx="640" cy="335" r="118" fill={colors.PANEL} stroke={colors.MUTED} strokeWidth="3" />
          <path d="M600 292 l18 18 -18 18 22 22 -18 18 M680 292 l-18 18 18 18 -22 22 18 18" fill="none" stroke={colors.ACCENT} strokeWidth="4" opacity="0.7" />
          <text x="640" y="326" textAnchor="middle" fill={colors.TEXT} fontSize="24" fontWeight="700">static environment</text>
          <text x="640" y="360" textAnchor="middle" fill={colors.MUTED} fontSize="17">native transitions · original task</text>
          <text x="640" y="399" textAnchor="middle" fill={colors.ACCENT} fontSize="32" opacity={0.35 + 0.65 * clamp01(s.get(scene.freezeU))}>❄</text>
        </g>

        <circle cx="640" cy="335" r="190" fill="none" stroke={colors.SECONDARY} strokeWidth={3 + 7 * wrapU} strokeDasharray={`${Math.max(1, orbitU * 1160)} 1200`} opacity={0.28 + 0.72 * orbitU} />
        <circle cx="640" cy="335" r="211" fill="none" stroke={colors.ACCENT} strokeWidth="2" strokeDasharray={`${Math.max(1, stackU * 1280)} 1320`} opacity={0.52 * stackU} />
        <circle cx="640" cy="335" r="230" fill="none" stroke={colors.TEAL} strokeWidth="2" strokeDasharray={`${Math.max(1, stackU * 1400)} 1450`} opacity={0.34 * stackU} />
        <text x="640" y="118" textAnchor="middle" fill={colors.SECONDARY} fontSize="18" fontWeight="700" opacity={wrapU}>EnvHarness : ActionableEnv</text>

        {METHODS.map((m, i) => {
          const u = clamp01(s.get(scene.methodP) - i);
          const x = 640 + Math.cos(m.a) * 190;
          const y = 335 + Math.sin(m.a) * 190;
          return <g key={m.label} opacity={u} transform={`translate(${x} ${y}) scale(${0.75 + 0.25 * u})`}>
            <rect x="-68" y="-18" width="136" height="36" rx="18" fill="#111827" stroke={i === 3 ? colors.POSITIVE : colors.SECONDARY} strokeWidth="2" />
            <text y="6" textAnchor="middle" fill={colors.TEXT} fontSize="14" fontFamily={colors.font.mono}>{m.label}</text>
          </g>;
        })}

        <g opacity={worldU}>
          <rect x="70" y="285" width="118" height="96" rx="22" fill="#111827" stroke={colors.ACCENT} strokeWidth="3" />
          <circle cx="129" cy="317" r="18" fill={colors.ACCENT} opacity="0.24" />
          <text x="129" y="350" textAnchor="middle" fill={colors.TEXT} fontSize="20" fontWeight="700">policy</text>
          <text x="129" y="373" textAnchor="middle" fill={colors.MUTED} fontSize="14">black box</text>
          <path d="M188 318 H 520" stroke={colors.WARM} strokeWidth="3" opacity="0.38" />
          <path d="M520 354 H 188" stroke={colors.ACCENT} strokeWidth="3" opacity="0.38" />
          <circle cx={actionX} cy="318" r="9" fill={colors.WARM} />
          <text x={actionX} y="300" textAnchor="middle" fill={colors.WARM} fontSize="13">Action</text>
          <circle cx={obsX} cy="354" r="9" fill={colors.ACCENT} />
          <text x={obsX} y="378" textAnchor="middle" fill={colors.ACCENT} fontSize="13">Observation</text>
        </g>

        <g opacity={s.get(scene.verifierU)}>
          <path d="M738 335 C 825 335 842 258 918 258" fill="none" stroke={colors.POSITIVE} strokeWidth="5" strokeDasharray="9 8" />
          <rect x="918" y="210" width="250" height="96" rx="22" fill="#0b211c" stroke={colors.POSITIVE} strokeWidth="3" />
          <text x="1043" y="246" textAnchor="middle" fill={colors.POSITIVE} fontSize="19" fontWeight="700">original verifier</text>
          <text x="1043" y="277" textAnchor="middle" fill={colors.TEXT} fontSize="17">evaluate().success</text>
        </g>

        <g>
          {DOMAINS.map((d, i) => {
            const u = clamp01(s.get(scene.domainsP) - i);
            return <g key={d} opacity={u} transform={`translate(${165 + i * 238} 558)`}>
              <rect x="-92" y="-24" width="184" height="48" rx="16" fill="#111827" stroke={i % 2 ? colors.TEAL : colors.ACCENT} />
              <text y="6" textAnchor="middle" fill={colors.TEXT} fontSize="16">{d}</text>
            </g>;
          })}
        </g>
      </g>

      <g opacity={close}>
        <rect x="250" y="165" width="780" height="335" rx="34" fill={colors.BG} stroke={colors.SECONDARY} strokeWidth="4" />
        <text x="640" y="246" textAnchor="middle" fill={colors.MUTED} fontSize="22">same benchmark · same verifier</text>
        <MathLabel tex={'E^{\\prime} = w(E)'} x={640} y={330} fontSize={54} color={colors.TEXT} opacity={close} />
        <text x="640" y="414" textAnchor="middle" fill={colors.SECONDARY} fontSize="27" fontWeight="700">customized environment = static environment + EnvHarness</text>
      </g>
    </Camera>
  );
}

export const vizScene = () => scene;
