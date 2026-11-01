# Research Bible: Durable Objects, Unbound

Film `durable-objects-unbound` · research as of **2026-10-31** · the screenwriter's single source of truth.
Every fact below appears in `claims.json` (ids in square brackets) and every quotation in `quotes.json`
(Q01–Q25, frozen in `quotes.lock.json`). Sources and pins are in `sources.json`.

**Provenance.** This bible re-verifies and extends the research done for the earlier book (82 sourced claims,
`public/generated/durable-objects-unbound/sources.json`; `bookClaim` fields map each film claim to its book
claim) and folds in that book's two independent-review corrections (claimed-vs-opened epochs; complete tail
proof). New for the film, each verified on 2026-10-31 against the primary source: the 2021 output-gate post,
the 2024 Storage Relay Service details, the S3 consistency and conditional-write timeline, Werner Vogels's
account of how S3 built strong consistency inside the service, the authorship of each section of the
9 October 2026 joint post, the full commit message of the supplied commit, celld's README and guarantees text,
and the provenance of celld's replication crate. Every blog quotation was checked byte-for-byte against the
fetched page; every repository quotation against the file at its pin.

**Pins (keep them distinct, always).**

| shorthand | what | pin |
|---|---|---|
| **workerd-initial** | the supplied commit, Ryan Dahl, "Cluster workerd processes over a shared bucket (#7994)", 2026-10-28 20:11:42 −07:00 = 29 Oct 03:11 UTC. Experimental. **No alarms.** | `aa494794c44a900592c8281b191302d3b0a6e2a5` |
| **workerd-later** | later inspected snapshot: alarms (`2992f3f89`, 30 Oct) and facets (`ad78a8fe`, 31 Oct). Lease code unchanged; commit path unchanged in shape. | `ad78a8fe76b32dd4f19c58d81b2e03e10a996bba` |
| **celld-0.6.3** | celld release snapshot, 2026-10-21 22:40:37 +02:00 | `8702f6d186c77698dbfb30cf29e3b1922a88f008` |

Upstream test suites were **read, not run**. Never say this film executed them [LI02].

---

## 1. The one-line film

A chat message gets its tick. The machine that gave the tick goes dark. The tick is still true. That is
possible because of a contract assembled from small, checkable parts: a bucket that can refuse a stale write
on one key and always returns the latest bytes; a runtime that captures SQLite's write-ahead log one finished
transaction at a time, uploads it, and re-reads the ownership record before it lets the reply out; leases
that make an old owner stop itself before anyone may replace it; and, in celld's faster fleet mode, followers
that press the tail onto their own disks and a successor that must seal and collect that tail before it
reopens the room. The bucket does not make coordination disappear. It hides it inside a storage service that
built and proved its own [SB03, SB04, SB14].

## 2. Master chronology

- **28 Sep 2020** · Durable Objects closed beta, post by Kenton Varda: a globally-unique identifier; "That object exists in only one location in the whole world at a time." (Q01). The demo is a chat app, one object per room (Q02) [HI01–HI03].
- **1 Dec 2020** · AWS: S3 delivers strong read-after-write consistency automatically for all applications [SB01]. (Two months after the Durable Objects beta. Earlier, overwrites were eventually consistent because writes and reads could take different cache paths [SB02].)
- **20 Apr 2021** · Werner Vogels, "Diving Deep on S3 Consistency": a cache coherence protocol, per-object ordering, a **witness** notified on every change (Q17); deductive proofs and model checking, "more work … than the actual implementation itself" (Q18) [SB03, SB04].
- **3 Aug 2021** · Kenton Varda, "Durable Objects: Easy, Fast, Correct — Choose three": input gates and **output gates**, which hold outgoing messages while a storage write is in progress (Q03) [HI05].
- **27 Sep 2022** · workerd open-sourced under Apache 2.0 (Q04); not on its own a secure sandbox [HI06, HI07].
- **20 Aug 2024** · S3 conditional create (If-None-Match): AWS says no client-side consensus mechanism is needed for that coordination [SB05].
- **26 Sep 2024** · SQLite inside Durable Objects, same thread; local latency "effectively zero" (Q05, local only). The hosted **Storage Relay Service** watches the WAL, batches to object storage every ≤10 s / 16 MB, forwards each commit to **five followers in five data centres**, confirms at **three** (Q06), and that confirmation opens the output gate [HI08–HI11].
- **25 Nov 2024** · S3 If-Match conditional overwrite: compare-and-swap on the ETag [SB06].
- **August 2026** · The Deno team releases celld (month only; Kenton Varda, Q10) [HI14]. Its SQLite replicator crate was vendored on 3 Aug 2026 from rustyriver, a Rust reimplementation of Litestream and the LTX format [HI25].
- **9 Oct 2026** · Deno team joining Cloudflare announced (Q12) [HI15]. Joint post: Ryan Dahl writes that workerd's Durable Objects are "limited to a single instance" (Q07) and that he "started celld" (Q08); Kenton Varda calls Durable Objects workerd's "one big gap" (Q26) wanting object storage as the only external dependency (Q09); Ryan Dahl and Bert Belder to lead first-class workerd self-hosting, merging celld's code and ideas (Q11) [HI12, HI13, HI18]. Announced plans: Deno runtime supported one more year, then "we will end our development of the Deno runtime" (Q13); Deploy six months; JSR continues on Cloudflare; rusty_v8 continues; Deno stays open source [HI16]. **No price or terms stated** [HI17].
- **21 Oct 2026** · celld v0.6.3 (the pin) [HI26].
- **28 Oct 2026 (Pacific) / 29 Oct UTC** · the supplied commit: "This is the beginning of merging celld's functionality into workerd." (Q14); "For now an object acknowledges a write only once it is fully synced to the bucket." (Q15); "Alarms are not supported yet" (Q16) [HI20, HI21].
- **30–31 Oct 2026** · alarms (#8090) and facets (#8113) land in workerd's cluster [HI22].

## 3. People (respectful silhouettes, name cards, only their published words)

| person | role in the film | sourced by |
|---|---|---|
| **Kenton Varda** | Cloudflare; author of the 2020, 2021, 2022 and 2024 posts; co-author of the 2026 joint post; names the "one big gap" [HI12] and welcomes celld (Q10) | cf-do-2020 … cf-deno-2026 |
| **Ryan Dahl** | Deno, now Cloudflare; started celld (Q08, Q09); author of the supplied commit and the alarms and facets commits [HI20, HI22]; author of the Deno announcement | cf-deno-2026, deno-2026, wd-commit |
| **Bert Belder** | named with Ryan Dahl as leading the workerd self-hosting effort [HI18]. Name card only; no words. | cf-deno-2026 |
| **Werner Vogels** | Amazon CTO; explained S3's internal witness and proofs (Q17, Q18) [SB03, SB04] | vogels-2021 |
| Ben Johnson; Mike Nomitch | credited only by name, on the sources card, for Litestream and rustyriver [HI25] | cd-ltx |

No appearance details are established in the research: draw generic, dignified figures of the 2020s (desk,
lamp, laptop), distinguished by posture and setting, never by caricature or likeness. Never invent words.
Never voice a real person.

## 4. Why a bucket can be the referee (deep dive I)

**What the fleet actually needs** [SB09, CE14]: on ONE authority key, (a) a conditional create that fails if
the object exists, (b) a conditional overwrite that fails if the object changed since you read it, (c) a read
that returns the latest successful write, (d) ranged reads for restore; list-after-write only for celld's
optional epoch GC; and, in celld's words, a supervisor that restarts the process.

**Pull the condition out and watch it break** [SB08]: two houses each read "no owner", each write "mine";
the second write overwrites the first, but the first has already started serving. An overwrite cannot take
back what was served. With If-None-Match one create wins and the other gets a precondition failure [SB05];
with If-Match a takeover must present the version it read, so of two contenders holding the same old
version, one replaces it and the other is refused [SB06, SB07, SB16].

**Scope**: one key, one referee. Nothing here makes two different objects' writes atomic together [SB13].

**The reversal: who referees the referee?** S3's strong consistency is itself built from coordination
machinery: a cache coherence protocol, per-object ordering, a witness on every write, proofs and model
checking [SB03, SB04]. The application fleet outsources consensus to the store; it does not abolish it [SB14].
Ownership progress now depends on the bucket's semantics and availability [SB15].

**"S3-compatible" is not a guarantee** [SB10–SB12, Q24]: celld names qualified stores, warns that some
compatible stores do not implement the conditions, and that a store that accepts the headers but ignores the
condition "fails late and silently". Every celld node runs four conditional writes (create, reject-create,
update, reject-stale; two must fail) plus a ranged read before it serves. Different stores spell the promise
differently (Cloud Storage's generation match) [SB17].

## 5. The owner record, epochs, claimed vs opened (deep dive II, workerd)

`do/<namespace>/<actor>/own.json` = **node · epoch · from**, "the only authority" [OW01].
- **Claim**: conditional replace with node = me, epoch + 1, **from copied unchanged** [OW02, OW04].
- **Open**: a second guarded write that sets **from = epoch**, done only after restoring the predecessor and
  uploading the new session's starting snapshot [OW07, OW08]. Until it opens, an epoch serves nothing [OW09].
- **Claimed is not opened.** Worked example (illustrative hosts and numbers, FX01) [RE05]:
  A opened 7 → `A·7·from 7`. B claims → `B·8·from 7`. B dies before opening. C claims → `C·9·from 7`, and
  recovers **7's** log (8 never opened, so it acknowledged nothing). Had B opened, the record would read
  `B·8·from 8` and C would recover 8.
- New objects are created already open in one conditional create; the loser routes to the winner [OW05].
- Routes are cached optimisations, refreshed at most every 5 s; up to 8 claim attempts [OW06].

celld's analogue (distinct implementation): `cells/<cell>/own.json` names a node session and a fencing epoch;
every activation advances it; LTX goes under `cells/<cell>/ltx/e<epoch>/`, so a stale node can only write into
a superseded prefix [OW10, OW11]; a missing record next to data is refused rather than restarted empty [OW12].

## 6. Leases and fencing (deep dive III, workerd numbers)

Constants [LE01]: lease **20,000 ms**; renew every **3,000 ms**, each attempt bounded at **4,000 ms**; retry
after **1,000 ms**; max skew **2,000 ms**; safety margin **4,000 ms** (twice the skew).
Why 4 s and not 2 s: a code comment records R2 write stalls of about 5.5 s at every five-minute mark; a 2 s
bound cancelled them and fenced every node [LE02].
- **holds(now)** iff now + 4,000 < expiry; serve only while it holds [LE03].
- **Before renewing**: fence if skew > 2,000 ms, or if the lease would not hold 4,000 ms from now [LE04].
- After a failed renewal: retry if it still holds 4 s on, else fence [LE05]. **Fence = the process exits**
  before peers may take over [LE06].
- Arithmetic (illustrative expiry at 20,000 ms on the owner's clock): serve while t < 16,000; start a renewal
  only while t < 12,000 [LE07]. Boundaries, not promises about timers.
- Skew is measured against the bucket's observed clock; with no observation it defaults to zero, so the bound
  is an **assumption** [LE08].
- **A timeout does not prove a machine died** [LE09]. A paused process can wake. The code's working rule
  treats an unrenewed peer as dead [LE10], and safety comes from two other places: the old owner stops itself
  in time, and the post-upload re-read refuses to acknowledge for a superseded epoch [DU02, DU10].
- celld differs: 10 s TTL renewed at a third; self-fence when the published expiry passes; exit code 3; expiry
  checked on every routed request [LE11]. Its post-bucket check "reads the record instead of a clock" (Q20)
  [LE12]. **Never** put workerd's 20 s / 2 s / 16 s / 12 s numbers on celld.
- If the bucket is unreachable: no new acknowledgements, and renewal failure eventually fences writers [LE13].

## 7. The write-ahead log and proof-before-response (deep dive IV)

SQLite WAL format [WA01]: a **32-byte** file header; frames of **24-byte header + one page**; the header of a
transaction's last frame records the database size in pages after the commit (zero otherwise). That number is
the commit marker.
workerd capture [WA02, WA03]: the VFS reports each WAL write; frames since the last commit are buffered; the
write that completes a commit frame completes one transaction; a rollback's frames are overwritten by the next
transaction's; a write at offset 0 means a checkpoint started a fresh WAL.
Log in the bucket [WA04, WA05, WA07, WA08]: gzipped `frames.capnp` files, `log/<session>/<end>` batches (page
runs merged to newest versions) and `snapshot/<session>/<frame>`; each epoch's session starts with a snapshot
of what it inherited; gzip's CRC-32 and length make corrupt or truncated copies fail rather than replay wrong;
compaction uploads the replacement before deleting.
celld uses **LTX**, not frames.capnp [WA06].

**The acknowledgement (workerd, both snapshots)** [DU01–DU05]: capture → stage → upload → **re-read own.json**
→ only if it still names this epoch, advance the acknowledgement. Callers share one upload per group and each
returns when coverage reaches its own target. The code calls the re-read "the re-read after a bucket upload
that makes the upload an acknowledgement". No follower path exists in workerd at either pin.

**What is held back**: the 2021 output gate holds outgoing messages during writes [HI05]; celld lists exactly
what its gate holds: write responses, read-only responses exposing uncovered writes, errors, R2 mutations, raw
TCP, every stream chunk (Q25) [DU06, DU07].
**Limits**: a missing acknowledgement does not prove a write absent (Q23): durability is not exactly-once
[DU08]. Latency: local SQL plus upload plus re-read; draw any widths as illustrative [DU09].
A superseded owner may still finish uploads into its old session; that never makes it the owner [DU11, RE06].

## 8. Rebuilding the room (deep dive V)

workerd restore [RE01–RE04]: newest snapshot, then each batch, skipping applied frames by sequence; a missing
batch in between makes the restore **refuse**; checksums detect damage but cannot recreate missing bytes;
pages are replayed, handlers are not re-run. Takeover deletes non-authoritative local files first [OW08].

## 9. celld's fleet and the tail that lives on neighbours (deep dive VI, celld 0.6.3 only)

[CE01–CE14]
- Default **fleet** mode: the owner sends each write to one or two followers; **every** follower in the proof
  must fsync; the acknowledgement can precede the bucket upload.
- The owner never counts itself; one follower suffices; two running nodes are needed for any fleet proof; up
  to two followers, so three copies with three or more nodes; with one follower, a not-yet-uploaded write lives
  only on the owner and that follower. No ensemble: bucket proof instead, much slower.
- Before its first fleet acknowledgement each process session creates a conditional **node-log record**.
- Takeover recovery gate: read the predecessor's node-log record first. Absent = never acknowledged past the
  bucket. Sealed = recovered. Open/recovering = compare-and-swap to fence it, **seal** the reachable followers,
  upload their retained tail, mark it sealed, **then** restore (Q21).
- **Complete-tail proof is mandatory**: at least one current follower must return its complete retained range,
  or activation fails and keeps the requirement [CE08]. One damaged follower is not fatal if another current
  follower certifies a complete range; recovery blocks when **no** current follower can [CE09; book review
  correction]. A follower's HTTP error does not prove absence (Q22). A deleted final batch can be undetectable.
- Nodes restarting together still serve seal and tail requests to each other [CE10]; recovery can take minutes,
  retrying up to 240 times by default [CE11].
- **The distinction**: epoch prefixes fence bucket writes; they cannot recover a follower-only tail. The
  sealing gate does [CE13].
- Lineage: Cloudflare's hosted SRS already combined object storage with follower acknowledgements (five
  followers, three to confirm) [HI09, HI10]; celld's fleet uses one or two followers that each must fsync
  [CE01]. Different numbers, different systems; do not equate them.

## 10. What is portable now, and its dated limits

- workerd-initial: experimental, `--experimental`, no alarms; acknowledgements wait for the bucket [LI01, HI21].
- workerd-later (31 Oct): alarms and facets; tests cover single-writer state, forwarding, killed-owner takeover,
  lease records, alarms on a survivor, facets; inspected, not run; alarm tests ≠ exactly-once effects [LI02, LI03].
- celld 0.6.3: supervisor required; reserved prefixes must survive lifecycle rules; documented API limits
  [LI04–LI06]. workerd is not a secure sandbox on its own [HI07].
- What moves: the recovery machinery plus a qualified storage contract, together [LI07].
- Announced direction, attributed: first-class workerd self-hosting, celld merged in [HI18, HI19].

## 11. Illustrative fixtures (always labelled)

Room "the harbour room"; message **#42 "the ferry is late"**; houses **A, B, C**; epochs **7, 8, 9**; the lease
plate's expiry at 20,000 ms; page numbers on the ribbon [FX01]. No measured latency or benchmark appears.

## 12. Do not say

- "S3 runs your code / your SQL"; "any S3-compatible store works"; "consensus is unnecessary"; "Paxos/Raft
  replaced" (S3's internal design is described by Vogels as a witness and cache coherence protocol; never call
  it Paxos).
- "acquisition price", "bought for", deal structure; motives beyond what the posts say.
- "workerd now has celld's followers"; celld's numbers on workerd or vice versa; LTX in workerd.
- "a timeout proves death"; "the lease guarantees one owner" (the lease plus fencing plus the re-read do).
- "a claimed epoch is open"; "any damaged follower blocks recovery"; "recovery always succeeds".
- "exactly-once"; "multi-object transactions"; "zero-latency writes" (local reads only); "full parity".
- "celld launched on 5 August" (unverified; month only); "we ran the tests".
