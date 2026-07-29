// The Bill Comes Back — the reported numbers, honestly labeled.
//
// Backed by: doc/en/AMX.md ("our kernel can achieve 21 TFLOPS of BF16
// throughput and 35 TOPS of Int8 throughput on Xeon4 CPUs — about 4× faster
// than PyTorch's general AMX kernel", "inference speeds for large models like
// DeepSeek-V3 reached only 91 tokens/s during the prefill phase" before AMX,
// "up to 347 tokens/s prefill performance in the workstation scenario"
// (Qwen3, AMX path), "For DeepSeek-V3, pairing a Xeon4 CPU with a single RTX
// 4090 GPU achieves 418 tokens/s end-to-end throughput, close to the
// performance of multi-machine, multi-GPU setups").
//
// ONE machine: a receipts board. Each claim rises as a bar against its
// "before" — kernel throughput, prefill before/after, end-to-end — every one
// stamped "reported", then the honest caveat: these are the project's own
// benchmarks. The book closes by tying tiles → menu → layout together.
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
// The reported receipts (doc/en/AMX.md, verbatim numbers).
// ---------------------------------------------------------------------------

const KERNEL = [
  { key: 'BF16', val: 21, unit: 'TFLOPS', color: colors.ACCENT },
  { key: 'Int8', val: 35, unit: 'TOPS', color: colors.POSITIVE },
] as const;

const PREFILL = [
  { key: 'llamafile kernels (before)', val: 91, color: colors.MUTED },
  { key: 'AMX path (after)', val: 347, color: colors.WARM },
] as const;

const BARS = { x: 260, y0: 480, w: 46, gap: 130, hMax: 260 } as const;

const CAM_KERNEL: CameraState = { x: 420, y: 360, k: 1.4 };
const CAM_PREFILL: CameraState = { x: 800, y: 360, k: 1.35 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  boardU: ChannelRef<number>;
  kbar: ChannelRef<number>[];
  fourU: ChannelRef<number>; // "4× PyTorch's AMX kernel" chip
  pbar: ChannelRef<number>[];
  e2eU: ChannelRef<number>; // 418 t/s end-to-end dial
  capU: ChannelRef<number>; // the caveat stamp
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const boardU = tl.channel('boardU', 0);
  const kbar = KERNEL.map((_, i) => tl.channel(`kbar${i}`, 0));
  const fourU = tl.channel('fourU', 0);
  const pbar = PREFILL.map((_, i) => tl.channel(`pbar${i}`, 0));
  const e2eU = tl.channel('e2eU', 0);
  const capU = tl.channel('capU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the board —
  tl.caption({
    at: 0.5,
    dur: 5.5,
    text: 'Three chapters of care — a precision menu, tile silicon, a fed cache — now the bill comes back. These are the project’s own published numbers.',
  });
  tl.tween(boardU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.hold(6.0, 0.5);

  // — Beat 2 · kernel throughput —
  tl.caption({
    at: 6.5,
    dur: 6.5,
    text: 'First, the raw kernel: twenty one trillion floating point operations per second in sixteen bit, thirty five trillion integer operations in eight bit, on one server processor.',
  });
  tl.tween(cam, CAM_KERNEL, { at: 6.7, dur: 1.4, ease: ease.move });
  tl.tween(kbar[0], 1, { at: 7.3, dur: 1.6, ease: ease.move });
  tl.tween(kbar[1], 1, { at: 8.3, dur: 1.6, ease: ease.move });
  tl.hold(13.0, 0.5);

  // — Beat 3 · the 4× —
  tl.caption({
    at: 13.5,
    dur: 5.5,
    text: 'That is roughly four times what the general purpose matrix kernel in the standard deep learning stack gets from the very same tiles. The silicon was never the bottleneck.',
  });
  tl.tween(fourU, 1, { at: 14.3, dur: 0.6, ease: ease.pop });
  tl.hold(19.0, 0.5);

  // — Beat 4 · prefill before/after —
  tl.caption({
    at: 19.5,
    dur: 6.5,
    text: 'Second, what it means for a real model. Before the tile path, Deepseek V three prefill crawled at ninety one tokens per second. With it: three hundred forty seven on a workstation.',
  });
  tl.tween(cam, CAM_PREFILL, { at: 19.7, dur: 1.4, ease: ease.move });
  tl.tween(pbar[0], 1, { at: 20.3, dur: 1.4, ease: ease.move });
  tl.tween(pbar[1], 1, { at: 21.7, dur: 1.8, ease: ease.move });
  tl.hold(26.0, 0.5);

  // — Beat 5 · end to end —
  tl.caption({
    at: 26.5,
    dur: 6.5,
    text: 'And end to end — one server processor, one consumer graphics card — four hundred eighteen tokens per second, which the authors describe as close to multi machine, multi card setups.',
  });
  tl.tween(cam, CAM_WIDE, { at: 26.7, dur: 1.4, ease: ease.move });
  tl.tween(e2eU, 1, { at: 27.5, dur: 1.8, ease: ease.move });
  tl.hold(33.0, 0.5);

  // — Beat 6 · the caveat —
  tl.caption({
    at: 33.5,
    dur: 6.0,
    text: 'One honest stamp on every bar: reported. These are the project’s benchmarks on the project’s hardware. Your model, your prompt lengths, and your memory will move them.',
  });
  tl.tween(capU, 1, { at: 34.3, dur: 0.7, ease: ease.pop });
  tl.hold(39.5, 0.5);

  // — Beat 7 · the book recap —
  tl.caption({
    at: 40.0,
    dur: 8.0,
    text: 'So the path holds together: pick a precision from the menu, let the tiles do the multiplying, keep them fed from cache — and the processor earns its half of the heterogeneous bet.',
  });
  tl.tween(closeU, 1, { at: 40.8, dur: 1.4, ease: ease.move });
  tl.hold(48.0, 0.4);

  // — Beat 8 · bridge —
  tl.caption({
    at: 48.4,
    dur: 5.5,
    text: 'One book remains — and it flips the arrow. The same rig that serves the giant model can fine tune it. Tuning at home is next.',
  });
  tl.hold(53.9, 1.4);

  return { tl, cam, boardU, kbar, fourU, pbar, e2eU, capU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Bar({ x, val, max, u, color, label, unit }: { x: number; val: number; max: number; u: number; color: string; label: string; unit: string }) {
  const h = (val / max) * BARS.hMax * u;
  return (
    <g>
      <rect x={x} y={BARS.y0 - h} width={BARS.w} height={h} rx={7} fill={color} opacity={0.85} />
      {u > 0.6 && (
        <text x={x + BARS.w / 2} y={BARS.y0 - h - 10} textAnchor="middle" fill={color} fontSize={13.5} fontFamily="ui-monospace, monospace">
          {val} {unit}
        </text>
      )}
      <text x={x + BARS.w / 2} y={BARS.y0 + 20} textAnchor="middle" fill={colors.MUTED} fontSize={10}>
        {label.split(' (')[0]}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const boardU = s.get(scene.boardU);
  const kbar = scene.kbar.map((c) => s.get(c));
  const fourU = s.get(scene.fourU);
  const pbar = scene.pbar.map((c) => s.get(c));
  const e2eU = s.get(scene.e2eU);
  const capU = s.get(scene.capU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* board frame */}
          <g opacity={boardU}>
            <line x1={180} y1={BARS.y0} x2={1120} y2={BARS.y0} stroke={colors.GRID} strokeWidth={1.4} />
            <text x={330} y={150} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
              kernel throughput · Xeon 4
            </text>
            <text x={820} y={150} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
              DeepSeek-V3 prefill · tokens/s
            </text>
          </g>

          {/* kernel bars */}
          {KERNEL.map((k, i) => (
            <Bar key={k.key} x={BARS.x + i * BARS.gap} val={k.val} max={40} u={kbar[i]} color={k.color} label={k.key} unit={k.unit} />
          ))}
          <g opacity={fourU}>
            <rect x={BARS.x - 32} y={186} width={230} height={30} rx={8} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.3} />
            <text x={BARS.x + 83} y={206} textAnchor="middle" fill={colors.WARM} fontSize={11.5}>
              ≈ 4× the stock AMX kernel
            </text>
          </g>

          {/* prefill bars */}
          {PREFILL.map((p, i) => (
            <Bar key={p.key} x={700 + i * BARS.gap} val={p.val} max={400} u={pbar[i]} color={p.color} label={p.key} unit={''} />
          ))}
          {pbar[1] >= 1 && (
            <text x={830 + BARS.w / 2} y={BARS.y0 - (347 / 400) * BARS.hMax - 30} textAnchor="middle" fill={colors.WARM} fontSize={10.5}>
              3.8× prefill
            </text>
          )}

          {/* end-to-end chip */}
          <g opacity={e2eU}>
            <rect x={430} y={520} width={420} height={56} rx={12} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.5} />
            <text x={640} y={544} textAnchor="middle" fill={colors.TEXT} fontSize={14.5}>
              418 tokens/s end-to-end
            </text>
            <text x={640} y={564} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
              DeepSeek-V3 · 1× Xeon 4 + 1× RTX 4090
            </text>
          </g>

          {/* the reported stamp */}
          <g opacity={capU} transform="rotate(-8 1050 200)">
            <rect x={975} y={178} width={150} height={44} rx={9} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.2} />
            <text x={1050} y={206} textAnchor="middle" fill={colors.NEGATIVE} fontSize={16} fontWeight={700} letterSpacing={2}>
              REPORTED
            </text>
          </g>
        </g>

        {/* close */}
        <g opacity={closeU}>
          <rect x={300} y={210} width={680} height={250} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={256} textAnchor="middle" fill={colors.TEXT} fontSize={19}>
            the AMX path, receipts attached
          </text>
          {[
            ['the menu', 'bits chosen per model:\n16, 8, or 4', colors.ACCENT],
            ['the tiles', '32,768 mul-adds\nper instruction', colors.POSITIVE],
            ['the feed', 'aligned bricks,\ncache-resident blocks', colors.WARM],
          ].map(([head, sub, c], i) => (
            <g key={head}>
              <rect x={338 + i * 210} y={288} width={190} height={100} rx={10} fill={colors.BG} stroke={c} strokeWidth={1.4} />
              <text x={433 + i * 210} y={320} textAnchor="middle" fill={colors.TEXT} fontSize={13.5}>
                {head}
              </text>
              {String(sub).split('\n').map((line, k) => (
                <text key={k} x={433 + i * 210} y={344 + k * 15} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                  {line}
                </text>
              ))}
            </g>
          ))}
          <text x={640} y={432} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            next: Tuning at Home — the same rig, fine-tuning the giant
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
