# Treatment: "Always On" (angle: the clock)

**Film:** replay-qa-promo · look **promo** · target 1.5 min (≈ 91 s, ceiling 100 s) · narration ≈ 168 words (under the
177 target on purpose: four whole beats belong to music and type).

## Title
**Always On**: Replay QA, around the clock.

## Logline
While your team sleeps, at 3:00 AM, Replay QA is testing production. On every pull request it tests the preview, and
on staging it tests before release. Every run is a recording, and every bug comes with its root cause. The clock moves
to 2:16 AM, when nobody was touching the page and a loop asked the server the same question 258 times. Then it moves
to 5:56 PM, when a pull request dropped four frames on Replay QA's own Projects page.

## The angle in one breath
A clock is the film's spine. The **primary message** (fully managed, explores, builds journeys, runs on a schedule, against
staging, on every PR, every run a recording, every bug with its cause) is told as *times of day the product is at
work*. The **hook** is two of those times, read off real bug pages: things that only exist in time. The **subtle
beat** is the handoff that follows: a quiet corner where an agent passes a recording to a critic until it hears "good".

---

## Chapters (1.5 min)

| # | Chapter | Time | Min | Carries |
|---|---|---|---|---|
| ch01 | Three in the morning | 0:00–0:12 | 0.20 | the clock; introducing Replay QA; "fully managed, always on" |
| ch02 | One URL | 0:12–0:26 | 0.23 | point it at your app; it explores, finds journeys, runs them |
| ch03 | Around the clock | 0:26–0:46 | 0.33 | schedule (production), staging, every PR; every run a recording |
| ch04 | Bugs that live in time | 0:46–1:12 | 0.43 | **hook**: 2:16 AM / 258 re-fetches, 5:56 PM / 67 ms commit |
| ch05 | The morning handoff | 1:12–1:24 | 0.20 | root cause → your agent → it reruns to confirm (agent pair, 7 s); proof collage |
| ch06 | Always on | 1:24–1:31 | 0.12 | end card |
| | **total** | | **1.51** | primary ≈ 65 s · hook ≈ 26 s · agent pair 7 s (inside ch05) |

---

## Recurring devices

1. **The clock (spine).** Thin Inter numerals (Promo Sans light, tight tracking) on paper or haze, with a breathing
   colon (opacity from `t`, pure). There's a one-line grey label beneath it in small caps. Between readings the digits
   **roll like an odometer** (ease-out, about 0.6 s), with a soft mechanical *clack* in the mix on each settle, never a
   chime. **Rule: every time the clock shows is a real timestamp from the account**, with its label:
   - `3:00 AM` · "Tue · Production · America/New_York" (the schedule chip) [CONT-02] [CONT-03]
   - `2:16 AM` · "Discovered · Sep 4" (bug-sync; the page reads "Discovered 1 month ago at 2:16 AM") [TIME-11] [TIME-16]
   - `5:56 PM` · "Discovered · Sep 23 · PR preview" (bug-react; the page reads "Discovered 21 days ago at 5:56 PM") [TIME-08] [TIME-19]
   For the morning handoff the clock shows **no reading**. The digits blur out and the dial is left to the agents, so
   we never invent a time. Build it as a shot-set painter (`sets/clock.ts`). Nothing needs changing in the kit.
2. **Bracketed type** with square registration dots: `{ introducing }`, `{ every run · a recording }`, `{ always on }`.
3. **Floating screens** (`RrwebScreen`, `chrome:'browser'`, url `qa.replay.io`, tilt settling from about {x:6,y:-14} to
   {x:2,y:-4}), always **cropped** to the line that matters, never a full desktop for more than a beat.
4. **The colour-sweep kinetic line** (white → peach → orange over the tail word), used once at the turn of ch03.
5. **Haze as time of day.** `dawn` = the night/early-morning register (ch01–ch03); `brand` (plum, Replay red-pink,
   violet) only for the time-travel beat (ch04); `ember` for the end card. A blur dissolve whenever the register changes.
6. **The rewind ribbon.** It appears only in ch04: a scrubber in the empty Replay player panel that runs *backwards*,
   with tick marks for requests, and frames stepping back.

## Crop and safety rules (every product shot)
- Never show the left chat column (masked login line, "out of credits"/"paused" threads), the credit meter, the sidebar
  footer (owner's display name), the header URL on the `schedule` take (owner-named workers.dev URL), or the
  `bug-react` player while it reads "Loading replay…".
- Crops below are in recording px (1440 × 900). They're **approximate**, read from the cleaned-take frames. The shot author
  confirms each one with `rr-sheet --at`.
- Narration never says "watch the agent explore" over `explore` (the player picture is empty) [LOOP-10]. The `runs`
  scroll is 27.5 px, so we hold on the table and never claim a scroll reveals anything [LOOP-12].

---

## The film, shot by shot

Each line ID shows the subtitle **text**, and *spoken* where it differs. ♪ marks a music hit.

### ch01: Three in the morning (0:00–0:12)

**ch01-s01 · 0:00–0:06 · plate · haze `dawn`, hairlines**
- *Visual:* light-grey paper warmed by a lilac → peach haze rising from below. Hairlines across the frame. The clock
  fades up centre, large (≈ 150 px stage): `3:00 AM`, label "Tue · Production · America/New_York". The colon breathes.
  At 0:04 two **real crops of the schedule chip** float up under the numerals like a name tag: the green
  **Production** badge and the green chip **"Tue at 3:00 AM · America/New_York"**.
- *Take:* `schedule` @ mark `schedule` 8808 (frozen). It's shown as two separate crops (badge ≈ {x:315,y:166,w:95,h:26}; chip
  ≈ {x:1050,y:166,w:245,h:26}), because the project URL sits directly below the badge and must not enter either crop.
- *Narration:* **L0101** "It's three in the morning." · **L0102** "Everyone's asleep. Your app is still being tested."
- *On-screen:* `3:00 AM`, the label, the chip (the take's own text, Q15).
- *Music:* ♪ cue A "night" opens on a warm pad with a soft clock-like pulse (a muted clack on the off-beats). The first
  downbeat lands on the clock's fade-in.
- *Claims:* CONT-02, CONT-03, CONT-19.

**ch01-s02 · 0:06–0:12 · card · paper (transition `blur`)**
- *Visual:* `{ introducing }` with corner dots, braces parting as the word arrives. On the downbeat the braces open
  to the **Replay mark** and **Replay QA** (`replayMark`). A light kinetic subline builds word by word: "End-to-end
  testing. Fully managed. Always on." with the colour sweep on *on*.
- *Narration:* **L0103** "Introducing Replay QA." · **L0104** "End-to-end testing, fully managed, always on."
- *Music:* ♪ the kick enters exactly on "Replay QA". The four-on-the-floor starts here.
- *Claims:* CONT-19, CONT-22, SET-15.

### ch02: One URL (0:12–0:26)

**ch02-s01 · 0:12–0:18 · scene**
- *Visual:* the **typed prompt** blown up full-frame on paper with a caret: `https://staging.your-app.dev`, typed at the
  take's real pace (≈ 14 cps). A small grey tag in the corner reads "example URL". **Whip** to a floating screen of the
  New Project card. The take plays its own typing at real speed, then holds while the cursor rests on **Start setup**,
  which is never clicked.
- *Take:* `new-project`: tape typing 1100 → typed 2966 (real speed), drift to hover-start 4737 and hold. Crop the main card
  ≈ {x:520,y:95,w:660,h:380} ("NEW PROJECT · Set up QA for your app · Enter your app's URL and I'll walk you through
  the rest in a quick chat." + input + Start setup). Sidebar out.
- *Narration:* **L0201** "Give it one URL."
- *On-screen:* the take's copy (Q01, Q02, Q03), verbatim and unretouched.
- *Music:* ♪ the typed characters ride the hi-hats, and the whip lands on a bar line.
- *Claims:* SET-01, SET-02, SET-04, SET-08.

**ch02-s02 · 0:18–0:26 · scene**
- *Visual:* split frame. On the left is the **resolving step list** (kit `steps`), titled "Testing your app", using the
  vendor's **three-step** set only (one set per graphic, [LOOP-02]):
  1. **Explore**, grey detail "an AI agent drives your app in a real browser"
  2. **Test & Record**, "every journey run, a Replay recording"
  3. **Investigate & Report**, "root cause for every bug"
  ✓ marks land on the narration words *explores*, *journeys*, *runs*. A shimmering "Working" sits under the list.
  On the right is a floating screen of the Electric Forest **Exploration** card. The play click goes in, the timer runs
  0:00 → 0:13, and at 6868 ms the agent's subtitle appears. We zoom (×1.9) on the subtitle: "Starting the exploration of
  the Electric Forest app. I'll begin with…".
- *Take:* `explore`: tape 2200 → play 2821 → 11064 (×1.1). Crop the card ≈ {x:500,y:250,w:940,h:630}. Zoom on the
  subtitle ≈ {x:965,y:752}. The left chat column is out.
- *Narration:* **L0202** "It explores your app, finds the journeys that matter, and runs them in a real browser." ·
  **L0203** "No test suite needed to start."
- *On-screen:* small grey caption under the list: "No test suite required. Complements the one you have." [SET-08]
- *Music:* ♪ a rising arpeggio, one note per ✓.
- *Claims:* LOOP-02, LOOP-03, LOOP-05, LOOP-07, LOOP-10, SET-08.

### ch03: Around the clock (0:26–0:46)

**ch03-s01 · 0:26–0:34 · scene · clock small, top-left**
- *Visual:* the clock shrinks to the top-left corner (`3:00 AM` · Tue). The Settings page floats in, cropped to the
  **Project status** row: "Active · Running test loops automatically." Under the clock, six dates **cascade in like
  ticks**, one per beat: `Sep 1 · Sep 8 · Sep 15 · Sep 22 · Sep 29 · Oct 6`, each one "3:00 AM" (the six real Tuesday
  batches). Then the tape moves to the environments and we crop to **"Add environment · Add production, staging,
  development, preview, or local configuration."** The word *staging* takes the red-pink accent as the narrator says it.
- *Take:* `schedule`: polish 2226 (status row ≈ {x:310,y:250,w:1120,h:48}; the header URL and sidebar are out) → ×1.5
  to add-env 11458 (crop ≈ {x:310,y:268,w:600,h:46}).
- *Narration:* **L0301** "Then it keeps going." · **L0302** "Every Tuesday at three, against production." *(spoken:
  "Every Tuesday at three A M, against production.")* · **L0303** "On staging, before release."
- *On-screen:* Q14 "Running test loops automatically." and Q16, both as shown on screen. The six dates appear as type,
  and nothing on screen says "every night".
- *Music:* ♪ six muted clacks under the six dates, on the beat.
- *Claims:* CONT-01, CONT-02, CONT-03, CONT-04, CONT-19, TIME-C2.

**ch03-s02 · 0:34–0:41 · scene**
- *Visual:* the **Test Runs** table of "Reminders · CI" floats in, cropped to Created / Description / Environment /
  Status / Bugs. The blue **PR #3** and **PR #1** badges pulse once each, and the green *Completed* pills settle. We hold on
  the table, with no scroll. A small date chip in the corner, `Aug 16 · 12 runs`, takes over from the clock for this shot.
- *Take:* `runs` @ list 3668, held to 5900. Crop ≈ {x:500,y:110,w:940,h:470}. Chat column out.
- *Narration:* **L0304** "And on every pull request, against its preview." · **L0305** "Results post right back to the
  pull request."
- *On-screen:* a pill (kit `pill`) slides in beside the table: "Replay QA check · on the PR". It's a depiction of the
  documented check and comment, not footage.
- *Music:* ♪ the snare comes in on "pull request".
- *Claims:* CONT-07, CONT-08, LOOP-12, CONT-15.

**ch03-s03 · 0:41–0:46 · card · haze `dawn` returns (transition `blur`)**
- *Visual:* the one **colour-sweep kinetic line**, word by word: "Every deploy. Every PR. Every Tuesday, 3 AM." The
  sweep runs over *3 AM*. There's no narration for the first 2 s. Then the line lifts and `{ every run · a recording }`
  arrives in brackets with dots.
- *Narration:* (2 s of music only) **L0306** "Every run is a recording. Every recording gets reviewed."
- *Music:* ♪ the full groove is exposed on one bar of music alone. It's the brightest moment before the drop.
- *Claims:* CONT-06, CONT-07, CONT-03, LOOP-07, TIME-C1, TIME-06.

### ch04: Bugs that live in time (0:46–1:12): the hook

**ch04-s01 · 0:46–0:56 · scene · haze `brand` (transition `blur`)**
- *Visual:* the room goes plum. The clock comes back large and **rolls backwards** from `3:00 AM` to **`2:16 AM`**, with
  the label "Discovered · Sep 4". It settles with a clack. A floating screen rises under it showing the bug page cropped to
  chips + title: **Fixed · Medium · Network Performance · Local** / "Live-sync loop re-fetches
  /api/repos/maple/reading-room/pulls 258 times with checkpoint never advancing past -1". Then it's cropped to the
  **Actual Behavior** card, where "…while the user does nothing" gets a soft highlight.
- *Overlay (canvas, in the empty Replay player panel from the take, 0:00 / 2:56):* a thin request ribbon. Ticks
  accumulate from 0:15 to 2:56, each stamped `checkpoint=-1`, while a counter climbs to **258** (kit `counter`). The
  number lands exactly on the spoken word.
- *Take:* `bug-sync`: report 1603 (title + chips ≈ {x:530,y:70,w:880,h:125}; player panel ≈ {x:540,y:225,w:860,h:590}
  as the overlay host) → ×1.4 to actual 5402 (Actual Behavior ≈ {x:540,y:130,w:860,h:180}).
- *Narration:* **L0401** "Two-sixteen in the morning." · **L0402** "The page looks fine. The user does nothing." ·
  **L0403** "Yet it asks the server the same question 258 times." *(spoken: "…two hundred fifty-eight times.")* ·
  **L0404** "Its bookmark never moves."
- *On-screen:* `258` · `checkpoint = -1` (exact symbols on screen, plain words in the ear).
- *Music:* ♪ the drop. The kick falls away, leaving a single held synth note and a ticking hi-hat, one tick per request
  tick, slowly accelerating. Then a hard stop on "258".
- *Claims:* TIME-11, TIME-16, TIME-17 (inference not narrated), TIME-C2.
- *Never:* say that the scheduled 3:00 AM run found this bug (it was found in the Local environment, Sep 4, a Friday).
  Never place it beside the account's other 258 (journey-testing bugs) [TIME-14].

**ch04-s02 · 0:56–1:01 · scene · `brand`**
- *Visual:* **the rewind.** The scrubber in the player runs **backwards**, ticks folding back into a single
  `checkpoint=-1` that never moves. Then the screen steps back through its own frames. The tape runs to the bug's
  **Root cause to actual behavior**, three numbered steps. Zoom on step 2, "…still carries checkpoint=-1 … so the cursor
  never advances."
- *Take:* `bug-sync`: rootcause 8154 → 8804 (crop ≈ {x:540,y:545,w:860,h:240}, zoom ×1.8 on step 2).
- *Narration:* **L0405** "Every bug arrives with its root cause."
- *On-screen:* a small `◀◀` rewind glyph (kit `icon rewind`).
- *Music:* ♪ a reversed pad swell under the rewind. On "root cause" the beat returns, half-time.
- *Claims:* PROOF-01, PROOF-02, SET-16, TIME-05.

**ch04-s03 · 1:01–1:12 · scene · `brand` → paper (transition `whip`)**
- *Visual:* **whip.** The clock rolls forward to **`5:56 PM`** with the label "Discovered · Sep 23 · PR preview". The bug page
  floats in, cropped to chips + title: **Open · Medium · React Rendering** / "67ms React commit at T=383.2s drops 4
  frames on the Projects page…". This crop excludes the player. Then a **frame-budget diagram** (canvas, to scale) appears:
  four empty cells labelled `16.7 ms` each, and one **67 ms** bar sweeping across all four. Each cell flips to a coral ✕ as
  the bar crosses it. Under it, small type builds: "25 of 27 renders · no change on screen". The last image is a quiet
  grey caption, "on Replay QA's own Projects page", over a brief crop of the Actual Behavior card ("rendered 27 fibers
  of which 25 were wasted (no DOM mutations)").
- *Take:* `bug-react`: seek 3040 → 3200 (chips + title ≈ {x:530,y:70,w:880,h:155}; the dark player is never in frame) →
  cut to actual 8723 (Actual Behavior ≈ {x:540,y:170,w:430,h:240}).
- *Narration:* **L0406** "Five fifty-six, on a pull-request preview:" *(spoken: "Five fifty-six P M, on a pull-request
  preview:")* · **L0407** "a 67 millisecond React commit. Four dropped frames." *(spoken: "a sixty-seven
  millisecond React commit. Four dropped frames.")* · **L0408** "On Replay QA's own Projects page."
- *On-screen:* `67 ms` · `16.7 ms` frame budget · `4 dropped frames` · `25 of 27`. The page never shows a "fixed" stamp,
  because this bug is open. There's no "long task" wording and no scrubber on this bug's player.
- *Music:* ♪ four staccato hits, one per ✕. Then a breath of silence before "own" and a small wry lift on it.
- *Claims:* TIME-08, TIME-09, TIME-15, TIME-17, TIME-18, TIME-19.

### ch05: The morning handoff (1:12–1:24)

**ch05-s01 · 1:12–1:19 · scene · paper, faint `dawn` (transition `blur`)** (the subtle beat)
- *Visual:* light returns. The clock's digits **blur out** (no reading) and its dial is left as a faint ring top-left.
  Centre-left: the 258 bug page, cropped to chips + title (status **Fixed**). Under it, kinetic type in three soft steps:
  "root cause → your coding agent → rerun to confirm". **Bottom-right corner, scale ≈ 0.6** is the `agentPair`: a
  *developer* card hands a `▶ replay recording` chip to a *critic* card (1:13.0). The critic answers **"✕ not yet"** in
  coral (1:14.6). The developer works (a small shimmer), then hands over a fresh chip (1:16.2), and the critic answers
  **"✓ good"** in green (1:17.6). The whole exchange takes 7 s, is never named, and is never the headline.
- *Take:* `bug-sync` @ report 1603, frozen (title + chips crop, as in ch04-s01).
- *Narration:* **L0501** "Hand the report to your coding agent." · **L0502** "Mark the fix, and Replay QA reruns the
  journey to confirm."
- *Music:* ♪ cue D "morning", a warm major lift. A soft two-note figure answers the critic: low on "not yet", resolving
  on "good".
- *Claims:* PROOF-03, PROOF-07, PROOF-12, AGENT-02, AGENT-11 (ground only), AGENT-15.
- *Never:* the judge links are not narrated or highlighted, there's no "auto-fix", and no agent logos or brands appear.

**ch05-s02 · 1:19–1:24 · montage · paper (collage of proof)**
- *Visual:* the reference's photo collage becomes **five screens fanning out** with slight tilts: Insights stats tiles,
  the Runs table, the PR-preview projects list (sidebar filter "PR #"), the bug-react title, and the schedule chip.
  Kinetic words are woven through: "explores · tests · records · explains". One tile pushes forward and holds: the
  six Insights stats **50 Projects · 711 Total Bugs · 389 open · 29% Resolution Rate · 1151 Journeys · 89
  Explorations**, with a grey caption "on Insights".
- *Takes:* `insights` @ stats 2926 (tiles ≈ {x:330,y:170,w:830,h:80}); `runs` @ list 3668; `projects` @ filtered 6306
  (sidebar list ≈ {x:0,y:380,w:230,h:420}, caption "projects pointed at PR previews", footer out); `bug-react` @ 3200;
  `schedule` @ 8808 chip crop.
- *Narration:* none (music and type).
- *Music:* ♪ the full groove returns, and each tile lands on a beat.
- *Claims:* PROOF-08, LOOP-13, CONT-16, LOOP-12.

### ch06: Always on (1:24–1:31)

**ch06-s01 · 1:24–1:31 · card · haze `ember`**
- *Visual:* grey paper over a coral/orange/pink fire rising from the bottom. The clock comes back one last time, without
  numbers: its colon blinks twice and becomes the opening of the bracketed tagline **`{ always on }`**, with the four
  corner dots. Under it are the Replay mark, **Replay QA**, a small line "Fully managed end-to-end testing", and
  **qa.replay.io**.
- *Narration:* **L0601** "Replay QA. Always on."
- *Music:* ♪ the last downbeat lands on the tagline. A pad tail plays with one final soft clack, and then silence.
- *Claims:* CONT-22, CONT-19, SET-15.

---

## Narration, as read (≈ 168 words)

> It's three in the morning. Everyone's asleep. Your app is still being tested.
> Introducing Replay QA. End-to-end testing, fully managed, always on.
> Give it one URL. It explores your app, finds the journeys that matter, and runs them in a real browser. No test suite
> needed to start.
> Then it keeps going. Every Tuesday at three A M, against production. On staging, before release. And on every pull
> request, against its preview. Results post right back to the pull request.
> *(music)* Every run is a recording. Every recording gets reviewed.
> Two-sixteen in the morning. The page looks fine. The user does nothing. Yet it asks the server the same question two
> hundred fifty-eight times. Its bookmark never moves.
> Every bug arrives with its root cause.
> Five fifty-six P M, on a pull-request preview: a sixty-seven millisecond React commit. Four dropped frames. On Replay
> QA's own Projects page.
> Hand the report to your coding agent. Mark the fix, and Replay QA reruns the journey to confirm.
> *(music and collage)*
> Replay QA. Always on.

No quotation marks appear in the narration, so it contains no quoted spans. Every quoted string on screen is the take's
own copy, shown as footage (Q01–Q03, Q14–Q16), and is never retyped.

## Music map (cue sheet sketch, for film-score)
| Cue | Span | Feel | Hits |
|---|---|---|---|
| A "night" | 0:00–0:12 | warm pads, soft clack pulse, ~116 BPM | clock fade-in; kick enters on "Replay QA" (≈ 0:08) |
| B "loop" | 0:12–0:46 | bright four-on-the-floor, warm chords | whip at 0:13; one arp note per ✓; six clacks for six Tuesdays; snare on "pull request"; the music-only bar at 0:41 |
| C "in time" | 0:46–1:12 | drop to a held note + accelerating hat; reversed pad on the rewind; half-time return; four staccato ✕ hits | stop on "258" (~0:53); rewind 0:56; four hits ~1:07 |
| D "morning" | 1:12–1:31 | major lift, groove returns for the collage, resolves on the tagline | "not yet" / "good" two-note answer; tiles on beats; final downbeat on `{ always on }` |

Machines clack, never chime. No mallet or bell timbres on the clock or the critic.

## Three unforgettable images
1. **The name-tagged clock.** A huge, thin `3:00 AM` breathing on a lilac dawn haze, with the real green chip "Tue at
   3:00 AM · America/New_York" floating up beneath it like a name tag. The schedule is real, so the clock is real.
2. **The bookmark that never moved.** In the empty plum player, 258 identical ticks pile up along a ribbon, each stamped
   `checkpoint=-1`, while the page above them looks perfectly calm. Then the scrubber runs backwards and the ticks fold
   into the single `-1` that never moved.
3. **Four frames, one bar.** Four empty 16.7 ms cells, one 67 ms bar sweeping through them, each cell flipping to a coral
   ✕, and a quiet grey line underneath: "on Replay QA's own Projects page."

## Notes for the outline and shots stages
- The steps list uses the home page's three steps (Explore / Test & Record / Investigate & Report) instead of
  look.md's four labels, so that a graphic never mixes the vendor's three-step and five-step sets [LOOP-02].
- The clock painter (odometer roll, breathing colon, label line) lives in `sets/clock.ts`. The frame-budget diagram and
  the request ribbon are shot-local canvas painters. None of these needs a kit change.
- The take crops above are estimates. Confirm each with `node tools/promo/rr-sheet.mjs --slug replay-qa-promo --take
  <take> --at <ms>` before the shots are locked. In particular, the schedule chip crop must exclude the owner-named URL line
  directly below the Production badge.
