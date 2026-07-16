// Three Slots in the Type
//
// Backing files: packages/effect/src/Effect.ts — the interface
// `Effect<out A, out E = never, out R = never>` (line ~116), the
// Success/Error/Services type extractors, Effect.succeed (→ Effect<number>),
// Effect.fail with a Data.TaggedError (→ Effect<never, OperationFailedError>),
// Effect.tryPromise({ try, catch }) (→ Effect<Response, TodoFetchError>),
// Effect.service (→ Effect<S, never, I>) and Effect.provideService.
//
// Centerpiece: one persistent giant card with three physical ports — a green
// success chute (A), a red failure chute (E), and a purple requirement socket
// (R). Real constructors stamp the card and the ports morph: "never" renders
// as a welded-shut plate; a service requirement exposes a socket the fiber
// refuses to accept until provideService plugs it.
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
// Layout — the big card center-left, code stamps on the left margin,
// the type signature readout above.
// ---------------------------------------------------------------------------

const BIG = { x: 400, y: 210, w: 480, h: 300 } as const;
const A_PORT = { x: BIG.x + BIG.w, y: BIG.y + 82 } as const;
const E_PORT = { x: BIG.x + BIG.w, y: BIG.y + 210 } as const;
const R_PORT = { x: BIG.x, y: BIG.y + 232 } as const;

// the five stamps (real code → real signatures)
interface Stamp {
  code: string[];
  sig: string;
  a: string | null; // label on the A chute, null = never (welded)
  e: string | null;
  r: string | null;
}
const STAMPS: Stamp[] = [
  {
    code: ['Effect.succeed(42)'],
    sig: 'Effect<number, never, never>',
    a: 'number',
    e: null,
    r: null,
  },
  {
    code: ['Effect.fail(', '  new OperationFailedError()', ')'],
    sig: 'Effect<never, OperationFailedError>',
    a: null,
    e: 'OperationFailedError',
    r: null,
  },
  {
    code: ['Effect.tryPromise({', '  try: (signal) => fetch(url),', '  catch: (cause) =>', '    new TodoFetchError({ cause })', '})'],
    sig: 'Effect<Response, TodoFetchError>',
    a: 'Response',
    e: 'TodoFetchError',
    r: null,
  },
  {
    code: ['Effect.service(Database)'],
    sig: 'Effect<Database, never, Database>',
    a: 'Database',
    e: null,
    r: 'Database',
  },
  {
    code: ['program.pipe(', '  Effect.provideService(Database, db)', ')'],
    sig: 'Effect<Database, never, never>',
    a: 'Database',
    e: null,
    r: null,
  },
];

// camera marks
const CAM_CARD: CameraState = { x: 640, y: 340, k: 1.12 };
const CAM_A: CameraState = { x: 900, y: 290, k: 1.5 };
const CAM_E: CameraState = { x: 900, y: 420, k: 1.5 };
const CAM_R: CameraState = { x: 420, y: 440, k: 1.5 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  cardU: ChannelRef<number>;
  aU: ChannelRef<number>;
  eU: ChannelRef<number>;
  rU: ChannelRef<number>;
  stampIdx: ChannelRef<number>; // -1 = anatomy only; 0..4 = STAMPS index
  stampU: ChannelRef<number>; // entrance of the current stamp
  socketPulse: ChannelRef<number>; // the "cannot run" refusal pulse
  plugU: ChannelRef<number>; // the provided service plug sliding in
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', { x: 640, y: 340, k: 1.08 }, cameraInterp);
  const cardU = tl.channel('cardU', 0);
  const aU = tl.channel('aU', 0);
  const eU = tl.channel('eU', 0);
  const rU = tl.channel('rU', 0);
  const stampIdx = tl.channel('stampIdx', -1);
  const stampU = tl.channel('stampU', 0);
  const socketPulse = tl.channel('socketPulse', 0);
  const plugU = tl.channel('plugU', 0);
  const dimU = tl.channel('dimU', 1);
  const closeU = tl.channel('closeU', 0);

  const stampTo = (i: number, at: number): void => {
    tl.set(stampIdx, i, at);
    tl.set(stampU, 0, at);
    tl.tween(stampU, 1, { at: at + 0.05, dur: 0.8, ease: ease.enter });
  };

  // — Beat 1 · hook: the contract is the type —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: 'Every Effect wears its contract in its type. Three parameters: A, E, and R. Learn to read them, and a signature tells you every way a program can end.',
  });
  tl.tween(cardU, 1, { at: 0.6, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAM_CARD, { at: 0.8, dur: 2.0, ease: ease.move });
  tl.hold(6.7, 0.5);

  // — Beat 2 · A: the success chute —
  tl.caption({
    at: 7.4,
    dur: 5.6,
    text: 'A is the success channel: the value that slides out the green chute when everything goes well.',
  });
  tl.tween(cam, CAM_A, { at: 7.6, dur: 1.3, ease: ease.move });
  tl.tween(aU, 1, { at: 8.2, dur: 1.0, ease: ease.draw });
  tl.hold(13.0, 0.4);

  // — Beat 3 · E: the failure chute —
  tl.caption({
    at: 13.6,
    dur: 5.6,
    text: 'E is the failure channel: the errors this program admits it can produce, spelled out as types instead of buried in a throw.',
  });
  tl.tween(cam, CAM_E, { at: 13.8, dur: 1.3, ease: ease.move });
  tl.tween(eU, 1, { at: 14.4, dur: 1.0, ease: ease.draw });
  tl.hold(19.2, 0.4);

  // — Beat 4 · R: the requirement socket —
  tl.caption({
    at: 19.8,
    dur: 5.8,
    text: 'And R is the requirements channel: the services this description needs plugged in before any fiber will agree to run it.',
  });
  tl.tween(cam, CAM_R, { at: 20.0, dur: 1.3, ease: ease.move });
  tl.tween(rU, 1, { at: 20.6, dur: 1.0, ease: ease.draw });
  tl.hold(25.6, 0.4);

  // — Beat 5 · succeed(42) —
  tl.caption({
    at: 26.2,
    dur: 6.6,
    text: 'Succeed with forty two, and the type reads Effect of number. The failure slot says never: welded shut. This program cannot fail, and the compiler holds it to that.',
  });
  tl.tween(cam, CAM_CARD, { at: 26.4, dur: 1.4, ease: ease.move });
  stampTo(0, 27.0);
  tl.hold(32.8, 0.4);

  // — Beat 6 · fail(TaggedError) —
  tl.caption({
    at: 33.4,
    dur: 6.2,
    text: 'Fail with a tagged error and the slots flip: now the success chute seals, and the error channel names the exact failure. Not some vague exception. A type.',
  });
  stampTo(1, 34.0);
  tl.hold(39.6, 0.4);

  // — Beat 7 · tryPromise —
  tl.caption({
    at: 40.2,
    dur: 7.0,
    text: 'Try promise wraps a fetch that might reject. The catch handler maps the rejection into a typed error, so both chutes are live: a response on success, a named error on failure.',
  });
  stampTo(2, 40.8);
  tl.hold(47.2, 0.4);

  // — Beat 8 · a requirement appears —
  tl.caption({
    at: 47.8,
    dur: 6.6,
    text: 'Ask for a service, like a database, and R comes alive: a socket opens on the side of the card. This description literally cannot run until something fills it.',
  });
  stampTo(3, 48.4);
  tl.tween(socketPulse, 1, { at: 50.2, dur: 0.6, ease: ease.pop });
  tl.tween(socketPulse, 0, { at: 51.6, dur: 0.8, ease: ease.move });
  tl.hold(54.4, 0.4);

  // — Beat 9 · provideService —
  tl.caption({
    at: 55.0,
    dur: 6.0,
    text: 'Provide the service, and the socket disappears: R collapses back to never, and the description is runnable again.',
  });
  stampTo(4, 55.6);
  tl.tween(plugU, 1, { at: 56.2, dur: 1.2, ease: ease.move });
  tl.hold(61.0, 0.4);

  // — Beat 10 · close —
  tl.caption({
    at: 61.8,
    dur: 7.2,
    text: 'That is the discipline: no hidden throws, no secret globals. The signature is the whole story. What it yields, how it fails, what it needs.',
  });
  tl.tween(cam, CAM_WIDE, { at: 62.0, dur: 1.6, ease: ease.move });
  tl.tween(dimU, 0.13, { at: 62.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 63.8, dur: 0.9, ease: ease.enter });
  tl.hold(69.0, 1.4);

  return { tl, cam, cardU, aU, eU, rU, stampIdx, stampU, socketPulse, plugU, dimU, closeU };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function Chute({ x, y, color, label, weld, u, dir = 1 }: {
  x: number;
  y: number;
  color: string;
  label: string | null;
  weld: number; // 0 = open, 1 = welded shut
  u: number;
  dir?: 1 | -1;
}) {
  if (u <= 0.01) return null;
  const open = 1 - weld;
  return (
    <g opacity={u}>
      {/* chute mouth */}
      <rect x={x - (dir === 1 ? 0 : 64)} y={y - 20} width={64} height={40} rx={8} fill={colors.BG} stroke={color} strokeWidth={1.6} opacity={0.4 + 0.6 * open} />
      {/* open: flow arrow · welded: plate with rivets */}
      {open > 0.05 && (
        <g opacity={open}>
          <line x1={x + dir * 8} y1={y} x2={x + dir * 46} y2={y} stroke={color} strokeWidth={2.5} />
          <path d={`M ${x + dir * 46} ${y} l ${-dir * 10} -6 l 0 12 z`} fill={color} />
        </g>
      )}
      {weld > 0.05 && (
        <g opacity={weld}>
          <rect x={x - (dir === 1 ? 4 : 60)} y={y - 16} width={64} height={32} rx={6} fill={colors.PANEL} stroke={colors.MUTED} strokeWidth={1.5} />
          {[-20, 0, 20].map((dx) => (
            <circle key={dx} cx={x + dir * 28 + dx * 0.8} cy={y} r={2.4} fill={colors.MUTED} />
          ))}
          <text x={x + dir * 28} y={y - 24} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily="monospace">
            never
          </text>
        </g>
      )}
      {label && open > 0.4 && (
        <text x={x + dir * 56} y={y + 4} textAnchor={dir === 1 ? 'start' : 'end'} fill={color} fontSize={12.5} fontFamily="monospace" opacity={open}>
          {label}
        </text>
      )}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const cardU = s.get(scene.cardU);
  const aU = s.get(scene.aU);
  const eU = s.get(scene.eU);
  const rU = s.get(scene.rU);
  const stampIdxF = s.get(scene.stampIdx);
  const stampU = s.get(scene.stampU);
  const socketPulse = s.get(scene.socketPulse);
  const plugU = s.get(scene.plugU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const idx = Math.round(stampIdxF);
  const stamp = idx >= 0 && idx < STAMPS.length ? STAMPS[idx] : null;

  // port states derive from the active stamp (anatomy default: all open faintly)
  const aWeld = stamp ? (stamp.a ? 0 : 1) * stampU : 0;
  const eWeld = stamp ? (stamp.e ? 0 : 1) * stampU : 0;
  const rOpen = stamp ? (stamp.r ? 1 : 0) * stampU : 0;
  const aLabel = stamp?.a ?? 'A';
  const eLabel = stamp?.e ?? 'E';

  // socket: fully open only when the active stamp requires a service (or while
  // the plug is still sliding in); otherwise a faint ghost below the label
  // threshold, so "Database" never reads on unrelated beats.
  const socketOpen = stamp?.r ? stampU : idx === 4 ? 1 - plugU : rU * 0.3;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- the signature readout ---- */}
        <g opacity={cardU * dimU}>
          <text x={BIG.x + BIG.w / 2} y={BIG.y - 64} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontFamily="monospace">
            {'Effect<'}
            <tspan fill={colors.POSITIVE}>A</tspan>
            {', '}
            <tspan fill={colors.NEGATIVE}>E</tspan>
            {', '}
            <tspan fill={colors.SECONDARY}>R</tspan>
            {'>'}
          </text>
          {stamp && (
            <text x={BIG.x + BIG.w / 2} y={BIG.y - 32} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontFamily="monospace" opacity={stampU}>
              {stamp.sig}
            </text>
          )}
        </g>

        {/* ---- the big card ---- */}
        <g opacity={cardU * dimU}>
          <rect x={BIG.x} y={BIG.y} width={BIG.w} height={BIG.h} rx={18} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.8} />
          <rect x={BIG.x + 20} y={BIG.y + 18} width={130} height={24} rx={12} fill={colors.BG} stroke={colors.GRID} />
          <text x={BIG.x + 85} y={BIG.y + 34} textAnchor="middle" fill={colors.ACCENT} fontSize={12} fontFamily="monospace">
            a description
          </text>
          {/* the frozen work inside */}
          <rect x={BIG.x + 20} y={BIG.y + 58} width={BIG.w - 40} height={150} rx={10} fill={colors.BG} stroke={colors.GRID} strokeDasharray="5 5" />
          {(stamp?.code ?? ['— the frozen computation —']).map((line, i) => (
            <text
              key={`${idx}-${i}`}
              x={BIG.x + 38}
              y={BIG.y + 88 + i * 22}
              fill={i === 0 && stamp ? colors.TEXT : colors.MUTED}
              fontSize={13}
              fontFamily="monospace"
              opacity={stamp ? stampU : 0.7}
            >
              {line}
            </text>
          ))}
        </g>

        {/* ---- A chute (success, out the right top) ---- */}
        <g opacity={dimU}>
          <Chute x={A_PORT.x} y={A_PORT.y} color={colors.POSITIVE} label={aLabel} weld={aWeld} u={aU * cardU} />
          {aU > 0.3 && (
            <text x={A_PORT.x - 16} y={A_PORT.y - 30} textAnchor="end" fill={colors.POSITIVE} fontSize={13} opacity={aU * dimU}>
              success — what it yields
            </text>
          )}
        </g>

        {/* ---- E chute (failure, out the right bottom) ---- */}
        <g opacity={dimU}>
          <Chute x={E_PORT.x} y={E_PORT.y} color={colors.NEGATIVE} label={eLabel} weld={eWeld} u={eU * cardU} />
          {eU > 0.3 && (
            <text x={E_PORT.x - 16} y={E_PORT.y + 42} textAnchor="end" fill={colors.NEGATIVE} fontSize={13} opacity={eU * dimU}>
              failure — how it can go wrong
            </text>
          )}
        </g>

        {/* ---- R socket (requirement, left side) ---- */}
        {rU > 0.01 && (
          <g opacity={rU * cardU * dimU}>
            <text x={R_PORT.x + 16} y={R_PORT.y + 52} fill={colors.SECONDARY} fontSize={13}>
              requirements — what it needs
            </text>
            {/* socket opening */}
            <g opacity={0.25 + 0.75 * socketOpen}>
              <rect x={R_PORT.x - 30} y={R_PORT.y - 22} width={44} height={44} rx={8} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.8 + 2.4 * socketPulse} />
              <rect x={R_PORT.x - 20} y={R_PORT.y - 10} width={10} height={8} fill={colors.SECONDARY} opacity={0.9} />
              <rect x={R_PORT.x - 20} y={R_PORT.y + 3} width={10} height={8} fill={colors.SECONDARY} opacity={0.9} />
            </g>
            {socketOpen > 0.4 && plugU < 0.9 && (
              <text x={R_PORT.x - 40} y={R_PORT.y + 4} textAnchor="end" fill={colors.SECONDARY} fontSize={12} fontFamily="monospace" opacity={socketOpen * (1 - plugU)}>
                Database
              </text>
            )}
            {/* the plug provided by provideService */}
            {plugU > 0.01 && (
              <g opacity={Math.min(1, plugU * 1.4)}>
                <rect x={R_PORT.x - 30 - 90 * (1 - plugU) - 46} y={R_PORT.y - 14} width={46} height={28} rx={6} fill={colors.SECONDARY} opacity={0.85} />
                <text x={R_PORT.x - 30 - 90 * (1 - plugU) - 23} y={R_PORT.y + 4} textAnchor="middle" fill={colors.BG} fontSize={11} fontFamily="monospace" fontWeight={700}>
                  db
                </text>
              </g>
            )}
            {/* refusal pulse: a fiber icon bouncing off while the socket is empty */}
            {socketPulse > 0.01 && (
              <g opacity={socketPulse}>
                <text x={R_PORT.x - 120} y={R_PORT.y - 40} fill={colors.WARM} fontSize={12.5}>
                  no fiber will take it
                </text>
              </g>
            )}
          </g>
        )}

        {/* ---- closing panel ---- */}
        {closeU > 0.01 && (
          <g opacity={closeU}>
            <rect x={310} y={240} width={660} height={170} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={300} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontFamily="monospace">
              {'Effect<'}
              <tspan fill={colors.POSITIVE}>what it yields</tspan>
              {', '}
              <tspan fill={colors.NEGATIVE}>how it fails</tspan>
              {','}
            </text>
            <text x={640} y={334} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontFamily="monospace">
              <tspan fill={colors.SECONDARY}>what it needs</tspan>
              {'>'}
            </text>
            <text x={640} y={378} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              the signature is the whole story
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
