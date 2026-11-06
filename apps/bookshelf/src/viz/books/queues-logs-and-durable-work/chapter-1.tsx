// A queue delivers a task — sources:
//   https://developers.cloudflare.com/queues/reference/how-queues-works/
//   https://developers.cloudflare.com/queues/reference/delivery-guarantees/
//   https://developers.cloudflare.com/queues/configuration/batching-retries/
// Visual machine: A conveyor leases jobs to a consumer; a failed acknowledgment sends the same job around again.
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
  "A request should not wait while a slow task works through a backlog.",
  "A producer sends a message to a queue, and a consumer processes a batch later.",
  "Queues deliver at least once, so a message can occasionally arrive again.",
  "A consumer acknowledges successful work and can request a retry for a failure.",
  "If processing fails before the acknowledgment is recorded, the task may be delivered again.",
  "Give a task a stable identifier and make its side effects safe to repeat.",
  "Configure retries and a dead letter queue for messages that cannot be processed successfully.",
  "The queue is for distributing work, not for independently replaying a shared history forever."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 600, 600, 640, 680, 650, 650, 640];
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
    <Txt x={640} y={73} size={25}>A queue delivers a task</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const send=rise(p,1),retry=rise(p,2.4),id=rise(p,5),dead=rise(p,6),cards=[0,1,2,3];
  return <>
   <path d="M145 325 H1090" stroke={GRID} strokeWidth="12" strokeLinecap="round"/><path d="M145 325 H1090" stroke={WARM} strokeWidth="4" strokeDasharray="8 10"/>
   <Txt x={160} y={255} size={17} fill={MUTED}>PRODUCER</Txt><Txt x={640} y={255} size={17} fill={MUTED}>QUEUE</Txt><Txt x={1070} y={255} size={17} fill={MUTED}>CONSUMER</Txt>
   {cards.map((i)=>{const u=send;return <g key={i} transform={`translate(${lerp(190+i*80,650+i*80,u)} 325)`}><rect x="-27" y="-35" width="54" height="70" rx="9" fill={i===0?NEGATIVE:WARM}/><Txt x={0} y={7} size={14} fill="#111827">{i+1}</Txt></g>})}
   <g opacity={retry}><path d="M1005 330 Q1005 470 750 470 Q675 470 675 405" fill="none" stroke={NEGATIVE} strokeWidth="4" strokeDasharray="8 6"/><Txt x={845} y={495} size={16} fill={NEGATIVE}>retry / redelivery</Txt></g>
   <g opacity={retry*(1-rise(p,4.3))} transform={`translate(${lerp(1005,675,clamp((p-2.4)/1.7))} ${330+75*clamp((p-2.4)/1.7)+85*Math.sin(Math.PI*clamp((p-2.4)/1.7))})`}><rect x="-19" y="-25" width="38" height="50" rx="7" fill={NEGATIVE}/><Txt x={0} y={5} size={14} fill="#111827">1</Txt></g>
   <g opacity={rise(p,2.5)}><rect x="982" y="360" width="180" height="50" rx="10" fill={PANEL} stroke={POSITIVE}/><Txt x={1072} y={391} size={16} fill={POSITIVE}>ack()</Txt></g>
   <g opacity={id}><rect x="250" y="515" width="360" height="45" rx="9" fill={PANEL} stroke={SECONDARY}/><Txt x={430} y={541} size={15} fill={SECONDARY}>stable idempotency key</Txt></g>
   <g opacity={dead}><rect x="700" y="515" width="290" height="45" rx="9" fill={PANEL} stroke={MUTED}/><Txt x={845} y={541} size={15}>dead-letter queue</Txt></g>
  </>;
}
export const vizScene = () => scene;
