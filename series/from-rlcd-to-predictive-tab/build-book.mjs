// Integrates one reviewed Fable book without generating or rewriting its script.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'../..');
const dir=path.join(root,'series/from-rlcd-to-predictive-tab');
const script=JSON.parse(fs.readFileSync(path.join(dir,'series-script.json')));
const order=Number(process.argv[2]);
const book=script.books.find(b=>b.order===order);
if(!book) throw new Error('Pass book order 1–6');
execFileSync(process.execPath,[path.join(dir,'verify-contract.mjs'),'--scenes','--slug',book.slug],{cwd:root,stdio:'inherit'});
try{process.loadEnvFile(path.join(root,'.env'));}catch{}
const args=['generator/video.mjs','--slug',book.slug,'--title',book.title,'--subtitle',book.subtitle,'--accent',book.accent,'--animal',book.animal,'--series',script.series,'--series-order',String(book.order),'--chapter-titles',book.chapters.map(c=>c.title).join('|'),'--blurbs',book.chapters.map(c=>c.takeaway).join('|'),'--no-cover'];
if(!process.env.ELEVENLABS_API_KEY) throw new Error('ElevenLabs narration is required before publishing this series. Configure ELEVENLABS_API_KEY in the gitignored .env; silent narration is not a release fallback.');
execFileSync(process.execPath,args,{cwd:root,stdio:'inherit'});
const manifest=JSON.parse(fs.readFileSync(path.join(root,`public/generated/${book.slug}/manifest.json`)));
const sections=JSON.parse(fs.readFileSync(path.join(dir,`book-${order}-blog-sections.json`)));
if(sections.length!==book.chapters.length) throw new Error('Blog chapter count mismatch');
const lines=[`# ${book.title}`, '', `${book.subtitle}. Book ${book.order} of *${script.series}*.`, '', 'This series explains a proposed product grounded in the project charter. Page examples and work diagrams are illustrative; they are not measured performance results.', '', 'Source note: the narration is pinned to the September 16, 2026 source snapshot. References to the imported native implementation describe that snapshot; subsequent foundation work may have advanced.', ''];
for(const [i,groups] of sections.entries()){
  const ch=manifest.chapters[i];
  for(const [j,section] of groups.entries()){
    const from=section.startCue===0?0:ch.cues[section.startCue];
    const to=section.endCue===undefined?ch.duration:ch.cues[section.endCue];
    if(!Number.isFinite(from)||!Number.isFinite(to)||from>=to) throw new Error('Invalid section interval');
    const id=section.id||`chapter-${ch.number}-${section.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`;
    lines.push(`### ${section.title}`, '', section.lead, '', `{% viz scene="${ch.scene}" section="${id}" cue="${section.startCue+1}" from="${from.toFixed(3)}" to="${to.toFixed(3)}" title="${section.title}" %}`, '{% endviz %}', '');
    if(section.takeaway) lines.push(section.takeaway,'');
  }
}
lines.push('The project charter and its dated scope decision distinguish the native Qwen reference, the current browser prototype, and the planned product. Source anchors and the fixed narration contract are retained with this series’s source files.', '', `[Open the complete book](?bundle=${book.slug})`, '');
fs.writeFileSync(path.join(root,`public/generated/${book.slug}/blog.md`),lines.join('\n'));
execFileSync(process.execPath,['generator/blog-viz.mjs','--slug',book.slug],{cwd:root,stdio:'inherit'});
