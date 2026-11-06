// A private transactional notebook — sources:
//   https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
//   https://developers.cloudflare.com/durable-objects/api/alarms/
// Visual machine: A per-object table accepts a transaction, schedules an alarm, and rolls back along a recovery timeline.
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
  "The object needs a notebook that survives the process holding it.",
  "Cloudflare recommends the sequel lite storage backend for new Durable Object namespaces.",
  "Each object has private, strongly consistent transactional storage attached to its identity.",
  "The sequel interface can update rows inside a transaction, atomically with other storage operations on that object.",
  "An alarm schedules a future invocation of the object without an incoming request.",
  "An alarm can be retried and may run more than once, so its effects should tolerate repetition.",
  "Point in time recovery can restore the object’s sequel lite data to a point in the previous thirty days.",
  "This private notebook is per object; it is not a transaction spanning separate objects."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 600, 600, 620, 680, 680, 680, 640];
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
    <Txt x={640} y={73} size={25}>A private transactional notebook</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const rows=rise(p,1), transaction=rise(p,2.6), alarm=rise(p,4), recover=rise(p,6), finish=rise(p,7);
  return <>
   <g transform="translate(125 165)"><rect width="625" height="360" rx="20" fill={PANEL} stroke={ACCENT} strokeWidth="2"/><Txt x={312} y={39} size={20}>PRIVATE OBJECT STORAGE</Txt><path d="M28 66 H597" stroke={GRID}/>
    <Txt x={155} y={105} size={16} fill={MUTED}>member</Txt><Txt x={405} y={105} size={16} fill={MUTED}>role</Txt>
    {[0,1,2].map((i)=><g key={i} opacity={clamp(rows*3-i)}><rect x="40" y={125+i*60} width="545" height="48" rx="8" fill="#263240"/><Txt x={155} y={155+i*60} size={17}>{['Ari','Bo','Cai'][i]}</Txt><Txt x={405} y={155+i*60} size={17} fill={POSITIVE}>{['host','guest','guest'][i]}</Txt></g>)}
    <g opacity={transaction}><rect x="28" y="113" width="570" height="182" rx="13" fill="none" stroke={POSITIVE} strokeWidth="3" strokeDasharray="9 6"/><Txt x={312} y={326} size={16} fill={POSITIVE}>ctx.storage.sql.exec() · atomic transaction</Txt></g>
   </g>
   <g opacity={alarm}><circle cx="955" cy="254" r="74" fill={PANEL} stroke={WARM} strokeWidth="3"/><path d="M955 208 V254 L991 273" fill="none" stroke={WARM} strokeWidth="4"/><Txt x={955} y={365} size={18} fill={WARM}>setAlarm() → alarm()</Txt><Txt x={955} y={394} size={15} fill={MUTED}>retry-safe effects</Txt></g>
   <g opacity={recover}><path d="M810 492 H1100" stroke={GRID} strokeWidth="5"/><path d="M1100 492 H850" stroke={SECONDARY} strokeWidth="5"/><path d="M850 492 l20 -12 m-20 12 l20 12" stroke={SECONDARY} strokeWidth="4"/><Txt x={962} y={466} size={17} fill={SECONDARY}>PITR · up to 30 days</Txt></g>
   <Txt x={640} y={550} size={17} fill={MUTED}>{finish ? 'Transactions and recovery belong to one object.' : 'The notebook survives its in-memory instance.'}</Txt>
  </>;
}
export const vizScene = () => scene;
