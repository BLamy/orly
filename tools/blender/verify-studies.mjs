import {chromium} from 'playwright';
import fs from 'node:fs';
const base=process.env.STORYBOOK_URL??'http://127.0.0.1:6007';
const studies=JSON.parse(fs.readFileSync('tools/blender/studies.json','utf8'));
const idx=await(await fetch(base+'/index.json')).json();
const browser=await chromium.launch({headless:true});const results=[];
fs.mkdirSync('artifacts/blender/review',{recursive:true});
try{for(const study of studies){
 const entry=Object.values(idx.entries).find(e=>e.type==='story'&&e.importPath.endsWith(`/blender/${study.id}.stories.tsx`));
 const page=await browser.newPage({viewport:{width:1400,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(base+'/iframe.html?id='+entry.id+'&viewMode=story');await page.locator('.viz-player').waitFor();
  const pause=page.getByRole('button',{name:'Pause',exact:true});if(await pause.count())await pause.click();
  const slider=page.getByRole('slider',{name:'Seek',exact:true});const middle=Math.floor((study.window[0]+study.window[1])/2);
  await slider.fill(String(middle));await page.locator('canvas[data-model-ready="true"]').waitFor({timeout:30000});
  const first=await page.locator('canvas').evaluate(c=>c.toDataURL());
  await page.locator('.viz-player-stage').screenshot({path:`artifacts/blender/review/${study.id}.png`});
  await slider.fill(String(Math.floor(study.window[0]+1)));await slider.fill(String(middle));
  const again=await page.locator('canvas').evaluate(c=>c.toDataURL());
  if(first!==again)throw new Error('Canvas differed after reverse seek');
  const cameraChecks=[];
  for(const t of study.id==='loss'?[22,28,32,34,39,40,45,47,51,52.3,53,55,58,64.7,66,68,71,79]:study.id==='bench'?[4,11,17,24]:[]){
   await slider.fill(String(t));const pixels=await page.locator('canvas').evaluate(c=>c.toDataURL());
   const shot=await page.locator('canvas').getAttribute('data-camera-shot');
   await slider.fill(String(study.window[0]+.5));await slider.fill(String(t));
   if(pixels!==await page.locator('canvas').evaluate(c=>c.toDataURL()))throw new Error('Camera reverse seek differed at '+t);
   const descent=study.id==='loss'?JSON.parse(await page.locator('canvas').getAttribute('data-descent')??'[]'):[];
   if(study.id==='loss'&&t===58&&Math.abs(descent[0].position[0]-3.418)>.03)throw new Error('Bad run missed the shallow minimum');
   if(study.id==='loss'&&t===71&&Math.abs(descent[1].position[0]-1.988)>.03)throw new Error('Good run missed the global minimum');
   cameraChecks.push({t,shot,reverseSeek:'passed',...(descent.length?{descent}: {})});
  }
  await page.getByRole('button',{name:'Compare original',exact:true}).click();if(await page.locator('canvas').count())throw new Error('Original comparison retained 3D canvas');
  results.push({id:study.id,story:entry.id,reverseSeek:'passed',comparison:'passed',cameraChecks,errors});
 }catch(e){results.push({id:study.id,error:String(e),errors});}
 await page.close();
}}finally{await browser.close();}
fs.writeFileSync('artifacts/blender/review/checks.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
if(results.some(r=>r.error||r.errors.length))process.exitCode=1;
