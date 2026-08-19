# WAL on S3

*An O'RLY? visual explainer of Chroma's Rust `wal3`: a linearizable write-ahead log built from object-storage primitives. The pattern was prompted by [Chroma's WAL3 design note](https://www.trychroma.com/engineering/wal3), [Cursor's Git-at-scale post](https://cursor.com/blog/git-at-any-scale), and [Deno's celld write-up](https://flaviocopes.com/celld/). The scenes here stay concrete: they follow Chroma's `rust/wal3` implementation and use the other links as neighboring examples, not as sources for invented internals.*

The recurring shape is simple enough to draw on a napkin: put the data in files nobody edits, then spend your one conditional object-store write on a tiny record that says which files count. The rest of the system—concurrency, garbage collection, snapshots, and verification—exists to preserve that split.

## Chapter 1 · A Bucket That Cannot Lock

A bucket gives you durable objects, but not a lock manager or a transaction. If two writers repeatedly read and rewrite one shared object, the later write can erase an acknowledged append. Chroma's answer is to make the bulk data immutable and reserve the mutable authority for one manifest.

<figure><img src="/generated/wal-on-s3/blog/chapter-1-0.png" alt="A field of records arriving before they have a durable home"><figcaption>The log begins as records in flight: useful data, but not yet a durable ordered history.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-1-1.png" alt="Records compressed into one mutable object"><figcaption>The tempting design is one object rewritten after every append.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-1-2.png" alt="Two writers racing toward one object while one record is lost"><figcaption>Two writers can read the same old version and then silently clobber one another.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-1-3.png" alt="An object card labeled If-Match ETag"><figcaption>The object store's sharp primitive is a conditional write: accept this version only if the tag still matches.</figcaption></figure>

That one primitive is too valuable to spend on the data itself. The data path becomes append-only fragments; the coordination path becomes a small manifest. Chroma's engineering note describes this as the lock-free analogue of prepending to a linked list: create an immutable node, then conditionally move the head pointer.

<figure><img src="/generated/wal-on-s3/blog/chapter-1-4.png" alt="A single object splitting into a manifest and immutable fragments"><figcaption>The design splits into a mountain of data and one small authority record.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-1-5.png" alt="Six immutable fragment tiles containing record dots"><figcaption>Fragments are ordinary files written once. They need no shared mutable state, so writers can upload them independently.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-1-6.png" alt="A manifest authority card connected to fragment tiles"><figcaption>The manifest names the fragments, their order, and the ranges of log positions they cover.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-1-7.png" alt="A fragment path and a manifest key under one bucket"><figcaption>In Chroma's layout, fragment paths are derived from sequence numbers while the manifest sits at a fixed key.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-1-8.png" alt="A LogWriter and LogReader connected to the manifest"><figcaption>Readers follow the manifest to fragments while writers advance the authority record; neither has to rewrite the bulk data.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-1-9.png" alt="Immutable fragments beneath a small conditional authority record"><figcaption>Keep this shape in mind: immutable files hold the data, and one conditional write decides which files count.</figcaption></figure>

## Chapter 2 · The Compare-and-Swap Heartbeat

The split only matters if the append path is exact. A caller hands a message to the writer; the batch manager groups it with neighbors; the batch becomes a fragment; the fragment is written if absent; and only then does the manifest manager try to install a new manifest with `If-Match`.

<figure><img src="/generated/wal-on-s3/blog/chapter-2-0.png" alt="One append message entering a writer pipeline"><figcaption>An append begins as a message handed to the writer. It is not durable merely because the call has started.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-2-1.png" alt="Several append records waiting in a batch manager"><figcaption>Batching trades a little latency for fewer, larger fragment files.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-2-2.png" alt="A batch becoming a fragment with a sequence range"><figcaption>When the batch is ready, it hardens into one fragment and receives its own range of log positions.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-2-3.png" alt="A fragment beside a PutMode IfNotExist label"><figcaption>The fragment upload is write-if-absent: its sequence-derived name cannot quietly overwrite another fragment.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-2-4.png" alt="An uploaded fragment not yet referenced by the manifest"><figcaption>A file sitting in the bucket is not durable history until the manifest points at it.</figcaption></figure>

The manifest manager is the commit point. It appends the new pointer, folds the fragment's checksum into the running checksum, and writes the replacement manifest only if the stored version tag is the one it read.

<figure><img src="/generated/wal-on-s3/blog/chapter-2-5.png" alt="A manifest manager card with apply_fragment and a running setsum"><figcaption>The manager adds the fragment pointer and its checksum to the manifest's current view of the log.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-2-6.png" alt="A conditional manifest install with an If-Match tag"><figcaption>A matching tag makes the append durable: the new manifest is now the authority for the uploaded fragment.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-2-7.png" alt="A rival writer holding an older manifest tag"><figcaption>A second writer may have read the same earlier manifest, but it is still holding an obsolete tag.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-2-8.png" alt="A rejected write returning to a retry path"><figcaption>The stale writer loses with a contention error before it can overwrite anything.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-2-9.png" alt="Two leader-election paths converging on one conditional write"><figcaption>Leader election can be imperfect because correctness lives in the conditional manifest update, not in the election.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-2-10.png" alt="A single request header representing the concurrency protocol"><figcaption>The concurrency story fits in one header; everything else is immutable data and retryable coordination.</figcaption></figure>

This is why object-storage conditional writes feel like compare-and-swap. They do not turn S3 into a database. They let a database-like invariant live in a tiny mutable pointer while every payload remains safe to retry, duplicate, or garbage-collect later.

## Chapter 3 · Pins and the Three-Phase Dance

Append-only storage eventually needs reclamation. The dangerous question is not “which files look old?” but “which files can no reader still be using?” Chroma moves that knowledge into cursors: small per-reader files that pin a position without competing with the writer for the manifest.

<figure><img src="/generated/wal-on-s3/blog/chapter-3-0.png" alt="A fragment row stretching farther than the collector can see"><figcaption>An append-only log grows forever unless readers give the collector a safe lower bound.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-3-1.png" alt="Several readers disagreeing about how far they have consumed"><figcaption>The writer cannot decide what is finished with; readers may be at different positions.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-3-2.png" alt="A cursor file with a position, timestamp, and owner"><figcaption>Each reader publishes a cursor that pins its current position and everything newer.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-3-3.png" alt="Cursor files separated from the manifest"><figcaption>Cursors live in their own objects, so pinning a read never fights the writer for the authority record.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-3-4.png" alt="The earliest cursor pin marked as the garbage-collection cutoff"><figcaption>Collection takes the earliest pin across all readers. Older data is a candidate; newer data is untouchable.</figcaption></figure>

The collector is deliberately staged. First it writes a `GARBAGE` plan describing snapshots, fragments, and the checksum being discarded. Then the writer publishes a manifest that no longer references the doomed objects. Only after readers have had time to finish does deletion happen.

<figure><img src="/generated/wal-on-s3/blog/chapter-3-5.png" alt="A GARBAGE file listing snapshots, fragments, and a discarded checksum"><figcaption>Phase one records intent without deleting or changing the live manifest.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-3-6.png" alt="A collector crash beside an untouched garbage plan"><figcaption>A crash after planning is harmless: an unexecuted plan is just a file that can be discarded.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-3-7.png" alt="The writer publishing a manifest without the doomed fragment range"><figcaption>Phase two uses the ordinary append protocol to publish a manifest that no longer references the garbage.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-3-8.png" alt="A reader still holding an older manifest during a wait phase"><figcaption>Phase three waits for readers that fetched the old manifest before the collector removes bytes.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-3-9.png" alt="Deletes flowing only after references have disappeared"><figcaption>Deletion is last, and it is limited to objects the collector proved are unreferenced.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-3-10.png" alt="One collector holding the only delete arrow"><figcaption>Three phases make one service responsible for deletion; everyone else only adds files or advances a pointer.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-3-11.png" alt="A final garbage-collection proof card"><figcaption>The safety rule is intentionally conservative: positive proof of unreachability comes before deletion.</figcaption></figure>

The result is less clever than a distributed lock service and more robust under failure. A collector can crash between any two phases without leaving a half-applied deletion hidden inside the log's authority record.

## Chapter 4 · A Tree That Grows Backwards

The manifest is small only while the log is small. If every append rewrites one pointer per fragment, metadata work grows with the history. The old prefix never changes, so `wal3` folds that prefix into immutable snapshot nodes and keeps a hot root for the tail.

<figure><img src="/generated/wal-on-s3/blog/chapter-4-0.png" alt="A manifest holding one pointer for every fragment"><figcaption>The naive manifest pays for the whole fragment list on every append.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-4-1.png" alt="A rising bytes-per-write chart for a growing manifest"><figcaption>As the list grows, the metadata bytes written per append grow with it.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-4-2.png" alt="An immutable prefix separated from the live manifest root"><figcaption>The opportunity is structural: old entries are already immutable and can be lifted out.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-4-3.png" alt="A snapshot pointer replacing a prefix of fragment pointers"><figcaption>The writer publishes a snapshot of the prefix, then adopts it with one later manifest update.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-4-4.png" alt="A snapshot written before the manifest adopts it"><figcaption>The snapshot is written off the hot path; the append that adopts it pays no extra round trip for construction.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-4-5.png" alt="A sawtooth curve bounded by a snapshot rollover threshold"><figcaption>Snapshot rollover turns one ever-growing list into bounded bursts of metadata work.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-4-6.png" alt="A shallow tree with a root, interior snapshot nodes, and fragment leaves"><figcaption>Repeated folding creates a shallow tree: a rewritten root, immutable interior nodes, and fragments as leaves.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-4-7.png" alt="A lopsided tree with a hot tail on the right"><figcaption>The tree is intentionally lopsided so tail readers find recent data in the root while full scans walk older branches.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-4-8.png" alt="A pointer card carrying checksum, depth, and position range"><figcaption>Each pointer carries enough accounting metadata to make folding a checkable transformation.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-4-9.png" alt="A writer crash after a fragment upload but before manifest update"><figcaption>A crash can leave a real, durable orphan fragment—but the live manifest remains unchanged.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-4-10.png" alt="A next writer continuing without a repair step"><figcaption>The next writer does not need a recovery transaction. The orphan is merely future collector work.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-4-11.png" alt="A final immutable tree with no overwrite arrows"><figcaption>Never overwriting data turns crash recovery into a skipped repair path rather than a race to restore state.</figcaption></figure>

This is the “Git at scale” intuition in a WAL-shaped form: immutable objects accumulate, and small mutable metadata chooses the current view. The difference is that `wal3` makes the authority and its conditional update explicit, so the log can promise linearizable append semantics instead of merely offering a pile of blobs.

## Chapter 5 · The Sum That Must Balance

Immutability makes recovery easier, but it does not prove the files are still present or that the manifest's view is internally complete. `wal3` uses an associative, commutative `setsum`: every fragment contributes a checksum, the manifest carries the total, and collection records the weight of what has been removed.

<figure><img src="/generated/wal-on-s3/blog/chapter-5-0.png" alt="A scrub check asking for evidence that the log is intact"><figcaption>Believing a log is intact is the expensive claim; it needs a checkable invariant.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-5-1.png" alt="Individual fragments each labeled with their own checksum"><figcaption>Every fragment contributes a checksum of its contents.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-5-2.png" alt="A running total balancing fragment and snapshot checksums"><figcaption>The manifest carries one declared total for the live log.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-5-3.png" alt="A commutative setsum equation over fragments"><figcaption>Because the sum can be added and subtracted without depending on order, folding a fragment costs constant metadata work.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-5-4.png" alt="A snapshot carrying the combined sum of a folded prefix"><figcaption>A snapshot preserves the exact combined weight of the prefix it replaces.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-5-5.png" alt="A collected-weight counter beside the live checksum"><figcaption>After deletion, the manifest keeps a second number for the weight that is no longer physically present.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-5-6.png" alt="A scrub walking live children and comparing with manifest setsum"><figcaption>A scrub adds live children and collected weight, then compares the result with the declared total.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-5-7.png" alt="One missing fragment breaking the setsum balance"><figcaption>Lose one fragment and nothing else has to change for the invariant to fail loudly.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-5-8.png" alt="A distinction between at-rest integrity and dropped writes"><figcaption>A passing checksum proves the stored view matches the manifest; it does not prove an uncounted write was never dropped.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-5-9.png" alt="A one-to-one write and read-back test"><figcaption>End-to-end durability needs the boring test too: one read for every acknowledged write.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-5-10.png" alt="Immutable files converging on one authority record"><figcaption>The whole log repeats one idea: immutable files hold data and one small record decides which files count.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-5-11.png" alt="A bucket, immutable files, one header, and a balancing sum"><figcaption>The pattern travels: pile up data nobody edits, then let a conditional pointer move the system's view.</figcaption></figure>

<figure><img src="/generated/wal-on-s3/blog/chapter-5-12.png" alt="The final linearizable log equation over an object-storage bucket"><figcaption>A bucket, immutable files, one conditional header, and a sum that balances: a linearizable log with no lock service.</figcaption></figure>

The “WAL on S3” pattern is not “put a database on S3.” It is narrower and more useful: use object storage for durable immutable history, use conditional writes for a tiny authority record, and make every cleanup or compaction step preserve the same invariant. Once you see that shape, Chroma's `wal3`, Git-like object graphs, and cell snapshots stop looking like separate tricks and start looking like variations on one durable coordination pattern.
