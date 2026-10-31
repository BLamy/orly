export const meta = {
  name: 'film-shots',
  description: 'Animate the film: cast and shared sets, then per chapter group an author, a fresh-eyes critic and a reviser, all verified with contact sheets',
  whenToUse: 'Stage 6 of the film pipeline (after the clock is locked; can overlap film-score). Writes apps/bookshelf/src/viz/films/<slug>/{cast.ts, sets/, shots/}. Args: {slug, repo?, shots?: [ids] (subset), notes?: {shotId: text} (fix notes from review), ledger?: string (film.json stages.fixes key for the per-shot outcome ledger, e.g. "round3-shots"; closed by generator/film/shot-ledger.mjs finalize, the stage fails when a routed shot has no outcome), groupSize?, concurrency?, rounds?, bar?}',
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
const rank = o => ({ skipped: 0, partial: 1, fixed: 2 })[o] ?? 3

const PROMO = A.look === 'promo'
const HEAD_DOC = `You are an animator on an orly-2 film: a silhouette / paper-cut theatre documentary rendered frame-exactly in JavaScript.
READ FIRST: the film-shot skill ${REPO}/.claude/skills/film-shot/SKILL.md (shot API, kit catalogue, conventions, verification), ${REPO}/apps/bookshelf/src/viz/film/contracts.ts, and the style bible ${REPO}/docs/film/research/silhouette-style-bible.md (sections 2-6 and 10). The visual target is ${REPO}/.orly-work/reference/silhouette-reference.png (Read it).
Film sources: ${FILM}/story/script.json (each shot's visual direction, beats, on-screen text, cast, props, mood, transition), ${FILM}/story/treatment.md (recurring devices), ${APP}/timeline.json (the LOCKED clock: shot durations and word timings; never change it), ${APP}/cast.ts (the film's puppets), ${APP}/sets/ (shared recurring sets).
Craft rules: every shot is CINEMATIC (multiplane depth, slow camera grammar, haze, practical light, one sharp action plane), TEACHES what its narration says at the moment it says it (anchor beats to words with T.word/T.line), uses puppets on twos with breathing and talk beats, keeps one saturated accent at most, keeps text legible and inside the safe area, and ends clean. Facts on screen come only from the script (which is fact-checked). Shots are pure functions of time.
`
// look "promo": a product-marketing film (films/<slug>/look.md), the film/promo kit and cleaned rrweb takes of the product
const HEAD_PROMO = `You are a motion designer on an orly-2 PROMO film: a product-marketing film rendered frame-exactly in JavaScript (NOT a silhouette documentary: ignore the silhouette style bible, puppets and multiplane craft).
READ FIRST: the film-promo skill ${REPO}/.claude/skills/film-promo/SKILL.md (promo kit, RrwebScreen, conventions, verification), the film's style sheet ${FILM}/look.md and its reference frames ${FILM}/reference/ (Read contact-sheet.jpg), and ${REPO}/apps/bookshelf/src/viz/film/contracts.ts (ShotModule incl. dom()).
Film sources: ${FILM}/story/script.json (each shot's visual direction, beats, on-screen text, which rrweb take and marks it uses, transition), ${FILM}/story/treatment.md (recurring devices), ${APP}/timeline.json (the LOCKED clock: shot durations and word timings; never change it), the cleaned product recordings ${REPO}/public/generated/${A.slug}/rr/<take>.json (marks = named moments, ms) and their contact sheets (\`node ${REPO}/tools/promo/rr-sheet.mjs --slug ${A.slug} --take <take>\`).
Craft rules: every shot is a crafted PROMO moment (the reference's register: airy grey paper, soft colour hazes, bracketed kinetic type, one idea per beat, generous negative space, confident motion with ease-outs, cuts and type hits on the music's downbeats and the narrator's words), SHOWS what its narration says at the moment it says it (anchor beats with T.word/T.line; seek takes so the product does the thing on the word), keeps product footage legible (crop and zoom into the part that matters; never a full desktop at thumbnail size), keeps text inside the safe area, and ends clean. Facts and numbers on screen come only from the script (fact-checked) and the recordings themselves. Never show secrets: the takes are redacted; do not add any. Shots are pure functions of time.
`
const COMMON = (PROMO ? HEAD_PROMO : HEAD_DOC) + `Verification: typecheck your files (\`npx tsc -p apps/bookshelf/tsconfig.json --noEmit\`, fix only your files), then render contact sheets with \`node ${REPO}/generator/film/sheets.mjs --slug ${A.slug} --shot <id>\` against the dev server and Read them. Iterate until each shot is beautiful, legible and in sync.
Other animators are writing other shots in parallel: touch only your own shot files (and new files you create under sets/ with names prefixed by your shot ids). RESUMABLE: if a shot file already exists, read it and improve it instead of starting over.
OVERWRITE GUARD (review round 3: a later pass wrote its stale copy of ch08-s05 over a verified fix). For EVERY shot file you edit, with OWNER = the label given in your task: at task start run \`node ${REPO}/generator/film/shot-guard.mjs read --slug ${A.slug} --shot <id> --owner <OWNER>\` and then Read the file; right BEFORE each Write/Edit of it run \`… check …\` with the same flags: exit 3 means someone else changed the file since you read it, so Read the CURRENT file, merge your edits onto it (never write your older copy back), run \`… read …\` again and retry; right AFTER each write run \`… commit …\` (exit 4 means you replaced someone's version: restore their changes from the snapshot path it prints and merge). Keep every fix a review note asked for, even ones you did not make.`

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
    handoff: { type: 'array', items: { type: 'object', properties: { shot: { type: 'string' }, note: { type: 'string' } }, required: ['shot', 'note'] }, description: 'per-shot notes from film.json stages.fixes (the latest entry that has a handoff object and whose consumed.shots is not true)' },
  },
  required: ['devServer', 'cast', 'sets', 'shots'],
}
const AUTHORED = {
  type: 'object',
  properties: { shots: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string', enum: ['authored', 'failed'] }, paintMs: { type: 'number' }, note: { type: 'string' }, outcome: { type: 'string', enum: ['fixed', 'partial', 'skipped', 'none'], description: 'for a shot that had REVIEW NOTES: fixed (every item applied and checked on a sheet rendered after the last edit, at the word times the note names), partial, or skipped; "none" when it had no notes' }, reason: { type: 'string', description: 'partial/skipped: which items are missing and why; fixed: the word times checked' }, wordTimes: { type: 'array', items: { type: 'number' }, description: 'shot-local word/beat times (s) you checked on stills rendered after the last edit' } }, required: ['id', 'status', 'note'] } } },
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
${PROMO ? `2. TAKES: for every take named in script.json, check ${REPO}/public/generated/${A.slug}/rr/<take>.json exists and render its contact sheet once (tools/promo/rr-sheet.mjs) so authors can look. A missing take is a blocker: report it in note and stop.
3. SHARED PIECES: put helpers that several shots reuse (a branded end-card painter, a recurring screen framing) in ${APP}/sets/ with a gallery snap you have checked.` : `2. CAST: if ${APP}/cast.ts does not exist, create it: export const cast = { <id>: createPuppet(spec) } for every entry in script.json "cast", plus a line-up gallery apps/bookshelf/src/viz/film/gallery/cast-${A.slug}.gallery.ts. Snap the line-up, Read it, and refine the specs until every character is distinct, era-correct and respectful (never a caricature).
3. SHARED SETS: from treatment.md's recurring devices and settings that recur across chapters, create shared set modules in ${APP}/sets/ (e.g. the narrator's framing theatre, a recurring "belief of the age" device), each with a gallery snap you have checked.`}
4. List every shot in script.json (in order) with its chapter, whether ${APP}/shots/<id>.tsx exists, and its film.json status (stages.shots.<id>.status: "authored", "revised", "approved" or ""), authored = status is any of those three, approved = status is "approved" or "revised" (critiqued and finished), handoffApplied = stages.shots.<id>.handoffApplied (the stages.fixes key whose hand-off this shot already applied) or "".
5. HAND-OFFS: read ${FILM}/film.json stages.fixes: take the most recent entry (by "at") that has a handoff object and whose consumed.shots is not true and return its key as "handoffKey" and, in "handoff", one item per key of its handoff object that is a shot id (chNN-sNN…) with its note verbatim (a key "*" applies to every shot: return it as shot "*").`, { label: 'prep', phase: 'Prep', schema: PREP, ...OPUS })
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
else if (A.shots?.length) todo = todo.filter(s => A.shots.includes(s.id) || !!handoff[s.id]) // a hand-off reaches its shot even when it was not requested
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

// the per-shot ledger (film.json stages.fixes[LEDGER]): every routed shot gets an outcome, written by authors with
// shot-ledger.mjs record as they finish, and closed by shot-ledger.mjs finalize after the stage (deterministic merge,
// mechanical note check, exit 2 when a routed id has no outcome -> this stage throws)
const LEDGER = A.ledger || 'auto'
const ROUTED = todo.filter(s => NOTES[s.id] || NOTES['*']).map(s => s.id)
const notesFor = ids => (Object.keys(NOTES).length ? [...(NOTES['*'] ? [`- ALL SHOTS: ${NOTES['*']}`] : []), ...ids.filter(id => NOTES[id]).map(id => `- ${id}: ${NOTES[id]}`)].join('\n') : '')
// review round 4 (teacher T402: ch10-s12 reached "fixed" a fourth time because a critic pass re-added a removed number
// by respelling it): the critic and the reviser see EVERY routed note of this and the previous rounds for their shots,
// and the rule that what a note removed stays removed. shot-ledger.mjs history prints them (verdicts + hand-offs) with
// each removal's respellings; finalize downgrades any respelled re-add to partial.
const ROUND = Number((String(LEDGER).match(/round(\d+)/) || [])[1]) || null
const HISTORY = ids => `ROUTED-NOTE HISTORY (mandatory, before you judge or edit): for each of ${ids.join(', ')} run \`node ${REPO}/generator/film/shot-ledger.mjs history --slug ${A.slug} --shot <id>${ROUND ? ` --round ${ROUND}` : ''}\` and read every routed note of this AND every previous round, with its REMOVED list. RULE: never re-add what a routed note removed, in ANY spelling (digits or words, a fraction as an ordinal, an abbreviation or its long form, the same fact reworded on a new card or beat). A note of yours that would bring a removed item back is not allowed; propose another fix. The ledger check greps the source for the removed strings and their respellings and downgrades the shot to partial on any hit.`

const author = g => agent(`${COMMON}

OWNER label for the overwrite guard: "author:${g.map(s => s.id).join('+')}".
YOUR SHOTS: ${g.map(s => s.id).join(', ')} (chapter ${g[0].chapter}). ${HISTORY(g.map(s => s.id))}
For each: read its script entry and its timing in the clock, write ${APP}/shots/<id>.tsx with defineShot (skill), verify by typecheck and contact sheets, and iterate at least twice on the most important shot of the group. Make consecutive shots flow (matching moods, camera continuity, transitions as scripted).
${notesFor(g.map(s => s.id)) ? `REVIEW NOTES TO APPLY (mandatory: earlier rounds left routed notes unapplied, and the next review checks a ledger):\n${notesFor(g.map(s => s.id))}\nFor EVERY shot with notes: apply every item of its note (and of its HAND-OFF), then re-render its contact sheet AFTER your last edit, plus stills (\`node ${REPO}/generator/film/stills.mjs --slug ${A.slug} --times <abs s,...>\`) at each word or beat time the note names (look the words up in the clock), Read them, and check each item against its named time. If the note names text that must be legible, run \`node ${REPO}/generator/film/legibility.mjs --slug ${A.slug} --shot <id>\` and make it pass. Report outcome per shot: "fixed" only when every item is verified on frames rendered after the last edit (give the word times you checked in reason and wordTimes), "partial" (say which items are missing and why), or "skipped" (say why). RECORD it in the ledger as soon as each noted shot is done (do not wait for the end of your task): \`node ${REPO}/generator/film/shot-ledger.mjs record --slug ${A.slug} --key ${LEDGER} --shot <id> --outcome fixed|partial|skipped --reason "<what you checked, or what is missing>" --times "<shot-local s,…>" --by "author"\`. After the stage a mechanical check greps each note's key strings in your source (comments do not count) and downgrades a "fixed" that misses: \`node ${REPO}/generator/film/shot-ledger.mjs check --slug ${A.slug} --key ${LEDGER} --ids <id>\` runs it now (exit 2 only means outcomes are not all recorded yet).` : ''}
When a shot is done, set ${FILM}/film.json stages.shots.<id> = {status: "authored", at (ISO from \`date -u +%FT%TZ\`)${HKEY ? `, handoffApplied: "${HKEY}" (if this shot's notes included the hand-off)` : ''}} (re-read the file right before writing; others update it too). Report each shot with its measured paint time (frameInfo in the harness) if available.`, { label: `author:${g.map(s => s.id).join('+')}`, phase: 'Author', schema: AUTHORED, ...OPUS })

const critique = (g, round) => agent(`${COMMON}

You are a FRESH-EYES CRITIC (${PROMO ? 'creative director and product marketer' : 'art director and science teacher'} at once), round ${round}. You did not write these shots.
${HISTORY(g.map(s => s.id))}${notesFor(g.map(s => s.id)) ? `\nThis round's routed notes for these shots (fixed decisions: your notes must never undo them):\n${notesFor(g.map(s => s.id))}` : ''}
For each of ${g.map(s => s.id).join(', ')}: render (or re-render) its contact sheet with sheets.mjs, Read it, read the shot's script entry and narration, and score 1-10: artistry (composition, light, depth, ${PROMO ? 'promo craft against the reference frames in ' + FILM + '/reference/ and look.md' : 'silhouette craft against the reference frame'}), teaching (does the picture explain exactly what the narration says, when it says it), sync (beats land on their words, motion pacing, holds), continuity (with the neighbouring shots and the film's style). Give concrete, actionable notes (what to change, where, by how much). 8 means genuinely excellent.
For every shot whose four scores are all >= ${BAR}, set ${FILM}/film.json stages.shots.<id> = {status: "approved", at, scores} (re-read the file right before writing).`, { label: `critic:${g.map(s => s.id).join('+')}:r${round}`, phase: 'Critique', schema: CRIT, ...OPUS })

const revise = (g, crit, round) => {
  const weak = crit.shots.filter(s => Math.min(...Object.values(s.scores)) < BAR)
  if (!weak.length) return Promise.resolve({ shots: g.map(s => ({ id: s.id, status: 'authored', note: 'passed critique' })), crit })
  return agent(`${COMMON}

You are the REVISER for ${weak.map(s => s.id).join(', ')} (round ${round}). OWNER label for the overwrite guard: "reviser:${weak.map(s => s.id).join('+')}:r${round}". Apply the critic's notes, re-render the contact sheets, Read them, and confirm each note is resolved.
${HISTORY(weak.map(s => s.id))} A critic note that conflicts with a routed note (this round or earlier) loses: skip it and say so in your report.${weak.some(s => ROUTED.includes(s.id)) ? ` These shots carried REVIEW NOTES this round (${weak.filter(s => ROUTED.includes(s.id)).map(s => `${s.id}: ${String(NOTES[s.id] || NOTES['*'])}`).join(' || ')}): every item of them must still hold after your edits (re-check it at its word times), and re-record its outcome with \`node ${REPO}/generator/film/shot-ledger.mjs record --slug ${A.slug} --key ${LEDGER} --shot <id> --outcome … --reason … --times … --by "reviser"\` after your last edit (the ledger keeps the file's sha: a fix changed after it was recorded is downgraded).` : ''} When a shot is done, set ${FILM}/film.json stages.shots.<id> = {status: "revised", at} (re-read the file right before writing):
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

// the per-shot outcome ledger, closed DETERMINISTICALLY (review round 3: the round-2 ledger agent never wrote one).
// Workflow scripts have no filesystem, so one command does the work: shot-ledger.mjs finalize merges the outcomes the
// authors recorded with the ones they returned here (the worse wins), runs the mechanical note check (key strings of
// each note in the source, comments stripped; a "fixed" that misses becomes "partial"), writes stages.fixes[LEDGER]
// under a lock, reads it back and exits 2 if any routed id has no outcome. This script then checks the command's own
// JSON and fails the stage on any gap.
let ledger = null
if (ROUTED.length) {
  const byId = {}
  for (const r of results) {
    for (const s of r.authored?.shots || []) byId[s.id] = s
    for (const s of r.last?.shots || []) if (s.outcome && s.outcome !== 'none' && byId[s.id]) byId[s.id] = { ...byId[s.id], outcome: rank(s.outcome) < rank(byId[s.id].outcome) ? s.outcome : byId[s.id].outcome }
  }
  const given = ROUTED.map(id => {
    const a = byId[id]
    const failedGroup = !results.some(r => r.group.includes(id))
    const o = failedGroup || a?.status === 'failed' ? 'skipped' : a?.outcome && a.outcome !== 'none' ? a.outcome : ''
    return o ? `${id}=${o}` : ''
  }).filter(Boolean)
  const times = ROUTED.map(id => (byId[id]?.wordTimes || []).filter(x => Number.isFinite(x)).map(x => +Number(x).toFixed(2))).map((ts, i) => (ts.length ? `${ROUTED[i]}:${ts.join('/')}` : '')).filter(Boolean)
  const cmd = `node ${REPO}/generator/film/shot-ledger.mjs finalize --slug ${A.slug} --key ${LEDGER} --ids ${ROUTED.join(',')}${given.length ? ` --outcomes ${given.join(',')}` : ''}${times.length ? ` --times-map ${times.join(',')}` : ''} --by film-shots`
  const LEDGER_OUT = { type: 'object', properties: { exitCode: { type: 'number' }, stdout: { type: 'string', description: 'the command\'s stdout, verbatim (one JSON line)' } }, required: ['exitCode', 'stdout'] }
  const ran = await agent(`Bookkeeping only: run exactly this one command from ${REPO} and return its exit code and its stdout verbatim. Do not edit any file, do not retry with other flags, do not interpret the result.\n\n${cmd}`, { label: 'ledger:finalize', phase: 'Critique', schema: LEDGER_OUT, model: 'claude-opus-5-5', effort: 'medium' })
  if (!ran) throw new Error(`ledger: the finalize command did not run; run it by hand: ${cmd}`)
  try { ledger = JSON.parse(String(ran.stdout).trim().split('\n').filter(l => l.startsWith('{')).pop()) } catch (e) { ledger = null }
  if (!ledger || ledger.written !== true || ledger.routed !== ROUTED.length) throw new Error(`ledger: finalize did not confirm a write of ${ROUTED.length} routed ids (exit ${ran.exitCode}): ${String(ran.stdout).slice(0, 400)}`)
  if (ran.exitCode !== 0 || ledger.missing?.length) throw new Error(`ledger ${LEDGER}: routed shots without an outcome: ${(ledger.missing || []).join(', ')} (re-run film-shots to resume; they are re-authored)`)
  log(`ledger ${LEDGER}: ${JSON.stringify(ledger.counts)}${ledger.downgraded?.length ? `; note check downgraded ${ledger.downgraded.join(', ')} to partial` : ''}`)
}

const scored = results.flatMap(r => (r.crit?.shots || []).map(s => ({ id: s.id, min: Math.min(...Object.values(s.scores)), scores: s.scores })))
const failedGroups = groups.filter(g => !results.some(r => r.group[0] === g[0].id)).map(g => g.map(s => s.id))
if (failedGroups.length) log(`groups that did not finish (re-run to resume): ${JSON.stringify(failedGroups)}`)
if (Object.keys(handoff).length && !failedGroups.length) {
  await agent(`Bookkeeping only. In ${FILM}/film.json, find the most recent stages.fixes entry (by "at") that has a handoff object and whose consumed.shots is not true and set its consumed.shots = true (re-read the file right before writing; keep every other key). Return one line.`, { label: 'handoff-consumed', phase: 'Critique', model: 'claude-opus-5-5', effort: 'low' })
}
return { slug: A.slug, groups: results.length, shots: scored, failedGroups, ledger }
