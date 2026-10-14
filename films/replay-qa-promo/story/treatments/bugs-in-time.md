# Treatment: "Bugs in Time" (angle: bugs-in-time)

**Film:** replay-qa-promo · look **promo** · 1:30 (hard ceiling 1:40) · as of 2026-10-14
**Title on the shelf:** *Some Bugs Only Exist in Time*
**Narration:** about 155 words (target 177). The rest is music and type: a promo breathes.

## Logline

A page that looks perfect in a screenshot drops four frames, and an idle tab asks the same question 258 times. Rewind
the recording and you find the cause. Pull back and you see what caught it: Replay QA, a fully managed end-to-end
testing platform that explores your app, runs its journeys on a schedule, against staging and on every pull request,
and hands you every bug as a recording with its root cause.

## Why this angle

The hook is something a viewer *feels* before they understand it: missing time. We open on a still (a screenshot is
the medium that can't show the bug), let the frame budget run out, then rewind. The reveal turns the hook into the
product argument. A screenshot can't catch this kind of bug, so you need recordings. Recordings need something that
runs them all the time, so you need a managed platform. The twist is true and sticks in the memory: one of the two bugs
was on **Replay QA's own Projects page** [TIME-09].

Time split: hook (ch1 and ch2) 32 s; **primary message (ch3 and ch4) 58 s, 64 %**; agent pair about 7 s inside ch3.

## Chapters (total 1.5 min)

| # | chapter | time | min | job |
|---|---|---|---|---|
| ch1 | Looks fine | 0:00–0:16 | 0.27 | cold open: a still page, then the frame budget runs out; nobody clicked |
| ch2 | Rewind | 0:16–0:32 | 0.27 | rewind the recording: the cause of the 67 ms commit; a second bug, the 258-fetch loop |
| ch3 | The platform that caught it | 0:32–1:25 | 0.88 | pull back, introduce Replay QA, show the managed loop (explore → journeys → runs → bugs) running on a schedule, against staging and on every PR; recordings as proof; the quiet agent beat; a collage of proof |
| ch4 | End card | 1:25–1:30 | 0.08 | ember haze, bracketed tagline, Replay mark, qa.replay.io |

## Recurring devices

**Visual**
1. **The frame strip.** A thin row of hairline cells, each one frame of the 16.7 ms budget [TIME-18], slides left
   like film through a gate. It is how the film makes time visible. In ch1 four cells go hollow under a red-pink 67 ms
   bar. In ch2 it runs **backwards** (the rewind). In ch3 the same strip turns into the row of runs (each cell a run,
   each run emitting a recording chip). On the end card it is the hairline rule under the tagline, ticking slowly.
   It is drawn and labelled as an illustration of the budget, never presented as product UI.
2. **The `▶ recording` chip.** A small rounded pill with a play glyph. It is born in the rewind (ch2), it comes out of
   every run (S13), the developer agent hands it to the critic (S14), and it sits beside the Replay mark on the end
   card. One object for the whole promise: *every run is a recording*.
3. **Bracketed type with corner dots** (kit `bracket`, `squareDots`), the reference's signature, used four times
   and no more: `{ looks fine }` → `{ in time }` → `{ introducing }` → the end-card tagline.
4. **Crop, zoom, underline.** Every product frame is cropped to what the line names, shown ≥ 900 stage px wide, and the
   exact number in the UI gets a red-pink hand-drawn underline as the narrator says it (67ms, 258, −1, Tue at 3:00 AM,
   staging, PR #3).
5. **Haze as register.** Ch1 is bare studio paper (no haze: the coldness of a screenshot). Ch2 is the `brand` haze
   (plum with Replay red-pink and violet) for time travel only. Ch3 opens on `dawn` for `{ introducing }` and goes back
   to paper with `hairlines` for the product. Ch4 is `ember`.

**Narrative**
- **"Looks fine" vs "in time".** Ch1 says *a screenshot says this page is fine*. Every later beat answers it with
  something that happens over time: a schedule, a pull request, a rerun. The last line closes the circle: *for the bugs
  that only exist in time*.
- **Short lines that land on the cut.** One idea a line, often a fragment; numbers said the way people say them
  ("sixty-seven milliseconds", "two hundred fifty-eight"), with the exact figure on screen.

## Music (Strudel, composed to the locked clock)

Tempo 120 BPM, 4/4, so one bar = 2.0 s. Every cut below falls on a bar line.
- **0:00–0:16 (ch1):** almost nothing. A warm low pad and a dry, soft **clack** on each frame tick (wood, not a chime).
  At the stall (0:08) the clacks **stop for four beats**: the dropped frames are heard as silence. The pad holds.
- **0:16 (ch2 downbeat):** a reversed-pad swell (tape rewind) that blooms into the brand register: a half-time
  broken-beat with a muffled kick. On "two hundred fifty-eight" a muted, repetitive pluck loops, the same note, the
  same length, never changing, like the stuck checkpoint.
- **0:32 (the drop, on the whip):** four-on-the-floor enters, bright pads, the full groove. This is where the film
  turns from a bug into a product.
- **0:38:** one bar of stop-time (pad only) under `{ introducing }`. The kick returns at 0:40 with the Replay mark.
- **0:54 / 0:56 / 0:58:** "On a schedule" / "Against staging" / "On every pull request" each land on a downbeat with a
  short filtered stab.
- **1:12–1:20 (agent beat):** the arrangement thins to a two-note call and response on a muted pluck (developer
  rising, critic answering low for "not yet", then resolving up for "good"). Clacks, no chimes.
- **1:20:** full arrangement at its peak under the collage.
- **1:25:** resolve to the tonic. The groove drops out, a warm pad and one last soft clack under the end card. Tail to
  1:30.

## Shot by shot

Timings are planned on the 2 s bar grid; the narration clock (film-narrate) will lock the real values. Takes are the
cleaned rrweb files in `public/generated/replay-qa-promo/rr/`; marks are in ms.
**Crop rules for every product shot:** crop out the left chat column, the credit meter and the sidebar footer (owner's
display name); never show an e-mail address, login variable or token.

### ch1 · Looks fine (0:00–0:16)

**S01 · 0:00–0:06 · "the screenshot"**
- **Visual:** bare paper `#e9e8ea`. Hard cut in on a single **frozen** frame of take `projects` at about 2980 ms
  (the Projects grid of cards), cropped to the grid only (sidebar and footer out), floating with a soft shadow and a
  slight 3-D tilt that settles. Nothing moves except the tilt settling. A tiny mono caption under it:
  `Projects page · Replay QA`. At 0:03 the bracket `{ looks fine }` opens above it, braces parting, corner dots.
- **Narration (L01, from about 0:02):** "A screenshot says this page is fine."
- **On-screen type:** `{ looks fine }`
- **Take / marks:** `projects`, held at about 2980 ms (between start and scrolled 3348). No playback: a still.
- **Music:** low pad, a frame clack every beat.
- **Claims:** TIME-09 (the bug was on Replay QA's own Projects page), TIME-08.

**S02 · 0:06–0:12 · "the frame budget runs out"**
- **Visual:** the screenshot drops back and dims a little. Across the lower third, the **frame strip**: hairline cells
  slide left, each labelled with a faint `16.7 ms`. At 0:08 a red-pink bar marked **67 ms** lands across the strip and
  **four cells turn hollow coral**. A counter types `67 ms` large (Inter light), then `4 dropped frames` under it.
  A small corner note: `frame budget 16.7 ms · illustration`.
- **Narration (L02):** "But for sixty-seven milliseconds, it stalled. Four frames, dropped."
- **On-screen type:** `67 ms` · `4 dropped frames` · `16.7 ms per frame`
- **Music:** the clacks stop for four beats exactly while the cells go hollow.
- **Claims:** TIME-08, TIME-18. (Never call it a "long task".)

**S03 · 0:12–0:16 · "nobody clicked"**
- **Visual:** the strip keeps sliding as if nothing happened. A drawn cursor glyph appears beside the screenshot,
  greyed, with a hairline strike: no click. Type arrives word by word: `no click` · `just a background refresh`.
  The edges of the frame start to warm toward plum as the brand haze creeps in from the bottom.
- **Narration (L03):** "No click. Just a background refresh."
- **On-screen type:** `no click · background refresh`
- **Music:** pad starts to swell (reverse envelope).
- **Claims:** TIME-08 (triggered by a background RTK-Query refresh with no user action).

### ch2 · Rewind (0:16–0:32)

**S04 · 0:16–0:20 · "rewind"**
- **Visual:** cut on the downbeat into the `brand` haze. Kinetic line, word by word with the white → peach → orange
  sweep on the tail: `Some bugs only exist { in time }`. The frame strip **runs backwards** fast with a rewind glyph
  (kit `icon` rewind), then decelerates and stops. A blur dissolve carries us into take `bug-react`, seeking
  3040–3200 ms: the chips `Open · Medium · React Rendering` and the title, cropped to chips and title and shown
  ≥ 900 px wide. **The empty dark player panel is covered by our own overlay**: the frame strip and the rewind glyph,
  so no "Loading replay…" text is ever visible. We draw no timestamp on the player (its real reading is 0:51; never
  draw a scrubber at 6:23).
- **Narration (L04):** "Some bugs only exist in time. So rewind."
- **On-screen type:** `Some bugs only exist { in time }`
- **Take / marks:** `bug-react`, open/report 3032 (seek 3040 → 3200 for the chips, title and dark player).
- **Music:** reversed swell resolves on 0:16; half-time broken-beat begins.
- **Claims:** TIME-15, TIME-08, TIME-05.

**S05 · 0:20–0:26 · "the cause"**
- **Visual:** the camera slides down the same bug page (tape eased from 8723 → 12008) and settles on the
  **Root Cause** paragraph, cropped. Red-pink underlines land on `wasting 34ms` in the title strip pinned at the top,
  then beside the screen a grid of **27 small dots** (fibers): 25 fade to grey hollow, 2 stay solid red-pink.
  Type: `25 of 27 renders changed nothing on screen`. The title strip keeps `on the Projects page` legible.
- **Narration (L05):** "There's the cause: twenty-five of twenty-seven renders changed nothing on screen."
- **On-screen type:** `25 of 27 renders · no DOM change` · `≈ 34 ms wasted`
- **Take / marks:** `bug-react`, actual 8723 → rootcause 12008 (hold at about 12200).
- **Music:** groove settles; one muted hit as the 25 dots grey out.
- **Claims:** TIME-08, TIME-17 (labelled inference: only a runtime recording keeps that work).
  ("25 of 27" is a count of fibers, never a share of the time: do not draw a pie.)

**S06 · 0:26–0:32 · "the loop"**
- **Visual:** whip-free hard cut to take `bug-sync` at report 1603: the chips `Fixed · Medium · Network Performance ·
  Local` and the title "Live-sync loop re-fetches /api/repos/maple/reading-room/pulls 258 times with checkpoint
  never advancing past -1", cropped to chips and title. Over the empty player panel, our overlay: a column of request
  ticks stacking fast with a counter racing `0 → 258`, and beside it a small chip `checkpoint −1` that **never moves**
  while everything else accelerates. Tape eases to actual 5402 for a beat of the Actual Behavior card (cropped below
  the judge links).
- **Narration (L06):** "Or a sync loop: two hundred fifty-eight fetches, its checkpoint stuck at minus one."
- **On-screen type:** `258 re-fetches` · `checkpoint −1`
- **Take / marks:** `bug-sync`, report 1603 → actual 5402.
- **Music:** a muted pluck repeats one note, same length, like the stuck checkpoint.
- **Claims:** TIME-11, TIME-16, TIME-13 (it is a pull-request list, not "an app").
  The number 258 appears only here; it never shares a frame with the Insights discovery card (TIME-14).

### ch3 · The platform that caught it (0:32–1:25)

**S07 · 0:32–0:38 · "pull back"**
- **Visual:** **whip** on the drop. The bug-sync screen shrinks back fast; it becomes one tile in a fanned row of
  floating screens. Next to it, the bug-react title tile lands. The two tiles tilt, settle, and hairlines run across the
  paper. A tiny caption under bug-react: `Replay QA's own Projects page`.
- **Narration (L07):** "Replay QA caught both. One of them in Replay QA itself."
- **On-screen type:** `caught by Replay QA` (small, under the tiles)
- **Take / marks:** `bug-sync` (held at 1603) and `bug-react` (held at 3150) as tiles.
- **Music:** **the drop**: four-on-the-floor enters on 0:32.
- **Claims:** TIME-09, TIME-11, TIME-06 (both are polish-pass findings).

**S08 · 0:38–0:42 · "{ introducing }"**
- **Visual:** blur dissolve to `dawn` haze, paper showing through. `{ introducing }` with corner dots, braces parting.
  The bracket collapses into the **Replay mark** and the words **Replay QA**. Under it, kinetic with the colour sweep:
  `fully managed · end-to-end testing`.
- **Narration (L08):** "Fully managed, end-to-end testing."
- **On-screen type:** `{ introducing }` → Replay mark + `Replay QA` → `fully managed · end-to-end testing`
- **Music:** one bar of stop-time (pad only); the kick returns at 0:40 with the mark.
- **Claims:** SET-16, CONT-19.

**S09 · 0:42–0:46 · "point it at your app"**
- **Visual:** the reference's **typed prompt**, blown up full-frame on paper: `staging.your-app.dev` types in with a
  caret at the take's own rhythm. Cut at 0:44 to take `new-project`, cropped to the card ("Set up QA for your app", the
  sub-copy and the input) with the URL completing (typing 1100 → typed 2966), and the drawn cursor drifting to
  **Start setup** (hover-start 4737). It hovers; it never clicks.
- **Narration (L09):** "Point it at your app."
- **On-screen type:** `staging.your-app.dev|`
- **Take / marks:** `new-project`: typing 1100 → typed 2966 → hover-start 4737.
- **Music:** typing clacks on the hi-hat grid.
- **Claims:** SET-01, SET-02, SET-04 (the URL is a typed placeholder, not a tested app).

**S10 · 0:46–0:54 · "the loop resolves"**
- **Visual:** left third: kit `steps`, the reference's "Building Image" list in Replay QA terms, title `The loop`:
  `Explore` (grey detail: `an agent in a real browser`) ✓ · `Journeys` (`your user flows`) ✓ · `Runs`
  (`in Replay Browser`) ✓ · `Bugs` (`with root cause`) with the shimmering **Working**. Right two thirds: take `explore`
  as a floating screen, cropped to the Exploration card. Tape from play 2821 to about 8000: we zoom on the `1 / 9`
  counter, the running timer and the agent's own subtitle when it arrives (6868 ms, "Starting the exploration of the
  Electric Forest app…"). We never imply the empty picture area shows the agent at work.
- **Narration (L10):** "It explores, maps your user journeys, and runs them in a real browser."
- **On-screen type:** the step list (four items, using the docs' loop; never mixed with the home page's three steps).
- **Take / marks:** `explore`: play 2821 → about 8000 (subtitle from 6868).
- **Music:** ✓ marks land on beats 0:48, 0:50, 0:52.
- **Claims:** LOOP-01, LOOP-03, LOOP-05, LOOP-07, LOOP-10, LOOP-11.

**S11 · 0:54–1:02 · "on a schedule, against staging, on every PR"**
- **Visual:** a kinetic triplet, one phrase per downbeat, each with its own cropped product proof sliding in beneath it:
  1. 0:54 `On a schedule.` take `schedule` at the schedule mark 8808: zoom ≥ 1.8 on the green chip
     **Tue at 3:00 AM · America/New_York** beside the **Production** badge.
  2. 0:56 `Against staging.` same take at add-env 11458: crop the line "Add environment · Add production, staging,
     development, preview, or local configuration." with a red-pink underline under **staging**.
  3. 0:58 `On every PR.` take `runs` at list 3668: crop the Environment and Status columns of "Reminders · CI" Test Runs,
     with the blue **PR #3** and **PR #1** badges and the green Completed pills; the underline lands on `PR #3`.
     A small line arrives: `results posted back to the pull request`.
- **Narration (L11):** "On a schedule. Against staging. On every pull request, with the results posted back."
- **On-screen type:** `On a schedule.` `Against staging.` `On every PR.` (never "Every night" over the Tuesday chip)
- **Take / marks:** `schedule` (schedule 8808, add-env 11458); `runs` (list 3668; held, no scroll: it moves only
  27.5 px).
- **Music:** three filtered stabs on 0:54, 0:56, 0:58.
- **Claims:** CONT-01, CONT-02, CONT-04, CONT-05, CONT-07, CONT-08, LOOP-12.

**S12 · 1:02–1:06 · "already at work"**
- **Visual:** the Tuesday chip from S11 lifts out of the screen and floats on paper beside a clock glyph, and behind it
  take `schedule` at start → polish 2226, cropped to the top rows: **Project status · Active · "Running test loops
  automatically."** Six small ticks appear along the frame strip, labelled `Sep 1 · 8 · 15 · 22 · 29 · Oct 6`, each
  stamped `3:00 AM`.
- **Narration (L12):** "Tuesdays, three a.m.: already at work."
- **On-screen type:** `Active · Running test loops automatically.` (product copy, in the footage) · six Tuesday ticks
- **Take / marks:** `schedule`: start → polish 2226 (crop excludes the budget value).
- **Music:** groove continues; a soft clack on each Tuesday tick.
- **Claims:** CONT-02, CONT-03, CONT-19.

**S13 · 1:06–1:12 · "every run a recording, every bug its cause"**
- **Visual:** the frame strip becomes a column of run rows (from take `runs`, held at list 3668). From each row a
  **`▶ recording` chip** pops out and stacks to the right. Cut on 1:08 to take `bug-sync` at rootcause 8154: crop to the
  numbered **Root Cause to Actual Behavior** chain; the underline runs along step 1.
- **Narration (L13):** "Every run is a recording. Every bug arrives with its root cause."
- **On-screen type:** `every run → ▶ recording` · `every bug → root cause`
- **Take / marks:** `runs` (list 3668, held); `bug-sync` (rootcause 8154 → about 8700).
- **Music:** each chip pop is a soft clack on the off-beat.
- **Claims:** LOOP-07, PROOF-01, PROOF-02, PROOF-04, SET-16, TIME-C1 ("every run is a recording, and every recording
  gets reviewed": the safe phrasing).

**S14 · 1:12–1:20 · the agent pair (the subtle beat, about 7 s)**
- **Visual:** the hero stays the product: take `bug-sync` held at actual 5402, cropped to the Actual / Expected cards
  with the **Fixed** chip pinned at the top (crop excludes the judge links). In the **lower right corner, scale about
  0.6**, kit `agentPair` with neutral unbranded cards labelled `developer` and `critic`:
  - 1:13 the developer hands over a `▶ replay recording` chip → 1:15 the critic answers **✕ not yet** (coral);
  - 1:16.5 the developer works and hands a fresh chip → 1:18.5 the critic answers **✓ good** (green).
  No logos, no product names, no Claude/Cursor/Codex styling. The pair fades by 1:20.
- **Narration (L14):** "Your agent writes the fix. Replay QA reruns the journey to confirm."
- **On-screen type:** only the agent pair's own chips and verdicts.
- **Take / marks:** `bug-sync`: actual 5402 (held).
- **Music:** arrangement thins to a two-note call and response; "not yet" falls, "good" resolves up.
- **Claims:** PROOF-03, PROOF-07, AGENT-02, AGENT-11 (vendor-reported ground for "not yet"), AGENT-15 (a depiction, not
  a named feature; the judge links are never narrated or framed as the critic).

**S15 · 1:20–1:25 · collage of proof**
- **Visual:** the reference's collage: six floating screens fan out with kinetic words woven through them. Tiles:
  `insights` at stats 2926 cropped to **the six tiles only** (50 Projects · 711 Total Bugs · 389 open · 29 % Resolution
  Rate · 1151 Journeys · 89 Explorations; the discovery-source card stays out of frame); `bug-react` title;
  `schedule` Tuesday chip; `runs` PR badges; `projects` at filtered 6306 (the sidebar list of "ExampleApps PR #…"
  projects, sidebar footer cropped); `new-project` card. Words woven between them: `every run` · `every PR` ·
  `{ on the record }`. The 711 tile scales up last with an underline.
- **Narration (L15):** "Seven hundred eleven bugs on Insights. Each one backed by a recording."
- **On-screen type:** `Insights · 711 bugs` · `every run` · `every PR` · `{ on the record }`
- **Take / marks:** `insights` (stats 2926), `bug-react` (3150), `schedule` (8808), `runs` (3668), `projects`
  (filtered 6306), `new-project` (typed 2966).
- **Music:** full arrangement at its peak.
- **Claims:** PROOF-08, PROOF-13, LOOP-13 (label every figure "Insights"; never "in the account"), PROOF-01, CONT-16
  (the PR projects are "projects pointed at PR previews"; no claim about how they were made).

### ch4 · End card (1:25–1:30)

**S16 · 1:25–1:30 · end card**
- **Visual:** blur dissolve to the `ember` haze (grey paper over a coral, orange and pink fire rising from the bottom).
  The frame strip is now a single hairline rule ticking slowly. Bracketed tagline with corner dots:
  `{ for the bugs that only exist in time }`. Under it, the Replay mark + **Replay QA**, then the primary message in one
  line: `Managed end-to-end testing · on a schedule · on every PR · every run a recording`. Last: `qa.replay.io`. A
  single `▶ recording` chip rests beside the mark.
- **Narration (L16):** "Replay QA. For the bugs that only exist in time."
- **Music:** resolve to the tonic on 1:25, the groove drops away, a pad tail and one soft clack. Out at 1:30.
- **Claims:** SET-16, CONT-05, CONT-07, LOOP-07.

## Narration, whole (≈ 155 words)

| line | shot | text | words |
|---|---|---|---|
| L01 | S01 | A screenshot says this page is fine. | 7 |
| L02 | S02 | But for sixty-seven milliseconds, it stalled. Four frames, dropped. | 9 |
| L03 | S03 | No click. Just a background refresh. | 6 |
| L04 | S04 | Some bugs only exist in time. So rewind. | 8 |
| L05 | S05 | There's the cause: twenty-five of twenty-seven renders changed nothing on screen. | 12 |
| L06 | S06 | Or a sync loop: two hundred fifty-eight fetches, its checkpoint stuck at minus one. | 14 |
| L07 | S07 | Replay QA caught both. One of them in Replay QA itself. | 11 |
| L08 | S08 | Fully managed, end-to-end testing. | 4 |
| L09 | S09 | Point it at your app. | 5 |
| L10 | S10 | It explores, maps your user journeys, and runs them in a real browser. | 13 |
| L11 | S11 | On a schedule. Against staging. On every pull request, with the results posted back. | 14 |
| L12 | S12 | Tuesdays, three a.m.: already at work. | 6 |
| L13 | S13 | Every run is a recording. Every bug arrives with its root cause. | 12 |
| L14 | S14 | Your agent writes the fix. Replay QA reruns the journey to confirm. | 12 |
| L15 | S15 | Seven hundred eleven bugs on Insights. Each one backed by a recording. | 12 |
| L16 | S16 | Replay QA. For the bugs that only exist in time. | 10 |

No quotation marks in the narration. Product copy in quotation marks (Q14, Q15, Q16) appears only where the take
itself shows it, verbatim.

## Unforgettable images

1. **Four hollow frames.** A red-pink 67 ms bar lies across a ticking strip of 16.7 ms cells, four of them go hollow
   coral, and the soundtrack's clacks stop for exactly four beats. The bug is shown as missing time.
2. **The counter that runs and the bookmark that doesn't.** Request ticks race to 258 while a tiny `checkpoint −1` chip
   sits perfectly still beside them.
3. **The bug that caught its own maker.** The bug report pulls back into a tile captioned "Replay QA's own Projects page",
   the tiles fan out, and `{ introducing }` closes around the Replay mark.

## Guardrails this treatment follows (checklist for the outline and chapter writers)

- Numbers copied exactly: 67 ms, 4 dropped frames, 16.7 ms, 25 of 27, about 34 ms, 258, −1, Tue at 3:00 AM,
  711 on Insights. The 258 re-fetches and the 258 journey-testing count never share a frame (TIME-14).
- The React bug is **open**: no "fixed" stamp on it anywhere. The bug-sync bug's "Fixed" chip is real.
- No "long task"; compare only to the 16.7 ms frame budget (TIME-18).
- No "every night" over the Tuesday chip (CONT-03). No "Replay QA fixes your bugs" (PROOF-03). After a fix, only
  "reruns the journey to confirm" (PROOF-C1).
- The explore player picture is empty: zoom on the counter, timer and subtitle (LOOP-10). The bug players are covered
  by our overlay; no "Loading replay…", no spinner, no 6:23 scrubber (TIME-09).
- Agent pair: generic, unbranded, a corner, about 7 s, unnarrated as such; judge links are cropped out (AGENT-15).
- Crops remove the chat column, the credit meter, the budget value and the owner's display name. No e-mails, tokens or
  login variables.
- Never the publisher name; brand names appear only as plain text where the product shows them.
