// A request has a lifetime — sources:
//   https://developers.cloudflare.com/workers/best-practices/workers-best-practices/
//   https://developers.cloudflare.com/workers/runtime-apis/context/
//   https://developers.cloudflare.com/workers/platform/limits/
// Visual machine: Overlapping request lanes share one isolate while a bounded background tail follows a response.
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
  "An isolate may serve more than one request, sometimes with their work overlapping.",
  "Module level objects can be reused, but the platform does not promise that the same isolate will always return.",
  "Keep each request’s private data inside its handler instead of a shared global variable.",
  "Await work that must finish before you construct the response.",
  "For a small task that can follow the response, attach its promise to the execution context.",
  "The wait can extend execution for up to thirty seconds after the response or a client disconnect.",
  "That extension is bounded and is not a guarantee that arbitrary background work completes.",
  "For durable retries or long waits, put the work in a queue or a workflow instead."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 620, 620, 640, 675, 680, 680, 640];
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
    <Txt x={640} y={73} size={25}>A request has a lifetime</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const a=rise(p,.5), b=rise(p,1.3), global=rise(p,2), needed=rise(p,3), tail=rise(p,4.3), bound=rise(p,5.2), durable=rise(p,7.0);
  return <>
    <rect x="115" y="152" width="1050" height="376" rx="25" fill={PANEL} stroke={ACCENT} strokeWidth="2" />
    <Txt x={225} y={190} size={19} fill={MUTED}>ONE ISOLATE</Txt>
    <path d="M215 220 H1100 M215 300 H1100 M215 380 H1100 M215 460 H1100" stroke={GRID} strokeWidth="2" />
    <Txt x={170} y={263} size={16}>request A</Txt><Txt x={170} y={343} size={16}>request B</Txt><Txt x={170} y={423} size={16}>shared</Txt>
    <rect x="235" y="235" width={420*a} height="38" rx="9" fill={WARM}/><rect x="355" y="315" width={460*b} height="38" rx="9" fill={SECONDARY}/>
    <g opacity={global}><rect x="246" y="395" width="245" height="36" rx="7" fill="#38404c"/><Txt x={368} y={418} size={15}>module globals</Txt><Txt x={700} y={419} size={16} fill={NEGATIVE}>do not put request secrets here</Txt></g>
    <g opacity={needed}><path d="M615 225 V287" stroke={POSITIVE} strokeWidth="3"/><Txt x={615} y={217} size={14} fill={POSITIVE}>response</Txt></g>
    <g opacity={tail}><path d="M655 254 H930" stroke={POSITIVE} strokeWidth="9" strokeDasharray="12 8"/><Txt x={795} y={295} size={16} fill={POSITIVE}>ctx.waitUntil(promise)</Txt></g>
    <g opacity={bound}><path d="M930 220 V290" stroke={NEGATIVE} strokeWidth="3"/><Txt x={930} y={213} size={15} fill={NEGATIVE}>up to 30 seconds</Txt></g>
    <g opacity={durable}><rect x="682" y="445" width="375" height="50" rx="12" fill={PANEL} stroke={POSITIVE} strokeWidth="2"/><Txt x={870} y={476} size={17} fill={POSITIVE}>QUEUE / WORKFLOW</Txt></g>
    <Txt x={640} y={545} size={18} fill={MUTED}>Request state is local; durable work needs a durable owner.</Txt>
  </>;
}
export const vizScene = () => scene;
