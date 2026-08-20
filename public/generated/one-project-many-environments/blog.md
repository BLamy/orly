# One Project, Many Environments

*A proposal for the Replay QA team: split environments out of the project record, migrate to them safely behind a feature flag, and give each environment its own trigger.*

This is not a write-up of something we already shipped — it is a plan I want us to agree on. The short version: a project today stores exactly one target URL and one set of testing instructions, and that single slot is why we keep cloning projects, why override URLs turn run history into a guessing game, and why we cannot express "staging runs on deploy, production runs nightly." I am proposing we fix it in steps: create a `project_environments` table, migrate existing data into it with a script, flip a read-path feature flag, remove the old columns and their code paths, and then build per-environment triggers and journey applicability on top.

## Chapter 1 · The Problem

Projects have a `target_url` and `test_instructions`, but each project can only have one of each. Everything downstream of that constraint is a workaround.

### One slot for a product that lives at many addresses

The `projects` row has a single `target_url` field and a single `test_instructions` field. Staging, pull-request previews, and local builds all need a home, and the schema offers one slot — whatever we type last overwrites the previous answer.

{% viz scene="books/one-project-many-environments/chapter-1" section="chapter-1-single-slot" cue="0" from="0.000" to="24.683" title="One target URL slot means every other deployment bounces off or overwrites it." %}
{% endviz %}

### The override URL hides which world a run used

We do have an escape hatch: a test run can override the target URL at launch. But the override only changes where the run pointed — nothing records which *environment* that address was supposed to be. Three runs with three different addresses, and no way to filter production history from staging noise.

{% viz scene="books/one-project-many-environments/chapter-1" section="chapter-1-override" cue="3" from="24.683" to="45.697" title="Overrides change the address but leave the environment column unknowable." %}
{% endviz %}

### Instructions have the same flaw

Staging needs its own login steps and test accounts, and there is only one instructions field to share. One URL slot, one instructions slot, and runs that cannot name their world — that is the problem this proposal fixes.

{% viz scene="books/one-project-many-environments/chapter-1" section="chapter-1-statement" cue="6" from="45.697" to="62.277" title="The problem statement: single-slot configuration and anonymous run history." %}
{% endviz %}

## Chapter 2 · The Database Solution

A change this aggressive to the data model does not ship in one commit. The plan is the classic expand → migrate → contract sequence, so every step is individually safe to deploy and roll back.

### Two columns are in the wrong table

`target_url` and `test_instructions` describe a *deployment* of the product, not the product itself. They are the columns we are going to move.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-odd-columns" cue="0" from="0.000" to="21.676" title="The migration plan, and the two columns that describe a deployment rather than the product." %}
{% endviz %}

### Step 1 — Expand: create `project_environments`

The first deploy is purely additive: a new table with `project_id`, `name`, `kind`, `target_url`, and `test_instructions`. Nothing reads it yet, so it cannot break production. The foreign key back to `projects` is the whole point — it turns one-to-one into one-to-many, so one project can own as many environments as we deploy.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-expand" cue="2" from="21.676" to="38.476" title="An additive table and a one-to-many foreign key back to the project." %}
{% endviz %}

### Step 2 — Migrate: a dry-run-first backfill, cut over by a feature flag

A script copies each project's current URL and instructions into a default `production` environment row. It is dry-run by default: we point it at a few projects with `--project-id`, read the report of what it *would* do, and only then pass `--live` for everyone. Which table we read from sits behind a feature flag that ships dark — old columns keep serving reads until the backfill lands, then we flip `env_reads` on. If anything looks wrong, flipping it back is the instant rollback.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-migrate" cue="4" from="38.476" to="73.514" title="Backfill into a default production environment, then flip the read-path flag — flip back is the rollback." %}
{% endviz %}

### Step 3 — Contract: drop the old columns, repoint the runs

Only when the flag has been on and quiet do we contract: drop `target_url` and `test_instructions` from `projects`, then delete the flag and the old read path. Test runs get the same expand-then-migrate treatment: today a run points at a project and a raw URL, so we add a *nullable* `environment_id`, backfill history — a run whose URL matches an environment gets that row, everything else defaults to production — and only when every run has one does the column become `NOT NULL`. The override URL stops being a mystery and becomes provenance.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-contract" cue="8" from="73.514" to="117.168" title="Drop the old columns and the flag last, then backfill test runs onto their environment before the column goes NOT NULL." %}
{% endviz %}

## Chapter 3 · Different Environments, Different Triggers

The payoff step. Once environments are real rows, each row can own the second thing that differs between worlds: what starts a run.

### Production watches the clock

We propose a nightly run every weekday against the live site. No human in the loop — if Tuesday night breaks checkout, we know before Wednesday standup.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-production" cue="0" from="0.000" to="22.512" title="Production runs nightly on weekdays, on a schedule the environment owns." %}
{% endviz %}

### Staging watches the pipeline

When a merge lands on `main` and the deploy pipeline finishes, that completion event is the trigger — not the merge itself. We only test staging once the new code is actually serving traffic.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-staging" cue="3" from="22.512" to="38.534" title="Staging fires on deployment-pipeline completion, not on the merge." %}
{% endviz %}

### Pull requests watch the review state

A draft PR does nothing. Marking it ready for review arms the trigger, and the run fires only when the preview deployment is also live — two conditions gating one run: ready for review, and a resolvable preview address.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-preview" cue="5" from="38.534" to="58.457" title="Preview runs gate on ready-for-review AND a live preview deployment." %}
{% endviz %}

### Journeys are shared — but scoped to where they work

The journeys themselves never changed: sign-in, search, checkout, and profile are written once, and each trigger picks the world they run against. The one exception worth designing for: some journeys only work in some worlds. Stripe checkout uses test cards, so we mark it staging-and-preview-only in a `journey_environments` applicability row, and the nightly production run simply skips it — no real charges, no special-casing inside the journey.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-applicability" cue="7" from="58.457" to="97.199" title="A journey-by-environment applicability matrix keeps Stripe checkout out of production." %}
{% endviz %}

## The ask

Concretely, I would like sign-off on the steps in order: (1) ship the additive `project_environments` table, (2) run the backfill script — dry-run on a handful of projects first, then `--live` — and flip the `env_reads` feature flag once it lands, (3) contract by dropping `projects.target_url` and `projects.test_instructions` and deleting the flag plus the fallback reads, (4) build the per-environment trigger configuration — nightly weekdays for production, deploy-completion for staging, ready-for-review plus live preview for PRs — and (5) add journey-to-environment applicability so flows like Stripe checkout are scoped to the worlds where they are safe. Steps 1–3 are deliberately boring; each one deploys independently and rolls back cleanly. Steps 4 and 5 are where the team starts feeling the win.
