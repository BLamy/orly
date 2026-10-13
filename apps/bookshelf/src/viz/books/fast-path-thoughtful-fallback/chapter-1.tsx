// Sources: pinned charter mission, explicit local/hybrid modes, E9–E11.
// A persistent candidate landscape flattens when the fast path loses support.
// The hybrid route appears only in enabled mode; local-only uncertainty stops.
import { line, curveCatmullRom, scaleLinear } from 'd3';
import { Camera } from '../../core';
import type { SceneState } from '../../core';
import { C, chapter, Header, Label, Panel, Chip, Arrow, on, span, lerp } from '../recordings-become-practice/shared/kit';
const CAPTIONS = [
  "The proposed partnership gives the large and small models different jobs. A large model can help interpret a task, teach examples, or handle difficult situations.",
  "A small local policy tries to recognize the familiar decisions cheaply. It receives the current context and selects from the supported action menu.",
  "For a longer task, the larger model might propose a subgoal. The smaller policy can then choose the next checked move toward that subgoal.",
  "When the fast path lacks enough support, it abstains. In an explicitly enabled hybrid mode, the system can ask the larger model for help.",
  "That fallback has a cost: input processing, network travel, model computation, and possibly another round of observation. We include all of it in the measurements.",
  "In local-only mode, uncertainty means stopping or asking the person to continue. It must not quietly become a remote inference request.",
  "The user's proposed large model is G L M five point three Flash. We still need to pin the actual provider, served model, settings, and supported interfaces.",
  "The aim is to concentrate expensive reasoning where it adds value, while testing whether routine decisions can move through a smaller, faster path."
] as const;
const x=scaleLinear().domain([0,2]).range([140,620]),y=scaleLinear().domain([0,1]).range([440,220]);
const path=line<[number,number]>().x(d=>d[0]).y(d=>d[1]).curve(curveCatmullRom.alpha(.5));
const targets=['Email','Display name','Sign out'];
export function buildScene(){return chapter(CAPTIONS);}const scene=buildScene();
export function Render({s}:{s:SceneState}){
  const p=s.get(scene.phase), uncertain=on(p,3),hybrid=span(p,3,5),local=on(p,5),subgoal=on(p,2),cost=span(p,4,5),pin=on(p,6);
  const scores=[.24,.84,.18].map((v,i)=>lerp(v,[.48,.50,.47][i],uncertain));
  const points=scores.map((v,i)=>[x(i),y(v)] as [number,number]);
  return <><Header title='Learn the familiar, escalate the unfamiliar'/><Camera {...s.get(scene.cam)}>
    <Panel x={65} y={114} w={633} h={104} title='Small local policy · current page and eligible menu' color={C.model}>
      <Label x={84} y={181} size={17}>{subgoal>.5?'Subgoal: focus the display-name field':'Local features + recent history + task when known'}</Label>
    </Panel>
    <path d={path(points)!} fill='none' stroke={C.model} strokeWidth={4}/>
    {points.map(([px,py],i)=><g key={i}><line x1={px} x2={px} y1={py} y2={460} stroke={C.model} opacity={.35}/><circle cx={px} cy={py} r={12} fill={i===1?C.good:C.model}/><Label x={px} y={492} anchor='middle' size={15}>{targets[i]}</Label></g>)}
    <circle cx={x(1)} cy={y(scores[1])} r={31} fill='none' stroke={uncertain>.5?C.pending:C.good} strokeWidth={3} strokeDasharray={uncertain>.5?'6 5':undefined}/>
    <Label x={380} y={533} anchor='middle' size={15} color={C.muted}>Illustrative ranking scores · not confidence</Label>
    <Panel x={770} y={114} w={440} h={186} title='Configured larger model' color={C.pending} opacity={1-.85*local}>
      <Label x={791} y={174} size={17}>Plan · propose labels · help on fallback</Label>
      <Label x={791} y={211} size={15} color={C.muted}>Served identity and interface need inspection</Label>
      <Label x={791} y={267} size={16} color={C.pending}>{hybrid>.5?'Hybrid enabled: ask for help':'A separate, explicit deployment'}</Label>
    </Panel>
    <Arrow x1={770} y1={189} x2={698} y2={189} color={C.pending} opacity={span(p,2,3)}/>
    <Arrow x1={697} y1={330} x2={935} y2={300} color={C.pending} opacity={hybrid}/>
    <Chip x={766} y={328} w={444} text='abstain → configured fallback → observe again' color={C.pending} opacity={hybrid}/>
    <g opacity={cost}>{['input','network','compute','observe'].map((v,i)=><Chip key={v} x={775+i*109} y={387} w={100} text={v} color={C.pending}/>)}<Label x={990} y={449} anchor='middle' size={15}>Every fallback cost belongs in task latency</Label></g>
    <Panel x={770} y={328} w={440} h={139} title='Local-only mode' color={C.good} opacity={local}>
      <Label x={791} y={389} size={18}>Uncertain → stop or ask the person</Label><Label x={791} y={428} size={17} color={C.pending}>No remote inference request</Label>
    </Panel>
    <Chip x={761} y={504} w={449} text='Intended GLM 5.3 Flash · provider not pinned' color={C.pending} opacity={pin}/>
    <Label x={640} y={565} anchor='middle' size={15} color={C.muted}>Checked moves remain bound to a fresh observation</Label>
  </Camera></>;
}
export const vizScene=()=>scene;
