# One Project, Many Environments

*A visual tour of [Replay QA PR #1686](https://github.com/replayio/loop-qa/pull/1686): the first vertical slice toward making production, staging, development, and pull-request previews different contexts inside one project—not different projects with copied journeys.*

A test project should describe a product. A deployment is only one place where that product is running. When those two ideas are collapsed into a single URL field, every additional deployment pushes the user toward cloning the project, duplicating its journeys, and losing the ability to compare results as one continuous history.

This change introduces a durable environment record between the project and each run. The environment owns its target URL, testing instructions, trigger, and source configuration. A run snapshots the environment and deployment it actually used. Existing single-URL projects continue to behave as one production environment, while chat, schedules, and GitHub can begin selecting an explicit world.

## Chapter 1 · Stop Cloning the Project

The old model makes the deployment boundary look like a project boundary. Production, staging, development, and preview each become a separate box with their own copies of sign-in, search, checkout, and profile. Those copies drift even though they are meant to describe the same product behavior.

### Four deployments are not four products

Watch the duplicated journey particles line up under four project cards. Nothing about the user intent changed; only the URL did. The duplication is accidental state created by the data model.

{% viz scene="books/one-project-many-environments/chapter-1" section="chapter-1-duplicates" cue="0" from="0.000" to="26.400" title="Duplicated projects repeat the same journeys for every deployment." %}
{% endviz %}

The new `project_environments` table gives each deployment a stable identity and a conventional kind: production, staging, development, or preview. The project keeps the shared journey catalog. Environments carry what really varies: URL, instructions, trigger configuration, source, and deployment context.

### One catalog, named environments

The four copies now collapse into one project. The journeys remain in the center while named environment rows become selectable contexts around them. Existing projects are read compatibly as a default production environment, so this structural change does not force a flag day.

{% viz scene="books/one-project-many-environments/chapter-1" section="chapter-1-collapse" cue="4" from="26.400" to="52.900" title="One shared journey catalog fans out to named environments." %}
{% endviz %}

The same API is exposed to project chat. “Add this as my staging URL” can create or update the staging record without replacing production. “Use these login instructions in staging” changes only that environment’s testing instructions. The chat becomes a configuration surface for the model rather than a special onboarding detour.

## Chapter 2 · The Trigger Chooses the World

An environment is more than a label on a URL. It also says how work begins. This slice supports four trigger types: manual, schedule, GitHub App, and GitHub Actions. The choice is stored with the environment so a trigger resolves both *why this run started* and *where it should run*.

### Trigger policy belongs beside the target

The dial moves across the four trigger sources. A scheduled production environment can run weekly while staging remains manual. The project does not need a second copy of its journeys to express that policy.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-trigger-policy" cue="0" from="0.000" to="26.300" title="Each environment owns the trigger that is allowed to start it." %}
{% endviz %}

GitHub App is deliberately gated: it is only a valid source when the app is installed for the project repository. Schedules map familiar choices such as nightly and Sunday weekly runs to predictable cron expressions. Manual and GitHub Actions remain explicit alternatives rather than being inferred from a URL.

### A preview deployment must release the journeys

The important edge case starts with a pull request run in “Awaiting Deployment.” The GitHub App receives the preview deployment URL, binds it to the preview environment, releases the waiting version, and schedules the project’s shared journeys against that resolved target.

{% viz scene="books/one-project-many-environments/chapter-2" section="chapter-2-preview-release" cue="4" from="26.300" to="59.700" title="A deployment URL releases a waiting pull-request run into shared journeys." %}
{% endviz %}

That last transition is the practical fix for runs that knew a preview URL but ended with zero journeys. The deployment event is no longer just metadata attached to an empty test run; it is the signal that makes the preview environment runnable.

## Chapter 3 · Runs Remember Their World

Moving source configuration to the environment does not mean erasing run history. Configuration answers what should happen next. Provenance answers what happened then. Every run therefore stores an immutable snapshot of the environment, trigger source, target URL, and deployment it resolved at launch.

### Resolve once, stamp the run

Follow the resolver from the Production environment into a new test session. It copies the environment identity and name, the trigger source, the exact target URL, and any deployment identifier into the run record before journeys begin.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-provenance" cue="0" from="0.000" to="27.200" title="Run creation snapshots its environment and deployment provenance." %}
{% endviz %}

The Test Runs UI can now make the active world unambiguous. “Environment” answers where the test ran; “Source” answers what initiated it; the target URL and pull-request deployment supply the concrete provenance. Those are related facts, not competing labels.

### Configuration changes without rewriting history

Now change Production from manual to a weekly Sunday schedule. The environment updates, and future runs inherit the schedule. The older run remains stamped “manual,” preserving the truth of how it started.

{% viz scene="books/one-project-many-environments/chapter-3" section="chapter-3-history" cue="4" from="27.200" to="61.500" title="A trigger update changes future behavior without rewriting prior runs." %}
{% endviz %}

The backfill follows the same safety rule. Its default mode is a scoped dry run, with `--project-id` and `--user-id` filters so conversion can be inspected on a small set first. It reports the production environment, instructions, and trigger it would create. Mutations happen only when `--live` is supplied.

## What this slice establishes

PR #1686 establishes the shared vocabulary and closes the preview-deployment scheduling gap: named environment records, environment-specific instructions and triggers, chat configuration, compatibility for existing projects, run provenance, scheduled selection, GitHub installation gating, and a dry-run-first migration path.

It is not the whole multi-environment roadmap. Per-journey applicability still needs a richer targeting UI and policy model. Environment-specific credentials, complete FRPC and CLI binding, and broader environment management screens remain later gates. The useful boundary is already here, though: one Replay QA project can begin to own many deploys without cloning the definition of what should be tested.
