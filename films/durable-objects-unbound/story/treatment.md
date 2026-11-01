# Durable Objects, Unbound — final treatment

*Winner: Treatment A, "The Tick" (story/treatments/the-tick.md), with grafts from B, "The Well That Learned to
Say No" (the bucket's dated education; the cutaway; "who referees the referee?"; the storage test as a ritual)
and C, "Two Ropes" (the two-lineage braid for 2026; the hosted Storage Relay Service as the clearly-labelled
ancestor of celld's followers; Litestream's lineage on the sources card).*

Judging (head writer, three lenses; notes kept here rather than a panel because the research was already
reviewed): **A** wins on story and teaching (a concrete stake that every mechanism must protect; failures as
plot), **B** on surprise and on answering the user's "S3 is all you need" head-on, **C** on attribution and
fairness. A alone risks thin history; B alone loses people and the deep mechanics; C alone is biography with a
technical appendix. A with B's middle and C's 2026 braid covers every must-have in the brief.

## Logline

A chat message gets its tick. The machine that gave the tick goes dark. The tick is still true. Following one
promised message through every failure that could break it, the film discovers why a storage bucket, which
cannot run a line of code, can make a Durable Object portable, and why it cannot do it alone.

## The central mystery, planted and paid

- **Planted (ch01):** the promise outlived the promiser. How? And why is the answer "a bucket"?
- **First false answer (ch02):** "because Cloudflare kept copies": true on Cloudflare's network, and exactly the
  thing you could not take home.
- **Second false answer (ch03):** "because the bucket is all you need": the bucket is a referee for one key, and
  its own referee is hidden inside it.
- **Third false answer (ch05):** "because the old machine's time ran out": a timeout proves silence, not death.
- **Payoff (ch06–ch08):** the tick is a *proof*, assembled from small checkable parts: refused stale writes,
  latest reads, a finished transaction cut from the log, the bytes in the well, and a second look at the plate
  before the bell rings; and in celld's fleet, a tail pressed into neighbours' books that the successor must seal
  and collect, completely, before it reopens the room.

## The world: the Harbour Town (visual grammar)

A paper-cut harbour town on a hill at night, shot as multiplane theatre. Everything that teaches is a physical
object with a fixed place in this town, so the viewer can always say where the authority, the bytes and the time
are.

**Geography lock (never changes):**
- **L1** the sea and a low far shore with scattered lamps (other people's machines); a moon low and left.
- **L2** the hill ridge, dim terraced roofs.
- **L3** three narrow houses on the terrace, always in this order left to right: **House A** (tall, steep gable,
  round attic window), **House B** (wider, a chimney), **House C** (upper terrace, a dormer). Each house is one
  machine running the runtime. Its window lamp is its process: lit = running, guttered = gone.
- **L4** the square, and in it, at the left third, **the Well** (the bucket). Above the wellhead, on an iron
  frame readable from every window like a town clock, **the Plate** (the ownership record).
- **L5** cobbles, a stone railing; **L6** a lamp-post crossing frame right.
- A is always screen-left of the Well; B and C screen-right. Claims race toward the Well from both sides.
- Each house has a **pulley line** to the wellhead. Bytes travel the line as rolled scrolls; the Well's rope and
  bucket lower them in.

**Teaching machines (each bound to a real quantity; style bible §6):**

| machine | what it is | binding |
|---|---|---|
| **The Room Lantern** | the harbour room (illustrative) as a paper lantern with its members' silhouettes inside; it lives in one window at a time | which house owns the room; lit = serving |
| **The Plate** | three engraved brass tiles **house · epoch · from**, and a small *opened* lamp at its crown | own.json's node, epoch, from; lamp lit only when from = epoch |
| **The Tooth** | a brass pawl and slot at the wellhead; a claim is a brass **swap card** notched with the version it read | conditional create: the slot's shutter falls after the first create. Compare and swap: the card's notch must match the Plate's current notch; *click* = accepted (the Plate's notch is re-cut), *thunk* = refused, card spat back punched |
| **The Well cutaway** | a vertical section below the wellhead: cisterns, a small lamp-keeper on a ledge ringing a bell at each change, an order ledger | S3's internal cache coherence, per-object ordering and witness (Vogels, 2021); serverCyan glints |
| **The Candle** | a tall candle on each sill with an engraved scale | lease: full height = 20 s; the painted **band** = the last 4 s (safety margin); a **notch** 8 s from the end = the last moment a renewal may start; relit by a renewal |
| **The Ribbon** | a parchment tape unspooling from the lantern's base: a leader card, then frame cards (a small tab + a page panel); a **red ink stamp** on each commit frame carrying a number | SQLite's write-ahead log: 32-byte header, 24-byte frame headers, the database size in a commit frame |
| **The Scissors** | the keeper cuts the Ribbon only just after a seal | capture of whole transactions only |
| **Scrolls and the Book** | cut ribbon rolled and tied with a cord whose knot carries a stamped tag; a bound book for a snapshot | batches (session/end), gzip CRC-32 and length; snapshot |
| **The Held Letter** | the reply to the sender waits behind a brass latch in the room's door; the house **bell** lifts it | the output gate; the acknowledgement |
| **The Neighbours** (celld only) | in celld's chapter the houses are celld nodes; two neighbouring copyists, each with a notebook and a small **book press** | followers; the press turning = fsync; the notebook's spine band = retained range (complete / incomplete / damaged) |
| **Wax seals on notebooks** | the successor stamps a seal across a neighbour's open notebook | sealing the predecessor's node-log session |
| **The Pin** | a red-tagged brass pin in each machine; the demonstrator's hand pulls it, the scene replays without that assumption, then the pin goes back | removing one assumption at a time |
| **Implementation badges** | a small brass tag hanging on every machine: `workerd · 28 Oct` / `workerd · 31 Oct` / `celld 0.6.3` / `Cloudflare, hosted` / `Amazon S3` | which implementation a mechanism belongs to; never mixed |
| **Parchment plates** | engraved inserts (paper-fold in, camera hold) for exact numbers | lease arithmetic; WAL byte layout; Plate states; celld's recovery order |

**Moods:** the town at night is `winterBlue`; inside the Room Lantern and the 2020s desks `candleAmber`; history
desks of 2020–2021 `duskRose`; the Well cutaway and code `serverCyan`; parchment inserts `parchment`; failures
`emberRed` (a lamp change, never a crossfade); celld's neighbours `labGreen` lamplight; the ending `dawnGold`.

**People** are respectful 2020s silhouettes at desks under lamps (no likeness, no caricature), each with a name
card on first appearance and only their published words, on screen and attributed. Kenton Varda's desk is always
screen-left and lamp-warm; Ryan Dahl's desk screen-right; in the 2026 braid their two lamps share one frame.
Werner Vogels appears once, beside the Well cutaway. Bert Belder appears as a name card beside Ryan Dahl's desk.

**Camera grammar:** slow trucks and dollies (≤ 6% frame width per second); push in on the Plate at every
decision; **cut on the Tooth's click or thunk**; a vertical crane down into the Well for the cutaway; whip pans
only for the claim race. One focal motion per moment.

**Transitions:** chapter changes iris on the Room Lantern (or on a desk lamp in history chapters); ink bleed for
moves between eras; paper fold into every parchment plate; lamp change into and out of failures; occluder wipes
behind the L6 lamp-post inside a chapter. Otherwise plain cuts on ideas.

**Text rule:** besides date stamps and name cards, at most two text items per shot; labels ≤ 42 characters;
quotes short and verbatim, never also spoken in full when shown in full; trade terms named once with a `term`
tag (write-ahead log, compare and swap, epoch, lease, fencing, fsync, output gate). **Bottom 12% of the frame
(y > 634 of 720) stays clear of text and key action** for captions. No code identifiers in speech; exact
identifiers appear, if at all, on a parchment plate, expanded aloud.

**Sound intent (for the score stage):** sparse. A small two-note *tick* motif (the stamp). The Tooth: one dry
*click* for yes, one muffled *thunk* for no. The house bell. Candle hiss under lease scenes. Silence for
failures. A harbour drone under the town.

## Voice of the narrator

A measured, mid-life documentary narrator (forties or fifties, never elderly), warm, exact and quietly dry; a
teacher who enjoys a good failure. Short sentences for the ear. Numbers spoken plainly. Trade terms spelled out
(ess three, write-ahead log, compare and swap, fencing). He never says "simply".

Sample lines:
1. "The machine that made that promise is gone. The promise is still true."
2. "An overwrite can win the well. It cannot take back what was already served."
3. "The well learned to say no. It took four years, and three different kinds of no."
4. "Who referees the referee? Something deep inside the well, that was proved before it was trusted."
5. "A timeout proves silence. It does not prove death."
6. "Before it rings the bell, the keeper looks up at the plate one more time."
7. "Claimed is not opened. The difference decides which past the room comes back with."
8. "Pull the pin, and watch."
9. "The room would rather stay shut than come back missing a promise."
10. "A tick is not a feeling. It is a proof."

## Chapters (planned: 24 min, ~3,000 words, 41 shots; as written: 42 shots, ~3,280 words, ~27 min estimated — see story/status.json)

| ch | title | min | words | shots | what it teaches |
|---|---|---|---|---|---|
| 1 | The Tick | 2.0 | 230 | 4 | the mystery; the three promises; the town |
| 2 | One Room in the Whole World | 3.0 | 370 | 5 | 2020 identity & chat room; 2021 output gate; 2022 open runtime but single instance; 2024 SQLite and the hosted Storage Relay Service |
| 3 | The Well That Learned to Say No | 3.4 | 430 | 6 | strong reads (2020); the naive race (pin); conditional create (Aug 2024); compare and swap (Nov 2024); who referees the referee; "compatible" is not enough; one key only |
| 4 | Two Lineages, One Commit | 2.5 | 320 | 4 | celld (Aug 2026), Ryan Dahl; Kenton Varda's gap; 9 Oct 2026 team joins, announced plans, no terms stated; the 28 Oct commit, experimental, no alarms; alarms and facets by 31 Oct |
| 5 | The Plate and the Candle | 3.5 | 450 | 6 | owner record; leases & arithmetic; the R2 scar; pull the self-fence pin; borrowed clocks (celld differs); claimed vs opened |
| 6 | The Ribbon | 3.4 | 440 | 5 | WAL format and commit marker; capture; batches, snapshots, checksums (workerd vs celld formats); proof before response; pull the re-read pin; lost ack ≠ absent write |
| 7 | The Neighbours | 3.8 | 500 | 7 | restore & gaps; the price of the well; celld fleet followers & fsync; the tail outside the well; node-log record; seal-collect-upload-restore; complete-tail proof and when recovery blocks |
| 8 | What Travels | 2.4 | 260 | 4 | the assembled contract; operator duties; dated limits; announced direction; the tick as a proof |

## How each deep dive teaches (step by step, with the pin)

1. **Bucket as referee (ch03).** Two keepers at the Well, one swap card each. Pin out (no condition): both write,
   both serve, the second plate wins the Well, the first keeper already served. Pin in: the slot's shutter
   falls after one create; the other card is refused. Then compare and swap: both cards notched with the same
   old version; one *click*, the Plate's notch re-cut; the other *thunk*. Crane down: the witness. Up again: a
   bucket that only *looks* the same accepts both cards (celld's warning); every node runs four writes before it
   serves.
2. **Ownership and leases (ch05).** The Plate's three tiles. The Candle and its band on a parchment ruler:
   20,000 ms, 4,000 ms band, 16,000 and 12,000 ms lines. Pin out (no self-fence): A's keeper falls asleep, the
   candle passes the band, B takes the Plate, A wakes and serves on: two rooms. Pin in: A, checking before it
   renews, finds it cannot hold four seconds ahead and closes its own shutters; the lamp goes out (the process
   exits). Claimed vs opened: the Plate tiles step through A·7·7 → B·8·7 (crown unlit) → B dies → C·9·7 → C
   recovers 7. Rewind; had B opened: B·8·8, crown lit → C·9·8.
3. **The write-ahead log (ch06).** The Ribbon on a parchment plate: leader (32 bytes), tabs (24 bytes), pages, a
   stamp with a number (wax seals are reserved for celld's sealing). The Scissors cut only after stamps; an abandoned transaction is pasted over. Scrolls tied
   with checksummed cords; a Book at each epoch's start.
4. **Proof before response (ch06).** The Held Letter: capture → scroll down the Well → the keeper's lamp lifts to
   the Plate → still A·7 → bell → latch lifts → tick. Pin out (no second look): A wakes after B claimed, its
   scroll lands in session 7, it rings anyway: a tick for a write B will never restore. Pin in: the Plate says 8,
   no bell, the letter becomes an error. Coda: a lost reply proves nothing either way.
5. **Restore and the neighbours (ch07).** C reads the Book, then scrolls in order; a missing scroll stops it cold.
   Then celld's town (badge): the bell can ring as soon as the neighbours' presses turn. The tail now lives
   outside the Well. Pin out (no seal): the old owner's scrolls are fenced from the Well by their epoch, but the
   neighbours' pages are never collected and #42 is gone, or a stale owner gets another bell. Pin in: the
   successor reads the old owner's log record, seals both notebooks, collects, uploads, marks it sealed, then
   opens. Last, the hard case: one damaged notebook while the other is complete → proceed. One incomplete and
   one damaged → no complete proof → the door stays shut.

## Recurring devices and motifs

The tick (ch01, ch02-s03, ch06-s04, ch07-s07, ch08-s04) · the Plate (from ch01-s03 to the end) · the Tooth's
click and thunk (ch03, ch05, ch07) · the Candle (ch05, a quick callback in ch08) · the Ribbon (ch02-s05
foreshadow, ch06, ch07) · the Pin (ch03-s02, ch05-s04, ch06-s05, ch07-s04, ch08-s01 montage) · badges on every
mechanism · the two desk lamps (ch02, ch04).

## Staging and build list

See `story/meta.json` `staging` (geography lock, hands, text rule, transitions, accent budget) and
`staging.buildList` (shared set and machine modules for film-shots to build and contact-sheet before any shot).
