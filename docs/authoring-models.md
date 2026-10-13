# Authoring models

Orly uses **GPT-6 Astra (`gpt-6-astra`) for planning and 3D modeling**, then
**Claude Opus 5.5 (`claude-opus-5-5`) for D3/SVG animation authoring**.
If Opus is maxed out by a session, weekly, usage or rate limit, continue the D3/SVG role with **GPT-6.1 Sol (`gpt-6.1-sol`)**. Preserve the work and record the limit before the handoff. If both are unavailable, save progress and report the blocker. No other fallback is authorized.

This is the project default for new books, series, standalone explainers,
Storybook scenes and revisions. A user's explicit task-specific choice takes precedence.

## Responsibilities

- **Astra:** source research, visual plans, narration contracts, choice of 2D/3D/hybrid,
  Blender Python, meshes/materials/rigs, `.blend` sources, GLB exports, Three.js
  integration, QA and build/publish orchestration within the user's authorization.
- **Opus 5.5:** D3/SVG scene implementation and revisions, timeline choreography,
  labels and layout, given Astra's source-grounded plan and fixed narration.
- **Built-in ImageGen:** cover animal art, following AGENTS.md. Blender does not
  replace the existing cover workflow.

Use depth when it explains assembly, occlusion, coordinate frames, feature-space
geometry or a real surface. Keep numerical plots and text legible in 2D. Do not
turn every data flow into a 3D scene. Hybrid models share the existing Player's
sampled clock: no second animation loop or physics clock. Verify reverse seeking.

## Handoff

Astra prepares a bounded assignment per book or chapter: sources, exact captions,
beat plan, permitted files, model assets and node names, timeline bindings, and
verification commands. Opus implements the D3 portion without rewriting the
contract. Astra integrates, renders, reviews, and returns concrete corrections to
Opus for any D3 issues. Record requested and actual provider models; a CLI exit
code alone does not prove successful authoring (check `is_error` and rate limits).

Always launch Opus with **`npx --yes @anthropic-ai/claude-code@latest`**.
Never use a globally installed `claude` or an older default model. Announce and record the authorized Sol fallback when used.
`node generator/run-fable.mjs --prompt-file <assignment.md> --output <result.json>`
provides the standard launcher. A signed-in Claude account or the existing CI OAuth
secret supplies authentication. Keep prompts/results containing private sources
out of public logs. Authorization to use a provider does not authorize unrelated
source disclosure or production publication.

`generator/run-fable.mjs` is the legacy filename for the latest-Claude launcher; it now requests Opus 5.5. It preserves the private result and identifies quota failures. The supervising Codex session or CI authoring stage must continue that saved assignment with `gpt-6.1-sol` after a confirmed Opus limit. Use the current source and fixed captions; do not restart successful chapters or repeat narration/image calls. An authentication failure, invalid model, ordinary code error or max-turns failure is not a quota and does not authorize switching providers.

Planning and Blender modeling remain assigned to Astra. A user's explicit task-specific choice overrides this routing. Record requested and actual models for every authoring and revision pass. If the authorized fallback is unavailable, stop that role and report the precise blocker; independent integration or 3D work may continue.

## Entry points and CI

`AGENTS.md`, `CLAUDE.md`, both `viz-scene` skills and the book commands refer here.
`generator/authoring-models.json` contains the machine-readable model IDs.
GitHub book/edit jobs run an Astra planning stage before the latest-CLI Opus stage.
Series planning and weekly paper discovery run Astra. CI needs `OPENAI_API_KEY`
with Astra access and `CLAUDE_CODE_OAUTH_TOKEN` with Opus access; credentials are
configured separately, never committed. A confirmed Opus quota runs the Sol continuation stage; other provider failures remain blockers. Existing PR/preview/merge gates remain in force.

The deprecated v2 CLI accepts an Astra-authored `--storyboard` fixture; it must not
silently invoke its historical Anthropic storyboard planner. Use the scene-native
book commands for new work.

Model IDs: [Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/overview), [GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol).
CI reference: [Codex GitHub Action](https://learn.chatgpt.com/docs/github-action).
