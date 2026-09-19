import * as THREE from 'three';
export type V3=[number,number,number];
export const palette={cyan:0x38bdf8,mint:0x34d399,violet:0xa78bfa,amber:0xfbbf24,coral:0xfb7185};
export const clamp=(u:number)=>Math.max(0,Math.min(1,u));
const material=(color:number)=>new THREE.MeshStandardMaterial({color,roughness:.45,metalness:.08});
export function wireBox(size:V3,color=palette.cyan) {
 const source=new THREE.BoxGeometry(...size);
 const lines=new THREE.LineSegments(new THREE.EdgesGeometry(source),new THREE.LineBasicMaterial({color,transparent:true,opacity:.55}));source.dispose();return lines;
}
/** Logical dimensions and display sampling are deliberately separate. Pipeline travels along x. */
export function tensorVolume({shape,size=[1,3,3],samples=[8,10,10],value,color=palette.cyan}:{shape:V3;size?:V3;samples?:V3;value:(x:number,y:number,c:number)=>number;color?:number}) {
 if(shape.some(n=>!Number.isInteger(n)||n<1)||samples.some(n=>!Number.isInteger(n)||n<1))throw new Error('Tensor dimensions must be positive integers');
 const [nc,ny,nx]=samples.map((n,i)=>Math.min(n,[shape[2],shape[1],shape[0]][i]));
 const count=nc*ny*nx;if(count>20000)throw new Error('Use display sampling for large tensors (maximum 20,000 cells)');
 const root=new THREE.Group();root.userData={primitive:'tensorVolume',shape,displaySamples:[nx,ny,nc],encoding:'sampled cells; display dimensions are not a linear scale'};
 const geometry=new THREE.BoxGeometry(size[0]/nc*.42,size[1]/ny*.64,size[2]/nx*.64);
 const mesh=new THREE.InstancedMesh(geometry,material(0xffffff),count);const transform=new THREE.Object3D();const colors:THREE.Color[]=[];
 for(let c=0;c<nc;c++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){
  const i=(c*ny+y)*nx+x;
  transform.position.set(((c+.5)/nc-.5)*size[0],(.5-(y+.5)/ny)*size[1],((x+.5)/nx-.5)*size[2]);
  transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);
  const v=clamp(value(Math.floor(x*shape[0]/nx),Math.floor(y*shape[1]/ny),Math.floor(c*shape[2]/nc)));
  colors.push(new THREE.Color(0x10263a).lerp(new THREE.Color(color),.15+.85*v));mesh.setColorAt(i,colors[i]);
 }
 root.add(mesh,wireBox(size,color));
 return {root,size,shape,setActivity(u:number){const gain=.18+.82*clamp(u);colors.forEach((c,i)=>mesh.setColorAt(i,c.clone().multiplyScalar(gain)));if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}};
}
export function featureMap(values:readonly number[],width:number,height:number,size=3,color=palette.cyan){
 if(values.length!==width*height)throw new Error('Feature-map values must match width × height');
 return tensorVolume({shape:[width,height,1],size:[.12,size,size],samples:[1,height,width],value:(x,y)=>values[y*width+x],color});
}
export function neuronLayer(count:number,{height=3,columns=1,color=palette.violet}={}) {
 if(!Number.isInteger(count)||count<1||count>4096)throw new Error('Neuron display count must be between 1 and 4096');
 const root=new THREE.Group(),positions:THREE.Vector3[]=[];const rows=Math.ceil(count/columns);
 const mesh=new THREE.InstancedMesh(new THREE.SphereGeometry(.055,10,8),material(color),count);const o=new THREE.Object3D();
 for(let i=0;i<count;i++){const p=new THREE.Vector3(0,height*(.5-(Math.floor(i/columns)+.5)/rows),((i%columns)-(columns-1)/2)*.18);positions.push(p);o.position.copy(p);o.updateMatrix();mesh.setMatrixAt(i,o.matrix);}
 root.add(mesh);root.userData={primitive:'neuronLayer',displayCount:count};return {root,positions,setValues(values:readonly number[]){if(values.length!==count)throw new Error('Neuron values must match count');values.forEach((v,i)=>mesh.setColorAt(i,new THREE.Color(0x17253a).lerp(new THREE.Color(color),clamp(Math.abs(v)))));if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}};
}
/** Explicit edges only. Sampling is chosen by the caller, never implied to be complete. */
export function connectionBundle(edges:readonly (readonly [THREE.Vector3,THREE.Vector3])[],color=palette.cyan,opacity=.16){
 const points=edges.flatMap(([a,b])=>[a,b]);const root=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color,transparent:true,opacity}));root.userData={primitive:'connectionBundle',edges:edges.length};return root;
}
export function activationPackets(edges:readonly (readonly [THREE.Vector3,THREE.Vector3])[],color=palette.amber){
 const root=new THREE.Group();const balls=edges.map(()=>{const b=new THREE.Mesh(new THREE.SphereGeometry(.055,10,8),new THREE.MeshBasicMaterial({color}));root.add(b);return b;});
 return {root,sample(u:number){balls.forEach((b,i)=>{b.position.lerpVectors(edges[i][0],edges[i][1],clamp(u));b.visible=u>=0&&u<=1;});}};
}
export function receptiveField(size:V3,color=palette.amber){const root=new THREE.Group();root.add(wireBox(size,color));const fill=new THREE.Mesh(new THREE.BoxGeometry(...size),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.12,depthWrite:false}));root.add(fill);return root;}
export function vectorArrow(from:V3,to:V3,color=palette.cyan){const a=new THREE.Vector3(...from),delta=new THREE.Vector3(...to).sub(a);return new THREE.ArrowHelper(delta.clone().normalize(),a,delta.length(),color,.2,.1);}
export function coordinateAxes(length=3){const root=new THREE.Group();root.add(vectorArrow([0,0,0],[length,0,0],palette.coral),vectorArrow([0,0,0],[0,length,0],palette.mint),vectorArrow([0,0,0],[0,0,length],palette.cyan));return root;}
export function parametricSurface(f:(x:number,z:number)=>number,{domain=[-2,2],steps=48,color=palette.cyan}:{domain?:[number,number];steps?:number;color?:number}={}){
 if(steps<2||steps>256)throw new Error('Surface resolution must be between 2 and 256');
 const vertices:number[]=[],indices:number[]=[];for(let j=0;j<=steps;j++)for(let i=0;i<=steps;i++){const x=domain[0]+(domain[1]-domain[0])*i/steps,z=domain[0]+(domain[1]-domain[0])*j/steps;vertices.push(x,f(x,z),z);}
 for(let j=0;j<steps;j++)for(let i=0;i<steps;i++){const a=j*(steps+1)+i;indices.push(a,a+steps+1,a+1,a+1,a+steps+1,a+steps+2);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const m=material(color);m.side=THREE.DoubleSide;const root=new THREE.Mesh(g,m);root.userData={primitive:'parametricSurface',domain,steps};return root;
}
export function probabilityBars(probabilities:readonly number[],height=3){
 if(probabilities.some(p=>p<0||!Number.isFinite(p))||Math.abs(probabilities.reduce((a,b)=>a+b,0)-1)>1e-6)throw new Error('Probabilities must be finite, nonnegative and sum to one');
 const root=new THREE.Group();probabilities.forEach((p,i)=>{const b=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.002,p*4),height/probabilities.length*.65,.1),material(palette.mint));b.position.set(p*2,height*(.5-(i+.5)/probabilities.length),0);root.add(b);});root.userData={primitive:'probabilityBars',probabilities};return root;
}
export function disposeThree(root:THREE.Object3D){const gs=new Set<THREE.BufferGeometry>(),ms=new Set<THREE.Material>(),ts=new Set<THREE.Texture>();root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line||o instanceof THREE.Points){gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){ms.add(m);for(const v of Object.values(m))if(v instanceof THREE.Texture)ts.add(v);}}if(o instanceof THREE.InstancedMesh)o.dispose();});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());}
