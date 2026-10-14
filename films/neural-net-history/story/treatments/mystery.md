# Treatment: "mystery" angle

# WHO TAUGHT THE MACHINE?
### A mystery in reverse, 1943–2026

**Logline.** A machine answers you in fluent prose, and nobody ever wrote it a rulebook. So who taught it? An old teacher takes the case. He goes back to a lamp in Chicago in 1943 and works forward clue by clue. Each era leaves one true clue and one trail that went cold: a belief people held for years, defended with evidence, until it ended. In the end he finds the culprit was never one person. And when he steps back from his case board, he sees it has been shaped like a neural network all along.

**Runtime:** 32:00. **Narration:** about 3,050 words at about 95 words per film minute. **Deep dives:** AlexNet (4:00) and the Transformer (4:30), each built step by step on a teaching machine whose every visual variable is bound to a real quantity.

**The engine of the angle.** A mystery in reverse is a "howcatchit". We see the result in the first minute: a glowing box that writes back. The fun is in how it happened. That suits this history, because nearly every famous "answer" in it turned out to be a partial truth, and the right answer was hiding in a footnote, a master's thesis, a gaming card or a bedroom. The detective structure also does the work the brief asks for, era by era:

| Brief requirement | Where the mystery machinery puts it |
|---|---|
| the understanding of the time / what people believed | the **Belief Candle** lit in each chapter (the era's theory of the case) |
| who dissented | the **Witness Box** (dissenters testify in their own verified words) |
| how long people thought that way | the candle's **height = years the belief held**, and when it gutters out |
| the experiments | the **Exhibits** (each machine is entered into evidence with a date-stamp card) |
| what the era contributed | the **Clue Card** pinned to the **Case Board** at the end of each chapter |

---

## 1. Chapter list (32:00)

| # | Chapter | Years | Min | ~Words | Clue pinned / trail that went cold |
|---|---|---|---|---|---|
| 1 | **The Wonder in the Dark Room** (prologue) | 2026 → rewind | 1.5 | 145 | the case opens; three suspects: Rules, Knowledge, Learning |
| 2 | **Clue One: A Switch That Fires** | 1943–1956 | 2.0 | 190 | *clue:* the threshold neuron · *cold trail:* "the brain is a logic machine" (about 16 years) |
| 3 | **Clue Two: A Knob That Turns** | 1957–1969 | 2.5 | 240 | *clue:* a weight that learns from its mistakes · *cold trail:* "it will walk, talk … and be conscious" |
| 4 | **The Cold Case** (the first winter) | 1969–1980 | 2.0 | 190 | *clue:* hidden layers, and a thesis on rounding errors filed under the wrong subject · *cold trail:* "the extension is sterile" (about 13–17 years) |
| 5 | **Clue Three: The Messenger Who Runs Backward** | 1980–1995 | 2.5 | 240 | *clue:* backpropagation · *cold trail:* "knowledge must be typed in by hand" (commercial peak about 7 years) |
| 6 | **The Quiet Years** (classical machine learning) | 1989–2006 | 1.5 | 145 | *clue:* the stencil (the convolutional net) and the protected pipe (the LSTM) · *cold trail:* "neural nets are fiddly and beaten anyway" (about 10–15 years) |
| 7 | **Two Accomplices: Data and Fire** | 2006–2012 | 1.5 | 145 | *clue:* data and graphics cards · *cold trail:* "deep nets must be pre-trained layer by layer" (about 4–6 years) |
| 8 | **DEEP DIVE — The Night in Florence** (AlexNet) | 2011–2013 | 4.0 | 380 | *clue:* learned features beat designed ones, given enough data and arithmetic · *cold trail:* "good features must be designed by experts" (about 13 years) |
| 9 | **The Gold Rush** | 2013–2016 | 1.0 | 95 | *clue:* words become places in a space · *cold trail:* "a Go machine is a decade away" (about two years) |
| 10 | **DEEP DIVE — Everything Looks at Everything** (the Transformer) | 2014–2017 | 4.5 | 430 | *clue:* attention, all at once · *cold trail:* "language must be read in order" (about 20 years) |
| 11 | **Read Everything** (pre-training and scale) | 2018–2022 | 2.0 | 190 | *clue:* predict the next word, at scale · *trail still disputed:* "scale alone brings understanding" |
| 12 | **The Last Accomplice, and the Return to the Scene** | 2017–2023 | 2.0 | 190 | *clue:* human preference (and written principles) · the chat box is solved |
| 13 | **The Case Reopened: Fear, Rivals and Two Shores** | 2023–2026 | 3.0 | 285 | *trail went cold:* "smarter-than-human AI is 30 to 50 years away"; the US–China race, belief by belief |
| 14 | **Case Status: Open** | 5 Oct 2026 | 2.0 | 190 | the case board lights up as a network; one lantern stays dark |
| | **Total** | | **32.0** | **≈3,055** | |

Chapters 2–7 are mostly in the brisk register (a clue in two minutes). Chapters 8 and 10 slow right down: fewer words per minute and more held frames, so the machines can be watched. The word budgets for the deep dives already allow for that.

---

## 2. The recurring devices

### 2.1 The Case Board (narrative spine and final payoff)
A dark board in the detective's study, lit by one desk lamp. Each chapter ends with the detective's hands pinning a **Clue Card** to it. The card is a paper-cut object, not text: a lantern with a wick (1943), a potentiometer knob (1958), a pair of scissors making two cuts (1969), a glowing knot running backwards on a string (1986), a pierced tin stencil (1989), two small furnaces (2012), a thread of light from one word to another (2017), a single type sort (2018), a pair of garden shears (2022). Threads of light join each new card to the cards that made it possible (backprop is tied to the knob and to the Finnish thesis; AlexNet to the stencil, the furnaces and ImageNet's card).

**The payoff (chapter 14):** the camera pulls back and the board's layout is revealed to be a **lantern network**. Cards are units in columns, threads are weights, and a real forward wave of light runs through it (`lanternNetwork`, sized to the clue count) from the 1943 lantern to the chat box at the output. The answer to "who taught it?" is the shape of the board itself.

### 2.2 The Belief Candles (how long people thought that way)
Every chapter lights a candle on a shelf below the board. The era's belief is lettered on it in its era's typeface ("THE BRAIN IS A LOGIC MACHINE"). **The candle's height is bound to the number of years the belief held,** at one fixed scale for the whole film (say 1 cm per year at shelf scale). When the evidence ends it, the flame gutters and goes out, and a thin wisp of smoke rises. By chapter 14 the shelf is a skyline of spent candles, a history of honourable mistakes. A few are still burning on 5 October 2026: "scale brings understanding", "the gap is months", "LLMs are the road". Narration never calls these beliefs foolish. The rule (bible §9.3) is *what they believed → who held it → who dissented → what they could not yet see*.

| Candle | Held | Height (years) | Snuffed by | Claims |
|---|---|---|---|---|
| The brain is a logic machine | 1943–1959 | 16 | the frog's-eye study | e1-mp-paper, e1-frog |
| Perception machines will soon walk and talk | 1958–c.1962, gone by 1965–66 | ~4–8 | the Mark I's limits; groups leaving | e2-nyt-lede, e2-exits |
| Multilayer nets are a sterile extension | 1969–1982/86 (US mainstream) | ~13–17 | Hopfield, backprop | e3-sterile, e3-killed-debate |
| Knowledge must be typed in by hand | c.1980–1987 commercially; faded through the 1990s | ~7 (+) | brittleness, the Lisp-machine crash | e5-knowledge-principle, e5-lisp-crash |
| Neural nets are fiddly and beaten by SVMs | late 1990s–2009/2012 | ~10–15 | speech 2009–12, ImageNet 2012 | e6-nn-winter, e6-svm |
| Deep nets need layer-by-layer pre-training | 2006–2010/12 | ~4–6 | IDSIA, ReLU, AlexNet | e7-pretraining-belief, e7-ciresan |
| Good features must be designed by experts | 1999–2012 | ~13 | AlexNet | e8-vision-belief, e8-result |
| A Go machine is a decade away | 2014–2016 | ~2 | AlphaGo | e9-go-decade, e9-lee-sedol |
| Language must be read in order | 1997–2017 | ~20 | the Transformer | e10-rnn-belief, e6-lstm |
| Grow the model faster than the data | 2020–2022 | ~2 | Chinchilla | e11-kaplan, e11-chinchilla |
| Smarter-than-human AI is 30–50 years away | (Hinton's own view) until 2023 | marked "until 2023" | his own reversal | e12-hinton-timeline |
| Compute doesn't matter after all | 27 Jan 2025 | a match flame, struck and blown out | immediate dissent | e13-crash, e13-cost-debate |
| *still burning:* Scale brings understanding · LLMs are the road · The gap is months | | | contested on 5 Oct 2026 | e11-octopus, e14-lecun, e13-gap |

### 2.3 The Witness Box (who dissented)
A raised wooden box at stage right, a courtroom silhouette like the Royal Institution's raked horseshoe (e3-lighthill-debate). In each chapter one dissenter's silhouette steps up. They are respectful and never caricatured, with verified words only. Their quote appears on an EB Garamond card with Cormorant SC attribution, and the narrator reads it with "he wrote" or "she said". Witnesses include Minsky in 1961 (q-minsky-twoparts), Papert in 1988 (q-papert-understand), Fodor and Pylyshyn (q-fodor-pylyshyn), Vapnik's signed bet (q-bet-vapnik), Kelcey (q10-kelcey), Bender and Koller's octopus (q11-octopus-form), the DAIR authors (q12-dair-harms), LeCun (q12-lecun-ridiculous, q14-lecun-offramp) and Sutskever (q14-sutskever-research). A dissenter who was later proved right stands in the box first as a dissenter, never as a winner (bible §9.4).

### 2.4 The Suspect's Anatomy (the chat box, X-rayed)
The glowing rectangle from the prologue comes back at the end of each chapter, for 4–6 seconds and without narration. Each time it is a little more translucent, and one more of its real components lights inside it: threshold units → adjustable weights → hidden layers → the backward messenger → racks of graphics cards and a sea of text → attention threads → next-word typesetting → a pair of preference shears. **Only things that are really in a modern chat model are revealed.** Convolution and the Mark I's random wiring are not, and the narrator says so once at AlexNet: "Not every clue is a part of the suspect. Some are the tools that taught the detectives." By chapter 12 the box is fully visible. The prologue's question has a physical answer.

### 2.5 The Exhibits (the experiments)
Every machine enters the film as a numbered exhibit with an era-adaptive date stamp: typewriter for 1940s–60s, phosphor for the 70s–80s, Plex Mono for the 90s on. For example "EXHIBIT 4 · Cornell Aeronautical Laboratory, Buffalo · 1958–60". The exhibits are SNARC, the 1958 Navy demonstration, the Mark I, ADALINE, the *Perceptrons* XOR plate, Hopfield's valleys, the 1986 family-trees network, NETtalk, ALVINN, MYCIN's blinded trial, the Jackel–Vapnik bet, LeNet's check reader, ImageNet's assembly line, the 16,000-core cat, AlexNet, seq2seq, AlphaGo, the Transformer, the backflip robot, Chinchilla's valley, Golden Gate Claude, the rabbit rhyme, and METR's ruler.

### 2.6 The Detective is only hands and a lamp
We never see the narrator's body. That keeps any risk of him reading as Geoffrey Hinton, who is a character in this film, out of frame (brief; bible §9.8). We see a green-shaded desk lamp, two weathered hands, a magnifying glass, index cards and a fountain pen. The lamp is the film's anchor practical light: its flame-warm glow match-cuts to a GPU status LED in chapter 8 and to a data-centre aisle in chapter 11.

### 2.7 The Rewind and the Fast-Forward
In the prologue the film rewinds. Five future images run backwards in ten seconds, unexplained: a Go stone lifting off a board, snow rising into the sky, a motorised knob unturning, a fan spinning down in a bedroom tower, a lantern wick going dark. In chapter 14 the same images run forwards, each now understood. That is the curiosity planted in the first minute and paid in the last (§7).

### 2.8 The detective's refrain (voice)
Three phrases come back, sparingly:
- "How long did they believe it? About ___ years." (once per chapter, with the candle)
- "Put that in the file." (when a small fact will matter later)
- "Not the culprit. But an accomplice." (for data, for graphics cards, for human preference)

---

## 3. Chapter by chapter

Claim ids are in brackets; quotes are by `q-` id. Narration fragments are samples of tone, not the final script.

### 1 · The Wonder in the Dark Room (1:30)
Detailed in §5 (the first 60 seconds). The last 30 seconds: the rewind montage, then the title card *WHO TAUGHT THE MACHINE?* cut in backlit card, with the subtitle *a mystery in reverse*. An ink bleed into 1943. One extra line plants a hook for chapter 12: "Its makers even wrote, the day it launched, that it sometimes gives answers that sound right and are wrong. Put that in the file." [q12-chatgpt-limits, e12-chatgpt-launch]

### 2 · Clue One: A Switch That Fires (2:00) · 1943–1956 · candleAmber → labGreen
- **Exhibit 1: a paper machine.** Chicago, about 1941: a teenager, about eighteen, is introduced to a doctor of forty-two, who takes him into his family home [e1-pitts-age]. By one account the boy once read the *Principia* in three days in a library (attributed to Gefter's account) [e1-pitts-principia]. In 1943 McCulloch and Pitts publish a neuron as an all-or-none switch, and nets of switches can compute logic [e1-mp-paper; q-mp-allornone]. The teaching machine is the **paper lantern with a wick**: the wick catches only above the threshold ring. Three lanterns form an AND; then an OR.
- **The missing piece, planted.** On screen, their fifth assumption: *"The structure of the net does not change with time."* [q-mp-assumption5, e1-mp-nolearn]. Narrator: "These nets could think, of a kind. But they could not learn. Put that in the file."
- **The idea of learning arrives** as Hebb's 1949 postulate (and *not* the slogan "fire together, wire together", which is later; e1-hebb-notslogan) [e1-hebb]. Turing's child machine follows in 1950 [e1-turing-1950], then **Exhibit 2: SNARC, 1951**: about forty "neurons", about three hundred tubes, a surplus B-24 bomber autopilot turning the knobs, and simulated rats that followed each other through a wiring accident. *"We sort of quit science for a while to watch the machine."* [e1-snarc, q-minsky-snarc-watch]
- **Dartmouth, 1955–56.** "Neuron Nets" is topic three of the proposal that names *artificial intelligence*, a name chosen partly to avoid arguing with Norbert Wiener [e1-dartmouth-neuronnets, e1-mccarthy-name]. The young builder of SNARC switches to symbols [e1-minsky-switch]. "Put that in the file too."
- **Belief Candle:** THE BRAIN IS A LOGIC MACHINE, 16 years, snuffed in 1959 by the frog's-eye paper Pitts co-wrote [e1-frog]. **Witness:** Ralph Gerard, the brain is more analog than digital (paraphrase, no quote) [e1-gerard].
- **Clue Card pinned:** the lantern with a wick.

### 3 · Clue Two: A Knob That Turns (2:30) · 1957–1969 · labGreen
- **Exhibit 3: Washington, 7 July 1958.** A room-sized computer sorts punch cards marked left or right, and after fifty cards it has learned [e2-1958-demo]. Next morning the *Times*: the Navy *"expects will be able to walk, talk, see, write, reproduce itself and be conscious of its existence."* [q-nyt-1958, e2-nyt-lede]. A small paper-cut newspaper boy runs the headline across the frame.
- **Exhibit 4: the Mark I.** A twenty-by-twenty eye of four hundred photocells; a plugboard wired at random from a table of random numbers; and a rack of knobs, each turned by its own small motor whenever the machine is wrong. "You could hear it learn." [e2-mark1-specs, e2-mark1-random] **Teaching machine:** `perceptronRetina`, the real perceptron rule on horizontal versus vertical bars. Knobs turn only on mistakes, and the dial swings. (Its accuracy readout comes from our own simulation; label it "simulation" on screen.) A side panel shows the rule as one line on a parchment plate: *w ← w + η·t·x*.
- **The hype debate, two-sided** [e2-hype-responsibility]: the lede attributes the prediction to the Navy, and Rosenblatt also wrote of "the birth of such a machine". Asked its practical use: *"At the moment, none whatever,"* said cheerfully [q-rosenblatt-none]. Asked what it could never do, he threw up his hands: *"Love. Hope. Despair. Human nature, in short…"* (quote trimmed at "in short" on screen; it remains verbatim) [q-rosenblatt-love].
- **Exhibit 5 (a single beat):** ADALINE, built over a weekend. *"By late Sunday afternoon, the single neuron was fabricated and working."* [q-widrow-sunday, e2-lms]
- **The limit.** *"Attempts at teaching the Mark I to recognize all 26 letters in two type faces simultaneously have been unsuccessful"* [q-rosenblatt-limit]. **Witness Box: Minsky, 1961.** Random nets can probably never see "two separated parts" [q-minsky-twoparts]. A footnote of dark intrigue: from 1963 to 1966 the Mark I worked in a formerly secret CIA photo-interpretation effort, according to a 2022 history [e2-mark1-cia, contested → attributed].
- **Belief Candle:** MACHINES THAT LEARN TO SEE WILL SOON WALK AND TALK. Peak 1958 to about 1962; by 1965–66 the groups had left [e2-exits].
- **Clue Card:** the knob. **Anatomy:** weights glow inside the chat box.

### 4 · The Cold Case (2:00) · 1969–1980 · duskRose → winterBlue
- **Exhibit 6: *Perceptrons*, 1969.** The book's theorems are true and narrow [e3-perceptrons]. **Teaching machine:** `xorPlate` on parchment. One scissor cut can split AND or OR but never XOR; the cut always leaves one lantern on the wrong side, and the counter never drops below one. Two cuts, a hidden layer, solve it. The narrator states the open question exactly: building such a net was known; *training* one, and deciding which hidden unit is to blame, was not [e3-xor-known]. The book's last chapter offers only an *"intuitive judgment that the extension is sterile"* [q-perceptrons-sterile, e3-sterile].
- **Irony (H-skeptic):** the book's first author had built SNARC and written his doctorate on neural nets [e1-snarc, e1-minsky-thesis].
- **The book's shadow lengthens across a field into night** (style-bible match cut), and snow starts. The winter is drawn honestly as several blows, not one: machine translation's 1966 verdict [q-alpac], the Mansfield Amendment's "direct and apparent relationship" [q-mansfield], Lighthill's report in Britain and its televised debate [e3-lighthill, e3-lighthill-debate]. Snow density is bound to the funding story (a qualitative ramp, labelled as such).
- **A death, with restraint.** On 11 July 1971, his forty-third birthday, Rosenblatt drowned while sailing on Chesapeake Bay [e3-rosenblatt-death]. The next printing of *Perceptrons* bore a handwritten line: *In memory of Frank Rosenblatt* [e3-dedication]. Silence, a held frame, one candle flame. (No implication of despair; bible §9.)
- **The clue filed under the wrong subject.** Lit windows in the snow are the lamplighters: Amari in Japan, Kohonen and Linnainmaa in Helsinki, Werbos at Harvard, Fukushima at a broadcasting company in Tokyo [e3-amari, e3-linnainmaa, e3-werbos, e3-neocognitron]. The camera finds one window. A 1970 Helsinki master's thesis about *rounding errors*, with FORTRAN code, holds the efficient way to run calculus backwards. "The most important clue in this case was sitting in a thesis about something else."
- **Witness Box: Papert, 1988.** *"We did not think of our work as killing Snow White; we saw it as a way to understand her."* [q-papert-understand] Did the book kill neural nets? Both sides get a line: the revivalists said yes; historians since call the story exaggerated, one cause among several [e3-killed-debate].
- **Belief Candle:** MULTILAYER NETS ARE A STERILE EXTENSION. In the US mainstream, roughly 1969 to the early-to-mid 1980s; in Britain, almost a decade after 1973 [e3-uk-cut].
- **Clue Card:** scissors making two cuts, tied by a thread to a small Finnish thesis.

### 5 · Clue Three: The Messenger Who Runs Backward (2:30) · 1980–1995 · dawnGold / labGreen
- **The thaw.** In summer 1981 Hopfield presents a network in the Hall of Mirrors at Versailles: *"I have never met anyone who remembered hearing the talk."* [q-hopfield-versailles] The teaching machine is a ball rolling into valleys, a memory completing itself [e4-hopfield]. The Boltzmann machine gets a single flicker of lanterns cooling [e4-boltzmann].
- **Exhibit 7: October 1986.** Rumelhart, Hinton and Williams [e4-rhw]. **Teaching machine:** `lanternNetwork` training real XOR (2–2–1). The forward wave of light goes up; error glows at the top; the **messenger**, a dark bead in a ring of light, runs back down the same strings, tugging each one thicker or thinner by its share of the blame. The scissors from chapter 4 are now learned. Plate: *each wire adjusts by (activity in) × (blame out)*. Hidden units "come to represent important features" [q-rhw-abstract].
- **Who invented it?** Invented several times, independently, and the 1986 paper made it stick [e4-backprop-priority]. The Finnish thread lights up on the board. *"I have never claimed that I invented backpropagation."* [q-hinton-notinvent]
- **Exhibits 8–9 in quick succession:** NETtalk babbling, then reading aloud [e4-nettalk, q-nettalk-babble]; ALVINN steering a van through autumn woods at half a metre per second [q-alvinn-drive].
- **The rival suspect has its own boom.** KNOWLEDGE: rules typed in by experts. A program out-prescribes Stanford faculty in a blinded test and is never used on a patient [e5-mycin, e5-mycin-unused]. Cyc begins (index cards like a sea, explorers' ships) [e5-cyc]. **Put this in the file:** in 1985 Cyc's builders wrote that there was *"practically nothing that current AI technology could draw from the raw text"* of an encyclopedia [q-lenat-rawtext] (a hindsight hinge, never mockery). Japan's Fifth Generation project is drawn as researchers at racks, not a menace [e5-fgcs].
- **The second winter gets its name.** Austin, 1984: *"called the 'AI Winter' by some"*, a pun on nuclear winter [q-mcdermott-winter, e5-aaai84]. In 1987 the Lisp-machine screens go dark [e5-lisp-crash].
- **Witness Box: Fodor and Pylyshyn, 1988.** *"…that John loves the girl but don't know how to say … that the girl loves John."* [q-fodor-pylyshyn] The challenge, the narrator notes, was still being argued in 2023 [e4-systematicity-2023].
- **Belief Candle:** KNOWLEDGE MUST BE TYPED IN BY HAND. Commercial confidence ran from about 1980 to 1987; the research bet faded through the 1990s, and Cyc carried it for nearly four decades [e5-cyc].
- **Clue Card:** the knot of light running backwards. **Anatomy:** layers and a backward arrow inside the box.

### 6 · The Quiet Years (1:30) · 1989–2006 · parchment plates / duskRose
- **Classical machine learning, done justice.** Vapnik's whiteboard shows the widest empty street between two crowds, with the support vectors on the kerb [e6-svm]. Forests of decision trees are drawn with lanterns at the leaves: *"A+ predictors … on interpretability, they rate an F."* [q-breiman-forests] This had real theory, real accuracy and real wins on small data [e6-two-cultures].
- **Exhibit 10: the bet, 14 March 1995.** One typed sheet, two fancy dinners and a witness's signature [q-bet-vapnik, q-bet-jackel]. Each man lost one [e6-bet].
- **Meanwhile, the winter of prestige, not of use.** A convolutional net at Bell Labs reads several million cheques a day, by LeCun's estimate about one in ten US checks [q-lecun-checks, e6-checks]. A stencil slides over a handwritten digit (a brief `stencilLantern` preview, paid off in ch. 8). *"We couldn't get our papers published."* [q-lecun-outcast]
- **The whisper.** Error passed back through many steps fades like a whisper down a long line [e5-vanishing]. The LSTM is a protected pipe that carries it more than a thousand steps [e6-lstm, q-lstm] (paid off in ch. 10).
- **Belief Candle:** NEURAL NETS ARE FIDDLY, AND BEATEN ANYWAY. Roughly ten to fifteen years, depending on the field [e6-nn-winter].
- **Clue Card:** the stencil and the pipe. (Note: "not every clue is a part of the suspect".)

### 7 · Two Accomplices: Data and Fire (1:30) · 2006–2012 · dawnGold
- **The pre-training candle is lit.** In 2006 the belief is that deep nets must be warmed up layer by layer before training [e7-dbn, q-hs-initialweights].
- **Accomplice one: data.** Fei-Fei Li's slide estimates about nineteen years to label by hand: *"no graduate students would want to do this project!"* [q-li-slide-moral]. Then summer 2008: *"we discovered crowdsourcing"* [q-li-slide-crowd], and nearly fifty thousand workers in 167 countries [e7-imagenet-workers]. A mosaic of thumbnails folds into a tree: mammal, carnivore, dog, husky. Colleagues told her it was a tenure risk [e7-imagenet-skeptics]. **Put in the file** (paid in ch. 14): the platform those workers used closed for good on 30 September 2026, five days before this film's "now" [e7-mturk-closed].
- **Accomplice two: fire.** Gaming cards were never built for this [e7-cuda]. They give a seventy-fold speedup [e7-raina], and *"good old on-line back-propagation"* on one card sets a record with no pre-training at all [q-ciresan-goodold, e7-ciresan] (the dissent that guts the candle). ReLU arrives [e7-relu]. Deep learning's first mass-market win is *hearing*: your phone, about three months before AlexNet [e7-jellybean].
- **Belief Candle:** DEEP NETS NEED PRE-TRAINING. Strongest 2006–2010, abandoned for big supervised problems after 2012 [e7-pretraining-belief]. The narrator flags it: "Keep an eye on that word, *pre-training*. It will come back wearing a different coat."
- **Clue Card:** two small furnaces.

### 8 · DEEP DIVE — The Night in Florence (4:00) · 2011–2013 · candleAmber + serverCyan accent → dawnGold
Teaching method in §4.1. Story beats, in order:
1. **The scene of the crime.** ImageNet's contest has 1.2 million photos and 1,000 classes [e8-architecture]. The 2010 winner used hand-designed features at 28.2% top-five error, and 2011's was about 25.8% [e7-ilsvrc2010]. Every non-Toronto entry in 2012 was built the expert-designed way [e8-vision-belief].
2. **The bedroom.** In 2011 a student convinces his friend to try [e8-origin]. The friend writes the code for the graphics cards himself. A tower PC sits in a bedroom at his parents' house, per the Computer History Museum (NVIDIA says a university lab, and the film says both) [e8-bedroom]. Two gaming cards, fans whining, five to six days per run [e8-gpus, q-alexnet-waiting]. The desk lamp match-cuts to the GPU LED.
3. **The machine, step by step (§4.1).**
4. **Florence, Friday 12 October 2012.** The last talk of the session [e8-florence]. The room is crowded, and by Li's account LeCun stands at the back. The third author isn't there: his back meant he could not sit, so he could not fly [e8-hinton-absent]. A leaderboard of lanterns at nearly the same height, and one dropped far lower: **15.3% against 26.2%** [e8-result]. That was an ensemble of seven networks; one net alone was about 18% [e8-ensemble]. Never "one network scored 15.3".
5. **The prediction hidden in the paper:** results *"can be improved simply by waiting for faster GPUs and bigger datasets"* [q-alexnet-waiting]. Put that in the file.
6. **The auction.** Lake Tahoe, December, as reported by Cade Metz: a three-person company sold for $44 million, its founder standing at a laptop propped on an upturned wastebasket [e8-auction, e8-auction-details].
7. **The morning after.** *"Before AlexNet, almost none of the leading computer vision papers used neural nets. After it, almost all of them would."* [q-chm-beforeafter] By 2013 all top five teams used convolutional nets [e8-ilsvrc2013].
8. **Credit, fairly.** A Swiss lab's GPU networks had already won contests, including beating people at reading road signs in 2011 [e7-gtsrb, e8-first-debate]. Data, algorithm and hardware all mattered [e8-origin]. Hinton's own summary: *"Ilya thought we should do it, Alex made it work, and I got the Nobel Prize."* [q-hinton-nobel-quip]. Krizhevsky has no first-person words in this film (bible §9).
- **Belief Candle:** GOOD FEATURES MUST BE DESIGNED BY EXPERTS. About thirteen years, from 1999 to 2012, and it went out in one evening.
- **Clue Card:** learned features (a tile from the 96 filters).

### 9 · The Gold Rush (1:00) · 2013–2016 · serverCyan / duskRose
Four images, about 25 words each.
- A star-field of words: *king − man + woman* lands **near** *queen*, "once you rule out king itself" [e9-king-queen, e9-analogy-caveat]. Clue: words become places.
- A goban in Seoul. Move 37 was the machine's nineteenth stone, one it judged a human would play once in ten thousand [e9-move37]. Three days later Lee Sedol answered with a move the machine had also rated once in ten thousand [e9-move78]. Dignity for Lee. The "decade away" candle [q-coulom] burns about two years.
- A panda that, with noise the size of one step of colour, becomes a confident "gibbon" [e9-adversarial]. The dissent comes from inside the movement.
- December 2015: a non-profit is founded with a promise and a fear in one sentence [q-openai-damage, e9-openai]. Optimism and fear in the same package will matter later.

### 10 · DEEP DIVE — Everything Looks at Everything (4:30) · 2014–2017 · duskRose (Building 1965) → parchment → serverCyan
Teaching method in §4.2. Story beats woven between the steps:
- **The bottleneck (2014).** A translator reads a sentence, backwards, because that worked better (*"We were surprised by the extent of the improvement…"* [q-seq2seq-surprised]), into one vector, and the vector is *"a bottleneck"* [q-bahdanau, e9-attention].
- **Lunch, 2016.** A suggestion over lunch [e10-design-doc]; a design doc ending in a cartoon of robots zapping lasers in the mountains (drawn as generic robots). **Witness:** a colleague's *"biggest incorrect prediction of my life"* [q10-kelcey], and a father who doubted it at the dinner table [q10-uszkoreit-dad, e10-hans].
- **Building 1965, 2017.** One engineer overhears two colleagues and rewrites the code. Until then the model "wasn't better" [e10-shazeer-joins]. One author is a twenty-year-old undergraduate intern [e10-gomez].
- **19 May 2017.** The English–French number arrives *"like, five minutes before we submitted"*, typed in a micro-kitchen [q10-parmar-kitchen, e10-deadline]. The title took *"five seconds of thought"*, a Beatles pun by a Welshman [q10-jones-title, e10-title]. The footnote reads: *"Equal contribution. Listing order is random."* [q10-random-order] There is no single inventor.
- **The poster, Long Beach, December 2017:** *"Security had to tell us to leave."* [q10-security] The co-inventor of the LSTM it was replacing stepped up to praise it [e10-poster]. That pays off the whisper and the pipe from chapter 6.
- **Did Google miss it?** Both sides [e10-google-missed, e10-bert-search].
- **Belief Candle:** LANGUAGE MUST BE READ IN ORDER, about twenty years [e10-rnn-belief, e6-lstm]. It went out in roughly eighteen months [e10-bert-search].
- **Clue Card:** a thread of light from one word-slip to another.

### 11 · Read Everything (2:00) · 2018–2022 · serverCyan
- **The coat comes back.** *Pre-training* returns: read raw text first, then specialise [e10-gpt1, e10-bert]. GPT's blueprint came from a Google paper co-written by two of the Transformer's authors [e10-liu-decoder].
- **The payoff from 1985.** The Cyc quote's card is pulled from the file and set beside a 2019 announcement: *"GPT-2 is trained with a simple objective: predict the next word, given all of the previous words within some text."* [q10-gpt2-objective]. No gloating: "In 1985 that was a perfectly sensible thing to believe."
- **Teaching machine:** `nextToken`, the typesetter's case. Drawers slide out by real softmax probability over *illustrative* logits (on screen: "for example"). Temperature changes the spread. Generated text is labelled as generated.
- **The withheld model.** GPT-2 was held back; the press framed it as "too dangerous to release"; it was released in stages with *"no strong evidence of misuse so far"* [e10-too-dangerous, e10-gpt2-staged].
- **The straight line.** On log paper, error falls in a straight line across more than seven orders of magnitude [q11-kaplan-powerlaw]. The growing night city: lit windows are parameters. GPT-3 has 175 billion [e11-gpt3]. Readers spotted its news articles only about 52% of the time, *"barely above chance"* [e11-gpt3-detect]. It is not Turing's test, but an echo of his fifty-year bet [q-turing-fifty]. A small rodent beats its bigger cousin: Chinchilla read more and won on the same compute [e11-chinchilla]. **The Bitter Lesson** on a card [q11-bitter-opening].
- **Witness Box, crowded:** the octopus on the cable [q11-octopus-form, e11-octopus]; the parrot [q11-parrot]; *"the so-called scaling laws aren't universal laws like gravity"* [q11-marcus-laws]; the "mirage" of emergence [e11-mirage]. Left open, as it is in 2026.
- **Belief Candle:** SCALE IS THE MAIN LEVER. It was refined rather than snuffed, and it still burns. A small candle beside it, GROW THE MODEL FASTER THAN THE DATA, went out after about two years.
- **Clue Card:** a single type sort.

### 12 · The Last Accomplice, and the Return to the Scene (2:00) · 2017–2023 · duskRose → the dark room
- **The gardener.** In 2017, a simulated one-legged robot learns a backflip from people choosing the better of two clips: *"900 queries in less than an hour"* [q11-backflip]. In 2022, *"outputs from the 1.3B parameter InstructGPT model are preferred to outputs from the 175B GPT-3, despite having 100x fewer parameters"* [q11-instructgpt-100x]. The labellers agreed with each other about three times in four [e11-instructgpt]. The teaching machine is the hedge and shears: each snip is one preference.
- **A new lab, plainly told.** In January 2021, former OpenAI researchers led by Dario and Daniela Amodei found Anthropic; there is no founder count and no garage scene [e11-anthropic-founding]. It called itself *"an AI safety and research company"* [q11-anthropic-seriesa], and planned large, compute-hungry research [e11-series-a]. The tension is stated as fact: it was founded on scaling research it also called risky. Its money is reported with the same flatness as anyone's (Series A led by Jaan Tallinn; later Amazon and Google; a 2022 round that included FTX) [e12-anthropic-funding]. **Constitutional AI**, December 2022: a short scroll of sixteen principles. The model critiques and rewrites its own answer [e11-cai, q11-cai-rules]. The caveat comes from the bible: humans still write the list, so the value choices move into a document the developer chooses.
- **An old prediction comes back.** In June 2022, sixty-four years after the Navy's prediction, a Google engineer believes a chatbot is sentient. Google says there is no evidence. Experts point to our habit of hearing a master's voice in a gramophone [e11-lemoine, q11-brynjolfsson-gramophone]. The machine's words appear only as labelled generated text. The film does not adjudicate.
- **The return to the scene.** On 30 November 2022 the dark room from the prologue is back, the same rectangle. It is a free "research preview": a model from the GPT-3.5 series, tuned with human feedback, in a chat box [e12-chatgpt-launch]. Its engineers hadn't expected much. One million users in about five days, by report; an analyst estimate of a hundred million a month by January [e12-users]. "It was not a new engine. It was a new door." **The Anatomy is complete:** every component is lit. And the line planted in the prologue is read in full from the launch post [q12-chatgpt-limits].
- **The stampede (a 20-second montage):** "code red" [e12-code-red]; a promotional GIF with a wrong answer about a telescope, and about $100 billion off Alphabet's value [e12-bard]; GPT-4 and Claude announced on the same day [e12-gpt4, e12-claude-launch]; research weights leaked within about a week [e12-llama-leak].
- **Clue Card:** the shears. The detective sits back: "Case solved?" A pause. "Not quite."

### 13 · The Case Reopened: Fear, Rivals and Two Shores (3:00) · 2023–2026 · emberRed (sparingly) / duskRose
- **The candle the detective didn't expect.** May 2023: one of the men at the centre of the story leaves Google to speak freely. He had thought smarter-than-human AI was *"30 to 50 years or even longer away. Obviously, I no longer think that."* [q12-hinton-wayoff, e12-hinton-leaves]. His own candle goes out on screen. A one-sentence statement on extinction risk follows, with him the first signatory [q12-cais].
- **The witnesses split three ways** [e12-three-camps]: existential worry; present harms (*"The harms from so-called AI are real and present"* [q12-dair-harms]); and doom-scepticism (*"preposterously ridiculous"* [q12-lecun-ridiculous]). Two of the three 2018 Turing laureates on one side, one on the other.
- **The Nobel, briefly.** At 2 a.m. in *"a cheap hotel in California"*, he wonders if the call is *"a spoof"* [q12-hinton-hotel, q12-hinton-spoof]. A dissenting voice: *"a bit of a stretch"* [q12-wendy-hall]. The chain of this character's scenes is complete: absent from Florence because he couldn't sit, standing at the auction, a Nobel in a cheap hotel. Always with dignity.
- **Two shores.** This is the US–China race told as a sequence of dated beliefs [Era 13 A–E]. Two skylines at equal height and equal warmth face each other across water, with a shared Go board on a jetty between them. No flags dominate and there are no emblems.
  - **A:** a 2017 plan for *"the world's primary AI innovation center"* by 2030. It names no rival [q13-plan2017, e13-plan2017].
  - **B:** October 2022. A fence of rule pages rises across the water, chips and chip-making tools controlled [q13-bis-2022, e13-oct2022]. The next day comes Beijing's reply, flagged on screen as a translation [q13-mao-2022]. The belief: compute is the chokepoint, and China is one to three years behind. About two years.
  - **C:** 27 January 2025. A receipt hangs on a huge building: *"$5.576M"* [q13-deepseek-cost]. Narration-safe line: the rented-GPU price of one final training run, by DeepSeek's own accounting, leaving out the research, the people and the thousands of chips behind it [e13-cost-debate]. The app tops the chart, and Nvidia has the largest one-day loss in US market history [e13-crash]. That belief was a match flame: dissent was immediate [q13-amodei-7-10].
  - **D:** "Months, not years." Estimates run from "nanoseconds" (from a chip-seller with a commercial interest; e13-gap) to months to a compute deficit. Still burning.
  - **The open-weights twist:** Chinese labs released open weights near the frontier, and Washington's own plan wanted *"leading open models founded on American values"* [e13-open-releases, q13-action-plan]. Talent: in 2022, 47% of top-tier researchers had their first degree in China, and the US was still where most worked [e13-talent]. No researcher is a suspect.
  - **E:** "Rivals can't cooperate on safety." It did not hold: both signed at Bletchley [e12-bletchley], and both agreed that humans, not AI, decide on nuclear weapons [q13-lima]. In September 2026 they agreed an incident channel, with two names for one dialogue [e13-summits-2026]. Allegations stay allegations (distillation, smuggling) [e13-distillation].

### 14 · Case Status: Open (2:00) · 5 October 2026 · candleAmber, the study
- **What the suspect does now.** Models are trained to "think longer". A curtain hides a long scroll, and only the last line shows [e14-o1]. The same thing was done in the open by reinforcement learning, with the reasoning-training bill printed at about $294,000. That is a partial cost [e14-r1].
- **METR's ruler.** A carpenter's ruler climbing from minutes to hours, doubling about every seven months. It runs out at about sixteen hours, exactly where the newest model sits [e14-metr-horizon]. The honest twin: developers using early-2025 tools took 19% longer, and believed they'd been faster [e14-metr-rct].
- **The microscope.** Asked to finish a rhyme, a model picks "rabbit" before writing the line, and researchers can swap it for "habit" [e14-biology]. But the method gives *"satisfying insight for about a quarter of the prompts we've tried"* [q14-biology-quarter].
- **The state and the labs, one breath each and even-handed:** a model withheld because it found flaws in *"every major operating system and web browser"* (a company claim) [q14-glasswing-vulns]; Anthropic refusing two Pentagon terms, one court calling the response "unlawful retaliation" and another upholding it, still ongoing [e14-dow, e14-dow-courts]; an employee letter and a CEO's essay asking to "pace the frontier", the CEO himself saying it is unlikely soon [q14-amodei-slow, q14-amodei-unlikely]; a voluntary accord with no penalties [e14-accord].
- **The last witnesses (Witness Box, one line each):** Hassabis, five to ten years, a coin flip [e14-hassabis]; LeCun, *"an off-ramp, a distraction, a dead end"* [q14-lecun-offramp]; Sutskever, *"back to the age of research again, just with big computers"* [q14-sutskever-research]; Bender and Koller's octopus still on its cable.
- **The closing irony** [bible §10]: the winter's three dissenters were proved right about neural networks, and they are now among the loudest voices saying the current path is either dangerous or insufficient.
- **The ending.** Detailed in §6.

---

## 4. How the deep dives teach

Both deep dives follow one rule from the style bible: **every visual variable is bound to a real quantity.** Each step is short. One idea, one machine motion, then a held beat. Exact symbols go on screen; the narration says them in words.

### 4.1 AlexNet: "The Night in Florence" (teaching machines: `perceptronRetina` → `stencilLantern` → `alexnetCathedral` → `lanternNetwork` → `alexnetResultPlate`)

| Step | What the viewer learns | Machine and binding | On screen | Claims |
|---|---|---|---|---|
| 0. The task | 1.2 million photos, 1,000 labels; the old recipe was experts designing features | parchment: a pipeline of hand-tools (edge-finder → bag of words → straight-line classifier), each a brass instrument | "1,000 classes · 1.2M images" | e8-architecture, e8-vision-belief |
| 1. A photo is a grid of lights | an image is just numbers | **match cut**: the Mark I's 20×20 photocell eye becomes a 224×224×3 thumbnail grid | "224 × 224 × 3" | e8-architecture |
| 2. The stencil | convolution = sliding a pattern and measuring the match | `stencilLantern`: a pierced 3×3 tin lantern slides over a stitched "4". Hole size = kernel weight; the light on the wall = the real dot product, rectified, filling a true 12×12 feature map cell by cell | the nine kernel numbers on a card | Primer F intuition |
| 3. Ninety-six stencils | layer 1 is 96 stencils, 11 by 11, stepping 4 pixels | the wall becomes 96 small walls; the 55×55 map size is set in type | "96 × 11×11×3, stride 4 → 55×55×96" | e8-architecture |
| 4. The weir | ReLU: let positive through, stop negative; it trains far faster | a weir where light passes only above zero; side plate shows the paper's slide: "Very bad (slow to train)" vs "Very good (quick to train)" | *f(x) = max(0, x)* | q-supervision-slide-relu, e8-ingredients |
| 5. The ladle | max-pooling keeps the brightest bead in each overlapping window | a bead tray tips; dimmer beads fall away; 55 → 27 | "3×3, stride 2" | e8-ingredients |
| 6. Detectors on detectors | each layer stencils the previous layer's maps: edges → textures → parts → objects | `alexnetCathedral` rises block by block. Face width = spatial size (55, 27, 13, 13, 13); depth = channels; lit windows = activation flow | layer shapes beside each tower | Primer F |
| 7. Two towers | the net was split across two 3 GB cards that talk only at certain layers | bridges light **only** at conv2→conv3 and the fully connected layers | "GPU 1 · GPU 2" | e8-gpu-split |
| 8. Nobody told them | the two cards specialised themselves, every run: colourless edges vs colour blobs | the 96 first-layer tiles laid out as a mosaic: 48 grey stripes on one tower's base, 48 colour blobs on the other's | *"The kernels on GPU 1 are largely color-agnostic…"* | q-alexnet-colour, e8-gpu-split |
| 9. Where the numbers live | most of the ~60 million numbers sit in the last three layers; most of the arithmetic happens in the first five | the crown (fc6–8) is drawn heavy with "weights"; the base glows with "work" | "≈96% of parameters · ≈92% of arithmetic" (derived, labelled) | e8-params-fc |
| 10. Learned from noise | every stencil starts as random static and is learned | the **messenger from chapter 5** runs down the cathedral; tiles resolve from noise into edges | *"…initialized at white Gaussian noise and learned from the data"* | q-supervision-slide-learned |
| 11. Too many numbers, too few labels | each label carries about 10 bits; 60 million parameters need more | a scale: a pile of 1.2M small label-tokens vs a mountain of knobs; then crops and mirrors multiply the photos (a "factor of 2048") | "≈10 bits per label" | q-alexnet-10bits, e8-ingredients |
| 12. Snuffed lanterns | dropout: silence half the units at random on every example | `lanternNetwork`: half the lanterns in the top layers snuffed per step (seeded), smoke wisps on ones | "p = 0.5" | q-alexnet-dropout, e7-dropout |
| 13. The verdict | 15.3% vs 26.2% (seven nets together) | `alexnetResultPlate`: a falling candle-wax line on the leaderboard of lanterns | "15.3% · 26.2%" with "ensemble of 7" | e8-result, e8-ensemble |
| 14. The prophecy | just wait for faster cards and more data | the GPU LED flickers and multiplies into a distant aisle (setting up ch. 11) | quote card | q-alexnet-waiting |

Narration sample (Step 2): "Take a little tin lantern, pierced with holes in a pattern. Hold it over the picture. Where the picture matches the pattern, a bright spot falls on the wall. Slide it along. Step, step, step. That wall of spots is the first thing the network sees."

### 4.2 The Transformer: "Everything Looks at Everything" (teaching machines: slow-reader puppet → `threadsOfLight` + parchment arithmetic → `transformerLoom` → `typeSlugs`/`nextToken`)

| Step | What the viewer learns | Machine and binding | On screen | Claims |
|---|---|---|---|---|
| 0. The slow reader | recurrent nets read one word at a time, so they can't use a GPU's thousands of parallel units, and signals fade over distance | a silhouetted scribe passing a single lantern down a long line of word-slips; the **whisper from ch. 6** fades | *"If you have a thousand words, you have to wait for a thousand cycles."* | q10-polosukhin-cycles, e10-table1 |
| 1. The highlighter | 2014 attention let the translator look back at every source word, weighted | a diagonal heat-map of lit squares, bending where French reorders words | "European Economic Area → zone économique européenne" | e9-attention |
| 2. Fire the reader, keep the highlighter | 2017: delete the recurrence; let every word look at every word in one step | the scribe vanishes; every slip lights at once | *"…dispensing with recurrence and convolutions entirely."* | q10-aiayn-abstract |
| 3. Words as places | each word is a list of numbers, a point in a space | word-slips with tiny constellations (the ch. 9 star-field returns) | — | Primer G |
| 4. Three cards | every word holds a question (query), a label (key) and a message (value) | each slip grows a lantern (query), a small mirror (key) and a sealed note (value) | Q · K · V | Primer J |
| 5. How well do they match? | compare a question with a label by multiplying and adding: the dot product | a parchment plate computes the **real toy example** for "bank" in *crossed the river bank*: scores 2, 0, 4, 2 | numbers and products set in type | Primer J worked example (illustrative), e10-blog |
| 6. The jug of light | softmax turns scores into shares that add to 100% | a fixed jug pours into four lantern-glass cups: about 20%, 7%, 53%, 20% | *softmax(...)*, "sums to 1" | Primer J |
| 7. Mix the messages | the new "bank" is that mix of messages: mostly river | the notes blend; the "bank" slip tints from finance-gold to water-blue | water 0.53 · action 0.20 · finance 0.20 | Primer J |
| 8. Why divide by eight | with 64 numbers per card the raw scores grow huge and the jug pours everything into one cup, so learning freezes. Divide by the square root (eight) and it stays soft | the same jug shown twice: frozen (one cup full) vs soft | *QKᵀ/√d_k*; [8,0,−8] → [1.00, 0.00, 0.00] vs [1,0,−1] → [0.67, 0.24, 0.09] | q10-softmax-gradients, e10-sqrt |
| 9. The full sentence | "it" in *the animal didn't cross the street because it was too tired* looks back at "animal" | `threadsOfLight`: thread width and opacity = the computed softmax weight; cup levels sum to 1 | the sentence as slips | kit attentionMath (toy heads, labelled) |
| 10. Eight heads | several heads ask different questions at once (who? where? how?) | threads in 4–8 low-chroma hues, "the one place a palette of colours is allowed" | "8 heads × 64" | e10-architecture, e10-ablations |
| 11. Where am I? | attention is blind to order, so each position gets a barcode of waves, like a clock's hands | slips get a stamped strip of sine waves at many wavelengths; a clock face with second, minute and hour hands | sinusoid strip | e10-positional |
| 12. Talk, then think | after the words talk to each other, each thinks privately; a highway lane carries the original past every step; six such layers | `transformerLoom`: ribbons (residual streams) through attention looms and MLP lanterns, ×6. The kit's untrained weights are labelled "illustrative" | "Attention → Feed-forward, ×6" | e10-architecture |
| 13. The curtain | when writing, a word may not peek at the future | a triangular curtain drops over later slips (masked weights become exactly 0) | — | e10-architecture |
| 14. Why it won | it is all one big matrix multiplication, the one thing GPUs do best; the base model trained in 12 hours on one box, a seventh of the old compute | eight slabs in one rack light at once; a half-day sundial | 28.4 BLEU; 12 h; 3.3×10¹⁸ vs 2.3×10¹⁹ | q10-gomez-matmul, e10-results, e10-flops |
| 15. The catch | everyone looking at everyone costs the square of the length | the thread web densifies into a wall as the sentence grows | *n²* | e10-table1 |

Narration sample (Steps 4–6): "Every word now carries three cards. A question: what am I looking for? A label: what have I got? And a message: what I'll pass on, if you choose me. 'Bank' holds up its question. It checks every label in the sentence. 'River' fits best. So most of the light goes there."

---

## 5. The first 60 seconds, shot by shot

Music: one low sustained note under a faint tape-hiss bed; a single high piano tone on the word "wonder"; silence for the title. The 60 seconds hold about 100 words.

| Shot | Time | Picture | Narration (spoken) | Notes / claims |
|---|---|---|---|---|
| **ch01-s01** | 0:00–0:08 | Black. A pinprick of cool light blinks: a text cursor. The room slowly resolves around it in serverCyan: a dark modern room, the silhouette of an anonymous person in profile at a desk (2020s, generic, a mug, no logo), a window behind with a deep blue city. Only the screen glows. Fog sheet at desk height. | (0:04) **"Here is a small wonder."** | leadIn 4.0 s; mood serverCyan; L0 night sky, L2 window, L4 figure + desk, L5 desk edge |
| **ch01-s02** | 0:08–0:21 | Slow push in until the rectangle fills the frame. A question is typed in type slugs: *"How did you learn to write?"* Then the answer is set **one sort at a time** from a typesetter's case below the frame (`typeSlugs`). Drawers slide out, one sort rises, and it is set in the stick. Small caption, bottom-left: *illustration*. The answer's words stay a little soft-focus, so we feel the act rather than read the content. | **"You type a question into a little lit box. And something that is not a person writes back. In whole sentences. One word at a time."** | the reply is illustrative, not a real transcript; no lab named, no interface branding |
| **ch01-s03** | 0:21–0:33 | Pull back fast through the window and up. The city: thousands of small rectangles of light come on across the skyline, then across a curve of the earth at night. | **"A report this year counted at least seven hundred million people using machines like this every week. And nobody ever wrote it a rulebook for English."** | claims e14-bengio (≥700M weekly, International AI Safety Report, Feb 2026) |
| **ch01-s04** | 0:33–0:43 | Lamp change to candleAmber. A green-shaded desk lamp clicks on in a book-lined study. Two weathered hands (the detective) pin an index card to a dark board. The card reads, in Special Elite: *THE CASE OF THE WONDER IN THE DARK ROOM.* The pin goes in on "taught". | **"So. How on earth did this happen? Who taught it?"** | the detective is only hands and a lamp (§2.6) |
| **ch01-s05** | 0:43–0:52 | Three paper-cut cards are pinned in a row: **RULES** (a key above a branching logic tree), **KNOWLEDGE** (a drawer of index cards), **LEARNING** (an unlit paper lantern). Each card lifts slightly as it is named. | **"There are three suspects. Rules. Knowledge. And learning."** | — |
| **ch01-s06** | 0:52–1:00 | **The Rewind.** The image shudders like a tape and runs backwards. A Go stone lifts off a board, snow rises into a winter sky, a motorised knob unturns, a fan in a bedroom tower spins down, a lantern's wick goes dark. It lands on black. A typewriter date stamp, bottom-left: *Chicago · 1943.* | **"To find the culprit, we have to go back. Eighty-three years. To a lamp in Chicago."** | the five images are planted here and paid off in ch. 14 (§7). Date stamp e1-pitts-age / e1-mp-paper |

(Then, after 1:00: the title card in backlit card, *WHO TAUGHT THE MACHINE?*, then *a mystery in reverse*, and the "plausible-sounding but incorrect" plant described in chapter 1.)

Word count, 0:00–1:00: 98.

---

## 6. The ending (chapter 14, last ~90 seconds)

1. **The Fast-Forward.** The detective's hand rests on the board. The prologue's rewind plays **forwards**, and now each image is understood: the knob turns (1958), the snow falls (1969), the fan spins up in a bedroom (2012), the Go stone lands (2016), the lantern catches (2026: the chat box). Nineteen words of narration at most: "Every one of those was a clue."
2. **The board reveals its shape.** The camera pulls back. The clue cards, from the 1943 wick to the 2022 shears, sit in columns, joined by every thread pinned over 30 minutes. The threads tighten and the cards turn into paper lanterns. **It is a lantern network.** A real forward wave of light runs through it, left to right, and lights the chat box at the output.
   > "Step back, and the case board looks like something we've met before. Every clue a lantern. Every thread a weight. The culprit was never one person, or one idea. It was all of them, learning from each other's mistakes. And from the words of countless writers, which is why the courts are still arguing about it." [e14-copyright]
3. **One lantern stays dark.** In the middle of the network one lantern will not light. The magnifying glass hovers over it. The microscope plate: *"…about a quarter of the prompts we've tried."* [q14-biology-quarter]
   > "We built it. We can watch it work. And most of the time, we still can't say exactly how it reaches its answer."
4. **The last witness.** The Witness Box, empty, and a quote card: *"The future depends on some graduate student who is deeply suspicious of everything I have said."* (Geoffrey Hinton, 2017, as quoted by Gary Marcus) [q-hinton-suspicious]
   > "Even a man at the centre of this story asked us to doubt him. That is how good detectives think."
5. **Case status.** The detective's hand stamps the case card: *STATUS: OPEN.* The candle shelf: most candles are out, three still burn. The lamp clicks off. In the dark, only the chat box's cursor blinks, and beside it, for the first time, the warm glow of a candle the viewer has not seen before, a new one, unlettered.
   > "The case is not closed. It never is. Somewhere tonight a lamp is on, and someone is suspicious. Perhaps it's you."
6. **Silent end card** (EB Garamond, held 8 s): *"We can only see a short distance ahead, but we can see plenty there that needs to be done."* (Alan Turing, 1950) [q-turing-closing]. Music resolves; iris close on the cursor.
7. **Credits card (text only, not narrated):** *"This film's script and code were written with Claude Opus 5.5, a model made by Anthropic, one of the labs in this story."* [e14-anthropic-releases] This is disclosure, consistent with the bible's neutrality note; the head writer may keep or cut it.

---

## 7. Where curiosity is planted, and where it pays off

| Planted (where) | Paid off (where) | Why it works |
|---|---|---|
| The five rewind images, unexplained (ch. 1) | each in its chapter; all five played forwards (ch. 14) | the opening is a puzzle the film promises to solve |
| "Nobody ever wrote it a rulebook" (ch. 1) | "predict the next word" (ch. 11) | the prologue's mystery has a precise mechanical answer |
| "Sometimes plausible-sounding but incorrect", put in the file (ch. 1) | read in full at the return to the scene (ch. 12) | honesty about the suspect from minute one |
| "The structure of the net does not change with time" (ch. 2) | the knob that turns (ch. 3) | the first missing piece |
| The builder of SNARC switches to symbols (ch. 2) | he co-writes *Perceptrons* (ch. 4) | irony, without villains |
| One straight cut can't do XOR, and nobody knows how to train two (ch. 4) | the messenger running backwards (ch. 5) | the central technical cliffhanger of the first half |
| A Finnish thesis about rounding errors (ch. 4) | its thread lights when backprop arrives (ch. 5) | "the clue filed under the wrong subject" |
| Cyc, 1985: "practically nothing" from raw text (ch. 5) | GPT-2's one-line objective (ch. 11) | the hindsight hinge of the whole film |
| The stencil reading checks (ch. 6) | the stencil lantern inside AlexNet (ch. 8) | lineage |
| The whisper fading down the line, and the protected pipe (ch. 6) | the slow reader, then the LSTM's co-inventor praising the Transformer (ch. 10) | a dissenter's generosity closes a twenty-year loop |
| "Keep an eye on the word pre-training" (ch. 7) | pre-training returns in a new coat (ch. 11) | an ironic rhyme |
| ImageNet's platform closed five days before this film's "now" (ch. 7) | mentioned again as a lantern going out on the board (ch. 14) | the case's oldest witnesses are leaving the room |
| "Simply by waiting for faster GPUs and bigger datasets" (ch. 8) | the straight line on log paper (ch. 11) | a prophecy in a footnote |
| Hinton absent in Florence, standing at the auction (ch. 8) | the cheap hotel and the Nobel (ch. 13), his reversal, the last witness (ch. 14) | one human thread, told with dignity |
| The Navy's 1958 "conscious of its existence" (ch. 3) | sixty-four years later, an engineer's belief about a chatbot (ch. 12) | the oldest temptation in the story |
| Turing's fifty-year prediction (ch. 2) | readers spot GPT-3's articles about 52% of the time (ch. 11) | an echo, not a pass |
| Optimism and fear in one founding sentence (ch. 9) | the risk debate splits three ways (ch. 13) | the frontier labs' founding tension |
| The candle shelf (every chapter) | a skyline of spent candles, three still lit (ch. 14) | "how long did they believe it?" made visible |
| The chat box X-rayed a piece at a time (every chapter) | fully lit at the return to the scene (ch. 12) | the howcatchit's physical answer |
| The case board's layout (every chapter) | it is a lantern network (ch. 14) | the final twist is the subject itself |

---

## 8. Emotional arc

1. **Wonder** (ch. 1): a box that writes back, and a genuine question.
2. **Youthful audacity** (ch. 2–3): a teenage runaway and a doctor building logic out of neurons; knobs that whirr; a Navy press conference. Warm amber, quick music.
3. **Hubris and loss** (ch. 3–4): the headline outruns the machine; a book's shadow becomes night; a birthday drowning told in silence. Winter blue, a single held candle.
4. **Stubborn faith** (ch. 4–6): lit windows in the snow; a thesis nobody reads; a check reader nobody praises; a dinner bet. The tone is "they kept going", never "they were right".
5. **Thaw and vindication** (ch. 7–8): crowds of workers, gaming cards, a bedroom tower whining for six days, and one evening in Florence. The emotional peak of the first two-thirds, in dawnGold.
6. **Acceleration** (ch. 9–11): the gold rush, the room where everything looks at everything, a city of lit windows. Exhilaration with a thread of unease (the panda, the octopus, the parrot).
7. **Resolution** (ch. 12): the return to the scene; the anatomy is complete; "it was not a new engine, it was a new door." Satisfaction.
8. **Vertigo** (ch. 13): the case reopens. A pioneer's reversal, two shores, a fence of rule pages, a receipt on a building. Tension held with dignity; nobody is a villain.
9. **Humility and open wonder** (ch. 14): the network on the board, one lantern dark, a case left open, handed to the viewer. Quiet, warm, a little wry.

---

## 9. Five unforgettable images

1. **The Case Board becomes the network** (ch. 14). Thirty minutes of pinned clue cards and threads tighten into a lantern network, and a single wave of light runs from a 1943 wick to a 2022 chat box.
2. **The Mark I as a harp of patch cords** (ch. 3). A backlit wall of hundreds of randomly wired cords like loom strings, with a row of knobs below. Each knob turns with an audible whirr only when the machine is wrong. You hear it learn.
3. **The shadow of *Perceptrons* becoming winter** (ch. 4). A giant book stands in a field. Its shadow lengthens into night, snow falls, and far off one window is lit in Helsinki, where a thesis about rounding errors waits for sixteen years.
4. **The bedroom furnaces become the cathedral** (ch. 8). Two gaming cards' fans whine in a dark bedroom. The status LED becomes the base of a two-towered cathedral of layers joined only by a few bridges of light. On one tower's base are 48 colourless stripes, on the other's 48 colour blobs. Nobody told them to divide the work.
5. **The jug of light** (ch. 10). In a hall of hanging word-slips, "it" lifts a lantern and pours one fixed jug of light along threads of eight colours. Most of it runs to "animal", a little to "street", a little to "tired". Every word does this at once, and the room is suddenly full of light.

---

## 10. Fairness and accuracy guardrails specific to this angle

- **"False trail" never means "fools".** The on-screen word is *cold trail* or simply the candle's lettering. Every snuffed belief gets its evidence first and its dissenter second (bible §9.3–9.4).
- **Detective metaphors must not turn people into suspects.** The "suspects" are ideas (Rules, Knowledge, Learning), never people, nations or labs. In the US–China chapter, nobody is a suspect. The Witness Box is for people *testifying*, not people on trial.
- **Contested items in this treatment** are attributed or two-sided: the bedroom (CHM vs NVIDIA), the CIA years ("according to a 2022 history"), Pitts and the *Principia* (Gefter's account), *Perceptrons* killing nets, backprop priority, IDSIA vs Toronto, "Google missed it", GPT-2 "too dangerous" (the press's words), emergence, the risk camps, DeepSeek's cost, the gap, distillation, the Anthropic litigation.
- **Anthropic gets the same treatment as every other lab:** founding facts, funding (including FTX) and self-description quoted as such; Constitutional AI with its built-in caveat; Glasswing's claims as company claims; the litigation with both courts; copyright mentioned in the ending. There is no heroic framing anywhere, and the end-card disclosure states the film's own provenance.
- **Generated text** (LaMDA, GPT-2's unicorns if used, the prologue's illustrative reply) is always captioned as generated or illustrative.
- **Numbers easy to misquote:** 15.3% is an ensemble; $5.576M is one run's rented-GPU price; "at least 16 hours" is at 50% reliability, at the edge of measurement; 100 million is an analyst estimate; Hinton's "30 to 50 years" is his own past view.

## 11. Notes for the head writer and lexicon

- **Spoken forms:** McCulloch ("muh-CULL-uck"), Pitts, Rosenblatt, Minsky, Papert ("pa-PAIR"), Linnainmaa ("LIN-eye-mah"), Hopfield, Rumelhart ("ROO-mel-hart"), LeCun ("luh-KUN"), Vapnik, Hochreiter ("HOKE-rye-ter"), Cireșan ("chee-reh-SHAHN"), Krizhevsky ("kri-ZHEV-skee"), Sutskever ("soots-KEV-er"), Uszkoreit ("OOSH-ko-rite"), Polosukhin ("po-lo-SOO-kin"), Shazeer ("sha-ZEER"), Parmar, Vaswani ("vahs-WAH-nee"), Bahdanau ("bah-dah-NOW"), Amodei ("ah-mo-DAY"), Hassabis ("ha-SAH-bis"), Liang Wenfeng. The narration says "Alex Net", "graphics cards" (not "GPUs") on first use, "the transformer", and "chatbot", not acronyms.
- **Numbers for the ear:** "fifteen point three per cent, against twenty-six point two"; "sixty million numbers"; "one box, half a day"; "seven hundred million people a week".
- **Chapter 13 is the densest.** If the outline needs room, move the Nobel beat to chapter 14's fast-forward and keep the five US–China beliefs intact, because they are the brief's explicit requirement.
- **Chapter 9 is deliberately a one-minute montage.** Its job is to plant the star-field (ch. 10, step 3) and the optimism-and-fear sentence (ch. 13).
- **Kit reuse:** `perceptronRetina`, `xorPlate`, `lanternNetwork` (XOR_221 for backprop, a custom layout for the final board), `mistyHills` (optional, for the ch. 5 "messenger" intuition of descending error), `stencilLantern`, `alexnetCathedral` + `alexnetResultPlate`, `threadsOfLight`, `transformerLoom`, `typeSlugs`/`nextToken`. New small props: the Case Board, the Belief Candle shelf (height bound to years), the Witness Box, the X-ray chat box, the type-slug question.
