import * as THREE from 'three';

export interface CameraCue { at:number; text:string }
export interface Shot {
  at:number; duration:number; label:string;
  azimuth:number; elevation:number;
  nodes?:string[]; padding?:[number,number,number];
}
export interface Pose { position:THREE.Vector3; target:THREE.Vector3; box:THREE.Box3 }
const rad=(degrees:number)=>degrees*Math.PI/180;
const normalize=(name:string)=>name.replace(/[^a-z0-9]/gi,'').toLowerCase();
export function findNode(root:THREE.Object3D,name:string) {
 let found:THREE.Object3D|undefined;
 root.traverse(o=>{if(normalize(o.name)===normalize(name))found=o;});
 return found;
}
/** All cuts are anchored to existing caption starts, including Motion-panel retiming. */
export function cameraPlan(id:string,cues:CameraCue[],start:number):Shot[] {
 const defaults:Record<string,[number,number,string]>={
  shed:[-36,27,'Wall assembly'],hifi:[24,24,'Both hands in one frame'],
  bench:[18,18,'See the rail, legs and layers'],loss:[-18,57,'The complete loss surface'],
  table:[-24,22,'Inside the tabletop joint'],bar:[-24,28,'Follow the screw into the support'],
  svm:[28,27,'The extra feature dimension'],turbo:[12,45,'All twelve future poses'],
  hnsw:[15,22,'Three aligned search levels'],vision:[-25,30,'Separate feature-map planes'],
 };
 const [azimuth,elevation,label]=defaults[id]??[25,30,'Model overview'];
 const shots:Shot[]=[{at:start,duration:0,label,azimuth,elevation}];
 function cue(text:string,shot:Omit<Shot,'at'|'duration'>,duration=1.6) {
  const c=cues.find(c=>c.text.includes(text));
  if(!c)throw new Error(`Camera cue missing for ${id}: ${text}`);
  shots.push({...shot,at:Math.max(start,c.at-.2),duration});
 }
 if(id==='loss') {
  cue("It isn't a smooth bowl",{label:'Ripples across the surface',azimuth:-12,elevation:48});
  cue("That's a saddle point",{label:'Saddle • uphill one way, downhill the other',azimuth:-10,elevation:66,nodes:['SADDLE'],padding:[1.15,.30,.75]});
  cue('a shallow dent:',{label:'Local minimum • a shallow basin',azimuth:8,elevation:65,nodes:['LOCAL_MIN'],padding:[.95,.23,.65]});
  cue('Notice the symmetry',{label:'Two best fits • the same model, mirrored',azimuth:0,elevation:68,nodes:['GLOBAL_MIN','MIRROR_MIN'],padding:[.45,.3,.4]},2);
  cue('Now drop a ball',{label:'Orange: descending into the shallow basin',azimuth:8,elevation:68,nodes:['Descent bad'],padding:[1.2,.55,.95]});
  cue('Look left:',{label:'The ball has stopped • compare its fit at left',azimuth:8,elevation:65,nodes:['Descent bad'],padding:[1,.35,.75]});
  cue('Start somewhere else',{label:'Mint: a different start, the same descent rule',azimuth:0,elevation:70,nodes:['Descent good'],padding:[1.3,.55,1]});
  cue('Same landscape, same rule',{label:'Two starts • two outcomes',azimuth:0,elevation:72,nodes:['Descent bad','Descent good'],padding:[.8,.4,.7]});
  cue('Every training run',{label:'Training is a path across the loss surface',azimuth:-12,elevation:65},2);

 }
 if(id==='bench') {
  cue('three and a half inch block',{label:'The spacer between the rails',azimuth:155,elevation:35,nodes:['Course 1'],padding:[.7,.55,.65]});
  cue('second forty-eight',{label:'The next rail lands on the legs',azimuth:20,elevation:22});
  cue('fourteen and a half inch piece',{label:'Leg infill and the next spacer',azimuth:30,elevation:28});
 }
 if(id==='table') {
  shots[0].nodes=['Rabbeted button','Screw','Tongue'];shots[0].padding=[.45,.3,.35];
  cue('changes width with the seasons',{label:'The tongue slides while the top stays held down',azimuth:-12,elevation:16,nodes:['Rabbeted button','Screw','Tongue'],padding:[.65,.3,.35]});
 }
 if(id==='bar') {shots[0].nodes=['Screw badU','Screw goodU'];shots[0].padding=[.6,.65,.5];}
 return shots.sort((a,b)=>a.at-b.at);
}
/** Fit the actual rectangular bounds in the camera's view, not a wasteful diagonal sphere. */
export function poseForShot(root:THREE.Object3D,whole:THREE.Box3,shot:Shot,aspect:number,fov:number):Pose {
 let box=whole.clone();
 if(shot.nodes){
  box.makeEmpty();
  for(const name of shot.nodes){const node=findNode(root,name);if(!node)throw new Error(`Camera subject missing: ${name}`);box.union(new THREE.Box3().setFromObject(node));}
  const p=shot.padding??[.2,.2,.2];box.expandByVector(new THREE.Vector3(...p));
 }
 const target=box.getCenter(new THREE.Vector3());
 const az=rad(shot.azimuth),el=rad(shot.elevation);
 const direction=new THREE.Vector3(Math.sin(az)*Math.cos(el),Math.sin(el),Math.cos(az)*Math.cos(el));
 const right=new THREE.Vector3(direction.z,0,-direction.x).normalize();
 const up=new THREE.Vector3().crossVectors(direction,right).normalize();
 const tanY=Math.tan(rad(fov)/2)*.86,tanX=tanY*aspect;
 let distance=.1;
 for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z]){
  const p=new THREE.Vector3(x,y,z).sub(target),depth=p.dot(direction);
  distance=Math.max(distance,depth+Math.abs(p.dot(right))/tanX,depth+Math.abs(p.dot(up))/tanY);
 }
 return {target,position:target.clone().addScaledVector(direction,distance),box};
}
/** Closed-form interpolation: no dependence on the last rendered frame. */
export function sampleCamera(root:THREE.Object3D,whole:THREE.Box3,shots:Shot[],t:number,aspect:number,fov:number) {
 let index=0;for(let i=1;i<shots.length;i++)if(t>=shots[i].at)index=i;
 const shot=shots[index];const to=poseForShot(root,whole,shot,aspect,fov);
 if(index===0||t>=shot.at+shot.duration)return {...to,shot};
 const from=poseForShot(root,whole,shots[index-1],aspect,fov);
 const u=Math.max(0,Math.min(1,(t-shot.at)/shot.duration));const eased=u*u*(3-2*u);
 return {position:from.position.lerp(to.position,eased),target:from.target.lerp(to.target,eased),box:to.box,shot};
}
