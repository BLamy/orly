# Book 3 author notes — Decisions Become Actions

## September 18 revision

All three chapters now explain the public Jev Ultrafast implementation pinned
to commit `1231850a0bf1a0c0341fe408ef1668dbbfdfac46`, using an illustrative flight
search. Fable 5.1 authored the replacement scenes and the reviewed layout fixes
through Claude Code subprocesses. The parent verified exact captions, generated
and integrated ElevenLabs narration, reviewed cue frames, and checked recorded
playback, deterministic seeking, and live blog sections.

The current source mapping is in
`series/from-rlcd-to-predictive-tab/jev-ultrafast-source-note.md`. Earlier notes
below describe the superseded proposed-architecture draft.

Visualization author: Claude Fable 5.1 (`claude-fable-5-1`). Scope so far: **chapter 1 only** (chapters 2–3 pending parent verification).
No shell, typecheck, build, Storybook, or render ran in this session. Validation is the parent's.

## Files

- `chapter-1.tsx` — exports `buildScene`, `Render`, `vizScene`. `chapter-1.stories.tsx` — CSF3, `Books/Decisions Become Actions/Chapter 1`, silent `Player`.
- `shared/kit.tsx` — `Chip`, `corners`, `clamp01`, `lerp`, `tri`, `chipW` (subdirectory, so the scene glob skips it).
- Page, focus conventions, colour roles and `captionPlan` are imported read-only from `../next-useful-action/shared/profile-page`.

## Chapter 1 mechanism

One persistent object: a **candidate lattice** (`d3.scaleBand` targets × actions). Page placement `{30, 96, 0.8}`.

1. Camera starts pushed in on the page (k 1.25); an observation sweep marks eligible / disabled controls; pullback, then the lattice draws.
2. Six joint tiles fly from their live controls into cells (open, focus, fill, click spotlighted in caption order); `click + Save` is struck and filtered.
3. Page and tethers fade to 0, camera zooms to the lattice (k 1.2): independent row and column pickers meet at `fill × Sign out link` (impossible cell, coral ✕), then become one corner-bracket cursor on a real tile. Pullback before the page returns.
4. Rail from the OBSERVATION badge stamps tiles `v12`; a second sweep bumps to `v13`, tiles go "v12 stale ✕", then re-issue as `d1…d6`.
5. Task + history cards; per-tile `scaleLinear` score interpolators re-rank for three tasks (two labelled hypothetical), returning to the Brett task.
6. Small policy and larger model cards dock into one DECISION CONTRACT card; the policy lights all bars, the model drives the bracket cursor to `d3`.
7. Display-name row ghosts ("never found"); cursor slides to the best listed tile (amber); a `?` marker drops into the COVERAGE GAP card, separate from RANKING MISTAKE.
8. Row restored; menu ✓, model ✓, live page `?` recheck chips (tees up chapter 2); dashed `SuggestHalo` on the name field; stage dims to 0.1 under an opaque closing panel.

## Honesty labels / limitations

- Everything is tagged PROPOSED; scores read "illustrative ranking scores · not probabilities"; ids and versions read "synthetic". No numbers, latencies or benchmarks.
- No actual focus or activation occurs in this chapter, so `FocusRing` / `Activation` are not used; only the dashed suggestion halo appears.
- "Click this available button" spotlights `click + Sign out` (role `link` on the recurring page) with a "✓ available" chip, contrasted with disabled Save — the page has no other enabled button besides the Profile menu.
- Text widths are estimated from character counts (not rendered). Likeliest overlaps: verdict chip slot (x 987–1234, row 0), agreement chips (right edge ≈ 1242), eligibility chips in the page gutter.
- All lower-band content stays above world y 560 at k = 1; zoomed frames computed to stay above screen y 575.
