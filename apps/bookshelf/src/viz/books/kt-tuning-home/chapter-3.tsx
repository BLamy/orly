// Weights Before Training — the preparation pipeline and the precision picks.
//
// Backed by: doc/en/SFT/KTransformers-Fine-Tuning_User-Guide.md ("You must
// provide a BF16 model. DeepSeek-V3-671B is released in FP8 by default;
// convert with DeepSeek-V3/inference/fp8_cast_bf16.py", the SFT injection
// kwargs backend: "AMXInt8" / "AMXBF16" / "llamafile", optimize-rule naming:
// *-sft-*, *-amx-*, *-multi-gpu-X*) and doc/en/AMX.md ("using AMXInt8
// requires reading weights from a BF16 GGUF file and performing online
// quantization during model loading").
//
// ONE machine: a weight conveyor. Checkpoints enter on the left in their
// release format (FP8 for Deepseek), pass a conversion station into BF16,
// then a fork: the training engine consumes them as sixteen bit, or
// quantizes online to eight bit for the matrix tiles. A naming decoder card
// reads a real optimize-rule filename like a boarding pass.
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
import { Connection } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — the conveyor.
// ---------------------------------------------------------------------------

const BELT_Y = 250;
// the belt is compressed so every station stays inside the stage at the fork camera
const ST_RELEASE = { x: 210, y: BELT_Y } as const;
const ST_CAST = { x: 480, y: BELT_Y } as const;
const ST_FORK = { x: 750, y: BELT_Y } as const;
const ST_BF16 = { x: 990, y: 170 } as const;
const ST_INT8 = { x: 990, y: 330 } as const;
const ST_W = 230;

// the bit ladder above the belt: one weight drawn as a row of bit cells
const BIT_X0 = ST_RELEASE.x - ST_W / 2;
const BIT_STEP = 24;
const BIT_W = 20;

// the decoder is a four-field boarding pass: one column per field
const DECODER = { x: 200, y: 430, w: 880, h: 150 } as const;
const DEC_COL0 = DECODER.x + 24 + 104;
const DEC_COL_W = 208;
const DEC_CHAR_W = 10.2; // advance of 17px monospace
// the real rule filename, split into decodable chunks, one per field
const RULE_PARTS = [
  { field: 'MODEL', txt: 'DeepSeek-V3-Chat', gloss: 'the target model' },
  { field: 'PURPOSE', txt: '-sft-', gloss: 'a fine-tuning rule (not inference)' },
  { field: 'BACKEND', txt: 'amx', gloss: 'tile backend on the CPU' },
  { field: 'CARDS', txt: '-multi-gpu', gloss: 'model parallel · default 2 cards' },
] as const;

const CAM_BELT: CameraState = { x: 640, y: 250, k: 1.1 };
const CAM_FORK: CameraState = { x: 645, y: 250, k: 1.15 };
const CAM_DEC: CameraState = { x: 640, y: 440, k: 1.15 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  beltU: ChannelRef<number>;
  crateU: ChannelRef<number>; // FP8 crate enters
  gateU: ChannelRef<number>; // "BF16 required" gate flags it
  castU: ChannelRef<number>; // conversion runs, crate recolors
  forkU: ChannelRef<number>; // the two backend branches
  pickK: ChannelRef<number>; // 0 = AMXBF16 branch lit, 1 = AMXInt8 branch lit
  onlineU: ChannelRef<number>; // "online quantization at load" note
  decU: ChannelRef<number>; // decoder card
  decK: ChannelRef<number>; // decoder sweep 0..4
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beltU = tl.channel('beltU', 0);
  const crateU = tl.channel('crateU', 0);
  const gateU = tl.channel('gateU', 0);
  const castU = tl.channel('castU', 0);
  const forkU = tl.channel('forkU', 0);
  const pickK = tl.channel('pickK', 0);
  const onlineU = tl.channel('onlineU', 0);
  const decU = tl.channel('decU', 0);
  const decK = tl.channel('decK', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the crate arrives —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Before any training step runs, the weights themselves need a journey. Deepseek ships its checkpoint in eight bit floating point — that is how it leaves the factory.',
  });
  tl.tween(beltU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAM_BELT, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(crateU, 1, { at: 1.8, dur: 1.8, ease: ease.linear });
  tl.hold(6.5, 0.5);

  // — Beat 2 · the gate —
  tl.caption({
    at: 7.0,
    dur: 5.5,
    text: 'The fine tuning path is strict at the door: it must be handed a sixteen bit model. Eight bit release weights get stopped right here.',
  });
  tl.tween(gateU, 1, { at: 7.6, dur: 0.7, ease: ease.pop });
  tl.hold(12.5, 0.5);

  // — Beat 3 · the cast —
  tl.caption({
    at: 13.0,
    dur: 6.0,
    text: 'So the first station is a cast: an official conversion script widens every eight bit weight to sixteen bit brain float. Bigger on disk, exact for training.',
  });
  tl.tween(castU, 1, { at: 13.4, dur: 2.2, ease: ease.linear });
  tl.hold(19.0, 0.5);

  // — Beat 4 · the fork —
  tl.caption({
    at: 19.5,
    dur: 6.5,
    text: 'Then the belt forks by backend. The sixteen bit branch feeds the tiles at full fidelity. The eight bit branch trades a little precision for nearly double the integer throughput.',
  });
  tl.tween(cam, CAM_FORK, { at: 19.7, dur: 1.4, ease: ease.move });
  tl.tween(forkU, 1, { at: 20.3, dur: 1.6, ease: ease.enter });
  tl.hold(25.5, 0.5);

  // — Beat 5 · online quantization —
  tl.caption({
    at: 26.0,
    dur: 6.5,
    text: 'And here is the practical mercy: the eight bit branch quantizes online, while the model loads. You store one sixteen bit copy on disk; the integer weights exist only in memory.',
  });
  tl.tween(pickK, 1, { at: 26.4, dur: 1.2, ease: ease.move });
  tl.tween(onlineU, 1, { at: 28.0, dur: 0.8, ease: ease.enter });
  tl.hold(32.0, 0.5);

  // — Beat 6 · the decoder —
  tl.caption({
    at: 32.5,
    dur: 6.5,
    text: 'Which branch you get is written in the rule filename, and the naming is a little language. Read one like a boarding pass: model, purpose, backend, and how many cards.',
  });
  tl.tween(cam, CAM_DEC, { at: 32.7, dur: 1.4, ease: ease.move });
  tl.tween(decU, 1, { at: 33.5, dur: 0.9, ease: ease.enter });
  tl.tween(decK, 4, { at: 34.6, dur: 3.4, ease: ease.linear });
  tl.hold(39.5, 0.5);

  // — Beat 7 · the checklist —
  tl.caption({
    at: 40.0,
    dur: 6.0,
    text: 'That is the whole preparation ritual: cast the release weights up to sixteen bit once, pick a backend, and let the loader do the shrinking on the way in.',
  });
  tl.tween(cam, CAM_WIDE, { at: 40.2, dur: 1.4, ease: ease.move });
  tl.hold(46.0, 0.5);

  // — Beat 8 · close —
  tl.caption({
    at: 46.5,
    dur: 6.0,
    text: 'The weights are staged, the engine is transplanted, the adapters are waiting. All that remains is to close the loop — train, load, and talk to your own model.',
  });
  tl.tween(closeU, 1, { at: 47.3, dur: 1.3, ease: ease.move });
  tl.hold(52.5, 1.4);

  return { tl, cam, beltU, crateU, gateU, castU, forkU, pickK, onlineU, decU, decK, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Station({ x, y, label, sub, color, u }: { x: number; y: number; label: string; sub?: string; color: string; u: number }) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u}>
      <rect x={x - ST_W / 2} y={y - 34} width={ST_W} height={68} rx={11} fill={colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text x={x} y={y - 4} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
        {label}
      </text>
      {sub && (
        <text x={x} y={y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily="ui-monospace, monospace">
          {sub}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const beltU = s.get(scene.beltU);
  const crateU = s.get(scene.crateU);
  const gateU = s.get(scene.gateU);
  const castU = s.get(scene.castU);
  const forkU = s.get(scene.forkU);
  const pickK = s.get(scene.pickK);
  const onlineU = s.get(scene.onlineU);
  const decU = s.get(scene.decU);
  const decK = s.get(scene.decK);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  // the belt steps back while the camera sits on the decoder: the camera's own move drives it
  const decFocus = clamp01((cam.y - CAM_WIDE.y) / (CAM_DEC.y - CAM_WIDE.y));
  const beltDim = 1 - decFocus * 0.7;
  // the crate's x position: enters → gate (pauses) → through cast
  const crateX = ST_RELEASE.x + (ST_CAST.x - 90 - ST_RELEASE.x) * crateU + (ST_FORK.x - ST_CAST.x + 20) * castU;
  const crateColor = castU > 0.55 ? colors.ACCENT : colors.SECONDARY;
  const crateLabel = castU > 0.55 ? 'BF16' : 'FP8';

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          <g opacity={beltDim}>
            {/* the belt */}
            <g opacity={beltU}>
              <line x1={120} y1={BELT_Y + 46} x2={ST_FORK.x + 30} y2={BELT_Y + 46} stroke={colors.GRID} strokeWidth={3} opacity={0.7} />
              <Connection from={{ x: ST_FORK.x + 30, y: BELT_Y + 46 }} to={{ x: ST_BF16.x - ST_W / 2, y: ST_BF16.y + 20 }} elbow="h" u={forkU} color={colors.GRID} width={2} />
              <Connection from={{ x: ST_FORK.x + 30, y: BELT_Y + 46 }} to={{ x: ST_INT8.x - ST_W / 2, y: ST_INT8.y + 10 }} elbow="h" u={forkU} color={colors.GRID} width={2} />
            </g>

            <Station x={ST_RELEASE.x} y={ST_RELEASE.y} label="release checkpoint" sub="DeepSeek-V3 · FP8" color={colors.SECONDARY} u={beltU} />
            <Station x={ST_CAST.x} y={ST_CAST.y} label="cast up to BF16" sub="fp8_cast_bf16.py" color={colors.ACCENT} u={beltU} />
            <Station x={ST_BF16.x} y={ST_BF16.y} label="AMXBF16" sub="full fidelity · 16-bit tiles" color={forkU > 0 && pickK < 0.5 ? colors.POSITIVE : colors.MUTED} u={forkU} />
            <Station x={ST_INT8.x} y={ST_INT8.y} label="AMXInt8" sub="faster int math · online quant" color={forkU > 0 && pickK >= 0.5 ? colors.POSITIVE : colors.MUTED} u={forkU} />

            {/* the bit ladder: the same weight counted in bits, 8 becomes 16 at the cast */}
            <g opacity={beltU}>
              <text x={BIT_X0} y={140} fill={colors.MUTED} fontSize={14}>
                {castU > 0.55 ? 'one weight · 16 bits · BF16' : 'one weight · 8 bits · FP8'}
              </text>
              {Array.from({ length: 16 }, (_, i) => (
                <rect
                  key={i}
                  x={BIT_X0 + i * BIT_STEP}
                  y={148}
                  width={BIT_W}
                  height={18}
                  rx={3}
                  fill={i < 8 ? colors.SECONDARY : colors.ACCENT}
                  opacity={i < 8 ? 0.85 : 0.1 + castU * 0.75}
                />
              ))}
            </g>
            <g opacity={onlineU}>
              <text x={BIT_X0 + 17 * BIT_STEP} y={140} fill={colors.MUTED} fontSize={14}>
                in memory only · AMXInt8 · 8 bits
              </text>
              {Array.from({ length: 8 }, (_, i) => (
                <rect key={i} x={BIT_X0 + (17 + i) * BIT_STEP} y={148} width={BIT_W} height={18} rx={3} fill={colors.WARM} opacity={0.85} />
              ))}
            </g>

            {/* the BF16-required gate: it is passed once the cast runs */}
            <g opacity={gateU}>
              <line x1={(ST_RELEASE.x + ST_CAST.x) / 2} y1={BELT_Y - 60} x2={(ST_RELEASE.x + ST_CAST.x) / 2} y2={BELT_Y + 60} stroke={colors.NEGATIVE} strokeWidth={2.5} strokeDasharray="8 5" opacity={1 - castU} />
              <text x={(ST_RELEASE.x + ST_CAST.x) / 2} y={BELT_Y - 72} textAnchor="middle" fill={colors.NEGATIVE} fontSize={14} opacity={1 - castU}>
                SFT requires BF16
              </text>
            </g>

            {/* the crate rides under the belt line, clear of the station boxes */}
            <g opacity={Math.min(1, crateU * 4)}>
              <rect x={crateX - 34} y={BELT_Y + 50} width={68} height={26} rx={6} fill={crateColor} opacity={0.9} />
              <text x={crateX} y={BELT_Y + 68} textAnchor="middle" fill={colors.BG} fontSize={13} fontWeight={700}>
                {crateLabel}
              </text>
            </g>

            {/* online quant note */}
            <g opacity={onlineU}>
              <rect x={ST_INT8.x - 135} y={ST_INT8.y + 46} width={270} height={32} rx={9} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.2} />
              <text x={ST_INT8.x} y={ST_INT8.y + 67} textAnchor="middle" fill={colors.WARM} fontSize={13}>
                quantized during model loading
              </text>
            </g>
          </g>

          {/* the decoder card: four fields, one column each */}
          <g opacity={decU}>
            <rect x={DECODER.x} y={DECODER.y} width={DECODER.w} height={DECODER.h} rx={12} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.3} />
            <text x={DECODER.x + 24} y={DECODER.y + 28} fill={colors.MUTED} fontSize={13}>
              kt_optimize_rule, decoded:
            </text>
            {RULE_PARTS.map((p, i) => {
              const on = clamp01(decK - i);
              const cx = DEC_COL0 + i * DEC_COL_W;
              const w = p.txt.length * DEC_CHAR_W;
              return (
                <g key={i}>
                  <text x={cx} y={DECODER.y + 62} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                    {p.field}
                  </text>
                  <text x={cx} y={DECODER.y + 92} textAnchor="middle" fill={on > 0.5 ? colors.WARM : colors.TEXT} fontSize={17} fontFamily="ui-monospace, monospace">
                    {p.txt}
                  </text>
                  <g opacity={on}>
                    <line x1={cx - w / 2} y1={DECODER.y + 102} x2={cx + w / 2} y2={DECODER.y + 102} stroke={colors.WARM} strokeWidth={1.6} />
                    <text x={cx} y={DECODER.y + 126} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
                      {p.gloss}
                    </text>
                  </g>
                </g>
              );
            })}
            <text x={DEC_COL0 + 3 * DEC_COL_W + (RULE_PARTS[3].txt.length * DEC_CHAR_W) / 2 + 2} y={DECODER.y + 92} fill={colors.TEXT} fontSize={17} fontFamily="ui-monospace, monospace">
              .yaml
            </text>
          </g>
        </g>

        {/* close */}
        <g opacity={closeU}>
          <rect x={340} y={230} width={600} height={192} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={280} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            stage the weights, then let the loader shrink them
          </text>
          <text x={640} y={318} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            release FP8 → cast to BF16 once → AMXBF16 or AMXInt8 at load
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            the rule filename is the boarding pass
          </text>
          <text x={640} y={394} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            DeepSeek-V3-Chat-sft-amx-multi-gpu.yaml · backend: "AMXInt8"
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
