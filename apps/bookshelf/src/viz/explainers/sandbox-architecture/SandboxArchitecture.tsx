// Explained: The Sandbox — chapter 3: almostnode's architecture.
// Every name on screen is real, from /Users/brettlamy/Dev/almostnode:
//   - generateSandboxFiles() (sandbox-helpers.ts) emits index.html, vercel.json,
//     __sw__.js for a cross-origin deploy.
//   - createRuntime(vfs, { sandbox }) (create-runtime.ts) builds a SandboxRuntime;
//     with no sandbox and no dangerouslyAllowSameOrigin it THROWS.
//   - SandboxRuntime (sandbox-runtime.ts) creates a hidden, credentialless
//     iframe at the sandbox origin, and talks to it only via postMessage:
//     init (VFSSnapshot), execute, runFile, syncFile — replies come back as
//     result / error / console, and it drops any message whose event.origin
//     !== this.sandboxOrigin.
// The illusion: the parent's VirtualFS is snapshotted across; console can't
// pass a callback cross-origin, so the sandbox posts console messages back.
import {
  CAMERA_HOME,
  Camera,
  Player,
  STAGE_H,
  STAGE_W,
  Timeline,
  cameraInterp,
  colors,
  ease,
} from '../../core';
import type {
  CameraState,
  ChannelRef,
  SceneState,
  TimelineOverrides,
} from '../../core';
import overrides from './overrides.json';

// the postMessage protocol (real message types from SandboxMessage)
const MESSAGES = [
  { t: 'init', dir: 'in', payload: 'VFSSnapshot + options', color: colors.ACCENT },
  { t: 'execute', dir: 'in', payload: 'code, filename', color: colors.ACCENT },
  { t: 'result', dir: 'out', payload: 'IExecuteResult', color: colors.POSITIVE },
  { t: 'console', dir: 'out', payload: 'method, args', color: colors.WARM },
];

const APP_X = 180;
const SB_X = 820;
const CAM_BRIDGE: CameraState = { x: 620, y: 360, k: 1.1 };
const CAM_ORIGIN: CameraState = { x: 640, y: 340, k: 1.18 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  genU: ChannelRef<number>; // generateSandboxFiles
  factoryU: ChannelRef<number>; // createRuntime throws / builds
  boxesU: ChannelRef<number>; // app + sandbox iframe + sw
  msgU: ChannelRef<number>; // postMessage protocol
  originU: ChannelRef<number>; // the origin check
  swU: ChannelRef<number>; // the service worker note
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const genU = tl.channel('genU', 0);
  const factoryU = tl.channel('factoryU', 0);
  const boxesU = tl.channel('boxesU', 0);
  const msgU = tl.channel('msgU', 0);
  const originU = tl.channel('originU', 0);
  const swU = tl.channel('swU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — deploy the far side
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'To use the browser’s wall, almostnode first builds the far side of it. One function, generate sandbox files, emits three artifacts: a tiny host page, a cross-origin config, and a service worker. You deploy them to a different domain — and that different domain is the whole security boundary.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(genU, 1, { at: 1.6, dur: 1.0, ease: ease.enter });
  tl.hold(6.1, 0.5);

  // Beat 2 — the factory that refuses
  tl.caption({
    at: 6.6,
    dur: 5.8,
    text: 'Back in your app you call create runtime, and hand it that sandbox URL. This is the honest part of the design: if you give it no sandbox and do not explicitly pass the dangerously-allow-same-origin flag, the factory throws. Safety is the default; danger requires you to type the word dangerous.',
  });
  tl.tween(factoryU, 1, { at: 7.6, dur: 1.0, ease: ease.enter });
  tl.hold(12.4, 0.6);

  // Beat 3 — the pieces
  tl.caption({
    at: 13.0,
    dur: 5.8,
    text: 'With a sandbox URL, create runtime builds a sandbox runtime — and here is the machine. It creates a hidden iframe pointed at the sandbox origin, marked credentialless so it carries none of your cookies. Your app on the left, the quarantined runtime on the right, the wall down the middle.',
  });
  tl.tween(cam, CAM_BRIDGE, { at: 13.3, dur: 1.3, ease: ease.move });
  tl.tween(boxesU, 1, { at: 14.0, dur: 1.6, ease: ease.draw });
  tl.hold(18.8, 0.6);

  // Beat 4 — the protocol
  tl.caption({
    at: 19.4,
    dur: 6.0,
    text: 'They speak only through the pinhole. The app posts an init message carrying a snapshot of the in-memory filesystem, then execute messages with the code. The sandbox posts back results — and, because a console callback cannot survive the crossing, it relays every log line as its own message. The filesystem you see is a copy that was mailed across.',
  });
  tl.tween(msgU, 1, { at: 20.6, dur: 2.6, ease: ease.linear });
  tl.hold(25.4, 0.6);

  // Beat 5 — the origin check
  tl.caption({
    at: 26.0,
    dur: 5.8,
    text: 'And the pinhole has a guard. Every incoming message is checked: if its origin is not exactly the sandbox origin, the handler drops it on the floor. That one line is what stops any other page from injecting messages into your bridge. The channel is narrow and it is addressed.',
  });
  tl.tween(cam, CAM_ORIGIN, { at: 26.3, dur: 1.3, ease: ease.move });
  tl.tween(originU, 1, { at: 27.2, dur: 0.9, ease: ease.enter });
  tl.hold(31.8, 0.6);

  // Beat 6 — the service worker
  tl.caption({
    at: 32.4,
    dur: 5.8,
    text: 'The third artifact, the service worker, earns its keep when the untrusted code wants to be a server. It intercepts the sandbox’s own fetches and answers them from that in-memory filesystem — a dev server with no socket, no port, entirely inside the walled tab. The previous almostnode book walks that trick end to end.',
  });
  tl.tween(cam, CAM_BRIDGE, { at: 32.7, dur: 1.3, ease: ease.move });
  tl.tween(swU, 1, { at: 33.6, dur: 0.9, ease: ease.enter });
  tl.hold(38.2, 0.6);

  // Beat 7 — close
  tl.caption({
    at: 38.8,
    dur: 5.4,
    text: 'So the architecture is exactly the previous two chapters, assembled. A different origin gives you the wall. A hidden credentialless iframe puts untrusted code behind it. And an origin-checked message channel is the single, narrow way anything crosses. Nothing invented — just the browser’s primitives, wired with intent.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 39.0, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 39.8, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 41.0, dur: 1.0, ease: ease.enter });
  tl.hold(44.2, 1.4);

  return { tl, cam, titleU, genU, factoryU, boxesU, msgU, originU, swU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/sandbox-architecture/overrides.json',
  slug: 'sandbox-architecture',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const genU = s.get(scene.genU);
  const factoryU = s.get(scene.factoryU);
  const boxesU = s.get(scene.boxesU);
  const msgU = s.get(scene.msgU);
  const originU = s.get(scene.originU);
  const swU = s.get(scene.swU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const introFade = 1 - 0.85 * clamp01(boxesU * 2.5);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* generateSandboxFiles */}
          {genU > 0 && introFade > 0.04 && (
            <g opacity={genU * introFade}>
              <rect x={210} y={170} width={420} height={140} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.ACCENT} />
              <text x={234} y={200} fill={colors.ACCENT} fontSize={14} fontFamily="monospace" fontWeight={700}>
                generateSandboxFiles()
              </text>
              <text x={234} y={230} fill={colors.TEXT} fontSize={12.5} fontFamily="monospace">
                → index.html
              </text>
              <text x={234} y={254} fill={colors.TEXT} fontSize={12.5} fontFamily="monospace">
                → vercel.json  (cross-origin headers)
              </text>
              <text x={234} y={278} fill={colors.TEXT} fontSize={12.5} fontFamily="monospace">
                → __sw__.js    (service worker)
              </text>
              <text x={234} y={300} fill={colors.MUTED} fontSize={11}>
                deploy to a DIFFERENT origin
              </text>
            </g>
          )}

          {/* the factory */}
          {factoryU > 0 && introFade > 0.04 && (
            <g opacity={factoryU * introFade}>
              <rect x={680} y={170} width={430} height={140} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.SECONDARY} />
              <text x={704} y={200} fill={colors.SECONDARY} fontSize={13.5} fontFamily="monospace" fontWeight={700}>
                createRuntime(vfs, {'{'} sandbox {'}'})
              </text>
              <text x={704} y={230} fill={colors.POSITIVE} fontSize={12} fontFamily="monospace">
                with sandbox → SandboxRuntime ✓
              </text>
              <text x={704} y={256} fill={colors.NEGATIVE} fontSize={12} fontFamily="monospace">
                no sandbox, no opt-in → throws
              </text>
              <text x={704} y={288} fill={colors.MUTED} fontSize={11}>
                “dangerouslyAllowSameOrigin” is the only bypass
              </text>
            </g>
          )}

          {/* the two boxes + wall */}
          {boxesU > 0 && (
            <g opacity={boxesU}>
              <rect x={APP_X} y={220} width={280} height={280} rx={14} fill={colors.PANEL} opacity={0.92} stroke={colors.ACCENT} strokeWidth={1.5} />
              <text x={APP_X + 140} y={250} textAnchor="middle" fill={colors.ACCENT} fontSize={14} fontWeight={700}>
                your app
              </text>
              <text x={APP_X + 140} y={274} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                SandboxRuntime + VirtualFS
              </text>
              <rect x={SB_X} y={220} width={280} height={280} rx={14} fill={colors.PANEL} opacity={0.92} stroke={colors.SECONDARY} strokeWidth={1.5} />
              <text x={SB_X + 140} y={250} textAnchor="middle" fill={colors.SECONDARY} fontSize={14} fontWeight={700}>
                hidden iframe
              </text>
              <text x={SB_X + 140} y={274} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                credentialless · sandbox origin
              </text>
              <text x={SB_X + 140} y={300} textAnchor="middle" fill={colors.MUTED} fontSize={11} fontFamily="monospace">
                Runtime + VFS.fromSnapshot
              </text>
              {/* the wall */}
              <line x1={640} y1={210} x2={640} y2={510} stroke={colors.NEGATIVE} strokeWidth={3.5} strokeDasharray="10 7" />
              <text x={640} y={200} textAnchor="middle" fill={colors.NEGATIVE} fontSize={11.5} fontWeight={700}>
                same-origin wall
              </text>

              {/* protocol arrows */}
              {msgU > 0 &&
                MESSAGES.map((m, i) => {
                  const u = clamp01(msgU * MESSAGES.length - i);
                  if (u <= 0) return null;
                  const y = 336 + i * 40;
                  const inbound = m.dir === 'in';
                  return (
                    <g key={m.t} opacity={u}>
                      <line
                        x1={inbound ? APP_X + 280 : SB_X}
                        y1={y}
                        x2={inbound ? SB_X : APP_X + 280}
                        y2={y}
                        stroke={m.color}
                        strokeWidth={2}
                      />
                      <circle cx={inbound ? SB_X - 6 : APP_X + 286} cy={y} r={4} fill={m.color} />
                      <text x={640} y={y - 8} textAnchor="middle" fill={m.color} fontSize={11.5} fontFamily="monospace" fontWeight={700}>
                        {m.t}
                      </text>
                      <text x={640} y={y + 16} textAnchor="middle" fill={colors.MUTED} fontSize={9.5} fontFamily="monospace">
                        {m.payload}
                      </text>
                    </g>
                  );
                })}

              {/* origin check badge */}
              {originU > 0 && (
                <g opacity={originU}>
                  <rect x={520} y={512} width={240} height={40} rx={8} fill={colors.PANEL} opacity={0.97} stroke={colors.POSITIVE} />
                  <text x={640} y={537} textAnchor="middle" fill={colors.POSITIVE} fontSize={11} fontFamily="monospace" fontWeight={700}>
                    if (origin !== sandboxOrigin) return
                  </text>
                </g>
              )}
            </g>
          )}
        </Camera>
      </g>

      {/* service worker note — screen space */}
      {swU > 0 && (
        <g opacity={swU * mainOp}>
          <rect x={860} y={110} width={370} height={120} rx={12} fill={colors.PANEL} opacity={0.95} stroke={colors.WARM} />
          <text x={884} y={140} fill={colors.WARM} fontSize={13.5} fontFamily="monospace" fontWeight={700}>
            __sw__.js
          </text>
          <text x={884} y={168} fill={colors.MUTED} fontSize={12}>
            intercepts the sandbox’s fetches
          </text>
          <text x={884} y={190} fill={colors.MUTED} fontSize={12}>
            serves a dev server with no socket
          </text>
          <text x={884} y={216} fill={colors.MUTED} fontSize={11}>
            (the previous almostnode book’s doorman)
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          How we caged the agent
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={240} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            The browser’s primitives, wired with intent.
          </text>
          <text x={640} y={318} textAnchor="middle" fill={colors.MUTED} fontSize={14.5} fontFamily="monospace">
            different origin = wall · credentialless iframe = the cage · origin-checked postMessage = the pinhole
          </text>
          <text x={640} y={358} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5}>
            createRuntime throws unless you choose a cage
          </text>
          <text x={640} y={408} textAnchor="middle" fill={colors.WARM} fontSize={14}>
            next: what the boundary costs
          </text>
        </g>
      )}
    </>
  );
}

export function SandboxArchitecture() {
  return (
    <div style={{ padding: '4vh 4vw' }}>
      <Player timeline={scene.tl} loop motion={MOTION}>
        {(s) => <Frame s={s} />}
      </Player>
    </div>
  );
}

export { Frame as Render };
export const vizScene = () => scene;
