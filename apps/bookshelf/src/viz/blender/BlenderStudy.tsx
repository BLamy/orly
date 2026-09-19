import { useState, type ComponentType } from 'react';
import { Player, type SceneState, type ChannelRef, type Timeline } from '../core';
import { ModelViewport } from './ModelViewport';
import { cameraPlan } from './camera-plan';
export interface Study {id:string;title:string;subtitle:string;url:string;window:[number,number];lines:string[];note:string;timeline:Timeline;Original:ComponentType<{s:SceneState}>}
export function BlenderStudy({study}:{study:Study}) {
 const [original,setOriginal]=useState(false);
 const shots=cameraPlan(study.id,study.timeline.describe().captions,study.window[0]);
 return <div style={{padding:'2vh 3vw',color:'#e2e8f0',fontFamily:'system-ui'}}>
  <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:12}}>
   <button onClick={()=>setOriginal(v=>!v)} style={{background:'#17243a',border:'1px solid #415574',borderRadius:8,color:'#fff',padding:'9px 14px',cursor:'pointer'}}>{original?'Show Blender variant':'Compare original'}</button>
   <span style={{fontSize:13,color:'#94a3b8'}}>3D passage: {study.window[0]}–{study.window[1]}s · original narration and playback clock</span>
  </div>
  <Player timeline={study.timeline} loop>{s=>{
   if(original||s.t<study.window[0]||s.t>=study.window[1])return <study.Original s={s}/>;
   const descent=study.id==='loss'&&s.t>=50.5;
   return <>
    <rect width={1280} height={720} fill="#0a0e1a"/>
    <text x={36} y={40} fontSize={13} letterSpacing={3} fill="#38bdf8">BLENDER STUDIES / {study.id.toUpperCase()}</text>
    <text x={36} y={82} fontSize={29} fill="#f1f5f9" fontWeight={650}>{study.title}</text>
    <ModelViewport url={study.url} state={s} shots={shots} loss={study.id==='loss'} x={descent?380:20}/>
    {descent&&<svg x={20} y={140} width={345} height={430} viewBox="36 96 406 506" overflow="hidden"><study.Original s={{...s,get:<T,>(channel:ChannelRef<T>):T=>['contourOp','planeAxU','probeU','saddleU','localU','minsU','runOp','lossTexU','closeU'].includes(channel.key)?0 as T:channel.key==='panelOp'?1 as T:s.get(channel)}}/></svg>}
    {!descent&&<>
    <line x1={920} y1={122} x2={920} y2={555} stroke="#263449"/>
    <text x={950} y={155} fontSize={16} fill="#a78bfa">{study.subtitle}</text>
    {study.lines.map((line,i)=><text key={line} x={950} y={205+i*32} fontSize={17} fill="#cbd5e1">{line}</text>)}
    <foreignObject x={950} y={430} width={292} height={132}><div style={{fontSize:14,lineHeight:1.65,color:'#94a3b8'}}>{study.note}</div></foreignObject>
    </>}
   </>;
  }}</Player>
 </div>;
}
