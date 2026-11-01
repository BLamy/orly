# Story review, round 1: "Durable Objects, Unbound"

> **Quotation note (2026-11-01, excerpt selection version 2).** This historical review predates the film's
> quotation budget. Quote IDs below refer to the ledger as it stood then; Q07, Q08, Q09, Q11, Q13, Q15, Q20, Q21,
> Q22, Q23 and Q26 are retired (their cards became attributed own-word labels; see `research/quote-budget.md`).
> Retired source wording is described rather than reproduced; scores and outcomes are unchanged.

Reviewer: Claude Opus 5.5 (claude-opus-5-5), independent story-stage reviewer, high effort. Read only.
Checked against: brief.md; research/bible.md, claims.json, quotes.json; story/treatment.md, meta.json, script.md, script.json.
Code consulted to settle doubts: workerd `aa494794c` (`cluster/logic/lease.rs`, `ownership.rs`, `owner.rs`, `log.rs`), `git log aa494794c..ad78a8fe7` (alarms #8090 on 30 Oct, facets #8113 on 31 Oct), celld 0.6.3 `docs/guarantees.md`.

## Scores

| lens | score | one-line reason |
|---|---|---|
| accuracy | **7** | Nearly every number and date is right (the lease arithmetic, WAL layout, SRS 5/3, S3 dates, commit timing, plans told as plans, no terms). There are four mechanism mis-scopes (celld's record read, celld's epoch-prefix fence, the false-tick counterfactual, the R2 stall staging) and two attribution or dating slips. |
| depth | **8** | Every deep dive in the brief is here and taught by mechanism: claimed vs opened, the lease band and notch, the commit marker, the re-read, fleet sealing, and the complete-tail rule with both cases. |
| clarity | **7** | Several key terms are never spoken before they are used ("Tooth", "output gate"). "Seal" means two different things. "From" used as a noun trips the ear. One line depends on reading a card ("five words"). |
| story | **7** | The cold open lands the mystery inside 60 s and ch08-s04 pays it off cleanly. The seams across the eight hands show: the epoch fixtures break in ch07-s01, #42 lives in two implementations without an aloud handover, and ch04 and ch08 repeat the plan and the Q11 card. |
| curiosity | **8** | The pin device, "who referees the referee?" and claimed vs opened are real hooks. Planting B's failed claim in ch01 would make the middle chapters solve the opening night (Issue 1). |
| visual | **7** | The geography lock and staging are strong, the machines are drawable, and the pin and badge grammar works. A few machines are bound to the wrong quantity (the 4 s bracket "outlasting" a 5.5 s stall, unbound commit-seal numbers). Three shots break the two-item text rule. One quote sits near the caption band. |
| voice | **7** | The narrator voice is consistent, dry and exact, and the maxims are good. A handful of lines are tangled or lean on the screen (L0321, L0402, L0805, L0619). Directions and music cues still quote words that the lines no longer contain. |

Runtime note: at 140 wpm plus lead-ins, holds and pauses, script.json estimates **26.2 min** (ch05 4.4 min vs 3.5 planned; 541 words vs 450). That is inside the 28-minute ceiling but 2 minutes over target. The fixes below that add words come with suggested trims.

---

## CRITICAL (must fix)

**C1. ch05-s05 · L0525–L0526: celld's record read is mis-scoped, and the line implies workerd lacks one.**
celld's guarantees say: "After a bucket proof, celld reads the ownership record once … A fleet proof needs no such read." So in celld's default (fleet) mode, acknowledgements do **not** read the record. As written, "before acknowledging a write it reads the record, not a clock" is false for the default path. Coming straight after "An assumption cannot be the last line of defence", it also implies that workerd's last line is the clock. workerd re-reads own.json after every upload (owner.rs `push`, DU02), and ch06 teaches exactly that.
Replace L0525–L0526 with:
> **L0525** "So the clock is not the last line of defence. A second look at the Plate is, and we will meet it soon."
> **L0526** "celld, a different implementation, uses ten-second leases, and when the Well proves a write it does the same: it reads the record, not a clock."

Staging ch05-s05 'record': caption the keeper's upward look as following a scroll landing in the Well (the bucket proof), not as a bell from the neighbours.

**C2. ch07-s04 · L0722 and its staging: "a stale owner writes where the restore never looks" is false.**
celld guarantees, Epoch GC: "A fenced node can append an unacknowledged tail to an older prefix. After a snapshot successor, a later restore can expose that tail; this does not violate the contract." The prefix guarantees that a stale owner can write only into a **superseded** prefix, never the successor's, and that a restore selects the current lineage (OW11). It does not guarantee that the restore never reads the old shelf.
Replace L0722 with:
> "In celld's Well, each epoch writes under its own shelf, so a stale owner can only add to an old shelf, never to the new owner's."

Staging: the ghost of A's keeper sets a late scroll at the end of shelf 7, and shelf 8 (the successor's) stays untouched. Cut "the restoring keeper's lamp passes over it to shelf 8". L0723 can stay as written.

**C3. ch06-s05 · L0621: the false-tick counterfactual needs a paused process, not a stalled upload.**
If only A's upload stalls, A's renewal loop keeps renewing, so B cannot claim (acquire_or_route routes to a live owner). If A is cut off from the bucket, its renewals fail and it fences (the process exits, lease.rs `renewed`) before B may take over. The re-read is the only defence when the **whole process freezes** between upload and acknowledgement and wakes after B's claim. The staging already freezes the keeper; the line has to say so.
Replace with:
> "A sends its scroll with its lease in order, then the whole house freezes, like the sleeper. B claims epoch eight, and A's scroll lands on epoch seven's shelf."

Staging: while A's keeper is frozen, show A's candle burning past the band before B's card clicks, so B's claim is legitimate.

**C4. ch05-s03 staging (beat 'retry'): a 4 s bracket cannot "hold through" a 5.5 s gust.**
The comment in lease.rs: "Renewals every 3 s, each bounded at 4 s, a failed one retried every second … R2 stalls writes ~5.5 s at every 5-minute mark; a 2 s bound cancelled them and fenced every node." The first 4 s attempt is still cut by a 5.5 s stall. What rides it out is retrying within the lease (LE05).
Restage 'retry' as follows. The 4 s bracket runs out mid-gust, a 1 s retry hook follows, and a retry lands just after the gust, before the 12,000 ms notch, relighting the candle. The terrace lamps stay lit. L0515 can stay, and now matches the picture.

**C5. ch02-s04 · L0216, and ch01-s03 · L0113: what workerd lacked, and who said so.**
(a) "The room could not [leave]" overstates the gap. workerd ran Durable Objects on your own machine, as **a single instance** (HI12: "good enough for local testing but unable to scale"). What could not happen was a room surviving the loss of its machine or moving between machines.
(b) "a Cloudflare post would say" blurs the attribution. Q07 is from **Ryan Dahl's** section of the joint post.
Replace L0216 with:
> "Now the runtime could leave Cloudflare, and a room could come too, but only as a single instance on one machine. In 2026 Ryan Dahl would call it exactly that: limited to a single instance."

Replace L0113 with:
> "And a newer one, still being built: the room can move between machines you run."

Staging ch02-s04 'not': the tethered lantern does reach the far hill, but alone. One lantern on one house, its thread tied there, with no second house able to take it.

**C6. ch04-s01 · L0401–L0402: the date stamp "August 2026" sits on "started celld".**
The sources date celld's **release** to August 2026 (Kenton Varda, Q10, HI14), not its start. As staged, the shot dates the start. The line also relies on the viewer reading the Q08 card ("said so in five words"), so an audio-only listener never hears the five words.
Replace with:
> **L0401** "August, 2026. A second desk, a second lamp: the Deno team releases celld."
> **L0402** "Ryan Dahl, of Deno, had started it, and he later told us why."

Keep the Q08 card on 'why' and move the quote1 beat to 'why'. L0409 still carries Kenton's "released … in August".

**C7. ch06-s04 · L0619: "Finishing inside the room is not the tick. The bucket is."**
This contradicts the lesson taught three lines earlier. In workerd the acknowledgement is the upload **plus** the re-read (DU01, DU04). The abrupt jump to "celld's gate" also has no setup.
Replace with:
> "Finishing inside the room is not the tick. The Well and the second look are. celld's gate holds even more: errors, and every chunk of a stream."

**C8. ch08-s04 staging: the dawn badge reads 'workerd · 31 Oct' on the proof of the 28 Oct night.**
The tick being proved happened under the ch01-s02 badge 'workerd · 28 Oct'. The brief requires that the pins are never mixed.
Fix: show 'workerd · 28 Oct' on the wellhead at dawn, or no badge at all.

---

## ISSUES

### Story and continuity

1. **ch07-s01 visual (Plate "C · 8 · from 7"), ch05-s06 L0531, ch01-s02.** The fixtures break. Across ch05-s04, ch05-s06 and ch06-s05, epoch 8 is always B's and 9 is C's. Then ch07-s01 retells "the night A went dark" with C at epoch 8. It is not spoken, but it is on screen in a push-in.
   Recommended fix, which also strengthens the mystery: plant and pay off B's failed claim.
   - ch01-s02: in the hold after L0105, House B's window flickers on and gutters out (silent, about 1 s, no words). This is the clue.
   - L0531: replace "Suppose B dies first." with "That flicker in House B, the night A went dark? B died first." Keep the rest of the line: "C claims: C, nine, from seven, and recovers seven, because eight never opened and acknowledged nothing." (+6 words.)
   - ch07-s01: the Plate reads **C · 9 · from 7**, crown unlit, and on 'open' the from tile turns to **9**.
   - L0701: "Back to workerd's town, the night A went dark. House C holds the Plate: nine, from seven."

   The ch08-s04 ghost tiles A · 7 · from 7 stay correct.
2. **ch07-s04 · L0720.** #42 moves from workerd's world (ch07-s01, "Message forty-two is back") to celld's world without an aloud handover, then is "gone" and recovered again. A listener will think the same restore failed. Replace with:
   > "Same night, celld's town: the owner dies while forty-two lives only in the neighbours' notebooks."
3. **ch04-s03 · L0416 and Q11 card; ch08-s03 · L0812–L0813 and Q11 card.** The same plan is said twice, nearly verbatim, and the same Q11 card is shown twice. Keep it in ch04 and make ch08 the callback. Replace L0812 with:
   > "The two lamps, once more. The announced plan stands, and the commit called itself its beginning."

   Keep L0813. In ch08-s03 drop the Q11 card; leave the shot without a quote, or reuse the Q14 headline from ch04-s04 as a faint strip on the braid.
4. **ch04-s03 · L0415.** The user asked about "the Cloudflare acquisition", and the film never names the frame. HI17 allows one honest clause. Replace with:
   > "Cloudflare filed its post under acquisitions, yet neither post states a price or any terms. We will not guess at them."

   No price, terms or motive.
5. **ch08-s01 · L0802.** The tense breaks ("Pull any one, and a promise broke."). Use "Pull any one, and a promise breaks."
6. **ch08-s01 · L0804.** The contract list omits the lease and the clock bound, which is one of the four pins just shown. Replace with:
   > "It is the bucket's refusals on one key, and its fresh reads; leases, with clocks kept close; and, as celld asks, a supervisor to restart a house that fenced itself."
7. **ch08-s01 · L0805.** This line fuses workerd's re-read and celld's sealing into "a runtime". Replace with:
   > "And a runtime that cuts the ribbon, uploads and looks again; in celld's fleet, one that also seals and collects before it replays."
8. **ch05 length.** Running 541 words, about 4.4 min. Trim about 50 words:
   - L0505: merge into L0504's end, as "…or, if that house is alive, the request goes there instead".
   - L0512: cut it, since L0510 already says the timing is not a timer promise. Or keep it and cut the "One last thing." opener of L0527.
   - L0516: shorten to "A's keeper falls asleep: a paused process."
   - L0523: "Safety comes from A stopping itself, and from a second look at the Plate." (shorter, and it no longer misplaces the second look "on the ribbon").

### Mechanism precision (beyond the criticals)

9. **ch05-s01 · L0504.** "If the Plate is empty … the claim writes the next epoch" is not what happens to a brand-new room. ownership.rs: "A claim of an object with no record writes nothing: `open` creates the record, open, in one conditional write" (OW05). Replace with:
   > "To claim, a keeper offers the version it read. If the Plate names a house whose lease has run out, the claim writes the next epoch, and only one claimant wins. A brand-new room is born already open."

   Compensate with the cuts in Issue 8. Also fix the line direction: it says "'exactly one' landed", which matches no word in the line.
10. **ch07-s03 · L0715.** "the bell rings, before the page reaches the Well" overstates the order. celld *can* acknowledge before the upload completes (CE01). Replace with "When every neighbour in the proof has pressed, the bell can ring before the page reaches the Well. The upload follows."
11. **ch07-s07 · L0735.** "it keeps retrying" implies retrying forever. Waiting requests fail after 240 attempts by default (CE11). Replace with:
    > "Houses that restart together still lend each other their notebooks. Recovery can take minutes; a waiting request gives up only after two hundred and forty tries."
12. **ch07-s04 · L0725.** "Before its first such tick" has a weak antecedent. Replace with "Pin back. Before its first tick from the neighbours, each celld session creates its own log record in the Well."
13. **ch08-s03 · L0814.** "It will never run your code" is a prophecy about a product. The bible's point is the role. Replace "It will never run your code, …" with "It does not run your code, make two rooms commit as one, promise exactly once, or keep the town open when it goes quiet."
14. **ch02-s03 · L0210.** "His next post" claims an ordering the sources do not establish. Use "A later post of his is called Easy, Fast, Correct: Choose three."

### Ear pass (terms before use, antecedents, hard-to-say lines)

15. **"Tooth" is first spoken at L0801**, in the montage. A listener has never heard the word. Name it in ch03-s02, L0307:
    > "Fresh reads are not enough. Pull the pin from the Well's brass tooth, and the Well checks nothing."
16. **"Output gate" is never spoken**, though its term tag paints in ch02-s03 and L0619 says "celld's gate". Replace L0211 with:
    > "It puts a gate on the room's door, an output gate. While a write is unfinished, the reply to our sender waits behind a latch."
17. **"Seal" means two different things.** It is the WAL commit mark (L0605, L0606, L0608) and also celld's sealing of followers (L0728, L0729). L0801's "the seal" is then ambiguous. Keep "seal" for celld only and rename the commit mark a **stamp**:
    - L0605: "We draw it as a red stamp. That number is the commit mark."
    - L0606: "…holds the frames since the last stamp, and cuts only when a stamped frame is complete."
    - L0608: "…leaves frames with no stamp…"
    - ch06-s02 label: "cut only after a stamp".
    - Art: walRibbon's commit mark becomes a red ink stamp, not wax.
    - L0801: "…the second look, the neighbours' seal."
18. **"From" as a bare noun reads as a preposition aloud.** Make it a tile:
    - L0502: "The epoch is a count that goes up with every new claim. The from tile names the last epoch that actually opened."
    - L0529: "The from tile stays at seven, and the crown is dark."
    - L0530: "…the opening write that sets the from tile to eight."
19. **L0321 is tangled** ("a witness … that a cache can ask whether its copy is stale"). Replace with:
    > "Caches that agree with one another, an order for every object's changes, and a witness, told of every change, that any cache can ask: is my copy stale?"
20. **ch02-s05 · L0221.** "Write-ahead log" is spoken in ch02 but defined only in ch06. Add a short gloss: "It watches SQLite's write-ahead log, where each change is written first, and ships the changes…" (+6 words; take them back from L0222's "tens or hundreds of milliseconds", which can go to the screen).
21. **"Keeper" is never mapped to "the runtime".** One gloss at L0106 is enough: "Up the hill, House C lights. Its keeper, the runtime, draws a bundle from the well, and the room relights in a new window."

### Directions, cues and beat hygiene (shot authors read these)

22. **Stale words in directions and music cues.**
    - L0504's direction quotes "exactly one", which is not in the line.
    - L0719's direction and the ch07-s03b music cue cite "exactly two places", which is not in the line.
    - The ch03-s05 music cue says "quietly ignore it"; the line says "silently ignore it".

    Sync each to the current text.
23. **script.md visual prose names beat words that differ from script.json.**
    - ch04-s01 says 'lineage'; the json says 'descends'.
    - ch05-s01 says 'exactly'; the json says 'most'.
    - ch05-s03 says 'tried'; the json says 'retried'.
    - ch06-s03 says 'line'; the json says 'down'.

    The json is correct. Regenerate script.md so authors are not misled.

### Art direction

24. **ch05-s06 text load is 3 items:** the engraved "illustrative numbers" note plus two labels. The narration already says "Made-up numbers", so drop the engraved note. Alternatively merge the labels into one: "claimed ≠ opened · C recovers the last opened".
25. **ch05-s02 text load is 3 items:** the equation, the "lease" term tag, and the ruled-line label "serve only above this line". Drop the ruled-line label; the equation and the ruled line carry it. If the term tag must stay, move it to the end of ch05-s01's hold.
26. **ch06-s01.**
    - The label "header 32 B · frame = 24 B tab + 1 page" duplicates the in-diagram "32 bytes" and "24" marks, which makes 3 or more text items. Keep the in-diagram numbers and drop the label.
    - Bind the seal (stamp) numbers to a real quantity. Draw the ledger with 6 pages. Transaction 1 rewrites pages, so its commit stamp reads **6**. Frame 5 adds a new page, so its stamp reads **7**. The other tabs show 0. The ledger then visibly gains a page.
27. **ch07-s05.** Q21 (about 120 characters) is set "at the lower-middle, above y 634", competing with the pictograms and hugging the caption band. Move it to the upper right and trim it to a short verbatim fragment (its closing clause, about a stale owner and further fleet proofs).
28. **ch07-s03 to ch07-s07: who is the successor?** C's upper window is copyist-2 (a follower), the successor's keeper "stands on the square", and the lantern relights in House C. State in the staging that the successor **is House C's node**, its own notebook being one of the two that recovery reads. Then case one/case two and "Seal every neighbour it can reach" read consistently. The keeper should stand at C's door, not in the open square.
29. **ch01-s01 and ch08-s04: where is the sender?** ch01-s01 places "the sender at a harbour-side seat" ambiguously inside the lantern beat; ch08-s04 puts the sender at a harbour-side window, L4 right of the Well. Lock the sender at that L4 window in both shots, with a matching member silhouette inside the lantern, so the slip's flight from window to lantern door is legible.
30. **ch03-s04.** The "crane back UP the shaft fast (2.5 s)" breaks the camera grammar (≤ 6% width/s; whip moves only for the claim race). Make it a 4 s crane, or a cut on the witness's bell to the square.
31. **ch05-s04 'renew' vignette.** Bind it to the ruler: the keeper whose renewals keep failing closes its shutters exactly as the flame reaches the **12,000 ms notch** (lease.rs `renewed`: fence when the lease would not hold 4 s on), visibly four seconds above the band. Only after the flame passes the expiry does B's card click.
32. **ch02-s04 'tether'.** To match C5, the lantern should reach the far hill on its own single house, tethered there, rather than being held on the desk. The runtime and a single room can both leave; what cannot leave is the room's survival across houses.

---

## Confirmed correct (no change)

- Lease constants and arithmetic: 20,000 / 3,000 / 4,000 / 1,000 / 2,000 / 4,000 ms; serve below 16,000; start a renewal below 12,000; fence means the process exits; skew defaults to zero. All checked against lease.rs.
- Claimed vs opened: A·7·7 → B·8·7 → C·9·7 recovers 7; had B opened, B·8·8 → C·9·8 recovers 8. Checked against `OwnerRecord::successor`.
- Ordering: restore, upload snapshot, then the guarded open ("superseded before it opened").
- WAL facts: 32-byte header, 24-byte frame header, commit frame records the db size in pages, zero otherwise.
- Capture and storage: capture cuts at commits; rollback frames are overwritten; offset 0 means a checkpoint. Batches are merged to the newest page versions, and gzip's CRC-32 and length are checked. Snapshots are taken when the log reaches the db size, and the replacement is uploaded before deletion.
- Commit path: upload, then `current_epoch` re-read, then acknowledge, with grouped commits. Superseded leftovers are deleted by the next epoch.
- Commit message: Q14, Q15 and Q16 verbatim. 20:11 −07:00 on 28 Oct. Alarms 30 Oct, facets 31 Oct, both by Ryan Dahl.
- History: the S3 dates (1 Dec 2020, 20 Aug 2024, 25 Nov 2024) and the Vogels witness and proofs. SRS: ≤10 s / 16 MB, five followers, three to confirm.
- celld fleet: the owner never counts itself; one follower is enough; up to two followers; two copies with one follower; the node-log record comes before the first fleet acknowledgement.
- celld recovery: absent / sealed / open → CAS, seal, collect, upload, mark sealed, then restore. At least one current follower must certify a complete range. Damaged + complete proceeds; incomplete + damaged blocks. An HTTP error does not prove absence.
- Limits and history framing: announced plans are told as plans, with no price or terms. Tests are "read, not run". No exactly-once claims, and no measured latency (the ch07-s02 bar is labelled illustrative).
- Attribution: Q09 to Ryan Dahl; Q10 and Q26 to Kenton Varda; Q11 to Kenton Varda, matching quotes.json.
