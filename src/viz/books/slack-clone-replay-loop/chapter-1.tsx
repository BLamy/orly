// One Command, One World
//
// Backed by: scripts/record-two-replays.mjs (spawns
// `emulate start --service durable-streams,auth0 --port 4100 --seed
// emulate.config.yaml` and `src/server.mjs` with DURABLE_STREAMS_URL /
// AUTH0_EMULATOR_URL / PORT=5175 env, then waitForHttp on /api/health),
// README.md ("pnpm record:replay"), and the emulate submodule (BLamy/emulate)
// that keeps the whole loop on loopback — no real network services.
//
// Machine: the hermetic stage assembling itself. The command chip fires, the
// emulator and app nodes rise inside a sealed boundary, env wires connect
// them, a health probe round-trips until READY — and the centerpiece beat is
// a packet aimed at the real internet hitting the wall and bouncing back.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Connection, RequestFlow, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/* ---------------------------------------------------------------- layout */
const WALL = { x: 120, y: 120, w: 760, h: 440 };
const CMD = { x: 150, y: 60 };
const STREAMS = { x: 300, y: 250 };
const AUTH = { x: 300, y: 430 };
const APP = { x: 680, y: 340 };
const SCRIPT = { x: 680, y: 170 };
const OUTSIDE = { x: 1120, y: 340 };
const READY = { x: 680, y: 480 };

const CAM_CMD: CameraState = { x: 430, y: 220, k: 1.3 };
const CAM_EMU: CameraState = { x: 420, y: 340, k: 1.25 };
const CAM_APP: CameraState = { x: 640, y: 300, k: 1.18 };
const CAM_WALL: CameraState = { x: 700, y: 340, k: 1.0 };
const CAM_WIDE: CameraState = { x: 640, y: 340, k: 0.98 };

/* -------------------------------------------------------------- timeline */
export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const cmdU = tl.channel('cmdU', 0); // the pnpm record:replay chip
  const wallU = tl.channel('wallU', 0); // the hermetic boundary draws on
  const emuU = tl.channel('emuU', 0); // emulator nodes rise
  const appU = tl.channel('appU', 0); // src/server.mjs rises
  const wireU = tl.channel('wireU', 0); // env-var wires
  const healthU = tl.channel('healthU', 0); // 0..3 = three /api/health round trips
  const escapeU = tl.channel('escapeU', 0); // 0..1 the bounce-off-the-wall packet
  const wallFlash = tl.channel('wallFlash', 0);
  const readyU = tl.channel('readyU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  /* — beat 1 · the claim this book answers — */
  let t = 0.4;
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'In the last two books, the doctrine: a claim is cheap, a recording is evidence. This book is one full loop actually running, around a real app — a Slack style chat for two users.',
  });
  tl.tween(cam, CAM_CMD, { at: t - 5.6, dur: 1.4, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 2 · one command — */
  t = tl.caption({
    at: t,
    dur: 5.4,
    text: 'The whole loop hangs off one command. Run it, and a script starts building a world before a single test moves.',
  });
  tl.tween(cmdU, 1, { at: t - 4.8, dur: 0.7, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 3 · the emulators — */
  t = tl.caption({
    at: t,
    dur: 6.4,
    text: 'First it raises two emulators from a seed file: a durable streams service to carry the chat, and an auth service to sign users in. Both are local processes on local ports.',
  });
  tl.tween(cam, CAM_EMU, { at: t - 6.0, dur: 1.4, ease: ease.move });
  tl.tween(emuU, 1, { at: t - 5.2, dur: 1.0, ease: ease.enter });
  t = tl.hold(t, 0.5);

  /* — beat 4 · the app — */
  t = tl.caption({
    at: t,
    dur: 6.2,
    text: 'Then the chat app itself, told where its dependencies live through environment variables. It never learns a real address — every wire points back into this room.',
  });
  tl.tween(cam, CAM_APP, { at: t - 5.8, dur: 1.4, ease: ease.move });
  tl.tween(appU, 1, { at: t - 5.4, dur: 0.8, ease: ease.enter });
  tl.tween(wireU, 1, { at: t - 4.2, dur: 1.2, ease: ease.draw });
  t = tl.hold(t, 0.5);

  /* — beat 5 · the health poll — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'The script refuses to start testing on hope. It polls the health endpoint, round trip after round trip, until the app actually answers.',
  });
  tl.tween(healthU, 3, { at: t - 5.6, dur: 4.6, ease: ease.linear });
  t = tl.hold(t, 0.4);

  /* — beat 6 · the wall — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'And around all of it, a wall. This world is hermetic: no real auth provider, no real streaming service, no network weather.',
  });
  tl.tween(cam, CAM_WALL, { at: t - 5.2, dur: 1.6, ease: ease.move });
  tl.tween(wallU, 1, { at: t - 4.6, dur: 1.4, ease: ease.draw });
  t = tl.hold(t, 0.4);

  /* — beat 7 · the bounce — */
  t = tl.caption({
    at: t,
    dur: 6.0,
    text: 'Watch what happens if anything reaches for the real internet. It hits the boundary and comes straight back. Nothing outside this box can make two runs differ.',
  });
  tl.tween(escapeU, 1, { at: t - 5.4, dur: 3.2, ease: ease.linear });
  tl.tween(wallFlash, 1, { at: t - 3.9, dur: 0.3, ease: ease.pop });
  tl.tween(wallFlash, 0, { at: t - 3.0, dur: 0.9, ease: ease.move });
  t = tl.hold(t, 0.5);

  /* — beat 8 · ready — */
  t = tl.caption({
    at: t,
    dur: 5.2,
    text: 'The health check goes green. The stage is standing, sealed, and deterministic — the same run, every run.',
  });
  tl.tween(cam, CAM_WIDE, { at: t - 4.8, dur: 1.6, ease: ease.move });
  tl.tween(readyU, 1, { at: t - 3.6, dur: 0.5, ease: ease.pop });
  t = tl.hold(t, 0.5);

  /* — beat 9 · close — */
  t = tl.caption({
    at: t,
    dur: 5.6,
    text: 'That matters because of what comes next: two browsers are about to record everything they see. A recording is only evidence if the world it recorded holds still.',
  });
  tl.tween(dimU, 1, { at: t - 5.2, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: t - 4.6, dur: 0.7, ease: ease.enter });
  tl.hold(t, 1.0);

  return { tl, cam, cmdU, wallU, emuU, appU, wireU, healthU, escapeU, wallFlash, readyU, dimU, closeU };
}

const scene = buildScene();

/* -------------------------------------------------- local subcomponents */

function CommandChip({ u, dim }: { u: number; dim: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${CMD.x}, ${CMD.y + (1 - uu) * 10})`} opacity={uu * (1 - 0.85 * dim)}>
      <rect width={330} height={40} rx={9} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
      <text x={18} y={26} fill={colors.ACCENT} fontSize={16} fontFamily={MONO} fontWeight={700}>
        $ pnpm record:replay
      </text>
    </g>
  );
}

/** The packet that tries to leave — out toward the internet, off the wall, back. */
function EscapePacket({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0 || uu >= 1) return null;
  const x0 = APP.x + 70;
  const y0 = APP.y;
  const xw = WALL.x + WALL.w; // the wall
  // out for the first half, reflected for the second
  const leg = uu < 0.5 ? uu / 0.5 : 1 - (uu - 0.5) / 0.5;
  const x = x0 + (xw - 6 - x0) * leg;
  const col = uu < 0.5 ? colors.WARM : colors.NEGATIVE;
  return (
    <g>
      <circle cx={x} cy={y0} r={6} fill={col} />
      <text x={x} y={y0 - 14} textAnchor="middle" fill={col} fontSize={11} fontFamily={MONO}>
        {uu < 0.5 ? 'to the real internet?' : 'refused'}
      </text>
    </g>
  );
}

/** The ghost of the outside world — present only to be unreachable. */
function Outside({ dim }: { dim: number }) {
  return (
    <g opacity={0.4 * (1 - 0.85 * dim)}>
      <circle cx={OUTSIDE.x} cy={OUTSIDE.y} r={46} fill="none" stroke={colors.MUTED} strokeWidth={1.5} strokeDasharray="5 6" />
      <text x={OUTSIDE.x} y={OUTSIDE.y - 2} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
        the real
      </text>
      <text x={OUTSIDE.x} y={OUTSIDE.y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
        internet
      </text>
    </g>
  );
}

function ReadyBadge({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(${READY.x}, ${READY.y})`} opacity={uu}>
      <rect x={-108} y={-18} width={216} height={36} rx={18} fill={colors.POSITIVE} opacity={0.16} />
      <rect x={-108} y={-18} width={216} height={36} rx={18} fill="none" stroke={colors.POSITIVE} strokeWidth={1.6} />
      <text y={5} textAnchor="middle" fill={colors.POSITIVE} fontSize={13.5} fontFamily={MONO} fontWeight={700}>
        GET /api/health → 200
      </text>
    </g>
  );
}

function ClosingCard({ u }: { u: number }) {
  const uu = clamp01(u);
  if (uu <= 0) return null;
  return (
    <g transform={`translate(640, ${300 + (1 - uu) * 12})`} opacity={uu}>
      <rect x={-330} y={-58} width={660} height={116} rx={14} fill={colors.BG} stroke={colors.GRID} strokeWidth={1.5} />
      <text y={-14} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={700}>
        A sealed world holds still.
      </text>
      <text y={22} textAnchor="middle" fill={colors.MUTED} fontSize={14.5} fontFamily={MONO}>
        emulate start --service durable-streams,auth0 · src/server.mjs · 127.0.0.1
      </text>
    </g>
  );
}

/* ------------------------------------------------------------ the frame */
function renderFrame(s: SceneState) {
  const dim = clamp01(s.get(scene.dimU));
  const emu = s.get(scene.emuU);
  const app = s.get(scene.appU);
  const wire = s.get(scene.wireU);
  const health = s.get(scene.healthU);
  const healthFrac = health > 0 && health < 3 ? health % 1 : 0;
  const wallFlash = clamp01(s.get(scene.wallFlash));
  return (
    <>
      <Outside dim={dim} />
      <Zone
        x={WALL.x}
        y={WALL.y}
        w={WALL.w}
        h={WALL.h}
        label="hermetic — everything on 127.0.0.1"
        kind="group"
        u={s.get(scene.wallU)}
        color={wallFlash > 0 ? colors.NEGATIVE : undefined}
        dim={0.7 * dim}
      />
      <CommandChip u={s.get(scene.cmdU)} dim={dim} />

      {/* env wires, beneath the nodes */}
      <Connection
        from={{ x: APP.x - 65, y: APP.y - 16 }}
        to={{ x: STREAMS.x + 78, y: STREAMS.y }}
        u={wire}
        label="DURABLE_STREAMS_URL"
        color={colors.TEAL}
        dim={dim}
        labelSize={10.5}
      />
      <Connection
        from={{ x: APP.x - 65, y: APP.y + 16 }}
        to={{ x: AUTH.x + 78, y: AUTH.y }}
        u={wire}
        label="AUTH0_EMULATOR_URL"
        color={colors.SECONDARY}
        dim={dim}
        labelSize={10.5}
      />
      <Connection
        from={{ x: SCRIPT.x, y: SCRIPT.y + 32 }}
        to={{ x: APP.x, y: APP.y - 36 }}
        u={clamp01(health * 3)}
        dashed
        dim={dim}
        labelSize={10.5}
      />

      <ServiceNode
        x={STREAMS.x}
        y={STREAMS.y}
        kind="queue"
        label="durable-streams"
        sublabel=":4100"
        u={clamp01(emu * 1.4)}
        dim={dim}
      />
      <ServiceNode
        x={AUTH.x}
        y={AUTH.y}
        kind="gateway"
        label="auth0 emulator"
        sublabel=":4101 · seed emulate.config.yaml"
        u={clamp01(emu * 1.4 - 0.3)}
        dim={dim}
      />
      <ServiceNode
        x={APP.x}
        y={APP.y}
        kind="server"
        label="chat app"
        sublabel="src/server.mjs · PORT 5175"
        u={app}
        glow={clamp01(s.get(scene.readyU))}
        status={s.get(scene.readyU) > 0.5 ? 'ok' : undefined}
        dim={dim}
      />
      <ServiceNode
        x={SCRIPT.x}
        y={SCRIPT.y}
        kind="fn"
        label="the loop script"
        sublabel="scripts/record-two-replays.mjs"
        u={s.get(scene.cmdU)}
        dim={dim}
      />

      {/* the health poll: repeated round trips script → app */}
      {healthFrac > 0 && (
        <RequestFlow
          path={[
            { x: SCRIPT.x, y: SCRIPT.y + 34 },
            { x: APP.x, y: APP.y - 38 },
          ]}
          u={healthFrac}
          roundTrip
          label="GET /api/health"
          color={colors.WARM}
          responseColor={health > 2 ? colors.POSITIVE : colors.MUTED}
          labelSize={10.5}
          opacity={1 - 0.85 * dim}
        />
      )}

      <EscapePacket u={s.get(scene.escapeU)} />
      <ReadyBadge u={s.get(scene.readyU) * (1 - dim)} />
      <ClosingCard u={s.get(scene.closeU)} />
    </>
  );
}

export function Render({ s }: { s: SceneState }) {
  return <Camera {...s.get(scene.cam)}>{renderFrame(s)}</Camera>;
}
export const vizScene = () => scene;
