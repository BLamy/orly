// Keep compact provider provenance; never copy auth/session material or raw tool logs.
import fs from 'node:fs';
import path from 'node:path';
const dir=path.dirname(new URL(import.meta.url).pathname);
const [orderArg,file]=process.argv.slice(2);
const order=Number(orderArg);
if(!order||!file) throw new Error('Pass book order and private result JSON/JSONL path');
const raw=fs.readFileSync(file,'utf8').trim();
let messages;
try{messages=[JSON.parse(raw)];}catch{messages=raw.split('\n').filter(Boolean).map(l=>JSON.parse(l));}
const result=messages.findLast(m=>m.type==='result')||messages.at(-1);
const fable=result.modelUsage?.['claude-fable-5-1'];
if(!fable) throw new Error('Provider did not report required Fable model usage');
const assistantModels=[...new Set(messages.filter(m=>m.type==='assistant' && !(m.message?.model==='<synthetic>' && m.error==='rate_limit')).map(m=>m.message?.model).filter(Boolean))];
if(assistantModels.some(m=>m!=='claude-fable-5-1')) throw new Error('Unexpected assistant model; inspect before accepting authorship');
const entry={book:order,entrypoint:'npx --yes @anthropic-ai/claude-code@latest',cliVersion:messages.find(m=>m.subtype==='init')?.claude_code_version||'2.1.274',requestedModel:'claude-fable-5-1',actualModel:fable.canonicalModel,provider:fable.provider,result:result.subtype,isError:result.is_error||false,permissionDenials:result.permission_denials?.length||0,durationMs:result.duration_ms,inputTokens:fable.inputTokens,outputTokens:fable.outputTokens,costUsd:result.total_cost_usd,verification:'pending parent review'};
fs.writeFileSync(path.join(dir,`book-${order}-worker.json`),JSON.stringify(entry,null,2)+'\n');
console.log(JSON.stringify(entry));
if(entry.isError) process.exitCode=1;
