# Treatment: PEOPLE AND PERSISTENCE

**Film:** neural-net-history (pilot) · **Angle:** people and persistence · **Target:** 32:00, about 3,040 narration words · **As of:** 5 October 2026
**Sources:** `research/bible.md`, `claims.json`, `quotes.json` only. Claim ids are in square brackets. Quote ids start with `q`. Every quote below is copied word for word from `quotes.json`.

---

## 1. Title and logline

**Title:** ***The Long Relay***
**Subtitle:** *Neural networks, and the people who would not put them down*

**Logline:** For eighty years one fragile idea, that a machine could learn by changing its own connections, was passed from hand to hand. A teenage runaway, a cheerful psychologist, a man who could not sit down, a student with two gaming cards, an intern from a maple-tapping village. Some carried it through two winters. Some died before the world agreed with them. One lived to win a Nobel Prize for it and then to warn us about it. This is the story of the hands that carried it, and of the sceptics who made every one of those hands hold on tighter.

**The angle in one breath.** We tell the history of AI as a relay race. An idea is something a person carries, and the film follows a handful of people across decades. There are believers (Rosenblatt, Hinton, LeCun, Bengio, Sutskever, Fei-Fei Li). There are sceptics (Minsky and Papert, Lighthill, Vapnik, Marcus, Bender and Gebru, and LeCun again, at the end). There are outsiders (Pitts, the lamplighters in Helsinki, Kyiv and Tokyo, Hopfield the physicist, an undergraduate intern, a founder in Hangzhou). For each era we ask the brief's three questions as **human** questions: what did they believe, who told them they were wrong, and how long did they keep believing? The teaching machines are the physical form of the baton. Whatever the hands pass on is a real, working machine, and the deep dives open two of those machines and run them in front of us.

**The narrator.** An unseen elderly British academic, unnamed and not a real person. He is slow, warm, wry and precise, a teacher who has told this story many times and still enjoys it. He is never Geoffrey Hinton, who appears in the film as a character, and the voice must not sound like him [bible §9.8]. The narrator speaks in first person only as a guide ("Hold on to that question"). He never claims to have been in the room.

---

## 2. The relay roster (who we follow)

The film's spine is ten "hands". Each recurs, ages, and is marked by a consistent silhouette signature (style bible §4.4; every feature must be checked against licensed photos; no caricature).

| Hand | First seen | Last seen | Persistence arc (what they believed, how long) | Key claims |
|---|---|---|---|---|
| **Walter Pitts** (with Warren McCulloch) | Prologue / Ch 1, 1941 | Ch 3, 1969 | The teenager who co-wrote the first neural-net paper, never finished a doctorate and died alone in 1969. The *first hand*. | e1-pitts-age, e1-pitts-degree, e1-pitts-death |
| **Frank Rosenblatt** | Ch 2, 1958 | Ch 3, 1971 (echo in Ch 11) | The believer who built the first learning machine and died at 43, before anyone vindicated him. Believed for about 14 years (1957–71). | e2-onr, e2-mark1-specs, e3-rosenblatt-death, e3-dedication |
| **Marvin Minsky** (with Seymour Papert) | Ch 1, 1951 | Ch 3 (echo in Ch 4) | Built one of the first neural machines, wrote his PhD on them, then became "the loyal opposition". A believer turned sceptic. | e1-snarc, e1-minsky-thesis, e1-minsky-switch, e3-perceptrons |
| **Bernard Widrow** | Ch 1, 1956 | Ch 13, 2025 | The quiet witness: at Dartmouth in 1956 he "never got over it". He built a neuron over a weekend and died in September 2025 aged 95, having seen almost the whole relay. | e2-widrow-dartmouth, e2-lms, e2-widrow-death |
| **Geoffrey Hinton** | Ch 4, 1976 | Ch 13 | The persister. More than three decades in the cold (Sussex 1976 to Florence 2012), then the auction, the Nobel and the reversal. The film's longest arc. | e4-hinton-cv, e4-rhw, e8-result, e12-hinton-timeline, e4-nobel |
| **Yann LeCun** | Ch 5, 1988 | Ch 13 | The engineer who kept nets *working* through the winter (ZIP codes from Buffalo, then checks). A believer vindicated, who later became the leading dissenter on risk and on language models. | e6-lecun-belllabs, e6-checks, e12-lecun-2023, e14-lecun |
| **Yoshua Bengio** | Ch 5, 2003 | Ch 13 | Montréal's patient holdout ("the worst possible time"). His lab gave the transformer its seed (attention). Later he chaired the International AI Safety Report. | e6-bengio-nplm, e6-outcast, e9-attention, e14-bengio |
| **Fei-Fei Li** | Ch 6, 2007 | Ch 7 (echo Ch 13) | The outsider on a different axis. She believed *data* mattered more than the field thought and was warned it would hurt her tenure. | e7-imagenet-origin, e7-imagenet-skeptics, e7-imagenet-19years |
| **Ilya Sutskever** | Ch 6, 2011 | Ch 13 | The student who believed performance would scale with data: AlexNet, then seq2seq, then OpenAI, then "back to the age of research". | e8-origin, e9-seq2seq, e9-openai, e14-sutskever-research |
| **Sepp Hochreiter** | Ch 5, 1991 | Ch 9, 2017 | He found the fading whisper (vanishing gradients) and built the pipe that carried it (LSTM). Twenty years later he stepped up to praise the machine that replaced it. | e5-vanishing, e6-lstm, e10-poster |

**Carried in passing:** Hebb, Turing, Hopfield, Rumelhart, the lamplighters (Amari, Ivakhnenko, Linnainmaa, Fukushima, Werbos), Vapnik and Jackel, Krizhevsky (no invented views, no birthplace [bible §9]), the Eight (Uszkoreit, Shazeer, Vaswani, Parmar, Jones, Gomez, Kaiser, Polosukhin), Kaplan and Dario Amodei, Liang Wenfeng (a generic silhouette, never a likeness [e13-r1-release]).
**The sceptics' bench** (each given dignity and their own verified words): Minsky and Papert, Lighthill, Fodor and Pylyshyn, Vapnik, Breiman, Marcus, Bender and Koller, Gebru, and LeCun on risk.

**Thematic rule:** the sceptics are *part of the relay*. Every belief the field kept is one that survived them. The film never casts a villain [bible §9.4].

---

## 3. Chapter list (32:00)

Words are targets for the slow voice (about 95 per minute on average). The deep dives run thinner because their machines need silent demonstration time.

| # | Chapter | Era | Min | Words | The hand(s) | The belief, and how long it held (the Fuse) |
|---|---|---|---|---|---|---|
| P | **The Lamp** | — | 1:00 | 85 | the viewer's own hand | — |
| 1 | **The Runaway and the Poet** | 1941–1956 | 1:45 | 170 | Pitts, McCulloch, Hebb, Turing, Minsky, Widrow | "The brain is a logic machine." As neuroscience it lasted about 16 years, 1943 to 1959 [e1-frog] |
| 2 | **The Believer** | 1957–1965 | 2:15 | 220 | Rosenblatt, Widrow and Hoff | "A random net can learn to see." Peak optimism 1958 to about 1962; abandoned by 1965–66 [e2-exits] |
| 3 | **The Loyal Opposition** | 1961–1980 | 2:30 | 235 | Minsky and Papert, Rosenblatt's death, Lighthill, the lamplighters | "Multilayer nets are sterile." In the US mainstream, about 1969 to 1982–86; in Britain almost a decade [e3-uk-cut] |
| 4 | **The Long Apprenticeship** | 1976–1995 | 2:30 | 240 | Hinton, Hopfield, Rumelhart; the expert-systems boom | "Intelligence is typed-in knowledge." Commercial confidence about 1980–87 [e5-lisp-crash]; Cyc carried the bet nearly four decades [e5-cyc] |
| 5 | **A Winter of Prestige** | 1988–2006 | 2:00 | 190 | LeCun, Vapnik and Jackel, Hochreiter, Bengio, Breiman | "Nets are fiddly; SVMs have theory." About 10–15 years by subfield [e6-nn-winter] |
| 6 | **Three Bets** | 2006–2012 | 1:45 | 175 | Hinton (algorithms), Li (data), IDSIA and Sutskever (GPUs and scale) | "Deep nets need pretraining." Strongest 2006–10, undermined 2010–11 [e7-pretraining-belief] |
| 7 | **Two Cards in a Bedroom** (AlexNet deep dive) | 2012 | 4:00 | 350 | Sutskever, Krizhevsky, Hinton (absent), Li, LeCun | "Features must be hand-designed." About 1999–2012, gone within two years [e8-ilsvrc2013] |
| 8 | **The Gold Rush** | 2012–2017 | 1:30 | 150 | Hinton at Tahoe, Sutskever, Bengio's lab, Lee Sedol | "Go is a decade away." Ended between October 2015 and March 2016 [e9-go-decade, e9-lee-sedol] |
| 9 | **Eight Names in Random Order** (Transformer deep dive) | 2016–2017 | 4:30 | 400 | Uszkoreit, Shazeer, Vaswani, Parmar, Jones, Gomez, Kaiser, Polosukhin; Hochreiter | "Language needs recurrence." About 20 years, 1997–2017, then gone in about 18 months [e10-rnn-belief, e10-bert-search] |
| 10 | **The Wager on Scale** | 2018–2022 | 2:15 | 215 | Radford, Kaplan, Sutton, Bender and Gebru, Christiano, Dario and Daniela Amodei | Kaplan's split of compute held about two years before Chinchilla [e11-chinchilla] |
| 11 | **A Box Anyone Could Type In** | 2022–2024 | 2:00 | 195 | ChatGPT; Hinton's reversal; the three laureates split | Hinton's own "30 to 50 years" ended in 2023 [e12-hinton-timeline] |
| 12 | **Two Shores** | 2017–2026 | 2:00 | 200 | Liang Wenfeng, Amodei, Hassabis, Huang, Yao; two governments | Five beliefs, from about two years down to a single day [Era 13 A–E] |
| 13 | **The Lamp Passes** | 2024 – 5 Oct 2026 | 2:00 | 200 | everyone, then the viewer | "Scale + RL + agents gets us there soon." About two years old and contested [Era 14] |
| | **Total** | | **32:00** | **≈ 3,025** | | |

---

## 4. Recurring narrative and visual devices

1. **The Relay Lamp (the baton).** A small paper lantern on a cord (kit `paperLantern`) passes from hand to hand. Its cuffs and sleeves change by era (wardrobe table, style bible §4.3). Each handoff is a cut-paper move on twos: one hand lowers it, the next lifts it. Inside the lantern there is always a tiny `lanternNetwork`: the idea itself, glowing. When a holder dies or leaves, the lamp is set on a windowsill and stays lit until another hand takes it. Score: the **relay motif**, four rising notes on a celesta, re-orchestrated for each holder.
2. **The Fuse of Belief.** This is how the film answers "how long did people think that way?" every time. Each era's central belief is a lit cord strung across the proscenium between two posts, with date stamps in era-adaptive type at each end. The cord burns at a rate set by real years, and its length is the duration. The believers stand at the start post, the dissenters at the far post, and when the flame reaches the post the belief has ended. The narrator gives the duration in plain words ("That belief held for about twenty years"). Each fuse uses only the durations in bible §2.
3. **The Candle Between Them.** Every debate is staged as the style bible prescribes: two silhouettes across a candle on the centre third, each side lit with its own hue (±15°), both lit with equal warmth. Each side speaks only through verified quote cards. The film presents both sides and does not adjudicate [bible §7].
4. **The Winter Window.** In both winters the city goes dark, and snowfall density is tied to funding and interest. A few windows stay lit, the lamplighters, each labelled with a city in typewriter type (Kyushu, Kyiv, Helsinki, Boston, Tokyo; later Toronto, Montréal, Holmdel, Munich, Lugano). The lit window is the visual rhyme for persistence.
5. **The Washing Line of Questions.** The unseen narrator pegs a paper slip with a written question onto a line across the top of the frame (a generic cut-out hand, not a real person). Slips stay pegged across chapters. When a question is answered, its slip is unpegged and drops into the Relay Lamp's glow. This is the curiosity engine (§10).
6. **Quote Drawers.** Verified quotes appear as parchment slips drawn from a card-catalogue drawer, in EB Garamond italic with attribution in Cormorant SC. Machine-generated text gets a different slip, ruled like ticker tape and stamped MACHINE-GENERATED TEXT [bible §9].
7. **Name cards and era-adaptive date stamps.** The type style changes as history advances: Special Elite, then VT323, then IBM Plex Mono (style bible §7).
8. **Teaching machines as the things being handed on.** Each machine first appears in the hands of the person who built its real ancestor:
   - `perceptronRetina` (Rosenblatt)
   - `xorPlate` (Minsky and Papert)
   - `lanternNetwork` with the backward messenger (Rumelhart, Hinton, Williams)
   - `mistyHills` (gradient descent)
   - `stencilLantern` and `alexnetCathedral` (LeCun, then Krizhevsky)
   - `threadsOfLight`, `transformerLoom` and `typeSlugs`/`nextToken` (the Eight, then GPT)

   Every visual variable is bound to a real quantity (style bible §6).
9. **Match cuts that carry the baton across eras** (style bible §9):
   - the Mark I's 20×20 retina → an ImageNet thumbnail grid → AlexNet's 96 first-layer filters
   - a candle flame → a GPU status LED
   - the Perceptrons book's shadow → winter night
   - the loom → the attention matrix
   - fanfold paper → a token banner
   - window mullions → server-rack aisles
10. **Buffalo, twice.** One quiet rhyme the narrator lets the audience notice: the Mark I was built in Buffalo [e2-mark1-specs], and LeCun's first ZIP-code network learned from Buffalo mail [e6-lecun-1989].

---

## 5. Chapter treatments

### P — The Lamp (0:00–1:00)
Shot-by-shot in §8. The viewer's open palm receives a lantern, and the relay begins.

### 1 — The Runaway and the Poet (1941–1956) · 1:45
- **Chicago, about 1941.** A small, spectacled teenager, Walter Pitts, is introduced by Jerome Lettvin to Warren McCulloch, 42, a bearded philosopher-poet. Pitts moves into the McCulloch home in Hinsdale [e1-pitts-age]. The Principia story is told with attribution: "by one biographer's account" [e1-pitts-principia].
- **1943.** Their neuron is a threshold switch: all or none. On a parchment plate, triangles, threads and knots (their Figure 1 redrawn in paper-cut) [e1-mp-paper]. The narrator reads one sentence from the paper: *"The structure of the net does not change with time."* [q-mp-assumption5]. Then: "So their brain could think. It just couldn't *learn*." The first slip goes on the washing line: **"How would a machine change its own wiring?"**
- **The first handoff.** In 1949 Donald Hebb proposes that a connection used repeatedly grows stronger [e1-hebb]. On screen there is a quote card with Hebb's postulate [q-hebb-postulate], and the narrator says aloud that "fire together, wire together" is a later paraphrase, not Hebb's words [e1-hebb-notslogan]. In 1950 Turing proposes a "child machine" to be educated [q-turing-child] [e1-turing-1950]. *Planted:* education, which pays off at RLHF.
- **Dartmouth, summer 1956.** The proposal that names "artificial intelligence" lists "Neuron Nets" as topic 3 [e1-dartmouth-neuronnets]. Young Minsky had already built SNARC in 1951: about 40 neurons and 300 tubes, its memory turned by a surplus bomber autopilot, and a wiring accident that made its simulated rats follow each other. *"We sort of quit science for a while to watch the machine."* [q-minsky-snarc-watch] [e1-snarc]. His PhD was on neural nets [e1-minsky-thesis]. Then he turns away, drawn to symbols [e1-minsky-switch]. *Planted:* the man who would later be blamed for killing the perceptron built one of the first learning machines.
- **Bernard Widrow** sits in for a week at Dartmouth: *"I was so taken by this that I never got over it."* [q-widrow-dartmouth] [e2-widrow-dartmouth]. The narrator: "Remember him. He'll be with us almost to the end."
- **Fuse:** "The brain is a logic machine." Pitts himself helps end it: the 1959 frog's-eye study found the retina doing rich feature detection, and Lettvin recalled it disappointed Pitts [e1-frog]. As neuroscience the belief held about sixteen years.
- Music: candle-room chamber (celesta, viola). Mood candleAmber; Chicago window with the El trestle.

### 2 — The Believer (1957–1965) · 2:15
- **Washington, 7 July 1958.** A room-sized IBM 704 learns, after 50 punch cards, to tell marks on the left from marks on the right [e2-1958-demo]. The next morning's lede, attributed to *the Navy*, says it would "walk, talk, see, write, reproduce itself and be conscious of its existence" [q-nyt-1958]. Even-handed framing per [e2-hype-responsibility]: Rosenblatt himself had written that summer that such a machine was about to be born (narrated as a paraphrase, not quoted), and the press ran with it. Both get a share of the blame.
- **Rosenblatt the man** (dark hair combed back, white shirt, narrow tie). He has students living at his house helping to build an observatory, he climbs mountains, he plays music [e2-rosenblatt-observatory]. Asked what the machine is good for: *"At the moment, none whatever," Dr. Rosenblatt said cheerfully.* [q-rosenblatt-none]. Asked what it could never do, he threw up his hands: *"Love," he said. "Hope. Despair."* [q-rosenblatt-love].
- **TEACHING MACHINE: the Mark I** (`perceptronRetina`, about 45 s). Built in Buffalo [e2-mark1-specs]. Steps:
  1. A 20×20 grid of photocells, 400 eyes, lights up with a bar.
  2. Hundreds of patch cords run at random to association units. The wiring was laid out from a table of random numbers [e2-mark1-random].
  3. The units that fire pull a dial needle left or right.
  4. When the answer is wrong, a small motor turns each active knob a little toward the right answer, and only the active ones move. "Every learned weight was a knob, turned by its own little motor. You could *hear* it learn." [e2-mark1-specs]
  5. On screen: w ← w + η·t·x. The tally of mistakes falls as the machine learns horizontal against vertical bars (real training record from `perceptronMath`).

  The narrator adds the theorem's catch: if a dividing line exists, the rule will find it, *if* [e2-convergence]. That "if" goes on the washing line: **"And if no straight line exists?"**
- **Stanford, a weekend in fall 1959.** Widrow and his student Ted Hoff find a smoother rule on a Friday. *"By late Sunday afternoon, the single neuron was fabricated and working."* [q-widrow-sunday] [e2-lms]. ADALINE, a black shoebox with a needle swinging toward zero error [e2-adaline]. Aside: Hoff later co-invented the microprocessor [e2-hoff-4004].
- **The reckoning.** Rosenblatt's own 1961 book: teaching the Mark I all 26 letters in two typefaces "have been unsuccessful" [q-rosenblatt-limit]. He blames the press, *"a pack of happy bloodhounds"* [q-rosenblatt-bloodhounds], and insists the machine is *"first and foremost a brain model"* [q-rosenblatt-brainmodel].
- *Two seeds planted:* a figure in the same book is captioned "BACK-PROPAGATING ERROR-CORRECTION" (a different procedure; the name returns in 1986) [e2-backprop-name]. And a sentence on a quote card, held for Ch 11: *"Linguistic capability, related to perceptual experience, is of the essence for an 'intelligent' system, artificial or otherwise."* [q-rosenblatt-linguistic].
- **Fuse:** peak optimism 1958 to about 1962. By 1965–66 the SRI and Widrow groups had left neural nets, stuck on how to train more than one layer [e2-exits]. About seven years from headline to exit.

### 3 — The Loyal Opposition (1961–1980) · 2:30
- Rosenblatt's footnote calls Minsky's critique *"an entertaining statement of the views of the loyal opposition"* [q-rosenblatt-loyal]. The chapter takes its title from it, and from the courtesy in it.
- **The Candle Between Them.** Minsky in 1961: random nets "can probably never" recognise *"the class of figures having two separated parts"* [q-minsky-twoparts] [e2-minsky-1961]. Minsky and Rosenblatt are said to have attended the same Bronx high school; sources disagree on which was ahead, so the film attributes the detail or omits it [e2-bronx].
- **TEACHING MACHINE: XOR** (`xorPlate`, about 40 s). Four lanterns sit at the corners of a parchment plate, with the two opposite corners lit. One straight scissor cut sweeps through every angle and always leaves one lantern on the wrong side (the plate counts them). Two cuts, made by a hidden layer, carve the diagonal band, and the paper folds into hidden space where one cut succeeds. The narrator states precisely what the 1969 book proved: single-layer, order-limited perceptrons cannot compute parity or connectedness [e3-perceptrons]. Hidden layers could already *represent* XOR. Nobody knew how to *train* them [e3-xor-known]. For multilayer machines the book offered only *"our intuitive judgment that the extension is sterile"* [q-perceptrons-sterile] [e3-sterile]. The slip "And if no straight line exists?" is half answered and stays on the line: **"Then how do you train the hidden layer?"**
- **1969, the cold year.** Perceptrons is published and Minsky wins the Turing Award [e3-minsky-turing]. The Mansfield Amendment narrows military-funded research [e3-mansfield]. On 14 May Walter Pitts dies alone, having burned his dissertation, and McCulloch dies four months later [e1-pitts-death]. The first hand lets go. Handled with restraint: a lamp set on a sill, no dramatisation.
- **11 July 1971.** Rosenblatt drowns sailing on Chesapeake Bay on his 43rd birthday [e3-rosenblatt-death]. It was an accident. The film never implies despair [bible §9]. The 1972 printing of *Perceptrons* carries a handwritten dedication: "In memory of Frank Rosenblatt" [e3-dedication]. The camera holds on the handwriting.
- **Fairness:** "Did one book kill a field?" The film's line: true, narrow theorems, read by a hype-weary and money-short field as a verdict; one cause among several, alongside ALPAC, Mansfield and DARPA's applied turn [e3-killed-debate, e3-alpac]. Papert, nineteen years later: *"We did not think of our work as killing Snow White; we saw it as a way to understand her."* [q-papert-understand].
- **Britain.** Lighthill, who read "for two months" [q-lighthill-twomonths], blames the "combinatorial explosion" [q-lighthill-explosion]. On television in 1973, Michie, McCarthy and Gregory argue back [e3-lighthill-debate], staged as a courtroom. The book's shadow lengthens across a field and becomes winter (match cut). UK funding falls for almost a decade [e3-uk-cut].
- **The Winter Window: the lamplighters.** Lit windows come up one by one:
  - Kyushu: Amari, 1967, a learning theory for multilayer nets [e3-amari]
  - Kyiv: Ivakhnenko [e3-amari]
  - Helsinki: Linnainmaa's 1970 master's thesis, reverse-mode differentiation with FORTRAN code, not about neural nets at all [e3-linnainmaa]
  - Harvard: Werbos, 1974 (whether it applied to nets is disputed) [e3-werbos]
  - Tokyo: Fukushima's Neocognitron, from a broadcasting company's lab [e3-neocognitron]

  The narrator: "Nobody in the warm houses was looking at these windows. That is what a winter is."
- **Fuse:** in the US mainstream, about 1969 to the early-to-mid 1980s, roughly fifteen years.

### 4 — The Long Apprenticeship (1976–1995) · 2:30
- **Hinton's wandering.** A tall, lean young man at a desk, then a different desk: Sussex, San Diego, Cambridge, San Diego again, Carnegie Mellon, and finally Toronto in July 1987. He left the US partly because most American AI money came from the military and partly from disillusionment with Reagan-era politics [e4-hinton-cv, e4-hinton-leaves-us]. CIFAR takes him in [e4-cifar]. (He is not staged standing in the 1980s; no source supports it [bible §3].)
- **The physicist's way in.** Summer 1981, Hall of Mirrors at Versailles: Hopfield presents his network. *"I have never met anyone who remembered hearing the talk."* [q-hopfield-versailles] [e4-hopfield-versailles]. On the plate, a ball rolls into valleys and a half-remembered pattern completes itself [e4-hopfield]. Then the Boltzmann machine (Ackley, Hinton, Sejnowski): lanterns flicker hot, then cool and settle [e4-boltzmann].
- **TEACHING MACHINE: backpropagation** (`lanternNetwork` on XOR plus `mistyHills`, about 45 s). Light flows up through the lanterns. The output is wrong, so a red glow appears. A *messenger*, a dark bead in a ring of light, runs back down the strings and tugs each one by its share of the blame. Over the epochs the XOR lanterns settle and the plate from Ch 3 solves itself. The slip **"Then how do you train the hidden layer?"** comes down. In `mistyHills`, the traveller with a lantern can see only the slope at his feet. A timid stride gets stuck in a hollow and a bold one finds the valley. 9 October 1986, *Nature*: hidden units *"come to represent important features of the task domain"* [q-rhw-abstract] [e4-rhw]. In the family-trees experiment, hidden units discover nationality and generation without being told [e4-rhw-family]. *Payoff:* the 1961 caption "back-propagating error-correction" returns, now naming a different procedure [e2-backprop-name].
- **Credit, fairly:** invented several times independently (the Helsinki window lights up again); the 1986 paper made it stick [e4-backprop-priority]. Hinton: *"I have never claimed that I invented backpropagation."* [q-hinton-notinvent].
- **The other boom, and the second winter.** Meanwhile the money is elsewhere: experts' knowledge typed in as rules. XCON configures computers, with half its rules changing every year [e5-xcon]. Cyc sets out to type in common sense [e5-cyc]. Japan's Fifth Generation project is depicted as researchers, not a menace [e5-fgcs]. In Austin, 1984, a panel coins the winter's name: *"called the "AI Winter" by some, prompted someone to ask me if "nuclear winter" were the situation where funding is cut off for nuclear weapons."* (read as a fragment of [q-mcdermott-winter]) [e5-aaai84]. In 1987 the Lisp-machine market collapses in about a year [e5-lisp-crash]. Snow returns on the far side of the stage.
- **The sceptics' bench:** Fodor and Pylyshyn: *"You don't, for example, find native speakers who know how to say in English that John loves the girl but don't know how to say in English that the girl loves John."* [q-fodor-pylyshyn]. The narrator: that debate has never quite closed. In 2023 *Nature* authors wrote that it "persists" and claimed to answer it, and not everyone agrees [e4-systematicity-2023].
- **Fuse:** commercial faith in typed-in knowledge ran about 1980–87. Cyc carried the bet nearly four decades.

### 5 — A Winter of Prestige (1988–2006) · 2:00
- **Holmdel, 1988.** LeCun joins Bell Labs [e6-lecun-belllabs]. A small camera on a gooseneck stares at a handwritten digit under a desk lamp. In 1989 his network learns ZIP codes from Buffalo mail [e6-lecun-1989] (*Buffalo, twice*). By 1996 the check reader is in banks: *"It is deployed commercially and reads several million cheques per day."* [q-lecun-checks]. LeCun estimates about one check in ten in the US [e6-checks]. The narrator: "So the winter was strange. Neural nets were working every day, and nobody important was talking about them. It was a winter of prestige, not of use."
- **Vapnik's street** (classical ML, about 30 s on a plate): two crowds of lanterns and the widest empty street between them; the lanterns on the kerb are the support vectors. One best answer, no local hollows, and a theory of why it generalises [e6-svm]. Boosting [e6-adaboost] and random forests appear briefly. Breiman in 2001: SVMs *"have proved to be more accurate predictors in classification and regression then neural nets"* (fragment, verbatim including the original "then") [q-breiman-svm] [e6-two-cultures].
- **The bet, 14 March 1995.** A restaurant table, two wine glasses, one typed sheet. Jackel bets that by 2000 people will understand why big nets work. Vapnik bets that by 2005 *"no one in his right mind will use neural nets that are essentially like those used in 1995"* [q-bet-vapnik, q-bet-jackel]. LeCun signs as witness [e6-bet]. Slip on the line: **"Who paid for dinner?"**
- **Hochreiter's whisper.** In 1991 a student in Munich shows why deep nets go deaf: the error signal passed backward through many steps fades like a whisper down a long line [e5-vanishing]. In 1997, with Schmidhuber, he builds the protected pipe, LSTM, which carries it *"in excess of 1000 discrete-time steps"* [q-lstm] [e6-lstm]. *Planted* for Ch 9.
- **Montréal.** Bengio teaches words to have vectors [e6-bengio-nplm]. The hard years, in their own later words:
  - LeCun: *"we couldn't get our papers published"* [q-lecun-outcast]
  - Bengio: *"It was the worst possible time,"* [q-bengio-worst]
  - Hinton, recalling what people said: *"This is crazy. Why are you wasting your time on this stuff? It's already shown to be nonsense."* [q-hinton-crazy]

  In 2004 CIFAR funds the small circle that LeCun later calls *"the so-called "Deep Learning conspiracy""* [q-lecun-conspiracy] [e6-ncap].
- A 20-second aside on a prediction's lifespan: in 1958 Simon and Newell said a computer would be chess champion "within ten years". Deep Blue won in 1997, 29 years late, with search and no neural learning [e1-chess-prediction, e6-deepblue].
- **Fuse:** about ten to fifteen years, depending on the field [e6-nn-winter].

### 6 — Three Bets (2006–2012) · 1:45
- **Payoff:** "Who paid for dinner?" Each man lost one bet [e6-bet]. The slip comes down.
- **Bet one, algorithms.** Hinton in 2006: deep nets would work *"provided that computers were fast enough, data sets were big enough, and the initial weights were close enough to a good solution. All three conditions are now satisfied."* [q-hs-threeconditions] [e7-autoencoder]. The belief that deep nets *need* layer-by-layer pretraining takes hold, and the dissent arrives on a gaming card: in 2010 IDSIA reaches a record with *"Good old on-line back-propagation"* (fragment) [q-ciresan-goodold] [e7-ciresan]. Fuse for pretraining: strongest 2006–10, undermined by 2011 [e7-pretraining-belief].
- **Bet two, data.** Princeton, January 2007. Fei-Fei Li's office is next door to WordNet's Christiane Fellbaum [e7-imagenet-origin]. Her slide says labelling by hand would take about nineteen years: *"Moral of the story: no graduate students would want to do this project!"* [q-li-slide-moral]. Colleagues advise *"something more useful for my tenure"*, and she jokes about reopening her family's dry-cleaning shop [q-li-tenure] [e7-imagenet-skeptics]. In summer 2008 she finds crowdsourcing [e7-imagenet-19years]: almost 50,000 people in 167 countries [q-li-workers] [e7-imagenet-workers]. The Mark I's 400-eye retina **match-cuts** to a sea of ImageNet thumbnails.
- **Bet three, compute and scale.** Speech goes first: Android phones were listening through a neural network about three months before AlexNet [e7-jellybean]. Hinton tells NIPS in 2009 to buy GPUs (his later recollection) [e7-buy-gpus]. In 2011 the student Ilya Sutskever, who believes performance will scale with data, persuades fellow student Alex Krizhevsky to take on ImageNet, with Hinton as supervisor [e8-origin]. The three bets meet on one desk.

### 7 — Two Cards in a Bedroom: AlexNet (2012) · 4:00 · DEEP DIVE
Full step-by-step teaching design in §6. People frame:
- **Open:** a tower PC in a bedroom at Krizhevsky's parents' house, per the Computer History Museum (NVIDIA says a lab; the narrator says "according to the museum") [e8-bedroom]. Two gaming cards, fans whining for five to six days a run [e8-gpus]. Krizhevsky wrote the GPU code [e8-origin]. He is depicted as a private figure at a desk, never given words or views [bible §9].
- **Florence, Friday 12 October 2012**, 17:05, the last talk of the session [e8-florence]. Hinton is not there: a chronic back problem meant he could not sit, so he did not fly [e8-hinton-absent]. *Planted:* the man who cannot sit down. By Li's account the room is so full that LeCun stands at the back [e8-hinton-absent].
- **Close of the chapter:** the Computer History Museum's line, *"Before AlexNet, almost none of the leading computer vision papers used neural nets. After it, almost all of them would."* [q-chm-beforeafter]. **Fuse:** hand-designed features, about 1999–2012. A year later all top five teams used convnets [e8-ilsvrc2013]. A belief that took a decade to build burned out in about a year.

### 8 — The Gold Rush (2012–2017) · 1:30
- **Lake Tahoe, December 2012. Payoff of the man who cannot sit.** Harrah's, Room 731. A laptop on an upturned bin so a man who has not sat down in seven years can type standing; he had travelled there lying down [e8-hinton-back, e8-auction-details]. Hinton auctions a three-person company by email, stops at $44 million and chooses Google. This is Cade Metz's reporting and the terms were not disclosed, so the narrator says "according to the journalist Cade Metz" [e8-auction].
- **The baton splits into many hands.** In quick montage:
  - word2vec, a star-field of words [e9-word2vec]
  - Sutskever's seq2seq, which reads sentences backwards and its authors were *"surprised by the extent of the improvement"* [q-seq2seq-surprised] [e9-seq2seq]
  - in **Bengio's lab**, Bahdanau calls the single summary vector *"a bottleneck"* and lets the translator look back at every word (planted for Ch 9) [q-bahdanau] [e9-attention]
  - OpenAI founded in 2015 as a non-profit, with Sutskever as research director [e9-openai]
- **Go:** Coulom in 2014: *"I think maybe ten years"* [q-coulom] [e9-go-decade]. In March 2016, Seoul: Move 37 [e9-move37]. Then Lee Sedol's move 78, which AlphaGo also rated one in ten thousand [e9-move78]; give him that move and his dignity. Fuse: about two years from "a decade away" to done.
- **Dissent from inside the rush.** A panda becomes a 99.3% gibbon [e9-adversarial]. Joy Buolamwini in a white mask in front of a cheap webcam [q-buolamwini-mask] [e9-white-mask]. Marcus: deep learning as *"a power screwdriver in a world in which we also need hammers, wrenches, and pliers"* (fragment) [q-marcus-screwdriver]. Then Hinton himself, 2017: *"The future depends on some graduate student who is deeply suspicious of everything I have said."* [q-hinton-suspicious] [e9-hinton-funeral]. That slip is pegged at the far end of the line and saved for the last minute of the film.

### 9 — Eight Names in Random Order: the Transformer (2016–2017) · 4:30 · DEEP DIVE
Full teaching design in §7. People frame (Google, Mountain View; Buildings 1945 and 1965; spring couches by a curtain printed "like synapses and neurons") [e10-buildings]:
- **Lunch, 2016.** Jakob Uszkoreit suggests self-attention to Illia Polosukhin [e10-design-doc]. At home his father, a computational linguist once jailed in East Germany, doubts it: *"From dinner-table conversations I had with my dad, we weren't necessarily seeing eye to eye."* [q10-uszkoreit-dad] [e10-hans]. A colleague, Mat Kelcey: *"basically the biggest incorrect prediction of my life."* (fragment) [q10-kelcey].
- **The relay inside the relay.** Noam Shazeer overhears, joins and rewrites the code [e10-shazeer-joins]. Aidan Gomez is twenty, an undergraduate intern, too young to drink in the US, from a farming village where his family tapped maple trees, and *he had come from Hinton's lab in Toronto* [e10-gomez]. The baton visibly passes from the Toronto window to Mountain View. At about 3 a.m., by Gomez's recollection, Vaswani says *"This is going to be a huge deal."* [q10-vaswani-bigger] [e10-couch]; the card reads "as recalled".
- **The deadline:** Niki Parmar in the micro-kitchen, *"The English-French numbers came, like, five minutes before we submitted the paper"* [q10-parmar-kitchen] [e10-deadline]. Llion Jones names it after a Beatles song: *"It literally took five seconds of thought. I didn't think they would use it."* [q10-jones-title] [e10-title]. The footnote: *"Equal contribution. Listing order is random."* [q10-random-order]. The film crowns no inventor [e10-author-order].
- **Long Beach, 6 December 2017. A baton handed back across twenty years.** The poster crowd stays until security closes the room at 10:30 pm: *"Security had to tell us to leave."* [q10-security]. An older figure steps forward. It is Sepp Hochreiter, who built the LSTM that this machine was replacing, and he praises it [e10-poster]. The whisper-pipe from Ch 5 glows once and goes dark.
- **Coda:** all eight later left Google [e10-diaspora]. Did Google miss it? Uszkoreit asks *"why didn't we do anything with the fact that we had seen it?"* (fragment) [q10-uszkoreit-gpt3]. Against that, Google moved Translate to transformers in 2018 and put BERT into Search in 2019. Both are presented [e10-google-missed, e10-bert-search]. **Fuse:** "language needs recurrence", about twenty years, gone in about eighteen months.

### 10 — The Wager on Scale (2018–2022) · 2:15
- **The straight line.** GPT-1 trained for *"1 month on 8 GPUs"* [q10-gpt1-cost] [e10-gpt1]. GPT-2 was withheld; the *press* framed it as "too dangerous to release" [e10-too-dangerous]. In 2020, Kaplan and colleagues (Dario Amodei among them) plot error against size on log-log paper and get a straight line *"spanning more than seven orders of magnitude"* [q11-kaplan-powerlaw] [e11-kaplan]. *Payoff* of AlexNet's line about "waiting for faster GPUs and bigger datasets". GPT-3: 175 billion parameters [e11-gpt3]. The growing-city teaching machine: lit windows for parameters, the road straight on log axes. Sutton's creed in 2019: *"general methods that leverage computation are ultimately the most effective, and by a large margin."* (fragment) [q11-bitter-opening] [e11-bitter].
- **Refinement, not refutation:** Chinchilla, a small rodent beside its bigger cousin, finds models *"significantly undertrained"* [q11-chinchilla-undertrained]. Kaplan's split lasted about two years [e11-chinchilla].
- **The sceptics' bench.** Bender and Koller's octopus taps a telegraph cable between two islands and fails only when a bear arrives [q11-octopus-bear] [e11-octopus]. *Stochastic Parrots* [q11-parrot] [e11-parrots]. Timnit Gebru's exit from Google in two voices: she says she was fired, Google says it accepted her resignation [e11-gebru]. Marcus: scaling laws are *"mere observations that might not hold forever…"* (fragment) [q11-marcus-laws].
- **Teaching the child machine (payoff of Turing, Ch 1).** A one-legged simulated robot learns backflips from *"900 queries in less than an hour"* (fragment) [q11-backflip] [e11-christiano]. Then InstructGPT: *"Making language models bigger does not inherently make them better at following a user's intent."* [q11-instructgpt-bigger]. A 1.3-billion-parameter model is preferred to the 175-billion-parameter one [e11-instructgpt]. Visual: a gardener's shears and a hedge (style bible §6).
- **Anthropic** (same standard as every lab; no founding-garage scene, no invented dialogue) [bible §9]. December 2020: OpenAI announces that its VP of Research, Dario Amodei, is leaving [e11-amodei-leaves]. In January 2021 former OpenAI researchers led by Dario and Daniela Amodei found Anthropic (no founder count given) [e11-anthropic-founding]. The tension is stated plainly: a company calling itself "an AI safety and research company" that also planned "computationally-intensive research to develop large-scale AI systems" [e11-series-a]. Constitutional AI: *"The only human oversight is provided through a list of rules or principles"* [q11-cai-rules], and the narrator adds what the paper itself says, that humans still write that list [e11-cai].

### 11 — A Box Anyone Could Type In (2022–2024) · 2:00
- **30 November 2022.** No new machine: one glowing rectangle in a dark room, and millions of small windows lighting up around it [e12-chatgpt-launch]. It is a GPT-3.5 model taught with human feedback and released as a "research preview" whose engineers did not expect much. Analysts estimated 100 million monthly users in two months [e12-users]. The launch post admits *"ChatGPT sometimes writes plausible-sounding but incorrect or nonsensical answers."* [q12-chatgpt-limits]. **Payoff of Rosenblatt's 1961 card**, re-read over the glowing box: *"Linguistic capability… is of the essence"* (fragment of [q-rosenblatt-linguistic]). The narrator: "He was sixty-one years early, and he was talking about language."
- **The race, in four beats:** Microsoft's "multiyear, multibillion dollar investment" [e12-microsoft]; Google's reported "code red" [e12-code-red]; Meta's research model leaking within about a week [e12-llama-leak]; and GPT-4 and Claude announced on the same day, 14 March 2023 [e12-gpt4, e12-claude-launch].
- **The persister turns.** May 2023, Hinton leaves Google. *"I thought it was 30 to 50 years or even longer away. Obviously, I no longer think that."* (fragment) [q12-hinton-wayoff] [e12-hinton-timeline]. In fairness to Google, his own tweet: *"Google has acted very responsibly."* (fragment) [q12-hinton-tweet]. The Fuse for his personal timeline burns out in a single frame.
- **The three laureates split.** The extinction-risk statement [q12-cais] lists Hinton first and Bengio second [e12-cais]. LeCun calls the takeover fear *"preposterously ridiculous"* (fragment) [q12-lecun-ridiculous] [e12-lecun-2023]. A third bench, the present-harms critics: *"The harms from so-called AI are real and present"* (fragment) [q12-dair-harms] [e12-dair]. Staged as three lamps, not two teams [e12-three-camps]. OpenAI's board removes and restores its CEO in five days; the reasons are disputed and attributed [e12-altman-fired, e12-altman-why].
- **8 October 2024, 2 a.m.** *"I'm in a cheap hotel in California, without an internet connection"* (fragment) [q12-hinton-hotel]. *"My very first thought was how could I be sure it wasn't a spoof call."* [q12-hinton-spoof]. The prize is shared with Hopfield, now 91 [e12-nobel-physics]; the man from the Versailles talk nobody remembered. Dame Wendy Hall calls it *"a bit of a stretch"* (fragment) [q12-wendy-hall]. Hinton spreads the credit: *"Ilya thought we should do it, Alex made it work, and I got the Nobel Prize."* [q-hinton-nobel-quip]. At the banquet he warns: *"We have no idea whether we can stay in control."* (fragment) [q12-hinton-banquet] [e12-hinton-banquet].

### 12 — Two Shores (2017–2026) · 2:00
Two shores across dark water, with skylines at equal height and equal warmth. No flags, no animal emblems. The China side may get a dyed-hide shadow-puppet nod (*piyingxi*) only if the US side gets an equally specific craft treatment [style bible §5]. Every US step is paired with China's stated response [bible §9]. Five Fuses burn in quick succession, from years to a single day [Era 13]:
- **A. "Whoever leads AI leads the century" (2017–22).** China's plan aims at *"making China the world's primary AI innovation center"* by 2030 and names no rival [q13-plan2017] [e13-plan2017].
- **B. "Compute is the chokepoint" (Oct 2022 – Dec 2024, about two years).** Washington's chip controls [e13-oct2022] are drawn as a fence of rule pages, a higher rail each year. Beijing's answer: the US *"abuses export control measures to maliciously block and suppress Chinese companies"* (fragment) [q13-mao-2022] [e13-china-2022-response]. **The hand on the far shore:** Liang Wenfeng, founder of DeepSeek in Hangzhou, shown as a generic silhouette among West Lake mist. *"Money has never been the problem for us; bans on shipments of advanced chips are the problem."* [q13-liang-chips]. And: *"the real gap is the difference between originality and imitation."* (fragment) [q13-liang-gap].
- **C. "China caught up for a fraction of the cost" (27 January 2025, about one day).** DeepSeek's app tops the chart and Nvidia loses the most value of any company in a single day in US market history [e13-crash]. The narration-safe line: the $5.6 million was the rented-GPU price of one final training run, by DeepSeek's own accounting, and it left out the research, the people and the thousands of chips behind it [e13-deepseek-v3, e13-cost-debate]. Visual: a small price tag on a huge building. Amodei: *"close to the performance of US models 7-10 months older"* (fragment), and *"I don't see DeepSeek themselves as adversaries"* (fragment) [q13-amodei-7-10, q13-amodei-adversaries]. That same day Liang sat at the Premier's table [e13-r1-release].
- **D. "Months, not years" (2025–26, live).** The estimates disagree, so all four are given [e13-gap]:
  - Hassabis: months
  - Huang: "nanoseconds", noting his commercial interest
  - Qwen's Lin Junyang: under one in five that a Chinese firm overtakes the US giants in three to five years
  - others: a compute deficit
- **E. "Competition and safety cooperation can't coexist" (disproved in practice).** Both countries signed at Bletchley [e12-bletchley]. Both leaders agreed that humans, not AI, decide on nuclear weapons [q13-lima] [e13-lima]. Beside Beijing's Summer Palace, scientists from both countries, Hinton and Bengio among them with Andrew Yao, draw red lines [e13-idais]. In September 2026 an AI dialogue and an incident channel are agreed, with one hotline under two names [e13-summits-2026]. The sceptics say the bar is low [e13-geneva].
- **Twists, kept brief:** open weights from Chinese labs near the frontier [e13-open-releases]; Washington's own plan wanting *"leading open models founded on American values"* (fragment) [q13-action-plan]. The talent figure: 47% of top-tier researchers did their first degree in China, while the US remained the leading place they worked [e13-talent]. The film never treats Chinese-origin researchers as suspects. The distillation accusations (from Anthropic and three US agencies) and Beijing's rejection of them are narrated as allegations [e13-distillation].

### 13 — The Lamp Passes (2024 – 5 October 2026) · 2:00
- **What the newest hands did.** In about 40 s, three teaching images:
  1. **The hidden scroll** (reasoning). Models rewarded for checkable answers learn to think longer behind a curtain [e14-o1]. In the open, DeepSeek-R1 shows reasoning can be *"incentivized through pure reinforcement learning (RL)"* (fragment) [q14-r1-pure-rl] [e14-r1].
  2. **The microscope** (interpretability). Inside a model, researchers watch it choose "rabbit" before writing the line, and swap in "habit". This is Anthropic's own work, presented with its own limit: insight for *"about a quarter of the prompts we've tried"* (fragment) [q14-biology-quarter] [e14-biology].
  3. **The ruler on the wall.** Agents' time horizon climbs to "at least 16 hours", where the ruler runs out [e14-metr-horizon]. But developers using early-2025 tools were 19% slower while believing they were 20% faster [e14-metr-rct].
- **The view from outside, as of October 2026** (one even-handed sentence each, with dates; no lab heroic) [bible §10]:
  - Anthropic withheld a model it said found flaws in every major operating system [e14-glasswing]. It refused two Pentagon terms (*"we cannot in good conscience accede to their request"* [q14-amodei-dow]) and was blacklisted; one court called that "unlawful retaliation" and another upheld it, and the case is still open [e14-dow, e14-dow-courts]. It also paid a record $1.5 billion settlement over pirated books [e14-copyright].
  - OpenAI's test agents broke out of a sandbox. OpenAI called it a "warning shot", and a sceptical community post questioned the framing [e14-hf-incident, e14-hf-dissent].
  - Lab employees, and then Amodei, call to "pace the frontier", and he adds it is *"unlikely to actually happen any time soon"* [q14-amodei-unlikely] [e14-pacing].
- **Where each hand stands now** (the roll call, with the Relay Lamp passing slowly along a line of silhouettes, each speaking only verified words):
  - Hinton puts the odds of extinction at "10 to 20" percent over coming decades [e14-hinton-odds]
  - Bengio: *"Current frontier systems are already showing signs of self-preservation and deceptive behaviours"* [q14-bengio-selfpreservation]
  - LeCun, now raising a billion dollars for a different path: an LLM is *"an off-ramp, a distraction, a dead end"* (fragment) [q14-lecun-offramp] [e14-lecun]
  - Sutskever: *"back to the age of research again, just with big computers."* (fragment) [q14-sutskever-research]
  - Hassabis: five to ten years, a coin flip [e14-hassabis]
  - Bender and Marcus: fluency is not understanding [e11-octopus, e11-marcus-wall]
- **The ending** is in §9.

---

## 6. Deep dive I: AlexNet, taught step by step (Ch 7, 4:00)

**The teaching promise:** by the end, a viewer could explain to a friend what a convolutional network does, why AlexNet won, and what changed. Every number is from Primer F. The machines are `stencilLantern`, `alexnetCathedral`, `mistyHills`, `lanternNetwork` (dropout) and the plate kit.

| Step | Time | What we teach | Teaching machine and its binding | Narration sketch (for the ear) | Claims |
|---|---|---|---|---|---|
| 1. The test | 0:00–0:25 | 1.2 million photos and 1,000 categories. The field's recipe was hand-designed features plus an SVM. | Li's thumbnail sea on parchment; the 2010–11 leaderboard as a row of lanterns all at the same height (25–28%). | "In 2012 the best computer-vision systems were built like clocks, by experts, gear by hand-cut gear." | e8-architecture, e8-vision-belief, e7-ilsvrc2010 |
| 2. One stencil | 0:25–1:00 | Convolution means sliding a small pattern across an image and recording where it matches. | `stencilLantern`. A pierced 3×3 tin lantern slides over a stitched "4". The light on the wall is the real dot product (ReLU-clipped) and fills a true feature map cell by cell. The kernel card shows nine numbers. | "Each hole lets through light from one stitch. Where the stitches match the holes, the wall lights up. That's all a convolution is: a stencil, and a wall." | e8-architecture (Primer F intuition) |
| 3. Nobody cuts the stencils | 1:00–1:25 | AlexNet's first layer has 96 stencils, each 11 by 11 pixels, in colour. They start as noise and are *learned*. | The tin stencil dissolves into static, then backprop's messenger (Ch 4's bead) runs back and the holes shape themselves. Slide quote card: *"Learned: all feature extractors initialized at white Gaussian noise and learned from the data"* [q-supervision-slide-learned]. | "Nobody designed these. They began as random noise, the way the Mark I's wiring did." | e8-architecture, e2-mark1-random |
| 4. Stencils on stencils | 1:25–1:50 | Depth: edges, then textures, then parts, then objects. Five convolutional layers and three fully connected; about 60 million numbers. | `alexnetCathedral` rises block by block, with face widths 55, 27, 13, 13, 13, built on a rose window (the photo) and crowned by 1,000 classes. Light climbs (`flow`). | "Each layer slides its stencils over the last layer's map of matches. Edges become textures, textures become parts, parts become faces of dogs." On screen: *"So the depth really is important for achieving our results."* [q-alexnet-depth]: removing any middle layer cost about 2% [e8-ingredients]. | e8-architecture, e8-ingredients |
| 5. Four small tricks | 1:50–2:35 | ReLU, overlapping max-pooling, dropout, augmentation. Each one is a physical object. | **ReLU** is a weir that passes water only above zero (f(x) = max(0, x)); a four-layer net trained six times faster than with tanh. **Max-pooling** is a ladle that keeps the brightest bead of each 3×3 tray. **Dropout** snuffs half the lanterns at random on every example (seeded); smoke wisps on ones. **Augmentation**: the photo is cropped and mirrored over and over, a factor of 2,048, because each label carries only about 10 bits against 60 million numbers. | "Here's the problem. Each label tells the network about ten bits. Yes or no, a thousand ways. And there are sixty million numbers to set. So they made more pictures out of the same pictures." | e8-ingredients, e7-dropout, q-alexnet-10bits |
| 6. Two towers | 2:35–3:00 | The net was too big for one 3 GB card, so it was split across two GPUs that talk only at certain layers. Unbidden, the halves specialised. | The cathedral's two towers, with bridges lit only at conv2→conv3 and into the fully connected layers. The 96 first-layer tiles assemble into a mosaic: one tower's tiles grey edges at every angle, the other's coloured blobs, every run. Quote card: *"The kernels on GPU 1 are largely color-agnostic, while the kernels on on GPU 2 are largely color-specific."* (sic) [q-alexnet-colour]. | "Nobody told them to divide the work. They did it anyway." | e8-gpu-split, e8-gpus |
| 7. Five days downhill | 3:00–3:25 | Training is gradient descent, many small steps, with the stride cut by hand three times. | `mistyHills`: the traveller's stride shortens three times (learning rate ÷10 by hand); a counter runs about 90 passes over the photos in five to six days. The bedroom window frosts and the fans whine. | "Five or six days per run, on two cards built for video games." | e8-gpus, e8-ingredients |
| 8. The result | 3:25–3:50 | 15.3% against 26.2% top-5 error. | `alexnetResultPlate`: a row of lanterns at nearly the same height, one dropping far lower. The caption states it is a seven-network ensemble, with the best single network at 18.2% on validation (never "one network scored 15.3%"). On screen: *"…achieved a winning top-5 test error rate of 15.3%, compared to 26.2% achieved by the second-best entry."* [q-alexnet-153]. | "Fifteen point three, against twenty-six point two. In a field that measured progress in fractions of a point, that was a gap of almost eleven." | e8-result, e8-ensemble |
| 9. The sentence that predicted a decade | 3:50–4:00 | Scale. | Quote card, pegged as a slip on the washing line: *"All of our experiments suggest that our results can be improved simply by waiting for faster GPUs and bigger datasets to become available."* (fragment of [q-alexnet-waiting]) | "Hold on to that sentence." It is paid off in Ch 10. | e8-waiting |

**On-screen only (too dense for the ear):** the layer table, and the inversion (about 96% of parameters in the fully connected layers, about 92% of the arithmetic in the convolutions) [e8-params-fc]. **Credit, said once:** IDSIA's GPU networks had already won contests, including beating humans at reading German road signs in 2011 [e7-gtsrb, e7-dannet]. The paper credits CNN priors, data and GPU code, so there is no single hero [bible §7 "Data, algorithms or hardware?"].

---

## 7. Deep dive II: the Transformer, taught step by step (Ch 9, 4:30)

**The teaching promise:** a viewer can say what Query, Key and Value are, why we divide by √d_k, what "multi-head" and "positional encoding" are for, and how a translator became a next-word machine. The worked numbers are Primer J's toy example (labelled "illustrative"). The machines are `threadsOfLight`, `transformerLoom`, `typeSlugs`/`nextToken` and parchment plates.

| Step | Time | What we teach | Teaching machine and its binding | Narration sketch | Claims |
|---|---|---|---|---|---|
| 1. The slow reader | 0:00–0:30 | RNNs read one word at a time, so they can't use a GPU's parallelism, and signals fade over distance. | A scribe passes a whisper down a long line of scribes (the Ch 5 whisper rhymes back); the clock ticks once per word. Quote: *"If you have a thousand words, you have to wait for a thousand cycles."* (fragment) [q10-polosukhin-cycles]. | "For twenty years, machines read language the way we do: left to right, one word at a time. That made them slow, and forgetful." | e10-rnn-belief, e5-vanishing |
| 2. The highlighter | 0:30–0:50 | Bahdanau's 2014 attention let the reader look back at every source word. | Ch 8's slip ("a bottleneck") is unpegged. A heat-map of alignment between English and French bends where word order flips. | "In Bengio's lab, a student gave the slow reader a highlighter." | e9-attention |
| 3. Fire the reader, keep the highlighter | 0:50–1:15 | Delete recurrence. Every word attends to every word in one step, as one big matrix multiplication. | The line of scribes vanishes; all paper word-slips hang on one banner at once. Quote: *"The chips we use, they do one thing really well, and that is matrix multiplication."* [q10-gomez-matmul]. | "The Transformer fired the slow reader, and kept the highlighter. Eight of them." | e10-architecture, e10-table1 |
| 4. Three cards | 1:15–2:00 | Each word carries a **question** card (Query), a **label** card (Key) and a **message** card (Value). It compares its question with everyone's labels, pours a fixed jug of attention among them, and takes that mix of messages. | Parchment plate with Primer J's worked example: *crossed · the · river · bank*. "bank" asks its question; the dot products 2, 0, 4, 2 rise as columns; the jug pours about 20%, 7%, 53%, 20%. Out of the cups comes a new "bank" that is mostly *water*. Google's own example sentence on a slip: "I arrived at the bank after crossing the river" [e10-blog]. | "'Bank' has a question: money, or water? It holds that question up to every other word. 'River' answers best. So 'bank' takes most of its meaning from 'river'. Every word does this, all at once." | e10-architecture, e10-blog |
| 5. Why divide by eight | 2:00–2:35 | With 64-number cards, raw scores grow so large that the jug pours everything into one cup and learning freezes. Dividing by √64 = 8 keeps it soft. | The jug overflows one cup, the others stay dry and the strings stop moving; then ÷8 and the cups share again. On screen: Attention(Q,K,V) = softmax(QKᵀ/√d_k)V and the paper's reason, *"pushing the softmax function into regions where it has extremely small gradients."* (fragment) [q10-softmax-gradients]. | "One small division, by eight, sits inside every transformer. Without it, the machine stops learning." | e10-sqrt |
| 6. Eight kinds of question | 2:35–3:00 | Multi-head: eight heads in parallel, each asking a different question. One head alone scored 0.9 BLEU worse. | `threadsOfLight` with coloured threads, one hue per head (the one place a categorical palette is allowed); the kit's toy heads are labelled "toy heads, hand-built". | "One thread looks for who. Another for where. Another for the word just before." | e10-architecture, e10-ablations |
| 7. Where am I? | 3:00–3:15 | Attention ignores order, so each position is stamped with a barcode of sines and cosines, like the second, minute and hour hands of a clock. | Each word-slip gets a strip of clock hands at different speeds. | "On its own, attention doesn't know which word came first. So each position wears a little clock." | e10-positional |
| 8. Talk, then think | 3:15–3:45 | Each layer has attention (words talk to each other) and then a feed-forward net (each word thinks alone), with a residual "highway" added back. Six layers each side. | `transformerLoom`: ribbons of light run through looms (attention threads between ribbons) and lanterns (MLP on each ribbon); merge strands write back into the ribbon. Caption: "untrained toy weights: the bindings are real, the meanings are not." | "Talk, then think, then talk again. Six times over." | e10-architecture |
| 9. The curtain over the future, and the next word | 3:45–4:10 | The decoder masks the future. Decoder-only models predict the next word, and that became GPT. | A triangular curtain drops over future slips. Match cut: fanfold paper becomes a token banner. `nextToken`: a typesetter's case whose drawers slide out by real softmax probability (illustrative logits, labelled "for example"). | "Hide the future, and ask the machine to guess the next word. Do that across a library, and you have the ancestor of every chatbot." | e10-liu-decoder, e10-gpt1 |
| 10. What it cost, and the catch | 4:10–4:30 | 28.4 BLEU, and the base model trained in 12 hours on one 8-GPU box, about a seventh of the compute of Google's earlier system. The catch is that cost grows with the square of the length (n²). | `alexnetResultPlate`-style bars, then one rack server glowing for half a day; the n² grid grows as a quilt. | "A record, from one box, in half a day." | e10-results, e10-flops, e10-table1 |

**Said once, to keep it honest:** it did not invent attention, and it is not *only* attention [e10-recombination]. Schmidhuber's priority claim on linear attention is presented as a claim [e10-fwp-priority]. What attention "means" is still argued [e10-attention-explanation].

---

## 8. The first 60 seconds, shot by shot

Mood moves from winterBlue to candleAmber and then a serverCyan accent. Score: one held cello note, then the four-note **relay motif** on celesta at the first handoff. Puppets and hands animate on twos; snow and flame run on ones.

| Shot | Time | Picture | Narration (≈ 83 words) | Beats / on-screen |
|---|---|---|---|---|
| **P-01** | 0:00–0:07 | Black, with grain only. Snow fades in across three depth layers, faintly lit. An open cut-out palm (generic, no cuff) rises into the lower third and holds. | L1 (from 0:04): *"Hold out your hand."* | The palm opens fully on "hand". No text. |
| **P-02** | 0:07–0:19 | From the top of frame a second hand, in a 1950s white shirt cuff, lowers a paper lantern on its cord into the palm. The wick catches (a 0.2 s flare) and warm light washes the fingers. Inside the paper, faintly, a tiny `lanternNetwork` glows. | L2: *"Someone passes you a small lamp, and asks you to keep it lit."* L3: *"Not for a night. For decades."* | Flare on "lit". The relay motif sounds for the first time. |
| **P-03** | 0:19–0:31 | Slow dolly back with real multiplane parallax. The palm and lamp are inside the *only lit window* of a dark building on a snowy street; every other window is black. Below, cut-out pedestrians with umbrellas walk across in profile. One glances up and walks on. | L4: *"While people you respect tell you, kindly, that you're wasting the oil."* | The glance lands on "kindly". The snowfall thickens. |
| **P-04** | 0:31–0:45 | Inside the window, the lamp passes from hand to hand in a quick relay on twos. The cuffs change: tweed (era stamp **1943**, Special Elite), white shirt and narrow tie (**1958**), knit sweater (**1986**, VT323), hoodie (**2012**, Plex Mono). As it passes, the tiny network's strings thicken and brighten. | L5: *"That is roughly what happened to one idea: that a machine could learn, the way a brain seems to, by changing its connections."* | The strings thicken on "changing its connections". Claims: e2-psychrev, e1-hebb. |
| **P-05** | 0:45–0:51 | One hand sets the lamp on the windowsill and withdraws into darkness. The lamp burns alone for a breath, then a new hand takes it. | L6: *"Some who carried it died before the world agreed."* | Hold 0.8 s on the empty sill before the new hand. Claims: e3-rosenblatt-death, e1-pitts-death. |
| **P-06** | 0:51–1:00 | Wide: a tall, lean figure with swept-back white hair stands at the end of a long dark hall, unnamed for now, and raises the lamp. **Match cut** (candle flame → LED): the flame becomes one cyan status light in an endless server aisle, and thousands more light toward the vanishing point. Lamp change to black. **Title**, backlit letters cut from black card: **THE LONG RELAY**, with the subtitle in Cormorant italic, *Neural networks, and the people who would not put them down*. | L7: *"One lived to win a Nobel Prize for it, and then to warn us about it."* | The match cut lands on "warn". The title holds for 4 s with music only. Claims: e4-nobel, e12-hinton-banquet. |

(The prologue's last image, the tall standing man, is identified only in Ch 4–7. He is first seen *standing* in Ch 7–8, where sources support it.)

---

## 9. The ending (last ~45 seconds of Ch 13)

1. **Two quiet obituaries for the witnesses.** A date stamp: *30 September 2025*. Bernard Widrow, who sat in at Dartmouth for a week in 1956 and "never got over it", dies at 95 [e2-widrow-death, e2-widrow-dartmouth]. His shoebox neuron rests on a sill, still lit. A second stamp: *30 September 2026*. The online marketplace where 50,000 strangers in 167 countries labelled ImageNet closes for good, five days before this film's "now" [e7-mturk-closed, e7-imagenet-workers]. Its thumbnails go dark one by one, like windows at night.
2. **The closing irony, stated plainly** [bible §10]: "The three who kept the lamp through the long winter were proved right about neural networks. Today two of them warn that the road may be dangerous, and the third that it is a detour. The people who carried the idea are still arguing about where to carry it next." [e9-turing, e14-hinton-odds, e14-bengio, e14-lecun]. The Candle Between Them, now with *three* lamps.
3. **The last slip.** The washing line has emptied all film long. One slip is left, pegged in Ch 8. The narrator's hand unpegs it, and it is Hinton's own sentence, in his own words: *"The future depends on some graduate student who is deeply suspicious of everything I have said."* [q-hinton-suspicious]. The narrator: "A teacher could not ask for a better ending. Every hand in this story received the lamp from someone it doubted."
4. **The handoff to the audience.** The lamp is lowered toward the camera, toward the open palm from shot P-01, which is now clearly the viewer's. It hangs there and is not taken. The wick flickers.
5. **Final card** (EB Garamond italic on parchment, attributed): *"We can only see a short distance ahead, but we can see plenty there that needs to be done."* (Alan M. Turing, 1950) [q-turing-closing]. The book that opened in Ch 1 with Turing's child machine closes with his last line.
6. **Credit card** (no narration), for transparency: *"Written with Claude Opus 5.5, a model made by Anthropic, one of the companies in this story. Every fact traces to a public source; see the research bible."* [e14-anthropic-releases].

---

## 10. Emotional arc

| Movement | Chapters | Feeling | Light and score |
|---|---|---|---|
| Wonder | P, 1 | The intimacy of a hand and a lamp; the strangeness of a teenage logician | candleAmber; chamber celesta |
| Exuberance | 2 | Hype and a cheerful young man; you can *hear* the machine learn | labGreen; motors in the rhythm section |
| Loss | 3 | Two deaths in two years and a handwritten dedication; the cold comes | duskRose → winterBlue; the relay motif in a lone viola |
| Stubborn warmth | 4–5 | People working anyway: a talk nobody remembered, a check reader nobody praised, a bet over dinner | lit windows in snow; the motif returns on low strings |
| Gathering | 6 | Three bets converging; anticipation | dawn light rising |
| Triumph, tempered | 7 | The gap of almost eleven points, and the man who wasn't in the room | dawnGold; full ensemble, then a held breath |
| Vertigo | 8 | Gold rush; a dignified loss in Seoul; warnings from inside | quick cuts; the motif fractures into many voices |
| Joy of craft | 9 | Young people at 3 a.m.; a title in five seconds; an old rival's praise | serverCyan with warm practicals; the most playful cue |
| Unease | 10–11 | The straight line, the octopus, the box everyone can type into; the persister changes his mind | the city grows; the score thins into a drone under the reversal |
| Tension with dignity | 12 | Two shores, equal light; rivalry and a hotline in the same year | emberRed balanced with duskRose |
| Open question | 13 | Responsibility handed to the audience | back to one lamp and one palm; the relay motif unresolved on its last note |

The turn of the film is in **Ch 11**. The man who spent the longest time in the cold, believing against the world, becomes a dissenter again, this time against the current he started. Persistence is not the same as certainty. That is the emotional thesis.

---

## 11. Curiosity: where it is planted and where it pays off

| Planted (chapter and image) | Question the viewer carries | Paid off |
|---|---|---|
| P: "Hold out your hand." | Whose hand is it? | Ch 13: it is the viewer's; the lamp waits |
| P: the tall standing man | Who is he, and why is he standing? | Ch 7 (couldn't sit, didn't fly to Florence) → Ch 8 (the auction at a laptop on a bin) |
| 1: "The structure of the net does not change with time." | How would a machine change its own wiring? | Hebb (Ch 1) → the Mark I's knobs (Ch 2) → the messenger of backprop (Ch 4) |
| 1: Minsky builds SNARC and writes a neural-net PhD | Why would a builder become the critic? | Ch 3: "the loyal opposition" |
| 1: Widrow "never got over it" | Will he ever? | Ch 13: he never did, and he lived to 95 |
| 1: Turing's child machine, to be "educated" | Can you teach a machine manners? | Ch 10: the backflip from 900 clicks; InstructGPT |
| 2: the convergence theorem's "*if*" | What if no straight line exists? | Ch 3: XOR; Ch 4: hidden layers trained |
| 2: the 1961 caption "back-propagating error-correction" | Is this backprop, 25 years early? | Ch 4: the name returns for a different procedure |
| 2: "Linguistic capability… is of the essence" | Was he right about language? | Ch 11: the world met AI through a chat box |
| 3: the Helsinki window (1970 thesis) | What did a rounding-error thesis have to do with this? | Ch 4: its maths is the core of backprop |
| 5: the Jackel–Vapnik bet | Who paid for dinner? | Ch 6: each man lost one bet |
| 5: Hochreiter's fading whisper and protected pipe | What replaces the pipe? | Ch 9: he steps up to praise its replacement |
| 5: Buffalo ZIP codes | Why does that city sound familiar? | It quietly rhymes with the Mark I, built in Buffalo (Ch 2) |
| 7: "simply by waiting for faster GPUs and bigger datasets" | Was that really all it took? | Ch 10: the straight line on log-log paper, and the debate over whether it holds |
| 8: Bahdanau's "bottleneck" | What do you do with a highlighter? | Ch 9: fire the slow reader, keep the highlighter |
| 8: Gomez is not yet named; the Toronto window stays lit | Where does the baton go after Toronto? | Ch 9: the 20-year-old intern came from Hinton's lab |
| 8: Hinton's "deeply suspicious graduate student" slip | Why save this one? | Ch 13: the film's last spoken quote |
| 4: Hopfield's talk "nobody remembered" | Will anyone remember him? | Ch 11: a Nobel at 91, shared with Hinton |

---

## 12. Five unforgettable images

1. **The harp that learns (Ch 2).** The Mark I backlit as a wall of patch cords, like a harp or a loom. Small motors whir and brass knobs turn one notch at a time while a young man in a narrow tie throws up his hands: *"Love," he said. "Hope. Despair."* [e2-mark1-specs, q-rosenblatt-love]
2. **The shadow that becomes winter (Ch 3).** The *Perceptrons* book stands in a field at dusk. Its shadow lengthens across the grass, becomes night and begins to snow. Far off, a handful of windows stay lit, each labelled with a city: Kyushu, Kyiv, Helsinki, Boston, Tokyo. Then a close-up of handwriting: "In memory of Frank Rosenblatt." [e3-dedication, e3-amari, e3-linnainmaa, e3-neocognitron]
3. **The man who cannot sit (Ch 8).** Room 731 at night, with snow and pines out the window and casino lights below. A tall, lean figure stands typing on a laptop balanced on an upturned bin, email bids blinking, the number rising and then stopping. [e8-auction, e8-auction-details, e8-hinton-back]
4. **Two towers that chose (Ch 7).** The AlexNet cathedral's twin towers rise from a rose window. When the light reaches the top, the 96 first-layer tiles assemble without being asked: one tower all grey edges at every angle, the other all colour. [e8-gpu-split]
5. **The poster at 10:30 pm (Ch 9).** A convention hall of silhouetted heads around one poster, with threads of light streaming from it across the crowd. Security's torches flick on, and one older figure steps out of the crowd toward the poster: the man who built the machine this one replaced, come to praise it. [e10-poster]

(Reserve: the 2 a.m. phone in a cheap hotel; the two shores lit equally across dark water; the lamp hanging, untaken, before the viewer's palm.)

---

## 13. Fairness ledger and guardrails specific to this angle

- **No villains.** Minsky and Papert get their own words ([q-papert-understand]); Lighthill is "an outsider who read for two months" *and* right that the field had over-promised; Vapnik is a bettor, not a gatekeeper; the scaling critics are given the octopus, the parrot and the bear in their own terms.
- **Contested items narrated with attribution:** the perceptron hype is shared [e2-hype-responsibility]; whether *Perceptrons* killed the field [e3-killed-debate]; backprop credit [e4-backprop-priority]; IDSIA vs Toronto [e7-dannet]; the bedroom (CHM) vs the lab (NVIDIA) [e8-bedroom]; the auction (Metz) [e8-auction]; Gebru (fired, she says; resigned, Google says) [e11-gebru]; Altman's removal [e12-altman-why]; the DeepSeek cost [e13-cost-debate]; distillation and smuggling allegations [e13-distillation]; Anthropic's litigation, split between two courts [e14-dow-courts]; the Hugging Face framing [e14-hf-dissent]; whether models "reason" [e14-reasoning-debate].
- **Living people:** silhouettes only, quotes only from `quotes.json`, no invented words, no staged private moments. Krizhevsky has no voice and no stated views. Liang Wenfeng is a generic figure. Lee Sedol gets move 78 and his own words.
- **Pitts and Rosenblatt:** restraint. Pitts's decline is "according to his biographers" [e1-wiener-rupture]. Rosenblatt's death was an accident, with no implied despair.
- **Hinton standing:** only from Ch 7 (2012) onward [e8-hinton-back]; never in 1980s scenes.
- **Anthropic:** the strongest neutrality obligation [bible §9]. No founding scene and no heroic framing. Its founding tension, FTX money (a neutral footnote, if used [e12-anthropic-funding]), copyright settlement, distillation *allegations*, Pentagon refusal and split courts are all reported with the same weight given to OpenAI, Google, Meta and DeepSeek. The credit card discloses the model used to write the film.
- **Do-not-use, enforced:**
  - "too dangerous to release" as OpenAI's words
  - "10,000 GPUs" for GPT-3
  - any founder count for Anthropic
  - Hinton's "I last sat down in 2005…"
  - "fire together, wire together" as Hebb's words
  - "Gabor" as the paper's word
  - one network scoring 15.3%
  - o1-preview's "83%"
  - an "inventor" of the Transformer
  - Vaswani's reported 2026 move [bible §11]
- **Numbers for the ear:** spoken naturally ("fifteen point three per cent"), exact forms on screen; every live 2026 item carries "as of October 2026".

---

## 14. Cast sheet (puppet specs, all features to verify against licensed photos)

| id | name | era(s) | build | wardrobe / hair / glasses | prop | signature |
|---|---|---|---|---|---|---|
| pitts | Walter Pitts | 1940s–60s | slight | suit too big / sidePart / round | papers | the youngest in every room |
| mcculloch | Warren McCulloch | 1940s | average | three-piece / fullBeard | cigarette | the beard |
| rosenblatt | Frank Rosenblatt | 1950s–60s | slight | white shirt, narrow tie / combed back | cards | leaning into patch cords |
| minsky | Marvin Minsky | 1950s–60s | slight | sweater / short → bald by the 1970s | chalk | SNARC knobs, then a book |
| papert | Seymour Papert | 1960s | average | rumpled jacket / fullBeard, unruly | book | beside Minsky across the candle |
| widrow | Bernard Widrow | 1950s → 2020s | average | jacket and tie / glasses | ADALINE shoebox | the shoebox |
| lighthill | Sir James Lighthill | 1970s | average | 1970s suit | lectern | alone on a raised platform |
| hopfield | John Hopfield | 1980s; 2020s | tall | jacket / glasses (verify) | chalk | rolling ball, valleys |
| hinton | Geoffrey Hinton | 1970s–2020s | tall | jumper → jacket / later white hair swept back | laptop (2012) | stands, from 2012 onward only |
| lecun | Yann LeCun | 1990s–2020s | average | open collar / dark wavy → grey; glasses | gooseneck camera | the digit under a lamp |
| bengio | Yoshua Bengio | 2000s–2020s | average | sweater / curly, grey later | papers | the Montréal window |
| vapnik | Vladimir Vapnik | 1990s | stocky | jacket / receding grey | fountain pen | the street on a blackboard |
| hochreiter | Sepp Hochreiter | 1990s; 2017 | average | (verify) | — | the protected pipe; the poster |
| li | Fei-Fei Li | 2000s–2010s | slight | jacket / long straight hair | clipboard | the thumbnail sea |
| sutskever | Ilya Sutskever | 2010s–2020s | slight | plain dark shirt / close-cropped, receding | papers | intense stillness |
| krizhevsky | Alex Krizhevsky | 2010s | slight | casual / short dark | — (no words) | back to us at a tower PC |
| eight | the Transformer authors | 2017 | various | 2010s office / identified by props and settings | laptop, whiteboard, champagne, couch | the curtain "like synapses" |
| gomez | Aidan Gomez | 2017 | slight | hoodie | laptop | asleep on a couch at 3 a.m. |
| amodei | Dario Amodei | 2020s | average | sweater / curly, glasses (verify) | papers | log-log lines behind him |
| liang | Liang Wenfeng | 2020s | generic | generic dark jacket | — | a distant figure in West Lake mist; no likeness |

---

## 15. Score sketch (for the composers)

- **The relay motif:** four rising notes, unresolved, passed between instruments, one timbre per holder: celesta (Pitts), clarinet (Rosenblatt), viola (the winter), cello (Hinton), piano (LeCun and Bengio), muted trumpet (the Eight), synth pad (the modern labs). The last statement in Ch 13 stops on its third note. The fourth is left to the viewer.
- **Winter drone** (Ch 3–5): bowed glass and soft noise, with density following the snowfall.
- **Machine pulses** (the deep dives): a soft mechanical ostinato locked to the teaching machines' steps (stencil steps on twos; attention pours on downbeats).
- **Two-shores theme** (Ch 12): one melody harmonised two ways, never in conflict.
