# orly operational layer and the all-Opus-5.5 routing plan

Scope: map every model/provider reference in the original orly repo
(`/Users/blamy/Documents/Codex/orly`, read-only), confirm what orly-2 has already
changed, describe the CI loop and what a "film" issue type adds, and list the series
conventions and model-pinning tests that must change. Target policy: **every piece of
planning, research, story, narration writing, and code (D3/SVG, Canvas, Three.js,
Blender Python, Strudel music code, pipeline code) is authored by `claude-opus-5-5` at
`high` effort**. Cover art (image generation) may stay on an image model.

All line numbers below are for orly @ `51ee450`. orly-2 is the same commit; only
`CLAUDE.md`, `AGENTS.md`, `.claude/settings.json` differ (plus untracked
`.claude/workflows/`), so every other line number applies to orly-2 unchanged.

---

## 0. Verified facts (probes, 2026-10-05)

Probe directory: `/Users/blamy/Documents/Codex/orly-2/.orly-work/probes/ops-routing/`.

| Fact | Evidence |
| --- | --- |
| Latest CLI is `2.1.289`, and it has `--effort <low\|medium\|high\|xhigh\|max>` and `--fallback-model` | `npx --yes @anthropic-ai/claude-code@latest --version` / `--help` |
| `--max-turns` is accepted although it is hidden from `--help` | probe runs with `--max-turns 2` succeeded |
| `--model claude-opus-5-5 --effort high --print --output-format json` works. `modelUsage` is keyed `claude-opus-5-5` with `canonicalModel: "claude-opus-5-5"`, `provider: "firstParty"` and `thinkingTokens`. Cost was about $0.09 for a trivial prompt, mostly cache creation. | `opus-probe.json` |
| **Effort is NOT echoed in the result.** Only the stream-json `init` message has `per_turn_effort_active: true`, so the launcher must record the requested effort itself. | `opus-stream.jsonl` line 1 |
| stream-json `init` gives `model`, `claude_code_version`, `apiKeySource`, `permissionMode` | `opus-stream.jsonl` |
| **A headless Opus run CAN spawn a Haiku subagent by default.** `modelUsage` then lists `claude-opus-5-5` plus `claude-haiku-4-5-20251001`. orly's `verifyResult` explicitly allows any `*haiku*` model (`generator/run-fable.mjs:18`), so a Haiku-authored contribution would pass today. | `sub-default.json` |
| `CLAUDE_CODE_SUBAGENT_MODEL=claude-opus-5-5` alone does **not** stop an explicit `model:"haiku"` subagent | `sub-only-subagentvar.json` (still lists haiku) |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL=claude-opus-5-5` **does** remap it, so only Opus appears | `sub-only-haikuvar.json`, `sub-pinned.json` |
| `.env` contains `ANTHROPIC_API_KEY` as well as `ELEVENLABS_API_KEY`, `OPENAI_API_KEY`, `NOUN_PROJECT_KEY/SECRET` (names only; values not read) | `sed 's/=.*/=<redacted>/' .env` |
| `@anthropic-ai/sdk` (package.json:43) is not imported anywhere. It is a dead devDependency. | grep of tracked js/mjs/ts |
| Seven generator/series scripts call `process.loadEnvFile('.env')` and then pass `process.env` to children. A launcher spawned from them would inherit `ANTHROPIC_API_KEY` and could switch auth or billing from the OAuth subscription to the API key. | `generator/{add-chapter,cli,enhance-book,regen-chapter,setup-seeds,video}.mjs`, `series/.../build-book.mjs:12` |
| The draft launcher passes its tests and a live end-to-end run | `draft/run-opus.mjs`, `draft/run-opus.test.mjs` (4/4 pass), `e2e-provenance.json` |
| orly's working tree has **uncommitted** CI changes that orly-2 does not have: `.github/scripts/check-cloudflare.mjs` (untracked) and edits to `deploy.yml`/`preview.yml` that call it | `git -C orly status`; `diff -rq orly orly-2` |

---

## 1. Exhaustive routing/provider reference table

Legend for **Action**: **R** = replace (text given), **D** = delete, **K** = keep (not
authoring, or historical/content), **G** = generalize (rewrite the code).

### 1A. Machine policy, launcher, tests (code that pins models)

| File:line | Current | Action / exact replacement |
| --- | --- | --- |
| `generator/authoring-models.json:2-6` | `"planning":"gpt-6-astra"`, `"modeling3d":"gpt-6-astra"`, `"animation2d":"claude-fable-5-1"`, `"claudePackage":"@anthropic-ai/claude-code@latest"`, `"fallback":null` | **R** with a single author + effort + role map (draft: `.orly-work/probes/ops-routing/draft/authoring-models.json`): `{"author":"claude-opus-5-5","effort":"high","roles":{planning,research,story,narrationScript,animation2d,canvas,three,blenderPython,music,pipelineCode,review → "claude-opus-5-5"},"claudePackage":"@anthropic-ai/claude-code@latest","pinnedAliasEnv":["ANTHROPIC_DEFAULT_HAIKU_MODEL","ANTHROPIC_DEFAULT_SONNET_MODEL","ANTHROPIC_DEFAULT_OPUS_MODEL","CLAUDE_CODE_SUBAGENT_MODEL"],"allowedAuxiliaryModels":[],"fallback":null,"nonAuthoring":{narrationVoice, coverImage, coverQa}}` |
| `generator/run-fable.mjs:2` | comment "One launcher for local/CI D3 authoring" | **G** rename to `generator/run-opus.mjs` (keep `run-fable.mjs` as a 2-line shim that throws "use run-opus.mjs", or delete) |
| `generator/run-fable.mjs:10` | `args:['--yes',policy.claudePackage,'--print','--model',policy.animation2d,'--output-format','json',...]` | **R** `['--yes',policy.claudePackage,'--print','--verbose','--model',policy.roles[role],'--effort',policy.effort,'--output-format','stream-json','--max-turns',N,'--allowedTools','Bash,Read,Edit,Write,Glob,Grep,Agent,Task']`. Never pass `--fallback-model`. |
| `generator/run-fable.mjs:14` | `'Fable failed or hit a provider limit…'` | **R** `'Authoring failed or hit a provider limit; inspect the private result file.'` |
| `generator/run-fable.mjs:16` | `if(!models.includes(policy.animation2d)) throw 'Fable 5.1 provider provenance is missing.'` | **R** `policy.author` / `'Opus 5.5 provider provenance is missing.'` |
| `generator/run-fable.mjs:17-18` | allows any `m.includes('haiku')` as auxiliary | **R** **strict**: reject every model not equal to `policy.author` (and not in the empty `allowedAuxiliaryModels`). Also reject any `assistant` message whose `message.model` ≠ author (except synthetic rate-limit messages), the same as `record-worker.mjs:14-15`. |
| `generator/run-fable.mjs:28` | `spawn(..., {env:process.env})` | **R** `env: childEnv()`. Set every `pinnedAliasEnv` var to `claude-opus-5-5`, and delete `ANTHROPIC_API_KEY` unless `ORLY_ALLOW_API_KEY=1`. |
| `generator/run-fable.mjs:34` | `` `Fable 5.1 completed; …` `` | **R** `` `Opus 5.5 (${role}, effort high) completed; …` ``. Add `--provenance <file>` that writes the compact record (§3). |
| `generator/authoring-models.test.mjs:5` | `import {command,verifyResult} from './run-fable.mjs'` | **R** `from './run-opus.mjs'` |
| `generator/authoring-models.test.mjs:8-10` | asserts `--model` = `policy.animation2d` | **R** loop over every role and assert `--model claude-opus-5-5`, `--effort high`, no `--fallback-model` (draft test 1) |
| `generator/authoring-models.test.mjs:13-17` | fixtures with `claude-fable-5-1`, `claude-opus-4-8`; **accepts** `{'claude-fable-5-1','claude-haiku-4-5'}` as success | **R**: Opus+Haiku must now **throw** `/Unexpected/`. Fable or Astra alone must throw `/provenance/`. `{claude-opus-5-5}` alone succeeds. Add the real probe outputs `sub-default.json` (must fail) and `sub-pinned.json` (must pass) as fixtures (draft test 2/4). |
| `generator/authoring-models.test.mjs:19-21` | `generateStoryboard({})` rejects `/Astra/` | **R** reject `/Opus 5.5\|run-opus/` (after editing `storyboard.mjs:4`) |
| `generator/authoring-models.test.mjs:22-29` | for `new-book`, `comment-edit`, `arxiv-weekly`: exactly one `openai/codex-action@v1` step with `with.model===policy.planning`; **no `anthropics/` action**; a `run-fable.mjs` step after it | **R**: for `new-book`, `comment-edit`, `arxiv-weekly`, `new-film`, `film-edit`: **zero** `openai/` or `anthropics/` actions. Every authoring step is `run:` containing `generator/run-opus.mjs --role <role>`. A planning-role step comes before the authoring steps. No step env sets `OPENAI_API_KEY` except steps that run `video.mjs`/`cover.mjs` without `--no-cover`. Grep the whole YAML text for `gpt-6-astra\|claude-fable\|codex-action` and expect no matches. |
| `generator/storyboard.mjs:1-4` | "Planning now belongs to Astra… Use Astra (gpt-6-astra) to prepare --storyboard" | **R** `'Automatic legacy storyboard planning is disabled. Author --storyboard with Opus 5.5 (node generator/run-opus.mjs --role planning) or follow .claude/commands/new-book.md. See docs/authoring-models.md.'` |
| `generator/prompts/storyboard.txt:1-6` | "MODEL ROUTING: Astra (gpt-6-astra) writes… Fable 5.1 (claude-fable-5-1)… consumes that plan" | **R** `MODEL ROUTING: Claude Opus 5.5 (claude-opus-5-5, effort high), launched through npx --yes @anthropic-ai/claude-code@latest, writes the source-grounded visual plan, the narration, every scene (D3/SVG, Canvas, Three.js) and any Blender Python. Separate planning and authoring sessions are both Opus 5.5. See docs/authoring-models.md. Preserve exact narration contracts and provider provenance; never substitute models silently on a provider limit.` |
| `generator/prompts/storyboard.txt:13` | "the VISUAL PLAN (Astra) and then the SCENES (Fable for D3)" | **R** "the VISUAL PLAN and then the SCENES (both Opus 5.5)" |
| `package.json:28` | `"author:d3": "node generator/run-fable.mjs"` | **R** `"author": "node generator/run-opus.mjs"` (keep `author:d3` as an alias with `--role animation2d` if desired) |
| `package.json:29` | `"test:authoring": "node --test generator/authoring-models.test.mjs"` | **K** (the file content changes). Add it to a CI job; today no workflow runs it. |
| `package.json:43` | `"@anthropic-ai/sdk": "^0.105.0"` (unused) | **D** or **K**. It is harmless, but removing it makes "no direct API authoring path" true by construction. |
| `.codex/config.toml:1-2` | `model = "gpt-6-astra"` | **D** the file (no Codex in the fork). Or **R** with a comment-only file stating Codex is not an authoring path in orly-2. |
| `.claude/settings.json:2` | orly: `"model": "claude-fable-5-1"` | **already R in orly-2** → `"claude-opus-5-5"`. Optionally add `"effortLevel": "high"` if the harness supports it (unverified; the CLI flag `--effort high` is verified). Also add `"env": {"ANTHROPIC_DEFAULT_HAIKU_MODEL":"claude-opus-5-5","ANTHROPIC_DEFAULT_SONNET_MODEL":"claude-opus-5-5","CLAUDE_CODE_SUBAGENT_MODEL":"claude-opus-5-5"}` so interactive sessions' subagents are pinned too. |

### 1B. CI workflow YAML

| File:line | Current | Action / exact replacement |
| --- | --- | --- |
| `.github/workflows/new-book.yml:28` | `id-token: write # OIDC token for anthropics/claude-code-action` | **D** (no OIDC-based action; OAuth token via env). Keep only if adopting `anthropics/claude-code-action`. |
| `new-book.yml:105-109` | apt install blender | **K** (Opus writes Blender Python) |
| `new-book.yml:111-138` | step "Plan and model with Astra", `uses: openai/codex-action@v1`, `openai-api-key: OPENAI_API_KEY`, `model: gpt-6-astra`, `effort: high`, `sandbox: workspace-write`, `codex-args: network_access=true`, `output-file: .orly-work/astra-result.md`, prompt "You own planning and Blender 3D work; do not author D3/SVG… Write .orly-work/fable-assignment.md: a bounded assignment for Fable 5.1…" | **R** with a `run:` step: `name: Plan with Opus 5.5` / `run: node generator/run-opus.mjs --role planning --prompt-file .github/prompts/plan-book.md --output .orly-work/plan-result.jsonl --provenance .orly-work/plan-provenance.json --max-turns 200` / `env: CLAUDE_CODE_OAUTH_TOKEN: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`. Move the inline prompt to `.github/prompts/plan-book.md`. Its text becomes: "You own planning and any Blender Python/Three.js asset build. Write `.orly-work/visual-plan.md` and `.orly-work/author-assignment.md` (a bounded assignment for a fresh Opus 5.5 authoring session)…". Note: the planner must read the issue from `/tmp/issue.json`, which the launcher can read because it runs in the same job (unchanged). |
| `new-book.yml:140-150` | "Author D3 animations with latest Claude CLI and Fable 5.1", `run: node generator/run-fable.mjs --prompt-file .orly-work/fable-assignment.md --output .orly-work/fable-result.json`, env `CLAUDE_CODE_OAUTH_TOKEN`, `ELEVENLABS_API_KEY`, `OPENAI_API_KEY`, `NOUN_PROJECT_*` | **R** `name: Author scenes with Opus 5.5` / `run: node generator/run-opus.mjs --role animation2d --prompt-file .orly-work/author-assignment.md --output .orly-work/author-result.jsonl --provenance .orly-work/author-provenance.json`. Keep `OPENAI_API_KEY` **only** if the cover path still uses gpt-image (see §1G). |
| `new-book.yml:153` | comment "new-series.md (CI path) has Astra write /tmp/series-plan.json" | **R** "…has the Opus 5.5 planning stage write…" |
| `.github/workflows/comment-edit.yml:15` | `id-token: write # OIDC token for anthropics/claude-code-action` | **D** (same as above) |
| `comment-edit.yml:69-89` | "Plan the edit and model with Astra", `openai/codex-action@v1`, `model: gpt-6-astra`, prompt "Astra owns planning… Write .orly-work/visual-plan.md and .orly-work/fable-assignment.md… Fable handles D3/SVG implementation" | **R** `run: node generator/run-opus.mjs --role planning --prompt-file .orly-work/edit-plan-prompt.md …`. A preceding step writes the prompt file from `.github/prompts/plan-edit.md` plus the slugs and comment body. **Pass the comment body via `env:` into a file, never interpolated into the prompt YAML.** Today `${{ github.event.comment.body }}` is interpolated directly at line 81, which is prompt injection by a collaborator (low risk because it is collaborator-gated, but avoid it). |
| `comment-edit.yml:91-100` | "Apply D3 edits with latest Claude CLI and Fable 5.1", `run-fable.mjs … --max-turns 250` | **R** `run-opus.mjs --role animation2d --prompt-file .orly-work/author-assignment.md --output .orly-work/author-result.jsonl --provenance .orly-work/author-provenance.json --max-turns 250` |
| `comment-edit.yml:118` | comment "checkout's persisted token is gone after claude-code-action" | **R** "…after the authoring step" (cosmetic) |
| `comment-edit.yml:1,3,19,24,82,117,127` | `@claude` trigger + messages | **K**. `@claude` stays the trigger (orly-2 CLAUDE.md:64 already says so). |
| `.github/workflows/arxiv-weekly.yml:20` | `id-token: write # OIDC token for anthropics/claude-code-action` | **D** |
| `arxiv-weekly.yml:40-47` | "Discover + rank this week's papers with Astra", `openai/codex-action@v1`, `model: gpt-6-astra`, `effort: high`, network access | **R** `run: node generator/run-opus.mjs --role research --prompt-file .github/prompts/arxiv-discovery.md --output .orly-work/arxiv-result.jsonl --provenance .orly-work/arxiv-provenance.json --max-turns 150` with `CLAUDE_CODE_OAUTH_TOKEN`. The prompt body (lines 49-86) moves verbatim to `.github/prompts/arxiv-discovery.md`. Network: the CLI uses Bash `curl` and WebFetch, so add `WebFetch` to `--allowedTools` for the research role. |
| `.github/workflows/preview.yml:128` | "Reply with **@claude &lt;change&gt;**" | **K** |
| `preview.yml`, `deploy.yml` | no model refs | **K**. But **port orly's uncommitted `check-cloudflare.mjs` preflight** (orly working tree only) if wanted. |
| `test-pipeline.yml`, `storybook-pages.yml` | no model refs | **K**. Add a `node --test generator/*.test.mjs` job (none runs the routing test today). |

### 1C. CI helper scripts

| File:line | Current | Action |
| --- | --- | --- |
| `.github/scripts/fanout-series.sh:5` | comment `"model": "claude-fable-5-1"` | **R** `"model": "claude-opus-5-5"` |
| `fanout-series.sh:26` | `model="claude-fable-5-1" # animation role is fixed by repository policy` | **R** `model="$(jq -r .author generator/authoring-models.json)" # every authoring role is fixed by repository policy` |
| `fanout-series.sh:45` | body `"### Model" "" "($model)"` | **K** (value now Opus) |
| `.github/scripts/arxiv-fanout.sh:53` | `"### Model" "" "(claude-fable-5-1)"` | **R** `"(claude-opus-5-5)"` (or read from policy JSON as above) |
| `.github/scripts/open-book-pr.sh:47` | "Auto-generated by Claude Code in CI" | **K**. Optionally append the provenance line "Authored by claude-opus-5-5 (effort high); provenance: …" read from `.orly-work/*-provenance.json`. |
| `open-book-pr.sh:13,24` | `BRANCH="book/issue-N"`, adds `public/generated apps/bookshelf/src/viz/books …` | **G** for film: parametrize `KIND=book\|film` (branch `film/issue-N`, add `apps/bookshelf/src/viz/films`, `public/generated/films`) |
| `preflight-push.sh` | none | **K**. Add `bash -n` for any new film scripts. |

### 1D. Agent instruction files and docs

| File:line | Current | Action / replacement |
| --- | --- | --- |
| `CLAUDE.md:10-16` (orly) | Astra/Fable routing paragraph | **done in orly-2** (orly-2 `CLAUDE.md:10-18`, verified by `diff`) |
| orly-2 `CLAUDE.md:22` | "It digests the repo, Astra writes the visual plan and Fable authors D3 scenes," | **R** "It digests the repo, Opus 5.5 writes the visual plan and authors the scenes," |
| orly-2 `CLAUDE.md:57` | "Planning uses Astra; D3 authoring uses the signed-in latest Claude CLI." | **R** "All planning and authoring runs Opus 5.5 at high effort through the signed-in latest Claude CLI (`generator/run-opus.mjs`)." |
| orly-2 `CLAUDE.md:23` | "generates an O'RLY cover (gpt‑image)" | **K** or **R** per §1G decision |
| orly-2 `AGENTS.md:10-18`, `126-127` | routing paragraph, 3D library ownership | **done in orly-2** (verified) |
| orly-2 `AGENTS.md:22` | same Astra/Fable sentence | **R** same as CLAUDE.md:22 |
| orly-2 `AGENTS.md:23-24` | "cover (Codex built-in ImageGen when available; API fallback otherwise)" | **R** per §1G, e.g. "cover (an Opus-authored SVG silhouette by default; `gpt-image-1` woodcut via `cover.mjs` as the image-model option)" |
| orly-2 `AGENTS.md:56-61` | "Always use Codex built-in ImageGen for cover animals when it is available…" | **R**. Codex is not in the fork's toolchain, so this rule can never trigger and always falls to the API path. Replace with the chosen cover policy. Keep the "uniform pure-white field, no lettering, visually inspect, 512px webp, `--no-cover`" constraints. |
| orly-2 `AGENTS.md:65` | "Planning uses Astra; D3 authoring uses…" | **R** as CLAUDE.md:57 |
| orly-2 `AGENTS.md:116` | "reply **@Codex** on a book PR" | **R** "**@claude**". The workflow trigger is `@claude` (`comment-edit.yml:24`), so `@Codex` is already wrong in orly. |
| `docs/authoring-models.md:1-59` (identical in orly-2) | the whole Astra→Fable doctrine, CI notes, OpenAI/Codex links (58-59) | **R** the whole file. Keep the durable rules: bounded assignments, record requested and actual model, exit code ≠ success (`is_error`, rate limits), no silent substitution, save the assignment and report on provider limit, the sampled-clock rule for hybrid 2D/3D, private results kept out of logs. Change roles to "Opus 5.5 for everything; planning and authoring are separate **sessions** of the same model". New CI section: needs only `CLAUDE_CODE_OAUTH_TOKEN` for authoring, `ELEVENLABS_API_KEY` for voice, and `OPENAI_API_KEY` only if the gpt-image cover option is kept. Drop both OpenAI links. Add the subagent-pinning finding. |
| `README.md:5` | "Point Astra and Fable at any GitHub repo…" | **R** "Point Claude Opus 5.5 at…" |
| `README.md:31-34` | "Astra plans and builds Blender 3D models; Fable 5.1 authors D3 animations. Use npx … for every Fable run… Covers still use built-in ImageGen." | **R** "Claude Opus 5.5 (high effort) plans, writes, and codes everything — D3/SVG, Canvas, Three.js, Blender Python and Strudel music. Every run goes through `node generator/run-opus.mjs` (`npx --yes @anthropic-ai/claude-code@latest --model claude-opus-5-5 --effort high`)…" |
| `README.md:42` | "a `gpt-image` woodcut animal" | **K/R** per §1G |
| `README.md:54` | mermaid "Astra + Fable in CI<br/>plan / 3D → D3 → narrate → cover" | **R** "Opus 5.5 in CI<br/>plan → author → narrate → score → render" |
| `README.md:64` | "Astra plans, then Fable 5.1 authors D3 in CI" | **R** "Opus 5.5 plans, then a fresh Opus 5.5 session authors in CI" |
| `README.md:75` | `CLAUDE_CODE_OAUTH_TOKEN` row | **K** (now the only authoring credential) |
| `README.md:77` | `OPENAI_API_KEY` — "gpt-image cover art" | **K** if the gpt-image option is kept, marked optional; else **D** |
| `README.md:99` | "Astra writes the visual plan; Fable 5.1 authors D3 scenes…" | **R** "Opus 5.5 writes the plan and authors scenes…" |
| `README.md:106,117` | "cover.mjs + seeds.mjs (gpt-image + vision QA)", tech list "OpenAI `gpt-image`" | **K/R** per §1G |
| `README.md:12,23,57,66,123` | Claude Code badge, `@claude` loop | **K** |
| `generator/README.md:1-4` | "New books use Astra planning/3D modeling and Fable 5.1 D3 authoring… requires a supplied Astra-authored `--storyboard`" | **R** "…use Opus 5.5 for planning and authoring… requires a supplied Opus-authored `--storyboard`" |
| `generator/README.md:13` | example `ANTHROPIC_API_KEY=…  ELEVENLABS_API_KEY=…` | **R** drop `ANTHROPIC_API_KEY=…` (it is unused, and having it in env changes CLI auth) |
| `generator/README.md:29,51` | "use an Astra-authored fixture", "`--model <id>` Legacy option" | **R** "Opus-authored fixture" / **K** |
| `generator/README.md:58` | "`ANTHROPIC_API_KEY` — not used by the supported authoring workflow." | **R** "…not used; `run-opus.mjs` strips it from the CLI env unless `ORLY_ALLOW_API_KEY=1`." |
| `generator/cli.mjs:96,100` | "legacy option; use an Astra-authored --storyboard", "Planning: Astra-authored --storyboard required." | **R** "Opus-authored" |
| `apps/bookshelf/src/viz/three/README.md:6` | "Astra owns these Three.js models and integration; Fable 5.1 owns…" | **R** "Opus 5.5 owns these Three.js models, their integration, and all D3/SVG choreography." |

### 1E. Commands and skills

| File:line | Current | Action / replacement |
| --- | --- | --- |
| `.claude/commands/new-book.md:7` | "**Astra plans and models in Blender; Fable 5.1 authors D3/SVG animations through `npx --yes @anthropic-ai/claude-code@latest`.** A Fable worker consumes Astra's written plan; it does not replace the planner. Preserve provider provenance and stop that role on a provider limit without substitution." | **R** "**Claude Opus 5.5 (`claude-opus-5-5`, effort high) plans, writes, and codes every part of the book** (visual plan, narration, D3/SVG/Canvas/Three.js scenes, Blender Python). Headless sub-sessions run through `node generator/run-opus.mjs --role <role>` (latest CLI, pinned aliases, strict provenance). A fresh authoring session consumes the written plan; it does not re-plan. Preserve provider provenance and stop on a provider limit without substitution." |
| `new-book.md:19-20` | "Keys … (`ELEVENLABS_API_KEY`, `OPENAI_API_KEY`). Astra prepares the plan and any 3D assets; Fable implements the D3 scenes." | **R** "Keys … (`ELEVENLABS_API_KEY`; `OPENAI_API_KEY` only for the gpt-image cover option). Opus 5.5 prepares the plan and any 3D assets, then authors the scenes." |
| `new-book.md:31` | "3. **ASTRA: PLAN THE VISUALIZATIONS**" | **R** "3. **PLAN THE VISUALIZATIONS (Opus 5.5)**" |
| `new-book.md:51` | "4. **FABLE 5.1: AUTHOR THE D3 SCENES**" | **R** "4. **AUTHOR THE SCENES (Opus 5.5)**" |
| `new-book.md:83-92` | "When Codex built-in ImageGen is available, **always use it**… Use the `cover.mjs` API path only if built-in ImageGen is unavailable." / `# Include --no-cover when the built-in ImageGen cover is prepared.` | **R** per §1G (e.g. "Default: author `public/generated/<SLUG>/animal.svg` as an Opus-coded silhouette, rasterize to `animal.webp` with sharp, pass `--no-cover`. Option: `cover.mjs` (gpt-image-1)…") |
| `.claude/commands/new-series.md:7` | same Astra/Fable header | **R** same as new-book.md:7 |
| `new-series.md:20` | "Astra writes the series plan; Fable authors each book's D3 scenes through the latest CLI." | **R** "Opus 5.5 writes the series plan, and a fresh Opus 5.5 session authors each book." |
| `new-series.md:38` | `"model": "claude-fable-5-1",` in the JSON shape | **R** `"model": "claude-opus-5-5",` |
| `new-series.md:45` (series template) | "if you want Astra to plan them" | see 1F |
| `.claude/commands/tweak-book.md:7` | same header | **R** same as new-book.md:7 |
| `tweak-book.md:18` | keys incl. `OPENAI_API_KEY` | **K/R** per §1G |
| `.claude/skills/viz-scene/SKILL.md:15` | "Astra (`gpt-6-astra`) plans and builds Blender/Three.js 3D assets; Fable 5.1 (`claude-fable-5-1`) authors and revises D3/SVG choreography. Invoke Fable through `npx …`. … continue independent work for the available role." | **R** "Claude Opus 5.5 (`claude-opus-5-5`, effort high) plans, builds Blender/Three.js assets, and authors and revises D3/SVG choreography. Headless runs use `node generator/run-opus.mjs`. Preserve fixed captions and record actual provider provenance. Do not substitute models on a rate limit; save the assignment and stop." |
| `.agents/skills/viz-scene/SKILL.md:15` | byte-identical copy of the above (`diff` → identical) | **R** identically. Keep both copies in sync (or symlink). |
| `.agents/skills/source-command-tweak-book/SKILL.md:10` | same model paragraph | **R** as above |
| `.agents/skills/source-command-tweak-book/SKILL.md:27` | keys incl. `OPENAI_API_KEY` | **K/R** per §1G |
| `.agents/skills/source-command-tweak-book/SKILL.md:51-58` | "Cover → when Codex built-in ImageGen is available, always use it…" | **R** per §1G |

### 1F. Issue templates

| File:line | Current | Replacement |
| --- | --- | --- |
| `.github/ISSUE_TEMPLATE/new-book.yml:56` | `description: Astra plans and models in 3D; Fable 5.1 authors D3 animations` | `description: Claude Opus 5.5 (high effort) plans, writes and codes everything` |
| `new-book.yml:58` | `- "Astra planning + Fable 5.1 animations (claude-fable-5-1)"` | `- "Claude Opus 5.5 — all planning, story and code (claude-opus-5-5)"` |
| `.github/ISSUE_TEMPLATE/new-series.yml:45` | `label: Number of books (if you want Astra to plan them)` | `…(if you want Opus 5.5 to plan them)` |
| `new-series.yml:51,53` | same description/option | same as new-book |
| `.github/ISSUE_TEMPLATE/tweak-book.yml:190,192` | same description/option | same as new-book |
| `tweak-book.yml:2` | "Ask Claude to edit…" | **K** |

Nothing parses the "Model" dropdown value (grep: only the fan-out scripts *write* `### Model`), so changing the option string is safe.

### 1G. Non-authoring model use (images, vision QA, voice)

| File:line | Current | Options |
| --- | --- | --- |
| `generator/cover.mjs:2,27-30,39-45` | OpenAI Images API, `model: 'gpt-image-1'` (generations + edits) | **Image generation is allowed to stay on an image model.** Options: (a) keep `gpt-image-1` via `OPENAI_API_KEY` (current API path; woodcut look). (b) **Opus-authored SVG silhouette cover**: the animal drawn as code (paths), rasterized with `sharp` (already a devDependency) to `animal.webp`. This is "code", so all-Opus applies; it matches the paper-cut film art direction, needs no key, is deterministic, and has no lettering risk. **Recommended default for films.** (c) Another image API (e.g. Google Imagen/Gemini image, Stability) behind the same `genGenerations()` signature; that needs a new key and a new QA path. (d) Codex built-in ImageGen: **not available** once Codex is removed. |
| `generator/cover.mjs:68,76,115` | `apiKey = process.env.OPENAI_API_KEY`, throws if missing | **K** if (a). Make it optional when `--no-cover` or the SVG path is used (it already is optional via `--no-cover`). |
| `generator/seeds.mjs:2,14-19,34-35` | vision QA via OpenAI chat `model: 'gpt-4o-mini'` (REAL/PARODY seed filter, CLEAN/TEXT animal check) | A classification judgment, not code or story, so it may stay. **Better under all-Opus:** run the QA as `run-opus.mjs --role review` with the image path (Claude reads PNGs via `Read`), or drop seeding entirely (seeding is opt-in already: `cover.mjs:9-10`). Note `qaClean` fails **open** on error (`cover.mjs:58-60`). |
| `generator/cli.mjs:162,164`, `generator/video.mjs:11,21,121,221-225` | cover only when `OPENAI_API_KEY` is set; log "gpt-image, seeded + QA loop" | **K** (messages); add the SVG-cover branch |
| `generator/tts.mjs:105` | ElevenLabs `modelId = 'eleven_multilingual_v2'` | **K**. A voice model, not authoring. The narration *text* is Opus-authored. (The voice/model choice for the film is covered by the ElevenLabs probe.) |
| `generator/iconize.mjs:27` | regex `/model\|\bai\b\|\bllm\b\|claude\|gpt\|openai\|anthropic/ → 'brain'` | **K** (icon keyword mapping, not routing) |

### 1H. Historical provenance and book content: do NOT change

These are records or subject matter, not routing. Rewriting them would falsify provenance.

- `series/from-rlcd-to-predictive-tab/**`: every `claude-fable-5-1`, `npx … claude-code@latest`, `Codex`, `built-in ImageGen` mention (progress.json:11-16,36-38,50-57,65-67,80-122; provenance.json:59-67; book-*-worker.json; jev-revision-authoring.json; README.md:38-74; assignments/*.md; SOURCE-NOTE.md:9; evidence/*/checks.json; series-plan.json:4; cover-prompts.json; visualization-brief.md; series-script.*). **Exception:** `record-worker.mjs:12-16` and `prepare-assignment.mjs:12` are *code* that pins Fable. Generalize them into the fork's shared tooling (§3) rather than editing the historical copies.
- `apps/bookshelf/src/viz/books/*/author-notes.md`, `visual-plan.md` (e.g. `confidence-before-words/visual-plan.md:3,7,22`, `next-useful-action/author-notes.md:3`, `decisions-become-actions/author-notes.md:7,16`), and story-file header comments (`one-read-many-decisions/chapter-*.stories.tsx:1`, `decisions-become-actions/chapter-3.stories.tsx:1`).
- Book subject matter: `books/codex-app-server/**`, `books/kt-first-token/chapter-2.tsx:47`, `chapter-4.tsx:1-272` (OpenAI-compatible API), `books/repo-to-skill/chapter-4.tsx:81`, `books/dataprep-bench/chapter-3.tsx:123`, `books/agent-codeowners/**`, `books/buzz/**`, `books/electric-internals/chapter-2.tsx`, `books/dp-harness-handbook/chapter-3.tsx`, `explainers/almostnode-walls/**`, `explainers/swe-bench-repair/scene.ts:9`, `generator/viz-catalog.json:121`, `generator/series-plans/daily-papers-2026-W29.json:15`, `.github/arxiv-watch.json:36` ("OpenAI" as a watched lab).
- `books/the-orly-loop/chapter-1.tsx:29` `{ label: 'Model', value: 'Fable 5 (claude-fable-5)' }` is a published book *about the pipeline*. Keep it as history. A future orly-2 "loop" film/book would describe Opus 5.5.

### 1I. orly-2 status vs orly (confirmed by `diff`)

- `CLAUDE.md`: lines 10-16 replaced with the 9-line Opus 5.5 paragraph (orly-2 10-18). **Residuals still to fix: 22, 57.**
- `AGENTS.md`: the same paragraph replaced; 124-125 → 126-127 ("Opus 5.5 owns these Three.js primitives and all D3/SVG choreography."). **Residuals: 22, 23-24, 56-61, 65, 116 (`@Codex`).**
- `.claude/settings.json`: `claude-fable-5-1` → `claude-opus-5-5`.
- `docs/authoring-models.md`: **unchanged** (identical to orly), and both rewritten files link to it, so it currently contradicts them.
- Untracked `.claude/workflows/probe-model-routing.js` probes `agent()` with `model:'opus'`, `'claude-opus-5-5'` and inherit. The rewritten CLAUDE.md prescribes `agent(prompt, { model: 'claude-opus-5-5', effort: 'high' })`.
- Not in orly-2: orly's uncommitted Cloudflare preflight (`.github/scripts/check-cloudflare.mjs` plus `deploy.yml`/`preview.yml` edits). Port it deliberately or leave it.

---

## 2. CI loop structure, and what a "film" type adds

### 2.1 Current loop (book)

```
issue (📕 new-book / 📚 new-series / ✏️ tweak-book template, label = category)
  │  gate: author is OWNER/MEMBER/COLLABORATOR on `opened`, or any `labeled` event
  │        with a category or `build` label (only collaborators can label) — new-book.yml:38-50
  │  concurrency: book-issue-<n>, cancel-in-progress — :53-55
  ▼
new-book.yml  (also workflow_dispatch issue_number=<n> for fan-out / re-runs — :16-21)
  1 resolve issue → /tmp/issue.json (title/body/labels)                           :62-77
  2 npm install; git identity; PREFLIGHT push+gh before spending                  :79-96
  3 ack comment with run link                                                     :98-103
  4 apt install blender                                                           :105-109
  5 PLAN  (Astra, codex-action, effort high)  → .orly-work/visual-plan.md +
           .orly-work/fable-assignment.md   (series: /tmp/series-plan.json, stop) :111-138
  6 AUTHOR (run-fable.mjs, Fable 5.1; continue-on-error to keep partial work)     :140-150
  7 series only: fanout-series.sh → one inert 📕 issue per book (needs `build`)   :157-164
  8 detect changed public/generated/<slug> dirs                                   :168-177
  9 browser-verify each slug: playwright + npm run build + verify-book.mjs        :185-198
 10 open-book-pr.sh → branch book/issue-<n>, commit public/generated +
     apps/bookshelf/src/viz/books + tweak dropdown; PR "Closes #n"; partial/verify notes  :205-222
 11 dispatch preview.yml (GITHUB_TOKEN pushes don't trigger workflows)            :224-228
 12 flag partial generation (job fails but PR exists)                             :230-234
  ▼
preview.yml (workflow_dispatch pr=<n>): wrangler `versions upload --preview-alias <branch>`,
  sticky PR comment with ?bundle=<slug> links                                     preview.yml:78-128
  ▼
comment-edit.yml: `@claude <change>` on the PR by a collaborator → checkout PR → slugs from
  diff vs main → 👀 reaction → PLAN (Astra) → AUTHOR (Fable, max-turns 250) → commit
  public/generated → push → dispatch preview → partial flag                       comment-edit.yml:18-141
  ▼
merge → deploy.yml (push main): build shelf + storybook → wrangler deploy           deploy.yml
arxiv-weekly.yml (Mon 14:00 UTC): Astra discovery → /tmp/arxiv-plan.json →
  arxiv-fanout.sh files inert issues, dispatches new-book.yml for rank 1 only
```

Design invariants worth keeping: (1) every autonomous run has a human approval behind it
(the `build` label; token-created issues fire nothing); (2) preflight before spend;
(3) partial work is always salvaged into a PR; (4) all untrusted strings go through env
and files, never shell interpolation (`open-book-pr.sh:1-9`); (5) the PR is the review
surface and merge is the only publish step; (6) one CI session per bounded unit
(series fan-out exists because "a whole series is too big for a single session",
`new-book.yml:14-15`).

### 2.2 What a "film" adds

A 20-40 min film is about 10× a book (roughly 12-20 sequences, 150-300 narration lines,
a score, and a frame-exact render). One CI session cannot hold it, so it must reuse the
**series fan-out** pattern at the sequence level, with artifacts flowing between jobs.

**New issue template `.github/ISSUE_TEMPLATE/new-film.yml`** (label `new-film`):
fields `topic` (textarea: what the film teaches, required), `title`, `runtime`
(dropdown 10/20/30/40 min), `art_direction` (dropdown: "Silhouette paper-cut theatre"
default; future styles), `voice` (input: ElevenLabs voice id/name, default from the
style kit), `music_brief` (textarea: Strudel score mood/instrumentation), `sources`
(textarea: required reading/URLs; grounding rule "no invented events/quotes"),
`cover_animal`, `model` (single option "Claude Opus 5.5 — all planning, story and code
(claude-opus-5-5)"). Also `tweak-film.yml` (dropdown of films via an extended
`sync-issue-books.mjs`, sequence number, change description).

**New workflow `.github/workflows/new-film.yml`** (same gate expression with `new-film`/`tweak-film`/`build`):

```yaml
jobs:
  plan:            # Opus 5.5 planning session(s); no rendering
    steps: [checkout, resolve issue, npm install, preflight-push,
      "node generator/run-opus.mjs --role research  --prompt-file .github/prompts/film-research.md --output .orly-work/research.jsonl --provenance films/<slug>/provenance/research.json",
      "node generator/run-opus.mjs --role story     --prompt-file .github/prompts/film-script.md   ...  # → films/<slug>/script.json (fixed narration contract) + film-plan.json (sequences, shots, durations)",
      "node generator/film/verify-script.mjs <slug>  # schema, word counts, runtime estimate, sources cited per claim",
      upload-artifact film-plan]
    outputs: { sequences: ${{ steps.plan.outputs.matrix }} }   # JSON array of sequence ids
  narrate:         # ElevenLabs; can start as soon as script.json is fixed
    needs: plan
    steps: [download film-plan, "node generator/film/narrate.mjs <slug>  # per-sequence MP3 + exact cues", upload-artifact narration]
  author:          # ONE bounded Opus session per sequence (series pattern, but parallel)
    needs: plan
    strategy: { matrix: { seq: ${{ fromJSON(needs.plan.outputs.sequences) }} }, max-parallel: 4, fail-fast: false }
    steps: [download film-plan,
      "node generator/film/prepare-assignment.mjs <slug> ${{ matrix.seq }}",
      "node generator/run-opus.mjs --role animation2d --prompt-file .orly-work/seq-${{ matrix.seq }}.md --output … --provenance films/<slug>/provenance/seq-${{ matrix.seq }}.json",
      "node generator/film/verify-sequence.mjs <slug> ${{ matrix.seq }}  # exact captions, determinism (forward/reverse frame equality), safe-area",
      upload-artifact seq-${{ matrix.seq }}]
  score:           # Opus writes Strudel code; Playwright renders audio
    needs: plan
    steps: ["run-opus.mjs --role music --prompt-file .orly-work/score-assignment.md …  # → films/<slug>/score/*.strudel.js",
      "node generator/film/render-score.mjs <slug>  # headless Chromium + strudel → WAV stems (see Strudel probe)",
      upload-artifact score]
  assemble:        # mix, frame-exact render, QA, PR
    needs: [narrate, author, score]
    if: always()   # salvage partial work like new-book.yml
    timeout-minutes: 340          # GitHub-hosted job hard limit is 6h
    steps: [download all, "node generator/film/mix.mjs <slug>",
      "node generator/film/render.mjs <slug> --fps 30 --size 1920x1080  # Playwright frame capture → ffmpeg",
      "node generator/film/verify-film.mjs <slug>  # duration, A/V sync at every cue, black-frame/frozen-frame scan, loudness",
      upload MP4 to R2 (not git), "KIND=film bash .github/scripts/open-book-pr.sh", dispatch preview.yml]
```

Additions this implies:

- **Artifact flow between jobs** (`actions/upload-artifact`/`download-artifact`). Today everything happens in one job.
- **MP4 hosting outside git and outside Workers assets.** Cloudflare Workers static assets have a 25 MiB per-file limit (documented platform limit; verify against the current docs before relying on it). A 30-min 1080p H.264 file is hundreds of MB. Options: an R2 bucket (README.md:59,83 already anticipates R2) with the MP4 URL in the film manifest, or HLS with segments ≤ 25 MiB served as assets. The in-app playback path (`?film=<slug>`) can still use the live engine plus per-sequence audio, like books, so previews work without the MP4.
- **Runner capacity.** At 30 fps a 30-min film is 54,000 frames. Headless capture at 10-30 fps is 0.5-1.5 h, plus encoding. Use a dedicated render job (or `runs-on: [self-hosted, macOS]`, since the local Mac has ffmpeg 9) with `timeout-minutes`. Shard the render per sequence in the matrix and concatenate with ffmpeg's concat demuxer (frame-exact if every shard uses the same encoder settings and GOP boundaries).
- **Strudel in CI** depends on the Strudel probe finding a deterministic offline/recorded render path. If capture needs a real audio device, render the score locally and commit the stems as an input artifact; the `score` job then only verifies hashes.
- **`film-edit.yml`** (or extend comment-edit.yml): `@claude` on a `film/issue-N` PR → slug from `films/<slug>` in the diff → a planning session decides which sequences are touched → re-author only those sequences, re-narrate only changed lines, then re-mix and re-render the affected shards. The comment body is passed through a file.
- **Budget guard:** read `total_cost_usd` from each provenance file. Fail the run (keeping the PR) when the cumulative cost exceeds a `FILM_BUDGET_USD` repo variable.
- **Labels:** `new-film`, `tweak-film`, reuse `build`. Branch `film/issue-<n>`. PR body lists per-sequence provenance (model, effort, turns, cost) and the QA verdicts.

---

## 3. Series/progress/provenance conventions worth keeping

From `series/from-rlcd-to-predictive-tab/`:

1. **Fixed narration contract before any scene code.** `series-script.json` is canonical. `verify-contract.mjs:13-15` hash-locks package files (`provenance.packageHashes`). `:29-35` hash-locks source snapshots (`sources[].sha256`, `snapshotFile`). `:37-54` requires each scene's extracted captions (`generator/scene-captions.mjs` `extractScene`) to **deep-equal** the contract, and a Storybook story to exist. For films: `films/<slug>/script.json` (sequences → lines → sources) is the contract, and `verify-script.mjs` adds a citation per factual claim.
2. **Bounded assignments, strictly sequential when quality-gated.** `prepare-assignment.mjs:6` refuses book N until book N-1 has `bookBuild==='passed'`. It writes a self-contained prompt (`:12-24`) containing: exact caption file, files allowed (`Write ONLY apps/.../books/<slug>/**`), exemplars to study, screen-space QA rules (caption safe area y≥575, x 20..1260), deterministic-time rules, and "Do not claim testing ran. Parent checks …". Keep this shape for per-sequence assignments. Parallel sequences are fine when they share only the style kit (not each other's outputs).
3. **Provenance from the provider result, not the exit code.** `record-worker.mjs:11-16` takes the last `result` message, requires the requested model in `modelUsage`, rejects any other assistant model except synthetic rate-limit messages, and records cliVersion, requested/actual model, provider, subtype, is_error, permission denials, duration, tokens and cost. Keep it, generalized in `run-opus.mjs --provenance`, with three fixes: **(a)** drop the fabricated `cliVersion` fallback `'2.1.274'` (`record-worker.mjs:16`) and use `null`; **(b)** add `requestedEffort` (the CLI does not echo effort) plus `effortActive` from `init.per_turn_effort_active`; **(c)** add `apiKeySource` and `subagents` from `init`/`subagent_stats`. Store per unit at `films/<slug>/provenance/<unit>.json` (public, compact). The raw JSONL stays in `.orly-work/` (private, mode 0600, as `run-fable.mjs:31-32` does).
4. **Evidence files per unit.** `evidence/<slug>/{checks,render-check,narration-check,blog-check}.json`. `verify-render.mjs` saves screenshots and asserts frame equality after a backward seek (`:47-55`) and Storybook backward seek (`:71-77`). `verify-narration.mjs` checks audio exists and is >1 KB (`:16-17`), cue count = caption count, cues strictly increasing and inside the recording (`:19-23`), recording length within 1 s of the manifest (`:37`), the caption pill matching each caption on forward **and reverse** seeks (`:45-52`), and the audio clock advancing during play (`:53-59`). For films, add render-level checks: final MP4 duration = sum of sequence durations ± 1 frame, A/V offset at each cue, no frozen or black frames longer than N s outside intentional holds, integrated loudness target (e.g. −16 LUFS stereo).
5. **progress.json as the resumability ledger.** Per-unit status fields (`sourcePreparation`, `fableAuthoring`→`authoring`, `visualReview`, `cover`, `narration`, `bookBuild`, `blog`, `verification`), a top-level `blocker`, a `resume` instruction, `scheduledContinuation` with `lastChecked`, and the provider `resetAt` (progress.json:17). A resumed session reads it and continues at the first non-passed unit. Keep this. Make the gating fields enums (`pending|authored|passed|failed`) so scripts like `prepare-assignment.mjs` can check them mechanically, instead of free prose that only `bookBuild` is checked for.
6. **Stop-on-limit, never substitute.** The README and progress record provider session limits and approval-review blocks without working around them (README.md:38, progress.json:118-127). Keep this. With one model there is no "continue the other role" escape, so a limit means save progress, record `resetAt`, and resume later.
7. **Integrator script that never rewrites the contract.** `build-book.mjs:11` re-runs `verify-contract --scenes` before narrating, and `:15` refuses to publish without `ELEVENLABS_API_KEY` ("silent narration is not a release fallback"). Keep both gates for films (no browser-speech fallback in a release render).

Things *not* to copy verbatim: the series scripts hard-code the series path (`verify-render.mjs:13`, `verify-narration.mjs:64`), counts (`verify-contract.mjs:16-17` asserts 6 books / 19 chapters) and per-book prose patches (`build-book.mjs:22-29,42-43`). Put generic versions under `generator/film/` that take `<slug>`.

---

## 4. Every test/script that pins model ids and must change

| # | File | Pin | Change |
| --- | --- | --- | --- |
| 1 | `generator/authoring-models.json:2-4` | `gpt-6-astra` ×2, `claude-fable-5-1` | Opus role map + `effort: high` (draft provided) |
| 2 | `generator/authoring-models.test.mjs:8-29` | asserts Fable `--model`, accepts Fable+Haiku, expects `/Astra/`, requires `openai/codex-action@v1` with `model: gpt-6-astra`, forbids `anthropics/` | rewrite (draft `run-opus.test.mjs` covers the launcher; add the YAML assertions from §1A) |
| 3 | `generator/run-fable.mjs:10,16,18,34` | `policy.animation2d`, Fable messages, Haiku allowance | replace with `run-opus.mjs` (draft provided; tested live) |
| 4 | `generator/storyboard.mjs:4` | error text names `gpt-6-astra` (test #2 matches it) | Opus text |
| 5 | `generator/prompts/storyboard.txt:1-6,13` | Astra/Fable routing in the system prompt | Opus text |
| 6 | `.github/workflows/new-book.yml:111-150`, `comment-edit.yml:69-100`, `arxiv-weekly.yml:40-47` | `model: gpt-6-astra` via `openai/codex-action@v1`; `run-fable.mjs` | `run-opus.mjs --role …` steps |
| 7 | `.github/scripts/fanout-series.sh:5,26` | `claude-fable-5-1` | read from the policy JSON |
| 8 | `.github/scripts/arxiv-fanout.sh:53` | `(claude-fable-5-1)` | read from the policy JSON |
| 9 | `.github/ISSUE_TEMPLATE/{new-book:56-58,new-series:45-53,tweak-book:190-192}.yml` | option strings with `claude-fable-5-1` | Opus option |
| 10 | `.claude/commands/new-series.md:38` | `"model": "claude-fable-5-1"` in the CI JSON shape | `claude-opus-5-5` |
| 11 | `.codex/config.toml:2` | `model = "gpt-6-astra"` | delete |
| 12 | `.claude/settings.json:2` | (done in orly-2) | add `env` alias pins |
| 13 | `series/from-rlcd-to-predictive-tab/record-worker.mjs:12-16`, `prepare-assignment.mjs:12` | hard-coded `claude-fable-5-1` / "Claude Fable 5.1 visualization author" | leave as history; generalize into `generator/film/` reading the policy JSON |
| 14 | `generator/seeds.mjs:19` | `gpt-4o-mini` (vision QA) | optional: switch to an Opus review session, or keep (non-authoring) |
| 15 | `generator/cover.mjs:30,39` | `gpt-image-1` | keep (image model allowed) or add the SVG cover path |
| 16 | `generator/tts.mjs:105` | `eleven_multilingual_v2` | keep (voice, not authoring) |

Tests that do **not** pin models: `generator/pronunciation.test.mjs`,
`tools/blender/camera-plan.test.mjs`, `tools/three/primitives.test.mjs`.
`tools/blender/*` and `tools/three/*` contain no model references. They are Blender 5.2.1 /
GLB tooling (`blender -b -t 2 --python tools/blender/build-models.py`) that Opus can
author directly. Note `tools/three/blender-import.json:3` already has an `alex-net`
model and `apps/bookshelf/src/viz/three/README.md` lists tensor volumes and feature maps,
which are reusable for the AlexNet sequence of the pilot film.

---

## 5. Draft code (verified)

`/Users/blamy/Documents/Codex/orly-2/.orly-work/probes/ops-routing/draft/`:

- `authoring-models.json`: the proposed policy.
- `run-opus.mjs`: the launcher. It has role validation, `--effort high`, stream-json, `childEnv()` (pins `ANTHROPIC_DEFAULT_{HAIKU,SONNET,OPUS}_MODEL` and `CLAUDE_CODE_SUBAGENT_MODEL` to Opus, and strips `ANTHROPIC_API_KEY` unless `ORLY_ALLOW_API_KEY=1`), strict `verifyResult()` (no auxiliary models), and `provenance()`.
- `run-opus.test.mjs`: 4 tests, all passing (`node --test run-opus.test.mjs`). Test 4 uses the **real** probe outputs: `sub-default.json` (Opus+Haiku) must fail, and `sub-pinned.json` must pass.
- Live end-to-end: `node run-opus.mjs --role story --prompt-file tiny.md --output ../e2e-result.jsonl --provenance ../e2e-provenance.json --max-turns 2` → exit 0, provenance `{actualModel: claude-opus-5-5, requestedEffort: high, effortActive: true, apiKeySource: none, models: [claude-opus-5-5], cliVersion: 2.1.289}`.

Key snippet (the strict gate that closes the Haiku hole at `run-fable.mjs:18`):

```js
const extra = models.filter(m => m !== policy.author && !policy.allowedAuxiliaryModels.includes(m));
if (extra.length) throw new Error(`Unexpected model(s) in provider result: ${extra.join(', ')}`);
```

---

## 6. Risks

- **Subagent model leakage.** Without alias pinning, an Opus session can delegate authoring to Haiku, and orly's verifier accepts it. Pin the alias env vars **and** verify strictly. A subagent requesting a *full* non-Opus model id (not an alias) is not remapped by the alias env vars (only aliases were tested), so the strict verifier is the real gate.
- **Auth/billing switch.** `.env` has `ANTHROPIC_API_KEY`. Scripts that `loadEnvFile` and then spawn the CLI would pass it on. Strip it in the launcher and record `apiKeySource`.
- **Effort is unverifiable from output.** Only the request (argv) and `per_turn_effort_active` prove it, so record both. Never accept a run whose argv lacks `--effort high` (the launcher is the only entry point; CI YAML tests should forbid raw `npx … claude-code` steps).
- **Docs contradiction now.** orly-2 CLAUDE.md/AGENTS.md say Opus, while `docs/authoring-models.md`, the commands, skills, prompts, templates, launcher, test and CI still say Astra/Fable. An agent following `/new-book` today would still launch Fable via `run-fable.mjs`.
- **Prompt injection in comment-edit.** `${{ github.event.comment.body }}` is interpolated into the planning prompt (`comment-edit.yml:81`). Pass it through a file.
- **Cost.** About $0.09 per trivial headless call due to cache creation of the ~11k-token system context, and roughly 150-300 turns per sequence. A film is many sessions, so add the budget guard.
- **CI limits.** 6 h per hosted job; Workers 25 MiB per-asset cap (verify); Strudel audio capture in headless CI is unproven (Strudel probe).
- **orly drift.** orly's uncommitted Cloudflare preflight is not in orly-2. Decide whether to port it.
