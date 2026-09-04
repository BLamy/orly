// Grounding: arXiv:2609.02749 Sections 4.1–4.2 and Appendix A.1;
// repo-skills-router/SKILL.md; update_repo_skills_router.mjs; repo-skills-library-manager.ts; docs/architecture.md.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ROWS = 20;
const COLS = 9;
const GRID = { x: 150, y: 168, cellW: 42, cellH: 20, gapX: 7, gapY: 6 };
const SELECTED = { row: 10, col: 4 };
const AREAS = ['vision', 'biomedical', 'generative media', 'agents', 'training', 'MLOps', 'deployment', 'language', 'reinforcement', 'retrieval', 'scientific computing'];
const GRAPH = [
  { x: 850, y: 260, label: 'repo entry' },
  { x: 738, y: 390, label: 'setup' },
  { x: 850, y: 430, label: 'evaluation' },
  { x: 962, y: 390, label: 'recovery' },
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('camera', CAMERA_HOME, cameraInterp);
  const libraryU = tl.channel('library field', 0);
  const taxonomyU = tl.channel('taxonomy', 0);
  const requestU = tl.channel('request', 0);
  const areaU = tl.channel('selected area', 0);
  const familyU = tl.channel('selected family', 0);
  const evidenceU = tl.channel('assignment evidence', 0);
  const weakFitU = tl.channel('weak fit rejected', 0);
  const repoU = tl.channel('repository graph', 0);
  const branchU = tl.channel('opened branch', 0);
  const contextU = tl.channel('context meter', 0);
  const transactionU = tl.channel('staged transaction', 0);
  const rollbackU = tl.channel('rollback boundary', 0);
  const closeU = tl.channel('disclosure close', 0);

  tl.caption({ at: 0.4, dur: 5.8, text: 'The public library holds more than five thousand verified skills distilled from one thousand machine-learning repositories.' });
  tl.tween(libraryU, 1, { at: 0.8, dur: 2.0, ease: ease.enter });

  tl.caption({ at: 6.6, dur: 5.8, text: 'A fixed two-level taxonomy organizes them into twenty areas and one hundred seventy-eight capability families.' });
  tl.tween(taxonomyU, 1, { at: 7.1, dur: 1.5, ease: ease.draw });

  tl.caption({ at: 12.8, dur: 5.8, text: 'Researcher mode does not pour that library into context. A concrete request becomes a beam that narrows the field.' });
  tl.tween(requestU, 1, { at: 13.3, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 520, y: 330, k: 1.04 }, { at: 15.0, dur: 1.3, ease: ease.move });

  tl.caption({ at: 19.0, dur: 5.8, text: 'The router first chooses one or two likely areas, then compares families by capability, task surface, format, and runtime intent.' });
  tl.tween(areaU, 1, { at: 19.5, dur: 1.2, ease: ease.move });
  tl.tween(familyU, 1, { at: 21.4, dur: 1.0, ease: ease.pop });

  tl.caption({ at: 25.2, dur: 5.8, text: 'Classification happens after verification. Every final assignment needs repository evidence, a rationale, and confidence.' });
  tl.tween(evidenceU, 1, { at: 25.8, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 28.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 31.4, dur: 5.8, text: 'A repository may take several exact routes, but keyword-only, dependency-only, optional, and example-only matches are rejected.' });
  tl.tween(weakFitU, 1, { at: 32.0, dur: 1.3, ease: ease.pop });

  tl.caption({ at: 37.6, dur: 5.8, text: 'One exact family opens one repository entry skill, which then routes to only the component skill the task needs.' });
  tl.tween(repoU, 1, { at: 38.2, dur: 1.0, ease: ease.enter });
  tl.tween(branchU, 1, { at: 39.5, dur: 1.8, ease: ease.draw });
  tl.tween(contextU, 0.18, { at: 38.2, dur: 3.0, ease: ease.move });
  tl.tween(cam, { x: 700, y: 330, k: 1.04 }, { at: 39.2, dur: 1.3, ease: ease.move });

  tl.caption({ at: 43.8, dur: 5.8, text: 'The updater rebuilds area and family pages from taxonomy, repository, and assignment indexes instead of hand-edited prose.' });
  tl.tween(transactionU, 1, { at: 44.4, dur: 1.7, ease: ease.move });

  tl.caption({ at: 50.0, dur: 5.8, text: 'The library manager stages the skill tree and router together, swaps them under a lock, and restores the prior state if installation fails.' });
  tl.tween(rollbackU, 1, { at: 50.6, dur: 2.4, ease: ease.linear });
  tl.tween(cam, CAMERA_HOME, { at: 53.0, dur: 1.2, ease: ease.move });

  tl.caption({ at: 56.2, dur: 6.2, text: 'Progressive disclosure is the trick: one request, one routed branch, and the rest of the library stays closed.' });
  tl.tween(closeU, 1, { at: 56.9, dur: 1.2, ease: ease.move });
  tl.hold(62.6, 1.0);

  return { tl, cam, libraryU, taxonomyU, requestU, areaU, familyU, evidenceU, weakFitU, repoU, branchU, contextU, transactionU, rollbackU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const lib = s.get(scene.libraryU);
  const taxonomy = s.get(scene.taxonomyU);
  const area = s.get(scene.areaU);
  const family = s.get(scene.familyU);
  const repo = s.get(scene.repoU);
  const branch = s.get(scene.branchU);
  const transaction = s.get(scene.transactionU);
  const rollback = s.get(scene.rollbackU);
  const close = s.get(scene.closeU);
  const selectedX = GRID.x + SELECTED.col * (GRID.cellW + GRID.gapX) + GRID.cellW / 2;
  const selectedY = GRID.y + SELECTED.row * (GRID.cellH + GRID.gapY) + GRID.cellH / 2;
  return <Camera {...s.get(scene.cam)}>
    <g opacity={1 - close}>
      <text x="640" y="68" textAnchor="middle" fill={colors.TEXT} fontSize="35" fontWeight="850">the library is large; the context is small</text>
      <g opacity={lib}>
        <text x="150" y="120" fill={colors.ACCENT} fontSize="18" fontWeight="800">AREX-Skill Library</text>
        <text x="420" y="120" fill={colors.MUTED} fontSize="15">1,000 repositories · 5,000+ verified skills</text>
        {Array.from({ length: ROWS * COLS }, (_, i) => {
          const r = Math.floor(i / COLS);
          const c = i % COLS;
          const enter = clamp01(lib * ROWS * COLS - i);
          const inArea = r === SELECTED.row;
          const selected = inArea && c === SELECTED.col;
          const dim = area > 0 && !inArea ? 0.08 : family > 0 && !selected ? 0.16 : 0.85;
          return <rect key={i}
            x={GRID.x + c * (GRID.cellW + GRID.gapX)} y={GRID.y + r * (GRID.cellH + GRID.gapY)}
            width={GRID.cellW} height={GRID.cellH} rx="6"
            fill={selected ? colors.WARM : inArea ? colors.SECONDARY : colors.ACCENT}
            opacity={enter * dim} stroke={selected && family > 0 ? colors.WARM : 'none'} strokeWidth="3" />;
        })}
        <g opacity={taxonomy}>
          <path d={`M ${GRID.x - 20} ${GRID.y} V ${GRID.y + ROWS * (GRID.cellH + GRID.gapY) - GRID.gapY}`} stroke={colors.MUTED} strokeWidth="2" />
          <text x="110" y="398" textAnchor="middle" fill={colors.MUTED} fontSize="13" transform="rotate(-90 110 398)">20 areas</text>
          <text x="370" y="708" textAnchor="middle" fill={colors.MUTED} fontSize="13">178 capability families</text>
        </g>
        <g opacity={s.get(scene.requestU)}>
          <rect x="758" y="112" width="420" height="78" rx="22" fill={colors.PANEL} stroke={colors.WARM} strokeWidth="3" />
          <text x="784" y="142" fill={colors.WARM} fontSize="14" fontWeight="800">REQUEST</text>
          <text x="784" y="168" fill={colors.TEXT} fontSize="15">compare two inference servers on this GPU</text>
          <path d={`M 758 151 C 670 151 610 230 ${selectedX} ${selectedY}`} fill="none" stroke={colors.WARM} strokeWidth="4" strokeDasharray="10 8" opacity={area} />
        </g>
        <g opacity={area}>
          <rect x={GRID.x - 8} y={GRID.y + SELECTED.row * (GRID.cellH + GRID.gapY) - 7} width={COLS * (GRID.cellW + GRID.gapX) - GRID.gapX + 16} height={GRID.cellH + 14} rx="10" fill="none" stroke={colors.SECONDARY} strokeWidth="3" />
          <text x="610" y={selectedY + 5} fill={colors.SECONDARY} fontSize="14">{AREAS[SELECTED.row]}</text>
        </g>
      </g>

      <g opacity={s.get(scene.evidenceU)} transform="translate(860 230)">
        <rect x="-176" y="-29" width="352" height="58" rx="16" fill={colors.PANEL} stroke={colors.POSITIVE} />
        <text y="-5" textAnchor="middle" fill={colors.POSITIVE} fontSize="14" fontWeight="800">assignment gate</text>
        <text y="17" textAnchor="middle" fill={colors.MUTED} fontSize="12">repository evidence · rationale · confidence</text>
      </g>
      <g opacity={s.get(scene.weakFitU)} transform="translate(1040 305)">
        <rect x="-132" y="-28" width="264" height="56" rx="15" fill="#2a1720" stroke={colors.NEGATIVE} />
        <text y="-4" textAnchor="middle" fill={colors.NEGATIVE} fontSize="14" fontWeight="800">NO FORCED MATCH</text>
        <text y="17" textAnchor="middle" fill={colors.MUTED} fontSize="11">keyword-only is not evidence</text>
      </g>

      <g opacity={repo}>
        {GRAPH.slice(1).map((n, i) => <line key={n.label} x1={GRAPH[0].x} y1={GRAPH[0].y + 30} x2={n.x} y2={n.y - 25} stroke={i === 1 ? colors.POSITIVE : colors.SECONDARY} strokeWidth={i === 1 ? 5 : 2.5} opacity={clamp01(branch * 4 - i)} />)}
        {GRAPH.map((n, i) => <g key={n.label} opacity={i === 0 ? repo : clamp01(branch * 4 - i)}>
          <rect x={n.x - 72} y={n.y - 27} width="144" height="54" rx="16" fill={colors.PANEL} stroke={i === 0 ? colors.WARM : i === 2 ? colors.POSITIVE : colors.ACCENT} strokeWidth="2.5" />
          <text x={n.x} y={n.y + 5} textAnchor="middle" fill={colors.TEXT} fontSize="14">{n.label}</text>
        </g>)}
      </g>
      <g transform="translate(850 540)" opacity={repo}>
        <rect x="-260" y="-13" width="520" height="26" rx="13" fill="#1b2231" />
        <rect x="-260" y="-13" width={520 * s.get(scene.contextU)} height="26" rx="13" fill={colors.POSITIVE} />
        <text y="40" textAnchor="middle" fill={colors.MUTED} fontSize="13" fontFamily={colors.font.mono}>operating context loaded</text>
      </g>

      <g opacity={transaction} transform="translate(650 610)">
        {['taxonomy.json', 'repositories.jsonl', 'assignments.jsonl'].map((label, i) => <g key={label} transform={`translate(${(i - 1) * 190} 0)`}>
          <rect x="-82" y="-20" width="164" height="40" rx="11" fill={colors.PANEL} stroke={colors.ACCENT} />
          <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="11" fontFamily={colors.font.mono}>{label}</text>
        </g>)}
        <path d={`M 440 0 H ${440 + 110 * rollback}`} stroke={rollback > 0.5 ? colors.NEGATIVE : colors.POSITIVE} strokeWidth="6" />
        <text x="520" y="-18" textAnchor="middle" fill={rollback > 0.5 ? colors.NEGATIVE : colors.POSITIVE} fontSize="12">stage → swap → restore</text>
      </g>
    </g>
    <g opacity={close}>
      <rect x="215" y="148" width="850" height="390" rx="42" fill={colors.BG} stroke={colors.POSITIVE} strokeWidth="4" />
      <text x="640" y="225" textAnchor="middle" fill={colors.TEXT} fontSize="39" fontWeight="850">one request opens one branch</text>
      {['request', 'area', 'family', 'repo skill', 'sub-skill'].map((label, i) => <g key={label} transform={`translate(${310 + i * 165} 345)`}>
        {i < 4 && <path d="M65 0 H100" stroke={colors.ACCENT} strokeWidth="4" />}
        <circle r={i === 4 ? 42 : 34} fill={colors.PANEL} stroke={i === 4 ? colors.POSITIVE : colors.ACCENT} strokeWidth="3" />
        <text y="5" textAnchor="middle" fill={colors.TEXT} fontSize="13">{label}</text>
      </g>)}
      <text x="640" y="465" textAnchor="middle" fill={colors.MUTED} fontSize="18">the other 4,999-plus skills stay closed</text>
    </g>
  </Camera>;
}

export const vizScene = () => scene;
