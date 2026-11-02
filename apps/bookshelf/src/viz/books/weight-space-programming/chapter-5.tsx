// Chapter 5 — Subtract the loop.
//
// Source: "Sparks of Weight-Space Programming" (Takehi, Teoh, Zhang, Khattab; MIT CSAIL; November 2, 2026),
// https://rikiyat.github.io/blog/weight-space-programming/ . Experiment 8: Qwen3.5-0.8B (thinking on, 24 layers,
// 0.8 billion weights) loops. Base: 85 of its first 96 practice answers ran to the 32,768-token limit. Astra traced
// the looping to one direction written by the MLPs of layers 15 and 19, and subtracted it from 64 output columns in
// each (131,072 weights, 0.016% of the model). With 50 forward passes: MATH-500 7.9% to 48.1%; GSM8K 13.8% to 67.1%;
// IFEval 21.0% to 62.3%; token-limit hits 93.0% to 33.1%. With 10 or 25 passes the loops barely went away (hits
// 87.2% and 86.4%). Limit: Gemma 3 270M rarely loops (8.5% of answers reach its limit, against 93% for Qwen) and
// its MATH-500 went from 6.8% to at most 7.7%; editing removes an obstacle but cannot add an ability.
//
// Beat sheet. One machine: a looping text ring that breaks after the direction is subtracted.
//  1. [Exp 8] A ring of repeated tiles turns: the base model repeats the same text.
//  2. [Exp 8] The stat: 85 of its first 96 practice answers ran to the 32,768-token limit (the ring keeps turning).
//  3. [Exp 8] Astra traces the loop to one direction in layers 15 and 19. Each of the 64 columns shows its share.
//  4. [Exp 8] That direction is subtracted from 64 columns per layer: the shares drop away, and the ring stops and
//     breaks into a line that ends in an answer tile (131,072 weights, 0.016% of the model).
//  5. [Exp 8] With 50 forward passes, the bars: MATH-500 7.9 to 48.1; GSM8K 13.8 to 67.1; IFEval 21.0 to 62.3;
//     token-limit hits 93.0 to 33.1.
//  6. [Exp 8] The same chart at 10 and 25 passes: the loops barely went away.
//  7. [Limit] Gemma 3 270M rarely loops: 8.5% token-limit hits against Qwen's 93%.
//  8. [Limit] Gemma's MATH-500: 6.8 at base, 7.7 at best; there was no loop to switch off.
//  9. Closing: the bars clear; two statements sit alone on a backdrop panel.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease, mulberry32 } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// Seconds a caption takes to say, with a breath: pacing follows the words.
const speakSeconds = (text: string) => Math.round((text.split(/\s+/).length / 2.6 + 0.5) * 10) / 10;

// ---- the loop ring and the line it breaks into ----------------------------------------------
const N = 12;
const RING_R = 150;
const RING_CX = 330;
const RING_CY = 320;
const TILE_W = 40;
const TILE_H = 22;
const TILE_COLORS = [colors.ACCENT, colors.SECONDARY, colors.MUTED, colors.TEAL];
const ringPos = (i: number, spin: number) => {
  const a = (2 * Math.PI * i) / N + spin * 2 * Math.PI;
  return { x: RING_CX + RING_R * Math.cos(a), y: RING_CY + RING_R * Math.sin(a) };
};
const linePos = (i: number) => ({ x: 110 + i * 40, y: RING_CY });

// ---- the direction's share in each of 64 output columns, for layers 15 and 19 (schematic) ----
const rand = mulberry32(15);
const COLS = 64;
const COL_PITCH = 8.75;
const COL_W = 5;
const COL_X0 = 640;
const COL_BASE15 = 290;
const COL_BASE19 = 460;
const COLUMNS = Array.from({ length: COLS }, () => {
  const h = 70 + 60 * rand();
  const d = h * (0.25 + 0.2 * rand());
  return { h, d };
});

// ---- benchmark bars, as posted ------------------------------------------------------------------
const SCALE = 2.1;
const CHART_BASE = 520;
const CHART = [
  { label: 'MATH-500', base: 7.9, edit: 48.1, cx: 230 },
  { label: 'GSM8K', base: 13.8, edit: 67.1, cx: 500 },
  { label: 'IFEval', base: 21.0, edit: 62.3, cx: 770 },
  { label: 'token-limit hits', base: 93.0, edit: 33.1, cx: 1040 },
];
const GEMMA = [
  { label: 'token-limit hits', baseLabel: 'Qwen', base: 93.0, editLabel: 'Gemma', edit: 8.5, cx: 380 },
  { label: 'MATH-500', baseLabel: 'base', base: 6.8, editLabel: 'best edit', edit: 7.7, cx: 880 },
];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ringU = tl.channel('ringU', 0); // ring appears
  const spin = tl.channel('spin', 0); // ring turns (in turns), frozen after the fix
  const barsU = tl.channel('barsU', 0); // direction-share columns appear
  const subU = tl.channel('subU', 0); // the direction is subtracted
  const breakU = tl.channel('breakU', 0); // ring breaks into a line
  const ringOut = tl.channel('ringOut', 0); // ring and columns clear
  const chartU = tl.channel('chartU', 0); // benchmark bars grow
  const noteU = tl.channel('noteU', 0); // 10 and 25 passes note
  const chartOut = tl.channel('chartOut', 0); // Qwen chart clears
  const gemmaU = tl.channel('gemmaU', 0); // Gemma bars grow
  const gemOut = tl.channel('gemOut', 0); // Gemma bars clear
  const closeU = tl.channel('closeU', 0); // closing panel
  const endU = tl.channel('endU', 0); // closing fade

  let t = 0.3;
  const line = (text: string, gap = 0.4) => {
    const at = t;
    tl.caption({ at, dur: speakSeconds(text), text });
    t = at + speakSeconds(text) + gap;
    return at;
  };

  // ---- beat 1 and 2: the loop -------------------------------------------------------
  const c1 = line('Qwen three point five, a small reasoning model, falls into loops. Its own model card warns about thinking loops.');
  tl.tween(ringU, 1, { at: c1 + 0.4, dur: 1.0, ease: ease.enter });
  tl.tween(cam, { x: 330, y: 320, k: 1.08 }, { at: c1 + 0.6, dur: 1.4, ease: ease.move });
  const spinStart = c1 + 1.0;
  const spinEnd = c1 + 25.0;
  tl.tween(spin, 2.2, { at: spinStart, dur: spinEnd - spinStart, ease: ease.linear });
  line('Eighty-five of its first ninety-six practice answers ran all the way to the limit of thirty-two thousand, seven hundred sixty-eight tokens.');

  // ---- beat 3: the direction ---------------------------------------------------------
  const c3 = line('Astra traced the loop to one direction, written by the feed-forward blocks of layers fifteen and nineteen.');
  tl.tween(barsU, 1, { at: c3 + 0.2, dur: 1.2, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: c3 + 0.2, dur: 1.4, ease: ease.move });

  // ---- beat 4: subtract, then the ring breaks ------------------------------------------
  const c4 = line('It subtracted that direction from sixty-four output columns in each of those two layers. That touches zero point zero one six percent of the model\'s weights.');
  tl.tween(subU, 1, { at: c4 + 0.8, dur: 2.4, ease: ease.move });
  tl.tween(breakU, 1, { at: c4 + 3.6, dur: 2.0, ease: ease.move });

  // ---- beat 5: the benchmark bars ------------------------------------------------------
  const c5 = line('With fifty forward passes, answers that hit the token limit fall from ninety-three percent to thirty-three percent.');
  line('A math benchmark rises from seven point nine to forty-eight point one percent.');
  tl.tween(ringOut, 1, { at: c5 - 0.2, dur: 1.0, ease: ease.move });
  tl.tween(chartU, 1, { at: c5 + 0.6, dur: 1.8, ease: ease.move });
  line('Instruction following rises too, from twenty-one percent to sixty-two point three percent. The loops were not special to math.');

  // ---- beat 6: the small budgets ------------------------------------------------------
  const c7 = line('With only ten or twenty-five forward passes, the loops barely went away.');
  tl.tween(noteU, 1, { at: c7 + 0.3, dur: 1.0, ease: ease.enter });

  // ---- beat 7 and 8: the limit ------------------------------------------------------------
  const c8 = line('Gemma three, about a third the size of Qwen, rarely loops. Only eight point five percent of its answers hit the token limit.');
  tl.tween(chartOut, 1, { at: c8 - 0.3, dur: 0.9, ease: ease.move });
  tl.tween(gemmaU, 1, { at: c8 + 0.6, dur: 1.6, ease: ease.move });
  line('On math, Astra could not improve Gemma. The best edited score was seven point seven percent, against six point eight at the start.');

  // ---- closing: the bars clear, two statements remain ------------------------------------
  const closing = 'Editing weights can remove an obstacle that hides an ability. It cannot add an ability the model does not have.';
  tl.tween(gemOut, 1, { at: t - 0.6, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: t + 0.1, dur: 1.2, ease: ease.enter });
  const cEnd = line(closing, 0.5);
  tl.tween(endU, 1, { at: cEnd + speakSeconds(closing) + 0.1, dur: 1.4, ease: ease.move });
  tl.hold(t + 0.5, 0.6);

  return {
    tl,
    cam,
    ringU,
    spin,
    barsU,
    subU,
    breakU,
    ringOut,
    chartU,
    noteU,
    chartOut,
    gemmaU,
    gemOut,
    closeU,
    endU,
  };
}

const scene = buildScene();

function Bar({ cx, value, u, color, label, sub }: { cx: number; value: number; u: number; color: string; label: string; sub?: string }) {
  const h = value * SCALE * clamp01(u);
  const x = cx - 22;
  return (
    <g>
      <rect x={x} y={CHART_BASE - h} width={44} height={h} rx={6} fill={color} opacity={0.92} />
      <text x={cx} y={CHART_BASE - h - 10} textAnchor="middle" fill={colors.TEXT} fontSize={18} fontFamily={MONO} opacity={clamp01(u * 1.2)}>
        {`${value.toFixed(1)}%`}
      </text>
      <text x={cx} y={CHART_BASE + 20} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
        {label}
      </text>
      {sub && (
        <text x={cx} y={CHART_BASE + 44} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
          {sub}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const endFade = 1 - s.get(scene.endU);
  const ringU = s.get(scene.ringU) * (1 - s.get(scene.ringOut)) * endFade;
  const spin = s.get(scene.spin);
  const barsU = s.get(scene.barsU) * (1 - s.get(scene.ringOut)) * endFade;
  const subU = s.get(scene.subU);
  const breakU = s.get(scene.breakU);
  const chartU = s.get(scene.chartU) * (1 - s.get(scene.chartOut)) * endFade;
  const noteU = s.get(scene.noteU) * (1 - s.get(scene.chartOut)) * endFade;
  const gemmaU = s.get(scene.gemmaU) * (1 - s.get(scene.gemOut)) * endFade;
  const closeU = s.get(scene.closeU) * endFade;
  const cam = s.get(scene.cam);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />

      {ringU > 0 && (
        <text x={640} y={58} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700} opacity={ringU}>
          Experiment 8: a looping model, Qwen3.5-0.8B
        </text>
      )}
      {chartU > 0 && (
        <text x={640} y={58} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700} opacity={chartU}>
          Experiment 8: Qwen3.5-0.8B, 50 forward passes, base in gray, edited in accent
        </text>
      )}
      {gemmaU > 0 && (
        <text x={640} y={58} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700} opacity={gemmaU}>
          Limit: Gemma 3 270M rarely loops, and its math did not improve
        </text>
      )}

      <Camera {...cam}>
        {ringU > 0 && (
          <g opacity={ringU}>
            {Array.from({ length: N }, (_, i) => {
              const ring = ringPos(i, spin);
              const line = linePos(i);
              const p = {
                x: ring.x * (1 - breakU) + line.x * breakU,
                y: ring.y * (1 - breakU) + line.y * breakU,
              };
              const isAnswer = i === N - 1;
              const answerU = breakU;
              return (
                <g key={i}>
                  <rect
                    x={p.x - TILE_W / 2}
                    y={p.y - TILE_H / 2}
                    width={TILE_W}
                    height={TILE_H}
                    rx={6}
                    fill={isAnswer ? colors.WARM : TILE_COLORS[i % TILE_COLORS.length]}
                    opacity={isAnswer ? 0.25 + 0.7 * answerU : 0.55}
                  />
                  <rect x={p.x - 12} y={p.y - 3} width={24} height={3} rx={1.5} fill={colors.TEXT} opacity={0.7} />
                  <rect x={p.x - 12} y={p.y + 3} width={16} height={3} rx={1.5} fill={colors.TEXT} opacity={0.5} />
                </g>
              );
            })}
            {breakU > 0.6 && (
              <text x={linePos(N - 1).x} y={RING_CY + 40} textAnchor="middle" fill={colors.WARM} fontSize={16} opacity={(breakU - 0.6) / 0.4}>
                answer
              </text>
            )}
            {breakU < 0.4 && (
              <text x={RING_CX} y={RING_CY + RING_R + 60} textAnchor="middle" fill={colors.MUTED} fontSize={16} opacity={1 - breakU / 0.4}>
                the base model repeats the same text
              </text>
            )}
          </g>
        )}

        {barsU > 0 && (
          <g opacity={barsU}>
            {[
              { base: COL_BASE15, label: 'layer 15, 64 output columns', ty: 150 },
              { base: COL_BASE19, label: 'layer 19, 64 output columns', ty: 320 },
            ].map(({ base, label, ty }) => (
              <g key={label}>
                <text x={COL_X0} y={ty} fill={colors.MUTED} fontSize={16}>
                  {label}
                </text>
                {COLUMNS.map(({ h, d }, k) => {
                  const x = COL_X0 + k * COL_PITCH;
                  const wh = d * (1 - subU);
                  return (
                    <g key={k}>
                      <rect x={x} y={base - (h - d)} width={COL_W} height={h - d} fill={colors.MUTED} opacity={0.45} />
                      <rect x={x} y={base - (h - d) - wh} width={COL_W} height={wh} fill={colors.WARM} />
                    </g>
                  );
                })}
              </g>
            ))}
            <rect x={COL_X0} y={494} width={18} height={12} fill={colors.WARM} />
            <text x={COL_X0 + 28} y={505} fill={colors.TEXT} fontSize={16}>
              the direction's share, subtracted (schematic)
            </text>
            <text x={COL_X0} y={548} fill={colors.TEXT} fontSize={18} fontFamily={MONO}>
              131,072 weights, 0.016% of the model
            </text>
          </g>
        )}

        {chartU > 0 && (
          <g opacity={chartU}>
            {CHART.map((g) => (
              <g key={g.label}>
                <Bar cx={g.cx - 26} value={g.base} u={chartU} color={colors.MUTED} label="base" />
                <Bar cx={g.cx + 26} value={g.edit} u={chartU} color={colors.ACCENT} label="edited" />
                <text x={g.cx} y={CHART_BASE + 42} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
                  {g.label}
                </text>
              </g>
            ))}
            {noteU > 0 && (
              <text x={640} y={300} textAnchor="middle" fill={colors.MUTED} fontSize={17} opacity={noteU}>
                with 10 passes, 87.2% hit the limit; with 25, 86.4%
              </text>
            )}
          </g>
        )}

        {gemmaU > 0 && (
          <g opacity={gemmaU}>
            {GEMMA.map((g) => (
              <g key={g.label}>
                <Bar cx={g.cx - 40} value={g.base} u={gemmaU} color={colors.MUTED} label={g.baseLabel} />
                <Bar cx={g.cx + 40} value={g.edit} u={gemmaU} color={colors.ACCENT} label={g.editLabel} />
                <text x={g.cx} y={CHART_BASE + 42} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
                  {g.label}
                </text>
              </g>
            ))}
          </g>
        )}
      </Camera>

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={236} width={880} height={170} rx={22} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={2.5} />
          <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={28} fontWeight={700}>
            Editing can remove an obstacle that hides an ability.
          </text>
          <text x={640} y={350} textAnchor="middle" fill={colors.ACCENT} fontSize={24}>
            It cannot add an ability the model does not have.
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
