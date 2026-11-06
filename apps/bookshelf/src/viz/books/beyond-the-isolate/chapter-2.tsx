// A sandbox is a trust boundary — sources:
//   https://developers.cloudflare.com/sandbox/
//   https://developers.cloudflare.com/sandbox/concepts/security/
//   https://developers.cloudflare.com/dynamic-workers/getting-started/
// Visual machine: Untrusted code moves into one of two isolated chambers; allowed capabilities cross a gate while secrets stay outside.
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
  "Untrusted code needs a boundary around the things it can reach.",
  "Cloudflare offers sandbox environments based on containers and on dynamic Workers.",
  "A container runs a Linux image; a dynamic Worker runs Java Script in an isolate loaded at runtime.",
  "The host Worker chooses which bindings or methods to expose and whether network access is allowed.",
  "Everything placed inside one sandbox is available to the code running there.",
  "Use a separate sandbox for each trust boundary, such as a user or a job.",
  "Keep credentials outside when possible, and mediate outbound requests or expose narrow methods.",
  "Isolation protects the surrounding application; it does not make untrusted code safe inside its own sandbox."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 600, 600, 680, 640, 600, 640, 640];
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
    <Txt x={640} y={73} size={25}>A sandbox is a trust boundary</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const right=rise(p,1),gate=rise(p,3),danger=rise(p,4),separate=rise(p,5),safe=rise(p,6);
  return <>
   <g transform="translate(90 175)"><rect width="470" height="340" rx="20" fill={PANEL} stroke={WARM} strokeWidth="2"/><Txt x={235} y={46} size={22} fill={WARM}>CONTAINER SANDBOX</Txt><Txt x={235} y={82} size={16} fill={MUTED}>Linux image</Txt><rect x="85" y="125" width="300" height="145" rx="14" fill="#293541"/><Txt x={235} y={170} size={17}>untrusted process</Txt><Txt x={235} y={210} size={15}>files + processes</Txt><Txt x={235} y={242} size={15} fill={NEGATIVE}>shared within sandbox</Txt></g>
   <g opacity={right} transform="translate(720 175)"><rect width="470" height="340" rx="20" fill={PANEL} stroke={SECONDARY} strokeWidth="2"/><Txt x={235} y={46} size={22} fill={SECONDARY}>DYNAMIC WORKER</Txt><Txt x={235} y={82} size={16} fill={MUTED}>JavaScript isolate</Txt><rect x="85" y="125" width="300" height="145" rx="14" fill="#293541"/><Txt x={235} y={170} size={17}>LOADER.load()</Txt><Txt x={235} y={210} size={15}>host-provided methods</Txt><Txt x={235} y={242} size={15} fill={MUTED}>chosen capabilities</Txt></g>
   <g opacity={gate}><path d="M560 340 H720" stroke={POSITIVE} strokeWidth="4"/><circle cx="640" cy="340" r="34" fill={PANEL} stroke={POSITIVE} strokeWidth="3"/><Txt x={640} y={346} size={14} fill={POSITIVE}>HOST</Txt><Txt x={640} y={405} size={15} fill={POSITIVE}>host controls access</Txt></g>
   <g opacity={gate*(1-rise(p,4.4))}><circle cx={lerp(640,800,clamp((p-3.1)/1.3))} cy="285" r="15" fill={POSITIVE}/><Txt x={lerp(640,800,clamp((p-3.1)/1.3))} y={290} size={10} fill="#111827">API</Txt></g>
   <g opacity={danger}><Txt x={640} y={135} size={17} fill={NEGATIVE}>{separate ? 'Separate sandboxes by user or job' : 'Code can read what enters its sandbox'}</Txt></g>
   <g opacity={safe}><Txt x={640} y={550} size={16} fill={MUTED}>Keep credentials outside and mediate access.</Txt></g>
  </>;
}
export const vizScene = () => scene;
