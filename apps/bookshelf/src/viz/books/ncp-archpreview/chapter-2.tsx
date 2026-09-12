// Grounding: arXiv:2609.10715 Sections 2.2–2.3 and 4.1;
// official source files src/ncp_olmo_eval/vllm_plugin/hlm.py and
// src/ncp_olmo_eval/vllm_plugin/contract.py.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { MatrixGrid } from '../../primitives';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const PALETTE = [colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE];
const GRID = Array.from({ length: 8 }, (_, i) =>
  Array.from({ length: 8 }, (_, j) => clamp01(0.10 + (((i * 17 + j * 29 + i * j * 3) % 89) / 100))),
);
const PICKS = [2, 6, 1, 4, 7, 3, 5, 0];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const vectorU = tl.channel('continuous concept', 0);
  const driftU = tl.channel('unconstrained drift', 0);
  const splitU = tl.channel('thirty-two segments', 0);
  const gridU = tl.channel('codebook matrix', 0);
  const pickP = tl.channel('nearest entries', 0);
  const productU = tl.channel('product concept', 0);
  const capacityU = tl.channel('product capacity', 0);
  const probabilityU = tl.channel('prediction distributions', 0);
  const blendU = tl.channel('weighted codewords', 0);
  const identityU = tl.channel('implementation identity', 0);
  const closeU = tl.channel('closing vocabulary', 0);

  tl.caption({ at: 0.4, dur: 5.5, text: 'A continuous concept can drift almost anywhere in its representation space. That makes the next target hard to define.' });
  tl.tween(vectorU, 1, { at: 0.8, dur: 1.2, ease: ease.enter });
  tl.tween(driftU, 1, { at: 2.1, dur: 2.8, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 170, k: 1.10 }, { at: 2.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 6.4, dur: 5.5, text: 'The concept model gives that space a vocabulary by splitting every four-thousand-ninety-six-dimensional concept into equal pieces.' });
  tl.tween(cam, CAMERA_HOME, { at: 8.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.4, dur: 5.5, text: 'There are thirty-two segments, each one hundred twenty-eight dimensions wide.' });
  tl.tween(splitU, 1, { at: 12.9, dur: 2.0, ease: ease.move });

  tl.caption({ at: 18.4, dur: 5.5, text: 'Each segment gets its own codebook with one hundred twenty-eight learned entries.' });
  tl.tween(gridU, 1, { at: 18.9, dur: 2.2, ease: ease.enter });
  tl.tween(cam, { x: 380, y: 360, k: 1.08 }, { at: 19.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 24.4, dur: 5.5, text: 'During quantization, every segment finds its nearest codeword. The selected pieces light up row by row.' });
  tl.tween(pickP, 8, { at: 24.9, dur: 4.0, ease: ease.linear });

  tl.caption({ at: 30.4, dur: 5.5, text: 'Concatenate those selections and the full concept snaps onto a structured product vocabulary.' });
  tl.tween(productU, 1, { at: 30.9, dur: 1.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 32.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 36.4, dur: 5.5, text: 'Thirty-two small choices create an enormous joint space, without storing one impossible monolithic table.' });
  tl.tween(capacityU, 1, { at: 36.9, dur: 1.1, ease: ease.pop });

  tl.caption({ at: 42.4, dur: 5.5, text: 'Prediction does not take a hard winner. One linear head produces a probability distribution for each codebook.' });
  tl.tween(probabilityU, 1, { at: 42.9, dur: 2.0, ease: ease.enter });
  tl.tween(cam, { x: 800, y: 360, k: 1.08 }, { at: 43.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 48.4, dur: 5.5, text: 'The code combines entries by those weights, keeping the prediction differentiable while holding it inside the learned vocabulary.' });
  tl.tween(blendU, 1, { at: 49.0, dur: 2.2, ease: ease.move });

  tl.caption({ at: 54.4, dur: 5.5, text: 'In the released backend, product codebooks and their prediction heads are explicit model components, not a diagrammatic metaphor.' });
  tl.tween(identityU, 1, { at: 55.0, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 56.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 60.4, dur: 5.8, text: 'The second invariant is structure: split, select, concatenate, and blend. A concept becomes a predictable vocabulary item.' });
  tl.tween(closeU, 1, { at: 61.0, dur: 1.3, ease: ease.move });
  tl.hold(66.3, 1.0);

  return { tl, cam, vectorU, driftU, splitU, gridU, pickP, productU, capacityU, probabilityU, blendU, identityU, closeU };
}

const scene = buildScene();

function SegmentBar({ y, u, product = false }: { y: number; u: number; product?: boolean }) {
  return <g opacity={u}>
    {Array.from({ length: 32 }, (_, i) => {
      const x = 124 + i * 32.3;
      const gap = 4 + 5 * u;
      const dx = (i - 15.5) * gap * 0.10;
      return <rect key={i} x={x + dx} y={y} width="27" height="38" rx="7" fill={PALETTE[i % 4]} opacity={product ? 0.78 : 0.28 + 0.45 * clamp01(u * 32 - i)} stroke={product ? colors.TEXT : PALETTE[i % 4]} strokeWidth={product ? 1.5 : 0.8} />;
    })}
    <text x="640" y={y - 12} textAnchor="middle" fill={product ? colors.POSITIVE : colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>{product ? 'concat(d₁ … d₃₂)' : 'c ∈ R⁴⁰⁹⁶ → 32 segments × 128 dimensions'}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const vector = s.get(scene.vectorU);
  const drift = s.get(scene.driftU);
  const split = s.get(scene.splitU);
  const grid = s.get(scene.gridU);
  const pick = s.get(scene.pickP);
  const product = s.get(scene.productU);
  const probabilities = s.get(scene.probabilityU);
  const blend = s.get(scene.blendU);

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="62" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">a vocabulary of products</text>
      <g opacity={vector * (1 - grid * 0.75)}>
        <SegmentBar y={112} u={split} />
        {split < 0.98 && <g opacity={1 - split}>
          <rect x="150" y="122" width="980" height="28" rx="14" fill="#18243a" stroke={colors.ACCENT} strokeWidth="2" />
          <circle cx={190 + 900 * drift} cy={136 - Math.sin(drift * Math.PI * 5) * 24} r="13" fill={colors.ACCENT} />
          <text x="640" y="182" textAnchor="middle" fill={colors.MUTED} fontSize="13">an unconstrained continuous target can drift</text>
        </g>}
      </g>

      <g opacity={grid}>
        <text x="330" y="194" textAnchor="middle" fill={colors.MUTED} fontSize="12">representative window · 32 codebooks × 128 entries</text>
        <MatrixGrid
          x={188}
          y={218}
          values={GRID}
          cell={31}
          gap={5}
          opacity={1 - product * 0.7}
          cellU={(i, j) => clamp01(grid * 64 - (i * 8 + j))}
          fill={(_, i, j) => PICKS[i] === j && pick > i ? PALETTE[i % 4] : '#162237'}
        />
        {PICKS.map((col, i) => {
          const u = clamp01(pick - i);
          const x = 188 + col * 36 + 15.5;
          const y = 218 + i * 36 + 15.5;
          return <g key={i} opacity={u * (1 - product * 0.5)}>
            <circle cx={x} cy={y} r={18 + 3 * u} fill="none" stroke={colors.WARM} strokeWidth="3" />
            <path d={`M ${x + 22} ${y} C ${x + 72} ${y}, ${650} ${238 + i * 34}, ${696} ${238 + i * 34}`} fill="none" stroke={PALETTE[i % 4]} strokeWidth="2" opacity="0.55" />
          </g>;
        })}
      </g>

      <g opacity={product}>
        <rect x="676" y="206" width="504" height="322" rx="30" fill="#101827" stroke={colors.POSITIVE} strokeWidth="2.5" />
        <text x="928" y="242" textAnchor="middle" fill={colors.POSITIVE} fontSize="14">selected segments concatenate</text>
        {Array.from({ length: 8 }, (_, i) => <rect key={i} x={728 + i * 50} y={278 + (1 - product) * 70} width="40" height="86" rx="10" fill={PALETTE[i % 4]} opacity={0.35 + 0.55 * clamp01(product * 8 - i)} />)}
        <text x="928" y="395" textAnchor="middle" fill={colors.MUTED} fontSize="12">8 shown · 32 in the released configuration</text>
        <g opacity={s.get(scene.capacityU)}>
          <MathLabel tex={'128^{32}'} x={928} y={454} fontSize={34} opacity={1} />
          <text x="928" y="492" textAnchor="middle" fill={colors.WARM} fontSize="12">possible product combinations</text>
        </g>
      </g>

      <g opacity={probabilities}>
        <rect x="92" y="214" width="468" height="330" rx="30" fill="#11172a" stroke={colors.SECONDARY} strokeWidth="2.5" />
        <text x="326" y="250" textAnchor="middle" fill={colors.SECONDARY} fontSize="14" fontFamily={colors.font.mono}>32 × PredictionHead</text>
        {Array.from({ length: 6 }, (_, i) => {
          const weights = [0.14, 0.31, 0.72, 0.46, 0.22];
          return <g key={i} transform={`translate(145 ${292 + i * 38})`} opacity={clamp01(probabilities * 7 - i)}>
            <text x="-18" y="5" textAnchor="end" fill={PALETTE[i % 4]} fontSize="11">{`π${i + 1}`}</text>
            {weights.map((w, j) => <rect key={j} x={j * 66} y="-9" width={54 * w} height="18" rx="6" fill={j === 2 ? PALETTE[i % 4] : colors.MUTED} opacity={0.35 + 0.55 * w} />)}
          </g>;
        })}
      </g>

      <g opacity={blend}>
        <path d="M570 377 C650 377 660 377 720 377" fill="none" stroke={colors.WARM} strokeWidth="5" />
        <polygon points="720,377 700,365 700,389" fill={colors.WARM} />
        <rect x="740" y="302" width="430" height="150" rx="30" fill="#12291f" stroke={colors.POSITIVE} strokeWidth="3" />
        <text x="955" y="350" textAnchor="middle" fill={colors.POSITIVE} fontSize="17">weighted codeword expectation</text>
        <MathLabel tex={'\\hat c^{s}=\\sum_n \\pi^{s}_{n}e^{s}_{n}'} x={955} y={402} fontSize={25} opacity={1} />
      </g>

      <g opacity={s.get(scene.identityU)}>
        <rect x="262" y="555" width="756" height="48" rx="16" fill="#151f31" stroke={colors.ACCENT} />
        <text x="640" y="576" textAnchor="middle" fill={colors.ACCENT} fontSize="12" fontFamily={colors.font.mono}>ConceptLMProductCodebook · ModuleList[Linear(hidden_size, codebook_size)]</text>
        <text x="640" y="594" textAnchor="middle" fill={colors.MUTED} fontSize="10">src/ncp_olmo_eval/vllm_plugin/hlm.py</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="190" y="126" width="900" height="430" rx="52" fill={colors.BG} stroke={colors.SECONDARY} strokeWidth="4" />
      <text x="640" y="220" textAnchor="middle" fill={colors.TEXT} fontSize="44" fontWeight="850">structure makes concepts predictable</text>
      {['split', 'select', 'concatenate', 'blend'].map((label, i) => <g key={label} transform={`translate(${310 + i * 220} 376)`}>
        <circle r="50" fill="#101827" stroke={PALETTE[i]} strokeWidth="4" />
        <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="13">{label}</text>
      </g>)}
      <MathLabel tex={'\\mathbb{R}^{4096}\\to 32\\times 128\\to \\hat c'} x={640} y={492} fontSize={24} opacity={1} />
    </g>
  </Camera>;
}

export const vizScene = () => scene;
