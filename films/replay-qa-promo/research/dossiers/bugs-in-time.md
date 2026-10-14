# Dossier: Bugs that only exist in time: runtime replay, network and React polish passes

- **Topic id:** `bugs-in-time`
- **Era:** product, as of 2026-10-14
- **Film:** replay-qa-promo (look: promo, about 90 s)
- **Researched:** 2026-10-14. Local sources were checked against the live pages: docs.replay.io (time travel, polish passes) and replay.io (home and how-it-works), all read in the user's Chrome. The two bug takes were replayed frame by frame with `tools/promo/rr-sheet.mjs` at their marks, and the text on screen at each mark was rebuilt from the cleaned rrweb events.
- **Source refs:** repo-relative paths are relative to `films/replay-qa-promo/`. Numbered sources are listed in section 11.

> **Three corrections the script must take on board before anything else**
> 1. **The "7 enabled" polish passes are NOT what the recorded settings take shows.** The `schedule` take (project `collaborative-ai-editor.brett-lamy.workers.dev`) reads **"Network Performance, Layout Shift, Glitches, User Experience · 4 enabled"** at every mark (polish 2226 ms, schedule 8808 ms, add-env 11458 ms). The "7 enabled" line in `account-digest.json` was typed into `tools/promo/account-digest.mjs` (line 36) by hand. It matches no capture. The project that found the 67 ms bug (Electric Forest PR 4650 Preview) had eight passes on, plus sightmap, according to its own project chat. **On screen and in narration, use what the take shows (4 enabled), or say "turn on the passes you need".** Do not say "seven".
> 2. **"reading-room" is a repository, not an app.** Both network bugs come from the **Electric Forest** project (target `http://127.0.0.1:61787`, run as a *Local* environment through the reverse proxy). In that app, `maple/reading-room` is a seeded repository (org `maple`, repo `reading-room`). The endpoints are `/api/repos/maple/reading-room/pulls` and `/api/repos/maple/reading-room/board`. Say "a pull-request list" or "an issue board", not "the reading-room app".
> 3. **Say "about 800 ms", never "800 ms".** The title of `board_poll_105` says "~800ms", and its body says "every ~700-900ms".
> 4. **(Fact-check) Do not seek the `bug-react` take to exactly 3032 ms.** At 3032 ms the right panel is still a grey loading skeleton; the chips, title and dark "Loading replay…" player are applied from 3033 ms. The dark player lasts only until about 3217 ms, after which the player is white and empty with "--:--" controls. Seek to 3040-3200 ms for the dark-player look.

---

## 1. Summary

Some bugs only exist in time: a React commit that holds the main thread for 67 ms, or a polling loop that keeps asking the server the same question. A screenshot shows a page that looks fine. A log line shows one request, and that request is fine. The bug is the *rhythm*: how long something blocked the thread, how often it fired, and why it never stopped. Replay QA can prove these bugs because every journey run happens in **Replay Browser**, which records the *inputs to the browser runtime*. Replaying that recording "re-runs exactly the same execution" [S1]. An agent can then go back to any moment, inspect the code that ran and measure it. The vendor puts it this way: "A Replay recording removes the reproduction step" [S1].

**Mechanism (for a curious teenager).** Most of what a browser does is deterministic: the same inputs always give the same outputs. Only a thin layer of calls to the operating system brings in non-determinism (clock reads, network bytes, file reads). Replay intercepts those low-level library calls (libc: `mmap`, `read`, `open`...) with a small amount of inline assembly. It saves their results, then feeds the same results back on replay, much as a unit test mocks `readFileSync` so `fibonacci()` always returns 55 [S1]. The docs give these figures: "99.99% of compute is deterministic"; recording averages "about a Mb per second"; interception costs "about 3% of overhead", compared with "10% or more" for most instrumentation [S1]. Analysis happens at *replay* time. A pool of forked and snapshotted browser processes means "there's never a point more than 100ms away from a browser process" [S1].

**Session Replay vs Runtime Replay.** "Session Replay tools replay the DOM and Runtime Replay tools re-run the runtime so that you can inspect the session with browser DevTools" [S1]. The intuition that matters for the film is our own inference, though it is fully grounded. In the 67 ms bug, **25 of the 27 fibers React rendered produced *no DOM mutations*** [S5]. A tool that records only DOM changes has nothing to record for those 25 renders, because by definition they changed nothing. The waste lives in JavaScript execution, which only a runtime recording keeps.

**The passes that catch these bugs.** After every journey run, each enabled **polish pass** reviews that run's recording. It collects candidates, drops duplicates and confirms each one before filing a bug [S2]. **Network performance** reports "Slow requests, large payloads, and waterfall issues". **React rendering** reports "Unnecessary re-renders and performance bottlenecks in React apps". React rendering "only reports on React applications", and "publishing source maps improves what it can name" [S2].

**Proof points (account data, exact).** Of 711 bugs in the account, **453 (64%) came from polish analysis** and 258 (36%) from journey testing [S5][S7]. The four featured bugs:

| key | id | what | status / severity | where |
|---|---|---|---|---|
| react_commit_67ms | bug-muen719p-vdmh | 67 ms React commit at T=383.2s, 4 dropped frames, 25 of 27 fibers wasted, ~34 ms waste | **open**, medium, React Rendering | Replay QA's own Projects page, tested as project "Electric Forest PR 4650 Preview" |
| navigation_commit_56ms | bug-muemtceb-we4e | 56 ms navigation commit, 87 fibers, 3 dropped frames | **open**, medium, React Rendering | Replay QA's Projects list → project Overview, filed in project "Electric Forest PR 4650 Preview" |
| live_sync_258 | bug-mtmk9vtr-21c2 | live-sync loop: 258 re-fetches, checkpoint stuck at -1, avg ~631 ms | **fixed**, medium, Network Performance | Electric Forest (local), `/api/repos/maple/reading-room/pulls` |
| board_poll_105 | bug-mtmjva2o-pah7 | board poll every ~800 ms, waitMs=500, 105 identical empty responses in ~70 s | **fixed**, low, Network Performance | Electric Forest (local), `/api/repos/maple/reading-room/board` |

---

## 2. Timeline (dated events)

| date (UTC) | event | source |
|---|---|---|
| 2026-08-01 to 2026-09-30 | The Electric Forest project's chat (the `bug-sync` take's left column) logs exploration and test rounds: Auth0 sign-in walls, budget pauses and resumes. Its message timestamps span 2026-08-01T19:47Z to 2026-09-30T23:13Z (fact-check: the earlier "08-31 to 09-01" range was too narrow). This is the project where the network bugs were filed | capture/clean/bug-sync.json (rebuilt text, `datetime` attributes) [S6] |
| 2026-09-04T06:05:26.069Z | `board_poll_105` (bug-mtmjva2o-pah7) discovered | research/sources/account-digest.json [S5] |
| 2026-09-04T06:16:47.397Z | `live_sync_258` (bug-mtmk9vtr-21c2) discovered. The take shows "Discovered 1 month ago at 2:16 AM" (local time, EDT) | [S5]; capture/clean/bug-sync.json [S6] |
| 2026-09-04 → 2026-10-14 | Both network bugs set to **fixed**. The Electric Forest scorecard on Insights shows 126 bugs, 126 resolved, 100%. "Resolved" is not "fixed": the digest splits Electric Forest's 126 bugs into 101 fixed, 24 invalid, 1 wontfix | [S5]; capture/clean/insights.json [S7] |
| 2026-09-23T21:45:27.722Z | `navigation_commit_56ms` (bug-muemtceb-we4e) discovered | [S5] |
| 2026-09-23T21:56:06.418Z | `react_commit_67ms` (bug-muen719p-vdmh) discovered. The take shows "Discovered 21 days ago at 5:56 PM", Source "Test Run #run-muek", Project "Electric Forest PR 4650 Preview" | [S5]; capture/clean/bug-react.json [S6] |
| 2026-09-23 (chat, 4:28 PM to 9:13 PM local) | PR 4650 Preview project: "I explored the app and ran 71 journeys, and filed 68 bugs, 68 still open" (Initial Test Run card: 71 / 71 journeys, 62 passed, 9 failed, 68 bugs). Sightmap pass enabled "alongside the other passes already on (network-performance, react-rendering, layout-shift, glitches, user-experience, accessibility, seo, ui-details)". **Unverified link:** the 67 ms bug's source is "Test Run #run-muek"; nothing in the takes or digest proves run-muek is that Initial Test Run, so do not say the 67 ms bug came from "the run that filed 68 bugs" | capture/clean/bug-react.json [S6] |
| 2026-10-14 | Both React bugs still **open**. The account totals 711 bugs, 389 open, 29% resolution rate | [S5][S7] |
| as of 2026-10-14 | Live docs: the "How does time travel work?" and "Polish passes" pages match the saved copies word for word | [S1][S2] (checked live) |

---

## 3. People

Not applicable: this is a product promo. No real person is depicted or quoted. The narrator is a generic voice. The two agents in the subtle beat (developer and critic) are abstract product characters, grounded in the bug pages' **Requirements / Evidence / Acceptance judge** buttons (visible in the `bug-sync` take) and in coding agents driving Replay QA through MCP. They are not depictions of people.

---

## 4. The belief of the age (adapted: the testing assumption the product argues against)

- **The assumption:** if a test passes and the screenshot looks right, the page is fine. Debugging means "adding a log, refreshing, and hoping the bug happens again" [S1].
- **Why it fails for these bugs:** they "depend on network timing, race conditions, and state that is gone by the time you notice the problem. Repeating the same steps may never reproduce them" [S1].
- **The vendor's counter-position:** record the runtime once and replay it deterministically; then "Any bug that was recorded once can be inspected as many times as needed, by anyone with the link" [S1]. On replay.io's home page FAQ: "It reports what your app did, not what the code says it should do" [S3].
- **The fair-minded other side (keep the tone respectful):** replay.io's own FAQ calls monitoring and session-replay tools "genuinely useful". The difference it draws is timing and depth: those tools watch production after users are affected, while Replay records "the actual JavaScript execution during testing, before the code ships" [S3]. The film must not say session replay is useless or that it cannot see network traffic (see section 8).

---

## 5. Experiments and results (the mechanics and the four featured bugs)

### 5a. How Runtime Replay works (numbers from the vendor) [S1]
- **What is recorded:** the inputs to the runtime, meaning the results of low-level OS library calls. The recording is not a video or a DOM diff. A macro list (`FOR_EACH_REDIRECTION`) enumerates the intercepted calls, for example `mmap`, `munmap`, `read`, `open`.
- **Determinism contract:** on replay, "Functions should be called at the same time. Promises should be resolved in the same order. Network requests should be made at the same time and returned at the same time. If anything user-visible happens in a different order, you have failed."
- **Cost:** "99.99% of compute is deterministic"; "about a Mb per second"; the interception assembly adds "about 3% of overhead" (most instrumentation: "10% or more").
- **Inspection:** the Replay protocol reduces to three commands: run to execution point, pause at point, evaluate expression. Adding a console log to a line that already ran returns messages "in under a second". Replay cannot run faster than the original ("60s of compute ... approximately 60s to replay"), but forked and snapshotted process pools keep every point within 100 ms of a live process.
- **Analysis at replay time:** "Root cause compares a passing and failing recording and looks for the earliest divergence". Performance regression analysis "builds a dependency graph" of what must happen before an event. These are "prohibitively slow at runtime and are only possible at replay time".
- **Product wording (replay.io/how-it-works, live):** each journey test records "every DOM mutation, every network call, every JavaScript frame"; "Because our recordings are deterministic, the session behaves identically every time it's replayed" [S4]. The home page FAQ adds that with source maps, agents "tie that recorded execution back to your original source", and that runtime-first analysis "catches a race condition that only shows up under real timing ... neither of which exists in the source to be scanned" [S3].

### 5b. How polish passes run [S2]
- Full current list (10): Network performance, React rendering, Layout shift, Accessibility, Glitches, User experience, SEO, UI details, Security, Sightmap. "The set of passes changes over time."
- Pipeline: after each journey run, every enabled pass reviews that run's recording → collects candidate findings → drops duplicates of existing bugs → confirms each remaining candidate → files it as a bug whose category is the pass name.
- UI details creates journeys instead of bugs (and also runs after the first exploration). Sightmap produces a document.
- Setup: React rendering is React-only, and source maps improve naming. Security needs ownership verification (a nonce file) and never runs on emulated or cloned targets. SEO is for public pages only.
- Bug report fields include Root cause ("traced through the recording to the responsible code path, with the evidence (source, console, network, React state)") and Causal chain. "Replay QA does not generate a code patch" [S8]. (The marketing site says each report includes "a suggested fix" [S3][S4]. Both hold: it suggests and does not apply. See section 7.)

### 5c. Featured bug 1: `react_commit_67ms` (bug-muen719p-vdmh): OPEN · medium · React Rendering [S5][S6]
- **Title (exact):** "67ms React commit at T=383.2s drops 4 frames on the Projects page: RTK-Query updates re-render Projects and SidebarProjectList wholesale, wasting 34ms re-rendering memo-less react-router Link components"
- **Where:** Replay QA's own Projects page ("While viewing the Replay QA Projects page"). It was found while testing project **Electric Forest PR 4650 Preview** (target: a Netlify PR-4650 preview of the `loop-qa` app). The journey was "Detail: Record detail view opens and dismisses (nav) at /settings/mcp".
- **Trigger:** RTK-Query `projectDataApi/internalSubscriptions/subscriptionsUpdated` plus two `projectDataApi/executeQuery/pending` dispatches, fired by a background refresh while the page is idle (no user action).
- **Numbers (copy exactly):** commit **67 ms** (totalDurationMs **67.32**) at **T=383.2s** (commitTime 383224.33 ms); **27 fibers** rendered, **25 wasted** (no DOM mutations); wastePercent **50.0**, wastedDurationMs **33.66** ("~34ms"); **4 dropped frames** ("~67ms vs the 16.7ms frame budget"). Cascades: `Projects` → 19 fibers, 100% waste, **22.8 ms** (22.77); `SidebarProjectList` → 6 fibers, 100% waste, **10.9 ms** (10.89). Store re-render costs: Projects **18.87 ms**, SidebarProjectList **14.79 ms**. Worst offender: react-router `Link`, **4 wasted renders, 19.0 ms** (19.03); lucide-react `Icon`, **8 wasted renders, 8.90 ms**. Every one has renderCause `parent-propagation` and wasteRate 1.0. Evidence finding id: `heavy-commit-400` (ReactPerformanceInsights). Code location: `react-router/chunk-6CSD65Y2.mjs:10429` (`LinkWithRef`, not wrapped in React.memo).
- **Expected:** stay "well within the 16.7ms frame budget so the page stays at 60fps".
- **Arithmetic check:** 22.77 + 10.89 = 33.66 ms waste; 19 + 6 = 25 wasted fibers; 67.32 / 16.7 ≈ 4.0 frame budgets. Consistent.
- **Do not use:** the garbled parenthetical "(3.3ms of its 33.7ms productive render time + 33.7ms wasted)" in actual_behavior. Say "half of the 67 ms, about 34 ms, was wasted".
- **Recording:** replay_recording_id `066912b6-ed99-4681-ba3b-2d50df1e56c1`. The chronology entry is stamped **6:20.8** (screenshot at 380844 ms, just before the commit at 383224 ms). Note: the player in the take reads **0:00 / 0:51**, so do not put "T=383.2s" on a scrubber of that player. See section 8.

### 5d. Featured bug 2: `navigation_commit_56ms` (bug-muemtceb-we4e): OPEN · medium · React Rendering [S5]
- **Title (exact):** "Click on project card triggers 56ms navigation commit (86-component re-render from BrowserRouter) that drops 3 frames"
- **Where:** the Replay QA Projects list. Clicking a project card (example.com) at t≈140.5s navigates to that project's Overview tab. **Project (fact-checked):** Electric Forest PR 4650 Preview. The `bug-react` take shows its row ("Click on project card triggers 56ms navigation commit (86-c…", Medium, Open, React Rendering) in that project's Bugs list at about 1956 ms, and `tools/promo/account-digest.mjs` line 46 picks it from the PR-4650 bug set. Whether it came from the same test run as bug 1 is still unverified.
- **Numbers (copy exactly):** commit at **t=140.586s** ("T=140.6s"); **87 fibers** in **55.9 ms** ("56ms"); **38.6 ms** commit phase + **19.4 ms** passive effects; **3 dropped frames** ("more than three 16ms frame budgets"); `setState` in `BrowserRouter` cascaded to **86** descendant components, **5 levels deep**. Only **2.3 ms (4.1%)** wasted. Top costs: ProjectOverview **17.6 ms**, ProjectChat **9.6 ms**, AppShell **4.9 ms**, Routes **3.9 ms**, CreditMeter **3.0 ms**. Trigger: `usePrefetchProjectData` (projectDataApi.ts:1232-1239) dispatching `executeQuery/pending` ×2, `subscriptionsUpdated`, and `executeQuery/fulfilled` ×2 in the same batch as the route change.
- **Key nuance for the script:** this is NOT a wasted-render bug. Its render work "is mostly productive". It is a *too much at once* bug: the whole tree re-renders in one frame. 87 vs 86: 86 descendants plus the BrowserRouter fiber itself.
- **Internal inconsistency:** 38.6 + 19.4 = 58.0 ms, not 55.9 ms. Quote "56 ms" only, and do not show the phase split.
- **Recording:** `3eddb1ff-5fc6-4016-b84f-920077d0644b`. There is no take of this bug, so the film can only reference it as data.

### 5e. Featured bug 3: `live_sync_258` (bug-mtmk9vtr-21c2): FIXED · medium · Network Performance [S5][S6]
- **Title (exact):** "Live-sync loop re-fetches /api/repos/maple/reading-room/pulls 258 times with checkpoint never advancing past -1"
- **Where:** Electric Forest project, **Local** environment (`http://127.0.0.1:61787`, through the reverse proxy). The PR-list view is `/orgs/maple/repos/reading-room/pulls`. Journey: "Detail: Page sizing and scroll behavior (http://127.0.0.1:61787/orgs/maple/repos/reading-room/pulls)".
- **Request:** `/api/repos/maple/reading-room/pulls?projection=1&reducer=pr-index&live=1&checkpoint=-1&waitMs=500`
- **Numbers (copy exactly):** **258** sequential GETs (**257 × HTTP 200, 1 no-response**); each **~575–760 ms**, **avg ~631 ms**; **~600–750 ms** between request starts; the root cause card says "~every 600ms". Requests run from **15292 ms** to **175614 ms** (the "~160s" loop span). The checkpoint was verified as -1 at requests **#0–#2** and again at **#250–#254**, "160s later". Only **2 clicks**, no keypresses: no user activity drives the loop.
- **Mechanism (teen version):** a "since when?" bookmark that is never moved. Each round asks "everything since -1", meaning since the beginning. So the server can never answer "nothing new", and the client downloads the full list again about every 0.6 s, forever.
- **Expected:** send the last checkpoint received, fetch only deltas, and keep network activity "near zero while nothing changes".
- **Recording:** `b9048c2d-5f11-4e69-ae9c-46f5923a3358`. The player in the take reads **0:00 / 2:56**. The chronology starts at **0:15.2** (screenshot at 15292 ms).
- **Coincidence warning:** **258** is also the account's **journey-testing bug count** (Insights: "Journey Testing 258 · 36%"). These are unrelated numbers. Never put them side by side or imply a link.

### 5f. Featured bug 4: `board_poll_105` (bug-mtmjva2o-pah7): FIXED · low · Network Performance [S5]
- **Title (exact):** "Board live-poll re-requests /api/repos/maple/reading-room/board every ~800ms with waitMs=500 — 105 identical empty responses in ~70s"
- **Request:** `/api/repos/maple/reading-room/board?projection=1&reducer=issue-board@1&live=1&checkpoint=...&waitMs=500`
- **Numbers (copy exactly):** **105** requests from **35802 ms** to the end of the session, all **200**, each returning the identical body `{"ok":true,"events":[],"checkpoint":"0000000000000000_0000000000000000",...}`. Cadence "every ~700-900ms" in the body, "~800ms" in the title. **105 of 160** API calls in the session matched this filter. The server hold is **waitMs=500**, while the shared URL builder in the bundle defaults to **waitMs 10000**. Sibling streams `/registry/me` and `/api/chat/maple` used ~10 s waits and needed **~5 requests each**. Expected: "roughly one request per 10 seconds instead of ~75 per minute". An SSE transport (`live=sse`) already exists in the bundle. Only **2 clicks**.
- **Why it is a time-travel story:** the evidence includes *code that is in the bundle but never ran on this path* (the 10000 ms default, the SSE transport). The report also records that the bug **corrected its own first hypothesis**: "(Corrects the original 'per keystroke' hypothesis: the measured driver is the live-poll loop, not typing.)" That is the confirm-before-filing step [S2] at work.
- **Do not compute on screen:** 105 × ~0.8 s ≈ 84 s, which does not quite match "~70s". Quote the title's figures as given.
- **Recording:** `fdfe8abf-1584-47b9-9b49-80cde46389e3`. There is no take, so this bug is data only.

### 5g. What the two bug takes show at each mark (verified by contact sheet) [S6]
Both takes are 1440 × 900 and have the same layout: project chat column on the left, bug detail on the right.

**bug-react** (duration 13692 ms; a cut joins `open` and `report`, both at 3032 ms):
| mark | ms | on screen (right panel) |
|---|---|---|
| start | 0 | (fact-check) A blank loading shell at 0 ms. The Bugs list of "Electric Forest PR 4650 Preview" (Bugs 49) has rendered by about 1742-1956 ms, with React Rendering rows (including the 67 ms and 56 ms bugs) visible, and the cursor moves to the "67ms React commit" row |
| open / report | 3032 | (fact-check) At exactly 3032 ms: a grey loading skeleton. From 3033 ms: chips **Open · Medium · React Rendering · Project default · Journey: Detail: Record detail view opens and dismisses (nav) at /settings/mcp**, the large title, and the **Replay** panel showing a dark, empty player reading "Loading replay…" (look.md: our time-travel overlay can live here). From about 3217 ms the player turns white and empty with "--:--" controls; "No recorded judge actions available." appears by about 3483 ms |
| actual | 8723 | Scrolled 760 px: **Actual Behavior** / **Expected Behavior** in two columns, the **Root Cause** card below, then Evidence ("React performance insights json", "Source …react-router…chunk-6CSD65Y2.mjs"). Player header now reads 1× · 0:00 / 0:51. "No recorded judge actions available." |
| rootcause | 12008 | Scrolled 1180 px: end of the Root Cause card, **Evidence 2**, **Chronology of Events** (entry **6:20.8** with a screenshot thumbnail, "Screenshot 380844"), then **Root Cause to Actual Behavior** steps 1–4 (Projects 18.87 ms, SidebarProjectList 14.79 ms; 19 fibers 22.77 ms; 6 fibers 10.89 ms; "totalDurationMs 67.32, wastedDurationMs 33.66, 25 of 27 fibers wasted") |
| end | 13692 | held |

Details sidebar (lower in the page): Status Open · Severity Medium · Discovered 21 days ago at 5:56 PM · Type Polish · React Rendering · Source Test Run #run-muek · Webhook Not sent.

**bug-sync** (duration 8804 ms; there is no list step, the take opens directly on the bug):
| mark | ms | on screen (right panel) |
|---|---|---|
| start / report | 0 / 1603 | Chips: **Fixed · Medium · Network Performance · Local · Journey: Detail: Page sizing and scroll behavior (…/reading-room/pulls)**. The title is large. The **Replay** player has controls **0:00 / 2:56**, 1×. Below it: "View the task that generated this bug report", "Requirements judge", "Evidence judge", "Acceptance judge" |
| actual | 5402 | Scrolled 760 px: **Actual Behavior** (258 sequential GETs, 257 × 200, 1 no-response, ~575–760 ms) / **Expected Behavior**, the **Root Cause** card ("never advances its checkpoint cursor … ~every 600ms … (258 requests)"), **Evidence 2** (Network requests ×2), and the start of the Chronology (**0:15.2**) |
| rootcause | 8154 | Scrolled 1180 px: Evidence (Network ×2), Chronology entries 1–2 ("requests at 15292ms, 15627ms, 16342ms, ... 175614ms"; "request #254 still carries the identical query checkpoint=-1"), **Root Cause to Actual Behavior** steps 1–3 (ending "258 GETs (~600-750ms cadence, avg 631ms)"), and "Full Bug Report: Markdown for Claude Code, Cursor, and other coding agents" |
| end | 8804 | held |

Details sidebar: Status Fixed · Severity Medium · Discovered 1 month ago at 2:16 AM · Type Polish · Network Performance · Source Test Run #run-mtmj · Project Electric Forest.

**Redaction note:** (fact-check) the credit meter is NOT hidden everywhere. In `bug-react` the header shows "8807.5 of 500 credits" and an Admin chip while the Bugs list is up (seen at 1956 ms); it is gone by the report mark. Crop the header out of 0-3032 ms. The left chat column also has a masked `login_email: ••••` line. In bug-sync it also contains an example address in an exploration message. Crop to the right panel for every bug beat.

### 5h. Account context (Insights take and digest) [S5][S7]
- 50 projects · **711** total bugs · 389 open · 29% resolution rate · 1151 journeys · 89 explorations.
- Severity: critical 4 (1%) · high 238 (33%) · medium 369 (52%) · low 100 (14%).
- **Discovery source:** Journey Testing **258 (36%)** · Polish Analysis **453 (64%)**.
- The Insights "Polish Bug Categories" chart lists Glitches, Network Performance, User Experience, Accessibility, Layout Shift, React Rendering, Seo.
- Electric Forest bug categories (digest): network-performance 33, journey 39, glitches 20, accessibility 26, user-experience 5, layout-shift 3 (sum 126). Scorecard: 126 bugs, 126 resolved, 160 journeys, 100%. "Resolved" counts 101 fixed + 24 invalid + 1 wontfix (digest), so never say "126 bugs fixed".
- "50 projects" is the Insights page figure. The digest's `projects_total` (20) is a different count, from the API listing. Use 50 if a project count goes on screen, since that is what the take shows.

---

## 6. Verified quotes

No people are quoted. These are vendor product copy, checked live on 2026-10-14 and safe to put on screen or narrate as the vendor's words:

1. "A Replay recording removes the reproduction step." (docs.replay.io, *How does time travel work?*, section "Why time travel?") [S1]
2. "Session Replay tools replay the DOM and Runtime Replay tools re-run the runtime" (same page, "Runtime Replay versus Session Replay") [S1]
3. "If anything user-visible happens in a different order, you have failed." (same page, "How Runtime Replay works") [S1]
4. "Functional testing asks "does the journey work?"; polish passes ask "is it slow, inaccessible, visually broken, or unsafe?"" (docs.replay.io, *Polish passes*, intro) [S2]
5. "It reports what your app did, not what the code says it should do." (replay.io home, FAQ "How does Replay QA find the root cause of an issue?") [S3]
6. "every DOM mutation, every network call, every JavaScript frame" (replay.io/how-it-works, 03 Testing) [S4]
7. On-screen product copy, quoted from the takes: bug titles above; "Markdown for Claude Code, Cursor, and other coding agents" (bug-sync rootcause mark) [S6].

**Do not use** "monitoring tells you production is unhealthy, Replay QA tells you why a specific change broke". It is real (replay.io FAQ [S3]) but it compares the product to named competitors (FullStory, LogRocket, Datadog). The brief forbids imitating other brands, and the line pulls attention away from the product.

---

## 7. Debates and controversies

- **"Suggested fix" vs "no code patch".** replay.io says each report carries "a suggested fix, ready to paste directly into your coding agent" [S4], and that Replay QA does not fix bugs itself: "applying it stays with your team" [S3]. The docs say "Replay QA does not generate a code patch; a developer or coding agent applies the fix from the root cause" [S8]. These are compatible: it suggests and does not apply. The film should say "root cause" (and at most "suggested fix"). It must never say "Replay QA fixes the bug".
- **Fixed-bug regression behaviour (docs disagree with each other).** *Concepts* says that after you mark a bug fixed, "if the problem is still there the bug reopens" [S9]. *Bug reports* says "A fixed bug stays fixed: if the problem comes back, Replay QA files it as a new bug" [S8]. Avoid the word "reopens". Say "it reruns the journey to confirm the fix".
- **Which tests get time-travel analysis.** how-it-works says "For all tests that fail, our agents time-travel through the recordings" [S4]. The polish-passes docs say passes review *every* journey run's recording [S2]. All four featured bugs are polish findings from runs where the journey itself worked. Say "every run is a recording, and every recording gets reviewed", not "failing tests get analyzed".
- **Is DOM-only replay really blind to these bugs?** Partly contested, so keep the claim narrow. Wasted renders that produce no DOM mutations leave nothing in a DOM recording (inference from [S1] + [S5]). But many session-replay and monitoring tools *do* capture network logs; replay.io's own FAQ says such tools "capture session replay, logs, and traces, which is genuinely useful" [S3]. The defensible claim for the network bugs is that the runtime recording explains the *why*: the never-updated checkpoint variable, the waitMs default of 10000 sitting unused in the bundle, the existing SSE transport. A network log alone shows only the what.

---

## 8. Misconceptions to avoid

1. **"Every 800 ms."** Wrong. Say "about 800 ms" or "every ~800 ms" (title "~800ms", body "~700-900ms") [S5].
2. **"7 polish passes enabled."** Not what the recorded settings take shows ("4 enabled"); see the box at the top. The docs list 10 passes [S2]. The PR 4650 project had 8 on, plus sightmap [S6].
3. **"The reading-room app."** reading-room is a repository (`maple/reading-room`) inside the Electric Forest project's app, tested on localhost [S5][S6].
4. **Conflating 258s.** The 258 re-fetches (one bug) and the 258 journey-testing bugs (account-wide) are unrelated.
5. **"25 of 27 fibers = 25/27 of the time wasted."** No: 25 of 27 fibers were wasted, but that is **50%** of render time (~34 ms of 67 ms) [S5].
6. **"The 56 ms bug is wasted renders."** No: only 2.3 ms (4.1%) was wasted. It is a big, productive, all-at-once re-render [S5].
7. **"Frame budget is 16 ms / 10 ms."** The bug reports use **16.7 ms** (1000/60). web.dev's RAIL gives "16 ms per frame", leaving an app "about 10 ms" [S10]. Use 16.7 ms to match the product. **CONTESTED, do not use: "these are long tasks".** MDN defines a long task as uninterrupted main-thread work of 50 ms or more [S11]. The 56 ms figure, though, is 38.6 ms of commit phase plus 19.4 ms of passive effects, and React normally flushes passive effects in a later task, so it is not shown to be one uninterrupted task. The 67 ms report gives no phase split. Comparing either to the 16.7 ms frame budget, as the reports do, is safe.
8. **"T=383.2s on the player."** The 67 ms bug's player reads 0:51 in the take, while the chronology stamps 6:20.8. Do not draw a scrubber that lands at 6:23 on that player. Keep any time-travel overlay generic, or label it with the report's own "T=383.2s".
9. **"The 258 loop ran for 160 s / the recording is 160 s."** The requests span 15292 → 175614 ms (~160 s). The recording player reads 2:56. If needed, say "for the whole session".
10. **"Replay QA fixed these bugs."** The status *fixed* is set by the team (or by Replay QA when a PR merges) [S8]. Replay QA reports, and people or coding agents fix.
11. **"Recording is a video."** It records runtime inputs, and the video is computed at replay time: "the video created the first time we replay the recording is often larger than the recording itself!" [S1].
12. **Open vs fixed:** the two React bugs (67 ms, 56 ms) are **open**. The two network bugs (258, 105) are **fixed**. Do not show a "fixed" stamp on the React bugs.

---

## 9. Curiosity hooks (true and sourced)

1. **Replay QA caught a performance bug in Replay QA.** The 67 ms commit is on "the Replay QA Projects page", found while testing a PR 4650 preview of the product itself, and it is still open [S5][S6].
2. **25 of 27 renders changed nothing.** They produced zero DOM mutations, so a DOM-only replay would have nothing to show for them. Only the runtime recording keeps that wasted work [S5][S1].
3. **A bookmark that never moved.** For about 160 seconds the client asked for "everything since -1", 258 times, while the user clicked twice [S5][S6].
4. **The fix was already in the bundle.** The shared URL builder defaults `waitMs` to 10000, and an SSE transport exists. The board poll just passed 500 [S5].
5. **The bug report corrected itself.** Its first guess ("per keystroke") was overturned by measurement: "the measured driver is the live-poll loop, not typing" [S5].
6. **105 identical answers:** every response was `events:[]` with the same all-zeros checkpoint [S5].
7. **Recording is nearly free:** "99.99% of compute is deterministic", about 1 Mb/s, about 3% overhead [S1].
8. **Replay is cheating, and admits it.** You cannot replay faster than real time ("we cheat"), so a debugging session talks to "potentially hundreds" of forked and snapshotted browser processes, and "there's never a point more than 100ms away from a browser process" [S1]. (Fact-check: the source says "potentially hundreds", not "hundreds".)
9. **64% of this account's bugs were never functional failures.** 453 of 711 came from polish analysis of recordings [S7].

---

## 10. Visual and dramatic details (for the art department; promo look)

- **Settings:** the real bug detail pages, cropped to the right panel. The colour chips "Open/Fixed · Medium · React Rendering/Network Performance · Local" are perfect zoom targets. Large black title type on white. The **dark Replay player panel** below the title (empty "Loading replay…" in bug-react; player with 0:00 / 2:56 in bug-sync) is the natural slot for a `brand`-haze time-travel overlay: a scrubber running backwards, frames stepping back.
- **The 67 ms beat:** draw a 60 fps ruler of 16.7 ms frame slots; one bar 67 ms long swallows four slots (4 dropped frames). Inside it, 27 small fiber ticks, 25 greyed (wasted) and 2 lit. Coral ✕ for dropped frames; never green.
- **The 258 beat:** a stack of identical request pills, each stamped `checkpoint=-1`, falling back-to-back at ~0.6 s cadence, with a counter rolling to 258. The cursor sits still (2 clicks in the whole session).
- **The ~800 ms beat (if used):** a metronome-like pulse labelled "~800 ms", every response pill reading `events: []`. A second, slow pulse labelled `waitMs=10000` shows what it should have been.
- **Colour:** Replay red-pink `#f41c52` for the bug moment; green `#1f9d63` only on the "Fixed" chip of the network bugs.
- **Hide:** credit meter, chat column contents (masked login line, example email in bug-sync chat), Admin chip. Crop to the bug panel.

---

## 11. Sources

1. [S1] Replay docs, "How does time travel work?": https://docs.replay.io/reference/time-travel/how-does-time-travel-work (local copy: research/sources/reference_time-travel_how-does-time-travel-work.txt; live text matched 2026-10-14)
2. [S2] Replay docs, "Polish passes": https://docs.replay.io/reference/replay-qa/polish-passes (local: research/sources/reference_replay-qa_polish-passes.txt; live matched 2026-10-14)
3. [S3] replay.io home page, including FAQ answers (read live in Chrome, 2026-10-14): https://www.replay.io/
4. [S4] replay.io, "How Replay QA works": https://www.replay.io/how-it-works
5. [S5] research/sources/account-digest.json (featured_bugs, insights, settings_page_facts; redacted account data, read 2026-10-14). Origin of the hand-typed settings line: tools/promo/account-digest.mjs line 36
6. [S6] capture/clean/bug-react.json and capture/clean/bug-sync.json (marks; text rebuilt from rrweb events; contact sheets rendered with tools/promo/rr-sheet.mjs at 3100/8723/12008 ms and 1603/5402/8154 ms). Also capture/takes/bug-react.mjs, capture/takes/bug-sync.mjs
7. [S7] capture/clean/insights.json (Insights page as recorded: 711 / 389 / 29% / 1151 / 89; severity; discovery source 258 · 36% / 453 · 64%; project scorecard)
8. [S8] Replay docs, "Bug reports": https://docs.replay.io/reference/replay-qa/bug-reports (local: research/sources/reference_replay-qa_bug-reports.txt)
9. [S9] Replay docs, "How Replay QA models your app": https://docs.replay.io/basics/replay-qa/concepts (local: research/sources/basics_replay-qa_concepts.txt)
10. [S10] web.dev, "Measure performance with the RAIL model": https://web.dev/articles/rail
11. [S11] MDN, PerformanceLongTaskTiming: https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming
12. [S12] react.dev, `memo` reference ("React normally re-renders a component whenever its parent re-renders."): https://react.dev/reference/react/memo
13. [S13] capture/clean/schedule.json (settings take: "Polish passes Network Performance, Layout Shift, Glitches, User Experience · 4 enabled" at marks 2226 / 8808 / 11458 ms)
14. look.md and brief.md (film direction; not factual sources)

---

## Fact-check log (adversarial pass, 2026-10-14)

Method: I read the local sources again (time-travel, polish-passes, bug-reports and concepts docs; account-digest.json; tools/promo/account-digest.mjs). I replayed the cleaned takes frame by frame with `tools/promo/rr-sheet.mjs` (bug-react at 0/1956/3032/3033/3100/3300/3483/8723/12008 ms; bug-sync at 0/1603/5402/8154; schedule at 2226; insights at 2926/6905) and pulled text and `datetime` attributes out of the rrweb events. I re-read these pages live in the user's Chrome: docs.replay.io (time travel, polish passes), replay.io (home FAQ JSON, how-it-works), react.dev `memo`, MDN PerformanceLongTaskTiming and web.dev RAIL. I did not read capture/api.

**Confirmed (19):** the vendor quotes and figures in S1 (reproduction step, Session vs Runtime Replay, 99.99%, about a Mb per second, about 3% vs 10% or more, the "different order" line, 100 ms, "as many times as needed"); the polish-pass list (10), the pipeline and the Network / React rendering wording, all live [S2]; every number in the four featured bugs, matched to the digest [S5] and, for 67 ms and 258, to the on-screen cards; Electric Forest = 127.0.0.1:61787 with the Local chip, maple/reading-room as a seeded repository (chat text in bug-sync), and a localhost target reached "through the reverse proxy" [S9]; PR 4650 Preview project, 71 journeys, 68 bugs filed, 8 passes plus sightmap (chat in bug-react); the bug-react actual/rootcause marks and all bug-sync marks; Insights 711 / 389 / 29% / 1151 / 89, discovery source 258 · 36% and 453 · 64%; schedule take "4 enabled" vs the hand-typed "7 enabled" (account-digest.mjs line 36); how-it-works "every DOM mutation, every network call, every JavaScript frame" and "behaves identically every time it's replayed"; the home FAQ "It reports what your app did, not what the code says it should do." and "applying it stays with your team"; the 16 ms/frame figure (web.dev); react.dev "React normally re-renders a component whenever its parent re-renders."

**Changes:**
1. **bug-react report mark (corrected).** At exactly 3032 ms the panel is a loading skeleton. Content arrives at 3033 ms; the dark "Loading replay…" player lasts only until about 3217 ms, then turns white with "--:--" controls. Source: rr-sheet frames 3032/3033/3300; rrweb mutations at 3032 and 3217 ms.
2. **56 ms bug project (corrected).** It was marked "unverified inference". It is in Electric Forest PR 4650 Preview: its row is in that project's Bugs list in the bug-react take (about 1956 ms), and account-digest.mjs line 46 picks it from the PR-4650 bug set. Whether it came from the same run as the 67 ms bug is still unverified.
3. **67 ms bug ↔ "71 journeys / 68 bugs" run (unverifiable).** The bug's source is "Test Run #run-muek"; nothing available ties that ID to the Initial Test Run card. The film may show the project chat line, but must not say the bug came from that run.
4. **"Both commits are long tasks" (contested → do not use).** MDN defines a long task as uninterrupted work of 50 ms or more. The 56 ms includes 19.4 ms of passive effects, which React usually flushes in a separate task, and the 67 ms report has no phase split.
5. **Curiosity hook 8 (corrected).** "hundreds of forked browser processes" → "potentially hundreds" (live docs text).
6. **Timeline, Electric Forest chat range (corrected).** The bug-sync chat timestamps span 2026-08-01T19:47Z to 2026-09-30T23:13Z, not 08-31 to 09-01.
7. **Redaction note (corrected).** The credit meter ("8807.5 of 500 credits") and Admin chip are visible in bug-react's header while the Bugs list shows (frame 1956 ms). Crop it out.
8. **bug-react start mark (corrected).** At 0 ms the frame is a blank shell; the Bugs list is up by about 1742-1956 ms.
9. **Electric Forest "126 resolved" (clarified).** That is 101 fixed + 24 invalid + 1 wontfix (digest), not 126 fixed. Also noted: Insights "50 projects" differs from the digest's `projects_total` 20.

The 7 corrections and 2 qualifications are also in research/factcheck/bugs-in-time.json.
