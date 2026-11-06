// A log keeps its history — sources:
//   https://developers.cloudflare.com/k2/
//   https://developers.cloudflare.com/k2/concepts/
//   https://developers.cloudflare.com/k2/reference/delivery-guarantees/
//   https://developers.cloudflare.com/k2/platform/limits/
// Visual machine: An ordered strip of records grows while two subscription cursors read it independently and a retention boundary advances.
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
  "A durable log keeps records after a reader has consumed them.",
  "K two appends records to an ordered stream and lets independent subscriptions read that history.",
  "Each subscription tracks its own progress, so one reader does not advance another.",
  "A new subscription can begin at the earliest retained record to replay available history.",
  "Records expire according to retention even if a slow subscription has not read them.",
  "Delivery is at least once, and workers sharing a subscription are not guaranteed to process records in order.",
  "At the time of writing, K two is a public beta for paid Workers accounts, with ten gigabytes per account by default.",
  "The default retention is seven days, with up to thirty days by default and higher limits available by request."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 600, 630, 650, 630, 680, 680, 640];
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
    <Txt x={640} y={73} size={25}>A log keeps its history</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const tape=rise(p,.7),a=rise(p,1.8),b=rise(p,2.5),retention=rise(p,4.4),limits=rise(p,6.2);
  return <>
   <Txt x={640} y={145} size={17} fill={MUTED}>K2 · ORDERED APPEND-ONLY STREAM</Txt>
   {Array.from({length:10},(_,i)=>{const fade=i<2?1-retention*.82:1;return <g key={i} opacity={clamp(tape*10-i)*fade}><rect x={130+i*101} y="215" width="91" height="80" rx="9" fill={i<2 && retention>0.5?NEGATIVE:WARM}/><Txt x={175+i*101} y={263} size={19} fill="#111827">{i+1}</Txt></g>})}
   <path d="M130 316 H1140" stroke={GRID} strokeWidth="3"/>
   <g opacity={a}><path d={`M${lerp(230,780,clamp((p-1.8)/2))} 327 V368`} stroke={POSITIVE} strokeWidth="4"/><Txt x={lerp(230,780,clamp((p-1.8)/2))} y={394} size={16} fill={POSITIVE}>subscription A</Txt></g>
   <g opacity={b}><path d={`M${lerp(230,570,clamp((p-2.5)/2.3))} 405 V448`} stroke={SECONDARY} strokeWidth="4"/><Txt x={lerp(230,570,clamp((p-2.5)/2.3))} y={475} size={16} fill={SECONDARY}>subscription B</Txt></g>
   <g opacity={retention}><path d="M330 200 V300" stroke={NEGATIVE} strokeWidth="3" strokeDasharray="5 6"/><Txt x={235} y={190} size={14} fill={NEGATIVE}>expired</Txt></g><g opacity={rise(p,3)}><Txt x={430} y={333} size={15} fill={MUTED}>← earliest retained</Txt></g>
   <g opacity={limits}><rect x="80" y="455" width="400" height="90" rx="11" fill={PANEL} stroke={MUTED}/><Txt x={280} y={485} size={15}>Public beta · Workers Paid · 10 GB/account</Txt><Txt x={280} y={510} size={14} fill={MUTED}>7 day default · 30 day default maximum</Txt><Txt x={280} y={533} size={15} fill={MUTED}>shared workers may process out of order</Txt></g>
  </>;
}
export const vizScene = () => scene;
