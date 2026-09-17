# Visualization commission: From RLCD to Predictive Tab

Build this six-book series in the Orly project. The parent Codex assistant has written the complete narration in `series-script.json` and `series-script.md`. Claude Fable 5.1 owns the D3 visualization implementation. Preserve that division of work.

The user explicitly requested the latest Claude Code package. Every Claude Code launch must use:

```sh
npx --yes @anthropic-ai/claude-code@latest
```

Use the exact visualization model `claude-fable-5-1`; do not substitute a different model or silently use the globally installed `claude` executable. Check the latest CLI help for supported invocation and permission options. Launch one bounded Fable subprocess per book from the Orly worktree, for example using `--model claude-fable-5-1 --print` with a book-specific prompt supplied on standard input. The coordinating Codex task remains responsible for integration and verification. Do not request separate user-owned tasks for the books unless the user asks.

The requested npx entrypoint was verified as Claude Code 2.1.274, and authentication was confirmed active after the user signed in. Recheck in the task environment; actual Fable model access still needs confirmation from the invocation. Never print, commit, or request credentials in chat. If access to the requested model is unavailable, finish source preparation and reviewable scaffolding, report the exact blocker, and keep the Fable assignment pending. Do not claim Fable authored work it did not author. Retain a compact provenance record with CLI version, actual model reported by the provider, book scope, and verification result; avoid private auth/session material.

## Deliverables

- Six books, 19 chapters, in the order given by `series-script.json`, sharing the series name **From RLCD to Predictive Tab**.
- Each book has its own animal and accent from the script. Titles, slugs, chapter ordering, and spoken captions come from that file.
- Native Orly chapter scenes, matching Storybook stories, generated book metadata, a live companion blog, and the repo's normal cover/narration assets where the required services are configured.
- A local preview and verification record. Prepare a branch or draft PR if appropriate. The user has asked for the series to be built, not for an automatic production merge or deployment.
- A progress record per book distinguishing source preparation, Fable authoring, visual review, audio/cover generation, and completed verification. Missing audio must not be represented as a finished narrated release.

## Source and narration contract

Copy the supplied deliverables into a sensible series directory in the worktree before implementation so the project is self-contained. Preserve the source hashes and original narration. The source project is `/Users/blamy/Documents/Codex/2026-09-16/can-you-get-this-running-on`; its charter is the authoritative vision. Inspect its actual code for all current-implementation claims. The source map in the JSON identifies relevant files and known limitations.

This is explicitly a **product vision**, so animate proposed behavior as proposed. Orly's rule to ground work in code does not mean inventing implementation files for the future product. Use the real charter and named backlog milestones for proposed layers. Keep those distinct from the native reference and current browser prototype. Do not alter the Qwen implementation project as part of this visualization task.

Spoken captions are complete and must be preserved verbatim and in order. Do not call Orly's generative storyboard path to replace the parent-authored script. Give Fable a chapter's captions plus visual direction as its fixed input. If a factual error is discovered, document the source and propose the smallest correction before changing the narration. Timing, motion, onscreen examples, labels, and composition are Fable's creative responsibility.

There are 153 captions and about 3,705 spoken words, approximately 24–28 minutes before final voice timing. Chapters have eight or nine captions and should normally occupy about 60–120 seconds. Derive durations from the actual voice recording when produced; do not pad short material with repetition. Spoken technical names can use pronunciation handling in the narration pipeline without changing visible claims.

Keep references, paths, JSON syntax, and implementation identifiers onscreen or in companion prose, not added to the spoken captions. Never expose private local paths as clickable links in published books. Caption equality should be checked by extracting `vizScene().tl` captions through the project's supported mechanism and comparing with `series-script.json`.

## Visual language

Read `AGENTS.md`, `.claude/commands/new-book.md`, `.claude/commands/new-series.md`, and `.agents/skills/viz-scene/SKILL.md` in the actual worktree. If a documented skill path is stale, resolve the equivalent local skill. Inspect two or three working exemplars before editing.

Use the existing D3-backed React/TypeScript scene system, not a standalone HTML presentation. D3 scales, interpolation, paths, layouts, and precomputed data should do meaningful work. The pure sampled timeline owns time. No `d3.transition`, scene-owned animation clocks, intervals, CSS animations, unseeded randomness, or scene-owned audio.

Each chapter needs one persistent visual object that changes as the explanation develops, a sampled camera channel using the correct camera interpolator, and at least one visual mechanism beyond a static box diagram. The supplied per-chapter visual directions are the storyboard brief; Fable should turn them into clear motion, not just reveal a sequence of text panels.

Use a recurring fictional account/profile page across the series, with the explicit task “Change my display name to Brett.” Keep the page geometry, control labels, task data, candidate colors, and focus styles consistent. For the RLCD explanation, use a separate fictional support note classified by topic and urgency. Do not accidentally imply that independent support classifications are a plan for independent future browser actions.

Visual identity suggestions:

- Cyan: live observation and browser targets.
- Violet: model computation and context state.
- Green: checked outcomes and supported decisions.
- Amber: uncertainty, pending checks, and explicit fallback.
- Coral: invalid or stale choices and failed outcomes.
- Actual keyboard focus: solid visible ring. Predicted target: distinct suggestion halo. Click/activation: a separate, explicit animation.

Colors never carry meaning alone. Use labels, shapes, or state icons too. Keep the stage caption area clear below approximately y=630 on the 1280×720 stage. Fade irrelevant layers before a new emphasis; closing text must not cover active detail. Make all scenes deterministic when seeking forward, backward, or directly into the middle.

## Technical visual examples

These are synthetic teaching fixtures, not recorded customer data or benchmark output.

**Support classification:** show an input such as “The export failed twice; I need the report for tomorrow.” Topic choices can be `billing`, `export`, and `account`; urgency choices can be `low`, `medium`, and `high`. Do not call an illustrative selected urgency a verified ground truth. Choose exact choices and tokenization only after inspecting the pinned tokenizer if actual token IDs are claimed.

**Token collision:** the script's paths `[17]`, `[17,42]`, and `[17,91]` are explicitly synthetic. They demonstrate a terminal prefix and two continuations. Label them “schematic token paths.” Never label these as actual Qwen tokenization. Show additional work for unresolved paths and retain a visibly separate completed branch.

**Typed action record:** an onscreen example may use the following illustrative shape, labeled as a proposed contract:

```json
{
  "observationVersion": "v12",
  "candidateId": "c7",
  "action": "fill",
  "target": "display-name-field",
  "argument": { "source": "task", "value": "Brett" }
}
```

The candidate ID is ephemeral and need not be one tokenizer token. The target/action pair is selected jointly. The executor resolves a locator from the live target; this record is not itself a production API or a durable selector. Suggested Playwright labels such as `getByRole('textbox', { name: 'Display name' })` are illustrative code recipes that still require uniqueness, visibility, and actionability checks. Avoid arbitrary code evaluation and guessed selectors.

**Confidence and charts:** label synthetic scores “illustrative ranking scores,” not calibrated probabilities. Do not invent latency figures, model sizes for an unbuilt policy, benchmark bars, success percentages, or a claimed speedup. Prefer an explicitly unscaled work ribbon to fake numerical timing. Any numerical chart must say “illustrative, not measured” and show the simulation assumptions.

## Facts that the animation must preserve

1. RLCD is an inference strategy. Training and distillation change model weights and are separate chapters of the story.
2. Ordinary autoregressive generation already caches context. Its distinguishing issue here is sequential output work, not repeated full rereading on every token.
3. The RLCD contract has one logical shared prefill, a real batch of field queries, correct branch state, explicit choice scoring and continuation, and code-built typed output. It is not a claim of one total forward pass, free memory sharing, or zero continuation work.
4. The native reference loads Qwen2.5 1.5B and still needs collision/cache/reporting fixes. Its comments and telemetry overclaim some properties. The current browser structured-output demo is not faithful browser RLCD.
5. Joint browser choices depend on a live observation. Revalidate a locator, execute one action, then observe. Do not animate concurrent future actions as if their page states already exist.
6. Recorded behavior is not automatically successful behavior or known intent. Training inputs stop before the labeled action. Unknown goals stay unknown. Teacher labels need review. Historical playback cannot evaluate unobserved alternative actions.
7. The linked recordingExtension source was inaccessible in initial research. No specific injection, permission, storage, or rrweb configuration claims are established from it. General rrweb concepts can be grounded in the primary rrweb documentation. Actual Replay ingestion remains a separately inspected adapter.
8. Local model inference and local training are separate deployment choices. Native local training plus small-model browser export is the starting path; browser Qwen training is not required.
9. GLM-5.3-Flash is the user's intended teacher/baseline, subject to actual provider identity and capabilities. Hosted schemas do not establish low-level RLCD support. A large model retains real computation costs; a small student does not inherit full general intelligence by default.
10. Predictive Tab moves focus only on user acceptance in enabled contexts. It does not implicitly activate. Preserve ordinary behavior when uncertain, Shift-Tab, Escape dismissal, and editor shortcuts. Extension-produced focus is not an independent positive training label.
11. The end goal is faster completed tasks at a frozen useful quality bar, counting observation, inference, network, execution, failure, and fallback. The proposed release must pass actual evaluation; it is not complete because a diagram looks plausible.

## Implementation and verification sequence

Coordinate the series, but give each book a fresh bounded Fable session. Follow Orly's local instruction to build and verify each book before starting the next. Share the recurring page/visual brief through checked-in source; avoid parallel workers racing on library metadata. A per-book Fable assignment may create book-local shared helpers but must not change core primitives or rewrite unrelated books.

1. Check worktree instructions and source provenance. Copy the script and plan; make a book-level implementation checklist.
2. Recheck Claude authentication with `npx --yes @anthropic-ai/claude-code@latest auth status`. Confirm actual access to `claude-fable-5-1`. Do not accept a fallback model.
3. Supply one book's exact captions, source anchors, visual directions, relevant Orly APIs, allowed paths, and validation expectations to that Fable subprocess. Capture its structured result if supported, including actual model identity without exposing credentials.
4. Review the resulting native chapter modules and stories. Verify exact narration, factual framing, deterministic seeking, caption clearance, and a transforming visual mechanism in every chapter. Send bounded corrections to Fable when needed.
5. Run the actual repo's typecheck and build commands. Scrub every chapter in Storybook at opening, transitions, a middle state, and ending, including backward seeks. Inspect rendered frames, not only source code.
6. Generate cover animals with Codex's built-in ImageGen when available, following Orly's skill/rules: pure white background, no lettering, visually checked art, expected image files, and only “O'RLY?” composited branding.
7. Run the native book pipeline against the authored scenes, with shared series metadata and the correct order. Preserve the script; let the pipeline synthesize narration and derive cue times. If ElevenLabs is not configured, retain the silent/free-voice preview and report the remaining audio step accurately.
8. Author companion prose as semantic live Docstream sections with non-overlapping manifest-clock windows. Run `generator/blog-viz.mjs` and `generator/verify-book.mjs` with the actual supported flags and ensure the shelf metadata is valid.
9. Record completed checks, remaining service-dependent work, preview locations, source changes, and Fable provenance for this book. Only then start the next book.
10. Verify the complete series order, navigation, consistent recurring example, narration, and all six books together. Present the completed local result or draft PR with any specific limitations. Do not silently publish or merge.

Routine reversible work is authorized. Ask only for genuinely missing access or a consequential unresolved choice, and continue independent work while waiting. This commission requests implementation of the full series, not merely a plan or a sample chapter.
