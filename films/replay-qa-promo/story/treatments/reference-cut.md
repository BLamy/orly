# Treatment: THE REFERENCE CUT

**Film:** `replay-qa-promo` · look **promo** · 1.5 min (90 s; ceiling 100 s) · ≈ 171 narration words
**Angle:** follow the reference promo (`reference/contact-sheet.jpg`) beat for beat, in Replay QA terms. The reference
runs: haze and a half-finished thought → a bracketed promise → `{ introducing }` → a prompt typed full-frame → a resolving
step list → the product delivering → a collage of results with kinetic words → a tagline end card. We keep that spine and
its airy register. The time-travel bugs and the agent pair sit inside it; neither one replaces a beat.

## Title

**Replay QA: { fully managed }**
(shelf subtitle: *End-to-end testing that explores, runs and records on its own*)

## Logline

You give Replay QA one URL. It explores your app, builds the journeys, runs them on a schedule, against staging and on
every pull request, and records every run. So when a bug only exists *in time* (a 67 ms commit, a list fetched 258
times), it arrives with a recording and its root cause.

## Chapters (total 1.5 min)

| # | title | time | min | the reference beat it mirrors |
|---|---|---|---|---|
| ch01 | `{ introducing }` | 0:00–0:13 | 0.22 | haze + half-finished thought, bracketed promise, "{ introducing }" |
| ch02 | One URL | 0:13–0:24 | 0.18 | the prompt typed full-frame, then pulled back into the product |
| ch03 | The loop | 0:24–0:39 | 0.25 | the "Building Image" step list resolving, then the first result |
| ch04 | Always on | 0:39–0:55 | 0.27 | the product delivering (this is the primary message, at full volume) |
| ch05 | Bugs that only exist in time | 0:55–1:19 | 0.40 | the dot-matrix "resolve" moment, stretched into the hook; agent pair in a corner |
| ch06 | `{ fully managed }` | 1:19–1:30 | 0.18 | collage of proof with kinetic words, then the tagline end card |

Time split: the primary message (ch01–ch04 and ch06) gets ≈ 66 s. The time-travel hook gets ≈ 24 s. The agent pair
gets 7 s inside the hook, in a corner, with no narration of its own.

## The narrator

The brief's archetype: warm, confident, mid-life, unhurried but modern. Lines are short and land on the cut. They are
said like a friend showing you something they are proud of, not like an announcer. Numbers are spoken naturally
("sixty-seven milliseconds", "two hundred and fifty-eight times"); exact symbols (`67ms`, `T=383.2s`, `−1`, `16.7 ms`)
go on screen. Whole beats are left to music and type: s02, s07, the agent pair and the end-card hold carry no voice.

## Recurring devices

**Narrative**
1. **The half-finished thought, finished three times.** "Imagine end-to-end tests you never had to write…" opens
   the film. The bracket `{ running on their own }` completes it. The end card completes it again:
   `{ End-to-end testing, fully managed }`. The promise, the proof and the payoff are the same sentence.
2. **"Every ___."** Narration and type return to a single grammar: *every run* a recording, *every bug* a root cause,
   *every pull request*, *every deploy*, *every Tuesday, 3 AM*. It is the managed-platform message said as a rhythm.
3. **Time is the hook, not the subject.** The film moves at the pace of the clock (schedule, Tuesdays, 3 AM) until
   ch05, where time becomes the thing you can rewind.

**Visual** (all from `look.md` and the promo kit)
1. **Haze progression:** `dawn` (ch01–ch02) → paper `#e9e8ea` (ch03–ch04) → `brand` plum (ch05 only) → `ember`
   (end card). Each register change is a `blur` transition; there is one `whip` (s03 → s04, the URL reveal).
2. **Braces as the magnifier.** The kit `bracket` braces and `squareDots` do two jobs. They frame type (`{ introducing }`),
   and in every product close-up they snap around the one detail that matters: the `Tue at 3:00 AM` chip, the
   `PR #3` badge, `67ms`, `checkpoint −1`. The viewer learns that braces mean "look here".
3. **The caret.** It is born on the typed URL (s04) and blinks again on the typed `qa.replay.io` on the end card.
4. **The ✓ clack.** Step-list checks land in green with a muted percussive *clack* (no chimes for machines). The
   critic's "✓ good" in ch05 echoes it, quieter.
5. **Floating screens.** Every product shot is a `RrwebScreen` with soft shadow and a 3-D tilt that settles to flat
   as the narration names what it shows, cropped to the region that matters (≥ 900 stage px wide for anything read).
6. **The rewind scrubber.** It appears only in ch05: a hairline playhead that runs *backwards* over a frame ribbon.
   That is the visual signature of time travel.
7. **Hairlines** across every haze frame, as in the reference.

## Music (Strudel; composed to the locked clock)

Bright broken-beat electronica with warm pads, ≈ 120 BPM (a 2 s bar), in a major key with a lydian lift. Cues:

| cue | span | character | hits |
|---|---|---|---|
| M1 `haze` | 0:00–0:13 | pads only, a filtered arpeggio; no kick | swell under the bracket at 5.0; a muted downbeat on "{ introducing }" at 8.5; a sub drop under "Replay QA" at 11.0 |
| M2 `build` | 0:13–0:39 | the kick enters on the caret's first blink (13.0), hats come in at 18.0, a soft clap on 2 and 4 | a clack per ✓ (≈ 27.0, 29.6, 31.6, 34.6); a fill into the explore take at 36.5 |
| M3 `drive` | 0:39–0:55 | full groove, round bass, a pad chord change per shot | downbeats on cuts at 39.0, 44.5, 48.5; a stab on each word of "Every deploy. Every PR. Every Tuesday, 3 AM." (≈ 52.0–54.0) |
| M4 `rewind` | 0:55–1:19 | drops to half time; a reversed pad swell; a tape-stop on the cut into the brand haze | the kick returns as the 67 ms bar lands (≈ 62.5); four dull thumps for the four dropped frames; a 16th-note hat pulse under the 258 counter, then it stops dead when the counter stops; a two-note figure for "not yet" / "good" (no chime: a felt piano + a soft rim) |
| M5 `lift` | 1:19–1:30 | full band, the brightest voicing in the film | a downbeat on each collage word; resolution to the tonic on the end card at 85.0; ring-out to 90.0 |

## The film, shot by shot

Takes live in `public/generated/replay-qa-promo/rr/<take>.json` (1440 × 900). Marks (ms):
`new-project` typing 1100 · typed 2966 · hover-start 4737 · end 5537 ·
`explore` play 2821 · end 11751 · `runs` list 3668 · scrolled 5923 · end 6573 ·
`schedule` polish 2226 · schedule 8808 · add-env 11458 · end 12961 ·
`projects` scrolled 3348 · filtered 6306 · end 6956 · `insights` stats 2926 · severity 6905 · end 7555 ·
`bug-react` open/report 3032 · actual 8723 · rootcause 12008 · end 13692 ·
`bug-sync` report 1603 · actual 5402 · rootcause 8154 · end 8804.
Crop boxes below are in recording px, read off the take contact sheets. They are approximate; the shot author confirms
them with `rr-sheet --at`. **Every product crop excludes:** the left chat column (masked login line, example e-mail,
"Project paused" / budget threads), the sidebar footer (owner's name), the credit meter, and any header showing the
owner-named workers.dev URL.

---

### ch01 · `{ introducing }` (0:00–0:13)

**ch01-s01** · 0.0–5.0 · haze · `dawn` (lilac → peach, rose glow), hairlines drifting, light grain
- *Visual:* the reference's first frame without a figure: just the dawn haze breathing upward. Kinetic type arrives
  word by word, blurring in, centred at 40 % height. A white → peach → orange colour sweep runs over the tail
  ("…or remember to run").
- *Narration* **L0101:** "Imagine end-to-end tests you never had to write, or remember to run."
- *On screen:* `Imagine end-to-end tests you never had to write, or remember to run.` (kinetic, one line, then it holds 1.2 s)
- *Music:* M1 pads; a rising swell into the cut.
- *Claims:* SET-08, LOOP-03, CONT-19 (the vendor's nuance stays intact: we do not say it replaces a suite).

**ch01-s02** · 5.0–8.5 · paper · `blur` in
- *Visual:* grey paper, four square registration dots wide at the corners. `{ in }` style: the braces stand alone, then
  part as the words arrive: `{ running on their own }`. The dots slide inward to the corners of the brace.
- *Narration:* none (music beat).
- *On screen:* `{ running on their own }`
- *Music:* the M1 swell crests on the brace opening (5.0).
- *Claims:* CONT-19 (Q14 "Running test loops automatically." is the source; the bracket is our paraphrase, so it carries no quotation marks).

**ch01-s03** · 8.5–13.0 · paper
- *Visual:* `{ intro▢▢▢ducing }`, as in the reference. Inside the gap in the word, three postage-stamp frames from the
  film's own footage flicker for 0.25 s each: the `runs` table at 3668, the `schedule` chip at 8808 and the `bug-react`
  title at 3100, all frozen. The word closes, the braces close in, and the type dissolves into the **Replay mark** with
  **Replay QA** beside it (`replayMark`, Promo Sans regular). The corner dots hold.
- *Narration* **L0102** (lands at ≈ 9.0, on the word itself): "Introducing Replay QA."
- *On screen:* `{ introducing }` → Replay mark + `Replay QA`
- *Music:* a muted downbeat on "introducing"; a sub drop on "Replay QA" (≈ 11.0).
- *Transition out:* **whip** (the film's one whip).
- *Claims:* SET-15, SET-16.

### ch02 · One URL (0:13–0:24)

**ch02-s04** · 13.0–18.0 · `dawn` haze + the product as backdrop (the reference's "Appara in the clouds")
- *Visual:* the URL types **full-frame** with a caret, ≈ 120 px Promo Sans, over a soft cyan-free dawn haze. Behind it,
  enormous and blurred, the `new-project` take at the same tape time, so the real input field fills the frame as a
  ghost. Kit `typed`: `https://staging.your-app.dev` at the recorded rate (≈ 14.4 characters per second), with the caret
  blinking 0.8 s before the first key.
- *Take:* `new-project`: typing 1100 → typed 2966 at real speed (tape 1100 → 2966 over 13.6–15.5 s), then held.
- *Narration* **L0201** (≈ 13.8): "Point it at your app."
- *On screen:* `https://staging.your-app.dev▌` (a placeholder example; it is never presented as a tested app)
- *Music:* **the kick enters on the caret's first blink (13.0)**.
- *Claims:* SET-01, SET-04, SET-05.

**ch02-s05** · 18.0–24.0 · paper, floating screen
- *Visual:* we pull back, as the reference does from the prompt to the small search bar. The typed line shrinks into
  the real input of a floating, tilted screen that settles to flat. Crop out the sidebar. Zoom slowly toward the
  heading and input; the drawn cursor drifts to **Start setup** and hovers. It never clicks; we cut on the hover.
  Below the screen, the corner callout "Want your coding agent to handle it?" stays in frame, unzoomed (a nod to the agents later).
- *Take:* `new-project`: tape 2966 → 5300 (typed → hover-start 4737, cut before end).
  Crop ≈ `{x: 470, y: 70, w: 760, h: 420}` (heading "Set up QA for your app", sub-copy, input, "Start setup",
  callout). Zoom 1.0 → 1.4 on the input at hover-start.
- *Narration* **L0202** (≈ 18.6): "No test suite needed. Just your URL, and a quick chat."
- *On screen:* the product's own heading and sub-copy (in the recording); braces snap around the input as "URL" is said.
- *Music:* hats enter at 18.0.
- *Claims:* SET-01, SET-02, SET-03, SET-04, SET-08.

### ch03 · The loop (0:24–0:39)

**ch03-s06** · 24.0–36.5 · paper · `blur` in · kit `steps` (the reference's "Building Image")
- *Visual:* top left, the title **Testing your app** resolves from a blur with a lilac → grey gradient. Under a hairline
  spine, four rows arrive one by one, each with a kit icon, a label and grey detail text; a green ✓ lands on each as the
  narration names it. A shimmering `Working` sits at the bottom left until the last ✓, then turns to `Done`. The
  rows are the first steps of the docs' own loop (explore → journeys → runs → recordings → bugs), so we do not mix in the
  home page's three-step set.

  | icon | label | detail (grey) | ✓ lands on |
  |---|---|---|---|
  | map | Exploring | an agent drives your app in a real browser | "explores" |
  | branch | Journeys | named user flows, kept and reused | "journeys" |
  | film | Runs | every journey run, a Replay recording | "records" |
  | bug | Bugs | confirmed, de-duplicated, root cause attached | "root cause" |
- *Narration:*
  **L0301:** "It explores your app in a real browser."
  **L0302:** "Turns what it finds into journeys."
  **L0303:** "Runs them, and records every run."
  **L0304:** "And every bug comes with its root cause, and a suggested fix."
- *Music:* a clack per ✓; the bar after the last ✓ opens up.
- *Claims:* LOOP-01, LOOP-02, LOOP-03, LOOP-05, LOOP-07, PROOF-01, PROOF-02, PROOF-03, PROOF-04, SET-16.
  ("Suggested fix" is a prose suggestion, never a patch: PROOF-03.)

**ch03-s07** · 36.5–39.0 · paper → floating screen (the reference's dot-matrix "resolve")
- *Visual:* the four ✓ rows collapse into a grid of square dots (the `squareDots` motif), and the dots resolve into a
  floating screen: the Electric Forest overview's **Exploration** card. The player timer runs from 0:00, and the agent's
  own subtitle arrives: "Starting the exploration of the Electric Forest app…". The empty picture area is covered by a
  soft paper plate; we never pretend to show what the agent saw.
- *Take:* `explore`: tape 3000 → 7200 (play 2821; subtitle added at 6868; timer 0:00 → 0:04). Crop
  ≈ `{x: 500, y: 240, w: 940, h: 640}` (card header "Exploration 1 / 9", player chrome, timer, subtitle; no chat column).
  Zoom 1.0 → 1.6 on the subtitle in the last second.
- *Narration:* none (music: the fill into ch04).
- *On screen:* the product's subtitle (in the recording).
- *Claims:* LOOP-10, LOOP-11 (this is the exploration player, rrweb plus subtitles, never called a runtime recording).

### ch04 · Always on (0:39–0:55)

**ch04-s08** · 39.0–44.5 · paper, floating screen
- *Visual:* two beats in one shot, with a match cut on the tape.
  - First (≈ 1.5 s): the settings status row, `Active` · "Running test loops automatically.", with braces snapping
    around it.
  - Then the tape jumps to the Environments block: a green `Production` badge and the green chip
    **Tue at 3:00 AM · America/New_York**, magnified 2× inside braces.
  - Beneath the screen, a slim six-tick calendar strip draws itself: **Sep 1 · 8 · 15 · 22 · 29 · Oct 6**, each tick
    labelled `3:00 AM`. These are the real Tuesdays the schedule fired.
- *Take:* `schedule`.
  - Status row: tape held at ≈ 1200 (before polish 2226), crop ≈ `{x: 300, y: 230, w: 1140, h: 70}`.
  - Then tape 8400 → 8808 (schedule) and hold. Crop ≈ `{x: 300, y: 110, w: 1140, h: 120}`.
  - The page header with the project URL is never in frame.
- *Narration* **L0401:** "Then it keeps going. On a schedule you set, with nobody pressing run."
- *On screen:* the product's chip; our strip `Sep 1 · Sep 8 · Sep 15 · Sep 22 · Sep 29 · Oct 6 — 3:00 AM`
- *Music:* M3 downbeat on the cut (39.0).
- *Claims:* CONT-01, CONT-02, CONT-03, CONT-04, CONT-19. (Weekly, so the word "night" never appears near this chip.)

**ch04-s09** · 44.5–48.5 · paper, floating screen + pills
- *Visual:* the **Add environment** row: "Add production, staging, development, preview, or local configuration." The
  five words lift off the row as kit `pill`s: `production`, `staging`, `development`, `preview`, `local`. As each is
  named, `staging`, then `preview`, then `local` light in Replay red-pink.
- *Take:* `schedule`: tape 11000 → 11458 (add-env), then hold. Crop ≈ `{x: 300, y: 150, w: 1140, h: 90}`.
- *Narration* **L0402:** "Against staging, a preview, even localhost."
- *On screen:* the product's row and the five pills.
- *Claims:* CONT-01, CONT-14, SET-05, SET-06 (localhost through the managed reverse proxy, without deploying).

**ch04-s10** · 48.5–55.0 · paper, floating screen, then kinetic line
- *Visual:* the **Test Runs** table of "Reminders · CI". It is cropped to Description / Environment / Status, settles
  flat, and braces snap around the blue `PR #3` and `PR #1` badges beside green `Completed` pills. We hold on the table
  and do not scroll (the scroll moves only 27.5 px). At ≈ 51.8 the screen eases up and back, and the kinetic line
  sweeps in below it on a soft paper plate, word by word, with the colour sweep on the tail:
  **Every deploy. Every PR. Every Tuesday, 3 AM.**
- *Take:* `runs`: tape 2900 → 3668 (the tab change into the list), then hold at 3668. Crop ≈ `{x: 500, y: 90, w: 940, h: 560}`
  (no chat column). Zoom 1.0 → 1.5 on the PR badges.
- *Narration* **L0403:** "And on every pull request, tested against its preview, with the results posted back."
- *On screen:* the table; the kinetic line `Every deploy. Every PR. Every Tuesday, 3 AM.`
- *Music:* a stab on each word of the kinetic line; the bar ends in a tape-stop into ch05.
- *Claims:* CONT-05, CONT-06, CONT-07, CONT-08, CONT-15, LOOP-08, LOOP-12. (PR testing is a capability you turn on;
  the line states what it does, not that it is the default.)

### ch05 · Bugs that only exist in time (0:55–1:19)

**ch05-s11** · 55.0–58.5 · `brand` haze (deep plum, Replay red-pink and violet) · `blur` in
- *Visual:* the one dark register in the film. A horizontal frame ribbon of thin ticks crosses the frame. The rewind
  scrubber, a bright hairline playhead, runs **backwards** across it, and the ticks blur as it passes. Kinetic type:
  **Some bugs only exist in time.** with "in time" swept in red-pink.
- *Narration* **L0501:** "Some bugs only exist in time."
- *Music:* M4 drops to half time; a reversed pad swell.
- *Claims:* TIME-05, TIME-01.

**ch05-s12** · 58.5–70.0 · `brand` haze, floating screen with our time-travel overlay
- *Visual:* the 67 ms bug page floats in on the plum haze.
  1. **Title and chips** (`Open` · `Medium` · `React Rendering`): braces close around `67ms` and then `drops 4 frames`
     in the real title.
  2. In the page's **dark Replay player panel**, our overlay covers the "Loading replay…" text completely. A frame
     ribbon with ticks every 16.7 ms appears. A 67 ms commit bar grows across it, and **four frame slots** knock out in
     coral one by one (four thumps in the score). Label: `67 ms commit · 16.7 ms frame budget · 4 dropped frames`.
  3. The bar breaks into **27 small fiber squares**. Twenty-five go hollow and grey (no DOM mutation); two fill
     red-pink. Label: `25 of 27 renders · no DOM change`.
  4. Match cut down the page to the **Root Cause** block, whose text names the memo-less react-router `Link`s.
     The `Open` chip stays visible; no "fixed" stamp ever touches this bug.
- *Take:* `bug-react`.
  - Tape 3040 → 3200 (chips, title, dark player; never 3032, which is a grey skeleton), then hold.
    Crop ≈ `{x: 500, y: 80, w: 940, h: 760}` (title, chips, player; no chat column; the credit meter is gone after 3032).
    Zoom 1.0 → 2.0 on the title at "sixty-seven".
  - Then tape 11600 → 12008 (rootcause) and hold. Crop ≈ `{x: 500, y: 60, w: 940, h: 260}`.
  - Do not draw any player timestamp (no "6:23").
- *Narration:*
  **L0502:** "Replay QA caught one on its own Projects page."
  **L0503:** "Sixty-seven milliseconds. Four dropped frames."
  **L0504:** "Twenty-five of its renders changed nothing on screen. A screenshot can't see that. A Replay recording can."
- *On screen:* the real title, read in the recording: "67ms React commit at T=383.2s drops 4 frames on the Projects page: …".
  Our labels: `16.7 ms frame budget` · `4 dropped frames` · `25 of 27 renders · no DOM change`.
- *Music:* the kick returns as the bar lands (≈ 62.5); four dull thumps; a hush under L0504.
- *Claims:* TIME-08, TIME-09, TIME-15, TIME-17, TIME-18, TIME-01, LOOP-19. (We compare to the frame budget only and
  never call it a "long task". "25 of 27" is a count of renders, not a share of time.)

**ch05-s13** · 70.0–79.0 · `brand` → plum fading toward paper, floating screen, **agent pair in the corner**
- *Visual:*
  1. The live-sync bug page: chips `Fixed` · `Medium` · `Network Performance` · `Local`, and the title. Braces close on
     **258 times**, then on **past -1**.
  2. Our overlay over the player area: a counter ticks 0 → **258**, each tick a tiny request bar on a ribbon. Pinned
     above it, a small tag reads `checkpoint −1` and **never moves** while the counter climbs. Then the rewind
     scrubber sweeps back across all 258 bars, and the tag is still at −1.
  3. At ≈ 72.0 the **agent pair** (kit `agentPair`, scale ≈ 0.6) eases in at the bottom-right corner, over paper, never
     covering the title.
     - A rounded card labelled `developer` slides a `▶ replay recording` chip across to a card labelled `critic`.
     - ≈ 74.0: the critic answers `✕ not yet` in coral.
     - The developer card pulses (it works again) and hands over a new chip.
     - ≈ 77.0: the critic answers `✓ good` in green.
     - The pair fades by 79.0. It is a depiction of the documented fix-and-rerun loop, not a named feature. The
       "Requirements / Evidence / Acceptance judge" links may sit in frame, unzoomed and unnarrated.
- *Take:* `bug-sync`.
  - Tape 1300 → 1603 (report), then hold. Crop ≈ `{x: 500, y: 80, w: 940, h: 700}` (chips, title, player 0:00 / 2:56).
    Zoom 1.0 → 1.8 on the title.
  - At ≈ 75.5, tape 7800 → 8154 (rootcause), held. Crop ≈ `{x: 500, y: 60, w: 940, h: 240}`. This shows the Root Cause
    text that names the checkpoint stuck at −1.
- *Narration:*
  **L0505:** "Another fetched the same pull-request list two hundred and fifty-eight times."
  **L0506:** "Its bookmark never moved past minus one."
  (The agent pair has no narration. It is the subtle beat.)
- *On screen:* the real title ("Live-sync loop re-fetches /api/repos/maple/reading-room/pulls 258 times with
  checkpoint never advancing past -1"); our `checkpoint −1` tag and `258` counter; the pair's labels and verdicts.
- *Music:* a 16th-note hat pulse under the counter that stops dead with it; a felt-piano two-note figure answers "not
  yet" (unresolved) and "good" (resolved), with a soft rim tick and no chime.
- *Claims:* TIME-11, TIME-13, TIME-16, AGENT-02, AGENT-11, AGENT-15, PROOF-07. (We never say "reading-room app". The
  bug is fixed by the team, and the pair does not claim to be who fixed it.)

### ch06 · `{ fully managed }` (1:19–1:30)

**ch06-s14** · 79.0–85.0 · paper · `blur` in · the collage of proof
- *Visual:* the reference's fanned photo collage, made of product cards. Six cropped screens fan out from the centre,
  tilting and settling at different depths:
  - the Insights stat tiles `50 Projects · 711 Total Bugs · 29% Resolution Rate · 1151 Journeys · 89 Explorations`,
    with a small `Insights` label on the card;
  - the `Tue at 3:00 AM` chip;
  - the runs table with the `PR #3` badge;
  - the sidebar filtered to "PR #", showing the "ExampleApps PR #…" projects;
  - the 67 ms title with its `Open` chip;
  - the 258 title with its `Fixed` chip.

  Kinetic words weave between the cards, as "you … gets better … create" does in the reference: **every run** /
  **a recording** / **every bug** / **a root cause** / **every fix** / **rerun to confirm**.
- *Takes (all frozen, as tiles):*
  - `insights` at 2926 (stats): crop ≈ `{x: 330, y: 160, w: 860, h: 100}` (tiles only; **never the Discovery Source
    card**, so the account's "Journey Testing 258" never sits beside the re-fetch 258);
  - `schedule` at 8808: chip crop;
  - `runs` at 3668: badge crop;
  - `projects` at 6306 (filtered): crop ≈ `{x: 0, y: 370, w: 240, h: 420}` (filtered list only, above the owner footer);
  - `bug-react` at 3150: title crop;
  - `bug-sync` at 1603: title crop.
- *Narration* **L0601:** "Every run, a recording. Every bug, a root cause. Every fix, rerun to confirm."
- *On screen:* the tiles and the woven words; `Insights` label on the stats card. The PR projects card carries no
  caption about how those projects were created.
- *Music:* M5 lifts; a downbeat on each woven word.
- *Claims:* PROOF-08, PROOF-09, LOOP-13, LOOP-07, PROOF-01, PROOF-07, CONT-02, CONT-16, LOOP-12, TIME-08, TIME-11, TIME-14.

**ch06-s15** · 85.0–90.0 · `ember` haze (grey paper over a coral / orange / pink fire rising from the bottom) · **end card**
- *Visual:* the collage blurs and sinks into the ember glow. Centred, a bracketed tagline **grows**, as in the reference
  ("The AI powered platform" → "… for modern creatives"):
  `{ End-to-end testing }` → `{ End-to-end testing, fully managed }`, with square dots at its corners.
  - The Replay mark and **Replay QA** rise beneath it.
  - Then `qa.replay.io` types in small, and the caret from s04 blinks twice and stops.
  - For one beat (≈ 87.0–88.0) a tilted floating card (the runs table) drifts across the lower right with dots pinned
    at its corners, a nod to the reference's tilted photo, and is gone.
  - The tagline holds ≥ 1.5 s after it lands.
- *Narration* **L0602** (≈ 85.4): "Replay QA. End-to-end testing, fully managed."
- *On screen:* `{ End-to-end testing, fully managed }` · Replay mark · `Replay QA` · `qa.replay.io▌`
- *Music:* resolves to the tonic at 85.0; ring-out to 90.0 (the clock may run to ≈ 92 s, well under the 100 s ceiling).
- *Claims:* SET-15, SET-16, CONT-19.

## The end card

Ember haze. `{ End-to-end testing, fully managed }` in Promo Sans light, with corner registration dots. Beneath it are
the Replay mark and **Replay QA**, then `qa.replay.io` with the caret that was born on the typed URL. Nothing else: no
logos of other companies, no credits, no prices.

## Narration, whole (≈ 171 words)

| id | shot | line |
|---|---|---|
| L0101 | s01 | Imagine end-to-end tests you never had to write, or remember to run. |
| L0102 | s03 | Introducing Replay QA. |
| L0201 | s04 | Point it at your app. |
| L0202 | s05 | No test suite needed. Just your URL, and a quick chat. |
| L0301 | s06 | It explores your app in a real browser. |
| L0302 | s06 | Turns what it finds into journeys. |
| L0303 | s06 | Runs them, and records every run. |
| L0304 | s06 | And every bug comes with its root cause, and a suggested fix. |
| L0401 | s08 | Then it keeps going. On a schedule you set, with nobody pressing run. |
| L0402 | s09 | Against staging, a preview, even localhost. |
| L0403 | s10 | And on every pull request, tested against its preview, with the results posted back. |
| L0501 | s11 | Some bugs only exist in time. |
| L0502 | s12 | Replay QA caught one on its own Projects page. |
| L0503 | s12 | Sixty-seven milliseconds. Four dropped frames. |
| L0504 | s12 | Twenty-five of its renders changed nothing on screen. A screenshot can't see that. A Replay recording can. |
| L0505 | s13 | Another fetched the same pull-request list two hundred and fifty-eight times. |
| L0506 | s13 | Its bookmark never moved past minus one. |
| L0601 | s14 | Every run, a recording. Every bug, a root cause. Every fix, rerun to confirm. |
| L0602 | s15 | Replay QA. End-to-end testing, fully managed. |

About 6 words are left in reserve against the 177-word target for the voice pass. No line uses quotation marks, so
nothing here depends on quotes.json. Verbatim product copy appears only where it already exists, inside the recordings.

## Guardrails this treatment honours (from the bible)

- **Numbers:**
  - "about 800 ms" is not used.
  - 258 appears once, as the re-fetch count. The Insights discovery card that also says 258 is cropped out of every
    shot.
  - "50 projects" appears only as an Insights tile, with the label on the card.
  - "4 enabled" polish passes, if ever in frame, is never spoken.
- **No patch:** "root cause, and a suggested fix", never "fixes your bugs". After a fix, "rerun to confirm" only.
- **Open stays open:** the 67 ms bug is shown with its `Open` chip. The 258 bug is shown with its real `Fixed` chip.
- **Schedule:** "Every Tuesday, 3 AM" is used, never "every night".
- **Placeholders:** `staging.your-app.dev` is a typed example, and "Start setup" is hovered, never clicked.
- **Players:**
  - The exploration player is never called a recording of the run, and its empty picture is never presented as content.
  - Our time-travel overlays sit in the empty dark player panels and are labelled as diagrams, never as captured video.
- **The agents:**
  - The agent pair is generic and unbranded, with no narration.
  - It is not "the judges" and not any vendor's agent.
  - Anthropic and Claude are not singled out. The bug-sync page's "Markdown for Claude Code, Cursor, and other coding
    agents" label may sit in frame, unzoomed.
- **No secrets:** no chat column, owner footer, credit meter or workers.dev header is in any crop.

## Three unforgettable images

1. **The URL, typed full-frame.** `https://staging.your-app.dev` arrives at about 14 characters a second, ten
   centimetres tall, its caret blinking over the ghost of the real input field. The kick drum enters on the caret's
   first blink. One address is the whole setup.
2. **Sixty-seven milliseconds, stretched out in the dark.** In the plum haze, a 67 ms bar grows across a ribbon of
   16.7 ms frame slots and knocks out four of them in coral, one thump each. Then it shatters into 27 squares, and 25
   go hollow: work that changed nothing you could ever screenshot.
3. **The bookmark that never moved.** A counter races to 258 while a small tag reading `checkpoint −1` sits perfectly
   still above it. The scrubber rewinds across all 258 requests, and the tag is still there. In the corner, two small
   cards trade a recording, "not yet", then "good", and leave without a word.
