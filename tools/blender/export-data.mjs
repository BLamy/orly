// Export existing computed scene data; Blender never invents replacement results.
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const data={};
for (const name of ['loss-landscape','hnsw','vision-kernels','svm']) {
 const outfile=`/tmp/orly-blender-${name}.mjs`;
 await esbuild.build({entryPoints:[`apps/bookshelf/src/viz/explainers/${name}/scene.ts`],bundle:true,outfile,format:'esm',platform:'node',jsx:'automatic',loader:{'.css':'empty'},define:{'import.meta.env':'{}'},logLevel:'silent'});
 const m=await import(outfile);
 if(name==='loss-landscape') {
  const n=81; const vertices=[];
  for(let j=0;j<n;j++) for(let i=0;i<n;i++){const a=-2.6+5.2*j/(n-1),b=-5.2+10.4*i/(n-1);vertices.push([b,a,m.LOSS(a,b)]);}
  data.loss={n,vertices,landmarks:['GLOBAL_MIN','MIRROR_MIN','LOCAL_MIN','SADDLE'].map(k=>({name:k,p:[m[k][1],m[k][0],m.LOSS(...m[k])]}))};
 } else if(name==='hnsw') data.hnsw={points:m.PTS,layers:m.LAYERS,neighbors:m.NBRS,search:m.SEARCH,query:m.QUERY};
 else if(name==='vision-kernels') data.vision={image:m.IMAGE,maps:[m.MAP_VERT,m.MAP_HORZ,m.MAP_TEX],kernels:[m.K_VERT,m.K_HORZ,m.K_TEX]};
 else data.svm={points:m.XOR,decisions:m.XOR.map(p=>m.xorDecision(p.x,p.y))};
}
fs.writeFileSync(path.join(root,'tools/blender/scene-data.json'),JSON.stringify(data));
console.log('Exported exact loss grid, HNSW index/search, convolution maps, and XOR data.');
