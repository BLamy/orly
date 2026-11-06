// Bindings make capabilities explicit — sources:
//   https://developers.cloudflare.com/workers/runtime-apis/bindings/
//   https://developers.cloudflare.com/workers/languages/typescript/
//   https://developers.cloudflare.com/workers/wrangler/configuration/
//   series/cloudflare-workers-compute-storage/workers-sdk-digest.txt
// Visual machine: A configuration strip folds into a typed environment and plugs into a real resource.
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
  "A Worker needs a deliberate way to reach the resources it uses.",
  "Wrangler configuration names the Worker, its compatibility date, and its bindings.",
  "A binding gives the code a capability to use a resource without placing an account token in every request.",
  "The runtime supplies those capabilities on the environment passed to the handler.",
  "The Wrangler types command generates an environment type from the configuration and matching runtime definitions.",
  "Now the editor can check that the binding name and methods agree with the configured resource.",
  "Local development can simulate supported bindings or connect configured remote resources.",
  "Keep configuration, generated types, and deployed bindings in agreement as the Worker changes."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 600, 600, 650, 650, 680, 630, 640];
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
    <Txt x={640} y={73} size={25}>Bindings make capabilities explicit</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const stage = Math.floor(p); const wire = rise(p,3.1);
  return <>
    <path d="M280 352 H1020" stroke={GRID} strokeWidth="5" />
    <path d="M280 352 H1020" stroke={POSITIVE} strokeWidth="4" strokeDasharray="740" strokeDashoffset={740*(1-wire)} />
    <g transform="translate(110 185)">
      <rect width="300" height="330" rx="18" fill={PANEL} stroke={ACCENT} strokeWidth="2" />
      <Txt x={150} y={41} size={19}>wrangler.jsonc</Txt>
      <path d="M24 62 H276" stroke={GRID}/>
      <Txt x={150} y={105} size={16} fill={MUTED}>name + compatibility_date</Txt>
      <g opacity={rise(p,1.1)}><rect x="30" y="143" width="240" height="76" rx="8" fill="#29313b"/><Txt x={150} y={174} size={18} fill={WARM}>KV binding</Txt><Txt x={150} y={201} size={15}>MY_KV</Txt></g>
      <Txt x={150} y={280} size={16} fill={MUTED}>configuration</Txt>
    </g>
    <g opacity={rise(p,2.5)*(1-rise(p,4.1))}><circle cx={lerp(410,498,clamp((p-2.5)/1.3))} cy="400" r="12" fill={POSITIVE}/></g>
    <g opacity={rise(p,3)} transform="translate(498 236)"><rect width="260" height="226" rx="22" fill={PANEL} stroke={POSITIVE} strokeWidth="3"/><Txt x={130} y={43} size={18}>WORKER</Txt><Txt x={130} y={104} size={23} fill={POSITIVE}>env.MY_KV</Txt><Txt x={130} y={150} size={16} fill={MUTED}>capability, not a token</Txt></g>
    <g opacity={rise(p,4)} transform="translate(510 100)"><rect width="236" height="68" rx="12" fill={PANEL} stroke={SECONDARY} strokeWidth="2"/><Txt x={118} y={28} size={16} fill={SECONDARY}>wrangler types</Txt><Txt x={118} y={52} size={15}>generated Env</Txt><path d="M118 68 V132" stroke={SECONDARY} strokeWidth="2" strokeDasharray="5 5"/></g>
    <g opacity={rise(p,3.4)} transform="translate(877 236)"><ellipse cx="130" cy="30" rx="105" ry="28" fill={PANEL} stroke={WARM} strokeWidth="2"/><path d="M25 30 V170 Q130 220 235 170 V30" fill={PANEL} stroke={WARM} strokeWidth="2"/><ellipse cx="130" cy="30" rx="105" ry="28" fill={PANEL} stroke={WARM} strokeWidth="2"/><Txt x={130} y={104} size={22} fill={WARM}>KV RESOURCE</Txt></g>
    <Txt x={640} y={545} size={18} fill={MUTED}>{stage < 4 ? 'Configuration describes the capabilities' : stage < 7 ? 'The runtime supplies a typed binding' : 'Configuration + types + deployed resource'}</Txt>
  </>;
}
export const vizScene = () => scene;
