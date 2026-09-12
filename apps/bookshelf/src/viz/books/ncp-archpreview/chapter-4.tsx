// Grounding: arXiv:2609.10715 Figure 1, Table 1, Sections 4.2 and 5.3;
// official source README.md, src/ncp_olmo_eval/evaluation_cli.py,
// src/ncp_olmo_eval/vllm_plugin/model.py, docs/SPECULATIVE_DECODING.md, and
// src/ncp_olmo_eval/ncp_dflash_vllm_benchmark.py.
import { scaleLinear } from 'd3';
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Axes, FunctionPlot } from '../../primitives';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const xScale = scaleLinear([0, 1], [142, 850]);
const yScale = scaleLinear([1.70, 2.45], [535, 130]);
const baselineLoss = (x: number) => 2.40 - 0.55 * x;
const ncpLoss = (x: number) => {
  if (x <= 0.513) return 2.40 - 0.55 * Math.pow(x / 0.513, 0.84);
  return 1.85 - 0.091 * Math.pow((x - 0.513) / 0.487, 0.82);
};
const RECAP = [
  { label: 'group', color: colors.ACCENT },
  { label: 'quantize', color: colors.SECONDARY },
  { label: 'predict', color: colors.WARM },
  { label: 'shift', color: colors.POSITIVE },
  { label: 'verify', color: colors.ACCENT },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const axesU = tl.channel('training axes', 0);
  const baselineU = tl.channel('baseline loss', 0);
  const ncpU = tl.channel('concept loss curve', 0);
  const crossingU = tl.channel('fifty-one percent crossing', 0);
  const resultsU = tl.channel('paper results', 0);
  const ledgerU = tl.channel('evaluation ledger', 0);
  const taskU = tl.channel('sealed task specifications', 0);
  const draftU = tl.channel('speculative draft', 0);
  const snapshotU = tl.channel('state snapshot', 0);
  const proposalP = tl.channel('proposal tokens', 0);
  const rollbackU = tl.channel('accept or rollback', 0);
  const proofU = tl.channel('exact verification gate', 0);
  const acceptedU = tl.channel('mean accepted length result', 0);
  const recapU = tl.channel('concept clock recap', 0);
  const closeU = tl.channel('closing title', 0);

  tl.caption({ at: 0.4, dur: 5.5, text: 'The paper trains both models on the same Stage One data, so the race begins on one shared token track.' });
  tl.tween(axesU, 1, { at: 0.8, dur: 1.3, ease: ease.draw });
  tl.tween(baselineU, 1, { at: 1.8, dur: 3.4, ease: ease.draw });
  tl.tween(cam, { x: 470, y: 340, k: 1.05 }, { at: 2.1, dur: 1.2, ease: ease.move });

  tl.caption({ at: 6.4, dur: 5.5, text: 'The concept model reaches the baseline final loss after consuming only fifty-one point three percent of the training tokens.' });
  tl.tween(ncpU, 0.513, { at: 6.9, dur: 3.0, ease: ease.draw });
  tl.tween(crossingU, 1, { at: 9.0, dur: 0.7, ease: ease.pop });

  tl.caption({ at: 12.4, dur: 5.5, text: 'Continue the run and its final loss lands zero point zero nine one lower, a one point nine five times token-convergence speedup.' });
  tl.tween(ncpU, 1, { at: 12.9, dur: 3.0, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 15.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 18.4, dur: 5.5, text: 'Stage One also reports a two point four five point macro-average gain, including five point nine nine points on the math benchmark.' });
  tl.tween(resultsU, 1, { at: 18.9, dur: 1.5, ease: ease.enter });

  tl.caption({ at: 24.4, dur: 5.5, text: 'The released evaluation toolkit does not treat a persuasive curve as proof by itself.' });
  tl.tween(ledgerU, 1, { at: 24.9, dur: 1.4, ease: ease.move });
  tl.tween(cam, { x: 640, y: 340, k: 1.06 }, { at: 25.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 30.4, dur: 5.5, text: 'It records immutable model identity, source revision, prepared data, prompts, and the fixed seed before a benchmark can run.' });
  tl.tween(taskU, 1, { at: 30.9, dur: 2.4, ease: ease.enter });

  tl.caption({ at: 36.4, dur: 5.5, text: 'The same suspicion guards speculative decoding. A drafter may propose several tokens, but the target model owns the verdict.' });
  tl.tween(draftU, 1, { at: 36.9, dur: 1.4, ease: ease.enter });
  tl.tween(proposalP, 8, { at: 38.0, dur: 3.2, ease: ease.linear });
  tl.tween(cam, { x: 640, y: 375, k: 1.08 }, { at: 38.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 42.4, dur: 5.5, text: 'Before the proposal mutates request state, the backend snapshots encoder, concept, and decoder history.' });
  tl.tween(snapshotU, 1, { at: 42.9, dur: 1.3, ease: ease.pop });

  tl.caption({ at: 48.4, dur: 5.5, text: 'Accepted tokens commit. A rejected suffix restores the snapshot, so speed cannot quietly change the generated sequence.' });
  tl.tween(rollbackU, 1, { at: 49.0, dur: 2.4, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 51.2, dur: 1.2, ease: ease.move });

  tl.caption({ at: 54.4, dur: 5.5, text: 'Formal use requires an exact comparison artifact covering at least eight prompts and one thousand twenty-four forced generated tokens.' });
  tl.tween(proofU, 1, { at: 55.0, dur: 1.5, ease: ease.enter });

  tl.caption({ at: 60.4, dur: 5.5, text: 'With concept conditioning, the paper reports mean accepted length rising from five point nine three three to six point one eight zero.' });
  tl.tween(acceptedU, 1, { at: 61.0, dur: 1.8, ease: ease.draw });

  tl.caption({ at: 66.4, dur: 5.5, text: 'That is a four point one seven percent relative improvement, measured behind the same exact-verification gate.' });
  tl.tween(recapU, 1, { at: 67.0, dur: 2.8, ease: ease.linear });

  tl.caption({ at: 72.4, dur: 6.0, text: 'Group, quantize, predict, shift, verify. Four token positions become one concept clock without relaxing the evidence.' });
  tl.tween(closeU, 1, { at: 73.0, dur: 1.3, ease: ease.move });
  tl.hold(78.4, 1.0);

  return { tl, cam, axesU, baselineU, ncpU, crossingU, resultsU, ledgerU, taskU, draftU, snapshotU, proposalP, rollbackU, proofU, acceptedU, recapU, closeU };
}

const scene = buildScene();

function LedgerCard({ x, y, title, value, color, u }: { x: number; y: number; title: string; value: string; color: string; u: number }) {
  if (u <= 0) return null;
  return <g transform={`translate(${x} ${y + (1 - u) * 18})`} opacity={u}>
    <rect width="238" height="74" rx="18" fill="#111c2c" stroke={color} strokeWidth="2" />
    <text x="18" y="27" fill={color} fontSize="11" fontFamily={colors.font.mono}>{title}</text>
    <text x="18" y="52" fill={colors.TEXT} fontSize="12" fontFamily={colors.font.mono}>{value}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.closeU);
  const ledger = s.get(scene.ledgerU);
  const draft = s.get(scene.draftU);
  const proposal = s.get(scene.proposalP);
  const rollback = s.get(scene.rollbackU);
  const proof = s.get(scene.proofU);
  const accepted = s.get(scene.acceptedU);
  const recap = s.get(scene.recapU);
  const plotFade = 1 - clamp01(ledger * 2.5);
  const ledgerFade = 1 - clamp01(draft * 2.5);
  const draftFade = 1 - clamp01(recap * 2.5);

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="62" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850" opacity={plotFade}>proof before speed</text>

      <g opacity={plotFade}>
        <Axes x={xScale} y={yScale} reveal={s.get(scene.axesU)} xTicks={4} yTicks={4} xLabel="5.73T training tokens" yLabel="training loss" />
        <FunctionPlot x={xScale} y={yScale} f={baselineLoss} domain={[0, 1]} reveal={s.get(scene.baselineU)} color={colors.MUTED} width={4} />
        <FunctionPlot x={xScale} y={yScale} f={ncpLoss} domain={[0, 1]} reveal={s.get(scene.ncpU)} color={colors.ACCENT} width={5} />
        <line x1={xScale(0)} y1={yScale(1.85)} x2={xScale(1)} y2={yScale(1.85)} stroke={colors.WARM} strokeWidth="2" strokeDasharray="9 7" opacity={s.get(scene.crossingU)} />
        <line x1={xScale(0.513)} y1={yScale(2.42)} x2={xScale(0.513)} y2={yScale(1.85)} stroke={colors.WARM} strokeWidth="2.5" opacity={s.get(scene.crossingU)} />
        <circle cx={xScale(0.513)} cy={yScale(1.85)} r={10 + 4 * s.get(scene.crossingU)} fill={colors.WARM} />
        <text x={xScale(0.513)} y={yScale(2.40)} textAnchor="middle" fill={colors.WARM} fontSize="13">51.3% of tokens</text>
        <text x={xScale(0.93)} y={yScale(baselineLoss(0.93)) - 14} textAnchor="end" fill={colors.MUTED} fontSize="13">OLMo-3-7B</text>
        <text x={xScale(0.72)} y={yScale(ncpLoss(0.72)) - 14} textAnchor="middle" fill={colors.ACCENT} fontSize="13">NCP-ArchPreview</text>
        <g opacity={s.get(scene.resultsU)}>
          {[
            { y: 164, big: '−0.091', small: 'final Stage-1 loss' },
            { y: 274, big: '+2.45', small: 'downstream macro avg' },
            { y: 384, big: '+5.99', small: 'GSM8K' },
          ].map((r) => <g key={r.big} transform={`translate(956 ${r.y})`}>
            <rect x="-110" y="-38" width="220" height="82" rx="20" fill="#101827" stroke={r.big.startsWith('−') ? colors.ACCENT : colors.POSITIVE} strokeWidth="2.5" />
            <text y="3" textAnchor="middle" fill={r.big.startsWith('−') ? colors.ACCENT : colors.POSITIVE} fontSize="28" fontWeight="850">{r.big}</text>
            <text y="27" textAnchor="middle" fill={colors.MUTED} fontSize="11">{r.small}</text>
          </g>)}
        </g>
      </g>

      <g opacity={ledger * ledgerFade}>
        <rect x="92" y="116" width="1096" height="450" rx="40" fill="#101827" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="640" y="160" textAnchor="middle" fill={colors.TEXT} fontSize="27" fontWeight="820">immutable evaluation ledger</text>
        <LedgerCard x={142} y={204} title="MODEL_SCHEMA_VERSION" value="conceptlm…model-v1" color={colors.ACCENT} u={clamp01(s.get(scene.taskU) * 6)} />
        <LedgerCard x={398} y={204} title="source_state" value="repo_commit + tree_sha256" color={colors.SECONDARY} u={clamp01(s.get(scene.taskU) * 6 - 1)} />
        <LedgerCard x={654} y={204} title="prepared data" value="pinned file + sha256" color={colors.WARM} u={clamp01(s.get(scene.taskU) * 6 - 2)} />
        <LedgerCard x={910} y={204} title="DEFAULT_GLOBAL_SEED" value="42" color={colors.POSITIVE} u={clamp01(s.get(scene.taskU) * 6 - 3)} />
        <LedgerCard x={270} y={318} title="TaskSpec" value="scheduler-neutral JSON" color={colors.ACCENT} u={clamp01(s.get(scene.taskU) * 6 - 4)} />
        <LedgerCard x={782} y={318} title="artifact validation" value="fail closed" color={colors.NEGATIVE} u={clamp01(s.get(scene.taskU) * 6 - 5)} />
        <path d="M389 430 H891" stroke={colors.MUTED} strokeWidth="4" strokeDasharray="12 9" opacity={s.get(scene.taskU)} />
        <rect x="436" y="410" width="408" height="58" rx="20" fill="#12291f" stroke={colors.POSITIVE} strokeWidth="3" opacity={s.get(scene.taskU)} />
        <text x="640" y="445" textAnchor="middle" fill={colors.POSITIVE} fontSize="15">materialize only after every identity agrees</text>
        <text x="640" y="526" textAnchor="middle" fill={colors.MUTED} fontSize="11" fontFamily={colors.font.mono}>ncp_olmo_eval/evaluation_cli.py</text>
      </g>

      <g opacity={draft * draftFade}>
        <rect x="78" y="120" width="1124" height="440" rx="40" fill="#101827" stroke={colors.GRID} strokeWidth="2.5" />
        <text x="640" y="158" textAnchor="middle" fill={colors.TEXT} fontSize="27" fontWeight="820">transactional speculative decoding</text>
        <rect x="126" y="207" width="244" height="104" rx="24" fill="#211a36" stroke={colors.SECONDARY} strokeWidth="3" />
        <text x="248" y="250" textAnchor="middle" fill={colors.SECONDARY} fontSize="15">NCP DFlash drafter</text>
        <text x="248" y="278" textAnchor="middle" fill={colors.MUTED} fontSize="11">proposal horizon: 16</text>
        <path d="M370 260 H1110" stroke={colors.MUTED} strokeWidth="5" />
        {Array.from({ length: 8 }, (_, i) => {
          const u = clamp01(proposal - i);
          const rejected = rollback > 0 && i >= 5;
          const x = 440 + i * 82;
          const y = 260 + (rejected ? 80 * rollback : 0);
          return <g key={i} transform={`translate(${x} ${y})`} opacity={u * (rejected ? 1 - rollback * 0.72 : 1)}>
            <rect x="-27" y="-27" width="54" height="54" rx="14" fill="#111c2c" stroke={rejected ? colors.NEGATIVE : rollback > 0 ? colors.POSITIVE : colors.SECONDARY} strokeWidth="3" />
            <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="12" fontFamily={colors.font.mono}>{`t${i + 1}`}</text>
          </g>;
        })}
        <g opacity={s.get(scene.snapshotU)}>
          <rect x="126" y="358" width="326" height="114" rx="24" fill="#151f31" stroke={colors.WARM} strokeWidth="3" />
          <text x="289" y="392" textAnchor="middle" fill={colors.WARM} fontSize="14" fontFamily={colors.font.mono}>_DFlashStateTransaction</text>
          <text x="289" y="420" textAnchor="middle" fill={colors.TEXT} fontSize="12">encoder · concept · decoder</text>
          <text x="289" y="446" textAnchor="middle" fill={colors.MUTED} fontSize="11">snapshot_request_state()</text>
        </g>
        <g opacity={rollback}>
          <path d="M850 398 C760 495 530 500 405 450" fill="none" stroke={colors.NEGATIVE} strokeWidth="4" strokeDasharray="10 8" />
          <text x="720" y="510" textAnchor="middle" fill={colors.NEGATIVE} fontSize="13">rejected suffix restores the request snapshot</text>
          <rect x="458" y="318" width="384" height="38" rx="15" fill="#12291f" stroke={colors.POSITIVE} />
          <text x="650" y="343" textAnchor="middle" fill={colors.POSITIVE} fontSize="12">five accepted tokens commit · three roll back</text>
        </g>
        <g opacity={proof}>
          <rect x="878" y="372" width="270" height="116" rx="24" fill="#12291f" stroke={colors.POSITIVE} strokeWidth="3" />
          <text x="1013" y="405" textAnchor="middle" fill={colors.POSITIVE} fontSize="14">EXACT A/B REQUIRED</text>
          <text x="1013" y="434" textAnchor="middle" fill={colors.TEXT} fontSize="12">≥ 8 prompts</text>
          <text x="1013" y="458" textAnchor="middle" fill={colors.TEXT} fontSize="12">≥ 1,024 forced tokens</text>
        </g>
        <g opacity={accepted}>
          <text x="640" y="188" textAnchor="middle" fill={colors.WARM} fontSize="13">mean accepted length</text>
          <rect x="476" y="176" width={238 * accepted} height="14" rx="7" fill={colors.MUTED} />
          <rect x="476" y="194" width={248 * accepted} height="14" rx="7" fill={colors.POSITIVE} />
          <text x="748" y="187" fill={colors.MUTED} fontSize="11">5.933</text>
          <text x="758" y="205" fill={colors.POSITIVE} fontSize="11">6.180 · +4.17%</text>
        </g>
      </g>

      <g opacity={recap}>
        <path d="M190 340 H1090" stroke={colors.GRID} strokeWidth="8" strokeLinecap="round" />
        {RECAP.map((item, i) => {
          const u = clamp01(recap * RECAP.length - i);
          const x = 240 + i * 200;
          return <g key={item.label} transform={`translate(${x} 340)`} opacity={u}>
            <circle r="48" fill={colors.BG} stroke={item.color} strokeWidth="4" />
            <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="13">{item.label}</text>
          </g>;
        })}
      </g>
    </g>

    <g opacity={close}>
      <rect x="176" y="116" width="928" height="452" rx="56" fill={colors.BG} stroke={colors.ACCENT} strokeWidth="4" />
      <text x="640" y="210" textAnchor="middle" fill={colors.TEXT} fontSize="48" fontWeight="880">Four Tokens Ahead</text>
      <text x="640" y="252" textAnchor="middle" fill={colors.ACCENT} fontSize="18">Next Concept Prediction at scale</text>
      {RECAP.map((item, i) => <g key={item.label} transform={`translate(${260 + i * 190} 390)`}>
        <circle r="40" fill="#101827" stroke={item.color} strokeWidth="3.5" />
        <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="11">{item.label}</text>
      </g>)}
      <text x="640" y="506" textAnchor="middle" fill={colors.MUTED} fontSize="15">a slower concept clock · a stricter evidence gate</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
