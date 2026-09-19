import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch();const results=[];fs.mkdirSync('artifacts/three',{recursive:true});
try{for(const [id,times] of [['alex-net',[1,7,19,30,39,45]],['convolution',[1,8,18,26]],['neural-network',[1,7,15,22]],['math-primitives',[1,8,15,21]]]){
 const page=await browser.newPage({viewport:{width:1400,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
 await page.goto('http://127.0.0.1:6007/iframe.html?id=3d-library-compositions--'+id+'&viewMode=story');await page.locator('.viz-player').waitFor();const pause=page.getByRole('button',{name:'Pause',exact:true});if(await pause.count())await pause.click();const seek=page.getByRole('slider',{name:'Seek',exact:true});
 for(const t of times){await seek.fill(String(t));await page.locator('canvas[data-ready=true]').waitFor();const before=await page.locator('canvas').evaluate(c=>c.toDataURL());await page.locator('.viz-player-stage').screenshot({path:`artifacts/three/${id}-${t}.png`});await seek.fill('0');await seek.fill(String(t));if(before!==await page.locator('canvas').evaluate(c=>c.toDataURL()))throw new Error('Reverse seek changed pixels at '+t);}
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export frame as GLB'}).click();const download=await downloadPromise;await download.saveAs(`artifacts/three/${id}.glb`);const bytes=fs.readFileSync(`artifacts/three/${id}.glb`);if(bytes.readUInt32LE(0)!==0x46546c67)throw new Error('Invalid GLB header');results.push({id,frames:times.length,reverseSeek:'passed',exportBytes:bytes.length,errors});
 }catch(e){results.push({id,error:String(e),errors});}finally{await page.close();}
}}finally{await browser.close();}
fs.writeFileSync('artifacts/three/verification.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));if(results.some(r=>r.error||r.errors.length))process.exitCode=1;
