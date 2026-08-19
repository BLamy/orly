# WAL on S3

*An O'RLY? visual explainer of Chroma's Rust `wal3`: a linearizable write-ahead log built from object-storage primitives. The pattern was prompted by [Chroma's WAL3 design note](https://www.trychroma.com/engineering/wal3), [Cursor's Git-at-scale post](https://cursor.com/blog/git-at-any-scale), and [Deno's celld write-up](https://flaviocopes.com/celld/). The scenes here stay concrete: they follow Chroma's `rust/wal3` implementation and use the other links as neighboring examples, not as sources for invented internals.*

The recurring shape is simple enough to draw on a napkin: put the data in files nobody edits, then spend your one conditional object-store write on a tiny record that says which files count. The rest of the system—concurrency, garbage collection, snapshots, and verification—exists to preserve that split.

## Chapter 1 · A Bucket That Cannot Lock

A bucket gives you durable objects, but not a lock manager or a transaction. If two writers repeatedly read and rewrite one shared object, the later write can erase an acknowledged append. Chroma's answer is to make the bulk data immutable and reserve the mutable authority for one manifest.

### The bucket supplies durability, not coordination

Start with the constraint rather than the solution. Records can be durable in object storage, but a bucket does not serialize two writers for us. The first section follows the tempting rewrite-in-place design until its lost append becomes visible, then introduces the one conditional version check the bucket actually provides.

{% viz scene="books/wal-on-s3/chapter-1" section="ch1-bucket" cue="0" from="0.000" to="35.062" title="Why a durable bucket still needs a separate coordination record." %}
{% endviz %}

The important failure is not that the bucket loses bytes. It is that two writers can both read the same old object and then acknowledge incompatible replacements. The conditional write gives us a way to reject the stale one, but it is too valuable to spend on every payload.

### Split payloads from authority

The design changes shape at exactly that point. Records move into immutable fragments that writers can upload independently; coordination shrinks to the small manifest that says which fragments belong to the log and in what order.

{% viz scene="books/wal-on-s3/chapter-1" section="ch1-split" cue="4" from="35.062" to="54.973" title="The log separates immutable fragments from its mutable authority." %}
{% endviz %}

Fragments are ordinary files written once, so retrying or duplicating their upload cannot rewrite acknowledged history. The only shared question left is which files count.

### Let the manifest name the history

Now follow that authority record as it becomes concrete. The manifest carries fragment paths, ordering, and log ranges, while the files themselves stay out of the coordination path. This is the object-storage version of a linked-list head: immutable nodes plus one pointer that can advance conditionally.

{% viz scene="books/wal-on-s3/chapter-1" section="ch1-authority" cue="6" from="54.973" to="76.079" title="The manifest turns immutable files into one ordered log view." %}
{% endviz %}

Readers do not need a lock to scan. They read the manifest, follow its fragment pointers, and pull the data directly from storage while a writer prepares the next immutable piece.

### One conditional write advances the view

The final section puts the whole protocol on one stage: a reader follows the current manifest, a writer adds a fragment, and one conditional update decides whether the new view wins. That tiny authority record is the linearization point.

{% viz scene="books/wal-on-s3/chapter-1" section="ch1-readers" cue="8" from="76.079" to="95.572" title="Readers follow immutable fragments while one conditional write advances the authority." %}
{% endviz %}

Keep this split in mind. A mountain of immutable data is safe to write, retry, compact, and collect; one small manifest is the only place where concurrent writers need agreement.

## Chapter 2 · The Compare-and-Swap Heartbeat

The split only matters if the append path is exact. A caller hands a message to the writer; the batch manager groups it with neighbors; the batch becomes a fragment; the fragment is written if absent; and only then does the manifest manager try to install a new manifest with `If-Match`.

### From append call to immutable fragment

An append is not durable at the moment the caller hands over a message. It first joins a batch, receives a range of log positions, hardens into a fragment, and uploads under a sequence-derived name that cannot quietly overwrite another fragment.

{% viz scene="books/wal-on-s3/chapter-2" section="ch2-pipeline" cue="0" from="0.000" to="43.468" title="An append travels through batching, packing, and write-if-absent upload." %}
{% endviz %}

The fragment sitting in the bucket is still only a candidate. Until the manifest names it, a crash can leave it as an unreferenced file rather than acknowledged history.

### The manifest is the commit point

Durability begins when the manifest manager folds the new pointer into its current view and carries the fragment checksum into the running checksum. The replacement is accepted only if the stored version tag is still the one the writer read.

{% viz scene="books/wal-on-s3/chapter-2" section="ch2-commit" cue="5" from="43.468" to="61.986" title="The manifest manager turns an uploaded fragment into durable history." %}
{% endviz %}

This is compare-and-swap in object-store clothing: the payload upload is ordinary and retryable, while the tiny manifest replacement is conditional.

### A stale writer loses safely

The next section introduces the competing writer. It read the same earlier manifest, but its tag is now obsolete. The bucket rejects the stale replacement before it can overwrite the winner, so contention becomes a retryable error instead of silent data loss.

{% viz scene="books/wal-on-s3/chapter-2" section="ch2-contention" cue="7" from="61.986" to="80.468" title="A second writer carries a stale tag and is rejected before it can clobber the log." %}
{% endviz %}

The loser may still have a perfectly durable fragment. That is fine: it is not part of the committed view yet, and later cleanup can handle the unreferenced object.

### Correctness lives in the header

Leader election can be imperfect because the invariant does not live there. Even if two writers overlap, the conditional manifest update lets at most one install its view; everything else is immutable work or a safe retry.

{% viz scene="books/wal-on-s3/chapter-2" section="ch2-safety" cue="9" from="80.468" to="98.359" title="The concurrency guarantee fits in one conditional request header." %}
{% endviz %}

Object storage has not become a database. It has supplied one sharp atomic primitive, and `wal3` spends it on the smallest possible piece of mutable state.

## Chapter 3 · Pins and the Three-Phase Dance

Append-only storage eventually needs reclamation. The dangerous question is not “which files look old?” but “which files can no reader still be using?” Chroma moves that knowledge into cursors: small per-reader files that pin a position without competing with the writer for the manifest.

### Readers publish the reclamation boundary

The log can grow forever, but the writer cannot decide which records every reader has finished with. Each reader publishes a cursor in its own object; collection takes the earliest cursor as a conservative lower bound and treats only older data as a candidate.

{% viz scene="books/wal-on-s3/chapter-3" section="ch3-pins" cue="0" from="0.000" to="46.126" title="Reader cursors pin the oldest position that collection must preserve." %}
{% endviz %}

Putting cursors outside the manifest matters. A reader can publish a pin without fighting the writer for the one authority record that advances the log.

### Garbage collection starts as a plan

The first phase records intent, not deletion. A `GARBAGE` object lists the snapshots, fragments, and checksum weight that may be removed. If the collector crashes here, it has created only a discardable plan.

{% viz scene="books/wal-on-s3/chapter-3" section="ch3-plan" cue="5" from="46.126" to="76.753" title="Collection writes an intent record before changing the live manifest." %}
{% endviz %}

This separation makes the dangerous action auditable. Planning can be retried or abandoned without pretending that bytes have already disappeared.

### Publish before you delete

Phase two hands the plan to the ordinary writer. The writer publishes a new manifest that no longer references the doomed objects; phase three then waits for readers that may still hold the old manifest before any delete is issued.

{% viz scene="books/wal-on-s3/chapter-3" section="ch3-wait" cue="8" from="76.753" to="96.281" title="The live manifest moves first, then readers get time to finish." %}
{% endviz %}

The order is the safety property: unreference the bytes in the authority record, allow old readers to drain, and only then remove physical objects.

### Three phases make deletion conservative

The final section shows deletion as the last and least clever operation. Exactly one service is responsible for it, and it deletes only objects positively proved unreachable from every active reader’s pinned position.

{% viz scene="books/wal-on-s3/chapter-3" section="ch3-delete" cue="10" from="96.281" to="115.820" title="Deletion comes last, after the collector proves the objects are unreachable." %}
{% endviz %}

The collector can crash between any two phases without hiding a half-applied deletion inside the log’s authority record. Conservative proof is cheaper than recovery from a reader that lost its bytes.

## Chapter 4 · A Tree That Grows Backwards

The manifest is small only while the log is small. If every append rewrites one pointer per fragment, metadata work grows with the history. The old prefix never changes, so `wal3` folds that prefix into immutable snapshot nodes and keeps a hot root for the tail.

### The flat manifest gets expensive

Start with the metadata problem. A flat manifest rewrites its entire fragment list on every append, so the bytes spent on metadata grow with the number of writes. The scene makes that rising cost visible before introducing the structural fix.

{% viz scene="books/wal-on-s3/chapter-4" section="ch4-prefix" cue="0" from="0.000" to="38.928" title="A flat manifest pays for its entire growing prefix on every append." %}
{% endviz %}

The opportunity is already present in the data model: old entries never change. They are a natural immutable prefix waiting to be folded out of the hot root.

### Fold the immutable prefix off the hot path

The writer publishes a snapshot of that prefix first, then adopts it with a later manifest update. The append that installs the snapshot pays only for the pointer change; construction happened off the hot path.

{% viz scene="books/wal-on-s3/chapter-4" section="ch4-fold" cue="3" from="38.928" to="69.683" title="Snapshot rollover folds old pointers into immutable metadata without adding an append round trip." %}
{% endviz %}

Repeated rollover turns the linear cost curve into bounded bursts. The root stays hot, while older metadata becomes a stable object that no append needs to rewrite.

### A lopsided tree keeps the tail hot

Fold the prefix repeatedly and the log becomes a shallow, deliberately lopsided tree: a frequently rewritten root, immutable interior snapshot nodes, and fragments as leaves. Tail readers find recent data near the root; full scans can walk the older branches.

{% viz scene="books/wal-on-s3/chapter-4" section="ch4-tree" cue="6" from="69.683" to="101.830" title="Immutable snapshot nodes make a shallow tree while the root keeps the recent tail close." %}
{% endviz %}

Each pointer also carries its checksum, depth, and covered range. Folding is therefore not an opaque rewrite; it is an accounting transformation that can be checked.

### Crashes leave orphans, not corruption

The last section kills the writer after a fragment lands but before the manifest adopts it. The fragment is real and durable, yet nothing points at it. Because data is never overwritten, the log remains consistent and the orphan becomes ordinary collector work.

{% viz scene="books/wal-on-s3/chapter-4" section="ch4-recovery" cue="9" from="101.830" to="119.257" title="A mid-flight crash leaves an unreferenced fragment, not a broken live manifest." %}
{% endviz %}

That is the practical payoff of immutable storage: recovery is a skipped repair path rather than a race to restore mutable state under pressure.

## Chapter 5 · The Sum That Must Balance

Immutability makes recovery easier, but it does not prove the files are still present or that the manifest's view is internally complete. `wal3` uses an associative, commutative `setsum`: every fragment contributes a checksum, the manifest carries the total, and collection records the weight of what has been removed.

### Setsum makes integrity checkable

Integrity starts with a claim that can be recomputed. Each fragment contributes a checksum, the manifest carries one declared total, and the sum’s order-independent add/subtract behavior means folding metadata does not change the value it represents.

{% viz scene="books/wal-on-s3/chapter-5" section="ch5-setsum" cue="0" from="0.000" to="35.468" title="The log turns its integrity claim into a conserved, checkable sum." %}
{% endviz %}

The checksum is not decoration. It is the invariant that lets a reader compare the manifest’s compact view with the contents of the immutable objects it names.

### Compaction and collection conserve the total

Snapshots replace several old pointers with one node, so the snapshot must carry the exact combined weight of the prefix. Deletion removes bytes physically, so the manifest keeps a second collected total to stand in for what is no longer present.

{% viz scene="books/wal-on-s3/chapter-5" section="ch5-conservation" cue="4" from="35.468" to="76.370" title="Snapshots and collection preserve the same total across changing physical layouts." %}
{% endviz %}

The representation can change while the accounting stays constant. That is what makes compaction and reclamation compatible with verification.

### A scrub catches missing bytes

Verification is then straightforward arithmetic: walk the live children, add the collected weight, and compare the result with the manifest’s declared sum. Remove one fragment without changing anything else and the invariant fails loudly.

{% viz scene="books/wal-on-s3/chapter-5" section="ch5-proof" cue="7" from="76.370" to="106.231" title="A scrub detects a missing fragment, then separates storage integrity from end-to-end delivery." %}
{% endviz %}

A passing setsum proves that the stored view matches the manifest. It does not prove that a write was never dropped before it entered the counted history, which is why the end-to-end one-read-per-write test still matters.

### The pattern transfers

The close steps back from `wal3` to the reusable shape: immutable files hold the data, one small conditional record decides which files count, and a conserved invariant makes the whole view checkable.

{% viz scene="books/wal-on-s3/chapter-5" section="ch5-close" cue="10" from="106.231" to="126.920" title="The WAL-on-S3 pattern closes as one durable coordination idea, not a database hidden in a bucket." %}
{% endviz %}

The “WAL on S3” pattern is not “put a database on S3.” It is narrower and more useful: use object storage for durable immutable history, use conditional writes for a tiny authority record, and make every cleanup or compaction step preserve the same invariant. Once you see that shape, Chroma’s `wal3`, Git-like object graphs, and cell snapshots stop looking like separate tricks and start looking like variations on one durable coordination pattern.
