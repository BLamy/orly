// Sources: pinned charter evaluation invariants 7/10 and E12. A persistent
// unscaled work ribbon grows from one model segment into the complete task.
// Failed tasks and recovery remain present. No numerical timing is invented.
import { scaleBand, line } from 'd3';
import { Camera } from '../../core';
import type { SceneState } from '../../core';
import { C, chapter, Header, Label, Panel, Chip, on, lerp } from '../recordings-become-practice/shared/kit';
const CAPTIONS = [
  "A fast model call is encouraging, but the person experiences the entire trip. Observation, input processing, inference, execution, and recovery all contribute to waiting.",
  "We measure complete tasks as well as individual decisions. A system that clicks quickly and takes three wrong turns can easily lose to a slower, reliable one.",
  "Compare methods on declared workflows, with consistent execution checks. Report task success, wrong actions, fallback frequency, and both typical and slower-end latency.",
  "Use the same candidate inventory for controlled ranking comparisons. Also keep a broader generated-action baseline, so we can see when our restricted menu misses useful moves.",
  "Historical recordings can tell us what actually happened. They cannot show the outcome of an alternative action that nobody took in that recording.",
  "For that, we need live, resettable task environments. The system must act, observe the consequences, and finish the task under controlled conditions.",
  "Freeze quality and speed gates before model selection. Choose the model on development data, calibrate it separately, and reserve an untouched test set for final evaluation.",
  "Any charts in this explanation illustrate the method. The project earns a speed claim only when measured completed tasks meet those predeclared gates."
] as const;
const stages=['observe','input','infer','transport','execute','recover'];
const x=scaleBand<string>().domain(stages).range([92,1190]).paddingInner(.035);
const outcomes=[{name:'clean completion',color:C.good,y:329},{name:'wrong turn + recovery',color:C.bad,y:379},{name:'abstain + fallback',color:C.pending,y:429}];
const route=line<[number,number]>().x(d=>d[0]).y(d=>d[1]);
export function buildScene(){return chapter(CAPTIONS);}const scene=buildScene();
export function Render({s}:{s:SceneState}){
  const p=s.get(scene.phase),expand=on(p,0),task=on(p,1),report=on(p,2),coverage=on(p,3),counter=on(p,4),live=on(p,5),freeze=on(p,6);
  return <><Header title='Measure the whole trip' tag='EVALUATION PLAN · WORK RIBBON IS UNSCALED · NO MEASURED SPEEDUP'/><Camera {...s.get(scene.cam)}>
    {stages.map((v,i)=><g key={v} opacity={v==='infer'?1:expand}><rect x={lerp(492,x(v)!,expand)} y={132} width={lerp(295,x.bandwidth(),expand)} height={63} rx={8} fill={[C.observation,C.model,C.model,C.pending,C.good,C.bad][i]} fillOpacity={.14} stroke={[C.observation,C.model,C.model,C.pending,C.good,C.bad][i]}/><Label x={lerp(640,x(v)!+x.bandwidth()/2,expand)} y={171} anchor='middle' size={17}>{v}</Label></g>)}
    <Label x={640} y={232} anchor='middle' size={16} color={C.muted}>Cold and warm runs are separate groups</Label>
    <g opacity={task*(1-.85*freeze)}>{outcomes.map((o,i)=><g key={o.name}><Label x={81} y={o.y+5} size={15} color={o.color}>{o.name}</Label><path d={route([[345,o.y],[535,o.y],[i===1?535:780,o.y+(i===1?18:0)],[1010,o.y],[1180,o.y]])!} fill='none' stroke={o.color} strokeWidth={3}/>{[0,1,2,3].map(j=><circle key={j} cx={365+j*235} cy={o.y} r={5} fill={o.color}/>)}{i===1&&<Label x={652} y={o.y-12} size={12} color={C.bad}>wrong action is retained</Label>}</g>)}</g>
    <g opacity={report*(1-freeze)}><Label x={640} y={277} anchor='middle' size={16} color={C.pending}>Success · wrong actions · coverage · fallback · p50 / p95</Label></g>
    <g opacity={coverage*(1-counter)}><Chip x={211} y={482} w={404} text='Same-menu comparison isolates ranking' color={C.model}/><Chip x={647} y={482} w={414} text='Broader baseline exposes missing actions' color={C.observation}/></g>
    <g opacity={counter*(1-freeze)}><Chip x={192} y={482} w={895} text={live>.5?'Reset live environment → act → observe → independently verify outcome':'Recording: only the taken route is known; alternate outcomes are unknown'} color={live>.5?C.good:C.pending}/></g>
    <Panel x={251} y={287} w={778} h={173} title='Freeze the release gates before model selection' color={C.good} opacity={freeze}>
      {['development selection','separate calibration','untouched final test'].map((v,i)=><Chip key={v} x={276+i*245} y={354} w={230} text={v} color={[C.observation,C.pending,C.good][i]}/>)}
      <Label x={640} y={426} anchor='middle' size={17}>Evidence must fill the gates; this diagram does not pass them</Label>
    </Panel>
    <Label x={640} y={560} anchor='middle' size={16} color={C.muted}>The claim concerns completed useful tasks, with recovery counted</Label>
  </Camera></>;
}
export const vizScene=()=>scene;
