import { CAMERA_HOME, Timeline, ease, stagger } from '../../core';
import type { CameraState } from '../../core';

/**
 * almostnode — A Server Made of Tab.
 *
 * How @agent-wasm/core runs a full Node.js dev environment inside one browser
 * tab: createContainer() wires a RAM-only VirtualFS + a shim Runtime + a
 * shared ServerBridge; a service worker intercepts /__virtual__/<port>/
 * fetches and relays them over a MessageChannel to the MAIN THREAD, which
 * answers. Everything below is grounded in the almostnode source
 * (container.ts, virtual-fs.ts, transform.ts, __sw__.js).
 *
 * Pure timeline builder + all layout data at module scope — every frame is a
 * function of the sampled channels (the scrubbability invariant).
 */

export interface Pt {
  x: number;
  y: number;
}

export const lerpPt = (a: Pt, b: Pt, u: number): Pt => ({
  x: a.x + (b.x - a.x) * u,
  y: a.y + (b.y - a.y) * u,
});

export const clamp01 = (u: number) => (u < 0 ? 0 : u > 1 ? 1 : u);

/* --------------------------------------------------------------------- */
/* Layout — 1280×720 stage; captions own the bottom ~12% (y ≳ 633).       */
/* --------------------------------------------------------------------- */

/** The one boundary that never moves: the browser tab. */
export const TAB = { x: 70, y: 36, w: 1140, h: 580 };

/* ---- layout A (beats 1–2): the container --------------------------- */

export const TERM = { cx: 640, cy: 112, w: 430, h: 56 };
export const TERM_CMD = '$ node server.js';
export const CC_CHIP = { x: 640, y: 200, w: 168, h: 28 }; // createContainer()

export const VFS_A: Pt = { x: 250, y: 286 };
export const RT: Pt = { x: 640, y: 286 };
export const BR_A: Pt = { x: 1030, y: 286 };

/** FSNode mini-tree under VirtualFS: root '/' → { server.js, package.json }. */
export const TREE_ROOT = { x: 250, y: 388, w: 46 };
export const TREE_SRV = { x: 166, y: 456, w: 96 };
export const TREE_PKG = { x: 344, y: 456, w: 112 };

/** Shim-module grid (all names verified: fs/http/net/crypto/stream/zlib/vm/worker_threads/esbuild). */
export const SHIMS = ['fs', 'http', 'net', 'crypto', 'stream', 'zlib', 'vm', 'worker_threads', 'esbuild', '···'];
export const GRID = { cols: [470, 586, 702, 818, 934], rows: [386, 428], chipW: 106, chipH: 30 };
export const GRID_COUNT_AT = { x: 1006, y: 412 };

/** esbuild-wasm transpile row: TS/JSX chip → esbuild-wasm → JS chip. */
export const ESB = { x: 790, y: 548, w: 188, h: 46 };
export const TS_CHIP = { x: 592, y: 548, w: 92, h: 28 };
export const JS_CHIP = { x: 984, y: 548, w: 60, h: 28 };

/* ---- layout B (beats 3–5): the interception relay ------------------- */

export const IDE_ZONE = { x: 96, y: 170, w: 470, h: 396 };
export const SW_ZONE = { x: 600, y: 250, w: 260, h: 220 };
export const IFR_ZONE = { x: 894, y: 170, w: 286, h: 396 };

export const VITE: Pt = { x: 200, y: 330 };
export const BR_B: Pt = { x: 460, y: 330 };
export const VFS_B: Pt = { x: 200, y: 470 };
export const SW: Pt = { x: 730, y: 330 };
export const IFR: Pt = { x: 1037, y: 290 };
export const REGEX_CHIP = { x: 730, y: 418, w: 176, h: 28 };

/** Edge endpoints (node borders), so arrows land on faces, not centers. */
export const CONN_FETCH = { from: { x: 949, y: 300 }, to: { x: 812, y: 324 } };
export const CONN_MC = { from: { x: 650, y: 330 }, to: { x: 544, y: 330 } };
export const CONN_HANDLE = { from: { x: 376, y: 330 }, to: { x: 284, y: 330 } };
export const CONN_VFS = { from: { x: 200, y: 358 }, to: { x: 200, y: 442 } };

/**
 * The relay path: preview iframe → __sw__.js → ServerBridge → Vite, and
 * (roundTrip) back. With RequestFlow's defaults (dwell 0.12, turnDwell 0.08,
 * 3 hops each way) the packet is AT:
 *   SW forward      u ∈ [0.117, 0.172]
 *   Bridge forward  u ∈ [0.288, 0.343]
 *   Vite (turn)     u ∈ [0.460, 0.540]
 *   SW return       u ∈ [0.828, 0.883]
 * — glow cues below are timed to those windows.
 */
export const REQ_PATH: Pt[] = [IFR, SW, BR_B, VITE];

/** Mid-dwell point of the forward SW window — where the beat-5 request stalls. */
export const STALL_U = 0.144;

/** Isolation headers the SW stamps on EVERY response (coi-serviceworker pattern). */
export const HDRS = [
  { text: 'COEP: credentialless', y: 128, w: 158 },
  { text: 'COOP: same-origin', y: 162, w: 140 },
  { text: 'CORP: cross-origin', y: 196, w: 144 },
];
export const HDR_XFO = { text: 'X-Frame-Options', y: 230, w: 128 };
export const HDR_X = 730;

/** Mini page that "paints" inside the preview iframe when the response lands. */
export const PAINT = { x: 947, y: 396, w: 180, h: 124 };

export const T_TOTAL = 84.6;

/* --------------------------------------------------------------------- */
/* The timeline.                                                          */
/* --------------------------------------------------------------------- */

export function buildScene() {
  const tl = new Timeline();

  // beat 1 — the claim
  const tabU = tl.channel('tabU', 0);
  const termU = tl.channel('termU', 0);
  const typeU = tl.channel('typeU', 0);

  // beat 2 — the container
  const ccU = tl.channel('ccU', 0); // createContainer() chip
  const wireU = tl.channel('wireU', 0); // chip → three nodes
  const uVfs = tl.channel('uVfs', 0);
  const uRt = tl.channel('uRt', 0);
  const uBridge = tl.channel('uBridge', 0);
  const treeU = tl.channel('treeU', 0); // FSNode tree draw-on
  const readU = tl.channel('readU', 0); // readFileSync packet
  const walkU = tl.channel('walkU', 0); // root → children Map → server.js
  const retU = tl.channel('retU', 0); // Uint8Array packet back
  const gridU = tl.channel('gridU', 0); // shim grid + ~75 counter
  const esbNodeU = tl.channel('esbNodeU', 0);
  const esbU = tl.channel('esbU', 0); // TS → esbuild-wasm → JS

  // beat 3 — the relay
  const layoutU = tl.channel('layoutU', 0); // A → B re-layout
  const uZoneIde = tl.channel('uZoneIde', 0);
  const uZoneSw = tl.channel('uZoneSw', 0);
  const uZoneIfr = tl.channel('uZoneIfr', 0);
  const uVite = tl.channel('uVite', 0);
  const uSw = tl.channel('uSw', 0);
  const uIfr = tl.channel('uIfr', 0);
  const regexU = tl.channel('regexU', 0);
  const uConnFetch = tl.channel('uConnFetch', 0);
  const uConnMc = tl.channel('uConnMc', 0);
  const uConnHandle = tl.channel('uConnHandle', 0);
  const uConnVfs = tl.channel('uConnVfs', 0);
  const regU = tl.channel('regU', 0); // register-with-bridge packet
  const viteGlow = tl.channel('viteGlow', 0);
  const reqU = tl.channel('reqU', 0); // THE round trip
  const regexGlow = tl.channel('regexGlow', 0);
  const bridgeGlow = tl.channel('bridgeGlow', 0);
  const vfsGlow = tl.channel('vfsGlow', 0);
  const paintU = tl.channel('paintU', 0);
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);

  // beat 4 — the header stamp
  const hdr = [0, 1, 2, 3].map((i) => tl.channel(`hdr${i}`, 0));
  const strikeU = tl.channel('strikeU', 0); // X-Frame-Options struck out
  const hdrOp = tl.channel('hdrOp', 1);

  // beat 5 — resurrection
  const swDead = tl.channel('swDead', 0);
  const mcDim = tl.channel('mcDim', 0);
  const stallU = tl.channel('stallU', 0); // the stalled request
  const needsInitU = tl.channel('needsInitU', 0); // sw-needs-init broadcast
  const freshU = tl.channel('freshU', 0); // fresh MessageChannel port draw
  const freshOp = tl.channel('freshOp', 1);
  const ifrGlow = tl.channel('ifrGlow', 0);

  // beat 6 — closer
  const tabGlow = tl.channel('tabGlow', 0);

  /* ---- beat 1: the claim (0 – 8.2) ---------------------------------- */
  tl.tween(tabU, 1, { at: 0.3, dur: 1.4, ease: ease.draw });
  tl.caption({ at: 0.5, dur: 4.0, text: 'One browser tab. No operating system, no disk, no network card.' });
  tl.tween(termU, 1, { at: 1.8, dur: 0.6, ease: ease.enter });
  tl.tween(typeU, 1, { at: 2.6, dur: 1.4, ease: ease.linear });
  tl.caption({ at: 4.7, dur: 3.3, text: 'And yet — node server.js. Something in here is about to start serving.' });
  tl.hold(8.0, 0.2);

  /* ---- beat 2: the container (8.2 – 32.4) ---------------------------- */
  tl.caption({
    at: 8.2,
    dur: 4.4,
    text: 'createContainer() wires three parts into the tab: a filesystem, a runtime, and a bridge.',
  });
  tl.tween(ccU, 1, { at: 8.5, dur: 0.5, ease: ease.pop });
  stagger(3, { at: 9.3, each: 0.45, dur: 0.65, ease: ease.enter }).forEach((o, i) =>
    tl.tween([uVfs, uRt, uBridge][i], 1, o),
  );
  tl.tween(wireU, 1, { at: 9.5, dur: 1.5, ease: ease.draw });
  tl.hold(12.8, 0.2);

  tl.caption({
    at: 13.0,
    dur: 5.0,
    text: "require('fs').readFileSync is a walk: FSNode → children Map → FSNode. The file is a Uint8Array.",
  });
  tl.tween(treeU, 1, { at: 13.2, dur: 1.5, ease: ease.draw });
  tl.tween(readU, 1, { at: 14.9, dur: 1.4, ease: ease.linear });
  tl.tween(walkU, 1, { at: 16.4, dur: 1.5, ease: ease.linear });
  tl.tween(retU, 1, { at: 18.0, dur: 1.4, ease: ease.linear });
  tl.caption({
    at: 18.4,
    dur: 3.9,
    text: 'No disk ever spins. The filesystem is a data structure that never leaves memory.',
  });
  tl.hold(22.3, 0.3);

  tl.caption({
    at: 22.6,
    dur: 5.0,
    text: 'require() answers from ~75 hand-built shims — a standard library doing a Node impression.',
  });
  tl.tween(gridU, 1, { at: 22.9, dur: 2.8, ease: ease.linear });
  tl.caption({
    at: 27.8,
    dur: 4.2,
    text: 'TypeScript in, JavaScript out — esbuild-wasm, cached on the window, does the translating.',
  });
  tl.tween(esbNodeU, 1, { at: 27.9, dur: 0.6, ease: ease.enter });
  tl.tween(esbU, 1, { at: 28.8, dur: 2.6, ease: ease.linear });
  tl.hold(32.0, 0.4);

  /* ---- beat 3: THE RELAY (32.4 – 56.2) -------------------------------- */
  tl.caption({
    at: 32.4,
    dur: 4.6,
    text: "Now the trick. Three actors share the tab: the IDE's main thread, a service worker, and a preview iframe.",
  });
  tl.tween(layoutU, 1, { at: 32.6, dur: 1.5, ease: ease.move });
  stagger(3, { at: 34.2, each: 0.35, dur: 1.1, ease: ease.draw }).forEach((o, i) =>
    tl.tween([uZoneIde, uZoneSw, uZoneIfr][i], 1, o),
  );
  stagger(3, { at: 34.7, each: 0.35, dur: 0.6, ease: ease.enter }).forEach((o, i) =>
    tl.tween([uVite, uSw, uIfr][i], 1, o),
  );
  tl.tween(regexU, 1, { at: 35.7, dur: 0.5, ease: ease.pop });
  stagger(4, { at: 35.3, each: 0.25, dur: 0.9, ease: ease.draw }).forEach((o, i) =>
    tl.tween([uConnHandle, uConnVfs, uConnMc, uConnFetch][i], 1, o),
  );

  tl.caption({
    at: 37.4,
    dur: 4.4,
    text: "Vite 'listens' on port 3000. There is no port 3000 — it just registers with the ServerBridge.",
  });
  tl.tween(viteGlow, 1, { at: 37.6, dur: 0.4, ease: ease.enter });
  tl.tween(regU, 1, { at: 37.9, dur: 1.5, ease: ease.linear });
  tl.tween(viteGlow, 0, { at: 40.4, dur: 0.7, ease: ease.move });
  tl.hold(42.0, 0.3);

  // One linear channel drives the whole round trip (10.5s): the glow cues
  // below land inside the dwell windows documented at REQ_PATH.
  tl.tween(reqU, 1, { at: 42.6, dur: 10.5, ease: ease.linear });
  tl.caption({
    at: 42.4,
    dur: 2.4,
    text: 'The iframe fetches /__virtual__/3000/. The service worker intercepts — one regex match…',
  });
  tl.tween(regexGlow, 1, { at: 43.7, dur: 0.4, ease: ease.enter }); // SW fwd: 43.8–44.4
  tl.tween(regexGlow, 0, { at: 44.9, dur: 0.7, ease: ease.move });
  tl.caption({
    at: 44.9,
    dur: 2.8,
    text: '…and relays it over a MessageChannel, to the ServerBridge on the main thread.',
  });
  tl.tween(bridgeGlow, 1, { at: 45.5, dur: 0.4, ease: ease.enter }); // Bridge fwd: 45.6–46.2
  tl.tween(bridgeGlow, 0, { at: 46.9, dur: 0.7, ease: ease.move });
  tl.caption({
    at: 47.9,
    dur: 3.4,
    text: 'Vite answers straight out of the in-memory filesystem; the response retraces every hop as base64.',
  });
  tl.tween(viteGlow, 1, { at: 47.3, dur: 0.4, ease: ease.enter }); // Vite turn: 47.4–48.3
  tl.tween(viteGlow, 0, { at: 48.7, dur: 0.7, ease: ease.move });
  tl.tween(vfsGlow, 1, { at: 47.5, dur: 0.4, ease: ease.enter });
  tl.tween(vfsGlow, 0, { at: 49.0, dur: 0.7, ease: ease.move });
  tl.caption({
    at: 51.5,
    dur: 4.3,
    text: "The worker intercepts, but the main thread answers. The tab believes there's a server. There is — it's the tab.",
  });
  tl.tween(paintU, 1, { at: 52.9, dur: 1.0, ease: ease.linear }); // lands: 53.1
  tl.hold(55.8, 0.4);

  /* ---- beat 4: the header stamp (56.2 – 65.8) -------------------------- */
  tl.tween(cam, { x: 718, y: 248, k: 1.5 }, { at: 56.3, dur: 1.2, ease: ease.move });
  tl.caption({
    at: 56.4,
    dur: 4.4,
    text: 'On the way out, the worker stamps every response with the cross-origin-isolation headers.',
  });
  stagger(4, { at: 57.8, each: 0.5, dur: 0.5, ease: ease.pop }).forEach((o, i) => tl.tween(hdr[i], 1, o));
  tl.caption({
    at: 61.2,
    dur: 4.6,
    text: 'X-Frame-Options and CSP? Stripped. The page turns crossOriginIsolated — WASM and workers unlock, even on a static host.',
  });
  tl.tween(strikeU, 1, { at: 61.5, dur: 0.5, ease: ease.draw });
  tl.tween(cam, CAMERA_HOME, { at: 64.9, dur: 1.2, ease: ease.move });
  tl.tween(hdrOp, 0, { at: 64.9, dur: 0.8, ease: ease.move });
  tl.hold(65.8, 0.2);

  /* ---- beat 5: resurrection (66.0 – 78.7) ------------------------------ */
  tl.caption({
    at: 66.0,
    dur: 4.0,
    text: 'Then the browser, unsentimental, kills the idle worker. The message port dies with it.',
  });
  tl.tween(swDead, 1, { at: 66.3, dur: 0.8, ease: ease.move });
  tl.tween(mcDim, 1, { at: 66.6, dur: 0.8, ease: ease.move });
  tl.tween(stallU, STALL_U, { at: 67.6, dur: 1.6, ease: ease.linear }); // stalls ON the SW

  tl.caption({
    at: 70.2,
    dur: 4.4,
    text: 'The next fetch wakes it. It broadcasts sw-needs-init, and the bridge hands over a fresh port.',
  });
  tl.tween(swDead, 0, { at: 70.5, dur: 0.6, ease: ease.move });
  tl.tween(needsInitU, 1, { at: 71.2, dur: 1.3, ease: ease.linear });
  tl.tween(freshU, 1, { at: 72.6, dur: 0.9, ease: ease.draw });
  tl.tween(mcDim, 0, { at: 73.5, dur: 0.6, ease: ease.move });
  tl.tween(freshOp, 0, { at: 74.5, dur: 0.9, ease: ease.move });
  tl.tween(stallU, 1, { at: 74.0, dur: 3.4, ease: ease.linear }); // completes: lands 77.4
  tl.caption({
    at: 74.8,
    dur: 3.8,
    text: 'The worker dies whenever it likes. The channel just gets rebuilt — the request never noticed.',
  });
  tl.tween(ifrGlow, 1, { at: 77.2, dur: 0.4, ease: ease.pop });
  tl.tween(ifrGlow, 0, { at: 78.1, dur: 0.8, ease: ease.move });
  tl.hold(78.7, 0.2);

  /* ---- beat 6: closer (78.9 – 84.6) ------------------------------------ */
  tl.caption({ at: 78.9, dur: 4.4, text: 'Almost Node. The machine was a browser tab all along.' });
  tl.tween(tabGlow, 1, { at: 79.3, dur: 0.9, ease: ease.pulse });
  tl.tween(tabGlow, 0, { at: 81.7, dur: 1.4, ease: ease.pulse });
  tl.hold(83.3, 1.3); // total = T_TOTAL

  return {
    tl,
    tabU,
    termU,
    typeU,
    ccU,
    wireU,
    uVfs,
    uRt,
    uBridge,
    treeU,
    readU,
    walkU,
    retU,
    gridU,
    esbNodeU,
    esbU,
    layoutU,
    uZoneIde,
    uZoneSw,
    uZoneIfr,
    uVite,
    uSw,
    uIfr,
    regexU,
    uConnFetch,
    uConnMc,
    uConnHandle,
    uConnVfs,
    regU,
    viteGlow,
    reqU,
    regexGlow,
    bridgeGlow,
    vfsGlow,
    paintU,
    cam,
    hdr,
    strikeU,
    hdrOp,
    swDead,
    mcDim,
    stallU,
    needsInitU,
    freshU,
    freshOp,
    ifrGlow,
    tabGlow,
  };
}
