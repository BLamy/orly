import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { TABLES, TOKENS, buildScene, type EntityKind } from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/entity-relationship-model/overrides.json',
  slug: 'entity-relationship-model',
};

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

const KIND_COLOR: Record<EntityKind, string> = {
  customer: colors.ACCENT,
  order: colors.SECONDARY,
  product: colors.POSITIVE,
};

function TableShell({ kind, u, focus }: { kind: EntityKind; u: number; focus: number }) {
  const table = TABLES[kind];
  const uu = clamp01(u);
  if (uu <= 0) return null;
  const color = KIND_COLOR[kind];
  return (
    <g opacity={uu * (0.3 + 0.7 * focus)}>
      <rect
        x={table.x}
        y={table.y}
        width={table.w}
        height={table.h}
        rx={16}
        fill={colors.PANEL}
        stroke={color}
        strokeWidth={1.5 + focus * 2}
      />
      <rect x={table.x} y={table.y} width={table.w} height={48} rx={16} fill={color} opacity={0.13 + focus * 0.08} />
      <text x={table.x + 20} y={table.y + 31} fill={color} fontSize={19} fontWeight={700} fontFamily={MONO}>
        {table.title}
      </text>
      <text x={table.x + 20} y={table.y + table.h - 18} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
        {table.key}
      </text>
    </g>
  );
}

function Relationship({
  x1,
  x2,
  y,
  u,
  left,
  right,
}: {
  x1: number;
  x2: number;
  y: number;
  u: number;
  left: string;
  right: string;
}) {
  const xx = lerp(x1, x2, clamp01(u));
  return (
    <g opacity={clamp01(u)}>
      <line x1={x1} y1={y} x2={xx} y2={y} stroke={colors.WARM} strokeWidth={2.2} />
      <circle cx={x1} cy={y} r={4} fill={colors.WARM} />
      <path d={`M ${x2 - 8} ${y - 8} L ${x2} ${y} L ${x2 - 8} ${y + 8}`} fill="none" stroke={colors.WARM} strokeWidth={2} />
      <text x={x1 + 8} y={y - 12} fill={colors.WARM} fontSize={12} fontFamily={MONO}>{left}</text>
      <text x={x2 - 8} y={y - 12} textAnchor="end" fill={colors.WARM} fontSize={12} fontFamily={MONO}>{right}</text>
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const recordsU = s.get(scene.recordsU);
  const tableU = s.get(scene.tableU);
  const normalizeU = s.get(scene.normalizeU);
  const dedupeU = s.get(scene.dedupeU);
  const relationU = s.get(scene.relationU);
  const focus = s.get(scene.customerFocus);
  const joinU = s.get(scene.joinU);
  const dim = s.get(scene.dimU);
  const summary = s.get(scene.summaryU);

  const joinPoint = joinU < 0.5
    ? { x: lerp(268, 626, joinU * 2), y: lerp(246, 278, joinU * 2) }
    : { x: lerp(626, 988, (joinU - 0.5) * 2), y: lerp(278, 286, (joinU - 0.5) * 2) };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={1 - 0.87 * dim}>
          {normalizeU < 0.98 && (
            <g opacity={recordsU * (1 - normalizeU)}>
              <text x={640} y={105} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
                orders_flat.csv · customer copied into every row
              </text>
              {TOKENS.filter((_, i) => i % 3 === 0).map((token) => (
                <rect key={`row-${token.id}`} x={146} y={token.source.y - 28} width={988} height={56} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              ))}
              <text x={300} y={142} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>customer</text>
              <text x={620} y={142} textAnchor="middle" fill={colors.SECONDARY} fontSize={12} fontFamily={MONO}>order</text>
              <text x={944} y={142} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily={MONO}>product</text>
            </g>
          )}

          <TableShell kind="customer" u={tableU} focus={1} />
          <TableShell kind="order" u={tableU} focus={1 - 0.7 * focus} />
          <TableShell kind="product" u={tableU} focus={1 - 0.82 * focus} />

          <Relationship x1={418} x2={474} y={260} u={relationU} left="1" right="many" />
          <Relationship x1={778} x2={842} y={304} u={relationU} left="many" right="1" />

          {TOKENS.map((token) => {
            const x = lerp(token.source.x, token.target.x, normalizeU);
            const y = lerp(token.source.y, token.target.y, normalizeU);
            const duplicateOpacity = token.duplicate ? 1 - dedupeU : 1;
            const kindFocus = focus <= 0 ? 1 : token.kind === 'customer' ? 1 : token.kind === 'order' ? 0.75 : 0.12;
            return (
              <g key={token.id} transform={`translate(${x}, ${y})`} opacity={recordsU * duplicateOpacity * kindFocus}>
                <rect x={-112} y={-18} width={224} height={36} rx={10} fill={colors.BG} stroke={KIND_COLOR[token.kind]} strokeWidth={1.4} />
                <text y={5} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>{token.value}</text>
              </g>
            );
          })}

          {joinU > 0 && (
            <g>
              <polyline points="268,246 626,278 988,286" fill="none" stroke={colors.WARM} strokeWidth={3} strokeDasharray="6 8" opacity={0.45} />
              <circle cx={joinPoint.x} cy={joinPoint.y} r={9} fill={colors.WARM} />
              <circle cx={joinPoint.x} cy={joinPoint.y} r={18} fill="none" stroke={colors.WARM} opacity={0.35} />
              <text x={640} y={510} textAnchor="middle" fill={colors.WARM} fontSize={15} fontFamily={MONO}>
                C101 → O502 → P4
              </text>
            </g>
          )}
        </g>
      </Camera>

      {summary > 0 && (
        <g opacity={summary}>
          <rect x={196} y={188} width={888} height={266} rx={22} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={252} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={700}>Review the model through four lenses</text>
          {[
            ['identity', 'What makes each thing unique?'],
            ['ownership', 'Where does each fact live?'],
            ['cardinality', 'How many matches are legal?'],
            ['query path', 'Which keys connect the answer?'],
          ].map(([label, copy], i) => (
            <g key={label} transform={`translate(${252 + (i % 2) * 430}, ${308 + Math.floor(i / 2) * 72})`}>
              <text fill={i < 2 ? colors.ACCENT : colors.POSITIVE} fontSize={17} fontWeight={700} fontFamily={MONO}>{label}</text>
              <text y={25} fill={colors.MUTED} fontSize={14}>{copy}</text>
            </g>
          ))}
        </g>
      )}
    </>
  );
}

export function EntityRelationshipModel() {
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
