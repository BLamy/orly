// Run against the local app and Storybook after building a book.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { extractScene } from '../../generator/scene-captions.mjs';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
const slug=process.argv[2];
assert.ok(slug, 'Pass one book slug');
const base=process.env.ORLY_PREVIEW_URL||'http://127.0.0.1:5173';
const storyBase=process.env.ORLY_STORYBOOK_URL||'http://127.0.0.1:6006';
const manifest=JSON.parse(fs.readFileSync(path.join(root,`public/generated/${slug}/manifest.json`)));
const evidence=path.join(root,`series/from-rlcd-to-predictive-tab/evidence/${slug}`);
fs.mkdirSync(evidence,{recursive:true});
const browser=await chromium.launch({headless:true});
const report=[];
async function seekTo(slider,t){
  const step=Number(await slider.getAttribute('step'));
  await slider.fill(String(Number((Math.round(t/step)*step).toFixed(3))));
}
try {
  const index=await (await fetch(`${storyBase}/index.json`)).json();
  for(const chapter of manifest.chapters){
    const errors=[];
    const infrastructureWarnings=[];
    const page=await browser.newPage({viewport:{width:1600,height:1000}});
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{
      if(m.type()!=='error')return;
      const url=m.location().url;
      if(/\/favicon\.ico(?:\?|$)/.test(url))return;
      if(url===`${storyBase}/vite-inject-mocker-entry.js`&&m.text().includes('404')){
        infrastructureWarnings.push({url,message:m.text()});
        return;
      }
      errors.push(`${m.text()} (${url})`);
    });
    await page.goto(`${base}/?bundle=${slug}&chapter=${chapter.number}`);
    await page.locator('.bp-stage > svg').waitFor();
    const player=page.locator('.bp-player');
    const pause=player.getByRole('button',{name:'Pause',exact:true});
    if(await pause.count()) await pause.click();
    const mute=player.getByRole('button',{name:'Mute',exact:true});
    if(await mute.count()) await mute.click();
    const seek=player.getByRole('slider',{name:'Seek',exact:true});
    const cues=chapter.cues.map(c=>typeof c==='number'?c:c.at);
    const times=[1,chapter.duration*.5,...cues.slice(1).map(t=>Math.min(chapter.duration-.2,t+1.5)),chapter.duration-1,chapter.duration*.25,chapter.duration*.5];
    const frames=[]; let middle;
    for(const [i,t] of times.entries()){
      assert.ok(Number.isFinite(t));
      await seekTo(seek,t);
      await page.waitForTimeout(100);
      const frame=await page.locator('.bp-stage > svg').innerHTML();
      if(i===1) middle=frame;
      if(i===times.length-1) assert.equal(frame,middle,`Backward seek changed frame: ${slug}/${chapter.number}`);
      const file=`chapter-${chapter.number}-state-${i}.png`;
      await page.locator('.bp-stage').screenshot({path:path.join(evidence,file)});
      frames.push({t,file});
    }
    const story=Object.values(index.entries).find(e=>e.importPath?.includes(`/books/${slug}/chapter-${chapter.number}.stories.tsx`));
    assert.ok(story,`Missing Storybook chapter ${chapter.number}`);
    await page.goto(`${storyBase}/iframe.html?id=${story.id}&viewMode=story`);
    await page.locator('svg').first().waitFor();
    await page.waitForTimeout(300);
    const storyPause=page.getByRole('button',{name:'Pause',exact:true});
    if(await storyPause.count()) await storyPause.click();
    const storySeek=page.getByRole('slider',{name:'Seek',exact:true});
    // Storybook runs the authored clock; published books run the recording clock.
    const authored=await extractScene(path.join(root,`apps/bookshelf/src/viz/books/${slug}/chapter-${chapter.number}.tsx`));
    let storyMiddle;
    for(const [i,t] of [authored.duration*.5,authored.duration-1,1,authored.duration*.5].entries()){
      await seekTo(storySeek,t);
      await page.waitForTimeout(100);
      const svg=await page.locator('.viz-player-stage > svg').first().innerHTML();
      if(i===0) storyMiddle=svg;
      if(i===3) assert.equal(svg,storyMiddle,'Storybook backward seek mismatch');
    }
    assert.equal(errors.length,0,errors.join('\n'));
    report.push({chapter:chapter.number,story:story.id,forwardBackwardSeeking:'passed',consoleErrors:errors,infrastructureWarnings,frames});
    await page.close();
  }
  fs.writeFileSync(path.join(evidence,'render-check.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`${slug}: ${report.length} chapters rendered and deterministically sought; Storybook stories mount.`);
} finally {await browser.close();}
