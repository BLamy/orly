// One Config, New Engine — the LLaMA-Factory integration.
//
// Backed by: doc/en/SFT/KTransformers-Fine-Tuning_Quick-Start.md (pip install
// "ktransformers[sft]" → ktransformers + kt-kernel + transformers-kt +
// accelerate-kt; accelerate launch --config_file examples/ktransformers/
// accelerate/fsdp2_kt_int8.yaml src/train.py examples/ktransformers/
// train_lora/qwen3_5moe_lora_sft_kt.yaml) and
// doc/en/SFT/KTransformers-Fine-Tuning_User-Guide.md (train YAML: "use_kt:
// true", "kt_optimize_rule: examples/kt_optimize_rules/
// DeepSeek-V3-Chat-sft-amx-multi-gpu.yaml", cpu_infer: 32, chunk_size: 8192;
// the injection rule replacing mlp.experts with
// ktransformers.operators.experts.KTransformersExperts, generate_op
// "KSFTExpertsCPU", out_device "cuda").
//
// ONE machine: the config IS the machine. A LLaMA-Factory train YAML scrolls
// on as a document; two lines light up (use_kt, kt_optimize_rule) and swing a
// literal engine-swap: the stock experts module lifts out of the model
// silhouette and the KT expert engine bolts in. Then the one-line launch.
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

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — YAML doc left, model silhouette right, launch bar bottom.
// ---------------------------------------------------------------------------

const DOC = { x: 110, y: 120, w: 430, h: 360 } as const;
const YAML_LINES = [
  { t: 'model_name_or_path: DeepSeek-V3-bf16', k: 'plain' },
  { t: 'stage: sft', k: 'plain' },
  { t: 'finetuning_type: lora', k: 'lora' },
  { t: 'lora_rank: 8', k: 'lora' },
  { t: 'dataset: identity', k: 'plain' },
  { t: 'per_device_train_batch_size: 1', k: 'plain' },
  { t: 'use_kt: true', k: 'kt' },
  { t: 'kt_optimize_rule: …V3-Chat-sft-amx-multi-gpu.yaml', k: 'kt' },
  { t: 'cpu_infer: 32', k: 'kt' },
  { t: 'chunk_size: 8192', k: 'kt' },
] as const;

const MODEL = { x: 650, y: 130, w: 420, h: 300 } as const;
const ENGINE_OLD = { x: MODEL.x + MODEL.w / 2, y: MODEL.y + 208 } as const;

const LAUNCH = { x: 140, y: 540, w: 1000, h: 40 } as const;

const CAM_DOC: CameraState = { x: 340, y: 320, k: 1.35 };
const CAM_MODEL: CameraState = { x: 860, y: 300, k: 1.3 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  pkgU: ChannelRef<number>; // the pip install chip
  docU: ChannelRef<number>; // YAML lines scroll in
  ktU: ChannelRef<number>; // the two kt lines glow
  modelU: ChannelRef<number>; // model silhouette
  swapU: ChannelRef<number>; // engine swap: stock out, KT in
  ruleU: ChannelRef<number>; // the injection-rule zoom card
  launchU: ChannelRef<number>; // accelerate launch bar
  runU: ChannelRef<number>; // loss ticker starts
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const pkgU = tl.channel('pkgU', 0);
  const docU = tl.channel('docU', 0);
  const ktU = tl.channel('ktU', 0);
  const modelU = tl.channel('modelU', 0);
  const swapU = tl.channel('swapU', 0);
  const ruleU = tl.channel('ruleU', 0);
  const launchU = tl.channel('launchU', 0);
  const runU = tl.channel('runU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the familiar frontend —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Nobody wants a new training framework. So the fine tuning story hides inside the one people already use: Llama Factory keeps the data, the schedule, and the configs.',
  });
  tl.tween(docU, 1, { at: 0.7, dur: 2.4, ease: ease.enter });
  tl.tween(cam, CAM_DOC, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.5, 0.5);

  // — Beat 2 · one package entry —
  tl.caption({
    at: 7.0,
    dur: 6.0,
    text: 'One package entry wires it up: installing the fine tuning extra pulls the kernel plus patched versions of the transformers and accelerate libraries into the environment.',
  });
  tl.tween(pkgU, 1, { at: 7.6, dur: 0.9, ease: ease.enter });
  tl.hold(13.0, 0.5);

  // — Beat 3 · two lines —
  tl.caption({
    at: 13.5,
    dur: 6.0,
    text: 'Inside an ordinary training config, two lines do all the work. One switch turns the backend on; one path names the placement rules for this exact model.',
  });
  tl.tween(ktU, 1, { at: 14.1, dur: 1.2, ease: ease.move });
  tl.hold(19.5, 0.5);

  // — Beat 4 · the engine swap —
  tl.caption({
    at: 20.0,
    dur: 7.0,
    text: 'What those lines trigger is an engine swap. At load time, the injection rules match every expert module in the model by name — and replace it with the K Transformers expert engine.',
  });
  tl.tween(cam, CAM_MODEL, { at: 20.2, dur: 1.4, ease: ease.move });
  tl.tween(modelU, 1, { at: 20.6, dur: 1.2, ease: ease.enter });
  tl.tween(swapU, 1, { at: 22.4, dur: 2.4, ease: ease.move });
  tl.hold(27.5, 0.5);

  // — Beat 5 · the rule card —
  tl.caption({
    at: 28.0,
    dur: 7.0,
    text: 'The rule is plain text you can read: match the expert modules, run their forward pass on the processor with the fine tuning kernel, and deliver outputs back to the card.',
  });
  tl.tween(ruleU, 1, { at: 28.6, dur: 1.0, ease: ease.enter });
  tl.hold(34.5, 0.5);

  // — Beat 6 · attention untouched —
  tl.caption({
    at: 35.0,
    dur: 5.5,
    text: 'Everything the rule does not match — attention, the router, the adapters you are training — stays exactly where the stock stack put it, on the cards.',
  });
  tl.hold(40.5, 0.5);

  // — Beat 7 · launch —
  tl.caption({
    at: 41.0,
    dur: 6.5,
    text: 'Then training starts the way it always has: one accelerate launch with a distributed config file and the training recipe. Same command shape, new machinery underneath.',
  });
  tl.tween(cam, CAM_WIDE, { at: 41.2, dur: 1.4, ease: ease.move });
  tl.tween(launchU, 1, { at: 42.0, dur: 1.2, ease: ease.enter });
  tl.tween(runU, 1, { at: 43.6, dur: 2.6, ease: ease.linear });
  tl.hold(47.5, 0.5);

  // — Beat 8 · close —
  tl.caption({
    at: 48.0,
    dur: 6.5,
    text: 'A familiar config, two honest lines, and a transplanted engine. What the transplanted engine computes in — and what your weights must look like first — is next.',
  });
  tl.tween(closeU, 1, { at: 48.8, dur: 1.3, ease: ease.move });
  tl.hold(54.5, 1.4);

  return { tl, cam, pkgU, docU, ktU, modelU, swapU, ruleU, launchU, runU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pkgU = s.get(scene.pkgU);
  const docU = s.get(scene.docU);
  const ktU = s.get(scene.ktU);
  const modelU = s.get(scene.modelU);
  const swapU = s.get(scene.swapU);
  const ruleU = s.get(scene.ruleU);
  const launchU = s.get(scene.launchU);
  const runU = s.get(scene.runU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  // engine swap: stock module rises & fades, KT engine slides in from right
  const oldY = ENGINE_OLD.y - swapU * 120;
  const newX = MODEL.x + MODEL.w + 120 - swapU * (MODEL.w / 2 + 120);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- pip chip ---- */}
          <g opacity={pkgU}>
            <rect x={DOC.x} y={64} width={DOC.w} height={34} rx={9} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.3} />
            <text x={DOC.x + DOC.w / 2} y={86} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily="ui-monospace, monospace">
              pip install "ktransformers[sft]"
            </text>
            <text x={DOC.x + DOC.w + 14} y={86} fill={colors.MUTED} fontSize={9.5}>
              → kt-kernel · transformers-kt · accelerate-kt
            </text>
          </g>

          {/* ---- the YAML ---- */}
          <g>
            <rect x={DOC.x} y={DOC.y} width={DOC.w} height={DOC.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} opacity={Math.min(1, docU * 3)} />
            <text x={DOC.x + 16} y={DOC.y + 26} fill={colors.MUTED} fontSize={11} fontFamily="ui-monospace, monospace" opacity={Math.min(1, docU * 3)}>
              train_lora/deepseek_v3_lora_sft_kt.yaml
            </text>
            {YAML_LINES.map((ln, i) => {
              const u = clamp01(docU * YAML_LINES.length * 1.15 - i);
              const isKt = ln.k === 'kt';
              const glow = isKt ? ktU : 0;
              return (
                <g key={i} opacity={u}>
                  {glow > 0.3 && <rect x={DOC.x + 10} y={DOC.y + 40 + i * 30} width={DOC.w - 20} height={24} rx={5} fill={colors.WARM} opacity={0.14 * glow} stroke={colors.WARM} strokeWidth={1} />}
                  <text x={DOC.x + 20} y={DOC.y + 57 + i * 30} fill={isKt && glow > 0.3 ? colors.WARM : ln.k === 'lora' ? colors.ACCENT : colors.MUTED} fontSize={11.5} fontFamily="ui-monospace, monospace">
                    {ln.t}
                  </text>
                </g>
              );
            })}
          </g>

          {/* ---- the model silhouette ---- */}
          <g opacity={modelU}>
            <rect x={MODEL.x} y={MODEL.y} width={MODEL.w} height={MODEL.h} rx={14} fill="none" stroke={colors.GRID} strokeWidth={1.4} />
            <text x={MODEL.x + 16} y={MODEL.y + 26} fill={colors.MUTED} fontSize={11.5}>
              the loaded model
            </text>
            {/* untouched stack */}
            {['attention (GPU)', 'router (GPU)', 'LoRA adapters (GPU, training)'].map((t, i) => (
              <g key={t}>
                <rect x={MODEL.x + 40} y={MODEL.y + 44 + i * 44} width={MODEL.w - 80} height={34} rx={8} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.1} />
                <text x={MODEL.x + MODEL.w / 2} y={MODEL.y + 66 + i * 44} textAnchor="middle" fill={colors.TEXT} fontSize={11.5}>
                  {t}
                </text>
              </g>
            ))}
            {/* the old experts module, lifting out */}
            <g opacity={1 - swapU * 0.9}>
              <rect x={MODEL.x + 40} y={oldY - 17} width={MODEL.w - 80} height={34} rx={8} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.1} strokeDasharray={swapU > 0.05 ? '6 4' : undefined} />
              <text x={MODEL.x + MODEL.w / 2} y={oldY + 5} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                mlp.experts — stock module
              </text>
            </g>
            {/* the KT engine, sliding in */}
            <g opacity={Math.min(1, swapU * 2)}>
              <rect x={newX - (MODEL.w - 80) / 2} y={ENGINE_OLD.y + 26} width={MODEL.w - 80} height={44} rx={8} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
              <text x={newX} y={ENGINE_OLD.y + 44} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5}>
                KTransformersExperts
              </text>
              <text x={newX} y={ENGINE_OLD.y + 62} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily="ui-monospace, monospace">
                generate_op: KSFTExpertsCPU · out_device: cuda
              </text>
            </g>
          </g>

          {/* injection rule card */}
          <g opacity={ruleU}>
            <rect x={MODEL.x + 30} y={MODEL.y + MODEL.h + 16} width={MODEL.w - 60} height={64} rx={10} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.2} />
            <text x={MODEL.x + 46} y={MODEL.y + MODEL.h + 38} fill={colors.SECONDARY} fontSize={9.5} fontFamily="ui-monospace, monospace">
              {'match: name: "^model\\.layers\\..*\\.mlp\\.experts$"'}
            </text>
            <text x={MODEL.x + 46} y={MODEL.y + MODEL.h + 58} fill={colors.MUTED} fontSize={9.5} fontFamily="ui-monospace, monospace">
              replace: ktransformers.operators.experts.KTransformersExperts
            </text>
          </g>

          {/* launch bar */}
          <g opacity={launchU}>
            <rect x={LAUNCH.x} y={LAUNCH.y} width={LAUNCH.w} height={LAUNCH.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
            <text x={LAUNCH.x + 16} y={LAUNCH.y + 25} fill={colors.TEXT} fontSize={11} fontFamily="ui-monospace, monospace">
              $ accelerate launch --config_file fsdp2_kt_int8.yaml src/train.py qwen3_5moe_lora_sft_kt.yaml
            </text>
            {runU > 0 && (
              <text x={LAUNCH.x + LAUNCH.w - 16} y={LAUNCH.y + 25} textAnchor="end" fill={colors.POSITIVE} fontSize={11} fontFamily="ui-monospace, monospace">
                loss {(2.31 - runU * 0.84).toFixed(2)} ▾
              </text>
            )}
          </g>
        </g>

        {/* close */}
        <g opacity={closeU}>
          <rect x={340} y={230} width={600} height={196} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={280} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            two lines, one transplant
          </text>
          <text x={640} y={318} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            the framework stays; the expert engine is swapped by name-match
          </text>
          <text x={640} y={340} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            attention, router, adapters: untouched on the cards
          </text>
          <text x={640} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            use_kt: true · kt_optimize_rule: …-sft-amx-multi-gpu.yaml
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
