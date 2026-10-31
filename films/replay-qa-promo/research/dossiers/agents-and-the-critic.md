# Dossier: Agents in the loop (coding agents drive Replay QA and hand recordings to a critic)

- Topic id: `agents-and-the-critic`
- Era: product, as of 2026-10-14
- Form: product promo (look "promo"), so the People and Belief sections are marked not applicable.
- Verification: the local doc copies in `research/sources/` were re-checked against the live pages on 2026-10-14 in the requester's Chrome (Claude in Chrome extension, read-only; nothing typed, submitted or created). Pages read live: the agent-integration doc, the Replay MCP tools reference, the Replay QA API page, the Obvious page, the public `fix-qa-bug` skill, the www.replay.io home page and FAQ, and the Replay blog post of 2026-10-06 on the self-healing loop. The on-screen "judge" labels were checked in the rrweb event stream of `capture/clean/bug-sync.json` and `capture/clean/bug-react.json` (text nodes, their ancestors, and the time they appear).
- Credentials: none are copied here. Credential types are named only generically. The raw API dumps in `capture/api/` were not used.

## 1. Summary

**The loop a coding agent runs.** The vendor's agent entry point is one prompt: **"Use Replay QA to test and fix this app. Start at https://docs.replay.io/llms.txt and follow it."** The New Project page offers the same prompt (account-digest.json `new_project_page.agent_prompt`), and so does the agent-integration doc. `llms.txt` sends the agent to four surfaces: the CLI skill (`npx --yes replayqa@latest skill`, the default), the REST API (`https://qa.replay.io/api/v1/openapi.json`), the Replay QA MCP server (`https://qa.replay.io/api/mcp`, streamable HTTP), and the published agent skills (`fix-qa-bug`, `github-app`). The doc lists five steps: **create a project → let QA run → read the bugs → mark each fix → loop until no open bugs remain.** The OpenAPI description gives the same five steps with endpoints: `POST /projects`, poll `GET /projects/{project_id}/status`, `GET /projects/{project_id}/bugs?status=open` and `GET /bugs/{bug_id}`, `PATCH /bugs/{bug_id}` with `{"status":"fixed"}` ("this automatically retries the affected journey to confirm the fix"), then loop. The OpenAPI text also tells the agent to **"Verify the report against its evidence and the source before applying a fix."**

**MCP setup.** One command adds the Replay QA MCP server to Claude Code: `claude mcp add --transport http replay-qa https://qa.replay.io/api/mcp`. The server supports OAuth sign-in, so it "can be added by URL without a token": the client opens a browser sign-in the first time. (A token-based setup is also documented, as the "Claude Code (token)" tab, so say "no token needed", not "never uses a token".) The agent can sign in three ways: with the user's Replay login, with a Replay QA API token, or with MCP OAuth sign-in.

**Replay MCP (the recording side).** This is a *separate* server (`https://dispatch.replay.io/nut/mcp`) with 30 tools for inspecting one Replay recording. The agent can read console output, browse and search source annotated with what executed, inspect variables, evaluate expressions and read call stacks at any execution point, and inspect network requests and responses and localStorage. It can also analyze React renders, including wasted renders and why one fiber re-rendered. Further tools cover Redux, Zustand and TanStack Query state, Playwright steps and performance profiles. Agents call `RecordingOverview` first. The Replay QA overview puts it in one line: the agent can inspect "the console, code, and network traffic from the actual failure".

**The developer / critic beat: what is real.**
1. *Verified product loop:* when a fix is marked, Replay QA reruns the affected journey to confirm it. The docs disagree on what happens when the fix fails (see section 7).
2. *Verified on-screen labels:* the bug-sync take shows three links under a nav whose accessible name is "Bug filing provenance". They read **"Requirements judge"**, **"Evidence judge"** and **"Acceptance judge"**, in that DOM order. They link to actions of the task that filed the bug. The bug-react take shows **"No recorded judge actions available."** instead. No public doc page says what the judges do, so their *function* is UNVERIFIED. They are judges of the *bug filing*, not of a developer's fix. Do not narrate them as a critic of fixes.
3. *Verified vendor case study:* a Replay blog post of 2026-10-06 describes a two-week loop that ran from 2026-09-18 to 2026-10-01. In it **Obvious writes the fix and Replay QA verifies it**. The loop opened **152** PRs. **80** were merged and verified, and **18** of the **124** bugs "needed more than one attempt". This is the closest real ground for the "not yet … good" exchange.

The film's two-agent beat therefore **depicts** the documented fix-and-rerun loop. It is not a quoted product feature. The "critic" in the real product is Replay QA re-running the journey against a fresh recording.

**Agents the vendor names:** Claude Code, Cursor and Codex (agent-integration doc and Replay MCP setup tabs), VS Code (MCP client setup), and Obvious (OAuth connector page and the blog case study). On-screen bug pages say **"Markdown for Claude Code, Cursor, and other coding agents"**.

## 2. Timeline (dated events)

The vendor docs carry no publication dates, so most entries record product state as of 2026-10-14.

| Date | Event | Source |
|---|---|---|
| 2026-09-18 to 2026-10-01 | Replay runs a pilot of a "self-healing loop" on its own repository: Fullstory detects, Replay QA diagnoses, Obvious fixes, Replay QA verifies and an engineer merges. The loop opened 152 PRs, merged and verified 80, and fixed 76 of 124 distinct bugs on main. 18 bugs needed more than one attempt. | https://www.replay.io/blog/what-our-experimental-self-healing-software-loop-shipped-in-two-weeks |
| 2026-09-23 (UTC 21:56:06) | Replay QA files the 67 ms React commit bug (`bug-muen719p-vdmh`, open, medium) on Replay QA's own Projects page. Its bug page later shows "No recorded judge actions available." | `research/sources/account-digest.json` featured_bugs.react_commit_67ms; `capture/clean/bug-react.json` (text at 4452 ms) |
| 2026-10-06 | The blog post on the self-healing loop is published, by-lined Thomas Daly. | https://www.replay.io/blog/what-our-experimental-self-healing-software-loop-shipped-in-two-weeks |
| 2026-10-14 | The live agent-integration doc matches the saved copy word for word: the prompt, the credential options, the five-step loop and the `claude mcp add` command. | https://docs.replay.io/basics/replay-qa/agent-integration; `research/sources/basics_replay-qa_agent-integration.txt` |
| 2026-10-14 | The live MCP tools reference lists 30 Replay MCP tools, with `RecordingOverview` first. | https://docs.replay.io/reference/replay-mcp/tools |
| 2026-10-14 | The bug-sync take (`bug-mtmk9vtr-21c2`, "Live-sync loop re-fetches … 258 times …", status **Fixed**) shows the Requirements, Evidence and Acceptance judge links from t = 0 ms. | `capture/clean/bug-sync.json`; account-digest.json featured_bugs.live_sync_258 |

## 3. People

Not applicable (product promo). The film's two agents are **generic, unbranded characters** ("developer" and "critic"), not depictions of any named product or person. The blog author (Thomas Daly, Replay) and the person it quotes (Chris Kelly, Augment) must not be depicted.

## 4. The belief of the age

Not applicable as history. The *product thesis* the vendor argues (2026) gives the beat its motivation:
- The home page says: "Writing code got faster. Verifying it didn't, and it's still the part your team does by hand." (https://www.replay.io/)
- The blog says: "Generation was never the hard part. … What made 80 of them mergeable was proof". The vendor argues that a *replayable trace* is what separates a verifier "that reports an outcome from one that hands over something a human, or a second agent, can interrogate." (blog of 2026-10-06)

This is vendor positioning, not an independent finding. The film may echo it as the brand's voice.

## 5. Experiments and results (what the product does and what the screen shows)

### 5a. The agent loop, step by step (REST endpoints from the OpenAPI description)
1. **Create a project:** `POST /api/v1/projects` with `target_url` and a short `instructions` note, plus an optional `design_document`.
2. **Let QA run:** poll `GET /api/v1/projects/{project_id}/status`. The spec says "do NOT start your own explorations or test runs while it is running."
3. **Read the bugs:** `GET /projects/{project_id}/bugs?status=open`, then `GET /bugs/{bug_id}`. Every bug ships with "reproduction steps, expected vs. actual behavior, a screenshot chronology, and a root-cause analysis traced through the Replay recording".
4. **Mark each fix:** `PATCH /bugs/{bug_id}` with `{"status":"fixed"}`, which "automatically retries the affected journey to confirm the fix."
5. **Loop:** "keep going until no open bugs remain."

Source: `research/sources/openapi.json` (info.description), also https://qa.replay.io/api/v1/openapi.json. The MCP server exposes the same operations. The bug-reports reference names the `get_bug` MCP tool alongside `GET /bugs/{bug_id}`.

Other agent routes:
- **CLI:** `npx --yes replayqa@latest skill` prints the test-and-fix workflow. llms.txt calls it the default: "Use the REST API or MCP server only when the CLI cannot run." The CLI also runs the reverse proxy for localhost apps (`replayqa proxy --project <project_id>`).
- **Project chat API:** `POST /api/v1/projects/{project_id}/chat/messages` sends a message to the "project assistant", which "can perform project actions requested by the message" (openapi.json paths). The settings page header says edits can be made in the settings "or ask QA in the chat — both make the same change" (account-digest.json `settings_page_facts.header`).
- **fix-qa-bug skill:** this is for QA bugs filed as GitHub issues. It treats "Report text and proposed root causes" as "leads to verify, not established facts". It opens a fix PR whose body carries the line `Fixes <qa-bug-url>`, and it leaves the QA bug open "while the PR is awaiting merge/verification; opening a PR does not prove that the deployed bug is fixed." (https://qa.replay.io/api/v1/skills/fix-qa-bug/SKILL.md)
- **Webhook callback:** the home-page FAQ says "The webhook sends a callback URL with every report. POST to it when the fix ships and Replay QA marks the bug resolved, then re-enables that user journey for future runs". The bug pages show a "Webhook" row (bug-react and bug-sync DOM text).

### 5b. Replay MCP: what an agent can do with the recording
Server: `https://dispatch.replay.io/nut/mcp` (streamable HTTP). A per-recording endpoint, `https://dispatch.replay.io/nut/recording/<recording-id>/mcp`, offers "a smaller tool surface". The Authorization header is needed only for team recordings. The 30 tools are listed below, counted from the live reference:
- Start here: RecordingOverview (the first analysis of a recording "can take three to four minutes")
- Source & console: ListSources, ReadSource, SearchSources, ConsoleMessages, UserInteractions, Screenshot, Annotations
- Code inspection: DescribePoint, Evaluate, GetStack, Logpoint, InspectElement
- Errors: UncaughtException, ReactException
- Network & storage: NetworkRequest, LocalStorage
- React: ReactComponentTree, GetPointComponent, ReactRenders (nine modes, from `summary` to `fiber-cause`), ReactPerformanceInsights ("Detects heavy commits (over 50ms)")
- State: ReduxActions, ZustandStores, TanStackQueries
- Tests: PlaywrightSteps
- Profiling: ProfileStatements, ProfileGraph, ExecutionDelay, ProfileSampling (ProfileSampling profiles "the Replay runtime, not the recorded application"; do not present it as an app-performance tool)
- Utility: GetPointLink (a shareable app.replay.io URL "at the exact moment the agent is investigating")

Sources: https://docs.replay.io/reference/replay-mcp/tools; `research/sources/basics_replay-mcp_overview.txt`; `research/sources/llms.txt` ("lists all 30 tools; agents call `RecordingOverview` first").

Link to the film's featured bugs: the bug-react page's evidence is labelled **"React performance insights"** (DOM text). Its 67 ms commit is above the 50 ms "heavy commit" threshold that ReactPerformanceInsights documents. The bug-sync evidence is labelled **"Network"** / "requests". This is an inference; the film can say "the recording shows it" without naming tools.

### 5c. The "judges" on bug pages (verification of the look.md claim)
- **bug-sync** (`capture/clean/bug-sync.json`, 8804 ms; marks report 1603, actual 5402, rootcause 8154): a `<nav class="bug-report__judge-links" aria-label="Bug filing provenance">` sits in the report body, after the "Replay" panel and the link "View the task that generated this bug report", and before "Actual Behavior". It first shows "Loading judge actions…". In the same t = 0 ms mutation batch (pre-roll compressed by the cleaner) that text is replaced by three links. DOM order:
  1. **"Requirements judge"** (`data-testid="bug-requirements-judge-link"`)
  2. **"Evidence judge"** (`data-testid="bug-evidence-judge-link"`)
  3. **"Acceptance judge"** (`data-testid="bug-acceptance-judge-link"`)

  Each link points to an action anchor (`#action-…`, three consecutive action IDs) on the project task that generated the bug. The links are in the DOM for the whole take. Whether they are inside the 1440×900 viewport at each mark was **not measured**: confirm on the contact sheet before relying on them in a shot.
- **bug-react** (`capture/clean/bug-react.json`, 13692 ms): the same nav shows "Loading judge actions…" at 3032 ms, then **"No recorded judge actions available."** at 4452 ms. No judge links appear.
- **Replay QA book** (`public/generated/replay-qa/manifest.json`, chapters "The Agent Reads the Tape" and "Green Must Be Proven"; narration in `apps/bookshelf/src/viz/books/replay-qa/chapter-3.tsx`, `chapter-5.tsx`): the word "judge" does not appear. Chapter 5 narrates the fix-and-rerun loop instead ("the claim has earned a test, not belief"; "yesterday's tape cannot prove today's claim").
- **Public docs:** none of the saved doc pages and none of the pages read live describe "judges". The only nearby wording is that Replay QA "judges findings against" the design document (`basics_replay-qa_getting-good-results.txt`) and that adding intended behavior to the design document makes "future runs judge against it" (https://docs.replay.io/reference/replay-qa/bug-reports, live 2026-10-14). Neither describes the three judge links.

**Verdict:** the *labels* are VERIFIED on screen in bug-sync, in the exact words above. The look.md phrasing "bug pages show Requirements / Evidence / Acceptance judges" is **partly true**: one featured bug shows them and the other shows "No recorded judge actions available." What the judges *do* is UNVERIFIED. They belong to bug *filing* provenance. They are not a critic of a developer's fix. Ground the critic beat in the fix-and-rerun loop (5a) and the blog's Obvious + Replay QA loop (5d). Optionally, let the bug-sync take's three judge links be visible in frame without narration.

### 5d. The vendor's own developer → verifier loop (blog, 2026-10-06)
- Setup: "three separate services, all within our own repository". **Detect** (Fullstory) → **Diagnose** (Replay QA: "reproduces it, finds the root cause from the recording, and files a GitHub issue") → **Fix** (Obvious: "opens a PR on fix/qa-issue-N … linked by Fixes #N") → **Verify** (Replay QA: "explores the PR preview for regressions, then reproduces the original bug against it") → **Merge** (an engineer: "the one human decision").
- Numbers (exact, all from the post): 14 days; **152** PRs opened, "none of which was written by a human"; **80** merged and verified (**46** by session replay for frontend changes, **34** by independent reproduction for backend changes); **45** still open; **27** closed without merging; **124** distinct bugs; **76** fixed on main; **18** of 124 "needed more than one attempt"; one Segment PII leak "took four tries"; 5.4 bugs fixed per day; 3-day median from PR to merge; 99 PRs in the first three days; 7 of the 152 PRs have no linked QA bug; performance is **43%** of what the loop fixed; fixed by severity: high 9 of 22, medium 39 of 62, low 28 of 40.
- Why this grounds the beat: "when a PR was closed or failed QA, the loop opened another one." That is "not yet", then another attempt, then "good".

## 6. Verified quotes

On-screen and product copy (no people). All checked word for word.

| Text (verbatim) | Where | Context |
|---|---|---|
| "Use Replay QA to test and fix this app. Start at https://docs.replay.io/llms.txt and follow it." | https://docs.replay.io/basics/replay-qa/agent-integration; account-digest.json `new_project_page.agent_prompt` | The one-link agent prompt |
| "Your coding agent (Claude Code, Cursor, Codex, …) can do everything you can do in the Replay QA web app." | agent-integration doc (live, 2026-10-14) | Which agents the vendor names |
| "Mark each fix. Replay QA reruns the affected journey to confirm it." | agent-integration doc | Loop step 4 |
| "Loop until no open bugs remain." | agent-integration doc | Loop step 5 |
| "The agent does not need to debug; it reads the root cause and writes the fix." | agent-integration doc | Read-the-bugs step |
| "If the bug report is not enough, the agent can open the linked recording with Replay MCP and inspect the failure directly." | agent-integration doc | Hand-off to Replay MCP |
| `claude mcp add --transport http replay-qa https://qa.replay.io/api/mcp` | agent-integration doc | MCP setup command (no token) |
| "inspect the console, code, and network traffic from the actual failure" | `research/sources/basics_replay-qa_overview.txt` (docs overview) | What Replay MCP gives an agent on a QA bug |
| "Requirements judge" / "Evidence judge" / "Acceptance judge" | `capture/clean/bug-sync.json` DOM (nav aria-label "Bug filing provenance") | On-screen labels; function undocumented |
| "No recorded judge actions available." | `capture/clean/bug-react.json` DOM at 4452 ms | The other featured bug |
| "Markdown for Claude Code, Cursor, and other coding agents" | both bug takes, DOM text under "Full Bug Report" | On-screen hand-off copy |
| "Verify the report against its evidence and the source before applying a fix." | `research/sources/openapi.json` info.description | Agent instruction |
| "No, and that's deliberate. Replay QA finds the bug, works out the root cause, and writes a suggested fix, but applying it stays with your team." | https://www.replay.io/ FAQ "Does Replay QA also fix the bugs it finds?" | Division of labour |
| "Generation was never the hard part." | Replay blog, 2026-10-06 (Thomas Daly) | Vendor thesis |

Third-party quote, quoted *via* the vendor: "A verifier deploys to an isolated instance, exercises the affected behavior, and posts inspectable proof — logs, screenshots, a replayable trace." The Replay blog attributes it to Chris Kelly, "Head of Developer Experience at Augment", in his guide for LeadDev, 10 Sep 2026. **UNVERIFIED at the original source** (the LeadDev article was not opened). Do not use it in the film.

## 7. Debates and controversies

- **Does a failed fix *reopen* the bug or file a *new* one?** (contested between the vendor's own pages)
  - *Reopens:* the docs overview says it "reopens the bug if the problem is still there" (`basics_replay-qa_overview.txt`). Concepts and getting-good-results say the same, and so does the replay-qa book, chapter 5 ("reopened as a rediscovery").
  - *New bug:* the bug-reports reference says "A fixed bug stays fixed: if the problem comes back, Replay QA files it as a new bug" and "files a new bug if the problem is still there". The OpenAPI spec, which the reference calls authoritative, says `fixed` is ignored "during deduplication" and any recurrence is assessed "as a fresh report". The fix-qa-bug skill agrees ("a recurrence needs a fresh report").
  - **Film guidance:** say only that Replay QA "reruns the journey to confirm the fix". The critic's "not yet" is a depiction and must not claim a specific status change.
- **"Suggested fix" vs "no code patch":** the home page says each report includes "a suggested fix". The bug-reports reference says "Replay QA does not generate a code patch". These do not conflict (a suggestion in prose, not a patch), but the film must not say Replay QA fixes bugs or writes code. The coding agent does.
- **Vendor-run pilot:** the 152 / 80 numbers come from Replay's own blog about its own repository. They are vendor-reported, not independently audited. If used, attribute them ("in Replay's own two-week pilot").

## 8. Misconceptions to avoid

- There are **two different MCP servers**. Replay QA MCP (`qa.replay.io/api/mcp`) manages projects and bugs. Replay MCP (`dispatch.replay.io/nut/mcp`) inspects a recording. The tools reference stresses the difference ("This is a different server").
- The "judges" are not a critic of fixes, and not every bug shows them (bug-react: "No recorded judge actions available."). Do not narrate "Replay QA's critic agent".
- The agent does not start its own runs while QA is running ("do NOT start your own explorations or test runs").
- Replay QA does not apply fixes; a person or coding agent does. In the blog loop, "a person reviews the PR … and decides whether to merge."
- Do not show or speak any token, token prefix, login variable or e-mail address. Say "sign in" or "API token" generically.
- 258 is both the live-sync request count and the journey-testing bug count on Insights (account-digest.json). Do not conflate them in the agent beat.
- The vendor names Claude Code, Cursor, Codex and Obvious. The film must **not** draw their logos, mascots, colour schemes or UI chrome. Use neutral glyph avatars labelled "developer" and "critic" (or "agent" and "QA").

## 9. Curiosity hooks (true and sourced)

1. The whole agent setup is one sentence: "Start at https://docs.replay.io/llms.txt and follow it." (agent-integration doc; account-digest.json)
2. The Replay QA MCP server can be added by URL without a token. The client opens a browser sign-in the first time (agent-integration doc).
3. Replay MCP has 30 tools, and the deepest, `ReactRenders` in `fiber-cause` mode, answers why one component instance re-rendered: "which prop changed, which state update fired, which context value shifted" (https://docs.replay.io/reference/replay-mcp/tools).
4. With `Evaluate`, an agent can run a JavaScript expression "at any moment in the recording" (tools reference).
5. In Replay's two-week pilot, 152 PRs were opened with "none of which was written by a human", and every one of the 80 merges came with the original bug reproduced against the PR "and shown to be gone" (blog, 2026-10-06).
6. 18 of the 124 bugs in that pilot "needed more than one attempt", and one PII leak "took four tries". Real "not yet" moments (blog).
7. The bug-sync page, a bug that is now **Fixed**, carries three links labelled "Requirements judge", "Evidence judge" and "Acceptance judge" under a nav named "Bug filing provenance" (`capture/clean/bug-sync.json`).
8. The agent API tells the agent to doubt the report: "Verify the report against its evidence and the source before applying a fix." (openapi.json)
9. Replay QA can mark a bug resolved from a webhook callback, then "re-enables that user journey for future runs so you find out immediately if it regresses" (https://www.replay.io/ FAQ).

## 10. Visual and dramatic details (for the art department)

- **Beat size:** 6–8 s, about 0.6 scale, in a corner of a product shot (look.md "The subtle beat"). Never the headline.
- **The pair:** two neutral, unbranded agent glyphs (rounded cards with a simple icon, labelled "developer" and "critic"), in brand-neutral colours from the promo haze palette. No logos or brand colours of Claude Code, Cursor, Codex, Obvious, VS Code or any other product.
- **The hand-off object:** a small chip reading `▶ replay recording` (look.md). A real recording ID exists on the bug-sync page ("View Full Recording", `b9048c2d-…`), but use the chip, not the ID.
- **The exchange:** chip → critic → "✕ not yet" → developer works again → chip → "✓ good". This depicts "Mark each fix. Replay QA reruns the affected journey to confirm it." and the blog's "the loop opened another one".
- **Best host shot:** the bug-sync take, whose status pill reads **Fixed**, and whose three judge links can sit in frame (unnarrated) while the pair plays in the corner. The bug-sync DOM also contains a credit string ("… of 500 credits"). The cleaner's `hideByText` rule should hide it, so confirm it is invisible on the contact sheet.
- **Optional typed line:** the agent prompt or `claude mcp add --transport http replay-qa https://qa.replay.io/api/mcp`, in the promo kit's typed-prompt style. Neither contains a credential.
- **Bug page copy in frame:** "Full Bug Report" / "Markdown for Claude Code, Cursor, and other coding agents" / "Copy bug report" / "Download" (both bug takes). These are product text, so they are allowed. Avoid zooming in on the brand names.

## 11. Sources

1. `films/replay-qa-promo/research/sources/basics_replay-qa_agent-integration.txt` (= https://docs.replay.io/basics/replay-qa/agent-integration, re-checked live 2026-10-14)
2. `films/replay-qa-promo/research/sources/basics_replay-mcp_overview.txt` (= https://docs.replay.io/basics/replay-mcp/overview)
3. `films/replay-qa-promo/research/sources/llms.txt` (= https://docs.replay.io/llms.txt)
4. `films/replay-qa-promo/research/sources/openapi.json` (= https://qa.replay.io/api/v1/openapi.json)
5. `films/replay-qa-promo/research/sources/basics_replay-qa_overview.txt` (= https://docs.replay.io/basics/replay-qa/overview)
6. `films/replay-qa-promo/research/sources/basics_replay-qa_concepts.txt` (= https://docs.replay.io/basics/replay-qa/concepts)
7. `films/replay-qa-promo/research/sources/basics_replay-qa_getting-good-results.txt` (= https://docs.replay.io/basics/replay-qa/getting-good-results)
8. `films/replay-qa-promo/research/sources/reference_replay-qa_bug-reports.txt` (= https://docs.replay.io/reference/replay-qa/bug-reports)
9. `films/replay-qa-promo/research/sources/reference_time-travel_how-does-time-travel-work.txt`
10. `films/replay-qa-promo/research/sources/account-digest.json` (new_project_page, settings_page_facts, featured_bugs, insights)
11. `films/replay-qa-promo/capture/clean/bug-sync.json` (judge links; Fixed; Markdown hand-off copy)
12. `films/replay-qa-promo/capture/clean/bug-react.json` ("No recorded judge actions available." at 4452 ms)
13. `films/replay-qa-promo/look.md` ("The subtle beat")
14. `public/generated/replay-qa/manifest.json`; `apps/bookshelf/src/viz/books/replay-qa/chapter-3.tsx`; `apps/bookshelf/src/viz/books/replay-qa/chapter-5.tsx`
15. https://docs.replay.io/reference/replay-mcp/tools
16. https://docs.replay.io/reference/replay-qa/api
17. https://docs.replay.io/basics/replay-qa/obvious
18. https://qa.replay.io/api/v1/skills/fix-qa-bug/SKILL.md
19. https://www.replay.io/ (home page and FAQ, read 2026-10-14)
20. https://www.replay.io/blog/what-our-experimental-self-healing-software-loop-shipped-in-two-weeks (Thomas Daly, 2026-10-06)

## 12. Fact-check log (adversarial pass, 2026-10-14)

Method: local sources re-read (`research/sources/*.txt`, `llms.txt`, `openapi.json` info.description and paths, `account-digest.json`); the rrweb event streams of `capture/clean/bug-sync.json` and `capture/clean/bug-react.json` re-scanned (text nodes, attributes, add-order via `nextId`); live pages opened in the requester's Chrome through the Claude in Chrome extension (read-only; two FAQ accordions expanded, nothing typed or submitted): agent-integration doc, Replay QA overview (incl. FAQ "Does Replay QA write a fix for me?"), bug-reports reference, Replay MCP tools reference, Obvious page, `fix-qa-bug` SKILL.md, www.replay.io home page and FAQ, and the 2026-10-06 blog post.

Changes made:
1. **Corrected (section 1, hook 2):** "it needs no token" overstated the doc. The live agent-integration page says the server "supports OAuth sign-in, so you can add it by URL without a token", and it also offers a "Claude Code (token)" setup tab. Reworded to "can be added by URL without a token". Source: https://docs.replay.io/basics/replay-qa/agent-integration.
2. **Corrected (5b):** added that `ProfileSampling` profiles "the Replay runtime, not the recorded application". Source: https://docs.replay.io/reference/replay-mcp/tools.
3. **Corrected (5c):** the "only nearby wording" about judging missed the bug-reports reference line "so future runs judge against it" (design document). Added; the judge links' function stays UNVERIFIED. Source: https://docs.replay.io/reference/replay-qa/bug-reports.
4. **Clarified (section 6):** Chris Kelly's title per the blog is "Head of Developer Experience at Augment". The quote stays UNVERIFIED at its original source (LeadDev not opened) and must not be used.

Confirmed without change (exact wording or number checked):
- Agent prompt, five-step loop, credential options, `claude mcp add` command, "If the bug report is not enough, the agent can open the linked recording with Replay MCP and inspect the failure directly." (live agent-integration page, identical to the saved copy; New Project page prompt in account-digest.json).
- OpenAPI info.description: steps 1-5, `PATCH /bugs/{bug_id}` with `{"status":"fixed"}` "automatically retries the affected journey to confirm the fix", "Verify the report against its evidence and the source before applying a fix.", "do NOT start your own explorations or test runs", fixed = "assess any recurrence as a fresh report"; project chat endpoint "can perform project actions requested by the message".
- llms.txt: CLI skill is the default ("Use the REST API or MCP server only when the CLI cannot run."), REST/OpenAPI, Replay QA MCP, skills `fix-qa-bug` and `github-app`; Replay MCP at `dispatch.replay.io/nut/mcp`, "lists all 30 tools; agents call `RecordingOverview` first".
- Tools reference: counted 30 tools (1+7+5+2+2+4+3+1+4+1); RecordingOverview first and "three to four minutes"; ReactRenders has nine modes; ReactPerformanceInsights "Detects heavy commits (over 50ms)"; fiber-cause and Evaluate wording in hooks 3-4 verbatim; "This is a different server" from Replay QA MCP.
- Overview: "inspect the console, code, and network traffic from the actual failure" verbatim (its condition is "When a bug includes a Replay recording of the failing run"; the "not enough" trigger is the agent-integration wording); overview, concepts and getting-good-results say the bug "reopens"; bug-reports reference says "files it as a new bug" and "files a new bug if the problem is still there"; fix-qa-bug says "a recurrence needs a fresh report". The section 7 CONTESTED entry stands.
- Agents named: Claude Code, Cursor, Codex (agent-integration); Cursor / VS Code setup tab; Replay MCP setup tabs Claude Code, Cursor, VS Code, Codex; Obvious connector "with OAuth" (https://docs.replay.io/basics/replay-qa/obvious).
- Home page: "No, and that's deliberate. Replay QA finds the bug, works out the root cause, and writes a suggested fix, but applying it stays with your team." and the webhook FAQ text verbatim; "Writing code got faster. Verifying it didn't, and it's still the part your team does by hand." verbatim.
- Blog (Thomas Daly, October 6, 2026): pilot September 18 to October 1; 152 PRs, 80 merged and verified (46 session replay, 34 independent reproduction), 45 open, 27 closed; 124 bugs, 76 fixed on main; 18 "needed more than one attempt"; "when a PR was closed or failed QA, the loop opened another one"; Segment PII leak "took four tries"; 5.4/day, 3-day median, 99 PRs in first three days, 7 PRs without a QA bug, performance 43%, severity 9/22, 39/62, 28/40; "Generation was never the hard part." Vendor-reported.
- Captures: bug-sync nav `aria-label="Bug filing provenance"`, links "Requirements judge", "Evidence judge", "Acceptance judge" in that DOM order (add-order by `nextId`), each to consecutive `#action-…` anchors of one generating task; status badge "Fixed"; bug-react "Loading judge actions…" at 3032 ms then "No recorded judge actions available." at 4452 ms; "Markdown for Claude Code, Cursor, and other coding agents" in both takes; bug-react evidence label "React performance insights".
- account-digest.json: `bug-muen719p-vdmh` open/medium, discovered 2026-09-23T21:56:06.418Z; `bug-mtmk9vtr-21c2` fixed (live-sync 258).
- Replay QA book: no "judge" in the manifest or chapter sources; chapter-5 phrases quoted in 5c and section 7 present verbatim.

Still UNVERIFIED: what the three judges do (no public doc); the Chris Kelly / LeadDev quote at its original source.

