// Sources: pinned charter mission, E7–E13, release evidence. A pilot ribbon
// grows through evidence gates; none is claimed passed. It returns to the
// original page and a waiting suggestion, leaving acceptance to the person.
import { line, curveMonotoneX } from 'd3';
import { Camera } from '../../core';
import type { SceneState } from '../../core';
import { ProfilePage, FocusRing, Keycap, controlRect } from '../next-useful-action/shared/profile-page';
import { C, chapter, Header, Label, Panel, on, clamp } from '../recordings-become-practice/shared/kit';
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
const nodes=[{x:625,y:224,name:'narrow baseline'},{x:765,y:303,name:'shadow mode'},{x:905,y:224,name:'suggestions'},{x:1045,y:303,name:'opt-in focus'},{x:1180,y:224,name:'checked runner'}];
const ribbon=line<[number,number]>().x(d=>d[0]).y(d=>d[1]).curve(curveMonotoneX);
const place={x:40,y:110,scale:.92};
// Bottom pill row: three 210-wide pills, 18 apart, from x 560 to x 1226 (clear of the stage edge).
const PILL_W=210,PILL_GAP=18,PILL_ROW_Y=401;
const col=(i:number)=>560+i*(PILL_W+PILL_GAP);
// Suggestion halo in the shared SuggestHalo style (dashed violet), but its top edge sits
// 3px above the field so it clears the "Display name" label that the stock halo cut through.
function NameHalo({rect,u,phase}:{rect:{x:number;y:number;w:number;h:number};u:number;phase:number}){
  if(u<=.002)return null;
  const x0=rect.x-12,x1=rect.x+rect.w+12,y0=rect.y-3,y1=rect.y+rect.h+12;
  const breathe=.5+.5*Math.sin(phase*Math.PI*2);
  return <g opacity={u}><rect x={x0} y={y0} width={x1-x0} height={y1-y0} rx={16} fill={C.model} opacity={.05+.06*breathe}/><rect x={x0} y={y0} width={x1-x0} height={y1-y0} rx={16} fill='none' stroke={C.model} strokeWidth={2.4} strokeDasharray='9 7' strokeDashoffset={-phase*32}/></g>;
}
// Pill with 14px text (the kit Chip is 13px, below the label minimum).
function Pill({x,y,w,text,color,opacity=1}:{x:number;y:number;w:number;text:string;color:string;opacity?:number}){
  return <g opacity={opacity}><rect x={x} y={y} width={w} height={32} rx={8} fill='#0a1120' stroke={color}/><Label x={x+w/2} y={y+21} anchor='middle' size={14} color={color}>{text}</Label></g>;
}
export function buildScene(){return chapter(CAPTIONS);}const scene=buildScene();
export function Render({s}:{s:SceneState}){
  const p=s.get(scene.phase),shadow=on(p,1),suggest=on(p,2),tools=on(p,3),runner=on(p,4),gates=on(p,5),join=on(p,6),final=on(p,7);
  const page={x:place.x,y:place.y,scale:place.scale};
  return <><Header title='The first useful version' tag='PROPOSED PILOT · EVIDENCE GATES REMAIN UNFILLED'/><Camera {...s.get(scene.cam)}>
    <ProfilePage place={page} obsLabel={shadow>.5?'shadow / assist':'limited site'}/>
    <NameHalo rect={controlRect('display-name-field',page)} u={suggest} phase={p}/>
    <Pill x={controlRect('display-name-field',page).x+controlRect('display-name-field',page).w+26} y={controlRect('display-name-field',page).y+controlRect('display-name-field',page).h/2-16} w={112} text='a suggestion' color={C.model} opacity={suggest}/>
    <FocusRing rect={controlRect('profile-menu',page)} u={final}/>
    <g opacity={1-final}>
      <path d={ribbon(nodes.map(n=>[n.x,n.y]))!} fill='none' stroke={C.model} strokeWidth={4} opacity={.7}/>
      {nodes.map((n,i)=><g key={n.name} opacity={i===0?1:clamp(p-i)}><circle cx={n.x} cy={n.y} r={17} fill='#111c33' stroke={i===4?C.good:C.model} strokeWidth={2}/><Label x={n.x} y={n.y+5} anchor='middle' color={C.pending} size={14}>?</Label><Label x={n.x} y={n.y<260?n.y-30:n.y+44} anchor='middle' size={14}>{n.name}</Label>{i===4&&<Label x={n.x} y={n.y+64} anchor='middle' size={13} color={C.muted}>observed outcomes</Label>}</g>)}
      <Label x={890} y={155} anchor='middle' size={16} color={C.pending}>Advance when independent evidence supports it</Label>
      <g opacity={(1-shadow)*on(p,0)}>{['Limited site','Few supported workflows','Local ranking baseline'].map((t,i)=><Pill key={t} x={col(i)} y={PILL_ROW_Y} w={PILL_W} text={t} color={C.observation}/>)}</g>
      <Pill x={col(0)} y={PILL_ROW_Y} w={PILL_W} text='Predicts · moves nothing' color={C.observation} opacity={shadow*(1-suggest)}/>
      <g opacity={tools*(1-join)}><Pill x={col(0)} y={PILL_ROW_Y} w={PILL_W} text='Qwen model engine proof' color={C.model}/><Pill x={col(1)} y={PILL_ROW_Y} w={PILL_W} text='Record / train / evaluate' color={C.observation}/><Pill x={col(2)} y={PILL_ROW_Y} w={PILL_W} text='Explicit hybrid fallback' color={C.pending} opacity={runner}/></g>
      <Panel x={560} y={460} w={666} h={86} title='Release gate · faster useful tasks at frozen reliability' color={C.pending} opacity={gates*(1-join)}>
        <Label x={581} y={517} size={15}>Measured success and complete latency must fill this gate</Label>
      </Panel>
      <g opacity={join}>{['Bounded decisions','Eligible recording data','Live browser loop'].map((v,i)=><Pill key={v} x={col(i)} y={PILL_ROW_Y} w={PILL_W} text={v} color={[C.model,C.observation,C.good][i]}/>)}<Label x={893} y={462} anchor='middle' size={16} color={C.muted}>Inspectable foundations support the visible interaction</Label></g>
    </g>
    <Panel x={733} y={162} w={468} h={258} title='A quiet suggestion' color={C.model} opacity={final}>
      <Label x={756} y={226} size={18}>The name field is offered.</Label><Label x={756} y={271} size={18}>The person chooses whether to go.</Label><Keycap x={756} y={307} label='Tab' u={1}/><Label x={832} y={326} size={17} color={C.good}>Accept focus · no activation</Label><Label x={756} y={381} size={16} color={C.muted}>Ordinary navigation remains available</Label>
    </Panel>
  </Camera></>;
}
export const vizScene=()=>scene;
