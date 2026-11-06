// The room sleeps but connections stay — sources:
//   https://developers.cloudflare.com/durable-objects/best-practices/websockets/
//   https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/
// Visual machine: Client strands remain connected while the object vanishes, then reconstructs from storage and socket attachments.
// Eight beats: each caption is paired with one sampled transformation; no independent clock.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

const { ACCENT, SECONDARY, POSITIVE, WARM, NEGATIVE, MUTED, TEXT, PANEL, GRID } = colors;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
const rise = (p: number, start: number) => clamp((p - start) / 0.7);
const lerp = (a: number, b: number, u: number) => a + (b-a)*u;
function Txt({x,y,children,size=18,fill=TEXT}: {x:number; y:number; children:React.ReactNode; size?:number; fill?:string}) {
  return <text x={x} y={y} fill={fill} textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize={size} fontWeight="600">{children}</text>;
}

const CAPTIONS = [
  "A live room can have connected clients even while nobody is sending messages.",
  "The hibernation web socket interface lets an idle object leave memory without disconnecting those clients.",
  "Accepting the server socket through the object state enables this hibernation path.",
  "While the object sleeps, its ordinary in memory variables are gone.",
  "A new event wakes it and runs the constructor again before handling the event.",
  "Restore durable room data from storage and connection specific data from socket attachments.",
  "The hibernation interface applies when the object is the web socket server, not to outgoing sockets.",
  "Treat memory as a cache of the room, and durable storage as the state that survives eviction."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 640, 640, 640, 640, 640, 640, 640];
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
    <Txt x={640} y={73} size={25}>The room sleeps but connections stay</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const sockets=rise(p,1),sleep=rise(p,3),wake=rise(p,4.4),restore=rise(p,5),clients=[{x:165,y:245},{x:165,y:430},{x:1090,y:245},{x:1090,y:430}];
  return <>
   {clients.map((a,i)=><g key={i}><path d={`M${a.x} ${a.y} Q640 ${a.y} 640 342`} fill="none" stroke={POSITIVE} strokeWidth="3" opacity={sockets}/><circle cx={a.x} cy={a.y} r="46" fill={PANEL} stroke={POSITIVE} strokeWidth="2"/><Txt x={a.x} y={a.y+6} size={15}>CLIENT</Txt></g>)}
   <circle cx="640" cy="342" r="155" fill={PANEL} stroke={ACCENT} strokeWidth="3" strokeDasharray={sleep>0.5?'8 8':undefined}/>
   <g opacity={1-sleep+sleep*wake}><Txt x={640} y={285} size={18} fill={MUTED}>OBJECT IN MEMORY</Txt><rect x="548" y="310" width="184" height="53" rx="10" fill="#354351"/><Txt x={640} y={344} size={17}>room variables</Txt></g>
   <g opacity={sleep*(1-wake)}><Txt x={640} y={329} size={22} fill={WARM}>HIBERNATED</Txt><Txt x={640} y={360} size={15} fill={MUTED}>memory cleared</Txt></g>
   <g opacity={wake}><Txt x={640} y={400} size={16} fill={SECONDARY}>constructor() runs again</Txt></g>
   <g opacity={restore}><rect x="395" y="500" width="226" height="52" rx="10" fill={PANEL} stroke={SECONDARY} strokeWidth="2"/><Txt x={508} y={532} size={15}>durable storage</Txt><rect x="655" y="500" width="226" height="52" rx="10" fill={PANEL} stroke={POSITIVE} strokeWidth="2"/><Txt x={768} y={532} size={15}>socket attachments</Txt></g>
   <Txt x={640} y={145} size={17} fill={POSITIVE}>acceptWebSocket() keeps clients connected</Txt>
  </>;
}
export const vizScene = () => scene;
