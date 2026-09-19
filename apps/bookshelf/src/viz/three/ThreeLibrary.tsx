import {useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import * as THREE from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {Player,Timeline} from '../core';
import {poseForShot} from '../blender/camera-plan';
import {disposeThree} from './primitives';
import type {Composition} from './examples/compositions';
interface Props {factory:()=>Composition;t:number}
function Viewport({factory,t}:Props){
 const canvas=useRef<HTMLCanvasElement>(null),latest=useRef(t);latest.current=t;
 const mounted=useRef<{draw:(t:number)=>void;composition:Composition}>();
 const [error,setError]=useState(''),[labels,setLabels]=useState<{text:string;x:number;y:number}[]>([]),[beat,setBeat]=useState({title:'',body:''}),[readout,setReadout]=useState('');
 const [disclosure,setDisclosure]=useState('');
 useEffect(()=>{
  const composition=factory();setDisclosure(composition.disclosure);let renderer:THREE.WebGLRenderer|undefined;
  try{
   renderer=new THREE.WebGLRenderer({canvas:canvas.current!,antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(1.5);renderer.setSize(1240,450,false);renderer.setClearColor(0x080e19);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
   const world=new THREE.Scene();world.add(composition.root,new THREE.HemisphereLight(0xcceeff,0x273049,2.1));const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(4,10,10);world.add(key);
   const camera=new THREE.PerspectiveCamera(36,1240/450,.01,500);composition.root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(composition.root);
   const materialOpacity=new Map<THREE.Material,number>();
   composition.root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){for(const m of Array.isArray(o.material)?o.material:[o.material])materialOpacity.set(m,m.opacity);}});
   const poses=composition.beats.map(b=>poseForShot(composition.root,bounds,{at:b.at,duration:1.4,label:b.title,azimuth:b.azimuth??18,elevation:b.elevation??20,nodes:b.focus,padding:[.65,.65,.65]},camera.aspect,camera.fov));
   const draw=(time:number)=>{
    composition.sample(time);let i=0;for(let n=1;n<composition.beats.length;n++)if(time>=composition.beats[n].at)i=n;
    const b=composition.beats[i],to=poses[i],from=poses[Math.max(0,i-1)];const u=Math.min(1,Math.max(0,(time-b.at)/1.4)),e=u*u*(3-2*u);
    camera.position.copy(from.position).lerp(to.position,e);camera.lookAt(from.target.clone().lerp(to.target,e));camera.updateMatrixWorld(true);
    composition.root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){let selected=!b.focus;let parent:THREE.Object3D|null=o;while(parent){if(b.focus?.includes(parent.name)||parent.userData.keepHighlighted)selected=true;parent=parent.parent;}for(const m of Array.isArray(o.material)?o.material:[o.material]){m.opacity=(materialOpacity.get(m)??1)*(selected?1:.12);m.transparent=m.opacity<1;m.depthWrite=m.opacity>=.5;}}});
    renderer!.render(world,camera);canvas.current!.dataset.ready='true';canvas.current!.dataset.beat=b.title;canvas.current!.dataset.camera=JSON.stringify(camera.position.toArray());
    setBeat(b);setReadout(composition.readout?.(time)??'');
    setLabels(composition.labels.flatMap(l=>{const p=l.at.clone().project(camera);return Math.abs(p.x)<.94&&Math.abs(p.y)<.91&&p.z<1?[{text:l.text,x:(p.x+1)*620,y:(1-p.y)*225}]:[];}));
   };mounted.current={composition,draw};draw(latest.current);
  }catch(e){setError(String(e));}
  return()=>{mounted.current=undefined;disposeThree(composition.root);renderer?.dispose();renderer?.forceContextLoss();};
 },[factory]);
 useLayoutEffect(()=>{mounted.current?.draw(t);},[t]);
 async function exportModel(){
  try{if(!mounted.current)return;const data=await new GLTFExporter().parseAsync(mounted.current.composition.root,{binary:true,onlyVisible:true});const url=URL.createObjectURL(new Blob([data as ArrayBuffer],{type:'model/gltf-binary'}));const a=document.createElement('a');a.href=url;a.download=`orly-${factory.name}-${t.toFixed(1)}s.glb`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){setError(`Export failed: ${String(e)}`);}
 }
 return <foreignObject width={1280} height={615}><div style={{width:1280,height:615,background:'#080e19',color:'#e2e8f0',fontFamily:'system-ui',position:'relative'}}>
  <div style={{padding:'20px 28px 0',display:'flex',justifyContent:'space-between',alignItems:'start'}}><div><div style={{fontSize:11,letterSpacing:3,color:'#38bdf8',marginBottom:8}}>ORLY / 3D MODEL LIBRARY</div><div style={{fontSize:26,fontWeight:650}}>{beat.title}</div></div><button onClick={exportModel} style={{background:'#142339',border:'1px solid #34506e',borderRadius:8,color:'#dbeafe',padding:'10px 14px',cursor:'pointer'}}>Export frame as GLB</button></div>
  <div style={{position:'absolute',left:20,top:95,width:1240,height:450}}><canvas ref={canvas} aria-label="Composable 3D mathematical visualization" style={{width:1240,height:450}}/>{labels.map(l=><div key={l.text} style={{position:'absolute',left:l.x,top:l.y,transform:'translate(-50%,-50%)',fontSize:12,color:'#c5d4e6',whiteSpace:'nowrap',background:'#080e19c9',padding:'3px 6px',borderRadius:4,pointerEvents:'none'}}>{l.text}</div>)}</div>
  <div style={{position:'absolute',left:28,right:28,bottom:24,fontSize:12,color:'#8097af'}}>{disclosure}</div>
  {readout&&<div style={{position:'absolute',left:28,bottom:49,fontSize:15,color:'#fbbf24'}}>{readout}</div>}
  {error&&<div role="alert" style={{position:'absolute',inset:100,color:'#fb7185'}}>{error}</div>}
 </div></foreignObject>;
}
export function ThreeLibrary({factory}:{factory:()=>Composition}){
 const timeline=useMemo(()=>{const c=factory(),tl=new Timeline();c.beats.forEach((b,i)=>tl.caption({at:b.at,dur:(c.beats[i+1]?.at??c.duration)-b.at,text:b.body}));tl.hold(c.duration,0);disposeThree(c.root);return tl;},[factory]);
 return <div style={{padding:'2vh 2vw'}}><Player timeline={timeline} loop>{s=><Viewport factory={factory} t={s.t}/>}</Player></div>;
}
