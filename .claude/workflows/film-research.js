export const meta = {
  name: 'film-research',
  description: 'Research a film topic into a verified bible: plan, dossiers (draft-then-verify), adversarial fact-checks, synthesis, completeness loop',
  whenToUse: 'Stage 1 of the film pipeline (film-loop calls it). Requires films/<slug>/brief.md; writes films/<slug>/research/. Resumable: existing plan/dossiers are reused. Args: {slug, asOf, repo?, maxTopics?, maxGapRounds?, concurrency?}',
  phases: [
    { title: 'Scope', detail: 'research plan from the brief (reused if plan.json exists)' },
    { title: 'Dossiers', detail: 'per topic: draft from knowledge, verify with targeted searches, then an adversarial fact-check' },
    { title: 'Synthesis', detail: 'bible.md + claims.json + quotes.json' },
    { title: 'Completeness', detail: 'critic finds material gaps; fill and merge until dry' },
  ],
}

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------
const A = args || {}
if (!A.slug) throw new Error('film-research needs args.slug')
if (!A.asOf) throw new Error('film-research needs args.asOf (YYYY-MM-DD): the date the film\'s "current understanding" ends')
const REPO = A.repo || '/Users/blamy/Documents/Codex/orly-2'
const FILM = `${REPO}/films/${A.slug}`
const RES = `${FILM}/research`
const PROMO = A.look === 'promo'
const MAX_TOPICS = A.maxTopics || (PROMO ? 6 : 14)
const MAX_GAP_ROUNDS = A.maxGapRounds ?? 2
const CONCURRENCY = A.concurrency || 4
// Opus 5.5 at high effort writes everything that becomes story (project rule, CLAUDE.md).
const OPUS = { model: 'claude-opus-5-5', effort: 'high' }
const CHEAP = { model: 'claude-opus-5-5', effort: 'low' } // bookkeeping only: never code or story

const COMMON = `You are a researcher for an educational documentary film made by the orly-2 film pipeline.
Film directory: ${FILM}. The brief is ${FILM}/brief.md (read it first). The film's "current understanding" ends on ${A.asOf}; your training data may be older, so use web search for anything recent.
Standards (non-negotiable):
- Every claim carries at least one source URL. Prefer primary sources (original papers, archival newspapers, institutional histories, the person's own words) and reputable secondary sources. Blogs and social posts are leads, not sources.
- Quotations must be VERBATIM with exact source and context. Famous "quotes" are often paraphrases or misattributions; if you cannot find the original wording in a reliable source, label it "UNVERIFIED — do not use as a quote".
- Distinguish what people believed AT THE TIME from what we know now: who held a belief, who dissented, how long it held.
- Mark contested claims as contested, with both sides sourced.
- Load WebSearch/WebFetch via ToolSearch if they are deferred. Write files with the Write tool.
- Be economical: draft from your own knowledge first, then spend web calls on VERIFYING the specific claims, dates, numbers and quotes the film is likely to use (aim for 10-20 targeted searches/fetches, not a browsing tour).
- RESUMABLE: if your output file already exists (an interrupted earlier run), read it and continue from it rather than starting over.${PROMO ? `

THIS FILM IS A PRODUCT PROMO (look "promo"), NOT A HISTORY DOCUMENTARY. This overrides the history framing elsewhere in these instructions:
- Research the PRODUCT named in brief.md. Primary sources, in this order: ${FILM}/research/sources/ (the vendor's docs saved as text, llms.txt, openapi.json, and account-digest.json = redacted facts from the requester's OWN account: counts, settings, environment schedules, the featured bug reports), ${FILM}/capture/clean/*.json marks (what the screen recordings show), the existing book about the product if one exists (${REPO}/public/generated/<product-slug>/manifest.json), then the vendor's public site and docs on the web. A local file path (repo-relative) is a valid source ref.
- Topics are capabilities and proof points, not eras: plan at most ${MAX_TOPICS}. Set "era" to "product, as of ${A.asOf}". People, beliefs-of-the-age and dissent do not apply; quotes.json may be empty (on-screen product copy is quoted from the recordings, not from people).
- Numbers are sacred: every count, duration and threshold the film may show (e.g. a bug's request count, a commit's milliseconds, the account's totals) is copied exactly from its source with the source ref.
- NEVER copy credentials, tokens, login variables or e-mail addresses into any research file. The raw API dumps in capture/api/ are off limits: use account-digest.json.` : ''}`

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const PLAN = {
  type: 'object',
  properties: {
    working_title: { type: 'string' },
    audience: { type: 'string' },
    central_questions: { type: 'array', items: { type: 'string' } },
    topics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'kebab-case, unique' },
          title: { type: 'string' },
          era: { type: 'string' },
          questions: { type: 'array', items: { type: 'string' } },
          must_cover: { type: 'array', items: { type: 'string' } },
          deep_dive: { type: 'boolean' },
        },
        required: ['id', 'title', 'era', 'questions', 'must_cover', 'deep_dive'],
      },
    },
  },
  required: ['working_title', 'audience', 'central_questions', 'topics'],
}

const DOSSIER = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    path: { type: 'string' },
    claim_count: { type: 'number' },
    quote_count: { type: 'number' },
    key_claims: {
      type: 'array',
      items: {
        type: 'object',
        properties: { claim: { type: 'string' }, date: { type: 'string' }, sources: { type: 'array', items: { type: 'string' } } },
        required: ['claim', 'sources'],
      },
    },
    curiosity_hooks: { type: 'array', items: { type: 'string' } },
  },
  required: ['id', 'path', 'claim_count', 'quote_count', 'key_claims', 'curiosity_hooks'],
}

const FACTCHECK = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    checked: { type: 'number' },
    confirmed: { type: 'number' },
    corrected: { type: 'number' },
    unverifiable: { type: 'number' },
    corrections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          original: { type: 'string' },
          verdict: { type: 'string', enum: ['corrected', 'unverifiable', 'contested'] },
          fix: { type: 'string' },
          sources: { type: 'array', items: { type: 'string' } },
        },
        required: ['original', 'verdict', 'fix'],
      },
    },
  },
  required: ['id', 'checked', 'confirmed', 'corrected', 'unverifiable', 'corrections'],
}

const GAPS = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['complete', 'gaps'] },
    gaps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          era: { type: 'string' },
          why_material: { type: 'string' },
          questions: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'title', 'era', 'why_material', 'questions'],
      },
    },
  },
  required: ['verdict', 'gaps'],
}

// ---------------------------------------------------------------------------
// Stage prompts
// ---------------------------------------------------------------------------
function dossierPrompt(t) {
  return `${COMMON}

YOUR TOPIC: "${t.title}" (id: ${t.id}, era: ${t.era})${t.deep_dive ? `
TECHNICAL DEEP DIVE: the brief demands real mechanics. Explain the architecture or algorithm precisely, with numbers (sizes, parameter counts, datasets, error rates, compute, hardware, training time), what was new versus prior work, why it worked, and the intuition a curious teenager could follow.` : ''}
Questions to answer:
${t.questions.map(q => `- ${q}`).join('\n')}
Must cover:
${t.must_cover.map(q => `- ${q}`).join('\n')}

Write the dossier to ${RES}/dossiers/${t.id}.md with these sections:
1. Summary. 2. Timeline (dated events, each with source URLs). 3. People (role, institution and city, what they believed, how they are usually pictured: build, hair, glasses, era clothing, for respectful silhouette depiction). 4. The belief of the age (what the field believed, who held it, who dissented, how long it lasted, what ended it). 5. Experiments and results (setups, machines, datasets, numbers; describe physical apparatus vividly and accurately for the art department). 6. Verified quotes (verbatim, speaker, date, exact source URL, context; untraceable ones marked UNVERIFIED). 7. Debates and controversies (both sides, sourced). 8. Misconceptions to avoid. 9. Curiosity hooks (5-10 surprising, true, sourced details). 10. Visual and dramatic details (settings, rooms, weather, objects, period details). 11. Sources (numbered list of every URL).
Return the structured summary (key_claims = the 8-20 claims the film is most likely to state).`
}

function factcheckPrompt(t, d) {
  return `${COMMON}

You are an ADVERSARIAL FACT-CHECKER. Find errors; do not agree by default. When no reliable source confirms a claim, it is "unverifiable".
Dossier: ${d.path} (topic "${t.title}", id ${t.id}). Read it fully. Independently verify with your own searches (open the sources; do not trust the dossier's citations blindly):
- every date, number, name spelling, institution and attribution in Timeline, Experiments and Verified quotes;
- every quote's original wording (a paraphrase presented as a quote is an error);
- the "belief of the age" claims (who believed what, for how long);
- in particular these key claims:
${d.key_claims.map((c, i) => `  ${i + 1}. ${c.claim}${c.date ? ` (${c.date})` : ''}`).join('\n')}
Then EDIT the dossier in place: fix errors, demote untraceable quotes to "UNVERIFIED — do not use as a quote", mark contested claims, and append a "Fact-check log" section listing each change with sources. Write ${RES}/factcheck/${t.id}.json ({"id","checked","confirmed","corrected","unverifiable","corrections":[...]}). If that file already exists from an interrupted run, finish the remaining checks. Return the verdict summary.`
}

const INVENTORY = {
  type: 'object',
  properties: {
    verified: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, checked: { type: 'number' }, corrected: { type: 'number' }, unverifiable: { type: 'number' } },
        required: ['id', 'checked', 'corrected', 'unverifiable'],
      },
    },
  },
  required: ['verified'],
}

// Topics already verified on disk are reused, never re-run: the files are the source of truth
// (a run's resume cache can miss when an earlier attempt died mid-batch).
let VERIFIED = new Map()
async function inventory(ids, phaseName) {
  const inv = await agent(`Bookkeeping only; write nothing. For each topic id below, check ${RES}/dossiers/<id>.md and ${RES}/factcheck/<id>.json. A topic is VERIFIED when the dossier exists and contains a "Fact-check log" heading AND the factcheck JSON parses. For each verified topic report id plus checked/corrected/unverifiable from its JSON (0 if absent). Use one shell command (e.g. node -e) rather than reading the dossiers.
Ids: ${ids.join(', ')}`, { label: `inventory:${phaseName}`, phase: phaseName, schema: INVENTORY, ...CHEAP })
  return new Map((inv?.verified || []).filter(v => ids.includes(v.id)).map(v => [v.id, v]))
}

const runTopic = (t, phaseName) => VERIFIED.has(t.id)
  ? Promise.resolve({ topic: t, reused: true, dossier: null, factcheck: VERIFIED.get(t.id) })
  : pipeline(
  [t],
  topic => agent(dossierPrompt(topic), { label: `dossier:${topic.id}`, phase: phaseName, schema: DOSSIER, ...OPUS }),
  (d, topic) => agent(factcheckPrompt(topic, d), { label: `factcheck:${topic.id}`, phase: phaseName, schema: FACTCHECK, ...OPUS })
    .then(fc => ({ topic, dossier: d, factcheck: fc })),
).then(r => r[0])

// Run topics in batches so a provider limit never takes every in-flight agent down at once.
async function runBatched(items, phaseName) {
  const out = []
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = items.slice(i, i + CONCURRENCY)
    const got = await parallel(batch.map(t => () => runTopic(t, phaseName)))
    out.push(...got.filter(Boolean))
    log(`${phaseName}: ${Math.min(i + CONCURRENCY, items.length)}/${items.length} topics processed`)
  }
  return out
}

// ---------------------------------------------------------------------------
// 1. Scope (reuses plan.json when present)
// ---------------------------------------------------------------------------
phase('Scope')
const plan = await agent(`${COMMON}

If ${RES}/plan.json exists, read it and return it unchanged (do not redo the plan).
Otherwise: read ${FILM}/brief.md and design the research plan: at most ${MAX_TOPICS} topics, chronological, together covering everything the brief demands (every era's belief of the age, its dissenters and how long it held, the key experiments, and the technical deep dives the brief names). Topics must not overlap heavily; each must be researchable in one sitting. Put people, institutions and debates in must_cover. End the history at ${A.asOf}. Write ${RES}/plan.json (same shape as your structured output) and return it.`, { label: 'scope', phase: 'Scope', schema: PLAN, ...OPUS })
if (!plan || !plan.topics?.length) throw new Error('scope agent returned no topics')
const topics = plan.topics.slice(0, MAX_TOPICS)
if (plan.topics.length > MAX_TOPICS) log(`plan proposed ${plan.topics.length} topics; capped at ${MAX_TOPICS}: dropped ${plan.topics.slice(MAX_TOPICS).map(t => t.id).join(', ')}`)
log(`researching ${topics.length} topics (batches of ${CONCURRENCY}): ${topics.map(t => t.id).join(', ')}`)

// ---------------------------------------------------------------------------
// 2. Dossiers -> fact-check
// ---------------------------------------------------------------------------
phase('Dossiers')
// Skip topics already finished on disk (dossier + fact-check verdict). Replay caching is order-sensitive
// under parallel batches, so files, not the cache, are the source of truth for resumption.
const inv = await agent(`List which of these topic ids already have BOTH ${RES}/dossiers/<id>.md (containing a "Fact-check log" section) AND ${RES}/factcheck/<id>.json (valid JSON). Use one shell command; do not edit anything. Ids: ${topics.map(t => t.id).join(', ')}`,
  { label: 'inventory', phase: 'Dossiers', schema: { type: 'object', properties: { finished: { type: 'array', items: { type: 'string' } } }, required: ['finished'] }, ...OPUS })
const finished = new Set((inv?.finished || []).filter(id => topics.some(t => t.id === id)))
if (finished.size) log(`reusing ${finished.size} finished dossiers: ${[...finished].join(', ')}`)
const reused = topics.filter(t => finished.has(t.id)).map(t => ({ topic: t, dossier: { claim_count: 0, quote_count: 0 }, factcheck: {}, reused: true }))
const done = [...reused, ...await runBatched(topics.filter(t => !finished.has(t.id)), 'Dossiers')]
const failed = topics.filter(t => !done.some(d => d.topic.id === t.id)).map(t => t.id)
if (failed.length) log(`WARNING: no verified dossier for: ${failed.join(', ')} (re-run film-research to resume them)`)
const tally = done.reduce((a, d) => ({
  checked: a.checked + (d.factcheck?.checked || 0),
  corrected: a.corrected + (d.factcheck?.corrected || 0),
  unverifiable: a.unverifiable + (d.factcheck?.unverifiable || 0),
}), { checked: 0, corrected: 0, unverifiable: 0 })
log(`fact-check: ${tally.checked} claims checked, ${tally.corrected} corrected, ${tally.unverifiable} unverifiable`)
if (failed.length > topics.length / 3) {
  return { slug: A.slug, status: 'incomplete', failed, note: 'Too many dossiers failed (provider limit?). Re-run film-research with the same args to resume; finished dossiers are reused.' }
}

// ---------------------------------------------------------------------------
// 3. Synthesis (needs every dossier: a genuine barrier)
// ---------------------------------------------------------------------------
phase('Synthesis')
const synthPrompt = (extra = '') => `${COMMON}

You are the research editor. Read ${FILM}/brief.md, ${RES}/plan.json, every dossier in ${RES}/dossiers/ and every verdict in ${RES}/factcheck/. Only fact-checked content may enter the bible; never resurrect a claim a fact-checker corrected or marked unverifiable.
Write:
1. ${RES}/bible.md, the screenwriter's single source of truth: master chronology (one dated line per event with a source ref); eras (belief of the age, who held it, who dissented, how long it lasted, what ended it); people index (role, institutions, appearance notes for silhouette depiction); experiments and machines (with physical descriptions for the art department); technical primers for every deep dive (precise mechanics, numbers, and intuition); verified quotes (verbatim plus source; exclude unverified); debates as fair two-sided summaries; the 25-40 best curiosity hooks, ranked; sensitive-topic guidance (contested claims, geopolitics, living people, and even-handed treatment of every lab including the one this film is made with); and where things stand as of ${A.asOf}.
2. ${RES}/claims.json: [{"id","claim","date","era","sources":[...],"status":"confirmed|contested"}] for every claim in the bible.
3. ${RES}/quotes.json: [{"id","text","speaker","date","source","context"}], verified quotes only.
${extra}
Return a one-paragraph summary with the counts of claims and quotes.`
await agent(synthPrompt(), { label: 'synthesize-bible', phase: 'Synthesis', ...OPUS })

// ---------------------------------------------------------------------------
// 4. Completeness loop (critic -> fill gaps -> merge), until dry
// ---------------------------------------------------------------------------
phase('Completeness')
const seen = new Set(topics.map(t => t.id))
const filled = []
for (let round = 1; round <= MAX_GAP_ROUNDS; round++) {
  const critic = await agent(`${COMMON}

You are a completeness critic. Read ${FILM}/brief.md and ${RES}/bible.md. Identify MATERIAL gaps only: things the brief explicitly demands, glaring omissions a historian of the field would flag, or depth the technical deep dives still lack. Already researched topic ids (do not repeat): ${[...seen].join(', ')}.
Return verdict "complete" with an empty list, or "gaps" with at most 4 new topics.`, { label: `critic:round-${round}`, phase: 'Completeness', schema: GAPS, ...OPUS })
  const fresh = (critic?.gaps || []).filter(g => !seen.has(g.id))
  if (!critic || critic.verdict === 'complete' || !fresh.length) {
    log(`completeness round ${round}: no material gaps`)
    break
  }
  fresh.forEach(g => seen.add(g.id))
  log(`completeness round ${round}: filling ${fresh.map(g => g.id).join(', ')}`)
  const gapTopics = fresh.map(g => ({ id: g.id, title: g.title, era: g.era, questions: g.questions, must_cover: [g.why_material], deep_dive: false }))
  VERIFIED = await inventory(gapTopics.map(t => t.id), 'Completeness')
  const gapDone = await runBatched(gapTopics, 'Completeness')
  filled.push(...gapDone.map(d => d.topic.id))
  await agent(synthPrompt(`This is a MERGE pass: bible.md already exists. Integrate the new dossiers (${gapDone.map(d => d.topic.id).join(', ')}) into bible.md, claims.json and quotes.json without dropping existing verified material.`), { label: `merge:round-${round}`, phase: 'Completeness', ...OPUS })
}

return {
  slug: A.slug,
  status: failed.length ? 'partial' : 'done',
  bible: `${RES}/bible.md`,
  topics: done.map(d => ({ id: d.topic.id, reused: !!d.reused, claims: d.dossier?.claim_count, quotes: d.dossier?.quote_count, corrected: d.factcheck?.corrected, unverifiable: d.factcheck?.unverifiable })),
  gap_topics: filled,
  failed,
  factcheck: tally,
}
