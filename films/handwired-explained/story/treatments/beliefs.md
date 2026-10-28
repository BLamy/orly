# Treatment: *Promises, Not Proofs*

**Angle: THE BELIEF OF THE AGE.** The film is built from what people were *sure* of, who doubted it, and how
long the certainty lasted before it broke. Here the "ages" are short: the long ones run for decades (1943's
logic neuron), and the ones inside Handwired run for months, days, even hours. A recurring device marks every
belief with its holders, its dissenters and its lifespan, so the viewer feels how knowledge moves inside a
real project.

- **Film:** `handwired-explained` · 24:00 · about 2,280 narration words (95 wpm) · silhouette / paper-cut theatre
- **Sources:** `research/bible.md`, `claims.json`, `quotes.json` only. Claim ids are in square brackets; quote ids are `Q###`.
- **Written by:** Claude Opus 5.5 (high effort), one of several competing treatments for the judge panel.

> **A note on the brief versus the treatment template.** The computed task for this treatment carried the
> history-film checklist (all eras, both AI winters, classical ML, ChatGPT, Anthropic, the US–China race, deep
> dives on AlexNet and the transformer). That checklist belongs to `neural-net-history`. This film's brief says
> "the film is about Handwired, not a history" and keeps the history to brief framing. Its research directions
> override the history framing, and the bible is the only source of facts. The bible has nothing on AlexNet,
> the winters, ChatGPT or the US–China race, and its sensitive-topic section (§9) says "No other geopolitical
> content applies." So this treatment covers **the brief's** must-cover list in full. The eras it covers are
> the bible's own seven eras (§2). The two required in-depth "teaching machine" sequences become the brief's
> **three** deep dives: ternary → ReLU, loops and state, gradients. The AI-lab item is met as the bible asks:
> one plain, neutral sentence about the coding agents, Anthropic's included. The transformer appears only where
> the bible supports it: the repo's own comparison with chain-of-thought and the fact that Handwired has no
> attention.

---

## Title

# HANDWIRED
### Promises, Not Proofs

*Subtitle card:* **How a program becomes a neural network, told in the things people were sure of.**

The title comes from the line the whole film turns on, the docs' "Declarations are promises from the caller,
not proofs." (Q029). The title paraphrases it and does not put it in quotation marks; the line itself is quoted
verbatim in Chapter 4. "Promise" is the film's word for belief. In Handwired, a belief is literally something
you write onto a wire, and the machine trusts it.

## Logline

Handwired turns a JavaScript interface into a neural network whose every weight was written by hand. The network
runs every operation every frame, cannot stop early, and matches JavaScript exactly, as long as nobody lies to
it. Told through the beliefs tied onto its wires like paper tags, from the 1943 logic neuron to a launch-week
tagline, the film teaches how the machine really computes: ramps for every `if`, a clockwork for every loop, a
valve for every gradient. Along the way it shows a lab that writes its own doubts down beside its certainties,
and breaks them on a schedule.

## The angle in one paragraph

Most explainers tell you how a thing works. This one tells you **what people were sure of while they built it,
and what happened to each certainty.** Handwired is unusually good for this: its repository keeps the belief and
the doubt in the same place. The README promises "exact", and a hidden comment on the landing page admits the
case where it isn't [PJ19]. The tagline says "regular JavaScript", and the docs' first page says no tool converts
it [Q001, Q014]. The July experiment briefs listed conclusions to be taken as settled, and a September
reassessment struck ten of them out [LB02, LB03]. A GPU write-up called the GPU the faster one, and a review
withdrew that the same day [JS21]. The lab's last experiment before the pin fixed the rule for failure *before*
it ran, then reported the failure [LB23, Q123]. The viewer learns the machine through the moments its promises
were tested, because that is where the arithmetic shows: at 4.5, at 2^24, at 300 steps, at a closed gate. The
viewer also learns the larger lesson. In this project knowledge moves fast, in writing, by checks that are
allowed to fail.

---

## The recurring devices

There are three visual devices, one musical device and one spoken refrain. They always appear together and in
the same order. By Chapter 4 the audience can read a belief's whole life at a glance.

### 1. The Promise Tag (the spine)

Every belief is a **paper tag tied to a copper thread**. The style comes from the repo's own declaration tags
("0..16,384", "grid 1/64", "one-hot") in the art department's machine 5 [PR11, EX04]. A tag has three faces:

- **Front, in ink:** the belief, as an on-screen paraphrase (never in quotation marks unless it is a verbatim
  `quotes.json` span).
- **The knot:** who tied it on. Each holder is a small typeset name card threaded through the eyelet (for
  example "McCulloch & Pitts, 1943", "the July briefs", "README"). Living people and unnamed writers get text
  only; the dead get a respectful profile silhouette.
- **Back, in red pencil:** the dissent. The tag flips to show it. A **red pencil** (the bible's reviewers are
  "paper-cut hands with red pencils" [§3]) writes the dissenter's name and one word or number of the doubt.

When a belief breaks, the red pencil **strikes the front through once**, and the tag is unhooked and filed (see
device 3). A belief that is still contested stays hanging, with the red pencil resting beside it. A belief that
is true in one world but not in another (JavaScript's `if`) gets a **border tag**: a tag cut in two along a
dotted line, one half inked and kept, the other half struck.

**The rule of attribution (enforced on every tag).** A tag names only holders the bible names. When the bible
gives no holder, the knot stays **empty**: a visible eyelet with no card. That happens once, for the float64
question in Chapter 5 ("held by most programmers" is in the Do-not-use list). The empty knot is a small, honest
beat: the film won't invent who believed something.

### 2. The Lifespan Rule (how long it held)

Along the bottom of every tag shot runs a long **paper ruler on a log scale**, with copper ticks at *an hour · a
day · a week · a month · a year · a decade · a lifetime (80 years)*. Each tag's thread drops to the point on the
rule that matches its lifespan from the bible. That binds the visual variable to a real quantity, as style-bible
rule 6 asks. The log scale is the film's quiet argument. The 1943 tag hangs near the far end, and almost every
Handwired tag hangs in the first few centimetres. **Knowledge inside this project moves in days.**

- A **frayed thread end** means the start or end date is interpretive in the bible (for example the end of the
  logic neuron as biology, or the start of "one evaluation per frame").
- A thread that **runs off the end of the rule with a faint copper glow** means the belief is still held as of
  2026-10-27.
- A **question-mark tag on a slack thread** (no lifespan) means an aspiration nobody has tested yet.

| # | Tag (paraphrase on screen) | Tied on by | Red pencil | Lifespan on the rule | Claims |
|---|---|---|---|---|---|
| 1 | The neuron is a logic gate | McCulloch & Pitts (1943); von Neumann adopts it (1945); Kleene keeps it as "close to the biological reality" (1951) | Kleene finds Part III "obscure" (1951); the 1959 frog paper (by the same two men, reading it as dissent is later interpretation); graded dendritic spikes (2020) | Two threads from one knot: **as biology**, frayed, cracking from 1959, broken by 2020; **as engineering**, off the end of the rule, glowing (it became automata theory and the stored-program computer) | FR01–FR12 |
| 2 | Learn the weights; don't write them | Sutton (2019); compiled nets survive as tools (Tracr) | Brooks (2019) | 2019 → still held; contested, dominant, not consensus | FR17–FR20 |
| 3 | An `if` runs only the branch it picks | JavaScript itself (MDN) | — (a **border tag**: true in JS, false in Handwired) | — | TE15, TE11 |
| 4 | `a` is a whole number (`assumeGrid(a, 1)`) | the caller | the validator, which throws on 4.5 | one evaluation | TE07, PR12 |
| 5 | (a > 4) ? 10 : 12, by ReLU, small print "for an integer a" | README example | the landing page's own hidden comment (from the start); a Hacker News commenter (23 Oct) | the small print was there from day one; public: 14 → 23 Oct, **9 days** | TE01–TE03, PJ19, PJ27 |
| 6 | Would float64 everywhere be safer? (a **question tag**) | **empty knot** | the exactness-budget study | **one study, 13 Sept** | EX10 |
| 7 | One evaluation per frame is enough | HandwiredOS's own design | a frame's moves collapsed into one evaluation (paraphrase) | frayed start → **15 Sept 2026** | HL17 |
| 8 | A spring stores where it is | the absolute-position springs | far-out runs mis-settle in 42–48 of 48 | frayed start → **14 Sept 2026** | SP10, SP11 |
| 9 | The GPU is the faster one (for the highlighter half) | the first json-search README, already hedged (13 Oct, 09:01) | a review the same day | **hours** (the shortest thread in the film) | JS21 |
| 10 | Settled: take the July conclusions as given (paraphrase, never in quotation marks) | the July briefs, from an unnamed design conversation (**not** Cheng) | the 3 September reassessment (an AI agent's review, by its own account) | **8 July → 3 Sept 2026, about eight weeks** | LB01–LB03 |
| 10a | The learned interpreter fails: 0 of 20 | an earlier, **undated** report | the reassessment's loss-scale rerun | frayed start → 3 Sept | LB04, LB05 |
| 10b | Zero mismatches in 1.1 million comparisons | the trace compiler's July claim | the shared-bug finding | July → 3 Sept | LB08, Q116 |
| 10c | Compiling ordinary source is a dead end | the July briefs | the reassessment (narrowed: a defined numeric subset is feasible) | July → 3 Sept | LB02, LB03, LB09 |
| 11 | Turn your regular JavaScript into a neural net | README tagline (Q001), launch post (Q104), a Hacker News reader | the repo's own docs (Q014), from day one; a Hacker News critic (Q130) | 14 Oct → still contested; **the dissent shares its knot** | PJ01, PJ03 |
| 12 | Fully differentiable | README tagline | inside the repo itself (Q110, Q112) | 14 Oct → still contested | DG03, DG15 |
| 13 | Gradient descent can fill the parser's unused table entries | the recovery experiment, **with its failure rule fixed beforehand** | its own rule: TOML fails it | about **2 days**, 15 → 16 Oct; JSON passes, TOML fails, bison's final test not run | LB19–LB24 |
| 14 | A nanoGPT could do Shakespeare and your UI? | README use-case, phrased as a question (Q011) | — | **question-mark tag, slack thread**: not attempted | DG22 |
| 15 | (blank, being written) Wire one more neuron by hand | the Notes window's last to-do line (Q088) | — | tied on in the last shot | OS18 |

### 3. The Ledger (where broken tags go)

Struck tags are filed in a tall cabinet drawn as `lab/status.md`: a ledger with drawers labelled **Known
issues · Open decisions · Still open · Parked and deferred**, plus two **sealed archive drawers** with brass
labels that carry the repo's real git tags, `exploration-2026-09` and `json-regex-experiments-2026-10`
[LB14, JS20, LB26–LB28]. The wordplay stays light: the repo files its finished experiments under *tags* too.
The cabinet appears four times: Chapter 5 (first filing), Chapter 7 (the two September tags), Chapter 10 (ten
tags struck in a cascade, the visual climax of the device), and Chapter 12 (the "Still open" drawer slides out
and stays open into the epilogue).

### 4. The music: the detent figure

Machines clack, never chime. The tag motif is a **three-stroke figure** played on woodblock and ratchet:
*tie* (a soft detent click), *flip* (a paper-card snap), *strike* (a dry pencil scratch that resolves into a
wooden drawer closing). A belief that is still held leaves the third stroke unplayed, and the bar hangs. Under
the deep dives the figure slows into the host clockwork's 4 ms escapement idea (an even, patient tick, never
literally 250 Hz). The ending plays the figure for the last tag with the third stroke still missing, then lets
the haze hold.

### 5. The spoken refrain

The narrator's own words, never put in quotation marks: **"Who tied it on. Who doubted it. How long it held."**
It is spoken in full three times: the prologue (as a promise of what the film will do), Chapter 4 (at the false
grid), and Chapter 10 (over the cascade of strikes). Elsewhere it shortens to one clause ("It held for nine
days."). The epilogue turns it: *"Who tied it on, we know. Who will doubt it, we don't. It's still holding."*

---

## Chapter list (24:00, about 2,280 words)

| # | Chapter | Starts | Min | Words | Mood | Belief tags |
|---|---|---|---|---|---|---|
| 1 | Prologue: Four and a Half | 0:00 | 1.0 | 95 | parchment → candleAmber | (5) tied, unread |
| 2 | The Oldest Tag (1943 → 2019) | 1:00 | 1.5 | 140 | candleAmber | 1, 2 |
| 3 | A Recipe Read Every Frame (what a program is) | 2:30 | 1.5 | 140 | parchment | 11 tied (dissent held back) |
| 4 | **Deep Dive I: Two Ramps and a Lever** | 4:00 | 4.0 | 380 | parchment → duskRose | 3, 4, 5 |
| 5 | What Exact Means | 8:00 | 1.0 | 95 | labGreen | 6 |
| 6 | One Big Matmul (compilation, backends) | 9:00 | 1.0 | 95 | serverCyan | (GPU question planted) |
| 7 | **Deep Dive II: The Clockwork That Cannot Stop** (host loop, springs, patterns) | 10:00 | 4.0 | 380 | candleAmber → labGreen | 7, 8 |
| 8 | Three Desks (HandwiredOS, JSON search, the gallery) | 14:00 | 1.5 | 140 | dawnGold / serverCyan | 9 |
| 9 | **Deep Dive III: Unfreezing** (gradients through a handwritten program) | 15:30 | 3.5 | 335 | duskRose | 12, 14 |
| 10 | The Summer's Certainties (the lab and the reassessment) | 19:00 | 2.0 | 190 | winterBlue | 10, 10a–c |
| 11 | Four Days in October (launch and reception) | 21:00 | 1.0 | 95 | emberRed | 11's dissent revealed; 5 paid off |
| 12 | The Rule Written First (recovery parser, what's still open) | 22:00 | 1.0 | 95 | winterBlue → dawnGold | 13 |
| 13 | Epilogue: One More Neuron | 23:00 | 1.0 | 95 | dawnGold | 15 |

The three deep dives take 11.5 of the 24 minutes. The framing history takes 1.5 minutes and is labelled as
framing on screen ("context: the repo cites none of this work" [FR22, bible §1]).

---

## The first 60 seconds, shot by shot

Narration ≈ 95 words. Timings are targets; the locked clock will come from the narration.

**ch01-s01 · 0:00–0:09 · scene · parchment · transitionIn: fadeBlack**
*Visual:* Black, then haze. A single **copper thread** draws itself from frame left to right at about 58% of
frame height (the backlight's peak), catching rim light. It is the "one copper wire under the dock" of HandwiredOS
[OS18], though nothing says so yet. At 2.5 s a **blank paper tag** swings into frame on the thread and settles
with a soft detent click (the first *tie* stroke). Hold 1 s.
*On screen (equation, typeset, beat `code`):* `const result = (a > 4) ? 10 : 12`
- **L0001** "Here is a line of JavaScript a child could check."
*Claims:* TE01, OS18.

**ch01-s02 · 0:09–0:22 · scene · parchment**
*Visual:* Push in through a parchment plate into the first teaching machine, **Two Ramps and a Lever** (art dept
machine 1). Two hinged black boards stand against a luminous dawn haze. Each is flat, then climbs at 45°, with its
corner at 4 on the first board and at 5 on the second. A lever between them reads the difference. A marble rolls
to **5**, and a copper **10** tile drops into a tray. The marble rolls back to **3**, and a **12** drops.
- **L0002** "If a is more than four, the answer is ten. If not, twelve."
- **L0003** "Now build it from weighted sums and ramps, the parts a neural network is made of."
*Beat `ramps`* on "ramps": both boards light along their slopes.
*Claims:* TE01, TE02, PR02.

**ch01-s03 · 0:22–0:38 · scene · parchment → candleAmber (lamp change on beat `half`)**
*Visual:* A paper hand places the marble at **4.5**, exactly halfway up the first slope; the second board is still
flat. Behind the ramps, two conveyor arms carrying **10** and **12** tiles keep moving (both branches always run).
Their two shutters stand **half open**. With a heavy clack, a tile that is neither slides out into the light. It
reads **11**. Silence for 1.6 s; only the haze moves.
- **L0004** "Give it five: ten. Give it three: twelve."
- **L0005** "Give it four and a half." *(pauseAfter 1.6)*
- **L0006** "Eleven." *(level soft, pauseAfter 0.9)*
- **L0007** "A number neither branch contains."
*Claims:* TE03, TE11.

**ch01-s04 · 0:38–0:52 · scene · candleAmber**
*Visual:* The camera tilts up to the copper thread. The blank tag turns and ink writes itself on the front:
`(a > 4) ? 10 : 12`. Below it, in type a quarter that size, the README's own small print appears, *for an integer
a* (on screen as a verbatim span of Q003: "For an integer a, above4 is 1 if a > 4, and 0 otherwise"). A **red
pencil** enters frame right, stops at the tag's edge and does **not** write. The Lifespan Rule fades up along the
bottom, empty.
- **L0008** "The machine isn't broken. It was built for whole numbers, and it took that on trust."
- **L0009** "This film is about promises like that one, tied to the wires like tags: who tied them on, who doubted them, and how long they held."
*Claims:* TE03, Q003.

**ch01-s05 · 0:52–1:00 · card · candleAmber → parchment · transitionIn: inkBleed**
*Visual:* The tag swings out of frame. Along the copper thread, more blank tags slide in from the dark, a dozen,
evenly spaced, all unwritten (planting the epilogue's washing line). The title is set in ink on parchment:
**HANDWIRED**, then *Promises, Not Proofs*, then the subtitle card. The music's detent figure plays *tie, flip*,
and the bar hangs with no *strike*.
*No narration.* minDuration 8.
*on-screen:* title, subtitle.

---

## Chapter by chapter

### 1 · Prologue: Four and a Half (0:00–1:00)
As above. The tag tied in the prologue is **tag 5**. It is not explained until Chapter 4 and not settled until
Chapter 11.

### 2 · The Oldest Tag (1:00–2:30, 140 words) · candleAmber
A slow pull back from the copper thread to a far older one, strung across a 1940s study (a gothic window bay,
a desk lamp, the 1943 page of arrow-and-loop net diagrams on a parchment plate). **Tag 1** is tied on by two
profile silhouettes (McCulloch with a full beard, Pitts small, with spectacles, per the bible's appearance notes).
The narration quotes Q133 ("Because of the “all-or-none” character of nervous activity, neural events and the
relations among them can be treated by means of propositional logic."). Von Neumann's EDVAC report borrows the
idealization [FR06]. The tag flips: Kleene, under a RAND memo stack, found the part on arbitrary nets "obscure"
(a verbatim word from Q139). In 1959 the frog faces its grey aluminium hemisphere [FR10], and a caption says plainly
that reading the frog paper as a refutation is later interpretation [FR11]. In 2020, human dendrites compute an
XOR-like function with graded spikes [FR12]. The thread **splits at the knot**: as biology it frays out near the
end of a lifetime; as engineering it runs off the rule, glowing, because it became automata theory and the
stored-program computer [bible E1].
A second, younger thread holds **tag 2**: Sutton's Q152 on one face, Brooks's Q154 on the back. The narrator says
it plainly: in 2026 learning the weights is the dominant view, not a consensus [FR20]. Into that world arrives a
project that writes its weights by hand. A caption reads *context: the repo cites none of this* [FR22].
*Claims:* FR01–FR12, FR20, FR22. *Quotes:* Q133, Q139, Q152, Q154.

### 3 · A Recipe Read Every Frame (2:30–4:00, 140 words) · parchment
The HandwiredOS desk (art dept 20): warm paper-beige, a faint dot grid, a wallpaper of hundreds of thin copper and
indigo arcs (unexplained: a plant), three windows. A pair of paper hands at a laptop, with a second paper hand
beside them at the keyboard (the coding agent, no face, no words).
The film defines the system the way the tutorial does: Q016 ("A numeric program is a fixed list of operations over
32-bit floats, called FP32 here, mostly weighted sums and products with a ReLU."), then Q017's builder code, shown
as **the builder ribbon** (art dept 9): operation tags appended one by one, each pinned one layer to the right of
its deepest input. The **source table** (art dept 8) for the template toggle is a strip of 20 numbered pigeonholes,
with 1280 and 800 in slots 0 and 1, event flags that pop to 1 and fall back to 0, a four-slot spring-matrix rack,
and state cards [CB09]. A wire is "the position of a number" (Q020). The host is the JavaScript around it (Q018).
A parchment plate lists the **four instructions** [PR02], with `boolean(score)` containing the odd number
**8,388,609**. That number is planted on screen and not mentioned until Chapter 5.
**Tag 11** is tied on: the README's tagline (Q001). The narrator reads it with pleasure, and the red pencil stays
in its tray. Its dissent waits for Chapter 11. A text card plants the question the film owes an answer to:
*"Website is missing the #1 thing I imagine most readers would want to know: why?"* (Q132, "a Hacker News commenter").
The narrator: "Hold that question. We'll come back to it."
*Claims:* PR01–PR03, PJ02, CB01, CB04, CB05, CB09, PJ01, PJ27. *Quotes:* Q016–Q020, Q001, Q132.

### 4 · Deep Dive I: Two Ramps and a Lever (4:00–8:00, 380 words) · see "How the deep dives teach"

### 5 · What Exact Means (8:00–9:00, 95 words) · labGreen
The detent machine (art dept 4): a fine ruler slid onto a giant ruler that starts at **8,388,609**, with ticks 1
apart. A score of 0.49999997 snaps back to 0, and exactly 0.5 snaps **up** to 1, because the start mark is odd and
ties round to even [PR08] (pays off the Chapter 3 plant). Then the definition, Q036 ("Exactness means equality to
the stated FP32 calculation, ignoring the sign of zero, not equality to arbitrary JavaScript float64 arithmetic.").
The 1732 px window: `f(f(1708) × f(1/244))` = 6.999999523162842, so seven columns become six where float64 says
seven [EX03]. **Tag 6**, a question tag with an **empty knot**, asks whether float64 everywhere would be safer.
The study's answer: 18,820 of 20,000 percent labels wrong [EX10]. The tag is filed in the Ledger (first filing).
Last beat, a plant: Q038 on a parchment plate ("That the two evaluators agree doesn't show that a program does what
the JavaScript it replaces did.").
*Claims:* PR08, EX01–EX03, EX07, EX10, EX11. *Quotes:* Q036, Q038 (Q058 on screen as a label).

### 6 · One Big Matmul (9:00–10:00, 95 words) · serverCyan
**The matmul loom** (art dept 10): 130 thin frames, one per layer; 9,909 threads (copper for adding, indigo for
subtracting); ramps and detent wheels behind the frames; mostly empty air. Sheets fuse, then stop dead at a gate
frame. The camera passes through the loom and comes out the other side to find the **wallpaper**. The Chapter 3
plant pays off: every arc is one weight, drawn by page JavaScript from the compiled program [OS14]. On screen:
**4,646 live operations · 130 layers · 9,909 weights** [OS02]. Q041: all of it runs as JavaScript on the CPU. A
GPU tag is planted but **not** tied: on WebGPU this desk took 2.2 ms per evaluation against 81 µs on the CPU, about
27 times slower, measured together on one machine, 16 September [CM08]. The narrator: "So what is a GPU *for*?
Hold that one too."
*Claims:* CM01, CM02, CM04, CM07, OS02, OS14, CM08. *Quotes:* Q006, Q039, Q041.

### 7 · Deep Dive II: The Clockwork That Cannot Stop (10:00–14:00, 380 words) · see below

### 8 · Three Desks (14:00–15:30, 140 words) · dawnGold, then serverCyan
**HandwiredOS:** Monitor shows the running program to itself, every cell and operation with its live value
[OS12], and Q074 ("Only 64 rows are drawn at a time.") pays off the K-slot rack from Chapter 7. The program
dropped from **21,229 to 4,251 operations in one day**, mostly by handing the text back to the browser's own
textarea [OS04] (Q087 on screen, verbatim with its ellipsis).
**JSON search:** the map of **100,000** tiny cells, matches lit copper [JS17], and Q090 (the GPU is for many
documents) answers Chapter 6's "what is a GPU for?" **Tag 9** is tied on and flipped within seconds: a first
write-up called the GPU the faster one at 09:01, already hedged, and a review withdrew it the same day [JS21]. The
shortest thread in the film is barely a millimetre on the rule. The honest verdict, Q092, stays on screen, and
Q091's one measured line is shown as the page shows it. The RegExp booth gets its 10-second hourglass and trapdoor
[JS16]: `([a-z]+)+x` takes 2.1 seconds for RegExp and about 11 ms for the program, which never backtracks [JS12].
**The learned gallery** is a bridge into Deep Dive III: photos piled as tiny squares in the middle of the stage.
*Claims:* OS01–OS19 (selected), JS01, JS11–JS13, JS16, JS17, JS21. *Quotes:* Q084, Q087, Q090–Q092.

### 9 · Deep Dive III: Unfreezing (15:30–19:00, 335 words) · see below

### 10 · The Summer's Certainties (19:00–21:00, 190 words) · winterBlue
The Ledger cabinet stands in a cold, blue lab set: a window bay with snow light, the laptop, the two paper hands.
On **8 July** the first lab round lands four experiments [LB01]. **Tag 10** is tied on by an *unnamed design
conversation*, written on its knot card as just that, with a caption: not Cheng [LB02]. Three sub-tags hang from
it: **10a** (the learned interpreter scores 0 of 20, from an undated report, frayed start), **10b** (zero
mismatches in 1.1 million comparisons), **10c** (compiling ordinary source is a dead end).
Then comes **3 September** [LB03]. The red pencil works fast, and the refrain is spoken in full over a cascade of
ten strikes:
- **10a:** multiplying every loss by a constant, which should change nothing, moves the result from 0 of 20 to 20
  of 20 at a million [LB04], with the reassessment's own caveat on a label: it does not show that the method scales
  [LB05].
- **10b:** a plate shows `if (true) { return x + 1 } return x + 2` at x = 2. JavaScript returns 3, the compiled
  code 4, and the checker reported zero mismatches because it shared the bug [LB08]. Q116 is read. *This pays off
  the Chapter 5 plant, Q038.*
- **10c:** narrowed, not reversed: a defined numeric subset compiles [LB03, LB09].
- Multiply's gradient at zero came out 0 or 3 depending on operand order, and was fixed the same day [DG28].
The fixes land that morning with 274 tests passing [LB12]. Q118 names the danger ("it passes yesterday's
interpretation to tomorrow's agents as a constraint."), and Q115 states the bottom line.
**The one plain sentence about tooling** (bible §9), in a neutral register: 756 of the repo's 825 commits credit
Claude Code as co-author. The reassessment also traced an earlier design discussion with OpenAI's Codex. This
film, too, was written with Claude [PJ08, PJ21]. Mistakes made with agents were found by reviews run with agents,
under Cheng's direction. The film presents that as a process, not a scorecard. No model versions, no praise, no
blame.
*Claims:* LB01–LB05, LB08, LB09, LB12, DG28, PJ08, PJ21, PJ23. *Quotes:* Q115, Q116, Q118.

### 11 · Four Days in October (21:00–22:00, 95 words) · emberRed
A fast-turning commit ribbon of **683 of 825 commits** in four days, in every hour of the clock [PJ09]. On a card,
the go-ahead survives in a commit, Q103 ("strip 1-4 yeah. Do it quick plz, then publish."), kept verbatim and
lowercase. The launch post, Q104, appears as a text card. Then the public red pencils: Q130 on **tag 11**. The tag
flips, and the dissent is **already written on the back in the repo's own hand**, Q014 ("No tool converts existing
JavaScript source into a program."). The knot and the dissent were tied on together. **Tag 5** pays off: Q131 on a
card. A reader found the 11 by hand nine days after launch, and the landing page's hidden comment had said so all
along [PJ19, PJ27]. The film's stance, in narration: you rewrite the logic, by hand, as JavaScript that builds the
network [bible §7.1].
*Claims:* PJ09, PJ11–PJ14, PJ26, PJ27, PJ03, PJ19. *Quotes:* Q103, Q104, Q130, Q131, Q014.

### 12 · The Rule Written First (22:00–23:00, 95 words) · winterBlue → dawnGold
**The recovery grid** (art dept 25): a lookup table of about 1,560 cells, about 240 of which glow on valid JSON's
path. A paper hand fills the roughly 1,300 dark ones, which valid input never reads, so valid parsing is unchanged
*by construction* [LB19, Q120]. **Tag 13** is tied on with a second card on its knot, **the rule for failure,
written before the run.** JSON: Q122 ("JSON is a clear success. …", quoted whole). TOML: Q123, and the tag is
struck **by its own pre-set rule**; then Q124 scopes the loss honestly. The bison track's final test is not run;
its thread ends in a small open loop [LB24]. The "Still open" drawer slides out and **stays open** (Q125 on its
label).
*Claims:* LB19–LB26, PJ15. *Quotes:* Q120, Q122–Q125 (Q121 only if quoted whole).

### 13 · Epilogue: One More Neuron (23:00–24:00, 95 words) · see "The ending"

---

## How the deep dives teach

Each deep dive is built on **one teaching machine that grows**, rather than a sequence of unrelated diagrams.
Every number shown is computed for real and traceable to the bible. Each dive has the same internal shape:
**a promise → the machine keeps it → the machine is pushed past it → what the runtime actually does → a tag.**

### Deep Dive I · Two Ramps and a Lever (`(a > 4) ? 10 : 12` by hand) · 4:00, ~380 words

*Machine:* the prologue's Two Ramps and a Lever, extended by the Both-Branches conveyor (art dept 2), the
sign-cascade lens train (3) and the tags on wires (5).

1. **The first ramp (0:00–0:35).** One board: `max(0, a − 4)`. The marble visits 3, 4, 5, 6 and 100, and a
   parchment plate fills one row per visit: 0, 0, 1, 2, 96 [TE02]. The narrator's line: a ramp is all ReLU is;
   Q003's first clause on screen ("// Math.max(0, x) is ReLU.").
2. **The second ramp, one step later (0:35–1:05).** `max(0, a − 5)`: 0, 0, 0, 1, 95. The lever reads the
   difference, **above4**: 0, 0, 1, 1, 1. The two boards together trace a flat, a climb, a flat, and the marble
   path draws that shape in copper: **clamp(a − 4, 0, 1)** [TE03]. Whole numbers sit on the two corners.
3. **Both branches run (1:05–1:45).** The conveyors carrying 10 and 12 never stop. The select is drawn as
   `above4 × 10 + (1 − above4) × 12`, with two shutters [TE01]. Q004 is on screen ("// Both branches compute, and
   above4 picks one"). **Tag 3, the border tag**: in JavaScript the conditional runs only the chosen arm (MDN
   [TE15]); here, every frame, both run. The price arrives as a single image: an **∞** tile rides the closed
   belt, and the output tray fills with grey **NaN** sand, because zero times infinity is not zero [TE11, Q082 on
   screen].
4. **Four and a half (1:45–2:15).** The prologue replayed with numbers: 0.5 − 0 = 0.5, so 0.5 × 10 + 0.5 × 12 =
   **11**, and at 4.25 it gives 11.5 [TE03]. A second, colder limit appears on a plate: at a = 16,777,222 FP32
   rounds a − 5 to 16,777,216, above4 becomes 2, and the answer is 8 [PJ19]. Both are in the landing page's own
   hidden comment. **Tag 5** gets its small print read aloud.
5. **What the runtime really builds (2:15–3:00).** `emitCompare` refuses to build without declared ranges
   [TE04]. A paper tag reading **grid 1** is tied onto the wire `a`, which is **tag 4**. The machine shrinks to
   two operations: `ramp = relu(5 − a)`, `bit = relu(1 − ramp)` [TE05]. The plate checks it by hand: at a = 5,
   ramp 0, bit 1, answer 10; at a = 4, ramp 1, bit 0, answer 12; at a = 3, ramp 2, bit relu(−1) = 0, answer 12.
   The marble is pushed to 4.5 *under the grid tag*: bit 0.5, answer 11 [TE07]. The validator's error line is
   shown as a monospace **label without quotation marks** (it is a code string, not a `quotes.json` span).
   Q029 is spoken: "Declarations are promises from the caller, not proofs." **The refrain in full.** Tag 4
   lasted one evaluation.
6. **No promise at all: the lens train (3:00–3:40).** Remove the tag and the machine has to tell 4 from anything
   above it with no help. A hairline of light, the difference `a − 4`, passes through **six lenses** (×2^14, then
   ×2^24 five times), each followed by a stop at height 1, then a seventh stage, `relu(1 − 2^15 · stage)`, and a
   flip [TE08]. The scales multiply to **2^149**, the gap from the smallest FP32 number to 1, so any nonzero
   difference becomes a full notch. On screen: **16 operations in 15 layers.** At 4.5 the answer is correct:
   **10**. Q033 is on screen.
7. **The lesson (3:40–4:00).** The two machines stand side by side, 16 operations against 2: one honest sentence
   about your input is worth fourteen operations [PR12]. The narrator closes on the teaching line: "Every `if` is
   a dimmer switch, and the program's whole job is to make sure it's only ever fully on or fully off" (narrator's
   own words, after the bible's intuition in §5.1).
   *Claims:* TE01–TE11, TE15, PR12, PJ19. *Quotes:* Q003, Q004, Q029, Q033, Q082.

### Deep Dive II · The Clockwork That Cannot Stop (host loop + patterns + springs) · 4:00, ~380 words

*Machine:* **the host clockwork** (art dept 11), with the spring step stamp (12), the squaring press (13) and,
for the patterns, four small companion machines that hang off the clockwork's arms: the counting rail (15), the
prefix loom (14), the rank board (17) and the K-slot rack (18).

**Part A, the loop (0:00–2:20).**
1. **The thesis (0:00–0:20).** Q015 is set in type across a parchment plate and read slowly: "The program runs
   every operation on every frame and can't stop early, so a loop becomes a count, a tree, a table, or the same
   work on every item." Those four nouns become the four arms of the clockwork.
2. **One turn of the clock (0:20–1:00).** A paper hand taps; a token stamped with a time drops into a tray
   (Q026, "Event handlers only queue events with their timestamps."). The escapement ticks. JavaScript plans the
   evaluations, writes the inputs into the source table's pigeonholes, the program runs once, the next-state cards
   are **copied back** into the table, and the outputs move paper windows [HL02–HL06, Q018]. When nothing is
   animating, the clock stops, and idle costs nothing (Q027).
3. **Springs without loops (1:00–1:40).** Q024 is on screen. The stamp: a 2×2 brass plate, **0.99536 | 0.00352 /
   −1.16 | 0.88** [SP02]. A window at 400 heading for 700: cards −300 and 0 go in, and **−298.608** and **348**
   come out [SP03], checked on the plate as 0.99536 × −300 = −298.608 and −1.16 × −300 = 348. The squaring press
   folds the plate onto itself, so 300 steps take eight squarings (300 is 100101100 in binary). JavaScript does the
   folding in float64, and the program applies the result with **14 operations in 3 layers for any step count**
   (Q046, which pays off the "fourteen operations" plant). Q045 is on screen: stiffness and damping never enter
   the program.
4. **The ratchet at 300 (1:40–2:00).** The ratchet has 300 teeth. Past tooth 300 the pawl releases, every window
   **snaps** onto its destination with zero velocity, and the backlog is dropped [HL08, Q049]. A two-sided label:
   this is a design choice; other guides carry the remainder instead [HL27].
5. **Two tags filed (2:00–2:20).** **Tag 8:** springs stored absolute positions until 14 September, and far out
   they failed to settle (Q050) [SP10]. **Tag 7:** HandwiredOS ran one evaluation per frame until 15 September
   [HL17]. Both are struck and filed in the Ledger, each with a short lifespan. The payoff image: the same
   recorded session at **10 fps and 120 fps** on two paper desks side by side. In the familiar order they drift
   up to **359 px** apart [HL18]. In Handwired's order, in the repo's tests, they are identical in every bit
   (Q076, with the caption *while events arrive in order and no snap runs*) [HL11]. The narrator adds a quiet aside
   of his own (unquoted): the frame you see is a rehearsal, computed in full and thrown away [HL10, HL14].

**Part B, the four arms (2:20–4:00).**
6. **A count: findIndex (2:20–2:45).** The counting rail has pegs at 40, 80, 80, 140 and 180, with a pointer bar
   at 90. Three flags drop and the tally clicks to **3** [PT08]. Q066 is on screen: a JavaScript loop stops at the
   first failure, and this one can't, so it counts instead. The caption gives the condition: *the test must flip
   only once* [PT09].
7. **A tree: running totals (2:45–3:20).** The prefix loom takes tabs **3 1 4 1 5 9 2 6**; Brent-Kung joins them
   11 times in 4 levels to give **3 4 8 9 14 23 25 31** [PT15], and Sklansky does it in 3 levels with one tab
   fanning into four threads. Then the surprise: two plates showing the same four row heights summed two ways,
   **799.300048828125** and **799.2999877929688** (Q061, "Sums and products round in FP32, so the grouping is part
   of the result.") [PT03]. At 10,000 rows the "parallel" tree is the more accurate one: 0.26 px of drift against
   the loop's 5.67 [PT14]. Even-handed close: on the CPU the loop is still faster (Q062).
8. **The same work on every item: sorting without sorting (3:20–3:40).** On the rank board, keys **30 10 30 20**
   flip tiles in a 4×4 grid. The rows sum to **2 0 3 1**, and the cards slide to those slots without ever swapping
   (Q069) [PT16].
9. **A table, and a fixed maximum (3:40–4:00).** Reading one row of a 10,000-row table takes **30,002 operations**
   as arithmetic and **1** as an index read [PR17]. The K-slot rack: visibility bits 0 1 1 0 1 0 1 1 give counts
   0 1 2 2 3 3 4 5, and three slots take items 1, 2 and 4 [PT18]. A card says the capacity is fixed (Q072, which
   plants Monitor's "64 rows" for Chapter 8).
   *Claims:* HL01–HL18, HL27, SP01–SP03, SP10, PT02–PT03, PT06, PT08–PT09, PT14–PT18, PR17.
   *Quotes:* Q015, Q018, Q024, Q026, Q027, Q045, Q046, Q049, Q050, Q061, Q062, Q066, Q069, Q072, Q076.

### Deep Dive III · Unfreezing (gradients through a handwritten program) · 3:30, ~335 words

*Machine:* **the ReGLU valve** (art dept 23), which then multiplies into the gallery's two layers, plus the Huber
clamp (24) and the learned-gallery stage (22). The landscape changes for the first time: the misty-hills set,
with gradient descent as a traveller with a lantern on a real loss curve (kit `mistyHills`), here on the gallery's
loss chart.

1. **One valve, by hand (0:00–0:50).** Water (the value) flows through an opening of width `max(0, gate)`. The
   numbers are on a plate: w = 0.5, g = 0.25, b = −0.1, so the gate opens to **0.15** and y = 3w × 0.15 = **0.225**
   [DG01]. Then the flow runs **backward** (the lantern light reverses along the threads): the slope for w is
   **0.45**, and the slope for g is **1.5**. Turn b to −0.4: the gate is −0.15, the valve **shuts**, y = 0, and
   every backward arrow goes dark [DG11]. Q108 is on screen ("Without any decay, a unit whose gate has closed gets
   no gradient and stays shut").
2. **The rules on the loom (0:50–1:20).** Backward through a sum, each thread passes the gradient times its
   weight. Backward through a valve, the gate gets gradient only while it is open [DG01]. Q052 is read:
   "Backpropagation differentiates the intended real arithmetic, not literal floating-point rounding."
3. **Tag 12: fully differentiable? (1:20–1:55).** Tied on from the README tagline. The red pencil writes from
   *inside the repo*. Deep Dive I's dimmer switches are flat at whole numbers, slope zero, so a decision can't
   tell you which way to move [DG15]. Q110 is on screen: "That's the difference between "the backward pass runs"
   and "the gradient is useful"." The tag **stays hanging**, still contested. The film's framing: differentiable
   as real arithmetic, but the decisions are flat [bible §7.3].
4. **The gallery learns (1:55–2:55).** Twenty photo slots, **244 weights**, **6,320 operations in 8 layers**
   [DG04–DG12]. The photos start piled as tiny 0.18 squares and fan out to their rectangles over a second or two
   [DG06]. The Huber clamp: each photo edge pulls on a bias with a spring whose force caps at 0.08, so a photo far
   off pulls no harder than one 0.09 off. The narrator, in his own words: far-off photos vote; they don't shout
   [DG07, DG26]. The worked gradient for the left-edge bias appears as a formula plate: one fortieth of the sum
   over ten rectangles of the two clipped edge errors. Adam's first step moves the bias by about the learning rate,
   **0.5 → ≈ 0.492** [DG27]. Then the human beat: an easy fix that snapped photos to lines with ordinary code was
   offered and rejected. Cheng's words go on screen **verbatim, typo included**, as Q106, and the narrator reads
   Q107 aloud ("No code moves a rectangle or a photo onto a line: the photos line up only because training lowers
   the penalty.").
5. **Honest scope (2:55–3:30).** On a label, plainly: the gallery is a small generic network compiled as a
   circuit, not an unfrozen hand-written program [DG06]. True unfreezing (declaring a hand-written number a cell)
   is shown in the drag-knobs lab: 63.6% of drag frames solved in one step [DG20]. Then **tag 14**, a
   question-mark tag on a slack thread, carries Q011 verbatim ("attaching a specific frozen program to a generic
   neural net and train end-to-end (now a nanoGPT can do both Shakespeare and your particular UI?)"). The red
   pencil hovers, then lowers: nobody has tried it yet [DG22].
   *Claims:* DG01, DG03–DG13, DG15, DG20, DG22, DG26, DG27. *Quotes:* Q052, Q106, Q107, Q108, Q110, Q011.

---

## The ending

**Chapter 13 · Epilogue: One More Neuron (23:00–24:00, ~95 words) · dawnGold**

The Ledger's "Still open" drawer is still open from Chapter 12. The camera rises above it and out through a
window bay onto a **misty-hill landscape at dawn**. The copper thread from the first shot is strung across the
hills like a washing line, and on it hang **all fifteen tags**, every one measured against the Lifespan Rule laid
along the valley floor. The 1943 tag hangs far down the valley. Most Handwired tags cluster near the start of the
rule, a few weeks long, struck through in red. Tags 2, 11 and 12 still hang unstruck, their threads running off
the rule and glowing. Tag 14 hangs slack with its question mark.

The narration pays off Chapter 3's "why?". The narrator says the README answers it, in its own voice, and reads
Q010 verbatim: "unfreezing the weights and train them (what does that even do? Let's find out!)". Then he names
what the film has shown, in one sentence: a project that writes its promises on its wires, and its doubts in the
same notebook.

Final image: the camera returns to the HandwiredOS desk, and the copper thread settles under the dock [OS18]. In
the Notes window's real textarea, the last line of the to-do list sits under the cursor: **"Wire one more neuron
by hand"** (Q088). A paper hand ties one more blank tag onto the copper wire. The detent figure plays *tie* and
*flip*, the third stroke never comes, and the bar hangs into the haze.

- *Last line (narrator, level soft):* "Who tied it on, we know. Who will doubt it, we don't. It's still holding."
- *End card:* "As of 27 October 2026, `main` is still at `257856e`." [PJ17] Then credits, with sources on the
  shelf's `sources.json` and the plain tooling credit.

The ending is deliberately unresolved. Handwired is a project under five months old, public for less than a fortnight, with open
questions in its own ledger [LB26, PJ05, PJ11]. The honest ending is a tag still being tied.

---

## The emotional arc

| Beat | Feeling | Where |
|---|---|---|
| A child's line of code gives a wrong answer | **Curiosity**, a small itch | Prologue |
| Old men and old certainties; the thread splits | **Perspective**: beliefs outlive their evidence and still turn out useful | Ch 2 |
| A desk that is secretly a network | **Intrigue** | Ch 3 |
| Ramps really do compute `if`; the 11 explained | **Delight**, then **unease** (∞ → NaN, 16,777,222 → 8) | Ch 4 |
| A promise turns 16 operations into 2; 2^149 | **Wonder** at the engineering, plus the moral of trust | Ch 4 |
| More precision broke it | **Surprise** | Ch 5 |
| The wallpaper is the program; the GPU is slower | **Awe**, then a **puzzle** | Ch 6 |
| Fourteen operations for a second of physics; two desks identical in every bit | **Satisfaction**: the clockwork is beautiful | Ch 7 |
| Sorting without swapping; the "parallel" sum is the accurate one | **Playful astonishment** | Ch 7 |
| 100,000 documents per keystroke; a claim withdrawn in hours | **Exhilaration**, then **respect** | Ch 8 |
| A valve shuts and the learning dies; the snapping fix refused | **Tenderness**: the project wants to *learn*, not cheat | Ch 9 |
| Ten certainties struck; the checker shared the bug | **Humility**, the film's low point, cold blue | Ch 10 |
| Launch, critics, the 11 found by a stranger | **Exposure**, and a wry smile: the repo had already said so | Ch 11 |
| A failure rule written first, then honoured | **Resolve**: this is how a belief should die | Ch 12 |
| Dawn, the washing line, one more neuron | **Quiet warmth** and an open question | Ch 13 |

The arc is a **U with a high plateau**. The wonder builds through the three deep dives, the bottom is the
September reassessment, and the climb back is earned by method rather than by triumph. The narrator never gloats
over a broken belief. His tone at every strike is fond: these were reasonable promises, made by people (and
tools) working fast.

---

## Where curiosity is planted, and where it pays off

| Plant | Where planted | Pay-off |
|---|---|---|
| a = 4.5 gives **11** | Prologue | Ch 4 (corners; the grid promise) → Ch 11 (a Hacker News reader finds it by hand, and the hidden comment had said so) [TE03, PJ19, PJ27] |
| A blank tag on a copper thread | Prologue | The copper wire under the dock; the epilogue's washing line and the last tag [OS18] |
| A dozen blank tags on the title card | Prologue | The fifteen written tags at dawn |
| "why?" (Q132) | Ch 3 | Epilogue: Q010, the README's own answer |
| **8,388,609** inside `boolean(score)` | Ch 3 plate | Ch 5 detent: the odd start mark rounds 0.5 up [PR08] |
| The arc wallpaper | Ch 3 | Ch 6: one arc per weight, 9,909 [OS14] |
| Q038: two evaluators agreeing proves nothing | Ch 5 | Ch 10: the shared-bug checker (JS 3, compiled 4, zero mismatches) [LB08] |
| "So what is a GPU *for*?" (27× slower) | Ch 6 | Ch 8: 100,000 documents, one pass; and tag 9's hours-long life [Q090, JS21] |
| "Fourteen operations" (the cost never changes) | Ch 6 voice-over hint | Ch 7: 14 operations in 3 layers for any step count [SP01, Q046] |
| A fixed maximum (Q072) | Ch 7 | Ch 8: "Only 64 rows are drawn at a time." [Q074] |
| The closed valve stays shut | Ch 9 | Ch 9 end: weight decay of 0.0000002 keeps it alive [DG11]; and it echoes in Ch 10, where a tag stays shut until someone reruns the test |
| The tagline tag tied on without dissent | Ch 3 | Ch 11: its dissent was in the repo's docs from day one [Q014] |
| The "Still open" drawer | Ch 12 | Epilogue: it never closes |

---

## Five unforgettable images

1. **Eleven.** A marble halfway up a paper ramp, two conveyors still carrying 10 and 12, two shutters half open,
   and a tile reading **11** sliding out into the dawn haze. It is the film's question in one picture.
2. **The lens train.** A hairline of copper light, too thin to see, passes through seven backlit lenses, each
   magnifying it beyond the frame, until it floods the screen as a solid bar: **2^149**. A difference no one could
   measure becomes a decision no one can miss.
3. **Two desks, one bit.** The same recorded session on two paper desks side by side, one at 10 frames a second
   and one at 120. The escapements tick at different rates and the windows land in identical places, while a
   ghost of the familiar loop drifts 359 px away and fades.
4. **The wallpaper is the program.** The camera exits the matmul loom and turns, and the HandwiredOS wallpaper's
   9,909 copper and indigo arcs resolve into the loom's own threads. The decoration was the machine all along.
5. **The washing line at dawn.** Fifteen paper tags on a copper thread across misty hills, each hung at its
   lifespan on a ruler laid along the valley. Red strikes on most, glowing threads on three, a question mark on
   one, and a paper hand tying a blank one on as the light comes up.

*(Reserve image if one is cut:* the gallery's photos piled as tiny squares in the centre of a dark stage, fanning
out to their rectangles as the loss curve falls: learning, seen as unfolding.)

---

## Brief coverage checklist

| Brief must-cover | Where |
|---|---|
| What a program is: FP32 weighted sums, gated relu/reglu, boolean and indexRead; cells, wires, source table, builder code → `Circuit` | Ch 3; index read Ch 7 (step 9) |
| README `(a > 4) ? 10 : 12` by hand | Prologue, Deep Dive I |
| Both branches run; 0/1 selector | Deep Dive I, step 3 |
| Exactness in FP32: declared ranges, rounding points, `emitCompare` | Deep Dive I, steps 5–6; Ch 5 |
| One big matmul: fusion, sparsity; backends (JS CPU, WebGPU for JSON search) | Ch 6, Ch 8 |
| Host loop: inputs → evaluate → next state copied back → DOM; can't stop early | Deep Dive II, Part A |
| Loops as counts, trees, tables, same work on every item (findIndex, prefix, sort, filter + slice into K) | Deep Dive II, Part B |
| Springs and time | Deep Dive II, steps 3–5 |
| Three demos (HandwiredOS, learned gallery, JSON search over 100,000 docs per keystroke) | Ch 8, Ch 9 |
| Differentiability: unfreezing, training end to end | Deep Dive III |
| What the lab explored and what's still open | Ch 10, Ch 12, Epilogue |
| Deep dives (1) ternary → relu, (2) loops and state, (3) gradients | Ch 4, Ch 7, Ch 9 |
| Optional context (McCulloch & Pitts; compiling programs into networks), brief and verified | Ch 2 (1.5 min), labelled as framing; Tracr's Q149 and the repo's Q127 chain-of-thought comparison can join Ch 2 or Ch 6 as one line each |
| Debates, fair and two-sided | "Regular JavaScript" (Ch 3 → 11), "exact" (Ch 4–5), "fully differentiable" (Ch 9), GPU speed (Ch 6, 8), trees vs loops (Ch 7), snap vs carry (Ch 7), trained vs hand-written recovery (Ch 12), learn vs compile (Ch 2), neurons as logic (Ch 2) |
| AI labs even-handed, including Anthropic | Ch 10, one neutral sentence (Claude Code, Codex, and this film made with Claude) |
| Geopolitics | Not applicable per bible §9; the RAND memo is shown as a prop with no comment |

---

## Guardrails this treatment commits to (for the script writers)

- **Quote integrity.** Every span in quotation marks is a verbatim `quotes.json` text or a verbatim substring of
  one, with its original typos and casing (Q103 "plz", Q106 "alignemtn", Q132's spacing), and is kept in `spoken`.
  The following are **paraphrases and must never appear in quotation marks**: the July briefs' heading ("take
  these as given" is not in quotes.json), "clearly faster", the validator's error string, "dress rehearsal", "far
  off photos vote, they don't shout", "the whole trick". Q121 is quoted whole or not at all. Never edit
  `research/quotes.json`.
- **Attribution.** Repo prose is "the docs" or "the README", not Cheng. Cheng is quoted only in Q099–Q106 and his
  launch post Q104. The reassessment's words belong to its unnamed writer (an AI agent's review by its own
  account). The July beliefs belong to "the July briefs", never to Cheng. Hacker News critics are "a Hacker News
  commenter".
- **Likeness.** Cheng appears as hands only. The coding agent is a second paper hand with no face and no words.
  Living researchers are text cards. McCulloch and Pitts appear as profile silhouettes from the bible's notes;
  Kleene and von Neumann are generic period figures.
- **Numbers with their conditions.** Timings carry date and machine and are never compared across machines.
  Bit-identity is always "in the repo's tests" and "while events arrive in order and no snap runs". The 0/20
  report is "an earlier report", never "in July". The merge is "about 240 commits".
- **Do-not-use list honoured:** no "neural nets are probabilistic" line, no "held by most programmers", no
  "Handwired runs on the GPU" unscoped, no "a = 4.5 under `emitCompare` is always wrong" (only under a false
  grid; the cascade gets it right).
- **For the ear.** Short sentences; numbers spoken naturally ("two to the hundred and forty-ninth", "about
  twenty-seven times slower", "four and a half"); symbols and code on screen, not in the voice. `ReGLU` is spoken
  "reg-loo", `FP32` "F-P thirty-two", `matmul` "mat-mul", `relu` "ray-loo" (lexicon to confirm at casting).
- **Narrator.** An unnamed, distinguished British man in his forties or fifties, warm, wry and precise, who is
  never named and never a real person's voice, and whose voice differs from the three already in use (brief).
  He treats every broken belief with affection, never with scorn.
