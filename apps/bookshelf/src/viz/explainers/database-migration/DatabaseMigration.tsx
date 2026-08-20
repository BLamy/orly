import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { ROWS, TABLE, buildScene } from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/database-migration/overrides.json',
  slug: 'database-migration',
};

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const PHASES = ['baseline', 'expand', 'dual write', 'backfill', 'read shift', 'contract'];

function PhaseRail({ phase }: { phase: number }) {
  return (
    <g>
      {PHASES.map((label, i) => {
        const active = clamp01(1 - Math.abs(phase - i));
        const done = phase > i + 0.4;
        const x = 180 + i * 184;
        return (
          <g key={label}>
            {i < PHASES.length - 1 && <line x1={x + 42} y1={94} x2={x + 142} y2={94} stroke={done ? colors.POSITIVE : colors.GRID} strokeWidth={2} />}
            <circle cx={x} cy={94} r={10 + active * 3} fill={done ? colors.POSITIVE : active > 0 ? colors.WARM : colors.PANEL} stroke={active > 0 ? colors.WARM : colors.GRID} />
            <text x={x} y={124} textAnchor="middle" fill={active > 0 ? colors.TEXT : colors.MUTED} fontSize={12} fontFamily={MONO}>{label}</text>
          </g>
        );
      })}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const tableU = s.get(scene.tableU);
  const schemaU = s.get(scene.schemaU);
  const dualWriteU = s.get(scene.dualWriteU);
  const backfillU = s.get(scene.backfillU);
  const readShiftU = s.get(scene.readShiftU);
  const contractU = s.get(scene.contractU);
  const phase = s.get(scene.phaseU);
  const dim = s.get(scene.dimU);
  const summary = s.get(scene.summaryU);

  const oldX = lerp(480, 298, schemaU);
  const firstX = lerp(680, 580, contractU);
  const lastX = lerp(920, 840, contractU);
  const oldOpacity = (1 - contractU) * (1 - 0.65 * readShiftU);
  const newOpacity = schemaU;
  const coverage = Math.round(backfillU * 100);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={1 - 0.87 * dim}>
          <PhaseRail phase={phase} />

          <g opacity={tableU}>
            <rect x={TABLE.x} y={TABLE.y} width={TABLE.w} height={TABLE.headerH + ROWS.length * TABLE.rowH} rx={18} fill={colors.PANEL} stroke={colors.GRID} />
            <rect x={TABLE.x} y={TABLE.y} width={TABLE.w} height={TABLE.headerH} rx={18} fill={colors.ACCENT} opacity={0.09} />
            <text x={190} y={TABLE.y + 39} fill={colors.ACCENT} fontSize={17} fontWeight={700} fontFamily={MONO}>users</text>
            <text x={190} y={TABLE.y + 91} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>id</text>
            <text x={oldX} y={TABLE.y + 39} textAnchor="middle" fill={colors.WARM} fontSize={14} fontFamily={MONO} opacity={oldOpacity}>full_name</text>
            <text x={firstX} y={TABLE.y + 39} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO} opacity={newOpacity}>first_name</text>
            <text x={lastX} y={TABLE.y + 39} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} fontFamily={MONO} opacity={newOpacity}>last_name</text>

            {ROWS.map((row, i) => {
              const y = TABLE.y + TABLE.headerH + i * TABLE.rowH;
              const filled = clamp01(backfillU * ROWS.length - i);
              const isNewWrite = i === ROWS.length - 1 ? dualWriteU : 0;
              const newValueU = Math.max(filled, isNewWrite);
              return (
                <g key={row.id}>
                  <line x1={TABLE.x} y1={y} x2={TABLE.x + TABLE.w} y2={y} stroke={colors.GRID} opacity={0.6} />
                  <text x={190} y={y + 38} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>{row.id}</text>
                  <text x={oldX} y={y + 38} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO} opacity={oldOpacity}>{row.full}</text>
                  <text x={firstX} y={y + 38} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO} opacity={newOpacity * newValueU}>{row.first}</text>
                  <text x={lastX} y={y + 38} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily={MONO} opacity={newOpacity * newValueU}>{row.last}</text>
                  {schemaU > 0 && newValueU < 0.02 && (
                    <text x={(firstX + lastX) / 2} y={y + 38} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13} fontFamily={MONO} opacity={schemaU}>NULL · NULL</text>
                  )}
                </g>
              );
            })}
          </g>

          {dualWriteU > 0 && (
            <g opacity={dualWriteU}>
              <path d={`M 640 532 C 640 566, ${oldX} 566, ${oldX} 506`} fill="none" stroke={colors.WARM} strokeWidth={2} strokeDasharray="5 7" />
              <path d={`M 640 532 C 640 566, ${firstX} 566, ${firstX} 506`} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
              <path d={`M 640 532 C 640 566, ${lastX} 566, ${lastX} 506`} fill="none" stroke={colors.POSITIVE} strokeWidth={2} />
              <text x={640} y={590} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>one write → both shapes</text>
            </g>
          )}

          {backfillU > 0 && backfillU < 1 && (
            <g>
              <rect x={820} y={555} width={314} height={18} rx={9} fill={colors.GRID} />
              <rect x={820} y={555} width={314 * backfillU} height={18} rx={9} fill={colors.POSITIVE} />
              <text x={804} y={569} textAnchor="end" fill={colors.POSITIVE} fontSize={13} fontFamily={MONO}>{coverage}% covered</text>
            </g>
          )}

          {readShiftU > 0 && (
            <g>
              <text x={146} y={585} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>read traffic</text>
              <rect x={244} y={570} width={420} height={18} rx={9} fill={colors.GRID} />
              <rect x={244} y={570} width={420 * (1 - readShiftU)} height={18} rx={9} fill={colors.WARM} />
              <rect x={244 + 420 * (1 - readShiftU)} y={570} width={420 * readShiftU} height={18} rx={9} fill={colors.POSITIVE} />
              <text x={244} y={610} fill={colors.WARM} fontSize={12} fontFamily={MONO}>old reader {Math.round((1 - readShiftU) * 100)}%</text>
              <text x={664} y={610} textAnchor="end" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>new reader {Math.round(readShiftU * 100)}%</text>
            </g>
          )}

          {contractU > 0.05 && (
            <text x={oldX} y={134} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO} opacity={contractU}>drop only after zero readers</text>
          )}
        </g>
      </Camera>

      {summary > 0 && (
        <g opacity={summary}>
          <rect x={190} y={204} width={900} height={236} rx={22} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={270} textAnchor="middle" fill={colors.TEXT} fontSize={31} fontWeight={700}>Expand → Migrate → Contract</text>
          <text x={640} y={320} textAnchor="middle" fill={colors.POSITIVE} fontSize={18}>additive changes create rollback room</text>
          <text x={640} y={356} textAnchor="middle" fill={colors.ACCENT} fontSize={18}>coverage and consistency earn the cutover</text>
          <text x={640} y={392} textAnchor="middle" fill={colors.NEGATIVE} fontSize={18}>destructive cleanup waits until the end</text>
        </g>
      )}
    </>
  );
}

export function DatabaseMigration() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
