// Skip the Giant Model — chapter 2: Make the Tokens Look at Each Other.
//
// Grounded in arXiv:2607.27205 Sections 4.1–4.2, Figure 3 and Table 5;
// turbovla/models/components/fusion.py BiMultiHeadAttention/BiAttentionBlock;
// turbovla/models/turbovla.py GroundingDINOFeatureEnhancer.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { MatrixGrid } from '../../primitives';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const WORDS = ['stack', 'the', 'three', 'bowls', '.', 'pad'];
const HEAT = Array.from({ length: 8 }, (_, i) => Array.from({ length: 6 }, (_, j) => {
  const target = j === 3 ? Math.exp(-Math.pow(i - 4.5, 2) / 3) : 0.08 + ((i * 3 + j * 5) % 7) * 0.025;
  return Math.min(1, target + (j === 0 ? 0.18 : 0));
}));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const visionU = tl.channel('visionU', 0);
  const textU = tl.channel('textU', 0);
  const matrixU = tl.channel('matrixU', 0);
  const l2vU = tl.channel('l2vU', 0);
  const v2lU = tl.channel('v2lU', 0);
  const residualU = tl.channel('residualU', 0);
  const layerP = tl.channel('layerP', 0);
  const ablationU = tl.channel('ablationU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.7, text: 'Two camera views become spatial patch tokens, and a learned view embedding keeps their evidence from blending into one anonymous image.' });
  tl.tween(visionU, 1, { at: 0.9, dur: 1.7, ease: ease.enter });
  tl.hold(6.2, 0.6);

  tl.caption({ at: 6.8, dur: 5.7, text: 'The instruction stays as a complete sequence of text tokens, preserving objects, attributes, and spatial relations for the control task.' });
  tl.tween(textU, 1, { at: 7.3, dur: 1.5, ease: ease.enter });
  tl.hold(12.5, 0.6);

  tl.caption({ at: 13.1, dur: 5.8, text: 'First, instruction tokens query the visual field. The word for bowls pulls weight toward patches that can explain that part of the command.' });
  tl.tween(matrixU, 1, { at: 13.5, dur: 1.3, ease: ease.draw });
  tl.tween(l2vU, 1, { at: 14.0, dur: 2.5, ease: ease.linear });
  tl.tween(cam, { x: 615, y: 350, k: 1.13 }, { at: 14.2, dur: 1.3, ease: ease.move });
  tl.hold(18.9, 0.6);

  tl.caption({ at: 19.5, dur: 5.7, text: 'Then the current reverses. Visual tokens query the instruction, so the words become specific to the scene in front of the robot.' });
  tl.tween(v2lU, 1, { at: 20.0, dur: 2.5, ease: ease.linear });
  tl.hold(25.2, 0.6);

  tl.caption({ at: 25.8, dur: 5.6, text: 'The code adds both attention updates back through residual paths, changing each stream without erasing where it came from.' });
  tl.tween(residualU, 1, { at: 26.3, dur: 1.3, ease: ease.pop });
  tl.tween(cam, CAMERA_HOME, { at: 27.0, dur: 1.3, ease: ease.move });
  tl.hold(31.4, 0.6);

  tl.caption({ at: 32.0, dur: 5.7, text: 'That two-way exchange repeats through six fusion layers, each followed by a text feed-forward update.' });
  tl.tween(layerP, 6, { at: 32.5, dur: 4.0, ease: ease.linear });
  tl.tween(cam, { x: 995, y: 340, k: 1.18 }, { at: 33.0, dur: 1.3, ease: ease.move });
  tl.hold(37.7, 0.6);

  tl.caption({ at: 38.3, dur: 6.0, text: 'The ablation matters: concatenation reaches ninety five point two percent, one-way attention reaches ninety six point one and ninety six point five.' });
  tl.tween(ablationU, 1, { at: 38.8, dur: 1.5, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 39.2, dur: 1.3, ease: ease.move });
  tl.hold(44.3, 0.6);

  tl.caption({ at: 44.9, dur: 6.2, text: 'Bidirectional interaction reaches ninety seven point seven percent, leaving vision instruction-conditioned and language scene-aware.' });
  tl.tween(dimU, 1, { at: 45.4, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 46.1, dur: 0.7, ease: ease.enter });
  tl.hold(51.1, 1.0);

  return { tl, cam, visionU, textU, matrixU, l2vU, v2lU, residualU, layerP, ablationU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const visionU = s.get(scene.visionU);
  const textU = s.get(scene.textU);
  const l2vU = s.get(scene.l2vU);
  const v2lU = s.get(scene.v2lU);
  const layerP = s.get(scene.layerP);
  const ablationU = s.get(scene.ablationU);
  const mainOpacity = 1 - 0.9 * s.get(scene.dimU);

  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <g opacity={mainOpacity}>
      <text x={640} y={50} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={760}>Make the tokens look at each other</text>
      <text x={640} y={76} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>BiAttentionBlock · 6 stacked fusion layers</text>
    </g>
    <Camera {...s.get(scene.cam)}>
      <g opacity={mainOpacity}>
        <g transform="translate(128 132)" opacity={visionU}>
          {[0, 1].map((view) => <g key={view} transform={`translate(${view * 198} 0)`}>
            <text x={72} y={-14} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>view_embed[{view}]</text>
            {Array.from({ length: 16 }, (_, i) => {
              const x = (i % 4) * 35; const y = Math.floor(i / 4) * 35;
              const hot = view === 0 ? [5, 6, 9, 10].includes(i) : [6, 7, 10, 11].includes(i);
              return <rect key={i} x={x} y={y} width={29} height={29} rx={5} fill={hot ? colors.ACCENT : colors.PANEL} opacity={clamp01(visionU * 20 - i) * (hot ? 0.9 : 0.72)} stroke={colors.ACCENT} strokeWidth={1} />;
            })}
          </g>)}
          <text x={168} y={164} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>visual_tokens = cat([feat_img1, feat_img2])</text>
        </g>

        <g transform="translate(150 448)" opacity={textU}>
          {WORDS.map((word, i) => <g key={word + i} transform={`translate(${i * 82} 0)`} opacity={clamp01(textU * WORDS.length - i)}>
            <rect width={72} height={42} rx={10} fill={i === 3 ? colors.WARM : colors.PANEL} stroke={colors.WARM} />
            <text x={36} y={26} textAnchor="middle" fill={i === 3 ? colors.BG : colors.TEXT} fontSize={12} fontFamily={MONO}>{word}</text>
          </g>)}
          <text x={205} y={69} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily={MONO}>cached_text.last_hidden_state</text>
        </g>

        {s.get(scene.matrixU) > 0 && <g opacity={s.get(scene.matrixU)}>
          <MatrixGrid x={610} y={182} values={HEAT} cell={24} gap={3} cellU={(i, j) => clamp01(s.get(scene.matrixU) * 48 - (i * 6 + j))} highlight={{ cell: [4, 3], color: colors.WARM, u: s.get(scene.residualU) }} />
          <text x={676} y={164} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>attention weights · nimg × ntxt</text>
        </g>}

        {l2vU > 0 && <g opacity={l2vU}>
          <path d="M435 470 C560 470 520 332 620 332" fill="none" stroke={colors.WARM} strokeWidth={3} />
          <circle cx={435 + l2vU * 185} cy={470 - Math.sin(l2vU * Math.PI / 2) * 138} r={8} fill={colors.WARM} />
          <text x={535} y={408} fill={colors.WARM} fontSize={11} fontFamily={MONO}>instruction → visual</text>
        </g>}
        {v2lU > 0 && <g opacity={v2lU}>
          <path d="M610 286 C520 330 565 438 420 448" fill="none" stroke={colors.ACCENT} strokeWidth={3} />
          <circle cx={610 - v2lU * 190} cy={286 + v2lU * 162} r={8} fill={colors.ACCENT} />
          <text x={500} y={350} fill={colors.ACCENT} fontSize={11} fontFamily={MONO}>visual → instruction</text>
        </g>}

        <g transform="translate(928 120)">
          {Array.from({ length: 6 }, (_, i) => {
            const u = clamp01(layerP - i);
            return <g key={i} transform={`translate(0 ${i * 64})`} opacity={0.16 + 0.84 * u}>
              <rect width={220} height={48} rx={12} fill={colors.PANEL} stroke={u > 0.5 ? colors.POSITIVE : colors.GRID} strokeWidth={u > 0.5 ? 2 : 1} />
              <text x={20} y={29} fill={u > 0.5 ? colors.POSITIVE : colors.MUTED} fontSize={12} fontFamily={MONO}>fusion layer {i + 1}</text>
              <circle cx={190} cy={24} r={7} fill={u > 0.5 ? colors.POSITIVE : colors.GRID} />
            </g>;
          })}
        </g>

        {ablationU > 0 && <g transform="translate(170 552)" opacity={ablationU}>
          {[['concat', 95.2, colors.MUTED], ['L→V', 96.1, colors.ACCENT], ['V→L', 96.5, colors.WARM], ['both', 97.7, colors.POSITIVE]].map(([label, value, color], i) => {
            const v = Number(value); const h = (v - 94) * 23;
            return <g key={String(label)} transform={`translate(${i * 160} 0)`}>
              <rect x={0} y={-h} width={92} height={h} rx={7} fill={String(color)} opacity={0.78} />
              <text x={46} y={-h - 9} textAnchor="middle" fill={String(color)} fontSize={15} fontWeight={760}>{v.toFixed(1)}</text>
              <text x={46} y={22} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>{String(label)}</text>
            </g>;
          })}
        </g>}
      </g>
    </Camera>
    {s.get(scene.endU) > 0 && <g opacity={s.get(scene.endU)}>
      <rect x={190} y={232} width={900} height={202} rx={24} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={2.5} />
      <text x={640} y={294} textAnchor="middle" fill={colors.TEXT} fontSize={32} fontWeight={800}>Two streams, both changed</text>
      <text x={640} y={342} textAnchor="middle" fill={colors.ACCENT} fontSize={18}>instruction-conditioned visual features</text>
      <text x={640} y={376} textAnchor="middle" fill={colors.WARM} fontSize={18}>vision-aware instruction features</text>
      <text x={640} y={408} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>97.7% average LIBERO success</text>
    </g>}
  </>;
}

export const vizScene = () => scene;
