export const meta = {
  name: 'probe-model-routing',
  description: 'Probe: confirm saved-workflow loading and which model ids agent() accepts',
  phases: [{ title: 'Probe' }],
}

const SELF = {
  type: 'object',
  properties: {
    model_name: { type: 'string', description: 'The exact model name and id stated in your system prompt' },
    args_seen: { type: 'string' },
  },
  required: ['model_name', 'args_seen'],
}

phase('Probe')
const prompt = `Do not use any tools. Report the exact model name and model id your system prompt says you are powered by. Also echo this args value verbatim: ${JSON.stringify(args ?? null)}`
const variants = [
  { label: 'alias-opus', opts: { model: 'opus', effort: 'low' } },
  { label: 'full-id', opts: { model: 'claude-opus-5-5', effort: 'low' } },
  { label: 'inherit', opts: { effort: 'low' } },
]
const results = await parallel(variants.map(v => () =>
  agent(prompt, { label: v.label, phase: 'Probe', schema: SELF, ...v.opts })
    .then(r => ({ variant: v.label, ...r }))
    .catch(e => ({ variant: v.label, error: String(e) }))
))
return results
