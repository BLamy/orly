// Asleep Between Wakes
//
// Backing files: docs/agents/usage/waking-entities.md (the wake pipeline:
// external event → wake entry persisted → handler invocation → WakeEvent;
// the seven wake producers; coalescing over contiguous offsets; at-least-once
// delivery + idempotent writes; ctx.sleep()), docs/agents/reference/
// wake-event.md (WakeEvent fields source/type/fromOffset/toOffset/
// eventCount), docs/agents/usage/writing-handlers.md (re-entrant handlers,
// state read back from collections).
//
// Centerpiece: the wake machine, run twice. An entity is a dim ring — no
// process, no memory. A message flies in, but the FIRST thing that happens
// is a wake entry landing on the tape (the crash-proof doorbell). Only then
// does the handler ignite, receive its WakeEvent card, emit events, and go
// back to sleep. Second run: three messages arrive at once and coalesce into
// ONE wake spanning a contiguous offset range.
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
const mono = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — the seven wake producers (verbatim from waking-entities.md), the
// entity ring, and the entity's stream tape.
// ---------------------------------------------------------------------------

const SOURCES = [
  'a message — send',
  'a spawned child finishes',
  'an observed entity changes',
  'shared state changes',
  'a schedule fires',
  'a webhook source',
  'a Postgres change — sync',
] as const;

const SRC = { x: 218, y0: 118, dy: 52 } as const;
const RING = { x: 840, y: 290, r: 74 } as const;
const TAPE = { y: 520, x0: 150, x1: 1130 } as const;
const SLOT = (i: number): number => 330 + i * 62;

// camera marks
const CAM_RING: CameraState = { x: 760, y: 320, k: 1.28 };
const CAM_TAPE: CameraState = { x: 640, y: 460, k: 1.3 };
const CAM_CARD: CameraState = { x: 820, y: 340, k: 1.42 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  ringU: ChannelRef<number>;
  tapeU: ChannelRef<number>;
  srcU: ChannelRef<number>;
  pkt1U: ChannelRef<number>;
  wtick1U: ChannelRef<number>;
  handU: ChannelRef<number>;
  cardU: ChannelRef<number>;
  emitU: ChannelRef<number>;
  sleep1U: ChannelRef<number>;
  burstU: ChannelRef<number>;
  coalU: ChannelRef<number>;
  card2U: ChannelRef<number>;
  dedupU: ChannelRef<number>;
  sleep2U: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_RING, cameraInterp);
  const ringU = tl.channel('ringU', 0);
  const tapeU = tl.channel('tapeU', 0);
  const srcU = tl.channel('srcU', 0);
  const pkt1U = tl.channel('pkt1U', 0);
  const wtick1U = tl.channel('wtick1U', 0);
  const handU = tl.channel('handU', 0);
  const cardU = tl.channel('cardU', 0);
  const emitU = tl.channel('emitU', 0);
  const sleep1U = tl.channel('sleep1U', 0);
  const burstU = tl.channel('burstU', 0);
  const coalU = tl.channel('coalU', 0);
  const card2U = tl.channel('card2U', 0);
  const dedupU = tl.channel('dedupU', 0);
  const sleep2U = tl.channel('sleep2U', 0);
  const dimU = tl.channel('dimU', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the entity at rest —
  tl.caption({
    at: 0.5,
    dur: 7.2,
    text: "Here is the strangest thing about an Electric agent: between actions, it doesn't exist. No process running, no loop spinning, no memory held. Just the stream, at rest.",
  });
  tl.tween(ringU, 1, { at: 0.5, dur: 0.9, ease: ease.enter });
  tl.tween(tapeU, 1, { at: 1.4, dur: 1.3, ease: ease.draw });
  tl.hold(7.9, 0.5);

  // — Beat 2 · wakes —
  tl.caption({
    at: 8.4,
    dur: 5.2,
    text: 'So how does it ever act? Wakes. A wake is one invocation of the entity handler, triggered by something outside it.',
  });

  // — Beat 3 · the seven producers —
  tl.caption({
    at: 14.0,
    dur: 8,
    text: 'Seven things can produce one: a message, a child finishing, an observed entity changing, shared state changing, a schedule firing, a webhook, or a Postgres row arriving through sync.',
  });
  tl.tween(cam, CAM_WIDE, { at: 14.2, dur: 1.4, ease: ease.move });
  tl.tween(srcU, 1, { at: 14.6, dur: 3.6, ease: ease.move });
  tl.hold(22.2, 0.5);

  // — Beat 4 · persist first —
  tl.caption({
    at: 22.7,
    dur: 6.4,
    text: 'Follow one message in. Before any of your code runs, the runtime persists a wake entry to the entity stream. That write is the durability guarantee.',
  });
  tl.tween(cam, CAM_TAPE, { at: 22.9, dur: 1.5, ease: ease.move });
  tl.tween(pkt1U, 1, { at: 23.6, dur: 1.6, ease: ease.linear });
  tl.tween(wtick1U, 1, { at: 25.3, dur: 0.7, ease: ease.pop });

  // — Beat 5 · the pinned doorbell —
  tl.caption({
    at: 29.5,
    dur: 6.4,
    text: 'A wake that was written will eventually be delivered — through restarts, network blips, and crashes. The doorbell note is pinned to the door, not shouted down a hallway.',
  });
  tl.hold(35.9, 0.5);

  // — Beat 6 · the handler ignites —
  tl.caption({
    at: 36.4,
    dur: 7,
    text: 'Then the handler runs. It receives a wake event describing exactly what happened: the source stream, the type, the range of new offsets, and how many events arrived.',
  });
  tl.tween(cam, CAM_CARD, { at: 36.6, dur: 1.5, ease: ease.move });
  tl.tween(handU, 1, { at: 37.0, dur: 0.9, ease: ease.enter });
  tl.tween(cardU, 1, { at: 38.2, dur: 0.9, ease: ease.enter });
  tl.hold(43.4, 0.5);

  // — Beat 7 · re-entrant, stateless —
  tl.caption({
    at: 43.9,
    dur: 6.2,
    text: 'The handler is called fresh every time. It carries nothing over from the last run — whatever it needs, it reads back from the stream collections.',
  });
  tl.tween(emitU, 1, { at: 45.2, dur: 2.2, ease: ease.move });
  tl.tween(sleep1U, 1, { at: 48.4, dur: 1.0, ease: ease.move });
  tl.tween(cardU, 0, { at: 48.4, dur: 0.8, ease: ease.move });
  tl.hold(50.1, 0.5);

  // — Beat 8 · coalescing —
  tl.caption({
    at: 50.6,
    dur: 7,
    text: "While it slept, three more messages arrived. They don't spawn three handlers. The runtime coalesces them into a single wake covering a contiguous range of offsets.",
  });
  tl.tween(cam, CAM_TAPE, { at: 50.8, dur: 1.5, ease: ease.move });
  tl.tween(burstU, 1, { at: 51.4, dur: 2.6, ease: ease.linear });
  tl.tween(coalU, 1, { at: 54.4, dur: 1.2, ease: ease.draw });
  tl.tween(card2U, 1, { at: 55.6, dur: 0.9, ease: ease.enter });
  tl.tween(handU, 1, { at: 55.6, dur: 0.7, ease: ease.enter });
  tl.hold(57.6, 0.5);

  // — Beat 9 · at-least-once, idempotent —
  tl.caption({
    at: 58.1,
    dur: 7,
    text: 'Delivery is at least once, so the same wake can arrive twice. Handlers stay safe by writing idempotently: key each write by something stable, and let the primary key dedup.',
  });
  tl.tween(dedupU, 1, { at: 59.3, dur: 2.6, ease: ease.move });
  tl.hold(65.1, 0.5);

  // — Beat 10 · sleep —
  tl.caption({
    at: 65.6,
    dur: 5.6,
    text: 'When the work is done, the handler calls sleep. The acknowledged offset is persisted, and the entity goes dark again.',
  });
  tl.tween(cam, CAM_WIDE, { at: 65.8, dur: 1.5, ease: ease.move });
  tl.tween(card2U, 0, { at: 66.0, dur: 0.8, ease: ease.move });
  tl.tween(sleep2U, 1, { at: 66.8, dur: 1.2, ease: ease.move });
  tl.hold(71.2, 0.5);

  // — Beat 11 · the payoff —
  tl.caption({
    at: 71.7,
    dur: 6.8,
    text: 'That is the execution model: no idle cost, no held resources — an agent that can sleep for a month and pick up mid-conversation like nothing happened.',
  });
  tl.tween(dimU, 0.13, { at: 72.0, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 73.2, dur: 0.9, ease: ease.enter });
  tl.hold(78.5, 1.4);

  return {
    tl, cam, ringU, tapeU, srcU, pkt1U, wtick1U, handU, cardU, emitU,
    sleep1U, burstU, coalU, card2U, dedupU, sleep2U, dimU, closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function WakeCard({ x, y, u, count, range }: { x: number; y: number; u: number; count: number; range: string }) {
  if (u <= 0) return null;
  const rows = [
    ['source', '/assistant/my-chat'],
    ['type', 'inbox'],
    ['offsets', range],
    ['eventCount', String(count)],
  ];
  return (
    <g opacity={u}>
      <rect x={x} y={y} width={240} height={112} rx={10} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.3} />
      <text x={x + 14} y={y + 22} fill={colors.TEAL} fontSize={12} fontFamily={mono} fontWeight={700}>
        WakeEvent
      </text>
      {rows.map(([k, v], i) => (
        <g key={k}>
          <text x={x + 14} y={y + 42 + i * 18} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>
            {k}
          </text>
          <text x={x + 226} y={y + 42 + i * 18} textAnchor="end" fill={i === 3 && count > 1 ? colors.WARM : colors.TEXT} fontSize={10.5} fontFamily={mono}>
            {v}
          </text>
        </g>
      ))}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const ringU = s.get(scene.ringU);
  const tapeU = s.get(scene.tapeU);
  const srcU = s.get(scene.srcU);
  const pkt1U = s.get(scene.pkt1U);
  const wtick1U = s.get(scene.wtick1U);
  const handU = s.get(scene.handU);
  const cardU = s.get(scene.cardU);
  const emitU = s.get(scene.emitU);
  const sleep1U = s.get(scene.sleep1U);
  const burstU = s.get(scene.burstU);
  const coalU = s.get(scene.coalU);
  const card2U = s.get(scene.card2U);
  const dedupU = s.get(scene.dedupU);
  const sleep2U = s.get(scene.sleep2U);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  // the ring is lit while a handler runs, dim otherwise
  const lit = clamp01(handU - sleep1U * (1 - card2U) - sleep2U);
  const ringGlow = 0.18 + 0.82 * lit;

  // message packet 1: from source[0] to the tape's wake slot
  const src0 = { x: SRC.x + 120, y: SRC.y0 };
  const wakeSlot = { x: SLOT(0), y: TAPE.y };
  const p1 = {
    x: src0.x + (wakeSlot.x - src0.x) * pkt1U,
    y: src0.y + (wakeSlot.y - src0.y) * (pkt1U * pkt1U * (3 - 2 * pkt1U)),
  };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the seven producers ---- */}
        {SOURCES.map((label, i) => {
          const u = clamp01(srcU * 5 - i * 0.55);
          if (u <= 0) return null;
          const y = SRC.y0 + i * SRC.dy;
          return (
            <g key={label} opacity={u * dimU * (0.4 + 0.6 * (i === 0 ? 1 : 0.7))}>
              <rect x={SRC.x - 118} y={y - 15} width={252} height={30} rx={15} fill={colors.PANEL} stroke={i === 0 ? colors.POSITIVE : colors.GRID} strokeWidth={i === 0 ? 1.3 : 1} />
              <text x={SRC.x + 8} y={y + 4} textAnchor="middle" fill={i === 0 ? colors.POSITIVE : colors.MUTED} fontSize={11.5}>
                {label}
              </text>
            </g>
          );
        })}
        {srcU > 0.9 && (
          <text x={SRC.x + 8} y={SRC.y0 + 7 * SRC.dy + 4} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontStyle="italic" opacity={(srcU - 0.9) * 10 * dimU}>
            every one of them ends as a wake
          </text>
        )}

        {/* ---- the entity ring ---- */}
        <g opacity={ringU * dimU}>
          <circle cx={RING.x} cy={RING.y} r={RING.r + 10 * lit} fill="none" stroke={colors.ACCENT} strokeWidth={2.5} opacity={0.25 + 0.75 * ringGlow} />
          <circle cx={RING.x} cy={RING.y} r={RING.r - 12} fill={colors.PANEL} opacity={0.5 + 0.5 * lit} stroke={colors.GRID} />
          <text x={RING.x} y={RING.y - RING.r - 18} textAnchor="middle" fill={colors.MUTED} fontSize={12} fontFamily={mono}>
            /assistant/my-chat
          </text>
          {lit > 0.4 ? (
            <text x={RING.x} y={RING.y + 5} textAnchor="middle" fill={colors.TEXT} fontSize={13} fontFamily={mono} opacity={lit}>
              handler(ctx, wake)
            </text>
          ) : (
            <text x={RING.x} y={RING.y + 5} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={1 - lit}>
              idle — no process
            </text>
          )}
          {/* zzz on sleep */}
          {(sleep1U > 0.2 && card2U < 0.1) || sleep2U > 0.2 ? (
            <text x={RING.x + RING.r + 16} y={RING.y - RING.r + 10} fill={colors.MUTED} fontSize={16} fontStyle="italic" opacity={Math.max(sleep1U * (1 - card2U), sleep2U)}>
              z z z
            </text>
          ) : null}
        </g>

        {/* ---- the tape ---- */}
        <g opacity={dimU}>
          <line x1={TAPE.x0} y1={TAPE.y} x2={TAPE.x0 + (TAPE.x1 - TAPE.x0) * tapeU} y2={TAPE.y} stroke={colors.GRID} strokeWidth={2} />
          <text x={TAPE.x0} y={TAPE.y - 20} fill={colors.MUTED} fontSize={11.5} opacity={tapeU}>
            the entity&apos;s stream
          </text>

          {/* wake entry tick (run 1) */}
          {wtick1U > 0 && (
            <g opacity={wtick1U}>
              <rect x={SLOT(0) - 9} y={TAPE.y - 13} width={18} height={26} rx={3} fill={colors.TEAL} />
              <text x={SLOT(0)} y={TAPE.y + 32} textAnchor="middle" fill={colors.TEAL} fontSize={9.5} fontFamily={mono}>
                wake
              </text>
              <circle cx={SLOT(0)} cy={TAPE.y} r={22 * (1 - wtick1U)} fill="none" stroke={colors.TEAL} strokeWidth={2} opacity={1 - wtick1U} />
            </g>
          )}

          {/* events the handler emits (run 1) */}
          {['run', 'text_delta', 'text_delta'].map((t, i) => {
            const u = clamp01(emitU * 3 - i);
            if (u <= 0) return null;
            return (
              <g key={i} opacity={u}>
                <rect x={SLOT(1 + i) - 9} y={TAPE.y - 13 - 20 * (1 - u)} width={18} height={26} rx={3} fill={t === 'run' ? colors.SECONDARY : colors.ACCENT} />
                {i === 0 && (
                  <text x={SLOT(1)} y={TAPE.y + 32} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily={mono}>
                    run
                  </text>
                )}
              </g>
            );
          })}

          {/* the burst (run 2): three inbox ticks */}
          {[0, 1, 2].map((i) => {
            const u = clamp01(burstU * 3 - i * 0.8);
            if (u <= 0) return null;
            const x = SLOT(4 + i);
            const yFly = SRC.y0 + (TAPE.y - SRC.y0) * (u * u * (3 - 2 * u));
            return (
              <g key={i}>
                {u < 1 && <circle cx={src0.x + (x - src0.x) * u} cy={yFly} r={6} fill={colors.POSITIVE} opacity={0.9} />}
                {u >= 1 && <rect x={x - 9} y={TAPE.y - 13} width={18} height={26} rx={3} fill={colors.POSITIVE} />}
              </g>
            );
          })}

          {/* coalescing bracket over slots 4..6 */}
          {coalU > 0 && (
            <g opacity={coalU}>
              <path
                d={`M ${SLOT(4) - 16} ${TAPE.y - 28} L ${SLOT(4) - 16} ${TAPE.y - 40} L ${SLOT(6) + 16} ${TAPE.y - 40} L ${SLOT(6) + 16} ${TAPE.y - 28}`}
                fill="none"
                stroke={colors.WARM}
                strokeWidth={1.6}
              />
              <text x={(SLOT(4) + SLOT(6)) / 2} y={TAPE.y - 50} textAnchor="middle" fill={colors.WARM} fontSize={11.5}>
                one wake · three events
              </text>
            </g>
          )}
        </g>

        {/* message packet 1 in flight */}
        {pkt1U > 0.02 && pkt1U < 0.98 && <circle cx={p1.x} cy={p1.y} r={7} fill={colors.POSITIVE} opacity={0.9 * dimU} />}

        {/* ---- WakeEvent cards ---- */}
        <g opacity={dimU}>
          <WakeCard x={560} y={330} u={cardU} count={1} range={'21 → 22'} />
          <WakeCard x={560} y={330} u={card2U} count={3} range={'22 → 25'} />
        </g>

        {/* ---- idempotency: same key, write ignored ---- */}
        {dedupU > 0 && (
          <g opacity={dedupU * dimU}>
            <rect x={905} y={365} width={218} height={78} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={919} y={387} fill={colors.MUTED} fontSize={10.5} fontFamily={mono}>
              status — primary key
            </text>
            <rect x={919} y={398} width={190} height={24} rx={5} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1} />
            <text x={929} y={414} fill={colors.TEXT} fontSize={10.5} fontFamily={mono}>
              key current · replied
            </text>
            {/* the duplicate write bounces */}
            {dedupU > 0.45 && (
              <g opacity={clamp01((dedupU - 0.45) / 0.55)}>
                <rect
                  x={919 + 40 * clamp01((dedupU - 0.45) / 0.4)}
                  y={430}
                  width={110}
                  height={16}
                  rx={4}
                  fill={colors.NEGATIVE}
                  opacity={0.5 * (1 - clamp01((dedupU - 0.7) / 0.3))}
                />
                <text x={1014} y={456} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10}>
                  same key — dedup
                </text>
              </g>
            )}
          </g>
        )}
      </Camera>

      {/* closing panel */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={330} y={258} width={620} height={140} rx={16} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.5} />
          <text x={640} y={316} textAnchor="middle" fill={colors.TEXT} fontSize={22} fontWeight={700}>
            event → wake persisted → handler → sleep
          </text>
          <text x={640} y={356} textAnchor="middle" fill={colors.MUTED} fontSize={15}>
            no idle cost · nothing held between wakes
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
