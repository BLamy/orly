// Sources: pinned charter browser-action invariants 5/6/8/9, E10/E11.
// A persistent event stream separates human evidence from extension-originated
// focus before anything enters the controlled, versioned feedback buffer.
import { scalePoint } from 'd3';
import { Camera } from '../../core';
import type { SceneState } from '../../core';
import { C, chapter, Header, Label, Panel, Chip, Arrow, on, lerp } from '../recordings-become-practice/shared/kit';
const CAPTIONS = [
  "A personal model should improve as it sees useful examples. But a predictive interface can accidentally manufacture evidence that its own guesses were right.",
  "Suppose it suggests the name field and moves focus there. If that focus event becomes a positive training label, the system is learning from its own echo.",
  "We must distinguish a suggestion, an accepted focus move, and what the person meaningfully does afterward. Those are different kinds of evidence.",
  "Typing into the field or intentionally activating a control can provide a stronger signal. A dismissal or immediate move elsewhere tells a different story.",
  "Even acceptance deserves careful interpretation. People sometimes follow a suggestion because it is convenient, not because it matches what they originally intended.",
  "Start by collecting this feedback in a controlled way, then train and evaluate a new checkpoint. Continuous background weight updates are not required for the first product.",
  "Keep recording, training, and using a model as separate controls. The person should be able to inspect the mode, stop collection, and roll back a bad model.",
  "Personalization becomes useful when it follows the person's behavior faithfully, instead of making the person's behavior follow a mistake the model keeps reinforcing."
] as const;
const events=[{label:'suggestion shown',source:'extension',color:C.model},{label:'focus moved',source:'extension',color:C.model},{label:'person types',source:'human',color:C.good},{label:'dismiss / move away',source:'human',color:C.pending}];
const x=scalePoint<number>().domain([0,1,2,3]).range([187,801]);
export function buildScene(){return chapter(CAPTIONS);}const scene=buildScene();
export function Render({s}:{s:SceneState}){
  const p=s.get(scene.phase),separate=on(p,2),qualify=on(p,3),caution=on(p,4),checkpoint=on(p,5),controls=on(p,6);
  return <><Header title='Learn from the person, not the echo'/><Camera {...s.get(scene.cam)}>
    <Label x={83} y={164} color={C.model} size={18}>Extension events</Label><Label x={83} y={342} color={C.good} size={18}>Human behavior</Label>
    <line x1={80} x2={866} y1={220} y2={220} stroke={C.model} strokeWidth={2}/><line x1={80} x2={866} y1={400} y2={400} stroke={C.good} strokeWidth={2} opacity={separate}/>
    {events.map((e,i)=>{
      const cy=lerp(220,e.source==='human'?400:220,separate),u=i<2?on(p,i*.5):on(p,2);
      return <g key={e.label} opacity={u}><circle cx={x(i)} cy={cy} r={13} fill={e.color}/><Label x={x(i)!} y={cy+43} anchor='middle' size={14}>{e.label}</Label><Label x={x(i)!} y={cy+68} anchor='middle' size={12} color={C.muted}>{e.source==='extension'?'exposure / system origin':'needs interpretation'}</Label></g>;
    })}
    <g opacity={on(p,1)*(1-checkpoint)}><path d='M392,206 Q640,92 1070,185' fill='none' stroke={C.bad} strokeWidth={2} strokeDasharray='6 5'/><Chip x={533} y={131} w={307} text='× focus is not a positive label' color={C.bad}/></g>
    <Panel x={920} y={131} w={291} h={213} title='Feedback review buffer' color={C.pending}>
      <Label x={940} y={192} size={16}>{qualify>.5?'Meaningful interaction':'No automatic positives'}</Label><Label x={940} y={231} size={15}>goal / source / outcome</Label><Label x={940} y={273} color={C.pending} size={14}>{caution>.5?'Acceptance can be ambiguous':'Keep event origins distinct'}</Label>
      <Label x={940} y={315} size={14} color={C.muted}>Versioned · controlled collection</Label>
    </Panel>
    <Arrow x1={866} y1={400} x2={919} y2={296} color={C.good} opacity={qualify*(1-checkpoint)}/>
    <Panel x={921} y={375} w={290} h={146} title='Candidate checkpoint' color={C.good} opacity={checkpoint}>
      <Label x={942} y={433} size={15}>Train → evaluate → compare</Label><Label x={942} y={477} size={16} color={C.pending}>Rollback stays available</Label>
    </Panel>
    <g opacity={controls}><Chip x={100} y={504} w={205} text='Recording control' color={C.observation}/><Chip x={359} y={504} w={205} text='Training control' color={C.model}/><Chip x={618} y={504} w={205} text='Model-use control' color={C.good}/></g>
    <Label x={640} y={563} anchor='middle' size={15} color={C.muted}>Personalization follows human evidence, with review and provenance</Label>
  </Camera></>;
}
export const vizScene=()=>scene;
