// A request meets an isolate — sources:
//   https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/
//   https://developers.cloudflare.com/workers/reference/how-workers-works/
//   series/cloudflare-workers-compute-storage/workers-sdk-digest.txt
// Visual machine: A request card crosses a Worker membrane, turns into a response, and returns.
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
  "A request arrives, but there is no server for you to keep running.",
  "Cloudflare routes the request to a Worker running inside an isolate.",
  "In the module format, the exported fetch handler receives the request, the environment, and an execution context.",
  "The request describes the incoming method, address, headers, and body.",
  "Your handler can compute an answer or fetch another service.",
  "It returns a response containing a status, headers, and an optional body.",
  "The response travels back to the caller while the platform manages the process around it.",
  "Think of the Worker as code invoked for a request, not a machine you administer."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 640, 635, 620, 680, 660, 600, 640];
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
    <Txt x={640} y={73} size={25}>A request meets an isolate</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const travel = p < 5 ? lerp(155, 630, clamp(p / 3.5)) : lerp(630, 155, clamp((p - 5.2) / 2.5));
  const returning = p >= 5;
  return <>
    <path d="M150 430 H1120" stroke={GRID} strokeWidth="5" strokeDasharray="5 10" />
    <circle cx="150" cy="430" r="68" fill={PANEL} stroke={MUTED} strokeWidth="2" />
    <Txt x={150} y={436} size={18}>CALLER</Txt>
    <circle cx="650" cy="342" r="182" fill={PANEL} stroke={ACCENT} strokeWidth="3" />
    <circle cx="650" cy="342" r="163" fill="none" stroke={GRID} strokeDasharray="5 8" />
    <Txt x={650} y={265} size={18} fill={MUTED}>WORKER ISOLATE</Txt>
    <Txt x={650} y={310} size={25} fill={TEXT}>fetch(request, env, ctx)</Txt>
    <g opacity={rise(p,2)}><Txt x={565} y={368} size={16} fill={WARM}>request</Txt><Txt x={650} y={368} size={16} fill={POSITIVE}>env</Txt><Txt x={735} y={368} size={16} fill={SECONDARY}>ctx</Txt></g>
    <g opacity={rise(p,4.3)}><path d="M834 342 H1015" stroke={SECONDARY} strokeWidth="3" strokeDasharray="8 7"/><circle cx="1092" cy="342" r="67" fill={PANEL} stroke={SECONDARY} strokeWidth="2"/><Txt x={1092} y={339} size={16}>OUTBOUND</Txt><Txt x={1092} y={361} size={16}>FETCH</Txt></g>
    <g transform={`translate(${travel} 430)`}>
      <rect x="-54" y="-34" width="108" height="68" rx="12" fill={returning ? POSITIVE : WARM} />
      <Txt x={0} y={-1} size={15} fill="#111827">{returning ? 'Response' : 'Request'}</Txt>
      <path d="M-31 12 H30 M-31 20 H8" stroke="#111827" opacity=".55" strokeWidth="2" />
    </g>
    <Txt x={640} y={540} size={19} fill={MUTED}>{p < 4 ? 'One incoming request invokes your code' : p < 5 ? 'The handler may call another service' : 'The returned response travels to the caller'}</Txt>
  </>;
}
export const vizScene = () => scene;
