# Treatment: PEOPLE AND PERSISTENCE

**Film:** handwired-explained · **Angle:** people and persistence · **Target:** 24:00, about 2,280 narration words · **As of:** 27 October 2026 (subject pinned at `chenglou/handwired@257856e`)
**Sources:** `research/bible.md`, `claims.json` and `quotes.json` only. Claim ids are in square brackets; quote ids start with `Q`. Every span inside double quotation marks below is copied character for character from `quotes.json` (curly apostrophes, lowercase and typos included). Paraphrases are never put in quotation marks. Phrases that come from the repo but are *not* in `quotes.json` are set in italics and must stay paraphrase in the script.

---

## 0. Scope note: how this angle meets the brief

The computed task asked for a history-of-AI checklist (both AI winters, AlexNet, the transformer, ChatGPT, the US-China race). This film's brief overrides it: the subject is **Handwired**, the brief says *the film is about Handwired, not a history*, and the history (McCulloch and Pitts, modern compiled networks) is *only as brief framing and only if verified*. The bible contains no AlexNet, winter, ChatGPT or geopolitics material, so none of it appears. Here is how each item on the checklist lands honestly:

| Checklist item | What it becomes in this film | Grounding |
|---|---|---|
| All eras | The bible's seven eras: neurons as logic (1943 to about 1959), what can a net compute (1951 to 1998), learn or compile (2019 to 2026), then four eras *inside* Handwired: the July *established conclusions*, the September reckoning, the October sprint, the reception | bible §2, E1 to E7 |
| Debates, beliefs, dissenters, how long beliefs held | The **Fuse of Belief** device (§4), with durations from the bible only: about sixteen years, about two months, a few hours | E1, E4, E6; [FR10, FR11, LB02, LB03, JS21] |
| The experiments | The lab's experiments (the loss-scale reversal, the checker that shared a bug, the recovery parser) and one historical experiment, the 1959 frog | [LB04, LB08, LB19 to LB25, FR10] |
| Classical ML | Its nearest relatives here: Sutton against Brooks, Adam, the straight-through estimator, weight decay | [FR20, DG08, DG18, DG11] |
| Both winters | The project's own two cold spells: the **quiet months** (six commits in July, none in August) and the **September reckoning** that retired ten claims. No motive is guessed for the quiet | [PJ09, LB03] |
| ChatGPT and the transformer | The repo's own comparison of its frame loop to chain-of-thought tokens, the RASP / Tracr / Percepta framing, and the plain statement that Handwired is not a transformer and has no attention | [FR25, Q127, FR16 to FR19, FR22] |
| Anthropic | Said once, plainly and neutrally: 756 of 825 commits credit the coding agent Claude Code as co-author, the reassessment also traces an earlier design discussion with OpenAI's Codex, and this film was made with Claude | [PJ08, PJ21], bible §9 |
| US-China race | Does not apply. The geopolitics guidance is minimal: at most, Kleene's memo was a U.S. Air Force Project RAND document | bible §9 |
| AlexNet and transformer deep dives | Replaced by the brief's three deep dives, each built on a teaching machine with real numbers: (1) the ternary as two ramps, (2) loops and state as a clockwork, (3) gradients through a handwritten program | brief, bible §5.2, 5.5 to 5.6, 5.8 |

The people angle stays honest by following the people the bible actually documents. That means Cheng Lou only through what the repo and his own launch post say, the unnamed hands that corrected the work (agents, reviewers, readers), the strangers who criticised it in public, and a handful of earlier people whose ideas share its shape, without implying that any of them handed it on (§4, device 1).

---

## 1. Title and logline

**Title:** ***Every Weight by Hand***
**Subtitle:** *How Handwired works, and the hands that carried its ideas*

**Logline:** In 1943 two men drew nerve nets as little machines of logic, choosing every connection themselves. In 2026 a programmer, Cheng Lou, built a small desktop the same way: a neural network in which no weight is trained and every number is written by a person. This is the story of how that network works, told through the hands it passed through: the old logicians whose nets it unknowingly echoes, two adder designers whose names are written into its code, the agents and reviewers who took a red pencil to its claims, and the strangers who tried four and a half and got eleven.

**The angle in one breath.** Ideas are batons. Some are handed over with a name tag tied on: Sklansky's 1960 adder and Brent and Kung's 1982 adder are literally function names in Handwired's runtime [PT05, PT26]. Others are found lying on a windowsill, picked up by someone who never knew who set them down. Handwired never mentions McCulloch, Pitts, Kleene or Siegelmann [FR22], yet it is built from the same parts. Persistence here is less about holding on through decades of exile than about **holding on through correction**: keeping an idea while letting other people strike out the parts that were wrong. The bible gives us that at three speeds: a biological belief that held for about sixteen years, a lab belief that held for about two months, and a performance claim that held for a few hours [E1, E4, JS21].

**The narrator.** Unseen, unnamed, not a real person. The house default: a distinguished British man in his forties or fifties, *not elderly*, measured and warm, wry, curious, precise; a teacher who loves a good mechanism and enjoys being caught out by one. He must not be any of the voices already in use (`MlHIkPdx2ZF9MhznglHQ`, `EapdDtSsMC291mjfSNe7`, `cjVigY5qzO86Huf0OWal`) and must never imitate a real person. He speaks in the first person only as a guide (*Hold that number*). He never claims to know anyone's motives. When the record is silent, he says so.

---

## 2. The hands (who we follow)

General rule: **no likeness of any living person** (bible §3). Living people appear as hands, generic desk silhouettes or text cards. Machines clack, never chime.

| Hand | Seen | What they believed or did | How long it held | How we show them | Claims / quotes |
|---|---|---|---|---|---|
| **Warren McCulloch and Walter Pitts** | Ch 1; echo Ch 10 | Because neurons are all-or-none, a net is propositional logic. Their units count inputs against a fixed threshold, the structure never changes and nothing learns: every net is designed by hand | As biology, about sixteen years (1943 to the 1959 frog paper, which they co-wrote; reading it as a refutation is later interpretation). As computer science it never ended | Two 1940s silhouettes per the bible's (secondary) notes: a full-bearded man in a suit with a cigarette; a small, shy, bespectacled young man | [FR01, FR03, FR05, FR10, FR11], Q133, Q142 |
| **John von Neumann** | Ch 1 (one beat) | Modelled EDVAC's elements on their neurons | — | A generic 1940s figure or a text card | [FR06] |
| **Stephen Kleene** | Ch 1; payoff Ch 7 | The first great sceptic-and-keeper: found part of the 1943 paper "obscure", proceeded independently, and turned nerve nets into finite automata and regular events | His model outlived his doubt | A generic 1950s academic at a typewriter; the 98-page RAND memo | [FR07, FR08, FR09], Q139, Q140, Q141 |
| **Jack Sklansky; Richard Brent and H. T. Kung** | DD2; tags glimpsed Ch 4 | Two ways to add many numbers at once (1960; 1982). Brent notes that carry-lookahead was unpopular when they published | Signed handoffs: their names are function names in `prefix-networks.ts` | Generic engineers at a bench (no likeness, no biography for Sklansky); paper name tags tied to threads | [PT05, PT26, PT28], Q079, Q080, Q164 |
| **Hava Siegelmann and Eduardo Sontag; Wolfgang Maass and Pekka Orponen** | DD2 (one beat) | A fixed net can simulate any Turing machine, given unbounded precision. Dissent: small analog noise drops it to a finite automaton (contested emphasis) | Contested; both sides shown | Chalkboard text cards only | [FR13, FR14, FR15], Q144 |
| **Glenn Fiedler** | DD2 (one beat) | *Fix Your Timestep!* (2004), on the spiral of death; he carries a remainder and clamps a long backlog | A design tradition, not a refutation | Title card only | [HL26, HL27], Q162 |
| **Rich Sutton; Rodney Brooks** | DD3 | Learning beats built-in knowledge; Brooks thinks Sutton is wrong | The fuse lit in 2019 is still burning: dominant, not consensus | Text cards | [FR20], Q152, Q153, Q154 |
| **Cheng Lou** | Every chapter from Ch 2 | Author and sole commit author; decides the runtime options; asks the lab's questions | June to October 2026 and still open | **Only hands, a laptop and a lamp.** Never captioned as a portrait; no features | [PJ05, PJ08, PJ23, PJ24], Q099 to Q106 |
| **The second hand at the keyboard** | Glimpsed Ch 2; named Ch 5 | Coding agents: 756 of 825 commits co-credit Claude Code; the reassessment's writer, an AI agent by its own account | — | A second paper hand beside Cheng's; no face, no words of its own except documents the repo attributes to it | [PJ08, PJ21, PJ22], Q115 to Q118 |
| **The red pencils** | Ch 2, Ch 5, Ch 7 | Anonymous reviewers: a reader who followed the tutorial from a clean copy, four readers without background, the same-day review that walked back a GPU claim | — | Paper-cut hands with red pencils | [CB17, JS21] |
| **The strangers** | Cold open; Ch 9 | Hacker News commenters: "regular JavaScript" is really a DSL; four and a half gives eleven; why? | — | **Never depicted.** Text cards attributed to *a Hacker News commenter* | [PJ03, PJ26, PJ27], Q130, Q131, Q132 |
| **Later builders of compiled nets** | Ch 9; DD1 | RASP (2021), Tracr (2023), looped transformers (2023), Percepta (2026), Bournez's two-ReLU gate (2026) | — | Text cards on a windowsill: unsigned handoffs, except RASP and Percepta, which the repo cites | [FR16 to FR19, FR22, FR24], Q149, Q158 |

**Thematic rule:** the critics and correctors are *part of the relay*. Every claim Handwired keeps is one that survived a red pencil, and the film never casts anyone as a villain.

---

## 3. Chapter list (24:00)

About 95 words a minute on average; the deep dives run thinner so their machines can work in silence.

| # | Chapter | When | Min | Words | Hands | The belief and its fuse |
|---|---|---|---|---|---|---|
| P | **Four and a Half** | flash across 1943 to 2026 | 1:00 | 85 | the 1943 hand, Cheng's hands, a stranger's pencil | — |
| 1 | **The First Hand-Drawn Nets** | 1943 to 1959 | 1:30 | 145 | McCulloch and Pitts, von Neumann, Kleene | *The brain is two-valued logic*: about sixteen years as biology [E1] |
| 2 | **A Recipe Card, Read Every Frame** | June 2026 | 1:45 | 175 | Cheng; the second hand glimpsed; four readers | Three names in four months [PJ07] |
| 3 | **Two Ramps and a Lever** (DEEP DIVE 1) | the README example | 4:00 | 350 | Cheng's README; Bournez on a windowsill | "Exact" means exact for declared FP32 values, not float64 [EX01] |
| 4 | **One Big Matmul, Sliced Thin** | compiled form; HandwiredOS | 1:30 | 145 | builder code as the hand; the measuring hand | *The GPU will be faster*: not for HandwiredOS, 27 times slower [CM08] |
| 5 | **The Quiet Months and the Reckoning** | July to mid-September 2026 | 2:00 | 200 | the second hand named; the reassessment; Cheng's decisions | *Established conclusions*: about two months [LB02, LB03] |
| 6 | **The Clockwork That Cannot Stop Early** (DEEP DIVE 2) | host loop, springs, patterns | 4:30 | 420 | Sklansky, Brent and Kung (signed); Fiedler; Siegelmann and Sontag | *A net cannot loop*: answered by moving the loop outside [Q015, FR25] |
| 7 | **Four Days in October** | 13 to 16 October 2026 | 2:00 | 200 | Cheng's questions; the same-day review; Kleene's payoff | *Clearly faster*: a few hours [JS21] |
| 8 | **Unfreezing** (DEEP DIVE 3) | gradients; the learned gallery | 3:15 | 320 | Sutton and Brooks; Cheng's refusal to snap | *Fully differentiable*: contested inside the repo itself [DG03] |
| 9 | **Strangers with Pencils** | 15 to 27 October 2026 | 1:15 | 115 | three Hacker News commenters; Tracr's authors | *Regular JavaScript*: contested, and the docs agree with the critic [PJ03, Q014] |
| 10 | **One More Neuron** | what is still open | 1:15 | 125 | the recovery parser; the ledger; the viewer | The Bitter Lesson's fuse still burns [FR20] |
| | **Total** | | **24:00** | **≈ 2,280** | | |

Moods: P winterBlue → candleAmber; Ch 1 candleAmber; Ch 2 parchment → dawnGold; Ch 3 parchment plates with labGreen machine light; Ch 4 serverCyan; Ch 5 winterBlue; Ch 6 candleAmber (the clockwork room); Ch 7 emberRed into dawnGold; Ch 8 dawnGold; Ch 9 duskRose; Ch 10 duskRose → dawnGold.

---

## 4. Recurring narrative and visual devices

1. **The Copper Hinge (the baton).** A short length of copper wire with one bend, flat and then climbing at forty-five degrees: the shape of a ReLU, and an echo of HandwiredOS's own *one copper wire under the dock* [OS18]. It passes from hand to hand on twos, and the cuffs of the hands holding it change by era. **Binding:** a hinge with a **paper name tag** tied on is a *signed handoff*, an idea the repo itself cites (Sklansky and Brent-Kung in the runtime; RASP and Percepta in lab notes). Anyone the bible does not record as cited by the repo gets no tag (Fiedler, Bournez, Sutton, Brooks); McCulloch, Pitts, Kleene, Siegelmann, Sontag, Giannou and Tracr are confirmed absent from it. A hinge with **no tag** is an *unsigned handoff*: the shape is shared, but Handwired never mentions the earlier hand [FR22]. Unsigned hinges are never passed hand to hand; they lie on a windowsill and are picked up later. The narrator says this out loud the first time (Ch 1) so the audience can read the device for the rest of the film.

2. **The Fuse of Belief.** This answers *how long did people think that?* A lit cord strung between two posts, with date stamps at each end; its length is set by real elapsed time on a log scale (so sixteen years, two months and three hours can share one proscenium). Believers stand at the start post, the red pencil at the far one. Fuses used, durations only from the bible:
   - *Neurons are two-valued logic*, as biology: 1943 to 1959, about sixteen years [FR10, FR11, E1]. Labelled *as biology*; as computer science the cord never reaches its post.
   - *Established conclusions, take these as given*: July to 3 September 2026, about two months [LB02, E4].
   - *One evaluation per frame* in HandwiredOS: until 15 September 2026 [HL17].
   - *The GPU is clearly faster* (paraphrase, never quoted): written 09:01 on 13 October, walked back by a review the same day [JS21]. This fuse flashes out in a single breath.
   - *General methods win*: lit 13 March 2019, still burning on 27 October 2026, Brooks at the far post [FR20].

3. **The Red Pencil.** Every correction in the film is made by a visible hand holding a red pencil (low chroma, emberRed rim): Kleene's margin, the reassessment's strike-throughs, the reader following the tutorial, the review that walked back a claim, the stranger's pencil at four and a half. Persistence is shown as the hand that *keeps the page* after the pencil has been at it.

4. **The Window Calendar.** The repo's commit history as the lit windows of a tall paper building at night: one pane per commit, a column per month [PJ09]. June: 72 lit panes. July: 6. **August: entirely dark, with snow on the sill.** September: 58. October: 689, with 683 crowded into four columns for 13 to 16 October, panes lit in every hour of the clock. **Binding:** pane ← commit, exact counts. The building returns in P (a glimpse), Ch 2 (June), Ch 5 (the dark month), Ch 7 (the blaze) and Ch 10 (no new panes after 16 October: `257856e` is still the head on 27 October [PJ17]).

5. **The Two Hands at One Keyboard.** Cheng's generic hand and a second paper hand beside it. In Ch 2 the second hand is seen and not explained (a planted question). In Ch 5 the narrator names it once, neutrally [PJ08, PJ21], bible §9. The second hand never speaks words of its own on screen except documents the repo attributes to it (the reassessment, Q115 to Q118).

6. **Question Tags.** Declarations in Handwired are promises tied to wires (*0..16,384*, *grid 1/64*, *one-hot*) [PR11, EX04]. The film borrows the form: each open question is a paper tag tied to a wire strung across the top of the frame. When a question is answered, its tag is cut free and drops onto the copper hinge. A tag that stays tied at the end is an honest open question (§11).

7. **The Ledger.** `lab/status.md` as a clerk's ledger with drawers labelled *Known issues*, *Open decisions*, *Still open*, *Parked and deferred*, ten struck-through claims, and two sealed archive drawers labelled with the tags [LB03, LB14, LB26 to LB28]. Ch 5 and Ch 10.

8. **Teaching machines as the things being handed on.** All built from the bible's art-department list (§4 of the bible), every visual variable bound to a real quantity:
   - two ramps and a lever; both branches running; the sign-cascade lens train; the boolean detent (DD1)
   - tags on wires; the source-table pigeonholes; the builder ribbon (Ch 2, DD1)
   - the matmul loom (Ch 4)
   - the host clockwork; the spring step stamp; the squaring press; the counting rail; the prefix loom; the rank board; the K-slot rack (DD2)
   - the ReGLU valve; the Huber clamp; the learned-gallery stage (DD3)
   - the JSON search map with its RegExp booth (Ch 7); the recovery grid and the ledger (Ch 10)

9. **Match cuts that carry the baton** (style bible §9):
   - the 1943 arrows-and-loops page → the builder ribbon of operation tags (Ch 1 → Ch 2)
   - Kleene's typed memo → a regex pattern written as cells in the JSON search table (Ch 1 echo in Ch 7)
   - the loom's 9,909 threads → HandwiredOS's wallpaper of 9,909 arcs (Ch 4)
   - the window calendar's blazing October → the JSON search map filling with copper cells (Ch 7)
   - the cold open's 1943 hand → the viewer's open hand (P → Ch 10)

---

## 5. Chapter treatments

### P · Four and a Half (0:00 to 1:00)
Shot by shot in §8. A hand-drawn net from 1943, a copper hinge, a 2026 desk, a two-ramp machine that answers ten and twelve, and a stranger's marble at four and a half that brings out an eleven. Title.

### 1 · The First Hand-Drawn Nets (1943 to 1959) · 1:30 · ~145 words
- **1943.** A lamp over a page of arrows and loops. McCulloch and Pitts read as text from their abstract: "Because of the “all-or-none” character of nervous activity, neural events and the relations among them can be treated by means of propositional logic." (Q133, keep the curly inner quotes) [FR01, FR03]. The narrator: their units counted inputs against a fixed threshold, the wiring never changed, and nothing learned. Someone had to design every net [FR05]. The copper hinge appears for the first time, bent sharply, in a 1940s cuff.
- **1945.** One beat: von Neumann's EDVAC report models its elements on their neurons [FR06].
- **1951, the first red pencil.** Kleene at a typewriter, the 98-page RAND memo stacking up [FR07]. Card: "we found the part of their paper which treats of arbitrary nets obscure; so we have proceeded independently here." (substring of Q139). He kept the model anyway and showed such nets are finite automata whose events are exactly the *regular events* [FR07]. *Planted:* the narrator, *Keep that phrase. It will come back as something you've used.* (Paid off in Ch 7.) Caution: say the name *Kleene star* came later [FR09].
- **1959, the frog.** The same two men, with Lettvin and Maturana, show a frog an aluminium hemisphere and a small black disk moved by a magnet [FR10]; card: "the eye speaks to the brain in a language already highly organized and interpreted" (substring of Q142). Fair line: later writers read this as undercutting the logic picture; the paper itself doesn't say so [FR11].
- **Fuse:** *neurons are logic*, as biology, about sixteen years. As computer science it became automata theory and the stored-program computer [E1].
- **The unsigned handoff, said aloud.** The hinge is set on a windowsill. Narrator: *Handwired never mentions any of these people. Nobody handed this to its author. But the shape is the same, and shapes have a way of being found again.* [FR22]

### 2 · A Recipe Card, Read Every Frame (June 2026) · 1:45 · ~175 words
- **3 June 2026, 8:24 in the evening.** The window calendar: one pane lights, commit *Create numeric UI atom lab*, and fourteen minutes later a second [PJ05]. A generic desk, a lamp, two hands, and **the second hand at the keyboard, glimpsed and not explained** (tag tied: *Whose is the other hand?*).
- **Three names.** A paper nameplate is re-lettered twice: *Numeric UI Atom Lab* for three days, *Indirect* for four months, *Handwired* from 6 October [PJ07].
- **The tagline and its correction, side by side.** The README's opening, which Cheng wrote himself [PJ24]: "Turn your regular JavaScript code into a neural net; no training, exact, yet also fully differentiable!" (Q001), immediately paired with the docs: "No tool converts existing JavaScript source into a program." (Q014). The film's stance: you rewrite the logic, by hand, as JavaScript that builds the network (bible §7, debate 1).
- **What a program is**, as a recipe card read top to bottom every frame (bible §5.1):
  - the **source table**: a strip of numbered pigeonholes (the template toggle has 20) [CB09]; "Every number the program reads, or keeps from one evaluation to the next, is a cell of the source table." (Q019)
  - a **wire** is a position, a cell or an operation's result (Q020)
  - **four instructions**: a weighted sum; a ReLU-gated product; a boolean rounding; an index read [PR02], shown as four paper stamps
  - **builder code**: ordinary JavaScript that runs once and appends operation tags to a growing ribbon, so nothing branches or loops at run time (Q017) [CB05]
  - logic as arithmetic on exact bits: NOT is one minus the bit, AND and OR are a ramp over a sum [PR07]
- **The first red pencils on the page.** The tutorial was tested on readers: one followed it from a clean copy, and four readers without background found what tripped them, fixed on 15 October [CB17].
- *Planted:* tag tied, *How does a program loop if it can never stop early?* (paid in DD2).

### 3 · Two Ramps and a Lever (DEEP DIVE 1) · 4:00 · ~350 words
Full step plan in §6. The README's `(a > 4) ? 10 : 12` worked by hand; both branches running; four and a half giving eleven; the honest sentence that turns sixteen operations into two; the lens train that magnifies by 2 to the 149; the odd number 8,388,609; what *exact* means in FP32. One unsigned handoff: Bournez's 2026 paper uses the same two-ramp gate, exact on integers, and Handwired doesn't cite it [FR24, Q158].

### 4 · One Big Matmul, Sliced Thin · 1:30 · ~145 words
- **The pitch, in the README's own easy voice:** "We then collect the + and * and relu into a giant matmul, and either run it on JS or WebGPU, for fun." (Q006). The docs refine it: instructions at the same dependency depth share a layer (Q039) [CM01].
- **TEACHING MACHINE: the matmul loom** [OS02, CM07, OS14]. The builder ribbon from Ch 2 feeds into a loom of **130 thin frames** for HandwiredOS's 130 layers; **9,909 threads**, copper for adding weights, indigo for subtracting; behind the frames, **2,776 ramps** (ReGLU) and **59 detent wheels** (boolean atoms); mostly empty air, because the matrices are sparse. Sheets of sums fuse together and then stop dead at a gate frame: nothing merges across a gate. The longest chain of gates is 71.
- **The program's size, spoken naturally:** two hundred and thirty-four cells, four thousand six hundred and forty-six live operations [OS02]. On screen, exact figures.
- **Match cut:** the camera pulls back and the loom's threads become HandwiredOS's **wallpaper**: one arc per weight, drawn by the page from the compiled program [OS14]. The site's build fails if the landing card's numbers drift from the live program [PJ20]. The Notes window is open on the desk, its last line out of focus (*planted*; paid in Ch 10).
- **The measuring hand.** The honest backend story [CM04, CM08, CM09]: everything in the runtime is JavaScript on the CPU, and *tensor* in its names does not mean a GPU (Q041). Moved to WebGPU in a September lab test, an older, larger HandwiredOS took about 2.2 milliseconds against 81 microseconds on the CPU, about 27 times slower, and its single 6.4-megabyte shader had not compiled after 28 minutes. Card: "HandwiredOS is many different pieces of logic instead of one repeated step, so it has no tree to build." (Q064). *Planted:* tag tied, *So what is a GPU good for here?* (paid in Ch 7).
- **Rounding points, one beat:** a GPU shader compiler, in a lab probe on one Apple machine, simplified the boolean atom away [EX09]; card Q035. That's why the builder records the operations whose FP32 order matters [EX07].

### 5 · The Quiet Months and the Reckoning (July to mid-September 2026) · 2:00 · ~200 words
- **The window calendar dims.** July: six panes. **August: none**, snow on the sill [PJ09]. Narrator: *The record doesn't say why. So we won't guess.* (No motive, no exile story; the honesty is the point.)
- **The second hand, named once** [PJ08, PJ21], bible §9, narrated as: *Of its eight hundred and twenty-five commits, all authored by Cheng Lou, seven hundred and fifty-six credit a coding agent, Claude Code, as co-author. The lab's own history also mentions an earlier design discussion with OpenAI's Codex. This film, for what it's worth, was made with Claude too.* Then: the repo's documents speak of Cheng in the third person, and only passages it marks as his are his words.
- **The July briefs.** A paper card headed *Established conclusions from the design conversation (take these as given)* [LB02]. Attributed to an unnamed design conversation, never to Cheng. **Fuse lit.**
- **3 September, the reckoning.** A reassessment by an unnamed writer, an AI agent's review by its own account (Q115 context). The red pencils come out:
  - **the checker that shared the bug:** for one small program at x = 2, JavaScript returns 3 and the compiled code 4, yet the harness reported zero mismatches, because its own interpreter made the same mistake [LB08]. Card: "The most concerning finding is also concrete: some correctness checks compare implementations that share the same mistake." (Q116)
  - **the loss multiplied by a million:** a learning experiment that failed 0 of 20 succeeded 20 of 20 when every loss was scaled up, because Adam's tiny epsilon had swamped tiny gradients [LB04]. Card: "the old 0/20 result was not sufficient evidence to abandon them." (substring of Q117)
  - **the gradient that depended on word order:** the slope of three times v at zero came out 0 or 3 depending on which operand was written first [DG28].
  - Ten earlier claims struck through in the ledger [LB03]. Fixes land the same morning, 274 tests passing [LB12]. **Fuse burns out:** about two months.
- **The line the film keeps:** "it passes yesterday's interpretation to tomorrow's agents as a constraint." (Q118)
- **14 and 15 September, Cheng decides.** Three runtime questions, the recommended option chosen each time: an index read, one comparison helper, and JavaScript writing the spring matrix [PJ23]. HandwiredOS goes from 5,253 operations in 192 layers to 3,654 in 124, and one evaluation per frame ends [OS03, HL17]. The window calendar relights: 58 panes in September.

### 6 · The Clockwork That Cannot Stop Early (DEEP DIVE 2) · 4:30 · ~420 words
Full step plan in §7. The host loop as a clockwork; springs as a brass plate raised to a power; the 300-step cap and its snap; 359 pixels against bit-identical; loops as counts, trees, tables and the same work on every item, with Sklansky's and Brent and Kung's names tied to the prefix loom; and why this is a design choice rather than a limit of networks (Siegelmann and Sontag, with the contested noise caveat; the repo's own comparison to chain-of-thought tokens).

### 7 · Four Days in October (13 to 16 October 2026) · 2:00 · ~200 words
- **The window calendar blazes.** 683 of 825 commits in four days, panes lit in every hour of the clock [PJ09]. (No claims about sleep or stamina; the panes say it.)
- **Cheng's question,** on a lamplit card, verbatim and lowercase: "is clearly more performant from the gpu parallelism? Then we can make a demo where we search a ton of jsons or something" (substring of Q099). And, before the million-document test, a sentence the film loves for its temperament: "Maybe we should check before we build it." (substring of Q100). The million-document check used hand-written kernels, not the repo's program; the demo stays at a hundred thousand [JS22].
- **TEACHING MACHINE: the JSON search map** [JS01 to JS07, JS11, JS12, JS16, JS17]. A hundred thousand tiny cells in reading order, one document each: 512 characters plus a length [JS03]. One GPU thread per document runs the same small step down its 512 positions [JS04]. The pattern is not code but data, cells in the table: "a new pattern writes cells and changes no program." (Q096). Two clerks walk each strip, right to left and then left to right, because a program can't go back [JS06]. Matches light copper.
- **Kleene's payoff.** The match cut from Ch 1: the typed RAND memo becomes the pattern's cells. The regular events of 1951 are, seventy-five years later, numbers in a table that a hundred thousand threads read at once [FR07, JS07]. (An unsigned handoff; the repo cites Thompson and Cox for the automaton method, not Kleene [JS26].)
- **The fuse that burns out in hours.** The first README draft that morning called the GPU clearly faster for one half of the work; a review the same day found the baselines had run on one of eighteen cores [JS21]. Red pencil. The page's settled verdict: "So neither the search nor RegExp is always faster, and the line gives both times for every pattern." (Q092), and the lab's two-word courtesy: "RegExp is fast." (Q095). The numbers, scoped to one machine: eleven to fifteen milliseconds per keystroke on the GPU; RegExp eight to twenty-eight for ordinary patterns; one backtracking pattern takes RegExp 2.1 seconds and the program about eleven milliseconds [JS11, JS12]. RegExp gets its own little booth, a worker, only so it can be stopped after ten seconds [JS16]. *Pays off* the Ch 4 tag: a GPU helps when one program runs over many documents (Q090).
- **The same evening's shrinking.** HandwiredOS swelled to 21,229 operations, then fell to 4,251 when Notes handed its text back to the browser's own text box [OS04].
- **The go-ahead,** preserved in a commit: "strip 1-4 yeah. Do it quick plz, then publish." (Q103) [PJ12]. The repo goes public on the evening of 14 October [PJ11]. The launch post: "My dear friends, I’d like to show you my latest toy project" (substring of Q104, curly apostrophe) [PJ14].

### 8 · Unfreezing (DEEP DIVE 3) · 3:15 · ~320 words
Full step plan in §7b. Sutton and Brooks frame the bet; the ReGLU valve with real numbers; why decisions are flat; the learned gallery trained with the program's own gradients; Cheng's refusal of the easy fix; what *unfreezing* means and what has not been done (nanoGPT).

### 9 · Strangers with Pencils (15 to 27 October 2026) · 1:15 · ~115 words
- **Reception, as text cards over a duskRose sky** [PJ26, PJ27]. A Show HN on 20 October.
- **The DSL critique:** "this doesn't turn "regular" JavaScript into a NN, it's rather "write your logic in a DSL that creates a neural-net-shaped circuit"" (substring of Q130), attributed to a Hacker News commenter. Fairness: the docs say much the same (Q014 returns), and the lab's trace compiler handles a defined subset of TypeScript [LB09].
- **The payoff of the cold open:** "Lol, if you pass a = 4.5 to their homepage const result = (a > 4) ? 10 : 12 you get 11." (Q131) [PJ27]. Found by hand, on 23 October, nine days after the repo went public. The twist the people angle earns: the landing page had already admitted it, in a comment hidden in its own HTML [PJ19]. Two hands with the same pencil.
- **The why:** "Website is missing the #1 thing I imagine most readers would want to know: why?" (Q132; keep the spacing). The film doesn't answer for Cheng. It points back to what the README itself lists (DD3) and to its own phrase, "for fun" (Q006).
- **A pointer to Tracr** in the replies [PJ27], and Tracr's authors on their own limits, a fair-minded card: "we will likely never compile fully featured language models in Tracr." (substring of Q149).
- No public discussion of the lab, the reassessment or the recovery parser was found by 27 October [PJ28]. The red pencils inside the repo were harder on it than the strangers outside.

### 10 · One More Neuron · 1:15 · ~125 words
- **The last experiment before the pin** [LB19 to LB25, PJ15]. TEACHING MACHINE: **the recovery grid.** A strict JSON parser's tables have about 1,560 entries; about 1,300 are never read by valid input. Train only those, and the parser learns to keep going after a mistake while valid JSON is parsed exactly as before. Card: "JSON is a clear success. A strict parser became a recovering one with no recovery code written, and valid JSON is unchanged by construction." (Q122). On TOML it failed by a rule written down before training: "By the rule fixed beforehand the track failed: gradient descent alone is below the one simple rule on both sets, in every run." (Q123), and the lab's own scoping: "It does not say that training cannot work there." (substring of Q124). The test sets were committed before training [LB25]; the bison track's final test has not run [LB24].
- **The ledger's *Still open* drawer:** "GPU execution, a general JavaScript compiler, learned arbitrary abstractions, and a full learned UI runtime are not delivered by these experiments." (Q125)
- **The Bitter Lesson fuse** still burning across the back of the stage [FR20].
- **The ending** (§9).

---

## 6. Deep dive I: Two Ramps and a Lever (Ch 3, 4:00)

**What it must teach:** how an `if` becomes arithmetic; why both branches always run; why four and a half gives eleven; what a declaration buys and what a false one costs; how a comparison is made exact with no promise at all; and what *exact* means in FP32. Every number below was computed by hand or run in the clone (bible §5.2, *(run)*).

**Machines:** (a) *two ramps and a lever*; (b) *both branches run*, two conveyor arms and a pair of shutters; (c) *tags on wires*; (d) *the sign-cascade lens train*; (e) *the boolean detent*. Parchment plates carry the exact formulas.

| Step | Picture (machine) | What the viewer learns | Numbers on screen | Claims / quotes |
|---|---|---|---|---|
| 1 | Parchment plate: `const result = (a > 4) ? 10 : 12`. In plain JavaScript, a single arm swings; the untaken one is never touched | In JavaScript only the chosen side runs | — | [TE15] |
| 2 | Two hinged boards rise from the plate: flat, then a 45° climb, corners at **4** and **5**. A marble at `a` reads each board's height; a lever shows the difference. The README's comment appears verbatim: "// Math.max(0, x) is ReLU. For an integer a, above4 is 1 if a > 4, and 0 otherwise" | A ReLU is a ramp; the difference of two ramps one step apart is a step | marble at 3: 0 − 0 = 0; at 4: 0 − 0 = 0; at 5: 1 − 0 = 1; at 6: 2 − 1 = 1; at 100: 96 − 95 = 1 | [TE01, TE02], Q003 |
| 3 | Two conveyor arms, always moving, carry tiles **10** and **12**. Two shutters: one opens by `above4`, the other by `1 − above4`. Card: "// Both branches compute, and above4 picks one" | Both branches always compute; a 0/1 selector picks | result = above4 × 10 + (1 − above4) × 12; at 5: 10; at 3: 12 | [TE01], Q004, Q005 |
| 4 | A tile marked ∞ rides the unchosen arm; its shutter is shut, yet a grey NaN tile drops out | The unchosen side still matters: zero times infinity is not a number | 0 × ∞ = NaN | [TE11], Q082 |
| 5 | **The marble at 4.5.** Board one reads 0.5, board two 0; the lever reads 0.5. Both shutters stand half open; half a 10 and half a 12 fall together: an **11** tile neither arm carried | The trick only works on the corners: whole numbers | 0.5 × 10 + 0.5 × 12 = 11; at 4.25: 11.5. JavaScript says 10 | [TE03] |
| 6 | Seen from the side, the lever's reading is a clamp: flat, ramp, flat. The narrator: integers sit exactly on the two corners, the whole trick and the whole caveat. A tag with a red question hangs off the edge: *What about very large numbers?* → in FP32, at 16,777,222, the answer is **8** | FP32 is a second limit: integers are exact only up to 2 to the 24 | 2^24 = 16,777,216; a = 16,777,222 gives above4 = 2, result 8 | [TE03, PJ19, EX02], Q058 |
| 7 | **What the runtime really builds.** The comparison helper needs a range tag on the wire, or it refuses. Tie on the tag *grid 1*: the machine rebuilds as two parts: `ramp = relu(5 − a)`, `bit = relu(1 − ramp)` | An honest declaration lets the compiler use the cheap shape | **2 operations, 2 layers.** a = 5: ramp 0, bit 1 → 10. a = 4: ramp 1, bit 0 → 12. a = 3: ramp 2, bit relu(−1) = 0 → 12 | [TE04, TE05, TE06] |
| 8 | **The false tag.** Tie *grid 1* on a wire carrying 4.5. The gear slips silently: 0.5, then 11. Then the validator's red card: `wire 0 must be a multiple of 1, got 4.5`. Card: "Declarations are promises from the caller, not proofs." | A tag is a promise; a false one gives a wrong answer, and validation can catch it | bit 0.5, result 11 | [TE07], Q029, Q030 |
| 9 | **No promise at all: the lens train.** Keep `d = a − 4`. Six lenses magnify it (by 2^14, then by 2^24 five times), each followed by a stop at height 1; a seventh stage and a flip give the bit. A hairline becomes a full bar | Without any declaration, an exact comparison still exists, at a price | **16 operations in 15 layers**; total magnification **2^149**, the gap from FP32's smallest number to 1; at 4.5 it answers **10**, correctly | [TE08], Q033 |
| 10 | The two machines side by side; a tag falls away. The narrator's sentence for the ear: one honest sentence about your input turns sixteen operations into two | Declarations are where cost goes | 16 → 2 (for >) | [PR12] |
| 11 | **The detent (short).** A fine ruler slides onto a giant ruler whose start mark is the odd number **8,388,609**; the score snaps to a tick and slides back. Exactly one half snaps *up*, because the start mark is odd | The boolean atom rounds a score to a bit in one operation, and it's only a shortcut | 0.5 → 1; 0.49999997 → 0 | [PR08], Q056 |
| 12 | **What exact means.** Plate: "Exactness means equality to the stated FP32 calculation, ignoring the sign of zero, not equality to arbitrary JavaScript float64 arithmetic." One example, the 1732-pixel window: `f(f(1708) × f(1/244))` = 6.999999523…, so *columns ≥ 7* is false where float64 says 7 | Exact is defined against FP32, not against float64 JavaScript | 6.999999523162842 vs 7 | [EX01, EX03], Q036, Q057 |
| 13 | **The unsigned handoff.** On a windowsill, a text card: in April 2026 a paper by Olivier Bournez used the same two-ramp gate, exact on integers: "For every integer u, one has Gate(u)=0 if u≤0 and Gate(u)=1 if u≥1". No tag tied: not lineage | The same shape is found independently | — | [FR24], Q158 |
| 14 | Back on the machine: the tests as a wall of tiny ticks | The comparisons are checked against JavaScript's own | 4,402 checks in the comparison tests; the runtime suite 174 tests, 155,853 checks, about 2 s | [TE14, EX11] |

**Pacing:** steps 2 to 5 get the most silence (the marble rolls; the 11 tile needs a full second to land). Step 9's lens train runs at one lens per beat of the cue. The plate in step 12 holds for at least four seconds.

---

## 7. Deep dive II: The Clockwork That Cannot Stop Early (Ch 6, 4:30)

**What it must teach:** why a Handwired program cannot stop early; how the host loop around it supplies time and state; how springs of any length cost the same fourteen operations; why the order of the loop makes a screen identical at any frame rate; how loops become counts, trees, tables and the same work on every item; and why this is a design choice, not a ceiling on what networks can do.

**Machines:** the host clockwork; the spring step stamp and squaring press; the counting rail; the prefix loom (with name tags); the rank board; the K-slot rack.

| Step | Picture (machine) | What the viewer learns | Numbers on screen | Claims / quotes |
|---|---|---|---|---|
| 1 | The recipe card from Ch 2, with no *stop* instruction anywhere. Card: "The program runs every operation on every frame and can't stop early, so a loop becomes a count, a tree, a table, or the same work on every item." The tag from Ch 2 (*How does a program loop?*) trembles | No jump, break or repeat exists; sizes are fixed when building | — | [HL01], Q015, Q066 |
| 2 | **The host clockwork.** A 1/64-millisecond ruler; event tokens stamped with times dropped into a tray; a frame request; the plan; cells written into the pigeonholes; one turn of the evaluation; the next-state cards copied back; DOM writes from outputs only. The page asks for another frame only while the clock runs | The loop lives *outside*, in JavaScript; each evaluation is one turn | — | [HL02 to HL06], Q018, Q026, Q027 |
| 3 | **The spring stamp.** A 2×2 brass plate `0.99536 · 0.00352 / −1.16 · 0.88`. Cards −300 and 0 go in; −298.608 and 348 come out: a window at 400 pixels starts toward 700 | One 4 ms Euler step is a 2×2 matrix; n steps are its nth power | v′ = 348 px/s; e′ = −298.608; drawn at 401.392 | [SP02, SP03], Q044 |
| 4 | **The squaring press.** JavaScript folds the plate onto itself (M², M⁴, …); 300 steps take 8 squarings. The program's fourteen small levers barely move. Card: "14 operations in 3 layers for any step count." Stiffness and damping never enter the program | JavaScript counts; the program pays a fixed price | 300 = 100101100 in binary; 14 ops / 3 layers | [SP01], Q043, Q045, Q046 |
| 5 | **The cap.** A 300-tooth ratchet with a release pawl: past 300 steps (1.2 s) in one frame, the pawl drops and every object snaps to its destination at rest. A Fiedler title card: "It’s what happens when your physics simulation can’t keep up with the steps it’s asked to take." (curly apostrophes). Fair: Fiedler carries a remainder and clamps a long backlog; another guideline carries past the cap; Handwired snaps to keep a static bound. A disagreement, not a refutation | A fixed maximum needs a named fallback | 300 × 4 × 64 = 76,800 grid steps, under 2^24; the cap is about 72 times a 60 fps frame's steps | [HL08, HL09, HL23, HL26, HL27], Q049, Q162 |
| 6 | **Two recordings of the same session**, a 10 fps strip and a 120 fps strip. In the familiar order (inputs first, then catch up), the windows drift **359 pixels** apart. In Handwired's order (springs step to each event's time first, state written back only at events and settle checks), the two strips lie on top of each other, identical in every bit, *in the repo's tests* | The order of the loop is behavior | 359 px vs identical (in the tests, events in order, no snap) | [HL18, HL11], Q047, Q075, Q076 |
| 7 | **The dress rehearsal.** Each display frame previews from the last commit (1, 6, 10, 14 steps) and is thrown away into a carbon-copy tray, until a settle check commits at exactly 16 | The frame you see is a preview | 1, 6, 10, 14 → 16 | [HL10, HL14] |
| 8 | **Loops as counts: the counting rail.** Pegs at 40, 80, 80, 140, 180; a pointer bar at 90; three flags drop, the tally clicks to 3. That's findIndex, done by counting, because the test flips only once | When a test flips once, *where* is a count | bits 1 1 1 0 0 → 3; 195 ops in 3 layers at 64 rows vs 447 in 34 | [PT08, PT09] |
| 9 | **Loops as trees: the prefix loom, with names tied on.** Tabs **3 1 4 1 5 9 2 6**. Brent-Kung joins them 11 times in 4 levels; Sklansky 12 times in 3, one tab fanning into four threads. The totals appear: **3 4 8 9 14 23 25 31**. Paper tags on the threads: *SKLANSKY 1960*, *BRENT · KUNG 1982* (signed handoffs: function names in the runtime). Cards: Q079, Q080; and Brent's own note: "At the time of publication the use of carry-lookahead in VLSI designs was unpopular." | Associativity is the licence to regroup; old adder designs compute running totals | 11 joins / 4 levels; 12 / 3 | [PT02, PT05, PT15, PT26, PT28], Q078, Q164 |
| 10 | **The twist, on the CPU.** A stopwatch: the plain loop wins. Card (Q062, verbatim): "On the CPU executor, the tree takes longer than the loop, with either network." Then the second twist: at 10,000 rows the tree drifts 0.26 px, the loop 5.67 px. Grouping is part of the answer | Trees can be slower on a CPU and more accurate in FP32 | 0.26 px vs 5.67 px | [PT06, PT14], Q061, Q062 |
| 11 | **Sorting without sorting: the rank board.** Keys 30 10 30 20 in a 4×4 grid of flip tiles; rows sum to **2 0 3 1**; cards slide to their slots without a single swap. Card: "that position is a count: how many items come before this item." | Sort becomes counting | 4,096 ops in 3 layers at 64 items | [PT16], Q069 |
| 12 | **The same work on every item: the K-slot rack.** Eight items, visible bits 0 1 1 0 1 0 1 1, running count 0 1 2 2 3 3 4 5; three slots take items 1, 2, 4. A brass card: the capacity is fixed, and Monitor says so: "Only 64 rows are drawn at a time." | filter-and-slice into a fixed number of DOM nodes; every maximum needs a fallback | items 1, 2, 4 | [PT18, PT20], Q070, Q072, Q074 |
| 13 | **A chalkboard beat: is this a limit of networks?** Card for Siegelmann and Sontag: a fixed net can simulate any Turing machine, if its numbers have unbounded precision, Q144 on screen. A second card, opposite and equally lit: Maass and Orponen, small analog noise reduces such nets to finite automata, emphasis contested. Then FP32: finite. One evaluation is a fixed, finite circuit; the host loop supplies the time | The cap is a design choice of finite numbers plus an outside clock | ~1,000 then 886 processors | [FR13, FR14, FR15, FR25, E2], Q144 |
| 14 | **The repo's own comparison.** Each frame's next-state cards are fed back into the slot like a token appended to a sentence. Card: "Handwired has the same structure. One frame is one evaluation of a fixed-depth circuit, and the next-state write-back plays the role of the appended token". Narrator: it's not a transformer and has no attention; the comparison is the repo's own | The loop outside the net is how chain-of-thought gets its steps, too | — | [FR25, FR22], Q127 |

**Pacing:** the spring stamp and squaring press (steps 3 and 4) share one continuous shot. The two recordings in step 6 need a held split-screen of at least five seconds. Steps 8 to 12 move briskly, one machine per beat, so the four shapes of a loop feel like a set.

### 7b. Deep dive III: Unfreezing (Ch 8, 3:15)

**What it must teach:** what a gradient is in a handwritten program; why a ReLU gate passes or blocks learning; why decisions are flat; how the learned gallery trains with the program's own backward pass; what *unfreezing* means and what has not been done.

**Machines:** the ReGLU valve; the Huber clamp; the learned-gallery stage.

| Step | Picture (machine) | What the viewer learns | Numbers on screen | Claims / quotes |
|---|---|---|---|---|
| 1 | **The fuse that still burns.** Sutton at one post: "We have to learn the bitter lesson that building in how we think we think does not work in the long run." Brooks at the other: "I think Sutton is wrong for a number of reasons." Equal light. Handwired's copper hinge sits on the cord between them | The bet: hand-written exact programs that are also differentiable | 13 and 19 March 2019 | [FR20, E3], Q153, Q154 |
| 2 | The README's own playful line: "unfreezing the weights and train them (what does that even do? Let's find out!)" | The question the project asks of itself | — | [PJ04], Q010 |
| 3 | **The ReGLU valve.** A left value flows through an opening of `max(0, gate)`. Forward: w = 0.5, g = 0.25, b = −0.1 → gate 0.15, output 0.225. Backward arrows: to w, 0.45; to the gate, 1.5 | Gradients flow back through an open valve | y = (3w) × max(0, g + b); ∂y/∂w = 0.45; ∂y/∂g = 1.5 | [DG01] (derived) |
| 4 | Turn b to −0.4: the gate reads −0.15, the valve shuts, the output is 0, and **every backward arrow vanishes**. Card: "Without any decay, a unit whose gate has closed gets no gradient and stays shut" | A closed unit can't learn its way back open; a tiny decay keeps most of them from staying shut | weight decay 2e-7 (said: two ten-millionths) | [DG01, DG11], Q108 |
| 5 | **Decisions are flat.** The two-ramp lever from DD1, now with a slope gauge: at whole numbers it reads 0. Card: "Backpropagation differentiates the intended real arithmetic, not literal floating-point rounding." Then Q110 | Differentiable as real arithmetic; the decisions are flat. Hard selectors give zero or useless gradients | slope 0 at integers | [DG03, DG15, DG16], Q052, Q110 |
| 6 | **The learned gallery stage.** A 5:4 stage with ten hand-drawn rectangles (the *Story* preset). Photos start piled near the centre as small squares, from a seeded random start | The only demo whose weights are trained; its only input is its weights | 244 weights; 6,320 operations in 8 layers | [DG04, DG05, DG06] |
| 7 | **Who goes where** is decided by ordinary JavaScript, a min-cost assignment, before each step. A small clerk with a seating chart | The network doesn't choose which photo; it learns where | — | [DG09] |
| 8 | **The Huber clamp.** Each photo edge pulls on a bias with a spring whose force caps at 0.08: a photo far off pulls no harder than one 0.09 off. Narrator: far-off photos vote; they don't shout | The loss's gradient, worked for one weight | ∂Loss/∂b = (1/40) Σ clipped edge errors; Adam's first step: 0.5 → about 0.492 | [DG07, DG26, DG27] |
| 9 | The photos fan out to their rectangles over one to three seconds; a loss chart falls | Training runs live, with the program's own backward pass | 600 steps a second; about 0.2 ms a step in Bun | [DG08, DG10] |
| 10 | **Cheng's refusal.** A first answer snaps the sketch to a grid with ordinary code. A hand pushes it away. Card, verbatim: "the spirit of the gallery is to learn something." Since 14 October, the photos line up only through a penalty: "No code moves a rectangle or a photo onto a line: the photos line up only because training lowers the penalty." A slider, *Misalignment penalty* | Persistence as a design rule: make it learn, don't fake it | slider off to 8%, default 4% | [DG13], Q105, Q106, Q107 |
| 11 | **Honest scope.** The gallery is a small generic network compiled as a circuit, not a hand-written program unfrozen [DG06]. Unfreezing a hand-written number means declaring it a cell; in one lab test, about two thirds of drag frames were solved in one gradient step [DG20]. And the README's second dream, a frozen program attached to nanoGPT and trained end to end, is written with a question mark and **has not been done** | What learns, and what is still an aspiration | 63.6% one-step | [DG06, DG20, DG22], Q011, Q166 |

**Pacing:** step 4 (the valve closing) is the chapter's quiet moment; let the arrows fade on twos with no narration for a beat. Step 9 needs fifteen seconds of mostly music while the photos fan out.

---

## 8. The first 60 seconds, shot by shot

Mood winterBlue → candleAmber. Score: one sustained low note, then a dry relay clack on the first handoff and on each marble landing (no bells, no chimes). Hands on twos; flame and haze on ones. About 85 words.

| Shot | Time | Picture | Narration | Beats / on screen | Claims |
|---|---|---|---|---|---|
| **P-01** | 0:00 to 0:09 | Black with grain. A desk lamp catches on a parchment page of 1943 arrow-and-loop net diagrams. A 1940s cuffed hand, generic, draws one last arrow in ink and lifts the pen | L1 (from 0:03): *In 1943, two men sketched nerve nets as little machines of logic.* | Date stamp **1943**. The pen lifts on "logic" | FR01, FR03 |
| **P-02** | 0:09 to 0:17 | Close: the inked arrow lifts off the page as a short copper wire with one bend, flat then climbing (the **copper hinge**). The hand sets it on a dark windowsill. It lies there, faintly lit | L2: *Nothing in them learned. Someone chose every connection, by hand.* | Hinge settles on "hand". No name tag (unsigned) | FR05 |
| **P-03** | 0:17 to 0:28 | Slow dolly with parallax across the paper building at night (the **window calendar**): most windows dark, one column blazing. Inside a lit window, a generic modern hand picks up the hinge from the sill. A laptop's glow; a second paper hand beside the keyboard, half in shadow | L3: *Eighty-three years later, a programmer named Cheng Lou built a small desktop the same way.* L4: *Every weight in it is written, not trained.* | Date stamp **2026**. The second hand is glimpsed, unexplained | OS01, Q085 (paraphrased, not quoted) |
| **P-04** | 0:28 to 0:42 | On a parchment plate: `(a > 4) ? 10 : 12`. Two hinged paper boards rise from it, corners at 4 and 5, and a lever between them. A marble rolls to 5: a **10** tile drops. Rolls to 3: a **12** tile | L5: *Ask it a simple question. Is a number bigger than four? If so, ten. If not, twelve.* | The 10 lands on *ten*, the 12 on *twelve* (clack on each) | TE01, TE02 |
| **P-05** | 0:42 to 0:52 | A stranger's hand with a red pencil (generic, no cuff detail) sets the marble down exactly halfway between the corners. Both shutters stand half open. A tile falls out that neither arm carried: **11** | L6: *Nine days after it went public, a stranger tried four and a half.* (beat) L7: *It said eleven.* | 0.8 s hold before L7. The 11 lands just after *eleven* | TE03, PJ27 |
| **P-06** | 0:52 to 1:00 | Lamp change to black. **Title** cut from black card against a backlit haze: **EVERY WEIGHT BY HAND**; subtitle in Cormorant italic, *How Handwired works, and the hands that carried its ideas*. A paper tag on a wire swings into the top of frame: *Why eleven?* | — (music only) | The first **question tag**. Title holds 4 s | — |

Word count: L1 to L7 ≈ 75 words; the remaining time is music and silence. The cold open shows the stranger's discovery (23 October, nine days after the repo went public on the evening of 14 October, Pacific) as a flash-forward; Ch 9 gives its date and context [PJ11, PJ27].

---

## 9. The ending (last ~45 seconds of Ch 10)

| Time | Picture | Narration | Notes |
|---|---|---|---|
| 23:15 | The window calendar from outside, at night. No new panes after 16 October; the last lit column glows | *On the twenty-seventh of October, the last change was still the one from the sixteenth.* | [PJ17] |
| 23:25 | Inside the window: the HandwiredOS desk (paper-beige, dot grid, copper arcs of the wallpaper). The Notes window, out of focus since Ch 4, racks into focus. Its last line, set in the window's own type | *And in the Notes window of that little desktop, the last line of the to-do list reads,* "Wire one more neuron by hand". | Q088 verbatim, spoken with quotation marks [OS18] |
| 23:38 | The copper hinge lies on the desk beside the lamp. All the windowsills from the film appear in a slow lateral pan, each with its object: the 1943 page, Kleene's memo, the adder tags, the chalkboard card, the Tracr card. The tags that were answered lie on the hinge; one stays tied: *What does unfreezing even do?* | *It is a to-do, not a done. Like most of the good ideas here, it's waiting for the next pair of hands.* | The last question tag stays tied: the honest open end [DG22, Q125] |
| 23:50 | An open, generic hand rises into the lower third (the cold open's 1943 hand, now uncuffed: the viewer's). The hinge is placed in it. Lamp change to black | — | Final clack, a single relay closing |
| 24:00 | Black. End card: "Wire one more neuron by hand" in small type, then credits (sources, the repo pin `257856e`, MIT licence). | — | No logos; only the parody "O'RLY?" if any imprint appears |

---

## 10. Emotional arc

| Stretch | Feeling | What produces it |
|---|---|---|
| P | **Intrigue, a small itch** | A machine that answers a number nobody offered it |
| Ch 1 | **Wonder at old hands** | Lamplight, ink, a sceptic who kept the model; the first unsigned handoff |
| Ch 2 | **Delight, the fun of a recipe** | Four instructions, a ribbon of tags, a toggle with 20 pigeonholes |
| Ch 3 | **Mastery** (*I could work this out myself*) | The marble, the shutters, the honest tag, the lens train |
| Ch 4 | **Awe at scale, then a pinch of humility** | The 9,909-thread loom becoming wallpaper; the GPU 27 times slower |
| Ch 5 | **Chill, then respect** | The dark August; three concrete mistakes found and fixed the same day; a quiet decision |
| Ch 6 | **Ingenuity, the pleasure of a clever constraint** | Fourteen levers for any spring; two recordings that lie on top of each other; names from 1960 and 1982 still at work |
| Ch 7 | **Exhilaration, then a grin** | Four columns of light; a hundred thousand documents per keystroke; a claim walked back by lunchtime; "RegExp is fast." |
| Ch 8 | **Tenderness** | A shut valve that can't reopen itself; photos fanning out; a refusal to cheat |
| Ch 9 | **A sting, then fairness** | Strangers' pencils; the hidden comment that had already admitted it |
| Ch 10 | **Open-ended resolve** | A clear success and a failure written down in advance; one more neuron; the hinge in your hand |

The low point is Ch 5 (the dark month and the zero-mismatch checker that was wrong). The high point is Ch 7's blaze. The ending is quieter than both: the film closes on an invitation, not on a victory.

---

## 11. Curiosity: where it is planted and where it pays off

| # | Planted (question tag) | Where | Paid off | Claims |
|---|---|---|---|---|
| 1 | *Why eleven?* | P | DD1 step 5 (the shutters), step 8 (the false tag); Ch 9 (the stranger, and the hidden comment that had already admitted it) | TE03, TE07, PJ19, PJ27 |
| 2 | *Whose is the other hand?* | P, Ch 2 | Ch 5, named once, neutrally | PJ08, PJ21 |
| 3 | *How does a program loop if it can never stop early?* | Ch 2 | DD2, all fourteen steps | HL01, Q015 |
| 4 | *Keep that phrase: regular events* | Ch 1 | Ch 7, the regex pattern as cells | FR07, JS07 |
| 5 | Name tags on threads glimpsed in the loom (*SKLANSKY*, *BRENT · KUNG*) | Ch 4, background | DD2 step 9 | PT05, PT26 |
| 6 | *So what is a GPU good for here?* | Ch 4 | Ch 7, one program over 100,000 documents | CM08, Q090 |
| 7 | *Why the odd number 8,388,609?* | DD1 step 11 (planted and paid within thirty seconds) | same step | PR08 |
| 8 | The dark August column | Ch 5 | **Not paid with a motive.** Paid with what came next (September's 58 panes, October's blaze). The narrator says the record is silent | PJ09 |
| 9 | The out-of-focus Notes window | Ch 4 | The ending | OS18, Q088 |
| 10 | *Why?* (the stranger's question) | Ch 9 (and implicitly P) | DD3's README use-cases and "for fun" (Q006); and honestly left open at the end | Q132, Q010, Q011 |
| 11 | *What does unfreezing even do?* | DD3 step 2 | **Partly paid** (the gallery, drag-knobs); the end-to-end version stays tied in the final frame | DG20, DG22 |

---

## 12. Five unforgettable images

1. **The eleven tile.** A marble sits exactly between two paper ramps; both shutters stand half open; a tile marked 11 drops out that neither conveyor ever carried. (P, DD1)
2. **The dark month.** A tall paper building of lit windows, one per commit: June bright, July six lamps, August a column of black glass with snow on the sills, then October blazing in four columns, lit in every hour. (Ch 5, Ch 7)
3. **The loom that becomes wallpaper.** A hundred and thirty thin frames strung with 9,909 copper and indigo threads, sheets of light stopping dead at each gate frame; the camera pulls back and the loom is the desktop's wallpaper, the program drawing itself. (Ch 4)
4. **Fourteen levers and a folding plate.** A brass 2×2 plate folds onto itself eight times to make 300 steps of physics, while the program's fourteen small levers barely twitch. (DD2)
5. **Old names on new thread.** A loom computing a running total of row heights, with paper tags tied to its threads: *SKLANSKY 1960*, *BRENT · KUNG 1982*, an adder layout once called unpopular, still at work inside a 2026 desktop. (DD2)

(Runner-up: the photos of the learned gallery rising from a pile of small squares and fanning out into a hand-drawn sketch, lined up only because training lowered a penalty.)

---

## 13. Fairness ledger and guardrails specific to this angle

- **No invented interior life.** We don't say Cheng was tired, discouraged, obsessed or inspired. The calendar shows when; the quoted messages show what he asked. The quiet August is explicitly unexplained [PJ09].
- **Cheng's words stay verbatim, typos and lowercase included** (Q099 to Q106; "alignemtn" is in Q106's source; the film's chosen substring of Q106 avoids it but must not correct it if used). Never put the reassessment's or the docs' prose in his mouth; those are *the repo* or *the reassessment* [PJ21].
- **Agents:** stated once, neutral, no model versions, no praise or blame [PJ08, PJ22], bible §9. The shared-bug checker and the walked-back GPU claim are told as *process*: agent-written work, corrected by agent-run reviews under Cheng's direction.
- **Critics:** quoted as *a Hacker News commenter*; never depicted; the abusive reply is not quoted or dramatised. Each critique is followed by what the repo itself says (Q014 after Q130; PJ19 after Q131).
- **Historical figures:** the 1943 to 1998 work is framing, never lineage; the unsigned-hinge device makes that visible [FR22]. Kleene's "obscure" is told with his keeping the model [Q141]. The frog paper is not a refutation by its own text [FR11]. Maass and Orponen's noise result is contested emphasis [FR15].
- **Sutton and Brooks** get equal light and their own words only [FR20].
- **Numbers:** always with their conditions (one machine, the date, *in the repo's tests* for bit-identity). Never compare timings measured on different days or machines. Use about 72 times, never 75 [HL23]. Never say *Handwired runs on the GPU* unscoped [CM04].
- **The Do-not-use list (bible §11)** is binding: no 41 to 44 µs timings, no *Fiedler named the spiral of death*, no *the trained parser beat hand-written rules* without scope, no claim that four and a half is wrong under the comparison helper in general (only under a false grid).
- **Brand and imprint:** generic laptop, no logos; never the real publisher's name, only "O'RLY?".

---

## 14. Cast sheet (silhouette specs)

| Figure | Silhouette | Notes |
|---|---|---|
| McCulloch | 1940s suit and tie, full beard, thin face, cigarette | Bible notes are secondary (Gefter); keep generic within that |
| Pitts | small, slight, spectacles, long forehead | Same caution |
| Von Neumann | generic 1940s figure, or text card | Appearance not researched |
| Kleene | generic 1950s academic, suit and tie, at a typewriter | Not verified: generic |
| Lettvin, Maturana | generic lab silhouettes beside the frog's hemisphere | Not researched |
| Sklansky; Brent and Kung | generic engineers at a bench (c. 1960; c. 1980) | No likeness; no Sklansky biography |
| Cheng Lou | **hands only**, a laptop, a lamp; at most a generic contemporary adult at a desk, never captioned as a portrait | No features from photos |
| The second hand | a paper hand at the keyboard, no cuff detail, no face | Never speaks |
| Reviewers, readers | paper hands with red pencils | Unnamed |
| Everyone living and outside the repo | text cards only | Siegelmann, Sontag, Maass, Orponen, Sutton, Brooks, Bournez, Tracr's authors, HN commenters |

---

## 15. Score sketch (for the composers)

- **Palette:** muted piano, pizzicato and bowed low strings, a soft reed, wood blocks, and recorded-style relay and ratchet clacks as rhythm. **Machines clack, never chime**: no celesta, no bells, no glockenspiel.
- **The hinge motif:** two notes on one pitch, then a step up and a held note (flat, then climbing), played once per handoff; on unsigned handoffs it is played by a single instrument from far off; on signed handoffs a second instrument answers.
- **The clockwork ostinato** (DD2): a 4/4 figure whose pickup lands on every evaluation; a ratchet click on the snap.
- **The cold:** Ch 5 drops to a single sustained note and room tone for the dark month; the reckoning's three findings each get one dry clack.
- **The blaze:** Ch 7 is the only stretch with a driving pulse; it cuts to near-silence on the walked-back claim, then resumes lighter.
- **The ending:** the hinge motif, unaccompanied, resolving on a single relay closing.
