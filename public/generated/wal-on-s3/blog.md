# WAL on S3

*An O'RLY? visual explainer of Chroma's Rust `wal3`: a linearizable write-ahead log built from object-storage primitives. The pattern was prompted by [Chroma's WAL3 design note](https://www.trychroma.com/engineering/wal3), [Cursor's Git-at-scale post](https://cursor.com/blog/git-at-any-scale), and [Deno's celld write-up](https://flaviocopes.com/celld/). The scenes here stay concrete: they follow Chroma's `rust/wal3` implementation and use the other links as neighboring examples, not as sources for invented internals.*

The recurring shape is simple enough to draw on a napkin: put the data in files nobody edits, then spend your one conditional object-store write on a tiny record that says which files count. The rest of the system—concurrency, garbage collection, snapshots, and verification—exists to preserve that split.

## Chapter 1 · A Bucket That Cannot Lock

A bucket gives you durable objects, but not a lock manager or a transaction. If two writers repeatedly read and rewrite one shared object, the later write can erase an acknowledged append. Chroma's answer is to make the bulk data immutable and reserve the mutable authority for one manifest.

{% viz scene="books/wal-on-s3/chapter-1" cue="0" from="0.000" to="7.512" title="The log begins as records in flight: useful data, but not yet a durable ordered history." %}
{% endviz %}

The log begins as records in flight: useful data, but not yet a durable ordered history.

{% viz scene="books/wal-on-s3/chapter-1" cue="1" from="7.512" to="16.846" title="The tempting design is one object rewritten after every append." %}
{% endviz %}

The tempting design is one object rewritten after every append.

{% viz scene="books/wal-on-s3/chapter-1" cue="2" from="16.846" to="25.205" title="Two writers can read the same old version and then silently clobber one another." %}
{% endviz %}

Two writers can read the same old version and then silently clobber one another.

{% viz scene="books/wal-on-s3/chapter-1" cue="3" from="25.205" to="35.062" title="The object store's sharp primitive is a conditional write: accept this version only if the tag still matches." %}
{% endviz %}

The object store's sharp primitive is a conditional write: accept this version only if the tag still matches.

That one primitive is too valuable to spend on the data itself. The data path becomes append-only fragments; the coordination path becomes a small manifest. Chroma's engineering note describes this as the lock-free analogue of prepending to a linked list: create an immutable node, then conditionally move the head pointer.

{% viz scene="books/wal-on-s3/chapter-1" cue="4" from="35.062" to="43.769" title="The design splits into a mountain of data and one small authority record." %}
{% endviz %}

The design splits into a mountain of data and one small authority record.

{% viz scene="books/wal-on-s3/chapter-1" cue="5" from="43.769" to="54.973" title="Fragments are ordinary files written once. They need no shared mutable state, so writers can upload them independently." %}
{% endviz %}

Fragments are ordinary files written once. They need no shared mutable state, so writers can upload them independently.

{% viz scene="books/wal-on-s3/chapter-1" cue="6" from="54.973" to="64.945" title="The manifest names the fragments, their order, and the ranges of log positions they cover." %}
{% endviz %}

The manifest names the fragments, their order, and the ranges of log positions they cover.

{% viz scene="books/wal-on-s3/chapter-1" cue="7" from="64.945" to="76.079" title="In Chroma's layout, fragment paths are derived from sequence numbers while the manifest sits at a fixed key." %}
{% endviz %}

In Chroma's layout, fragment paths are derived from sequence numbers while the manifest sits at a fixed key.

{% viz scene="books/wal-on-s3/chapter-1" cue="8" from="76.079" to="85.437" title="Readers follow the manifest to fragments while writers advance the authority record; neither has to rewrite the bulk data." %}
{% endviz %}

Readers follow the manifest to fragments while writers advance the authority record; neither has to rewrite the bulk data.

{% viz scene="books/wal-on-s3/chapter-1" cue="9" from="85.437" to="95.572" title="Keep this shape in mind: immutable files hold the data, and one conditional write decides which files count." %}
{% endviz %}

Keep this shape in mind: immutable files hold the data, and one conditional write decides which files count.

## Chapter 2 · The Compare-and-Swap Heartbeat

The split only matters if the append path is exact. A caller hands a message to the writer; the batch manager groups it with neighbors; the batch becomes a fragment; the fragment is written if absent; and only then does the manifest manager try to install a new manifest with `If-Match`.

{% viz scene="books/wal-on-s3/chapter-2" cue="0" from="0.000" to="8.742" title="An append begins as a message handed to the writer. It is not durable merely because the call has started." %}
{% endviz %}

An append begins as a message handed to the writer. It is not durable merely because the call has started.

{% viz scene="books/wal-on-s3/chapter-2" cue="1" from="8.742" to="17.601" title="Batching trades a little latency for fewer, larger fragment files." %}
{% endviz %}

Batching trades a little latency for fewer, larger fragment files.

{% viz scene="books/wal-on-s3/chapter-2" cue="2" from="17.601" to="25.542" title="When the batch is ready, it hardens into one fragment and receives its own range of log positions." %}
{% endviz %}

When the batch is ready, it hardens into one fragment and receives its own range of log positions.

{% viz scene="books/wal-on-s3/chapter-2" cue="3" from="25.542" to="34.726" title="The fragment upload is write-if-absent: its sequence-derived name cannot quietly overwrite another fragment." %}
{% endviz %}

The fragment upload is write-if-absent: its sequence-derived name cannot quietly overwrite another fragment.

{% viz scene="books/wal-on-s3/chapter-2" cue="4" from="34.726" to="43.468" title="A file sitting in the bucket is not durable history until the manifest points at it." %}
{% endviz %}

A file sitting in the bucket is not durable history until the manifest points at it.

The manifest manager is the commit point. It appends the new pointer, folds the fragment's checksum into the running checksum, and writes the replacement manifest only if the stored version tag is the one it read.

{% viz scene="books/wal-on-s3/chapter-2" cue="5" from="43.468" to="51.944" title="The manager adds the fragment pointer and its checksum to the manifest's current view of the log." %}
{% endviz %}

The manager adds the fragment pointer and its checksum to the manifest's current view of the log.

{% viz scene="books/wal-on-s3/chapter-2" cue="6" from="51.944" to="61.986" title="A matching tag makes the append durable: the new manifest is now the authority for the uploaded fragment." %}
{% endviz %}

A matching tag makes the append durable: the new manifest is now the authority for the uploaded fragment.

{% viz scene="books/wal-on-s3/chapter-2" cue="7" from="61.986" to="69.997" title="A second writer may have read the same earlier manifest, but it is still holding an obsolete tag." %}
{% endviz %}

A second writer may have read the same earlier manifest, but it is still holding an obsolete tag.

{% viz scene="books/wal-on-s3/chapter-2" cue="8" from="69.997" to="80.468" title="The stale writer loses with a contention error before it can overwrite anything." %}
{% endviz %}

The stale writer loses with a contention error before it can overwrite anything.

{% viz scene="books/wal-on-s3/chapter-2" cue="9" from="80.468" to="91.486" title="Leader election can be imperfect because correctness lives in the conditional manifest update, not in the election." %}
{% endviz %}

Leader election can be imperfect because correctness lives in the conditional manifest update, not in the election.

{% viz scene="books/wal-on-s3/chapter-2" cue="10" from="91.486" to="98.359" title="The concurrency story fits in one header; everything else is immutable data and retryable coordination." %}
{% endviz %}

The concurrency story fits in one header; everything else is immutable data and retryable coordination.

This is why object-storage conditional writes feel like compare-and-swap. They do not turn S3 into a database. They let a database-like invariant live in a tiny mutable pointer while every payload remains safe to retry, duplicate, or garbage-collect later.

## Chapter 3 · Pins and the Three-Phase Dance

Append-only storage eventually needs reclamation. The dangerous question is not “which files look old?” but “which files can no reader still be using?” Chroma moves that knowledge into cursors: small per-reader files that pin a position without competing with the writer for the manifest.

{% viz scene="books/wal-on-s3/chapter-3" cue="0" from="0.000" to="8.696" title="An append-only log grows forever unless readers give the collector a safe lower bound." %}
{% endviz %}

An append-only log grows forever unless readers give the collector a safe lower bound.

{% viz scene="books/wal-on-s3/chapter-3" cue="1" from="8.696" to="16.997" title="The writer cannot decide what is finished with; readers may be at different positions." %}
{% endviz %}

The writer cannot decide what is finished with; readers may be at different positions.

{% viz scene="books/wal-on-s3/chapter-3" cue="2" from="16.997" to="27.724" title="Each reader publishes a cursor that pins its current position and everything newer." %}
{% endviz %}

Each reader publishes a cursor that pins its current position and everything newer.

{% viz scene="books/wal-on-s3/chapter-3" cue="3" from="27.724" to="35.758" title="Cursors live in their own objects, so pinning a read never fights the writer for the authority record." %}
{% endviz %}

Cursors live in their own objects, so pinning a read never fights the writer for the authority record.

{% viz scene="books/wal-on-s3/chapter-3" cue="4" from="35.758" to="46.126" title="Collection takes the earliest pin across all readers. Older data is a candidate; newer data is untouchable." %}
{% endviz %}

Collection takes the earliest pin across all readers. Older data is a candidate; newer data is untouchable.

The collector is deliberately staged. First it writes a `GARBAGE` plan describing snapshots, fragments, and the checksum being discarded. Then the writer publishes a manifest that no longer references the doomed objects. Only after readers have had time to finish does deletion happen.

{% viz scene="books/wal-on-s3/chapter-3" cue="5" from="46.126" to="57.365" title="Phase one records intent without deleting or changing the live manifest." %}
{% endviz %}

Phase one records intent without deleting or changing the live manifest.

{% viz scene="books/wal-on-s3/chapter-3" cue="6" from="57.365" to="67.071" title="A crash after planning is harmless: an unexecuted plan is just a file that can be discarded." %}
{% endviz %}

A crash after planning is harmless: an unexecuted plan is just a file that can be discarded.

{% viz scene="books/wal-on-s3/chapter-3" cue="7" from="67.071" to="76.753" title="Phase two uses the ordinary append protocol to publish a manifest that no longer references the garbage." %}
{% endviz %}

Phase two uses the ordinary append protocol to publish a manifest that no longer references the garbage.

{% viz scene="books/wal-on-s3/chapter-3" cue="8" from="76.753" to="86.738" title="Phase three waits for readers that fetched the old manifest before the collector removes bytes." %}
{% endviz %}

Phase three waits for readers that fetched the old manifest before the collector removes bytes.

{% viz scene="books/wal-on-s3/chapter-3" cue="9" from="86.738" to="96.281" title="Deletion is last, and it is limited to objects the collector proved are unreferenced." %}
{% endviz %}

Deletion is last, and it is limited to objects the collector proved are unreferenced.

{% viz scene="books/wal-on-s3/chapter-3" cue="10" from="96.281" to="105.615" title="Three phases make one service responsible for deletion; everyone else only adds files or advances a pointer." %}
{% endviz %}

Three phases make one service responsible for deletion; everyone else only adds files or advances a pointer.

{% viz scene="books/wal-on-s3/chapter-3" cue="11" from="105.615" to="115.820" title="The safety rule is intentionally conservative: positive proof of unreachability comes before deletion." %}
{% endviz %}

The safety rule is intentionally conservative: positive proof of unreachability comes before deletion.

The result is less clever than a distributed lock service and more robust under failure. A collector can crash between any two phases without leaving a half-applied deletion hidden inside the log's authority record.

## Chapter 4 · A Tree That Grows Backwards

The manifest is small only while the log is small. If every append rewrites one pointer per fragment, metadata work grows with the history. The old prefix never changes, so `wal3` folds that prefix into immutable snapshot nodes and keeps a hot root for the tail.

{% viz scene="books/wal-on-s3/chapter-4" cue="0" from="0.000" to="10.414" title="The naive manifest pays for the whole fragment list on every append." %}
{% endviz %}

The naive manifest pays for the whole fragment list on every append.

{% viz scene="books/wal-on-s3/chapter-4" cue="1" from="10.414" to="20.817" title="As the list grows, the metadata bytes written per append grow with it." %}
{% endviz %}

As the list grows, the metadata bytes written per append grow with it.

{% viz scene="books/wal-on-s3/chapter-4" cue="2" from="20.817" to="30.766" title="The opportunity is structural: old entries are already immutable and can be lifted out." %}
{% endviz %}

The opportunity is structural: old entries are already immutable and can be lifted out.

{% viz scene="books/wal-on-s3/chapter-4" cue="3" from="30.766" to="38.928" title="The writer publishes a snapshot of the prefix, then adopts it with one later manifest update." %}
{% endviz %}

The writer publishes a snapshot of the prefix, then adopts it with one later manifest update.

{% viz scene="books/wal-on-s3/chapter-4" cue="4" from="38.928" to="49.458" title="The snapshot is written off the hot path; the append that adopts it pays no extra round trip for construction." %}
{% endviz %}

The snapshot is written off the hot path; the append that adopts it pays no extra round trip for construction.

{% viz scene="books/wal-on-s3/chapter-4" cue="5" from="49.458" to="58.874" title="Snapshot rollover turns one ever-growing list into bounded bursts of metadata work." %}
{% endviz %}

Snapshot rollover turns one ever-growing list into bounded bursts of metadata work.

{% viz scene="books/wal-on-s3/chapter-4" cue="6" from="58.874" to="69.683" title="Repeated folding creates a shallow tree: a rewritten root, immutable interior nodes, and fragments as leaves." %}
{% endviz %}

Repeated folding creates a shallow tree: a rewritten root, immutable interior nodes, and fragments as leaves.

{% viz scene="books/wal-on-s3/chapter-4" cue="7" from="69.683" to="80.260" title="The tree is intentionally lopsided so tail readers find recent data in the root while full scans walk older branches." %}
{% endviz %}

The tree is intentionally lopsided so tail readers find recent data in the root while full scans walk older branches.

{% viz scene="books/wal-on-s3/chapter-4" cue="8" from="80.260" to="90.697" title="Each pointer carries enough accounting metadata to make folding a checkable transformation." %}
{% endviz %}

Each pointer carries enough accounting metadata to make folding a checkable transformation.

{% viz scene="books/wal-on-s3/chapter-4" cue="9" from="90.697" to="101.830" title="A crash can leave a real, durable orphan fragment—but the live manifest remains unchanged." %}
{% endviz %}

A crash can leave a real, durable orphan fragment—but the live manifest remains unchanged.

{% viz scene="books/wal-on-s3/chapter-4" cue="10" from="101.830" to="111.850" title="The next writer does not need a recovery transaction. The orphan is merely future collector work." %}
{% endviz %}

The next writer does not need a recovery transaction. The orphan is merely future collector work.

{% viz scene="books/wal-on-s3/chapter-4" cue="11" from="111.850" to="119.257" title="Never overwriting data turns crash recovery into a skipped repair path rather than a race to restore state." %}
{% endviz %}

Never overwriting data turns crash recovery into a skipped repair path rather than a race to restore state.

This is the “Git at scale” intuition in a WAL-shaped form: immutable objects accumulate, and small mutable metadata chooses the current view. The difference is that `wal3` makes the authority and its conditional update explicit, so the log can promise linearizable append semantics instead of merely offering a pile of blobs.

## Chapter 5 · The Sum That Must Balance

Immutability makes recovery easier, but it does not prove the files are still present or that the manifest's view is internally complete. `wal3` uses an associative, commutative `setsum`: every fragment contributes a checksum, the manifest carries the total, and collection records the weight of what has been removed.

{% viz scene="books/wal-on-s3/chapter-5" cue="0" from="0.000" to="9.752" title="Believing a log is intact is the expensive claim; it needs a checkable invariant." %}
{% endviz %}

Believing a log is intact is the expensive claim; it needs a checkable invariant.

{% viz scene="books/wal-on-s3/chapter-5" cue="1" from="9.752" to="16.695" title="Every fragment contributes a checksum of its contents." %}
{% endviz %}

Every fragment contributes a checksum of its contents.

{% viz scene="books/wal-on-s3/chapter-5" cue="2" from="16.695" to="26.435" title="The manifest carries one declared total for the live log." %}
{% endviz %}

The manifest carries one declared total for the live log.

{% viz scene="books/wal-on-s3/chapter-5" cue="3" from="26.435" to="35.468" title="Because the sum can be added and subtracted without depending on order, folding a fragment costs constant metadata work." %}
{% endviz %}

Because the sum can be added and subtracted without depending on order, folding a fragment costs constant metadata work.

{% viz scene="books/wal-on-s3/chapter-5" cue="4" from="35.468" to="45.627" title="A snapshot preserves the exact combined weight of the prefix it replaces." %}
{% endviz %}

A snapshot preserves the exact combined weight of the prefix it replaces.

{% viz scene="books/wal-on-s3/chapter-5" cue="5" from="45.627" to="54.810" title="After deletion, the manifest keeps a second number for the weight that is no longer physically present." %}
{% endviz %}

After deletion, the manifest keeps a second number for the weight that is no longer physically present.

{% viz scene="books/wal-on-s3/chapter-5" cue="6" from="54.810" to="65.561" title="A scrub adds live children and collected weight, then compares the result with the declared total." %}
{% endviz %}

A scrub adds live children and collected weight, then compares the result with the declared total.

{% viz scene="books/wal-on-s3/chapter-5" cue="7" from="65.561" to="76.370" title="Lose one fragment and nothing else has to change for the invariant to fail loudly." %}
{% endviz %}

Lose one fragment and nothing else has to change for the invariant to fail loudly.

{% viz scene="books/wal-on-s3/chapter-5" cue="8" from="76.370" to="86.007" title="A passing checksum proves the stored view matches the manifest; it does not prove an uncounted write was never dropped." %}
{% endviz %}

A passing checksum proves the stored view matches the manifest; it does not prove an uncounted write was never dropped.

{% viz scene="books/wal-on-s3/chapter-5" cue="9" from="86.007" to="96.351" title="End-to-end durability needs the boring test too: one read for every acknowledged write." %}
{% endviz %}

End-to-end durability needs the boring test too: one read for every acknowledged write.

{% viz scene="books/wal-on-s3/chapter-5" cue="10" from="96.351" to="106.231" title="The whole log repeats one idea: immutable files hold data and one small record decides which files count." %}
{% endviz %}

The whole log repeats one idea: immutable files hold data and one small record decides which files count.

{% viz scene="books/wal-on-s3/chapter-5" cue="11" from="106.231" to="116.634" title="The pattern travels: pile up data nobody edits, then let a conditional pointer move the system's view." %}
{% endviz %}

The pattern travels: pile up data nobody edits, then let a conditional pointer move the system's view.

{% viz scene="books/wal-on-s3/chapter-5" cue="12" from="116.634" to="126.920" title="A bucket, immutable files, one conditional header, and a sum that balances: a linearizable log with no lock service." %}
{% endviz %}

A bucket, immutable files, one conditional header, and a sum that balances: a linearizable log with no lock service.

The “WAL on S3” pattern is not “put a database on S3.” It is narrower and more useful: use object storage for durable immutable history, use conditional writes for a tiny authority record, and make every cleanup or compaction step preserve the same invariant. Once you see that shape, Chroma's `wal3`, Git-like object graphs, and cell snapshots stop looking like separate tricks and start looking like variations on one durable coordination pattern.
