// Search the Claim, Keep the Source — chapter 2: Let Five Search Signals Vote.
//
// Grounded in AskChem src/askchem/db.py search_claims, _tree_recall,
// _paper_recall, claim FTS/vector recall, RRF merge, paper diversity and cap;
// plus src/askchem/retrieval.py cross-encoder reranking and the README.
import { CAMERA_HOME, Camera, MathLabel, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const SIGNALS = [
  { key: 'FTS5', color: colors.ACCENT },
  { key: 'VECTOR', color: colors.SECONDARY },
  { key: 'TREE', color: colors.POSITIVE },
  { key: 'PAPER', color: colors.WARM },
  { key: 'AUTHOR', color: colors.TEAL },
];
const CLAIMS = ['C7A2', 'B91F', 'A30D', 'E22C', 'D04B'];
const RANKS = [
  [0, 2, 1, 4, 3],
  [2, 0, 3, 1, 4],
  [1, 3, 0, 4, 2],
  [3, 1, 4, 0, 2],
  [1, 4, 2, 3, 0],
];
const RRF = CLAIMS.map((_, claim) => RANKS.reduce((sum, lane) => sum + 1 / (60 + lane.indexOf(claim) + 1), 0));
const FINAL_ORDER = RRF.map((score, i) => ({ score, i })).sort((a, b) => b.score - a.score).map((x) => x.i);

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const queryU = tl.channel('queryU', 0);
  const splitU = tl.channel('splitU', 0);
  const ftsU = tl.channel('ftsU', 0);
  const vectorU = tl.channel('vectorU', 0);
  const recallU = tl.channel('recallU', 0);
  const laneRankU = tl.channel('laneRankU', 0);
  const braidU = tl.channel('braidU', 0);
  const formulaU = tl.channel('formulaU', 0);
  const rerankU = tl.channel('rerankU', 0);
  const diversityU = tl.channel('diversityU', 0);
  const tetherU = tl.channel('tetherU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.4, dur: 5.7, text: 'A chemistry question rarely has one perfect vocabulary, so Ask Chem does not bet the answer on one search method.' });
  tl.tween(queryU, 1, { at: 0.9, dur: 0.7, ease: ease.enter });
  tl.tween(splitU, 1, { at: 1.7, dur: 1.4, ease: ease.draw });
  tl.hold(6.1, 0.6);

  tl.caption({ at: 6.7, dur: 5.8, text: 'Full text search rewards exact words and phrases, which is excellent when the terminology lines up.' });
  tl.tween(ftsU, 1, { at: 7.2, dur: 1.3, ease: ease.enter });
  tl.tween(laneRankU, 0.22, { at: 8.1, dur: 1.1, ease: ease.move });
  tl.tween(cam, { x: 655, y: 248, k: 1.12 }, { at: 8.4, dur: 1.3, ease: ease.move });
  tl.hold(12.5, 0.6);

  tl.caption({ at: 13.1, dur: 5.8, text: 'Dense retrieval follows meaning instead, so a related finding can surface even when it uses different words.' });
  tl.tween(vectorU, 1, { at: 13.6, dur: 1.2, ease: ease.enter });
  tl.tween(laneRankU, 0.44, { at: 14.5, dur: 1.1, ease: ease.move });
  tl.hold(18.9, 0.6);

  tl.caption({ at: 19.5, dur: 5.9, text: 'Taxonomy, paper, and author recall add three more routes, rescuing candidates that any single lane might miss.' });
  tl.tween(recallU, 1, { at: 20.0, dur: 1.5, ease: ease.enter });
  tl.tween(laneRankU, 1, { at: 21.1, dur: 1.5, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 22.0, dur: 1.3, ease: ease.move });
  tl.hold(25.4, 0.6);

  tl.caption({ at: 26.0, dur: 6.0, text: 'Reciprocal rank fusion lets every lane vote. A high place on several lists matters more than one lucky score.' });
  tl.tween(braidU, 1, { at: 26.5, dur: 2.0, ease: ease.move });
  tl.tween(formulaU, 1, { at: 27.8, dur: 0.7, ease: ease.enter });
  tl.tween(cam, { x: 790, y: 410, k: 1.09 }, { at: 28.2, dur: 1.3, ease: ease.move });
  tl.hold(32.0, 0.6);

  tl.caption({ at: 32.6, dur: 5.8, text: 'A cross encoder then reads the query beside the leading claims and adjusts the head of the ranking.' });
  tl.tween(rerankU, 1, { at: 33.1, dur: 1.4, ease: ease.move });
  tl.hold(38.4, 0.6);

  tl.caption({ at: 39.0, dur: 5.8, text: 'Paper diversity and a per source cap stop one prolific paper from filling every visible result.' });
  tl.tween(diversityU, 1, { at: 39.5, dur: 1.3, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 40.2, dur: 1.3, ease: ease.move });
  tl.hold(44.8, 0.6);

  tl.caption({ at: 45.4, dur: 6.2, text: 'The ranking changes, but the evidence does not. Every winning card still carries its source identifier and quote.' });
  tl.tween(tetherU, 1, { at: 45.9, dur: 1.4, ease: ease.draw });
  tl.tween(dimU, 1, { at: 47.1, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 47.9, dur: 0.7, ease: ease.enter });
  tl.hold(51.6, 1.0);

  return { tl, cam, queryU, splitU, ftsU, vectorU, recallU, laneRankU, braidU, formulaU, rerankU, diversityU, tetherU, dimU, endU };
}

const scene = buildScene();

function RankCard({ x, y, label, color, u, scale = 1 }: { x: number; y: number; label: string; color: string; u: number; scale?: number }) {
  const uu = clamp01(u);
  return <g opacity={uu} transform={`translate(${x} ${y}) scale(${(0.82 + uu * 0.18) * scale})`}>
    <rect x={-38} y={-18} width={76} height={36} rx={10} fill={colors.PANEL} stroke={color} strokeWidth={1.8} />
    <text y={5} textAnchor="middle" fill={colors.TEXT} fontSize={12} fontFamily={MONO}>{label}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const splitU = s.get(scene.splitU);
  const laneRankU = s.get(scene.laneRankU);
  const braidU = s.get(scene.braidU);
  const rerankU = s.get(scene.rerankU);
  const diversityU = s.get(scene.diversityU);
  const mainOpacity = 1 - 0.9 * s.get(scene.dimU);
  const laneReveal = [s.get(scene.ftsU), s.get(scene.vectorU), s.get(scene.recallU), s.get(scene.recallU), s.get(scene.recallU)];
  return <>
    <rect width={1280} height={720} fill={colors.BG} />
    <text x={640} y={48} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={780} opacity={mainOpacity}>Let five search signals vote</text>
    <Camera {...s.get(scene.cam)}>
      <g opacity={mainOpacity}>
        <g opacity={s.get(scene.queryU)}>
          <rect x={62} y={92} width={306} height={52} rx={17} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2} />
          <text x={215} y={124} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>Suzuki coupling palladium</text>
        </g>
        {SIGNALS.map((sig, lane) => {
          const y = 205 + lane * 72;
          const reveal = laneReveal[lane];
          return <g key={sig.key} opacity={reveal}>
            <path d={`M368 118 C430 118 420 ${y} 482 ${y}`} fill="none" stroke={sig.color} strokeWidth={2.5} strokeDasharray="8 7" strokeDashoffset={(1 - splitU) * 80} />
            <text x={505} y={y + 5} fill={sig.color} fontSize={12} fontWeight={750} fontFamily={MONO}>{sig.key}</text>
            <line x1={585} y1={y} x2={1000} y2={y} stroke={sig.color} opacity={0.24} />
            {RANKS[lane].map((claim, rank) => {
              const originalX = 630 + rank * 82;
              const finalRank = FINAL_ORDER.indexOf(claim);
              const finalX = 650 + finalRank * 90;
              const x = originalX + (finalX - originalX) * braidU;
              const settle = clamp01(laneRankU * 5 - lane);
              return <RankCard key={claim} x={x} y={y} label={CLAIMS[claim]} color={sig.color} u={reveal * settle} scale={1 - braidU * 0.12} />;
            })}
          </g>;
        })}
        {braidU > 0 && <g opacity={braidU}>
          <rect x={600} y={557} width={480} height={66} rx={20} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
          {FINAL_ORDER.map((claim, rank) => {
            const shiftedRank = rerankU > 0.5 && rank < 2 ? 1 - rank : rank;
            const diverseRank = diversityU > 0.5 && shiftedRank === 4 ? 3.45 : shiftedRank;
            return <RankCard key={claim} x={650 + diverseRank * 90} y={590} label={CLAIMS[claim]} color={rank === 0 ? colors.WARM : colors.ACCENT} u={braidU} />;
          })}
          <text x={1110} y={595} fill={colors.MUTED} fontSize={11} fontFamily={MONO}>RRF</text>
        </g>}
        <MathLabel tex={'\\operatorname{score}(d)=\\sum_i \\frac{1}{60+r_i(d)}'} x={850} y={115} fontSize={22} opacity={s.get(scene.formulaU)} />
        {rerankU > 0 && <g opacity={rerankU}>
          <ellipse cx={700} cy={588} rx={112} ry={54} fill="none" stroke={colors.SECONDARY} strokeWidth={3} />
          <text x={700} y={522} textAnchor="middle" fill={colors.SECONDARY} fontSize={11} fontFamily={MONO}>cross_encoder_rerank</text>
        </g>}
        {diversityU > 0 && <g opacity={diversityU}>
          {['10.a', '10.b', '10.c', '10.d'].map((doi, i) => <g key={doi} transform={`translate(${655 + i * 118} 650)`}>
            <circle r={7} fill={[colors.WARM, colors.POSITIVE, colors.SECONDARY, colors.ACCENT][i]} />
            <text x={13} y={4} fill={colors.MUTED} fontSize={10} fontFamily={MONO}>{doi}</text>
          </g>)}
        </g>}
        {s.get(scene.tetherU) > 0 && <g opacity={s.get(scene.tetherU)}>
          <path d="M650 608 C610 640 555 628 520 660" fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
          <text x={500} y={677} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>source_doi + verbatim_quote</text>
        </g>}
      </g>
    </Camera>
    {s.get(scene.endU) > 0 && <g opacity={s.get(scene.endU)}>
      <rect x={170} y={224} width={940} height={222} rx={28} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} />
      <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={820}>Recall broadly, rank together</text>
      <text x={640} y={350} textAnchor="middle" fill={colors.WARM} fontSize={21}>FTS5 + vector + tree + paper + author</text>
      <text x={640} y={397} textAnchor="middle" fill={colors.MUTED} fontSize={14}>five votes · one ranking · every source still attached</text>
    </g>}
  </>;
}

export const vizScene = () => scene;
