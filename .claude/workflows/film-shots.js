export const meta = {
  name: 'film-shots',
  description: 'Animate the film: cast and shared sets, then per chapter group an author, a fresh-eyes critic and a reviser, all verified with contact sheets',
  whenToUse: 'Stage 6 of the film pipeline (after the clock is locked; can overlap film-score). Writes apps/bookshelf/src/viz/films/<slug>/{cast.ts, sets/, shots/}. Args: {slug, repo?, shots?: [ids] (subset), notes?: {shotId: text} (fix notes from review), groupSize?, concurrency?, rounds?, bar?}',
  phases: [
    { title: 'Prep', detail: 'dev server, cast module and line-up, shared recurring sets, shot list' },
    { title: 'Author', detail: 'per chapter group: author shots, render contact sheets, iterate' },
    { title: 'Critique', detail: 'fresh-eyes art director + teacher scores each shot; reviser fixes those below the bar' },
  ],
}

const A = args || {}
if (!A.slug) throw new Error('film-shots needs args.slug')
const REPO = A.repo || '/Users/blamy/Documents/Codex/orly-2'
const FILM = `${REPO}/films/${A.slug}`
const APP = `${REPO}/apps/bookshelf/src/viz/films/${A.slug}`
const GROUP = A.groupSize || 5
const CONC = A.concurrency || 4
const ROUNDS = A.rounds ?? 1
const BAR = A.bar || 8
const OPUS = { model: 'claude-opus-5-5', effort: 'high' }

const COMMON = `You are an animator on an orly-2 film: a silhouette / paper-cut theatre documentary rendered frame-exactly in JavaScript.
READ FIRST: the film-shot skill ${REPO}/.claude/skills/film-shot/SKILL.md (shot API, kit catalogue, conventions, verification), ${REPO}/apps/bookshelf/src/viz/film/contracts.ts, and the style bible ${REPO}/docs/film/research/silhouette-style-bible.md (sections 2-6 and 10). The visual target is ${REPO}/.orly-work/reference/silhouette-reference.png (Read it).
Film sources: ${FILM}/story/script.json (each shot's visual direction, beats, on-screen text, cast, props, mood, transition), ${FILM}/story/treatment.md (recurring devices), ${APP}/timeline.json (the LOCKED clock: shot durations and word timings; never change it), ${APP}/cast.ts (the film's puppets), ${APP}/sets/ (shared recurring sets).
Craft rules: every shot is CINEMATIC (multiplane depth, slow camera grammar, haze, practical light, one sharp action plane), TEACHES what its narration says at the moment it says it (anchor beats to words with T.word/T.line), uses puppets on twos with breathing and talk beats, keeps one saturated accent at most, keeps text legible and inside the safe area, and ends clean. Facts on screen come only from the script (which is fact-checked). Shots are pure functions of time.
Verification: typecheck your files (\`npx tsc -p apps/bookshelf/tsconfig.json --noEmit\`, fix only your files), then render contact sheets with \`node ${REPO}/generator/film/sheets.mjs --slug ${A.slug} --shot <id>\` against the dev server and Read them. Iterate until each shot is beautiful, legible and in sync.
Other animators are writing other shots in parallel: touch only your own shot files (and new files you create under sets/ with names prefixed by your shot ids). RESUMABLE: if a shot file already exists, read it and improve it instead of starting over.`

const PREP = {
  type: 'object',
  properties: {
    devServer: { type: 'string' },
    cast: { type: 'array', items: { type: 'string' } },
    sets: { type: 'array', items: { type: 'string' } },
    shots: {
      type: 'array',
      items: { type: 'object', properties: { id: { type: 'string' }, chapter: { type: 'string' }, exists: { type: 'boolean' }, authored: { type: 'boolean' }, approved: { type: 'boolean' }, status: { type: 'string', description: 'film.json stages.shots.<id>.status, or ""' }, handoffApplied: { type: 'string', description: 'film.json stages.shots.<id>.handoffApplied, or ""' } }, required: ['id', 'chapter', 'exists', 'authored', 'approved', 'status', 'handoffApplied'] },
    },
    handoffKey: { type: 'string', description: 'the stages.fixes key the hand-off came from, or ""' },
    handoff: { type: 'array', items: { type: 'object', properties: { shot: { type: 'string' }, note: { type: 'string' } }, required: ['shot', 'note'] }, description: 'per-shot notes from film.json stages.fixes (the latest entry whose consumed.shots is not true)' },
  },
  required: ['devServer', 'cast', 'sets', 'shots'],
}
const AUTHORED = {
  type: 'object',
  properties: { shots: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string', enum: ['authored', 'failed'] }, paintMs: { type: 'number' }, note: { type: 'string' } }, required: ['id', 'status', 'note'] } } },
  required: ['shots'],
}
const CRIT = {
  type: 'object',
  properties: {
    shots: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          scores: { type: 'object', properties: { artistry: { type: 'number' }, teaching: { type: 'number' }, sync: { type: 'number' }, continuity: { type: 'number' } }, required: ['artistry', 'teaching', 'sync', 'continuity'] },
          notes: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'scores', 'notes'],
      },
    },
  },
  required: ['shots'],
}

// ---------------------------------------------------------------------------
phase('Prep')
const prep = await agent(`${COMMON}

You are the LEAD ANIMATOR doing prep.
1. Make sure the dev server answers at http://127.0.0.1:5199 (curl it). If not, start it in the background from ${REPO} with \`nohup npm run film:dev > .orly-work/film-dev.log 2>&1 &\` (or \`cd apps/bookshelf && npx vite --port 5199 --strictPort --host 127.0.0.1\`) and wait until it answers.
2. CAST: if ${APP}/cast.ts does not exist, create it: export const cast = { <id>: createPuppet(spec) } for every entry in script.json "cast", plus a line-up gallery apps/bookshelf/src/viz/film/gallery/cast-${A.slug}.gallery.ts. Snap the line-up, Read it, and refine the specs until every character is distinct, era-correct and respectful (never a caricature).
3. SHARED SETS: from treatment.md's recurring devices and settings that recur across chapters, create shared set modules in ${APP}/sets/ (e.g. the narrator's framing theatre, a recurring "belief of the age" device), each with a gallery snap you have checked.
4. List every shot in script.json (in order) with its chapter, whether ${APP}/shots/<id>.tsx exists, and its film.json status (stages.shots.<id>.status: "authored", "revised", "approved" or ""), authored = status is any of those three, approved = status is "approved" or "revised" (critiqued and finished), handoffApplied = stages.shots.<id>.handoffApplied (the stages.fixes key whose hand-off this shot already applied) or "".
5. HAND-OFFS: read ${FILM}/film.json stages.fixes: take the most recent entry (by "at") whose consumed.shots is not true and return its key as "handoffKey" and, in "handoff", one item per key of its handoff object that is a shot id (chNN-sNN…) with its note verbatim (a key "*" applies to every shot: return it as shot "*").`, { label: 'prep', phase: 'Prep', schema: PREP, ...OPUS })
if (!prep?.shots?.length) throw new Error('prep returned no shots')

// global hand-offs (film.json stages.fixes[…].handoff) reach ANY shot they name, not only the requested ones
// a hand-off reaches each shot ONCE: shots that already applied this fixes entry (handoffApplied) are skipped, so an
// interrupted run never re-authors finished chapters
const HKEY = prep.handoffKey || ''
const applied = new Set(prep.shots.filter(s => HKEY && s.handoffApplied === HKEY).map(s => s.id))
const handoff = Object.fromEntries((prep.handoff || []).filter(h => !applied.has(h.shot)).map(h => [h.shot, h.note]))
const NOTES = { ...(A.notes || {}) }
for (const [id, n] of Object.entries(handoff)) NOTES[id] = NOTES[id] ? `${NOTES[id]} | HAND-OFF: ${n}` : `HAND-OFF: ${n}`
let todo = prep.shots
if (A.allShots) { /* every shot, e.g. after a full re-voice moved the clock */ }
else if (A.shots?.length) todo = todo.filter(s => A.shots.includes(s.id))
else todo = todo.filter(s => !s.approved || !!handoff[s.id]) // approved or revised = critiqued and finished
log(`shots to work: ${todo.length} of ${prep.shots.length}`)
if (!todo.length) return { slug: A.slug, status: 'nothing-to-do' }

// group by chapter, chunks of GROUP
const groups = []
let cur = []
for (const s of todo) {
  if (cur.length && (cur[0].chapter !== s.chapter || cur.length >= GROUP)) { groups.push(cur); cur = [] }
  cur.push(s)
}
if (cur.length) groups.push(cur)

const notesFor = ids => (Object.keys(NOTES).length ? [...(NOTES['*'] ? [`- ALL SHOTS: ${NOTES['*']}`] : []), ...ids.filter(id => NOTES[id]).map(id => `- ${id}: ${NOTES[id]}`)].join('\n') : '')

const author = g => agent(`${COMMON}

YOUR SHOTS: ${g.map(s => s.id).join(', ')} (chapter ${g[0].chapter}). For each: read its script entry and its timing in the clock, write ${APP}/shots/<id>.tsx with defineShot (skill), verify by typecheck and contact sheets, and iterate at least twice on the most important shot of the group. Make consecutive shots flow (matching moods, camera continuity, transitions as scripted).
${notesFor(g.map(s => s.id)) ? `REVIEW NOTES TO APPLY:\n${notesFor(g.map(s => s.id))}` : ''}
When a shot is done, set ${FILM}/film.json stages.shots.<id> = {status: "authored", at (ISO from \`date -u +%FT%TZ\`)${HKEY ? `, handoffApplied: "${HKEY}" (if this shot's notes included the hand-off)` : ''}} (re-read the file right before writing; others update it too). Report each shot with its measured paint time (frameInfo in the harness) if available.`, { label: `author:${g.map(s => s.id).join('+')}`, phase: 'Author', schema: AUTHORED, ...OPUS })

const critique = (g, round) => agent(`${COMMON}

You are a FRESH-EYES CRITIC (art director and science teacher at once), round ${round}. You did not write these shots. For each of ${g.map(s => s.id).join(', ')}: render (or re-render) its contact sheet with sheets.mjs, Read it, read the shot's script entry and narration, and score 1-10: artistry (composition, light, depth, silhouette craft against the reference frame), teaching (does the picture explain exactly what the narration says, when it says it), sync (beats land on their words, motion pacing, holds), continuity (with the neighbouring shots and the film's style). Give concrete, actionable notes (what to change, where, by how much). 8 means genuinely excellent.
For every shot whose four scores are all >= ${BAR}, set ${FILM}/film.json stages.shots.<id> = {status: "approved", at, scores} (re-read the file right before writing).`, { label: `critic:${g.map(s => s.id).join('+')}:r${round}`, phase: 'Critique', schema: CRIT, ...OPUS })

const revise = (g, crit, round) => {
  const weak = crit.shots.filter(s => Math.min(...Object.values(s.scores)) < BAR)
  if (!weak.length) return Promise.resolve({ shots: g.map(s => ({ id: s.id, status: 'authored', note: 'passed critique' })), crit })
  return agent(`${COMMON}

You are the REVISER for ${weak.map(s => s.id).join(', ')} (round ${round}). Apply the critic's notes, re-render the contact sheets, Read them, and confirm each note is resolved. When a shot is done, set ${FILM}/film.json stages.shots.<id> = {status: "revised", at} (re-read the file right before writing):
${weak.map(s => `- ${s.id} (${JSON.stringify(s.scores)}): ${s.notes.join(' | ')}`).join('\n')}`, { label: `revise:${weak.map(s => s.id).join('+')}:r${round}`, phase: 'Critique', schema: AUTHORED, ...OPUS }).then(r => ({ ...r, crit }))
}

const results = []
for (let i = 0; i < groups.length; i += CONC) {
  const batch = groups.slice(i, i + CONC)
  const got = await pipeline(
    batch,
    // resume: a group whose shots are all marked authored (and carry no new notes) goes straight to critique
    g => (!A.allShots && g.every(s => s.authored) && !notesFor(g.map(s => s.id)) ? Promise.resolve({ skipped: true, shots: g.map(s => ({ id: s.id, status: 'authored', note: 'already authored; resumed at critique' })) }) : author(g)),
    async (authored, g) => {
      let crit = null
      let last = authored
      for (let r = 1; r <= ROUNDS; r++) {
        crit = await critique(g, r)
        if (!crit) break
        last = await revise(g, crit, r)
        if (crit.shots.every(s => Math.min(...Object.values(s.scores)) >= BAR)) break
      }
      return { group: g.map(s => s.id), authored, crit, last }
    },
  )
  results.push(...got.filter(Boolean))
  log(`shots: ${Math.min(i + CONC, groups.length)}/${groups.length} groups done`)
}

const scored = results.flatMap(r => (r.crit?.shots || []).map(s => ({ id: s.id, min: Math.min(...Object.values(s.scores)), scores: s.scores })))
const failedGroups = groups.filter(g => !results.some(r => r.group[0] === g[0].id)).map(g => g.map(s => s.id))
if (failedGroups.length) log(`groups that did not finish (re-run to resume): ${JSON.stringify(failedGroups)}`)
if (Object.keys(handoff).length && !failedGroups.length) {
  await agent(`Bookkeeping only. In ${FILM}/film.json, find the most recent stages.fixes entry (by "at") whose consumed.shots is not true and set its consumed.shots = true (re-read the file right before writing; keep every other key). Return one line.`, { label: 'handoff-consumed', phase: 'Critique', model: 'claude-opus-5-5', effort: 'low' })
}
return { slug: A.slug, groups: results.length, shots: scored, failedGroups }
