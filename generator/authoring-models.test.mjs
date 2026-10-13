// Repository routing policy: every planning/authoring path is Claude Opus 5.5 at high
// effort through generator/run-opus.mjs. Launcher internals are in run-opus.test.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { load } from 'js-yaml';
import { policy } from './run-opus.mjs';
import { generateStoryboard } from './storyboard.mjs';

const RETIRED = /gpt-6-astra|claude-fable|codex-action|run-fable/;

test('policy: one author, high effort, no fallback, no auxiliary models', () => {
  assert.equal(policy.author, 'claude-opus-5-5');
  assert.equal(policy.effort, 'high');
  assert.equal(policy.fallback, null);
  assert.deepEqual(policy.allowedAuxiliaryModels, []);
  assert.ok(Object.values(policy.roles).every(m => m === policy.author));
  assert.ok(!existsSync(new URL('./run-fable.mjs', import.meta.url)), 'run-fable.mjs is retired');
});

test('interactive sessions are pinned to Opus 5.5 at high effort', () => {
  const settings = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
  assert.equal(settings.model, policy.author);
  assert.equal(settings.effortLevel, policy.effort);
  for (const k of policy.pinnedAliasEnv) assert.equal(settings.env?.[k], policy.author, k);
});

test('legacy automatic planning fails before any provider call and points at run-opus', async () => {
  await assert.rejects(generateStoryboard({}), /Opus 5\.5.*run-opus/);
});

test('package scripts launch through run-opus.mjs', () => {
  const { scripts } = JSON.parse(readFileSync('package.json', 'utf8'));
  assert.equal(scripts.author, 'node generator/run-opus.mjs');
  assert.ok(!Object.values(scripts).some(s => RETIRED.test(s)));
});

const WORKFLOWS = { 'new-book': 'animation2d', 'comment-edit': 'animation2d', 'arxiv-weekly': null };
for (const [name, authorRole] of Object.entries(WORKFLOWS)) test(`${name}: Opus 5.5 planning then authoring via run-opus.mjs`, () => {
  const text = readFileSync(`.github/workflows/${name}.yml`, 'utf8');
  assert.doesNotMatch(text, RETIRED);
  const steps = Object.values(load(text).jobs).flatMap(j => j.steps ?? []);
  assert.ok(!steps.some(s => /^(openai|anthropics)\//.test(s.uses ?? '')), 'no third-party model actions');
  assert.ok(!steps.some(s => /claude-code(@|\s)/.test(s.run ?? '')), 'no raw CLI launches outside run-opus.mjs');
  const runs = steps.filter(s => s.run?.includes('generator/run-opus.mjs'));
  const role = s => s.run.match(/--role (\w+)/)?.[1];
  assert.ok(runs.length >= 1 && runs.every(s => policy.roles[role(s)] === policy.author));
  assert.ok(['planning', 'research'].includes(role(runs[0])), 'a planning/research session comes first');
  for (const s of runs) assert.equal(s.env?.CLAUDE_CODE_OAUTH_TOKEN, '${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}');
  if (authorRole) {
    const author = runs.find(s => role(s) === authorRole);
    assert.ok(author && steps.indexOf(author) > steps.indexOf(runs[0]));
  }
  // Untrusted comment text reaches the model only through a file, never the prompt/shell.
  for (const s of steps) if (s.run?.includes('github.event.comment.body')) assert.fail(`interpolated comment body in "${s.name}"`);
});
