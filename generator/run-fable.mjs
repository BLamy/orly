#!/usr/bin/env node
// One launcher for local/CI D3 authoring. Exact Opus primary model; quota failures hand off to the authorized Sol supervisor.
import { readFileSync, writeFileSync, mkdirSync, appendFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const policy=JSON.parse(readFileSync(new URL('./authoring-models.json',import.meta.url),'utf8'));
export function command(maxTurns=400) {
 if(!Number.isInteger(maxTurns)||maxTurns<1||maxTurns>400)throw new Error('max-turns must be 1–400');
 return {file:'npx',args:['--yes',policy.claudePackage,'--print','--model',policy.animation2d,'--output-format','json','--max-turns',String(maxTurns),'--allowedTools','Bash,Read,Edit,Write,Glob,Grep']};
}
export function isProviderLimit(raw) {
 try {
  const result=JSON.parse(raw);
  return result.is_error===true && /hit your (?:session|weekly|usage) limit|rate_limit_error|rate limit (?:exceeded|reached)|usage limit exceeded/i.test(String(result.result??'')+' '+JSON.stringify(result.error??''));
 } catch { return false; }
}
export function verifyResult(raw) {
 const result=JSON.parse(raw);
 if(result.is_error||result.subtype?.startsWith('error'))throw new Error('Animation authoring failed or hit a provider limit; inspect the private result file.');
 const models=Object.keys(result.modelUsage??{});
 if(!models.includes(policy.animation2d))throw new Error('Requested animation provider provenance is missing.');
 // Claude may account for auxiliary classification calls separately; never accept another primary author.
 if(models.some(m=>m!==policy.animation2d&&!m.includes('haiku')))throw new Error('Unexpected authoring model in provider result.');
 return result;
}
async function main() {
 const args=process.argv.slice(2);const value=k=>args[args.indexOf(k)+1];
 if(!args.includes('--prompt-file')||!args.includes('--output'))throw new Error('Usage: run-fable.mjs --prompt-file assignment.md --output private-result.json [--max-turns 400] [--dry-run]');
 const cmd=command(args.includes('--max-turns')?Number(value('--max-turns')):400);
 const prompt=readFileSync(resolve(value('--prompt-file')),'utf8');
 if(args.includes('--dry-run')){console.log(JSON.stringify({...cmd,promptBytes:Buffer.byteLength(prompt)}));return;}
 const output=resolve(value('--output'));mkdirSync(dirname(output),{recursive:true});
 const child=spawn(cmd.file,cmd.args,{stdio:['pipe','pipe','pipe'],env:process.env});
 const chunks=[];const errors=[];child.stdout.on('data',d=>chunks.push(d));child.stderr.on('data',d=>errors.push(d));child.stdin.on('error',()=>{});child.stdin.end(prompt);
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
 const raw=Buffer.concat(chunks).toString();writeFileSync(output,raw,{mode:0o600});
 if(errors.length)writeFileSync(output+'.stderr',Buffer.concat(errors),{mode:0o600});
 if(isProviderLimit(raw)) {
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,'provider_limit=true\n');
  throw Object.assign(new Error(`${policy.animation2d} reached its provider limit. Progress/result saved at ${output}; continue with ${policy.fallback}.`),{providerLimit:true});
 }
 if(code!==0)throw new Error(`Latest Claude CLI exited ${code}; inspect ${output}`);
 verifyResult(raw);console.log(`Opus 5.5 completed; private provenance: ${output}`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(e=>{console.error(e.message);process.exitCode=e.providerLimit?75:1;});
