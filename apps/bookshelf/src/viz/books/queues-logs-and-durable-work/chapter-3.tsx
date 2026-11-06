// A workflow remembers the steps — sources:
//   https://developers.cloudflare.com/workflows/get-started/guide/
//   https://developers.cloudflare.com/workflows/build/sleeping-and-retrying/
//   https://developers.cloudflare.com/queues/reference/delivery-guarantees/
//   https://developers.cloudflare.com/k2/reference/delivery-guarantees/
//   https://developers.cloudflare.com/workflows/build/trigger-workflows/
//   https://developers.cloudflare.com/k2/features/produce/
// Visual machine: A checkpointed work ribbon survives a failed step, sleeps, resumes, and connects queue and log to one business process.
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
  "Some jobs are not one task but a sequence that must survive interruption.",
  "A workflow records the result of each durable step so completed work can be reused when execution resumes.",
  "A failed step can retry with configured delays and backoff.",
  "A workflow can sleep or wait for an external event without holding a process open.",
  "For example, a queue message can start a workflow for a requested operation.",
  "That workflow can perform the operation and publish an event to a log for other subscribers.",
  "A retry can repeat side effects, so use stable identifiers and idempotent operations at the boundaries.",
  "Queues distribute tasks, logs preserve replayable history, and workflows remember the progress of a process."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 600, 620, 650, 600, 680, 650, 640];
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
    <Txt x={640} y={73} size={25}>A workflow remembers the steps</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const steps=[{x:330,label:'step.do()',sub:'save result',color:POSITIVE},{x:595,label:'step.do()',sub:'retry on failure',color:WARM},{x:860,label:'step.sleep()',sub:'wait and resume',color:SECONDARY}];
  return <>
   <path d="M300 325 H1000" stroke={GRID} strokeWidth="7"/>
   {steps.map((v,i)=><g key={v.label+i} opacity={rise(p,i*1.1+.5)}><rect x={v.x-105} y="268" width="210" height="115" rx="17" fill={PANEL} stroke={v.color} strokeWidth="2"/><Txt x={v.x} y={310} size={18} fill={v.color}>{v.label}</Txt><Txt x={v.x} y={345} size={14} fill={MUTED}>{v.sub}</Txt></g>)}
   <g opacity={rise(p,.8)}><path d="M330 420 H860" stroke={GRID} strokeWidth="4"/>{[330,595,860].map((x,i)=><circle key={x} cx={x} cy="420" r="9" fill={p>i*1.2+1.5?POSITIVE:GRID}/>)}<circle cx={lerp(330,860,clamp((p-1)/3.5))} cy="420" r="6" fill={WARM}/></g>
   <g opacity={rise(p,2)}><path d="M580 262 Q592 195 660 217" fill="none" stroke={NEGATIVE} strokeWidth="3"/><Txt x={685} y={218} size={14} fill={NEGATIVE}>retry</Txt></g>
   <g opacity={rise(p,4)}><rect x="75" y="460" width="250" height="65" rx="12" fill={PANEL} stroke={WARM}/><Txt x={200} y={500} size={16}>QUEUE MESSAGE</Txt><path d="M200 459 Q220 400 300 384" fill="none" stroke={WARM} strokeWidth="3"/></g>
   <g opacity={rise(p,5)}><rect x="956" y="460" width="250" height="65" rx="12" fill={PANEL} stroke={SECONDARY}/><Txt x={1081} y={500} size={16}>K2 EVENT</Txt><path d="M980 384 Q1060 400 1080 459" fill="none" stroke={SECONDARY} strokeWidth="3"/></g>
   <g opacity={rise(p,6)}><Txt x={640} y={550} size={17} fill={POSITIVE}>Stable identifiers protect repeated side effects.</Txt></g>
  </>;
}
export const vizScene = () => scene;
