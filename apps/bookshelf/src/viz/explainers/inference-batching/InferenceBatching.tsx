// Explained: Inference — chapter 3: continuous batching. A real toy serving
// simulation at module scope: 24 requests (seeded lengths, 20–160 decode
// tokens), 8 batch slots, 7 ms per decode step. Static batching (groups of 8,
// the group holds until its longest member finishes): 441 steps, 55.1% slot
// utilization, 630 tok/s. Continuous batching (a freed slot refills from the
// queue immediately): 322 steps, 75.5%, 862 tok/s — 1.37× on the identical
// workload. Every number quoted in a caption is computed below.
import { scaleLinear } from 'd3';
import {
  CAMERA_HOME,
  Camera,
  MathLabel,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  mulberry32,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// ---------------------------------------------------------------------------
// The serving simulation, module scope.
// ---------------------------------------------------------------------------

const N_REQ = 24;
const SLOTS = 8;
const STEP_MS = 7; // chapter 1's decode budget

const rand = mulberry32(7);
const LENS = Array.from({ length: N_REQ }, () => 20 + Math.floor(rand() * 141));
const TOTAL_TOKENS = LENS.reduce((a, b) => a + b, 0); // 1944

// -- static batching: fixed groups of SLOTS; the batch holds until max(len)
interface Span { slot: number; start: number; end: number; req: number }
const staticSpans: Span[] = [];
let staticSteps = 0;
for (let g = 0; g < N_REQ; g += SLOTS) {
  const grp = LENS.slice(g, g + SLOTS);
  const m = Math.max(...grp);
  grp.forEach((len, i) =>
    staticSpans.push({ slot: i, start: staticSteps, end: staticSteps + len, req: g + i }),
  );
  staticSteps += m;
}
const STATIC_STEPS = staticSteps; // 441
const STATIC_UTIL = TOTAL_TOKENS / (STATIC_STEPS * SLOTS); // 0.551
const STATIC_TPS = TOTAL_TOKENS / ((STATIC_STEPS * STEP_MS) / 1000); // ≈ 630

// -- continuous batching: a freed slot pulls the next request that same step
const contSpans: Span[] = [];
{
  const queue = LENS.map((len, req) => ({ len, req }));
  const active: ({ left: number; req: number; start: number } | null)[] =
    Array.from({ length: SLOTS }, () => null);
  let t = 0;
  for (let i = 0; i < SLOTS; i++) {
    const nx = queue.shift();
    if (nx) active[i] = { left: nx.len, req: nx.req, start: 0 };
  }
  while (active.some(Boolean) || queue.length) {
    t++;
    for (let i = 0; i < SLOTS; i++) {
      const a = active[i];
      if (a) {
        a.left--;
        if (a.left === 0) {
          contSpans.push({ slot: i, start: a.start, end: t, req: a.req });
          const nx = queue.shift();
          active[i] = nx ? { left: nx.len, req: nx.req, start: t } : null;
        }
      }
    }
  }
  var CONT_STEPS = t; // 322
}
const CONT_UTIL = TOTAL_TOKENS / (CONT_STEPS * SLOTS); // 0.755
const CONT_TPS = TOTAL_TOKENS / ((CONT_STEPS * STEP_MS) / 1000); // ≈ 862
const SPEEDUP = STATIC_STEPS / CONT_STEPS; // 1.37

// ---------------------------------------------------------------------------
// Layout — two slot×time gantt lanes, drawn from the computed spans.
// ---------------------------------------------------------------------------

const LANE_X = scaleLinear().domain([0, STATIC_STEPS]).range([250, 1170]);
const ROW_H = 16;
const ROW_GAP = 4;
const STATIC_Y = 150;
const CONT_Y = 390;

const REQ_COLORS = [colors.ACCENT, colors.SECONDARY, colors.POSITIVE, colors.WARM];

const CAM_STATIC: CameraState = { x: 660, y: 250, k: 1.22 };
const CAM_CONT: CameraState = { x: 660, y: 460, k: 1.22 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  staticU: ChannelRef<number>; // sweep 0..1 over static timeline
  staticFrameU: ChannelRef<number>;
  idleU: ChannelRef<number>; // idle hatching emphasis
  contFrameU: ChannelRef<number>;
  contU: ChannelRef<number>; // sweep 0..1 over continuous timeline
  statU: ChannelRef<number>;
  tradeU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const staticFrameU = tl.channel('staticFrameU', 0);
  const staticU = tl.channel('staticU', 0);
  const idleU = tl.channel('idleU', 0);
  const contFrameU = tl.channel('contFrameU', 0);
  const contU = tl.channel('contU', 0);
  const statU = tl.channel('statU', 0);
  const tradeU = tl.channel('tradeU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the batching insight
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'The memory wall had a loophole: one pass over the weights can feed many streams at once. Batch thirty two conversations and the same fourteen gigabyte sweep produces thirty two tokens instead of one.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 6.7,
    dur: 5.2,
    text: 'So the serving problem becomes a seating problem: keep every slot of the batch busy. Here is a real simulation — twenty four requests, eight slots, and each request needs a different number of tokens.',
  });
  tl.tween(cam, CAM_STATIC, { at: 7.0, dur: 1.4, ease: ease.move });
  tl.tween(staticFrameU, 1, { at: 7.6, dur: 1.2, ease: ease.draw });
  tl.hold(12.1, 0.5);

  // Beat 2 — static batching runs
  tl.caption({
    at: 12.6,
    dur: 5.8,
    text: 'The obvious scheme is static batching: load eight requests, run until every one of them finishes, then load the next eight. Watch what happens to the short requests.',
  });
  tl.tween(staticU, 1, { at: 13.6, dur: 9.0, ease: ease.linear });
  tl.caption({
    at: 18.6,
    dur: 5.6,
    text: 'A twenty one token request finishes almost immediately — and then its slot sits empty while a one hundred fifty seven token neighbor grinds on. The batch moves at the speed of its slowest member.',
  });
  tl.caption({
    at: 24.4,
    dur: 5.2,
    text: 'Add up the emptiness: across the whole run, the slots are doing useful work only fifty five percent of the time. Four hundred forty one steps to serve everything.',
  });
  tl.tween(idleU, 1, { at: 25.2, dur: 1.2, ease: ease.enter });
  tl.hold(29.6, 0.6);

  // Beat 3 — continuous batching runs
  tl.caption({
    at: 30.2,
    dur: 5.6,
    text: 'Continuous batching drops the ceremony: the moment any request finishes, its slot refills from the queue on the very next step. Same twenty four requests, same eight slots.',
  });
  tl.tween(cam, CAM_CONT, { at: 30.5, dur: 1.4, ease: ease.move });
  tl.tween(contFrameU, 1, { at: 31.2, dur: 1.0, ease: ease.draw });
  tl.tween(contU, 1, { at: 32.4, dur: 8.0, ease: ease.linear });
  tl.caption({
    at: 36.0,
    dur: 5.4,
    text: 'The lanes pack tight. No slot waits for a stranger to finish — the timeline simply ends earlier: three hundred twenty two steps instead of four hundred forty one.',
  });
  tl.hold(41.4, 0.5);

  // Beat 4 — the measured numbers
  tl.caption({
    at: 41.9,
    dur: 6.0,
    text: 'The measured result, on identical work: utilization rises from fifty five to seventy five percent, throughput from about six hundred thirty to eight hundred sixty tokens per second. One point three seven times faster, from scheduling alone.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 42.2, dur: 1.5, ease: ease.move });
  tl.tween(statU, 1, { at: 43.2, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 48.3,
    dur: 5.6,
    text: 'There is a real trade hiding here. Bigger, fuller batches raise total throughput — but each stream still decodes one token per step, so your individual answer arrives no faster. Throughput is bought in bulk; latency is paid alone.',
  });
  tl.tween(tradeU, 1, { at: 49.4, dur: 0.9, ease: ease.enter });
  tl.hold(53.9, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 54.5,
    dur: 5.6,
    text: 'Batching fills the width of the chip. The next trick attacks the other axis — getting more than one token out of a single step. That is speculative decoding.',
  });
  tl.tween(dimU, 1, { at: 55.4, dur: 1.1, ease: ease.move });
  tl.tween(closeU, 1, { at: 56.4, dur: 0.9, ease: ease.enter });
  tl.hold(60.1, 1.2);

  return { tl, cam, titleU, staticFrameU, staticU, idleU, contFrameU, contU, statU, tradeU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/inference-batching/overrides.json',
  slug: 'inference-batching',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Lane({
  spans,
  y,
  sweep,
  totalSteps,
  idle,
  label,
  frameU,
}: {
  spans: Span[];
  y: number;
  sweep: number;
  totalSteps: number;
  idle: number;
  label: string;
  frameU: number;
}) {
  if (frameU <= 0) return null;
  const sweepStep = sweep * totalSteps;
  return (
    <g opacity={frameU}>
      <text x={LANE_X(0)} y={y - 34} fill={colors.TEXT} fontSize={16}>
        {label}
      </text>
      {Array.from({ length: SLOTS }, (_, i) => (
        <g key={i}>
          <text
            x={LANE_X(0) - 12}
            y={y + i * (ROW_H + ROW_GAP) + ROW_H - 4}
            textAnchor="end"
            fill={colors.MUTED}
            fontSize={11}
            fontFamily="monospace"
          >
            slot {i}
          </text>
          <rect
            x={LANE_X(0)}
            y={y + i * (ROW_H + ROW_GAP)}
            width={LANE_X(totalSteps) - LANE_X(0)}
            height={ROW_H}
            fill={colors.PANEL}
            opacity={0.5}
            rx={2}
          />
        </g>
      ))}
      {spans.map((sp, k) => {
        const shownEnd = Math.min(sp.end, sweepStep);
        if (shownEnd <= sp.start) return null;
        const w = LANE_X(shownEnd) - LANE_X(sp.start);
        return (
          <rect
            key={k}
            x={LANE_X(sp.start)}
            y={y + sp.slot * (ROW_H + ROW_GAP) + 1}
            width={Math.max(1.5, w)}
            height={ROW_H - 2}
            rx={2}
            fill={REQ_COLORS[sp.req % REQ_COLORS.length]}
            opacity={0.85}
          />
        );
      })}
      {/* the sweep cursor */}
      {sweep > 0 && sweep < 1 && (
        <line
          x1={LANE_X(sweepStep)}
          x2={LANE_X(sweepStep)}
          y1={y - 6}
          y2={y + SLOTS * (ROW_H + ROW_GAP)}
          stroke={colors.TEXT}
          strokeWidth={1.5}
          opacity={0.7}
        />
      )}
      {/* idle emphasis: hatch the dead space after each span up to its group end */}
      {idle > 0 &&
        spans.map((sp, k) => {
          // for the static lane, dead time runs from span end to next span start (or total)
          const next = spans.filter((q) => q.slot === sp.slot && q.start >= sp.end);
          const until = next.length ? Math.min(...next.map((q) => q.start)) : totalSteps;
          if (until <= sp.end) return null;
          return (
            <rect
              key={`idle-${k}`}
              x={LANE_X(sp.end)}
              y={y + sp.slot * (ROW_H + ROW_GAP) + 1}
              width={LANE_X(until) - LANE_X(sp.end)}
              height={ROW_H - 2}
              fill={colors.NEGATIVE}
              opacity={0.22 * idle}
            />
          );
        })}
    </g>
  );
}

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const staticFrameU = s.get(scene.staticFrameU);
  const staticU = s.get(scene.staticU);
  const idleU = s.get(scene.idleU);
  const contFrameU = s.get(scene.contFrameU);
  const contU = s.get(scene.contU);
  const statU = s.get(scene.statU);
  const tradeU = s.get(scene.tradeU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          <Lane
            spans={staticSpans}
            y={STATIC_Y}
            sweep={staticU}
            totalSteps={STATIC_STEPS}
            idle={idleU}
            frameU={staticFrameU}
            label={`static batching — groups of ${SLOTS}, hold until the slowest finishes`}
          />
          {idleU > 0 && (
            <text
              x={LANE_X(0)}
              y={STATIC_Y + SLOTS * (ROW_H + ROW_GAP) + 24}
              fill={colors.NEGATIVE}
              fontSize={13}
              fontFamily="monospace"
              opacity={idleU}
            >
              {STATIC_STEPS} steps · utilization {(STATIC_UTIL * 100).toFixed(1)}% — red is paid-for silence
            </text>
          )}
          <Lane
            spans={contSpans}
            y={CONT_Y}
            sweep={contU}
            totalSteps={CONT_STEPS}
            idle={0}
            frameU={contFrameU}
            label="continuous batching — a freed slot refills next step"
          />
          {contU >= 1 && (
            <text
              x={LANE_X(0)}
              y={CONT_Y + SLOTS * (ROW_H + ROW_GAP) + 24}
              fill={colors.POSITIVE}
              fontSize={13}
              fontFamily="monospace"
            >
              {CONT_STEPS} steps · utilization {(CONT_UTIL * 100).toFixed(1)}%
            </text>
          )}

          {/* measured stats */}
          {statU > 0 && (
            <g opacity={statU}>
              <text x={250} y={620} fill={colors.TEXT} fontSize={15}>
                same {N_REQ} requests, {TOTAL_TOKENS.toLocaleString()} tokens:
              </text>
              <text x={620} y={620} fill={colors.WARM} fontSize={15} fontFamily="monospace" fontWeight={700}>
                {STATIC_TPS.toFixed(0)} → {CONT_TPS.toFixed(0)} tok/s ({SPEEDUP.toFixed(2)}×)
              </text>
            </g>
          )}
        </Camera>
      </g>

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The seating problem
        </text>
      </g>
      <MathLabel
        tex="\text{util} = \frac{\text{tokens served}}{\text{steps} \times \text{slots}}"
        x={900}
        y={54}
        fontSize={19}
        color={colors.SECONDARY}
        opacity={statU * mainOp}
      />
      {tradeU > 0 && (
        <g opacity={tradeU * mainOp}>
          <text x={40} y={80} fill={colors.MUTED} fontSize={14}>
            throughput is bought in bulk · latency is paid alone
          </text>
        </g>
      )}

      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={240} y={230} width={800} height={180} rx={14} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
          <text x={640} y={296} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={600}>
            Never let a slot go quiet.
          </text>
          <text x={640} y={336} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            Identical work: 441 → 322 steps, 55% → 76% busy,
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={17}>
            1.37× throughput — from scheduling alone.
          </text>
        </g>
      )}
    </>
  );
}

export function InferenceBatching() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
