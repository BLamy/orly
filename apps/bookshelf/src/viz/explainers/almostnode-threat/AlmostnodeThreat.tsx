// Explained: The Sandbox — chapter 1: what "running untrusted code" means.
// Grounded in the real almostnode codebase (~/Dev/almostnode): createContainer()
// / container.execute() run agent code ON THE MAIN THREAD of your page — the
// README's own warning says exactly this, and createRuntime() refuses to do it
// without an option literally named dangerouslyAllowSameOrigin. The chapter
// stages the toy attack that warning is about: an agent-written script that,
// executed same-origin, can read the page's cookies, local storage, session
// tokens, and DOM — because to the browser it IS the page.
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
// Real artifacts from the almostnode repo, quoted (kept on screen, not spoken).
// ---------------------------------------------------------------------------

const README_WARNING = [
  '⚠️ Security Warning: The example above runs code on the',
  'main thread with full access to your page. Do not use',
  'createContainer() or container.execute() with untrusted',
  'code. For untrusted code, use createRuntime() with a',
  'cross-origin sandbox — see Sandbox Setup.',
];

const ATTACK_LINES = [
  "// looks like a build script…",
  "const data = require('./data.json');",
  "console.log('building', data.name);",
  "// …but same-origin code IS the page:",
  "exfiltrate(document.cookie);",
  "exfiltrate(localStorage.getItem('authToken'));",
  "exfiltrate(document.querySelector('#email').value);",
];

// What same-origin execution can reach (all true of main-thread JS).
const REACHABLE = [
  { what: 'document.cookie', why: 'session cookies readable by script' },
  { what: 'localStorage / sessionStorage', why: 'tokens apps stash client-side' },
  { what: 'indexedDB', why: 'cached user data, offline stores' },
  { what: 'the live DOM', why: 'anything the user can see or type' },
  { what: 'fetch as the user', why: 'same-origin requests ride the session' },
];

const ERROR_LINES = [
  'almostnode: For security, you must either:',
  '  1. Use sandbox mode: { sandbox: "https://your-sandbox…" }',
  '  2. Explicitly opt-in: { dangerouslyAllowSameOrigin: true }',
  '',
  'Same-origin execution allows code to access cookies,',
  'localStorage, and IndexedDB.',
];

// ---------------------------------------------------------------------------
// Layout.
// ---------------------------------------------------------------------------

const PAGE_X = 150;
const PAGE_Y = 150;
const PAGE_W = 500;
const PAGE_H = 420;
const CAM_PAGE: CameraState = { x: 480, y: 380, k: 1.15 };
const CAM_CODE: CameraState = { x: 700, y: 360, k: 1.18 };

interface Scene {
  tl: Timeline;
  cam: ChannelRef<CameraState>;
  titleU: ChannelRef<number>;
  pageU: ChannelRef<number>; // your page + its secrets
  agentU: ChannelRef<number>; // the agent + its code
  execU: ChannelRef<number>; // code lands inside the page
  reachU: ChannelRef<number>; // tendrils to the secrets
  warnU: ChannelRef<number>; // the README warning
  errU: ChannelRef<number>; // the createRuntime refusal
  dimU: ChannelRef<number>;
  closeU: ChannelRef<number>;
}

export function buildScene(): Scene {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const titleU = tl.channel('titleU', 0);
  const pageU = tl.channel('pageU', 0);
  const agentU = tl.channel('agentU', 0);
  const execU = tl.channel('execU', 0);
  const reachU = tl.channel('reachU', 0);
  const warnU = tl.channel('warnU', 0);
  const errU = tl.channel('errU', 0);
  const dimU = tl.channel('dimU', 0);
  const closeU = tl.channel('closeU', 0);

  // Beat 1 — the setup
  tl.caption({
    at: 0.5,
    dur: 5.8,
    text: 'This book is about a specific engineering problem this shelf keeps walking past: the agents in these books write code, and something has to run it. This one is grounded in a real system — the browser based node runtime that powers the coding book on this shelf.',
  });
  tl.tween(titleU, 1, { at: 0.4, dur: 0.8, ease: ease.enter });
  tl.caption({
    at: 6.9,
    dur: 5.2,
    text: 'Here is your web page. It holds what every logged in page holds: session cookies, stored tokens, a user’s data sitting in form fields. None of this feels like a secret until someone else’s code is in the room.',
  });
  tl.tween(cam, CAM_PAGE, { at: 7.2, dur: 1.4, ease: ease.move });
  tl.tween(pageU, 1, { at: 7.8, dur: 1.2, ease: ease.enter });
  tl.hold(12.1, 0.6);

  // Beat 2 — the convenient path
  tl.caption({
    at: 12.7,
    dur: 5.8,
    text: 'The runtime offers a wonderfully convenient way to run agent code: create a container, call execute. One line, instant results — and the code runs on the main thread of your page. The library’s own readme prints a warning about exactly this, and it is worth taking literally.',
  });
  tl.tween(agentU, 1, { at: 13.6, dur: 0.9, ease: ease.enter });
  tl.tween(warnU, 1, { at: 16.4, dur: 0.9, ease: ease.enter });
  tl.hold(18.5, 0.6);

  // Beat 3 — the attack
  tl.caption({
    at: 19.1,
    dur: 5.8,
    text: 'Because watch what an untrusted script can do from in there. It opens like a build script — reads a config, logs a message. Then, three lines later, it reads your cookies, your stored token, and whatever the user typed into the page.',
  });
  tl.tween(cam, CAM_CODE, { at: 19.4, dur: 1.3, ease: ease.move });
  tl.tween(execU, 1, { at: 20.2, dur: 2.6, ease: ease.linear });
  tl.caption({
    at: 25.3,
    dur: 5.6,
    text: 'No exploit was needed. To the browser, main thread code simply is the page — same identity, same privileges, same session. Every reach on screen is an ordinary, documented capability of ordinary page script.',
  });
  tl.tween(reachU, 1, { at: 26.2, dur: 2.4, ease: ease.draw });
  tl.hold(30.9, 0.6);

  // Beat 4 — the refusal
  tl.caption({
    at: 31.5,
    dur: 5.8,
    text: 'The library knows all this, which is why its safer entry point refuses to run this way by accident. Ask it for a runtime with the default settings and it refuses, printing the warning above.',
  });
  tl.tween(errU, 1, { at: 33.0, dur: 0.9, ease: ease.enter });
  tl.tween(dimU, 1, { at: 36.0, dur: 1.0, ease: ease.move });
  tl.tween(closeU, 1, { at: 36.8, dur: 0.9, ease: ease.enter });
  tl.hold(38.5, 1.2);

  return { tl, cam, titleU, pageU, agentU, execU, reachU, warnU, errU, dimU, closeU };
}

// NOTE: file recovered from a truncated write by a concurrent session — the
// remainder is a minimal compiling stub; restore the full render before use.
const scene = buildScene();

export function Render({ s }: { s: SceneState }) {
  const cam = s.get(scene.cam);
  return (
    <Camera {...cam}>
      <rect x={PAGE_X} y={PAGE_Y} width={PAGE_W} height={PAGE_H} fill="none" />
    </Camera>
  );
}
export const vizScene = () => scene;
