# Authoring models

Orly uses **GPT-6 Astra (`gpt-6-astra`) for planning and 3D modeling**, then
**Claude Fable 5.1 (`claude-fable-5-1`) for D3/SVG animation authoring**.
This is the project default for new books, series, standalone explainers,
Storybook scenes and revisions. A user's explicit task-specific choice takes precedence.

## Responsibilities

- **Astra:** source research, visual plans, narration contracts, choice of 2D/3D/hybrid,
  Blender Python, meshes/materials/rigs, `.blend` sources, GLB exports, Three.js
  integration, QA and build/publish orchestration within the user's authorization.
- **Fable 5.1:** D3/SVG scene implementation and revisions, timeline choreography,
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
verification commands. Fable implements the D3 portion without rewriting the
contract. Astra integrates, renders, reviews, and returns concrete corrections to
Fable for any D3 issues. Record requested and actual provider models; a CLI exit
code alone does not prove successful authoring (check `is_error` and rate limits).

Always launch Fable with **`npx --yes @anthropic-ai/claude-code@latest`**.
Never use a globally installed `claude`, an older default model, or a silent fallback.
`node generator/run-fable.mjs --prompt-file <assignment.md> --output <result.json>`
provides the standard launcher. A signed-in Claude account or the existing CI OAuth
secret supplies authentication. Keep prompts/results containing private sources
out of public logs. Authorization to use a provider does not authorize unrelated
source disclosure or production publication.

If a required provider is unavailable, save the assignment and report the precise
blocker. Continue independent work for the available role. Do not author replacement
D3 with Astra while waiting for Fable. A scheduled continuation follows the same split.

## Entry points and CI

`AGENTS.md`, `CLAUDE.md`, both `viz-scene` skills and the book commands refer here.
`generator/authoring-models.json` contains the machine-readable model IDs.
GitHub book/edit jobs run an Astra planning stage before the latest-CLI Fable stage.
Series planning and weekly paper discovery run Astra. CI needs `OPENAI_API_KEY`
with Astra access and `CLAUDE_CODE_OAUTH_TOKEN` with Fable access; credentials are
configured separately, never committed. A missing provider fails its stage without
substitution. Existing PR/preview/merge gates remain in force.

The deprecated v2 CLI accepts an Astra-authored `--storyboard` fixture; it must not
silently invoke its historical Anthropic storyboard planner. Use the scene-native
book commands for new work.

Model ID reference: [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model).
CI reference: [Codex GitHub Action](https://learn.chatgpt.com/docs/github-action).
