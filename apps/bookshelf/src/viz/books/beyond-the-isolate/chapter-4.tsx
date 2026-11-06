// A platform routes tenant code — sources:
//   https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/get-started/
//   https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/configuration/bindings/
// Visual machine: Tenant name tabs select deployed user Workers within a dispatch namespace, each with its own attached bindings.
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
  "A platform may need to run code deployed on behalf of many customers.",
  "Workers for Platforms groups user Workers in a dispatch namespace.",
  "A dispatch Worker receives a request and selects a user Worker by name.",
  "The selected Worker receives the request through its own fetch handler.",
  "Bindings attached to a user Worker grant access to resources the platform chooses to provide.",
  "Request scoped capabilities can instead be passed through dynamic dispatch properties.",
  "The platform is responsible for choosing tenant identity and the capabilities each tenant receives.",
  "Together, dispatch and bindings let one platform route requests to many separate user programs."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 600, 640, 680, 680, 680, 650, 640];
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
    <Txt x={640} y={73} size={25}>A platform routes tenant code</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const lookup=rise(p,1.4),route=rise(p,2.2),bindings=rise(p,4),props=rise(p,5.1);
  return <>
   <circle cx="150" cy="345" r="65" fill={PANEL} stroke={MUTED} strokeWidth="2"/><Txt x={150} y={351} size={16}>REQUEST</Txt><path d="M220 345 H355" stroke={GRID} strokeWidth="4"/>
   <rect x="355" y="270" width="270" height="150" rx="17" fill={PANEL} stroke={ACCENT} strokeWidth="2"/><Txt x={490} y={313} size={17}>DISPATCH WORKER</Txt><Txt x={490} y={355} size={15} fill={POSITIVE} opacity={lookup}>DISPATCHER.get(name)</Txt>
   <g opacity={route}><path d="M625 345 H710" stroke={POSITIVE} strokeWidth="3"/></g><g opacity={rise(p,1)}><rect x="710" y="155" width="475" height="380" rx="20" fill={PANEL} stroke={SECONDARY} strokeWidth="2"/><Txt x={947} y={194} size={17} fill={SECONDARY}>DISPATCH NAMESPACE</Txt>
    {[0,1,2].map(i=><g key={i}><rect x="765" y={225+i*83} width="360" height="65" rx="10" fill="#293541" stroke={i===0 && p>2.5?POSITIVE:'none'} strokeWidth="2"/><Txt x={880} y={264+i*83} size={17}>TENANT {['A','B','C'][i]}</Txt><Txt x={1040} y={264+i*83} size={14} fill={WARM} opacity={bindings}>bindings</Txt></g>)}
   </g>
   <g opacity={route*(1-rise(p,2.9))} transform={`translate(${lerp(565,825,clamp((p-2.2)/1.2))} ${lerp(390,240,clamp((p-2.2)/1.2))})`}><rect x="-48" y="-17" width="96" height="34" rx="7" fill={POSITIVE}/><Txt x={0} y={5} size={13} fill="#111827">tenant A</Txt></g>
   <g opacity={props}><Txt x={640} y={550} size={16} fill={MUTED}>The platform selects tenant identity and granted capabilities.</Txt></g>
  </>;
}
export const vizScene = () => scene;
