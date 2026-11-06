// One name, one coordinator — sources:
//   https://developers.cloudflare.com/durable-objects/concepts/what-are-durable-objects/
//   https://developers.cloudflare.com/durable-objects/api/namespace/
//   https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/
// Visual machine: Names become stable addresses; requests from different places converge on the same per-entity coordinator.
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
  "A shared room needs one place to coordinate changes from its participants.",
  "A Durable Object namespace maps a name to a stable object identity.",
  "Asking for the same name yields a stub for the same logical object.",
  "The stub alone does not start the object; an invocation sends work to it.",
  "Cloudflare places the object and routes callers to its active instance.",
  "Different names identify different objects with their own state and storage.",
  "An object can leave memory when idle and be recreated when a later event arrives.",
  "Choose an identity per entity whose updates must be coordinated together."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 600, 620, 640, 650, 680, 640, 640];
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
    <Txt x={640} y={73} size={25}>One name, one coordinator</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const requests=rise(p,1), invoked=rise(p,2.5), gold=rise(p,5), sleeping=rise(p,6), routes=[{x:168,y:245},{x:168,y:422},{x:418,y:158}];
  return <>
   <path d="M195 245 Q410 245 600 320 M195 422 Q410 422 600 345 M418 180 Q475 265 600 322" fill="none" stroke={GRID} strokeWidth="3" />
   {routes.map((r,i)=><g key={i}><circle cx={r.x} cy={r.y} r="38" fill={PANEL} stroke={MUTED} strokeWidth="2"/><Txt x={r.x} y={r.y+6} size={14}>CALLER</Txt><circle cx={lerp(r.x,600,clamp((p-i*.4)/2.5))} cy={lerp(r.y,330,clamp((p-i*.4)/2.5))} r="8" fill={WARM} opacity={requests}/></g>)}
   <g transform="translate(643 330)" opacity={1-sleeping*.52}><circle r="142" fill={PANEL} stroke={ACCENT} strokeWidth="3"/><circle r="119" fill="none" stroke={GRID} strokeDasharray="5 7"/><Txt x={0} y={-45} size={17} fill={MUTED}>DURABLE OBJECT</Txt><Txt x={0} y={0} size={24}>room:blue</Txt><Txt x={0} y={40} size={15} fill={POSITIVE}>{p < 3 ? 'stable identity' : 'active coordinator'}</Txt></g>
   <g opacity={requests}><rect x="312" y="482" width="310" height="58" rx="10" fill={PANEL} stroke={WARM}/><Txt x={467} y={518} size={16}>getByName("room:blue")</Txt></g>
   <g opacity={invoked}><Txt x={842} y={518} size={17} fill={POSITIVE}>stub.method() invokes the object</Txt></g>
   <g opacity={gold}><path d="M810 365 H922" stroke={GRID} strokeWidth="3"/><circle cx="1028" cy="365" r="90" fill={PANEL} stroke={SECONDARY} strokeWidth="2"/><Txt x={1028} y={362} size={20}>room:gold</Txt><Txt x={1028} y={393} size={14} fill={MUTED}>separate identity</Txt></g>
   <g opacity={sleeping}><Txt x={643} y={365} size={15} fill={WARM}>idle instance may leave memory</Txt></g>
  </>;
}
export const vizScene = () => scene;
