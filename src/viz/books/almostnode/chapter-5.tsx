// The Doorman
//
// Grounding: packages/almostnode/public/__sw__.js — the fetch listener:
// /^\/__virtual__\/(\d+)(\/.*)?$/ routes to a virtual server; /_npm/ requests
// recover their server from the Referer (falling back to the first registered
// port); navigations from a virtual context get Response.redirect(…, 302)
// with the prefix restored; everything else passes through with
// COEP/COOP/CORP stamped (the coi-serviceworker pattern) and X-Frame-Options
// deleted on virtual responses. src/server-bridge.ts — initServiceWorker
// transfers a MessageChannel port, listens for 'sw-needs-init', re-announces
// every server on reinit, and pings a keepalive every 20 seconds because
// browsers terminate idle service workers after ~30 seconds.
//
// Centerpiece: the SORTING GATE — request cards fall into one fetch listener
// and visibly route down four lanes; then the browser kills the idle worker
// mid-flight and the channel is rebuilt around the stalled request. Ends with
// the whole-book recap: one request retracing all four layers.
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
import { NodeBadge, RequestFlow, TimerArc } from '../../primitives';

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

interface Pt {
  x: number;
  y: number;
}

/** Piecewise-linear travel along waypoints, u in 0..1. */
function along(pts: Pt[], u: number): Pt {
  const f = clamp01(u) * (pts.length - 1);
  const i = Math.min(Math.floor(f), pts.length - 2);
  const t = f - i;
  return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * t, y: pts[i].y + (pts[i + 1].y - pts[i].y) * t };
}

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

// ---------------------------------------------------------------------------
// Layout — the gate, the four lanes, the channel to the main thread.
// ---------------------------------------------------------------------------

const GATE = { x: 490, y: 100, w: 300, h: 88 } as const;
const GATE_C = { x: 640, y: 144 } as const;
const DROP: Pt = { x: 640, y: 34 };

const BRIDGE: Pt = { x: 235, y: 400 };
const SNIFF = { x: 505, y: 322, w: 210, h: 54 } as const;
const CHIP302 = { x: 872, y: 236, w: 168, h: 34 } as const;
const PRESS = { x: 872, y: 410, w: 150, h: 58 } as const;
const CLOUD: Pt = { x: 1118, y: 410 };

// lane paths
const P_VIRTUAL: Pt[] = [DROP, GATE_C, { x: 640, y: 200 }, { x: BRIDGE.x + 40, y: BRIDGE.y - 26 }];
const P_NPM: Pt[] = [DROP, GATE_C, { x: SNIFF.x + SNIFF.w / 2 - 40, y: SNIFF.y + SNIFF.h / 2 }, { x: BRIDGE.x + 60, y: BRIDGE.y }];
const P_NAV_OUT: Pt[] = [DROP, GATE_C, { x: CHIP302.x + 20, y: CHIP302.y + CHIP302.h / 2 }];
const P_NAV_BACK: Pt[] = [
  { x: CHIP302.x + 20, y: CHIP302.y + CHIP302.h / 2 },
  { x: 1010, y: 130 },
  { x: 860, y: 46 },
  DROP,
];
const P_PASS: Pt[] = [DROP, GATE_C, { x: PRESS.x, y: PRESS.y + PRESS.h / 2 }, { x: CLOUD.x - 60, y: CLOUD.y }];

// the header stamps (verbatim from __sw__.js)
const STAMPS = ['COEP: credentialless', 'COOP: same-origin', 'CORP: cross-origin'] as const;
const STAMP_X = 700;
const STAMP_Y0 = 480;
const XFO_Y = STAMP_Y0 + 3 * 30;

// the main thread + the message channel
const MAIN = { x: 100, y: 548, w: 300, h: 54 } as const;
const CHAN_A: Pt = { x: MAIN.x + MAIN.w / 2, y: MAIN.y };
const CHAN_B: Pt = { x: GATE_C.x - 60, y: GATE.y + GATE.h };
const KA_POS: Pt = { x: (CHAN_A.x + CHAN_B.x) / 2 - 30, y: (CHAN_A.y + CHAN_B.y) / 2 + 10 };

// the recap row — the whole book in five badges
const RECAP = [
  { x: 175, label: 'preview iframe', sub: 'the request', color: colors.SECONDARY },
  { x: 408, label: '__sw__.js', sub: 'ch 5 · the doorman', color: colors.WARM },
  { x: 640, label: 'ServerBridge', sub: 'ch 3 · the registry', color: colors.ACCENT },
  { x: 872, label: 'ViteDevServer', sub: 'ch 4 · the transforms', color: colors.ACCENT },
  { x: 1105, label: 'VirtualFS', sub: 'ch 2 · the tree', color: colors.POSITIVE },
] as const;
const RECAP_Y = 330;
const RECAP_PATH: Pt[] = RECAP.map((r) => ({ x: r.x, y: RECAP_Y }));

// camera marks
const CAM_WIDE: CameraState = CAMERA_HOME;
const CAM_GATE: CameraState = { x: 640, y: 200, k: 1.25 };
const CAM_PRESS: CameraState = { x: 850, y: 430, k: 1.28 };
const CAM_CHAN: CameraState = { x: 430, y: 400, k: 1.2 };

// ---------------------------------------------------------------------------
// Timeline (~96s, twelve beats).
// ---------------------------------------------------------------------------

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAM_GATE, cameraInterp);

  const gateU = tl.channel('gateU', 0);
  const gateGlow = tl.channel('gateGlow', 0);
  const bridgeU = tl.channel('bridgeU', 0);
  const c1U = tl.channel('c1U', 0); // virtual-port card
  const regexHot = tl.channel('regexHot', 0);
  const c2U = tl.channel('c2U', 0); // /_npm/ card
  const sniffU = tl.channel('sniffU', 0); // referrer chip
  const navU = tl.channel('navU', 0); // navigation out to the 302…
  const navBackU = tl.channel('navBackU', 0); // …and the arc back around
  const nav2U = tl.channel('nav2U', 0); // the rewritten card goes through
  const chip302U = tl.channel('chip302U', 0);
  const c4U = tl.channel('c4U', 0); // passthrough card
  const pressU = tl.channel('pressU', 0);
  const cloudU = tl.channel('cloudU', 0);
  const stampU = tl.channel('stampU', 0); // three stamps (windowed)
  const xfoU = tl.channel('xfoU', 0); // X-Frame-Options struck
  const isoU = tl.channel('isoU', 0); // crossOriginIsolated chip
  const mainU = tl.channel('mainU', 0); // main-thread bar
  const chanU = tl.channel('chanU', 0); // the message channel line
  const chanOp = tl.channel('chanOp', 1); // dies with the worker
  const kaU = tl.channel('kaU', 0); // keepalive timer sweep
  const deadU = tl.channel('deadU', 0); // the worker grays out
  const stallU = tl.channel('stallU', 0); // a card stalls at the gate
  const needsU = tl.channel('needsU', 0); // sw-needs-init broadcast
  const freshU = tl.channel('freshU', 0); // fresh port line
  const dimU = tl.channel('dimU', 0);
  const recapU = tl.channel('recapU', 0); // five badges (windowed)
  const recapFlow = tl.channel('recapFlow', 0); // the last round trip
  const closeU = tl.channel('closeU', 0);

  // — beat 1 · meet the doorman —
  tl.caption({
    at: 0.5,
    dur: 6.4,
    text: 'Everything so far hangs on one question: how does an ordinary fetch, from an ordinary iframe, end up inside your own code? Meet the doorman.',
  });
  tl.tween(gateU, 1, { at: 0.8, dur: 1.3, ease: ease.draw });
  tl.hold(6.9, 0.5);

  // — beat 2 · one listener —
  tl.caption({
    at: 7.4,
    dur: 6.0,
    text: 'A service worker sits between the tab and the world. Every request the page makes — every page, script, image, and call — falls through this one fetch listener.',
  });
  tl.tween(gateGlow, 1, { at: 7.8, dur: 0.5, ease: ease.enter });
  tl.tween(gateGlow, 0, { at: 9.4, dur: 0.8, ease: ease.move });
  tl.tween(mainU, 1, { at: 10.4, dur: 0.7, ease: ease.enter });
  tl.tween(chanU, 1, { at: 11.2, dur: 1.0, ease: ease.draw });
  tl.hold(13.4, 0.4);

  // — beat 3 · the virtual lane —
  tl.caption({
    at: 13.8,
    dur: 6.0,
    text: 'First check: does the path carry a virtual port? One regular expression decides, and the request is relayed inward, over the channel, to the bridge.',
  });
  tl.tween(cam, CAM_WIDE, { at: 14.0, dur: 1.3, ease: ease.move });
  tl.tween(bridgeU, 1, { at: 14.2, dur: 0.7, ease: ease.enter });
  tl.tween(c1U, 0.35, { at: 14.6, dur: 1.0, ease: ease.linear }); // falls into the gate
  tl.tween(regexHot, 1, { at: 15.7, dur: 0.4, ease: ease.pop });
  tl.tween(c1U, 1, { at: 16.6, dur: 1.6, ease: ease.linear }); // …and down the lane
  tl.tween(regexHot, 0, { at: 18.4, dur: 0.7, ease: ease.move });
  tl.hold(19.8, 0.4);

  // — beat 4 · the npm sniff —
  tl.caption({
    at: 20.2,
    dur: 6.6,
    text: 'Package requests are trickier. By the time a module asks for its own dependency, the virtual prefix is gone — so the doorman reads the referrer to recover which server it belongs to.',
  });
  tl.tween(c2U, 0.35, { at: 20.8, dur: 1.0, ease: ease.linear });
  tl.tween(sniffU, 1, { at: 22.0, dur: 0.7, ease: ease.enter });
  tl.tween(c2U, 0.68, { at: 22.9, dur: 1.0, ease: ease.linear }); // dwell at the sniffer
  tl.tween(c2U, 1, { at: 24.6, dur: 1.3, ease: ease.linear });
  tl.hold(26.8, 0.4);

  // — beat 5 · the lost navigation —
  tl.caption({
    at: 27.2,
    dur: 6.4,
    text: 'A plain link click would walk straight out of the illusion. Navigations get bounced back with a redirect — same path, virtual prefix restored.',
  });
  tl.tween(chip302U, 1, { at: 27.6, dur: 0.6, ease: ease.enter });
  tl.tween(navU, 1, { at: 28.2, dur: 1.4, ease: ease.linear });
  tl.tween(navBackU, 1, { at: 29.8, dur: 1.6, ease: ease.linear });
  tl.tween(nav2U, 1, { at: 31.6, dur: 1.8, ease: ease.linear });
  tl.hold(33.9, 0.4);

  // — beat 6 · passthrough —
  tl.caption({
    at: 34.3,
    dur: 4.6,
    text: 'Everything else passes through to the real network. But nothing passes through untouched.',
  });
  tl.tween(pressU, 1, { at: 34.5, dur: 0.7, ease: ease.enter });
  tl.tween(cloudU, 1, { at: 34.9, dur: 0.7, ease: ease.enter });
  tl.tween(c4U, 0.65, { at: 35.5, dur: 1.4, ease: ease.linear }); // into the press
  tl.hold(38.5, 0.4);

  // — beat 7 · the stamp press —
  tl.caption({
    at: 38.9,
    dur: 6.6,
    text: "On the way back in, every response is stamped with the cross-origin isolation headers a static host can't set — and the header that blocks iframes is struck out entirely.",
  });
  tl.tween(cam, CAM_PRESS, { at: 39.1, dur: 1.3, ease: ease.move });
  tl.tween(c4U, 1, { at: 39.5, dur: 1.2, ease: ease.linear });
  stagger(3, { at: 40.6, each: 0.55, dur: 0.5, ease: ease.pop }).forEach((o, i) =>
    tl.tween(stampU, (i + 1) / 3, { ...o }),
  );
  tl.tween(xfoU, 1, { at: 43.2, dur: 0.7, ease: ease.draw });
  tl.hold(45.9, 0.4);

  // — beat 8 · why the stamps matter —
  tl.caption({
    at: 46.3,
    dur: 5.6,
    text: 'Those stamps are why the heavy machinery — workers, shared memory, the esbuild engine — is allowed to run at all, even on a static host.',
  });
  tl.tween(isoU, 1, { at: 47.0, dur: 0.7, ease: ease.pop });
  tl.hold(52.1, 0.4);

  // — beat 9 · the kill —
  tl.caption({
    at: 52.5,
    dur: 7.0,
    text: 'Then, the catch. After about thirty seconds idle, the browser simply kills the worker. The message port dies with it — and the next request stalls at a dead gate.',
  });
  tl.tween(cam, CAM_CHAN, { at: 52.7, dur: 1.3, ease: ease.move });
  tl.tween(isoU, 0, { at: 52.7, dur: 0.7, ease: ease.move });
  tl.tween(deadU, 1, { at: 54.0, dur: 1.0, ease: ease.move });
  tl.tween(chanOp, 0.25, { at: 54.4, dur: 0.9, ease: ease.move });
  tl.tween(stallU, 0.32, { at: 56.2, dur: 1.4, ease: ease.linear }); // stalls short of the gate
  tl.hold(59.9, 0.4);

  // — beat 10 · the resurrection —
  tl.caption({
    at: 60.3,
    dur: 7.0,
    text: 'The stalled fetch is the alarm clock. The worker wakes, broadcasts that it needs a new channel, and the bridge hands over a fresh port and re-announces every server.',
  });
  tl.tween(deadU, 0, { at: 61.0, dur: 0.8, ease: ease.move });
  tl.tween(needsU, 1, { at: 61.8, dur: 1.3, ease: ease.linear });
  tl.tween(freshU, 1, { at: 63.4, dur: 1.0, ease: ease.draw });
  tl.tween(chanOp, 1, { at: 64.2, dur: 0.7, ease: ease.move });
  tl.tween(stallU, 1, { at: 64.8, dur: 1.8, ease: ease.linear }); // completes to the bridge
  tl.hold(67.7, 0.4);

  // — beat 11 · the heartbeat —
  tl.caption({
    at: 68.1,
    dur: 5.8,
    text: "To make that rare, the bridge pings the worker every twenty seconds — a heartbeat for a doorman who's paid to forget.",
  });
  tl.tween(kaU, 3, { at: 68.5, dur: 5.0, ease: ease.linear });
  tl.hold(73.7, 0.4);

  // — beat 12 · the recap —
  tl.caption({
    at: 74.1,
    dur: 7.2,
    text: "And that's the whole machine: a filesystem made of maps, a runtime made of shims, a dev server with no port, and a doorman made of stamps.",
  });
  tl.tween(cam, CAM_WIDE, { at: 74.3, dur: 1.4, ease: ease.move });
  tl.tween(dimU, 1, { at: 74.5, dur: 1.2, ease: ease.move });
  tl.tween(recapU, 1, { at: 75.6, dur: 2.6, ease: ease.linear });
  tl.tween(recapFlow, 1, { at: 78.6, dur: 7.6, ease: ease.linear });
  tl.caption({
    at: 81.7,
    dur: 5.2,
    text: 'One request, four layers, zero servers. One tab. Almost Node.',
  });
  tl.tween(closeU, 1, { at: 84.4, dur: 0.9, ease: ease.enter });
  tl.hold(87.2, 1.6);

  return {
    tl,
    cam,
    gateU,
    gateGlow,
    bridgeU,
    c1U,
    regexHot,
    c2U,
    sniffU,
    navU,
    navBackU,
    nav2U,
    chip302U,
    c4U,
    pressU,
    cloudU,
    stampU,
    xfoU,
    isoU,
    mainU,
    chanU,
    chanOp,
    kaU,
    deadU,
    stallU,
    needsU,
    freshU,
    dimU,
    recapU,
    recapFlow,
    closeU,
  };
}

const scene = buildScene();

// ---------------------------------------------------------------------------
// Render — pure function of the sampled state.
// ---------------------------------------------------------------------------

function ReqCard({ p, text, color, opacity = 1 }: { p: Pt; text: string; color: string; opacity?: number }) {
  const w = text.length * 7.4 + 22;
  return (
    <g opacity={opacity}>
      <rect x={p.x - w / 2} y={p.y - 15} width={w} height={30} rx={8} fill={colors.BG} stroke={color} strokeWidth={1.5} />
      <text x={p.x} y={p.y + 4.5} textAnchor="middle" fill={color} fontSize={12} fontFamily={MONO}>
        {text}
      </text>
    </g>
  );
}

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const gateU = s.get(scene.gateU);
  const gateGlow = s.get(scene.gateGlow);
  const regexHot = s.get(scene.regexHot);
  const deadU = s.get(scene.deadU);
  const dimU = s.get(scene.dimU);
  const machineOp = 1 - 0.9 * dimU;

  const c1U = s.get(scene.c1U);
  const c2U = s.get(scene.c2U);
  const navU = s.get(scene.navU);
  const navBackU = s.get(scene.navBackU);
  const nav2U = s.get(scene.nav2U);
  const c4U = s.get(scene.c4U);
  const stampU = s.get(scene.stampU);
  const xfoU = s.get(scene.xfoU);
  const isoU = s.get(scene.isoU);
  const chanOp = s.get(scene.chanOp);
  const kaU = s.get(scene.kaU);
  const stallU = s.get(scene.stallU);
  const needsU = s.get(scene.needsU);
  const freshU = s.get(scene.freshU);
  const recapU = s.get(scene.recapU);
  const recapFlow = s.get(scene.recapFlow);
  const closeU = s.get(scene.closeU);

  const gateStroke = deadU > 0.3 ? colors.MUTED : gateGlow > 0.1 || regexHot > 0.1 ? colors.WARM : colors.GRID;

  // the stalled card path: drop → gate (stops short at 0.32) → bridge
  const P_STALL: Pt[] = [DROP, { x: 640, y: 96 }, GATE_C, { x: 640, y: 200 }, { x: BRIDGE.x + 40, y: BRIDGE.y - 26 }];

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />
      <Camera {...cam}>
        <g opacity={machineOp}>
          {/* the gate */}
          <g opacity={gateU * (1 - 0.45 * deadU)}>
            <rect x={GATE.x} y={GATE.y} width={GATE.w} height={GATE.h} rx={14} fill={colors.PANEL} stroke={gateStroke} strokeWidth={1.6 + gateGlow + regexHot} />
            <text x={GATE_C.x} y={GATE.y + 34} textAnchor="middle" fill={deadU > 0.3 ? colors.MUTED : colors.TEXT} fontSize={15} fontWeight={600}>
              __sw__.js
            </text>
            <text x={GATE_C.x} y={GATE.y + 58} textAnchor="middle" fill={regexHot > 0.1 ? colors.WARM : colors.MUTED} fontSize={12} fontFamily={MONO}>
              {regexHot > 0.1 ? "/__virtual__/(\\d+)/ → port 3000" : "addEventListener('fetch', …)"}
            </text>
            {deadU > 0.3 && (
              <text x={GATE_C.x} y={GATE.y - 12} textAnchor="middle" fill={colors.NEGATIVE} fontSize={12.5}>
                terminated — idle ~30 s
              </text>
            )}
          </g>

          {/* the bridge + the network cloud */}
          <NodeBadge x={BRIDGE.x} y={BRIDGE.y} w={150} h={58} label="ServerBridge" sublabel="main thread" color={colors.ACCENT} u={s.get(scene.bridgeU)} />
          <NodeBadge x={CLOUD.x} y={CLOUD.y} w={130} h={58} label="real network" sublabel="pass-through" color={colors.MUTED} u={s.get(scene.cloudU)} />

          {/* the referrer sniffer */}
          <g opacity={s.get(scene.sniffU)}>
            <rect x={SNIFF.x - SNIFF.w / 2} y={SNIFF.y} width={SNIFF.w} height={SNIFF.h} rx={10} fill={colors.BG} stroke={colors.SECONDARY} strokeWidth={1.3} />
            <text x={SNIFF.x} y={SNIFF.y + 22} textAnchor="middle" fill={colors.SECONDARY} fontSize={12} fontFamily={MONO}>
              referer: /__virtual__/3000/
            </text>
            <text x={SNIFF.x} y={SNIFF.y + 42} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
              {'→ route to port 3000'}
            </text>
          </g>

          {/* the 302 chip */}
          <g opacity={s.get(scene.chip302U)}>
            <rect x={CHIP302.x - CHIP302.w / 2} y={CHIP302.y} width={CHIP302.w} height={CHIP302.h} rx={9} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.4} />
            <text x={CHIP302.x} y={CHIP302.y + 22} textAnchor="middle" fill={colors.WARM} fontSize={12.5} fontFamily={MONO}>
              302 · prefix restored
            </text>
          </g>

          {/* the stamp press */}
          <g opacity={s.get(scene.pressU)}>
            <rect x={PRESS.x - PRESS.w / 2} y={PRESS.y} width={PRESS.w} height={PRESS.h} rx={10} fill={colors.PANEL} stroke={colors.POSITIVE} strokeWidth={1.4} />
            <text x={PRESS.x} y={PRESS.y + 24} textAnchor="middle" fill={colors.POSITIVE} fontSize={13} fontWeight={600}>
              header press
            </text>
            <text x={PRESS.x} y={PRESS.y + 44} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily={MONO}>
              on every response
            </text>
          </g>

          {/* the stamps */}
          {STAMPS.map((t, i) => {
            const u = clamp01(stampU * 3 - i);
            if (u <= 0) return null;
            return (
              <g key={t} opacity={u}>
                <rect x={STAMP_X} y={STAMP_Y0 + i * 30 - 4 * (1 - u)} width={192} height={26} rx={7} fill={colors.BG} stroke={colors.POSITIVE} />
                <text x={STAMP_X + 96} y={STAMP_Y0 + i * 30 + 13} textAnchor="middle" fill={colors.POSITIVE} fontSize={11.5} fontFamily={MONO}>
                  {t}
                </text>
              </g>
            );
          })}
          <g opacity={clamp01(xfoU * 2)}>
            <rect x={STAMP_X} y={XFO_Y} width={192} height={26} rx={7} fill={colors.BG} stroke={colors.NEGATIVE} opacity={0.8} />
            <text x={STAMP_X + 96} y={XFO_Y + 17} textAnchor="middle" fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
              X-Frame-Options
            </text>
            <line x1={STAMP_X + 8} y1={XFO_Y + 13} x2={STAMP_X + 8 + 176 * xfoU} y2={XFO_Y + 13} stroke={colors.NEGATIVE} strokeWidth={2} />
          </g>

          {/* crossOriginIsolated payoff chip */}
          <g opacity={isoU}>
            <rect x={STAMP_X + 220} y={STAMP_Y0 + 26} width={230} height={40} rx={9} fill={colors.BG} stroke={colors.WARM} strokeWidth={1.5} />
            <text x={STAMP_X + 335} y={STAMP_Y0 + 51} textAnchor="middle" fill={colors.WARM} fontSize={12.5} fontFamily={MONO}>
              crossOriginIsolated ✓
            </text>
          </g>

          {/* the main thread + channel */}
          <g opacity={s.get(scene.mainU)}>
            <rect x={MAIN.x} y={MAIN.y} width={MAIN.w} height={MAIN.h} rx={11} fill={colors.PANEL} stroke={colors.ACCENT} strokeWidth={1.3} />
            <text x={MAIN.x + 18} y={MAIN.y + 24} fill={colors.TEXT} fontSize={13.5} fontWeight={600}>
              main thread
            </text>
            <text x={MAIN.x + 18} y={MAIN.y + 42} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
              bridge.initServiceWorker()
            </text>
          </g>
          {/* the old channel */}
          <line
            x1={CHAN_A.x}
            y1={CHAN_A.y}
            x2={CHAN_A.x + (CHAN_B.x - CHAN_A.x) * s.get(scene.chanU)}
            y2={CHAN_A.y + (CHAN_B.y - CHAN_A.y) * s.get(scene.chanU)}
            stroke={colors.ACCENT}
            strokeWidth={2}
            strokeDasharray="7 5"
            opacity={chanOp * (1 - freshU)}
          />
          {/* the fresh channel */}
          <line x1={CHAN_A.x - 14} y1={CHAN_A.y} x2={CHAN_B.x - 14} y2={CHAN_B.y} stroke={colors.POSITIVE} strokeWidth={2.2} strokeDasharray="7 5" opacity={freshU} />
          <g opacity={s.get(scene.chanU)}>
            <text x={KA_POS.x - 44} y={KA_POS.y + 42} fill={colors.MUTED} fontSize={11.5} fontFamily={MONO}>
              MessageChannel
            </text>
          </g>

          {/* keepalive heartbeat — sweeps three times */}
          {kaU > 0 && kaU < 3 && (
            <g>
              <TimerArc cx={KA_POS.x} cy={KA_POS.y} r={17} u={kaU % 1} color={colors.WARM} />
              <text x={KA_POS.x + 28} y={KA_POS.y + 5} fill={colors.WARM} fontSize={11.5} fontFamily={MONO}>
                keepalive · 20 s
              </text>
            </g>
          )}

          {/* sw-needs-init broadcast */}
          {needsU > 0 && needsU < 1 && (
            <g>
              <circle cx={GATE_C.x - 60 + (CHAN_A.x - GATE_C.x + 60) * needsU} cy={GATE.y + GATE.h + (CHAN_A.y - GATE.y - GATE.h) * needsU} r={7} fill={colors.WARM} stroke={colors.BG} strokeWidth={1.5} />
              <text
                x={GATE_C.x - 44 + (CHAN_A.x - GATE_C.x + 60) * needsU}
                y={GATE.y + GATE.h + (CHAN_A.y - GATE.y - GATE.h) * needsU - 12}
                fill={colors.WARM}
                fontSize={12}
                fontFamily={MONO}
              >
                sw-needs-init
              </text>
            </g>
          )}

          {/* ---- the request cards ---- */}
          {c1U > 0 && c1U < 1 && <ReqCard p={along(P_VIRTUAL, c1U)} text="GET /__virtual__/3000/" color={colors.ACCENT} />}
          {c2U > 0 && c2U < 1 && <ReqCard p={along(P_NPM, c2U)} text="GET /_npm/react" color={colors.SECONDARY} />}
          {navU > 0 && navBackU <= 0 && <ReqCard p={along(P_NAV_OUT, navU)} text="GET /about · navigate" color={colors.WARM} />}
          {navBackU > 0 && navBackU < 1 && <ReqCard p={along(P_NAV_BACK, navBackU)} text="GET /__virtual__/3000/about" color={colors.WARM} />}
          {nav2U > 0 && nav2U < 1 && <ReqCard p={along(P_VIRTUAL, nav2U)} text="GET /__virtual__/3000/about" color={colors.WARM} />}
          {c4U > 0 && c4U < 1 && <ReqCard p={along(P_PASS, c4U)} text="GET esm.sh/react" color={colors.MUTED} />}
          {stallU > 0 && stallU < 1 && (
            <ReqCard p={along(P_STALL, stallU)} text={stallU < 0.4 ? 'GET / · waiting…' : 'GET /'} color={stallU < 0.4 ? colors.NEGATIVE : colors.ACCENT} />
          )}
        </g>

        {/* ---- the recap: the whole book in one row ---- */}
        {RECAP.map((r, i) => {
          const u = clamp01(recapU * 5 - i);
          if (u <= 0) return null;
          return <NodeBadge key={r.label} x={r.x} y={RECAP_Y} w={172} h={64} label={r.label} sublabel={r.sub} color={r.color} u={u} />;
        })}
        {recapU > 0.9 && (
          <RequestFlow path={RECAP_PATH} u={recapFlow} roundTrip label="GET /" responseLabel="200" color={colors.ACCENT} responseColor={colors.POSITIVE} />
        )}
        <g opacity={closeU}>
          <text x={640} y={470} textAnchor="middle" fill={colors.TEXT} fontSize={26} fontWeight={700}>
            One tab. Almost Node.
          </text>
          <text x={640} y={500} textAnchor="middle" fill={colors.MUTED} fontSize={14} fontFamily={MONO}>
            zero servers · zero disks · one service worker
          </text>
        </g>
      </Camera>
    </>
  );
}

export const vizScene = () => scene;
