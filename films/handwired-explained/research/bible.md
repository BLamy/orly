# Research Bible: Handwired, explained

Film: `handwired-explained` · current understanding ends **2026-10-27** · subject: `chenglou/handwired` pinned at
`257856e` (a merge commit dated 2026-10-16 17:33:49 -0700 = 2026-10-17T00:33:49Z; still the head of `main` on
2026-10-27). This is the screenwriter's single source of truth. Every fact here appears in `claims.json` (ids in
square brackets, e.g. [PJ05]) and every quotation in `quotes.json` (ids Q001-Q168). Nothing a fact-checker corrected
into a different form or marked unverifiable appears here except in the **Do not use** list (section 11).

**Source shorthand.** `R:path#Lx` = `https://github.com/chenglou/handwired/blob/257856e/path#Lx`. `C:hash` =
`https://github.com/chenglou/handwired/commit/hash`. A repo path at the pin is a valid source, as in the shelf
books' `sources.json`. Numbers marked *(run)* come from commands run in the clone on 2026-10-27 and reproduced by a
fact-checker; numbers marked *(derived)* are arithmetic from confirmed values.

**The one-line film.** Handwired lets you write a JavaScript UI as builder code that appends a fixed list of FP32
weighted sums and ReLU-gated products; that list *is* a neural net with hand-written weights. It runs every
operation every frame, cannot stop early, matches JavaScript exactly within declared contracts, and can be
differentiated, though the decisions have slope zero. The lab around it is unusually honest about what did not
work.

---

## 1. Master chronology

Context (framing only; the repo cites none of the 1943-1995 work):

- **Dec 1943** · McCulloch & Pitts, "A Logical Calculus of the Ideas Immanent in Nervous Activity", *Bull. Math. Biophysics* 5:115-133 [FR01-FR05] · Springer doi 10.1007/BF02478259
- **30 Jun 1945** · Von Neumann's *First Draft of a Report on the EDVAC* models its elements on McCulloch-Pitts neurons [FR06] · Godfrey transcription
- **15 Dec 1951** · Kleene, RAND RM-704: nerve nets = finite automata = regular events; calls Part III of 1943 "obscure" [FR07-FR09] · rand.org RM704
- **1956** · Kleene's memo published in *Automata Studies* (Princeton) [FR07]
- **Nov 1959** · Lettvin, Maturana, McCulloch & Pitts, "What the Frog's Eye Tells the Frog's Brain", *Proc. IRE* [FR10-FR11]
- **Jun 1960** · Sklansky, "Conditional-Sum Addition Logic", *IRE Trans. Electronic Computers* EC-9(2) (the name behind `sklanskyPrefix`) [PT26]
- **1968** · Batcher, "Sorting Networks and Their Applications", AFIPS SJCC (measured alternative, not used) [PT27]
- **Mar 1982** · Brent & Kung, "A Regular Layout for Parallel Adders", *IEEE Trans. Computers* C-31(3) (the name behind `brentKungPrefix`) [PT26]
- **1992 / 1995** · Siegelmann & Sontag: a finite rational net simulates any Turing machine (about 1,000 then 886 neurons), needing unbounded precision [FR13-FR14]
- **1998** · Maass & Orponen: arbitrarily small analog noise reduces analog nets to finite automata (contested emphasis) [FR15]
- **10 Jun 2004** · Fiedler, "Fix Your Timestep!" discusses "the so called 'spiral of death'" [HL26]
- **13 / 19 Mar 2019** · Sutton, "The Bitter Lesson"; Brooks, "A Better Lesson" [FR20]
- **3 Jan 2020** · Gidon et al., *Science*: human dendrites compute XOR-like functions with graded spikes [FR12]
- **12 Feb 2020** · Shazeer names ReGLU in "GLU Variants Improve Transformer" (a naming parallel only) [FR23]
- **13 Jun 2021** · RASP (Weiss, Goldberg, Yahav) [FR16]
- **12 / 30 Jan 2023** · Tracr (Lindner et al., DeepMind); Looped Transformers as Programmable Computers (Giannou et al.) [FR17-FR18]
- **25 Mar 2026** · Percepta's transformer-vm repo: a "standard softmax-ReGLU transformer" with analytic weights runs a WebAssembly VM [FR19]
- **27 Apr 2026** · Bournez, arXiv 2604.24356: the same two-ReLU integer gate, exact on integers [FR24]

Handwired (all times Pacific, -0700, unless UTC):

- **2026-06-03 20:24** · First commit `3d2c717` "Create numeric UI atom lab"; `reglu(` already present [PJ05, PJ06, PR09] · C:3d2c717
- **2026-06-03 20:38** · `592f296` "Set up minimal Bun TypeScript project" [PJ05]
- **2026-06-06** · README retitled "Indirect" (`2be29e4`); "IndirectOS" from 06-08 [PJ07]
- **2026-06-07** · Boolean atom (`8_388_609`) first appears, `fd8f0a3` [PR09]
- **2026-06-09** · `backpropagateReference` first appears, `515d6a8` "Add differentiable UI fitting demo" [DG02]
- **2026-06-10** · Learned gallery's geometry code begins, `00c1048` [DG02]
- **2026-06-21** · MIT license added, `7409b62` [PJ10]
- **2026-07-08** · Lab round one `a137ccd`: four experiments, gather lowering and `assumeOneHot` arrive [LB01, PR16]
- **July 2026** · Briefs treat "Established conclusions from the design conversation (take these as given)" [LB02]; parked items set aside [LB27]
- **August 2026** · No commits [PJ09]
- **2026-09-03 06:13** · The reassessment and its fixes, `c6bf933`: loss-scale reversal 0/20 → 20/20, the shared-bug oracle, the multiply gradient at zero; 274 tests pass [LB03-LB12, DG28]
- **2026-09-12 to 14** · `lab/ui-exploration`: 24 prototypes of how far circuit UI goes [LB14]
- **2026-09-13** · Exactness-budget study: float64 everywhere breaks UIs; FP32 order only at rounding points fixes them [EX10]
- **2026-09-14** · Cheng picks the recommended option for runtime decisions 1-3 (index read, `emitCompare`, host-written spring matrix); springs stop storing absolute positions [PJ23, SP10, SP20]
- **2026-09-15** · `17c2318` index reads, exact comparisons, host-timed springs; `6ace584` converts IndirectOS; HandwiredOS 5,253 ops/192 layers → 3,654/124; one evaluation per frame ends [PR22, OS03, HL17]
- **2026-09-15 21:27** · `7452dd9` branded wires, `cells.ts`, template app and tutorial [CB07, CB08]
- **2026-09-16** · Tag `exploration-2026-09`; dynamic division parked; HandwiredOS on WebGPU 2.2 ms vs 81 µs CPU; 6.4 MB shader not compiled in 28 min [LB14, EX14, CM08, CM09]
- **2026-09-17** · Runtime moves to `src/runtime`; engineering guide pass (validator 85 → 7.3 µs per hover frame); JSON highlighter and regex search experiments start [CB18, CM14, JS20]
- **2026-09-17/18** · Term-order probe: "not switched" [EX15]
- **2026-10-06 20:10** · Renamed Indirect → Handwired, IndirectOS → HandwiredOS (`e86f5ed`) [PJ07]
- **2026-10-13** · Demo site and GitHub Pages; JSON search built in a day (loop shaders cut compile 107-130 s → ~0.1 s); first "clearly faster" README walked back by a same-day review; HandwiredOS peaks at 21,229 ops then drops to 4,251 that evening [PJ18, JS09, JS21, OS03, OS04]
- **2026-10-13** · Learned gallery's snapping fix offered and rejected; penalty instead [DG13]
- **2026-10-14 03:30-04:35** · Tag `json-regex-experiments-2026-10` (`4a80450`); `bit-emit.ts` lands (945 ms → 5.2 ms) [JS20, JS10]
- **2026-10-14 05:50** · Cheng's `59b12cd` "Cleanup": README gains "unfreezing" and "nanoGPT" lines [PJ24, DG14]
- **2026-10-14 (day)** · Gallery and JSON search promoted to `src/`; highlighter/regex pages leave the site, then their code is removed at Cheng's request (18:09-19:53) [DG14, JS20]
- **2026-10-14 19:06 / 19:11 / 19:15** · README typo fix; history-rewrite record ("strip 1-4 yeah. Do it quick plz, then publish."); GitHub repo created (02:15:09 UTC Oct 15) [PJ11-PJ13]
- **2026-10-14 22:43** · Last recorded full test run: 1,264 passing, 2 skipped, 160 files, 159 s (`259c5d2`) [LB12]
- **2026-10-15 00:35** · `4ea7fcb` entry docs fixed for four new readers (the shelf books' pin) [CB17]
- **2026-10-15 00:50** · Recovery-parser side branch begins (about 240 commits over two days) [PJ15]
- **2026-10-15 02:24:24 UTC** · Launch post on X [PJ14]
- **2026-10-15 to 16** · First HN submissions by others; AlphaSignal write-up [PJ25, PJ26]
- **2026-10-16 17:33** · Merge `257856e`: the recovery experiment (clear win on JSON; TOML failed by its pre-set rule) [PJ15, LB19-LB25]
- **2026-10-20 21:32 UTC** · "Show HN: Turn regular JavaScript into a neural net" (45 points, 12 comments when fetched) [PJ26]
- **2026-10-22 to 23** · HN critiques: "overclaim"/DSL, "why?", the a = 4.5 → 11 finding, a Tracr pointer [PJ03, PJ27]
- **2026-10-27** · As-of: `257856e` still head; ~2,033-2,034 stars; no public discussion of the lab found [PJ17, PJ28]

---

## 2. Eras

**E1. Neurons as logic (1943 to about 1959).**
- *Belief:* all-or-none neurons make the brain a two-valued logic machine; nets compute logical expressions [FR03].
- *Held by:* McCulloch and Pitts; von Neumann adopted the idealization for EDVAC [FR06]; Kleene kept it as a working model, calling all-or-nothing firing "close to the biological reality" while flagging problems [FR07, Q141].
- *Dissent:* Kleene found the arbitrary-net part obscure [FR08]; the 1959 frog paper (by McCulloch and Pitts themselves, with Lettvin and Maturana) showed the eye sends interpreted patterns [FR10]. Reading that as a refutation is later interpretation [FR11].
- *What ended it:* as biology, electrophysiology from 1959 and dendritic computation (2020) [FR12]; as computer science it never ended: it became automata theory and the stored-program computer.

**E2. What can a net compute? (1951-1998).**
- *Belief:* finite nets are finite automata [FR07]; with unbounded rational precision they are Turing-complete [FR13]; with real weights, beyond Turing [FR14].
- *Dissent:* noise. Maass & Orponen show arbitrarily small analog noise drops the power to finite automata; Siegelmann & Sontag claimed some robustness. **Contested** [FR15].
- *Relevance:* FP32 is finite, so one Handwired evaluation is a fixed finite circuit; the host loop supplies unbounded time [FR25].

**E3. Learn the weights; compile only as a tool (2019-2026).**
- *Belief:* general learning beats hand-built knowledge (Sutton 2019) [FR20]. Compiled networks survive as expressivity proofs (Giannou), interpretability ground truth (Tracr) and "LLM as computer" hybrids (Percepta) [FR17-FR19]. Tracr's authors: "we will likely never compile fully featured language models in Tracr" [Q149].
- *Dissent:* Brooks, "A Better Lesson" [FR20, Q154]. **Contested; dominant, not consensus.**
- *Where Handwired sits:* a hybrid bet: hand-written exact programs that are also differentiable [PJ04]. It is not a transformer and has no attention [FR22].

**E4. Inside Handwired, June-August 2026: "established conclusions".**
- *Belief:* the July briefs listed conclusions to "take ... as given": layouts interpolate validly, gather lowering "discovered hard attention", and "A JS-to-circuit compiler for arbitrary code is a dead end" [LB01, LB02].
- *Held by:* the July experiment briefs, from an unnamed "design conversation"; do not attribute to Cheng [LB02].
- *Lasted:* roughly July to 3 September 2026.
- *What ended it:* the September 3 reassessment's reruns [LB03-LB11].

**E5. The reassessment and the runtime decisions (3 Sept to mid-Sept 2026).**
- *New belief:* ten claims retired and replaced with narrower ones; "some correctness checks compare implementations that share the same mistake" [LB03, Q116]; the 0/20 learning failure was an Adam-epsilon artifact [LB04].
- *Decisions:* Sept 14-15: index read, `emitCompare`, host-written spring matrix, events at timestamps, `advanceFrame` [PJ23, SP20, HL17].
- *What it replaced:* one evaluation per frame in HandwiredOS (until Sept 15) [HL17]; absolute-position springs (until Sept 14) [SP10]; hand-kept table positions (until `7452dd9`) [CB08].

**E6. The October sprint and launch (13-16 Oct 2026).**
- *Belief briefly held:* "the GPU is clearly faster" for the highlighter half (13 Oct, 09:01), hedged from the start and walked back by a review the same day [JS21].
- *Settled view:* GPU wins only for one program over many tables that stay on the GPU, or trees run one dispatch per level; not for HandwiredOS, not against 8 JS workers [CM08, JS13, PT06].
- 683 of 825 commits fell on Oct 13-16 [PJ09]; the repo went public on Oct 14 (Pacific) [PJ11].

**E7. Reception (15-27 Oct 2026).**
- *Public belief:* a viral launch; a Show HN; critics say "regular JavaScript" overclaims (it is builder code, a DSL), and ask "why?" [PJ03, PJ26, PJ27].
- *Not yet discussed publicly:* the lab, the reassessment, the recovery experiment [PJ28].

---

## 3. People index

General rule: **no likeness of any living person.** Use generic silhouettes, hands, desks, or text cards. Machines clack, never chime.

| Person | Role | Institutions (as sourced) | Appearance notes for silhouette |
|---|---|---|---|
| **Cheng Lou** (`chenglou`) | Author and sole commit author of Handwired; decides runtime options; asks the lab's questions [PJ08, PJ23] | Repo names none. Commit times are -0700. LICENSE: "Copyright (c) 2026 Cheng Lou" [PJ10]. Trade press (secondary): "formerly a member of the React core team" [PJ25] | None sourced. Generic contemporary adult at a desk, or only hands, a laptop and a lamp; never captioned as a portrait. No glasses, hair or build from photos |
| AI coding agents | 756 of 825 commits co-authored "Claude Code"; the reassessment's writer traced "Claude conversations" and an earlier "Codex" design discussion [PJ08, PJ21] | Tools, not people; no model named [PJ22] | A second paper hand at the keyboard; no face, no words of its own |
| Anonymous reviewers / readers | Followed the tutorial from a clean copy; four readers without background; the "measuring agent" [CB17, JS21] | Unnamed | Paper-cut hands with red pencils |
| HN commenters (gregsadetsky, curtisblaine, hungryhobbit, echoangle, aatd86) | Public critics and readers [PJ03, PJ27] | — | Do not depict; quote as text cards ("a Hacker News commenter") |
| Warren S. McCulloch (1898-1969) | Co-author of the 1943 logical calculus [FR01] | Illinois Neuropsychiatric Institute, U. of Illinois College of Medicine (1943); later MIT RLE | Per Gefter (secondary): full "wild" beard, thin face, 1940s suit and tie, cigarette |
| Walter Pitts (1923-1969) | Co-author, self-taught logician [FR01] | University of Chicago circle (1943) | Per Gefter: small, shy, bespectacled, long forehead; 18 when he met McCulloch |
| John von Neumann | EDVAC report author [FR06] | Moore School, U. Pennsylvania (1945 report) | Appearance not researched: generic 1940s figure or text card |
| Stephen C. Kleene (1909-1994) | Regular events, finite automata [FR07] | RAND (RM-704); U. Wisconsin-Madison | Not verified: generic 1950s academic, suit and tie |
| Jerome Lettvin, Humberto Maturana | Frog's-eye co-authors [FR10] | MIT RLE (1959) | Not researched: generic lab silhouettes |
| Hava Siegelmann, Eduardo Sontag | Turing-complete rational nets [FR13] | Rutgers (1991-1995) | Living: generic 1990s office, chalkboard |
| Wolfgang Maass, Pekka Orponen | Noise result [FR15] | — | Text card |
| Gail Weiss, Yoav Goldberg, Eran Yahav | RASP [FR16] | Not checked | Living: text card |
| David Lindner et al. | Tracr [FR17] | DeepMind | Living: text card |
| Angeliki Giannou et al. | Looped transformers [FR18] | U. Wisconsin-Madison, Yonsei, Princeton (PMLR listing) | Living: text card |
| Christos Tzamos and others | Percepta [FR19] | Percepta | Text card |
| Rich Sutton; Rodney Brooks | The Bitter Lesson and its dissent [FR20] | — | Living: text cards |
| Noam Shazeer | Named ReGLU (2020) [FR23] | Google (2020 paper) | Text card; not Handwired's lineage |
| Jack Sklansky | 1960 conditional-sum adder [PT26] | Biography unverified; do not show | Generic 1960 engineer at a bench, no likeness |
| Richard P. Brent, H. T. Kung | 1982 parallel adder [PT26] | ANU Canberra; Carnegie-Mellon | Generic c. 1980 academics |
| Kenneth E. Batcher (1935-2019) | Sorting networks, as contrast only [PT27] | Goodyear Aerospace, Akron (1968) | Generic |
| Glenn Fiedler | "Fix Your Timestep!" (2004) [HL26] | — | Title card only |
| Bengio, Léonard, Courville; Kingma & Ba; Andrej Karpathy | Straight-through estimator; Adam; nanoGPT [DG19, DG30] | — | Text cards only |

---

## 4. Experiments, machines and apparatus (art department)

**There is no physical apparatus in Handwired.** The real setting is one laptop-class machine (the docs name an
Apple M5 Max, 18 cores, 36 GB; show no logos), Bun 1.4.x, headless Chrome 153-155 through Metal, a terminal, and
browser pages [LB13]. The house look matches the repo's own: the demo site is "paper, ink and one copper accent,
with system fonts only" [PJ18]; HandwiredOS is "a desk, sheets of paper for windows, and one copper wire under the
dock" [OS18]. The teaching machines below are metaphors, each tied to real numbers.

1. **Two ramps and a lever (README example).** Two hinged boards, flat then a 45° climb, corners at 4 and 5. A marble at `a` reads each height; a lever shows the difference. Marble at 4.5 must read 0.5 and the machine jams on "11" [TE02, TE03].
2. **Both branches run.** Two conveyor arms carrying "10" and "12" tiles, always moving; a 0/1 shutter passes one fully. At 4.5 both shutters stand half open and an "11" tile drops out [TE03, TE11].
3. **The sign-cascade lens train.** Seven stages: six lenses (×2^14, then ×2^24 five times), each followed by a stop at height 1; the seventh is the final ReGLU `relu(1 − 2^15·stage)`, then a flip gives the bit. A hairline difference becomes a full bar; total magnification 2^149 [TE08].
4. **The boolean-atom detent.** A fine ruler slid onto a giant ruler starting at 8,388,609 with ticks 1 apart; the score snaps to a tick and slides back. 0.5 snaps up because the start mark is odd [PR08].
5. **Tags on wires.** Declarations as paper tags: "0..16,384", "grid 1/64", "one-hot". A false tag slips a gear silently [PR11, EX04].
6. **The one-hot lamp row and gather arm.** N lamps, exactly one lit; a pointer arm swings to it and lifts one value, but every tray behind is still filled [PR14, PR15].
7. **The index-read card drawer.** A rotary selector that only drops to the lower detent (floor); out of range it clamps or yields a blank +0 card [PR18, PR19].
8. **The source table.** A strip of numbered pigeonholes; the toggle has 20: 1280 and 800 in slots 0-1, event flags that pop to 1 and fall to 0, a 4-slot spring-matrix rack, state cards [CB09].
9. **The builder ribbon.** Operation tags appended one by one to a growing ribbon, each pinned one layer right of its deepest input; a duplicate expression returns the existing tag [CB05].
10. **The matmul loom.** 130 thin frames, one per layer; 9,909 threads (copper add, indigo subtract, as in the real wallpaper); ramps (2,776 ReGLU) and 59 detent wheels behind the frames; mostly empty air. "Nothing merges across a gate": sheets fuse, then stop dead at a gate frame [OS02, OS14, CM07].
11. **The host clockwork.** A 1/64 ms ruler, a 4 ms escapement, a 300-tooth ratchet with a release pawl (the snap), a detent that locks only every 16th tooth (the 64 ms settle check), four dials preset to the matrix power, event tokens stamped with times, a carbon-copy tray for frame previews that is thrown away [HL03, HL08, HL10, HL15].
12. **The spring step stamp.** A 2×2 brass plate `0.99536 | 0.00352 / −1.16 | 0.88`; cards −300 and 0 go in, −298.608 and 348 come out [SP02, SP03].
13. **The squaring press.** Folds the plate onto itself (M², M⁴...): 300 steps take 8 squarings (derived: 300 = 100101100₂).
14. **The prefix loom (8 items).** Tabs 3 1 4 1 5 9 2 6; Brent-Kung joins 11 times in 4 levels to 3 4 8 9 14 23 25 31; Sklansky 12 joins in 3 levels with one tab fanning into four threads [PT15].
15. **The counting rail.** Pegs at 40, 80, 80, 140, 180; pointer bar at 90; three flags drop, the tally clicks to 3 [PT08].
16. **The knockout bracket.** Tokens 0 1 0 1 0 0 1 0 merge up in pairs and one rides back down, always left when left holds 1, landing on slot 1 [PT11].
17. **The rank board.** Keys 30 10 30 20 in a 4×4 grid of flip tiles; rows sum to 2 0 3 1; cards slide to slots without ever swapping [PT16].
18. **The K-slot rack.** Eight items, visible 0 1 1 0 1 0 1 1, counter 0 1 2 2 3 3 4 5; three frames get items 1, 2, 4; a card says the capacity is fixed [PT18].
19. **The bracket odometer.** `{[{}]}` with codes 0 1 1 5 1 1, one bit per depth [PT22].
20. **HandwiredOS desk** (from the asset screenshot): warm paper-beige desktop with a faint dot grid; wallpaper of hundreds of thin semicircular arcs, mostly copper/tan, some grey-blue; a dock of three white rounded tiles (pulse, document, picture); windows Monitor, Notes, Photos with serif titles; Monitor's sidebar "THIS PROGRAM: State 234, Operations 4,646, Outputs 493", footer "130 layers · 9,909 weights · 114 KB"; Notes holds a real textarea ending "Wire one more neuron by hand"; Photos a 4×3 grid of 12 landscapes; focused window with a faint copper wash [OS02, OS14, OS18].
21. **JSON search map.** 100,000 tiny cells in reading order; matches light copper, drawn larger than their cells; on the CPU the map fills from the top in ~8 ms pieces while a line counts up [JS17]. RegExp gets its own booth with a 10-second hourglass and a trapdoor (the killable worker) [JS16]. Two passes: a clerk walks each 512-character strip right to left leaving notes, then left to right [JS06].
22. **The learned gallery stage.** A 5:4 stage; hand-drawn rectangles; photos start piled as 0.18 × 0.18 squares near the center and fan out to their rectangles over about 1-3 s; a loss chart; a "Misalignment penalty" slider; presets Story (10 rectangles), Cinema (9), Contact sheet (11) [DG06, DG13].
23. **The ReGLU valve.** Left value flows through an opening of `max(0, gate)`; backward, gradient flows to the gate only while open; a closed valve is a dead branch with no backward arrow [DG01, DG11].
24. **The Huber clamp.** Each photo edge pulls on a bias with a spring whose force caps at 0.08, so a far-off photo pulls no harder than one 0.09 off [DG07, DG26].
25. **The recovery grid.** A lookup table of ~1,560 cells; ~240 glow on the valid path; a paper hand fills the ~1,300 dark ones [LB19].
26. **The ledger.** `lab/status.md` as a ledger with drawers "Known issues", "Open decisions", "Still open", "Parked and deferred"; ten claims struck through and rewritten; two sealed archive drawers labelled with the tags [LB03, LB14, LB26-LB28].

Historical props (framing only): the 1943 page of arrow-and-loop net diagrams; the 98-page typed RAND memo; the
1959 frog facing "an aluminum hemisphere, 20 mils thick and 14 inches in diameter, silvered to a matte grey finish",
with a dull black disk under 1° moved by a hand-held magnet outside (Lettvin et al. p. 1941-42) [FR10].

---

## 5. Technical primers

### 5.1 What a Handwired program is

- **Source table:** one `Float32Array`. **Cells:** its numbers (constant, input, event bit, state). **Wire:** the position of a cell or of an operation's result. **Host:** the JavaScript around the program [CB01].
- **Four instructions** [PR02]: `affine(left) = left` (the weighted sum, a matmul row); `reglu(left, gate) = f(left × max(0, gate))`; `boolean(score) = f(f(f(score) + 8,388,609) − 8,388,609)`; `index` = `values[candidates[floor(form)]]`. `f` is `Math.fround`. An instruction reads only earlier wires [PR01].
- **FP32 order:** `value = f(bias)`, then for each term `value = f(value + f(f(coef) × values[wire]))` [PR03].
- **Builder code** runs once and appends operations; nothing branches or loops at run time [PJ02, Q017]. No tool converts existing JS [Q014]. Macros (`emitSelect`, `emitCompare`, min/max, springs) expand into the four instructions [PR06].
- **Two phases:** declare cells, `createCircuit()`, builder code, `table.next` for each state cell, `finish()` [CB04].
- **Logic:** NOT `1 − b`; AND of N `relu(sum − (N−1))`; OR `1 − relu(1 − sum)` [PR07].
- **Intuition:** a program is a recipe card read top to bottom every frame; every `if` is a dimmer switch set fully on or off; the "weights" are the recipe's numbers, written by hand.

### 5.2 Deep dive 1: `(a > 4) ? 10 : 12` by hand

The README version [TE01]: `above4 = max(0, a−4) − max(0, a−5)`; `result = above4·10 + (1−above4)·12`.

| a | max(0,a−4) | max(0,a−5) | above4 | result | JS |
|---|---|---|---|---|---|
| 3 | 0 | 0 | 0 | 12 | 12 |
| 4 | 0 | 0 | 0 | 12 | 12 |
| 5 | 1 | 0 | 1 | 10 | 10 |
| 6 | 2 | 1 | 1 | 10 | 10 |
| 100 | 96 | 95 | 1 | 10 | 10 |
| **4.5** | 0.5 | 0 | **0.5** | **11** | 10 |
| 4.25 | 0.25 | 0 | 0.25 | 11.5 | 10 |

[TE02, TE03] *(run, recomputed by hand)*. Shape: `above4 = clamp(a − 4, 0, 1)`; integers sit exactly on the two
corners, "the whole trick, and the whole caveat". FP32 adds a second limit: a = 2^24 + 6 = 16,777,222 gives a − 5 →
16,777,216, above4 = 2, result 8; the landing page's hidden comment says so [PJ19].

**What the runtime really builds** [TE04-TE09]:
- `emitCompare(circuit, a, '>', constant(4))`. Needs finite declared ranges or it throws.
- **On a grid** (`assumeGrid(a, 1)`): `ramp = relu(5 − a)`, `bit = relu(1 − ramp)`: **2 operations, 2 layers**. a = 5: ramp 0, bit 1 → 10. a = 4: ramp 1, bit 0 → 12. a = 3: ramp 2, bit relu(−1) = 0 → 12.
- Full ternary: **8 live operations in 5 layers** (layer 1 ramp, 10, 12; 2 bit; 3 complement and bit×10; 4 (1−bit)×12; 5 sum).
- **A false grid** (a = 4.5 under grid 1): bit 0.5, result 11, exactly the README's failure; a test pins it; `validateGrids` throws "wire 0 must be a multiple of 1, got 4.5" [TE07]. "Declarations are promises from the caller, not proofs." [Q029]
- **No grid:** the sign cascade, **16 operations in 15 layers**: keep `d = f(a − 4)`, six clamp stages (×2^14, then ×2^24 five times), the final `relu(1 − 2^15·stage)`, then the bit flip. Scales multiply to **2^149**, so any nonzero FP32 difference, down to 2^-149, becomes a full notch. At 4.5 the answer is correct (10). Full ternary 22 ops / 18 layers [TE08, TE09].
- **One honest sentence** (`assumeGrid(a, 1)`) turns 16 operations into 2 [PR12].
- **The select** is `gate × on + (1 − gate) × off`, 4 operations in 3 layers; argument order is (gate, **off**, **on**) [TE10]. Both sides always compute; an unselected Infinity still gives NaN (0 × ∞) [TE11]. It avoids `off + g·(on − off)` because that loses tiny values or overflows [TE11].
- **Multi-way:** else-if as nested selects 15 ops / 7 layers; one-hot by neighbor differences 13 / 5, 10 / 4 with a gather [TE12]; many overlapping targets: `emitFirstActive` 316 ops / 31 layers vs 127 / 127 for a chain at 64 [TE13].
- **Tests:** `comparison.test.ts`: 15 tests, 4,402 checks against native JS comparisons [TE14].
- **Gradient (scoped to the README expression; contested inside the repo):** the hand-written bit reports slope 0 at whole numbers and 1 exactly at the threshold, the slope of a ramp the program never uses on integers; `emitCompare`'s own grid bits report 0 unless a grid promise is false [DG15].

### 5.3 Exactness in FP32

- **Definition:** "equality to the stated FP32 calculation, ignoring the sign of zero, not equality to arbitrary JavaScript float64 arithmetic" [EX01, Q036]. The reference evaluator defines the program; the compiled one must match every live value with `===` [EX01].
- **Safe values:** integers up to 2^24 = 16,777,216 (`fround(2^24+1)` = 16,777,216) [EX02]; multiples of a power-of-two grid within 2^24 steps; power-of-two scaling; subnormal differences down to 2^-149 [EX05, EX18].
- **Where JS and FP32 part ways:** at 1732 px, `f(f(1708) × f(1/244))` = 6.999999523162842, so `columns >= 7` is 0 where float64 says 7; a plain FP32 division would give 7, the reciprocal is the culprit [EX03].
- **False promises:** a source outside its range is refused; a false range on a computed wire is not: declare y ≤ 16,384 falsely and `y > 3` is wrong for 23,613 of the integers to 40,000, first at 16,388 [EX04].
- **Rounding points:** 4 kinds; strict FP32 order only for boolean and marked operations [EX07]. HandwiredOS: 59 / 707 / 33 [EX08]. GPU shader compilers folded the atom away in a lab probe (Metal only) [EX09]. Float64 "everywhere" broke UIs (18,820 of 20,000 percent labels) [EX10].
- **Magnitude limits:** `emitMinimum(1000.37, 0.3)` = 0.29998779; `emitMaximum(2^24, −1)` = 16,777,215; clamp01(2^25) = 0 [PR23]. Division, sqrt, sin are not exact or in the runtime [PR25]; dynamic division parked [EX14].
- **Tests:** `bun test tests/runtime`: 174 pass, 0 fail, 155,853 checks, about 2 s [EX11]. Honest scope: "This is not a proof of all possible circuits or all JavaScript programs." [EX17]

### 5.4 Compilation and backends

- Layers by dependency depth; each a sparse CSR matrix + bias, then gathers, index reads, ReGLU gates, boolean rounding; dead operations removed [CM01]. CPU order is exactly the reference's FP32 order [CM02].
- **HandwiredOS:** 234 cells, 727 roots, 5,028 built / **4,646 live** operations (1,811 sums, 2,776 ReGLU, 59 boolean), **130 layers**, **9,909 weights** [OS02]. Longest gate chain 71 [CM07]. Film framing: "one big matmul, sliced into 130 thin layers".
- **Costs:** about 10 µs per 1,000 layers (55 / 65 / 210 µs for 16,384 sums in 64 / 1,024 / 16,384 layers) [CM06]; HandwiredOS one evaluation 35.76 µs median (author's runtime-cost process, Oct 14) [OS06]; 25.2-25.3 µs at 4,254 ops [OS05].
- **Backends:** all of `src/runtime` is JS on the CPU; "Tensor" ≠ GPU; only JSON search uses WebGPU among the demos [CM04]. HandwiredOS on WebGPU (Sept 16): 2.2 ms vs 81 µs, about 27× slower; shader 28 min uncompiled, 24 pieces in 8.1 s [CM08, CM09].
- **README's GPU techniques:** sparsity yes; fusion partial; reordering only within rounding-point rules; scheduling parked [CM05].
- **Buffer lifetime:** the reusable evaluator overwrites its output array: "Copy it when retaining a frame." [CM13]

### 5.5 Deep dive 2a: the host loop, and why a program cannot stop early

- **Constraint, in the repo's words:** "The program runs every operation on every frame and can't stop early, so a loop becomes a count, a tree, a table, or the same work on every item." [Q015, HL01]
- **The loop** [HL02-HL06]: handlers queue timestamped events (rounded to 1/64 px) and request a frame → `requestAnimationFrame` → `advanceFrame` plans evaluations → for each: pick table or copy, write 4 matrix cells for that step count, write settle/snap bits, write viewport, write events, evaluate (validated), copy next state back if writing back → DOM writes from outputs only → request another frame only while the clock runs.
- **The plan:** settle checks every 64 ms of simulated time (16 steps), one evaluation per distinct event timestamp, one frame evaluation, a snap past 300 steps [HL03, HL08].
- **Policies:** 'every evaluation' (default) vs 'events and settle checks' (template, HandwiredOS: the frame evaluation runs on a copy and is discarded). Under the latter, in the repo's tests, stored tables and drawn outputs are identical in every bit at 10, 30, 60, 120 fps, as long as events arrive in order and no snap runs [HL10, HL11]; under the former about half of stored tables differ between 60 and 120 fps [HL12].
- **Why order matters:** the familiar order (handle inputs, then catch up) makes 10 fps and 120 fps differ by up to 359 px [HL18].
- **Static bound:** at most 300 steps (1,200 ms) per frame; past it, snap: every object lands on its destination with zero velocity, backlog dropped [HL08]. 300 × 4 × 64 = 76,800 grid steps < 2^24 [HL09]. The cap is ~72× a 60 fps frame's ~4.17 steps [HL23]. Snap threshold 1,144 ms vs 1,204 ms by policy [HL13].
- **Worked frame plan** (float64 port): press at 1000.3 ms; frames then preview 1, 6, 10, 14 steps from the last commit until the settle check commits at 16 steps; "the display frame is a dress rehearsal" [HL14].
- **Iteration:** across evaluations (one turn of the state machine per timestamp), or within one by regrouping (prefix scans of event tables; speculation; set-of-states) [HL16, PT24].
- **Seven behavior choices** [HL19-HL25]: hit-test destinations (toasts: 35 ops/5 layers vs 205/34); events at timestamps; read last frame's value (17 vs 30 layers, lag 60 px); fixed maximum with a named fallback (snap, carry, split, report, drop, clamp, throw) [HL22, Q072]; store what the user placed (125 ops/7 layers); anchor scroll to the top row; scroll natively, select at release.
- **Snap vs carry** is a design disagreement: chenguini's numerical-spring guidance carries, Handwired snaps, `index.ts` runs every step with no cap [HL27]. Fiedler carries only sub-step remainders and clamps at 0.25 s [HL26].

### 5.6 Deep dive 2b: loops as counts, trees, tables and same work on every item

- **18 patterns** in four families [PT01]. **Associativity is the licence** for a tree; FP32 sums make the grouping part of the result: 799.300048828125 (loop) vs 799.2999877929688 (pairs), 2^-14 apart [PT02, PT03].
- **Trade:** at 1,024 steps loop 1,023 in 1,023 levels; Sklansky 5,120 in 10; Brent-Kung 2,036 in 18 [PT04]. **On the CPU the loop wins** with either network; on a GPU a tree can win (0.47 ms vs 3.4 ms) [PT06, Q062].
- **Prefix networks:** `src/runtime/prefix-networks.ts` holds exactly Sklansky (1960) and Brent-Kung (1982); not Kogge-Stone, Hillis-Steele or Ladner-Fischer [PT05]. 8-item worked example [PT15].
- **findIndex:** a count when the test flips once (195 ops in 3 layers at 64 rows vs 447 in 34) [PT08], monotonicity required [PT09]; binary search 42 ops in 42 layers among 10,000 rows [PT10]; a tree (`emitFirstActive`) when hits can be anywhere [PT11].
- **Running totals:** chain 1,023/1,023; wide sums 1,023 in 1 with 524,799 weights; Brent-Kung 2,036/18 [PT13]. At 10,000 rows Brent-Kung drifts 0.26 px vs the loop's 5.67 px [PT14].
- **Sort without sorting:** each item's position is a count of the items before it: 4,096 ops in 3 layers at 64 items; keys 30 10 30 20 → ranks 2 0 3 1 [PT16]. Batcher networks only measured (10,624 / 105 vs 16,512 / 5 for ranks) [PT17].
- **filter + slice into K nodes:** visibility bits → Brent-Kung count → slot k takes the item where the count reaches k+1; 0 1 1 0 1 0 1 1 → counts 0 1 2 2 3 3 4 5 → items 1, 2, 4 [PT18]; 1,000 items into 20 slots: 6,984/20 + routing 47,044/24 or 7,824/57 [PT19]. K is fixed; Monitor reports overflow: "Only 64 rows are drawn at a time." [PT20]
- **Set of states as matrix products:** possible but not built (1,064,103 ops/174 layers vs two passes 236,328/8,190) [PT21]. **Stack of one bit per level** (depth ≤ 24) [PT22]. **Pointer jumping** (342/7 vs 94/32) [PT23]. **Tables JS precomputes** (45 thresholds, 106 ops; index read 1 op) [PT25].

### 5.7 Springs and time

- One 4 ms semi-implicit Euler step is a 2×2 matrix on (displacement, velocity); n steps = M^n computed in float64 by JavaScript; the program applies it in **14 operations in 3 layers whatever n** [SP01]. "Stiffness and damping stay editable, since they only enter the float64 computation." [Q045]
- **Matrix:** `[1 − k·dt², dt(1 − b·dt), −k·dt, 1 − b·dt]`, dt = 0.004 s. 290/30: [0.99536, 0.00352, −1.16, 0.88]; 650/45: [0.9896, 0.00328, −2.6, 0.82] [SP02].
- **Worked:** window at 400 → destination 700 (e = −300, v = 0): one step v′ = 348 px/s, e′ = −298.608, drawn 401.392 px [SP03]; a 60 fps frame = 16.671875 ms = 4 steps + 0.671875 ms; FP32 output drawn at 412.259765625 [SP04]; trajectory 412.26, 437.32, 468.51, 501.46, 533.43, 569.71 ... peak ≈ 700.32 px [SP05].
- **Clock hygiene:** times on a 1/64 ms grid; absolute time never enters the program (an FP32 cell would tick in 0.5 ms after ~70 min) [SP06].
- **Settling:** one exact bit per object at settle checks (0.01 px and 0.01 px/s), rest bit via 2^127 lift; 29 ops/11 layers for one spring [SP09]. Displacement, not position, is stored (absolute positions mis-settled in 42-48 of 48 runs far out) [SP10, SP11].
- **Stall:** a 3 s stall → exactly one snap at 3,400 ms at every frame rate [SP12]. Tests: 26 pass, 121,059 checks [SP13].
- **Gradients:** reach the 4 cells; JS finishes the chain rule (0.1055 stiffness, −0.5047 damping after 16 steps) [SP15]. In-program matrix power would cost 546 ops vs 119 [SP16]. Closed form could replace Euler later [SP17].

### 5.8 Deep dive 3: gradients through a handwritten program

- **Backward rules** [DG01]: affine passes grad × coefficient; ReGLU passes grad × max(0, gate) to left, and grad × left to gate **only when gate > 0**; multiply/select as whole products; boolean atom and index read throw unless asked.
- **Semantics:** "Backpropagation differentiates the intended real arithmetic, not literal floating-point rounding." [Q052] "That's the difference between "the backward pass runs" and "the gradient is useful"." [Q110]
- **"Fully differentiable" is contested inside the repo** [DG03]. Decisions are steps (slope 0) [DG15]; the hard argmax gives [0, 0]; train a soft version and run the exact one (160/160 table selections) [DG16, DG17]. Straight-through exists but is opt-in and measurably biased [DG18].
- **The learned gallery** [DG04-DG12]: 20 slots, 10 fixed features, two ReGLU layers of 6, readout; **244 weights** in cells; **6,320 operations in 8 layers**; seeded random start (photos piled at 0.18 squares); Huber loss on edges (cap 0.08) + misalignment penalty with multipliers; Adam lr 0.008; 600 steps/s; ~0.2 ms per step in Bun; min-cost assignment in plain JS decides which photo goes where; weight decay keeps closed units from dying; `trainOrUndo` rewinds bad frames.
- **Worked gradient (formula, confirmed):** for the "left" output bias, ∂Loss/∂b = (1/40) Σ over 10 rectangles of [clip(e_left) + clip(e_right)], each clip at ±0.08, because the bias moves both edges and the loss averages 40 edge terms. Intuition: far-off photos vote, they don't shout [DG26]. Adam's first step moves it by ≈ lr: 0.5 → ≈ 0.492 [DG27].
- **ReGLU toy (derived):** y = (3w) × max(0, g + b), w = 0.5, g = 0.25, b = −0.1: gate 0.15, y = 0.225, ∂y/∂w = 0.45, ∂y/∂g = 1.5. Set b = −0.4: gate −0.15, y = 0, every gradient 0, the "unit whose gate has closed" [DG01, DG11].
- **Unfreezing** a hand-written number = declare it a cell (drag-knobs: 63.6% of drag frames solved in one step; 24.6% started at gradient 0) [DG20]. The gallery is a generic tiny network compiled as a circuit, not an unfrozen hand-written program [DG06].
- **What learns** (status.md) [DG23-DG25]: interpreter 60/60 and 59/60 (15/60 fractional); reusable layout 121 parameters; user effort 1.68 ms; data adapters exact search, "No neural training".
- **End to end with nanoGPT:** an aspiration with a question mark; **not done** [DG22].
- **History of a bug:** multiply's gradient at 0 was 0 or 3 depending on operand order; fixed 2026-09-03 [DG28].

### 5.9 The three demos

- **HandwiredOS** [OS01-OS19]: see 5.4 for size; CPU only; hit tests `relu(sum − 3)` over 4 exact edge bits (13 ops / 4 layers per rectangle); stacking as a permutation matrix; Monitor shows the program itself in 64 recycled DOM slots; wallpaper = one arc per weight (drawn by page JS); text lives in a native textarea (that move made the program ~4.7× smaller); two springs for twelve photos and a known glitch; 127 tests.
- **Learned gallery:** see 5.8.
- **JSON search** [JS01-JS26]: 100,000 docs (20,000 on narrow windows; 65,408 under default WebGPU limits); 512 code points + length = 2,052 bytes each; one GPU thread per document runs a small step in a loop; highlighter 37 ops/position; search 240 ops/position at 8 states in two passes; the pattern is data (cells), shaders compile once at load; bit-emit took 945 ms → 5.2 ms without changing the program; 11-15 ms per keystroke vs RegExp 8-28 ms (2.1 s on `([a-z]+)+x`); not faster than 8 workers except on the backtracking pattern; pause penalty unexplained; correctness 0 mismatches over billions of values on one GPU.

### 5.10 The lab, honestly

See LB01-LB30. The arc: confident July → humbling September (loss-scale artifact; shared-bug oracle; wrong gradient; dropped events; repairs that hid items) → an honest October ledger → a bounded, partly failed experiment right after launch (recovery parser: clear on JSON, failed by its pre-set rule on TOML, final test not run on bison).

### 5.11 Further verified details (for completeness; each is in claims.json)

**Framing**
- [FR21] ACDC's poor result on Tracr tasks is not evidence that compiled models differ from trained ones: with zero-patching ACDC recovered the Tracr circuits perfectly at any threshold above 0. (2023)
**Project**
- [PJ16] Every commit between the shelf books' pin 4ea7fcb (2026-10-15) and 257856e touches only lab/; README, docs, src, template and tests/runtime are byte-identical. (2026-10-16)
- [PJ29] The repo layout: src/runtime holds exactly numeric-ui-core.ts, cells.ts, host-timing.ts and prefix-networks.ts; src/ holds the three demos; template/ is the toggle app; lab/ holds experiments; tests run with Bun 1.4.3. (2026-10-16)
- [PJ30] The docs warn that lab READMEs 'describe the code as it was when each was written', so lab numbers are not current production. (2026-10-16)
**Primitives**
- [PR04] The README's '2 primitives' (matrix multiplication + reglu) and the runtime's four instructions are compatible: affine is the matmul, reglu the nonlinearity, the boolean atom an optional FP32 shortcut, and the index read a copy that replaces a one-hot masked sum. (2026-10-16)
- [PR05] circuit.reglu([], 1, terms, bias) is a plain ReLU; multiply becomes one reglu when an operand is declared nonnegative (it goes in the gate), otherwise a × relu(b) − a × relu(−b), 3 operations in 2 layers. (2026-10-16)
- [PR10] The builder throws if a boolean atom's score range is not inside 0..1, and backpropagateReference throws on the atom unless {booleanGradient: 'straight-through'} is passed. (2026-10-16)
- [PR13] Grids are inferred: each term contributes its wire's grid times the largest power of two dividing its coefficient (0.5 × pointerX lies on 1/128; pointerX / 3 has no grid); starting a running total from circuit.constant(0) instead of its first item turns a 2-operation comparison into a 15-operation sign cascade. (2026-10-16)
- [PR20] A masked sum turns into NaN only when an unselected candidate is infinite (0 × Infinity); a selected Infinity with finite rivals survives the masked sum, and a selected −0 survives only the index read. (2026-10-16)
- [PR21] Index reads give the selected candidate the output gradient; the index gets nothing by default (backprop throws) unless {indexGradient: 'zero'} or 'backward-difference' is passed. (2026-10-16)
- [PR24] emitMinimumExact/emitMaximumExact/emitClampExact compare first, then select, and return exactly one operand (ties return the first); emitMinimumExact is 18 ops/16 layers within 0..16,384 or 5/4 on a 1/64 grid. (2026-10-16)
**Ternary**
- [TE15] In JavaScript the conditional operator evaluates only the selected arm (MDN: exprIfTrue is executed if the condition is truthy), so the untaken branch costs nothing; in Handwired it costs its full work every evaluation. (current)
- [TE16] For a threshold that is not an FP32 number, the rounding rule depends on the relation: for x >= t store the smallest FP32 value at or above t; for x > t the matching threshold is the largest FP32 value below t (for 5/24 that is f(5/24) = 0.20833332836...). (2026-10-16)
**Exactness**
- [EX06] On GPUs that flush subnormals to zero (which WGSL permits), differences below 2^-126 can misreport; the cascade guarantee is stated for the CPU. (2026-10-16)
- [EX12] random-hardened.test.ts runs 320 seeded random circuits with deliberately non-dyadic coefficients and checks compiled against reference (FP32 vs FP32), not against JavaScript; builder-differential.test.ts replays intended expressions in float64 with a 1e-4 tolerance and compares boolean atoms exactly. (2026-10-16)
- [EX13] The native-JavaScript checks in tests/runtime are comparison.test.ts (comparison bits) and macro-ranges.test.ts (emitMinimum/emitMaximum against Math.min/Math.max). (2026-10-16)
**Cells and builder code**
- [CB02] cells.ts has six declarations (constant, input, inputBit, event, state, stateBit) over four policies; the Bit variants are the same policies with exactBit: true, and declaring a bit changes no operation. (2026-10-16)
- [CB03] An event cell is an exact bit JavaScript sets to 1 and the program resets to 0; nextSource lists each cell's next-value wire (constants and inputs hold themselves, events hold 0), and a state cell with zero or two next values throws while building. (2026-10-16)
- [CB06] indexRead does not go through append: indexReadAffine pushes its own 'index' operation (or returns a candidate wire for a constant index); multiply with unknown-sign operands appends 3 operations and select up to 4. (2026-10-16)
- [CB10] Toggle layout: track 52 × 32 px, thumb inset 4, travel 20; spring stiffness 650, damping 45; in a 1280 × 800 window the track spans x 614-666 and y 384-416. (2026-10-16)
- [CB11] In the toggle, insideTrack is an AND of four emitCompare bits via relu(sum − 3); with the pointer on a 1/64 px grid, a press at x = 614 (the edge) gives D = 0 and arms, and a press 1/64 px left (613.984375) gives D = −1 and does not, which the test checks. (2026-10-16)
- [CB12] The toggle's ifs become selects in fixed order down, then up, then cancel: armedAfterDown = emitSelect(down.active, armed, insideTrack(down)); on flips when up, armed and insideTrack(up) are all 1; both hit tests run every evaluation even with no pointer event. (2026-10-16)
- [CB13] toggle.test.ts runs the program and a plain float64 JavaScript reference over one scripted trace: on, armed and track position must match exactly, the thumb within 1e-5 px; it pins 38 animating frames and a rest position of 20 px, and a pointer at 640.001 px throws 'down.x must be a multiple of 0.015625'. (2026-10-16)
- [CB14] Thumb positions differ from float64 by at most 1.3e-6 px over the 20 px travel, up to 1.4e-4 px in traces whose destinations move by hundreds of pixels; decisions match exactly. (2026-10-16)
- [CB15] Released from rest 20 px from its destination, the toggle's spring (650/45) peaks at about 207 px/s and overshoots by about 0.009 px (re-computed independently: 207.210 px/s, 8.904e-3 px). (2026-10-16)
- [CB16] The tutorial's 'Adding a second switch' turns the switch into a component declared as list(2, () => switchCells), both thumbs sharing one spring matrix and the clock's active output being the sum of the switches' active bits; HandwiredOS's Photos (photoCells, buildPhotos) is a real component of that form. (2026-10-16)
- [CB19] Builder code resembles tracing in JAX's jit (run code once to record a fixed sequence of operations), but explicitly, with no tracer; this is an analogy, not lineage. (current)
**Compilation**
- [CM03] Program size should be counted as live operations (valueCount − sourceSize), not circuit.operations.length: HandwiredOS holds 5,028 built operations for 4,646 live ones. (2026-10-14)
- [CM10] Batching many independent tables on the GPU wins from about 16-28 tables (e.g. 4.8 ms against 335 ms at 4,096 tables), but a frame's 1-5 evaluations each read the previous one's state, so they cannot be batched. (2026-09-16)
- [CM11] Open decision 6, whether to optimize depth now, is recommended as 'measure one per-layer GPU pass first', accepting meanwhile only changes that remove layers while adding few operations. (2026-10-16)
- [CM12] Big programs: 2,367,454 built operations take about 3 s to build and 1.3-1.8 s to compile at 4-5 GB; 6.9 million take about 10 s to build and 5.5 s to compile at 9-11 GB (Bun 1.4.3, Apple M5 Max 36 GB). (2026-10-16)
- [CM15] Codegen's flattenProgram (lab/ui-exploration/codegen) ignores index reads and would silently write those rows as 0; it is not production code, and json-search has its own emitter. (2026-10-16)
**Host loop**
- [HL07] Validation in evaluate visits every cell twice per evaluation; it doesn't matter for 20 cells, while 100,000 cells take about 90 µs per check in Bun. (2026-10-16)
**Patterns**
- [PT07] Against plain JavaScript, a GPU tree needs many items per dispatch and data that stays on the GPU: a JS loop lays out a 1,024-break paragraph in 0.04-0.07 ms while a GPU round trip costs 0.3-0.6 ms. (2026-10-16)
- [PT12] emitArgmax's comparison keeps the left score when the right is larger by less than about 9e-8 (up to 2.4e-7), so its tree can pick a different candidate from the loop; emitHighestScoreExact matches the loop at 500 ops in 39 layers at 64 scores on a 1/64 grid. (2026-10-16)
- [PT28] Calling Sklansky's 1960 adder a prefix network is a later reading in the parallel-prefix literature; Harris (2003) places Brent-Kung, Sklansky and Kogge-Stone at the corners of a levels/fanout/wiring trade-off, none of them best. (2003)
**Springs**
- [SP07] springMatrixBound declares the 4 matrix cells within ±(largest entry of M^n for n = 0..300) × (1 + 1e-6): 10.3605 for 650/45 (docs '10.36'), 6.8849 for 290/30; a host writing an overflowing matrix fails the range check. (2026-10-27)
- [SP08] emitApplySpringMatrix is within 1e-3 px and 1e-2 px/s of a float64 Euler loop for displacements within ±2,000 px, velocities within ±5,000 px/s and up to 300 steps (checked on 1,500 random samples). (2026-10-16)
- [SP14] The older emitSpring ran 4 Euler steps inside the program with stiffness, damping and timestep as wires: 46 operations in 33 layers as HandwiredOS built it (78 in 45 with no declared ranges). (2026-10-16)
- [SP18] Spring constants differ by place: tests use 290/30 (index.ts's default) plus 650/45 and 120/14; HandwiredOS shares one 650/45 matrix with 301 precomputed powers; chenguini's Animation.md example is 333/33. (2026-10-16)
- [SP19] Changing chenguini's ui.md, Animation.md and index.ts to step springs to each event's timestamp is listed as still open, so the guideline docs and Handwired's runtime currently differ. (2026-10-16)
**Gradients**
- [DG21] In drag-knobs, straight-through solved 16.5% of candidate-gallery frames in one step against 38.2% with frozen booleans (drag-knobs README; the guide gives 37.6%). (2026-10-16)
- [DG29] Across a snap the spring gradient jumps: stiffness 264.8859558 gives 'settled 0, position 100.0063…, gradient 0.0012773' and 264.8859863 gives 'settled 1, position 100, gradient 0'. (2026-10-27)

---

## 6. Verified quotes

All verbatim and verified; full records (speaker, date, source, context) in `quotes.json`. Repo prose is the repo speaking, not Cheng, unless marked "Cheng Lou". Framing quotes (Q133 on) are context, not Handwired lineage.

- **Q001** "Turn your regular JavaScript code into a neural net; no training, exact, yet also fully differentiable!" (Handwired README (opening written by Cheng Lou), 2026-10-14 (opening); unchanged at 257856e) https://github.com/chenglou/handwired/blob/257856e/README.md#L3 · README tagline. Always pair with Q014 so it is not read as automatic conversion of existing JS.
- **Q002** "A program's made of if-else, loops, and state. Handwired transforms them into matrix multiplication + reglu over floats." (Handwired README, 2026-10-14) https://github.com/chenglou/handwired/blob/257856e/README.md#L7 · Opening of 'How It Works'.
- **Q003** "// Math.max(0, x) is ReLU. For an integer a, above4 is 1 if a > 4, and 0 otherwise" (Handwired README (code comment), 2026-10-14) https://github.com/chenglou/handwired/blob/257856e/README.md#L18 · The (a > 4) ? 10 : 12 example; note the integer scope.
- **Q004** "// Both branches compute, and above4 picks one" (Handwired README (code comment), 2026-10-14) https://github.com/chenglou/handwired/blob/257856e/README.md#L20 · The README example's select line.
- **Q005** "You can calculate that by hand and see that both arrive at the same result." (Handwired README, 2026-10-14) https://github.com/chenglou/handwired/blob/257856e/README.md#L24 · After the worked example.
- **Q006** "We then collect the + and * and relu into a giant matmul, and either run it on JS or WebGPU, for fun." (Handwired README, 2026-10-14) https://github.com/chenglou/handwired/blob/257856e/README.md#L26 · Pitch of the compiled form; the docs refine it to layers of sparse matrices.
- **Q007** "Because we basically only use these 2 primitives:" (Handwired README, 2026-10-14) https://github.com/chenglou/handwired/blob/257856e/README.md#L28 · Introduces the list of benefits (differentiable; no training; GPU techniques).
- **Q008** "the weights don't need training since they're written manually" (Handwired README, 2026-10-14) https://github.com/chenglou/handwired/blob/257856e/README.md#L30 · Bullet under Q007.
- **Q009** "existing gpu techniques, such as fusion, sparsity, reordering, have a great time optimizing such minimal primitives" (Handwired README, 2026-10-14 (added in commit 59b12cd)) https://github.com/chenglou/handwired/blob/257856e/README.md#L31 · Bullet under Q007. Sparsity is implemented; fusion/reordering are partial or permitted by contract.
- **Q010** "unfreezing the weights and train them (what does that even do? Let's find out!)" (Handwired README, 2026-10-14 (first in 59b12cd)) https://github.com/chenglou/handwired/blob/257856e/README.md#L34 · First of the 'funny use-cases'.
- **Q011** "attaching a specific frozen program to a generic neural net and train end-to-end (now a nanoGPT can do both Shakespeare and your particular UI?)" (Handwired README, 2026-10-14 (first in 59b12cd)) https://github.com/chenglou/handwired/blob/257856e/README.md#L35 · Second use-case; an aspiration phrased as a question. Nothing in the repo implements it.
- **Q012** "achieving GPU-level of parallelism with JS code that was written in a traditional single-threaded way (see the JSON search demo that runs in milliseconds over 100k documents)" (Handwired README, 2026-10-14) https://github.com/chenglou/handwired/blob/257856e/README.md#L36 · Third use-case.
- **Q013** "`lab/` is a bunch of old experiments you can check or ignore" (Handwired README, 2026-10-14) https://github.com/chenglou/handwired/blob/257856e/README.md#L42 · README's description of the lab folder.
- **Q014** "No tool converts existing JavaScript source into a program." (Handwired docs/README.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/README.md#L3 · The docs' own correction of the tagline: you write builder code.
- **Q015** "The program runs every operation on every frame and can't stop early, so a loop becomes a count, a tree, a table, or the same work on every item." (Handwired docs, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md#L3 · Thesis sentence of patterns.md; identical at docs/README.md#L9.
- **Q016** "A numeric program is a fixed list of operations over 32-bit floats, called FP32 here, mostly weighted sums and products with a ReLU." (Handwired docs/tutorial.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/tutorial.md#L13 · Tutorial's opening definition.
- **Q017** "You don't write the list itself: you write builder code, i.e. ordinary JavaScript that runs once and appends operations to a `Circuit`, so nothing in the program branches or loops at runtime." (Handwired docs/tutorial.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/tutorial.md#L13 · Builder code defined.
- **Q018** "The JavaScript around the program is the host: it writes browser inputs into the table and runs the program on it, which is one evaluation, then writes the program's next-state values back into the table and its other outputs to the DOM." (Handwired docs/tutorial.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/tutorial.md#L13 · The host loop in one sentence.
- **Q019** "Every number the program reads, or keeps from one evaluation to the next, is a cell of the source table." (Handwired docs/tutorial.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/tutorial.md#L17 · Opens the 'Cells' section.
- **Q020** "A wire is the position of a number, either a cell or the result of an operation." (Handwired docs/tutorial.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/tutorial.md#L68 · Wire defined.
- **Q021** "A range is a promise that builder functions rely on and every evaluation checks." (Handwired docs/tutorial.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/tutorial.md#L53 · Declared ranges on cells.
- **Q022** "`emitSelect(circuit, condition, off, on)` computes both sides and picks one, so an `if` that assigns a cell becomes a select on the cell's next value." (Handwired docs/tutorial.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/tutorial.md#L93 · Note the argument order: off before on.
- **Q023** "Where JavaScript would reassign a variable, builder code makes a new wire" (Handwired docs/tutorial.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/tutorial.md#L93 · Sentence continues with `armedAfterDown`.
- **Q024** "A program can't loop a number of times that is only known at runtime, and the time since the last evaluation decides how many fixed 4 ms steps the spring takes." (Handwired docs/tutorial.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/tutorial.md#L106 · Leads into the spring matrix power.
- **Q025** "Decisions match exactly, since `emitCompare`'s bits equal JavaScript's comparisons for every declared value." (Handwired docs/tutorial.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/tutorial.md#L167 · 'Testing against JavaScript'; positions differ from float64 by up to 1.3e-6 px over the toggle's 20 px travel.
- **Q026** "Event handlers only queue events with their timestamps." (Handwired docs/tutorial.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/tutorial.md#L110 · The handlers also call scheduleRender() to request a frame (template/toggle.ts#L163-L168).
- **Q027** "The page requests another frame only while the clock runs, i.e. until an evaluation that writes state back finds nothing animating." (Handwired docs/tutorial.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/tutorial.md#L161 · Idle costs nothing.
- **Q028** "Three runtime atoms and one index read instruction, plus compile-time expansions that lower into those." (src/runtime/numeric-ui-core.ts header comment, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/runtime/numeric-ui-core.ts#L1-L2 · The instruction set in one line.
- **Q029** "Declarations are promises from the caller, not proofs." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L60 · Declarations section.
- **Q030** "A false declaration can still lead to an invalid optimization, e.g. a false grid turns an integer bit into a fraction" (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L60 · Why a = 4.5 under a grid-1 promise gives 0.5.
- **Q031** "Gather lowering only shortens the read after a selection exists: the selection and every candidate are still computed." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L76 · One-hot groups and gathers.
- **Q032** "For every pair of values within the declared ranges, the bit equals JavaScript's comparison of the two wires' FP32 values." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L118 · emitCompare's guarantee (FP32 values, not float64).
- **Q033** "What is guaranteed: on the CPU, the bit is correct for every nonzero FP32 difference, down to 2^-149." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L141 · Sign cascade guarantee; GPUs that flush subnormals can misreport below 2^-126.
- **Q034** "The builder records rounding points: operations where the exact FP32 evaluation, term order and operand wires matter." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L157 · Umbrella wording; strict order applies to boolean and marked operations only (L160-L161).
- **Q035** "`(score + 8,388,609) - 8,388,609` only rounds to a bit when evaluated in FP32 as written, and a shader compiler that simplifies it to `score` breaks it." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L159 · The boolean atom's fragility on GPUs.
- **Q036** "Exactness means equality to the stated FP32 calculation, ignoring the sign of zero, not equality to arbitrary JavaScript float64 arithmetic." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L257 · Macro contracts: the definition of 'exact'.
- **Q037** "The reference evaluator defines what a program computes, and a compiled program must reproduce every live value." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L50 · Compilation.
- **Q038** "That the two evaluators agree doesn't show that a program does what the JavaScript it replaces did." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L50 · Why the template also tests against a plain JS reference.
- **Q039** "Independent instructions at the same dependency depth share a layer." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L40 · How the 'giant matmul' is sliced into layers.
- **Q040** "A layer gathers its earlier inputs, evaluates its sparse affine projection, applies gather reads, index reads, ReGLU gates and boolean rounding, and appends outputs." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L40 · One layer of the compiled program.
- **Q041** "All of src/runtime's execution is JavaScript on the CPU. "Tensor" in its names means a program packed into layers of sparse matrices, not a GPU." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L298 · Backends.
- **Q042** "Copy it when retaining a frame." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L294 · Buffer lifetime: createTensorEvaluator overwrites its result array on the next call.
- **Q043** "A spring runs as many fixed 4 ms steps as the elapsed time allows, and a program can't loop a runtime number of times, so JavaScript counts the steps and writes the effect of all of them into cells." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L168 · Springs and time.
- **Q044** "One semi-implicit Euler step of 4 ms, which updates the velocity from the spring and damping forces and then the position from the new velocity, is a 2×2 matrix on (displacement from the destination, velocity), so n steps are that matrix to the power n." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L173 · The spring trick.
- **Q045** "Stiffness and damping stay editable, since they only enter the float64 computation." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L173 · The program never sees the spring constants.
- **Q046** "14 operations in 3 layers for any step count." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L178 · emitApplySpringMatrix's cost.
- **Q047** "Before an event with timestamp T is applied, springs step to T toward the destinations in effect before T, and a stopped clock starts at T. So a new destination starts pulling within 4 ms of T at any frame rate." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L210 · The ordering rule.
- **Q048** "A spring can be within both thresholds at one step count and above the speed threshold a few steps later, as the remaining displacement accelerates it again." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L218 · Why settling happens only at fixed simulated times.
- **Q049** "This rule keeps the static bound: no frame runs more than 300 steps, and no time carries into later frames." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L235 · The snap rule.
- **Q050** "Springs that store positions instead can fail to settle near 100,000 px." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L196 · Why springs store displacement.
- **Q051** "Exact settling says nothing about whether gradients through many steps stay usable." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L251 · Gradients caveat for springs.
- **Q052** "Backpropagation differentiates the intended real arithmetic, not literal floating-point rounding." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L36 · Gradient semantics.
- **Q053** "A soft comparison or a custom derivative is a training choice, not an exact derivative of a hard decision." (Handwired docs/execution-model.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/execution-model.md#L36 · Same paragraph as Q052.
- **Q054** "A score isn't automatically a decision." (Handwired docs/expressions.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/expressions.md#L27 · Decision bits.
- **Q055** "Make the bit exact at the moment a score becomes a decision" (Handwired docs/expressions.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/expressions.md#L27 · Decision bits.
- **Q056** "The boolean atom is a one-operation shortcut for this construction, not a necessity." (Handwired docs/expressions.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/expressions.md#L33 · The atom vs the sign cascade.
- **Q057** "An exact bit is exact for the FP32 values it compares, not for the float64 arithmetic of the JavaScript it replaces." (Handwired docs/expressions.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/expressions.md#L37 · The 1732 px column example.
- **Q058** "FP32 holds every integer exactly only up to 2^24 (16,777,216), and above that, neighboring values are 2, then 4 apart." (Handwired docs/expressions.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/expressions.md#L41 · Magnitude safety.
- **Q059** "Revisit dynamic division only when a real UI needs it." (Handwired README's former TODO, quoted in lab/status.md, parked 2026-09-16) https://github.com/chenglou/handwired/blob/257856e/lab/status.md#L267 · Parked and deferred.
- **Q060** "So removing operations by adding layers doesn't always save time." (Handwired docs/patterns.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md#L7 · CPU executor cost model.
- **Q061** "Sums and products round in FP32, so the grouping is part of the result." (Handwired docs/patterns.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md#L39 · Why a tree can differ from a loop in the last bit.
- **Q062** "On the CPU executor, the tree takes longer than the loop, with either network." (Handwired docs/patterns.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md#L54 · Bold in source.
- **Q063** "A backend that runs one large kernel per layer can't run fewer kernels than the program's longest chain of gates." (Handwired docs/patterns.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md#L57 · Depth as a floor; HandwiredOS has 130 layers and a longest gate chain of 71.
- **Q064** "HandwiredOS is many different pieces of logic instead of one repeated step, so it has no tree to build." (Handwired docs/patterns.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md#L57 · Why a GPU does not help HandwiredOS.
- **Q065** "One table of a program with nothing repeated doesn't get faster: one evaluation of HandwiredOS took about 2 ms on WebGPU, with one table's statements run one after another in a shader, and takes under 0.1 ms on the CPU executor." (Handwired docs/patterns.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md#L58 · GPU vs CPU for one program.
- **Q066** "A loop stops at the first item that fails the test." (Handwired docs/patterns.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md#L69 · findIndex: what the program cannot do.
- **Q067** "A program runs every step once, in order, so it can't go back." (Handwired docs/patterns.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md#L241 · Loops whose decision needs later input.
- **Q068** "No program in this repo builds this tree" (Handwired docs/patterns.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md#L301 · The tree of matrix products over a set of states; json-search runs two loop passes instead.
- **Q069** "that position is a count: how many items come before this item." (Handwired docs/patterns.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md#L358 · items.sort as ranks.
- **Q070** "Which items pass the filter isn't known while building, but the number of DOM nodes K is." (Handwired docs/patterns.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md#L381 · filter + slice into K nodes.
- **Q071** "Work that a loop would redo on every frame runs in JavaScript when the data changes, and the program compares with its results or reads them." (Handwired docs/patterns.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/patterns.md#L440 · Work JavaScript does ahead of time (tables).
- **Q072** "A program's size is fixed while building, so every count that JavaScript keeps in a growing array or a loop variable becomes a maximum, and what the program does past the maximum is part of the behavior." (Handwired docs/behavior-choices.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/behavior-choices.md#L79 · A fixed maximum with a named fallback.
- **Q073** "Give every maximum an output or a check, e.g. an overflow output like `slotOverflow`: without one, a program past a capacity computes wrong values, and no output shows the problem." (Handwired docs/behavior-choices.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/behavior-choices.md#L95 · Same section.
- **Q074** "Only 64 rows are drawn at a time." (HandwiredOS Monitor UI string, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/value-list.ts#L664 · Built as `Only ${slotCount} rows are drawn at a time.` with slotCount = 64 (L63); quoted in docs/behavior-choices.md#L87.
- **Q075** "Step springs to each event's timestamp before applying the event, and write next state back only at events and settle checks." (Handwired docs/behavior-choices.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/behavior-choices.md#L32 · Behavior choice 2.
- **Q076** "so replaying recorded events at another frame rate, e.g. in a screenshot test, reproduces the screen bit for bit." (Handwired docs/behavior-choices.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/docs/behavior-choices.md#L48 · Holds only while events arrive in timestamp order and no snap runs.
- **Q077** "Everything here is float64 JavaScript that runs between evaluations. It never builds operations and never touches the DOM." (src/runtime/host-timing.ts code comment, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/runtime/host-timing.ts#L3-L4 · // markers removed; the line break falls after 'It never'.
- **Q078** "combine doesn't have to be commutative." (src/runtime/prefix-networks.ts code comment, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/runtime/prefix-networks.ts#L6 · Prefix networks need associativity only.
- **Q079** "Sklansky (1960): for blocks of 2, 4, 8, ... items, combine the last prefix of the block's left half into every prefix of its right half." (src/runtime/prefix-networks.ts code comment, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/runtime/prefix-networks.ts#L10-L11 · sklanskyPrefix.
- **Q080** "Brent-Kung (1982): an upward pass combines neighbors, then pairs of pairs, and so on" (src/runtime/prefix-networks.ts code comment, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/runtime/prefix-networks.ts#L26 · brentKungPrefix.
- **Q081** "A toggle switch written as one numeric program and checked against the same switch in plain JavaScript, to copy as the start of a new app." (Handwired template/README.md, added 2026-10-15) https://github.com/chenglou/handwired/blob/257856e/template/README.md#L3 · The template app.
- **Q082** "Both sides of a select always compute, and width * 2 overflows to Infinity at 3e38." (tests/runtime/cells.test.ts comment, at 257856e) https://github.com/chenglou/handwired/blob/257856e/tests/runtime/cells.test.ts#L207 · A test that proves both branches run.
- **Q083** "Nothing here is fixed; the tests document the bounds the compiled UI silently relies on." (tests/runtime/macro-ranges.test.ts header comment, at 257856e) https://github.com/chenglou/handwired/blob/257856e/tests/runtime/macro-ranges.test.ts#L14-L15 · Magnitude preconditions of the macros.
- **Q084** "A small desktop with 3 windows (Monitor, Notes and Photos) and a dock, run by one compiled program." (src/handwiredos/README.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/README.md#L3 · HandwiredOS opening sentence.
- **Q085** "Every weight of the program is written by builder code, and none is trained." (src/handwiredos/README.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/README.md#L3 · HandwiredOS.
- **Q086** "A small desktop written in JS, transformed with Handwired. Giant lists, animation, stacking, scrolling, drag, input, pictures, all rendering to regular DOM." (Demo site, Mini OS card, 2026-10-14) https://github.com/chenglou/handwired/blob/257856e/assets/demos.html#L140 · Live at https://chenglou.me/handwired/.
- **Q087** "Notes holds one native `<textarea>`: the browser edits, selects, wraps and scrolls the text, and the program computes the window around the text … The program holds no text." (src/handwiredos/README.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/handwiredos/README.md#L31 · Ellipsis omits ', e.g. the window's rectangle and springs, and whether the window is focused.'
- **Q088** "Wire one more neuron by hand" (HandwiredOS Notes window default text, at 257856e) https://github.com/chenglou/handwired/blob/257856e/assets/index.html#L84-L89 · Last line of the to-do list in the Notes textarea ('– Wire one more neuron by hand').
- **Q089** "A page that searches 100,000 generated JSON documents again at each keystroke, on the GPU, with two fixed numeric programs." (src/json-search/README.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/json-search/README.md#L3 · JSON search opening.
- **Q090** "A GPU is of no use for one document, since a round trip to the GPU alone takes 0.6 ms or more. It is for many documents: every document runs the same operations and reads no other document's values, so one pass runs them all." (src/json-search/README.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/json-search/README.md#L3 · Why the GPU, and when.
- **Q091** "10,559 of 100,000 documents match. This program: 13 ms on the GPU. Native RegExp: 21 ms." (JSON search page example line, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/json-search/README.md#L30 · One measured example; lab/status.md#L103 shows the same line with 12 ms.
- **Q092** "So neither the search nor RegExp is always faster, and the line gives both times for every pattern." (src/json-search/README.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/json-search/README.md#L53 · The honest verdict.
- **Q093** "It isn't honest if it claims to beat RegExp on every pattern, or JavaScript in several workers." (lab/json-search/README.md, Oct 2026) https://github.com/chenglou/handwired/blob/257856e/lab/json-search/README.md#L131 · The lab's honesty rule for the page.
- **Q094** "The comparison with one thread flatters the GPU." (lab/json-search/README.md, Oct 2026) https://github.com/chenglou/handwired/blob/257856e/lab/json-search/README.md#L918 · Baselines ran on one of 18 cores.
- **Q095** "RegExp is fast." (lab/json-search/README.md, Oct 2026) https://github.com/chenglou/handwired/blob/257856e/lab/json-search/README.md#L917 · Same passage.
- **Q096** "a new pattern writes cells and changes no program." (src/json-search/search-step.ts comment, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/json-search/search-step.ts#L4 · The automaton is data.
- **Q097** "The regex matching, JSON parsing & highlighting are all written in JS, then turned into WebGPU kernels for massive parallelism." (Demo site, JSON search card, 2026-10-14) https://github.com/chenglou/handwired/blob/257856e/assets/demos.html#L204 · Also assets/json-search.html#L45; live at https://chenglou.me/handwired/.
- **Q098** "Why an evaluation after a pause takes longer wasn't found." (lab/status.md, Oct 2026) https://github.com/chenglou/handwired/blob/257856e/lab/status.md#L114 · The 200 ms pause penalty on the GPU.
- **Q099** "I was wondering if there's a point where regex search or json highlighter, or a combination of these into the same app, is clearly more performant from the gpu parallelism? Then we can make a demo where we search a ton of jsons or something" (Cheng Lou, as quoted in lab/json-search/README.md, undated in source; before the 2026-10-13 measurements) https://github.com/chenglou/handwired/blob/257856e/lab/json-search/README.md#L52 · The question that started the JSON search demo. Lowercase and typos are original.
- **Q100** "I was thinking about 1 million documents, optimized kernels vs regular idiomatic js. Thought I don't know what the numbers would look like. Maybe we should check before we build it. Esp since 1M docs in browser might be a lot" (Cheng Lou, as quoted in lab/json-search/million/README.md, 2026-10-13/14) https://github.com/chenglou/handwired/blob/257856e/lab/json-search/million/README.md#L5 · The million-document check (hand-written kernels, not the demo).
- **Q101** "we can remove all the bits from the 2 old json and regex experiments, except whichever important new patterns we found, like that nlogn loop or whatever. Beside those lessons, the demos should disappear." (Cheng Lou, as quoted in lab/status.md, 2026-10-14) https://github.com/chenglou/handwired/blob/257856e/lab/status.md#L127 · Instruction that led to removing the JSON highlighter and regex search experiments' code.
- **Q102** "go. Make sure btw that the docs are without legacy crufts. Those and the tutorial and templates are the entrypoint for ppl when we release." (Cheng Lou, as quoted in lab/status.md, 2026-10-14) https://github.com/chenglou/handwired/blob/257856e/lab/status.md#L127 · On the removal plan; a shorter form is quoted in commit 259c5d2.
- **Q103** "strip 1-4 yeah. Do it quick plz, then publish." (Cheng Lou, as quoted in commit 0237d40, 2026-10-14) https://github.com/chenglou/handwired/commit/0237d405e80f33a5b74bf1d9d3b69a28f1571ca4 · Approving four audit fixes, including the history rewrite, before going public.
- **Q104** "My dear friends, I’d like to show you my latest toy project / Introducing Handwired: turn your regular JavaScript code into a neural net! - no training - exact outputs vs the JS program - fully differentiable / All runnable in a browser, without GPU" (Cheng Lou (@_chenglou), post on X, 2026-10-15 02:24:24 UTC (2026-10-14 evening PDT)) https://x.com/_chenglou/status/2110557373651931267 · Launch post; text via https://api.fxtwitter.com/_chenglou/status/2110557373651931267. Line breaks shown as '/'; curly apostrophe in original.
- **Q105** "a bigger penalty or adjustable one for learned gallery for grid being unaligned" (Cheng Lou, as quoted in lab/learned-gallery/README.md, undated in source (on or before 2026-10-13)) https://github.com/chenglou/handwired/blob/257856e/lab/learned-gallery/README.md#L13 · The request that led to the misalignment penalty.
- **Q106** "the spirit of the gallery is to learn something. Snapping to some alignemtn is just a simple thought." (Cheng Lou, as quoted in lab/learned-gallery/README.md, 2026-10-13/14) https://github.com/chenglou/handwired/blob/257856e/lab/learned-gallery/README.md#L13 · Rejecting the snapping fix; typo 'alignemtn' is in the source.
- **Q107** "No code moves a rectangle or a photo onto a line: the photos line up only because training lowers the penalty." (src/learned-gallery/README.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/learned-gallery/README.md#L19 · Since 2026-10-14.
- **Q108** "Without any decay, a unit whose gate has closed gets no gradient and stays shut" (src/learned-gallery/README.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/src/learned-gallery/README.md#L29 · Why the gallery uses weight decay 2e-7.
- **Q109** "Unfreeze a compiled program's weights & train them in real time." (Demo site, learned gallery card, live 2026-10-27) https://github.com/chenglou/handwired/blob/257856e/assets/demos.html#L170 · 'real time' is italic on the page; the gallery's 244 weights start from a seeded random init, not a hand-written program.
- **Q110** "That's the difference between "the backward pass runs" and "the gradient is useful"." (lab/ui-exploration/guide/sections/differentiability.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/lab/ui-exploration/guide/sections/differentiability.md#L93 · After the table of selector gradients.
- **Q111** "Learned parameters can occupy source cells beside changing application inputs. That storage choice does not turn parameter fitting into a different learning algorithm." (lab/status.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/lab/status.md#L206 · Under the 'What learns' table.
- **Q112** "The hard cascade does not provide useful score gradients." (lab/cascade-argmax/README.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/lab/cascade-argmax/README.md#L9 · Hard selectors.
- **Q113** "Exact forward values, explicitly substituted identity derivative for booleans." (lab/generative-fields/ste-backprop.ts code comment, at 257856e) https://github.com/chenglou/handwired/blob/257856e/lab/generative-fields/ste-backprop.ts#L8 · The straight-through wrapper (opt-in, lab only).
- **Q114** "No method here avoids exhaustive evaluation by learning from executions alone." (lab/learned-interpreter/README.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/lab/learned-interpreter/README.md#L80 · Honest limit of the learned interpreter.
- **Q115** "Keep the smaller numeric representation and the ambition to learn useful computation. Change what we treat as established, and make the next experiment test a rule that works on new situations rather than another configuration fitted to one situation." (The September 3 reassessment (unnamed writer; an AI agent's review by its own account; not Cheng's words), 2026-09-03) https://github.com/chenglou/handwired/blob/257856e/lab/reassessment-2026-09-03.md#L7 · 'Bottom line'.
- **Q116** "The most concerning finding is also concrete: some correctness checks compare implementations that share the same mistake." (The September 3 reassessment (unnamed writer), 2026-09-03) https://github.com/chenglou/handwired/blob/257856e/lab/reassessment-2026-09-03.md#L9 · The trace compiler's oracle shared its bug.
- **Q117** "separate instruction choices can recover composition in this experiment; the old 0/20 result was not sufficient evidence to abandon them." (The September 3 reassessment (unnamed writer), 2026-09-03) https://github.com/chenglou/handwired/blob/257856e/lab/reassessment-2026-09-03.md#L38 · Bold in original; the Adam-epsilon reversal.
- **Q118** "it passes yesterday's interpretation to tomorrow's agents as a constraint." (The September 3 reassessment (unnamed writer), 2026-09-03) https://github.com/chenglou/handwired/blob/257856e/lab/reassessment-2026-09-03.md#L111 · On the July brief that said 'take these as given'.
- **Q119** "The important question is not whether a net can reproduce rectangles. It is whether a small learned rule adapts a design across changes we did not specify individually." (The September 3 reassessment (unnamed writer), 2026-09-03) https://github.com/chenglou/handwired/blob/257856e/lab/reassessment-2026-09-03.md#L154 · What learning should be tested for.
- **Q120** "A table parser that gives up at the first error has entries that valid input never reads. Filling only those keeps valid input parsed exactly as before, and training can fill them so that the parser keeps going after a mistake." (Commit message of 257856e (author Cheng Lou, co-authored by Claude Code), 2026-10-16) https://github.com/chenglou/handwired/commit/257856e3b221140acb4cc4460626b850c0bd4ff1 · The pinned merge commit.
- **Q121** "On JSON the trained parser ended up slightly better than recovery rules written by hand. On TOML and on a parser made by bison, the gradient training alone did not carry over with JSON's settings and random damage as its training data. Filling the same entries by trial and error did, and so did gradient training once it was given a fairer start: one small hand-written rule on TOML, realistic mistakes in the training data on the bison parser." (lab/recovery-parser/README.md, 2026-10-16) https://github.com/chenglou/handwired/blob/257856e/lab/recovery-parser/README.md#L3 · Quote whole: cutting after 'did not carry over' overstates the failure.
- **Q122** "JSON is a clear success. A strict parser became a recovering one with no recovery code written, and valid JSON is unchanged by construction." (lab/recovery-parser/README.md, 2026-10-16) https://github.com/chenglou/handwired/blob/257856e/lab/recovery-parser/README.md#L139 · Conclusion.
- **Q123** "By the rule fixed beforehand the track failed: gradient descent alone is below the one simple rule on both sets, in every run." (lab/recovery-parser/README.md, 2026-10-16) https://github.com/chenglou/handwired/blob/257856e/lab/recovery-parser/README.md#L99 · TOML track (bold removed).
- **Q124** "A failure by that rule says that the gradient step does not carry over as it is. It does not say that training cannot work there." (lab/recovery-parser/README.md, 2026-10-16) https://github.com/chenglou/handwired/blob/257856e/lab/recovery-parser/README.md#L140 · The lab's own scoping of the TOML failure.
- **Q125** "GPU execution, a general JavaScript compiler, learned arbitrary abstractions, and a full learned UI runtime are not delivered by these experiments." (lab/status.md, Oct 2026) https://github.com/chenglou/handwired/blob/257856e/lab/status.md#L246 · 'Still open'.
- **Q126** "This is not a proof of all possible circuits or all JavaScript programs." (lab/status.md, Oct 2026) https://github.com/chenglou/handwired/blob/257856e/lab/status.md#L224 · Closing paragraph of 'Correctness changes'.
- **Q127** "Handwired has the same structure. One frame is one evaluation of a fixed-depth circuit, and the next-state write-back plays the role of the appended token" (lab/ui-exploration/guide/sections/chains.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/lab/ui-exploration/guide/sections/chains.md#L220 · The repo's comparison with chain-of-thought transformers.
- **Q128** "A network approximates a chain of logic with whatever wide structure training finds, so its shortcuts can fail where the training data didn't reach, and its layers don't line up with the steps of the logic. Handwired compiles the chain itself, exactly, so its depth equals the logic's actual dependencies" (lab/ui-exploration/guide/sections/chains.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/lab/ui-exploration/guide/sections/chains.md#L226 · The repo's own positioning against trained nets.
- **Q129** "RASP (Weiss, Goldberg and Yahav, "Thinking Like Transformers", 2021) is a programming language whose operations match what a transformer layer computes." (lab/ui-exploration/guide/sections/loops.md, at 257856e) https://github.com/chenglou/handwired/blob/257856e/lab/ui-exploration/guide/sections/loops.md#L239 · The repo cites RASP.
- **Q130** "As far as I understand, this doesn't turn "regular" JavaScript into a NN, it's rather "write your logic in a DSL that creates a neural-net-shaped circuit"" (gregsadetsky (Hacker News commenter), 2026-10-22) https://news.ycombinator.com/item?id=50172984 · Main public criticism, in the Show HN thread; also called the site and README an 'overclaim'.
- **Q131** "Lol, if you pass a = 4.5 to their homepage const result = (a > 4) ? 10 : 12 you get 11." (curtisblaine (Hacker News commenter), 2026-10-23) https://news.ycombinator.com/item?id=50172984 · Matches the landing page's own hidden comment; the comment continues 'Not everything is differentiable.'
- **Q132** "Website is missing the #1 thing I imagine most readers would want to know: why?" (hungryhobbit (Hacker News commenter), 2026-10-22) https://news.ycombinator.com/item?id=50172984 · 'why' is italic in the original; single space before it; no space before '?'.
- **Q133** "Because of the “all-or-none” character of nervous activity, neural events and the relations among them can be treated by means of propositional logic." (Warren S. McCulloch and Walter Pitts, Dec 1943) https://link.springer.com/article/10.1007/BF02478259 · First sentence of the abstract, 'A Logical Calculus of the Ideas Immanent in Nervous Activity', Bull. Math. Biophysics 5:115-133. Framing only.
- **Q134** "It is found that the behavior of every net can be described in these terms, with the addition of more complicated logical means for nets containing circles; and that for any logical expression satisfying certain conditions, one can find a net behaving in the fashion it describes." (Warren S. McCulloch and Walter Pitts, Dec 1943) https://papers.baulab.info/papers/McCullochPitts-1943.pdf · Rest of the abstract, checked in the 1990 reprint (Bull. Math. Biol. 52:99-115).
- **Q135** "It is easily shown: first, that every net, if furnished with a tape, scanners connected to afferents, and suitable efferents to perform the necessary motor-operations, can compute only such numbers as can a Turing machine; second, that each of the latter numbers can be computed by such a net" (Warren S. McCulloch and Walter Pitts, Dec 1943) https://papers.baulab.info/papers/McCullochPitts-1943.pdf · End of section 3; asserted, not proved in detail. A tape is required.
- **Q136** "Thus in psychology, introspective, behavioristic or physiological, the fundamental relations are those of two-valued logic." (Warren S. McCulloch and Walter Pitts, Dec 1943) https://papers.baulab.info/papers/McCullochPitts-1943.pdf · Section 4.
- **Q137** "Certainly for the psychiatrist it is more to the point that in such systems "Mind" no longer "goes more ghostly than a ghost."" (Warren S. McCulloch and Walter Pitts, Dec 1943) https://papers.baulab.info/papers/McCullochPitts-1943.pdf · Section 4.
- **Q138** "Following W.S. MacCulloch and W. Pitts (“A logical calculus of the ideas immanent in nervous activity,” Bull. Math. Biophysics, Vol. 5 (1943), pp. 115–133) we ignore the more complicated aspects of neuron functioning" (John von Neumann, 30 June 1945) https://comp.anu.edu.au/courses/comp2310-2020/Papers/1945/von%20Neumann/The%20First%20Draft%20Report%20on.pdf · First Draft of a Report on the EDVAC, §4.2 (Godfrey 1992 transcription); the report misspells 'MacCulloch'.
- **Q139** "The present memorandum is partly an exposition of the McCulloch-Pitts results; but we found the part of their paper which treats of arbitrary nets obscure; so we have proceeded independently here." (Stephen C. Kleene, 15 Dec 1951) https://www.jmeiners.com/neural-nets-sim/papers/kleene.pdf · RAND RM-704, p. 4.
- **Q140** "This apparent counterexample has discouraged us from further attempts to decipher Part III of the McCulloch-Pitts 1943." (Stephen C. Kleene, 15 Dec 1951) https://www.jmeiners.com/neural-nets-sim/papers/kleene.pdf · RAND RM-704, p. 36.
- **Q141** "Under the McCulloch-Pitts assumption of the all-or-nothing character of a neuron's firing (which is close to the biological reality) and their assumption which quantizes time so that all neurons have their moments of possible firing in phase, a nerve net has the character of a digital automaton." (Stephen C. Kleene, 15 Dec 1951) https://www.jmeiners.com/neural-nets-sim/papers/kleene.pdf · RAND RM-704, p. 4 (OCR typos corrected).
- **Q142** "Fundamentally, it shows that the eye speaks to the brain in a language already highly organized and interpreted, instead of transmitting some more or less accurate copy of the distribution of light on the receptors." (Lettvin, Maturana, McCulloch and Pitts, Nov 1959) https://papers.baulab.info/papers/Lettvin-1959.pdf · 'What the Frog's Eye Tells the Frog's Brain', Proc. IRE 47(11), p. 1950. Reading it as undercutting the 1943 calculus is later interpretation.
- **Q143** "We prove that one may simulate all Turing Machines by rational nets. In particular, one can do this in linear time, and there is a net made up of about 1,000 processors which computes a universal partial-recursive function. Products (high order nets) are not required, contrary to what had been stated in the literature." (Hava T. Siegelmann and Eduardo D. Sontag, 1992) https://biocomputation.cs.umass.edu/papers/1992_Siegelmann_COLT.pdf · COLT 1992 abstract.
- **Q144** "We restrict to rational states and weights in order to preserve computability. It turns out that using real valued weights results in processor nets that can "calculate" arbitrary partial functions, not necessarily recursive." (Hava T. Siegelmann and Eduardo D. Sontag, 1992) https://biocomputation.cs.umass.edu/papers/1992_Siegelmann_COLT.pdf · The precision caveat; the same paper says 'the activation values themselves are used instead to encode unbounded information'.
- **Q145** "one can simulate any multi-stack Turing machine in real time, and there is a net made up of 886 processors which computes a universal partial-recursive function." (Hava T. Siegelmann and Eduardo D. Sontag, 1995) https://core.ac.uk/display/82758236 · J. Comput. Syst. Sci. 50(1) abstract.
- **Q146** "In contrast to typical all-or-none action potentials, dCaAPs were graded; their amplitudes were maximal for threshold-level stimuli but dampened for stronger stimuli. These dCaAPs enabled the dendrites of individual human neocortical pyramidal neurons to classify linearly nonseparable inputs-a computation conventionally thought to require multilayered networks." (Gidon et al., 3 Jan 2020 (issue)) https://pubmed.ncbi.nlm.nih.gov/31896716/ · Science 367(6473):83-87 abstract.
- **Q147** "Where recurrent neural networks have direct parallels in finite state machines, allowing clear discussion and thought around architecture variants or trained models, Transformers have no such familiar parallel. In this paper we aim to change that, proposing a computational model for the transformer-encoder in the form of a programming language." (Gail Weiss, Yoav Goldberg, Eran Yahav, 13 Jun 2021) https://arxiv.org/abs/2106.06981 · RASP abstract ('Thinking Like Transformers', ICML 2021).
- **Q148** "We show how to "compile" human-readable programs into standard decoder-only transformer models. Our compiler, Tracr, generates models with known structure." (Lindner et al. (DeepMind), 12 Jan 2023) https://arxiv.org/abs/2301.05062 · Tracr abstract.
- **Q149** "Clearly, we will likely never compile fully featured language models in Tracr. Therefore, we should interpret experiments conducted on compiled models carefully, and treat evaluations based on them as a minimum bar rather than a full validation of a technique." (Lindner et al. (DeepMind), v5, 3 Nov 2023) https://arxiv.org/pdf/2301.05062v5 · Closing discussion, Limitations paragraph.
- **Q150** "The current approach to doing interpretability research is similar to trying to invent a microscope lens without ever being able to point it at familiar, well-understood shapes." (Lindner et al. (DeepMind), v5, 3 Nov 2023) https://arxiv.org/pdf/2301.05062v5 · Closing discussion.
- **Q151** "We present a framework for using transformer networks as universal computers by programming them with specific weights and placing them in a loop. Our input sequence acts as a punchcard, consisting of instructions and memory for data read/writes." (Giannou, Rajput, Sohn, Lee, Lee, Papailiopoulos, 30 Jan 2023) https://arxiv.org/abs/2301.13196 · arXiv abstract of 'Looped Transformers as Programmable Computers' (ICML 2023).
- **Q152** "The biggest lesson that can be read from 70 years of AI research is that general methods that leverage computation are ultimately the most effective, and by a large margin." (Rich Sutton, 13 Mar 2019) http://www.incompleteideas.net/IncIdeas/BitterLesson.html · 'The Bitter Lesson'.
- **Q153** "We have to learn the bitter lesson that building in how we think we think does not work in the long run." (Rich Sutton, 13 Mar 2019) http://www.incompleteideas.net/IncIdeas/BitterLesson.html · 'The Bitter Lesson'.
- **Q154** "I think Sutton is wrong for a number of reasons." (Rodney Brooks, 19 Mar 2019) https://rodneybrooks.com/a-better-lesson/ · 'A Better Lesson', the dissent from Sutton.
- **Q155** "ReGLU(x,W,V,b,c) = max(0,xW+b) ⊗ (xV+c)" (Noam Shazeer, 12 Feb 2020) https://ar5iv.labs.arxiv.org/html/2002.05202 · 'GLU Variants Improve Transformer', §2 Eq. 5. An equation, not speech. The repo does not cite it: a naming parallel only.
- **Q156** "We offer no explanation as to why these architectures seem to work; we attribute their success, as all else, to divine benevolence." (Noam Shazeer, 12 Feb 2020) https://arxiv.org/html/2002.05202 · Last sentence of the Conclusions.
- **Q157** "A standard softmax-ReGLU transformer whose weights are computed analytically that correctly simulates a WebAssembly virtual machine on arbitrary programs" (Percepta-Core/transformer-vm README, repo created 25 Mar 2026) https://github.com/Percepta-Core/transformer-vm · README L7-9 (bold removed). Context only; the Handwired repo cites Percepta in lab notes.
- **Q158** "For every integer u, one has Gate(u)=0 if u≤0 and Gate(u)=1 if u≥1" (Olivier Bournez, 27 Apr 2026) https://arxiv.org/html/2604.24356v1 · arXiv 2604.24356, Section 6, Lemma 20, with Gate(t):=ReLU(t)−ReLU(t−1). Corroborates the two-ReLU integer step; not Handwired's lineage.
- **Q159** "Squeezing infinitely many real numbers into a finite number of bits requires an approximate representation" (David Goldberg, March 1991) https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html · 'What Every Computer Scientist Should Know About Floating-Point Arithmetic', section 'Rounding Error'.
- **Q160** "The `Math.fround()` static method returns the nearest 32-bit single precision float representation of a number." (MDN Web Docs, current (Baseline since July 2015)) https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround · What f(x) means in the docs' formulas. MDN does not use the word 'approximate' on this page.
- **Q161** "An implementation may reassociate operations." (W3C WGSL specification, current) https://www.w3.org/TR/WGSL/ · §15.7.5 Reassociation and Fusion; why rounding points matter on GPUs.
- **Q162** "It’s what happens when your physics simulation can’t keep up with the steps it’s asked to take." (Glenn Fiedler, 10 Jun 2004) https://gafferongames.com/post/fix_your_timestep/ · 'Fix Your Timestep!', on 'the so called "spiral of death"' (he did not coin the term). Curly apostrophes in original.
- **Q163** "With VLSI architecture, the chip area and design regularity represent a better measure of cost than the conventional gate count. We show that addition of n-bit binary numbers can be performed on a chip with a regular layout in time proportional to log n and with area proportional to n." (Richard P. Brent and H. T. Kung, March 1982) https://maths-people.anu.edu.au/~brent/pd/rpb060.pdf · Abstract of 'A Regular Layout for Parallel Adders', from the retyped copy (July 2000, with corrections); check the IEEE scan (rpb060_IEEETC.pdf) before typesetting as the 1982 printed wording.
- **Q164** "At the time of publication the use of carry-lookahead in VLSI designs was unpopular." (Richard P. Brent (publication page), current) https://maths-people.anu.edu.au/~brent/pub/pub060.html · Brent's note on the 1982 paper.
- **Q165** "(we call this the straight-through estimator)" (Bengio, Léonard, Courville, 15 Aug 2013) https://arxiv.org/abs/1308.3432 · Abstract; the repo cites this once (lab/ui-exploration/learned-bits/README.md#L264).
- **Q166** "The simplest, fastest repository for training/finetuning medium-sized GPTs." (nanoGPT README (Andrej Karpathy), live 2026-10-27) https://github.com/karpathy/nanoGPT · What nanoGPT is, for the README's end-to-end aspiration.
- **Q167** "The example above, `/(a*)*b/.exec('a'.repeat(100))`, does not finish within our lifetimes if executed by Irregexp." (V8 blog (Martin Bidlingmaier), 11 Jan 2021) https://v8.dev/blog/non-backtracking-regexp · Background on backtracking regex engines; framing only.
- **Q168** "By executing the function with traced values, JAX can determine the sequence of operations encoded by the function" (JAX documentation, 'Key concepts', fetched 2026-10-27) https://docs.jax.dev/en/latest/key-concepts.html · Analogy only for 'run code once to record a fixed list of operations'; not lineage.

---

## 7. Debates (fair, two-sided)

1. **"Regular JavaScript"?** *For:* README tagline, launch post, an HN reader calls it "a compiler that turns arbitrary JS code into weights" [PJ01, PJ03]. *Against:* the docs ("No tool converts existing JavaScript source into a program"), critic gregsadetsky ("a DSL that creates a neural-net-shaped circuit") [Q014, Q130]. *Nuance:* the lab's trace compiler handles a defined TypeScript subset [LB09]. **Film stance:** "you rewrite the logic, by hand, as JavaScript that builds the network."
2. **"Exact"?** Exact against its FP32 reference and JS comparisons of FP32 values within declared ranges; not against float64 JS in general (1732 px), and not under false declarations (4.5 → 11) [EX01, EX03, TE07].
3. **"Fully differentiable"?** Every op has a backward rule; decisions have slope 0, atoms and index reads throw by default [DG03]. Film framing: "differentiable as real arithmetic; the decisions are flat."
4. **Is the GPU faster?** Yes for one program over 100,000 documents and for trees; no for HandwiredOS (27× slower), no against 8 workers, no after a pause on two patterns [JS13, CM08, PT06]. The repo states all sides itself [Q092-Q094].
5. **Trees vs loops.** Trees win on GPUs and on accuracy at scale (0.26 vs 5.67 px), loops win on the CPU and on bit-identity with the JS loop [PT06, PT14].
6. **Snap vs carry** past the step cap; **every evaluation vs commits only** (bit-identity vs simplicity and lag) [HL27, HL10-HL13].
7. **Trained vs hand-written recovery rules.** JSON: trained slightly better on familiar mistakes, rules better on unseen types and whole agent payloads; TOML: gradient alone lost; trial and error matches or beats gradients there [LB21-LB24].
8. **Neurons as logic gates.** Right as a 1940s idealization, wrong as biology (graded dendritic spikes) [FR11, FR12].
9. **Turing completeness of nets.** True with unbounded precision; fragile under noise (contested emphasis) [FR14, FR15].
10. **Learn vs compile.** Sutton vs Brooks; compiled nets as tools; Handwired as a hybrid bet [FR20].
11. **Who wrote it.** All commits authored by Cheng Lou; most co-credited to a coding agent; lab prose largely agent-written. State it plainly; don't speculate about the split [PJ08, PJ21].

---

## 8. Curiosity hooks (ranked)

1. At a = 4.5 the README's formula answers **11**, a number neither branch produces; the landing page's hidden comment admits it, and an HN reader found it by hand a week after launch [TE03, PJ19, PJ27].
2. Every `if` runs **both** branches, every frame; an unchosen Infinity still poisons the answer, because 0 × ∞ = NaN [TE11].
3. **Fourteen operations for 1.2 seconds of physics:** a spring of 2 steps or 300 costs the program the same 14 operations [SP01].
4. The same recorded session at 10 fps and 120 fps: **359 px apart** in the familiar loop, **identical in every bit** in Handwired's (in its tests) [HL18, HL11].
5. The odd number **8,388,609**: its oddness makes exactly 0.5 round up to 1 [PR08].
6. Tell the truth about your input (one grid declaration) and a comparison shrinks from **16 operations to 2** [PR12, TE05, TE08].
7. The no-grid comparison magnifies a difference by exactly **2^149**, the gap from the smallest float to 1 [TE08, EX05].
8. HandwiredOS's wallpaper is the program: **9,909 arcs**, one per weight, copper adds, indigo subtracts [OS14].
9. Monitor shows the running program to itself, every cell and operation with its live value [OS12].
10. On a GPU HandwiredOS was **27× slower** than on the CPU; its 6.4 MB shader hadn't compiled after 28 minutes [CM08, CM09].
11. The program dropped from **21,229 to 4,251 operations in a day**, mostly by handing text back to the browser's own textarea [OS04].
12. **Sorting without sorting:** each card counts how many come before it; 4,096 operations in 3 layers [PT16].
13. The same four row heights summed two ways give two answers one FP32 step apart [PT03].
14. The "parallel" running total is the **more accurate** one: 0.26 px vs 5.67 px drift at 10,000 rows [PT14].
15. `([a-z]+)+x`: **2.1 s** for RegExp, about **11 ms** for the program, which never backtracks [JS12].
16. **945 ms → 5.2 ms** without touching the program, only how the backend holds its numbers [JS10].
17. Multiplying every loss by a million, a change that should do nothing, turned **0/20 into 20/20** [LB04].
18. A checker reported **zero mismatches** while the compiled code returned 4 where JavaScript returns 3, because the checker had the same bug [LB08].
19. The derivative of 3·v at zero came out **0 or 3** depending on which operand was written first [DG28].
20. A RegExp gets its own worker **only so it can be killed** after 10 seconds [JS16].
21. A JSON parser's whole bracket stack fits in **one number**, one bit per level, up to depth 24 [PT22].
22. Reading one entry of a 10,000-row table: **30,002 operations** as arithmetic, **1** as an index read [PR17].
23. "More precise" broke it: float64 everywhere got **18,820 of 20,000** percent labels wrong [EX10].
24. Lie that a value stays under 16,384 and `y > 3` first goes wrong at **16,388** [EX04].
25. A switched-off neuron never wakes itself; a decay of **0.0000002** rescues it [DG11].
26. The easy fix (snapping) was rejected: "the spirit of the gallery is to learn something" [DG13, Q106].
27. A strict parser has **~1,300 table entries** valid JSON never touches; training only those makes it forgiving with valid parsing unchanged by construction [LB19].
28. On TOML, gradient descent lost **in every run** to a one-line rule: start anew on the next line [LB23].
29. **683 of 825 commits** landed in four October days, in every hour of the clock [PJ09].
30. The go-ahead to publish survives in a commit: "strip 1-4 yeah. Do it quick plz, then publish." [PJ12]
31. The project's first name was "Numeric UI Atom Lab", for three days; then "Indirect" for four months [PJ07].
32. Notes' to-do list ends: "Wire one more neuron by hand" [OS18].
33. Absolute time can never enter the program: after ~70 minutes an FP32 clock ticks in half-milliseconds [SP06].
34. The display frame is a **dress rehearsal**: it computes a whole next state and throws it away [HL10, HL14].
35. Two springs serve twelve photos, and you can make a photo jump if you're quick [OS15].
36. The GPU is 2-3× slower if it rested 200 ms, so a human typing gets the slow number; nobody found why [JS19].
37. The site's build **fails** if the landing card's 9,909 and 130 drift from the live program [PJ20].
38. The first neural-network paper ends by consoling psychiatrists: "Mind" no longer "goes more ghostly than a ghost" [Q137].
39. The founder of regular expressions couldn't decipher Part III of the paper he was extending [FR08, Q140].
40. McCulloch and Pitts co-wrote the 1959 paper that showed the eye speaks "a language already highly organized and interpreted" [FR10, Q142].

---

## 9. Sensitive-topic guidance

**Contested claims (present both sides):** "regular JavaScript" [PJ03]; "fully differentiable" [DG03, DG15]; GPU speed [JS13]; trained vs hand-written recovery [LB21]; noise and Turing-completeness [FR15]; Bitter Lesson [FR20]; logic neurons as biology [FR11]; snap vs carry [HL27].

**Living people.**
- **Cheng Lou:** use only what the repo and his own public posts say. Quote him only where the repo marks a quotation (Q099-Q106) or his own launch post (Q104). His words are informal ("ppl", "crufts", "alignemtn"): keep them verbatim or don't quote. Never put the reassessment's or lab docs' prose in his mouth. No biography beyond the repo; the React-core-team line is secondary press, attribute or omit. No likeness.
- **HN commenters:** quote as "a Hacker News commenter"; usernames optional. One reply was abusive about AI authorship; do not dramatize or quote it.
- **Researchers** (Siegelmann, Sontag, Lindner, Giannou, Sutton, Brooks, Shazeer, Karpathy and others): text cards, no likenesses, no characterization beyond their published words.

**AI labs, treated even-handedly, including the one this film is made with.** This film is written with Claude (Anthropic); Handwired's commits credit "Claude Code" as co-author on 756 of 825 commits, and its reassessment also mentions an earlier OpenAI Codex agent. Say this once, plainly and neutrally, as a fact about tooling. Do not imply any lab endorsed, sponsored or invented Handwired; do not name model versions (the repo names none); do not praise or disparage any lab's tools. DeepMind (Tracr), Percepta, Google (the Shazeer paper's affiliation) and OpenAI (Codex) get the same factual register. Note that one of the documented findings (the shared-bug oracle, the overclaimed "clearly faster") came from agent-written work later corrected by agent-run reviews under Cheng's direction: present it as a process, not a scorecard for any vendor.

**Hardware and brands.** The docs name an Apple M5 Max; show a generic laptop, no logos. Never render "O'Reilly"; only the parody "O'RLY?".

**Geopolitics.** Minimal: Kleene's memo was a U.S. Air Force Project RAND document; state it neutrally if at all. No other geopolitical content applies.

**Honesty guardrails.** Every number on screen comes from this bible with its conditions (date, machine, load). Do not compare timings across machines ("only times measured together compare"). Say "in the repo's tests" for bit-identity. Say "about 240" or "238 (as the message says)" for the merge. Say "integer domain" for the 19-20/20 learned-interpreter result.

---

## 10. Where things stand as of 2026-10-27

- `main` is still at `257856e` (merged 2026-10-16); public, MIT, about 2,033-2,034 stars, 158 forks [PJ17].
- Shipped: the runtime (CPU only), the template, three demos live at chenglou.me/handwired [PJ18, CM04].
- Measured: HandwiredOS 4,646 ops / 130 layers / 9,909 weights; JSON search 11-15 ms per keystroke over 100,000 documents on one machine; learned gallery 244 weights trained at 600 steps/s [OS02, JS11, DG10].
- Not delivered (repo's words): "GPU execution, a general JavaScript compiler, learned arbitrary abstractions, and a full learned UI runtime" [Q125, LB26]. End-to-end training with a generic net: not attempted [DG22].
- Still open: addition grouping from fractional examples; scaling program learning; a search guide across task families; shared query/key functions; real human evidence [LB26]. Open decisions: demo site address and Pages workflow; depth optimization; one press per evaluation [LB28]. Known issues: NaN range gap, `emitArgmax` order, statement-order gradient sums, title-bar buttons kept equal by hand [EX16, OS19]. Parked: dynamic division, layer scheduling, hardAttend [EX14, LB27]. Recovery on bison: final test not yet run [LB24].
- Reception: a launch post, a Show HN, critiques of the tagline; no public discussion of the lab [PJ26-PJ28].

---

## 11. Do not use (corrected or unverifiable; never resurrect)

- The X line "Isn't a neural net probabilistic? Yes if you train it, no if you hand-wrote the weights..." attributed to Cheng: **UNVERIFIED**, original not found.
- "No need to abide by the guide religiously. Back out what didn't": second-hand, truncated record; not usable as Cheng's statement.
- The film's own runs not reproduced by fact-check: 41-44 µs / 162-167 µs HandwiredOS timings (M4 Max); 64.5 / 72.1 / 218.1 µs layer timings; 114,476 bytes; 623,442 dense entries / "1.6% density"; the gallery gradient digits 0.00236120680 / ...684; damping gradients at 150 and 300 steps (−0.0011773, −1.52e-6). Re-run before any of these go on screen.
- "The learned interpreter failed in July": the 0/20 report is undated.
- "d79d9aa retracted 'clearly faster'": it did not.
- "14 ms vs 58-315 ms" for the million kernel (mismatched state sizes).
- "124,424 operations per document" (computed, not stated by the repo).
- "Kogge-Stone appears only in a lab example"; "HandwiredOS sorts with a bitonic network"; "Handwired runs on the GPU" (unscoped).
- "Fiedler named the spiral of death"; "300 is 75× a frame's steps"; "springs always land on 64 ms multiples"; "a settle check is the only place a spring stops" (snaps too); "event handlers do nothing but queue".
- "chenguini is Cheng's own guideline" (authorship not stated by the repo).
- "The hit tests alone took HandwiredOS from 5,253 to 3,654" (it was the whole Sept 15 move).
- "MDN calls floats approximate"; "held by most programmers"; "ReLUs only approximate decisions" (unsourced framing).
- "17c2318's one-day gap is a lab vs merge date"; "Brent & Kung's paper gives 2 log2 n − 2 levels"; Sklansky's fanout quote and biography; Blelloch "1990" (repo's attribution only); Lettvin's electrode-paper anecdote; Adam's "good default settings" caption; AlphaSignal "No lab or institution is named"; "one machine shared with other agents' work".
- "~1.5× phantom gradient" as the general size of straight-through bias (generative-fields only).
- "The trained parser beat hand-written rules" without scope; "fairer starts rescued everything"; "trial and error, or TOML mistakes, brought it level".
- "Over a third of repairs were valid only because they hid items."
- "ACDC's tracr result shows compiled models differ from trained ones."
- "13-layer transformer runs SUBLEQ" (Lemma 4 is ten layers, two heads).
- Any "a = 4.5 under emitCompare is always wrong" (only under a false grid; the cascade is right).
