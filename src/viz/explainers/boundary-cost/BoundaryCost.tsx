// Explained: The Sandbox — chapter 4: what the boundary costs.
// Every cost is a REAL structural consequence of almostnode's own code, not an
// invented latency number:
//   - the whole VirtualFS is serialized to a VFSSnapshot and posted across on
//     init; every later write is re-posted as a syncFile message.
//   - synchronous main-thread calls (container.runFile) become async round
//     trips (await sandboxRuntime.execute) — a promise + sendAndWait per call.
//   - execution has a hard 60-second timeout in sendAndWait; there is no shared
//     memory, only structured-clone message copies.
//   - onConsole cannot be sent cross-origin, so logs are relayed as messages.
// This is WHY the README still ships createContainer for trusted code: the
// unsafe path pays none of it. Security is not free; it is a trade you make on
// purpose.
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

// the trade, feature by feature (real facts from the two runtimes)
const ROWS = [
  { feature: 'call shape', trusted: 'sync runFile()', sandbox: 'await execute() — a round trip', pay: true },
  { feature: 'filesystem', trusted: 'shared object in RAM', sandbox: 'VFSSnapshot copied + syncFile on write', pay: true },
  { feature: 'data crossing', trusted: 'by reference', sandbox: 'structured-clone copy each way', pay: true },
  { feature: 'console', trusted: 'direct onConsole callback', sandbox: 'relayed as postMessage', pay: true },
  { feature: 'runaway code', trusted: 'blocks your page', sandbox: '60s timeout, then rejected', pay: false },
  { feature: 'your secrets', trusted: 'fully exposed', sandbox: 'unreachable', pay: false },
];

const CAM_TABLE: CameraState = { x: 620, y: 380, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  tableU: ChannelRef<number>;
  syncU: ChannelRef<number>; // the snapshot animation
  asyncU: ChannelRef<number>; // sync→async note
  verdictU: ChannelRef<number>; // the two-columns verdict
  whyU: ChannelRef<number>; // why the unsafe path still exists
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const tableU = tl.channel('tableU', 0);
  const syncU = tl.channel('syncU', 0);
  const asyncU = tl.channel('asyncU', 0);
  const verdictU = tl.channel('verdictU', 0);
  const whyU = tl.channel('whyU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — nothing is free
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'The wall is real, and the wall is not free. Every guarantee from the last chapter is bought with an ergonomic and a performance tax — and the interesting part is that the tax is written plainly into almostnode’s own two runtimes.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_TABLE, { at: 1.2, dur: 1.3, ease: ease.move });
  tl.tween(tableU, 1, { at: 1.8, dur: 3.0, ease: ease.linear });
  tl.hold(6.1, 0.5);

  // Beat 2 — the snapshot
  tl.caption({
    at: 6.6,
    dur: 5.8,
    text: 'Start with the filesystem. On the trusted path it is one object in memory, shared by reference — instant. Across the wall there is no sharing, so the entire filesystem is snapshotted and mailed over on startup, and every write after that is re-posted as its own little message.',
  });
  tl.tween(syncU, 1, { at: 7.6, dur: 2.4, ease: ease.linear });
  tl.hold(12.4, 0.6);

  // Beat 3 — sync becomes async
  tl.caption({
    at: 13.0,
    dur: 5.8,
    text: 'Then the shape of every call changes. A trusted run is a plain synchronous function that returns a value. A sandboxed run is a promise you await — the request goes out, you wait for a reply, and if nothing comes back in sixty seconds the whole call is rejected by design. Simple code becomes asynchronous code, all the way up.',
  });
  tl.tween(asyncU, 1, { at: 14.0, dur: 1.0, ease: ease.enter });
  tl.hold(18.8, 0.6);

  // Beat 4 — even console
  tl.caption({
    at: 19.4,
    dur: 5.6,
    text: 'Even something as small as a log line pays. A function callback cannot cross an origin boundary, so the sandbox cannot call your console handler directly. Instead it packages each log as a message and posts it back, and your side re-emits it. Every convenience gets re-plumbed through the one narrow pipe.',
  });
  tl.tween(verdictU, 1, { at: 20.4, dur: 1.0, ease: ease.enter });
  tl.hold(25.0, 0.6);

  // Beat 5 — why the unsafe path survives
  tl.caption({
    at: 25.6,
    dur: 6.0,
    text: 'Which is exactly why almostnode still ships the unsafe path, and documents it. If you are running your own code — a demo, a trusted script, a test you wrote — you should not pay any of this. The fast synchronous container is correct there. The library’s job is not to forbid the danger; it is to make you choose it out loud.',
  });
  tl.tween(whyU, 1, { at: 26.8, dur: 0.9, ease: ease.enter });
  tl.hold(31.6, 0.6);

  // Beat 6 — close
  tl.caption({
    at: 32.2,
    dur: 5.4,
    text: 'So the boundary costs latency, asynchrony, and copies — paid on every crossing, forever. That is the honest price of not trusting the code you run. And it sets up the last question: is this shape unique to browsers, or is it the same shape everywhere we contain untrusted things?',
  });
  tl.tween(cam, CAMERA_HOME, { at: 32.4, dur: 1.3, ease: ease.move });
  tl.tween(dimU, 1, { at: 33.2, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 34.4, dur: 1.0, ease: ease.enter });
  tl.hold(38.0, 1.4);

  return { tl, cam, titleU, tableU, syncU, asyncU, verdictU, whyU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/boundary-cost/overrides.json',
  slug: 'boundary-cost',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const tableU = s.get(scene.tableU);
  const syncU = s.get(scene.syncU);
  const asyncU = s.get(scene.asyncU);
  const verdictU = s.get(scene.verdictU);
  const whyU = s.get(scene.whyU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;
  const packets = clamp01(syncU);

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* column headers */}
          {tableU > 0 && (
            <g opacity={tableU}>
              <text x={200} y={168} fill={colors.MUTED} fontSize={13} fontWeight={600}>
                what you trade
              </text>
              <text x={560} y={168} fill={colors.WARM} fontSize={13} fontWeight={700}>
                trusted (container)
              </text>
              <text x={860} y={168} fill={colors.POSITIVE} fontSize={13} fontWeight={700}>
                sandbox (cross-origin)
              </text>
            </g>
          )}

          {/* the trade table */}
          {tableU > 0 &&
            ROWS.map((r, i) => {
              const u = clamp01(tableU * ROWS.length - i);
              if (u <= 0) return null;
              const y = 190 + i * 58;
              return (
                <g key={r.feature} opacity={u}>
                  <rect x={190} y={y} width={900} height={48} rx={8} fill={colors.PANEL} opacity={0.88} stroke={r.pay ? colors.NEGATIVE : colors.POSITIVE} strokeWidth={1} />
                  <text x={210} y={y + 29} fill={colors.TEXT} fontSize={13} fontWeight={600}>
                    {r.feature}
                  </text>
                  <text x={410} y={y + 29} fill={colors.MUTED} fontSize={11.5} fontFamily="monospace">
                    {r.trusted}
                  </text>
                  <text x={720} y={y + 29} fill={r.pay ? colors.NEGATIVE : colors.POSITIVE} fontSize={11.5} fontFamily="monospace">
                    {r.sandbox}
                  </text>
                </g>
              );
            })}

          {/* snapshot packets streaming across (decorative, tied to syncU) */}
          {syncU > 0 &&
            Array.from({ length: 6 }).map((_, i) => {
              const phase = clamp01(packets * 1.6 - i * 0.12);
              if (phase <= 0 || phase >= 1) return null;
              const x = 320 + phase * 640;
              return <rect key={i} x={x} y={548} width={14} height={10} rx={2} fill={colors.ACCENT} opacity={0.7 * (1 - Math.abs(phase - 0.5) * 1.4)} />;
            })}
          {syncU > 0.1 && (
            <text x={200} y={556} fill={colors.MUTED} fontSize={11.5} fontFamily="monospace" opacity={clamp01(syncU * 2)}>
              VFSSnapshot → sandbox · syncFile on every write →
            </text>
          )}
        </Camera>
      </g>

      {/* async note — screen space */}
      {asyncU > 0 && (
        <g opacity={asyncU * mainOp * (1 - 0.7 * clamp01(whyU * 2))}>
          <rect x={200} y={568} width={520} height={44} rx={9} fill={colors.PANEL} opacity={0.95} stroke={colors.WARM} />
          <text x={224} y={596} fill={colors.WARM} fontSize={12.5} fontFamily="monospace" fontWeight={700}>
            sync runFile()  →  await execute()  ·  60s timeout, or rejected
          </text>
        </g>
      )}
      {verdictU > 0 && (
        <g opacity={verdictU * mainOp * (1 - 0.7 * clamp01(whyU * 2))}>
          <rect x={740} y={568} width={490} height={44} rx={9} fill={colors.PANEL} opacity={0.95} stroke={colors.SECONDARY} />
          <text x={764} y={596} fill={colors.SECONDARY} fontSize={12.5} fontFamily="monospace" fontWeight={700}>
            onConsole callback can’t cross → relayed as messages
          </text>
        </g>
      )}
      {whyU > 0 && (
        <g opacity={whyU * mainOp}>
          <rect x={210} y={560} width={1020} height={58} rx={10} fill={colors.PANEL} opacity={0.97} stroke={colors.POSITIVE} />
          <text x={236} y={588} fill={colors.POSITIVE} fontSize={13.5} fontWeight={700}>
            why the unsafe path still ships:
          </text>
          <text x={236} y={608} fill={colors.MUTED} fontSize={12.5}>
            trusted code should pay none of this — the library makes you CHOOSE the danger, not stumble into it.
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The price of the wall
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={240} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Latency, asynchrony, copies — paid on every crossing.
          </text>
          <text x={640} y={318} textAnchor="middle" fill={colors.MUTED} fontSize={14.5} fontFamily="monospace">
            snapshot + syncFile · sync → async · structured-clone · console relayed · 60s cap
          </text>
          <text x={640} y={358} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5}>
            the honest price of not trusting the code you run
          </text>
          <text x={640} y={408} textAnchor="middle" fill={colors.WARM} fontSize={14}>
            next: the same shape, at operating-system scale
          </text>
        </g>
      )}
    </>
  );
}

export function BoundaryCost() {
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
