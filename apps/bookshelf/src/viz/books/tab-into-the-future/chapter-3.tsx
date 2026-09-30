// Sources: pinned charter mission, E7–E13, release evidence. A pilot ribbon
// grows through evidence gates; none is claimed passed. It returns to the
// original page and a waiting suggestion, leaving acceptance to the person.
import { line, curveMonotoneX } from 'd3';
import { Camera } from '../../core';
import type { SceneState } from '../../core';
import { ProfilePage, SuggestHalo, FocusRing, Keycap, controlRect } from '../next-useful-action/shared/profile-page';
import { C, chapter, Header, Label, Panel, Chip, on, lerp, clamp } from '../recordings-become-practice/shared/kit';
const CAPTIONS = [
  "The first useful version should be small enough to understand. Choose a limited site, a few supported workflows, and a simple local ranking baseline.",
  "Run it in shadow mode first. Let it predict without moving anything, and compare its choices with what people actually do in the supported context.",
  "Then show suggestions. Only after the evidence supports it should we add opt-in keyboard acceptance and measure whether it helps people move through their work.",
  "Alongside that, prove the constrained Qwen engine and build the recording, training, and evaluation tools. Each piece should remain independently inspectable.",
  "Autonomous tasks come through the checked runner, with explicit instructions, observed outcomes, and a clearly configured large-model fallback when that mode is enabled.",
  "The final goal is bigger than predicting the next click. It is completing useful browser tasks faster at a level of reliability we chose before seeing the final results.",
  "That path joins three ideas: organize inference around bounded decisions, learn useful patterns from eligible recordings, and keep the live browser in the loop.",
  "At the end, the visible experience can be just a quiet suggestion and a press of Tab. The work underneath is what makes that small moment worth trusting."
] as const;
const nodes=[{x:485,y:224,name:'narrow baseline'},{x:630,y:303,name:'shadow mode'},{x:775,y:224,name:'suggestions'},{x:920,y:303,name:'opt-in focus'},{x:1065,y:224,name:'checked runner'}];
const ribbon=line<[number,number]>().x(d=>d[0]).y(d=>d[1]).curve(curveMonotoneX);
const place={x:65,y:125,scale:.65};
export function buildScene(){return chapter(CAPTIONS);}const scene=buildScene();
export function Render({s}:{s:SceneState}){
  const p=s.get(scene.phase),shadow=on(p,1),suggest=on(p,2),tools=on(p,3),runner=on(p,4),gates=on(p,5),join=on(p,6),final=on(p,7);
  const page={x:place.x,y:place.y,scale:lerp(place.scale,.92,final)};
  return <><Header title='The first useful version' tag='PROPOSED PILOT · EVIDENCE GATES REMAIN UNFILLED'/><Camera {...s.get(scene.cam)}>
    <ProfilePage place={page} obsLabel={shadow>.5?'shadow / assist':'limited site'}/>
    <SuggestHalo rect={controlRect('display-name-field',page)} u={suggest} phase={p} label='a suggestion'/>
    <FocusRing rect={controlRect('profile-menu',page)} u={final}/>
    <g opacity={1-final}>
      <path d={ribbon(nodes.map(n=>[n.x,n.y]))!} fill='none' stroke={C.model} strokeWidth={4} opacity={.7}/>
      {nodes.map((n,i)=><g key={n.name} opacity={i===0?1:clamp(p-i)}><circle cx={n.x} cy={n.y} r={17} fill='#111c33' stroke={i===4?C.good:C.model} strokeWidth={2}/><Label x={n.x} y={n.y+5} anchor='middle' color={C.pending} size={14}>?</Label><Label x={n.x} y={n.y+44} anchor='middle' size={13}>{n.name}</Label></g>)}
      <Label x={795} y={155} anchor='middle' size={16} color={C.pending}>Advance when independent evidence supports it</Label>
      <g opacity={tools*(1-join)}><Chip x={477} y={401} w={218} text='Qwen runtime proof' color={C.model}/><Chip x={714} y={401} w={218} text='Record / train / evaluate' color={C.observation}/><Chip x={951} y={401} w={218} text='Explicit hybrid fallback' color={C.pending} opacity={runner}/></g>
      <Panel x={478} y={460} w={692} h={86} title='Release gate · faster useful tasks at frozen reliability' color={C.pending} opacity={gates*(1-join)}>
        <Label x={499} y={517} size={15}>Measured success and complete latency must fill this gate</Label>
      </Panel>
      <g opacity={join}>{['Bounded decisions','Eligible recording data','Live browser loop'].map((v,i)=><Chip key={v} x={480+i*230} y={430} w={218} text={v} color={[C.model,C.observation,C.good][i]}/>)}<Label x={825} y={508} anchor='middle' size={16} color={C.muted}>Inspectable foundations support the visible interaction</Label></g>
    </g>
    <Panel x={733} y={162} w={468} h={258} title='A quiet suggestion' color={C.model} opacity={final}>
      <Label x={756} y={226} size={18}>The name field is offered.</Label><Label x={756} y={271} size={18}>The person chooses whether to go.</Label><Keycap x={756} y={307} label='Tab' u={1}/><Label x={832} y={326} size={17} color={C.good}>Accept focus · no activation</Label><Label x={756} y={381} size={16} color={C.muted}>Ordinary navigation remains available</Label>
    </Panel>
  </Camera></>;
}
export const vizScene=()=>scene;
