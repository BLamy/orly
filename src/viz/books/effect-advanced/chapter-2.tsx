// One Value, One Owner
//
// Backing files: packages/effect/src/Queue.ts — Queue.bounded / Queue.dropping
// / Queue.sliding / Queue.unbounded constructors; offer returns
// Effect<boolean> (false when a dropping queue rejects); take hands each
// value to exactly one taker; Queue.end completes the queue with Done and
// consumers drain the remainder first.
//
// Centerpiece: the pressure lab — one hot producer schedule replayed against
// three four-slot racks. The bounded rack parks the producer fiber, the
// dropping rack bounces newcomers, the sliding rack ejects the oldest. All
// ball trajectories are simulated once at module scope; playback samples the
// precomputed keyframes, so every frame is a pure function of the sim clocks.
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
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// Shared geometry — the demo rack on top, three lanes below.
// ---------------------------------------------------------------------------

const CAP = 4;
const SLOT_DX = 46;
const RACK_X1 = 700; // front slot (next to be taken) — rightmost
const ENTRY_X = RACK_X1 - CAP * SLOT_DX - 26; // where offers arrive
const PROD_X = 300;
const CONS_X = 952;
const slotX = (pos: number): number => RACK_X1 - pos * SLOT_DX;

const DEMO_Y = 168;
const LANE_Y = [382, 472, 562] as const;

const BALL_COLORS = [
  colors.ACCENT,
  colors.POSITIVE,
  colors.SECONDARY,
  colors.WARM,
  colors.ACCENT,
  colors.POSITIVE,
  colors.SECONDARY,
  colors.WARM,
  colors.ACCENT,
] as const;

// ---------------------------------------------------------------------------
// The strategy simulator — run once per lane at module scope.
// ---------------------------------------------------------------------------

interface Frame {
  t: number;
  x: number;
  y: number;
  a: number;
}
interface Track {
  value: number;
  color: string;
  frames: Frame[];
}
interface SimResult {
  tracks: Track[];
  parks: Array<[number, number]>; // producer-parked intervals
  emptyAt: number; // when the rack finally drains (suspend lane)
}

function simulate(
  strategy: 'suspend' | 'dropping' | 'sliding',
  laneY: number,
  takes: readonly number[],
  nBalls: number,
  offerEvery: number,
): SimResult {
  const tracks: Track[] = [];
  const queue: Track[] = [];
  const parks: Array<[number, number]> = [];
  let pending: Track | null = null;
  let parkedSince = 0;
  let nextOfferT = 0.45;
  let offered = 0;
  let emptyAt = 0;
  const takesLeft = [...takes];

  const spawn = (t: number, value: number): Track => {
    const tr: Track = {
      value,
      color: BALL_COLORS[(value - 1) % BALL_COLORS.length],
      frames: [
        { t: t - 0.42, x: PROD_X, y: laneY, a: 0 },
        { t: t - 0.36, x: PROD_X + 10, y: laneY, a: 1 },
      ],
    };
    tracks.push(tr);
    return tr;
  };

  const shiftAll = (t: number) => {
    queue.forEach((tr, p) => {
      tr.frames.push({ t, x: slotX(p + 1), y: laneY, a: 1 });
      tr.frames.push({ t: t + 0.26, x: slotX(p), y: laneY, a: 1 });
    });
  };

  const doOffer = (t: number) => {
    const tr = spawn(t, offered + 1);
    offered += 1;
    if (queue.length < CAP) {
      tr.frames.push({ t, x: slotX(queue.length), y: laneY, a: 1 });
      queue.push(tr);
      nextOfferT = t + offerEvery;
    } else if (strategy === 'dropping') {
      // full: the newcomer bounces off the entry — offer returned false
      tr.frames.push({ t, x: ENTRY_X, y: laneY, a: 1 });
      tr.frames.push({ t: t + 0.38, x: ENTRY_X - 52, y: laneY + 34, a: 0 });
      nextOfferT = t + offerEvery;
    } else if (strategy === 'sliding') {
      // full: the oldest (front) is ejected, everyone shifts, newcomer enters
      const oldest = queue.shift()!;
      oldest.frames.push({ t, x: slotX(0), y: laneY, a: 1 });
      oldest.frames.push({ t: t + 0.38, x: slotX(0) + 58, y: laneY - 32, a: 0 });
      shiftAll(t);
      tr.frames.push({ t, x: ENTRY_X, y: laneY, a: 1 });
      tr.frames.push({ t: t + 0.3, x: slotX(queue.length), y: laneY, a: 1 });
      queue.push(tr);
      nextOfferT = t + offerEvery;
    } else {
      // suspend: the producer fiber parks with its value at the entry
      tr.frames.push({ t, x: ENTRY_X, y: laneY, a: 1 });
      pending = tr;
      parkedSince = t;
      nextOfferT = Infinity; // resumes on the next take
    }
  };

  const doTake = (t: number) => {
    if (!queue.length) return;
    const front = queue.shift()!;
    front.frames.push({ t, x: slotX(0), y: laneY, a: 1 });
    front.frames.push({ t: t + 0.42, x: CONS_X, y: laneY, a: 0.15 });
    front.frames.push({ t: t + 0.5, x: CONS_X + 8, y: laneY, a: 0 });
    shiftAll(t);
    if (pending) {
      const tr: Track = pending;
      tr.frames.push({ t: t + 0.06, x: ENTRY_X, y: laneY, a: 1 });
      tr.frames.push({ t: t + 0.42, x: slotX(queue.length), y: laneY, a: 1 });
      queue.push(tr);
      parks.push([parkedSince, t]);
      pending = null;
      nextOfferT = t + offerEvery;
    }
    if (!queue.length && offered >= nBalls && !pending) emptyAt = t + 0.5;
  };

  // merged event loop
  while (offered < nBalls || takesLeft.length) {
    const tOffer = offered < nBalls && pending === null ? nextOfferT : Infinity;
    const tTake = takesLeft.length ? takesLeft[0] : Infinity;
    if (tOffer === Infinity && tTake === Infinity) break;
    if (tOffer <= tTake) doOffer(tOffer);
    else doTake(takesLeft.shift()!);
  }
  return { tracks, parks, emptyAt };
}

// Lane 1 (suspend) runs long: it fills, parks the producer, then drains fully.
const SIM1 = simulate('suspend', LANE_Y[0], [1.2, 2.8, 4.4, 5.6, 6.4, 7.2, 8.0, 8.8, 9.6], 9, 0.55);
// Lanes 2 and 3 face the same hot producer with only three takes.
const SIM2 = simulate('dropping', LANE_Y[1], [1.2, 2.8, 4.4], 9, 0.55);
const SIM3 = simulate('sliding', LANE_Y[2], [1.2, 2.8, 4.4], 9, 0.55);

function sampleTrack(tr: Track, t: number): Frame {
  const fs = tr.frames;
  if (t <= fs[0].t) return { ...fs[0], a: 0 };
  for (let i = 1; i < fs.length; i++) {
    if (t <= fs[i].t) {
      const u = (t - fs[i - 1].t) / Math.max(1e-6, fs[i].t - fs[i - 1].t);
      return {
        t,
        x: lerp(fs[i - 1].x, fs[i].x, u),
        y: lerp(fs[i - 1].y, fs[i].y, u),
        a: lerp(fs[i - 1].a, fs[i].a, u),
      };
    }
  }
  return fs[fs.length - 1];
}

const isParked = (parks: Array<[number, number]>, t: number): boolean =>
  parks.some(([a, b]) => t >= a && t <= b);

// demo choreography: ball u → position along producer → front slot → consumer
function demoBallPos(u: number, consY: number): { x: number; y: number; a: number } {
  if (u <= 0) return { x: PROD_X, y: DEMO_Y, a: 0 };
  if (u < 0.42) return { x: lerp(PROD_X, slotX(0), u / 0.42), y: DEMO_Y, a: 1 };
  if (u < 0.58) return { x: slotX(0), y: DEMO_Y, a: 1 };
  if (u < 0.97) {
    const w = (u - 0.58) / 0.39;
    return { x: lerp(slotX(0), CONS_X, w), y: lerp(DEMO_Y, consY, w), a: 1 };
  }
  return { x: CONS_X, y: consY, a: clamp01((1 - u) / 0.03) };
}

// camera marks
const CAM_DEMO: CameraState = { x: 620, y: 195, k: 1.35 };
const CAM_LANES: CameraState = { x: 620, y: 450, k: 1.22 };
const CAM_L1: CameraState = { x: 620, y: 392, k: 1.42 };
const CAM_L2: CameraState = { x: 620, y: 462, k: 1.42 };
const CAM_L3: CameraState = { x: 620, y: 540, k: 1.42 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  rackU: ChannelRef<number>;
  d1: ChannelRef<number>;
  d2: ChannelRef<number>;
  d3: ChannelRef<number>;
  consBU: ChannelRef<number>;
  demoDim: ChannelRef<number>;
  lanesU: ChannelRef<number>;
  sim1T: ChannelRef<number>;
  sim2T: ChannelRef<number>;
  sim3T: ChannelRef<number>;
  verdictU: ChannelRef<number>;
  closeU: ChannelRef<number>;
  stageDim: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_DEMO, cameraInterp);
  const rackU = tl.channel('rackU', 0);
  const d1 = tl.channel('d1', 0);
  const d2 = tl.channel('d2', 0);
  const d3 = tl.channel('d3', 0);
  const consBU = tl.channel('consBU', 0);
  const demoDim = tl.channel('demoDim', 1);
  const lanesU = tl.channel('lanesU', 0);
  const sim1T = tl.channel('sim1T', 0);
  const sim2T = tl.channel('sim2T', 0);
  const sim3T = tl.channel('sim3T', 0);
  const verdictU = tl.channel('verdictU', 0);
  const closeU = tl.channel('closeU', 0);
  const stageDim = tl.channel('stageDim', 1);

  // — Beat 1 · the mailbox —
  tl.caption({
    at: 0.5,
    dur: 6.5,
    text: 'Two fibers that share memory have to fight over it. Effect hands them a mailbox instead — a queue that passes values across, with rules for what happens when it fills.',
  });
  tl.tween(rackU, 1, { at: 0.7, dur: 1.4, ease: ease.draw });
  tl.hold(7.0, 0.5);

  // — Beat 2 · bounded, offer, take —
  tl.caption({
    at: 7.5,
    dur: 5.5,
    text: 'This one is bounded: four slots, never more. Offer puts a value in, take pulls one out, strictly in arrival order.',
  });
  tl.tween(d1, 1, { at: 8.4, dur: 3.6, ease: ease.linear });

  // — Beat 3 · exactly one owner —
  tl.caption({
    at: 13.0,
    dur: 5.5,
    text: 'The value crosses between fibers exactly once. No locks, no shared mutable state — ownership simply moves.',
  });
  tl.hold(18.5, 0.4);

  // — Beat 4 · two consumers compete —
  tl.caption({
    at: 18.9,
    dur: 6.5,
    text: 'Add a second consumer and the two compete. Each value lands with exactly one taker — a queue distributes work, it never duplicates it.',
  });
  tl.tween(consBU, 1, { at: 19.1, dur: 0.6, ease: ease.enter });
  tl.tween(d2, 1, { at: 19.8, dur: 2.6, ease: ease.linear });
  tl.tween(d3, 1, { at: 21.8, dur: 2.6, ease: ease.linear });
  tl.hold(25.4, 0.5);

  // — Beat 5 · pressure —
  tl.caption({
    at: 25.9,
    dur: 6.5,
    text: 'Now make the producer fast and the consumer slow. Four slots fill in a couple of seconds — and the queue faces its one big decision: what happens to value number five?',
  });
  tl.tween(cam, CAM_L1, { at: 26.1, dur: 1.4, ease: ease.move });
  tl.tween(demoDim, 0.15, { at: 26.1, dur: 1.0, ease: ease.move });
  tl.tween(lanesU, 1, { at: 26.5, dur: 1.2, ease: ease.draw });
  tl.tween(sim1T, 2.5, { at: 27.4, dur: 4.4, ease: ease.linear });

  // — Beat 6 · suspend —
  tl.caption({
    at: 32.6,
    dur: 7,
    text: 'The bounded answer is to suspend. The offer parks the producer fiber — no busy waiting, no error — and it wakes the instant a slot frees up. Nothing is ever lost.',
  });
  tl.tween(sim1T, 4.6, { at: 33.0, dur: 5.6, ease: ease.linear });
  tl.hold(39.8, 0.4);

  // — Beat 7 · dropping —
  tl.caption({
    at: 40.2,
    dur: 6.5,
    text: 'A dropping queue keeps the old and rejects the new. When it is full, fresh offers just bounce off — and the offer quietly returns false to whoever sent it.',
  });
  tl.tween(cam, CAM_L2, { at: 40.4, dur: 1.2, ease: ease.move });
  tl.tween(sim2T, 6, { at: 41.0, dur: 5.4, ease: ease.linear });

  // — Beat 8 · sliding —
  tl.caption({
    at: 47.0,
    dur: 6.5,
    text: 'A sliding queue keeps the new and evicts the old: the oldest value slides out the far end to make room. Perfect when only the latest reading matters.',
  });
  tl.tween(cam, CAM_L3, { at: 47.2, dur: 1.2, ease: ease.move });
  tl.tween(sim3T, 6, { at: 47.8, dur: 5.4, ease: ease.linear });

  // — Beat 9 · choose your failure mode —
  tl.caption({
    at: 53.9,
    dur: 6.5,
    text: 'Same producer, three policies. Suspend when every value matters. Drop when old news wins. Slide when fresh news wins. You pick the failure mode up front, in the constructor.',
  });
  tl.tween(cam, CAM_LANES, { at: 54.1, dur: 1.4, ease: ease.move });
  tl.tween(verdictU, 1, { at: 55.2, dur: 0.8, ease: ease.enter });

  // — Beat 10 · Queue.end —
  tl.caption({
    at: 60.8,
    dur: 7,
    text: 'When the producer finishes, it ends the queue. The gate closes behind the last value, consumers calmly drain what is left, and then every taker learns the work is done.',
  });
  tl.tween(cam, CAM_L1, { at: 61.0, dur: 1.3, ease: ease.move });
  tl.tween(sim1T, 10.4, { at: 61.4, dur: 6.0, ease: ease.linear });

  // — Beat 11 · handoff to pub sub —
  tl.caption({
    at: 68.4,
    dur: 7,
    text: 'That is the hand-off: each value gets exactly one owner. But some events — an order placed, a payment captured — need every listener to hear them. That takes a different machine.',
  });
  tl.tween(cam, CAM_WIDE, { at: 68.6, dur: 1.5, ease: ease.move });
  tl.tween(stageDim, 0.13, { at: 69.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 70.6, dur: 0.8, ease: ease.enter });
  tl.hold(75.4, 1.5);

  return {
    tl,
    cam,
    rackU,
    d1,
    d2,
    d3,
    consBU,
    demoDim,
    lanesU,
    sim1T,
    sim2T,
    sim3T,
    verdictU,
    closeU,
    stageDim,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function Rack({ y, u, hot }: { y: number; u: number; hot?: boolean }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      {Array.from({ length: CAP }, (_, p) => (
        <rect
          key={p}
          x={slotX(p) - 19}
          y={y - 21}
          width={38}
          height={42}
          rx={7}
          fill="none"
          stroke={hot ? colors.ACCENT : colors.GRID}
          strokeWidth={1.2}
        />
      ))}
    </g>
  );
}

function FiberChip({ x, y, label, u, parked, done }: {
  x: number;
  y: number;
  label: string;
  u: number;
  parked?: boolean;
  done?: boolean;
}) {
  if (u <= 0) return null;
  const stroke = parked ? colors.WARM : done ? colors.POSITIVE : colors.GRID;
  return (
    <g opacity={u}>
      <rect x={x - 58} y={y - 20} width={116} height={40} rx={10} fill={colors.PANEL} stroke={stroke} strokeWidth={parked || done ? 2 : 1} />
      <text x={x} y={y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
        {label}
      </text>
      {parked && (
        <text x={x} y={y - 27} textAnchor="middle" fill={colors.WARM} fontSize={10.5}>
          ⏸ parked — offer suspended
        </text>
      )}
      {done && (
        <text x={x} y={y - 27} textAnchor="middle" fill={colors.POSITIVE} fontSize={10.5}>
          ✓ done
        </text>
      )}
    </g>
  );
}

function Ball({ x, y, a, value, color }: Frame & { value: number; color: string }) {
  if (a <= 0.01) return null;
  return (
    <g opacity={a}>
      <circle cx={x} cy={y} r={13} fill={color} opacity={0.28} />
      <circle cx={x} cy={y} r={13} fill="none" stroke={color} strokeWidth={1.6} />
      <text x={x} y={y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={11.5} fontWeight={700}>
        {value}
      </text>
    </g>
  );
}

function Lane({ y, simT, sim, code, note, u, verdict, verdictU, endGate }: {
  y: number;
  simT: number;
  sim: SimResult;
  code: string;
  note: string;
  u: number;
  verdict: string;
  verdictU: number;
  endGate?: boolean;
}) {
  if (u <= 0) return null;
  const started = simT > 0.01;
  const parked = isParked(sim.parks, simT);
  const drained = endGate && sim.emptyAt > 0 && simT >= sim.emptyAt;
  const gateOn = endGate && simT >= 6.6;
  return (
    <g opacity={u * (started ? 1 : 0.45)}>
      <text x={92} y={y - 6} fill={colors.TEXT} fontSize={13} fontFamily="monospace">
        {code}
      </text>
      <text x={92} y={y + 14} fill={colors.MUTED} fontSize={10.5}>
        {note}
      </text>
      <Rack y={y} u={1} hot={started} />
      <FiberChip x={PROD_X - 60} y={y} label="producer fiber" u={1} parked={parked} />
      <FiberChip x={CONS_X + 60} y={y} label="consumer fiber" u={1} done={!!drained} />
      {sim.tracks.map((tr) => {
        const f = sampleTrack(tr, simT);
        return <Ball key={tr.value} {...f} value={tr.value} color={tr.color} />;
      })}
      {gateOn && (
        <g>
          <line x1={ENTRY_X + 18} y1={y - 26} x2={ENTRY_X + 18} y2={y + 26} stroke={colors.WARM} strokeWidth={3} />
          <text x={ENTRY_X + 18} y={y - 34} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily="monospace">
            Queue.end
          </text>
        </g>
      )}
      {verdictU > 0 && (
        <text x={1158} y={y + 4} textAnchor="end" fill={colors.WARM} fontSize={12} opacity={verdictU} fontStyle="italic">
          {verdict}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const rackU = s.get(scene.rackU);
  const d1 = s.get(scene.d1);
  const d2 = s.get(scene.d2);
  const d3 = s.get(scene.d3);
  const consBU = s.get(scene.consBU);
  const demoDim = s.get(scene.demoDim);
  const lanesU = s.get(scene.lanesU);
  const sim1T = s.get(scene.sim1T);
  const sim2T = s.get(scene.sim2T);
  const sim3T = s.get(scene.sim3T);
  const verdictU = s.get(scene.verdictU);
  const closeU = s.get(scene.closeU);
  const stageDim = s.get(scene.stageDim);

  const consAY = DEMO_Y - 46;
  const consBY = DEMO_Y + 46;
  const b1 = demoBallPos(d1, consAY);
  const b2 = demoBallPos(d2, consBY);
  const b3 = demoBallPos(d3, consAY);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageDim}>
          {/* ---- demo rack ---- */}
          <g opacity={demoDim}>
            <text x={92} y={DEMO_Y - 52} fill={colors.TEXT} fontSize={14} fontFamily="monospace" opacity={rackU}>
              Queue.bounded(4)
            </text>
            <text x={92} y={DEMO_Y - 32} fill={colors.MUTED} fontSize={11} opacity={rackU}>
              offer ⟶ four slots ⟶ take
            </text>
            <Rack y={DEMO_Y} u={rackU} />
            <FiberChip x={PROD_X - 60} y={DEMO_Y} label="producer fiber" u={rackU} />
            <FiberChip x={CONS_X + 60} y={consAY} label="consumer A" u={rackU} />
            <FiberChip x={CONS_X + 60} y={consBY} label="consumer B" u={consBU} />
            <Ball {...b1} t={0} value={1} color={colors.ACCENT} />
            <Ball {...b2} t={0} value={2} color={colors.POSITIVE} />
            <Ball {...b3} t={0} value={3} color={colors.SECONDARY} />
            {/* offer / take labels around the rack */}
            <text x={ENTRY_X - 4} y={DEMO_Y + 40} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace" opacity={rackU}>
              Queue.offer
            </text>
            <text x={slotX(0) + 30} y={DEMO_Y + 40} fill={colors.MUTED} fontSize={10.5} fontFamily="monospace" opacity={rackU}>
              Queue.take
            </text>
          </g>

          {/* ---- the pressure lab ---- */}
          {lanesU > 0 && (
            <g opacity={lanesU}>
              <Lane
                y={LANE_Y[0]}
                simT={sim1T}
                sim={SIM1}
                code="Queue.bounded(4)"
                note="suspend — park the producer"
                u={1}
                verdict="every value matters"
                verdictU={verdictU}
                endGate
              />
              <Lane
                y={LANE_Y[1]}
                simT={sim2T}
                sim={SIM2}
                code="Queue.dropping(4)"
                note="full → new offers bounce"
                u={1}
                verdict="old news wins"
                verdictU={verdictU}
              />
              <Lane
                y={LANE_Y[2]}
                simT={sim3T}
                sim={SIM3}
                code="Queue.sliding(4)"
                note="full → oldest is evicted"
                u={1}
                verdict="fresh news wins"
                verdictU={verdictU}
              />
            </g>
          )}
        </g>

        {/* closing panel */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={330} y={240} width={620} height={160} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={302} textAnchor="middle" fill={colors.TEXT} fontSize={22}>
              one value · one owner
            </text>
            <text x={640} y={346} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              choose what breaks before it breaks
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
