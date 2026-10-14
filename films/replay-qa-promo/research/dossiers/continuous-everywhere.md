# Dossier: Continuous by default: schedules, environments, and every pull request

- Topic id: `continuous-everywhere`
- Era: product, as of 2026-10-14
- Form: product promo (look "promo"). People, beliefs of the age and dissent do not apply and are marked N/A.
- Method: local doc copies in `research/sources/` first, then the cleaned rrweb takes in `capture/clean/` (DOM text rebuilt at each named mark), then live checks on 2026-10-14. Live checks: docs.replay.io (WebFetch), the public GitHub App skill at qa.replay.io (curl, no credentials), and two marketing pages on www.replay.io. Those two were read in the requester's Chrome through the Claude in Chrome extension, read-only: FAQ accordions were expanded, nothing was submitted. (Fact-check note: both pages also serve the quoted text in their server HTML, so a plain HTTP fetch reproduces it; see the Fact-check log.) The raw API dumps in `capture/api/` were not opened. Every account number comes from `account-digest.json` or from the take's own DOM text.
- Redaction: no credentials, tokens, login variables or e-mail addresses are reproduced here. The takes contain a placeholder e-mail on the settings page ("Project guests") and an API token placeholder in the CI docs. Both are left out on purpose.

---

## 1. Summary

Replay QA does not wait for someone to press "run". A project keeps testing on its own through three triggers, and all three are documented:

1. **Every deploy (main branch).** With the Replay QA GitHub App connected, main-branch testing has three modes. **None** turns it off. **Detect main branch deployments** polls a deployment URL you give it until the deployed app changes, then tests it. **Listen to GitHub events** starts a round when GitHub reports a deployment of the default branch, which Vercel and Netlify already do. Main-branch rounds may create, update or remove journeys "because the main branch is the app" (docs).
2. **Every PR (pull request revisions).** With PR testing set to **Listen to GitHub events**, each PR revision is tested against its **preview deployment**. Replay QA posts one PR comment and edits it in place as results arrive, and reports a **"Replay QA" check** on the head commit. Another push supersedes the running round, and closing the PR cancels it. When a build exists only inside CI (an app on `127.0.0.1:3000` in a GitHub Actions or CircleCI runner), the `replayqa` CLI (pinned at `0.2.4` in the docs) opens an outbound reverse-proxy tunnel with `replayqa proxy --ci --json`. It then starts a PR-linked run with `replayqa ci` and holds the tunnel open until the run reaches a terminal state.
3. **Every night/week (schedules).** Each project has **Environments**, and each environment has a URL and a schedule. The requester's settings page shows `Production · https://collaborative-ai-editor.brett-lamy.workers.dev/ · Tue at 3:00 AM · America/New_York`. "Add environment" offers "Add production, staging, development, preview, or local configuration." The vendor's pricing FAQ says runs can be scheduled "daily or weekly … in project settings." The same settings take also shows that the schedule actually ran: its usage list has journey tasks starting at 3:00 AM on six consecutive Tuesdays, Sep 1 to Oct 6, 2026.

"Fully managed" in the product's own words: the project status row reads **Active, "Running test loops automatically."** A **budget** caps credits ("Credits QA may spend before the project pauses"). **Processing concurrency** sets "Containers running QA at once" (**5 max**). The project pauses itself when it hits its budget or the account runs out of credits. Replay runs the containers, browsers and recordings, so the customer runs no test infrastructure. The only exception is the optional CI tunnel, which runs inside the customer's own runner.

Bugs can be filed automatically to **GitHub Issues, Linear or Jira**. **GitHub is the only supported repository host. GitLab and Bitbucket are not supported.**

Reconciliation verdict (details in section 7). The look.md claims check out against the takes. The `runs` take shows a CI project ("Reminders · CI") whose Test Runs table has Environment values **PR #3** and **PR #1**. The `projects` take types "PR #" into the sidebar filter at the `filtered` mark, which leaves **27** projects named "ExampleApps PR #N - …", all pointing at Netlify `deploy-preview-N` URLs. The digest's `per_pull_request_projects = []` is an **artifact of pagination**: the digest read only page 1 of `GET /projects` (default `page_size` 20, so `projects_total: 20`), while the account has **50** projects. The PR claim is **VERIFIED from the takes** but not from the digest. One caveat: those 27 projects are separate projects named after PRs. They are not GitHub-App PR versions, and nothing captured shows how they were created.

---

## 2. Timeline (dated events)

All dates are 2026. "Card date" is the timestamp printed on a project card in the `projects` take. Its exact meaning (created or last activity) is not labelled in the UI.

| Date | Event | Source |
|---|---|---|
| Jun 12–16 | 27 projects named "ExampleApps PR #6 … #11 - <app>", all with Netlify deploy-preview targets `https://deploy-preview-N--<site>.netlify.app` (17 on `replay-<app>` sites; 10 on other sites such as `blamy-broken-linear-<app>`, `blamy-notes` and `todoist-clone-loopqa-4271`) (card dates: 9 on 6/12, 15 on 6/15, 3 on 6/16) | `capture/clean/projects.json` (mark `filtered`, 6306 ms) |
| Jul 2 | Replay QA help article "What is Replay QA?" describes the GitHub integration as an "always-on quality gate" running on main-branch updates and/or PRs against preview or staging | [S9] |
| Aug 12 | "Initial Test Run" on project "Reminders · CI" (target `http://127.0.0.1:3000`, a CI/reverse-proxy project) | `capture/clean/runs.json` (mark `list`) |
| Aug 16 | Same project: runs titled "PR #1: PR #1" and "PR #3: PR #3", Environment column "PR #1" / "PR #3"; the exploration panel shows "Replay QA CI marker: pr-3" | `capture/clean/runs.json` (marks `start`, `list`) |
| Aug 16 | Card date of "Reminders · Production" (`https://replayqa-cli-in-ci.vercel.app`), the public-URL production half of the CI example | `capture/clean/projects.json` |
| Sep 1, 8, 15, 22, 29, Oct 6 (all Tuesdays) | Usage list on the collaborative-ai-editor project shows batches of journey tasks starting at 3:00 AM each Tuesday (about 33–44 rows per Tuesday) | `capture/clean/schedule.json` (mark `add-env`); weekday computed |
| Sep 22 | Card date of "Reminders · CircleCI" (`http://127.0.0.1:3000`) | `capture/clean/projects.json` |
| Sep 23 | Card date of "Electric Forest PR 4650 Preview" (`https://pr-4650--loop-qa-j63k5x.netlify.app/`) | `capture/clean/projects.json` |
| Oct 14 | Settings page captured: Production environment, `Tue at 3:00 AM · America/New_York`; docs and marketing pages re-checked live | `capture/clean/schedule.json`; [S1]–[S8] |

Docs versions: the CI guides pin `replayqa@0.2.4` ([S2], [S3]).

---

## 3. People

N/A. This is a product promo. No real person is depicted. The only on-screen "people" are the generic developer and critic agents in the `agentPair` beat, which belong to another topic.

## 4. The belief of the age

N/A as history. The framing the product argues against can be stated as a premise without attributing it to anyone: end-to-end tests are something your team writes, hosts and remembers to run. The vendor's counter-claim is "No test suite to write or maintain" ([S6], how-it-works). The film should not name competitors (look.md "Never: other companies' brands").

---

## 5. Experiments and results (mechanics, with numbers)

### 5.1 Environments and schedules (settings page)

From the `schedule` take (1440 × 900 viewport, 12,961 ms, 2 redactions, 0 clicks) at its marks:

| Mark | ms | What is on screen (verbatim DOM text) |
|---|---|---|
| `start` | 0 | Settings for project "collaborative-ai-editor.brett-lamy.workers.dev" |
| `polish` | 2226 | "Polish passes" row: "Network Performance, Layout Shift, Glitches, User Experience" · "4 enabled" |
| `schedule` | 8808 | "Environments" · "Production" badge · `https://collaborative-ai-editor.brett-lamy.workers.dev/` · chip **"Tue at 3:00 AM · America/New_York"** · "Edit" · "Delete environment" |
| `add-env` | 11458 | "Add environment" · **"Add production, staging, development, preview, or local configuration."** |
| `end` | 12961 | — |

Header copy (DOM text mutation in the take, and in the digest): "How this project is configured. Edit settings and environment schedules here, or ask QA in the chat — both make the same change." In the take the sentence continues with "Provider authentication, members, and logins hand off to the chat." The digest drops that tail.

Other QA-configuration rows in the same take, verbatim:
- "Project status" · "Running test loops automatically." · **"Active"** · "Pause"
- "Budget" · "Credits QA may spend before the project pauses." · "1000000 credits"
- "Security testing" · "Probe for injection, access-control and data-exposure bugs. Needs proof you own the app." · "Off"
- "Processing concurrency" · "Containers running QA at once." · **"5 max"**
- "Parallel MCP" · "Run up to five recording-driver tasks per harness. Harness capacity scales automatically outside the project container limit." · "Off"
- "Integrations": "Vercel preview access" ("No bypass secret configured."), "GitHub" ("Not connected"), "Issue tracker" ("Where QA files discovered bugs." · "Not configured"), "Logins & variables" ("1 set")
- Usage summary: "72.5" Credits used · "1,000,000" Credit budget · "274" Metered tasks

**Environment kinds**: production, staging, development, preview, local (the add-env copy). Badge CSS classes in every take include all five kinds (`environment-badge--production`, `--staging`, `--development`, `--preview`, `--local`), and some takes also carry `--default` (the runs table's "Project default" environment, which is a fallback label, not a sixth kind you can add), plus an `environment-schedule-editor` with `environment-schedule-days`, so the editor lets you pick days of the week. The API ties two kinds to tunnels. `POST /projects/{id}/reverse-proxy` "Idempotently creates or updates the **Local** environment for an interactive client or the **Preview** environment for CI" ([S5] openapi.json). In plain terms: a laptop tunnel becomes "Local", and a CI tunnel becomes "Preview".

**Cadence**: the pricing FAQ says, verbatim, "Yes. You can configure daily or weekly scheduled runs in project settings. Great for teams who want a nightly batch of fresh issues ready when the workday starts." ([S7]). How-it-works adds: "You can also set a daily or weekly schedule — useful for overnight runs that give your team fresh issues every morning." ([S6]).

**Proof the schedule fires (this account).** The Usage list in the same take ("Credit usage for this project — every metered task and the credits it consumed.") has rows dated Sep 1, Sep 8, Sep 15, Sep 22, Sep 29 and Oct 6, 2026. All six are Tuesdays, and each batch starts at 3:00 AM (for example "Oct 6, 2026, 3:00 AM" and "Sep 29, 2026, 3:00 AM", with the batch running to about 4:30 AM). Row counts per day visible in the take: Sep 1 = 44, Sep 8 = 33, Sep 15 = 34, Sep 22 = 34, Sep 29 = 34, Oct 6 = 34. *Caveats*: (a) displayed times are in the capture browser's locale, presumably ET, which would line up with America/New_York, but that is inferred; (b) the list may be paginated, so treat the counts as "visible in the take", not totals; (c) no row for Tue Oct 13 appears.

Teen-level intuition: an environment is an address plus an alarm clock. "Production at this URL, every Tuesday at 3 AM New York time": while you sleep, the project wakes up, replays its journeys in real browsers, records every one, and has fresh bugs waiting by morning.

### 5.2 GitHub: main branch and pull requests

Docs: "Continuous QA from GitHub" [S1]. API reference: GitHub App SKILL.md [S4].

**Main-branch modes** (docs labels → API `mainBranchTesting` enum):
| UI/docs label | API value | Mechanism |
|---|---|---|
| None | `none` | Not tested automatically |
| Detect main branch deployments | `detect` (**API default**) | "After each push to `mainBranch`, QA polls `mainBranchDeploymentUrl` until the deployed app changes, then tests it." [S4] |
| Listen to GitHub events | `events` | "QA tests when GitHub reports a successful deployment of `mainBranch` (`deployment_status`, Netlify commit status)." [S4] |
| (not in docs) | `environment` | "Reserved. Not available." [S4]. Do not mention it in the film. |

**PR modes** (`prTesting`, API default `none`): None, or Listen to GitHub events: "Each pull request revision is tested against its preview deployment, and the results are posted back to the pull request." [S1]

**PR lifecycle** [S4 §4]:
- opened / new commit / reopened / ready for review → "QA queues a run for the head commit. It posts an in-progress check and a "waiting for deployment" comment."
- draft → ignored until ready for review; converting to draft cancels running QA.
- new commit while a run is active → older run's check concluded `cancelled` ("Superseded").
- closed or merged → open runs cancelled.

**Preview URL discovery** (first that yields a URL wins) [S4 §4.1]: (1) a successful `deployment_status` for a preview environment on the head commit; (2) a successful commit status carrying the URL, such as Netlify `deploy-preview`; (3) a PR comment with a matching URL whose author is a `[bot]` account or a repository owner, member or collaborator (Replay's own bots are never used as a source); (4) polling "every minute at first, then every 5 minutes, for about 2 hours." "Production deploys of the same commit are never used for a PR." Previews on `*.netlify.app` / `*.vercel.app` are recognised automatically. Other hosts need `prPreview.target_url_pattern`.

**Results on GitHub** [S4 §5; S1]: "One **"Replay QA" check** per QA project on the PR head commit", plus "One **sticky PR comment** per QA project is updated in place." The comment lists the result, new bugs with links, journeys created/updated/removed, coverage screenshots, and linked-bug verification results. Docs phrasing: "Replay QA posts one comment on the pull request and edits it in place as results come in, and reports a Replay QA check on the commit." [S1]

**Journey rules**: main-branch rounds may create, update or remove journeys. PR rounds may add journeys for the change and "do not modify the project's existing journeys." [S1]

**Skip rules**: `.github/replay-qa.yml` → `ignorePaths`. A PR whose *every* changed file matches gets a `skipped` check. The file is read from the PR's **base** branch, so a PR cannot exempt itself. It "Fails open" when the file is missing or invalid, GitHub is unreachable, or the PR has **3000 or more** changed files. [S4 §3.3]

**Require approval** [S1]: Off (default): the check reports failure when bugs are found and neutral otherwise, so it "never blocks a merge." On: success only for a clean run and failure when bugs are found. Make it a required status check to block merges. *Contested*: see 7.2.

**Hosting** [S1]: Vercel and Netlify report both preview and production deployments to GitHub, so "Listen to GitHub events" works for both. The deployment URL must be reachable without a password in front of it. App logins are fine (given as test logins). For protected Vercel previews there is "Vercel preview access" (the settings take tells you to create a Protection Bypass for Automation secret).

**Limitation** [S1]: "GitHub is the only supported repository host. GitLab and Bitbucket are not supported."

### 5.3 A PR build that exists only in CI (the tunnel)

Docs: GitHub Actions [S2], CircleCI [S3]. Mechanism, step by step (GitHub Actions):
1. Checkout and build the PR; start the app on a local port (example: `127.0.0.1:3000`, readiness loop of 60 one-second `curl` tries).
2. `replayqa proxy --ci --json` opens an **authenticated, outbound reverse-proxy tunnel** from the runner. The workflow waits for the JSON event `{"event":"heartbeat","ready":true}`. "--ci is important: it identifies this as a workflow-owned connection so opening the tunnel does not start the project's ordinary manual journey backlog." "The JSON heartbeat is the readiness contract; a connected tunnel by itself does not prove the local app is reachable."
3. `replayqa ci --project … --repository … --pr-number … --head-sha … --branch … --workflow-run-id … --prompt "Test the critical user flows"` "replaces any older in-flight run for the same pull request and creates a PR-linked test run for the current commit" (API: `POST /projects/{id}/ci-runs`, "Cancels queued or running Replay work for the same repository and pull request, then creates a version-backed exploration linked to that PR. GitHub Actions remains responsible for the visible check result." [S5]).
4. Poll `POST /projects/{id}/ci-runs/status` **every 15 seconds** until `"terminal": true`; "Treat a terminal status other than completed as a failed CI job."
5. On SIGINT/SIGTERM, `replayqa ci-cancel` cancels only the matching run.

Numbers in the reference workflow [S2]: `REPLAYQA_PROXY_TIMEOUT_MS: '300000'` (5 min), `REPLAYQA_PROXY_PORT: '18888'`, `REPLAYQA_RUN_TIMEOUT_MS: '3600000'` (1 h), job `timeout-minutes: 75`, `REPLAYQA_RUN_MARKER: pr-${{ github.event.pull_request.number }}`. Runs only on non-draft, same-repository PRs, because GitHub does not expose Actions secrets to forks. Verification checklist: "Replay QA shows one run with source GitHub Actions", the run's "Pull request column links to the correct repository and PR number", "no additional Manual run is created when the reverse-proxy tunnel connects", and "pushing another commit cancels the old workflow and supersedes its Replay QA run."

CircleCI [S3]: same `replayqa proxy --ci --json` heartbeat. An eligibility guard skips drafts, forks, closed PRs and stale commits, and fails rather than skips if the GitHub API errors. The workflow ID is combined with the build number so a rerun gets a distinct identity. QA "can take up to an hour", with a 70-minute outer timeout and a 75-minute no-output timeout. "The Replay QA API also replaces the earlier in-flight revision when a newer run starts for the same PR."

**Seen in this account**: project "Reminders · CI" (target `http://127.0.0.1:3000`) shows "Replay QA CI marker: pr-3" in its exploration panel. That is the `REPLAYQA_RUN_MARKER pr-N` convention from [S2]. Sibling projects "Reminders · CircleCI" (`http://127.0.0.1:3000`) and "Reminders · Production" (`https://replayqa-cli-in-ci.vercel.app`) match the docs' pattern of one reverse-proxy project per CI integration plus a public production project ([S2] "create a separate reverse-proxy project for that integration"; "Run QA after a production deployment").

Teen-level intuition: the PR's app lives for a few minutes on a rented CI computer with no public address. The CLI phones out to Replay and holds the line open, so Replay's browsers can reach in. When the test ends, it hangs up.

### 5.4 Where bugs go

[S1] "Send bugs to your issue tracker". Every confirmed bug is filed as an issue containing "the full bug report as Markdown and a link back to the bug in Replay QA." There are two GitHub paths: `fileIssues` on the GitHub connection (through the App, no extra credential), or a tracker set up from the chat. *Contested detail*: the GitHub App SKILL.md [S4] labels `fileIssues` "Legacy", while [S1] presents it as a current path. Say "file bugs to GitHub Issues, Linear or Jira" and do not name the `fileIssues` toggle. The chat-configured trackers are GitHub Issues (repository URL + a token with repo/Issues scope), Linear (API key + team ID) and Jira (site URL, project key, filing account and its API token). A rediscovered bug "is recorded against the existing bug and does not create a new issue." Warning: enabling both GitHub paths files every bug twice. In the requester's settings take, "Issue tracker" reads "Not configured" and "GitHub" reads "Not connected".

PR-closed status: see the contested note in 7.1.

### 5.5 "Fully managed": what the settings words mean

- **Project status Active, "Running test loops automatically."** An active project schedules its own work. "A paused project schedules nothing." [S8 concepts]. "Every edit to a journey creates a new version of it and, if the project is active, schedules a run." [S8]. Concepts also says: "With GitHub connected, every new build starts the loop over on its own." [S8]
- **Budget.** "Credits QA may spend before the project pauses." Replay QA "pauses a project itself when it reaches the project's credit budget or the account runs out of credits, and tells you in the project chat." [S8]. The `runs` take shows that chat message in practice ("Project paused — your account is out of credits."). Crop it out of any shot.
- **Processing concurrency (5 max).** "Containers running QA at once." So a project can run up to 5 containers in parallel. How-it-works: "spins up a swarm of agents that runs all of the mapped journeys in parallel, in a browser." [S6]
- **Time limit** (API only): `time_limit_minutes` 1–10080 per run. When a deadline expires the project is paused, remaining work is cancelled and "eligible unfinished work is refunded". Containers are stopped by a deadline sweep "every minute in production". [S5]
- Credits: "A credit maps to any meaningful work done by Replay QA. A user journey discovered, a bug found and analyzed. To run QA on a web app of average complexity, expect to spend around 20 credits." [S7]

---

## 6. Verified quotes (on-screen product copy and vendor copy; no people)

| Text (verbatim) | Where | Context |
|---|---|---|
| "How this project is configured. Edit settings and environment schedules here, or ask QA in the chat — both make the same change." | `capture/clean/schedule.json`; `account-digest.json` settings_page_facts.header | Settings page header (owner view) |
| "Tue at 3:00 AM · America/New_York" | `capture/clean/schedule.json` @ 8808 ms | Schedule chip on the Production environment |
| "Add production, staging, development, preview, or local configuration." | `capture/clean/schedule.json` @ 11458 ms; digest | Add environment row |
| "Running test loops automatically." / "Active" | `capture/clean/schedule.json`; digest | Project status |
| "Containers running QA at once." / "5 max" | `capture/clean/schedule.json`; digest | Processing concurrency |
| "Credits QA may spend before the project pauses." | `capture/clean/schedule.json`; digest | Budget |
| "Replay QA CI marker: pr-3" | `capture/clean/runs.json` | Exploration panel of "Reminders · CI" |
| "Another push supersedes the running round. Closing the pull request cancels it." | [S1] | PR flow |
| "GitHub is the only supported repository host. GitLab and Bitbucket are not supported." | [S1] | Limitations |
| "Yes. You can configure daily or weekly scheduled runs in project settings." | [S7] pricing FAQ (read in Chrome 2026-10-14) | "Can I schedule Replay QA to run on a set cadence?" |
| "a new test run triggers on every push to main and with every PR (configurable)." | [S6] how-it-works, section 06 "The Loop" | Continuous triggers |
| "Connect a GitHub repository and Replay QA becomes an always-on quality gate." | [S9] Help center, Jul 2, 2026 | Vendor help article |

No quotes from people are used. quotes.json can stay empty for this topic.

---

## 7. Debates and controversies (inconsistencies in the vendor's own sources)

### 7.1 What happens to PR bugs when the PR closes (CONTESTED, vendor sources disagree)
- Docs, Continuous QA from GitHub [S1]: "When the pull request closes, its open bugs move to the pr-closed status so they do not linger in the project's bug list."
- Bug reports reference [S10]: the status table lists only open / fixed / wontfix / invalid. "fixed" can be set by "Replay QA when a PR merges", and "wontfix" by "Replay QA when a PR closes unmerged".
- GitHub App SKILL.md [S4]: "closed or merged | Open runs are cancelled. On merge, linked bugs are resolved."
- OpenAPI bug status enum [S5]: `open, fixed, wontfix, invalid`. There is no `pr-closed`.
- The digest's `bug_statuses_seen`: fixed, invalid, wontfix, open (no pr-closed).
- **Film guidance**: do not show or say "pr-closed". Safe line: "PR bugs stay with the PR and don't clutter your main bug list." Even that comes from [S1] alone, so it is optional.

### 7.2 Require approval (PARTLY UNVERIFIED)
- [S1] documents Off (default: failure on bugs, neutral otherwise, "never blocks a merge") and On (success only for a clean run), "set through the REST API as the requireApproval field".
- The OpenAPI `github` schema [S5] has `repoUrl, mainBranch, mainBranchTesting, mainBranchDeploymentUrl, prTesting, fileIssues, prPreview, accessTokenSet` and **no `requireApproval`**. SKILL.md [S4] never mentions it and describes `success` as "QA completed with no new bugs and all linked bug fixes verified" (no neutral state).
- **Film guidance**: safe to say "a Replay QA check on every PR" and "make it required to gate merges" (branch protection is GitHub's own feature). Avoid naming the "Require approval" toggle on screen.

### 7.3 Mode count
Docs list three main-branch modes. The API enum has four, but the fourth (`environment`) is "Reserved. Not available." [S4]. Say three.

### 7.4 Polish passes count, settings take vs digest
`account-digest.json` says "Network Performance, React Rendering, Layout Shift, Glitches, User Experience, Accessibility, UI Details (7 enabled)". The `schedule` take (the collaborative-ai-editor project, at mark `polish` 2226 ms) shows "Network Performance, Layout Shift, Glitches, User Experience" · "**4 enabled**". The two came from different projects or moments. **On screen, the take wins**: if the polish row is visible, any overlay must read "4 enabled". Do not overlay "7". The digest's "Budget" and "Security testing" copy also differs a little from the take ("Needs proof you own the app." is in the take only). Use the take's text.

### 7.5 look.md PR claims vs `per_pull_request_projects = []` (RECONCILED)
- look.md: `runs` "(list → scrolled: PR #3 / PR #1 environments)". **VERIFIED.** At mark `list` (3668 ms) the Test Runs table of "Reminders · CI" has the header "Created / Description / Environment / Status / Bugs / Journeys". Its rows include "08/16/2026 · PR #3: PR #3 · **PR #3** · Completed", "… PR #1: PR #1 · **PR #1** · Completed", and "… · Project default · …" for non-PR runs. That is 13 runs from 08/12/2026 to 08/16/2026. One honest nuance: this project tests a CI build through the tunnel (target `127.0.0.1:3000`). It does not use the GitHub-App preview flow.
- look.md: `projects` "(scrolled, filtered = per-PR projects)". **VERIFIED from the DOM.** At ~5.7–6.2 s the take types "P", "PR", "PR ", "PR #" into the sidebar "Filter by name…" box. At `filtered` (6306 ms) the sidebar lists exactly **27** entries "ExampleApps PR #6 … #11 - <app>" (apps: blamy-notes, github-clone, acctual, substack-clone, todoist-clone, digg-clone, pampam-clone, linear). The main grid (50 cards) still shows every project. All 27 PR-named projects have Netlify `deploy-preview-N--<site>.netlify.app` targets: 17 on `replay-<app>` sites and 10 on other sites (`blamy-broken-linear-<app>` ×6, `blamy-notes` ×1, `todoist-clone-loopqa-4271` ×3). Do not write the `--replay-<app>` pattern as if it covered all 27.
- Digest: `per_pull_request_projects: []` and `projects_total: 20`. `tools/promo/account-digest.mjs` computes the field as `projects.filter((p) => /PR #\d+/.test(p.name))` over `capture/api/projects.json`, which holds one page of `GET /api/v1/projects` (default `page_size` 20 per [S5]). Insights says **50** projects. The PR-named projects (card dates June 12–16) sit past the first 20 results. **Conclusion: the empty list is a pagination artifact, not evidence that PR projects are missing.** (Fact-check: strongly supported inference, not directly verified. The raw dump in `capture/api/` is off limits, and `tools/promo/api-dump.mjs` takes the API path on the command line, so the exact query used is not recorded. The take's grid shows 50 cards, insights says 50, and `projects_total` 20 equals the OpenAPI `page_size` default of 20.) Recommend re-running the digest with `page_size=100` before the fact-check is closed.
- Label: "per-PR projects exist in this account" = VERIFIED (takes). "These were created automatically by the GitHub App on each PR" = **UNVERIFIED for this account**: nothing captured shows how they were made, and the docs' GitHub-App model puts PR revisions in one project as **versions**, not separate projects. The film should present them as "projects pointed at PR previews", or just let the filtered list read "PR #…" without claiming automation.

---

## 8. Misconceptions to avoid

1. "Replay QA tests every commit." No. It tests each **PR revision** once its preview is live, and each **main-branch deployment** (or change at the deployment URL). Drafts are ignored, PRs touching only `ignorePaths` are skipped, and a new push supersedes the running round.
2. "Every night" as a fact about this account. The captured schedule is **weekly** (Tuesdays at 3:00 AM ET). Nightly (daily) is a documented capability [S7] but is not what the take shows. Do not overlay "every night" on the "Tue at 3:00 AM" chip.
3. "Works with GitLab/Bitbucket." No. GitHub only.
4. "It blocks merges by default." No. Default check behaviour "never blocks a merge"; blocking requires making the check required (and see 7.2).
5. "You need a public URL." No. Localhost (managed reverse proxy) and CI-only builds (CLI tunnel) are supported.
6. "PR rounds rewrite your test suite." No. PR rounds only add PR-scoped journeys; main-branch rounds may update or remove them.
7. "Unlimited parallelism." Processing concurrency is "5 max" containers per project.
8. Showing the `runs` take uncropped. It includes a chat thread about the account running out of credits and a credit meter reading "8807.5 of 500 credits". Crop to the Test Runs table (Environment column).
9. "pr-closed" as a status name (see 7.1).
10. Saying the environment schedule is a cron expression. The UI shows days plus a time plus a timezone. The underlying representation is not documented.

---

## 9. Curiosity hooks (true, sourced)

1. The schedule really fires: six Tuesdays in a row (Sep 1 to Oct 6, 2026), each batch starting at **3:00 AM**, about 34 journey tasks per Tuesday run (33–44 visible rows). (`capture/clean/schedule.json`)
2. A PR's app can live entirely inside a CI runner on `127.0.0.1:3000`. The CLI phones out with a tunnel and waits for a `{"event":"heartbeat","ready":true}` before testing starts. [S2]
3. Push again mid-test and the old round is not left running in parallel. It is superseded, and the old check closes as `cancelled` ("Superseded"). [S1][S4]
4. A PR cannot exempt itself from QA: `ignorePaths` is read from the **base** branch, and it fails open past **3000** changed files. [S4]
5. Replay QA keeps looking for a missing preview URL every minute at first, then every 5 minutes, for about 2 hours. [S4]
6. "Production deploys of the same commit are never used for a PR." [S4]
7. One sticky comment, edited in place: no PR-comment spam however many pushes you make. [S1][S4]
8. A CI tunnel automatically becomes the project's **Preview** environment, and a laptop tunnel becomes **Local**. [S5]
9. The project pauses itself at its budget, so a forgotten schedule cannot run up an unbounded bill. [S8]
10. Credits: about 20 for an app "of average complexity". [S7]

---

## 10. Visual and dramatic details (for the art department and shot authors)

- **Schedule chip** (`schedule` take, 8808 ms): a green "ok" chip (`settings-row__chip--ok`) reading "Tue at 3:00 AM · America/New_York" beside a "Production" badge (`environment-badge--production`, green text rgb(21,128,61) on rgb(236,253,245)). The staging badge is amber (rgb(180,83,9) on rgb(255,251,235)). The development badge is blue (rgb(29,78,216) text). Crop tight to the chip and zoom. It is the money frame for "every night/week".
- **Add-env line** (11458 ms): crop to "Add environment · Add production, staging, development, preview, or local configuration." A good place to kinetic-type the five kinds as pills: production / staging / development / preview / local.
- **Status row**: "Active" + "Running test loops automatically." is the "fully managed" frame; "5 max" for concurrency.
- **Runs take**: crop to the Test Runs table and its **Environment** column ("PR #3", "PR #1", "Project default") at `list` 3668 ms. Do not show the left chat column (credits-exhausted thread).
- **Projects take**: the typed filter "PR #" at ~6.2 s and the sidebar collapsing to 27 "ExampleApps PR #N - …" names is the kinetic proof for "every PR". The grid behind still shows all 50.
- Mood: a 3:00 AM Tuesday works well as a visual idea: dark paper haze, a clock chip, recordings stacking up while the house sleeps, and by morning a stack of fresh bug cards. Keep within look.md palettes (`dawn` haze for morning; avoid adding a night palette unless look.md allows).
- No GitHub logo or brand marks (look.md: other companies' brands are off-limits). Write "pull request", "PR #3", "check" in our own type, not as GitHub UI mockups.

### The kinetic line "Every deploy. Every PR. Every night."
- "Every deploy": supported. Main-branch testing starts "whenever a new deployment of the default branch is live" [S1 "What you get"].
- "Every PR": supported. "Pull request testing on each revision" [S1]; how-it-works: "with every PR (configurable)" [S6]. It is opt-in (`prTesting` default `none`), so "every" means every PR once connected.
- "Every night": supported as a **capability** ("daily or weekly scheduled runs" [S7]; "useful for overnight runs" [S6]). The account's captured schedule is weekly. Narration can say "Every deploy. Every PR. Every night." as long as the frame under "Every night" is not the "Tue at 3:00 AM" chip, or the chip is shown under an alternative line. Safest fully-literal alternatives: "Every deploy. Every PR. On a schedule." or "… Every Tuesday, 3 AM." (the latter matches the take exactly).

---

## 11. Sources

1. [S1] Continuous QA from GitHub — https://docs.replay.io/basics/replay-qa/github (local: `films/replay-qa-promo/research/sources/basics_replay-qa_github.txt`; re-checked live 2026-10-14, wording identical)
2. [S2] Testing a pull request build in GitHub Actions — https://docs.replay.io/basics/replay-qa/frpc-ci (local: `research/sources/basics_replay-qa_frpc-ci.txt`)
3. [S3] Testing a pull request build in CircleCI — https://docs.replay.io/basics/replay-qa/circleci (fetched 2026-10-14)
4. [S4] Replay QA GitHub App SKILL.md — https://qa.replay.io/api/v1/skills/github-app/SKILL.md (public, fetched 2026-10-14)
5. [S5] Replay QA OpenAPI — https://qa.replay.io/api/v1/openapi.json (local: `research/sources/openapi.json`): `PATCH /api/v1/projects/{project_id}` (github, status, time_limit_minutes), `POST /projects/{id}/reverse-proxy`, `POST /projects/{id}/ci-runs`, `/ci-runs/status`, `GET /api/v1/projects` (page_size default 20)
6. [S6] How Replay QA works — https://www.replay.io/how-it-works (read in Chrome 2026-10-14)
7. [S7] Replay QA Pricing and FAQ — https://www.replay.io/pricing (read in Chrome 2026-10-14; FAQ accordions expanded)
8. [S8] How Replay QA models your app — https://docs.replay.io/basics/replay-qa/concepts (local: `research/sources/basics_replay-qa_concepts.txt`); Getting good results — https://docs.replay.io/basics/replay-qa/getting-good-results (local copy); Replay QA overview — https://docs.replay.io/basics/replay-qa/overview (local copy)
9. [S9] What is Replay QA? (Replay QA help center, Jul 2, 2026) — https://intercom.help/replay-builder/en/articles/15809468-what-is-replay-qa
10. [S10] Bug reports reference — https://docs.replay.io/reference/replay-qa/bug-reports (local: `research/sources/reference_replay-qa_bug-reports.txt`)
11. Account digest — `films/replay-qa-promo/research/sources/account-digest.json` (settings_page_facts, insights.projects = 50, projects_total = 20, per_pull_request_projects = [])
12. Digest generator — `tools/promo/account-digest.mjs` (line 29: the `/PR #\d+/` filter over page 1 of projects)
13. Take `schedule` — `films/replay-qa-promo/capture/clean/schedule.json` (marks start 0, polish 2226, schedule 8808, add-env 11458, end 12961)
14. Take `runs` — `films/replay-qa-promo/capture/clean/runs.json` (marks start 0, list 3668, scrolled 5923, end 6573)
15. Take `projects` — `films/replay-qa-promo/capture/clean/projects.json` (marks start 0, scrolled 3348, filtered 6306, end 6956)
16. Look — `films/replay-qa-promo/look.md`; Brief — `films/replay-qa-promo/brief.md`
17. Lead only (not a source): Product Hunt "Replay QA for Teams" — https://www.producthunt.com/p/replayio/replay-qa-for-teams

---

## Fact-check log (adversarial pass, 2026-10-14)

Method: the cleaned takes were re-read from their rrweb events. The `projects` take was replayed to the `filtered` mark (6306 ms) with a minimal DOM rebuilder, so the sidebar list and the grid cards were counted as they stand at that moment. Local doc copies, `openapi.json`, `account-digest.json` and `tools/promo/account-digest.mjs` were read directly. Live sources were fetched on 2026-10-14 over plain HTTPS without credentials: docs.replay.io `/basics/replay-qa/github` and `/basics/replay-qa/circleci`, the public SKILL.md at qa.replay.io, www.replay.io `/pricing` and `/how-it-works`, and the Intercom help article. `capture/api/` was not opened.

**Confirmed, unchanged** (the source is in brackets):
- Schedule chip "Tue at 3:00 AM · America/New_York" in the Environments section; the take script hovers that text just before mark `schedule` 8808 ms [`capture/clean/schedule.json`; `capture/takes/schedule.mjs`].
- "Add production, staging, development, preview, or local configuration." at mark `add-env` 11458 ms [schedule take].
- Usage rows: Sep 1 = 44, Sep 8 = 33, Sep 15 = 34, Sep 22 = 34, Sep 29 = 34, Oct 6 = 34. Every batch starts at 3:00 AM, all six dates are Tuesdays, the rows are "Journey" tasks, and there is no Oct 13 row. The last row of each batch ends between 3:49 AM (Sep 22) and 5:16 AM (Sep 15) [schedule take].
- Settings rows, verbatim: "Running test loops automatically." / "Active"; "Credits QA may spend before the project pauses." / "1000000 credits"; "Containers running QA at once." / "5 max" (the DOM chip holds the nodes "5" and " max"); Polish passes "Network Performance, Layout Shift, Glitches, User Experience" / "4 enabled"; usage "72.5" / "1,000,000" / "274" [schedule take]. The digest says "7 enabled", which contradicts the take, so the take wins on screen.
- Pricing FAQ, verbatim: "Yes. You can configure daily or weekly scheduled runs in project settings. Great for teams who want a nightly batch of fresh issues ready when the workday starts." How-it-works, verbatim, section 06 "The Loop": "…a new test run triggers on every push to main and with every PR (configurable). You can also set a daily or weekly schedule — useful for overnight runs that give your team fresh issues every morning." Also "spins up a swarm of agents that runs all of the mapped journeys in parallel, in a browser." and "A credit maps to any meaningful work … expect to spend around 20 credits." [https://www.replay.io/pricing; https://www.replay.io/how-it-works]
- Main-branch modes None / Detect main branch deployments / Listen to GitHub events; API `mainBranchTesting` enum none/detect/events/environment with default `detect`; `environment` is "Reserved. Not available." (the same is true of `prTesting`, whose default is `none`) [S1 live; S5; S4].
- PR flow: one comment edited in place; a Replay QA check; "Another push supersedes the running round. Closing the pull request cancels it."; older check concluded `cancelled` ("Superseded"); drafts ignored until ready for review [S1 live; S4].
- Preview discovery order; polling "every minute at first, then every 5 minutes, for about 2 hours"; "Production deploys of the same commit are never used for a PR." [S4]
- CI tunnel: `replayqa proxy --ci --json` waits for a heartbeat with ready: true; `replayqa ci` "replaces any older in-flight run for the same pull request"; polling "every 15 seconds"; `REPLAYQA_CLI_VERSION: '0.2.4'`, `REPLAYQA_RUN_TIMEOUT_MS: '3600000'`, `timeout-minutes: 75`, `REPLAYQA_PROXY_TIMEOUT_MS: '300000'`, port 18888, readiness loop `{1..60}` with `sleep 1` [S2]. CircleCI: same heartbeat; "can take up to an hour"; 70-minute outer timeout; 75-minute no-output timeout; drafts, forks, closed PRs and old revisions skip; an API error fails rather than skips; workflow ID plus build number [S3 live].
- Reverse-proxy endpoint: "Idempotently creates or updates the Local environment for an interactive client or the Preview environment for CI" [S5].
- Issue filing to GitHub Issues, Linear or Jira with "the full bug report as Markdown and a link back"; a rediscovery "does not create a new issue"; "GitHub is the only supported repository host. GitLab and Bitbucket are not supported." [S1 live]
- Pausing at the budget or when the account is out of credits [S8 concepts].
- Runs take: "Reminders · CI" on `http://127.0.0.1:3000`. The table has the header Created/Description/Environment/Status/Bugs/Journeys and 13 rows: 12 dated 08/16/2026 (Environment PR #3 ×5, PR #1 ×3, Project default ×4) and "Initial Test Run" dated 08/12/2026 (Project default, Failed). An exploration description ends "Replay QA CI marker: pr-3" [`capture/clean/runs.json`].
- Projects take: the filter is typed P → PR → "PR " → "PR #" between 5700 and 6186 ms. At `filtered` 6306 ms the sidebar lists exactly 27 "ExampleApps PR #N - <app>" entries (PR #6 to #11, 8 apps), and the grid has 50 cards. PR card dates: 9 on 6/12, 15 on 6/15, 3 on 6/16. Reminders · CI 8/16, Reminders · Production 8/16, Reminders · CircleCI 9/22, Electric Forest PR 4650 Preview 9/23 [`capture/clean/projects.json`].
- Help article "Connect a GitHub repository and Replay QA becomes an always-on quality gate." The page shows the date July 2, 2026 [S9 live].
- Pricing and how-it-works are verbatim as quoted, so no quote was demoted. All on-screen quotes in section 6 trace to a take or a live vendor page.

**Corrected**:
1. Timeline (Jun 12–16) and section 7.5 said that all 27 PR projects target `deploy-preview-N--replay-<app>.netlify.app`. Only 17 do. The other 10 use other Netlify sites (`blamy-broken-linear-<app>` ×6, `blamy-notes` ×1, `todoist-clone-loopqa-4271` ×3). All 27 are still Netlify deploy-preview URLs. [projects take replayed at 6306 ms]
2. Section 5.1 said the badge CSS included only production, staging and development. The takes carry all five kinds, and some also carry `--default` (the "Project default" fallback). [grep of `capture/clean/*.json`]
3. Section 5.2, preview discovery: a PR comment author may be a `[bot]` or a repository owner, member or collaborator, and Replay's own bots are excluded. The dossier had said "a `[bot]` or a repository member". [S4 §4.1]
4. Section 9, hook 1, said "about 34 journey tasks a night", which implies a daily cadence. It now says "per Tuesday run (33–44 visible rows)". [schedule take]
5. The method note said the marketing pages "only render in a browser". Their quoted text is in the server HTML, and a plain fetch returned it on 2026-10-14. This does not change any claim. [www.replay.io/pricing, /how-it-works]

**Contested (added)**: SKILL.md [S4] labels the `fileIssues` GitHub setting "Legacy", while [S1] presents it as a current path. Do not name the toggle on screen. The disputes over the "pr-closed" status (7.1) and requireApproval (7.2) were re-checked: [S1] live still says pr-closed and requireApproval; the OpenAPI bug status enum is open/fixed/wontfix/invalid; the OpenAPI `github` schema has no `requireApproval`. Both stay contested, so keep both off screen.

**Unverifiable**:
- Whether the 27 "ExampleApps PR #N" projects were created automatically (by the GitHub App or otherwise). Nothing captured shows how they were made, so they stay UNVERIFIED.
- The pagination explanation for `per_pull_request_projects = []` is a strongly supported inference (projects_total 20 = default `page_size` 20, while the grid and insights both show 50). The exact API query is not recorded (`api-dump.mjs` takes the path as a CLI argument), and the raw dump is off limits.
