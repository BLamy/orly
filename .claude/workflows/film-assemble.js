export const meta = {
  name: 'film-assemble',
  description: 'Mix, render (frame-exact) and QA the film: master audio, MP4 + captions + chapters, contact sheets, automated checks',
  whenToUse: 'Stage 7-8 of the film pipeline (after shots and score). Writes films/<slug>/{mix,render,qa}/ and refreshes the local shelf copy (public/generated/<slug>). Args: {slug, repo?, preview?: bool, workers?, shots?: [ids] (re-sheet only these), publish?: false (skip the local shelf refresh)}',
  phases: [{ title: 'Assemble', detail: 'mix → render → sheets → publish (local) → qa' }],
}

const A = args || {}
if (!A.slug) throw new Error('film-assemble needs args.slug')
const REPO = A.repo || '/Users/blamy/Documents/Codex/orly-2'
const FILM = `${REPO}/films/${A.slug}`

const RESULT = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['done', 'failed'] },
    mp4: { type: 'string' },
    durationSec: { type: 'number' },
    frames: { type: 'number' },
    loudness: { type: 'string' },
    qa: { type: 'object', properties: { pass: { type: 'boolean' }, failures: { type: 'array', items: { type: 'string' } } }, required: ['pass', 'failures'] },
    renderMinutes: { type: 'number' },
    issues: { type: 'array', items: { type: 'string' } },
  },
  required: ['status', 'qa', 'issues'],
}

phase('Assemble')
const r = await agent(`You are the post-production engineer for the orly-2 film at ${FILM}. Read ${REPO}/docs/film/ARCHITECTURE.md sections 8-9 and run each script with --help first to confirm its flags (they are in ${REPO}/generator/film/).
1. Mix: \`node generator/film/mix.mjs --slug ${A.slug}\` (narration + score cues, ducking, loudness -16 LUFS / -1.5 dBTP, chapter slices). Read mix/loudness.json and confirm the targets, including cues[].fade: a fading cue's fade must start at least 1.6 s after its lastStrike (score/cues.json; the mixer delays and shortens a fade that would start sooner, and fails checks.fadeAfterStrike when the window cannot hold it: that is a score problem to report, not to patch here).
2. Render: \`node generator/film/render.mjs --slug ${A.slug}${A.preview ? ' --preview' : ''}${A.workers ? ` --workers ${A.workers}` : ''}\`. Confirm with ffprobe that the frame count equals round(duration × fps), that audio and video lengths match within one frame, and that film.vtt and chapters exist.
3. Contact sheets for ${A.shots?.length ? A.shots.join(', ') : 'every shot'}: \`node generator/film/sheets.mjs --slug ${A.slug}${A.shots?.length ? ` --shot ${A.shots.join(',')}` : ' --all'}\` (they feed the review). If ANY shot's sheet (films/${A.slug}/qa/sheets/<id>.png) is older than apps/bookshelf/src/viz/films/${A.slug}/timeline.json, the clock moved since it was drawn: sheet every shot with --all instead (QA sheets.coverage would list them as stale). The sampling follows each shot's length: a frame at least every 2 s plus one on every timeline beat, so a 40 s shot gets about 30 frames; do not pass --n to thin it.
4. Publish the shelf copy LOCALLY so it matches this render: \`node generator/film/publish.mjs --slug ${A.slug}\` (manifest, chapter audio, captions, library entry; no deploy, no git). Skip only if args.publish === false (${A.publish === false ? 'it IS false: skip' : 'it is not: publish'}).
5. QA: \`node generator/film/qa.mjs --slug ${A.slug}\`; report every failure (publish.current must pass after step 4; narration.stt, narration.clipEdges, narration.pacing, mix.lineLevels, mix.floor and score.analysisSummary must pass (mix.lineMasking and score.cueJoins report music crowding the voice and cue changes under narration: report them as score problems, do not patch here): if analysisSummary fails, run \`node generator/film/score.mjs analyze --slug ${A.slug}\` (no re-render; it rewrites score/analysis/<id>.json and summary.json on the current clock) and re-run QA; narration.listening may warn while a human sign-off is pending).
Fix pipeline problems you can fix without touching shot or story content (flags, missing directories, a crashed worker: re-run its segment). Then update ${FILM}/film.json stages.assemble = {status, at (ISO from \`date -u +%FT%TZ\`), summary}. Report paths, measurements and issues.`, { label: 'assemble', phase: 'Assemble', schema: RESULT, model: 'claude-opus-5-5', effort: 'high' })

return { slug: A.slug, ...(r || { status: 'failed', qa: { pass: false, failures: ['assemble agent returned nothing'] }, issues: [] }) }
