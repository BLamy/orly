// Launcher contract: one author (Opus 5.5, effort high), pinned aliases, strict provenance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { command, verifyResult, childEnv, provenance, ROLES, policy } from './run-opus.mjs';

const ok = models => JSON.stringify({ type: 'result', subtype: 'success', is_error: false,
  modelUsage: Object.fromEntries(models.map(m => [m, { canonicalModel: m }])) });
const fixture = name => readFileSync(new URL(`./fixtures/run-opus/${name}`, import.meta.url), 'utf8');

test('every authoring role is Opus 5.5 at high effort via the latest CLI', () => {
  assert.equal(policy.author, 'claude-opus-5-5');
  assert.equal(policy.effort, 'high');
  assert.equal(policy.fallback, null);
  assert.deepEqual(policy.allowedAuxiliaryModels, []);
  for (const role of ROLES) {
    assert.equal(policy.roles[role], 'claude-opus-5-5');
    const { file, args } = command({ role });
    assert.equal(file, 'npx');
    assert.equal(args[1], '@anthropic-ai/claude-code@latest');
    assert.equal(args[args.indexOf('--model') + 1], 'claude-opus-5-5');
    assert.equal(args[args.indexOf('--effort') + 1], 'high');
    assert.equal(args[args.indexOf('--output-format') + 1], 'stream-json');
    assert.ok(!args.includes('--fallback-model'));
  }
  assert.match(command({ role: 'research' }).args.at(-1), /WebFetch/);
  assert.doesNotMatch(command({ role: 'animation2d' }).args.at(-1), /WebFetch/);
  assert.throws(() => command({ maxTurns: 0 }));
  assert.throws(() => command({ maxTurns: 401 }));
  assert.throws(() => command({ maxTurns: NaN }));
  assert.throws(() => command({ role: 'nope' }), /Unknown role/);
});

test('no other model may author: subagents, haiku, fable, astra all fail', () => {
  assert.throws(() => verifyResult(ok(['claude-opus-5-5', 'claude-haiku-4-5-20251001'])), /Unexpected/);
  assert.throws(() => verifyResult(ok(['claude-fable-5-1'])), /provenance/);
  assert.throws(() => verifyResult(ok(['gpt-6-astra'])), /provenance/);
  assert.throws(() => verifyResult(JSON.stringify({ subtype: 'success', is_error: true, modelUsage: { 'claude-opus-5-5': {} } })), /failed/);
  assert.throws(() => verifyResult(JSON.stringify({ subtype: 'error_max_turns', modelUsage: { 'claude-opus-5-5': {} } })), /failed/);
  const foreignTurn = [JSON.stringify({ type: 'assistant', message: { model: 'claude-fable-5-1' } }), ok(['claude-opus-5-5'])].join('\n');
  assert.throws(() => verifyResult(foreignTurn), /Unexpected assistant model/);
  const limitTurn = [JSON.stringify({ type: 'assistant', error: 'rate_limit', message: { model: '<synthetic>' } }), ok(['claude-opus-5-5'])].join('\n');
  assert.equal(verifyResult(limitTurn).subtype, 'success');
  assert.equal(verifyResult(ok(['claude-opus-5-5'])).subtype, 'success');
});

test('child env pins every alias to Opus and drops a stray API key', () => {
  const env = childEnv({ ANTHROPIC_API_KEY: 'x', PATH: '/bin' });
  assert.equal(env.ANTHROPIC_API_KEY, undefined);
  assert.equal(env.PATH, '/bin');
  for (const k of policy.pinnedAliasEnv) assert.equal(env[k], 'claude-opus-5-5');
  assert.equal(childEnv({ ANTHROPIC_API_KEY: 'x', ORLY_ALLOW_API_KEY: '1' }).ANTHROPIC_API_KEY, 'x');
});

test('real CLI 2.1.289 probe output verifies and yields provenance', () => {
  const raw = fixture('opus-stream.jsonl');
  verifyResult(raw);
  const p = provenance(raw, { role: 'story' });
  assert.equal(p.actualModel, 'claude-opus-5-5');
  assert.equal(p.provider, 'firstParty');
  assert.equal(p.requestedEffort, 'high');
  assert.equal(p.effortActive, true);
  assert.equal(p.apiKeySource, 'none');
  assert.match(p.cliVersion, /^\d+\.\d+\.\d+$/);
  // Default headless run let a Haiku subagent contribute: must fail.
  assert.throws(() => verifyResult(fixture('sub-default.json')), /claude-haiku/);
  // Same run with pinned aliases: only Opus appears.
  assert.equal(provenance(fixture('sub-pinned.json'), { role: 'story' }).subagents, 1);
  verifyResult(fixture('sub-pinned.json'));
});
