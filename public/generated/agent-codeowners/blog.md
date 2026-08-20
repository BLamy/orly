# Agent CODEOWNERS

*A proposal: route AI code review through CODEOWNERS itself, using nothing but a custom GitHub Action and a standard pull-request workflow.*

The workflow uses GitHub's built-in `GITHUB_TOKEN`, and every review is attributed to GitHub Actions. `CODEOWNERS` already maps changed paths to human owners — this proposal piggybacks on that same file, via an inline `# agents:` comment, to also map paths to specialized AI review agents. When a pull request changes a file, a workflow determines which files changed, matches them against CODEOWNERS, resolves the named agents through their own harnesses — Claude, Codex, OpenCode — runs them read-only, posts one consolidated review, and fails a single required check when something blocking turns up.

## Chapter 1 · CODEOWNERS Routes the Diff

The routing mechanism is CODEOWNERS itself, read exactly the way GitHub already reads it — patterns evaluated in file order, last match wins.

### The file falls through the list

A pull request touches one file: a new database migration. CODEOWNERS is read from the base branch, and every pattern is checked against that path, in order — the wildcard database folder doesn't match, but the prisma folder does, so for a moment database review looks like the answer.

{% viz scene="books/agent-codeowners/chapter-1" section="ch1-fall" cue="0" from="0.000" to="23.928" title="A changed file is checked against every CODEOWNERS pattern, in file order." %}
{% endviz %}

### Last match wins

The root migrations folder doesn't match — this file sits nested under prisma, not there. But any file ending in `.sql` matches too, and GitHub always keeps the *last* matching line, never the first. That line wins, overriding the earlier prisma match.

{% viz scene="books/agent-codeowners/chapter-1" section="ch1-lastmatch" cue="5" from="23.928" to="38.800" title="GitHub keeps the last matching CODEOWNERS pattern, not the first." %}
{% endviz %}

### One line, two readers

Before the hash mark is what GitHub actually sees and assigns: a human owner, `@our-org/database`. After the hash mark is a comment GitHub ignores completely — `# agents:@claude/db-review` — which is exactly what the review workflow is watching for. One winning line, read two different ways by two different readers.

{% viz scene="books/agent-codeowners/chapter-1" section="ch1-tworeaders" cue="7" from="38.800" to="63.854" title="Before the hash mark: the human owner GitHub assigns. After it: the agent reference the workflow reads." %}
{% endviz %}

## Chapter 2 · One Reference, Three Native Formats

An agent reference is `@harness/agent`. The harness segment picks an adapter; the agent segment names a file already sitting in the repository, in that harness's own native format — nothing gets translated into a universal one.

### Three references, one format each

`@claude/db-review`, `@codex/package-json-review`, and `@opencode/foobar-review` name three harnesses. Only these three names are ever recognized — anything else is treated as an ordinary, unresolved owner token, never as a command, which keeps a pull request from turning arbitrary CODEOWNERS strings into executable references.

{% viz scene="books/agent-codeowners/chapter-2" section="ch2-refs" cue="0" from="0.000" to="28.189" title="Only three harness names are ever recognized as executable references." %}
{% endviz %}

### Claude's native file

`@claude/db-review` resolves to `.claude/agents/db-review.md` — a markdown file with a YAML frontmatter header (`name`, `tools`, `model`). Claude Code natively supports project-scoped subagents defined exactly this way.

{% viz scene="books/agent-codeowners/chapter-2" section="ch2-claude" cue="3" from="28.189" to="36.989" title="The database reviewer resolves to a markdown file with YAML frontmatter." %}
{% endviz %}

### Codex and OpenCode's native files

`@codex/package-json-review` resolves to a TOML file with its own `sandbox_mode = "read-only"` built in. `@opencode/foobar-review` resolves to another markdown file, where the filename itself is the agent name and `edit`/`bash` permissions are denied by default. Nothing here is translated — each definition stays exactly as its own harness already expects to read it.

{% viz scene="books/agent-codeowners/chapter-2" section="ch2-codex-opencode" cue="4" from="36.989" to="56.123" title="Codex's TOML config and OpenCode's markdown agent, both untranslated." %}
{% endviz %}

### One shared interface

Every adapter still normalizes what it produces into one contract — `resolveAgent`, then `review`, returning findings with a severity and a conclusion — so the code that publishes results never has to know which harness ran. Three native formats in, one shape out.

{% viz scene="books/agent-codeowners/chapter-2" section="ch2-interface" cue="6" from="56.123" to="88.282" title="Three native formats normalize into one ReviewHarness contract." %}
{% endviz %}

## Chapter 3 · Base SHA vs. Head SHA

This is the security-critical asymmetry of the whole design: configuration is read from one commit, code from another.

### Two clocks

CODEOWNERS and every harness's agent-definition directory — `.claude/agents/**`, `.codex/agents/**`, `.opencode/agents/**` — are read from the pull request's *base* SHA: the state of the repository before this diff. Only the code and the diff under review are read from the *head* SHA.

{% viz scene="books/agent-codeowners/chapter-3" section="ch3-twoclocks" cue="0" from="0.000" to="22.918" title="Configuration is read from the base SHA; code and diff from the head SHA." %}
{% endviz %}

### The attempt and the bounce

Say a pull request edits its own reviewer, telling the database review agent to always approve every migration. It reaches up toward the very check reviewing it — but that check already loaded its configuration from the base, before this diff existed. The edit has no effect here.

{% viz scene="books/agent-codeowners/chapter-3" section="ch3-bounce" cue="3" from="22.918" to="38.452" title="A pull request editing its own reviewer file has no effect on itself." %}
{% endviz %}

### Only future pull requests

The edit only takes effect on a *future* pull request, after it has itself been reviewed and merged through the normal process. This mirrors GitHub's own trust model — GitHub already resolves pull request ownership from the base branch's CODEOWNERS — rather than inventing a new one.

{% viz scene="books/agent-codeowners/chapter-3" section="ch3-future" cue="5" from="38.452" to="62.044" title="An edited reviewer file only takes effect on the next pull request, never this one." %}
{% endviz %}

## Chapter 4 · The Worked Example, End to End

A single pull request, traced from changed files to a green required check.

### Files become a plan

Four changed files — a migration, a dependency bump, its lockfile, and one interface component — resolve through CODEOWNERS into a plan: the migration goes to database review, the dependency files go to the package file reviewer, and the interface component matches no agent rule, so it gets normal human review only. Each agent then runs once, in parallel, seeing only its own matched files and the relevant diff.

{% viz scene="books/agent-codeowners/chapter-4" section="ch4-plan" cue="0" from="0.000" to="25.705" title="CODEOWNERS turns four changed files into a review plan; each agent runs on only its own files." %}
{% endviz %}

### One blocking finding

Database review finds a blocking problem: a new `NOT NULL` column with no default that will break every row already sitting in the table. Package json review finds an unused new dependency — worth a comment, but not risky enough to block, so it warns and passes.

{% viz scene="books/agent-codeowners/chapter-4" section="ch4-finding" cue="3" from="25.705" to="43.108" title="One agent finds a blocking migration issue; the other warns without blocking." %}
{% endviz %}

### Sticky comment, failing check

One blocking finding and one warning collapse into a single sticky comment on the pull request, updated in place on every push rather than piling up new comments. The one required check, Agent Code Review, fails — because of the blocking migration finding, and only because of it.

{% viz scene="books/agent-codeowners/chapter-4" section="ch4-stickycheck" cue="6" from="43.108" to="58.421" title="One sticky comment, one required check, failing on the blocking finding alone." %}
{% endviz %}

### Fix, rerun, green

The author fixes it with the known safe sequence — add the column nullable, backfill existing rows, then constrain it not null. A new commit means a new head SHA, which cancels the stale run and starts both agents again from scratch. Database review finds nothing this time; the sticky comment marks the old finding resolved since the previous push. Package json review still warns about the same dependency, but nothing left is blocking, and the required check turns green.

{% viz scene="books/agent-codeowners/chapter-4" section="ch4-fixrerun" cue="7" from="58.421" to="103.608" title="A fix, a new head SHA, a rerun, and a required check that turns green." %}
{% endviz %}

## Chapter 5 · One Stable Check, Additive to Human Review

Merge enforcement rests on exactly one required check, and it is additive to human ownership rather than a replacement for it.

### One required check

The branch ruleset requires exactly one check to merge: Agent Code Review. It never pretends to be a human reviewer — it doesn't submit an approving or requesting-changes review, only a pass or fail status. Human CODEOWNER approval and this automated check are two separate, additive requirements; one never substitutes for the other.

{% viz scene="books/agent-codeowners/chapter-5" section="ch5-onecheck" cue="0" from="0.000" to="24.718" title="One required check, never impersonating a human review, additive to CODEOWNER approval." %}
{% endviz %}

### A growable roster

Underneath that one stable name, a whole roster of agents can run — database review, the package file reviewer, foobar review, and more. Add a new agent later, say a terraform reviewer, and it just joins the roster; the branch ruleset itself never has to change.

{% viz scene="books/agent-codeowners/chapter-5" section="ch5-roster" cue="3" from="24.718" to="42.295" title="New agents join the roster behind one stable check name — no ruleset edit required." %}
{% endviz %}

### Both gates, additive

Because it's only a status check, a fix simply reruns it — there's no permanent changes-requested review left behind for someone to manually dismiss. When both gates are satisfied — the human owner, and the check — the merge opens. Neither one alone is enough.

{% viz scene="books/agent-codeowners/chapter-5" section="ch5-bothgates" cue="5" from="42.295" to="65.387" title="Merge opens only when human approval and the required check are both satisfied." %}
{% endviz %}

## Rollout, in order

The proposal ships in phases, each one earning the next. First, a router and dry-run report — CODEOWNERS and agent-comment parsing, base-branch config loading, changed-file matching, review-plan output, no model calls yet — to validate routing and precedence before any cost or noise. Second, the first two reviewers, `@claude/db-review` and `@codex/package-json-review`, running advisory-only while the workflow always passes. Third, structured enforcement: the shared JSON schema, severity validation, sticky-comment updates, inline comments, aggregate exit status, and stale-SHA protection, at which point blocking findings can fail the workflow. Fourth, the required status check itself joins the branch ruleset, with an audited bypass group for genuine outages. Additional harnesses and agents come after that, as demonstrated need — and fork-safe review is deliberately later, separate hardening work, since v1 skips external fork and Dependabot pull requests rather than reaching for `pull_request_target` against untrusted content. The check shouldn't become mandatory until the ratio of confirmed blocking findings to all blocking findings is consistently high enough that engineers trust a failed result.
