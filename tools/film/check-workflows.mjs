#!/usr/bin/env node
// Parse-check every saved workflow (.claude/workflows/*.js). Workflow scripts use top-level
// await/return, so each body is wrapped in an async function before parsing. Exit 1 on any error.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.claude/workflows');
let bad = 0;
for (const f of readdirSync(DIR).filter((n) => n.endsWith('.js'))) {
  const src = readFileSync(path.join(DIR, f), 'utf8').replace(/^export\s+const\s+meta/m, 'const meta');
  // workflow scripts must be deterministic for resume: no wall clock (the runtime throws on Date.now()/new Date())
  const clock = src.split('\n').findIndex((l) => /\bnew Date\(|\bDate\.now\(/.test(l.replace(/\/\/.*$/, '')));
  if (clock >= 0) {
    bad++;
    console.log(`ERROR ${f}:${clock + 1}: Date.now()/new Date() are unavailable in workflow scripts (let an agent run \`date\` instead)`);
    continue;
  }
  try {
    new Function(`return (async () => {\n${src}\n})`);
    console.log(`ok    ${f}`);
  } catch (e) {
    bad++;
    console.log(`ERROR ${f}: ${e.message}`);
  }
}
process.exit(bad ? 1 : 0);
