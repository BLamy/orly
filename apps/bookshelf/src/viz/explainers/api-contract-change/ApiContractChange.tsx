import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import { RESPONSE_FIELDS, buildScene } from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/api-contract-change/overrides.json',
  slug: 'api-contract-change',
};

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

function ClientCard({ x, label, version, color, u, status }: { x: number; label: string; version: string; color: string; u: number; status: string }) {
  return (
    <g transform={`translate(${x}, 220)`} opacity={clamp01(u)}>
      <rect x={-126} y={-64} width={252} height={128} rx={16} fill={colors.PANEL} stroke={color} strokeWidth={1.6} />
      <text y={-21} textAnchor="middle" fill={color} fontSize={18} fontWeight={700}>{label}</text>
      <text y={8} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>{version}</text>
      <text y={39} textAnchor="middle" fill={status === 'compatible' ? colors.POSITIVE : colors.NEGATIVE} fontSize={12.5} fontFamily={MONO}>{status}</text>
    </g>
  );
}

function JsonContract({ additive, breaking }: { additive: number; breaking: number }) {
  const oldNameOpacity = 1 - breaking;
  return (
    <g transform="translate(640, 316)">
      <rect x={-208} y={-154} width={416} height={326} rx={18} fill={colors.PANEL} stroke={breaking > 0.4 ? colors.NEGATIVE : colors.ACCENT} strokeWidth={2} />
      <text x={-176} y={-116} fill={colors.ACCENT} fontSize={14} fontWeight={700} fontFamily={MONO}>GET /users/usr_42</text>
      <text x={-176} y={-82} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>{'{'}</text>
      {RESPONSE_FIELDS.map((field, i) => {
        const y = -48 + i * 48;
        const isName = field.key === 'name';
        return (
          <g key={field.key} opacity={isName ? oldNameOpacity : 1}>
            <text x={-152} y={y} fill={isName ? colors.WARM : colors.TEXT} fontSize={14} fontFamily={MONO}>{`"${field.key}":`}</text>
            <text x={-32} y={y} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>{field.value}{i < RESPONSE_FIELDS.length - 1 || additive > 0 ? ',' : ''}</text>
          </g>
        );
      })}
      {breaking > 0 && (
        <g opacity={breaking}>
          <text x={-152} y={0} fill={colors.NEGATIVE} fontSize={14} fontFamily={MONO}>"display_name":</text>
          <text x={16} y={0} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>"Ada",</text>
        </g>
      )}
      {additive > 0 && (
        <g opacity={additive}>
          <text x={-152} y={96} fill={colors.POSITIVE} fontSize={14} fontFamily={MONO}>"currency"?:</text>
          <text x={0} y={96} fill={colors.MUTED} fontSize={14} fontFamily={MONO}>"USD"</text>
          <text x={150} y={96} textAnchor="end" fill={colors.POSITIVE} fontSize={11} fontFamily={MONO}>optional</text>
        </g>
      )}
      <text x={-176} y={136} fill={colors.MUTED} fontSize={13} fontFamily={MONO}>{'}'}</text>
    </g>
  );
}

function CompatibilityMatrix({ u, breaking, adapter }: { u: number; breaking: number; adapter: number }) {
  const cells = [
    { row: 0, col: 0, ok: true },
    { row: 0, col: 1, ok: adapter > 0.5 },
    { row: 1, col: 0, ok: true },
    { row: 1, col: 1, ok: true },
  ];
  return (
    <g transform="translate(640, 520)" opacity={u}>
      <text x={-260} y={-70} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>contract tests</text>
      <text x={40} y={-70} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>v1 response</text>
      <text x={190} y={-70} textAnchor="middle" fill={colors.SECONDARY} fontSize={12} fontFamily={MONO}>v2 response</text>
      <text x={-110} y={-26} textAnchor="end" fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>v1 client</text>
      <text x={-110} y={28} textAnchor="end" fill={colors.SECONDARY} fontSize={12} fontFamily={MONO}>v2 client</text>
      {cells.map((cell) => {
        const x = 40 + cell.col * 150;
        const y = -32 + cell.row * 54;
        const ok = cell.row === 0 && cell.col === 1 && breaking > 0.5 ? cell.ok : true;
        return (
          <g key={`${cell.row}-${cell.col}`}>
            <rect x={x - 54} y={y - 18} width={108} height={36} rx={9} fill={ok ? colors.POSITIVE : colors.NEGATIVE} opacity={0.14} stroke={ok ? colors.POSITIVE : colors.NEGATIVE} />
            <text x={x} y={y + 5} textAnchor="middle" fill={ok ? colors.POSITIVE : colors.NEGATIVE} fontSize={13} fontFamily={MONO}>{ok ? 'PASS' : 'BREAK'}</text>
          </g>
        );
      })}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const base = s.get(scene.baseU);
  const request = s.get(scene.requestU);
  const additive = s.get(scene.additiveU);
  const breaking = s.get(scene.breakingU);
  const adapter = s.get(scene.adapterU);
  const traffic = s.get(scene.trafficU);
  const tests = s.get(scene.testU);
  const dim = s.get(scene.dimU);
  const summary = s.get(scene.summaryU);

  const packetU = request % 1;
  const outbound = request < 1;
  const packetX = outbound ? lerp(314, 432, packetU) : lerp(314, 508, packetU);
  const oldStatus = breaking > 0.55 && adapter < 0.55 ? 'missing name' : 'compatible';

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={1 - 0.87 * dim}>
          <ClientCard x={240} label="Old mobile app" version="client v1" color={colors.ACCENT} u={base} status={oldStatus} />
          <ClientCard x={1040} label="New web app" version="client v2" color={colors.SECONDARY} u={Math.max(additive, adapter)} status="compatible" />
          <JsonContract additive={additive} breaking={breaking} />

          <line x1={366} y1={220} x2={432} y2={220} stroke={colors.GRID} strokeWidth={2} />
          <line x1={848} y1={220} x2={914} y2={220} stroke={colors.GRID} strokeWidth={2} />
          {request > 0 && <circle cx={packetX} cy={220} r={8} fill={oldStatus === 'compatible' ? colors.POSITIVE : colors.NEGATIVE} />}

          {breaking > 0 && adapter < 0.98 && (
            <g opacity={breaking * (1 - adapter)}>
              <path d="M 382 290 l 18 -22 l 18 22 l 18 -22" fill="none" stroke={colors.NEGATIVE} strokeWidth={3} />
              <text x={394} y={326} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontFamily={MONO}>wire contract broken</text>
            </g>
          )}

          {adapter > 0 && (
            <g opacity={adapter}>
              <rect x={352} y={342} width={176} height={78} rx={13} fill={colors.PANEL} stroke={colors.WARM} />
              <text x={440} y={372} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>v1 adapter</text>
              <text x={440} y={397} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>display_name → name</text>
            </g>
          )}

          {traffic > 0 && (
            <g opacity={1 - tests}>
              <text x={196} y={478} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>live version usage</text>
              <rect x={196} y={494} width={888} height={20} rx={10} fill={colors.GRID} />
              <rect x={196} y={494} width={888 * (1 - traffic)} height={20} rx={10} fill={colors.ACCENT} />
              <rect x={196 + 888 * (1 - traffic)} y={494} width={888 * traffic} height={20} rx={10} fill={colors.SECONDARY} />
              <text x={196} y={538} fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>v1 {Math.round((1 - traffic) * 100)}%</text>
              <text x={1084} y={538} textAnchor="end" fill={colors.SECONDARY} fontSize={12} fontFamily={MONO}>v2 {Math.round(traffic * 100)}%</text>
            </g>
          )}

          <CompatibilityMatrix u={tests} breaking={breaking} adapter={adapter} />
        </g>
      </Camera>

      {summary > 0 && (
        <g opacity={summary}>
          <rect x={184} y={188} width={912} height={270} rx={22} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={640} y={248} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={700}>Evolve the contract without a flag day</text>
          {[
            ['classify', 'additive or breaking?'],
            ['bridge', 'translate incompatible shapes'],
            ['observe', 'errors and version traffic'],
            ['retire', 'only after usage reaches zero'],
          ].map(([label, copy], i) => (
            <g key={label} transform={`translate(${252 + (i % 2) * 430}, ${306 + Math.floor(i / 2) * 76})`}>
              <text fill={i === 3 ? colors.NEGATIVE : colors.POSITIVE} fontSize={17} fontWeight={700} fontFamily={MONO}>{label}</text>
              <text y={26} fill={colors.MUTED} fontSize={14}>{copy}</text>
            </g>
          ))}
        </g>
      )}
    </>
  );
}

export function ApiContractChange() {
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
