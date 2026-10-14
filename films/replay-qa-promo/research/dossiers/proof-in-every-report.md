# Dossier: A finding carries its proof: bug reports, verification, and the account's totals

- **Topic id:** `proof-in-every-report`
- **Era:** product, as of 2026-10-14
- **Film:** replay-qa-promo (look: promo, about 90 s)
- **Researched:** 2026-10-14. Local sources were read in full: `reference_replay-qa_bug-reports.txt`, `basics_replay-qa_concepts.txt`, `basics_replay-qa_overview.txt`, `basics_replay-qa_github.txt`, `basics_replay-qa_getting-good-results.txt`, `openapi.json` and `account-digest.json`. Three pages were re-read live in the user's Chrome through the Claude in Chrome extension: docs bug-reports, docs concepts and the replay.io home page. The bug-reports page matches the saved text word for word. The `insights`, `bug-react` and `bug-sync` takes were rebuilt to text from their cleaned rrweb events, with the DOM tree reconstructed from the full snapshot plus mutations.
- **Source refs:** repo-relative paths are relative to `films/replay-qa-promo/`. Numbered sources are listed in section 11.
- **Not used:** `capture/api/` (raw dumps, off limits). No credentials, tokens, login variables or e-mail addresses were copied into this file. The `bug-react` take shows a redacted login line, and it is deliberately not reproduced here.

> **Corrections and cautions the script must take on board**
> 1. **The film may say "points to the root cause"; it may not say "writes the fix".** The docs say: "Replay QA does not generate a code patch; a developer or coding agent applies the fix from the root cause." [S1] The home page says reports include "a suggested fix" [S9]. Safe line: *"Every bug arrives with its root cause and a suggested fix. Your agent writes the patch."* Never say "Replay QA fixes your bugs".
> 2. **Fixed-then-recurs is CONTESTED in the vendor's own docs.** The bug-reports reference [S1] and the OpenAPI spec, which the docs call authoritative [S4], say a recurrence becomes a **new bug**. The concepts page [S2] and the overview [S3] say the bug **reopens**. Safe narration: *"Mark it fixed and Replay QA reruns the journey to check."* Do not say "reopens" or "files a new one". See section 7.
> 3. **29% is not (711 − 389) / 711.** That sum is 45%. The 29% is **207 "Resolved" / 711**, from the Insights Project Scorecard (207 / 711 = 29.1%). Do not narrate "322 resolved" or "everything not open is fixed".
> 4. **"Resolved" is not "fixed".** Electric Forest shows 126 bugs, 126 resolved and 100% on Insights, but only 101 were fixed (the others: 24 invalid, 1 wontfix) [S5][S7]. Never say "126 bugs fixed" or "100% fixed".
> 5. **711 is the Insights total, not the whole account.** A sibling fact-check found 67 projects in the live API. Insights covers 50 of them, and the newest 50 sum to exactly 711. All 67 hold 783 bugs (`research/dossiers/explore-journeys-runs.md`, Fact-check log) [S12]. Label 711 as "on Insights" or "across 50 projects". Never say "in the account" or "ever".

---

## 1. Summary

The promise: **every bug Replay QA files arrives with its own evidence.** The docs say: "Every bug Replay QA files is backed by a Replay recording of the run that found it. The report is built from that recording, so each claim in it points at evidence you can inspect." [S1]

**What a report contains** (documented fields, [S1]):

| Field | Content (docs) | Label on screen in the takes |
|---|---|---|
| Title | The specific problem, naming the control or component involved | Title in the bug list and header |
| Description | The defect in general terms: what is wrong and where | (in the Markdown / API report) |
| Severity | critical, high, medium or low | chip: "Medium", "High" |
| Steps to reproduce | A chronology of user actions and observations, each with a screenshot from the recording and, for actions, the element interacted with | **"Chronology of Events"** (timestamped, with "Screenshot") |
| Expected behavior | What should have happened | "Expected Behavior" |
| Actual behavior | What the user saw instead | "Actual Behavior" |
| Root cause | Why it happened, traced through the recording to the responsible code path, with the evidence (source, console, network, React state) | "Root Cause" + "Evidence" (e.g. "Network · requests", "React performance insights · json", "Source") |
| Causal chain | The sequence from cause to symptom, one step at a time | **"Root Cause to Actual Behavior"** (numbered steps) |
| Recording | Links to the Replay recording of the failing run | "View Full Recording" + recording id |
| Category | The journey (functional bug) or the polish pass that filed it | "Type: Polish · Network Performance" / "Polish · React Rendering" |

Security findings also get an **Impact** section. Bugs found on a GitHub pull request record the PR and version [S1].

**What it does not do:** "Replay QA does not generate a code patch" [S1]. The root cause names the mechanism and the code location. A developer or coding agent applies the fix.

**Verification and the lifecycle.** "A bug is only filed after Replay QA has confirmed it against the recording and checked that it is not a duplicate of an existing bug." [S2] Statuses are `open`, `fixed`, `wontfix` and `invalid` (OpenAPI enum) [S4]. Setting `fixed` via `PATCH /bugs/{bug_id}` "automatically retries the affected journey to confirm the fix" [S4].

**Totals (Insights, 2026-10-14):** 50 projects, **711 total bugs, 389 open, 29% resolution rate, 1151 journeys, 89 explorations**. By severity: **critical 4 · high 238 · medium 369 · low 100** (sum 711). By discovery source: **journey testing 258 (36%) · polish analysis 453 (64%)** (sum 711) [S5][S7]. The recording and the digest agree on every figure (section 5.3).

**Export:** Markdown (copy or download, "for Claude Code, Cursor, and other coding agents"), REST `GET /api/v1/bugs/{bug_id}`, the MCP `get_bug` tool, and issue trackers (GitHub Issues, Linear, Jira) [S1][S4][S7]. The home page also lists "any endpoint that accepts a webhook" [S9].

---

## 2. Timeline (dated events)

All dates are product events in the requester's account or the vendor's docs. There is no historical era.

| date (UTC) | event | source |
|---|---|---|
| 2026-09-04 (chat, "Sep 4, 12:41 AM" local; about 04:41 UTC, inferred) | Project chat: QA refuses to start new work because "the project has hit its bug limit": cap 100, "111 bugs filed" (65 still open). Reply at "Sep 4, 12:42 AM": "Bug cap raised to 150" | `capture/clean/bug-sync.json` (chat history text) [S8] |
| 2026-09-04 06:05:26 | Polish pass files `bug-mtmjva2o-pah7`: board live-poll, 105 identical empty responses in ~70 s (low, network-performance, Electric Forest). Later set **fixed** | `research/sources/account-digest.json` featured_bugs.board_poll_105 [S5] |
| 2026-09-04 06:16:47 | Polish pass files `bug-mtmk9vtr-21c2`: live-sync loop re-fetches 258 times (medium, network-performance, Electric Forest). Later set **fixed** | [S5] featured_bugs.live_sync_258 |
| 2026-09-23 21:45:27 | `bug-muemtceb-we4e` filed: 56 ms navigation commit, 3 dropped frames (medium, react-rendering, **open**) | [S5] featured_bugs.navigation_commit_56ms |
| 2026-09-23 21:56:06 | `bug-muen719p-vdmh` filed: 67 ms React commit at T=383.2s, 4 dropped frames (medium, react-rendering, **open**) | [S5] featured_bugs.react_commit_67ms |
| 2026-10-14 | Insights read and `insights` take captured: 711 / 389 / 29% / 1151 / 89 | [S5][S7] |
| 2026-10-14 | Docs bug-reports and concepts pages and the replay.io home page re-read live (Chrome); wording identical to the saved copies | [S1][S2][S9] |

Recorded on screen, relative times: the 67 ms bug page shows "Discovered 21 days ago at 5:56 PM" and the 258 bug shows "1 month ago at 2:16 AM" [S7][S8]. These are consistent with the dates above, given that the UI shows local time.

---

## 3. People

Not applicable (product promo). No real people are depicted. The only person-like name on screen is the account owner's display name in the app chrome, which the brief allows. Do not depict anyone. The "developer agent / critic agent" beat belongs to another topic.

## 4. The belief of the age (adapted: the assumption the product argues against)

The usual assumption is that **a bug report is a claim you must re-verify by reproducing it by hand**. The home page frames the cost: an engineer "loses an afternoon reproducing it, and the fix itself takes twenty minutes" [S9]. Replay QA's counter-position: the report is built from a recording, "so each claim in it points at evidence you can inspect" [S1]. The OpenAPI description tells agents "You do not need to debug — apply the fix the analysis points to, then mark the bug fixed." [S4] That is a vendor claim. The same spec also tells agents to "Verify the report against its evidence and the source before applying a fix" [S4], so the film should not imply blind trust.

## 5. Experiments and results (the mechanics and the numbers)

### 5.1 Severity (docs table, verbatim meanings [S1])

| Level | Meaning |
|---|---|
| critical | Crashes, data loss, security vulnerabilities, complete feature failure |
| high | Broken core functionality, severe visual bugs that block usage, WCAG A violations |
| medium | Degraded functionality, noticeable performance issues, moderate visual bugs, WCAG AA violations |
| low | Minor cosmetic issues, console warnings, minor performance issues, enhancement suggestions |

"You can change a bug's severity after it is filed." [S1] The bug list has filter controls "Kind | Severity | Status | Environment" [S7].

### 5.2 Status, deduplication and verification

Docs table [S1]:

| Status | Meaning | Set by |
|---|---|---|
| open | Confirmed and not yet addressed | Replay QA, or you when reopening |
| fixed | A fix was applied; Replay QA reruns the affected journey | You, or Replay QA when a PR merges |
| wontfix | Real, but not going to be addressed | You, or Replay QA when a PR closes unmerged |
| invalid | Not a real bug | You |

OpenAPI, the authoritative definitions [S4]. The `status` enum on `PATCH /api/v1/bugs/{bug_id}` and the filter on `GET /api/v1/projects/{project_id}/bugs` is **`open | fixed | wontfix | invalid`**. Summary of the enum description:
- **open:** match recurring findings to this report.
- **fixed:** "ignore this report during deduplication and assess any recurrence as a fresh report."
- **invalid:** discarded but kept "as a duplicate candidate so the same invalid claim is not filed again."
- **wontfix:** "acknowledged and will recur, but new bugs should not be filed for it."
- "Open, wontfix and invalid are duplicate candidates. Wontfix and invalid both suppress repeat filings; neither means a fix was applied."
- An optional `wontfix_reason` is accepted only with `wontfix`.

**Dedup in plain words:** when a later run sees an issue matching an open, wontfix or invalid bug, the run links the existing bug instead of filing a duplicate [S1]. Polish passes do the same: each pass "drops ones that duplicate an existing bug, then confirms each remaining candidate before filing it" [S6].

**Verification:** a bug is filed only after confirmation against the recording plus a duplicate check [S2]. On screen, the 258-request bug's judge panel lists, in on-screen (DOM) order, **"Requirements judge | Evidence judge | Acceptance judge"** [S8]. **[Corrected in fact-check: the order was given as Acceptance, Requirements, Evidence.]** This is UI text only. The docs do not describe these judges, so show them at most, and do not narrate what they do.

**Fix loop:** `PATCH /bugs/{bug_id}` with `{"status":"fixed"}` "automatically retries the affected journey to confirm the fix" [S4]. Then: "Loop. After marking a bug fixed, go back to polling status and keep going until no open bugs remain." [S4]

**Caps:** a project has "a credit budget and a bug limit" [S2]. In the take, the Electric Forest chat shows the bug limit stopping work (cap 100, 111 filed, 65 open) until it was raised to 150 [S8].

### 5.3 Insights: the take and the digest compared

`capture/clean/insights.json`: duration 7555 ms (raw 8408 ms, 853 ms cut). Marks: `start` 0, **`stats` 2926**, **`severity` 6905**, `end` 7555. 0 clicks, 0 redactions [S7]. A sibling dossier records that the `stats` mark is a hover on "Total bugs" and that `severity` is the scroll to the severity cards [S12].

| figure | on screen (take) | digest | match |
|---|---|---|---|
| Projects | 50 | insights.projects 50 | yes |
| Total Bugs | 711 | total_bugs 711 | yes |
| open | 389 | open_bugs 389 | yes |
| Resolution Rate | 29 % | "29%" | yes |
| Journeys | 1151 | 1151 | yes |
| Explorations | 89 | 89 | yes |
| Overall Severity: critical | 4 · 1 % | 4 | yes |
| high | 238 · 33 % | 238 | yes |
| medium | 369 · 52 % | 369 | yes |
| low | 100 · 14 % | 100 | yes |
| Discovery Source: Journey Testing | 258 · 36 % | 258 / "36%" | yes |
| Polish Analysis | 453 · 64 % | 453 / "64%" | yes |

**No differences found.** Other on-screen elements: the subtitle "Cross-project analytics for your autonomous QA pipeline — bug trends, severity breakdowns, and resolution tracking."; the charts "Bug Severity by Project", "Polish Bug Categories" (Glitches, Network Performance, User Experience, Accessibility, Layout Shift, React Rendering, Seo; axis 0-220), "Bug Resolution Rate by Project" ("How quickly are bugs getting fixed across each project?") and a "Project Scorecard" with columns Project | Bugs | Open | Resolved | Journeys | Resolution [S7].

**Arithmetic checks (all pass):**
- Severity: 4 + 238 + 369 + 100 = **711** ✓
- Discovery: 258 + 453 = **711** ✓
- Rounded percentages: 4/711 = 0.56% → "1 %"; 238/711 = 33.47% → 33; 369/711 = 51.90% → 52; 100/711 = 14.06% → 14; total 100 ✓. 258/711 = 36.29% → 36; 453/711 = 63.71% → 64 ✓
- Scorecard over 50 rows: Bugs 711 ✓, Open 389 ✓, Journeys 1151 ✓, Resolved **207**. 207/711 = 29.11% → **29 %** ✓ (this is how the tile is computed)
- Open share: 389/711 = 54.7% (not shown on screen; don't narrate it unless needed)
- 711 − 389 − 207 = 115 bugs are neither "Open" nor "Resolved" in the scorecard. The UI does not explain this. Most of those rows are per-PR projects ("ExampleApps PR #…"), and the GitHub docs say a closed PR's open bugs move to a **`pr-closed`** status [S10]. That is a plausible explanation, but it is **inference**. Don't narrate it.

**Which totals are exact:** every Insights figure above is exact *as an Insights figure*, read from the screen and the digest on the same day. They are **not account-wide**: 67 projects / 783 bugs per the sibling's live API read [S12]. "Resolution rate" is the product's own term, and its definition of "resolved" is undocumented (see caution 4).

### 5.4 Electric Forest (optional proof point)

From the digest [S5]: status **paused**, journeys **160**. Bugs: **fixed 101, invalid 24, wontfix 1** (sum **126**; no open). Categories: **journey 39, network-performance 33, accessibility 26, glitches 20, user-experience 5, layout-shift 3** (sum **126** ✓; polish = 33 + 26 + 20 + 5 + 3 = 87, functional = 39). Insights Scorecard row: "Electric Forest 126 — 126 160 100 %", which reads Bugs 126 · Open — · Resolved 126 · Journeys 160 · Resolution 100% [S7]. It is the top row of the scorecard (the most bugs of any project). Safe line: *"126 bugs found, 101 fixed, none left open."* Both featured network bugs (258 and 105) are Electric Forest bugs marked fixed [S5].

### 5.5 What the bug-page takes show (for timing the shots)

- `bug-react.json` (the 67 ms bug, project "Electric Forest PR 4650 Preview"): duration 13692 ms. Marks: open/report 3032, actual 8723, rootcause 12008 [S7]. Visible: bug list with "Copy Bug Reports | Download Bug Reports | Connect Issue Tracker". Bug page with "Actual Behavior", "Expected Behavior", "Root Cause", "Evidence 2 · React performance insights · json · Source", "Chronology of Events 6:20.8 · Screenshot", "Root Cause to Actual Behavior", "Full Bug Report · Markdown for Claude Code, Cursor, and other coding agents", "Copy bug report", "Download", "Details · Discovered 21 days ago at 5:56 PM · Type Polish · React Rendering", and "View Full Recording". The sibling fact-check warns that at exactly 3032 ms the right panel is still a skeleton; seek 3040-3200 ms [S12].
- `bug-sync.json` (the 258 bug, Electric Forest): duration 8804 ms. Marks: report 1603, actual 5402, rootcause 8154 [S8]. Visible chips: "Fixed | Medium | Network Performance | Local". Root cause text: "every long-poll round sends checkpoint=-1 … (258 requests)". The Chronology starts at "0:15.2" with "requests at 15292ms, 15627ms, 16342ms, ... 175614ms". The causal chain has 3 numbered steps ending "258 GETs (~600-750ms cadence, avg 631ms)" [S8].

### 5.6 Export formats [S1][S3][S4][S10]

- **Bug page** in Replay QA: report plus screenshot chronology plus evidence per root-cause step.
- **Markdown**: "Bug reports can be copied or downloaded as Markdown for a coding agent." [S3] The same rendering feeds the issue trackers [S1]. On screen: "Markdown for Claude Code, Cursor, and other coding agents" [S7].
- **REST**: `GET /api/v1/bugs/{bug_id}` (operationId `getBug`, server `https://qa.replay.io`). Summary: "Get detailed bug info with analysis, evidence, and reproduction steps". Also `GET /api/v1/projects/{project_id}/bugs?status=open` (page_size default 20, max 100) [S4].
- **MCP**: the `get_bug` tool returns the structured report [S1]. The MCP server is `https://qa.replay.io/api/mcp` [S11].
- **Issue trackers**: GitHub Issues, Linear or Jira. Each bug becomes "an issue with the full report and a link back to Replay QA" [S1]. Bugs can be filed "as they are confirmed" [S3]. The home page adds "any endpoint that accepts a webhook" [S9].

## 6. Verified quotes (on-screen and vendor product copy; no people)

All are verbatim, checked live on 2026-10-14 (docs, home page) or rebuilt from the takes.

1. "Every bug Replay QA files is backed by a Replay recording of the run that found it." Docs, Bug reports, opening paragraph. https://docs.replay.io/reference/replay-qa/bug-reports [S1]
2. "Replay QA does not generate a code patch; a developer or coding agent applies the fix from the root cause." Same page, under "What a report contains". [S1]
3. "A fixed bug stays fixed: if the problem comes back, Replay QA files it as a new bug." Same page, under "Status". [S1] **Verbatim, but CONTESTED by the concepts and overview pages ("reopens"); do not put on screen or narrate (section 7, item 1).**
4. "A bug is only filed after Replay QA has confirmed it against the recording and checked that it is not a duplicate of an existing bug." Docs, concepts, section "Bug". https://docs.replay.io/basics/replay-qa/concepts [S2]
5. "Bug reports your coding agent deserves". Home page section heading. https://www.replay.io/ [S9]
6. "Markdown for Claude Code, Cursor, and other coding agents". On-screen label under "Full Bug Report", `capture/clean/bug-react.json` and `bug-sync.json` [S7][S8]
7. "Cross-project analytics for your autonomous QA pipeline — bug trends, severity breakdowns, and resolution tracking." Insights page subtitle, `capture/clean/insights.json` [S7]

No UNVERIFIED quotes. Do not attribute any of these to a person.

## 7. Debates and controversies (vendor-internal inconsistencies)

1. **Reopen vs new bug after a fix fails.**
   - "Files a new bug": Bug reports, "A fixed bug stays fixed: if the problem comes back, Replay QA files it as a new bug" and "Replay QA reruns the journey and files a new bug if the problem is still there" [S1]. The OpenAPI `fixed` definition says "assess any recurrence as a fresh report" [S4]. The bug-reports page calls the OpenAPI spec authoritative [S1].
   - "Reopens": Concepts, "if the problem is still there the bug reopens" [S2]; Overview, "reopens the bug if the problem is still there" [S3]; Getting good results says the same [S13].
   - Resolution for the film: the authoritative source favours "new bug", but the docs disagree, so **narrate only "reruns the journey to confirm."**
2. **What happens to bugs when a PR closes unmerged.** Bug reports: wontfix is set "by Replay QA when a PR closes unmerged" [S1]. GitHub docs: "When the pull request closes, its open bugs move to the pr-closed status" [S10]. `pr-closed` is not in the OpenAPI enum [S4]. Avoid the topic.
3. **"Suggested fix" vs "no code patch."** Home page: "a suggested fix" [S9]. Docs: "does not generate a code patch" [S1]. These are compatible if the suggestion is prose, but say "suggested fix", never "patch" or "auto-fix". The 56 ms bug's actual-behavior text includes a "Suggested action:" line [S5].

## 8. Misconceptions to avoid

- "Replay QA fixes bugs" or "writes the patch". No [S1].
- "711 bugs in the account" or "711 bugs ever". It is the Insights figure over 50 projects; the account has 67 [S12].
- "29% fixed" or "71% still broken". 29% is "Resolution Rate" = 207 resolved / 711. 389 open is 55%, and 115 are in neither column [S7].
- "Electric Forest: 126 bugs fixed / 100% fixed". 101 fixed; 24 invalid and 1 wontfix also count as resolved [S5][S7].
- "Severity is fixed once assigned". You can change it [S1].
- "Every finding becomes a bug". Candidates are confirmed and de-duplicated first [S2][S6].
- "Invalid deletes the bug". It stays as a duplicate candidate so the claim is not filed again [S4].
- "Critical 4 = 4%". It is 0.56%, shown as "1 %" [S7].
- "20 projects". The digest's `projects_total: 20` is one API page [S12].

## 9. Curiosity hooks (true, sourced)

1. Severity adds up to the bug: 4 + 238 + 369 + 100 = 711, and so does the source split, 258 + 453 = 711 [S5][S7].
2. Almost two-thirds of the bugs (453, 64%) came from polish passes reviewing recordings, not from journeys failing [S5][S7].
3. Only 4 of 711 bugs are critical, about half a percent; medium is the biggest band at 369 [S5].
4. Marking a bug **invalid** teaches the dedup: the same invalid claim is not filed again [S4].
5. The report's title, description and expected/actual are written for the general defect, "so the same report stays accurate across runs"; the concrete values live in the steps and root cause [S1].
6. Electric Forest: 126 bugs found, 101 fixed, 0 open, across 160 journeys [S5][S7].
7. The bug page's Markdown is labelled for "Claude Code, Cursor, and other coding agents" [S7].
8. The project chat once refused new work because "the project has hit its bug limit" (cap 100, 111 filed) until the cap was raised to 150 [S8].
9. The 258-request bug was verified at both ends: requests #0-#2 and again #250-#254, 160 s later, still carried checkpoint=-1 [S8].

## 10. Visual and dramatic details (promo look)

- **Insights screen:** six stat tiles in one row (50 · 711 · 389 open · 29 % · 1151 · 89), then two cards: Overall Severity (four rows with counts and %) and Discovery Source (two rows). Then bar charts and a long Scorecard table. Kinetic type can lift "711" off the tile at `stats` 2926 ms, then the four severity counts at `severity` 6905 ms, settling into "= 711".
- **Bug page anatomy** for a build-up graphic: chips (status · severity · category · environment) → Title → Actual / Expected → Root Cause + Evidence → Chronology of Events (timestamps + screenshots) → Root Cause to Actual Behavior (numbered chain) → Full Bug Report Markdown with Copy / Download → View Full Recording. A bracketed kinetic word such as `{ with proof }` fits the reference look.
- **Status as a small state machine:** open → fixed → (rerun) ✓ … with invalid and wontfix as side exits feeding the "duplicate candidates" pile. Keep the rerun outcome visually neutral (caution 2).
- **Export fan-out:** one report card splitting to four destinations: Markdown, `GET /bugs/{bug_id}`, `get_bug` (MCP), and tracker icons (generic; do not draw other companies' logos unless brand guidance allows; text labels "GitHub Issues · Linear · Jira" are safe).
- Never show credits, the redacted login line in `bug-react`, or any recording id as a hero element. Recording ids are visible in the takes; leaving them in place is fine, but don't zoom on them.

## 11. Sources

- [S1] https://docs.replay.io/reference/replay-qa/bug-reports (live re-read 2026-10-14, identical to `research/sources/reference_replay-qa_bug-reports.txt`)
- [S2] https://docs.replay.io/basics/replay-qa/concepts (live re-read 2026-10-14; `research/sources/basics_replay-qa_concepts.txt`)
- [S3] https://docs.replay.io/basics/replay-qa/overview (`research/sources/basics_replay-qa_overview.txt`)
- [S4] https://qa.replay.io/api/v1/openapi.json (`research/sources/openapi.json`: info.description; paths `/api/v1/bugs/{bug_id}` GET and PATCH, `/api/v1/projects/{project_id}/bugs` GET)
- [S5] `research/sources/account-digest.json` (insights; projects."Electric Forest"; electric_forest_bug_categories; featured_bugs)
- [S6] https://docs.replay.io/reference/replay-qa/polish-passes (`research/sources/reference_replay-qa_polish-passes.txt`)
- [S7] `capture/clean/insights.json` and `capture/clean/bug-react.json` (marks and rebuilt on-screen text)
- [S8] `capture/clean/bug-sync.json` (marks and rebuilt on-screen text, including the project chat history)
- [S9] https://www.replay.io/ (live re-read 2026-10-14)
- [S10] https://docs.replay.io/basics/replay-qa/github (`research/sources/basics_replay-qa_github.txt`)
- [S11] https://docs.replay.io/llms.txt (`research/sources/llms.txt`)
- [S12] `research/dossiers/explore-journeys-runs.md` (fact-check log: 67 projects / 783 bugs, live API count-only read; Insights tiles re-read live) and `research/dossiers/bugs-in-time.md` (seek guidance for `bug-react`)
- [S13] https://docs.replay.io/basics/replay-qa/getting-good-results (`research/sources/basics_replay-qa_getting-good-results.txt`)
- [S14] https://docs.replay.io/reference/replay-qa/api (live re-read 2026-10-14: REST, MCP and CLI describe themselves; no tool list on the page)

---

## Fact-check log (adversarial pass, 2026-10-14)

Method: the local sources were re-opened directly, not taken from the dossier's citations. The three takes were rebuilt to a final DOM from their rrweb full snapshot plus mutations (respecting `nextId` order). Then the live pages were re-read in the user's Chrome through the Claude in Chrome extension: replay.io home page, docs bug-reports, concepts and overview, `qa.replay.io/insights`, `qa.replay.io/api/v1/openapi.json`, plus a count-only read of `GET /api/v1/projects?page_size=100` (only totals were computed; no names, credentials or e-mail addresses were read out).

**Changes made**
1. **Timeline order corrected.** The bug-limit chat ("Sep 4, 12:41 AM" local) comes *before* the two polish bugs filed at 06:05:26Z and 06:16:47Z. The UI's local offset is UTC-4: the 258 bug, `discovered_at` 06:16:47Z, shows "2:16 AM", and the 67 ms bug, 21:56:06Z, shows "5:56 PM". So 12:41 AM local is about 04:41 UTC. The row was moved up, and the "Bug cap raised to 150" reply time (12:42 AM) was added. Sources: `capture/clean/bug-sync.json`; `research/sources/account-digest.json` featured_bugs.
2. **Judge panel order corrected.** On screen the order is "Requirements judge · Evidence judge · Acceptance judge", not Acceptance-first. Source: `capture/clean/bug-sync.json` (DOM order).
3. **Quote 3 flagged** as contested content: it is verbatim, but it should not be used on screen. It stays verbatim. Sources: https://docs.replay.io/reference/replay-qa/bug-reports vs https://docs.replay.io/basics/replay-qa/concepts.

**Confirmed without change (key claims 1-16)**
- 1-3: bug-reports page sentences are verbatim on the live page ("Every bug Replay QA files is backed by…", "Replay QA does not generate a code patch; …"). The field table matches `reference_replay-qa_bug-reports.txt`. The on-screen headings "Chronology of Events", "Root Cause", "Evidence" and "Root Cause to Actual Behavior" are present in both bug takes. The home page live text reads: "A detailed root cause analysis, a suggested fix, a deterministic runtime recording…"; "loses an afternoon reproducing it, and the fix itself takes twenty minutes"; "GitHub Issues, Linear, Jira, or any endpoint that accepts a webhook". (https://www.replay.io/)
- 4: concepts live text: "A bug is only filed after Replay QA has confirmed it against the recording and checked that it is not a duplicate of an existing bug." Polish passes: "drops ones that duplicate an existing bug, then confirms each remaining candidate before filing it" (`reference_replay-qa_polish-passes.txt`).
- 5: severity table plus "You can change a bug's severity after it is filed." (live bug-reports page).
- 6: the OpenAPI `status` enum `open | fixed | wontfix | invalid` appears on both PATCH `/api/v1/bugs/{bug_id}` and the GET `/projects/{project_id}/bugs` filter. The enum descriptions are verbatim as summarised. Page size: default 20, max 100.
- 7: the live `openapi.json` info.description contains "automatically retries the affected journey to confirm the fix". **Contested** outcome: bug-reports says it "files a new bug if the problem is still there" and the OpenAPI calls a recurrence "a fresh report", while concepts ("if the problem is still there the bug reopens"), overview ("reopens the bug if the problem is still there") and getting-good-results say it reopens. All of these were re-checked live or locally. Narrate only "reruns the journey to confirm".
- 8-10: live `qa.replay.io/insights` on 2026-10-14 reads 50 · 711 · 389 open · 29% · 1151 · 89; Critical 4 (1%) · High 238 (33%) · Medium 369 (52%) · Low 100 (14%); Journey Testing 258 (36%) · Polish Analysis 453 (64%). This matches the take and `account-digest.json` insights. Both sums equal 711.
- 11: the 50 rebuilt Scorecard rows sum to Bugs 711, Open 389, **Resolved 207** and Journeys 1151. 207/711 = 29.1%, whereas (711-389)/711 = 45.3%. The Electric Forest row reads "126 — 126 160 100 %". The digest gives fixed 101, invalid 24, wontfix 1 and no open, so its 126 "resolved" necessarily includes the 25 invalid/wontfix bugs.
- 12: the live count-only API read returned `total: 67` projects. The sum of `bug_count` over all 67 is **783**. The newest 50 by `created_at` sum to **711**, and the older 17 hold 72. This independently reproduces the sibling's finding.
- 13: digest Electric Forest: bugs fixed 101 / invalid 24 / wontfix 1, journeys total 160, status paused. Categories 39 + 33 + 26 + 20 + 5 + 3 = 126.
- 14: the bug-reports Formats section, the OpenAPI `getBug` summary, and the on-screen "Markdown for Claude Code, Cursor, and other coding agents", "Copy bug report", "Download" in both bug takes. The bug list in `bug-react` shows "Copy Bug Reports · Download Bug Reports · Connect Issue Tracker". The MCP server `https://qa.replay.io/api/mcp` appears in `llms.txt`.
- 15: marks read from the take JSON. insights {stats 2926, severity 6905, end 7555}; bug-react {open 3032, report 3032, actual 8723, rootcause 12008, end 13692}; bug-sync {report 1603, actual 5402, rootcause 8154, end 8804}.
- 16: bug-sync chat, verbatim: "the project has hit its bug limit . The bug cap is set to 100 , and this project has 111 bugs filed (65 still open)" and "Bug cap raised to 150 — QA is no longer blocked by the limit." Both are dated Sep 4 (local).
- Also confirmed: the `bug-sync` causal chain is an `<ol>` with exactly 3 `<li>` steps. Chronology "0:15.2" and "15292ms, 15627ms, 16342ms, ... 175614ms" are present. "verified at request #0-#2 and again at requests #250-#254, 160s later" is present. "Discovered 21 days ago at 5:56 PM" (bug-react) and "1 month ago at 2:16 AM" (bug-sync) are present. The Insights subtitle is verbatim.

**Unverifiable:** none. **Not narrated:** the "115 neither open nor resolved" explanation remains an inference (unchanged).
