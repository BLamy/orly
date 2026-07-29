// Deferred Experts — buying overlap with a one-step delay.
//
// Backed by: kt-kernel/README.md ("--kt-max-deferred-experts-per-token:
// Number of experts per token to defer for pipelined execution", "0:
// Synchronous execution (simpler, higher latency)", "1-4: Deferred execution
// (recommended range…)", "5-7: Highest latency reduction but may introduce
// noticeable accuracy loss", "allows CPU to process next batch while GPU
// completes current batch") and kt-kernel/python/experts.py
// (max_deferred_experts_per_token, submit_forward / sync_forward).
//
// ONE machine: two execution lanes — GPU above, CPU below — running token
// steps as bars on a shared clock. Synchronous mode shows the bubbles;
// deferral slides the CPU's slowest experts one step right and the bubbles
// close. A dial steps 0 → 2 → 6 and an accuracy lamp dims at 6.
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
// Layout — the two lanes and the step bars.
// ---------------------------------------------------------------------------

const LANES = { x: 150, w: 900 } as const;
const GPU_Y = 210;
const CPU_Y = 320;
const LANE_H = 58;
const STEPS = 4; // token steps shown
// synchronous timing: GPU computes, then waits for CPU, per step.
// units: 1 GPU slot = 1, CPU slot = 1.6 (the CPU tail is the long pole)
const GPU_T = 1;
const CPU_T = 1.6;
const SYNC_STEP = GPU_T + CPU_T; // serialized length of one step
const UNIT = 82; // px per time unit
const tX = (t: number): number => LANES.x + t * UNIT;

const CAM_LANES: CameraState = { x: 640, y: 290, k: 1.28 };
const CAM_DIAL: CameraState = { x: 950, y: 480, k: 1.45 };
const CAM_WIDE: CameraState = { x: 640, y: 330, k: 1.02 };

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  laneU: ChannelRef<number>;
  syncU: ChannelRef<number>; // synchronous schedule sweeps in
  bubbleU: ChannelRef<number>; // idle-gap highlight
  deferK: ChannelRef<number>; // 0 → 1: schedule morphs to deferred
  ghostU: ChannelRef<number>; // the late expert ghost chip
  dialU: ChannelRef<number>; // the flag dial
  dialV: ChannelRef<number>; // dial value 0 → 2 → 6
  riskU: ChannelRef<number>; // accuracy lamp at 6
  gainU: ChannelRef<number>; // finish-line comparison
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const laneU = tl.channel('laneU', 0);
  const syncU = tl.channel('syncU', 0);
  const bubbleU = tl.channel('bubbleU', 0);
  const deferK = tl.channel('deferK', 0);
  const ghostU = tl.channel('ghostU', 0);
  const dialU = tl.channel('dialU', 0);
  const dialV = tl.channel('dialV', 0);
  const riskU = tl.channel('riskU', 0);
  const gainU = tl.channel('gainU', 0);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · two lanes, one clock —
  tl.caption({
    at: 0.5,
    dur: 5.5,
    text: 'Put the two processors on one clock: the card’s work on the top lane, the processor’s experts on the bottom. Time runs left to right.',
  });
  tl.tween(laneU, 1, { at: 0.7, dur: 1.6, ease: ease.draw });
  tl.tween(cam, CAM_LANES, { at: 1.0, dur: 1.4, ease: ease.move });
  tl.hold(6.0, 0.5);

  // — Beat 2 · synchronous —
  tl.caption({
    at: 6.5,
    dur: 6.5,
    text: 'With the deferral flag at zero, every token step is polite: the card computes, then stands idle while the processor finishes its experts. Then they swap.',
  });
  tl.tween(syncU, 1, { at: 6.9, dur: 3.2, ease: ease.linear });
  tl.hold(13.0, 0.5);

  // — Beat 3 · the bubbles —
  tl.caption({
    at: 13.5,
    dur: 5.5,
    text: 'Those gaps are pure waste. Nearly half of each lane is silence — hardware you paid for, waiting on hardware you paid for.',
  });
  tl.tween(bubbleU, 1, { at: 13.9, dur: 1.0, ease: ease.move });
  tl.hold(19.0, 0.5);

  // — Beat 4 · the wager —
  tl.caption({
    at: 19.5,
    dur: 7.0,
    text: 'The deferral flag makes a small wager: let a couple of the slowest expert answers arrive one step late, folded in on the next token, instead of holding everyone up now.',
  });
  tl.tween(deferK, 1, { at: 20.1, dur: 2.2, ease: ease.move });
  tl.tween(ghostU, 1, { at: 22.5, dur: 0.8, ease: ease.enter });
  tl.hold(26.5, 0.5);

  // — Beat 5 · the lanes fill —
  tl.caption({
    at: 27.0,
    dur: 6.0,
    text: 'Look at the lanes now. While the card runs step two, the processor is already chewing on step three. The bubbles close, and both lanes stay dense.',
  });
  tl.tween(bubbleU, 0, { at: 27.2, dur: 0.8, ease: ease.move });
  tl.hold(33.0, 0.5);

  // — Beat 6 · the dial —
  tl.caption({
    at: 33.5,
    dur: 6.5,
    text: 'The flag is a dial, not a switch. Zero is synchronous. One to four is the recommended range. Five and up chases latency into real accuracy risk.',
  });
  tl.tween(cam, CAM_DIAL, { at: 33.7, dur: 1.4, ease: ease.move });
  tl.tween(dialU, 1, { at: 34.3, dur: 0.8, ease: ease.enter });
  tl.tween(dialV, 2, { at: 35.3, dur: 1.2, ease: ease.move });
  tl.hold(40.0, 0.4);

  // — Beat 7 · the red zone —
  tl.caption({
    at: 40.4,
    dur: 5.5,
    text: 'Crank it to six and the lamp goes amber: too many stale answers per token, and the model starts paying in quality for what you saved in time.',
  });
  tl.tween(dialV, 6, { at: 40.8, dur: 1.4, ease: ease.move });
  tl.tween(riskU, 1, { at: 42.4, dur: 0.6, ease: ease.pop });
  tl.hold(45.9, 0.5);

  // — Beat 8 · the finish line —
  tl.caption({
    at: 46.4,
    dur: 6.0,
    text: 'Back at a sane setting of two, the same four token steps cross the finish line almost a third sooner — same silicon, same experts, no idle gaps.',
  });
  tl.tween(cam, CAM_WIDE, { at: 46.6, dur: 1.4, ease: ease.move });
  tl.tween(dialV, 2, { at: 46.8, dur: 1.0, ease: ease.move });
  tl.tween(riskU, 0, { at: 46.8, dur: 0.8, ease: ease.move });
  tl.tween(gainU, 1, { at: 48.2, dur: 0.8, ease: ease.pop });
  tl.hold(52.4, 0.5);

  // — Beat 9 · close —
  tl.caption({
    at: 52.9,
    dur: 6.5,
    text: 'Deferral buys overlap with a one-step delay on a few experts per token. Next: letting the whole seating chart move while the server is serving.',
  });
  tl.tween(closeU, 1, { at: 53.7, dur: 1.3, ease: ease.move });
  tl.hold(59.4, 1.4);

  return { tl, cam, laneU, syncU, bubbleU, deferK, ghostU, dialU, dialV, riskU, gainU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

const STEP_COLORS = [colors.ACCENT, colors.SECONDARY, colors.POSITIVE, colors.WARM];

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const laneU = s.get(scene.laneU);
  const syncU = s.get(scene.syncU);
  const bubbleU = s.get(scene.bubbleU);
  const deferK = s.get(scene.deferK);
  const ghostU = s.get(scene.ghostU);
  const dialU = s.get(scene.dialU);
  const dialV = s.get(scene.dialV);
  const riskU = s.get(scene.riskU);
  const gainU = s.get(scene.gainU);
  const closeU = s.get(scene.closeU);

  const dimAll = 1 - closeU * 0.86;

  // Schedule per step k (0..3), blended sync → deferred by deferK:
  //   sync:     GPU at k*SYNC_STEP,          CPU at k*SYNC_STEP + GPU_T
  //   deferred: GPU at k*max(GPU_T, ...)... — CPU pipelined: CPU k starts when GPU k done,
  //             GPU k+1 starts as soon as GPU k done (doesn't wait for CPU k)
  const gpuStart = (k: number): number => k * SYNC_STEP * (1 - deferK) + k * CPU_T * deferK;
  const cpuStart = (k: number): number => (k * SYNC_STEP + GPU_T) * (1 - deferK) + (k * CPU_T + GPU_T) * deferK;
  const syncTotal = STEPS * SYNC_STEP;
  const deferTotal = (STEPS - 1) * CPU_T + GPU_T + CPU_T;
  const finishT = syncTotal * (1 - deferK) + deferTotal * deferK;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={dimAll}>
          {/* lanes */}
          <g opacity={laneU}>
            {[
              ['GPU lane', GPU_Y, colors.ACCENT],
              ['CPU lane', CPU_Y, colors.POSITIVE],
            ].map(([label, y, c]) => (
              <g key={String(label)}>
                <rect x={LANES.x - 8} y={Number(y)} width={LANES.w + 16} height={LANE_H} rx={10} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.1} opacity={0.75} />
                <text x={LANES.x - 18} y={Number(y) + LANE_H / 2 + 4} textAnchor="end" fill={String(c)} fontSize={12.5}>
                  {label}
                </text>
              </g>
            ))}
            {/* clock axis */}
            <line x1={LANES.x} y1={CPU_Y + LANE_H + 26} x2={LANES.x + LANES.w} y2={CPU_Y + LANE_H + 26} stroke={colors.GRID} strokeWidth={1} />
            <text x={LANES.x + LANES.w} y={CPU_Y + LANE_H + 44} textAnchor="end" fill={colors.MUTED} fontSize={10.5}>
              time →
            </text>
          </g>

          {/* step bars */}
          {Array.from({ length: STEPS }, (_, k) => {
            const sweep = clamp01(syncU * STEPS - k);
            if (sweep <= 0) return null;
            const gx = tX(gpuStart(k));
            const cx = tX(cpuStart(k));
            const c = STEP_COLORS[k];
            return (
              <g key={k}>
                <rect x={gx} y={GPU_Y + 8} width={GPU_T * UNIT * sweep - 4} height={LANE_H - 16} rx={7} fill={c} opacity={0.85} />
                <text x={gx + 8} y={GPU_Y + LANE_H / 2 + 4} fill={colors.BG} fontSize={11} fontWeight={600}>
                  t{k + 1}
                </text>
                <rect x={cx} y={CPU_Y + 8} width={CPU_T * UNIT * sweep - 4} height={LANE_H - 16} rx={7} fill={c} opacity={0.55} />
                <text x={cx + 8} y={CPU_Y + LANE_H / 2 + 4} fill={colors.TEXT} fontSize={11}>
                  t{k + 1} experts
                </text>
              </g>
            );
          })}

          {/* idle bubbles (sync mode) */}
          <g opacity={bubbleU * (1 - deferK)}>
            {Array.from({ length: STEPS - 1 }, (_, k) => (
              <g key={k}>
                <rect x={tX(k * SYNC_STEP + GPU_T)} y={GPU_Y + 8} width={CPU_T * UNIT - 4} height={LANE_H - 16} rx={7} fill="none" stroke={colors.NEGATIVE} strokeWidth={1.4} strokeDasharray="5 4" />
                <text x={tX(k * SYNC_STEP + GPU_T) + (CPU_T * UNIT) / 2} y={GPU_Y + LANE_H / 2 + 4} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5}>
                  idle
                </text>
              </g>
            ))}
            <text x={tX(0.2)} y={GPU_Y - 14} fill={colors.NEGATIVE} fontSize={12}>
              the synchronous bubbles
            </text>
          </g>

          {/* the late-expert ghost */}
          <g opacity={ghostU * deferK}>
            <rect x={tX(cpuStart(1) + CPU_T) - 6} y={CPU_Y + 8} width={44} height={LANE_H - 16} rx={7} fill="none" stroke={colors.WARM} strokeWidth={1.5} strokeDasharray="4 3" />
            <text x={tX(cpuStart(1) + CPU_T) + 16} y={CPU_Y - 8} textAnchor="middle" fill={colors.WARM} fontSize={10.5}>
              2 experts land a step late
            </text>
          </g>

          {/* finish line */}
          <g opacity={syncU >= 1 ? 1 : 0}>
            <line x1={tX(finishT)} y1={GPU_Y - 12} x2={tX(finishT)} y2={CPU_Y + LANE_H + 12} stroke={colors.TEXT} strokeWidth={1.6} strokeDasharray="6 4" />
            <text x={tX(finishT)} y={GPU_Y - 22} textAnchor="middle" fill={colors.TEXT} fontSize={11}>
              4 steps done
            </text>
          </g>
          <g opacity={gainU}>
            <rect x={tX(deferTotal) + 12} y={GPU_Y + 40} width={150} height={30} rx={8} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.3} />
            <text x={tX(deferTotal) + 87} y={GPU_Y + 60} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5}>
              ~{Math.round((1 - deferTotal / syncTotal) * 100)}% sooner
            </text>
          </g>

          {/* the dial */}
          <g opacity={dialU}>
            <rect x={766} y={430} width={370} height={104} rx={12} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.2} />
            <text x={951} y={454} textAnchor="middle" fill={colors.TEXT} fontSize={11} fontFamily="ui-monospace, monospace">
              --kt-max-deferred-experts-per-token
            </text>
            {/* dial track 0..7 */}
            <line x1={800} y1={492} x2={1102} y2={492} stroke={colors.GRID} strokeWidth={3} strokeLinecap="round" />
            <line x1={800 + (302 * 1) / 7} y1={492} x2={800 + (302 * 4) / 7} y2={492} stroke={colors.POSITIVE} strokeWidth={3} strokeLinecap="round" />
            <line x1={800 + (302 * 5) / 7} y1={492} x2={1102} y2={492} stroke={colors.NEGATIVE} strokeWidth={3} strokeLinecap="round" />
            {Array.from({ length: 8 }, (_, v) => (
              <text key={v} x={800 + (302 * v) / 7} y={514} textAnchor="middle" fill={colors.MUTED} fontSize={9.5}>
                {v}
              </text>
            ))}
            <circle cx={800 + (302 * clamp01(dialV / 7) * 7) / 7} cy={492} r={9} fill={riskU > 0.4 ? colors.NEGATIVE : colors.WARM} />
            <text x={951} y={530} textAnchor="middle" fill={riskU > 0.4 ? colors.NEGATIVE : colors.MUTED} fontSize={9.5}>
              {riskU > 0.4 ? 'accuracy risk: stale expert outputs' : '0 sync · 1–4 recommended · 5–7 risky'}
            </text>
          </g>
        </g>

        {/* close */}
        <g opacity={closeU}>
          <rect x={340} y={238} width={600} height={186} rx={16} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <text x={640} y={288} textAnchor="middle" fill={colors.TEXT} fontSize={18}>
            overlap, purchased with staleness
          </text>
          <text x={640} y={326} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            defer a few experts one step → both lanes stay dense
          </text>
          <text x={640} y={348} textAnchor="middle" fill={colors.MUTED} fontSize={13}>
            dial past four and quality starts paying the bill
          </text>
          <text x={640} y={396} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily="ui-monospace, monospace">
            submit_forward … sync_forward · max_deferred_experts_per_token
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
