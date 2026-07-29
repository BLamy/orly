import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BAR_W,
  BASE_Y,
  CHART_L,
  CHART_R,
  GREEDY_CONT,
  N_SAMPLES,
  N_WORDS,
  P_07,
  P_TOPK,
  SAMPLED_CONT,
  SAMPLED_WORD,
  SAMPLES,
  SAMPLE_STACK,
  TOP_K,
  TREE,
  WORDS,
  barCX,
  barTopY,
  barX,
  buildScene,
  distAt,
  tempAt,
  xBand,
} from './scene';

/**
 * Sampling — temperature, and choosing the next word.
 * Pure render: one persistent bar chart morphs through real softmax
 * distributions; every value comes from the sampled SceneState or from the
 * module-scope math in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/sampling-temperature/overrides.json',
  slug: 'sampling-temperature',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const BAR_STAGGER = 0.6;

// — the temperature dial (screen-fixed, top-right) —
const DIAL = { x: 1085, y: 168, r: 52 } as const;
const T_LO = Math.log(0.2);
const T_HI = Math.log(3);
/** dial needle angle (radians from 12 o'clock), log-scaled over [0.2, 3] */
const dialAngle = (T: number): number => {
  const u = clamp01((Math.log(T) - T_LO) / (T_HI - T_LO));
  return (-2.1 + 4.2 * u) * (Math.PI / 2) * 0.66;
};
const arcPath = (): string => {
  const a0 = dialAngle(0.2);
  const a1 = dialAngle(3);
  const px = (a: number) => DIAL.x + DIAL.r * Math.sin(a);
  const py = (a: number) => DIAL.y - DIAL.r * Math.cos(a);
  return `M${px(a0).toFixed(1)} ${py(a0).toFixed(1)} A${DIAL.r} ${DIAL.r} 0 0 1 ${px(a1).toFixed(1)} ${py(a1).toFixed(1)}`;
};
const DIAL_ARC = arcPath();

function TempDial({ T, u }: { T: number; u: number }) {
  if (u <= 0) return null;
  const hasT = !Number.isNaN(T);
  const a = dialAngle(hasT ? T : 1);
  return (
    <g opacity={u}>
      <path d={DIAL_ARC} fill="none" stroke={colors.GRID} strokeWidth={5} strokeLinecap="round" />
      {hasT && (
        <line
          x1={DIAL.x}
          y1={DIAL.y}
          x2={DIAL.x + (DIAL.r - 9) * Math.sin(a)}
          y2={DIAL.y - (DIAL.r - 9) * Math.cos(a)}
          stroke={colors.WARM}
          strokeWidth={3.4}
          strokeLinecap="round"
        />
      )}
      <circle cx={DIAL.x} cy={DIAL.y} r={5} fill={colors.WARM} />
      <text x={DIAL.x - DIAL.r - 6} y={DIAL.y + 26} fill={colors.TEAL} fontSize={12} textAnchor="middle">
        cold
      </text>
      <text x={DIAL.x + DIAL.r + 6} y={DIAL.y + 26} fill={colors.NEGATIVE} fontSize={12} textAnchor="middle">
        hot
      </text>
      <text x={DIAL.x} y={DIAL.y + 46} fill={colors.TEXT} fontSize={17} textAnchor="middle" fontStyle="italic">
        {hasT ? `T = ${T.toFixed(1)}` : 'T'}
      </text>
    </g>
  );
}

/** One branch of the divergence tree: elbow line → word chip → continuation. */
function Branch({
  y,
  word,
  cont,
  color,
  tag,
  u,
}: {
  y: number;
  word: string;
  cont: string;
  color: string;
  tag: string;
  u: number;
}) {
  if (u <= 0) return null;
  const seg1 = clamp01(u / 0.45); // root → word
  const chipU = clamp01((u - 0.4) / 0.2);
  const seg2 = clamp01((u - 0.55) / 0.45); // word → continuation
  const sx = TREE.splitX;
  const sy = TREE.rootY;
  const ex = TREE.wordX - 52;
  return (
    <g>
      <path
        d={`M${sx} ${sy} L${lerp(sx, sx + (ex - sx) * 0.45, seg1)} ${lerp(sy, y, seg1)} ${seg1 >= 1 ? `L${ex} ${y}` : seg1 > 0.5 ? `L${lerp(sx + (ex - sx) * 0.45, ex, (seg1 - 0.5) * 2)} ${y}` : ''}`}
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        opacity={0.85}
      />
      <g opacity={chipU}>
        <rect x={TREE.wordX - 50} y={y - 19} width={100} height={38} rx={9} fill={colors.PANEL} stroke={color} strokeWidth={1.6} />
        <text x={TREE.wordX} y={y + 6} textAnchor="middle" fill={colors.TEXT} fontSize={19} fontWeight={600}>
          {word}
        </text>
        <text x={TREE.wordX} y={y - 30} textAnchor="middle" fill={color} fontSize={13} fontStyle="italic">
          {tag}
        </text>
      </g>
      {seg2 > 0 && (
        <g>
          <line x1={TREE.wordX + 52} y1={y} x2={lerp(TREE.wordX + 52, TREE.contX - 8, seg2)} y2={y} stroke={color} strokeWidth={2.4} opacity={0.85} />
          <text x={TREE.contX} y={y + 6} fill={colors.TEXT} fontSize={19} opacity={clamp01((seg2 - 0.6) / 0.4)} fontStyle="italic">
            {cont}
          </text>
        </g>
      )}
    </g>
  );
}

const RECAP = ['directions', 'order', 'many heads', 'one stream', 'a choice'] as const;
const RECAP_Y = 330;
const RECAP_XS = [200, 420, 640, 860, 1080] as const;

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const barsU = s.get(scene.barsU);
  const chartOp = s.get(scene.chartOp);
  const promptU = s.get(scene.promptU);
  const distIdx = s.get(scene.distIdx);
  const axisProbU = s.get(scene.axisProbU);
  const dialU = s.get(scene.dialU);
  const pctU = s.get(scene.pctU);
  const moonPctU = s.get(scene.moonPctU);
  const sampleN = s.get(scene.sampleN);
  const tallyOp = s.get(scene.tallyOp);
  const greedyU = s.get(scene.greedyU);
  const treeU = s.get(scene.treeU);
  const topkU = s.get(scene.topkU);
  const cutU = s.get(scene.cutU);
  const topkPctU = s.get(scene.topkPctU);
  const recapU = s.get(scene.recapU);
  const closeU = s.get(scene.closeU);

  const dist = distAt(distIdx);
  const heights = dist.map((h, i) => lerp(h, P_TOPK[i], topkU));
  const T = tempAt(distIdx);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        {/* the prompt */}
        <g opacity={promptU * Math.max(chartOp, 0.4)}>
          <text x={640} y={92} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontStyle="italic">
            The cat sat on the
            <tspan fill={colors.WARM}> ___</tspan>
          </text>
        </g>

        {/* the chart — the ONE persistent centerpiece */}
        <g opacity={chartOp}>
          {/* baseline + probability gridlines */}
          <line x1={CHART_L} y1={BASE_Y} x2={CHART_R} y2={BASE_Y} stroke={colors.GRID} strokeWidth={1.5} />
          <g opacity={axisProbU * 0.6}>
            {[0.25, 0.5, 0.75, 1].map((p) => (
              <g key={p}>
                <line x1={CHART_L} y1={barTopY(p)} x2={CHART_R} y2={barTopY(p)} stroke={colors.GRID} strokeWidth={0.8} strokeDasharray="2 6" />
                <text x={CHART_L - 10} y={barTopY(p) + 4} textAnchor="end" fill={colors.MUTED} fontSize={11}>
                  {p.toFixed(2)}
                </text>
              </g>
            ))}
          </g>
          {/* axis label morphs meaning: raw score → probability */}
          <text x={CHART_L} y={barTopY(1) - 18} fill={colors.MUTED} fontSize={14} fontStyle="italic">
            {axisProbU < 0.5 ? 'raw score (logit)' : 'probability'}
          </text>

          {/* bars */}
          {WORDS.map((w, i) => {
            const grow = clamp01(barsU * (1 + BAR_STAGGER) - (i / (N_WORDS - 1)) * BAR_STAGGER);
            const h = heights[i] * grow;
            const tail = i >= TOP_K ? 1 - 0.78 * cutU : 1;
            return (
              <g key={w} opacity={tail}>
                <rect
                  x={barX(i)}
                  y={barTopY(h)}
                  width={BAR_W}
                  height={Math.max(0, BASE_Y - barTopY(h))}
                  rx={4}
                  fill={i === 0 ? colors.ACCENT : colors.SECONDARY}
                  opacity={i === 0 ? 0.95 : 0.75}
                />
                <text x={barCX(i)} y={BASE_Y + 24} textAnchor="middle" fill={colors.MUTED} fontSize={13.5}>
                  {w}
                </text>
              </g>
            );
          })}

          {/* the top-probability annotation (mat) */}
          {pctU > 0 && axisProbU > 0.5 && (
            <text
              x={barCX(0)}
              y={barTopY(heights[0]) - (greedyU > 0 ? 34 : 12)}
              textAnchor="middle"
              fill={colors.ACCENT}
              fontSize={17}
              fontWeight={600}
              opacity={pctU}
            >
              {`${(heights[0] * 100).toFixed(heights[0] > 0.99 ? 1 : 0)}%`}
            </text>
          )}

          {/* the moon annotation on the hot beat */}
          {moonPctU > 0 && (
            <text x={barCX(10)} y={barTopY(heights[10]) - 10} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} opacity={moonPctU}>
              {`${(heights[10] * 100).toFixed(1)}%`}
            </text>
          )}

          {/* greedy marker: always mat */}
          {greedyU > 0 && (
            <g opacity={greedyU}>
              <text x={barCX(0)} y={barTopY(heights[0]) - 12} textAnchor="middle" fill={colors.WARM} fontSize={14} fontStyle="italic">
                greedy: always here
              </text>
            </g>
          )}

          {/* sampled tallies at T = 0.7 — ten REAL seeded draws */}
          {tallyOp > 0 &&
            SAMPLES.map((w, j) => {
              const u = clamp01(sampleN - j);
              if (u <= 0) return null;
              const y = barTopY(P_07[w]) - 16 - SAMPLE_STACK[j] * 15;
              return (
                <g key={j} opacity={tallyOp} transform={`translate(${barCX(w)} ${y}) scale(${0.5 + 0.5 * u})`}>
                  <rect x={-11} y={-5} width={22} height={10} rx={5} fill={colors.POSITIVE} opacity={0.9 * u} />
                </g>
              );
            })}
          {tallyOp > 0 && sampleN > 0 && (
            <text x={CHART_R - 4} y={barTopY(1) - 18} textAnchor="end" fill={colors.POSITIVE} fontSize={14} opacity={tallyOp}>
              {`draws: ${Math.min(N_SAMPLES, Math.floor(sampleN))} of ${N_SAMPLES}`}
            </text>
          )}

          {/* the top-k cut */}
          {cutU > 0 && (
            <g opacity={cutU}>
              <line x1={xBand(TOP_K)} y1={barTopY(1) - 6} x2={xBand(TOP_K)} y2={BASE_Y + 30} stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="7 5" />
              <text x={xBand(TOP_K) + 10} y={barTopY(1) + 6} fill={colors.NEGATIVE} fontSize={14} fontStyle="italic">
                keep 3 — cut the tail
              </text>
            </g>
          )}
          {topkPctU > 0 &&
            P_TOPK.slice(0, TOP_K).map((p, i) => (
              <text key={i} x={barCX(i)} y={barTopY(heights[i]) - 12} textAnchor="middle" fill={i === 0 ? colors.ACCENT : colors.SECONDARY} fontSize={15} fontWeight={600} opacity={topkPctU}>
                {`${(p * 100).toFixed(1)}%`}
              </text>
            ))}
        </g>

        {/* the divergence tree (over the whisper-faded chart) */}
        {treeU > 0 && (
          <g opacity={treeU}>
            <rect x={TREE.rootX - 60} y={TREE.rootY - 24} width={280} height={48} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={TREE.rootX + 80} y={TREE.rootY + 6} textAnchor="middle" fill={colors.TEXT} fontSize={17} fontStyle="italic">
              The cat sat on the …
            </text>
            <line x1={TREE.rootX + 220} y1={TREE.rootY} x2={TREE.splitX} y2={TREE.rootY} stroke={colors.MUTED} strokeWidth={2} />
            <Branch y={TREE.greedyY} word={WORDS[0]} cont={GREEDY_CONT} color={colors.WARM} tag="greedy — every time" u={s.get(scene.greedyPathU)} />
            <Branch y={TREE.sampledY} word={WORDS[SAMPLED_WORD]} cont={SAMPLED_CONT} color={colors.POSITIVE} tag="sampled — this time" u={s.get(scene.sampledPathU)} />
          </g>
        )}
      </Camera>

      {/* screen-fixed: the softmax equation */}
      <MathLabel
        tex={'p_i = \\dfrac{e^{z_i/T}}{\\sum_j e^{z_j/T}}'}
        x={168}
        y={128}
        anchor="start"
        fontSize={23}
        color={colors.TEXT}
        opacity={s.get(scene.softTexU)}
      />

      {/* screen-fixed: the temperature dial */}
      <TempDial T={T} u={dialU} />

      {/* the book recap: five stations of the journey */}
      {recapU > 0 && (
        <g>
          {RECAP.map((label, i) => {
            const u = clamp01(recapU * (RECAP.length + 1) - i * 1.05);
            const x = RECAP_XS[i];
            return (
              <g key={label} opacity={u}>
                <circle cx={x} cy={RECAP_Y} r={7} fill={i === RECAP.length - 1 ? colors.WARM : colors.ACCENT} />
                <text x={x} y={RECAP_Y + 36} textAnchor="middle" fill={colors.TEXT} fontSize={17}>
                  {label}
                </text>
                {i < RECAP.length - 1 && (
                  <line x1={x + 16} y1={RECAP_Y} x2={x + 16 + (RECAP_XS[i + 1] - x - 32) * clamp01(u * 1.4)} y2={RECAP_Y} stroke={colors.GRID} strokeWidth={2} />
                )}
              </g>
            );
          })}
        </g>
      )}

      {/* closing line */}
      {closeU > 0 && (
        <text x={640} y={452} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontStyle="italic" opacity={closeU}>
          weighed, warmed — and{' '}
          <tspan fill={colors.WARM} fontWeight={600}>
            chosen
          </tspan>
          .
        </text>
      )}
    </>
  );
}

export function SamplingTemperature() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

/** Uniform embed surface for the book player — see src/viz/scenes.ts. */
export { Frame as Render };
/** The module-scope scene (overrides already applied); its `.tl` drives embedding. */
export const vizScene = () => scene;
