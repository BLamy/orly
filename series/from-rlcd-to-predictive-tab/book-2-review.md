# Book 2 — pending Fable visual correction

All 33 captions match; typecheck, production build, native playback verifier, Storybook mounting, deterministic forward/backward seeks, and eight standalone live blog sections pass. All caption cue frames were reviewed. Visual approval remains pending.

1. Chapter 1, cue 6 (also inspect subsequent cues): the label `sequential steps · unscaled, not timed` at line 355 extends beyond the right edge. Reposition the work strip or label so the entire text stays inside the 1280×720 stage and above the caption area. Preserve the mechanism and exact captions.
2. Chapter 4: the numerical path scores are synthetic. The code comments explain this, and a later label says illustrative, but the earlier visible score display needs an explicit `illustrative, not measured` label and concise indication that values are chosen to demonstrate ranking. Retain the separate schematic-tokenization disclosure. Do not imply measured Qwen probabilities or calibrated confidence.

Chapter 2’s right-side `◆ own` labels were checked at full resolution: that is their complete text, not a clipped phrase. No correction is required there. Chapter 3’s cue contact sheet showed no layout issue.

Use a fresh bounded Claude Fable 5.1 worker via `npx --yes @anthropic-ai/claude-code@latest` after the provider reset. Return a minimal exact patch or edit only book 2 visualization files. All actual visualization authoring must remain Fable’s. Recheck corrected frames plus opening/middle/ending and reverse seeking. Do not start book 3 until these corrections pass.
