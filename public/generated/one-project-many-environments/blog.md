# One Project, Many Environments

*A proposal for the Replay QA team: split environments out of the project record, migrate four tables safely behind a feature flag, and give each environment its own trigger.*

This is not a write-up of something we already shipped — it is a plan I want us to agree on. The short version: a project today stores exactly one target URL and one set of testing instructions, and that single slot is why we keep cloning projects, why override URLs turn run history into a guessing game, and why we cannot express "staging runs on deploy, production runs nightly." I am proposing we fix it in steps: create the environment tables, migrate existing data into them with a URL-classifying script, flip a read-path feature flag, remove the old columns and their code paths, and then build per-environment triggers and journey applicability on top.

## Chapter 1 · The Problem

Projects have a `target_url` and `test_instructions`, but each project can only have one of each. Everything downstream of that constraint is a workaround.

### One slot for a product that lives at many addresses

The `projects` row has a single `target_url` field and a single `test_instructions` field. Staging, pull-request previews, and local builds all need a home, and the schema offers one slot — whatever we type last overwrites the previous answer.

{% viz scene="books/one-project-many-environments/chapter-1" section="chapter-1-single-slot" cue="0" from="0.000" to="24.915" title="One target URL slot means every other deployment bounces off or overwrites it." %}
{% endviz %}

### The override URL is just an address

We do have an escape hatch: a test run can override the target URL at launch. But a URL carries no knowledge of how to test the world behind it — not which login to use, not which steps differ there, and no record of which environment it was supposed to be. Slight environmental differences quietly break: the staging login fails against a preview build, and nobody can filter production history from staging noise.

{% viz scene="books/one-project-many-environments/chapter-1" section="chapter-1-override" cue="3" from="24.915" to="49.853" title="An override URL carries no logins, no instructions, and no environment identity." %}
{% endviz %}

### Instructions have the same flaw

Staging needs its own login steps and test accounts, and there is only one instructions field to share. One URL slot, one instructions slot, and runs that cannot name their world — that is the problem this proposal fixes.

{% viz scene="books/one-project-many-environments/chapter-1" section="chapter-1-statement" cue="6" from="49.853" to="66.409" title="The problem statement: single-slot configuration and anonymous run history." %}
{% endviz %}

## Chapter 2 · The Database Solution

A change this aggressive to the data model does not ship in one commit — and it is wider than one table. Four tables are touched: `projects` and `test_runs` change in place, `project_environments` and `journey_environments` are brand new. The plan is the classic expand → migrate → contract sequence, so every step is individually safe to deploy and roll back.

### The footprint: four tables, two new, two changed

The trouble lives in `projects`: its `target_url`, `test_instructions`, and login variables all describe a *deployment* of the product, not the product itself. Those are the fields we are going to move.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-footprint" cue="0" from="0.000" to="28.839" title="The whole migration footprint, and the three projects columns that describe a deployment." %}
{% endviz %}

### Step 1 — Expand: additive everywhere

The first deploy only adds things, so it cannot break production. `project_environments` takes the three fields plus a `kind`, an `is_default` marker, and trigger configuration; its foreign key turns one project into many environments. One row is the default, and every other environment inherits instructions and logins from it unless it defines its own. In the same step, `test_runs` gains a *nullable* `environment_id` and the new `journey_environments` join table connects each journey to the worlds it may run in.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-expand" cue="3" from="28.839" to="64.260" title="Additive columns and tables: environments with a default row, a nullable run column, a journey join table." %}
{% endviz %}

### Step 2 — Migrate: classify by URL, cut over by flag

The backfill inspects each project URL: a publicly reachable address becomes `production`, a pull-request address becomes a `preview`, and localhost becomes local `development`. It is dry-run by default — scope it with `--project-id`, read the report, then pass `--live`. Which table reads come from sits behind an `env_reads` feature flag that ships dark; we flip it the moment the backfill lands, and flipping it back is the instant rollback. Historical test runs are mapped the same way (match the URL, classify the rest) before their column goes `NOT NULL`, and journeys are backfilled as applicable to every environment so day one behaves exactly like today.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-migrate" cue="6" from="64.260" to="114.741" title="URL-classifying backfill, dry run before live, the env_reads flag as cutover and rollback, runs and journeys mapped." %}
{% endviz %}

### Step 3 — Contract: pay down the debt last

Only when the flag has been on and quiet do we drop the three old columns from `projects` and delete the flag and the fallback reads. Four tables, three steps, no flag day — and every run afterward names the world it ran in.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-contract" cue="11" from="114.741" to="132.864" title="Drop the old columns and the flag last — four tables, three steps, no flag day." %}
{% endviz %}

## Chapter 3 · Different Environments, Different Triggers

The payoff step. Once environments are real rows, each row can own the second thing that differs between worlds: what starts a run.

### Production watches the clock

We propose a nightly run every weekday against the live site. No human in the loop — if Tuesday night breaks checkout, we know before Wednesday standup.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-production" cue="0" from="0.000" to="21.989" title="Production runs nightly on weekdays, on a schedule the environment owns." %}
{% endviz %}

### Staging watches the pipeline

When a merge lands on `main` and the deploy pipeline finishes, that completion event is the trigger — not the merge itself. We only test staging once the new code is actually serving traffic.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-staging" cue="3" from="21.989" to="36.606" title="Staging fires on deployment-pipeline completion, not on the merge." %}
{% endviz %}

### Pull requests watch the review state

A draft PR does nothing. Marking it ready for review arms the trigger, and the run fires only when the preview deployment is also live — two conditions gating one run: ready for review, and a resolvable preview address.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-preview" cue="5" from="36.606" to="55.065" title="Preview runs gate on ready-for-review AND a live preview deployment." %}
{% endviz %}

### Journeys are shared — but scoped to where they work

Journeys follow the same migration playbook: the backfill marks every journey as applicable to *every* environment, so day one behaves exactly like today. Then we opt out where a journey cannot work — Stripe checkout would run real charges in production, so we uncheck that one cell in the `journey_environments` applicability table, and the nightly production run simply skips it. No special-casing inside the journey.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-applicability" cue="7" from="55.065" to="92.461" title="A journey-by-environment applicability matrix keeps Stripe checkout out of production." %}
{% endviz %}

### Credentials are part of the environment too

One more thing this model should absorb: test logins. Today they are not in the instructions text — they live as plaintext `{name, init}` pairs in `projects.global_variables` (conventionally `login_email` / `login_password`), flattened from the login form and interpolated into the agent's prompt at run time. That is project-scoped, which has the exact same defect as the single `target_url`: the staging demo account and the production smoke-test account are different credentials for different worlds. The environment row therefore carries its own login variables, inheriting from the default environment via the same read-path flag, and the backfill classifies them along with the URL. It is also worth flagging separately that these credentials are stored and returned by the API unredacted today — moving them to the environment is a natural moment to fix that.

## The ask

Concretely, I would like sign-off on the steps in order: (1) ship the additive schema — `project_environments` with its `is_default` inheritance model and per-environment login variables, a nullable `test_runs.environment_id`, and the `journey_environments` join table; (2) run the URL-classifying backfill — dry-run on a handful of projects first, then `--live` — and flip the `env_reads` feature flag once it lands; (3) contract by dropping `projects.target_url`, `projects.test_instructions`, and the project-scoped login variables, deleting the flag plus the fallback reads; (4) build the per-environment trigger configuration — nightly weekdays for production, deploy-completion for staging, ready-for-review plus live preview for PRs; and (5) add journey-to-environment applicability, backfilled as applicable-everywhere so nothing changes on day one, with opt-outs for flows like Stripe checkout that are only safe in some worlds. Steps 1–3 are deliberately boring; each one deploys independently and rolls back cleanly. Steps 4 and 5 are where the team starts feeling the win.
