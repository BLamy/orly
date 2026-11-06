// Objects are not rows — sources:
//   https://developers.cloudflare.com/r2/
//   https://developers.cloudflare.com/r2/reference/consistency/
//   https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
// Visual machine: A large file becomes independently addressable object parts, while cached copies diverge from the authoritative bucket.
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
  "A photograph, a backup, and a video are naturally stored as objects rather than database rows.",
  "An R two bucket holds objects under keys; a Worker binding can put and get those objects.",
  "Large uploads can be assembled from parts before the completed object becomes visible.",
  "Direct object reads, writes, deletes, and listings have strong consistency guarantees.",
  "The service does not charge Internet egress fees for retrieving objects.",
  "If a cached custom domain serves the object, that separate cache can outlive an overwrite or deletion.",
  "Use versioned names or cache purging when a public cached copy needs to change.",
  "Keep metadata and access patterns in mind: an object store is not a relational query engine."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 600, 600, 650, 650, 680, 680, 640];
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
    <Txt x={640} y={73} size={25}>Objects are not rows</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const parts=rise(p,2),complete=rise(p,2.5),cache=rise(p,5),version=rise(p,6);
  return <>
   <g transform="translate(100 195)"><rect width="365" height="290" rx="20" fill={PANEL} stroke={WARM} strokeWidth="2"/><Txt x={182} y={42} size={20}>LARGE OBJECT</Txt>
    {[0,1,2,3].map(i=><g key={i}><rect x={35+i*76} y="100" width="65" height="112" rx="7" fill={WARM} opacity={.16+.84*clamp(parts*4-i)}/><Txt x={67+i*76} y={162} size={14} fill="#111827">part {i+1}</Txt></g>)}
    <Txt x={182} y={262} size={15} fill={MUTED}>multipart upload</Txt>
   </g>
   <path d="M470 338 H595" stroke={GRID} strokeWidth="4"/><path d="M470 338 H595" stroke={POSITIVE} strokeWidth="4" strokeDasharray="125" strokeDashoffset={125*(1-complete)}/>
   <g opacity={complete} transform="translate(615 195)"><ellipse cx="120" cy="32" rx="105" ry="29" fill={PANEL} stroke={POSITIVE} strokeWidth="2"/><path d="M15 32 V235 Q120 280 225 235 V32" fill={PANEL} stroke={POSITIVE} strokeWidth="2"/><ellipse cx="120" cy="32" rx="105" ry="29" fill={PANEL} stroke={POSITIVE} strokeWidth="2"/><Txt x={120} y={116} size={22} fill={POSITIVE}>R2 BUCKET</Txt><Txt x={120} y={155} size={16}>object / key</Txt><Txt x={120} y={185} size={15} fill={MUTED}>direct: latest</Txt></g>
   <g opacity={cache}><path d="M850 338 H940" stroke={GRID} strokeWidth="3"/><rect x="932" y="260" width="240" height="155" rx="15" fill={PANEL} stroke={SECONDARY} strokeWidth="2"/><Txt x={1052} y={305} size={18} fill={SECONDARY}>CUSTOM DOMAIN</Txt><Txt x={1052} y={346} size={16}>cache may hold old</Txt><Txt x={1052} y={376} size={16}>content or a miss</Txt></g>
   <g opacity={version}><Txt x={640} y={540} size={17} fill={POSITIVE}>Version keys or purge the cache when freshness matters.</Txt></g>
  </>;
}
export const vizScene = () => scene;
