# Review: fact-check of the Bitonic Sorter captions

Reviewer: Claude Haiku 5.5 (role: review). Checked: all 46 captions in `book.json` (chapters 1 to 4, 12 + 11 + 10 + 13), each against its cited source. Three captions were edited in place in both `book.json` and `plan.md`: 3 FIX, 43 OK.

Checks run:
- `bun .orly-work/hw-books/bitonic-ref/report.ts` re-run: output byte-identical to `report.txt`.
- Scratch `.orly-work/hw-books/bitonic-ref/review/merge-check.ts`: the bitonic merge sorts every article-bitonic sequence (n = 4: 130, n = 8: 2,083, n = 16 zero-one: 137; all 0 unsorted) and 2,000 random mountains each at n = 8, 16, 32, 64 (0 unsorted).
- Scratch `.orly-work/hw-books/bitonic-ref/review/check-captions.ts`: `book.json` parses, all 46 captions are at most 220 characters, and each caption appears verbatim in `plan.md`.
- Hand arithmetic: n·k(k+1)/4 and k(k+1)/2 for n = 2 to 64; 4 × 672 = 2,688; 2,752 / 2,688 = 1.024; 10,624 vs 16,512; 672 / 240 = 2.8; odd-even closed form (k²−k+4)·2^(k−2) − 1 = 543 at k = 6.
- Grep of the exploration notes for any explanation of 2,752, 2,688, or 64 vs 63 layers: none found, so "the notes do not explain" stands.

Source abbreviations (paths relative to the worktree):
- `wiki` = `.orly-work/hw-books/inputs/bitonic/wikipedia-bitonic-sorter.wikitext`
- `report` = `.orly-work/hw-books/bitonic-ref/report.txt`
- `bitonic.ts` = `.orly-work/hw-books/bitonic-ref/bitonic.ts`
- `merge-check` = `.orly-work/hw-books/bitonic-ref/review/merge-check.ts` (scratch, not a source of the book)
- `loops` = `.orly-work/hw-books/repo/lab/ui-exploration/guide/sections/loops.md`
- `ranks` = `.orly-work/hw-books/repo/lab/ui-exploration/guide/patterns/ranks-instead-of-sorting.md`
- `review-dec` = `.orly-work/hw-books/repo/lab/ui-exploration/guide/review-and-decisions.md`
- `lab-readme` = `.orly-work/hw-books/repo/lab/ui-exploration/README.md`
- `exec` = `.orly-work/hw-books/repo/docs/execution-model.md`
- `patterns` = `.orly-work/hw-books/repo/docs/patterns.md`
- `notes-out` = `.orly-work/hw-books/inputs/bitonic/handwired-notes-outside-techniques.md`
- `notes-rt` = `.orly-work/hw-books/inputs/bitonic/handwired-notes-runtime.md`

The verbatim quote is taken from the cited source. Each quote was copied from the file and checked against it.

## Table

| chapter | # | verdict | old → new | source path:line | verbatim quote |
|---|---|---|---|---|---|
| 1 Two Wires and a Fold | 1 | OK | | `loops`:185 | "A sorting network is a fixed list of compare-exchange steps that sorts any input" |
| 1 Two Wires and a Fold | 2 | OK | | `wiki`:26 | "X and Y represent the inputs, while H and L represent the higher and lower outputs, respectively." (smaller-on-top is the ascending convention, not stated in source) |
| 1 Two Wires and a Fold | 3 | OK | | `wiki`:14; `report`:6 | "Proceedings of the April 30--May 2, 1968" / "8    3  6       6         24           24          yes" |
| 1 Two Wires and a Fold | 4 | OK | | `wiki`:16; `report`:44 | "A sequence is bitonic when it consists of a non-decreasing sequence followed by a non-increasing sequence" / "== 4. worked half-cleaner, bitonic 8-sequence [1, 2, 6, 7, 8, 5, 3, 0] ==" |
| 1 Two Wires and a Fold | 5 | OK | | `wiki`:41-42 | "elements of the first half of the input sequence are pairwise compared against corresponding elements of the last" |
| 1 Two Wires and a Fold | 6 | OK | | `report`:51-52 | "low half  [1, 2, 3, 0]  article-bitonic: true  cyclic-bitonic: true" / "high half [8, 5, 6, 7]  article-bitonic: false  cyclic-bitonic: true" |
| 1 Two Wires and a Fold | 7 | OK | | `report`:53; `wiki`:45-47 | "max(low) = 3 <= min(high) = 5: true" / "all elements in the red sequence are guaranteed to be higher than all elements in the blue series." (example input; the general claim is caption 9) |
| 1 Two Wires and a Fold | 8 | OK | | `report`:52 | "high half [8, 5, 6, 7]  article-bitonic: false  cyclic-bitonic: true" |
| 1 Two Wires and a Fold | 9 | OK | | `report`:56, 61 | "article-bitonic inputs: 2083" / "max(low) > min(high): 0" (also `merge-check`: 2,083 mountains, 0 unsorted) |
| 1 Two Wires and a Fold | 10 | OK | | `report`:84-85; `wiki`:33-36 | "bitonicMerge(a, 0, 8, 1, exclusive) on the same input        -> [0, 1, 2, 3, 5, 6, 7, 8]" |
| 1 Two Wires and a Fold | 11 | OK | | `report`:17; `wiki`:26 | "stage 3: (0,4 asc) (1,5 asc) (2,6 asc) (3,7 asc)" / "A bitonic sorter for k=1 (n=2) is simply a comparator." |
| 1 Two Wires and a Fold | 12 | OK | | `wiki`:20; `merge-check` | "which requires an input sequence whose length n is a perfect power of two" (`merge-check`: every mountain tested sorts; n = 8 exhaustive over 2,083, n up to 64 random) |
| 2 Building the Mountains | 1 | OK | | `wiki`:80-82; `report`:14 | "These bitonic sorters are recursively used to create two monotonic sequences" (a 2-number sequence is always monotone, so always a mountain) |
| 2 Building the Mountains | 2 | OK | | `report`:14, 35 | "stage 0: (0,1 asc) (2,3 desc) (4,5 asc) (6,7 desc)" / "after stage 0   [3, 7, 8, 4, 2, 6, 5, 1]" |
| 2 Building the Mountains | 3 | OK | | `report`:15-16 | "stage 1: (0,2 asc) (1,3 asc) (4,6 desc) (5,7 desc)" |
| 2 Building the Mountains | 4 | OK | | `report`:37 | "after stage 2   [3, 4, 7, 8, 6, 5, 2, 1]" |
| 2 Building the Mountains | 5 | OK | | `report`:38 | "after stage 3   [3, 4, 2, 1, 6, 5, 7, 8]" |
| 2 Building the Mountains | 6 | OK | | `report`:39-40 | "after stage 4   [2, 1, 3, 4, 6, 5, 7, 8]" / "after stage 5   [1, 2, 3, 4, 5, 6, 7, 8]" (stages are numbered 0 to 5, so "sixth stage" is stage 5) |
| 2 Building the Mountains | 7 | OK | | `report`:6, 14-19 | "8    3  6       6         24           24          yes" (6 stages, 4 comparators each, as in each stage line) |
| 2 Building the Mountains | 8 | OK | | `report`:17; `wiki`:138 | "stage 3: (0,4 asc) (1,5 asc) (2,6 asc) (3,7 asc)" / "the number of levels in which each comparison can be done in parallel is given by" (distances 1; 2,1; 4,2,1 total 1+2+3 = 6 stages) |
| 2 Building the Mountains | 9 | OK | | `bitonic.ts`:59; `notes-out`:109 | "export function bitonicNetwork(n: number): Comparator[][]" / "so its structure does not depend on the data" (network takes only n, so the wiring is input-independent) |
| 2 Building the Mountains | 10 | OK | | `report`:64-65 | "n=8: 256 inputs, 0 not sorted" / "n=16: 65536 inputs, 0 not sorted" |
| 2 Building the Mountains | 11 | OK | | `report`:67-73 | "2000 arrays per size, values 0..999" / "n=64  network mismatches 0, recursive pseudocode mismatches 0" |
| 3 The Staircase | 1 | OK | | `wiki`:138; `report`:3-9 | "the number of levels in which each comparison can be done in parallel is given by" / "64   6  21      21        672          672         yes" |
| 3 The Staircase | 2 | OK | | `report`:4-9 | "16   4  10      10        80           80          yes" (stages column: 1, 3, 6, 10, 15, 21) |
| 3 The Staircase | 3 | OK | | `report`:4-9 | "16   4  10      10        80           80          yes" (comparators column: 1, 6, 24, 80, 240, 672) |
| 3 The Staircase | 4 | FIX | "and delay like log n squared" → "and stages like log n squared" | `wiki`:14; `plan.md` line 8 (vocabulary rule); research notes Article defects #10 | "and have a delay of" (book term is "stages"; "delay", "levels" and "parallel time" name the same count, article defect 10) |
| 3 The Staircase | 5 | OK | | `wiki`:14; `report`:9 | "such as a typical" (GPU, lockstep units); 672 / 21 = 32 comparators per stage at n = 64 |
| 3 The Staircase | 6 | FIX | "consecutive operations keep good locality of reference, so it is cache-friendly in practice" → "many consecutive operations keep locality of reference, which makes them cache-friendly in practice" | `wiki`:140 | "many of the consecutive operations in a bitonic sort retain a locality of reference, making implementations more cache-friendly" (article says "many", not all) |
| 3 The Staircase | 7 | OK | | `report`:88; `wiki`:20, 99 | "m = 1..64, 3200 arrays: 0 mismatches" / "using sentinel values" (the sentinel result is for the JS reference, not for Handwired's circuit) |
| 3 The Staircase | 8 | OK | | `report`:75-77; `wiki`:109 | "== 6. article pseudocode with the inclusive loop bound (i <= low + k) ==" / "0-1 n=8: 8 of 256 inputs not sorted, first: [1, 1, 1, 1, 0, 0, 0, 0]" / "for i ← low to low + k do" |
| 3 The Staircase | 9 | OK | | `report`:11, 9 | "odd-even mergesort, n=64: comparators 543, closed form (k^2-k+4)*2^(k-2)-1 = 543" (672 bitonic at line 9) |
| 3 The Staircase | 10 | OK | | `report`:14 | "stage 0: (0,1 asc) (2,3 desc) (4,5 asc) (6,7 desc)" (4 comparators = n/2 per stage at n = 8) |
| 4 What Handwired Pays | 1 | OK | | `lab-readme`:5; `exec`:3, 7 | "one fixed numeric circuit of affine operations, ReLU-gated products, and exact bits" / "one `Float32Array`" / "## FP32" (32-bit comes from `exec`; the cited README line does not state it) |
| 4 What Handwired Pays | 2 | OK | | `exec`:40 | "Independent instructions at the same dependency depth share a layer." |
| 4 What Handwired Pays | 3 | OK | | `patterns`:358; `notes-out`:109 | "A sort reaches each item's place through comparisons that depend on earlier comparisons." / "so its structure does not depend on the data" |
| 4 What Handwired Pays | 4 | OK | | `loops`:185; `notes-rt`:66 | "A compare-exchange on keys alone is a minimum and a maximum, 4 operations in 3 layers" / "minimum and maximum of one pair \| shares the difference and relu through deduplication \| 4 / 3 / 7" (min = a − relu(a−b), max = b + relu(a−b); checked by hand) |
| 4 What Handwired Pays | 5 | OK | | `notes-out`:32, 113 | "Sort 64 items by key, carrying a payload \| bitonic network, keys only, `emitMinimum`/`emitMaximum` \| 2,752 \| 64 \| 4,768" / "a bitonic network on keys only takes 64 layers and 4,768 weights" (21 × 3 = 63 predicted, arithmetic) |
| 4 What Handwired Pays | 6 | OK | | `report`:9; `notes-out`:32 | "64   6  21      21        672          672         yes" (672 × 4 = 2,688 is arithmetic; no notes explain the gap, checked by grep) |
| 4 What Handwired Pays | 7 | OK | | `loops`:189; `notes-out`:31 | "16 items: a bitonic network was 1,248 operations and 50 layers, and ranks by counting with gathers were 1,056 operations and 5 layers." |
| 4 What Handwired Pays | 8 | FIX | "A rank counts how many items are smaller than this one, … That count is the sorted position" → "A rank counts the items ahead of this one, … Equal keys break ties by index, and that count is the sorted position." | `ranks`:16; `notes-out`:113; `notes-rt`:238 | "Items 0 and 2 have equal keys, and the earlier item comes first, like a stable sort." (a strict count gives tied items the same rank, so the tie-break is needed; the cited `notes-rt`:238 formula `rank_i = sum_j [x_j < x_i]` omits it) |
| 4 What Handwired Pays | 9 | OK | | `loops`:189, 192 | "So at 16 items counting was less work, at 64 items the network was, and counting stayed at a constant 5 layers." |
| 4 What Handwired Pays | 10 | OK | | `loops`:190, 192 | "64 items: 10,624 operations and 105 layers, against 16,512 operations and 5 layers." |
| 4 What Handwired Pays | 11 | OK | | `notes-out`:113; `ranks`:84 | "For the item counts UIs usually have, counting is the better formulation; n² comparisons start to hurt around hundreds of items." |
| 4 What Handwired Pays | 12 | OK | | `notes-rt`:237; `exec`:282 | "on fractional values 20-24% of outputs aren't bit-equal to any sorted input (errors up to 6e-5)" / "Fractional values can drift even at small magnitudes." (6e-5 = six in a hundred thousand) |
| 4 What Handwired Pays | 13 | OK | | `review-dec`:269; `notes-out`:113 | "Whether to package a sorting network for apps that sort well past 64 items, next to ranks by counting" |

## Visuals in plan.md with a wrong number or unsafe term

Plan text was not edited here (only the captions were in scope). The scene authors should fix these:

1. **Chapter 3, on-screen labels (line 109):** "O(n log^2 n) comparators, O(log^2 n) delay". "delay" breaks the plan's own vocabulary rule (line 8) and article defect 10. Use "stages".
2. **Chapter 4, on-screen labels (line 145):** "rank formula `rank_i = sum_j [x_j < x_i]`". It has no tie-break, so tied keys get the same rank and the ranks are not a permutation. Use the tie-broken form, or state that keys are assumed distinct, as in `ranks`:16.
3. **Chapter 4, beat 6 and on-screen labels:** the counting demo must show ties break by index, since the caption now says so. Showing only the strict count would contradict caption 8.
4. **Chapter 3, beat 8:** "a ghost comparator reaches from the last wire of a block into the next block" is loose. The extra comparison runs from wire `low + k` (the last wire of the lower half of a sub-block) to wire `low + 2k`, the first wire of the next sub-block. The counter "8 of 256 fail" and the failing input [1, 1, 1, 1, 0, 0, 0, 0] are correct (`report`:77).

All other numbers in plan.md checked out:
- Chapter 1 beats 3 to 8: the bars, the half-cleaner table, "2,083 / 415 / 0", and the recursion [1, 2, 3, 0] → [1, 0, 3, 2] → [0, 1, 2, 3] and [8, 5, 6, 7] → [6, 5, 8, 7] → [5, 6, 7, 8] (hand-run through the stage rule).
- Chapter 2 beats 1 to 10: the trace rows and stage colours match `report`:14-19 and 35-40.
- Chapter 3 beats 1 to 7 and 9 to 10: staircases, 1, 6, 24, 80, 240, 672, "about 2.8 times", 32 per step, 21 steps, 543 odd-even.
- Chapter 4 beats 4, 5, 7 to 9: 4 ops / 3 layers, example a = 7, b = 3 gives d = 4, relu = 4, min = 3, max = 7; 63 / 64 layers; 2,688 "predicted" (labelled as arithmetic); 1,248 / 50; 1,056 / 5; 10,624 / 105; 16,512 / 5; 20–24%, 6e-5.

## Source-pointer notes (claims are right; the pointer is weak)

- Chapter 4, caption 1: the cited `README.md:5` (root and lab) does not say "thirty-two-bit"; the FP32 support is in `exec`:3 and 7.
- Chapter 2, caption 9: the pointer `loops`:185 supports "fixed list", not "never decides". The stage-list check (`report`:14–19) and `bitonic.ts`:59 support the claim.
- Chapter 3, caption 9 and chapter 4, caption 4: the `report` and `loops` line numbers are right, but "odd-even" and "sixty-four layers" are from the notes, not the report.
- The `notes-rt`:238 formula is wrong for ties (see chapter 4, caption 8). The `ranks`:16 text is correct. This is a defect in the notes, not in the book's claim.
