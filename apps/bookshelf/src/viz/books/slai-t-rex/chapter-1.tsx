// Training T-Rex — chapter 1: Shard the Beast.
//
// Grounded in cpt_training/scripts/train_cpt_deepseek4_flash_4k.sh,
// sft_training/scripts/train_sft_deepseek4_flash_8k.sh, and
// sft_training/scripts/launch_sft_deepseek4_flash_8n16_910c.sh.
// The released launchers set 8 nodes × 16 NPUs, TP=1, PP=4, EP=32, CP=1,
// 44 layers, global batch 128, and sequence lengths 4096 (CPT) / 8192 (SFT).
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const clamp01 = (u: number) => Math.max(0, Math.min(1, u));
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const COLS = 16;
const ROWS = 8;
const CELL = 44;
const GAP = 5;
const GRID_X = 235;
const GRID_Y = 115;
const W = COLS * (CELL + GAP) - GAP;
const H = ROWS * (CELL + GAP) - GAP;
const BAND_COLORS = [colors.ACCENT, colors.SECONDARY, colors.WARM, colors.POSITIVE];

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const gridU = tl.channel('gridU', 0);
  const bandU = tl.channel('bandU', 0);
  const expertU = tl.channel('expertU', 0);
  const fixedU = tl.channel('fixedU', 0);
  const pulse = tl.channel('pulse', 0);
  const lengthsU = tl.channel('lengthsU', 0);
  const batchU = tl.channel('batchU', 0);
  const dimU = tl.channel('dimU', 0);
  const endU = tl.channel('endU', 0);

  tl.caption({ at: 0.5, dur: 5.5, text: 'A trillion-parameter mixture-of-experts model does not fit on one accelerator. So the first problem is choreography.' });
  tl.tween(gridU, 1, { at: 0.9, dur: 2.2, ease: ease.enter });
  tl.tween(cam, { x: 640, y: 330, k: 1.08 }, { at: 1.2, dur: 1.4, ease: ease.move });
  tl.hold(6.0, 0.5);

  tl.caption({ at: 6.5, dur: 5.2, text: 'The released launch recipe starts with eight nodes, sixteen Ascend accelerators per node: one hundred twenty-eight workers.' });
  tl.hold(11.7, 0.5);

  tl.caption({ at: 12.2, dur: 5.5, text: 'Now slice forty-four transformer layers into four pipeline stages. Each band owns a different stretch of the model.' });
  tl.tween(bandU, 1, { at: 12.8, dur: 1.5, ease: ease.draw });
  tl.tween(cam, { x: 640, y: 330, k: 1.16 }, { at: 13.0, dur: 1.4, ease: ease.move });
  tl.hold(17.7, 0.5);

  tl.caption({ at: 18.2, dur: 5.4, text: 'Inside those stages, expert parallelism fans sparse experts across thirty-two lanes. Only the routed experts work on each token.' });
  tl.tween(expertU, 1, { at: 18.8, dur: 1.4, ease: ease.enter });
  tl.hold(23.6, 0.5);

  tl.caption({ at: 24.1, dur: 5.1, text: 'Tensor parallelism and context parallelism stay at one in this template. The axes are chosen, not blindly maximized.' });
  tl.tween(fixedU, 1, { at: 24.7, dur: 0.8, ease: ease.enter });
  tl.hold(29.2, 0.5);

  tl.caption({ at: 29.7, dur: 5.8, text: 'Watch one micro-batch cross the four bands. A stage computes, then hands its activations to the next stage.' });
  tl.tween(pulse, 4, { at: 30.4, dur: 4.4, ease: ease.linear });
  tl.hold(35.5, 0.5);

  tl.caption({ at: 36.0, dur: 5.3, text: 'Continued pre-training uses four-thousand-token sequences. Supervised fine-tuning stretches the same family to eight thousand.' });
  tl.tween(lengthsU, 1, { at: 36.7, dur: 1.2, ease: ease.move });
  tl.hold(41.3, 0.5);

  tl.caption({ at: 41.8, dur: 5.0, text: 'Both launchers make the global batch one hundred twenty-eight, while each worker handles a micro-batch of one.' });
  tl.tween(batchU, 1, { at: 42.4, dur: 1.0, ease: ease.enter });
  tl.hold(46.8, 0.5);

  tl.caption({ at: 47.3, dur: 5.2, text: 'The grid is the configuration: eight by sixteen hardware, four pipeline stages, thirty-two expert lanes.' });
  tl.tween(cam, CAMERA_HOME, { at: 47.8, dur: 1.4, ease: ease.move });
  tl.hold(52.5, 0.5);

  tl.caption({ at: 53.0, dur: 6.2, text: 'The model is not copied one hundred twenty-eight times. Its layers and experts are partitioned so one batch can move through the whole machine.' });
  tl.tween(dimU, 1, { at: 53.5, dur: 1.1, ease: ease.move });
  tl.tween(endU, 1, { at: 54.5, dur: 0.8, ease: ease.enter });
  tl.hold(59.2, 1.0);

  return { tl, cam, gridU, bandU, expertU, fixedU, pulse, lengthsU, batchU, dimU, endU };
}

const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const gridU = s.get(scene.gridU);
  const bandU = s.get(scene.bandU);
  const expertU = s.get(scene.expertU);
  const pulse = s.get(scene.pulse);
  const mainOpacity = 1 - 0.86 * s.get(scene.dimU);
  const activeBand = Math.min(3, Math.floor(Math.max(0, pulse - 0.001)));

  return (
    <>
      <rect width={1280} height={720} fill={colors.BG} />
      <Camera {...s.get(scene.cam)}>
        <g opacity={mainOpacity}>
          <text x={640} y={68} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={700}>DeepSeek-V4-Flash post-training lattice</text>
          <text x={640} y={92} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={MONO}>NNODES=8 · NPUS_PER_NODE=16 · WORLD_SIZE=128</text>
          {Array.from({ length: ROWS }, (_, r) => (
            <g key={r}>
              <text x={GRID_X - 22} y={GRID_Y + r * (CELL + GAP) + 27} textAnchor="end" fill={colors.MUTED} fontSize={10} fontFamily={MONO}>n{r}</text>
              {Array.from({ length: COLS }, (_, c) => {
                const i = r * COLS + c;
                const u = clamp01(gridU * 10 - i / 14);
                const band = Math.floor(r / 2);
                const glow = pulse > 0 && pulse < 4.2 && band === activeBand ? clamp01(1 - Math.abs((pulse % 1) - 0.5) * 1.8) : 0;
                return (
                  <g key={c} opacity={u}>
                    <rect
                      x={GRID_X + c * (CELL + GAP)}
                      y={GRID_Y + r * (CELL + GAP)}
                      width={CELL}
                      height={CELL}
                      rx={6}
                      fill={bandU > 0 ? BAND_COLORS[band] : colors.PANEL}
                      fillOpacity={0.12 + 0.16 * bandU + 0.28 * glow}
                      stroke={bandU > 0 ? BAND_COLORS[band] : colors.GRID}
                      strokeOpacity={0.45 + 0.55 * bandU}
                    />
                    {expertU > 0 && (
                      <text x={GRID_X + c * (CELL + GAP) + CELL / 2} y={GRID_Y + r * (CELL + GAP) + 27} textAnchor="middle" fill={colors.TEXT} opacity={expertU} fontSize={8.5} fontFamily={MONO}>
                        e{c * 2 + (r % 2)}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          ))}
          {bandU > 0 && [0, 1, 2, 3].map((b) => (
            <g key={b} opacity={bandU}>
              <rect x={GRID_X - 8} y={GRID_Y + b * 2 * (CELL + GAP) - 4} width={W + 16} height={CELL * 2 + GAP + 8} rx={10} fill="none" stroke={BAND_COLORS[b]} strokeWidth={2} />
              <text x={GRID_X + W + 18} y={GRID_Y + b * 2 * (CELL + GAP) + 51} fill={BAND_COLORS[b]} fontSize={11} fontFamily={MONO}>PP {b + 1}</text>
            </g>
          ))}
          {pulse > 0 && pulse < 4.1 && (
            <g transform={`translate(${GRID_X - 70 + (pulse / 4) * (W + 120)} ${GRID_Y + activeBand * 2 * (CELL + GAP) + 50})`}>
              <circle r={12} fill={colors.WARM} opacity={0.9} />
              <text x={0} y={4} textAnchor="middle" fill={colors.BG} fontSize={9} fontWeight={800}>μ</text>
            </g>
          )}
          {s.get(scene.fixedU) > 0 && (
            <g opacity={s.get(scene.fixedU)}>
              <rect x={390} y={525} width={500} height={42} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={640} y={551} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={MONO}>TP=1 · PP=4 · EP=32 · CP=1 · NUM_LAYERS=44</text>
            </g>
          )}
          {s.get(scene.lengthsU) > 0 && (
            <g opacity={s.get(scene.lengthsU)} transform="translate(340 578)">
              <rect width={270} height={28} rx={6} fill={colors.ACCENT} opacity={0.18} />
              <rect x={300} width={540} height={28} rx={6} fill={colors.SECONDARY} opacity={0.18} />
              <text x={135} y={19} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily={MONO}>CPT · SEQ_LEN=4096</text>
              <text x={570} y={19} textAnchor="middle" fill={colors.SECONDARY} fontSize={11} fontFamily={MONO}>SFT · SEQ_LEN=8192</text>
            </g>
          )}
          {s.get(scene.batchU) > 0 && (
            <text x={640} y={614} textAnchor="middle" fill={colors.WARM} opacity={s.get(scene.batchU)} fontSize={13} fontFamily={MONO}>MBS=1 × 128 workers → GBS=128</text>
          )}
        </g>
      </Camera>
      {s.get(scene.endU) > 0 && (
        <g opacity={s.get(scene.endU)}>
          <rect x={235} y={245} width={810} height={170} rx={18} fill={colors.PANEL} stroke={colors.ACCENT} />
          <text x={640} y={306} textAnchor="middle" fill={colors.TEXT} fontSize={27} fontWeight={700}>Partition the work, not the truth</text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={16}>128 workers · 4 pipeline stages · 32 expert lanes</text>
          <text x={640} y={382} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily={MONO}>train_cpt_deepseek4_flash_4k.sh · train_sft_deepseek4_flash_8k.sh</text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
