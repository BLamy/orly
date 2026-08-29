// Grounding: paper sections 4 and 5; agentic_artifacts/unityscenebench/
// main_eval_720/results.json and scaling_generation/true_generation_720_all/SUMMARY.md.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const METHODS = [
  { label: 'Fuzzy proxies', value: 0.5025, color: colors.MUTED },
  { label: 'SFT', value: 0.5173, color: colors.ACCENT },
  { label: 'Human only', value: 0.4807, color: colors.SECONDARY },
  { label: 'Engine only', value: 0.5323, color: colors.WARM },
  { label: 'Full RLHEV', value: 0.5509, color: colors.POSITIVE },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const candidateU = tl.channel('candidate world', 0);
  const gateU = tl.channel('structural gate', 0);
  const rejectU = tl.channel('structural rejection', 0);
  const engineU = tl.channel('dense engine diagnostics', 0);
  const humanU = tl.channel('human acceptance', 0);
  const railsU = tl.channel('two reward rails', 0);
  const formulaU = tl.channel('gated reward equation', 0);
  const compareU = tl.channel('method comparison', 0);
  const meanBarsU = tl.channel('eight seed primary means', 0);
  const genU = tl.channel('true generation comparison', 0);
  const close = tl.channel('two judges one gate', 0);

  tl.caption({ at: 0.4, dur: 6.0, text: 'A game engine can prove that a door opens, but it cannot decide whether the room is worth keeping.' });
  tl.tween(candidateU, 1, { at: 0.9, dur: 0.8, ease: ease.enter });
  tl.tween(engineU, 0.55, { at: 2.0, dur: 1.4, ease: ease.draw });

  tl.caption({ at: 6.4, dur: 6.2, text: 'First comes a structural gate. If the scene fails execution, the candidate cannot collect a positive reward.' });
  tl.tween(gateU, 1, { at: 6.9, dur: 1.1, ease: ease.draw });
  tl.tween(rejectU, 1, { at: 8.8, dur: 0.5, ease: ease.pop });
  tl.tween(cam, { x: 486, y: 330, k: 1.06 }, { at: 9.8, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.6, dur: 6.2, text: 'Dense engine diagnostics point to collision, lighting, navigation, and playability problems that can be repaired cheaply.' });
  tl.tween(rejectU, 0, { at: 13.1, dur: 0.6, ease: ease.enter });
  tl.tween(engineU, 1, { at: 13.5, dur: 2.4, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 16.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 18.8, dur: 6.2, text: 'Then the developer supplies the sparse global signal: accept the scene, reject it, or ask for a repair.' });
  tl.tween(humanU, 1, { at: 19.3, dur: 0.6, ease: ease.pop });
  tl.tween(railsU, 1, { at: 20.4, dur: 1.3, ease: ease.draw });

  tl.caption({ at: 25.0, dur: 6.2, text: 'Engine-only training misses design intent. Human-only training throws away the cheap, local evidence the engine already produced.' });
  tl.tween(compareU, 0.55, { at: 25.5, dur: 1.4, ease: ease.move });
  tl.tween(cam, { x: 760, y: 330, k: 1.05 }, { at: 27.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 31.2, dur: 6.3, text: 'Reinforcement Learning with Human-Engine Verification combines both signals only after the structural gate passes, then subtracts action cost.' });
  tl.tween(formulaU, 1, { at: 31.7, dur: 0.7, ease: ease.enter });
  tl.tween(compareU, 1, { at: 33.0, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 35.1, dur: 1.2, ease: ease.move });
  tl.tween(formulaU, 0, { at: 36.5, dur: 0.6, ease: ease.enter });

  tl.caption({ at: 37.5, dur: 6.2, text: 'Across eight released seeds, the full method has the highest primary mean on the released scene benchmark, while the margins remain modest.' });
  tl.tween(meanBarsU, 1, { at: 38.0, dur: 2.0, ease: ease.draw });

  tl.caption({ at: 43.7, dur: 6.5, text: 'On fresh Unity generation, the same method also leads engine-only training in quality and pass rate. Two judges beat either judge alone.' });
  tl.tween(genU, 1, { at: 44.2, dur: 1.4, ease: ease.move });
  tl.tween(close, 1, { at: 48.2, dur: 1.0, ease: ease.move });
  tl.hold(50.4, 1.0);

  return { tl, cam, candidateU, gateU, rejectU, engineU, humanU, railsU, formulaU, compareU, meanBarsU, genU, close };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const gate = s.get(scene.gateU);
  const engine = s.get(scene.engineU);
  const human = s.get(scene.humanU);
  const compare = s.get(scene.compareU);
  const bars = s.get(scene.meanBarsU);
  const gen = s.get(scene.genU);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="72" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">Two judges share one structural gate</text>

      <g opacity={s.get(scene.candidateU)}>
        <rect x="70" y="152" width="244" height="266" rx="30" fill="#111c2f" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="192" y="188" textAnchor="middle" fill={colors.ACCENT} fontSize="14" fontFamily={colors.font.mono}>candidate scene</text>
        <rect x="108" y="242" width="168" height="116" rx="18" fill="#16263d" stroke={colors.MUTED} strokeWidth="2" />
        <path d="M130 324 H254 M150 324 V268 M208 324 V286" stroke={colors.WARM} strokeWidth="7" strokeLinecap="round" />
        <circle cx="236" cy="279" r="18" fill={colors.SECONDARY} opacity="0.7" />
      </g>

      <g opacity={gate}>
        <path d="M332 284 H464" stroke={colors.GRID} strokeWidth="8" />
        <rect x="392" y="212" width="22" height="144" rx="11" fill={s.get(scene.rejectU) ? colors.NEGATIVE : colors.POSITIVE} />
        <text x="403" y="190" textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>g(x,a)</text>
        <g opacity={s.get(scene.rejectU)}><circle cx="403" cy="284" r="46" fill="#32141c" stroke={colors.NEGATIVE} strokeWidth="4" /><path d="M-16 -16 L16 16 M16 -16 L-16 16" transform="translate(403 284)" stroke={colors.NEGATIVE} strokeWidth="8" strokeLinecap="round" /></g>
      </g>

      <g opacity={engine}>
        <rect x="486" y="116" width="280" height="226" rx="28" fill="#112035" stroke={colors.WARM} strokeWidth="3" />
        <text x="626" y="152" textAnchor="middle" fill={colors.WARM} fontSize="18" fontWeight="800">engine diagnostics</text>
        {['collision', 'lighting', 'navigation', 'playability'].map((label, i) => <g key={label} opacity={clamp01(engine * 5 - i)}>
          <rect x="520" y={178 + i * 35} width={188 - i * 18} height="18" rx="9" fill={i === 0 ? colors.NEGATIVE : colors.WARM} opacity={0.28 + i * 0.08} />
          <text x="526" y={192 + i * 35} fill={colors.TEXT} fontSize="12" fontFamily={colors.font.mono}>{label}</text>
        </g>)}
      </g>

      <g opacity={human}>
        <rect x="486" y="374" width="280" height="154" rx="28" fill="#201a31" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="626" y="410" textAnchor="middle" fill={colors.SECONDARY} fontSize="18" fontWeight="800">developer review</text>
        <g transform="translate(626 462)"><circle r="42" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="4" /><path d="M-20 0 L-5 16 L24 -18" fill="none" stroke={colors.POSITIVE} strokeWidth="8" strokeLinecap="round" /></g>
        <text x="626" y="516" textAnchor="middle" fill={colors.MUTED} fontSize="12">global acceptance</text>
      </g>

      <g opacity={s.get(scene.railsU)}>
        <path d="M766 230 C820 230 820 284 864 284" fill="none" stroke={colors.WARM} strokeWidth="6" />
        <path d="M766 450 C820 450 820 316 864 316" fill="none" stroke={colors.SECONDARY} strokeWidth="6" />
        <circle cx="878" cy="300" r="38" fill="#102a22" stroke={colors.POSITIVE} strokeWidth="4" />
        <text x="878" y="306" textAnchor="middle" fill={colors.POSITIVE} fontSize="14" fontWeight="800">reward</text>
      </g>

      <MathLabel tex={'r_{\\alpha,\\beta}=\\mathbb{I}\\{g=1\\}(\\alpha h+\\beta e)-\\lambda_c c'} x={930} y={118} fontSize={18} opacity={s.get(scene.formulaU)} />

      <g opacity={bars} transform={`translate(0 ${compare * 12})`}>
        <rect x="914" y="146" width="296" height="410" rx="28" fill="#0e1829" stroke={colors.GRID} strokeWidth="2" />
        <text x="1062" y="180" textAnchor="middle" fill={colors.TEXT} fontSize="15" fontWeight="760">UnitySceneBench primary mean</text>
        <text x="1062" y="202" textAnchor="middle" fill={colors.MUTED} fontSize="11">eight seeds · train budget 720</text>
        {METHODS.map((method, i) => {
          const u = clamp01(bars * 6 - i);
          const width = Math.max(0, (method.value - 0.44) * 2500 * u);
          return <g key={method.label} opacity={u}>
            <text x="934" y={242 + i * 58} fill={colors.MUTED} fontSize="11">{method.label}</text>
            <rect x="934" y={252 + i * 58} width="230" height="22" rx="11" fill={colors.GRID} opacity="0.55" />
            <rect x="934" y={252 + i * 58} width={width} height="22" rx="11" fill={method.color} opacity="0.82" />
            <text x="1180" y={268 + i * 58} textAnchor="end" fill={method.color} fontSize="12" fontFamily={colors.font.mono}>{method.value.toFixed(4)}</text>
          </g>;
        })}
      </g>

      <g opacity={gen}>
        <rect x="68" y="432" width="790" height="64" rx="24" fill="#0f241e" stroke={colors.POSITIVE} />
        <text x="92" y="456" fill={colors.WARM} fontSize="12" fontFamily={colors.font.mono}>engine only</text>
        <text x="256" y="456" fill={colors.TEXT} fontSize="13">quality 0.7934 · pass 0.9375</text>
        <text x="92" y="482" fill={colors.POSITIVE} fontSize="12" fontFamily={colors.font.mono}>full RLHEV</text>
        <text x="256" y="482" fill={colors.TEXT} fontSize="13">quality 0.8197 · pass 0.9688</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="198" y="128" width="884" height="426" rx="42" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="204" textAnchor="middle" fill={colors.TEXT} fontSize="40" fontWeight="850">two judges · one gate</text>
      <g transform="translate(346 356)"><circle r="84" fill="#1f1a0e" stroke={colors.WARM} strokeWidth="5" /><text textAnchor="middle" y="-8" fill={colors.WARM} fontSize="20" fontWeight="800">ENGINE</text><text textAnchor="middle" y="24" fill={colors.MUTED} fontSize="14">dense · local</text></g>
      <path d="M432 356 H574" stroke={colors.POSITIVE} strokeWidth="8" /><rect x="550" y="304" width="34" height="104" rx="14" fill={colors.POSITIVE} />
      <g transform="translate(802 356)"><circle r="84" fill="#201a31" stroke={colors.SECONDARY} strokeWidth="5" /><text textAnchor="middle" y="-8" fill={colors.SECONDARY} fontSize="20" fontWeight="800">HUMAN</text><text textAnchor="middle" y="24" fill={colors.MUTED} fontSize="14">sparse · global</text></g>
      <text x="640" y="500" textAnchor="middle" fill={colors.MUTED} fontSize="17">execution before reward · intent before acceptance</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
