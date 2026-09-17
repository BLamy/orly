import {chromium} from 'playwright';import fs from 'node:fs';import path from 'node:path';
import {extractScene} from '../../generator/scene-captions.mjs';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
const [slug,num]=process.argv.slice(2); const chapter=Number(num);
const ex=await extractScene(path.join(root,`apps/bookshelf/src/viz/books/${slug}/chapter-${chapter}.tsx`));
const dir=path.join(root,`series/from-rlcd-to-predictive-tab/evidence/${slug}`);fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
const page=await browser.newPage({viewport:{width:1280,height:800}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
const idx=await (await fetch('http://127.0.0.1:6007/index.json')).json();
const story=Object.values(idx.entries).find(e=>e.importPath?.includes(`/books/${slug}/chapter-${chapter}.stories.tsx`));
await page.goto(`http://127.0.0.1:6007/iframe.html?id=${story.id}&viewMode=story`);
await page.locator('.viz-player').waitFor();
const pause=page.getByRole('button',{name:'Pause',exact:true});if(await pause.count())await pause.click();
for(const [i,c] of ex.captions.entries()){
await page.getByRole('slider',{name:'Seek',exact:true}).fill(String(Math.min(c.at+3,ex.duration-.1)));await page.waitForTimeout(100);await page.locator('.viz-player-stage').screenshot({path:path.join(dir,`draft-chapter-${chapter}-cue-${i+1}.png`)});
}
console.log({slug,chapter,errors});if(errors.length)process.exitCode=1;
}finally{await browser.close();}
