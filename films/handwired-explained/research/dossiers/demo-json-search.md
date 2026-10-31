# Dossier: Demo 2: JSON Search over 100,000 Documents per Keystroke on WebGPU

- Topic id: `demo-json-search`
- Era: September 17 to October 16, 2026 (the experiments that led to it, then the demo, then the cleanup)
- Subject pinned at: `chenglou/handwired@257856e`, committed 2026-10-16 17:33 -0700. Local clone: `.orly-work/repos/handwired`.
- As-of date: 2026-10-27
- Citation style: a repo path with line numbers at the pinned commit, e.g. `src/json-search/README.md#L53`. Every such citation resolves as `https://github.com/chenglou/handwired/blob/257856e/<path>#L<n>`; the numbered list in section 11 gives the full URLs. Commit hashes and dates come from `git log` in the clone. Two web checks confirmed that the pinned README files are public as quoted (S1, S2).
- Not run: the researcher's attempt to run `bun lab/json-search/report.ts loops` in the clone was blocked by the sandbox's permission policy, so this dossier has **no [RUN] numbers**. Every number is quoted from the repo's own docs, which record their own commands and machines. A later stage that can run code should re-check the operation counts (37 / 240 / 18,961 / 122,888) with `bun lab/json-search/report.ts loops` and the test count with `bun test --timeout 30000 tests/json-search`.

---

## 1. Summary

**What it is.** JSON search is the third demo of Handwired's demo site, after HandwiredOS and the learned gallery, and the only part of the repo that uses WebGPU. The page is `assets/json-search.html`, served at `json-search/`, live at https://chenglou.me/handwired/json-search/. Its README opens with this sentence:

> "A page that searches 100,000 generated JSON documents again at each keystroke, on the GPU, with two fixed numeric programs." (`src/json-search/README.md#L3`)

The two programs:
- **A JSON highlighter.** It reads up to 512 code points per document and returns a display kind per character, the first error, and whether the text is valid.
- **A regex search.** It reads a document and a pattern, both from cells, and counts the pattern's matches.

Both are "weighted sums, ReLU gates and table reads, written by builder code, and none of their weights is trained" (L3).

The top-level README states the claim in one line: "achieving GPU-level of parallelism with JS code that was written in a traditional single-threaded way (see the JSON search demo that runs in milliseconds over 100k documents)" (`README.md#L36`).

**Is it really 100,000?** Yes, on a wide window. There are three exceptions:
- A window narrower than 720 px, such as a phone, gets **20,000** documents (`src/json-search/README.md#L47`; the cutoff is `matchMedia('(max-width: 719px)')` in `src/json-search/demo.ts#L217`).
- A GPU whose buffers hold fewer documents gets the count that fits. The README's example sentence is "One buffer of this GPU holds 65,000 documents…" (L48).
- A device created with WebGPU's default limits binds 128 MiB per storage buffer. That is **65,408** documents (L78). The W3C spec's default `maxStorageBufferBindingSize` is 134,217,728 bytes (S3), and 134,217,728 / 2,052 bytes per document = 65,408.

**Why the GPU, and why it is parallel.** "A GPU is of no use for one document, since a round trip to the GPU alone takes 0.6 ms or more. It is for many documents: every document runs the same operations and reads no other document's values, so one pass runs them all." (L3)

Each program is written as **one position's work**, a "step", that a shader runs in a `for` loop over a document's 512 positions. **One GPU thread runs one document** (`loop-emit.ts#L1-L3`), with a workgroup size of 64 (`loop-emit.ts#L65`).

**The headline numbers.** All are on an Apple M5 Max in Chrome 155 with 100,000 documents (`src/json-search/README.md#L53`):
- **11 to 15 ms per keystroke** on the GPU, depending on which of the three programs (8, 16 or 32 states) the pattern runs on.
- **RegExp on one thread: 8 to 28 ms** for ordinary patterns. Examples: 9 ms for `\d\d\d\d-\d\d-\d\d`, 21 ms for `error`, and **2.1 s for `([a-z]+)+x`**, which makes RegExp backtrack.
- **On the CPU**, the same programs take **13 s** for one search on the smallest program.
- The page's own example line: "10,559 of 100,000 documents match. This program: 13 ms on the GPU. Native RegExp: 21 ms." (L30)

**The honest verdict, in the repo's own words.** "So neither the search nor RegExp is always faster, and the line gives both times for every pattern." (L53)

The lab's longer answer has three parts:
- The GPU beats the same programs on the CPU "by 200 to 40,000 times".
- It beats RegExp on one thread for most ordinary patterns at a keystroke, but not all.
- It does **not** beat JavaScript spread over 8 workers (`lab/status.md#L118-L120`; `lab/json-search/README.md#L118-L131`).

**The key engineering moves.** There were two:
1. **Writing each program as a loop over positions instead of written out per position.** This cut the search shader's compile time from **107 to 130 s** to about **0.05 to 0.1 s** (`lab/json-search/README.md#L55`).
2. **A second shader writer, `bit-emit.ts`, added on 2026-10-14.** It proves which values are whole numbers or bits and writes groups of table reads as one AND of two 32-bit words. It does this **without changing the program**. The 32-state search went from **945 ms to 5.2 ms** back to back (`src/json-search/README.md#L185-L189`).

**The experiments' fate.** The JSON highlighter and regex search began as two separate experiments on 2026-09-17. They had their own demo-site pages on 2026-10-13. On **2026-10-14** both were removed, in two steps. First the pages left the demo site, "since the JSON search's page runs both programs" (`lab/status.md#L97`). Later that day the experiments' code was removed at Cheng Lou's request ("the demos should disappear", `lab/status.md#L127`), in commits authored 18:09 to 19:53. The tag `json-regex-experiments-2026-10` (commit `4a80450`) preserves them whole (`lab/status.md#L97`, `#L125-L127`). [Fact-check: the reason "the page runs both programs" belongs to the page removal; the request belongs to the code removal.]

---

## 2. Timeline

All times are -0700 (US Pacific), from `git log` in the clone unless a doc is cited. They are **author** dates. The removal commits `dd7ad58` to `6bf76f2` were re-committed at 23:19 on 2026-10-14 (committer date), so `git log` without `%ai` shows 23:19 for all of them.

| Date | Event | Source |
|---|---|---|
| 2026-09-17 05:15 | `lab/json-highlighter` added: "one program highlights a JSON text of up to 512 code points on every keystroke" (commit `2531be1`) | git log; `lab/status.md#L236` |
| 2026-09-17 05:16 | `lab/regex-search` added: "search as you type where one program runs a pattern's automaton as products of 0/1 state vectors with transition matrices" (`09619be`) | git log; `lab/status.md#L237` |
| 2026-09-17 08:05 | Regex search's form (c) added: the automaton's steps combined in a tree of matrix products, run on WebGPU one dispatch per level (`91ad43c`). It tested Cheng's idea of running a program's matrix multiplications "as a few batched GEMMs" | git log; `lab/status.md#L237` |
| 2026-09-18 06:10 | JSON highlighter promoted into `src/json-highlighter` as "the second app in src/" (`51478c5`) | git log; `lab/status.md#L236` |
| 2026-10-06 | Repo renamed from Indirect to Handwired (`e86f5ed`) | git log; `lab/status.md#L287` |
| 2026-10-13 07:58 | `lab/json-search` added: a WGSL emitter with index reads, the highlighter compiled for many documents, and a document generator (`9059181`) | git log |
| 2026-10-13 08:46 | WebGPU host and measurement page: "100,000 documents in 3.75 ms with the documents on the GPU, every readback equal to the executor" (`bfd30f4`) | git log; `lab/json-search/README.md#L54` |
| 2026-10-13 09:01 | First json-search README, about the **highlighter half only**: "the GPU is clearly faster from about 10,000 JSON documents that stay on the GPU, and not when every evaluation uploads them" (`0732d26`). One minute later `d79d9aa`, "Correct three sentences of json-search's README that claimed more than was measured", fixed three *other* sentences: a count of compared values, an unrun failing case on default limits, and a table note. It did **not** retract "clearly faster". The later review that day did (L794) | git log; `git show d79d9aa` |
| 2026-10-13 09:43 | "Run regex search's own step in a loop over each document's positions: a 495-statement shader that compiles in about 0.1 s instead of 107 to 130 s" (`d550dc7`) | git log |
| 2026-10-13 09:49 | Highlighter's step written as a loop too: "37 operations and a 106-statement shader" (`4ff937a`) | git log |
| 2026-10-13 09:58 | `searcher.ts` added: "validate many JSON documents once, then search them per keystroke, on the GPU or on the CPU with the same interface" (`5023831`) | git log |
| 2026-10-13 (same day) | A review "corrected its first answer, which had claimed more than the measurements show" | `lab/status.md#L107`; `lab/json-search/README.md#L787-L805` |
| 2026-10-13 13:01 | "Add the page that searches 100,000 JSON documents on the GPU: lab/json-search/demo.html" (`11a158f`) | git log |
| 2026-10-13 18:09 | "Rebuild the JSON search page as a simpler page: a field with two toggles, one line of numbers, one map, one document" (`7ea1525`) | git log |
| 2026-10-13 | Demo site has pages for the JSON highlighter (`json-highlighter/`) and regex search (`regex-search/`) besides JSON search | `lab/status.md#L97` |
| 2026-10-14 00:25 | "Experiment: a million JSON documents, hand-written kernels against regular JavaScript, before building anything" (`93ce3ea`) | git log; `lab/json-search/million/README.md#L5` |
| 2026-10-14 03:30 | `4a80450`, the last commit with both experiments whole. The tag `json-regex-experiments-2026-10` points here | git; `lab/status.md#L127`; S4 |
| 2026-10-14 04:35 | "JSON search: a second WGSL writer for loop programs that holds whole numbers as integers and packs gated reads into words" (`87b38f5`, bit-emit.ts) | git log; `lab/status.md#L116` |
| 2026-10-14 13:15 | JSON search promoted from `lab/json-search` into `src/json-search` (`40dfd52`) | git log; `lab/status.md#L103` |
| 2026-10-14 18:09 to 19:53 | The removals: `lab/regex-search` (`dd7ad58`), the highlighter's other forms (`36b4734`), regex search with every position written out (`ecf9b8a`), and the first GPU stage (`d35bd11`, `442bded`) | git log; `lab/status.md#L129-L134` |
| 2026-10-14 21:03 | `lab/status.md` records the removal "with the tag and where the lessons are" (`e38f164`) | git log |
| 2026-10-14 22:12 to 22:52 | Four reviews of the removal; tests rise from 182 to 184 (`4f885ad` to `6bf76f2`) | `lab/status.md#L155-L159` |
| 2026-10-15 00:35 | "Entry docs: what four readers without any background tripped on" (`4ea7fcb`), the last commit touching `src/json-search` before the pin | git log |
| 2026-10-16 17:33 | Pinned commit `257856e`. `src/json-search`, `lab/json-search`, `tests/json-search`, `lab/status.md` and `README.md` are byte-identical to `4ea7fcb` (`git diff --stat` empty) | git |

---

## 3. People

**Cheng Lou (`chenglou`).** Author and owner of the repo (`github.com/chenglou/handwired`). Per the brief, nothing is used beyond what the repo says.

What the repo records him asking or saying on this topic:
- He asked the question that started the demo: "I was wondering if there's a point where regex search or json highlighter, or a combination of these into the same app, is clearly more performant from the gpu parallelism? Then we can make a demo where we search a ton of jsons or something" (`lab/json-search/README.md#L52`).
- He asked about a million documents: "I was thinking about 1 million documents, optimized kernels vs regular idiomatic js. Thought I don't know what the numbers would look like. Maybe we should check before we build it. Esp since 1M docs in browser might be a lot" (`lab/json-search/million/README.md#L5`).
- He asked whether "the program as written change[s]? Or it's just compiler optimizations we need?" (`million/README.md#L139`).
- He ordered the experiments removed (quotes in section 6).

What he believed, as the repo states it:
- That the approach can achieve "GPU-level of parallelism with JS code that was written in a traditional single-threaded way" (`README.md#L36`).
- That "the docs and the tutorial and templates are the entrypoint for ppl when we release" (`lab/status.md#L127`).

**Depiction.** The repo contains no physical description, photo or biography of Cheng Lou. **Do not invent a likeness.** For a respectful silhouette, use a generic, featureless figure at a desk: no identifying build, hair or glasses, and contemporary 2026 casual clothing. The film should present him only as "the author" asking questions, voiced through the quoted text.

**The agents and reviewers (unnamed).** The repo refers to "the measuring agent", "a review", "two reviewers", "four reviews" and "other agents' jobs" on the same machine:
- "The measuring agent wrote by hand what such a rewrite would give" (`million/README.md#L27`).
- "Measured on October 13 and 14, 2026 on one Apple M5 Max (18 cores, 36 GB) in headless Chrome 155, while other agents' jobs ran on the same machine" (`million/README.md#L9`).

These are not named people. Depict them as abstract helpers (paper-cut automata or clerks), never as identifiable humans. [Fact-check correction: the repo *does* name a tool. Every commit up to the pin is authored as "Cheng Lou", and 756 of the 825 carry the trailer `Co-Authored-By: Claude Code <noreply@anthropic.com>` (`git log 257856e --format='%(trailers:key=Co-Authored-By,valueonly)'`). The lab READMEs also speak as "I" in places, e.g. "I didn't find out why" (`lab/json-search/README.md#L799`). The docs name no model or version, so the film must not name one. It may say the commits credit a coding agent, Claude Code, as co-author.]

---

## 4. The belief of the age

**The belief (inside the project, early on 2026-10-13).** For the JSON highlighter (the regex half wasn't measured yet), the GPU was "clearly faster" for documents that stay on the GPU. The first README commit (`0732d26`, 09:01) was titled "the GPU is clearly faster from about 10,000 JSON documents that stay on the GPU, and not when every evaluation uploads them". The claim was hedged from the start: its own body says that with an upload per evaluation the gain "isn't a clear win".

**Who corrected it, and how fast.** The project itself did, within the same day:
- `d79d9aa`, one minute later: "Correct three sentences … that claimed more than was measured". [Fact-check: those three sentences were a count of compared values, an unrun failing case, and a table note (`git show d79d9aa`). The "clearly faster" headline was not among them, so the film must not present `d79d9aa` as the retraction.]
- Then a formal review "a few hours after that day's measurements" (`lab/json-search/README.md#L789`). After it, the summary "no longer call[s] the highlighter's part of a combined app clearly faster" (L794). This is the actual walk-back.

The review "found no defect in the programs, the shaders, the host or the searcher", but found problems in the write-up (L791-L805):
- **A second pass had been compared with a first one.** "Validated and highlighted on the GPU in 2.2 ms, where JavaScript takes 146 ms" set a pass over documents already on the GPU against JavaScript's first pass. From the texts, the GPU's answers arrive after 0.13 s against JavaScript's 0.12 to 0.15 s (L794).
- **Every baseline had run on one of 18 cores.** With 8 workers, RegExp beats the GPU (L795).
- **"A few ms per keystroke" was 7.6 to 17.6 ms** (L800).

**The corrected belief (2026-10-13, loop-emit shaders).** Against RegExp on one thread the GPU was "about even", and only for short patterns. Longer patterns were slower: 64 ms at 16 states and 0.87 s at 32 (`lab/status.md#L111`).

**What changed it again (2026-10-14).** bit-emit.ts. Against RegExp on one thread the GPU was "no longer about even": with searches back to back it took 1.5 to 9 times less on every pattern measured. After a pause it took less on seven of ten, about the same on one, and more on two, a date and `connection reset` (`lab/status.md#L119`).

**What still holds (dissent built into the docs).**
- "Against JavaScript in 8 workers: still no." (`lab/status.md#L120`)
- "It isn't honest if it claims to beat RegExp on every pattern, or JavaScript in several workers." (`lab/json-search/README.md#L131`)
- "The comparison with one thread flatters the GPU." (`lab/json-search/README.md#L918`)

**Wider field context (brief, optional).** The search avoids backtracking by simulating a set of automaton states in parallel. That method goes back to Ken Thompson's 1968 CACM paper "Regular expression search algorithm", and Russ Cox's 2007 essay "Regular Expression Matching Can Be Simple And Fast" contrasts it with backtracking engines (S5). Browser engines still backtrack:
- V8's Irregexp is a backtracking engine.
- V8's own blog gives `/(a*)*b/.exec('a'.repeat(100))` as an example that "does not finish within our lifetimes if executed by Irregexp".
- V8's linear-time engine is "available behind the feature flags", not on by default (S6, 2021-01-11).

This is the background to why `([a-z]+)+x` takes RegExp 2.1 s but the program 11 ms. The repo does not cite Thompson or Cox; the film may use this only as framing.

---

## 5. Experiments and results

### 5.1 The machine and setup ("apparatus")

**Hardware.**
- One **Apple M5 Max laptop-class chip, 18 cores, 36 GB** (36 GiB per `lab/json-search/README.md#L608`), running macOS 27.0 and Bun 1.4.3.
- **Headless Chrome 155** through **Metal**: Google Chrome 155.0.8059.40 on 10-13 and Chrome for Testing 155.0.8059.79 on 10-14 (L608).
- Cross-origin isolated, so that `performance.now()` reads in 5 µs steps (L37).
- Other agents' jobs ran on the same machine, at 1-minute load averages "from 2.5 to 23" (L608).

**Harness.** Each run script launches its own headless Chrome on a fresh profile folder, serves the page, records the load average next to every timing, and compares every value read back from the GPU with a CPU-computed value (L37, L911). "Every run was headless", so there was no real display (L941).

**For the art department.** The apparatus is a single laptop whose screen is *not* used. Chrome runs invisibly, the GPU does the work, and a terminal prints tables. The visible artefact is the demo page:
- a pattern field with two toggles, All / Keys / String values and GPU / CPU;
- one line of numbers;
- a **map**, one cell per document, row after row. A matching document is **copper**, and its mark is drawn larger than its cell, about 2 CSS px among 100,000, so a single match is visible;
- one document shown below, colored by kind with the matches marked (`src/json-search/README.md#L27-L37`).

The index card's picture is a grid of small marks with larger copper marks scattered over it (`assets/demos.html#L174-L199`).

### 5.2 The documents

The documents come from `documents.ts`: `documentAt(seed, index, invalidFraction)`. Every choice is "a hash of the seed, the document's index and a counter, and no `Math.random`", so any document can be made without the ones before it (`src/json-search/README.md#L205`).

**Contents.**
- **7 shapes:** package manifests, user records, log events, editor settings, orders, map features, sensor readings.
- **4 ways of writing** (one line, spaced, 2-space indent, tabs).
- **16 defects**, but **none on the demo page**. The measurement sets have 1 in 10 broken (L21, L205; `lab/json-search/README.md#L187-L189`).
- Non-ASCII examples: `"Søren Müller"`, `"東京"`, `"µg/m³"`; 15% of documents write such characters as `\u` escapes (`lab/json-search/README.md#L187-L188`).

**Sizes.**
- The page says "about 300 characters each" (`src/json-search/README.md#L21`).
- The measurement set (seed 20261013) has lengths from 1 to 1,529 code points: quartiles 215 / 300 / 387, mean 301.2.
- Of that set, 89,943 are valid and 10,057 broken; 601 are longer than 512 (the `tooLong` ones) (`lab/json-search/README.md#L193-L199`).

**A document's cells.** 512 code points, -1 past the end, plus the length: **513 float32 = 2,052 bytes**, so 100,000 documents are **205.2 MB** (`src/json-search/README.md#L106`; `program.ts#L1-L2`, `#L13-L30`).

### 5.3 How the programs are built (the files)

**`program.ts`** (30 lines) is `writeDocumentCells`. It turns a string into cells. A surrogate pair counts as one code point, and the length is capped at 1,048,576 (`program.ts#L7-L30`).

**`loop-program.ts`** is "a program as loops over a document's positions". It has these parts:
- **stages:** compiled programs that run forward or backward;
- **registers:** numbers carried from one position to the next;
- **fields:** one number per position, written by one loop and read by a later one;
- **outputs.**

The README gives it in JS form (`src/json-search/README.md#L114-L124`):

```js
for (let position = 0; position < positions; position++) {
  const values = step(codePoints[position], carried) // the compiled step, e.g. 37 operations
  carried = values.next
  perPosition[position] = values.kept
}
```

**`json-step.ts`, the highlighter's step** (`src/json-search/README.md#L130-L145`; `json-step.ts#L1-L35`). At each position it computes:
1. the character class, from a 129-cell table;
2. the tokenizer event and next state, one read at (state, class);
3. the depth, as a running total of ±1;
4. the container kinds, as one integer running total of ±2^depth ("a stack of one bit per level");
5. the grammar state, from an 8-state machine, in one read;
6. the display kind and error kind.

Sizes:
- **37 operations per position, 12 of them table reads.**
- An end step of 17 operations.
- **18,961 operations per document.**
- The `inObject` check is "a sign cascade of 17 operations" because one step serves every position, so it gets position 511's range, where differences reach 2^24.
- The first error's position "is a count", because the error state never goes back.
- Named fallbacks: `tooDeep` at the 17th nested opener, `tooLong` at code point 512.

**`search-step.ts`, the search's step** (`src/json-search/README.md#L149-L173`; `search-step.ts#L1-L27`). The search runs **two passes**, "since a longest match is only known after reading past its end, and a program can't go back". The stages:

| Stage | Runs | Operations at 8 / 16 / 32 states |
|---|---|---|
| start | once | 8, 16, 32 |
| reverse | from the last position down | 148, 356, 1,156 |
| forward | from position 0 up | 92, 308, 1,124 |

- The step totals 240 operations at 8 states (`search-step.ts#L1-L2`). [Fact-check note: 240 = 148 + 92 is the **unmasked** step, which the tests pin (`tests/json-search/search.test.ts#L190`). The page's searcher reads display kinds, so its reverse step is 151 operations, and its step is 151 + 92 = **243** (`tests/json-search/searcher.test.ts#L121`). By the README's formula that is 8 + 243 × 512 = 124,424 operations per document. That figure is computed here; the repo does not state it. On screen, say "240 operations" only for the plain search step.]
- **A 512-position document is 122,888 / 339,984 / 1,167,392 operations** at 8 / 16 / 32 states (README L157).
- **The automaton is data.** "Its transition matrix for each character class, its accepting states and the class of every code point sit in cells, so a new pattern writes cells and changes no program." A new pattern writes 1,097 / 4,177 / 16,481 cells. JavaScript's part of a search takes 0.03 to 0.1 ms (L149, L161).
- **State counts.** A pattern needs one state per character or class it reads, plus one: `error` = 6, `connection reset` = 17. Past 32 states the page gives a named message, e.g. "the pattern needs 33 states, and the program holds 32" (L98).
- **Masked scope.** The reverse step reads the highlighter's display kind for each code point and replaces unsearched kinds with -1. That costs 3 more operations per position. The kinds stay in a GPU buffer, so "the highlighter runs once when the documents load, and a search runs only the search" (L165-L173).
- **Integers only.** "Every value is an integer … So every operation is exact in FP32 in any order" (`search-step.ts#L25-L26`).

**`loop-emit.ts`, the first shader writer** (`loop-emit.ts#L1-L16`). It writes "each looped stage's operations … once, inside a `for` loop over the document's positions. So the shader's length is the work of one position, whatever the number of positions". It writes one f32 statement per operation, without guards. The workgroup size is 64 (L65).

**`bit-emit.ts`, the second shader writer** (1,166 lines; `bit-emit.ts#L1-L80`). It takes the same LoopProgram and writes each operation "as integer or bit arithmetic" where it can prove the value is whole (within ±2^24) or a bit. Its rules:
- **Sum:** an i32 sum.
- **Gate:** `relu(a - b)` over bits becomes `a & (b ^ 1u)`.
- **Comparison:** the gate pair for `codePoint >= boundary` becomes `u32(boundary <= codePoint)`.
- **Read:** an index read is one buffer read.
- **Packed reads:** "none of" a gate's 8 table reads becomes `(word[base] & opens) == 0u`.
- **Lanes:** one word operation updates all 8 states at once, e.g. `reached & (notReach ^ 255u)`.

"The program doesn't change". No rule names regex search or a state count (`million/README.md#L142`). The runner packs the 1,024 transition cells of an 8-state pattern into 272 words (`src/json-search/README.md#L182`).

**The two writers compared** (`src/json-search/README.md#L185-L189`):

| Search shader, reading display kinds | loop-emit.ts | bit-emit.ts |
|---|---|---|
| Statements at 8 / 16 / 32 states | 503, 1,375, 4,655 | 147, 171, 219 |
| 100,000 docs, back to back | 7.8, 69, 945 ms | 4.6, 4.7, 5.2 ms |
| After a 200 ms pause (what a keystroke gets) | 16.5, 70, 948 ms | 11.3, 11.9, 13.2 ms |

The searcher uses bit-emit for the search and loop-emit for the highlighter (107 statements), because bit-emit made the highlighter no faster (L193).

**`table-loop.ts` and `plain-search.ts`, the plain-JavaScript baseline.**
- `table-loop.ts` is "the highlighter as one plain JavaScript loop over the same tables the program reads". Unlike the program, "it stops running the grammar at the first error, which the program can't" (`table-loop.ts#L1-L7`).
- `plain-search.ts`'s `createPlainSearch(texts)` highlights once with that loop, finds each scope's runs once, then per search runs `new RegExp(pattern, 'gu')` with `.match` on each run (`plain-search.ts#L14-L107`).
- RegExp "takes the first alternative that matches where the program takes the longest match, e.g. a|ab finds a in xabx where the program finds ab" (`plain-search.ts#L7-L9`). So "the page's RegExp time is therefore a baseline and not a check. For the page's own patterns, the two counts are equal for every document" (`src/json-search/README.md#L96`).

**`demo-worker.ts`, the workers** (`demo-worker.ts#L1-L14`, `#L40-L43`). The page starts this script **twice**.

*Worker 1 times RegExp.* It runs plain-search.ts, and a pass under 100 ms is timed twice, keeping the faster (`timedTwiceBelowMs = 100`). It is a separate worker because "A RegExp that backtracks runs for seconds or minutes in one call, which nothing interrupts, so the page stops it by ending its worker". The page gives up after **10 s** (`regExpLimitMs = 10_000`, `demo.ts#L120`) and shows "Native RegExp: more than 10 s." (`src/json-search/README.md#L34`).

*Worker 2 runs the programs on the CPU* as generated JavaScript (`createCpuSearcher`):
- It runs in **pieces of about 8 ms, at most 256 documents** (`pieceMs = 8`, `mostPieceDocuments = 256`), so the map fills from the top.
- An example line: "928 of the first 8,773 documents match. This program: 2.2 s on the CPU so far."
- The highlighter runs on a document when a search first reaches it, at 93 µs per document. So the first CPU search takes about 9 s longer on the clock than the line says (`src/json-search/README.md#L39-L43`).

### 5.4 Timings per keystroke (the demo page, 2026-10-14)

Source: `lab/json-search/README.md#L66-L96`. Apple M5 Max, Chrome for Testing 155.0.8059.79, built site. Each cell is the median, with the range in parentheses.

**Load and typing, wide window (100,000 docs), the page before bit-emit → the page now:**
- Documents ready: 521 → 536 ms.
- First answer painted: 561 → 560 ms.
- A search while typing (a key every 150 ms): 17.3 → **11.0 ms**.
- Map paint: about 1.2 ms.
- From the key event to the frame after the paint: 32.6 ms.

**Narrow window (20,000 docs):** a search while typing takes 4.1 ms.

**By program size, after a 200 ms pause:**

| Program | Before | Now |
|---|---|---|
| 8 states | 17.8 ms | 11.8 ms |
| 16 states | 76.9 ms | 12.5 ms |
| 32 states | 901 ms | 14.5 ms |

**Per pattern (now, after a pause) against native RegExp:**

| Pattern | Program | Now | RegExp |
|---|---|---|---|
| `error` | 8 states | 12.0 ms | 20.8 ms |
| `[a-z0-9.]+@[a-z.]+` (string values) | 8 states | 11.6 ms | 21.3 ms |
| `[a-z]+Id` (keys) | 8 states | 11.6 ms | 19.3 ms |
| `\d\d\d\d-\d\d-\d\d` | 16 states | 13.1 ms | **8.9 ms** (RegExp wins) |
| `([a-z]+)+x` | 8 states | 11.0 ms | **2.1 s** |
| `connection reset` | 32 states | 15.0 ms | **8.0 ms** (RegExp wins) |

**Shaders.** The page compiles **four shaders at load and none later**: the highlighter's (5,704 characters) and the three search shaders (7,748, 9,794 and 14,324 characters) (L104). On a first visit with no shader cache (`?salt=`), the first answer is painted after about 0.68 to 0.70 s (L105).

**Memory.**
- 140 MB of JavaScript at rest.
- 588 MB after a CPU search, 448 MB of it in the CPU worker (L111).
- On the GPU, 410 MB: 205 MB of cells plus 205 MB of display kinds (`src/json-search/README.md#L47`).

**Whole search on the CPU** (100,000 docs, 8 states): 13 s as the line shows it, 21.4 to 21.9 s on the clock with the highlighter. Without WebGPU, the first search finishes after 23.1 to 23.3 s (`lab/json-search/README.md#L107-L109`).

**Count of documents with a match** (`lab/json-search/README.md#L639-L647`). [Fact-check correction: these counts are over **the demo page's 100,000 documents, all valid JSON**, from writers-run.ts (L612). They are not over the seed-20261013 measurement set with 1 in 10 broken. That is why 10,559 matches the page's line.]
- `error`: 10,559, the same number as the page's example line.
- `connection reset`: 1,440.
- `([a-z]+)+x`: 47,577.

### 5.5 "Is the GPU clearly faster?" (the lab's answer)

Source: `lab/json-search/README.md#L114-L131`.
- **Against the same programs on the CPU: yes**, from about 10 documents on. With 100,000 documents on the GPU:
  - The highlighter pass takes 2.2 ms, against 2.1 s as generated JS and 8.4 to 9.2 s on the executor.
  - A search takes 4.5 to 5.2 ms, against 14 s as generated JS (8 states), 3.2 minutes on the executor, and about 3 minutes as generated JS at 17 to 32 states.
  - Status.md summarizes this as "by 200 to 40,000 times" (`lab/status.md#L118`).
- **The highlighter against plain JS:** the GPU wins only as a repeated pass. From the texts, the GPU takes 0.15 s against 0.12 to 0.15 s for JS.
- **Search against RegExp on one thread:**
  - The GPU is faster back to back, 1.5 to 9 times.
  - At a keystroke it is faster on 7 of 10 patterns, about even on 1, and slower on 2.
  - On a backtracking pattern it takes 5 to 12 ms against 2.1 s.
- **Against JS in 8 workers: no.** RegExp takes 1.9 to 6.7 ms and JSON.parse 10.9 ms. With 16 workers, RegExp takes 1.3 to 4.0 ms. Even so, the backtracking pattern takes 279 ms in 8 workers and 136 ms in 16, which the GPU still beats.
- **Crossover.** Back to back, the GPU beats RegExp-per-string-value from about 2,000 to 13,000 documents. After a pause, it does so from 15,000 to 54,000 (L160).
- **"Why an evaluation after a pause takes longer wasn't found."** A pause makes a search take 2.4 to 3.2 times as long. A GPU lowering its clock "would explain the pass", but this is "not verified" (`lab/status.md#L114`; `lab/json-search/README.md#L162`, `#L208`).

### 5.6 The million folder (`lab/json-search/million/`)

This was a check before building, made at Cheng's request. It used **hand-written kernels**, explicitly "none of them is the repo's program" except labelled rows (`million/README.md#L5-L9`). The documents were 1,000,000 valid JSON documents, 299 code points on average.

**Fit and load.**
- Packed one byte per code point, the documents fit in one tab: 644 MB of GPU buffers, with the GPU process at 0.85 GB after load and 1.6 to 1.7 GB peak (L17).
- In "today's layout" (f32 per code point) they need 4.1 GB of buffers, with the GPU process at 6.3 GB and up to 8.1 GB (L21).
- The load takes about 1 s; the first 25,000 have an answer after 0.3 s (L20).

**Keystroke cost** (L22-L26):
- A hand-written kernel costs 14 / 18 / 25 ms at 8 / 16 / 32 states. That is for the question "which documents have a match", as one bit per document, after a 200 ms pause.
- Regular JS on one thread takes 58 to 315 ms over five ordinary patterns, and 14.9 s on `([a-z]+)+x`. [Fact-check: don't pair "14 ms" with "58 to 315 ms". The 58 ms is the date, a 16-state pattern for which the kernel takes 18 ms. At 8 states, RegExp takes 185 to 315 ms (L26). The repo's own pairing: "3 to 22 times faster than one thread", e.g. 14 ms against 185 ms for `error` (L24).]
- 8 workers take about what the kernel takes.
- "Today's program" (loop-emit) takes 74 ms, 0.6 s and 8.9 s.

**Rewrites at 100,000 documents** (L27):
- A hand-written rewrite gave 2.7 / 3.2 / 3.8 ms.
- "Keeping every 0-or-1 value as a bit isn't enough"; the reads of one sum have to become one AND of two words.
- **bit-emit.ts** then produced that form automatically: 3.5 / 3.4 / 4.4 ms, against 3.0 / 3.4 / 4.0 ms for the hand-written rewrite (L28, L141).

**Correctness checked.** 12,666,700,000 values were compared with 0 mismatches. bit-emit's shaders against loop-emit's: 3,386,100,000 outputs, 0 mismatches. bit-emit against `RegExp`: 30,000,000 match counts and 15,360,000,000 marks, 0 differ (L75, L143).

**A bug found by a reviewer and fixed.** A register declared whole, into which a stage writes `level + 0.25`, "got 7 on the GPU where the executor gives 6.5". The search step has no such register (L143, L155).

**"What a page could not claim":** that the GPU beats JavaScript (8 workers answer in 8.5 to 44 ms), that a hand-written kernel is the repo's program, that the numbers hold on another machine, or that the page is light (L124). A million documents are **not** in the demo. The demo stays at 100,000.

### 5.7 Tests

`bun test --timeout 30000 tests/json-search` runs "184 tests in 10 files, about 45 s, no GPU" (`src/json-search/README.md#L9`). The GPU tests run the shader text through a strict WGSL interpreter (`tests/json-search/interpreted-gpu.ts`) (L243, L249). The highlighter's step is compared with a hand-written reference on 2,509 texts and on 43,420 short texts (L240).

---

## 6. Verified quotes

All quotes are verbatim from the pinned commit `257856e`. The URL base is `https://github.com/chenglou/handwired/blob/257856e/`.

1. **README (Cheng Lou's top-level pitch):** "achieving GPU-level of parallelism with JS code that was written in a traditional single-threaded way (see the JSON search demo that runs in milliseconds over 100k documents)". From `README.md#L36`, a bullet under "This unlocks lots of funny use-cases, like:". Web-verified (S1).
2. **src/json-search README, opening:** "A page that searches 100,000 generated JSON documents again at each keystroke, on the GPU, with two fixed numeric programs." From `src/json-search/README.md#L3`.
3. **The same README:** "A GPU is of no use for one document, since a round trip to the GPU alone takes 0.6 ms or more. It is for many documents: every document runs the same operations and reads no other document's values, so one pass runs them all." From L3. Web-verified (S2).
4. **The page's example line:** "10,559 of 100,000 documents match. This program: 13 ms on the GPU. Native RegExp: 21 ms." From L30. Web-verified (S2). Note: `lab/status.md#L103` gives the same line with "12 ms"; both are examples of one measured run, not fixed numbers.
5. **The same README:** "So neither the search nor RegExp is always faster, and the line gives both times for every pattern." From L53.
6. **Cheng's question (quoted in the lab README):** "I was wondering if there's a point where regex search or json highlighter, or a combination of these into the same app, is clearly more performant from the gpu parallelism? Then we can make a demo where we search a ton of jsons or something". From `lab/json-search/README.md#L52`. The repo gives no date for the message; context places it before the measurements of 2026-10-13. Lowercase and typos are original.
7. **Cheng on the million:** "I was thinking about 1 million documents, optimized kernels vs regular idiomatic js. Thought I don't know what the numbers would look like. Maybe we should check before we build it. Esp since 1M docs in browser might be a lot". From `lab/json-search/million/README.md#L5`. The check is dated 2026-10-13/14.
8. **Cheng on removing the experiments (2026-10-14):** "we can remove all the bits from the 2 old json and regex experiments, except whichever important new patterns we found, like that nlogn loop or whatever. Beside those lessons, the demos should disappear." From `lab/status.md#L127`.
9. **Cheng, on the plan:** "go. Make sure btw that the docs are without legacy crufts. Those and the tutorial and templates are the entrypoint for ppl when we release." From `lab/status.md#L127`.
10. **The lab's honesty rule:** "It isn't honest if it claims to beat RegExp on every pattern, or JavaScript in several workers." From `lab/json-search/README.md#L131`.
11. **The lab:** "The comparison with one thread flatters the GPU." From `lab/json-search/README.md#L918`.
12. **The lab:** "RegExp is fast." From `lab/json-search/README.md#L917`.
13. **search-step.ts:** "a new pattern writes cells and changes no program." From `src/json-search/search-step.ts#L4`.
14. **plain-search.ts / README:** "The page's RegExp time is therefore a baseline and not a check." From `src/json-search/README.md#L96`.
15. **On the pause mystery:** "Why an evaluation after a pause takes longer wasn't found." From `lab/status.md#L114`.
16. **The demo card's deck (the site):** "The regex matching, JSON parsing & highlighting are all written in JS, then turned into WebGPU kernels for massive parallelism." From `assets/demos.html#L204` and `assets/json-search.html#L45`. Also seen on the live page (S7), where the fetch tool shortened it.
17. **External, V8 blog (2021-01-11):** "The example above, `/(a*)*b/.exec('a'.repeat(100))`, does not finish within our lifetimes if executed by Irregexp." From S6. Framing only.

UNVERIFIED: none used. Do not attribute any spoken words to Cheng Lou beyond items 1 and 6–9.

---

## 7. Debates and controversies

**"Is the GPU faster than RegExp?" Contested, and the repo states both sides.**
- *For:* back to back, 1.5 to 9 times faster on every measured pattern. At a keystroke it is faster on most ordinary patterns, and about 190 times faster on the backtracking pattern (2.1 s against 11 ms) (`lab/json-search/README.md#L121-L124`).
- *Against:*
  - Slower on the date and `connection reset` (RegExp takes 8 to 9 ms, the GPU 12 to 16 ms).
  - Slower than 8 workers.
  - Measured on one machine and one browser only.
  - The documents' median is 300 code points. "shorter documents favor RegExp and documents near 512 favor the GPU", since the GPU runs all 512 positions of every document (L168).

**"Isn't the comparison unfair?"** The repo concedes it. The baseline gets one core of 18 while the GPU uses all its threads (L918). The RegExp and the program also don't compute exactly the same thing: leftmost-longest against first-alternative, as in `a|abab` on `xabab`, which gives 2 matches against 1 (`src/json-search/README.md#L96`).

**Early overclaiming, corrected the same day.** Section 4 covers it. The film can present this as the project's own self-correction, not as a scandal.

**Hand-written kernel against "the program".** The million check used kernels that are not the program. bit-emit.ts closed the gap from the unchanged program: 1.1 to 1.4 times the kernel's time (`lab/json-search/README.md#L158`). Any claim of "1 million documents in 14 ms" must say it was a hand-written kernel, not the demo.

**Why remove working experiments?** Cheng wanted release-ready entry docs without "legacy crufts". The lessons were kept as patterns in docs/patterns.md, and the code was kept in a tag (`lab/status.md#L127-L151`). No dissent is recorded.

---

## 8. Misconceptions to avoid

- **Not "regex compiled to GPU code per keystroke".** "No pattern is compiled into GPU code". The pattern is data in cells, and all three shaders are compiled at page load (`src/json-search/README.md#L25`).
- **Not "one big matmul" on the GPU.** It is a loop program: a small step inside a WGSL `for` loop, one thread per document. The "giant matmul" framing is the CPU's layer form (see the compilation dossier).
- **Not trained.** "None of their weights is trained." (L3)
- **Not a JSON parser in the JSON.parse sense.** It is a highlighter and validator with fixed limits (512 code points, depth 16) and named fallbacks `tooLong` / `tooDeep`, and documents past 512 code points are only partly read.
- **Not "beats JavaScript".** It does not beat 8 workers, and it does not beat RegExp on every pattern.
- **Not a million documents.** The demo holds 100,000, or 20,000 on narrow windows. The million was a measurement check with hand-written kernels.
- **Not "the highlighter and regex search were deleted".** Their pages and the written-out forms were removed. The steps the page runs live on in `src/json-search/highlighter` (kinds.ts, tables.ts) and `src/json-search/regex` (pattern.ts, bits.ts, data-program.ts) (`lab/status.md#L132-L133`).
- **Don't confuse the dates.** The pages existed on the demo site only from Oct 13 to Oct 14. The *experiments* date from Sept 17.
- **The "13 ms" is not fixed.** It is one example of the line. A first load in a new process shows 12 to 13 ms; later loads in the same process show about 9 ms (`lab/json-search/README.md#L101`).
- **The GPU is not required.** Without WebGPU, the page runs both programs on the CPU in a worker (`src/json-search/README.md#L39`), at about 13 to 14 s per search for 100,000 documents (`lab/status.md#L103`). That is the line's figure, the search program's own time. The first CPU search takes 21.4 to 23.3 s on the clock, because the highlighter runs too (`lab/json-search/README.md#L106-L109`).
- **Exact, but only verified on one GPU.** Every value matched the CPU's in the runs, "which were on one GPU and one compiler only: an Apple M5 Max through Metal, in Chrome 155" (L249).

### Honest limits (must-cover)

- **GPU.** WebGPU is needed for keystroke speed. Without it the search takes about 13 s on the CPU (`src/json-search/README.md#L39-L43`, `#L53`).
- **Buffers.**
  - A GPU with small buffers gets fewer documents (L48).
  - The default limit holds 65,408 documents (L78; S3).
  - The page asks for larger buffers with `requestBatchDevice(bufferBytesFor(count))`.
- **Document size.**
  - Only the first **512 code points** are read; `tooLong` at code point 512.
  - Nesting depth is capped at **16**; `tooDeep` at the 17th opener.
  - Generated documents average about 300 code points (L86-L90, L145; `highlighter/kinds.ts#L8-L10`).
- **Pattern size.** At most **32 states** (31 characters or classes). The pattern language is a subset of RegExp: no `{2}`, `^` or `*?` (L98).
- **Memory.** 410 MB on the GPU for 100,000 documents; 588 MB of JS after a CPU search (L47, L53).
- **One machine, one browser, headless.** No other GPU, no real display (`lab/json-search/README.md#L941`).
- **Pause penalty.** After a pause the GPU takes 2 to 3 times as long, cause unknown (`src/json-search/README.md#L81`).

---

## 9. Curiosity hooks

1. **The 945 ms → 5.2 ms jump came without touching the program.** The same weighted sums and ReLU gates; only the code *writer* changed, proving which values are bits and packing 8 table reads into one AND of two 32-bit words (`src/json-search/README.md#L185-L191`).
2. **Compile time from two minutes to a blink.** Written out per position, the 8-state search at 256 positions was 91,774 statements and took **107 to 130 s** to compile, in a scratch probe. As a loop (loop-emit.ts), the 8-state shader compiles in **0.05 to 0.1 s** (`lab/json-search/README.md#L55`; `lab/status.md#L114` gives 0.05 to 0.11 s). Today's bit-emit shaders compile in 0.02 to 0.05 s each (`src/json-search/README.md#L126`). [Fact-check: the 0.02 to 0.05 s figure belongs to the later shaders, not to the loop rewrite itself. Note also that the 107 to 130 s is for 256 positions, not the page's 512.]
3. **The evil pattern.** `([a-z]+)+x` takes RegExp **2.1 s** on one thread, because it backtracks. The program takes about **11 ms**, the same as any other pattern its size, because it never backtracks: it runs the same operations at every position regardless (`lab/json-search/README.md#L95`).
4. **A separate worker exists only so it can be killed.** "a running `RegExp` call can only be stopped by ending its worker", so the page gives RegExp its own worker and terminates it after 10 s (`src/json-search/README.md#L34`).
5. **10,559.** The page's example line, "10,559 of 100,000 documents match", is exactly the measured number of generated documents containing `error` (`lab/json-search/README.md#L639`).
6. **Document 73,512 without the 73,511 before it.** Every document is a hash of seed and index, with no `Math.random`, so page, tests and measurements agree without passing files around (`src/json-search/README.md#L205`).
7. **Running a program backward.** A program "can't go back", so the search first sweeps each document from the end to learn where matches *could* finish, then sweeps forward (L149).
8. **The mysterious pause.** The GPU is 2 to 3 times slower if it rested 200 ms, so a human typing gets the *slow* number. Keeping it busy with tiny dispatches didn't help, and the cause "wasn't found" (`lab/json-search/README.md#L208`; `lab/status.md#L114`).
9. **A stack as one number.** The highlighter tracks every open container (object or array) up to depth 16 as one integer, a running total of ±2^depth (`src/json-search/README.md#L135`).
10. **The experiments live on in a tag.** `json-regex-experiments-2026-10` freezes commit `4a80450`, made at 03:30 on Oct 14, a few hours before the removal began (`lab/status.md#L127`; S4).

---

## 10. Visual and dramatic details

- **The page** (`assets/json-search.html`; live S7):
  - Title "Search 100,000 JSON documents", which reads "20,000" on narrow screens.
  - A pattern field with example patterns, including "One that makes RegExp backtrack: `([a-z]+)+x`".
  - Toggles: "All / Keys / String values" and "GPU / CPU".
  - Hint text: "Point at the map to read a document, click to keep it, and press Enter for the next match."
- **The map:** a dense field of tiny cells, 100,000 in reading order. Matches light up **copper**, drawn larger than their cells. On the CPU, the map **fills in from the top** in roughly 8 ms pieces while the line counts up, e.g. "928 of the first 8,773 documents match … 2.2 s on the CPU so far." This is a strong visual contrast with the GPU's instant full map (`src/json-search/README.md#L36`, `#L41`).
- **The document view:** a JSON text colored by kind (whitespace, punctuation, string, key, escape, number, literal, error), with matched code points marked (L37, L86).
- **Paper-cut metaphors grounded in the code:**
  - 100,000 identical little machines in rows, each reading its own strip of 512 characters with the same 37-step (highlighter) or 240-step (search) mechanism.
  - Two passes: a clerk walking each strip right to left leaving notes, then left to right reading them.
  - The 32-bit word as a row of 32 shutters that close all at once (bit-emit's AND).
  - A separate booth for RegExp, with a 10-second hourglass and a trapdoor (the worker that gets terminated).
- **The machine:** one Apple M5 Max computer running Chrome invisibly ("headless"), tables scrolling in a terminal, other agents' jobs sharing it. No room, weather or time-of-day details are recorded beyond commit timestamps.
- **Night work, as timestamps:**
  - The tag commit is 03:30.
  - bit-emit landed at 04:35.
  - The million experiment at 00:25 (all 2026-10-14, -0700).
  - The lab README's note "codegen's interpreter couldn't be edited tonight, so it's a changed copy" (`lab/json-search/README.md#L932`).

  A quiet "overnight" mood is supported. Commit `fd22197` is literally a merge of "overnight/os-focus", and `033c473` is "Merge overnight/docs-3".

---

## 11. Sources

Repo URLs are at the pinned commit; `B` = `https://github.com/chenglou/handwired/blob/257856e/`.

1. B + `src/json-search/README.md` (L3, L9, L21-L53, L78-L82, L86-L110, L114-L193, L205, L240-L249)
2. B + `lab/json-search/README.md` (L3-L5, L37, L52-L60, L66-L131, L150-L170, L183-L212, L606-L658, L787-L805, L848-L872, L896-L950)
3. B + `lab/json-search/million/README.md` (L5-L28, L36-L69, L75, L120-L143, L155)
4. B + `lab/status.md` (L95-L163, L232-L237, L259, L287-L289)
5. B + `README.md` (L25-L38)
6. B + `src/json-search/program.ts` (L1-L30)
7. B + `src/json-search/search-step.ts` (L1-L27)
8. B + `src/json-search/json-step.ts` (L1-L35)
9. B + `src/json-search/table-loop.ts` (L1-L34)
10. B + `src/json-search/loop-emit.ts` (L1-L16, L65)
11. B + `src/json-search/bit-emit.ts` (L1-L80)
12. B + `src/json-search/plain-search.ts` (L1-L110)
13. B + `src/json-search/demo-worker.ts` (L1-L43)
14. B + `src/json-search/demo.ts` (L120, L215-L217, L337-L356)
15. B + `src/json-search/highlighter/kinds.ts` (L8-L10)
16. B + `assets/demos.html` (L174-L205)
17. B + `assets/json-search.html` (L6-L70)
18. https://github.com/chenglou/handwired/tree/json-regex-experiments-2026-10 (S4: the tag resolves; locally, `git log -1 json-regex-experiments-2026-10` = `4a80450`, 2026-10-14 03:30 -0700)
19. https://github.com/chenglou/handwired/commit/87b38f5 (bit-emit.ts added), /commit/40dfd52 (promotion to src), /commit/11a158f (the page added), /commit/0732d26 and /commit/d79d9aa (claim and same-day correction), /commit/d550dc7 (loop shader, 0.1 s compile), /commit/93ce3ea (million experiment), /commit/e38f164 (removal record)
20. S1: https://github.com/chenglou/handwired/blob/257856e/README.md (web-verified 2026-10-27)
21. S2: https://github.com/chenglou/handwired/blob/257856e/src/json-search/README.md (web-verified 2026-10-27)
22. S3: https://www.w3.org/TR/webgpu/ (limits: `maxStorageBufferBindingSize` default "134217728 bytes (128 MiB)", `maxBufferSize` default "268435456 bytes (256 MiB)")
23. S5: https://swtch.com/~rsc/regexp/regexp1.html (Russ Cox, "Regular Expression Matching Can Be Simple And Fast", January 2007; cites Ken Thompson, "Regular expression search algorithm", CACM 11(6), June 1968, pp. 419–422)
24. S6: https://v8.dev/blog/non-backtracking-regexp ("An additional non-backtracking RegExp engine", 11 January 2021)
25. S7: https://chenglou.me/handwired/json-search/ (live demo page, fetched 2026-10-27)
26. https://chenglou.me/handwired/ (the demo site index)
27. Lead only: `public/generated/handwired-json-search/sources.json` in orly-2 (the shelf book's verified claims at `4ea7fcb`; the relevant files are unchanged between `4ea7fcb` and `257856e`)

---

## 12. Fact-check log (adversarial pass, 2026-10-27)

Method: every key claim was re-read against the pinned clone (`.orly-work/repos/handwired` at `257856e`, committed 2026-10-16 17:33:49 -0700; `git diff --stat 4ea7fcb 257856e` over src/json-search, lab/json-search, tests/json-search, lab/status.md and README.md is empty). Each `git log` hash and date was re-run, using author and committer dates. Web checks: the GitHub README at 257856e, the live page https://chenglou.me/handwired/json-search/, the WebGPU spec limits table (https://gpuweb.github.io/gpuweb/, the same text as https://www.w3.org/TR/webgpu/), the V8 blog (https://v8.dev/blog/non-backtracking-regexp, Martin Bidlingmaier, 2021-01-11), Russ Cox's essay (https://swtch.com/~rsc/regexp/regexp1.html) and the tag page on GitHub. Not run: `bun lab/json-search/report.ts loops` and `bun test tests/json-search` were refused by this session's permission policy. The operation counts were therefore checked against the values the tests pin, plus arithmetic, and the 184-test count is taken from the docs.

Changes made:

1. **§4 and the Timeline row at 09:01, the "clearly faster" walk-back (corrected).** `d79d9aa` did not retract "clearly faster". Its three corrected sentences were a compared-values count, the unrun failing case on default limits, and a table note (`git show d79d9aa`). The original claim was about the highlighter alone and was already hedged ("not when every evaluation uploads them"; its body says an upload per evaluation "isn't a clear win"). The walk-back came from the review: the summary "no longer call[s] the highlighter's part of a combined app clearly faster" (`lab/json-search/README.md#L794`).
2. **§3, vendor (corrected).** "the repo doesn't say" which tool helped was wrong. 756 of 825 commits up to the pin carry `Co-Authored-By: Claude Code <noreply@anthropic.com>`, and all are authored "Cheng Lou". No model is named.
3. **§5.4, the match counts (corrected).** The counts (10,559 / 1,440 / 47,577) are over the demo page's all-valid documents, from writers-run.ts (`lab/json-search/README.md#L612`). They are not over the seed-20261013 set with 10,057 broken documents. Claim 4 stands: 10,559 is that measured count for `error`.
4. **§5.3, the search step's operations (clarified).** 240 operations is the unmasked step, pinned in `search.test.ts#L190`. The page's masked searcher is 8 / 151 / 92 operations per stage, i.e. 243 per position (`searcher.test.ts#L121`). 124,424 per document is computed here, not stated by the repo.
5. **§5.6, the million-document keystroke (corrected pairing).** "14 ms against 58 to 315 ms" mixes state sizes. Use the repo's "3 to 22 times faster", e.g. 14 ms against 185 ms for `error` (`million/README.md#L22-L26`).
6. **§1, the experiments' fate (corrected).** The pages were removed earlier on Oct 14 "since the JSON search's page runs both programs" (`lab/status.md#L97`). The code was removed later that day at Cheng's request (`#L127`; "whose own pages left the demo site earlier this day").
7. **§8, CPU time citation (corrected).** "13 to 14 s" is from `lab/status.md#L103`, not `src/json-search/README.md#L39`. Added that it is the line's time: on the clock the first CPU search takes 21.4 to 23.3 s (`lab/json-search/README.md#L107-L109`).
8. **§9 hook 2, compile times (corrected).** The loop rewrite gave 0.05 to 0.1 s at 8 states (`lab/json-search/README.md#L55`). 0.02 to 0.05 s is today's shaders (`src/json-search/README.md#L126`). 107 to 130 s was a 256-position scratch probe.
9. **§7, document length (reworded)** to the repo's own words, "shorter documents favor RegExp and documents near 512 favor the GPU" (`lab/json-search/README.md#L168`).
10. **Timeline (note).** Times are author dates. The removal commits were re-committed at 23:19.

Confirmed without change: claims 1–3, 5, 6 and 9–13 and 15 and 19 verbatim against the source lines cited above.
- 65,408 = floor(134,217,728 / 2,052); the spec's default `maxStorageBufferBindingSize` is "134217728 bytes (128 MiB)".
- 18,961 = 37 × 512 + 17 and 122,888 = 240 × 512 + 8, both pinned by tests.
- 7.8/69/945 → 4.6/4.7/5.2 ms and 11.3/11.9/13.2 ms (`src/json-search/README.md#L185-L189`).
- "200 to 40,000 times" (`lab/status.md#L118`; `lab/json-search/README.md#L129`).
- 8 workers 1.9 to 6.7 ms (L126).
- 10 s RegExp limit (`demo.ts#L120`) and the 720 px cutoff (`demo.ts#L217`, `max-width: 719px`).
- Tag `json-regex-experiments-2026-10` → `4a80450`, 2026-10-14 03:30:47.
- bit-emit `87b38f5`, 2026-10-14 04:35.
- Every quote in §6 matches its line verbatim, including Cheng's three messages and the V8 sentence.

Claim 20: the 10 test files were verified by listing them. "184 tests … about 45 s" is the repo's statement (`src/json-search/README.md#L9`; `lab/status.md#L159`) and was not re-run.
