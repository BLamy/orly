// Everyone Gets a Copy
//
// Backing files: packages/effect/src/PubSub.ts (bounded / dropping / sliding /
// unbounded hubs, publish, subscribe — each Subscription receives its own copy
// of every accepted message; optional replay buffer for late subscribers),
// ai-docs/src/01_effect/07_pubsub/10_pubsub.ts (the OrderEvents service:
// PubSub.bounded({ capacity: 256, replay: 50 }), publish / publishAll /
// subscribe, Stream.fromPubSub).
//
// Centerpiece: the broadcast hub — order events fly into the hub and split
// into simultaneous copies, one per subscriber queue. A replay ring collects
// the recent past and streams it into a latecomer. A slow subscriber fills
// its queue until the publisher itself parks: backpressure across the hub.
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
// Geometry — publisher → hub → per-subscriber queues.
// ---------------------------------------------------------------------------

const PUB = { x: 150, y: 330 } as const;
const HUB = { x: 500, y: 330, r: 56 } as const;
const RING_R = 88;
const SUBS = [
  { key: 's1', y: 140, label: 'email fiber' },
  { key: 's2', y: 330, label: 'billing fiber' },
  { key: 's3', y: 520, label: 'latecomer' },
] as const;
const SLOT_XS = [1052, 948, 844] as const; // slot 0 = front (rightmost)
const CONS_X = 1190;
const CARD_W = 96;
const CARD_H = 24;

// the order-event sequence, straight from the ai-docs OrderEvent union
const EVENTS = [
  { tag: 'OrderPlaced', color: colors.POSITIVE },
  { tag: 'PaymentCaptured', color: colors.ACCENT },
  { tag: 'OrderShipped', color: colors.SECONDARY },
  { tag: 'OrderPlaced', color: colors.POSITIVE },
  { tag: 'PaymentCaptured', color: colors.ACCENT },
  { tag: 'OrderShipped', color: colors.SECONDARY },
] as const;

// per-event, per-subscriber choreography (slot it settles in; taken → slides
// to the consumer at the end of the event's own channel)
// s2 stops taking after event 2 — events 3..4 pile up, event 5 blocks.
interface CopyPlan {
  slot: number;
  taken: boolean;
  blocked: boolean;
}
const PLAN: ReadonlyArray<{ s1: CopyPlan; s2: CopyPlan }> = [
  { s1: { slot: 0, taken: true, blocked: false }, s2: { slot: 0, taken: true, blocked: false } },
  { s1: { slot: 0, taken: true, blocked: false }, s2: { slot: 0, taken: true, blocked: false } },
  { s1: { slot: 0, taken: true, blocked: false }, s2: { slot: 0, taken: false, blocked: false } },
  { s1: { slot: 0, taken: true, blocked: false }, s2: { slot: 1, taken: false, blocked: false } },
  { s1: { slot: 0, taken: true, blocked: false }, s2: { slot: 2, taken: false, blocked: false } },
  { s1: { slot: 0, taken: true, blocked: false }, s2: { slot: 2, taken: false, blocked: true } },
];

// replay ring tick angles (degrees, clockwise from 12 o'clock), one per event
const TICK_DEG = [-70, -42, -14, 14, 42, 70] as const;
const tickPos = (k: number): { x: number; y: number } => {
  const a = ((TICK_DEG[k] - 90) * Math.PI) / 180;
  return { x: HUB.x + RING_R * Math.cos(a), y: HUB.y + RING_R * Math.sin(a) };
};

// camera marks
const CAM_HUB: CameraState = { x: 480, y: 330, k: 1.3 };
const CAM_FAN: CameraState = { x: 720, y: 300, k: 1.15 };
const CAM_S2: CameraState = { x: 800, y: 330, k: 1.35 };
const CAM_S3: CameraState = { x: 760, y: 450, k: 1.25 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  pubU: ChannelRef<number>;
  hubU: ChannelRef<number>;
  ringU: ChannelRef<number>;
  sub1U: ChannelRef<number>;
  sub2U: ChannelRef<number>;
  sub3U: ChannelRef<number>;
  evs: Array<ChannelRef<number>>;
  s2free: ChannelRef<number>;
  altU: ChannelRef<number>;
  replayU: ChannelRef<number>;
  streamU: ChannelRef<number>;
  svcU: ChannelRef<number>;
  stageDim: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_HUB, cameraInterp);
  const pubU = tl.channel('pubU', 0);
  const hubU = tl.channel('hubU', 0);
  const ringU = tl.channel('ringU', 0);
  const sub1U = tl.channel('sub1U', 0);
  const sub2U = tl.channel('sub2U', 0);
  const sub3U = tl.channel('sub3U', 0);
  const evs = EVENTS.map((_, k) => tl.channel(`e${k + 1}`, 0));
  const s2free = tl.channel('s2free', 0);
  const altU = tl.channel('altU', 0);
  const replayU = tl.channel('replayU', 0);
  const streamU = tl.channel('streamU', 0);
  const svcU = tl.channel('svcU', 0);
  const stageDim = tl.channel('stageDim', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · one event, many audiences —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'A queue gives each value one owner. But an order event has many audiences — email, billing, analytics. For that, Effect has a hub: publish once, and every subscriber hears it.',
  });
  tl.tween(pubU, 1, { at: 0.7, dur: 0.7, ease: ease.enter });
  tl.tween(hubU, 1, { at: 1.5, dur: 1.3, ease: ease.draw });
  tl.hold(7.5, 0.5);

  // — Beat 2 · the constructor —
  tl.caption({
    at: 8.0,
    dur: 6,
    text: 'You pick a capacity and, optionally, a replay window. Two hundred fifty six slots here, and the last fifty events kept around for anyone who shows up late.',
  });
  tl.tween(ringU, 1, { at: 9.0, dur: 1.4, ease: ease.draw });

  // — Beat 3 · subscribe —
  tl.caption({
    at: 14.2,
    dur: 5.5,
    text: 'Subscribing is scoped, and each subscriber gets its own private queue inside the hub. Nobody competes with anybody.',
  });
  tl.tween(cam, CAM_FAN, { at: 14.4, dur: 1.3, ease: ease.move });
  tl.tween(sub1U, 1, { at: 15.0, dur: 0.7, ease: ease.enter });
  tl.tween(sub2U, 1, { at: 15.6, dur: 0.7, ease: ease.enter });

  // — Beat 4 · first publish —
  tl.caption({
    at: 20.0,
    dur: 6,
    text: 'Now publish one event. The hub copies it into every subscriber queue at the same moment. One event in — one copy out to each listener.',
  });
  tl.tween(evs[0], 1, { at: 20.4, dur: 4.4, ease: ease.linear });

  // — Beat 5 · the sequence + the ring remembers —
  tl.caption({
    at: 26.4,
    dur: 7,
    text: 'A whole order flows through: placed, captured, shipped. Every subscriber sees every event, in publish order — and the replay ring quietly remembers the recent past.',
  });
  tl.tween(evs[1], 1, { at: 26.6, dur: 3.6, ease: ease.linear });
  tl.tween(evs[2], 1, { at: 28.8, dur: 3.6, ease: ease.linear });
  tl.hold(33.6, 0.4);

  // — Beat 6 · the slow subscriber —
  tl.caption({
    at: 34.0,
    dur: 6.5,
    text: 'Then the billing fiber stops keeping up. Its private queue backs up — one, two, three events deep, completely full — while everyone else reads on happily.',
  });
  tl.tween(cam, CAM_S2, { at: 34.2, dur: 1.3, ease: ease.move });
  tl.tween(evs[3], 1, { at: 34.6, dur: 3.2, ease: ease.linear });
  tl.tween(evs[4], 1, { at: 36.6, dur: 3.2, ease: ease.linear });

  // — Beat 7 · the publisher parks —
  tl.caption({
    at: 41.0,
    dur: 7.5,
    text: 'On a bounded hub the next publish now parks the publisher: the slowest reader sets the pace for everyone. If that is unacceptable, the dropping and sliding flavors trade loss for speed.',
  });
  tl.tween(evs[5], 0.78, { at: 41.4, dur: 2.6, ease: ease.linear });
  tl.tween(altU, 1, { at: 45.6, dur: 0.7, ease: ease.enter });

  // — Beat 8 · the laggard takes one —
  tl.caption({
    at: 49.0,
    dur: 6,
    text: 'The moment the laggard takes one event, the parked publish slides home and the line moves again. Backpressure crossed the whole hub, and nothing was lost.',
  });
  tl.tween(s2free, 1, { at: 49.6, dur: 2.4, ease: ease.move });
  tl.tween(evs[5], 1, { at: 52.2, dur: 1.0, ease: ease.linear });
  tl.tween(altU, 0, { at: 52.6, dur: 0.6, ease: ease.enter });

  // — Beat 9 · the latecomer —
  tl.caption({
    at: 55.4,
    dur: 4.5,
    text: 'Now a latecomer subscribes, long after the party started. Normally it would hear only the future.',
  });
  tl.tween(cam, CAM_S3, { at: 55.6, dur: 1.3, ease: ease.move });
  tl.tween(sub3U, 1, { at: 56.4, dur: 0.8, ease: ease.enter });

  // — Beat 10 · replay —
  tl.caption({
    at: 60.3,
    dur: 6,
    text: 'But the replay window hands it the recent past first: the last events stream straight off the ring into its fresh queue, before anything new arrives.',
  });
  tl.tween(replayU, 1, { at: 60.7, dur: 3.4, ease: ease.linear });
  tl.hold(66.3, 0.4);

  // — Beat 11 · a subscription is a stream —
  tl.caption({
    at: 66.7,
    dur: 7,
    text: 'And because a subscription is just a source of values, you can wrap it as a stream and reuse the whole pull line from chapter one. The docs bind it all up as a service: publish, publish all, subscribe.',
  });
  tl.tween(cam, CAM_WIDE, { at: 66.9, dur: 1.5, ease: ease.move });
  tl.tween(streamU, 1, { at: 67.3, dur: 1.0, ease: ease.enter });
  tl.tween(svcU, 1, { at: 69.5, dur: 0.9, ease: ease.enter });
  tl.hold(73.7, 0.5);

  // — Beat 12 · handoff —
  tl.caption({
    at: 74.2,
    dur: 7,
    text: 'So queues hand off and hubs broadcast — both move values between fibers. The harder problem is state that two fibers both want to change. That is where transactions come in.',
  });
  tl.tween(stageDim, 0.13, { at: 74.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 76.0, dur: 0.8, ease: ease.enter });
  tl.hold(81.0, 1.5);

  return {
    tl,
    cam,
    pubU,
    hubU,
    ringU,
    sub1U,
    sub2U,
    sub3U,
    evs,
    s2free,
    altU,
    replayU,
    streamU,
    svcU,
    stageDim,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function Card({ x, y, tag, color, a, scale = 1 }: {
  x: number;
  y: number;
  tag: string;
  color: string;
  a: number;
  scale?: number;
}) {
  if (a <= 0.01) return null;
  const w = CARD_W * scale;
  const h = CARD_H * scale;
  return (
    <g opacity={a}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={6} fill={colors.BG} stroke={color} strokeWidth={1.4} />
      <text x={x} y={y + 3.5 * scale} textAnchor="middle" fill={color} fontSize={10 * scale} fontFamily="monospace">
        {tag}
      </text>
    </g>
  );
}

function QueueRack({ y, u, label, full }: { y: number; u: number; label: string; full?: boolean }) {
  if (u <= 0) return null;
  return (
    <g opacity={u}>
      {SLOT_XS.map((x, i) => (
        <rect key={i} x={x - 52} y={y - 15} width={104} height={30} rx={6} fill="none" stroke={full ? colors.NEGATIVE : colors.GRID} strokeWidth={full ? 1.8 : 1} />
      ))}
      <rect x={CONS_X - 56} y={y - 18} width={112} height={36} rx={9} fill={colors.PANEL} stroke={colors.GRID} />
      <text x={CONS_X} y={y + 4} textAnchor="middle" fill={colors.TEXT} fontSize={11.5}>
        {label}
      </text>
    </g>
  );
}

// where an event's copy for a given subscriber sits, as a pure function of
// the event channel u and (for the jammed lane) the s2free release channel
function copyPos(
  k: number,
  u: number,
  sub: 's1' | 's2',
  subY: number,
  s2free: number,
): { x: number; y: number; a: number } | null {
  if (u <= 0.45) return null;
  const plan = PLAN[k][sub];
  const hubEdge = { x: HUB.x + HUB.r + 8, y: HUB.y };
  let slot = plan.slot;
  // the jammed lane rearranges when s2free runs
  if (sub === 's2' && s2free > 0) {
    if (k === 2) {
      // the front card finally gets taken
      const w = clamp01(s2free / 0.5);
      return { x: lerp(SLOT_XS[0], CONS_X, w), y: subY, a: 1 - w };
    }
    if (k === 3 || k === 4) slot = plan.slot - Math.round(clamp01((s2free - 0.3) / 0.4));
    if (k === 5) {
      // the parked copy slides home into the back slot
      const w = clamp01((s2free - 0.5) / 0.5);
      const parkX = lerp(hubEdge.x, SLOT_XS[2], 0.55);
      const parkY = lerp(hubEdge.y, subY, 0.55);
      if (w <= 0) return { x: parkX, y: parkY, a: 1 };
      return { x: lerp(parkX, SLOT_XS[2], w), y: lerp(parkY, subY, w), a: 1 };
    }
  } else if (sub === 's2' && plan.blocked) {
    // blocked mid-flight at 55% of the fan path
    const w = Math.min(0.55, clamp01((u - 0.45) / 0.35));
    return { x: lerp(hubEdge.x, SLOT_XS[slot], w), y: lerp(hubEdge.y, subY, w), a: 1 };
  }
  const slotP = { x: SLOT_XS[slot], y: subY };
  if (u < 0.8) {
    const w = clamp01((u - 0.45) / 0.35);
    return { x: lerp(hubEdge.x, slotP.x, w), y: lerp(hubEdge.y, slotP.y, w), a: 1 };
  }
  if (!plan.taken || u < 0.88) return { x: slotP.x, y: slotP.y, a: 1 };
  const w = clamp01((u - 0.88) / 0.12);
  return { x: lerp(slotP.x, CONS_X, w), y: slotP.y, a: 1 - w };
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const pubU = s.get(scene.pubU);
  const hubU = s.get(scene.hubU);
  const ringU = s.get(scene.ringU);
  const subU = [s.get(scene.sub1U), s.get(scene.sub2U), s.get(scene.sub3U)];
  const eus = scene.evs.map((c) => s.get(c));
  const s2free = s.get(scene.s2free);
  const altU = s.get(scene.altU);
  const replayU = s.get(scene.replayU);
  const streamU = s.get(scene.streamU);
  const svcU = s.get(scene.svcU);
  const stageDim = s.get(scene.stageDim);
  const closeU = s.get(scene.closeU);

  // publisher parked while the blocked copy waits
  const parked = eus[5] > 0.7 && s2free < 0.45;
  // hub pulse when any event is being absorbed
  const hubPulse = Math.max(0, ...eus.map((u) => (u > 0.3 && u < 0.45 ? 1 - Math.abs((u - 0.375) / 0.075) : 0)));
  // s2 queue full while three cards sit and nothing drains
  const s2full = eus[4] >= 0.8 && s2free < 0.3;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={stageDim}>
          {/* publisher */}
          <g opacity={pubU}>
            <rect x={PUB.x - 62} y={PUB.y - 22} width={124} height={44} rx={10} fill={colors.PANEL} stroke={parked ? colors.WARM : colors.GRID} strokeWidth={parked ? 2 : 1} />
            <text x={PUB.x} y={PUB.y - 2} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
              publisher
            </text>
            <text x={PUB.x} y={PUB.y + 14} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="monospace">
              PubSub.publish
            </text>
            {parked && (
              <text x={PUB.x} y={PUB.y - 32} textAnchor="middle" fill={colors.WARM} fontSize={10.5}>
                ⏸ parked — hub is full
              </text>
            )}
          </g>

          {/* hub + replay ring */}
          <g opacity={hubU}>
            <circle cx={HUB.x} cy={HUB.y} r={HUB.r + hubPulse * 7} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5 + hubPulse} />
            <text x={HUB.x} y={HUB.y - 4} textAnchor="middle" fill={colors.TEXT} fontSize={14} fontWeight={600}>
              hub
            </text>
            <text x={HUB.x} y={HUB.y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="monospace">
              capacity: 256
            </text>
            <text x={HUB.x} y={HUB.y + HUB.r + 34} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
              {'PubSub.bounded({ capacity: 256, replay: 50 })'}
            </text>
          </g>
          <g opacity={ringU}>
            <circle cx={HUB.x} cy={HUB.y} r={RING_R} fill="none" stroke={colors.SECONDARY} strokeWidth={1.2} strokeDasharray="4 7" opacity={0.7} />
            <text x={HUB.x - RING_R - 10} y={HUB.y - RING_R + 4} textAnchor="end" fill={colors.SECONDARY} fontSize={10.5}>
              replay ring — last 50
            </text>
            {/* ticks stick to the ring as events pass the hub */}
            {eus.map((u, k) => {
              if (u < 0.42) return null;
              const p = tickPos(k);
              return <circle key={k} cx={p.x} cy={p.y} r={5} fill={EVENTS[k].color} opacity={0.9} />;
            })}
          </g>

          {/* alt flavors chip */}
          {altU > 0 && (
            <g opacity={altU}>
              <rect x={HUB.x - 108} y={HUB.y - RING_R - 64} width={216} height={30} rx={8} fill={colors.BG} stroke={colors.WARM} />
              <text x={HUB.x} y={HUB.y - RING_R - 44} textAnchor="middle" fill={colors.WARM} fontSize={10.5} fontFamily="monospace">
                PubSub.dropping · PubSub.sliding
              </text>
            </g>
          )}

          {/* subscribers */}
          <QueueRack y={SUBS[0].y} u={subU[0]} label={SUBS[0].label} />
          <QueueRack y={SUBS[1].y} u={subU[1]} label={SUBS[1].label} full={s2full} />
          <QueueRack y={SUBS[2].y} u={subU[2]} label={SUBS[2].label} />
          {subU[2] > 0 && replayU <= 0.02 && (
            <text x={SLOT_XS[1]} y={SUBS[2].y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontStyle="italic" opacity={subU[2]}>
              subscribed late — queue empty
            </text>
          )}

          {/* event cards in flight: publisher → hub */}
          {eus.map((u, k) => {
            if (u <= 0 || u > 0.45) return null;
            const w = clamp01(u / 0.3);
            const x = lerp(PUB.x + 70, HUB.x - HUB.r - 6, Math.min(1, w));
            const a = u > 0.3 ? 1 - (u - 0.3) / 0.15 : 1;
            return <Card key={k} x={x} y={PUB.y} tag={EVENTS[k].tag} color={EVENTS[k].color} a={a} />;
          })}

          {/* copies fanning to subscribers */}
          {eus.map((u, k) => {
            const c1 = copyPos(k, u, 's1', SUBS[0].y, 0);
            const c2 = copyPos(k, u, 's2', SUBS[1].y, s2free);
            return (
              <g key={k}>
                {c1 && subU[0] > 0 && <Card x={c1.x} y={c1.y} tag={EVENTS[k].tag} color={EVENTS[k].color} a={c1.a} />}
                {c2 && subU[1] > 0 && <Card x={c2.x} y={c2.y} tag={EVENTS[k].tag} color={EVENTS[k].color} a={c2.a} />}
              </g>
            );
          })}

          {/* replay: the last three ring ticks stream into the latecomer */}
          {replayU > 0 &&
            [3, 4, 5].map((k, i) => {
              const w = clamp01(replayU * 3 - i);
              if (w <= 0) return null;
              const from = tickPos(k);
              const to = { x: SLOT_XS[2 - i], y: SUBS[2].y };
              return (
                <Card
                  key={k}
                  x={lerp(from.x, to.x, w)}
                  y={lerp(from.y, to.y, w)}
                  tag={EVENTS[k].tag}
                  color={EVENTS[k].color}
                  a={0.4 + 0.6 * w}
                  scale={0.4 + 0.6 * w}
                />
              );
            })}

          {/* a subscription is a stream */}
          {streamU > 0 && (
            <g opacity={streamU}>
              <rect x={SLOT_XS[2] - 60} y={SUBS[0].y - 62} width={330} height={26} rx={7} fill={colors.BG} stroke={colors.ACCENT} />
              <text x={SLOT_XS[2] + 105} y={SUBS[0].y - 45} textAnchor="middle" fill={colors.ACCENT} fontSize={11} fontFamily="monospace">
                Stream.fromPubSub(pubsub)
              </text>
            </g>
          )}

          {/* the OrderEvents service panel */}
          {svcU > 0 && (
            <g opacity={svcU}>
              <rect x={96} y={430} width={290} height={118} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={116} y={456} fill={colors.TEXT} fontSize={12.5} fontFamily="monospace">
                class OrderEvents
              </text>
              <text x={116} y={480} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                publish(event)
              </text>
              <text x={116} y={500} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                publishAll(events)
              </text>
              <text x={116} y={520} fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                subscribe: Stream&lt;OrderEvent&gt;
              </text>
            </g>
          )}
        </g>

        {/* closing panel */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={330} y={240} width={620} height={160} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={302} textAnchor="middle" fill={colors.TEXT} fontSize={22}>
              publish once · everyone hears it
            </text>
            <text x={640} y={346} textAnchor="middle" fill={colors.ACCENT} fontSize={22} fontWeight={700}>
              replay keeps latecomers honest
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
