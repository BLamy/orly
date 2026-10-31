import { scaleLinear } from 'd3';
import { Camera, Player, STAGE_H, STAGE_W, colors } from '../../core';
import type { SceneState, TimelineOverrides } from '../../core';
import { Axes, ContourField, FunctionPlot } from '../../primitives';
import overrides from './overrides.json';
import {
  CO,
  COLD,
  ETA_HI,
  ETA_LO,
  HI,
  LO,
  LOSS,
  N_STEPS,
  START,
  WARM,
  W_START,
  buildScene,
  clamp01,
  cosEta,
  logLossAt,
  pathAt,
  xScale,
  yScale,
} from './scene';
import type { Pt } from './scene';

/**
 * Learning-Rate Schedules — pure render. Every visual value comes from the
 * sampled SceneState or a module-scope precomputation in scene.ts.
 */

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = { file: 'src/viz/explainers/lr-schedules/overrides.json', slug: 'lr-schedules' };

/** px per landscape unit (uniform in x and y) */
const UNIT = xScale(1) - xScale(0);

// — contours: depth ramp on the core heat scale (deep = bright, high = dim)
const THRESHOLDS = 14;
const contourColor = (_level: number, i: number): string =>
  colors.heat(0.88 - (0.62 * i) / (THRESHOLDS - 1));

// — the two right-hand panels (screen space)
const PANEL_X = 916;
const PANEL_W = 348;
const SP_Y = 78; // schedule panel
const SP_H = 226;
const LP_Y = 318; // loss panel
const LP_H = 292;

// plot areas leave room below for tick labels, and the equation / stat rows
const xSched = scaleLinear().domain([0, N_STEPS]).range([PANEL_X + 40, PANEL_X + PANEL_W - 22]);
const ySched = scaleLinear().domain([0, 0.22]).range([SP_Y + SP_H - 80, SP_Y + 66]);
const xLossP = scaleLinear().domain([0, N_STEPS]).range([PANEL_X + 40, PANEL_X + PANEL_W - 22]);
const yLossP = scaleLinear().domain([-2.6, 1.2]).range([LP_Y + LP_H - 70, LP_Y + 44]);

const fEtaHi = (): number => ETA_HI;
const fEtaLo = (): number => ETA_LO;
const fHiLoss = (s: number): number => logLossAt(HI.avgLoss, s);
const fLoLoss = (s: number): number => logLossAt(LO.avgLoss, s);
const fCoLoss = (s: number): number => logLossAt(CO.avgLoss, s);

/** Path `d` for a trajectory polyline between (fractional) step indices. */
function traceD(pts: readonly Pt[], from: number, to: number): string {
  if (to <= 0) return '';
  const a = Math.max(0, Math.floor(from));
  const b = Math.min(pts.length - 1, to);
  const bi = Math.floor(b);
  if (bi < a) return '';
  const parts: string[] = [`M${xScale(pts[a][0]).toFixed(1)} ${yScale(pts[a][1]).toFixed(1)}`];
  for (let i = a + 1; i <= bi; i++) {
    parts.push(`L${xScale(pts[i][0]).toFixed(1)} ${yScale(pts[i][1]).toFixed(1)}`);
  }
  if (b > bi && bi + 1 < pts.length) {
    const t = b - bi;
    const p = pts[bi];
    const q = pts[bi + 1];
    parts.push(
      `L${xScale(p[0] + (q[0] - p[0]) * t).toFixed(1)} ${yScale(p[1] + (q[1] - p[1]) * t).toFixed(1)}`,
    );
  }
  return parts.join('');
}

const RECENT = 55; // the bright "recent" window of a trail, in steps

function Trail({
  pts,
  prog,
  u,
  color,
}: {
  pts: readonly Pt[];
  prog: number;
  u: number;
  color: string;
}) {
  if (u <= 0 || prog <= 0) return null;
  const idx = clamp01(prog) * (pts.length - 1);
  return (
    <g>
      <path
        d={traceD(pts, 0, idx)}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        opacity={0.3 * u}
      />
      <path
        d={traceD(pts, idx - RECENT, idx)}
        fill="none"
        stroke={color}
        strokeWidth={2.6}
        strokeLinejoin="round"
        opacity={0.85 * u}
      />
    </g>
  );
}

function Ball({ p, u, color }: { p: Pt; u: number; color: string }) {
  if (u <= 0) return null;
  const [cx, cy] = [xScale(p[0]), yScale(p[1])];
  return (
    <g opacity={Math.min(1, u)}>
      <circle cx={cx} cy={cy} r={16} fill={color} opacity={0.22} />
      <circle cx={cx} cy={cy} r={8 * Math.min(1, u)} fill={color} stroke={colors.BG} strokeWidth={1.5} />
    </g>
  );
}

function LegendRow({ x, y, color, label, u }: { x: number; y: number; color: string; label: string; u: number }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      <rect x={x} y={y - 6} width={18} height={4} rx={2} fill={color} />
      <text x={x + 26} y={y} fill={colors.TEXT} fontSize={14}>
        {label}
      </text>
    </g>
  );
}

/**
 * Loss-panel axes. The shared Axes primitive crosses at the origin, which for
 * log-loss puts the x-axis at loss = 1, mid-panel, through the curves. Here the
 * x-axis sits on the bottom edge instead.
 */
function LossAxes({ u }: { u: number }) {
  if (u <= 0) return null;
  const x0 = xLossP(0);
  const x1 = xLossP(N_STEPS);
  const yBot = yLossP(-2.6);
  return (
    <g opacity={u}>
      {[-2, -1, 0, 1].map((v) => (
        <g key={v}>
          <line x1={x0} x2={x1} y1={yLossP(v)} y2={yLossP(v)} stroke={colors.GRID} strokeWidth={1} />
          <text x={x0 - 10} y={yLossP(v) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12}>
            {v < 0 ? `−${-v}` : v}
          </text>
        </g>
      ))}
      {[0, 100, 200, 300].map((v) => (
        <g key={v}>
          <line x1={xLossP(v)} x2={xLossP(v)} y1={yBot} y2={yBot + 5} stroke={colors.MUTED} strokeWidth={1.5} />
          <text x={xLossP(v)} y={yBot + 20} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
            {v}
          </text>
        </g>
      ))}
      <line x1={x0} x2={x1} y1={yBot} y2={yBot} stroke={colors.MUTED} strokeWidth={2} />
      <line x1={x0} x2={x0} y1={yLossP(1.2)} y2={yBot} stroke={colors.MUTED} strokeWidth={2} />
    </g>
  );
}

// Real numbers, formatted once from the precomputed statistics.
const DIST_HI = HI.dist.toFixed(2);
const FINAL_HI = HI.finalLoss.toFixed(3);
const FINAL_LO = LO.finalLoss.toFixed(3);
const FINAL_CO = CO.finalLoss.toFixed(4);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const mainFade = s.get(scene.mainFade);
  const startU = s.get(scene.startU);

  const hiU = s.get(scene.hiU);
  const hiProg = s.get(scene.hiProg);
  const ballU = s.get(scene.ballU);
  const loU = s.get(scene.loU);
  const loProg = s.get(scene.loProg);
  const coU = s.get(scene.coU);
  const coProg = s.get(scene.coProg);
  const dialU = s.get(scene.dialU);

  const schedPanelU = s.get(scene.schedPanelU);
  const schedU = s.get(scene.schedU);
  const lossPanelU = s.get(scene.lossPanelU);
  const statU = s.get(scene.statU);

  const coldU = s.get(scene.coldU);
  const coldProg = s.get(scene.coldProg);
  const warmU = s.get(scene.warmU);
  const warmProg = s.get(scene.warmProg);
  const etaTexU = s.get(scene.etaTexU);
  const endU = s.get(scene.endU);

  const hiP = pathAt(HI.pts, hiProg);
  const loP = pathAt(LO.pts, loProg);
  const coP = pathAt(CO.pts, coProg);
  const coldP = pathAt(COLD.pts, coldProg);
  const warmP = pathAt(WARM.pts, warmProg);

  // the moving dial: where the cosine run currently sits on its schedule curve
  const dialStep = coProg * N_STEPS;
  const dialEta = cosEta(dialStep);

  // staggered draw-on of the three schedule curves
  const schedRe = (i: number): number => clamp01(schedU * 1.5 - i * 0.25);

  // the warmup beat dims the two side panels so the rim stays readable
  const panelDim = 1 - 0.75 * Math.max(coldU, warmU);

  // is the start label on screen? (Camera maps stage px to screen px about the stage centre)
  const startSx = STAGE_W / 2 + cam.k * (xScale(START[0]) + 16 - cam.x);
  const startInView = startSx > 4 && startSx < STAGE_W - 60 ? 1 : 0;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <Camera {...cam}>
        <ContourField
          f={LOSS}
          x={xScale}
          y={yScale}
          thresholds={THRESHOLDS}
          gridN={110}
          reveal={s.get(scene.contourU)}
          color={contourColor}
        />

        {/* the shared starting point of the three schedule runs */}
        <g opacity={startU * mainFade}>
          <circle
            cx={xScale(START[0])}
            cy={yScale(START[1])}
            r={11}
            fill="none"
            stroke={colors.TEXT}
            strokeWidth={1.8}
            strokeDasharray="3 3"
          />
          {/* the label hides while the camera has panned its start point off the stage */}
          <text
            x={xScale(START[0]) + 16}
            y={yScale(START[1]) - 12}
            fill={colors.TEXT}
            fontSize={20}
            opacity={startInView}
          >
            θ₀
          </text>
        </g>

        {/* the three real SGD runs (same seed → same noise sequence) */}
        <Trail pts={HI.pts} prog={hiProg} u={hiU * mainFade} color={colors.WARM} />
        <Trail pts={LO.pts} prog={loProg} u={loU * mainFade} color={colors.SECONDARY} />
        <Trail pts={CO.pts} prog={coProg} u={coU * mainFade} color={colors.POSITIVE} />

        {/* the measured jitter ball of the constant-high run */}
        {ballU > 0 && (
          <g opacity={ballU * mainFade}>
            <circle
              cx={xScale(0)}
              cy={yScale(0)}
              r={HI.dist * UNIT}
              fill={colors.WARM}
              fillOpacity={0.07}
              stroke={colors.WARM}
              strokeWidth={1.6}
              strokeDasharray="6 5"
            />
            {/* camera-space text: sized to read ~14px at the ball's zoom, haloed over the trails */}
            <text
              x={xScale(0)}
              y={yScale(0) + HI.dist * UNIT + 16}
              textAnchor="middle"
              fill={colors.WARM}
              fontSize={8}
              stroke={colors.BG}
              strokeWidth={3.5}
              paintOrder="stroke"
            >
              average distance ≈ {DIST_HI}
            </text>
          </g>
        )}

        <Ball p={hiP} u={hiU * mainFade} color={colors.WARM} />
        <Ball p={loP} u={loU * mainFade} color={colors.SECONDARY} />
        <Ball p={coP} u={coU * mainFade} color={colors.POSITIVE} />

        {/* warmup beat: cold start explodes, warmed start survives */}
        {(coldU > 0 || warmU > 0) && (
          <g>
            <circle
              cx={xScale(W_START[0])}
              cy={yScale(W_START[1])}
              r={11}
              fill="none"
              stroke={colors.TEXT}
              strokeWidth={1.8}
              strokeDasharray="3 3"
              opacity={Math.max(coldU, warmU)}
            />
            <Trail pts={COLD.pts} prog={coldProg} u={coldU} color={colors.NEGATIVE} />
            <Ball p={coldP} u={coldU} color={colors.NEGATIVE} />
            <Trail pts={WARM.pts} prog={warmProg} u={warmU} color={colors.TEAL} />
            <Ball p={warmP} u={warmU} color={colors.TEAL} />
          </g>
        )}
      </Camera>

      {/* — schedule panel: η versus step ————————————————————————————— */}
      {schedPanelU > 0 && (
        <g opacity={schedPanelU * panelDim}>
          <rect
            x={PANEL_X}
            y={SP_Y}
            width={PANEL_W}
            height={SP_H}
            rx={12}
            fill={colors.PANEL}
            opacity={0.94}
            stroke={colors.GRID}
          />
          <text x={PANEL_X + 22} y={SP_Y + 32} fill={colors.TEXT} fontSize={16}>
            the schedule: η per step
          </text>
          <LegendRow x={PANEL_X + 22} y={SP_Y + 52} color={colors.WARM} label="high" u={schedRe(0)} />
          <LegendRow x={PANEL_X + 100} y={SP_Y + 52} color={colors.SECONDARY} label="low" u={schedRe(1)} />
          <LegendRow x={PANEL_X + 170} y={SP_Y + 52} color={colors.POSITIVE} label="cosine" u={schedRe(2)} />
          <Axes
            x={xSched}
            y={ySched}
            reveal={schedPanelU}
            xTicks={3}
            yTicks={3}
            fontSize={12}
          />
          <FunctionPlot
            x={xSched}
            y={ySched}
            f={fEtaHi}
            domain={[0, N_STEPS]}
            reveal={schedRe(0)}
            color={colors.WARM}
            width={2.4}
          />
          <FunctionPlot
            x={xSched}
            y={ySched}
            f={fEtaLo}
            domain={[0, N_STEPS]}
            reveal={schedRe(1)}
            color={colors.SECONDARY}
            width={2.4}
          />
          <FunctionPlot
            x={xSched}
            y={ySched}
            f={cosEta}
            domain={[0, N_STEPS]}
            reveal={schedRe(2)}
            color={colors.POSITIVE}
            width={2.4}
          />
          <g opacity={s.get(scene.cosTexU)} fill={colors.POSITIVE} fontSize={13}>
            <text x={PANEL_X + 22} y={SP_Y + SP_H - 30}>η(t) = η_min + ½ (η₀ − η_min)</text>
            <text x={PANEL_X + 22} y={SP_Y + SP_H - 13}>× (1 + cos(π·t / T))</text>
          </g>
          {/* the moving dial on the cosine curve */}
          {dialU > 0 && coProg < 1 && (
            <circle
              cx={xSched(dialStep)}
              cy={ySched(dialEta)}
              r={5.5}
              fill={colors.POSITIVE}
              stroke={colors.BG}
              strokeWidth={1.5}
              opacity={dialU * schedPanelU}
            />
          )}
        </g>
      )}

      {/* — loss panel: log loss versus step (averaged over 8 seeds) ————— */}
      {lossPanelU > 0 && (
        <g opacity={lossPanelU * panelDim}>
          <rect
            x={PANEL_X}
            y={LP_Y}
            width={PANEL_W}
            height={LP_H}
            rx={12}
            fill={colors.PANEL}
            opacity={0.94}
            stroke={colors.GRID}
          />
          <text x={PANEL_X + 22} y={LP_Y + 30} fill={colors.TEXT} fontSize={16}>
            loss per step, log scale
          </text>
          <LossAxes u={lossPanelU} />
          <FunctionPlot
            x={xLossP}
            y={yLossP}
            f={fHiLoss}
            domain={[0, N_STEPS]}
            samples={N_STEPS}
            reveal={hiProg}
            color={colors.WARM}
            width={2.4}
            opacity={hiU}
          />
          <FunctionPlot
            x={xLossP}
            y={yLossP}
            f={fLoLoss}
            domain={[0, N_STEPS]}
            samples={N_STEPS}
            reveal={loProg}
            color={colors.SECONDARY}
            width={2.4}
            opacity={loU}
          />
          <FunctionPlot
            x={xLossP}
            y={yLossP}
            f={fCoLoss}
            domain={[0, N_STEPS]}
            samples={N_STEPS}
            reveal={coProg}
            color={colors.POSITIVE}
            width={2.4}
            opacity={coU}
          />
          {/* the real final numbers */}
          {statU > 0 && (
            <g opacity={statU}>
              <text x={PANEL_X + 22} y={LP_Y + LP_H - 14} fill={colors.WARM} fontSize={14}>
                high → {FINAL_HI}
              </text>
              <text x={PANEL_X + 130} y={LP_Y + LP_H - 14} fill={colors.SECONDARY} fontSize={14}>
                low → {FINAL_LO}
              </text>
              <text x={PANEL_X + 218} y={LP_Y + LP_H - 14} fill={colors.POSITIVE} fontSize={14}>
                cosine → {FINAL_CO}
              </text>
            </g>
          )}
        </g>
      )}

      {/* — warmup annotations (screen-fixed, top-left) ————————————————— */}
      {etaTexU > 0 && (
        <g opacity={etaTexU}>
          <rect x={28} y={42} width={470} height={84} rx={10} fill={colors.PANEL} opacity={0.92} stroke={colors.GRID} />
          <text x={46} y={76} fill={colors.NEGATIVE} fontSize={18}>
            cold: η = 0.6 from step 0
          </text>
          <text x={46} y={110} fill={colors.TEAL} fontSize={18}>
            warmup: η 0.008 → 0.6 over 25 steps
          </text>
        </g>
      )}

      {/* — closing line, on a solid panel over the calmed layers ——————————— */}
      {endU > 0 && (
        <g opacity={endU}>
          <rect x={STAGE_W / 2 - 330} y={92} width={660} height={56} rx={12} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={STAGE_W / 2} y={128} textAnchor="middle" fill={colors.TEXT} fontSize={24}>
            big steps to travel · small steps to land
          </text>
        </g>
      )}
    </>
  );
}

export function LrSchedules() {
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
