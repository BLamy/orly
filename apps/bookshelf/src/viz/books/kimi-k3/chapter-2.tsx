// A Million Tokens Deep — chapter 2: Every Layer Can Look Back.
//
// Grounded in MoonshotAI/Kimi-K3 k3_tech_report.pdf §2.2, equations 8–10.
// Standard residuals compress prior depth into one state. Full Attention
// Residuals attend over previous layer outputs; Kimi K3 uses Block Attention
// Residuals with eight 12-layer blocks, a partial final block, and the
// embedding as a ninth source-level representation.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const LAYERS = Array.from({ length: 24 }, (_, i) => ({ i, x: 235 + (i % 6) * 92, y: 520 - Math.floor(i / 6) * 112 }));
const WEIGHTS = [0.06, 0.12, 0.04, 0.2, 0.08, 0.5];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const stackU = tl.channel('stackU', 0);
  const streamU = tl.channel('streamU', 0);
  const bottleneckU = tl.channel('bottleneckU', 0);
  const fanU = tl.channel('fanU', 0);
  const weightsU = tl.channel('weightsU', 0);
  const costU = tl.channel('costU', 0);
  const blockU = tl.channel('blockU', 0);
  const summaryU = tl.channel('summaryU', 0);
  const combineU = tl.channel('combineU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.7, text: 'A conventional residual stream carries one accumulated representation from layer to layer.' });
  tl.tween(stackU, 1, { at: 0.8, dur: 1.6, ease: ease.enter });
  tl.tween(streamU, 1, { at: 1.2, dur: 2.0, ease: ease.draw });
  tl.hold(6.2, 0.5);

  tl.caption({ at: 6.7, dur: 5.8, text: 'That makes depth behave like recurrence. Old detail survives only if every later merge preserves it.' });
  tl.tween(bottleneckU, 1, { at: 7.2, dur: 0.7, ease: ease.pop });
  tl.tween(cam, { x: 640, y: 360, k: 1.03 }, { at: 7.4, dur: 1.3, ease: ease.move });
  tl.hold(12.5, 0.5);

  tl.caption({ at: 13.0, dur: 5.9, text: 'Attention Residuals keep earlier layer outputs available as keys and values instead of flattening them into one stream.' });
  tl.tween(fanU, 1, { at: 13.5, dur: 1.5, ease: ease.draw });
  tl.hold(18.9, 0.5);

  tl.caption({ at: 19.4, dur: 5.8, text: 'A learned query at the next layer assigns a soft weight to each earlier representation, then mixes the useful ones.' });
  tl.tween(weightsU, 1, { at: 19.9, dur: 1.7, ease: ease.move });
  tl.hold(25.2, 0.5);

  tl.caption({ at: 25.7, dur: 5.5, text: 'Full attention over depth is affordable to compute, but keeping every layer output alive costs memory and pipeline traffic.' });
  tl.tween(costU, 1, { at: 26.2, dur: 1.0, ease: ease.enter });
  tl.hold(31.2, 0.5);

  tl.caption({ at: 31.7, dur: 5.9, text: 'Kimi K3 groups its layers into blocks. Inside a block, partial sums grow; across blocks, attention reads one summary per block.' });
  tl.tween(blockU, 1, { at: 32.2, dur: 1.4, ease: ease.draw });
  tl.tween(summaryU, 1, { at: 33.2, dur: 1.2, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 360, k: 1.02 }, { at: 33.4, dur: 1.3, ease: ease.move });
  tl.hold(37.6, 0.5);

  tl.caption({ at: 38.1, dur: 5.8, text: 'Eight blocks of twelve layers recover most of the benefit, while the embedding remains an additional source.' });
  tl.hold(43.9, 0.5);

  tl.caption({ at: 44.4, dur: 5.9, text: 'The memory bill shrinks from every layer to every block, and each new layer can still reach the history it needs.' });
  tl.tween(combineU, 1, { at: 44.9, dur: 1.7, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 46.0, dur: 1.3, ease: ease.move });
  tl.hold(50.3, 0.5);

  tl.caption({ at: 50.8, dur: 6.2, text: 'Kimi K3 moves information across depth the same way attention moves it across time: retrieve, weight, and combine.' });
  tl.tween(dimU, 1, { at: 51.3, dur: 1.0, ease: ease.move });
  tl.tween(endU, 1, { at: 52.1, dur: 0.7, ease: ease.enter });
  tl.hold(57.0, 1.0);

  return { tl, cam, stackU, streamU, bottleneckU, fanU, weightsU, costU, blockU, summaryU, combineU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const stackU = s.get(scene.stackU);
  const fanU = s.get(scene.fanU);
  const weightsU = s.get(scene.weightsU);
  const blockU = s.get(scene.blockU);
  const summaryU = s.get(scene.summaryU);
  const combineU = s.get(scene.combineU);
  const legacyOpacity = 1 - 0.82 * blockU;
  const mainOpacity = 1 - 0.88 * s.get(scene.dimU);

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <g opacity={mainOpacity}>
        <text x={640} y={58} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={750}>Attention over network depth</text>
        <text x={640} y={84} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>Block AttnRes · 8 blocks × 12 layers · embedding source</text>
      </g>
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <g>
            {LAYERS.map((layer, idx) => {
              const u = clamp01(stackU * LAYERS.length - idx);
              const group = Math.floor(idx / 3);
              const blockColor = [colors.ACCENT, colors.SECONDARY, colors.POSITIVE, colors.WARM][group % 4];
              return (
                <g key={idx} opacity={u * legacyOpacity}>
                  <rect x={layer.x} y={layer.y} width={68} height={46} rx={8} fill={colors.PANEL} stroke={blockU > 0 ? blockColor : colors.GRID} strokeWidth={1.4} />
                  <text x={layer.x + 34} y={layer.y + 28} textAnchor="middle" fill={colors.TEXT} fontSize={10} fontFamily={MONO}>h{idx + 1}</text>
                </g>
              );
            })}

            {s.get(scene.streamU) > 0 && (
              <path d="M200 566 C160 470 160 260 210 170" fill="none" stroke={colors.ACCENT} strokeWidth={7} opacity={s.get(scene.streamU) * legacyOpacity} />
            )}
            {s.get(scene.bottleneckU) > 0 && (
              <g opacity={s.get(scene.bottleneckU) * legacyOpacity}>
                <circle cx={207} cy={170} r={30} fill={colors.NEGATIVE} opacity={0.22} />
                <text x={207} y={174} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11} fontWeight={700}>ONE STATE</text>
              </g>
            )}

            {fanU > 0 && (
              <g opacity={legacyOpacity}>
                <circle cx={980} cy={166} r={30} fill={colors.WARM} opacity={0.2} stroke={colors.WARM} />
                <text x={980} y={171} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>w_l</text>
                {LAYERS.slice(-6).map((layer, i) => {
                  const weight = WEIGHTS[i] * weightsU;
                  return <line key={i} x1={layer.x + 68} y1={layer.y + 23} x2={950} y2={166} stroke={colors.WARM} strokeWidth={1 + weight * 10} opacity={fanU * (0.16 + weight)} />;
                })}
                <text x={980} y={215} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>learned pseudo-query</text>
              </g>
            )}

            {s.get(scene.costU) > 0 && (
              <g opacity={s.get(scene.costU) * (1 - blockU)} transform="translate(830 480)">
                <rect width={310} height={90} rx={14} fill={colors.PANEL} stroke={colors.NEGATIVE} />
                <text x={155} y={32} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12} fontWeight={700}>FULL DEPTH STATE</text>
                <text x={155} y={59} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>memory + communication = O(Ld)</text>
              </g>
            )}

            {blockU > 0 && Array.from({ length: 8 }, (_, b) => {
              const x = 218 + (b % 4) * 150;
              const y = 320 + Math.floor(b / 4) * 190;
              const color = [colors.ACCENT, colors.SECONDARY, colors.POSITIVE, colors.WARM][b % 4];
              return (
                <g key={b} opacity={blockU}>
                  <rect x={x} y={y} width={120} height={156} rx={13} fill={colors.BG} fillOpacity={0.82} stroke={color} strokeWidth={2} />
                  <text x={x + 60} y={y + 22} textAnchor="middle" fill={color} fontSize={10} fontFamily={MONO}>block {b + 1}</text>
                  <rect x={x + 18} y={y + 42} width={84} height={10} rx={5} fill={color} opacity={0.2} />
                  <rect x={x + 18} y={y + 68} width={84} height={10} rx={5} fill={color} opacity={0.35} />
                  <rect x={x + 18} y={y + 94} width={84} height={10} rx={5} fill={color} opacity={0.5} />
                  {summaryU > 0 && <circle cx={x + 60} cy={y + 130} r={13 + 4 * combineU} fill={color} opacity={summaryU} />}
                </g>
              );
            })}

            {summaryU > 0 && (
              <g opacity={summaryU}>
                <rect x={870} y={315} width={250} height={210} rx={16} fill={colors.PANEL} stroke={colors.POSITIVE} />
                <text x={995} y={350} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontWeight={700}>BLOCK SOURCES</text>
                {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={905 + (i % 3) * 90} cy={390 + Math.floor(i / 3) * 54} r={9 + 5 * combineU} fill={i === 0 ? colors.WARM : colors.ACCENT} opacity={0.35 + 0.55 * summaryU} />)}
                <text x={995} y={548} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>memory + communication = O(Nd)</text>
              </g>
            )}
          </g>
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={230} y={245} width={820} height={174} rx={20} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={2} />
          <text x={640} y={308} textAnchor="middle" fill={colors.TEXT} fontSize={30} fontWeight={750}>Depth becomes addressable memory</text>
          <text x={640} y={352} textAnchor="middle" fill={colors.MUTED} fontSize={16}>learned retrieval · block summaries · bounded live state</text>
          <text x={640} y={388} textAnchor="middle" fill={colors.SECONDARY} fontSize={12} fontFamily={MONO}>AttnRes · Eq. 9–10 · 8 × 12</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
