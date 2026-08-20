# One Project, Many Environments

*A proposal for the Replay QA team: keep the project's fields as defaults, and let environments overlay them.*

This is not a write-up of something we already shipped — it is a plan I want us to agree on. A project today stores exactly one target URL, one set of test instructions, and one bag of global variables (which is where the test logins actually live). That single slot per project is why we keep cloning projects, why override URLs turn run history into a guessing game, and why we cannot express "staging runs on deploy, production runs nightly." The proposal: those project fields become the *defaults*, and environments become overlay rows that override or inherit them per field.

## Chapter 1 · The Problem

Projects have a `target_url` and `test_instructions`, but each project can only have one of each. Everything downstream of that constraint is a workaround.

### One slot for a product that lives at many addresses

The `projects` row has a single `target_url` field and a single `test_instructions` field. Staging, pull-request previews, and local builds all need a home, and the schema offers one slot — whatever we type last overwrites the previous answer.

{% viz scene="books/one-project-many-environments/chapter-1" section="chapter-1-single-slot" cue="0" from="0.000" to="24.288" title="One target URL slot means every other deployment bounces off or overwrites it." %}
{% endviz %}

### The override URL is just an address

We do have an escape hatch: a test run can override the target URL at launch. But a URL carries no knowledge of how to test the world behind it — not which login to use, not which steps differ there, and no record of which environment it was supposed to be. Slight environmental differences quietly break: the staging login fails against a preview build, and nobody can filter production history from staging noise.

{% viz scene="books/one-project-many-environments/chapter-1" section="chapter-1-override" cue="3" from="24.288" to="51.967" title="An override URL carries no logins, no instructions, and no environment identity." %}
{% endviz %}

### Instructions and logins have the same flaw

Staging needs its own login and its own steps, and there is one instructions field and one project-wide set of login variables to share. One slot each, and runs that cannot name their world — that is the problem this proposal fixes.

{% viz scene="books/one-project-many-environments/chapter-1" section="chapter-1-statement" cue="6" from="51.967" to="69.521" title="The problem statement: single-slot configuration and anonymous run history." %}
{% endviz %}

## Chapter 2 · The Database Solution

The design in one sentence: project fields are the defaults, and an environment is an overlay that states only what makes it different.

### Defaults below, overlays above

`projects.target_url`, `projects.test_instructions`, and `projects.global_variables` take on a clear role: the project-wide defaults. Beside them, a `project_environments` row carries a name, a kind, a trigger, and three *optional* fields — `target_url`, `test_instructions`, `environment_variables` — that shadow those defaults (for a preview environment, `target_url` may be a pattern rather than an address — chapter 3 shows how it resolves). The foreign key makes it one project, many environments: production, staging, and a preview for every pull request, all standing on the same defaults.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-overlay" cue="0" from="0.000" to="30.801" title="Project fields as defaults; environments as overlays with optional shadow fields." %}
{% endviz %}

### Resolution is a fallback chain

`resolve(field) = environment.field ?? project.field`. Staging defines its own `login_email`, so it overrides the global one — in staging only. Staging doesn't define instructions, so it inherits the project's. Each environment states only what makes it different. This is also where test logins get a proper home: today they are plaintext `login_email` / `login_password` pairs in `projects.global_variables`, project-scoped and returned unredacted by the API — per-environment `environment_variables` override them by name, and touching them is a natural moment to add redaction. And a project with no environment rows resolves every field to its own defaults, so existing projects keep working exactly as they do today without touching a single row.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-fallback" cue="3" from="30.801" to="60.198" title="environment.field ?? project.field — override where defined, inherit where not." %}
{% endviz %}

### Runs name their world

`test_runs` gains one nullable `environment_id`. Null means "the project defaults," which keeps every run we have ever recorded truthful, and every run against an environment carries its identity from now on.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-runs" cue="6" from="60.198" to="70.461" title="One nullable column: null means project defaults, set means a named world." %}
{% endviz %}

### Journeys run everywhere unless excluded

`journey_exclusions` starts empty, and empty means every journey runs in every environment — exactly today's behavior. One row keeps Stripe checkout out of production. Two new tables, one nullable column, and every change is additive.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-exclusions" cue="7" from="70.461" to="87.678" title="An empty exclusions table changes nothing; one row scopes a journey." %}
{% endviz %}

## Chapter 3 · Different Environments, Different Triggers

The payoff. Once environments are real rows, each row can own the second thing that differs between worlds: what starts a run.

### Production watches the clock

We propose a nightly run every weekday against the live site. No human in the loop — if Tuesday night breaks checkout, we know before Wednesday standup.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-production" cue="0" from="0.000" to="22.349" title="Production runs nightly on weekdays, on a schedule the environment owns." %}
{% endviz %}

### Staging watches the pipeline

When a merge lands on `main` and the deploy pipeline finishes, that completion event is the trigger — not the merge itself. We only test staging once the new code is actually serving traffic.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-staging" cue="3" from="22.349" to="37.860" title="Staging fires on deployment-pipeline completion, not on the merge." %}
{% endviz %}

### Pull requests watch the review state — and resolve a pattern

A draft PR does nothing; marking it ready for review arms the trigger. But a pull request rarely has just one link, so a preview environment doesn't store an address at all — its `target_url` is a *pattern* (e.g. `https://preview-*.example.com`). When the trigger arms, we search the PR for links matching the pattern: the **checks** first, then the **comments**; the first match wins. That resolved link becomes the run's `override_url`, recorded against the preview environment — several deploy links, one right answer, and history still names its world.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-preview" cue="5" from="37.860" to="77.055" title="Ready-for-review arms the trigger; the preview URL pattern is resolved from PR checks, then comments." %}
{% endviz %}

### Journeys run everywhere — unless excluded

The exclusions table starts empty, and empty means every journey runs in every environment, exactly like today. Then we exclude where a journey cannot work — Stripe checkout would run real charges in production, so one exclusion row keeps it out and the nightly run simply skips it. No special-casing inside the journey.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-exclusions" cue="7" from="77.055" to="115.960" title="Run everywhere by default; one exclusion row keeps Stripe checkout out of production." %}
{% endviz %}

## The ask

Concretely, I would like sign-off on four additive pieces, in order: (1) the `project_environments` overlay table — name, kind, trigger config, and optional `target_url` / `test_instructions` / `environment_variables` that shadow the project defaults — plus the `environment.field ?? project.field` resolution everywhere a run reads configuration; (2) the nullable `test_runs.environment_id`, so every new run names its world while null keeps meaning "project defaults" for all existing history; (3) the `journey_exclusions` table, empty on day one; and (4) per-environment triggers — nightly weekdays for production, deploy-completion for staging, and ready-for-review for PRs, where the preview environment's pattern `target_url` is resolved against the PR's checks and then comments, with the match recorded as the run's `override_url`. Nothing here backfills, drops, or rewrites anything: each piece deploys independently, and a project that never adds an environment never notices any of it.
