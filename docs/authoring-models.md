# Authoring models

Orly uses **GPT-6.1 Sol (`gpt-6.1-sol`) for planning and 3D modeling**, then
**Claude Opus 5.5 (`claude-opus-5-5`) for D3/SVG animation and Strudel authoring**.
This is the project default for new books, series, standalone explainers,
Storybook scenes and revisions. This routing records the user's persistent override:
never use Astra or Fable; use Sol and Opus 5.5. A new explicit user instruction
takes precedence over these repository defaults; provider limits never authorize a fallback.

## Responsibilities

- **Sol:** source research, visual plans, narration contracts, choice of 2D/3D/hybrid,
  Blender Python, meshes/materials/rigs, `.blend` sources, GLB exports, Three.js
  integration, QA and build/publish orchestration within the user's authorization.
- **Opus 5.5:** D3/SVG scene implementation and revisions, Strudel music, timeline choreography,
  labels and layout, given Sol's source-grounded plan and fixed narration.
- **Built-in ImageGen:** cover animal art, following AGENTS.md. Blender does not
  replace the existing cover workflow.

Use depth when it explains assembly, occlusion, coordinate frames, feature-space
geometry or a real surface. Keep numerical plots and text legible in 2D. Do not
turn every data flow into a 3D scene. Hybrid models share the existing Player's
sampled clock: no second animation loop or physics clock. Verify reverse seeking.

## Handoff

Sol prepares a bounded assignment per book or chapter: sources, exact captions,
beat plan, permitted files, model assets and node names, timeline bindings, and
verification commands. Opus implements the D3 portion without rewriting the
contract. Sol integrates, renders, reviews, and returns concrete corrections to
Opus for any D3 issues. Record requested and actual provider models; a CLI exit
code alone does not prove successful authoring (check `is_error` and rate limits).

Always launch Opus with **`npx --yes @anthropic-ai/claude-code@latest`**.
Never use a globally installed `claude`, an older default model, or a silent fallback.
`node generator/run-claude.mjs --prompt-file <assignment.md> --output <result.json>`
provides the standard launcher. A signed-in Claude account or the existing CI OAuth
secret supplies authentication. Keep prompts/results containing private sources
out of public logs. Authorization to use a provider does not authorize unrelated
source disclosure or production publication.

If a required provider is unavailable, save the assignment and report the precise
blocker. Continue independent work for the available role. Do not author replacement
D3 with Sol while waiting for Opus. A scheduled continuation follows the same split.

## Separate film pipeline

The Canvas/VHS film pipeline retains its all-Opus 5.5 roles at high effort,
`generator/film/authoring-models.json`, and strict `generator/run-opus.mjs` launcher.
It has no fallback. Book planning stays Sol and book D3/Strudel authoring stays Opus.
Record each task’s actual model split; never credit Sol research as Opus work.
The user’s explicit instructions take precedence over either pipeline default.

## Entry points and CI

`AGENTS.md`, `CLAUDE.md`, both `viz-scene` skills and the book commands refer here.
`generator/authoring-models.json` contains the machine-readable model IDs.
GitHub book/edit jobs run an Sol planning stage before the latest-CLI Opus stage.
Series planning and weekly paper discovery run Sol. CI needs `OPENAI_API_KEY`
with Sol access and `CLAUDE_CODE_OAUTH_TOKEN` with Opus access; credentials are
configured separately, never committed. A missing provider fails its stage without
substitution. Existing PR/preview/merge gates remain in force.

The deprecated v2 CLI accepts an Sol-authored `--storyboard` fixture; it must not
silently invoke its historical Anthropic storyboard planner. Use the scene-native
book commands for new work.

Model ID reference: [OpenAI model guidance](https://developers.openai.com/api/docs/guides/latest-model).
CI reference: [Codex GitHub Action](https://learn.chatgpt.com/docs/github-action).
