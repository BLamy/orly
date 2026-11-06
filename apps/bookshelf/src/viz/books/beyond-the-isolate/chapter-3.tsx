// A browser as a service — sources:
//   https://developers.cloudflare.com/browser-run/
//   https://developers.cloudflare.com/browser-run/quick-actions/
//   https://developers.cloudflare.com/browser-run/cdp/session-management/
// Visual machine: A browser window renders a page, turns into a screenshot, then keeps a session open for multi-step control.
// Eight beats: each caption is paired with one sampled transformation; no independent clock.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const { ACCENT, SECONDARY, POSITIVE, WARM, NEGATIVE, MUTED, TEXT, PANEL, GRID } = colors;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const rise = (p: number, start: number) => clamp((p - start) / 0.7);
const lerp = (a: number, b: number, u: number) => a + (b-a)*u;
function Txt({x,y,children,size=18,fill=TEXT,opacity=1}: {x:number; y:number; children:React.ReactNode; size?:number; fill?:string; opacity?:number}) {
  return <text x={x} y={y} fill={fill} opacity={opacity} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={size} fontWeight="600">{children}</text>;
}

const CAPTIONS = [
  "Some tasks need a real browser to load a page and execute its Java Script.",
  "Browser Run hosts headless browser instances on Cloudflare’s network.",
  "A quick action handles a common task such as a screenshot or a document capture.",
  "A Worker with a browser binding can call supported quick actions directly.",
  "For a multi step interaction, open a browser session and drive it with a browser automation tool.",
  "Sessions can be managed and reused across requests when the workflow requires it.",
  "Quick actions are a convenient interface to a hosted browser, not a replacement for every custom interaction.",
  "Choose the smallest browser interface that matches the job."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 600, 600, 680, 680, 680, 650, 640];
  const focusZoom = [1, 1.06, 1.08, 1.07, 1.05, 1.08, 1.05, 1];
  CAPTIONS.forEach((text, i) => {
    const at = 0.4 + i * 7.2;
    tl.caption({ at, dur: 6.7, text });
    tl.tween(beat, i + 1, { at: at + 0.3, dur: 1.5, ease: ease.move });
    tl.tween(cam, { x: focusX[i], y: i === CAPTIONS.length - 1 ? 360 : 350, k: focusZoom[i] }, { at: at + 0.35, dur: 1.3, ease: ease.move });
    tl.hold(at + 6.7, 0.3);
  });
  return { tl, beat, cam };
}
const scene = buildScene();
export function Render({ s }: { s: SceneState }) {
  const p = s.get(scene.beat);
  return <Camera {...s.get(scene.cam)}><g>
    <Txt x={640} y={73} size={25}>A browser as a service</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const render=rise(p,1),shot=rise(p,2.3),session=rise(p,4),reuse=rise(p,5);
  return <>
   <g transform="translate(125 160)"><rect width="630" height="370" rx="18" fill={PANEL} stroke={ACCENT} strokeWidth="2"/><rect width="630" height="48" rx="18" fill="#2c3a49"/><circle cx="26" cy="24" r="7" fill={NEGATIVE}/><circle cx="50" cy="24" r="7" fill={WARM}/><circle cx="74" cy="24" r="7" fill={POSITIVE}/><rect x="130" y="12" width="400" height="25" rx="8" fill={PANEL}/><Txt x={330} y={31} size={13} fill={MUTED}>hosted headless browser</Txt>
    <g opacity={render}><rect x="55" y="84" width="520" height="216" rx="8" fill="#283647"/><rect x="80" y="106" width="230" height="22" rx="4" fill={ACCENT}/><rect x="80" y="150" width="395" height="12" rx="4" fill={MUTED}/><rect x="80" y="179" width="338" height="12" rx="4" fill={MUTED}/><rect x="80" y="225" width="145" height="45" rx="7" fill={POSITIVE}/></g>
   </g>
   <g opacity={shot} transform="translate(850 180)"><rect width="300" height="135" rx="13" fill={PANEL} stroke={WARM} strokeWidth="2"/><Txt x={150} y={41} size={17} fill={WARM}>QUICK ACTION</Txt><Txt x={150} y={78} size={15}>quickAction("screenshot", …)</Txt><Txt x={150} y={108} size={14} fill={MUTED}>one task → result</Txt></g>
   <g opacity={shot*(1-rise(p,3.6))} transform={`translate(${lerp(680,880,clamp((p-2.3)/1.3))} ${lerp(325,318,clamp((p-2.3)/1.3))})`}><rect width="76" height="48" rx="5" fill={WARM}/><path d="M9 12 H67 M9 22 H58 M9 32 H40" stroke="#111827" strokeWidth="3"/></g>
   <g opacity={session} transform="translate(850 355)"><rect width="300" height="155" rx="13" fill={PANEL} stroke={SECONDARY} strokeWidth="2"/><Txt x={150} y={40} size={17} fill={SECONDARY}>BROWSER SESSION</Txt><Txt x={150} y={78} size={15}>Puppeteer / Playwright</Txt><Txt x={150} y={111} size={14} fill={MUTED}>multi-step control</Txt><Txt x={150} y={137} size={14} fill={POSITIVE} opacity={reuse}>manage and reuse</Txt></g>
  </>;
}
export const vizScene = () => scene;
