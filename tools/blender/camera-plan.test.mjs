import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import * as THREE from 'three';
const bundle=await build({entryPoints:['apps/bookshelf/src/viz/blender/camera-plan.ts'],bundle:true,platform:'node',format:'esm',write:false,external:['three']});
// Resolve the sole external dependency from this test's location.
const code=bundle.outputFiles[0].text.replaceAll('"three"',JSON.stringify(import.meta.resolve('three')));
const {poseForShot,sampleCamera,cameraPlan}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
const root=new THREE.Group();
const landmark=new THREE.Mesh(new THREE.SphereGeometry(.1));landmark.name='SADDLE';landmark.position.set(1,.5,0);root.add(landmark);root.updateMatrixWorld(true);
const bounds=new THREE.Box3(new THREE.Vector3(-4,0,-3),new THREE.Vector3(4,5,3));
const wide={at:0,duration:0,label:'wide',azimuth:-18,elevation:57};
const close={at:10,duration:2,label:'close',azimuth:-10,elevation:66,nodes:['SADDLE'],padding:[1,.3,.7]};
test('overview keeps every bounding corner in the safe frame',()=>{
 const pose=poseForShot(root,bounds,wide,880/480,40);const camera=new THREE.PerspectiveCamera(40,880/480,.01,1000);camera.position.copy(pose.position);camera.lookAt(pose.target);camera.updateMatrixWorld();
 for(const x of [-4,4])for(const y of [0,5])for(const z of [-3,3]){const p=new THREE.Vector3(x,y,z).project(camera);assert.ok(Math.abs(p.x)<=.861&&Math.abs(p.y)<=.861);}
});
test('detail targets the landmark and moves closer without seek history',()=>{
 const a=sampleCamera(root,bounds,[wide,close],12,880/480,40);const b=sampleCamera(root,bounds,[wide,close],0,880/480,40);
 assert.ok(a.target.distanceTo(landmark.position)<1e-6);assert.ok(a.position.distanceTo(a.target)<b.position.distanceTo(b.target));
 sampleCamera(root,bounds,[wide,close],11,880/480,40);assert.deepEqual(sampleCamera(root,bounds,[wide,close],12,880/480,40).position.toArray(),a.position.toArray());
});
test('shots follow retimed narration',()=>{
 const texts=["It isn't a smooth bowl","That's a saddle point",'a shallow dent:','Notice the symmetry','Now drop a ball','Look left:','Start somewhere else','Same landscape, same rule','Every training run'];
 const plan=offset=>cameraPlan('loss',texts.map((text,i)=>({text,at:25+i*6+offset})),19);
 const a=plan(0),b=plan(3);for(let i=1;i<a.length;i++)assert.ok(Math.abs(b[i].at-a[i].at-3)<1e-9);
});
