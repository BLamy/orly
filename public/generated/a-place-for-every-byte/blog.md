# A Place for Every Byte

Choose storage by shape and consistency

This companion follows the same animated scenes as the narrated book. The examples are illustrative; the mechanisms are grounded in the linked Cloudflare documentation.

## Choose by access and consistency

### Access patterns determine the first choice

Workers KV optimizes distributed keyed reads, with eventual consistency and cached misses. A SQLite-backed Durable Object gives a single entity a private, strongly consistent coordinating store.

{% viz scene="books/a-place-for-every-byte/chapter-1" section="chapter-1-access-patterns-determine-the-first-choice" cue="0" from="0.000" to="24.462" title="Access patterns determine the first choice" %}
{% endviz %}

### Consistency belongs to the path

R2 directly provides strong consistency for object operations. A cache in front of an R2 bucket can independently retain an older object or a prior not-found response, so freshness is a property of the whole read path.

{% viz scene="books/a-place-for-every-byte/chapter-1" section="chapter-1-consistency-belongs-to-the-path" cue="4" from="24.462" to="42.724" title="Consistency belongs to the path" %}
{% endviz %}

## Objects are not rows

### A bucket stores objects under keys

A Worker can put and get files using an R2 binding. Multipart uploads assemble larger objects from parts; the final object is visible after completion. R2 does not charge Internet egress fees.

{% viz scene="books/a-place-for-every-byte/chapter-2" section="chapter-2-a-bucket-stores-objects-under-keys" cue="0" from="0.000" to="22.535" title="A bucket stores objects under keys" %}
{% endviz %}

### Direct reads and cached reads differ

Direct object writes, reads, deletes, and listings are strongly consistent. When a custom domain adds caching, use an appropriate cache policy, versioned names, or purging when a change must be visible promptly.

{% viz scene="books/a-place-for-every-byte/chapter-2" section="chapter-2-direct-reads-and-cached-reads-differ" cue="4" from="22.535" to="44.397" title="Direct reads and cached reads differ" %}
{% endviz %}

## Three ways to use SQL

### Relational data can have different owners

D1 is a managed serverless SQLite database. Its Sessions API and bookmarks give sequential consistency when read replication is involved. Durable Object SQLite instead belongs privately to one coordinator.

{% viz scene="books/a-place-for-every-byte/chapter-3" section="chapter-3-relational-data-can-have-different-owners" cue="0" from="0.000" to="22.454" title="Relational data can have different owners" %}
{% endviz %}

### Hyperdrive connects an existing database

Hyperdrive maintains pools for supported existing PostgreSQL and MySQL databases and may cache eligible queries. It accelerates access to an existing database; it does not move that database into a Durable Object or turn it into D1.

{% viz scene="books/a-place-for-every-byte/chapter-3" section="chapter-3-hyperdrive-connects-an-existing-database" cue="4" from="22.454" to="44.582" title="Hyperdrive connects an existing database" %}
{% endviz %}

## Versioned trees and analytical tables

### Artifacts stores versioned trees

Artifacts provides Git-compatible repositories for versioned files and projects. A Worker binding can manage repositories, while standard Git clients can clone, push, and inspect the history.

{% viz scene="books/a-place-for-every-byte/chapter-4" section="chapter-4-artifacts-stores-versioned-trees" cue="0" from="0.000" to="21.189" title="Artifacts stores versioned trees" %}
{% endviz %}

### Basin turns events into analytical tables

Basin Pipelines ingest and transform data, Basin Catalog manages Apache Iceberg tables stored on R2, and Basin SQL queries them. That analytical path serves a different access pattern from a per-request transaction store.

{% viz scene="books/a-place-for-every-byte/chapter-4" section="chapter-4-basin-turns-events-into-analytical-tables" cue="4" from="21.189" to="47.136" title="Basin turns events into analytical tables" %}
{% endviz %}

## Sources

See [KV](https://developers.cloudflare.com/kv/concepts/how-kv-works/), [R2 consistency](https://developers.cloudflare.com/r2/reference/consistency/), [D1 sessions](https://developers.cloudflare.com/d1/best-practices/read-replication/), [Hyperdrive](https://developers.cloudflare.com/hyperdrive/concepts/connection-pooling/), [Artifacts](https://developers.cloudflare.com/artifacts/), and [Basin](https://developers.cloudflare.com/basin/).
