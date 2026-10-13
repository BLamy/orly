# Authoring models

orly-2 routes **all code and story authoring to Claude Opus 5.5 (`claude-opus-5-5`) at
`high` effort**. That covers research and planning, narration scripts, visual plans,
D3/SVG and Canvas scenes, Three.js, Blender Python, music (Strudel code), pipeline code,
reviews and revisions, for books, series, films, standalone explainers and Storybook
scenes. There is no second authoring model and no fallback model. A user's explicit
task-specific choice takes precedence.

`generator/authoring-models.json` is the machine-readable policy (`author`, `effort`, one
entry per role, `fallback: null`, no `allowedAuxiliaryModels`). Tests
(`npm run test:authoring`) enforce it against the launcher, `.claude/settings.json`,
`package.json` and the CI workflows.

## Roles and sessions

Planning and authoring are **separate sessions of the same model**. A planning session
studies the sources and writes a bounded assignment; a fresh authoring session
implements it without re-planning; a review session checks the result. Splitting
sessions keeps each context small and each unit resumable, not because the roles need
different models.

Use depth when it explains assembly, occlusion, coordinate frames, feature-space
geometry or a real surface. Keep numerical plots and text legible in 2D. Do not turn
every data flow into a 3D scene. Hybrid models share the existing Player's sampled
clock: no second animation loop or physics clock. Verify reverse seeking.

## Entry points

- **Interactive Claude Code** in this repo: `.claude/settings.json` sets
  `"model": "claude-opus-5-5"`, `"effortLevel": "high"`, and pins
  `ANTHROPIC_DEFAULT_OPUS_MODEL`, `ANTHROPIC_DEFAULT_SONNET_MODEL`,
  `ANTHROPIC_DEFAULT_HAIKU_MODEL` and `CLAUDE_CODE_SUBAGENT_MODEL` to `claude-opus-5-5`
  so subagents (including ones that ask for the `haiku` alias) stay on Opus.
- **Workflow scripts** (`.claude/workflows/*.js`): pin every agent explicitly,
  `agent(prompt, { model: 'claude-opus-5-5', effort: 'high' })`.
- **Headless runs** (local or CI) go through the one launcher:

  ```bash
  node generator/run-opus.mjs --role <role> --prompt-file <assignment.md> \
    --output .orly-work/<unit>-result.jsonl \
    [--provenance <unit>-provenance.json] [--max-turns 400] [--dry-run]
  # npm run author -- --role animation2d --prompt-file … --output …
  ```

  It runs `npx --yes @anthropic-ai/claude-code@latest --print --model claude-opus-5-5
  --effort high --output-format stream-json`, never a globally installed `claude` and
  never `--fallback-model`. Roles: `planning`, `research`, `story`, `narrationScript`,
  `animation2d`, `canvas`, `three`, `blenderPython`, `music`, `pipelineCode`, `review`
  (`planning` and `research` also get `WebFetch`/`WebSearch`).

## Provenance

A CLI exit code alone does not prove successful authoring. `run-opus.mjs` reads the
provider result and fails the run when:

- the result `is_error`, or its subtype is an error (max turns, provider/rate limit);
- `modelUsage` lacks `claude-opus-5-5`;
- `modelUsage` lists **any other model**. A default headless Opus session can delegate
  to a Haiku subagent; the alias pins prevent that, and this check catches anything the
  pins miss (for example a subagent that names a full non-Opus model id);
- any assistant turn reports a different model (synthetic rate-limit turns excepted).

`--provenance` writes a compact public record: role, entrypoint, CLI version,
requested and actual model, provider, **requested effort** (the CLI does not echo effort,
so the launcher records it and `effortActive` from the stream's `init` message),
`apiKeySource`, all models seen, subagent count, turns, duration, tokens and cost. The
raw stream stays private in `.orly-work/` (mode 0600, gitignored); keep prompts and
results that contain private sources out of public logs.

The child environment pins the model aliases and **drops `ANTHROPIC_API_KEY`** (scripts
that `loadEnvFile('.env')` would otherwise switch the CLI from the signed-in account to
API-key billing). Set `ORLY_ALLOW_API_KEY=1` only when that switch is intended.

## Provider limits

Never substitute another model on a rate or session limit. Save the assignment and
progress (the unit's ledger entry, the limit's reset time if known) and stop; resume the
same unit later. Authorization to use a provider does not authorize unrelated source
disclosure or production publication.

## Non-authoring model use

These are not code or story, so they may stay on other providers:

- **Narration voice:** ElevenLabs (`eleven_multilingual_v2` for books). The narration
  *text* is Opus-authored.
- **Cover art:** `generator/cover.mjs` (OpenAI `gpt-image-1`) with a `gpt-4o-mini` vision
  QA loop in `generator/seeds.mjs`. An Opus-drawn SVG animal rasterized to
  `animal.png`/`animal.webp` with `--no-cover` is also fine.

## CI

`new-book.yml` and `comment-edit.yml` run an Opus 5.5 planning step
(`run-opus.mjs --role planning`, prompts in `.github/prompts/`) and then an Opus 5.5
authoring step (`--role animation2d`). Series planning happens inside the planning step
(`/tmp/series-plan.json`, fanned out by `fanout-series.sh`). `arxiv-weekly.yml` runs a
`--role research` session. Every collaborator gate, label gate, preflight, partial-work
PR and preview step is unchanged. A PR comment reaches the planner only as a file
(`.orly-work/edit-request.md`), never interpolated into a prompt or shell command.

Credentials (repository secrets, never committed): `CLAUDE_CODE_OAUTH_TOKEN` for all
authoring; `ELEVENLABS_API_KEY` for narration; `OPENAI_API_KEY` only for gpt-image
covers; `NOUN_PROJECT_KEY`/`NOUN_PROJECT_SECRET` for icons. A missing provider fails its
stage without substitution.

The deprecated v2 CLI accepts an Opus-authored `--storyboard` fixture; it never invokes
its historical automatic storyboard planner. Use the scene-native book commands for new
work.

## History

Books and series authored before this policy record what actually wrote them (GPT-6
Astra planning, Claude Fable 5.1 D3 authoring, Codex built-in ImageGen covers), for
example `series/from-rlcd-to-predictive-tab/` and the `author-notes.md`/`visual-plan.md`
files under `apps/bookshelf/src/viz/books/`. That provenance is history and is not
rewritten.
