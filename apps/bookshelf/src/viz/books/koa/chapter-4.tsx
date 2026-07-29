// One Object, Four Handles
//
// Backing files: lib/application.js createContext() — three Object.create
// stamps per request (this.context / this.request / this.response), the
// cross-wiring (context.app, ctx.req, ctx.res, request.ctx, response.request,
// request.response), ctx.state = {} and originalUrl. lib/context.js — the
// delegate(proto, 'request') / delegate(proto, 'response') lists.
// lib/response.js — the body setter flips status to 200.
// __tests__/application/request.test.js — app.request.message = 'hello'
// merges onto every future request via the shared prototype.
//
// Centerpiece: the stamping press (prototypes above, fresh instances pressed
// out below) and the delegation switchboard — property chips on ctx light
// wires left to request or right to response.
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
// Layout
// ---------------------------------------------------------------------------

const PROTO_Y = 112;
const INST_Y = 292;
const RAW_Y = 468;
const COLS = { request: 350, context: 640, response: 930 } as const;

// the delegation switchboard — real names from lib/context.js delegate lists
const LEFT_CHIPS = ['ctx.path', 'ctx.query', 'ctx.method', 'ctx.ip'] as const;
const RIGHT_CHIPS = ['ctx.body', 'ctx.status', 'ctx.set', 'ctx.redirect'] as const;
const CHIP_Y0 = 388;
const CHIP_DY = 46;

// cross-wires drawn during the mesh beat: [x1, y1, x2, y2, label]
const WIRES: ReadonlyArray<readonly [number, number, number, number, string]> = [
  [COLS.context - 60, INST_Y + 26, COLS.request + 60, RAW_Y - 20, 'ctx.req'],
  [COLS.context + 60, INST_Y + 26, COLS.response - 60, RAW_Y - 20, 'ctx.res'],
  [COLS.request, INST_Y + 28, COLS.request, RAW_Y - 24, 'request.req'],
  [COLS.response, INST_Y + 28, COLS.response, RAW_Y - 24, 'response.res'],
  [COLS.request + 88, INST_Y - 8, COLS.context - 66, INST_Y - 8, 'request.ctx'],
  [COLS.context + 66, INST_Y + 8, COLS.response - 88, INST_Y + 8, 'response.request'],
] as const;

// camera marks
const CAM_PRESS: CameraState = { x: 640, y: 230, k: 1.3 };
const CAM_MESH: CameraState = { x: 640, y: 350, k: 1.12 };
const CAM_BOARD: CameraState = { x: 640, y: 380, k: 1.28 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  rawInU: ChannelRef<number>; // req/res plates slide in
  protosU: ChannelRef<number>;
  pressU: ChannelRef<number>; // 0..3 — instance i stamps at u > i
  meshU: ChannelRef<number>; // 0..6 wires
  stateU: ChannelRef<number>;
  meshDim: ChannelRef<number>; // fade the wiring for the switchboard
  chipsL: ChannelRef<number>; // 0..4
  chipsR: ChannelRef<number>; // 0..4
  glowL: ChannelRef<number>;
  glowR: ChannelRef<number>;
  assignU: ChannelRef<number>; // ctx.body packet rides the wire
  statusU: ChannelRef<number>; // 200 pops on the response card
  twoU: ChannelRef<number>; // the two-requests miniature
  msgU: ChannelRef<number>; // the prototype-decoration chip
  stageDim: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_PRESS, cameraInterp);
  const rawInU = tl.channel('rawInU', 0);
  const protosU = tl.channel('protosU', 0);
  const pressU = tl.channel('pressU', 0);
  const meshU = tl.channel('meshU', 0);
  const stateU = tl.channel('stateU', 0);
  const meshDim = tl.channel('meshDim', 1);
  const chipsL = tl.channel('chipsL', 0);
  const chipsR = tl.channel('chipsR', 0);
  const glowL = tl.channel('glowL', 0);
  const glowR = tl.channel('glowR', 0);
  const assignU = tl.channel('assignU', 0);
  const statusU = tl.channel('statusU', 0);
  const twoU = tl.channel('twoU', 0);
  const msgU = tl.channel('msgU', 0);
  const stageDim = tl.channel('stageDim', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · two raw objects —
  tl.caption({
    at: 0.5,
    dur: 6.2,
    text: "Node gives every request two raw objects: an incoming message and a server response. Koa's first move is to wrap them in something friendlier — fresh, every single time.",
  });
  tl.tween(rawInU, 1, { at: 0.7, dur: 1.6, ease: ease.move });
  tl.hold(6.7, 0.5);

  // — Beat 2 · the stamping press —
  tl.caption({
    at: 7.2,
    dur: 6.6,
    text: 'The factory is called create context. It stamps three new objects per request, each created off a prototype the app has held since boot: a context, a request, and a response.',
  });
  tl.tween(protosU, 1, { at: 7.4, dur: 1.0, ease: ease.enter });
  tl.tween(pressU, 3, { at: 8.8, dur: 2.8, ease: ease.move });
  tl.hold(13.8, 0.5);

  // — Beat 3 · Object.create is nearly free —
  tl.caption({
    at: 14.3,
    dur: 6,
    text: 'These stamps cost almost nothing. Nothing is copied — each fresh object is an empty shell whose lookups fall through to the shared prototype underneath.',
  });
  tl.hold(20.3, 0.5);

  // — Beat 4 · the wiring —
  tl.caption({
    at: 20.8,
    dur: 6.4,
    text: 'Then comes the wiring. The context gets the app and both raw objects. The request and response wrappers get pointers to each other, and back to the context.',
  });
  tl.tween(cam, CAM_MESH, { at: 21.0, dur: 1.6, ease: ease.move });
  tl.tween(meshU, 6, { at: 21.6, dur: 3.4, ease: ease.move });
  tl.hold(27.2, 0.5);

  // — Beat 5 · one hop from anywhere —
  tl.caption({
    at: 27.7,
    dur: 5.2,
    text: 'By the time your middleware sees it, this little web means any piece can reach any other in one hop. You hold one handle: the context, or just ctx.',
  });
  tl.hold(32.9, 0.5);

  // — Beat 6 · state and the original address —
  tl.caption({
    at: 33.4,
    dur: 6.4,
    text: 'The context also carries a blank object called state — the recommended shelf for anything your middleware wants to pass downstream — and a copy of the original URL, saved before anyone rewrites it.',
  });
  tl.tween(stateU, 1, { at: 34.2, dur: 0.9, ease: ease.enter });
  tl.hold(39.8, 0.5);

  // — Beat 7 · delegation —
  tl.caption({
    at: 40.3,
    dur: 5,
    text: "But ctx has a second trick: delegation. Most of what you touch on it doesn't live there at all.",
  });
  tl.tween(cam, CAM_BOARD, { at: 40.5, dur: 1.6, ease: ease.move });
  tl.tween(meshDim, 0.15, { at: 40.7, dur: 1.2, ease: ease.move });
  tl.hold(45.3, 0.4);

  // — Beat 8 · left side: the request —
  tl.caption({
    at: 45.7,
    dur: 5.8,
    text: 'Ask for the path, the query, or the method, and the context quietly forwards to its request wrapper. Left side of the switchboard.',
  });
  tl.tween(chipsL, 4, { at: 46.1, dur: 2.2, ease: ease.move });
  tl.tween(glowL, 1, { at: 48.6, dur: 1.4, ease: ease.draw });
  tl.hold(51.5, 0.4);

  // — Beat 9 · right side: the response —
  tl.caption({
    at: 51.9,
    dur: 5.4,
    text: 'Set the body, the status, or a header, and it forwards to the response wrapper instead. Right side.',
  });
  tl.tween(chipsR, 4, { at: 52.3, dur: 2.2, ease: ease.move });
  tl.tween(glowR, 1, { at: 54.6, dur: 1.4, ease: ease.draw });
  tl.hold(57.3, 0.4);

  // — Beat 10 · the hello assignment rides a wire —
  tl.caption({
    at: 57.7,
    dur: 6.4,
    text: 'So the one liner from chapter one — setting the body to hello — actually rides a wire: context to response, where the setter also flips the status to two hundred.',
  });
  tl.tween(assignU, 1, { at: 58.7, dur: 1.8, ease: ease.move });
  tl.tween(statusU, 1, { at: 60.7, dur: 0.6, ease: ease.pop });
  tl.hold(64.1, 0.5);

  // — Beat 11 · two requests, shared prototypes —
  tl.caption({
    at: 64.6,
    dur: 7.2,
    text: "Two requests get two fresh webs, so they never interfere. But decorate the app level prototype once, and every future context inherits the new tool instantly — Koa's tests prove it with a merged property.",
  });
  tl.tween(cam, CAM_WIDE, { at: 64.8, dur: 1.8, ease: ease.move });
  tl.tween(twoU, 1, { at: 65.6, dur: 1.4, ease: ease.move });
  tl.tween(msgU, 1, { at: 68.2, dur: 0.8, ease: ease.enter });
  tl.hold(71.8, 0.5);

  // — Beat 12 · payoff —
  tl.caption({
    at: 72.3,
    dur: 5.6,
    text: 'One object, four handles: the context, its two wrappers, and the raw pair underneath. Next, we break something — and watch the onion save us.',
  });
  tl.tween(stageDim, 0.15, { at: 72.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 73.6, dur: 0.9, ease: ease.enter });
  tl.hold(77.9, 1.6);

  return {
    tl,
    cam,
    rawInU,
    protosU,
    pressU,
    meshU,
    stateU,
    meshDim,
    chipsL,
    chipsR,
    glowL,
    glowR,
    assignU,
    statusU,
    twoU,
    msgU,
    stageDim,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function Card({ x, y, w = 176, h = 54, label, sub, color, u, mono = true }: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  label: string;
  sub?: string;
  color: string;
  u: number;
  mono?: boolean;
}) {
  if (u <= 0) return null;
  return (
    <g opacity={u} transform={`translate(${x}, ${y})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={9} fill={colors.PANEL} stroke={color} strokeWidth={1.5} />
      <text x={0} y={sub ? -3 : 5} textAnchor="middle" fill={color} fontSize={14.5} fontFamily={mono ? 'monospace' : undefined} fontWeight={700}>
        {label}
      </text>
      {sub && (
        <text x={0} y={16} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace">
          {sub}
        </text>
      )}
    </g>
  );
}

// a wire from a switchboard chip to a card, as a quadratic curve
function chipWire(cx: number, cy: number, tx: number, ty: number): string {
  const mx = (cx + tx) / 2;
  return `M ${cx} ${cy} Q ${mx} ${cy + 26} ${tx} ${ty}`;
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const rawInU = s.get(scene.rawInU);
  const protosU = s.get(scene.protosU);
  const pressU = s.get(scene.pressU);
  const meshU = s.get(scene.meshU);
  const stateU = s.get(scene.stateU);
  const meshDim = s.get(scene.meshDim);
  const chipsL = s.get(scene.chipsL);
  const chipsR = s.get(scene.chipsR);
  const glowL = s.get(scene.glowL);
  const glowR = s.get(scene.glowR);
  const assignU = s.get(scene.assignU);
  const statusU = s.get(scene.statusU);
  const twoU = s.get(scene.twoU);
  const msgU = s.get(scene.msgU);
  const stageDim = s.get(scene.stageDim);
  const closeU = s.get(scene.closeU);

  // instances press down out of their prototypes
  const inst = (i: number): number => clamp01(pressU - i);
  const instY = (i: number): number => lerp(PROTO_Y + 40, INST_Y, inst(i));

  // the ctx.body packet position along its wire (chip 0 on the right column)
  const chipRX = COLS.context + 118;
  const chipR0Y = CHIP_Y0;
  const px = lerp(chipRX, COLS.response - 20, assignU);
  const py = chipR0Y + 26 * Math.sin(Math.PI * assignU) + (INST_Y + 10 - chipR0Y) * assignU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- raw plates ---- */}
        <Card
          x={lerp(-140, COLS.request, rawInU)}
          y={RAW_Y}
          label="req"
          sub="IncomingMessage"
          color={colors.MUTED}
          u={rawInU * stageDim * meshDim}
        />
        <Card
          x={lerp(STAGE_W + 140, COLS.response, rawInU)}
          y={RAW_Y}
          label="res"
          sub="ServerResponse"
          color={colors.MUTED}
          u={rawInU * stageDim * meshDim}
        />

        {/* ---- prototypes ---- */}
        <g opacity={protosU * stageDim}>
          <text x={COLS.context} y={PROTO_Y - 52} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontStyle="italic">
            held by the app since boot — one set, shared by every request
          </text>
        </g>
        <Card x={COLS.request} y={PROTO_Y} label="this.request" color={colors.SECONDARY} u={protosU * stageDim} />
        <Card x={COLS.context} y={PROTO_Y} label="this.context" color={colors.ACCENT} u={protosU * stageDim} />
        <Card x={COLS.response} y={PROTO_Y} label="this.response" color={colors.TEAL} u={protosU * stageDim} />

        {/* ---- the press: three Object.create stamps ---- */}
        {[0, 1, 2].map((i) => {
          const u = inst(i);
          if (u <= 0) return null;
          const x = i === 0 ? COLS.context : i === 1 ? COLS.request : COLS.response;
          const color = i === 0 ? colors.ACCENT : i === 1 ? colors.SECONDARY : colors.TEAL;
          const label = i === 0 ? 'ctx' : i === 1 ? 'request' : 'response';
          return (
            <g key={i}>
              <line x1={x} y1={PROTO_Y + 28} x2={x} y2={instY(i) - 30} stroke={color} strokeWidth={1.2} strokeDasharray="3 5" opacity={0.5 * u * stageDim} />
              <Card x={x} y={instY(i)} label={label} sub="Object.create(proto)" color={color} u={u * stageDim} />
            </g>
          );
        })}

        {/* ---- the cross-wiring mesh ---- */}
        {WIRES.map(([x1, y1, x2, y2, label], i) => {
          const u = clamp01(meshU - i);
          if (u <= 0) return null;
          return (
            <g key={label} opacity={u * meshDim * stageDim}>
              <line x1={x1} y1={y1} x2={lerp(x1, x2, u)} y2={lerp(y1, y2, u)} stroke={colors.TEXT} strokeWidth={1.4} opacity={0.55} />
              <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 7} textAnchor="middle" fill={colors.MUTED} fontSize={10.5} fontFamily="monospace" opacity={u}>
                {label}
              </text>
            </g>
          );
        })}

        {/* ---- state tray + originalUrl ---- */}
        {stateU > 0 && (
          <g opacity={stateU * stageDim} transform={`translate(${COLS.context}, ${INST_Y + 62})`}>
            <rect x={-108} y={-16} width={216} height={32} rx={7} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.2} />
            <text x={0} y={5} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily="monospace">
              state: {'{}'} · originalUrl
            </text>
          </g>
        )}

        {/* ---- the delegation switchboard ---- */}
        {LEFT_CHIPS.map((label, i) => {
          const u = clamp01(chipsL - i);
          if (u <= 0) return null;
          const cy = CHIP_Y0 + i * CHIP_DY;
          const cx = COLS.context - 118;
          return (
            <g key={label} opacity={u * stageDim}>
              <path d={chipWire(cx - 52, cy, COLS.request + 30, INST_Y + 24)} fill="none" stroke={colors.SECONDARY} strokeWidth={1.6} opacity={0.25 + 0.6 * glowL} />
              <rect x={cx - 60} y={cy - 14} width={120} height={28} rx={7} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.2} />
              <text x={cx} y={cy + 4.5} textAnchor="middle" fill={colors.SECONDARY} fontSize={12.5} fontFamily="monospace">
                {label}
              </text>
            </g>
          );
        })}
        {RIGHT_CHIPS.map((label, i) => {
          const u = clamp01(chipsR - i);
          if (u <= 0) return null;
          const cy = CHIP_Y0 + i * CHIP_DY;
          const cx = COLS.context + 118;
          return (
            <g key={label} opacity={u * stageDim}>
              <path d={chipWire(cx + 52, cy, COLS.response - 30, INST_Y + 24)} fill="none" stroke={colors.TEAL} strokeWidth={1.6} opacity={0.25 + 0.6 * glowR} />
              <rect x={cx - 60} y={cy - 14} width={120} height={28} rx={7} fill={colors.PANEL} stroke={colors.TEAL} strokeWidth={1.2} />
              <text x={cx} y={cy + 4.5} textAnchor="middle" fill={colors.TEAL} fontSize={12.5} fontFamily="monospace">
                {label}
              </text>
            </g>
          );
        })}
        {(chipsL > 0 || chipsR > 0) && (
          <text x={COLS.context} y={CHIP_Y0 + 3 * CHIP_DY + 40} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily="monospace" opacity={Math.max(clamp01(chipsL), clamp01(chipsR)) * stageDim}>
            delegate(proto, 'request') · delegate(proto, 'response')
          </text>
        )}

        {/* ---- the ctx.body assignment riding its wire ---- */}
        {assignU > 0 && assignU < 1 && (
          <g>
            <circle cx={px} cy={py} r={8} fill={colors.WARM} />
            <text x={px} y={py - 16} textAnchor="middle" fill={colors.WARM} fontSize={11.5} fontFamily="monospace">
              ctx.body = 'Hello Koa'
            </text>
          </g>
        )}
        {statusU > 0 && (
          <g opacity={statusU * stageDim} transform={`translate(${COLS.response}, ${INST_Y + 58})`}>
            <rect x={-72} y={-15} width={144} height={30} rx={7} fill={colors.POSITIVE} opacity={0.18} />
            <text x={0} y={5} textAnchor="middle" fill={colors.POSITIVE} fontSize={12.5} fontFamily="monospace" fontWeight={700}>
              status: 404 → 200
            </text>
          </g>
        )}

        {/* ---- two requests, two webs ---- */}
        {twoU > 0 && (
          <g opacity={twoU * stageDim}>
            {[0, 1].map((k) => {
              const bx = k === 0 ? 250 : 1030;
              return (
                <g key={k} transform={`translate(${bx}, ${588})`}>
                  <rect x={-100} y={-26} width={200} height={52} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
                  <circle cx={-60} cy={0} r={9} fill="none" stroke={colors.ACCENT} strokeWidth={1.6} />
                  <circle cx={0} cy={0} r={9} fill="none" stroke={colors.SECONDARY} strokeWidth={1.6} />
                  <circle cx={60} cy={0} r={9} fill="none" stroke={colors.TEAL} strokeWidth={1.6} />
                  <line x1={-51} y1={0} x2={-9} y2={0} stroke={colors.GRID} strokeWidth={1.4} />
                  <line x1={9} y1={0} x2={51} y2={0} stroke={colors.GRID} strokeWidth={1.4} />
                  <text x={0} y={-36} textAnchor="middle" fill={colors.MUTED} fontSize={11.5}>
                    request {k + 1} — its own web
                  </text>
                </g>
              );
            })}
          </g>
        )}
        {msgU > 0 && (
          <g opacity={msgU * stageDim} transform={`translate(${COLS.context}, ${588})`}>
            <rect x={-150} y={-16} width={300} height={32} rx={7} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.2} />
            <text x={0} y={5} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily="monospace">
              app.request.message = 'hello' → both
            </text>
          </g>
        )}

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={370} y={255} width={540} height={112} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={640} y={301} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              one object · four handles
            </text>
            <text x={640} y={337} textAnchor="middle" fill={colors.ACCENT} fontSize={21} fontWeight={700}>
              ctx · request · response · req + res
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
