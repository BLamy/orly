// Grounding: paper section 3.1; voicemem/leftbrain/brain.py::SearchCogGraph,
// _search_data_impl, SearchData, _widen_for_time_question, rank; orchestrator.py::Search.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const COLS = 10;
const ROWS = 6;
const CELLS = Array.from({ length: COLS * ROWS }, (_, i) => ({
  i,
  col: i % COLS,
  row: Math.floor(i / COLS),
  score: ((i * 37) % 101) / 100,
}));
const SCHEMA = new Set([3, 4, 5, 6, 7, 13, 14, 15, 16, 17, 23, 24, 25, 26, 27, 33, 34, 35, 36, 37]);
const ENTITY = new Set([14, 15, 16, 24, 25, 26, 34, 35]);
const NEIGHBORS = new Set([13, 17, 23, 27, 33, 36]);
const SURVIVORS = CELLS.filter((c) => ENTITY.has(c.i) || NEIGHBORS.has(c.i)).sort((a, b) => b.score - a.score);
const TOP = new Set(SURVIVORS.slice(0, 5).map((c) => c.i));

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const fieldP = tl.channel('memory field', 0);
  const queryU = tl.channel('query classification', 0);
  const schemaU = tl.channel('schema candidate band', 0);
  const entityU = tl.channel('entity narrowing lens', 0);
  const neighborU = tl.channel('one hop expansion', 0);
  const rankSweep = tl.channel('semantic ranking sweep', 0);
  const topU = tl.channel('top five memories', 0);
  const densityU = tl.channel('context density', 0);
  const close = tl.channel('five bright memories', 0);

  tl.caption({ at: 0.4, dur: 6.2, text: 'The factual store may hold thousands of memories, but a spoken reply cannot carry them all.' });
  tl.tween(fieldP, CELLS.length, { at: 0.8, dur: 3.2, ease: ease.enter });

  tl.caption({ at: 6.6, dur: 6.4, text: 'The left brain first turns the query into schemas and entities, before touching vector ranking.' });
  tl.tween(queryU, 1, { at: 7.1, dur: 0.7, ease: ease.enter });
  tl.tween(cam, { x: 520, y: 360, k: 1.05 }, { at: 8.8, dur: 1.2, ease: ease.move });

  tl.caption({ at: 13.0, dur: 6.4, text: 'Schema routing lights a broad factual band: enough recall to stay useful, narrow enough to avoid the whole store.' });
  tl.tween(schemaU, 1, { at: 13.5, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 16.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 19.4, dur: 6.4, text: 'A fuzzy entity match then cuts through that band, focusing the pool on the people or things actually named.' });
  tl.tween(entityU, 1, { at: 19.9, dur: 1.4, ease: ease.move });
  tl.tween(cam, { x: 700, y: 360, k: 1.05 }, { at: 22.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 25.8, dur: 6.4, text: 'One-hop neighbors join at the edge, preserving relationships that a literal name match would miss.' });
  tl.tween(neighborU, 1, { at: 26.3, dur: 1.3, ease: ease.enter });

  tl.caption({ at: 32.2, dur: 6.1, text: 'Only now does semantic similarity sweep the surviving candidates, instead of paying to rank every memory.' });
  tl.tween(rankSweep, 1, { at: 32.8, dur: 4.0, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 35.6, dur: 1.2, ease: ease.move });

  tl.caption({ at: 38.7, dur: 6.4, text: 'The five strongest cells rise into the reply context. The rest remain stored, not forgotten.' });
  tl.tween(topU, 1, { at: 39.2, dur: 1.4, ease: ease.move });
  tl.tween(densityU, 1, { at: 41.2, dur: 0.8, ease: ease.pop });

  tl.caption({ at: 45.1, dur: 6.4, text: 'That funnel is the point: spend the model budget on dense evidence, not a larger pile of loosely related text.' });
  tl.tween(close, 1, { at: 45.8, dur: 1.1, ease: ease.move });
  tl.hold(51.7, 1.0);

  return { tl, cam, fieldP, queryU, schemaU, entityU, neighborU, rankSweep, topU, densityU, close };
}

const scene = buildScene();
const xFor = (col: number) => 390 + col * 72;
const yFor = (row: number) => 176 + row * 67;

export function Render({ s }: { s: SceneState }) {
  const close = s.get(scene.close);
  const schema = s.get(scene.schemaU);
  const entity = s.get(scene.entityU);
  const neighbor = s.get(scene.neighborU);
  const rank = s.get(scene.rankSweep);
  const top = s.get(scene.topU);

  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="58" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="850">The left brain narrows before it ranks</text>

      <g opacity={s.get(scene.queryU)}>
        <rect x="66" y="124" width="246" height="410" rx="30" fill="#101a2d" stroke={colors.ACCENT} strokeWidth="3" />
        <text x="189" y="164" textAnchor="middle" fill={colors.ACCENT} fontSize="14" fontFamily={colors.font.mono}>QueryClassification</text>
        <rect x="92" y="198" width="194" height="72" rx="18" fill="#15273d" stroke={colors.SECONDARY} />
        <text x="189" y="226" textAnchor="middle" fill={colors.MUTED} fontSize="12">schemas</text>
        <text x="189" y="252" textAnchor="middle" fill={colors.TEXT} fontSize="18">daily_life</text>
        <rect x="92" y="292" width="194" height="72" rx="18" fill="#251d36" stroke={colors.WARM} />
        <text x="189" y="320" textAnchor="middle" fill={colors.MUTED} fontSize="12">entities</text>
        <text x="189" y="346" textAnchor="middle" fill={colors.TEXT} fontSize="18">café</text>
        <text x="189" y="414" textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>SearchCogGraph</text>
        <text x="189" y="444" textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>SearchData</text>
        <text x="189" y="474" textAnchor="middle" fill={colors.MUTED} fontSize="12" fontFamily={colors.font.mono}>Rank(top_k=5)</text>
      </g>

      <g>
        {CELLS.map((cell) => {
          const enter = clamp01(s.get(scene.fieldP) - cell.i);
          const inSchema = SCHEMA.has(cell.i);
          const inEntity = ENTITY.has(cell.i);
          const inNeighbor = NEIGHBORS.has(cell.i);
          const survivor = inEntity || inNeighbor;
          const isTop = TOP.has(cell.i);
          let opacity = 0.22 + enter * 0.78;
          let fill = colors.MUTED;
          if (schema > 0) {
            opacity *= inSchema ? 1 : 1 - schema * 0.88;
            fill = inSchema ? colors.ACCENT : fill;
          }
          if (entity > 0) {
            opacity *= inEntity ? 1 : 1 - entity * 0.82;
            if (inEntity) fill = colors.WARM;
          }
          if (neighbor > 0 && inNeighbor) {
            opacity = Math.max(opacity, 0.25 + neighbor * 0.75);
            fill = colors.SECONDARY;
          }
          if (rank > 0 && survivor) opacity *= 0.35 + 0.65 * clamp01(rank * 1.25 - (1 - cell.score) * 0.5);
          if (top > 0) {
            opacity *= isTop ? 1 : 1 - top * 0.9;
            if (isTop) fill = colors.POSITIVE;
          }
          const lift = isTop ? top * 18 : 0;
          return <g key={cell.i} opacity={opacity * enter} transform={`translate(${xFor(cell.col)} ${yFor(cell.row) - lift}) scale(${0.75 + enter * 0.25 + (isTop ? top * 0.12 : 0)})`}>
            <rect x="-27" y="-24" width="54" height="48" rx="11" fill={fill} opacity="0.22" stroke={fill} strokeWidth={isTop ? 3.5 : 2} />
            <text y="5" textAnchor="middle" fill={fill} fontSize="11" fontFamily={colors.font.mono}>m{cell.i + 1}</text>
          </g>;
        })}
        <g opacity={schema}>
          <rect x="575" y="130" width="374" height="300" rx="30" fill="none" stroke={colors.ACCENT} strokeWidth="4" strokeDasharray="10 8" />
          <text x="762" y="118" textAnchor="middle" fill={colors.ACCENT} fontSize="13" fontFamily={colors.font.mono}>memory_ids_for_slots_v2</text>
        </g>
        <g opacity={entity}>
          <ellipse cx="750" cy="312" rx={160 - entity * 36} ry={150 - entity * 34} fill={colors.WARM} fillOpacity="0.05" stroke={colors.WARM} strokeWidth="4" />
          <text x="750" y="500" textAnchor="middle" fill={colors.WARM} fontSize="13" fontFamily={colors.font.mono}>strict: slot ∩ entity</text>
        </g>
        <g opacity={neighbor}>
          <path d="M586 257 C540 226 522 198 516 166 M874 257 C928 224 948 196 948 166" fill="none" stroke={colors.SECONDARY} strokeWidth="4" strokeDasharray="8 7" />
          <text x="1050" y="188" textAnchor="middle" fill={colors.SECONDARY} fontSize="13" fontFamily={colors.font.mono}>neighbor_entity_ids</text>
        </g>
        {rank > 0 && <g opacity={clamp01(rank * 5) * (1 - clamp01((rank - 0.94) * 18))}>
          <line x1={356 + rank * 730} y1="138" x2={356 + rank * 730} y2="562" stroke={colors.POSITIVE} strokeWidth="6" strokeLinecap="round" />
          <rect x={884 + rank * 110} y="92" width="172" height="32" rx="16" fill="#102a22" stroke={colors.POSITIVE} />
          <text x={970 + rank * 110} y="113" textAnchor="middle" fill={colors.POSITIVE} fontSize="12" fontFamily={colors.font.mono}>vector similarity</text>
        </g>}
      </g>

      <g opacity={s.get(scene.densityU)}>
        <rect x="388" y="574" width="680" height="40" rx="20" fill="#10251f" stroke={colors.POSITIVE} />
        <text x="728" y="600" textAnchor="middle" fill={colors.POSITIVE} fontSize="15">five dense memories · the store stays intact</text>
      </g>
    </g>

    <g opacity={close}>
      <rect x="204" y="126" width="872" height="432" rx="42" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="204" textAnchor="middle" fill={colors.TEXT} fontSize="38" fontWeight="850">narrow first · rank second</text>
      <g transform="translate(338 352)">
        {Array.from({ length: 24 }, (_, i) => <rect key={i} x={(i % 6) * 26 - 72} y={Math.floor(i / 6) * 26 - 42} width="18" height="18" rx="4" fill={colors.MUTED} opacity="0.24" />)}
        <text y="92" textAnchor="middle" fill={colors.MUTED} fontSize="16">the store</text>
      </g>
      <path d="M436 352 L568 298 M436 352 L568 406" stroke={colors.ACCENT} strokeWidth="6" />
      <path d="M568 298 L760 326 M568 406 L760 378" stroke={colors.WARM} strokeWidth="6" />
      <g transform="translate(892 352)">
        {Array.from({ length: 5 }, (_, i) => <rect key={i} x={-74 + i * 36} y="-48" width="26" height="96" rx="8" fill={i % 2 ? colors.SECONDARY : colors.POSITIVE} />)}
        <text y="92" textAnchor="middle" fill={colors.POSITIVE} fontSize="16">reply context</text>
      </g>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
