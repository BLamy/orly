// One Token's Journey — the heterogeneous forward pass.
//
// Backed by: kt-kernel/python/experts.py (class KTMoEWrapper — "the main
// entry point for external code", forward / submit_forward / sync_forward,
// num_gpu_experts, cpuinfer_threads, threadpool_count), kt-kernel/README.md
// ("'hot' experts run on GPU and 'cold' experts run on CPU",
// --kt-max-deferred-experts-per-token "allows CPU to process next batch while
// GPU completes current batch"), doc/en/kt-kernel/kt-kernel_intro.md.
//
// ONE machine: a single MoE layer in cross-section — attention + router + hot
// experts inside the GPU zone, cold experts behind thread pools inside the
// CPU zone, a PCIe bridge between them. One token runs the full circuit, the
// two halves visibly compute at once, then the circuit repeats layer after
// layer as a pulse counter.
import {
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type { CameraState, ChannelRef, SceneState } from '../../core';
import { Connection, RequestFlow, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — GPU zone left, CPU zone right, PCIe bridge between.
// ---------------------------------------------------------------------------

const GPUZ = { x: 76, y: 120, w: 470, h: 400 } as const;
const CPUZ = { x: 720, y: 120, w: 484, h: 400 } as const;

const ATTN = { x: 190, y: 200 } as const;
const ROUTER = { x: 190, y: 330 } as const;
const HOT = [
  { x: 400, y: 210 },
  { x: 400, y: 290 },
] as const;
const COLD = [
  { x: 830, y: 200 },
  { x: 970, y: 200 },
  { x: 1110, y: 200 },
  { x: 830, y: 290 },
  { x: 970, y: 290 },
  { x: 1110, y: 290 },
] as const;
const COMBINE = { x: 400, y: 430 } as const;
const BRIDGE_Y = 250;

// Opening framing: both zones, their outer experts and the layer counter on
// stage. The beats push toward the card, then the processor, then pull back.
const FRAME: CameraState = { x: 640, y: 330, k: 1.04 };
// Pushes are mild: at 1.1 the whole layout still fits the 1280-wide stage.
const CAM_GPU: CameraState = { x: 600, y: 330, k: 1.1 };
const CAM_CPU: CameraState = { x: 660, y: 330, k: 1.1 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  zonesU: ChannelRef<number>;
  attnU: ChannelRef<number>;
  tokIn: ChannelRef<number>;
  routeU: ChannelRef<number>;
  pickU: ChannelRef<number>;
  hotGo: ChannelRef<number>;
  coldGo: ChannelRef<number>;
  poolU: ChannelRef<number>;
  bothU: ChannelRef<number>;
  backU: ChannelRef<number>;
  mergeU: ChannelRef<number>;
  deferU: ChannelRef<number>;
  loopN: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', FRAME, cameraInterp);
  const zonesU = tl.channel('zonesU', 0); // the two silicon zones
  const attnU = tl.channel('attnU', 0); // attention + router + experts
  const tokIn = tl.channel('tokIn', 0); // token → attention
  const routeU = tl.channel('routeU', 0); // attention → router
  const pickU = tl.channel('pickU', 0); // router's top-k glow
  const hotGo = tl.channel('hotGo', 0); // token copy → hot experts
  const coldGo = tl.channel('coldGo', 0); // token copy → cold experts (over PCIe)
  const poolU = tl.channel('poolU', 0); // thread pools spin
  const bothU = tl.channel('bothU', 0); // simultaneous compute pulse
  const backU = tl.channel('backU', 0); // cold results return
  const mergeU = tl.channel('mergeU', 0); // weighted combine
  const deferU = tl.channel('deferU', 0); // deferred-experts teaser chip
  const loopN = tl.channel('loopN', 0); // layer counter 0→61
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the floor plan —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'Here is the machine the last chapter booted, in cross-section: one silicon neighborhood on the graphics card, one on the processor, a bus between them.',
  });
  tl.tween(zonesU, 1, { at: 0.7, dur: 1.6, ease: ease.draw });
  tl.tween(attnU, 1, { at: 2.2, dur: 1.6, ease: ease.enter });
  tl.hold(6.5, 0.5);

  // — Beat 2 · the token arrives —
  tl.caption({
    at: 7.0,
    dur: 5.5,
    text: 'A token arrives. Attention runs where it always runs — on the card, dense, fast, no surprises.',
  });
  tl.tween(cam, CAM_GPU, { at: 7.2, dur: 1.3, ease: ease.move });
  tl.tween(tokIn, 1, { at: 7.8, dur: 1.6, ease: ease.linear });
  tl.hold(12.5, 0.5);

  // — Beat 3 · the router decides —
  tl.caption({
    at: 13.0,
    dur: 6.5,
    text: 'Then the router reads the token and picks its experts — say eight of them. Two happen to be hot experts, already resident on the card.',
  });
  tl.tween(routeU, 1, { at: 13.3, dur: 1.2, ease: ease.linear });
  tl.tween(pickU, 1, { at: 14.8, dur: 0.6, ease: ease.pop });
  tl.tween(hotGo, 1, { at: 15.8, dur: 1.4, ease: ease.linear });
  tl.hold(19.5, 0.5);

  // — Beat 4 · the cold six cross the bridge —
  tl.caption({
    at: 20.0,
    dur: 6.5,
    text: 'The other six live across the bridge. The token’s activations — a few kilobytes, not the gigabytes of weights — make the trip instead.',
  });
  tl.tween(coldGo, 1, { at: 20.4, dur: 2.2, ease: ease.linear });
  tl.hold(26.5, 0.5);

  // — Beat 5 · the wrapper —
  tl.caption({
    at: 27.0,
    dur: 6.5,
    text: 'On the processor side a wrapper object owns the experts. It fans the work across thread pools — one per memory domain — so every socket chews on its own slice.',
  });
  tl.tween(cam, CAM_CPU, { at: 27.2, dur: 1.4, ease: ease.move });
  tl.tween(poolU, 1, { at: 28.2, dur: 1.4, ease: ease.enter });
  tl.hold(33.5, 0.5);

  // — Beat 6 · both at once —
  tl.caption({
    at: 34.0,
    dur: 6.0,
    text: 'And here is the whole trick: both neighborhoods compute at the same time. The card is never waiting politely for the processor, or the other way around.',
  });
  tl.tween(cam, CAM_WIDE, { at: 34.2, dur: 1.4, ease: ease.move });
  tl.tween(bothU, 1, { at: 35.2, dur: 2.6, ease: ease.linear });
  tl.hold(40.0, 0.5);

  // — Beat 7 · merge —
  tl.caption({
    at: 40.5,
    dur: 6.0,
    text: 'The cold results stream back, and the layer combines every expert’s answer, weighted by the router, on the card — the output device.',
  });
  tl.tween(backU, 1, { at: 40.9, dur: 2.0, ease: ease.linear });
  tl.tween(mergeU, 1, { at: 43.1, dur: 0.8, ease: ease.pop });
  tl.hold(46.5, 0.5);

  // — Beat 8 · deferral teaser —
  tl.caption({
    at: 47.0,
    dur: 6.5,
    text: 'One flag can even let a couple of expert answers arrive a step late, so the pipeline never stalls. That gamble gets a chapter of its own in the next book.',
  });
  tl.tween(deferU, 1, { at: 47.8, dur: 0.8, ease: ease.enter });
  tl.hold(53.5, 0.5);

  // — Beat 9 · sixty one times —
  tl.caption({
    at: 54.0,
    dur: 6.5,
    text: 'Now run that circuit for every layer — sixty one of them in Deepseek V three — and the token that falls out the bottom is your next word.',
  });
  tl.tween(loopN, 61, { at: 54.4, dur: 3.6, ease: ease.linear });
  tl.hold(60.5, 0.5);

  // — Beat 10 · close —
  tl.caption({
    at: 61.0,
    dur: 6.5,
    text: 'Weights stay home, activations travel, both processors stay busy. Next chapter we knock on this server’s front door the way any client would.',
  });
  tl.tween(closeU, 1, { at: 61.8, dur: 1.3, ease: ease.move });
  tl.hold(67.5, 1.4);

  return { tl, cam, zonesU, attnU, tokIn, routeU, pickU, hotGo, coldGo, poolU, bothU, backU, mergeU, deferU, loopN, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function Box({ x, y, w = 150, h = 52, label, sub, color, u, glow = 0 }: { x: number; y: number; w?: number; h?: number; label: string; sub?: string; color: string; u: number; glow?: number }) {
  if (u <= 0.01) return null;
  return (
    <g opacity={u}>
      {glow > 0.05 && <rect x={x - w / 2 - 5} y={y - h / 2 - 5} width={w + 10} height={h + 10} rx={12} fill={color} opacity={glow * 0.25} />}
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={9} fill={colors.PANEL} stroke={color} strokeWidth={1.4} />
      <text x={x} y={sub ? y - 2 : y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
        {label}
      </text>
      {sub && (
        <text x={x} y={y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily="ui-monospace, monospace">
          {sub}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const zonesU = s.get(scene.zonesU);
  const attnU = s.get(scene.attnU);
  const tokIn = s.get(scene.tokIn);
  const routeU = s.get(scene.routeU);
  const pickU = s.get(scene.pickU);
  const hotGo = s.get(scene.hotGo);
  const coldGo = s.get(scene.coldGo);
  const poolU = s.get(scene.poolU);
  const bothU = s.get(scene.bothU);
  const backU = s.get(scene.backU);
  const mergeU = s.get(scene.mergeU);
  const deferU = s.get(scene.deferU);
  const loopN = s.get(scene.loopN);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;
  // simultaneous-compute pulse: 3 cycles over bothU
  const pulse = bothU > 0 && bothU < 1 ? 0.5 + 0.5 * Math.sin(bothU * Math.PI * 6) : 0;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* zones */}
          <Zone x={GPUZ.x} y={GPUZ.y} w={GPUZ.w} h={GPUZ.h} label="GPU · the card" kind="group" u={zonesU} color={colors.ACCENT} />
          <Zone x={CPUZ.x} y={CPUZ.y} w={CPUZ.w} h={CPUZ.h} label="CPU · system RAM" kind="group" u={zonesU} color={colors.POSITIVE} />
          {/* PCIe bridge */}
          <g opacity={zonesU}>
            <line x1={GPUZ.x + GPUZ.w} y1={BRIDGE_Y} x2={CPUZ.x} y2={BRIDGE_Y} stroke={colors.MUTED} strokeWidth={8} opacity={0.45} strokeLinecap="round" />
            <text x={(GPUZ.x + GPUZ.w + CPUZ.x) / 2} y={BRIDGE_Y - 14} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              PCIe
            </text>
            {/* what crossed the bridge stays labelled once the cold beat is over */}
            <text x={(GPUZ.x + GPUZ.w + CPUZ.x) / 2} y={BRIDGE_Y + 30} textAnchor="middle" fill={colors.POSITIVE} fontSize={14} opacity={coldGo}>
              activations only
            </text>
          </g>

          {/* GPU internals */}
          <Box x={ATTN.x} y={ATTN.y} w={170} label="attention" sub="dense · every token" color={colors.ACCENT} u={attnU} glow={tokIn >= 1 ? 0.7 : 0} />
          <Box x={ROUTER.x} y={ROUTER.y} w={170} label="router" sub="top-k gate" color={colors.SECONDARY} u={attnU} glow={pickU} />
          {HOT.map((p, i) => (
            <Box key={i} x={p.x} y={p.y} w={110} h={44} label={`hot expert`} color={colors.WARM} u={attnU} glow={Math.max(hotGo >= 1 ? 0.6 : 0, pulse)} />
          ))}
          <Box x={COMBINE.x} y={COMBINE.y} w={150} h={44} label="weighted combine" sub="out_device: cuda" color={colors.ACCENT} u={attnU} glow={mergeU} />

          {/* CPU internals */}
          {COLD.map((p, i) => (
            <Box key={i} x={p.x} y={p.y} w={110} h={44} label="cold expert" color={colors.POSITIVE} u={attnU} glow={Math.max(coldGo >= 1 ? 0.5 : 0, pulse)} />
          ))}
          <g opacity={poolU}>
            <rect x={CPUZ.x + 40} y={370} width={CPUZ.w - 80} height={62} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.2} />
            <text x={CPUZ.x + CPUZ.w / 2} y={394} textAnchor="middle" fill={colors.TEXT} fontSize={14}>
              KTMoEWrapper.forward
            </text>
            <text x={CPUZ.x + CPUZ.w / 2} y={414} textAnchor="middle" fill={colors.MUTED} fontSize={12.5} fontFamily="ui-monospace, monospace">
              cpuinfer_threads: 64 · threadpool_count: 2 (NUMA)
            </text>
          </g>

          {/* flows */}
          {tokIn > 0 && tokIn < 1 && (
            <RequestFlow path={[{ x: ATTN.x - 160, y: ATTN.y }, { x: ATTN.x - 65, y: ATTN.y }]} u={tokIn} color={colors.WARM} r={8} label="token" />
          )}
          <Connection from={{ x: ATTN.x, y: ATTN.y + 26 }} to={{ x: ROUTER.x, y: ROUTER.y - 26 }} u={routeU} color={colors.GRID} arrow width={1.4} />
          {hotGo > 0 && hotGo < 1 && (
            <RequestFlow path={[{ x: ROUTER.x + 65, y: ROUTER.y }, { x: HOT[0].x - 55, y: HOT[0].y + 20 }]} u={hotGo} color={colors.WARM} r={6} />
          )}
          {coldGo > 0 && coldGo < 1 && (
            <RequestFlow
              path={[
                { x: ROUTER.x + 65, y: ROUTER.y },
                { x: GPUZ.x + GPUZ.w, y: BRIDGE_Y },
                { x: CPUZ.x + 40, y: BRIDGE_Y },
                { x: COLD[1].x, y: COLD[1].y + 40 },
              ]}
              u={coldGo}
              color={colors.POSITIVE}
              r={6}
              label="activations, not weights"
              dwell={0.12}
            />
          )}
          {backU > 0 && backU < 1 && (
            <RequestFlow
              path={[
                { x: COLD[3].x, y: COLD[3].y + 22 },
                { x: CPUZ.x, y: BRIDGE_Y + 60 },
                { x: COMBINE.x + 80, y: COMBINE.y },
              ]}
              u={backU}
              color={colors.POSITIVE}
              r={6}
              label="expert outputs"
            />
          )}
          <Connection from={{ x: HOT[1].x, y: HOT[1].y + 22 }} to={{ x: COMBINE.x, y: COMBINE.y - 22 }} u={mergeU} color={colors.GRID} arrow width={1.2} />

          {/* deferral chip */}
          <g opacity={deferU}>
            <rect x={CPUZ.x} y={540} width={330} height={32} rx={8} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.2} />
            <text x={CPUZ.x + 165} y={561} textAnchor="middle" fill={colors.SECONDARY} fontSize={13} fontFamily="ui-monospace, monospace">
              --kt-max-deferred-experts-per-token 2
            </text>
          </g>

          {/* layer counter */}
          {loopN > 0.5 && (
            <g>
              <rect x={GPUZ.x} y={540} width={190} height={32} rx={9} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
              <text x={GPUZ.x + 95} y={561} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontFamily="ui-monospace, monospace">
                layer {Math.min(61, Math.ceil(loopN))} / 61
              </text>
            </g>
          )}
        </g>

        {/* close */}
        <g opacity={closeU}>
          <rect x={300} y={196} width={680} height={288} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={252} textAnchor="middle" fill={colors.TEXT} fontSize={20}>
            the heterogeneous forward pass
          </text>
          <text x={640} y={300} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
            weights stay home · activations travel · both processors stay busy
          </text>
          <text x={640} y={380} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily="ui-monospace, monospace">
            KTMoEWrapper.forward(hidden_states, topk_ids, topk_weights, cuda_stream)
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
