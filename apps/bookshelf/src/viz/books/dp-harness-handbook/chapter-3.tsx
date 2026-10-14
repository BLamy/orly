// The Harness Handbook (arXiv:2607.13285), chapter 3 — "Built, and it pays off."
//
// Grounding:
//  • Fig. 2 — the three-phase construction pipeline: Phase I Static Fact
//    Extraction (→ Program Graph), Phase II Behavioral Organization via a
//    Propose→Review mapping loop (→ Behavioral Mapping), Phase III Handbook
//    Synthesis (→ the Handbook).
//  • Fig. 3 — results. Overall win rate rises Baseline→Handbook-Assisted on both
//    harnesses: Codex 28.4→38.4 (+10.0), Terminus 27.0→45.9 (+18.9). Planner
//    token cost per request FALLS: Codex −12.7%, Terminus −8.6%.
//
// We pan the authors' real Fig. 2, then HAND-ANIMATE the overall win-rate bars
// growing from zero, and finally show the real Fig. 3 to back the numbers.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Figure } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// Overall win-rate data (Fig. 3a), %.
const BARS = [
  { label: 'Codex', kind: 'base', v: 28.4, gx: 330 },
  { label: 'Codex', kind: 'hand', v: 38.4, gx: 330 },
  { label: 'Terminus', kind: 'base', v: 27.0, gx: 560 },
  { label: 'Terminus', kind: 'hand', v: 45.9, gx: 560 },
] as const;
// Chart sits left of x=700 so the real Fig. 3 inset (x≥740) never covers a bar.
const AXIS = { x0: 190, x1: 700, yBase: 560, top: 170, max: 50 };
const FIG3 = { x: 740, y: 170, w: 500, h: 109 };
const yOf = (v: number) => AXIS.yBase - (v / AXIS.max) * (AXIS.yBase - AXIS.top);

const CAM_PIPE: CameraState = { x: 640, y: 240, k: 1.0 };
const CAM_PHASE1: CameraState = { x: 300, y: 250, k: 1.55 };
const CAM_PHASE2: CameraState = { x: 640, y: 250, k: 1.55 };
const CAM_PHASE3: CameraState = { x: 980, y: 250, k: 1.55 };
const CAM_BARS: CameraState = { x: 640, y: 380, k: 1.0 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  pipeU: ChannelRef<number>;
  phase: ChannelRef<number>; // 0..3 which phase is spotlit
  barsInU: ChannelRef<number>; // axis + labels in
  growU: ChannelRef<number>; // bar heights grow
  deltaU: ChannelRef<number>; // +10.0 / +18.9 pop
  tokenU: ChannelRef<number>; // token-cost note
  figU: ChannelRef<number>; // real Fig. 3
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_PIPE, cameraInterp);
  const pipeU = tl.channel('pipeU', 0);
  const phase = tl.channel('phase', 0);
  const barsInU = tl.channel('barsInU', 0);
  const growU = tl.channel('growU', 0);
  const deltaU = tl.channel('deltaU', 0);
  const tokenU = tl.channel('tokenU', 0);
  const figU = tl.channel('figU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · how the Handbook is built —
  tl.caption({
    at: 0.4,
    dur: 5.8,
    text: "The Handbook isn't written by hand. It's constructed in three phases, each one refining the last — from raw code facts, up to a finished guide.",
  });
  tl.tween(pipeU, 1, { at: 0.6, dur: 1.4, ease: ease.enter });
  tl.hold(6.2, 0.5);

  // — Beat 2 · Phase I —
  tl.caption({
    at: 6.8,
    dur: 5.8,
    text: "Phase one is static fact extraction. Parse the harness into a program graph: its functions, its call graph, what state each part reads and writes.",
  });
  tl.tween(cam, CAM_PHASE1, { at: 7.0, dur: 1.4, ease: ease.move });
  tl.set(phase, 1, 7.4);
  tl.hold(12.6, 0.5);

  // — Beat 3 · Phase II —
  tl.caption({
    at: 13.2,
    dur: 6.4,
    text: "Phase two is where it gets clever. One model proposes how those functions map onto behavioral stages; another reviews and pushes back, and they loop — propose, refine, accept — until the mapping is stable.",
  });
  tl.tween(cam, CAM_PHASE2, { at: 13.4, dur: 1.4, ease: ease.move });
  tl.set(phase, 2, 13.8);
  tl.hold(19.6, 0.5);

  // — Beat 4 · Phase III —
  tl.caption({
    at: 20.2,
    dur: 5.6,
    text: "Phase three synthesizes that stable mapping into the levels we just read — overview, stage cards, unit cards — anchored back to the real code.",
  });
  tl.tween(cam, CAM_PHASE3, { at: 20.4, dur: 1.4, ease: ease.move });
  tl.set(phase, 3, 20.8);
  tl.hold(25.8, 0.5);

  // — Beat 5 · the real question —
  tl.caption({
    at: 26.4,
    dur: 5.4,
    text: "A guide is only worth its cost. So the authors put a planner to work with the Handbook, and without it, and measured who plans better.",
  });
  tl.tween(pipeU, 0, { at: 26.6, dur: 1.0, ease: ease.move });
  tl.tween(cam, CAM_BARS, { at: 26.8, dur: 1.4, ease: ease.move });
  tl.tween(barsInU, 1, { at: 27.6, dur: 1.2, ease: ease.draw });
  tl.hold(31.8, 0.4);

  // — Beat 6 · the win-rate lift —
  tl.caption({
    at: 32.2,
    dur: 6.4,
    text: "Judged head to head, handbook-assisted planning wins. On the Codex harness the win rate climbs ten points; on Terminus, nearly nineteen. Same model, better plans — just because it could find its way.",
  });
  tl.tween(growU, 1, { at: 32.6, dur: 2.4, ease: ease.pop });
  tl.tween(deltaU, 1, { at: 35.2, dur: 1.0, ease: ease.pop });
  tl.hold(38.6, 0.5);

  // — Beat 7 · cheaper too, with the real chart —
  tl.caption({
    at: 39.2,
    dur: 6.2,
    text: "And it isn't paying for those wins in tokens — it spends fewer. Planner cost per request drops on both harnesses. Here are the authors' own numbers, next to ours.",
  });
  tl.tween(tokenU, 1, { at: 39.6, dur: 1.0, ease: ease.enter });
  tl.tween(figU, 1, { at: 40.4, dur: 1.2, ease: ease.enter });
  tl.hold(45.4, 0.5);

  // — Beat 8 · close / series sign-off —
  tl.caption({
    at: 46.0,
    dur: 6.0,
    text: "Give an evolving system a readable map of itself, and it edits itself better and cheaper. That's the Harness Handbook — the first of this week's top papers from Hugging Face.",
  });
  tl.tween(cam, CAMERA_HOME, { at: 46.2, dur: 1.5, ease: ease.move });
  tl.tween(figU, 0.14, { at: 46.4, dur: 1.0, ease: ease.move });
  tl.tween(growU, 1, { at: 46.4, dur: 0.1, ease: ease.linear });
  tl.tween(closeU, 1, { at: 46.8, dur: 1.2, ease: ease.enter });
  tl.hold(51.8, 1.4);

  return { tl, cam, pipeU, phase, barsInU, growU, deltaU, tokenU, figU, closeU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pipeU = s.get(scene.pipeU);
  const phase = s.get(scene.phase);
  const barsInU = s.get(scene.barsInU);
  const growU = s.get(scene.growU);
  const deltaU = s.get(scene.deltaU);
  const tokenU = s.get(scene.tokenU);
  const figU = s.get(scene.figU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;

  // Phase spotlight: dim the two non-active thirds of the real Fig. 2.
  const PIPE = { x: 100, y: 96, w: 1080, h: 276 };
  const third = PIPE.w / 3;
  const PHASE_NAMES = ['Phase I → Program Graph', 'Phase II → Behavioral Mapping', 'Phase III → Handbook'];
  // Chip sits above the figure: the camera keeps it on-stage, and it clears the caption pill.
  const chipX = phase >= 1 ? PIPE.x + (phase - 0.5) * third : PIPE.x + PIPE.w / 2;
  const chipText = phase >= 1 ? PHASE_NAMES[phase - 1] : 'Fig. 2 — construction pipeline';
  // Placeholder bars for the "who plans better" question: a fixed height and a "?" until the bars grow.
  const unknownU = barsInU * (1 - clamp01(growU * 2));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- Phase pipeline: the authors' real Fig. 2 ---- */}
        {pipeU > 0.01 && (
          <>
            {/* no Figure caption: it is left-anchored at the figure edge and gets cropped by the zoomed camera */}
            <Figure
              src="/generated/dp-harness-handbook/figures/fig-02.png"
              x={PIPE.x}
              y={PIPE.y}
              w={PIPE.w}
              h={PIPE.h}
              reveal={pipeU}
              opacity={pipeU}
              accent={colors.TEAL}
            />
            {/* spotlight the active phase by dimming the other two thirds (lighter, so the figures stay readable) */}
            {phase >= 1 &&
              [0, 1, 2].map((i) => {
                const active = phase - 1 === i;
                return (
                  <rect
                    key={i}
                    x={PIPE.x + i * third}
                    y={PIPE.y}
                    width={third}
                    height={PIPE.h}
                    fill={colors.BG}
                    opacity={active ? 0 : 0.5 * pipeU}
                  />
                );
              })}
            <g opacity={pipeU}>
              <rect
                x={chipX - 165}
                y={PIPE.y - 42}
                width={330}
                height={30}
                rx={15}
                fill={colors.PANEL}
                stroke={colors.TEAL}
                strokeOpacity={0.6}
                strokeWidth={1.2}
              />
              <text x={chipX} y={PIPE.y - 22} textAnchor="middle" fill={colors.TEAL} fontSize={15}>
                {chipText}
              </text>
            </g>
          </>
        )}

        {/* ---- hand-animated win-rate bars (Fig. 3a) ---- */}
        <g opacity={barsInU * dimAll}>
          {/* y axis + gridlines */}
          <line x1={AXIS.x0} y1={AXIS.top} x2={AXIS.x0} y2={AXIS.yBase} stroke={colors.GRID} strokeWidth={1.4} />
          <line x1={AXIS.x0} y1={AXIS.yBase} x2={AXIS.x1} y2={AXIS.yBase} stroke={colors.GRID} strokeWidth={1.4} />
          {[0, 10, 20, 30, 40, 50].map((v) => (
            <g key={v}>
              <line x1={AXIS.x0 - 5} y1={yOf(v)} x2={AXIS.x1} y2={yOf(v)} stroke={colors.GRID} strokeWidth={0.6} opacity={0.35} />
              <text x={AXIS.x0 - 12} y={yOf(v) + 4} textAnchor="end" fill={colors.MUTED} fontSize={12}>
                {v}
              </text>
            </g>
          ))}
          <text x={AXIS.x0 - 40} y={AXIS.top - 14} fill={colors.MUTED} fontSize={12}>
            win rate (%)
          </text>
          <text x={AXIS.x0} y={AXIS.top - 40} fill={colors.TEXT} fontSize={15}>
            The authors' reported win rates (Fig. 3a)
          </text>
        </g>

        {/* "?" placeholders while the question is posed: same slots, fixed height, no answer shown */}
        {[330, 560].map((gx) => (
          <g key={gx} opacity={unknownU * dimAll}>
            <rect
              x={gx - 106}
              y={AXIS.yBase - 0.5 * (AXIS.yBase - AXIS.top)}
              width={92 * 2 + 28}
              height={0.5 * (AXIS.yBase - AXIS.top)}
              rx={8}
              fill="none"
              stroke={colors.MUTED}
              strokeDasharray="6 6"
              strokeWidth={1.2}
            />
            <text x={gx} y={AXIS.yBase - 0.25 * (AXIS.yBase - AXIS.top) + 8} textAnchor="middle" fill={colors.MUTED} fontSize={30}>
              ?
            </text>
          </g>
        ))}

        {/* bars */}
        {BARS.map((b, i) => {
          const isHand = b.kind === 'hand';
          const bw = 92;
          const bx = b.gx + (isHand ? 60 : -60) - bw / 2;
          const h = (b.v / AXIS.max) * (AXIS.yBase - AXIS.top) * clamp01(growU);
          const col = isHand ? colors.ACCENT : colors.NEGATIVE;
          const showText = clamp01(growU * 1.4 - 0.4);
          return (
            <g key={i} opacity={barsInU * dimAll}>
              <rect x={bx} y={AXIS.yBase - h} width={bw} height={h} rx={5} fill={col} opacity={0.9} />
              <text x={bx + bw / 2} y={AXIS.yBase - h - 10} textAnchor="middle" fill={col} fontSize={15} opacity={showText}>
                {b.v.toFixed(1)}
              </text>
              {isHand && (
                <text x={b.gx} y={AXIS.yBase + 26} textAnchor="middle" fill={colors.TEXT} fontSize={15} opacity={barsInU}>
                  {b.label}
                </text>
              )}
            </g>
          );
        })}

        {/* +10.0 / +18.9 delta callouts */}
        {[
          { gx: 330, delta: '+10.0', v: 38.4 },
          { gx: 560, delta: '+18.9', v: 45.9 },
        ].map((d, i) => (
          <g key={i} opacity={deltaU * dimAll}>
            <text x={d.gx + 60} y={yOf(d.v) - 34} textAnchor="middle" fill={colors.POSITIVE} fontSize={22} fontWeight={700}>
              {d.delta}
            </text>
          </g>
        ))}

        {/* legend: under the Fig. 3 inset, clear of every bar */}
        <g opacity={barsInU * dimAll}>
          <rect x={FIG3.x} y={346} width={14} height={14} rx={3} fill={colors.NEGATIVE} opacity={0.9} />
          <text x={FIG3.x + 22} y={358} fill={colors.MUTED} fontSize={14}>
            Baseline
          </text>
          <rect x={FIG3.x + 120} y={346} width={14} height={14} rx={3} fill={colors.ACCENT} opacity={0.9} />
          <text x={FIG3.x + 142} y={358} fill={colors.MUTED} fontSize={14}>
            Handbook-Assisted
          </text>
        </g>

        {/* token-cost note */}
        <g opacity={tokenU * dimAll}>
          <text x={640} y={112} textAnchor="middle" fill={colors.WARM} fontSize={16}>
            planner tokens / request: Codex −12.7% · Terminus −8.6%
          </text>
        </g>

        {/* the authors' real Fig. 3, small, as evidence */}
        <Figure
          src="/generated/dp-harness-handbook/figures/fig-03.png"
          x={FIG3.x}
          y={FIG3.y}
          w={FIG3.w}
          h={FIG3.h}
          reveal={figU}
          opacity={figU}
          caption="Fig. 3 — win rate & token cost, Baseline vs Handbook-Assisted"
          accent={colors.ACCENT}
        />

        {/* close */}
        <g opacity={closeU}>
          <rect x={300} y={250} width={680} height={150} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.4} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={22}>
            a readable map → better, cheaper edits
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            The Harness Handbook · arXiv:2607.13285
          </text>
          <text x={640} y={372} textAnchor="middle" fill={colors.ACCENT} fontSize={14}>
            Source: Hugging Face Daily Papers (weekly ranking)
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
