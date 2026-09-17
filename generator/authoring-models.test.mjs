import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {load} from 'js-yaml';
import {command,verifyResult} from './run-fable.mjs';
import {generateStoryboard} from './storyboard.mjs';
const policy=JSON.parse(readFileSync(new URL('./authoring-models.json',import.meta.url),'utf8'));
test('D3 authoring uses the latest package and exact requested provider model',()=>{
 const {file,args}=command();assert.equal(file,'npx');assert.equal(args[1],'@anthropic-ai/claude-code@latest');assert.equal(args[args.indexOf('--model')+1],policy.animation2d);
 assert.throws(()=>command(0));assert.throws(()=>command(NaN));assert.throws(()=>command(401));
});
test('provider rejection cannot masquerade as successful authoring',()=>{
 assert.throws(()=>verifyResult(JSON.stringify({subtype:'success',is_error:true,result:'session limit'})),/failed/);
 assert.throws(()=>verifyResult(JSON.stringify({subtype:'error_max_turns',modelUsage:{'claude-fable-5-1':{}}})),/failed/);
 assert.throws(()=>verifyResult(JSON.stringify({subtype:'success',modelUsage:{'claude-opus-4-8':{}}})),/provenance/);
 assert.throws(()=>verifyResult(JSON.stringify({modelUsage:{'claude-fable-5-1':{},'claude-opus-4-8':{}}})),/Unexpected/);
 assert.equal(verifyResult(JSON.stringify({subtype:'success',is_error:false,modelUsage:{'claude-fable-5-1':{},'claude-haiku-4-5':{}}})).is_error,false);
});
test('legacy automatic Anthropic planning fails before any provider call',async()=>{
 await assert.rejects(generateStoryboard({}),/Astra/);
});
for(const name of ['new-book','comment-edit','arxiv-weekly'])test(`${name}: Astra planning and explicit authoring stage`,()=>{
 const workflow=load(readFileSync(`.github/workflows/${name}.yml`,'utf8'));
 const steps=Object.values(workflow.jobs).flatMap(j=>j.steps??[]);
 const planning=steps.filter(s=>s.uses==='openai/codex-action@v1');assert.equal(planning.length,1);assert.equal(planning[0].with.model,policy.planning);
 assert.ok(!steps.some(s=>s.uses?.startsWith('anthropics/')));
 if(name!=='arxiv-weekly'){
  const author=steps.find(s=>s.run?.includes('generator/run-fable.mjs'));assert.ok(author);assert.ok(steps.indexOf(author)>steps.indexOf(planning[0]));
 }
});
