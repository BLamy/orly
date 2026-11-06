# Durable Objects Have an Address

Identity, storage, and sleeping coordination

This companion follows the same animated scenes as the narrated book. The examples are illustrative; the mechanisms are grounded in the linked Cloudflare documentation.

## One name, one coordinator

### An identity routes callers together

A namespace maps a name such as `room:blue` to a stable Durable Object identity. `getByName()` supplies a stub; the object is instantiated when the stub is invoked, and the platform routes the call to that object.

{% viz scene="books/durable-objects-have-an-address/chapter-1" section="chapter-1-an-identity-routes-callers-together" cue="0" from="0.000" to="17.728" title="An identity routes callers together" %}
{% endviz %}

### Different entities get different notebooks

A different name selects a different object with separate private storage. An object can leave memory while idle and start again later, so identity outlives a particular in-memory instance.

{% viz scene="books/durable-objects-have-an-address/chapter-1" section="chapter-1-different-entities-get-different-notebooks" cue="4" from="17.728" to="36.409" title="Different entities get different notebooks" %}
{% endviz %}

## A private transactional notebook

### Private SQLite and transactions

Cloudflare recommends SQLite-backed namespaces for new Durable Objects. The attached database is private to an object, and its storage operations can participate in transactions that are atomic within that object.

{% viz scene="books/durable-objects-have-an-address/chapter-2" section="chapter-2-private-sqlite-and-transactions" cue="0" from="0.000" to="22.489" title="Private SQLite and transactions" %}
{% endviz %}

### Alarms and recovery

An alarm schedules a future invocation and may be retried, so its effects need to tolerate repetition. Point-in-time recovery can restore an object’s SQLite-backed data to a point in the preceding 30 days; it does not create a transaction across objects.

{% viz scene="books/durable-objects-have-an-address/chapter-2" section="chapter-2-alarms-and-recovery" cue="4" from="22.489" to="44.768" title="Alarms and recovery" %}
{% endviz %}

## The room sleeps but connections stay

### Connections survive hibernation

The hibernation WebSocket API keeps clients connected while an idle server object leaves memory. The code accepts the server socket through the object state, and an incoming event reconstructs the object.

{% viz scene="books/durable-objects-have-an-address/chapter-3" section="chapter-3-connections-survive-hibernation" cue="0" from="0.000" to="19.726" title="Connections survive hibernation" %}
{% endviz %}

### Rebuild what memory forgot

Ordinary in-memory variables are reset. Restore durable room data from storage and connection-specific data from socket attachments; hibernation is for an object acting as the WebSocket server, not outgoing sockets.

{% viz scene="books/durable-objects-have-an-address/chapter-3" section="chapter-3-rebuild-what-memory-forgot" cue="4" from="19.726" to="41.935" title="Rebuild what memory forgot" %}
{% endviz %}

## Sources

See [Durable Object lifecycle](https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/), [SQLite storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/), [alarms](https://developers.cloudflare.com/durable-objects/api/alarms/), and [WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/).
