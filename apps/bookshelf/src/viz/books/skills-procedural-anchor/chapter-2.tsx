// Grounding: README.md; src/procmem2skills/runtime/workflow_memory.py;
// src/procmem2skills/packager/llm_skill_creator.py; report_v1_tables.json.
import { CAMERA_HOME, Camera, Timeline, cameraInterp, colors, ease } from '../../core';
import type { CameraState, SceneState } from '../../core';

export function buildScene(){
  const tl=new Timeline(); const cam=tl.channel<CameraState>('cam',CAMERA_HOME,cameraInterp);
  const evidence=tl.channel('shared evidence',0), vessels=tl.channel('representations',0), bars=tl.channel('matched success',0), delta=tl.channel('six point delta',0), mix=tl.channel('mechanism mix',0), close=tl.channel('closing focus',0);
  tl.caption({at:.4,dur:6.3,text:'Give two agents the same source experience and target tasks, then change only the memory representation.'});
  tl.tween(evidence,1,{at:.8,dur:1.4,ease:ease.draw});
  tl.caption({at:7.2,dur:6.4,text:'Workflow Memory renders prior attempts as one long block of context for the next run.'});
  tl.tween(vessels,.45,{at:7.8,dur:1.2,ease:ease.move});
  tl.caption({at:14,dur:6.4,text:'A skill folds that evidence into ordered steps, preconditions, recovery, and explicit verification.'});
  tl.tween(vessels,1,{at:14.6,dur:1.2,ease:ease.move});
  tl.caption({at:20.8,dur:6.5,text:'In matched comparisons, Workflow Memory succeeds on fifty-five point nine percent of tasks.'});
  tl.tween(bars,.559,{at:21.4,dur:1.4,ease:ease.move});
  tl.caption({at:27.8,dur:6.5,text:'The skill representation reaches sixty-one point nine percent, a six point zero six point gain.'});
  tl.tween(bars,1,{at:28.4,dur:1.4,ease:ease.move}); tl.tween(delta,1,{at:30,dur:.6,ease:ease.pop});
  tl.caption({at:34.8,dur:6.6,text:'The paired trajectories explain why: sixty-five point seven percent of skill cases use a procedural anchor.'});
  tl.tween(mix,.657,{at:35.4,dur:1.5,ease:ease.move});
  tl.caption({at:41.8,dur:6.4,text:'Only four point five percent look like explicit knowledge injection. The card mostly steadies action.'});
  tl.tween(mix,1,{at:42.4,dur:1.2,ease:ease.move});
  tl.caption({at:48.8,dur:6.5,text:'The useful thing is not a secret fact. It is a procedure that keeps execution from wandering.'});
  tl.tween(close,1,{at:50,dur:1.2,ease:ease.move}); tl.hold(56,1);
  return{tl,cam,evidence,vessels,bars,delta,mix,close};
}
const scene=buildScene();
// Layout: title y72 · evidence y114–130 · cards y160–320 · bar chart baseline y560 (tops ≥ y374) · caption band from y630.
// The camera stays at home so no title or card is cropped by a push.
export function Render({s}:{s:SceneState}){const b=s.get(scene.bars),v=s.get(scene.vessels),m=s.get(scene.mix),c=s.get(scene.close); return <Camera {...s.get(scene.cam)}>
  <text x="640" y="72" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="700">What the representation changes</text>
  <path d={`M 180 130 H ${180+920*s.get(scene.evidence)}`} stroke={colors.MUTED} strokeWidth="8" strokeLinecap="round" opacity={1-c}/><text x="640" y="114" textAnchor="middle" fill={colors.MUTED} fontSize="18" opacity={s.get(scene.evidence)*(1-c)}>same source experience · same target tasks</text>
  <g opacity={Math.min(1,v*2.2)*(1-c)}><rect x="150" y="160" width="420" height="160" rx="22" fill="#111827" stroke={colors.SECONDARY} strokeWidth="3"/><text x="360" y="196" textAnchor="middle" fill={colors.SECONDARY} fontSize="24">Workflow Memory</text>{[530,520,530,380].map((x2,i)=><line key={i} x1="190" x2={x2} y1={222+i*22} y2={222+i*22} stroke={colors.MUTED} strokeWidth="7"/>)}</g>
  <g opacity={Math.max(0,(v-.45)/.55)*(1-c)}><rect x="710" y="160" width="420" height="160" rx="22" fill="#111827" stroke={colors.ACCENT} strokeWidth="3"/><text x="920" y="196" textAnchor="middle" fill={colors.ACCENT} fontSize="24">Skill</text>{['steps','preconditions','recovery','verify'].map((x,i)=><g key={x}><circle cx="775" cy={224+i*24} r="7" fill={colors.POSITIVE}/><text x="795" y={230+i*24} fill={colors.TEXT} fontSize="18">{x}</text></g>)}</g>
  <g opacity={(b>0?1:0)*(1-c)}><line x1="240" x2="1040" y1="560" y2="560" stroke={colors.MUTED}/><rect x="280" y={560-168*Math.min(b/.559,1)} width="160" height={168*Math.min(b/.559,1)} fill={colors.SECONDARY}/><rect x="840" y={560-186*Math.max(0,(b-.559)/.441)} width="160" height={186*Math.max(0,(b-.559)/.441)} fill={colors.ACCENT}/><text x="360" y="588" textAnchor="middle" fill={colors.TEXT}>55.9%</text><text x="920" y="588" textAnchor="middle" fill={colors.TEXT}>61.9%</text><text x="920" y="350" textAnchor="middle" fill={colors.WARM} fontSize="28" opacity={s.get(scene.delta)}>+6.06 points</text></g>
  <g opacity={(m>0?1:0)*(1-c)}><text x="640" y="342" textAnchor="middle" fill={colors.MUTED} fontSize="18">skill cases: mechanism mix</text><text x="480" y="384" fill={colors.TEXT} fontSize="20">procedural anchor 65.7%</text><rect x="480" y="394" width={330*Math.min(1,m/.657)} height="30" rx="6" fill={colors.POSITIVE}/><text x="480" y="454" fill={colors.TEXT} fontSize="20">knowledge 4.5%</text><rect x="480" y="464" width={330*Math.max(0,(m-.657)/.343)*.068} height="30" rx="6" fill={colors.WARM}/></g>
  <g opacity={c}><rect x="285" y="185" width="710" height="300" rx="30" fill="#0a0e1a" stroke={colors.POSITIVE} strokeWidth="3"/><text x="640" y="300" textAnchor="middle" fill={colors.TEXT} fontSize="40" fontWeight="700">Skills mostly stabilize action</text><text x="640" y="370" textAnchor="middle" fill={colors.MUTED} fontSize="26">they rarely inject the missing fact</text></g>
  </Camera>}
export const vizScene=()=>scene;
