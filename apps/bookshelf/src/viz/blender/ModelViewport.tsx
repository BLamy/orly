import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { SceneState } from '../core';
import { createLossMotion } from './loss-motion';
import { sampleCamera, type Shot } from './camera-plan';

/** Blender GLB adapter. No animation loop: the existing Player owns every frame. */
interface Motion { key: string; kind: string; axis?: 'x'|'y'|'z'; start?: number; end?: number; amount?: number; index?: number; count?: number; distance?: number }
interface Rig { node: THREE.Object3D; position: THREE.Vector3; quaternion: THREE.Quaternion; motion: Motion }
interface Mounted { renderer: THREE.WebGLRenderer; world: THREE.Scene; camera: THREE.PerspectiveCamera; rigs: Rig[]; bounds: THREE.Box3; object: THREE.Object3D; lossMotion?: ReturnType<typeof createLossMotion> }
const clamp = (v: number) => Math.max(0, Math.min(1, v));
function draw(m: Mounted, state: SceneState, shots: Shot[]) {
  for (const r of m.rigs) {
    const raw=Number(state.get({key:r.motion.key}));
    if(!Number.isFinite(raw)) throw new Error(`Missing Blender timeline channel: ${r.motion.key}`);
    const u=clamp(raw*(r.motion.count??1)-(r.motion.index??0));
    r.node.position.copy(r.position);r.node.quaternion.copy(r.quaternion);r.node.visible=true;
    if(r.motion.kind==='hinge') {
      const axis=new THREE.Vector3(r.motion.axis==='x'?1:0,r.motion.axis==='y'?1:0,r.motion.axis==='z'?1:0);
      r.node.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(axis,(r.motion.start??0)+(r.motion.end!-(r.motion.start??0))*u));
    } else if(r.motion.kind==='translate') r.node.position[r.motion.axis??'y']+=(r.motion.amount??0)*u;
    else {r.node.visible=u>0.001;r.node.position.y+=(1-u)*(r.motion.distance??0);}
  }
  if(m.lossMotion)m.renderer.domElement.dataset.descent=JSON.stringify(m.lossMotion(state));
  m.object.updateMatrixWorld(true);
  const pose=sampleCamera(m.object,m.bounds,shots,state.t,m.camera.aspect,m.camera.fov);
  m.camera.position.copy(pose.position);m.camera.lookAt(pose.target);
  m.camera.updateMatrixWorld(true);
  m.renderer.domElement.dataset.cameraShot=pose.shot.label;
  m.renderer.domElement.dataset.cameraPose=JSON.stringify({position:pose.position.toArray(),target:pose.target.toArray()});
  m.renderer.render(m.world,m.camera);
}
function disposeObject(object:THREE.Object3D) {
 const geometries=new Set<THREE.BufferGeometry>();const materials=new Set<THREE.Material>();
 object.traverse(o=>{if(o instanceof THREE.Mesh || o instanceof THREE.Line){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);}});
 geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
export function ModelViewport({url,state,shots,loss=false,x=20}:{url:string;state:SceneState;shots:Shot[];loss?:boolean;x?:number}) {
 const canvas=useRef<HTMLCanvasElement>(null);const mounted=useRef<Mounted>();const latest=useRef({state,shots});latest.current={state,shots};
 const [status,setStatus]=useState('Loading Blender model…');
 useEffect(()=>{
  let cancelled=false;let renderer:THREE.WebGLRenderer|undefined;let object:THREE.Object3D|undefined;
  setStatus('Loading Blender model…');
  try {
   renderer=new THREE.WebGLRenderer({canvas:canvas.current!,antialias:true,alpha:true,preserveDrawingBuffer:true});
   renderer.setPixelRatio(1.5);renderer.setSize(880,480,false);renderer.setClearColor(0x0a0e1a,1);renderer.outputColorSpace=THREE.SRGBColorSpace;
   renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
   const world=new THREE.Scene();world.add(new THREE.HemisphereLight(0xddefff,0x55506a,2.2));
   const key=new THREE.DirectionalLight(0xffffff,3);key.position.set(4,8,6);world.add(key);
   const rim=new THREE.DirectionalLight(0x93c5fd,1.5);rim.position.set(-4,3,-5);world.add(rim);
   const camera=new THREE.PerspectiveCamera(35,880/480,.01,1000);
   new GLTFLoader().load(url,gltf=>{
    if(cancelled){disposeObject(gltf.scene);return;}
    object=gltf.scene;world.add(object);const rigs:Rig[]=[];
    object.traverse(o=>{if(o.userData.motion)rigs.push({node:o,position:o.position.clone(),quaternion:o.quaternion.clone(),motion:JSON.parse(o.userData.motion)});});
    const bounds=new THREE.Box3().setFromObject(object);
    mounted.current={renderer:renderer!,world,camera,rigs,bounds,object,lossMotion:loss?createLossMotion(object):undefined};
    try{draw(mounted.current,latest.current.state,latest.current.shots);setStatus('');}catch(e){setStatus(String(e));}
   },undefined,e=>{if(!cancelled)setStatus(`Model unavailable: ${String(e)}`);});
  }catch(e){setStatus(`3D unavailable: ${String(e)}`);}
  return()=>{cancelled=true;mounted.current=undefined;if(object)disposeObject(object);renderer?.dispose();renderer?.forceContextLoss();};
 },[url,loss]);
 useLayoutEffect(()=>{if(mounted.current)draw(mounted.current,state,shots);},[state,shots]);
 return <foreignObject x={x} y={108} width={880} height={480}><div style={{position:'relative',width:880,height:480}}>
  <canvas aria-label="Blender 3D visualization" data-model-ready={status?'false':'true'} ref={canvas} style={{width:880,height:480,display:'block'}} />
  {!status&&<div style={{position:'absolute',left:16,top:8,color:'#cbd5e1',background:'rgba(10,14,26,.86)',padding:'7px 11px',borderRadius:7,font:'14px system-ui',pointerEvents:'none'}}>{[...shots].reverse().find(shot=>state.t>=shot.at)?.label}</div>}
  {status&&<div role="status" style={{position:'absolute',inset:30,color:'#e2e8f0',font:'18px system-ui'}}>{status}</div>}
 </div></foreignObject>;
}
