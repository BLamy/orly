// End-to-end regression for a static host that ignores audio Range requests.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const dir=path.dirname(new URL(import.meta.url).pathname);
const root=path.resolve(dir,'../..');
const base=process.env.ORLY_PREVIEW_URL||'http://127.0.0.1:5220';
const slug='recordings-become-practice';
const browser=await chromium.launch({headless:true});
const errors=[];
try {
  const page=await browser.newPage({serviceWorkers:'block'});
  await page.addInitScript(()=>{
    window.__mediaUrls={created:[],revoked:[]};
    const create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
    URL.createObjectURL=blob=>{const url=create(blob);window.__mediaUrls.created.push(url);return url;};
    URL.revokeObjectURL=url=>{window.__mediaUrls.revoked.push(url);revoke(url);};
  });
  page.on('pageerror',error=>errors.push(error.message));
  if (!base.startsWith('https:')) await page.route(`**/generated/${slug}/audio/*.mp3`,async route=>{
    const file=path.basename(new URL(route.request().url()).pathname);
    await route.fulfill({status:200,contentType:'audio/mpeg',body:fs.readFileSync(path.join(root,`public/generated/${slug}/audio/${file}`))});
  });
  await page.goto(`${base}/?bundle=${slug}`);
  const player=page.locator('.bp-player');
  await page.waitForFunction(()=>{
    const a=document.querySelector('.bp-player audio');
    return a?.currentSrc.startsWith('blob:')&&a.readyState>=4&&a.seekable.length&&a.seekable.end(0)>60;
  });
  await page.waitForTimeout(300);
  const pause=player.getByRole('button',{name:'Pause',exact:true});
  if(await pause.count())await pause.click();
  const seek=player.getByRole('slider',{name:'Seek',exact:true});
  for(const target of [55,4,35,8]){
    await seek.fill(String(target));
    await page.waitForFunction(t=>{
      const a=document.querySelector('.bp-player audio');
      return a&&!a.seeking&&Math.abs(a.currentTime-t)<.15;
    },target);
  }
  // Measure decoded PCM routed to the output while the actual player runs.
  await player.evaluate(p=>{
    const a=p.querySelector('audio'),ctx=new AudioContext(),analyser=ctx.createAnalyser();
    ctx.createMediaElementSource(a).connect(analyser);analyser.connect(ctx.destination);
    p.querySelector('.bp-play').addEventListener('click',()=>void ctx.resume(),{once:true});
    window.__audioOutput={ctx,analyser};
  });
  const before=await player.locator('audio').evaluate(a=>a.currentTime);
  await player.getByRole('button',{name:'Play',exact:true}).click();
  await page.waitForFunction(()=>window.__audioOutput.ctx.state==='running');
  const output=await page.evaluate(async()=>{
    const analyser=window.__audioOutput.analyser,data=new Float32Array(analyser.fftSize);
    let maxRms=0;
    for(let i=0;i<15;i++){
      analyser.getFloatTimeDomainData(data);
      maxRms=Math.max(maxRms,Math.sqrt(data.reduce((sum,v)=>sum+v*v,0)/data.length));
      await new Promise(resolve=>setTimeout(resolve,150));
    }
    const a=document.querySelector('.bp-player audio');
    return {maxRms,muted:a.muted,volume:a.volume,time:a.currentTime};
  });
  assert.ok(output.maxRms>.0001,'Decoded narration output is silent');
  assert.equal(output.muted,false);assert.equal(output.volume,1);
  assert.ok(output.time-before>1,'Actual audio playback did not advance');
  await player.getByRole('button',{name:'Pause',exact:true}).click();
  const first=await player.locator('audio').evaluate(a=>a.currentSrc);
  await player.getByRole('button',{name:'Next chapter',exact:true}).click();
  await page.waitForURL(u=>u.searchParams.get('chapter')==='2');
  await page.waitForFunction(previous=>{
    const a=document.querySelector('.bp-player audio');
    return a?.currentSrc.startsWith('blob:')&&a.currentSrc!==previous&&a.readyState>=4&&window.__mediaUrls.revoked.includes(previous);
  },first);
  const second=await player.locator('audio').evaluate(a=>a.currentSrc);
  // Switching the responsive shell unmounts the desktop player in the same
  // document; a hard Home navigation would discard our instrumentation too.
  await page.setViewportSize({width:390,height:844});
  await page.waitForFunction(previous=>window.__mediaUrls.revoked.includes(previous),second);
  assert.equal(errors.length,0,errors.join('\n'));
  const report={base,rangeIgnoredByHost:'HTTP 200 full recording',fallbackSeekForwardAndBackward:'passed',chapterChangeAndUnmountRevokeUrls:'passed',actualDecodedOutput:output,pageErrors:errors};
  const file=base.startsWith('https:')?'live-audio-output-check.json':'audio-fallback-check.json';
  fs.writeFileSync(path.join(dir,'evidence',file),JSON.stringify(report,null,2)+'\n');
  console.log(report);
} finally {await browser.close();}
