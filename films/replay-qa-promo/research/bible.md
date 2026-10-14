# Research bible: Replay QA promo (`replay-qa-promo`)

- **Form:** product promo (look "promo"), about 90 s, hard ceiling 100 s. Not a history documentary.
- **Era for every claim:** "product, as of 2026-10-14".
- **Built from:** `research/plan.json`, the six dossiers in `research/dossiers/` and their adversarial verdicts in `research/factcheck/`. Only fact-checked content is here. Where a fact-checker corrected a claim, the corrected form is used. Claims marked unverifiable are listed only as "do not say" items (section 10).
- **Claim ids** in square brackets (for example [LOOP-13]) point to `research/claims.json`. Verified quotes are in `research/quotes.json` (ids Q01 and up).
- **Source refs:** repo-relative paths are relative to `films/replay-qa-promo/` unless they start with `public/`, `tools/` or `apps/`. "Digest" means `research/sources/account-digest.json` (redacted facts from the requester's own account). "Take" means a cleaned rrweb recording in `capture/clean/<name>.json`. Mark times are milliseconds from the start of the cleaned take.
- **Redaction:** this file contains no credentials, tokens, login variables or e-mail addresses. The raw API dumps in `capture/api/` were not used. The account owner's name is not written here.

---

## 0. The five rules the script must not break

1. **Numbers are copied, never computed or rounded differently.** Each number below carries its claim id. Two traps:
   - "about 800 ms", never "800 ms" [TIME-12].
   - 258 is two unrelated numbers: the re-fetch count in one bug, and the account's journey-testing bug count. Never put them side by side [TIME-14].
2. **"50 projects" is an Insights figure, not the account size.** The live API reports 67 projects. Say "Insights: 50 projects · 1151 journeys · 89 explorations" with the screen in shot. Never say "in the account" or "across all projects" [LOOP-13]. Never use 20 [LOOP-14].
3. **Replay QA finds, explains and verifies. It does not write the patch.** Safe line: "root cause and a suggested fix; your agent writes the patch." Never say "Replay QA fixes your bugs" [PROOF-03].
4. **After a fix, say only "it reruns the journey to confirm".** The vendor's docs disagree on whether a failed fix reopens the bug or files a new one [PROOF-C1].
5. **The developer/critic beat is a depiction** of the documented fix-and-rerun loop. It is not a named product feature. Do not narrate the on-screen "judge" links as a critic of fixes [AGENT-15].

---

## 1. Master chronology

All dates are 2026. Times in the UI are local, at UTC-4 (EDT) [PROOF-16]. Product docs carry no publication dates, so most docs facts are state "as of 2026-10-14" rather than events.

| Date | Event | Claim | Source |
|---|---|---|---|
| May 13 to Jun 12 | The 17 oldest of the account's 67 projects are created. They fall outside the 50 projects the Insights page totals | [LOOP-13] | live count-only read of `GET /api/v1/projects?page_size=100` (2026-10-14), per `research/factcheck/explore-journeys-runs.json` |
| Jun 12 to Jun 16 | Card dates of 27 projects named "ExampleApps PR #6 … #11 - <app>", all pointed at Netlify deploy-preview URLs (9 on 6/12, 15 on 6/15, 3 on 6/16) | [CONT-16] | `capture/clean/projects.json` @ `filtered` 6306 ms |
| Jul 2 | Replay QA help article "What is Replay QA?" says a connected GitHub repository makes Replay QA "an always-on quality gate" | [CONT-22] | https://intercom.help/replay-builder/en/articles/15809468-what-is-replay-qa |
| Aug 1 (19:47Z) | Earliest timestamp in the Electric Forest project chat visible in the bug-sync take. The chat runs to Sep 30 (23:13Z) | [LOOP-20] | `capture/clean/bug-sync.json` (`datetime` attributes) |
| Aug 12 | "Reminders · CI": "Initial Test Run", Project default, **Failed**, 1 journey | [LOOP-12] | `capture/clean/runs.json` @ `list` 3668 ms |
| Aug 16 | "Reminders · CI": 12 runs in one day, including "PR #1" and "PR #3" runs (environment badges link to the pull requests) and a 12-journey Completed run with bugs 0/0/13/0 | [LOOP-12] | `capture/clean/runs.json` @ 3668 ms |
| Aug 30 to Aug 31 | Electric Forest explorations stop at a sign-in wall. The chat says "⚠️ I stopped exploring because the app requires a sign-in I couldn't complete, so signed-in areas couldn't be tested." | [LOOP-04] | `capture/clean/explore.json` @ 0 ms |
| Sep 1 | Electric Forest: an exploration stops at a seeded-data barrier ("⚠️ I stopped exploring because the app put up a barrier I could not get past.") | [LOOP-04] | `capture/clean/explore.json` @ 0 ms |
| Sep 1, 8, 15, 22, 29, Oct 6 (all Tuesdays) | Collaborative-ai-editor project: a batch of journey tasks starts at 3:00 AM each Tuesday. Visible rows per batch: 44, 33, 34, 34, 34, 34. No Oct 13 row | [CONT-03] | `capture/clean/schedule.json` @ `add-env` 11458 ms |
| Sep 4, 12:41 AM local (about 04:41Z) | Electric Forest chat: QA will not start new work because "the project has hit its bug limit": cap 100, 111 bugs filed, 65 still open. 12:42 AM: "Bug cap raised to 150" | [LOOP-18] | `capture/clean/bug-sync.json`; `capture/clean/explore.json` |
| Sep 4, 06:05:26Z | Network Performance pass files `bug-mtmjva2o-pah7`, the board live-poll bug (105 identical empty responses). Later set **fixed** | [TIME-12] | digest `featured_bugs.board_poll_105` |
| Sep 4, 06:16:47Z | Network Performance pass files `bug-mtmk9vtr-21c2`, the live-sync bug (258 re-fetches). The bug page shows "Discovered 1 month ago at 2:16 AM". Later set **fixed** | [TIME-11] | digest `featured_bugs.live_sync_258`; `capture/clean/bug-sync.json` |
| Sep 18 to Oct 1 | Replay runs a two-week "self-healing loop" pilot on its own repository: 152 PRs opened, 80 merged and verified, 18 of 124 bugs needed more than one attempt (vendor-reported) | [AGENT-11] | https://www.replay.io/blog/what-our-experimental-self-healing-software-loop-shipped-in-two-weeks |
| Sep 22 | Card date of "Reminders · CircleCI" | [CONT-15] | `capture/clean/projects.json` |
| Sep 23 (4:28 PM to 9:13 PM local) | Project "Electric Forest PR 4650 Preview" chat: "I explored the app and ran 71 journeys, and filed 68 bugs, 68 still open". Initial Test Run card: 71 / 71 journeys, 62 passed, 9 failed, 68 bugs | [TIME-19] | `capture/clean/bug-react.json` (chat column) |
| Sep 23, 21:45:27Z | `bug-muemtceb-we4e` filed: 56 ms navigation commit, 3 dropped frames (**open**, medium) | [TIME-10] | digest `featured_bugs.navigation_commit_56ms` |
| Sep 23, 21:56:06Z | `bug-muen719p-vdmh` filed: 67 ms React commit at T=383.2s, 4 dropped frames (**open**, medium). The bug page shows "Discovered 21 days ago at 5:56 PM" | [TIME-08] | digest `featured_bugs.react_commit_67ms`; `capture/clean/bug-react.json` |
| Sep 30 | Electric Forest round "Main page load and broad site navigation sweep", Local, Completed, 131 journeys finished. Run card: Passed 1, Failed 0, Bugs found 0 | [LOOP-17] | `capture/clean/explore.json` @ 0 ms |
| Oct 6 | Replay blog post on the self-healing loop is published | [AGENT-11] | Replay blog (URL above) |
| Oct 14 | Takes captured with Playwright (signed-in profile) and cleaned; digest generated; Insights shows 50 / 711 / 389 open / 29% / 1151 / 89 | [PROOF-08] | `capture/clean/*.json`; digest; https://qa.replay.io/insights |
| Oct 14 | The live API reports 67 projects (52 active, 15 paused) | [LOOP-13] | `research/factcheck/explore-journeys-runs.json` |
| Oct 14 | Docs pages re-checked live: wording identical to `research/sources/` copies | [SET-01] | https://docs.replay.io/ |

---

## 2. "Eras" (adapted for a promo: the product's argument)

There is one era: **product, as of 2026-10-14**. The history template's "belief of the age" becomes the assumption the product argues against. It is the vendor's framing, so present it as Replay's point of view, not as a fact about the industry.

### 2a. The assumption: "E2E tests are something your team writes, hosts and remembers to run"
- **Who frames it:** Replay, on its home page: "Most QA tooling starts with flows your team defines. Replay QA begins by exploring the application and identifying flows worth verifying." [LOOP-02] (https://www.replay.io/). The docs say: "You do not need an existing test suite or a list of reproduction steps." [SET-08]
- **Nuance (the vendor's own):** the FAQ says Replay QA "complements an existing test suite but does not require one" [SET-08]. The film must not say it replaces Playwright or Cypress suites.
- **Limit of "no configuration":** the docs say "Replay QA works without configuration: give it a URL and it explores." Result quality still depends on guidance and access. Login walls, invitations, paywalls, CAPTCHAs and rate limits pause the work until a person answers in the chat [SET-09]. Fair line: "Start from one URL. Add guidance to sharpen it."

### 2b. The assumption: "If the test passes and the screenshot looks right, the page is fine"
- **Who frames it:** Replay's time-travel docs. They describe debugging as adding a log, refreshing and hoping the bug happens again. Timing bugs "depend on network timing, race conditions, and state that is gone by the time you notice the problem" [TIME-05].
- **Counter-position:** record the runtime once and replay it deterministically. "A Replay recording removes the reproduction step." [TIME-05]
- **Fair other side (vendor's own words):** Replay's FAQ calls monitoring and session-replay tools "genuinely useful". It distinguishes them by timing (production, after users are affected) and depth (Replay records "the actual JavaScript execution during testing, before the code ships") [TIME-C2]. Do not say session replay is useless or that it cannot see network traffic.

### 2c. The assumption: "A bug report is a claim you must reproduce by hand before you trust it"
- **Who frames it:** Replay's home page. An engineer "loses an afternoon reproducing it, and the fix itself takes twenty minutes." [PROOF-15]
- **Counter-position:** "Every bug Replay QA files is backed by a Replay recording of the run that found it." [PROOF-01]
- **Balance (vendor's own):** the same API spec tells agents to "Verify the report against its evidence and the source before applying a fix." [AGENT-03] The film should not imply blind trust.

### 2d. The assumption: "Writing code is the bottleneck"
- **Who frames it:** Replay's home page: "Writing code got faster. Verifying it didn't, and it's still the part your team does by hand." [AGENT-14] The Replay blog adds "Generation was never the hard part." [AGENT-11]
- **Status:** vendor positioning, not an independent finding. It may be echoed as the brand's voice.

---

## 3. People index

No real person is depicted, named in narration, or imitated by the narrator.

| Who | Role | Treatment |
|---|---|---|
| The account owner | Requester; their display name appears in the app sidebar footer, and one project URL contains their name | Crop or blur the sidebar footer in close-ups. Do not zoom on the collaborative-ai-editor project URL. Never show an e-mail address |
| Thomas Daly | By-line on the Replay blog post of 2026-10-06 | Source only. Do not depict or name on screen |
| Chris Kelly | Quoted inside that blog post (title given there as Head of Developer Experience at Augment) | His quote is UNVERIFIED at its original source. Do not use it |
| "Developer" agent | Fictional, unbranded character for the subtle beat | Neutral rounded card with a simple glyph, labelled "developer" (or "agent"). Promo haze palette. No logo, mascot, colour scheme or UI chrome of any real product |
| "Critic" agent | Fictional, unbranded character for the subtle beat | Same visual family as the developer, labelled "critic" (or "QA"). Answers "✕ not yet" or "✓ good" |
| The setup chat voice | The New Project page speaks in the first person ("I'll walk you through the rest") | This is the product's agent, not a person |
| Narrator | One warm, confident, mid-life voice | Must not imitate any real person |

---

## 4. Machines and apparatus (for the art department)

### 4a. Replay Browser (the recorder)
- A Chromium-based browser in which every journey runs. "Each journey run produces a Replay recording." [LOOP-07]
- It records **the inputs to the runtime**: the results of low-level operating-system library calls (libc functions such as `mmap`, `read`, `open`). A small inline-assembly trampoline intercepts these calls, and replay feeds back the same results [TIME-02].
- Vendor figures (attribute as "Replay says"): "99.99% of compute is deterministic"; about "a Mb per second" of recorded data; "about 3% of overhead" against "10% or more" for most instrumentation [TIME-02].
- Inspection uses forked and snapshotted browser processes: a session talks to "potentially hundreds" of them, and "there's never a point more than 100ms away from a browser process" [TIME-03].
- The recording is not a video. The docs note that "the video created the first time we replay the recording is often larger than the recording itself!" [TIME-04]
- **Visual idea:** a thin ribbon of tiny input ticks (clock, network bytes, file reads) feeding a browser frame; on replay, the same ribbon runs back through and the page rebuilds exactly.

### 4b. The managed reverse proxy and the CI tunnel
- For an app on a laptop or private network: `npx --yes replayqa proxy …` opens an outbound, authenticated tunnel. Replay QA reaches the app "without deploying it" [SET-06].
- For a build that exists only inside CI (GitHub Actions or CircleCI): `replayqa proxy --ci --json` opens the tunnel and waits for `{"event":"heartbeat","ready":true}`. `replayqa ci` then starts a PR-linked run [CONT-13].
- A laptop tunnel becomes the project's **Local** environment, and a CI tunnel becomes its **Preview** environment [CONT-14].
- **Visual idea:** a line phoning out from a small box to the Replay cloud, held open while browsers reach back in, then hung up when the run ends.

### 4c. The polish-pass pipeline
- After each journey run, every enabled pass reviews that run's recording. It collects candidates, drops duplicates of existing bugs, confirms each remaining one, then files it [TIME-06].
- **Visual idea:** one recording tile passing under a row of lenses ("Network performance", "React rendering", …). Most candidates fall away; one becomes a bug card.

### 4d. The screens in the takes (all 1440 × 900)

| Take | Length | Marks (ms) | What is on screen | Claim |
|---|---|---|---|---|
| `new-project` | 5537 | typing 1100 · typed 2966 · hover-start 4737 · end 5537 | Light card: eyebrow "NEW PROJECT", heading "Set up QA for your app", one line of sub-copy, a chat input whose send button reads "Start setup". The URL `https://staging.your-app.dev` types in. The cursor hovers "Start setup" and never clicks | [SET-01], [SET-02], [SET-04] |
| `explore` | 11751 | start 0 · play 2821 · end 11751 | Electric Forest overview, "Exploration" card "1 / 9". Click on play at 2331 to 2408 ms. Timer 0:00 at play, 0:01 at 3064, 0:13 at 11064, of 10:28. Agent subtitle added at 6868 ms. **The player's picture area is empty** (rr-block at 0 × 0) | [LOOP-10] |
| `runs` | 6573 | start 0 · list 3668 · scrolled 5923 · end 6573 | "Reminders · CI" Test Runs tab: 13 rows, columns Created / Description / Environment / Status / Bugs / Journeys; green Completed, red Failed, grey Cancelled pills; blue "PR #3" / "PR #1" badges. The scroll moves only 27.5 px, so it reveals nothing new | [LOOP-12] |
| `projects` | 6956 | start 0 · scrolled 3348 · filtered 6306 · end 6956 | Projects grid of 50 cards. "PR #" is typed into the sidebar filter (5700 to 6186 ms); at 6306 ms the sidebar shows 27 "ExampleApps PR #N - …" projects | [CONT-16] |
| `schedule` | 12961 | start 0 · polish 2226 · schedule 8808 · add-env 11458 · end 12961 | Settings page. Polish row "4 enabled". Green chip "Tue at 3:00 AM · America/New_York" beside a green "Production" badge. "Add environment · Add production, staging, development, preview, or local configuration." Status "Active · Running test loops automatically." "5 max" concurrency | [CONT-02], [CONT-19], [CONT-20] |
| `insights` | 7555 | start 0 · stats 2926 · severity 6905 · end 7555 | Six tiles: 50 Projects · 711 Total Bugs · 389 open · 29 % Resolution Rate · 1151 Journeys · 89 Explorations. Then severity and discovery-source cards, charts, Project Scorecard | [PROOF-08], [PROOF-13] |
| `bug-react` | 13692 | open/report 3032 · actual 8723 · rootcause 12008 · end 13692 | The 67 ms bug page. **Seek 3040 to 3200 ms** for chips, title and the dark "Loading replay…" player (3032 is a grey skeleton; from about 3217 the player is white with "--:--"). Later: Actual / Expected, Root Cause, Evidence, Chronology 6:20.8, causal chain | [TIME-15] |
| `bug-sync` | 8804 | report 1603 · actual 5402 · rootcause 8154 · end 8804 | The 258 bug page. Chips "Fixed · Medium · Network Performance · Local". Player 0:00 / 2:56. Three links "Requirements judge", "Evidence judge", "Acceptance judge". Later: Actual / Expected, Root Cause, Chronology 0:15.2, three-step causal chain, "Markdown for Claude Code, Cursor, and other coding agents" | [TIME-16], [PROOF-14] |

**Crop rules for every take:**
- Crop out the credit meter. In `bug-react` it reads "8807.5 of 500 credits" with an Admin chip from about 1742 to 3032 ms [TIME-15].
- Crop out the left chat column in bug and runs shots. It holds a masked login line, an example e-mail address and a "Project paused — your account is out of credits." thread [CONT-19].
- Crop or blur the sidebar footer (owner's display name).

---

## 5. Technical primers (one per deep dive)

### 5.1 Point it at your app [SET-*]
- **The screen.** The signed-in home page is the New Project page: "Set up QA for your app" / "Enter your app's URL and I'll walk you through the rest in a quick chat." The input placeholder is `https://your-app.com`. **"Start setup" is the input's own send button** (accessible name "Send message"), disabled until the first keystroke. A separate callout reads "Want your coding agent to handle it?" / "Get the prompt" [SET-01] [SET-02] [SET-03].
- **The typed URL in the take** is `https://staging.your-app.dev`, an illustrative placeholder. It is not an app Replay QA tested. Keystrokes run from 1103 to 2908 ms (26 intervals, mean about 69 ms, about 14.4 characters per second). The take script's nominal 13 cps is not what was recorded [SET-04].
- **Three ways in** [SET-05]:
  1. a public URL ("without a tunnel or CI configuration");
  2. localhost or a private network, through the managed reverse proxy (it also reaches hosts available through your VPN or private DNS);
  3. a build inside CI, through the CLI tunnel (GitHub Actions, CircleCI).
- **What a project is:** "One application under test." A target URL plus guidance: instructions, an optional design document, test logins, enabled polish passes, and "two caps, a credit budget and a bug limit". A project is active or paused; "A paused project schedules nothing." [SET-07]
- **Optional extras:**
  - GitHub is optional [SET-13].
  - Replay QA can sign up for its own account where the app allows it, using a project e-mail inbox to complete verification codes [SET-10].
  - Test logins are stored as project variables "referenced by name, so they do not appear in journey steps or bug reports" [SET-11].
  - The design document filters false positives: "Replay QA judges findings against it" [SET-12].
- **Settings by conversation:** "Edit settings and environment schedules here, or ask QA in the chat — both make the same change." [SET-14]
- **Intuition:** setup is a conversation, not a form. You give it an address and a sentence about what matters.

### 5.2 The managed loop: explore → journeys → runs → recordings → bugs [LOOP-*]
- **The loop (docs wording):** "Explore the app to get journeys. Run the journeys to get recordings." Investigate recordings to get bugs; fix and mark fixed so the journeys run again; explore again when the app grows. With GitHub connected, every new build starts the loop over on its own [LOOP-01].
- **Step counts:** the docs list five steps; the home page lists three ("Explore", "Test & Record", "Investigate & Report"). Pick one set per graphic [LOOP-02].
- **Exploration:** an AI agent drives the app in a real browser from the target URL and produces journeys. Later explorations add coverage and never replace journeys. It ends **blocked** when it cannot get past a login, an invitation, a paywall or an app that won't load, and it says what it needs in the chat [LOOP-03] [LOOP-04].
- **Journey:** one named user flow. It "starts as a description"; once Replay QA is confident about the flow, "it records concrete steps so later runs are faster and more repeatable". The API calls a description-only journey "unstepped (agent-driven)". Each journey has a Start URL and a Session setting (saved signed-in state or a clean browser). Every edit creates a new version and, if the project is active, schedules a run [LOOP-05] [LOOP-06].
- **Test run:** "One round of executing journeys in Replay Browser. Each journey run produces a Replay recording." A failed step is investigated in the recording before any bug is filed, and a run can recover from a broken step [LOOP-07].
  - End states: passed, found bugs, or blocked/incomplete for reasons outside the app.
  - On-screen status pills: Completed, Failed, Cancelled, Blocked [LOOP-08].
  - Cancelling keeps history [LOOP-09].
- **Two kinds of replay (do not conflate):** the overview's exploration player renders rrweb DOM events plus the agent's subtitles. Journey runs produce Replay **runtime** recordings [LOOP-11].
- **Account proof (Insights figures, exact):** 50 projects · 1151 journeys · 89 explorations [LOOP-13]. Electric Forest, context only: 160 journeys, 9 explorations, "Test runs 25" on its overview [LOOP-16].

### 5.3 Continuous by default: schedules, environments and every pull request (deep dive) [CONT-*]
- **Environments and schedules.**
  - Each environment is a URL plus a schedule. Five kinds: production, staging, development, preview, local [CONT-01].
  - The captured project's Production environment runs "Tue at 3:00 AM · America/New_York" [CONT-02].
  - It really fires. Six consecutive Tuesdays, Sep 1 to Oct 6, each batch starting at 3:00 AM, about 34 journey tasks per Tuesday run (33 to 44 visible rows) [CONT-03].
  - The vendor offers "daily or weekly scheduled runs in project settings" [CONT-04].
  - Intuition: an environment is an address plus an alarm clock.
- **Main branch (every deploy).** Three modes [CONT-06]:
  - **None:** no automatic testing.
  - **Detect main branch deployments:** after each push, QA polls a deployment URL until the deployed app changes, then tests it. This is the API default.
  - **Listen to GitHub events:** QA tests when GitHub reports a deployment of the default branch, which Vercel and Netlify already do.
  - Main-branch rounds may create, update or remove journeys [CONT-12].
- **Pull requests (every PR).**
  - With PR testing on, "Each pull request revision is tested against its preview deployment, and the results are posted back to the pull request." It is opt-in (API default `none`) [CONT-07].
  - Results: one comment edited in place, plus a "Replay QA" check on the head commit [CONT-08].
  - "Another push supersedes the running round. Closing the pull request cancels it." Drafts are ignored until ready for review [CONT-09].
  - PR rounds may add journeys for the change but "do not modify the project's existing journeys" [CONT-12].
  - Preview URL discovery, first match wins [CONT-10]:
    1. a deployment status;
    2. a commit status;
    3. a PR comment from a bot, owner, member or collaborator;
    4. otherwise polling "every minute at first, then every 5 minutes, for about 2 hours".
  - "Production deploys of the same commit are never used for a PR." [CONT-10]
  - A PR cannot exempt itself: `ignorePaths` is read from the base branch, and QA fails open at 3000 or more changed files [CONT-11].
- **A build that exists only in CI** [CONT-13]:
  1. The app runs on `127.0.0.1:3000` inside the runner.
  2. `replayqa proxy --ci --json` opens the tunnel and waits for the heartbeat.
  3. `replayqa ci` "replaces any older in-flight run for the same pull request and creates a PR-linked test run for the current commit".
  4. Status is polled every 15 seconds until terminal.
  - The docs pin CLI 0.2.4 and set a 1-hour run timeout and a 75-minute job timeout.
  - Account proof: "Reminders · CI" shows "Replay QA CI marker: pr-3", and its Test Runs table carries PR #1 and PR #3 environment badges [CONT-15] [LOOP-12].
- **Per-PR projects in this account:** typing "PR #" in the sidebar filter leaves 27 projects named "ExampleApps PR #6 … #11 - <app>", all on Netlify deploy-preview URLs [CONT-16]. How they were created is UNVERIFIED. Present them as "projects pointed at PR previews" and do not claim automation.
- **Where bugs go:** GitHub Issues, Linear or Jira, each with "the full bug report as Markdown and a link back". A rediscovered bug does not create a new issue [CONT-17]. "GitHub is the only supported repository host. GitLab and Bitbucket are not supported." [CONT-18]
- **What "fully managed" means in the product's words** [CONT-19]:
  - Project status "Active", "Running test loops automatically."
  - Budget: "Credits QA may spend before the project pauses."
  - Processing concurrency: "Containers running QA at once." "5 max".
  - The project pauses itself at its budget or when the account is out of credits, and says so in the chat. Replay runs the containers, browsers and recordings; only the optional CI tunnel runs in the customer's runner.
- **The kinetic line "Every deploy. Every PR. Every night."** Each part is supported as a capability ([CONT-06], [CONT-07], [CONT-04]). The account's schedule, however, is **weekly**. Do not put "Every night" over the "Tue at 3:00 AM" chip. Fully literal alternatives: "Every deploy. Every PR. On a schedule." or "… Every Tuesday, 3 AM."

### 5.4 Bugs that only exist in time (deep dive) [TIME-*]
- **Why time matters.** A screenshot shows a page that looks fine. A log line shows one request, and that request is fine. The bug is the rhythm: how long something held the main thread, how often it fired, and why it never stopped.
- **Runtime Replay vs Session Replay.** "Session Replay tools replay the DOM and Runtime Replay tools re-run the runtime so that you can inspect the session with browser DevTools" [TIME-01].
  - Replay Browser "records the inputs to the runtime, so replaying the recording re-runs exactly the same execution" [LOOP-19].
  - The determinism contract: "If anything user-visible happens in a different order, you have failed." [TIME-01]
  - At replay time an agent can pause at any point, evaluate expressions and measure [TIME-04].
  - The vendor's line: "A Replay recording removes the reproduction step." [TIME-05]
- **Inference (labelled as ours, grounded):** in the 67 ms bug, 25 of the 27 fibers React rendered produced no DOM mutations. A recording of DOM changes has nothing to show for them. The waste lives in JavaScript execution, which only a runtime recording keeps [TIME-17]. For the network bugs, the claim is narrower. Many tools capture network logs. The runtime recording adds the *why*: the never-advancing checkpoint, the unused 10000 ms default, the existing SSE transport [TIME-C2].
- **Polish passes** [TIME-06] [TIME-07]:
  - Ten exist: Network performance, React rendering, Layout shift, Accessibility, Glitches, User experience, SEO, UI details, Security, Sightmap.
  - "Functional testing asks "does the journey work?"; polish passes ask "is it slow, inaccessible, visually broken, or unsafe?""
  - Network performance reports "Slow requests, large payloads, and waterfall issues".
  - React rendering reports "Unnecessary re-renders and performance bottlenecks in React apps". It "only reports on React applications", and source maps improve what it can name.
- **Frame budget:** the bug reports use **16.7 ms** (1000 / 60). Compare commits to that. Do **not** call them "long tasks" [TIME-18].

**The four featured bugs (copy every number exactly)**

| | 67 ms commit | 56 ms navigation | 258 re-fetches | ~800 ms board poll |
|---|---|---|---|---|
| id | bug-muen719p-vdmh | bug-muemtceb-we4e | bug-mtmk9vtr-21c2 | bug-mtmjva2o-pah7 |
| status · severity | **open** · medium | **open** · medium | **fixed** · medium | **fixed** · low |
| pass | React Rendering | React Rendering | Network Performance | Network Performance |
| project | Electric Forest PR 4650 Preview (a PR preview of Replay QA itself) | Electric Forest PR 4650 Preview | Electric Forest (Local, through the reverse proxy) | Electric Forest (Local) |
| take | `bug-react` | none (data only) | `bug-sync` | none (data only) |
| claim | [TIME-08] [TIME-09] | [TIME-10] | [TIME-11] | [TIME-12] |

1. **67 ms React commit** [TIME-08] [TIME-09].
   - Title (exact): "67ms React commit at T=383.2s drops 4 frames on the Projects page: RTK-Query updates re-render Projects and SidebarProjectList wholesale, wasting 34ms re-rendering memo-less react-router Link components".
   - It is on **Replay QA's own Projects page**, so Replay QA caught a performance bug in Replay QA.
   - Numbers:
     - commit 67 ms (67.32) at T=383.2s;
     - 27 fibers rendered, 25 wasted (no DOM mutations);
     - waste 50.0%, about 34 ms (33.66);
     - 4 dropped frames against the 16.7 ms budget;
     - cascades: Projects, 19 fibers, 22.8 ms; SidebarProjectList, 6 fibers, 10.9 ms;
     - worst offender: react-router `Link`, 4 wasted renders, 19.0 ms.
   - The trigger is a background data refresh while the page is idle, with no user action.
   - "25 of 27 fibers" is **not** 25/27 of the time. It is half the time.
   - Do not draw a scrubber at 6:23 on this bug's player: the take's player reads 0:51.
2. **56 ms navigation commit** [TIME-10].
   - Title (exact): "Click on project card triggers 56ms navigation commit (86-component re-render from BrowserRouter) that drops 3 frames".
   - 87 fibers in 55.9 ms ("56ms"); 3 dropped frames; a state update in `BrowserRouter` cascaded to 86 descendants, 5 levels deep.
   - It is **not** a waste bug: only 2.3 ms (4.1%) was wasted. It is "too much at once".
   - Quote "56 ms" only. The report's phase split (38.6 + 19.4) does not add up to 55.9.
3. **258 re-fetches, checkpoint stuck at -1** [TIME-11].
   - Title (exact): "Live-sync loop re-fetches /api/repos/maple/reading-room/pulls 258 times with checkpoint never advancing past -1".
   - 258 sequential GETs (257 × HTTP 200, 1 no-response); each about 575 to 760 ms, average about 631 ms; requests from 15292 ms to 175614 ms (about 160 s).
   - The checkpoint was verified as -1 at requests #0 to #2 and again at #250 to #254.
   - Only 2 clicks and no keypresses: no user activity drives it.
   - Intuition: a "since when?" bookmark that never moves. Every round asks for everything since the beginning, so the server can never answer "nothing new".
4. **Board poll every ~800 ms** [TIME-12].
   - Title (exact): "Board live-poll re-requests /api/repos/maple/reading-room/board every ~800ms with waitMs=500 — 105 identical empty responses in ~70s".
   - 105 requests, all 200, each returning `events: []` with the same all-zeros checkpoint.
   - The server hold is `waitMs=500`, while the shared URL builder in the bundle defaults to 10000. An SSE transport already exists in the bundle.
   - Expected: "roughly one request per 10 seconds instead of ~75 per minute".
   - The report corrected its own first hypothesis: "the measured driver is the live-poll loop, not typing."
   - Do not compute 105 × 0.8 on screen.
- **"reading-room" is a repository** (`maple/reading-room`) seeded inside the Electric Forest app, not an app. Say "a pull-request list" or "an issue board" [TIME-13].
- **Account split:** polish analysis found **453 (64%)** of the 711 bugs on Insights; journey testing found **258 (36%)** [TIME-14].

### 5.5 A finding carries its proof [PROOF-*]
- "Every bug Replay QA files is backed by a Replay recording of the run that found it. The report is built from that recording, so each claim in it points at evidence you can inspect." [PROOF-01]
- **Report anatomy** (docs field → on-screen label) [PROOF-02]:
  - Title.
  - Severity → chip.
  - Steps to reproduce → "Chronology of Events", with timestamps and screenshots.
  - Expected / Actual → "Expected Behavior" / "Actual Behavior".
  - Root cause, with evidence (source, console, network, React state) → "Root Cause" plus "Evidence".
  - Causal chain → "Root Cause to Actual Behavior", numbered steps.
  - Recording → "View Full Recording".
  - Category → for example "Polish · Network Performance".
- **No patch:** "Replay QA does not generate a code patch; a developer or coding agent applies the fix from the root cause." The home page says a report includes "a suggested fix". The two are compatible: a prose suggestion, not a patch [PROOF-03].
- **Filed only when confirmed:** "A bug is only filed after Replay QA has confirmed it against the recording and checked that it is not a duplicate of an existing bug." [PROOF-04]
- **Severity:** critical, high, medium, low, with documented meanings, and severity can be changed after filing [PROOF-05].
- **Status:** `open`, `fixed`, `wontfix`, `invalid` (API enum). "Invalid" is kept so the same invalid claim is not filed again [PROOF-06].
- **Fix verification:** marking a bug fixed "automatically retries the affected journey to confirm the fix" [PROOF-07].
- **Insights totals (exact as Insights figures)** [PROOF-08]:
  - 711 total bugs · 389 open · 29% resolution rate.
  - Severity: critical 4 (1%) · high 238 (33%) · medium 369 (52%) · low 100 (14%). Sum 711.
  - Discovery: journey testing 258 (36%) · polish analysis 453 (64%). Sum 711.
- **The 29%** is 207 "Resolved" ÷ 711 from the Project Scorecard. It is not (711 − 389) ÷ 711 [PROOF-09].
- **Electric Forest:** 126 bugs; 101 fixed, 24 invalid, 1 won't fix; none open. Safe line: "126 bugs found, 101 fixed, none left open." Never "126 fixed" [PROOF-11].
- **Export** [PROOF-12]:
  - Markdown ("Markdown for Claude Code, Cursor, and other coding agents");
  - REST `GET /api/v1/bugs/{bug_id}`;
  - MCP `get_bug`;
  - GitHub Issues, Linear, Jira;
  - per the home page, "any endpoint that accepts a webhook".

### 5.6 Agents in the loop (grounds the subtle beat) [AGENT-*]
- **One sentence starts it:** "Use Replay QA to test and fix this app. Start at https://docs.replay.io/llms.txt and follow it." It is offered on the New Project page and in the docs [AGENT-01].
- **What llms.txt points to** [AGENT-01]: the CLI skill (the default), the REST API, the Replay QA MCP server, and published skills.
- **The documented loop** [AGENT-02]:
  1. create a project;
  2. let QA run;
  3. read the bugs;
  4. "Mark each fix. Replay QA reruns the affected journey to confirm it.";
  5. "Loop until no open bugs remain."
- **Guardrails written for agents:** "do NOT start your own explorations or test runs" while QA is running; "Verify the report against its evidence and the source before applying a fix." [AGENT-03]
- **MCP setup:** `claude mcp add --transport http replay-qa https://qa.replay.io/api/mcp`. The server supports OAuth sign-in, so it can be added by URL without a token. A token-based setup also exists [AGENT-04].
- **Replay MCP** is a separate server for inspecting one recording [AGENT-05] [AGENT-06]:
  - 30 tools; agents call `RecordingOverview` first.
  - The agent can read console output, source annotated with what executed, call stacks, network requests and React renders.
  - `ReactRenders` in `fiber-cause` mode answers "which prop changed, which state update fired, which context value shifted".
  - `ReactPerformanceInsights` "Detects heavy commits (over 50ms)".
  - The docs overview: an agent can inspect "the console, code, and network traffic from the actual failure" [AGENT-07].
- **Agents the vendor names:** Claude Code, Cursor, Codex (and VS Code as an MCP client), plus Obvious as a connector [AGENT-08]. The film shows none of their logos or UI.
- **The real "critic":** Replay QA re-running the journey against a fresh recording after a fix is marked [AGENT-02]. In Replay's own vendor-reported pilot, Obvious wrote fixes and Replay QA verified them. "When a PR was closed or failed QA, the loop opened another one." 18 of 124 bugs needed more than one attempt [AGENT-11]. This is the ground for "not yet … good".
- **What the judge links are not:** the bug-sync page shows three links, "Requirements judge", "Evidence judge" and "Acceptance judge", under a nav named "Bug filing provenance". The bug-react page shows "No recorded judge actions available." Their function is undocumented, and they relate to bug *filing*, not to fixes. They may sit in frame unnarrated [AGENT-15].
- **Beat spec:** 6 to 8 s, about 0.6 scale, in a corner.
  1. The developer hands a `▶ replay recording` chip to the critic.
  2. The critic answers "✕ not yet".
  3. The developer works again and hands over a new chip.
  4. The critic answers "✓ good".
  - Best host shot: the bug-sync page (status **Fixed**).

---

## 6. Verified quotes (summary; full list in `quotes.json`)

All quotes are product copy or vendor documentation. None is attributed to a private person. On-screen copy comes from the takes; docs copy was checked live on 2026-10-14.

**Strongest for narration or kinetic type**
- "Set up QA for your app" (Q01)
- "Enter your app's URL and I'll walk you through the rest in a quick chat." (Q02)
- "Use Replay QA to test and fix this app. Start at https://docs.replay.io/llms.txt and follow it." (Q05)
- "You do not need an existing test suite or a list of reproduction steps." (Q06)
- "Replay QA works without configuration: give it a URL and it explores." (Q08)
- "Explore the app to get journeys. Run the journeys to get recordings." (Q10)
- "Each journey run produces a Replay recording." (Q11)
- "Running test loops automatically." (Q14)
- "Tue at 3:00 AM · America/New_York" (Q15)
- "Add production, staging, development, preview, or local configuration." (Q16)
- "Another push supersedes the running round. Closing the pull request cancels it." (Q18)
- "A Replay recording removes the reproduction step." (Q20)
- "Session Replay tools replay the DOM and Runtime Replay tools re-run the runtime" (Q21)
- "Every bug Replay QA files is backed by a Replay recording of the run that found it." (Q25)
- "Mark each fix. Replay QA reruns the affected journey to confirm it." (Q30)
- "Loop until no open bugs remain." (Q31)
- "Markdown for Claude Code, Cursor, and other coding agents" (Q28)

**Excluded**
- The Chris Kelly / LeadDev line ("A verifier deploys to an isolated instance …") is UNVERIFIED at its original source.
- "A fixed bug stays fixed: if the problem comes back, Replay QA files it as a new bug." is verbatim but contested by other vendor pages, so it is not for screen.
- The monitoring-comparison FAQ line names other companies' products, so it is not for use.

---

## 7. Debates (fair, two-sided, all vendor-internal)

1. **A fix that did not work: does the bug reopen, or is a new bug filed?** [PROOF-C1]
   - *Reopens:* the overview ("reopens the bug if the problem is still there"), concepts and getting-good-results.
   - *New bug:* the bug-reports reference ("A fixed bug stays fixed: if the problem comes back, Replay QA files it as a new bug"), the OpenAPI spec (`fixed` = "assess any recurrence as a fresh report"), which the reference calls authoritative, and the `fix-qa-bug` skill.
   - **Film:** "it reruns the journey to confirm."
2. **What happens to PR bugs when the PR closes?** [CONT-C1]
   - The GitHub docs say they move to a "pr-closed" status.
   - The bug-reports reference says Replay QA sets `wontfix` when a PR closes unmerged and `fixed` when one merges.
   - The API enum has no `pr-closed`, and the account has never shown one.
   - **Film:** do not mention it.
3. **"Require approval".** [CONT-C2]
   - The GitHub docs describe the toggle (default: "never blocks a merge").
   - The OpenAPI `github` schema has no such field.
   - **Film:** say "a Replay QA check on every PR; make it required to gate merges". Do not name the toggle.
4. **The GitHub Issues filing toggle.** [CONT-C3]
   - One vendor page calls it "Legacy"; the docs present it as current.
   - **Film:** say "file bugs to GitHub Issues, Linear or Jira".
5. **Which runs get time-travel analysis?** [TIME-C1]
   - how-it-works: "For all tests that fail, our agents time-travel through the recordings."
   - The polish-pass docs say every journey run's recording is reviewed, and all four featured bugs are polish findings from journeys that worked.
   - **Film:** "every run is a recording, and every recording gets reviewed."
6. **Is DOM-only replay blind to these bugs?** [TIME-C2]
   - True for wasted renders that change nothing (inference).
   - Not true for network traffic in general: many tools log requests, and Replay's own FAQ calls such tools "genuinely useful".
   - **Film:** keep the claim to *why*, not *whether*.
7. **"Long task"** [TIME-18]
   - MDN's 50 ms threshold applies to uninterrupted main-thread work. The 56 ms includes passive effects that React usually flushes in a later task, and the 67 ms report has no phase split.
   - **Film:** compare to the 16.7 ms frame budget only.
8. **Suggested fix vs no patch** [PROOF-03]: compatible. Say "suggested fix" at most, never "auto-fix".
9. **Step counts** [LOOP-02]: five (docs) vs three (home page). Both are the vendor's. Do not mix them in one graphic.

---

## 8. Curiosity hooks, ranked (all true, all sourced)

1. **Replay QA caught a performance bug in Replay QA.** A 67 ms commit on its own Projects page, 4 dropped frames, still open. [TIME-08] [TIME-09]
2. **25 of 27 renders changed nothing on screen,** so a DOM-only replay has nothing to show for half of a 67 ms commit. Only the runtime recording keeps that work. [TIME-08] [TIME-17]
3. **A bookmark that never moved:** for about 160 s the client asked for "everything since -1" 258 times, while the user clicked twice. [TIME-11]
4. **The fix was already in the bundle:** a 10000 ms default and an SSE transport sat unused while the board polled with `waitMs=500`. [TIME-12]
5. **105 identical answers:** every response was `events: []` with the same all-zeros checkpoint. [TIME-12]
6. **64% of the bugs on Insights were never functional failures:** 453 of 711 came from polish passes reviewing recordings. [TIME-14]
7. **The schedule really fires:** six Tuesdays in a row, each batch starting at 3:00 AM New York time. [CONT-02] [CONT-03]
8. **The whole agent setup is one sentence:** "Start at https://docs.replay.io/llms.txt and follow it." [AGENT-01]
9. **Setup talks back:** "I'll walk you through the rest in a quick chat." [SET-01]
10. **Journeys graduate:** an agent first follows a plain-English description; concrete steps are recorded only once Replay QA is confident. [LOOP-05]
11. **Push again mid-test and the old round is superseded,** not left running. One PR comment is edited in place, however many pushes you make. [CONT-08] [CONT-09]
12. **An app that lives only inside a CI runner can still be tested:** the CLI phones out and waits for `"ready": true`. [CONT-13]
13. **Recording is nearly free, Replay says:** 99.99% of compute is deterministic, about 1 Mb/s, about 3% overhead. [TIME-02]
14. **Replay admits it cheats:** you cannot replay faster than real time, so it keeps "potentially hundreds" of forked processes, never more than 100 ms from any point. [TIME-03] [TIME-04]
15. **The bug report corrected itself:** its first "per keystroke" guess was overturned by measurement. [TIME-12]
16. **When exploration hits a wall it says so in the first person:** "⚠️ I stopped exploring because the app requires a sign-in I couldn't complete…" [LOOP-04]
17. **Replay QA can register its own test account** and finish e-mail verification, using a project inbox. [SET-10]
18. **The exploration player subtitles the agent's own commentary:** "Starting the exploration of the Electric Forest app…" [LOOP-10]
19. **A PR cannot exempt itself from QA:** the skip list is read from the base branch. [CONT-11]
20. **"Production deploys of the same commit are never used for a PR."** [CONT-10]
21. **Severity adds up:** 4 + 238 + 369 + 100 = 711, and so does 258 + 453. [PROOF-08]
22. **Only 4 of 711 bugs are critical,** about half a percent. Medium is the largest band at 369. [PROOF-08]
23. **Marking a bug "invalid" teaches the deduplication,** so the same invalid claim is not filed again. [PROOF-06]
24. **Logins are stored by name,** so they never appear in journey steps or bug reports. [SET-11]
25. **The design document is a false-positive filter:** "Replay QA judges findings against it." [SET-12]
26. **The API tells agents to doubt the report:** "Verify the report against its evidence and the source before applying a fix." [AGENT-03]
27. **In Replay's own two-week pilot, 18 of 124 bugs needed more than one attempt.** Real "not yet" moments (vendor-reported). [AGENT-11]
28. **`fiber-cause` answers why one component re-rendered:** "which prop changed, which state update fired, which context value shifted". [AGENT-06]
29. **A project pauses itself at its budget,** so a forgotten schedule cannot run up an unbounded bill. [CONT-19]
30. **One CI project's Test Runs table mixes "Project default" rounds with PR #1 and PR #3 rounds** whose badges link straight to the pull requests. [LOOP-12]
31. **A localhost app is tested without deploying it,** and the tunnel even carries your VPN and private DNS access. [SET-06]
32. **The project chat once refused new work at its bug limit** (cap 100, 111 filed) until the cap was raised to 150. [LOOP-18]

---

## 9. Sensitive-topic guidance

- **Numbers.** Label every account figure by its surface:
  - "on Insights" for 50 / 711 / 389 / 29% / 1151 / 89;
  - "on this bug" for 67 / 56 / 258 / 105.
  - Do not extrapolate to "the account" (67 projects, 783 bugs across all 67, per a count-only API read). Those wider figures are not for screen [LOOP-13].
- **Open vs fixed.** The two React bugs are open; the two network bugs are fixed. Never put a "fixed" stamp on the React bugs [TIME-08] [TIME-10].
- **Who fixes.** The `fixed` status is set by the team, or by Replay QA when a PR merges. Replay QA did not fix these bugs [PROOF-03] [PROOF-06].
- **Polish passes enabled.** The settings take shows "4 enabled". The digest's "7 enabled" was hand-typed and matches no capture, so never show or say "seven" [CONT-20].
- **Credits and money.** Never show the credit meter, a credit balance, "out of credits" chat text, or the "1000000 credits" budget value.
- **Secrets and personal data.**
  - No e-mail addresses, login variables, tokens or token prefixes.
  - Crop the left chat column in the bug takes.
  - Blur or crop the owner's display name and avoid close-ups of the owner-named workers.dev project URL.
  - Recording ids may remain where they sit in the UI but are never a hero element.
- **Living people.** Do not depict or name Replay staff, the blog's author, or the person it quotes. Use no testimonial handles from the vendor home page.
- **Other companies and labs (even-handed).**
  - The vendor names Claude Code, Cursor, Codex, VS Code and Obvious. Where the product's own on-screen copy names them, it may appear unzoomed. Otherwise the film shows none of their logos, colours, mascots or UI, and favours none of them.
  - This film is made with Claude. It must not single out Claude Code or imply that Anthropic endorses Replay QA. The agents are generic.
  - Do not name competitors (session-replay or monitoring vendors), and do not disparage those categories.
  - Brand names in the bug titles and evidence (React, react-router, RTK-Query, lucide-react, Netlify, Vercel, Auth0, GitHub, Linear, Jira, CircleCI) may appear as plain text where the product shows them, never as logos.
- **Vendor-reported figures.** The time-travel engineering numbers and the self-healing pilot numbers are Replay's own claims. Attribute them ("Replay says", "in Replay's own pilot") and keep them out of headline graphics.
- **"Fully managed" honesty.** Replay hosts the browsers, containers and recordings. The customer still supplies access (logins, a reachable URL or a tunnel) and answers blocking questions in the chat.
- **Placeholders.** `https://staging.your-app.dev` is a typed example, not a tested app. "Start setup" is hovered, never clicked [SET-04].

---

## 10. Do-not-say list (corrected or unverifiable claims; never resurrect)

| Do not say | Say instead | Why |
|---|---|---|
| "50 projects in the account" / "20 projects" | "Insights: 50 projects" | API total is 67; 20 is one API page [LOOP-13] [LOOP-14] |
| "every 800 ms" | "about 800 ms" / "every ~800 ms" | The title says "~800ms"; the body says "~700-900ms" [TIME-12] |
| "7 polish passes enabled" | "4 enabled" (if the row is in frame) | The take shows 4 [CONT-20] |
| "the reading-room app" | "a pull-request list" / "an issue board" | It is a repository [TIME-13] |
| "126 bugs fixed" / "100% fixed" | "126 found, 101 fixed, none left open" | 24 invalid and 1 won't fix count as resolved [PROOF-11] |
| "29% fixed" / "322 resolved" | "29% resolution rate" | 207 ÷ 711 [PROOF-09] |
| "131 journeys passed" | "one round, 131 journeys" | Passed 1, Failed 0, Bugs 0 [LOOP-17] |
| "the 67 ms bug came from the run that filed 68 bugs" | (nothing) | Source run "Test Run #run-muek" is not linked to that run (unverifiable) |
| "these commits are long tasks" | "four frames' worth on a 16.7 ms budget" | Contested [TIME-18] |
| "the bug reopens" / "files a new bug" | "it reruns the journey to confirm" | Docs disagree [PROOF-C1] |
| "Replay QA fixes / patches your bugs" | "root cause and a suggested fix" | [PROOF-03] |
| "Replay QA's critic / judge agents review fixes" | depict the rerun loop | Judge function undocumented [AGENT-15] |
| "the MCP server never uses a token" | "add it by URL, no token needed" | A token setup also exists [AGENT-04] |
| "watch the agent explore" over the explore take | zoom on timer, card and subtitle | The player picture is empty [LOOP-10] |
| "the overview player is the time-travel recording" | (nothing) | It renders rrweb plus subtitles [LOOP-11] |
| "the 27 PR projects were created automatically" | "projects pointed at PR previews" | Unverifiable [CONT-16] |
| "scroll down to reveal older runs" | hold on the table | The scroll moves 27.5 px [LOOP-12] |
| "Every night" over the "Tue at 3:00 AM" chip | "Every Tuesday, 3 AM" or "On a schedule" | The captured schedule is weekly [CONT-03] |
| "pr-closed", "Require approval", the "fileIssues" toggle | (nothing) | Contested [CONT-C1] [CONT-C2] [CONT-C3] |
| "Replay keeps hundreds of processes" | "potentially hundreds" | Source wording [TIME-03] |
| "13 characters per second" | (no rate, or the recorded timings) | Recorded about 14.4 cps [SET-04] |
| "a new push replaces the older run" (CI) | "`replayqa ci` replaces any older in-flight run" | Source wording [CONT-13] |
| "the app never finished loading" as a blocked example | the sign-in or seeded-data messages | That message describes an auth wall [LOOP-04] |
| "ProfileSampling profiles your app" | (nothing) | It profiles the Replay runtime [AGENT-06] |
| "GitLab / Bitbucket supported" | "GitHub" | [CONT-18] |
| "unlimited parallelism" | "5 max containers" | [CONT-19] |
| Chris Kelly's verifier quote | (nothing) | Unverified at the original source |

---

## 11. Where things stand (as of 2026-10-14)

- **Product:** Replay QA (by Replay, replay.io) is live at https://qa.replay.io/ with docs at https://docs.replay.io/.
  - Its llms.txt calls it "an autonomous app testing tool built on Replay's time-travel debugging engine" that explores a web app, builds journeys, runs them "while capturing full runtime recordings", and "delivers root cause analysis for every bug it finds" [SET-16].
  - Ten polish passes are documented, and "the set of passes changes over time" [TIME-06].
  - GitHub is the only supported repository host [CONT-18].
  - The CI guides pin CLI 0.2.4 [CONT-13].
- **This account (Insights):** 50 projects · 711 bugs · 389 open · 29% resolution rate · 1151 journeys · 89 explorations [PROOF-08] [LOOP-13].
  - The two featured React bugs (67 ms, 56 ms) are open.
  - The two featured network bugs (258, ~800 ms) are fixed.
  - Electric Forest is paused with 126 bugs: 101 fixed, 24 invalid, 1 won't fix [PROOF-11] [LOOP-16].
  - The collaborative-ai-editor project is active and runs weekly at Tue 3:00 AM America/New_York [CONT-02] [CONT-19].
- **Agent ecosystem:** an agent can drive the full loop through the CLI, REST or the Replay QA MCP server, and can inspect recordings through Replay MCP (30 tools) [AGENT-01] [AGENT-05]. Replay's own vendor-reported pilot (Sep 18 to Oct 1) is the most recent public account of an agent-fixes / QA-verifies loop [AGENT-11].
- **Open questions (not for the film):**
  - What the judge links do.
  - Whether explorations also produce runtime recordings.
  - How the 27 per-PR projects were created.
  - Why 115 Insights bugs are neither open nor resolved.
  - The vendor's internal disagreements on reopen vs new bug, pr-closed and Require approval.

---

## 12. Additional verified facts (usable as support lines)

- qa.replay.io describes itself as an "AI-powered QA testing platform — automated explorations, journey testing, and polish analysis." [SET-15]
- It works with any browser-based web app, with especially deep runtime analysis for React applications [SET-17].
- How-it-works: "a new test run triggers on every push to main and with every PR (configurable)" [CONT-05]. It also says Replay QA "spins up a swarm of agents that runs all of the mapped journeys in parallel, in a browser" [CONT-24].
- Credits: around 20 for "a web app of average complexity" (pricing) [CONT-21].
- A per-run time limit can be set from 1 to 10080 minutes (API) [CONT-23].
- Journey tests record "every DOM mutation, every network call, every JavaScript frame", and replays behave "identically every time" [TIME-20].
- The 50 Insights rows carry 41 distinct names. Say "projects", not "apps" [LOOP-15].
- 115 Insights bugs are neither open nor resolved; the UI does not say why. Do not narrate this [PROOF-10].
- The `fix-qa-bug` skill treats a report's root cause as "leads to verify", and keeps the bug open until the fix is verified [AGENT-09].
- A webhook callback lets a team mark a bug resolved when the fix ships, which "re-enables that user journey for future runs" [AGENT-10].
- The vendor's FAQ answer on fixing: "No, and that's deliberate. … applying it stays with your team." [AGENT-12]
- The project chat can be driven by API, and the assistant "can perform project actions requested by the message" [AGENT-13].
