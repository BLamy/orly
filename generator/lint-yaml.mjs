#!/usr/bin/env node
// Parse-validate YAML files and fail on any syntax error. Used by the pre-commit hook
// (passed the staged files) and by `npm run lint:yaml` (lints every tracked YAML file).
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { loadAll } from 'js-yaml';

const args = process.argv.slice(2);
const files = args.length
  ? args
  : execSync("git ls-files '*.yml' '*.yaml'", { encoding: 'utf8' }).split('\n').filter(Boolean);

let bad = 0;
for (const f of files) {
  try {
    loadAll(readFileSync(f, 'utf8')); // loadAll: handles multi-doc files too
  } catch (e) {
    bad++;
    console.error(`✗ ${f}\n  ${String(e.message).split('\n')[0]}`);
  }
}

if (bad) {
  console.error(`\n${bad} YAML file(s) failed to parse.`);
  process.exit(1);
}
console.log(`✓ ${files.length} YAML file(s) parsed clean`);
