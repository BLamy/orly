// Grounding: arXiv:2609.17488 Section 2.3; official source
// model/v2_0/transformer.py, model/v2_0/layer.py, and
// model/v2_0/decoupled_structural_task_attention.py.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const R = 6;
const C = 6;
const GX = 270;
const GY = 170;
const DX = 116;
const DY = 68;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const gridU = tl.channel('cell token grid', 0);
  const sampleSweep = tl.channel('sample axis sweep', 0);
  const queryGate = tl.channel('query context gate', 0);
  const featureSweep = tl.channel('feature axis sweep', 0);
  const slotsU = tl.channel('four task slots', 0);
  const asymU = tl.channel('asymmetric task readout', 0);
  const ffnU = tl.channel('separate X Y SwiGLU', 0);
  const depthU = tl.channel('twenty four layers', 0);
  const closeU = tl.channel('dual axis payoff', 0);

  tl.caption({ at: 0.4, dur: 5.5, text: 'Once every cell has a token, the model must learn two different neighborhoods: other samples and other variables.' });
  tl.tween(gridU, 1, { at: 0.8, dur: 2.0, ease: ease.draw });

  tl.caption({ at: 6.4, dur: 5.5, text: 'Sample-axis attention moves down each feature, letting query rows borrow the distribution encoded by context rows.' });
  tl.tween(sampleSweep, 1, { at: 7.0, dur: 2.6, ease: ease.linear });
  tl.tween(cam, { x: 500, y: 360, k: 1.12 }, { at: 7.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.4, dur: 5.5, text: 'The gate is deliberate: context sees context, while each query can attend only upward into context, never sideways into another query.' });
  tl.tween(queryGate, 1, { at: 13.0, dur: 1.5, ease: ease.enter });

  tl.caption({ at: 18.4, dur: 5.5, text: 'Feature-axis attention then moves across a row, comparing variables without losing the sample that holds them.' });
  tl.tween(featureSweep, 1, { at: 19.0, dur: 2.6, ease: ease.linear });
  tl.tween(cam, { x: 600, y: 330, k: 1.08 }, { at: 19.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 24.4, dur: 5.5, text: 'The target is not one overloaded token. Version two splits it into four task slots, then flattens them only where the task path needs a joint readout.' });
  tl.tween(slotsU, 1, { at: 25.0, dur: 1.6, ease: ease.pop });
  tl.tween(cam, { x: 1010, y: 350, k: 1.28 }, { at: 25.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 30.4, dur: 5.5, text: 'Asymmetric feature attention gives the task slots keys and values from features. The task reads structure without becoming another ordinary column.' });
  tl.tween(asymU, 1, { at: 31.0, dur: 2.0, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 29.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 36.4, dur: 5.5, text: 'Features and targets also receive separate gated feed-forward networks, so capacity can grow along the task pathway instead of widening everything equally.' });
  tl.tween(ffnU, 1, { at: 37.0, dur: 1.5, ease: ease.enter });

  tl.caption({ at: 42.4, dur: 5.5, text: 'This sequence repeats through twenty-four dual-axis blocks, with normalized queries and keys keeping attention stable as context length changes.' });
  tl.tween(depthU, 1, { at: 43.0, dur: 2.3, ease: ease.enter });

  tl.caption({ at: 48.4, dur: 5.8, text: 'Rows supply evidence. Columns expose mechanisms. Four task slots collect the answer without erasing the table that produced it.' });
  tl.tween(closeU, 1, { at: 49.0, dur: 1.4, ease: ease.move });
  tl.hold(54.2, 1.0);
  return { tl, cam, gridU, sampleSweep, queryGate, featureSweep, slotsU, asymU, ffnU, depthU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const grid = s.get(scene.gridU);
  const sample = s.get(scene.sampleSweep);
  const feature = s.get(scene.featureSweep);
  const gate = s.get(scene.queryGate);
  const slots = s.get(scene.slotsU);
  const depth = s.get(scene.depthU);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="70" textAnchor="middle" fill={colors.TEXT} fontSize="35" fontWeight="850">the dual-axis loom</text>
      <text x="128" y="246" fill={colors.ACCENT} fontSize="13" fontWeight="800">CONTEXT</text>
      <text x="128" y="486" fill={colors.WARM} fontSize="13" fontWeight="800">QUERY</text>
      <line x1="172" y1="416" x2="1020" y2="416" stroke={gate ? colors.WARM : colors.GRID} strokeWidth={2 + gate * 2} strokeDasharray="10 8" opacity={grid} />
      {Array.from({ length: R * C }, (_, i) => {
        const r = Math.floor(i / C), c = i % C;
        const x = GX + c * DX, y = GY + r * DY;
        const u = clamp01(grid * R * C - i);
        const query = r >= 4;
        const sampleGlow = Math.max(0, 1 - Math.abs(sample * (R + 1) - (r + 0.5)));
        const featGlow = Math.max(0, 1 - Math.abs(feature * (C + 1) - (c + 0.5)));
        const glow = Math.max(sampleGlow, featGlow);
        return <g key={i} opacity={u}>
          <rect x={x - 38} y={y - 22} width="76" height="44" rx="12" fill={query ? '#2b2513' : '#101827'} stroke={glow > 0.1 ? colors.POSITIVE : query ? colors.WARM : colors.ACCENT} strokeWidth={1.5 + glow * 4} />
          <text x={x} y={y + 5} textAnchor="middle" fill={query ? colors.WARM : colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>{`x${r + 1},${c + 1}`}</text>
        </g>;
      })}
      {gate > 0 && [0, 1, 2].map((i) => <path key={i} d={`M${GX + i * 2 * DX} 493 C${GX + i * 2 * DX + 40} 420 ${GX + i * 2 * DX + 20} 340 ${GX + i * 2 * DX} 315`} fill="none" stroke={colors.WARM} strokeWidth="3" markerEnd="url(#none)" opacity={gate} />)}
      <g opacity={slots}>
        <text x="1058" y="172" textAnchor="middle" fill={colors.SECONDARY} fontSize="13" fontFamily={colors.font.mono}>K = 4 task slots</text>
        {[0, 1, 2, 3].map((i) => <rect key={i} x={1007} y={205 + i * 70} width="102" height="48" rx="14" fill="#18172d" stroke={colors.SECONDARY} strokeWidth="3" opacity={clamp01(slots * 5 - i)} />)}
        <text x="1058" y="510" textAnchor="middle" fill={colors.MUTED} fontSize="11">flatten → Kd</text>
      </g>
      <g opacity={s.get(scene.asymU)}>
        {[1, 2, 3, 4].map((r) => <path key={r} d={`M${GX + 5 * DX + 40} ${GY + r * DY} C930 ${GY + r * DY} 940 ${280 + (r - 1) * 34} 1004 ${280 + (r - 1) * 34}`} fill="none" stroke={colors.POSITIVE} strokeWidth="2.5" />)}
        <text x="935" y="540" textAnchor="middle" fill={colors.POSITIVE} fontSize="12">features → task readout</text>
      </g>
      <g opacity={s.get(scene.ffnU)}>
        <rect x="246" y="575" width="310" height="42" rx="15" fill="#10261f" stroke={colors.POSITIVE} strokeWidth="2" />
        <text x="401" y="601" textAnchor="middle" fill={colors.POSITIVE} fontSize="12" fontFamily={colors.font.mono}>SeparateXYFFN · X SwiGLU</text>
        <rect x="704" y="575" width="310" height="42" rx="15" fill="#211b32" stroke={colors.SECONDARY} strokeWidth="2" />
        <text x="859" y="601" textAnchor="middle" fill={colors.SECONDARY} fontSize="12" fontFamily={colors.font.mono}>SeparateXYFFN · Y SwiGLU</text>
      </g>
      <g opacity={depth}>
        {Array.from({ length: 8 }, (_, i) => <rect key={i} x={210 + i * 8} y={110 - i * 5} width="760" height="470" rx="28" fill="none" stroke={colors.ACCENT} strokeWidth="1.5" opacity={0.12 + i * 0.06} />)}
        <text x="238" y="104" fill={colors.ACCENT} fontSize="14" fontWeight="800">24 × transformer blocks</text>
      </g>
    </g>
    <g opacity={close}>
      <rect x="174" y="120" width="932" height="444" rx="58" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="212" textAnchor="middle" fill={colors.TEXT} fontSize="48" fontWeight="880">rows teach · columns explain</text>
      {['sample axis', 'feature axis', 'four task slots'].map((label, i) => <g key={label} transform={`translate(${340 + i * 300} 370)`}>
        <rect x="-108" y="-64" width="216" height="128" rx="30" fill="#101827" stroke={[colors.ACCENT, colors.POSITIVE, colors.SECONDARY][i]} strokeWidth="4" />
        <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="15">{label}</text>
      </g>)}
      <text x="640" y="506" textAnchor="middle" fill={colors.MUTED} fontSize="16">context becomes a prior for the current table</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
