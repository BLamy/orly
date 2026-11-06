# Beyond the Isolate

Containers, sandboxes, browsers, and platforms

This companion follows the same animated scenes as the narrated book. The examples are illustrative; the mechanisms are grounded in the linked Cloudflare documentation.

## When you need a Linux process

### A Linux image runs beside a Worker

Cloudflare Containers run a supplied image in a Linux virtual machine. A Worker reaches a container through a Durable Object that manages its lifecycle, providing an option for native dependencies and processes.

{% viz scene="books/beyond-the-isolate/chapter-1" section="chapter-1-a-linux-image-runs-beside-a-worker" cue="0" from="0.000" to="21.873" title="A Linux image runs beside a Worker" %}
{% endviz %}

### Package the environment you need

An application in the container can listen for requests forwarded by the Worker, and instances can start and stop according to configuration. Container files and processes share that container’s own environment.

{% viz scene="books/beyond-the-isolate/chapter-1" section="chapter-1-package-the-environment-you-need" cue="4" from="21.873" to="42.307" title="Package the environment you need" %}
{% endviz %}

## A sandbox is a trust boundary

### Two environments for untrusted code

A Container sandbox runs a Linux image, while a Dynamic Worker runs JavaScript loaded at runtime in an isolate. The host chooses which capabilities to expose and controls the permitted network path.

{% viz scene="books/beyond-the-isolate/chapter-2" section="chapter-2-two-environments-for-untrusted-code" cue="0" from="0.000" to="22.408" title="Two environments for untrusted code" %}
{% endviz %}

### The sandbox is the trust boundary

Code inside a sandbox can read the files, credentials, and network access placed there. Separate mutually untrusted users or jobs, keep credentials outside where possible, and mediate outbound requests or expose narrow host methods.

{% viz scene="books/beyond-the-isolate/chapter-2" section="chapter-2-the-sandbox-is-the-trust-boundary" cue="4" from="22.408" to="43.096" title="The sandbox is the trust boundary" %}
{% endviz %}

## A browser as a service

### Quick Actions for common tasks

Browser Run hosts headless browsers. A Quick Action can capture a screenshot or other supported result through a REST endpoint or the Worker browser binding; `quickAction()` has documented compatibility-date and local-remote requirements.

{% viz scene="books/beyond-the-isolate/chapter-3" section="chapter-3-quick-actions-for-common-tasks" cue="0" from="0.000" to="19.621" title="Quick Actions for common tasks" %}
{% endviz %}

### Sessions for multi-step interactions

A browser session supports custom control through tools such as Puppeteer, Playwright, and CDP. Sessions can be managed and reused across requests when a task needs more than one interaction.

{% viz scene="books/beyond-the-isolate/chapter-3" section="chapter-3-sessions-for-multi-step-interactions" cue="4" from="19.621" to="41.100" title="Sessions for multi-step interactions" %}
{% endviz %}

## A platform routes tenant code

### A dispatch namespace groups tenant Workers

Workers for Platforms deploys user Workers into a dispatch namespace. A dispatch Worker looks up a user Worker by name through its dispatcher binding and forwards the request.

{% viz scene="books/beyond-the-isolate/chapter-4" section="chapter-4-a-dispatch-namespace-groups-tenant-workers" cue="0" from="0.000" to="16.870" title="A dispatch namespace groups tenant Workers" %}
{% endviz %}

### Capabilities are selected by the platform

Bindings attached to a user Worker grant the resources the platform configures. Request-scoped platform capabilities can be passed through dispatch properties; tenant selection and the granted authority remain platform responsibilities.

{% viz scene="books/beyond-the-isolate/chapter-4" section="chapter-4-capabilities-are-selected-by-the-platform" cue="4" from="16.870" to="39.985" title="Capabilities are selected by the platform" %}
{% endviz %}

## Sources

See [Containers](https://developers.cloudflare.com/containers/), [sandbox security](https://developers.cloudflare.com/sandbox/concepts/security/), [Dynamic Workers](https://developers.cloudflare.com/dynamic-workers/getting-started/), [Browser Run](https://developers.cloudflare.com/browser-run/), and [Workers for Platforms](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/get-started/).
