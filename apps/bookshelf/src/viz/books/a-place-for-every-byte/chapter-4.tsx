// Versioned trees and analytical tables — sources:
//   https://developers.cloudflare.com/artifacts/
//   https://developers.cloudflare.com/artifacts/api/workers-binding/
//   https://developers.cloudflare.com/basin/
//   https://developers.cloudflare.com/basin-sql/get-started/
// Visual machine: A commit tree branches beside events flowing into Iceberg tables and a query lens.
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
  "Some data is a changing project, while other data is a stream of observations.",
  "Artifacts stores versioned files and projects in Git compatible repositories.",
  "A Worker can create or inspect a repository, and ordinary Git clients can push or clone it.",
  "Branches and commits preserve history instead of treating every version as an unrelated blob.",
  "Basin addresses analytics: pipelines ingest and transform data into tables.",
  "Its catalog manages Apache Iceberg tables backed by object storage.",
  "Basin sequel queries those tables; it is an analytics path rather than a replacement for the application’s transaction store.",
  "Use a versioned tree for project history and an analytical table for querying accumulated events."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 600, 600, 600, 680, 680, 680, 640];
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
    <Txt x={640} y={73} size={25}>Versioned trees and analytical tables</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const commits=rise(p,1),branch=rise(p,2.6),basin=rise(p,4),flow=rise(p,5),query=rise(p,6);
  return <>
   <g transform="translate(95 155)"><rect width="500" height="380" rx="20" fill={PANEL} stroke={WARM} strokeWidth="2"/><Txt x={250} y={45} size={22} fill={WARM}>ARTIFACTS</Txt><Txt x={250} y={78} size={16} fill={MUTED}>Git-compatible versioned trees</Txt>
    <path d="M70 230 H430" stroke={GRID} strokeWidth="5"/><path d="M250 230 Q325 115 420 145" fill="none" stroke={SECONDARY} strokeWidth="4" opacity={branch}/>
    {[70,160,250,340,430].map((x,i)=><g key={i} opacity={clamp(commits*5-i)}><circle cx={x} cy="230" r="17" fill={WARM}/><Txt x={x} y={275} size={14}>commit</Txt></g>)}
    <g opacity={branch}><circle cx="420" cy="145" r="17" fill={SECONDARY}/><Txt x={350} y={115} size={15} fill={SECONDARY}>branch</Txt></g>
   </g>
   <g opacity={basin} transform="translate(685 155)"><rect width="500" height="380" rx="20" fill={PANEL} stroke={POSITIVE} strokeWidth="2"/><Txt x={250} y={45} size={22} fill={POSITIVE}>BASIN</Txt><Txt x={250} y={78} size={16} fill={MUTED}>analytics on Iceberg tables</Txt>
    <path d="M50 190 H450" stroke={GRID} strokeWidth="4"/>
    {[0,1,2,3,4].map(i=><circle key={i} cx={lerp(55,430,clamp(flow-i*.13))} cy="190" r="10" fill={POSITIVE}/>)}
    <rect x="40" y="245" width="125" height="55" rx="8" fill="#293541"/><Txt x={102} y={279} size={14}>Pipelines</Txt>
    <rect x="188" y="245" width="125" height="55" rx="8" fill="#293541"/><Txt x={250} y={279} size={14}>Catalog</Txt>
    <rect x="336" y="245" width="125" height="55" rx="8" fill="#293541" stroke={query?POSITIVE:'none'}/><Txt x={398} y={279} size={14}>Basin SQL</Txt>
    <Txt x={250} y={336} size={15} fill={MUTED}>Iceberg tables on R2</Txt>
   </g>
  </>;
}
export const vizScene = () => scene;
