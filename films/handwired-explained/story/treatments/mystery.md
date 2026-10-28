# Treatment: "mystery" angle

# THE UNTRAINED NETWORK
### How Handwired works: a mystery in reverse, 1943 → 2026

**Logline.** A small desktop glides and settles in a browser, and every move it makes is worked out by a neural network that nobody ever trained: nine thousand, nine hundred and nine weights, every one written by hand. How? An unseen detective takes the case. He goes back to 1943, to a paper that drew neurons as logic, and works forward clue by clue. Each era leaves one true clue and one trail that went cold. Then he takes the machine apart: the sum that answers eleven when it should say ten, the clockwork that can never stop early, the valve that lets a hand-written program learn. In the end the culprit is a person writing JavaScript that builds a network, one sum at a time. The case board itself, rearranged by the same rule the compiler uses, turns out to be a network too. Every clue on it runs, and so does every false trail, multiplied by zero.

**Runtime:** 24:00. **Narration:** 2,280 words (95 words per film minute overall; the deep dives run slower, with held frames). **Deep dives:** (1) `(a > 4) ? 10 : 12` worked by hand, 4:00; (2) the host loop and loops as counts, trees, tables and the same work on every item, 4:00; (3) gradients through a handwritten program, 3:00. Each is built step by step on a teaching machine whose visual variables are bound to the real numbers.

---

## 0. Reconciling the angle with the brief (read first)

The angle text for this treatment was computed from the neural-net-history template. It asks for AlexNet and transformer deep dives, both AI winters, classical ML, ChatGPT, Anthropic and the US–China race. **None of these is in `brief.md`, and none is in the research bible.** The brief says plainly that *"the film is about Handwired, not a history"*, and the hard rule says every fact must trace to the bible. So this treatment keeps the **mystery-in-reverse engine** and follows the **brief's** must-cover list and its three deep dives:

| Angle asked for | What this treatment does, and why |
|---|---|
| "Open on a modern wonder (a machine answering in fluent prose)" | Open on HandwiredOS, a desktop run by an untrained network. The prose turns up as the **first false trail**: the Notes window holds an English to-do list, and the network wrote none of it, because *"The program holds no text."* [Q087, OS01] |
| "Go back to 1943 and solve it clue by clue, each era a clue and a false trail" | Done as written. The bible's seven eras (E1–E7, from 1943 to October 2026) each leave a clue and a cold trail, and three of those eras fall inside Handwired's own five-month history. |
| "All eras, debates, beliefs and dissenters with how long beliefs held, the experiments" | Bible §2 eras, §7 debates (all eleven are placed in §8 below), with beliefs held and dissenters on the **Belief Lamps** shelf (§2.2). The lab's experiments are the **Exhibits**. |
| AlexNet / transformer deep dives | Replaced by the brief's deep dives 1–3. Transformers appear only as sourced context: Tracr, looped transformers, Percepta, and the repo's own chain-of-thought comparison [FR16–FR19, FR25, Q127]. The film says plainly that Handwired is not a transformer [FR22]. |
| Anthropic | Named once, in narration, as a fact about tooling: 756 of 825 commits co-credit Claude Code, and the reassessment mentions an earlier Codex design discussion [PJ08, PJ21]. A closing credit card says this film was written with Claude. No lab is praised or blamed (bible §9). |
| Winters, classical ML, ChatGPT, US–China race | Left out. They are not in the brief, not in the bible, and the bible's guidance is that no geopolitical content applies (§9). Adding them would mean inventing facts. |

---

## 1. Chapter list (24:00)

| # | Chapter | Span | Min | Words | Clue pinned · trail that went cold |
|---|---|---|---|---|---|
| 1 | **The Desk That Nobody Taught** (prologue) | Oct 2026 → rewind | 1.50 | 145 | the case opens; three suspects: *It Was Trained*, *A Compiler Did It*, *It Isn't Really a Network* · *cold trail:* "the network wrote the note" |
| 2 | **Clue One: A Neuron Can Be Logic** | 1943–1959 | 1.75 | 165 | *clue:* nets of all-or-none units compute logic · *cold trail:* "the brain is a logic machine" (about 16 years) |
| 3 | **Clue Two: Finite, Unless Infinite** | 1951–2026 | 1.75 | 165 | *clue:* a finite net is a finite machine; weights can be written, not learned · *cold trails:* "a net can be any computer" (only with unbounded precision; contested since 1998); "Handwired is another transformer compiler" |
| 4 | **The Suspect's Real Name** | 3 Jun → Oct 2026 | 1.50 | 145 | *clue:* a program is a fixed list of FP32 sums and gated products, appended by builder code · *cold trail:* suspect 2, "a compiler turns your JavaScript into weights" |
| 5 | **DEEP DIVE I: The Case of the Number Eleven** | README example | 4.00 | 370 | *clue:* every *if* is a dimmer set fully on or off, and both lamps always burn · *cold trail:* "exact means it matches JavaScript" |
| 6 | **The Loom and the Cold Furnace** | Sept–Oct 2026 | 1.50 | 145 | *clue:* one big matmul sliced into 130 thin layers, run on the CPU · *cold trail:* "a GPU will make it fast" (for HandwiredOS) |
| 7 | **DEEP DIVE II: The Machine That Cannot Stop** | host loop + patterns | 4.00 | 380 | *clue:* the host loop supplies time; the network supplies one exact step · *cold trail:* "one evaluation per frame" (June to 15 Sept 2026) |
| 8 | **The Detectives Who Fooled Themselves** | Jul → 15 Sept 2026 | 1.75 | 170 | *clue:* test against a judge that cannot share your mistake · *cold trail:* the July "established conclusions" (about two months) |
| 9 | **DEEP DIVE III: Unfreezing the Weights** | learned gallery | 3.00 | 270 | *clue:* the arithmetic has slopes; the decisions are flat · *trail still argued:* "fully differentiable" |
| 10 | **A Verdict in Public** | 13–23 Oct 2026 | 1.50 | 160 | *clue:* one program over 100,000 documents is where the GPU earns its keep · *cold trail:* "the GPU is clearly faster" (a few hours) · *still argued:* "regular JavaScript" |
| 11 | **Case Status: Open** | 15–27 Oct 2026 | 1.75 | 165 | the recovery parser; the board compiles into a loom; one card left blank |
| | **Total** | | **24.00** | **2,280** | |

Pacing. Chapters 2–4 move briskly, one clue every 90 seconds or so, and history gets 3.5 minutes in all, as brief framing. The three deep dives take 11 of the 24 minutes. Each is staged as a run of held "plates" (`minDuration` floors) so the machines can be watched in silence between lines.

---

## 2. The recurring devices

### 2.1 The Case Board (spine and final payoff)
The set is a paper-and-ink study after hours, lit by one copper-shaded desk lamp. That matches the house look of the demo site itself: *"paper, ink and one copper accent"* [PJ18]. On the wall hangs a parchment board. Each chapter ends with the detective's hands pinning a **Clue Card**: a paper-cut object, never a block of text. The cards are a lantern with a wick (1943), a finite clock dial with 2 states (1951), a hand-inked weight (2019–23), a row of 20 pigeonholes (June 2026), two ramps and a lever (DD I), a thin loom frame (ch. 6), a ratchet (DD II), a red pencil (ch. 8), a valve (DD III), a map of 100,000 tiny cells (ch. 10).

Clues are joined by **copper thread**. False trails are pinned too, but each one hangs behind a small paper **shutter** that the detective closes when the trail goes cold. The card stays on the board. *That is the film's thesis, hidden in its set dressing:* in Handwired nothing is skipped. The untaken branch still runs and is multiplied by zero [TE10, TE11].

**Payoff (ch. 11):** the detective lifts every card and re-pins it **one column to the right of the deepest card it depends on**. That is the compiler's own layering rule [CM01, Q039], applied to the film's real clue graph. The layout is computed, not drawn by eye. The board becomes the **matmul loom**, in columns of dependency depth. A forward wave of copper light runs across it from 1943 to the desk. Every card lights, *including the shuttered false trails*, whose light stops dead at a closed shutter. On screen: *the case, compiled*.

### 2.2 The Belief Lamps (what people believed, and for how long)
Below the board is a shelf of small paper oil lamps. Each chapter lights one, lettered with a belief in its era's type. **A lamp's height is bound to how long the belief held, on a log scale** printed on the shelf's brass rule (*hour · day · month · year · decade*). Beliefs in this story lasted anywhere from an afternoon to sixteen years, and a linear scale would hide the short ones. When the evidence ends a belief, the flame gutters out and a wisp of smoke rises. Lamps still burning at the end are the beliefs still argued on 27 October 2026. Narration never mocks a belief. The rule is *what they believed → who held it → who dissented → what they could not yet see*.

| Lamp | Held | Height | Ended by | Claims |
|---|---|---|---|---|
| The brain is a logic machine | 1943–1959 (as biology) | ~16 years | the frog's-eye paper (as later read); graded dendritic spikes, 2020 | FR03, FR10, FR11 (contested reading), FR12 |
| A net can be any computer | 1992/95 → | flickering | true only with unbounded precision; noise result 1998, contested | FR13, FR14, FR15 |
| Learn everything; build nothing in | 2019 → | still burning | contested: Brooks's dissent | FR20, Q152, Q154 |
| A compiler turns your JavaScript into weights | from the tagline, 14 Oct 2026 → | still burning (public) | the docs themselves; the HN critique | PJ01–PJ03, Q014, Q130 |
| One evaluation per frame (HandwiredOS) | June → 15 Sept 2026 | ~3 months | events at their timestamps | HL17, PJ07 |
| Springs store absolute positions | June → 14 Sept 2026 | ~3 months | 42–48 of 48 far-out runs mis-settled | SP10, Q050 |
| "Established conclusions … take these as given" | July → 3 Sept 2026 | ~2 months | the September reassessment | LB01–LB03 |
| A GPU will make the desktop fast | 16 Sept 2026 (tested) | one day | 2.2 ms vs 81 µs | CM08, CM09 |
| The GPU is clearly faster (highlighter half) | 13 Oct 2026, 09:01 → same day | an afternoon (a struck match) | a same-day review | JS21 |
| Fully differentiable | 14 Oct 2026 → | still burning, contested inside the repo | decisions have slope zero | DG03, DG15, Q110 |

Note: the lamp lettered "Established conclusions…" sets its words as a **label**, not a quotation, because that heading is a claim (LB02) and not an entry in `quotes.json`. The same rule covers every lamp: belief texts are labels written in the film's own words.

### 2.3 The Witness Stand (who dissented)
At stage right stands a small raised stand. Following the people index (bible §3), living researchers and Hacker News commenters are **never drawn**: their verified words appear as text cards on the stand, set in EB Garamond with small-caps attribution, and the narrator reads them with "he wrote" or "one commenter wrote". The witnesses are Kleene (1951), Maass and Orponen (1998, as a paraphrase card), Brooks (2019), the Tracr authors (2023), the September reassessment (2026), gregsadetsky, hungryhobbit, and curtisblaine's 4.5 → 11 finding (paraphrased). A dissenter later proved right takes the stand first as a dissenter, never as a winner.

### 2.4 The Suspect, X-rayed
The HandwiredOS desk from the prologue returns at the end of chapters 4–10 for 4–6 seconds, with no narration and only a relay clack. Each time it is a little more translucent, and one more **real** component lights inside it, in order: the 234-cell source table → ReGLU ramps and 0/1 shutters → the 130-frame loom → the host clockwork's ratchet → the red-pencil test harness (a second judge) → a single valve, drawn dark, because HandwiredOS trains nothing [OS02, Q085] → the copper wire under the dock. Only components that HandwiredOS really has are lit. The gallery's valve is shown *closed* on the desk, and the narrator says so once in DD III: "The desktop has none of this switched on. Not one of its weights is trained."

### 2.5 The Exhibits (the experiments)
Every experiment enters as a numbered exhibit card with a date stamp: typewriter face for the 1940s–50s, a plain system monospace for 2026, matching the demo site's "system fonts only" [PJ18]. **Exhibit 1:** the 1943 page of arrow-and-loop nets. **2:** the 98-page RAND memo, RM-704. **3:** the frog before a silvered aluminium hemisphere, a dark disk moved by a magnet from outside [FR10]. **4:** the README's ternary. **5:** `comparison.test.ts`, 4,402 checks. **6:** HandwiredOS on WebGPU, 16 Sept. **7:** the frame-rate tests at 10, 30, 60 and 120 fps. **8:** the 0/20 learning result. **9:** the checker with the shared bug. **10:** the learned gallery. **11:** JSON search over 100,000 documents. **12:** the recovery parser.

### 2.6 The detective is hands, a lamp and a pen; the author is hands and a laptop
We never see the narrator. We see two hands, a fountain pen, index cards, a magnifying glass, and the copper lamp clicking on (a relay clack, never a chime). **Cheng Lou** is never drawn as a face (bible §3). He appears only as a second, separate set: a lamp-lit laptop on a plain desk, a pair of hands at the keys, and at times a **second paper hand** beside them, the coding agent, which has no face and no words of its own [PJ08]. The two sets never share a frame, so the viewer never mistakes the detective for the author.

### 2.7 The Rewind and the Replay
At the end of the prologue, five images run backwards in ten seconds, unexplained:
1. a window sliding back to the point where it was pressed;
2. twelve photographs shrinking back into a pile of small squares at the centre of a stage;
3. a paper tile marked **11** rising back up into two half-open shutters;
4. a copper arc unthreading itself from the wallpaper;
5. a 1943 paper lantern's wick going dark.

In chapter 11 the same images run **forwards**, and now each one is understood (§7).

### 2.8 The detective's refrains (voice)
Three phrases come back, sparingly:
- **"Put that in the file."** when a small fact will matter later (six times in all).
- **"The other branch ran too."** when a false trail is shuttered (three times: ch. 3, ch. 6, ch. 10).
- **"It never stops early."** once in DD II, once in the finale.

### 2.9 The score's two lines (music as a select)
The Strudel score carries a **both-branches motif**: two melodic lines, a whole tone apart, that *always* play, with a gate (a gain envelope of exactly 0 or 1) choosing which one we hear. At the 4.5 moment in DD I, the gate sits at 0.5 and both lines sound at half level, an unresolved, "wrong" chord: the musical **eleven**. Machines clack (relays, detents, ratchets), never chime (brief). The host clockwork in DD II gets a ratchet figure on a 4 ms grid, slowed down for the ear.

---

## 3. Chapter by chapter

Claim ids are in brackets, quotes by `Q` id. Narration fragments show the tone; they are not the final script. **Inside quotation marks, text is verbatim from `quotes.json`.** Names, labels and paraphrases are never put in quotation marks.

### 1 · The Desk That Nobody Taught (1:30) · Oct 2026 · parchment → candleAmber
The first 60 seconds are detailed in §5. The last 30 seconds:
- **The false trail of prose.** The camera finds the Notes window, which holds a short English to-do list ending *Wire one more neuron by hand* [OS18]. Narration: "There's even writing on it. A to-do list, in plain English. That's our first false trail. The network didn't write a word of it. In the repo's own words, 'The program holds no text.' Put that in the file." [Q087] (Paid in ch. 6.)
- **Three suspects** pinned as cards: *It Was Trained*, *A Compiler Did It*, *It Isn't Really a Network*.
- **The Rewind** (§2.7), then the title, cut in backlit card: *THE UNTRAINED NETWORK*, with the subtitle *a mystery in reverse*. An ink bleed into 1943: "To understand it, we go back to 1943, to a paper that drew the brain as a machine of logic."

### 2 · Clue One: A Neuron Can Be Logic (1:45) · 1943–1959 · candleAmber → labGreen
- **Exhibit 1.** Two silhouettes at a table: a bearded older man with a cigarette, and a small, shy, bespectacled young man, from the appearance notes (bible §3, secondary source; never a portrait caption). On screen: *Bull. Math. Biophysics 5:115–133 · December 1943* [FR01, FR02]. "In December 1943 a man from a psychiatry department and a self-taught young logician published a startling claim. Neurons fire, or they don't. So, they wrote, 'neural events and the relations among them can be treated by means of propositional logic.'" [Q133, FR03]
- **Teaching machine: the paper lantern with a wick** (`paperLantern`, threshold ring). Two lanterns feed a third whose wick catches only when both glow: AND. Lower the ring one notch: OR. The variables are bound: glow ← the unit's 0/1 output, ring ← the threshold count. "Give them any logical expression, and they would draw you a net that behaves the way it says." [FR03, Q134]
- **Von Neumann, 1945**: a text card. His EDVAC report models its computing elements on their neurons, and misspells McCulloch's name [FR06, Q138].
- **The missing piece, planted.** A parchment plate lists what their units were *not*: weighted sums, real weights, learning [FR05]. "Notice what they couldn't do. Their wiring never changed. They didn't learn. Put that in the file." (Paid in DD III.)
- **The cold trail.** The Belief Lamp *THE BRAIN IS A LOGIC MACHINE* is lit. Exhibit 3, 1959: a frog faces a silvered hemisphere while a dark disk crosses it [FR10]. The paper, co-written by McCulloch and Pitts themselves, finds that the eye speaks to the brain in "a language already highly organized and interpreted" [Q142]. Fairness, said aloud: "Reading that as a refutation came later." [FR11] In 2020, single human dendrites are shown to compute XOR-like functions with graded spikes [FR12]. The lamp burned about sixteen years as biology. As computer science, the idea never went out: it became automata, and the stored-program computer.
- **Clue Card:** the lantern with a wick.

### 3 · Clue Two: Finite, Unless Infinite (1:45) · 1951–2026 · winterBlue → duskRose
- **Exhibit 2: RAND, December 1951.** A 98-page typed memo [FR07]. Witness Stand, Kleene's own words: "'we found the part of their paper which treats of arbitrary nets obscure'" [Q139]. He proceeds independently and proves that a net of such neurons is a **finite automaton**, a machine with a fixed number of states [FR07, FR08]. Teaching machine: a paper clock dial with a fixed ring of stops; the pointer can only land on a stop.
- **The 1990s: power, at a price.** Text cards for Siegelmann and Sontag: a fixed net of about a thousand neurons, later 886, can simulate any Turing machine [FR13, Q143, Q145]. The catch is drawn: the memory hides in the endless digits of a single number, which needs unbounded precision [FR14]. "And with real-number weights, they wrote, such nets go beyond Turing machines." Witness card: Maass and Orponen, 1998, argue that the faintest analog noise drops such nets back to finite automata. "How much that matters is still argued." [FR15, contested]
- **Clue two, stated:** "Precision is the price of power. Handwired computes in 32-bit floats, which are finite. So one run of its network is a fixed, finite circuit. Anything unbounded, like time, has to come from outside. Put that in the file." [EX02, FR25] (Paid in DD II.)
- **2019: the bet of the age.** Text card, Sutton: "'general methods that leverage computation are ultimately the most effective, and by a large margin.'" [Q152] Witness Stand, Brooks: "'I think Sutton is wrong for a number of reasons.'" [Q154] The lamp *LEARN EVERYTHING; BUILD NOTHING IN* is lit and stays lit: dominant, not consensus [FR20].
- **Meanwhile, weights written by hand, as tools.** A quick montage of hand-inked weight cards: a programming language for what transformer layers compute (2021) [FR16]; DeepMind's Tracr compiler (2023) [FR17]; looped transformers as computers (2023) [FR18]; in March 2026 a transformer with computed weights that runs a WebAssembly virtual machine [FR19, Q157]. The Tracr authors' own caution sits on the stand: "'we will likely never compile fully featured language models in Tracr.'" [Q149]
- **Cold trail:** "So is Handwired one of these? No. It has no attention. It isn't a transformer. And its repo cites none of the 1943 work. The other branch ran too." [FR22] The card is shuttered.
- **Clue Card:** a hand-inked weight. Narration: "Weights can be written, not learned."

### 4 · The Suspect's Real Name (1:30) · 3 June → Oct 2026 · parchment
- **Exhibit card**, typed as a label: *3 Jun 2026 · 20:24 · Create numeric UI atom lab*. "June the third, 2026, twenty past eight in the evening. A first commit, and a gated sum, reglu, is already in it." [PJ05, PR09] Names flip on the card like a railway board: *Numeric UI Atom Lab* (three days) → *Indirect* (four months) → *Handwired* (6 Oct) [PJ07].
- **What a program is.** "The tutorial puts it in one breath: 'A numeric program is a fixed list of operations over 32-bit floats, called FP32 here, mostly weighted sums and products with a ReLU.'" [Q016]
- **Teaching machine: the source table** (machine 8). This is a strip of numbered pigeonholes, the toggle template's 20 cells: 1280 and 800 in slots 0 and 1, event flags that pop to 1 and fall back to 0, a rack of four spring-matrix cards, and state cards [CB09, CB03]. "'Every number the program reads, or keeps from one evaluation to the next, is a cell of the source table.'" [Q019] Wires are drawn as copper tags on each hole: "'A wire is the position of a number, either a cell or the result of an operation.'" [Q020]
- **The four instructions** on a parchment plate, each with its paper object: a **weighted sum** (a loom row), a **ReLU-gated product** (a valve), a **boolean round** (a detent), an **index read** (a card drawer) [PR02, Q028]. Small print: every step rounds to FP32 [PR03].
- **Teaching machine: the builder ribbon** (machine 9). Operation tags are appended one by one to a ribbon, each pinned one column to the right of its deepest input. A duplicate expression gets back the tag that already exists [CB05]. "You don't write that list. You write builder code: 'ordinary JavaScript that runs once and appends operations to a `Circuit`, so nothing in the program branches or loops at runtime.'" [Q017]
- **Suspect two walks free:** "'No tool converts existing JavaScript source into a program.' You rewrite the logic yourself, as JavaScript that builds the network." [Q014, PJ02] Suspect one walks free too, on screen: "'Every weight of the program is written by builder code, and none is trained.'" [Q085]
- **Clue Card:** the strip of pigeonholes. **X-ray:** the desk's 234 source cells light [OS02].

### 5 · DEEP DIVE I: The Case of the Number Eleven (4:00) · the README example · parchment plates + candleAmber
The teaching method is in §4.1. The beats, in order:
1. The question, set on a plate: `const result = (a > 4) ? 10 : 12`. In JavaScript only the chosen arm runs [TE15].
2. Two ramps, a lever: the README's rewrite, worked through at 3, 4, 5, 6 and 100 [TE01, TE02].
3. Both branches on belts, a 0/1 shutter picking one [Q004, TE10]; the poison of 0 × ∞ [TE11].
4. **The clue:** the marble at 4.5 gives 11 [TE03]. The README's own comment scopes it to whole numbers [Q003].
5. What the runtime really builds: tag the wire with a grid of 1, and the comparison costs 2 operations [TE05, TE06]; tag it falsely, and 11 comes back while a validator catches it in testing [TE07, Q029].
6. No tag at all: the lens train, 16 operations, magnification 2^149, right at 4.5 [TE08, Q033, PR12].
7. **The cold trail:** exact means exact against FP32, within declared ranges, not against JavaScript's doubles [Q036, EX03, PJ19]; and 4,402 checks [TE14, Q025].
- **Clue Card:** two ramps and a lever. **Put that in the file:** "Eleven. Somebody will find it." (Paid in ch. 10.)
- **Lamp:** *EXACT MEANS IT MATCHES JAVASCRIPT*, shuttered at the end of the chapter.

### 6 · The Loom and the Cold Furnace (1:30) · Sept–Oct 2026 · candleAmber, with an emberRed false furnace
- **Teaching machine: the matmul loom** (machine 10): 130 thin frames, one per layer, with 9,909 threads (copper adds, indigo subtracts, as on the real wallpaper) and ramps and detents behind the frames. Most of it is empty air [OS02, OS14, CM01]. "'Independent instructions at the same dependency depth share a layer.'" [Q039] Each frame is a sparse sheet of weights with its gates behind it [Q040]. "Four thousand six hundred and forty-six operations. A hundred and thirty layers." [OS02] Sheets fuse, but the fusing stops dead at a gate frame; the longest chain of gates is seventy-one deep [CM07]. **Suspect three, answered:** yes, this is a network in the plain sense of layers of weighted sums with ReLU gates [PR04]. Whether it deserves the name is argued again in ch. 10.
- **The cold furnace.** The README offers a GPU "'for fun.'" [Q006] Exhibit 6, 16 Sept: an emberRed furnace roars, and the desktop takes about two milliseconds per evaluation on WebGPU against eighty-one microseconds on the CPU, about twenty-seven times slower. Its single 6.4 MB shader had not finished compiling after twenty-eight minutes [CM08, CM09]. "'HandwiredOS is many different pieces of logic instead of one repeated step, so it has no tree to build.'" [Q064] One more reason, on a plate: GPU compilers may rearrange sums, "'An implementation may reassociate operations.'" [Q161], and in one probe a shader compiler folded the boolean trick away [EX09, Q035]. The furnace cools. "The desktop runs on the CPU, in plain JavaScript. The other branch ran too." [CM04, OS08]
- **Payoff of the prose trail.** "Remember the note? On the thirteenth of October the desktop's program peaked at twenty-one thousand operations. That evening Notes became a plain browser text box, and the program fell to about four thousand two hundred." [OS03, OS04] The paper text box drops in, and nearly four in five of the program's operations fall away from the loom (derived: 19,851 → 4,251 live operations that evening).
- **Clue Card:** a single thin loom frame.

### 7 · DEEP DIVE II: The Machine That Cannot Stop (4:00) · host loop + patterns · dawnGold / labGreen
The teaching method is in §4.2. The beats:
1. The rule, on a plate: "'The program runs every operation on every frame and can't stop early, so a loop becomes a count, a tree, a table, or the same work on every item.'" [Q015, HL01]
2. **The host clockwork** with the toggle: handlers queue timestamped events; a frame writes the table, evaluates once, copies the next state back, and moves the page from the outputs [Q026, HL04–HL06, Q018, Q027].
3. **Time:** the spring step stamp and the squaring press, giving 14 operations whatever the step count; the 300-step cap and the snap [SP01–SP03, Q046, Q049, HL08].
4. **Frame-rate payoff:** 359 px apart in the familiar loop; identical in every bit in Handwired's, in the repo's tests [HL18, HL11, HL10, HL14].
5. **Loops unrolled:** a count (findIndex), a tree (running totals), ranks (sort), a fixed rack (filter and slice into K slots) [PT08, PT15, PT03, PT16, PT18, Q066, Q061, Q062, Q069, Q074].
- **Payoff of clue two (ch. 3):** "Kleene's finite machine, and the time that has to come from outside? Here it is. The network is one fixed, exact step. The host loop turns the crank." [FR07, FR25] One line of context on a text card: the repo itself compares a frame's write-back to the token a chain-of-thought transformer appends [Q127].
- **Lamp shuttered:** *ONE EVALUATION PER FRAME* (until 15 Sept 2026) [HL17].
- **Clue Card:** the ratchet.

### 8 · The Detectives Who Fooled Themselves (1:45) · Jul → 15 Sept 2026 · winterBlue → dawnGold (dawn of 3 Sept)
- "Every good mystery has the moment when the detectives realise they've fooled themselves." July: four experiments land, "adversarially verified" (shown as a label) [LB01]. The briefs list conclusions to take as given, among them that compiling ordinary code is a dead end [LB02]. The lamp *ESTABLISHED CONCLUSIONS* is lit. In August, no commits at all; the lamp burns in an empty room [PJ09].
- **3 September, 06:13.** A grey dawn, and a reassessment retires ten claims [LB03, LB12]. **Exhibit 8:** a learning experiment had scored nought out of twenty. "Multiply every loss by a constant, a change that should do nothing, and it climbs to twenty out of twenty. The culprit was one tiny constant inside the optimiser." [LB04, Q117 on the stand]. **Exhibit 9:** for `if (true) { return x + 1 } return x + 2` at x = 2, JavaScript returns 3, the compiled code 4, and the checker reported zero mismatches [LB08]. "'some correctness checks compare implementations that share the same mistake.'" [Q116] And the gradient of three times v, at v = 0, came out as 0 or 3 depending on which operand was written first [DG28].
- **The July heading, judged:** "'it passes yesterday's interpretation to tomorrow's agents as a constraint.'" [Q118]
- **Who the agents were, said once and plainly:** "Agents, because most of this work was done with AI coding tools. Every commit is authored by Cheng Lou. Seven hundred and fifty-six of the eight hundred and twenty-five also credit Claude Code, Anthropic's coding tool. The reassessment's writer says it traced conversations with Claude, and an earlier design discussion with OpenAI's Codex. The mistakes and their corrections came out of the same process, under his direction." [PJ08, PJ21; bible §9] No vendor is praised or blamed.
- **Fixed the same day; 274 tests passing** [LB12]. On 14–15 September, Cheng takes "the recommended option each time" (a label): an index read, one exact comparison helper, springs written by JavaScript [PJ23, PR22]. The lamp goes out after about two months.
- **Clue Card:** a red pencil. "A test is only as good as a judge who can't share your mistake. That's why the template checks the network against plain JavaScript." [Q038, CB13]

### 9 · DEEP DIVE III: Unfreezing the Weights (3:00) · the learned gallery · dawnGold
The teaching method is in §4.3. The beats:
1. **The offer**, on screen and spoken: "'unfreezing the weights and train them (what does that even do? Let's find out!)'" [Q010]. (Planted here; paid off in the final lines of the film.)
2. Every operation has a backward rule; "'Backpropagation differentiates the intended real arithmetic, not literal floating-point rounding.'" [Q052, DG01]
3. **The valve**, worked with numbers, open then shut [DG01, Q108, DG11]. Payoff of ch. 2's planted line: "McCulloch and Pitts's neurons couldn't learn. These can, if you let them."
4. **Decisions are flat:** the ramps from DD I have slope nought at every whole number [DG15]. "Fully differentiable" is contested inside the repo itself [DG03, Q110].
5. **The gallery:** 244 weights, 6,320 operations; photos start piled at the centre and fan out to a sketch; Adam, 600 steps a second; plain JavaScript decides which photo goes where. Honestly scoped: it is a small generic network compiled as a program, not a hand-written one unfrozen [DG04–DG10, DG06].
6. **The Huber clamp:** far-off photos vote; they don't shout [DG07, DG26].
7. **The rejected shortcut** [DG13, Q106, Q107] and **the dream not yet tried** (nanoGPT) [DG22, Q011].
- **X-ray beat:** the valve on the desk stays dark. "The desktop has none of this switched on. Not one of its weights is trained." [Q085]
- **Lamp lit and left burning:** *FULLY DIFFERENTIABLE*, contested.
- **Clue Card:** the valve.

### 10 · A Verdict in Public (1:30) · 13–23 Oct 2026 · serverCyan → duskRose
- **Exhibit 11: a map of 100,000 tiny cells.** Built in a day: a search over a hundred thousand JSON documents, run again at every keystroke [JS01, PJ18]. Why a GPU here and not for the desktop: "'It is for many documents: every document runs the same operations and reads no other document's values, so one pass runs them all.'" [Q090] One thread per document [JS04]. Eleven to fifteen milliseconds a keystroke; the browser's own regular expressions take eight to twenty-eight, and on one nasty backtracking pattern, two seconds against eleven milliseconds [JS11, JS12]. A RegExp booth with a ten-second hourglass and a trapdoor (the worker that can be killed) [JS16].
- **The struck match.** That morning a first write-up called the GPU *clearly faster* (a label); a review walked it back the same day [JS21]. The page now says: "'So neither the search nor RegExp is always faster, and the line gives both times for every pattern.'" [Q092] Lamp: an afternoon. "The other branch ran too."
- **Launch.** On screen only: "'strip 1-4 yeah. Do it quick plz, then publish.'" [Q103] The repo goes public on the evening of 14 October; 683 of 825 commits fell in four October days [PJ09, PJ11]. The launch post is shown as a card [Q104, PJ14].
- **The Witness Stand fills.** The tagline says "regular JavaScript" [Q001]. One critic: "'it's rather "write your logic in a DSL that creates a neural-net-shaped circuit"'" [Q130]. Both sides get a line: another reader called it a compiler from code to weights, and the docs side with the critic [PJ03, Q014]. **Payoff of DD I:** "Another reader typed four and a half into the front page, and got eleven. The page's own hidden comment had admitted as much." [PJ27, PJ19; Q131 on a card] A third asked the plainest question of all: "'why?'" [Q132] (Planted; paid in ch. 11.)
- **Clue Card:** the map of cells.

### 11 · Case Status: Open (1:45) · 15–27 Oct 2026 · duskRose → candleAmber
- **Exhibit 12, the last clue in the file** (the pinned merge). Teaching machine: **the recovery grid** (machine 25), a lookup table of about 1,560 cells; about 240 glow on the path valid JSON takes; a paper hand fills the ~1,300 dark ones by training [LB19, Q120]. "Valid input reads only the lit cells, so it parses exactly as before." Verdicts on the stand, quoted whole and fairly: "'JSON is a clear success.'" [Q122] "On TOML: 'By the rule fixed beforehand the track failed'" [Q123], with the lab's own scope: "'It does not say that training cannot work there.'" [Q124] The test sets were committed before training [LB25].
- **The verdict.** The detective re-pins the board by dependency depth (§2.1). "So who wired the machine? A person did. He wrote JavaScript that builds the network, one sum at a time, with a coding agent at his elbow. The ideas are old: a neuron as logic, from 1943; a finite machine, from 1951. What's new is the discipline. Exact numbers. Both branches run. Every loop becomes a count, a tree or a table. It never stops early. And, if you like, gradients."
- **What's still open**, in the repo's own words: "'GPU execution, a general JavaScript compiler, learned arbitrary abstractions, and a full learned UI runtime are not delivered by these experiments.'" [Q125]
- **The Replay** (§2.7) runs forwards. Then the ending (§6).

---

## 4. How each deep dive teaches (step by step, with the machine)

Shared rules: **every number on screen is the real one** (bible §5), and anything derived is labelled *derived*. Exact symbols go on plates; the narration speaks numbers for the ear. Each step lasts one to three lines, then a held frame of 2–4 s with only the machine moving and clacking. Each machine first appears as a silhouette and is then inked onto a parchment plate for the arithmetic (style bible §6).

### 4.1 DEEP DIVE I: The Number Eleven (4:00, 370 words)

**Machines:** *Two ramps and a lever* (machine 1), *Both branches run* (machine 2), *Tags on wires* (machine 5), *The sign-cascade lens train* (machine 3). All are built from the kit (`thread`, `knot`, `parchmentPlate`, `label`), plus a hinged-board painter whose heights are computed as `max(0, a − 4)` and `max(0, a − 5)`.

| Step | On screen (bound quantities) | Narration (sample) | Claims |
|---|---|---|---|
| 1. The question | Plate: `(a > 4) ? 10 : 12`. A JavaScript fork in a paper road; only one branch lights. | "Here's the example on Handwired's front page. If a is more than four, ten. Otherwise, twelve. In JavaScript, only one side ever runs. A network has no if." | TE15 |
| 2. Two ramps | Two hinged boards: flat, then a 45° climb, the corners at 4 and 5. A marble at `a` reads each board's height; a lever shows the difference. Values computed live. | "So build one from ramps. The first is flat until four, then climbs. The second waits until five. Subtract one from the other." | TE01 |
| 3. Worked by hand | The marble visits 3, 4, 5, 6, 100. A ledger fills in, ink on parchment: 0·0·0 / 0·0·0 / 1·0·1 / 2·1·1 / 96·95·1. | "At three, both are flat: nought. At five, the first has climbed one, the second hasn't moved: one. At six, two minus one. At a hundred, ninety-six minus ninety-five. Still one." | TE02 |
| 4. Both branches | Two conveyor belts carry tiles **10** and **12** and *never stop*. Shutters open by `above4` and `1 − above4`. Plate: `above4·10 + (1 − above4)·12`. Card: Q004. | "Now the answers. Ten rides one belt, twelve the other, and both belts always run. The ramp's verdict opens one shutter fully, and shuts the other." | TE01, TE10, Q004 |
| 5. The poison | One unchosen tile is swapped for **∞**. The closed shutter multiplies it by 0, and the result tile turns to **NaN**. | "Even the answer you didn't choose matters. Nought times infinity isn't nought. It's not a number at all." | TE11, Q082 |
| 6. **The clue** | The marble rolls to **4.5**. The ramps read 0.5 and 0; the lever stops halfway; both shutters stand half open; a tile **11** drops out. The score's two lines sound at half level (§2.9). The README's comment appears on a card: Q003. | "Now roll the marble to four and a half. The first ramp reads a half. The second, nothing. Both shutters stand half open, and out drops… eleven. A machine built to say ten or twelve has said eleven. The comment beside it says whole numbers only." | TE03, Q003 |
| 7. A tag on the wire | A paper tag, *grid 1*, is tied to the wire of `a`. The two ramps collapse into a shorter rig: `ramp = relu(5 − a)`, `bit = relu(1 − ramp)`. Worked at 5 → 1, 4 → 0, 3 → 0. A counter shows **2 ops · 2 layers**, then the whole ternary, **8 ops · 5 layers**. | "The real library asks first: what values can a take? Promise whole numbers, and the test is two steps. Five gives one. Four gives nought. Three gives nought. The whole choice costs eight operations, in five layers." | TE04, TE05, TE06 |
| 8. A false tag | The tag lies: 4.5 goes in, and 11 comes out again. A red stamp: `wire 0 must be a multiple of 1, got 4.5` (the validator, in testing). Card: Q029. | "Break the promise, pass four and a half, and eleven comes back. A validator catches it in testing. 'Declarations are promises from the caller, not proofs.'" | TE07, Q029 |
| 9. No tag: the lens train | A hairline gap `d = a − 4` enters six lenses (×2^14, then ×2^24 five times), each followed by a stop at height 1, then a final valve and a flip. A dial reads the total magnification, 2^149. At 4.5 the bar is full and the answer is **10**. Counter: **16 ops · 15 layers**. Card: Q033. | "Promise nothing, and you get this. It magnifies the difference by two to the fourteenth, then by two to the twenty-fourth, five times over. Two to the hundred and forty-ninth in all: enough to turn the smallest gap a 32-bit float can hold into a full bar of light. Sixteen steps instead of two. And at four and a half, it says ten. One honest sentence about your input saves fourteen of them." | TE08, EX05, Q033, PR12 |
| 10. The cold trail | Plate, Q036. Two vignettes, each 3 s: a window 1732 px wide where the column count reads 6.999999523162842 in FP32 and 7 in float64; and a = 16,777,222 giving a result of 8. Counter: *comparison.test.ts · 4,402 checks*. | "So what does exact mean? 'Exactness means equality to the stated FP32 calculation, ignoring the sign of zero, not equality to arbitrary JavaScript float64 arithmetic.' At a window seventeen hundred and thirty-two pixels wide, a column count lands a whisker under seven, where JavaScript's own doubles say seven. And past sixteen million, whole numbers start to blur. Within what you declare, though, the decisions match: four thousand four hundred and two checks against JavaScript's own comparisons." | EX01, EX03, PJ19, Q058, TE14, Q025 |

*Optional 6-second visual (no narration), the boolean-atom detent* (machine 4): a fine ruler slides onto a giant ruler that starts at 8,388,609, and 0.5 snaps up because the start mark is odd [PR08]. It sits under step 9 as the "one-operation shortcut" (Q056 on a card).

### 4.2 DEEP DIVE II: The Machine That Cannot Stop (4:00, 380 words)

**Machines:** *The host clockwork* (machine 11), *The source table* (machine 8, back from ch. 4), *The spring step stamp* (12), *The squaring press* (13), *The counting rail* (15), *The prefix loom* (14), *The rank board* (17), *The K-slot rack* (18).

| Step | On screen | Narration (sample) | Claims |
|---|---|---|---|
| 1. The rule | Plate, Q015. A paper loop of track with no exit ramp, no jump and no brake lever. | Q015 read in full. "There's no jump, no break, no repeat. Everything runs, every time." | HL01, Q015 |
| 2. One frame as clockwork | The toggle (a 52 × 32 px paper track) beside a clockwork. A press stamps a token with its time, rounded to a 1/64 grid, and drops it in a tray; the handler rings for a frame. On the frame: the escapement ticks; the host writes inputs and four matrix cards into the pigeonholes; the loom runs once; the next-state cards slide back into their holes; the page moves from the outputs alone. | "Press the switch. The handler does very little. 'Event handlers only queue events with their timestamps.' At the next frame, the host writes the inputs into the table, runs the network once, copies the new state back, and moves the page from what comes out. 'The page requests another frame only while the clock runs'." | CB09, CB10, HL04–HL06, Q026, Q027, Q018 |
| 3. Time, as a brass plate | Plate, Q024. A 2×2 brass stamp `0.99536 | 0.00352 / −1.16 | 0.88`. Cards −300 and 0 go in; −298.608 and 348 come out; the window creeps from 400 to 401.392 px. | "A spring can't loop as many times as the clock demands. So JavaScript counts the four-millisecond steps, and hands the network one brass plate with the effect of all of them. One step, for a window four hundred pixels along, bound for seven hundred: it creeps forward just under one and a half pixels, and picks up speed." | Q024, Q043, Q044, SP01–SP03 |
| 4. Any number of steps | The squaring press folds the plate onto itself: M², M⁴, … 300 steps take 8 squarings (*derived*). A counter stays frozen at **14 ops · 3 layers** whatever the step dial reads. Card: Q045. | "Two steps or three hundred, the network pays the same: '14 operations in 3 layers for any step count.' (spoken: "fourteen operations in three layers") And the stiffness never enters the network at all." | SP01, Q046, Q045 |
| 5. The cap | A ratchet with 300 teeth and a release pawl. Past tooth 300 the pawl snaps, every object lands on its destination at rest, and the backlog falls through a trapdoor. | "There's a ceiling. 'no frame runs more than 300 steps'. Past it, everything snaps home and stands still. A three-second stall gives exactly one snap, at every frame rate." | HL08, Q049, SP12 |
| 6. Frame-rate payoff (Exhibit 7) | Two ghosted desks overlaid, one at 10 fps and one at 120 fps. In the *familiar* order they drift apart, a gauge reading up to 359 px. In Handwired's they lock together, and a bit-pattern strip under each is identical. The frame you see is drawn on carbon paper, then thrown into a bin. | "Replay one recorded session at ten frames a second and at a hundred and twenty. In the familiar loop, the windows end up as much as three hundred and fifty-nine pixels apart. In Handwired's, in the repo's tests, every stored table matches in every bit. Because only events and settle checks are kept. The frame you see is a dress rehearsal, thrown away." | HL18, HL11, HL10, HL14 |
| 7. Lamp shuttered | *ONE EVALUATION PER FRAME*, burning since June, gutters out on 15 Sept. | "Until mid-September, the desktop ran once a frame, and a frame's worth of moves collapsed into one." | HL17 |
| 8. A count (findIndex) | The counting rail: pegs at 40, 80, 80, 140, 180; a pointer bar at 90; three flags drop together; the tally clicks to **3**. Counter: 195 ops in 3 layers vs 447 in 34 (64 rows). | "Which row is the pointer over? 'A loop stops at the first item that fails the test.' This can't. So it asks every row at once, is your bottom above the pointer?, and counts the yeses. Three." | PT08, Q066 |
| 9. A tree (running totals) | The prefix loom: tabs 3 1 4 1 5 9 2 6 join in 4 levels (Brent-Kung, 11 joins) to 3 4 8 9 14 23 25 31, against a 7-level chain. Then four real row heights summed two ways: 799.300048828125 vs 799.2999877929688. Card: Q062. | "Running totals can be a tree: four levels instead of seven. But 'Sums and products round in FP32, so the grouping is part of the result.' And on today's CPU, the plain chain is faster anyway. Over ten thousand rows, though, the tree drifts less." | PT15, PT03, Q061, Q062, PT14 |
| 10. Ranks and a rack | The rank board: keys 30 10 30 20 flip tiles in a 4×4 grid, and the rows sum to 2 0 3 1; the cards slide to their slots without ever swapping. Then the K-slot rack: visible 0 1 1 0 1 0 1 1, counts 0 1 2 2 3 3 4 5, slots take items 1, 2, 4. Monitor's line: Q074. | "To sort, each card counts how many come before it. To filter into a fixed list, count the visible ones, and slot k takes the item where the count reaches k plus one. The size is fixed, and Monitor says so: 'Only 64 rows are drawn at a time.'" | PT16, Q069, PT18, PT20, Q074 |
| 11. The clue | The clockwork turns the loom's crank, slowly, once per tick. | "Remember Kleene's finite machine, and the time that had to come from outside? Here it is. The network is one fixed, exact step. The host loop turns the crank. It never stops early." | FR07, FR25, Q127 |

*Snap vs carry* (HL27, a design disagreement) appears as a 4-second text card under step 5: *Other guidance carries the backlog; Handwired snaps, to keep a fixed bound.* There is no narration over it, but the card keeps the debate on screen fairly.

### 4.3 DEEP DIVE III: Unfreezing the Weights (3:00, 270 words)

**Machines:** *The ReGLU valve* (machine 23), *The learned gallery stage* (22), *The Huber clamp* (24). The two ramps from DD I return for the flat-decision beat.

| Step | On screen | Narration (sample) | Claims |
|---|---|---|---|
| 1. The offer | README card, Q010. The detective's hand turns a frozen weight-knob, ice cracking off it. | Q010 read in full. | Q010, PJ04 |
| 2. Backward rules | The loom from ch. 6 with a light running *backwards* across it; each operation passes it on by its own rule. Card: Q052. | "Every operation has a rule for running backwards. 'Backpropagation differentiates the intended real arithmetic, not literal floating-point rounding.'" | DG01, Q052 |
| 3. The valve, open | A valve: flow from the left = 3w with w = 0.5; opening = max(0, g + b) with g = 0.25, b = −0.1, so open at **0.15**; out comes **0.225**. Two backward arrows: ∂y/∂w = **0.45**, ∂y/∂g = **1.5** (*derived*). | "Take one gated unit. The gate stands open, fifteen hundredths. Out comes nought point two two five. Nudge the weight and the output follows; nudge the gate and it follows faster." | DG01 (derived toy, bible §5.8) |
| 4. The valve, shut | b = −0.4: the gate is at −0.15, shut; the output is **0**; both backward arrows vanish. Card: Q108. A hair of decay (2e-7) prises it open a crack. | "Lower the bias, and the gate shuts. Output, nought. Every gradient, nought. 'Without any decay, a unit whose gate has closed gets no gradient and stays shut'. So the gallery keeps a whisper of weight decay. McCulloch and Pitts's neurons couldn't learn. These can, if you let them." | DG11, Q108, FR05 |
| 5. Decisions are flat | Back to DD I's ramps: at every whole number the board under the marble is *flat*, slope 0. A card: Q110. Lamp lit: *FULLY DIFFERENTIABLE*, contested. | "And the comparisons from the case of the number eleven? Flat, at every whole number. A decision has no slope to follow. So is it fully differentiable? Inside the repo, that's argued. 'That's the difference between "the backward pass runs" and "the gradient is useful".'" | DG15, DG03, Q110 |
| 6. The gallery (Exhibit 10) | A 5:4 stage. A hand sketches ten rectangles (the *Story* preset). Twelve photos, piled near the centre as small squares, fan out to the rectangles over about 1–3 s. A loss chart falls. Counters: **244 weights · 6,320 ops · 8 layers · 600 steps/s**. A separate clerk's desk in plain ink: *assignment (JavaScript)*. | "In the learned gallery, it's put to work. Two hundred and forty-four weights start from a random seed, every photo a small square near the centre. You sketch; training pulls them out to meet you, six hundred steps a second. Plain JavaScript decides which photo goes where. And to be fair: this is a small generic network compiled as a program, not a hand-written one unfrozen." | DG04–DG06, DG09, DG10, Q109 |
| 7. Far-off photos vote | Each photo edge pulls on a bias through a spring whose force caps at 0.08. A far-off photo's spring is fully stretched and pulls no harder than one 0.09 off. Plate: ∂L/∂b = (1/40) Σ [clip(e_left) + clip(e_right)]. | "Each edge pulls with a spring whose pull tops out early. A photo miles off pulls no harder than one a whisker off. Far-off photos vote; they don't shout." | DG07, DG26 |
| 8. The rejected shortcut | A *Misalignment penalty* slider. A ghosted hand offers a ruler to snap the sketch to a grid; another hand waves it away. Cards: Q106, Q107. | "An easier fix was offered: snap the sketch to a grid in ordinary code. Cheng turned it down: 'the spirit of the gallery is to learn something.' Now 'the photos line up only because training lowers the penalty.'" | DG13, Q106, Q107 |
| 9. The untried dream | A frozen program card bolted to a large, dim generic network; a question mark hangs over the join. Card: Q011. | "The README dreams bigger: a frozen program joined to a generic network, trained end to end. That hasn't been tried." | DG22, Q011 |

---

## 5. The first 60 seconds, shot by shot

Sound throughout: room tone of paper, one relay clack per cut, no music until 0:21 (then the both-branches motif enters, quietly, on two muted lines). About 88 words in 60 s.

| Shot | Time | Kind · mood | Picture | Narration |
|---|---|---|---|---|
| **ch01-s01** | 0:00–0:07 | scene · parchment | Black. A single copper thread draws itself left to right across the dark like a slow fuse (`thread`, `draw` 0→1). At 0:05 it resolves into the copper wire under a paper dock [OS18]. One relay clack as the wire completes. | *(none; 4 s of near silence, then the clack)* |
| **ch01-s02** | 0:07–0:21 | scene · parchment | Wide. The HandwiredOS desk as a toy theatre: warm paper-beige desktop with a faint dot grid, three paper windows (Monitor, Notes, Photos) with serif titles, hanging by fine threads; a dock of three white tiles; Photos shows a 4×3 grid of twelve landscapes. A paper hand (the pointer) presses Photos' title bar and drags; the window glides after it and settles on release [OS01, OS15, OS18]. Haze sheet B; backlight warm. | L0001 "Here is a small desktop. Three windows, a dock, and twelve photographs." · L0002 "Drag a window, and it glides, and settles." |
| **ch01-s03** | 0:21–0:33 | scene · candleAmber | Slow push into Monitor. Its sidebar reads *THIS PROGRAM · State 234 · Operations 4,646 · Outputs 493*; the footer reads *130 layers · 9,909 weights* [OS02, PJ20]. The numbers are set in the window's own type. The both-branches motif enters. | L0003 "Every move it makes is worked out by one neural network." · L0004 "Nine thousand, nine hundred and nine weights, in a hundred and thirty layers." |
| **ch01-s04** | 0:33–0:45 | scene · candleAmber | The camera passes *through* Monitor into the wallpaper: hundreds of thin semicircular arcs, mostly copper, some grey-blue indigo, one per stored weight [OS14]. Multiplane dolly; the arcs part like threads on a loom. A label fades in at the beat: *copper adds · indigo subtracts*. | L0005 "The wallpaper is drawn from that network: one arc for every weight." · L0006 "And here is the strange part." |
| **ch01-s05** | 0:45–1:00 | scene · candleAmber | Hard cut, with a clack, to the detective's study: a copper desk lamp clicks on, revealing the parchment Case Board. Two hands pin the first card: a small ink drawing of the desk. On the card, in type: Q085 "Every weight of the program is written by builder code, and none is trained." The pen hovers over a blank card titled *HOW?* | L0007 "Nobody trained it. Every one of those numbers was written by hand." · L0008 "So how does a list of hand-written sums run a desktop, and run it exactly?" |

`claims` for these shots: s02 OS01, OS15, OS18 · s03 OS02, PJ20 · s04 OS14 · s05 Q085 (OS01). `onScreenText`: s03 `label` ×2; s04 `label`; s05 `quote` (Q085), `label` (*HOW?*).

Delivery notes for L0001–L0008: unhurried and close to the mic, the voice of a teacher who has just found something on his desk he cannot explain. The tone lifts slightly on "strange part". A beat of silence (`pauseAfter` 0.9) after L0006. L0007 is plain, almost flat; L0008 is a real question, not a rhetorical one.

---

## 6. The ending

**The board compiles (ch. 11, 0:45–1:20).** The detective's hands lift the cards one by one and re-pin each one a column to the right of the deepest card it depends on [CM01]. Columns form, as many as the clue graph's real dependency depth (computed, not chosen). The copper threads re-tension into a loom. The shuttered false trails (*the network wrote the note; a compiler did it; a GPU will make it fast; one evaluation per frame; established conclusions; clearly faster*) hang in their own columns behind closed shutters. A wave of copper light runs left to right, from the 1943 lantern to the desk. **Every card lights. Behind each closed shutter the light runs too, and stops dead.** The narration over it: "It never stops early."

**The verdict and what's open (1:20–1:35).** Q125 is set on a parchment card and read. The two lamps still burning, *REGULAR JAVASCRIPT?* and *FULLY DIFFERENTIABLE?*, are framed together in a slow pan.

**The Replay (1:35–1:42), no narration.** The prologue's rewind runs forwards, each image now understood: the window glides from its press to rest (the clockwork); the photo squares fan out to the sketch (the valve); the **11** tile drops from two half-open shutters, then a tag reading *grid 1* snaps onto the wire and the tile flips to **10** (the promise); an arc threads itself into the wallpaper (a weight); the 1943 lantern's wick catches (logic).

**The last lines (1:42–1:45 and the hold).** The camera returns to the HandwiredOS desk, which is no longer X-rayed but warm and plain. The paper hand opens Notes. "A reader asked at launch: why? The README answered on its first page. 'what does that even do? Let's find out!'" [Q132 → Q010] A breath. "The case stays open. And in the Notes window, the last line of the to-do list still reads: 'Wire one more neuron by hand'." [Q088] The detective's hand pins one more card to the board, **blank**, and the lamp clicks off. The copper wire under the dock is the last light in frame (the film's first image, now understood). A single relay clack, and the score's two lines resolve onto one note.

**Closing credit card** (silent, 4 s): *Written with Claude (Anthropic), the same company whose coding tool is co-credited on most of Handwired's commits. Sources: chenglou/handwired @ 257856e and the research bible.* (Bible §9: stated once, as a fact about tooling.)

---

## 7. Emotional arc

| Phase | Chapters | Feeling | How it is earned |
|---|---|---|---|
| Wonder | 1 | delight, then unease ("nobody trained it?") | a real, small, beautiful desk; the wallpaper revealed as the network |
| Vertigo of age | 2–3 | reverence; the sense that the idea is old and deep | 1943 lanterns, Kleene's finite dial; the cost of unbounded precision |
| Suspicion | 3–4 | sceptical ("is this a trick?") | the suspects; Tracr's caution; "no tool converts…" |
| Delight in arithmetic | 5 | the click of understanding | ramps worked by hand at 3, 4, 5, 6, 100 |
| Comic betrayal | 5 | a laugh, then respect | **eleven**; then "promises, not proofs"; 2^149 |
| Deflation and recovery | 6 | "oh, the GPU didn't help?" | the furnace cools; the text box takes about 15,600 operations out of the program (derived: 19,851 → 4,251) |
| Awe at clockwork | 7 | quiet wonder | 14 operations for any number of steps; two frame rates in bit-for-bit lockstep |
| Humility | 8 | sobering, warm | the shared-bug checker; a constant that changed 0/20; fixed by dawn |
| Tenderness | 9 | affection for a machine that learns | the shut valve; "far-off photos vote"; "the spirit of the gallery…" |
| Bruising, fairly | 10 | the sting of public critique, heard out | the DSL critique, eleven found by hand, "why?" |
| Open curiosity | 11 | satisfaction without closure | the board compiles; "Let's find out!"; the blank card |

The film's emotional engine is **honesty paying off**. Each time the repo admits a limit (whole numbers only, promises not proofs, CPU only, not yet tried), the viewer trusts it more, and the film earns its ending: an open case rather than a triumph.

---

## 8. Curiosity planted and paid off

| Planted (where) | Paid (where) | Claims |
|---|---|---|
| "Nobody trained it" (ch. 1) | builder code (ch. 4); unfreezing (DD III); "not one of its weights is trained" X-ray (DD III) | Q085, Q017, Q010 |
| The note is the network's writing? Put that in the file (ch. 1) | the text box takes about 15,600 operations out of the program (ch. 6; derived, 19,851 → 4,251, after a Files merge took 21,229 → 19,851) | Q087, OS04 |
| "…and run it exactly?" (ch. 1, L0008) | what exact means (DD I, step 10) | Q036, EX03 |
| The **11** tile in the rewind (ch. 1) | the marble at 4.5 (DD I); a reader finds it by hand (ch. 10); the tag flips it to 10 in the replay (ch. 11) | TE03, PJ27, PJ19, TE05 |
| McCulloch and Pitts's neurons didn't learn (ch. 2) | "These can, if you let them" (DD III, step 4) | FR05, DG01 |
| A finite machine; time must come from outside (ch. 3) | the host loop turns the crank (DD II, step 11) | FR07, FR25 |
| Unbounded precision is the price of power (ch. 3) | 2^24 blurring and the 2^149 lens (DD I) | FR14, EX02, TE08 |
| Three suspects (ch. 1) | trained? no (ch. 4); compiler? no (ch. 4, again in ch. 10); a network? yes, in the plain sense (ch. 6) | Q085, Q014, PR04 |
| The shutters on false-trail cards (every chapter) | the board compiles: the shuttered cards run too (ch. 11) | TE10, CM01 |
| "Let's find out!" (DD III, step 1) | the answer to "why?" (ch. 11) | Q010, Q132 |
| Notes' to-do list (ch. 1) | the film's last spoken line (ch. 11) | Q088 |
| The copper wire under the dock (first image) | the last light in frame | OS18 |

### Debates, all placed (bible §7)
1. "Regular JavaScript": ch. 4 (the docs), ch. 10 (both sides) [PJ03, Q014, Q130]. 2. "Exact": DD I, step 10 [EX01, EX03, TE07]. 3. "Fully differentiable": DD III, step 5 [DG03]. 4. Is the GPU faster? ch. 6 (no, for the desktop), ch. 10 (yes, for 100,000 documents; not always) [CM08, JS13, Q092]. 5. Trees vs loops: DD II, step 9 [PT06, PT14]. 6. Snap vs carry, and every evaluation vs commits only: DD II, steps 5–6 [HL27, HL10–HL13]. 7. Trained vs hand-written recovery: ch. 11 [LB21–LB24, Q121–Q124]. 8. Neurons as logic gates: ch. 2 [FR11, FR12]. 9. Turing completeness of nets: ch. 3 [FR14, FR15]. 10. Learn vs compile: ch. 3 [FR20]. 11. Who wrote it: ch. 8, said once and plainly [PJ08, PJ21].

### Brief must-cover, all placed
What a program is: ch. 4 · the README example by hand, both branches run, the 0/1 selector: DD I · exactness, declared ranges, rounding points, `emitCompare`: DD I and ch. 6 · one big matmul, fusion, sparsity, backends: ch. 6, ch. 10 · the host loop, no early stop: DD II · counts, trees, tables, same work on every item (findIndex, running totals, sort, filter + slice into K): DD II · springs and time: DD II · the three demos: ch. 1/6 (HandwiredOS), DD III (gallery), ch. 10 (JSON search) · differentiability, unfreezing, end to end: DD III · the lab and what's open: ch. 8, ch. 11 · McCulloch and Pitts and modern compiling work as framing: ch. 2–3.

---

## 9. Five unforgettable images

1. **The wallpaper is the network.** The camera passes through a paper window into a cathedral of 9,909 thin arcs, copper and indigo, one per weight, parting around us like threads on a loom [OS14]. It is the prologue's reveal, and the finale's board-turned-loom rhymes with it.
2. **Eleven.** A marble rests halfway up a ramp at 4.5. Both shutters hang half open, two conveyor belts that only carry 10 and 12 keep running, and a paper tile reading **11** tips out of the machine while the music sounds both of its lines at once [TE03].
3. **Two to the hundred and forty-ninth.** A hairline sliver of light, the smallest gap a 32-bit float can hold, passes through six paper lenses in turn until it fills the frame as a solid bar [TE08, EX05].
4. **Two frame rates in lockstep.** Two ghosted desks, one stuttering at ten frames a second and one gliding at a hundred and twenty. In the familiar loop they slide apart by hundreds of pixels; in Handwired's they lock into one image, and the bit-strips beneath them match, digit for digit [HL18, HL11].
5. **The board compiles.** The detective's case board re-pins itself by dependency depth into a loom. A wave of copper light runs from a 1943 lantern to a modern desk, and every false trail lights too, stopping dead behind its own closed shutter [CM01, TE10].

(A reserve image, for the editor: in the recovery grid, about 1,300 dark cells fill with light under a paper hand while the 240 lit cells of the valid path stay exactly as they were [LB19].)

---

## 10. Cast, sets and sensitivities

- **Cast (puppets):** `mcculloch` (1940s, tall, `fullBeard`, suit and tie; a cigarette as an inner cut detail; secondary appearance notes), `pitts` (1940s, slight, `round` glasses, long forehead, about twenty). Both appear only in ch. 2. Everyone else is a **text card** or **hands**: von Neumann and Kleene (generic 1940s–50s text cards; no likeness researched), the frog-lab researchers (generic lab silhouettes at a distance), all living researchers, and the HN commenters (never drawn).
- **Hands sets:** *the detective* (fountain pen, cards, lamp, magnifier) and *the author's desk* (laptop with no logo, lamp, two hands, and sometimes a second paper hand for the coding agent). They are never in the same frame.
- **Sets:** the detective's study and Case Board (every chapter) · the HandwiredOS desk as toy theatre (ch. 1, X-ray beats, ch. 11) · a 1943 study with lanterns (ch. 2) · the RAND memo on a desk; the frog's hemisphere (ch. 2–3) · parchment plates (the deep dives) · the loom hall (ch. 6, ch. 11) · the clockwork room (DD II) · the gallery stage (DD III) · the map of 100,000 cells and the RegExp booth (ch. 10).
- **Quote integrity:** every quoted span above is verbatim from `quotes.json`, informal spellings included (Q103 "plz", Q106's "alignemtn", if that quote is ever extended past "something"). American spellings inside quotes stay American ("organized", Q142). Narration outside quotes is British ("realise", "optimiser", "centre", "aluminium").
- **Fairness:** Cheng is quoted only where the repo marks his words (Q103, Q106) and from his own post (Q104). The reassessment's prose is never put in his mouth (Q115–Q118 are attributed to "the September reassessment"). Every lab (Anthropic, OpenAI, DeepMind, Percepta, Google) is named in the same factual register. No lab is said to have endorsed Handwired.
- **Honesty guardrails on screen:** timings carry their machine and date in small type (bible §9). "In the repo's tests" is said aloud for bit-identity. "Derived" labels go on the valve toy and the squaring-press count. "About 240" and "about 1,300" are used for the recovery grid.
