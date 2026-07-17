// The Fine-Tune You Couldn't Afford — 1400 GB theoretical vs 70 GB measured.
//
// Backed by: doc/en/SFT/KTransformers-Fine-Tuning_User-Guide.md ("With just
// 2–4 RTX 4090s and a high-memory CPU, you can fine-tune ultra-large MoE
// models like DeepSeek-671B"; the comparison table: HuggingFace backend
// [671B] "Too Huge to run", theoretical 1400 GB FP16 resident footprint vs
// KTransformers 70 GB measured peak, 40.35 token/s; "Attention on GPU +
// layered MoE offload"; V2-Lite 14B: 6.08 GB vs 32.12 GB HF) and LoRA:
// "finetuning_type: lora, lora_rank: 8".
//
// ONE machine: a memory wall for training. Full fine-tuning stacks weights +
// gradients + optimizer states into a tower that dwarfs any card; LoRA
// shrinks the trainable sliver to adapters, and the KT split drops the
// resident footprint to a measured 70 gigabytes across a few consumer cards.
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
// Layout — the tower vs the rig.
// ---------------------------------------------------------------------------

// Tower: theoretical FP16 full-parameter fine-tune footprint (1400 GB, from
// the docs) drawn as stacked slabs; the rig: 4 × 24 GB cards + CPU RAM shelf.
const TOWER = { x: 300, w: 190, base: 540, hMax: 420 } as const; // 1400 GB → 420 px
const gb2px = (gb: number): number => (gb / 1400) * TOWER.hMax;
const SLABS = [
  { key: 'weights (FP16)', gb: 671 * 2 * 0.5, color: colors.ACCENT }, // proportioned to sum 1400 with others
  { key: 'gradients', gb: 400, color: colors.SECONDARY },
  { key: 'optimizer states', gb: 329, color: colors.NEGATIVE },
] as const;

const CARDS = [0, 1, 2, 3];
const CARD = { x: 760, y: 210, w: 92, h: 54, gap: 14 } as const;
const RAM = { x: 760, y: 452, w: 410, h: 88 } as const;

const CAM_TOWER: CameraState = { x: 390, y: 340, k: 1.35 };
const CAM_RIG: CameraState = { x: 950, y: 340, k: 1.3 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  towerU: ChannelRef<number>;
  slab: ChannelRef<number>[];
  vetoU: ChannelRef<number>; // "Too Huge to run" stamp
  loraU: ChannelRef<number>; // adapter sliver appears
  freezeU: ChannelRef<number>; // base weights freeze (dim to ice)
  rigU: ChannelRef<number>; // the 4-card + RAM rig
  splitU: ChannelRef<number>; // attention→cards, experts→RAM flows
  meterU: ChannelRef<number>; // 70 GB measured chip
  liteU: ChannelRef<number>; // the 14B side-note chip
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const towerU = tl.channel('towerU', 0);
  const slab = SLABS.map((_, i) => tl.channel(`slab${i}`, 0));
  const vetoU = tl.channel('vetoU', 0);
  const loraU = tl.channel('loraU', 0);
  const freezeU = tl.channel('freezeU', 0);
  const rigU = tl.channel('rigU', 0);
  const splitU = tl.channel('splitU', 0);
  const meterU = tl.channel('meterU', 0);
  const liteU = tl.channel('liteU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · training is a bigger animal —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Serving the giant model was one bet. Training it is a bigger animal, because training remembers: every weight drags gradients and optimizer state behind it.',
  });
  tl.tween(towerU, 1, { at: 0.7, dur: 1.2, ease: ease.draw });
  tl.tween(cam, CAM_TOWER, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(slab[0], 1, { at: 1.8, dur: 1.4, ease: ease.move });
  tl.hold(6.5, 0.5);

  // — Beat 2 · the tower —
  tl.caption({
    at: 7.0,
    dur: 6.5,
    text: 'Stack it up for the six hundred seventy one billion parameter Deepseek and the documentation puts the theoretical resident footprint at fourteen hundred gigabytes. No rig you own holds that tower.',
  });
  tl.tween(slab[1], 1, { at: 7.4, dur: 1.4, ease: ease.move });
  tl.tween(slab[2], 1, { at: 8.8, dur: 1.4, ease: ease.move });
  tl.tween(vetoU, 1, { at: 11.0, dur: 0.6, ease: ease.pop });
  tl.hold(13.5, 0.5);

  // — Beat 3 · LoRA —
  tl.caption({
    at: 14.0,
    dur: 7.0,
    text: 'First cut: stop training the whole thing. Low rank adaptation freezes the base weights and learns two skinny matrices per layer — rank eight here — a sliver of trainable state.',
  });
  tl.tween(freezeU, 1, { at: 14.6, dur: 1.4, ease: ease.move });
  tl.tween(loraU, 1, { at: 16.4, dur: 1.2, ease: ease.enter });
  tl.hold(20.5, 0.5);

  // — Beat 4 · but the frozen giant still needs a home —
  tl.caption({
    at: 21.0,
    dur: 6.0,
    text: 'But frozen weights still need somewhere to sit during every forward and backward pass. The tower shrinks; it does not vanish. This is where the first three books walk back in.',
  });
  tl.hold(27.0, 0.5);

  // — Beat 5 · the rig —
  tl.caption({
    at: 27.5,
    dur: 6.5,
    text: 'The K Transformers answer is the same split, aimed at training: attention lives on two to four consumer cards, and the mixture layers offload to processor memory, layer by layer.',
  });
  tl.tween(cam, CAM_RIG, { at: 27.7, dur: 1.4, ease: ease.move });
  tl.tween(rigU, 1, { at: 28.5, dur: 1.4, ease: ease.enter });
  tl.tween(splitU, 1, { at: 30.2, dur: 2.2, ease: ease.linear });
  tl.hold(34.0, 0.5);

  // — Beat 6 · the measured number —
  tl.caption({
    at: 34.5,
    dur: 6.5,
    text: 'The measured peak across the cards: seventy gigabytes total. The stock training path could not run this model at all — its own table says too huge to run.',
  });
  tl.tween(meterU, 1, { at: 35.3, dur: 0.8, ease: ease.pop });
  tl.hold(41.0, 0.5);

  // — Beat 7 · it scales down too —
  tl.caption({
    at: 41.5,
    dur: 6.0,
    text: 'And the trick is not only for giants: on a fourteen billion parameter mixture, the same backend fine tunes in six gigabytes of card memory where the standard stack needs thirty two.',
  });
  tl.tween(liteU, 1, { at: 42.3, dur: 0.8, ease: ease.enter });
  tl.hold(47.5, 0.5);

  // — Beat 8 · close —
  tl.caption({
    at: 48.0,
    dur: 7.0,
    text: 'So a home rig can hold the tower after all: freeze the giant, train the sliver, split the memory. The next chapter wires this into a training framework you already know.',
  });
  tl.tween(cam, CAM_WIDE, { at: 48.2, dur: 1.4, ease: ease.move });
  tl.tween(closeU, 1, { at: 48.8, dur: 1.3, ease: ease.move });
  tl.hold(55.0, 1.4);

  return { tl, cam, towerU, slab, vetoU, loraU, freezeU, rigU, splitU, meterU, liteU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const towerU = s.get(scene.towerU);
  const slab = scene.slab.map((c) => s.get(c));
  const vetoU = s.get(scene.vetoU);
  const loraU = s.get(scene.loraU);
  const freezeU = s.get(scene.freezeU);
  const rigU = s.get(scene.rigU);
  const splitU = s.get(scene.splitU);
  const meterU = s.get(scene.meterU);
  const liteU = s.get(scene.liteU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;

  // stacked slabs bottom-up
  let yCursor = TOWER.base;
  const slabRects = SLABS.map((sl, i) => {
    const h = gb2px(sl.gb) * slab[i];
    yCursor -= h;
    return { ...sl, y: yCursor, h };
  });

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* ---- the tower ---- */}
          <g opacity={towerU}>
            <line x1={TOWER.x - 40} y1={TOWER.base} x2={TOWER.x + TOWER.w + 60} y2={TOWER.base} stroke={colors.GRID} strokeWidth={1.4} />
            <text x={TOWER.x + TOWER.w / 2} y={TOWER.base + 22} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
              full FP16 fine-tune · DeepSeek-V3 671B
            </text>
          </g>
          {slabRects.map((sl) => (
            <g key={sl.key}>
              <rect x={TOWER.x} y={sl.y} width={TOWER.w} height={Math.max(0, sl.h - 2)} rx={7} fill={sl.color} opacity={0.7 * (1 - freezeU * (sl.key === 'weights (FP16)' ? 0 : 0.55))} />
              {sl.h > 26 && (
                <text x={TOWER.x + TOWER.w / 2} y={sl.y + sl.h / 2 + 4} textAnchor="middle" fill={colors.BG} fontSize={11} fontWeight={600} opacity={0.9}>
                  {sl.key}
                </text>
              )}
            </g>
          ))}
          {slab[2] >= 1 && (
            <text x={TOWER.x + TOWER.w / 2} y={TOWER.base - TOWER.hMax - 14} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13.5} fontFamily="ui-monospace, monospace">
              ~1400 GB theoretical
            </text>
          )}
          {/* veto stamp */}
          <g opacity={vetoU} transform="rotate(-9 390 300)">
            <rect x={280} y={276} width={220} height={46} rx={9} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={2.2} />
            <text x={390} y={306} textAnchor="middle" fill={colors.NEGATIVE} fontSize={15} fontWeight={700}>
              “Too Huge to run”
            </text>
          </g>
          {/* frozen overlay + LoRA sliver */}
          <g opacity={freezeU}>
            <text x={TOWER.x + TOWER.w + 16} y={TOWER.base - 60} fill={colors.ACCENT} fontSize={11}>
              base weights frozen
            </text>
          </g>
          <g opacity={loraU}>
            <rect x={TOWER.x + TOWER.w + 14} y={TOWER.base - 40} width={26} height={40} rx={5} fill={colors.WARM} opacity={0.9} />
            <text x={TOWER.x + TOWER.w + 48} y={TOWER.base - 22} fill={colors.WARM} fontSize={11} fontFamily="ui-monospace, monospace">
              LoRA adapters · lora_rank: 8
            </text>
            <text x={TOWER.x + TOWER.w + 48} y={TOWER.base - 6} fill={colors.MUTED} fontSize={9.5}>
              the only trainable state
            </text>
          </g>

          {/* ---- the rig ---- */}
          <g opacity={rigU}>
            <text x={RAM.x + RAM.w / 2} y={CARD.y - 30} textAnchor="middle" fill={colors.TEXT} fontSize={13}>
              the home rig
            </text>
            {CARDS.map((k) => (
              <g key={k}>
                <rect x={CARD.x + k * (CARD.w + CARD.gap)} y={CARD.y} width={CARD.w} height={CARD.h} rx={9} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.3} />
                <text x={CARD.x + k * (CARD.w + CARD.gap) + CARD.w / 2} y={CARD.y + 24} textAnchor="middle" fill={colors.ACCENT} fontSize={10.5}>
                  RTX 4090
                </text>
                <text x={CARD.x + k * (CARD.w + CARD.gap) + CARD.w / 2} y={CARD.y + 42} textAnchor="middle" fill={colors.MUTED} fontSize={9}>
                  24 GB
                </text>
              </g>
            ))}
            <rect x={RAM.x} y={RAM.y} width={RAM.w} height={RAM.h} rx={11} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.3} />
            <text x={RAM.x + RAM.w / 2} y={RAM.y + 34} textAnchor="middle" fill={colors.POSITIVE} fontSize={12}>
              CPU RAM · ~1.2–1.3 TB for 671B
            </text>
            <text x={RAM.x + RAM.w / 2} y={RAM.y + 58} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
              layered MoE offload (frozen experts)
            </text>
          </g>
          {/* split flows */}
          <g opacity={splitU}>
            <text x={RAM.x + RAM.w / 2} y={CARD.y + CARD.h + 34} textAnchor="middle" fill={colors.ACCENT} fontSize={10.5}>
              ↑ attention + adapters on the cards
            </text>
            <text x={RAM.x + RAM.w / 2} y={RAM.y - 16} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5}>
              ↓ mixture layers stream through system memory
            </text>
          </g>
          {/* measured chip */}
          <g opacity={meterU}>
            <rect x={RAM.x + 40} y={CARD.y + 96} width={330} height={54} rx={11} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.5} />
            <text x={RAM.x + 205} y={CARD.y + 119} textAnchor="middle" fill={colors.WARM} fontSize={14}>
              70 GB measured peak (all cards)
            </text>
            <text x={RAM.x + 205} y={CARD.y + 139} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
              vs 1400 GB theoretical — 20× less video memory
            </text>
          </g>
          {/* 14B note */}
          <g opacity={liteU}>
            <rect x={RAM.x + 40} y={RAM.y + RAM.h + 14} width={330} height={32} rx={9} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.1} />
            <text x={RAM.x + 205} y={RAM.y + RAM.h + 35} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
              DeepSeek-V2-Lite 14B: 6.08 GB (KT) vs 32.12 GB (HF)
            </text>
          </g>
        </g>

        {/* close */}
        <g opacity={closeU}>
          <rect x={340} y={238} width={600} height={186} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            freeze the giant · train the sliver · split the memory
          </text>
          <text x={640} y={326} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            LoRA holds the pen; the heterogeneous split holds the model
          </text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            next: one YAML flag hands the whole engine to K Transformers
          </text>
          <text x={640} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            finetuning_type: lora · lora_rank: 8 · 2–4 × RTX 4090
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
