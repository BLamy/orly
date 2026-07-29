// One Trip Through the Onion
//
// Backing files: Readme.md (Hello Koa, ~570 SLOC, logger middleware),
// lib/application.js — listen() → http.createServer(this.callback()),
// callback() → const fn = this.compose(this.middleware) + default 'error'
// listener, createContext(req, res), handleRequest() → res.statusCode = 404,
// fnMiddleware(ctx).then(handleResponse).catch(onerror), respond(ctx).
// lib/response.js — setting body flips status 404 → 200.
//
// Centerpiece: one request dot makes the full round trip — client → server,
// req+res fuse into a ctx chip stamped 404, the chip dives through the logger
// ring to the Hello Koa core, the body set at the core flips the stamp to 200,
// the logger's clock is read on the climb out, and respond() ends the response.
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
import { TimerArc } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

// ---------------------------------------------------------------------------
// Layout — the client on the left, the onion (the app) on the right.
// ---------------------------------------------------------------------------

const CLIENT = { x: 150, y: 380 } as const;
const ONION = { x: 830, y: 380 } as const;
const R_OUTER = 195; // logger ring outer edge
const R_INNER = 118; // logger ring inner edge
const R_CORE = 62; // the Hello Koa handler

// the dot's journey, as waypoints along y = ONION.y
const X_EDGE = ONION.x - R_OUTER;
const X_RING = ONION.x - (R_OUTER + R_INNER) / 2;
const X_CORE = ONION.x;

// Hello Koa — the exact program from Readme.md
const HELLO_LINES = [
  "const Koa = require('koa')",
  'const app = new Koa()',
  '',
  'app.use(ctx => {',
  "  ctx.body = 'Hello Koa'",
  '})',
  '',
  'app.listen(3000)',
] as const;

// camera marks
const CAM_CODE: CameraState = { x: 330, y: 330, k: 1.5 };
const CAM_SERVER: CameraState = { x: 810, y: 380, k: 1.12 };
const CAM_FUSE: CameraState = { x: 560, y: 400, k: 1.5 };
const CAM_CORE: CameraState = { x: 800, y: 385, k: 1.55 };
const CAM_WIDE: CameraState = CAMERA_HOME;

export interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  codeU: ChannelRef<number>;
  codeDim: ChannelRef<number>;
  serverU: ChannelRef<number>;
  composeU: ChannelRef<number>;
  travelU: ChannelRef<number>; // client → server edge
  fuseU: ChannelRef<number>; // req + res → ctx
  stampU: ChannelRef<number>; // the 404 stamp
  descendU: ChannelRef<number>; // edge → logger ring → core
  clockU: ChannelRef<number>; // the logger's timer arc
  bodyU: ChannelRef<number>; // ctx.body set; 404 → 200
  turnU: ChannelRef<number>; // the resolve glow at the core
  climbU: ChannelRef<number>; // core → back to the edge
  logU: ChannelRef<number>; // the printed log line
  respondU: ChannelRef<number>; // respond(ctx) chip + exit travel
  exitU: ChannelRef<number>; // server edge → client
  traceU: ChannelRef<number>; // the payoff round-trip trace
  stageDim: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_CODE, cameraInterp);
  const codeU = tl.channel('codeU', 0);
  const codeDim = tl.channel('codeDim', 1);
  const serverU = tl.channel('serverU', 0);
  const composeU = tl.channel('composeU', 0);
  const travelU = tl.channel('travelU', 0);
  const fuseU = tl.channel('fuseU', 0);
  const stampU = tl.channel('stampU', 0);
  const descendU = tl.channel('descendU', 0);
  const clockU = tl.channel('clockU', 0);
  const bodyU = tl.channel('bodyU', 0);
  const turnU = tl.channel('turnU', 0);
  const climbU = tl.channel('climbU', 0);
  const logU = tl.channel('logU', 0);
  const respondU = tl.channel('respondU', 0);
  const exitU = tl.channel('exitU', 0);
  const traceU = tl.channel('traceU', 0);
  const stageDim = tl.channel('stageDim', 1);
  const closeU = tl.channel('closeU', 0);

  // — Beat 1 · Hello Koa, the whole program —
  tl.caption({
    at: 0.5,
    dur: 7,
    text: 'This is all of Hello Koa: make an app, register one function with use, listen on port three thousand. Somewhere in these eight lines hides one of the prettiest control flows in web programming.',
  });
  tl.tween(codeU, 1, { at: 0.4, dur: 0.9, ease: ease.enter });
  tl.tween(cam, { x: 330, y: 345, k: 1.42 }, { at: 0.8, dur: 3.2, ease: ease.move });
  tl.hold(7.5, 0.6);

  // — Beat 2 · listen is a shorthand —
  tl.caption({
    at: 8.1,
    dur: 6,
    text: 'Listen is just a shorthand. It creates a plain node web server and hands it a single request handler, built once by the callback method.',
  });
  tl.tween(cam, CAM_SERVER, { at: 8.3, dur: 1.6, ease: ease.move });
  tl.tween(codeDim, 0.35, { at: 8.3, dur: 1.2, ease: ease.move });
  tl.tween(serverU, 1, { at: 9.2, dur: 1.2, ease: ease.draw });
  tl.hold(14.1, 0.5);

  // — Beat 3 · callback composes the onion —
  tl.caption({
    at: 14.6,
    dur: 6.4,
    text: 'While the app boots, callback does two things. It composes every registered middleware into one function, and it hooks up a default error listener for later.',
  });
  tl.tween(composeU, 1, { at: 15.4, dur: 1.6, ease: ease.draw });
  tl.hold(21.0, 0.6);

  // — Beat 4 · a request arrives; req + res fuse into ctx —
  tl.caption({
    at: 21.6,
    dur: 6.6,
    text: 'Then a request actually arrives. Node hands over two raw objects, the incoming message and the server response — and Koa immediately fuses them into a single context.',
  });
  tl.tween(cam, CAM_FUSE, { at: 21.8, dur: 1.5, ease: ease.move });
  tl.tween(travelU, 1, { at: 22.2, dur: 1.6, ease: ease.linear });
  tl.tween(fuseU, 1, { at: 24.4, dur: 1.4, ease: ease.move });
  tl.hold(28.2, 0.5);

  // — Beat 5 · stamped 404 before your code runs —
  tl.caption({
    at: 28.7,
    dur: 5.8,
    text: 'Before any of your code runs, the response is stamped four oh four. Not found is the default answer, and middleware has to earn anything better.',
  });
  tl.tween(stampU, 1, { at: 29.6, dur: 0.5, ease: ease.pop });
  tl.hold(34.5, 0.5);

  // — Beat 6 · the descent through the logger ring —
  tl.caption({
    at: 35.0,
    dur: 6.6,
    text: 'Now the descent. The context dives into the outermost ring — the logger from the readme. It notes the time, then calls await next, which passes the request one layer deeper.',
  });
  tl.tween(cam, CAM_CORE, { at: 35.2, dur: 1.8, ease: ease.move });
  tl.tween(descendU, 0.5, { at: 35.8, dur: 1.4, ease: ease.move });
  tl.tween(clockU, 1, { at: 37.4, dur: 22, ease: ease.linear }); // the clock runs until the log prints
  tl.tween(descendU, 1, { at: 39.4, dur: 1.4, ease: ease.move });
  tl.hold(41.6, 0.4);

  // — Beat 7 · the core sets the body; 404 → 200 —
  tl.caption({
    at: 42.0,
    dur: 6.2,
    text: 'At the core sits the hello middleware. It sets the body to a friendly string — and setting a body flips the status from four oh four to two hundred, automatically.',
  });
  tl.tween(bodyU, 1, { at: 43.6, dur: 0.7, ease: ease.pop });
  tl.hold(48.2, 0.4);

  // — Beat 8 · nothing deeper; the turnaround —
  tl.caption({
    at: 48.6,
    dur: 4.6,
    text: "There is nobody deeper to call, so the innermost promise simply resolves — and the request turns around.",
  });
  tl.tween(turnU, 1, { at: 49.6, dur: 0.8, ease: ease.pop });
  tl.tween(turnU, 0.25, { at: 51.4, dur: 1.0, ease: ease.move });

  // — Beat 9 · the climb; the logger's second half —
  tl.caption({
    at: 53.4,
    dur: 6,
    text: "On the way back out, the logger's second half runs. It reads the clock it started earlier and prints the method, the path, and the elapsed milliseconds.",
  });
  tl.tween(climbU, 1, { at: 53.8, dur: 2.4, ease: ease.move });
  tl.tween(cam, { x: 700, y: 400, k: 1.3 }, { at: 54.0, dur: 1.8, ease: ease.move });
  tl.tween(logU, 1, { at: 56.6, dur: 0.7, ease: ease.enter });
  tl.hold(59.4, 0.5);

  // — Beat 10 · respond writes to the network —
  tl.caption({
    at: 59.9,
    dur: 6,
    text: 'Only when the whole onion has unwound does Koa touch the network. A helper called respond writes your body onto the raw response and ends it.',
  });
  tl.tween(respondU, 1, { at: 60.7, dur: 0.8, ease: ease.enter });
  tl.tween(exitU, 1, { at: 62.0, dur: 1.8, ease: ease.linear });
  tl.hold(65.9, 0.5);

  // — Beat 11 · payoff: the shape of the whole book —
  tl.caption({
    at: 66.4,
    dur: 7,
    text: "That's the shape of everything in this book: down through the rings, turn at the core, and back out the same way. The next chapters slow each part of that journey down.",
  });
  tl.tween(cam, CAM_WIDE, { at: 66.6, dur: 1.8, ease: ease.move });
  tl.tween(stageDim, 0.15, { at: 66.8, dur: 1.4, ease: ease.move });
  tl.tween(traceU, 1, { at: 67.6, dur: 2.6, ease: ease.draw });
  tl.tween(closeU, 1, { at: 70.6, dur: 0.9, ease: ease.enter });
  tl.hold(73.4, 1.6);

  return {
    tl,
    cam,
    codeU,
    codeDim,
    serverU,
    composeU,
    travelU,
    fuseU,
    stampU,
    descendU,
    clockU,
    bodyU,
    turnU,
    climbU,
    logU,
    respondU,
    exitU,
    traceU,
    stageDim,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function CodeChip({ x, y, text, u, color }: { x: number; y: number; text: string; u: number; color?: string }) {
  if (u <= 0) return null;
  const w = text.length * 7.4 + 22;
  return (
    <g opacity={u}>
      <rect x={x - w / 2} y={y - 13} width={w} height={26} rx={6} fill={colors.PANEL} stroke={color ?? colors.GRID} />
      <text x={x} y={y + 4} textAnchor="middle" fill={color ?? colors.MUTED} fontSize={12} fontFamily="monospace">
        {text}
      </text>
    </g>
  );
}

// the ctx chip: a rounded card with a status stamp, drawn at (x, y)
function CtxChip({ x, y, u, status, statusU }: { x: number; y: number; u: number; status: string; statusU: number }) {
  if (u <= 0) return null;
  const ok = status === '200';
  return (
    <g opacity={u} transform={`translate(${x}, ${y})`}>
      <rect x={-34} y={-22} width={68} height={44} rx={8} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
      <text x={0} y={-4} textAnchor="middle" fill={colors.ACCENT} fontSize={13} fontFamily="monospace" fontWeight={700}>
        ctx
      </text>
      {statusU > 0 && (
        <g opacity={statusU}>
          <rect x={-24} y={2} width={48} height={15} rx={4} fill={ok ? colors.POSITIVE : colors.NEGATIVE} opacity={0.22} />
          <text x={0} y={13.5} textAnchor="middle" fill={ok ? colors.POSITIVE : colors.NEGATIVE} fontSize={11} fontFamily="monospace" fontWeight={700}>
            {status}
          </text>
        </g>
      )}
    </g>
  );
}

// where the ctx chip is, given the sampled journey channels
function ctxPosition(s: SceneState): { x: number; y: number } {
  const descendU = s.get(scene.descendU);
  const climbU = s.get(scene.climbU);
  const exitU = s.get(scene.exitU);
  if (exitU > 0) return { x: lerp(X_EDGE - 26, CLIENT.x + 60, exitU), y: ONION.y };
  if (climbU > 0) return { x: lerp(X_CORE, X_EDGE - 26, climbU), y: ONION.y };
  return { x: lerp(X_EDGE - 26, X_CORE, descendU), y: ONION.y };
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const codeU = s.get(scene.codeU);
  const codeDim = s.get(scene.codeDim);
  const serverU = s.get(scene.serverU);
  const composeU = s.get(scene.composeU);
  const travelU = s.get(scene.travelU);
  const fuseU = s.get(scene.fuseU);
  const stampU = s.get(scene.stampU);
  const descendU = s.get(scene.descendU);
  const clockU = s.get(scene.clockU);
  const bodyU = s.get(scene.bodyU);
  const turnU = s.get(scene.turnU);
  const climbU = s.get(scene.climbU);
  const logU = s.get(scene.logU);
  const respondU = s.get(scene.respondU);
  const exitU = s.get(scene.exitU);
  const traceU = s.get(scene.traceU);
  const stageDim = s.get(scene.stageDim);
  const closeU = s.get(scene.closeU);

  const ctxAlive = fuseU;
  const pos = ctxPosition(s);
  const status = bodyU > 0.5 ? '200' : '404';
  const inFlight = travelU > 0 && travelU < 1;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* ---- Hello Koa source card ---- */}
        <g opacity={codeU * codeDim * stageDim}>
          <rect x={150} y={190} width={330} height={250} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={168} y={218} fill={colors.MUTED} fontSize={12} fontStyle="italic">
            Hello Koa — the whole app
          </text>
          {HELLO_LINES.map((line, i) => (
            <text key={i} x={172} y={246 + i * 22} fill={i === 4 ? colors.ACCENT : colors.TEXT} fontSize={13} fontFamily="monospace">
              {line}
            </text>
          ))}
        </g>

        {/* ---- client ---- */}
        <g opacity={serverU * stageDim}>
          <circle cx={CLIENT.x} cy={CLIENT.y + 140} r={26} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={CLIENT.x} y={CLIENT.y + 145} textAnchor="middle" fill={colors.MUTED} fontSize={12}>
            client
          </text>
        </g>

        {/* ---- the server boundary + onion ---- */}
        <g opacity={serverU * stageDim}>
          <rect
            x={ONION.x - R_OUTER - 42}
            y={ONION.y - R_OUTER - 42}
            width={(R_OUTER + 42) * 2}
            height={(R_OUTER + 42) * 2}
            rx={22}
            fill="none"
            stroke={colors.GRID}
            strokeDasharray="8 8"
          />
          <text x={ONION.x} y={ONION.y - R_OUTER - 54} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily="monospace">
            http.createServer(app.callback())
          </text>
        </g>

        {/* the onion rings — composed once at boot */}
        <g opacity={composeU * stageDim}>
          {/* logger ring */}
          <circle cx={ONION.x} cy={ONION.y} r={R_OUTER} fill={colors.ACCENT} opacity={0.07} />
          <circle cx={ONION.x} cy={ONION.y} r={R_OUTER} fill="none" stroke={colors.ACCENT} strokeWidth={1.5} opacity={0.75} />
          <circle cx={ONION.x} cy={ONION.y} r={R_INNER} fill={colors.BG} opacity={0.55} />
          <circle cx={ONION.x} cy={ONION.y} r={R_INNER} fill="none" stroke={colors.ACCENT} strokeWidth={1} opacity={0.5} />
          <text x={ONION.x} y={ONION.y - R_OUTER + 26} textAnchor="middle" fill={colors.ACCENT} fontSize={13}>
            logger middleware
          </text>
          {/* the core */}
          <circle cx={ONION.x} cy={ONION.y} r={R_CORE} fill={colors.WARM} opacity={0.1 + 0.25 * turnU} />
          <circle cx={ONION.x} cy={ONION.y} r={R_CORE} fill="none" stroke={colors.WARM} strokeWidth={1.5} opacity={0.8} />
          <text x={ONION.x} y={ONION.y - R_CORE - 12} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily="monospace">
            ctx.body = 'Hello Koa'
          </text>
          <CodeChip x={ONION.x} y={ONION.y + R_OUTER + 28} text="const fn = this.compose(this.middleware)" u={composeU} />
        </g>

        {/* the logger's clock */}
        {clockU > 0 && descendU > 0.2 && (
          <g opacity={stageDim}>
            <TimerArc cx={ONION.x - R_OUTER + 36} cy={ONION.y - 60} r={17} u={Math.min(clockU, 1)} color={colors.SECONDARY} />
            <text x={ONION.x - R_OUTER + 36} y={ONION.y - 88} textAnchor="middle" fill={colors.SECONDARY} fontSize={11} fontFamily="monospace">
              start = Date.now()
            </text>
          </g>
        )}

        {/* ---- the raw pair traveling in, then fusing ---- */}
        {inFlight && (
          <g>
            <circle cx={lerp(CLIENT.x + 40, X_EDGE - 60, travelU)} cy={ONION.y - 12} r={9} fill={colors.ACCENT} />
            <text x={lerp(CLIENT.x + 40, X_EDGE - 60, travelU)} y={ONION.y - 30} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
              req
            </text>
            <circle cx={lerp(CLIENT.x + 40, X_EDGE - 60, travelU)} cy={ONION.y + 14} r={9} fill={colors.SECONDARY} />
            <text x={lerp(CLIENT.x + 40, X_EDGE - 60, travelU)} y={ONION.y + 38} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
              res
            </text>
          </g>
        )}
        {travelU >= 1 && fuseU < 1 && (
          <g>
            {/* the two plates converge into the chip */}
            <circle cx={X_EDGE - 60 + 20 * fuseU} cy={lerp(ONION.y - 12, ONION.y, fuseU)} r={9 * (1 - fuseU * 0.4)} fill={colors.ACCENT} opacity={1 - fuseU * 0.6} />
            <circle cx={X_EDGE - 60 + 20 * fuseU} cy={lerp(ONION.y + 14, ONION.y, fuseU)} r={9 * (1 - fuseU * 0.4)} fill={colors.SECONDARY} opacity={1 - fuseU * 0.6} />
          </g>
        )}
        {fuseU > 0.4 && (
          <CodeChip x={X_EDGE - 40} y={ONION.y + 66} text="createContext(req, res)" u={clamp01(fuseU * 2 - 0.8) * stageDim} />
        )}
        {stampU > 0 && stampU < 1.01 && fuseU > 0.9 && (
          <CodeChip x={X_EDGE - 40} y={ONION.y - 62} text="res.statusCode = 404" u={stampU * stageDim} color={colors.NEGATIVE} />
        )}

        {/* ---- the ctx chip on its journey ---- */}
        <CtxChip x={pos.x} y={pos.y} u={ctxAlive * (exitU >= 1 ? 0.25 : 1)} status={status} statusU={stampU} />

        {/* the turnaround glow */}
        {turnU > 0 && (
          <g opacity={turnU}>
            <circle cx={ONION.x} cy={ONION.y} r={R_CORE + 14} fill="none" stroke={colors.WARM} strokeWidth={2} opacity={0.7} />
            <text x={ONION.x} y={ONION.y + R_CORE + 30} textAnchor="middle" fill={colors.WARM} fontSize={12} fontFamily="monospace">
              Promise.resolve()
            </text>
          </g>
        )}

        {/* the printed log line */}
        {logU > 0 && (
          <g opacity={logU * stageDim}>
            <rect x={480} y={586} width={250} height={30} rx={6} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={494} y={606} fill={colors.POSITIVE} fontSize={13} fontFamily="monospace">
              GET / — 2ms
            </text>
          </g>
        )}

        {/* respond writes the body */}
        {respondU > 0 && (
          <CodeChip x={X_EDGE - 60} y={ONION.y + 104} text="respond(ctx) → res.end(body)" u={respondU * stageDim} color={colors.POSITIVE} />
        )}
        {exitU > 0 && exitU < 1 && (
          <text x={pos.x} y={pos.y - 34} textAnchor="middle" fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">
            'Hello Koa'
          </text>
        )}

        {/* ---- the payoff trace: the whole round trip ---- */}
        {traceU > 0 && (
          <g opacity={traceU}>
            <path
              d={`M ${CLIENT.x + 40} ${ONION.y - 8} L ${X_CORE} ${ONION.y - 8}`}
              fill="none"
              stroke={colors.ACCENT}
              strokeWidth={2.5}
              strokeDasharray="460"
              strokeDashoffset={460 * (1 - clamp01(traceU * 1.6))}
            />
            <path
              d={`M ${X_CORE} ${ONION.y + 10} L ${CLIENT.x + 40} ${ONION.y + 10}`}
              fill="none"
              stroke={colors.POSITIVE}
              strokeWidth={2.5}
              strokeDasharray="460"
              strokeDashoffset={460 * (1 - clamp01(traceU * 1.6 - 0.5))}
            />
            <text x={(CLIENT.x + X_CORE) / 2} y={ONION.y - 22} textAnchor="middle" fill={colors.ACCENT} fontSize={13}>
              downstream — actions
            </text>
            <text x={(CLIENT.x + X_CORE) / 2} y={ONION.y + 36} textAnchor="middle" fill={colors.POSITIVE} fontSize={13}>
              upstream — filters
            </text>
          </g>
        )}

        {/* ---- closing panel ---- */}
        {closeU > 0 && (
          <g opacity={closeU}>
            <rect x={390} y={120} width={520} height={112} rx={16} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.5} />
            <text x={650} y={166} textAnchor="middle" fill={colors.TEXT} fontSize={21}>
              down the rings · turn at the core
            </text>
            <text x={650} y={202} textAnchor="middle" fill={colors.ACCENT} fontSize={21} fontWeight={700}>
              back out the same way
            </text>
          </g>
        )}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
