export const meta = {
  name: 'film-understand',
  description: 'Map orly subsystems and probe Strudel, ElevenLabs, frame-exact rendering, and silhouette art direction for the orly-2 film pipeline',
  phases: [{ title: 'Map & Probe', detail: '9 parallel Opus 5.5 readers/probers; full reports in docs/film/research' }],
}

const ORLY = '/Users/blamy/Documents/Codex/orly'
const O2 = '/Users/blamy/Documents/Codex/orly-2'
const WORK = O2 + '/.orly-work'
const DOCS = O2 + '/docs/film/research'
const REF = WORK + '/reference/silhouette-reference.png'
const OPUS = { model: 'claude-opus-5-5', effort: 'high' }

const CONTEXT = `CONTEXT
You are part of a team building "orly-2": an Opus 5.5 fork of the orly framework (an O'RLY-parody bookshelf of narrated, animated explainers built on a pure sample(t) SVG timeline engine) extended to produce long-form (20-40 min), cinematic, artistic, educational ANIMATED FILMS rendered in JavaScript. Target look: silhouette / paper-cut theatre (black cut-out figures and architecture, backlit dusky gradients, haze, candle glow, multiplane depth) like the reference frame at ${REF} (an image file; Read it to view it). Narration: ElevenLabs with a slow, distinguished, elderly British academic voice. Music: composed in Strudel (https://strudel.cc) via browser automation. Output: a frame-exact 1080p MP4 plus playback in the orly app. First pilot film: the history of neural networks (McCulloch & Pitts, Hebb, Rosenblatt's perceptron, Minsky & Papert, the AI winters, backprop, classical ML, deep learning, AlexNet in depth, transformers in depth, ChatGPT, Anthropic, the US-China AI race).

Paths:
- ORIGINAL orly repo (READ-ONLY, never modify anything there): ${ORLY}
- orly-2 fork (git clone, branch opus-5.5): ${O2}. In this phase do NOT modify tracked source files in orly-2.
- Gitignored work dir for probes/scratch files: ${WORK} (put your files under ${WORK}/probes/<your-topic>/)
- Write your FULL report as markdown to the file named in your task, under ${DOCS}/
- ffmpeg 9 with libx264/aac/opus: /opt/homebrew/bin/ffmpeg and /opt/homebrew/bin/ffprobe
- Playwright is installed in ${O2}/node_modules (browsers cached in ~/Library/Caches/ms-playwright). Run node scripts with cwd ${O2} or import from that node_modules path.
- Secrets live in ${O2}/.env (gitignored). Load them in code; NEVER print, log, or write secret values anywhere.

Return a COMPACT structured summary; the full detail belongs in your markdown report. Be concrete: file:line references, exact commands, measured numbers, working code. Verify by reading code or running a probe instead of speculating. If a probe fails, debug it before concluding.`

const REPORT = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'Dense 150-400 word summary of what you learned' },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          topic: { type: 'string' },
          detail: { type: 'string' },
          evidence: { type: 'string', description: 'file:line refs, URLs, commands, or measurements' },
        },
        required: ['topic', 'detail', 'evidence'],
      },
    },
    recommendations: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    artifacts_written: { type: 'array', items: { type: 'string' }, description: 'Absolute paths of reports, scripts, and outputs you wrote' },
  },
  required: ['summary', 'findings', 'recommendations', 'risks', 'artifacts_written'],
}

const TASKS = [
  {
    key: 'pipeline-map',
    prompt: `TASK: Map orly's book production pipeline end to end, as the foundation for a long-form FILM pipeline. Report file: ${DOCS}/orly-pipeline-map.md
Read in ${ORLY}: generator/video.mjs, tts.mjs, scene-captions.mjs, transform.mjs, library.mjs, export-mp4.mjs, verify-book.mjs, regen-chapter.mjs, blog-viz.mjs, validate.mjs (skim), cover.mjs (skim), cli.mjs (skim); apps/bookshelf/src/player/* (BookPlayer, ChapterPlayer, narration-timing, speech, BlogPanel); apps/bookshelf/src/App.tsx routing; a real format-3 manifest (public/generated/explained-neural-nets/manifest.json and one more recent book); the public/generated/library.json entry shape.
Answer precisely: (1) the exact manifest format-3 schema (every field); (2) how narration cues drive scene playback: is scene time warped piecewise to the audio clock? where and how (file:line)? (3) how captions are extracted from TSX scenes (the scene-captions mechanism: does it bundle TSX with esbuild/vite? what does it require of a scene?); (4) export-mp4.mjs approach and its limits for a 30-minute film (real-time recordVideo => dropped/duplicated frames? fps? resolution?); (5) what a 30-minute FILM (about 10 chapters, narration plus a continuous music score mixed under it) would need to also play on the shelf: could a film be a book with kind 'film' whose per-chapter audio is the narration+music mix, sliced from one continuous film mix? what player changes would that need? (6) list concrete reuse points and gaps with file:line refs.`,
  },
  {
    key: 'engine-map',
    prompt: `TASK: Map the viz engine and design a frame-exact render harness plus a long-form "reel" composition layer. Report file: ${DOCS}/viz-engine-map.md
Read in ${ORLY}/apps/bookshelf/src/viz: engine/core/* (timeline.ts, player.tsx, playback.ts, stage.tsx, canvas-layer.tsx, captions.tsx, easing.ts, prng.ts, math.tsx, motion-bus.ts, colors.ts), core/camera-interp.ts, engine/primitives/index.ts (and skim each primitive), engine/acts/*, engine/draw/*, engine/narrator/*, engine/storybook/* (skim), scenes.ts, docstream-engine.tsx, editor/*.
Answer: (1) the full Timeline API surface with exact signatures (channel, tween, set, caption, hold, stagger, sample, duration, overrides, ids, version...); (2) Player/usePlayback: how the clock works, how audio drives time, how to seek programmatically, and whether a scene can be rendered at an arbitrary t synchronously. Design a minimal render-harness page: a route that mounts any registered scene (or a whole reel) WITHOUT the rAF clock and exposes window.__seek(t) returning a Promise that resolves after React commit + paint (double rAF) so Playwright can screenshot frame N exactly; name precisely which components/hooks to reuse or bypass; (3) Stage is a 1280x720 viewBox: confirm it scales crisply to 1920x1080 and 3840x2160; how CanvasLayer handles devicePixelRatio and resizing; (4) composing many "shots" (each its own Timeline with local time) into a 30-minute "reel" with transitions: does anything exist (acts/)? propose the cleanest addition (global t -> active shot(s) + local t, overlap windows for cross-transitions, per-shot duration driven by narration timing); (5) performance traps for heavy SVG (filters, thousands of paths, gradients) and how CanvasLayer can carry atmospherics; (6) the scene module contract (Render + vizScene) and registration via import.meta.glob. Give code-level specifics with file:line refs and sketch the proposed TypeScript interfaces.`,
  },
  {
    key: 'ml-inventory',
    prompt: `TASK: Inventory everything in orly relevant to a film about the history of neural networks, AlexNet, and transformers. Report file: ${DOCS}/ml-asset-inventory.md
Search ${ORLY}/apps/bookshelf/src/viz/explainers/ (list ALL dirs; for every relevant one, e.g. perceptron, backprop, gradient descent, convolution, attention, transformer, embeddings, activation functions, autoencoder, softmax, RNN/LSTM, SVM/classical ML, scaling laws, tokenization, loss landscapes, read its scene.ts captions to learn exactly what it visualizes), ${ORLY}/apps/bookshelf/src/viz/three/ (the AlexNet composition and tensor primitives), ${ORLY}/apps/bookshelf/src/viz/blender/ (svm, loss, vision studies), and the published books in ${ORLY}/public/generated/: explained-neural-nets, explained-classical-ml, explained-llms, explained-ml, explained-sequence-models, explained-training (read each manifest: chapter titles and caption text).
For each asset give: path, what it shows, quality notes, and whether its math/data/choreography can be reused under a different art direction (the film uses a dark sepia silhouette/paper-cut look, so cyan-on-navy 3b1b palettes must be re-skinned): note precisely how palette is applied (core/colors.ts constants vs hardcoded hex) and how hard a re-skin would be. Also extract every factual claim about AI HISTORY found in those books' captions (dates, people, results) into a list, useful later as a cross-check.`,
  },
  {
    key: 'ops-map',
    prompt: `TASK: Map orly's operational layer to plan an all-Opus-5.5 fork. Report file: ${DOCS}/orly-ops-and-model-routing.md
Read in ${ORLY}: CLAUDE.md, AGENTS.md, README.md, docs/authoring-models.md, generator/authoring-models.json, generator/authoring-models.test.mjs, generator/run-fable.mjs, .claude/commands/*.md, .claude/skills/**, .agents/skills/**, .codex/config.toml, .github/workflows/*.yml, .github/scripts/*, .github/ISSUE_TEMPLATE/*, series/from-rlcd-to-predictive-tab/{README.md,build-book.mjs,prepare-assignment.mjs,record-worker.mjs,verify-contract.mjs,verify-narration.mjs,verify-render.mjs,progress.json,provenance.json} (skim), tools/blender/README.md, tools/three/*.
Produce: (1) an EXHAUSTIVE table of every reference to model routing or providers (gpt-6-astra, Astra, claude-fable-5-1, Fable, OpenAI, Codex, ImageGen, gpt-image, CLAUDE_CODE_OAUTH_TOKEN, OPENAI_API_KEY, model ids in CI YAML, npx claude-code invocations) with file:line and the exact replacement needed when ALL planning, story, narration writing, and code (D3/SVG, Canvas, Three.js, Blender Python, music code) use claude-opus-5-5 at high effort. Cover art is image generation (not code/story) and may stay on an image model: list options. Note that orly-2's CLAUDE.md/AGENTS.md routing sections were already rewritten; diff them against orly's to confirm. (2) The CI loop structure (issue -> build -> PR -> preview -> @claude edits -> merge) and what a new "film" issue type and workflow would add. (3) The series/progress/provenance loop conventions worth keeping (bounded assignments, provenance verification, resumability, evidence files). (4) Every test or script that pins model ids and must change.`,
  },
  {
    key: 'strudel-probe',
    prompt: `TASK: Make Strudel (https://strudel.cc) usable as an automated, high-quality music backend driven by browser automation. Report file: ${DOCS}/strudel-music-backend.md ; scripts under ${WORK}/probes/strudel/
RESEARCH first (WebFetch/WebSearch): strudel.cc docs under /learn (getting started, samples, synths, effects, tonal/voicings, visual feedback like pianoroll/punchcard), the uzu/strudel repo README (codeberg or github), how the REPL loads code from a URL (share links / hash encoding), how to start/stop playback programmatically, default sample banks (and soundfonts, e.g. gm_ instruments), @strudel/web package API, any built-in audio export / record / render-to-wav feature, tempo control (setcps / setcpm), and known headless issues.
Then PROBE FOR REAL with Playwright (headless Chromium, flags such as --autoplay-policy=no-user-gesture-required). Goal: a working script ${WORK}/probes/strudel/record-strudel.mjs --code <file> --seconds N --out out.wav that opens strudel.cc, loads the code into the REPL, waits for samples/soundfonts to load, starts playback from cycle 0, captures the audio output LOSSLESSLY (e.g., an addInitScript that taps every AudioContext destination by patching AudioNode.prototype.connect, feeding a ScriptProcessor/AudioWorklet PCM collector or MediaStreamDestination+MediaRecorder; prefer lossless PCM written as WAV), stops after N seconds plus a reverb tail, and writes the file. Verify each WAV with ffmpeg (duration, volumedetect, ebur128 loudness, non-silence) and render a spectrogram PNG (showspectrumpic) that you inspect visually.
Test at least: (a) a drum plus bass pattern on default samples; (b) a slow, melancholic, documentary-score texture (e.g., piano or gm_ soundfont strings/pads with chord voicings, .room, .lpf, .slow; 60-70 BPM feel). Determine: how to guarantee the recording starts at cycle 0; sample/soundfont load times; whether several pages can record in parallel; CPU load; clicks or dropouts; whether rendering faster than real time is possible at all. If strudel.cc automation is flaky, also try a locally served page using @strudel/web (install it under ${WORK}/probes/strudel/, NOT into the repos) and compare.
OPTIONAL "browser use": the session also has Claude in Chrome (mcp__claude-in-chrome__* tools) connected to the user's real Chrome. If you try it, first invoke the claude-in-chrome skill with the Skill tool and load the tools with ONE ToolSearch call; work only in a NEW tab you create and close it when done; keep any audible playback to 5 seconds or less at low gain (the user may be asleep nearby); use it to confirm the REPL UI, evaluation errors, and visual feedback (screenshot a pattern with .pianoroll() or ._punchcard()). Report exact working code, timings, and pitfalls.`,
  },
  {
    key: 'elevenlabs-probe',
    prompt: `TASK: Prepare the ElevenLabs narration back-end for a slow, distinguished, elderly British academic narrator. Report file: ${DOCS}/elevenlabs-narration.md ; scripts under ${WORK}/probes/elevenlabs/
The brief says "Geoffrey Hinton-like". Do NOT clone or imitate any real person's voice (Hinton also appears as a character in the film). Find or plan an archetype instead: elderly British male professor, soft-spoken, unhurried, warm, wry, thoughtful.
The key is ELEVENLABS_API_KEY in ${O2}/.env: load it in code and never print it. RESEARCH current docs (WebFetch elevenlabs.io/docs): models (eleven_v3, eleven_multilingual_v2, flash/turbo) and which support the with-timestamps endpoints; v3 audio tags; the speed voice setting range; stability/similarity/style guidance for documentary narration; max characters per request; previous_text/next_text and request stitching for consistent prosody across many lines; output formats (mp3_44100_192, pcm_44100, wav); the Voice Design (text-to-voice) and Voice Library (shared voices search, adding a library voice) APIs.
Then PROBE (node + fetch, or @elevenlabs/elevenlabs-js from ${O2}/node_modules): (1) GET the subscription and report tier, characters used/limit, reset date, and voice slots; (2) list the account's own voices (name, id, labels, description); (3) search the shared voice library for candidates (age old/middle-aged, accent british, gender male, use cases narration/documentary/audiobook/informative) -> top 10 with ids, descriptions, and preview URLs; download 3-5 previews, measure duration/loudness with ffmpeg and estimate speaking rate; (4) synthesize ONE short test line (250 chars max), e.g. "In nineteen fifty-eight, a psychologist named Frank Rosenblatt built a machine that could learn.", using the best voice already usable on the account, via the with-timestamps endpoint on eleven_multilingual_v2 and, if supported, eleven_v3; save the mp3s, verify alignment arrays, and measure words per minute at speed 1.0 and at a slower speed setting. Keep total synthesis spend under about 1,500 characters. Do NOT create, clone, design-and-save, or add voices to the account in this phase.
Recommend: model, ranked voice candidates (and whether each needs adding to the account), voice settings, request strategy for about 5,000 words with consistent prosody plus exact per-line timing, the character cost, and how to fit it in the remaining quota.`,
  },
  {
    key: 'cli-workflows',
    agentType: 'claude-code-guide',
    prompt: `TASK: Answer precisely with sources (docs URLs or literal --help output). Return everything in your structured output (you cannot write files).
(1) Claude Code saved workflows: the Workflow tool runs saved scripts by name from .claude/workflows/<name>.js (project scope). Confirm the user-scope path (~/.claude/workflows/?), whether the registry refreshes mid-session or only at startup, the script contract (export const meta {name, description, whenToUse, phases}; args; agent() opts model/effort/isolation/agentType; workflow() nesting limits), and how a user invokes one (slash command by name? /workflows UI?).
(2) Headless Claude Code CLI for an automated authoring launcher: run npx --yes @anthropic-ai/claude-code@latest --help (do NOT run any prompt that consumes tokens). Report exact flags for model selection (--model claude-opus-5-5), reasoning effort (is there an --effort flag, an env var, or a settings key such as effortLevel?), --output-format json fields useful for provenance (modelUsage, is_error, subtype, total_cost_usd), --max-turns, --allowedTools, --permission-mode, --append-system-prompt, and running in CI with CLAUDE_CODE_OAUTH_TOKEN.
(3) The /loop skill and CronCreate / scheduled routines: how a user can run a saved workflow or slash command repeatedly (self-paced /loop vs fixed interval, cloud routines), and constraints.
(4) Project .claude/settings.json keys for default model and default effort.`,
  },
  {
    key: 'render-probe',
    prompt: `TASK: Determine the fastest RELIABLE way to render React/SVG timeline scenes frame-exactly to a 1920x1080 H.264 MP4 on this machine (Apple M4 Max, 16 cores, 128 GB). Report file: ${DOCS}/frame-exact-rendering.md ; benchmark under ${WORK}/probes/render/
Build a self-contained benchmark: an HTML page with a heavy, art-directed frame typical of a silhouette film (layered black silhouette paths with roughly 2-5k path segments, radial and linear gradients, a feGaussianBlur glow filter, a semi-transparent fog layer, and a canvas grain overlay) whose content is a pure function of t, exposed as window.renderAt(t) returning a Promise resolved after paint.
Measure ms/frame for: page.screenshot PNG vs JPEG (quality 90-95); CDP Page.captureScreenshot with optimizeForSpeed; CDP HeadlessExperimental.beginFrame with chrome-headless-shell flags (--deterministic-mode / --enable-begin-frame-control / --run-all-compositor-stages-before-draw) if it works; deviceScaleFactor 1.5 (1280x720 viewport -> 1920x1080 pixels) vs a native 1920x1080 viewport; GPU vs SwiftShader raster flags. Pipe frames into ffmpeg (image2pipe -> libx264, -pix_fmt yuv420p, crf 16-18, preset medium/slow) and measure end-to-end fps; test N parallel workers (2, 4, 8, 12), each rendering a time slice to its own segment, then concatenate with the concat demuxer WITHOUT re-encoding and verify with ffprobe that frame count and duration equal the expectation (no gaps or duplicates at segment seams). Check determinism: identical pixels for the same t across runs, including with feTurbulence/blur filters. Check font loading (a Google Font via @font-face must be loaded before frame 0).
Recommend: architecture, worker count, frame format, encoder settings, expected wall-clock for a 35-minute film at 24 fps and at 30 fps, and pitfalls. Leave a reusable, documented script (render-bench.mjs) in the probe dir.`,
  },
  {
    key: 'art-direction',
    prompt: `TASK: Be the art director for a long-form educational animated film rendered in JavaScript (SVG + Canvas2D on deterministic timelines). Report file: ${DOCS}/silhouette-style-bible.md
Study the reference frame at ${REF} (Read it; it is an image): a silhouette/paper-cut frame from a 35-minute film. Black cut-out figures in 17th-century dress, gothic windows backlit with dusky rose light, haze, candle glow, a checkered floor, ornate furniture, several depth layers. Research the lineage and techniques (Lotte Reiniger's cut-out animation and multiplane camera, Michel Ocelot, the "Tale of the Three Brothers" sequence, shadow puppetry, modern silhouette games like Limbo) and translate them into an implementable, procedural style system:
(1) palette and lighting model (backlight gradients per mood: hex ramps for dusk-rose, candle-amber, winter-blue, lab-green, dawn-gold, server-room cyan; atmospheric perspective per depth layer; bloom/glow; rim light);
(2) a depth/multiplane parallax model (layers with z, camera dolly/pan/zoom producing parallax, fog between layers; exact numbers for parallax factor, haze opacity, and blur per layer);
(3) character design for articulated silhouette puppets across eras 1940s->2020s (period suits, lab coats, sweaters, hoodies, hairstyles, glasses, beards; profile-first readability; hands and gesture language; jointed rigs with pivot points; limited animation "on twos" for puppets vs smooth camera);
(4) the prop and architecture vocabulary this film needs (a 1940s Chicago study, Dartmouth 1956, the Mark I Perceptron with its plugboard of wires and photocell "retina", a Cornell lab, the 1969 Perceptrons book, the AI-winter landscapes, 1980s labs with CRTs, Bell Labs check reading, a 2012 bedroom with two GPUs, modern offices, data centers, chips, US/China geopolitics staged elegantly);
(5) visual metaphors that TEACH the technical ideas in the same art language (neurons as lanterns, weights as strings on a loom, gradient descent as a traveller descending misty hills, convolution as a stencil-lantern sliding over a tapestry, attention as threads of light between words, the winter as literal snow, scaling as a growing city);
(6) typography for title cards, date stamps, and quotes (Google Fonts candidates with weights);
(7) texture and finish (paper grain, film grain, vignette, gate weave, subtle flicker) done cheaply and deterministically;
(8) transitions (iris, ink bleed, paper fold, match cuts);
(9) "don'ts" that make silhouette work look cheap.
Deliver a concrete style bible with numbers (hex palettes per mood, blur radii, opacity per depth layer, stroke widths, font names) and pseudo-code recipes for SVG/Canvas. Do NOT write the film's story.`,
  },
]

phase('Map & Probe')
const results = await parallel(TASKS.map(t => () =>
  agent(`${CONTEXT}\n\n${t.prompt}`, { label: t.key, phase: 'Map & Probe', schema: REPORT, ...OPUS, ...(t.agentType ? { agentType: t.agentType } : {}) })
    .then(r => ({ key: t.key, ...r }))
))
const ok = results.filter(Boolean)
log(`${ok.length}/${TASKS.length} reports returned`)
const missing = TASKS.map(t => t.key).filter(k => !ok.some(r => r.key === k))
if (missing.length) log(`MISSING: ${missing.join(', ')}`)
return { reports: ok, missing }
