export const meta = {
  name: 'film-score',
  description: 'Score the film in Strudel: cue sheet and motifs, composers per act (rendered through strudel.cc Export to WAV), a critic, and revisions',
  whenToUse: 'Stage 5 of the film pipeline (after film-narrate locks the clock). Writes films/<slug>/score/. Args: {slug, repo?, cues?: [ids] (recompose a subset), notes?: {cueId: text}, rounds?, composers?}',
  phases: [
    { title: 'Direction', detail: 'cue sheet aligned to the clock, motif bible' },
    { title: 'Compose', detail: 'composers per group of cues: write Strudel, render, analyse, iterate' },
    { title: 'Critique', detail: 'coherence, fit, mix-readiness; revise flagged cues' },
  ],
}

const A = args || {}
if (!A.slug) throw new Error('film-score needs args.slug')
const REPO = A.repo || '/Users/blamy/Documents/Codex/orly-2'
const FILM = `${REPO}/films/${A.slug}`
const SC = `${FILM}/score`
const ROUNDS = A.rounds ?? 1
const COMPOSERS = A.composers || 4
const OPUS = { model: 'claude-opus-5-5', effort: 'high' }

const COMMON = `You are part of the music team for an orly-2 film. Film: ${FILM} (brief.md; story/script.json with each shot's music intent in shot.music.note; narration/timeline.json is the LOCKED clock in absolute seconds). Read ${REPO}/docs/film/research/strudel-music-backend.md first (verified Strudel recipe and composition notes) and ${REPO}/docs/film/ARCHITECTURE.md section 7.
Tools: \`node ${REPO}/generator/film/score.mjs --help\` (render a cue through strudel.cc's own Export to WAV, analyse loudness/true peak/spectrogram). Optional browser use: Claude in Chrome (mcp__claude-in-chrome__*; invoke the claude-in-chrome skill first, work only in a tab you open and close, keep audible tests to a few seconds at low gain) to audition on https://strudel.cc and to see .pianoroll()/._punchcard() feedback.
Musical brief: a documentary score under a slow, warm narrator, so it must leave room for the voice (sparse mid-range under speech; swells only where there is space), have real musicianship (voice-leading, motifs that develop, harmony that tells the story) and a sound world that fits silhouette theatre (piano, strings and soundfont orchestra, music-box and celesta colours, low drones, restrained percussion; a modern pulse only when the story reaches the GPU era).
Every cue must END (arranged intro/body/outro, not a loop cut off), be exactly as long as its window (cycles = seconds × cps), and leave a natural tail. RESUMABLE: if a cue file or render already exists, read it and improve it rather than starting over.`

const CUESHEET = {
  type: 'object',
  properties: {
    cues: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, start: { type: 'number' }, end: { type: 'number' }, mood: { type: 'string' }, shots: { type: 'array', items: { type: 'string' } } }, required: ['id', 'start', 'end', 'mood', 'shots'] } },
    motifs: { type: 'array', items: { type: 'string' } },
    refit: { type: 'array', items: { type: 'string' }, description: 'ids of cues whose window LENGTH changed by more than one frame, or whose render no longer matches its window: they must be re-fitted and re-rendered too' },
    handoff: { type: 'array', items: { type: 'object', properties: { cue: { type: 'string' }, note: { type: 'string' } }, required: ['cue', 'note'] }, description: 'per-cue notes from film.json stages.fixes (the latest entry whose consumed.score is not true)' },
  },
  required: ['cues', 'motifs'],
}
const CUES_DONE = {
  type: 'object',
  properties: {
    cues: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, status: { type: 'string', enum: ['rendered', 'failed'] }, lufs: { type: 'number' }, seconds: { type: 'number' }, note: { type: 'string' } }, required: ['id', 'status', 'note'] } },
  },
  required: ['cues'],
}
const CRITIQUE = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['pass', 'revise'] },
    notes: { type: 'array', items: { type: 'object', properties: { cue: { type: 'string' }, problem: { type: 'string' }, fix: { type: 'string' } }, required: ['cue', 'problem', 'fix'] } },
  },
  required: ['verdict', 'notes'],
}

phase('Direction')
const sheet = await agent(`${COMMON}

You are the MUSIC DIRECTOR. ${A.notes?._clock ? `THE CLOCK MOVED: ${A.notes._clock} Read the new timeline.json and rewrite the start/end of every cue in ${SC}/cues.json to the new shot boundaries (keep ids, motifs and intent), then return the updated sheet. In "refit", list EVERY cue whose window length changed by more than one frame (1/24 s) or whose render (score/renders/<id>.json bodySeconds) no longer equals its window: those are re-fitted and re-rendered as well, not only the cues named in the notes.` : `If ${SC}/cues.json exists and no recomposition was requested, read it and return it unchanged.`}
HAND-OFFS: read ${FILM}/film.json stages.fixes: take the most recent entry (by "at") whose consumed.score is not true and return, in "handoff", one item per key of its handoff object that is a cue id (m01, m02, …) with its note verbatim. Apply what those notes say about windows (joins, starts, ends) when you write cues.json.
CUE JOINS: a cue change (the outgoing fade-out plus the incoming fade-in) must never sit under narration, and the incoming cue should sound alone for at least 1.5 s before the next line (QA score.cueJoins checks it); place joins inside the speech-free gaps of the clock (a cue may start inside the previous chapter's closing hold).
lastStrike: \`score.mjs analyze\` writes an analysed lastStrike into cues.json (lastStrikeFrom "analysis") for every cue it analyses; set it yourself only when you know better.
Otherwise design the score: read the brief, the treatment (story/treatment.md), every shot's music intent, and the clock. Write:
1. ${SC}/motifs.md: 3-5 motifs (e.g. the main "learning" theme, the winter theme, the human/persistence theme, the machine pulse) each with key, tempo, harmony and a Strudel snippet; how they develop across the film.
2. ${SC}/cues.json: MusicCue[] (contracts.ts) covering the film: windows aligned to shot boundaries (usually 1-4 shots, 45 s to 4 min), with 2-4 s overlaps for crossfades, plus deliberate silences where silence is stronger; for each cue: id (m01…), start, end, mood, tempoBpm, key, instrumentation, intensity, notes (what the music does against the picture and narration), file "score/cues/<id>.strudel", render "score/renders/<id>.wav", gainDb, fadeIn, fadeOut, lastStrike (absolute film seconds of the onset of the cue's final chord or note; REQUIRED for a cue that fades out: mix.mjs starts the fade no sooner than 1.6 s after it, shortening the fade if needed, and QA mix.fadeAfterStrike fails when the window cannot hold that; so end the music early enough that its last chord rings at least 1.6 s before the fade), duck (true under narration = ratio 8, 20/500 ms, about 6 dB; or an object {ratio, attack, release, threshold, depthDb} for a lighter duck when the cue is already written around the voice, e.g. {ratio: 3, attack: 20, release: 150, depthDb: 3}). A render whose report lists a Strudel '[webaudio] error' (e.g. 'no soundfont zone found': a note outside a GM voice's range was dropped) FAILS: render each $: layer alone to find it, move the note into range, re-render.
Return the cue list and motif names.`, { label: 'music-director', phase: 'Direction', schema: CUESHEET, ...OPUS })
if (!sheet?.cues?.length) throw new Error('music director returned no cues')
let cues = sheet.cues
// the requested cues, plus every cue the clock change re-fitted, plus every cue a global hand-off names
const handoff = Object.fromEntries((sheet.handoff || []).map(h => [h.cue, h.note]))
const wanted = new Set([...(A.cues || []), ...(sheet.refit || []), ...Object.keys(handoff)])
if (A.cues?.length || sheet.refit?.length || Object.keys(handoff).length) cues = cues.filter(c => wanted.has(c.id))
const notesWith = { ...(A.notes || {}) }
for (const [id, n] of Object.entries(handoff)) notesWith[id] = notesWith[id] ? `${notesWith[id]} | HAND-OFF: ${n}` : `HAND-OFF: ${n}`
for (const id of sheet.refit || []) if (!notesWith[id]) notesWith[id] = 'RE-FIT: the clock moved and this cue window changed length; re-fit its timing to the new line timings in timeline.json and re-render.'
log(`composing ${cues.length} cues with up to ${COMPOSERS} composers`)

// group consecutive cues so each composer owns a stretch of the film (musical continuity)
const per = Math.ceil(cues.length / Math.min(COMPOSERS, cues.length))
const groups = []
for (let i = 0; i < cues.length; i += per) groups.push(cues.slice(i, i + per))

const composePrompt = (g, extra = '') => `${COMMON}

You are a COMPOSER. Read ${SC}/motifs.md and ${SC}/cues.json. Your cues: ${g.map(c => `${c.id} (${(c.end - c.start).toFixed(1)} s, ${c.mood}, shots ${c.shots.join(' ')})`).join('; ')}.
For each cue: read its shots in the script and their line timings in the clock (where the narrator speaks, where the silences are), write ${SC}/cues/<id>.strudel, render it with score.mjs, analyse it, Read the spectrogram PNG, and iterate (at least twice for your most important cue) until the length is exact, the arrangement ends gracefully, the music sits under the voice, and it serves the picture. ${extra}
Return one entry per cue.`

phase('Compose')
const groupNotes = g => {
  const own = Object.fromEntries(Object.entries(notesWith).filter(([k]) => k === '_clock' || g.some(c => c.id === k)))
  return Object.keys(own).length ? `Apply these notes where they concern your cues: ${JSON.stringify(own)}` : ''
}
let done = (await parallel(groups.map((g, i) => () => agent(composePrompt(g, groupNotes(g)), { label: `compose:${g.map(c => c.id).join('+')}`, phase: 'Compose', schema: CUES_DONE, ...OPUS })))).filter(Boolean)

phase('Critique')
for (let r = 1; r <= ROUNDS; r++) {
  const crit = await agent(`${COMMON}

You are the SCORE CRITIC (round ${r}). Review every cue in ${SC}/cues/ with its render analysis in ${SC}/analysis/ (loudness, true peak, spectrogram PNGs: Read them), against motifs.md, the cue notes and the script. Judge: motif development and coherence across the film; harmonic and key relationships between neighbouring cues; whether each cue ends rather than stops; room for the narrator under speech; loudness consistency (cues within about ±3 LU of each other before mixing, true peak below -1 dBTP); and fit to each scene's emotion. Verdict "pass" only if the score is genuinely good enough for a film that must feel exceptional.`, { label: `score-critic:r${r}`, phase: 'Critique', schema: CRITIQUE, ...OPUS })
  log(`score critique round ${r}: ${crit?.verdict} (${crit?.notes?.length || 0} notes)`)
  if (!crit || crit.verdict === 'pass' || !crit.notes.length) break
  // critics sometimes annotate the id ("m01 (celesta…)"); route by the first cue id in the field
  const cueId = n => (String(n.cue).match(/\bm\d+\b/) || [String(n.cue).trim()])[0]
  const flagged = new Set(crit.notes.map(cueId))
  const fixGroups = groups.map(g => g.filter(c => flagged.has(c.id))).filter(g => g.length)
  const notesFor = g => crit.notes.filter(n => g.some(c => c.id === cueId(n))).map(n => `- ${n.cue}: ${n.problem} -> ${n.fix}`).join('\n')
  done = (await parallel(fixGroups.map(g => () => agent(composePrompt(g, `REVISION (critic round ${r}):\n${notesFor(g)}`), { label: `revise:${g.map(c => c.id).join('+')}:r${r}`, phase: 'Critique', schema: CUES_DONE, ...OPUS })))).filter(Boolean)
}

await agent(`${COMMON}

Run \`node ${REPO}/generator/film/score.mjs analyze --slug ${A.slug} --all\` (refreshes every cue's analysis, lastStrike and summary.json against the current clock), then \`node ${REPO}/generator/film/qa.mjs --slug ${A.slug} --stage score\` and report its score.cueJoins and score.renders lines. Update ${FILM}/film.json: stages.score = {status: "done" if every cue in score/cues.json has a render, else "partial", at (ISO time from \`date -u +%FT%TZ\`), summary (cue count, total music seconds, loudness range), provenance: {model: "claude-opus-5-5", effort: "high"}}${Object.keys(handoff).length ? `; and set consumed.score = true on the stages.fixes entry whose hand-offs you were given (the most recent one without consumed.score)` : ''}. Keep other keys. Return one line.`, { label: 'ledger', phase: 'Critique', model: 'claude-opus-5-5', effort: 'low' })

return { slug: A.slug, cues: cues.map(c => c.id), results: done.flatMap(d => d.cues) }
