// Grounding: arXiv:2609.17488 Section 2.4 and Conclusion; official source
// README.md, inference/v2_0/predictor.py, and config/*_v2.json.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const PIPELINES = Array.from({ length: 32 }, (_, i) => ({ x: 182 + (i % 8) * 78, y: 238 + Math.floor(i / 8) * 45 }));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const inputU = tl.channel('support and query input', 0);
  const routeU = tl.channel('public predictor route', 0);
  const pipeU = tl.channel('configured preprocessing ensemble', 0);
  const flowU = tl.channel('pipeline flow', 0);
  const modelU = tl.channel('LimiX checkpoint', 0);
  const headsU = tl.channel('three task heads', 0);
  const regU = tl.channel('five thousand regression bins', 0);
  const outputU = tl.channel('public outputs', 0);
  const recapU = tl.channel('masked cell recap', 0);
  const closeU = tl.channel('one model payoff', 0);

  tl.caption({ at: 0.4, dur: 5.5, text: 'The public interface begins with support features, support targets, and aligned query features. The task name chooses the route.' });
  tl.tween(inputU, 1, { at: 0.8, dur: 1.7, ease: ease.enter });
  tl.tween(routeU, 1, { at: 2.0, dur: 1.3, ease: ease.draw });

  tl.caption({ at: 6.4, dur: 5.5, text: 'Before the checkpoint sees a table, configured ensemble members rebalance distributions, encode categories, and shuffle feature order.' });
  tl.tween(pipeU, 1, { at: 7.0, dur: 2.8, ease: ease.enter });
  tl.tween(cam, { x: 500, y: 350, k: 1.1 }, { at: 7.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 12.4, dur: 5.5, text: 'The default version-two classification configuration contains thirty-two such pipelines. Regression and imputation each configure eight.' });
  tl.tween(flowU, 1, { at: 13.0, dur: 3.0, ease: ease.linear });

  tl.caption({ at: 18.4, dur: 5.5, text: 'Their transformed tables reunite at the same version-two checkpoint, where context rows and query rows enter the dual-axis backbone.' });
  tl.tween(modelU, 1, { at: 19.0, dur: 1.5, ease: ease.pop });
  tl.tween(cam, { x: 804, y: 350, k: 1.15 }, { at: 19.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 24.4, dur: 5.5, text: 'Classification reads final-layer task slots and emits class logits. The predictor turns the ensemble into rows of probabilities that sum to one.' });
  tl.tween(headsU, 0.34, { at: 25.0, dur: 1.3, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 23.4, dur: 1.2, ease: ease.move });

  tl.caption({ at: 30.4, dur: 5.5, text: 'Regression does not emit one raw scalar. It predicts five thousand ordered-bin probabilities and returns their weighted center.' });
  tl.tween(headsU, 0.67, { at: 31.0, dur: 1.3, ease: ease.enter });
  tl.tween(regU, 1, { at: 31.4, dur: 2.0, ease: ease.draw });

  tl.caption({ at: 36.4, dur: 5.5, text: 'Missing-value imputation reads a shallow feature decoder, preserving the local detail needed to fill cells rather than summarize a target.' });
  tl.tween(headsU, 1, { at: 37.0, dur: 1.3, ease: ease.enter });
  tl.tween(outputU, 1, { at: 38.0, dur: 1.5, ease: ease.pop });

  tl.caption({ at: 42.4, dur: 5.5, text: 'The wrapper changes preprocessing and readout, but the pretrained mechanism model does not receive a task-specific parameter update.' });
  tl.tween(recapU, 0.35, { at: 43.0, dur: 1.0, ease: ease.enter });

  tl.caption({ at: 48.4, dur: 5.5, text: 'Our masked cell kept its identity, gathered evidence across both axes, and became one conditional answer from the table.' });
  tl.tween(recapU, 1, { at: 49.0, dur: 2.2, ease: ease.move });

  tl.caption({ at: 54.4, dur: 5.8, text: 'That is the contextual mechanism network: model the dependencies first, then let prediction, regression, or reconstruction choose what to ask.' });
  tl.tween(closeU, 1, { at: 55.0, dur: 1.4, ease: ease.move });
  tl.hold(60.2, 1.0);
  return { tl, cam, inputU, routeU, pipeU, flowU, modelU, headsU, regU, outputU, recapU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const pipe = s.get(scene.pipeU);
  const flow = s.get(scene.flowU);
  const model = s.get(scene.modelU);
  const heads = s.get(scene.headsU);
  const recap = s.get(scene.recapU);
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="66" textAnchor="middle" fill={colors.TEXT} fontSize="35" fontWeight="850">the public prediction route</text>
      <g opacity={s.get(scene.inputU)}>
        <rect x="78" y="144" width="270" height="80" rx="25" fill="#101827" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="213" y="176" textAnchor="middle" fill={colors.ACCENT} fontSize="13" fontFamily={colors.font.mono}>x_train · y_train</text>
        <text x="213" y="202" textAnchor="middle" fill={colors.MUTED} fontSize="12">support rows</text>
        <rect x="78" y="498" width="270" height="80" rx="25" fill="#2b2513" stroke={colors.WARM} strokeWidth="3" />
        <text x="213" y="530" textAnchor="middle" fill={colors.WARM} fontSize="13" fontFamily={colors.font.mono}>x_test</text>
        <text x="213" y="556" textAnchor="middle" fill={colors.MUTED} fontSize="12">aligned query rows</text>
      </g>
      <g opacity={s.get(scene.routeU)}>
        <rect x="74" y="298" width="280" height="90" rx="27" fill="#171d2c" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="214" y="332" textAnchor="middle" fill={colors.SECONDARY} fontSize="13" fontFamily={colors.font.mono}>LimiXPredictor.predict</text>
        <text x="214" y="360" textAnchor="middle" fill={colors.MUTED} fontSize="12">Classification · Regression · Feature_imputation</text>
      </g>
      <g opacity={pipe}>
        {PIPELINES.map((p, i) => {
          const u = clamp01(pipe * 36 - i);
          const active = flow * 32 >= i;
          return <rect key={i} x={p.x + 210} y={p.y - 74} width="62" height="30" rx="9" fill={active ? colors.ACCENT : '#101827'} stroke={active ? colors.POSITIVE : colors.GRID} strokeWidth="1.5" opacity={u * (active ? 0.9 : 0.45)} />;
        })}
        <text x="704" y="378" textAnchor="middle" fill={colors.MUTED} fontSize="11">32 classification ensemble members</text>
        <text x="704" y="400" textAnchor="middle" fill={colors.MUTED} fontSize="11">rebalance · encode categories · shuffle features</text>
      </g>
      <g opacity={model}>
        <circle cx="915" cy="322" r="104" fill="#112333" stroke={colors.POSITIVE} strokeWidth="4" />
        <text x="915" y="310" textAnchor="middle" fill={colors.POSITIVE} fontSize="20" fontWeight="850">LimiX-2</text>
        <text x="915" y="340" textAnchor="middle" fill={colors.MUTED} fontSize="12">400M checkpoint</text>
        <text x="915" y="362" textAnchor="middle" fill={colors.MUTED} fontSize="11">FeaturesTransformer</text>
      </g>
      <g opacity={clamp01(heads * 3)}>
        {[{ y: 166, c: colors.ACCENT, l: 'classification head' }, { y: 322, c: colors.SECONDARY, l: 'regression head' }, { y: 478, c: colors.POSITIVE, l: 'feature decoder' }].map((h, i) => <g key={h.l} opacity={clamp01(heads * 3 - i)}>
          <path d={`M1018 322 C1070 322 1050 ${h.y} 1090 ${h.y}`} fill="none" stroke={h.c} strokeWidth="3" />
          <rect x="1086" y={h.y - 36} width="164" height="72" rx="22" fill="#101827" stroke={h.c} strokeWidth="3" />
          <text x="1168" y={h.y + 5} textAnchor="middle" fill={h.c} fontSize="12">{h.l}</text>
        </g>)}
      </g>
      <g opacity={s.get(scene.regU)}>
        {Array.from({ length: 25 }, (_, i) => <rect key={i} x={1088 + i * 6} y={392 - Math.sin(i / 24 * Math.PI) * 36} width="4" height={Math.sin(i / 24 * Math.PI) * 36} fill={colors.SECONDARY} opacity="0.8" />)}
        <MathLabel tex={'\\hat y=\\sum_{i=1}^{5000} p_i c_i'} x={1168} y={420} fontSize={16} opacity={1} />
      </g>
      <g opacity={s.get(scene.outputU)}>
        <text x="1168" y="114" textAnchor="middle" fill={colors.ACCENT} fontSize="11">probability rows sum to 1</text>
        <text x="1168" y="536" textAnchor="middle" fill={colors.POSITIVE} fontSize="11">imputed feature matrix</text>
      </g>
      <g opacity={recap}>
        <path d="M210 620 C360 570 480 610 610 560 C760 505 880 560 1050 590" fill="none" stroke={colors.WARM} strokeWidth="5" strokeDasharray="12 9" />
        {['cell identity', 'two axes', 'mask', 'answer'].map((label, i) => <g key={label} transform={`translate(${245 + i * 270} ${607 - (i % 2) * 44})`} opacity={clamp01(recap * 5 - i)}>
          <circle r="22" fill="#2b2513" stroke={colors.WARM} strokeWidth="3" />
          <text y="43" textAnchor="middle" fill={colors.WARM} fontSize="11">{label}</text>
        </g>)}
      </g>
    </g>
    <g opacity={close}>
      <rect x="166" y="114" width="948" height="454" rx="58" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="206" textAnchor="middle" fill={colors.TEXT} fontSize="49" fontWeight="880">model the mechanism first</text>
      {['classification', 'regression', 'imputation'].map((label, i) => <g key={label} transform={`translate(${342 + i * 298} 372)`}>
        <circle r="78" fill="#101827" stroke={[colors.ACCENT, colors.SECONDARY, colors.POSITIVE][i]} strokeWidth="4" />
        <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="14">{label}</text>
      </g>)}
      <text x="640" y="510" textAnchor="middle" fill={colors.MUTED} fontSize="16">one pretrained conditional model · three public routes</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
