# Handwired: UI Exploration
- **Title:** UI Exploration
- **Subtitle:** One night, one question: how far can a fixed circuit write a user interface?
- **Animal:** raccoon
- **Accent:** #4f7fd8
- **Source:** chenglou/handwired @ 4ea7fcb, `lab/ui-exploration`. Status: historical record (measurements describe the code as it was then; the index read landed in the runtime; decisions 4-8 open).
- Dates: README says September 12-13, 2026; `lab/status.md:290` says 12-14. Narration says only "one night in September 2026".

## Chapter 1: Count, Don't Search

**Thesis:** Two loops that look sequential, picking a list's first row and breaking a paragraph into lines, become counts of yes-or-no bits.

**Visual machine:** Two scenes share one stage. Left: a ten-thousand-row list strip with a viewport window and a scroll-position marker; right: a row of text segment widths under a max-width line.

**Captions**
1. Handwired's author spent one night in September 2026 asking how far a fixed circuit of weighted sums and relu goes for writing a user interface. JavaScript only writes inputs and reads outputs. [README.md:5]
2. The circuit has no loops and no search. So the trick, again and again, is to rewrite a search as a count: when a yes-or-no test flips exactly once along a line, add up the ones. [README.md:49-62]
3. Take a list of ten thousand rows with room for a few on screen. Which row comes first? Divide the scroll position by the row height and round down. That is exact. [lists/list.ts:68-69]
4. The circuit does just that, then takes that row number modulo the number of slots, so each row always lands in the same slot. JavaScript first floors the scroll position to a quarter pixel. [lists/list.ts:21-22, :68-69]
5. Each slot also gets a visibility bit: is the row's top above the viewport's bottom edge? One comparison per row, and the bit is exactly zero or one. [lists/list.ts:91]
6. With uniform row heights and row data kept in JavaScript, the whole virtualized list is two hundred eighty operations in nineteen layers, whether it has one thousand rows or one hundred thousand. [lists/README.md:82-84; README.md:72]
7. Scope matters. Put the row data into the circuit's own source cells instead, and the same list costs twenty thousand three hundred five operations. [README.md:72]
8. Now text. To break a paragraph into lines you would walk word by word until one no longer fits. That is a loop, and the circuit can't loop. [text-walker/fast-walker.ts:19-24]
9. But for a line starting at some segment, each later segment either fits within the maximum width or doesn't, and the answers always read one, one, one, zero, zero, zero. [text-walker/fast-walker.ts:19-22]
10. So the first segment that doesn't fit is just the count of fit bits. The next line starts that many segments along, skipping spaces, and its painted width is a sum gated by the same bits. [text-walker/fast-walker.ts:22-23]
11. At lab scale, forty-eight words in ninety-five segments flow around a window in fourteen thousand seven hundred sixty operations and two hundred fifteen layers, with ninety-six word springs. [text-walker/README.md:164; README.md:80]
12. Lines still come one after another, so depth grows with every line. Walking lines is a sequential scan that the lab's rewrites shrink but don't remove. [README.md:94]
13. That's the pattern: when a predicate flips once, count it. Counting turned a search into arithmetic that a fixed circuit can do. [README.md:49-52]

**Beat sheet** (caption numbers in brackets)
1. Scroll marker over 10,000 row strip: scrollTop snaps to 1/4 px, first = floor(scrollTop / rowHeight) [captions 3, 4]
2. Slots light with visibility bits; counter reads 280 ops / 19 layers, 20,305 ops with data in source cells [captions 5, 6, 7]
3. Text: worked example segment widths vs maxWidth + epsilon; fit bits 1 1 1 0 0 0 light left to right [captions 8, 9, 10]
4. Lab size stamp: 48 words, 95 segments, 96 springs, 14,760 ops, 215 layers [captions 11, 12]
5. Recap: two searches become counts [captions 1, 2, 13]

**On-screen labels:** Scroll marker over 10,000 row strip: scrollTop snaps to 1/4 px, first = floor(scrollTop / rowHeight); Slots light with visibility bits; counter reads 280 ops / 19 layers, 20,305 ops with data in source cells; Text: worked example segment widths vs maxWidth + epsilon; fit bits 1 1 1 0 0 0 light left to right; Lab size stamp: 48 words, 95 segments, 96 springs, 14,760 ops, 215 layers; Recap: two searches become counts

## Chapter 2: One Program, Many Photos

**Thesis:** Write the per-item program once and run it as instances, step springs as a matrix power, and read an array with one index operation.

**Visual machine:** A 221-photo gallery grid. Left half copies the circuit once per photo so the stack grows; right half stamps one per-photo program across an instance axis. A log-scale bar pair below tracks microseconds.

**Captions**
1. The lab ports the 221-photo gallery from Cheng's website. Copying the whole circuit once per photo costs fifty-seven thousand one hundred thirty-five operations in sixty-seven layers, and it grows with every photo. [instanced-items/README.md:116; README.md:77]
2. Write the per-photo program once instead, and run it as instances. An instance axis repeats it for every photo, with reductions between stages for what photos share. [instanced-items/README.md:5, :261]
3. Four hundred one operations are shared. Each photo then costs two hundred thirty-three operations, at two hundred twenty-one photos, at one thousand, and at ten thousand. [instanced-items/README.md:164, :178, :261]
4. On the processor, that is sixty-five microseconds against five hundred forty-six for the duplicated circuit at two hundred twenty-one photos. Timings are rough. [instanced-items/README.md:266, :183]
5. At ten thousand photos it is four thousand one hundred six microseconds against forty-three thousand twenty-seven. The staged program scales; the copied one drowns. [instanced-items/README.md:266]
6. Springs are the next loop. One semi-implicit Euler step updates a spring's velocity from stiffness and damping, which is a two-by-two matrix acting on its distance from the destination and its velocity. [event-time/spring-math.ts:5-8, :33-39]
7. So catching up many fixed steps is that matrix raised to a power. In the spring bank that cut the circuit from five thousand two hundred fifty-three operations to three thousand five hundred eighty. [event-time/spring-math.ts:44; README.md:53]
8. Arrays are the next. Reading values at an index used to take a one-hot and a sum. The runtime now has an index read instruction, and reading one element is a single operation. [src/runtime/numeric-ui-core.ts:467-470; README.md:29]
9. The README says it changes the cost of lists, text and slot routing more than anything else measured. That's its comparison, not a ranking. It's landed in the runtime. [README.md:134]
10. It doesn't remove every scan. With index reads, pointer jumping gets the line count and widest line of a paragraph with one thousand twenty-three segments in sixty-six layers. [README.md:94]
11. The gallery also has a catch. Far down it, pointers inside a band of about a fifth of a pixel between native box edges and the circuit's got a different hover and click. [README.md:23]
12. So the instance axis, matrix powers and index reads each trade a loop for arithmetic. Each has a scope, and the gallery is the one UI where exact order of operations mattered beyond rounding points. [README.md:40-41]

**Beat sheet** (caption numbers in brackets)
1. Gallery grid of 221 thumbnails; left stack of circuit copies reads 48,411 ops / 61 layers [captions 1]
2. Instance axis: one per-photo program stamped over photos; labels shared 401, photos 233; photo count slider 221 / 1,000 / 10,000 [captions 2, 3]
3. Log-scale bars: staged 65 / 310 / 4,106 microseconds vs duplicated 546 / 2,569 / 43,027; caption rough CPU [captions 4, 5]
4. Spring phase plot with a 2x2 matrix, M^N catch-up; counter 5,253 / 192 to 3,580 / 137 [captions 6, 7]
5. values[index] as one op; pointer jumping chain 1,023 segments in 66 layers; 0.18 px band on a hover edge [captions 8, 9, 10, 11, 12]

**On-screen labels:** Gallery grid of 221 thumbnails; left stack of circuit copies reads 48,411 ops / 61 layers; Instance axis: one per-photo program stamped over photos; labels shared 401, photos 233; photo count slider 221 / 1,000 / 10,000; Log-scale bars: staged 65 / 310 / 4,106 microseconds vs duplicated 546 / 2,569 / 43,027; caption rough CPU; Spring phase plot with a 2x2 matrix, M^N catch-up; counter 5,253 / 192 to 3,580 / 137; values[index] as one op; pointer jumping chain 1,023 segments in 66 layers; 0.18 px band on a hover edge

## Chapter 3: What Held, What Narrowed

**Thesis:** A drag solver, a combined circuit, learned gates and timing each get a verdict with their scope, and the lab stays a historical record.

**Visual machine:** A ledger tape with a funnel of drag frames on the left (two bar pairs for app shell and candidate gallery) and stamped claim cards sliding in on the right: held, narrowed, open.

**Captions**
1. A designer drags a card's edge in the app shell. One backward pass asks which of five design numbers should move, padding, gap, minimum card width, sidebar width or title scale, and takes a gradient step. [drag-knobs/README.md:5-9]
2. The test is five hundred scripted drags of six frames each. Of those, two thousand nine hundred ninety-nine frames actually move. [drag-knobs/README.md:80; report.ts run]
3. With booleans frozen, one gradient step solved sixty-three point six percent of those moving frames. That is the app shell only. [drag-knobs/README.md:80]
4. The same strategy on the candidate gallery solved thirty-seven point six percent of fifteen hundred moving frames. [drag-knobs/report.ts run]
5. Decisions are why. Inside a decision region the gradient is the true slope; across one it is zero or misleading. At the start, every unlocked knob had a zero gradient in twenty-four point six percent of app shell frames. [drag-knobs/README.md:5-9, :80]
6. Then search takes over: two hundred fifty-six candidate knob settings run as instances of the same circuit, and the closest valid one wins. The instance axis again. [drag-knobs/README.md:5-9]
7. Zoom out. Most of the user interface logic the prototypes ported became a circuit: lists, springs, layout, the gallery, a comment thread. [README.md:45-46]
8. Combining the wins was richer, not cheaper: nineteen thousand eight hundred fifty-four operations with word springs, eighteen thousand twenty-seven without, versus five thousand two hundred fifty-three before. [README.md:39]
9. Learning was weak. None of forty-eight runs learned a task exactly at base settings, though counting units did learn one rung exactly when trained on every case. [lab/status.md:204; learned-bits/README.md:101, :129]
10. In chenguini's demos, a new spring destination mid-animation lands one hundred fifty-seven pixels apart between thirty and one hundred twenty frames per second. The runtime now steps springs to each event's time. [README.md:110]
11. And zero mismatches always means over the traces named, not a proof. In lists at one hundred cards, seven of twenty runs flipped a settle decision, and positions differed by up to twenty-one pixels. [README.md:108]
12. The status page calls this folder the record of that exploration: its measurements describe the code as it was then. Index reads landed; what agents build apps from stays open. [lab/status.md:290, :181-190]
13. So: a fixed circuit can write much of a user interface, by counting, instancing and matrix powers. It is richer, not cheaper, and learning it is still mostly open. [README.md:39; lab/status.md:290]

**Beat sheet** (caption numbers in brackets)
1. Drag frames funnel: 2,999 moving frames; bar 63.6% app shell vs 37.6% candidate gallery (1,500 frames), strategy B frozen booleans [captions 1, 2, 3, 4, 5]
2. Search: 256 knob candidates as instances; 24.6% zero-gradient frames [captions 5, 6]
3. Ledger stamps: combined 19,854 / 18,027 vs 5,253; learned 0 of 48 at base settings; 157 px apart 30 vs 120 frames per second [captions 7, 8, 9, 10, 11]
4. Status stamp: Historical; landed index read; open decisions 4-8 [captions 12, 13]

**On-screen labels:** Drag frames funnel: 2,999 moving frames; bar 63.6% app shell vs 37.6% candidate gallery (1,500 frames), strategy B frozen booleans; Search: 256 knob candidates as instances; 24.6% zero-gradient frames; Ledger stamps: combined 19,854 / 18,027 vs 5,253; learned 0 of 48 at base settings; 157 px apart 30 vs 120 frames per second; Status stamp: Historical; landed index read; open decisions 4-8
