// Search the Claim, Keep the Source — chapter 2: Let Five Search Signals Vote.
//
// Grounded in AskChem src/askchem/db.py search_claims, _tree_recall,
// _paper_recall, claim FTS/vector recall, RRF merge, paper diversity and cap;
// plus src/askchem/retrieval.py cross-encoder reranking and the README.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
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
// Layout: lanes stack top to bottom, the RRF row sits below them, and everything
// stays above y 630 so the caption pill never covers a label.
const LANE_Y0 = 200;
const LANE_GAP = 66;
const LANE_PITCH = 88;
const RRF_PITCH = 96;
const RRF_Y = 548;
// Source paper per claim (indexed like CLAIMS); C7A2 and A30D share 10.a.
const DOI_OF = ['10.a', '10.b', '10.a', '10.c', '10.d'];
// Per-source cap: the second card from the same paper, indexed by final rank.
const CAPPED_RANK = (() => {
  const seen = new Set<string>();
  return FINAL_ORDER.map((claim) => {
    const dup = seen.has(DOI_OF[claim]);
    seen.add(DOI_OF[claim]);
    return dup;
  });
})();

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
  tl.tween(cam, { x: 600, y: 240, k: 1.12 }, { at: 8.4, dur: 1.3, ease: ease.move });
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
  tl.tween(cam, { x: 600, y: 376, k: 1.05 }, { at: 28.2, dur: 1.3, ease: ease.move });
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
    <text y={5} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO}>{label}</text>
  </g>;
}

export function Render({ s }: { s: SceneState }) {
  const splitU = s.get(scene.splitU);
  const laneRankU = s.get(scene.laneRankU);
  const braidU = s.get(scene.braidU);
  const rerankU = s.get(scene.rerankU);
  const diversityU = s.get(scene.diversityU);
  const formulaU = s.get(scene.formulaU);
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
          const y = LANE_Y0 + lane * LANE_GAP;
          const reveal = laneReveal[lane];
          return <g key={sig.key}>
            <path d={`M368 118 C430 118 420 ${y} 482 ${y}`} fill="none" stroke={sig.color} strokeWidth={2.5} strokeDasharray="8 7" strokeDashoffset={(1 - splitU) * 80} opacity={Math.max(reveal, splitU)} />
            <text x={505} y={y + 5} fill={sig.color} fontSize={14} fontWeight={750} fontFamily={MONO} opacity={reveal + (1 - reveal) * splitU * 0.5}>{sig.key}</text>
            <line x1={585} y1={y} x2={1040} y2={y} stroke={sig.color} opacity={0.24 * reveal} />
            {RANKS[lane].map((claim, rank) => {
              const originalX = 630 + rank * LANE_PITCH;
              const finalRank = FINAL_ORDER.indexOf(claim);
              const finalX = 650 + finalRank * RRF_PITCH;
              const x = originalX + (finalX - originalX) * braidU;
              const settle = clamp01(laneRankU * 5 - lane);
              return <RankCard key={claim} x={x} y={y} label={CLAIMS[claim]} color={sig.color} u={reveal * settle} scale={1 - braidU * 0.12} />;
            })}
          </g>;
        })}
        {braidU > 0 && <g opacity={braidU}>
          <rect x={600} y={520} width={500} height={76} rx={20} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2} />
          {FINAL_ORDER.map((claim, rank) => {
            const shiftedRank = rerankU > 0.5 && rank < 2 ? 1 - rank : rank;
            const x = 650 + shiftedRank * RRF_PITCH;
            const capped = CAPPED_RANK[rank];
            return <g key={claim}>
              <g opacity={capped ? 1 - 0.7 * diversityU : 1}>
                <RankCard x={x} y={RRF_Y} label={CLAIMS[claim]} color={rank === 0 ? colors.WARM : colors.ACCENT} u={braidU} />
              </g>
              {capped && <line x1={x - 36} y1={RRF_Y + 16} x2={x + 36} y2={RRF_Y - 16} stroke={colors.NEGATIVE} strokeWidth={2.5} opacity={diversityU} />}
              <text x={x} y={586} textAnchor="middle" fill={capped ? colors.NEGATIVE : colors.MUTED} fontSize={14} fontFamily={MONO} opacity={diversityU}>{DOI_OF[claim]}{capped ? ' cap' : ''}</text>
            </g>;
          })}
          <text x={1120} y={553} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>RRF</text>
          <text x={1120} y={586} fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO} opacity={diversityU}>max 1 per paper</text>
        </g>}
        <text x={850} y={118} textAnchor="middle" fill={colors.TEXT} fontSize={20} fontFamily={MONO} opacity={formulaU}>score(d) = Σ 1 / (60 + rᵢ(d))</text>
        {formulaU > 0 && <text x={850} y={146} textAnchor="middle" fill={colors.MUTED} fontSize={14} opacity={formulaU}>k = 60 keeps one lane's top hit from dominating</text>}
        {rerankU > 0 && <g opacity={rerankU * (1 - 0.6 * diversityU)}>
          <rect x={604} y={524} width={188} height={52} rx={12} fill="none" stroke={colors.SECONDARY} strokeWidth={2.5} strokeDasharray="6 5" />
          <text x={604} y={508} fill={colors.SECONDARY} fontSize={14} fontFamily={MONO}>cross_encoder_rerank · reads query + each pair</text>
        </g>}
        {s.get(scene.tetherU) > 0 && <g opacity={s.get(scene.tetherU)}>
          <path d="M606 594 C580 596 548 598 512 600" fill="none" stroke={colors.POSITIVE} strokeWidth={2.5} />
          <text x={496} y={604} textAnchor="end" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>source_doi + verbatim_quote</text>
        </g>}
      </g>
    </Camera>
    {s.get(scene.endU) > 0 && <g opacity={s.get(scene.endU)}>
      <rect x={170} y={208} width={940} height={250} rx={28} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} />
      <text x={640} y={280} textAnchor="middle" fill={colors.TEXT} fontSize={34} fontWeight={820}>Recall broadly, rank together</text>
      <text x={640} y={330} textAnchor="middle" fill={colors.WARM} fontSize={21}>FTS5 + vector + tree + paper + author</text>
      <text x={640} y={370} textAnchor="middle" fill={colors.MUTED} fontSize={14}>five votes · one ranking · every source still attached</text>
      <rect x={390} y={394} width={500} height={42} rx={12} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.5} />
      <text x={640} y={420} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>C7A2 · source_doi 10.a · verbatim_quote</text>
    </g>}
  </>;
}

export const vizScene = () => scene;
