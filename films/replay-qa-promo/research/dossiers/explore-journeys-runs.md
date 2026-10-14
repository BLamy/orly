# Dossier: The managed loop: explore, build journeys, run them in Replay Browser

- Topic id: `explore-journeys-runs`
- Era: product, as of 2026-10-14
- Film: replay-qa-promo (look "promo", about 90 s)
- Researcher pass: 2026-10-14. Local sources read in full. The three docs pages were checked live in the user's Chrome through the Claude in Chrome extension on 2026-10-14, and each matches the saved text word for word. Reading the signed-in qa.replay.io/insights page through the extension was **refused: the extension has no permission to read that domain**. Account figures therefore come from `account-digest.json` and from the cleaned rrweb takes (rebuilt to text at each mark with a scratch rrweb DOM rebuilder), not from a live re-read.
- **Fact-check pass (2026-10-14, adversarial):** the live re-read later **succeeded** through Claude in Chrome. The Insights page text matches the take (50 / 711 / 389 open / 29% / 1151 / 89, and the same 50 Scorecard rows). A count-only read of the signed-in REST API (`GET /api/v1/projects?page_size=100`) returned **total 67 projects**, not 50. See section 7, item 1, and the Fact-check log at the end. Only counts were read. No names, credentials or e-mail addresses were copied.
- Off limits and not used: `capture/api/*` (raw API dumps). No credentials, tokens, login variable names or e-mail addresses are copied here.

---

## 1. Summary

Replay QA calls its core cycle **"The loop"** (docs, concepts page): explore the app to get journeys, run the journeys to get recordings, investigate the recordings to get bugs, fix and mark them fixed so the journeys run again, and explore again when the app grows. With GitHub connected, each new build starts the loop again by itself.

- **Exploration.** An AI agent drives the app in a real browser. It starts at the project's target URL and follows the project's instructions. What it produces is a set of **journeys**. The first exploration also finds "complex interactive features" and gives them their own journeys. Later explorations add journeys and never replace existing ones. An exploration **ends blocked** when it cannot get past something: a login it lacks, an invitation or admin approval, a paywall, or an app that won't load. When that happens it says what it needs in the project chat. The Electric Forest chat in the explore take shows real cases of this (an authentication wall, a seeded-data barrier, an app that never finished loading).
- **Journey.** One user flow with a name and a description. It **starts as a description** that an agent follows. "Once Replay QA has run it and is confident about the flow, it records concrete steps so later runs are faster and more repeatable." Each journey has two settings: a **Start URL** (by default the project's target URL) and a **Session**, which is either the signed-in state saved during exploration or a clean browser. Login, signup, recovery and public pages want a clean browser. Every edit creates a new version of the journey and, if the project is active, schedules a run. The REST API calls a description-only journey an "unstepped (agent-driven)" journey.
- **Test run.** One round of running journeys **in Replay Browser**. **Each journey run produces a Replay recording.** A failed step is investigated in the recording before any bug is filed, and a run can recover from a broken step and keep going. Polish passes then review the same recording. A run can finish with journeys that passed, journeys that found bugs, and journeys that were blocked or incomplete for reasons outside the app.
- **"Every run is a recording"** is literally true at the level of a journey run: a test run is a batch of journey runs, and each journey run is a Replay recording. That recording is a **runtime** recording, not a session/DOM replay. Replay Browser records the inputs to the runtime, so replaying it re-runs exactly the same execution.
- **Account numbers (exactly as shown on the Insights screen):** **50 projects, 1151 journeys, 89 explorations**, plus 711 total bugs and 389 open. The 50 rows of the Insights "Project Scorecard" add up exactly to 711 bugs, 1151 journeys and 389 open, so the tiles are totals over those 50 rows. **[Corrected in fact-check]** The 50 rows are **not every project in the account**. The live REST API reports **67** projects (`total: 67`). The bug counts of the 50 most recently created of those 67 sum to exactly 711, and the 17 older projects (created 2026-05-13 to 2026-06-12) hold 72 more bugs (783 across all 67). So Insights, the sidebar (50 links) and the Projects page (50 cards) appear to show the newest 50 projects. That is an inferred cap, not a documented one. Quote the figures as **"Insights: 50 projects, 1151 journeys, 89 explorations"**, never as "all projects" or "the whole account". The `projects_total: 20` in the digest is **confirmed** as one page: with the default `page_size` of 20, the API returns 20 items and `total: 67`.
- **What the takes show.** In the explore take, the Electric Forest overview has an "Exploration" card ("1 / 9"), a play click at 2821 ms, a timer that moves from 0:00 to 0:13 of 10:28, and an agent narration subtitle. **The player's picture area is empty in the capture.** The inner player is an rrweb `rr-block` element recorded at 0 x 0 px, and the clean CSS hides its placeholder. In the runs take, the Reminders · CI project opens its **Test Runs** tab (13 rows, `list` at 3668 ms) and scrolls the page to its end (`scrolled` at 5923 ms). The requested 600 px wheel scroll moves `main#main-content` only **27.5 px**, because that is all the scroll room the page has. The table has columns Created / Description / Environment / Status / Bugs / Journeys, and some rows carry **PR #1 / PR #3** environment badges.

---

## 2. Timeline (product events visible in the account; dates as displayed in the UI)

All dates come from the user's own account as captured on 2026-10-14. Times shown in chat are local display times.

| Date | Event | Source |
|---|---|---|
| 2026-08-12 | Reminders · CI: "Initial Test Run", Project default, **Failed**, 1 journey (first row of the Test Runs table) | `films/replay-qa-promo/capture/clean/runs.json` @ list 3668 ms |
| 2026-08-16 | Reminders · CI: 12 more runs on one day, including PR-driven runs ("PR #1: PR #1", "PR #3: PR #3", environment badges linking to `github.com/replayio/replayqa-cli-in-ci/pull/1` and `/pull/3`) and "Reminder lists, search, Focus navigation, and modal interactions", Completed, 12 journeys, Bugs 0/0/13/0 | `capture/clean/runs.json` @ 3668 ms |
| 2026-08-30 to 2026-08-31 | Electric Forest: several explorations stop at an authentication wall. The chat shows "⚠️ I stopped exploring because the app requires a sign-in I couldn't complete…" and a run titled "Sign-in flow blocked at Auth0 account chooser step", status **Blocked**, 0 / 0 journeys | `capture/clean/explore.json` @ 0 ms (project chat) |
| 2026-09-01 | Electric Forest: an exploration stops at a seeded-data barrier ("⚠️ I stopped exploring because the app put up a barrier I could not get past.") | `capture/clean/explore.json` @ 0 ms |
| 2026-09-04 | Electric Forest: QA refuses to start because the project hit its bug limit ("The bug cap is set to 100, and this project has 111 bugs filed (65 still open)"). The cap is raised to 150 and one journey, "E7-T07 historical scrubber", is run on its own | `capture/clean/explore.json` @ 0 ms |
| 2026-09-23 | Electric Forest: the sitemap polish pass is enabled from chat | `capture/clean/explore.json` @ 0 ms |
| 2026-09-30 | Electric Forest: "Main page load and broad site navigation sweep", Local, **Completed**, **131 journeys** (newest run in the overview's Test Runs card). **Caveat:** the matching chat run card reads Journeys finished 131 / 131, Passed journeys **1**, Failed journeys **0**, Bugs found **0**, and the table's Bugs cell is 0/0/0/0. So 131 journeys finished but only 1 is counted as passed. | `capture/clean/explore.json` @ 0 ms |
| 2026-10-14 | Takes captured; account digest read (Insights: 50 projects, 1151 journeys, 89 explorations) | `research/sources/account-digest.json`; `capture/clean/insights.json` |
| 2026-10-14 | Docs pages (concepts, overview, time travel) checked live; text identical to the saved copies | https://docs.replay.io/basics/replay-qa/concepts ; https://docs.replay.io/basics/replay-qa/overview ; https://docs.replay.io/reference/time-travel/how-does-time-travel-work |

---

## 3. People

Not applicable (product promo). The only named people on screen are the account owner's display name in the app chrome and tester handles on the vendor home page. Neither should be depicted. The brief's "developer agent / critic agent" beat is fiction staging, not a real person.

---

## 4. The belief of the age

Not applicable in the history sense. The vendor positions the product against a market assumption that is useful for the script. The home page says "Most QA tooling starts with flows your team defines. Replay QA begins by exploring the application and identifying flows worth verifying." (https://www.replay.io/, read 2026-10-14). The docs overview adds: "You do not need an existing test suite or a list of reproduction steps." (https://docs.replay.io/basics/replay-qa/overview). This is the vendor's framing, not a neutral industry claim. Present it as the product's approach, not as a fact about all competitors.

---

## 5. Experiments and results (the product's mechanics and the proof in the account)

### 5.1 The five steps ("How Replay QA works", docs overview)
1. **Explore the app.** An AI agent drives the application in a real browser to discover its screens, actions and important workflows.
2. **Create journeys.** Meaningful flows (signing up, searching, checking out) are saved as journeys that can be tested again.
3. **Run the journeys.** Test runs exercise those journeys in Replay Browser and capture "a deterministic runtime recording of what happened."
4. **Investigate findings.** The recording is used to trace the symptom back to its root cause.
5. **Report actionable bugs.** Each confirmed bug includes observed behavior, evidence and a root cause analysis that points at the responsible code.

Source: https://docs.replay.io/basics/replay-qa/overview (local copy `research/sources/basics_replay-qa_overview.txt`). The home page uses three steps for the same idea: "Explore", "Test & Record", "Investigate & Report" (https://www.replay.io/). Either set of labels can go on screen, but **don't mix the two counts in one graphic**.

### 5.2 Exploration
- Drives the app "in a real browser", starting from the target URL and guided by the project's instructions. Its output is a set of journeys. The first exploration also creates journeys for complex interactive features. Later explorations add coverage and do not replace journeys. (concepts page)
- **Ends "blocked"** when it can't get past a login it lacks, an invitation or admin approval, a paywall, or an app that won't load. The chat says what was needed. (concepts page; the "When Replay QA pauses" table in `basics_replay-qa_getting-good-results.txt` also lists a file or record the flow needs, more budget, an unreachable app, rate limits and CAPTCHAs.)
- Real account proof (Electric Forest chat, explore take): blocked explorations with the reasons stated in the chat. **Fact-check note:** the one message whose headline reads "⚠️ I stopped exploring because the app never finished loading a usable page." (Aug 31, 2:28 PM) goes on to describe an **authentication wall**: the Auth0 emulator rejected the provided login variables. Don't use it as proof of the "app will not load" case. The sign-in message (Aug 30 and Aug 31) and the seeded-data barrier message (Sep 1) are accurate examples of their own cases. Electric Forest exploration statuses in the digest: **blocked 4, cancelled 2, completed 2, failed 1**, which totals **9**. That matches the on-screen counter **"1 / 9"** on the overview's Exploration card (`account-digest.json` projects."Electric Forest".explorations; `explore.json`).
- API: `POST /api/v1/projects/{project_id}/explorations`, "Start a new AI exploration to discover user journeys"; a `prompt` customizes it (`research/sources/openapi.json`).
- The overview's exploration player is a replay of **rrweb DOM events plus narration subtitles** ("thought, note, error, and system events shown as replay subtitles"), served by `GET /api/v1/projects/{project_id}/recording-events` (`openapi.json`). **It is a session-style replay of the agent's browser, not the Replay runtime recording.** Don't narrate it as "the Replay recording."

### 5.3 Journey
- A name and a description. It "starts as a description". Once Replay QA is confident about the flow, "it records concrete steps so later runs are faster and more repeatable". Until then, an agent runs it by following the description. (concepts page)
- API wording: `POST /api/v1/projects/{project_id}/journeys` "Create an unstepped (agent-driven) test journey". An AI agent reads the name, description and instructions, then "drives the app with Playwright to carry out the flow, recording the session and filing any bugs it finds". If the project is active the journey runs immediately. `target_url` sets a different start URL, and `polish` adds polish passes. (`openapi.json`)
- **Settings:** Start URL (defaults to the project's target URL); Session = the signed-in browser state saved during exploration, or a clean browser (clean for login, signup, password recovery and public pages; saved session for most authenticated flows). Each edit creates a new version and schedules a run if the project is active. (concepts page; `basics_replay-qa_getting-good-results.txt`, "Keep coverage current")
- Credentials stay out of journeys: test logins "are stored as project variables and referenced by name, so they do not appear in journey steps or bug reports" (`basics_replay-qa_getting-good-results.txt`).

### 5.4 Test run
- "One round of executing journeys in Replay Browser. Each journey run produces a Replay recording." A failed step is investigated in the recording before a bug is filed. A run can recover from a broken step and continue. Polish passes review the same recording after each journey. (concepts page)
- **End states (docs wording):** journeys that passed, journeys that found bugs, and journeys that were blocked or incomplete for reasons outside the app (rate limiting, a verification code that never arrived, an app that went down). (concepts page)
- **Run statuses seen on screen** (status pills in the takes): **Completed, Failed, Cancelled, Blocked**. In the DOM, the Cancelled pill uses the class `status-indicator--incomplete` with test id `status-indicator-cancelled` (`runs.json`, `explore.json`).
- **Status keys in the digest** (Electric Forest `test_runs`): completed 106, failed 56, infra-failed 49, incomplete 50, cancelled 394, blocked 137 (total **792**). The same project shows **"Test runs 25"** on its overview (`explore.json` @ 0 ms). So 792 cannot be a count of test runs (rounds). **[Fact-check: now verified]** A live count-only read of `GET /api/v1/projects/{id}/test-runs` for Electric Forest returns `total: 792`, and each item carries `journey_id` / `journey_name`. The 792 are **journey-run records**, not rounds. The same read confirms explorations `total: 9` (blocked 4, cancelled 2, completed 2, failed 1) and journeys `total: 160`. Context only, never a headline.
- The cancel endpoint "Cancel an active test run without deleting its history" (`openapi.json`). The Electric Forest chat repeats this: "All recordings, exploration history, and bugs are fully preserved — nothing was deleted" (`explore.json`).

### 5.5 Recording and Replay Browser (determinism)
- "Every journey run is backed by a Replay recording. While the journey executes, Replay Browser captures the full browser session, so the run can be replayed and inspected later exactly as it happened." (concepts page)
- Mechanism: "Replay Browser records the inputs to the runtime, so replaying the recording re-runs exactly the same execution." (time-travel page). Runtime Replay re-runs the runtime; Session Replay replays the DOM (same page).
- Apparatus, for the art department: a Chromium-based browser whose low-level OS library (libc) calls are intercepted by a small inline-assembly trampoline. The results are saved and fed back on replay so functions, promise resolutions and network responses happen in the same order. Vendor figures: "99.99% of compute is deterministic"; about "a Mb per second" of recorded data; "about 3% of overhead"; inspection uses forked and snapshotted browser processes, with "never a point more than 100ms away from a browser process". (https://docs.replay.io/reference/time-travel/how-does-time-travel-work). These are the vendor's own engineering claims. Attribute them as "Replay says", and keep them out of headline graphics unless the brief asks for them.
- Home-page phrasing: agents "write tests that they run while puppeting your app in our Chromium browser, capturing deterministic runtime recordings of every session" (https://www.replay.io/).

### 5.6 Account-level counts (Insights; digest + insights take)

| Figure | Value | Source | Status |
|---|---|---|---|
| Projects | **50** | `account-digest.json` insights.projects; Insights tile in `capture/clean/insights.json` (visible from 0 ms; hover on Total bugs at `stats` 2926 ms) | **Exact as an on-screen Insights figure, but not the account total [corrected].** The Insights sidebar lists 50 entries, the Project Scorecard has 50 rows, and the Projects page (`projects.json` @ 0 ms) shows 50 cards. The live REST API reports `total: 67`, and the newest 50 by `created_at` sum to exactly 711 bugs, so the UI most likely shows the newest 50 (inferred cap). Label it "Insights" |
| Journeys | **1151** | insights.journeys; Insights tile | Authoritative. The Scorecard "Journeys" column over 50 rows sums to 1151 |
| Explorations | **89** | insights.explorations; Insights tile | Authoritative (not cross-summable from the takes) |
| Total bugs / open | 711 / 389 open | insights; tile | Scorecard sums: 711 bugs, 389 open |
| Resolution rate | 29% | insights; tile | — |
| `projects_total` | 20 | account-digest.json | **Do not use.** Confirmed in the fact-check as one page: the default page_size of 20 returns 20 items, with `total: 67`. See section 7 |
| Unique project names | 41 of 50 | Insights sidebar | Some names repeat (for example "ExampleApps PR #9 - github-clone" three times). These are separate projects with the same name, and most are per-PR projects. **Say "50 projects", not "50 apps".** |

### 5.7 Electric Forest example (context only, not headline numbers)
`account-digest.json` → projects."Electric Forest": status **paused**, target URL is a localhost address (reached through the reverse proxy); journeys total **160** (Insights Scorecard row: Bugs 126, Resolved 126, Journeys 160, Resolution 100%); bugs fixed 101, invalid 24, wontfix 1 (= 126). **So "126 resolved" counts invalid and won't-fix as resolved: only 101 were fixed. Don't say "126 bugs fixed".** test-run status counts as in 5.4; explorations 9. On-screen overview: "Bugs 0" (open), "Test runs 25", Exploration "1 / 9".

---

## 6. Verified quotes (on-screen product copy and vendor docs; no person quotes)

On-screen copy (verbatim, from the cleaned takes, user's own account):

| Text | Where | Mark |
|---|---|---|
| "Exploration" / "1 / 9" / "View task page" | Electric Forest overview, Exploration card | explore @ 0, 2821, 11751 ms |
| "0:00" then "0:13", total "10:28" | Exploration player time readout | 0:00 at `play` 2821 ms; 0:13 by `end` 11751 ms |
| "Starting the exploration of the Electric Forest app. I'll begin with the public home page's in-page navigation: clicking 'Features' to see that section of the landing page." | Player narration subtitle (appears after play) | added to the DOM at **6868 ms** (between the 0:08 and 0:09 timer ticks) and present through 11751 ms |
| Player controls (aria-labels): "Pause", "Restart", "Seek replay timeline", "Playback speed: 1×"; nav buttons "Newer exploration" / "Older exploration" | Exploration card | explore |
| Exploration goal, which opens "Run a full exploration of the Electric Forest app through the managed reverse-proxy tunnel." (the full paragraph lists areas and checks) | Card prompt under the player | explore. **Note:** the full text names a person's test account; crop to the first sentence if shown |
| Tabs: "Overview", "Bugs", "Site map", "Test Runs", "Playwright Tests"; tiles "Bugs", "Test runs", "Playwright Tests · Experimental", "Connect CI to analyze failures" | Project page | explore, runs |
| "Test Runs" heading; search input aria-label "Search test runs"; columns "Created", "Description", "Environment", "Status", "Bugs", "Journeys" | Reminders · CI, Test Runs tab | runs @ `list` 3668 ms |
| Bugs cell "0 / 0 / 13 / 0" with tooltips "0 critical", "0 high", "13 medium", "0 low" | Test Runs table | runs @ 3668 ms |
| Chat run card tooltips: "Journeys finished", "Passed journeys", "Failed journeys", "Bugs found" | Project chat | explore, runs |
| Chat placeholder "Ask QA a question or change a setting…" | Project chat | explore, runs |
| "⚠️ I stopped exploring because the app requires a sign-in I couldn't complete, so signed-in areas couldn't be tested." | Electric Forest chat | explore @ 0 ms. A real "blocked" message, good proof for the blocked state, but it sits in the chat column and is not in the zoomed area |
| "Insights" / "Cross-project analytics for your autonomous QA pipeline — bug trends, severity breakdowns, and resolution tracking." / tiles "50 Projects", "711 Total Bugs", "389 open", "29 % Resolution Rate", "1151 Journeys", "89 Explorations" | Insights page | insights take, from 0 ms |

Runs-take table, Reminders · CI, top to bottom as displayed (newest first). Columns: Created | Description | Environment | Status | Bugs (crit/high/med/low) | Journeys.

1. 08/16/2026 | PR #3: PR #3 | PR #3 | Completed | 0/0/2/0 | 1
2. 08/16/2026 | PR #3: PR #3 | PR #3 | Completed | 0/0/1/0 | 2
3. 08/16/2026 | PR #3: PR #3 | PR #3 | Cancelled | 0/0/0/0 | 5
4. 08/16/2026 | Reminders app navigation, focus views, and completion flows | Project default | Completed | 0/0/2/3 | 7
5. 08/16/2026 | PR #3: PR #3 | PR #3 | Cancelled | 0/0/4/0 | 29
6. 08/16/2026 | PR #3: PR #3 | PR #3 | Completed | 0/0/1/0 | 1
7. 08/16/2026 | Reminder lists, search, Focus navigation, and modal interactions | Project default | Completed | 0/0/13/0 | 12
8. 08/16/2026 | PR #1: PR #1 | PR #1 | Completed | 0/0/1/0 | 1
9. 08/16/2026 | PR #1: PR #1 | PR #1 | Cancelled | 0/0/0/0 | 0
10. 08/16/2026 | Test Run #3 | Project default | Cancelled | 0/0/0/0 | 1
11. 08/16/2026 | PR #1: PR #1 | PR #1 | Cancelled | 0/0/0/0 | 1
12. 08/16/2026 | Dashboard and reminder list flows with accessibility and interaction… | Project default | Failed | 0/2/49/5 | 50
13. 08/12/2026 | Initial Test Run | Project default | Failed | 0/0/0/0 | 1

(Rows 1-5 are visible at the `start` mark in the overview's Test Runs card. All 13 rows are in the tab from `list` 3668 ms. The scroll between `list` and `scrolled` 5923 ms changes position only, not text. 13 rows matches the overview tile "Test runs 13". **Fact-check:** the scroll moves `main#main-content` from 0 to only **27.5 px** (events from 4696 to 5273 ms), the page's full scroll range. So the 50-journey Failed run and "Initial Test Run" are most likely already on screen at `list`, and the scroll only nudges the table's bottom edge into view. This is inferred from the scroll range, since no layout boxes are recorded. Don't script a shot as "scroll down to reveal older runs". Verify on the contact sheet. Environment badges link to `github.com/replayio/replayqa-cli-in-ci/pull/1` and `/pull/3`, as stated.)

Vendor-docs phrases the script may quote (short, verbatim):
- "Explore the app to get journeys. Run the journeys to get recordings." (concepts page, "The loop")
- "Every journey run is backed by a Replay recording." (concepts page)
- "Each journey run produces a Replay recording." (concepts page, "Test run")
- "capture a deterministic runtime recording of what happened" (overview, step 3)
- "re-runs exactly the same execution" (time-travel page)

No person quotes are used. The vendor home page has testimonial quotes from social handles. **Don't use them**: they are social posts and outside this topic.

---

## 7. Debates and controversies (discrepancies to label)

1. **Projects: 50 vs 20.** `insights.projects = 50`; `projects_total = 20` (both in `account-digest.json`).
   - For 50: the Insights tile shows "50 Projects". The Insights sidebar lists 50 entries. The Project Scorecard has 50 rows, and they sum exactly to the page's 711 bugs, 389 open and 1151 journeys. The Projects page take shows 50 cards. (`insights.json`, `projects.json`)
   - For 20: no on-screen surface shows 20. The REST `GET /api/v1/projects` has `page_size` default **20**, maximum 100, and `status` default "all" (`openapi.json`), so a digest count taken from the first page would be exactly 20.
   - **Resolution (revised by fact-check, 2026-10-14):** `projects_total = 20` is **confirmed** as a pagination artifact. A live count-only read of `GET /api/v1/projects` returned 20 items at the default page size and `total: 67`, and `page_size=100` returned all 67 (52 active, 15 paused). **The account has 67 projects, not 50.** The 50 on Insights are a subset. Sorted by `created_at`, the newest 50 projects' `bug_count` values sum to exactly **711**, the Insights total. The 17 oldest (created 2026-05-13 to 2026-06-12) hold 72 more bugs (783 in all). The Insights page, the sidebar (50 project links) and the Projects page (50 cards) therefore appear to show the 50 newest projects. That is an inferred UI cap, not documented. **Use "50" only as the Insights figure** (for example, "Insights: 50 projects · 1151 journeys · 89 explorations" with the screen in shot). Don't say "50 projects in the account" or "across all projects". The 1151 journeys and 89 explorations cover the same 50 projects, so the account-wide figures are larger and were not measured.
   - Caveat: 50 counts projects, not distinct apps. There are 41 distinct names among the 50 Insights rows, and 27 of them contain "PR #" (ExampleApps PR #6 to #11), plus "Electric Forest PR 4650 Preview".
2. **Electric Forest "test runs": 792 status counts vs "Test runs 25" on screen.** The digest's `test_runs` statuses (including infra-failed and incomplete, which the docs describe at the journey level) total 792, while the overview tile reads 25. Treat the digest numbers as journey-run or task statuses. **Don't put "394 cancelled" or similar on screen as test-run counts.**
3. **What the explore take proves.** The take shows the Exploration card and narration, but **not the agent's browser footage**. The player element was rrweb-blocked (`rr-block`, recorded at 0 x 0) and its placeholder is hidden by the clean CSS. A shot that promises "watch the agent explore" needs other footage (for example the exploration's own rrweb stream through `recording-events`, which is API data and needs the editorial OK), or the narration must stay on what is visible: the card, the moving timer, the subtitle.
4. **Two kinds of replay.** The exploration player is rrweb DOM events plus subtitles. Journey-run recordings are Replay **runtime** recordings made in Replay Browser. The vendor itself says Runtime Replay re-runs the runtime while Session Replay replays the DOM (time-travel page). Don't conflate the two in narration. *Fact-check nuance:* the `recording-events` endpoint serves rrweb rows "for one task, test run, exploration, or Replay recording", and `GET /api/v1/explorations/{id}` mentions "polish-pass findings against the exploration's own recording". So an exploration may also have a recording of its own. What is settled is that **the player on the overview renders rrweb DOM events plus subtitles**. Whether the same exploration also has a Replay runtime recording is unverified.
5. **Step counts.** The docs list five steps; the home page lists three. Both are the vendor's own. Pick one per graphic.

---

## 8. Misconceptions to avoid

- "Explorations replace your journeys": no. Later explorations **add** coverage.
- "Journeys are scripted tests you write": no. A journey starts as a natural-language description, and Replay QA records concrete steps itself once it is confident.
- "A test run is one recording": no. **Each journey run** in the test run produces its own Replay recording.
- "Blocked means the app is broken": no. Blocked or incomplete means something outside the app's behavior got in the way (login, invitation, paywall, rate limit, missing verification code, unreachable app).
- "Cancelling deletes results": no. Cancel stops the run "without deleting its history".
- "50 apps", "20 projects" or "50 projects in the account": Insights shows **50 projects**, but the account's API reports **67**. Say "Insights: 50 projects". Don't call them apps, and don't use 20.
- "Electric Forest fixed 126 bugs": 126 are resolved on the Scorecard, but only 101 are fixed (24 invalid, 1 won't fix).
- "131 journeys passed": the 09/30 round finished 131 / 131 journeys with **1 passed, 0 failed, 0 bugs**.
- "The overview player is the time-travel recording": no. It is an rrweb replay with narration.
- Don't show the Electric Forest per-status counts as headline figures.
- The `replay-qa` book's "Acme store" journey (public/generated/replay-qa/manifest.json, ch. 2) is an illustration and not account data. Don't mix it with real numbers.

---

## 9. Curiosity hooks (true, sourced)

1. The exploration player shows the AI agent's own running commentary as subtitles: "Starting the exploration of the Electric Forest app…" (`explore.json`; `openapi.json` recording-events).
2. When an exploration hits a wall, it writes in the chat, in the first person, what it needs: "⚠️ I stopped exploring because the app requires a sign-in I couldn't complete…" (`explore.json`).
3. Journeys graduate: an agent first follows a plain-English description, and Replay QA records concrete steps only once it is confident about the flow (concepts page).
4. A single Electric Forest round finished **131 journeys** ("Main page load and broad site navigation sweep", 09/30/2026, Completed) (`explore.json`). **Fact-check caveat:** its run card shows Passed 1, Failed 0, Bugs found 0, so don't imply 131 passing tests or a bug haul. Safe wording is "one round, 131 journeys".
5. Replaying the recording "re-runs exactly the same execution", so a bug recorded once can be inspected again and again "by anyone with the link" (time-travel page).
6. Replay says recording adds only "about 3% of overhead" and about "a Mb per second" (time-travel page; vendor claim).
7. In one CI project, the same Test Runs table mixes "Project default" rounds with **PR #1** and **PR #3** rounds whose environment badges link straight to the pull requests (`runs.json`).
8. Across the 50 projects on the Insights page, Replay QA has built **1151 journeys** from **89 explorations** (Insights; `account-digest.json`). **[Corrected]** Not "in the account": the account has 67 projects per the live API, and Insights covers 50 of them.
9. Logins are stored as project variables "referenced by name", so they never appear in journey steps or bug reports (`basics_replay-qa_getting-good-results.txt`).

---

## 10. Visual and dramatic details (for shots)

- **Explore take** (`capture/clean/explore.json`, 1440 x 900, 11 751 ms, 1 click, 1 redaction). Marks: `start` 0, `play` 2821 ms, `end` 11 751 ms. The page scrolls to the Exploration card at the bottom of the overview. The cursor travels to the player's play button (mouse down at 2331 ms, click event at 2408 ms, at about x 582, y 867; the `play` mark at 2821 ms is set after the click finishes, so **the click lands about 0.4 s before the `play` mark**), then drifts to about (1180, 560). The **timer reads 0:00 at `play`, first ticks to 0:01 at 3064 ms, and reaches 0:13 at 11064 ms**. The narration subtitle is added at 6868 ms. The picture area of the player is **empty** (see section 7, item 3). Zoom on the controlbar and the subtitle rather than the stage. The left column is the long project chat, with grey "Project paused…" and "⚠️ I stopped exploring…" bubbles and run cards ("Blocked · 30 / 30 journeys", "Completed · 131 / 131 journeys"). Credits and Admin chrome are hidden by the clean CSS.
- **Runs take** (`capture/clean/runs.json`, 1440 x 900, 6 573 ms after 2 397 ms of dead time was cut, 1 click). Marks: `start` 0 (Reminders · CI overview with "Bugs 6", "Test runs 13", Exploration "1 / 14", bug list rows), click on "Test Runs" (about 2.2 s), `list` 3668 ms (the 13-row table with green Completed, red Failed and grey Cancelled pills; blue "PR #3" / "PR #1" environment badges), a scroll ending at `scrolled` 5923 ms that the take requested as 600 px but that moves only **27.5 px** (the page's whole scroll range, from 4696 to 5273 ms), so the older rows (the 50-journey Failed run, "Initial Test Run") are most likely already visible at `list`, and a hold to `end` 6573 ms. Strong zoom targets are a "PR #3" badge next to "Completed", and the Bugs severity cell "0 / 0 / 13 / 0" on the 12-journey run.
- **Insights take** (for account counts): tiles "50 Projects · 711 Total Bugs · 29 % · 1151 Journeys · 89 Explorations", visible from 0 ms. Hover on "Total bugs" at `stats` 2926 ms; scroll to severity at 6905 ms.
- Product vocabulary for kinetic type: `{ explore }` → `{ journeys }` → `{ runs }` → `{ recordings }` → `{ bugs }`, which mirrors "The loop".

---

## 11. Sources

1. https://docs.replay.io/basics/replay-qa/concepts (local: `films/replay-qa-promo/research/sources/basics_replay-qa_concepts.txt`; live check 2026-10-14 via Claude in Chrome, identical)
2. https://docs.replay.io/basics/replay-qa/overview (local: `research/sources/basics_replay-qa_overview.txt`; live check 2026-10-14, identical)
3. https://docs.replay.io/reference/time-travel/how-does-time-travel-work (local: `research/sources/reference_time-travel_how-does-time-travel-work.txt`; live check 2026-10-14, identical)
4. https://www.replay.io/ (home page, read 2026-10-14 via Claude in Chrome)
5. https://docs.replay.io/basics/replay-qa/getting-good-results (local: `research/sources/basics_replay-qa_getting-good-results.txt`)
6. https://qa.replay.io/api/v1/openapi.json (local: `research/sources/openapi.json`: GET /api/v1/projects page_size default 20; createJourney "unstepped"; explorations; recording-events; test-run cancel)
7. https://docs.replay.io/llms.txt (local: `research/sources/llms.txt`)
8. `films/replay-qa-promo/research/sources/account-digest.json` (insights; projects_total; Electric Forest)
9. `films/replay-qa-promo/capture/clean/explore.json` (+ `capture/takes/explore.mjs`)
10. `films/replay-qa-promo/capture/clean/runs.json` (+ `capture/takes/runs.mjs`)
11. `films/replay-qa-promo/capture/clean/insights.json` (+ `capture/takes/insights.mjs`)
12. `films/replay-qa-promo/capture/clean/projects.json` (+ `capture/takes/projects.mjs`)
13. `public/generated/replay-qa/manifest.json` (existing book; illustrative only)
14. https://qa.replay.io/insights (live re-read attempted 2026-10-14 and refused in the research pass; **succeeded in the fact-check pass the same day** via Claude in Chrome: tiles and Scorecard identical to the take)
15. https://qa.replay.io/api/v1/projects?page_size=100 and `/api/v1/projects/proj-electric-forest-ms8w0nv1/{test-runs,explorations,journeys}` (signed-in, read-only, **counts only**, fact-check 2026-10-14: projects total 67 (52 active / 15 paused); Electric Forest test-runs total 792 (journey-run items), explorations 9, journeys 160)

---

## Fact-check log (adversarial pass, 2026-10-14)

Method: the local docs copies were re-read and the three docs pages plus https://www.replay.io/ were re-read live in Chrome (concepts, overview and home page match the quoted wording word for word; the time-travel sentence "Replay Browser records the inputs to the runtime, so replaying the recording re-runs exactly the same execution" is present live). Every take (`explore.json`, `runs.json`, `insights.json`, `projects.json`) was rebuilt to text at each mark with a scratch rrweb DOM rebuilder, and the text mutations were traced over time. `openapi.json` was parsed. The live Insights page and count-only REST reads were done in the signed-in browser.

Changes:
1. **Projects count corrected.** "50 is the full set of projects / 50 projects in the account" became "Insights shows 50; the account has 67 per the live API". The newest 50 projects' bug counts sum to exactly 711, so this is an inferred 50-project UI cap. Edited in sections 1, 5.6, 7.1, 8 and 9.8. Sources: live `GET /api/v1/projects?page_size=100` (`total: 67`); https://qa.replay.io/insights.
2. **`projects_total = 20` confirmed** as one page, moved from inference to verified (the default page size returns 20 items with `total: 67`).
3. **Electric Forest 792 confirmed** as journey-run records (the live test-runs endpoint returns `total: 792`, and its items carry `journey_id`). Explorations 9 and journeys 160 were confirmed live.
4. **Electric Forest "126 resolved"** needed a caveat: 101 fixed, 24 invalid, 1 won't fix (`account-digest.json`). Added to 5.7 and 8.
5. **131-journey round** needed a caveat: the chat run card shows Passed 1 / Failed 0 / Bugs 0 (`explore.json` @ 0 ms). Added to section 2, hook 4 and section 8.
6. **Explore take timing corrected:** the click events are at 2331 to 2408 ms, the `play` mark is at 2821 ms, the subtitle is added at 6868 ms, and the timer reaches 0:13 at 11064 ms (`explore.json` text mutations). Edited in sections 6 and 10.
7. **Runs take scroll corrected:** it moves 27.5 px, not 600 px, and does not meaningfully "reveal" the older rows (`runs.json` scroll events on `main#main-content`). Edited in sections 1, 6 and 10.
8. **"Never finished loading" example demoted:** its detail text describes an authentication wall (`explore.json`, Aug 31, 2:28 PM). Edited in 5.2.
9. **Exploration player nuance:** the API suggests an exploration has its own recording, so the claim is limited to what the player renders (rrweb plus subtitles). Edited in 7.4.

Confirmed without change: the loop wording; exploration, journey, test-run, recording and blocked definitions; the "unstepped (agent-driven)" API wording; the five-step overview and the three-step home page; "capture a deterministic runtime recording of what happened"; the run statuses Completed, Failed, Cancelled and Blocked (data-testids `status-indicator-{completed,failed,cancelled,blocked}`); the Insights tiles and Scorecard sums (50 rows → 711 / 389 / 1151, resolved 207 → 29%); 41 distinct names; the 13-row Reminders · CI table, row by row; PR #1 and #3 links; "Test runs 13", "Test runs 25" and "Exploration 1 / 9"; the rr-block player at 0 x 0; the verbatim chat quotes ("⚠️ I stopped exploring because the app requires a sign-in I couldn't complete…" and "All recordings, exploration history, and bugs are fully preserved — nothing was deleted"); the bug-cap exchange (100 → 150, 111 filed, 65 open); and the time-travel figures (99.99%, "a Mb per second", "about 3% of overhead", 100ms).
