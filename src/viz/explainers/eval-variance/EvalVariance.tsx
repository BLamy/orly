import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  HB_BINS,
  HB_MAX,
  HB_MIN,
  HH,
  HIST_A,
  HIST_A_BIG,
  HIST_B,
  HIST_B_BIG,
  HIST_MAX_BIG,
  HIST_MAX_SMALL,
  HY0,
  P_B_WORSE,
  P_B_WORSE_BIG,
  SIGMA_BIG,
  SIGMA_SMALL,
  buildScene,
  hx,
} from './scene';

/**
 * Variance and Significance — pure render. Both histograms and every
 * probability come from the seeded resampling runs in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/eval-variance/overrides.json', slug: 'eval-variance' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const BIN_W = (hx(HB_MAX) - hx(HB_MIN)) / HB_BINS;

function Hist({
  small,
  big,
  maxSmall,
  maxBig,
  bigW,
  reveal,
  color,
  shift,
}: {
  small: number[];
  big: number[];
  maxSmall: number;
  maxBig: number;
  bigW: number;
  reveal: number;
  color: string;
  shift: number;
}) {
  return (
    <g>
      {small.map((c, b) => {
        const u = clamp01(reveal * 1.4 - b / HB_BINS);
        const hSmall = (c / maxSmall) * HH;
        const hBig = (big[b] / maxBig) * HH;
        const h = lerp(hSmall, hBig, bigW) * u;
        if (h <= 0.4) return null;
        return (
          <rect
            key={b}
            x={hx(HB_MIN) + b * BIN_W + shift}
            y={HY0 - h}
            width={BIN_W - 1.5}
            height={h}
            rx={2}
            fill={color}
            opacity={0.62}
          />
        );
      })}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const markU = s.get(scene.markU);
  const histAU = s.get(scene.histAU);
  const histBU = s.get(scene.histBU);
  const bigW = s.get(scene.bigW);
  const statU = s.get(scene.statU);
  const dimU = s.get(scene.dimU);
  const endU = s.get(scene.endU);

  const pWorse = lerp(P_B_WORSE, P_B_WORSE_BIG, bigW);
  const sigma = lerp(SIGMA_SMALL, SIGMA_BIG, bigW);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* axis */}
          <line x1={hx(HB_MIN)} y1={HY0} x2={hx(HB_MAX)} y2={HY0} stroke={colors.GRID} opacity={markU} />
          {[60, 65, 70, 75, 80].map((p) => (
            <g key={p} opacity={markU}>
              <line x1={hx(p)} y1={HY0} x2={hx(p)} y2={HY0 + 6} stroke={colors.MUTED} />
              <text x={hx(p)} y={HY0 + 26} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                {p}
              </text>
            </g>
          ))}
          <text x={hx(HB_MAX)} y={HY0 + 26} textAnchor="end" fill={colors.MUTED} fontSize={13} opacity={markU}>
            benchmark score →
          </text>

          {/* headline markers */}
          {markU > 0 && (
            <g opacity={markU}>
              <line x1={hx(70)} y1={HY0 - HH - 26} x2={hx(70)} y2={HY0} stroke={colors.ACCENT} strokeWidth={2} strokeDasharray="6 6" opacity={0.8} />
              <text x={hx(70) - 8} y={HY0 - HH - 34} textAnchor="end" fill={colors.ACCENT} fontSize={14.5}>
                old model: 70
              </text>
              <line x1={hx(71)} y1={HY0 - HH - 26} x2={hx(71)} y2={HY0} stroke={colors.WARM} strokeWidth={2} strokeDasharray="6 6" opacity={0.8} />
              <text x={hx(71) + 8} y={HY0 - HH - 34} fill={colors.WARM} fontSize={14.5}>
                new model: 71
              </text>
            </g>
          )}

          {/* histograms */}
          {histAU > 0 && (
            <Hist small={HIST_A} big={HIST_A_BIG} maxSmall={HIST_MAX_SMALL} maxBig={HIST_MAX_BIG} bigW={bigW} reveal={histAU} color={colors.ACCENT} shift={0} />
          )}
          {histBU > 0 && (
            <Hist small={HIST_B} big={HIST_B_BIG} maxSmall={HIST_MAX_SMALL} maxBig={HIST_MAX_BIG} bigW={bigW} reveal={histBU} color={colors.WARM} shift={0} />
          )}
          {histAU > 0.5 && (
            <text x={hx(HB_MIN) + 4} y={HY0 - HH - 4} fill={colors.MUTED} fontSize={13.5}>
              {bigW > 0.5
                ? '240 simulated evals each, 10,000 questions'
                : '2000 simulated evals each, 100 questions'}
            </text>
          )}
        </g>
      </Camera>

      {/* screen-fixed math */}
      <MathLabel
        tex={'\\sigma = \\sqrt{p(1-p)/n}'}
        x={1080}
        y={70}
        fontSize={20}
        color={colors.WARM}
        opacity={s.get(scene.mathU)}
      />

      {/* verdict panel */}
      {statU > 0 && (
        <g opacity={statU * dimU}>
          <rect x={72} y={92} width={352} height={118} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={94} y={124} fill={colors.TEXT} fontSize={15} fontWeight={600}>
            {bigW > 0.5 ? 'n = 10,000 questions' : 'n = 100 questions'}
          </text>
          <text x={94} y={154} fill={colors.MUTED} fontSize={14.5}>
            {`score noise σ ≈ ${sigma.toFixed(sigma < 1 ? 2 : 1)} points`}
          </text>
          <text x={94} y={184} fill={pWorse > 0.1 ? colors.NEGATIVE : colors.POSITIVE} fontSize={15} fontWeight={600}>
            {`better model loses ${(pWorse * 100).toFixed(pWorse > 0.1 ? 0 : 1)}% of reruns`}
          </text>
        </g>
      )}

      {/* clean ending card */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={230} y={214} width={820} height={220} rx={16} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={284} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={650}>
            A One-Point Gain
          </text>
          <MathLabel
            tex={'+1 \\text{ pt at } n{=}100:\\;\\; P(\\text{better loses rerun}) = 0.47'}
            x={640}
            y={340}
            fontSize={20}
            color={colors.NEGATIVE}
            opacity={endU}
          />
          <text x={640} y={398} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            a coin flip wearing a lab coat — until you buy enough questions
          </text>
        </g>
      )}
    </>
  );
}

export function EvalVariance() {
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
