// Chapter 5 — The wire runs backwards: server actions
//
// Grounding: fixtures/flight/src/actions.js ('use server'; export async
// function increment(n) { return n + 1 }) ·
// react-server-dom-webpack/src/ReactFlightWebpackNodeRegister.js ('use
// server' modules get registerServerReference(exports[key], moduleId, key)) ·
// ReactFlightWebpackReferences.js (ServerReference = {$$typeof:
// Symbol.for('react.server.reference'), $$id, $$bound: null}) ·
// ReactFlightServer.js serializeServerReference → '$h'+hex with outlined
// {id, bound} metadata · react-client/src/ReactFlightReplyClient.js
// createBoundServerReference (the stub calls callServer(id, args)) and
// processReply (args re-encoded with the same '$' rules; throws "Client
// Functions cannot be passed directly to Server Functions. Only Functions
// passed from the Server can be passed back again.") ·
// react-server/src/ReactFlightReplyServer.js decodeReply ·
// ReactFlightActionServer.js decodeAction (progressive enhancement via the
// '$ACTION_ID_' form field name; bound args via '$ACTION_REF_').
//
// Centerpiece: THE MIRRORED ROUND TRIP — the same stage as chapter one, but
// the packet loop runs right-to-left and back, through a reversed customs
// gate; closes with the whole-book recap on a quiet stage.
import type { ReactNode } from 'react';
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
import type { CameraState, SceneState } from '../../core';
import { Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const win = (p: number, n: number, i: number, span: number): number =>
  clamp01((p * (n + span) - i) / span);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const SERVER = { x: 56, y: 116, w: 424, h: 430 } as const;
const CLIENT = { x: 800, y: 116, w: 424, h: 430 } as const;
const WIRE_Y = 330;
const GATE_X = 640;

const ACTIONS = { x: 88, y: 158, w: 360, h: 148 } as const;
const DECODE = { x: 88, y: 348, w: 360, h: 150 } as const;
const BUTTON = { x: 838, y: 168, w: 200, h: 54 } as const;
const STUB = { x: 838, y: 258, w: 350, h: 104 } as const;
const FORM = { x: 838, y: 396, w: 350, h: 112 } as const;

const CLIENTFN_ERR = [
  'Client Functions cannot be passed directly',
  'to Server Functions. Only Functions passed',
  'from the Server can be passed back again.',
];

// camera marks
const CAM_OPEN: CameraState = { x: 640, y: 340, k: 1.05 };
const CAM_SERVER: CameraState = { x: 330, y: 300, k: 1.32 };
const CAM_CLIENT: CameraState = { x: 960, y: 300, k: 1.3 };
const CAM_GATE: CameraState = { x: 640, y: 320, k: 1.35 };
const CAM_FORM: CameraState = { x: 900, y: 400, k: 1.28 };
const CAM_WIDE: CameraState = CAMERA_HOME;

// the recap: the book's four machines
const RECAP = [
  { t: 'the tape', s: 'rows describe the page', dir: '→' },
  { t: 'the gate', s: 'data by value, code by reference', dir: '→' },
  { t: 'the chunk table', s: 'promises wake up as pixels', dir: '→' },
  { t: 'the call back', s: 'references dial the server', dir: '←' },
] as const;

// ---------------------------------------------------------------------------
// Timeline (~104s, ten beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_OPEN, cameraInterp);

  const stageU = tl.channel('stageU', 0); // zones + wire
  const flipU = tl.channel('flipU', 0); // the direction arrow flips
  const actU = tl.channel('actU', 0); // actions.js card
  const stampU = tl.channel('stampU', 0); // registerServerReference stamp
  const refU = tl.channel('refU', 0); // '$h4' crosses to the client
  const stubU = tl.channel('stubU', 0); // the client stub card
  const clickU = tl.channel('clickU', 0); // button click ripple
  const callU = tl.channel('callU', 0); // the call packet travels left
  const gateU = tl.channel('gateU', 0); // reverse gate + args pass
  const bounceU = tl.channel('bounceU', 0); // client fn refused
  const runU = tl.channel('runU', 0); // decode + increment runs
  const backU = tl.channel('backU', 0); // response tape rides back
  const formU = tl.channel('formU', 0); // no-scripting form path
  const dimU = tl.channel('dimU', 0);
  const recapU = tl.channel('recapU', 0);
  const endU = tl.channel('endU', 0);

  // — beat 1 · the mirror —
  tl.caption({
    at: 0.5,
    dur: 8.2,
    text: 'One direction remains. Everything so far flowed from server to client — a page described, shipped, and woken up. But interfaces talk back. Clicks want consequences on the server.',
  });
  tl.tween(stageU, 1, { at: 0.8, dur: 1.5, ease: ease.draw });
  tl.tween(flipU, 1, { at: 5.2, dur: 1.4, ease: ease.move });
  tl.hold(8.7, 0.5);

  // — beat 2 · use server seals the function —
  tl.caption({
    at: 9.2,
    dur: 8.4,
    text: 'In the fixture sits a file of actions that opens with the directive use server. Its increment function never leaves the server. What crosses instead is a stamped reference — a name, not a body.',
  });
  tl.tween(cam, CAM_SERVER, { at: 9.4, dur: 1.3, ease: ease.move });
  tl.tween(actU, 1, { at: 9.9, dur: 1.2, ease: ease.enter });
  tl.tween(stampU, 1, { at: 13.4, dur: 1.4, ease: ease.pop });
  tl.hold(17.6, 0.5);

  // — beat 3 · the client holds a phone number —
  tl.caption({
    at: 18.1,
    dur: 8.0,
    text: 'The client receives dollar h — a phone number for a function. Calling the stub does exactly one thing: it phones the server with that id and whatever arguments you hand it.',
  });
  tl.tween(refU, 1, { at: 18.4, dur: 2.2, ease: ease.move });
  tl.tween(cam, CAM_CLIENT, { at: 19.4, dur: 1.4, ease: ease.move });
  tl.tween(stubU, 1, { at: 21.0, dur: 1.2, ease: ease.enter });
  tl.hold(26.1, 0.5);

  // — beat 4 · the click dials —
  tl.caption({
    at: 26.6,
    dur: 7.8,
    text: 'Click the counter. The stub gathers its arguments and dials. What leaves the browser is tiny — an id and a payload. No route handler, no endpoint you wrote by hand.',
  });
  tl.tween(clickU, 1, { at: 27.2, dur: 1.0, ease: ease.pop });
  tl.tween(cam, CAM_GATE, { at: 28.0, dur: 1.4, ease: ease.move });
  tl.tween(callU, 1, { at: 28.4, dur: 3.2, ease: ease.linear });
  tl.hold(33.9, 0.5);

  // — beat 5 · the gate, reversed —
  tl.caption({
    at: 34.4,
    dur: 8.6,
    text: 'And the arguments walk through the same customs gate, in reverse. Data crosses by value — a number, a form, a file. Try to smuggle a client function into the call, and React refuses again.',
  });
  tl.tween(gateU, 1, { at: 34.7, dur: 1.4, ease: ease.draw });
  tl.tween(bounceU, 1, { at: 37.6, dur: 3.6, ease: ease.linear });
  tl.hold(42.5, 0.5);

  // — beat 6 · the real function runs —
  tl.caption({
    at: 43.0,
    dur: 8.4,
    text: 'On the server the reply is decoded, the reference is looked up in a manifest, and the real increment finally runs — next to the data, closures intact — returning forty three.',
  });
  tl.tween(cam, CAM_SERVER, { at: 43.2, dur: 1.3, ease: ease.move });
  tl.tween(runU, 1, { at: 43.8, dur: 2.6, ease: ease.move });
  tl.hold(50.9, 0.5);

  // — beat 7 · the response is another tape —
  tl.caption({
    at: 51.4,
    dur: 8.0,
    text: 'The response is not some bespoke payload. It is another Flight tape — the return value, often a freshly rendered page with it, riding the same rows back into the same chunk table.',
  });
  tl.tween(cam, CAM_OPEN, { at: 51.6, dur: 1.4, ease: ease.move });
  tl.tween(backU, 1, { at: 52.2, dur: 3.4, ease: ease.linear });
  tl.hold(58.9, 0.5);

  // — beat 8 · progressive enhancement —
  tl.caption({
    at: 59.4,
    dur: 8.6,
    text: 'Turn scripting off entirely and the form still posts. A hidden field carries the action id in its name, the server finds the function by that name, and the page re-renders. Nothing needs to boot first.',
  });
  tl.tween(cam, CAM_FORM, { at: 59.6, dur: 1.3, ease: ease.move });
  tl.tween(formU, 1, { at: 60.2, dur: 1.6, ease: ease.enter });
  tl.hold(67.5, 0.5);

  // — beat 9 · recap —
  tl.caption({
    at: 68.0,
    dur: 9.4,
    text: 'So step all the way back. One program, two computers. Descriptions travel right, by value. Code travels right, by reference. Calls travel left, by reference. Nothing crosses that cannot survive the wire.',
  });
  tl.tween(cam, CAM_WIDE, { at: 68.2, dur: 1.5, ease: ease.move });
  tl.tween(dimU, 1, { at: 68.6, dur: 1.4, ease: ease.move });
  tl.tween(recapU, 1, { at: 70.0, dur: 2.6, ease: ease.enter });
  tl.hold(76.9, 0.5);

  // — beat 10 · the closing line —
  tl.caption({
    at: 77.4,
    dur: 8.2,
    text: 'That is React for two computers — not a framework trick, but a serialization contract. Now you can read the tape for yourself.',
  });
  tl.tween(endU, 1, { at: 78.6, dur: 1.6, ease: ease.enter });
  tl.hold(85.1, 1.4);

  return {
    tl,
    cam,
    stageU,
    flipU,
    actU,
    stampU,
    refU,
    stubU,
    clickU,
    callU,
    gateU,
    bounceU,
    runU,
    backU,
    formU,
    dimU,
    recapU,
    endU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render.
// ---------------------------------------------------------------------------

function Card({
  x,
  y,
  w,
  h,
  u,
  stroke,
  title,
  titleColor,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  u: number;
  stroke: string;
  title: string;
  titleColor: string;
  children?: ReactNode;
}) {
  if (u <= 0) return null;
  return (
    <g opacity={u} transform={`translate(0,${6 * (1 - u)})`}>
      <rect x={x} y={y} width={w} height={h} rx={11} fill={colors.PANEL} stroke={stroke} strokeWidth={1.4} />
      <text x={x + 16} y={y + 24} fill={titleColor} fontSize={12.5} fontFamily={MONO} fontWeight={650}>
        {title}
      </text>
      {children}
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const stageU = s.get(scene.stageU);
  const flipU = s.get(scene.flipU);
  const actU = s.get(scene.actU);
  const stampU = s.get(scene.stampU);
  const refU = s.get(scene.refU);
  const stubU = s.get(scene.stubU);
  const clickU = s.get(scene.clickU);
  const callU = s.get(scene.callU);
  const gateU = s.get(scene.gateU);
  const bounceU = s.get(scene.bounceU);
  const runU = s.get(scene.runU);
  const backU = s.get(scene.backU);
  const formU = s.get(scene.formU);
  const dimU = s.get(scene.dimU);
  const recapU = s.get(scene.recapU);
  const endU = s.get(scene.endU);

  const mainOp = 1 - 0.88 * dimU;
  const count = backU >= 1 ? 'Count: 43' : 'Count: 42';

  // the call packet: stub -> gate -> decode card (right to left)
  const callPos = (() => {
    if (callU <= 0 || callU >= 1) return null;
    const x0 = STUB.x + 40;
    const y0 = STUB.y + STUB.h / 2;
    if (callU < 0.5) return { x: lerp(x0, GATE_X + 44, callU / 0.5), y: lerp(y0, WIRE_Y - 14, callU / 0.5) };
    return { x: lerp(GATE_X - 44, DECODE.x + DECODE.w - 20, (callU - 0.5) / 0.5), y: lerp(WIRE_Y - 14, DECODE.y + 40, (callU - 0.5) / 0.5) };
  })();

  // the smuggled client function: reaches the gate and falls
  const bouncePos = (() => {
    if (bounceU <= 0 || bounceU >= 1) return null;
    if (bounceU < 0.45) return { x: lerp(STUB.x + 40, GATE_X + 46, bounceU / 0.45), y: WIRE_Y - 14, op: 1 };
    const t = (bounceU - 0.45) / 0.55;
    return { x: GATE_X + 46 + 110 * t, y: WIRE_Y - 14 - 40 * Math.sin(Math.PI * Math.min(t * 1.5, 1)) + 170 * t * t, op: 1 - 0.7 * t };
  })();

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={mainOp}>
          {/* zones + wire */}
          <Zone x={SERVER.x} y={SERVER.y} w={SERVER.w} h={SERVER.h} label="SERVER" kind="region" u={stageU} color={colors.SECONDARY} />
          <Zone x={CLIENT.x} y={CLIENT.y} w={CLIENT.w} h={CLIENT.h} label="CLIENT — the browser" kind="region" u={stageU} color={colors.ACCENT} />
          <g opacity={stageU}>
            <line x1={SERVER.x + SERVER.w} y1={WIRE_Y} x2={CLIENT.x} y2={WIRE_Y} stroke={colors.GRID} strokeWidth={2} strokeDasharray="3 6" />
            {/* the direction arrow that flips */}
            <g transform={`translate(${GATE_X},${WIRE_Y - 44}) scale(${1 - 2 * flipU},1)`}>
              <path d="M -50 0 h 88 l -14 -9 v 18 l 14 -9" fill={flipU > 0.5 ? colors.WARM : colors.MUTED} opacity={0.9} />
            </g>
            <text x={GATE_X} y={WIRE_Y - 60} textAnchor="middle" fill={flipU > 0.5 ? colors.WARM : colors.MUTED} fontSize={11}>
              {flipU > 0.5 ? 'now: client → server' : 'so far: server → client'}
            </text>
          </g>

          {/* actions.js */}
          <Card x={ACTIONS.x} y={ACTIONS.y} w={ACTIONS.w} h={ACTIONS.h} u={actU} stroke={colors.SECONDARY} title="actions.js" titleColor={colors.TEXT}>
            <text x={ACTIONS.x + 130} y={ACTIONS.y + 24} fill={colors.WARM} fontSize={12} fontFamily={MONO}>
              'use server'
            </text>
            {['export async function increment(n) {', '  return n + 1', '}'].map((l, i) => (
              <text key={i} x={ACTIONS.x + 20} y={ACTIONS.y + 52 + i * 18} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                {l}
              </text>
            ))}
            {/* execution flash when it finally runs */}
            {runU > 0.4 && runU < 1 && (
              <rect x={ACTIONS.x + 12} y={ACTIONS.y + 38} width={ACTIONS.w - 24} height={62} rx={7} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={Math.sin(Math.PI * clamp01((runU - 0.4) / 0.6))} />
            )}
            {/* the stamp */}
            {stampU > 0.02 && (
              <g opacity={stampU} transform={`translate(${ACTIONS.x + 20},${ACTIONS.y + 118}) scale(${0.8 + 0.2 * stampU})`}>
                <rect x={0} y={0} width={320} height={22} rx={6} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.3} />
                <text x={10} y={15} fill={colors.WARM} fontSize={10} fontFamily={MONO}>
                  $$id: "./src/actions.js#increment"
                </text>
              </g>
            )}
          </Card>
          {actU > 0.5 && (
            <text x={ACTIONS.x + 4} y={ACTIONS.y + ACTIONS.h + 18} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO} opacity={stampU * (1 - 0.7 * dimU)}>
              registerServerReference — ReactFlightWebpackNodeRegister.js
            </text>
          )}

          {/* the reference crossing to the client */}
          {refU > 0.02 && refU < 1 && (
            <g>
              <rect x={lerp(ACTIONS.x + 300, STUB.x + 20, refU) - 24} y={lerp(ACTIONS.y + 129, STUB.y - 14, refU) - 12} width={48} height={24} rx={7} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.3} />
              <text x={lerp(ACTIONS.x + 300, STUB.x + 20, refU)} y={lerp(ACTIONS.y + 129, STUB.y - 14, refU) + 4} textAnchor="middle" fill={colors.WARM} fontSize={11} fontFamily={MONO}>
                "$h4"
              </text>
            </g>
          )}

          {/* counter button */}
          {stageU > 0.6 && (
            <g opacity={stageU}>
              <rect x={BUTTON.x} y={BUTTON.y} width={BUTTON.w} height={BUTTON.h} rx={10} fill={colors.BG} stroke={colors.ACCENT} strokeWidth={1.8} />
              <text x={BUTTON.x + BUTTON.w / 2} y={BUTTON.y + 34} textAnchor="middle" fill={colors.ACCENT} fontSize={15} fontFamily={MONO} fontWeight={650}>
                {count}
              </text>
              {clickU > 0.02 && clickU < 1 && (
                <circle cx={BUTTON.x + BUTTON.w / 2} cy={BUTTON.y + 27} r={12 + 34 * clickU} fill="none" stroke={colors.ACCENT} strokeWidth={2 * (1 - clickU)} opacity={1 - clickU} />
              )}
            </g>
          )}

          {/* the stub */}
          <Card x={STUB.x} y={STUB.y} w={STUB.w} h={STUB.h} u={stubU} stroke={colors.ACCENT} title="increment — a stub" titleColor={colors.TEXT}>
            {['callServer(', '  "./src/actions.js#increment",', '  [42])'].map((l, i) => (
              <text key={i} x={STUB.x + 20} y={STUB.y + 48 + i * 17} fill={colors.ACCENT} fontSize={11} fontFamily={MONO}>
                {l}
              </text>
            ))}
          </Card>

          {/* the reverse gate on the wire */}
          {gateU > 0.02 && (
            <g opacity={gateU}>
              <rect x={GATE_X - 26} y={WIRE_Y - 96} width={12} height={112} rx={4} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.3} />
              <rect x={GATE_X + 14} y={WIRE_Y - 96} width={12} height={112} rx={4} fill={colors.PANEL} stroke={colors.WARM} strokeWidth={1.3} />
              <text x={GATE_X} y={WIRE_Y - 106} textAnchor="middle" fill={colors.WARM} fontSize={10}>
                the same gate, reversed
              </text>
              <text x={GATE_X} y={WIRE_Y + 34} textAnchor="middle" fill={colors.MUTED} fontSize={9} fontFamily={MONO}>
                processReply → decodeReply
              </text>
            </g>
          )}

          {/* the call packet */}
          {callPos && (
            <g>
              <rect x={callPos.x - 62} y={callPos.y - 13} width={124} height={26} rx={7} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.3} />
              <text x={callPos.x} y={callPos.y + 4} textAnchor="middle" fill={colors.POSITIVE} fontSize={10} fontFamily={MONO}>
                {'{id, args: [42]}'}
              </text>
            </g>
          )}

          {/* the smuggled client function bounces */}
          {bouncePos && (
            <g opacity={bouncePos.op}>
              <rect x={bouncePos.x - 46} y={bouncePos.y - 13} width={92} height={26} rx={7} fill={colors.PANEL} stroke={colors.NEGATIVE} strokeWidth={1.3} />
              <text x={bouncePos.x} y={bouncePos.y + 4} textAnchor="middle" fill={colors.NEGATIVE} fontSize={10.5} fontFamily={MONO}>
                a client fn
              </text>
            </g>
          )}
          {bounceU > 0.5 && (
            <g opacity={clamp01((bounceU - 0.5) / 0.2) * (1 - clamp01(runU * 2)) * mainOp}>
              <rect x={GATE_X - 160} y={430} width={330} height={78} rx={10} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.4} />
              <text x={GATE_X - 146} y={450} fill={colors.NEGATIVE} fontSize={10.5} fontFamily={MONO} fontWeight={700}>
                Error
              </text>
              {CLIENTFN_ERR.map((l, i) => (
                <text key={i} x={GATE_X - 146} y={468 + i * 14} fill={colors.TEXT} fontSize={9.5} fontFamily={MONO} opacity={0.92}>
                  {l}
                </text>
              ))}
            </g>
          )}

          {/* decode + run on the server */}
          <Card x={DECODE.x} y={DECODE.y} w={DECODE.w} h={DECODE.h} u={runU} stroke={colors.POSITIVE} title="the reply, decoded" titleColor={colors.TEXT}>
            {['decodeReply → args: [42]', 'manifest lookup → increment', 'increment(42) → 43'].map((l, i) => (
              <text key={i} x={DECODE.x + 20} y={DECODE.y + 50 + i * 20} fill={i === 2 ? colors.POSITIVE : colors.MUTED} fontSize={11.5} fontFamily={MONO} fontWeight={i === 2 ? 700 : 400}>
                {l}
              </text>
            ))}
            <text x={DECODE.x + 20} y={DECODE.y + 132} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
              ReactFlightReplyServer.js
            </text>
          </Card>

          {/* the response tape riding back */}
          {backU > 0 &&
            Array.from({ length: 12 }, (_, i) => {
              const u = clamp01(backU * 1.45 - i / 12);
              if (u <= 0 || u >= 1) return null;
              return <circle key={i} cx={lerp(SERVER.x + SERVER.w, CLIENT.x, u)} cy={WIRE_Y + 12 + ((i % 3) - 1) * 8} r={3} fill={colors.WARM} opacity={0.95} />;
            })}
          {backU > 0.2 && backU < 1 && (
            <text x={GATE_X} y={WIRE_Y + 56} textAnchor="middle" fill={colors.WARM} fontSize={10.5} opacity={0.9}>
              another Flight tape — the return value rides home
            </text>
          )}

          {/* the no-scripting form */}
          <Card x={FORM.x} y={FORM.y} w={FORM.w} h={FORM.h} u={formU} stroke={colors.TEAL ?? colors.POSITIVE} title="the same button, scripting off" titleColor={colors.TEXT}>
            <text x={FORM.x + 20} y={FORM.y + 46} fill={colors.MUTED} fontSize={10.5} fontFamily={MONO}>
              {'<form> POST — hidden field name:'}
            </text>
            <rect x={FORM.x + 16} y={FORM.y + 56} width={FORM.w - 32} height={22} rx={6} fill={colors.BG} stroke={colors.POSITIVE} strokeWidth={1.2} />
            <text x={FORM.x + 26} y={FORM.y + 71} fill={colors.POSITIVE} fontSize={9.5} fontFamily={MONO}>
              $ACTION_ID_./src/actions.js#increment
            </text>
            <text x={FORM.x + 20} y={FORM.y + 98} fill={colors.MUTED} fontSize={9.5} fontFamily={MONO}>
              decodeAction — ReactFlightActionServer.js
            </text>
          </Card>
        </g>

        {/* recap */}
        {recapU > 0.02 && (
          <g>
            <text x={640} y={150} textAnchor="middle" fill={colors.TEXT} fontSize={23} fontWeight={700} opacity={recapU}>
              One program. Two computers. One contract.
            </text>
            {RECAP.map((r, i) => {
              const u = win(recapU, RECAP.length, i, 2.0);
              if (u <= 0) return null;
              const x = 214 + i * 284;
              return (
                <g key={r.t} opacity={u} transform={`translate(${x},${300 + 12 * (1 - u)})`}>
                  <rect x={-122} y={-52} width={244} height={116} rx={13} fill={colors.PANEL} stroke={colors.GRID} strokeWidth={1.3} />
                  <text x={0} y={-24} textAnchor="middle" fill={colors.WARM} fontSize={19} fontFamily={MONO}>
                    {r.dir}
                  </text>
                  <text x={0} y={4} textAnchor="middle" fill={colors.TEXT} fontSize={15.5} fontWeight={650}>
                    {r.t}
                  </text>
                  <text x={0} y={30} textAnchor="middle" fill={colors.MUTED} fontSize={10.5}>
                    {r.s}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        {endU > 0.02 && (
          <text x={640} y={444} textAnchor="middle" fill={colors.ACCENT} fontSize={17} fontWeight={650} opacity={endU}>
            React for two computers.
          </text>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
