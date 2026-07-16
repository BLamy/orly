import { Camera, MathLabel, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import overrides from './overrides.json';
import {
  BAR_MAX,
  BLOCK_KIND,
  BLOCK_NAME,
  BLOCK_W_PX,
  BLOCK_X,
  HIGHWAY_X0,
  HIGHWAY_X1,
  LANE_BOT,
  LANE_TOP,
  LANE_Y,
  NEIGHBORS,
  N_BLOCKS,
  N_PLAIN,
  PLAIN,
  RES,
  X0,
  buildScene,
  lerpVec,
  norm,
  valsAt,
} from './scene';

/**
 * The Residual Stream — a highway with editors.
 * Pure render: every visual value comes from the sampled SceneState or a
 * module-scope precomputation in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/residual-stream/overrides.json', slug: 'residual-stream' };

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// — bar-strip geometry ————————————————————————————————————————————————————
const INTRO_H = 150 / BAR_MAX; // px per unit, intro strip
const TOKEN_H = 34 / BAR_MAX; // px per unit, highway strips
const NORM_MAX = Math.max(...PLAIN.map(norm), ...RES.states.map(norm));

const KIND_COLOR: Record<'mlp' | 'attn', string> = {
  mlp: colors.TEAL,
  attn: colors.SECONDARY,
};

interface StripProps {
  x: number;
  y: number;
  vals: readonly number[];
  bw: number;
  gap: number;
  hScale: number;
  color: string;
  opacity?: number;
}

/** A hidden-state vector as a strip of signed bars around a baseline. */
function BarStrip({ x, y, vals, bw, gap, hScale, color, opacity = 1 }: StripProps) {
  if (opacity <= 0) return null;
  const total = vals.length * bw + (vals.length - 1) * gap;
  const x0 = x - total / 2;
  return (
    <g opacity={opacity}>
      <line x1={x0 - 6} y1={y} x2={x0 + total + 6} y2={y} stroke={colors.GRID} strokeWidth={1.4} />
      {vals.map((v, i) => {
        const h = v * hScale;
        return (
          <rect
            key={i}
            x={x0 + i * (bw + gap)}
            y={h >= 0 ? y - h : y}
            width={bw}
            height={Math.abs(h)}
            rx={2}
            fill={color}
            opacity={0.92}
          />
        );
      })}
    </g>
  );
}

/** The intro strip's displayed values — one pure function of three channels. */
function introVals(plainP: number, resetU: number, resP: number): number[] {
  if (resP > 0) return valsAt(RES.states, resP);
  if (resetU > 0) return lerpVec(PLAIN[N_PLAIN], X0, resetU);
  return valsAt(PLAIN, plainP);
}

/** fractional blocks passed by a strip at world x (drives neighbor bar values). */
function blocksPassed(x: number): number {
  let p = 0;
  for (let k = 0; k < N_BLOCKS; k++) p += clamp01((x - (BLOCK_X[k] - 40)) / 80);
  return p;
}

const arcD = (x1: number, y1: number, x2: number, y2: number): string =>
  `M${x1} ${y1} Q${(x1 + x2) / 2 - 70} ${(y1 + y2) / 2} ${x2} ${y2}`;

// — intro layout (screen-fixed) ————————————————————————————————————————————
const INTRO_X = 470;
const INTRO_Y = 370;
const GAUGE_X = 905;
const GAUGE_Y0 = 500;
const GAUGE_H = 250;

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const introU = s.get(scene.introU);
  const plainP = s.get(scene.plainProg);
  const resetU = s.get(scene.resetU);
  const resP = s.get(scene.resProg);
  const highwayU = s.get(scene.highwayU);
  const tokX = s.get(scene.tokX);
  const stateProg = s.get(scene.stateProg);
  const arcU = s.get(scene.arcU);
  const ghostU = s.get(scene.ghostU);
  const multiU = s.get(scene.multiU);
  const multiProg = s.get(scene.multiProg);
  const crossU = s.get(scene.crossU);
  const dimU = s.get(scene.dimU);

  // intro readouts
  const iVals = introVals(plainP, resetU, resP);
  const iNorm = norm(iVals);
  const stepLabel =
    resP > 0
      ? `add — block ${Math.round(resP * N_BLOCKS)} of ${N_BLOCKS}`
      : resetU > 0.5
        ? 'same input, new rule'
        : `replace — layer ${Math.round(plainP * N_PLAIN)} of ${N_PLAIN}`;

  // token state on the highway
  const tokVals = valsAt(RES.states, stateProg / N_BLOCKS);

  // the attention block the token is currently at (for the pull-in arcs)
  const attnX = tokX < (BLOCK_X[1] + BLOCK_X[3]) / 2 ? BLOCK_X[1] : BLOCK_X[3];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <g opacity={dimU}>
          {/* the highway and its editors */}
          {highwayU > 0 && (
            <g>
              <line
                x1={HIGHWAY_X0}
                y1={LANE_Y}
                x2={HIGHWAY_X0 + (HIGHWAY_X1 - HIGHWAY_X0) * highwayU}
                y2={LANE_Y}
                stroke={colors.GRID}
                strokeWidth={3}
              />
              {[LANE_TOP, LANE_BOT].map((y, i) => (
                <line
                  key={i}
                  x1={HIGHWAY_X0}
                  y1={y}
                  x2={HIGHWAY_X0 + (HIGHWAY_X1 - HIGHWAY_X0) * highwayU}
                  y2={y}
                  stroke={colors.GRID}
                  strokeWidth={1.6}
                  strokeDasharray="7 8"
                  opacity={0.25 + 0.55 * ghostU * Math.max(0.35, multiU)}
                />
              ))}
              {BLOCK_X.map((bx, k) => {
                const u = clamp01(highwayU * 1.6 - (k / (N_BLOCKS - 1)) * 0.6);
                const kind = BLOCK_KIND[k];
                return (
                  <g key={k} opacity={u}>
                    <rect
                      x={bx - BLOCK_W_PX / 2}
                      y={LANE_Y - 96}
                      width={BLOCK_W_PX}
                      height={192}
                      rx={14}
                      fill={colors.PANEL}
                      opacity={0.55}
                      stroke={KIND_COLOR[kind]}
                      strokeWidth={1.8}
                    />
                    <text
                      x={bx}
                      y={LANE_Y - 112}
                      textAnchor="middle"
                      fill={KIND_COLOR[kind]}
                      fontSize={16}
                    >
                      {BLOCK_NAME[kind]}
                    </text>
                    <MathLabel
                      tex={`+\\,f_{${k + 1}}(x)`}
                      x={bx}
                      y={LANE_Y + 122}
                      fontSize={16}
                      color={colors.MUTED}
                      opacity={u}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* attention pull-in arcs from the neighbor streams */}
          {arcU > 0 && (
            <g opacity={arcU}>
              <path
                d={arcD(attnX - 190, LANE_TOP, attnX, LANE_Y - 96)}
                fill="none"
                stroke={colors.SECONDARY}
                strokeWidth={2.4}
              />
              <path
                d={arcD(attnX - 190, LANE_BOT, attnX, LANE_Y + 96)}
                fill="none"
                stroke={colors.SECONDARY}
                strokeWidth={2.4}
              />
              <circle cx={attnX - 190} cy={LANE_TOP} r={7} fill={colors.SECONDARY} />
              <circle cx={attnX - 190} cy={LANE_BOT} r={7} fill={colors.SECONDARY} />
            </g>
          )}

          {/* the hero token: one vector riding the stream, never replaced */}
          {highwayU > 0 && (
            <g>
              <circle cx={tokX} cy={LANE_Y} r={13} fill={colors.ACCENT} opacity={0.2} />
              <BarStrip
                x={tokX}
                y={LANE_Y}
                vals={tokVals}
                bw={11}
                gap={4}
                hScale={TOKEN_H}
                color={colors.ACCENT}
                opacity={highwayU}
              />
            </g>
          )}

          {/* the block's computed update, sliding down and summing in */}
          {scene.dShow.map((ch, k) => {
            const show = s.get(ch);
            const merge = s.get(scene.dMerge[k]);
            const op = show * (1 - merge);
            if (op <= 0.01) return null;
            const dy = LANE_Y - 156 + merge * 156;
            return (
              <g key={k}>
                <BarStrip
                  x={BLOCK_X[k]}
                  y={dy}
                  vals={RES.deltas[k]}
                  bw={11}
                  gap={4}
                  hScale={TOKEN_H}
                  color={colors.WARM}
                  opacity={op}
                />
                <MathLabel
                  tex="+"
                  x={BLOCK_X[k] - 74}
                  y={(dy + LANE_Y) / 2}
                  fontSize={26}
                  color={colors.WARM}
                  opacity={op}
                />
              </g>
            );
          })}

          {/* many tokens: the neighbor streams carry their own vectors */}
          {multiU > 0 && (
            <g opacity={multiU}>
              {NEIGHBORS.map((nb, i) => {
                const y = i === 0 ? LANE_TOP : LANE_BOT;
                const x = 260 + multiProg * 1560 + (i === 0 ? -140 : -280);
                const vals = valsAt(nb.states, blocksPassed(x) / N_BLOCKS);
                return (
                  <BarStrip
                    key={i}
                    x={x}
                    y={y}
                    vals={vals}
                    bw={11}
                    gap={4}
                    hScale={TOKEN_H}
                    color={colors.POSITIVE}
                  />
                );
              })}
              {crossU > 0 &&
                [BLOCK_X[1], BLOCK_X[3]].map((bx) => (
                  <g key={bx} opacity={crossU}>
                    <path
                      d={arcD(bx - 40, LANE_TOP, bx, LANE_Y - 60)}
                      fill="none"
                      stroke={colors.SECONDARY}
                      strokeWidth={2}
                      opacity={0.8}
                    />
                    <path
                      d={arcD(bx - 40, LANE_BOT, bx, LANE_Y + 60)}
                      fill="none"
                      stroke={colors.SECONDARY}
                      strokeWidth={2}
                      opacity={0.8}
                    />
                  </g>
                ))}
            </g>
          )}
        </g>
      </Camera>

      {/* — intro: replace vs add, with a live strength readout (screen-fixed) */}
      {introU > 0 && (
        <g opacity={introU}>
          <BarStrip
            x={INTRO_X}
            y={INTRO_Y}
            vals={iVals}
            bw={40}
            gap={16}
            hScale={INTRO_H}
            color={resP > 0 ? colors.POSITIVE : resetU > 0.5 ? colors.ACCENT : colors.ACCENT}
          />
          <text x={INTRO_X} y={INTRO_Y + 195} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            {stepLabel}
          </text>
          <text x={INTRO_X} y={135} textAnchor="middle" fill={colors.TEXT} fontSize={20}>
            one token&apos;s hidden state
          </text>

          {/* the norm gauge */}
          <rect
            x={GAUGE_X - 22}
            y={GAUGE_Y0 - GAUGE_H}
            width={44}
            height={GAUGE_H}
            rx={8}
            fill={colors.PANEL}
            stroke={colors.GRID}
          />
          <rect
            x={GAUGE_X - 16}
            y={GAUGE_Y0 - 6 - (GAUGE_H - 12) * clamp01(iNorm / NORM_MAX)}
            width={32}
            height={(GAUGE_H - 12) * clamp01(iNorm / NORM_MAX)}
            rx={5}
            fill={iNorm / NORM_MAX < 0.2 ? colors.NEGATIVE : colors.POSITIVE}
          />
          <MathLabel
            tex="\lVert x \rVert"
            x={GAUGE_X}
            y={GAUGE_Y0 - GAUGE_H - 34}
            fontSize={22}
            opacity={introU}
          />
          <text x={GAUGE_X} y={GAUGE_Y0 + 32} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            {iNorm.toFixed(2)}
          </text>
        </g>
      )}

      {/* the fix, stated */}
      <MathLabel
        tex="x \;\leftarrow\; x + f(x)"
        x={640}
        y={80}
        fontSize={30}
        color={colors.WARM}
        opacity={s.get(scene.resTexU)}
      />

      {/* recap card */}
      {s.get(scene.recapTexU) > 0 && (
        <g opacity={s.get(scene.recapTexU)}>
          <MathLabel
            tex="x_{\text{out}} \;=\; x_{\text{in}} \;+\; f_1 \;+\; f_2 \;+\; f_3 \;+\; f_4"
            x={640}
            y={300}
            fontSize={32}
            color={colors.TEXT}
          />
          <text x={640} y={380} textAnchor="middle" fill={colors.MUTED} fontSize={21}>
            read &middot; compute &middot; add — a stack of editors, one shared manuscript
          </text>
        </g>
      )}
    </>
  );
}

export function ResidualStream() {
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
