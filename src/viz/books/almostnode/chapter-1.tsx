// One Tab, Whole Stack
//
// Grounding: packages/almostnode — container.ts (createContainer wires
// VirtualFS + Runtime + ServerBridge), server-bridge.ts (getServerUrl →
// `${basePath}/__virtual__/${port}`, handleRequest dispatches by port,
// initServiceWorker + MessageChannel), public/__sw__.js (fetch listener,
// /^\/__virtual__\/(\d+)(\/.*)?$/ regex, base64 relay), and
// frameworks/vite-dev-server.ts (handleRequest answers from the VFS).
//
// Centerpiece: ONE request's round trip — iframe → service worker →
// ServerBridge → ViteDevServer → VirtualFS and back — with the camera
// following the packet hop by hop. The chapter opens on the illusion
// (`npm run dev` prints a URL, not a port) and closes on the book's map.
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
import { Connection, RequestFlow, ServiceNode, Zone } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

// ---------------------------------------------------------------------------
// Layout — 1280×720; the tab frame is the one boundary that never moves.
// ---------------------------------------------------------------------------

const TAB = { x: 70, y: 34, w: 1140, h: 578 } as const;

// phase A — the terminal, centered in the empty tab
const TERM = { x: 420, y: 200, w: 440, h: 150 } as const;
const CMD = '$ npm run dev';
const LOCAL_URL = '/__virtual__/3000/';

// phase B — the three actors
const Z_MAIN = { x: 100, y: 170, w: 440, h: 410 } as const;
const Z_SW = { x: 575, y: 255, w: 230, h: 215 } as const;
const Z_IFR = { x: 840, y: 170, w: 345, h: 410 } as const;

const VITE = { x: 205, y: 330 } as const;
const BRIDGE = { x: 440, y: 330 } as const;
const VFS = { x: 205, y: 480 } as const;
const SW = { x: 690, y: 330 } as const;
const IFR = { x: 1012, y: 290 } as const;

const REGEX_CHIP = { x: 690, y: 422, w: 196, h: 30 } as const;
const REG_CHIP = { x: 440, y: 422, w: 196, h: 30 } as const;

// the round trip: iframe → SW → bridge → vite (and back, via roundTrip).
// With RequestFlow defaults (dwell 0.12, turnDwell 0.08, 3 hops each way)
// the packet dwells at: SW fwd u∈[0.117,0.172] · bridge fwd u∈[0.288,0.343]
// · vite turn u∈[0.46,0.54] · SW return u∈[0.828,0.883].
const REQ_PATH = [IFR, SW, BRIDGE, VITE];
const U_AT_SW = 0.144;
const U_AT_BRIDGE = 0.315;
const U_AT_VITE = 0.5;

// mini page that paints inside the preview iframe when the response lands
const PAINT = { x: 898, y: 372, w: 230, h: 168 } as const;

// the closing map: the book's four layers
const LAYERS = [
  { label: 'a filesystem', sub: 'VirtualFS', color: colors.POSITIVE },
  { label: 'a runtime', sub: 'Runtime + shims', color: colors.SECONDARY },
  { label: 'a dev server', sub: 'ViteDevServer', color: colors.ACCENT },
  { label: 'a doorman', sub: '__sw__.js', color: colors.WARM },
] as const;
const LAYER_W = 236;
const LAYER_GAP = 26;
const LAYERS_X0 = (STAGE_W - (LAYER_W * 4 + LAYER_GAP * 3)) / 2;
const LAYERS_Y = 300;

// camera marks
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_TERM: CameraState = { x: 640, y: 260, k: 1.35 };
const CAM_RIGHT: CameraState = { x: 880, y: 320, k: 1.22 };
const CAM_LEFT: CameraState = { x: 430, y: 350, k: 1.22 };

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Timeline (~76s, eleven beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_WIDE, cameraInterp);

  const tabU = tl.channel('tabU', 0); // the browser-tab frame
  const termU = tl.channel('termU', 0); // terminal card
  const typeU = tl.channel('typeU', 0); // `npm run dev` types on
  const localU = tl.channel('localU', 0); // the Local: /__virtual__/3000/ line
  const urlGlow = tl.channel('urlGlow', 0); // spotlight on the odd URL
  const termOp = tl.channel('termOp', 1); // terminal fades at re-layout

  const uZoneMain = tl.channel('uZoneMain', 0);
  const uZoneSw = tl.channel('uZoneSw', 0);
  const uZoneIfr = tl.channel('uZoneIfr', 0);
  const uVite = tl.channel('uVite', 0);
  const uBridge = tl.channel('uBridge', 0);
  const uVfs = tl.channel('uVfs', 0);
  const uSw = tl.channel('uSw', 0);
  const uIfr = tl.channel('uIfr', 0);
  const uConnVfs = tl.channel('uConnVfs', 0); // vite ↔ vfs edge

  const reqU = tl.channel('reqU', 0); // THE round trip (piecewise)
  const regexU = tl.channel('regexU', 0); // regex chip enters
  const regexGlow = tl.channel('regexGlow', 0);
  const regU = tl.channel('regU', 0); // registry chip enters
  const bridgeGlow = tl.channel('bridgeGlow', 0);
  const viteGlow = tl.channel('viteGlow', 0);
  const vfsFlow = tl.channel('vfsFlow', 0); // dash flow on the vfs edge
  const paintU = tl.channel('paintU', 0); // page paints in the iframe
  const ifrGlow = tl.channel('ifrGlow', 0);

  const dimU = tl.channel('dimU', 0); // machine dims under the closer
  const layerU = tl.channel('layerU', 0); // four layer cards (windowed)
  const tabGlow = tl.channel('tabGlow', 0);

  // — beat 1 · the claim —
  tl.caption({
    at: 0.5,
    dur: 6.0,
    text: 'One browser tab. No operating system underneath, no disk, no network sockets — and it is about to run a full development server.',
  });
  tl.tween(tabU, 1, { at: 0.6, dur: 1.4, ease: ease.draw });
  tl.tween(cam, CAM_TERM, { at: 1.8, dur: 1.4, ease: ease.move });
  tl.tween(termU, 1, { at: 2.4, dur: 0.7, ease: ease.enter });
  tl.tween(typeU, 1, { at: 3.4, dur: 1.4, ease: ease.linear });
  tl.hold(6.5, 0.4);

  // — beat 2 · the address that is a path —
  tl.caption({
    at: 6.9,
    dur: 6.2,
    text: 'Type the dev command, and the server comes up like it always does. But look at the address it prints. That is not a port. That is a path.',
  });
  tl.tween(localU, 1, { at: 7.4, dur: 1.0, ease: ease.enter });
  tl.tween(urlGlow, 1, { at: 9.8, dur: 0.6, ease: ease.pop });
  tl.tween(urlGlow, 0, { at: 12.2, dur: 0.7, ease: ease.move });
  tl.hold(13.1, 0.4);

  // — beat 3 · the three actors —
  tl.caption({
    at: 13.5,
    dur: 6.8,
    text: "Because inside this one tab live three actors: the main thread, where all the real code runs, a service worker, and a preview iframe that thinks it's a browser visiting a website.",
  });
  tl.tween(cam, CAM_WIDE, { at: 13.7, dur: 1.4, ease: ease.move });
  tl.tween(termOp, 0, { at: 13.7, dur: 1.0, ease: ease.move });
  stagger(3, { at: 14.6, each: 0.4, dur: 1.2, ease: ease.draw }).forEach((o, i) =>
    tl.tween([uZoneMain, uZoneSw, uZoneIfr][i], 1, o),
  );
  stagger(5, { at: 15.4, each: 0.3, dur: 0.6, ease: ease.enter }).forEach((o, i) =>
    tl.tween([uVite, uBridge, uVfs, uSw, uIfr][i], 1, o),
  );
  tl.tween(uConnVfs, 1, { at: 17.2, dur: 0.9, ease: ease.draw });
  tl.hold(20.3, 0.5);

  // — beat 4 · the fetch —
  tl.caption({
    at: 20.8,
    dur: 4.8,
    text: 'The iframe asks for the page the only way a browser can ask for anything — a plain fetch.',
  });
  tl.tween(cam, CAM_RIGHT, { at: 20.9, dur: 1.2, ease: ease.move });
  tl.tween(ifrGlow, 1, { at: 21.2, dur: 0.4, ease: ease.enter });
  tl.tween(ifrGlow, 0, { at: 22.4, dur: 0.7, ease: ease.move });
  tl.tween(reqU, U_AT_SW, { at: 22.4, dur: 2.2, ease: ease.linear }); // → stalls on the SW
  tl.hold(25.2, 0.4);

  // — beat 5 · the interception —
  tl.caption({
    at: 25.6,
    dur: 5.4,
    text: 'The service worker intercepts it before any network is involved. One regular expression reads the port number right out of the path.',
  });
  tl.tween(regexU, 1, { at: 26.2, dur: 0.5, ease: ease.pop });
  tl.tween(regexGlow, 1, { at: 27.0, dur: 0.4, ease: ease.enter });
  tl.tween(regexGlow, 0, { at: 29.6, dur: 0.7, ease: ease.move });
  tl.hold(31.0, 0.4);

  // — beat 6 · the relay —
  tl.caption({
    at: 31.4,
    dur: 5.4,
    text: 'There is no network to forward it on. So the worker relays the request over a message channel — a private pipe back to the main thread.',
  });
  tl.tween(reqU, U_AT_BRIDGE, { at: 32.2, dur: 2.4, ease: ease.linear }); // → stalls on the bridge
  tl.tween(cam, CAM_LEFT, { at: 33.0, dur: 1.4, ease: ease.move });
  tl.hold(36.8, 0.4);

  // — beat 7 · the dispatch —
  tl.caption({
    at: 37.2,
    dur: 5.6,
    text: 'On the main thread, the server bridge looks up port three thousand in a plain map, and hands the request to whoever registered it.',
  });
  tl.tween(bridgeGlow, 1, { at: 37.6, dur: 0.4, ease: ease.enter });
  tl.tween(regU, 1, { at: 38.2, dur: 0.5, ease: ease.pop });
  tl.tween(bridgeGlow, 0, { at: 41.4, dur: 0.7, ease: ease.move });
  tl.hold(42.8, 0.4);

  // — beat 8 · the answer —
  tl.caption({
    at: 43.2,
    dur: 5.6,
    text: 'That someone is the dev server. It builds the response straight out of a filesystem that lives entirely in memory. Nothing spins. Nothing listens.',
  });
  tl.tween(reqU, U_AT_VITE, { at: 43.6, dur: 1.6, ease: ease.linear }); // the turn
  tl.tween(viteGlow, 1, { at: 44.6, dur: 0.4, ease: ease.enter });
  tl.tween(vfsFlow, 3, { at: 45.0, dur: 2.4, ease: ease.linear });
  tl.tween(viteGlow, 0, { at: 47.6, dur: 0.7, ease: ease.move });
  tl.hold(48.8, 0.3);

  // — beat 9 · the retrace —
  tl.caption({
    at: 49.1,
    dur: 5.4,
    text: 'The answer retraces every hop, encoded as plain text, and the worker dresses it up as a genuine network response.',
  });
  tl.tween(cam, CAM_WIDE, { at: 49.3, dur: 1.4, ease: ease.move });
  tl.tween(reqU, 1, { at: 49.7, dur: 4.2, ease: ease.linear }); // all the way home
  tl.hold(54.4, 0.3);

  // — beat 10 · the paint —
  tl.caption({
    at: 54.7,
    dur: 6.2,
    text: 'The iframe paints. It believed it was talking to a server, and it was right — the server just happens to be the same tab it lives in.',
  });
  tl.tween(paintU, 1, { at: 55.1, dur: 1.2, ease: ease.linear });
  tl.tween(ifrGlow, 1, { at: 56.4, dur: 0.4, ease: ease.pop });
  tl.tween(ifrGlow, 0, { at: 57.8, dur: 0.8, ease: ease.move });
  tl.hold(61.2, 0.5);

  // — beat 11 · the map of the book —
  tl.caption({
    at: 61.7,
    dur: 7.0,
    text: 'That illusion has four layers: a filesystem, a runtime, a dev server, and a doorman. This book takes them one at a time.',
  });
  tl.tween(dimU, 1, { at: 61.9, dur: 1.2, ease: ease.move });
  tl.tween(layerU, 1, { at: 63.0, dur: 3.2, ease: ease.linear });
  tl.tween(tabGlow, 1, { at: 66.6, dur: 0.9, ease: ease.pulse });
  tl.tween(tabGlow, 0, { at: 68.6, dur: 1.4, ease: ease.pulse });
  tl.hold(69.6, 1.6);

  return {
    tl,
    cam,
    tabU,
    termU,
    typeU,
    localU,
    urlGlow,
    termOp,
    uZoneMain,
    uZoneSw,
    uZoneIfr,
    uVite,
    uBridge,
    uVfs,
    uSw,
    uIfr,
    uConnVfs,
    reqU,
    regexU,
    regexGlow,
    regU,
    bridgeGlow,
    viteGlow,
    vfsFlow,
    paintU,
    ifrGlow,
    dimU,
    layerU,
    tabGlow,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const tabU = s.get(scene.tabU);
  const termU = s.get(scene.termU) * s.get(scene.termOp);
  const typeU = s.get(scene.typeU);
  const localU = s.get(scene.localU);
  const urlGlow = s.get(scene.urlGlow);
  const dimU = s.get(scene.dimU);
  const machineOp = 1 - 0.88 * dimU;
  const reqU = s.get(scene.reqU);
  const regexGlow = s.get(scene.regexGlow);
  const bridgeGlow = s.get(scene.bridgeGlow);
  const viteGlow = s.get(scene.viteGlow);
  const ifrGlow = s.get(scene.ifrGlow);
  const paintU = s.get(scene.paintU);
  const layerU = s.get(scene.layerU);
  const tabGlow = s.get(scene.tabGlow);

  const cmdShown = CMD.slice(0, Math.round(typeU * CMD.length));

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        {/* the browser tab — the one boundary that never moves */}
        <g opacity={tabU}>
          <rect
            x={TAB.x}
            y={TAB.y}
            width={TAB.w}
            height={TAB.h}
            rx={16}
            fill="none"
            stroke={tabGlow > 0.02 ? colors.WARM : colors.GRID}
            strokeWidth={1.6 + 1.6 * tabGlow}
          />
          <circle cx={TAB.x + 24} cy={TAB.y + 20} r={5} fill={colors.NEGATIVE} opacity={0.7} />
          <circle cx={TAB.x + 44} cy={TAB.y + 20} r={5} fill={colors.WARM} opacity={0.7} />
          <circle cx={TAB.x + 64} cy={TAB.y + 20} r={5} fill={colors.POSITIVE} opacity={0.7} />
          <text x={TAB.x + 90} y={TAB.y + 25} fill={colors.MUTED} fontSize={13}>
            one browser tab
          </text>
        </g>

        {/* phase A — the terminal */}
        <g opacity={termU}>
          <rect x={TERM.x} y={TERM.y} width={TERM.w} height={TERM.h} rx={12} fill={colors.PANEL} stroke={colors.GRID} />
          <text x={TERM.x + 24} y={TERM.y + 44} fill={colors.TEXT} fontSize={19} fontFamily={MONO}>
            {cmdShown}
            {typeU > 0 && typeU < 1 ? '▌' : ''}
          </text>
          <g opacity={localU}>
            <text x={TERM.x + 24} y={TERM.y + 84} fill={colors.MUTED} fontSize={15} fontFamily={MONO}>
              ➜ Local:
            </text>
            <rect
              x={TERM.x + 104}
              y={TERM.y + 66}
              width={196}
              height={28}
              rx={7}
              fill="none"
              stroke={colors.WARM}
              strokeWidth={1.4 + 1.6 * urlGlow}
              opacity={0.25 + 0.75 * urlGlow}
            />
            <text x={TERM.x + 114} y={TERM.y + 84} fill={urlGlow > 0.3 ? colors.WARM : colors.ACCENT} fontSize={15} fontFamily={MONO}>
              {LOCAL_URL}
            </text>
            <text x={TERM.x + 24} y={TERM.y + 118} fill={colors.MUTED} fontSize={13} fontFamily={MONO} opacity={0.8}>
              ready in 213 ms
            </text>
          </g>
        </g>

        {/* phase B — the three actors */}
        <g opacity={machineOp}>
          <Zone
            x={Z_MAIN.x}
            y={Z_MAIN.y}
            w={Z_MAIN.w}
            h={Z_MAIN.h}
            label="main thread"
            kind="group"
            u={s.get(scene.uZoneMain)}
          />
          <Zone
            x={Z_SW.x}
            y={Z_SW.y}
            w={Z_SW.w}
            h={Z_SW.h}
            label="service worker"
            kind="group"
            u={s.get(scene.uZoneSw)}
            color={colors.WARM}
          />
          <Zone
            x={Z_IFR.x}
            y={Z_IFR.y}
            w={Z_IFR.w}
            h={Z_IFR.h}
            label="preview iframe"
            kind="group"
            u={s.get(scene.uZoneIfr)}
            color={colors.SECONDARY}
          />

          <Connection
            from={{ x: VITE.x, y: VITE.y + 28 }}
            to={{ x: VFS.x, y: VFS.y - 28 }}
            u={s.get(scene.uConnVfs)}
            flow={s.get(scene.vfsFlow)}
            label="readFileSync"
            color={colors.POSITIVE}
          />

          <ServiceNode
            x={VITE.x}
            y={VITE.y}
            kind="server"
            label="ViteDevServer"
            sublabel="vite-dev-server.ts"
            u={s.get(scene.uVite)}
            glow={viteGlow}
          />
          <ServiceNode
            x={BRIDGE.x}
            y={BRIDGE.y}
            kind="gateway"
            label="ServerBridge"
            sublabel="server-bridge.ts"
            u={s.get(scene.uBridge)}
            glow={bridgeGlow}
          />
          <ServiceNode
            x={VFS.x}
            y={VFS.y}
            kind="db"
            label="VirtualFS"
            sublabel="in-memory tree"
            u={s.get(scene.uVfs)}
          />
          <ServiceNode
            x={SW.x}
            y={SW.y}
            kind="fn"
            label="__sw__.js"
            sublabel="fetch listener"
            u={s.get(scene.uSw)}
            glow={regexGlow}
          />
          <ServiceNode
            x={IFR.x}
            y={IFR.y}
            kind="browser"
            label="preview"
            sublabel="iframe"
            u={s.get(scene.uIfr)}
            glow={ifrGlow}
          />

          {/* the regex chip under the SW */}
          <g opacity={s.get(scene.regexU)}>
            <rect
              x={REGEX_CHIP.x - REGEX_CHIP.w / 2}
              y={REGEX_CHIP.y - REGEX_CHIP.h / 2}
              width={REGEX_CHIP.w}
              height={REGEX_CHIP.h}
              rx={8}
              fill={colors.BG}
              stroke={regexGlow > 0.1 ? colors.WARM : colors.GRID}
              strokeWidth={1.2 + regexGlow}
            />
            <text x={REGEX_CHIP.x} y={REGEX_CHIP.y + 5} textAnchor="middle" fill={regexGlow > 0.1 ? colors.WARM : colors.MUTED} fontSize={13} fontFamily={MONO}>
              {'/__virtual__/(\\d+)/'}
            </text>
          </g>

          {/* the bridge's registry row */}
          <g opacity={s.get(scene.regU)}>
            <rect
              x={REG_CHIP.x - REG_CHIP.w / 2}
              y={REG_CHIP.y - REG_CHIP.h / 2}
              width={REG_CHIP.w}
              height={REG_CHIP.h}
              rx={8}
              fill={colors.BG}
              stroke={bridgeGlow > 0.1 ? colors.ACCENT : colors.GRID}
              strokeWidth={1.2 + bridgeGlow}
            />
            <text x={REG_CHIP.x} y={REG_CHIP.y + 5} textAnchor="middle" fill={bridgeGlow > 0.1 ? colors.ACCENT : colors.MUTED} fontSize={13} fontFamily={MONO}>
              {'servers: 3000 → vite'}
            </text>
          </g>

          {/* THE round trip */}
          <RequestFlow
            path={REQ_PATH}
            u={reqU}
            roundTrip
            label="GET /"
            responseLabel="200 · base64"
            color={colors.ACCENT}
            responseColor={colors.POSITIVE}
          />

          {/* the page paints */}
          <g opacity={paintU}>
            <rect x={PAINT.x} y={PAINT.y} width={PAINT.w} height={PAINT.h} rx={10} fill={colors.PANEL} stroke={colors.GRID} />
            <rect x={PAINT.x + 14} y={PAINT.y + 14} width={PAINT.w - 28} height={22} rx={5} fill={colors.ACCENT} opacity={0.75 * clamp01(paintU * 2)} />
            <rect x={PAINT.x + 14} y={PAINT.y + 48} width={(PAINT.w - 28) * 0.85} height={10} rx={4} fill={colors.MUTED} opacity={0.5 * clamp01(paintU * 2 - 0.4)} />
            <rect x={PAINT.x + 14} y={PAINT.y + 66} width={(PAINT.w - 28) * 0.6} height={10} rx={4} fill={colors.MUTED} opacity={0.5 * clamp01(paintU * 2 - 0.7)} />
            <rect x={PAINT.x + 14} y={PAINT.y + 92} width={96} height={30} rx={8} fill="none" stroke={colors.POSITIVE} opacity={clamp01(paintU * 2 - 1)} />
            <text
              x={PAINT.x + 62}
              y={PAINT.y + 112}
              textAnchor="middle"
              fill={colors.POSITIVE}
              fontSize={13}
              fontFamily={MONO}
              opacity={clamp01(paintU * 2 - 1)}
            >
              count: 0
            </text>
          </g>
        </g>

        {/* the closing map — four layers, windowed entrances */}
        {LAYERS.map((l, i) => {
          const u = clamp01(layerU * 4 - i);
          if (u <= 0) return null;
          const x = LAYERS_X0 + i * (LAYER_W + LAYER_GAP);
          return (
            <g key={l.label} opacity={u}>
              <rect x={x} y={LAYERS_Y - 14 * (1 - u)} width={LAYER_W} height={110} rx={12} fill={colors.PANEL} stroke={l.color} strokeWidth={1.5} />
              <text x={x + 20} y={LAYERS_Y + 34} fill={colors.MUTED} fontSize={13}>
                chapter {i + 2}
              </text>
              <text x={x + 20} y={LAYERS_Y + 62} fill={colors.TEXT} fontSize={19} fontWeight={650}>
                {l.label}
              </text>
              <text x={x + 20} y={LAYERS_Y + 86} fill={l.color} fontSize={13} fontFamily={MONO}>
                {l.sub}
              </text>
            </g>
          );
        })}
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
