# Review: captions of handwired-event-window

Fact-check of all 37 captions in `book.json` against the pinned clone, `chenglou/handwired @ 4ea7fcb27ebe93acf49b9f29a93e162b975bad46` (`.orly-work/hw-books/repo`, read only; HEAD confirmed, clean).

**Result:** 31 OK, 6 FIX. Each FIX is edited in place in `book.json` and mirrored in `plan.md`. Nothing else was edited.

**Re-run at the pin:**
- `bun lab/event-window/measure-cost.ts`: K=1..16 ops 480, 516, 588, 732, 1020; depth 52 at every K; soft training circuit 474 ops, 0 boolean.
- `bun lab/event-window/training-sweep.ts`: recovered 20/20; learned title 29.390 to 29.821; learned slop 4.174 to 4.842; 0/30000 for seed 1. The sweep's own rows differ from the README's table in the third decimal (README:87, 88, 90, 91). The captions use the sweep's output.
- `bun test ./lab/event-window`: 38 pass, 0 fail.
- Scratch fixed-ramp check (`/tmp/ew-check/check-fixed-ramp.ts`, read-only imports): loss grid 0.002749 / 0.002679 / 0.002629 / 0.002599 / 0.002590 / 0.002598 / 0.002621; drift to title 30.0138, slop 3.9671; 9120/10000 divergent; first at frame 135; slop stall at 12.857.

| chapter | # | verdict | old → new | source path:line | verbatim quote |
| --- | --- | --- | --- | --- | --- |
| 1 Latches, Not History | 1 | OK | | README.md:11 | can be expressed and trained as a pure feedforward function of (current input, a small bank of latched events) |
| 1 Latches, Not History | 2 | OK | | oracle.ts:7; trace.ts:37-38 | A frame carries at most one pointer event (down, move, or up) or none. |
| 1 Latches, Not History | 3 | OK | | harness.ts:1-3; oracle.ts:1-4 | compared for exact FP32 equality |
| 1 Latches, Not History | 4 | OK | | circuit.ts:266-284; oracle.ts:151 | const latchOnDown = (kept: Wire, fresh: Wire) => emitSelect(circuit, down, kept, fresh) |
| 1 Latches, Not History | 5 | OK | | oracle.ts:164-170; circuit.ts:288-294 | if (distance > config.slop) state.slopExceeded = true |
| 1 Latches, Not History | 6 | OK | | oracle.ts:251-265; boundary-probe.test.ts:85 | state.grabLeft + state.pointerX - state.pressX, |
| 1 Latches, Not History | 7 | OK | | oracle.ts:174-178 | state.rectangleLeft[owner] = dragged.left |
| 1 Latches, Not History | 8 | OK | | circuit.ts:390-398; oracle.ts:152-154 | // 9. Focus follows pointer-down: the hit rectangle, or nothing on empty space. |
| 1 Latches, Not History | 9 | OK | | circuit.ts:368-372; trace.ts:23-28 | const flipDirection = circuit.affine([[unit, 1], [maximized, -2]]) |
| 1 Latches, Not History | 10 | OK | | pointer-input.ts:9; circuit.ts:295-302 | Returning to the press point must not erase an earlier drag-threshold crossing. |
| 1 Latches, Not History | 11 | OK | | boundary-probe.test.ts:69, 81 | for (const suffixLength of [1, 4, 16, 64, 256]) { |
| 1 Latches, Not History | 12 | OK | | boundary-probe.test.ts:85-86 | expect(draggedLeft).toBe(rectangle.initialLeft + 60) |
| 2 A Ramp That Narrows | 1 | FIX | "Every yes-or-no in this circuit is one shape: a ramp." → "The title test and the slop test share one shape: a ramp." | circuit.ts:159-164; hit test circuit.ts:198-203 | // bit = 1 while difference >= 0, where difference is an affine form. |
| 2 A Ramp That Narrows | 2 | OK | | circuit.ts:259-263, 599-608; oracle.ts:151 | titleBoundary: config.titleHeight - 0.5, |
| 2 A Ramp That Narrows | 3 | OK | | circuit.ts:152; training.test.ts:44 | const bit = (score: Wire) => (mode === 'exact' ? circuit.boolean(score) : score) |
| 2 A Ramp That Narrows | 4 | OK | | circuit.ts:590-597; train.ts:131-138 | export const behaviorParameterCells = [ |
| 2 A Ramp That Narrows | 5 | OK | | train.ts:56; train.ts:80 | export const supervisedBitCount = supervisedCells.length + rectangleCount |
| 2 A Ramp That Narrows | 6 | FIX | "so a far-off boundary still feels a pull from every press." → "so frames within sixteen pixels of a far boundary still pull on it." | train.ts:142-144; circuit.ts:556-562 | lets a boundary that starts far away see gradient from many examples |
| 2 A Ramp That Narrows | 7 | FIX | "Then the ramp narrows in four snaps: thirty-two pixels, four, one, and a quarter pixel." → "Then the ramp narrows in three snaps: to four pixels, then one, then a quarter pixel."; "at every snap" → "at each snap" | train.ts:152-157; train.ts:202-207 | {untilProgress: 0.85, sharpness: 1, learningRateScale: 0.3}, |
| 2 A Ramp That Narrows | 8 | OK | | README.md:77 (sweep run: training-sweep.ts:31-50) | 1 \| 12.86 \| 85.95 \| 4.500 \| 29.702 |
| 2 A Ramp That Narrows | 9 | OK | | train.ts:263-274; training-sweep.ts:23, 36 | Hardening: relation cells round to exact bits; the two thresholds stay as |
| 2 A Ramp That Narrows | 10 | OK | | training-sweep.ts:52 (sweep run) | recovered ${recoveredCount}/20 seeds |
| 2 A Ramp That Narrows | 11 | OK | | README.md:69; train.ts:105-109; training.test.ts:100-108 | starting FROM THE AUTHORED TRUTH drifts the title boundary to ≈30.01 |
| 2 A Ramp That Narrows | 12 | OK | | training.test.ts:93; train.ts:315-340 | const grid = [29, 29.25, 29.5, 29.75, 30, 30.25, 30.5] |
| 2 A Ramp That Narrows | 13 | OK | | README.md:69; training.test.ts:109-110 | diverges from the oracle 9,120 times over a 10,000-frame held-out trace |
| 3 Exact, Within Limits | 1 | OK | | README.md:46; harness.ts:112 | its own outputs latch its next event window; the oracle runs in parallel purely as a judge |
| 3 Exact, Within Limits | 2 | OK | | exactness.test.ts:13-14; README.md:40 | for (let seed = 1; seed <= 12; seed++) { |
| 3 Exact, Within Limits | 3 | OK | | exactness.test.ts:50-73; boundary-probe.test.ts:106, 119 | expect(state.rectangleLeft[0]).toBe(rectangle.initialLeft + dragCount / 2) |
| 3 Exact, Within Limits | 4 | OK | | training.test.ts:76; training-sweep.ts:23 | expect(recovered).toBeGreaterThanOrEqual(5) |
| 3 Exact, Within Limits | 5 | OK | | window-depth.test.ts:106; measure-cost.ts (live run) | expect(k4.operations).toBe(k2.operations + 2 * perRecordOperations) |
| 3 Exact, Within Limits | 6 | OK | | README.md:31 (and :116) | The circuit (`circuit.ts`, 502 ops, depth 38, 6 boolean atoms) |
| 3 Exact, Within Limits | 7 | FIX | "It is built, but nothing reads it. Behavior uses only the current record, which means the added operations buy nothing yet." → "It is built, but behavior never reads it. Behavior uses only the current record, so the added operations buy nothing yet." | circuit.ts:425-427; window-depth.test.ts:74-76 | The behavior above never reads these |
| 3 Exact, Within Limits | 8 | OK | | README.md:132; circuit.ts:590-597 | Training recovers parameter cells, not structure. |
| 3 Exact, Within Limits | 9 | OK | | lab/status.md:200 | Training supplies correct internal state and decision labels. Persistent state and temporal dependencies remain. |
| 3 Exact, Within Limits | 10 | OK | | reassessment-2026-09-03.md:86-88; README.md:5; pointer-input.test.ts:7 | The demo replaces consecutive pointer moves with the final move. |
| 3 Exact, Within Limits | 11 | FIX | "double-click and flick speed, which would read the archive; ... and discovering the latches instead of writing them. None of that is built." → "double-click, which would read the archive; flick speed, which needs a move archive; ... discovering the latches. None is built." | README.md:137-138 | A move-event archive of the last two positions would give flick velocity at release |
| 3 Exact, Within Limits | 12 | FIX | "one ramp shape that narrows to recover six boundaries" → "one ramp shape that narrows to recover six parameters" | README.md:62; train.ts:131-138 | Six behavior parameter cells are trainable: the slop boundary, the title boundary, and the four relation cells. |

## Why each FIX

- **Ch2 #1.** Only the title and slop tests (circuit.ts:264, 294) use the ramp form `clamp01(difference × sharpness + 0.5)`. The hit test (circuit.ts:198-203) is a clamp of the smaller of two edge distances, with no sharpness and no offset. "Every yes-or-no" is false.
- **Ch2 #6.** The ramp clamps at both ends (`emitClampZeroOne`, circuit.ts:556-562). At sharpness 1/32 a frame gives gradient only when its measure is within 16 px of the boundary. At 85.95, most title and body presses give no pull. The lab says "many examples" (train.ts:142-144), not every press.
- **Ch2 #7.** Four phases make three transitions. The first chip, 32 px, is the starting ramp, not a snap. The learning-rate scales 1, 1, 0.3, 0.1 (train.ts:153-156) drop at the last two snaps.
- **Ch3 #7.** `window-depth.test.ts:74-76` reads the archive cells to check the mirror, so "nothing reads it" is false. Behavior never reads it (circuit.ts:426-427).
- **Ch3 #11.** Double-click reads the press archive (README:137). Flick velocity needs a new move-event archive (README:138), not the press archive.
- **Ch3 #12.** The six parameters are two boundaries (slop, title) and four relation cells (train.ts:131-138). "Six boundaries" is wrong.

## OK rows with caveats (left as written)

- **Ch1 #4.** "Only then" holds for every press field. The active bit alone clears on release (circuit.ts:268-272).
- **Ch1 #11.** "A probe says no" rests on K ∈ {1, 4, 16, 64, 256} (boundary-probe.test.ts:69), but the construction works for any K, so the claim holds.
- **Ch2 #12.** "Wide ramp" is the lab's own term for the 0.25 sharpness ramp (training.test.ts:91). Read beside #11 ("four pixels wide"), it is clear.
- **Ch2 #13.** "It's what makes recovery work" rests on one fixed-ramp run from the truth and one stalled scrambled start (training.test.ts:100-122), against 20/20 annealed starts. The README says "The fix is annealing" (README:71). Scene authors should not add a stronger causal claim.
- **Ch3 #5.** The +36 ops per record is measured, not pinned by a test. The test pins linearity only (window-depth.test.ts:106).
- **Ch3 #10.** "Could erase a drag" holds for a title press: the lost crossing means no drag ownership (oracle.ts:230-241). The test name says "both evaluators", but the test steps the tensor machine and the oracle (pointer-input.test.ts:7). Not in the captions.

## Visuals in plan.md that show a wrong number or claim (not edited)

1. **Ch1 beat 11, bottom lane.** "256 empty slots × 3, then the same 256 inputs" is wrong. The empty prefix is 3 frames, the length of the drag session (boundary-probe.test.ts:75-78). It should read "3 empty slots, then the same 256 inputs".
2. **Ch1 beat 10.** "pointer goes out 9 px" is not a lab number. The lab's case is 20 px (pointer-input.test.ts:17; reassessment:86). It is above slop, so it is not false as an illustration. Label it as illustrative or use 20 px.
3. **Ch2 beat 6.** "The ramp band is drawn 32 px wide, wide enough to cover the far dots" is wrong. A 32 px ramp is unsaturated only within 16 px of its line. The axis dots (offsets 20 to 40) are about 46 px or more from 85.95. Drop "wide enough to cover the far dots"; the pull comes from dots within 16 px.
4. **Ch2 beat 7.** "Four snaps" should be "three snaps": four phases, three transitions. The four chips can stay, since the first is the starting ramp.
5. **Ch3 beat 10.** "five consecutive moves are collapsed to one" is wrong. The lab's case is two moves: out 20 px, then back to the press point (reassessment:86; pointer-input.test.ts:17). Change it to two moves.
6. **Ch3 beat 11.** "double-click and flick velocity (arrows from the archive)" is wrong for flick. Only double-click reads the press archive. Flick needs a move-event archive (README:138), so its arrow should come from that new archive.

Verified and correct: ch1 460, 400, 410, 305, 980 and 30 px; ch2 seven-point losses, 9,120, first divergence at 135, 30.0138 and 3.9671, 29.390 to 29.821, 4.174 to 4.842, 85.95 and 12.86, 15,844 pairs; ch3 480, 516, 588, 732, 1020, depth 52, +72 weights per record, the 502 and 38 marked stale, 200 drags 400 to 500, 16 settings × 2,000 frames.

## plan.md caption lines edited

Ch2 caption 1, 6 and 7 (and the scope note on "three snaps"). Ch3 caption 7, 11 and 12. Each matches its `book.json` caption.
