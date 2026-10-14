export const meta = {
  name: 'film-story',
  description: 'Write the film: competing treatments, judge panel, outline, parallel chapter scripts, voice pass, and a reviewer loop until the story rubric passes',
  whenToUse: 'Stage 2 of the film pipeline (after film-research). Writes films/<slug>/story/{treatment.md, outline.json, chapters/*.json, script.json, script.md, reviews/}. Args: {slug, repo?, runtimeTargetMin?, wordsPerMinute?, maxRounds?, bar?, onlyReview?}',
  phases: [
    { title: 'Treatments', detail: 'three writers, three distinct creative angles' },
    { title: 'Judging', detail: 'three judges score every treatment; winner + grafts' },
    { title: 'Outline', detail: 'head writer: final treatment, chapter/shot outline, cast registry' },
    { title: 'Chapters', detail: 'chapter writers in parallel, then a single voice pass' },
    { title: 'Review', detail: 'four lenses score the script; revisers fix; loop until the bar' },
  ],
}

const A = args || {}
if (!A.slug) throw new Error('film-story needs args.slug')
const REPO = A.repo || '/Users/blamy/Documents/Codex/orly-2'
const FILM = `${REPO}/films/${A.slug}`
const ST = `${FILM}/story`
const RUNTIME = A.runtimeTargetMin || 32
const WPM = A.wordsPerMinute || 95 // narration words per film minute, pauses and music moments included
const WORDS = Math.round(RUNTIME * WPM)
const MAX_ROUNDS = A.maxRounds || 3
const BAR = A.bar || 8.5
const OPUS = { model: 'claude-opus-5-5', effort: 'high' }

const COMMON = `You are part of the writing team for an educational animated documentary made by the orly-2 film pipeline.
Read before writing: ${FILM}/brief.md (the request and guardrails), ${FILM}/research/bible.md (the ONLY source of facts; claims.json and quotes.json beside it), ${REPO}/docs/film/ARCHITECTURE.md (how films are made), and the types FilmScript/ScriptChapter/ScriptShot/ScriptLine/ScriptBeat/PuppetSpec in ${REPO}/apps/bookshelf/src/viz/film/contracts.ts (the script format).
The look is silhouette / paper-cut theatre (style bible: ${REPO}/docs/film/research/silhouette-style-bible.md; kit catalogue, if present: ${REPO}/docs/film/kit-catalog.md). Every shot is drawn as black cut-out figures and sets against luminous backlight with haze, plus "teaching machines": lantern networks, loom threads, stencil lanterns, misty-hill landscapes, threads of light, parchment plates.
The narrator: the archetype in brief.md (house default: a distinguished, mid-life British narrator in his forties or fifties, NOT elderly; never named, never a real person), measured and warm, wry, curious, precise; a teacher who loves the story. Target: ${RUNTIME} minutes ≈ ${WORDS} narration words in total (a slow voice, with room for music and silence).
Hard rules: every fact traces to the bible (record claim ids in shot.claims); quotes only from quotes.json, verbatim and attributed (QUOTE INTEGRITY: never re-spell, re-punctuate or "house-style" text inside quotation marks, on screen or in narration, and never edit research/quotes.json: a British-spelling pass once turned LeCun's 1998 "checks" into "cheques"; \`script.mjs assemble\` fails on any quoted span that is not verbatim in quotes.json and on any quotes.json text that differs from research/quotes.lock.json); keep the quotation marks in \`spoken\` too, so the voice reads a quote as a quote; never put invented words in a real person's mouth; fair and even-handed on contested matters, geopolitics and every lab (including Anthropic); write narration FOR THE EAR (short sentences, no lists of acronyms, numbers spoken naturally, names easy to say; put exact symbols on screen instead).
RESUMABLE: if your output file already exists from an interrupted run, read it and continue rather than starting over.`

const SCORECARD = {
  type: 'object',
  properties: {
    scores: {
      type: 'object',
      properties: {
        accuracy: { type: 'number' }, depth: { type: 'number' }, clarity: { type: 'number' }, story: { type: 'number' },
        curiosity: { type: 'number' }, visual: { type: 'number' }, voice: { type: 'number' },
      },
      required: ['accuracy', 'depth', 'clarity', 'story', 'curiosity', 'visual', 'voice'],
    },
    critical: { type: 'array', items: { type: 'string' }, description: 'issues that must be fixed (factual errors, invented quotes, missing required topics)' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          where: { type: 'string', description: 'chapter id, shot id or line id' },
          problem: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['where', 'problem', 'fix'],
      },
    },
    strengths: { type: 'array', items: { type: 'string' } },
  },
  required: ['scores', 'critical', 'issues', 'strengths'],
}

const TREATMENT = {
  type: 'object',
  properties: {
    angle: { type: 'string' },
    path: { type: 'string' },
    logline: { type: 'string' },
    title: { type: 'string' },
    chapters: { type: 'array', items: { type: 'string' } },
  },
  required: ['angle', 'path', 'logline', 'title', 'chapters'],
}

const JUDGEMENT = {
  type: 'object',
  properties: {
    ranking: { type: 'array', items: { type: 'string' }, description: 'treatment angle ids, best first' },
    scores: { type: 'array', items: { type: 'object', properties: { angle: { type: 'string' }, total: { type: 'number' }, why: { type: 'string' } }, required: ['angle', 'total', 'why'] } },
    grafts: { type: 'array', items: { type: 'string' }, description: 'specific ideas from non-winning treatments worth grafting onto the winner' },
  },
  required: ['ranking', 'scores', 'grafts'],
}

const OUTLINE = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    chapters: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' }, title: { type: 'string' }, minutes: { type: 'number' }, words: { type: 'number' },
          shots: { type: 'number' }, summary: { type: 'string' },
        },
        required: ['id', 'title', 'minutes', 'words', 'shots', 'summary'],
      },
    },
  },
  required: ['title', 'chapters'],
}

const CHAPTER_DONE = {
  type: 'object',
  properties: {
    chapters: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, path: { type: 'string' }, shots: { type: 'number' }, words: { type: 'number' } }, required: ['id', 'path', 'shots', 'words'] } },
    notes: { type: 'string' },
  },
  required: ['chapters', 'notes'],
}

const ASSEMBLE = `node ${REPO}/generator/film/script.mjs assemble --slug ${A.slug}`

const mean = s => Object.values(s).reduce((a, b) => a + b, 0) / Object.values(s).length

// ---------------------------------------------------------------------------
// 1-3: treatments, judging, outline (skipped when the outline already exists and onlyReview is set)
// ---------------------------------------------------------------------------
let outline = null
if (!A.onlyReview) {
  phase('Treatments')
  const ANGLES = [
    { id: 'mystery', brief: 'A MYSTERY in reverse: open on a modern wonder (a machine answering in fluent prose) and ask how on earth this happened; then go back to 1943 and solve it clue by clue, with each era leaving a clue and a false trail.' },
    { id: 'beliefs', brief: 'THE BELIEF OF THE AGE: the film is built from what each era was SURE of, who doubted it, and how long the certainty lasted before it broke. A recurring device marks every belief (its holders, its dissenters, its lifespan) so the viewer feels how knowledge actually moves.' },
    { id: 'people', brief: 'PEOPLE AND PERSISTENCE: follow a handful of human beings across decades (believers, sceptics, outsiders), their bets, their exile during the winters, their vindication or not; ideas as relay batons passed between hands.' },
  ]
  const treatments = (await parallel(ANGLES.map(a => () => agent(`${COMMON}

Write a TREATMENT for this film from this angle: ${a.brief}
It must satisfy the brief completely (all eras, debates, beliefs and dissenters with how long beliefs held, the experiments, classical ML, both winters, ChatGPT, Anthropic, the US-China race) and give AlexNet and the transformer real in-depth explanatory sequences built on teaching machines.
Include: title; logline; chapter list with minutes (total ${RUNTIME}); the recurring narrative and visual devices; how each deep dive teaches (step by step, with the metaphor machine); the first 60 seconds in shot-by-shot detail with narration; the ending; the emotional arc; where curiosity is planted and paid off; 5 "unforgettable images".
Write it to ${ST}/treatments/${a.id}.md and return the summary.`, { label: `treatment:${a.id}`, phase: 'Treatments', schema: TREATMENT, ...OPUS }).then(r => r && { ...r, angle: a.id })))).filter(Boolean)
  if (!treatments.length) throw new Error('no treatments produced')

  phase('Judging')
  const LENSES = [
    'a curious 15-year-old and their science teacher watching together: is it clear, wondrous, and does it make you want to learn more?',
    'a documentary story editor: structure, stakes, emotion, pacing over 30+ minutes, memorability, and whether the visual ideas are cinematic rather than diagrammatic',
    'a historian of AI: accuracy against the bible, fairness to all sides, completeness of what the brief demands, and depth of the AlexNet and transformer sequences',
  ]
  const judgements = (await parallel(LENSES.map((lens, i) => () => agent(`${COMMON}

You are a judge. Your lens: ${lens}
Read these treatments: ${treatments.map(t => `${t.angle} -> ${t.path}`).join('; ')}. Score each out of 100 against the brief and your lens, rank them, and list specific ideas from the non-winners worth grafting onto the winner.`, { label: `judge:${i + 1}`, phase: 'Judging', schema: JUDGEMENT, ...OPUS })))).filter(Boolean)
  const points = {}
  for (const j of judgements) j.ranking.forEach((angle, idx) => { points[angle] = (points[angle] || 0) + (treatments.length - idx) })
  const winner = Object.entries(points).sort((a, b) => b[1] - a[1])[0][0]
  const grafts = judgements.flatMap(j => j.grafts)
  log(`treatment winner: ${winner} (${JSON.stringify(points)})`)

  phase('Outline')
  outline = await agent(`${COMMON}

You are the HEAD WRITER. The judges chose the "${winner}" treatment (${treatments.find(t => t.angle === winner).path}); also read the others in ${ST}/treatments/. Grafts the judges recommend:
${grafts.map(g => `- ${g}`).join('\n')}
Write:
1. ${ST}/treatment.md: the final treatment (the winner improved by the best grafts), including a "Voice of the narrator" section with 8-10 sample lines that set the tone, and a "Recurring devices" section.
2. ${ST}/outline.json: chapters (id ch01…, title, minutes, words, shot count, summary) summing to about ${RUNTIME} minutes and ${WORDS} words; and per chapter a shot list skeleton (id chNN-sNN, kind, setting, era, mood, one-line purpose, the teaching machine if any).
3. ${ST}/meta.json: {"slug":"${A.slug}","title","subtitle","logline","runtimeTargetSec":${RUNTIME * 60},"vhs":{"subject","theme","icons","tagline"}}. The "vhs" block is the shelf sleeve: films stand on the shelf as early-90s educational VHS tapes (apps/bookshelf/src/library/vhs.ts). subject = the banner (e.g. "Computer Science"); theme = one of cosmos | grid | jungle | lab | ocean | sunset; icons = 2-4 clip-art names from VHS_ICONS (neuron, brain, chip, atom, globe, rocket, lightbulb, crt, robot, dna, planet, flask, gear, book, magnifier), hero first; tagline = one short, period-appropriate exclamation.
4. ${ST}/cast.json: the recurring characters as PuppetSpec entries plus name, role and firstAppearance, using the bible's appearance notes (respectful silhouette signatures; never caricature).
Return the outline summary.`, { label: 'head-writer', phase: 'Outline', schema: OUTLINE, ...OPUS })
  if (!outline?.chapters?.length) throw new Error('head writer returned no chapters')

  // -------------------------------------------------------------------------
  // 4: chapters in parallel (two chapters per writer for continuity), then a voice pass
  // -------------------------------------------------------------------------
  phase('Chapters')
  const groups = []
  for (let i = 0; i < outline.chapters.length; i += 2) groups.push(outline.chapters.slice(i, i + 2))
  const written = (await parallel(groups.map((g, gi) => () => agent(`${COMMON}

You are a CHAPTER WRITER. Read ${ST}/treatment.md, ${ST}/outline.json and ${ST}/cast.json first. Write these chapters: ${g.map(c => `${c.id} "${c.title}" (~${c.minutes} min, ~${c.words} words, ${c.shots} shots)`).join('; ')}.
For each chapter write ${ST}/chapters/<chapterId>.json as a ScriptChapter (contracts.ts): every shot with id, kind, setting (place, year, time of day), era, mood (one of the palette moods), lines (L-ids unique across the film: use L<chapter number><two-digit index>, e.g. L0301), leadIn/holdAfter/minDuration where useful, a rich "visual" direction (staging, camera move, what transforms, which teaching machine and exactly what it shows), beats anchored to specific words, cast ids, props, onScreenText (titles, place/date stamps, name cards on first appearance, verbatim quotes, equations; each cued by a beat, with an 'until' beat id when the camera carries it out of frame before the shot ends, so reading time is measured to its exit), music intent (music.note: mood, intensity, what the music does), transitionIn, and claims (ids from claims.json).
Narration: the narrator's voice from treatment.md; 1-3 sentences per line; written for the ear. Deep-dive shots must explain real mechanics step by step, in sync with the machine.
Then run \`${ASSEMBLE} --check\` to validate your chapters (ids, anchors, claim ids, cast ids) and fix anything it reports in YOUR chapters. Return one entry per chapter you wrote.`, { label: `chapters:${g.map(c => c.id).join('+')}`, phase: 'Chapters', schema: CHAPTER_DONE, ...OPUS })))).filter(Boolean)
  log(`chapter writers finished: ${written.length}/${groups.length}`)

  await agent(`${COMMON}

You are the SCRIPT EDITOR doing the VOICE PASS. Read ${ST}/treatment.md, ${ST}/meta.json, ${ST}/cast.json and every file in ${ST}/chapters/ in order. Edit the chapter files in place so the narrator is ONE consistent voice across the film; smooth every chapter seam; make the recurring devices and motifs recur; keep the word budget (~${WORDS}); keep ids unique; preserve every claim id; spelling and style edits SKIP everything inside quotation marks (verbatim quotes keep their source spelling, US or British). Then run \`${ASSEMBLE}\`, which validates and writes ${ST}/script.json and ${ST}/script.md; fix whatever it reports and re-run until it is clean. Report the total word count and the estimated runtime it prints.`, { label: 'voice-pass', phase: 'Chapters', ...OPUS })
}

// ---------------------------------------------------------------------------
// 5: review loop
// ---------------------------------------------------------------------------
phase('Review')
const REVIEWERS = [
  { id: 'historian', lens: `ACCURACY AND FAIRNESS. Check every factual statement and on-screen text against ${FILM}/research/claims.json and quotes.json; flag anything unsupported, any paraphrase presented as a quote, any unfairness, and any requirement of the brief that is missing or thin. Score "accuracy" strictly.` },
  { id: 'teacher', lens: 'CLARITY AND DEPTH for a curious 15-year-old and an expert at once: are terms introduced before use, are the AlexNet and transformer sequences genuinely in-depth and correct, does each era make clear what people believed, who dissented and for how long? Score "depth" and "clarity" strictly.' },
  { id: 'story-editor', lens: 'STORY, CURIOSITY AND VOICE: arc, stakes, emotion, pacing over 30+ minutes, memorable images, planted-and-paid-off questions, and whether every line sounds beautiful read aloud by a slow, wry, warm narrator. Score "story", "curiosity" and "voice" strictly.' },
  { id: 'art-director', lens: `VISUAL DIRECTION: does every shot have a specific, ambitious, drawable visual idea in the silhouette language that TEACHES (not talking heads, not boxes and arrows); are moods, staging, transitions and teaching machines used well; is it feasible with the kit (${REPO}/docs/film/kit-catalog.md if present, else ${REPO}/apps/bookshelf/src/viz/film/)? Score "visual" strictly.` },
]
// Resume: startRound picks up a round whose cards are already on disk (reuseCards: true loads them instead of
// re-reviewing); `chapters` limits that round's revisers to the chapters that did not finish.
let round = (A.startRound || 1) - 1
let verdict = null
const CARDS = { type: 'object', properties: { cards: { type: 'array', items: { ...SCORECARD, properties: { ...SCORECARD.properties, reviewer: { type: 'string' } } } } }, required: ['cards'] }
const incomplete = (stage, extra) => ({ slug: A.slug, status: 'incomplete', stage, round, ...extra,
  resume: { slug: A.slug, onlyReview: true, startRound: round, reuseCards: stage !== 'review', ...(extra?.chapters ? { chapters: extra.chapters } : {}) } })
while (round < MAX_ROUNDS) {
  round++
  const reuse = A.reuseCards && round === A.startRound
  const cards = reuse
    ? ((await agent(`Load the existing story review cards for round ${round}: ${REVIEWERS.map(r => `${ST}/reviews/round-${round}-${r.id}.json`).join(', ')}. Print them with one node command and return them VERBATIM as {cards:[...]} (set reviewer to the file's reviewer id). Do not edit or judge anything.`, { label: `load-cards:r${round}`, phase: 'Review', schema: CARDS, ...OPUS }))?.cards || []).filter(Boolean)
    : (await parallel(REVIEWERS.map(r => () => agent(`${COMMON}

You are a REVIEWER (round ${round}). Lens: ${r.lens}
Read ${ST}/script.json (and script.md). RUNTIME is measured by \`${ASSEMBLE} --check\` at the locked narrator's pace (voice/voice.json): run it and accept its estimate; do not re-estimate runtime by hand at other paces. Runtime is critical only if that check reports a runtime ERROR or an estimate outside the brief's range. Score each dimension 1-10 (be demanding: 8 means genuinely excellent; reserve 9-10 for exceptional) — score all seven dimensions, but focus on your lens. List critical issues and concrete issues with exact locations and fixes. Write your card to ${ST}/reviews/round-${round}-${r.id}.json and return it.`, { label: `review:${r.id}:r${round}`, phase: 'Review', schema: SCORECARD, ...OPUS }).then(c => c && { ...c, reviewer: r.id })))).filter(Boolean)
  // A missing card (provider/usage limit) must stop the loop: scoring a partial panel would be meaningless.
  if (cards.length < REVIEWERS.length) return incomplete('review', { got: cards.map(c => c.reviewer) })
  // each reviewer is authoritative on its own lens dimensions; others contribute at half weight
  const OWN = { historian: ['accuracy'], teacher: ['depth', 'clarity'], 'story-editor': ['story', 'curiosity', 'voice'], 'art-director': ['visual'] }
  const dims = ['accuracy', 'depth', 'clarity', 'story', 'curiosity', 'visual', 'voice']
  const agg = {}
  for (const d of dims) {
    let w = 0, s = 0
    for (const c of cards) { const k = (OWN[c.reviewer] || []).includes(d) ? 1 : 0.5; w += k; s += k * (c.scores[d] ?? 0) }
    agg[d] = w ? +(s / w).toFixed(2) : 0
  }
  const critical = cards.flatMap(c => c.critical.map(x => `[${c.reviewer}] ${x}`))
  const m = +mean(agg).toFixed(2)
  const pass = critical.length === 0 && dims.every(d => agg[d] >= 8) && m >= BAR
  verdict = { round, scores: agg, mean: m, critical, pass }
  log(`story review round ${round}: mean ${m} ${JSON.stringify(agg)} critical=${critical.length} -> ${pass ? 'PASS' : 'revise'}`)
  if (pass) break
  if (round >= MAX_ROUNDS) break
  const issues = cards.flatMap(c => c.issues.map(i => ({ ...i, reviewer: c.reviewer })))
  const byChapter = {}
  for (const i of issues) { const ch = (i.where.match(/ch\d+/) || ['global'])[0]; (byChapter[ch] ||= []).push(i) }
  const reviseNotes = ch => `${critical.length ? `CRITICAL (must fix wherever it applies to your scope):\n${critical.map(c => `- ${c}`).join('\n')}\n` : ''}${(byChapter[ch] || []).map(i => `- [${i.reviewer}] ${i.where}: ${i.problem} -> ${i.fix}`).join('\n')}`
  const chapterIds = Object.keys(byChapter).filter(ch => ch !== 'global' && (!reuse || !A.chapters || A.chapters.includes(ch)))
  const revised = await parallel(chapterIds.map(ch => () => agent(`${COMMON}

You are a REVISER (round ${round}) for chapter ${ch}. Edit ONLY ${ST}/chapters/${ch}.json (other revisers are editing other chapter files in parallel). Keep ids stable, keep the word budget, never add unsupported facts. Apply:
${reviseNotes(ch)}
Some notes may already be applied by an interrupted earlier reviser: check before editing.
Then run \`${ASSEMBLE} --check\` and fix every ERROR and warning it reports for your chapter (unreadable on-screen text: shorten it, cue it earlier or raise holdAfter). The film-wide runtime line belongs to the script editor; only cut for runtime where your notes ask.`, { label: `revise:${ch}:r${round}`, phase: 'Review', ...OPUS }).then(r => r ?? null)))
  const failedCh = chapterIds.filter((ch, i) => revised[i] == null)
  if (failedCh.length) return incomplete('revise', { chapters: failedCh })
  const wrap = await agent(`${COMMON}

You are the SCRIPT EDITOR (round ${round} wrap-up). ${byChapter.global ? `Apply these film-wide notes (you may edit ${ST}/meta.json, ${ST}/cast.json and any chapter file; revisers have finished):\n${reviseNotes('global')}\n` : ''}Re-read the chapters for seams the revisions may have broken.
Then do a READ-ALOUD EAR PASS over the WHOLE film in order (script.md), as a first-time listener who cannot see the screen: every term, name, number and device must be set up ALOUD before it is relied on (on-screen text does not count); every callback must remind the ear who or what it refers to; pronouns need spoken antecedents; one metaphor per meaning (never reuse an image for two things); no clusters of bare numbers; dates spoken when an era starts; phrases a slow voice can say without stumbling. Fix what you find with the smallest edits, inside the bible and the word budget.
Then run \`${ASSEMBLE}\`: it must exit 0. Its runtime gate is measured at the narrator's pace (voice.json, else 140 wpm); if it reports the film over the target, cut words and air (holds, lead-ins, minDuration) from lines that carry no unique claim, protecting the deep-dive mechanics, attributions and fairness clauses. Clear every unreadable-text error and as many reading-time warnings as you can.`, { label: `assemble:r${round}`, phase: 'Review', ...OPUS })
  if (wrap == null) return incomplete('assemble', { chapters: [] })
}

await agent(`Write ${ST}/status.json as {"status":"done","round":${round},"pass":${!!verdict?.pass},"mean":${verdict?.mean ?? 'null'},"at":<ISO time from \`date -u +%FT%TZ\`>} and nothing else.`, { label: 'mark-done', phase: 'Review', ...OPUS })
return { slug: A.slug, status: 'done', script: `${ST}/script.json`, outline: outline && outline.chapters.map(c => c.id), verdict }
