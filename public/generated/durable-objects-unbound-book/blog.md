# Durable Objects, Unbound

A chat room gives distributed state a concrete shape: one identity, one place to decide message order, and a history that must survive its owner. This companion follows that room from Durable Objects’ introduction through celld and the current workerd self-hosting effort. The implementation discussion is pinned to October 2026 snapshots; it explains the assumptions behind the promise as carefully as the successful path.

### One room, one place to decide

Imagine a chat room spread across two servers. Both can receive a message, but the application needs one answer about message order and saved history. Durable Objects put related requests behind one object identity, with execution beside private durable state. Cloudflare introduced that model in its [September 2020 closed beta](https://blog.cloudflare.com/introducing-workers-durable-objects). The useful unit is the room, document, or cart: a piece of application state that benefits from one authority.

{% viz scene="books/durable-objects-unbound-book/chapter-1" section="room-authority" cue="1" from="0.000" to="59.071" title="One room, one place to decide" %}
{% endviz %}

Many independent rooms can spread across machines. One busy room still has one authority, and asynchronous execution still needs the runtime’s transaction and interleaving rules. Object identity simplifies the coordination boundary; it does not automatically make a whole application one transaction.

### Source availability was the beginning

The runtime was already open source when [workerd arrived in September 2022](https://blog.cloudflare.com/workerd-open-source-workers-runtime/). The later challenge was making distributed state practical outside Cloudflare’s infrastructure. [SQLite storage arrived in 2024](https://blog.cloudflare.com/sqlite-in-durable-objects/), bringing SQL into the same execution environment as an object. Celld’s August 2026 arrival explored a compact operating model: owned compute nodes and a shared bucket.

{% viz scene="books/durable-objects-unbound-book/chapter-1" section="open-runtime-distributed-state" cue="6" from="59.071" to="113.812" title="Source availability was the beginning" %}
{% endviz %}

Local SQL and remote durability occupy different parts of the latency budget. Calling SQLite beside the application can avoid a database network hop while preserving the result against machine loss still requires another durable location.

### A shared direction, with dated implementations

In [October 2026, Deno announced that its team was joining Cloudflare](https://deno.com/blog/cloudflare). Ryan Dahl described focusing future development on a shared platform. [Cloudflare described scalable self-hosting as a gap that celld could help close](https://blog.cloudflare.com/deno-joins-cloudflare/). Deno also announced a year of runtime fixes and security releases, six months of continued Deploy operation, continued JSR operation, and support for rusty_v8. These were announced transition commitments.

{% viz scene="books/durable-objects-unbound-book/chapter-1" section="teams-and-snapshots" cue="10" from="113.812" to="184.320" title="A shared direction, with dated implementations" %}
{% endviz %}

This book pins its implementation claims. The [initial cluster commit](https://github.com/cloudflare/workerd/commit/aa494794c44a900592c8281b191302d3b0a6e2a5) is dated October 29 UTC and lacks alarms. The inspected October 31 snapshot includes alarm recovery and facets. An experimental implementation and the teams’ longer-term direction should remain distinguishable.

### Close the gap between reading and claiming

Reading an empty ownership record and then uploading a name is unsafe: two contenders can both read “empty” before either writes. A conditional create closes that gap by allowing one successful creation. Conditional overwrite adds the corresponding rule for an existing record: replace it only if the version still matches the one read. Workerd expresses these alternatives as Guard::Absent and Guard::Match. [Its ownership code](https://github.com/cloudflare/workerd/blob/ad78a8fe76b32dd4f19c58d81b2e03e10a996bba/src/workerd/server/cluster/ownership.rs) uses the result to claim or route an object.

{% viz scene="books/durable-objects-unbound-book/chapter-2" section="conditional-authority" cue="1" from="0.000" to="79.216" title="Close the gap between reading and claiming" %}
{% endviz %}

The accepted write is a serialization point for that authority key. The losing contender must learn the winner rather than treating its earlier read as ownership. A version token is a guard, not necessarily a database checksum.

### The storage service supplies a primitive

The design needs fresh reads as well as conditional writes. [Amazon S3 documents those conditions](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html) separately from its [consistency behavior](https://docs.aws.amazon.com/AmazonS3/latest/userguide/Welcome.html). An endpoint’s S3-compatible request syntax does not establish either property. [Celld’s guarantees document](https://github.com/denoland/celld/blob/8702f6d186c77698dbfb30cf29e3b1922a88f008/docs/guarantees.md) describes storage probes that test successful and rejected conditional operations, alongside required ranged reads.

{% viz scene="books/durable-objects-unbound-book/chapter-2" section="bucket-contract" cue="8" from="79.216" to="167.510" title="The storage service supplies a primitive" %}
{% endviz %}

The fleet can avoid operating a separate coordination cluster because the bucket service supplies the needed serialization primitive. Coordination costs remain inside that service. This is also a one-key guarantee: it does not create atomic transactions across arbitrary ownership records or application objects.

### Put the clock assumptions on screen

Workerd’s [lease state machine](https://github.com/cloudflare/workerd/blob/ad78a8fe76b32dd4f19c58d81b2e03e10a996bba/src/workerd/server/cluster/logic/lease.rs) uses a twenty-second lease, renewals every three seconds, a four-second renewal timeout, and one-second retries. It allows up to two seconds of observed skew relative to the bucket, reserving four seconds between the owner’s serving deadline and the published expiry. Its serving predicate is now plus four seconds strictly less than expiry. The renewal-start test budgets another four seconds.

{% viz scene="books/durable-objects-unbound-book/chapter-3" section="lease-clock-budget" cue="1" from="0.000" to="94.784" title="Put the clock assumptions on screen" %}
{% endviz %}

With an illustrative expiry at twenty seconds, those boundaries are sixteen seconds for serving and twelve seconds for starting renewal. They are code predicates, not scheduling guarantees. Pauses, delayed observations, and clock assumptions matter; a timeout alone does not prove another machine has died.

### An obsolete process must lose authority

Lease expiry permits a replacement attempt; the conditional ownership update chooses its winner. Workerd’s [ownership record](https://github.com/cloudflare/workerd/blob/ad78a8fe76b32dd4f19c58d81b2e03e10a996bba/src/workerd/server/cluster/ownership.rs) separates the newly claimed epoch from the last epoch that finished opening. A claimant that dies during recovery therefore leaves the earlier recovery source intact. Once recovery and the starting snapshot are ready, another guarded update finishes opening the successor.

{% viz scene="books/durable-objects-unbound-book/chapter-3" section="epoch-opening" cue="9" from="94.784" to="172.338" title="An obsolete process must lose authority" %}
{% endviz %}

The old process may still have memory and may finish an upload. Workerd’s [commit path](https://github.com/cloudflare/workerd/blob/ad78a8fe76b32dd4f19c58d81b2e03e10a996bba/src/workerd/server/cluster/owner.rs) rereads the current ownership epoch after upload and refuses acknowledgement if the epoch changed. Leases, conditional claims, and acknowledgement fencing address different failure windows. During bucket trouble, preserving these rules can require stopping writers.

### Capture committed pages, not a changing database file

A successful local SQLite transaction is insufficient if a machine failure can erase its only recoverable copy. Workerd’s [capture layer](https://github.com/cloudflare/workerd/blob/ad78a8fe76b32dd4f19c58d81b2e03e10a996bba/src/workerd/server/cluster/capture.rs) observes SQLite write-ahead-log writes through the VFS. It buffers frames until the transaction’s commit marker completes, then records the committed page changes. Checkpointing can later copy WAL pages into the main database; capture must respect both transaction completion and WAL restart.

{% viz scene="books/durable-objects-unbound-book/chapter-4" section="wal-capture" cue="1" from="0.000" to="102.633" title="Capture committed pages, not a changing database file" %}
{% endviz %}

The two projects use different encodings. Workerd writes its frame format; celld’s [SQLite capture implementation](https://github.com/denoland/celld/blob/8702f6d186c77698dbfb30cf29e3b1922a88f008/crates/ltx/src/db.rs) produces LTX files with transaction positions and checksums. Neither mechanism should be reduced to repeatedly uploading an actively changing SQLite main file.

### A response needs a covering durability proof

In the inspected workerd path, [commit and push](https://github.com/cloudflare/workerd/blob/ad78a8fe76b32dd4f19c58d81b2e03e10a996bba/src/workerd/server/cluster/owner.rs) group captured changes, upload a batch, check the ownership epoch, and advance an acknowledgement watermark. Each waiting operation needs coverage through its own captured target. Grouping can reduce bucket requests without allowing one operation to borrow proof for bytes the upload did not include.

{% viz scene="books/durable-objects-unbound-book/chapter-4" section="acknowledgement-gate" cue="9" from="102.633" to="178.516" title="A response needs a covering durability proof" %}
{% endviz %}

[Celld documents a broader output gate](https://github.com/denoland/celld/blob/8702f6d186c77698dbfb30cf29e3b1922a88f008/docs/guarantees.md): even read-only or error responses can reveal uncovered writes, as can streamed chunks and certain outgoing effects. The guarantee concerns recoverable observations. A missing reply can still leave a client uncertain whether its write committed, so application retries need their own treatment of duplicate effects.

### Restore one complete history

Takeover rebuilds the database from a recovery base and ordered changes, rather than rerunning old application requests. Workerd’s [log implementation](https://github.com/cloudflare/workerd/blob/ad78a8fe76b32dd4f19c58d81b2e03e10a996bba/src/workerd/server/cluster/log.rs) selects a snapshot, applies subsequent sequence coverage, and checks for unresolved gaps. Its decoder also checks the compressed data’s checksum. Missing required history must block recovery; silently skipping a batch would make successful startup conceal state loss.

{% viz scene="books/durable-objects-unbound-book/chapter-5" section="replay-checked-prefix" cue="1" from="0.000" to="85.717" title="Restore one complete history" %}
{% endviz %}

Compaction creates a replacement snapshot before removing the history it covers. Checksums can detect damaged bytes, but cannot manufacture missing data. Keeping a valid recovery base and preserving protocol objects remain operational requirements.

### A faster proof leaves a recovery obligation

Celld v0.6.3 has a distinct default fleet-durability path. The owner recruits one or two other followers and requires the participating followers to fsync the write. An acknowledgement can then precede bucket upload. Without a follower ensemble it falls back to a bucket proof. These details come from the pinned [guarantees document](https://github.com/denoland/celld/blob/8702f6d186c77698dbfb30cf29e3b1922a88f008/docs/guarantees.md), and must not be attributed to workerd’s initial cluster merge.

{% viz scene="books/durable-objects-unbound-book/chapter-5" section="fleet-tail-recovery" cue="8" from="85.717" to="172.943" title="A faster proof leaves a recovery obligation" %}
{% endviz %}

The successor must seal the predecessor’s node-log session and recover its retained acknowledged tail before restoring the cell. Sealing prevents new fleet proofs from that session. A follower error, damaged range, or uncertified tail can block recovery; absence of a usable proof is not proof that acknowledged data never existed.

### Keep the failure model attached to the promise

Partition a writer from the bucket and the bucket-proof acknowledgement path stops making progress. Let the store ignore conditional writes and ownership can split. Delete reserved protocol objects and recovery can lose its foundation. [Celld’s documented guarantees and operational constraints](https://github.com/denoland/celld/blob/8702f6d186c77698dbfb30cf29e3b1922a88f008/docs/guarantees.md) make these dependencies explicit. Durable storage is a contract involving semantics and retained data, not a consequence of an API’s name.

{% viz scene="books/durable-objects-unbound-book/chapter-6" section="faults-and-costs" cue="1" from="0.000" to="78.229" title="Keep the failure model attached to the promise" %}
{% endviz %}

The latency tradeoff is equally concrete. Local SQL can be quick while the response waits for upload and an authority check. Celld’s follower proof can shorten that route while introducing follower disks and tail recovery. Both paths must get recoverable bytes beyond the failure that the proof claims to survive.

### Demonstrate progress without expanding its scope

The later workerd snapshot has [integration tests](https://github.com/cloudflare/workerd/blob/ad78a8fe76b32dd4f19c58d81b2e03e10a996bba/src/workerd/server/tests/cluster/cluster-test.mjs) for alarms running on a survivor after owner loss, including discovery when a node record is absent. That is concrete progress beyond the original merge. The tests were inspected for this book; this is not a claim that the upstream suite was executed.

{% viz scene="books/durable-objects-unbound-book/chapter-6" section="portable-scope" cue="7" from="78.229" to="133.051" title="Demonstrate progress without expanding its scope" %}
{% endviz %}

One observed alarm firing in a test is also different from arbitrary exactly-once external effects. Likewise, moving a runtime and its object storage model does not reproduce every managed network service, supported API, or operational guarantee of the hosted platform.

### The machinery can travel with the application

The [teams’ announced direction](https://blog.cloudflare.com/deno-joins-cloudflare/) is to make self-hosting a first-class option. The useful change is practical: a room’s identity, local database, ownership rules, and recovery path can be understood together on infrastructure its operator chooses. Compute still executes the application; a qualified bucket supplies durable bytes and serialization; the runtime connects those primitives to responses.

{% viz scene="books/durable-objects-unbound-book/chapter-6" section="portable-contracts" cue="11" from="133.051" to="189.104" title="The machinery can travel with the application" %}
{% endviz %}

The acknowledged message survives when those contracts line up: one current authority, a proof covering the visible state, and a recovery path that retrieves the bytes that proof depended on. Portability becomes credible when this machinery travels with the programming model and its assumptions remain visible.

The shared bucket does not execute the application or erase distributed-systems costs. It supplies primitives that a runtime can assemble into ownership, durability, and recovery. The practical achievement is a smaller operating shape whose correctness conditions can be inspected, tested, and carried onto infrastructure the application owner controls.

[Source ledger and pinned snapshots](/generated/durable-objects-unbound-book/sources.md)
