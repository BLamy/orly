# Final treatment: *Promises, Not Proofs*

# HANDWIRED
### Promises, Not Proofs

*Subtitle card:* **How a program becomes a hand-wired neural network, told in the things people were sure of.**

- **Film:** `handwired-explained` · **24:00** · **2,280 narration words** (95 words per film minute on average; the deep
  dives run thinner so their machines can work in silence) · silhouette / paper-cut theatre · 12 chapters · 101 shots
- **Sources:** `research/bible.md`, `research/claims.json`, `research/quotes.json` only. Claim ids in square brackets,
  quote ids `Q###`. Subject pinned at `chenglou/handwired@257856e`, as of 27 October 2026.
- **Written by:** Claude Opus 5.5 (high effort), head writer. Base: the judges' winner, the **beliefs** treatment
  (`story/treatments/beliefs.md`), with grafts from **mystery** and **people** listed in §12.
- **Companion files:** `story/outline.json` (chapters and shot skeletons), `story/meta.json`, `story/cast.json`.

> **Scope.** The brief overrides the history-film checklist: *the film is about Handwired, not a history*. The
> history (1943 to 2019) is 1.5 minutes of framing, labelled on screen as framing, and every historical tag carries
> the visible mark that the repo cites none of it [FR22]. The three deep dives are the brief's: (1) the ternary as
> ReLU arithmetic, (2) loops and state as fixed-size arithmetic, (3) gradients through a handwritten program. AI labs
> get one plain sentence (ch08). Geopolitics does not apply (bible §9).

---

## 1. Logline

Handwired lets you write a JavaScript interface as builder code that becomes a neural network with every weight
written by hand. The network runs every operation every frame, cannot stop early, and matches JavaScript exactly, as
long as nobody lies to it. The film teaches how it really computes (two ramps for every `if`, a clockwork for every
loop, a valve for every gradient) through the beliefs tied onto its wires like paper tags: who tied each one on, who
doubted it, and how long it held. Along the way it meets a lab that writes its doubts beside its certainties, and
breaks them on a schedule.

## 2. The angle in one paragraph

Most explainers tell you how a thing works. This one tells you **what people were sure of while they built it, and
what happened to each certainty.** Handwired suits this unusually well, because its repository keeps the belief and
the doubt in the same place. The README promises "exact", and a hidden comment on the landing page admits the case
where it isn't [PJ19]. The tagline says regular JavaScript, and the docs say no tool converts it [Q001, Q014]. The July
briefs listed conclusions to take as given, and a September reassessment struck ten of them out [LB02, LB03]. A GPU
write-up called the GPU the faster one, and a review withdrew that the same day [JS21]. The lab's last experiment
before the pin fixed its rule for failure *before* it ran, then reported the failure [LB23, LB25, Q123]. The viewer
learns the machine at the moments its promises were tested, because that is where the arithmetic shows: at 4.5, at
2^24, at 300 steps, at a closed gate. And the viewer learns the larger lesson. In this project knowledge moves fast,
in writing, by checks that are allowed to fail. The viewer's own first guesses are tested too: the three suspects
tied on in the prologue are beliefs like any other.

---

## 3. Recurring devices

The structural rule (from the judges): **four devices, no more**, plus two spoken refrains. They always look and
sound the same, so that by Deep Dive I the audience can read a belief's whole life at a glance.

### Device 1 · The Promise Tags on the copper line, over the Lifespan Rule (the spine)

**The line.** A single **copper wire**, strung across the frame at about 58% of frame height (the backlight's peak).
It is the "one copper wire under the dock" of HandwiredOS [OS18], and the film's first and last image. Every belief
hangs from it as a **paper tag**. The tag style comes from the repo's own declarations ("0..16,384", "grid 1/64",
"one-hot") [PR11, EX04]: in Handwired a promise is literally something you write onto a wire, and the machine trusts
it.

**A tag has four parts:**
- **Front, in ink:** the belief, as an on-screen paraphrase (never in quotation marks unless it is a verbatim
  `quotes.json` span).
- **The knot** (top eyelet, where it ties to the line): **who tied it on.** Holders are small typeset name cards
  threaded through the eyelet ("McCulloch & Pitts, 1943", "the July briefs", "the README"). **The empty-knot rule:**
  when the bible names no holder, the eyelet stays visibly empty, and the narrator says so once. Two of the three
  suspects have empty knots: they were our guesses, not anyone's in the record.
- **Back, in red pencil:** **who doubted it.** The tag flips (a paper snap) and the **red-pencil hand** writes the
  dissenter's name and one word or number. A broken belief is **struck through once** in red. A belief that is
  confirmed or kept gets a **copper rivet** punched through its corner (a dry clack). A contested belief stays
  hanging, with the red pencil resting beside it.
- **The signature grommet** (a small brass ring at the lower corner): **did the repo itself sign it?** A **stamped**
  grommet means the repo names this idea in its own code or docs; an **empty** grommet means it does not. Grommets
  appear *only where the bible settles the question*: empty on the 1943 and 1951 tags and the 1990s card ("not cited
  by the repo" [FR22]); stamped on the two name tags on the prefix loom in Deep Dive II, *SKLANSKY 1960* and
  *BRENT · KUNG 1982*, which are function names in `prefix-networks.ts` [PT05, PT26]. Everywhere else, no grommet is
  drawn. The narrator states the rule once (ch02) and pays it once (ch06): "These two old names are signed into the
  runtime itself."

**The Lifespan Rule.** Along the bottom of every tag shot runs a long paper ruler with copper ticks at *an hour · a
day · a week · a month · a year · a decade · a lifetime*. Each tag's thread drops to its lifespan from the bible. The
ruler is logarithmic, and the narrator explains it **once, in plain words, for the ear** (ch02-s06): *"The ruler is
stretched so that an hour and a lifetime both fit: each mark is a much bigger jump than the last."* The 1943 tag
hangs near the far end; almost every Handwired tag hangs in the first few centimetres. **Knowledge inside this
project moves in days.**
- A **frayed thread end** = the start or end date is interpretive in the bible.
- A thread that **runs off the end of the rule, glowing faintly copper** = still held as of 27 October 2026.
- A **slack thread with a question mark** = an aspiration nobody has tested yet.
- **Suspect tags hang on slack threads** until they are tested: nobody in the record held them, so there is no date
  to measure. When struck, the narrator measures them in the film's own time ("That guess was ours. It lasted about
  three minutes.").

**The tag registry: eleven tags and one blank** (cut down from fifteen; no sub-tags).

| # | Front (paraphrase on screen) | Knot: tied on by | Back: red pencil | On the rule | Tied · settled | Claims |
|---|---|---|---|---|---|---|
| 1 | The neuron is a logic gate | McCulloch & Pitts (1943); von Neumann adopts it (1945); Kleene keeps it, "close to the biological reality" (1951) | Kleene finds a part "obscure" (1951); the 1959 frog paper (by the same two men; reading it as dissent is later interpretation); graded dendritic spikes (2020) | **Splits at the knot:** as biology, frayed, about sixteen years; as engineering, off the rule and glowing (automata theory, the stored-program computer) | ch02 · ch02 | FR01–FR12 |
| 2 | Learn the weights; don't write them | Sutton (2019) | Brooks (2019) | 2019 → still held, glowing; dominant, not consensus | ch02 · open | FR20 |
| 3 | **Suspect:** somebody trained it | **empty knot** (our guess) | the HandwiredOS README (Q085) | slack; struck after about three minutes of film | ch01 · ch03 | OS01 |
| 4 | **Suspect:** a tool turned ordinary JavaScript into it | the README's tagline (Q001); later, a Hacker News reader | the repo's own docs (Q014), on the docs' first page; a Hacker News commenter (Q130) | struck at once: **the doubt is in the same box as the promise** | ch01 · ch03, re-read ch10 | PJ01–PJ03 |
| 5 | **Suspect:** it isn't really a network | **empty knot** (our guess) | the loom itself: layers of weighted sums with ReLU gates (PR04) | slack; struck at the loom | ch01 · ch05 | PR04, CM01 |
| 6 | (a > 4) ? 10 : 12, small print: *For an integer a* | the README example (Q003) | the landing page's own hidden comment, already there at launch; a Hacker News commenter, 23 October | kept, glowing, **copper rivet**: a promise that states its limits. Public nine days before a stranger tested it | ch01 · ch04, ch10 | TE01–TE07, PJ19, PJ27 |
| 7 | One evaluation per frame is enough | HandwiredOS's own design | events at their timestamps; a frame's moves had collapsed into one | frayed start → 15 Sept 2026, about three months | ch06 · ch06 | HL17 |
| 8 | Established conclusions: take these as given (label, never quoted) | the July briefs, from an unnamed design conversation (**not Cheng**) | the 3 September reassessment (an AI agent's review, by its own account): **ten short red strokes** on the back, one per retired claim | 8 July → 3 Sept 2026, about eight weeks | ch08 · ch08 | LB01–LB05, LB08 |
| 9 | The GPU is the faster one (for the highlighter half) | the first JSON-search README, 13 Oct, 09:01, already hedged | a review the same day | **hours: the shortest thread in the film** | ch09 · ch09 | JS21 |
| 10 | Fully differentiable | the README's tagline (Q001) | from *inside* the repo: the decisions are flat (Q110) | 14 Oct → still contested, glowing. A **question-mark tag on a slack thread** hangs from it: Q011, nanoGPT, not attempted | ch07 · open | DG03, DG15, DG22 |
| 11 | Gradient descent can fill a parser's unused entries | the recovery experiment, **with a second card on its knot: the rule for failure, written before the run** | its own pre-set rule: TOML fails | about two days, 15 → 16 Oct. A **border tag**, cut along a dotted line: JSON half kept (rivet), TOML half struck by its own rule, bison thread ending in an open loop | ch11 · ch11 | LB19–LB25 |
| · | (blank) | the narrator's hands, in the last shot | — | — | ch12 | OS18 |

### Device 2 · The Window Calendar (the project's own time)

The repo's commit history as a tall paper building at night: **one lit pane per commit**, one column per month
[PJ09]. **June: 72. July: 6. August: entirely dark, with snow on the sill. September: 58. October: 689, with 683
crowded into four columns for 13 to 16 October (242, 200, 113, 128), panes lit in every hour of the clock.** Binding:
pane ← commit, exact counts, never rounded. It appears five times:
- **ch03:** the first pane lights at **3 June 2026, 20:24** (*Create numeric UI atom lab*), and a second fourteen
  minutes later [PJ05]. A nameplate is re-lettered: *Numeric UI Atom Lab* (three days) → *Indirect* (four months) →
  *Handwired* (6 October) [PJ07].
- **ch08:** July's six panes; **the dark August**, with the narrator's one honest line: *"The record doesn't say why.
  So we won't guess."* Then the grey dawn of 3 September, and September's 58 panes relighting.
- **ch09:** the October blaze, match-cut into the JSON search map filling with copper cells.
- **ch12:** *no new panes after 16 October*; the end card: "As of 27 October 2026, `main` is still at `257856e`."
  [PJ17]

### Device 3 · The X-ray desk (the most wondrous object, revealed early and filled in)

HandwiredOS is revealed in the **prologue**: the desk, the window that glides and settles, Monitor's sidebar
*State 234 · Operations 4,646 · Outputs 493*, then the camera passes *through* Monitor into the wallpaper's 9,909
arcs, one per weight [OS02, OS12, OS14]. Then, at the end of chapters 3 to 7, the desk returns for **4 to 6 silent
seconds** (a relay clack, no narration), a little more translucent each time, with **one more real component lit
inside it**:

| After | Lit inside the desk | Claims |
|---|---|---|
| ch03 | the source table: 234 pigeonholes | OS02 |
| ch04 | ReGLU ramps and 0/1 shutters: 2,776 gates, 59 detents | OS02, EX08 |
| ch05 | the loom: 130 thin frames | OS02, CM01 |
| ch06 | the host clockwork's ratchet | HL08 |
| ch07 | **a single valve, drawn dark**, with the film's only X-ray line: "The desktop has none of this switched on. Not one of its weights is trained." | Q085, PJ20 |
| ch12 | the desk plain and warm again; the copper wire under the dock is the last light in frame | OS18 |

Only components HandwiredOS really has are lit. It has no gathers or index reads [OS02], so the X-ray never shows
the index drawer.

### Device 4 · The score: the both-branches gate and the detent figure

Machines **clack, never chime** (brief). Two musical ideas, one per half of the film's argument:
- **The both-branches motif.** Two melodic lines a **whole tone apart always play**. A gain gate of exactly **0 or 1**
  chooses which one we hear: the score *is* a select [TE10]. At **a = 4.5** (ch01, ch04) the gate sits at **0.5** and
  both lines sound at half level, a slightly wrong, unresolved interval: **the musical eleven**. In the finale the
  gate opens on every column of the re-hung line in turn, and on struck tags it closes to 0 while the line keeps
  playing underneath (the struck branch ran too).
- **The detent figure** (the tag's life, on woodblock and ratchet): *tie* (a soft detent click), *flip* (a
  paper-card snap), *strike* (a dry pencil scratch resolving into a wooden drawer closing). **A belief still held
  leaves the third stroke unplayed, and the bar hangs.** Under Deep Dive II the figure slows into the host
  clockwork's escapement (an even, patient tick on a 4 ms idea, slowed for the ear). For the **two beliefs still
  contested at the end** (tags 2 and 10), the detent's missing third stroke is replaced by the both-branches gate
  at 0.5: both lines held at half level, undecided.
- Cold stretches (ch08's dark August) drop to one sustained low note and room tone. The October blaze (ch09) is the
  only stretch with a driving pulse; it cuts to near-silence when tag 9 is struck, then resumes lighter.

### The spoken refrains (the narrator's own words; never in quotation marks)

- **"Who tied it on. Who doubted it. How long it held."** Spoken in full three times: ch01 (as the film's promise),
  ch04 (at the false grid, after Q029), ch08 (over the ten strikes). Elsewhere it shortens to one clause ("It held for
  hours."). The epilogue turns it: *"Who tied it on, we know. Who will doubt it, we don't."*
- **"Hang that on the line."** The plant refrain (the beliefs-film version of mystery's "Put that in the file"),
  used **four times only**, each paid off later:
  1. ch01, introducing the three suspects ("Hang them on the line. We'll test every one.") → ch03, ch05.
  2. ch02, Kleene's finite machine: anything unbounded, like time, has to come from outside → ch06-s12 (the host
     turns the crank).
  3. ch03, the Notes window: "The program holds no text." (Q087) → ch05-s05 (the loom sheds its threads).
  4. ch05, the cold furnace: "So what is a GPU for?" → ch09-s03 (Q090, 100,000 documents).
  Two further plants are **silent** (on screen, no refrain): **8,388,609** on ch03's four-instructions plate (paid
  ch04-s12) and **Q038** on a plate at the end of Deep Dive I (paid ch08-s05).

---

## 4. Voice of the narrator

An unseen, unnamed narrator: a distinguished British man in his **forties or fifties, not elderly**; measured, warm,
wry, curious and precise; a teacher who loves a good mechanism and enjoys being caught out by one. Never a real
person, never an imitation, and a different voice from every film already on the shelf (`MlHIkPdx2ZF9MhznglHQ`,
`EapdDtSsMC291mjfSNe7`, `cjVigY5qzO86Huf0OWal` are taken). He treats every broken belief with affection, never scorn:
these were reasonable promises, made by people (and tools) working fast. He never claims to know anyone's motives;
when the record is silent, he says so. First person only as a guide ("Hold that number"; "Hang that on the line").

**Writing for the ear.** Short sentences. One idea per sentence. Numbers spoken the way a person says them ("four and
a half", "nine thousand, nine hundred and nine", "two to the hundred and forty-ninth", "about twenty-seven times
slower"); exact figures and symbols go on screen, not in the voice. No strings of acronyms: say "thirty-two-bit
floats" rather than "FP32" where it reads naturally. Code is shown, not read aloud, except the one ternary.
Quotations are read as quotations, with the quotation marks kept in `spoken`. British spelling outside quotation
marks (*centre, recognise, optimiser, aluminium*); quoted text keeps its source spelling exactly.

**Lexicon (to confirm at casting):** ReLU "RAY-loo" · ReGLU "REG-loo" · matmul "mat-mul" · Kleene "KLAY-nee" ·
Pitts · Sklansky "sklan-skee" · Brent-Kung "Brent and Kung" (KOONG) · Bun "bun" · `257856e` is never spoken.

**Ten sample lines that set the tone** (narrator's own words; drafts for the chapter writers):
1. "Here is a line of JavaScript a child could check."
2. "Give it four and a half." *(a long breath)* "Eleven. A number neither branch contains."
3. "The machine isn't broken. It was built for whole numbers, and it took that on trust."
4. "A ramp is all a ReLU is: flat, then up."
5. "Every *if* here is a dimmer switch. The program's whole job is to keep it fully on, or fully off."
6. "One honest sentence about your input saves fourteen operations."
7. "Two steps or three hundred, the network pays the same fourteen operations."
8. "That guess was ours. It lasted about three minutes."
9. "Far-off photos vote. They don't shout."
10. "The record doesn't say why. So we won't guess."

And the line the whole film turns on is not his: it is the docs' "Declarations are promises from the caller, not
proofs." (Q029), spoken in ch04 as the emotional climax of Deep Dive I.

---

## 5. Chapter list (24:00 · 2,280 words · 101 shots)

| # | Chapter | Starts | Min | Words | Shots | Mood (opening → closing) | Tags |
|---|---|---|---|---|---|---|---|
| ch01 | Four and a Half | 0:00 | 1.75 | 155 | 8 | parchment → candleAmber | 3, 4, 5 tied (suspects); 6 tied |
| ch02 | The Oldest Tags (1943 → 2019, framing) | 1:45 | 1.50 | 140 | 6 | candleAmber → duskRose | 1, 2 |
| ch03 | A Recipe Read Every Frame | 3:15 | 1.50 | 145 | 7 | winterBlue (night calendar) → parchment | 3 struck, 4 struck |
| ch04 | **Deep Dive I: Promises, Not Proofs** | 4:45 | 4.00 | 380 | 16 | parchment → duskRose | 6 (re-tied as *grid 1*) |
| ch05 | One Big Matmul | 8:45 | 1.50 | 140 | 7 | serverCyan → emberRed | 5 struck; GPU planted |
| ch06 | **Deep Dive II: The Clockwork That Cannot Stop** | 10:15 | 3.50 | 340 | 13 | candleAmber → labGreen | 7 |
| ch07 | **Deep Dive III: Unfreezing** | 13:45 | 3.25 | 315 | 12 | dawnGold → duskRose | 10 (+ the nanoGPT question) |
| ch08 | The Summer's Certainties | 17:00 | 1.75 | 170 | 8 | winterBlue → dawnGold | 8 |
| ch09 | Four Days in October | 18:45 | 2.00 | 200 | 8 | emberRed → serverCyan | 9 |
| ch10 | Strangers with Pencils | 20:45 | 0.75 | 85 | 4 | duskRose | 4 re-read, 6 flipped, "why?" hung |
| ch11 | The Rule Written First | 21:30 | 1.00 | 95 | 5 | winterBlue → dawnGold | 11 |
| ch12 | One More Neuron | 22:30 | 1.50 | 115 | 7 | dawnGold | all re-hung; the blank |

Deep Dives take **10.75 of the 24 minutes**, and Deep Dive I starts at **4:45**. The framing history takes 1.5 minutes
and carries the on-screen caption *context: the repo cites none of this work* [FR22].

---

## 6. The first 60 seconds, shot by shot

Sound: paper room tone, one relay clack per cut, no music until 0:20, when the both-branches motif enters on two muted
lines a whole tone apart. About 95 words in the first minute. Timings are targets; the locked clock comes from the
narration.

**ch01-s01 · 0:00–0:07 · scene · parchment · transitionIn fadeBlack.** Black, then haze. A single copper thread draws
itself left to right like a slow fuse, catching rim light, and at 0:05 resolves into **the copper wire under a paper
dock** [OS18]. One relay clack as the wire completes. *No narration.*

**ch01-s02 · 0:07–0:19 · scene · parchment.** Wide: the HandwiredOS desk as a toy theatre. Warm paper-beige desktop
with a faint dot grid; three paper windows (Monitor, Notes, Photos) with serif titles, hanging by fine threads; a
dock of three white tiles; Photos shows a 4×3 grid of twelve landscapes; Notes holds a short handwritten-looking
to-do list (its last line out of focus: planted for the very end). A paper hand presses Photos' title bar and drags;
the window glides after it and settles on release [OS01, OS15, OS16, OS18].
- **L0101** "Here is a small desktop. Three windows, a dock, and twelve photographs."
- **L0102** "Drag a window, and it glides, and settles."

**ch01-s03 · 0:19–0:30 · scene · candleAmber (lamp change on the push).** A slow push into Monitor. Its sidebar reads,
in the window's own type, *THIS PROGRAM · State 234 · Operations 4,646 · Outputs 493*; the footer *130 layers ·
9,909 weights* [OS02, OS12, PJ20]. (Do not show the footer's byte count: it is on the do-not-use list's side of the
line.) The both-branches motif enters.
- **L0103** "Every move it makes is worked out by one neural network, and this window is showing you that network, live."

**ch01-s04 · 0:30–0:41 · scene · candleAmber.** The camera passes *through* Monitor into the wallpaper: hundreds of thin
semicircular arcs, mostly copper, some grey-blue indigo, one per stored weight [OS14]. Multiplane dolly; the arcs part
like threads on a loom. A label fades in on the beat: *copper adds · indigo subtracts*.
- **L0104** "Even the wallpaper is drawn from it: one arc for every weight. Nine thousand, nine hundred and nine."

**ch01-s05 · 0:41–0:58 · scene · candleAmber.** Pull back out of the wallpaper to find the **copper line** strung across
the dark in front of the desk. Three blank tags swing in. The narrator's hands tie them on, one per guess, inking the
fronts: *Somebody trained it* (empty knot) · *A tool turned ordinary JavaScript into it* (knot: the README's tagline,
Q001, on a tiny card) · *It isn't really a network* (empty knot). Each tie lands on the detent's *tie* stroke. The
threads hang slack: no lifespan yet.
- **L0105** "So where did those numbers come from? You might have three guesses."
- **L0106** "Somebody trained it. A tool turned ordinary code into it. Or it isn't really a network at all."
- **L0107** "Hang them on the line. We'll test every one." *(pauseAfter 0.8)*

*(The minute then continues into ch01-s06, the ramps and the eleven, then the tag, the refrain and the title; see §7.)*

---

## 7. Chapter by chapter

Claim ids in brackets; quotes by `Q` id. Narration fragments are drafts for tone. **Inside quotation marks, text is
verbatim from `quotes.json`.** Labels and paraphrases are never put in quotation marks.

### ch01 · Four and a Half (0:00–1:45 · 155 words · 8 shots)
s01–s05 as §6. Then:
- **s06 (plate → scene, parchment).** The README's line on a parchment plate, `const result = (a > 4) ? 10 : 12`
  [TE01]. Two hinged black boards rise from it (flat, then a 45° climb, corners at 4 and 5), a lever between them.
  Behind, two conveyor arms carry **10** and **12** tiles, always moving. The marble rolls to 5: a **10** drops. To 3:
  a **12**. A hand sets it at **4.5**: the lever stops halfway, both shutters stand half open, and with a heavy clack
  a tile slides out that neither belt carried: **11**. The score's gate sits at 0.5. 1.6 s of silence; only the haze
  moves [TE02, TE03, TE11].
  "Here is a line of JavaScript a child could check. If a is more than four, ten. If not, twelve." · "Build it from
  ramps, the parts a neural network is made of. Give it five: ten. Give it three: twelve." · "Give it four and a
  half." · "Eleven." · "A number neither branch contains."
- **s07 (scene, candleAmber).** Tilt up to the line: a fourth tag turns and inks itself `(a > 4) ? 10 : 12`, and
  below in quarter-size type the README's own small print, as a verbatim span of Q003: "For an integer a". The
  red-pencil hand enters, stops at the tag's edge, and does **not** write. The Lifespan Rule fades up along the
  bottom, empty.
  "The machine isn't broken. It was built for whole numbers, and it took that on trust." · "This film is about
  promises like that one: who tied them on, who doubted them, and how long they held." (refrain, first full use)
- **s08 (card, candleAmber → parchment · inkBleed).** More blank tags slide in along the line from the dark, a
  dozen, unwritten (the epilogue's washing line, planted). The title in ink on parchment: **HANDWIRED**, then
  *Promises, Not Proofs*, then the subtitle card. The detent plays *tie, flip*, and the bar hangs with no *strike*.
  No narration; minDuration 7.

### ch02 · The Oldest Tags (1:45–3:15 · 140 words · 6 shots) · framing only
The caption *context: the repo cites none of this work* [FR22] stays in a corner for the whole chapter.
- **s01 (scene, candleAmber, 1943).** A slow pull from the copper line to a far older one strung across a 1940s study
  in Chicago: a gothic window bay, a desk lamp, a page of arrow-and-loop net diagrams. Two profile silhouettes tie on
  **tag 1** (McCulloch, full beard, three-piece suit; Pitts, small and slight, round spectacles, per the bible's
  secondary appearance notes; never caricatured). *Bull. Math. Biophysics 5:115–133 · December 1943* [FR01, FR02].
  Q133 is read in full. Its signature grommet hangs **empty**.
- **s02 (plate, candleAmber).** Paper lanterns with wicks: two lanterns feed a third whose wick catches only when both
  glow (AND); lower the threshold ring a notch and one is enough (OR). A small card: von Neumann's 1945 EDVAC report
  modelled its elements on these neurons [FR06]. A plate lists what the units were **not**: weighted sums with real
  weights, or anything that learned [FR03, FR05]. "Their wiring never changed. Nothing in them learned. Someone chose
  every connection, by hand." (planted; paid ch07-s03)
- **s03 (scene, winterBlue, 1951).** A generic 1950s academic at a typewriter, the 98-page RAND memo stacking up
  [FR07]. The tag flips; the red pencil writes **Kleene · "obscure"** (a verbatim word from Q139; the card may carry
  the longer substring "we found the part of their paper which treats of arbitrary nets obscure"). But he kept the
  model: Q141's substring "close to the biological reality" sits on his knot card. A clock dial with a fixed ring of
  stops: "Kleene proved such a net is a finite machine: a fixed number of states, stepping once per tick of a clock.
  The patterns it can recognise, he called regular events. Anything unbounded, like time itself, has to come from
  outside. Hang that on the line." (plants for ch06-s12 and ch09-s04)
- **s04 (scene, labGreen, 1959 → 2020).** A frog before a silvered aluminium hemisphere, a dull black disk moved by a
  magnet from outside [FR10]; generic lab silhouettes far back. Q142's substring "the eye speaks to the brain in a
  language already highly organized and interpreted" on a card (American spelling kept). Fairness, aloud: the paper
  was written by the same two men, and reading it as a refutation came later [FR11]. A 2020 card: single human
  dendrites compute an XOR-like function with graded spikes [FR12]. **The thread splits at the knot:** as biology it
  frays out at about sixteen years; as engineering it runs off the rule, glowing.
- **s05 (card, duskRose, 2019).** **Tag 2** on a younger thread: Sutton's Q152 on the front, Brooks's Q154 on the
  back, equal light. Narration: in 2026, learning the weights is the dominant view, not a consensus [FR20]. The third
  detent stroke is withheld.
- **s06 (scene, duskRose → parchment).** Pull out to the whole line and the Lifespan Rule. The one plain explanation
  of the ruler (see Device 1). Then the echo, carefully worded as echo and not lineage: "Eighty-three years later,
  someone wrote a network's weights by hand again. Not from that paper: the repo never mentions it. But the shape is
  the same." [FR22]

### ch03 · A Recipe Read Every Frame (3:15–4:45 · 145 words · 7 shots)
- **s01 (scene, winterBlue night).** The Window Calendar: one pane lights, *3 June 2026 · 20:24 · Create numeric UI
  atom lab*; a second pane fourteen minutes later [PJ05]. The nameplate re-letters: *Numeric UI Atom Lab* → *Indirect*
  → *Handwired* [PJ07]. Inside the lit pane: a lamp, a laptop with no logo, a pair of paper hands, and **a second
  paper hand beside them at the keyboard**, glimpsed and not explained (paid ch08-s07).
- **s02 (plate, parchment).** The tutorial's definition, Q016, read in full. The **builder ribbon**: operation tags
  appended one by one, each pinned one column right of its deepest input; a duplicate expression gets back the tag
  that already exists [CB05, PR01]. Q017 on screen: you write builder code, not the list.
- **s03 (scene, parchment).** **Tag 4 struck.** The red pencil writes the docs' line on its back, Q014: "No tool
  converts existing JavaScript source into a program." Narration: you rewrite the logic yourself, by hand, as
  JavaScript that builds the network (the film's stance, bible §7.1) [PJ02]. "The doubt is in the same box as the
  promise: on the first page of the docs."
- **s04 (plate, parchment).** **The source table** for the template's toggle switch: a strip of **20 numbered
  pigeonholes**, 1280 and 800 in slots 0 and 1, event flags that pop to 1 and fall back to 0, a four-card
  spring-matrix rack, state cards [CB09, CB03]. Q019 and Q020 on screen (cells; a wire is the position of a number).
  The host, in a phrase: the JavaScript around the program (Q018 on screen).
- **s05 (plate, parchment).** **The four instructions**, each with its paper object: a weighted sum (a loom row), a
  ReLU-gated product (a valve), a boolean round (a detent), an index read (a card drawer) [PR02, PR04]. Small print:
  every step rounds to thirty-two-bit floats [PR03]. The boolean line carries the odd number **8,388,609**, in full,
  **without comment** (silent plant, paid ch04-s12).
- **s06 (scene, parchment).** **Tag 3 struck**, by the HandwiredOS README, Q085: "Every weight of the program is
  written by builder code, and none is trained." The empty knot shown plainly: "Nobody in the record believed this.
  That guess was ours. It lasted about three minutes." Then the gentle red-pencil beat: the tutorial you'd learn from
  was itself tested on readers, one following it from a clean copy and four without background, and fixed on 15
  October [CB17] ("Being confused was part of the process, and someone wrote it down."). And the Notes plant: "And
  the to-do list on that desk? In the repo's own words, 'The program holds no text.' Hang that on the line." [Q087]
- **s07 (scene, parchment).** X-ray desk: the 234-cell source table lights. Silent, 5 s.

### ch04 · Deep Dive I: Promises, Not Proofs (4:45–8:45 · 380 words · 16 shots) · see §8.1

### ch05 · One Big Matmul (8:45–10:15 · 140 words · 7 shots) · the loom and the cold furnace
- **s01 (scene, serverCyan).** The builder ribbon from ch03 feeds into **the matmul loom**: **130 thin frames**, one
  per layer; copper threads add, indigo threads subtract; ramps and detent wheels behind the frames; mostly empty air,
  because the matrices are sparse. Q039 on screen ("Independent instructions at the same dependency depth share a
  layer.") [CM01, CM02, OS02].
- **s02 (scene, serverCyan).** Sheets of sums fuse together, then **stop dead at a gate frame**: nothing merges
  across a gate; the longest chain of gates is seventy-one deep [CM07, CM05]. Q006 as the README's own easy voice
  ("We then collect the + and * and relu into a giant matmul, and either run it on JS or WebGPU, for fun.").
- **s03 (scene, serverCyan).** **Tag 5 struck** (the third suspect): this is a network in the plain sense, layers of
  weighted sums with ReLU gates; the README's two primitives and the runtime's four instructions are the same thing
  seen two ways [PR04]. "That guess was ours too."
- **s04 (scene, serverCyan → candleAmber).** The camera exits the loom and turns: the loom's threads *are* the
  wallpaper's arcs. On screen: **4,646 live operations · 130 layers · 9,909 weights** [OS02, OS14]. A small card:
  the site's build fails if those numbers drift from the live program [PJ20].
- **s05 (scene, serverCyan).** **The Notes payoff.** 13 October: the program peaked that day at 21,229 operations;
  that evening Notes handed its text back to the browser's own text box, and the loom **sheds most of its threads**:
  **19,851 → 4,251** live operations, about 4.7 times smaller [OS03, OS04]. "The program holds no text." returns on a
  card.
- **s06 (scene, emberRed).** **The cold furnace.** Q041 on screen: all of the runtime is JavaScript on the CPU. A
  furnace roars: on WebGPU, **an older 14,019-operation build, measured on one machine on 16 September**, took 2.2 ms
  per evaluation against 81 µs on the CPU, about twenty-seven times slower; its single 6.4 MB shader had not
  finished compiling after twenty-eight minutes [CM08, CM09, OS08]. Q064 on a card. The furnace cools. "So what *is*
  a GPU for? Hang that on the line."
- **s07 (scene, candleAmber).** X-ray desk: the 130-frame loom lights. Silent, 5 s.

### ch06 · Deep Dive II: The Clockwork That Cannot Stop (10:15–13:45 · 340 words · 13 shots) · see §8.2

### ch07 · Deep Dive III: Unfreezing (13:45–17:00 · 315 words · 12 shots) · see §8.3

### ch08 · The Summer's Certainties (17:00–18:45 · 170 words · 8 shots) · winterBlue → dawnGold
- **s01 (scene, winterBlue).** The Window Calendar: July's six panes; **August entirely dark, snow on the sill**
  [PJ09]. "The record doesn't say why. So we won't guess."
- **s02 (scene, winterBlue).** 8 July: lab round one lands four experiments [LB01]. **Tag 8** is tied on by the July
  briefs; its knot card reads *an unnamed design conversation*, with a small caption *not Cheng* [LB02]. Its front is
  a label in the film's words: *Established conclusions: take these as given*.
- **s03 (scene, winterBlue → dawnGold).** **3 September, 06:13**, a grey dawn [LB03, LB12]. The reassessment arrives
  (its writer an AI agent, by its own account). The tag flips and the red pencil writes **ten short strokes**, one
  per retired claim. The refrain in full, third and last time, over the strokes.
- **s04 (plate).** A learning experiment had scored nought out of twenty, in an earlier, undated report. Multiply
  every loss by a constant, a change that should do nothing, and at a million it reads twenty out of twenty: a tiny
  constant inside the optimiser had swamped the gradients [LB04]. The reassessment's own caution on a label: it does
  not show the method scales [LB05].
- **s05 (plate).** **The checker that shared the bug.** `if (true) { return x + 1 } return x + 2` at x = 2: JavaScript
  returns 3, the compiled code 4, and the checker reported **zero mismatches**, because its interpreter had the same
  mistake [LB08]. Q116 read. **Q038's plate from Deep Dive I slides back in beside it**: the plant paid.
- **s06 (plate).** The gradient of three times v at zero came out 0 or 3 depending on which operand was written first
  [DG28]. Fixed that morning, with 274 tests passing [LB12]. Q118 names the danger ("it passes yesterday's
  interpretation to tomorrow's agents as a constraint.").
- **s07 (scene, dawnGold).** **The one plain sentence about tooling** (bible §9), over the two hands at one keyboard
  from ch03: "All eight hundred and twenty-five commits are authored by Cheng Lou. Seven hundred and fifty-six also
  credit a coding agent, Claude Code. The reassessment traces an earlier design discussion with OpenAI's Codex too.
  And this film was written with Claude." Then: the mistakes and the reviews that caught them came from the same
  process, under his direction [PJ08, PJ21, PJ22]. No model versions, no praise, no blame. **This is the film's only
  mention of any lab's tools.**
- **s08 (scene, dawnGold).** 14 and 15 September: three runtime questions, the recommended option chosen each time (a
  label, not a quotation): an index read, one exact comparison helper, springs written by JavaScript [PJ23, PR22,
  SP20]. The calendar's September column relights, 58 panes. Tag 8 hangs struck: about eight weeks.

### ch09 · Four Days in October (18:45–20:45 · 200 words · 8 shots) · emberRed → serverCyan
- **s01 (scene, emberRed).** The Window Calendar blazes: October's 689 panes, **683 in four columns** for 13 to 16
  October, lit in every hour of the clock [PJ09]. No claims about sleep or stamina; the panes say it.
- **s02 (card, candleAmber).** Two lamplit cards in Cheng's own lowercase, verbatim substrings: of Q099, "is clearly
  more performant from the gpu parallelism? Then we can make a demo where we search a ton of jsons or something"; and
  of Q100, "Maybe we should check before we build it." The narrator likes that second sentence, and says why: it is
  the film's whole temperament in seven words. (The million-document check used hand-written kernels, not the repo's
  program; the demo stayed at 100,000 [JS22].)
- **s03 (scene, serverCyan).** **The JSON search map**, given real machine time: **100,000 tiny cells** in reading
  order, one document each, 512 characters plus a length [JS01, JS03]. One GPU thread per document runs the same
  small step [JS04]. **The GPU plant paid:** Q090 read in full, or shortened only to a verbatim substring such as "It
  is for many documents: every document runs the same operations and reads no other document's values, so one pass
  runs them all." (no ellipses inside the quotation marks).
- **s04 (scene, serverCyan, match cut).** Kleene's typed RAND page from ch02 dissolves into **the pattern written as
  cells in the table**: a new pattern writes cells and changes no program (Q096) [JS07]. "In 1951, Kleene called them
  regular events. Seventy-five years later, one is a table of numbers that a hundred thousand threads read at once."
  An honest caption: *an echo, not a citation: the repo cites Thompson (1968) and Cox (2007)* [FR07, JS26].
- **s05 (scene, serverCyan).** Two clerks walk each strip, right to left, then left to right, because a program can't
  go back (Q067) [JS06]. Matches light copper, drawn larger than their cells.
- **s06 (scene, serverCyan).** **The RegExp booth**, with a ten-second hourglass and a trapdoor (its worker can be
  stopped only by ending it) [JS16]. Numbers scoped on screen to *one machine, Chrome 155*: the search takes 11 to 15
  ms a keystroke; the browser's own RegExp 8 to 28 ms; on the backtracking pattern `([a-z]+)+x`, 2.1 seconds against
  about 11 ms, because the program never backtracks [JS11, JS12].
- **s07 (scene, serverCyan).** **Tag 9**, tied on at 09:01 on 13 October by the first write-up, already hedged:
  *the GPU is the faster one* (a label). A review the same day found the baselines had run on one of eighteen cores;
  struck **within hours**, the shortest thread in the film, barely a millimetre on the rule [JS21]. Then the settled
  verdict, Q092, and the lab's courtesy, Q095 ("RegExp is fast."). Music cuts to near-silence on the strike, then
  resumes lighter.
- **s08 (card, emberRed → candleAmber).** The go-ahead survives in a commit, verbatim and lowercase: Q103 ("strip 1-4
  yeah. Do it quick plz, then publish.") [PJ12]. The repo goes public on the evening of 14 October [PJ11]. The launch
  post as a text card, verbatim substring of Q104 with its curly apostrophe: "My dear friends, I’d like to show you my
  latest toy project" [PJ14].

### ch10 · Strangers with Pencils (20:45–21:30 · 85 words · 4 shots) · duskRose
Hacker News commenters are **never drawn**: text cards attributed to *a Hacker News commenter* (bible §9). The
abusive reply is not quoted or dramatised.
- **s01 (card).** A Show HN on 20 October [PJ26]. Q130 on a card. **Tag 4** returns: the stranger's pencil arrives to
  find the strike already there, in the repo's own hand (Q014). Fair line: another reader read it as a compiler
  from code to weights; the docs side with the critic [PJ03].
- **s02 (card).** Q131 on a card (23 October, nine days after the repo went public). **Tag 6 flips**, and its back was
  never blank: the landing page's own hidden comment had already admitted the 11, and the 8 at sixteen million
  [PJ27, PJ19]. The copper rivet holds: a promise that states its limits is a kept promise.
- **s03 (card).** Q132 ("why?") is hung on the line as a small question tag, planted for the epilogue [PJ27].
- **s04 (scene).** No public discussion of the lab, the reassessment or the recovery experiment was found by 27
  October [PJ28]. "The strangers' pencils were gentler than the lab's own."

### ch11 · The Rule Written First (21:30–22:30 · 95 words · 5 shots) · winterBlue → dawnGold
The emotion here is **resolve**: *this is how a belief should end.*
- **s01 (scene).** **The recovery grid**: a lookup table of about 1,560 cells; about 240 glow on the path valid JSON
  takes; a paper hand fills the roughly 1,300 dark ones, which valid input never reads, so valid parsing is unchanged
  *by construction* [LB19, PJ15]. Q120 (from the pinned commit's message) on screen.
- **s02 (scene).** **Tag 11** is tied on with a **second card on its knot**: *the rule for failure, written before the
  run*. The test sets are committed before training [LB25, LB20].
- **s03 (plate).** JSON: Q122, quoted whole. The JSON half of the border tag gets its rivet [LB21].
- **s04 (plate).** TOML: Q123. The TOML half is struck **by its own pre-set rule**; then Q124 scopes the loss honestly
  [LB23]. "This is how a belief should end: by a rule it agreed to before the test."
- **s05 (scene).** The bison track's final test has not been run; its thread ends in a small open loop [LB24]. The
  lab's ledger page slides out a drawer marked *Still open*, and **it stays open** into the epilogue, Q125 on its
  label [LB26].

### ch12 · One More Neuron (22:30–24:00 · 115 words · 7 shots) · see §9

---

## 8. How the deep dives teach

Shared rules: **every number on screen is the real one** (bible §5); anything derived is labelled *derived*. Each deep
dive is one teaching machine that grows, not a chain of unrelated diagrams. Each step is one to three lines, then a
held frame of two to four seconds with only the machine moving and clacking. Each machine first appears as a
silhouette against backlight, then is inked onto a parchment plate for the arithmetic (style bible §6). Shape of every
dive: **a promise → the machine keeps it → the machine is pushed past it → what the runtime really does → a tag.**
The mystery treatment's §4 sample lines are a valid starting draft for the ear.

### 8.1 Deep Dive I · Promises, Not Proofs (`(a > 4) ? 10 : 12` by hand) · ch04 · 4:00 · 380 words · 16 shots

*Machines:* Two Ramps and a Lever (art dept 1), Both Branches Run (2), Tags on Wires (5), the sign-cascade lens train
(3), the boolean-atom detent (4). The **copper hinge** (a short length of the copper line bent flat-then-45°, the
shape of a ReLU) is this dive's physical emblem: it is literally a bit of the washing line, bent.

| Shot | Step | On screen (bound quantities) | What the viewer learns · narration draft | Claims · quotes |
|---|---|---|---|---|
| s01 | The question | Plate: the ternary; a JavaScript fork in a paper road: only one arm lights | In JavaScript only the chosen side runs. "A network has no *if*." | TE15 |
| s02 | The first ramp | A copper wire bends into the hinge, then grows into a hinged board: `max(0, a − 4)`. Marble at 3, 4, 5, 6, 100; a ledger fills 0, 0, 1, 2, 96. Q003's first clause on screen: "// Math.max(0, x) is ReLU." | "A ramp is all a ReLU is: flat, then up." | TE01, TE02 |
| s03 | The second ramp | `max(0, a − 5)`: 0, 0, 0, 1, 95. The lever reads the difference: 0, 0, 1, 1, 1. The marble's path draws flat, climb, flat in copper: `clamp(a − 4, 0, 1)` | Whole numbers sit exactly on the two corners: the whole trick, and the whole caveat | TE02, TE03 |
| s04 | Both branches | Belts carrying 10 and 12 never stop; two shutters open by `above4` and `1 − above4`. Plate: `above4 × 10 + (1 − above4) × 12`. Q004 on screen | Both answers are computed every time; a 0/1 shutter picks | TE01, TE10 |
| s05 | The poison | An **∞** tile rides the closed belt; the tray fills with grey **NaN** sand. Q082 on screen | "Nought times infinity isn't nought. It isn't a number at all." | TE11 |
| s06 | Four and a half | 0.5 × 10 + 0.5 × 12 = **11**; at 4.25, **11.5**. The score's gate at 0.5 | The prologue's eleven, explained | TE03 |
| s07 | The cold limit | Plate: a = 16,777,222; a − 5 rounds to 16,777,216; above4 = 2; result **8**. Q058 on screen | Past sixteen million, whole numbers blur in thirty-two-bit floats | PJ19, EX02 |
| s08 | What the runtime builds | `emitCompare` refuses without a declared range. **Tag 6 is untied from the line and re-tied onto the wire of a, rewritten as `grid 1`.** The rig shrinks: `ramp = relu(5 − a)`, `bit = relu(1 − ramp)`; checked at 5 → 10, 4 → 12, 3 → 12 (relu(−1) = 0). Counter: **2 ops · 2 layers**; whole ternary **8 ops · 5 layers** | "The real library makes you say the small print out loud." | TE04, TE05, TE06, PR11 |
| s09 | **The false promise** (climax) | The marble pushed to 4.5 *under the grid tag*: bit 0.5, answer 11. The validator's line as a monospace **label, not a quotation**: wire 0 must be a multiple of 1, got 4.5. The red pencil writes *validator* on the tag's back | Q029 spoken: "Declarations are promises from the caller, not proofs." **The refrain in full (second use).** "That lie lasted one evaluation." | TE07, Q029 |
| s10 | No promise: the lens train | A hairline of light, `a − 4`, through six lenses (×2^14, then ×2^24 five times), each with a stop at height 1, a seventh stage `relu(1 − 2^15 · stage)` and a flip. A dial: **2^149**, the gap from the smallest thirty-two-bit number to 1. At 4.5: **10**. Counter: **16 ops · 15 layers**. Q033 on screen | "Promise nothing, and the machine must tell any gap at all from none." | TE08, EX05 |
| s11 | The lesson | The two rigs side by side, 16 against 2; the tag falls back onto the line | "One honest sentence about your input saves fourteen operations." | PR12 |
| s12 | **The detent** (paid) | The **8,388,609** from ch03's plate returns: a fine ruler slid onto a giant ruler that starts at 8,388,609, ticks 1 apart. 0.49999997 snaps back to 0; exactly 0.5 snaps **up** to 1, because the start mark is odd and ties round to even. Q056 on a card | A one-operation shortcut, and why its odd number matters | PR08 |
| s13 | What exact means | Plate: Q036, held at least four seconds. A paper window 1,732 px wide: `f(f(1708) × f(1/244))` = 6.999999523162842, so seven columns become six where float64 says seven | Exact means exact against the stated thirty-two-bit calculation, not against JavaScript's doubles | EX01, EX03 |
| s14 | Why not just use doubles? | A study card, 13 September: float64 *everywhere* got **18,820 of 20,000** percent labels wrong; keeping thirty-two-bit order only at the rounding points brought the flips back to zero. Then the **wall of 4,402 tiny ticks**: the comparison tests against JavaScript's own comparisons | "More precise broke it." The even-handed answer, then the checks | EX10, EX07, TE14 |
| s15 | The plant | Q038 on a parchment plate, pinned beside the line ("That the two evaluators agree doesn't show that a program does what the JavaScript it replaces did."). Not explained | Silent plant for ch08-s05 | EX01 |
| s16 | X-ray | The desk: ReGLU ramps and 0/1 shutters light (2,776 gates, 59 detents) | Silent, 5 s | OS02, EX08 |

The dive's teaching line, in the narrator's own words (from the bible's §5.1 intuition): *"Every if here is a dimmer
switch. The program's whole job is to keep it fully on, or fully off."* Pacing: s02–s06 get the most silence (the 11
tile needs a full second to land); the lens train runs at one lens per beat; the Q036 plate holds four seconds.

### 8.2 Deep Dive II · The Clockwork That Cannot Stop (host loop, springs, patterns) · ch06 · 3:30 · 340 words · 13 shots

*Machines:* the host clockwork (art dept 11) with the source table (8), the spring step stamp (12) and squaring press
(13), and **one companion machine per noun of Q015** hanging off the clockwork's four arms: *a count* (the counting
rail, 15), *a tree* (the prefix loom, 14), *a table* (the index-read card drawer, 7), *the same work on every item*
(the rank board, 17, and the K-slot rack, 18). All four of Q015's nouns get a machine.

| Shot | Step | On screen | Narration draft · what it teaches | Claims · quotes |
|---|---|---|---|---|
| s01 | The thesis | Q015 set across a plate and read slowly. A loop of paper track with no exit ramp, no jump, no brake. The four nouns become the clockwork's four arms | "There's no jump, no break, no repeat. Everything runs, every time." | HL01 |
| s02 | One turn of the clock | The toggle (a 52 × 32 px paper track). A press stamps a token with its time on a 1/64 grid and drops it in a tray (Q026). The escapement ticks: the host writes inputs and four matrix cards into the pigeonholes, the loom runs once, the next-state cards slide back into their holes, the page moves from the outputs alone. The clock stops when nothing moves (Q027) | The loop lives outside, in JavaScript; each evaluation is one turn | HL02–HL06, CB10 |
| s03 | Springs without loops | Q024 on screen. A 2×2 brass stamp `0.99536 · 0.00352 / −1.16 · 0.88`. Cards −300 and 0 go in; **−298.608** and **348** come out; the window creeps from 400 to 401.392 px. The **squaring press** folds the plate onto itself: 300 steps in 8 squarings (*derived*). A counter stays frozen at **14 ops · 3 layers** whatever the step dial reads. Q046, Q045 | "Two steps or three hundred, the network pays the same fourteen operations. And the stiffness never enters the network at all." | SP01, SP02, SP03 |
| s04 | The ratchet at 300 | A 300-tooth ratchet with a release pawl: past tooth 300 every window snaps onto its destination at rest and the backlog drops through a trapdoor. Q049. A two-sided card: *other guidance carries the backlog; Handwired snaps, to keep a fixed bound* | A fixed maximum needs a named fallback; snap versus carry is a design choice, not a refutation | HL08, HL27 |
| s05 | Two desks, one bit | The same recorded session on two paper desks, 10 fps and 120 fps. In the familiar order a gauge reads up to **359 px** apart; in Handwired's they lock into one image, a bit-strip under each identical. Caption: *in the repo's tests, while events arrive in order and no snap runs*. The frame you see is drawn on carbon paper and thrown into a tray. **Tag 7** (one evaluation per frame) is struck: until 15 September | "The frame you see is a rehearsal, computed in full and thrown away." (narrator's words, unquoted) | HL18, HL11, HL10, HL14, HL17 |
| s06 | **A count** | The counting rail: pegs at 40, 80, 80, 140, 180; a pointer bar at 90; three flags drop together; the tally clicks to **3**. Q066. Caption: *the test must flip only once* | findIndex becomes a count of the yeses | PT08, PT09 |
| s07 | **A tree** | The prefix loom: tabs 3 1 4 1 5 9 2 6; Brent-Kung joins them 11 times in 4 levels to 3 4 8 9 14 23 25 31; Sklansky does it in 3, one tab fanning into four threads. Paper name tags on the threads, **SKLANSKY 1960** and **BRENT · KUNG 1982**, each with a **stamped grommet**. Q164 on Brent's tag ("At the time of publication the use of carry-lookahead in VLSI designs was unpopular.") | "These two old names are signed into the runtime itself: they're the names of its functions." Calling Sklansky's adder a prefix network is a later reading (caption) | PT05, PT15, PT26, PT28 |
| s08 | The grouping is the answer | Two plates: four row heights summed two ways, **799.300048828125** and **799.2999877929688** (Q061). On a CPU the chain is faster (Q062); at 10,000 rows the tree drifts **0.26 px** to the chain's **5.67** | Trees can be slower on a CPU and more accurate in thirty-two-bit floats | PT03, PT06, PT14 |
| s09 | **A table** | The index-read card drawer: reading one row of a **10,000-row table** costs **30,002 operations** as arithmetic and **1** as an index read | Some loops become a lookup | PR17, PR18 |
| s10 | **The same work on every item: sorting without sorting** | The rank board: keys 30 10 30 20 flip tiles in a 4×4 grid; rows sum to **2 0 3 1**; the cards slide to those slots without ever swapping. Q069 | Sort becomes counting | PT16 |
| s11 | …and a fixed maximum | The K-slot rack: visible 0 1 1 0 1 0 1 1, running count 0 1 2 2 3 3 4 5; three slots take items 1, 2 and 4. Q072 on a brass card; then Monitor's own line, Q074 ("Only 64 rows are drawn at a time.") | filter-and-slice into a fixed number of page elements; every maximum needs a fallback | PT18, PT20, HL22 |
| s12 | **The crank** (Kleene paid) | The clockwork turns the loom's crank, once per tick. Two equally lit chalk cards: Siegelmann & Sontag, a fixed net can be any computer *given numbers of unlimited precision*; Maass & Orponen, the faintest noise drops such nets back to finite machines (*how much that matters is argued*). Then: *thirty-two-bit floats are finite*. Q127 on a small card: the repo's own comparison with an appended token | "Remember Kleene's finite machine, and the time that had to come from outside? Here it is. The network is one fixed, exact step. The host loop turns the crank. It never stops early." | FR07, FR13, FR14, FR15, FR25 |
| s13 | X-ray | The desk: the host clockwork's ratchet lights | Silent, 5 s | HL08 |

Pacing: s03 is one continuous shot (stamp, then press). s05's split-screen holds at least five seconds. s06–s11 move
briskly, one machine per beat, so the four shapes of a loop read as a set.

### 8.3 Deep Dive III · Unfreezing (gradients through a handwritten program) · ch07 · 3:15 · 315 words · 12 shots

*Machines:* the ReGLU valve (art dept 23), the learned-gallery stage (22) with **a small clerk with a seating chart**,
the Huber clamp (24); and the landscape changes for the first time to the **misty hills** (kit `mistyHills`), a
traveller with a lantern walking down the gallery's real loss curve.

| Shot | Step | On screen | Narration draft · what it teaches | Claims · quotes |
|---|---|---|---|---|
| s01 | The offer | README card, Q010, read in full. A frozen weight-knob; ice cracks off it as a paper hand turns it | The project's own question of itself (planted for the epilogue) | PJ04 |
| s02 | One valve, by hand | A valve: flow 3w with w = 0.5, through an opening of max(0, g + b) with g = 0.25, b = −0.1: open at **0.15**; out comes **0.225**. Backward, the lantern light reverses: slope for w **0.45**, for g **1.5** (*derived*) | Gradients flow back through an open valve | DG01 |
| s03 | The valve shuts | b = −0.4: the gate reads −0.15; output **0**; every backward arrow goes dark. Q108. A whisper of weight decay (0.0000002) keeps the gallery's gates from staying shut | **ch02 paid:** "McCulloch and Pitts's neurons couldn't learn. These can, if you let them." | DG01, DG11, FR05 |
| s04 | The rules on the loom | ch05's loom with light running *backwards*: each thread passes the gradient times its weight; a valve passes it only while open. Q052 | Every operation has a rule for running backwards | DG01 |
| s05 | **Tag 10: fully differentiable?** | Tied on from the README's tagline. The red pencil writes from *inside the repo*: DD I's ramps return with a slope gauge reading 0 at every whole number. Q110 on screen. The tag stays hanging, glowing | "Differentiable as real arithmetic. But the decisions are flat: a decision has no slope to follow." | DG03, DG15 |
| s06 | The gallery stage | A 5:4 stage; a hand sketches ten rectangles (the *Story* preset). Twelve photos sit piled near the centre as small squares (0.18 × 0.18). Counters: **244 weights · 6,320 ops · 8 layers** | The only demo whose weights are trained; its only input is its weights | DG04, DG05, DG06 |
| s07 | **Who goes where** | A small clerk with a seating chart, in plain ink, assigns each photo to a rectangle before every step (a min-cost assignment in ordinary JavaScript) | "The network learns *where*. Plain JavaScript decides *who*." | DG09 |
| s08 | Far-off photos vote | The Huber clamp: each photo edge pulls a bias through a spring whose force caps at **0.08**. Formula plate: ∂L/∂b = (1/40) Σ over 10 rectangles of [clip(e_left) + clip(e_right)]. Adam's first step: **0.5 → ≈ 0.492** | "A photo miles off pulls no harder than one a whisker off. Far-off photos vote. They don't shout." | DG07, DG26, DG27, DG08 |
| s09 | Learning, seen as unfolding | The photos fan out to their rectangles over one to three seconds; the loss chart falls; the mistyHills traveller walks down it. *600 steps a second* | Training runs live, through the program's own backward pass | DG06, DG10 |
| s10 | The rejected shortcut | A ghosted hand offers a ruler that snaps the sketch to a grid; another pushes it away. Q106 on a card, verbatim substring: "the spirit of the gallery is to learn something." Then Q107 read. A *Misalignment penalty* slider | Make it learn; don't fake it | DG13 |
| s11 | Honest scope | A label, plainly: the gallery is a small generic network compiled as a program, not a hand-written one unfrozen. True unfreezing (declaring a hand-written number a cell) in the drag-knobs lab: **63.6%** of drag frames solved in one gradient step. Then the **question-mark tag** on a slack thread hangs from tag 10, carrying Q011 verbatim. The red pencil hovers, then lowers: not attempted | What learns, and what is still a dream | DG06, DG20, DG22 |
| s12 | X-ray, with its one line | The desk: a single valve, **drawn dark** | "The desktop has none of this switched on. Not one of its weights is trained." | Q085, PJ20 |

Pacing: s03 (the valve closing) is the chapter's quiet moment: the arrows fade on twos, no narration for a beat. s09
needs about ten seconds of mostly music while the photos fan out.

---

## 9. The ending · ch12 · One More Neuron (22:30–24:00 · 115 words · 7 shots)

**s01 (scene, dawnGold).** The *Still open* drawer from ch11 is still open. The camera rises out through a window bay
onto **misty hills at dawn**. The copper line is strung across the valley like a washing line, and on it hang **all
eleven tags**, each over its lifespan on the Lifespan Rule laid along the valley floor, struck ones struck, kept ones
riveted, the "why?" question tag among them. In the far distance the Window Calendar stands dark after 16 October
[PJ09].

**s02 (scene, dawnGold).** **The line re-hangs itself by dependency depth.** The narrator's hands lift each tag and
re-hang it **one column to the right of the deepest tag you needed to understand it**: the compiler's own layering
rule (Q039, [CM01]), applied to *the film's teaching order* (not to history; no lineage is claimed). The layout is
computed from the table below, not placed by eye. The threads re-tension; the washing line becomes a **loom**.

| Tag | Needs (to be understood) | Column |
|---|---|---|
| 1 Logic neuron | — | 0 |
| 4 A tool converted JavaScript | — | 0 |
| 2 Learn the weights | 1 | 1 |
| 5 Not really a network | 1 | 1 |
| 8 Established conclusions | 4 | 1 |
| 3 Somebody trained it | 2 | 2 |
| 6 For an integer a | 4, 5 | 2 |
| 7 One evaluation per frame | 6 | 3 |
| 10 Fully differentiable | 6 | 3 |
| 9 The GPU is the faster one | 5, 7 | 4 |
| 11 Gradient descent fills the gaps | 8, 10 | 4 |
| *why?* (question tag) | 4 | 1 |
| the blank | 9, 11 | 5 |

**s03 (scene, dawnGold).** **A forward wave of copper light** runs left to right through every column. **Every tag
lights, struck ones included**: on a struck tag the light arrives, glows, and is multiplied by zero, a little shutter
closing behind it. The both-branches gate opens column by column; on each struck tag it closes to 0 while the line
keeps playing underneath. "The struck ones ran too. Multiplied by zero." The structure of the film has just
demonstrated the structure of the program [TE10, TE11].

**s04 (scene, dawnGold).** The light settles on what is still hanging unstruck. Tags 2 and 10 glow off the end of the
rule (contested: the score's two lines held at half level, undecided). Tag 6 holds its rivet. The "why?" tag turns,
and the README answers in its own voice: Q010 ("unfreezing the weights and train them (what does that even do? Let's
find out!)") [PJ04].

**s05 (scene, parchment).** The camera returns to the HandwiredOS desk, plain and warm, no X-ray. The Notes window
racks into focus. Its last line, in the window's own type: "Wire one more neuron by hand" (Q088) [OS18], spoken with
its quotation marks.

**s06 (scene, parchment).** The narrator's hands bend a short length of the copper line into a hinge (flat, then up:
a ReLU), tie the **blank tag** to it, and place it into **an open, generic hand** rising into the lower third: the
viewer's. The detent plays *tie*, *flip*, and the third stroke never comes.
- *Last lines (level soft):* "Who tied it on, we know. Who will doubt it, we don't." *(beat)* "It's waiting for the
  next pair of hands."

**s07 (card, black → parchment).** The copper wire under the dock is the last light in frame; a single relay clack.
End card: "As of 27 October 2026, `main` is still at `257856e`." [PJ17] Credits: sources (`chenglou/handwired @
257856e`, the research bible, the shelf's `sources.json`), MIT licence. No logos; only the parody "O'RLY?" if any
imprint appears.

The ending is deliberately unresolved. Handwired is under five months old, was public for less than a fortnight at
the pin, and keeps open questions in its own ledger [LB26, PJ05, PJ11]. The honest ending is a tag still being tied,
placed in your hand.

---

## 10. Emotional arc

| Beat | Feeling | Where |
|---|---|---|
| A desk that is secretly a network; a child's line of code says eleven | **Wonder, then a small itch** | ch01 |
| Old men and old certainties; the thread splits | **Perspective**: beliefs outlive their evidence and still prove useful | ch02 |
| Our own guesses struck; the doubt in the same box as the promise | **A wry smile at ourselves** | ch03 |
| Ramps really do compute *if*; the 11 explained; ∞ → NaN, 16,777,222 → 8 | **Delight, then unease** | ch04 |
| A promise turns 16 operations into 2; "promises, not proofs"; 2^149 | **Wonder at the engineering, and the moral of trust** | ch04 |
| The wallpaper is the program; the text box sheds the loom; the GPU is slower | **Awe, then a puzzle** | ch05 |
| Fourteen operations for any spring; two desks identical in every bit; old names on new thread | **Satisfaction: the clockwork is beautiful** | ch06 |
| A valve shuts and learning dies; the snapping fix refused | **Tenderness: the project wants to learn, not cheat** | ch07 |
| The dark August; ten certainties struck; the checker shared the bug | **Humility: the film's low point, cold blue** | ch08 |
| Four columns of light; 100,000 documents per keystroke; a claim withdrawn in hours | **Exhilaration, then respect** | ch09 |
| Strangers find the eleven; the repo had already said so | **Exposure, and a wry smile** | ch10 |
| A failure rule written first, then honoured | **Resolve: this is how a belief should end** | ch11 |
| The line becomes a loom; struck tags light too; a blank tag in your hand | **Quiet warmth, and an invitation** | ch12 |

A U with a high plateau: wonder builds through the three deep dives, the floor is the September reassessment, and the
climb back is earned by method rather than triumph. The narrator never gloats over a broken belief.

---

## 11. Where curiosity is planted, and where it pays off

| Plant | Planted | Paid |
|---|---|---|
| The copper wire under the dock | ch01-s01 | the washing line; the hinge in DD I; the last light in frame (ch12-s07) [OS18] |
| Three suspects, "Hang them on the line" | ch01-s05 | trained? struck ch03-s06 [Q085]; a tool converted it? struck ch03-s03 [Q014], re-read ch10-s01; not a network? struck ch05-s03 [PR04] |
| a = 4.5 gives **11** | ch01-s06 | ch04-s06, s09; ch10-s02 (a stranger finds it; the hidden comment had said so) [TE03, PJ19, PJ27] |
| A dozen blank tags on the title card | ch01-s08 | the washing line at dawn; the blank in your hand |
| Nothing in the 1943 units learned | ch02-s02 | ch07-s03, "These can, if you let them." [FR05] |
| Kleene: time comes from outside | ch02-s03 | ch06-s12, the host turns the crank [FR07, FR25] |
| Kleene: regular events | ch02-s03 | ch09-s04, the pattern as cells (echo, not citation) [FR07, JS07, JS26] |
| The signature grommet, empty on the old tags | ch02-s01 | ch06-s07, SKLANSKY 1960 and BRENT · KUNG 1982, stamped [PT05, PT26] |
| The second hand at the keyboard | ch03-s01 | ch08-s07, named once, neutrally [PJ08, PJ21] |
| **8,388,609** inside `boolean(score)` | ch03-s05 (silent) | ch04-s12, the odd start mark rounds 0.5 up [PR08] |
| "The program holds no text." | ch03-s06 | ch05-s05, 19,851 → 4,251 [OS04] |
| The arc wallpaper | ch01-s04 | ch05-s04, the loom's threads are the arcs [OS14] |
| Q038: two evaluators agreeing proves nothing | ch04-s15 (silent) | ch08-s05, the shared-bug checker [LB08] |
| "So what is a GPU for?" (27× slower) | ch05-s06 | ch09-s03, Q090 and 100,000 documents; tag 9's hours-long life [JS21] |
| A fixed maximum (Q072) | ch06-s11 | Monitor's "Only 64 rows are drawn at a time." in the same shot [PT20] |
| The closed valve stays shut | ch07-s03 | the dark valve on the desk (ch07-s12): HandwiredOS trains nothing [Q085] |
| "Let's find out!" (Q010) | ch07-s01 | ch12-s04, the answer to "why?" (Q132, hung ch10-s03) |
| The *Still open* drawer | ch11-s05 | it never closes (ch12-s01) [LB26] |
| Notes' to-do list, out of focus | ch01-s02 | ch12-s05, "Wire one more neuron by hand" [Q088] |
| The window calendar's last pane | ch03-s01 (first pane) | ch12-s07, no new panes after 16 October [PJ17] |

---

## 12. The grafts, and where each landed

| Graft (source) | Landed |
|---|---|
| Desk reveal moved forward: Monitor's numbers, then through into the 9,909-arc wallpaper (mystery) | ch01-s02 to s04 |
| Three suspects as explicit misconception tags, each struck (mystery) | ch01-s05; ch03-s03, s06; ch05-s03; ch10-s01 |
| The both-branches score motif, half level at 4.5 (mystery) | Device 4; ch01-s06, ch04-s06, ch12-s03/s04 |
| Finale: re-hang by dependency depth, forward wave through every tag, struck ones included (mystery) | ch12-s02, s03 |
| Kleene's finite machine (time from outside) → the host turns the crank (mystery) | ch02-s03 → ch06-s12 |
| X-ray desk beats, one more real component each, absorbing the thin "Three Desks" chapter (mystery) | Device 3; ends of ch03–ch07 |
| Notes text box as the loom shedding threads, 19,851 → 4,251 (mystery; OS04 states both figures) | ch03-s06 → ch05-s05 |
| A light plant refrain (mystery's "Put that in the file"), at most four uses | "Hang that on the line", four uses (§3) |
| The window calendar with exact counts, "The record doesn't say why. So we won't guess." (people) | Device 2; ch03, ch08, ch09, ch12 |
| SKLANSKY 1960 and BRENT · KUNG 1982 name tags, Brent's "unpopular" (people) | ch06-s07 |
| Signed vs unsigned handoffs (people) | the signature grommet (Device 1), stated only where the bible settles it |
| Kleene's regular events → the pattern as cells in JSON search, with the Thompson/Cox caveat (people) | ch09-s04 |
| The last tag (or hinge) into the viewer's open hand (people) | ch12-s06: both, the blank tag tied to a copper hinge |
| Cheng's "Maybe we should check before we build it." and his GPU question (people) | ch09-s02 |
| The tutorial tested on readers (people) | ch03-s06 |
| The clerk with a seating chart (people) | ch07-s07 |
| One Big Matmul expanded to 1.5 min with loom and cold furnace; JSON search its own machine time; tags cut to about ten, no sub-tags; the log ruler explained once (structure) | ch05; ch09-s03 to s07; eleven tags; ch02-s06 |
| The copper hinge as DD I's physical emblem (people) | ch04-s02, ch12-s06 |
| "Promises, Not Proofs" as the DD I title, Q029 as its climax (beliefs) | ch04-s09 |
| Q038 planted at the end of DD I, paid by the shared-bug checker (beliefs) | ch04-s15 → ch08-s05 |
| 8,388,609 planted silently, paid as a real beat in DD I (beliefs) | ch03-s05 → ch04-s12 |
| "So what is a GPU for?" planted and paid with Q090 (beliefs) | ch05-s06 → ch09-s03 |
| The table arm with PR17's 30,002 vs 1 (beliefs) | ch06-s09 |
| True unfreezing (drag-knobs 63.6%) and Adam's 0.5 → ≈0.492 (beliefs) | ch07-s11, s08 |
| The recovery parser as the rule written first (beliefs) | ch11 |
| EX10's "more precise broke it" in DD I (beliefs) | ch04-s14 |
| Detent figure with the third stroke withheld, folded into the gate motif for the still-contested tags; end card on 257856e (beliefs) | Device 4; ch12-s04, s07 |
| Siegelmann/Sontag and Maass/Orponen moved to one card at DD II's payoff (structure) | ch06-s12 |
| The empty-knot rule for every belief (beliefs) | Device 1; tags 3 and 5 |
| Anthropic named once; "built a small desktop the same way" reworded as echo; CM08's scope on screen (fixes) | ch08-s07; ch02-s06; ch05-s06 |
| The 4,402-check wall to close DD I; mystery's DD I sample lines as a draft (mystery) | ch04-s14; §8 |

---

## 13. Five unforgettable images

1. **Eleven.** A marble halfway up a paper ramp; two belts still carrying 10 and 12; two shutters half open; a tile
   reading **11** sliding out into the dawn haze, while the score sounds both its lines at half level.
2. **The wallpaper is the program.** The camera passes through a paper window into a cathedral of 9,909 copper and
   indigo arcs, one per weight; later the loom's own threads turn out to be those arcs, and when Notes hands back its
   text, most of them fall away.
3. **The lens train.** A hairline of copper light, too thin to see, passes through seven backlit lenses until it
   floods the frame as a solid bar: two to the hundred and forty-ninth. A difference no one could measure becomes a
   decision no one can miss.
4. **The dark month and the blaze.** A tall paper building of lit windows, one per commit: June bright, July six
   lamps, August black glass with snow on the sill, October blazing in four columns lit in every hour.
5. **The line becomes a loom.** Eleven paper tags on a copper wire across misty hills, re-hung by the compiler's own
   rule into columns, a wave of copper light running through every one, the struck ones too, multiplied by zero, and
   a blank tag on a copper hinge placed into your hand.

*(Reserve: two desks at 10 and 120 frames a second landing in identical places while a ghost of the familiar loop
drifts 359 px away and fades.)*

---

## 14. Brief coverage checklist

| Brief must-cover | Where |
|---|---|
| What a program is: FP32 weighted sums, gated relu/reglu, boolean and indexRead; cells, wires, source table, builder code appending to a `Circuit` | ch03-s02, s04, s05; index read ch06-s09 |
| The README `(a > 4) ? 10 : 12` worked by hand | ch01-s06; ch04-s02 to s06 |
| Both branches run; a 0/1 selector picks | ch04-s04, s05 |
| Exactness in FP32: declared ranges, rounding points, `emitCompare` | ch04-s08 to s14 |
| One big matmul: fusion, sparsity; backends (JS CPU evaluator; WebGPU for JSON search) | ch05-s01 to s06; ch09-s03 |
| The host loop: inputs in, evaluate, next state copied back, DOM writes; cannot stop early | ch06-s01, s02, s12 |
| Loops as counts, trees, tables, same work on every item (findIndex, running totals / prefix networks, sort, filter + slice into K) | ch06-s06 to s11 |
| Springs and time | ch06-s03, s04, s05 |
| The three demos | HandwiredOS ch01, ch05, X-ray beats; learned gallery ch07; JSON search ch09 |
| Differentiability: unfreezing weights, training end to end | ch07 |
| What the lab explored and what is still open | ch08, ch11, ch12 |
| Deep dives 1–3 | ch04, ch06, ch07 |
| Context: McCulloch & Pitts; modern compiled nets, brief and verified | ch02 (labelled framing); Q127 card ch06-s12 |
| Debates, two-sided | regular JavaScript (ch03, ch10), exact (ch04), fully differentiable (ch07), GPU speed (ch05, ch09), trees vs loops (ch06-s08), snap vs carry (ch06-s04), trained vs hand-written recovery (ch11), learn vs write (ch02), neurons as logic (ch02), Turing completeness (ch06-s12), who wrote it (ch08-s07) |
| AI labs even-handed, including Anthropic | ch08-s07, once |

---

## 15. Guardrails for the chapter writers

- **Quote integrity.** Every span in quotation marks, on screen or in narration, is a verbatim `quotes.json` text or a
  verbatim substring of one, with its original spelling, casing, typos and punctuation (Q103 "plz", Q106 "alignemtn"
  if ever extended, Q104's curly apostrophe, Q133's curly inner quotes, Q142's "organized", Q132's spacing). Keep the
  quotation marks in `spoken`. Never edit `research/quotes.json`. **Never in quotation marks:** the July briefs'
  heading (a label), "clearly faster" (a label), the validator's error string (a label), "dress rehearsal", "far-off
  photos vote", "the recommended option each time", "the whole trick", "regular events" (a term). Q121 quoted whole or
  not at all.
- **Attribution.** Repo prose is "the docs", "the README", "the tutorial"; not Cheng. Cheng is quoted only in Q099 to
  Q106 and his launch post Q104. The reassessment's words belong to its unnamed writer (an AI agent's review, by its
  own account). The July beliefs belong to "the July briefs", never to Cheng. Hacker News critics are "a Hacker News
  commenter".
- **Likeness.** Cheng appears as hands only (a laptop, a lamp), never a portrait. The coding agent is a second paper
  hand with no face and no words. Living researchers are text cards. McCulloch and Pitts are profile silhouettes from
  the bible's secondary notes; Kleene and the frog-lab figures are generic period figures. HN commenters are never
  drawn.
- **Numbers with their conditions.** Timings carry date and machine and are never compared across machines.
  Bit-identity is always "in the repo's tests", "while events arrive in order and no snap runs". The 0/20 report is
  "an earlier report", never "in July". The merge is "about 240 commits". CM08 is "an older 14,019-operation build, 16
  September, one machine". Never "Handwired runs on the GPU" unscoped.
- **Do-not-use list (bible §11) is binding**, including: no "held by most programmers"; no "neural nets are
  probabilistic" line; no 41–44 µs timings; no "114,476 bytes" (so the Monitor footer's byte figure is not shown); no
  "Fiedler named the spiral of death"; no "a = 4.5 under emitCompare is always wrong" (only under a false grid; the
  cascade gets it right); no "the trained parser beat hand-written rules" unscoped.
- **Lineage.** The 1943–1998 material is framing, never lineage [FR22]; the empty grommet makes that visible. The
  finale's dependency columns are the film's teaching order, said as such.
- **For the ear.** Short sentences; numbers spoken naturally; symbols and code on screen. Name the tags in plain words.
