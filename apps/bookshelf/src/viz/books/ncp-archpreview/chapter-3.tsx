// Grounding: arXiv:2609.10715 Sections 2.3–2.5 and 3.1–3.5;
// official source files src/ncp_olmo_eval/vllm_plugin/hlm.py,
// src/ncp_olmo_eval/vllm_plugin/routes.py, and src/ncp_olmo_eval/vllm_plugin/state.py.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Vec } from '../../primitives';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const GROUP_COLORS = [colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const historyU = tl.channel('completed concept history', 0);
  const moduleU = tl.channel('eight concept layers', 0);
  const predictU = tl.channel('next concept prediction', 0);
  const expandU = tl.channel('repeat four times', 0);
  const gateU = tl.channel('causal delay gate', 0);
  const shiftU = tl.channel('one chunk shift', 0);
  const fuseU = tl.channel('decoder fusion', 0);
  const routesU = tl.channel('hierarchical residual routes', 0);
  const lossesU = tl.channel('joint objectives', 0);
  const causalU = tl.channel('causal output', 0);
  const closeU = tl.channel('closing invariant', 0);
  const pulse = tl.channel('flow pulse', 0);
  tl.tween(pulse, 1, { at: 0, dur: 73, ease: ease.linear });

  tl.caption({ at: 0.4, dur: 5.9, text: 'The concept module reads only concepts made from completed token chunks.' });
  tl.tween(historyU, 1, { at: 0.8, dur: 1.6, ease: ease.draw });
  tl.tween(cam, { x: 330, y: 230, k: 1.10 }, { at: 2.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 6.4, dur: 5.9, text: 'Eight transformer layers process that shorter history and predict the next concept at the slower clock rate.' });
  tl.tween(moduleU, 1, { at: 6.9, dur: 1.8, ease: ease.enter });
  tl.tween(predictU, 1, { at: 8.2, dur: 2.4, ease: ease.move });
  tl.tween(cam, { x: 650, y: 240, k: 1.10 }, { at: 8.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.4, dur: 5.9, text: 'One predicted concept must guide token positions again, so the model repeats it four times.' });
  tl.tween(expandU, 1, { at: 12.9, dur: 2.0, ease: ease.enter });
  tl.tween(cam, { x: 905, y: 355, k: 1.08 }, { at: 13.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 18.4, dur: 5.9, text: 'But copying is not enough. Without a delay, a concept could leak information from the very tokens it is supposed to predict.' });
  tl.tween(gateU, 1, { at: 18.9, dur: 1.2, ease: ease.draw });

  tl.caption({ at: 24.4, dur: 5.9, text: 'The implementation shifts the concept signal by one full chunk and fills the first four positions with zero.' });
  tl.tween(shiftU, 1, { at: 24.9, dur: 2.8, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 26.8, dur: 1.2, ease: ease.move });

  tl.caption({ at: 30.4, dur: 5.9, text: 'Only then does the shifted concept add to token hidden states before the sixteen-layer decoder.' });
  tl.tween(fuseU, 1, { at: 30.9, dur: 2.2, ease: ease.pop });

  tl.caption({ at: 36.4, dur: 5.9, text: 'Information also travels across depth. Intra-module routes can mix earlier layer states instead of accepting only the newest one.' });
  tl.tween(routesU, 0.48, { at: 36.9, dur: 2.0, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 360, k: 1.02 }, { at: 37.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 42.4, dur: 5.9, text: 'Cross-module routes carry aligned encoder states into the concept module and both encoder and concept states into the decoder.' });
  tl.tween(routesU, 1, { at: 42.9, dur: 2.3, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 45.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 48.4, dur: 5.9, text: 'Three objectives train the same machine: next token prediction, next concept prediction, and vector quantization.' });
  tl.tween(lossesU, 1, { at: 49.0, dur: 2.4, ease: ease.enter });

  tl.caption({ at: 54.4, dur: 5.9, text: 'The token loss stays dense, while the concept loss teaches the encoder which multi-token information remains useful for prediction.' });
  tl.tween(lossesU, 1.8, { at: 55.0, dur: 1.8, ease: ease.move });

  tl.caption({ at: 60.4, dur: 5.9, text: 'At the output, every token is still generated autoregressively from positions that came before it.' });
  tl.tween(causalU, 1, { at: 61.0, dur: 2.8, ease: ease.linear });

  tl.caption({ at: 66.4, dur: 6.0, text: 'Predict, repeat, shift, and fuse. The concept arrives one chunk behind, exactly where causality says it belongs.' });
  tl.tween(closeU, 1, { at: 67.0, dur: 1.3, ease: ease.move });
  tl.hold(72.3, 1.0);

  return { tl, cam, historyU, moduleU, predictU, expandU, gateU, shiftU, fuseU, routesU, lossesU, causalU, closeU, pulse };
}

const scene = buildScene();

function ConceptBead({ x, y, label, color, u = 1, glow = 0 }: { x: number; y: number; label: string; color: string; u?: number; glow?: number }) {
  if (u <= 0) return null;
  return <g transform={`translate(${x} ${y}) scale(${0.75 + 0.25 * u})`} opacity={u}>
    <circle r={29 + glow * 5} fill="#101827" stroke={color} strokeWidth={2.5 + glow * 2} />
    <circle r="17" fill={color} opacity={0.18 + glow * 0.18} />
    <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="13" fontFamily={colors.font.mono}>{label}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const history = s.get(scene.historyU);
  const module = s.get(scene.moduleU);
  const predict = s.get(scene.predictU);
  const expand = s.get(scene.expandU);
  const shift = s.get(scene.shiftU);
  const fuse = s.get(scene.fuseU);
  const routes = s.get(scene.routesU);
  const losses = s.get(scene.lossesU);
  const causal = s.get(scene.causalU);
  const pulse = s.get(scene.pulse);
  const pipelineFade = 1 - clamp01(routes * 3);
  const routeFade = 1 - clamp01(losses * 2.2);
  const lossFade = 1 - clamp01(causal * 2.2);

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="62" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">one chunk behind</text>

      <g opacity={pipelineFade}>
        <text x="232" y="112" textAnchor="middle" fill={colors.MUTED} fontSize="12">completed concept history</text>
        {[0, 1, 2].map((i) => <ConceptBead key={i} x={122 + i * 110} y={166} label={`c${i + 1}`} color={GROUP_COLORS[i]} u={clamp01(history * 4 - i)} />)}
        <path d="M390 166 H510" stroke={colors.MUTED} strokeWidth="3" strokeDasharray="9 7" opacity={history} />

        <g opacity={module}>
          <rect x="505" y="108" width="260" height="150" rx="32" fill="#15152a" stroke={colors.SECONDARY} strokeWidth="3" />
          <text x="635" y="138" textAnchor="middle" fill={colors.SECONDARY} fontSize="13" fontFamily={colors.font.mono}>Concept Module · 8 layers</text>
          {Array.from({ length: 8 }, (_, i) => <circle key={i} cx={544 + i * 26} cy="186" r="13" fill={i % 2 ? '#2a2040' : '#15233b'} stroke={colors.SECONDARY} opacity={clamp01(module * 10 - i)} />)}
          <path d="M535 224 H738" stroke={colors.SECONDARY} strokeWidth="4" strokeDasharray="10 8" strokeDashoffset={-pulse * 120} />
        </g>

        <ConceptBead x={790 + 112 * predict} y={166 + 120 * predict} label="ĉ4" color={colors.WARM} u={predict} glow={predict} />
        <text x="930" y="250" textAnchor="middle" fill={colors.WARM} fontSize="12" opacity={predict}>weighted codeword prediction</text>

        <g opacity={expand}>
          <text x="936" y="318" textAnchor="middle" fill={colors.MUTED} fontSize="12">repeat k = 4</text>
          {[0, 1, 2, 3].map((i) => <ConceptBead key={i} x={828 + i * 72} y={365} label="ĉ4" color={colors.WARM} u={clamp01(expand * 5 - i)} />)}
        </g>

        <g opacity={s.get(scene.gateU)}>
          <rect x="598" y="298" width="74" height="190" rx="24" fill="#301b22" stroke={colors.NEGATIVE} strokeWidth="3" />
          <text x="635" y="390" textAnchor="middle" fill={colors.NEGATIVE} fontSize="13" transform="rotate(-90 635 390)">causal shift · Δ = k</text>
        </g>

        <g>
          {Array.from({ length: 12 }, (_, i) => {
            const x = 166 + i * 78;
            const afterShift = i < 4 ? '0' : i < 8 ? 'ĉ2' : 'ĉ3';
            const color = i < 4 ? colors.MUTED : GROUP_COLORS[Math.floor(i / 4)];
            const u = clamp01(shift * 14 - i);
            return <g key={i} transform={`translate(${x} 520)`} opacity={history}>
              <rect x="-29" y="-27" width="58" height="54" rx="14" fill="#111c2c" stroke={color} strokeWidth={u > 0 ? 3 : 1.5} />
              <text y="-5" textAnchor="middle" fill={colors.TEXT} fontSize="11" fontFamily={colors.font.mono}>{`h${i + 1}`}</text>
              <text y="15" textAnchor="middle" fill={u > 0 ? color : colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>{u > 0 ? `+ ${afterShift}` : ''}</text>
            </g>;
          })}
          <text x="640" y="548" textAnchor="middle" fill={colors.MUTED} fontSize="12" opacity={fuse}>shifted concept signal enters the Token Decoder · 16 layers</text>
          <rect x="112" y="560" width={1056 * fuse} height="16" rx="8" fill={colors.POSITIVE} opacity={0.55 + 0.3 * Math.sin(pulse * Math.PI * 16) ** 2} />
        </g>
      </g>

      <g opacity={routes * routeFade}>
        <rect x="92" y="126" width="310" height="414" rx="34" fill="#102139" stroke={colors.ACCENT} strokeWidth="2.5" />
        <rect x="486" y="170" width="308" height="326" rx="34" fill="#211a36" stroke={colors.SECONDARY} strokeWidth="2.5" />
        <rect x="878" y="126" width="310" height="414" rx="34" fill="#2b2112" stroke={colors.WARM} strokeWidth="2.5" />
        <text x="247" y="160" textAnchor="middle" fill={colors.ACCENT} fontSize="14" fontFamily={colors.font.mono}>Token Encoder · 16</text>
        <text x="640" y="204" textAnchor="middle" fill={colors.SECONDARY} fontSize="14" fontFamily={colors.font.mono}>Concept Module · 8</text>
        <text x="1033" y="160" textAnchor="middle" fill={colors.WARM} fontSize="14" fontFamily={colors.font.mono}>Token Decoder · 16</text>
        {Array.from({ length: 8 }, (_, i) => <g key={i}>
          <rect x="142" y={192 + i * 38} width="210" height="20" rx="10" fill={colors.ACCENT} opacity={0.12 + 0.07 * i} />
          <rect x="536" y={236 + i * 29} width="208" height="18" rx="9" fill={colors.SECONDARY} opacity={0.14 + 0.07 * i} />
          <rect x="928" y={192 + i * 38} width="210" height="20" rx="10" fill={colors.WARM} opacity={0.12 + 0.07 * i} />
        </g>)}
        {[0, 1, 2, 3].map((i) => <Vec key={`irc${i}`} x1={155} y1={230 + i * 62} x2={340} y2={264 + i * 62} color={colors.ACCENT} grow={clamp01(routes * 7 - i)} opacity={0.62} />)}
        <Vec x1={352} y1={286} x2={536} y2={316} color={colors.SECONDARY} grow={clamp01(routes * 3 - 1)} label="CRC" labelSize={12} />
        <Vec x1={352} y1={410} x2={928} y2={442} color={colors.POSITIVE} grow={clamp01(routes * 3 - 1.5)} label="CRC" labelSize={12} />
        <Vec x1={744} y1={330} x2={928} y2={318} color={colors.WARM} grow={clamp01(routes * 3 - 2)} label="CRC" labelSize={12} />
        <text x="640" y="552" textAnchor="middle" fill={colors.MUTED} fontSize="12">dynamic dense connections choose useful depths</text>
      </g>

      <g opacity={clamp01(losses) * lossFade}>
        <rect x="160" y="142" width="960" height="392" rx="42" fill="#101827" stroke={colors.GRID} strokeWidth="2.5" />
        <text x="640" y="195" textAnchor="middle" fill={colors.TEXT} fontSize="28" fontWeight="820">three losses · one end-to-end update</text>
        {[
          { x: 318, label: 'L NTP', sub: 'next token', color: colors.ACCENT },
          { x: 640, label: 'L NCP', sub: 'next concept', color: colors.SECONDARY },
          { x: 962, label: 'L VQ', sub: 'fit codebooks', color: colors.WARM },
        ].map((item, i) => <g key={item.label} opacity={clamp01(losses * 4 - i)}>
          <circle cx={item.x} cy="330" r="82" fill="#111c2c" stroke={item.color} strokeWidth="4" />
          <text x={item.x} y="323" textAnchor="middle" fill={item.color} fontSize="21" fontFamily={colors.font.mono}>{item.label}</text>
          <text x={item.x} y="352" textAnchor="middle" fill={colors.MUTED} fontSize="13">{item.sub}</text>
          <Vec x1={item.x} y1={416} x2={640} y2={482} color={item.color} grow={clamp01(losses * 2 - 0.8)} opacity={0.72} />
        </g>)}
        <MathLabel tex={'L_{total}=L_{NTP}+\\alpha L_{NCP}+\\beta L_{VQ}'} x={640} y={498} fontSize={25} opacity={clamp01(losses - 0.8)} />
      </g>

      <g opacity={causal}>
        <rect x="98" y="216" width="1084" height="220" rx="36" fill="#12291f" stroke={colors.POSITIVE} strokeWidth="3" />
        {Array.from({ length: 12 }, (_, i) => {
          const u = clamp01(causal * 14 - i);
          return <g key={i} transform={`translate(${164 + i * 86} 326)`} opacity={u}>
            <circle r="27" fill="#101827" stroke={i % 4 === 0 ? colors.WARM : colors.POSITIVE} strokeWidth="3" />
            <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="12" fontFamily={colors.font.mono}>{`x̂${i + 2}`}</text>
            {i < 11 && <path d="M30 0 H58" stroke={colors.POSITIVE} strokeWidth="3" />}
          </g>;
        })}
        <text x="640" y="405" textAnchor="middle" fill={colors.POSITIVE} fontSize="15">canonical autoregressive token output remains intact</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="190" y="126" width="900" height="430" rx="52" fill={colors.BG} stroke={colors.WARM} strokeWidth="4" />
      <text x="640" y="220" textAnchor="middle" fill={colors.TEXT} fontSize="46" fontWeight="850">one chunk behind</text>
      {['predict', 'repeat ×4', 'shift by 4', 'fuse'].map((label, i) => <g key={label} transform={`translate(${300 + i * 226} 380)`}>
        <circle r="48" fill="#101827" stroke={GROUP_COLORS[i]} strokeWidth="4" />
        <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="13">{label}</text>
      </g>)}
      <text x="640" y="492" textAnchor="middle" fill={colors.POSITIVE} fontSize="17">the delay preserves causality</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
