// Sources: pinned charter E9-T05, runtime proof and mission. No actual GLM
// architecture is asserted. This lattice is schematic computation, and every
// low-level capability remains a question until the real deployment is tested.
import { scaleLinear, interpolateNumber } from 'd3';
import { Camera } from '../../core';
import type { SceneState } from '../../core';
import { C, chapter, Header, Label, Panel, Chip, on, lerp } from '../recordings-become-practice/shared/kit';
const CAPTIONS = [
  "Could we apply the constrained decision idea to a larger model? Possibly, but the model's size is only one part of that question.",
  "A hosted interface may accept a schema or a list of answers. That can provide a useful constrained baseline without exposing the internals needed by our engine.",
  "True shared-prefill branching needs access to reusable model state, decision scores, positions, masks, and the ability to batch the relevant computations correctly.",
  "Those controls depend on the actual runtime and deployment. Several simultaneous hosted requests are not proof that one shared context was reused internally.",
  "Even with the necessary access, a large model still performs large-model computation. A shorter answer does not make all of that work disappear.",
  "So we have two experiments: improve how we ask a powerful model to decide, and teach a smaller model to handle a narrower set of decisions.",
  "The smaller model may capture useful behavior from examples without inheriting the teacher's full intelligence. We must test where that transfer works and where it fails.",
  "If the large-model runtime cannot support faithful branching, that is a useful result. The hosted baseline and the small-policy path can still move forward."
] as const;
const grid=Array.from({length:72},(_,i)=>({x:390+(i%12)*44,y:223+Math.floor(i/12)*29}));
const outputX=scaleLinear().domain([0,5]).range([402,795]);
const gates=['reusable state','decision scores','positions','masks','batched branches'];
export function buildScene(){return chapter(CAPTIONS);}const scene=buildScene();
export function Render({s}:{s:SceneState}){
  const p=s.get(scene.phase),short=on(p,1),access=on(p,2),inspect=on(p,3),fork=on(p,5),end=on(p,7);
  return <><Header title='Can constrained decoding scale up?' tag='CONDITIONAL FEASIBILITY · SCHEMATIC COMPUTE · NO PERFORMANCE RESULT'/><Camera {...s.get(scene.cam)}>
    <Panel x={60} y={119} w={300} h={135} title='Hosted output contract' color={C.observation} opacity={1-fork}>
      <Label x={80} y={181} size={16}>schema or answer list</Label><Label x={80} y={220} size={14} color={C.muted}>Useful constrained baseline</Label>
    </Panel>
    <Panel x={911} y={119} w={299} h={272} title='Low-level runtime controls' color={C.pending} opacity={access*(1-fork)}>
      {gates.map((g,i)=><g key={g}><circle cx={934} cy={181+i*41} r={10} fill='#171a2e' stroke={C.pending}/><Label x={934} y={186+i*41} anchor='middle' size={14} color={C.pending}>?</Label><Label x={954} y={186+i*41} size={15}>{g}</Label></g>)}
    </Panel>
    <g opacity={1-.85*fork}>
      {grid.map((v,i)=><g key={i}>{i%12<11&&<line x1={v.x} y1={v.y} x2={v.x+44} y2={v.y} stroke={C.model} opacity={.2}/>}<rect x={v.x-6} y={v.y-6} width={12} height={12} rx={3} fill={C.model} opacity={.55+((i%5)/5)*.35}/></g>)}
      <Label x={590} y={194} anchor='middle' color={C.model} size={17}>Large-model computation remains</Label>
    </g>
    <g opacity={1-fork}>{Array.from({length:6},(_,i)=><g key={i} opacity={i<2?1:1-short}><rect x={interpolateNumber(outputX(i),566+i*72)(short)} y={425} width={62} height={31} rx={6} fill='#111c33' stroke={C.observation}/><Label x={interpolateNumber(outputX(i),566+i*72)(short)+31} y={446} anchor='middle' size={12}>{i<2?'choice':'output'}</Label></g>)}<Label x={630} y={490} anchor='middle' size={15} color={C.muted}>Shorter output does not remove neural computation</Label></g>
    <g opacity={inspect*(1-fork)}><Chip x={374} y={126} w={505} text='Concurrent hosted requests ≠ proven shared prefill' color={C.pending}/></g>
    <g opacity={fork}>
      {grid.map((v,i)=>{
        const left=i<36,tx=(left?170:744)+(i%6)*48,ty=285+Math.floor((i%36)/6)*(left?29:18);
        return <rect key={i} x={lerp(v.x,tx,fork)-5} y={lerp(v.y,ty,fork)-5} width={left?10:8} height={left?10:8} rx={2} fill={left?C.model:C.good}/>;
      })}
      <Label x={302} y={238} anchor='middle' color={C.model} size={19}>Experiment A</Label><Label x={302} y={478} anchor='middle' size={17}>Better constrained large-model decisions</Label>
      <Label x={862} y={238} anchor='middle' color={C.good} size={19}>Experiment B</Label><Label x={862} y={478} anchor='middle' size={17}>Teach a narrower small policy</Label>
      <Label x={862} y={431} anchor='middle' size={14} color={C.pending}>Student ≠ teacher's full capabilities</Label>
    </g>
    <Label x={640} y={561} anchor='middle' size={16} color={C.pending}>{end>.5?'An evidenced branching no-go still leaves baseline and student paths':'Capability gates require inspection of the actual runtime'}</Label>
  </Camera></>;
}
export const vizScene=()=>scene;
