export const meta = {
  name: 'film-loop',
  description: 'Produce a film end to end (research → story → narration → score + shots → assemble) and loop review → routed fixes until the excellence gate passes',
  whenToUse: 'The production loop. One film: /film-loop {"slug":"<slug>"} (needs films/<slug>/brief.md). Queue mode: /film-loop {"queue":true} takes the next film from films/queue.json; run it under /loop to keep producing films. Resumable: every stage skips finished work. Args: {slug?, queue?, asOf?, runtimeTargetMin?, maxRounds?, preview?, budgetCredits?, stopAfter?, publish? (false = skip the shelf publish step), bar? (excellence-gate mean, default 8.5), look? ("promo" = a product promo: every stage uses films/<slug>/look.md and the film-promo skill instead of the silhouette documentary defaults), applyVerdict? (act on the last review on disk instead of re-reviewing first), revoice? (after re-casting voice.json: re-narrate everything and re-fit every shot and cue in the first fix round)}',
  phases: [
    { title: 'Status', detail: 'pick the film, inspect what already exists' },
    { title: 'Produce', detail: 'research, story, narration, then score and shots in parallel' },
    { title: 'Assemble', detail: 'mix, frame-exact render, contact sheets, QA' },
    { title: 'Excellence loop', detail: 'review → route fixes → re-assemble, until the gate passes' },
    { title: 'Publish', detail: 'shelf manifest and ledger (local; deployment stays a human decision)' },
  ],
}

const A = args || {}
const REPO = A.repo || '/Users/blamy/Documents/Codex/orly-2'
const MAX_ROUNDS = A.maxRounds ?? 3
const OPUS = { model: 'claude-opus-5-5', effort: 'high' }
const CHEAP = { model: 'claude-opus-5-5', effort: 'low' } // bookkeeping only: never code or story

const STATUS = {
  type: 'object',
  properties: {
    slug: { type: 'string' },
    today: { type: 'string', description: 'UTC date from `date -u +%F`' },
    research: { type: 'boolean' }, story: { type: 'boolean' }, narration: { type: 'boolean' }, score: { type: 'boolean' },
    shotsTotal: { type: 'number' }, shotsExisting: { type: 'number' }, shotsApproved: { type: 'number' },
    assembled: { type: 'boolean' }, reviewRound: { type: 'number' }, reviewPassed: { type: 'boolean' },
    note: { type: 'string' },
  },
  required: ['slug', 'today', 'research', 'story', 'narration', 'score', 'shotsTotal', 'shotsExisting', 'shotsApproved', 'assembled', 'reviewRound', 'reviewPassed', 'note'],
}

// ---------------------------------------------------------------------------
phase('Status')
const st = await agent(`You are the production coordinator for orly-2 films (${REPO}/films/). Do bookkeeping only.
${A.queue ? `QUEUE MODE: read ${REPO}/films/queue.json ([{slug, brief, status: "pending"|"in-progress"|"done"|"blocked", ...}]). Pick the first "in-progress" item, else the first "pending" one; if none, return slug "" and note "queue empty". Create ${REPO}/films/<slug>/brief.md from the item's brief if it does not exist (copy it verbatim under a "## The request (verbatim)" heading, then the house production parameters and editorial guardrails from ${REPO}/films/neural-net-history/brief.md adapted to this subject). Mark it "in-progress".` : `The film is "${A.slug}". ${A.slug ? `Fail (note it) if ${REPO}/films/${A.slug}/brief.md does not exist.` : 'No slug was given: return slug "" and say so in note.'}`}
Then inspect ${REPO}/films/<slug>/ and report: today = output of \`date -u +%F\`; research = research/bible.md AND research/claims.json exist; story = story/status.json has status "done" AND story/script.json exists AND \`node generator/film/script.mjs assemble --slug <slug> --check\` exits 0; narration = narration/timeline.json AND apps/bookshelf/src/viz/films/<slug>/timeline.json exist; score = score/cues.json exists and every cue's render file exists; shotsTotal = shots in story/script.json; shotsExisting = files in apps/bookshelf/src/viz/films/<slug>/shots/; shotsApproved = shots with film.json stages.shots.<id>.status "approved" or "revised"; assembled = render/film.mp4 exists and film.json stages.assemble.status is "done"; reviewRound and reviewPassed from film.json stages.review (0/false if absent).`, { label: 'status', phase: 'Status', schema: STATUS, ...CHEAP })
if (!st || !st.slug) return { status: 'idle', note: st?.note || 'no film selected' }
const slug = st.slug
const asOf = A.asOf || st.today
log(`film ${slug}: research=${st.research} story=${st.story} narration=${st.narration} score=${st.score} shots=${st.shotsExisting}/${st.shotsTotal} (approved ${st.shotsApproved}) assembled=${st.assembled} review=${st.reviewRound}/${st.reviewPassed}`)

const stopped = (stage, detail) => ({ slug, status: 'stopped', stage, detail, resume: `/film-loop ${JSON.stringify({ slug })}` })
const run = async (name, a) => {
  // by file path, not registry name: the registry can be momentarily empty while it reloads
  // look ('promo' = product promo, films/<slug>/look.md) rides along to every stage
  const r = await workflow({ scriptPath: `${REPO}/.claude/workflows/${name}.js` }, { repo: REPO, ...(A.look ? { look: A.look } : {}), ...a })
  if (!r) throw new Error(`${name} returned nothing`)
  return r
}

// ---------------------------------------------------------------------------
phase('Produce')
try {
  if (!st.research) {
    const r = await run('film-research', { slug, asOf })
    if (r.status === 'incomplete') return stopped('research', r)
  }
  if (A.stopAfter === 'research') return { slug, status: 'paused', after: 'research' }

  if (!st.story) {
    const r = await run('film-story', { slug, runtimeTargetMin: A.runtimeTargetMin })
    log(`story verdict: ${JSON.stringify(r.verdict)}`)
    if (r.status === 'incomplete') return stopped('story', r)
  }
  if (A.stopAfter === 'story') return { slug, status: 'paused', after: 'story' }

  if (!st.narration) {
    const r = await run('film-narrate', { slug, budgetCredits: A.budgetCredits })
    if (r.narration?.status !== 'done') return stopped('narration', r)
  }
  if (A.stopAfter === 'narrate') return { slug, status: 'paused', after: 'narrate' }

  // score and shots only depend on the locked clock: run them side by side
  const [score, shots] = await parallel([
    () => (st.score ? Promise.resolve({ skipped: true }) : run('film-score', { slug })),
    () => (st.shotsTotal && st.shotsApproved >= st.shotsTotal ? Promise.resolve({ skipped: true }) : run('film-shots', { slug })),
  ])
  if (!score || !shots) return stopped('score/shots', { score: !!score, shots: !!shots })
  if (shots.failedGroups?.length) return stopped('shots', shots.failedGroups)
  if (A.stopAfter === 'shots') return { slug, status: 'paused', after: 'shots' }

  // -------------------------------------------------------------------------
  phase('Assemble')
  let asm = st.assembled && st.reviewRound > 0 ? { status: 'done', skipped: true } : await run('film-assemble', { slug, preview: A.preview, publish: A.publish })
  if (asm.status !== 'done') return stopped('assemble', asm)

  // -------------------------------------------------------------------------
  phase('Excellence loop')
  let verdict = null
  let round = st.reviewRound
  // applyVerdict: act on the last review already on disk instead of paying for a fresh one first.
  // revoice: the voice was re-cast, so the first fix round re-narrates everything and re-fits every shot and cue.
  const reuseVerdict = A.applyVerdict && round > 0
  for (let i = 0; i < MAX_ROUNDS; i++) {
    if (i === 0 && reuseVerdict) {
      verdict = await agent(`Read ${REPO}/films/${slug}/qa/reviews/round-${round}/verdict.json and return it verbatim (pass, mean, scores, fixes {shots, cues, lines, global}, summary). Do not edit anything.`,
        { label: `load-verdict:r${round}`, phase: 'Excellence loop', schema: { type: 'object', properties: { pass: { type: 'boolean' }, mean: { type: 'number' }, scores: { type: 'object' }, fixes: { type: 'object' }, summary: { type: 'string' } }, required: ['pass', 'fixes'] }, ...OPUS })
      if (!verdict) return stopped('load verdict', { round })
      verdict.pass = false
    } else {
      round++
      verdict = await run('film-review', { slug, round, ...(A.bar ? { bar: A.bar } : {}) })
    }
    log(`review round ${round}: pass=${verdict.pass} mean=${verdict.mean} ${JSON.stringify(verdict.scores)}`)
    if (verdict.pass) break
    if (i === MAX_ROUNDS - 1) break
    const fx = verdict.fixes || { shots: {}, cues: {}, lines: {}, global: [] }
    const shotNotes = { ...fx.shots }
    let renarrated = []

    const revoice = i === 0 && A.revoice
    // 1. line rewrites -> edit chapter sources, re-narrate only the affected shots (or everything after a re-voice)
    if (Object.keys(fx.lines).length) {
      const edited = await agent(`You are the script editor for ${REPO}/films/${slug}. Apply these narration fixes in story/chapters/*.json (stay within the fact-checked bible; keep each line about the same length; keep ids):
${Object.entries(fx.lines).map(([id, n]) => `- ${id}: ${n}`).join('\n')}
Then run \`node generator/film/script.mjs assemble --slug ${slug}\` until clean. Return the ids of the shots whose lines changed.`, { label: `lines:r${round}`, phase: 'Excellence loop', schema: { type: 'object', properties: { shots: { type: 'array', items: { type: 'string' } } }, required: ['shots'] }, ...OPUS })
      renarrated = edited?.shots || []
      if (renarrated.length && !revoice) {
        const n = await run('film-narrate', { slug, shots: renarrated, budgetCredits: A.budgetCredits })
        if (n.narration?.status !== 'done') return stopped('narration (fix round)', n)
        for (const s of renarrated) shotNotes[s] = `${shotNotes[s] ? shotNotes[s] + ' | ' : ''}Narration for this shot was re-recorded: re-anchor every beat to the new word timings in timeline.json.`
      }
    }

    if (revoice) {
      const n = await run('film-narrate', { slug, budgetCredits: A.budgetCredits })
      if (n.narration?.status !== 'done') return stopped('narration (re-voice)', n)
      renarrated = ['*']
      shotNotes['*'] = 'The narrator was re-cast and EVERY line re-recorded with a new voice: the clock moved everywhere. Re-anchor every beat to the new word timings in timeline.json and re-check each payoff lands on its word.'
    }

    // 2. global notes -> one high-effort fixer who may touch the kit, the mix or several shots
    if (fx.global?.length) {
      await agent(`You are the supervising director of the orly-2 film ${slug} (${REPO}/films/${slug}). Apply these film-wide notes from review round ${round}, in code (kit, shots, mix settings) or sources as appropriate; verify each with contact sheets or measurements; list what you changed:
${fx.global.map(g => `- ${g}`).join('\n')}
If you edit any ${REPO}/.claude/workflows/*.js file, run \`node tools/film/check-workflows.mjs\` afterwards and fix it until it passes (inside template literals, escape backticks).
Record what you changed in films/${slug}/film.json stages.fixes["round${round}-global"] ({at, by, summary, handoff: {<shotId|cueId>: note}}): the shot and cue stages that run next are told to read handoff.`, { label: `global:r${round}`, phase: 'Excellence loop', ...OPUS })
    }

    // the global fixer may leave per-shot / per-cue hand-off notes (clock moves, re-anchors) in film.json
    if (fx.global?.length) {
      const hand = `Also read ${REPO}/films/${slug}/film.json stages.fixes["round${round}-global"].handoff and apply the entry for this id, if any.`
      for (const id of Object.keys(shotNotes)) shotNotes[id] = `${shotNotes[id]} | ${hand}`
      for (const id of Object.keys(fx.cues || {})) fx.cues[id] = `${fx.cues[id]} | ${hand}`
    }
    // 3. shots and cues in parallel (the score must re-fit any shifted windows if lines were re-narrated)
    const cueNotes = { ...fx.cues }
    const shotsWanted = !!(Object.keys(shotNotes).length || fx.global?.length)
    const [fixShots] = await parallel([
      () => (shotsWanted ? run('film-shots', { slug, ...(revoice ? { allShots: true } : { shots: Object.keys(shotNotes) }), notes: shotNotes, ledger: `round${round}-shots` }) : Promise.resolve(null)),
      () => (Object.keys(cueNotes).length || renarrated.length
        ? run('film-score', { slug, cues: !revoice && Object.keys(cueNotes).length ? Object.keys(cueNotes) : undefined, notes: { ...cueNotes, ...(revoice ? { _clock: 'The narrator was re-cast and the whole film re-narrated: every cue window moved. Re-fit (or recompose) EVERY cue to the new timeline.json and re-render it.' } : renarrated.length ? { _clock: `Shots ${renarrated.join(', ')} were re-narrated and the clock moved: re-fit every cue window that changed.` } : {}) } })
        : Promise.resolve(null)),
    ])
    // parallel() turns a thrown stage into null: a film-shots run that failed (e.g. its ledger left a routed shot
    // without an outcome) must stop the loop, not slip through to assemble (review round 3)
    if (shotsWanted && (!fixShots || fixShots.failedGroups?.length)) return stopped('shots (fix round)', fixShots ? { failedGroups: fixShots.failedGroups } : 'film-shots failed (see its ledger error); re-run to resume')
    if (shotsWanted) log(`round ${round} shot ledger: ${JSON.stringify(fixShots.ledger?.counts || {})}`)
    asm = await run('film-assemble', { slug, preview: A.preview, publish: A.publish, ...(revoice ? {} : { shots: Object.keys(shotNotes) }) })
    if (asm.status !== 'done') return stopped('assemble (fix round)', asm)
  }

  // -------------------------------------------------------------------------
  phase('Publish')
  if (A.publish === false) return { slug, status: verdict?.pass ? 'excellent' : 'best-effort', rounds: round, verdict, publish: 'skipped (publish:false)' }
  const pub = await agent(`Publish the orly-2 film ${slug} LOCALLY: run \`node generator/film/publish.mjs --slug ${slug}\` (manifest kind "film" + library entry; no deploy, no git push), then \`npm run build\` to confirm the app still builds. Update ${REPO}/films/${slug}/film.json stages.publish = {status, at (ISO from \`date -u +%FT%TZ\`)}${A.queue ? ` and set this film's status in ${REPO}/films/queue.json to "${verdict?.pass ? 'done' : 'blocked'}" with the final review scores` : ''}. Report the MP4 path, runtime and the shelf URL path (?bundle=${slug}).`, { label: 'publish', phase: 'Publish', ...CHEAP })

  return { slug, status: verdict?.pass ? 'excellent' : 'best-effort', rounds: round, verdict, publish: pub }
} catch (e) {
  return stopped('error', String(e && e.message || e))
}
