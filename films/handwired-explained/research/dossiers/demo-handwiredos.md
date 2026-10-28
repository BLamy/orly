# Dossier: Demo 1, HandwiredOS: a window manager as a neural net

- **Topic id:** demo-handwiredos
- **Era:** September to October 2026
- **As of:** 2026-10-27
- **Repo:** `chenglou/handwired` at `257856e`. Its author date is 2026-10-16; it is a merge commit (parents 4ea7fcb and e86c1b4) that brings in a lab experiment, and it is the commit checked out on 2026-10-27. Local clone: `.orly-work/repos/handwired`.
- **Source notation:** `repo:path#Lnn` means `https://github.com/chenglou/handwired/blob/257856e/path#Lnn`. In this dossier, "status.md" always means `lab/status.md` at that commit.

---

## 1. Summary

HandwiredOS is the first demo on Handwired's demo site. The site's landing card calls it **"Mini OS"**.

It is a small desktop: three windows (Monitor, Notes and Photos) and a dock. One compiled program runs all of it, and none of that program's weights are trained. Every weight is written by builder code [S1 L1-L3; S2].

The program handles:
- focus and stacking;
- dragging and resizing;
- the three window controls;
- closing a window to the dock, and reopening it from there;
- the springs that animate all of the above;
- Photos' layout and photo zoom;
- Monitor's virtualized list of the program's own cells, operations and outputs.

At 257856e the program has **234 source cells, 4,646 live operations in 130 layers, and 9,909 stored weights** [S1 L13].
- The live operations break down into **1,811 sums ("affine"), 2,776 ReGLU and 59 boolean operations** [S3 status.md L34; confirmed in the screenshot asset S4].
- The program has 727 roots: 234 next-state values and 493 outputs.
- The landing card shows **"weights 9,909 · layers 130 · training 0"** [S2; S5].

**Speed**
- One evaluation takes tens of microseconds on the CPU in Bun:
  - 35.76 µs median in the author's `runtime-cost` process on 2026-10-14 [S3 L34];
  - about 41-44 µs in this film's own run on an M4 Max under heavy load [S6].
- In the page, a hover or drag frame's program time was 0.15-0.19 ms at load average 4-7 [S3 L26]. The asset screenshot's chart reads **0.12 ms** [S4].

**GPU**
- HandwiredOS does **not** run on the GPU in production: the page evaluates with `circuit.createTensorProgramEvaluator` (window-manager.ts L1481), and "src/runtime has no GPU backend" [S10 patterns.md L61]. On 2026-09-16 a lab measurement ran a then-larger HandwiredOS (14,019 operations) on WebGPU: 2.2 ms per evaluation, against 81 µs on the CPU in Bun. Its 6.4 MB single shader did not finish compiling in Metal within 28 minutes [S3 L40].

**Two things that look like neural output but are not**
- The page's JavaScript draws the wallpaper as one arc per stored weight.
- The page's JavaScript writes Monitor's footer, which shows the program's sizes and a frame-time chart.

Both read the compiled program; neither is an output of it [S3 L99; S7; S8].

---

## 2. Timeline

| Date | Event | Source |
|---|---|---|
| 2026-06-03 | The repo's first commits ("Create numeric UI atom lab"). | `git log --reverse` in the clone; [S9] |
| 2026-09-14 | Cheng picks the recommended runtime options for decisions 1-3. "HandwiredOS stayed at 5,253 operations in 192 layers until the changes below." | [S3 L7] |
| 2026-09-15 | HandwiredOS moves to `emitAnimatedObject`, `advanceFrame` with `'events and settle checks'`, and `emitCompare` hit tests on a 1/64 px grid: **3,654 live operations, 124 layers** (from 5,253 and 192). Stored tables and drawn outputs are bit-identical at 10, 30, 60 and 120 fps and through 500 ms stalls. The old version differed by up to 357 px at 10 fps against 120 fps. | [S3 L14] |
| 2026-09-16 | The Notes text-layout flow moves into HandwiredOS, and buttons now act on release. The program grows to 438 source cells, 14,019 live operations, 275 layers and 31,359 weights. One evaluation goes from about 25 µs to about 81 µs. | [S3 L16] |
| 2026-09-16 | **WebGPU measurement** in headless Chrome 153 / Metal and Bun 1.4.0 on an Apple M5 Max at load average 4-6, using scratch files outside the repo. The program measured was the 4-window, 14,019-operation version, before the September 17 engineering pass. **2.2 ms on WebGPU** (compute pass about 1.9 ms), against **81 µs** in Bun and about **140 µs** in Chrome on the CPU. All 177,154 outputs of 202 recorded tables matched. The result arrived 5-7 ms after the frame callback started, so it could only be drawn a frame later. The 6.4 MB shader did not finish compiling in 28 min; split into 24 shaders, it compiled in 8.1 s. On the real page, dragging Files over Notes used about 2.0 ms of each 16.7 ms frame, of which `machine.step` was 1.1 ms and the program about 0.75 ms. No frame was dropped. | [S3 L38-L40] |
| 2026-09-17 | Engineering guide pass. In a Chrome drag frame, cells.ts's validator goes from 277 µs to 12.7 µs. V8 had kept deoptimizing it; the fix is commit 7c1018d. | [S3 L40, L167] |
| 2026-10-13 | **The demo site.** A single index page: HandwiredOS at os/, the learned gallery, and JSON search. assets/handwired-os.css replaces window-manager.css. The arrangement, footer, sidebar counts and wallpaper are added. | [S3 L95-L99] |
| 2026-10-13 | The Files window becomes a virtualized list of the program itself. Notes takes typed text. The peak program is **794 cells, 21,229 live operations, 230 layers, 46,930 weights**. Later that day Files and Monitor merge into one window titled Monitor, leaving three windows. | [S3 L18-L24] |
| 2026-10-13 (evening) | Notes becomes a native `<textarea>` and "the text layout left the program". The program drops to 241 cells, **4,251 live operations, 123 layers, 8,959 weights**. One evaluation goes from 113.8-114.8 µs to 25.1-25.3 µs. In headless Chrome the first paint comes at 84-88 ms instead of 164-172 ms. | [S3 L26] |
| 2026-10-14 | The 64-slot rule for drawing rows: 4,254 operations. Then four page changes (stored rectangles, photo aspect limits, a centered arrangement, the caret placed at the end of the text): 4,393 operations, **130 layers**. Then the Photos zoom: 4,639 operations, 9,882 weights. Then the thumbnails' displacement rule: **234 cells, 727 roots, 4,646 live operations (1,811 sums, 2,776 ReGLU, 59 boolean), 130 layers, 9,909 weights, from 5,028 built operations**. Median of 26.5 operations per layer; longest ReGLU/boolean chain 71. | [S3 L28-L34] |
| 2026-10-14 | The landing card's numbers are "read on October 14, 2026, from its Monitor window in Chrome (9,909 weights in 130 layers...)". `bun run site:check` fails if they differ from the page. | [S2 L122-L127; S3 L95] |
| 2026-10-14 | The repo's history is rewritten before it is made public that day. Commit hashes from earlier clones no longer resolve. | [S3 L36] |
| 2026-10-15 | Last commit touching src/handwiredos/ before the pin (4ea7fcb, "Entry docs: what four readers without any background tripped on"). | `git log -- src/handwiredos` in the clone |
| 2026-10-16 | Pinned commit 257856e (a merge of a lab experiment, the recovery parser; no HandwiredOS change). | `git log -1 257856e` |
| 2026-10-27 | This film's research runs `bun lab/runtime-cost/report.ts`. "window manager" entry: 234 / 5,028 / 4,646 / 130 / 9,909 / 727 roots; reusable tensor evaluator 40.92 µs, 42.13 µs and 44.20 µs in three runs (Apple M4 Max, Bun 1.4.3, load average about 10.5). | [S6] |

---

## 3. People

**Cheng Lou (`chenglou`)** is the author and owner of `chenglou/handwired`. He hosts the demo site at chenglou.me/handwired/ [S9; S5].
- What the repo itself attributes to him:
  - Cheng approves doc changes and chooses runtime options ("Cheng chose the recommended option…") [S3 L1, L7].
  - He asked for demos of traditional JavaScript tasks [S3 L234].
  - He wrote the README's framing lines (section 6).
- The brief's guardrail applies: no invented biography, motives or words. The film should not depict his appearance.
- If a figure is needed, use a **generic, anonymous silhouette of a programmer at a desk**, not a portrait. The brief limits "people" to what the repo says. No verified visual description of him was gathered for this dossier, so none is offered.

**"The lab" / agents.** status.md repeatedly refers to work done by agents. For example, it lists the programs running during GPU measurements, which were removed in the history rewrite [S3 L36]. It also says agents copy guide examples [S3 L176]. The film may say that much of the lab's measurement and writing was done with coding agents under Cheng's review, but only in those terms. It should not name models: status.md says model names were scrubbed from commit trailers before the public release [S3 L36].

---

## 4. The belief of the age

This topic is a demo, not an era. The relevant "beliefs" concern what a window manager is and what a neural net is.

- **Common belief: a neural network is approximate and probabilistic, and has to be trained.** HandwiredOS's card answers this with "training 0" [S2]. The README frames the whole project as "no training, exact, yet also fully differentiable" [S9].
  - Note that HandwiredOS is exact in the sense of the repo's FP32 contract: declared ranges, grids and rounding points. Exactness has limits. One example is the NaN range-tracking issue in section 7 [S3 L169].
- **Common belief: GPU = fast.** The lab's own measurement contradicts this for HandwiredOS. One evaluation of a program "with nothing repeated doesn't get faster" on WebGPU: about 2 ms there, against under 0.1 ms on the CPU executor [S10 patterns.md L58].
  - The program is "many different pieces of logic instead of one repeated step, so it has no tree to build" [S10 L57].
  - patterns.md names two cases where a GPU took less time: a tree of matrix products run one dispatch per level (lab/knuth-plass, 0.47 ms on WebGPU against 3.4 ms for the chain on the CPU), and one program over many source tables that stay on the GPU (JSON search) [S10 L55-L58]. HandwiredOS fits neither.
- **UI engineering norms the demo inherits and departs from.** HandwiredOS's render loop follows chenguini's ui.md, with two exceptions [S11 behavior-choices.md L5]:
  - it applies events at their timestamps and writes state back only at events and settle checks;
  - it snaps where ui.md carries leftover spring steps into later frames.

  The "hit-test the destination" rule comes from ui.md's "Hit Testing" section [S11 L9].
- **Open question (status.md "Open decisions"):** the demo site's public address, and whether the GitHub Pages workflow stays, were still listed as open [S3 L189]. The README nonetheless links https://chenglou.me/handwired/ [S9].

---

## 5. Experiments and results

### 5a. What HandwiredOS is made of (files) [S1 L35-L44]

| File | Lines (counted 2026-10-27) | What it holds |
|---|---|---|
| `window-manager.ts` | 2,483 | The window manager's cells and builder code, the machine, and the page's render loop |
| `photo-gallery.ts` | 1,494 | Photos, and a machine for Photos alone, which the tests run |
| `value-list.ts` | 832 | Monitor's list and the rows of its three locations |
| `arrangement.ts` | 309 | Page JavaScript: the windows' first rectangles for the viewport |
| `monitor-footer.ts` | 170 | Page JavaScript: Monitor's footer (sizes and the frame-time chart) |
| `wiring.ts` | 185 | Page JavaScript: the wallpaper, one arc per stored weight |
| `assets/index.html`, `assets/handwired-os.css`, `photo-gallery-00..11.webp` | — | The page, its stylesheet and 12 photos |

**Tests:** `bun test tests/handwiredos` runs "127 tests in 8 files, about 9 s" [S1 L9].
- This dossier counted `test(`/`it(` calls statically in the 8 files: 43 + 29 + 24 + 14 + 5 + 5 + 5 + 2 = **127**. The tests were not executed here (the fact-check's attempt to run them was also denied), so the "about 9 s" is the README's figure only.

### 5b. Size: the numbers to put on screen

| Measure | Value at 257856e | Source |
|---|---|---|
| Source cells (State) | 234 | S1 L13; S3 L34; S4 (sidebar "State 234") |
| Live operations | 4,646 | S1 L13; S4 ("Operations 4,646") |
| Outputs | 493 (727 roots − 234 next-state) | S4 sidebar "Outputs 493"; S3 L34 roots 727 |
| By kind | affine 1,811 · ReGLU 2,776 · boolean 59 | S3 L34; S4 sidebar legend |
| Layers | 130 | S1 L13; S2; S4 footer |
| Stored weights | 9,909 | S1 L13; S2; S4 footer |
| Built operations | 5,028 (382 copied into readers or folded) | S3 L34; S12 execution-model.md L46 |
| Program bytes | "114 KB" (footer); 114,476 bytes from a probe | S4; S6 |
| Median operations per layer | 26.5 | S3 L34 |
| Longest ReGLU/boolean chain | 71 | S3 L34; S10 L57 |
| Gather reads / index reads | 0 / 0 | S3 L34 |
| Rounding points | 59 boolean atoms, 707 integer-bit operations, 33 marked | S12 L164 |
| Sparsity (derived) | 9,909 stored weights against 623,442 dense entries, about 1.6% | S6 (derived; label as derived) |

### 5c. Timings: CPU, browser, GPU (label each with date, machine and load)

**CPU, Bun, one evaluation**
- 2026-10-13: 25.1-25.3 µs (4,251 operations, standalone process, Bun 1.4.3, load 3.7-4.2; status.md does not name the machine for this run) [S3 L26].
- 2026-10-14: 25.2-25.3 µs (4,254 operations) [S3 L28].
- 2026-10-14: 35.76 µs median of 9 runs (4,646 operations) in the `runtime-cost` process, which "reads higher than a process that runs only HandwiredOS" [S3 L32-L34].
- 2026-10-27, this film's run: reusable evaluator 40.92 µs / 42.13 µs / 44.20 µs; reference evaluator 162-167 µs; Apple M4 Max, load average about 10.5 [S6]. A single-session record: neither the dossier nor the fact-check could re-run it (execution denied).

**Frames in Bun** (2026-10-13, 4,251 operations)
- idle frame 31 µs;
- hover frame (4 moves, 2 evaluations) 59-60 µs;
- title-bar drag frame (4 moves, 5 evaluations) 147-149 µs.

These were not re-measured after the program grew 9% to 4,646 operations [S3 L26; S3 L167].

**Headless Chrome 155** (2026-10-13 evening)
- the load's long task 57 ms;
- first paint (the program's first frame) 84-88 ms;
- program time in a hover or drag frame 0.15-0.19 ms [S3 L26].

**The page's own chart** shows "0.12 ms" in the asset screenshot [S4]. Each point averages 10 frames, because Chrome's clock steps in 0.1 ms [S8 L9-L14].

**WebGPU** (2026-09-16, larger program, never re-measured): 2.2 ms against 81 µs (Bun) and about 140 µs (Chrome CPU). The result arrived a frame late [S3 L40].

**Where a browser frame goes** (2026-09-16)
- dragging one window over another kept the main thread busy for about 2.0 ms of a 16.7 ms frame;
- `machine.step` took 1.1 ms of that;
- running the program took about 0.75 ms;
- no frame was dropped [S3 L40].

### 5d. Behaviors mapped to patterns and behavior choices

| Behavior | How it's built | Doc |
|---|---|---|
| **Hit test (press)** | A press is tested against **destination** rectangles, not drawn ones. Each rectangle compares 4 edge distances with 0.5 via `emitCompare` (`>=`). Pointer and geometry lie on a 1/64 px grid, so each comparison is an exact integer bit, and the bits combine as **`relu(sum of bits − 3)`**: "13 operations in 4 layers per rectangle once the edges exist" (rectangles that share an edge share its bit). Dock items lie on no grid (a width divided by 3), so each uses one boolean atom `boolean(clamp01(min of 4 edge distances))`: 16 operations in 9 layers. | behavior-choices "Hit-test destinations instead of drawn positions" [S11 L7-L28]; execution-model "Comparisons" [S12 L147]; `emitRectangleHit`, `emitDockItemHit` [S13 L2303-L2345] |
| **Which window was hit** | `emitFrontmost` checks stacking ranks one at a time (the loop runs from the last rank down to rank 0). The stack is a **permutation matrix** declared as one-hot groups. At 3 windows this chain is smaller than an `emitFirstActive` tree. | patterns.md L121 [S10]; window-manager.ts L231-L236, L2269 [S13] |
| **Photos click priority** | `emitFirstActive`: previous/next controls, then thumbnails, then the main image. | patterns.md L121 [S10]; photo-gallery.ts L578 |
| **Release semantics** | A press arms a control; a release over the armed control acts, whatever path the pointer took in between. A release anywhere else, or a pointercancel, does nothing. | README "Releases" [S1 L20]; window-manager.ts L725-L747 [S13] |
| **Drag / resize** | A state machine over queued events. The stored rectangle is what the user placed, and every evaluation fits it into the workspace (`fitIntoWorkspace`). A drag stores only in an evaluation in which the pointer moved. There is no drag threshold, so a release 1 px away drags 1 px. Cost: 125 live operations and 7 layers. Without the `assumeRange`/`assumeGrid` declarations it would be 844 more operations and 5 more layers. | tutorial.md L227 [S14]; behavior-choices "Store what the user placed…" [S11 L99-L122] |
| **Springs** | `emitAnimatedObject`: displacement and velocity are stored in the table, and a host-written 4-number step matrix is applied per evaluation (4 ms steps). The program never loops over spring steps. Past 300 steps in one frame, objects snap. | README "Springs" [S1 L17]; patterns.md L213 "matrix powers" [S10]; behavior-choices "Apply events at their timestamps…" and "A fixed maximum…" [S11 L30-L97] |
| **Photo zoom** | One spring animates "how far the photo is open" (0 to 1). Two springs serve all 12 photos, which is about 300 operations fewer than one spring per photo. The known glitch: a second close while the first photo is still returning makes the first photo jump into its cell. | README [S1 L29]; behavior-choices "A fixed maximum" [S11 L87] |
| **Monitor list: native scroll and selection** | The browser scrolls. The host reads `scrollTop` at the top of each frame into an input cell (1/4 px grid). The program floor-divides to find the first row, puts row r in DOM slot **r % 64**, and outputs each slot's row, top, presence bit and selected bit. The program holds no row, up to the 100,000 rows the scroll cell's range covers. Selection happens on release; six keys work while Monitor is focused. The `slotOverflow` output shows "Only 64 rows are drawn at a time." | behavior-choices "Scroll a list natively, and select a row at the release" [S11 L149-L175]; value-list.ts L21, L435, L664; patterns.md L479 [S10] |
| **Scroll anchoring** | **Not used in HandwiredOS.** "Anchor the scroll position to the row at the top of the view" belongs to the lab's text-rows demo (10,000 chat rows). Monitor uses the native-scroll choice instead. Its doc says to use anchoring "when the rows above the view can change height". | behavior-choices L124-L147 and L171 [S11] |
| **Keys** | Keys reach a window only while it is focused. ArrowLeft, ArrowRight and Escape go to Photos; ArrowUp/Down, PageUp/Down, Home and End go to Monitor. Keys in Notes stay with the browser. | README "Keys" [S1 L21] |
| **Viewport / arrangement** | Page JavaScript picks the first rectangles. There are four forms: the desk from 1000 px wide, two columns from 640 px, one column below 640 px, and one row on a sideways phone. At 1440 × 900: Monitor 38, 152, 540 × 556; Notes 602, 152; Photos 842, 278. | arrangement.ts L1-L30 [S15] |
| **Content layout** | A window's content box takes its destination size at the event; only the frame animates and clips. | README "Content" [S1 L18] |

### 5e. The physical "apparatus" (for the art department)

- **The desk** (from the asset screenshot S4, 1520 × 800 px):
  - a warm paper-beige desktop with a faint dot grid;
  - behind the windows, the wallpaper: hundreds of thin overlapping semicircular arcs, mostly copper or tan, some grey-blue, rising from the bottom edge;
  - a thin copper line along the bottom with small dots, and a dock of three white rounded tiles: a pulse/heart-monitor icon, a document icon and a picture icon;
  - a top bar with "‹ Back to demos" at the left and "Source" at the right.
- **What the arcs mean:** each arc is one stored weight, drawn from the value it reads to the operation that reads it. Values lie along the bottom edge: the table's cells first, then one column per layer. An arc's width shows how many layers back it reads. Adding weights are copper; subtracting weights are indigo [S7 wiring.ts L1-L12].
- **Monitor window:**
  - a sidebar titled "THIS PROGRAM" with State 234, Operations 4,646 and Outputs 493;
  - a table with columns WIRE · KIND · LAYER · WEIGHTS · VALUE (rows such as "235 affine 1 2 −724" and "989 ReGLU 1 2 0");
  - a legend: affine 1,811, ReGLU 2,776, boolean 59;
  - the caption "What the program computes: each number from earlier ones.";
  - a footer: "130 layers · 9,909 weights · 114 KB" and a small sparkline at "0.12 ms" [S4].
- **Notes window:** a real `<textarea>` containing, verbatim [S16 assets/index.html L84-L89]:
  > TODO: this week
  >
  > – Return the library books
  > – Call home on Sunday
  > – Fix the squeaky hinge
  > – Wire one more neuron by hand
- **Photos window:** a 4 × 3 grid of 12 landscape photos [S4]:
  - a misty alpine lake with an islet of pines;
  - orange sand dunes;
  - a rocky sea coast;
  - a neon city street at night;
  - a forest path with stone steps;
  - a pink-lit snowy peak;
  - a cliffside Mediterranean town;
  - a tall waterfall;
  - a lone tree over a lavender field at sunset;
  - a curving concrete corridor;
  - a turquoise lagoon with overwater bungalows;
  - an autumn mountain road.
- **Focused window:** the focused window's title bar has a faint copper wash (copper at 7%) and a copper hairline at 24% [S17 handwired-os.css L242-L253]; in the screenshot its title dot is filled, here Photos' [S4].
- **Stylesheet:** the header calls the look "a desk, sheets of paper for windows, and one copper wire under the dock" [S17 L1-L2].

---

## 6. Verified quotes

1. "A small desktop with 3 windows (Monitor, Notes and Photos) and a dock, run by one compiled program."
   - Source: `src/handwiredos/README.md` L3 [S1], opening sentence.
2. "Every weight of the program is written by builder code, and none is trained."
   - Source: `src/handwiredos/README.md` L3 [S1].
3. "The program has 234 source cells, 4,646 live operations in 130 layers and 9,909 stored weights"
   - Source: `src/handwiredos/README.md` L13 [S1].
4. "A small desktop written in JS, transformed with Handwired. Giant lists, animation, stacking, scrolling, drag, input, pictures, all rendering to regular DOM."
   - Source: the Mini OS card, `assets/demos.html` L140 [S2]; live at https://chenglou.me/handwired/ [S5].
5. "Turn your regular JavaScript code into a neural net; no training, exact, yet also fully differentiable!"
   - Source: README.md, first line [S9].
6. "HandwiredOS is many different pieces of logic instead of one repeated step, so it has no tree to build."
   - Source: docs/patterns.md L57 [S10]. Context: why GPUs don't help this program.
7. "One table of a program with nothing repeated doesn't get faster: one evaluation of HandwiredOS took about 2 ms on WebGPU, with one table's statements run one after another in a shader, and takes under 0.1 ms on the CPU executor."
   - Source: docs/patterns.md L58 [S10].
8. "The program isn't what limits a frame either"
   - Source: lab/status.md L40 [S3], September 16, 2026 section.
9. "Notes holds one native `<textarea>`: the browser edits, selects, wraps and scrolls the text, and the program computes the window around the text … The program holds no text."
   - Source: README L31 [S1]. The ellipsis marks an omitted clause (", e.g. the window's rectangle and springs, and whether the window is focused.").
10. "Only 64 rows are drawn at a time."
    - Source: the UI string, value-list.ts L664 (template literal with slotCount = 64); behavior-choices.md L87 [S11].
11. UNVERIFIED (do not use as a quote): "Isn't a neural net probabilistic? Yes if you train it, no if you hand-wrote the weights that correspond exactly to your program". It is attributed to Cheng Lou on X by a members-only Medium article [S18], whose excerpt ends "…to your program, lol 🙂"; the original post was not located (re-searched 2026-10-27).

---

## 7. Debates and controversies

- **GPU versus CPU for HandwiredOS.**
  - The README's pitch: "existing gpu techniques, such as fusion, sparsity, reordering, have a great time optimizing such minimal primitives" [S9].
  - The lab's result for this demo: the GPU took 2.2 ms against 81 µs on the CPU, with the result a frame late [S3 L40].
  - The open decision: "measure one per-layer GPU pass first" [S3 L185].
  - Both stand. The GPU helps batched workloads (JSON search), not one UI program run once per event.
- **Exact versus "exact within a contract".** The card says "training 0", and the README says "exact". The known issues show the edges of that claim:
  - range propagation doesn't track NaN (10 differing tables in 200 random circuits; the demos are guarded by JS validation that rejects non-finite sources);
  - `emitArgmax` is order-dependent near ties (not used in HandwiredOS's window manager);
  - gradient sums are order-dependent [S3 L169-L171].
- **One evaluation per event timestamp.** Each event runs one evaluation, and JS validates around each one. A 4-move drag frame runs 5 evaluations, about 148 µs against about 25 µs for one evaluation. The lab measured a queue-based alternative at 12.6 µs against 16.9 µs on a smaller circuit. It is still open: "one press per evaluation, and one shared host check" [S3 L167; S3 L183].
- **Notes inside versus outside the program.** Typed text and line layout were inside the program on 2026-10-13, at the 21,229-operation peak. Merging Files into Monitor first took it to 19,851 operations in 217 layers; that evening the native textarea took it from 19,851 to 4,251. That step made the program about 4.7× smaller and about 4.5× faster per evaluation (113.8-114.8 µs to 25.1-25.3 µs) [S3 L22-L26]. Do not present the textarea as "the network renders text".

---

## 8. Misconceptions to avoid

1. **"HandwiredOS runs on the GPU."** It runs on the CPU executor in JavaScript. Only JSON search uses WebGPU [S3 L40; S6].
2. **"A neural net draws the pixels."** The DOM is ordinary HTML. The program outputs numbers (positions, sizes, opacity, bits), which JavaScript writes as inline styles [S17 L5-L10].
3. **"The wallpaper, the footer and the frame-time chart are network outputs."** The page's JavaScript draws them from the compiled program [S3 L99; S8 L1-L5].
4. **"The program stores the text or the list rows."** It holds no text and no rows [S1 L31; S3 L18].
5. **"HandwiredOS uses scroll anchoring."** It does not; the lab's text-rows list does [S11 L124-L147].
6. **"5,253 operations in 192 layers"** is the September 14 size, not today's [S3 L7]. **"21,229 operations"** was the October 13 peak. Use 4,646 / 130 / 9,909.
7. **Mixing timings across machines.** The author's docs name an Apple M5 Max for the September 16-17 runs and several doc measurements, but status.md doesn't name the machine for the October 13-14 runs, so don't caption those as "M5 Max". This film's run used an M4 Max at high load. "Only times measured together compare" [S3 L22].
8. **"Four windows."** The program has had three windows since 2026-10-13. Earlier docs and measurements mention Files or four windows [S3 L24].
9. **"No JavaScript besides the net."** The arrangement, footer, wiring, keyboard-focus rule, DOM writes and validation are all page JavaScript [S1 L35-L44].
10. **"A tap never moves a window."** There is no drag threshold. A release 1 px from the press drags 1 px [S11 L117].

---

## 9. Curiosity hooks

1. The desk's wallpaper *is* the program: 9,909 arcs, one per stored weight. Copper arcs add; indigo arcs subtract [S7].
2. Monitor shows the running program to itself: every cell, operation and output with its live value, scrolled natively in 64 recycled DOM slots [S1 L30; S11 L149].
3. A click is "is the point inside?", computed as four exact comparisons and `relu(sum − 3)`. The ReLU only clears zero when all four bits are 1 [S13 L2303-L2322].
4. Window stacking is a permutation matrix: one window per rank, one rank per window [S13 L231-L236].
5. The Notes to-do list ends with "Wire one more neuron by hand" [S16].
6. Its stored state is bit-identical whether the page runs at 10, 30, 60 or 120 fps [S3 L14; S11 L44].
7. When the lab tried HandwiredOS on WebGPU, the 6.4 MB shader still hadn't compiled after 28 minutes, and the GPU result was 27× slower than the CPU (2.2 ms against 81 µs) [S3 L40].
8. On 2026-10-13 the program went from its 21,229-operation peak to 4,251 operations in one day: merging Files into Monitor took it to 19,851, then handing text back to the browser's own textarea took it to 4,251 [S3 L22-L26].
9. Two springs serve twelve photos. Close one photo, open another, and close it within about half a second, and the first photo jumps into its cell [S11 L87].
10. The site's build fails if the landing card's "9,909" and "130" don't match what the live page measures [S3 L95; S2].

---

## 10. Visual and dramatic details

- **Palette:** paper beige, ivory windows with hairline borders, copper accent, grey-blue secondary arcs. The serif window titles are "Monitor", "Notes" and "Photos" [S4; S17].
- **Motion:** windows spring rather than ease; there are no CSS transitions, and every position comes from the program each frame [S17 L5-L10]. A photo grows from its grid cell to the open rectangle while the others fade [S1 L29].
- **For a teaching-machine set piece:**
  - the 4-bit edge test → relu(sum − 3) gate, as a paper contraption with four detents that must all click before a lever drops;
  - the permutation-matrix stack, as a 3 × 3 pegboard;
  - 64 slots on a rotating drum (r % 64) for the Monitor list.
- **Scale cue:** a 16.7 ms frame, of which the program took about 0.75 ms during a drag on 2026-09-16 [S3 L40]. On 2026-10-13 it took 0.15-0.19 ms [S3 L26].
- **Phone cue:** turn a phone sideways and back, and every window returns to where it was [S1 L22].
- **Avoid** depicting Cheng Lou's likeness, or any O'Reilly branding.

---

## 11. Sources

1. [S1] https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/README.md
2. [S2] https://github.com/chenglou/handwired/blob/257856e/assets/demos.html (L122-L146, Mini OS card)
3. [S3] https://github.com/chenglou/handwired/blob/257856e/lab/status.md (L7, L14, L16, L18-L34, L38-L40, L95-L103, L165-L176, L183-L189, L234)
4. [S4] https://github.com/chenglou/handwired/blob/257856e/assets/demos-handwiredos.webp (1520 × 800 screenshot, viewed 2026-10-27)
5. [S5] https://chenglou.me/handwired/ (fetched 2026-10-27; card numbers weights 9,909, layers 130, training 0) and https://chenglou.me/handwired/os/ (title "HandwiredOS"; Notes text)
6. [S6] films/handwired-explained/research/dossiers/compilation-matmul-backends.md §5a/§5c: run of `bun lab/runtime-cost/report.ts` and a probe, 2026-10-27, Apple M4 Max, Bun 1.4.3. Not re-runnable in this session (execution was denied).
7. [S7] https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/wiring.ts (L1-L12)
8. [S8] https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/monitor-footer.ts (L1-L14)
9. [S9] https://github.com/chenglou/handwired (README.md at 257856e; L30-L44)
10. [S10] https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md (L57, L58, L121, L213, L415, L479)
11. [S11] https://github.com/chenglou/handwired/blob/257856e/docs/behavior-choices.md (L5-L175)
12. [S12] https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md (L46, L147, L164)
13. [S13] https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/window-manager.ts (L231-L236, L661, L720-L747, L2269-L2345)
14. [S14] https://github.com/chenglou/handwired/blob/257856e/docs/tutorial.md (L223, L227)
15. [S15] https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/arrangement.ts (L1-L30)
16. [S16] https://github.com/chenglou/handwired/blob/257856e/assets/index.html (L6, L84-L89)
17. [S17] https://github.com/chenglou/handwired/blob/257856e/assets/handwired-os.css (L1-L12, L242-L253)
18. [S18] https://javascript.plainenglish.io/goodbye-if-else-hello-handwired-neural-code-35c821945d96 (lead only; members-only; source of the UNVERIFIED X quote)
19. [S19] https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/value-list.ts (L21, L435, L664)
20. [S20] https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/photo-gallery.ts (L578, `emitFirstActive`)

---

## Fact-check log (2026-10-27, adversarial pass)

Method: every key claim was re-read against the local clone at `257856e3b221140acb4cc4460626b850c0bd4ff1` (src/handwiredos/*, lab/status.md, docs/patterns.md, docs/behavior-choices.md, docs/execution-model.md, assets/*). The screenshot asset was decoded and viewed. The live site (https://chenglou.me/handwired/) and the commit page (https://github.com/chenglou/handwired/commit/257856e) were fetched, and the X quote was re-searched. Running repo code (`bun test`, `bun lab/runtime-cost/report.ts`) was denied, so run-only numbers stay single-session records.

**Confirmed (16 of 18 key claims):** 1 (README L3; demos.html L139), 2 and 3 (README L13; status.md L34; the screenshot's sidebar), 4 (demos.html L122-L127 comment and L142-L144; status.md L97; the live card shows 9,909 / 130 / 0), 6 (status.md L40; the CPU evaluator at window-manager.ts L1481; patterns.md L61), 7 (status.md L40, quote verbatim), 8 (patterns.md L57, verbatim), 9 (window-manager.ts L2302-L2326), 10 (window-manager.ts L231-L236, L2269-L2300; patterns.md L121; photo-gallery.ts L578), 11 (behavior-choices.md L99-L122; README L22), 12 (behavior-choices.md L149-L171; value-list.ts L63-L65, L414-L415), 13 (status.md L12, L14; README L17), 15 (status.md L99; wiring.ts L1-L8; monitor-footer.ts L1-L5), 16 (README L9; static count 43+29+24+14+5+5+5+2 = 127; not executed), 17 (status.md L167-L173), 18 (`file` reports 1520x800; the image was viewed).

**Changes made:**
1. **Claim 5, machine.** status.md L26/L28/L32-L34 don't name the machine for the Oct 13-14 runs. "M5 Max" is stated only for the Sept 16 and Sept 17 runs (status.md L40, L44) and some doc measurements (patterns.md L7, L61; execution-model.md L48). Misconception 7 and 5c were reworded; don't caption the 25 µs as "M5 Max". The film's 40.9-44.2 µs (M4 Max) run is a single-session record that no one reproduced, from compilation-matmul-backends.md §5c.
2. **Claim 14 and hook 8, the drop's cause.** The 21,229 → 4,251 drop took two steps (status.md L24, L26): the merge of Files into Monitor (to 19,851 ops, 217 layers), then the textarea (19,851 → 4,251). The "4.6× smaller" in §7 is now "about 4.7×" (19,851 / 4,251 = 4.67). The ~114 → ~25 µs comparison is correct.
3. **§4, GPU cases.** "The GPU wins only when one program runs over many tables" was an overstatement. patterns.md L55-L58 gives two cases: a tree run one dispatch per level (knuth-plass), and one program over many tables (JSON search).
4. **README line citations.** Shifted citations were corrected to the 257856e line numbers: tests L8→L9, viewport L23→L22, Photos L30→L29, Monitor L32→L30, Notes L33→L31 (also quote 9's source), files L45-L57→L35-L44.
5. **§5d, emitFrontmost.** "Front to back" was changed to "one rank at a time (from the last rank down)". The code loops `rank = windowCount - 1 … 0`, and no source says which end is the front. The hit test now carries the code comment's qualifier "once the edges exist" and the `>=` relation.
6. **Pinned commit.** 257856e is a merge commit (parents 4ea7fcb, e86c1b4) of the recovery-parser lab experiment (`git show`; GitHub commit page).
7. **Quote 11.** It stays UNVERIFIED. Only the Medium excerpt carries it, and that excerpt ends ", lol 🙂". No original X post was found (searched 2026-10-27).
8. **Minor wording.** The Sept 16 row now carries Bun 1.4.0 and load 4-6, and notes that it measured the 4-window, 14,019-op program. The focused-window dot is now cited to the screenshot, not the CSS.

Sources: https://github.com/chenglou/handwired/blob/257856e/lab/status.md · https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/README.md · https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md · https://github.com/chenglou/handwired/blob/257856e/docs/behavior-choices.md · https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/window-manager.ts · https://github.com/chenglou/handwired/commit/257856e · https://chenglou.me/handwired/ · https://javascript.plainenglish.io/goodbye-if-else-hello-handwired-neural-code-35c821945d96 (lead only)
