# Celld — self-hosted Durable Objects, coordinated by a bucket

celld is Deno's open-source daemon that runs Cloudflare Workers and Durable Objects on your own machines. There is no control plane and no consensus service anywhere in it: every node embeds V8, executes Wrangler bundles, and coordinates with its peers through nothing but an S3-compatible bucket that you own. This book follows one cell — one durable object — from its single-threaded execution model, through the atomic write that decides who runs it, the gate that makes its writes durable, the calendar that wakes it from hibernation, and finally the one pure function that makes every one of those decisions.

## Chapter 1 — One Cell, One Thread

An application on celld does not share one database. It divides into cells from the start: one small server for each user, each document, each chat room, each agent. A cell is a Durable Object in the Cloudflare sense — it has a name, it serves HTTP and WebSockets, and it owns a private SQLite database that no other cell can touch.

<figure><img src="/generated/celld/blog/chapter-1-0.png" alt="A field of cells condenses out of the application"><figcaption>The app splits into cells — one per user, document, and room — before any infrastructure appears.</figcaption></figure>

<figure><img src="/generated/celld/blog/chapter-1-1.png" alt="One cell with its private SQLite card"><figcaption>The camera dives into one cell: a named durable object with its own SQLite database (storage.rs).</figcaption></figure>

The concurrency model is the whole trick. Every cell runs on exactly one thread, so two requests to the same cell never execute at the same instant. A second request can interleave only while the first one awaits something slow — an outbound fetch, a call to another service.

<figure><img src="/generated/celld/blog/chapter-1-3.png" alt="Request A parks at an await while request B interleaves"><figcaption>Request A runs until it awaits; only in that gap can request B take the thread.</figcaption></figure>

Storage never yields. The Durable Object storage API looks asynchronous in your worker code, but underneath each call is a synchronous Rust operation writing straight into the cell's own SQLite file — so a storage operation never interleaves at all, and the data in a cell stays consistent without locks or transactions in your application code.

<figure><img src="/generated/celld/blog/chapter-1-4.png" alt="The storage operation renders as one unbroken block on the thread lane"><figcaption>The storage write is one unbroken block on the lane: synchronous underneath, nothing interleaves.</figcaption></figure>

<figure><img src="/generated/celld/blog/chapter-1-6.png" alt="One isolate per cell"><figcaption>Each cell gets its own V8 isolate, created once per name (js.rs) and reused for every later request.</figcaption></figure>

<figure><img src="/generated/celld/blog/chapter-1-7.png" alt="The field of cells, each with its own tiny database"><figcaption>Pull back: every cell owns its own database. The contention of a shared database is designed out, not managed.</figcaption></figure>

## Chapter 2 — The Bucket Is the Coordinator

What celld leaves out is the point: no membership protocol, no failure detector, no consensus service. The only thing the fleet shares is the bucket, which holds deployments, cell state, and small ownership records.

<figure><img src="/generated/celld/blog/chapter-2-0.png" alt="The fleet bucket ring with nothing else around it"><figcaption>The entire coordination substrate: one S3-compatible bucket that you own.</figcaption></figure>

<figure><img src="/generated/celld/blog/chapter-2-2.png" alt="A request arrives for an unowned cell"><figcaption>A request arrives for a cell nobody owns. To serve it, a node must first own it — with one atomic write.</figcaption></figure>

Ownership is a compare-and-swap on the cell's owner record. If two nodes race, exactly one write lands; the bucket's conditional-put semantics guarantee it. The loser gets a clean rejection — bucket.rs is explicit that a clean rejection is the only answer that means "no" (anything else is ambiguous and treated as a failure) — reads who won, and proxies the request to the owner.

<figure><img src="/generated/celld/blog/chapter-2-3.png" alt="Two put-if-none packets race toward the owner record"><figcaption>The compare-and-swap race: two conditional writes, one winner, one clean rejection.</figcaption></figure>

<figure><img src="/generated/celld/blog/chapter-2-5.png" alt="The owner record shows node and epoch"><figcaption>The owner record carries two fields — the owning node, and an epoch that counts every handoff.</figcaption></figure>

Liveness comes from leases, not from peers watching each other. Each node heartbeats its own lease record; if it cannot renew in time, a fence timer fires and the node stops serving before anyone else could take over — main.rs arranges the actor so monotonic lease ticks fence the node even while a storage operation hangs. When a node dies, its lease expires, another node swaps itself into the owner record, and the epoch advances.

<figure><img src="/generated/celld/blog/chapter-2-7.png" alt="A dead node's lease expires and another node takes over"><figcaption>The lease expires, node-c swaps itself in, and the epoch advances from three to four.</figcaption></figure>

## Chapter 3 — Durable Before Acknowledged

celld's hardest promise: an acknowledged write is durable. Recovery point zero — if the node dies a millisecond after saying yes, the data is already in the bucket.

<figure><img src="/generated/celld/blog/chapter-3-1.png" alt="The write-ahead log tape shadowed by the in-process replica"><figcaption>Every commit lands in the cell's write-ahead log, shadowed page by page by an in-process replica (ltx_repl.rs).</figcaption></figure>

The mechanism is a gate. When your code writes, the response takes a numbered durability ticket and waits at the output gate. A background sync captures the committed pages and uploads them to the bucket; only when the upload lands does the ticket get credited and the response leave.

<figure><img src="/generated/celld/blog/chapter-3-2.png" alt="The response waits at the output gate with ticket seven"><figcaption>The response holds at the output gate until the sync that covers its ticket completes.</figcaption></figure>

<figure><img src="/generated/celld/blog/chapter-3-4.png" alt="Two tickets ride one batched upload"><figcaption>Concurrent writes to one cell ride a single batched upload — a ticket is credited only if its write committed before the sync began.</figcaption></figure>

The path the pages take is itself the fence: pages replicate to a prefix that embeds the cell's epoch. A stale owner that somehow keeps writing is writing into a dead prefix that no future owner will ever read — replication.rs calls epoch-in-prefix the data-path fence.

<figure><img src="/generated/celld/blog/chapter-3-5.png" alt="The stale epoch-two lane writes into a dead prefix"><figcaption>The stale owner's lane: still writing, but into the epoch-two prefix nobody will read.</figcaption></figure>

<figure><img src="/generated/celld/blog/chapter-3-6.png" alt="A new owner restores the database from the bucket"><figcaption>When the cell wakes elsewhere, its new owner restores the database and resumes where the log ends.</figcaption></figure>

## Chapter 4 — Sleep Cheap, Wake on Time

Residency is the cost. An idle cell hibernates to the bucket, where it is only an object; one eight-gigabyte node holds a thousand resident cells, which is what makes a cell for every user affordable.

<figure><img src="/generated/celld/blog/chapter-4-0.png" alt="A cell shrinks into the bucket to hibernate"><figcaption>An idle cell hibernates into the bucket — an object in S3, costing almost nothing.</figcaption></figure>

The hard case is the appointment: a hibernated cell's alarm must fire even if the node that put it to sleep is gone. So committed alarm state is mirrored into the bucket as a wake entry, filed under the minute it comes due (wake.rs / logic/wake.rs key the entries by minute bucket so the waker lists them in time order).

<figure><img src="/generated/celld/blog/chapter-4-3.png" alt="A wake entry filed on the minute-bucket calendar"><figcaption>The wake calendar: the cell's alarm files a durable entry under its due minute.</figcaption></figure>

The invariant is deliberately asymmetric. A stale entry costs one spurious wake — cheap. A missing entry costs a lost alarm — never acceptable. So only a completed activation or a durable consume may delete an entry.

<figure><img src="/generated/celld/blog/chapter-4-4.png" alt="The asymmetric invariant panel"><figcaption>Stale entry: one spurious wake. Missing entry: a lost alarm. The deletion rule follows from the asymmetry.</figcaption></figure>

<figure><img src="/generated/celld/blog/chapter-4-6.png" alt="The sweep cursor revives the due cell"><figcaption>The sweep lists the wake prefix in order, finds the due minute, and revives the cell to fire its alarm.</figcaption></figure>

<figure><img src="/generated/celld/blog/chapter-4-7.png" alt="A dead node's orphaned entry is adopted"><figcaption>The owner died with alarms armed — the entries are still in the bucket, and a fleet waker adopts the orphans.</figcaption></figure>

## Chapter 5 — One Function Decides

The dangerous bugs live in the coordination: a crash mid-handoff, a lease renewal racing a takeover, an alarm firing against a half-restored cell. The windows are nanoseconds wide and open rarely, so no test can wait for one.

<figure><img src="/generated/celld/blog/chapter-5-0.png" alt="The three nanosecond-window bugs"><figcaption>The failure windows worth fearing — none of them reachable by an ordinary test.</figcaption></figure>

celld's answer is architectural. Every behavioral decision flows through one pure function in the celld-logic crate — on_event is the only way state advances, and no adapter may mutate state directly. One actor serializes the mailbox, the timers, and the in-flight effect futures in a single loop, which is why a hung storage operation cannot stop the clock: the lease tick still reaches the core, and the core can still decide to fence the node.

<figure><img src="/generated/celld/blog/chapter-5-3.png" alt="Events funnel into the on_event decision core"><figcaption>One actor, three sources — mailbox, timers, effect completions — all funneling into on_event.</figcaption></figure>

<figure><img src="/generated/celld/blog/chapter-5-5.png" alt="A hung storage effect while the lease fence tick still flows"><figcaption>The storage effect hangs; the fence tick still reaches the core, and the node fences itself.</figcaption></figure>

Purity buys testability. A deterministic simulator drives the very same function through adversarial schedules — crash at publish, partition at renew, alarm at restore — and replays any failure it finds exactly. Compatibility gets the differential treatment: every program runs twice, on workerd and on celld, on identical bytes, and the outputs must be equal.

<figure><img src="/generated/celld/blog/chapter-5-6.png" alt="The deterministic simulator hammers the same core"><figcaption>The same core, lifted into a simulator and hammered with adversarial schedules — every failure replayable.</figcaption></figure>

<figure><img src="/generated/celld/blog/chapter-5-8.png" alt="The recap constellation of the four machines"><figcaption>The whole system: one thread per cell, one atomic write to own it, durable before acknowledged, a calendar in the bucket — one function deciding all of it.</figcaption></figure>
