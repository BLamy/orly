// Release navigation and asset checks; works against the built preview or live.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
const dir=path.dirname(new URL(import.meta.url).pathname);
const script=JSON.parse(fs.readFileSync(path.join(dir,'series-script.json')));
const base=process.env.ORLY_PREVIEW_URL||'http://127.0.0.1:5178';
const library=await (await fetch(`${base}/generated/library.json`)).json();
const books=library.books.filter(b=>b.series===script.series).sort((a,b)=>a.seriesOrder-b.seriesOrder);
assert.deepEqual(books.map(b=>b.slug),script.books.map(b=>b.slug),'Six-book series order');
let chapters=0,captions=0;
for(const book of script.books){
  const response=await fetch(`${base}/generated/${book.slug}/manifest.json`);
  assert.equal(response.status,200);
  const manifest=await response.json();
  assert.deepEqual(manifest,JSON.parse(fs.readFileSync(path.join(dir,`../../public/generated/${book.slug}/manifest.json`))),'Published manifest matches release');
  assert.equal(manifest.format,3);
  assert.deepEqual(manifest.chapters.map(c=>c.title),book.chapters.map(c=>c.title));
  for(const [i,c] of manifest.chapters.entries()){
    assert.equal(c.scene,`books/${book.slug}/chapter-${i+1}`);
    assert.equal(c.cues.length,book.chapters[i].captions.length);
    assert.ok(c.audio&&c.duration>0);
    const audio=await fetch(`${base}/generated/${book.slug}/${c.audio}`);
    assert.equal(audio.status,200,`${book.slug}/${c.audio}`);
    // Cloudflare may omit Content-Length; verify the actual asset bytes instead.
    const bytes=Buffer.from(await audio.arrayBuffer());
    assert.ok(bytes.length>1000);
    const expected=fs.readFileSync(path.join(dir,`../../public/generated/${book.slug}/${c.audio}`));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),createHash('sha256').update(expected).digest('hex'),'Recording matches release');
    captions+=c.cues.length;chapters++;
  }
  const blog=await fetch(`${base}/generated/${book.slug}/blog.md`);
  assert.equal(blog.status,200);
}
assert.equal(chapters,19);assert.equal(captions,150);
const browser=await chromium.launch({headless:true});
const errors=[];
try{
  const page=await browser.newPage({viewport:{width:1600,height:1000},serviceWorkers:'block'});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}/?bundle=next-useful-action`);
  await page.waitForFunction(()=>document.querySelectorAll('.bp-side .bp-side-group').length===6);
  assert.deepEqual(await page.locator('.bp-side .bp-side-cover-title').allTextContents(),script.books.map(b=>b.title));
  assert.equal(await page.locator('.bp-side .bp-side-item').count(),19);
  for(const b of script.books.slice(3)){
    await page.locator('.bp-side .bp-side-item').filter({has:page.getByText(b.chapters[0].title,{exact:true})}).click();
    await page.waitForURL(u=>u.searchParams.get('bundle')===b.slug);
    await page.locator('.bp-stage > svg').waitFor();
    assert.equal((await page.locator('.bp-side-item.active .bp-side-ctitle').innerText()).trim(),b.chapters[0].title);
    assert.equal(await page.locator('.bp-player audio').count(),1);
  }
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto(`${base}/?series=${encodeURIComponent(script.series)}`);
  await mobile.getByRole('button',{name:'Open Tab Into the Future',exact:true}).waitFor();
  assert.equal(await mobile.locator('.libm-card').count(),6);
  await mobile.getByRole('button',{name:'Open Tab Into the Future',exact:true}).click();
  await mobile.locator('.bp-stage > svg').waitFor();
  assert.ok(await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile horizontal overflow');
  assert.equal(errors.length,0,errors.join('\n'));
  const result={base,checkedAt:new Date().toISOString(),books:6,chapters,captions,recordedAssets:'all 19 available',desktopSeriesOrder:'passed',crossBookSidebar:'passed',mobileShelfAndReader:'passed',pageErrors:errors};
  fs.mkdirSync(path.join(dir,'evidence'),{recursive:true});
  fs.writeFileSync(path.join(dir,'evidence',base.startsWith('https:')?'live-series-check.json':'series-check.json'),JSON.stringify(result,null,2)+'\n');
  console.log(result);
}finally{await browser.close();}
