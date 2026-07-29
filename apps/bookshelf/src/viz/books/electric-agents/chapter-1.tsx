// Turning the Agent Inside Out
//
// Backing files: blog/2026/04/29/introducing-electric-agents.md ("Guarding
// the log", Kleppmann's inside-out move, "The agent is the durable stream",
// the /coder/landing-page-build spawnEntity example, the persistent/
// addressable/observable/resumable/forkable property list).
//
// Centerpiece: the inversion, performed. An agent runs sealed inside a
// laptop — its session state drawn as colored event dashes INSIDE the box.
// The lid closes and the session is trapped (a phone's packet bounces off a
// padlock). Then the Kleppmann move: the hidden dashes fly OUT and lay down
// as an addressable tape of typed events; the box shrinks into "just a
// subscriber", other readers dock with their own read heads, and the
// property badges light. Ends on the book's thesis over a quiet stage.
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
// The session's events — real event types from the runtime's entity schema
// (entity_created, inbox, run, step, text_delta, tool_call). Each event has
// a hidden position INSIDE the agent box and a target slot on the tape; the
// inversion lerps between them, driven by one channel.
// ---------------------------------------------------------------------------

const EVENT_COLOR: Record<string, string> = {
  entity_created: colors.SECONDARY,
  run: colors.SECONDARY,
  step: colors.SECONDARY,
  text_delta: colors.ACCENT,
  tool_call: colors.WARM,
  inbox: colors.POSITIVE,
};

const SESSION: { type: string; label?: string }[] = [
  { type: 'entity_created', label: 'entity_created' },
  { type: 'inbox', label: 'inbox' },
  { type: 'run', label: 'run' },
  { type: 'step' },
  { type: 'text_delta', label: 'text_delta' },
  { type: 'text_delta' },
  { type: 'tool_call', label: 'tool_call' },
  { type: 'text_delta' },
  { type: 'tool_call' },
  { type: 'text_delta' },
  { type: 'step' },
  { type: 'run' },
];

// the agent box (inside the laptop) and the tape it inverts onto
const BOX = { x: 250, y: 210, w: 270, h: 180 } as const;
const TAPE = { y: 470, x0: 175, x1: 1130 } as const;
const SLOT = (i: number): number => 315 + i * 52;

// hidden state: 4 rows × 3 dashes inside the box
const innerPos = (i: number): { x: number; y: number } => ({
  x: BOX.x + 42 + (i % 3) * 78,
  y: BOX.y + 44 + Math.floor(i / 3) * 34,
});

// subscribers that dock onto the tape after the inversion
const DOCKS = [
  { label: 'your phone', x: 620, headX: 640 },
  { label: 'a teammate', x: 810, headX: 830 },
  { label: 'supervisor agent', x: 1000, headX: 980 },
] as const;

const BADGES = ['persistent', 'addressable', 'observable', 'resumable', 'forkable'] as const;

// camera marks
const CAM_BOX: CameraState = { x: 400, y: 300, k: 1.42 };
const CAM_PHONE: CameraState = { x: 620, y: 300, k: 1.22 };
const CAM_TAPE: CameraState = { x: 650, y: 440, k: 1.24 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  boxU: ChannelRef<number>;
  lidU: ChannelRef<number>;
  phoneU: ChannelRef<number>;
  pktU: ChannelRef<number>;
  lockU: ChannelRef<number>;
  klU: ChannelRef<number>;
  invU: ChannelRef<number>;
  tapeU: ChannelRef<number>;
  urlU: ChannelRef<number>;
  chipU: ChannelRef<number>;
  docksU: ChannelRef<number>;
  badgesU: ChannelRef<number>;
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', { x: 420, y: 300, k: 1.3 }, cameraInterp);
  const boxU = tl.channel('boxU', 0);
  const lidU = tl.channel('lidU', 0);
  const phoneU = tl.channel('phoneU', 0);
  const pktU = tl.channel('pktU', 0);
  const lockU = tl.channel('lockU', 0);
  const klU = tl.channel('klU', 0);
  const invU = tl.channel('invU', 0);
  const tapeU = tl.channel('tapeU', 0);
  const urlU = tl.channel('urlU', 0);
  const chipU = tl.channel('chipU', 0);
  const docksU = tl.channel('docksU', 0);
  const badgesU = tl.channel('badgesU', 0);
  const dimU = tl.channel('dimU', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · the trapped session —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'You start an agent on your laptop. It runs for ten minutes. Then you close the lid to go to a meeting — and the session is just gone.',
  });
  tl.tween(boxU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_BOX, { at: 0.6, dur: 2.6, ease: ease.move });
  tl.tween(lidU, 1, { at: 4.6, dur: 1.4, ease: ease.move });
  tl.hold(7.5, 0.6);

  // — Beat 2 · you can't reach it —
  tl.caption({
    at: 8.1,
    dur: 6.5,
    text: "You can't check on it from your phone. You can't share it with a colleague, or point a supervisor agent at it. The state is trapped.",
  });
  tl.tween(cam, CAM_PHONE, { at: 8.3, dur: 1.4, ease: ease.move });
  tl.tween(phoneU, 1, { at: 8.8, dur: 0.7, ease: ease.enter });
  tl.tween(lockU, 1, { at: 9.6, dur: 0.5, ease: ease.pop });
  tl.tween(pktU, 1, { at: 10.2, dur: 1.2, ease: ease.linear });
  tl.tween(pktU, 0.62, { at: 11.4, dur: 0.8, ease: ease.move }); // the bounce
  tl.hold(14.6, 0.5);

  // — Beat 3 · the diagnosis —
  tl.caption({
    at: 15.1,
    dur: 6.2,
    text: "These feel like separate missing features, but they're one problem. The session log is dumped in a hidden file, or guarded behind an interface. It isn't addressable.",
  });
  tl.hold(21.3, 0.6);

  // — Beat 4 · Kleppmann —
  tl.caption({
    at: 21.9,
    dur: 7.2,
    text: 'A decade ago, Martin Kleppmann pointed at the commit log inside a database and said: that is the database. Indexes, caches, views — all just projections over the log.',
  });
  tl.tween(cam, CAM_BOX, { at: 22.1, dur: 1.4, ease: ease.move });
  tl.tween(lidU, 0, { at: 22.3, dur: 1.0, ease: ease.move });
  tl.tween(klU, 1, { at: 23.6, dur: 1.2, ease: ease.draw });
  tl.hold(29.1, 0.6);

  // — Beat 5 · the inversion —
  tl.caption({
    at: 29.7,
    dur: 6,
    text: 'Electric Agents applies the same move to agents. Turn the agent inside out: take the hidden log and expose it, as a durable stream.',
  });
  tl.tween(cam, CAM_TAPE, { at: 30.0, dur: 1.8, ease: ease.move });
  tl.tween(tapeU, 1, { at: 30.4, dur: 1.4, ease: ease.draw });
  tl.tween(invU, 1, { at: 31.2, dur: 3.4, ease: ease.move });

  // — Beat 6 · the stream is the agent —
  tl.caption({
    at: 36.1,
    dur: 6.6,
    text: 'Now the stream is the agent. Messages, model calls, tool calls — every event lands in order on one append-only tape that lives online, outside any process.',
  });
  tl.hold(42.7, 0.5);

  // — Beat 7 · addressable —
  tl.caption({
    at: 43.2,
    dur: 6,
    text: 'The stream gets its own address. Spawning this coding session returned a stable entity path — something you can talk to, from anywhere.',
  });
  tl.tween(urlU, 1, { at: 44.0, dur: 0.7, ease: ease.pop });
  tl.hold(49.2, 0.5);

  // — Beat 8 · the model is demoted —
  tl.caption({
    at: 49.7,
    dur: 6.4,
    text: "And the model? It's demoted. The model is just the current subscriber doing the thinking. Swap it mid-session, and the agent persists.",
  });
  tl.tween(chipU, 1, { at: 50.3, dur: 1.4, ease: ease.move });

  // — Beat 9 · readers dock —
  tl.caption({
    at: 56.3,
    dur: 6.4,
    text: 'Other readers dock alongside it. Your phone, a teammate, a supervisor agent — each one holds its own read position on the same live tape.',
  });
  tl.tween(cam, CAM_WIDE, { at: 56.5, dur: 1.6, ease: ease.move });
  tl.tween(docksU, 1, { at: 57.1, dur: 2.6, ease: ease.move });
  tl.hold(62.9, 0.5);

  // — Beat 10 · the property list —
  tl.caption({
    at: 63.4,
    dur: 6.6,
    text: 'One inversion buys the whole feature list: sessions that survive crashes, agents you can observe from anywhere, resume from any point, share, and fork.',
  });
  tl.tween(badgesU, 1, { at: 64.0, dur: 2.8, ease: ease.move });
  tl.hold(70.2, 0.5);

  // — Beat 11 · thesis —
  tl.caption({
    at: 70.7,
    dur: 6.8,
    text: "That's the thesis this book unpacks: the agent is the durable stream. Everything else is a projection, or a subscriber.",
  });
  tl.tween(dimU, 0.12, { at: 70.9, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 72.2, dur: 0.9, ease: ease.enter });
  tl.hold(77.7, 1.5);

  return {
    tl,
    cam,
    boxU,
    lidU,
    phoneU,
    pktU,
    lockU,
    klU,
    invU,
    tapeU,
    urlU,
    chipU,
    docksU,
    badgesU,
    dimU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function EventDash({ x, y, color, alpha, w = 26, h = 10 }: {
  x: number;
  y: number;
  color: string;
  alpha: number;
  w?: number;
  h?: number;
}) {
  if (alpha <= 0) return null;
  return <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={3} fill={color} opacity={alpha} />;
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const boxU = s.get(scene.boxU);
  const lidU = s.get(scene.lidU);
  const phoneU = s.get(scene.phoneU);
  const pktU = s.get(scene.pktU);
  const lockU = s.get(scene.lockU);
  const klU = s.get(scene.klU);
  const invU = s.get(scene.invU);
  const tapeU = s.get(scene.tapeU);
  const urlU = s.get(scene.urlU);
  const chipU = s.get(scene.chipU);
  const docksU = s.get(scene.docksU);
  const badgesU = s.get(scene.badgesU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  // the sealed-session dashes dim under the lid, glow for the Kleppmann beat
  const innerAlpha = (0.45 + 0.55 * klU) * (1 - 0.75 * lidU);

  // the agent box morphs into the subscriber chip as chipU rises
  const bx = BOX.x + (560 - BOX.x) * chipU;
  const by = BOX.y + (392 - BOX.y) * chipU;
  const bw = BOX.w - (BOX.w - 150) * chipU;
  const bh = BOX.h - (BOX.h - 34) * chipU;

  // phone → padlock packet path (bounces back when pktU retreats)
  const pktX = 830 - (830 - (BOX.x + BOX.w + 26)) * pktU;
  const pktY = 300;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- laptop + sealed agent box ---- */}
        <g opacity={boxU * dimU}>
          {/* laptop shell (fades once the inversion begins) */}
          <g opacity={1 - invU}>
            <rect x={BOX.x - 34} y={BOX.y - 30} width={BOX.w + 68} height={BOX.h + 56} rx={14} fill="none" stroke={colors.GRID} strokeWidth={2} />
            <rect x={BOX.x - 80} y={BOX.y + BOX.h + 30} width={BOX.w + 160} height={12} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={BOX.x + BOX.w / 2} y={BOX.y - 44} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
              an agent, mid-session
            </text>
          </g>
          {/* the box itself → later the subscriber chip */}
          <rect x={bx} y={by} width={bw} height={bh} rx={10} fill={colors.PANEL} stroke={chipU > 0.5 ? colors.ACCENT : colors.GRID} strokeWidth={1.5} />
          {chipU > 0.55 && (
            <text x={bx + bw / 2} y={by + bh / 2 + 4} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} opacity={(chipU - 0.55) / 0.45}>
              the model — a subscriber
            </text>
          )}
          {/* the lid */}
          {lidU > 0.01 && (
            <rect x={BOX.x - 34} y={BOX.y - 30} width={BOX.w + 68} height={(BOX.h + 56) * lidU} rx={14} fill={colors.BG} stroke={colors.GRID} opacity={0.92} />
          )}
          {klU > 0.05 && invU < 0.6 && (
            <text x={BOX.x + BOX.w / 2} y={BOX.y + BOX.h + 6} textAnchor="middle" fill={colors.WARM} fontSize={12.5} opacity={klU * (1 - invU)}>
              the hidden log — that IS the agent
            </text>
          )}
        </g>

        {/* ---- the session events: inside the box → onto the tape ---- */}
        {SESSION.map((e, i) => {
          const from = innerPos(i);
          // staggered departure, one driving channel
          const u = clamp01(invU * 1.55 - i * 0.05);
          const x = from.x + (SLOT(i) - from.x) * u;
          const y = from.y + (TAPE.y - from.y) * u;
          const preAlpha = boxU * innerAlpha * (1 - 0.85 * lidU);
          const alpha = (preAlpha + (1 - preAlpha) * u) * dimU;
          return (
            <g key={i}>
              <EventDash x={x} y={y} color={EVENT_COLOR[e.type]} alpha={alpha} w={26 - 8 * u} h={10 + 8 * u} />
              {e.label && u > 0.92 && (
                <text x={x} y={TAPE.y + (i % 2 === 0 ? 30 : -22)} textAnchor="middle" fill={colors.MUTED} fontSize={10} fontFamily={mono} opacity={(u - 0.92) / 0.08 * dimU}>
                  {e.label}
                </text>
              )}
            </g>
          );
        })}

        {/* ---- the phone + padlock ---- */}
        <g opacity={phoneU * (1 - invU) * dimU}>
          <rect x={815} y={262} width={44} height={76} rx={8} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.5} />
          <circle cx={837} cy={326} r={3.5} fill="none" stroke={colors.GRID} />
          <text x={837} y={250} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
            your phone
          </text>
          {pktU > 0.02 && pktU < 0.99 && <circle cx={pktX} cy={pktY} r={7} fill={colors.ACCENT} opacity={0.9} />}
        </g>
        <g opacity={lockU * (1 - invU) * dimU}>
          {/* padlock at the box edge */}
          <rect x={BOX.x + BOX.w + 2} y={294} width={26} height={20} rx={4} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.5} />
          <path d={`M ${BOX.x + BOX.w + 7} 294 v -7 a 8 8 0 0 1 16 0 v 7`} fill="none" stroke={colors.NEGATIVE} strokeWidth={2} />
          <text x={BOX.x + BOX.w + 15} y={332} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5}>
            not addressable
          </text>
        </g>

        {/* ---- the tape ---- */}
        <g opacity={dimU}>
          <line x1={TAPE.x0} y1={TAPE.y} x2={TAPE.x0 + (TAPE.x1 - TAPE.x0) * tapeU} y2={TAPE.y} stroke={colors.GRID} strokeWidth={2} />
          {tapeU > 0.9 && (
            <>
              {/* offset ticks */}
              {Array.from({ length: 19 }, (_, k) => (
                <line key={k} x1={TAPE.x0 + 15 + k * 50} y1={TAPE.y + 12} x2={TAPE.x0 + 15 + k * 50} y2={TAPE.y + 17} stroke={colors.GRID} strokeWidth={1} opacity={0.7 * (tapeU - 0.9) * 10} />
              ))}
              <text x={TAPE.x1} y={TAPE.y + 32} textAnchor="end" fill={colors.MUTED} fontSize={10.5} opacity={(tapeU - 0.9) * 10}>
                append-only → offsets grow this way
              </text>
            </>
          )}
          {/* URL chip */}
          {urlU > 0 && (
            <g opacity={urlU}>
              <rect x={TAPE.x0 - 6} y={TAPE.y - 56} width={252} height={26} rx={13} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.2} />
              <text x={TAPE.x0 + 120} y={TAPE.y - 39} textAnchor="middle" fill={colors.ACCENT} fontSize={12.5} fontFamily={mono}>
                /coder/landing-page-build
              </text>
            </g>
          )}
        </g>

        {/* ---- docked subscribers with read heads ---- */}
        {DOCKS.map((d, i) => {
          const u = clamp01(docksU * 3 - i * 0.9);
          if (u <= 0) return null;
          return (
            <g key={d.label} opacity={u * dimU}>
              <rect x={d.x - 66} y={556} width={132} height={30} rx={15} fill={colors.PANEL} stroke={colors.GRID} />
              <text x={d.x} y={575} textAnchor="middle" fill={colors.TEXT} fontSize={12}>
                {d.label}
              </text>
              <line x1={d.headX} y1={TAPE.y + 14} x2={d.x} y2={556} stroke={colors.GRID} strokeWidth={1} strokeDasharray="3 4" />
              <path d={`M ${d.headX - 7} ${TAPE.y + 20} L ${d.headX + 7} ${TAPE.y + 20} L ${d.headX} ${TAPE.y + 8} Z`} fill={colors.TEAL} />
            </g>
          );
        })}

        {/* ---- property badges ---- */}
        {BADGES.map((b, i) => {
          const u = clamp01(badgesU * 4 - i * 0.75);
          if (u <= 0) return null;
          const x = 240 + i * 165;
          return (
            <g key={b} opacity={u * dimU}>
              <rect x={x - 68} y={122} width={136} height={30} rx={15} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.3} />
              <text x={x} y={141} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>
                {b}
              </text>
            </g>
          );
        })}
      </Camera>

      {/* ---- closing thesis panel (drawn over the dimmed stage) ---- */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={310} y={250} width={660} height={160} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
          <text x={640} y={315} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={700}>
            the agent is the durable stream
          </text>
          <text x={640} y={360} textAnchor="middle" fill={colors.MUTED} fontSize={16}>
            everything else is a projection — or a subscriber
          </text>
        </g>
      )}
    </>
  );
}

export const vizScene = () => scene;
