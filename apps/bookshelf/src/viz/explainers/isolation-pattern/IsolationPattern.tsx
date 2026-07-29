// Explained: The Sandbox — chapter 5: the same shape at OS scale + the close.
// The left column is the REAL almostnode mechanism (grounded in earlier
// chapters); the right column is the GENERAL pattern at operating-system
// scale, and it is labeled as conceptual — no invented almostnode specifics.
// The mapping is honest and structural: a boundary, a narrow checked channel,
// a default-deny stance, a measured cost. Close: an agent you can't contain is
// an agent you can't verify — the bridge to the loop books (wasm-vm-loop,
// electric-forest-loop, the-progress-judge).
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

// the invariant, three ways (browser = real almostnode; OS/network = general)
const MAP = [
  {
    idea: 'the boundary',
    browser: 'a different origin',
    os: 'a process / namespace / VM',
  },
  {
    idea: 'the narrow channel',
    browser: 'origin-checked postMessage',
    os: 'a filtered syscall surface',
  },
  {
    idea: 'default deny',
    browser: 'createRuntime throws without a cage',
    os: 'allowlist syscalls; block egress',
  },
  {
    idea: 'the cost',
    browser: 'snapshot + async round trips',
    os: 'context switches + copies',
  },
];

const CAM_MAP: CameraState = { x: 620, y: 360, k: 1.1 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  browserU: ChannelRef<number>; // recap column
  osU: ChannelRef<number>; // general column (labeled conceptual)
  rowsU: ChannelRef<number>; // the mapping rows
  labelU: ChannelRef<number>; // "general pattern" label
  bridgeU: ChannelRef<number>; // loop books bridge
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const browserU = tl.channel('browserU', 0);
  const osU = tl.channel('osU', 0);
  const rowsU = tl.channel('rowsU', 0);
  const labelU = tl.channel('labelU', 0);
  const bridgeU = tl.channel('bridgeU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — recap the real mechanism
  tl.caption({
    at: 0.5,
    dur: 5.4,
    text: 'Strip almostnode’s sandbox to its skeleton and you get four bones: a hard boundary, one narrow channel that is checked, a stance of deny-by-default, and a measured cost paid on every crossing. Hold that skeleton up to the light.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(cam, CAM_MAP, { at: 1.2, dur: 1.3, ease: ease.move });
  tl.tween(browserU, 1, { at: 1.8, dur: 1.0, ease: ease.enter });
  tl.tween(rowsU, 1, { at: 2.6, dur: 2.6, ease: ease.linear });
  tl.hold(6.1, 0.5);

  // Beat 2 — the OS column, labeled conceptual
  tl.caption({
    at: 6.6,
    dur: 5.8,
    text: 'Now the honest generalization — and I will label it clearly as the general pattern, not almostnode. Move down a level, from the browser to the operating system, and the exact same four bones reappear, wearing different names.',
  });
  tl.tween(osU, 1, { at: 7.6, dur: 1.0, ease: ease.enter });
  tl.tween(labelU, 1, { at: 8.2, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 12.4,
    dur: 5.8,
    text: 'The boundary becomes a process, a namespace, or a virtual machine instead of an origin. The narrow channel becomes the system call surface — and you filter it, allowing a short list and refusing the rest. Deny-by-default becomes: block the syscalls you did not permit, and cut off the network unless egress is explicitly opened.',
  });
  tl.hold(18.2, 0.6);

  // Beat 3 — the cost carries too
  tl.caption({
    at: 18.8,
    dur: 5.4,
    text: 'And the cost carries across too. The browser paid in snapshots and asynchronous round trips; the operating system pays in context switches and copies between address spaces. Same trade, different currency. Isolation always bills you at the boundary — the only question is which boundary you chose.',
  });
  tl.hold(24.2, 0.6);

  // Beat 4 — why this is the shelf's fight
  tl.caption({
    at: 24.8,
    dur: 5.8,
    text: 'Here is why a sandbox belongs on a shelf about agents. Every book here turns on one asymmetry: an agent’s claim is cheap to make and expensive to trust. A sandbox is the physical form of that distrust — it lets an agent act without letting it act on you.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 25.0, dur: 1.3, ease: ease.move });
  tl.tween(bridgeU, 1, { at: 26.0, dur: 0.9, ease: ease.enter });
  tl.hold(30.6, 0.6);

  // Beat 5 — the bridge and close
  tl.caption({
    at: 31.2,
    dur: 5.8,
    text: 'And it is the precondition for everything the loop books do. To verify an agent’s work you must first be able to run that work safely — replay its recording, rerun its tests, sabotage its code — without the work reaching out and touching you. Containment is what makes verification possible.',
  });
  tl.caption({
    at: 37.6,
    dur: 5.2,
    text: 'So the sentence to keep is this: an agent you cannot contain is an agent you cannot verify. The wall is not the opposite of trust — it is the thing that lets you extend trust one careful, revocable inch at a time.',
  });
  tl.tween(dimU, 1, { at: 38.4, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 39.6, dur: 1.0, ease: ease.enter });
  tl.hold(42.8, 1.4);

  return { tl, cam, titleU, browserU, osU, rowsU, labelU, bridgeU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/isolation-pattern/overrides.json',
  slug: 'isolation-pattern',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

const LOOP_BOOKS = [
  { slug: 'wasm-vm-loop', note: 'replays the VM' },
  { slug: 'electric-forest-loop', note: 'an attack gauntlet' },
  { slug: 'the-progress-judge', note: 'scores the claim' },
];

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const browserU = s.get(scene.browserU);
  const osU = s.get(scene.osU);
  const rowsU = s.get(scene.rowsU);
  const labelU = s.get(scene.labelU);
  const bridgeU = s.get(scene.bridgeU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* column headers */}
          {browserU > 0 && (
            <text x={190} y={170} fill={colors.MUTED} fontSize={13} fontWeight={600} opacity={browserU}>
              the four bones
            </text>
          )}
          {browserU > 0 && (
            <text x={520} y={170} fill={colors.SECONDARY} fontSize={13} fontWeight={700} opacity={browserU}>
              browser — almostnode (real)
            </text>
          )}
          {osU > 0 && (
            <g opacity={osU}>
              <text x={860} y={170} fill={colors.WARM} fontSize={13} fontWeight={700}>
                OS scale — general pattern
              </text>
              {labelU > 0 && (
                <text x={860} y={188} fill={colors.MUTED} fontSize={10.5} fontStyle="italic" opacity={labelU}>
                  conceptual · not almostnode specifics
                </text>
              )}
            </g>
          )}

          {/* mapping rows */}
          {rowsU > 0 &&
            MAP.map((m, i) => {
              const u = clamp01(rowsU * MAP.length - i);
              if (u <= 0) return null;
              const y = 210 + i * 72;
              return (
                <g key={m.idea} opacity={u}>
                  <rect x={180} y={y} width={910} height={58} rx={9} fill={colors.PANEL} opacity={0.88} stroke={colors.GRID} />
                  <text x={202} y={y + 34} fill={colors.TEXT} fontSize={13.5} fontWeight={600}>
                    {m.idea}
                  </text>
                  <text x={430} y={y + 34} fill={colors.SECONDARY} fontSize={12} fontFamily="monospace">
                    {m.browser}
                  </text>
                  <text x={790} y={y + 34} fill={osU > 0 ? colors.WARM : colors.PANEL} fontSize={12} fontFamily="monospace" opacity={osU}>
                    {m.os}
                  </text>
                </g>
              );
            })}
        </Camera>
      </g>

      {/* the loop-books bridge — screen space */}
      {bridgeU > 0 && (
        <g opacity={bridgeU * mainOp}>
          {LOOP_BOOKS.map((b, i) => (
            <g key={b.slug}>
              <rect x={120 + i * 350} y={100} width={320} height={50} rx={9} fill={colors.PANEL} opacity={0.94} stroke={colors.GRID} />
              <text x={140 + i * 350} y={123} fill={colors.ACCENT} fontSize={12.5} fontFamily="monospace" fontWeight={700}>
                {b.slug}
              </text>
              <text x={140 + i * 350} y={141} fill={colors.MUTED} fontSize={11}>
                {b.note}
              </text>
            </g>
          ))}
          <text x={640} y={172} textAnchor="middle" fill={colors.MUTED} fontSize={12.5}>
            all three must run the agent’s work safely before they can verify it
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          The same shape, everywhere
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={180} y={200} width={920} height={264} rx={16} fill={colors.PANEL} opacity={0.97} stroke={colors.GRID} />
          <text x={640} y={262} textAnchor="middle" fill={colors.TEXT} fontSize={25} fontWeight={600}>
            An agent you can’t contain is an agent you can’t verify.
          </text>
          <text x={640} y={312} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            boundary · narrow checked channel · deny by default · a cost at every crossing
          </text>
          <text x={640} y={352} textAnchor="middle" fill={colors.POSITIVE} fontSize={16}>
            containment is the precondition for verification
          </text>
          <text x={640} y={402} textAnchor="middle" fill={colors.WARM} fontSize={14.5}>
            the wall lets you extend trust one careful, revocable inch at a time
          </text>
        </g>
      )}
    </>
  );
}

export function IsolationPattern() {
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
