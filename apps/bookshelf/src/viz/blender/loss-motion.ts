import * as THREE from 'three';
import { LOSS, RUN_BAD, RUN_GOOD, pathAt, type Pt } from '../explainers/loss-landscape/scene';
import { findNode } from './camera-plan';
import type { SceneState } from '../core';

// Coordinate conversion matches Blender's z-up surface export.
export const terrainPoint=([a,b]:Pt,offset=.08)=>new THREE.Vector3(b,LOSS(a,b)*.75+offset,-a);
export function createLossMotion(root:THREE.Object3D) {
 const landmarks=['SADDLE','LOCAL_MIN','GLOBAL_MIN','MIRROR_MIN'].map(name=>findNode(root,name));
 const runs=[RUN_BAD,RUN_GOOD].map((path,i)=>{
  const color=i===0?0xfb923c:0x34d399;
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.095,24,16),new THREE.MeshStandardMaterial({color,roughness:.28,emissive:color,emissiveIntensity:.25}));
  ball.name=i===0?'Descent bad':'Descent good';root.add(ball);
  class DescentCurve extends THREE.Curve<THREE.Vector3> {
   constructor(){super();}
   // Optimizer-step time, not arc-length time: the trail must meet the ball.
   getPointAt(t:number,target=new THREE.Vector3()){return this.getPoint(t,target);}
   getPoint(t:number,target=new THREE.Vector3()){return target.copy(terrainPoint(pathAt(path,t),.04));}
  }
  const geometry=new THREE.TubeGeometry(new DescentCurve(),700,.018,6,false);
  const trail=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.4,roughness:.5}));root.add(trail);
  return {path,ball,trail};
 });
 return (state:SceneState)=>{
  const debug=[];
  for(const marker of landmarks)if(marker)marker.visible=Number(state.get({key:'run1U'}))<.01;
  for(const [i,r] of runs.entries()){
   const u=Number(state.get({key:`run${i+1}U`})),progress=Number(state.get({key:`run${i+1}Prog`}));
   r.ball.visible=r.trail.visible=u>.001;
   r.ball.position.copy(terrainPoint(pathAt(r.path,progress)));
   r.ball.position.y+=(1-Math.min(1,u))*.7;
   r.ball.scale.setScalar(Math.min(1,u));
   r.trail.geometry.setDrawRange(0,Math.ceil(Math.max(0,Math.min(1,progress))*700)*36);
   debug.push({progress,visible:r.ball.visible,position:r.ball.position.toArray()});
  }
  return debug;
 };
}
