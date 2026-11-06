// Choose by access and consistency — sources:
//   https://developers.cloudflare.com/kv/concepts/how-kv-works/
//   https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/
//   https://developers.cloudflare.com/r2/reference/consistency/
// Visual machine: The same value lands on contrasting read paths: globally cached keys, a private coordinator, and direct object storage.
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
  "The right storage depends on the shape of the data and the promise your reader needs.",
  "Workers key value storage favors widely distributed reads of values addressed by key.",
  "Its caches are eventually consistent, so a different location may briefly read an older value or cached absence.",
  "For a single entity that needs coordinated strongly consistent updates, use a Durable Object with private storage.",
  "For large objects addressed by key, object storage offers a different interface.",
  "Direct reads from R two see completed object writes strongly and globally.",
  "A separate cache in front of an object can still serve an older response.",
  "Pick the consistency contract before you pick the name that sounds fastest."
] as const;

export function buildScene() {
  const tl = new Timeline();
  const cam = tl.channel<CameraState>('cam', CAMERA_HOME, cameraInterp);
  const beat = tl.channel('beat', 0);
  // The camera follows the subject of each beat and returns home for the payoff.
  const focusX = [640, 600, 600, 640, 680, 680, 650, 640];
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
    <Txt x={640} y={73} size={25}>Choose by access and consistency</Txt>
    <Machine p={p}/>
  </g></Camera>;
}
function Machine({ p }: { p: number }) {
  const rows=[{name:'KV',kind:'KEY → VALUE',promise:'cached · eventual',color:WARM},{name:'DO SQLite',kind:'ONE ENTITY',promise:'private · strong',color:POSITIVE},{name:'R2',kind:'KEY → OBJECT',promise:'direct · strong',color:SECONDARY}];
  return <>
   <Txt x={640} y={135} size={16} fill={MUTED}>ILLUSTRATIVE READ PATHS</Txt>
   {rows.map((row,i)=>{const on=rise(p,i===0?.6:i===1?2.6:3.8);const y=188+i*125;return <g key={row.name} opacity={on}>
    <rect x="100" y={y} width="1080" height="98" rx="17" fill={PANEL} stroke={row.color} strokeWidth="2"/>
    <Txt x={210} y={y+42} size={22} fill={row.color}>{row.name}</Txt><Txt x={210} y={y+69} size={14} fill={MUTED}>{row.kind}</Txt>
    <path d={`M330 ${y+49} H680`} stroke={row.color} strokeWidth="3" strokeDasharray="7 7"/><g transform={`translate(${lerp(340,675,clamp(p-(i+1)*1.4))} ${y+49})`}><circle r="19" fill={row.color}/><Txt x={0} y={5} size={12} fill="#111827">{i===0 && p>1.8 && p<6.8 ? 'v1' : 'v2'}</Txt></g>
    <rect x="735" y={y+22} width="345" height="54" rx="9" fill="#293541"/><Txt x={908} y={y+56} size={17}>{row.promise}</Txt>
   </g>})}
   <g opacity={rise(p,5.5)}><rect x="370" y="146" width="540" height="40" rx="10" fill={PANEL} stroke={NEGATIVE}/><Txt x={640} y={172} size={16} fill={NEGATIVE}>A separate cache can still serve stale data.</Txt></g>
  </>;
}
export const vizScene = () => scene;
