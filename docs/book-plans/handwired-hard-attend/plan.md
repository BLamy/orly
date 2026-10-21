# Plan: handwired-hard-attend

- **Title:** Hard Attend
- **Subtitle:** Score three items, pick the highest exactly, and read its value two ways that agree.
- **Animal:** meerkat (small, alert, always looking up and across)
- **Accent:** `#c58a3d` (sand); item colours from the lab: Aster `#0c7f84`, Banyan `#a15c18`, Cobalt `#7545a0` ([lab/hard-attend/hard-attend.ts:7-27])
- **Pinned source:** chenglou/handwired @ `4ea7fcb27ebe93acf49b9f29a93e162b975bad46`, lab `lab/hard-attend`
- **Throughline noun:** the query (a pin that slides along the item axis).
- **Status wording (say it plainly):** a teaching page with no tests; the indexed half of the old "hardAttend" plan is covered by index reads; the scored-selection half is open. No speed claims anywhere.
- **Corrections applied vs the earlier one-book plan** (research contradictions 1–2): scores are parabolas over the item index for a fixed query, not over the query; softmax approaches the one-hot value only away from ties and splits ties evenly at any sharpness.
- **Honest scope:** the numbers come from verbatim copies of `hard-attend.ts:46-78` run without the DOM (research probe); the page itself was not run in a browser. The lab is plain page code, not a weighted-sums-and-relu circuit; ch.1 says so.
- **Music (if asked):** one motif of three descending clacks; ch.1 sparse pulses that settle on the peak, ch.2 steady stepping, a held chord at the equal reads, ch.3 tension at the tie that never resolves to ten, ending on an open chord. Machines clack, never chime.

## Chapter 1: Closer Wins

**Thesis:** Dot a two-number key with a two-number query and "nearest" becomes "highest score".

**Blurb:** A two-number key turns "which item is nearest the query?" into "which score is highest?".

### Visual machine

**The Score Parabola.** A horizontal item axis (positions 0, 1, 2) holds three item cards: Aster 10 (teal), Banyan 20 (amber), Cobalt 30 (purple), each with a vertical score bar over it. A query marker (a meerkat-sand pin) slides along the axis under the cards. A smooth parabola `score(j) = q² − (j−q)²` is drawn over the axis and re-shapes as the pin moves; its peak always sits at the pin. At the three card positions the parabola is sampled by dots that ride the curve; the tallest dot lights its card. A small key panel on the left shows each item's key chip and the query chip being multiplied.
NOTE for the implementer: parabolas are over the ITEM axis for a FIXED query (research contradiction 1). For a fixed item, the score is a straight line in q. Do not draw three parabolas over the query axis.

Camera: drive a `cam` channel with `cameraInterp`; push in on the subject of each beat, pull back for comparisons and the payoff. Keep y ≳ 630 free.

### Beat sheet

1. Axis fades up; three cards drop onto positions 0,1,2 with their values 10, 20, 30; the query pin appears hovering between Banyan and Cobalt. *(captions 1)*
2. Caption of honesty: a small browser tag `hard-attend.html` slides in beside the stage ("plain page, not a circuit"). The pin drifts and the cards dim slightly, asking the question. *(captions 2)*
3. Key panel enters: for each card a chip `key = (2j, −j²)` fills in: Aster (0, 0), Banyan (2, −1), Cobalt (4, −4). Camera pushes in on Banyan's chip. *(captions 3)*
4. Query chip `(q, 1)` appears; it multiplies against each key chip as two small bars (2·q·j and −j²) that add into a signed score bar over the card. Formula in KaTeX: `2qj − j²`. *(captions 4)*
5. Pin snaps to q = 1. Score bars rise: Aster 0, Banyan 1, Cobalt 0. Banyan's bar is tallest, its card lights, pin sits right over it. Camera pulls back. *(captions 5)*
6. The parabola draws itself through the three bar tops and beyond, as a smooth arch; its peak is marked on the pin. KaTeX caption `q² − (j − q)²` fades in with the "peak at the query" tag. *(captions 6)*
7. Pin slides to 0 (bars 0, −1, −4: Aster lights), then up to 2 (bars 0, 3, 4: Cobalt lights). The parabola's arch glides with it, peak under the pin throughout. *(captions 7, 8)*
8. Pin eases to 1.25: Banyan 1.5 and Cobalt 1 shown as value tags on the bars; Banyan stays lit. *(captions 9)*
9. Pin lands on 0.5. Aster and Banyan bars both reach exactly 0 and both cards pulse amber together; Cobalt's bar hangs at −2. A "tie?" badge sits between the cards. Hold. *(captions 10)*
10. Stage quiets (bars and parabola fade to ≤ 0.15); the tie badge stays, pointing toward the next chapter. *(captions 11)*

### Captions (spoken verbatim)

1. Three items sit on a line: Aster is worth ten, Banyan twenty, Cobalt thirty. A query lands somewhere near them, and you want the value of the nearest one. `[lab/hard-attend/hard-attend.ts:7-27]`
2. This lab is a teaching page, plain web code rather than a numeric program. It turns that nearness question into scores, then picks exactly. `[lab/hard-attend/README.md:3]`
3. Give each item a key of two numbers: twice its position, and minus its position squared. Banyan, at position one, gets two and minus one. `[lab/hard-attend/hard-attend.ts:51; lab/hard-attend/README.md:3]`
4. The query is the pair query and one. Multiply the pairs and add, and the score is twice the query times the position, minus the position squared. `[lab/hard-attend/hard-attend.ts:47; lab/hard-attend/README.md:3]`
5. Park the query at one. Aster scores zero, Banyan scores one, Cobalt scores zero. Banyan is the tallest, and Banyan is the nearest. `[probe q=1 → scores [0,1,0]; lab/hard-attend/hard-attend.ts:47]`
6. Across the positions, that score is the query squared minus the squared distance to the query. So the scores trace a parabola that peaks at the query. `[algebra of lab/hard-attend/hard-attend.ts:47 (2qj−j² = q²−(j−q)²; checked at q=0.5 → [0,0,−2]); lab/hard-attend/README.md:3 "highest at the item nearest the query"]`
7. Slide the query down to zero. Aster takes the lead with zero, while Banyan falls to minus one and Cobalt to minus four. `[probe q=0 → [0,-1,-4]]`
8. Slide it up to two. Cobalt leads with four, Banyan has three, and Aster has zero. `[probe q=2 → [0,3,4]]`
9. In between, the curve slides smoothly. At one and a quarter, Banyan scores one and a half and Cobalt scores one, so Banyan is still nearest. `[probe q=1.25 → [0,1.5,1]]`
10. At exactly one half, Aster and Banyan are equally near, and both score zero. The scores alone cannot name a single winner there. `[probe q=0.5 → [0,0,-2]]`
11. So scoring turns nearest into highest. Next comes the harder part: choosing one winner exactly, even when two scores tie. `[lab/hard-attend/hard-attend.ts:58-71 (set-up for chapter 2)]`

### On-screen labels

`hard-attend.html`, `scoreFor(q, j) = 2·q·j − j²`, `keyFor(j) = (2j, −j²)`, query `(q, 1)`, `query-slider` range 0 to 2 step 0.01, cards `Aster 10`, `Banyan 20`, `Cobalt 30`, computed scores from the table: q=0 [0,−1,−4]; q=1 [0,1,0]; q=1.25 [0,1.5,1]; q=0.5 [0,0,−2]; q=2 [0,3,4]. Chip values: keyFor(0)=(0,0) (the code actually yields −0; show 0), keyFor(1)=(2,−1), keyFor(2)=(4,−4).

## Chapter 2: One Winner, Two Reads

**Thesis:** One winner by strict greater-than so ties go left, then two reads of its value, a one-hot sum and a direct index, that must agree.

**Blurb:** The first highest score wins, ties go left, and a one-hot sum and a direct index read return the same value.

### Visual machine

**The Challenger Belt and the Twin Reads.** The same three score bars from chapter 1 now sit on a belt. A "leader" flag (a small crown token) rides above the current leader; a challenger cursor steps rightward. A comparison gate between them shows `score > winnerScore` and lights green only for strictly greater, grey for equal. After the pick, the stage splits into two lanes that each end in a result slot: the upper lane is the one-hot sum (bits fall onto value tiles, multiply, add into an accumulator), the lower lane is the direct read (an arrow from the winner index drops straight to its value tile). Both land in a result slot that shows the same number.

Camera: drive a `cam` channel with `cameraInterp`; push in on the subject of each beat, pull back for comparisons and the payoff. Keep y ≳ 630 free.

### Beat sheet

1. Bars reappear at q = 1.5 (0, 2, 2). A question mark hangs over the belt: "which one?" Label `argmax` and `winnerIndexFor` enter in the corner. *(captions 1)*
2. Crown token sits on Aster (index 0, `winnerScore = scores[0]`). Challenger cursor steps to Banyan, then to Cobalt, each time testing the gate. *(captions 2)*
3. Gate close-up: it shows `>` ; Banyan (2) beats Aster (0): green, crown jumps to Banyan. Cobalt (2) vs Banyan (2): gate stays grey with `=` and "not strictly greater" label; crown stays. *(captions 3, 5)*
4. Rewind: pin to q = 0.5 (0, 0, −2). Banyan (0) vs Aster (0) grey; crown stays on Aster. Label "ties go left". *(captions 4)*
5. Pin returns to q = 1 (0, 1, 0). Winner Banyan; the stage splits into the upper and lower lanes. Upper lane: bit list `0 1 0` pops out beneath the cards. *(captions 6)*
6. Bits drop onto value tiles: 0×10, 1×20, 0×30; the products stream into an accumulator that reads 20. *(captions 7)*
7. Lower lane: an arrow labelled `values[1]` drops from the winner's index to Banyan's value tile, text `values[1] = 20 (Banyan)`. The label `hardAttend` tags this lane. Result slot fills with 20. *(captions 8)*
8. Both result slots shown side by side with an equal sign. Pin sweeps q across 0..2; the winner changes and both slots always change together. A small tag reads "same winner in, same value out". *(captions 9)*
9. Cost contrast: the upper lane lights all three multiplications; the lower lane lights one lookup. Tag `circuit.indexRead: 1 operation` with scope note "index inside ±2²⁴". *(captions 10)*
10. Quiet beat: lanes dim, a three-part strip (score → leftmost highest → read) holds alone with the label "exact". *(captions 11)*

### Captions (spoken verbatim)

1. Scores are not an answer yet. You need one winner, the position of the highest score, a choice called argmax, plus a tie rule decided in advance. `[lab/hard-attend/hard-attend.ts:58-71; lab/status.md:257 ("ties ... defined in advance")]`
2. The page walks the scores from left to right. It starts with the first item as the leader, then challenges that leader with each item after it. `[lab/hard-attend/hard-attend.ts:58-64]`
3. A challenger takes over only if its score is strictly greater. Equal is not enough, so the earlier item keeps the lead. `[lab/hard-attend/hard-attend.ts:65 `if (score > winnerScore) {`]`
4. At a query of one half, Banyan ties Aster at zero, fails to beat it, and Aster wins. Ties go left. `[probe q=0.5 → winner 0]`
5. At one and a half, Banyan and Cobalt both score two. Banyan holds the lead against Cobalt, so Banyan wins. `[probe q=1.5 → [0,2,2], winner 1]`
6. Now read the winner's value. The first way is a one-hot list: a one at the winner's position and zeros everywhere else. `[lab/hard-attend/hard-attend.ts:136]`
7. Multiply each bit by its item's value and add them up. With Banyan winning, zero, one, zero against ten, twenty, thirty gives twenty. `[lab/hard-attend/hard-attend.ts:141]`
8. The second way skips the sum and reads the value at the winner's position directly. The page prints Banyan's twenty, and labels this read hard attend. `[lab/hard-attend/hard-attend.ts:177; lab/hard-attend/hard-attend.html:52]`
9. The two reads agree at every query. That is by construction, since both start from the same winner, so it checks the bookkeeping rather than discovering anything. `[lab/hard-attend/hard-attend.ts:136, :177 (both derive from `winner`) — inference, worded as such]`
10. They differ in cost. The one-hot sum touches every item, while the toolkit's index read copies one entry in a single operation at any table size. `[lab/hard-attend/hard-attend.ts:141 (reduce over all items); lab/status.md:9 (indexRead "in 1 operation at any table size")]`
11. That is hard attention: score, take the leftmost highest, read the winner. It is exact, with no blending anywhere. `[lab/hard-attend/README.md:3; lab/hard-attend/hard-attend.ts:58-71]`

### On-screen labels

`winnerIndexFor`, `if (score > winnerScore)`, `scores[0]`, `argmax`, one-hot bits for q=1: `0, 1, 0`, `0 1 0 × [10, 20, 30] = 20`, `values[1] = 20 (Banyan)`, `hardAttend`, `circuit.indexRead`, tie cases: q=0.5 scores [0,0,−2] → winner 0 (Aster); q=1.5 scores [0,2,2] → winner 1 (Banyan); `onehot-formula`, `hard-formula`.

## Chapter 3: Soft Versus Exact

**Thesis:** Softmax approaches the exact read only away from ties; the lab is an untested teaching sketch and the scored-selection question is still open.

**Blurb:** Softmax only approaches the exact read, never at a tie, and the scored-selection question stays open.

### Visual machine

**The Sharpness Dial.** Three weight bars (one per item) driven by a dial labelled `sharpness` (beta) beside an exact one-hot gauge. A blend readout at right shows the softmax value, with a ghost marker for the exact one-hot value. A horizontal query track shows pin positions; selected pins (0.25, 0.75, 0.5, 1.5) light up. At the end, a status ledger (Tests / Runs in terminal / Scored selection) fills with three marks.

Camera: drive a `cam` channel with `cameraInterp`; push in on the subject of each beat, pull back for comparisons and the payoff. Keep y ≳ 630 free.

### Beat sheet

1. The three score bars from chapter 2 convert into three weight bars that sum to one; a blend readout `weights × [10, 20, 30]` enters at right. *(captions 1)*
2. A dial labelled `sharpness` enters with its range, 0.5 to 14; turning it up makes the weight bars spiky. Camera pushes on the dial. *(captions 2)*
3. Dial at 14, pin at q = 0.25: weights ≈ [0.9991, 0.0009, 0]; blend readout 10.0091 beside a ghost marker at 10. The gap is highlighted. *(captions 3)*
4. Pin at q = 0.75: weights ≈ [0.0009, 0.9991, 0]; blend 19.9909 beside a ghost marker at 20. *(captions 4)*
5. Dial sweeps from 5 to 14 at q = 0.25 and the blend creeps toward 10; then pin moves to q = 0.5: weights 0.5, 0.5, 0, blend 15. Dial runs on past 14 to 1000 and the bars do not move. Ghost marker at 10 stays out of reach. *(captions 5)*
6. Pin at q = 1.5: weights 0, 0.5, 0.5, blend 25 against the exact 20; the exact lane keeps Banyan by the left rule. *(captions 6)*
7. Side-by-side: left a soft curve that bends toward the step but never reaches it at the tie positions; right the exact step. Label "explicit tie rule". *(captions 7)*
8. Stage clears. Status ledger enters: row 1 `bun test` → "no test files", row 2 `hard-attend.ts` in a terminal → `ReferenceError: document is not defined`, with a browser tag showing the page runs only in `bun run start:hard-attend`. *(captions 8)*
9. Ledger row 3: the old `hardAttend` plan splits in two halves. Indexed half → `circuit.indexRead` (covered); scored half stays grey and unfilled. The gather-lowering note `recognized retrieval after a selection was already represented` slides in; a crossed-out label "learned query/key scoring". *(captions 9)*
10. Scored half pulses amber as open. Under it, the caution slide: "no useful gradient for exact selection → soft mixtures, check hardening separately". *(captions 10)*
11. Final recap strip (quiet backdrop): score by closeness → leftmost highest → two agreeing reads; soft approaches except at ties. A single amber question mark rests at the end, "can a circuit learn the scores?". *(captions 11)*

### Captions (spoken verbatim)

1. The page adds a third read, softmax. It turns every score into a weight, the weights add up to one, and the value is the blend of all three items. `[lab/hard-attend/hard-attend.ts:73-78, :146]`
2. A sharpness slider scales the score gaps before the exponential, from one half up to fourteen. Turning it up makes the weights spikier. `[lab/hard-attend/hard-attend.html:61 (min 0.5, max 14); lab/hard-attend/hard-attend.ts:75]`
3. At a query of one quarter and sharpness fourteen, Aster gets nearly all the weight. The blend is about ten point zero one: close to ten, never exactly ten. `[probe q=0.25 beta 14 → soft [0.9991,0.0009,0], 10.0091]`
4. At three quarters it flips toward Banyan. The blend is about nineteen point nine nine, near the exact answer of twenty but not equal to it. `[probe q=0.75 beta 14 → 19.9909]`
5. Away from ties, more sharpness pulls the blend toward the exact value. At a tie it cannot: at one half, Aster and Banyan split the weight evenly at any sharpness, giving fifteen. `[lab/hard-attend/README.md:3 ("weights move toward the one-hot bits as the sharpness slider goes up"); probe softmax([0,0,-2],1000) → [0.5,0.5,0] (research contradiction 2)]`
6. At one and a half, the same even split gives twenty-five where the exact rule gives twenty. Softmax averages ties; the exact rule picks the left. `[probe q=1.5 beta 14 → [0,0.5,0.5], 25; winner 1 → 20]`
7. That is the contrast. Softmax only approaches the exact read, and exact picking needs an explicit tie rule. `[synthesis of captions 5–6]`
8. The folder has no tests, and the page needs a browser, so it cannot run in a terminal. It is a teaching sketch. `[lab/hard-attend/README.md:7; research: `bun test` finds no test file, `bun lab/hard-attend/hard-attend.ts` → ReferenceError: document is not defined]`
9. The old plan's indexed half, reading at a chosen position, is now covered by index reads. Gather lowering found hard attention after a selection was made, but learned no scoring. `[lab/status.md:257; lab/reassessment-2026-09-03.md:121]`
10. The scored half, learning a shared scoring rule from changing data, stays open. The notes warn exact selection has no useful gradient, so training would go through soft mixtures. `[lab/status.md:257]`
11. So the journey: score by closeness, pick the leftmost highest, and read the value two agreeing ways. Whether a circuit can learn those scores is still an open question. `[synthesis; lab/status.md:257]`

### On-screen labels

`softmax`, `sharpness` (beta) range 0.5 to 14, default 5 on the page; q=0.25: weights [0.9991, 0.0009, 0], blend 10.0091; q=0.75: [0.0009, 0.9991, 0], blend 19.9909; q=0.5 beta=1000: [0.5, 0.5, 0], blend 15 vs exact 10; q=1.5 beta=14: [0, 0.5, 0.5], blend 25 vs exact 20; `The folder has no tests.`; `ReferenceError: document is not defined`; `bun run start:hard-attend`; `circuit.indexRead`; "Revisit hardAttend" (lab/status.md); status words: indexed half = covered, scored half = open. Never write "historical" as the lab's status (research contradiction 5), and do not claim any speed or time.

