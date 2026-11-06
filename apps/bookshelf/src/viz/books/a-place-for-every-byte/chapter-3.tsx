// Three ways to use SQL — sources:
//   https://developers.cloudflare.com/d1/
//   https://developers.cloudflare.com/d1/best-practices/read-replication/
//   https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
//   https://developers.cloudflare.com/hyperdrive/concepts/connection-pooling/
// Visual machine: Rows flow through three lenses: a D1 database, an object-local SQLite table, and a pooled connection to an existing database.
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
  "Tables and queries can live behind several different Cloudflare interfaces.",
  "D one is a managed serverless relational database built on sequel lite.",
  "When using read replicas, a session and its bookmarks provide sequential consistency across that session.",
  "A Durable Object’s sequel lite database is private to that object and sits alongside its coordinating code.",
  "Hyperdrive is different: it helps Workers connect to an existing supported database.",
  "It pools connections close to the database and can cache eligible queries.",
  "The existing database remains the database; the pool is an access layer.",
  "Choose shared relational data, entity local transactions, or an existing database connection according to the workload."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 600, 600, 640, 680, 680, 680, 640];
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
    <Txt x={640} y={73} size={25}>Three ways to use SQL</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const cols=[{x:95,name:'D1',sub:'shared relational DB',color:WARM},{x:465,name:'DO SQLite',sub:'private per object',color:POSITIVE},{x:835,name:'HYPERDRIVE',sub:'existing database',color:SECONDARY}];
  return <>
   {cols.map((c,i)=>{let on=rise(p,i===0?.5:i===1?2.5:4);return <g key={c.name} opacity={on} transform={`translate(${c.x} 185)`}>
    <rect width="345" height="345" rx="18" fill={PANEL} stroke={c.color} strokeWidth="2"/><Txt x={172} y={43} size={21} fill={c.color}>{c.name}</Txt><Txt x={172} y={73} size={15} fill={MUTED}>{c.sub}</Txt>
    {i<2 ? <g>{[0,1,2].map(j=><g key={j}><rect x="35" y={107+j*55} width="275" height="43" rx="6" fill="#293541"/><Txt x={94} y={135+j*55} size={14}>{['Ari','Bo','Cai'][j]}</Txt><Txt x={230} y={135+j*55} size={14} fill={c.color}>{['12','8','5'][j]}</Txt></g>)}</g> : <g><path d="M75 160 H265" stroke={c.color} strokeWidth="4" strokeDasharray="8 6"/><circle cx="75" cy="160" r="30" fill={PANEL} stroke={c.color} strokeWidth="2"/><circle cx="265" cy="160" r="48" fill={PANEL} stroke={c.color} strokeWidth="2"/><Txt x={75} y={166} size={13}>pool</Txt><Txt x={265} y={165} size={13}>DB</Txt><Txt x={172} y={235} size={14}>PostgreSQL / MySQL</Txt></g>}
    <Txt x={172} y={314} size={14} fill={MUTED}>{i===0?'withSession() + bookmark':i===1?'transaction with entity':'pool + eligible cache'}</Txt>
   </g>})}
   <Txt x={640} y={550} size={17} fill={MUTED}>Which code owns the data and consistency promise?</Txt>
  </>;
}
export const vizScene = () => scene;
