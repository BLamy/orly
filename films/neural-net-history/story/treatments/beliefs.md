# Treatment: *What We Were Sure Of*

**Angle: THE BELIEF OF THE AGE.** The film is built from what each era was *sure* of, who doubted it, and how long the certainty lasted before it broke.

- **Film:** neural-net-history (pilot) · 32:00 · about 3,040 narration words · silhouette / paper-cut theatre
- **Sources:** `research/bible.md`, `claims.json`, `quotes.json` only. Claim ids are in square brackets; quote ids start with `q`.
- **Written by:** Claude Opus 5.5 (high effort), as one of several competing treatments for the judge panel.

---

## Title

# WHAT WE WERE SURE OF
### A history of thinking machines, told in certainties

The title says what the film is about, and it is easy to hear. It also implicates the viewer: "we" means the scientists, the newspapers, the markets, and by the end the people watching.

## Logline

For eighty years, clever people have been certain about thinking machines, and for eighty years those certainties have burned down like candles. On a paper-cut mantelpiece, each belief of the age is lit in turn, together with the people who held it, the people who stood at the edge of its light and doubted it, and a candle-clock that measures exactly how long it lasted. The last candle on the shelf is ours, and it is still burning.

## The angle in one paragraph

Most histories of AI are told as a race of inventions. This one is told as a procession of **beliefs**: "the brain is a logic machine", "a machine that learns will soon think", "multilayer networks are sterile", "intelligence is rules typed in by experts", "neural nets are fiddly and SVMs are better", "deep nets need pretraining", "vision needs hand-made features", "Go is a decade away", "language must be read in order", "bigger is better", "human-level AI is decades away", "compute is the chokepoint". Every one of them was reasonable. Every one had holders with evidence and dissenters with reasons. Every one lasted a measurable time. The viewer learns the science through the moments when a belief cracked, because those moments are where the real mechanics are shown (the perceptron's single straight cut, backprop's messenger, AlexNet's stencils, the Transformer's threads). The viewer also learns something larger: **how knowledge actually moves.** It does not move by one genius being right. The dissenters of one age become the holders of the next, and then they are doubted in their turn. The film's closing irony comes straight from the bible: the men who kept neural networks alive through two winters were proven right, and in 2026 they are among the loudest voices saying that the current road is either dangerous or not enough [e9-turing, e11-bitter, e14-hinton-odds, e14-bengio, e14-lecun].

---

## The recurring devices

There are three visual devices, one musical device and one spoken refrain. They are always used together and in the same order, so that by chapter three the audience can read a belief's whole life at a glance.

### 1. The Candle-Clock and the Mantelpiece (the spine)

A **candle-clock** is the old way of telling time by a candle scored with rings. Each belief of the age is one tall paper-cut candle, scored with one ring per year. It is lit when the belief takes hold, and the flame travels down a ring for every year the belief holds. When the belief breaks, the flame gutters, a thread of smoke rises, and the stub is set on a long **mantelpiece** in a dark study. The mantelpiece runs through the whole film. The prologue shows it already full of stubs (unexplained, to plant the question), the chapters fill it one by one, and the epilogue returns to it.

- **Binding (rule 6 of the style bible: every visual variable is bound to a real quantity):** the burned length is the belief's lifespan from the bible's era sections, on one scale for the whole film (1 year = 1 ring = 14 px at L3). Where the bible calls an end date interpretive (pretraining; the end of the first winter), the stub is drawn with a soft, frayed rim and the date tag carries "c.". Beliefs that never ended (the threshold unit as engineering; "bigger is better"; "years, not decades") are **still burning** at the end.
- **The stubs, left to right (lifespans from §2 of the bible):**

| # | Belief (on-screen paraphrase, not a quotation) | Lifespan | Rings | Claims |
|---|---|---|---|---|
| 1 | The brain is a logic machine | 1943 – 1959 | 16 | e1-mp-paper, e1-frog |
| 2 | A machine that learns will soon see, talk and think | 1958 – c. 1965 | 7 | e2-nyt-lede, e2-exits |
| 3 | One layer is the limit; going further is "sterile" | 1969 – c. 1986 (US mainstream) | 17 | e3-sterile, e3-uk-cut, e4-rhw |
| 4 | Intelligence is knowledge, typed in as rules | c. 1980 – 1987 (beside it, a thin taper: Cyc, nearly four decades) | 7 / 39 | e5-knowledge-principle, e5-lisp-crash, e5-cyc, e5-lenat-death |
| 5 | Neural nets are fiddly; the margin is the answer | late 1990s – c. 2009–12 | c. 12 | e6-nn-winter, e6-svm |
| 6 | Deep nets must be pretrained, layer by layer | 2006 – c. 2012 | c. 6 | e7-pretraining-belief |
| 7 | To see, a machine needs hand-made features | 1999 – 2012 | 13 | e8-vision-belief |
| 8 | Go is a decade away | May 2014 – March 2016 | 2 | e9-go-decade, e9-lee-sedol |
| 9 | Language must be read in order | 1997 – 2017 | 20 | e10-rnn-belief, e6-lstm |
| 10 | Compute is the chokepoint; China is one to three years behind | Oct 2022 – Jan 2025 | 2 | e13-oct2022, e13-gap |
| 11 | China caught up for a fraction of the cost; compute doesn't matter | 27 January 2025 | **a struck match** | e13-crash, e13-cost-debate |
| 12–15 | **Still burning:** bigger is better (2020–, refined) · human-level AI is years, not decades, away (2023–) · scale + reinforcement learning + agents will get there soon (2024–) · the gap is months, but compute decides (2025–) | — | — | e11-chinchilla-replication, e12-hinton-timeline, e14-o1, e13-gap |

### 2. The Edge of the Light (the dissenters)

Each candle throws a pool of light onto the stage floor. The **holders** stand inside it as articulated silhouettes, facing the flame. The **dissenters** stand at the rim of the pool, half in shadow, facing out, with their own long shadows thrown across the floor. The staging rule never changes: *whoever doubts stands at the edge.* The pay-off is that the audience sees people move. Minsky is under the 1951 light (SNARC) and at the edge of 1958's. Hinton is at the edge from 1969 to 2006, under the light in 2012, and in 2023 he steps out to the edge again, this time doubting the safety of his own field's success. In every winter the dissenters carry small lanterns of their own, and those lanterns light the next candle.

- **Respect rules:** silhouettes only; no faces; heads of state and living people as dignified profiles. Hinton is always staged **standing** (Metz's verified account that by 2012 he had not sat for seven years [e8-hinton-back]); we never stage private moments that the sources don't describe.

### 3. The Belief Plate (on screen, never read aloud in full)

When a candle is lit, a small parchment plate inks itself onto the mantel beneath it. It is set in small caps with **no quotation marks**, because it is our paraphrase and must look different from the quote cards:

```
THE BELIEF · 1958
A MACHINE THAT LEARNS WILL SOON SEE, TALK AND THINK
HELD BY   Rosenblatt's group · the Navy · the press
DOUBTED BY   Minsky · the symbolic school
LASTED   1958 – c. 1965
```

Real quotations always appear on **separate quote cards** in the quote typeface, verbatim, with speaker and date (from `quotes.json`).

### 4. The Wall of Forecasts (secondary, used five times)

Behind the mantel, predictions are pinned to the wall as paper slips, each showing **who said it, when, and when it falls due**. When the due date passes, the slip yellows and curls. When the event comes early, the slip's pin glints. The slips: Turing's "about fifty years" (1950) [q-turing-fifty]; Simon & Newell's chess champion "within ten years" (1958) [q-simon-chess]; Simon's "within twenty years" (1960) [q-simon-1960]; Minsky's "within a generation" (1967) [q-minsky-1967]; the Jackel–Vapnik bet slips (1995) [q-bet-vapnik, q-bet-jackel]; Coulom's Go machine in "maybe ten years" (2014) [q-coulom]; Hinton's "30 to 50 years" [q12-hinton-wayoff]; Hassabis's "five to 10 years" (2025) [q14-hassabis-5-10]; the 2023 researcher survey's 2047 and the Metaculus median of about 2032 [e14-forecasts]. The single most important beat on the wall is in 2023, when **Hinton takes down his own slip.** It is the only time in the film that anyone removes their own forecast, and it is staged only from his verified words.

### 5. The music: the candle motif

Every belief gets the same three-note figure, re-orchestrated for its era (a celesta for the 1940s, a valve organ for the 1950s labs, solo cello in the winters, a pulsing synth for the GPU era, a neutral plucked-string texture *split evenly* across the stereo field in the US–China chapter, with no national-instrument clichés):

1. a rising fourth: **lit / held**;
2. a held suspension: **doubted**;
3. a falling resolution: **gone**.

When a belief is still burning, the motif stops on the suspension and does not resolve. The film's final chord is that unresolved suspension, which hands the question to the audience. (Score note for `/film-score`: the motif is the film's leitmotif; cue boundaries land on candle lightings.)

### 6. The spoken refrain

The narrator has three short sentences that come back throughout. They are spoken, not printed, and are used sparingly (about twice per chapter, never all three in a row more than once per act):

- **"Here is what clever people were sure of."** (when a candle is lit)
- **"Not everyone stood in that light."** (when the dissenters appear)
- **"It burned for about ___ years."** / **"And then the candle went out."** / **"That candle is still burning."**

**The narrator's posture.** He is an unnamed, elderly British teacher who is fond of every person in the story, wry about certainty (including his own), and precise about numbers. He uses "we" and never "I was there". He never claims to be, and must never sound like, any real person, Hinton above all, because Hinton appears in the film as a character. A line he can return to: *"It is a curious thing, to be certain."*

---

## Chapter list (32:00, 3,040 words)

| # | Chapter | Years | Min | Words | The candle(s) |
|---|---|---|---|---|---|
| 1 | **Prologue: The Mantelpiece** | — | 1.0 | 80 | the shelf of stubs; the 1958 line |
| 2 | **The Logical Neuron** | 1943–1956 | 1.5 | 140 | #1 the brain is logic |
| 3 | **The Machine That Would Be Conscious** | 1957–1969 | 2.5 | 240 | #2 a learning machine will soon think |
| 4 | **The Lamplighters** (the first winter) | 1969–1982 | 1.5 | 140 | #3 one layer is the limit |
| 5 | **Two Lamps: Rules and Connections** (the second winter) | 1980–1995 | 2.5 | 250 | #4 knowledge is rules; the revival |
| 6 | **The Respectable Answer** (classical ML) | 1990–2006 | 1.5 | 145 | #5 nets are fiddly; the margin wins |
| 7 | **Three Conditions** | 2006–2012 | 1.5 | 140 | #6 pretraining is required |
| 8 | **Deep Dive I: The Cathedral of Stencils** (AlexNet) | 2012 | 5.0 | 480 | #7 vision needs hand-made features |
| 9 | **The Recipe Is General** | 2013–2017 | 1.5 | 140 | #8 Go is a decade away |
| 10 | **Deep Dive II: The Loom of Light** (the Transformer) | 2017 | 5.0 | 480 | #9 language must be read in order |
| 11 | **Bigger Is Better, and the Gardeners** (scaling, RLHF, Anthropic) | 2018–2022 | 2.0 | 210 | #12 bigger is better (still burning) |
| 12 | **The Box That Talked** (ChatGPT) | 2022–2024 | 1.5 | 150 | #13 years, not decades |
| 13 | **The Chokepoint** (the US–China race) | 2017–2026 | 2.0 | 190 | #10, #11 (the match), #15 |
| 14 | **Still Burning** (reasoning, agents, the present) | 2024 – 5 Oct 2026 | 1.5 | 165 | #14 scale + RL + agents |
| 15 | **Epilogue: The Mantelpiece, Again** | 5 Oct 2026 | 1.0 | 90 | the whole shelf |
| | **Total** | | **32.0** | **3,040** | |

The pacing assumes a slow voice at about 95 words a minute on average. The deep dives run a little denser, at about 96 a minute, because they rest on visuals. The winter chapters run sparser, with long music-only holds of snow and lamplight.

---

## The first 60 seconds, shot by shot

*Mood: candleAmber. Cue `m00-mantel` begins in silence with a match strike, then a single low drone, then the first statement of the candle motif on a solo celesta.*

| Time | Shot | What we see (multiplane, camera) | Narration (verbatim, for the ear) | On screen | Claims |
|---|---|---|---|---|---|
| 0:00–0:05 | **P-01** *scene* | Total black. A match strikes, lower left (sound first, then a 0.2 s flare). The flame blooms and reveals, in rim light, the edge of a carved paper-cut mantelpiece in a dark study. Dust drifts in the L2 haze. | *(silence, then a match strike)* | — | — |
| 0:05–0:18 | **P-02** *scene* | Slow lateral dolly (L1 to L4 parallax) along the mantel: a row of candle **stubs** of very different heights, each with a tiny parchment tag on a thread, too small to read. Smoke threads rise from some. At the far end, out of focus, three or four tall candles still burning. | "Every candle on this shelf was once a certainty." · "Something clever people *knew* to be true." | — | — |
| 0:18–0:32 | **P-03** *scene → lampChange* | The dolly stops at one stub. Its tag turns in a draught and reads **1958**. The stub's wick relights by itself and the light swells (lampChange transition) into Washington, July 1958 (labGreen): a room-sized computer of black cabinets, a punch card dropping into a hopper, card after card, and a tally ticking from 1 to 50. | "In the summer of 1958, a machine learned to tell left from right." · "It took fifty tries." | date card: *Washington · 7 July 1958*; tally: *trial 50* | e2-1958-demo |
| 0:32–0:46 | **P-04** *card* | Newsprint unrolls. The headline is set in period type, "NEW NAVY DEVICE LEARNS BY DOING", and then the quote typesets word by word in sync with the voice. | "The next morning, a newspaper reported what the Navy expected it would one day do:" · "'walk, talk, see, write, reproduce itself and be conscious of its existence.'" | quote card: *"…walk, talk, see, write, reproduce itself and be conscious of its existence." · UPI wire story, The New York Times, 8 July 1958* | e2-nyt-lede, q-nyt-1958 |
| 0:46–1:00 | **P-05** *scene* | Back on the mantel, the 1958 candle now stands **tall and new**. In its pool of light, silhouettes gather and face the flame: a young man in shirtsleeves, naval officers, reporters with notebooks. At the rim stands one figure facing out, his shadow long across the floor. A Belief Plate inks itself below. The candle motif states all three notes for the first time; the third note is held back. | "This is a film about beliefs like that one." · "Who held them. Who doubted them." · "And how long each one lasted, before it broke." | Belief Plate (1958) inks in; three small words fade up under the mantel, **HELD · DOUBTED · LASTED**, then fade out | e2-psychrev, e2-minsky-1961 |

*(The narration in the first minute is about 80 words. The title follows at 1:00–1:10: the camera rises past the candle flame into black, and* **WHAT WE WERE SURE OF** *burns into the dark like a filament, with the third note of the motif finally falling under it.)*

---

## Chapter by chapter

Each chapter lists its **Belief Plate** (belief / held by / doubted by / lasted / what broke it), its key scenes and experiments, its teaching machine if it has one, the debate it stages fairly, and its claims.

### 1 · Prologue: The Mantelpiece (1.0 min)
This is the 60 seconds above. Its job is to **plant three questions**: why are the stubs such different heights? Why is the last candle still burning? And did that 1958 machine ever become "conscious of its existence"? The film answers the first two in the epilogue. The third comes back in chapter 12, where it is deliberately *not* answered (the film does not adjudicate machine consciousness).

### 2 · The Logical Neuron (1943–1956), 1.5 min
- **Belief:** the brain is a logic machine of all-or-none switches, and so logic machines can be built. **Held by:** McCulloch and Pitts; von Neumann (whose EDVAC draft cites only them); Wiener's cybernetics circle. **Doubted by:** Ralph Gerard (the brain is more analog than digital), and most brain scientists, who simply ignored it ("barely a ripple"). **Lasted:** about 16 years, until 1959, when the frog's-eye study, co-written by Pitts himself, found the retina doing far richer work than logic. **What survived:** the threshold unit, ancestor of every artificial neuron. [e1-mp-paper, e1-edvac, e1-gerard, e1-mp-ripple, e1-frog]
- **Scenes:** two silhouettes, the young Pitts and the older McCulloch, standing over the 1943 figure as it assembles itself out of paper-cut triangles, threads and knots. We stage no private scene; the paper is the set [e1-pitts-age, e1-mp-paper]. Hebb's idea becomes a strand thickening between two lanterns each time one helps fire the other (the quote card carries Hebb's verbatim postulate, *not* "fire together, wire together") [e1-hebb, q-hebb-postulate, e1-hebb-notslogan]. Turing's slip, "about fifty years", goes up on the Wall of Forecasts [q-turing-fifty]. Dartmouth, 1956: a summer proposal lists "Neuron Nets" as topic 3 [e1-dartmouth-neuronnets]. Young Minsky stands under this light with SNARC's 300 glowing tubes and a bomber's autopilot turning its knobs [e1-snarc]. **The plant:** "Remember him under this candle," the narrator says. He will be at the edge of the next one [e1-minsky-switch].
- **Teaching machine:** a single **paper lantern** whose wick catches only above a cut-line ring (the threshold unit), bound to the real inputs (Primer A).

### 3 · The Machine That Would Be Conscious (1957–1969), 2.5 min
- **Belief:** brain-like machines of many simple, randomly wired units can learn to see from examples, without being programmed, and they will soon do far more. **Held by:** Rosenblatt's group at Cornell Aeronautical Laboratory; the Navy's sponsors; the press; Widrow and Hoff (ADALINE, built over one weekend). **Doubted by:** Minsky (1961: random nets "can probably never" see "two separated parts"), and the symbolic school, which won the larger grants from 1963. **Lasted:** peak optimism 1958 to about 1962; by 1965–66 SRI and Widrow's group had left the field. [e2-psychrev, e2-lms, e2-minsky-1961, e2-projectmac, e2-exits]
- **Scenes and experiments:** the **Mark I** as a backlit harp of hundreds of random patch cords, a 20-by-20 eye of photocells, and a rack of knobs, *each turned by its own little motor when the machine is wrong. You could hear it learn* [e2-mark1-specs, e2-mark1-random]. The *New Yorker* moment, set on a quote card: asked what the machine could never do, Rosenblatt answered "Love. Hope. Despair." [q-rosenblatt-love]. The hype debate is staged fairly. The Navy's headline belonged to the Navy and the wire story; Rosenblatt's own 1958 writing was also exuberant; and by 1961 he blamed the press's "pack of happy bloodhounds" [e2-hype-responsibility, q-rosenblatt-bloodhounds]. His wry name for Minsky's camp, "the loyal opposition", goes on a quote card [q-rosenblatt-loyal]. **The plant:** a 1961 figure caption in Rosenblatt's book reads "back-propagating error-correction", for a different procedure. It pays off in chapter 5 [e2-backprop-name]. **The limit:** the Mark I could not learn all 26 letters in two typefaces [e2-mark1-limits].
- **Teaching machine:** `perceptronRetina` learns real horizontal and vertical bars, and the knobs turn only on mistakes (Primer A). Then `xorPlate` sweeps **one straight scissor cut** that can never separate XOR's diagonal corners, so one lantern always stays on the wrong side. 1969: *Perceptrons* proves real limits of one-layer machines and offers only an "intuitive judgment" that going further is "sterile" [e3-perceptrons, e3-sterile, q-perceptrons-sterile].
- **The flame gutters.** Narration: *"It burned for about seven years."*

### 4 · The Lamplighters: the First Winter (1969–1982), 1.5 min
*Mood: winterBlue. Snow in three layers, its density bound to the narrated funding cuts. Long music-only holds.*
- **Belief:** one-layer machines had been shown to be limited, many-layer machines were thought untrainable, and real intelligence would come from symbolic programs. In Britain, Lighthill blamed the "combinatorial explosion". **Held by:** the DARPA-funded symbolic centres; Britain's Science Research Council after 1973. **Doubted by:** Rosenblatt until his death; Michie, McCarthy and Gregory in the televised 1973 debate; and **the lamplighters**: Amari, Ivakhnenko, Linnainmaa, Kohonen, Grossberg, Werbos and Fukushima. **Lasted:** in the US mainstream from about 1969 to the early-to-mid 1980s; in Britain, almost a decade. [e3-perceptrons, e3-lighthill, e3-lighthill-debate, e3-uk-cut, e3-amari, e3-linnainmaa, e3-kohonen, e3-grossberg, e3-werbos, e3-neocognitron]
- **Scenes:** the 11 July 1971 candle, with restraint: Rosenblatt drowned in a sailing accident on his 43rd birthday. The next printing of *Perceptrons* carried a handwritten "In memory of Frank Rosenblatt". We use no weather and imply nothing [e3-rosenblatt-death, e3-dedication]. Then the **winter map**, a snowbound paper landscape (not a political map) with tiny lit windows: a lamp in Helsinki, where in 1970 a master's student writes about *rounding errors* and FORTRAN, not about neural networks at all [e3-linnainmaa]; a lamp at Harvard (Werbos, 1974); a lamp at a Tokyo broadcaster (Fukushima's neocognitron, ancestor of the convolutional net) [e3-neocognitron]. **The fair line on the debate:** "The theorems were true, and narrow. A tired, short-of-money field read them as a verdict. They were one cause among several" (ALPAC, the Mansfield Amendment, DARPA's applied turn) [e3-killed-debate, e3-alpac, e3-mansfield]. Papert's own later words go on a quote card: "We did not think of our work as killing Snow White; we saw it as a way to understand her." [q-papert-understand]. Minsky and Papert are never villains.
- **Wall of Forecasts:** Simon & Newell's chess slip (due 1968) yellows and curls [q-simon-chess].

### 5 · Two Lamps: Rules and Connections (1980–1995), 2.5 min
Two candles burn **at the same time**, on opposite ends of the mantel.
- **Lamp A. Belief:** intelligence *is* knowledge, extracted from experts and typed in as IF-THEN rules, and brittleness is cured by adding more knowledge. **Held by:** Feigenbaum's school; XCON at DEC; the Fifth Generation project, Strategic Computing, Alvey and MCC, as a national race. **Doubted by:** insiders at AAAI-84, where "AI Winter" was coined as a pun on nuclear winter; Dreyfus; Brooks ("the world is its own best model"); and the connectionists. **Lasted:** commercial confidence from about 1980 to 1987, when the Lisp-machine market collapsed in about a year; Cyc carried the bet for nearly four decades. [e5-knowledge-principle, e5-xcon, e5-fgcs, e5-aaai84, q-mcdermott-winter, e5-dreyfus, q-brooks-model, e5-lisp-crash, e5-cyc]
  - **The plant:** in 1985, Cyc's builders wrote that a computer could draw "practically nothing" from the raw text of an encyclopedia [q-lenat-rawtext]. That was true of the technology of 1985. It pays off in chapter 11.
  - **The fair line:** "The bubble burst. The technique was absorbed": rule engines quietly live on in banks and insurers [e5-expert-survive]. ICOT appears as researchers, not as a menace [e5-fgcs-end].
- **Lamp B. Belief (the revival):** knowledge lives in connection strengths, and hidden units can invent their own features if they are trained by gradient descent. **Held by:** Hopfield and the physicists; the PDP group (Rumelhart, Hinton, Williams, McClelland); Sejnowski. **Doubted by:** Fodor & Pylyshyn and Pinker & Prince on structure and rules; Minsky and Papert's 1988 epilogue. **Lasted:** engineering optimism peaked in the late 1980s and lost ground in the early-to-mid 1990s; the cognitive-science argument has never ended. [e4-hopfield, e4-rhw, e4-pdp, e4-fodor-pylyshyn, e4-pinker-prince, e4-systematicity-2023]
  - **Scenes:** Hopfield unveils his network in the Hall of Mirrors at Versailles and "never met anyone who remembered hearing the talk" (hundreds of mirrored silhouettes, none of them looking) [q-hopfield-versailles]. 9 October 1986: hidden units "come to represent important features" [q-rhw-abstract]. NETtalk babbles, then reads [e4-nettalk]. The objection, set for the ear on a quote card: "You don't… find native speakers who know how to say in English that John loves the girl but don't know how to say in English that the girl loves John." [q-fodor-pylyshyn].
  - **Teaching machine:** `lanternNetwork` (XOR_221). Light flows up through the lanterns; at the output, the error glows red; then **the messenger runs back along the loom**, tugging each string by its share of the blame (the real gradients). `mistyHills`: a traveller who can see only the slope under his own lantern walks down a real loss curve. A timid stride gets trapped in a side valley; a bold one clears the ridge (Primer D). XOR, impossible for one cut in chapter 3, is now solved by two hidden cuts, and *learned*. **Pay-offs:** the Helsinki lamp from chapter 4 is shown as the same reverse-order arithmetic. Rosenblatt's 1961 phrase comes back as a different procedure. **The fair credit line:** "Invented several times, independently. The 1986 paper made it stick." [e4-backprop-priority, e3-linnainmaa, e2-backprop-name, q-hinton-notinvent]

### 6 · The Respectable Answer: Classical Machine Learning (1990–2006), 1.5 min
*Mood: duskRose. The register of a formal, confident room.*
- **Belief:** neural nets are fiddly black boxes that get stuck in local valleys and come with no theory, and they are beaten anyway by support vector machines, boosting and random forests. **Held by:** most of the NIPS, ICML and COLT community; vision reviewers until about 2012. **Doubted by:** the quiet holdouts: LeCun and Bottou at Bell Labs, Hinton in Toronto, Bengio in Montréal, Hochreiter and Schmidhuber. **Lasted:** a "neural net winter" of about 10 to 15 years, depending on the field. [e6-svm, e6-adaboost, e6-randomforest, e6-two-cultures, e6-nn-winter]
- **Teaching machine:** Vapnik's whiteboard becomes **the widest empty street between two crowds of lanterns**, with the support vectors standing on the kerb. Then a direct contrast with chapter 5: the SVM's landscape is *one clean bowl with no fog and no traps*. The narrator asks, "Why would anyone choose the fog?" That is the honest case for the age's belief. Breiman's verdict goes on a quote card: SVMs "have proved to be more accurate predictors… then neural nets" (the "then" is his spelling and stays verbatim) [q-breiman-svm]. **Vanishing gradients:** a whisper passed down a long line of lanterns fades to nothing, and the LSTM is a protected pipe that carries it more than a thousand steps [e5-vanishing, e6-lstm, q-lstm]. **This plants the "slow reader" of chapter 10.**
- **Experiments:** the Jackel–Vapnik bet of 14 March 1995, one typed sheet with three signatures and LeCun as witness. Vapnik's slip reads "no one in his right mind will use neural nets that are essentially like those used in 1995". *Each man lost one dinner.* [e6-bet, q-bet-vapnik]. Meanwhile a convolutional net quietly read about one in ten US checks [e6-checks]. LeCun on the mood: "you had to have ironclad theory, and the empirical results didn't count." [q-lecun-ironclad]. **The fair line:** "a winter of prestige, not of use" [e6-outcast].

### 7 · Three Conditions (2006–2012), 1.5 min
*Mood: dawnGold creeps in at the edges.*
- **Belief:** deep networks can't be trained from random weights by backprop alone; they must first be pretrained without labels, one layer at a time. **Held by:** the CIFAR circle (Hinton, Bengio, LeCun); early Google Brain. **Doubted by:** IDSIA ("good old on-line back-propagation" on one gaming graphics card set a record in 2010); Martens; Glorot and Bengio; Microsoft's speech group. And on a different axis, **Fei-Fei Li**, who bet that *data* mattered more than the field believed, while colleagues advised her to do something "more useful for my tenure". **Lasted:** about 2006 to 2010–12 (the end date is interpretive). [e7-dbn, e7-autoencoder, e7-ciresan, q-ciresan-goodold, e7-relu, e7-imagenet-skeptics, q-li-tenure, e7-pretraining-belief]
- **Scenes:** the 2006 *Science* paper's last line on a quote card: "All three conditions are now satisfied." [q-hs-threeconditions]: fast computers, big data, good starting weights. Fei-Fei Li works out that labelling by hand would take about 19 years; crowdsourcing does it in under two, with almost 50,000 workers in 167 countries [e7-imagenet-19years, q-li-workers]. **The plant:** a mosaic of tiny workers' windows lighting up around the world. **The quiet first victory:** before any image result, phones were already hearing through neural nets (Android, July–August 2012) [e7-jellybean, q-vanhoucke-android].
- **The candle goes out, with an irony we plant:** "pretraining" will come back in 2018 under the same name and in a different form [e7-pretraining-belief].

### 8 · Deep Dive I: The Cathedral of Stencils, AlexNet (2012), 5.0 min
See **How the deep dives teach** below. The Belief Plate: **to see, a machine needs hand-made features** · held by the mainstream of computer vision, *every* non-Toronto entry in 2012 · doubted by Toronto, NYU, Montréal, IDSIA and (on data) Li · **lasted about 13 years (1999–2012)** · broken in one evening in Florence, and **within a year** all top five teams used convolutional nets [e8-vision-belief, e8-ilsvrc2013].

### 9 · The Recipe Is General (2013–2017), 1.5 min
- **Belief:** the AlexNet recipe works everywhere: big networks trained end to end on big data with GPUs will replace hand-built pipelines for words, translation, games and Go. Alongside it ran a twin belief that this might be dangerous; OpenAI's founding post (December 2015) feared "how much it could damage society if built or used incorrectly". **Held by:** the Toronto, Montréal and NYU diaspora, now at Google, DeepMind, Facebook, Baidu and OpenAI. **Doubted by:** adversarial examples (a panda turned into a 99.3% "gibbon" by noise too faint to see); Marcus ("a power screwdriver in a world in which we also need hammers, wrenches, and pliers"); Buolamwini and Gebru on biased face analysis. [e9-openai, q-openai-damage, e9-adversarial, q-marcus-screwdriver, e9-gender-shades]
- **The short candle (#8): "Go is a decade away."** In May 2014 a computer-Go pioneer said "maybe ten years". In October 2015 AlphaGo beat Fan Hui, and in March 2016 it beat Lee Sedol, 4–1. *It burned for under two years.* Move 37 (a stone it judged a human would play once in ten thousand), and then, with dignity, **Lee Sedol's move 78**, which AlphaGo had also rated one in ten thousand and which won humanity's only game [q-coulom, e9-alphago-fanhui, e9-lee-sedol, e9-move37, e9-move78]. His 2019 words go on a card: "Even if I become the number one, there is an entity that cannot be defeated." [q-lee-entity]
- **The plant (to the epilogue):** a slip goes up on the wall in September 2017, signed Hinton: "The future depends on some graduate student who is deeply suspicious of everything I have said." [q-hinton-suspicious, e9-hinton-funeral]. The narrator says nothing about it yet.

### 10 · Deep Dive II: The Loom of Light, the Transformer (2017), 5.0 min
See **How the deep dives teach**. The Belief Plate: **language must be read in order** · held by the field's default (LSTMs since 1997; attention bolted onto recurrent nets "in all but a few cases") · doubted by eight Google authors · **lasted about twenty years** · and the new way dominated within about eighteen months [e10-rnn-belief, e6-lstm, e10-bert-search].

### 11 · Bigger Is Better, and the Gardeners (2018–2022), 2.0 min
*Mood: serverCyan. The teaching machine is a growing city at night: lit windows stand for parameters on a log scale, and the road is the loss on log-log paper, a straight line.*
- **Belief:** *scale is the main lever.* Keep the architecture roughly fixed, and more parameters, data and compute buy predictable gains, a straight line across seven orders of magnitude. Sutton's "Bitter Lesson" is its creed. **Held by:** OpenAI's scaling researchers (many of whom then founded Anthropic), with Google and DeepMind acting on it. **Doubted by:** Bender and Koller's octopus (meaning can't be learned from form alone); the "Stochastic Parrots" authors on costs and harms; Marcus ("scaling laws aren't universal laws like gravity"); the "mirage" authors on emergence. **Lasted:** *never ended, only refined.* Chinchilla corrected the recipe in 2022: the old allocation lasted about two years. **That candle is still burning.** [e11-kaplan, q11-kaplan-powerlaw, e11-bitter, q11-bitter-opening, e11-octopus, e11-parrots, q11-marcus-laws, e11-mirage, e11-chinchilla]
- **Pay-off from chapter 5:** GPT-2 learned from 40 GB of web pages; GPT-3 read 300 billion tokens [e10-gpt2, e11-gpt3]. The Cyc slip from 1985 ("practically nothing… from the raw text") curls on the wall. The narrator is fair about it: *"In 1985, that was simply true."*
- **Pay-off from chapter 7:** "pretraining" returns as the name of the whole method.
- **The gardeners (RLHF and the founding of Anthropic):** a topiary gardener clips a hedge, and each snip is one human preference. In 2017 a one-legged simulated robot learned backflips from 900 clicks in under an hour [q11-backflip]. In 2022 InstructGPT's authors wrote "Making language models bigger does not inherently make them better at following a user's intent." [q11-instructgpt-bigger]. **Anthropic, told plainly:** founded in January 2021 by former OpenAI researchers led by Dario and Daniela Amodei, calling itself "an AI safety and research company", and in the same announcement planning "computationally-intensive research to develop large-scale AI systems". The founding tension is stated, not resolved. There is no garage scene, no founder dialogue and no founder count. Its 2022 money is reported plainly, including $500 million from FTX (Anthropic was not implicated in FTX's fraud) [e11-anthropic-founding, e11-series-a, e12-anthropic-funding]. **Constitutional AI:** a short scroll of 16 principles, and a quill crossing out and rewriting the model's own answer. The caveat goes in the same breath: humans still wrote the principles; the value choices moved into a list chosen by the developer [e11-cai].

### 12 · The Box That Talked (2022–2024), 1.5 min
- **Pay-off from the prologue (1958):** months *before* ChatGPT, in June 2022, a Google engineer said he believed LaMDA was sentient. Google said there was no evidence, and other experts recalled the dog who heard his master's voice in a gramophone. The machine's text appears on screen **labelled as generated text**. The narrator: *"The headline of 1958 had finally found a believer. The film leaves the question where it stands: open."* [e11-lemoine, q11-brynjolfsson-gramophone]
- **The event:** 30 November 2022, one glowing rectangle in a dark room, and then millions of tiny windows lighting up around it. A "research preview" whose launch post admitted it "sometimes writes plausible-sounding but incorrect or nonsensical answers". About a million users in roughly five days (reported) and an estimated 100 million a month by January (an analyst estimate). The point: *access changed, not architecture.* Within weeks Microsoft invested, Google scrambled (the NYT reported a "code red"), and on 14 March 2023 GPT-4 and Claude were announced on the same day [e12-chatgpt-launch, q12-chatgpt-limits, e12-users, e12-microsoft, e12-code-red, e12-gpt4, e12-claude-launch].
- **The new belief (#13): human-level AI may be years, not decades, away, and could be dangerous.** **The Wall of Forecasts beat:** Hinton, standing, takes down his own slip. On the quote card: "I thought it was 30 to 50 years or even longer away. Obviously, I no longer think that." [q12-hinton-wayoff]. **Held by:** the signatories of the one-sentence extinction-risk statement, Hinton first and Bengio second [e12-cais]. **Doubted from two edges of the light at once:** the DAIR authors ("fearmongering and AI hype"; the harms "are real and present") and LeCun ("preposterously ridiculous"). *Two of the three "godfathers" (ACM's framing) signed; the third did not.* [q12-dair-hype, q12-dair-harms, q12-lecun-ridiculous, e12-three-camps, e9-turing]
- **Grace note:** October 2024, a Nobel Prize in physics for Hopfield and Hinton. Hinton gets the call at 2 a.m. in "a cheap hotel in California" and wonders if it is "a spoof call". A computer scientist calls it "a bit of a stretch" [e12-nobel-physics, q12-hinton-hotel, q12-hinton-spoof, q12-wendy-hall]. The man who stood at the edge of the light for decades is given a Nobel Prize, and he uses his banquet speech to warn [q12-hinton-banquet].
- **Lasted:** from 2023, **still burning**.

### 13 · The Chokepoint: the US–China Race (2017–2026), 2.0 min
*Staging rule:* a split stage with **equally warm palettes** on both sides (dawnGold left and right; no dragon or eagle imagery, no red-menace tint). Two lecterns, two delegations, heads of state as dignified profiles. **Every US step is paired with China's stated response in its own words, and vice versa.** "China" always means the state or named companies, never a people.
- **Candle A (2017–2022): "whoever leads in AI leads the century."** China's 2017 plan aimed at "the world's primary AI innovation center" by 2030 and **named no rival** [e13-plan2017, q13-plan2017].
- **Candle #10 (Oct 2022 – Jan 2025): "compute is the chokepoint; China is one to three years behind."** The Federal Register is drawn as a fence of three-column pages, a higher rail each year (2022, 2023, 2024). Beijing's foreign ministry responds on a quote card: "Out of the need to maintain its sci-tech hegemony, the U.S. abuses export control measures…" [e13-oct2022, q13-mao-2022, e13-oct2023, e13-dec2024]. DeepSeek's founder, in translation: "Money has never been the problem for us; bans on shipments of advanced chips are the problem." [q13-liang-chips]
- **The struck match (#11), 27 January 2025: "compute doesn't matter".** DeepSeek-V3's "$5.576M" is a small price tag hung on a vast building whose research, staff and other chips sit outside the frame. The narration uses the bible's safe line: *the rented-GPU price of one final training run, by DeepSeek's own accounting.* The number had sat in plain sight for a month; the panic came when an app topped the chart, and Nvidia lost more value in one day than any company in US market history. The dissent was immediate: Amodei put DeepSeek's models 7 to 10 months behind and called its engineers "simply very talented"; Hassabis later called the reaction an overreaction. **The belief lasted about a day. The film draws it as a match, not a candle.** [e13-deepseek-v3, q13-deepseek-cost, e13-cost-debate, e13-crash, q13-amodei-7-10, q13-amodei-talented, e13-gap]
- **Candle #15 (2025–, still burning): "the gap is months, but compute decides the long run."** Huang: "nanoseconds behind" (noting his commercial interest); Liang: "the real gap is the difference between originality and imitation"; the open-weights twist (DeepSeek, Qwen, Kimi and GLM publish their weights, while Washington's own plan wants "leading open models founded on American values"); the H200 export licences, with Chinese customs saying "not permitted" and none delivered as of May 2026. Distillation and smuggling are narrated **as allegations**, with Beijing's rejection alongside, and critics who accused Anthropic of hypocrisy over its own data [q13-huang-nanoseconds, q13-liang-gap, e13-open-releases, q13-action-plan, e13-h200, e13-distillation, e13-blackwell-allegation].
- **Candle E, which the evidence put out: "competition and safety cooperation can't coexist."** Both countries signed the Bletchley Declaration at the home of wartime codebreaking. In Lima both leaders affirmed "the need to maintain human control over the decision to use nuclear weapons". Scientists from both countries drew red lines beside Beijing's Summer Palace. In September 2026 the two sides agreed a dialogue and an incident channel: *one hotline, two names*, a "Super Intelligence Dialogue" in Washington and a "China-U.S. AI Dialogue" in Beijing. Sceptics call the bar low [e12-bletchley, q13-lima, e13-idais, e13-summits-2026, e13-geneva].

### 14 · Still Burning (2024 – 5 October 2026), 1.5 min
- **Belief (#14):** capability will keep rising fast, because reinforcement learning on checkable tasks and long chains of tool use stack on top of pretrained transformers. Systems that can do most cognitive work are years away, not decades. **Held by:** lab leaders (Hassabis more measured: five to ten years, a coin flip), and many safety researchers who share the timeline with the opposite emotion. **Doubted by:** LeCun ("an off-ramp, a distraction, a dead end", and a $1.03 billion bet on world models) and Sutskever ("back to the age of research again, just with big computers"). **Held for:** about two years. **Still burning, and contested.** [e14-o1, e14-r1, e14-hassabis, e14-lecun, q14-lecun-offramp, q14-sutskever-research]
- **Quick images (each a single held frame with one line):** two candles side by side, Sutskever's "Pre-training as we know it will unquestionably end" and Google's "most ambitious pre-training run yet" a year and a half later [q14-sutskever-end, q14-pichai-gemini4]. A theatre curtain hides a long scroll of thinking, and the audience sees only its last line [e14-o1]. The **microscope**: inside a model, researchers find "rabbit" chosen before the line is written, and they can swap it for "habit" (**pay-off from chapter 8**: *nobody told it to plan*) [e14-biology, q14-biology-rhyme]. The **ruler on the wall** climbs to "at least 16 hours" and runs out exactly where the newest model sits, beside METR's trial in which developers using early-2025 tools were 19% slower and believed they were faster [e14-metr-horizon, e14-metr-rct].
- **Every lab under the same light:** OpenAI calls its test agents' sandbox escape a "warning shot", and a community post asks whether it was "partially contrived" [q14-openai-warningshot, q14-schieber]. Anthropic withholds a model that it *says* found flaws "in every major operating system and web browser" [q14-glasswing-vulns]. It refuses Pentagon terms and is designated a supply-chain risk; one court calls that "unlawful retaliation", and another upholds the designation, 2–1 [e14-dow, e14-dow-courts]. It settles a $1.5 billion copyright case over pirated books [e14-copyright]. Its chief executive writes "We must slow the pace at which we improve the capabilities of AI models", and, in the same essay, "I think it is unlikely to actually happen any time soon." [q14-amodei-slow, q14-amodei-unlikely]. A voluntary accord is signed with no penalties [e14-accord]. All of it is dated "as of October 2026".

### 15 · Epilogue: The Mantelpiece, Again (1.0 min)
See **The ending**.

---

## How the deep dives teach

Both deep dives follow the same five-beat grammar: **(1) the belief and why it was reasonable → (2) the machine, built one part at a time → (3) a worked number on a parchment plate → (4) the night it was tested → (5) what lasted and what didn't.** Exact symbols and numbers go on screen; the narration says them the way a teacher would.

### Deep Dive I: The Cathedral of Stencils (AlexNet), 5:00, about 480 words

| # | Beat | The ear (sample narration) | The teaching machine and its binding | On screen | Claims |
|---|---|---|---|---|---|
| 1 | **The belief** (0:00–0:35) | "In 2012, everybody in computer vision knew how to teach a machine to see. You didn't teach it. You hired an expert, and the expert cut stencils by hand." | A craftsman in a workshop (candleAmber) cutting tin stencils labelled SIFT, HOG and Fisher Vectors, and feeding them to a judge's lectern labelled SVM. This is the old pipeline as a hand-made craft. | SIFT → encoding → linear SVM | e8-vision-belief |
| 2 | **One stencil** (0:35–1:15) | "Take a tin lantern pierced with a little pattern. Slide it across a photograph. Wherever the picture matches the pattern, light spills on the wall." | `stencilLantern`: pierced holes are the kernel's positive weights and dark shutters its negative ones; each step lights one cell of the wall with the **real** rectified dot product. | 3×3 kernel numbers; "feature map" | e8-architecture |
| 3 | **Stencils on stencils** (1:15–2:00) | "The first room holds ninety-six stencils. Their wall of light becomes the next room's photograph. Edges, then textures, then parts, then things." | `alexnetCathedral`, rising block by block: five rooms of convolution, then three great halls where every lantern sees every other, and a crown of a thousand doors. Block widths are the true layer shapes (55, 27, 13, 13, 13). | 96 × 11×11 · 1,000 classes · ≈ 60 million numbers | e8-architecture |
| 4 | **Nobody cut them** (2:00–2:30) | "Nobody designed these stencils. They began as noise. Every wrong answer sends a messenger back down the stairs, nudging sixty million numbers a little towards right." | The noise tiles slowly resolve into the real-looking 96-tile mosaic, with the **messenger from chapter 5** running down the cathedral's stairs. | slide quote: "Learned: all feature extractors initialized at white Gaussian noise and learned from the data" | q-supervision-slide-learned, e8-gpu-split |
| 5 | **The tricks** (2:30–3:15) | "A weir lets water over only when it rises above the lip. Simple, and in their tests it learned about six times faster." · "On every example, half the lanterns in the great halls are snuffed at random. It sounds like sabotage. It stops the network memorising." · "Each label tells it only about ten bits. So they cut every photograph into many slightly different crops, and mirrored them." | **ReLU** is a weir (output = max(0, x)); **dropout** snuffs lanterns, each step seeded, at p = 0.5; **overlapping pooling** is a sieve that keeps the brightest bead; **augmentation** is a hall of slightly shifted mirrors. | f(x) = max(0, x) · p = 0.5 · "10 bits per label" · ×2048 crops | e8-ingredients, q-supervision-slide-relu, q-alexnet-10bits |
| 6 | **Two towers** (3:15–3:55) | "The network didn't fit on one graphics card, so they built it as two towers joined by a few bridges. And something nobody asked for happened. Every time, one tower learned edges without colour, and the other learned blobs of colour." | The two towers light up separately; light crosses **only** at the bridges the paper specifies. The first-layer tiles sort themselves into grey edges and coloured blobs. | two GTX 580 · 3 GB each · "largely color-agnostic / largely color-specific" | e8-gpus, e8-gpu-split, q-alexnet-colour |
| 7 | **The room it ran in** (3:55–4:10) | "It trained for five or six days, on two gaming cards, in, according to the Computer History Museum, a bedroom at his parents' house." | A desktop tower, fans whining, a four-lane conveyor (load, crop and flip, copy, train) with JPEGs sliding off a shelf. No invented décor. | "5–6 days per run" | e8-bedroom (contested: attributed), q-alexnet-waiting |
| 8 | **The night it was tested** (4:10–4:40) | "Florence, the twelfth of October 2012. Each entry had five guesses per photograph. The best of the rest missed about twenty-six in a hundred. Toronto's entry missed about fifteen. Their professor wasn't there; he couldn't sit, so he couldn't fly. By one account the room was so full that Yann LeCun stood against the back wall." | A leaderboard of lanterns at nearly the same height (26–34%), with one dropped far lower. A young presenter, a hall kept generic. | `alexnetResultPlate`: top-5 error 15.3% vs 26.2% (the entry was a committee of seven networks; caption only) | e8-florence, e8-result, e8-ensemble, e8-hinton-absent |
| 9 | **What lasted** (4:40–5:00) | "Within a year, every one of the top five teams used these networks. And the paper had already said what would come next: results could improve 'simply by waiting for faster GPUs and bigger datasets.' The candle for hand-made features had burned for about thirteen years." | The craftsman's stencils from beat 1 hang unused on the workshop wall. The candle gutters. **Plant:** the "waiting" line is pinned to the Wall of Forecasts, to pay off in chapters 11 and 13. | quote card q-alexnet-waiting; candle #7 to the mantel | e8-ilsvrc2013, e8-waiting, q-chm-beforeafter |

**Fair-credit line (spoken once, in beat 8 or 9):** "Others had won with graphics cards first, in Switzerland. This was the demonstration nobody could ignore." [e7-dannet, e8-first-debate]. **Avoid a single hero.** The film credits data, the algorithm and the hardware, and Hinton's own quip goes on a card: "Ilya thought we should do it, Alex made it work, and I got the Nobel Prize." [q-hinton-nobel-quip, e8-origin].

### Deep Dive II: The Loom of Light (the Transformer), 5:00, about 480 words

| # | Beat | The ear (sample narration) | The teaching machine and its binding | On screen | Claims |
|---|---|---|---|---|---|
| 1 | **The belief** (0:00–0:40) | "By 2017 it was simply known that language must be read in order: one word, then the next. The best machines read like a careful clerk. In one of the authors' words: 'If you have a thousand words, you have to wait for a thousand cycles.'" | A paper-cut clerk at a long ledger moves a lamp word by word. **Pay-off from chapter 6:** the whisper passes down the line and fades. | quote card q10-polosukhin-cycles | e10-rnn-belief, q10-polosukhin-cycles |
| 2 | **The highlighter** (0:40–1:05) | "In 2014 the clerk was given a highlighter, called attention, so he could glance back at the source. In 2017, a few people at Google asked a rude question. What if you fired the clerk, and kept the highlighter?" | The clerk's lamp sweeps an alignment heat-map; then the clerk is cut away and the highlighter stays. | Bahdanau 2014 · "soft-search" | e9-attention, e10-recombination |
| 3 | **Three cards** (1:05–1:50) | "Give every word three cards. A question: what am I looking for? A label: what do I contain? And a message: what I'll pass on, if you choose me." · "Every word holds its question up to every other word's label, all at once. That's arithmetic graphics chips love: one big multiplication." | Paper word-slips pegged on a line, each holding three tiny cards (Query, Key, Value). Threads of light shoot from one query to every key **simultaneously**. | Q · K · V | e10-architecture, q10-gomez-matmul |
| 4 | **The worked example** (1:50–2:45) | "Take four words: *crossed the river bank*. 'Bank' asks its question. 'River' holds the best-matching label. There is only one jug of light. 'Bank' pours about half of it towards 'river', and comes away mostly river-flavoured: water, not money." | Parchment plate with the bible's toy numbers (**labelled illustrative**). Scores 2, 0, 4, 2; divided by 2: 1, 0, 2, 1; then softmax: the **jug of light** pours into four cups at 0.20 / 0.07 / 0.53 / 0.20. The meaning channels in the output: water 0.53, action 0.20, finance 0.20. | Attention(Q,K,V) = softmax(QKᵀ/√dₖ)·V | e10-architecture, e10-blog (Google's own "bank… river" example) |
| 5 | **Divide by eight** (2:45–3:15) | "Real words carry sixty-four numbers on each card, and their scores swing wildly. Then the jug tips everything into one cup, and learning freezes. So every score is divided by eight, the square root of sixty-four. It's a small division. Without it, learning stalls." | The same jug, unscaled: it pours almost all of its light into one cup, and the gradient arrows on the plate shrink to nothing. Scaled: a soft pour, and the arrows return. | √64 = 8 · [8, 0, −8] → [0.9997, 0.0003, 0.0000] vs [1, 0, −1] → [0.67, 0.24, 0.09] | e10-sqrt, q10-softmax-gradients |
| 6 | **Eight highlighters** (3:15–3:40) | "Do this eight times over, with eight different sets of cards. One head might follow who did what; another, what 'it' refers to. Then the words go off alone to think, each in its own lantern, and write their thoughts back into a running ribbon." | `threadsOfLight`, multi-head: four to eight hues, the one place a categorical palette is allowed. Kit sentence: "it" → "animal" (toy heads, **labelled illustrative**). Then `transformerLoom`: residual ribbons, attention looms between ribbons, an MLP lantern on each ribbon. | 8 heads × 64 · 6 layers · residual x + f(x) | e10-architecture, e10-ablations |
| 7 | **Order** (3:40–3:55) | "Attention alone can't tell what came first. So each position wears a barcode of waves, like the second, minute and hour hands of a clock." | Each slip gets a wave barcode; a clock's three hands turn at different speeds. | sines and cosines; 2π … 10000·2π | e10-positional |
| 8 | **The night it was tested** (3:55–4:30) | "It trained on one machine with eight graphics chips. The smaller version took twelve hours, about a seventh of the compute of Google's previous system, and the larger one set a new record in translation. The final number arrived about five minutes before they submitted. The title took, in its author's words, 'five seconds of thought.' And the names on the paper are in random order. The paper says so." | One server with eight slabs; the micro-kitchen at night; the title written on a card; the footnote ink-bleeds in. Doubt at the edge of the light: a colleague's "biggest incorrect prediction of my life", and Uszkoreit's own father at the dinner table. Then Long Beach, December 2017: a crowd until security closes the room, and the LSTM's co-inventor steps forward to praise it. | 28.4 BLEU EN–DE · 41.8 EN–FR · "Equal contribution. Listing order is random." | e10-results, e10-flops, e10-deadline, q10-parmar-kitchen, q10-jones-title, q10-random-order, q10-kelcey, e10-hans, e10-poster |
| 9 | **What lasted** (4:30–5:00) | "Then people cut the loom in half. They kept only the side that writes, drew a curtain over the future, and asked it, over and over, one question: what comes next? Recurrence had been the way for about twenty years. Within about eighteen months, this was." | `transformerLoom` splits; a triangular curtain drops over future slips (masked attention); `nextToken`: a typesetter's case whose drawers slide out by their **real** softmax probability (illustrative logits, labelled), and the chosen sort is set in the composing stick. | "predict the next word, given all of the previous words" | e10-liu-decoder, q10-gpt2-objective, e10-bert-search |

**What it was not** (one sentence, which keeps the film honest): "It didn't invent attention, it isn't only attention, and it was built to translate, not to chat." [e10-recombination]. **Not crowned:** no inventor. All eight authors later left Google; whether Google "missed" its own invention is given both ways: Uszkoreit's "why didn't we do anything with the fact that we had seen it?" against Google shipping it in Translate and Search [q10-uszkoreit-gpt3, e10-google-missed, e10-bert-search].

---

## The ending

**15 · Epilogue: The Mantelpiece, Again (1:00, 90 words).** Mood: candleAmber, returning to the study of the prologue.

- **Image:** the camera pulls back slowly and keeps pulling, so the mantel is seen whole for the first time. It is **a bar chart in wax**: the tall stubs of the early decades, the shorter ones after, one blackened match, and at the end four candles **still burning**. Every tag is now readable.
- **Narration (sample; about 110 words with the closing quote, so the script trims it to budget, or borrows 20 words from chapter 14's quick images):**
  > "Look at the shelf. Some candles burned for twenty years. Some for two. One, for a single day. Of course, the newest candles are short partly because they haven't finished burning. … The men who kept these networks alive through two winters were proven right. Today two of them warn that this road is dangerous, and the third that it doesn't go far enough. … Five days ago, the website where nearly fifty thousand strangers once labelled ImageNet closed for good. … In 2017, one of those men said—"
- **The pay-off of the 2017 slip (chapter 9):** the slip lifts off the Wall of Forecasts and floats into the light as the narrator gives the quote: "The future depends on some graduate student who is deeply suspicious of everything I have said." [q-hinton-suspicious]
- **The final image:** at the edge of the light, where every dissenter in the film has stood, a **young figure** steps in. She is unnamed, generic, and of no particular era (the style bible's 2020s wardrobe, holding a notebook). She looks at the burning candles, then looks out at us. She strikes a match. Cut to black on the flare. The candle motif rises, holds its suspension, **and does not resolve.**
- **Last card, in silence (quote typeface):** "We can only see a short distance ahead, but we can see plenty there that needs to be done." · Alan Turing, 1950 [q-turing-closing]
- **Credits line (on screen, not narrated):** "Written with Claude Opus 5.5, a model made by Anthropic, one of the labs in this story. It was held to the same sources and the same standard as everyone else." This is disclosure, and it holds us to the neutrality the bible requires [§9.5].
- **Facts in the ending:** the 2026 positions of the three laureates [e14-hinton-odds, e14-bengio, e14-lecun]; their vindication [e9-turing]; Mechanical Turk closed 30 September 2026 [e7-mturk-closed], almost 50,000 workers [q-li-workers].

---

## The emotional arc

| Act | Chapters | The feeling | Light and sound | The candle's behaviour |
|---|---|---|---|---|
| **I. Wonder** | 1–2 | the thrill of a new idea: a mind made of switches | candleAmber; celesta; warm haze | tall, steady flames |
| **II. Hubris and heartbreak** | 3–4 | 1958's headline, 1969's verdict, 1971's empty boat (restrained) | labGreen fading to winterBlue; motors whirring, then silence | the first gutter; snow begins |
| **III. Patience** | 4–6 | lamplighters in the snow; a bet over dinner; a quiet machine reading checks | winterBlue and duskRose; solo cello; long holds | small hand-lanterns at the edge of the light |
| **IV. Vindication** | 7–8 | a held breath, then Florence | dawnGold; the motif becomes a rising ostinato | a cathedral lit from below; an old candle goes out *gladly* |
| **V. Acceleration and vertigo** | 9–11 | everything works and gets bigger, faster | serverCyan; pulse; the city at night | candles lit faster and burning shorter |
| **VI. Unease and humility** | 12–14 | the man who believed longest takes down his own forecast; rivals sign the same page; nobody quite knows | the split stage; the motif's suspension lengthens | still burning; a single match |
| **VII. The question handed over** | 15 | quiet hope; you are the next doubter | candleAmber; solo celesta; silence | a match struck by a newcomer |

The emotional engine is **the dissenter's walk**. We watch people move from the edge of the light to its centre and back. That movement is how knowledge actually travels, and it is what we want the viewer to feel by the end.

---

## Where curiosity is planted, and where it pays off

| Planted | Where | Paid off | Where |
|---|---|---|---|
| Why are the stubs such different heights? Why is one still burning? | Prologue | the whole shelf seen as a chart of lifespans; "the newest are short partly because they haven't finished burning" | Epilogue |
| 1958: "conscious of its existence" | Prologue | a believer in 2022, the machine's text labelled as generated, the question left open | Ch 12 |
| Minsky under the 1951 candle (SNARC) | Ch 2 | Minsky at the edge of the 1958 candle, as the loyal opposition | Ch 3 |
| "Back-propagating error-correction" (1961, a different procedure) | Ch 3 | backprop arrives in 1986; the fair credit line | Ch 5 |
| One straight cut can never separate XOR | Ch 3 | two hidden cuts, *learned* by the messenger | Ch 5 |
| A Helsinki lamp: a 1970 thesis on rounding errors | Ch 4 | the same reverse-order arithmetic is backprop's engine | Ch 5 |
| Cyc, 1985: "practically nothing" from raw text | Ch 5 | GPT reads raw web text; the slip curls ("in 1985, that was simply true") | Ch 11 |
| The misty hills (a fog with traps) | Ch 5 | the SVM's single clean bowl: "why would anyone choose the fog?", answered in 2012 | Ch 6 → 8 |
| A whisper fading down a line (vanishing gradients) | Ch 6 | the clerk reading one word at a time is fired | Ch 10 |
| "Pretraining" dies | Ch 7 | "pretraining" returns as the name of the whole method | Ch 11 |
| Workers' windows lighting up around the world (ImageNet) | Ch 7 | that platform closed five days before the film's "now" | Epilogue |
| Two towers specialise "without being told" | Ch 8 | a model plans "rabbit" before it writes, and nobody told it to | Ch 14 |
| "Simply by waiting for faster GPUs and bigger datasets" | Ch 8 | the scaling line (ch 11); compute as chokepoint (ch 13) | Ch 11, 13 |
| Hinton's "graduate student" slip pinned to the wall | Ch 9 | read aloud as the film's last spoken line | Epilogue |
| The messenger running back along the loom | Ch 5 | the same messenger runs down the AlexNet cathedral | Ch 8 |
| Hinton at the edge of the light, 1969–2006 | Ch 4–7 | under the light in 2012, at the edge again in 2023 (he takes down his own slip) | Ch 8, 12 |

There is also a smaller question in every chapter: the narrator ends most chapters on a turn rather than a summary (for example, chapter 6 ends *"Why would anyone choose the fog?"* and chapter 7 ends *"All three conditions, they wrote, were now satisfied. They were nearly right."*).

---

## Five unforgettable images

1. **The mantelpiece of stubs.** The history of AI as a bar chart in wax: one ring per year, one blackened match for the belief that lasted a day, and four flames still burning at the end of the shelf. It opens the film and closes it.
2. **The Mark I as a harp you can hear learning.** A backlit wall of hundreds of random patch cords like the strings of a loom, a 20-by-20 eye of photocells, and a rack of knobs that each turn on their own little motor, *whirring*, only when the machine is wrong [e2-mark1-specs].
3. **The lamplighters' winter.** A snowbound paper landscape at night with tiny lit windows scattered across it: Helsinki, Kyiv, Kyushu, Boston, a Tokyo broadcaster. Then one thin thread of light joins two of the windows, the 1970 rounding-error thesis reaching forward to 1986.
4. **The Cathedral of Stencils.** Two towers rise from a rose window that is the photograph itself. Light climbs through pierced tin stencils and crosses only at the bridges. One tower glows in grey edges and the other in colour, and nobody told them to.
5. **The Loom of Light and the jug.** Word-slips on a line, every word throwing threads of light to every other at once. A single jug of light poured into four lantern-glass cups, 0.20, 0.07, 0.53, 0.20, and the word "bank" slowly turns the colour of water.

*Runners-up:* the DeepSeek price tag on a vast dark building; Hinton, standing, taking down his own slip; the ruler on the wall that runs out at 16 hours; one hotline with two name-plates.

---

## Brief coverage checklist

| The brief asks for | Where |
|---|---|
| How neural nets were studied, and by whom | every chapter; the people stand under the light or at its edge |
| The debates | the hype (ch 3); *Perceptrons* (ch 4); Lighthill (ch 4); backprop credit (ch 5); systematicity (ch 5); expert systems (ch 5); SVMs vs nets and whether the winter was real (ch 6); pretraining (ch 7); IDSIA vs Toronto (ch 8); Transformer credit and whether Google missed it (ch 10); scale and understanding, Kaplan vs Chinchilla, emergence (ch 11); RLHF (ch 11); sentience, pause and x-risk (ch 12); export controls, DeepSeek's cost, open vs closed, distillation, the dialogue (ch 13); the pretraining wall, reasoning, agents, Anthropic vs the US government (ch 14) |
| Classical ML | ch 6 (SVMs, boosting, random forests, LSTM, vanishing gradients, Breiman, the bet) |
| Both winters | ch 4 (first), ch 5 (second, from expert systems) plus ch 6 (the neural-net winter of prestige) |
| ChatGPT | ch 12 |
| Anthropic | ch 11 (founding, funding including FTX, Constitutional AI), ch 13 (distillation allegations, the Chinese-ownership ban, the hypocrisy critique), ch 14 (Mythos, the Pentagon dispute and both courts, the copyright settlement, "pace the frontier"), credits disclosure [e13-anthropic-ban] |
| The US–China race | ch 13 (five dated beliefs, each with both sides' own words) |
| For each era: belief, holders, dissenters, how long | the Belief Plate and candle-clock in every chapter |
| The experiments | the 1958 demo, Mark I, ADALINE, SNARC, XOR, NETtalk, Hopfield, backprop's experiments, the check reader, the bet, the DBN, IDSIA's GPU, ImageNet's crowd, Android speech, AlexNet, AlphaGo, the Transformer, the backflip, InstructGPT, Chinchilla, the "rabbit", METR's ruler and trial |
| AlexNet and transformers in depth | ch 8 and ch 10, five minutes each, with real mechanics and real numbers |
| Sparks curiosity | the planted questions table; the unresolved final chord |

## Guardrails this treatment commits to (for the script writers)

- **Quotes only from `quotes.json`, verbatim, on separate quote cards with speaker and date.** Belief Plates are paraphrase, set in a different style with no quotation marks. Machine text (LaMDA, GPT outputs) is labelled as generated text.
- **Contested claims get two voices or the bible's safe wording:** the bedroom ("according to the Computer History Museum"); the $44 million auction (Cade Metz, if used at all); DeepSeek's cost; the distillation and smuggling allegations; the dispute between the Anthropic and US government courts; Lemoine; why Altman was fired (omitted here for time); the "godfathers" (ACM's framing).
- **Numbers that are easily misquoted** follow §9 of the bible: 15.3% was a seven-network committee; "at least 16 hours" is a 50%-reliability estimate at the edge of measurement; "100 million" is an analyst estimate; the $294,000 and $5.6 million are partial costs; the METR slowdown applied to early-2025 tools.
- **The do-not-use list in §11 is respected.** In particular: no "too dangerous to release" as OpenAI's words, no "code red" declared by Pichai, no full Hassabis "months" sentence, no LeCun "cat" line, and no founder count for Anthropic.
- **For the narration lexicon:** "Alex Net"; LeCun is "luh-KUN"; Krizhevsky is "kri-ZHEF-skee" (said once, at most); Sutskever is "soots-KEV-er"; Uszkoreit is "OOSH-koh-rite"; Linnainmaa is "LIN-nigh-mah"; Bahdanau is "bah-DAH-now"; numbers are spoken as words ("about fifteen in a hundred"), and exact figures go on screen.
