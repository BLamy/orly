# Workers Have No Server

Requests, bindings, and the life of an isolate

This companion follows the same animated scenes as the narrated book. The examples are illustrative; the mechanisms are grounded in the linked Cloudflare documentation.

## A request meets an isolate

### A handler receives a request

A module Worker exports a fetch handler. Cloudflare invokes it with a Request, the configured environment, and an execution context; your code returns a Response. The isolate is an execution environment managed by the platform, so the application does not administer a server.

{% viz scene="books/workers-have-no-server/chapter-1" section="chapter-1-a-handler-receives-a-request" cue="0" from="0.000" to="21.514" title="A handler receives a request" %}
{% endviz %}

### The response follows the work

A handler may compute a response itself or call another service. Await anything whose result belongs in that response, then return a status, headers, and body to the caller.

{% viz scene="books/workers-have-no-server/chapter-1" section="chapter-1-the-response-follows-the-work" cue="4" from="21.514" to="39.892" title="The response follows the work" %}
{% endviz %}

## Bindings make capabilities explicit

### Configuration names the capability

Wrangler configuration declares bindings and a compatibility date. At runtime those bindings arrive on the environment object, so application code can access a configured resource without embedding a separate account token.

{% viz scene="books/workers-have-no-server/chapter-2" section="chapter-2-configuration-names-the-capability" cue="0" from="0.000" to="19.771" title="Configuration names the capability" %}
{% endviz %}

### Types follow configuration

Running `wrangler types` produces environment and runtime types matched to the Worker configuration. Check local binding behavior explicitly: supported resources can be simulated, while a configured remote binding can reach a real resource.

{% viz scene="books/workers-have-no-server/chapter-2" section="chapter-2-types-follow-configuration" cue="4" from="19.771" to="43.886" title="Types follow configuration" %}
{% endviz %}

## A request has a lifetime

### An isolate can be reused

Multiple requests may run in an isolate over its lifetime. Request-specific information belongs in handler-local variables, because module globals can be shared and the platform may replace the isolate.

{% viz scene="books/workers-have-no-server/chapter-3" section="chapter-3-an-isolate-can-be-reused" cue="0" from="0.000" to="20.248" title="An isolate can be reused" %}
{% endviz %}

### Background work has a boundary

`ctx.waitUntil()` attaches work that may continue after a response, subject to the documented 30-second extension. It is not a durable task queue: use Queues or Workflows where retry, persistence, or a long wait matters.

{% viz scene="books/workers-have-no-server/chapter-3" section="chapter-3-background-work-has-a-boundary" cue="4" from="20.248" to="43.422" title="Background work has a boundary" %}
{% endviz %}

## Sources

See the [Workers fetch handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/), [bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/), [TypeScript guidance](https://developers.cloudflare.com/workers/languages/typescript/), and [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/).
