// The Loop Closes — train, load the adapter, talk to your own model.
//
// Backed by: doc/en/SFT/KTransformers-Fine-Tuning_User-Guide.md (Core
// Feature 2: "llamafactory-cli chat examples/inference/qwen3_lora_sft.yaml"
// with adapter_name_or_path: saves/Kllama_deepseekV3 and infer_backend:
// ktransformers; measured: 671B step_time 203 s → 40.35 token/s, V2-Lite 36 s
// → 227.6 token/s; backend table: KT 530.38 token/s vs HuggingFace 303.58 on
// 14B; AfriMed-QA multiple choice V3 0.5833 → 0.7930 after KT-LoRA) and Core
// Feature 3 (API_PORT=8000 llamafactory-cli api …).
//
// ONE machine: the loop itself, drawn as a circle — dataset → training rig →
// adapter file → chat/api → back to data. Each quadrant activates in turn;
// measured numbers and the before/after benchmark bars land as receipts; the
// series recap closes the ring.
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
// Layout — the ring and its four stations.
// ---------------------------------------------------------------------------

const RING = { cx: 500, cy: 320, r: 190 } as const;
const angleOf = (k: number): number => -Math.PI / 2 + (k * Math.PI) / 2; // top, right, bottom, left
const stationPos = (k: number): { x: number; y: number } => ({
  x: RING.cx + Math.cos(angleOf(k)) * RING.r,
  y: RING.cy + Math.sin(angleOf(k)) * RING.r,
});
const STATIONS = [
  { label: 'your data', sub: 'dataset: identity / yours', color: colors.SECONDARY },
  { label: 'the training rig', sub: 'accelerate launch · use_kt', color: colors.ACCENT },
  { label: 'the adapter', sub: 'saves/Kllama_deepseekV3', color: colors.WARM },
  { label: 'chat · api', sub: 'infer_backend: ktransformers', color: colors.POSITIVE },
] as const;

// benchmark bars (measured, from the user guide)
const SPEED = [
  { key: 'HuggingFace · 14B', val: 303.58, color: colors.MUTED },
  { key: 'Unsloth · 14B', val: 455.37, color: colors.SECONDARY },
  { key: 'KTransformers · 14B', val: 530.38, color: colors.POSITIVE },
] as const;
const BENCH = { x: 860, y: 150, w: 300 } as const;

const CAM_RING: CameraState = { x: 520, y: 330, k: 1.25 };
const CAM_BENCH: CameraState = { x: 950, y: 300, k: 1.35 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ringU: ChannelRef<number>;
  st: ChannelRef<number>[]; // station activations
  arcU: ChannelRef<number>; // traveling pulse around the ring
  stepU: ChannelRef<number>; // the 203s/40.35 t/s chip
  speedU: ChannelRef<number>; // the backend bars
  qualU: ChannelRef<number>; // the accuracy jump chip
  loopU: ChannelRef<number>; // second lap (the loop keeps going)
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const ringU = tl.channel('ringU', 0);
  const st = STATIONS.map((_, i) => tl.channel(`st${i}`, 0));
  const arcU = tl.channel('arcU', 0);
  const stepU = tl.channel('stepU', 0);
  const speedU = tl.channel('speedU', 0);
  const qualU = tl.channel('qualU', 0);
  const loopU = tl.channel('loopU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the ring —
  tl.caption({
    at: 0.5,
    dur: 5.5,
    text: 'Everything in this book bends into one circle: data goes in, an adapter comes out, and the adapter answers questions that produce better data.',
  });
  tl.tween(ringU, 1, { at: 0.7, dur: 1.8, ease: ease.draw });
  tl.tween(cam, CAM_RING, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.tween(st[0], 1, { at: 2.2, dur: 0.8, ease: ease.enter });
  tl.hold(6.0, 0.5);

  // — Beat 2 · training —
  tl.caption({
    at: 6.5,
    dur: 6.5,
    text: 'Station one you have seen: the launch command from chapter two grinds through your dataset on the split rig. For the full six hundred seventy one billion, a step takes about two hundred three seconds.',
  });
  tl.tween(st[1], 1, { at: 6.9, dur: 0.8, ease: ease.enter });
  tl.tween(arcU, 0.25, { at: 7.2, dur: 1.4, ease: ease.linear });
  tl.tween(stepU, 1, { at: 9.4, dur: 0.7, ease: ease.pop });
  tl.hold(13.0, 0.5);

  // — Beat 3 · the artifact —
  tl.caption({
    at: 13.5,
    dur: 6.0,
    text: 'What falls out is small and portable: a safetensors adapter in your saves folder — the sliver you trained, separable from the frozen giant it steers.',
  });
  tl.tween(st[2], 1, { at: 13.9, dur: 0.8, ease: ease.enter });
  tl.tween(arcU, 0.5, { at: 14.2, dur: 1.4, ease: ease.linear });
  tl.hold(19.5, 0.5);

  // — Beat 4 · loading it back —
  tl.caption({
    at: 20.0,
    dur: 6.5,
    text: 'Station three closes the circuit: the chat command loads base plus adapter with the same backend, or serves it as an interface any client can call — the door from book one.',
  });
  tl.tween(st[3], 1, { at: 20.4, dur: 0.8, ease: ease.enter });
  tl.tween(arcU, 0.75, { at: 20.7, dur: 1.4, ease: ease.linear });
  tl.hold(26.5, 0.5);

  // — Beat 5 · the speed receipts —
  tl.caption({
    at: 27.0,
    dur: 6.5,
    text: 'The measured receipts: on a fourteen billion parameter mixture, this backend fine tunes at five hundred thirty tokens per second — against three hundred for the stock stack.',
  });
  tl.tween(cam, CAM_BENCH, { at: 27.2, dur: 1.4, ease: ease.move });
  tl.tween(speedU, 1, { at: 27.8, dur: 2.2, ease: ease.move });
  tl.hold(33.5, 0.5);

  // — Beat 6 · the quality receipts —
  tl.caption({
    at: 34.0,
    dur: 6.5,
    text: 'And it is not motion for its own sake. On a medical benchmark, the six hundred seventy one billion base scored fifty eight percent; after a few hours of adapter training, seventy nine.',
  });
  tl.tween(qualU, 1, { at: 34.8, dur: 1.2, ease: ease.move });
  tl.hold(40.5, 0.5);

  // — Beat 7 · the loop spins —
  tl.caption({
    at: 41.0,
    dur: 6.0,
    text: 'Then the wheel keeps turning: chat with the tuned model, collect where it still stumbles, fold that back into the dataset, and train again. Local inference funds local learning.',
  });
  tl.tween(cam, CAM_WIDE, { at: 41.2, dur: 1.4, ease: ease.move });
  tl.tween(loopU, 1, { at: 41.8, dur: 3.0, ease: ease.linear });
  tl.tween(arcU, 1, { at: 41.8, dur: 3.0, ease: ease.linear });
  tl.hold(47.0, 0.5);

  // — Beat 8 · series recap —
  tl.caption({
    at: 47.5,
    dur: 8.5,
    text: 'And that is the whole series: a model split across two memories, experts shuffled to where they earn their keep, precision chosen like a budget, and now a fine tuning loop that runs where you live.',
  });
  tl.tween(closeU, 1, { at: 48.3, dur: 1.4, ease: ease.move });
  tl.hold(56.0, 1.6);

  return { tl, cam, ringU, st, arcU, stepU, speedU, qualU, loopU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ringU = s.get(scene.ringU);
  const st = scene.st.map((c) => s.get(c));
  const arcU = s.get(scene.arcU);
  const stepU = s.get(scene.stepU);
  const speedU = s.get(scene.speedU);
  const qualU = s.get(scene.qualU);
  const loopU = s.get(scene.loopU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  // the traveling pulse
  const pulseA = angleOf(0) + arcU * Math.PI * 2;
  const px = RING.cx + Math.cos(pulseA) * RING.r;
  const py = RING.cy + Math.sin(pulseA) * RING.r;
  const circumference = 2 * Math.PI * RING.r;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* the ring */}
          <circle
            cx={RING.cx}
            cy={RING.cy}
            r={RING.r}
            fill="none"
            stroke={colors.GRID}
            strokeWidth={2.2}
            strokeDasharray={`${circumference * ringU} ${circumference}`}
            transform={`rotate(-90 ${RING.cx} ${RING.cy})`}
            opacity={0.85}
          />
          {/* second-lap glow */}
          <circle cx={RING.cx} cy={RING.cy} r={RING.r} fill="none" stroke={colors.POSITIVE} strokeWidth={2.2} opacity={loopU * 0.5} />

          {/* stations */}
          {STATIONS.map((stn, k) => {
            const p = stationPos(k);
            const u = st[k];
            if (u <= 0.01) return null;
            return (
              <g key={stn.label} opacity={u}>
                <rect x={p.x - 92} y={p.y - 32} width={184} height={64} rx={11} fill={colors.PANEL} stroke={stn.color} strokeWidth={1.5} />
                <text x={p.x} y={p.y - 4} textAnchor="middle" fill={colors.TEXT} fontSize={12.5}>
                  {stn.label}
                </text>
                <text x={p.x} y={p.y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily="ui-monospace, monospace">
                  {stn.sub}
                </text>
              </g>
            );
          })}

          {/* the pulse */}
          {arcU > 0 && <circle cx={px} cy={py} r={8} fill={colors.WARM} opacity={0.95} />}

          {/* step-time chip */}
          <g opacity={stepU}>
            <rect x={RING.cx - 110} y={RING.cy - 30} width={220} height={60} rx={11} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.3} />
            <text x={RING.cx} y={RING.cy - 6} textAnchor="middle" fill={colors.TEXT} fontSize={12.5}>
              671B · step_time 203 s
            </text>
            <text x={RING.cx} y={RING.cy + 16} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
              → 40.35 token/s (measured)
            </text>
          </g>

          {/* speed bars */}
          <g opacity={speedU}>
            <text x={BENCH.x} y={BENCH.y - 14} fill={colors.TEXT} fontSize={12.5}>
              LoRA fine-tune throughput · token/s
            </text>
            {SPEED.map((b, i) => {
              const w = (b.val / 560) * BENCH.w * speedU;
              return (
                <g key={b.key}>
                  <text x={BENCH.x} y={BENCH.y + 18 + i * 46} fill={colors.MUTED} fontSize={10}>
                    {b.key}
                  </text>
                  <rect x={BENCH.x} y={BENCH.y + 24 + i * 46} width={w} height={15} rx={5} fill={b.color} opacity={0.88} />
                  <text x={BENCH.x + w + 8} y={BENCH.y + 36 + i * 46} fill={b.color} fontSize={10.5} fontFamily="ui-monospace, monospace">
                    {b.val}
                  </text>
                </g>
              );
            })}
            <text x={BENCH.x} y={BENCH.y + 160} fill={colors.MUTED} fontSize={9.5}>
              671B: HF cannot run · KT 40.35 (measured)
            </text>
          </g>

          {/* quality chip */}
          <g opacity={qualU}>
            <rect x={BENCH.x} y={BENCH.y + 186} width={300} height={70} rx={11} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.3} />
            <text x={BENCH.x + 150} y={BENCH.y + 212} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
              AfriMed multiple choice · V3
            </text>
            <text x={BENCH.x + 150} y={BENCH.y + 236} textAnchor="middle" fill={colors.WARM} fontSize={13.5} fontFamily="ui-monospace, monospace">
              0.5833 → 0.7930
            </text>
          </g>
        </g>

        {/* close — the series recap */}
        <g opacity={closeU}>
          <rect x={270} y={186} width={740} height={288} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={232} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            the K Transformers series, complete
          </text>
          {[
            ['№1', 'the split', 'hot path on the card,\nexperts beside the CPU', colors.ACCENT],
            ['№2', 'the shuffle', 'budgets, strategies,\ndeferral, live updates', colors.SECONDARY],
            ['№3', 'the tiles', 'precision menu +\nAMX arithmetic', colors.WARM],
            ['№4', 'the loop', 'LoRA at home:\ntrain, load, chat', colors.POSITIVE],
          ].map(([no, head, sub, c], i) => (
            <g key={String(head)}>
              <rect x={302 + i * 174} y={262} width={160} height={124} rx={10} fill={colors.BG} stroke={c} strokeWidth={1.4} />
              <text x={382 + i * 174} y={288} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
                {no}
              </text>
              <text x={382 + i * 174} y={310} textAnchor="middle" fill={colors.TEXT} fontSize={13.5}>
                {head}
              </text>
              {String(sub).split('\n').map((line, k) => (
                <text key={k} x={382 + i * 174} y={334 + k * 15} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
                  {line}
                </text>
              ))}
            </g>
          ))}
          <text x={640} y={430} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            kvcache-ai/ktransformers · kt run · sglang-kt · ktransformers[sft]
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
