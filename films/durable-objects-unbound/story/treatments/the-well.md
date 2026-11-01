# Treatment B — "The Well That Learned to Say No" (a biography of the bucket)

**Logline.** For most of its life the object store could only keep things, and sometimes handed back yesterday's
copy. Between December 2020 and November 2024 it learned to tell the truth on every read, to refuse a second
creation and to refuse a stale replacement. In October 2026 that small new vocabulary of "no" was enough to let a
fleet of ordinary machines share a Durable Object without running a consensus service of their own.

**Spine.** The bucket is the protagonist. Act one: the forgetful well (eventual consistency, explained by Werner
Vogels as writes and reads on different cache paths); act two: the well learns (strong reads, 2020; conditional
create, August 2024; compare and swap, November 2024), and inside it a witness and proofs that cost more than the
code; act three: the well becomes a referee for Durable Objects (celld; the workerd commit), and the film asks
what the referee cannot do: run code, make two rooms atomic, keep working when it is down.

**Strengths.** A clean, surprising timeline (the bucket's consistency arrived two months after Durable Objects;
its refusals arrived four years later). Directly answers "S3 is all you need" with "all you need, plus what it
hides, plus a supervisor and a protocol".

**Weaknesses.** People and the Durable Objects lineage become background; the WAL, fencing and the follower
tail risk becoming an appendix; little emotional stake.

**Graft value.** The well's three-step education as a dated sequence; the cutaway into the well; "who referees
the referee?"; the storage test as a ritual every node performs before it serves.
