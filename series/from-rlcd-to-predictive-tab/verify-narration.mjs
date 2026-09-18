// Release check: recordings, exact caption cues, audio-clock playback and seeking.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { extractScene } from '../../generator/scene-captions.mjs';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
const slug=process.argv[2];
assert.ok(slug,'Pass a book slug');
const base=process.env.ORLY_PREVIEW_URL||'http://127.0.0.1:5178';
const manifest=JSON.parse(fs.readFileSync(path.join(root,`public/generated/${slug}/manifest.json`)));
const browser=await chromium.launch({headless:true});
const report=[];
try {
  for(const chapter of manifest.chapters){
    assert.ok(chapter.audio,`Chapter ${chapter.number}: missing recorded narration`);
    assert.ok(fs.statSync(path.join(root,`public/generated/${slug}`,chapter.audio)).size>1000);
    const scene=await extractScene(path.join(root,`apps/bookshelf/src/viz/books/${slug}/chapter-${chapter.number}.tsx`));
    assert.equal(chapter.cues.length,scene.captions.length);
    chapter.cues.forEach((cue,i)=>{
      assert.ok(Number.isFinite(cue)&&cue>=0&&cue<chapter.duration,'Cue outside recording');
      if(i)assert.ok(cue>chapter.cues[i-1],'Narration cues must increase strictly');
    });
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(`${base}/?bundle=${slug}&chapter=${chapter.number}`);
    await page.locator('.bp-stage > svg').waitFor();
    const audio=page.locator('.bp-player audio');
    await audio.waitFor({state:'attached'});
    await page.waitForFunction(()=>{
      const a=document.querySelector('.bp-player audio');
      return a&&a.readyState>=2&&Number.isFinite(a.duration);
    });
    const media=await audio.evaluate(a=>({duration:a.duration,error:a.error?.message,src:a.currentSrc}));
    assert.ok(!media.error,media.error);
    assert.ok(Math.abs(media.duration-chapter.duration)<1,'Recording length differs from narration manifest');
    const player=page.locator('.bp-player');
    const pause=player.getByRole('button',{name:'Pause',exact:true});
    if(await pause.count())await pause.click();
    const seek=player.getByRole('slider',{name:'Seek',exact:true});
    const seekStep=Number(await seek.getAttribute('step'));
    const seekValue=t=>String(Number((Math.round(t/seekStep)*seekStep).toFixed(3)));
    // Check every caption after its fade-in and repeat in reverse to catch stale state.
    for(const i of [...chapter.cues.keys(),...Array.from(chapter.cues.keys()).reverse()]){
      const next=chapter.cues[i+1]??chapter.duration;
      const t=chapter.cues[i]+Math.min(.8,(next-chapter.cues[i])/3);
      await seek.fill(seekValue(t));
      await page.waitForTimeout(150);
      assert.ok(Math.abs(await audio.evaluate(a=>a.currentTime)-t)<.15,'Seek and audio clocks diverged');
      assert.equal((await player.locator('.captions-pill').innerText()).trim(),scene.captions[i].text.trim(),`Caption ${i+1} not aligned in chapter ${chapter.number}`);
    }
    await seek.fill(seekValue(chapter.duration*.5));
    const before=await audio.evaluate(a=>a.currentTime);
    await player.getByRole('button',{name:'Play',exact:true}).click();
    await page.waitForTimeout(1200);
    const after=await audio.evaluate(a=>a.currentTime);
    assert.ok(after-before>.7,'Recorded audio clock did not advance during playback');
    assert.ok(Math.abs(Number(await seek.inputValue())-after)<.3,'Player clock drifted from audio');
    assert.equal(errors.length,0,errors.join('\n'));
    report.push({chapter:chapter.number,recording:chapter.audio,duration:media.duration,captions:chapter.cues.length,forwardReverseCueChecks:'passed',audioClockPlayback:'passed'});
    await page.close();
  }
  const dir=path.join(root,`series/from-rlcd-to-predictive-tab/evidence/${slug}`);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'narration-check.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`${slug}: ${report.length} recorded chapters passed audio-clock and caption synchronization checks.`);
}finally{await browser.close();}
