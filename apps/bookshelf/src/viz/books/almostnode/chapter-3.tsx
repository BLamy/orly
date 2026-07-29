// Doing a Node Impression
//
// Grounding: packages/almostnode/src/runtime.ts — createWrappedModuleCode
// wraps every module in `(function($exports, $require, $module, $filename,
// $dirname, $process, …) { … })`; transformDynamicImportsRegex rewrites
// `import(` → `__dynamicImport(`; transformEsmToCjsSimple (acorn AST) turns
// imports into requires; the shim table (fs, path, http, net, crypto, stream,
// zlib, vm, os, events, worker_threads, child_process, … — README: "40+
// shimmed modules"). src/shims/http.ts — Server.listen() has no socket: its
// callback calls _registerServer(port, server), which the ServerBridge picks
// up via setServerListenCallback and announces to the service worker as
// 'server-registered'. src/create-runtime.ts — sandbox | useWorker |
// dangerouslyAllowSameOrigin, and the "almostnode: For security" error.
//
// Centerpiece: the WRAPPER PRESS — real source slides in and the real wrapper
// prints around it; require() fires rays into a shim grid; then listen(3000)
// draws a socket that DISSOLVES into a registry row. Coda: the three cages.
import {
  CAMERA_HOME,
  Camera,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
  stagger,
} from '../../core';
import type { CameraState, SceneState } from '../../core';
import { Connection, NodeBadge } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);
const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

// the source card (left) — a minimal real server module
const SRC = { x: 95, y: 150, w: 375, h: 168 } as const;
const SRC_LINES = [
  "const http = require('http');",
  "const fs = require('fs');",
  'const server = http.createServer(app);',
  'server.listen(3000);',
] as const;
// wrapper lines printed around it (verbatim from createWrappedModuleCode)
const WRAP_TOP = ['(function($exports, $require, $module,', '  $filename, $dirname, $process, …) {'] as const;
const WRAP_BOT = '})' as const;
const WRAP_PAD_TOP = 58;
const WRAP_PAD_BOT = 34;

// the shim grid (right)
const SHIMS = ['fs', 'path', 'http', 'net', 'crypto', 'stream', 'zlib', 'vm', 'os', 'events', 'worker_threads', 'child_process'] as const;
const GRID = { x0: 610, y0: 140, cols: 4, cellW: 136, cellH: 44, gapX: 10, gapY: 12 } as const;
const shimPos = (i: number): { x: number; y: number } => ({
  x: GRID.x0 + (i % GRID.cols) * (GRID.cellW + GRID.gapX) + GRID.cellW / 2,
  y: GRID.y0 + Math.floor(i / GRID.cols) * (GRID.cellH + GRID.gapY) + GRID.cellH / 2,
});
const SHIM_HTTP = SHIMS.indexOf('http');
const SHIM_FS = SHIMS.indexOf('fs');

// the ESM → CJS station (below the source card)
const ESM = { x: 95, y: 405, w: 375, h: 96 } as const;

// the socket-that-isn't (bottom center) and the bridge registry
const SOCK = { cx: 700, y: 470, r: 46 } as const;
const REG = { x: 850, y: 420, w: 300, h: 104 } as const;
const SW_BADGE = { x: 1105, y: 300 } as const;

// the three cages (coda)
const DOORS = [
  { title: 'cross-origin sandbox', code: "sandbox: 'https://…'", note: 'untrusted code, fully isolated', color: colors.POSITIVE },
  { title: 'web worker', code: 'useWorker: true', note: 'off the main thread', color: colors.ACCENT },
  { title: 'main thread', code: 'dangerouslyAllowSameOrigin', note: 'trusted code only', color: colors.WARM },
] as const;
const DOOR_W = 300;
const DOOR_GAP = 40;
const DOORS_X0 = (STAGE_W - (DOOR_W * 3 + DOOR_GAP * 2)) / 2;
const DOORS_Y = 210;

// camera marks
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_SRC: CameraState = { x: 340, y: 260, k: 1.35 };
const CAM_GRID: CameraState = { x: 700, y: 260, k: 1.18 };
const CAM_SOCK: CameraState = { x: 810, y: 420, k: 1.3 };

// ---------------------------------------------------------------------------
// Timeline (~88s, eleven beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_SRC, cameraInterp);

  const srcU = tl.channel('srcU', 0); // source card
  const noNodeU = tl.channel('noNodeU', 0); // "no Node here" strike
  const pressU = tl.channel('pressU', 0); // the wrapper prints around it
  const gridU = tl.channel('gridU', 0); // shim grid (windowed)
  const countU = tl.channel('countU', 0); // "40+ modules" counter
  const rayHttp = tl.channel('rayHttp', 0); // require('http') ray
  const rayFs = tl.channel('rayFs', 0); // require('fs') ray
  const line1Hot = tl.channel('line1Hot', 0); // source line highlights
  const line2Hot = tl.channel('line2Hot', 0);
  const line4Hot = tl.channel('line4Hot', 0);
  const esmU = tl.channel('esmU', 0); // the acorn rewrite station
  const sockU = tl.channel('sockU', 0); // dashed socket draws
  const sockFade = tl.channel('sockFade', 0); // …then dissolves
  const regRowU = tl.channel('regRowU', 0); // registry panel + row
  const pingU = tl.channel('pingU', 0); // server-registered → SW badge
  const swU = tl.channel('swU', 0);
  const dimU = tl.channel('dimU', 0); // machine dims for the coda
  const doorU = tl.channel('doorU', 0); // three cages (windowed)
  const rejectU = tl.channel('rejectU', 0); // the bare call bounces
  const closeU = tl.channel('closeU', 0);

  // — beat 1 · code with expectations —
  tl.caption({
    at: 0.5,
    dur: 6.6,
    text: "You have Node code, and no Node. You can't just evaluate it — it expects require, module, filename, process: a whole world the browser never provides.",
  });
  tl.tween(srcU, 1, { at: 0.8, dur: 0.9, ease: ease.enter });
  tl.tween(noNodeU, 1, { at: 3.6, dur: 0.8, ease: ease.draw });
  tl.hold(7.1, 0.5);

  // — beat 2 · the wrapper press —
  tl.caption({
    at: 7.6,
    dur: 6.2,
    text: 'So the runtime builds the world around the code. Every module gets wrapped in a function that hands it that entire world as arguments.',
  });
  tl.tween(noNodeU, 0, { at: 7.8, dur: 0.7, ease: ease.move });
  tl.tween(pressU, 1, { at: 8.6, dur: 1.6, ease: ease.draw });
  tl.hold(13.8, 0.5);

  // — beat 3 · require fires —
  tl.caption({
    at: 14.3,
    dur: 3.6,
    text: 'Now watch what happens when the code calls require.',
  });
  tl.tween(cam, CAM_WIDE, { at: 14.4, dur: 1.3, ease: ease.move });
  tl.tween(line1Hot, 1, { at: 15.6, dur: 0.5, ease: ease.pop });
  tl.hold(17.9, 0.4);

  // — beat 4 · the shim table —
  tl.caption({
    at: 18.3,
    dur: 6.4,
    text: 'There is no folder of packages on disk, and no standard library underneath. The name is looked up in a table of shims — hand-written stand-ins, more than forty of them.',
  });
  tl.tween(cam, CAM_GRID, { at: 18.5, dur: 1.3, ease: ease.move });
  tl.tween(gridU, 1, { at: 18.9, dur: 2.6, ease: ease.linear });
  tl.tween(countU, 1, { at: 21.9, dur: 0.6, ease: ease.pop });
  tl.tween(rayHttp, 1, { at: 22.7, dur: 1.2, ease: ease.draw });
  tl.hold(25.1, 0.4);

  // — beat 5 · fs answers —
  tl.caption({
    at: 25.5,
    dur: 5.6,
    text: 'Ask for the filesystem module, and the shim you get is wired straight into the in-memory tree from last chapter.',
  });
  tl.tween(line1Hot, 0, { at: 25.6, dur: 0.5, ease: ease.move });
  tl.tween(rayHttp, 0, { at: 25.6, dur: 0.6, ease: ease.move });
  tl.tween(line2Hot, 1, { at: 26.2, dur: 0.5, ease: ease.pop });
  tl.tween(rayFs, 1, { at: 26.9, dur: 1.2, ease: ease.draw });
  tl.hold(31.5, 0.4);

  // — beat 6 · modules become requires —
  tl.caption({
    at: 31.9,
    dur: 6.0,
    text: 'Modern code arrives as modules, not requires. A syntax-tree pass rewrites the imports — even dynamic ones — into calls the wrapper knows how to serve.',
  });
  tl.tween(line2Hot, 0, { at: 32.0, dur: 0.5, ease: ease.move });
  tl.tween(rayFs, 0, { at: 32.0, dur: 0.6, ease: ease.move });
  tl.tween(cam, CAM_SRC, { at: 32.1, dur: 1.3, ease: ease.move });
  tl.tween(esmU, 1, { at: 32.8, dur: 1.0, ease: ease.enter });
  tl.hold(38.3, 0.5);

  // — beat 7 · the test —
  tl.caption({
    at: 38.8,
    dur: 4.6,
    text: 'Then the impression gets put to its real test. The code asks to listen on port three thousand.',
  });
  tl.tween(cam, CAM_SOCK, { at: 39.0, dur: 1.3, ease: ease.move });
  tl.tween(esmU, 0.15, { at: 39.0, dur: 0.8, ease: ease.move });
  tl.tween(line4Hot, 1, { at: 39.6, dur: 0.5, ease: ease.pop });
  tl.tween(sockU, 1, { at: 40.4, dur: 1.4, ease: ease.draw });
  tl.hold(43.8, 0.4);

  // — beat 8 · listen is a Map.set —
  tl.caption({
    at: 44.2,
    dur: 6.6,
    text: 'A real runtime would open a socket here. This one cannot — so listen quietly becomes a registration. The port and the server go into the bridge as a map entry.',
  });
  tl.tween(sockFade, 1, { at: 45.2, dur: 1.6, ease: ease.move });
  tl.tween(regRowU, 1, { at: 46.4, dur: 1.2, ease: ease.draw });
  tl.hold(51.2, 0.4);

  // — beat 9 · the announcement —
  tl.caption({
    at: 51.6,
    dur: 5.2,
    text: 'And a note goes out to the service worker: port three thousand exists now. Route accordingly.',
  });
  tl.tween(swU, 1, { at: 51.9, dur: 0.7, ease: ease.enter });
  tl.tween(pingU, 1, { at: 52.7, dur: 1.6, ease: ease.linear });
  tl.hold(57.2, 0.5);

  // — beat 10 · the three cages —
  tl.caption({
    at: 57.7,
    dur: 7.6,
    text: 'One question left: where does untrusted code actually run? You choose the cage — a cross-origin sandbox, a web worker, or, if you insist, the main thread itself. Refuse to choose, and the factory throws.',
  });
  tl.tween(cam, CAM_WIDE, { at: 57.9, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 58.0, dur: 1.1, ease: ease.move });
  tl.tween(doorU, 1, { at: 59.0, dur: 2.6, ease: ease.linear });
  tl.tween(rejectU, 1, { at: 63.2, dur: 0.9, ease: ease.pop });
  tl.hold(65.7, 0.4);

  // — beat 11 · the closer —
  tl.caption({
    at: 66.1,
    dur: 6.2,
    text: "It's an impression, not an emulation. But it's good enough that real tools fall for it — and next chapter, a real dev server does.",
  });
  tl.tween(rejectU, 0, { at: 66.3, dur: 0.6, ease: ease.move });
  tl.tween(doorU, 0.12, { at: 67.0, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 67.8, dur: 0.9, ease: ease.enter });
  tl.hold(71.7, 1.4);

  return {
    tl,
    cam,
    srcU,
    noNodeU,
    pressU,
    gridU,
    countU,
    rayHttp,
    rayFs,
    line1Hot,
    line2Hot,
    line4Hot,
    esmU,
    sockU,
    sockFade,
    regRowU,
    pingU,
    swU,
    dimU,
    doorU,
    rejectU,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const srcU = s.get(scene.srcU);
  const noNodeU = s.get(scene.noNodeU);
  const pressU = s.get(scene.pressU);
  const gridU = s.get(scene.gridU);
  const countU = s.get(scene.countU);
  const rayHttp = s.get(scene.rayHttp);
  const rayFs = s.get(scene.rayFs);
  const lineHot = [s.get(scene.line1Hot), s.get(scene.line2Hot), 0, s.get(scene.line4Hot)];
  const esmU = s.get(scene.esmU);
  const sockU = s.get(scene.sockU);
  const sockFade = s.get(scene.sockFade);
  const regRowU = s.get(scene.regRowU);
  const pingU = s.get(scene.pingU);
  const swU = s.get(scene.swU);
  const dimU = s.get(scene.dimU);
  const doorU = s.get(scene.doorU);
  const rejectU = s.get(scene.rejectU);
  const closeU = s.get(scene.closeU);
  const machineOp = 1 - 0.88 * dimU;

  const httpCell = shimPos(SHIM_HTTP);
  const fsCell = shimPos(SHIM_FS);
  const srcRight = { x: SRC.x + SRC.w, y: SRC.y + 34 };
  const srcRight2 = { x: SRC.x + SRC.w, y: SRC.y + 62 };

  // the server-registered ping: registry → SW badge
  const pingP = {
    x: lerp(REG.x + REG.w / 2, SW_BADGE.x, pingU),
    y: lerp(REG.y, SW_BADGE.y + 30, pingU),
  };

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={machineOp}>
          {/* the wrapper — prints around the source card */}
          <g opacity={pressU}>
            <rect
              x={SRC.x - 22}
              y={SRC.y - WRAP_PAD_TOP}
              width={SRC.w + 44}
              height={SRC.h + WRAP_PAD_TOP + WRAP_PAD_BOT}
              rx={14}
              fill="none"
              stroke={colors.SECONDARY}
              strokeWidth={1.6}
            />
            {WRAP_TOP.map((line, i) => (
              <text key={i} x={SRC.x - 6} y={SRC.y - WRAP_PAD_TOP + 22 + i * 18} fill={colors.SECONDARY} fontSize={12.5} fontFamily={MONO}>
                {line}
              </text>
            ))}
            <text x={SRC.x - 6} y={SRC.y + SRC.h + 24} fill={colors.SECONDARY} fontSize={12.5} fontFamily={MONO}>
              {WRAP_BOT}
            </text>
            <text x={SRC.x + SRC.w + 16} y={SRC.y - WRAP_PAD_TOP + 22} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
              runtime.ts
            </text>
          </g>

          {/* the source card */}
          <g opacity={srcU}>
            <rect x={SRC.x} y={SRC.y} width={SRC.w} height={SRC.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <text x={SRC.x + 16} y={SRC.y - 10} fill={colors.MUTED} fontSize={12} fontFamily={MONO} opacity={1 - pressU}>
              server.js
            </text>
            {SRC_LINES.map((line, i) => (
              <g key={i}>
                {lineHot[i] > 0.02 && (
                  <rect x={SRC.x + 8} y={SRC.y + 16 + i * 34} width={SRC.w - 16} height={28} rx={6} fill={colors.WARM} opacity={0.14 * lineHot[i]} />
                )}
                <text
                  x={SRC.x + 16}
                  y={SRC.y + 36 + i * 34}
                  fill={lineHot[i] > 0.3 ? colors.WARM : colors.TEXT}
                  fontSize={14}
                  fontFamily={MONO}
                >
                  {line}
                </text>
              </g>
            ))}
          </g>

          {/* "no Node here" strike */}
          <g opacity={noNodeU}>
            <rect x={SRC.x + 40} y={SRC.y + SRC.h + 28} width={295} height={34} rx={8} fill={colors.BG} stroke={colors.NEGATIVE} />
            <text x={SRC.x + 187} y={SRC.y + SRC.h + 50} textAnchor="middle" fill={colors.NEGATIVE} fontSize={13.5}>
              no process · no require · no sockets
            </text>
          </g>

          {/* the shim grid */}
          {SHIMS.map((name, i) => {
            const u = clamp01(gridU * (SHIMS.length + 2) - i);
            if (u <= 0) return null;
            const p = shimPos(i);
            const hot = (i === SHIM_HTTP && rayHttp > 0.6) || (i === SHIM_FS && rayFs > 0.6);
            return (
              <g key={name} opacity={u}>
                <rect
                  x={p.x - GRID.cellW / 2}
                  y={p.y - GRID.cellH / 2}
                  width={GRID.cellW}
                  height={GRID.cellH}
                  rx={9}
                  fill={colors.PANEL}
                  stroke={hot ? colors.WARM : colors.GRID}
                  strokeWidth={hot ? 2.2 : 1.2}
                />
                <text x={p.x} y={p.y + 5} textAnchor="middle" fill={hot ? colors.WARM : colors.TEXT} fontSize={13.5} fontFamily={MONO}>
                  {name}
                </text>
              </g>
            );
          })}
          <g opacity={countU}>
            <text x={GRID.x0 + 2 * (GRID.cellW + GRID.gapX)} y={GRID.y0 + 3 * (GRID.cellH + GRID.gapY) + 16} textAnchor="middle" fill={colors.MUTED} fontSize={14}>
              … 40+ shimmed modules
            </text>
            <text x={GRID.x0 + 2 * (GRID.cellW + GRID.gapX)} y={GRID.y0 - 24} textAnchor="middle" fill={colors.MUTED} fontSize={13} fontFamily={MONO}>
              {"require(name) → shims[name]"}
            </text>
          </g>

          {/* require rays */}
          <Connection from={srcRight} to={{ x: httpCell.x - GRID.cellW / 2, y: httpCell.y }} u={rayHttp} color={colors.WARM} label="require('http')" />
          <Connection from={srcRight2} to={{ x: fsCell.x - GRID.cellW / 2, y: fsCell.y }} u={rayFs} color={colors.POSITIVE} label="require('fs') → VirtualFS" />

          {/* the acorn rewrite station */}
          <g opacity={esmU}>
            <rect x={ESM.x} y={ESM.y} width={ESM.w} height={ESM.h} rx={10} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.3} />
            <text x={ESM.x + 16} y={ESM.y - 10} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              acorn AST · code-transforms.ts
            </text>
            <text x={ESM.x + 16} y={ESM.y + 32} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
              {"import x from 'y'  →  const x = require('y')"}
            </text>
            <text x={ESM.x + 16} y={ESM.y + 64} fill={colors.TEXT} fontSize={13} fontFamily={MONO}>
              {'import(  →  __dynamicImport('}
            </text>
          </g>

          {/* the socket that isn't */}
          <g opacity={sockU * (1 - sockFade)}>
            <circle cx={SOCK.cx} cy={SOCK.y} r={SOCK.r} fill="none" stroke={colors.WARM} strokeWidth={2} strokeDasharray="6 6" />
            <text x={SOCK.cx} y={SOCK.y - 4} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
              socket
            </text>
            <text x={SOCK.cx} y={SOCK.y + 16} textAnchor="middle" fill={colors.WARM} fontSize={13} fontFamily={MONO}>
              :3000
            </text>
          </g>
          {sockU > 0.1 && sockFade > 0.05 && sockFade < 0.98 && (
            <text x={SOCK.cx} y={SOCK.y + 5} textAnchor="middle" fill={colors.MUTED} fontSize={13} opacity={Math.sin(Math.PI * sockFade)}>
              never opens
            </text>
          )}

          {/* the bridge registry */}
          <g opacity={regRowU}>
            <rect x={REG.x} y={REG.y} width={REG.w} height={REG.h} rx={12} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.4} />
            <text x={REG.x + 18} y={REG.y + 28} fill={colors.TEXT} fontSize={14} fontWeight={600}>
              ServerBridge registry
            </text>
            <text x={REG.x + 18} y={REG.y + 52} fill={colors.MUTED} fontSize={12} fontFamily={MONO}>
              setServerListenCallback →
            </text>
            <rect x={REG.x + 14} y={REG.y + 62} width={REG.w - 28} height={30} rx={7} fill={colors.BG} stroke={colors.ACCENT} opacity={0.9} />
            <text x={REG.x + 26} y={REG.y + 82} fill={colors.ACCENT} fontSize={13} fontFamily={MONO}>
              {'servers.set(3000, server)'}
            </text>
          </g>
          <Connection
            from={{ x: SOCK.cx + SOCK.r + 6, y: SOCK.y }}
            to={{ x: REG.x - 6, y: REG.y + REG.h / 2 }}
            u={regRowU}
            color={colors.ACCENT}
            dashed
          />

          {/* the SW badge + the announcement ping */}
          <NodeBadge x={SW_BADGE.x} y={SW_BADGE.y} w={130} h={54} label="__sw__.js" sublabel="doorman" color={colors.WARM} u={swU} glow={pingU > 0.9 ? 1 : 0} />
          {pingU > 0 && pingU < 1 && (
            <g>
              <circle cx={pingP.x} cy={pingP.y} r={7} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.5} />
              <text x={pingP.x - 10} y={pingP.y - 13} textAnchor="end" fill={colors.WARM} fontSize={12} fontFamily={MONO}>
                {'server-registered {port: 3000}'}
              </text>
            </g>
          )}
        </g>

        {/* the three cages */}
        {DOORS.map((d, i) => {
          const u = clamp01(doorU * 3 - i);
          if (u <= 0) return null;
          const x = DOORS_X0 + i * (DOOR_W + DOOR_GAP);
          return (
            <g key={d.title} opacity={u}>
              <rect x={x} y={DOORS_Y - 12 * (1 - u)} width={DOOR_W} height={190} rx={14} fill={colors.PANEL} stroke={d.color} strokeWidth={1.5} />
              <rect x={x + 22} y={DOORS_Y + 24} width={44} height={70} rx={6} fill="none" stroke={d.color} strokeWidth={1.6} />
              <circle cx={x + 56} cy={DOORS_Y + 60} r={3} fill={d.color} />
              <text x={x + 84} y={DOORS_Y + 44} fill={colors.TEXT} fontSize={16} fontWeight={650}>
                {d.title}
              </text>
              <text x={x + 84} y={DOORS_Y + 68} fill={colors.MUTED} fontSize={12.5}>
                {d.note}
              </text>
              <text x={x + 22} y={DOORS_Y + 136} fill={d.color} fontSize={12.5} fontFamily={MONO}>
                {d.code}
              </text>
              <text x={x + 22} y={DOORS_Y + 162} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
                create-runtime.ts
              </text>
            </g>
          );
        })}

        {/* the bare call bounces */}
        <g opacity={rejectU}>
          <rect x={410} y={452} width={460} height={64} rx={10} fill={colors.BG} stroke={colors.NEGATIVE} strokeWidth={1.6} />
          <text x={640} y={478} textAnchor="middle" fill={colors.TEXT} fontSize={13.5} fontFamily={MONO}>
            createRuntime(vfs)
          </text>
          <text x={640} y={502} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5} fontFamily={MONO}>
            {"✗ throws: 'almostnode: For security…'"}
          </text>
        </g>

        {/* the closer */}
        <g opacity={closeU}>
          <rect x={340} y={430} width={600} height={104} rx={14} fill={colors.PANEL} stroke={colors.SECONDARY} strokeWidth={1.5} />
          <text x={640} y={476} textAnchor="middle" fill={colors.TEXT} fontSize={21} fontWeight={650}>
            An impression good enough to fool real tools
          </text>
          <text x={640} y={508} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
            {'wrap → require(shims) → listen() = registry.set()'}
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
