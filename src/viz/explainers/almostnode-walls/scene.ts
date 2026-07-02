import { CAMERA_HOME, Timeline, ease } from '../../core';
import type { CameraState } from '../../core';

/**
 * almostnode — Walls & Escape Hatches.
 *
 * Every name on screen is grounded in the @agent-wasm/* workspace:
 *  - create-runtime.ts:49 — three tiers: main-thread Runtime (no isolation),
 *    WorkerRuntime (new Worker — thread isolation only, SAME origin,
 *    requires dangerouslyAllowSameOrigin; "NOT origin isolation",
 *    runtime-interface.ts:98), and SandboxRuntime (sandbox-runtime.ts:31) —
 *    a hidden CROSS-ORIGIN `credentialless` iframe. The Same-Origin Policy
 *    blocks cookies/localStorage/IndexedDB, and every postMessage is
 *    origin-checked (event.origin !== sandboxOrigin → dropped).
 *  - network/types.ts — NetworkProvider = 'browser' | 'tailscale'. Egress is
 *    OPT-IN: setCorsProxy(url) + proxyFetch (NO default proxy, deliberately),
 *    or createNativeTailscaleConnectAdapter, which spawns a Worker running a
 *    WASM Tailscale client (@agent-wasm/tailscale-connect) that relays
 *    packets over a WebSocket to a DERP relay (browsers can't do UDP).
 *    browserFetch → selectNetworkRouteForUrl picks the route; a tailscale
 *    route on the plain browser transport THROWS.
 *  - @agent-wasm/keychain (keychain.ts:233–251) — passkey touch → WebAuthn
 *    PRF bytes → deriveVaultKeyFromPrf (HKDF → AES-GCM 256 key) →
 *    decryptData with a random 12-byte IV, all inside the tab. The passkey
 *    lives in the platform authenticator; nothing is ever transmitted.
 *  - @agent-wasm/codex (codex-wasm/src/host-bridge.ts) — the codex WASM
 *    agent reaches the world only via typed JSON-RPC over a MessagePort:
 *    CodexHostOperation = fs/readFile | fs/writeFile | fs/applyPatch |
 *    network/fetch | command/exec | process/spawn, wire messages
 *    codex/host/request | codex/host/response.
 *  - Framing: the VirtualFS is RAM-only — no tier touches the real disk.
 *
 * Everything is pure and built once at module scope; every frame is a
 * function of the sampled channels (the scrubbability invariant).
 */

export interface Pt {
  x: number;
  y: number;
}

/* --------------------------------------------------------------------- */
/* Layout on the 1280×720 stage. Captions own the bottom ~12% (y ≳ 633).  */
/* --------------------------------------------------------------------- */

/* ---- beat 1: the three tiers, escalating wall styles -------------------- */

export const TIER_MAIN = { x: 64, y: 96, w: 356, h: 224 };
export const TIER_WORKER = { x: 452, y: 96, w: 356, h: 224 };
export const TIER_SANDBOX = { x: 840, y: 96, w: 380, h: 224 };

export const TIER_CHIPS: Pt[] = [
  { x: 242, y: 196 },
  { x: 630, y: 196 },
  { x: 1030, y: 196 },
];

export const TIER_DESC = [
  { x: 242, text: 'no isolation', foot: 'create-runtime.ts' },
  { x: 630, text: 'thread wall · same origin', foot: 'new Worker() · dangerouslyAllowSameOrigin' },
  { x: 1030, text: 'cross-origin · credentialless', foot: 'sandbox-runtime.ts · hidden iframe' },
];

export const FS_LINE = { x: 640, y: 352, text: 'VirtualFS — RAM only · no tier ever touches the real disk' };

/* ---- beat 2: the walls tested (camera on the sandbox) -------------------- */

export const CAM_SANDBOX: CameraState = { x: 853, y: 240, k: 1.5 };

export const WALL_X = 842; // the sandbox's left wall (zone border)
export const PROBE_FROM: Pt = { x: 985, y: 196 };
export const PROBES = [
  { label: 'document.cookie', to: { x: WALL_X, y: 140 } },
  { label: 'localStorage', to: { x: WALL_X, y: 196 } },
  { label: 'indexedDB', to: { x: WALL_X, y: 252 } },
];

export const SOP_CHIP: Pt = { x: WALL_X, y: 300 };
export const PM_PATH: Pt[] = [
  { x: 672, y: 368 },
  { x: WALL_X, y: 296 },
];
export const OC_TAG = { x: 712, y: 408, text: 'event.origin !== sandboxOrigin' };

/* ---- beat 3: hatch 1 — network egress, two opt-in routes ----------------- */

export const USER = { x: 150, y: 462, w: 140 };
export const JUNCT = { x: 428, y: 462, w: 216 };
export const NP_TAG = { x: 428, y: 516, text: "NetworkProvider = 'browser' | 'tailscale'" };

export const PROXY = { x: 742, y: 405, w: 184 };
export const INET = { x: 1040, y: 405, w: 148 };
export const TSC = { x: 742, y: 552, w: 204 };
export const DERP = { x: 995, y: 552, w: 132 };
export const TAILZONE = { x: 1082, y: 510, w: 170, h: 86 };
export const TAILHOST = { x: 1167, y: 562, w: 118 };

export const E_UJ = { from: { x: 220, y: 462 }, to: { x: 320, y: 462 } };
export const E_JP = { from: { x: 536, y: 448 }, to: { x: 650, y: 410 } };
export const E_PI = { from: { x: 834, y: 405 }, to: { x: 966, y: 405 } };
export const E_JT = { from: { x: 536, y: 476 }, to: { x: 640, y: 546 } };
export const E_TD = { from: { x: 844, y: 552 }, to: { x: 929, y: 552 } };
export const E_DZ = { from: { x: 1061, y: 552 }, to: { x: 1082, y: 552 } };

export const F1_PATH: Pt[] = [{ x: USER.x, y: USER.y }, { x: JUNCT.x, y: JUNCT.y }];
export const FA_PATH: Pt[] = [{ x: JUNCT.x, y: JUNCT.y }, { x: PROXY.x, y: PROXY.y }, { x: INET.x, y: INET.y }];
export const FB_PATH: Pt[] = [
  { x: JUNCT.x, y: JUNCT.y },
  { x: TSC.x, y: TSC.y },
  { x: DERP.x, y: DERP.y },
  { x: TAILHOST.x, y: TAILHOST.y },
];

/* ---- beat 4: hatch 2 — the keychain vault (nothing leaves) --------------- */

export const CAM_VAULT: CameraState = { x: 640, y: 378, k: 1.08 };

export const BOUND = { x: 96, y: 388, w: 1090, h: 224 };
export const KC_TAG = { x: 641, y: 420, text: '@agent-wasm/keychain' };
export const PASS: Pt = { x: 252, y: 508 };
export const HKDF = { x: 524, y: 508, w: 204 };
export const KEY: Pt = { x: 778, y: 508 };
export const CIPHER: Pt = { x: 1024, y: 508 };
export const IV_TAG = { x: 1024, y: 548, text: 'AES-GCM · random 12-byte IV' };

/* ---- beat 5: hatch 3 — the codex agent's typed doors ---------------------- */

export const CAM_DOORS: CameraState = { x: 640, y: 372, k: 1.06 };

export const WZONE = { x: 108, y: 400, w: 330, h: 204 };
export const CODEX = { x: 273, y: 508, w: 192 };
export const HOST = { x: 1092, y: 508, w: 158 };
export const PORT = { from: { x: 369, y: 508 }, to: { x: 1013, y: 508 } };
export const OP_TAG = { x: 690, y: 396, text: 'CodexHostOperation — host-bridge.ts' };
export const WIRE_TAG = { x: 690, y: 474, text: 'codex/host/request → codex/host/response' };

/** The six doors — the COMPLETE CodexHostOperation list, verbatim. */
export const DOORS = [
  { x: 556, y: 430, op: 'fs/readFile' },
  { x: 700, y: 430, op: 'fs/writeFile' },
  { x: 848, y: 430, op: 'fs/applyPatch' },
  { x: 556, y: 584, op: 'network/fetch' },
  { x: 700, y: 584, op: 'command/exec' },
  { x: 848, y: 584, op: 'process/spawn' },
];

export const REQ_PATH: Pt[] = [PORT.from, PORT.to];
export const ROGUE2_PATH: Pt[] = [PORT.from, { x: 620, y: 508 }];

/* ---- beat 6: the floor plan ----------------------------------------------- */

export const FINAL_BOUND = { x: 56, y: 64, w: 1170, h: 476 };
export const HATCHES = [
  { x: 302, y: 468, text: 'hatch 1 · network egress — opt-in' },
  { x: 641, y: 468, text: 'hatch 2 · keychain — inward only' },
  { x: 980, y: 468, text: 'hatch 3 · host bridge — typed doors' },
];

/* --------------------------------------------------------------------- */
/* The timeline.                                                          */
/* --------------------------------------------------------------------- */

export const T_TOTAL = 98.2;

export function buildScene() {
  const tl = new Timeline();

  // camera + tier scaffolding
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME);
  const tierU = [0, 1, 2].map((i) => tl.channel(`tier${i}U`, 0));
  const chipU = [0, 1, 2].map((i) => tl.channel(`chip${i}U`, 0));
  const descU = tl.channel('descU', 0); // per-desc u = clamp01(descU − i)
  const fsU = tl.channel('fsU', 0);
  const dimAB = tl.channel('dimAB', 0); // beat 2: focus the sandbox
  const tierDim = tl.channel('tierDim', 0); // beats 3–5: dim the whole tier row

  // beat 2 — the walls tested
  const sopU = tl.channel('sopU', 0);
  const sopGlow = tl.channel('sopGlow', 0);
  const probeU = [0, 1, 2].map((i) => tl.channel(`probe${i}U`, 0));
  const flashU = [0, 1, 2].map((i) => tl.channel(`flash${i}U`, 0));
  const pmU = tl.channel('pmU', 0); // postMessage round trip (bounce)
  const ocU = tl.channel('ocU', 0); // origin-check tag

  // beat 3 — hatch 1: egress
  const b3U = tl.channel('b3U', 1); // group fade-out at beat end
  const userU = tl.channel('userU', 0);
  const junctU = tl.channel('junctU', 0);
  const junctGlow = tl.channel('junctGlow', 0);
  const connYU = tl.channel('connYU', 0);
  const npU = tl.channel('npU', 0);
  const f1 = tl.channel('f1', 0);
  const routeAU = tl.channel('routeAU', 0); // items enter as clamp01(routeAU − i)
  const fA = tl.channel('fA', 0);
  const rogueU = tl.channel('rogueU', 0);
  const rogueFlash = tl.channel('rogueFlash', 0);
  const routeBU = tl.channel('routeBU', 0);
  const fB = tl.channel('fB', 0);
  const wsFlow = tl.channel('wsFlow', 0); // WebSocket dash traffic

  // beat 4 — hatch 2: the vault
  const b4U = tl.channel('b4U', 1);
  const boundU = tl.channel('boundU', 0);
  const boundGlow = tl.channel('boundGlow', 0);
  const kcU = tl.channel('kcU', 0);
  const passU = tl.channel('passU', 0);
  const touchGlow = tl.channel('touchGlow', 0);
  const hkdfU = tl.channel('hkdfU', 0);
  const hkdfGlow = tl.channel('hkdfGlow', 0);
  const prfU = tl.channel('prfU', 0);
  const keyU = tl.channel('keyU', 0);
  const keyPk = tl.channel('keyPk', 0);
  const cipherU = tl.channel('cipherU', 0);
  const ivU = tl.channel('ivU', 0);
  const decU = tl.channel('decU', 0); // ciphertext → secret crossfade, in place

  // beat 5 — hatch 3: the agent's doors
  const b5U = tl.channel('b5U', 1);
  const wzU = tl.channel('wzU', 0);
  const codexU = tl.channel('codexU', 0);
  const hostU = tl.channel('hostU', 0);
  const portU = tl.channel('portU', 0);
  const opU = tl.channel('opU', 0);
  const wireU = tl.channel('wireU', 0);
  const doorsU = tl.channel('doorsU', 0); // per-door u = clamp01(doorsU − i)
  const req = [0, 1, 2].map((i) => tl.channel(`req${i}`, 0)); // applyPatch, exec, fetch
  const dg = [0, 1, 2].map((i) => tl.channel(`doorGlow${i}`, 0));
  const rogue2U = tl.channel('rogue2U', 0);
  const rogue2Flash = tl.channel('rogue2Flash', 0);

  // beat 6 — the floor plan
  const finalU = tl.channel('finalU', 0);
  const hatchU = tl.channel('hatchU', 0); // per-chip u = clamp01(hatchU − i)

  /* ---- beat 1: the tiers — isolation is a dial (0 → 12.7) --------------- */

  for (let i = 0; i < 3; i++) tl.tween(tierU[i], 1, { at: 0.3 + i * 0.45, dur: 1.1, ease: ease.draw });
  for (let i = 0; i < 3; i++) tl.tween(chipU[i], 1, { at: 0.9 + i * 0.45, dur: 0.55, ease: ease.enter });
  tl.caption({
    at: 0.5,
    dur: 4.4,
    text: 'Three rooms for the same code: the main thread, a Worker, and a hidden cross-origin iframe.',
  });
  tl.tween(descU, 3, { at: 2.6, dur: 1.4, ease: ease.enter });
  tl.caption({
    at: 5.1,
    dur: 4.0,
    text: 'Each wall is thicker than the last — none at all, then a thread boundary, then a different origin entirely.',
  });
  tl.caption({
    at: 9.3,
    dur: 3.4,
    text: 'One rule holds in every room: the filesystem is RAM. Isolation is a dial, not a switch.',
  });
  tl.tween(fsU, 1, { at: 9.5, dur: 0.6, ease: ease.enter });

  /* ---- beat 2: the walls tested (12.9 → 27.4) ---------------------------- */

  tl.tween(cam, CAM_SANDBOX, { at: 12.9, dur: 1.3, ease: ease.move });
  tl.tween(dimAB, 0.55, { at: 12.9, dur: 0.9, ease: ease.move });
  tl.tween(sopU, 1, { at: 13.5, dur: 0.5, ease: ease.enter });
  tl.caption({ at: 13.5, dur: 3.4, text: 'Poke the wall from inside: document.cookie. localStorage. indexedDB.' });
  // probes arrive at 14.9 / 16.15 / 17.4 — each flash fires exactly on arrival
  for (let i = 0; i < 3; i++) {
    const arrive = 13.9 + i * 1.25 + 1.0;
    tl.tween(probeU[i], 1, { at: 13.9 + i * 1.25, dur: 1.0, ease: ease.linear });
    tl.tween(flashU[i], 1, { at: arrive, dur: 0.25, ease: ease.enter });
    tl.tween(flashU[i], 0, { at: arrive + 0.55, dur: 0.5, ease: ease.enter });
    tl.tween(sopGlow, 1, { at: arrive, dur: 0.25, ease: ease.enter });
    tl.tween(sopGlow, 0, { at: arrive + 0.55, dur: i === 2 ? 0.6 : 0.4, ease: ease.enter });
  }
  tl.caption({
    at: 17.8,
    dur: 4.6,
    text: "Every probe dies at the wall — not almostnode refusing, but the browser's Same-Origin Policy: the web's oldest wall, pointed inward.",
  });
  tl.caption({
    at: 22.7,
    dur: 4.0,
    text: 'Messages get checked too: a postMessage from the wrong origin is dropped before anyone reads it.',
  });
  tl.tween(pmU, 1, { at: 23.0, dur: 2.6, ease: ease.linear });
  tl.tween(ocU, 1, { at: 24.3, dur: 0.4, ease: ease.enter });
  tl.tween(ocU, 0, { at: 26.0, dur: 0.6, ease: ease.enter });
  tl.tween(cam, CAMERA_HOME, { at: 26.2, dur: 1.2, ease: ease.move });
  tl.tween(dimAB, 0, { at: 26.2, dur: 0.8, ease: ease.move });
  tl.tween(tierDim, 0.55, { at: 26.5, dur: 0.9, ease: ease.move });

  /* ---- beat 3: hatch 1 — egress is a choice (27.1 → 50.5) ---------------- */

  tl.caption({
    at: 27.1,
    dur: 3.8,
    text: 'Hatch one: the network. There is no egress by default — you opt in, and there are exactly two routes.',
  });
  tl.tween(userU, 1, { at: 27.3, dur: 0.6, ease: ease.enter });
  tl.tween(junctU, 1, { at: 27.6, dur: 0.6, ease: ease.enter });
  tl.tween(connYU, 1, { at: 28.0, dur: 0.8, ease: ease.draw });
  tl.tween(npU, 1, { at: 28.4, dur: 0.5, ease: ease.enter });
  tl.tween(f1, 1, { at: 28.9, dur: 1.4, ease: ease.linear });
  tl.tween(junctGlow, 1, { at: 30.2, dur: 0.25, ease: ease.enter });
  tl.tween(junctGlow, 0, { at: 30.7, dur: 0.5, ease: ease.enter });
  tl.caption({
    at: 31.3,
    dur: 4.4,
    text: 'Route one is a CORS proxy — but only one you name yourself, with setCorsProxy. No default ships. Deliberately.',
  });
  tl.tween(routeAU, 4, { at: 31.5, dur: 1.2, ease: ease.enter });
  tl.tween(fA, 1, { at: 33.0, dur: 2.6, ease: ease.linear });
  tl.caption({
    at: 36.0,
    dur: 4.0,
    text: "Ask for a tailnet address before the adapter exists — browserFetch doesn't fall back. It throws.",
  });
  tl.tween(rogueU, 1, { at: 36.3, dur: 1.2, ease: ease.linear });
  tl.tween(rogueFlash, 1, { at: 37.45, dur: 0.25, ease: ease.enter });
  tl.tween(rogueFlash, 0, { at: 38.05, dur: 0.55, ease: ease.enter });
  tl.caption({
    at: 40.3,
    dur: 4.4,
    text: 'Route two: createNativeTailscaleConnectAdapter spawns a Worker running a real Tailscale client, compiled to WASM.',
  });
  tl.tween(routeBU, 6, { at: 40.5, dur: 1.6, ease: ease.enter });
  tl.caption({
    at: 44.9,
    dur: 4.6,
    text: "Browsers can't speak UDP — so the VPN rides a WebSocket to a DERP relay, and onward into the tailnet.",
  });
  tl.tween(fB, 1, { at: 45.1, dur: 3.4, ease: ease.linear });
  tl.tween(wsFlow, 5, { at: 45.1, dur: 3.4, ease: ease.linear });
  tl.tween(b3U, 0, { at: 49.8, dur: 0.7, ease: ease.enter });

  /* ---- beat 4: hatch 2 — the vault; nothing leaves (50.7 → 68.4) --------- */

  tl.tween(cam, CAM_VAULT, { at: 50.7, dur: 1.4, ease: ease.move });
  tl.caption({ at: 50.7, dur: 3.4, text: 'Hatch two points inward: the keychain. Secrets come in — nothing leaves.' });
  tl.tween(boundU, 1, { at: 50.9, dur: 1.5, ease: ease.draw });
  tl.tween(kcU, 1, { at: 51.4, dur: 0.5, ease: ease.enter });
  tl.tween(passU, 1, { at: 51.8, dur: 0.5, ease: ease.enter });
  tl.tween(hkdfU, 1, { at: 52.1, dur: 0.5, ease: ease.enter });
  tl.tween(cipherU, 1, { at: 52.4, dur: 0.5, ease: ease.enter });
  tl.caption({
    at: 54.3,
    dur: 4.6,
    text: "One passkey touch. WebAuthn's PRF extension answers with raw bytes — the passkey itself never leaves the authenticator.",
  });
  tl.tween(touchGlow, 1, { at: 54.7, dur: 0.3, ease: ease.enter });
  tl.tween(touchGlow, 0, { at: 55.4, dur: 0.6, ease: ease.enter });
  tl.tween(prfU, 1, { at: 55.9, dur: 1.3, ease: ease.linear });
  tl.tween(hkdfGlow, 1, { at: 57.1, dur: 0.25, ease: ease.enter });
  tl.tween(hkdfGlow, 0, { at: 57.6, dur: 0.5, ease: ease.enter });
  tl.tween(keyU, 1, { at: 57.7, dur: 0.5, ease: ease.pop });
  tl.caption({
    at: 59.1,
    dur: 4.4,
    text: 'HKDF stretches those bytes into an AES-GCM-256 key, and the ciphertext decrypts right here, inside the tab.',
  });
  tl.tween(keyPk, 1, { at: 59.4, dur: 1.3, ease: ease.linear });
  tl.tween(ivU, 1, { at: 60.5, dur: 0.5, ease: ease.enter });
  tl.tween(decU, 1, { at: 60.7, dur: 0.9, ease: ease.move });
  tl.tween(boundGlow, 1, { at: 61.9, dur: 0.4, ease: ease.enter });
  tl.tween(boundGlow, 0, { at: 62.9, dur: 0.7, ease: ease.enter });
  tl.caption({
    at: 63.8,
    dur: 3.8,
    text: 'Nothing crossed the boundary. Derived, used, forgotten — the network never sees the key, or the secret.',
  });
  tl.tween(b4U, 0, { at: 67.8, dur: 0.6, ease: ease.enter });

  /* ---- beat 5: hatch 3 — the agent's doors (68.5 → 87.5) ------------------ */

  tl.tween(cam, CAM_DOORS, { at: 68.5, dur: 1.2, ease: ease.move });
  tl.caption({
    at: 68.5,
    dur: 3.8,
    text: 'Hatch three: codex — a full coding agent compiled to WASM, boxed inside its own Worker.',
  });
  tl.tween(wzU, 1, { at: 68.7, dur: 0.9, ease: ease.draw });
  tl.tween(codexU, 1, { at: 69.2, dur: 0.6, ease: ease.enter });
  tl.tween(hostU, 1, { at: 69.5, dur: 0.6, ease: ease.enter });
  tl.tween(portU, 1, { at: 70.0, dur: 0.9, ease: ease.draw });
  tl.caption({
    at: 72.5,
    dur: 4.4,
    text: 'Its only line out is one MessagePort speaking typed JSON-RPC: codex/host/request, codex/host/response.',
  });
  tl.tween(wireU, 1, { at: 72.8, dur: 0.5, ease: ease.enter });
  tl.tween(opU, 1, { at: 73.8, dur: 0.5, ease: ease.enter });
  tl.tween(doorsU, 6, { at: 74.0, dur: 1.6, ease: ease.enter });
  tl.caption({
    at: 77.1,
    dur: 4.8,
    text: "Every capability is a named door — fs/applyPatch, command/exec, network/fetch. Six doors, and that's the entire list.",
  });
  // three sanctioned round trips; the matching door chip glows as each passes
  const reqAt = [77.3, 78.6, 79.9];
  for (let i = 0; i < 3; i++) {
    tl.tween(req[i], 1, { at: reqAt[i], dur: 2.0, ease: ease.linear });
    tl.tween(dg[i], 1, { at: reqAt[i] + 0.6, dur: 0.3, ease: ease.enter });
    tl.tween(dg[i], 0, { at: reqAt[i] + 2.0, dur: 0.5, ease: ease.enter });
  }
  tl.caption({
    at: 82.2,
    dur: 4.4,
    text: "Ask for a door that isn't on the list, and the request just bounces. Named doors are doors you can audit.",
  });
  tl.tween(rogue2U, 1, { at: 82.5, dur: 2.0, ease: ease.linear });
  tl.tween(rogue2Flash, 1, { at: 83.35, dur: 0.25, ease: ease.enter });
  tl.tween(rogue2Flash, 0, { at: 84.0, dur: 0.5, ease: ease.enter });
  tl.tween(b5U, 0, { at: 86.8, dur: 0.7, ease: ease.enter });

  /* ---- beat 6: the floor plan (87.6 → 98.2) -------------------------------- */

  tl.tween(tierDim, 0, { at: 87.6, dur: 0.9, ease: ease.move });
  tl.tween(cam, CAMERA_HOME, { at: 87.7, dur: 1.6, ease: ease.move });
  tl.caption({
    at: 87.8,
    dur: 4.2,
    text: 'Step back: three walls, three hatches — every way in or out of the sandbox is on this one map.',
  });
  tl.tween(finalU, 1, { at: 88.0, dur: 1.6, ease: ease.draw });
  tl.tween(hatchU, 3, { at: 88.7, dur: 1.2, ease: ease.enter });
  tl.caption({
    at: 92.4,
    dur: 4.4,
    text: "A sandbox isn't a cage. It's a floor plan — walls everywhere, doors on purpose.",
  });
  tl.hold(96.8, 1.4); // total = T_TOTAL

  return {
    tl,
    cam,
    tierU,
    chipU,
    descU,
    fsU,
    dimAB,
    tierDim,
    sopU,
    sopGlow,
    probeU,
    flashU,
    pmU,
    ocU,
    b3U,
    userU,
    junctU,
    junctGlow,
    connYU,
    npU,
    f1,
    routeAU,
    fA,
    rogueU,
    rogueFlash,
    routeBU,
    fB,
    wsFlow,
    b4U,
    boundU,
    boundGlow,
    kcU,
    passU,
    touchGlow,
    hkdfU,
    hkdfGlow,
    prfU,
    keyU,
    keyPk,
    cipherU,
    ivU,
    decU,
    b5U,
    wzU,
    codexU,
    hostU,
    portU,
    opU,
    wireU,
    doorsU,
    req,
    dg,
    rogue2U,
    rogue2Flash,
    finalU,
    hatchU,
  };
}
