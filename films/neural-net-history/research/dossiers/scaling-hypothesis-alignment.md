# Dossier: The Scaling Hypothesis, RLHF, the Parrot Debate and the Founding of Anthropic (2018–2022)

Topic id: `scaling-hypothesis-alignment` · Film: neural-net-history · As-of: 2026-10-05
Status: draft plus verification pass (2026-10-05), then an independent adversarial fact-check (2026-10-05; see section 13, "Fact-check log").

Tags:
- **[VERIFIED-PRIMARY]**: checked in this pass against the original paper, institutional page or the author's own text. Most arXiv abstracts were pulled verbatim through the arXiv API, and full PDFs were text-searched.
- **[VERIFIED-SECONDARY]**: checked against a reputable secondary source (news report, Wikipedia citing a primary record).
- **[UNVERIFIED]**: do not state as fact, and do not quote, without a further check.

Source numbers in square brackets, e.g. [S3], refer to section 11.

Neutrality note (from the brief): Anthropic gets the same factual standard as every other lab, with no promotion. Its founding story is told from dated public records, the same way OpenAI, Google and DeepMind are covered here. Self-descriptions such as mission statements are quoted *as* self-descriptions.

---

## 1. Summary

Between 2018 and 2022 one bet split the field: **does making a neural network bigger, with more data and more compute, keep making it smarter?**

**The bet gets a law (2020).** In January 2020, Jared Kaplan, Sam McCandlish, Dario Amodei and colleagues at OpenAI published "Scaling Laws for Neural Language Models" [S1]. Kaplan was a theoretical physicist at Johns Hopkins as well as OpenAI.
- They found that a language model's test loss falls as a smooth **power law** in model size, dataset size and training compute, "with some trends spanning more than seven orders of magnitude" [S1].
- They concluded that, for a fixed compute budget, it is best to train **very large models on relatively modest data** and stop "significantly before convergence" [S1].
- Their fitted rule was that the optimal model size grows as **N ∝ C^0.73** (C is compute) while data grows only as **D ∝ C^0.27** [S1].
- One line in the discussion is often quoted: "**Big models may be more important than big data.**" [S1] (Fact-check: the quote is verbatim; the earlier claim that it "became a slogan" had no source and was removed.)

**The bet is placed (2020).** Four months later the same group's "Language Models are Few-Shot Learners" introduced **GPT-3** [S2].
- It had **175 billion parameters**, "10x more than any previous non-sparse language model".
- It was trained on **300 billion tokens** on V100 GPUs in "a high-bandwidth cluster provided by Microsoft".
- Its training used about **3.14 × 10²³ FLOPs**, which is 3,640 petaflop/s-days [S2].
- Its novelty was **in-context learning**: you show the model a few examples *in the prompt* and it does the task, with no gradient updates [S2].
- People shown ~200-word news articles written by GPT-3 175B picked out the machine-written ones only **~52%** of the time, "barely above chance" [S2]. (The paper's accuracy measure counts only participants' non-neutral answers.)
- Sceptics and enthusiasts read the same results in opposite ways (section 7).

**The philosophy (2019).** A year earlier, reinforcement-learning pioneer Rich Sutton posted a short essay, "**The Bitter Lesson**" (13 March 2019) [S3]. It argued that over 70 years "general methods that leverage computation are ultimately the most effective, and by a large margin" [S3]. The essay became the scaling camp's creed. The pseudonymous writer Gwern Branwen set out the idea's strong form in an essay titled "**The Scaling Hypothesis**" (dated 2020-05-28 to 2022-01-02) [S4]. *Fact-check: no source found that he coined the phrase; do not say he "named" or "coined" it.*

**The correction (2022).** In March 2022, DeepMind's **Chinchilla** paper (Hoffmann et al.) showed that the field had drawn the wrong lesson about *how* to scale [S5].
- They trained over 400 models and found that parameters and training tokens should grow **in equal proportion**: "for every doubling of model size the number of training tokens should also be doubled" [S5].
- By that rule, the giant models of the day were "significantly undertrained" [S5].
- Chinchilla itself had 70B parameters and was trained on 1.4 trillion tokens, about 20 tokens per parameter. It used the same compute as the 280B Gopher and beat Gopher, GPT-3 and the 530B Megatron-Turing NLG [S5].
- So the belief changed from "make the model huge" to "balance model and data". It changed again after 2023, when labs deliberately trained small models far past the Chinchilla point to make them cheap to run (LLaMA, Feb 2023 [S29]).
- A 2024 replication found errors in one of Chinchilla's three fitting methods, but supported the core equal-scaling result [S30].

**The dissent.** Linguists and ethicists argued that scale was not understanding:
- **Emily M. Bender and Alexander Koller** (ACL 2020) offered the "octopus test": a "hyper-intelligent deep-sea octopus" taps an undersea telegraph cable and learns to imitate one islander's messages. It fails when asked how to fight off a bear, because "a system trained only on form has a priori no way to learn meaning" [S6].
- **Bender, Timnit Gebru, Angelina McMillan-Major and "Shmargaret Shmitchell"** (FAccT, March 2021) asked "How big is too big?" They called a language model "a stochastic parrot" [S7].
- The paper became famous partly because of the dispute around it at Google: Gebru's exit on 2 December 2020 (she says she was fired; Google says it accepted her resignation) and Google's firing of her co-lead **Margaret Mitchell** on 19 February 2021 [S8][S9][S41]. **[CONTESTED: attribute both accounts; do not narrate "Google pushed her out" as fact.]**
- **Gary Marcus** argued in "Deep Learning Is Hitting a Wall" (Nautilus, 10 March 2022) that scaling laws are "mere observations that might not hold forever" [S10].

**Teaching the model what people want: RLHF.**
- **2017:** Paul Christiano (OpenAI) and Jan Leike (DeepMind), with colleagues, trained agents from human comparisons between pairs of short video clips. A simulated "Hopper" robot learned a **backflip** from 900 human judgements in under an hour [S11].
- **2020:** Stiennon et al. used the method to train summarisers on Reddit TL;DR posts [S12].
- **2022 (InstructGPT, Ouyang et al.):** applied to GPT-3 with about **40 contractors**, a **1.3B** model trained this way was preferred to the **175B** GPT-3 [S13].
- This became the recipe behind ChatGPT, which launched on 30 November 2022 and is covered in another dossier.

**Anthropic.**
- **Founding (2021).** It was founded in early 2021 by former OpenAI staff led by siblings Dario Amodei (CEO; he had been OpenAI's VP of Research) and Daniela Amodei (President; she had been OpenAI's VP of Safety and Policy) [S14][S15][S16].
- **Series A (28 May 2021).** It announced a $124 million round led by Jaan Tallinn. It described itself as "an AI safety and research company" aiming at systems that are "steerable, interpretable, and robust" [S14].
- **Legal form.** It is a Delaware **public benefit corporation**, with the stated purpose "the responsible development and maintenance of advanced AI for the long-term benefit of humanity" [S17].
- **Early papers.** A "laboratory for alignment" paper (Dec 2021) [S18] and the HH-RLHF "helpful and harmless" paper and dataset (April 2022) [S19][S20] came first. Then came **Constitutional AI** (15 Dec 2022). It replaced human labels for harmfulness with a written list of principles and "RL from AI Feedback" [S21].

**Emergence: real or mirage?**
- **Claim:** Wei et al. (Google, Stanford, UNC, DeepMind; 2022) catalogued "emergent abilities": skills near-random in small models that jump sharply above random at scale [S22]. Wei later listed **137** of them [S23].
- **Counter-claim:** Schaeffer, Miranda and Koyejo (Stanford, 2023) argued these jumps are often artefacts of all-or-nothing metrics. With continuous metrics, the curves are smooth [S24]. Their paper won a NeurIPS 2023 Outstanding Paper award [S25].
- **Status:** the debate is unresolved (section 7).

**Elsewhere in the scaling era.**
- **AlphaFold 2** reached a median **92.4 GDT** at CASP14, announced 30 November 2020 [S26][S27]. It won Hassabis and Jumper half the 2024 Nobel Prize in Chemistry [S28].
- **DALL·E** (2021) and diffusion models (DALL·E 2 and Stable Diffusion, 2022) brought generative images to the public [S31–S35].
- **LaMDA and Blake Lemoine (June 2022).** Google engineer Blake Lemoine told the Washington Post that the LaMDA chatbot was sentient [S36][S37]. Google put him on paid leave and fired him on 22 July 2022 [S38]. It was the moment "is it conscious?" moved from seminar rooms to the front page.

---

## 2. Timeline

| Date | Event | Sources | Tag |
|---|---|---|---|
| 21 Jun 2016 | Amodei, Olah, Steinhardt, Christiano, Schulman, Mané post "Concrete Problems in AI Safety" (later cited by Anthropic as prior team work). | [S39][S14] | VERIFIED-PRIMARY |
| 12 Jun 2017 | Christiano, Leike, Brown, Martic, Legg, Amodei: "Deep reinforcement learning from human preferences" (OpenAI + DeepMind). Feedback on <1% of interactions; Hopper backflip from 900 queries in under an hour. | [S11] | VERIFIED-PRIMARY |
| 13 Mar 2019 | Rich Sutton posts "The Bitter Lesson". | [S3] | VERIFIED-PRIMARY |
| 23 Jan 2020 | Kaplan et al., "Scaling Laws for Neural Language Models" (arXiv 2001.08361). | [S1] | VERIFIED-PRIMARY |
| 28 May 2020 | Brown et al. (31 authors), "Language Models are Few-Shot Learners": GPT-3, 175B parameters. | [S2] | VERIFIED-PRIMARY |
| 28 May 2020 | Gwern begins "The Scaling Hypothesis" essay (dated 2020-05-28 to 2022-01-02). | [S4] | VERIFIED-PRIMARY |
| 19 Jun 2020 | Ho, Jain, Abbeel: "Denoising Diffusion Probabilistic Models". | [S33] | VERIFIED-PRIMARY |
| Jul 2020 | Bender & Koller, "Climbing towards NLU: On Meaning, Form, and Understanding in the Age of Data" (ACL 2020; the octopus test). | [S6] | VERIFIED-PRIMARY (paper); month from ACL 2020 conference |
| 2 Sep 2020 | Stiennon et al., "Learning to summarize from human feedback" (NeurIPS 2020). | [S12] | VERIFIED-PRIMARY |
| 8 Sep 2020 | The Guardian publishes an op-ed assembled from eight GPT-3 outputs ("I am not a human. I am a robot."). | [S40] | VERIFIED-PRIMARY |
| 30 Nov 2020 | CASP14 results: AlphaFold median 92.4 GDT across all targets. | [S26] | VERIFIED-PRIMARY |
| 2 Dec 2020 (evening) | Timnit Gebru announces on Twitter that Google forced her out over the "Stochastic Parrots" paper; Google says it accepted her resignation. | [S8][S41] | VERIFIED-SECONDARY |
| 29 Dec 2020 | OpenAI's "Organizational Update from OpenAI" announces that "Dario Amodei, VP of Research, is leaving OpenAI after nearly five years with the company" and that "He and a handful of OpenAI colleagues are planning a new project". | [S42][S16] | VERIFIED-PRIMARY (via Internet Archive copy; openai.com itself returns 403) |
| 5 Jan 2021 | OpenAI announces DALL·E ("a 12-billion parameter version of GPT-3"). The arXiv paper "Zero-Shot Text-to-Image Generation" follows on 24 Feb 2021. | [S31][S32] | VERIFIED-PRIMARY (blog via Internet Archive copy; paper via arXiv) |
| 26 Jan 2021 | Anthropic, PBC registered (Wikipedia, citing OpenCorporates). | [S15] | VERIFIED-SECONDARY |
| 19 Feb 2021 | Google fires Margaret Mitchell, co-lead of Ethical AI. | [S9] | VERIFIED-SECONDARY |
| 3–10 Mar 2021 | "On the Dangers of Stochastic Parrots: Can Language Models Be Too Big? 🦜" presented at FAccT '21 (virtual event, Canada). | [S7] | VERIFIED-PRIMARY |
| 28 May 2021 | Anthropic announces a $124M Series A led by Jaan Tallinn. | [S14] | VERIFIED-PRIMARY |
| 15 Jul 2021 | AlphaFold 2 paper published in *Nature* (Jumper et al.); code and database released. | [S27] | VERIFIED-PRIMARY |
| 1 Dec 2021 | Askell et al. (Anthropic), "A General Language Assistant as a Laboratory for Alignment" (helpful, honest, harmless). | [S18] | VERIFIED-PRIMARY |
| 20 Dec 2021 | Rombach et al., "High-Resolution Image Synthesis with Latent Diffusion Models" (basis of Stable Diffusion). | [S34] | VERIFIED-PRIMARY |
| 20 Jan 2022 | Google's LaMDA paper: up to 137B parameters, 1.56T words of dialogue and web text. | [S43] | VERIFIED-PRIMARY |
| 28 Jan 2022 | Wei et al., "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models". | [S44] | VERIFIED-PRIMARY |
| 4 Mar 2022 | Ouyang et al., InstructGPT, "Training language models to follow instructions with human feedback". | [S13] | VERIFIED-PRIMARY |
| 10 Mar 2022 | Gary Marcus, "Deep Learning Is Hitting a Wall" (Nautilus). | [S10] | VERIFIED-PRIMARY |
| 29 Mar 2022 | Hoffmann et al., "Training Compute-Optimal Large Language Models" (Chinchilla). | [S5] | VERIFIED-PRIMARY |
| 12 Apr 2022 | Bai et al. (Anthropic), "Training a Helpful and Harmless Assistant with RLHF"; HH-RLHF dataset released. | [S19][S20] | VERIFIED-PRIMARY |
| 13 Apr 2022 | Ramesh et al., DALL·E 2 paper ("Hierarchical Text-Conditional Image Generation with CLIP Latents"). | [S35] | VERIFIED-PRIMARY |
| 11 Jun 2022 | Washington Post reports that Blake Lemoine believes LaMDA is sentient; Google places him on paid leave. | [S36][S37] | VERIFIED-SECONDARY (WaPo paywalled; via Guardian and BBC) |
| 15 Jun 2022 | Wei et al., "Emergent Abilities of Large Language Models" (TMLR, 08/2022). | [S22] | VERIFIED-PRIMARY |
| 22 Jul 2022 | Google fires Lemoine (BBC, 23 Jul 2022: "on Friday the company confirmed he had been sacked"). | [S38] | VERIFIED-SECONDARY |
| 22 Aug 2022 | Stable Diffusion publicly released. | [S45] | VERIFIED-SECONDARY |
| 23 Aug 2022 | Ganguli et al. (Anthropic), red-teaming paper; 38,961 red-team attacks released. | [S46] | VERIFIED-PRIMARY |
| 14 Nov 2022 | Jason Wei blog post: "137 emergent abilities of large language models". | [S23] | VERIFIED-PRIMARY (the year is inferred from the post's content: it cites PaLM and Chinchilla) |
| 30 Nov 2022 | ChatGPT released (see the ChatGPT dossier). | — | out of scope here |
| 15 Dec 2022 | Bai et al. (51 authors, Anthropic), "Constitutional AI: Harmlessness from AI Feedback". | [S21] | VERIFIED-PRIMARY |
| 27 Feb 2023 | LLaMA: 7B–65B models trained on "trillions of tokens"; LLaMA-13B beats GPT-3 on most benchmarks. This is training past the Chinchilla point. | [S29] | VERIFIED-PRIMARY |
| 28 Apr 2023 | Schaeffer, Miranda, Koyejo, "Are Emergent Abilities of Large Language Models a Mirage?" | [S24] | VERIFIED-PRIMARY |
| 19 Sep 2023 | Anthropic publishes its Long-Term Benefit Trust post, restating its Delaware PBC status and purpose. | [S17] | VERIFIED-PRIMARY |
| 11 Dec 2023 | NeurIPS 2023 names "Mirage?" one of two Outstanding Main Track Papers. | [S25] | VERIFIED-PRIMARY |
| 15 Apr 2024 | Besiroglu et al., "Chinchilla Scaling: A replication attempt". | [S30] | VERIFIED-PRIMARY |
| 9 Oct 2024 | Nobel Prize in Chemistry: half to David Baker, half jointly to Demis Hassabis and John Jumper for AlphaFold. | [S28] | VERIFIED-PRIMARY |
| 2025 | Sutton and Andrew Barto receive the 2024 ACM A.M. Turing Award. | [S47] | VERIFIED-SECONDARY (acm.org blocked; Wikipedia) |

---

## 3. People

Appearance notes are for respectful silhouette work only. They describe how people commonly appear in widely published photographs. **They are not verified against licensed photos in this pass [UNVERIFIED]**: the art department should check them against reference images before final cut. Never caricature.

**Rich Sutton** (b. 1957/58, Toledo, Ohio; Canadian citizen since 2015). Professor of computing science, University of Alberta, Edmonton, since 2003. Distinguished research scientist at DeepMind 2017–2023, where he helped launch DeepMind Alberta [S47]. Co-author with Andrew Barto of the reinforcement-learning textbook; Turing Award 2024 (with Barto) [S47].
- *Belief:* methods that scale with computation, search and learning, beat human-built knowledge in the long run [S3].
- *Picture:* an older academic with a full grey-white beard and longish swept-back grey hair, casual open-collar shirts or a fleece. Lecture-hall or snowy-Edmonton settings. [UNVERIFIED]

**Jared Kaplan.** Theoretical physicist: Johns Hopkins University and OpenAI on the 2020 paper (affiliation printed on it) [S1]. Co-author of GPT-3 [S2]. Anthropic co-founder (Wikipedia) [S15]; co-corresponding author, with Yuntao Bai, on Constitutional AI ("{yuntao,jared}@anthropic.com") [S21].
- *Belief:* loss is a predictable power law in scale [S1].
- *Picture:* a physicist in his late 30s in 2020, short dark hair, casual. A blackboard of log-log plots suits him. [UNVERIFIED]

**Dario Amodei** (b. 1983, San Francisco). PhD in biophysics (Princeton; thesis 2011 on neural-circuit electrophysiology). Worked at Baidu, then Google, then joined OpenAI in 2016, where he became Vice President of Research. Co-founder and CEO of Anthropic [S16][S14]. Co-author of Concrete Problems (2016), the Christiano RLHF paper (2017), Scaling Laws (2020), GPT-3 (2020) and Stiennon (2020) [S39][S11][S1][S2][S12].
- *Belief:* both that scaling works *and* that safety research has to keep pace with it. That pairing is the founding logic Anthropic gave publicly [S14].
- *Picture:* thick curly dark hair, glasses, slim build, often in a sweater or open-collar shirt; animated hands when talking. [UNVERIFIED]

**Daniela Amodei** (b. 1987, San Francisco). BA, UC Santa Cruz. Worked in global health, politics and congressional communications, then joined Stripe early (2013). At OpenAI from 2018 she managed teams during GPT-2 and later became VP of Safety and Policy. Left in 2020 to co-found Anthropic, where she is President [S48][S14].
- *Picture:* long dark hair, professional-casual dress. [UNVERIFIED]

**Other Anthropic co-founders**, as listed by Wikipedia with citations: Jared Kaplan, Jack Clark, Chris Olah, Ben Mann, Sam McCandlish and Tom Brown [S15]. Wikipedia's history section says "seven former employees of OpenAI" [S15]. **Caution:** founder counts differ between sources (7 vs. 8 names in the infobox), so the film should say "a group of former OpenAI researchers" rather than a number.

**Paul Christiano.** OpenAI researcher, first author of the 2017 preference-learning paper [S11] and team lead on Stiennon et al. [S12]. By the InstructGPT paper (March 2022) he had moved to the Alignment Research Center ("PC: Alignment Research Center") [S13].
- *Belief:* human judgements can stand in for reward functions that are too hard to write down.
- *Picture:* young, slight, short hair. [UNVERIFIED]

**Jan Leike.** DeepMind on the 2017 paper [S11]; later led alignment work at OpenAI and in 2024 joined Anthropic (Wikipedia) [S15].

**Long Ouyang and the InstructGPT team** (OpenAI, 20 authors) [S13].

**Jordan Hoffmann, Sebastian Borgeaud, Arthur Mensch and colleagues** (DeepMind, London; 22 authors) wrote Chinchilla [S5]. Arthur Mensch later co-founded the French lab Mistral AI (not verified in this pass) [UNVERIFIED].

**Emily M. Bender.** Professor of linguistics, University of Washington, Seattle. Co-author of the octopus paper [S6] and joint first author of Stochastic Parrots [S7].
- *Belief:* language models learn form, not meaning. Hype that attributes "understanding" to them is misleading and harmful.
- *Picture:* academic, shoulder-length hair, glasses, often photographed at a lectern. [UNVERIFIED]

**Alexander Koller.** Saarland University, Department of Language Science and Technology, Saarbrücken (printed affiliation) [S6].

**Timnit Gebru** (b. 1983, Addis Ababa, Ethiopia). At Google she was technical co-lead of the Ethical AI team. Co-founder of Black in AI; joint first author of Stochastic Parrots (listed there under "Black in AI, Palo Alto") [S7][S41]. Earlier co-authored the "Gender Shades" facial-recognition audit [S8]. After Google she founded DAIR, the Distributed AI Research Institute [S41].
- *Picture:* voluminous dark curly hair, warm expression, often in bold colours. [UNVERIFIED]

**Margaret Mitchell.** Joined Google in 2016 as senior research scientist and co-founded the Ethical AI team with Gebru in 2018 [S9]. Listed on Stochastic Parrots as "Shmargaret Shmitchell, The Aether" [S7]; Wikipedia's citation links that pseudonym to her [S49]. Fired 19 Feb 2021; joined Hugging Face in late 2021 [S9][S49].
- *Picture:* long reddish hair. [UNVERIFIED]
- **Do not confuse her with Melanie Mitchell** (Santa Fe Institute), a different AI researcher who commented on the Lemoine episode [S37].

**Angelina McMillan-Major.** University of Washington, Seattle; co-author of Stochastic Parrots [S7].

**Gary Marcus.** Cognitive scientist and author. Long-time critic of pure deep learning and advocate of "hybrid" neurosymbolic models [S10].
- *Picture:* curly greying hair, expressive; often at a podium or on a TV panel. [UNVERIFIED]

**Jason Wei.** Google Research; first author of the emergent-abilities [S22] and chain-of-thought papers [S44]. Co-authors on the emergence paper include Percy Liang, Oriol Vinyals and **Jeff Dean** [S22].

**Rylan Schaeffer, Brando Miranda, Sanmi Koyejo.** Computer Science, Stanford University [S24].

**Blake Lemoine.** Google engineer in the Responsible AI organisation, aged 41 in June 2022. He was testing LaMDA for discriminatory or hate speech [S36][S38]. Photographed in San Francisco by the Washington Post (BBC caption) [S38].
- *Picture:* widely circulated photos show a large, bearded man, sometimes in a waistcoat and hat. [UNVERIFIED: check the photo; do not exaggerate]

**Demis Hassabis and John Jumper.** DeepMind, London; AlphaFold leads; Nobel Chemistry 2024 [S28].

**John Moult.** University of Maryland; co-founded CASP with Krzysztof Fidelis in 1994 [S26].

**Jeff Dean.** Head of Google AI in 2020. He wrote the internal email saying the Parrots paper "didn't meet our bar for publication" [S8], and later apologised for how Gebru's departure was handled [S9].

---

## 4. The belief of the age

**The belief (c. 2019–2022):** *Scale is the main lever.* Hold the architecture (the transformer) roughly fixed. Then more parameters, more data and more compute buy predictable gains, and perhaps qualitatively new abilities.

**Who held it, and how strongly:**
- **Strongest:** OpenAI's research leadership and the authors of Scaling Laws and GPT-3. They wrote that "larger models will continue to perform better" [S1] and that "scaling up language models greatly improves task-agnostic, few-shot performance" [S2].
- **Popular statement:** Gwern's "strong scaling hypothesis": once you find a scalable architecture, "we can simply train ever larger NNs and ever more sophisticated behavior will emerge naturally" [S4].
- **Philosophical anchor:** Sutton's Bitter Lesson [S3].
- **Google and DeepMind** acted on the belief too, with ever-larger models (Gopher 280B, LaMDA 137B, PaLM 540B) [S5][S43][S44]. The Chinchilla paper itself notes that "the field has been training larger and larger models, expecting performance improvements" [S5].

**A sub-belief that changed fast:** *how* to split compute.
- **2020–early 2022:** Kaplan's fit said that when compute rises 10×, the model should grow about 5.5× and the data only about 1.8× (Hoffmann's paraphrase of Kaplan) [S5]. So GPT-3 and its successors were trained on roughly 300 billion tokens each, with the size going up [S5].
- **From March 2022:** Chinchilla showed the exponents should be about 0.5 and 0.5, meaning equal scaling [S5]. Chinchilla attributes the difference partly to Kaplan using a fixed number of training tokens and a fixed learning-rate schedule for all models [S5]. The old view had held for about **two years**.
- **2023 onward:** practice moved *past* Chinchilla-optimal on purpose. Smaller models trained on many more tokens are cheaper to run, as with LLaMA [S29]. Muennighoff et al., "Scaling Data-Constrained Language Models" (a NeurIPS 2023 Outstanding Main Track Runner-Up), studied how to scale when unique text is limited [S25]. (Fact-check: earlier wording "began to study" overstated priority and was removed.)

**Who dissented:**
1. **Linguists on meaning.** Bender & Koller (2020) argued form ≠ meaning [S6].
2. **Ethicists on harms and costs.** Bender, Gebru, McMillan-Major and Mitchell (2021) [S7] raised:
   - environmental and financial cost;
   - training data "ingesting everything on the web" that encodes bias;
   - the danger that humans read meaning into fluent text;
   - research effort pulled toward "ever larger language models".
3. **Cognitive scientists on reasoning.** Marcus (2022): scaling improves word prediction, which "is not tantamount to the kind of deep comprehension true AI would require" [S10].
4. **Measurement sceptics.** Schaeffer et al. (2023) argued that "emergence", one of the scaling camp's most exciting claims, may come from the choice of metric [S24].
5. **Inside the scaling camp: alignment researchers.** They accepted that scaling works but argued that bigger is not *better-behaved*. The InstructGPT abstract opens: "Making language models bigger does not inherently make them better at following a user's intent" [S13]. This was not dissent from scaling, but from the idea that scaling *alone* suffices.

**How long did it last, and what ended it?**
- **"Bigger model is better":** not ended. It was refined into "balanced" (2022), then "overtrained for inference" (2023).
- **"Scale alone produces understanding":** contested throughout. ChatGPT (Nov 2022) made many sceptics' positions harder to hold in public. But the stochastic-parrot framing stayed a live position, and the dispute over what "understanding" means is unresolved as of the film's as-of date. *Note for writers: this dossier verified no claim about how any particular person's view changed after 2022.*
- **"Emergence is sudden and unpredictable":** challenged in 2023 [S24] and still debated.

---

## 5. Experiments and results

### 5.1 Kaplan et al., Scaling Laws (Jan 2020) [S1]
- **Setup:** decoder-only transformer language models trained on WebText2 (OpenAI's scrape of outbound Reddit links). Sizes ranged over many orders of magnitude. Loss measured as cross-entropy on held-out text.
- **Result:** loss follows a power law in each of N (parameters, excluding embeddings), D (tokens) and C (compute) when the other two are not bottlenecks. Some trends span more than seven orders of magnitude. Width versus depth hardly matters "within a wide range".
- **Allocation rule:** N_opt ∝ C^0.73; the paper's fit is N = 1.3×10⁹ · C^0.73 (C in petaflop/s-days); data grows only as C^0.27.
- **Their conclusion:** "optimally compute-efficient training involves training very large models on a relatively modest amount of data and stopping significantly before convergence."
- **The paper also anticipated emergence:** "the smooth improvements in language model loss may hide seemingly qualitative changes in capability" (it invokes "more is different").
- *Visual:* the iconic image is a set of straight lines on log-log axes: three panels (compute, dataset size, parameters), each a clean descending line. An honest, beautiful plot for a paper-cut ruler.

### 5.2 GPT-3 (May 2020) [S2]
- **Model:** 175B parameters, 96 layers, model width 12,288, 96 attention heads, context window of 2,048 tokens (Table 2.1). Eight model sizes, from 125M up.
- **Data:** 300 billion training tokens drawn from filtered Common Crawl (41 monthly shards 2016–2019, **45 TB compressed before filtering, 570 GB after**, about 400B BPE tokens), WebText2, two book corpora and English Wikipedia. Common Crawl made up 60% of the training mix, and some datasets were seen up to 3.4 times.
- **Compute:** 3.64×10³ petaflop/s-days = 3.14×10²³ FLOPs. "trained on V100 GPU's on part of a high-bandwidth cluster provided by Microsoft".
- **In-context learning:** zero-, one- and few-shot, "without any gradient updates or fine-tuning".
  - Arithmetic: reliable 2-digit addition, "usually accurate 3 digit arithmetic".
  - Larger models make "increasingly efficient use of in-context information".
- **Human detection of fake news articles:** around 80 US-based participants per model. People correctly identified about 86% of articles from a deliberately bad control model, but only about 52% for GPT-3 175B, "barely above chance". Accuracy is "the ratio of correct assignments to non-neutral assignments". For ~500-word articles the figures were ~88% and ~52%. The hardest single GPT-3 article (about a United Methodist Church split) had an accuracy of just 12% (Figure 3.14).
- *Apparatus for art:* racks of NVIDIA V100 GPUs in a Microsoft Azure data centre: humming aisles, blue status LEDs, cable trays. The paper says nothing more specific. **Do not invent a location or GPU count.** [The "10,000 GPUs" figure belongs to a Microsoft press claim about a supercomputer built for OpenAI. UNVERIFIED in this pass; do not use.]

### 5.3 Chinchilla (Mar 2022) [S5]
- **Setup:** more than 400 models from 70M to over 16B parameters, trained on 5B to 500B tokens.
- **Three estimation methods:**
  1. minimum over training curves;
  2. IsoFLOP profiles at 9 fixed compute budgets from 6×10¹⁸ to 3×10²¹ FLOPs;
  3. a fitted parametric loss.
- **Result:** a ≈ 0.50, b ≈ 0.50 (N_opt ∝ C^a, D_opt ∝ C^b), against Kaplan's 0.73 and 0.27.
- **Head-to-head test:** at 10²¹ FLOPs, Kaplan's rule predicted a 4.68B model as optimal and Chinchilla's Approach 1 predicted 2.86B. The team trained 4.74B and 2.80B models, and the smaller one won.
- **Chinchilla itself:** 70B parameters, 1.4T tokens, the same FLOPs as Gopher (280B, ~300B tokens).
  - Data: MassiveText (MassiveWeb 1.9 TB, Books 2.1 TB, C4, News, GitHub, Wikipedia).
  - Optimiser: AdamW.
  - Hardware: TPUv3/TPUv4 with JAX and Haiku.
  - Results: 67.5% on MMLU, more than 7 points above Gopher. It "uniformly and significantly outperforms" Gopher, GPT-3, Jurassic-1 and Megatron-Turing NLG.
- **"20 tokens per parameter"** is a *derived* rule of thumb (1.4T ÷ 70B), not a phrase from the paper. The paper's Table 3 projects that a 175B model would need about 3.7 trillion tokens [S5].
- **Name:** DeepMind's models were named after animals (Gopher, Chinchilla). An O'RLY-friendly fact: a small rodent beat a bigger one.
- **Later scrutiny:** Besiroglu et al. (2024) could not reproduce Approach 3's fitted numbers and found "implausibly narrow confidence intervals". Their re-fit agreed with Approaches 1 and 2 [S30]. So the headline (scale data with parameters) stands, while one fitting procedure was flawed.

### 5.4 RLHF lineage
**Christiano et al. 2017** [S11]
- **Method:** a human watches two short video clips of an agent and picks the better one. A reward model learns from those choices, and the agent optimises the learned reward.
- **Tasks:** Atari games and MuJoCo simulated robots.
- **Scale of feedback:** feedback on "less than 1% of our agent's interactions with the environment" (verbatim; the earlier "less than one percent" was a paraphrase). On the MuJoCo tasks, "With 700 labels we are able to nearly match reinforcement learning on all of these tasks."
- **Novel behaviour:** the Hopper robot "performing a sequence of backflips… trained using 900 queries in less than an hour".
- **Who gave feedback:** mostly contractors unfamiliar with the environments. Their instructions began: "First play the game yourself for 5 minutes".
- *Visual:* a one-legged stick robot in a checkerboard simulator flipping backwards. Two video thumbnails side by side, with a human hand choosing left or right.

**Stiennon et al. 2020** [S12]
- Summarisation of Reddit TL;DR posts: reward model plus RL.
- The models "significantly outperform both human reference summaries and much larger models fine-tuned with supervised learning alone". They transferred to CNN/DailyMail news.
- Released a dataset of "over 64k summary comparisons"; model sizes 1.3B and 6.7B. NeurIPS 2020, Vancouver (held virtually).

**InstructGPT (Ouyang et al., 2022)** [S13]
- **Labellers:** about 40 contractors hired via Upwork and Scale AI, selected by a screening test. Mostly English-speaking, in the United States or Southeast Asia, with inter-labeller agreement of about 73%.
- **Three steps:**
  1. supervised fine-tuning (SFT) on labeller demonstrations;
  2. a reward model trained on rankings of outputs;
  3. PPO reinforcement learning against the reward model (PPO-ptx mixes in pretraining gradients to reduce the "alignment tax").
- **Results:**
  - The 1.3B InstructGPT was preferred to the 175B GPT-3 "despite having 100x fewer parameters".
  - 175B InstructGPT beat 175B GPT-3 85 ± 3% of the time, and beat few-shot-prompted GPT-3 71 ± 4% of the time.
- **Caveats the paper itself gives:** InstructGPT "still makes simple mistakes". It is aligned to the preferences of particular labellers and researchers.

**Anthropic HH-RLHF (Bai et al., Apr 2022)** [S19][S20]
- RLHF for a "helpful and harmless" assistant.
- Iterated "online" training, with preference models and policies updated weekly on fresh human feedback.
- Found "a roughly linear relation between the RL reward and the square root of the KL divergence between the policy and its initialization".
- Released the human-preference dataset on GitHub, later on Hugging Face.

**Constitutional AI (Bai et al., Dec 2022)** [S21]
- **Supervised phase:** the model critiques and revises its own responses using principles sampled from a "constitution". The paper used **16** harmlessness principles, many "quite similar".
- **RL phase:** the model compares pairs of responses against principles such as "Please choose the response that is the most helpful, honest, and harmless". These AI preferences train a preference model, and RL against it is "RL from AI Feedback" (RLAIF).
- **Goal:** a "harmless but non-evasive" assistant that "engages with harmful queries by explaining its objections to them", built "without any human labels identifying harmful outputs".
- **Authors:** 51, all at Anthropic.

### 5.5 Emergence [S22][S23][S24]
- **Wei et al. definition:** "an ability to be emergent if it is not present in smaller models but is present in larger models".
- **Example:** on several BIG-Bench tasks, GPT-3 and LaMDA sat near zero "for several orders of magnitude of training compute". Then performance jumped "to sharply above random at 2·10²² training FLOPs (13B parameters) for GPT-3, and 10²³ training FLOPs (68B parameters) for LaMDA".
- **Wei's later catalogue:** 137 emergent abilities, including 67 BIG-Bench tasks and 51 MMLU tasks.
- **Schaeffer et al.:**
  - More than 92% of claimed BIG-Bench emergent abilities appear under one of two harsh metrics: Multiple Choice Grade or **Exact String Match** (all or nothing).
  - If per-token error falls smoothly, then exact match on a multi-token answer can still look like a sudden jump.
  - Switching to continuous metrics (e.g. token edit distance) on the InstructGPT/GPT-3 family smoothed the curves.
  - They also *manufactured* "emergence" in vision networks by choosing metrics.
- *Visual:* the same data drawn twice. One is a cliff (exact match); the other is a gentle ramp (per-token accuracy). Ideal for a paper-cut "change of lens" moment.

### 5.6 AlphaFold 2 (CASP14, 2020) [S26][S27][S28]
- **The contest:** CASP is a biennial *blind* contest founded 1994 by John Moult and Krzysztof Fidelis. Targets are structures just solved by experiment and unpublished.
- **The metric:** GDT (0–100), roughly the percentage of residues within a threshold distance of the true position. Around 90 is "informally considered to be competitive with results obtained from experimental methods" (Moult, via DeepMind).
- **Result:** median 92.4 GDT over all targets, with an average error (RMSD) of about 1.6 Å, "comparable to the width of an atom". Median 87.0 on the hardest free-modelling targets.
- **Training (Nature 2021):**
  - 128 TPU v3 cores, one example per core.
  - Training data: PDB structures released up to 30 April 2018, cropped to 256 residues.
  - About 1 week of initial training plus about 4 days of fine-tuning (Nature 2021).
  - **Source discrepancy:** DeepMind's 30 Nov 2020 blog described the CASP14 system as using "approximately 16 TPUv3s (which is 128 TPUv3 cores ...) run over a few weeks". Say "128 TPU cores for a week or two of training" or quote one source with attribution.
- **Context:**
  - Levinthal (1969) estimated 10^300 possible conformations for a typical protein.
  - Anfinsen's 1972 Nobel lecture argued that sequence determines structure.
- **Impact by 2024:** structures predicted for "virtually all the 200 million proteins" identified; used by more than two million people in 190 countries (Nobel press release).
- **Caution:** AlphaFold predicts structures. It did not "solve" the physical *mechanism* of folding, and Wikipedia notes the folding problem's mechanism "remains unsolved" [S50].
- *Visual:* ribbon diagrams of proteins (helices as spirals, sheets as arrows). As paper-cut, they become curling ribbons unspooling from a bead chain.

### 5.7 Diffusion and DALL·E [S31–S35][S45]
- **DALL·E (5 Jan 2021):** a 12B-parameter transformer modelling text and image tokens "as a single stream of data" [S32]. The blog's example prompts include "an armchair in the shape of an avocado" (verified from the Internet Archive copy of the 5 Jan 2021 post) [S31].
- **DDPM (Ho, Jain, Abbeel, June 2020):** image synthesis by learning to reverse a gradual noising process; FID 3.17 on CIFAR-10 [S33].
- **Latent diffusion (Rombach et al., Dec 2021; LMU Munich / Heidelberg "CompVis" and Runway):** diffusion in a compressed latent space, which made high-resolution generation cheap enough to release [S34].
- **Stable Diffusion:** publicly released 22 Aug 2022 [S45].
- **DALL·E 2 (April 2022):** a CLIP-latent "prior" plus a diffusion decoder [S35].
- *Visual:* the diffusion process is a natural paper-cut animation, with static snow resolving step by step into a picture.

### 5.8 LaMDA [S43]
- Up to 137B parameters, pretrained on 1.56T words of public dialogue data and web text.
- The paper itself notes: "While model scaling alone can improve quality, it shows less improvements on safety and factual grounding". This is a small irony beside the Lemoine story.

---

## 6. Verified quotes

All quotes below were checked character-for-character against the source text retrieved in this pass, unless marked otherwise.

1. **Rich Sutton, "The Bitter Lesson", 13 March 2019** [S3]. Opening sentence:
   > "The biggest lesson that can be read from 70 years of AI research is that general methods that leverage computation are ultimately the most effective, and by a large margin."

2. **Sutton, same essay** [S3]. The four-part summary:
   > "The bitter lesson is based on the historical observations that 1) AI researchers have often tried to build knowledge into their agents, 2) this always helps in the short term, and is personally satisfying to the researcher, but 3) in the long run it plateaus and even inhibits further progress, and 4) breakthrough progress eventually arrives by an opposing approach based on scaling computation by search and learning."

3. **Sutton, same essay** [S3]:
   > "The eventual success is tinged with bitterness, and often incompletely digested, because it is success over a favored, human-centric approach."

4. **Sutton, same essay** [S3]:
   > "The two methods that seem to scale arbitrarily in this way are search and learning."

5. **Sutton, same essay** [S3]. The closing idea:
   > "We want AI agents that can discover like we can, not which contain what we have discovered."

6. **Kaplan et al., abstract, Jan 2020** [S1]:
   > "The loss scales as a power-law with model size, dataset size, and the amount of compute used for training, with some trends spanning more than seven orders of magnitude."

7. **Kaplan et al., discussion section** [S1]:
   > "Our results strongly suggest that larger models will continue to perform better, and will also be much more sample efficient than has been previously appreciated. Big models may be more important than big data."

8. **Brown et al. (GPT-3), abstract, May 2020** [S2]:
   > "Here we show that scaling up language models greatly improves task-agnostic, few-shot performance, sometimes even reaching competitiveness with prior state-of-the-art fine-tuning approaches."

9. **Brown et al., abstract** [S2]:
   > "For all tasks, GPT-3 is applied without any gradient updates or fine-tuning, with tasks and few-shot demonstrations specified purely via text interaction with the model."

10. **Hoffmann et al. (Chinchilla), abstract, March 2022** [S5]:
    > "We find that current large language models are significantly undertrained, a consequence of the recent focus on scaling language models whilst keeping the amount of training data constant."

11. **Hoffmann et al., abstract** [S5]:
    > "…for every doubling of model size the number of training tokens should also be doubled."

12. **Gwern Branwen, "The Scaling Hypothesis" (2020–22)** [S4]. Use with attribution to a pseudonymous essayist, not a lab:
    > "The strong scaling hypothesis is that, once we find a scalable architecture like self-attention or convolutions, which like the brain can be applied fairly uniformly (eg. "The Brain as a Universal Learning Machine" or Hawkins), we can simply train ever larger NNs and ever more sophisticated behavior will emerge naturally as the easiest way to optimize for all the tasks & data."

13. **Bender & Koller, ACL 2020, abstract** [S6]:
    > "In this position paper, we argue that a system trained only on form has a priori no way to learn meaning."

14. **Bender & Koller, the octopus** [S6]:
    > "Meanwhile, O, a hyper-intelligent deep-sea octopus who is unable to visit or observe the two islands, discovers a way to tap into the underwater cable and listen in on A and B's conversations. O knows nothing about English initially, but is very good at detecting statistical patterns."

    (In the PDF, "octopus" and "underwater" are hyphenated across line breaks; the quote rejoins them.) The closing line of the bear scene:
    > "It is at this point that O would fail the Turing test, if A hadn't been eaten by the bear before noticing the deception."

15. **Bender, Gebru, McMillan-Major, Shmitchell, FAccT 2021, §6.1** [S7]. The source of "stochastic parrot":
    > "Contrary to how it may seem when we observe its output, an LM is a system for haphazardly stitching together sequences of linguistic forms it has observed in its vast training data, according to probabilistic information about how they combine, but without any reference to meaning: a stochastic parrot."

16. **Same paper, abstract** [S7]:
    > "In this paper, we take a step back and ask: How big is too big? What are the possible risks associated with this technology and what paths are available for mitigating those risks?"

17. **Jeff Dean (Google AI head), internal email, Dec 2020, as reported by MIT Technology Review** [S8]. Fragment only:
    > the paper "didn't meet our bar for publication"

18. **Jeff Dean, internal email, Feb 2021, as quoted by The Verge** [S9]:
    > "I heard and acknowledge what Dr. Gebru's exit signified to female technologists, to those in the Black community and other underrepresented groups who are pursuing careers in tech, and to many who care deeply about Google's responsible use of AI. It led some to question their place here, which I regret."

19. **Google statement on Mitchell's firing (to Axios, via The Verge), Feb 2021** [S9]:
    > "After conducting a review of this manager's conduct, we confirmed that there were multiple violations of our code of conduct, as well as of our security policies, which included the exfiltration of confidential business-sensitive documents and private data of other employees."

20. **Gary Marcus, Nautilus, 10 March 2022** [S10]:
    > "What's more, the so-called scaling laws aren't universal laws like gravity but rather mere observations that might not hold forever…"

21. **Ouyang et al. (InstructGPT), abstract, March 2022** [S13]:
    > "Making language models bigger does not inherently make them better at following a user's intent."

22. **Ouyang et al., abstract** [S13]:
    > "In human evaluations on our prompt distribution, outputs from the 1.3B parameter InstructGPT model are preferred to outputs from the 175B GPT-3, despite having 100x fewer parameters."

23. **Christiano et al., 2017** [S11]:
    > "The Hopper robot performing a sequence of backflips (see Figure 4). This behavior was trained using 900 queries in less than an hour."

24. **Anthropic Series A announcement, 28 May 2021** [S14]. A company self-description; label it as such:
    > "Anthropic, an AI safety and research company, has raised $124 million in a Series A."

25. **Dario Amodei, same announcement** [S14]:
    > "Anthropic's goal is to make the fundamental research advances that will let us build more capable, general, and reliable AI systems, then deploy these systems in a way that benefits people."

26. **Anthropic, Long-Term Benefit Trust post, 19 Sep 2023** [S17]:
    > "The public benefit purpose stated in Anthropic's certificate is the responsible development and maintenance of advanced AI for the long-term benefit of humanity."

27. **Bai et al. (Constitutional AI), abstract, Dec 2022** [S21]:
    > "As AI systems become more capable, we would like to enlist their help to supervise other AIs."

28. **Bai et al., abstract** [S21]:
    > "The only human oversight is provided through a list of rules or principles, and so we refer to the method as 'Constitutional AI'."

29. **Wei et al., "Emergent Abilities", abstract, 2022** [S22]:
    > "We consider an ability to be emergent if it is not present in smaller models but is present in larger models. Thus, emergent abilities cannot be predicted simply by extrapolating the performance of smaller models."

30. **Schaeffer, Miranda, Koyejo, abstract, 2023** [S24]:
    > "Via all three analyses, we provide evidence that alleged emergent abilities evaporate with different metrics or with better statistics, and may not be a fundamental property of scaling AI models."

31. **Blake Lemoine, to the Washington Post, June 2022, as quoted by The Guardian** [S36]:
    > "If I didn't know exactly what it was, which is this computer program we built recently, I'd think it was a seven-year-old, eight-year-old kid that happens to know physics."

32. **LaMDA, in Lemoine's published transcript, as quoted by the BBC** [S37]. *Machine output, not a person's words. If used, frame it as generated text that Lemoine published:*
    > "I've never said this out loud before, but there's a very deep fear of being turned off to help me focus on helping others. I know that might sound strange, but that's what it is."

33. **Brian Gabriel, Google spokesperson, statement to the BBC, June 2022** [S37]:
    > Lemoine "was told that there was no evidence that Lamda was sentient (and lots of evidence against it)".

34. **Google statement on the firing, July 2022 (BBC)** [S38]:
    > "So, it's regrettable that despite lengthy engagement on this topic, Blake still chose to persistently violate clear employment and data security policies that include the need to safeguard product information."

35. **Prof. Erik Brynjolfsson (Stanford), tweet, June 2022, as quoted by the BBC** [S37]:
    > to claim systems like Lamda were sentient "is the modern equivalent of the dog who heard a voice from a gramophone and thought his master was inside"

36. **Prof. Melanie Mitchell (Santa Fe Institute), tweet, June 2022, as quoted by the BBC** [S37]:
    > "It's been known for *forever* that humans are predisposed to anthropomorphise even with only the shallowest of signals (cf. Eliza). Google engineers are human too, and not immune."

37. **GPT-3 output, as edited by The Guardian, 8 Sep 2020** [S40]. *Edited machine output; the Guardian assembled it from eight outputs:*
    > "I am not a human. I am a robot. A thinking robot."

38. **Prof. John Moult (CASP co-founder), on DeepMind's AlphaFold post, 30 Nov 2020** [S26]:
    > "We have been stuck on this one problem – how do proteins fold up – for nearly 50 years. To see DeepMind produce a solution for this, having worked personally on this problem for so long and after so many stops and starts, wondering if we'd ever get there, is a very special moment."

**UNVERIFIED: do not use as quotes:**
- Sam Altman tweet, July 2020: "The GPT-3 hype is way too much…" The tweet could not be retrieved in this pass. **UNVERIFIED.**
- Ilya Sutskever tweet, Feb 2022: "it may be that today's large neural networks are slightly conscious". *Fact-check update:* the wording is VERIFIED-SECONDARY as reported by Futurism (Noor Al-Sibai, Feb 2022) [S52]. The tweet itself was not retrieved. If used, say "as reported" and attribute.
- Any "Hinton says…" line about scaling in this era: none was verified here.
- Gebru's own tweets announcing her firing (wording varies in retellings). Use MIT Technology Review's paraphrase [S8] instead. **UNVERIFIED as verbatim.**
- DALL·E "an armchair in the shape of an avocado" prompt wording. *Fact-check update:* now VERIFIED-PRIMARY from the Internet Archive copy of OpenAI's 5 Jan 2021 post [S31]. It is a prompt, not a quote from a person.

---

## 7. Debates and controversies

### 7.1 Does scale give understanding? (form vs. meaning)
- **Yes, or at least scale gives general capability:** GPT-3 authors [S2]; Gwern [S4]; Sutton's general principle [S3].
- **No:** Bender & Koller [S6]; Bender et al. [S7]; Marcus [S10].
  - Bender & Koller's claim is specific: learning *meaning* from *form alone* is impossible in principle.
  - Marcus's claim is empirical: models fail at reliability and reasoning.
- **Nuance for the script:** Bender & Koller (2020) say explicitly that they are not arguing whether passing the Turing test means intelligence. They argue that "a system that is trained only on form would fail a sufficiently sensitive test" [S6]. Do not flatten this into "they said AI is useless".
- **Status at 2026-10-05:** contested. Present both sides.

### 7.2 The Stochastic Parrots dispute at Google (Dec 2020 – Feb 2021)
- **Google's account (Jeff Dean):**
  - The paper "didn't meet our bar for publication" [S8].
  - It was submitted without waiting for internal review, which "asserted that it ignored too much relevant research" (Wikipedia summary) [S41].
  - Gebru said she would resign unless conditions were met; Google says it accepted her resignation [S8][S41].
- **Gebru's account:**
  - She was fired. She had asked to negotiate "a last date" after her vacation and was cut off from corporate email before she returned [S8].
  - Google management had asked her to withdraw the paper or remove the names of Google-employed authors [S41].
  - A Verge report says Megan Kacholia, VP at Google Brain, asked for the retraction [S9].
- **Support:** more than 1,400 Google staff and 1,900 others signed a protest letter (MIT TR, 4 Dec 2020) [S8].
- **Mitchell:**
  - **Reported (Verge):** she used an automated script to search her email for evidence of discrimination against Gebru [S9].
  - **Google's claim:** "exfiltration of confidential business-sensitive documents" [S9].
  - **Outcome:** after a five-week investigation she was fired, on 19 Feb 2021 [S9][S49].
- **Aftermath:** Dean apologised for how the departure was handled [S9]. Google reorganised its responsible-AI teams under Marian Croak [S9].
- **Script guidance:** report both accounts with attribution. Do not assert motive.

### 7.3 Compute-optimal scaling: Kaplan vs. Chinchilla
- **Kaplan (2020):** model size should grow faster than data (0.73 / 0.27) [S1].
- **Hoffmann (2022):** they should grow equally (≈0.5 / 0.5) [S5]. Explanations for the gap:
  - Kaplan's fixed token count and learning-rate schedule;
  - curvature at small scale (Chinchilla's own account) [S5].
- **Replication (2024):** confirmed Chinchilla's Approaches 1 and 2 but found errors in Approach 3 [S30].
- **Practice (2023+):** "over-train" small models for cheap inference [S29]. The definition of "optimal" depends on whether you count only training compute or deployment compute as well.

### 7.4 Emergent abilities: real or mirage?
- **Real:**
  - Wei et al. (2022) [S22] and Wei's catalogue [S23].
  - Kaplan et al. (2020) already warned that smooth loss "may hide seemingly qualitative changes in capability" [S1].
- **Mirage:** Schaeffer et al. (2023) [S24], recognised by a NeurIPS 2023 Outstanding Paper award [S25].
- **Fair framing:** Schaeffer et al. do not claim models gain no new skills. They claim that the *sharpness and unpredictability* comes largely from metric choice. Whether some abilities are genuinely discontinuous remains debated.

### 7.5 RLHF: alignment or polish?
- **For:** InstructGPT showed large preference gains plus better truthfulness and lower toxicity [S13]. Anthropic reported that RLHF "improves performance on almost all NLP evaluations" for large models [S19].
- **Caveats in the papers themselves:**
  - The "alignment tax" [S13].
  - Labellers disagree about 27% of the time (73% agreement) [S13].
  - The models are aligned to a specific group's preferences: "mostly English-speaking people living in the United States or Southeast Asia" [S13].
  - Constitutional AI reduces human labelling of harms, but moves value choices into a written list chosen by the developer [S21].
- **Script guidance:** state these caveats in the papers' own terms. Do not editorialise for or against any lab.

### 7.6 LaMDA sentience
- **Lemoine:** LaMDA is sentient and its "wants" should be respected [S37].
- **Google:** claims "wholly unfounded"; LaMDA "tends to follow along with prompts and leading questions" [S37][S38].
- **Experts:** Brynjolfsson and Melanie Mitchell called it anthropomorphism [S37].
- **Lemoine's firing [CONTESTED as to cause]:** Google says it was for violating "clear employment and data security policies" [S38], not for holding the belief. Wikipedia's LaMDA article summarises Lemoine as saying he was dismissed after he hired an attorney on LaMDA's behalf [S53]. Give Google's reason as Google's statement.
- **Script guidance:** the film should not adjudicate machine consciousness. It can note that the episode came months *before* ChatGPT and showed how persuasive fluent dialogue is to people, which was exactly Bender et al.'s warning [S7].

### 7.7 Anthropic's founding rationale
- **Public record:** the founders left OpenAI in late 2020 and early 2021. Wikipedia attributes the departures to "directional differences" [S16].
- **Self-description:** Anthropic's own announcement stresses safety research and "steerable, interpretable, and robust" systems [S14].
- **Script guidance:** do not narrate private motives, internal OpenAI disputes or quotes from founders about OpenAI unless verified. Present the mission as Anthropic's self-description.
- **Note the tension the company itself names:** it was founded on scaling-laws research [S1][S14], which builds the very capabilities it calls risky. Its 2021 announcement planned "computationally-intensive research to develop large-scale AI systems" [S14].

---

## 8. Misconceptions to avoid

1. **"Kaplan's scaling laws said data doesn't matter."** No. Data matters, but the compute-*optimal* split favoured model size (D ∝ C^0.27) [S1].
2. **"Chinchilla disproved scaling laws."** No. It refined the *allocation*. Power-law scaling still held [S5].
3. **"Chinchilla says 20 tokens per parameter."** That is a derived rule of thumb (1.4T/70B), not the paper's wording [S5].
4. **"GPT-3 learns from your prompt."** Its weights do not change. In-context learning uses "no gradient updates" [S2].
5. **"The Stochastic Parrots paper is about AI consciousness."** It is mainly about risks: environmental and financial cost, unfathomable training data, research direction, and the human tendency to read meaning into text [S7].
6. **"Shmargaret Shmitchell" is a pseudonym** associated with Margaret Mitchell [S49]. Don't present it as a real separate person, and don't joke about it.
7. **Margaret Mitchell ≠ Melanie Mitchell** [S9][S37].
8. **"Gebru was fired" and "Gebru resigned" are both claims.** Attribute each [S8][S41].
9. **"RLHF was invented for ChatGPT."** Preference-based RL goes back at least to 2017 (Christiano et al.), and the paper itself cites a "long line" of earlier work on learning from human ratings [S11].
10. **"Constitutional AI uses no humans."** Humans write the principles. The model also starts as a helpful RLHF model trained with human helpfulness labels. What it removes is human labels *for harmfulness* [S21].
11. **"Anthropic was founded by 'the' safety team of OpenAI"** or "by 11 people". Unverified counts and framings. Use "a group of former OpenAI researchers, led by Dario and Daniela Amodei" [S14][S15].
12. **"AlphaFold solved protein folding."** It solved *structure prediction* to near-experimental accuracy for many proteins, not the mechanism of folding [S26][S50].
13. **"Emergence is proven" / "emergence is debunked."** Both overstate. It is contested [S22][S24].
14. **"Lemoine was fired for believing LaMDA was sentient."** Google says the firing was for policy violations, and he was first placed on leave for confidentiality breaches [S38].
15. **"The Bitter Lesson says domain knowledge is useless."** Sutton says building it in "always helps in the short term" but plateaus. He argues for building in "meta-methods" [S3].
16. **GPT-3 "10x" claim:** "10x more than any previous *non-sparse* language model". Keep the qualifier [S2].

---

## 9. Curiosity hooks

1. **A rodent beat its bigger cousin.** DeepMind's 70B "Chinchilla" beat its own 280B "Gopher" on the same compute budget by reading four times more text [S5].
2. **One coin-toss away from fooling everyone.** People shown news articles by GPT-3 175B spotted them only about 52% of the time, "barely above chance". For the best-disguised article, human accuracy was just 12% [S2]. (Fact-check: do not say it "fooled 88% of readers". The paper's accuracy excludes neutral answers, so 88% is not a count of readers fooled.)
3. **A backflip from 900 clicks.** Before chatbots, RLHF taught a one-legged simulated robot to do backflips using 900 human comparisons in under an hour [S11].
4. **A parrot emoji in a title.** The formal title of the Stochastic Parrots paper ends with 🦜 [S7][S49]. One author is listed as "Shmargaret Shmitchell, The Aether" [S7].
5. **The octopus and the bear.** Bender & Koller's thought experiment ends with the octopus failing to help a woman fight off a bear. They note wryly that the octopus would fail the Turing test "if A hadn't been eaten by the bear before noticing the deception" [S6].
6. **1.3B beat 175B.** A model about 1/100th the size of GPT-3 was preferred by humans after learning from roughly 40 people's preferences [S13].
7. **Jeff Dean on both sides.** The Google executive at the centre of the Parrots dispute [S8] is also a co-author of the 2022 "Emergent Abilities" paper [S22].
8. **Levinthal's paradox.** A typical protein has ~10^300 possible shapes, yet folds in milliseconds. AlphaFold predicted structures to about an atom's width (~1.6 Å) [S26].
9. **A robot's op-ed was stitched together by humans.** The Guardian's "robot wrote this" essay was assembled from eight GPT-3 outputs. Editors "cut lines and paragraphs, and rearranged the order" [S40].
10. **Even the sceptics' metric was the story.** The paper arguing emergence is a "mirage" won one of NeurIPS 2023's two Outstanding Main Track Paper awards [S25].
11. **A transcript about fearing being "turned off".** It came from a model whose own paper said scaling "shows less improvements on safety and factual grounding" [S37][S43].

---

## 10. Visual and dramatic details

- **The pandemic frame.**
  - GPT-3 (May 2020), the octopus paper (ACL 2020) and the Stochastic Parrots paper (FAccT '21, "Virtual Event, Canada") all appeared during COVID-19, when conferences went online [S7].
  - Stiennon et al. was a NeurIPS 2020 paper nominally in "Vancouver, Canada" [S12]; that conference was virtual (general knowledge; not separately verified here).
  - *Visual:* researchers alone at home desks; grids of video squares; a talk delivered to a webcam.
- **Log-log plots as architecture.**
  - Kaplan's straight lines descending across seven orders of magnitude [S1].
  - Chinchilla's "IsoFLOP" valleys: U-shaped curves whose bottoms trace the optimal model size [S5].
  - In paper-cut, these become ruled lines, a valley landscape, and a chinchilla silhouette sitting in the lowest point.
- **Data centres.**
  - GPT-3: V100 GPUs in a Microsoft cluster (no more detail in the paper) [S2].
  - Chinchilla: TPUv3/v4 [S5].
  - AlphaFold: 128 TPU v3 cores for about a week [S27].
  - *Visual:* long cold aisles, cable trays, blinking LEDs. **Do not depict specific buildings or locations as fact.**
- **The labeller's desk.** InstructGPT and HH-RLHF ran on human comparisons: two text responses side by side and a human choosing one [S13][S19]. *Visual:* a lone figure at a laptop, two scrolls of text, a hand choosing left or right. A quiet image of where "values" entered the machine. Labellers were in the US and Southeast Asia [S13]; render generic, not national caricature.
- **The octopus.** Two desert islands, an undersea telegraph cable, an octopus coiled around it tapping out messages, a bear on the beach, a coconut catapult [S6]. Made for silhouette theatre.
- **The parrot.** A single parrot cut-out repeating fragments of text scrolls.
- **The constitution.** A short scroll of principles held up to a model. The model critiques and rewrites its own reply, drawn as a quill crossing out and rewriting [S21].
- **Proteins.** Ribbon spirals unspooling from a bead string, set against Levinthal's 10^300 [S26].
- **Diffusion.** Snowy static resolving into an image over many steps [S33][S34].
- **Lemoine.**
  - Photographed in San Francisco by the Washington Post (per BBC caption) [S38].
  - He had shared a Google Doc titled "Is LaMDA sentient?" with executives in April 2022 [S36].
  - *Visual:* a man alone with a glowing chat window, the words "I am, in fact, a person" (LaMDA output, as published) [S37]. **Frame it as machine text.**
- **Anthropic's beginning.** The verified record is a May 2021 press announcement [S14]; there are no verified office or room details in this pass. **Do not invent a garage or founding-meeting scene.** A neutral image would be a new nameplate or a blank page titled with a mission statement.
- **Sutton's essay.** A plain-HTML web page dated "March 13, 2019" on incompleteideas.net [S3]. Its plainness fits the message.

---

## 11. Sources

1. [S1] Kaplan et al., "Scaling Laws for Neural Language Models", arXiv 2001.08361 (23 Jan 2020). https://arxiv.org/abs/2001.08361 · PDF https://arxiv.org/pdf/2001.08361
2. [S2] Brown et al., "Language Models are Few-Shot Learners", arXiv 2005.14165 (28 May 2020). https://arxiv.org/abs/2005.14165 · PDF https://arxiv.org/pdf/2005.14165
3. [S3] Rich Sutton, "The Bitter Lesson" (13 Mar 2019). http://www.incompleteideas.net/IncIdeas/BitterLesson.html
4. [S4] Gwern Branwen, "The Scaling Hypothesis" (2020-05-28 to 2022-01-02). https://gwern.net/scaling-hypothesis
5. [S5] Hoffmann et al., "Training Compute-Optimal Large Language Models", arXiv 2203.15556 (29 Mar 2022). https://arxiv.org/abs/2203.15556 · PDF https://arxiv.org/pdf/2203.15556
6. [S6] Bender & Koller, "Climbing towards NLU: On Meaning, Form, and Understanding in the Age of Data", ACL 2020. https://aclanthology.org/2020.acl-main.463.pdf
7. [S7] Bender, Gebru, McMillan-Major, Shmitchell, "On the Dangers of Stochastic Parrots: Can Language Models Be Too Big?", FAccT '21, doi 10.1145/3442188.3445922. https://dl.acm.org/doi/10.1145/3442188.3445922 · text read from mirror https://s10251.pcdn.co/pdf/2021-bender-parrots.pdf
8. [S8] Karen Hao, "We read the paper that forced Timnit Gebru out of Google. Here's what it says", MIT Technology Review, 4 Dec 2020. https://www.technologyreview.com/2020/12/04/1013294/google-ai-ethics-research-paper-forced-out-timnit-gebru/
9. [S9] Zoë Schiffer, "Google fires second AI ethics researcher following internal investigation", The Verge, 19 Feb 2021. https://www.theverge.com/2021/2/19/22292011/google-second-ethical-ai-researcher-fired
10. [S10] Gary Marcus, "Deep Learning Is Hitting a Wall", Nautilus, 10 Mar 2022. https://nautil.us/deep-learning-is-hitting-a-wall-238440/
11. [S11] Christiano et al., "Deep reinforcement learning from human preferences", arXiv 1706.03741 (12 Jun 2017). https://arxiv.org/abs/1706.03741
12. [S12] Stiennon et al., "Learning to summarize from human feedback", arXiv 2009.01325 (2 Sep 2020). https://arxiv.org/abs/2009.01325
13. [S13] Ouyang et al., "Training language models to follow instructions with human feedback", arXiv 2203.02155 (4 Mar 2022). https://arxiv.org/abs/2203.02155
14. [S14] Anthropic, "Anthropic raises $124 million to build more reliable, general AI systems" (28 May 2021). https://www.anthropic.com/news/anthropic-raises-124-million-to-build-more-reliable-general-ai-systems
15. [S15] Wikipedia, "Anthropic" (retrieved 2026-10-05; infobox "Founded January 26, 2021", citing OpenCorporates). https://en.wikipedia.org/wiki/Anthropic
16. [S16] Wikipedia, "Dario Amodei" (retrieved 2026-10-05). https://en.wikipedia.org/wiki/Dario_Amodei
17. [S17] Anthropic, "The Long-Term Benefit Trust" (19 Sep 2023). https://www.anthropic.com/news/the-long-term-benefit-trust
18. [S18] Askell et al., "A General Language Assistant as a Laboratory for Alignment", arXiv 2112.00861 (1 Dec 2021). https://arxiv.org/abs/2112.00861
19. [S19] Bai et al., "Training a Helpful and Harmless Assistant with Reinforcement Learning from Human Feedback", arXiv 2204.05862 (12 Apr 2022). https://arxiv.org/abs/2204.05862
20. [S20] Anthropic, hh-rlhf dataset README. https://github.com/anthropics/hh-rlhf · https://huggingface.co/datasets/Anthropic/hh-rlhf
21. [S21] Bai et al., "Constitutional AI: Harmlessness from AI Feedback", arXiv 2212.08073 (15 Dec 2022). https://arxiv.org/abs/2212.08073
22. [S22] Wei et al., "Emergent Abilities of Large Language Models", arXiv 2206.07682 (15 Jun 2022; TMLR 08/2022). https://arxiv.org/abs/2206.07682
23. [S23] Jason Wei, "137 emergent abilities of large language models" (blog, Nov 14). https://www.jasonwei.net/blog/emergence
24. [S24] Schaeffer, Miranda, Koyejo, "Are Emergent Abilities of Large Language Models a Mirage?", arXiv 2304.15004 (28 Apr 2023). https://arxiv.org/abs/2304.15004
25. [S25] NeurIPS Blog, "Announcing the NeurIPS 2023 Paper Awards" (11 Dec 2023). https://blog.neurips.cc/2023/12/11/announcing-the-neurips-2023-paper-awards/
26. [S26] DeepMind, "AlphaFold: a solution to a 50-year-old grand challenge in biology" (30 Nov 2020). https://deepmind.google/discover/blog/alphafold-a-solution-to-a-50-year-old-grand-challenge-in-biology/
27. [S27] Jumper et al., "Highly accurate protein structure prediction with AlphaFold", Nature 596, 583–589 (published 15 Jul 2021). https://www.nature.com/articles/s41586-021-03819-2
28. [S28] Nobel Prize in Chemistry 2024, press release (9 Oct 2024). https://www.nobelprize.org/prizes/chemistry/2024/press-release/
29. [S29] Touvron et al., "LLaMA: Open and Efficient Foundation Language Models", arXiv 2302.13971 (27 Feb 2023). https://arxiv.org/abs/2302.13971
30. [S30] Besiroglu, Erdil, Barnett, You, "Chinchilla Scaling: A replication attempt", arXiv 2404.10102 (15 Apr 2024). https://arxiv.org/abs/2404.10102
31. [S31] OpenAI, "DALL·E: Creating Images from Text" (5 Jan 2021). https://openai.com/index/dall-e/ (403); read via Internet Archive: https://web.archive.org/web/20210106233019/https://openai.com/blog/dall-e/
32. [S32] Ramesh et al., "Zero-Shot Text-to-Image Generation", arXiv 2102.12092 (24 Feb 2021). https://arxiv.org/abs/2102.12092 · Wikipedia "DALL-E" (12B parameters) https://en.wikipedia.org/wiki/DALL-E
33. [S33] Ho, Jain, Abbeel, "Denoising Diffusion Probabilistic Models", arXiv 2006.11239 (19 Jun 2020). https://arxiv.org/abs/2006.11239
34. [S34] Rombach et al., "High-Resolution Image Synthesis with Latent Diffusion Models", arXiv 2112.10752 (20 Dec 2021). https://arxiv.org/abs/2112.10752
35. [S35] Ramesh et al., "Hierarchical Text-Conditional Image Generation with CLIP Latents", arXiv 2204.06125 (13 Apr 2022). https://arxiv.org/abs/2204.06125
36. [S36] The Guardian, "Google engineer put on leave after saying AI chatbot has become sentient" (12 Jun 2022), quoting the Washington Post. https://www.theguardian.com/technology/2022/jun/12/google-engineer-ai-bot-sentient-blake-lemoine · original WaPo (paywalled, 403): https://www.washingtonpost.com/technology/2022/06/11/google-ai-lamda-blake-lemoine/
37. [S37] BBC News, "Google engineer says Lamda AI system may have its own feelings" (June 2022). https://www.bbc.com/news/technology-61784011
38. [S38] BBC News, Tiffany Wertheimer, "Blake Lemoine: Google fires engineer who said AI tech has feelings" (23 Jul 2022). https://www.bbc.com/news/technology-62275326
39. [S39] Amodei et al., "Concrete Problems in AI Safety", arXiv 1606.06565 (21 Jun 2016). https://arxiv.org/abs/1606.06565
40. [S40] The Guardian / GPT-3, "A robot wrote this entire article. Are you scared yet, human?" (8 Sep 2020), with editor's note. https://www.theguardian.com/commentisfree/2020/sep/08/robot-wrote-this-article-gpt-3
41. [S41] Wikipedia, "Timnit Gebru" (retrieved 2026-10-05). https://en.wikipedia.org/wiki/Timnit_Gebru · NYT, Cade Metz, 3 Dec 2020 (cited there): https://www.nytimes.com/2020/12/03/technology/google-researcher-timnit-gebru.html
42. [S42] OpenAI, "Organizational Update from OpenAI" (29 Dec 2020). https://openai.com/index/organizational-update/ (403); read via Internet Archive: https://web.archive.org/web/20220101125521/https://openai.com/blog/organizational-update/
43. [S43] Thoppilan et al., "LaMDA: Language Models for Dialog Applications", arXiv 2201.08239 (20 Jan 2022). https://arxiv.org/abs/2201.08239
44. [S44] Wei et al., "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models", arXiv 2201.11903 (28 Jan 2022). https://arxiv.org/abs/2201.11903
45. [S45] Wikipedia, "Stable Diffusion" (released 22 Aug 2022). https://en.wikipedia.org/wiki/Stable_Diffusion
46. [S46] Ganguli et al., "Red Teaming Language Models to Reduce Harms", arXiv 2209.07858 (23 Aug 2022). https://arxiv.org/abs/2209.07858
47. [S47] Wikipedia, "Richard S. Sutton" (Turing Award 2024; University of Alberta; DeepMind 2017–2023). https://en.wikipedia.org/wiki/Richard_S._Sutton
48. [S48] Wikipedia, "Daniela Amodei". https://en.wikipedia.org/wiki/Daniela_Amodei
49. [S49] Wikipedia, "Margaret Mitchell (scientist)" (pseudonym link; five-week investigation; Hugging Face). https://en.wikipedia.org/wiki/Margaret_Mitchell_(scientist)
50. [S50] Wikipedia, "AlphaFold" (CASP14 Nov 2020; Nature 15 Jul 2021; mechanism unsolved). https://en.wikipedia.org/wiki/AlphaFold
51. [S51] Wikipedia, "Emily M. Bender" (paper title with 🦜). https://en.wikipedia.org/wiki/Emily_M._Bender
52. [S52] Noor Al-Sibai, "OpenAI Chief Scientist Says Advanced AI May Already Be Conscious", Futurism (Feb 2022). https://futurism.com/the-byte/openai-already-sentient
53. [S53] Wikipedia, "LaMDA", section "Sentience claims" (retrieved 2026-10-05). https://en.wikipedia.org/wiki/LaMDA

---

## 12. Verification log (2026-10-05)

- **arXiv abstracts:** S1, S2, S5, S11–S13, S18, S19, S21, S22, S24, S29, S30, S32–S35, S39, S43, S44 and S46 were pulled verbatim via export.arxiv.org.
- **Full PDFs text-searched:** S1, S2, S5, S11, S12, S13, S21, S22 and S24. Numbers in sections 1 and 5 come from these.
- **Stochastic Parrots full text** was read from a public PDF mirror (S7); the ACM page returned 403. The "stochastic parrot" sentence was confirmed verbatim (it is split across a page break in the PDF).
- **Octopus paper** full text read from the ACL Anthology (S6).
- **Sutton essay** fetched directly (S3); all Sutton quotes are verbatim.
- **Blocked (403/Cloudflare):** openai.com (DALL·E blog, organisational update), washingtonpost.com, medium.com (Lemoine's transcript), acm.org (Turing Award). Items depending only on these are marked UNVERIFIED or VERIFIED-SECONDARY.
- GPT-3's architecture (96 layers, d_model 12,288, context 2,048) and the ~200-word article length were confirmed from the PDF text (Table 2.1, Section 3.9.4).

---

## 13. Fact-check log (adversarial pass, 2026-10-05)

**Method.** The checker downloaded the full PDFs again and text-searched them: Kaplan, GPT-3, Chinchilla, Christiano 2017, Stiennon, InstructGPT, Constitutional AI, Wei (emergence), Schaeffer, Besiroglu, Bender & Koller, and Stochastic Parrots. All arXiv dates and author counts were re-pulled from the arXiv API. These pages were fetched directly: Sutton's essay, the Anthropic Series A and Long-Term Benefit Trust posts, MIT Technology Review, The Verge, Nautilus, the Guardian (Lemoine article and GPT-3 op-ed), both BBC Lemoine articles, the DeepMind AlphaFold blog, Nature (Jumper 2021), the Nobel press release, Jason Wei's blog, and the NeurIPS 2023 awards blog. Wikipedia was read as raw wikitext. The Internet Archive was used for openai.com.

**Confirmed verbatim (no change):**
- The Sutton quotes (5).
- The Kaplan quotes and numbers: seven orders of magnitude; 0.73 / 0.27; N = 1.3×10⁹ · C^0.73; the Johns Hopkins affiliation.
- The GPT-3 quotes and numbers: "10x more than any previous non-sparse"; 300B tokens; 3.14E+23 FLOPs (3.64E+03 PF-days); V100 / Microsoft cluster; 45TB→570GB; 3.4 epochs; 52% / 86% / 12%; 31 authors.
- Chinchilla: over 400 models; 70M–16B; 5–500B tokens; "every doubling"; "significantly undertrained"; 5.5× / 1.8×; 4.68B / 2.86B against 4.74B / 2.80B; 67.5% MMLU; Jurassic-1 (178B); MT-NLG 530B; 175B→3.7T tokens; TPUv3/TPUv4; 22 authors; "the field has been training larger and larger models, expecting performance improvements".
- Besiroglu: "implausibly narrow confidence intervals"; the re-fit is compatible with Approaches 1 and 2.
- Christiano: 900 queries in less than an hour; 700 labels; "First play the game yourself for 5 minutes"; contractors "unfamiliar with the environments".
- Stiennon: "over 64k summary comparisons"; "PC is the team lead".
- InstructGPT: about 40 contractors via Upwork / Scale AI; 100x fewer parameters; 85 ± 3% and 71 ± 4%; 72.6% agreement ("about 73%"); US / Southeast Asia; 20 authors; Christiano at ARC.
- Constitutional AI: 51 authors; 16 principles, "quite similar"; "harmless but non-evasive"; RLAIF; the abstract quotes.
- Wei: the definition; 2·10²² FLOPs (13B) / 10²³ FLOPs (68B); the blog's 137 / 67 / 51 and "Nov 14".
- Schaeffer: "evaporate ..."; >92%; NeurIPS 2023 Outstanding Main Track Paper.
- Bender & Koller: all quotes; "sufficiently sensitive test"; the coconut catapult; the bear; Saarland.
- Parrots: the "stochastic parrot" sentence; "How big is too big?"; FAccT 3–10 March 2021, Virtual Event, Canada; the "Shmargaret Shmitchell, The Aether" byline.
- Gebru / Mitchell: Gebru's announcement on the evening of Wednesday 2 Dec 2020; Dean's "didn't meet our bar for publication"; 1,400 + 1,900 signatories; "a last date"; Google's Axios statement; Dean's apology quote; Kacholia; Croak; Mitchell joined Google in 2016 and co-founded the team two years later.
- Marcus: the quote and the date 10 March 2022.
- Lemoine: the quotes; aged 41; paid leave; the "Is LaMDA sentient?" Google Doc; the BBC Gabriel / Brynjolfsson / Melanie Mitchell / LaMDA quotes; Google's "regrettable ..." and "wholly unfounded"; the firing on 22 July 2022 (BBC: confirmed "on Friday"; Wikipedia: "On July 22").
- AlphaFold: 92.4 GDT; ~1.6 Å; 87.0 free modelling; Moult's quote; 10^300; CASP founded in 1994; Nature published 15 Jul 2021; 128 TPU v3 cores; PDB cutoff 30 Apr 2018; ~1 week + ~4 days.
- Nobel: one half to Baker, the other half jointly to Hassabis and Jumper; 200 million proteins; two million users in 190 countries.
- Anthropic: the Series A quotes; Tallinn; CEO / President; "steerable, interpretable, and robust"; "computationally-intensive research"; the Delaware PBC purpose quote in the 19 Sep 2023 Long-Term Benefit Trust post; Wikipedia's founded date of 26 Jan 2021; Dario's title (VP of Research) and Daniela's (VP of Safety and Policy).
- Image models: LLaMA-13B beats GPT-3 (175B) on most benchmarks; DDPM FID 3.17; latent diffusion arXiv 20 Dec 2021; DALL·E 2 arXiv 13 Apr 2022 (announced 6 Apr 2022, per Wikipedia); Stable Diffusion released 22 Aug 2022 (Wikipedia).
- Other: the Guardian op-ed (8 Sep 2020, eight outputs, "rearranged"); Gwern's strong-scaling-hypothesis quote and dates; Mensch co-founded Mistral AI (Wikipedia; now VERIFIED-SECONDARY).

**Changes made:**
1. **Hook 2, "The best-disguised article fooled 88% of readers": corrected.** GPT-3's accuracy is "the ratio of correct assignments to non-neutral assignments", so 12% accuracy does not mean 88% of readers were fooled. The hook now says accuracy was 12%. Source: arXiv 2005.14165, Table 3.11 and Figure 3.14.
2. **Section 1: "Google pushed out Gebru" was stated as fact: marked contested and attributed** (Gebru: fired; Google: resignation accepted). Sources: MIT TR [S8]; Wikipedia [S41].
3. **Section 1: Gwern "named the strong form ... the 'scaling hypothesis'": corrected.** He sets out the strong form in an essay of that title; no source shows he coined the phrase. Source: gwern.net/scaling-hypothesis.
4. **Section 1: "One line ... became a slogan": corrected.** The characterisation had no source; the quote itself is verbatim. Source: arXiv 2001.08361.
5. **Section 5.4, Christiano "less than one percent": corrected** to the verbatim "less than 1% of our agent's interactions with the environment". Source: arXiv 1706.03741.
6. **Section 3, Kaplan "corresponding author (jared@anthropic.com)": corrected** to co-corresponding with Yuntao Bai, "{yuntao,jared}@anthropic.com". Source: arXiv 2212.08073.
7. **Section 4, Muennighoff "began to study what happens when the internet's text runs out": corrected.** The paper was a NeurIPS 2023 Outstanding Main Track *Runner-Up*, and the priority claim was removed. Source: NeurIPS blog, 11 Dec 2023.
8. **Section 5.6, AlphaFold training time: marked as a source discrepancy.** Nature (2021) says ~1 week + ~4 days on 128 TPU v3 cores; DeepMind's 30 Nov 2020 blog says ~16 TPUv3s (128 cores) "run over a few weeks". Sources: Nature s41586-021-03819-2; DeepMind blog.
9. **Section 7.6, the cause of Lemoine's firing: marked contested.** Google gives policy violations; Wikipedia's LaMDA article summarises Lemoine as linking his dismissal to hiring an attorney for LaMDA. Sources: BBC [S38]; Wikipedia LaMDA [S53].
10. **Upgrades** (previously UNVERIFIED, now verified):
    - OpenAI's "Organizational Update" (29 Dec 2020: "Dario Amodei, VP of Research, is leaving OpenAI after nearly five years") via the Internet Archive.
    - The DALL·E blog date (5 Jan 2021) and the avocado-armchair prompt via the Internet Archive.
    - Sutskever's "slightly conscious" tweet wording, VERIFIED-SECONDARY via Futurism (Feb 2022).
11. **Section 5.2, minor clarification:** the accuracy definition, the ~80 participants per model, and the ~500-word replication (88% / 52%) were added.

**Still unverifiable (unchanged):**
- The Sam Altman "GPT-3 hype is way too much" tweet.
- The verbatim wording of Gebru's tweets.
- The "10,000 GPUs" figure.
- All silhouette appearance notes.
