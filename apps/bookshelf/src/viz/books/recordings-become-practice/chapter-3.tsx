// Sources: pinned charter E9/E10, invariants 6/9. A tiny linear softmax ranker
// is trained on a synthetic fixture at module load; numbers are not benchmarks.
// A held-out mistake remains visible. Export parity is a gate, not a claim.
import { scaleLinear, line } from 'd3';
import { Camera } from '../../core';
import type { SceneState } from '../../core';
import { C, chapter, Header, Label, Panel, Chip, Arrow, on, lerp, clamp } from './shared/kit';
const CAPTIONS = [
  "Start with the smallest model that can teach us something. Counts and a simple linear ranker give us baselines before a neural network enters the picture.",
  "For each example, the model sees the page features, recent history, optional task, and candidate menu. It assigns a score to each available choice.",
  "Training compares those scores with the training target and adjusts the model's weights. Repeated examples shape which patterns it learns to recognize.",
  "Observed actions can teach habitual behavior. Reviewed demonstrations and task outcomes are needed to judge whether those habits also help accomplish a stated goal.",
  "A larger model can propose labels or preferences, but its answers are fallible. We audit that signal rather than calling every teacher judgment correct.",
  "This is where learning happens. Constrained decoding changes how a model answers; training changes the behavior represented in the model's weights.",
  "We can run this training in a native process on the Mac, then export a small model for browser inference and verify that its decisions remain consistent.",
  "Training Qwen inside Chrome is not a prerequisite. The first win may be a much smaller policy that learns one useful ranking task well."
] as const;
const features=[[1,0,.2],[1,1,.1],[1,.2,.7]];
const train=(()=>{let w=[0,0,0];const frames:number[][]=[];for(let i=0;i<18;i++){frames.push([...w]);const scores=features.map(f=>f.reduce((v,x,j)=>v+x*w[j],0)),ex=scores.map(Math.exp),sum=ex.reduce((a,b)=>a+b,0),prob=ex.map(v=>v/sum);w=w.map((v,j)=>v-.35*features.reduce((g,f,k)=>g+(prob[k]-(k===1?1:0))*f[j],0));}return frames;})();
const bar=scaleLinear().domain([-1,3]).range([0,370]);
const curve=line<[number,number]>().x(d=>d[0]).y(d=>d[1]);
export function buildScene(){return chapter(CAPTIONS);}const scene=buildScene();
export function Render({s}:{s:SceneState}){
  const p=s.get(scene.phase),update=on(p,2),review=on(p,4),distinction=on(p,5),exportU=on(p,6),u=clamp((p-2)/2),pos=u*(train.length-1),idx=Math.floor(pos),weights=train[idx].map((v,j)=>lerp(v,train[Math.min(idx+1,train.length-1)][j],pos-idx));
  const scores=features.map(f=>f.reduce((v,x,j)=>v+x*weights[j],0));
  return <><Header title='Teach a small model a small job' tag='SYNTHETIC LINEAR-RANKER TRAINING · NOT MEASURED QUALITY'/><Camera {...s.get(scene.cam)}>
    <Panel x={60} y={118} w={555} h={288} title='One causal example · three legal candidates' opacity={1-.85*exportU}>
      {['focus Email','focus Display name','focus Sign out'].map((label,i)=><g key={label}><Label x={80} y={186+i*74} size={15} color={i===1?C.good:C.muted}>{label}{i===1?' · reviewed target':''}</Label><rect x={80} y={198+i*74} width={440} height={14} fill='#1e293b' rx={5}/><rect x={80} y={198+i*74} width={Math.max(1,bar(scores[i]))} height={14} rx={5} fill={i===1?C.good:C.model}/></g>)}
    </Panel>
    <Panel x={657} y={118} w={553} h={288} title='Weights change across training examples' color={C.model} opacity={1-.85*exportU}>
      {weights.map((w,i)=><g key={i}><Label x={678} y={184+i*53} size={15}>feature {i+1}</Label><line x1={815} x2={1150} y1={179+i*53} y2={179+i*53} stroke={C.muted}/><circle cx={lerp(820,1138,(w+1)/4)} cy={179+i*53} r={8} fill={C.model}/></g>)}
      <Label x={678} y={367} size={14} color={C.pending}>Held-out mistake stays outside weight updates</Label>
    </Panel>
    <g opacity={update*(1-exportU)}><path d={curve(train.map((w,i)=>[82+i*23,490-30*w[1]] as [number,number]))!} stroke={C.model} fill='none' strokeWidth={3}/><Label x={82} y={525} size={14} color={C.muted}>schematic training progression · ranking scores</Label></g>
    <g opacity={review*(1-exportU)}><Chip x={676} y={437} w={529} text='Teacher proposal → audit → training target' color={C.pending}/></g>
    <g opacity={distinction*(1-exportU)}><Label x={678} y={513} color={C.good} size={16}>Training changes weights</Label><Label x={678} y={542} color={C.observation} size={16}>Decoding changes the answering procedure</Label></g>
    <Panel x={295} y={218} w={690} h={185} title='Native checkpoint → browser artifact' color={C.good} opacity={exportU}>
      <Chip x={326} y={284} w={215} text='small trained ranker' color={C.model}/><Arrow x1={558} y1={300} x2={690} y2={300} opacity={exportU}/><Chip x={708} y={284} w={243} text='local browser inference' color={C.good}/><Label x={640} y={366} anchor='middle' size={17}>Compare decisions after export before deployment</Label>
    </Panel>
    <Label x={640} y={560} anchor='middle' size={16} color={C.muted}>{exportU>.5?'One useful ranking task is the initial goal':'Counts and a linear baseline establish whether learning is useful'}</Label>
  </Camera></>;
}
export const vizScene=()=>scene;
