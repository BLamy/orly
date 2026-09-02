# Five Doors

- **Product:** [Replay QA](https://qa.replay.io) — an agent that drives your app in a real browser, records the journeys worth protecting, reruns them, and files bugs with a recording behind each one.
- **Grounding:** the `loop-qa` codebase — `src/lib/projectEnvironment.ts` (environment kinds and triggers), `netlify/functions/lib/environment-schedules.ts` (cadence to cron, the 15-minute sweep), `netlify/functions/lib/project-environments.ts` (variable overlay, journey exclusions), `docs/github-app/overview.md`, `docs/frp-tunnel/*`, and `netlify/functions/lib/reverse-proxy-instructions.ts`.
- **Throughline:** the feedback loop. Every environment you add makes it one notch shorter.

A Replay QA project does not need five environments on day one. It needs one door into the app and a loop that runs through it. This book walks the five doors in the order most teams open them: production first, then staging on a schedule, then pull requests through the Github App, then a CI tunnel for apps that never get a public preview, and finally your own laptop.

## 1. Start With Production

### Point it at the app your users already touch

The first environment is the one that already exists. Give QA the production address and an exploration begins: an agent drives the app in a real browser and discovers what it can do the way a new user would. Each exploration costs one credit and runs in the background.

{% viz scene="books/five-doors/chapter-1" section="chapter-1-production-door" cue="0" from="0.000" to="14.500" title="An exploration walks the production app the way a new user would." %}
{% endviz %}

The map of pages the exploration touches is the raw material for everything that follows.

### Journeys, the first run, and a bug with evidence

A path worth protecting becomes a journey: a recorded sequence of steps with checks, versioned so it can run again. A test run replays the journeys against production, and when a step fails you get a bug with the recording behind it. Believing the report costs a look, not a debate; believing "it works" is the expensive claim, and that is what the recording is for.

{% viz scene="books/five-doors/chapter-1" section="chapter-1-journey-and-bug" cue="2" from="14.500" to="35.200" title="The purchase path becomes a journey; a failing checkout step files a bug with its recording." %}
{% endviz %}

### The dials that keep the loop honest

Two settings bound what QA can do on its own: a **budget** of credits the project may spend before it pauses, and a **bug limit** that stops filing once enough open bugs exist. A **design document** gives the judge something to check behavior against — QA reads it when deciding whether a behavior is a bug.

{% viz scene="books/five-doors/chapter-1" section="chapter-1-dials" cue="5" from="35.200" to="50.100" title="Budget, bug limit, and the design document." %}
{% endviz %}

### One environment, one loop

Production alone, run once or once a week, is a perfectly good place to start. The loop is already complete: explore, record journeys, run them again, file bugs with evidence.

{% viz scene="books/five-doors/chapter-1" section="chapter-1-one-loop" cue="7" from="50.100" to="63.018" title="One environment, one loop." %}
{% endviz %}

## 2. Add Staging, Test Every Night

### An environment is a name, a kind, a target, and a trigger

Once production has a baseline the question becomes what breaks *before* a release. A staging environment answers it. Environment kinds are `production`, `staging`, `development`, `preview`, and `local`; each has a target URL (or inherits the project's), an optional testing-guidelines override, and a trigger. Environment variables are overlaid on the project's saved logins by name, so staging can sign in with staging credentials without touching production's.

{% viz scene="books/five-doors/chapter-2" section="chapter-2-environment" cue="0" from="0.000" to="22.900" title="A staging card beside production, with its own variable overlay." %}
{% endviz %}

### Nightly becomes a cron line and a fifteen-minute sweep

Setting the trigger to a schedule with a nightly-weekdays cadence stores one cron line, `0 21 * * 1-5`, in your timezone. A sweep wakes every fifteen minutes and asks each scheduled environment whether its cron is due. When staging comes due, every judge-approved journey that is not excluded for that environment is queued and the run starts.

{% viz scene="books/five-doors/chapter-2" section="chapter-2-cron-sweep" cue="3" from="22.900" to="43.500" title="The sweep hand crosses nine in the evening and the staging queue fills." %}
{% endviz %}

### Exclusions, and a bug that knows where it happened

A journey can be excluded per environment, so a production-only flow such as a live payment capture does not fail against staging every night. Bugs filed by the nightly run carry the environment's name. Production weekly, staging nightly: the loop is a day shorter.

{% viz scene="books/five-doors/chapter-2" section="chapter-2-exclusions" cue="6" from="43.500" to="62.462" title="One excluded journey, one staging bug by morning." %}
{% endviz %}

## 3. Let Github Open the Door

### Install the app, point pull requests at Github events

A bug found at night is already merged. Installing the Replay QA Github App and setting pull request testing to listen to Github events moves the loop in front of the merge. When a pull request opens, QA records a version for the commit and posts a `Replay QA` check that is waiting for a deployment.

{% viz scene="books/five-doors/chapter-3" section="chapter-3-pr-opens" cue="0" from="0.000" to="20.000" title="A pull request opens; a version and an in-progress check appear." %}
{% endviz %}

### Parked until the preview deploys

The version parks, showing **Awaiting Deployment**, until Github reports a preview deployment — a `deployment_status` from Vercel or Netlify, or a commit status from your own workflow. That event carries the preview address, and QA runs the journeys against it as a `preview` environment.

{% viz scene="books/five-doors/chapter-3" section="chapter-3-parked" cue="3" from="20.000" to="33.500" title="The deployment event opens the gate; journeys run on the preview URL." %}
{% endviz %}

### The comment, the check, and the issue tracker

The sticky comment updates with which journeys passed and failed and links to the recording; the check concludes neutral, success, or failure. Bugs are tagged with the pull request number, and with issue filing on they land in Github Issues, Linear, or Jira.

{% viz scene="books/five-doors/chapter-3" section="chapter-3-results" cue="5" from="33.500" to="53.964" title="Results post back to the pull request and the tracker." %}
{% endviz %}

## 4. Bring CI Into the Tunnel

### When the app only exists inside the job

Some apps never get a public preview: they boot inside the CI job and only that runner can reach them. Instead of deploying, the runner brings the app to QA. It runs `npx --yes replayqa proxy --project <id> --qa-url <origin> --allow "host,host"` with a CI connection purpose. The command uses your existing login, installs the tunnel client, and starts a local forward proxy that only allows the hosts you list.

{% viz scene="books/five-doors/chapter-4" section="chapter-4-runner" cue="0" from="0.000" to="21.100" title="The runner starts the proxy with an allowlist." %}
{% endviz %}

### One tunnel server per connection

Replay QA provisions a tunnel server for the connection and its test browsers route through it into the runner. A CI connection creates a `preview` environment with the `github-action` trigger and keeps the pull request on the run for provenance.

{% viz scene="books/five-doors/chapter-4" section="chapter-4-tunnel" cue="3" from="21.100" to="35.900" title="Requests travel from the QA browsers through the tunnel to the app." %}
{% endviz %}

### Keep it running until the test ends

Stopping the command disconnects the browsers from the app, so leave it running for the whole test. When the run finishes the results post back like any other preview run — the app never left the runner.

{% viz scene="books/five-doors/chapter-4" section="chapter-4-results" cue="5" from="35.900" to="51.966" title="Per pull request becomes per CI job, with no public deployment." %}
{% endviz %}

## 5. The Tightest Loop: Your Laptop

### A project that waits for your machine

The shortest loop skips deployment entirely. A project onboarded for a local app starts paused, **Awaiting start**, until the first connection. Run the same proxy command on the machine that hosts the app; when it connects, the project shows **Local computer connected** and Start QA unlocks.

{% viz scene="books/five-doors/chapter-5" section="chapter-5-connect" cue="0" from="0.000" to="18.600" title="The laptop connects and QA can start." %}
{% endviz %}

### Same journeys, your working copy

An interactive connection creates a `local` environment, and the journeys you recorded against production run against your working copy. Fix the bug, keep the command running, rerun the journey, and the recording tells you whether the fix held.

{% viz scene="books/five-doors/chapter-5" section="chapter-5-fix-rerun" cue="3" from="18.600" to="33.200" title="A failing step, a fix, a passing rerun." %}
{% endviz %}

### Five doors, one loop

Each environment shortened the loop: weekly on production, nightly on staging, per pull request, per CI job, and now per save. Same journeys, same evidence, five doors into the same app. Start with production, and tighten from there.

{% viz scene="books/five-doors/chapter-5" section="chapter-5-recap" cue="5" from="33.200" to="50.107" title="The rings tighten from a week to a save." %}
{% endviz %}
