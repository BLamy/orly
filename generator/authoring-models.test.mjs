import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {load} from 'js-yaml';
import {command,verifyResult} from './run-claude.mjs';
import {generateStoryboard} from './storyboard.mjs';
const policy=JSON.parse(readFileSync(new URL('./authoring-models.json',import.meta.url),'utf8'));
test('persistent routing uses Sol and Opus without fallback',()=>{
 assert.equal(policy.planning,'gpt-6.1-sol');
 assert.equal(policy.modeling3d,'gpt-6.1-sol');
 assert.equal(policy.animation2d,'claude-opus-5-5');
 assert.equal(policy.fallback,null);
});
test('D3 authoring uses the latest package and exact requested provider model',()=>{
 const {file,args}=command();assert.equal(file,'npx');assert.equal(args[1],'@anthropic-ai/claude-code@latest');assert.equal(args[args.indexOf('--model')+1],policy.animation2d);
 assert.throws(()=>command(0));assert.throws(()=>command(NaN));assert.throws(()=>command(401));
});
test('provider rejection cannot masquerade as successful authoring',()=>{
 assert.throws(()=>verifyResult(JSON.stringify({subtype:'success',is_error:true,result:'session limit'})),/failed/);
 assert.throws(()=>verifyResult(JSON.stringify({subtype:'error_max_turns',modelUsage:{'claude-opus-5-5':{}}})),/failed/);
 for(const olderModel of ['claude-fable-5-1','claude-opus-4-8']){
  assert.throws(()=>verifyResult(JSON.stringify({subtype:'success',modelUsage:{[olderModel]:{}}})),/provenance/);
  assert.throws(()=>verifyResult(JSON.stringify({subtype:'success',modelUsage:{[policy.animation2d]:{},[olderModel]:{}}})),/Unexpected/);
 }
 assert.throws(()=>verifyResult(JSON.stringify({modelUsage:{'claude-opus-5-5':{},'claude-opus-4-8':{}}})),/Unexpected/);
 assert.equal(verifyResult(JSON.stringify({subtype:'success',is_error:false,modelUsage:{'claude-opus-5-5':{},'claude-haiku-4-5':{}}})).is_error,false);
});
test('legacy automatic Anthropic planning fails before any provider call',async()=>{
 await assert.rejects(generateStoryboard({}),/Sol/);
});
for(const name of ['new-book','comment-edit','arxiv-weekly'])test(`${name}: Sol planning and explicit authoring stage`,()=>{
 const workflow=load(readFileSync(`.github/workflows/${name}.yml`,'utf8'));
 const steps=Object.values(workflow.jobs).flatMap(j=>j.steps??[]);
 const planning=steps.filter(s=>s.uses==='openai/codex-action@v1');assert.equal(planning.length,1);assert.equal(planning[0].with.model,policy.planning);
 assert.ok(!steps.some(s=>s.uses?.startsWith('anthropics/')));
 if(name!=='arxiv-weekly'){
  const author=steps.find(s=>s.run?.includes('generator/run-claude.mjs'));assert.ok(author);assert.ok(steps.indexOf(author)>steps.indexOf(planning[0]));
 }
});
