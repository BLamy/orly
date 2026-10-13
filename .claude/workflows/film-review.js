export const meta = {
  name: 'film-review',
  description: 'The excellence gate: five reviewers score the assembled film, then a showrunner routes every fix to its owning stage',
  whenToUse: 'Stage 9 of the film pipeline (after film-assemble), and in every loop round. Writes films/<slug>/qa/reviews/round-<n>/. Args: {slug, round, repo?, bar?}',
  phases: [
    { title: 'Review', detail: 'accuracy, clarity & depth, story & curiosity, visuals & motion, sound' },
    { title: 'Showrunner', detail: 'merge, decide pass/fail, route fixes to shots / cues / lines' },
  ],
}

const A = args || {}
if (!A.slug || !A.round) throw new Error('film-review needs args.slug and args.round')
const REPO = A.repo || '/Users/blamy/Documents/Codex/orly-2'
const FILM = `${REPO}/films/${A.slug}`
const OUT = `${FILM}/qa/reviews/round-${A.round}`
const BAR = A.bar || 8.5
const OPUS = { model: 'claude-opus-5-5', effort: 'high' }

const COMMON = `You are reviewing an assembled orly-2 film: ${FILM}. Materials: brief.md; story/script.md and script.json; research/bible.md, claims.json, quotes.json; narration/timeline.json; qa/sheets/*.png (one contact sheet per shot: frames across the shot, each labelled with its time and the line being spoken: Read them); qa/reports/ (automated QA); mix/loudness.json; score/cues.json and score/analysis/ (spectrograms); render/ (film.mp4, film.vtt). You cannot watch or hear the film; judge motion from the frame sequences and timing data, and sound from the analysis files and the script.
Score 1-10 on all eight dimensions: accuracy, depth, clarity, story, visual, sync, sound, curiosity ( "sync" = motion and timing to the narration). 8 means genuinely excellent; reserve 9-10 for exceptional. Every issue names its OWNER so it can be routed: {"owner":"shot","id":"ch03-s02"} | {"owner":"cue","id":"m04"} | {"owner":"line","id":"L0305"} | {"owner":"global"}, plus severity (critical | major | minor) and a concrete fix. Previous rounds' reviews (if any) are in ${FILM}/qa/reviews/; check whether earlier issues were really fixed. The fix stages keep a LEDGER in ${FILM}/film.json stages.fixes: "round<n>-global" (what the supervising director changed, and hand-offs) and "round<n>-shots" (per routed shot: fixed / partial / skipped with a reason and the word times checked). Review against it: for every id the ledger marks fixed, confirm on its sheet at those times; name any id marked fixed that is not, and re-route partial/skipped ones.`

const CARD = {
  type: 'object',
  properties: {
    scores: { type: 'object', properties: { accuracy: { type: 'number' }, depth: { type: 'number' }, clarity: { type: 'number' }, story: { type: 'number' }, visual: { type: 'number' }, sync: { type: 'number' }, sound: { type: 'number' }, curiosity: { type: 'number' } }, required: ['accuracy', 'depth', 'clarity', 'story', 'visual', 'sync', 'sound', 'curiosity'] },
    issues: { type: 'array', items: { type: 'object', properties: { owner: { type: 'string', enum: ['shot', 'cue', 'line', 'global'] }, id: { type: 'string' }, severity: { type: 'string', enum: ['critical', 'major', 'minor'] }, problem: { type: 'string' }, fix: { type: 'string' } }, required: ['owner', 'severity', 'problem', 'fix'] } },
    best_moments: { type: 'array', items: { type: 'string' } },
  },
  required: ['scores', 'issues', 'best_moments'],
}
const VERDICT = {
  type: 'object',
  properties: {
    pass: { type: 'boolean' },
    scores: { type: 'object', additionalProperties: { type: 'number' } },
    mean: { type: 'number' },
    fixes: {
      type: 'object',
      properties: {
        shots: { type: 'object', additionalProperties: { type: 'string' } },
        cues: { type: 'object', additionalProperties: { type: 'string' } },
        lines: { type: 'object', additionalProperties: { type: 'string' } },
        global: { type: 'array', items: { type: 'string' } },
      },
      required: ['shots', 'cues', 'lines', 'global'],
    },
    fixChecks: {
      type: 'object',
      description: 'per routed SHOT note: the mechanical check generator/film/shot-ledger.mjs runs after the fix stage (key strings looked up in the shot source with comments stripped): present = exact on-screen strings or T.word anchors (e.g. "GARY MARCUS", "\'every\'") the fix must add; absent = strings that must be gone (e.g. "BLEU"); files = extra sources relative to the film\'s app dir (e.g. "sets/ch14-s02-shelf.ts")',
      additionalProperties: { type: 'object', properties: { present: { type: 'array', items: { type: 'string' } }, absent: { type: 'array', items: { type: 'string' } }, files: { type: 'array', items: { type: 'string' } } } },
    },
    summary: { type: 'string' },
    dimensionNotes: { type: 'object', additionalProperties: { type: 'string' }, description: 'per dimension (accuracy, depth, clarity, story, visual, sync, sound, curiosity): one or two plain sentences saying WHY it scored what it did, concrete (shown under the player on the shelf)' },
  },
  required: ['pass', 'scores', 'mean', 'fixes', 'summary', 'dimensionNotes'],
}

const LENSES = [
  { id: 'historian', lens: 'ACCURACY & FAIRNESS: every narrated fact and on-screen text against claims.json/quotes.json; depiction of real people; even-handedness on contested matters, geopolitics and every lab.' },
  { id: 'teacher', lens: 'CLARITY & DEPTH: would a curious 15-year-old follow it and an expert respect it? Are AlexNet and the transformer explained in real depth, step by step, in sync with the pictures? Does each era show what people believed, who dissented, and for how long?' },
  { id: 'story', lens: 'STORY & CURIOSITY: arc, stakes, emotion, pacing across the whole runtime, memorable images, questions planted and paid off; does it feel like a new way to learn?' },
  { id: 'art', lens: 'VISUALS & MOTION: silhouette craft against the reference frame (.orly-work/reference/silhouette-reference.png), composition, light, depth, consistency across shots, legibility, motion pacing and beats landing on words; flag any placeholder cards, broken frames or clutter.' },
  { id: 'sound', lens: 'SOUND: narration pacing and pronunciation risk (lexicon), music fit and development (cue notes, spectrograms), mix loudness and ducking, transitions between cues, silences.' },
]

phase('Review')
const cards = (await parallel(LENSES.map(l => () => agent(`${COMMON}

YOUR LENS: ${l.lens}
Write your scorecard to ${OUT}/${l.id}.json and return it.`, { label: `review:${l.id}`, phase: 'Review', schema: CARD, ...OPUS }).then(c => c && { ...c, reviewer: l.id })))).filter(Boolean)

phase('Showrunner')
const verdict = await agent(`${COMMON}

You are the SHOWRUNNER. Read the five scorecards in ${OUT}/ (${cards.map(c => c.reviewer).join(', ')}). Merge them: each dimension's score is the mean across reviewers, weighting the reviewer whose lens owns it double. The gate PASSES only if every dimension ≥ 8, the mean ≥ ${BAR}, and no critical issue remains. Route every issue to its owner (dedupe; keep the strongest fix): fixes.shots {shotId: notes}, fixes.cues {cueId: notes}, fixes.lines {lineId: notes; a rewrite must stay within the fact-checked bible and roughly keep its length}, fixes.global [notes]. Prefer few, high-leverage fixes over many cosmetic ones. For every shot fix, also write fixChecks[shotId] = {present, absent, files?}: the literal strings a grep of the fixed source must find (new card text, quote text, T.word anchor words in quotes like 'every') and must not find (removed text); keep them short and exact, and leave a purely visual fix with no strings out. Write them to ${OUT}/note-checks.json as well (the ledger's mechanical note check reads it). Also write dimensionNotes: for EVERY dimension one or two plain, concrete sentences saying why it scored what it did (what still holds it back, or what earns it), for a viewer reading the score panel under the film on the shelf. Write ${OUT}/verdict.json (including dimensionNotes) and update ${FILM}/film.json stages.review = {round: ${A.round}, pass, mean, scores, at (ISO from \`date -u +%FT%TZ\`)}.`, { label: 'showrunner', phase: 'Showrunner', schema: VERDICT, ...OPUS })

return { slug: A.slug, round: A.round, ...verdict }
