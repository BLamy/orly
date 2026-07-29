import { Camera, Player, colors, mulberry32 } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  JITTER,
  OBS_C_MEAN,
  OBS_DIFF,
  OBS_SEV_C,
  OBS_SEV_T,
  OBS_T_MEAN,
  OBS_VIS,
  PANEL,
  RCT_C_MEAN,
  RCT_DIFF,
  RCT_SEV_C,
  RCT_SEV_T,
  RCT_T_MEAN,
  RCT_VIS,
  buildScene,
  yScale,
} from './scene';
import type { Patient } from './scene';

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/** deterministic horizontal jitter per point */
const JIT: number[] = (() => {
  const r = mulberry32(77);
  return Array.from({ length: 240 }, () => (r() - 0.5) * 2);
})();

/** severity → color (mild teal → severe red) */
function sevColor(sv: number): string {
  const a = [45, 212, 191]; // TEAL
  const b = [251, 113, 133]; // NEGATIVE
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * sv)).join(',')})`;
}

function panel(
  key: 'obs' | 'rct',
  title: string,
  vis: Patient[],
  prog: number,
  barU: number,
  sevU: number,
  means: { t: number; c: number; sevT: number; sevC: number },
  diff: number,
  diffColor: string,
  jitOffset: number,
) {
  const P = PANEL[key];
  return (
    <g key={key}>
      <rect x={P.x0} y={140} width={P.w} height={490} rx={14} fill={colors.PANEL} fillOpacity={0.35} stroke={colors.GRID} opacity={clamp01(prog * 6)} />
      <text x={P.x0 + P.w / 2} y={128} textAnchor="middle" fill={colors.TEXT} fontSize={16} opacity={clamp01(prog * 6)}>
        {title}
      </text>
      <text x={P.cx} y={166} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={clamp01(prog * 6)}>
        control
      </text>
      <text x={P.tx} y={166} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={clamp01(prog * 6)}>
        treated
      </text>
      {vis.map((p, i) => {
        const u = clamp01(prog * vis.length - i);
        const cx = (p.t ? P.tx : P.cx) + JIT[(i + jitOffset) % 240] * JITTER;
        return (
          <circle
            key={i}
            cx={cx}
            cy={yScale(p.y)}
            r={3.4 * u}
            fill={sevU > 0.02 ? sevColor(p.s) : colors.MUTED}
            fillOpacity={0.75}
          />
        );
      })}
      {/* arm means */}
      <g opacity={barU}>
        <line x1={P.cx - JITTER - 8} y1={yScale(means.c)} x2={P.cx + JITTER + 8} y2={yScale(means.c)} stroke={colors.TEXT} strokeWidth={3} />
        <line x1={P.tx - JITTER - 8} y1={yScale(means.t)} x2={P.tx + JITTER + 8} y2={yScale(means.t)} stroke={colors.TEXT} strokeWidth={3} />
        <rect x={P.x0 + 90} y={190} width={P.w - 180} height={36} rx={9} fill={colors.PANEL} fillOpacity={0.95} stroke={diffColor} />
        <text x={P.x0 + P.w / 2} y={214} textAnchor="middle" fill={diffColor} fontSize={15}>
          treated − control = {diff >= 0 ? '+' : ''}
          {diff.toFixed(2)}
        </text>
      </g>
      {/* severity balance chips */}
      <g opacity={sevU * clamp01(prog * 4)}>
        <text x={P.cx} y={620} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
          mean severity {means.sevC.toFixed(2)}
        </text>
        <text x={P.tx} y={620} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
          mean severity {means.sevT.toFixed(2)}
        </text>
      </g>
    </g>
  );
}

function renderFrame(s: SceneState) {
  const obsP = s.get(scene.obsP);
  const obsBarU = s.get(scene.obsBarU);
  const sevU = s.get(scene.sevU);
  const coinU = s.get(scene.coinU);
  const rctP = s.get(scene.rctP);
  const rctBarU = s.get(scene.rctBarU);
  const verdictU = s.get(scene.verdictU);
  const priceU = s.get(scene.priceU);
  const closeU = s.get(scene.closeU);

  return (
    <Camera {...s.get(scene.cam)}>
      {panel(
        'obs',
        'observational — the sick self-select',
        OBS_VIS,
        obsP,
        obsBarU,
        sevU,
        { t: OBS_T_MEAN, c: OBS_C_MEAN, sevT: OBS_SEV_T, sevC: OBS_SEV_C },
        OBS_DIFF,
        colors.NEGATIVE,
        0,
      )}
      {panel(
        'rct',
        'randomized — a coin decides',
        RCT_VIS,
        rctP,
        rctBarU,
        sevU,
        { t: RCT_T_MEAN, c: RCT_C_MEAN, sevT: RCT_SEV_T, sevC: RCT_SEV_C },
        RCT_DIFF,
        colors.POSITIVE,
        97,
      )}

      {/* the coin */}
      <g opacity={coinU}>
        <circle cx={640} cy={100} r={26} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={2.5} />
        <text x={640} y={106} textAnchor="middle" fill={colors.WARM} fontSize={16}>
          ½
        </text>
      </g>

      {/* the verdict */}
      <g opacity={verdictU}>
        <rect x={430} y={60} width={420} height={40} rx={10} fill={colors.PANEL} fillOpacity={0.95} stroke={colors.GRID} />
        <text x={640} y={86} textAnchor="middle" fill={colors.TEXT} fontSize={15}>
          true effect wired in: +0.50
        </text>
      </g>

      {/* the price */}
      <g opacity={priceU}>
        <rect x={430} y={60} width={420} height={40} rx={10} fill={colors.PANEL} fillOpacity={0.95} stroke={colors.GRID} />
        <text x={640} y={86} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
          trials: slow · expensive · sometimes unethical
        </text>
      </g>

      <g opacity={closeU}>
        <text x={640} y={88} textAnchor="middle" fill={colors.TEXT} fontSize={17}>
          the coin listens to nothing — that is its power
        </text>
      </g>
    </Camera>
  );
}

export function CausalRct() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={{ file: 'src/viz/explainers/causal-rct/overrides.json', slug: 'causal-rct' }}>
        {renderFrame}
      </Player>
    </div>
  );
}

export function Render({ s }: { s: SceneState }) {
  return renderFrame(s);
}
export const vizScene = () => scene;
