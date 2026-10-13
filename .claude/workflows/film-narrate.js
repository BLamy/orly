export const meta = {
  name: 'film-narrate',
  description: 'Cast the narrator voice (audition, lexicon), narrate the locked script with ElevenLabs, and build the film clock (timeline.json)',
  whenToUse: 'Stage 3-4 of the film pipeline (after film-story). Writes films/<slug>/voice/, narration/, and the app copy of timeline.json. Args: {slug, repo?, budgetCredits?, shots?: [ids] (re-narrate a subset after line fixes), audition?: bool, voice?: id}',
  phases: [
    { title: 'Voice', detail: 'audition candidates, lock voice.json, build the pronunciation lexicon' },
    { title: 'Narrate', detail: 'dry-run cost, synthesize, assemble timeline.json, verify alignment and runtime' },
  ],
}

const A = args || {}
if (!A.slug) throw new Error('film-narrate needs args.slug')
const REPO = A.repo || '/Users/blamy/Documents/Codex/orly-2'
const FILM = `${REPO}/films/${A.slug}`
const BUDGET = A.budgetCredits || 40000
const OPUS = { model: 'claude-opus-5-5', effort: 'high' }

const COMMON = `You are the voice and narration director for an orly-2 film. Film: ${FILM} (brief.md, story/script.json, research/). Pipeline docs: ${REPO}/docs/film/ARCHITECTURE.md (sections 4 and 6) and ${REPO}/docs/film/research/elevenlabs-narration.md (measured models, settings, ranked archetype voices). Pipeline scripts: ${REPO}/generator/film/{voice,narrate,timeline}.mjs (run each with --help first to confirm flags).
Rules: the narrator is the ARCHETYPE in brief.md (house default: a distinguished mid-life British narrator, forties or fifties, measured, warm, wry; NOT an elderly or old-man voice). Every film has its OWN voice: never lock a voiceId that another film's films/*/voice/voice.json already uses. Never clone, design-to-imitate, or choose a voice because it resembles a real person. Never print or log the ElevenLabs key. Stay within a total budget of ${BUDGET} credits for this run (narrate.mjs keeps the ledger; use --dry-run first). Do not create, clone or add voices to the account without explicit user approval recorded in brief.md; library voices work by id without adding.
When you finish a stage, update ${FILM}/film.json: stages.<voice|narration> = {status, at (ISO time from \`date -u +%FT%TZ\`), summary, provenance: {model: "claude-opus-5-5", effort: "high"}} (create the file if missing; keep other keys).`

const RESULT = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['done', 'blocked', 'failed'] },
    summary: { type: 'string' },
    voice: { type: 'string' },
    credits_spent: { type: 'number' },
    duration_sec: { type: 'number' },
    issues: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'summary', 'issues'],
}

phase('Voice')
const voice = await agent(`${COMMON}

TASK: make sure ${FILM}/voice/voice.json and ${FILM}/voice/lexicon.json are right.
${A.voice ? `The user chose voice id ${A.voice}: lock it.` : `If voice.json exists and audition is not requested (${A.audition ? 'audition IS requested' : 'not requested'}), keep it and only refresh the lexicon. Otherwise audition the top 3-5 archetype candidates from the narration report with \`voice.mjs audition\` on the film's opening paragraph (about 600 characters from story/script.json) on eleven_multilingual_v2, compare measured duration, words per minute (target 100-115 at the chosen speed), loudness consistency and the voices' documented descriptions, then lock the best with \`voice.mjs lock\`. Record the ranking and the reasons in voice/auditions/report.md, and note that a human listening check is still recommended.`}
LEXICON: scan every line of story/script.json for names, acronyms, numbers and terms the voice might mangle (AlexNet, ImageNet, LeCun, Bengio, Schmidhuber, Rosenblatt, Minsky, Papert, Rumelhart, Krizhevsky, Sutskever, Vaswani, Amodei, DeepSeek, GPT, GPU, CUDA, ReLU, LSTM, and so on) and write voice/lexicon.json as {"<written form>": "<spoken form>"} entries used for the voice only (subtitles keep the written text). Prefer the established pronunciation of each person's name.`, { label: 'voice', phase: 'Voice', schema: RESULT, ...OPUS })
if (!voice || voice.status !== 'done') return { slug: A.slug, stage: 'voice', ...(voice || { status: 'failed' }) }

phase('Narrate')
const narr = await agent(`${COMMON}

TASK: narrate ${A.shots?.length ? `ONLY these shots (line fixes): ${A.shots.join(', ')}` : 'the whole locked script'} and rebuild the clock.
1. \`node generator/film/narrate.mjs --slug ${A.slug} --dry-run${A.shots?.length ? ` --shots ${A.shots.join(',')}` : ''}\`: report characters and estimated credits; stop with status "blocked" if the estimate exceeds the remaining budget.
2. Synthesize with the budget cap (cached lines cost nothing), then \`node generator/film/timeline.mjs --slug ${A.slug}\`.
3. Verify: every line aligned exactly (no approximate cues), every line's spoken text matches the script (after the lexicon), no clipped words at clip edges (inspect a few clip boundaries with ffmpeg silencedetect), total runtime against story/meta.json runtimeTargetSec (report the difference), narration loudness (ebur128), and that apps/bookshelf/src/viz/films/${A.slug}/timeline.json was written. Honour the per-line fields in story/script.json: preGap (seconds of silence before the line, default 0.45; wins over the previous line's pauseAfter) and levelDb (a dB offset from the common line level, applied by timeline.mjs as per-line clip gain AFTER the speech compressor and peak stage, so it lands as written). Confirm in timeline.json that each line with a preGap starts preGap seconds after the previous line ends (±1 frame), and in narration/stem.json levels.lines that every line's offsetDb (momentary peak vs the median of the other lines) is within 0.5 dB of its levelDb (0 for lines without one); \`node generator/film/qa.mjs --slug ${A.slug} --stage narration,mix\` checks it as mix.lineLevels. If a runtime ceiling is given (story/meta.json runtimeCeilingSec, or in the review notes) and the clock runs over, shorten the last shot's holdAfter before proposing any line cut.
4. STT as data: narrate.mjs round-trips every line where a lexicon entry fires (or whose script line sets qa.stt "required") through ElevenLabs speech-to-text and writes narration/stt.json {lineId, model, transcript, expectedTerms, pass, sig, at}; and, since review round 3, every line given a NEW take in the run (its pass rule: the transcript matches the current text); re-run \`node generator/film/stt.mjs --slug ${A.slug}${A.shots?.length ? ' --lines <the re-taken line ids>' : ''}\` if it reported errors. Terms must come back LITERALLY (case-insensitive, one accept form: written or lexicon spelling); a sound-alike ("Ahmoudai" for Amodei) fails, and the fix is a better respelling or a re-take, never a looser rule (voice.json sttHeard holds only spellings a human judged to be the same sounds). QA narration.stt FAILS on a missing, failing or stale record (one that transcribes an older take: its lineSig differs from the take's sig): fix the lexicon or the take, never skip it. After a re-take the clock must be rebuilt (step 2) so QA timeline.fresh passes before anything is mixed. STT proves words, not stress: never mark voice/voice.json listening[] entries ok yourself; only a human does that (\`node generator/film/voice.mjs signoff\`). List any pending ones.
Report duration, credits spent, and any issues (lines that sound wrong are not detectable by you: list the lexicon entries most at risk).`, { label: 'narrate', phase: 'Narrate', schema: RESULT, ...OPUS })

return { slug: A.slug, voice, narration: narr }
