# Plan: handwired-json-search

- **Title:** JSON Search
- **Subtitle:** Can a GPU search a hundred thousand JSON documents faster, one thread each, with the lab's own weighted-sum program?
- **Animal:** bloodhound (it follows a trail through many scents at once)
- **Accent:** `#b23a48` (hound red)
- **Pinned source:** chenglou/handwired @ `4ea7fcb27ebe93acf49b9f29a93e162b975bad46`, lab `lab/json-search` (source pointers below are relative to the clone; `src/json-search/...` is the module the lab's page and code moved into on October 14, 2026, lab/status.md:289)
- **Throughline noun:** the document (one of 100,000, each owned by one thread).
- **Status wording (say it plainly):** the October 14 update is current: against the same programs on the CPU it holds (200 to 40,000 times); against one-thread RegExp it is faster back to back and for most patterns at a keystroke, slower on two; against JavaScript in several workers, no. The October 13 "about even" verdict is historical, the first-stage written-out programs are removed (kept at tag `json-regex-experiments-2026-10`), the review narrowed several first claims, and the pause slowdown and other GPUs are open.
- **Corrections applied vs the earlier one-book plan and digest:** the answer is no longer "mixed" (research contradiction 1); "about five milliseconds" is only back to back, a keystroke is 11 to 16 ms (8); there are two writers now, not three stages (2); the 58,920-operation comment in search-step.ts:5 is stale, the report's 61,448 is used (11); the workers pointer is lab/status.md:120.
- **Honest scope:** one Apple M5 Max through Metal, headless Chrome (155), generated documents, 100,000 of them, up to 512 code points. Numbers are the README's, with the `report.ts` counts reproduced in the research run. I did not use the million-document folder's numbers. The scene must not suggest GPU speed on other hardware.
- **Relu/one-hot/circuit re-definition:** done only where needed: ch.2 says a state vector is zero-one (not one-hot, several states can be live); ch.3 states the relu identity for bits.
- **Music (if asked):** one motif of a fast ticking sweep; ch.1 a wall that lights in one pass, ch.2 two scans (down then up) that meet in a click, ch.3 a long note that collapses into one hit when the word packs, ch.4 an even bed that thins out for the open items. Machines clack, never chime.

## Chapter 1: One Thread Per Document

**Thesis:** One program, run by one GPU thread per document, is a case for the GPU only when documents are many.

**Blurb:** One program, 100,000 generated JSON documents, and a GPU thread for each, checked against the CPU.

### Visual machine

**The Document Wall.** A field of 100,000 tiny cells (a 250 × 400 grid, each cell one document/thread), 10,057 of them red and the rest neutral, seeded placement. One cell is pulled out and unfolds into a row of 512 cell-slots holding a pretty-printed record (a `userRecord` from `report.ts examples`), with a read head sweeping left to right colouring each code point by display kind. A counter ticks the operations: 37 per position, 18,961 total. The wall then lights in a wave, every thread sweeping at once.

Camera: drive a `cam` channel with `cameraInterp`; push in on each beat's subject, pull back for comparisons. Keep y ≳ 630 free.

### Beat sheet

1. Grid of 100,000 cells fades in as a quiet wall; a lone cell pulses next to a CPU clock tag `80 µs` and a GPU tag `0.6 ms+`. *(captions 1, 2)*
2. Camera pulls back; the wall sweeps lit left to right: every cell identical, none connected to another. *(3)*
3. Camera pushes into one cell; it unfolds into a 512-slot row, the last slot the length. A thread glyph sits on it with a wall at its side (no reads across). *(4)*
4. Back on the wall, 10,057 cells turn red; a legend of the 16 defect kinds stacks beside it with their counts (474–748 each). *(5)*
5. Push into the row: read head sweeps, each code point is coloured by display kind; operation counter `37 / position`, `+17 at the end`, `18,961`. *(6)*
6. A code-block tile (`json-step.ts`) slides in with a `for` loop ring; a stack of 107 statement bars compresses beside a ghost stack of ~12,000 (the written-out version) fading. *(7, 8)*
7. Pull back: the whole wall sweeps in one pass; counter `≈ 1.9 billion` ops; a stopwatch lands at `2.2 ms`. *(9, 10)*
8. CPU lane appears beneath: `2.1 s` generated JavaScript; check mark and `0 different` over `51.6 million values`. *(11)*
9. Stage quiets to one tag: `Apple M5 Max · headless Chrome 155`. *(12)*

### Captions (spoken verbatim)

1. Cheng asked whether regex search or a JSON highlighter could run clearly faster on a graphics chip. The lab tests that on one hundred thousand generated JSON documents. `[lab/json-search/README.md:52]`
2. For a single document, no. The highlighter takes eighty microseconds on the CPU executor, and a round trip to the GPU alone costs six tenths of a millisecond or more. `[lab/json-search/README.md:52]`
3. Many documents are another story. Every document runs the same operations, and no document reads another one's values. That is a thread per document. `[lab/json-search/README.md:52]`
4. Each document is a row of up to five hundred twelve code points, followed by the text's length. One GPU thread reads its own row and never anyone else's. `[src/json-search/json-step.ts:65; README.md:434]`
5. Of the hundred thousand, 89,943 are valid and 10,057 are broken, spread over sixteen kinds of defect: a missing quote, a trailing comma, a bad escape, nesting too deep. `[lab/json-search/README.md:199; report.ts documents]`
6. The highlighter is one step of work per position. Thirty-seven operations read a code point, and seventeen more close the document, so a full row costs 18,961 operations. `[report.ts loops (step 37, end 17, 18,961 per document); json-step.ts:158]`
7. The step is written once, inside a loop over positions. That shader is 107 statements long, and it compiles in about four hundredths of a second. `[report.ts loops (107 WGSL statements); lab/status.md:114; README.md:55]`
8. Written out position by position, the first version of this shader took about two seconds to compile. The loop turned a compile limit into a detail. `[lab/json-search/README.md:55,200,900]`
9. Across the hundred thousand documents, that is about 1.9 billion operations in one pass, which is simple arithmetic: 18,961 times one hundred thousand. `[report.ts loops; arithmetic, stated as inference]`
10. With the documents already on the GPU, validating and highlighting all hundred thousand takes 2.2 milliseconds when passes follow each other. `[lab/json-search/README.md:118]`
11. The same program as generated JavaScript on the CPU takes about 2.1 seconds, extrapolated from 5,000 documents. On the CPU executor it takes 8.4 to 9.2 seconds. Every value from the GPU matched the CPU's. `[lab/json-search/README.md:118; results: 51.6 million values, 0 different (README.md ~line 780 list)]`
12. Scope: one Apple M5 Max through Metal, headless Chrome, generated documents. The lab itself says another GPU or browser may differ. `[lab/json-search/README.md:170 and Not done]`

### On-screen labels

`lab/json-search`, `100,000 documents`, `512 code points`, `cellsPerDocument`, `step 37 · end 17`, `18,961 operations per document`, `107 WGSL statements`, `3,994 shared cells`, `89,943 valid · 10,057 broken`, defect names `missingQuote 616 · trailingComma 608 · badEscape 616 · tooDeep 622`, `2.2 ms`, `2.1 s`, `8.4–9.2 s`, `51.6 million values · 0 different`, `Apple M5 Max`.

## Chapter 2: Search Is a Matrix Product

**Thesis:** Search is a matrix product of a zero-one state vector, with the pattern stored as data.

**Blurb:** The pattern is data, and each code point multiplies a zero-one state vector by a transition matrix, once backward and once forward.

### Visual machine

**The Scan Strip.** A strip of 14 character cells `n o _ e r r o r _ f o u n d` (the text `no error found`) with two rows of state-bit cells beneath each position (6 states for `error`, s0–s5, accepting s5). A transition matrix card (6 × 6 of 0/1, heat-lit) sits at left and swaps to the matrix of the current character's class. The reverse head sweeps right to left filling `reach[j][s]` bits; then the forward head sweeps left to right filling `reached[j][s]`; positions where they agree light as marks (positions 3–7). The scene precomputes the vectors at module scope from the search-step semantics (verify against `compilePattern`).

Camera: drive a `cam` channel with `cameraInterp`; push in on each beat's subject, pull back for comparisons. Keep y ≳ 630 free.

### Beat sheet

1. A pattern card `error` and a text card appear; a small cell block labeled 'cells beside the text' holds the automaton. *(1)*
2. The six states appear as a chain s0→s5 with `error` letters on edges; `connection reset` shows as a 17-state chain collapsing off-screen. *(2)*
3. A code point drops through a ruler of boundaries; a counter picks its class (limits tags `16 classes`, `32 boundaries`). *(3)*
4. Matrix card fills for that class; the 0/1 state vector slides across it; each product is a dot on a table cell. Counter: `64 table reads at 8 states`, `1,024 at 32`. *(4, 5)*
5. Reverse head sweeps from the end, bits `reach[j][s]` filling right to left; the start bit lights at the e. *(6)*
6. Forward head sweeps; `reached[j][s]` bits fill; positions where both agree glow and a count increments to five. *(7, 8, 9)*
7. Camera pulls back: three stacked blocks per position (reverse + forward) grow with capacity: 240, 664, 2,280, then a 512-wide row at 122,888 and 1,167,392. *(10, 11)*
8. A `searchable[kind]` mask tile greys out characters outside a string run; only that run can match. Stage quiets. *(12)*

### Captions (spoken verbatim)

1. Search is the harder program. The pattern is not code: its automaton sits in cells beside the text, so a new pattern writes cells and changes no program. `[src/json-search/search-step.ts:3-4; regex/data-program.ts:15-32]`
2. A pattern has one state per character or class it reads, plus one. The word error needs six states. The words connection reset need seventeen. `[lab/json-search/README.md:150]`
3. Each code point first becomes a class, found by counting how many class boundaries it has passed. A pattern may use up to sixteen classes and thirty-two boundaries. `[regex/data-program.ts:36-37; search-step.ts:38-39]`
4. The class picks a transition matrix of ones and zeros: which state leads to which. The set of live states is a zero-one vector, and one step multiplies the two. `[regex/data-program.ts:15-32, 48-50; search-step.ts:9-14]`
5. Each product in that multiply is one table read, a single lookup per pair of states. Eight states mean sixty-four lookups per step, thirty-two mean 1,024. `[regex/data-program.ts:48-50; report.ts loops (table reads 64, 1,024 forward)]`
6. The reverse pass walks from the end of the text. A one in the reach vector means: from this state, here, some path reads at least one code point and ends accepting. `[src/json-search/search-step.ts:9-11]`
7. The forward pass walks from the start. A code point belongs to a match when a state is both reached by the match in progress and marked by the reverse pass. `[src/json-search/search-step.ts:12-14]`
8. When no match is in progress, a new one starts where the reverse pass marks the initial state. So the forward pass already knows whether a longer match exists, and never backtracks. `[src/json-search/search-step.ts:12-14]`
9. On the text no error found, the reverse pass lights the start at the letter e, the forward pass carries the match through five letters, and five positions are marked. `[computed from search-step.ts:9-14 semantics with compilePattern (pattern.ts:307)]`
10. Per position, the two passes cost 240 operations at eight states, 664 at sixteen, and 2,280 at thirty-two, whatever the length of the text. `[src/json-search/search-step.ts:2; report.ts loops (148+92, 356+308, 1,156+1,124)]`
11. Over a full 512-position document that is 122,888 operations at eight states, and 1,167,392 at thirty-two. Every value is an integer, so 32-bit floats are exact. `[report.ts loops; search-step.ts:11-12 header]`
12. The search can also read the highlighter's display kinds, so a match stays inside one run, such as one string value, and never crosses an escape or a key. `[src/json-search/search-step.ts:58-59, scope comment]`

### On-screen labels

`search-step.ts`, `dataSearchCells`, `text · boundaries · regionClasses · transitions[classes][states][states] · accepting[states]`, `reach[j][s]`, `reached[j][s]`, `emitClasses`, `createStepAnd`, `240 / 664 / 2,280 per position`, `122,888 / 339,984 / 1,167,392 per document`, `classCapacity = 16`, `boundaryCapacity = 32`, `error · 6 states`, `connection reset · 17 states`, `FP32 exact in any order`.

## Chapter 3: Packing the Bits

**Thesis:** Packing a row of states into one 32-bit word cut the same search from 945 ms to 5.24 ms.

**Blurb:** The same search program went from 945 milliseconds to 5.24 at 32 states once its shader packed states into 32-bit words.

### Visual machine

**The Word Collapse and the Bar Race.** Left: a row of 32 state cells, each its own f32 statement block (stack of 4,648 thin bars), which fold together into one 32-bit word (a single wide cell) with an AND gate on it. Right: paired bars per state capacity (8, 16, 32), amber `loop-emit` over crimson `bit-emit`, back to back, on a shared linear scale so the 945 ms bar towers and the 5.24 ms bar is a sliver (an inset magnifies the small bars).

Camera: drive a `cam` channel with `cameraInterp`; push in on each beat's subject, pull back for comparisons. Keep y ≳ 630 free.

### Beat sheet

1. The three old bars rise: 7.81, 68.8, 945 ms. Label: `loop-emit` (one f32 statement per operation). *(1)*
2. Camera pushes on the 32-state program: 1,025 table reads and a stack of 4,648 statements grow. *(2)*
3. A tag `same program` pins to a circuit glyph (sums, relu) and a second writer `bit-emit` slides in under it; only the shader text changes. *(3)*
4. `relu(a − b)` morphs into `a & (b ^ 1u)`; a truth-table of four bit pairs confirms equal outputs. *(4)*
5. The 32 state cells fold into one word cell; many table reads of one row become one AND and `== 0u`. *(5)*
6. A gate tag `proven bit/integer?`: green for yes (packed), grey for no (stays f32). *(6)*
7. New crimson bars drop beside the old ones at 8 and 16: 4.60, 4.72. *(7)*
8. The 32-state crimson bar lands at 5.24 beside the 945 tower; ratio badges `1.7×`, `15×`, `180×`. *(8)*
9. A flat floor line `0.6–1.9 ms` crosses all three sizes at 100–10,000 documents. *(9)*
10. A caveat tag `back to back` pulses with a dim 'pause' bar ghost (11.3, 11.9, 13.2) held for next chapter. *(10)*
11. Highlighter lane: two writers equal, `loop-emit` stays. *(11)*
12. Equality seal: `0 different`. Stage quiets. *(12)*

### Captions (spoken verbatim)

1. The first working search was slow for long patterns. For a hundred thousand documents it took 7.8, 69, and 945 milliseconds at eight, sixteen, and thirty-two states. `[lab/json-search/README.md:56,631-633]`
2. The reason is the arithmetic from before. At thirty-two states a pass has 1,025 table reads, and the shader holds 4,648 statements, each one a separate 32-bit float operation. `[report.ts loops (32 states: 1,025 reads, 4,648 WGSL statements); README.md:150]`
3. The fix is not a new program. On October 14 a second code writer, one that packs bits, rewrote only the shader text. The weighted sums and relu gates stayed as they were. `[lab/status.md:116; src/json-search/searcher.ts:467-468]`
4. Its key identity: when both inputs are known to be bits, relu of a minus b is just a, AND the flip of b. A subtraction and a clamp become one logic operation. `[src/json-search/bit-emit.ts:35]`
5. A row of up to thirty-two states fits one 32-bit word. So a gate reading many table entries of the same row becomes one AND of two words, then a test against zero. `[lab/json-search/README.md:435; bit-emit.ts:47-49]`
6. The writer only does this where the declared ranges prove a value is a whole number or a bit. Everywhere else it falls back to the same float statements. `[src/json-search/bit-emit.ts header; lab/status.md:116]`
7. At eight states the search went from 7.81 to 4.60 milliseconds, and at sixteen from 68.8 to 4.72, back to back, for a hundred thousand documents. `[lab/json-search/README.md:631-633]`
8. At thirty-two states it went from 945 to 5.24 milliseconds. That is 1.7, 15, and 180 times less, with no change to the program. `[lab/json-search/README.md:777, 901]`
9. So the search no longer slows with the pattern's size. A hundred to ten thousand documents take 0.6 to 1.9 milliseconds at any of the three sizes. `[lab/json-search/README.md:780 (what these tables say)]`
10. Those are back-to-back times, where each search starts as soon as the last answer arrives. Searching after a pause is a different, slower number, in the next chapter. `[lab/json-search/README.md:162]`
11. The highlighter got nothing from the second writer, so the searcher still uses the first writer for it and the bit writer only for search. `[lab/json-search/README.md:920; searcher.ts:467-468]`
12. Both writers give the same answers. 2.4 million match counts and marks across 18 searches agreed, with no differences, and so did 103 million highlighter values. `[lab/json-search/README.md:779]`

### On-screen labels

`loop-emit.ts`, `bit-emit.ts`, `relu(a - b) = a & (b ^ 1u)`, `(word[base] & opens) == 0u`, `options.writers?.search ?? 'bit-emit'`, `options.writers?.highlighter ?? 'loop-emit'`, `4,648 WGSL statements`, `1,025 table reads`, `7.81 → 4.60`, `68.8 → 4.72`, `945 → 5.24 ms`, `1.7 · 15 · 180 times less`, `2.4 million match counts · 18 searches · 0 different`, `103 million highlighter values`.

## Chapter 4: Who Does It Beat

**Thesis:** Faster than the same program on the CPU, often faster than one-thread RegExp, not faster than workers.

**Blurb:** The same GPU search races the CPU, RegExp and worker threads; the lab's own status says where it wins, loses and is still open.

### Visual machine

**The Time Axis.** One horizontal log-time axis from 1 ms to 200 s. A GPU band marks 4.5–5.2 ms (back to back) and a second band 11–16 ms (after a pause of 200 ms). Opponent bars land on the axis one at a time: CPU highlighter 2.1 s, CPU search 14 s, RegExp ten patterns 8–43 ms, backtracking RegExp 2.1 s, 8 workers 1.9–6.7 ms, 16 workers 1.3–4.0 ms. Each bar gets a verdict stamp (wins / mixed / loses). A second small panel plots the crossover on a document-count axis. At the end a status ladder: holds · narrowed · historical · open.

Camera: drive a `cam` channel with `cameraInterp`; push in on each beat's subject, pull back for comparisons. Keep y ≳ 630 free.

### Beat sheet

1. Empty log axis and the GPU band appear; title tag `100,000 documents`. *(1)*
2. CPU bars slide in at 2.1 s and 14 s; multiplier badge `200 – 40,000×`; stamp WINS. *(2)*
3. RegExp ten-pattern bar 8–43 ms lands above the GPU band; stamp `1.5–9× faster`. *(3)*
4. The pause band appears (11–16 ms); a ten-dot strip shows 7 green, 1 neutral, 2 red (date, `connection reset`). *(4)*
5. Backtracking bar `2.1 s` vs a tiny GPU 5–12 ms sliver; stamp WINS. *(5)*
6. Small side panel: document count 100 → 100,000; the GPU line floors flat then rises; RegExp rises from zero; crossovers marked `~2,000–13,000` and `15,000–54,000`, with an 'interpolated' tag. *(6)*
7. Worker bars 1.9–6.7 and 1.3–4.0 ms cover the GPU band; stamp LOSES. *(7)*
8. Highlighter from text: `0.15 s` vs `0.12–0.15 s` tie bars. *(8)*
9. A red pen strikes three claims; their corrected versions replace them. *(9)*
10. Status ladder: holds / narrowed / historical / open; `open` items pulse (pause slowdown, other GPUs). *(10)*
11. Axis fades to ≤ 0.15; the four-step recap strip (thread per document → pattern as data → packed words → scoreboard) across. *(11)*
12. The honesty line on an opaque panel. *(12)*

### Captions (spoken verbatim)

1. So is the GPU clearly faster? That depends on who it races. Each opponent gets a bar on one time axis, all for a hundred thousand documents. `[lab/json-search/README.md:118-131]`
2. Against the same programs on the CPU, yes. The highlighter takes about 2.1 seconds, extrapolated, and a search 14 seconds. That is 950 to 3,100 times the GPU's time. `[lab/json-search/README.md:118, 129]`
3. Against the browser's RegExp on one thread, counting every match of nine ordinary patterns in 8 to 43 milliseconds, the GPU is 1.5 to 9 times faster when searches follow each other. `[lab/json-search/README.md:121-122]`
4. At a keystroke, after a pause, the search takes 11 to 16 milliseconds. It beats RegExp on seven of ten patterns, ties one, and loses on a date and on connection reset. `[lab/json-search/README.md:123, 162]`
5. On a pattern that makes RegExp backtrack, RegExp takes 2.1 seconds. The GPU takes 5 to 12 milliseconds. `[lab/json-search/README.md:124]`
6. The crossover is about 2,000 to 13,000 documents back to back, and 15,000 to 54,000 after a pause. Those counts are interpolated between four measured sizes. `[lab/json-search/README.md:160]`
7. Against JavaScript in several workers, no. Eight workers count a pattern's matches in 1.9 to 6.7 milliseconds, where the GPU takes 4.5 to 5.2 back to back. Workers were not timed after a pause. `[lab/json-search/README.md:126; lab/status.md:120]`
8. For validating from raw text, it is not clearly faster either: 0.15 seconds on the GPU against 0.12 to 0.15 for a plain JavaScript highlighter. `[lab/json-search/README.md:129, 141]`
9. A review corrected the first write-up where it had claimed more than the measurements show. The CPU times and crossover counts were narrowed, and the one-core baselines were disclosed. `[lab/status.md:107; README.md:787-813]`
10. Still open: why a search after a pause takes longer, which the lab says it did not find, and any other GPU or browser. The first-stage programs were removed, and survive in a tag. `[lab/status.md:114, 127; README.md:208, Not done]`
11. So: a thread per document, a pattern kept as data, states packed into words. Faster than the same program on the CPU, often faster than RegExp, not faster than workers. `[lab/json-search/README.md:129-131]`
12. The lab itself says a demo is honest if it says what it shows, and not if it claims to beat RegExp on every pattern, or JavaScript in several workers. `[lab/json-search/README.md:131]`

### On-screen labels

`100,000 documents`, `GPU · back to back 4.5–5.2 ms`, `GPU · after 200 ms pause 11–16 ms`, `generated JavaScript 2.1 s · 14 s`, `executor 8.4–9.2 s · 3.2 min`, `RegExp 8–43 ms`, `([a-z]+)+x · 2.1 s vs 5–12 ms`, `\d\d\d\d-\d\d-\d\d`, `connection reset`, `8 workers 1.9–6.7 ms`, `16 workers 1.3–4.0 ms`, `JSON.parse 77.7 ms → 6.19 ms (16 workers)`, tag `json-regex-experiments-2026-10`.

