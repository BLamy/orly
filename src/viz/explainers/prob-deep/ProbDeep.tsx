import { Camera, Player, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes } from '../../primitives';
import overrides from './overrides.json';
import {
  COV_EPI,
  COV_TOTAL,
  IN_EPI,
  IN_TOTAL,
  SIGMA_HAT,
  TEST,
  buildScene,
  meanFit,
  spreadAt,
  sx,
  sy,
} from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** band path builder over the test region */
function band(width: (x: number) => number): string {
  const up: string[] = [];
  const dn: string[] = [];
  for (let i = 0; i <= 50; i++) {
    const x = (1.4 * i) / 50;
    up.push(`${sx(x)},${sy(meanFit(x) + width(x))}`);
    dn.unshift(`${sx(x)},${sy(meanFit(x) - width(x))}`);
  }
  return `M ${up.join(' L ')} L ${dn.join(' L ')} Z`;
}
const BAND_EPI = band((x) => 1.645 * spreadAt(x));
const BAND_TOT = band((x) => 1.645 * Math.sqrt(spreadAt(x) ** 2 + SIGMA_HAT ** 2));

function meter(x: number, label: string, val: number, color: string, u: number) {
  return (
    <g opacity={u}>
      <rect x={x} y={130} width={250} height={86} rx={12} fill={colors.PANEL} fillOpacity={0.94} stroke={colors.GRID} />
      <text x={x + 20} y={160} fill={colors.MUTED} fontSize={13}>
        {label}
      </text>
      <rect x={x + 20} y={172} width={210} height={14} rx={5} fill="#1b2437" />
      <rect x={x + 20} y={172} width={210 * val * u} height={14} rx={5} fill={color} />
      <line x1={x + 20 + 210 * 0.9} y1={168} x2={x + 20 + 210 * 0.9} y2={190} stroke={colors.TEXT} strokeWidth={1.5} strokeDasharray="3 3" />
      <text x={x + 20} y={208} fill={color} fontSize={15} fontFamily="ui-monospace, Menlo, monospace">
        caught {(val * 100).toFixed(0)}% · promised 90%
      </text>
    </g>
  );
}

function renderFrame(s: SceneState) {
  const axU = s.get(scene.axU);
  const bandEpiU = s.get(scene.bandEpiU);
  const bandTotU = s.get(scene.bandTotU);
  const testP = s.get(scene.testP);
  const missU = s.get(scene.missU);
  const meterEpiU = s.get(scene.meterEpiU);
  const meterTotU = s.get(scene.meterTotU);
  const menuU = s.get(scene.menuU);
  const closeU = s.get(scene.closeU);

  return (
    <Camera {...s.get(scene.cam)}>
      <Axes x={sx} y={sy} reveal={axU} grid xTicks={5} yTicks={5} xLabel="input x" yLabel="output y" />

      {/* the two bands */}
      <path d={BAND_TOT} fill={colors.POSITIVE} fillOpacity={0.13 * bandTotU} stroke={colors.POSITIVE} strokeOpacity={0.6 * bandTotU} strokeWidth={1.5} />
      <path d={BAND_EPI} fill={colors.SECONDARY} fillOpacity={0.2 * bandEpiU} stroke={colors.SECONDARY} strokeOpacity={0.7 * bandEpiU} strokeWidth={1.5} />
      <g opacity={bandEpiU}>
        <text x={sx(1.42)} y={sy(meanFit(1.4)) + 4} fill={colors.SECONDARY} fontSize={13}>
          ensemble spread ×1.645
        </text>
      </g>
      <g opacity={bandTotU}>
        <text x={sx(1.42)} y={sy(meanFit(1.4) + 1.645 * Math.sqrt(spreadAt(1.4) ** 2 + SIGMA_HAT ** 2)) + 4} fill={colors.POSITIVE} fontSize={13}>
          + learned noise σ ≈ {SIGMA_HAT.toFixed(2)}
        </text>
      </g>

      {/* the 200-point trial */}
      {TEST.map((p, i) => {
        const u = clamp01(testP * TEST.length - i);
        const caught = bandTotU > 0.5 ? IN_TOTAL[i] : IN_EPI[i];
        const missGlow = missU > 0.02 && !caught;
        return (
          <circle
            key={i}
            cx={sx(p.x)}
            cy={sy(p.y)}
            r={(missGlow ? 4 : 3) * u}
            fill={caught ? colors.ACCENT : colors.NEGATIVE}
            fillOpacity={caught ? 0.7 : 0.9}
          />
        );
      })}

      {/* the coverage meters */}
      {meter(880, 'ensemble spread only', COV_EPI, colors.SECONDARY, meterEpiU)}
      <g transform="translate(0, 120)">{meter(880, 'spread + noise term', COV_TOTAL, colors.POSITIVE, meterTotU)}</g>

      {/* the menu */}
      <g opacity={menuU}>
        <rect x={860} y={400} width={330} height={128} rx={12} fill={colors.PANEL} fillOpacity={0.94} stroke={colors.GRID} />
        <text x={880} y={430} fill={colors.TEXT} fontSize={14}>
          deep ensembles — strong, costs N models
        </text>
        <text x={880} y={458} fill={colors.TEXT} fontSize={14}>
          test-time dropout — cheap, rougher
        </text>
        <text x={880} y={486} fill={colors.TEXT} fontSize={14}>
          either one + a learned noise head
        </text>
        <text x={880} y={514} fill={colors.MUTED} fontSize={13}>
          then audit the coverage — always
        </text>
      </g>

      <g opacity={closeU}>
        <text x={640} y={80} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
          probability is a promise · calibration is the audit
        </text>
      </g>
    </Camera>
  );
}

export function ProbDeep() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={{ file: 'src/viz/explainers/prob-deep/overrides.json', slug: 'prob-deep' }}>
        {renderFrame}
      </Player>
    </div>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
