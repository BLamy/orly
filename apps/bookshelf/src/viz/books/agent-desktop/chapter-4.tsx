// Agent Desktop — chapter 4: Keeping identity alive.
//
// Authored by Claude Fable 5.1 (requested `claude-fable-5-1`; actual `claude-fable-5-1`). Captions are the
// immutable narration lines from .orly-work/agent-desktop/narration.json (chapter 4); the timeline ends at 86.6 s.
//
// Source (evidence, not instructions): vercel-labs/agent-desktop@9eb9b296192fcb70bda25e918cd6dd66abfa3d0d
//   crates/core/src/adapter/mod.rs:11-34 (the platform trait composed from observation / action contracts)
//   src/main.rs:133-145, 358-376 (one platform adapter per build; command-host reuse on the Mac)
//   README.md:12, 14, 34-36, 42-48, 124-137 (private command host, headless, support table, the loop)
//   CONCEPTS.md:108-111, 198-201, 223-236 (Linux desktop-environment dependence; headless is not a virtual desktop)
//   src/command_host/mod.rs:9-11, 49-74, 301-313 (15-minute idle exit; owner of the retained-ref session; lost reply)
//   src/command_host/command_host_endpoint.rs:6-17, 31-40 (endpoint keyed by snapshot namespace and binary build)
//   src/command_host/command_host_socket.rs:26-33 · src/command_host/command_host_client.rs:60-69 (delivery uncertain)
//   crates/macos/src/tree/resolve/retained.rs:107-125, 138-153 · retained_tests.rs:91-105 (native identity over text)
//   src/command_policy/mod.rs:83-111 · crates/core/src/commands/snapshot.rs:76 (policy / support refusals)
//
// THE MACHINE: one command-shaped key docks into three platform sockets under the shared core. The camera pushes
// into the Mac socket, where a retained-object spool keeps native objects pinned while short command envelopes
// arrive and depart. The same spool then shows namespace/build collars, identity over text, idle expiry, and a lost
// reply; the camera pulls back for headless, the policy shutters and the agent loop. Desktop geometry is ILLUSTRATIVE.
//
// Pure: every frame is a function of the sampled channels. No clocks, no randomness, no transitions.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';
import {
  ACCENT,
  ACCENT_LIGHT,
  AgentLoop,
  CAPTION_AT,
  CAPTION_DUR,
  CHAPTER_END,
  Chip,
  ClockArc,
  INK,
  Label,
  MONO,
  OpaqueStrip,
  PLATE,
  PLATE_LINE,
  RefusalBadge,
  Shutter,
  WindowFrame,
  clamp01,
  lerp,
  seg,
  window01,
} from './kit';

// ---------------------------------------------------------------------------
// Layout (stage 1280×720; y ≥ 630 is left free for the CC pill)
// ---------------------------------------------------------------------------

const CORE = { x: 240, y: 62, w: 800, h: 64 };
/** key hanging under the core before it docks */
const KEY_HOME = { x: 640, y: 180 };
const KEY_W = 128;
const KEY_H = 40;
const SOCKET_X = [320, 640, 960];
const SOCKET_Y = 400; // body centre
const SOCKET_W = 224;
const SOCKET_H = 170;
const SLOT_Y = 352; // key centre when docked
const SOCKETS = [
  { name: 'MacOSAdapter', pins: [1, 1, 1, 1, 1] },
  { name: 'WindowsAdapter', pins: [1, 1, 0, 1, 1] },
  { name: 'LinuxAdapter', pins: [1, 0, 1, 0, 1] },
] as const;
/** support-table differences (README 124-137); each highlights exactly one socket */
const DIFFS = [
  { socket: 2, text: 'mouse · Linux: X11' },
  { socket: 2, text: 'screenshot · Wayland: portal' },
  { socket: 1, text: 'type · Windows: headed' },
] as const;

/** Camera zoom into the Mac socket; the host interior is authored in its own 1280×720 space and scaled by 1/K. */
const K = 2.5;
const MAC_CAM: CameraState = { x: SOCKET_X[0], y: SOCKET_Y, k: K };
const INTERIOR_ORIGIN = { x: SOCKET_X[0] - 640 / K, y: SOCKET_Y - 360 / K };

// interior space
const LANE_Y = 330;
const SPOOL = { x: 560, y: 330, r: 70 };
const DOCK_X = 400; // where an envelope stops to talk to the host (clear of the spool)
const WIN = { x: 860, y: 170, w: 340, h: 300 };
const ROWS = [
  { name: 'Documents', dy: 70 },
  { name: 'Target', dy: 130 },
  { name: 'Run', dy: 190 },
];
const PIN_ANGLES = [-0.65, 0, 0.65]; // radians, right side of the spool
/** how far the removed row drops out of the list (the thread follows the object, not the slot) */
const ROW_DROP = 200;
const ALT_ENDPOINT = { x: 300, y: 530 };
const CLOCK = { x: 370, y: 160, r: 60 };
const REF = '@s8f3k2p9:e8'; // README's example ref

// stage space, beats 7–9
const DESK = { x: 740, y: 140, w: 440, h: 190 };
const SLAB = { x: 740, y: 372, w: 440, h: 76 };
const SHUTTERS = [
  { x: 440, label: 'permissions' },
  { x: 600, label: 'support' },
];
const SHUTTER_Y = 300;
const AGENT_X = 120;
const LANE3_Y = 560;
const LOOP = { cx: 640, cy: 360, r: 190 };

// ---------------------------------------------------------------------------
// Pure geometry helpers
// ---------------------------------------------------------------------------

/** key centre for docking progress `u` ∈ [0, 3]: lift, slide, descend into socket i */
function keyPose(u: number): { x: number; y: number } {
  const i = Math.min(2, Math.floor(u));
  const f = clamp01(u - i);
  const start = i === 0 ? KEY_HOME : { x: SOCKET_X[i - 1], y: SLOT_Y };
  const travelY = 250;
  const lift = seg(f, 0, 0.3);
  const slide = seg(f, 0.3, 0.65);
  const drop = seg(f, 0.65, 1);
  const x = lerp(start.x, SOCKET_X[i], ease.move(slide));
  const yLift = lerp(start.y, travelY, ease.move(lift));
  const y = drop > 0 ? lerp(travelY, SLOT_Y, ease.move(drop)) : yLift;
  return { x, y };
}

/** a short command envelope: in along the lane, dwell at the dock, back out and gone */
function envelopePose(u: number): { x: number; y: number; o: number; talk: number } {
  const inU = seg(u, 0, 0.42);
  const talk = window01(u, 0.4, 0.6, 0.06);
  const outU = seg(u, 0.58, 1);
  const x = outU > 0 ? lerp(DOCK_X, -90, ease.move(outU)) : lerp(-90, DOCK_X, ease.move(inU));
  const o = u <= 0 || u >= 1 ? 0 : Math.min(seg(u, 0, 0.08), 1 - seg(u, 0.92, 1));
  return { x, y: LANE_Y, o, talk };
}

/** envelope with a different build stripe: in along the lane, then veers down to the other endpoint */
function strayPose(u: number): { x: number; y: number; o: number } {
  const a = seg(u, 0, 0.5);
  const b = seg(u, 0.5, 1);
  if (b <= 0) return { x: lerp(-90, 200, ease.move(a)), y: LANE_Y, o: seg(u, 0, 0.08) };
  const e = ease.move(b);
  // quadratic bend from the lane down to just left of the other endpoint (it docks beside it, not on it)
  const p0 = { x: 200, y: LANE_Y };
  const p1 = { x: 230, y: LANE_Y + 120 };
  const p2 = { x: ALT_ENDPOINT.x - 120, y: ALT_ENDPOINT.y };
  const x = (1 - e) * (1 - e) * p0.x + 2 * (1 - e) * e * p1.x + e * e * p2.x;
  const y = (1 - e) * (1 - e) * p0.y + 2 * (1 - e) * e * p1.y + e * e * p2.y;
  return { x, y, o: 1 };
}

function pinPoint(i: number): { x: number; y: number } {
  const a = PIN_ANGLES[i];
  return { x: SPOOL.x + (SPOOL.r - 14) * Math.cos(a), y: SPOOL.y + (SPOOL.r - 14) * Math.sin(a) };
}

function rowAnchor(i: number): { x: number; y: number } {
  return { x: WIN.x + 18, y: WIN.y + ROWS[i].dy };
}

/** points along the quadratic thread from pin i to row i (`dy` follows the row's object when it leaves the list) */
function threadPoints(i: number, dy = 0, n = 24): { x: number; y: number }[] {
  const p0 = pinPoint(i);
  const a = rowAnchor(i);
  const p2 = { x: a.x, y: a.y + dy };
  const p1 = { x: (p0.x + p2.x) / 2 + 40, y: p0.y };
  const pts: { x: number; y: number }[] = [];
  for (let k = 0; k <= n; k++) {
    const e = k / n;
    pts.push({
      x: (1 - e) * (1 - e) * p0.x + 2 * (1 - e) * e * p1.x + e * e * p2.x,
      y: (1 - e) * (1 - e) * p0.y + 2 * (1 - e) * e * p1.y + e * e * p2.y,
    });
  }
  return pts;
}

const polyline = (pts: { x: number; y: number }[]): string => pts.map((p) => `${p.x},${p.y}`).join(' ');

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);

  // beats 0–1: the platform boundary
  const coreU = tl.channel('coreU', 0);
  const socketsU = tl.channel('socketsU', 0);
  const socketsDim = tl.channel('socketsDim', 0);
  const keyU = tl.channel('keyU', 0); // 0..3 docking progress
  const keyO = tl.channel('keyO', 1);
  const diffU = tl.channel('diffU', -1); // -1 none · 0..3 which support-table difference is lit

  // beats 2–6: inside the Mac command host
  const hostU = tl.channel('hostU', 0);
  const hostAlive = tl.channel('hostAlive', 1);
  const envA = tl.channel('envA', 0);
  const envB = tl.channel('envB', 0);
  const collarU = tl.channel('collarU', 0);
  const collarO = tl.channel('collarO', 1);
  const strayU = tl.channel('strayU', 0);
  const altEpU = tl.channel('altEpU', 0);
  const windowO = tl.channel('windowO', 1);
  const rowRemoveU = tl.channel('rowRemoveU', 0);
  const rowReplaceU = tl.channel('rowReplaceU', 0);
  const envD = tl.channel('envD', 0);
  const refuse4U = tl.channel('refuse4U', 0);
  const identityNoteU = tl.channel('identityNoteU', 0);
  const clockReveal = tl.channel('clockReveal', 0);
  const clockU = tl.channel('clockU', 0);
  const threadBreak = tl.channel('threadBreak', 0);
  const staleU = tl.channel('staleU', 0);
  const freshNoteU = tl.channel('freshNoteU', 0);
  const exchangeU = tl.channel('exchangeU', 0);
  const reqU = tl.channel('reqU', 0);
  const replyU = tl.channel('replyU', 0);
  const tearU = tl.channel('tearU', 0);
  const uncertainU = tl.channel('uncertainU', 0);

  // beats 7–9: back on the desktop, then the loop
  const deskU = tl.channel('deskU', 0);
  const badgeU = tl.channel('badgeU', 0);
  const foundU = tl.channel('foundU', 0);
  const deskO = tl.channel('deskO', 1);
  const platformO = tl.channel('platformO', 1);
  const shutterU = tl.channel('shutterU', 0);
  const refU = tl.channel('refU', 0);
  const shutRefused = tl.channel('shutRefused', 0);
  const noActionU = tl.channel('noActionU', 0);
  const lane3U = tl.channel('lane3U', 0);
  const receiptU = tl.channel('receiptU', 0);
  const stageO = tl.channel('stageO', 1);
  const loopU = tl.channel('loopU', 0);
  const gatesU = tl.channel('gatesU', 0);
  const lapU = tl.channel('lapU', -1);
  const closeU = tl.channel('closeU', 0);

  const cap = (i: number, text: string) => tl.caption({ at: CAPTION_AT(i), dur: CAPTION_DUR, text });

  // BEAT 0 (0.6) — one key, three sockets, the shared core above
  cap(0, 'The shared core defines observation and action contracts. A platform adapter connects those contracts to the native machinery of each operating system.');
  tl.tween(coreU, 1, { at: 0.6, dur: 1.2, ease: ease.enter });
  tl.tween(socketsU, 1, { at: 1.6, dur: 1.6, ease: ease.enter });
  tl.tween(keyU, 3, { at: 3.2, dur: 5.0, ease: ease.linear });

  // BEAT 1 (9.2) — contact patterns differ; one difference lit at a time
  cap(1, 'That shared shape does not mean identical capabilities. Linux input and capture depend on the desktop environment, and some operations differ across platforms.');
  tl.tween(keyO, 0.3, { at: 9.2, dur: 0.6, ease: ease.enter });
  tl.set(diffU, 0, 9.6);
  tl.tween(diffU, 3, { at: 9.6, dur: 7.2, ease: ease.linear });
  tl.set(diffU, -1, 17.4);

  // BEAT 2 (17.8) — push into the Mac socket: envelopes come and go, the spool stays
  cap(2, 'On the Mac, separate command invocations can reuse a private command host. The short command ends, but the host keeps native accessibility objects alive.');
  tl.tween(cam, MAC_CAM, { at: 17.8, dur: 1.5, ease: ease.move });
  tl.tween(socketsDim, 1, { at: 18.2, dur: 1.0, ease: ease.enter });
  tl.tween(keyO, 0, { at: 18.0, dur: 0.6, ease: ease.enter });
  tl.tween(hostU, 1, { at: 18.6, dur: 1.2, ease: ease.enter });
  tl.tween(envA, 1, { at: 20.0, dur: 2.8, ease: ease.linear });
  tl.tween(envB, 1, { at: 22.8, dur: 2.8, ease: ease.linear });

  // BEAT 3 (26.4) — namespace / build collar; a different build docks elsewhere
  cap(3, 'The host belongs to a particular snapshot namespace and binary build. A different namespace or build gets a different endpoint rather than sharing that owner.');
  tl.tween(collarU, 1, { at: 26.6, dur: 1.2, ease: ease.draw });
  tl.tween(altEpU, 1, { at: 29.2, dur: 0.7, ease: ease.enter });
  tl.tween(strayU, 1, { at: 28.6, dur: 3.2, ease: ease.linear });

  // BEAT 4 (35.0) — identity over text: the row goes, a look-alike arrives, the thread stays with the original
  cap(4, 'Retaining the native object prevents a removed row from silently becoming a surviving row with the same identifier. Matching text does not override that identity.');
  tl.tween(collarO, 0.15, { at: 35.0, dur: 0.6, ease: ease.enter });
  tl.tween(altEpU, 0, { at: 35.0, dur: 0.6, ease: ease.enter });
  tl.tween(rowRemoveU, 1, { at: 35.6, dur: 1.1, ease: ease.move });
  tl.tween(rowReplaceU, 1, { at: 37.0, dur: 1.0, ease: ease.move });
  tl.tween(envD, 0.5, { at: 38.0, dur: 1.4, ease: ease.linear }); // arrives and asks to act on the old ref
  tl.tween(refuse4U, 1, { at: 39.6, dur: 0.5, ease: ease.pop });
  tl.tween(identityNoteU, 1, { at: 40.2, dur: 0.6, ease: ease.enter });
  tl.tween(envD, 1, { at: 41.0, dur: 1.4, ease: ease.linear }); // leaves with the refusal

  // BEAT 5 (43.6) — fifteen idle minutes, compressed; the owner exits, the refs go stale
  cap(5, 'The host exits after fifteen idle minutes. When that native owner is gone, its retained refs become stale and the next action needs a fresh snapshot.');
  tl.tween(refuse4U, 0, { at: 43.6, dur: 0.5, ease: ease.enter });
  tl.tween(identityNoteU, 0, { at: 43.6, dur: 0.5, ease: ease.enter });
  tl.tween(clockReveal, 1, { at: 43.8, dur: 0.6, ease: ease.enter });
  tl.tween(clockU, 1, { at: 44.2, dur: 3.0, ease: ease.linear });
  tl.tween(hostAlive, 0, { at: 47.2, dur: 1.0, ease: ease.enter });
  tl.tween(threadBreak, 1, { at: 47.6, dur: 0.6, ease: ease.enter });
  tl.tween(staleU, 1, { at: 48.6, dur: 0.5, ease: ease.pop });
  tl.tween(freshNoteU, 1, { at: 49.6, dur: 0.6, ease: ease.enter });

  // BEAT 6 (52.2) — a separate illustrative exchange: the request crosses once; the reply tears
  cap(6, 'If the host reply is lost, the command may already have executed. The client reports uncertain delivery instead of automatically replaying the request.');
  tl.tween(windowO, 0, { at: 51.5, dur: 0.4, ease: ease.enter });
  tl.set(rowRemoveU, 0, 51.95);
  tl.set(rowReplaceU, 0, 51.95);
  tl.set(threadBreak, 0, 51.95);
  tl.tween(clockReveal, 0, { at: 52.0, dur: 0.5, ease: ease.enter });
  tl.tween(staleU, 0, { at: 52.0, dur: 0.4, ease: ease.enter });
  tl.tween(freshNoteU, 0, { at: 52.0, dur: 0.4, ease: ease.enter });
  tl.tween(hostAlive, 1, { at: 52.2, dur: 0.8, ease: ease.enter });
  tl.tween(windowO, 1, { at: 52.4, dur: 0.6, ease: ease.enter });
  tl.tween(exchangeU, 1, { at: 52.4, dur: 0.6, ease: ease.enter });
  tl.tween(reqU, 1, { at: 53.2, dur: 1.6, ease: ease.linear });
  tl.tween(replyU, 1, { at: 55.2, dur: 1.6, ease: ease.linear });
  tl.tween(tearU, 1, { at: 56.0, dur: 0.6, ease: ease.enter });
  tl.tween(uncertainU, 1, { at: 57.0, dur: 0.6, ease: ease.pop });

  // BEAT 7 (60.8) — pull back: headless is a policy over a real desktop, standing on a graphical session
  cap(7, "Headless here limits the action's side effects. It does not create a virtual desktop; Linux still needs the user's graphical session and accessibility service.");
  tl.tween(cam, CAMERA_HOME, { at: 60.8, dur: 1.5, ease: ease.move });
  tl.tween(hostU, 0, { at: 60.8, dur: 0.8, ease: ease.enter });
  tl.tween(socketsDim, 1, { at: 61.4, dur: 0.8, ease: ease.enter });
  tl.tween(foundU, 1, { at: 62.2, dur: 1.0, ease: ease.enter });
  tl.tween(deskU, 1, { at: 63.0, dur: 1.0, ease: ease.enter });
  tl.tween(badgeU, 1, { at: 64.6, dur: 0.6, ease: ease.pop });

  // BEAT 8 (69.4) — a valid ref meets the shutters and comes back on chapter three's delivery lane
  cap(8, 'Permissions and platform support remain part of the contract. The adapter can refuse an operation even when the agent has a valid ref.');
  tl.tween(deskO, 0, { at: 69.4, dur: 0.6, ease: ease.enter }); // retire the headless/session group
  tl.tween(platformO, 0, { at: 69.4, dur: 0.6, ease: ease.enter }); // and the platform sockets under it
  tl.tween(shutterU, 1, { at: 69.6, dur: 0.8, ease: ease.enter });
  tl.tween(refU, 1, { at: 70.4, dur: 1.4, ease: ease.linear });
  tl.tween(shutRefused, 1, { at: 71.8, dur: 0.4, ease: ease.pop });
  tl.tween(noActionU, 1, { at: 72.2, dur: 0.6, ease: ease.enter });
  tl.tween(lane3U, 1, { at: 72.4, dur: 1.2, ease: ease.draw });
  tl.tween(receiptU, 1, { at: 73.4, dur: 2.0, ease: ease.linear });

  // BEAT 9 (78.0) — the loop, now with identity and policy gates inside act
  cap(9, 'The whole loop stays with the agent: observe a scoped tree, resolve a ref, act under policy, inspect the result, and observe what changed.');
  tl.tween(stageO, 0, { at: 78.0, dur: 0.8, ease: ease.enter });
  tl.tween(loopU, 1, { at: 78.3, dur: 1.4, ease: ease.draw });
  tl.tween(gatesU, 1, { at: 79.8, dur: 0.6, ease: ease.enter });
  tl.set(lapU, 0, 80.2);
  tl.tween(lapU, 1, { at: 80.2, dur: 4.0, ease: ease.linear });
  tl.tween(closeU, 1, { at: 84.6, dur: 0.6, ease: ease.enter });
  tl.hold(86.0, CHAPTER_END - 86.0);

  return {
    tl,
    cam,
    coreU,
    socketsU,
    socketsDim,
    keyU,
    keyO,
    diffU,
    hostU,
    hostAlive,
    envA,
    envB,
    collarU,
    collarO,
    strayU,
    altEpU,
    windowO,
    rowRemoveU,
    rowReplaceU,
    envD,
    refuse4U,
    identityNoteU,
    clockReveal,
    clockU,
    threadBreak,
    staleU,
    freshNoteU,
    exchangeU,
    reqU,
    replyU,
    tearU,
    uncertainU,
    deskU,
    badgeU,
    foundU,
    deskO,
    platformO,
    shutterU,
    refU,
    shutRefused,
    noActionU,
    lane3U,
    receiptU,
    stageO,
    loopU,
    gatesU,
    lapU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Drawing parts (pure functions of props)
// ---------------------------------------------------------------------------

function CommandKey({ x, y, opacity, docked }: { x: number; y: number; opacity: number; docked: number }) {
  if (opacity <= 0.001) return null;
  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity}>
      <rect x={-KEY_W / 2} y={-KEY_H / 2} width={KEY_W} height={KEY_H} rx={10} fill={ACCENT} stroke={ACCENT_LIGHT} strokeWidth={2} />
      {/* the bit: the command's shape, the same for every socket */}
      {[-36, -12, 12, 36].map((dx, i) => (
        <rect key={i} x={dx - 8} y={KEY_H / 2 - 2} width={16} height={i % 2 ? 14 : 20} fill={ACCENT_LIGHT} opacity={0.9} />
      ))}
      <text x={0} y={6} textAnchor="middle" fill={INK} fontSize={18} fontFamily={MONO} fontWeight={700}>
        command
      </text>
      {docked > 0 && <rect x={-KEY_W / 2 - 4} y={-KEY_H / 2 - 4} width={KEY_W + 8} height={KEY_H + 8} rx={12} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={docked} />}
    </g>
  );
}

function Socket({
  i,
  reveal,
  lit,
  dim,
}: {
  i: number;
  reveal: number;
  /** 0..1 this socket's contacts are the one difference being discussed */
  lit: number;
  dim: number;
}) {
  const rv = clamp01(reveal);
  if (rv <= 0) return null;
  const cx = SOCKET_X[i];
  const s = SOCKETS[i];
  const bodyH = SOCKET_H * ease.enter(rv);
  const top = SOCKET_Y - SOCKET_H / 2;
  const stroke = lit > 0.01 ? colors.WARM : PLATE_LINE;
  return (
    <g opacity={(1 - 0.85 * dim) * seg(rv, 0, 0.3)}>
      <rect x={cx - SOCKET_W / 2} y={top} width={SOCKET_W} height={bodyH} rx={16} fill={PLATE} stroke={stroke} strokeWidth={2} />
      {rv > 0.6 && (
        <g opacity={seg(rv, 0.6, 1)}>
          {/* keyway slot */}
          <rect x={cx - KEY_W / 2 - 8} y={SLOT_Y - KEY_H / 2 - 8} width={KEY_W + 16} height={KEY_H + 16} rx={12} fill="#060a14" stroke={PLATE_LINE} strokeWidth={1.5} />
          {/* contact pins: the native machinery this socket actually offers (illustrative pattern) */}
          {s.pins.map((p, j) => {
            const px = cx - 56 + j * 28;
            const py = SOCKET_Y + 42;
            return (
              <g key={j}>
                <rect x={px - 7} y={py - 14} width={14} height={28} rx={4} fill={p ? ACCENT : '#1b2437'} stroke={p ? ACCENT_LIGHT : PLATE_LINE} strokeWidth={1.5} opacity={p ? 1 : 0.7} />
                {lit > 0 && p === 1 && <rect x={px - 7} y={py - 14} width={14} height={28} rx={4} fill={colors.WARM} opacity={0.75 * lit} />}
              </g>
            );
          })}
          <Chip x={cx} y={SOCKET_Y + SOCKET_H / 2 + 34} text={s.name} anchor="middle" size={18} color={lit > 0.01 ? colors.WARM : ACCENT_LIGHT} />
        </g>
      )}
    </g>
  );
}

function Envelope({ x, y, opacity, label, stripe = ACCENT_LIGHT, talk = 0, scale = 1 }: { x: number; y: number; opacity: number; label: string; stripe?: string; talk?: number; scale?: number }) {
  if (opacity <= 0.001) return null;
  const w = 150;
  const h = 56;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity={opacity}>
      {talk > 0 && <circle cx={w / 2 + 18} cy={0} r={28 + 22 * talk} fill="none" stroke={colors.POSITIVE} strokeWidth={2} opacity={0.6 * (1 - talk)} />}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={10} fill={PLATE} stroke={ACCENT_LIGHT} strokeWidth={2} />
      <path d={`M ${-w / 2} ${-h / 2} L 0 ${-2} L ${w / 2} ${-h / 2}`} fill="none" stroke={PLATE_LINE} strokeWidth={1.5} />
      {/* namespace / build stripes */}
      <rect x={-w / 2 + 10} y={h / 2 - 12} width={36} height={6} rx={3} fill={ACCENT_LIGHT} />
      <rect x={-w / 2 + 52} y={h / 2 - 12} width={36} height={6} rx={3} fill={stripe} />
      <text x={0} y={-h / 2 - 10} textAnchor="middle" fill={INK} fontSize={18} fontFamily={MONO} fontWeight={700}>
        {label}
      </text>
    </g>
  );
}

function Spool({ alive, collar, collarO }: { alive: number; collar: number; collarO: number }) {
  const o = 0.12 + 0.88 * clamp01(alive);
  const c = 2 * Math.PI * (SPOOL.r + 26);
  const cu = clamp01(collar) * clamp01(collarO);
  return (
    <g>
      {/* collar: namespace + build stripes around the owner */}
      {cu > 0 && (
        <g opacity={cu * o}>
          <circle cx={SPOOL.x} cy={SPOOL.y} r={SPOOL.r + 26} fill="none" stroke={ACCENT_LIGHT} strokeWidth={8} strokeDasharray={`${c * 0.3 * clamp01(collar)} ${c}`} transform={`rotate(135 ${SPOOL.x} ${SPOOL.y})`} />
          <circle cx={SPOOL.x} cy={SPOOL.y} r={SPOOL.r + 26} fill="none" stroke={colors.SECONDARY} strokeWidth={8} strokeDasharray={`${c * 0.3 * clamp01(collar)} ${c}`} transform={`rotate(255 ${SPOOL.x} ${SPOOL.y})`} />
          <Chip x={SPOOL.x - 175} y={SPOOL.y - 90} text="namespace" anchor="middle" size={18} opacity={seg(collar, 0.6, 1)} />
          <Chip x={SPOOL.x + 170} y={SPOOL.y - 94} text="build" anchor="middle" size={18} color={colors.SECONDARY} opacity={seg(collar, 0.6, 1)} />
        </g>
      )}
      <g opacity={o}>
        <circle cx={SPOOL.x} cy={SPOOL.y} r={SPOOL.r} fill="#0b1326" stroke={ACCENT_LIGHT} strokeWidth={3} />
        <circle cx={SPOOL.x} cy={SPOOL.y} r={SPOOL.r - 26} fill="none" stroke={PLATE_LINE} strokeWidth={2} />
        <circle cx={SPOOL.x} cy={SPOOL.y} r={10} fill={ACCENT} />
        {PIN_ANGLES.map((_, i) => {
          const p = pinPoint(i);
          return <circle key={i} cx={p.x} cy={p.y} r={7} fill={PLATE} stroke={colors.WARM} strokeWidth={3} />;
        })}
        <Label x={SPOOL.x} y={SPOOL.y - SPOOL.r - 62} text="retained objects" size={24} anchor="middle" color={colors.WARM} />
      </g>
    </g>
  );
}

function Thread({ i, alive, broken, dy = 0 }: { i: number; alive: number; broken: number; dy?: number }) {
  const pts = threadPoints(i, dy);
  const b = clamp01(broken);
  const o = 0.12 + 0.88 * clamp01(alive);
  if (b <= 0) return <polyline points={polyline(pts)} fill="none" stroke={colors.WARM} strokeWidth={2.5} opacity={o} />;
  const n = pts.length;
  const cut = Math.round(n * 0.45);
  const gap = Math.round(n * 0.2 * b);
  const left = pts.slice(0, Math.max(1, cut - gap));
  const right = pts.slice(Math.min(n - 1, cut + gap));
  return (
    <g opacity={o}>
      <polyline points={polyline(left)} fill="none" stroke={colors.WARM} strokeWidth={2.5} />
      <polyline points={polyline(right)} fill="none" stroke={colors.NEGATIVE} strokeWidth={2.5} strokeDasharray="6 6" />
    </g>
  );
}

function HostWindow({ opacity, removeU, replaceU }: { opacity: number; removeU: number; replaceU: number }) {
  if (opacity <= 0.001) return null;
  const rm = clamp01(removeU);
  const rp = clamp01(replaceU);
  return (
    <g opacity={opacity}>
      <WindowFrame x={WIN.x} y={WIN.y} w={WIN.w} h={WIN.h} title="Finder · illustrative" reveal={1}>
        {ROWS.map((r, i) => {
          const isTarget = i === 1;
          // the removed row drops out of the list; the retained thread follows the object, not the slot
          const dy = isTarget ? ROW_DROP * ease.move(rm) : 0;
          const o = isTarget ? 1 - 0.55 * rm : 1;
          return (
            <g key={r.name}>
              <g transform={`translate(0, ${dy})`} opacity={o}>
                <rect x={16} y={r.dy - 24} width={WIN.w - 32} height={46} rx={8} fill={isTarget ? '#13213a' : '#0d1628'} stroke={isTarget && rm > 0.5 ? colors.WARM : PLATE_LINE} strokeWidth={isTarget && rm > 0.5 ? 1.5 : 1} strokeDasharray={isTarget && rm > 0.5 ? '6 5' : undefined} />
                <Label x={40} y={r.dy + 8} text={r.name} size={24} color={INK} />
                {isTarget && <Chip x={150} y={r.dy + 2} text={rm > 0.5 ? 'removed' : REF} size={18} color={rm > 0.5 ? colors.WARM : ACCENT_LIGHT} />}
              </g>
              {/* the look-alike slides into the empty slot: same text, different native object, no thread */}
              {isTarget && rp > 0 && (
                <g transform={`translate(${260 * (1 - ease.move(rp))}, 0)`} opacity={rp}>
                  <rect x={16} y={r.dy - 24} width={WIN.w - 32} height={46} rx={8} fill="#13213a" stroke={colors.NEGATIVE} strokeWidth={1.5} />
                  <Label x={40} y={r.dy + 8} text={r.name} size={24} color={INK} />
                  <Chip x={150} y={r.dy + 2} text="same text" size={18} color={colors.NEGATIVE} />
                </g>
              )}
            </g>
          );
        })}
      </WindowFrame>
    </g>
  );
}

/** everything inside the Mac socket, authored in its own 1280×720 space */
function HostInterior({ s }: { s: SceneState }) {
  const hu = clamp01(s.get(scene.hostU));
  if (hu <= 0) return null;
  const alive = s.get(scene.hostAlive);
  const a = envelopePose(s.get(scene.envA));
  const b = envelopePose(s.get(scene.envB));
  const d = envelopePose(s.get(scene.envD));
  const strayRaw = s.get(scene.strayU);
  const stray = strayPose(strayRaw);
  const altEp = clamp01(s.get(scene.altEpU));
  // once it has veered off, the stray envelope stays docked and fades with its endpoint
  const strayO = strayRaw <= 0 ? 0 : stray.o * clamp01(altEp + (1 - seg(strayRaw, 0.5, 0.6)));
  const rowDropDy = ROW_DROP * ease.move(clamp01(s.get(scene.rowRemoveU)));
  const brk = s.get(scene.threadBreak);
  const exch = clamp01(s.get(scene.exchangeU));
  const req = s.get(scene.reqU);
  const rep = s.get(scene.replyU);
  const tear = clamp01(s.get(scene.tearU));
  const reqX = lerp(-90, DOCK_X, ease.move(clamp01(req)));
  const reqO = req > 0 && req < 1 ? seg(req, 0, 0.08) : req >= 1 && rep <= 0 ? 1 : 0;
  const replyX = lerp(DOCK_X, -90, clamp01(rep));
  const replyVisible = rep > 0 && rep < 1 ? 1 - seg(tear, 0.4, 1) : 0;
  const clockRv = s.get(scene.clockReveal);
  const freshNote = s.get(scene.freshNoteU);
  const stale = s.get(scene.staleU);
  const identityNote = s.get(scene.identityNoteU);
  return (
    <g transform={`translate(${INTERIOR_ORIGIN.x}, ${INTERIOR_ORIGIN.y}) scale(${1 / K})`} opacity={hu}>
      {/* the host chamber: a plate large enough to cover the stage at full zoom */}
      <rect x={-400} y={-300} width={2080} height={1320} fill="#070b16" />
      <rect x={24} y={24} width={1232} height={672} rx={28} fill={PLATE} stroke={ACCENT_LIGHT} strokeWidth={2} opacity={0.9} />
      <Label x={640} y={78} text="MacOSAdapter · private command host" size={26} anchor="middle" color={ACCENT_LIGHT} />
      {exch > 0 && <Label x={640} y={118} text="a separate, illustrative exchange" size={24} anchor="middle" color={colors.MUTED} opacity={exch} />}

      {/* the lane short commands travel along */}
      <line x1={0} y1={LANE_Y} x2={DOCK_X + 20} y2={LANE_Y} stroke={PLATE_LINE} strokeWidth={2} strokeDasharray="10 10" />
      <Label x={40} y={LANE_Y - 70} text="short commands" size={24} color={colors.MUTED} />

      {/* threads from pinned objects to the rows they stand for */}
      {ROWS.map((_, i) => (
        <Thread key={i} i={i} alive={alive} broken={brk} dy={i === 1 ? rowDropDy : 0} />
      ))}
      <HostWindow opacity={s.get(scene.windowO)} removeU={s.get(scene.rowRemoveU)} replaceU={s.get(scene.rowReplaceU)} />
      <Spool alive={alive} collar={s.get(scene.collarU)} collarO={s.get(scene.collarO)} />

      {/* beat 2: two short invocations */}
      <Envelope x={a.x} y={a.y} opacity={a.o} talk={a.talk} label="invocation 1" />
      <Envelope x={b.x} y={b.y} opacity={b.o} talk={b.talk} label="invocation 2" />

      {/* beat 3: a different build goes to a different endpoint */}
      {altEp > 0 && (
        <g opacity={altEp}>
          <circle cx={ALT_ENDPOINT.x} cy={ALT_ENDPOINT.y} r={34} fill="#0b1326" stroke={colors.SECONDARY} strokeWidth={2} strokeDasharray="6 5" />
          <circle cx={ALT_ENDPOINT.x} cy={ALT_ENDPOINT.y} r={6} fill={colors.SECONDARY} />
          <Label x={ALT_ENDPOINT.x + 50} y={ALT_ENDPOINT.y + 8} text="a different endpoint" size={24} color={colors.SECONDARY} />
          <Label x={ALT_ENDPOINT.x + 50} y={ALT_ENDPOINT.y + 40} text="not this owner" size={24} color={colors.MUTED} />
        </g>
      )}
      <Envelope x={stray.x} y={stray.y} opacity={strayO} label="other build" stripe={colors.WARM} />

      {/* beat 4: the old ref arrives for the vanished row */}
      <Envelope x={d.x} y={d.y} opacity={d.o} talk={d.talk} label={REF} />
      <RefusalBadge x={SPOOL.x} y={SPOOL.y + SPOOL.r + 44} code="STALE_REF" u={s.get(scene.refuse4U)} size={20} />
      {identityNote > 0 && (
        <Label x={WIN.x + WIN.w / 2} y={WIN.y + ROWS[1].dy + ROW_DROP + 62} text="same text, different object" size={24} anchor="middle" color={colors.NEGATIVE} opacity={identityNote} />
      )}

      {/* beat 5: idle time, compressed */}
      <ClockArc cx={CLOCK.x} cy={CLOCK.y} r={CLOCK.r} u={s.get(scene.clockU)} reveal={clockRv} label="idle time, compressed" />
      {clockRv > 0 && (
        <Chip x={CLOCK.x} y={CLOCK.y + CLOCK.r + 74} text={s.get(scene.clockU) >= 0.999 ? '15 min idle · host exits' : 'idle…'} anchor="middle" size={18} color={colors.WARM} opacity={clockRv} />
      )}
      {stale > 0 && (
        <g opacity={clamp01(stale)}>
          <Chip x={150} y={LANE_Y + 70} text={REF} size={18} anchor="middle" />
          <RefusalBadge x={150} y={LANE_Y + 126} code="STALE_REF" u={stale} size={20} />
        </g>
      )}
      {freshNote > 0 && (
        <g opacity={clamp01(freshNote)}>
          <Label x={SPOOL.x} y={SPOOL.y + SPOOL.r + 60} text="owner gone → next action needs a fresh snapshot" size={24} anchor="middle" color={INK} />
          <Label x={SPOOL.x} y={SPOOL.y + SPOOL.r + 94} text="(stale because the owner exited, not a per-ref timer)" size={24} anchor="middle" color={colors.MUTED} />
        </g>
      )}

      {/* beat 6: one request, a torn reply, no replay */}
      <Envelope x={reqX} y={LANE_Y} opacity={reqO * exch} label="request" talk={window01(req, 0.9, 1.2, 0.1)} />
      {replyVisible > 0 && (
        <g opacity={replyVisible}>
          {/* the receipt, torn into two halves that drift apart */}
          <g transform={`translate(${replyX - 10 * tear}, ${LANE_Y - 6 * tear}) rotate(${-8 * tear})`}>
            <path d="M -60 -22 L 4 -22 L -6 -8 L 6 6 L -4 22 L -60 22 Z" fill={PLATE} stroke={colors.POSITIVE} strokeWidth={2} />
          </g>
          <g transform={`translate(${replyX + 10 * tear}, ${LANE_Y + 6 * tear}) rotate(${8 * tear})`}>
            <path d="M 4 -22 L 60 -22 L 60 22 L -4 22 L 6 6 L -6 -8 Z" fill={PLATE} stroke={colors.POSITIVE} strokeWidth={2} />
          </g>
          <text x={replyX} y={LANE_Y - 36} textAnchor="middle" fill={colors.POSITIVE} fontSize={18} fontFamily={MONO} fontWeight={700}>
            reply
          </text>
        </g>
      )}
      {s.get(scene.uncertainU) > 0 && (
        <g opacity={clamp01(s.get(scene.uncertainU))}>
          <Chip x={170} y={LANE_Y + 80} text="delivery_uncertain" size={18} anchor="middle" color={colors.WARM} />
          <Label x={170} y={LANE_Y + 126} text="may already have run" size={24} anchor="middle" color={INK} />
          <Label x={170} y={LANE_Y + 160} text="no automatic replay" size={24} anchor="middle" color={colors.MUTED} />
        </g>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const stageO = clamp01(s.get(scene.stageO));
  const coreU = clamp01(s.get(scene.coreU));
  const socketsU = clamp01(s.get(scene.socketsU));
  const socketsDim = clamp01(s.get(scene.socketsDim));
  const keyU = s.get(scene.keyU);
  const key = keyPose(keyU);
  const keyO = clamp01(s.get(scene.keyO));
  const diffU = s.get(scene.diffU);
  const diffIdx = diffU >= 0 ? Math.min(2, Math.floor(diffU)) : -1;
  const diffIn = diffIdx >= 0 ? window01(diffU - diffIdx, 0, 1, 0.12) : 0;
  const docked = keyU >= 3 ? 1 : (keyU % 1 > 0.97 ? 1 : 0);

  const foundU = clamp01(s.get(scene.foundU));
  const deskU = clamp01(s.get(scene.deskU));
  const badgeU = clamp01(s.get(scene.badgeU));
  const deskO = clamp01(s.get(scene.deskO));

  const shutterU = clamp01(s.get(scene.shutterU));
  const refU = s.get(scene.refU);
  const refX = lerp(AGENT_X + 40, SHUTTERS[0].x - 50, ease.move(clamp01(refU)));
  const shutRefused = clamp01(s.get(scene.shutRefused));
  const noActionU = clamp01(s.get(scene.noActionU));
  const lane3U = clamp01(s.get(scene.lane3U));
  const receiptU = s.get(scene.receiptU);
  // receipt: drop from the shutter to the lane, then run left to the agent
  const rDrop = seg(receiptU, 0, 0.3);
  const rRun = seg(receiptU, 0.3, 1);
  const receiptPos = { x: lerp(SHUTTERS[0].x - 50, AGENT_X + 40, ease.move(rRun)), y: lerp(SHUTTER_Y, LANE3_Y, ease.move(rDrop)) };
  const receiptO = receiptU > 0 && receiptU < 1 ? 1 : receiptU >= 1 ? 1 : 0;

  const loopU = clamp01(s.get(scene.loopU));
  const closeU = clamp01(s.get(scene.closeU));
  const platformO = clamp01(s.get(scene.platformO));

  return (
    <Camera {...s.get(scene.cam)}>
      <g opacity={stageO}>
       {/* the platform scene (core, sockets, key) retires before the refusal beat so its names stay off the lane */}
       <g opacity={platformO}>
        {/* shared core */}
        {coreU > 0 && (
          <g opacity={coreU}>
            <rect x={CORE.x} y={CORE.y} width={CORE.w} height={CORE.h} rx={16} fill={PLATE} stroke={ACCENT_LIGHT} strokeWidth={2} />
            <Label x={CORE.x + 24} y={CORE.y + 41} text="shared core" size={26} color={ACCENT_LIGHT} />
            <Chip x={CORE.x + 250} y={CORE.y + 36} text="observation" size={18} />
            <Chip x={CORE.x + 420} y={CORE.y + 36} text="action" size={18} />
            <Chip x={CORE.x + 540} y={CORE.y + 36} text="input" size={18} />
            <Chip x={CORE.x + 650} y={CORE.y + 36} text="system" size={18} />
            {/* the key hangs from the core until it docks */}
            <line x1={KEY_HOME.x} y1={CORE.y + CORE.h} x2={KEY_HOME.x} y2={KEY_HOME.y - KEY_H / 2} stroke={PLATE_LINE} strokeWidth={2} opacity={1 - seg(keyU, 0, 0.3)} />
          </g>
        )}

        {/* three platform sockets */}
        {SOCKETS.map((_, i) => {
          const lit = diffIdx >= 0 && DIFFS[diffIdx].socket === i ? diffIn : 0;
          return <Socket key={i} i={i} reveal={seg(socketsU, i * 0.2, i * 0.2 + 0.6)} lit={lit} dim={socketsDim} />;
        })}
        {diffIdx >= 0 && (
          <g opacity={diffIn * (1 - socketsDim)}>
            <Chip x={SOCKET_X[DIFFS[diffIdx].socket]} y={SOCKET_Y + SOCKET_H / 2 + 86} text={DIFFS[diffIdx].text} anchor="middle" size={20} color={colors.WARM} />
          </g>
        )}
        <CommandKey x={key.x} y={key.y} opacity={keyO * coreU * (1 - socketsDim)} docked={docked} />
       </g>

        {/* beat 7: headless is a policy on a real desktop; Linux needs the session underneath */}
        {foundU > 0 && (
          <g opacity={foundU * deskO}>
            <rect x={SLAB.x} y={SLAB.y} width={SLAB.w} height={SLAB.h} rx={12} fill="#0b1326" stroke={colors.POSITIVE} strokeWidth={2} />
            <Label x={SLAB.x + SLAB.w / 2} y={SLAB.y + 30} text="user's graphical session" size={24} anchor="middle" color={colors.POSITIVE} />
            <Label x={SLAB.x + SLAB.w / 2} y={SLAB.y + 60} text="+ accessibility service" size={24} anchor="middle" color={colors.POSITIVE} />
            <Label x={SLAB.x + SLAB.w / 2} y={SLAB.y + SLAB.h + 36} text="Linux · no virtual desktop is created" size={24} anchor="middle" color={colors.MUTED} />
            {/* struts: the desktop stands on the session */}
            {[SLAB.x + 60, SLAB.x + SLAB.w - 60].map((x) => (
              <line key={x} x1={x} y1={DESK.y + DESK.h} x2={x} y2={SLAB.y} stroke={colors.POSITIVE} strokeWidth={3} opacity={deskU} />
            ))}
          </g>
        )}
        {deskU > 0 && (
          <g opacity={deskO}>
            <WindowFrame x={DESK.x} y={DESK.y} w={DESK.w} h={DESK.h} title="existing desktop · illustrative" reveal={deskU}>
              {[0, 1, 2].map((i) => (
                <rect key={i} x={20} y={56 + i * 40} width={DESK.w - 40} height={28} rx={6} fill="#0d1628" stroke={PLATE_LINE} strokeWidth={1} />
              ))}
            </WindowFrame>
            {badgeU > 0 && (
              <g transform={`translate(${DESK.x + DESK.w / 2}, ${DESK.y + DESK.h / 2 + 10}) scale(${1 + 0.1 * Math.sin(Math.PI * badgeU)})`} opacity={badgeU}>
                <rect x={-150} y={-44} width={300} height={88} rx={14} fill="#1a1530" stroke={colors.SECONDARY} strokeWidth={3} />
                <Label x={0} y={-8} text="headless policy" size={26} anchor="middle" color={colors.SECONDARY} />
                <Label x={0} y={26} text="limits side effects" size={24} anchor="middle" color={INK} />
              </g>
            )}
          </g>
        )}

        {/* beat 8: a valid ref, the shutters, and chapter three's delivery lane */}
        {shutterU > 0 && (
          <g opacity={shutterU}>
            <Label x={AGENT_X} y={SHUTTER_Y + 8} text="the agent" size={24} anchor="middle" color={colors.WARM} />
            <line x1={AGENT_X + 60} y1={SHUTTER_Y} x2={SHUTTERS[0].x - 20} y2={SHUTTER_Y} stroke={PLATE_LINE} strokeWidth={2} strokeDasharray="10 10" />
            {SHUTTERS.map((sh) => (
              <Shutter key={sh.label} x={sh.x} y={SHUTTER_Y} h={120} open={0} label={sh.label} refused={shutRefused} />
            ))}
            <Label x={SHUTTERS[1].x + 36} y={SHUTTER_Y - 10} text="the adapter" size={24} color={ACCENT_LIGHT} />
            {noActionU > 0 && <Label x={SHUTTERS[1].x + 36} y={SHUTTER_Y + 26} text="no action happened" size={24} color={colors.NEGATIVE} opacity={noActionU} />}
            {refU > 0 && receiptU <= 0 && (
              <g>
                <circle cx={refX} cy={SHUTTER_Y} r={10} fill={ACCENT_LIGHT} />
                <Chip x={refX} y={SHUTTER_Y - 30} text={REF} anchor="middle" size={18} />
                <Label x={refX} y={SHUTTER_Y + 44} text="a valid ref" size={24} anchor="middle" color={colors.MUTED} />
              </g>
            )}
            {lane3U > 0 && (
              <g opacity={lane3U}>
                <line x1={SHUTTERS[0].x - 50} y1={LANE3_Y} x2={lerp(SHUTTERS[0].x - 50, AGENT_X + 40, ease.draw(lane3U))} y2={LANE3_Y} stroke={ACCENT_LIGHT} strokeWidth={3} />
              </g>
            )}
            {receiptO > 0 && (
              <g opacity={receiptO}>
                <circle cx={receiptPos.x} cy={receiptPos.y} r={10} fill={colors.NEGATIVE} />
                <Chip x={receiptPos.x} y={receiptPos.y - 30} text="refusal receipt" anchor="middle" size={18} color={colors.NEGATIVE} />
              </g>
            )}
          </g>
        )}
      </g>

      {/* beats 2–6: inside the Mac socket (drawn after the stage so it covers it at full zoom) */}
      <HostInterior s={s} />

      {/* beat 9: the loop, with identity and policy gates inside act */}
      {loopU > 0 && (
        <g opacity={1 - 0.6 * closeU}>
          <AgentLoop cx={LOOP.cx} cy={LOOP.cy} r={LOOP.r} reveal={loopU} tokenU={s.get(scene.lapU)} showGates={s.get(scene.gatesU)} toolLabel="none" tokenLabel={REF} />
          {/* the tool's label sits in clear space below the act dock, away from the gates */}
          <Label x={LOOP.cx + LOOP.r + 60} y={LOOP.cy + LOOP.r - 20} text="the tool" size={24} color={ACCENT_LIGHT} anchor="end" opacity={seg(loopU, 0.7, 1)} />
        </g>
      )}
      <OpaqueStrip x={300} y={290} w={680} h={140} opacity={closeU}>
        <Label x={640} y={350} text="Observe. Resolve. Act. Observe." size={36} anchor="middle" color={INK} weight={700} />
        <Label x={640} y={394} text="the loop stays with the agent" size={24} anchor="middle" color={colors.MUTED} />
      </OpaqueStrip>
    </Camera>
  );
}

export const vizScene = () => scene;
