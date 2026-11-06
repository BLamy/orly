# Queues, Logs, and Durable Work

Delivery, replay, and resilient execution

This companion follows the same animated scenes as the narrated book. The examples are illustrative; the mechanisms are grounded in the linked Cloudflare documentation.

## A queue delivers a task

### A queue distributes tasks

A producer sends messages and a consumer processes them later, usually in batches. Cloudflare Queues offers at-least-once delivery, so failures around acknowledgment can cause a message to be delivered again.

{% viz scene="books/queues-logs-and-durable-work/chapter-1" section="chapter-1-a-queue-distributes-tasks" cue="0" from="0.000" to="18.460" title="A queue distributes tasks" %}
{% endviz %}

### Make the effect safe to repeat

Assign a stable idempotency key and use it at the side-effect boundary. Configure retries and a dead-letter queue for work that repeatedly fails; acknowledging a task does not create a replayable shared log.

{% viz scene="books/queues-logs-and-durable-work/chapter-1" section="chapter-1-make-the-effect-safe-to-repeat" cue="4" from="18.460" to="40.217" title="Make the effect safe to repeat" %}
{% endviz %}

## A log keeps its history

### A stream supports independent readers

K2 appends records to a durable ordered stream. Each subscription has its own position, and a new subscription can start at the earliest retained record without advancing another subscription.

{% viz scene="books/queues-logs-and-durable-work/chapter-2" section="chapter-2-a-stream-supports-independent-readers" cue="0" from="0.000" to="19.760" title="A stream supports independent readers" %}
{% endviz %}

### Retention and processing order are limits

As of November 2026, K2 is public beta for Workers Paid accounts, with 10 GB per account and seven days of default retention; the default maximum is 30 days, with increases available by request. Delivery is at least once, and workers sharing a subscription are not guaranteed to process records in order. Records can expire before a lagging consumer reads them.

{% viz scene="books/queues-logs-and-durable-work/chapter-2" section="chapter-2-retention-and-processing-order-are-limits" cue="4" from="19.760" to="45.000" title="Retention and processing order are limits" %}
{% endviz %}

## A workflow remembers the steps

### A workflow records progress

`step.do()` persists successful step results so an interrupted workflow can resume without rerunning completed steps. Steps can retry with configured backoff, sleep, or wait for an external event.

{% viz scene="books/queues-logs-and-durable-work/chapter-3" section="chapter-3-a-workflow-records-progress" cue="0" from="0.000" to="19.679" title="A workflow records progress" %}
{% endviz %}

### Compose the three primitives

A queue can deliver a request to start a workflow; the workflow can complete the operation and publish an event for independent K2 subscribers. Treat that as an illustrative design, and use stable identifiers because delivery and step retries can repeat effects.

{% viz scene="books/queues-logs-and-durable-work/chapter-3" section="chapter-3-compose-the-three-primitives" cue="4" from="19.679" to="43.699" title="Compose the three primitives" %}
{% endviz %}

## Sources

See [Queues delivery](https://developers.cloudflare.com/queues/reference/delivery-guarantees/), [K2 concepts](https://developers.cloudflare.com/k2/concepts/), [K2 delivery guarantees](https://developers.cloudflare.com/k2/reference/delivery-guarantees/), [K2 limits](https://developers.cloudflare.com/k2/platform/limits/), and [Workflows](https://developers.cloudflare.com/workflows/get-started/guide/).
