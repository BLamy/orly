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
  tl.tween(vessels,.45,{at:7.8,dur:1.2,ease:ease.move}); tl.tween(cam,{x:385,y:350,k:1.2},{at:9,dur:1.2,ease:ease.move});
  tl.caption({at:14,dur:6.4,text:'A skill folds that evidence into ordered steps, preconditions, recovery, and explicit verification.'});
  tl.tween(vessels,1,{at:14.6,dur:1.2,ease:ease.move}); tl.tween(cam,{x:895,y:350,k:1.2},{at:15.6,dur:1.2,ease:ease.move});
  tl.caption({at:20.8,dur:6.5,text:'In matched comparisons, Workflow Memory succeeds on fifty-five point nine percent of tasks.'});
  tl.tween(bars,.559,{at:21.4,dur:1.4,ease:ease.move}); tl.tween(cam,CAMERA_HOME,{at:23,dur:1.2,ease:ease.move});
  tl.caption({at:27.8,dur:6.5,text:'The skill representation reaches sixty-one point nine percent, a six point zero six point gain.'});
  tl.tween(bars,1,{at:28.4,dur:1.4,ease:ease.move}); tl.tween(delta,1,{at:30,dur:.6,ease:ease.pop});
  tl.caption({at:34.8,dur:6.6,text:'The paired trajectories explain why: sixty-five point seven percent of skill cases use a procedural anchor.'});
  tl.tween(mix,.657,{at:35.4,dur:1.5,ease:ease.move}); tl.tween(cam,{x:850,y:400,k:1.18},{at:36,dur:1.2,ease:ease.move});
  tl.caption({at:41.8,dur:6.4,text:'Only four point five percent look like explicit knowledge injection. The card mostly steadies action.'});
  tl.tween(mix,1,{at:42.4,dur:1.2,ease:ease.move});
  tl.caption({at:48.8,dur:6.5,text:'The useful thing is not a secret fact. It is a procedure that keeps execution from wandering.'});
  tl.tween(cam,CAMERA_HOME,{at:49.2,dur:1.2,ease:ease.move}); tl.tween(close,1,{at:50,dur:1.2,ease:ease.move}); tl.hold(56,1);
  return{tl,cam,evidence,vessels,bars,delta,mix,close};
}
const scene=buildScene();
export function Render({s}:{s:SceneState}){const b=s.get(scene.bars),v=s.get(scene.vessels),m=s.get(scene.mix),c=s.get(scene.close); return <Camera {...s.get(scene.cam)}>
  <text x="640" y="72" textAnchor="middle" fill={colors.TEXT} fontSize="34" fontWeight="700">What the representation changes</text>
  <path d={`M 180 150 H ${180+920*s.get(scene.evidence)}`} stroke={colors.MUTED} strokeWidth="8" strokeLinecap="round" opacity={1-c}/><text x="640" y="132" textAnchor="middle" fill={colors.MUTED} fontSize="18" opacity={s.get(scene.evidence)*(1-c)}>same source experience · same target tasks</text>
  <g opacity={Math.min(1,v*2.2)*(1-c)}><rect x="150" y="210" width="420" height="150" rx="22" fill="#111827" stroke={colors.SECONDARY} strokeWidth="3"/><text x="360" y="248" textAnchor="middle" fill={colors.SECONDARY} fontSize="24">Workflow Memory</text>{[0,1,2,3].map(i=><line key={i} x1="205" x2={520-i*24} y1={275+i*20} y2={275+i*20} stroke={colors.MUTED} strokeWidth="7"/>)}</g>
  <g opacity={Math.max(0,(v-.45)/.55)*(1-c)}><rect x="710" y="210" width="420" height="150" rx="22" fill="#111827" stroke={colors.ACCENT} strokeWidth="3"/><text x="920" y="248" textAnchor="middle" fill={colors.ACCENT} fontSize="24">Skill</text>{['steps','preconditions','verify'].map((x,i)=><g key={x}><circle cx="775" cy={282+i*26} r="7" fill={colors.POSITIVE}/><text x="795" y={288+i*26} fill={colors.TEXT} fontSize="18">{x}</text></g>)}</g>
  <g opacity={(b>0?1:0)*(1-c)}><line x1="210" x2="1070" y1="580" y2="580" stroke={colors.MUTED}/><rect x="350" y={580-250*Math.min(b/.559,1)} width="160" height={250*Math.min(b/.559,1)} fill={colors.SECONDARY}/><rect x="770" y={580-250*Math.max(0,(b-.559)/.441)} width="160" height={250*Math.max(0,(b-.559)/.441)} fill={colors.ACCENT}/><text x="430" y="610" textAnchor="middle" fill={colors.TEXT}>55.9%</text><text x="850" y="610" textAnchor="middle" fill={colors.TEXT}>61.9%</text><text x="640" y="430" textAnchor="middle" fill={colors.WARM} fontSize="30" opacity={s.get(scene.delta)}>+6.06 points</text></g>
  <g opacity={(m>0?1:0)*(1-c)}><rect x="690" y="470" width={360*Math.min(1,m/.657)} height="34" fill={colors.POSITIVE}/><rect x="690" y="516" width={360*Math.max(0,(m-.657)/.343)*.068} height="34" fill={colors.WARM}/><text x="675" y="494" textAnchor="end" fill={colors.TEXT}>procedural anchor 65.7%</text><text x="675" y="540" textAnchor="end" fill={colors.TEXT}>knowledge 4.5%</text></g>
  <g opacity={c}><rect x="285" y="185" width="710" height="300" rx="30" fill="#0a0e1a" stroke={colors.POSITIVE} strokeWidth="3"/><text x="640" y="300" textAnchor="middle" fill={colors.TEXT} fontSize="40" fontWeight="700">Skills mostly stabilize action</text><text x="640" y="370" textAnchor="middle" fill={colors.MUTED} fontSize="26">they rarely inject the missing fact</text></g>
  </Camera>}
export const vizScene=()=>scene;
