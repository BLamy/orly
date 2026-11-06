// When you need a Linux process — sources:
//   https://developers.cloudflare.com/containers/
//   https://developers.cloudflare.com/containers/api/durable-object-container/
// Visual machine: A Worker hands a request to a Durable Object that starts a Linux image with processes and an HTTP service.
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
  "Some workloads need a Linux process or a native dependency rather than only a Worker isolate.",
  "Cloudflare Containers run an image you provide inside a Linux virtual machine.",
  "A Worker can reach a container through a Durable Object that controls its lifecycle.",
  "Inside the image, processes see the filesystem and other resources made available to that container.",
  "The Worker can forward requests to an application listening inside the container.",
  "Instances can start on demand and stop when idle according to their configuration.",
  "Choose this environment when the software really needs its operating system and packaged dependencies.",
  "A container extends the Worker application with a different execution environment."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 650, 670, 680, 650, 650, 650, 640];
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
    <Txt x={640} y={73} size={25}>When you need a Linux process</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const obj=rise(p,2),vm=rise(p,1.2),process=rise(p,3),request=rise(p,4),stop=rise(p,6);
  return <>
   <circle cx="145" cy="340" r="70" fill={PANEL} stroke={ACCENT} strokeWidth="2"/><Txt x={145} y={346} size={19}>WORKER</Txt>
   <path d="M215 340 H325 M515 340 H635" stroke={GRID} strokeWidth="4"/>
   <g opacity={obj}><circle cx="420" cy="340" r="92" fill={PANEL} stroke={ACCENT} strokeWidth="2"/><Txt x={420} y={334} size={16}>DURABLE</Txt><Txt x={420} y={359} size={16}>OBJECT</Txt><Txt x={420} y={465} size={14} fill={MUTED}>controls lifecycle</Txt></g>
   <g opacity={vm}><rect x="650" y="185" width="530" height="310" rx="20" fill="#1b2635" stroke={SECONDARY} strokeWidth="2"/><Txt x={915} y={228} size={18} fill={SECONDARY}>LINUX VIRTUAL MACHINE</Txt><rect x="710" y="265" width="410" height="165" rx="13" fill={PANEL} stroke={POSITIVE} strokeWidth="2"/><Txt x={915} y={300} size={16} fill={POSITIVE}>CONTAINER IMAGE</Txt></g>
   <g opacity={process}><Txt x={915} y={352} size={19}>process + filesystem</Txt><Txt x={915} y={387} size={15} fill={MUTED}>application listens for requests</Txt></g>
   <g opacity={request}><circle cx={lerp(215,650,clamp(p-4))} cy="340" r="10" fill={WARM}/></g>
   <g opacity={stop}><Txt x={640} y={550} size={17} fill={MUTED}>The object manages the container lifecycle.</Txt></g>
  </>;
}
export const vizScene = () => scene;
