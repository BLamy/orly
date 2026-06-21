// Generate a validated storyboard from a repo digest + subsystem prompt via the
// Anthropic API (forced to emit JSON through a tool), with a validate→repair loop.
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateStoryboard } from './validate.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SYSTEM = readFileSync(join(HERE, 'prompts', 'storyboard.txt'), 'utf8');
const RAW_SCHEMA = JSON.parse(readFileSync(join(HERE, 'storyboard.schema.json'), 'utf8'));

// Anthropic tool input_schema is a JSON-Schema subset; strip $schema and the
// conditional allOf (if/then), which our own validator enforces anyway.
function toolSchema() {
  const s = JSON.parse(JSON.stringify(RAW_SCHEMA));
  delete s.$schema;
  if (s.$defs?.step?.allOf) delete s.$defs.step.allOf;
  return s;
}

export async function generateStoryboard({
  digest,
  prompt,
  apiKey = process.env.ANTHROPIC_API_KEY,
  model = 'claude-opus-4-8',
  maxTokens = 16000,
  attempts = 3,
  log = () => {},
}) {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required to generate a storyboard');
  const client = new Anthropic({ apiKey });
  const tool = {
    name: 'emit_storyboard',
    description: 'Emit the multi-chapter storyboard as a single JSON object.',
    input_schema: toolSchema(),
  };
  const base = `SUBSYSTEM PROMPT:\n${prompt}\n\n${digest}`;
  let lastErr = '';
  for (let attempt = 0; attempt < attempts; attempt++) {
    log(`storyboard: model call (attempt ${attempt + 1}/${attempts})`);
    const resp = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: SYSTEM,
      tools: [tool],
      tool_choice: { type: 'tool', name: 'emit_storyboard' },
      messages: [
        {
          role: 'user',
          content: attempt === 0
            ? base
            : `${base}\n\n--- Your previous attempt FAILED validation with these errors:\n${lastErr}\n\nFix EVERY issue and emit a corrected storyboard.`,
        },
      ],
    });
    const block = resp.content.find((b) => b.type === 'tool_use');
    if (!block) { lastErr = 'model did not return the emit_storyboard tool call'; continue; }
    const sb = block.input;
    const { ok, errors, warnings } = validateStoryboard(sb); // mutates: auto-fixes layout
    for (const w of warnings) log(`  fix: ${w}`);
    if (ok) return sb;
    lastErr = errors.join('\n');
    log(`  ${errors.length} validation errors; retrying`);
  }
  throw new Error(`storyboard failed validation after ${attempts} attempts:\n${lastErr}`);
}
