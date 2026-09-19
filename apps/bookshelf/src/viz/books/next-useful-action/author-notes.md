# Book 1 author notes — The Next Useful Action

Visualization author: Claude Fable 5.1 (`claude-fable-5-1`), one bounded session, book 1 only.
No shell, network, typecheck, build, Storybook, or render ran in this session. Validation is the parent's.
This file was meant for `series/from-rlcd-to-predictive-tab/book-1-author-notes.md`; that write was denied by the session's permission mode, so it lives here. Move it if wanted.

## Files (all in this directory)

- `chapter-1.tsx`, `chapter-2.tsx`, `chapter-3.tsx` — each exports `buildScene`, `Render`, `vizScene`.
- `chapter-<n>.stories.tsx` — CSF3, title `Books/The Next Useful Action/Chapter <n>`, silent `Player`.
- `shared/profile-page.tsx` — the recurring page and conventions. It is in a subdirectory so the `books/*/*.tsx` scene glob does not register it.

## Captions

The 24 captions are copied verbatim from `series-script.json` into a `CAPTIONS` array per chapter, one `tl.caption` each, in order.
Durations come from `captionDur(text)`: words ÷ 2.5 per second (150 wpm) plus 1.1 s, minimum 5 s, 0.5 s gap. Expect about 90 s per chapter. Every tween is anchored to its caption start (`AT[i] + offset`).

## Recurring page — geometry for later books

Import from `../next-useful-action/shared/profile-page`. Page-local units, origin at the window's top-left, 560 × 440. Place with `{ x, y, scale }`; `controlRect(id, placement)` gives stage coordinates.

| Control id | Role · name | x | y | w | h |
| --- | --- | --- | --- | --- | --- |
| `profile-menu` | button · Profile menu | 420 | 46 | 118 | 30 |
| `display-name-field` | textbox · Display name | 32 | 178 | 336 | 40 |
| `email-field` | textbox · Email | 32 | 254 | 336 | 40 |
| `save-button` | button · Save, disabled until edited | 32 | 326 | 112 | 40 |
| `sign-out-link` | link · Sign out | 444 | 334 | 88 | 26 |

- Chrome bar y 0–36 (URL `account.example/profile`, optional observation badge). Nav y 36–84. Heading at y 122. Saved toast at x 32, y 384.
- The gutter x 380–540 beside the fields is deliberately empty, reserved for suggestion hints and keycaps.
- `TASK_TEXT` = "Change my display name to Brett". Name `brettl42` → `Brett`. Observation v12, then v13 after one action.
- Props: `formU`, `typeU` (Save enables past 0.8), `savedU`, `menuOpenU`, `marks`, `obsLabel`.
- Placements used: chapter 1 `{60, 56, 0.92}`; chapter 2 `{40, 74, 0.86}`; chapter 3 lenses 0.72, tower 0.5.

## Focus, suggestion, activation

Three components on separate channels, each with its own shape and text label.

- `FocusRing` — actual keyboard focus: solid light ring, cyan glow.
- `SuggestHalo` — predicted target: dashed violet halo, wider than the ring, tagged "suggestion"; drift comes from a sampled `phase` channel.
- `Activation` — click or checked action: one expanding cyan ripple with a crosshair.
- Also `Pointer`, `Keycap`, `TaskChip`, `ProposedTag`. Chapter 3 adds corner brackets for an agent's "chosen target, still to be checked".

`ROLE` holds literal hex colours (cyan observe, violet model, green checked, amber pending, coral invalid) because `colors.ACCENT` follows the viewer's theme.

## Mechanisms

- **Chapter 1.** Page plus an unscaled work ribbon. A person's trace fills seven segments; a `scaleLinear` relayout stretches the pauses; one pause lifts out and unfolds into route A and proposed route B. Route B is reused for the person beat (halo glides, Tab, only focus moves) and the agent beat (check, ripple, fill, observation sweep). The ribbon ends as an empty evidence bar inside an opaque closing panel.
- **Chapter 2.** Sixty-six violet dots start as a `d3.tree` of schematic continuations, fold into a pool, then pour over joint target/action tiles tethered to live controls. Hand-written counts re-pour the same dots for page-only, with-task, unsure, missing-target, and promise states. The disabled Save tile is ejected.
- **Chapter 3.** One page splits into two synchronized lens copies. The agent lens re-sorts the same bars when the task is stated. The copies rejoin, lens frames morph into product cards, shared layers draw in, and the camera descends to the E0–E6 tier, climbs the charter milestones, then pushes into the decision engine as it opens.

## Honesty labels

Proposed elements carry a dashed `PROPOSED` tag or dashed outline. Scores read "illustrative ranking scores · not probabilities". Ribbons and lanes read "unscaled · not measured". There are no latency figures, percentages, or benchmark bars; gauges, tallies, and checklists are drawn empty. Milestone labels come from the charter's epic table.

## Limitations to check first

- Nothing was compiled or rendered. Text widths are estimated from character counts, so label overlaps are the likeliest defect: chapter 1 lane captions, chapter 2 lane badges, chapter 3 lens header chips.
- Chapter 3's person lens suggests the Email field from a synthetic history, on purpose, so the most common click differs from the task's answer. Book 6 may prefer the name field.
- Chapter 1 replays the task after beat 2, marked by an on-screen "replayed" chip. Its route progress is reset with `tl.set` while route B is dimmed to 0.1; a faint jump may show when scrubbing beat 6.
- Chapter 1 uses one `<pattern>` id, `nua1-hatch`.
- Caption clearance below screen y 630 is by calculation, not inspection.
