# One Project, Many Environments

*A proposal for the Replay QA team: split environments out of the project record, migrate to them safely behind a feature flag, and give each environment its own trigger.*

This is not a write-up of something we already shipped — it is a plan I want us to agree on. The short version: a project today stores exactly one target URL and one set of testing instructions, and that single slot is why we keep cloning projects, why override URLs turn run history into a guessing game, and why we cannot express "staging runs on deploy, production runs nightly." I am proposing we fix it in steps: create a `project_environments` table, migrate existing data into it with a script, flip a read-path feature flag, remove the old columns and their code paths, and then build per-environment triggers and journey applicability on top.

## Chapter 1 · The Problem

Projects have a `target_url` and `test_instructions`, but each project can only have one of each. Everything downstream of that constraint is a workaround.

### One slot for a product that lives at many addresses

The `projects` row has a single `target_url` field and a single `test_instructions` field. Staging, pull-request previews, and local builds all need a home, and the schema offers one slot — whatever we type last overwrites the previous answer.

{% viz scene="books/one-project-many-environments/chapter-1" section="chapter-1-single-slot" cue="0" from="0.000" to="24.323" title="One target URL slot means every other deployment bounces off or overwrites it." %}
{% endviz %}

### The override URL hides which world a run used

We do have an escape hatch: a test run can override the target URL at launch. But the override only changes where the run pointed — nothing records which *environment* that address was supposed to be. Three runs with three different addresses, and no way to filter production history from staging noise.

{% viz scene="books/one-project-many-environments/chapter-1" section="chapter-1-override" cue="3" from="24.323" to="44.291" title="Overrides change the address but leave the environment column unknowable." %}
{% endviz %}

### Instructions have the same flaw

Staging needs its own login steps and test accounts, and there is only one instructions field to share. One URL slot, one instructions slot, and runs that cannot name their world — that is the problem this proposal fixes.

{% viz scene="books/one-project-many-environments/chapter-1" section="chapter-1-statement" cue="6" from="44.291" to="61.022" title="The problem statement: single-slot configuration and anonymous run history." %}
{% endviz %}

## Chapter 2 · The Database Solution

A change this aggressive to the data model does not ship in one commit. The plan is the classic expand → migrate → contract sequence, so every step is individually safe to deploy and roll back.

### Two columns are in the wrong table

`target_url` and `test_instructions` describe a *deployment* of the product, not the product itself. They are the columns we are going to move.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-odd-columns" cue="0" from="0.000" to="21.153" title="The migration plan, and the two columns that describe a deployment rather than the product." %}
{% endviz %}

### Step 1 — Expand: create `project_environments`

The first deploy is purely additive: a new table with `project_id`, `name`, `kind`, `target_url`, and `test_instructions`. Nothing reads it yet, so it cannot break production. The foreign key back to `projects` is the whole point — it turns one-to-one into one-to-many, so one project can own as many environments as we deploy.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-expand" cue="2" from="21.153" to="39.567" title="An additive table and a one-to-many foreign key back to the project." %}
{% endviz %}

### Step 2 — Migrate: a dry-run-first backfill, cut over by a feature flag

A script inspects each project's current URL and classifies it into an environment: a publicly reachable address becomes `production`, a URL associated with a pull request becomes a `preview`, and a localhost URL becomes a local `development` environment — instructions travel along with it. The script is dry-run by default: we point it at a few projects with `--project-id`, read the report of what it *would* do, and only then pass `--live` for everyone. Which table we read from sits behind a feature flag that ships dark — old columns keep serving reads until the backfill lands, then we flip `env_reads` on. If anything looks wrong, flipping it back is the instant rollback.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-migrate" cue="4" from="39.567" to="77.775" title="Backfill into a default production environment, then flip the read-path flag — flip back is the rollback." %}
{% endviz %}

### Step 3 — Contract: drop the old columns, repoint the runs

Only when the flag has been on and quiet do we contract: drop `target_url` and `test_instructions` from `projects`, then delete the flag and the old read path. Test runs get the same expand-then-migrate treatment: today a run points at a project and a raw URL, so we add a *nullable* `environment_id`, backfill history — a run whose URL matches an environment gets that row, and the rest are classified by the same URL inspection (reachable → production, PR URL → preview, localhost → local) — and only when every run has one does the column become `NOT NULL`. The override URL stops being a mystery and becomes provenance.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-contract" cue="8" from="77.775" to="122.741" title="Drop the old columns and the flag last, then backfill test runs onto their environment before the column goes NOT NULL." %}
{% endviz %}

## Chapter 3 · Different Environments, Different Triggers

The payoff step. Once environments are real rows, each row can own the second thing that differs between worlds: what starts a run.

### Production watches the clock

We propose a nightly run every weekday against the live site. No human in the loop — if Tuesday night breaks checkout, we know before Wednesday standup.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-production" cue="0" from="0.000" to="22.326" title="Production runs nightly on weekdays, on a schedule the environment owns." %}
{% endviz %}

### Staging watches the pipeline

When a merge lands on `main` and the deploy pipeline finishes, that completion event is the trigger — not the merge itself. We only test staging once the new code is actually serving traffic.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-staging" cue="3" from="22.326" to="36.908" title="Staging fires on deployment-pipeline completion, not on the merge." %}
{% endviz %}

### Pull requests watch the review state

A draft PR does nothing. Marking it ready for review arms the trigger, and the run fires only when the preview deployment is also live — two conditions gating one run: ready for review, and a resolvable preview address.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-preview" cue="5" from="36.908" to="56.482" title="Preview runs gate on ready-for-review AND a live preview deployment." %}
{% endviz %}

### Journeys are shared — but scoped to where they work

The journeys themselves never changed: sign-in, search, checkout, and profile are written once, and each trigger picks the world they run against. Journeys follow the same migration playbook: the backfill marks every journey as applicable to *every* environment, so day one behaves exactly like today. Then we opt out where a journey cannot work — Stripe checkout would run real charges in production, so we uncheck that one cell in the `journey_environments` applicability table, and the nightly production run simply skips it. No special-casing inside the journey.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-applicability" cue="7" from="56.482" to="93.204" title="A journey-by-environment applicability matrix keeps Stripe checkout out of production." %}
{% endviz %}

### Credentials are part of the environment too

One more thing this model should absorb: test logins. Today they are not in the instructions text — they live as plaintext `{name, init}` pairs in `projects.global_variables` (conventionally `login_email` / `login_password`), flattened from the login form and interpolated into the agent's prompt at run time. That is project-scoped, which has the exact same defect as the single `target_url`: the staging demo account and the production smoke-test account are different credentials for different worlds. As part of Step 1 the environment row should get its own variables (falling back to the project's globals via the same read-path flag), and the backfill classifies them along with the URL. It is also worth flagging separately that these credentials are stored and returned by the API unredacted today — moving them to the environment is a natural moment to fix that.

## The ask

Concretely, I would like sign-off on the steps in order: (1) ship the additive `project_environments` table, (1b) give environments their own login variables with fallback to the project globals, (2) run the URL-classifying backfill — dry-run on a handful of projects first, then `--live` — and flip the `env_reads` feature flag once it lands, (3) contract by dropping `projects.target_url` and `projects.test_instructions` and deleting the flag plus the fallback reads, (4) build the per-environment trigger configuration — nightly weekdays for production, deploy-completion for staging, ready-for-review plus live preview for PRs — and (5) add journey-to-environment applicability, backfilled as applicable-everywhere so nothing changes on day one, with opt-outs for flows like Stripe checkout that are only safe in some worlds. Steps 1–3 are deliberately boring; each one deploys independently and rolls back cleanly. Steps 4 and 5 are where the team starts feeling the win.
