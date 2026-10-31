# Dossier: Point it at your app (project setup from one URL)

- Topic id: `point-it-at-your-app`
- Era: product, as of 2026-10-14
- Form: product promo (look "promo"), so the People and Belief sections are marked not applicable.
- Verification: local doc copies in `research/sources/` were re-checked against the live docs on 2026-10-14 in the requester's Chrome (Claude in Chrome extension). The live New Project page at https://qa.replay.io/ was read in the same signed-in session, read-only: nothing was typed, submitted or created. Every quoted string below matched the live page word for word unless a note says otherwise.

## 1. Summary

Replay QA's setup is one screen. The signed-in home page at https://qa.replay.io/ is the New Project page. Its eyebrow reads "New project" (rendered upper-case), its heading reads **"Set up QA for your app"** and its sub-copy reads **"Enter your app's URL and I'll walk you through the rest in a quick chat."** Below that is a single chat input with the placeholder `https://your-app.com`. Its send button, at the right end of the input bar, is the **"Start setup"** button (`data-testid="chat-send-btn"`, accessible name "Send message"). It is disabled until text is typed. A separate callout button reads **"Want your coding agent to handle it?" / "Get the prompt"**. The prompt it refers to is **"Use Replay QA to test and fix this app. Start at https://docs.replay.io/llms.txt and follow it."** (account-digest.json `new_project_page.agent_prompt`; docs page "Driving Replay QA from a coding agent").

In the film's captured take (`capture/clean/new-project.json`, 5537 ms) the cursor clicks the chat input, types `https://staging.your-app.dev` (the script asks for 13 characters per second; the recorded keystrokes average about 69 ms apart, about 14 per second) (mark `typing` at 1100 ms, mark `typed` at 2966 ms), then moves to and hovers **Start setup** (mark `hover-start` at 4737 ms; `end` at 5537 ms). The take never submits. The URL is an illustrative placeholder, not a real customer app, and the take has no credentials or e-mail addresses (stats: `redactions: 0`, `clicks: 1`).

To reach an app, Replay QA needs **"a running version of the application that its test browser can reach"**. The docs list three ways: (1) a **public URL**, needing "without a tunnel or CI configuration"; (2) **localhost or a private network**, through "the managed reverse proxy", an outbound tunnel that works "without deploying it or publishing it directly to the internet"; (3) **a build inside CI**, where "the Replay QA CLI can open a tunnel from the runner" (GitHub Actions or CircleCI).

A project is "One application under test". It has a target URL plus guidance: instructions, an *optional* design document, test logins (stored as project variables), the set of enabled polish passes, and "two caps, a credit budget and a bug limit". GitHub is optional, and a project is either active or paused. The vendor says in so many words: **"You do not need an existing test suite or a list of reproduction steps."** It also says: **"Replay QA works without configuration: give it a URL and it explores."**

## 2. Timeline (dated events)

All entries are product state as of 2026-10-14. The vendor docs carry no publication dates, so this is a snapshot rather than a history.

| Date | Event | Source |
|---|---|---|
| 2026-10-14 | The account digest records the New Project page copy (heading, sub, agent prompt) from the signed-in web app. | `films/replay-qa-promo/research/sources/account-digest.json` (`source`, `new_project_page`) |
| 2026-10-14 | The `new-project` take is captured with Playwright (signed-in profile) and cleaned. Marks: typing 1100 ms, typed 2966 ms, hover-start 4737 ms, end 5537 ms. | `films/replay-qa-promo/capture/clean/new-project.json`; `films/replay-qa-promo/capture/takes/new-project.mjs` |
| 2026-10-14 | Live check: https://qa.replay.io/ (signed in) shows "NEW PROJECT / Set up QA for your app / Enter your app's URL and I'll walk you through the rest in a quick chat. / Start setup / Want your coding agent to handle it? / Get the prompt". The input placeholder is `https://your-app.com`. | https://qa.replay.io/ |
| 2026-10-14 | Live check: the docs overview, concepts, getting-good-results, localhost and agent-integration pages match the saved copies for every passage quoted here. https://docs.replay.io/ opens on the Replay QA overview. | https://docs.replay.io/basics/replay-qa/overview, https://docs.replay.io/basics/replay-qa/concepts, https://docs.replay.io/basics/replay-qa/getting-good-results, https://docs.replay.io/basics/replay-qa/localhost, https://docs.replay.io/basics/replay-qa/agent-integration |
| 2026-10-14 | The account holds 20 projects (`projects_total: 20`). The Electric Forest project targets `http://127.0.0.1:61787`, a reverse-proxied local app, and is `paused`. | `research/sources/account-digest.json` (`projects_total`, `projects["Electric Forest"].project`) |

## 3. People

Not applicable (product promo). The New Project page speaks in the first person ("I'll walk you through the rest"): the setup chat is the product's agent, not a named person. Do not depict or name any Replay employee.

## 4. The belief of the age

Not applicable as history. The contrast the vendor itself draws is still useful framing. The usual assumption is that end-to-end QA starts with a test suite and repro steps. Replay QA's docs say: "You do not need an existing test suite or a list of reproduction steps" (overview). The FAQ adds that it "complements an existing test suite but does not require one". The film should keep that nuance: Replay QA **complements** a suite rather than replacing it.

## 5. Experiments and results (what the screen shows and what the product does)

### 5a. The New Project screen (the captured take)

- Take file: `capture/clean/new-project.json`, viewport 1440 x 900, duration 5537 ms. The cleaner cut 656 ms of dead time from a 6193 ms raw take, leaving 62 of 118 raw events (`stats`). It localized 3 assets and recorded 1 click.
- Marks (ms from take start): `typing` 1100, `typed` 2966, `hover-start` 4737, `end` 5537.
- Typing: the first character "h" appears at 1103 ms. `https://` is complete at 1541 ms and the full value `https://staging.your-app.dev` (27 characters) at 2908 ms. The take script asks for `cps: 13` (`capture/takes/new-project.mjs`). The recorded keystrokes are 26 intervals over 1805 ms, about 69 ms each, which is about 14.4 characters per second. If the film states a rate, use the recorded timings, not "13 per second".
- The Start setup button (rrweb node 105, `chat-input__send`) loses its `disabled` attribute at 1103 ms, when the first character lands.
- Cursor: one click on the chat input (`[data-testid="chat-input-textarea"]`, rrweb node 104) at about 617 to 698 ms, at about (756, 330). After `typed` the cursor travels right along the same row to the **Start setup** send button at the end of the input bar. It arrives at about (1054, 328) by about 4500 ms and stays there to the end. The script's hover takes 700 ms. The script comment reads: "Types a URL into New project and hovers Start setup (never submits)."
- On-screen copy in the take, from rrweb text nodes:
  - Eyebrow "New project". Heading "Set up QA for your app". Sub-copy "Enter your app's URL and I'll walk you through the rest in a quick chat."
  - Button "Start setup": the chat input's send button (`data-testid="chat-send-btn"`, `aria-label="Send message"`), inside the input bar. Callout button (`np-agentcta`): "Want your coding agent to handle it?" with "Get the prompt".
  - Input placeholder "https://your-app.com".
  - A left sidebar listing the account's projects (for example "Electric Forest", "Reminders · CI", "Reminders · CircleCI", "BLamy prod FRPC control", "ExampleApps PR #9 - …"), plus "Projects", "Insights", "Help" and "Discord".
- Hidden by the cleaner: the credit meter ("of N credits") and the admin chip (`capture/clean.json` `shared.hide` / `hideByText`). Toasts and Intercom are hidden by the cleaner's built-in CSS, which is recorded in the `css` array of `capture/clean/new-project.json`, not by `clean.json`. These must not reappear in the film.
- **Which URL the typed prompt shows:** `https://staging.your-app.dev`. This is confirmed from the redacted take. It is an illustrative placeholder in the same family as the product's own placeholder `https://your-app.com`, chosen to signal "staging". It is not one of the account's real targets and contains no credentials or addresses. Treat it as an example. Do not claim Replay QA tested it.

### 5b. How the app is reached (three paths)

Source: `research/sources/basics_replay-qa_overview.txt` and https://docs.replay.io/basics/replay-qa/overview

1. **Public URL.** "For a deployed app or preview with a public URL, create a project and enter that URL. Replay QA can begin exploring without a tunnel or CI configuration."
2. **Localhost or a private network.** "For an app that only runs on your computer, use the managed reverse proxy. The outbound tunnel lets Replay QA reach the local app without deploying it or publishing it directly to the internet." The same setup "can reach internal hostnames and services available through your computer's VPN or private DNS." The localhost page words it slightly differently: the CLI "creates an outbound tunnel" so Replay QA can reach the app "without deploying it or exposing it directly to the public internet", and "replayqa proxy opens an authenticated tunnel". Quote each page's own wording. Do not merge the two.
   - Mechanics (https://docs.replay.io/basics/replay-qa/localhost):
     - Create the project with the exact local URL, for example `http://localhost:3000`. "When Replay QA identifies the URL as local or private, choose the reverse proxy setup."
     - The project then displays a CLI command, `npx --yes replayqa proxy --project <project-id> --qa-url <replay-qa-origin>`, to run in a second terminal.
     - "Replay QA starts testing automatically once the connection reports ready."
     - Extra hosts are allowed with `--allow`.
     - Keep both processes running, because "Closing either process disconnects the test browser from the app."
3. **A build inside CI.** "If the application only exists inside a CI runner, the Replay QA CLI can open a tunnel from the runner and keep the app reachable for the complete test run." Supported runners are GitHub Actions and CircleCI. Mechanics (`research/sources/basics_replay-qa_frpc-ci.txt`, https://docs.replay.io/basics/replay-qa/frpc-ci):
   - `replayqa proxy --ci --json` opens the tunnel and waits for a heartbeat with `ready: true`.
   - `replayqa ci` creates a PR-linked test run for the current commit and "replaces any older in-flight run for the same pull request".
   - Cleanup closes the tunnel when Replay QA reaches a terminal state.

Account proof points:
- Projects named "Reminders · CI", "Reminders · CircleCI" and "BLamy prod FRPC control" appear in the take's sidebar.
- Electric Forest's target is `http://127.0.0.1:61787` (account-digest.json).

### 5c. What a project carries (guidance and caps)

Source: `research/sources/basics_replay-qa_concepts.txt` and https://docs.replay.io/basics/replay-qa/concepts

- Definition: "One application under test. A project has a target URL (a public URL, a localhost app reached through the reverse proxy, or a build inside CI), plus the guidance you give it: instructions, an optional design document, test logins, the set of enabled polish passes, and two caps, a credit budget and a bug limit."
- GitHub is optional: "A project can also be connected to a GitHub repository so it tests new builds on its own." The FAQ also says "Manual and localhost projects work without a repository connection."
- Status: "A project is either active or paused. A paused project schedules nothing." Replay QA pauses a project itself when the project budget or the account's credits run out, and "tells you in the project chat".
- What is optional:
  - The design document ("optional", per concepts).
  - GitHub.
  - Configuration in general ("Replay QA works without configuration: give it a URL and it explores", getting-good-results).
  - Test logins: these are an alternative to self-registration. "Replay QA can sign up for its own account when the app allows it. It has a project email inbox and can complete email verification codes on its own."
- Overview list under "Build useful coverage" ("You can shape what Replay QA tests without writing browser automation"): instructions, design document, test logins and variables, additional explorations, polish passes. Polish passes cover accessibility, layout stability, visual glitches, network performance, React rendering, SEO and security.
- The settings page in the account (account-digest.json `settings_page_facts`):
  - Header: "How this project is configured. Edit settings and environment schedules here, or ask QA in the chat — both make the same change."
  - Budget: "credits QA may spend before the project pauses".
  - "Processing concurrency: containers running QA at once (5 max)".
  - Example: 7 polish passes enabled ("Network Performance, React Rendering, Layout Shift, Glitches, User Experience, Accessibility, UI Details").
  - Environments: "Add production, staging, development, preview, or local configuration."
  - Integrations: Vercel preview access, GitHub, Issue tracker, Logins & variables.

### 5d. What to tell it before the first run

Source: `research/sources/basics_replay-qa_getting-good-results.txt` and https://docs.replay.io/basics/replay-qa/getting-good-results

- Everything is set "through the project chat. Ask the chat to change a setting and it will do it, or ask for a form when the setting involves credentials." Only the project owner can change settings.
- **Tell it what the app is for.** The docs' example instruction is: "This is a B2B invoicing app. Focus on creating and sending invoices, and on the payment page. Skip the marketing pages. Do not send email to real addresses." Bad instructions are generic ("test everything") or contain secrets.
- **Design document.** "Replay QA judges findings against it, so it is the fastest way to stop reports about deliberate behavior."
- **Give it a way in.** Either test logins ("stored as project variables and referenced by name, so they do not appear in journey steps or bug reports") or self-registration.
- **Scope the first pass.** Focus areas: authentication, onboarding, dashboard, checkout and payments, search and filters, forms and inputs, settings, navigation. "Pick the two or three where a bug would hurt most".
- **Budget and bug limit.**
  - "The default is a thorough pass; lower it for a smoke test on a small app, raise it for broad coverage on a large one."
  - The bug limit "caps how many bugs QA files before it stops"; a low first limit "keeps the list reviewable".
- **Polish passes.** "Turn on the polish passes that match the app and turn off the rest". React rendering only for React apps, SEO for public pages, security "requires ownership verification before it runs".

## 6. Verified quotes

This is a promo, so these are on-screen product copy and vendor docs, not people. All are verbatim and were checked live on 2026-10-14.

| # | Text (verbatim) | Speaker / surface | Source |
|---|---|---|---|
| Q1 | "Set up QA for your app" | New Project page heading | https://qa.replay.io/ (signed in); `account-digest.json` `new_project_page.heading`; `capture/clean/new-project.json` |
| Q2 | "Enter your app's URL and I'll walk you through the rest in a quick chat." | New Project sub-copy | same three sources as Q1 |
| Q3 | "Start setup" | New Project primary button: the chat input's send button, accessible name "Send message" (hover mark at 4737 ms) | https://qa.replay.io/; `capture/clean/new-project.json`; `capture/takes/new-project.mjs` |
| Q4 | "Want your coding agent to handle it?" / "Get the prompt" | New Project secondary line | https://qa.replay.io/; `capture/clean/new-project.json` |
| Q5 | "Use Replay QA to test and fix this app. Start at https://docs.replay.io/llms.txt and follow it." | Agent prompt | (1) `research/sources/account-digest.json` `new_project_page.agent_prompt`; (2) https://docs.replay.io/basics/replay-qa/agent-integration (live) and `research/sources/basics_replay-qa_agent-integration.txt` line 6 |
| Q6 | "You do not need an existing test suite or a list of reproduction steps. Replay QA can start from an application URL and guidance about what the product should do." | Vendor docs | https://docs.replay.io/basics/replay-qa/overview; `research/sources/basics_replay-qa_overview.txt` |
| Q7 | "No. Replay QA explores the app and creates its own reusable journeys. It complements an existing test suite but does not require one." | Docs FAQ, answer to "Do I need an existing test suite?" | https://docs.replay.io/basics/replay-qa/overview (FAQ, expanded live; the answer is not in the saved text copy) |
| Q8 | "Replay QA works without configuration: give it a URL and it explores." | Vendor docs | https://docs.replay.io/basics/replay-qa/getting-good-results |
| Q9 | "Replay QA needs a running version of the application that its test browser can reach." | Vendor docs | https://docs.replay.io/basics/replay-qa/overview |
| Q10 | "Replay QA can begin exploring without a tunnel or CI configuration." | Vendor docs (public URL path) | https://docs.replay.io/basics/replay-qa/overview |
| Q11 | "Yes. Run the managed reverse proxy on the same computer as the app and leave both processes running while QA tests." | Docs FAQ, answer to "Can Replay QA test an app on localhost?" (the first two sentences; the answer goes on "Follow Testing a localhost app for the complete setup.") | https://docs.replay.io/basics/replay-qa/overview (FAQ, live) |
| Q15 | "No. Connect GitHub when you want QA to react to main-branch or pull-request deployments. Manual and localhost projects work without a repository connection." | Docs FAQ, answer to "Do I have to connect GitHub?" (the answer then links to "Continuous QA from GitHub") | https://docs.replay.io/basics/replay-qa/overview (FAQ, expanded live 2026-10-14; not in the saved text copy) |
| Q12 | "You can shape what Replay QA tests without writing browser automation." | Vendor docs | https://docs.replay.io/basics/replay-qa/overview |
| Q13 | "AI-powered QA testing platform — automated explorations, journey testing, and polish analysis." | qa.replay.io meta and og description | https://qa.replay.io/ (HTML head) |
| Q14 | "Replay QA is an autonomous app testing tool built on Replay's time-travel debugging engine. Point it at a web app and it explores the application, builds user journeys through it, runs them while capturing full runtime recordings, and delivers root cause analysis for every bug it finds." | llms.txt | https://docs.replay.io/llms.txt; `research/sources/llms.txt` |

UNVERIFIED: nothing. The exact text behind "Get the prompt" could not be shown without interacting further. The agent prompt is sourced from the account digest and the docs, not from that popover.

## 7. Debates and controversies

- **"No test suite needed" versus "replaces your test suite".** The vendor claims only the first. Its FAQ says it "complements an existing test suite but does not require one" (Q7). The film must not say it replaces Playwright or Cypress suites.
- **"Fully managed" versus what the user still supplies.** The vendor says it "works without configuration", but in the same docs it says result quality "depends on what it knows about the app and whether it can get in" (getting-good-results). Login walls, invitations, paywalls, CAPTCHAs and rate limits pause the project until a human answers in the chat. A fair line is "start from one URL; add guidance to sharpen it".
- **Localhost exposure.** The tunnel is outbound and authenticated and "Keep this list narrow so the tunnel does not expose unrelated hosts" (localhost doc). The film should say "without deploying it", not "without any network access".

## 8. Misconceptions to avoid

- Do not say the typed URL `https://staging.your-app.dev` is a real app Replay QA tested. It is a placeholder typed for the take, and "Start setup" is only hovered, never clicked.
- Do not show the account's credit balance. The cleaner hides the credit meter on purpose.
- Do not say GitHub is required. It is optional (overview, FAQ).
- Do not say the design document is required. Concepts calls it "optional".
- Do not put credentials in "instructions". The docs say logins belong in test logins / project variables.
- "Two caps" means **credit budget** and **bug limit**. Processing concurrency (5 max) is a separate setting, not one of the two caps.
- The CI path uses the **Replay QA CLI tunnel** (`replayqa proxy --ci`, `replayqa ci`). It is different from the GitHub App testing public preview deployments (frpc-ci doc).
- Do not say "every app gets React analysis". The docs say it "works with any browser-based web app, with especially deep runtime analysis for React applications".
- The page title in the browser tab is "Replay QA". The heading is "Set up QA for your app", not "Create project".

## 9. Curiosity hooks (true and sourced)

1. The setup screen talks in the first person: "I'll walk you through the rest in a quick chat." Setup is a conversation, not a form. (https://qa.replay.io/; account-digest.json)
2. There is a one-sentence handoff for coding agents, "Use Replay QA to test and fix this app. Start at https://docs.replay.io/llms.txt and follow it.", offered right on the New Project page ("Want your coding agent to handle it?"). (account-digest.json; https://docs.replay.io/basics/replay-qa/agent-integration)
3. Replay QA can register its own test account and finish e-mail verification, because each project has its own inbox. (https://docs.replay.io/basics/replay-qa/getting-good-results)
4. A localhost app is reachable without deploying it. An outbound tunnel (`npx --yes replayqa proxy …`) even carries your VPN and private DNS access. (https://docs.replay.io/basics/replay-qa/localhost)
5. In CI, the tunnel must stay up for the whole run. The docs say `replayqa ci` "replaces any older in-flight run for the same pull request and creates a PR-linked test run for the current commit". The doc says the CLI step does the replacing; it does not say "a new push". (https://docs.replay.io/basics/replay-qa/frpc-ci)
6. The design document is also a false-positive filter: "Replay QA judges findings against it, so it is the fastest way to stop reports about deliberate behavior." (getting-good-results)
7. Settings can be changed by talking: "Edit settings and environment schedules here, or ask QA in the chat — both make the same change." (account-digest.json `settings_page_facts.header`)
8. In the take, the whole setup beat is 5.5 seconds: the URL is typed between the `typing` and `typed` marks (1100 to 2966 ms, 1.87 s; the keystrokes themselves run from 1103 to 2908 ms, 1.8 s), and the cursor is on "Start setup" by the 4737 ms mark. This is a cleaned, dead-time-compressed take (6193 ms raw), not a measure of real setup time. (`capture/clean/new-project.json`)

## 10. Visual and dramatic details (for the art department)

- **Screen:**
  - Light, airy app UI at 1440 x 900 with a left sidebar of project names and a centered card.
  - Card contents, top to bottom: small upper-case eyebrow "NEW PROJECT", large heading "Set up QA for your app", one line of grey sub-copy, then a single chat input (47 px high in the take). The input bar ends in the "Start setup" send button. That button's accessible name is "Send message", so "Start setup" and "Send message" are the same control, not two. It is disabled until the first character is typed.
  - Separately, a callout button reads "Want your coding agent to handle it? Get the prompt".
- **Beat structure in the recording:**
  - Idle, then one click into the input.
  - The URL appears character by character, `h` … `https://` … `https://staging.your-app.dev`, about 60 to 100 ms apart (mean about 69 ms, about 14 per second; the script's nominal setting is 13 cps).
  - A pause, then the cursor glides right along the input row and settles on "Start setup" at the end of the bar.
  - These are good anchors for type hits: `typing` 1100 ms, `typed` 2966 ms, `hover-start` 4737 ms.
- **Promo treatment ideas grounded in the take:**
  - Blow the typed URL up full-frame with a caret, matching the brief's "one typed prompt blown up full-frame".
  - Bracket a kinetic word such as `{ one URL }`.
  - Fan out three small path cards: "Public URL" / "localhost, via tunnel" / "inside CI".
  - Use real project names from the sidebar only if the frame stays redacted; avoid personal names in close-up.
- **Off limits on screen:**
  - The credit meter.
  - The admin chip.
  - Any e-mail address.
  - The account owner's full name in close-up. It appears in the sidebar footer, so crop or blur it if a close-up is used.

## 11. Sources

1. `films/replay-qa-promo/brief.md`
2. `films/replay-qa-promo/research/sources/account-digest.json` (new_project_page, settings_page_facts, projects_total, projects)
3. `films/replay-qa-promo/capture/clean/new-project.json` (marks, stats, text nodes, typed input values)
4. `films/replay-qa-promo/capture/takes/new-project.mjs` (take script: typed URL, cps 13, hover Start setup, never submits)
5. `films/replay-qa-promo/capture/clean.json` (cleaner hide rules)
6. `films/replay-qa-promo/research/sources/basics_replay-qa_overview.txt`
7. `films/replay-qa-promo/research/sources/basics_replay-qa_concepts.txt`
8. `films/replay-qa-promo/research/sources/basics_replay-qa_getting-good-results.txt`
9. `films/replay-qa-promo/research/sources/basics_replay-qa_agent-integration.txt`
10. `films/replay-qa-promo/research/sources/basics_replay-qa_frpc-ci.txt`
11. `films/replay-qa-promo/research/sources/llms.txt`
12. https://qa.replay.io/ (signed-in New Project page, read 2026-10-14; HTML meta description)
13. https://docs.replay.io/ (opens on the overview)
14. https://docs.replay.io/basics/replay-qa/overview (including the expanded FAQ answers)
15. https://docs.replay.io/basics/replay-qa/concepts
16. https://docs.replay.io/basics/replay-qa/getting-good-results
17. https://docs.replay.io/basics/replay-qa/localhost
18. https://docs.replay.io/basics/replay-qa/frpc-ci
19. https://docs.replay.io/basics/replay-qa/agent-integration
20. https://docs.replay.io/llms.txt

## Fact-check log (adversarial pass, 2026-10-14)

Method:
- The live pages were re-opened in the requester's Chrome through the Claude in Chrome extension, read-only: docs overview (FAQ answers expanded one at a time), concepts, getting-good-results, localhost, frpc-ci, agent-integration, and the signed-in https://qa.replay.io/ New Project page. Nothing was typed, clicked or submitted in the app.
- `https://docs.replay.io/llms.txt` was fetched with curl and its first 12 lines diffed against the saved copy (identical).
- The rrweb take `capture/clean/new-project.json` was parsed for marks, keystroke mutations, the DOM ancestry of each control, and cursor samples.

Results: 16 key claims checked. 14 confirmed. 2 corrected (claims 3 and 5, in the details). 0 unverifiable.

Changes:
1. **"Start setup" is the chat input's send button, not a separate button below the card** (Summary, 5a, Q3, section 10).
   - In the take, the "Start setup" text sits in `button.chat-input__send` (`data-testid="chat-send-btn"`, `aria-label="Send message"`), inside `div.chat-input__bar` in the chat input.
   - The cursor hovers it at about (1054, 328), on the same row as the input click at (756, 330).
   - Live https://qa.replay.io/ has 1 textarea, and "Start setup" is a button.
   - Section 10 described a separate send arrow plus a "Start setup" button below the card. It now says this is one control.
   - Also added: the button is disabled until the first keystroke (`disabled` removed at 1103 ms).
   - Sources: `capture/clean/new-project.json` (nodes 103, 105, 108; cursor samples); https://qa.replay.io/.
2. **The typing rate is 13 cps in the script, about 14.4 cps as recorded** (Summary, 5a, section 10).
   - The script sets `cps: 13`. The recorded value mutations run from "h" at 1103 ms to the full 27-character URL at 2908 ms: 26 intervals, mean about 69 ms, range 59 to 102 ms.
   - The old text said "an even 13 cps, about 60 to 70 ms per character". That contradicts itself, since 13 cps is about 77 ms per character.
   - Sources: `capture/takes/new-project.mjs`; `capture/clean/new-project.json`.
3. **Two wordings of the localhost tunnel** (5b).
   - The overview says "without deploying it or publishing it directly to the internet".
   - The localhost page says "without deploying it or exposing it directly to the public internet" and "replayqa proxy opens an authenticated tunnel".
   - Claim 11's word "authenticated" comes from the localhost page, not the overview. Both wordings are now attributed to their own page.
   - Source: https://docs.replay.io/basics/replay-qa/localhost.
4. **Cleaner attribution** (5a).
   - Toasts and Intercom are hidden by the cleaner's built-in CSS, recorded in `new-project.json` `css`.
   - `capture/clean.json` `shared.hide` / `hideByText` only covers the credit meter, the admin chip and the task-replay placeholder.
5. **CI hook wording** (hook 5).
   - The doc attributes the replacement of older in-flight runs to the `replayqa ci` step. It does not say "a new push".
   - Source: https://docs.replay.io/basics/replay-qa/frpc-ci.
6. **Timing hook** (hook 8). Added the keystroke span (1103 to 2908 ms) beside the mark span, and noted that the take is dead-time-compressed (6193 ms raw → 5537 ms).
7. **Added Q15** (FAQ "Do I have to connect GitHub?"), verbatim from the live FAQ, as the source for claim 14. Annotated Q11 as the first two sentences of a longer answer.

Confirmed as written:
- Q1 and Q2: live h1 and `p.onboard__lead`. Q4: live callout button. Q13: live meta description.
- Placeholder `https://your-app.com`. Eyebrow "NEW PROJECT", rendered with `text-transform: uppercase`. Page title "Replay QA".
- Q5: live agent-integration page, whose h1 is "Driving Replay QA from a coding agent"; also account-digest.
- Q6, Q9, Q10, Q12, the VPN/private-DNS sentence and the CI sentence: live overview.
- Q7, Q11 and Q15: live FAQ.
- Q8, project variables, self-registration and project inbox, the "test everything" example, budget, bug limit, polish passes, ownership verification, and "Only the project owner": live getting-good-results page.
- Project definition, the "optional" design document, "two caps", and active/paused: live concepts page.
- `npx --yes replayqa proxy`, `--allow`, "Closing either process…" and "Keep this list narrow…": live localhost page.
- `replayqa proxy --ci --json`, `ready: true`, `replayqa ci`, terminal-state cleanup, and CircleCI: live frpc-ci page.
- Q14: llms.txt lines 5 to 8, identical live and saved, and verbatim apart from line wrapping.
- From `account-digest.json`: the settings header ("— both make the same change"), "Processing concurrency: containers running QA at once (5 max)", `projects_total` 20, and Electric Forest `http://127.0.0.1:61787`, `paused`.
- From the take:
  - The marks are typing 1100, typed 2966, hover-start 4737 and end 5537. The stats are 118 → 62 events, 6193 → 5537 ms (656 ms cut), 0 redactions, 3 assets localized and 1 click.
  - The only click is on node 104, the textarea, so Start setup is never clicked.
  - The typed URL is `https://staging.your-app.dev`.
  - The sidebar names are present in the take's text nodes.
