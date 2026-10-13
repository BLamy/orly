#!/usr/bin/env node
// run-opus.mjs — the ONE launcher for every headless local/CI authoring run: planning,
// research, story/narration, D3/SVG, Canvas, Three.js, Blender Python, Strudel music,
// pipeline code and review. Exactly one model (generator/authoring-models.json →
// claude-opus-5-5) at a fixed effort (high), through the latest Claude Code CLI. No
// fallback model, no shell interpolation, strict provider provenance.
//
//   node generator/run-opus.mjs --role <role> --prompt-file assignment.md \
//     --output .orly-work/<unit>-result.jsonl [--provenance <unit>-provenance.json] \
//     [--max-turns 400] [--dry-run]
//
// Exports (tested in run-opus.test.mjs / authoring-models.test.mjs):
//   ROLES, command({role,maxTurns}), childEnv(env), parseMessages(raw),
//   verifyResult(raw) → result message (throws on failure/limit/foreign model),
//   provenance(raw,{role}) → compact public record (requested+actual model, effort, cost).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const policy = JSON.parse(readFileSync(new URL('./authoring-models.json', import.meta.url), 'utf8'));
export const ROLES = Object.keys(policy.roles);

export function command({ role = 'animation2d', maxTurns = 400 } = {}) {
  if (!ROLES.includes(role)) throw new Error(`Unknown role "${role}". Roles: ${ROLES.join(', ')}`);
  if (!Number.isInteger(maxTurns) || maxTurns < 1 || maxTurns > 400) throw new Error('max-turns must be 1–400');
  const model = policy.roles[role];
  if (model !== policy.author) throw new Error(`Role ${role} must use ${policy.author}`);
  const tools = [...policy.tools, ...(policy.webTools.roles.includes(role) ? policy.webTools.tools : [])];
  return {
    file: 'npx',
    args: ['--yes', policy.claudePackage, '--print', '--verbose', '--model', model,
      '--effort', policy.effort, '--output-format', 'stream-json', '--max-turns', String(maxTurns),
      '--allowedTools', tools.join(',')],
  };
}

// Child env: every model alias (and the subagent default) resolves to the author, and a
// stray ANTHROPIC_API_KEY (e.g. from a loadEnvFile('.env')) never silently switches the
// auth/billing path away from the signed-in CLI. Opt in with ORLY_ALLOW_API_KEY=1.
export function childEnv(env = process.env) {
  const out = { ...env };
  for (const k of policy.pinnedAliasEnv) out[k] = policy.author;
  if (!env.ORLY_ALLOW_API_KEY) delete out.ANTHROPIC_API_KEY;
  return out;
}

export function parseMessages(raw) {
  const text = raw.trim();
  try { return [JSON.parse(text)]; } catch { return text.split('\n').filter(Boolean).map(l => JSON.parse(l)); }
}

const lastResult = messages => messages.findLast(m => m.type === 'result') ?? messages.at(-1);

// Success is read from the provider result, never from the exit code. Any model other
// than the author (a Haiku subagent, Fable, Astra, an Opus fallback) fails the run.
export function verifyResult(raw) {
  const messages = parseMessages(raw);
  const result = lastResult(messages);
  if (!result || result.is_error || result.subtype?.startsWith('error')) {
    throw new Error('Authoring failed or hit a provider limit; inspect the private result file.');
  }
  const models = Object.keys(result.modelUsage ?? {});
  if (!models.includes(policy.author)) throw new Error('Opus 5.5 provider provenance is missing.');
  const extra = models.filter(m => m !== policy.author && !policy.allowedAuxiliaryModels.includes(m));
  if (extra.length) throw new Error(`Unexpected model(s) in provider result: ${extra.join(', ')}`);
  const assistant = [...new Set(messages
    .filter(m => m.type === 'assistant' && !(m.message?.model === '<synthetic>' && m.error === 'rate_limit'))
    .map(m => m.message?.model).filter(Boolean))];
  if (assistant.some(m => m !== policy.author)) throw new Error(`Unexpected assistant model: ${assistant.join(', ')}`);
  return result;
}

// The CLI does not echo effort in the result, so the requested effort is recorded from
// argv and corroborated by init.per_turn_effort_active.
export function provenance(raw, { role, requestedEffort = policy.effort } = {}) {
  const messages = parseMessages(raw);
  const result = lastResult(messages) ?? {};
  const init = messages.find(m => m.type === 'system' && m.subtype === 'init') ?? {};
  const usage = result.modelUsage?.[policy.author] ?? {};
  return {
    role, entrypoint: `npx --yes ${policy.claudePackage}`, cliVersion: init.claude_code_version ?? null,
    requestedModel: policy.author, actualModel: usage.canonicalModel ?? null, provider: usage.provider ?? null,
    requestedEffort, effortActive: init.per_turn_effort_active ?? null, apiKeySource: init.apiKeySource ?? null,
    models: Object.keys(result.modelUsage ?? {}), subagents: result.subagent_stats?.spawned ?? 0,
    result: result.subtype ?? null, isError: !!result.is_error, numTurns: result.num_turns ?? null,
    durationMs: result.duration_ms ?? null, inputTokens: usage.inputTokens ?? null,
    outputTokens: usage.outputTokens ?? null, thinkingTokens: usage.thinkingTokens ?? null,
    costUsd: result.total_cost_usd ?? null,
  };
}

const USAGE = 'Usage: run-opus.mjs --role <role> --prompt-file assignment.md --output private-result.jsonl [--provenance p.json] [--max-turns 400] [--dry-run]';

async function main() {
  const args = process.argv.slice(2);
  const value = k => args[args.indexOf(k) + 1];
  if (!args.includes('--prompt-file') || !args.includes('--output')) throw new Error(USAGE);
  const role = args.includes('--role') ? value('--role') : 'animation2d';
  const cmd = command({ role, maxTurns: args.includes('--max-turns') ? Number(value('--max-turns')) : 400 });
  const prompt = readFileSync(resolve(value('--prompt-file')), 'utf8');
  if (args.includes('--dry-run')) { console.log(JSON.stringify({ ...cmd, role, promptBytes: Buffer.byteLength(prompt) })); return; }
  const output = resolve(value('--output'));
  mkdirSync(dirname(output), { recursive: true });
  const child = spawn(cmd.file, cmd.args, { stdio: ['pipe', 'pipe', 'pipe'], env: childEnv() });
  const chunks = [], errors = [];
  child.stdout.on('data', d => chunks.push(d));
  child.stderr.on('data', d => errors.push(d));
  child.stdin.on('error', () => {});
  child.stdin.end(prompt);
  const code = await new Promise((res, rej) => { child.on('error', rej); child.on('close', res); });
  const raw = Buffer.concat(chunks).toString();
  writeFileSync(output, raw, { mode: 0o600 });
  if (errors.length) writeFileSync(output + '.stderr', Buffer.concat(errors), { mode: 0o600 });
  // Record provenance even for a failed run (limit, max turns) so the ledger shows it.
  if (args.includes('--provenance') && raw.trim()) {
    const file = resolve(value('--provenance'));
    mkdirSync(dirname(file), { recursive: true });
    try { writeFileSync(file, JSON.stringify(provenance(raw, { role }), null, 2) + '\n'); } catch { /* unparsable output */ }
  }
  if (code !== 0) throw new Error(`Latest Claude CLI exited ${code}; inspect ${output}`);
  verifyResult(raw);
  console.log(`Opus 5.5 (${role}, effort ${policy.effort}) completed; private result: ${output}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(e => { console.error(e.message); process.exitCode = 1; });
}
