# From RLCD to Predictive Tab

## Jev explanation revision - September 18, 2026

The requested revision ends book 2 chapter 4 at 45.900 seconds, before the
app-status commentary. Book 3 now explains the public Jev Ultrafast browser
agent through a flight-search example: observed element indices, compatible
target sets, conditional questions in one request, selective text generation,
and guarded execution followed by observation. See
[the source note](jev-ultrafast-source-note.md) for the pinned implementation.

The revised contract contains 150 captions across the planned six books.
Original package hashes remain recorded in `originalPackageHashes`; current
package hashes track this explicitly requested editorial revision. Earlier
script, provenance-mismatch, and narration status below is historical.

## Narration update - September 18, 2026

Books 1-3 now contain ten ElevenLabs recordings using the existing narrator
`Fahco4VZzobUeiPqni1S` and `eleven_multilingual_v2`. Their manifests use the
returned character-alignment cues, and their 20 blog sections use those final
recording times. The scene captions match the canonical `series-script.json`
exactly. Per-book playback results are in `evidence/<slug>/narration-check.json`.

The full package verifier has a pre-existing `series-script.md` hash mismatch;
the canonical JSON, plan, and visualization brief still match their recorded
hashes. Narration was built through `generator/video.mjs` after independently
checking exact scene-caption equality. The original provenance hashes remain
unchanged. Books 4-6 still require scenes and narration; no production release
is included. Earlier configuration and narration status below is historical.

The original narration package is preserved in this directory: six books, 19 chapters, 153 captions, 3,707 spoken words. The script is the fixed narration contract. The plan controls series order and cover identity. The visualization brief controls source framing and authorship.

Private source snapshots remain in the author's local, gitignored `source-snapshot/` directory and are not included in this public repository. `provenance.json` retains their hashes. The `--sources` check and source-grounded reauthoring require those authorized local snapshots; normal application builds and scene-caption verification do not.

## Scheduled continuation — September 17, 2026, 3:50 a.m. ET

The source/narration contract check passed. Automatic approval review blocked the required Fable invocation before it launched, and rejected a second review supplied with the scheduled authorization and saved consent evidence. No provider request, scene correction, commit, or publication occurred in this continuation. The latest bounded correction assignment is `.orly-work/book-2-resume.md`. Resume at book 2 after the approval blocker is resolved; no model substitution is permitted. The user has authorized publishing the completed, verified series, superseding the original preview-only directions below. No partial series has been published.

## Current state

Update, September 17: the originating task resumed with publication authorized. Book 2's Fable corrections and visual review now pass, with fresh book, blog, and Storybook verification. Book 3 now has all three Fable-authored scenes, 24 exact captions, passing typecheck/build, reviewed cue frames/endings, and deterministic Storybook seeking. The parent added only the standard chapter 2 Player story wrapper. Fable hit its session limit after writing chapters 2 and 3; the provider reports reset at 4:30 p.m. America/New_York (20:30 UTC) on September 17. Books 4–6 still require Fable authoring. All six animal covers and companion-blog section text are prepared. Later historical status paragraphs below describe the earlier interrupted run; `progress.json` is the current per-book record.

The user now requires ElevenLabs recordings and synchronized voice, captions, and animation before publication. `build-book.mjs` refuses to fall back to silent narration when the key is absent; this rejection was verified on book 1. Credentials have been requested in the gitignored `.env`; never put credentials in source or chat. After narration, run `verify-narration.mjs <slug>` for every book, in addition to the visual checks. Regenerate blog windows against the final recording cues. No production release may use the existing browser-speech previews. No merge or deployment has occurred.

Book 1, **The Next Useful Action**, is built and verified as a browser-speech local preview. Its 24 captions match exactly, all three Storybook stories render and seek deterministically, the production build and native playback verifier pass, and its six semantic live blog sections have non-overlapping windows. Fable authored the scenes and both layout correction patches. Book 2 has four Fable-authored scenes, 33 exact captions, an ImageGen octopus cover, eight validated live blog sections, and passing typecheck/build/playback/deterministic-seek checks. Visual approval is pending the corrections in `book-2-review.md`. Books 3–6 remain unauthored. Fable rejected further requests because its five-hour session limit was reached; the provider reports reset at September 17, 2026, 3:40 a.m. America/New_York (07:40 UTC). See progress.json for per-book status.

The user explicitly authorized the private source disclosure needed by Claude Code. Every worker uses `npx --yes @anthropic-ai/claude-code@latest` with the requested `claude-fable-5-1` model; CLI 2.1.274 and provider model identities are retained in compact provenance files. No substitute visualization model is used.

All six pinned source snapshots match the supplied narration contract. Active native engine/schema files changed during authoring; SOURCE-NOTE.md records the evidence and dated framing. The Qwen source project is read-only. No source files there were modified. ElevenLabs is unconfigured in this environment, this worktree, and the main checkout; browser speech remains the preview fallback until recorded narration is configured. No production deployment or merge has occurred.

Dependencies are installed with the existing lockfile using `npm ci --legacy-peer-deps --ignore-scripts`. The dedicated branch is `codex/from-rlcd-to-predictive-tab`. Local Orly runs on port 5178 and this worktree’s Storybook on port 6007.

## Verification and continuation

Run the dependency-free source checks:

```sh
node series/from-rlcd-to-predictive-tab/verify-contract.mjs --sources
```

After each Fable book is authored and dependencies are installed, extract its native scene captions:

```sh
node series/from-rlcd-to-predictive-tab/verify-contract.mjs --scenes --slug next-useful-action
```

This uses the project's actual `extractScene` mechanism and exact string equality. Continue with typecheck/build, Storybook opening/middle/transitions/ending and reverse seeking, cover ImageGen and visual inspection, the native video pipeline, live semantic blog sections, book/blog validators, and the progress record. Only then start the next book in a fresh bounded Fable session. Verify all six together at the end. Publication is authorized after final ElevenLabs narration and synchronization checks pass.

The video pipeline validates speakability before narration. Preserve the fixed captions when handling any pronunciation-validation issue.

## Resume after the provider reset

Use `npx --yes @anthropic-ai/claude-code@latest` with `claude-fable-5-1`, never the installed global Claude or a substitute model. First give a bounded Fable worker `book-2-review.md` and the existing book-2 assignment; retain provider model provenance and apply its corrections. Rebuild book 2 and repeat affected visual checks before marking it approved. Then prepare and author books 3–6 sequentially using `prepare-assignment.mjs`, completing each book’s verification before starting the next. Preserve all 153 captions and the pinned source framing. For book 4, investigate the pipeline’s rrweb speakability rejection with pronunciation-only handling; do not rewrite captions. No scheduled retry, PR, production merge, or deployment has been created.
